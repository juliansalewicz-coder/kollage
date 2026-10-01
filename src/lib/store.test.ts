import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { draftNeedsGuard } from "./draft-guard";
import { SEED_LOOKS } from "./seed-looks";
import {
  __resetStoreForTests,
  archiveDraft,
  getArchivedDrafts,
  getFavorites,
  getLooks,
  getSession,
  getStorageStatus,
  signIn,
  toggleFavorite,
  upsertLook,
} from "./store";
import type { Draft, Look } from "./types";

function fakeWindow(storage: Partial<Storage>) {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: storage,
    addEventListener() {},
    removeEventListener() {},
  };
}

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  };
}

const blocked: Partial<Storage> = {
  getItem() {
    throw new Error("SecurityError");
  },
  setItem() {
    throw new Error("SecurityError");
  },
  removeItem() {
    throw new Error("SecurityError");
  },
};

const look = (over: Partial<Look> = {}): Look => ({
  ...SEED_LOOKS[0],
  id: "mein-look",
  isExample: false,
  ownerEmail: "a@b.ch",
  status: "privat",
  ...over,
});

beforeEach(() => __resetStoreForTests());
afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe("storage fallback", () => {
  it("keeps working in memory when localStorage is blocked and says so", () => {
    fakeWindow(blocked);
    expect(signIn({ name: "Test", email: "t@example.ch" })).toBe(false);
    // The regression: this used to come back as null and crash the save flow.
    expect(getSession()?.name).toBe("Test");
    expect(upsertLook(look())).toBe(false);
    expect(getLooks().map((l) => l.id)).toEqual(["mein-look"]);
    expect(getStorageStatus()).toBe("sitzung");
  });

  it("reports persistent saves when storage works", () => {
    fakeWindow(memoryStorage());
    expect(signIn({ name: "Test", email: "t@example.ch" })).toBe(true);
    expect(getSession()?.email).toBe("t@example.ch");
    expect(getStorageStatus()).toBe("dauerhaft");
  });

  it("archives drafts and keeps favourites across reads", () => {
    fakeWindow(memoryStorage());
    const draft: Draft = { lookId: null, title: "Test", note: "", occasion: "alltag", items: SEED_LOOKS[0].items, backdrop: "papier", basedOn: null, updatedAt: "" };
    expect(archiveDraft(draft).persisted).toBe(true);
    expect(getArchivedDrafts()).toHaveLength(1);
    expect(toggleFavorite("products", "trench")).toEqual({ active: true, persisted: true });
    expect(getFavorites().products).toEqual(["trench"]);
    expect(toggleFavorite("products", "trench").active).toBe(false);
    expect(getFavorites().products).toEqual([]);
  });
});

describe("draft guard", () => {
  const base = { title: "Test", note: "", occasion: "alltag" as const, backdrop: "papier" as const };

  it("does not ask for an empty draft", () => {
    expect(draftNeedsGuard({ ...base, items: [], lookId: null }, [])).toBe(false);
  });

  it("asks for an unsaved draft with pieces", () => {
    expect(draftNeedsGuard({ ...base, items: SEED_LOOKS[0].items, lookId: null }, [])).toBe(true);
  });

  it("does not ask when the draft equals its saved look, and asks after a change", () => {
    const saved = look({ title: "Test", note: "", occasion: "alltag", backdrop: "papier" });
    const draft = { ...base, items: saved.items, lookId: saved.id };
    expect(draftNeedsGuard(draft, [saved])).toBe(false);
    const moved = saved.items.map((it, i) => (i === 0 ? { ...it, x: it.x + 30 } : it));
    expect(draftNeedsGuard({ ...draft, items: moved }, [saved])).toBe(true);
  });
});
