"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { LookTile } from "@/components/LookTile";
import { normalize, getProduct } from "@/lib/catalog";
import { lookTotal } from "@/lib/look";
import { OCCASIONS, SEED_LOOKS } from "@/lib/seed-looks";
import { useLooks } from "@/lib/store";
import type { Look, Occasion } from "@/lib/types";

type Sort = "neu" | "preis-auf" | "preis-ab";

const BUDGETS = [
  { id: "", label: "Jedes Budget" },
  { id: "300", label: "bis CHF 300" },
  { id: "600", label: "bis CHF 600" },
  { id: "1000", label: "bis CHF 1’000" },
];

export function DiscoverView() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const own = useLooks();

  const q = params.get("q") ?? "";
  const occasion = (params.get("anlass") ?? "") as Occasion | "";
  const budget = params.get("budget") ?? "";
  const sort = (params.get("sort") ?? "neu") as Sort;
  const [text, setText] = useState(q);
  useEffect(() => setText(q), [q]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${path}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  const all = useMemo<Look[]>(() => {
    const published = own.filter((l) => l.status === "veroeffentlicht");
    return [...published, ...SEED_LOOKS];
  }, [own]);

  const results = useMemo(() => {
    const words = normalize(q).split(/\s+/).filter(Boolean);
    const max = budget ? Number(budget) : null;
    const list = all.filter((look) => {
      if (occasion && look.occasion !== occasion) return false;
      if (max !== null && lookTotal(look.items) > max) return false;
      if (!words.length) return true;
      const hay = normalize(
        [look.title, look.note, ...look.items.map((i) => `${getProduct(i.productId)?.title ?? ""} ${getProduct(i.productId)?.colorName ?? ""}`)].join(" "),
      );
      return words.every((w) => hay.includes(w));
    });
    return list.sort((a, b) =>
      sort === "preis-auf"
        ? lookTotal(a.items) - lookTotal(b.items)
        : sort === "preis-ab"
          ? lookTotal(b.items) - lookTotal(a.items)
          : b.createdAt.localeCompare(a.createdAt),
    );
  }, [all, q, occasion, budget, sort]);

  const filtered = Boolean(q || occasion || budget);

  return (
    <div className="page wrap">
      <header className="page__head">
        <h1 className="page__title">Looks entdecken</h1>
        <p className="page__lead">Öffne einen Look, um seine Teile zu sehen, oder übernimm ihn in den Builder und pass ihn an.</p>
      </header>

      <div className="toolbar" role="search">
        <div className="field field--search">
          <label htmlFor="look-search" className="sr-only">
            Looks durchsuchen
          </label>
          <Icon name="search" className="field__icon" />
          <input
            id="look-search"
            type="search"
            placeholder="Suche nach Titel oder Teil, z. B. Trench"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setParam("q", e.target.value);
            }}
          />
        </div>
        <div className="chips" role="group" aria-label="Anlass">
          <button type="button" className="chip" aria-pressed={!occasion} onClick={() => setParam("anlass", "")}>
            Alle
          </button>
          {OCCASIONS.map((o) => (
            <button key={o.id} type="button" className="chip" aria-pressed={occasion === o.id} onClick={() => setParam("anlass", occasion === o.id ? "" : o.id)}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="toolbar__selects">
          <div className="field field--inline">
            <label htmlFor="look-budget">Budget</label>
            <select id="look-budget" value={budget} onChange={(e) => setParam("budget", e.target.value)}>
              {BUDGETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field field--inline">
            <label htmlFor="look-sort">Sortierung</label>
            <select id="look-sort" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
              <option value="neu">Neueste zuerst</option>
              <option value="preis-auf">Preis aufsteigend</option>
              <option value="preis-ab">Preis absteigend</option>
            </select>
          </div>
        </div>
      </div>

      <p className="result-count" aria-live="polite">
        {results.length === 1 ? "1 Look" : `${results.length} Looks`}
        {filtered && " gefunden"}
      </p>

      {results.length ? (
        <div className="street__grid street__grid--discover">
          {results.map((look) => (
            <LookTile key={look.id} look={look} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2 className="empty__title">Kein Look passt zu diesen Filtern</h2>
          <p>Entferne einen Filter oder stell den Look, den du suchst, selbst zusammen.</p>
          <div className="empty__actions">
            <button type="button" className="btn btn--ghost" onClick={() => router.replace(path, { scroll: false })}>
              Filter zurücksetzen
            </button>
            <Link href="/builder" className="btn btn--primary">
              Look erstellen
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
