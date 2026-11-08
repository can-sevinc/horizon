const test = require("node:test");
const assert = require("node:assert");
const { spawnSync } = require("child_process");
const cfg = require("../.github/scripts/config");

test("config.yaml reads the same in JavaScript and Python", () => {
  const py = spawnSync("python3", [`${__dirname}/../scripts/read_config.py`], { encoding: "utf8" });
  assert.strictEqual(py.status, 0, py.stderr);
  assert.deepStrictEqual(JSON.parse(py.stdout), cfg.load());
});

test("the reader understands values, lists, comments, and quotes", () => {
  const c = cfg.parse([
    "# a comment", "a: 10   # days", 'b: "09:23"', "c: [x.io, 'y, z']", "d: Plain text", "e: '#notacomment'",
    "list:", "  - name: One", "    color: \"5319E7\"", "  - name: Two",
  ].join("\n"));
  assert.deepStrictEqual(c, { a: 10, b: "09:23", c: ["x.io", "y, z"], d: "Plain text", e: "#notacomment",
    list: [{ name: "One", color: "5319E7" }, { name: "Two" }] });
  assert.throws(() => cfg.parse("a: 1\n  - stray"), /line 2/);
});

test("setValues changes a line and keeps the comments", () => {
  const text = "# City\ncity: \"Stockholm, SE\"  \nreminderTime: \"09:23\"\nfollowUpDays: 10\n";
  const out = cfg.setValues(text, { city: "Berlin, DE", reminderTime: "08:00", followUpDays: 7 });
  assert.match(out, /^# City$/m);
  assert.deepStrictEqual(cfg.parse(out), { city: "Berlin, DE", reminderTime: "08:00", followUpDays: 7 });
  assert.throws(() => cfg.setValues(text, { nope: 1 }), /no "nope:" line/);
});

test("addMissing adds the new settings and the new labels, and keeps yours", () => {
  const mine = "city: Oslo\n\nlabels:\n  - name: summary\n    color: \"EDEDED\"\n  - name: mine\n\nsources:\n  - option: A\n";
  const newer = "city: Stockholm\n\nlabels:\n  - name: summary\n    color: \"000000\"\n  - name: setup\n    color: \"0E8A16\"\n" +
    "    description: Setup\n\nsources:\n  - option: A\n  - option: B\n\n# New\nnewSetting: 5\n";
  const { text, added } = cfg.addMissing(mine, newer);
  assert.deepStrictEqual(added, ["labels: setup", "newSetting"]);
  assert.deepStrictEqual(cfg.parse(text), {
    city: "Oslo",
    labels: [{ name: "summary", color: "EDEDED" }, { name: "mine" }, { name: "setup", color: "0E8A16", description: "Setup" }],
    sources: [{ option: "A" }],
    newSetting: 5,
  });
  assert.deepStrictEqual(cfg.addMissing(text, newer).added, []);
});

test("the settings that the setup asks for are in config.yaml", () => {
  const c = cfg.load();
  for (const k of ["projectTitle", "city", "timezone", "reminderTime", "summaryDay", "summaryTime", "doctorTime",
    "followUpDays", "ghostedDays", "tokenWarnDays", "salaryPlaceholder", "periodGapDays"]) assert.ok(k in c, k);
  assert.match(c.reminderTime, /^\d\d:\d\d$/);
});
