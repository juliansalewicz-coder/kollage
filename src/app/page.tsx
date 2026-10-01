import Link from "next/link";
import { HeroCollage } from "@/components/HeroCollage";
import { Icon } from "@/components/Icon";
import { LookTile } from "@/components/LookTile";
import { LookWindow } from "@/components/LookWindow";
import { ProductImage } from "@/components/GarmentArt";
import { getProduct } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { getSeedLook, SEED_LOOKS } from "@/lib/seed-looks";
import type { CanvasItem } from "@/lib/types";

const STEP_ITEMS: CanvasItem[] = [
  { uid: "a", productId: "strick-gruen", x: 380, y: 400, w: 540, rotation: -2, z: 1 },
  { uid: "b", productId: "jeans-dunkel", x: 660, y: 830, w: 360, rotation: 2, z: 2 },
  { uid: "c", productId: "sneaker-weiss", x: 320, y: 1050, w: 420, rotation: -4, z: 3 },
];

export default function HomePage() {
  const hero = getSeedLook("herbst-in-bern")!;
  const looks = SEED_LOOKS.filter((l) => l.id !== hero.id).slice(0, 6);
  const pick = ["jeans-dunkel", "hose-beige", "rock-plisse"].map((id) => getProduct(id)!);
  const buy = getProduct("jeans-dunkel")!;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__text">
          <h1 id="hero-title" className="display">
            Stelle deinen Look zusammen.
          </h1>
          <p className="hero__sub">
            Kombiniere Kleidung und Accessoires zu deinem Outfit. <br className="br-wide" />
            Entdecke die passenden Shops.
          </p>
          <div className="hero__actions">
            <Link href="/builder" className="btn btn--primary btn--lg">
              Look erstellen
            </Link>
            <Link href="/entdecken" className="link-arrow link-arrow--lg">
              Looks entdecken <Icon name="chevronRight" size={18} />
            </Link>
          </div>
        </div>
        <div className="hero__stage-wrap">
          <HeroCollage look={hero} />
        </div>
      </section>

      <section className="section" aria-labelledby="steps-title">
        <div className="wrap">
          <h2 id="steps-title" className="headline">
            In drei Schritten zum Outfit.
          </h2>
          <ol className="steps">
            <li className="step">
              <div className="step__stage" aria-hidden="true">
                <div className="mini-search">
                  <Icon name="search" size={16} /> Hosen
                </div>
                <div className="mini-grid">
                  {pick.map((p) => (
                    <div key={p.id} className="mini-card">
                      <span className="mini-card__img">
                        <ProductImage product={p} />
                      </span>
                      <span className="num">{formatCHF(p.offers[0].priceCHF)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="step__title">Auswählen</h3>
              <p>Suche nach Kategorie, Farbe und Preis.</p>
            </li>
            <li className="step">
              <div className="step__stage" aria-hidden="true">
                <LookWindow items={STEP_ITEMS} backdrop="papier" frame="thin" className="step__window" />
              </div>
              <h3 className="step__title">Arrangieren</h3>
              <p>Verschieben, drehen, stapeln. Mit Maus, Finger oder Tastatur.</p>
            </li>
            <li className="step">
              <div className="step__stage" aria-hidden="true">
                <div className="mini-offer">
                  <span className="mini-offer__img">
                    <ProductImage product={buy} />
                  </span>
                  <span className="mini-offer__text">
                    <strong>{buy.title}</strong>
                    <span>Demo-Shop Aare · Lieferung CH 2–4 Tage</span>
                    <span className="num mini-offer__price">{formatCHF(buy.offers[0].priceCHF)}</span>
                  </span>
                  <span className="mini-offer__btn">Zum Shop</span>
                </div>
              </div>
              <h3 className="step__title">Kaufen</h3>
              <p>Jedes Teil führt direkt zum Angebot beim Händler.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="looks-title">
        <div className="wrap">
          <div className="section__head">
            <h2 id="looks-title" className="headline">
              Neue Looks.
            </h2>
            <Link href="/entdecken" className="link-arrow">
              Alle Looks <Icon name="chevronRight" size={16} />
            </Link>
          </div>
          <div className="look-grid">
            {looks.map((look) => (
              <LookTile key={look.id} look={look} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="facts-title">
        <div className="wrap">
          <h2 id="facts-title" className="headline">
            Gekauft wird beim Händler.
          </h2>
          <ul className="facts">
            <li>
              <Icon name="tag" size={24} />
              <h3>Preise in CHF</h3>
              <p>Bei jedem Teil steht das günstigste verfügbare Angebot zuerst.</p>
            </li>
            <li>
              <Icon name="truck" size={24} />
              <h3>Lieferung in die Schweiz</h3>
              <p>Lieferzeit und Versandkosten stehen pro Shop beim Angebot.</p>
            </li>
            <li>
              <Icon name="link" size={24} />
              <h3>Transparente Partnerlinks</h3>
              <p>Für bestätigte Käufe erhält Kollage eine Provision vom Händler.</p>
            </li>
            <li>
              <Icon name="user" size={24} />
              <h3>Ohne Konto starten</h3>
              <p>Anmelden erst, wenn du einen Look speichern oder veröffentlichen willst.</p>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
