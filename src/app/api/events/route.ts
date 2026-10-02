import { NextResponse } from "next/server";

/**
 * Funnel collector without a third-party tool: every accepted event becomes one JSON line in the
 * server log («kollage-event {...}»), which the hosting keeps and exports (e.g. Vercel → Logs).
 * `node scripts/funnel.mjs <logfile>` turns an export into funnel numbers.
 * Only known event names and short, flat values are kept; no IP address, no names, no e-mail.
 */
const EVENTS = new Set([
  "landing",
  "look_viewed",
  "builder_loaded",
  "first_edit",
  "look_saved",
  "look_published",
  "share_started",
  "look_shared",
  "look_exported",
  "shop_clicked",
]);
/** Fields the client sends (lib/track.ts). Anything else is dropped, so nothing personal can slip in. */
const FIELDS = new Set(["event", "source", "visit", "path", "t", "look", "kind", "basedOn", "pieces", "published", "from", "how", "offer"]);

export async function POST(req: Request) {
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 2000) return new NextResponse(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!body || typeof body !== "object" || !EVENTS.has((body as { event?: string }).event ?? "")) return new NextResponse(null, { status: 400 });
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (!FIELDS.has(k)) continue;
    if (typeof v === "string") clean[k] = v.slice(0, 80);
    else if (typeof v === "number" && Number.isFinite(v)) clean[k] = v;
    else if (typeof v === "boolean" || v === null) clean[k] = v;
  }
  clean.at = new Date().toISOString();
  console.log("kollage-event " + JSON.stringify(clean));
  return new NextResponse(null, { status: 204 });
}
