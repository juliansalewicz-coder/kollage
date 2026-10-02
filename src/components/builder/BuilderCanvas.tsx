"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { getProduct, imageAspect } from "@/lib/catalog";
import { CANVAS_H, CANVAS_W, clampItem, itemStyle, layerItem, MAX_W, MIN_W, moveItem, removeItem, rotateItem, scaleItem, updateItem } from "@/lib/collage";
import type { Backdrop, CanvasItem } from "@/lib/types";
import { ProductImage } from "../GarmentArt";
import { applyBox, PieceGesture, type GestureMode, type Pose } from "./gesture";
import type { Snapshot } from "./useBuilder";

export interface CanvasFx {
  uids: string[];
  kind: "add" | "swap";
  /** Product shown before a swap; it fades out where the new one fades in. */
  from?: string;
  key: number;
}

const KEY_ACTIONS: Record<string, (xs: CanvasItem[], uid: string, big: boolean) => CanvasItem[]> = {
  ArrowLeft: (xs, uid, big) => moveItem(xs, uid, big ? -50 : -10, 0),
  ArrowRight: (xs, uid, big) => moveItem(xs, uid, big ? 50 : 10, 0),
  ArrowUp: (xs, uid, big) => moveItem(xs, uid, 0, big ? -50 : -10),
  ArrowDown: (xs, uid, big) => moveItem(xs, uid, 0, big ? 50 : 10),
  "+": (xs, uid) => scaleItem(xs, uid, 1.08),
  "=": (xs, uid) => scaleItem(xs, uid, 1.08),
  "-": (xs, uid) => scaleItem(xs, uid, 1 / 1.08),
  r: (xs, uid) => rotateItem(xs, uid, 5),
  R: (xs, uid) => rotateItem(xs, uid, -5),
  PageUp: (xs, uid) => layerItem(xs, uid, "forward"),
  PageDown: (xs, uid) => layerItem(xs, uid, "backward"),
};

/**
 * The editable collage. Pieces are laid out from state; gestures (mouse, one finger, two-finger
 * pinch, trackpad pinch) move them with transforms only and commit once at the end.
 */
