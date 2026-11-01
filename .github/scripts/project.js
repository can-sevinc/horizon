// Shared helpers for the workflows (read/write the user-owned Projects v2 board).
// Status names, fields, sources, labels, and the settings: config.yaml
const config = require("./config").load();
const DAY = 864e5;
const ACTIVE = ["Applied", "In progress", "On hold", "Offer"];
const INTERVIEWED = ["In progress", "On hold", "Offer", "Rejected after interview"];
const ORDER = config.statuses.map(s => s.name);
// Issue form section -> project field
const FORM_FIELDS = Object.fromEntries(config.fields.filter(f => f.form).map(f => [f.form, f.name]));
// Source dropdown of the form -> "source: ..." label
const SOURCE_LABELS = Object.fromEntries(config.sources.map(s => [s.option, s.label]));
const DATE_FIELDS = config.fields.filter(f => f.type === "DATE").map(f => f.name);
// Number of interviews you had for the application (you set it on the card)
const INTERVIEWS = "Interviews";
// Form section with the text of the posting (postings get removed: keep a copy)
const DESCRIPTION = "Job description / recruiter message";
const NUMBER_FIELDS = config.fields.filter(f => f.type === "NUMBER").map(f => f.name);
// Statuses with no interviews: a new card in these gets Interviews = 0
const NO_INTERVIEW = ["Applied", "Rejected without interview"];
// Statuses that /next moves to "In progress": a planned step means the process has started
const NOT_STARTED = ["Wishlist", "Applied"];
// Statuses that become a rejection when you close the issue or write /rejected
// (Wishlist: you did not apply; Offer: the process ended with an offer)
const OPEN_PROCESS = ["Applied", "In progress", "On hold"];
// Label: rejected, but worth getting in touch again later
const REVISIT = "revisit later";
// Label: you stopped the process (Status: Rejected without interview)
const WITHDRAWN = "withdrawn interest";
// Labels made only when they are needed: the Doctor makes "maintenance" with its issue
const ON_DEMAND_LABELS = ["maintenance"];
// Days without a "Last update" before an "In progress" application needs a follow-up
// (the daily reminders and the weekly summary)
const FOLLOW_UP_DAYS = config.followUpDays;
// Label: Applied, and no answer for GHOSTED_DAYS days. The status stays Applied.
const GHOSTED = "ghosted";
const GHOSTED_DAYS = config.ghostedDays;

const fmt = d => d.toISOString().slice(0, 10);

// A scheduled run: true only when its cron line is the one for today's UTC offset of the time
// zone (a workflow has a line for summer time and one for winter time, see render.js). A run by
// hand is always on time.
function onTime(context, timeKey, dayKey) {
  if (context.eventName !== "schedule" || !context.payload.schedule) return true;
  const { cron, offset } = require("./render");
  return context.payload.schedule === cron(config[timeKey], offset(config.timezone, new Date()), dayKey && config[dayKey]);
}

// A follow-up reminder comment: written by the workflow, starts with "@owner Reminder:"
const isReminder = c => c.author && c.author.login === "github-actions" && /^@\S+ Reminder:/.test(c.body || "");

// Read a "### Title\n\nvalue" section from an issue-form body.
function field(body, title) {
  const esc = title.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
  const m = (body || "").match(new RegExp(`### ${esc}\\s+([^\\n]+)`));
  if (!m) return null;
  const v = m[1].trim();
  return v === "_No response_" ? null : v;
}

