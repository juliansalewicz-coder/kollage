// Funnel numbers from exported server logs (lines containing «kollage-event {...}», written by /api/events).
// Usage: node scripts/funnel.mjs <logfile> [more files]   e.g. a Vercel log export (JSON or plain text).
import fs from "node:fs";

const files = process.argv.slice(2);
if (!files.length) {
  console.log("Usage: node scripts/funnel.mjs <logfile> [...]");
  process.exit(1);
}

const events = [];
for (const f of files) {
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    // Plain lines or JSON exports where the message is an escaped string.
    const m = line.match(/kollage-event (\{.*\})/) || line.replace(/\\"/g, '"').match(/kollage-event (\{.*?\})"/);
    if (!m) continue;
    try {
      events.push(JSON.parse(m[1]));
    } catch {
      /* cut-off line */
    }
  }
}
if (!events.length) {
  console.log("Keine kollage-event Zeilen gefunden.");
  process.exit(0);
}

const STEPS = ["landing", "look_viewed", "builder_loaded", "first_edit", "look_saved", "share_started", "look_shared", "look_exported", "look_published", "shop_clicked"];
const visitsBy = (pred) => new Set(events.filter(pred).map((e) => e.visit ?? `${e.at}-${Math.random()}`));

const all = visitsBy(() => true).size;
console.log(`${events.length} Ereignisse, ${all} Besuche\n`);
console.log("Schritt".padEnd(16), "Besuche".padStart(8), "Anteil".padStart(8), "Ereignisse".padStart(11));
for (const step of STEPS) {
  const n = visitsBy((e) => e.event === step).size;
  const count = events.filter((e) => e.event === step).length;
  console.log(step.padEnd(16), String(n).padStart(8), `${all ? Math.round((n / all) * 100) : 0} %`.padStart(8), String(count).padStart(11));
}

const sources = new Map();
for (const e of events) if (e.event === "landing") sources.set(e.source ?? "direkt", (sources.get(e.source ?? "direkt") ?? 0) + 1);
if (sources.size) {
  console.log("\nHerkunft (landing)");
  for (const [s, n] of [...sources].sort((a, b) => b[1] - a[1])) console.log(" ", s.padEnd(14), n);
}
