"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LookView } from "@/components/LookView";
import { getProduct } from "@/lib/catalog";
import { decodeLook } from "@/lib/share";

export function SharedLookView() {
  const data = useSearchParams().get("d");
  const shared = data ? decodeLook(data, (id) => Boolean(getProduct(id))) : null;

  if (!shared || !shared.items.length) {
    return (
      <div className="page wrap">
        <div className="empty">
          <h1 className="empty__title">Dieser Link enthält keinen Look</h1>
          <p>Der Link ist unvollständig oder beschädigt. Bitte um einen neuen Link oder entdecke andere Looks.</p>
          <div className="empty__actions">
            <Link href="/entdecken" className="btn btn--primary">
              Looks entdecken
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <LookView look={{ ...shared, id: null, note: "", authorName: null, kind: "geteilt" }} />;
}
