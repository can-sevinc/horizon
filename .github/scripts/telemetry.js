// The anonymous counter (telemetry in config.yaml): a POST to the "install" path of Horizon's
// Cloudflare Worker adds 1 to the public count, once, when the setup makes a board. The badge
// reads it at https://horizon.mcansevinc.workers.dev/badge. Every board counts (no unique
// visitors, no bot filter). Only the name of the event is sent: no repository, user, or data.
const COUNTER = "https://horizon.mcansevinc.workers.dev/";

async function count(event, config, core) {
  if (config.telemetry === false) return core.info(`Not counted (telemetry: false in config.yaml): ${event}`);
  // (never from the tests, unless a test replaced send)
  if (process.env.NODE_TEST_CONTEXT && module.exports.send === send) return;
  try {
    const res = await module.exports.send(COUNTER + encodeURIComponent(event));
    if (!res.ok) throw new Error(`the counter answered ${res.status}`);
    const { count: value } = await res.json();
    core.info(`Counted: ${event}, now ${value} (anonymous, turn off with telemetry: false in config.yaml)`);
  } catch (e) {
    core.info(`Not counted: ${e.message}`);
  }
}

const send = url => fetch(url, { method: "POST" });

module.exports = { COUNTER, count, send };
