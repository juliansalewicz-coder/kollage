import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverView } from "./DiscoverView";

export const metadata: Metadata = {
  title: "Looks entdecken",
  description: "Veröffentlichte Outfits durchstöbern, Teile ansehen und einen Look zum Anpassen öffnen.",
};

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverView />
    </Suspense>
  );
}
