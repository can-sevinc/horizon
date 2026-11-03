const test = require("node:test");
const assert = require("node:assert");
const telemetry = require("../.github/scripts/telemetry");

test("the counter gets only the event name, and nothing with telemetry: false", async () => {
  const urls = [];
  const send = telemetry.send;
  telemetry.send = async url => { urls.push(url); return { ok: true, json: async () => ({ success: true, count: 2 }) }; };
  try {
    const counted = [];
    const core = { info: m => counted.push(m) };
    await telemetry.count("install", { telemetry: false }, core);
    assert.deepStrictEqual(urls, []);
    await telemetry.count("install", { telemetry: true }, core);
    assert.strictEqual(urls.length, 1);
    assert.deepStrictEqual(urls, [telemetry.COUNTER + "install"]);
    assert.match(counted[1], /^Counted: install, now 2 /);
    // An error of the counter is in the log, and the setup goes on
    const log = [];
    telemetry.send = async () => ({ ok: false, status: 400 });
    await telemetry.count("install", { telemetry: true }, { info: m => log.push(m) });
    assert.match(log[0], /^Not counted: the counter answered 400/);
  } finally { telemetry.send = send; }
});
