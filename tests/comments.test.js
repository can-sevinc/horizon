const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const render = require("../.github/scripts/render");
const { DIR, fill, comment: renderComment, notes } = require("../.github/scripts/comments");

// The text of a comment without its icons
const comment = (name, values) => renderComment(name, values).replace(/ ?<picture>.*?<\/picture>/g, "");

test("fill: values, sections, the note at the top, and no extra blank lines", () => {
  const t = "<!-- a note\n{{x}} -->\nA {{x}}{{^x}}none{{/x}}\n\n{{#y}}\nY: {{y}}\n{{/y}}\n\nEnd";
  assert.strictEqual(fill(t, { x: "1", y: "2" }), "A 1\n\nY: 2\n\nEnd");
  assert.strictEqual(fill(t, {}), "A none\n\nEnd");
  assert.strictEqual(fill("{{x}}", { x: "{{y}}", y: "no" }), "{{y}}");
  assert.strictEqual(notes(" why ", "", "rest"), "why\n\nrest");
});

test("every comment template fills in without a {{ left", () => {
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith(".md") && f !== "README.md")) {
    const text = comment(f.slice(0, -3), {});
    assert.ok(!text.includes("{{") && !text.includes("<!--"), f);
  }
});

test("the command comments keep the lines that the reminders read", () => {
  assert.match(comment("next", { date: "2026-12-01" }), /\*\*Next step:\*\* follow up\n\*\*Next date:\*\* 2026-12-01$/);
  assert.match(comment("followedup", { date: "2026-11-03", check: "2026-11-10", notes: "sent to Ann" }),
    /^Followed up: 2026-11-03\n\n\*\*Next step:\*\* .*\n\*\*Next date:\*\* 2026-11-10\n\nsent to Ann$/);
  assert.strictEqual(comment("followedup", { date: "2026-11-03" }), "Followed up: 2026-11-03");
  assert.match(comment("interview", { date: "2026-11-03" }), /\*\*Type:\*\* screen \/ technical/);
  assert.doesNotMatch(comment("interview", { date: "2026-11-03" }), /### Notes/);
  assert.match(comment("interview", { type: "technical", notes: "n" }), /\*\*Type:\*\* technical\n[\s\S]*### Notes\nn\n\n### Next step/);
  assert.strictEqual(comment("rejected", { date: "2026-11-03", status: null }), "Rejected: 2026-11-03");
  assert.match(comment("added", { nextWeek: "2026-11-10" }), /`\/next 2026-11-10 email recruiter`[\s\S]*`\/followedup \+7`/);
});

test("{{icon:NAME}}: the light and the dark icon, and every icon of a template exists", () => {
  assert.strictEqual(fill("A {{icon:next}}", {}, "https://x/v1"), 'A <picture><source media="(prefers-color-scheme: dark)" ' +
    'srcset="https://x/v1/icons/icon-next-dark.svg"><img src="https://x/v1/icons/icon-next-light.svg" alt="" width="24" height="24"></picture>');
  const root = path.join(__dirname, "..");
  // (a copy has no docs/assets and no templates/README.md: its icons load from Horizon's site)
  if (!fs.existsSync(path.join(root, "templates/README.md"))) return;
  // (templates/comments/README.md explains {{icon:NAME}})
  const files = [...fs.readdirSync(DIR).filter(f => f !== "README.md").map(f => path.join(DIR, f)), path.join(root, "templates/README.md")];
  let used = 0;
  for (const f of files) {
    for (const [, name] of fs.readFileSync(f, "utf8").matchAll(render.ICON)) {
      used++;
      for (const v of ["light", "dark"]) {
        assert.ok(fs.existsSync(path.join(root, `docs/assets/v1/icons/icon-${name}-${v}.svg`)), `${path.basename(f)}: icon-${name}-${v}.svg`);
      }
    }
  }
  assert.ok(used > 10);
});
