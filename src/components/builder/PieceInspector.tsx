"use client";

import { bestOffer, getShop } from "@/lib/catalog";
import { MAX_W, MIN_W } from "@/lib/collage";
import { formatCHF } from "@/lib/format";
import { offerHref, shippingText } from "@/lib/look";
import type { CanvasItem, Product } from "@/lib/types";
import { FavoriteButton } from "../FavoriteButton";
import { ProductImage } from "../GarmentArt";
import { Icon } from "../Icon";

/** Everything about the selected piece. Desktop: side panel. Phone: «Mehr» sheet. */
export function PieceInspector({
  item,
  product,
  idPrefix,
  onReplace,
  onScale,
  onRotate,
  onStart,
  onLayer,
  onDuplicate,
}: {
  item: CanvasItem;
  product: Product;
  idPrefix: string;
  onReplace: () => void;
  onScale: (w: number) => void;
  onRotate: (deg: number) => void;
  onStart: () => void;
  onLayer: (move: "front" | "back" | "backward") => void;
  onDuplicate: () => void;
}) {
  const offer = bestOffer(product);
  const shop = getShop(offer.shopId);
  return (
    <div className="inspector">
      <div className="inspector__product">
        <div className="inspector__thumb" aria-hidden="true">
          <ProductImage product={product} className="buy-row__img" sizes="64px" />
        </div>
        <div>
          <p className="inspector__name">{product.title}</p>
          <p className="inspector__meta">
            {product.colorName} · <span className="num">{formatCHF(offer.priceCHF)}</span>
          </p>
          <p className="inspector__meta">
            {shop.name} · {shippingText(shop)}
          </p>
          <a href={offerHref(offer.id, null)} target="_blank" rel="sponsored nofollow noopener" className="link-arrow">
            Angebot ansehen <Icon name="external" size={14} />
            <span className="sr-only">(Partnerlink, neues Fenster)</span>
          </a>
        </div>
      </div>
      <div className="inspector__row">
        <button type="button" className="btn btn--primary btn--sm" onClick={onReplace}>
          <Icon name="swap" size={16} /> Ersetzen
        </button>
        <FavoriteButton kind="products" id={product.id} label={product.title} variant="pill" className="btn--sm" />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-scale`}>
          Skalierung auf der Leinwand <span className="num">{Math.round((item.w / 300) * 100)}%</span>
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
      <div className="inspector__row">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onLayer("front")}>
          Ganz nach vorne
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onLayer("back")}>
          Ganz nach hinten
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDuplicate}>
          <Icon name="copy" size={16} /> Duplizieren
        </button>
      </div>
    </div>
  );
}
