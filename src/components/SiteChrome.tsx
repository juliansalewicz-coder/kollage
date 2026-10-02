"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openLogin, useToasts } from "@/lib/events";
import { useEffect, useState } from "react";
import { probeStorage, signOut, useFavorites, useSession, useStorageStatus } from "@/lib/store";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { Wordmark } from "./Wordmark";

const NAV = [
  { href: "/entdecken", label: "Entdecken" },
  { href: "/meine-looks", label: "Meine Looks" },
];

/**
 * Shop header. Desktop: name, two text links, then icons (Gemerkt, account) and «Look erstellen».
 * Phones: one row (menu, name, Gemerkt, account); the links live in the menu sheet.
 */
export function SiteHeader() {
  const path = usePathname();
  const session = useSession();
  const favs = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const inBuilder = path.startsWith("/builder");
  const favCount = favs.products.length + favs.looks.length;
  useEffect(() => setMenuOpen(false), [path]);
  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <header className="nav">
      <div className="nav__inner">
        <button type="button" className="nav__icon nav__menu" onClick={() => setMenuOpen(true)} aria-label="Menü" aria-haspopup="dialog">
          <Icon name="menu" size={22} />
        </button>
        <Link href="/" className="nav__brand" aria-label="Kollage, zur Startseite">
          <Wordmark />
        </Link>
        <nav className="nav__links" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav__link" aria-current={isActive(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="nav__end">
          <Link href="/gemerkt" className="nav__icon" aria-current={isActive("/gemerkt") ? "page" : undefined} aria-label={`Gemerkt${favCount ? `, ${favCount}` : ""}`}>
            <Icon name="heart" size={20} />
            {favCount > 0 && (
              <span className="nav__badge num" aria-hidden="true">
                {favCount}
              </span>
            )}
          </Link>
          {session ? (
            <button type="button" className="nav__icon nav__account" onClick={signOut} title={`Angemeldet als ${session.name}. Abmelden`}>
              <Icon name="user" size={20} />
              <span className="nav__account-name">{session.name}</span>
              <span className="sr-only">, abmelden</span>
            </button>
          ) : (
            <button type="button" className="nav__icon nav__account" onClick={openLogin} aria-label="Anmelden">
              <Icon name="user" size={20} />
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
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menü" className="sheet--menu">
        <nav aria-label="Hauptnavigation mobil">
          <ul className="menu-list">
            {[...NAV, { href: "/gemerkt", label: `Gemerkt${favCount ? ` (${favCount})` : ""}` }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="menu-list__link" aria-current={isActive(n.href) ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                  {n.label} <Icon name="chevronRight" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/builder" className="btn btn--primary menu-cta" onClick={() => setMenuOpen(false)}>
          Look erstellen
        </Link>
      </Sheet>
    </header>
  );
}

/** Visible whenever the browser blocks storage, so nobody believes their work is saved. */
export function StorageNotice() {
  const status = useStorageStatus();
  useEffect(() => {
    probeStorage();
  }, []);
  if (status !== "sitzung") return null;
  return (
    <p className="storage-notice" role="status">
      <Icon name="lock" size={16} /> Dein Browser blockiert den Speicher. Entwürfe, Looks und Gemerktes bleiben nur, bis du diesen Tab schliesst.
    </p>
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
          <span className="footer__brand">
            <Wordmark size={13} /> Schweiz · Preise in CHF
          </span>
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
