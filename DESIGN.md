# Kollage design system

Status: as built (October 2026). Source of truth for values is `src/app/globals.css`; this file records the decisions and the rules for using them. Change both together.

## Character

Bright, quiet, precise. The garments bring the colour; the interface stays ink on white. Two voices:

- **Editorial voice** (serif): look names, page titles, styling tips. Speaks about fashion.
- **Tool voice** (sans): everything you operate, read as data or compare. Prices, buttons, labels, the builder.

Editorial pages (start, Entdecken, look page, Gemerkt, Meine Looks) use both voices. The builder is a workspace and uses only the tool voice; the look title there is an input, not a headline.

## Typography

| Role | Font | Size | Weight / spacing | Where |
|---|---|---|---|---|
| Display | Instrument Serif (`--serif`) | `clamp(3rem, 1.8rem + 4.4vw, 5.4rem)`; phones `clamp(2.9rem, 2rem + 4vw, 3.6rem)` | 400, `-0.015em`, line-height 0.98 | Start page H1 only |
| Page title | Instrument Serif | `clamp(2.6rem, 1.9rem + 2.4vw, 3.9rem)` | 400, `-0.01em`, 1.02 | H1 of every editorial page |
| Look title (look page) | Instrument Serif | `clamp(2.8rem, 2rem + 2.6vw, 4.2rem)` | 400 | Look page H1 |
| Look name in lists | Instrument Serif | tiles 25px, entries 27px (23px phones), start page plate 26px | 400 | Tiles, entries, featured look |
| Styling tip | Instrument Serif italic | 18px (tiles), 20px (look page) | 400, line-height 1.35 | Always behind a 2px poppy rule |
| Section headline | System sans (`--font`) | `clamp(1.75rem, 1.25rem + 1.8vw, 2.75rem)` | 600, `-0.022em` | H2 such as «Wofür ziehst du dich an?» |
| Body | System sans | 17px | 400 | Running text |
| UI label, meta | System sans | 13–15px | 400–600 | Buttons, chips, meta lines, prices |
| Overline | System sans | 12px | 600, `0.06em`, uppercase | Only «Styling-Tipp:» label |

Rules:
- Serif is never bold and never used in controls, prices or numbers.
- Prices always use `.num` (tabular figures) in the sans.
- The serif is self-hosted through `next/font/google` (downloaded at build time, served from this site, no runtime request to Google). Fallback: Iowan Old Style, Palatino, Georgia.

## Colour

| Token | Value | Use |
|---|---|---|
| `--bg` | `#ffffff` | Page |
| `--bg-2` | `#f5f5f7` | Tinted sections, secondary buttons, panels on the builder desk |
| `--bg-3` | `#ebebef` | Hover of tinted surfaces |
| `--ink` | `#1d1d1f` | Text, primary buttons, selection |
| `--ink-2` | `#424245` | Secondary text |
| `--muted` | `#626267` | Meta, hints (4.5:1 on white and on `--bg-2`) |
| `--line` / `--line-strong` | `rgba(0,0,0,.08)` / `.16` | Hairlines, outlines of chips and collages |
| `--accent` (poppy) | `#d6402b` | Brand marker, see rules |
| `--accent-strong` | `#b23420` | Poppy as text on white |
| `--danger` | `#c4231a` | Errors, over budget, failed saving |
| Success | `#1e6b3a` | Check icon of a successful save, cheaper price differences |

Poppy (accent) rules: it marks **what is yours or what is new**, never status.
- Allowed: wordmark mark, filled heart (gemerkt), the rule beside styling tips, the ring around a piece that just landed on the canvas, the «Im Look» badge, the fact icons.
- Not allowed: buttons, links, selection frames, warnings. Warnings and errors use `--danger` and always carry text («Über Budget», «Nicht gesichert»), never colour alone.
- Selection is always ink: canvas frame and handles, pressed chips, selected rows.

## Spacing and rhythm

- Base unit 4px. Inside components 8 / 12 / 16px. Between a heading and its content 24–40px.
- `--space-related: clamp(40px, 5vw, 64px)` between blocks that belong together (hero and «Wofür ziehst du dich an?»).
- `--space-section: clamp(64px, 8vw, 104px)` before a new chapter. A new chapter also changes surface (white to `--bg-2`), so the tint does the separating, not extra white space.
- Content width `--max: 1200px`, side gutter `--gutter: clamp(20px, 4vw, 40px)`.
- Start page hero: the copy column is vertically centred against the outfit; the outfit and its main action fit the first screen at 1440×900, 390×844 and 360×780 (collage width derived from `100svh`).

