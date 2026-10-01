"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openLogin, useToasts } from "@/lib/events";
import { signOut, useSession } from "@/lib/store";
import { Icon } from "./Icon";

const NAV = [
  { href: "/entdecken", label: "Entdecken" },
  { href: "/meine-looks", label: "Meine Looks" },
];

export function SiteHeader() {
  const path = usePathname();
  const session = useSession();
  const inBuilder = path.startsWith("/builder");
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href="/" className="wordmark" aria-label="Kollage, zur Startseite">
          Kollage
        </Link>
        <nav className="nav__links" aria-label="Hauptnavigation">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className="nav__link" aria-current={active ? "page" : undefined}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="nav__end">
          {session ? (
            <button type="button" className="nav__account" onClick={signOut} title={`Angemeldet als ${session.name}. Abmelden`}>
              <Icon name="user" size={18} />
              <span className="nav__account-name">{session.name}</span>
              <span className="sr-only">, abmelden</span>
            </button>
          ) : (
            <button type="button" className="nav__account" onClick={openLogin} aria-label="Anmelden">
              <Icon name="user" size={18} />
              <span className="nav__account-name">Anmelden</span>
            </button>
          )}
          {!inBuilder && (
            <Link href="/builder" className="btn btn--primary btn--sm nav__cta">
              Look erstellen
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__note">
          Links zu Händlern sind Partnerlinks. Bei bestätigten Käufen erhält Kollage eine Provision. Bestellung, Zahlung und Versand laufen über den Händler.
        </p>
        <p className="footer__note">MVP mit Demo-Katalog: Artikel, Shops und Preise sind Beispiele. Die Produktbilder sind KI-generierte Demo-Renderings (Higgsfield), keine angebotenen Artikel.</p>
        <div className="footer__bottom">
          <span>Kollage · Schweiz · Preise in CHF</span>
          <nav className="footer__links" aria-label="Rechtliches">
            <Link href="/hinweise">Hinweise &amp; Affiliate-Offenlegung</Link>
            <Link href="/hinweise#datenschutz">Datenschutz (Entwurf)</Link>
            <Link href="/hinweise#impressum">Impressum (Entwurf)</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function Toaster() {
  const toasts = useToasts();
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <p key={t.id} className="toast">
          <Icon name="check" size={18} /> {t.text}
        </p>
      ))}
    </div>
  );
}
