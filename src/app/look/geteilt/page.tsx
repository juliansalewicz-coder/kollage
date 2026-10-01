import type { Metadata } from "next";
import { Suspense } from "react";
import { SharedLookView } from "./SharedLookView";

export const metadata: Metadata = { title: "Geteilter Look", robots: { index: false } };

export default function SharedLookPage() {
  return (
    <Suspense>
      <SharedLookView />
    </Suspense>
  );
}
