"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Backdrop, CanvasItem, Draft, Occasion } from "@/lib/types";
import { archiveDraft, getDraft, probeStorage, setDraft } from "@/lib/store";

export interface Snapshot {
  items: CanvasItem[];
  title: string;
  note: string;
  occasion: Occasion;
  backdrop: Backdrop;
  lookId: string | null;
  basedOn: string | null;
  budget?: number | null;
}

export const EMPTY: Snapshot = { items: [], title: "", note: "", occasion: "alltag", backdrop: "papier", lookId: null, basedOn: null, budget: null };

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
    budget: d.budget ?? null,
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
    probeStorage();
    const stored = getDraft();
    setH((cur) => {
      // Someone was faster than the load (clicked right after hydration): keep that work and
      // put the stored draft aside instead of overwriting either of them.
      if (cur.past.length > 0) {
        if (stored && stored.items.length) archiveDraft(stored);
        return cur;
      }
      return { past: [], present: fromDraft(stored), future: [] };
    });
    setReady(true);
  }, []);

  /* Autosave, debounced. `dirty` makes sure the last change is written when the page is left early. */
  const dirty = useRef(false);
  /** Result of the last autosave: the UI only claims "gesichert" after a write that really succeeded. */
  const [draftSaved, setDraftSaved] = useState<boolean | null>(null);
  const flush = useCallback(() => {
    if (!dirty.current) return;
    dirty.current = false;
    setDraftSaved(setDraft({ ...live.current, updatedAt: new Date().toISOString() }));
  }, []);

  useEffect(() => {
    if (!ready) return;
    dirty.current = true;
    const t = window.setTimeout(flush, 250);
    return () => window.clearTimeout(t);
  }, [h.present, ready, flush]);

  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

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
      // The budget is a personal setting, not part of the collage history.
      const prev = { ...cur.past[cur.past.length - 1], budget: cur.present.budget };
      return { past: cur.past.slice(0, -1), present: prev, future: [cur.present, ...cur.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setH((cur) => {
      if (!cur.future.length) return cur;
      const next = { ...cur.future[0], budget: cur.present.budget };
      return { past: [...cur.past, cur.present], present: next, future: cur.future.slice(1) };
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
    draftSaved,
  };
}
