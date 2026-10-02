"use client";

import { bestOffer, getShop } from "@/lib/catalog";
import { MAX_W, MIN_W } from "@/lib/collage";
import { formatCHF } from "@/lib/format";
import { offerHref, shippingText } from "@/lib/look";
import type { CanvasItem, Product } from "@/lib/types";
import { ProductImage } from "../GarmentArt";
import { Icon } from "../Icon";

/**
 * Properties of the selected piece: what it is and what it costs, then fine adjustments.
 * Quick actions (Ersetzen, Merken, Entfernen) live in the toolbar under the canvas, not here.
 * Desktop: side panel. Phone: «Mehr» sheet.
 */
export function PieceInspector({
  item,
  product,
  idPrefix,
  onScale,
  onRotate,
  onStart,
  onLayer,
  onDuplicate,
  owned,
  onOwned,
}: {
  item: CanvasItem;
  product: Product;
  idPrefix: string;
  onScale: (w: number) => void;
  onRotate: (deg: number) => void;
  onStart: () => void;
  onLayer: (move: "front" | "back" | "backward") => void;
  onDuplicate: () => void;
  /** «Habe ich schon»: the same wardrobe as on the look page; owned pieces leave «Noch zu kaufen». */
  owned: boolean;
  onOwned: () => void;
}) {
  const offer = bestOffer(product);
  const shop = getShop(offer.shopId);
  return (
    <div className="inspector">
      <div className="inspector__product">
        <div className="inspector__thumb" aria-hidden="true">
          <ProductImage product={product} className="buy-row__img" sizes="64px" />
        </div>
        <div className="inspector__info">
          <p className="inspector__name">{product.title}</p>
          <p className="inspector__meta">{product.colorName}</p>
          <p className="inspector__price num">{formatCHF(offer.priceCHF)}</p>
        </div>
      </div>
      <p className="inspector__shop">
        {shop.name} · {shippingText(shop)}
        <br />
        <a href={offerHref(offer.id, null)} target="_blank" rel="sponsored nofollow noopener" className="link-arrow">
          Angebot ansehen <Icon name="external" size={14} />
          <span className="sr-only">(Partnerlink, neues Fenster)</span>
        </a>
      </p>
      <button type="button" className="own-toggle inspector__own" aria-pressed={owned} onClick={onOwned}>
        <span className="own-toggle__box" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
        Habe ich schon<span className="sr-only">: {product.title}</span>
      </button>

      <div className="inspector__group">
        <div className="field">
          <label htmlFor={`${idPrefix}-scale`}>
            Grösse <span className="num">{Math.round((item.w / 300) * 100)} %</span>
          </label>
          <input
            id={`${idPrefix}-scale`}
            type="range"
            min={MIN_W}
            max={MAX_W}
            step={5}
            value={Math.round(item.w)}
            onPointerDown={onStart}
            onKeyDown={onStart}
            onChange={(e) => onScale(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-rot`}>
            Drehung <span className="num">{Math.round(item.rotation)}°</span>
          </label>
          <input
            id={`${idPrefix}-rot`}
            type="range"
            min={-180}
            max={180}
            step={1}
            value={Math.round(item.rotation)}
            onPointerDown={onStart}
            onKeyDown={onStart}
            onChange={(e) => onRotate(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="inspector__group">
        <p className="inspector__label">Ebene</p>
        <div className="inspector__pair">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onLayer("front")}>
            Nach vorne
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onLayer("back")}>
            Nach hinten
          </button>
        </div>
        <button type="button" className="btn btn--ghost btn--sm inspector__dup" onClick={onDuplicate}>
          <Icon name="copy" size={16} /> Duplizieren
        </button>
      </div>
    </div>
  );
}
