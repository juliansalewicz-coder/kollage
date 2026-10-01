"""Cut product renders out of their grey studio background.

Input:  docs/higgsfield/raw/<id>.png  (Higgsfield z_image renders on light grey)
Output: public/products/<id>.webp     (transparent, trimmed, max 900 px tall)
        src/lib/renders.json          (id -> width, height, job id)

Method: model the background as a smooth surface fitted to the border pixels,
mark pixels close to it, keep the background region connected to the border
(plus large enclosed pockets such as bag handles), then feather the edge.
"""
import json
import pathlib

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "docs" / "higgsfield" / "raw"
OUT = ROOT / "public" / "products"
OUT.mkdir(parents=True, exist_ok=True)
JOBS = {}
for line in (ROOT / "docs" / "higgsfield" / "jobs.tsv").read_text(encoding="utf-8").splitlines():
    parts = line.split("\t")
    if len(parts) == 3:
        JOBS[parts[0]] = parts[1]

MAX_H = 900
# Per-item tuning for renders the generic matte gets wrong.
#   pockets=False   keep enclosed neutral areas (white sneaker shading is not backdrop)
#   neutral_bg=N    neutral pixels within N luminance of the backdrop count as backdrop
OPTS = {
    "sneaker-weiss": {"pockets": False},
    "tote-natur": {"neutral_bg": 24},
    "tote-schwarz": {"neutral_bg": 24},
}
SMALL = 360


def background_model(rgb: np.ndarray) -> np.ndarray:
    """Fit a quadratic surface per channel to a 24 px border band."""
    h, w, _ = rgb.shape
    band = 24
    ys, xs = np.mgrid[0:h, 0:w]
    mask = np.zeros((h, w), bool)
    mask[:band] = mask[-band:] = True
    mask[:, :band] = mask[:, -band:] = True
    yn, xn = ys / h, xs / w
    A = np.stack([np.ones_like(xn), xn, yn, xn * yn, xn**2, yn**2], -1)
    Am = A[mask]
    model = np.empty_like(rgb, dtype=np.float32)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(Am, rgb[..., c][mask], rcond=None)
        model[..., c] = A @ coef
    return model


def finish(out: Image.Image, pid: str) -> dict:
    if out.height > MAX_H:
        out = out.resize((round(out.width * MAX_H / out.height), MAX_H), Image.LANCZOS)
    if out.width > MAX_H:
        out = out.resize((MAX_H, round(out.height * MAX_H / out.width)), Image.LANCZOS)
    out.save(OUT / f"{pid}.webp", "WEBP", quality=86, method=6)
    # Small variant for tiles, thumbnails and the gallery.
    small = out.copy()
    small.thumbnail((SMALL, SMALL), Image.LANCZOS)
    (OUT / "sm").mkdir(exist_ok=True)
    small.save(OUT / "sm" / f"{pid}.webp", "WEBP", quality=82, method=6)
    return {"width": out.width, "height": out.height, "job": JOBS.get(pid, "")}


def cut(pid: str) -> dict | None:
    # Pre-cut by Higgsfield's background remover: only trim and resize.
    pre = ROOT / "docs" / "higgsfield" / "cut" / f"{pid}.png"
    if pre.exists():
        im = Image.open(pre).convert("RGBA")
        bbox = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        return finish(im.crop(bbox), pid) | {"cutout": "higgsfield remove_background"}
    src = RAW / f"{pid}.png"
    if not src.exists():
        return None
    img = Image.open(src).convert("RGB")
    rgb = np.asarray(img).astype(np.float32)
    bg = background_model(rgb)
    dist = np.sqrt(((rgb - bg) ** 2).sum(-1))
    near = dist < 14
    opts = OPTS.get(pid, {})

    lum = rgb.mean(-1)
    bg_lum = bg.mean(-1)
    chroma = np.abs(rgb - rgb.mean(-1, keepdims=True)).max(-1)
    bg_chroma = np.abs(bg - bg.mean(-1, keepdims=True)).max(-1)
    if "neutral_bg" in opts:
        near |= (np.abs(chroma - bg_chroma) < 6) & (np.abs(lum - bg_lum) < opts["neutral_bg"])
    # Studio shadow: neutral grey, a little darker than the backdrop.
    shadow_cand = (lum < bg_lum) & (np.abs(chroma - bg_chroma) < 7) & (dist < 45)

    h, w = near.shape
    combined = near | shadow_cand
    labels, n = ndimage.label(combined)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, border[border > 0])
    # Enclosed pockets of backdrop (inside bag straps, between handles).
    sizes = ndimage.sum(combined, labels, range(n + 1))
    for lab in np.where(sizes > 0.0015 * h * w)[0] if opts.get("pockets", True) else []:
        if lab == 0 or lab in border:
            continue
        region = labels == lab
        neutral = (np.abs(chroma - bg_chroma) < 10)[region].mean()
        if neutral > 0.9 and lum[region].mean() > bg_lum[region].mean() - 40:
            background |= region
    shadow_px = background & ~near

    fg = ~background
    fg = ndimage.binary_opening(fg, iterations=2)
    # Keep the main object and pieces near it; drop specks.
    lab_fg, nfg = ndimage.label(fg)
    if nfg == 0:
        return None
    fsizes = ndimage.sum(fg, lab_fg, range(1, nfg + 1))
    keep = np.isin(lab_fg, 1 + np.where(fsizes > 0.03 * fsizes.max())[0])
    keep = ndimage.binary_fill_holes(keep) & (keep | ~background)

    alpha = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    # Pull the edge in slightly so no grey halo remains.
    a = np.asarray(alpha).astype(np.float32) / 255
    a = np.clip((a - 0.25) / 0.75, 0, 1)

    # Keep a faint version of the removed studio shadow so pieces still sit on the surface.
    a = np.maximum(a, np.where(shadow_px, np.clip((dist - 14) / 120, 0, 0.22), 0))
    rgb = np.where(shadow_px[..., None], 0, rgb)

    rgba = np.dstack([rgb, a * 255]).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")

    ys, xs = np.where(a > 0.02)
    pad = 6
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(w, xs.max() + pad + 1), min(h, ys.max() + pad + 1))
    return finish(out.crop(box), pid)


def main():
    meta = {}
    for src in sorted(RAW.glob("*.png")):
        pid = src.stem
        info = cut(pid)
        if info:
            meta[pid] = info
            print(pid, info["width"], info["height"])
    (ROOT / "src" / "lib" / "renders.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
