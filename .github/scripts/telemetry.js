// The anonymous counter (telemetry in config.yaml): adds 1 to the public count "install" at
// https://abacus.jasoncameron.dev/get/can-sevinc-horizon/install, once, when the setup makes a
// board. Every board counts (no unique visitors, no bot filter). Only the name of the event is
// sent: no repository, user, or data.
const COUNTER = "https://abacus.jasoncameron.dev/hit/can-sevinc-horizon/";

async function count(event, config, core) {
  if (config.telemetry === false) return core.info(`Not counted (telemetry: false in config.yaml): ${event}`);
  // (never from the tests, unless a test replaced send)
  if (process.env.NODE_TEST_CONTEXT && module.exports.send === send) return;
  try {
    const res = await module.exports.send(COUNTER + encodeURIComponent(event));
    if (!res.ok) throw new Error(`the counter answered ${res.status}`);
    const { value } = await res.json();
    core.info(`Counted: ${event}, now ${value} (anonymous, turn off with telemetry: false in config.yaml)`);
  } catch (e) {
    core.info(`Not counted: ${e.message}`);
  }
}

const send = url => fetch(url);

module.exports = { COUNTER, count, send };
