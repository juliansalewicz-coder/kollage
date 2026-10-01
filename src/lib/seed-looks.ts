import { autoArrange, clampItem } from "./collage";
import { lookTotal } from "./look";
import { getProduct, imageAspect } from "./catalog";
import { infoFromProduct } from "./collage";
import type { Backdrop, CanvasItem, Look, Occasion } from "./types";

/** EXAMPLE LOOKS built from the demo catalogue. Labelled as examples in the UI. */
export const lookup = (productId: string) => {
  const product = getProduct(productId);
  return product ? infoFromProduct(product, imageAspect(product)) : undefined;
};

/** Hand-set composition: productId -> [x, y, width, rotation, layer] on the 1000 x 1250 canvas. */
type Layout = Record<string, [number, number, number, number, number]>;

/**
 * Editorial looks read as one outfit, not as a scattered moodboard: pieces a little larger
 * and pulled towards the centre so they nearly touch. The builder keeps the plain arrangement.
 */
function tighten(items: CanvasItem[]): CanvasItem[] {
  return items.map((it) => clampItem({ ...it, x: 500 + (it.x - 500) * 0.93, y: 640 + (it.y - 640) * 0.93, w: it.w * 1.14 }));
}

function look(
  id: string,
  title: string,
  note: string,
  occasion: Occasion,
  backdrop: Backdrop,
  productIds: string[],
  createdAt: string,
  tip?: string,
  layout?: Layout,
): Look {
  const raw: CanvasItem[] = productIds.map((productId, i) => ({ uid: `${id}-${i}`, productId, x: 500, y: 600, w: 300, rotation: 0, z: i + 1 }));
  const items = layout
    ? raw.map((it) => {
        const [x, y, w, rotation, z] = layout[it.productId];
        return clampItem({ ...it, x, y, w, rotation, z });
      })
    : tighten(autoArrange(raw, lookup));
  return {
    id,
    title,
    note,
    occasion,
    items,
    backdrop,
    status: "veroeffentlicht",
    authorName: "Kollage Redaktion",
    ownerEmail: null,
    createdAt,
    updatedAt: createdAt,
    basedOn: null,
    isExample: true,
    tip,
  };
}

