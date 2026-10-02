/**
 * Funnel events for the demo test. No analytics provider is wired in yet: events go to
 * `window.dataLayer` (picked up by a tag manager once one is added) and to a short ring buffer
 * in sessionStorage for debugging. No personal data, no product of the person's identity.
 *
 * Events: landing (first page of a visit, with source), look_viewed, builder_loaded,
 * first_edit, look_saved, look_published, look_shared, shop_clicked.
 */
export type TrackEvent =
  | "landing"
  | "look_viewed"
  | "builder_loaded"
  | "first_edit"
  | "look_saved"
  | "look_published"
  | "look_shared"
  | "shop_clicked";

type Props = Record<string, string | number | boolean | null | undefined>;

const SOURCE_KEY = "kollage.v1.source";
const LOG_KEY = "kollage.v1.events";

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
  const entry = { event, source: visitSource(), path: window.location.pathname, t: Date.now(), ...props };
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push(entry);
  try {
    const log = JSON.parse(sessionStorage.getItem(LOG_KEY) || "[]") as unknown[];
    sessionStorage.setItem(LOG_KEY, JSON.stringify([...log, entry].slice(-50)));
  } catch {
    /* storage blocked: dataLayer still has it */
  }
}
