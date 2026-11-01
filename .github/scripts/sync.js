// Sync workflow: labels and project fields of an issue that is opened, edited or closed.
const lib = require("./project");

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  const issue = context.payload.issue;
  const issue_number = issue.number;
  const labels = issue.labels.map(l => l.name);

  // 0) Empty Stage or Source: fill them in on the issue (a URL, so also the bookmark, cannot set a dropdown)
  if (context.payload.action !== "closed" && issue.body) {
    // Start from the body as it is now, not from the event: you may have edited it since
    // (writing the event's body back would undo your edit)
    issue.body = (await github.rest.issues.get({ owner, repo, issue_number })).data.body || issue.body;
    let body = issue.body;
    if (!lib.field(body, "Stage")) body = body.replace(/(### Stage\s+)[^\n]+/, "$1Applied");
    if (!lib.field(body, "Source")) body = body.replace(/(### Source\s+)[^\n]+/, `$1${lib.guessSource(body)}`);
    if (body !== issue.body) {
      await github.rest.issues.update({ owner, repo, issue_number, body });
      core.info(`Stage: ${lib.field(body, "Stage")}, Source: ${lib.field(body, "Source")}`);
      issue.body = body;
    }
  }

  // 1) "source: ..." label from the Source dropdown
  const want = lib.SOURCE_LABELS[lib.field(issue.body, "Source")];
  if (want && context.payload.action !== "closed") {
    for (const name of labels) {
      if (name.startsWith("source: ") && name !== want) {
        await github.rest.issues.removeLabel({ owner, repo, issue_number, name });
      }
    }
    if (!labels.includes(want)) {
      await github.rest.issues.addLabels({ owner, repo, issue_number, labels: [want] });
    }
  }

  // 2) "period: ..." label of a new issue: the current job search period (repo variable
  //    CURRENT_PERIOD). It stays until you end it (Actions > End a period). With no current
  //    period, this application starts one, named by the month of its Date (YYYY-MM).
  //    (The import script adds its own label.)
  const action = context.payload.action;
  if (action === "opened" && !labels.includes("imported") && !labels.some(l => l.startsWith("period: "))) {
    const date = lib.field(issue.body, "Date");
    const month = /^\d{4}-\d{2}/.test(date || "") ? date.slice(0, 7) : lib.fmt(new Date(issue.created_at)).slice(0, 7);
    const name = process.env.CURRENT_PERIOD || month;
    const started = !process.env.CURRENT_PERIOD;
    if (started) {
      try {
        await lib.setVariable(getOctokit(process.env.PROJECT_TOKEN), owner, repo, "CURRENT_PERIOD", name);
      } catch (e) { core.warning(`CURRENT_PERIOD not saved (the token needs the repo scope): ${e.message}`); }
    }
    try {
      await github.rest.issues.createLabel({ owner, repo, name: `period: ${name}`, color: lib.config.periodLabelColor,
        description: "Job search period" });
    } catch (e) { if (e.status !== 422) throw e; }  // 422: the label exists
    await github.rest.issues.addLabels({ owner, repo, issue_number, labels: [`period: ${name}`] });
    core.info(`Period: ${name}` + (started ? " (new)" : ""));
    if (started) {
      await github.rest.issues.createComment({ owner, repo, issue_number, body:
        `🆕 A new job search period starts with this application: **${name}**. ` +
        "New applications get it until you end it (**Actions** > **End a period**)." });
    }
  }

  // 3) Project fields (Applied date, Company, ...) and "Last update"
  if (action === "opened" && labels.includes("imported")) return;  // the import script does it
  // Separate client with the token that can write to the project board
  const pat = getOctokit(process.env.PROJECT_TOKEN);
  const project = await lib.getProject(pat, owner, Number(process.env.PROJECT_NUMBER));
  const today = lib.fmt(new Date());

  if (action === "closed" && issue.state_reason === "duplicate") return;  // /moved archives the card
  const itemId = action === "opened" ? null : await lib.findItem(pat, project, issue.node_id);
  if (!itemId) {
    // New issue (or an open one that is not on the board yet): add it as Wishlist or Applied
    if (issue.state !== "open") return;
    const newId = await lib.addItem(pat, project.id, issue.node_id);
    const stage = lib.field(issue.body, "Stage") || "";
    const status = stage.startsWith("Wishlist") ? "Wishlist" : "Applied";
    await lib.setStatus(pat, project, newId, status);
    const values = lib.formValues(issue.body);
    await lib.setFields(pat, project, newId, { ...values, "Last update": values["Applied date"] || today,
      [lib.INTERVIEWS]: lib.NO_INTERVIEW.includes(status) ? 0 : null });
    // The same Job link in another issue: maybe you added this job before (only a warning)
    if (action === "opened") {
      const norm = u => (u || "").trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/#.*$/, "").replace(/\/+$/, "");
      const jobLink = norm(lib.field(issue.body, "Job link"));
      if (jobLink) {
        const all = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: "all", per_page: 100 });
        const same = all.filter(i => i.number !== issue_number && !i.pull_request && norm(lib.field(i.body, "Job link")) === jobLink);
        if (same.length) {
          await github.rest.issues.createComment({ owner, repo, issue_number, body: [
            "Another issue has the same **Job link**:",
            "",
            ...same.map(i => `- #${i.number} (${i.state})`),
            "",
            "If this issue is a duplicate, you can delete it: click **Delete issue** at the bottom of the right sidebar. " +
            "If it is a new application for the same job, keep it.",
          ].join("\n") });
          core.info(`Same Job link as ${same.map(i => "#" + i.number).join(", ")}`);
        }
      }
    }
    // No job description: ask for it now, before the posting is removed
    if (action === "opened" && !lib.field(issue.body, lib.DESCRIPTION)) {
      await github.rest.issues.createComment({ owner, repo, issue_number, body:
        "There is no **Job description / recruiter message**. Postings get removed: " +
        "edit the issue and paste the text of the posting or the message now." });
    }
    // Reminder of the comment commands (see commands.yaml)
    await github.rest.issues.createComment({ owner, repo, issue_number, body: [
      "Added to the board. Write a comment that starts with a command:",
      "",
      "| Command | Result |",
      "| --- | --- |",
      "| `/interview` | Interview notes template. Interviews + 1 on the card |",
      "| `/interview technical` | The same, with the interview type filled in |",
      `| \`/next ${lib.fmt(new Date(Date.now() + 7 * lib.DAY))} email recruiter\` | Plans the next step on that date. Wishlist or Applied → In progress |`,
      "| `/next +7 they will answer` | Plans the next step 7 days from today |",
      "| `/applied` | You applied for a Wishlist job: Status → Applied, Applied date → today |",
      "| `/hold summer vacation` | Status → On hold |",
      "| `/offer` | Status → Offer, with an offer template |",
      "| `/followup +7` | You sent a follow-up email: `followed up` label, Last update → today, check for an answer in 7 days |",
      "| `/period 2026-03` | Moves this application to another job search period |",
      "| `/withdraw not a fit` | You stopped the process: closes the issue, Status → Rejected without interview |",
      "| `/moved #123` | The company moved you to the process in #123: closes this issue as a duplicate |",
      "| `/rejected position filled` | The process stopped: closes the issue, Status → Rejected after / without interview |",
      "",
      "_When something happens in the process, change **Last update** on the card. " +
      "Comments do not change it. Add the `on-pause` label to stop follow-up reminders._",
    ].join("\n") });
    return;
  }
  if (action === "closed") {
    await lib.setFields(pat, project, itemId, { "Last update": today });
    // You closed it: the process stopped. Interviews > 0 -> Rejected after interview, else without
    const status = await lib.reject(pat, project, itemId);
    if (status) core.info(`Status -> ${status}`);
    // A rejection is "not planned" ("completed" is for an offer)
    if (status && issue.state_reason !== "not_planned") {
      await github.rest.issues.update({ owner, repo, issue_number, state: "closed", state_reason: "not_planned" });
    }
  }
  else await lib.setFields(pat, project, itemId, lib.formValues(issue.body));
};
