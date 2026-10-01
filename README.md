# Kollage (Arbeitstitel)

Responsive Fashion-Website: Outfits als Collage zusammenstellen, veröffentlichte Looks ansehen, jedes Teil beim Händler kaufen (Affiliate). Startmarkt Schweiz, Deutsch (de-CH), CHF.

Gestaltung: hell und reduziert (Weiss, `#F5F5F7`, Text `#1D1D1F`, Akzent `#0071E3`), Systemschrift, 12–18 px Rundungen. Designsystem in `src/app/globals.css`.

## Starten

```bash
npm install
npm run dev        # http://localhost:3100
npm test           # Unit-Tests (Collage-Logik, Share-Links, Katalog, CHF-Format)
node scripts/e2e.mjs   # End-to-End-Smoke-Test gegen den laufenden Dev-Server (braucht Chrome oder Edge)
```

## Seiten

| Route | Inhalt |
|---|---|
| `/` | Startseite: Idee, Beispiel-Look mit Preisschildern, Ablauf, Looks, Affiliate-Erklärung |
| `/entdecken` | Veröffentlichte Looks, Suche, Anlass, Budget, Sortierung (Filter in der URL) |
| `/builder` | Outfit-Builder: Galerie (Suche, Kategorie, Farbe, Preis), Leinwand, Teile-Liste, Details |
| `/look/[id]` | Outfit-Seite: Collage mit nummerierten Teilen, Shop, Lieferung CH, Preis, «Zum Shop» |
| `/look/geteilt?d=…` | Geteilter Look, komplett im Link kodiert (funktioniert ohne Backend auf jedem Gerät) |
| `/meine-looks` | Gespeicherte Looks: bearbeiten, veröffentlichen/zurückziehen, duplizieren, löschen |
| `/weiter/[offerId]` | Affiliate-Ausgang: echte Angebote leiten mit Sub-ID weiter, Demo-Angebote erklären den Ablauf |
| `/hinweise` | Affiliate-Offenlegung, Demo-Hinweis, Datenschutz- und Impressum-Entwürfe |

## Builder-Funktionen

- Teil antippen oder in die Leinwand ziehen (Desktop), Ablage in Moodboard-Zonen je Kategorie. Auf Mobile öffnet «Produkte hinzufügen» eine ausziehbare Produktauswahl.
- Verschieben (Maus/Finger), Grösse über Eckgriff, Drehen über Griff oben (rastet bei 45° ein).
- Werkzeugleiste: kleiner, grösser, drehen, Ebene vor/zurück, duplizieren, entfernen.
- Tastatur: Pfeile (mit Umschalt grosse Schritte), `+`/`-`, `r`/`R`, Bild-auf/-ab, Entf, `Strg+Z`/`Strg+Y`.
- «Anordnen» legt alles automatisch als Moodboard aus. Rückgängig/Wiederholen für jeden Schritt.
- Hintergrund (Weiss, Hellgrau, Sand, Salbei, Stein), Anlass, Notiz.
- Entwurf wird laufend im Browser gesichert. Anmeldung erst bei «Speichern» oder «Veröffentlichen»; der Entwurf bleibt dabei erhalten, die Aktion läuft nach der Anmeldung weiter.

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
3. Klick-Tracking und Provisionsabgleich je Look.
4. Higgsfield autorisieren und Editorial-Bilder/Video gemäss Prompt-Datei erzeugen (als KI-Stimmungsbild gekennzeichnet).
5. Rechtstexte prüfen lassen, Markenname festlegen.
6. Später: DACH (EUR, weitere Lieferländer), virtuelle Anprobe.
