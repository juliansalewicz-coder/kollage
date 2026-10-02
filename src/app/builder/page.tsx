import type { Metadata } from "next";
import { Suspense } from "react";
import { Builder } from "@/components/builder/Builder";

export const metadata: Metadata = {
  title: "Look erstellen",
  description: "Wähle Teile aus der Galerie und arrangiere sie zur Outfit-Collage.",
};

/* Rendered per request: the server reads ?look= and sends the outfit with the HTML (see Builder `bootPreview`). */
export const dynamic = "force-dynamic";

export default function BuilderPage() {
  return (
    // The fallback keeps the builder's height, so nothing below jumps when it appears.
    <Suspense
      fallback={
        <div className="builder builder--loading" aria-busy="true">
          <p className="canvas-loading">Builder wird geladen …</p>
        </div>
      }
    >
      <Builder />
    </Suspense>
  );
}
