"use client";

import { useSyncExternalStore } from "react";
import { getSession } from "./store";

/* ---------- login requests ---------- */

export interface LoginRequest {
  reason: string;
  onSuccess: () => void;
}

let pending: LoginRequest | null = null;
const loginListeners = new Set<() => void>();

/**
 * Runs `onSuccess` right away for signed-in users. Guests get the sign-in dialog;
 * the draft stays in storage the whole time, so nothing is lost.
 */
export function requireLogin(reason: string, onSuccess: () => void) {
  if (getSession()) {
    onSuccess();
    return;
  }
  pending = { reason, onSuccess };
  loginListeners.forEach((l) => l());
}

export function openLogin() {
  pending = { reason: "Melde dich an, um Looks zu speichern und zu veröffentlichen.", onSuccess: () => {} };
  loginListeners.forEach((l) => l());
}

export function finishLogin(success: boolean) {
  const req = pending;
  pending = null;
  loginListeners.forEach((l) => l());
  if (success && req) req.onSuccess();
}

export function useLoginRequest(): LoginRequest | null {
  return useSyncExternalStore(
    (l) => {
      loginListeners.add(l);
      return () => loginListeners.delete(l);
    },
    () => pending,
    () => null,
  );
}

/* ---------- toasts ---------- */

export interface Toast {
  id: number;
  text: string;
}

let toasts: Toast[] = [];
let toastSeq = 0;
const toastListeners = new Set<() => void>();

export function toast(text: string) {
  const t = { id: ++toastSeq, text };
  toasts = [...toasts, t].slice(-3);
  toastListeners.forEach((l) => l());
  window.setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    toastListeners.forEach((l) => l());
  }, 4200);
}

const noToasts: Toast[] = [];

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => toastListeners.delete(l);
    },
    () => toasts,
    () => noToasts,
  );
}
