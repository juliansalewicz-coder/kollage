import Link from "next/link";
import { FeaturedLook } from "@/components/FeaturedLook";
import { Icon } from "@/components/Icon";
import { LookTile } from "@/components/LookTile";
import { LookWindow } from "@/components/LookWindow";
import { ProductStrip } from "@/components/ProductStrip";
import { formatCHF } from "@/lib/format";
import { lookTotal } from "@/lib/look";
import { getSeedLook, SEED_LOOKS, STYLE_ENTRIES } from "@/lib/seed-looks";

const EDITORS_PICKS = ["erster-arbeitstag", "apero-am-abend", "zug-nach-lugano"];

export default function HomePage() {
  const hero = getSeedLook("herbst-in-bern")!;
  const picks = EDITORS_PICKS.map((id) => getSeedLook(id)!);
  const entries = STYLE_ENTRIES.map((e) => ({ ...e, look: getSeedLook(e.cover)!, count: SEED_LOOKS.filter(e.matches).length }));

  return (
    <>
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <h1 id="hero-title" className="display">
              Stelle deinen Look zusammen.
            </h1>
            <p className="home-hero__sub">Kombiniere Kleidung und Accessoires zu deinem Outfit. Entdecke die passenden Shops.</p>
          </div>
          <FeaturedLook look={hero} />
          <div className="home-hero__more">
            <ol className="howto" aria-label="So funktioniert Kollage">
              <li>
                <span className="howto__n">1</span> Look übernehmen oder leer beginnen
              </li>
              <li>
                <span className="howto__n">2</span> Teile ersetzen, Budget im Blick
              </li>
              <li>
                <span className="howto__n">3</span> Beim Shop kaufen, Preise in CHF
              </li>
            </ol>
            <Link href="/builder?neu=1" className="link-arrow home-hero__blank">
              Mit leerer Leinwand starten <Icon name="chevronRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--shop" aria-labelledby="pieces-title">
        <div className="wrap">
          <div className="section__head">
            <h2 id="pieces-title" className="headline">
              Die Teile von «{hero.title}»
            </h2>
            <p className="section__aside">
              Zusammen <span className="num">{formatCHF(lookTotal(hero.items))}</span> · Beispielpreise aus dem Demo-Katalog
            </p>
          </div>
          <ProductStrip look={hero} />
        </div>
      </section>

      <section className="section section--related" aria-labelledby="styles-title">
        <div className="wrap">
          <div className="section__head">
            <h2 id="styles-title" className="headline">
              Wofür ziehst du dich an?
            </h2>
            <Link href="/entdecken" className="link-arrow">
              Alle Looks <Icon name="chevronRight" size={16} />
            </Link>
          </div>
          <ul className="entries">
            {entries.map((e) => (
              <li key={e.id}>
                <Link href={e.href} className="entry">
                  <LookWindow items={e.look.items} backdrop={e.look.backdrop} frame="thin" className="entry__window" width={{ phoneVw: 45, px: 290 }} />
                  <span className="entry__text">
                    <span className="entry__label">{e.label}</span>
                    <span className="entry__line">{e.line}</span>
                    <span className="entry__count">{e.count === 1 ? "1 Look" : `${e.count} Looks`}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="picks-title">
        <div className="wrap">
          <div className="section__head">
            <h2 id="picks-title" className="headline">
              Aus der Redaktion
            </h2>
            <p className="section__aside">Ausgewählte Looks mit konkreten Styling-Tipps. Öffnen, Teile antippen, anpassen.</p>
          </div>
          <div className="look-grid">
            {picks.map((look) => (
              <LookTile key={look.id} look={look} showTip />
            ))}
          </div>
        </div>
      </section>

      <section className="facts-strip" aria-label="So funktioniert der Einkauf">
        <ul className="wrap facts-strip__list">
          <li>
            <Icon name="tag" size={20} /> Preise in CHF, günstigstes Angebot zuerst
          </li>
          <li>
            <Icon name="truck" size={20} /> Lieferzeit und Versand pro Shop
          </li>
          <li>
            <Icon name="link" size={20} /> Gekauft wird beim Händler, Partnerlinks gekennzeichnet
          </li>
          <li>
            <Icon name="user" size={20} /> Ohne Konto starten
          </li>
        </ul>
      </section>
    </>
  );
}