export const SEED_LOOKS: Look[] = [
  look(
    "herbst-in-bern",
    "Herbst unter den Lauben",
    "Trench über Camel-Strick, dazu Velours-Boots. Hält durch, wenn es zwischen zwei Gassen zu nieseln beginnt.",
    "alltag",
    "kreide",
    ["trench", "strick-camel", "jeans-dunkel", "boot-braun", "baguette-braun", "schal-karo"],
    "2026-09-28T09:00:00.000Z",
    "Trench offen tragen und den Gürtel hinten knoten, dann bleibt der Strick sichtbar.",
    {
      trench: [320, 450, 440, -2, 2],
      "strick-camel": [655, 395, 400, 3, 3],
      "schal-karo": [850, 320, 200, 7, 5],
      "jeans-dunkel": [470, 930, 310, -1, 1],
      "baguette-braun": [800, 765, 300, -5, 4],
      "boot-braun": [740, 1085, 290, 0, 6],
    },
  ),
  look(
    "erster-arbeitstag",
    "Erster Arbeitstag",
    "Klare Linien, ein helles Hemd und Loafer, in denen man auch den Weg zum Tram schafft.",
    "buero",
    "kreide",
    ["hemd-hellblau", "blazer-schwarz", "hose-grau", "loafer-schwarz", "tote-schwarz", "uhr-silber"],
    "2026-09-26T09:00:00.000Z",
    "Hemd heller als den Blazer wählen; die Uhr bleibt das einzige Metall.",
  ),
  look(
    "sonntag-am-see",
    "Sonntag am See",
    "Streifen, helle Jeans und eine Tasche, in die ein Buch und ein Badetuch passen.",
    "wochenende",
    "kreide",
    ["t-streifen", "jeans-hell", "sneaker-weiss", "tote-natur", "brille-schildpatt", "cap-navy"],
    "2026-09-24T09:00:00.000Z",
    "Jeans einmal krempeln, damit die weissen Sneaker frei stehen.",
  ),
  look(
    "apero-am-abend",
    "Apéro am Abend",
    "Schwarzes Shirt, Faltenrock in Bordeaux, eine Kette. Mehr braucht es nicht.",
    "abend",
    "kreide",
    ["t-schwarz", "rock-plisse", "loafer-schwarz", "crossbody-schwarz", "kette-gold"],
    "2026-09-22T09:00:00.000Z",
    "Bordeaux und Schwarz genügen. Die Kette über dem Shirt tragen, nicht darunter.",
  ),
  look(
    "zug-nach-lugano",
    "Im Zug nach Lugano",
    "Leichtes Hemd, Bermudas und grüne Sneaker für den ersten warmen Tag südlich des Gotthards.",
    "reise",
    "kreide",
    ["hemd-weiss", "shorts-sand", "sneaker-gruen", "baguette-gruen", "brille-schwarz", "guertel-braun"],
    "2026-09-20T09:00:00.000Z",
    "Hemd offen über den Bermudas, Ärmel zweimal umschlagen.",
  ),
  look(
    "kalter-morgen",
    "Kalter Morgen",
    "Wollmantel, Grobstrick und eine rostrote Mütze als einziger Farbpunkt.",
    "alltag",
    "kreide",
    ["mantel-navy", "strick-gruen", "hose-schwarz", "boot-schwarz", "beanie-rost", "crossbody-rot"],
    "2026-09-18T09:00:00.000Z",
    "Viel Dunkelblau braucht ein warmes Teil: hier übernehmen Mütze und Tasche.",
  ),
  look(
    "karo-und-cognac",
    "Karo und Cognac",
    "Karierter Blazer zum schlichten Rock. Die Lederteile halten alles in einem warmen Ton.",
    "buero",
    "kreide",
    ["blazer-karo", "t-weiss", "rock-schwarz", "loafer-braun", "baguette-braun", "brille-schildpatt"],
    "2026-09-16T09:00:00.000Z",
    "Zum Karo nur einfarbige Teile; Cognac bei Schuhen und Tasche wiederholen.",
  ),
  look(
    "atelier-tag",
    "Atelier-Tag",
    "Hoodie, weite Chino und weisse Sneaker. Bequem genug für einen langen Tag auf den Beinen.",
    "wochenende",
    "kreide",
    ["hoodie-grau", "hose-beige", "sneaker-weiss", "tote-natur", "kette-gold"],
    "2026-09-14T09:00:00.000Z",
    "Grau, Beige und Weiss Ton in Ton. Die Struktur kommt vom Hoodie, nicht von Farbe.",
  ),
];

export function getSeedLook(id: string): Look | undefined {
  return SEED_LOOKS.find((l) => l.id === id);
}

export const OCCASIONS: { id: Occasion; label: string }[] = [
  { id: "alltag", label: "Alltag" },
  { id: "buero", label: "Büro" },
  { id: "abend", label: "Abend" },
  { id: "wochenende", label: "Wochenende" },
  { id: "reise", label: "Reise" },
];

export const BACKDROPS: { id: Backdrop; label: string }[] = [
  { id: "papier", label: "Weiss" },
  { id: "kreide", label: "Hellgrau" },
  { id: "sand", label: "Sand" },
  { id: "salbei", label: "Salbei" },
  { id: "nacht", label: "Stein" },
];

/** Style entries offered on the start page. Each one opens real, matching looks. */
export interface StyleEntry {
  id: string;
  label: string;
  line: string;
  href: string;
  cover: string;
  matches: (look: Look) => boolean;
}

export const BUDGET_LIMIT = 500;

export const STYLE_ENTRIES: StyleEntry[] = [
  { id: "alltag", label: "Alltag", line: "Bequem durch die Woche", href: "/entdecken?anlass=alltag", cover: "kalter-morgen", matches: (l) => l.occasion === "alltag" },
  { id: "buero", label: "Büro", line: "Klar, aber nicht steif", href: "/entdecken?anlass=buero", cover: "erster-arbeitstag", matches: (l) => l.occasion === "buero" },
  { id: "wochenende", label: "Wochenende", line: "Locker und leicht", href: "/entdecken?anlass=wochenende", cover: "sonntag-am-see", matches: (l) => l.occasion === "wochenende" },
  {
    id: "budget",
    label: `Unter CHF ${BUDGET_LIMIT}`,
    line: "Ganzer Look, kleiner Preis",
    href: `/entdecken?budget=${BUDGET_LIMIT}`,
    cover: "atelier-tag",
    matches: (l) => lookTotal(l.items) <= BUDGET_LIMIT,
  },
];
