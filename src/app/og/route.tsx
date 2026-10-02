import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";
import { getProduct, imageAspect } from "@/lib/catalog";
import { CANVAS_H, CANVAS_W } from "@/lib/collage";
import { formatCHF } from "@/lib/format";
import { distinctCount, lookTotal } from "@/lib/look";
import { getSeedLook } from "@/lib/seed-looks";
import { decodeLook } from "@/lib/share";
import type { Backdrop, CanvasItem } from "@/lib/types";

/**
 * Link preview picture (1200 × 630) for a look: the collage on the left, title, pieces and total on the right.
 * /og?look=<example id> or /og?d=<share code>. Works for shared own looks too, because the look travels in the link.
 */
export const runtime = "nodejs";

const W = 1200;
const H = 630;
const COLLAGE_H = H;
const SCALE = COLLAGE_H / CANVAS_H;
const COLLAGE_W = CANVAS_W * SCALE;
const WALL: Record<Backdrop, string> = { papier: "#f5f5f5", kreide: "#f3f3f3", sand: "#faf7f2", salbei: "#f4f7f3", nacht: "#f1efeb" };

/** Product pictures as data URIs: PNG copies (public/products/og, scripts/og-pngs.py), the renderer cannot read WebP. */
async function picture(src: string): Promise<string | null> {
  try {
    const png = src.replace("/products/", "/products/og/").replace(/\.webp$/, ".png");
    const file = await fs.readFile(path.join(process.cwd(), "public", png));
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const seed = getSeedLook(url.searchParams.get("look") ?? "");
  const shared = seed ? null : decodeLook(url.searchParams.get("d") ?? "", (id) => Boolean(getProduct(id)));
  const look = seed ?? shared;
  const title = look?.title || "Ein Look auf Kollage";
  const items: CanvasItem[] = look ? [...look.items].sort((a, b) => a.z - b.z) : [];
  const backdrop: Backdrop = look?.backdrop ?? "papier";

  const pieces = await Promise.all(
    items.map(async (it) => {
      const p = getProduct(it.productId);
      if (!p || p.image.type === "illustration") return null;
      const src = await picture(p.image.src);
      if (!src) return null;
      const w = it.w * SCALE;
      const h = w * imageAspect(p);
      return { key: it.uid, src, w, h, left: it.x * SCALE - w / 2, top: it.y * SCALE - h / 2, rotation: it.rotation };
    }),
  );

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", background: "#ffffff", fontFamily: "sans-serif" }}>
        <div style={{ position: "relative", width: COLLAGE_W, height: COLLAGE_H, display: "flex", background: WALL[backdrop], overflow: "hidden" }}>
          {pieces.map((p) =>
            p ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.key}
                src={p.src}
                width={p.w}
                height={p.h}
                alt=""
                style={{ position: "absolute", left: p.left, top: p.top, width: p.w, height: p.h, transform: `rotate(${p.rotation}deg)` }}
              />
            ) : null,
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 56px" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, fontWeight: 700, color: "#111111" }}>KOLLAGE</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: title.length > 32 ? 44 : 56, fontWeight: 700, lineHeight: 1.1, color: "#111111" }}>
              {title.length > 60 ? `${title.slice(0, 59)}…` : title}
            </div>
            {look && (
              <div style={{ display: "flex", marginTop: 20, fontSize: 28, color: "#555555" }}>
                {`${distinctCount(look.items)} Teile · ${formatCHF(lookTotal(look.items))}`}
              </div>
            )}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#777777" }}>Look ansehen und anpassen · Demo-Katalog, Beispielpreise</div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}
