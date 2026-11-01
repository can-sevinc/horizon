// scripts/setup.sh with a fake gh: the repository checks and the run of the Setup workflow
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const FAKE_GH = `#!/usr/bin/env bash
echo "gh $*" >>"$FAKE_LOG"
case "$*" in
  "auth status") echo "Token scopes: 'project', 'repo'" ;;
  "api user -q .login") echo me ;;
  "repo view "*"--json nameWithOwner"*) echo "$FAKE_REPO" ;;
  "repo view "*"--json visibility"*) echo "$FAKE_VISIBILITY" ;;
  "repo create "*) git remote add origin "$FAKE_REMOTE" ;;
  "secret list "*) echo "PROJECT_TOKEN	2026-10-01" ;;
  "run list "*) echo 123 ;;
  "run view 123 "*"--log") printf 'setup\\tRun\\t2026-11-01T10:00:00.1Z ✓ Labels already set\\nsetup\\tRun\\t2026-11-01T10:00:00.2Z TODO Sort the Board view\\nsetup\\tRun\\t2026-11-01T10:00:00.3Z BOOKMARKLET javascript:(()=>{})()\\n' ;;
  "variable get "*) echo 1 ;;
esac
exit 0
`;

function run({ repo, visibility = "PRIVATE" }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "setup-sh-"));
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, "gh"), FAKE_GH, { mode: 0o755 });
  const remote = path.join(dir, "remote.git");
  execFileSync("git", ["init", "-q", "--bare", remote]);
  const work = path.join(dir, "work");
  fs.mkdirSync(path.join(work, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "scripts/setup.sh"), path.join(work, "scripts/setup.sh"));
  fs.copyFileSync(path.join(ROOT, "config.yaml"), path.join(work, "config.yaml"));
  const git = (...a) => execFileSync("git", ["-C", work, ...a], { stdio: "ignore" });
  git("init", "-q"); git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "x");
  git("add", "-A"); git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "y");
  git("remote", "add", "origin", remote);
  const log = path.join(dir, "gh.log");
  const r = spawnSync("bash", ["scripts/setup.sh"], { cwd: work, encoding: "utf8", input: "",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_LOG: log, FAKE_REPO: repo, FAKE_VISIBILITY: visibility,
      FAKE_REMOTE: remote, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
  const remotes = execFileSync("git", ["-C", work, "remote"], { encoding: "utf8" }).split("\n").filter(Boolean);
  const bookmark = fs.existsSync(path.join(work, "data/bookmarklet.txt")) ? fs.readFileSync(path.join(work, "data/bookmarklet.txt"), "utf8").trim() : null;
  return { ...r, gh: fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "", remotes, bookmark };
}

test("your private repository: runs the Setup workflow and saves the bookmark", () => {
  const r = run({ repo: "me/job-applications" });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.gh, /gh workflow run setup.yaml -R me\/job-applications/);
  assert.doesNotMatch(r.gh, /repo create/);
  assert.match(r.stdout, /✓ Labels already set/);
  assert.match(r.stdout, /! Sort the Board view/);
  assert.strictEqual(r.bookmark, "javascript:(()=>{})()");
});

test("a public repository of yours: stops", () => {
  const r = run({ repo: "me/job-applications", visibility: "PUBLIC" });
  assert.strictEqual(r.status, 1);
  assert.match(r.stdout, /is PUBLIC/);
  assert.doesNotMatch(r.gh, /workflow run|repo create/);
});

test("someone else's repository (the template): upstream, and a new private repository", () => {
  const r = run({ repo: "someone/template" });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /is not your repository/);
  assert.deepStrictEqual(r.remotes.sort(), ["origin", "upstream"]);
  assert.match(r.gh, /gh repo create job-applications --private --source=\. --remote=origin --push/);
  assert.match(r.gh, /workflow run setup.yaml -R me\/job-applications/);
});

test("put writes a setting that config.yaml reads back, with quotes and backslashes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "put-"));
  fs.copyFileSync(path.join(ROOT, "config.yaml"), path.join(dir, "config.yaml"));
  const fns = fs.readFileSync(path.join(ROOT, "scripts/setup.sh"), "utf8").match(/^get\(\) .*$|^put\(\) \{[\s\S]*?^\}$/gm).join("\n");
  fs.writeFileSync(path.join(dir, "fn.sh"), fns);
  execFileSync("bash", ["-c", 'source fn.sh; put city "Berlin, DE"; put followUpDays 7; put salaryPlaceholder \'60k "EUR" a\\b\'; get city > got.txt'],
    { cwd: dir, env: { ...process.env, CONFIG: "config.yaml" } });
  const c = require("../.github/scripts/config").load(path.join(dir, "config.yaml"));
  assert.deepStrictEqual([c.city, c.followUpDays, c.salaryPlaceholder], ["Berlin, DE", 7, '60k "EUR" a\\b']);
  assert.strictEqual(fs.readFileSync(path.join(dir, "got.txt"), "utf8").trim(), "Berlin, DE");
  assert.strictEqual(c.statuses.length, 7);
});
