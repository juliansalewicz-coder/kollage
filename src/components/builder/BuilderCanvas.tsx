"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { getProduct, imageAspect } from "@/lib/catalog";
import { CANVAS_H, CANVAS_W, itemStyle, layerItem, moveItem, removeItem, rotateItem, scaleItem, updateItem } from "@/lib/collage";
import type { Backdrop, CanvasItem } from "@/lib/types";
import { ProductImage } from "../GarmentArt";
import type { Snapshot } from "./useBuilder";

type Mode = "move" | "scale" | "rotate";

interface Drag {
  uid: string;
  mode: Mode;
  pointerId: number;
  startX: number;
  startY: number;
  orig: CanvasItem;
  /** Item centre in client pixels, for scale and rotate. */
  cx: number;
  cy: number;
  moved: boolean;
}

export function BuilderCanvas({
  items,
  backdrop,
  selected,
  onSelect,
  preview,
  checkpoint,
  commit,
  onDropProduct,
  emptyState,
}: {
  items: CanvasItem[];
  backdrop: Backdrop;
  selected: string | null;
  onSelect: (uid: string | null) => void;
  preview: (fn: (s: Snapshot) => Snapshot) => void;
  checkpoint: () => void;
  commit: (fn: (s: Snapshot) => Snapshot) => void;
  onDropProduct: (productId: string, x: number, y: number) => void;
  emptyState: React.ReactNode;
}) {
  const glass = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [lifted, setLifted] = useState<string | null>(null);
  const [settling, setSettling] = useState<string | null>(null);
  const [dropHover, setDropHover] = useState(false);

  const sorted = [...items].sort((a, b) => a.z - b.z);
  const selItem = items.find((i) => i.uid === selected) ?? null;
  const selProduct = selItem ? getProduct(selItem.productId) : undefined;
  const selAspect = selProduct ? imageAspect(selProduct) : null;

  function unitsPerPx() {
    const rect = glass.current!.getBoundingClientRect();
    return { ux: CANVAS_W / rect.width, uy: CANVAS_H / rect.height, rect };
  }

  function begin(e: PointerEvent, it: CanvasItem, mode: Mode) {
    if (e.button !== 0) return;
    e.stopPropagation();
    // Stop text selection and native drag, which would cancel the pointer stream.
    e.preventDefault();
    if (mode === "move") (e.currentTarget as HTMLElement).focus({ preventScroll: true });
    onSelect(it.uid);
    const { rect } = unitsPerPx();
    drag.current = {
      uid: it.uid,
      mode,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      orig: it,
      cx: rect.left + (it.x / CANVAS_W) * rect.width,
      cy: rect.top + (it.y / CANVAS_H) * rect.height,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - d.startX;
    const dyPx = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.hypot(dxPx, dyPx) < 3) return;
      d.moved = true;
      checkpoint();
      setLifted(d.uid);
    }
    const { ux, uy } = unitsPerPx();
    if (d.mode === "move") {
      preview((s) => ({ ...s, items: updateItem(s.items, d.uid, { x: d.orig.x + dxPx * ux, y: d.orig.y + dyPx * uy }) }));
    } else if (d.mode === "scale") {
      const start = Math.hypot(d.startX - d.cx, d.startY - d.cy) || 1;
      const now = Math.hypot(e.clientX - d.cx, e.clientY - d.cy);
      preview((s) => ({ ...s, items: updateItem(s.items, d.uid, { w: d.orig.w * (now / start) }) }));
    } else {
      const a0 = Math.atan2(d.startY - d.cy, d.startX - d.cx);
      const a1 = Math.atan2(e.clientY - d.cy, e.clientX - d.cx);
      let deg = d.orig.rotation + ((a1 - a0) * 180) / Math.PI;
      const snap = Math.round(deg / 45) * 45;
      if (Math.abs(deg - snap) < 4) deg = snap;
      preview((s) => ({ ...s, items: updateItem(s.items, d.uid, { rotation: deg }) }));
    }
  }

  function end(e: PointerEvent) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    setLifted(null);
    if (d.moved) {
      setSettling(d.uid);
      window.setTimeout(() => setSettling((s) => (s === d.uid ? null : s)), 360);
    }
  }

  function onKey(e: KeyboardEvent, it: CanvasItem) {
    const step = e.shiftKey ? 50 : 10;
    let fn: ((items: CanvasItem[]) => CanvasItem[]) | null = null;
    switch (e.key) {
      case "ArrowLeft":
        fn = (xs) => moveItem(xs, it.uid, -step, 0);
        break;
      case "ArrowRight":
        fn = (xs) => moveItem(xs, it.uid, step, 0);
        break;
      case "ArrowUp":
        fn = (xs) => moveItem(xs, it.uid, 0, -step);
        break;
      case "ArrowDown":
        fn = (xs) => moveItem(xs, it.uid, 0, step);
        break;
      case "+":
      case "=":
        fn = (xs) => scaleItem(xs, it.uid, 1.08);
        break;
      case "-":
        fn = (xs) => scaleItem(xs, it.uid, 1 / 1.08);
        break;
      case "r":
        fn = (xs) => rotateItem(xs, it.uid, 5);
        break;
      case "R":
        fn = (xs) => rotateItem(xs, it.uid, -5);
        break;
      case "PageUp":
        fn = (xs) => layerItem(xs, it.uid, "forward");
        break;
      case "PageDown":
        fn = (xs) => layerItem(xs, it.uid, "backward");
        break;
      case "Delete":
      case "Backspace":
        fn = (xs) => removeItem(xs, it.uid);
        onSelect(null);
        glass.current?.focus();
        break;
      case "Escape":
        onSelect(null);
        break;
      case "Enter":
      case " ":
        onSelect(it.uid);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (fn) {
      const f = fn;
      commit((s) => ({ ...s, items: f(s.items) }));
    }
  }

  return (
    <div className={`window window--full window--edit ${dropHover ? "is-drop" : ""}`} data-backdrop={backdrop}>
      <div
        ref={glass}
        className="window__glass"
        tabIndex={-1}
        aria-label="Leinwand"
        onPointerDown={(e) => {
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
          if (!id) return;
          e.preventDefault();
          const { ux, uy, rect } = unitsPerPx();
          onDropProduct(id, (e.clientX - rect.left) * ux, (e.clientY - rect.top) * uy);
        }}
      >
        <div className="window__light" aria-hidden="true" />
        {!items.length && emptyState}
        {sorted.map((it) => {
          const product = getProduct(it.productId);
          if (!product) return null;
          const isSel = selected === it.uid;
          return (
            <div
              key={it.uid}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={`${product.title}, ${product.colorName}`}
              aria-describedby="canvas-help"
              className={`piece piece--edit ${isSel ? "is-selected" : ""} ${lifted === it.uid ? "is-lifted" : ""} ${settling === it.uid ? "is-settling" : ""}`}
              style={itemStyle(it, imageAspect(product))}
              onPointerDown={(e) => begin(e, it, "move")}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onFocus={() => onSelect(it.uid)}
              onKeyDown={(e) => onKey(e, it)}
            >
              <ProductImage product={product} className="piece__img" sizes="(max-width: 767px) 45vw, 340px" />
            </div>
          );
        })}
        {selItem && selAspect !== null && (
          <div className="selection-frame" style={{ ...itemStyle(selItem, selAspect), zIndex: 5000 }} aria-hidden="true">
            <span
              className="handle handle--rotate"
              onPointerDown={(e) => begin(e, selItem, "rotate")}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
            />
            <span
              className="handle handle--scale"
              onPointerDown={(e) => begin(e, selItem, "scale")}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
            />
          </div>
        )}
      </div>
      <p id="canvas-help" className="sr-only">
        Pfeiltasten verschieben, mit Umschalt in grossen Schritten. Plus und Minus ändern die Grösse, r und Umschalt+r drehen, Bild-auf und Bild-ab
        ändern die Ebene, Entfernen löscht das Teil.
      </p>
    </div>
  );
}