// A link on one of the job boards in config.yaml (jobBoards: hosts, a subdomain counts too)
function isJobBoard(link) {
  const host = (link.trim().toLowerCase().match(/^(?:\w+:\/\/)?([^/?#]+)/) || [])[1] || "";
  return (config.jobBoards || []).some(b => host === b || host.endsWith("." + b));
}

// Source of an issue with an empty Source dropdown, from its Job link (as in scripts/import_csv.py).
function guessSource(body) {
  const link = field(body, "Job link");
  if (!link) return "Recruiter outreach";
  if (/linkedin\.com\/jobs/.test(link)) return "LinkedIn job post";
  return isJobBoard(link) ? "Job board" : "Company website";
}

// Latest "**Next date:** YYYY-MM-DD" (and "**Next step:** ...") found in the comments.
function lastNext(comments) {
  for (let i = comments.length - 1; i >= 0; i--) {
    const b = comments[i].body || "";
    const d = b.match(/\*\*Next date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    if (d) {
      const s = b.match(/\*\*Next step:\*\*[ \t]*([^\n]*)/);
      return { date: new Date(d[1] + "T00:00:00Z"), step: (s && s[1].trim()) || "" };
    }
  }
  return null;
}

// Dates of the "/interview" notes in the comments ("## Interview: YYYY-MM-DD"), oldest first.
function interviewDates(comments) {
  return comments.map(c => (c.body || "").match(/^## Interview: (\d{4}-\d{2}-\d{2})/))
    .filter(Boolean).map(m => new Date(m[1] + "T00:00:00Z")).sort((a, b) => a - b);
}

async function getProject(pat, owner, number) {
  const r = await pat.graphql(`query($owner:String!, $number:Int!) {
    user(login:$owner) { projectV2(number:$number) {
      id number
      field(name:"Status") { ... on ProjectV2SingleSelectField { id options { id name } } }
      fields(first:50) { nodes { ... on ProjectV2FieldCommon { id name } } }
    } } }`, { owner, number });
  const p = r.user.projectV2;
  return {
    id: p.id,
    number: p.number,
    statusFieldId: p.field.id,
    options: Object.fromEntries(p.field.options.map(o => [o.name, o.id])),
    fieldIds: Object.fromEntries(p.fields.nodes.map(f => [f.name, f.id])),
  };
}

// The issue's card on this project (null when it is not on the board or archived).
async function findItem(pat, project, issueNodeId) {
  const r = await pat.graphql(`query($id:ID!) { node(id:$id) { ... on Issue {
    projectItems(first:10, includeArchived:false) { nodes { id project { number } } } } } }`,
    { id: issueNodeId });
  const item = r.node.projectItems.nodes.find(n => n.project.number === project.number);
  return item ? item.id : null;
}

async function archiveItem(pat, project, itemId) {
  await pat.graphql(`mutation($p:ID!, $i:ID!) {
    archiveProjectV2Item(input:{projectId:$p, itemId:$i}) { clientMutationId } }`,
    { p: project.id, i: itemId });
}

// values: { "Field name": "text", "YYYY-MM-DD" or a number }. Empty values and unknown fields are skipped.
async function setFields(pat, project, itemId, values) {
  for (const [name, value] of Object.entries(values)) {
    const fieldId = project.fieldIds[name];
    if (!fieldId || value === null || value === undefined || value === "") continue;
    const isDate = DATE_FIELDS.includes(name);
    if (isDate && !/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
    const v = isDate ? { date: value } : NUMBER_FIELDS.includes(name) ? { number: Number(value) } : { text: value };
    await pat.graphql(`mutation($p:ID!, $i:ID!, $f:ID!, $v:ProjectV2FieldValue!) {
      updateProjectV2ItemFieldValue(input:{projectId:$p, itemId:$i, fieldId:$f, value:$v}) {
        projectV2Item { id } } }`,
      { p: project.id, i: itemId, f: fieldId, v });
  }
}

// Project field values from the issue-form body.
function formValues(body) {
  const out = {};
  for (const [section, name] of Object.entries(FORM_FIELDS)) out[name] = field(body, section);
  return out;
}

// Creates or changes a repository variable; an empty value deletes it (the token needs the repo scope)
async function setVariable(pat, owner, repo, name, value) {
  if (!value) {
    try {
      await pat.request("DELETE /repos/{owner}/{repo}/actions/variables/{name}", { owner, repo, name });
    } catch (e) { if (e.status !== 404) throw e; }
    return;
  }
  try {
    await pat.request("PATCH /repos/{owner}/{repo}/actions/variables/{name}", { owner, repo, name, value });
  } catch (e) {
    if (e.status !== 404) throw e;
    await pat.request("POST /repos/{owner}/{repo}/actions/variables", { owner, repo, name, value });
  }
}

async function addItem(pat, projectId, contentId) {
  const r = await pat.graphql(`mutation($p:ID!, $c:ID!) {
    addProjectV2ItemById(input:{projectId:$p, contentId:$c}) { item { id } } }`,
    { p: projectId, c: contentId });
  return r.addProjectV2ItemById.item.id;
}

async function setStatus(pat, project, itemId, status) {
  const optionId = project.options[status];
  if (!optionId) throw new Error(`Status option "${status}" not found on the board`);
  await pat.graphql(`mutation($p:ID!, $i:ID!, $f:ID!, $o:String!) {
    updateProjectV2ItemFieldValue(input:{projectId:$p, itemId:$i, fieldId:$f,
      value:{singleSelectOptionId:$o}}) { projectV2Item { id } } }`,
    { p: project.id, i: itemId, f: project.statusFieldId, o: optionId });
}

// Status name and Interviews of a card (null = not filled in).
async function getCard(pat, itemId) {
  const r = await pat.graphql(`query($i:ID!) { node(id:$i) { ... on ProjectV2Item {
    status: fieldValueByName(name:"Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
    interviews: fieldValueByName(name:"Interviews") { ... on ProjectV2ItemFieldNumberValue { number } } } } }`,
    { i: itemId });
  const n = r.node;
  return {
    status: (n.status && n.status.name) || null,
    interviews: n.interviews && typeof n.interviews.number === "number" ? n.interviews.number : null,
  };
}

// The process stopped: Rejected after / without interview by the Interviews field.
// Returns the new status, or null when the status stays (Wishlist, Offer, already rejected).
async function reject(pat, project, itemId) {
  const card = await getCard(pat, itemId);
  if (!OPEN_PROCESS.includes(card.status)) return null;
  const status = card.interviews > 0 ? "Rejected after interview" : "Rejected without interview";
  await setStatus(pat, project, itemId, status);
  return status;
}

// Cards of the board (archived cards too with { archived: true }, for the export)
async function getItems(pat, owner, number, { archived = false } = {}) {
  const q = `query($owner:String!, $number:Int!, $after:String) {
    user(login:$owner) { projectV2(number:$number) {
      items(first:50, after:$after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id isArchived
          status: fieldValueByName(name:"Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          applied: fieldValueByName(name:"Applied date") { ... on ProjectV2ItemFieldDateValue { date } }
          lastUpdate: fieldValueByName(name:"Last update") { ... on ProjectV2ItemFieldDateValue { date } }
          interviews: fieldValueByName(name:"Interviews") { ... on ProjectV2ItemFieldNumberValue { number } }
          content { ... on Issue {
            number title url state createdAt updatedAt closedAt body
            labels(first:20) { nodes { name } }
            comments(last:30) { nodes { id body author { login } } }
          } }
        } } } } }`;
  const items = [];
  let after = null;
  do {
    const r = await pat.graphql(q, { owner, number, after });
    const page = r.user.projectV2.items;
    for (const n of page.nodes) {
      if (n.isArchived && !archived) continue;  // archived cards are out of the reminders and the summary
      const c = n.content;
      if (!c || !c.number) continue;
      const labels = c.labels.nodes.map(l => l.name);
      if (labels.includes("summary")) continue;  // weekly summaries are on the board too
      if (labels.includes("redirected")) continue;  // counted in the process it was moved to
      items.push({
        itemId: n.id, archived: n.isArchived, body: c.body,
        status: (n.status && n.status.name) || "(no status)",
        number: c.number, title: c.title, url: c.url, state: c.state,
        createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt),
        appliedAt: new Date((n.applied && n.applied.date) ? n.applied.date + "T00:00:00Z" : c.createdAt),
        lastUpdate: n.lastUpdate && n.lastUpdate.date ? new Date(n.lastUpdate.date + "T00:00:00Z") : null,
        closedAt: c.closedAt ? new Date(c.closedAt) : null,
        // null = not filled in
        interviews: n.interviews && typeof n.interviews.number === "number" ? n.interviews.number : null,
        labels,
        hasDescription: !!field(c.body, DESCRIPTION),
        source: (labels.find(l => l.startsWith("source: ")) || "source: unknown").slice(8),
        next: lastNext(c.comments.nodes),
        interviewDates: interviewDates(c.comments.nodes),
        reminderIds: c.comments.nodes.filter(isReminder).map(n => n.id),
      });
    }
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return items;
}

// Why (if at all) this application needs a follow-up today (null = no).
// - "In progress" and the "Last update" field is `days` or more days old (every day until you change it)
// - the day after a planned step (/next): write the interview notes
// - "revisit later" label (open or closed): every day while there is no /next date today or later
function followUpReason(it, now, days = FOLLOW_UP_DAYS) {
  if (it.labels.includes("on-pause")) return null;
  if (it.labels.includes(REVISIT)) {
    const today = Math.floor(now / DAY) * DAY;
    if (it.next && it.next.date.getTime() >= today) return null;  // planned
    return (it.next ? `The planned step${it.next.step ? ` “${it.next.step}”` : ""} was on ${fmt(it.next.date)}. ` : "") +
      "Decide when to get in touch again: comment `/next YYYY-MM-DD what`.";
  }
  if (it.state !== "OPEN") return null;
  if (it.next && ACTIVE.includes(it.status) && Math.floor((now - it.next.date.getTime()) / DAY) === 1) {
    return `The planned step${it.next.step ? ` “${it.next.step}”` : ""} was on ${fmt(it.next.date)}. ` +
      "Write your notes: comment `/interview`.";
  }
  if (it.status === "In progress") {
    const last = it.lastUpdate || it.appliedAt;
    const age = Math.floor((now - last.getTime()) / DAY);
    if (age >= days) {
      return `Last update was ${fmt(last)} (${age} days ago). Time to follow up? ` +
        "When something happens, change **Last update** on the card.";
    }
  }
  return null;
}

// No answer: an open "Applied" application with no "Last update" for GHOSTED_DAYS days.
function isGhosted(it, now) {
  if (it.state !== "OPEN" || it.status !== "Applied" || it.labels.includes("on-pause")) return false;
  const last = it.lastUpdate || it.appliedAt;
  return Math.floor((now - last.getTime()) / DAY) >= GHOSTED_DAYS;
}

// Set fields on the card of issue `number` in this repository (for example "Last update").
async function setIssueFields(pat, project, owner, repo, number, values) {
  const r = await pat.graphql(`query($o:String!, $r:String!, $n:Int!) {
    repository(owner:$o, name:$r) { issue(number:$n) { id } } }`, { o: owner, r: repo, n: number });
  const itemId = await findItem(pat, project, r.repository.issue.id);
  if (itemId) await setFields(pat, project, itemId, values);
  return itemId;
}

module.exports = {
  config, onTime, DAY, FOLLOW_UP_DAYS, GHOSTED, GHOSTED_DAYS, SOURCE_LABELS, ACTIVE, INTERVIEWED, ORDER, NOT_STARTED, OPEN_PROCESS, REVISIT, WITHDRAWN, ON_DEMAND_LABELS, INTERVIEWS, NO_INTERVIEW, DESCRIPTION, fmt, field, guessSource, lastNext, formValues,
  getProject, setVariable, addItem, setStatus, getCard, reject, findItem, archiveItem, setFields, setIssueFields, getItems, followUpReason, isGhosted,
};
