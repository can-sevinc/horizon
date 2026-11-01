const test = require("node:test");
const assert = require("node:assert");
const lib = require("../.github/scripts/project");
const mock = require("./mock");
const sync = require("../.github/scripts/sync");

const section = (title, value) => `### ${title}\n\n${value || "_No response_"}`;
const form = (date, { stage = "", source = "", link = "", description = "text" } = {}) => [section("Stage", stage),
  section("Source", source), section("Date", date), section("Company", "Acme"), section("Job link", link),
  section(lib.DESCRIPTION, description)].join("\n\n");

// Runs sync.js for a new issue up to the project board (the fake board fails there)
async function open(date, { current = "2026", others = [], ...opts } = {}) {
  process.env.CURRENT_PERIOD = current;
  const body = form(date, opts);
  const m = mock({ body, issues: others.map((d, i) => ({ number: 100 + i, body: form(d) })) });
  await sync({ github: m.github, core: m.core, getOctokit: m.getOctokit, context: { repo: { owner: "o", repo: "r" },
    payload: { action: "opened", issue: { number: 1, body, labels: [], created_at: "2026-11-03T00:00:00Z" } } } })
    .catch(e => { if (e.message !== "no board") throw e; });
  const labels = m.calls.filter(([n]) => n === "addLabels").flatMap(([, a]) => a.labels);
  return { ...m, labels, updated: (m.calls.find(([n]) => n === "update") || [])[1] };
}

test("empty Stage and Source are filled in", async () => {
  const { updated } = await open("2026-11-03", { link: "https://thehub.io/jobs/1" });
  assert.strictEqual(lib.field(updated.body, "Stage"), "Applied");
  assert.strictEqual(lib.field(updated.body, "Source"), "Job board");
});

test("a selected Stage stays", async () => {
  const { updated } = await open("2026-11-03", { stage: "Wishlist (not applied yet)" });
  assert.strictEqual(lib.field(updated.body, "Stage"), "Wishlist (not applied yet)");
});

test("the current period stays, also after a long break", async () => {
  assert.ok((await open("2027-01-02")).labels.includes("period: 2026"));
  const { labels, calls } = await open("2027-09-05", { others: ["2026-12-20"] });
  assert.ok(labels.includes("period: 2026"));
  assert.ok(!calls.some(([route]) => route.includes("actions/variables")));
});

test("with no current period, the application starts one named by its month", async () => {
  const { labels, calls } = await open("2027-04-05", { current: "" });
  assert.ok(labels.includes("period: 2027-04"));
  assert.ok(calls.some(([route, a]) => route.includes("actions/variables") && a.value === "2027-04"));
  assert.ok(calls.some(([n, a]) => n === "createComment" && a.body.includes("new job search period")));
});
