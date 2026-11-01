// Follow-up workflow: the daily reminders and the "ghosted" label.
const lib = require("./project");

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  if (!lib.onTime(context, "reminderTime")) return core.info(`Not now: this cron line is for the other UTC offset of ${lib.config.timezone}.`);
  // Separate client with the token that can write to the project board
  const pat = getOctokit(process.env.PROJECT_TOKEN);
  const items = await lib.getItems(pat, owner, Number(process.env.PROJECT_NUMBER));
  const now = Date.now();
  let ghostedLabel = false;
  for (const it of items) {
    if (!it.url.includes(`/${owner}/${repo}/`)) continue;
    // No answer for a long time: "ghosted" label, the status stays Applied
    const hasGhosted = it.labels.includes(lib.GHOSTED);
    if (!hasGhosted && lib.isGhosted(it, now)) {
      if (!ghostedLabel) {
        const l = lib.config.labels.find(l => l.name === lib.GHOSTED);
        try {
          await github.rest.issues.createLabel({ owner, repo, name: l.name, color: l.color, description: l.description });
        } catch (e) { if (e.status !== 422) throw e; }  // 422: the label exists
        ghostedLabel = true;
      }
      await github.rest.issues.addLabels({ owner, repo, issue_number: it.number, labels: [lib.GHOSTED] });
      core.info(`Ghosted: #${it.number} ${it.title}`);
    }
    // They answered after all: the process started (Rejected without interview keeps the label)
    if (hasGhosted && lib.INTERVIEWED.includes(it.status)) {
      await github.rest.issues.removeLabel({ owner, repo, issue_number: it.number, name: lib.GHOSTED });
      core.info(`Not ghosted any more: #${it.number} ${it.title}, ${it.status}`);
    }

    const reason = lib.followUpReason(it, now);
    if (!reason) continue;
    // One reminder per issue: the new one replaces the old ones
    // (a new comment, not an edit: an edited comment does not notify you)
    for (const id of it.reminderIds) {
      await github.graphql(`mutation($id:ID!) { deleteIssueComment(input:{id:$id}) { clientMutationId } }`, { id });
    }
    await github.rest.issues.createComment({
      owner, repo, issue_number: it.number,
      body: `@${owner} Reminder: ${reason}\n\n_Add the \`on-pause\` label to stop reminders._`,
    });
    core.info(`Reminded: #${it.number} ${it.title}: ${reason}`);
  }
};
