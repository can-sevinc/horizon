// End-a-period workflow: ends the current job search period (repo variable CURRENT_PERIOD).
// With a name, the new period starts now; without one, the next application starts it,
// named by the month of its Date (YYYY-MM).
const lib = require("./project");

module.exports = async ({ github, context, core, getOctokit }) => {
  const { owner, repo } = context.repo;
  const next = ((context.payload.inputs || {}).next || "").trim().replace(/^period:\s*/, "");
  if (next && !/^[\w.-]+$/.test(next)) return core.setFailed("Use letters, numbers, -, ., or _ in the name.");
  const old = process.env.CURRENT_PERIOD;
  await lib.setVariable(getOctokit(process.env.PROJECT_TOKEN), owner, repo, "CURRENT_PERIOD", next);
  const msg = `Ended the period **${old || "(none)"}**. ` + (next
    ? `New applications get the period **${next}**.`
    : "The next application starts a new period, named by the month of its Date.");
  core.info(msg);
  await core.summary.addRaw(msg + " To take the cards of the old period off the board, run **Archive a period**.").write();
};
