import { autoArrange } from "./collage";
import { getProduct, imageAspect } from "./catalog";
import { infoFromProduct } from "./collage";
import type { Backdrop, CanvasItem, Look, Occasion } from "./types";

/** EXAMPLE LOOKS built from the demo catalogue. Labelled as examples in the UI. */
export const lookup = (productId: string) => {
  const product = getProduct(productId);
  return product ? infoFromProduct(product, imageAspect(product)) : undefined;
};

function look(
  id: string,
  title: string,
  note: string,
  occasion: Occasion,
  backdrop: Backdrop,
  productIds: string[],
  createdAt: string,
): Look {
  const raw: CanvasItem[] = productIds.map((productId, i) => ({ uid: `${id}-${i}`, productId, x: 500, y: 600, w: 300, rotation: 0, z: i + 1 }));
  return {
    id,
    title,
    note,
    occasion,
    items: autoArrange(raw, lookup),
    backdrop,
    status: "veroeffentlicht",
    authorName: "Kollage Redaktion",
    ownerEmail: null,
    createdAt,
    updatedAt: createdAt,
    basedOn: null,
    isExample: true,
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
  ),
  look(
    "erster-arbeitstag",
    "Erster Arbeitstag",
    "Klare Linien, ein helles Hemd und Loafer, in denen man auch den Weg zum Tram schafft.",
    "buero",
    "kreide",
    ["hemd-hellblau", "blazer-schwarz", "hose-grau", "loafer-schwarz", "tote-schwarz", "uhr-silber"],
    "2026-09-26T09:00:00.000Z",
  ),
  look(
    "sonntag-am-see",
    "Sonntag am See",
    "Streifen, helle Jeans und eine Tasche, in die ein Buch und ein Badetuch passen.",
    "wochenende",
    "papier",
    ["t-streifen", "jeans-hell", "sneaker-weiss", "tote-natur", "brille-schildpatt", "cap-navy"],
    "2026-09-24T09:00:00.000Z",
  ),
  look(
    "apero-am-abend",
    "Apéro am Abend",
    "Schwarzes Shirt, Faltenrock in Bordeaux, eine Kette. Mehr braucht es nicht.",
    "abend",
    "kreide",
    ["t-schwarz", "rock-plisse", "loafer-schwarz", "crossbody-schwarz", "kette-gold"],
    "2026-09-22T09:00:00.000Z",
  ),
  look(
    "zug-nach-lugano",
    "Im Zug nach Lugano",
    "Leichtes Hemd, Bermudas und grüne Sneaker für den ersten warmen Tag südlich des Gotthards.",
    "reise",
    "salbei",
    ["hemd-weiss", "shorts-sand", "sneaker-gruen", "baguette-gruen", "brille-schwarz", "guertel-braun"],
    "2026-09-20T09:00:00.000Z",
  ),
  look(
    "kalter-morgen",
    "Kalter Morgen",
    "Wollmantel, Grobstrick und eine rostrote Mütze als einziger Farbpunkt.",
    "alltag",
    "kreide",
    ["mantel-navy", "strick-gruen", "hose-schwarz", "boot-schwarz", "beanie-rost", "crossbody-rot"],
    "2026-09-18T09:00:00.000Z",
  ),
  look(
    "karo-und-cognac",
    "Karo und Cognac",
    "Karierter Blazer zum schlichten Rock. Die Lederteile halten alles in einem warmen Ton.",
    "buero",
    "papier",
    ["blazer-karo", "t-weiss", "rock-schwarz", "loafer-braun", "baguette-braun", "brille-schildpatt"],
    "2026-09-16T09:00:00.000Z",
  ),
  look(
    "atelier-tag",
    "Atelier-Tag",
    "Hoodie, weite Chino und weisse Sneaker. Bequem genug für einen langen Tag auf den Beinen.",
    "wochenende",
    "papier",
    ["hoodie-grau", "hose-beige", "sneaker-weiss", "tote-natur", "kette-gold"],
    "2026-09-14T09:00:00.000Z",
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
