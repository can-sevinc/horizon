// Export workflow: all applications (issues + project fields) as applications.json and
// applications.csv, in a workflow artifact. The JSON has the format of the import (version 1).
const fs = require("fs");
const lib = require("./project");

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner } = context.repo;
  // (A run without inputs, for example from gh workflow run, has none: the defaults)
  const { period = "", archived = true } = context.payload.inputs || {};
  const label = period.trim() && `period: ${period.trim().replace(/^period:\s*/, "")}`;
  const pat = getOctokit(process.env.PROJECT_TOKEN);
  const items = await lib.getItems(pat, owner, Number(process.env.PROJECT_NUMBER), { archived: String(archived) === "true" });
  const f = (it, name) => lib.field(it.body, name) || "";
  // A whole section, also with more than one line
  const text = (it, name) => {
    const m = (it.body || "").match(new RegExp(`### ${name}\\s+([\\s\\S]*?)(?=\\n### |$)`));
    const v = m ? m[1].trim() : "";
    return v === "_No response_" ? "" : v;
  };
  const date = d => d ? lib.fmt(d) : null;
  const applications = items.filter(it => !label || it.labels.includes(label)).map(it => ({
    id: `issue-${it.number}`,
    company: f(it, "Company"),
    position: f(it, "Position"),
    date: date(it.appliedAt),
    status: it.status,
    withdrawn: it.labels.includes(lib.WITHDRAWN),
    source: f(it, "Source"),
    period: (it.labels.find(l => l.startsWith("period: ")) || "").slice(8),
    city: f(it, "City"),
    salary: f(it, "Salary range"),
    recruiter: f(it, "Recruiter / contact"),
    link: f(it, "Job link"),
    interviews: it.interviews,
    lastUpdate: date(it.lastUpdate),
    timeline: it.interviewDates.map(d => ({ date: date(d), event: "Interview" })),
    notes: text(it, "First impressions"),
    issue: it.url,
    state: it.state.toLowerCase(),
    archived: it.archived,
    labels: it.labels,
  })).sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  fs.mkdirSync("export", { recursive: true });
  fs.writeFileSync("export/applications.json", JSON.stringify(
    { version: 1, generatedBy: "export workflow", exportedAt: new Date().toISOString(), applications }, null, 2) + "\n");
  const cols = ["company", "position", "date", "status", "withdrawn", "source", "period", "city", "salary",
    "recruiter", "link", "interviews", "lastUpdate", "notes", "issue", "state", "archived"];
  const cell = v => /[",\n]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? "");
  fs.writeFileSync("export/applications.csv",
    [cols.join(","), ...applications.map(a => cols.map(c => cell(a[c])).join(","))].join("\n") + "\n");
  core.info(`${applications.length} applications exported`);
  await core.summary.addRaw(`**${applications.length} applications exported**` + (label ? ` (\`${label}\`)` : "") +
    ". Download the **applications** artifact below, or run `gh run download` on your computer.").write();
};
