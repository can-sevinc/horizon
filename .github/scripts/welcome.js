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
  const l = lib.config.labels.find(l => l.name === "maintenance");
  try {
    await github.rest.issues.createLabel({ owner, repo, name: l.name, color: l.color, description: l.description });
  } catch (e) { if (e.status !== 422) throw e; }  // 422: the label exists
  const base = `https://github.com/${owner}/${repo}`;
  const body = [
    ...(visibility === "public" ? [
      "> [!CAUTION]",
      `> **This repository is public.** Your applications will be issues here, so everyone could read them. ` +
      `Make it private first: [Settings](${base}/settings) > **Change visibility** > **Make private**.`, ""] : []),
    `@${owner} welcome! Three steps, all in the browser:`,
    "",
    `- [ ] **Make a token**, so the workflows can change your project board: [open this link](${TOKEN_LINK}), ` +
      "choose an expiration (for example 90 days; the daily check reminds you before it expires), click **Generate token**, and copy it.",
    `- [ ] **Save the token** as a secret: [New repository secret](${base}/settings/secrets/actions/new), ` +
      "name `PROJECT_TOKEN`, paste the token, click **Add secret**.",
    `- [ ] **Run the setup**: [Actions > Setup](${base}/actions/workflows/setup.yaml) > **Run workflow**. ` +
      "Fill in your time zone, the default City, and the other fields (empty: the value in `config.yaml`), then click **Run workflow**.",
    "",
    "The setup makes the labels and the project board. When it is done, it writes the bookmark and the last steps here, and closes this issue.",
    "",
    "On your computer instead? Clone this repository and run `bash scripts/setup.sh` (it needs `gh` and `git`).",
  ].join("\n");
  await github.rest.issues.create({ owner, repo, title: TITLE, labels: ["maintenance"], body });
  core.info(`Opened "${TITLE}" (${visibility} repository)`);
};
module.exports.TITLE = TITLE;
