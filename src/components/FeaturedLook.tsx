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

/**
 * The start page outfit. No number tags at rest: pointing at or focusing a piece shows its name
 * and price, a tap or Enter opens price and shop. The action to take the look sits right under it.
 */
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
        labels
        highlight={lit}
        onHighlight={setLit}
        onPieceActivate={setOpenUid}
        activePiece={openUid}
        label={`Look «${look.title}». Teil auswählen für Preis und Shop.`}
        pieceSizes="(max-width: 767px) 45vw, 280px"
        className="featured__window"
      />
      <figcaption className="featured__plate">
        <span className="featured__id">
          <Link href={`/look/${look.id}`} className="featured__title">
            {look.title}
          </Link>
          <span className="featured__meta">
            {pieces(distinctCount(look.items))} · <span className="num">{formatCHF(lookTotal(look.items))}</span>
            <span className="featured__hint"> · Teil antippen für Details</span>
          </span>
        </span>
        <Link href={`/builder?look=${look.id}`} className="btn btn--primary featured__cta">
          Diesen Look anpassen <Icon name="chevronRight" size={16} />
        </Link>
      </figcaption>
      <Sheet open={Boolean(openRow)} onClose={() => setOpenUid(null)} title={openRow?.product.title ?? ""} className="sheet--product">
        {openRow && <ProductDetails product={openRow.product} lookId={look.id} number={openRow.number} />}
      </Sheet>
    </figure>
  );
}
