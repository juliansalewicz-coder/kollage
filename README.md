# Kollage (Arbeitstitel)

Responsive Fashion-Website: Outfits als Collage zusammenstellen, veröffentlichte Looks ansehen, jedes Teil beim Händler kaufen (Affiliate). Startmarkt Schweiz, Deutsch (de-CH), CHF.

Gestaltung: «Clean Shop», neutral wie ein Modegeschäft: Geist-Schrift, Schwarz auf Weiss, Produktbilder auf Hellgrau, eckige Bedienelemente. Regeln und Werte: [DESIGN.md](DESIGN.md).

## Starten

```bash
npm install
npm run dev        # http://localhost:3100
npm test           # Unit-Tests (Collage, Budget, Speicher, Datenprüfung, Share-Links, Katalog)
node scripts/e2e.mjs   # Browser-Szenarien gegen den laufenden Dev-Server (braucht Chrome oder Edge); Laufzeitfehler lassen ein Szenario scheitern
node scripts/perf.mjs http://localhost:3200   # Labormessung gedrosseltes Handy gegen einen Produktions-Build
```

## Seiten

| Route | Inhalt |
|---|---|
| `/` | Startseite: komponierter Look mit direkter Aktion, drei Schritte, Einstiege nach Anlass, Redaktions-Looks |
| `/entdecken` | Veröffentlichte Looks, Suche, Anlass; Budget und Sortierung hinter «Filter» auf dem Handy (Filter in der URL) |
| `/builder` | Outfit-Builder: Galerie (Suche, Kategorie, Farbe, Preis), Leinwand, Teile-Liste, Details |
| `/look/[id]` | Outfit-Seite: Collage mit nummerierten Teilen, Shop, Lieferung CH, Preis, «Zum Shop» |
| `/look/geteilt?d=…` | Geteilter Look, komplett im Link kodiert (funktioniert ohne Backend auf jedem Gerät) |
| `/meine-looks` | Gespeicherte Looks: bearbeiten, veröffentlichen (gleiche Regeln wie im Builder) oder zurückziehen, duplizieren, löschen |
| `/gemerkt` | Gemerkte Produkte und Looks; der Zähler im Kopf zählt nur, was noch existiert |
| `/weiter/[offerId]` | Affiliate-Ausgang: echte Angebote leiten mit Sub-ID weiter, Demo-Angebote erklären den Ablauf |
| `/hinweise` | Affiliate-Offenlegung, Demo-Hinweis, Datenschutz- und Impressum-Entwürfe |

## Stand (Oktober 2026)

- **Speichern ohne Konto:** Der Entwurf wird laufend im Browser gesichert. «Speichern» legt den Look ohne Anmeldung in «Meine Looks» ab. Nur «Veröffentlichen» fragt nach Name und E-Mail (Demo-Anmeldung); der Entwurf bleibt dabei erhalten.
- **Eine Veröffentlichungsregel** für Builder und «Meine Looks» (`src/lib/publish.ts`): echter Titel und mindestens zwei verschiedene Teile. Ein unvollständiger Look aus «Meine Looks» öffnet sich im Builder, dort steht, was fehlt.
- **Kleiderschrank:** «Habe ich schon» gilt für alle Looks in diesem Browser. Die Look-Seite und der Builder zeigen «Look-Wert» und «Noch zu kaufen»; das Budget vergleicht mit dem, was noch zu kaufen ist.
- **Builder:** Teil ersetzen (mit Wirkung auf den Gesamtpreis), «Variante» für das gewählte Teil bzw. «Zufällig tauschen» ohne Auswahl, Favoriten, Budget mit Sparvorschlag, «Als Bild» (PNG 1080 × 1350, 4:5, mit Titel und Preis). Auf dem Handy: «Dein Look»-Sheet mit «Speichern & schliessen».
- **Fehlerfälle:** Ein Produktbild, das nicht lädt, wird durch die gezeichnete Silhouette in seiner Farbe ersetzt. Ein abgebrochenes Teilen bleibt ruhig und zählt nicht als geteilt. Galerie und Produktsheet folgen dem Breakpoint auch beim Drehen oder Verbreitern ohne Neuladen.

Tests: `npm test` (42 Unit-Tests), `node scripts/e2e.mjs` (Browser-Szenarien bei 360, 390, 768, 800, 1100 und 1440 px; einzelne Gruppen mit `ONLY=r8`).
Produktions-Build neben laufendem Dev-Server: `NEXT_DIST_DIR=.next-build npx next build`.

Messung (2.10.2026, `scripts/perf.mjs`, Produktions-Build lokal, 390 px, DPR 3, 1,6 Mbit/s, CPU ×4): Bilder Startseite 912 → 730 KB, Look-Seite 567 → 428 KB (Kauflisten-Thumbnails und Produktkarten laden die 360-px-Variante). Builder: Der Server schickt den gewählten Beispiel-Look schon mit dem HTML, LCP 4,3–5,8 s → 2,0–2,9 s in vier von fünf Läufen (ein Ausreisser 4,6 s), Outfit nach 3 s sichtbar statt leer. Layoutverschiebung überall 0. Laborwerte auf einem verrauschten Rechner, keine Feldwerte.

