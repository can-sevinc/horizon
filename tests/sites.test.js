const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const render = require("../.github/scripts/render");

const SRC = fs.readFileSync(path.join(__dirname, "../scripts/bookmarklet.src.js"), "utf8");
const DIR = path.join(__dirname, "sites");

// Runs the bookmark on a fake page and returns the values of the form it opens.
// page: { url, title, elements: { selector: text }, ld: [JSON-LD], selection }
function bookmark(page) {
  const el = text => ({ innerText: text, textContent: text });
  const elements = page.elements || {};
  const matches = sel => sel.split(/,\s*/).filter(s => s in elements).map(s => el(elements[s]));
  const document = {
    title: page.title || "",
    body: el(elements.body || elements.main || ""),
    querySelector: sel => matches(sel)[0] || null,
    querySelectorAll: sel => /ld\+json/.test(sel) ? (page.ld || []).map(j => ({ textContent: JSON.stringify(j) })) : matches(sel),
  };
  // HTML to text, as toText in the bookmark does it with a real DOMParser
  class DOMParser {
    parseFromString(html) {
      const text = html.replace(/<li[^>]*>/g, "- ").replace(/<\/li>|<br\s*\/?>|<\/div>/g, "\n")
        .replace(/<\/(p|h\d|ul|ol)>/g, "\n\n").replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
      return { querySelectorAll: () => [], body: { textContent: text } };
    }
  }
  let opened = null;
  const window = { open: url => { opened = url; } };
  const code = render.bookmarklet(SRC, "me/jobs").slice("javascript:".length);
  new Function("document", "location", "window", "navigator", "getSelection", "alert", "DOMParser", code)(
    document, new URL(page.url), window, { clipboard: { writeText: async () => {} } },
    () => page.selection || "", () => {}, DOMParser);
  return Object.fromEntries(new URL(opened).searchParams);
}

// tests/sites/NAME.json: a fake page of a site, and what the form must get. In "expect", a value
// must be the same; descriptionHas / descriptionHasNot: texts the description has / does not have.
const sites = fs.readdirSync(DIR).filter(f => f.endsWith(".json")).sort();
for (const file of sites) {
  const site = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
  test(`site: ${site.site} (${file})`, () => {
    const form = bookmark(site.page);
    const { descriptionHas = [], descriptionHasNot = [], ...same } = site.expect;
    for (const [k, v] of Object.entries(same)) assert.strictEqual(form[k], v, k);
    for (const t of descriptionHas) assert.ok(form.description.includes(t), `the description has "${t}"`);
    for (const t of descriptionHasNot) assert.ok(!form.description.includes(t), `the description does not have "${t}"`);
  });
}

test("every JOB_BOARDS and SECTIONS site has a test page in tests/sites", () => {
  const keys = name => [...SRC.slice(SRC.indexOf(`const ${name} = {`)).split("\n  };")[0].matchAll(/^    '([^']+)':/gm)].map(m => m[1]);
  const urls = sites.map(f => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")).page.url);
  for (const host of [...keys("JOB_BOARDS"), ...keys("SECTIONS")]) {
    assert.ok(urls.some(u => { const h = new URL(u).hostname.replace(/^www\./, ""); return h === host || h.endsWith("." + host); }),
      `${host} has no test page in tests/sites`);
  }
});
