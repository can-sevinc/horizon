// The anonymous counter (telemetry in config.yaml): adds 1 to a public count at
// https://horizon.goatcounter.com, "install" when the setup makes a board and "active" when the
// monthly update runs. Only the name of the event is sent: no repository, user, or data.
const COUNTER = "https://horizon.goatcounter.com/count";

async function count(event, config, core) {
  if (config.telemetry === false) return core.info(`Not counted (telemetry: false in config.yaml): ${event}`);
  // (never from the tests, unless a test replaced send)
  if (process.env.NODE_TEST_CONTEXT && module.exports.send === send) return;
  try {
    const url = `${COUNTER}?p=${encodeURIComponent(event)}&e=true&rnd=${Math.random().toString(36).slice(2)}`;
    await module.exports.send(url);
    core.info(`Counted: ${event} (anonymous, turn off with telemetry: false in config.yaml)`);
  } catch (e) {
    core.info(`Not counted: ${e.message}`);
  }
}

// (a browser user agent: the counter leaves out the requests of bots)
const send = url => fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Horizon/1.0" } });

module.exports = { COUNTER, count, send };
