import { bestOffer, getProduct, imageAspect } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { CANVAS_H, CANVAS_W, itemHeight, itemStyle } from "@/lib/collage";
import { outfitOrder } from "@/lib/look";
import type { Backdrop, CanvasItem } from "@/lib/types";
import { ProductImage } from "./GarmentArt";

export function numberPieces(items: CanvasItem[]): Map<string, number> {
  return new Map(outfitOrder(items).map((it, i) => [it.uid, i + 1]));
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
  width = { phoneVw: 45, px: 300 },
  priority = false,
  onPieceActivate,
  activePiece = null,
  labels = false,
  muted = [],
}: {
  items: CanvasItem[];
  backdrop: Backdrop;
  label?: string;
  tags?: boolean;
  highlight?: string | null;
  onHighlight?: (uid: string | null) => void;
  className?: string;
  frame?: "full" | "thin";
  /** Rendered width of the whole collage: share of the phone viewport and desktop pixels. Sets each piece's `sizes`. */
  width?: { phoneVw: number; px: number };
  /** Load the pieces first (collage on the first screen). */
  priority?: boolean;
  /** Makes every piece a button (look page only; never inside a link). */
  onPieceActivate?: (uid: string) => void;
  activePiece?: string | null;
  /** Name and price next to the piece under the pointer or keyboard focus, instead of permanent number tags. */
  labels?: boolean;
  /** Placements shown faded, e.g. pieces the person already owns. */
  muted?: string[];
}) {
  const numbers = tags ? numberPieces(items) : null;
  const sorted = [...items].sort((a, b) => a.z - b.z);
  const sizesFor = (it: CanvasItem) => {
    const f = Math.min(1, it.w / CANVAS_W);
    return `(max-width: 767px) ${Math.ceil(f * width.phoneVw)}vw, ${Math.ceil(f * width.px)}px`;
  };
  return (
    <div className={`window window--${frame} ${highlight ? "has-highlight" : ""} ${className}`} data-backdrop={backdrop}>
      <div className="window__glass" role={label ? (onPieceActivate ? "group" : "img") : undefined} aria-label={label}>
        <div className="window__light" aria-hidden="true" />
        {sorted.map((it, i) => {
          const product = getProduct(it.productId);
          if (!product) return null;
          const style = { ...itemStyle(it, imageAspect(product)), ["--i" as string]: i };
          const cls = `piece ${highlight === it.uid ? "is-lit" : ""} ${activePiece === it.uid ? "is-active" : ""} ${muted.includes(it.uid) ? "is-muted" : ""}`;
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
                <ProductImage product={product} className="piece__img" sizes={sizesFor(it)} priority={priority} />
              </button>
            );
          }
          return (
            <div key={it.uid} className={cls} style={style} {...hover}>
              <ProductImage product={product} className="piece__img" sizes={sizesFor(it)} priority={priority} />
            </div>
          );
        })}
        {labels &&
          (() => {
            const it = items.find((i) => i.uid === highlight);
            const product = it ? getProduct(it.productId) : undefined;
            if (!it || !product) return null;
            const h = itemHeight(it, imageAspect(product));
            const below = (it.y + h / 2) / CANVAS_H < 0.84;
            const left = Math.min(80, Math.max(20, (it.x / CANVAS_W) * 100));
            const top = below ? ((it.y + h / 2) / CANVAS_H) * 100 : ((it.y - h / 2) / CANVAS_H) * 100;
            return (
              <span
                key={`l-${it.uid}`}
                className={`piece-label ${below ? "is-below" : "is-above"}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-hidden="true"
              >
                <span className="piece-label__title">{product.title}</span>
                <span className="piece-label__price num">{formatCHF(bestOffer(product).priceCHF)}</span>
              </span>
            );
          })()}
        {numbers &&
          sorted.map((it) => {
            const product = getProduct(it.productId);
            if (!product) return null;
            const h = itemHeight(it, imageAspect(product));
            // On the garment itself (upper middle), so overlapping pieces never hide their number.
            const left = Math.min(95, Math.max(5, (it.x / CANVAS_W) * 100));
            const top = Math.min(95, Math.max(4, ((it.y - h * 0.22) / CANVAS_H) * 100));
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
