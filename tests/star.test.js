const test = require("node:test");
const assert = require("node:assert");
const mock = require("./mock");
const star = require("../.github/scripts/star");

function ctx(issues, starred = false) {
  const m = mock({ issues });
  m.pat.request = async () => { if (!starred) throw Object.assign(new Error("Not Found"), { status: 404 }); return {}; };
  return { m, c: { github: m.github, pat: m.pat, core: m.core, owner: "o", repo: "r" } };
}
const created = m => m.calls.filter(([n]) => n === "create").map(([, a]) => a);

test("the star issue opens when the last setup issue is closed, once", async () => {
  const open = ctx([{ title: "Prepare the board", state: "closed" }, { title: "Add the bookmark", state: "open" }]);
  assert.strictEqual(await star.afterSetup(open.c), false);
  const done = ctx([{ title: "Prepare the board", state: "closed" }, { title: "Add the bookmark", state: "closed" }]);
  assert.strictEqual(await star.afterSetup(done.c), true);
  const [issue] = created(done.m);
  assert.strictEqual(issue.title, star.TITLE);
  assert.match(issue.body, /horizon:star done[\s\S]*github\.com\/can-sevinc\/horizon/);
  const again = ctx([{ title: "Add the bookmark", state: "closed" }, { title: star.TITLE, state: "open", body: issue.body }]);
  assert.strictEqual(await star.afterSetup(again.c), false);
});

test("the day 7 reminder: from the 7th day, not twice, not when starred", async () => {
  const day = 864e5, now = Date.parse("2026-11-10T08:00:00Z");
  const { m, c } = ctx([{ title: star.TITLE, body: "<!-- horizon:star done -->" }]);
  assert.strictEqual(await star.dayReminder(c, new Date(now - 6 * day).toISOString(), now), false);
  assert.strictEqual(await star.dayReminder(c, new Date(now - 7 * day).toISOString(), now), true);
  assert.match(created(m)[0].body, /horizon:star day-7/);
  const twice = ctx([{ title: star.TITLE, body: "<!-- horizon:star day-7 -->" }]);
  assert.strictEqual(await star.dayReminder(twice.c, new Date(now - 8 * day).toISOString(), now), false);
  const starred = ctx([], true);
  assert.strictEqual(await star.dayReminder(starred.c, new Date(now - 7 * day).toISOString(), now), false);
});
