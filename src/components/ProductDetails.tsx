"use client";

import { getShop } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { offerHref, shippingText } from "@/lib/look";
import type { Product } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { ProductImage } from "./GarmentArt";
import { Icon } from "./Icon";

/** Product card used in the look-page sheet: price, shop, delivery and the offer link. */
export function ProductDetails({ product, lookId, number, onShowInList }: { product: Product; lookId: string | null; number?: number; onShowInList?: () => void }) {
  const offers = [...product.offers].sort((a, b) => a.priceCHF - b.priceCHF);
  const best = offers[0];
  const shop = getShop(best.shopId);
  return (
    <div className="pdetail">
      <div className="pdetail__media" aria-hidden="true">
        <ProductImage product={product} className="pdetail__img" sizes="220px" />
      </div>
      <div className="pdetail__info">
        <p className="pdetail__meta">
          {number !== undefined && <span className="tag-num tag-num--sm">{number}</span>} {product.colorName}
          <span className="pdetail__demo">Demo-Artikel</span>
        </p>
        <p className="pdetail__price num">{formatCHF(best.priceCHF)}</p>
        <p className="pdetail__shop">
          {shop.name} · Lieferung CH {shop.deliveryDays}
          <br />
          {shippingText(shop)}
        </p>
        <div className="pdetail__actions">
          <a href={offerHref(best.id, lookId)} target="_blank" rel="sponsored nofollow noopener" className="btn btn--primary">
            Zum Shop <Icon name="external" size={16} />
            <span className="sr-only">: {product.title} bei {shop.name} (Partnerlink, neues Fenster)</span>
          </a>
          <FavoriteButton kind="products" id={product.id} label={product.title} variant="pill" />
        </div>
        {offers.length > 1 && (
          <div className="pdetail__offers">
            <p className="pdetail__offers-title">Weitere Angebote</p>
            <ul>
              {offers.slice(1).map((o) => {
                const s = getShop(o.shopId);
                return (
                  <li key={o.id}>
                    <span>
                      {s.name} · {s.deliveryDays}
                    </span>
                    <span className="num">{formatCHF(o.priceCHF)}</span>
                    <a href={offerHref(o.id, lookId)} target="_blank" rel="sponsored nofollow noopener" className="link-arrow">
                      Zum Shop <span className="sr-only">(Partnerlink, neues Fenster)</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {onShowInList && (
          <button type="button" className="text-btn pdetail__list" onClick={onShowInList}>
            In der Teileliste zeigen
          </button>
        )}
        <p className="fineprint">Partnerlink. Preise und Lieferung gelten beim Händler; hier Beispielwerte aus dem Demo-Katalog.</p>
      </div>
    </div>
  );
}
