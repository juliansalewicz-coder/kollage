import { bestOffer, getProduct, getShop } from "./catalog";
import { formatCHF } from "./format";
import type { CanvasItem, Offer, Product, Shop } from "./types";

export interface PieceRow {
  uid: string;
  number: number;
  product: Product;
  offer: Offer;
  shop: Shop;
}

const CATEGORY_ORDER: Record<string, number> = { oberteile: 0, hosen: 1, schuhe: 2, taschen: 3, accessoires: 4 };

/**
 * Shopping-list order: tops, bottoms, shoes, bags, accessories; left to right inside a group.
 * Stable for composed looks where pieces overlap, unlike a pure top-to-bottom reading order.
 */
export function outfitOrder(items: CanvasItem[]): CanvasItem[] {
  const cat = (it: CanvasItem) => CATEGORY_ORDER[getProduct(it.productId)?.category ?? ""] ?? 9;
  return [...items].sort((a, b) => cat(a) - cat(b) || a.x - b.x || a.y - b.y);
}

/** Pieces in tag order with their cheapest offer. Duplicates of one product keep their own tag. */
export function pieceRows(items: CanvasItem[]): PieceRow[] {
  const rows: PieceRow[] = [];
  outfitOrder(items).forEach((it) => {
    const product = getProduct(it.productId);
    if (!product) return;
    const offer = bestOffer(product);
    rows.push({ uid: it.uid, number: rows.length + 1, product, offer, shop: getShop(offer.shopId) });
  });
  return rows;
}

/** Sum of the cheapest offer per distinct product. */
export function lookTotal(items: CanvasItem[]): number {
  const seen = new Set<string>();
  let total = 0;
  for (const it of items) {
    if (seen.has(it.productId)) continue;
    seen.add(it.productId);
    const product = getProduct(it.productId);
    if (product) total += bestOffer(product).priceCHF;
  }
  return Math.round(total * 100) / 100;
}

export function distinctCount(items: CanvasItem[]): number {
  return new Set(items.map((i) => i.productId)).size;
}

export function offerHref(offerId: string, lookId: string | null): string {
  return `/weiter/${encodeURIComponent(offerId)}${lookId ? `?look=${encodeURIComponent(lookId)}` : ""}`;
}

export function shippingText(shop: Shop): string {
  if (shop.shippingCHF === 0) return "Versand gratis";
  return `Versand ${formatCHF(shop.shippingCHF)}${shop.freeShippingFromCHF ? `, gratis ab ${formatCHF(shop.freeShippingFromCHF)}` : ""}`;
}
