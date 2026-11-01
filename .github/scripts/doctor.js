// Doctor workflow: checks the setup each day. One "maintenance" issue lists the problems;
// it changes when the problems change, and closes when everything is OK.
const lib = require("./project");
const star = require("./star");

const WARN_DAYS = lib.config.tokenWarnDays;
const TITLE = "The setup needs attention";
const NEW_TOKEN = "https://github.com/settings/tokens/new?scopes=repo,project,workflow&description=job-applications";

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  if (!lib.onTime(context, "doctorTime")) return core.info(`Not now: this cron line is for the other UTC offset of ${lib.config.timezone}.`);
  const problems = [];
  const ok = msg => core.info(`✓ ${msg}`);

  // The repository must be private: the issues are your applications
  const r = (await github.rest.repos.get({ owner, repo })).data;
  if (!r.private) problems.push("**The repository is public.** Everyone can read your applications. " +
    `Make it private: https://github.com/${owner}/${repo}/settings → **Change visibility**.`);
  else ok("repository is private");

  // The token: works, has the scopes, does not expire soon
  let pat = null;
  if (!process.env.PROJECT_TOKEN) {
    problems.push("The secret `PROJECT_TOKEN` is empty.");
  } else {
    try {
      pat = getOctokit(process.env.PROJECT_TOKEN);
      const u = await pat.request("GET /user");
      // Classic tokens: the scopes; tokens with an expiration date: that date
      const scopes = u.headers["x-oauth-scopes"];
      const expires = u.headers["github-authentication-token-expiration"];
      const missing = scopes === undefined ? [] : ["repo", "project"].filter(s => !scopes.split(/,\s*/).includes(s));
      if (missing.length) problems.push(`The token does not have the scope(s) ${missing.map(s => `\`${s}\``).join(", ")} (scopes: ${scopes || "none"}).`);
      if (expires) {
        const days = Math.floor((new Date(expires) - Date.now()) / lib.DAY);
        core.info(`Token expires ${expires} (${days} days)`);
        if (days <= WARN_DAYS) problems.push(`The token expires on ${expires.slice(0, 10)} (in ${Math.max(days, 0)} days).`);
      }
      if (!missing.length) ok("token works");
    } catch (e) {
      pat = null;
      problems.push(`The token does not work (HTTP ${e.status || "error"}: ${e.message}). Maybe it expired.`);
    }
  }
  const tokenProblem = problems.some(p => p.includes("token") || p.includes("PROJECT_TOKEN"));

  // The board: Status options and fields of config.yaml
  if (pat) {
    try {
      const project = await lib.getProject(pat, owner, Number(process.env.PROJECT_NUMBER));
      const options = lib.config.statuses.map(s => s.name).filter(n => !project.options[n]);
      const fields = lib.config.fields.map(f => f.name).filter(n => !project.fieldIds[n]);
      if (options.length) problems.push(`Status options missing on the board: ${options.join(", ")}. Run \`bash scripts/setup.sh\` again.`);
      if (fields.length) problems.push(`Fields missing on the board: ${fields.join(", ")}. Run \`bash scripts/setup.sh\` again.`);
      if (!options.length && !fields.length) ok("board matches config.yaml");
    } catch (e) {
      problems.push(`The project board ${process.env.PROJECT_NUMBER} cannot be read (${e.message}). Check the variable \`PROJECT_NUMBER\`.`);
    }
  }

  // On the 7th day of the copy: the "Enjoying Horizon?" issue
  await star.dayReminder({ github, pat, owner, repo, core }, r.created_at);

  // Variables, labels, workflows
  // (No CURRENT_PERIOD is fine: the next application starts a period)
  ok(`period ${process.env.CURRENT_PERIOD || "(none: the next application starts one)"}`);
  const have = new Set((await github.paginate(github.rest.issues.listLabelsForRepo, { owner, repo, per_page: 100 })).map(l => l.name));
  const labels = [...lib.config.labels.map(l => l.name), ...lib.config.sources.map(s => s.label)]
    .filter(n => !have.has(n) && !lib.ON_DEMAND_LABELS.includes(n));
  if (labels.length) problems.push(`Labels missing: ${labels.map(l => `\`${l}\``).join(", ")}. Run \`bash scripts/setup.sh\` again.`);
  else ok("labels");
  const off = (await github.paginate(github.rest.actions.listRepoWorkflows, { owner, repo, per_page: 100 }))
    .filter(w => w.state !== "active");
  if (off.length) problems.push(`Workflows turned off: ${off.map(w => w.name).join(", ")}. Turn them on in **Actions**.`);
  else ok("workflows on");

  const open = (await github.paginate(github.rest.issues.listForRepo,
    { owner, repo, state: "open", labels: "maintenance", per_page: 100 }));
  const mine = open.filter(i => i.title === TITLE);
  if (!problems.length) {
    core.info("All OK");
    for (const i of mine) {
      await github.rest.issues.createComment({ owner, repo, issue_number: i.number, body: "Everything is OK now." });
      await github.rest.issues.update({ owner, repo, issue_number: i.number, state: "closed" });
    }
    return;
  }
  problems.forEach(p => core.warning(p));
  const body = [
    `@${owner} the daily check found ${problems.length} problem(s):`,
    "",
    ...problems.map(p => `- [ ] ${p}`),
    ...(tokenProblem ? ["", "**New token:** make one at " + NEW_TOKEN + ", then save it:", "",
      "```bash", `gh secret set PROJECT_TOKEN -R ${owner}/${repo}`, "```"] : []),
    "",
    "The check runs each morning and closes this issue when everything is OK. To check now: **Actions** > **Doctor** > **Run workflow**.",
  ].join("\n");
  if (mine.length) {
    // Already told you: change the list only when it changes (no new notification otherwise)
    if (mine[0].body !== body) await github.rest.issues.update({ owner, repo, issue_number: mine[0].number, body });
    return;
  }
  const l = lib.config.labels.find(l => l.name === "maintenance");
  try {
    await github.rest.issues.createLabel({ owner, repo, name: l.name, color: l.color, description: l.description });
  } catch (e) { if (e.status !== 422) throw e; }  // 422: the label exists
  await github.rest.issues.create({ owner, repo, title: TITLE, labels: ["maintenance"], body });
};
