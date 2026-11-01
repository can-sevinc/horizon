const test = require("node:test");
const assert = require("node:assert");
const telemetry = require("../.github/scripts/telemetry");

test("the counter gets only the event name, and nothing with telemetry: false", async () => {
  const urls = [];
  const send = telemetry.send;
  telemetry.send = async url => { urls.push(url); return {}; };
  try {
    const core = { info() {} };
    await telemetry.count("install", { telemetry: false }, core);
    assert.deepStrictEqual(urls, []);
    await telemetry.count("install", { telemetry: true }, core);
    assert.strictEqual(urls.length, 1);
    const u = new URL(urls[0]);
    assert.strictEqual(u.origin + u.pathname, telemetry.COUNTER);
    assert.deepStrictEqual([...u.searchParams.keys()], ["p", "e", "rnd"]);
    assert.strictEqual(u.searchParams.get("p"), "install");
  } finally { telemetry.send = send; }
});
