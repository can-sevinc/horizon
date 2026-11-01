// Archive-period workflow: archives the cards of the issues with the label "period: <period>".
const lib = require("./project");

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  const { period, close } = context.payload.inputs;
  const label = `period: ${period.trim().replace(/^period:\s*/, "")}`;
  const issues = await github.paginate(github.rest.issues.listForRepo,
    { owner, repo, state: "all", labels: label, per_page: 100 });
  if (!issues.length) {
    core.setFailed(`No issues with the label "${label}"`);
    return;
  }
  // Separate client with the token that can write to the project board
  const pat = getOctokit(process.env.PROJECT_TOKEN);
  const project = await lib.getProject(pat, owner, Number(process.env.PROJECT_NUMBER));
  let archived = 0;
  for (const i of issues) {
    if (i.pull_request) continue;
    // (with this token, closing does not run sync.yaml: the status stays)
    if ((close === true || close === "true") && i.state === "open") {
      await github.rest.issues.update({ owner, repo, issue_number: i.number, state: "closed", state_reason: "not_planned" });
      core.info(`Closed: #${i.number} ${i.title}`);
    }
    const itemId = await lib.findItem(pat, project, i.node_id);
    if (!itemId) continue;  // not on the board, or already archived
    await lib.archiveItem(pat, project, itemId);
    archived++;
    core.info(`Archived: #${i.number} ${i.title}`);
  }
  core.notice(`${label}: ${archived} card(s) archived, ${issues.length} issue(s) with the label`);
};
