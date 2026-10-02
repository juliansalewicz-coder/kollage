import { COLOR_FAMILIES, getProduct } from "@/lib/catalog";
import { outfitOrder } from "@/lib/look";
import type { CanvasItem } from "@/lib/types";

/** The colour families of a look as a row of swatches, in shopping-list order (tops first). */
export function LookPalette({ items, size = "md" }: { items: CanvasItem[]; size?: "sm" | "md" }) {
  const families: { id: string; label: string; swatch: string; names: string[] }[] = [];
  for (const it of outfitOrder(items)) {
    const p = getProduct(it.productId);
    const fam = p && COLOR_FAMILIES.find((f) => f.id === p.colorFamily);
    if (!p || !fam) continue;
    const hit = families.find((f) => f.id === fam.id);
    if (hit) hit.names.push(p.colorName);
    else families.push({ ...fam, names: [p.colorName] });
  }
  if (!families.length) return null;
  const summary = families.map((f) => f.label).join(", ");
  return (
    <ul className={`palette palette--${size}`} aria-label={`Farben: ${summary}`}>
      {families.map((f, i) => (
        <li key={f.id} className="palette__dot" style={{ background: f.swatch, ["--i" as string]: i }} title={`${f.label}: ${[...new Set(f.names)].join(", ")}`} />
      ))}
      {size === "md" && <li className="palette__label" aria-hidden="true">{summary}</li>}
    </ul>
  );
}
