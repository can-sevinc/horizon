const test = require("node:test");
const assert = require("node:assert");
const mock = require("./mock");
const welcome = require("../.github/scripts/welcome");

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

test("a new copy gets its own README, once", async () => {
  const m = mock({ issues: [{ title: welcome.TITLE }] });
  await welcome({ github: m.github, core: m.core, context: { repo: { owner: "me", repo: "jobs" } } });
  const [, put] = m.calls.find(([n]) => n === "createOrUpdateFileContents");
  const text = Buffer.from(put.content, "base64").toString();
  assert.strictEqual(put.sha, "S");
  assert.match(text, /^# Job applications/);
  assert.match(text, /github\.com\/me\/jobs\/projects/);
  assert.ok(!text.includes("{{"));
});

test("no second issue", async () => {
  assert.strictEqual(await run({ issues: [{ title: welcome.TITLE }] }), undefined);
});
