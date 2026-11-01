const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const mock = require("./mock");
const welcome = require("../.github/scripts/welcome");

// Horizon itself, not a copy (a copy has no templates/README.md)
const HORIZON = fs.existsSync(path.join(__dirname, "../templates/README.md"));

const run = async ({ issues = [], repo = { private: true } } = {}) => {
  const m = mock({ issues, repo });
  await welcome({ github: m.github, core: m.core, context: { repo: { owner: "me", repo: "jobs" } } });
  return (m.calls.find(([n]) => n === "create") || [])[1];
};

test("a new copy gets the Finish the setup issue with the links", async () => {
  const issue = await run();
  assert.strictEqual(issue.title, welcome.TITLE);
  assert.match(issue.body, /scopes=repo,project,workflow/);
  assert.match(issue.body, /github.com\/me\/jobs\/settings\/secrets\/actions\/new/);
  assert.match(issue.body, /actions\/workflows\/setup.yaml/);
  assert.doesNotMatch(issue.body, /is public/);
});

test("a public copy gets a warning first", async () => {
  assert.match((await run({ repo: { private: false } })).body, /^> \[!CAUTION\]\n> \*\*This repository is public/);
});

test("a new copy gets its own README, and the files only for Horizon go, in one commit", { skip: !HORIZON && "only in Horizon" }, async () => {
  const m = mock({ issues: [{ title: welcome.TITLE }] });
  await welcome({ github: m.github, core: m.core, context: { repo: { owner: "me", repo: "jobs" } } });
  const [, { tree }] = m.calls.find(([n]) => n === "createTree");
  const readme = tree.find(e => e.path === "README.md");
  assert.match(readme.content, /^# Job applications/);
  assert.match(readme.content, /github\.com\/me\/jobs\/projects/);
  assert.ok(!readme.content.includes("{{"));
  const gone = tree.filter(e => e.sha === null).map(e => e.path);
  for (const p of ["docs/index.md", "docs/setup.md", "docs/_config.yaml", "docs/_includes/head_custom.html", "templates/README.md"]) assert.ok(gone.includes(p), p);
  for (const p of ["docs/supported-sites.md", "docs/images/board-view.png", "templates/comments/interview.md", "templates/comments/README.md", "LICENSE"]) assert.ok(!gone.includes(p), p);
  assert.ok(m.calls.some(([n, a]) => n === "updateRef" && a.sha === "NEW"));
});

test("no second issue", async () => {
  assert.strictEqual(await run({ issues: [{ title: welcome.TITLE }] }), undefined);
});
