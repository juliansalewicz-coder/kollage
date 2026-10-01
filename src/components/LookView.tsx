"use client";

import Link from "next/link";
import { useState } from "react";
import { getShop } from "@/lib/catalog";
import { toast } from "@/lib/events";
import { formatCHF, pieces } from "@/lib/format";
import { distinctCount, lookTotal, offerHref, pieceRows, shippingText } from "@/lib/look";
import { OCCASIONS, SEED_LOOKS } from "@/lib/seed-looks";
import { encodeLook } from "@/lib/share";
import type { Backdrop, CanvasItem, Occasion } from "@/lib/types";
import { ProductImage } from "./GarmentArt";
import { Icon } from "./Icon";
import { LookTile } from "./LookTile";
import { LookWindow } from "./LookWindow";
import { FavoriteButton } from "./FavoriteButton";
import { ProductDetails } from "./ProductDetails";
import { Sheet } from "./Sheet";

export interface ViewableLook {
  id: string | null;
  title: string;
  note: string;
  occasion: Occasion;
  backdrop: Backdrop;
  items: CanvasItem[];
  authorName: string | null;
  kind: "beispiel" | "veroeffentlicht" | "privat" | "geteilt";
  tip?: string;
}

const KIND_LABEL: Record<ViewableLook["kind"], string> = {
  beispiel: "Beispiel-Look · Demo-Katalog",
  veroeffentlicht: "Veröffentlicht",
  privat: "Privat · nur in deinem Browser sichtbar",
  geteilt: "Geteilter Look",
};

