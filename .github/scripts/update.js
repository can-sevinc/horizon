// Update workflow: brings the changes of the template (templateRepo in config.yaml) into this copy,
// as a pull request. A copy made with "Use this template" has no common history with the template,
// so this compares files instead of merging commits:
//   - the version of the template that the copy has now ("base") is in TEMPLATE_VERSION; with no
//     file yet, it is the template commit with the same files as the first commit of the copy
//     (or, for a clone, the last commit that both have)
//   - a file that you did not change gets the new version; a file that only you changed stays;
//     a file that both changed is merged line by line (git merge-file), or, when the same lines
//     changed, gets the new version and is listed in the pull request to check
//   - config.yaml and README.md stay yours: only new settings are added. The form and the workflow times and
//     fields are made again from it.
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TEMPLATE_VERSION = ".github/template-version";
const BRANCH = "update-from-template";
// Never taken from the template
// (README.md: a copy has its own, made by the setup from templates/README.md)
const KEEP = p => p === "config.yaml" || p === "README.md" || p === TEMPLATE_VERSION || p.startsWith("data/");

// owner/name -> its Github URL; a URL or a folder stays as it is (the tests use a folder)
const templateUrl = t => /^[\w.-]+\/[\w.-]+$/.test(t) ? `https://github.com/${t}.git` : t;

// The changes in the working tree of dir. Commits nothing: { head, base, files, check, added, bookmark }
function update(dir) {
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const tryGit = (...args) => { try { return git(...args); } catch { return null; } };
  // The bytes of a file in a commit, as they are
  const blob = (c, p) => { try { return execFileSync("git", ["cat-file", "blob", p ? `${c}:${p}` : c], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] }); } catch { return null; } };
  const cfg = require(path.join(dir, ".github/scripts/config.js"));
  const configFile = path.join(dir, "config.yaml");
  const repo = cfg.parse(fs.readFileSync(configFile, "utf8")).templateRepo;
  if (!repo) throw new Error("config.yaml has no templateRepo");

  git("fetch", "--quiet", "--no-tags", templateUrl(repo), "HEAD");
  const head = git("rev-parse", "FETCH_HEAD");
  const file = path.join(dir, TEMPLATE_VERSION);
  let base = fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : null;
  if (base && !tryGit("cat-file", "-e", `${base}^{commit}`)) base = null;
  if (!base) base = tryGit("merge-base", "HEAD", head);
  if (!base) {
    const roots = git("rev-list", "--max-parents=0", "HEAD").split("\n").map(c => git("rev-parse", `${c}^{tree}`));
    const match = git("log", "--format=%H %T", head).split("\n").map(l => l.split(" ")).find(([, t]) => roots.includes(t));
    base = match ? match[0] : null;
  }
  const result = { repo, head, base, files: [], check: [], added: [], bookmark: false };
  if (base === head) return result;

  // path -> blob id (and the mode: a link is 120000) of a commit
  const tree = c => new Map(git("ls-tree", "-r", c).split("\n").filter(Boolean).map(l => {
    const [meta, p] = l.split("\t");
    const [mode, , id] = meta.split(" ");
    return [p, { mode, id }];
  }));
  const next = tree(head), old = base ? tree(base) : new Map(), mine = tree("HEAD");
  const id = (m, p) => (m.get(p) || {}).id || null;
  const take = p => next.has(p) ? git("checkout", head, "--", p) : git("rm", "--quiet", "--", p);

  for (const p of new Set([...next.keys(), ...old.keys()])) {
    if (KEEP(p)) continue;
    const t = id(next, p), b = id(old, p), l = id(mine, p);
    if (l === t) continue;                       // the same already
    if (!base || l === b) { take(p); continue; } // you did not change it
    if (t === b) continue;                       // only you changed it
    // Both changed it
    const linked = [next, old, mine].some(m => (m.get(p) || {}).mode === "120000");
    if (t && b && l && !linked) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "update-"));
      const save = (name, c) => { const f = path.join(tmp, name); fs.writeFileSync(f, blob(c)); return f; };
      const [fl, fb, ft] = [save("mine", l), save("base", b), save("next", t)];
      let clean = true;
      try { execFileSync("git", ["merge-file", "-q", fl, fb, ft], { cwd: dir }); } catch { clean = false; }
      if (clean) { fs.writeFileSync(path.join(dir, p), fs.readFileSync(fl)); continue; }
    }
    take(p);
    result.check.push(p);
  }

  // config.yaml: yours, with the new settings of the template
  const newer = blob(head, "config.yaml");
  if (newer !== null) {
    const { text, added } = cfg.addMissing(fs.readFileSync(configFile, "utf8"), newer.toString("utf8"));
    if (added.length) fs.writeFileSync(configFile, text);
    result.added = added;
  }

  // The files with your settings in them, made again with the new code
  for (const m of ["config.js", "render.js"]) delete require.cache[require.resolve(path.join(dir, ".github/scripts", m))];
  const render = require(path.join(dir, ".github/scripts/render.js"));
  const config = require(path.join(dir, ".github/scripts/config.js")).parse(fs.readFileSync(configFile, "utf8"));
  const redo = (f, fn) => {
    const full = path.join(dir, f);
    if (!fs.existsSync(full)) return;
    const text = fs.readFileSync(full, "utf8"), made = fn(text);
    if (made !== text) fs.writeFileSync(full, made);
  };
  redo(".github/ISSUE_TEMPLATE/application.yaml", t => render.issueForm(t, config));
  for (const [f, keys] of Object.entries(render.SCHEDULES)) redo(f, t => render.workflowSchedule(t, config, keys));
  if (render.setupInputs) redo(render.SETUP_WORKFLOW, t => render.setupInputs(t, config));

  fs.writeFileSync(file, head + "\n");
  git("add", "-A");
  result.files = git("diff", "--cached", "--name-only").split("\n").filter(f => f && f !== TEMPLATE_VERSION);
  result.bookmark = result.files.includes("scripts/bookmarklet.src.js");
  return result;
}

