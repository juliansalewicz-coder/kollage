# Kollage design system

Status: as built (2 October 2026), direction «Clean Shop». Source of truth for values is the last layer of `src/app/globals.css` («Clean Shop (v3)»). Earlier layers in that file are older states that the last layer overrides; when you touch a component, move its final values down into the v3 layer rather than adding a fourth layer. Change this file together with the CSS.

## Character

Neutral and factual like a good fashion store (reference: COS, Zalando). The garments and prices carry the page; the interface is black on white with light grey behind every product picture. No decorative colour, no serif, no rounded pills. Everything helps somebody pick a look, change it and buy the pieces.

## Typography

One family: **Geist** (self-hosted with `next/font/google`, files downloaded at build time, no runtime request to Google). Fallback: system UI sans.

| Role | Size | Weight / tracking | Where |
|---|---|---|---|
| Display | `clamp(2.3rem, 1.5rem + 3vw, 3.9rem)`; phones `clamp(2rem, 1.5rem + 3vw, 2.6rem)` | 600, `-0.04em`, line-height 1.02 | Start page H1 |
| Page title | `clamp(1.9rem, 1.4rem + 1.8vw, 2.9rem)` | 600, `-0.035em` | H1 of every other page, look title |
| Section headline | `clamp(1.4rem, 1.15rem + 1vw, 2rem)` | 600, `-0.03em` | H2 |
| Card title | 16px (look), 17px (entry), 19px (start page look), 14px (product card) | 500–600 | Cards |
| Body | 17px | 400 | Running text |
| Meta, prices in lists | 12–14px | 400 meta, 600 prices | Under titles |
| Navigation | 13px uppercase, `0.06em` | 500, 600 when active | Desktop header links only |

Rules: uppercase only in the desktop navigation and the wordmark. Prices always `.num` (tabular figures) and 600 where they are the point of the line. Headlines use `text-wrap: balance`, paragraphs `pretty`.

## Colour

| Token | Value | Use |
|---|---|---|
| `--bg` | `#ffffff` | Page, sections, header, footer |
| `--bg-2` | `#f3f3f3` | Behind every product picture and collage; builder desk; secondary buttons |
| `--bg-3` | `#e8e8e8` | Hover on grey |
| `--ink` | `#111111` | Text, primary buttons, selection, badges |
| `--ink-2` | `#3a3a3a` | Secondary text |
| `--muted` | `#666666` | Meta (5.7:1 on white, 5.2:1 on `--bg-2`) |
| `--line` / `--line-strong` | `rgba(0,0,0,.1)` / `.22` | Hairlines between sections, chip outlines |
| `--danger` | `#c4231a` | Errors, «Über Budget», «Nicht gesichert»; always with text |
| Success | `#1e6b3a` | Check of a successful save, cheaper price differences |

There is no accent colour. `--accent*` tokens still exist for older rules and resolve to ink. Sections are white and divided by a hairline: grey is reserved for product imagery, so a grey section would swallow the pictures.

## Shape, spacing, rhythm

- Radius `2px` for buttons, inputs, chips, cards, collages (`--r-btn`, `--r`, `--r-lg`). Sheets and dialogs `10px` (`--r-sheet`), on phones only at the top. Circles only for icon buttons, number tags and the favourites count.
- No shadows on cards. `--shadow-2` only for floating things (dialogs, drawer).
- Base unit 4px; inside components 8/12/16px; `--space-related` (40–64px) between blocks that belong together, `--space-section` (64–104px) before a new chapter.
- Content width 1200px, gutter `clamp(20px, 4vw, 40px)`.

## Header

- Desktop: wordmark left, two uppercase links (Entdecken, Meine Looks), right: heart with count (Gemerkt), account, «Look erstellen» (hidden in the builder). Active link: 2px ink underline.
- Phones: one 56px row: menu, centred wordmark, heart, account. The menu sheet lists Entdecken, Meine Looks, Gemerkt and «Look erstellen».

## Products and looks

- Product card: picture contained on `--bg-2` (3:4, 12% padding), then name (14px/500), colour · shop (12px muted), price (14px/600). Hover: picture scales 4%, name underlined. Heart top right, outside the card button.
- Collages are 4:5 everywhere, on `--bg-2`; editorial looks use the same backdrop. Card hover underlines the title, nothing moves.
- Start page: composed hero look with its action directly below, then «Die Teile von …» as shop cards (a row to swipe on phones), entries by occasion, editorial looks (a row to swipe on phones).
- Look page: on phones a sticky bar with total, «Teile» and «Anpassen».
- Colour palette: the colour families of a look as overlapping swatches (18px on the look page with names, 11px on tiles), in shopping-list order.
- «Habe ich schon»: per piece on the look page; owned pieces fade in the list and the collage, the total becomes «Noch zu kaufen» and the buy bar follows. Stored per look in this browser.
- Demo honesty: «Demo-Preise» next to the hero total, «Beispielpreise aus dem Demo-Katalog» above the product row, demo labels in details.
- Image loading: lazy everywhere except the first-screen collage (`priority`, eager, no `fetchpriority`), per-piece `sizes`; the phone product drawer builds its grid only after opening.

