"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { finishLogin, useLoginRequest } from "@/lib/events";
import { signIn } from "@/lib/store";
import { Icon } from "./Icon";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * MVP sign-in. No account is created: name and e-mail stay in this browser.
 * A real provider (magic link / OAuth) replaces this; the draft survives because it lives in storage.
 */
export function AuthDialog() {
  const request = useLoginRequest();
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (request && !dlg.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setErrors({});
      dlg.showModal();
      nameRef.current?.focus();
    } else if (!request && dlg.open) {
      dlg.close();
    }
  }, [request]);

  function close(success: boolean) {
    ref.current?.close();
    finishLogin(success);
    returnFocus.current?.focus?.();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Bitte gib einen Namen ein. Er erscheint bei veröffentlichten Looks.";
    if (!email.trim()) next.email = "Bitte gib deine E-Mail-Adresse ein.";
    else if (!EMAIL.test(email.trim())) next.email = "Diese E-Mail-Adresse ist unvollständig. Beispiel: name@beispiel.ch";
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.email) return emailRef.current?.focus();
    signIn({ name: name.trim(), email: email.trim().toLowerCase() });
    close(true);
  }

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="auth-title"
      aria-describedby="auth-reason"
      onCancel={(e) => {
        e.preventDefault();
        close(false);
      }}
      onClick={(e) => {
        if (e.target === ref.current) close(false);
      }}
    >
      <form className="dialog__body" onSubmit={submit} noValidate>
        <div className="dialog__head">
          <h2 id="auth-title">Anmelden</h2>
          <button type="button" className="icon-btn" onClick={() => close(false)} aria-label="Dialog schliessen">
            <Icon name="close" />
          </button>
        </div>
        <p id="auth-reason" className="dialog__lead">
          {request?.reason}
        </p>
        <p className="note">
          <Icon name="lock" size={16} /> Dein Entwurf bleibt erhalten, während du dich anmeldest.
        </p>

        <div className="field">
          <label htmlFor="auth-name">Name</label>
          <input
            ref={nameRef}
            id="auth-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "auth-name-err" : undefined}
          />
          {errors.name && (
            <p id="auth-name-err" className="field__error" role="alert">
              {errors.name}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="auth-email">E-Mail</label>
          <input
            ref={emailRef}
            id="auth-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "auth-email-err" : "auth-email-hint"}
          />
          {errors.email ? (
            <p id="auth-email-err" className="field__error" role="alert">
              {errors.email}
            </p>
          ) : (
            <p id="auth-email-hint" className="field__hint">
              Demo-Anmeldung: Es wird kein Konto erstellt und keine E-Mail verschickt. Die Angaben bleiben in diesem Browser.
            </p>
          )}
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => close(false)}>
            Abbrechen
          </button>
          <button type="submit" className="btn btn--primary">
            Anmelden und fortfahren
          </button>
        </div>
      </form>
    </dialog>
  );
}