// The text of the pull request
function body(r) {
  const compare = r.base ? `https://github.com/${r.repo}/compare/${r.base.slice(0, 7)}...${r.head.slice(0, 7)}` : null;
  return [
    `New version of the template [${r.repo}](https://github.com/${r.repo})` + (compare ? ` ([what changed](${compare}))` : "") + ".",
    "",
    "**Changed files:**",
    ...r.files.map(f => `- \`${f}\``),
    ...(r.check.length ? ["", "**Check these files.** You and the template changed the same lines, so they have the template's version now. " +
      "Add your changes again if you still need them:", ...r.check.map(f => `- \`${f}\``)] : []),
    ...(r.added.length ? ["", `**New settings** in \`config.yaml\`, with their defaults: ${r.added.map(k => `\`${k}\``).join(", ")}.`] : []),
    "",
    "After you merge, run **Actions** > **Setup** once, so your board gets anything new." +
      (r.bookmark ? " The bookmark changed too: the Setup run shows the new one, so replace your old bookmark with it." : ""),
  ].join("\n");
}

module.exports = async ({ context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  const dir = process.env.GITHUB_WORKSPACE;
  const template = require("./config").load().templateRepo || "";
  if (`${owner}/${repo}`.toLowerCase() === template.toLowerCase()) return core.info("This is the template itself.");
  await require("./telemetry").count("active", require("./config").load(), core);
  const r = update(dir);
  if (!r.files.length) return core.info(`Up to date with ${r.repo} (${r.head.slice(0, 7)}).`);
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "inherit" });
  git("-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit", "--quiet", "-m", "chore: update from the template");
  git("push", "--quiet", "--force", "origin", `HEAD:refs/heads/${BRANCH}`);

  const pat = getOctokit(process.env.PROJECT_TOKEN);
  const base = (await pat.rest.repos.get({ owner, repo })).data.default_branch;
  const open = (await pat.rest.pulls.list({ owner, repo, head: `${owner}:${BRANCH}`, state: "open" })).data[0];
  const pr = { owner, repo, title: "Update from the template", body: body(r) };
  const url = open
    ? (await pat.rest.pulls.update({ ...pr, pull_number: open.number })).data.html_url
    : (await pat.rest.pulls.create({ ...pr, head: BRANCH, base })).data.html_url;
  core.info(`${r.files.length} files changed: ${url}`);
  await core.summary.addRaw(`${body(r)}\n\nPull request: ${url}\n`).write();
};
module.exports.update = update;
module.exports.body = body;