## Messen, Vorschau, Export

- **Ereignisse zentral:** `src/lib/track.ts` schickt jeden Schritt per `sendBeacon` an `/api/events` (`src/app/api/events/route.ts`). Der Server schreibt pro Ereignis eine Zeile `kollage-event {…}` ins Protokoll des Hostings, nur bekannte Ereignisse und Felder, eigene Looks als «eigen» (keine Titel, Namen, E-Mails). Auswertung eines Log-Exports: `node scripts/funnel.mjs export.log`. Abschalten: `NEXT_PUBLIC_EVENTS=off`.
- **Link-Vorschau:** `/og?look=<id>` bzw. `/og?d=<code>` erzeugt ein 1200 × 630-Bild mit Collage, Titel, Teilen und Preis. Beispiel-Looks und geteilte eigene Looks setzen es als `og:image`. Die Bilder nutzen PNG-Kopien in `public/products/og` (`python scripts/og-pngs.py` nach neuen Renderings), weil der Renderer kein WebP liest. Für absolute Adressen `NEXT_PUBLIC_SITE_URL` setzen (auf Vercel automatisch).
- **Bildexport mit Händlerbildern:** fremde Bilder werden mit `crossOrigin="anonymous"` geladen; liefert der Händler keinen CORS-Header, fehlt dieses Teil im PNG statt dass der Export abbricht, und ein gesperrter Canvas meldet sich verständlich.

## Bedienung im Builder

- Teil antippen oder in die Leinwand ziehen (Desktop); auf dem Handy öffnet «Produkte» die Produktauswahl als Sheet.
- Verschieben mit Maus oder Finger, Grösse über den Eckgriff, Drehen über den Griff oben (rastet bei 45° ein), zwei Finger zoomen und drehen, Trackpad-Pinch skaliert, die Mitte rastet mit Hilfslinie ein. Ein Undo-Schritt pro Geste.
- Werkzeuge am gewählten Teil: Ersetzen, Merken, Variante, Entfernen, Mehr (Grösse, Drehung, Ebene, Duplizieren, «Habe ich schon»).
- Tastatur: Pfeile (mit Umschalt grosse Schritte), `+`/`-`, `r`/`R`, Bild-auf/-ab, Entf, `Strg+Z`/`Strg+Y`.
- «Anordnen» legt alles als Moodboard aus. Hintergrund, Anlass und Notiz unter «Look-Details».

## Annahmen und Grenzen des MVP

- **Kein Backend.** Looks, Entwurf und Demo-Anmeldung liegen im `localStorage` (`src/lib/store.ts`). Eigene veröffentlichte Looks sind in «Entdecken» nur im selben Browser sichtbar; zum Teilen dient der Link aus «Teilen».
- **Demo-Anmeldung** ohne Passwort, ohne Konto, ohne E-Mail-Versand (`src/components/AuthDialog.tsx`).
- **Demo-Katalog** (`src/lib/catalog.ts`): 40 Artikel, 3 erfundene Shops, Beispielpreise. Kein Angebot hat einen Affiliate-Link.
- **Produktbilder**: KI-generierte Demo-Renderings aus Higgsfield (`public/products/`, freigestellt mit `scripts/cutout.py`), als Demo gekennzeichnet. SVG-Illustrationen (`src/lib/garments.ts`) dienen nur noch als Rückfall.
- **8 Beispiel-Looks** (`src/lib/seed-looks.ts`), gekennzeichnet als «Beispiel-Look · Demo-Katalog».
- **Higgsfield** (Free-Plan, 10 Credits): erzeugt wurden 1 Startseiten-Referenz und 40 Produkt-Renderings, dazu Hintergrundentfernung für schwierige Fälle. Details, Prompts und Job-IDs in [docs/higgsfield-prompts.md](docs/higgsfield-prompts.md).
- Rechtstexte (Datenschutz, Impressum) sind Entwürfe bzw. Platzhalter.
- Kein Referenzbild in der Sitzung vorhanden; umgesetzt nach der Beschreibung (freigestellte Produkte auf heller Fläche).

## Nächste Schritte

1. Affiliate-Netzwerke und Händler mit Lieferung in die Schweiz auswählen, Produkt-Feeds anbinden (`Product.image.type = "retailer"` und `Offer.affiliateUrl` sind vorgesehen; `/weiter/[offerId]` leitet dann mit `subid` weiter).
2. Backend + echte Anmeldung (z. B. Magic Link): `src/lib/store.ts` ersetzen, Looks serverseitig speichern, öffentliche Look-URLs für alle.
3. Öffentlich hosten (z. B. Vercel), dann Ereignisse im Hosting-Log auswerten; Provisionsabgleich je Look.
4. Higgsfield autorisieren und Editorial-Bilder/Video gemäss Prompt-Datei erzeugen (als KI-Stimmungsbild gekennzeichnet).
5. Rechtstexte prüfen lassen, Markenname festlegen.
6. Später: DACH (EUR, weitere Lieferländer), virtuelle Anprobe.
