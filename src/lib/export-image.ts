import { getProduct, imageAspect } from "./catalog";
import { CANVAS_H, CANVAS_W } from "./collage";
import { formatCHF } from "./format";
import type { Backdrop, CanvasItem } from "./types";

/** Same wall tones as the CSS backdrops (Clean Shop greys for the two neutral ones). */
const WALL: Record<Backdrop, string> = {
  papier: "#f5f5f5",
  kreide: "#f3f3f3",
  sand: "#faf7f2",
  salbei: "#f4f7f3",
  nacht: "#f1efeb",
};

/* The whole file is 4:5 (1080 × 1350), the portrait size Instagram and TikTok show without cropping.
   The title strip sits inside it: the collage is scaled to the space above and centred on the wall colour. */
const WIDTH = 1080;
const HEIGHT = 1350;
const FOOTER = 120;
const SCALE = (HEIGHT - FOOTER) / CANVAS_H;
const OFFSET_X = (WIDTH - CANVAS_W * SCALE) / 2;
export const EXPORT_SIZE = { width: WIDTH, height: HEIGHT };

/**
 * Retailer pictures come from other hosts. Without CORS a single foreign picture "taints" the canvas and the
 * PNG cannot be read. So foreign pictures are requested with crossOrigin="anonymous" (set before src), and a
 * picture that still fails is left out instead of breaking the whole export.
 */
function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    if (new URL(src, window.location.href).origin !== window.location.origin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Thrown when the PNG cannot be read back, e.g. a foreign picture without CORS header slipped through. */
export class ExportBlockedError extends Error {}

/**
 * Draws the collage as a PNG: pieces in their layer order with the same soft shadow as on screen,
 * plus a white strip with the look title, the total and the name Kollage. 1080 × 1350 px in total.
 */
export async function renderLookImage(items: CanvasItem[], backdrop: Backdrop, title: string, total: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas wird nicht unterstützt");

  ctx.fillStyle = WALL[backdrop];
  ctx.fillRect(0, 0, WIDTH, HEIGHT - FOOTER);

  const pieces = [...items].sort((a, b) => a.z - b.z).flatMap((it) => {
    const product = getProduct(it.productId);
    return product && product.image.type !== "illustration" ? [{ it, product, src: product.image.src }] : [];
  });
  const images = await Promise.all(pieces.map((p) => load(p.src)));

  pieces.forEach(({ it, product }, i) => {
    const w = it.w * SCALE;
    const h = w * imageAspect(product);
    ctx.save();
    ctx.translate(OFFSET_X + it.x * SCALE, it.y * SCALE);
    ctx.rotate((it.rotation * Math.PI) / 180);
    ctx.shadowColor = "rgba(0, 0, 0, 0.13)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 7;
    const img = images[i];
    if (img) ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  });

  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const y = HEIGHT - FOOTER;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, y, WIDTH, FOOTER);
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "middle";
  ctx.font = `600 38px ${font}`;
  ctx.fillText(title.length > 34 ? `${title.slice(0, 33)}…` : title, 56, y + 46);
  ctx.font = `400 28px ${font}`;
  ctx.fillStyle = "#666666";
  ctx.fillText(`${formatCHF(total)} · Beispielpreise`, 56, y + 86);
  ctx.textAlign = "right";
  ctx.fillStyle = "#111111";
  ctx.font = `700 30px ${font}`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "6px";
  ctx.fillText("KOLLAGE", WIDTH - 50, y + FOOTER / 2);

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG fehlgeschlagen"))), "image/png");
    } catch (err) {
      reject(err instanceof DOMException && err.name === "SecurityError" ? new ExportBlockedError("Händlerbild ohne Freigabe") : err);
    }
  });
}

/** Phones: the system share sheet (save to photos, send to an app). Elsewhere: a download. */
export async function shareOrDownload(blob: Blob, title: string): Promise<"geteilt" | "gespeichert"> {
  const name = `${title.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "look"}.png`;
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] }) && window.matchMedia("(pointer: coarse)").matches) {
    await navigator.share({ files: [file], title });
    return "geteilt";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "gespeichert";
}
