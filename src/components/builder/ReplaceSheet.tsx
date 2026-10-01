"use client";

import { useEffect, useState } from "react";
import { alternatives, replaceEffect } from "@/lib/budget";
import { bestOffer, CATEGORIES, getProduct, getShop } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { useFavorites } from "@/lib/store";
import type { CanvasItem, Product } from "@/lib/types";
import { ProductImage } from "../GarmentArt";
import { Icon } from "../Icon";
import { Sheet } from "../Sheet";

interface Row {
  product: Product;
  price: number;
  similar: boolean;
  /** Change of the look total if this product is used: what the person really saves or pays. */
  effect: number;
}

/**
 * Swap the selected piece for another product of the same category. Rows are split by what
 * happens to the look total, not by single prices, so duplicates and pieces already in the
 * look are counted correctly.
 */
export function ReplaceSheet({
  items,
  uid,
  open,
  onClose,
  onPick,
}: {
  items: CanvasItem[];
  uid: string | null;
  open: boolean;
  onClose: () => void;
  onPick: (productId: string, uids: string[]) => void;
}) {
  const favs = useFavorites();
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [all, setAll] = useState(true);
  const item = uid ? items.find((i) => i.uid === uid) : undefined;
  const current = item ? getProduct(item.productId) : undefined;
  useEffect(() => {
    if (open) setAll(true);
  }, [open]);
  if (!item || !current) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;

  const sameProduct = items.filter((i) => i.productId === item.productId).map((i) => i.uid);
  const twice = sameProduct.length > 1;
  const uids = twice && all ? sameProduct : [item.uid];
  const { cheaper, others } = alternatives(current.id);
  const rows: Row[] = [...cheaper, ...others]
    .filter((a) => !onlyFavs || favs.products.includes(a.product.id))
    .map((a) => ({ product: a.product, price: a.price, similar: a.similar, effect: replaceEffect(items, uids, a.product.id) }));
  const down = rows.filter((r) => r.effect < 0);
  const rest = rows.filter((r) => r.effect >= 0);
  const price = bestOffer(current).priceCHF;
  const catLabel = CATEGORIES.find((c) => c.id === current.category)?.label ?? "";

  const row = (r: Row) => {
    const shop = getShop(bestOffer(r.product).shopId);
    const fav = favs.products.includes(r.product.id);
    return (
      <li key={r.product.id}>
        <button type="button" className="alt-row" onClick={() => onPick(r.product.id, uids)}>
          <span className="alt-row__thumb" aria-hidden="true">
            <ProductImage product={r.product} className="alt-row__img" sizes="64px" />
          </span>
          <span className="alt-row__text">
            <span className="alt-row__title">
              {r.product.title}
              {fav && (
                <>
                  <Icon name="heartFilled" size={14} className="alt-row__fav" />
                  <span className="sr-only"> (gemerkt)</span>
                </>
              )}
            </span>
            <span className="alt-row__meta">
              {r.similar && <span className="alt-row__similar">Gleiche Art · </span>}
              {r.product.colorName} · {shop.name.replace("Demo-Shop ", "")}
            </span>
          </span>
          <span className="alt-row__price">
            <span className="num">{formatCHF(r.price)}</span>
            <span className={`alt-row__diff num ${r.effect < 0 ? "is-cheaper" : ""}`}>
              {r.effect < 0 ? `Look −${formatCHF(-r.effect).replace("CHF ", "")}` : r.effect === 0 ? "Look gleich" : `Look +${formatCHF(r.effect).replace("CHF ", "")}`}
            </span>
          </span>
          <span className="sr-only">, ersetzt {current.title}</span>
        </button>
      </li>
    );
  };

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
      {twice && (
        <label className="switch">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
          <span>
            Alle {sameProduct.length} Platzierungen ersetzen
            {!all && <span className="switch__note"> · Der Look-Preis sinkt nur, wenn keine mehr übrig bleibt.</span>}
          </span>
        </label>
      )}
      <label className="switch">
        <input type="checkbox" checked={onlyFavs} onChange={(e) => setOnlyFavs(e.target.checked)} />
        <span>Nur gemerkte Produkte ({favs.products.length})</span>
      </label>
      <section aria-labelledby="alt-cheaper">
        <h3 id="alt-cheaper" className="alt-head">
          Look wird günstiger <span className="panel__count">{down.length}</span>
        </h3>
        {down.length ? <ul className="alt-list">{down.map(row)}</ul> : <p className="panel__empty">Keine Alternative in «{catLabel}» senkt den Look-Preis.</p>}
      </section>
      <section aria-labelledby="alt-others">
        <h3 id="alt-others" className="alt-head">
          Weitere {catLabel} <span className="panel__count">{rest.length}</span>
        </h3>
        {rest.length ? <ul className="alt-list">{rest.map(row)}</ul> : <p className="panel__empty">Keine weiteren Teile.</p>}
      </section>
      <p className="fineprint">«Look −/+» zeigt, wie sich der Produktwert des ganzen Looks ändert. Gleiche Art zuerst, danach nach Preis. Demo-Katalog.</p>
    </Sheet>
  );
}
