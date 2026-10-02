import type { Metadata } from "next";
import { LookResolver } from "./LookResolver";
import { getSeedLook, SEED_LOOKS } from "@/lib/seed-looks";

export function generateStaticParams() {
  return SEED_LOOKS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const seed = getSeedLook(id);
  if (!seed) return { title: "Look", robots: { index: false } };
  // Link previews (messages, social): title and the look note; no image yet (see README).
  const description = `${seed.note} ${seed.items.length} Teile mit Preisen in CHF und Shops.`;
  return {
    title: seed.title,
    description,
    openGraph: { title: `${seed.title} · Kollage`, description, type: "article", locale: "de_CH", siteName: "Kollage" },
    twitter: { card: "summary", title: seed.title, description },
  };
}

export default async function LookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LookResolver id={id} />;
}
