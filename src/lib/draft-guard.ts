import type { CanvasItem, Draft, Look } from "./types";

type DraftContent = Pick<Draft, "items" | "title" | "note" | "occasion" | "backdrop" | "lookId">;

function itemKey(it: CanvasItem): string {
  return [it.productId, Math.round(it.x), Math.round(it.y), Math.round(it.w), Math.round(it.rotation), it.z].join(":");
}

export function sameItems(a: CanvasItem[], b: CanvasItem[]): boolean {
  if (a.length !== b.length) return false;
  const ka = a.map(itemKey).sort();
  const kb = b.map(itemKey).sort();
  return ka.every((k, i) => k === kb[i]);
}

/**
 * True when replacing the current draft would lose work: it has pieces and is
 * either unsaved or differs from the saved look it edits.
 */
export function draftNeedsGuard(draft: DraftContent | null, looks: Look[]): boolean {
  if (!draft || draft.items.length === 0) return false;
  if (!draft.lookId) return true;
  const saved = looks.find((l) => l.id === draft.lookId);
  if (!saved) return true;
  return !(
    sameItems(saved.items, draft.items) &&
    saved.title === (draft.title.trim() || saved.title) &&
    saved.note === draft.note.trim() &&
    saved.occasion === draft.occasion &&
    saved.backdrop === draft.backdrop
  );
}