## Buttons, selection, feedback

- Primary: ink fill, white text, 46px (38px small, 50px on phones where it is the main action). One per area.
- Ghost: white with a 1px ink outline. Secondary: `--bg-2` fill. Text link with chevron for navigation.
- On the look page the per-piece «Zum Shop» buttons are primary (buying is the point of that list).
- Chips: white with outline; pressed = ink fill.
- Selection on the canvas, pressed states, the «Im Look» badge and the arrival ring: ink.
- Focus: 2px ink outline, 2px offset; fields get an ink border and a soft ring.
- Feedback: inline status for lasting state, toasts (ink, square) for one-off confirmations: bottom centre on pages, bottom left in the desktop builder, under the header on phones.

## Saving model (wording is part of the design)

| State | Text |
|---|---|
| Draft written | «Entwurf in diesem Browser gesichert» (phone: «Entwurf gesichert») |
| Storage blocked | «Nicht gesichert: Browserspeicher blockiert» |
| Saved, unchanged | «Gespeichert in «Meine Looks»» / «Veröffentlicht, alles gespeichert» |
| Saved, changed | draft text plus «Noch nicht in «Meine Looks» gespeichert» |

Saving needs no sign-in: every look saved in this browser is listed under «Meine Looks». Only publishing asks for a name (demo sign-in, labelled «Anmelden & veröffentlichen»). Never promise accounts, sync or public visibility while this is the local demo.

## Builder

- Desk `--bg-2`, panels white with a hairline, canvas with a hairline.
- Desktop: bar (title, status with a one-line explanation, save actions), three columns (products 300px, canvas, side panel 280px), canvas plus one-row toolbar fit 1440×900; side panel order Budget, selected piece, pieces, details.
- Phones: compact bar (title and status, undo, redo, «Speichern» opens the save sheet), sticky dock (selection tools or Anordnen/Leeren, plus «Produkte» and the budget bar). The product drawer is modal (inert background, Escape, focus return) and does not open the keyboard on touch screens.
- Saving suggestion and replace sheet judge alternatives by the change of the whole look total («Look −60.00»); duplicates are swapped together.
- Direct manipulation (`gesture.ts`): during a drag, scale or rotate only the piece's `transform` and the selection frame are written, once per animation frame; layout is measured once at the start; React state changes once at the end (one undo step). Touch: a second finger anywhere on the canvas turns the drag into a pinch (distance scales, angle rotates, midpoint moves). Trackpad pinch (ctrl + wheel) scales the selected piece, committed 200 ms after the last wheel event. Centre lines snap within 7 px with a 1px guide at 45 % ink and a 6 ms vibration where supported; rotation snaps within 4° to multiples of 45°.
- «Als Bild»: PNG 1080 × 1470 (4:5 collage plus a white strip with title, total «Beispielpreise» and KOLLAGE); system share sheet on touch devices, download elsewhere.
- Desktop canvas toolbar: undo and redo as icons with tooltips, then Anordnen, Leeren, Mischen. «Als Bild» sits next to «Speichern».
- «Mischen» swaps the selected piece (or a random one) for another product of the same kind that is not yet in the look; one undo step brings it back.

## Motion

Curves: `--ease-out-strong: cubic-bezier(.23,1,.32,1)` for entering and feedback, `--ease-drawer: cubic-bezier(.32,.72,0,1)` for sheets and the product drawer, light spring `cubic-bezier(.34,1.56,.64,1)` only for picking up a piece. Only `transform`/`translate`/`scale` and `opacity` are animated. Nothing animates on keyboard actions. `prefers-reduced-motion: reduce` turns movement off (the global rule shortens everything; reveal and entrance rules only exist under `no-preference`).

| Event | Motion | Duration |
|---|---|---|
| Press on buttons, chips, cards, tools | `scale: 0.97` | 160ms |
| Start page load | headline and text rise 12px, outfit pieces laid down one by one (70ms apart), plate and steps follow | 620–640ms, total under 1.2s |
| Scrolling | cards, rows and section heads rise in as they enter the viewport (CSS `animation-timeline: view()`, siblings slightly offset); without browser support content is simply there | tied to scroll |
| Pictures loading after the page is ready | fade in (GarmentArt marks them `is-pending`) | 360ms |
| Sheet / dialog | phones: slide up from the bottom; desktop: scale from 0.96 with fade; backdrop fades | 420ms / 240ms |
| Toast | rises 14px from 0.97 | 320ms |
| Heart on remember | pop 0.7 → 1.28 → 1, only after a tap | 420ms |
| Palette swatches (look page) | rise one after another | 420ms, 50ms apart |
| «Habe ich schon» | row and collage piece fade to 40 % / 22 %, total ticks | 260–320ms |
| Builder | pick-up spring, settle, arrive ring, swap cross-fade, selection frame, price delta (see Builder) | 140–700ms |
| Dragging | none: the piece follows the pointer directly | – |

## Measuring

`src/lib/track.ts` sends funnel events to `window.dataLayer` (no provider wired in yet): landing (with `?von=` / `utm_source`), look_viewed, builder_loaded, first_edit, look_saved, look_published, look_shared, shop_clicked. No personal data.
