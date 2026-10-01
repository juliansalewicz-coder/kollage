import { garmentAspect } from "./garments";
import renders from "./renders.json";
import type { Category, ColorFamily, GarmentKind, Offer, Pattern, Product, Shop } from "./types";

/**
 * DEMO CATALOGUE. Shops, products and prices are fictional examples for the MVP.
 * Real offers must come from affiliate feeds with authentic retailer images.
 */
export const SHOPS: Record<string, Shop> = {
  limmat: { id: "limmat", name: "Demo-Shop Limmat", deliveryDays: "1–3 Werktage", shippingCHF: 6.9, freeShippingFromCHF: 75, isDemo: true },
  aare: { id: "aare", name: "Demo-Shop Aare", deliveryDays: "2–4 Werktage", shippingCHF: 0, freeShippingFromCHF: null, isDemo: true },
  rhone: { id: "rhone", name: "Demo-Shop Rhone", deliveryDays: "3–5 Werktage", shippingCHF: 9.9, freeShippingFromCHF: 120, isDemo: true },
};

export const CATEGORIES: { id: Category; label: string; singular: string }[] = [
  { id: "oberteile", label: "Oberteile", singular: "Oberteil" },
  { id: "hosen", label: "Hosen & Röcke", singular: "Hose / Rock" },
  { id: "schuhe", label: "Schuhe", singular: "Schuhe" },
  { id: "taschen", label: "Taschen", singular: "Tasche" },
  { id: "accessoires", label: "Accessoires", singular: "Accessoire" },
];

export const COLOR_FAMILIES: { id: ColorFamily; label: string; swatch: string }[] = [
  { id: "schwarz", label: "Schwarz", swatch: "#1d1d1b" },
  { id: "weiss", label: "Weiss", swatch: "#f3f1ec" },
  { id: "grau", label: "Grau", swatch: "#9a9b97" },
  { id: "beige", label: "Beige", swatch: "#cdb48c" },
  { id: "braun", label: "Braun", swatch: "#6b4529" },
  { id: "blau", label: "Blau", swatch: "#2e3e5c" },
  { id: "gruen", label: "Grün", swatch: "#3e5a3c" },
  { id: "rot", label: "Rot", swatch: "#8e2b25" },
];

function p(
  id: string,
  title: string,
  category: Category,
  kind: GarmentKind,
  color: string,
  colorName: string,
  colorFamily: ColorFamily,
  offers: [string, number][],
  opts: { accent?: string; pattern?: Pattern; tags?: string[] } = {},
): Product {
  const render = (renders as Record<string, { width: number; height: number }>)[id];
  return {
    id,
    title,
    category,
    colorName,
    colorFamily,
    kind,
    tags: opts.tags ?? [],
    image: render
      ? { type: "render", src: `/products/${id}.webp`, width: render.width, height: render.height, generator: "Higgsfield (z_image)" }
      : { type: "illustration", kind, color, accent: opts.accent, pattern: opts.pattern },
    offers: offers.map(([shopId, priceCHF]): Offer => ({
      id: `${id}--${shopId}`,
      shopId,
      priceCHF,
      affiliateUrl: null,
      inStock: true,
    })),
    isDemo: true,
  };
}