## Product and look presentation

- A collage is always 4:5 (`1000 × 1250` canvas units) in every context. Never crop or squeeze it; `object-fit: contain` for every garment.
- Editorial looks use the light grey backdrop `kreide` so lists look calm; people can still choose other backdrops for their own looks.
- Editorial looks are composed, not scattered: pieces slightly larger and pulled towards the centre (`tighten()` in `seed-looks.ts`), the start page look is set by hand (`layout`).
- In lists the collage itself is the card: radius 18px, 1px hairline, no extra card background. Text sits free below it. Hover lifts the collage 3px with `--shadow-2`.
- Piece numbers follow the shopping list: tops, bottoms, shoes, bags, accessories; the number sits on the garment (upper middle), so it is never hidden by an overlapping piece.
- Start page: no numbers at rest. Pointing at or focusing a piece shows a dark label with name and price; tap or Enter opens price and shop.
- Product thumbnails: contained image on `--bg-2`, radius 12–14px.

## Buttons, selection, feedback

- Pill buttons, radius 980px. Heights: 44px default, 36px small, 50px large/phone.
- **Primary** (ink fill, white text): one per area, for the main next step (Diesen Look anpassen, Veröffentlichen, Zum Shop in the product sheet).
- **Secondary** (`--bg-2` fill): repeated actions in lists (Zum Shop rows on the look page, Teilen, Merken).
- **Ghost/outline** (white with hairline): alternatives next to a primary on tinted surfaces (Anmelden & speichern).
- **Text link with chevron**: navigation to more (Alle Looks, Zum Look, Mit leerer Leinwand starten).
- Actions that need sign-in say so in the label: «Anmelden & speichern», «Anmelden & veröffentlichen».
- Focus: 2px ink outline, 2px offset, never removed. Text fields instead get an ink border plus a 4px soft ink ring.
- Feedback channels: inline status text for lasting state (save status, budget), toasts for one-off confirmations. Toasts sit bottom centre on editorial pages, bottom left in the desktop builder, below the bar on phones, so they never cover tools.

## Saving model (wording is part of the design)

| State | Shown text | Meaning |
|---|---|---|
| Draft, written | «Entwurf in diesem Browser gesichert» (phone: «Entwurf gesichert») | Autosave succeeded in localStorage |
| Draft, storage blocked | «Nicht gesichert: Browserspeicher blockiert» | Write failed; changes live until the tab closes |
| Empty canvas | «Leere Leinwand» | Nothing to save |
| Saved look, unchanged | «Gespeichert in «Meine Looks»» / «Veröffentlicht, alles gespeichert» | Matches the saved look |
| Saved look, changed | draft text plus «Noch nicht in «Meine Looks» gespeichert» / «Änderungen sind noch nicht veröffentlicht» | |

Never promise accounts, sync or public visibility while sign-in is the local demo: say «Demo-Anmeldung», «nur in diesem Browser».

## Builder

- Desk background: `--bg-2` with a 20px dot grid. Panels white, radius 18px.
- Desktop (≥1024px): bar (title, status with one-line explanation, two save actions), three columns (products 300px, canvas, side panel 280px). The canvas plus its one-row toolbar fit 1440×900. Side panel order: Budget, selected piece, pieces, look details.
- Phone (<1024px): one compact bar (title and status as a button, undo, redo, «Speichern») opens the «Look speichern» sheet with title, save, publish and look details. A sticky dock under the canvas holds the selection tools (Ersetzen, Merken, Drehen, Entfernen, Mehr) or, with nothing selected, Anordnen and Leeren, plus «Produkte» and the budget bar.
- The product drawer does not focus the search field on touch screens (the keyboard would cover the products).

## Motion

Short, quiet, and only where it explains a change. `--ease: cubic-bezier(.25,.1,.25,1)`, `--ease-out: cubic-bezier(.22,1,.36,1)`.

| Event | Motion | Duration |
|---|---|---|
| Piece added | piece fades and grows in from 88%, poppy ring fades out around it; pieces added while the phone drawer was open animate when it closes | 300ms / ring 700ms |
| Piece replaced | old product fades out (grows to 105%), new one fades in from 94% in the same place | 260–320ms |
| Selection | frame fades in from 97% | 140ms |
| Price change | value settles; difference chip (green when cheaper) stays, then fades | 260ms / 1.8s |
| Hover on collages | lift 3px with shadow | 220ms |
| Dragging | none: the piece follows the pointer directly | – |

`prefers-reduced-motion: reduce` sets all animations and transitions to near zero (global rule). No layout properties are animated.
