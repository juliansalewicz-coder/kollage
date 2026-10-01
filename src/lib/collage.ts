import type { CanvasItem, Category, GarmentKind, Product } from "./types";

/** Canvas units. The window is always 4:5; positions scale with its rendered size. */
export const CANVAS_W = 1000;
export const CANVAS_H = 1250;
export const MIN_W = 50;
export const MAX_W = 900;

const DEFAULT_W: Record<GarmentKind, number> = {
  tshirt: 340,
  shirt: 340,
  knit: 350,
  hoodie: 350,
  blazer: 350,
  coat: 330,
  jeans: 220,
  trousers: 240,
  skirt: 270,
  shorts: 280,
  sneaker: 290,
  loafer: 280,
  boot: 230,
  tote: 270,
  shoulderbag: 280,
  crossbody: 230,
  sunglasses: 230,
  cap: 210,
  beanie: 180,
  scarf: 160,
  belt: 280,
  watch: 110,
  necklace: 180,
};

export interface ItemInfo {
  category: Category;
  aspect: number;
  kind: GarmentKind | null;
}

export type InfoLookup = (productId: string) => ItemInfo | undefined;

let seq = 0;
export function newUid(): string {
  seq += 1;
  return `i${Date.now().toString(36)}${seq.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

export function defaultWidth(info: ItemInfo): number {
  return info.kind ? DEFAULT_W[info.kind] : 300;
}

/** Moodboard zones: outerwear and tops upper left, bottoms below, shoes at the floor, bags and accessories around. */
const ZONES: Record<Category, { x: number; y: number; r: number }[]> = {
  oberteile: [
    { x: 300, y: 330, r: -2 },
    { x: 670, y: 320, r: 3 },
    { x: 480, y: 430, r: 0 },
  ],
  hosen: [
    { x: 410, y: 800, r: 0 },
    { x: 690, y: 820, r: 2 },
  ],
  schuhe: [
    { x: 730, y: 1075, r: -4 },
    { x: 290, y: 1085, r: 3 },
  ],
  taschen: [
    { x: 800, y: 640, r: 4 },
    { x: 170, y: 720, r: -3 },
  ],
  accessoires: [
    { x: 845, y: 150, r: -6 },
    { x: 140, y: 150, r: 5 },
    { x: 880, y: 410, r: 4 },
    { x: 165, y: 990, r: -5 },
    { x: 590, y: 600, r: 3 },
  ],
};

export function itemHeight(item: Pick<CanvasItem, "w">, aspect: number): number {
  return item.w * aspect;
}

function clampCenter(v: number, max: number): number {
  return Math.min(max, Math.max(0, v));
}

export function clampItem(item: CanvasItem): CanvasItem {
  return {
    ...item,
    x: clampCenter(item.x, CANVAS_W),
    y: clampCenter(item.y, CANVAS_H),
    w: Math.min(MAX_W, Math.max(MIN_W, item.w)),
    rotation: normalizeAngle(item.rotation),
  };
}

export function normalizeAngle(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return Math.round(d * 10) / 10;
}

function maxZ(items: CanvasItem[]): number {
  return items.reduce((m, it) => Math.max(m, it.z), 0);
}

export function addItem(items: CanvasItem[], productId: string, lookup: InfoLookup, uid = newUid()): CanvasItem[] {
  const info = lookup(productId);
  if (!info) return items;
  const zones = ZONES[info.category];
  const inCategory = items.filter((it) => lookup(it.productId)?.category === info.category).length;
  const zone = zones[inCategory % zones.length];
  // A second round through the zones shifts slightly, so no piece hides exactly behind another.
  const nudge = Math.floor(inCategory / zones.length) * 36;
  const item: CanvasItem = clampItem({
    uid,
    productId,
    x: zone.x + nudge,
    y: zone.y + nudge,
    w: defaultWidth(info),
    rotation: zone.r,
    z: maxZ(items) + 1,
  });
  return [...items, item];
}

export function updateItem(items: CanvasItem[], uid: string, patch: Partial<CanvasItem>): CanvasItem[] {
  return items.map((it) => (it.uid === uid ? clampItem({ ...it, ...patch, uid: it.uid }) : it));
}

export function moveItem(items: CanvasItem[], uid: string, dx: number, dy: number): CanvasItem[] {
  return items.map((it) => (it.uid === uid ? clampItem({ ...it, x: it.x + dx, y: it.y + dy }) : it));
}

export function scaleItem(items: CanvasItem[], uid: string, factor: number): CanvasItem[] {
  return items.map((it) => (it.uid === uid ? clampItem({ ...it, w: it.w * factor }) : it));
}

export function rotateItem(items: CanvasItem[], uid: string, deg: number): CanvasItem[] {
  return items.map((it) => (it.uid === uid ? clampItem({ ...it, rotation: it.rotation + deg }) : it));
}

export function removeItem(items: CanvasItem[], uid: string): CanvasItem[] {
  return normalizeZ(items.filter((it) => it.uid !== uid));
}

export function duplicateItem(items: CanvasItem[], uid: string, newId = newUid()): CanvasItem[] {
  const src = items.find((it) => it.uid === uid);
  if (!src) return items;
  return [...items, clampItem({ ...src, uid: newId, x: src.x + 40, y: src.y + 40, z: maxZ(items) + 1 })];
}

export type LayerMove = "front" | "forward" | "backward" | "back";

export function layerItem(items: CanvasItem[], uid: string, move: LayerMove): CanvasItem[] {
  const order = [...items].sort((a, b) => a.z - b.z);
  const idx = order.findIndex((it) => it.uid === uid);
  if (idx < 0) return items;
  const [it] = order.splice(idx, 1);
  const target =
    move === "front" ? order.length : move === "back" ? 0 : move === "forward" ? Math.min(order.length, idx + 1) : Math.max(0, idx - 1);
  order.splice(target, 0, it);
  const zByUid = new Map(order.map((o, i) => [o.uid, i + 1]));
  return items.map((o) => ({ ...o, z: zByUid.get(o.uid)! }));
}

export function normalizeZ(items: CanvasItem[]): CanvasItem[] {
  const order = [...items].sort((a, b) => a.z - b.z);
  const zByUid = new Map(order.map((o, i) => [o.uid, i + 1]));
  return items.map((o) => ({ ...o, z: zByUid.get(o.uid)! }));
}

/** Lay every piece out in its moodboard zone at its default size. */
export function autoArrange(items: CanvasItem[], lookup: InfoLookup): CanvasItem[] {
  const counters: Record<Category, number> = { oberteile: 0, hosen: 0, schuhe: 0, taschen: 0, accessoires: 0 };
  const zOrder: Record<Category, number> = { hosen: 1, oberteile: 2, schuhe: 3, taschen: 4, accessoires: 5 };
  const overflow: CanvasItem[] = [];
  const placed = items.map((it) => {
    const info = lookup(it.productId);
    if (!info) return it;
    const zones = ZONES[info.category];
    const n = counters[info.category]++;
    if (n >= zones.length) {
      overflow.push(it);
      return { ...it, w: defaultWidth(info) * 0.8, z: zOrder[info.category] * 100 + n };
    }
    const zone = zones[n];
    return clampItem({ ...it, x: zone.x, y: zone.y, w: defaultWidth(info), rotation: zone.r, z: zOrder[info.category] * 100 + n });
  });
  // Pieces beyond the zones go into a loose row along the top edge.
  const withOverflow = placed.map((it) => {
    const i = overflow.findIndex((o) => o.uid === it.uid);
    if (i < 0) return it;
    return clampItem({ ...it, x: 140 + ((i * 220) % 760), y: 120 + Math.floor((i * 220) / 760) * 200, rotation: 0 });
  });
  return normalizeZ(withOverflow);
}

/** CSS placement in percent of the window. */
export function itemStyle(item: CanvasItem, aspect: number) {
  const h = itemHeight(item, aspect);
  return {
    left: `${((item.x - item.w / 2) / CANVAS_W) * 100}%`,
    top: `${((item.y - h / 2) / CANVAS_H) * 100}%`,
    width: `${(item.w / CANVAS_W) * 100}%`,
    height: `${(h / CANVAS_H) * 100}%`,
    zIndex: item.z,
    transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
  } as const;
}

export function infoFromProduct(product: Product, aspect: number): ItemInfo {
  return { category: product.category, aspect, kind: product.kind };
}

/**
 * Swap the product behind a placed piece. Centre, rotation and layer stay; the
 * new image keeps its own aspect ratio and is fitted into the old piece's box.
 */
export function replaceItem(items: CanvasItem[], uid: string, productId: string, lookup: InfoLookup): CanvasItem[] {
  const it = items.find((i) => i.uid === uid);
  if (!it) return items;
  const oldInfo = lookup(it.productId);
  const newInfo = lookup(productId);
  if (!oldInfo || !newInfo) return items;
  const oldH = it.w * oldInfo.aspect;
  const w = Math.min(it.w, oldH / newInfo.aspect);
  return items.map((o) => (o.uid === uid ? clampItem({ ...o, productId, w }) : o));
}
