// Welcome workflow: in a new copy of the template (not set up yet), an issue with the steps of
// the setup in the browser. The Setup workflow writes the bookmark into it and closes it.
const lib = require("./project");

const TITLE = "Finish the setup";
const TOKEN_LINK = "https://github.com/settings/tokens/new?scopes=repo,project,workflow&description=job-applications";

module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const open = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: "open", per_page: 100 });
  if (open.some(i => i.title === TITLE)) return core.info("The setup issue is already open");
  const visibility = (await github.rest.repos.get({ owner, repo })).data.private ? "private" : "public";
  const l = lib.config.labels.find(l => l.name === "setup");
  try {
    await github.rest.issues.createLabel({ owner, repo, name: l.name, color: l.color, description: l.description });
  } catch (e) { if (e.status !== 422) throw e; }  // 422: the label exists
  const base = `https://github.com/${owner}/${repo}`;
  const body = [
    ...(visibility === "public" ? [
      "> [!CAUTION]",
      `> **This repository is public.** Your applications will be issues here, so everyone could read them. ` +
      `Make it private first: [Settings](${base}/settings) > **Change visibility** > **Make private**.`, ""] : []),
    `@${owner} welcome! Three steps to finish the setup:`,
    "",
    `- [ ] **Make a token** so the workflows can update your board: [open this link](${TOKEN_LINK}), ` +
      "pick an expiration (90 days is fine, you get a reminder before it expires), click **Generate token**, and copy it.",
    `- [ ] **Save it** as a [new repository secret](${base}/settings/secrets/actions/new) ` +
      "called `PROJECT_TOKEN`.",
    `- [ ] **Run the setup**: [Actions > Setup](${base}/actions/workflows/setup.yaml) > **Run workflow**. ` +
      "The fields show the default settings. Change what you want, for example your city and time zone, and click **Run workflow**.",
    "",
    "The setup creates the labels and the project board. Then it opens two short issues for the last steps (the board views and the bookmark) and closes this one.",
    "",
    "Prefer the terminal? Clone this repository and run `bash scripts/setup.sh` (needs `gh` and `git`).",
  ].join("\n");
  await github.rest.issues.create({ owner, repo, title: TITLE, labels: ["setup"], body });
  core.info(`Opened "${TITLE}" (${visibility} repository)`);
};
module.exports.TITLE = TITLE;
