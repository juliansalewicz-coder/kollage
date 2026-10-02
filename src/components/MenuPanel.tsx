"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSeedLook, STYLE_ENTRIES } from "@/lib/seed-looks";
import { Icon } from "./Icon";
import { LookWindow } from "./LookWindow";

interface NavLink {
  href: string;
  label: string;
  count?: number;
}

const CLOSE_MS = 280;

/**
 * Phone and tablet navigation: a full-height panel that slides in from the left like a store app.
 * Large links first, then the occasions as small collages, the main action pinned at the bottom.
 * Native <dialog>: focus stays inside, Escape closes, focus returns to the menu button.
 */
export function MenuPanel({ open, onClose, links, isActive }: { open: boolean; onClose: () => void; links: NavLink[]; isActive: (href: string) => boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && dlg.open) {
      // Reopened while the panel was still sliding out: slide it back in instead of leaving an empty modal.
      setClosing(false);
    } else if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      setClosing(false);
      dlg.showModal();
      document.documentElement.classList.add("menu-open");
    } else if (!open && dlg.open) {
      // Let the panel slide out before the dialog disappears.
      setClosing(true);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const t = window.setTimeout(
        () => {
          dlg.close();
          setClosing(false);
          document.documentElement.classList.remove("menu-open");
          opener.current?.focus({ preventScroll: true });
        },
        reduce ? 0 : CLOSE_MS,
      );
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => () => document.documentElement.classList.remove("menu-open"), []);

  /* Rotating a tablet or widening the window to the desktop header closes the menu. */
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => mq.matches && onClose();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, onClose]);

  return (
    <dialog
      ref={ref}
      className={`menu ${closing ? "is-closing" : ""}`}
      aria-label="Menü"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open || closing ? (
        <div className="menu__panel">
          <div className="menu__head">
            <button type="button" className="menu__close" onClick={onClose} aria-label="Menü schliessen">
              <Icon name="close" size={22} />
            </button>
            <span className="menu__brand">Kollage</span>
          </div>

          <nav aria-label="Hauptnavigation mobil">
            <ul className="menu__links">
              {links.map((n, i) => (
                <li key={n.href} style={{ ["--i" as string]: i }}>
                  <Link href={n.href} className="menu__link" aria-current={isActive(n.href) ? "page" : undefined} onClick={onClose}>
                    <span>{n.label}</span>
                    {n.count ? <span className="menu__count num">{n.count}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className="menu__section" aria-labelledby="menu-occasions" style={{ ["--i" as string]: links.length }}>
            <h2 id="menu-occasions" className="menu__eyebrow">
              Nach Anlass
            </h2>
            <ul className="menu__tiles">
              {STYLE_ENTRIES.map((e) => {
                const look = getSeedLook(e.cover);
                return (
                  <li key={e.id}>
                    <Link href={e.href} className="menu__tile" onClick={onClose}>
                      {look && <LookWindow items={look.items} backdrop={look.backdrop} frame="thin" width={{ phoneVw: 40, px: 160 }} />}
                      <span>{e.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="menu__foot">
            <Link href="/builder" className="btn btn--primary menu__cta" onClick={onClose}>
              Look erstellen <Icon name="chevronRight" size={16} />
            </Link>
            <p className="menu__note">Preise in CHF · Lieferung in die Schweiz · Demo-Katalog</p>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
