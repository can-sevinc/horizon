// The "Enjoying Horizon?" issue: once when all the setup issues are closed, and once more on the
// 7th day of the copy. Not when you have starred Horizon already.
const TITLE = "Enjoying Horizon?";
const TEMPLATE = "can-sevinc/horizon";
const LABEL = "setup";

const body = (owner, why) => [
  `<!-- horizon:star ${why} -->`,
  `@${owner} If Horizon helps your job search, please give it a star: [${TEMPLATE}](https://github.com/${TEMPLATE}).`,
  "It takes a second and helps other job seekers find it. Thank you!",
  "",
  "You can close this issue any time.",
].join("\n");

// why: "done" (the setup issues are closed) or "day-7"
async function open({ github, pat, owner, repo, core }, why) {
  const all = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: "all", labels: LABEL, per_page: 100 });
  if (all.some(i => (i.body || "").includes(`<!-- horizon:star ${why} -->`))) return false;
  if (pat) {
    try {
      await pat.request("GET /user/starred/{owner}/{repo}", { owner: TEMPLATE.split("/")[0], repo: TEMPLATE.split("/")[1] });
      core.info("Horizon is starred already: no star issue");
      return false;
    } catch (e) { if (e.status !== 404) core.info(`Could not check the star: ${e.message}`); }
  }
  await github.rest.issues.create({ owner, repo, title: TITLE, labels: [LABEL], body: body(owner, why) });
  core.info(`Opened "${TITLE}" (${why})`);
  return true;
}

// When a setup issue closes: the star issue if no setup step is left open
async function afterSetup(ctx) {
  const { github, owner, repo } = ctx;
  const setup = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: "all", labels: LABEL, per_page: 100 });
  const steps = setup.filter(i => i.title !== TITLE);
  if (!steps.length || steps.some(i => i.state === "open")) return false;
  return open(ctx, "done");
}

// Each day (from the Doctor): on the 7th day of the copy, and up to 30 days for older copies
async function dayReminder(ctx, createdAt, now = Date.now()) {
  const days = (now - new Date(createdAt)) / 864e5;
  if (!createdAt || days < 7 || days > 30) return false;
  return open(ctx, "day-7");
}

module.exports = { TITLE, open, afterSetup, dayReminder };
