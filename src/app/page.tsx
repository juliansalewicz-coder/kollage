import Link from "next/link";
import { FeaturedLook } from "@/components/FeaturedLook";
import { Icon } from "@/components/Icon";
import { LookTile } from "@/components/LookTile";
import { LookWindow } from "@/components/LookWindow";
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
            <div className="home-hero__actions">
              <Link href={`/builder?look=${hero.id}`} className="btn btn--primary btn--lg">
                Diesen Look anpassen
              </Link>
              <Link href="/builder?neu=1" className="btn btn--ghost btn--lg">
                Leer starten
              </Link>
            </div>
            <nav className="style-chips" aria-label="Nach Stil starten">
              <span className="style-chips__label">Nach Stil:</span>
              {entries.map((e) => (
                <Link key={e.id} href={e.href} className="style-chip">
                  {e.label}
                </Link>
              ))}
            </nav>
            {hero.tip && (
              <p className="home-hero__tip">
                <span className="home-hero__tip-label">Styling-Tipp zu «{hero.title}»</span>
                {hero.tip}
              </p>
            )}
          </div>
          <FeaturedLook look={hero} />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="styles-title">
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
                  <LookWindow items={e.look.items} backdrop={e.look.backdrop} frame="thin" className="entry__window" />
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
