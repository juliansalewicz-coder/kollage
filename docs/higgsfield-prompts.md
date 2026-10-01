# Higgsfield in Kollage

Status 2026-10-01: Higgsfield is connected (claude.ai connector, **free plan, 10 credits**, max. 1 concurrent job).
Free plan blocks GPT Image 2.5 and Nano Banana; generation used **Z Image** (`z_image`, 0.15 credits per image).

## What was actually generated with Higgsfield

| Asset | Model | Files | Used on the site |
|---|---|---|---|
| Design reference, Startseite (light, Apple-like) | z_image, 16:9 | `docs/higgsfield/ref-startseite.png` | Reference only (UI text in the image is garbled; the page is built in HTML/CSS) |
| 40 product renders (one per demo article) | z_image, 3:4 / 1:1 / 4:3 | raw: `docs/higgsfield/raw/*.png`, prompts: `docs/higgsfield/products.json`, job ids: `docs/higgsfield/jobs.tsv` | Cut out with `scripts/cutout.py` to `public/products/*.webp`, shown in gallery, collages, look pages |
| Background removal for 3 hard cases | Higgsfield `remove_background` (~1 credit each) | `docs/higgsfield/cut/*.png` | Hoodie (grey on grey), baseball cap (large cast shadow), small black crossbody bag (strap pocket) |

All renders are **AI-generated demo material**. The site labels them as demo renderings (gallery header, footer, Hinweise page). They never stand in for an offered article; real offers must use authentic retailer images with usage rights (`Product.image.type = "retailer"`).

Not generated (failed twice on the provider side, credits not charged): the builder design reference. Prompt below for a later run.

## Visual direction (current)

Bright, quiet, precise. White `#FFFFFF`, secondary `#F5F5F7`, ink `#1D1D1F`, secondary text `#626267`, accent blue `#0071E3`. Products bring the colour. Consistent product renders: flat lay or side profile, soft even studio light, plain light grey backdrop (cut out afterwards).

## Prompts

Product template (used for all 40; per-item values in `docs/higgsfield/products.json`):

> Professional e-commerce studio product photo of {desc}, {view}, centered and fully visible with generous empty margin on all sides, isolated on a plain uniform light grey seamless background, soft even diffused lighting, crisp fabric texture, true colours, no model, no mannequin, no hanger, no props, no text, no logo, no cast shadow.

Design reference, Startseite (generated):

> High-fidelity desktop website homepage UI design screenshot, Apple-like clarity, for a fashion outfit-collage website called Kollage. Pure white page, near-black text, one accent blue #0071E3. Slim white top navigation with small wordmark 'Kollage' left and a small blue pill button right. Centered large bold sans-serif headline 'Stelle deinen Look zusammen.' with a grey subline below, a blue pill button and a blue text link. Below, a very large wide rounded light grey panel with a beautifully arranged flat-lay outfit collage of sharp photorealistic product cut-outs with soft shadows: sand trench coat, camel wool sweater, dark straight jeans, brown leather shoulder bag, tan suede Chelsea boots, checked wool scarf. Generous whitespace, minimal premium, no brand logos.

Design reference, Outfit-Builder (not yet generated; better with Nano Banana Pro or GPT Image on a paid plan):

> High-fidelity desktop web app UI design screenshot of a light, calm outfit collage builder, Apple-like clarity. Very light grey workspace. Left: white rounded panel with a search field, small pill category chips, colour dots and a two-column grid of product cards with photorealistic clothing cut-outs on light grey tiles, prices and small blue round plus buttons. Center: a large white rounded canvas with a soft shadow holding an outfit collage (light blue oxford shirt selected with a thin blue outline and round handles, black wide trousers, black leather tote, brown loafers). Below the canvas a white rounded toolbar with small line icons. Right: white rounded panel with item details, two blue sliders and a numbered list with prices. One accent blue, near-black text, generous spacing, no brand logos.

Lifestyle image (optional, label on site as "KI-generiertes Stimmungsbild"):

> A person in their late twenties walking under stone arcades in a Swiss city on a cool autumn morning, wearing a sand trench coat over a camel sweater, dark straight jeans and tan suede Chelsea boots, brown leather bag on the shoulder. Face turned away, natural daylight, muted palette, clean editorial fashion photography, no logos.

Short video (optional, 6–8 s, Seedance or Kling, paid plan):

> Locked-off overhead shot of a white seamless surface. One by one, garments are placed to form an outfit collage: camel sweater, dark jeans, tan suede boots, brown leather bag. Each piece settles with a soft shadow. Soft daylight, calm pace, no text, no logos. Final frame holds for one second to loop.

## Re-running the cut-outs

```bash
python scripts/cutout.py
```

Reads `docs/higgsfield/raw/` (and pre-cut files in `docs/higgsfield/cut/`), writes `public/products/*.webp` and `src/lib/renders.json`. Products without a render fall back to the SVG demo illustration.
