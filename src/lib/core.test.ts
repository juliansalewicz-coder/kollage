import { describe, expect, it } from "vitest";
import { filterProducts, getProduct, PRODUCTS, bestOffer, findOffer } from "./catalog";
import { addItem, autoArrange, CANVAS_H, CANVAS_W, clampItem, layerItem, MAX_W, MIN_W, moveItem, normalizeAngle, removeItem, scaleItem } from "./collage";
import { formatCHF } from "./format";
import { lookTotal, pieceRows } from "./look";
import { lookup, SEED_LOOKS } from "./seed-looks";
import { decodeLook, encodeLook } from "./share";
import type { CanvasItem } from "./types";

const known = (id: string) => Boolean(getProduct(id));

describe("collage", () => {
  it("adds a piece into its category zone with the next z", () => {
    let items: CanvasItem[] = [];
    items = addItem(items, "jeans-hell", lookup, "a");
    items = addItem(items, "sneaker-weiss", lookup, "b");
    expect(items).toHaveLength(2);
    expect(items[1].z).toBe(2);
    expect(items[1].y).toBeGreaterThan(items[0].y);
  });

  it("ignores unknown products", () => {
    expect(addItem([], "gibt-es-nicht", lookup)).toEqual([]);
  });

  it("keeps the centre inside the canvas and the width in bounds", () => {
    const it0: CanvasItem = { uid: "a", productId: "t-weiss", x: 500, y: 500, w: 300, rotation: 0, z: 1 };
    const moved = moveItem([it0], "a", 5000, -5000)[0];
    expect(moved.x).toBe(CANVAS_W);
    expect(moved.y).toBe(0);
    expect(scaleItem([it0], "a", 100)[0].w).toBe(MAX_W);
    expect(scaleItem([it0], "a", 0.001)[0].w).toBe(MIN_W);
    expect(clampItem({ ...it0, y: CANVAS_H + 1 }).y).toBe(CANVAS_H);
  });

  it("normalises angles to (-180, 180]", () => {
    expect(normalizeAngle(190)).toBe(-170);
    expect(normalizeAngle(-190)).toBe(170);
    expect(normalizeAngle(180)).toBe(180);
  });

  it("reorders layers and keeps z compact", () => {
    const items: CanvasItem[] = ["a", "b", "c"].map((uid, i) => ({ uid, productId: "t-weiss", x: 0, y: 0, w: 100, rotation: 0, z: i + 1 }));
    const front = layerItem(items, "a", "front");
    expect(front.find((i) => i.uid === "a")!.z).toBe(3);
    const back = layerItem(items, "c", "back");
    expect(back.find((i) => i.uid === "c")!.z).toBe(1);
    expect(removeItem(items, "b").map((i) => i.z).sort()).toEqual([1, 2]);
  });

  it("auto-arranges shoes below tops", () => {
    const raw: CanvasItem[] = ["sneaker-weiss", "t-weiss"].map((productId, i) => ({ uid: `u${i}`, productId, x: 500, y: 500, w: 100, rotation: 0, z: i }));
    const out = autoArrange(raw, lookup);
    const shoe = out.find((i) => i.productId === "sneaker-weiss")!;
    const top = out.find((i) => i.productId === "t-weiss")!;
    expect(shoe.y).toBeGreaterThan(top.y);
  });
});

describe("share links", () => {
  it("round-trips a look", () => {
    const look = SEED_LOOKS[0];
    const code = encodeLook(look);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    const back = decodeLook(code, known)!;
    expect(back.title).toBe(look.title);
    expect(back.items.map((i) => i.productId)).toEqual([...look.items].sort((a, b) => a.z - b.z).map((i) => i.productId));
  });

  it("keeps umlauts in titles", () => {
    const code = encodeLook({ title: "Grün über Grau", occasion: "buero", backdrop: "salbei", items: [] });
    expect(decodeLook(code, known)!.title).toBe("Grün über Grau");
  });

  it("rejects garbage and drops unknown products", () => {
    expect(decodeLook("%%%", known)).toBeNull();
    const code = encodeLook({
      title: "x",
      occasion: "alltag",
      backdrop: "papier",
      items: [
        { uid: "a", productId: "erfunden", x: 1, y: 1, w: 100, rotation: 0, z: 1 },
        { uid: "b", productId: "t-weiss", x: 1, y: 1, w: 100, rotation: 0, z: 2 },
      ],
    });
    expect(decodeLook(code, known)!.items.map((i) => i.productId)).toEqual(["t-weiss"]);
  });
});

describe("catalogue and money", () => {
  it("formats CHF with Swiss grouping", () => {
    expect(formatCHF(29.9)).toBe("CHF 29.90");
    expect(formatCHF(1249)).toMatch(/^CHF 1.249\.00$/);
  });

  it("searches without accents and filters by category and price", () => {
    expect(filterProducts(PRODUCTS, { query: "grun", category: "alle", colors: [], maxPrice: null }).length).toBeGreaterThan(0);
    const cheapShoes = filterProducts(PRODUCTS, { query: "", category: "schuhe", colors: [], maxPrice: 150 });
    expect(cheapShoes.every((p) => p.category === "schuhe" && bestOffer(p).priceCHF <= 150)).toBe(true);
  });

  it("picks the cheapest offer and resolves offer ids", () => {
    const trench = getProduct("trench")!;
    expect(bestOffer(trench).priceCHF).toBe(289);
    expect(findOffer(trench.offers[1].id)?.product.id).toBe("trench");
  });

  it("totals each distinct product once and numbers tags in shopping-list order", () => {
    const items: CanvasItem[] = [
      { uid: "a", productId: "t-weiss", x: 500, y: 300, w: 100, rotation: 0, z: 1 },
      { uid: "b", productId: "t-weiss", x: 200, y: 300, w: 100, rotation: 0, z: 2 },
      { uid: "c", productId: "sneaker-weiss", x: 500, y: 1100, w: 100, rotation: 0, z: 3 },
    ];
    expect(lookTotal(items)).toBe(29.9 + 129);
    expect(pieceRows(items).map((r) => r.uid)).toEqual(["b", "a", "c"]);
  });

  it("only uses demo offers without affiliate URLs in the MVP catalogue", () => {
    expect(PRODUCTS.every((p) => p.isDemo && p.offers.every((o) => o.affiliateUrl === null))).toBe(true);
  });
});
