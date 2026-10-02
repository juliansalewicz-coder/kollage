"use client";

import { useState } from "react";
import { toast } from "@/lib/events";
import { toggleFavorite, useFavorites, type Favorites } from "@/lib/store";
import { Icon } from "./Icon";

/** Heart toggle for products and looks. Tells the truth when the browser cannot keep it. */
export function FavoriteButton({
  kind,
  id,
  label,
  variant = "icon",
  className = "",
}: {
  kind: keyof Favorites;
  id: string;
  label: string;
  variant?: "icon" | "pill";
  className?: string;
}) {
  const favs = useFavorites();
  const active = favs[kind].includes(id);
  const noun = kind === "products" ? "Produkt" : "Look";
  // Re-mounting the icon replays the pop only when the person taps, not on every page load.
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      className={`fav ${variant === "pill" ? "btn btn--ghost" : "fav--icon"} ${active ? "is-active" : ""} ${className}`}
      aria-pressed={active}
      aria-label={variant === "icon" ? `${label} merken` : undefined}
      title={active ? "Gemerkt" : "Merken"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const res = toggleFavorite(kind, id);
        if (res.active) setPop(Date.now());
        if (!res.persisted) toast(`${noun} ${res.active ? "gemerkt" : "entfernt"}, aber nur für diese Sitzung: Browserspeicher blockiert`);
        else toast(res.active ? `${noun} gemerkt` : `${noun} aus Gemerkt entfernt`);
      }}
    >
      <span key={pop} className={`fav__icon ${pop ? "is-pop" : ""}`}>
        <Icon name={active ? "heartFilled" : "heart"} size={variant === "pill" ? 18 : 20} />
      </span>
      {variant === "pill" && <span>{active ? "Gemerkt" : "Merken"}</span>}
    </button>
  );
}
