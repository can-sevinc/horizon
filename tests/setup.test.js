const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const render = require("../.github/scripts/render");
const cfg = require("../.github/scripts/config");
const mock = require("./mock");
const setup = require("../.github/scripts/setup");

const ROOT = path.join(__dirname, "..");

test("the bookmark is the same as from make_bookmarklet.sh", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bm-"));
  fs.mkdirSync(path.join(dir, "scripts"));
  for (const f of ["bookmarklet.src.js", "make_bookmarklet.sh"]) fs.copyFileSync(path.join(ROOT, "scripts", f), path.join(dir, "scripts", f));
  execFileSync("bash", [path.join(dir, "scripts/make_bookmarklet.sh"), "me/repo"], { stdio: "ignore" });
  const bash = fs.readFileSync(path.join(dir, "data/bookmarklet.txt"), "utf8").trim();
  assert.strictEqual(render.bookmarklet(fs.readFileSync(path.join(ROOT, "scripts/bookmarklet.src.js"), "utf8"), "me/repo"), bash);
});

test("the form already has the settings of config.yaml", () => {
  const form = fs.readFileSync(path.join(ROOT, ".github/ISSUE_TEMPLATE/application.yaml"), "utf8");
  assert.strictEqual(render.issueForm(form, cfg.load()), form);
});

test("formAttribute changes, adds, and removes a value", () => {
  const form = "body:\n  - type: input\n    id: city\n    attributes:\n      label: City\n  - type: input\n    id: salary\n";
  const added = render.formAttribute(form, "city", "value", "Oslo, NO");
  assert.match(added, /label: City\n      value: "Oslo, NO"\n  - type/);
  assert.strictEqual(render.formAttribute(added, "city", "value", ""), form);
});

