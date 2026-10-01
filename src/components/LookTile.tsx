import Link from "next/link";
import { formatCHF, pieces } from "@/lib/format";
import { distinctCount, lookTotal } from "@/lib/look";
import { OCCASIONS } from "@/lib/seed-looks";
import type { Look } from "@/lib/types";
import { LookWindow } from "./LookWindow";

/** A look in the street of windows. The whole tile links to the look page. */
export function LookTile({ look, size = "md", headingLevel = 3 }: { look: Look; size?: "md" | "lg"; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  const occasion = OCCASIONS.find((o) => o.id === look.occasion)?.label;
  return (
    <article className={`look-tile look-tile--${size}`}>
      <Link href={`/look/${look.id}`} className="look-tile__link">
        <LookWindow items={look.items} backdrop={look.backdrop} frame="thin" />
        <div className="look-tile__caption">
          <H className="look-tile__title">{look.title}</H>
          <p className="look-tile__meta">
            {occasion} · {pieces(distinctCount(look.items))} · <span className="num">{formatCHF(lookTotal(look.items))}</span>
          </p>
          <p className="look-tile__by">{look.isExample ? "Beispiel-Look · Demo-Katalog" : `von ${look.authorName}`}</p>
        </div>
      </Link>
    </article>
  );
}
