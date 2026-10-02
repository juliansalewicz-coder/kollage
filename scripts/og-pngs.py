"""PNG copies of the product renders for link-preview pictures (app/og): the OG renderer (satori) cannot read WebP.
Run after adding or changing renders:  python scripts/og-pngs.py"""
from pathlib import Path
from PIL import Image

src = Path(__file__).resolve().parent.parent / "public" / "products"
out = src / "og"
out.mkdir(exist_ok=True)
for f in sorted(src.glob("*.webp")):
    im = Image.open(f).convert("RGBA")
    im.thumbnail((260, 260))
    # Cut-outs carry faint alpha noise around the garment; quantizing would turn it into a visible box.
    alpha = im.getchannel("A").point(lambda a: 0 if a < 24 else a)
    im.putalpha(alpha)
    # 256 colours with alpha: a third of the size, no visible loss at preview size.
    im.quantize(256, method=Image.Quantize.FASTOCTREE).save(out / (f.stem + ".png"), optimize=True)
print("done", len(list(out.glob("*.png"))))
