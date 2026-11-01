const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");

// The same as scripts/make_bookmarklet.sh: no comment lines, one line
test("the bookmarklet is valid JavaScript on one line", () => {
  const src = fs.readFileSync(`${__dirname}/../scripts/bookmarklet.src.js`, "utf8");
  const line = src.split("\n").filter(l => !/^\s*(\/\/|$)/.test(l)).map(l => l.trim()).join(" ");
  assert.doesNotThrow(() => new Function(line));
  // A "//" comment after code would comment out the rest of the line
  assert.ok(!src.split("\n").some(l => /\S.*\s\/\/\s/.test(l) && !/^\s*\/\//.test(l) && !/['"`].*\/\/.*['"`]/.test(l)));
});
