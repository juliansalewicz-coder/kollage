"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/store";
import type { Session } from "@/lib/types";
import { toast } from "@/lib/events";
import { Icon } from "./Icon";

/**
 * Signed-in header icon: opens a small menu (who is signed in, «Meine Looks», «Abmelden»)
 * instead of signing out on the first tap. Escape and a tap outside close it.
 */
export function AccountMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="account" ref={root}>
      <button
        ref={button}
        type="button"
        className="nav__icon nav__account"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={`Konto: ${session.name}`}
      >
        <Icon name="user" size={20} />
        <span className="nav__account-name" aria-hidden="true">
          {session.name}
        </span>
      </button>
      {open && (
        <div id="account-menu" className="account__menu">
          <p className="account__who">
            <strong>{session.name}</strong>
            <span>{session.email}</span>
            <span className="account__demo">Demo-Anmeldung in diesem Browser</span>
          </p>
          <Link href="/meine-looks" className="account__item" onClick={() => setOpen(false)}>
            Meine Looks
          </Link>
          <button
            type="button"
            className="account__item"
            onClick={() => {
              setOpen(false);
              signOut();
              toast("Abgemeldet. Deine Looks bleiben in diesem Browser.");
            }}
          >
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}
