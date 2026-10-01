---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Surface brief: Kollage web (all routes)

Scope: Startseite (Persuade), Entdecken, Outfit-Builder, Outfit-Seite, Meine Looks (Operate). One system, one nav.
Audience/job: see PRODUCT.md. Action: build a look; open a look and reach the shop per piece.
Constraints: German (de-CH), CHF, Swiss delivery per offer, affiliate disclosure, demo data labelled. Demo garments are Higgsfield AI renders (public/products, provenance in src/lib/renders.json), labelled as demo.

Redesign 2026-10-01 (user brief, pinned): replaces the earlier "Schaufenster" world (green lacquer, lime, expanded caps).

## Direction contract

THESIS: Apple-like clarity for fashion. A bright, quiet product surface where the garments carry all the colour and the collage is the hero. Refuses dark brand fields, neon accents and shouting caps.

OWN-WORLD: White #FFFFFF surfaces, #F5F5F7 secondary fields, ink #1D1D1F, secondary text #626267, one accent blue #0071E3 for primary actions and selection. Hairline dividers, soft low shadows, 12–16 px radii, pill buttons. System font stack (SF Pro / Segoe UI / system-ui), regular and medium weights, semibold only for emphasis.

STORY: Visitor reads one line, sees a large arranged outfit at once, starts the builder as guest, signs in only to keep or publish, buys piece by piece at the shop.

FIRST VIEWPORT: Slim white nav: small wordmark left, three links, blue pill "Look erstellen" right. Centered H1 "Stelle deinen Look zusammen." (56–72 px desktop, 36–44 px mobile), one sub line, blue pill "Look erstellen" plus text link "Looks entdecken". Directly below, a wide white collage stage on a #F5F5F7 band, already visible in the first viewport at 1440×900 and 390×844.

FORM: User-pinned brief (beats the roll; earlier seed 5709f95d retired). Numbered pieces mirrored by the CHF buy list are kept from the previous build as product truth.

Signature interaction: lifting a piece raises its soft shadow, setting it down settles it (150–250 ms); arrange-in-window auto layout; mobile product drawer.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
