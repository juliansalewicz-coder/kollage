import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductImage } from "@/components/GarmentArt";
import { Icon } from "@/components/Icon";
import { findOffer, getShop } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { shippingText } from "@/lib/look";

export const metadata: Metadata = { title: "Weiter zum Shop", robots: { index: false, follow: false } };

/**
 * Affiliate exit. Real offers redirect to the tracked deep link (with the look as sub-id).
 * Demo offers have no shop behind them, so this page explains what would happen.
 */
export default async function ExitPage({ params, searchParams }: { params: Promise<{ offerId: string }>; searchParams: Promise<{ look?: string }> }) {
  const { offerId } = await params;
  const { look } = await searchParams;
  const hit = findOffer(decodeURIComponent(offerId));
  if (!hit) notFound();
  const { product, offer } = hit;
  const subId = look ? look.replace(/[^a-z0-9-]/gi, "").slice(0, 60) : "builder";

  if (offer.affiliateUrl) {
    const url = new URL(offer.affiliateUrl);
    url.searchParams.set("subid", subId);
    redirect(url.toString());
  }

  const shop = getShop(offer.shopId);
  return (
    <div className="page wrap exit">
      <div className="exit__card">
        <h1 className="page__title">Hier ginge es weiter zu {shop.name}</h1>
        <p className="look-page__meta">Demo-Angebot ohne echten Shop</p>
        <div className="exit__product">
          <div className="buy-row__thumb" aria-hidden="true">
            <ProductImage product={product} className="buy-row__img" sizes="64px" />
          </div>
          <div>
            <p className="inspector__name">{product.title}</p>
            <p className="inspector__meta">{product.colorName}</p>
            <p className="inspector__meta">
              <span className="num">{formatCHF(offer.priceCHF)}</span> · Lieferung CH {shop.deliveryDays} · {shippingText(shop)}
            </p>
          </div>
        </div>
        <p>
          Bei echten Angeboten öffnet sich an dieser Stelle direkt die Produktseite des Händlers über einen Partnerlink. Der Look wird als Sub-ID
          mitgegeben, damit ein Kauf dem Look zugeordnet werden kann:
        </p>
        <p className="exit__code">
          subid=<strong>{subId}</strong>
        </p>
        <p className="fineprint">Dieses Angebot stammt aus dem Demo-Katalog. Es gibt keinen Shop, keinen Artikel und keine Bestellung.</p>
        <div className="empty__actions">
          {look ? (
            <Link href={`/look/${encodeURIComponent(look)}`} className="btn btn--primary">
              Zurück zum Look
            </Link>
          ) : (
            <Link href="/builder" className="btn btn--primary">
              Zurück zum Builder
            </Link>
          )}
          <Link href="/entdecken" className="btn btn--ghost">
            Looks entdecken <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
