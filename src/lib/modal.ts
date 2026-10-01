/**
 * Makes everything outside `el` inert (not focusable, not clickable, hidden from assistive tech),
 * so an overlay that is not a native <dialog> still behaves like a modal. `keep` stays usable
 * (e.g. the scrim that closes the overlay). Returns the undo function.
 */
export function isolate(el: HTMLElement, keep: Element[] = []): () => void {
  const changed: HTMLElement[] = [];
  let node: HTMLElement = el;
  while (node.parentElement && node !== document.body) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert || keep.includes(sibling)) continue;
      if (sibling.tagName === "SCRIPT" || sibling.tagName === "STYLE") continue;
      sibling.inert = true;
      changed.push(sibling);
    }
    node = node.parentElement;
  }
  return () => changed.forEach((s) => (s.inert = false));
}

/** True on layouts where the product gallery is a bottom sheet (phones, small tablets). */
export const COMPACT_QUERY = "(max-width: 1023px)";
