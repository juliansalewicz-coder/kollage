/**
 * What the builder says about saving, in one place: the bar, the phone bar and the «Dein Look» sheet
 * all show this. It only claims «gesichert» after a write that really succeeded.
 */
export interface SaveStatus {
  tone: "ok" | "warn" | "muted";
  text: string;
  /** Phone bar version of `text`. */
  short: string;
  detail: string;
}

export function saveStatus(s: {
  /** Browser storage blocked, or the last draft write failed. */
  blocked: boolean;
  pieces: number;
  /** The draft belongs to a look in «Meine Looks» and has no changes since. */
  savedLook: boolean;
  published: boolean;
  /** Draft write result: true written, false failed, null not yet. */
  draftSaved: boolean | null;
}): SaveStatus {
  if (s.blocked)
    return { tone: "warn", text: "Nicht gesichert: Browserspeicher blockiert", short: "Nicht gesichert", detail: "Änderungen gehen beim Schliessen des Tabs verloren." };
  if (!s.pieces)
    return { tone: "muted", text: "Leere Leinwand", short: "Leere Leinwand", detail: "Sobald ein Teil darauf liegt, wird dein Entwurf in diesem Browser gesichert." };
  if (s.savedLook)
    return s.published
      ? { tone: "ok", text: "Veröffentlicht, alles gespeichert", short: "Veröffentlicht", detail: "" }
      : { tone: "ok", text: "Gespeichert in «Meine Looks»", short: "In «Meine Looks»", detail: "" };
  if (s.draftSaved)
    return {
      tone: "ok",
      text: "Entwurf in diesem Browser gesichert",
      short: "Entwurf gesichert",
      detail: s.published ? "Änderungen sind noch nicht veröffentlicht." : "Noch nicht in «Meine Looks» gespeichert.",
    };
  return { tone: "muted", text: "Entwurf wird gesichert …", short: "Entwurf wird gesichert …", detail: "" };
}
