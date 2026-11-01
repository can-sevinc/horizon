// Unit tests of the shared helpers. Run: node --test "tests/*.test.js"
const test = require("node:test");
const assert = require("node:assert");
const lib = require("../.github/scripts/project");

const section = (title, value) => `### ${title}\n\n${value || "_No response_"}`;

test("field reads a section, and _No response_ is empty", () => {
  const body = [section("Company", "Acme"), section("Job description / recruiter message", "")].join("\n\n");
  assert.strictEqual(lib.field(body, "Company"), "Acme");
  assert.strictEqual(lib.field(body, lib.DESCRIPTION), null);
  assert.strictEqual(lib.field(body, "Position"), null);
});

test("guessSource from the Job link", () => {
  const guess = link => lib.guessSource(section("Job link", link));
  assert.strictEqual(guess(""), "Recruiter outreach");
  assert.strictEqual(guess("https://www.linkedin.com/jobs/view/1/"), "LinkedIn job post");
  assert.strictEqual(guess("https://thehub.io/jobs/abc"), "Job board");
  assert.strictEqual(guess("thehub.io/jobs/abc"), "Job board");
  assert.strictEqual(guess("https://nothehub.io/jobs/abc"), "Company website");
  assert.strictEqual(guess("https://acme.com/careers/1"), "Company website");
  assert.strictEqual(guess("https://arbetsformedlingen.se/platsbanken/annonser/1"), "Job board");
  assert.strictEqual(guess("https://se.indeed.com/viewjob?jk=1"), "Job board");
  assert.strictEqual(guess("https://emp.jobylon.com/jobs/1"), "Company website");
});

test("every job board host is a Source option", () => {
  assert.ok(lib.config.sources.some(s => s.option === "Job board"));
  for (const b of lib.config.jobBoards) assert.match(b, /^[a-z0-9.-]+\.[a-z]+$/);
});

test("every job board and JOB_BOARDS site is in docs/supported-sites.md", () => {
  const fs = require("fs");
  const list = fs.readFileSync(`${__dirname}/../docs/supported-sites.md`, "utf8");
  const src = fs.readFileSync(`${__dirname}/../scripts/bookmarklet.src.js`, "utf8");
  const keys = [...src.slice(src.indexOf("const JOB_BOARDS")).split("\n  };")[0].matchAll(/^    '([^']+)':/gm)].map(m => m[1]);
  assert.ok(keys.length > 0);
  for (const host of [...keys, ...lib.config.jobBoards]) assert.ok(list.includes(host), `${host} is not in docs/supported-sites.md`);
});
