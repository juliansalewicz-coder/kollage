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

const WIDTH = 1080; // 4:5, the size Instagram and TikTok accept for photos
const SCALE = WIDTH / CANVAS_W;
const FOOTER = 120;

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${src}`));
    img.src = src;
  });
}

/**
 * Draws the collage as a PNG: pieces in their layer order with the same soft shadow as on screen,
 * plus a white strip with the look title, the total and the name Kollage.
 */
export async function renderLookImage(items: CanvasItem[], backdrop: Backdrop, title: string, total: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = CANVAS_H * SCALE + FOOTER;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas wird nicht unterstützt");

  ctx.fillStyle = WALL[backdrop];
  ctx.fillRect(0, 0, WIDTH, CANVAS_H * SCALE);

  const pieces = [...items].sort((a, b) => a.z - b.z).flatMap((it) => {
    const product = getProduct(it.productId);
    return product && product.image.type !== "illustration" ? [{ it, product, src: product.image.src }] : [];
  });
  const images = await Promise.all(pieces.map((p) => load(p.src)));

  pieces.forEach(({ it, product }, i) => {
    const w = it.w * SCALE;
    const h = w * imageAspect(product);
    ctx.save();
    ctx.translate(it.x * SCALE, it.y * SCALE);
    ctx.rotate((it.rotation * Math.PI) / 180);
    ctx.shadowColor = "rgba(0, 0, 0, 0.13)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 7;
    ctx.drawImage(images[i], -w / 2, -h / 2, w, h);
    ctx.restore();
  });

  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const y = CANVAS_H * SCALE;
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

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG fehlgeschlagen"))), "image/png"));
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
