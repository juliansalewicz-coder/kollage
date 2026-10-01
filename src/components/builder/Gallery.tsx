"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { bestOffer, CATEGORIES, COLOR_FAMILIES, filterProducts, getShop, PRODUCTS } from "@/lib/catalog";
import { formatCHF } from "@/lib/format";
import { useFavorites } from "@/lib/store";
import type { Category, ColorFamily } from "@/lib/types";
import { ActiveFilters, type ActiveFilter } from "../ActiveFilters";
import { FavoriteButton } from "../FavoriteButton";
import { ProductImage } from "../GarmentArt";
import { Icon } from "../Icon";

const PRICE_CAPS = [
  { id: "", label: "Jeder Preis" },
  { id: "50", label: "bis CHF 50" },
  { id: "100", label: "bis CHF 100" },
  { id: "200", label: "bis CHF 200" },
];

type Scope = "alle" | "gemerkt";

export function Gallery({
  onAdd,
  counts,
  onClose,
  open,
}: {
  onAdd: (productId: string) => void;
  counts: Map<string, number>;
  onClose: () => void;
  open: boolean;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) searchRef.current?.focus({ preventScroll: true });
  }, [open]);
  const favs = useFavorites();
  const [scope, setScope] = useState<Scope>("alle");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "alle">("alle");
  const [colors, setColors] = useState<ColorFamily[]>([]);
  const [cap, setCap] = useState("");

  const results = useMemo(() => {
    const pool = scope === "gemerkt" ? PRODUCTS.filter((p) => favs.products.includes(p.id)) : PRODUCTS;
    return filterProducts(pool, { query, category, colors, maxPrice: cap ? Number(cap) : null });
  }, [scope, favs.products, query, category, colors, cap]);

  const toggleColor = (c: ColorFamily) => setColors((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const reset = () => {
    setQuery("");
    setCategory("alle");
    setColors([]);
    setCap("");
    setScope("alle");
  };

  const active: ActiveFilter[] = [
    ...(scope === "gemerkt" ? [{ key: "scope", label: "Nur gemerkte", onRemove: () => setScope("alle") }] : []),
    ...(query ? [{ key: "q", label: `«${query}»`, onRemove: () => setQuery("") }] : []),
    ...(category !== "alle" ? [{ key: "cat", label: CATEGORIES.find((c) => c.id === category)?.label ?? category, onRemove: () => setCategory("alle") }] : []),
    ...colors.map((c) => ({ key: `c-${c}`, label: COLOR_FAMILIES.find((x) => x.id === c)?.label ?? c, onRemove: () => toggleColor(c) })),
    ...(cap ? [{ key: "cap", label: PRICE_CAPS.find((p) => p.id === cap)?.label ?? cap, onRemove: () => setCap("") }] : []),
  ];

  return (
    <div className="gallery">
      <div className="sheet-grip" aria-hidden="true" />
      <div className="gallery__head">
        <h2 className="panel__title">Produkte</h2>
        <button type="button" className="btn btn--secondary btn--sm sheet-close" onClick={onClose}>
          Fertig
        </button>
      </div>
      <p className="gallery__demo">Demo-Katalog · Demo-Renderings, keine angebotenen Artikel</p>

      <div className="segmented" role="group" aria-label="Auswahl">
        <button type="button" aria-pressed={scope === "alle"} onClick={() => setScope("alle")}>
          Alle
        </button>
        <button type="button" aria-pressed={scope === "gemerkt"} onClick={() => setScope("gemerkt")}>
          <Icon name="heart" size={16} /> Gemerkt <span className="num">{favs.products.length}</span>
        </button>
      </div>

      <div className="field field--search">
        <label htmlFor="product-search" className="sr-only">
          Produkte durchsuchen
        </label>
        <Icon name="search" className="field__icon" />
        <input
          ref={searchRef}
          id="product-search"
          type="search"
          placeholder="Suche, z. B. Jeans, Leder, Grün"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="tabs-scroll" role="group" aria-label="Kategorie">
        <button type="button" className="chip" aria-pressed={category === "alle"} onClick={() => setCategory("alle")}>
          Alle
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="gallery__filters">
        <div className="swatches" role="group" aria-label="Farbe">
          {COLOR_FAMILIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="swatch"
              style={{ "--swatch": c.swatch } as React.CSSProperties}
              aria-pressed={colors.includes(c.id)}
              title={c.label}
              onClick={() => toggleColor(c.id)}
            >
              <span className="sr-only">{c.label}</span>
            </button>
          ))}
        </div>
        <div className="field field--inline">
          <label htmlFor="price-cap" className="sr-only">
            Preis
          </label>
          <select id="price-cap" value={cap} onChange={(e) => setCap(e.target.value)}>
            {PRICE_CAPS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="gallery__result">
        <p className="result-count" aria-live="polite">
          {results.length === 1 ? "1 Teil" : `${results.length} Teile`}
        </p>
        <ActiveFilters filters={active} onReset={reset} />
      </div>

      {results.length ? (
        <ul className="product-grid">
          {results.map((p) => {
            const offer = bestOffer(p);
            const n = counts.get(p.id) ?? 0;
            return (
              <li key={p.id} className="product-cell">
                <button
                  type="button"
                  className="product-card"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/kollage-product", p.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => onAdd(p.id)}
                >
                  <span className="product-card__stage">
                    <ProductImage product={p} className="product-card__img" lazy sizes="120px" />
                    {n > 0 && <span className="product-card__in">Im Look{n > 1 ? ` ×${n}` : ""}</span>}
                  </span>
                  <span className="product-card__title">{p.title}</span>
                  <span className="product-card__meta">
                    {p.colorName} · {getShop(offer.shopId).name.replace("Demo-Shop ", "")}
                  </span>
                  <span className="product-card__row">
                    <span className="num">
                      {p.offers.length > 1 ? "ab " : ""}
                      {formatCHF(offer.priceCHF)}
                    </span>
                    <span className="product-card__add" aria-hidden="true">
                      <Icon name="plus" size={18} />
                    </span>
                  </span>
                  <span className="sr-only">, zum Look hinzufügen</span>
                </button>
                <FavoriteButton kind="products" id={p.id} label={p.title} className="product-cell__fav" />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty empty--small">
          <p>{scope === "gemerkt" && favs.products.length === 0 ? "Noch nichts gemerkt. Tippe bei einem Produkt auf das Herz." : "Kein Teil passt zu diesen Filtern."}</p>
          <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
            Filter zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}
