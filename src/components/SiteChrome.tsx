"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openLogin, useToasts } from "@/lib/events";
import { useCallback, useEffect, useState } from "react";
import { getProduct } from "@/lib/catalog";
import { getSeedLook } from "@/lib/seed-looks";
import { probeStorage, useFavorites, useLooks, useSession, useStorageStatus } from "@/lib/store";
import { AccountMenu } from "./AccountMenu";
import { Icon } from "./Icon";
import { MenuPanel } from "./MenuPanel";
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
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const inBuilder = path.startsWith("/builder");
  const looks = useLooks();
  // Count what «Gemerkt» can actually show: a deleted look or a product gone from the catalog is not counted.
  const favCount =
    favs.products.filter((id) => getProduct(id)).length + favs.looks.filter((id) => getSeedLook(id) || looks.some((l) => l.id === id)).length;
  useEffect(() => setMenuOpen(false), [path]);
  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <header className="nav">
      <div className="nav__inner">
        <button type="button" className="nav__icon nav__menu" onClick={() => setMenuOpen(true)} aria-label="Menü öffnen" aria-haspopup="dialog" aria-expanded={menuOpen}>
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
            <AccountMenu session={session} />
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
      <MenuPanel
        open={menuOpen}
        onClose={closeMenu}
        isActive={isActive}
        links={[...NAV, { href: "/gemerkt", label: "Gemerkt", count: favCount }]}
      />
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