export function LookView({ look }: { look: ViewableLook }) {
  const [lit, setLit] = useState<string | null>(null);
  const [openUid, setOpenUid] = useState<string | null>(null);
  const rows = pieceRows(look.items);
  const openRow = rows.find((r) => r.uid === openUid) ?? null;
  const occasion = OCCASIONS.find((o) => o.id === look.occasion)?.label;
  const code = encodeLook(look);
  const remixHref = look.kind === "beispiel" && look.id ? `/builder?look=${look.id}` : `/builder?d=${code}`;
  const more = SEED_LOOKS.filter((l) => l.id !== look.id).slice(0, 3);

  async function share() {
    const url =
      look.kind === "beispiel" && look.id ? `${window.location.origin}/look/${look.id}` : `${window.location.origin}/look/geteilt?d=${code}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: look.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link kopiert");
    } catch {
      window.prompt("Link zum Kopieren:", url);
    }
  }

  return (
    <div className="page wrap look-page">
      <nav className="crumbs" aria-label="Brotkrumen">
        <Link href="/entdecken">Entdecken</Link> <span aria-hidden="true">/</span> <span aria-current="page">{look.title}</span>
      </nav>
      <div className="look-page__grid">
        <div className="look-page__window">
          <LookWindow
            items={look.items}
            backdrop={look.backdrop}
            tags
            highlight={lit}
            onHighlight={setLit}
            label={`Collage «${look.title}» mit ${rows.length} nummerierten Teilen. Teil antippen für Details.`}
            pieceSizes="(max-width: 767px) 40vw, 260px"
            onPieceActivate={setOpenUid}
            activePiece={openUid}
          />
          <p className="look-page__hint">Tippe ein Teil an, um Preis und Shop zu sehen.</p>
        </div>
        <Sheet open={Boolean(openRow)} onClose={() => setOpenUid(null)} title={openRow?.product.title ?? ""} className="sheet--product">
          {openRow && (
            <ProductDetails
              product={openRow.product}
              lookId={look.id}
              number={openRow.number}
              onShowInList={() => {
                const n = openRow.number;
                setOpenUid(null);
                window.setTimeout(() => {
                  const row = document.getElementById(`teil-${n}`);
                  row?.scrollIntoView({ behavior: "smooth", block: "center" });
                  row?.querySelector<HTMLElement>("a.btn")?.focus({ preventScroll: true });
                }, 60);
              }}
            />
          )}
        </Sheet>

        <div className="look-page__info">
          <h1 className="page__title page__title--look">{look.title}</h1>
          <p className="look-page__meta">
            {look.authorName && <>von {look.authorName} · </>}
            {occasion} · {pieces(distinctCount(look.items))}
          </p>
          <p className="look-page__status">{KIND_LABEL[look.kind]}</p>
          {look.note && <p className="look-page__note">{look.note}</p>}
          {look.tip && (
            <p className="look-page__tip">
              <strong>Styling-Tipp:</strong> {look.tip}
            </p>
          )}
          <div className="look-page__actions">
            <Link href={remixHref} className="btn btn--primary">
              <Icon name="edit" /> Look anpassen
            </Link>
            <button type="button" className="btn btn--ghost" onClick={share}>
              <Icon name="share" /> Teilen
            </button>
            {look.id && <FavoriteButton kind="looks" id={look.id} label={look.title} variant="pill" />}
          </div>

          <h2 className="look-page__h2">Die Teile</h2>
          <ol className="buy-list">
            {rows.map((r) => {
              const others = r.product.offers.filter((o) => o.id !== r.offer.id);
              return (
                <li
                  key={r.uid}
                  id={`teil-${r.number}`}
                  className={`buy-row ${lit === r.uid ? "is-lit" : ""}`}
                  onPointerEnter={() => setLit(r.uid)}
                  onPointerLeave={() => setLit(null)}
                >
                  <span className="tag-num" aria-label={`Teil ${r.number}`}>
                    {r.number}
                  </span>
                  <div className="buy-row__thumb" aria-hidden="true">
                    <ProductImage product={r.product} className="buy-row__img" />
                  </div>
                  <div className="buy-row__text">
                    <h3 className="buy-row__title">{r.product.title}</h3>
                    <p className="buy-row__color">{r.product.colorName}</p>
                    <p className="buy-row__shop">
                      {r.shop.name} · Lieferung CH {r.shop.deliveryDays} · {shippingText(r.shop)}
                    </p>
                    {others.length > 0 && (
                      <details className="offers">
                        <summary>
                          {others.length === 1 ? "1 weiteres Angebot" : `${others.length} weitere Angebote`} <Icon name="chevronDown" size={16} />
                        </summary>
                        <ul>
                          {others.map((o) => {
                            const shop = getShop(o.shopId);
                            return (
                              <li key={o.id}>
                                <span>
                                  {shop.name} · {shop.deliveryDays}
                                </span>
                                <span className="num">{formatCHF(o.priceCHF)}</span>
                                <a href={offerHref(o.id, look.id)} target="_blank" rel="sponsored nofollow noopener" className="link-arrow">
                                  Zum Shop <span className="sr-only">(Partnerlink, neues Fenster)</span>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    )}
                  </div>
                  <div className="buy-row__buy">
                    <span className="buy-row__price num">{formatCHF(r.offer.priceCHF)}</span>
                    <a
                      href={offerHref(r.offer.id, look.id)}
                      target="_blank"
                      rel="sponsored nofollow noopener"
                      className="btn btn--primary btn--sm"
                      onFocus={() => setLit(r.uid)}
                      onBlur={() => setLit(null)}
                    >
                      Zum Shop <Icon name="external" size={16} />
                      <span className="sr-only">: {r.product.title} bei {r.shop.name} (Partnerlink, neues Fenster)</span>
                    </a>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="buy-total">
            <span>Alles zusammen, günstigste Angebote</span>
            <span className="num">{formatCHF(lookTotal(look.items))}</span>
          </p>
          <p className="fineprint">
            Partnerlinks: Für bestätigte Käufe erhält Kollage eine Provision vom Händler. Preise, Lieferzeiten und Verfügbarkeit gelten beim Händler. Diese
            Werte stammen aus dem Demo-Katalog und sind Beispiele.
          </p>
        </div>
      </div>

      <section className="section" aria-labelledby="more-title">
        <div className="section__head">
          <h2 id="more-title" className="section__title section__title--sm">
            Mehr Looks
          </h2>
          <Link href="/entdecken" className="link-arrow">
            Alle Looks <Icon name="chevronRight" size={16} />
          </Link>
        </div>
        <div className="street__grid street__grid--three">
          {more.map((l) => (
            <LookTile key={l.id} look={l} />
          ))}
        </div>
      </section>
    </div>
  );
}
