const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const check = data => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "import-")), "applications.json");
  fs.writeFileSync(file, JSON.stringify(data));
  return spawnSync("python3", [`${__dirname}/../scripts/import_applications.py`, "--check", file], { encoding: "utf8" });
};
const app = extra => ({ id: "1", company: "Acme", position: "Dev", date: "2026-10-01", status: "Applied", ...extra });

test("--check passes a good file", () => {
  const r = check({ version: 1, applications: [app({ timeline: [{ date: "2026-10-05", event: "Screen" }] }), app({ id: "2", source: "Job board" })] });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /2 applications/);
});

test("--check finds the problems", () => {
  const r = check({ version: 1, applications: [app({ status: "Maybe" }), app({ date: "5 oct" }), app({ company: "" })] });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stdout, /status 'Maybe'/);
  assert.match(r.stdout, /date must be YYYY-MM-DD/);
  assert.match(r.stdout, /not unique/);
  assert.match(r.stdout, /company is missing/);
});
