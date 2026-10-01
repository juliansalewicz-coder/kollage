import Link from "next/link";
import { getProduct, imageAspect } from "@/lib/catalog";
import { formatCHF, pieces } from "@/lib/format";
import { distinctCount, lookTotal, pieceRows } from "@/lib/look";
import type { Look } from "@/lib/types";
import { ProductImage } from "./GarmentArt";
import { Icon } from "./Icon";

/** Art-directed placement for the hero stage: wide (≥ 768 px) and tall (phone). Values in % of the stage. */
const PLACEMENT: Record<string, { x: number; y: number; w: number; r: number; mx: number; my: number; mw: number; mr: number }> = {
  trench: { x: 13, y: 6, w: 17, r: -3, mx: 4, my: 3, mw: 40, mr: -3 },
  "strick-camel": { x: 27, y: 22, w: 20, r: 4, mx: 46, my: 4, mw: 44, mr: 4 },
  "schal-karo": { x: 46, y: 5, w: 11, r: -8, mx: 80, my: 38, mw: 17, mr: -8 },
  "jeans-dunkel": { x: 54, y: 14, w: 15, r: 2, mx: 10, my: 47, mw: 34, mr: 2 },
  "baguette-braun": { x: 68, y: 12, w: 15, r: 5, mx: 44, my: 47, mw: 34, mr: 5 },
  "boot-braun": { x: 70, y: 52, w: 14, r: -4, mx: 52, my: 71, mw: 30, mr: -4 },
};

/** The large collage that opens the start page. Each piece links to its line in the look. */
export function HeroCollage({ look }: { look: Look }) {
  const rows = pieceRows(look.items);
  return (
    <figure className="hero-stage">
      <div className="hero-stage__canvas">
        {rows.map((r, i) => {
          const p = PLACEMENT[r.product.id];
          if (!p) return null;
          const product = getProduct(r.product.id)!;
          return (
            <Link
              key={r.uid}
              href={`/look/${look.id}#teil-${r.number}`}
              className="hero-piece"
              style={
                {
                  "--x": `${p.x}%`,
                  "--y": `${p.y}%`,
                  "--w": `${p.w}%`,
                  "--r": `${p.r}deg`,
                  "--mx": `${p.mx}%`,
                  "--my": `${p.my}%`,
                  "--mw": `${p.mw}%`,
                  "--mr": `${p.mr}deg`,
                  "--i": i,
                  aspectRatio: `1 / ${imageAspect(product)}`,
                } as React.CSSProperties
              }
              aria-label={`${r.product.title}, ${formatCHF(r.offer.priceCHF)} bei ${r.shop.name}`}
            >
              <ProductImage product={product} className="hero-piece__img" sizes="(max-width: 767px) 40vw, 260px" />
              <span className="hero-piece__chip" aria-hidden="true">
                {r.product.title} · <span className="num">{formatCHF(r.offer.priceCHF)}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <figcaption className="hero-stage__caption">
        <span>
          <strong>{look.title}</strong> · {pieces(distinctCount(look.items))} · <span className="num">{formatCHF(lookTotal(look.items))}</span>
          <span className="hero-stage__demo"> · Demo-Katalog</span>
        </span>
        <span className="hero-stage__links">
          <Link href={`/look/${look.id}`} className="link-arrow">
            Look ansehen <Icon name="chevronRight" size={16} />
          </Link>
          <Link href={`/builder?look=${look.id}`} className="link-arrow">
            Anpassen <Icon name="chevronRight" size={16} />
          </Link>
        </span>
      </figcaption>
    </figure>
  );
}
