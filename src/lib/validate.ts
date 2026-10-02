import type { Backdrop, CanvasItem, Draft, Look, LookStatus, Occasion, Session } from "./types";

/*
 * Browser data can be old, edited by hand or half written. JSON.parse only checks the syntax,
 * so every stored model passes through one of these before the UI sees it. Invalid entries are
 * dropped one by one; valid neighbours (other looks, other favourites) are kept.
 */

const OCCASIONS: Occasion[] = ["alltag", "buero", "abend", "wochenende", "reise"];
const BACKDROPS: Backdrop[] = ["papier", "kreide", "sand", "salbei", "nacht"];
const STATUSES: LookStatus[] = ["privat", "veroeffentlicht"];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const strOrNull = (v: unknown) => (typeof v === "string" ? v : null);
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const oneOf = <T extends string>(v: unknown, list: T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

export function canvasItem(v: unknown): CanvasItem | null {
  if (!isObj(v) || typeof v.uid !== "string" || typeof v.productId !== "string") return null;
  if (![v.x, v.y, v.w, v.rotation, v.z].every(num)) return null;
  return { uid: v.uid, productId: v.productId, x: v.x as number, y: v.y as number, w: v.w as number, rotation: v.rotation as number, z: v.z as number };
}

function items(v: unknown): CanvasItem[] {
  return Array.isArray(v) ? (v.map(canvasItem).filter(Boolean) as CanvasItem[]) : [];
}

export function session(v: unknown): Session | null {
  if (!isObj(v) || typeof v.name !== "string" || typeof v.email !== "string") return null;
  return { name: v.name, email: v.email };
}

export function draft(v: unknown): Draft | null {
  if (!isObj(v)) return null;
  const budget = num(v.budget) && (v.budget as number) > 0 ? (v.budget as number) : null;
  return {
    lookId: strOrNull(v.lookId),
    title: str(v.title),
    note: str(v.note),
    occasion: oneOf(v.occasion, OCCASIONS, "alltag"),
    items: items(v.items),
    backdrop: oneOf(v.backdrop, BACKDROPS, "papier"),
    basedOn: strOrNull(v.basedOn),
    updatedAt: str(v.updatedAt),
    budget,
  };
}

export function look(v: unknown): Look | null {
  if (!isObj(v) || typeof v.id !== "string" || !v.id) return null;
  return {
    id: v.id,
    title: str(v.title, "Unbenannter Look"),
    note: str(v.note),
    occasion: oneOf(v.occasion, OCCASIONS, "alltag"),
    items: items(v.items),
    backdrop: oneOf(v.backdrop, BACKDROPS, "papier"),
    status: oneOf(v.status, STATUSES, "privat"),
    authorName: str(v.authorName),
    ownerEmail: strOrNull(v.ownerEmail),
    createdAt: str(v.createdAt),
    updatedAt: str(v.updatedAt),
    basedOn: strOrNull(v.basedOn),
    isExample: v.isExample === true,
    ...(typeof v.tip === "string" ? { tip: v.tip } : {}),
  };
}

export function looks(v: unknown): Look[] {
  return Array.isArray(v) ? (v.map(look).filter(Boolean) as Look[]) : [];
}

export interface ArchivedDraftShape extends Draft {
  archiveId: string;
  archivedAt: string;
}

export function archive(v: unknown): ArchivedDraftShape[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((e) => {
    const d = draft(e);
    if (!d || !isObj(e) || typeof e.archiveId !== "string") return [];
    return [{ ...d, archiveId: e.archiveId, archivedAt: str(e.archivedAt) }];
  });
}

export function favorites(v: unknown): { products: string[]; looks: string[] } {
  const ids = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === "string") : []);
  return isObj(v) ? { products: ids(v.products), looks: ids(v.looks) } : { products: [], looks: [] };
}

export function idList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((i): i is string => typeof i === "string") : [];
}
