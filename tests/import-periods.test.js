const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

test("periods are made from the dates", () => {
  const dates = ["2025-12-01", "2026-01-15", "2026-04-05", "2026-11-10", "2026-11-20", "2027-02-01"];
  const apps = dates.map((date, i) => ({ id: String(i), company: "Acme", date, status: "Applied" }));
  apps.push({ id: "own", company: "Acme", date: "2026-06-01", status: "Applied", period: "summer" });
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "import-")), "applications.json");
  fs.writeFileSync(file, JSON.stringify({ version: 1, applications: apps }));
  const r = spawnSync("python3", [`${__dirname}/../scripts/import_applications.py`, "--check", file], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /period 2025-12-to-2026-04: 3 \(made from the dates\)/);
  assert.match(r.stdout, /period 2026-11-to-2027-02: 3 \(made from the dates\)/);
  assert.match(r.stdout, /period summer: 1\n/);
});
