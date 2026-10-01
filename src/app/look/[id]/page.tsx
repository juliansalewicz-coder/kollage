import type { Metadata } from "next";
import { LookResolver } from "./LookResolver";
import { getSeedLook, SEED_LOOKS } from "@/lib/seed-looks";

export function generateStaticParams() {
  return SEED_LOOKS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const seed = getSeedLook(id);
  return { title: seed ? seed.title : "Look" };
}

export default async function LookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LookResolver id={id} />;
}
