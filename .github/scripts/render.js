// The files that the setup makes from config.yaml (pure functions: text in, text out).
// See setup.js.

// The bookmark: scripts/bookmarklet.src.js on one line, with your repository in it
// (the same as scripts/make_bookmarklet.sh)
function bookmarklet(src, repo) {
  const code = src.split("\n").filter(l => !/^\s*(\/\/|$)/.test(l)).map(l => l.trim()).join(" ");
  return "javascript:" + code.replace("'USER/job-applications'", `'${repo}'`);
}

// Changes (or adds, or with an empty value removes) one attribute of a field of an issue form:
// formAttribute(text, "city", "value", "Berlin, DE")
function formAttribute(text, id, attr, value) {
  const lines = text.split("\n");
  const start = lines.findIndex(l => l.trim() === `id: ${id}`);
  if (start < 0) throw new Error(`The issue form has no field with id: ${id}`);
  let end = lines.findIndex((l, i) => i > start && /^\s*- type:/.test(l));
  if (end < 0) end = lines.length;
  const at = lines.findIndex((l, i) => i > start && i < end && new RegExp(`^\\s*${attr}:`).test(l));
  const label = lines.findIndex((l, i) => i > start && i < end && /^\s*label:/.test(l));
  const indent = (lines[label] || lines[start + 1]).match(/^\s*/)[0];
  const line = `${indent}${attr}: ${JSON.stringify(value)}`;
  if (at >= 0 && value) lines[at] = line;
  else if (at >= 0) lines.splice(at, 1);
  else if (value) lines.splice(label + 1, 0, line);
  return lines.join("\n");
}

// The new application form with the default City and the Salary range example of config.yaml
function issueForm(text, config) {
  text = formAttribute(text, "city", "value", config.city || "");
  return formAttribute(text, "salary", "placeholder", config.salaryPlaceholder || "");
}

// --- The fields of the Setup workflow ---
// The settings that the Setup workflow can change: input -> config.yaml key
const INPUTS = {
  project_title: "projectTitle", city: "city", timezone: "timezone", reminder_time: "reminderTime",
  summary_day: "summaryDay", summary_time: "summaryTime", follow_up_days: "followUpDays",
  ghosted_days: "ghostedDays", salary_placeholder: "salaryPlaceholder",
};
const SETUP_WORKFLOW = ".github/workflows/setup.yaml";

// The Setup workflow with the values of config.yaml as the defaults of its fields
function setupInputs(text, config) {
  const lines = text.split("\n");
  for (const [input, key] of Object.entries(INPUTS)) {
    const start = lines.indexOf(`      ${input}:`);
    if (start < 0) throw new Error(`The Setup workflow has no input ${input}`);
    let end = start + 1;
    while (end < lines.length && lines[end].startsWith("        ")) end++;
    const line = `        default: ${JSON.stringify(String(config[key] ?? ""))}`;
    const at = lines.findIndex((l, i) => i > start && i < end && /^\s*default:/.test(l));
    if (at >= 0) lines[at] = line;
    else lines.splice(end, 0, line);
  }
  return lines.join("\n");
}

// The defaults of the Setup workflow fields: { city: "Stockholm, SE", ... }
function inputDefaults(text) {
  const out = {};
  for (const input of Object.keys(INPUTS)) {
    const lines = text.split("\n");
    const start = lines.indexOf(`      ${input}:`);
    const m = start < 0 ? null : lines.slice(start + 1).find(l => /^\s*default:/.test(l) || !l.startsWith("        "));
    const v = m && m.match(/^\s*default:\s*(.*)$/);
    out[input] = v ? v[1].replace(/^"(.*)"$/, "$1") : "";
  }
  return out;
}

// --- The times of the scheduled workflows ---
// Github runs a schedule in UTC. A time zone with summer time has two UTC offsets in a year, so a
// workflow gets one cron line for each; the script runs only for the line of today's offset
// (project.js, onTime). The schedules: workflow file -> the config.yaml keys of its time and day.
const SCHEDULES = {
  ".github/workflows/followup.yaml": { time: "reminderTime" },
  ".github/workflows/weekly-summary.yaml": { time: "summaryTime", day: "summaryDay" },
  ".github/workflows/doctor.yaml": { time: "doctorTime" },
};
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// The UTC offset of a time zone on a date, in minutes (Europe/Stockholm in July: 120)
function offset(timezone, date) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "longOffset" })
    .formatToParts(date).find(p => p.type === "timeZoneName").value;
  const m = name.match(/GMT([+-])(\d\d):(\d\d)/);
  return m ? (m[1] === "+" ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

// The cron line for a local time ("09:23") at one UTC offset; with a day ("Monday"), weekly
function cron(time, offsetMinutes, day) {
  let minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) - offsetMinutes;
  const shift = Math.floor(minutes / 1440);
  minutes -= shift * 1440;
  const days = day ? String((DAYS.indexOf(day) + shift + 7) % 7) : "*";
  return `${minutes % 60} ${Math.floor(minutes / 60)} * * ${days}`;
}

// All the cron lines of a local time in a time zone (one for each UTC offset of the year)
function cronLines(time, timezone, day, year = new Date().getUTCFullYear()) {
  const offsets = [...new Set([0, 3, 6, 9].map(m => offset(timezone, new Date(Date.UTC(year, m, 15)))))];
  return [...new Set(offsets.map(o => cron(time, o, day)))].sort((a, b) => Number(a.split(" ")[1]) - Number(b.split(" ")[1]));
}

// A workflow file with the schedule of a time (the lines between "schedule:" and the next key)
function workflowSchedule(text, config, keys) {
  const lines = cronLines(config[keys.time], config.timezone, keys.day && config[keys.day]);
  const when = `${keys.day ? `${config[keys.day]}s, ` : "every day, "}${config[keys.time]} ${config.timezone}`;
  const block = [`    # ${when}: made by the setup from ${keys.time}${keys.day ? ` and ${keys.day}` : ""} in config.yaml`,
    "    # (one line for each UTC offset of the time zone; the script runs for today's)",
    ...lines.map(l => `    - cron: "${l}"`)];
  const re = /^(  schedule:\n)(?:    [#-].*\n)+/m;
  if (!re.test(text)) throw new Error("The workflow has no schedule");
  return text.replace(re, (_, head) => head + block.join("\n") + "\n");
}

module.exports = { bookmarklet, formAttribute, issueForm, INPUTS, SETUP_WORKFLOW, setupInputs, inputDefaults, SCHEDULES, DAYS, offset, cron, cronLines, workflowSchedule };
