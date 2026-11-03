// Welcome workflow: in a new copy of the template (not set up yet), an issue with the steps of
// the setup in the browser. The Setup workflow writes the bookmark into it and closes it.
const fs = require("fs");
const path = require("path");
const lib = require("./project");
const render = require("./render");

const ROOT = path.join(__dirname, "../..");

const TITLE = "Finish the setup";
const TOKEN_LINK = "https://github.com/settings/tokens/new?scopes=repo,project,workflow&description=job-applications";

module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  await makeCopy(github, owner, repo, core);
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
      "The fields show the default settings. Change what you want, for example your city and time zone, and click **Run workflow**. " +
      "**COUNT THIS COPY** only adds 1 to Horizon's public install counter, once. Untick it if you prefer.",
    "",
    "The setup creates the labels and the project board. Then it opens two short issues for the last steps (the board views and the bookmark) and closes this one.",
    "",
    "Prefer the terminal? Clone this repository and run `bash scripts/setup.sh` (needs `gh` and `git`).",
  ].join("\n");
  await github.rest.issues.create({ owner, repo, title: TITLE, labels: ["setup"], body });
  core.info(`Opened "${TITLE}" (${visibility} repository)`);
};

// A new copy: the README of Horizon is for people who don't use it yet, so the copy gets
// templates/README.md, and the files only for Horizon go. { path: text, or null to delete }
function copyChanges(root, repo) {
  if (!fs.readFileSync(path.join(root, "README.md"), "utf8").includes(render.PITCH)) return {};
  const assets = require("./config").parse(fs.readFileSync(path.join(root, "config.yaml"), "utf8")).assetsUrl;
  const changes = { "README.md": render.copyReadme(fs.readFileSync(path.join(root, "templates/README.md"), "utf8"), repo, assets) };
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
  for (const p of [...walk("docs"), ...walk("templates")]) if (render.horizonOnly(p)) changes[p] = null;
  return changes;
}

// The changes in one commit
async function makeCopy(github, owner, repo, core) {
  const changes = copyChanges(ROOT, `${owner}/${repo}`);
  const paths = Object.keys(changes);
  if (!paths.length) return;
  const branch = (await github.rest.repos.get({ owner, repo })).data.default_branch;
  const ref = (await github.rest.git.getRef({ owner, repo, ref: `heads/${branch}` })).data;
  const base = (await github.rest.git.getCommit({ owner, repo, commit_sha: ref.object.sha })).data;
  const tree = (await github.rest.git.createTree({ owner, repo, base_tree: base.tree.sha,
    tree: paths.map(p => changes[p] === null ? { path: p, mode: "100644", type: "blob", sha: null }
      : { path: p, mode: "100644", type: "blob", content: changes[p] }) })).data;
  const commit = (await github.rest.git.createCommit({ owner, repo, tree: tree.sha, parents: [ref.object.sha],
    message: "chore: make this a copy: its own README, without the files of the Horizon docs" })).data;
  await github.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.sha });
  core.info(`A copy now: README.md, ${paths.length - 1} files of Horizon deleted`);
}
module.exports.TITLE = TITLE;
module.exports.copyChanges = copyChanges;
