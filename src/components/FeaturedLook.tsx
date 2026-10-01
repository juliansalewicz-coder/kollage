"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCHF, pieces } from "@/lib/format";
import { distinctCount, lookTotal, pieceRows } from "@/lib/look";
import type { Look } from "@/lib/types";
import { Icon } from "./Icon";
import { LookWindow } from "./LookWindow";
import { ProductDetails } from "./ProductDetails";
import { Sheet } from "./Sheet";

/** The start page outfit: tap a piece for price and shop, or take the whole look into the builder. */
export function FeaturedLook({ look }: { look: Look }) {
  const [lit, setLit] = useState<string | null>(null);
  const [openUid, setOpenUid] = useState<string | null>(null);
  const rows = pieceRows(look.items);
  const openRow = rows.find((r) => r.uid === openUid) ?? null;
  return (
    <figure className="featured">
      <LookWindow
        items={look.items}
        backdrop={look.backdrop}
        tags
        highlight={lit}
        onHighlight={setLit}
        onPieceActivate={setOpenUid}
        activePiece={openUid}
        label={`Look «${look.title}». Teil antippen für Preis und Shop.`}
        pieceSizes="(max-width: 767px) 40vw, 240px"
        className="featured__window"
      />
      <figcaption className="featured__caption">
        <span className="featured__title">{look.title}</span>
        <span className="featured__meta">
          {pieces(distinctCount(look.items))} · <span className="num">{formatCHF(lookTotal(look.items))}</span> · Teil antippen für Details
        </span>
        <Link href={`/look/${look.id}`} className="link-arrow">
          Zum Look <Icon name="chevronRight" size={16} />
        </Link>
      </figcaption>
      <Sheet open={Boolean(openRow)} onClose={() => setOpenUid(null)} title={openRow?.product.title ?? ""} className="sheet--product">
        {openRow && <ProductDetails product={openRow.product} lookId={look.id} number={openRow.number} />}
      </Sheet>
    </figure>
  );
}
