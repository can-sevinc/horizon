// Weekly summary workflow: a new summary issue each Monday.
const lib = require("./project");

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  if (!lib.onTime(context, "summaryTime", "summaryDay")) return core.info(`Not now: this cron line is for the other UTC offset of ${lib.config.timezone}.`);
  // Separate client with the token that can write to the project board
  const pat = getOctokit(process.env.PROJECT_TOKEN);
  const items = await lib.getItems(pat, owner, Number(process.env.PROJECT_NUMBER));
  const now = Date.now();
  const weekAgo = now - 7 * lib.DAY;
  const link = it => `[${it.title}](${it.url})`;
  const out = [`@${owner} here is your weekly job search summary`, ""];

  // Pipeline
  const counts = {};
  for (const it of items) counts[it.status] = (counts[it.status] || 0) + 1;
  out.push("### Pipeline", "", "| Status | Count |", "|---|---:|");
  const statuses = [...lib.ORDER, ...Object.keys(counts).filter(s => !lib.ORDER.includes(s))];
  const withdrawnAll = items.filter(it => it.labels.includes(lib.WITHDRAWN)).length;
  // No answer for a long time: the label, or the same rule as the follow-up workflow (it runs later)
  const ghosted = it => it.labels.includes(lib.GHOSTED) || lib.isGhosted(it, now);
  const ghostedOpen = items.filter(it => ghosted(it) && it.status === "Applied" && it.state === "OPEN")
    .sort((a, b) => a.appliedAt - b.appliedAt);
  for (const s of statuses) {
    if (counts[s]) out.push(`| ${s} | ${counts[s]} |`);
    if (s === "Applied" && ghostedOpen.length) out.push(`| ↳ of which ghosted | ${ghostedOpen.length} |`);
    // You stopped these processes: they are "Rejected without interview" with a label
    if (s === "Rejected without interview" && withdrawnAll) out.push(`| ↳ of which withdrawn interest (you) | ${withdrawnAll} |`);
  }

  // Coming up: a "Last update" today or later is a planned event (also /next dates)
  const today = new Date(lib.fmt(new Date()) + "T00:00:00Z").getTime();
  const upcoming = items.map(it => {
    // ("revisit later" issues count even when closed or rejected)
    const revisit = it.labels.includes(lib.REVISIT);
    if (!revisit && (it.state !== "OPEN" || !lib.ACTIVE.includes(it.status))) return null;
    // (a new application has Last update = Applied date: not a planned event)
    const planned = it.lastUpdate && it.lastUpdate.getTime() >= today &&
      it.lastUpdate.getTime() !== it.appliedAt.getTime();
    const date = planned ? it.lastUpdate
      : it.next && it.next.date.getTime() >= today ? it.next.date : null;
    if (!date) return null;
    const step = it.next && it.next.date.getTime() === date.getTime() ? it.next.step : "";
    return { it, date, step };
  }).filter(Boolean).sort((a, b) => a.date - b.date);

  // Last 7 days (today and the 6 days before), by the "Applied date" and "Last update" fields
  const recent = d => d && d.getTime() <= now && d.getTime() >= today - 6 * lib.DAY;
  const REJECTED = ["Rejected after interview", "Rejected without interview"];
  const byLastUpdate = (a, b) => b.lastUpdate - a.lastUpdate;
  const fresh = items.filter(it => recent(it.appliedAt) && it.status !== "Wishlist")
    .sort((a, b) => b.appliedAt - a.appliedAt);
  const updated = items.filter(it => recent(it.lastUpdate)).sort(byLastUpdate);
  const rejected = updated.filter(it => REJECTED.includes(it.status));
  const other = updated.filter(it => !REJECTED.includes(it.status) && !fresh.includes(it) &&
    !upcoming.some(u => u.it === it));
  // The 7 days before (7 to 13 days ago), counted the same way, to compare
  const before = d => d && d.getTime() >= today - 13 * lib.DAY && d.getTime() < today - 6 * lib.DAY;
  const week = inWeek => ({
    applications: items.filter(it => inWeek(it.appliedAt) && it.status !== "Wishlist").length,
    interviews: items.reduce((n, it) => n + it.interviewDates.filter(inWeek).length, 0),
    rejected: items.filter(it => inWeek(it.lastUpdate) && REJECTED.includes(it.status)).length,
  });
  const [now7, before7] = [week(recent), week(before)];
  const change = (a, b) => a > b ? `↑ ${a - b}` : a < b ? `↓ ${b - a}` : "=";
  out.push("", "### Last 7 days", "", "| | Last 7 days | The 7 days before | Change |", "|---|---:|---:|:---:|");
  for (const [key, name] of [["applications", "New applications"], ["interviews", "Interviews (`/interview`)"], ["rejected", "Rejected"]]) {
    out.push(`| ${name} | ${now7[key]} | ${before7[key]} | ${change(now7[key], before7[key])} |`);
  }
  out.push("", `**New applications:** ${fresh.length}`);
  fresh.forEach(it => out.push(`- ${lib.fmt(it.appliedAt)}, ${link(it)}`));
  const withdrawn = it => it.labels.includes(lib.WITHDRAWN);
  const nWithdrawn = rejected.filter(withdrawn).length;
  out.push("", `**Rejected:** ${rejected.length}` + (nWithdrawn ? ` (${nWithdrawn} withdrawn interest)` : ""));
  rejected.forEach(it => out.push(`- ${lib.fmt(it.lastUpdate)}, ${link(it)}, ${it.status}` +
    (withdrawn(it) ? " (withdrawn interest)" : "")));
  out.push("", `**Other updates:** ${other.length}`);
  other.forEach(it => out.push(`- ${lib.fmt(it.lastUpdate)}, ${link(it)}, ${it.status}`));

  out.push("", "### Coming up", "");
  if (upcoming.length) upcoming.forEach(({ it, date, step }) =>
    out.push(`- **${lib.fmt(date)}**, ${link(it)}, ${it.status}${step ? `: ${step}` : ""}`));
  else out.push("_Nothing planned. Use `/next` in an issue to plan steps._");

  // Needs follow-up
  const fu = items.map(it => [it, lib.followUpReason(it, now)]).filter(([, r]) => r);
  out.push("", "### Needs follow-up", "");
  if (fu.length) fu.forEach(([it, r]) => out.push(`- ${link(it)}, ${r}`));
  else out.push("_All good_");

  // Ghosted: still Applied, no answer for ghostedDays
  const ghostedAll = items.filter(ghosted);
  out.push("", "### Ghosted", "", `**Open:** ${ghostedOpen.length} (Applied, no answer for ${lib.GHOSTED_DAYS}+ days) · **All time:** ${ghostedAll.length}`);
  ghostedOpen.forEach(it => out.push(`- ${lib.fmt(it.appliedAt)}, ${link(it)}, ` +
    `${Math.floor((now - (it.lastUpdate || it.appliedAt).getTime()) / lib.DAY)} days`));

  // Open applications without the text of the posting (it can be removed any day)
  const noDescription = items.filter(it => it.state === "OPEN" && !it.hasDescription &&
    (it.status === "Wishlist" || lib.ACTIVE.includes(it.status)));
  if (noDescription.length) {
    out.push("", "### No job description", "", "Paste the posting into these issues before it is removed:");
    noDescription.forEach(it => out.push(`- ${link(it)}, ${it.status}`));
  }

  // Wishlist
  const wish = items.filter(it => it.status === "Wishlist" && it.state === "OPEN");
  const staleWish = wish.filter(it => it.createdAt.getTime() < weekAgo);
  out.push("", "### Wishlist", "", `${wish.length} saved posting(s).`);
  if (staleWish.length) {
    out.push("Saved more than a week ago. Apply or drop them:");
    staleWish.forEach(it => out.push(`- ${link(it)}`));
  }

  // All time: interviews (the "Interviews" field) and by source
  const applied = items.filter(it => it.status !== "Wishlist");
  const sum = list => list.reduce((n, it) => n + (it.interviews || 0), 0);
  // Reached an interview but "Interviews" is empty or 0: fill it in on the card
  const missing = applied.filter(it => lib.INTERVIEWED.includes(it.status) && !it.interviews);
  out.push("", "### All time", "", `**Interviews:** ${sum(applied)} in ${applied.filter(it => it.interviews > 0).length} application(s)`);
  out.push("", "| Status | Applications | Interviews |", "|---|---:|---:|");
  for (const s of statuses) {
    const list = applied.filter(it => it.status === s);
    if (list.length && lib.INTERVIEWED.includes(s)) out.push(`| ${s} | ${list.length} | ${sum(list)} |`);
  }
  if (missing.length) {
    out.push("", `**Interviews** not filled in (${missing.length}):`);
    missing.forEach(it => out.push(`- ${link(it)}, ${it.status}`));
  }

  // Durations in days from the Applied date: median, average, and the number of applications.
  // (Last update = Applied date means no date for the answer, for example an imported row: left out)
  const days = (from, to) => Math.round((to - from) / lib.DAY);
  const answered = it => it.lastUpdate && it.lastUpdate.getTime() !== it.appliedAt.getTime();
  const durations = [
    ["Applied → rejection without interview", applied.filter(it => it.status === "Rejected without interview" &&
      answered(it) && !withdrawn(it) && !ghosted(it)).map(it => days(it.appliedAt, it.lastUpdate))],
    ["Applied → first interview (`/interview`)", applied.filter(it => it.interviewDates.length)
      .map(it => days(it.appliedAt, it.interviewDates[0]))],
    ["Applied → rejection after interview", applied.filter(it => it.status === "Rejected after interview" && answered(it))
      .map(it => days(it.appliedAt, it.lastUpdate))],
    ["Open processes (In progress, On hold): since applied", applied.filter(it => it.state === "OPEN" &&
      ["In progress", "On hold"].includes(it.status)).map(it => days(it.appliedAt, now))],
  ].map(([name, list]) => [name, list.filter(n => n >= 0).sort((a, b) => a - b)]).filter(([, list]) => list.length);
  if (durations.length) {
    out.push("", "#### Durations (days)", "", "| | Median | Average | Applications |", "|---|---:|---:|---:|");
    for (const [name, list] of durations) {
      const mid = list.length >> 1;
      const median = list.length % 2 ? list[mid] : Math.round((list[mid - 1] + list[mid]) / 2);
      const avg = Math.round(list.reduce((a, b) => a + b, 0) / list.length);
      out.push(`| ${name} | ${median} | ${avg} | ${list.length} |`);
    }
  }

  const bySource = {};
  for (const it of applied) {
    const s = (bySource[it.source] = bySource[it.source] || { total: 0, interviewed: 0, interviews: 0, ghosted: 0 });
    s.total++;
    if (ghosted(it)) s.ghosted++;
    if (lib.INTERVIEWED.includes(it.status)) s.interviewed++;
    s.interviews += it.interviews || 0;
  }
  out.push("", "#### By source", "", "| Source | Applications | Reached interview | Rate | Interviews | Ghosted |", "|---|---:|---:|---:|---:|---:|");
  for (const [src, s] of Object.entries(bySource).sort((a, b) => b[1].total - a[1].total)) {
    out.push(`| ${src} | ${s.total} | ${s.interviewed} | ${Math.round(100 * s.interviewed / s.total)}% | ${s.interviews} | ${s.ghosted} |`);
  }

  // By CV version ("CV / cover letter version" in the form): which CV gets answers and interviews
  const byCv = {};
  for (const it of applied) {
    const cv = lib.field(it.body, "CV / cover letter version");
    if (!cv) continue;
    const s = (byCv[cv] = byCv[cv] || { total: 0, answered: 0, interviewed: 0, interviews: 0 });
    s.total++;
    if (it.status !== "Applied") s.answered++;
    if (lib.INTERVIEWED.includes(it.status)) s.interviewed++;
    s.interviews += it.interviews || 0;
  }
  if (Object.keys(byCv).length) {
    const pct = (n, of) => `${Math.round(100 * n / of)}%`;
    out.push("", "#### By CV version", "", "| CV | Applications | Answered | Reached interview | Rate | Interviews |", "|---|---:|---:|---:|---:|---:|");
    for (const [cv, s] of Object.entries(byCv).sort((a, b) => b[1].total - a[1].total)) {
      out.push(`| ${cv} | ${s.total} | ${s.answered} (${pct(s.answered, s.total)}) | ${s.interviewed} | ${pct(s.interviewed, s.total)} | ${s.interviews} |`);
    }
    out.push("", "_Answered: the status is no longer Applied (a rejection counts too)._");
  }

  // Replace last week's summary
  const old = await github.paginate(github.rest.issues.listForRepo,
    { owner, repo, state: "open", labels: "summary", per_page: 100 });
  for (const i of old) {
    await github.rest.issues.update({ owner, repo, issue_number: i.number, state: "closed" });
  }
  const created = await github.rest.issues.create({
    owner, repo, labels: ["summary"],
    title: `Weekly summary ${lib.fmt(new Date())}`,
    body: out.join("\n"),
  });
  // On the project too, for the "Summaries" view
  const project = await lib.getProject(pat, owner, Number(process.env.PROJECT_NUMBER));
  await lib.addItem(pat, project.id, created.data.node_id);
};
