const test = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { update, body } = require("../.github/scripts/update");

const ROOT = path.join(__dirname, "..");
const git = (dir, ...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args],
  { cwd: dir, encoding: "utf8" }).trim();
const read = (dir, f) => fs.readFileSync(path.join(dir, f), "utf8");
const edit = (dir, f, fn) => fs.writeFileSync(path.join(dir, f), fn(read(dir, f)));

// A repository with the files of this one
function copyOfThis(dir) {
  const files = git(ROOT, "ls-files", "--cached", "--others", "--exclude-standard").split("\n").filter(Boolean);
  for (const f of files) {
    const from = path.join(ROOT, f), to = path.join(dir, f);
    const stat = fs.lstatSync(from, { throwIfNoEntry: false });
    if (!stat) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (stat.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(from), to);
    else fs.copyFileSync(from, to);
  }
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "start");
}

test("update: a copy made from the template gets the new version, and keeps its own changes", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "horizon-"));
  const tpl = path.join(tmp, "template"), mine = path.join(tmp, "mine");
  fs.mkdirSync(tpl); fs.mkdirSync(mine);
  copyOfThis(tpl);
  const first = git(tpl, "rev-parse", "HEAD");
  // "Use this template": the same files, a new history
  copyOfThis(mine);

  // Your changes: settings (and the form made from them), a line of the README and of a skill
  const render = require("../.github/scripts/render");
  const cfg = require("../.github/scripts/config");
  edit(mine, "config.yaml", t => cfg.setValues(t, { city: "Oslo, NO", templateRepo: tpl }));
  edit(mine, ".github/ISSUE_TEMPLATE/application.yaml", t => render.issueForm(t, cfg.parse(read(mine, "config.yaml"))));
  edit(mine, "AGENTS.md", t => t.replace(/^# .*$/m, "# My agents"));
  edit(mine, "skills/weekly-plan/SKILL.md", t => t.replace(/^# .*$/m, "# My weekly plan"));
  git(mine, "commit", "-qam", "my changes");

  // The new version of the template
  edit(tpl, "scripts/bookmarklet.src.js", t => t + "// new\n");
  edit(tpl, "AGENTS.md", t => t.replace(/^## Skills$/m, "## Skills (new)"));
  edit(tpl, "skills/weekly-plan/SKILL.md", t => t.replace(/^# .*$/m, "# Weekly plan (new)"));
  edit(tpl, ".github/ISSUE_TEMPLATE/application.yaml", t => t.replace("label: Salary range", "label: Salary"));
  edit(tpl, "config.yaml", t => t + "\n# A new setting\nnewSetting: 5\n");
  fs.writeFileSync(path.join(tpl, "scripts/new.sh"), "new\n");
  fs.rmSync(path.join(tpl, "templates/interview-note.md"));
  edit(tpl, "docs/setup.md", t => t + "\nNew docs.\n");
  git(tpl, "add", "-A");
  git(tpl, "commit", "-qm", "new version");
  const second = git(tpl, "rev-parse", "HEAD");

  const r = update(mine);
  assert.strictEqual(r.base, first);
  assert.strictEqual(r.head, second);
  assert.ok(fs.existsSync(path.join(mine, "scripts/new.sh")));
  assert.ok(!fs.existsSync(path.join(mine, "templates/interview-note.md")));
  // (the files only for Horizon never come)
  assert.doesNotMatch(read(mine, "docs/setup.md"), /New docs/);
  assert.ok(r.bookmark);
  assert.match(read(mine, "AGENTS.md"), /^# My agents$[\s\S]*^## Skills \(new\)$/m);
  assert.deepStrictEqual(r.check, ["skills/weekly-plan/SKILL.md"]);
  assert.match(read(mine, "skills/weekly-plan/SKILL.md"), /^# Weekly plan \(new\)$/m);
  assert.deepStrictEqual(r.added, ["newSetting"]);
  const config = cfg.parse(read(mine, "config.yaml"));
  assert.strictEqual(config.city, "Oslo, NO");
  assert.strictEqual(config.newSetting, 5);
  assert.match(read(mine, ".github/ISSUE_TEMPLATE/application.yaml"), /value: "Oslo, NO"[\s\S]*label: Salary\n/);
  assert.strictEqual(read(mine, ".github/template-version").trim(), second);
  assert.ok(fs.lstatSync(path.join(mine, "templates/application.yaml")).isSymbolicLink());
  assert.match(body(r), /Check these files[\s\S]*skills\/weekly-plan[\s\S]*newSetting[\s\S]*replace your old bookmark/);

  // Again, after the merge: nothing to do
  git(mine, "commit", "-qm", "update");
  assert.deepStrictEqual(update(mine).files, []);
  fs.rmSync(tmp, { recursive: true, force: true });
});