export const PRODUCTS: Product[] = [
  // Oberteile
  p("t-weiss", "Boxy T-Shirt", "oberteile", "tshirt", "#f3f1ec", "Weiss", "weiss", [["limmat", 29.9]], { tags: ["basic", "baumwolle"] }),
  p("t-schwarz", "Boxy T-Shirt", "oberteile", "tshirt", "#1d1d1b", "Schwarz", "schwarz", [["limmat", 29.9]], { tags: ["basic", "baumwolle"] }),
  p("t-streifen", "Streifenshirt", "oberteile", "tshirt", "#f1eee6", "Ecru / Marine", "weiss", [["aare", 49.9], ["rhone", 54.9]], { accent: "#1f2a44", pattern: "stripes", tags: ["bretonisch", "streifen"] }),
  p("hemd-hellblau", "Oxford-Hemd", "oberteile", "shirt", "#bfd0e4", "Hellblau", "blau", [["rhone", 79.9]], { tags: ["hemd", "buero"] }),
  p("hemd-weiss", "Popeline-Hemd", "oberteile", "shirt", "#f5f4ef", "Weiss", "weiss", [["aare", 69.9]], { tags: ["hemd", "buero"] }),
  p("strick-camel", "Rundhals-Pullover aus Wolle", "oberteile", "knit", "#c49a6c", "Camel", "beige", [["limmat", 119], ["rhone", 124.9]], { pattern: "rib", tags: ["strick", "wolle"] }),
  p("strick-gruen", "Grobstrick-Pullover", "oberteile", "knit", "#5e6b4a", "Olive", "gruen", [["aare", 139]], { pattern: "rib", tags: ["strick", "wolle"] }),
  p("hoodie-grau", "Hoodie aus Baumwolle", "oberteile", "hoodie", "#a6a7a3", "Grau meliert", "grau", [["limmat", 79.9]], { tags: ["sweat"] }),
  p("blazer-schwarz", "Einreihiger Blazer", "oberteile", "blazer", "#232323", "Schwarz", "schwarz", [["rhone", 229]], { accent: "#0f0f0f", tags: ["blazer", "buero"] }),
  p("blazer-karo", "Karierter Blazer", "oberteile", "blazer", "#8a7e6c", "Braun kariert", "braun", [["aare", 249]], { accent: "#3f362d", pattern: "check", tags: ["blazer", "karo"] }),
  p("trench", "Trenchcoat", "oberteile", "coat", "#c8ae84", "Sand", "beige", [["rhone", 289], ["limmat", 299]], { accent: "#6d5638", tags: ["mantel"] }),
  p("mantel-navy", "Wollmantel", "oberteile", "coat", "#27324a", "Marine", "blau", [["aare", 349]], { accent: "#151c2b", tags: ["mantel", "wolle"] }),
  // Hosen & Röcke
  p("jeans-hell", "Straight Jeans, hell", "hosen", "jeans", "#8fa7c4", "Hellblau", "blau", [["limmat", 99.9]], { pattern: "denim", tags: ["denim"] }),
  p("jeans-dunkel", "Straight Jeans, dunkel", "hosen", "jeans", "#2e3e5c", "Dunkelblau", "blau", [["aare", 109]], { pattern: "denim", tags: ["denim"] }),
  p("hose-schwarz", "Weite Bundfaltenhose", "hosen", "trousers", "#1f1f1f", "Schwarz", "schwarz", [["rhone", 139]], { tags: ["buero"] }),
  p("hose-beige", "Chino mit weitem Bein", "hosen", "trousers", "#d8c7a6", "Beige", "beige", [["limmat", 89.9]], { tags: ["chino"] }),
  p("hose-grau", "Anzughose", "hosen", "trousers", "#6c6e70", "Grau", "grau", [["aare", 149]], { tags: ["buero"] }),
  p("rock-plisse", "Midirock mit Falten", "hosen", "skirt", "#7a2e2b", "Bordeaux", "rot", [["rhone", 119]], { tags: ["rock"] }),
  p("rock-schwarz", "Midirock", "hosen", "skirt", "#1e1e1e", "Schwarz", "schwarz", [["limmat", 79.9]], { tags: ["rock"] }),
  p("shorts-sand", "Bermuda-Shorts", "hosen", "shorts", "#cdbb93", "Sand", "beige", [["aare", 59.9]], { tags: ["sommer"] }),
  // Schuhe
  p("sneaker-weiss", "Leder-Sneaker", "schuhe", "sneaker", "#f4f2ec", "Weiss", "weiss", [["limmat", 129], ["aare", 134.9]], { accent: "#e6e1d6", tags: ["sneaker"] }),
  p("sneaker-gruen", "Retro-Sneaker", "schuhe", "sneaker", "#2f5d46", "Tannengrün", "gruen", [["rhone", 119]], { accent: "#f2efe6", tags: ["sneaker"] }),
  p("loafer-braun", "Penny Loafer", "schuhe", "loafer", "#5a3524", "Cognac", "braun", [["aare", 189]], { tags: ["leder"] }),
  p("loafer-schwarz", "Penny Loafer", "schuhe", "loafer", "#1c1a19", "Schwarz", "schwarz", [["rhone", 189]], { accent: "#0f0e0d", tags: ["leder"] }),
  p("boot-schwarz", "Chelsea Boots", "schuhe", "boot", "#1f1c1a", "Schwarz", "schwarz", [["limmat", 219]], { accent: "#0e0d0c", tags: ["stiefel"] }),
  p("boot-braun", "Chelsea Boots aus Velours", "schuhe", "boot", "#7a5638", "Tabak", "braun", [["aare", 229]], { tags: ["stiefel", "velours"] }),
  // Taschen
  p("tote-natur", "Canvas-Tote", "taschen", "tote", "#e6dcc6", "Natur", "beige", [["limmat", 39.9]], { tags: ["canvas"] }),
  p("tote-schwarz", "Leder-Shopper", "taschen", "tote", "#1e1d1b", "Schwarz", "schwarz", [["rhone", 259]], { tags: ["leder"] }),
  p("baguette-braun", "Schultertasche", "taschen", "shoulderbag", "#7b4b2a", "Cognac", "braun", [["aare", 179]], { tags: ["leder"] }),
  p("baguette-gruen", "Schultertasche", "taschen", "shoulderbag", "#3e5a3c", "Moosgrün", "gruen", [["aare", 179]], { tags: ["leder"] }),
  p("crossbody-rot", "Kleine Umhängetasche", "taschen", "crossbody", "#8e2b25", "Rot", "rot", [["limmat", 99]], { tags: ["leder"] }),
  p("crossbody-schwarz", "Kleine Umhängetasche", "taschen", "crossbody", "#1d1c1b", "Schwarz", "schwarz", [["limmat", 99]], { tags: ["leder"] }),
  // Accessoires
  p("brille-schildpatt", "Sonnenbrille", "accessoires", "sunglasses", "#6b4529", "Schildpatt-Optik", "braun", [["rhone", 149]], { accent: "#2e2620", tags: ["sommer"] }),
  p("brille-schwarz", "Sonnenbrille", "accessoires", "sunglasses", "#161616", "Schwarz", "schwarz", [["limmat", 89.9]], { tags: ["sommer"] }),
  p("cap-navy", "Baseball-Cap", "accessoires", "cap", "#26324a", "Marine", "blau", [["aare", 34.9]], { tags: ["kopf"] }),
  p("beanie-rost", "Rippstrick-Mütze", "accessoires", "beanie", "#a44e2a", "Rost", "rot", [["limmat", 29.9]], { pattern: "rib", tags: ["kopf", "strick"] }),
  p("schal-karo", "Wollschal kariert", "accessoires", "scarf", "#b9a27e", "Sand / Rot kariert", "beige", [["rhone", 69.9]], { accent: "#6e2f27", pattern: "check", tags: ["wolle"] }),
  p("guertel-braun", "Ledergürtel", "accessoires", "belt", "#5a3524", "Cognac", "braun", [["aare", 59.9]], { tags: ["leder"] }),
  p("uhr-silber", "Armbanduhr", "accessoires", "watch", "#2b2b2b", "Schwarz / Silber", "schwarz", [["rhone", 199]], { tags: ["uhr"] }),
  p("kette-gold", "Gliederkette", "accessoires", "necklace", "#c9a75a", "Goldfarben", "gelb", [["limmat", 49.9]], { tags: ["schmuck"] }),
];

