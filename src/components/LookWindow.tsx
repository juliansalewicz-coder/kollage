import { getProduct, imageAspect } from "@/lib/catalog";
import { CANVAS_H, CANVAS_W, itemHeight, itemStyle, readingOrder } from "@/lib/collage";
import type { Backdrop, CanvasItem } from "@/lib/types";
import { ProductImage } from "./GarmentArt";

export function numberPieces(items: CanvasItem[]): Map<string, number> {
  return new Map(readingOrder(items).map((it, i) => [it.uid, i + 1]));
}

/** Read-only shop window: the collage on its paper sweep, optionally with numbered price tags. */
export function LookWindow({
  items,
  backdrop,
  label,
  tags = false,
  highlight = null,
  onHighlight,
  className = "",
  frame = "full",
  pieceSizes = "160px",
}: {
  items: CanvasItem[];
  backdrop: Backdrop;
  label?: string;
  tags?: boolean;
  highlight?: string | null;
  onHighlight?: (uid: string | null) => void;
  className?: string;
  frame?: "full" | "thin";
  pieceSizes?: string;
}) {
  const numbers = tags ? numberPieces(items) : null;
  const sorted = [...items].sort((a, b) => a.z - b.z);
  return (
    <div className={`window window--${frame} ${highlight ? "has-highlight" : ""} ${className}`} data-backdrop={backdrop}>
      <div className="window__glass" role={label ? "img" : undefined} aria-label={label}>
        <div className="window__light" aria-hidden="true" />
        {sorted.map((it, i) => {
          const product = getProduct(it.productId);
          if (!product) return null;
          return (
            <div
              key={it.uid}
              className={`piece ${highlight === it.uid ? "is-lit" : ""}`}
              style={{ ...itemStyle(it, imageAspect(product)), ["--i" as string]: i }}
              onPointerEnter={onHighlight ? () => onHighlight(it.uid) : undefined}
              onPointerLeave={onHighlight ? () => onHighlight(null) : undefined}
            >
              <ProductImage product={product} className="piece__img" sizes={pieceSizes} />
            </div>
          );
        })}
        {numbers &&
          sorted.map((it) => {
            const product = getProduct(it.productId);
            if (!product) return null;
            const h = itemHeight(it, imageAspect(product));
            const left = Math.min(90, Math.max(2, ((it.x - it.w / 2) / CANVAS_W) * 100 + 1));
            const top = Math.min(92, Math.max(2, ((it.y - h / 2) / CANVAS_H) * 100));
            return (
              <span
                key={`t-${it.uid}`}
                className={`tag-mark ${highlight === it.uid ? "is-lit" : ""}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-hidden="true"
              >
                {numbers.get(it.uid)}
              </span>
            );
          })}
      </div>
    </div>
  );
}