// A board that already matches config.yaml
const config = cfg.load();
function board() {
  const views = [
    { id: "V1", name: "Board", layout: "BOARD_LAYOUT", filter: "-label:summary", fields: ["Title", "Labels", "Applied date", "Last update", "Interviews"], sort: ["Last update", "DESC"] },
    { id: "V2", name: "Table", layout: "TABLE_LAYOUT", filter: "-label:summary", fields: ["Title", "Status", "Applied date", "Last update", "Interviews", "Company", "Position", "City", "Salary range", "Recruiter", "Job link", "Labels"], sort: ["Applied date", "ASC"] },
    { id: "V3", name: "Interviews", layout: "ROADMAP_LAYOUT", filter: 'status:"In progress","On hold","Rejected after interview" -label:summary', fields: [], sort: ["Last update", "DESC"] },
    { id: "V4", name: "Summaries", layout: "TABLE_LAYOUT", filter: "label:summary", fields: ["Title", "Created"], sort: ["Created", "DESC"] },
  ];
  const mutations = [];
  const graphql = async q => {
    if (/^\s*mutation/.test(q)) { mutations.push(q.match(/mutation[^{]*\{\s*(\w+)/)[1]); return {}; }
    if (q.includes("projectsV2(first")) return { user: { id: "U", projectsV2: { nodes: [{ number: 1, title: config.projectTitle }] } } };
    const p = {
      id: "P", title: config.projectTitle, repositories: { nodes: [{ nameWithOwner: "o/r" }] },
      field: { id: "S", options: config.statuses.map(s => ({ id: s.name, name: s.name, color: s.color, description: s.description })) },
      fields: { nodes: [...config.fields.map(f => ({ id: f.name, name: f.name })), { id: "T", name: "Title" }, { id: "L", name: "Labels" }, { id: "St", name: "Status" }, { id: "C", name: "Created" }] },
      views: { nodes: views.map(v => ({ id: v.id, name: v.name, layout: v.layout, filter: v.filter, fields: { nodes: v.fields.map(name => ({ name })) },
        sortByFields: { nodes: v.sort ? [{ field: { name: v.sort[0] }, direction: v.sort[1] }] : [] } })) },
      workflows: { nodes: [] },
    };
    return { user: { projectV2: p } };
  };
  return { graphql, mutations };
}
const labels = [...config.labels.map(l => ({ name: l.name, color: l.color, description: l.description })),
  ...config.sources.map(s => ({ name: s.label, color: s.color, description: "" })), { name: "period: 2026", color: "C5DEF5" }];

async function run(inputs, b = board(), issues = []) {
  Object.assign(process.env, { PROJECT_TOKEN: "x", PROJECT_NUMBER: "1", CURRENT_PERIOD: "2026" });
  const m = mock({ graphql: b.graphql });
  m.github.paginate = async fn => fn === "listLabelsForRepo" ? labels : issues;
  m.core.setFailed = msg => m.calls.push(["failed", msg]);
  m.core.info = msg => m.calls.push(["info", msg]);
  const res = await setup({ github: m.github, core: m.core, getOctokit: m.getOctokit,
    context: { repo: { owner: "o", repo: "r" }, payload: { inputs, repository: { node_id: "R", default_branch: "main" } } } });
  return { ...m, res, mutations: b.mutations };
}

test("a board that matches config.yaml: no changes, the bookmark", async () => {
  const { res, mutations, calls } = await run({ dry_run: false });
  assert.deepStrictEqual(mutations, []);
  assert.ok(!calls.some(([n]) => n === "createLabel" || n === "updateLabel"));
  assert.match(res.bookmarklet, /^javascript:\(\(\) => \{ const REPO = 'o\/r';/);
  assert.deepStrictEqual(res.todo, []);
});

test("dry run: a new setting changes nothing, a bad time fails", async () => {
  const { res, mutations } = await run({ dry_run: "true", project_title: "My search", city: "Oslo, NO" });
  assert.strictEqual(res.dry, true);
  assert.deepStrictEqual(mutations, []);
  const bad = await run({ reminder_time: "9:5" });
  assert.ok(bad.calls.some(([n, m]) => n === "failed" && /HH:MM/.test(m)));
});

test("the Setup workflow fields show the values of config.yaml", () => {
  const text = fs.readFileSync(path.join(ROOT, render.SETUP_WORKFLOW), "utf8");
  assert.strictEqual(render.setupInputs(text, cfg.load()), text);
  const changed = render.setupInputs(text, { ...cfg.load(), city: "Oslo, NO", followUpDays: 7 });
  assert.match(changed, /      city:\n.*\n        default: "Oslo, NO"\n/);
  assert.strictEqual(render.inputDefaults(changed).follow_up_days, "7");
});

test("fields left at their defaults keep config.yaml, a changed field is saved", async () => {
  const text = fs.readFileSync(path.join(ROOT, render.SETUP_WORKFLOW), "utf8");
  const same = await run({ dry_run: "true", ...render.inputDefaults(text) });
  assert.ok(same.res.dry && !same.calls.some(([n, m]) => n === "info" && /would change/.test(m)));
  const changed = await run({ dry_run: "true", ...render.inputDefaults(text), city: "Oslo, NO" });
  assert.ok(changed.calls.some(([n, m]) => n === "info" && /would change config\.yaml/.test(m)));
});

test("the Setup workflow fields show the values of config.yaml", () => {
  const text = fs.readFileSync(path.join(ROOT, render.SETUP_WORKFLOW), "utf8");
  assert.strictEqual(render.setupInputs(text, cfg.load()), text);
  const changed = render.setupInputs(text, { ...cfg.load(), city: "Oslo, NO", followUpDays: 7 });
  assert.match(changed, /      city:\n.*\n        default: "Oslo, NO"\n/);
  assert.strictEqual(render.inputDefaults(changed).follow_up_days, "7");
});

test("fields left at their defaults keep config.yaml, a changed field is saved", async () => {
  const defaults = render.inputDefaults(fs.readFileSync(path.join(ROOT, render.SETUP_WORKFLOW), "utf8"));
  const changes = r => r.calls.filter(([n, m]) => n === "info" && /would change/.test(m)).map(([, m]) => m);
  assert.deepStrictEqual(changes(await run({ dry_run: "true", ...defaults })), []);
  const changed = changes(await run({ dry_run: "true", ...defaults, city: "Oslo, NO" }));
  assert.ok(["config.yaml", ".github/ISSUE_TEMPLATE/application.yaml", render.SETUP_WORKFLOW]
    .every(f => changed.includes(`(dry run) would change ${f}`)), changed.join("\n"));
});

test("a missing field and Status option are made", async () => {
  const b = board();
  const graphql = b.graphql;
  b.graphql = async (q, v) => {
    const r = await graphql(q, v);
    if (r.user && r.user.projectV2) {
      r.user.projectV2.fields.nodes = r.user.projectV2.fields.nodes.filter(f => f.name !== "Interviews");
      r.user.projectV2.field.options = r.user.projectV2.field.options.slice(1);
    }
    return r;
  };
  const { mutations } = await run({}, b);
  assert.ok(mutations.includes("createProjectV2Field"));
  assert.ok(mutations.includes("updateProjectV2Field"));
});

test("cron lines: one for each UTC offset, with the day when the UTC time is on another day", () => {
  assert.deepStrictEqual(render.cronLines("09:23", "Europe/Stockholm", null, 2026), ["23 7 * * *", "23 8 * * *"]);
  assert.deepStrictEqual(render.cronLines("08:00", "Asia/Kolkata", null, 2026), ["30 2 * * *"]);
  assert.deepStrictEqual(render.cronLines("00:30", "Asia/Tokyo", "Monday", 2026), ["30 15 * * 0"]);
  assert.deepStrictEqual(render.cronLines("23:30", "America/Los_Angeles", "Sunday", 2026), ["30 6 * * 1", "30 7 * * 1"]);
});

test("the workflows already have the schedules of config.yaml", () => {
  const c = cfg.load();
  for (const [file, keys] of Object.entries(render.SCHEDULES)) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.strictEqual(render.workflowSchedule(text, c, keys), text, file);
  }
});

test("a scheduled run happens only for the cron line of today's UTC offset", () => {
  const lib = require("../.github/scripts/project");
  const now = render.offset(lib.config.timezone, new Date());
  const right = render.cron(lib.config.reminderTime, now);
  const wrong = render.cronLines(lib.config.reminderTime, lib.config.timezone).find(l => l !== right);
  assert.strictEqual(lib.onTime({ eventName: "schedule", payload: { schedule: right } }, "reminderTime"), true);
  if (wrong) assert.strictEqual(lib.onTime({ eventName: "schedule", payload: { schedule: wrong } }, "reminderTime"), false);
  assert.strictEqual(lib.onTime({ eventName: "workflow_dispatch", payload: {} }, "reminderTime"), true);
});

test("the steps for you get their own issues, and Finish the setup closes with links to them", async () => {
  const { TITLE } = require("../.github/scripts/welcome");
  const issues = require("../.github/scripts/setup-issues");
  const { calls } = await run({}, board(), [{ number: 7, title: TITLE, state: "open" }, { number: 8, title: "[Acme] Dev", state: "open" }]);
  const created = calls.filter(([n]) => n === "create").map(([, a]) => a);
  assert.deepStrictEqual(created.map(a => a.title), [issues.PREPARE, issues.BOOKMARK]);
  assert.ok(created.every(a => a.labels[0] === "setup"));
  assert.match(created[0].body, /Field sum: \*\*Count\*\* and \*\*Interviews\*\*[\s\S]*board-view\.png\?raw=true[\s\S]*Zoom level: \*\*Year\*\*/);
  assert.match(created[1].body, /```\n   javascript:[\s\S]*add-bookmark\.png/);
  const comment = calls.find(([n, a]) => n === "createComment" && a.issue_number === 7);
  assert.match(comment[1].body, /Next steps:\n\n- \[ \] #\d+ Prepare the board\n- \[ \] #\d+ Add the bookmark/);
  assert.ok(calls.some(([n, a]) => n === "update" && a.issue_number === 7 && a.state === "closed"));
  assert.ok(!calls.some(([, a]) => a && a.issue_number === 8));
  const dry = await run({ dry_run: true }, board(), [{ number: 7, title: TITLE }]);
  assert.ok(!dry.calls.some(([n]) => n === "createComment" || n === "create"));
});

test("a second run opens no new issues; the open bookmark issue gets the current bookmark", async () => {
  const issues = require("../.github/scripts/setup-issues");
  const { calls } = await run({}, board(), [{ number: 3, title: issues.PREPARE, state: "closed" }, { number: 4, title: issues.BOOKMARK, state: "open" }]);
  assert.ok(!calls.some(([n]) => n === "create"));
  assert.ok(calls.some(([n, a]) => n === "update" && a.issue_number === 4 && /javascript:/.test(a.body)));
  assert.ok(!calls.some(([n, a]) => n === "update" && a.issue_number === 3));
});

test("a new project: View 1 becomes the Board, and the Github default labels go", async () => {
  const b = board();
  const graphql = b.graphql;
  b.graphql = async (q, v) => {
    if (q.includes("projectsV2(first")) return { user: { id: "U", projectsV2: { nodes: [] } } };
    if (/createProjectV2\(/.test(q)) { b.mutations.push("createProjectV2"); return { createProjectV2: { projectV2: { number: 2 } } }; }
    if (/createProjectV2View\(/.test(q)) { b.mutations.push("createProjectV2View"); return { createProjectV2View: { projectV2View: { id: "NV" } } }; }
    const r = await graphql(q, v);
    if (r.user && r.user.projectV2 && r.user.projectV2.views) {
      r.user.projectV2.views.nodes = [{ id: "V0", name: "View 1", layout: "TABLE_LAYOUT", filter: "", fields: { nodes: [{ name: "Title" }, { name: "Assignees" }] }, sortByFields: { nodes: [] } }];
    }
    return r;
  };
  labels.push({ name: "bug", color: "d73a4a", description: "" });
  try {
    const { mutations, calls } = await run({}, b);
    assert.ok(calls.some(([n, a]) => n === "deleteLabel" && a.name === "bug"));
    assert.strictEqual(mutations.filter(m => m === "createProjectV2View").length, 3);
    assert.ok(mutations.includes("updateProjectV2View"));
  } finally { labels.pop(); }
});
