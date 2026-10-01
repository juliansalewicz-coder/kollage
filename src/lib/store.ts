"use client";

import { useSyncExternalStore } from "react";
import type { Draft, Look, Session } from "./types";

/**
 * MVP persistence: everything lives in this browser's localStorage.
 * When the browser blocks storage (private mode, blocked site data) the values
 * live in memory for this page session instead, and `useStorageStatus` says so.
 * The API is deliberately small so a real backend can replace it.
 */
const KEYS = {
  session: "kollage.v1.session",
  looks: "kollage.v1.looks",
  draft: "kollage.v1.draft",
  archive: "kollage.v1.draft-archive",
  favorites: "kollage.v1.favorites",
} as const;

type Key = (typeof KEYS)[keyof typeof KEYS];

export type StorageStatus = "dauerhaft" | "sitzung";

const listeners = new Set<() => void>();
const cache = new Map<Key, { raw: string | null; value: unknown }>();
/** Values that could not be written to localStorage. They win over storage reads. */
const memory = new Map<Key, unknown>();
let status: StorageStatus = "dauerhaft";

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key && (Object.values(KEYS) as string[]).includes(e.key)) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(key: Key): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    if (status !== "sitzung") status = "sitzung";
    return null;
  }
}

function read<T>(key: Key, fallback: T): T {
  if (memory.has(key)) return memory.get(key) as T;
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

/** Returns true when the value reached persistent storage. */
function write(key: Key, value: unknown): boolean {
  let persisted = false;
  try {
    const s = storage();
    if (!s) throw new Error("no storage");
    if (value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
    persisted = true;
    memory.delete(key);
  } catch {
    // Storage full or blocked: keep the value for this page session.
    memory.set(key, value);
    status = "sitzung";
  }
  emit();
  return persisted;
}

const EMPTY_LOOKS: Look[] = [];

/* ---------- status ---------- */

export function getStorageStatus(): StorageStatus {
  return status;
}

/** Probe once on the client so the UI can warn before the first save. */
export function probeStorage(): StorageStatus {
  try {
    const s = storage();
    if (!s) throw new Error("no storage");
    const k = "kollage.v1.probe";
    s.setItem(k, "1");
    s.removeItem(k);
  } catch {
    if (status !== "sitzung") {
      status = "sitzung";
      emit();
    }
  }
  return status;
}

/* ---------- session ---------- */

export function getSession(): Session | null {
  return read<Session | null>(KEYS.session, null);
}

export function signIn(session: Session): boolean {
  return write(KEYS.session, session);
}

export function signOut() {
  write(KEYS.session, null);
}

/* ---------- looks ---------- */

export function getLooks(): Look[] {
  return read<Look[]>(KEYS.looks, EMPTY_LOOKS);
}

export function upsertLook(look: Look): boolean {
  const looks = getLooks();
  const exists = looks.some((l) => l.id === look.id);
  return write(KEYS.looks, exists ? looks.map((l) => (l.id === look.id ? look : l)) : [look, ...looks]);
}

export function deleteLook(id: string) {
  write(
    KEYS.looks,
    getLooks().filter((l) => l.id !== id),
  );
  const draft = getDraft();
  if (draft?.lookId === id) setDraft({ ...draft, lookId: null });
}

export function newLookId(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "look"}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------- draft ---------- */

export function getDraft(): Draft | null {
  return read<Draft | null>(KEYS.draft, null);
}

export function setDraft(draft: Draft | null): boolean {
  return write(KEYS.draft, draft);
}

/* ---------- archived drafts (kept when the user opens something else) ---------- */

export interface ArchivedDraft extends Draft {
  archiveId: string;
  archivedAt: string;
}

const EMPTY_ARCHIVE: ArchivedDraft[] = [];
const ARCHIVE_LIMIT = 12;

export function getArchivedDrafts(): ArchivedDraft[] {
  return read<ArchivedDraft[]>(KEYS.archive, EMPTY_ARCHIVE);
}

export function archiveDraft(draft: Draft): { entry: ArchivedDraft; persisted: boolean } {
  const entry: ArchivedDraft = {
    ...draft,
    archiveId: `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    archivedAt: new Date().toISOString(),
  };
  const persisted = write(KEYS.archive, [entry, ...getArchivedDrafts()].slice(0, ARCHIVE_LIMIT));
  return { entry, persisted };
}

export function removeArchivedDraft(archiveId: string) {
  write(
    KEYS.archive,
    getArchivedDrafts().filter((d) => d.archiveId !== archiveId),
  );
}

/* ---------- favourites ---------- */

export interface Favorites {
  products: string[];
  looks: string[];
}

const EMPTY_FAVS: Favorites = { products: [], looks: [] };

export function getFavorites(): Favorites {
  return read<Favorites>(KEYS.favorites, EMPTY_FAVS);
}

export function toggleFavorite(kind: keyof Favorites, id: string): { active: boolean; persisted: boolean } {
  const favs = getFavorites();
  const list = favs[kind];
  const active = !list.includes(id);
  const next = { ...favs, [kind]: active ? [id, ...list] : list.filter((x) => x !== id) };
  return { active, persisted: write(KEYS.favorites, next) };
}

/* ---------- hooks ---------- */

const serverNull = () => null;
const serverLooks = () => EMPTY_LOOKS;
const serverArchive = () => EMPTY_ARCHIVE;
const serverFavs = () => EMPTY_FAVS;
const serverStatus = (): StorageStatus => "dauerhaft";

export function useSession() {
  return useSyncExternalStore(subscribe, getSession, serverNull);
}

export function useLooks() {
  return useSyncExternalStore(subscribe, getLooks, serverLooks);
}

export function useDraft() {
  return useSyncExternalStore(subscribe, getDraft, serverNull);
}

export function useArchivedDrafts() {
  return useSyncExternalStore(subscribe, getArchivedDrafts, serverArchive);
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, getFavorites, serverFavs);
}

export function useStorageStatus() {
  return useSyncExternalStore(subscribe, getStorageStatus, serverStatus);
}

/** False during server render and hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Test helper: forget in-memory state. */
export function __resetStoreForTests() {
  cache.clear();
  memory.clear();
  status = "dauerhaft";
}
