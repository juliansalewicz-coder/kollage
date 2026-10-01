import { clampItem } from "./collage";
import type { Backdrop, CanvasItem, Occasion } from "./types";

/**
 * Share links carry the whole look in the URL, so a shared look opens on any
 * device without a backend. Only product ids and positions travel; no personal data.
 */
export interface SharedLook {
  title: string;
  occasion: Occasion;
  backdrop: Backdrop;
  items: CanvasItem[];
}

interface Wire {
  v: 1;
  t: string;
  o: Occasion;
  b: Backdrop;
  i: [string, number, number, number, number][];
}

const OCCASIONS: Occasion[] = ["alltag", "buero", "abend", "wochenende", "reise"];
const BACKDROPS: Backdrop[] = ["papier", "kreide", "sand", "salbei", "nacht"];

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(data: string): string {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((data.length + 3) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeLook(look: SharedLook): string {
  const ordered = [...look.items].sort((a, b) => a.z - b.z);
  const wire: Wire = {
    v: 1,
    t: look.title.slice(0, 80),
    o: look.occasion,
    b: look.backdrop,
    i: ordered.map((it) => [it.productId, Math.round(it.x), Math.round(it.y), Math.round(it.w), Math.round(it.rotation)]),
  };
  return toBase64Url(JSON.stringify(wire));
}

/** Returns null for anything malformed. Unknown product ids are dropped. */
export function decodeLook(data: string, knownProduct: (id: string) => boolean): SharedLook | null {
  try {
    const wire = JSON.parse(fromBase64Url(data)) as Partial<Wire>;
    if (wire.v !== 1 || !Array.isArray(wire.i)) return null;
    const items: CanvasItem[] = [];
    wire.i.slice(0, 40).forEach((row, idx) => {
      if (!Array.isArray(row) || row.length !== 5) return;
      const [productId, x, y, w, r] = row;
      if (typeof productId !== "string" || !knownProduct(productId)) return;
      if (![x, y, w, r].every((n) => typeof n === "number" && Number.isFinite(n))) return;
      items.push(clampItem({ uid: `s${idx}`, productId, x, y, w, rotation: r, z: idx + 1 }));
    });
    return {
      title: typeof wire.t === "string" && wire.t.trim() ? wire.t.slice(0, 80) : "Geteilter Look",
      occasion: OCCASIONS.includes(wire.o as Occasion) ? (wire.o as Occasion) : "alltag",
      backdrop: BACKDROPS.includes(wire.b as Backdrop) ? (wire.b as Backdrop) : "papier",
      items,
    };
  } catch {
    return null;
  }
}
