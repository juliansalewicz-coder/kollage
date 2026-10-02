import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bestSaving, budgetSummary, replaceEffect } from "./budget";
import { publishProblems } from "./publish";
import { __resetStoreForTests, deleteLook, getFavorites, getOwned, toggleFavorite, toggleOwned, upsertLook } from "./store";
import type { CanvasItem, Look } from "./types";

const item = (uid: string, productId: string): CanvasItem => ({ uid, productId, x: 400, y: 500, w: 300, rotation: 0, z: 1 });

function memoryWindow() {
  const m = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, String(v)),
      removeItem: (k: string) => void m.delete(k),
    },
    addEventListener() {},
    removeEventListener() {},
  };
}

describe("publish rules (same for builder and «Meine Looks»)", () => {
  it("needs a real title and two different pieces", () => {
    expect(publishProblems({ title: "", items: [item("a", "t-weiss")] })).toEqual(["title", "items"]);
    expect(publishProblems({ title: "Unbenannter Look", items: [item("a", "t-weiss"), item("b", "jeans-hell")] })).toEqual(["title"]);
    expect(publishProblems({ title: "Apéro", items: [item("a", "t-weiss"), item("b", "t-weiss")] })).toEqual(["items"]);
    expect(publishProblems({ title: "Apéro", items: [item("a", "t-weiss"), item("b", "jeans-hell")] })).toEqual([]);
  });
});

describe("wardrobe in the budget", () => {
  const items = [item("a", "t-weiss"), item("b", "jeans-hell")]; // 29.90 + 99.90, both at limmat

  it("keeps the look value and subtracts owned pieces from what is left to buy", () => {
    const s = budgetSummary(items, 100, ["jeans-hell"]);
    expect(s.productValue).toBe(129.8);
    expect(s.toBuy).toBe(29.9);
    expect(s.owned).toBe(1);
    expect(s.remaining).toBe(70.1);
  });

  it("does not suggest a cheaper swap for a piece already owned", () => {
    const owned = ["jeans-hell"];
    const save = bestSaving(items, owned);
    expect(save?.product.id).not.toBe("jeans-hell");
    // Replacing an owned piece means buying the new one: what is left to buy goes up.
    expect(replaceEffect(items, ["b"], "jeans-dunkel", owned)).toBe(109);
  });
});

describe("store consistency", () => {
  beforeEach(() => {
    memoryWindow();
    __resetStoreForTests();
  });
  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it("removes a deleted look from «Gemerkt» and keeps other favourites", () => {
    const look = { id: "mein-look", title: "Mein Look", items: [], status: "privat" } as unknown as Look;
    upsertLook({ ...look, note: "", occasion: "alltag", backdrop: "papier", authorName: "Gast", ownerEmail: null, createdAt: "", updatedAt: "", basedOn: null, isExample: false } as Look);
    toggleFavorite("looks", "mein-look");
    toggleFavorite("looks", "herbst-in-bern");
    toggleFavorite("products", "trench");
    deleteLook("mein-look");
    expect(getFavorites()).toEqual({ looks: ["herbst-in-bern"], products: ["trench"] });
  });

  it("keeps one wardrobe for all looks", () => {
    expect(toggleOwned("trench").active).toBe(true);
    expect(getOwned()).toEqual(["trench"]);
    expect(toggleOwned("trench").active).toBe(false);
    expect(getOwned()).toEqual([]);
  });
});
