"use client";

import { useSyncExternalStore } from "react";
import type { Draft, Look, Session } from "./types";

/**
 * MVP persistence: everything lives in this browser's localStorage.
 * The API is deliberately small so a real backend can replace it.
 */
const KEYS = {
  session: "kollage.v1.session",
  looks: "kollage.v1.looks",
  draft: "kollage.v1.draft",
} as const;

type Key = (typeof KEYS)[keyof typeof KEYS];

const listeners = new Set<() => void>();
const cache = new Map<Key, { raw: string | null; value: unknown }>();

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

function readRaw(key: Key): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function read<T>(key: Key, fallback: T): T {
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

function write(key: Key, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: keep working in memory for this page view.
    cache.set(key, { raw: "__memory__", value });
  }
  emit();
}

const EMPTY_LOOKS: Look[] = [];

/* ---------- session ---------- */

export function getSession(): Session | null {
  return read<Session | null>(KEYS.session, null);
}

export function signIn(session: Session) {
  write(KEYS.session, session);
}

export function signOut() {
  write(KEYS.session, null);
}

/* ---------- looks ---------- */

export function getLooks(): Look[] {
  return read<Look[]>(KEYS.looks, EMPTY_LOOKS);
}

export function upsertLook(look: Look) {
  const looks = getLooks();
  const exists = looks.some((l) => l.id === look.id);
  write(KEYS.looks, exists ? looks.map((l) => (l.id === look.id ? look : l)) : [look, ...looks]);
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

export function setDraft(draft: Draft | null) {
  write(KEYS.draft, draft);
}

/* ---------- hooks ---------- */

const serverNull = () => null;
const serverLooks = () => EMPTY_LOOKS;

export function useSession() {
  return useSyncExternalStore(subscribe, getSession, serverNull);
}

export function useLooks() {
  return useSyncExternalStore(subscribe, getLooks, serverLooks);
}

export function useDraft() {
  return useSyncExternalStore(subscribe, getDraft, serverNull);
}

/** False during server render and hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
