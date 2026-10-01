import { beforeEach, describe, expect, it } from "vitest";
import { __resetStoreForTests, getArchivedDrafts, getDraft, getFavorites, getLooks, getSession, toggleFavorite } from "./store";

// Audit finding B: valid JSON with the wrong shape must not crash pages.
class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

let ls: MemoryStorage;
beforeEach(() => {
  ls = new MemoryStorage();
  (globalThis as unknown as { window: unknown }).window = { localStorage: ls, addEventListener() {}, removeEventListener() {} };
  __resetStoreForTests();
});

const put = (key: string, value: unknown) => ls.setItem(`kollage.v1.${key}`, JSON.stringify(value));

describe("stored data with a wrong shape", () => {
  it("favourites: null lists become empty lists, valid ids stay", () => {
    put("favorites", { products: null, looks: ["herbst-in-bern", 3] });
    expect(getFavorites()).toEqual({ products: [], looks: ["herbst-in-bern"] });
    // Writing again works and repairs the stored value.
    expect(toggleFavorite("products", "trench").active).toBe(true);
    expect(JSON.parse(ls.getItem("kollage.v1.favorites")!)).toEqual({ products: ["trench"], looks: ["herbst-in-bern"] });
  });

  it("draft: broken items become an empty canvas, other fields fall back to defaults", () => {
    put("draft", { items: "broken", title: 5, occasion: "party" });
    const d = getDraft()!;
    expect(d.items).toEqual([]);
    expect(d.title).toBe("");
    expect(d.occasion).toBe("alltag");
  });

  it("draft: invalid pieces are dropped, valid ones kept", () => {
    put("draft", {
      items: [
        { uid: "a", productId: "trench", x: 1, y: 2, w: 300, rotation: 0, z: 1 },
        { uid: "b", productId: "jeans-hell", x: "1" },
        null,
      ],
    });
    expect(getDraft()!.items.map((i) => i.uid)).toEqual(["a"]);
  });

  it("looks: entries without id are dropped, the rest survives", () => {
    put("looks", [{ title: "ohne id" }, { id: "x1", title: "Gut", items: "kaputt", status: "egal" }, 42]);
    const looks = getLooks();
    expect(looks).toHaveLength(1);
    expect(looks[0]).toMatchObject({ id: "x1", title: "Gut", items: [], status: "privat" });
  });

  it("session, archive and plain garbage", () => {
    put("session", { name: "A" });
    put("draft-archive", { not: "a list" });
    ls.setItem("kollage.v1.looks", "{not json");
    expect(getSession()).toBeNull();
    expect(getArchivedDrafts()).toEqual([]);
    expect(getLooks()).toEqual([]);
  });
});
