// Comment commands workflow: /interview, /next, /applied, /hold, /offer, /followedup, /withdraw, /period, /moved, /rejected.
// Your comment becomes the comment of templates/comments/COMMAND.md (see comments.js).
const lib = require("./project");
const { comment, notes } = require("./comments");

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  const c = context.payload.comment;
  const text = c.body.trim();
  const firstLine = text.split("\n")[0];
  const rest = text.split("\n").slice(1).join("\n").trim();
  let body = null;
  let nextDate = null;
  let interview = false;
  let m;
  // The card of this issue, with the token that can write to the project board
  let board = null;
  const card = async () => {
    if (!board) {
      const pat = getOctokit(process.env.PROJECT_TOKEN);
      const project = await lib.getProject(pat, owner, Number(process.env.PROJECT_NUMBER));
      board = { pat, project, itemId: await lib.findItem(pat, project, context.payload.issue.node_id) };
    }
    return board;
  };
  const warn = msg => github.rest.issues.updateComment({ owner, repo, comment_id: c.id, body: `${text}\n\n> ${msg}` });

  if ((m = firstLine.match(/^\/interview\b[ \t]*(.*)$/))) {
    interview = true;
    body = comment("interview", { date: lib.fmt(new Date()), type: m[1], notes: rest });
  } else if ((m = firstLine.match(/^\/next[ \t]+(\S+)[ \t]*(.*)$/))) {
    let d = null;
    if (/^\+\d+$/.test(m[1])) d = new Date(Date.now() + Number(m[1].slice(1)) * 864e5);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(m[1])) d = new Date(m[1] + "T00:00:00Z");
    if (!d || isNaN(d)) {
      body = text + "\n\n> Use `/next YYYY-MM-DD what` or `/next +7 what`";
    } else {
      nextDate = lib.fmt(d);
      body = comment("next", { date: nextDate, what: m[2], notes: rest });
    }
  }
  if (body) await github.rest.issues.updateComment({ owner, repo, comment_id: c.id, body });

  // The next step is the next event of the process: "Last update" moves to its date,
  // and a process that has not started yet (Wishlist, Applied) is now In progress
  if (nextDate) {
    // Separate client with the token that can write to the project board
    const pat = getOctokit(process.env.PROJECT_TOKEN);
    const project = await lib.getProject(pat, owner, Number(process.env.PROJECT_NUMBER));
    const itemId = await lib.setIssueFields(pat, project, owner, repo, context.issue.number,
      { "Last update": nextDate });
    core.info(itemId ? `Last update set to ${nextDate}` : "Issue is not on the board");
    const status = itemId && (await lib.getCard(pat, itemId)).status;
    if (lib.NOT_STARTED.includes(status)) {
      await lib.setStatus(pat, project, itemId, "In progress");
      core.info(`Status ${status} -> In progress`);
    }
  }

  // You had an interview: Interviews + 1 on the card
  if (interview) {
    const { pat, project, itemId } = await card();
    if (itemId) {
      const n = ((await lib.getCard(pat, itemId)).interviews || 0) + 1;
      await lib.setFields(pat, project, itemId, { [lib.INTERVIEWS]: n });
      core.info(`Interviews -> ${n}`);
    } else core.info("Issue is not on the board");
  }

  // /applied, /hold, /offer: the status changes, and "Last update" is today (or the date of /applied)
  if ((m = firstLine.match(/^\/(applied|hold|offer)\b[ \t]*(.*)$/))) {
    const cmd = m[1];
    let why = m[2].trim();
    const { pat, project, itemId } = await card();
    if (!itemId) return warn("This issue is not on the board.");
    const before = (await lib.getCard(pat, itemId)).status;
    const allowed = { applied: ["Wishlist"], hold: ["Applied", "In progress", "Offer"], offer: ["Applied", "In progress", "On hold"] };
    if (!allowed[cmd].includes(before)) {
      return warn(`\`/${cmd}\` works when the status is ${allowed[cmd].join(", ")}. The status is ${before || "empty"}.`);
    }
    let date = lib.fmt(new Date());
    if (cmd === "applied") {
      // "/applied 2026-10-20": the date you applied
      const d = why.match(/^(\d{4}-\d{2}-\d{2})\b[ \t]*(.*)$/);
      if (d) [date, why] = [d[1], d[2]];
      // The form says Applied now, so a later edit of the issue keeps these values (see sync.js)
      const issue = context.payload.issue;
      const newBody = issue.body
        .replace(/(### Stage\s+)[^\n]+/, "$1Applied")
        .replace(/(### Date\s+)[^\n]+/, `$1${date}`);
      await github.rest.issues.update({ owner, repo, issue_number: issue.number, body: newBody });
      await lib.setFields(pat, project, itemId, { "Applied date": date, [lib.INTERVIEWS]: 0 });
    }
    const status = { applied: "Applied", hold: "On hold", offer: "Offer" }[cmd];
    await lib.setStatus(pat, project, itemId, status);
    await lib.setFields(pat, project, itemId, { "Last update": date });
    core.info(`Status ${before} -> ${status}, Last update ${date}`);
    await github.rest.issues.updateComment({ owner, repo, comment_id: c.id,
      body: comment(cmd, { date, before, status, notes: notes(why, rest) }) });
  }

  // /followedup [+7 | YYYY-MM-DD] [notes]: you sent a follow-up email. "followed up" label,
  // Last update today (the follow-up reminders start again), and the date to check for an answer
  if ((m = firstLine.match(/^\/followedup\b[ \t]*(.*)$/))) {
    let [, args] = m;
    let check = null;
    const d = args.match(/^(\+\d+|\d{4}-\d{2}-\d{2})\b[ \t]*(.*)$/);
    if (d) {
      check = d[1].startsWith("+") ? new Date(Date.now() + Number(d[1].slice(1)) * lib.DAY) : new Date(d[1] + "T00:00:00Z");
      if (isNaN(check)) return warn("Use `/followedup`, `/followedup +7`, or `/followedup YYYY-MM-DD`.");
      args = d[2];
    }
    const { pat, project, itemId } = await card();
    if (!itemId) return warn("This issue is not on the board.");
    const today = lib.fmt(new Date());
    await github.rest.issues.addLabels({ owner, repo, issue_number: context.issue.number, labels: ["followed up"] });
    await lib.setFields(pat, project, itemId, { "Last update": today });
    core.info(`Followed up, Last update ${today}` + (check ? `, check ${lib.fmt(check)}` : ""));
    await github.rest.issues.updateComment({ owner, repo, comment_id: c.id,
      body: comment("followedup", { date: today, check: check && lib.fmt(check), notes: notes(args, rest) }) });
  }

  // /withdraw [why]: you stopped the process. "withdrawn interest" label,
  // Status Rejected without interview, Last update today, and the issue is closed
  if ((m = firstLine.match(/^\/withdraw\b[ \t]*(.*)$/))) {
    const why = m[1].trim();
    const { pat, project, itemId } = await card();
    if (!itemId) return warn("This issue is not on the board.");
    const before = (await lib.getCard(pat, itemId)).status;
    if (!lib.OPEN_PROCESS.includes(before)) {
      return warn(`\`/withdraw\` works when the status is ${lib.OPEN_PROCESS.join(", ")}. The status is ${before || "empty"}.`);
    }
    const today = lib.fmt(new Date());
    await github.rest.issues.addLabels({ owner, repo, issue_number: context.issue.number, labels: [lib.WITHDRAWN] });
    await lib.setStatus(pat, project, itemId, "Rejected without interview");
    await lib.setFields(pat, project, itemId, { "Last update": today });
    core.info(`Status ${before} -> Rejected without interview (withdrawn)`);
    await github.rest.issues.updateComment({ owner, repo, comment_id: c.id,
      body: comment("withdraw", { date: today, before, status: "Rejected without interview", notes: notes(why, rest) }) });
    // Closing with this token does not run sync.yaml: the status stays
    await github.rest.issues.update({ owner, repo, issue_number: context.issue.number,
      state: "closed", state_reason: "not_planned" });
  }

  // /period NAME: moves this application to the period NAME (the current period stays:
  // to end it, run Actions > End a period)
  if ((m = firstLine.match(/^\/period\b[ \t]*(.*)$/))) {
    const name = m[1].trim().replace(/^period:\s*/, "");
    if (!/^[\w.-]+$/.test(name)) return warn("Use `/period NAME`, for example `/period 2026` (letters, numbers, `-`, `.`, `_`).");
    const issue = context.payload.issue;
    for (const l of issue.labels.map(l => l.name).filter(l => l.startsWith("period: ") && l !== `period: ${name}`)) {
      await github.rest.issues.removeLabel({ owner, repo, issue_number: issue.number, name: l });
    }
    try {
      await github.rest.issues.createLabel({ owner, repo, name: `period: ${name}`, color: lib.config.periodLabelColor,
        description: "Job search period" });
    } catch (e) { if (e.status !== 422) throw e; }  // 422: the label exists
    await github.rest.issues.addLabels({ owner, repo, issue_number: issue.number, labels: [`period: ${name}`] });
    core.info(`Moved to period ${name}`);
    await github.rest.issues.updateComment({ owner, repo, comment_id: c.id,
      body: comment("period", { period: name, notes: rest }) });
  }

  if ((m = firstLine.match(/^\/moved[ \t]+#?(\d+)\b/))) {
    const from = context.payload.issue;
    const to = (await github.rest.issues.get({ owner, repo, issue_number: Number(m[1]) })).data;
    if (to.number === from.number) {
      await github.rest.issues.updateComment({ owner, repo, comment_id: c.id,
        body: text + "\n\n> Use the number of the other issue: `/moved #123`" });
      return;
    }
    await github.rest.issues.updateComment({ owner, repo, comment_id: c.id,
      body: comment("moved", { to: to.number, notes: rest }) });
    await github.rest.issues.addLabels({ owner, repo, issue_number: from.number, labels: ["redirected"] });
    await github.graphql(`mutation($i:ID!, $d:ID!) {
      closeIssue(input:{issueId:$i, stateReason:DUPLICATE, duplicateIssueId:$d}) { clientMutationId } }`,
      { i: from.node_id, d: to.node_id });
    await github.rest.issues.createComment({ owner, repo, issue_number: to.number,
      body: comment("moved-to", { from: from.number }) });
    // Off the board: it is not a process of its own
    const pat = getOctokit(process.env.PROJECT_TOKEN);
    const project = await lib.getProject(pat, owner, Number(process.env.PROJECT_NUMBER));
    const itemId = await lib.findItem(pat, project, from.node_id);
    if (itemId) await lib.archiveItem(pat, project, itemId);
  }

  // Closing with this token does not run sync.yaml, so do its "closed" part here too
  if (/^\/rejected\b/.test(firstLine)) {
    const why = firstLine.replace(/^\/rejected\b/, "").trim();
    const pat = getOctokit(process.env.PROJECT_TOKEN);
    const project = await lib.getProject(pat, owner, Number(process.env.PROJECT_NUMBER));
    const itemId = await lib.findItem(pat, project, context.payload.issue.node_id);
    const status = itemId && await lib.reject(pat, project, itemId);
    if (itemId) await lib.setFields(pat, project, itemId, { "Last update": lib.fmt(new Date()) });
    await github.rest.issues.updateComment({ owner, repo, comment_id: c.id,
      body: comment("rejected", { date: lib.fmt(new Date()), status, notes: notes(why, rest) }) });
    await github.rest.issues.update({ owner, repo, issue_number: context.issue.number,
      state: "closed", state_reason: "not_planned" });
  }
};
