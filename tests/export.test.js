const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const mock = require("./mock");
const exp = require("../.github/scripts/export");

const card = (n, archived, period) => ({ id: `I${n}`, isArchived: archived, status: { name: "Applied" },
  applied: { date: `2026-10-0${n}` }, lastUpdate: null, interviews: { number: 0 },
  content: { number: n, title: "t", url: `u${n}`, state: "OPEN", createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z", closedAt: null, labels: { nodes: [{ name: `period: ${period}` }] }, comments: { nodes: [] },
    body: "### Company\n\nAcme, \"Inc\"\n\n### First impressions\n\nnice\nteam" } });

test("export writes JSON and CSV, archived cards only when asked", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "export-"));
  const cwd = process.cwd();
  process.chdir(dir);
  process.env.PROJECT_NUMBER = "1";
  const graphql = async () => ({ user: { projectV2: { items: { pageInfo: { hasNextPage: false }, nodes: [card(1, false, "2026"), card(2, true, "2025")] } } } });
  try {
    const m = mock({ graphql });
    await exp({ github: m.github, core: m.core, getOctokit: m.getOctokit, context: { repo: { owner: "o" }, payload: { inputs: { period: "", archived: "false" } } } });
    const json = JSON.parse(fs.readFileSync("export/applications.json", "utf8"));
    assert.strictEqual(json.applications.length, 1);
    assert.strictEqual(json.applications[0].notes, "nice\nteam");
    assert.match(fs.readFileSync("export/applications.csv", "utf8"), /"Acme, ""Inc"""/);
    await exp({ github: m.github, core: m.core, getOctokit: m.getOctokit, context: { repo: { owner: "o" }, payload: { inputs: { period: "2025", archived: true } } } });
    assert.deepStrictEqual(JSON.parse(fs.readFileSync("export/applications.json", "utf8")).applications.map(a => a.period), ["2025"]);
  } finally { process.chdir(cwd); }
});

test("export runs without inputs (gh workflow run)", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "export-"));
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    const graphql = async () => ({ user: { projectV2: { items: { pageInfo: { hasNextPage: false }, nodes: [card(1, false, "2026"), card(2, true, "2025")] } } } });
    const m = mock({ graphql });
    await exp({ github: m.github, core: m.core, getOctokit: m.getOctokit, context: { repo: { owner: "o" }, payload: { inputs: {} } } });
    assert.strictEqual(JSON.parse(fs.readFileSync("export/applications.json", "utf8")).applications.length, 2);
  } finally { process.chdir(cwd); }
});
