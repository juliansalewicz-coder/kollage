"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Backdrop, CanvasItem, Draft, Occasion } from "@/lib/types";
import { getDraft, setDraft } from "@/lib/store";

export interface Snapshot {
  items: CanvasItem[];
  title: string;
  note: string;
  occasion: Occasion;
  backdrop: Backdrop;
  lookId: string | null;
  basedOn: string | null;
}

export const EMPTY: Snapshot = { items: [], title: "", note: "", occasion: "alltag", backdrop: "papier", lookId: null, basedOn: null };

function fromDraft(d: Draft | null): Snapshot {
  if (!d) return EMPTY;
  return {
    items: d.items ?? [],
    title: d.title ?? "",
    note: d.note ?? "",
    occasion: d.occasion ?? "alltag",
    backdrop: d.backdrop ?? "papier",
    lookId: d.lookId ?? null,
    basedOn: d.basedOn ?? null,
  };
}

interface History {
  past: Snapshot[];
  present: Snapshot;
  future: Snapshot[];
}

const LIMIT = 60;

/**
 * Builder state with undo/redo. Every change is autosaved as the browser draft,
 * so a reload or the sign-in step never loses work.
 */
export function useBuilder() {
  const [h, setH] = useState<History>({ past: [], present: EMPTY, future: [] });
  const [ready, setReady] = useState(false);
  const live = useRef(h.present);
  live.current = h.present;

  useEffect(() => {
    setH({ past: [], present: fromDraft(getDraft()), future: [] });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setDraft({ ...h.present, updatedAt: new Date().toISOString() }), 250);
    return () => window.clearTimeout(t);
  }, [h.present, ready]);

  /** Commit a change as one history step. */
  const commit = useCallback((next: (s: Snapshot) => Snapshot) => {
    setH((cur) => {
      const value = next(cur.present);
      if (value === cur.present) return cur;
      return { past: [...cur.past, cur.present].slice(-LIMIT), present: value, future: [] };
    });
  }, []);

  /** Live change without a history step (during a drag). Call `checkpoint` once when the drag starts. */
  const preview = useCallback((next: (s: Snapshot) => Snapshot) => {
    setH((cur) => ({ ...cur, present: next(cur.present) }));
  }, []);

  const checkpoint = useCallback(() => {
    setH((cur) => ({ past: [...cur.past, cur.present].slice(-LIMIT), present: cur.present, future: [] }));
  }, []);

  const undo = useCallback(() => {
    setH((cur) => {
      if (!cur.past.length) return cur;
      return { past: cur.past.slice(0, -1), present: cur.past[cur.past.length - 1], future: [cur.present, ...cur.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setH((cur) => {
      if (!cur.future.length) return cur;
      return { past: [...cur.past, cur.present], present: cur.future[0], future: cur.future.slice(1) };
    });
  }, []);

  return {
    state: h.present,
    ready,
    commit,
    preview,
    checkpoint,
    undo,
    redo,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    live,
  };
}
