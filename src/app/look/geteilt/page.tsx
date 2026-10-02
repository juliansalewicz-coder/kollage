import type { Metadata } from "next";
import { Suspense } from "react";
import { getProduct } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { distinctCount, lookTotal } from "@/lib/look";
import { decodeLook } from "@/lib/share";
import { SharedLookView } from "./SharedLookView";

/** Own looks travel in the link, so their preview (title, total, collage picture) is built from it per request. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ d?: string }> }): Promise<Metadata> {
  const { d } = await searchParams;
  const look = d ? decodeLook(d, (id) => Boolean(getProduct(id))) : null;
  if (!look || !look.items.length) return { title: "Geteilter Look", robots: { index: false } };
  const title = look.title || "Geteilter Look";
  const description = `${distinctCount(look.items)} Teile, zusammen ${formatCHF(lookTotal(look.items))}. Ansehen und auf Kollage anpassen.`;
  const image = { url: `/og?d=${encodeURIComponent(d!)}`, width: 1200, height: 630, alt: `Collage «${title}»` };
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title: `${title} · Kollage`, description, type: "article", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default function SharedLookPage() {
  return (
    <Suspense>
      <SharedLookView />
    </Suspense>
  );
}
