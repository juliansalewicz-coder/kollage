"use client";

import { useState } from "react";
import { alternatives, type Alternative } from "@/lib/budget";
import { bestOffer, CATEGORIES, getProduct, getShop } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { useFavorites } from "@/lib/store";
import { ProductImage } from "../GarmentArt";
import { Icon } from "../Icon";
import { Sheet } from "../Sheet";

/** Swap the selected piece for another product of the same category. Cheaper ones first. */
export function ReplaceSheet({ productId, open, onClose, onPick }: { productId: string | null; open: boolean; onClose: () => void; onPick: (productId: string) => void }) {
  const favs = useFavorites();
  const [onlyFavs, setOnlyFavs] = useState(false);
  const current = productId ? getProduct(productId) : undefined;
  if (!current) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
  const { cheaper, others } = alternatives(current.id);
  const keep = (a: Alternative) => !onlyFavs || favs.products.includes(a.product.id);
  const price = bestOffer(current).priceCHF;
  const catLabel = CATEGORIES.find((c) => c.id === current.category)?.label ?? "";

  const row = (a: Alternative) => {
    const shop = getShop(bestOffer(a.product).shopId);
    const fav = favs.products.includes(a.product.id);
    return (
      <li key={a.product.id}>
        <button type="button" className="alt-row" onClick={() => onPick(a.product.id)}>
          <span className="alt-row__thumb" aria-hidden="true">
            <ProductImage product={a.product} className="alt-row__img" sizes="64px" />
          </span>
          <span className="alt-row__text">
            <span className="alt-row__title">
              {a.product.title}
              {fav && (
                <>
                  <Icon name="heartFilled" size={14} className="alt-row__fav" />
                  <span className="sr-only"> (gemerkt)</span>
                </>
              )}
            </span>
            <span className="alt-row__meta">
              {a.similar && <span className="alt-row__similar">Gleiche Art · </span>}
              {a.product.colorName} · {shop.name.replace("Demo-Shop ", "")}
            </span>
          </span>
          <span className="alt-row__price">
            <span className="num">{formatCHF(a.price)}</span>
            <span className={`alt-row__diff num ${a.diff < 0 ? "is-cheaper" : ""}`}>
              {a.diff < 0 ? `−${formatCHF(-a.diff).replace("CHF ", "")}` : a.diff === 0 ? "gleich" : `+${formatCHF(a.diff).replace("CHF ", "")}`}
            </span>
          </span>
          <span className="sr-only">, ersetzt {current.title}</span>
        </button>
      </li>
    );
  };

  const cheaperShown = cheaper.filter(keep);
  const othersShown = others.filter(keep);

  return (
    <Sheet open={open} onClose={onClose} title="Teil ersetzen" className="sheet--replace">
      <div className="replace-current">
        <span className="alt-row__thumb" aria-hidden="true">
          <ProductImage product={current} className="alt-row__img" sizes="64px" />
        </span>
        <span>
          <span className="replace-current__label">Jetzt im Look</span>
          <span className="replace-current__title">{current.title}</span>
          <span className="num">{formatCHF(price)}</span>
        </span>
      </div>
      <p className="sheet__text">Position, Drehung und Ebene bleiben gleich. «Rückgängig» holt das alte Teil zurück.</p>
      <label className="switch">
        <input type="checkbox" checked={onlyFavs} onChange={(e) => setOnlyFavs(e.target.checked)} />
        <span>Nur gemerkte Produkte ({favs.products.length})</span>
      </label>
      <section aria-labelledby="alt-cheaper">
        <h3 id="alt-cheaper" className="alt-head">
          Günstiger <span className="panel__count">{cheaperShown.length}</span>
        </h3>
        {cheaperShown.length ? <ul className="alt-list">{cheaperShown.map(row)}</ul> : <p className="panel__empty">Keine günstigere Alternative in «{catLabel}».</p>}
      </section>
      <section aria-labelledby="alt-others">
        <h3 id="alt-others" className="alt-head">
          Weitere {catLabel} <span className="panel__count">{othersShown.length}</span>
        </h3>
        {othersShown.length ? <ul className="alt-list">{othersShown.map(row)}</ul> : <p className="panel__empty">Keine weiteren Teile.</p>}
      </section>
      <p className="fineprint">Gleiche Art von Kleidungsstück zuerst, danach nach Preis des günstigsten Angebots. Demo-Katalog.</p>
    </Sheet>
  );
}
