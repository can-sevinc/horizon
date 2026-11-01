const test = require("node:test");
const assert = require("node:assert");
const mock = require("./mock");
const end = require("../.github/scripts/end-period");

const run = async next => {
  process.env.CURRENT_PERIOD = "2026";
  const m = mock();
  m.core.setFailed = msg => m.calls.push(["failed", msg]);
  await end({ github: m.github, core: m.core, getOctokit: m.getOctokit, context: { repo: { owner: "o", repo: "r" }, payload: { inputs: { next } } } });
  return m.calls;
};

test("ending without a name deletes CURRENT_PERIOD", async () => {
  assert.ok((await run("")).some(([route]) => route.startsWith("DELETE") && route.includes("variables")));
});

test("ending with a name starts the new period", async () => {
  assert.ok((await run("2027-spring")).some(([route, a]) => route.startsWith("PATCH") && a.value === "2027-spring"));
});

test("a bad name fails", async () => {
  assert.ok((await run("a b")).some(([n]) => n === "failed"));
});
