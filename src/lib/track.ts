import { getSeedLook } from "./seed-looks";

/**
 * Funnel events for the demo test. Each event goes to
 * - `/api/events` (sendBeacon): one log line on the server, the central record without a third-party tool;
 * - `window.dataLayer`, picked up by a tag manager if one is added later;
 * - a short ring buffer in sessionStorage for debugging.
 * No personal data: a random visit id per browser tab joins the steps of one visit, nothing else.
 * Switch the server copy off with NEXT_PUBLIC_EVENTS=off.
 *
 * Events: landing (first page of a visit, with source), look_viewed, builder_loaded,
 * first_edit, look_saved, look_published, share_started (tap on «Teilen»), look_shared (only after the
 * share sheet finished or the link was copied), look_exported, shop_clicked.
 */
export type TrackEvent =
  | "landing"
  | "look_viewed"
  | "builder_loaded"
  | "first_edit"
  | "look_saved"
  | "look_published"
  | "share_started"
  | "look_shared"
  | "look_exported"
  | "shop_clicked";

type Props = Record<string, string | number | boolean | null | undefined>;

const SOURCE_KEY = "kollage.v1.source";
const LOG_KEY = "kollage.v1.events";
const VISIT_KEY = "kollage.v1.visit";
const SEND = process.env.NEXT_PUBLIC_EVENTS !== "off";

/** Random id for this tab session, so the steps of one visit can be counted as one funnel. */
function visitId(): string | null {
  try {
    let id = sessionStorage.getItem(VISIT_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(VISIT_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Campaign source of this visit: ?von=tiktok or utm_source, kept for the tab session. */
export function visitSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("von") || params.get("utm_source");
    if (fromUrl) {
      const clean = fromUrl.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
      sessionStorage.setItem(SOURCE_KEY, clean);
      return clean;
    }
    return sessionStorage.getItem(SOURCE_KEY);
  } catch {
    return null;
  }
}

export function track(event: TrackEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  // Own looks have ids built from their title: only example looks keep their id, the rest becomes «eigen».
  const anon = (v: Props[string]) => (typeof v === "string" && v !== "geteilt" && !getSeedLook(v) ? "eigen" : v);
  const safe = { ...props, ...("look" in props ? { look: anon(props.look) } : {}), ...("basedOn" in props ? { basedOn: anon(props.basedOn) } : {}) };
  const own = window.location.pathname.startsWith("/look/") && safe.look === "eigen";
  const entry = { event, source: visitSource(), visit: visitId(), path: own ? "/look/eigen" : window.location.pathname, t: Date.now(), ...safe };
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push(entry);
  if (SEND && typeof navigator.sendBeacon === "function") {
    try {
      navigator.sendBeacon("/api/events", new Blob([JSON.stringify(entry)], { type: "application/json" }));
    } catch {
      /* blocked by the browser or an extension: the visit still works */
    }
  }
  try {
    const log = JSON.parse(sessionStorage.getItem(LOG_KEY) || "[]") as unknown[];
    sessionStorage.setItem(LOG_KEY, JSON.stringify([...log, entry].slice(-50)));
  } catch {
    /* storage blocked: dataLayer still has it */
  }
}
