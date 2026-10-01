import type { Metadata } from "next";
import { FavoritesView } from "./FavoritesView";

export const metadata: Metadata = { title: "Gemerkt", robots: { index: false } };

export default function FavoritesPage() {
  return <FavoritesView />;
}
