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
  // Link previews (messages, social): title, the look note and the collage as a picture (app/og).
  const description = `${seed.note} ${seed.items.length} Teile mit Preisen in CHF und Shops.`;
  const image = { url: `/og?look=${seed.id}`, width: 1200, height: 630, alt: `Collage «${seed.title}»` };
  return {
    title: seed.title,
    description,
    openGraph: { title: `${seed.title} · Kollage`, description, type: "article", locale: "de_CH", siteName: "Kollage", images: [image] },
    twitter: { card: "summary_large_image", title: seed.title, description, images: [image.url] },
  };
}

export default async function LookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LookResolver id={id} />;
}
