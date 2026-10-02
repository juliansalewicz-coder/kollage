"use client";

import { useState } from "react";
import { formatCHF } from "@/lib/format";
import { pieceRows } from "@/lib/look";
import type { Look } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { ProductImage } from "./GarmentArt";
import { ProductDetails } from "./ProductDetails";
import { Sheet } from "./Sheet";

/**
 * The pieces of one look as shop cards: picture on grey, name, colour, price.
 * A card opens price, shop and delivery in a sheet; the heart sits beside the button, not inside it.
 */
export function ProductStrip({ look }: { look: Look }) {
  const rows = pieceRows(look.items);
  const [openUid, setOpenUid] = useState<string | null>(null);
  const open = rows.find((r) => r.uid === openUid) ?? null;
  return (
    <>
      <ul className="pstrip">
        {rows.map((r) => (
          <li key={r.uid} className="pstrip__item" data-reveal>
            <button type="button" className="pcard" onClick={() => setOpenUid(r.uid)} aria-haspopup="dialog">
              <span className="pcard__media">
                <ProductImage product={r.product} className="pcard__img" sizes="(max-width: 767px) 42vw, 190px" />
              </span>
              <span className="pcard__title">{r.product.title}</span>
              <span className="pcard__meta">
                {r.product.colorName} · {r.shop.name.replace("Demo-Shop ", "")}
              </span>
              <span className="pcard__price num">{formatCHF(r.offer.priceCHF)}</span>
            </button>
            <FavoriteButton kind="products" id={r.product.id} label={r.product.title} className="pcard__fav" />
          </li>
        ))}
      </ul>
      <Sheet open={Boolean(open)} onClose={() => setOpenUid(null)} title={open?.product.title ?? ""} className="sheet--product">
        {open && <ProductDetails product={open.product} lookId={look.id} number={open.number} />}
      </Sheet>
    </>
  );
}
