import { bestOffer, getProduct, imageAspect } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
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
  onPieceActivate,
  activePiece = null,
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
  /** Makes every piece a button (look page only; never inside a link). */
  onPieceActivate?: (uid: string) => void;
  activePiece?: string | null;
}) {
  const numbers = tags ? numberPieces(items) : null;
  const sorted = [...items].sort((a, b) => a.z - b.z);
  return (
    <div className={`window window--${frame} ${highlight ? "has-highlight" : ""} ${className}`} data-backdrop={backdrop}>
      <div className="window__glass" role={label ? (onPieceActivate ? "group" : "img") : undefined} aria-label={label}>
        <div className="window__light" aria-hidden="true" />
        {sorted.map((it, i) => {
          const product = getProduct(it.productId);
          if (!product) return null;
          const style = { ...itemStyle(it, imageAspect(product)), ["--i" as string]: i };
          const cls = `piece ${highlight === it.uid ? "is-lit" : ""} ${activePiece === it.uid ? "is-active" : ""}`;
          const hover = {
            onPointerEnter: onHighlight ? () => onHighlight(it.uid) : undefined,
            onPointerLeave: onHighlight ? () => onHighlight(null) : undefined,
          };
          if (onPieceActivate) {
            const n = numbers?.get(it.uid);
            return (
              <button
                key={it.uid}
                type="button"
                className={`${cls} piece--button`}
                style={style}
                {...hover}
                onFocus={onHighlight ? () => onHighlight(it.uid) : undefined}
                onBlur={onHighlight ? () => onHighlight(null) : undefined}
                onClick={() => onPieceActivate(it.uid)}
                aria-haspopup="dialog"
                aria-label={`${n ? `Teil ${n}: ` : ""}${product.title}, ${product.colorName}, ${formatCHF(bestOffer(product).priceCHF)}. Details öffnen`}
                data-product={product.id}
              >
                <ProductImage product={product} className="piece__img" sizes={pieceSizes} />
              </button>
            );
          }
          return (
            <div key={it.uid} className={cls} style={style} {...hover}>
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
