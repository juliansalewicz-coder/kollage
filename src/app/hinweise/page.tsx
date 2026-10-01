import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hinweise & Affiliate-Offenlegung" };

export default function NoticesPage() {
  return (
    <div className="page wrap prose">
      <h1 className="page__title">Hinweise</h1>

      <section aria-labelledby="affiliate">
        <h2 id="affiliate">Affiliate-Offenlegung</h2>
        <p>
          Kollage verlinkt Kleidungsstücke bei Online-Händlern. Diese Links sind Partnerlinks (Affiliate-Links). Kaufst du über einen solchen Link und der
          Händler bestätigt den Kauf, erhält Kollage eine Provision. Bestellung, Bezahlung, Versand, Rückgabe und Kundendienst laufen ausschliesslich über
          den Händler.
        </p>
        <p>Partnerlinks erkennst du an der Schaltfläche «Zum Shop» und an diesem Hinweis bei jeder Teileliste.</p>
      </section>

      <section aria-labelledby="demo">
        <h2 id="demo">Demo-Katalog in diesem MVP</h2>
        <p>
          Alle Artikel, Shops («Demo-Shop Limmat», «Demo-Shop Aare», «Demo-Shop Rhone»), Preise und Lieferangaben sind erfundene Beispiele. Die
          Produktbilder sind KI-generierte Demo-Renderings (erstellt mit Higgsfield) und zeigen keine tatsächlich angebotenen Artikel. Echte Angebote
          werden mit authentischen Händlerbildern und passenden Nutzungsrechten angezeigt.
        </p>
      </section>

      <section aria-labelledby="datenschutz" id="datenschutz">
        <h2>Datenschutz</h2>
        <p className="draft-note">Entwurf, rechtliche Prüfung nötig. Nicht als endgültige Datenschutzerklärung verwenden.</p>
        <p>
          Im MVP speichert Kollage Entwürfe, Looks sowie Name und E-Mail der Demo-Anmeldung nur im lokalen Speicher deines Browsers (localStorage). Es
          werden keine Daten an einen Server übertragen. Geteilte Links enthalten nur Titel, Anlass, Hintergrund und die Positionen der Teile.
        </p>
      </section>

      <section aria-labelledby="impressum" id="impressum">
        <h2>Impressum</h2>
        <p className="draft-note">Platzhalter. Betreiberangaben fehlen noch.</p>
        <p>[Name des Betreibers], [Adresse], [Kontakt-E-Mail]</p>
      </section>
    </div>
  );
}
