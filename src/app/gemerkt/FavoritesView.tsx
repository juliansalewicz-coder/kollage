"use client";

import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductImage } from "@/components/GarmentArt";
import { Icon } from "@/components/Icon";
import { LookTile } from "@/components/LookTile";
import { bestOffer, getProduct, getShop } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { offerHref } from "@/lib/look";
import { getSeedLook } from "@/lib/seed-looks";
import { useFavorites, useHydrated, useLooks, useStorageStatus } from "@/lib/store";
import type { Look, Product } from "@/lib/types";

export function FavoritesView() {
  const hydrated = useHydrated();
  const favs = useFavorites();
  const own = useLooks();
  const status = useStorageStatus();

  if (!hydrated) return <div className="page wrap" aria-busy="true" />;

  const products = favs.products.map(getProduct).filter(Boolean) as Product[];
  const looks = favs.looks.map((id) => getSeedLook(id) ?? own.find((l) => l.id === id)).filter(Boolean) as Look[];

  return (
    <div className="page wrap">
      <header className="page__head">
        <h1 className="page__title">Gemerkt</h1>
        <p className="page__lead">
          {status === "sitzung"
            ? "Achtung: Dein Browser blockiert den Speicher. Gemerktes bleibt nur bis zum Schliessen dieses Tabs."
            : "Gemerkt wird in diesem Browser gespeichert, ohne Anmeldung."}
        </p>
      </header>

      <section className="fav-section" aria-labelledby="fav-products">
        <h2 id="fav-products" className="section__title">
          Produkte <span className="panel__count">{products.length}</span>
        </h2>
        {products.length ? (
          <ul className="fav-products">
            {products.map((p) => {
              const offer = bestOffer(p);
              const shop = getShop(offer.shopId);
              return (
                <li key={p.id} className="fav-product">
                  <div className="fav-product__media" aria-hidden="true">
                    <ProductImage product={p} className="fav-product__img" sizes="160px" />
                  </div>
                  <div className="fav-product__body">
                    <h3 className="fav-product__title">{p.title}</h3>
                    <p className="fav-product__meta">
                      {p.colorName} · {shop.name}
                    </p>
                    <p className="fav-product__price num">{formatCHF(offer.priceCHF)}</p>
                    <div className="fav-product__actions">
                      <Link href={`/builder?add=${p.id}`} className="btn btn--primary btn--sm">
                        <Icon name="plus" size={16} /> In den Look
                      </Link>
                      <a href={offerHref(offer.id, null)} target="_blank" rel="sponsored nofollow noopener" className="btn btn--ghost btn--sm">
                        Zum Shop <Icon name="external" size={14} />
                        <span className="sr-only">(Partnerlink, neues Fenster)</span>
                      </a>
                    </div>
                  </div>
                  <FavoriteButton kind="products" id={p.id} label={p.title} className="fav-product__heart" />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty empty--small">
            <p>Noch keine Produkte gemerkt. Tippe in der Produktauswahl oder in einem Look auf das Herz.</p>
            <Link href="/builder" className="btn btn--ghost btn--sm">
              Zur Produktauswahl
            </Link>
          </div>
        )}
      </section>

      <section className="fav-section" aria-labelledby="fav-looks">
        <h2 id="fav-looks" className="section__title">
          Looks <span className="panel__count">{looks.length}</span>
        </h2>
        {looks.length ? (
          <div className="look-grid">
            {looks.map((l) => (
              <LookTile key={l.id} look={l} />
            ))}
          </div>
        ) : (
          <div className="empty empty--small">
            <p>Noch keine Looks gemerkt.</p>
            <Link href="/entdecken" className="btn btn--ghost btn--sm">
              Looks entdecken
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
