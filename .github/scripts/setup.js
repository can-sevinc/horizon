// Setup workflow: makes the labels, the project board, and the variables match config.yaml,
// writes the settings into the files that use them, and makes the bookmark.
// Safe to run again: it changes only what is not set yet, so your cards, your sort, your extra
// columns, and your own views stay. With dry_run, it only shows what it would change.
const fs = require("fs");
const path = require("path");
const cfg = require("./config");
const render = require("./render");
const lib = require("./project");
const issues = require("./setup-issues");

const ROOT = path.join(__dirname, "../..");
const FORM = ".github/ISSUE_TEMPLATE/application.yaml";
// Fields shown on the Board cards, and the columns of the Table view in this order
const BOARD_FIELDS = ["Title", "Labels", "Applied date", "Last update", "Interviews"];
const TABLE_FIELDS = ["Title", "Status", "Applied date", "Last update", "Interviews", "Company", "Position", "City",
  "Salary range", "Recruiter", "Job link", "Labels"];
// The labels that Github adds to a new repository: removed when the setup makes the board
const DEFAULT_LABELS = ["bug", "documentation", "duplicate", "enhancement", "good first issue", "help wanted",
  "invalid", "question", "wontfix", "accessibility"];
// The README of Horizon has this line; a copy gets templates/README.md instead
const PITCH = "<!-- horizon: the README of the template -->";
const NEW_TOKEN = "https://github.com/settings/tokens/new?scopes=repo,project,workflow&description=job-applications";

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  const R = `${owner}/${repo}`;
  const inputs = context.payload.inputs || {};
  const dry = String(inputs.dry_run) === "true";
  const out = [];
  // Steps for you (what the API cannot do)
  const todo = [];
  const say = msg => { core.info(msg); out.push(msg); };
  // A change: done, or with dry_run only shown
  const change = async (what, fn) => {
    if (dry) return say(`(dry run) would ${what}`);
    await fn();
    say(`✓ ${what[0].toUpperCase()}${what.slice(1)}`);
  };

  if (!process.env.PROJECT_TOKEN) {
    return core.setFailed(`The secret PROJECT_TOKEN is empty. Make a token (${NEW_TOKEN}), then save it: ` +
      `Settings > Secrets and variables > Actions > New repository secret, name PROJECT_TOKEN.`);
  }
  const pat = getOctokit(process.env.PROJECT_TOKEN);

  // --- Settings: the workflow inputs go into config.yaml ---
  const configText = fs.readFileSync(cfg.FILE, "utf8");
  // A field counts only when it is not its default: the default can be older than config.yaml
  // (after a change of config.yaml by hand, or by scripts/setup.sh)
  const setupText = fs.readFileSync(path.join(ROOT, render.SETUP_WORKFLOW), "utf8");
  const fieldDefaults = render.inputDefaults(setupText);
  const values = {};
  for (const [input, key] of Object.entries(render.INPUTS)) {
    const v = String(inputs[input] ?? "").trim();
    if (v && v !== fieldDefaults[input]) values[key] = /Days$/.test(key) ? Number(v) : v;
  }
  for (const [key, v] of Object.entries(values)) {
    if (/Days$/.test(key) && !(Number.isInteger(v) && v > 0)) return core.setFailed(`${key} must be a number of days, not "${v}".`);
    if (/Time$/.test(key) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return core.setFailed(`${key} must be HH:MM, for example 09:30, not "${v}".`);
  }
  const newConfigText = cfg.setValues(configText, values);
  const config = cfg.parse(newConfigText);
  // The settings of config.yaml too: a wrong value would break the schedules
  try { render.offset(config.timezone, new Date()); } catch (e) {
    return core.setFailed(`timezone "${config.timezone}" is not a time zone name. Use one like Europe/Berlin: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`);
  }
  if (!render.DAYS.includes(config.summaryDay)) return core.setFailed(`summaryDay must be one of ${render.DAYS.join(", ")}, not "${config.summaryDay}".`);
  for (const key of ["reminderTime", "summaryTime", "doctorTime"]) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(config[key] || "")) return core.setFailed(`${key} in config.yaml must be HH:MM, not "${config[key]}".`);
  }

  // --- Files with the settings in them ---
  const files = {};
  if (newConfigText !== configText) files["config.yaml"] = newConfigText;
  const form = fs.readFileSync(path.join(ROOT, FORM), "utf8");
  const newForm = render.issueForm(form, config);
  if (newForm !== form) files[FORM] = newForm;
  // The times of the scheduled workflows (a change here needs the workflow scope of the token)
  for (const [file, keys] of Object.entries(render.SCHEDULES)) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    const rendered = render.workflowSchedule(text, config, keys);
    if (rendered !== text) files[file] = rendered;
  }
  // The fields of this workflow show the values of config.yaml (the workflow scope too)
  const newSetup = render.setupInputs(setupText, config);
  if (newSetup !== setupText) files[render.SETUP_WORKFLOW] = newSetup;

  // --- Labels ---
  const have = Object.fromEntries((await github.paginate(github.rest.issues.listLabelsForRepo, { owner, repo, per_page: 100 }))
    .map(l => [l.name, l]));
  const wanted = [...config.labels.map(l => ({ name: l.name, color: l.color, description: l.description || "" })),
    ...config.sources.map(s => ({ name: s.label, color: s.color, description: "" }))];
  let labelsChanged = 0;
  for (const l of wanted) {
    const cur = have[l.name];
    if (!cur) {
      labelsChanged++;
      await change(`create the label "${l.name}"`, () => github.rest.issues.createLabel({ owner, repo, ...l }));
    } else if (cur.color.toLowerCase() !== l.color.toLowerCase() || (l.description && cur.description !== l.description)) {
      labelsChanged++;
      await change(`update the label "${l.name}"`, () => github.rest.issues.updateLabel({ owner, repo, ...l }));
    }
  }
  if (!labelsChanged) say("✓ Labels already set");

  // --- Project board: by PROJECT_NUMBER (also after a rename), else by its title, else a new one ---
  const user = (await pat.graphql(`query($o:String!) { user(login:$o) { id
    projectsV2(first:100) { nodes { number title } } } }`, { o: owner })).user;
  let num = Number(process.env.PROJECT_NUMBER) || null;
  let created = false;
  if (num && !user.projectsV2.nodes.some(p => p.number === num)) num = null;
  if (!num) num = (user.projectsV2.nodes.find(p => p.title === config.projectTitle) || {}).number || null;
  if (!num) {
    if (dry) {
      say(`(dry run) would create the project "${config.projectTitle}" and set it up`);
      return finish();
    }
    num = (await pat.graphql(`mutation($o:ID!, $t:String!) { createProjectV2(input:{ownerId:$o, title:$t}) {
      projectV2 { number } } }`, { o: user.id, t: config.projectTitle })).createProjectV2.projectV2.number;
    created = true;
    say(`✓ Created the project #${num}`);
  } else say(`✓ Using the project #${num}`);
  // A new board: the labels that Github adds to a new repository go
  if (created) for (const name of DEFAULT_LABELS.filter(n => have[n])) {
    await change(`delete the label "${name}"`, () => github.rest.issues.deleteLabel({ owner, repo, name }));
  }
  const project = async sel => (await pat.graphql(`query($o:String!, $n:Int!) { user(login:$o) { projectV2(number:$n) { ${sel} } } }`,
    { o: owner, n: num })).user.projectV2;
  const p = await project("id title url repositories(first:50) { nodes { nameWithOwner } }");
  if (p.title !== config.projectTitle) {
    await change(`rename the project to "${config.projectTitle}"`, () => pat.graphql(`mutation($p:ID!, $t:String!) {
      updateProjectV2(input:{projectId:$p, title:$t}) { clientMutationId } }`, { p: p.id, t: config.projectTitle }));
  }
  if (!p.repositories.nodes.some(r => r.nameWithOwner === R)) {
    await change(`link the project to ${R}`, () => pat.graphql(`mutation($p:ID!, $r:ID!) {
      linkProjectV2ToRepository(input:{projectId:$p, repositoryId:$r}) { clientMutationId } }`,
      { p: p.id, r: context.payload.repository.node_id }));
  }
  if (String(num) !== process.env.PROJECT_NUMBER) {
    await change(`set PROJECT_NUMBER to ${num}`, () => lib.setVariable(pat, owner, repo, "PROJECT_NUMBER", String(num)));
  }
  // The current job search period: the newest "period: ..." label (with none, the first application starts one)
  const periods = Object.keys(have).filter(n => n.startsWith("period: ")).map(n => n.slice(8)).sort();
  if (!process.env.CURRENT_PERIOD && periods.length) {
    const last = periods[periods.length - 1];
    await change(`set CURRENT_PERIOD to ${last}`, () => lib.setVariable(pat, owner, repo, "CURRENT_PERIOD", last));
  }

  // --- Status options (oldName keeps the id of a renamed option, so the cards keep their status) ---
  const status = (await project(`field(name:"Status") { ... on ProjectV2SingleSelectField { id options { id name color description } } }`)).field;
  const want = config.statuses.map(s => `${s.name}|${s.color}|${s.description}`).join("\n");
  if (status.options.map(o => `${o.name}|${o.color}|${o.description}`).join("\n") === want) say("✓ Status options already set");
  else {
    const options = config.statuses.map(s => {
      const old = status.options.find(o => o.name === s.name || (s.oldName && o.name === s.oldName));
      return `{${old ? `id:${JSON.stringify(old.id)}, ` : ""}name:${JSON.stringify(s.name)}, color:${s.color}, description:${JSON.stringify(s.description)}}`;
    });
    await change("set the Status options", () => pat.graphql(`mutation { updateProjectV2Field(input:{fieldId:${JSON.stringify(status.id)},
      singleSelectOptions:[${options.join(",")}]}) { clientMutationId } }`));
  }

  // --- Fields ---
  const fieldIds = async () => Object.fromEntries((await project("fields(first:50) { nodes { ... on ProjectV2FieldCommon { id name } } }"))
    .fields.nodes.map(f => [f.name, f.id]));
  let ids = await fieldIds();
  const missing = config.fields.filter(f => !ids[f.name]);
  for (const f of missing) {
    await change(`create the field "${f.name}"`, () => pat.graphql(`mutation($p:ID!, $n:String!, $t:ProjectV2CustomFieldType!) {
      createProjectV2Field(input:{projectId:$p, name:$n, dataType:$t}) { clientMutationId } }`, { p: p.id, n: f.name, t: f.type }));
  }
  if (!missing.length) say("✓ Fields already set");
  if (missing.length && !dry) ids = await fieldIds();

  // --- Views: found by name; an existing view changes only when its layout or filter is not the
  // same or a field is missing (your sort, your extra fields, and their order stay) ---
  const views = (await project(`views(first:20) { nodes { id name layout filter
    fields(first:50) { nodes { ... on ProjectV2FieldCommon { name } } }
    sortByFields(first:5) { nodes { direction field { ... on ProjectV2FieldCommon { name } } } } } }`)).views.nodes;
  // A new project has an empty "View 1": it becomes the Board
  const blank = views.find(v => /^View \d+$/.test(v.name));
  const view = async (name, layout, filter, fields) => {
    let cur = views.find(v => v.name === name), fresh = false;
    if (!cur && name === "Board" && blank) { cur = blank; fresh = true; }
    let list = fields;
    if (cur && !fresh) {
      const shown = cur.fields.nodes.map(f => f.name);
      const add = fields.filter(f => !shown.includes(f));
      if (cur.layout === layout && cur.filter === filter && !add.length) return say(`✓ View already set: ${name}`);
      list = [...shown, ...add];
    }
    const visible = list.map(f => ids[f]).filter(Boolean);
    // (a timeline view has no visible fields)
    const configuration = fields.length ? `, configuration:{visibleFieldIds:${JSON.stringify(visible)}}` : "";
    await change(fresh ? `turn ${cur.name} into the view ${name}` : `${cur ? "update" : "create"} the view ${name}`, async () => {
      const id = cur ? cur.id : (await pat.graphql(`mutation($p:ID!, $n:String!) { createProjectV2View(input:{projectId:$p, name:$n,
        layout:${layout}}) { projectV2View { id } } }`, { p: p.id, n: name })).createProjectV2View.projectV2View.id;
      await pat.graphql(`mutation($v:ID!, $n:String!, $f:String!) { updateProjectV2View(input:{viewId:$v, name:$n,
        layout:${layout}, filter:$f${configuration}}) { clientMutationId } }`, { v: id, n: name, f: filter });
    });
  };
  await view("Board", "BOARD_LAYOUT", "-label:summary", BOARD_FIELDS);
  await view("Table", "TABLE_LAYOUT", "-label:summary", TABLE_FIELDS);
  await view("Interviews", "ROADMAP_LAYOUT", 'status:"In progress","On hold","Rejected after interview" -label:summary', []);
  await view("Summaries", "TABLE_LAYOUT", "label:summary", ["Title", "Created"]);
  // The API cannot set the sort of a view or the dates of a timeline: steps for you
  const sorted = (name, field, dir) => {
    const s = ((views.find(v => v.name === name) || {}).sortByFields || { nodes: [] }).nodes[0];
    if (!s || s.field.name !== field || s.direction !== dir) {
      todo.push(`Sort the ${name} view: open the view menu (▾ next to "${name}") > Sort by > ${field} > ${dir === "DESC" ? "Descending" : "Ascending"}, then Save.`);
    }
  };
  sorted("Board", "Last update", "DESC");
  sorted("Table", "Applied date", "ASC");
  sorted("Interviews", "Last update", "DESC");
  sorted("Summaries", "Created", "DESC");

  // --- The default workflows of a project use Todo/Done and work against these workflows ---
  const defaults = (await project("workflows(first:50) { nodes { id name } }")).workflows.nodes;
  for (const w of defaults) {
    try {
      await change(`remove the default workflow "${w.name}"`, () => pat.graphql(`mutation($w:ID!) {
        deleteProjectV2Workflow(input:{workflowId:$w}) { clientMutationId } }`, { w: w.id }));
    } catch (e) { todo.push(`Turn off the project workflow "${w.name}": project menu > Workflows.`); }
  }
  if (!defaults.length) say("✓ No default project workflows");

  // A copy of the template gets its own README, with the links of its board
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  if (readme.includes(PITCH) && !context.payload.repository.is_template) {
    files["README.md"] = fs.readFileSync(path.join(ROOT, "templates/README.md"), "utf8")
      .replace(/\{\{REPO\}\}/g, R).replace(/\{\{PROJECT_URL\}\}/g, p.url || `https://github.com/users/${owner}/projects/${num}`);
  }

  await commitFiles();
  return finish(p.url || `https://github.com/users/${owner}/projects/${num}`);

  // Commits the changed files in one commit with the token (a file in .github/workflows needs
  // the workflow scope)
  async function commitFiles() {
    const paths = Object.keys(files);
    if (!paths.length) return say("✓ Files already match config.yaml");
    if (dry) return paths.forEach(f => say(`(dry run) would change ${f}`));
    const branch = context.payload.repository.default_branch;
    const ref = (await pat.rest.git.getRef({ owner, repo, ref: `heads/${branch}` })).data;
    const base = (await pat.rest.git.getCommit({ owner, repo, commit_sha: ref.object.sha })).data;
    const tree = (await pat.rest.git.createTree({ owner, repo, base_tree: base.tree.sha,
      tree: paths.map(f => ({ path: f, mode: "100644", type: "blob", content: files[f] })) })).data;
    const commit = (await pat.rest.git.createCommit({ owner, repo, message: "chore: apply the settings of config.yaml",
      tree: tree.sha, parents: [ref.object.sha] })).data;
    try {
      await pat.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.sha });
      say(`✓ Changed ${paths.join(", ")}`);
    } catch (e) {
      core.warning(`The files could not be changed (${e.message}). A file in .github/workflows needs a token with the workflow scope: ${NEW_TOKEN}`);
      todo.push(`Change these files by hand, or make a token with the workflow scope and run the setup again: ${paths.join(", ")}.`);
    }
  }

  async function finish(projectUrl) {
    const mark = render.bookmarklet(fs.readFileSync(path.join(ROOT, "scripts/bookmarklet.src.js"), "utf8"), R);
    // (setup.sh reads these lines from the log)
    todo.forEach(t => core.info(`TODO ${t}`));
    core.info(`BOOKMARKLET ${mark}`);
    // The steps for you, each in its own issue (once; the open bookmark issue gets the new bookmark)
    const opened = [];
    if (!dry) {
      const branch = context.payload.repository.default_branch;
      const all = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: "all", per_page: 100 });
      const open = async (title, body, refresh) => {
        const old = all.find(i => i.title === title && !i.pull_request);
        if (old) {
          if (refresh && old.state === "open") await github.rest.issues.update({ owner, repo, issue_number: old.number, body });
          return old;
        }
        const i = (await github.rest.issues.create({ owner, repo, title, labels: [issues.LABEL], body })).data;
        say(`✓ Opened the issue "${title}"`);
        opened.push(i);
        return i;
      };
      const ctx = { owner, repo: R, branch, projectUrl, bookmarklet: mark };
      if (projectUrl) await open(issues.PREPARE, issues.prepare(ctx), false);
      await open(issues.BOOKMARK, issues.bookmark(ctx), true);
    }
    await core.summary
      .addHeading(dry ? "Setup (dry run: nothing changed)" : "Setup")
      .addList(out)
      .addHeading("Steps for you", 3)
      .addList(todo.length ? todo : ["Nothing"])
      .addHeading("The bookmark", 3)
      .addRaw("Make a new bookmark in your browser and paste this text into its URL field:", true)
      .addCodeBlock(mark)
      .addRaw(`New application form (for your phone): https://github.com/${R}/issues/new?template=application.yaml`, true)
      .write();
    // Browser setup: the "Finish the setup" issue points to the new issues, and closes
    if (!dry) {
      const { TITLE } = require("./welcome");
      const finishing = (await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: "open", per_page: 100 }))
        .filter(i => i.title === TITLE);
      const extra = todo.filter(t => !t.startsWith("Sort the "));
      for (const i of finishing) {
        await github.rest.issues.createComment({ owner, repo, issue_number: i.number, body: [
          "The setup is done.", "", ...out.map(o => `- ${o}`), "",
          ...(opened.length ? ["Next steps:", "", ...opened.map(o => `- [ ] #${o.number} ${o.title}`), ""] : []),
          // (the sort of the views is in the Prepare the board issue)
          ...(extra.length ? ["Also:", "", ...extra.map(t => `- [ ] ${t}`), ""] : []),
        ].join("\n") });
        await github.rest.issues.update({ owner, repo, issue_number: i.number, state: "closed", state_reason: "completed" });
      }
    }
    return { bookmarklet: mark, todo, dry };
  }
};
