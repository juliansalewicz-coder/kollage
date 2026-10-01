import { bestOffer, getProduct, getShop, PRODUCTS } from "./catalog";
import type { CanvasItem, Product } from "./types";

export interface ShopShare {
  shopId: string;
  name: string;
  subtotal: number;
  shipping: number;
}

export interface BudgetSummary {
  /** Sum of the cheapest offer per distinct product, without shipping. */
  productValue: number;
  /** Shipping if every distinct product is bought at its cheapest shop. */
  shipping: number;
  distinct: number;
  placed: number;
  shops: ShopShare[];
  budget: number | null;
  /** budget - productValue; negative means over budget. */
  remaining: number | null;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function budgetSummary(items: CanvasItem[], budget: number | null): BudgetSummary {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = ids.map(getProduct).filter(Boolean) as Product[];
  const byShop = new Map<string, number>();
  let productValue = 0;
  for (const p of products) {
    const o = bestOffer(p);
    productValue += o.priceCHF;
    byShop.set(o.shopId, (byShop.get(o.shopId) ?? 0) + o.priceCHF);
  }
  const shops: ShopShare[] = [...byShop].map(([shopId, subtotal]) => {
    const shop = getShop(shopId);
    const free = shop.shippingCHF === 0 || (shop.freeShippingFromCHF !== null && subtotal >= shop.freeShippingFromCHF);
    return { shopId, name: shop.name, subtotal: round(subtotal), shipping: free ? 0 : shop.shippingCHF };
  });
  const shipping = round(shops.reduce((s, x) => s + x.shipping, 0));
  productValue = round(productValue);
  return {
    productValue,
    shipping,
    distinct: products.length,
    placed: items.length,
    shops,
    budget,
    remaining: budget === null ? null : round(budget - productValue),
  };
}

export interface Alternative {
  product: Product;
  price: number;
  /** Price difference to the current product; negative is cheaper. */
  diff: number;
  /** Same kind of garment (coat for coat, trousers for trousers). */
  similar: boolean;
}

/** Garment roles inside a category, so a coat is offered coats before T-shirts. */
const ROLE: Record<string, string> = {
  coat: "jacke",
  blazer: "jacke",
  tshirt: "top",
  shirt: "top",
  knit: "top",
  hoodie: "top",
  jeans: "hose",
  trousers: "hose",
  shorts: "hose",
  skirt: "rock",
  sneaker: "schuh",
  loafer: "schuh",
  boot: "schuh",
  tote: "tasche",
  shoulderbag: "tasche",
  crossbody: "tasche",
};

const role = (p: Product) => ROLE[p.kind] ?? p.kind;

/** Same-category products: same kind of garment first, then cheapest first. Plain rules, no recommendations. */
export function alternatives(productId: string): { cheaper: Alternative[]; others: Alternative[] } {
  const current = getProduct(productId);
  if (!current) return { cheaper: [], others: [] };
  const base = bestOffer(current).priceCHF;
  const r = role(current);
  const all = PRODUCTS.filter((p) => p.category === current.category && p.id !== current.id)
    .map((p) => {
      const price = bestOffer(p).priceCHF;
      return { product: p, price, diff: round(price - base), similar: role(p) === r };
    })
    // Same kind first, then by price.
    .sort((a, b) => Number(b.similar) - Number(a.similar) || a.price - b.price);
  return { cheaper: all.filter((a) => a.diff < 0), others: all.filter((a) => a.diff >= 0) };
}

/** The most expensive distinct product on the canvas, as a starting point for saving money. */
export function mostExpensive(items: CanvasItem[]): CanvasItem | null {
  let best: CanvasItem | null = null;
  let max = -1;
  for (const it of items) {
    const p = getProduct(it.productId);
    if (!p) continue;
    const price = bestOffer(p).priceCHF;
    if (price > max) {
      max = price;
      best = it;
    }
  }
  return best;
}
