import type { Metadata } from "next";
import { Suspense } from "react";
import { Builder } from "@/components/builder/Builder";

export const metadata: Metadata = {
  title: "Look erstellen",
  description: "Wähle Teile aus der Galerie und arrangiere sie zur Outfit-Collage.",
};

export default function BuilderPage() {
  return (
    <Suspense>
      <Builder />
    </Suspense>
  );
}