const BY_ID = new Map(PRODUCTS.map((x) => [x.id, x]));

export function getProduct(id: string): Product | undefined {
  return BY_ID.get(id);
}

export function getShop(id: string): Shop {
  return SHOPS[id];
}

export function findOffer(offerId: string): { product: Product; offer: Offer } | undefined {
  for (const product of PRODUCTS) {
    const offer = product.offers.find((o) => o.id === offerId);
    if (offer) return { product, offer };
  }
  return undefined;
}

/** Cheapest in-stock offer. */
/**
 * The one order for offers everywhere (gallery, look page, details, budget):
 * available offers first, each group by price. `bestOffer` is its first entry.
 */
export function sortedOffers(product: Product): Offer[] {
  return [...product.offers].sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.priceCHF - b.priceCHF);
}

export function bestOffer(product: Product): Offer {
  return sortedOffers(product)[0];
}

/** False when no shop has the product in stock. */
export function isAvailable(product: Product): boolean {
  return product.offers.some((o) => o.inStock);
}

export function imageAspect(product: Product): number {
  return product.image.type === "illustration" ? garmentAspect(product.image.kind) : product.image.height / product.image.width;
}

export function isRender(product: Product): boolean {
  return product.image.type === "render";
}

export interface CatalogFilter {
  query: string;
  category: Category | "alle";
  colors: ColorFamily[];
  maxPrice: number | null;
}

export function filterProducts(products: Product[], f: CatalogFilter): Product[] {
  const q = normalize(f.query);
  return products.filter((prod) => {
    if (f.category !== "alle" && prod.category !== f.category) return false;
    if (f.colors.length && !f.colors.includes(prod.colorFamily)) return false;
    if (f.maxPrice !== null && bestOffer(prod).priceCHF > f.maxPrice) return false;
    if (!q) return true;
    const hay = normalize([prod.title, prod.colorName, prod.category, ...prod.tags, CATEGORIES.find((c) => c.id === prod.category)?.label ?? ""].join(" "));
    return q.split(/\s+/).every((word) => hay.includes(word));
  });
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
