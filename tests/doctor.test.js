const test = require("node:test");
const assert = require("node:assert");
const lib = require("../.github/scripts/project");
const mock = require("./mock");
const doctor = require("../.github/scripts/doctor");

const board = async () => ({ user: { projectV2: { id: "P", number: 1,
  field: { id: "S", options: lib.config.statuses.map(s => ({ id: s.name, name: s.name })) },
  fields: { nodes: lib.config.fields.map(f => ({ id: f.name, name: f.name })) } } } });
const allLabels = [...lib.config.labels.map(l => l.name), ...lib.config.sources.map(s => s.label)];

async function check(opts) {
  Object.assign(process.env, { PROJECT_TOKEN: "x", PROJECT_NUMBER: "1", CURRENT_PERIOD: "2026" }, opts.env);
  const m = mock({ graphql: board, labels: allLabels, headers: { "x-oauth-scopes": "repo, project" }, ...opts });
  await doctor({ github: m.github, core: m.core, getOctokit: m.getOctokit, context: { repo: { owner: "o", repo: "r" } } });
  return (m.calls.find(([n]) => n === "create") || [])[1];
}

test("no issue when everything is OK", async () => {
  assert.strictEqual(await check({}), undefined);
});

test("a public repository and a missing label are problems", async () => {
  const issue = await check({ repo: { private: false }, labels: allLabels.slice(1) });
  assert.match(issue.body, /repository is public/);
  assert.match(issue.body, new RegExp(allLabels[0]));
});
