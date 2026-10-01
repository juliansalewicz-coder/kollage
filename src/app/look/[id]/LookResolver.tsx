"use client";

import Link from "next/link";
import { LookView } from "@/components/LookView";
import { getSeedLook } from "@/lib/seed-looks";
import { useHydrated, useLooks } from "@/lib/store";

export function LookResolver({ id }: { id: string }) {
  const looks = useLooks();
  const hydrated = useHydrated();
  const seed = getSeedLook(id);
  const own = looks.find((l) => l.id === id);
  const look = seed ?? own;

  if (!look) {
    if (!hydrated) return <div className="page wrap" aria-busy="true" />;
    return (
      <div className="page wrap">
        <div className="empty">
          <h1 className="empty__title">Dieser Look ist nicht hier</h1>
          <p>
            Im MVP liegen eigene Looks nur im Browser, in dem sie erstellt wurden. Bitte die Person, dir den Link über «Teilen» zu schicken. Dieser Link
            funktioniert auf jedem Gerät.
          </p>
          <div className="empty__actions">
            <Link href="/entdecken" className="btn btn--primary">
              Looks entdecken
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LookView
      look={{
        id: look.id,
        title: look.title,
        note: look.note,
        occasion: look.occasion,
        backdrop: look.backdrop,
        items: look.items,
        authorName: look.isExample ? "Kollage Redaktion" : look.authorName,
        kind: look.isExample ? "beispiel" : look.status === "veroeffentlicht" ? "veroeffentlicht" : "privat",
      }}
    />
  );
}
