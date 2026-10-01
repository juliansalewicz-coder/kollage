import { describe, expect, it } from "vitest";
import { alternatives, bestSaving, budgetSummary, mostExpensive } from "./budget";
import { getProduct, imageAspect } from "./catalog";
import { replaceItem } from "./collage";
import { lookup, SEED_LOOKS } from "./seed-looks";
import type { CanvasItem } from "./types";

const item = (uid: string, productId: string, over: Partial<CanvasItem> = {}): CanvasItem => ({ uid, productId, x: 400, y: 500, w: 300, rotation: 7, z: 3, ...over });

describe("replace a piece", () => {
  it("keeps centre, rotation and layer and fits the new image into the old box", () => {
    const items = [item("a", "trench"), item("b", "jeans-hell", { z: 1 })];
    const out = replaceItem(items, "a", "mantel-navy", lookup);
    const a = out.find((i) => i.uid === "a")!;
    expect(a.productId).toBe("mantel-navy");
    expect([a.x, a.y, a.rotation, a.z]).toEqual([400, 500, 7, 3]);
    const oldH = 300 * imageAspect(getProduct("trench")!);
    const newH = a.w * imageAspect(getProduct("mantel-navy")!);
    expect(a.w).toBeLessThanOrEqual(300 + 1e-9);
    expect(newH).toBeLessThanOrEqual(oldH + 1e-9);
    // One side touches the old box: the image is as large as it can be.
    expect(Math.abs(a.w - 300) < 1e-9 || Math.abs(newH - oldH) < 1e-9).toBe(true);
    expect(out.find((i) => i.uid === "b")).toEqual(items[1]);
  });

  it("is a no-op for unknown pieces or products", () => {
    const items = [item("a", "trench")];
    expect(replaceItem(items, "x", "mantel-navy", lookup)).toBe(items);
    expect(replaceItem(items, "a", "gibt-es-nicht", lookup)).toBe(items);
  });
});

describe("budget", () => {
  it("counts a product placed twice only once and keeps shipping separate", () => {
    // t-weiss 29.90 @ limmat, twice on the canvas; jeans-hell 99.90 @ limmat
    const items = [item("a", "t-weiss"), item("b", "t-weiss"), item("c", "jeans-hell")];
    const s = budgetSummary(items, 150);
    expect(s.placed).toBe(3);
    expect(s.distinct).toBe(2);
    expect(s.productValue).toBe(129.8);
    expect(s.remaining).toBe(20.2);
    // Limmat: free shipping from CHF 75, subtotal 129.80
    expect(s.shipping).toBe(0);
  });

  it("adds shipping per shop below its free threshold and reports overspend", () => {
    // t-weiss 29.90 @ limmat (6.90 below 75), hose-schwarz 139 @ rhone (9.90 below 120? no: 139 >= 120 free)
    const s = budgetSummary([item("a", "t-weiss"), item("b", "hose-schwarz")], 100);
    expect(s.productValue).toBe(168.9);
    expect(s.shipping).toBe(6.9);
    expect(s.remaining).toBe(-68.9);
  });

  it("has no remaining value without a budget", () => {
    expect(budgetSummary([item("a", "t-weiss")], null).remaining).toBeNull();
  });
});

describe("cheaper alternatives", () => {
  it("offers same-category products sorted by price, cheaper ones separate", () => {
    const { cheaper, others } = alternatives("trench"); // 289, oberteile; blazers are cheaper jackets
    expect(cheaper.length).toBeGreaterThan(0);
    expect(cheaper.every((a) => a.product.category === "oberteile" && a.diff < 0)).toBe(true);
    // Same kind (jackets) first, each group by price.
    const firstOther = cheaper.findIndex((a) => !a.similar);
    expect(cheaper[0].similar).toBe(true);
    expect(cheaper.slice(firstOther).every((a) => !a.similar)).toBe(true);
    const sim = cheaper.filter((a) => a.similar).map((a) => a.price);
    expect(sim).toEqual([...sim].sort((x, y) => x - y));
    expect(others.every((a) => a.diff >= 0)).toBe(true);
    expect([...cheaper, ...others].some((a) => a.product.id === "trench")).toBe(false);
  });

  it("finds the most expensive piece", () => {
    expect(mostExpensive([item("a", "t-weiss"), item("b", "mantel-navy"), item("c", "jeans-hell")])?.productId).toBe("mantel-navy");
  });
});

describe("saving suggestion", () => {
  it("points to the piece with the largest same-kind saving, not just the most expensive one", () => {
    const look = SEED_LOOKS.find((l) => l.id === "herbst-in-bern")!;
    const best = bestSaving(look.items)!;
    expect(best).not.toBeNull();
    const savings = [...new Set(look.items.map((i) => i.productId))].map((id) => {
      const similar = alternatives(id).cheaper.filter((a) => a.similar);
      return similar.length ? -Math.min(...similar.map((a) => a.diff)) : 0;
    });
    expect(best.saving).toBeCloseTo(Math.max(...savings), 2);
    // The suggested swap really exists and is of the same kind.
    expect(alternatives(best.product.id).cheaper.some((a) => a.similar && Math.abs(a.diff + best.saving) < 0.001)).toBe(true);
  });

  it("returns null for an empty canvas", () => {
    expect(bestSaving([])).toBeNull();
  });
});
