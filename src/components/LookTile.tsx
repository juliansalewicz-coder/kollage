import Link from "next/link";
import { formatCHF, pieces } from "@/lib/format";
import { distinctCount, lookTotal } from "@/lib/look";
import { OCCASIONS } from "@/lib/seed-looks";
import type { Look } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import { LookPalette } from "./LookPalette";
import { LookWindow } from "./LookWindow";

/**
 * A look card. The whole card links to the look page; the heart sits beside
 * the link (never inside it) so both stay separate controls.
 */
export function LookTile({
  look,
  size = "md",
  headingLevel = 3,
  showTip = false,
}: {
  look: Look;
  size?: "md" | "lg";
  headingLevel?: 2 | 3;
  showTip?: boolean;
}) {
  const H = `h${headingLevel}` as "h2" | "h3";
  const occasion = OCCASIONS.find((o) => o.id === look.occasion)?.label;
  return (
    <article className={`look-tile look-tile--${size}`}>
      <Link href={`/look/${look.id}`} className="look-tile__link">
        <LookWindow items={look.items} backdrop={look.backdrop} frame="thin" width={{ phoneVw: 92, px: 390 }} />
        <div className="look-tile__caption">
          <H className="look-tile__title">{look.title}</H>
          <p className="look-tile__meta">
            {occasion} · {pieces(distinctCount(look.items))} · <span className="num">{formatCHF(lookTotal(look.items))}</span>
          </p>
          <LookPalette items={look.items} size="sm" />
          {showTip && look.tip && <p className="look-tile__tip">{look.tip}</p>}
          <p className="look-tile__by">{look.isExample ? "Redaktion · Demo-Katalog" : `von ${look.authorName}`}</p>
        </div>
      </Link>
      <FavoriteButton kind="looks" id={look.id} label={look.title} className="look-tile__fav" />
    </article>
  );
}