export function BuilderCanvas({
  items,
  backdrop,
  selected,
  onSelect,
  commit,
  onDropProduct,
  emptyState,
  fx = null,
}: {
  items: CanvasItem[];
  backdrop: Backdrop;
  selected: string | null;
  onSelect: (uid: string | null) => void;
  commit: (fn: (s: Snapshot) => Snapshot) => void;
  onDropProduct: (productId: string, x: number, y: number) => void;
  emptyState: React.ReactNode;
  /** Short feedback: pieces that just arrived, or a piece whose product was just swapped. */
  fx?: CanvasFx | null;
}) {
  const glass = useRef<HTMLDivElement>(null);
  const guideV = useRef<HTMLSpanElement>(null);
  const guideH = useRef<HTMLSpanElement>(null);
  const gesture = useRef<PieceGesture | null>(null);
  const [dropHover, setDropHover] = useState(false);
  // Latest props for the native listeners below (registered once).
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  // Listeners registered once (trackpad pinch) must call the current commit, not the one from the first render
  // (which is a no-op while the server-rendered preview is shown).
  const commitRef = useRef(commit);
  commitRef.current = commit;

  const sorted = [...items].sort((a, b) => a.z - b.z);
  const selItem = items.find((i) => i.uid === selected) ?? null;
  const aspectOf = (it: CanvasItem) => {
    const p = getProduct(it.productId);
    return p ? imageAspect(p) : 1;
  };
  // Canvas is about 90 % of a phone screen and at most 560 px wide on desktop.
  const sizesFor = (it: CanvasItem) => {
    const f = Math.min(1, it.w / CANVAS_W);
    return `(max-width: 767px) ${Math.ceil(f * 92)}vw, ${Math.ceil(f * 560)}px`;
  };

  const pieceEl = (uid: string) => glass.current?.querySelector<HTMLElement>(`[data-uid="${uid}"]`) ?? null;
  const frameEl = () => glass.current?.querySelector<HTMLElement>(".selection-frame") ?? null;

  function save(uid: string, pose: Pose) {
    commitRef.current((s) => ({ ...s, items: updateItem(s.items, uid, clampItem({ ...s.items.find((i) => i.uid === uid)!, ...pose })) }));
  }

  /** Short settle animation after a piece is put down. Class only, no re-render. */
  function settle(el: HTMLElement) {
    el.classList.remove("is-lifted");
    el.classList.add("is-settling");
    el.addEventListener("animationend", () => el.classList.remove("is-settling"), { once: true });
  }

  function begin(e: ReactPointerEvent, it: CanvasItem, mode: GestureMode) {
    if (e.button !== 0) return;
    e.stopPropagation();
    // No text selection or native image drag: they would cancel the pointer stream.
    e.preventDefault();
    const piece = pieceEl(it.uid);
    if (!piece || !glass.current) return;
    if (mode === "move") piece.focus({ preventScroll: true });
    onSelect(it.uid);
    gesture.current = new PieceGesture(
      {
        glass: glass.current,
        piece,
        frame: frameEl,
        guides: { v: guideV.current, h: guideH.current },
        aspect: aspectOf(it),
        onFirstMove: () => piece.classList.add("is-lifted"),
        onEnd: (pose) => {
          settle(piece);
          if (pose) save(it.uid, pose);
        },
      },
      mode,
      it,
      e.nativeEvent,
    );
  }

  /* While a gesture runs, every pointer of the window counts: a second finger anywhere joins as pinch. */
  useEffect(() => {
    const onMove = (e: PointerEvent) => gesture.current?.move(e);
    const onUp = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g?.has(e.pointerId)) return;
      if (g.pointerCount > 1) g.remove(e.pointerId);
      else {
        gesture.current = null;
        g.end(e.type === "pointercancel");
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  /* Trackpad pinch (ctrl + wheel) scales the selected piece; one undo step per pinch. */
  const wheel = useRef<{ uid: string; origin: Pose; pose: Pose; timer: number; aspect: number } | null>(null);
  useEffect(() => {
    const el = glass.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const it = itemsRef.current.find((i) => i.uid === selectedRef.current);
      if (!e.ctrlKey || !it) return;
      e.preventDefault();
      const piece = pieceEl(it.uid);
      if (!piece) return;
      let w = wheel.current;
      if (!w || w.uid !== it.uid) {
        const origin = { x: it.x, y: it.y, w: it.w, rotation: it.rotation };
        w = wheel.current = { uid: it.uid, origin, pose: { ...origin }, timer: 0, aspect: aspectOf(it) };
      }
      w.pose.w = Math.min(MAX_W, Math.max(MIN_W, w.pose.w * Math.exp(-e.deltaY * 0.01)));
      piece.style.transform = `rotate(${w.pose.rotation}deg) scale(${w.pose.w / w.origin.w})`;
      const frame = frameEl();
      if (frame) applyBox(frame, w.pose, w.aspect);
      window.clearTimeout(w.timer);
      const current = w;
      w.timer = window.setTimeout(() => {
        wheel.current = null;
        applyBox(piece, current.pose, current.aspect);
        save(current.uid, current.pose);
      }, 200);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onKey(e: KeyboardEvent, it: CanvasItem) {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      commit((s) => ({ ...s, items: removeItem(s.items, it.uid) }));
      onSelect(null);
      glass.current?.focus();
      return;
    }
    if (e.key === "Escape") return onSelect(null);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      return onSelect(it.uid);
    }
    const action = KEY_ACTIONS[e.key];
    if (!action) return;
    e.preventDefault();
    commit((s) => ({ ...s, items: action(s.items, it.uid, e.shiftKey) }));
  }

  return (
    <div className={`window window--full window--edit ${dropHover ? "is-drop" : ""}`} data-backdrop={backdrop}>
      <div
        ref={glass}
        className="window__glass"
        tabIndex={-1}
        aria-label="Leinwand"
        onPointerDown={(e) => {
          // A second finger on the canvas joins the running gesture (pinch).
          const g = gesture.current;
          if (g && e.pointerType === "touch") {
            e.preventDefault();
            g.add(e.nativeEvent);
            return;
          }
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("window__light")) onSelect(null);
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("text/kollage-product")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setDropHover(true);
          }
        }}
        onDragLeave={() => setDropHover(false)}
        onDrop={(e) => {
          const id = e.dataTransfer.getData("text/kollage-product");
          setDropHover(false);
          if (!id || !glass.current) return;
          e.preventDefault();
          const rect = glass.current.getBoundingClientRect();
          onDropProduct(id, ((e.clientX - rect.left) * CANVAS_W) / rect.width, ((e.clientY - rect.top) * CANVAS_H) / rect.height);
        }}
      >
        <div className="window__light" aria-hidden="true" />
        <span ref={guideV} className="guide guide--v" aria-hidden="true" />
        <span ref={guideH} className="guide guide--h" aria-hidden="true" />
        {!items.length && emptyState}
        {sorted.map((it) => {
          const product = getProduct(it.productId);
          if (!product) return null;
          const isSel = selected === it.uid;
          const effect = fx && fx.uids.includes(it.uid) ? fx : null;
          const ghost = effect?.kind === "swap" && effect.from ? getProduct(effect.from) : undefined;
          return (
            <div
              key={it.uid}
              data-uid={it.uid}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={`${product.title}, ${product.colorName}`}
              aria-describedby="canvas-help"
              className={`piece piece--edit ${isSel ? "is-selected" : ""} ${effect ? `fx-${effect.kind}` : ""}`}
              style={itemStyle(it, imageAspect(product))}
              onPointerDown={(e) => {
                if (gesture.current && e.pointerType === "touch") return; // handled by the canvas as second finger
                begin(e, it, "move");
              }}
              onFocus={() => onSelect(it.uid)}
              onKeyDown={(e) => onKey(e, it)}
            >
              {ghost && (
                <span key={`g${effect!.key}`} className="piece__ghost" aria-hidden="true">
                  <ProductImage product={ghost} className="piece__img" sizes={sizesFor(it)} priority />
                </span>
              )}
              <span key={effect ? `n${effect.key}` : "n"} className="piece__inner">
                <ProductImage product={product} className="piece__img" sizes={sizesFor(it)} priority />
              </span>
            </div>
          );
        })}
        {selItem && (
          <div key={selItem.uid} className="selection-frame" style={{ ...itemStyle(selItem, aspectOf(selItem)), zIndex: 5000 }} aria-hidden="true">
            <span className="handle handle--rotate" onPointerDown={(e) => begin(e, selItem, "rotate")} />
            <span className="handle handle--scale" onPointerDown={(e) => begin(e, selItem, "scale")} />
          </div>
        )}
      </div>
      <p id="canvas-help" className="sr-only">
        Pfeiltasten verschieben, mit Umschalt in grossen Schritten. Plus und Minus ändern die Grösse, r und Umschalt+r drehen, Bild-auf und Bild-ab
        ändern die Ebene, Entfernen löscht das Teil. Auf Touchscreens mit zwei Fingern skalieren und drehen.
      </p>
    </div>
  );
}
