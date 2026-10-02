"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { LookWindow } from "@/components/LookWindow";
import { toast } from "@/lib/events";
import { formatCHF, formatDate, pieces } from "@/lib/format";
import { distinctCount, lookTotal } from "@/lib/look";
import {
  deleteLook,
  newLookId,
  removeArchivedDraft,
  signOut,
  upsertLook,
  useArchivedDrafts,
  useDraft,
  useHydrated,
  useLooks,
  useSession,
} from "@/lib/store";
import type { Look, LookStatus } from "@/lib/types";

type Filter = "alle" | LookStatus;

export function MyLooks() {
  const hydrated = useHydrated();
  const session = useSession();
  const looks = useLooks();
  const draft = useDraft();
  const archived = useArchivedDrafts();
  const [filter, setFilter] = useState<Filter>("alle");

  // Demo without accounts: every look saved in this browser is yours.
  const mine = looks;
  const shown = mine.filter((l) => filter === "alle" || l.status === filter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const unsavedDraft = draft && draft.items.length > 0 && !draft.lookId ? draft : null;

  if (!hydrated) return <div className="page wrap" aria-busy="true" />;

  return (
    <div className="page wrap">
      <header className="page__head page__head--row">
        <div>
          <h1 className="page__title">Meine Looks</h1>
          <p className="page__lead">
            {session ? (
              <>
                Angemeldet als {session.name} ({session.email}).{" "}
                <button type="button" className="text-btn" onClick={signOut}>
                  Abmelden
                </button>
              </>
            ) : (
              "Deine Looks werden in diesem Browser gespeichert, ohne Anmeldung. Für das Veröffentlichen fragt Kollage nach einem Namen."
            )}
          </p>
        </div>
        <Link href="/builder?neu=1" className="btn btn--primary">
          <Icon name="plus" /> Neuer Look
        </Link>
      </header>

      {unsavedDraft && (
        <section className="draft-strip" aria-labelledby="draft-title">
          <LookWindow items={unsavedDraft.items} backdrop={unsavedDraft.backdrop} frame="thin" className="draft-strip__window" />
          <div>
            <h2 id="draft-title" className="draft-strip__title">
              {unsavedDraft.title || "Ohne Titel"}
            </h2>
            <p className="look-card__meta">
              <span className="badge">Ungespeicherter Entwurf</span> {pieces(distinctCount(unsavedDraft.items))} · zuletzt geändert am {formatDate(unsavedDraft.updatedAt)}
            </p>
            <p className="look-card__meta">Liegt nur in diesem Browser. Speichere ihn, damit er in deiner Liste bleibt.</p>
            <Link href="/builder" className="btn btn--ghost btn--sm">
              Weiter bearbeiten
            </Link>
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section className="archive" aria-labelledby="archive-title">
          <h2 id="archive-title" className="section__title">
            Gesicherte Entwürfe
          </h2>
          <p className="look-card__meta">Beim Öffnen eines anderen Looks zur Seite gelegt. Sie liegen nur in diesem Browser.</p>
          <ul className="look-cards">
            {archived.map((d) => (
              <li key={d.archiveId} data-reveal>
                <article className="look-card">
                  <div className="look-card__window" aria-hidden="true">
                    <LookWindow items={d.items} backdrop={d.backdrop} frame="thin" />
                  </div>
                  <div className="look-card__body">
                    <h3 className="look-card__title">{d.title || "Ohne Titel"}</h3>
                    <p className="look-card__meta">
                      {pieces(distinctCount(d.items))} · gesichert am {formatDate(d.archivedAt)}
                    </p>
                    <div className="look-card__actions">
                      <Link href={`/builder?entwurf=${d.archiveId}`} className="btn btn--primary btn--sm">
                        <Icon name="edit" size={16} /> Entwurf öffnen
                      </Link>
                      <button
                        type="button"
                        className="icon-btn btn--quiet-danger look-card__delete"
                        aria-label={`Entwurf «${d.title || "Ohne Titel"}» löschen`}
                        title="Löschen"
                        onClick={() => {
                          removeArchivedDraft(d.archiveId);
                          toast("Entwurf gelöscht");
                        }}
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mine.length === 0 ? (
        <div className="empty">
          <h2 className="empty__title">Deine gespeicherten Looks erscheinen hier</h2>
          <p>Im Builder auf «Speichern» tippen. Der Look bleibt in diesem Browser, eine Anmeldung brauchst du dafür nicht.</p>
          <div className="empty__actions">
            <Link href="/builder" className="btn btn--primary">
              Look erstellen
            </Link>
            <Link href="/entdecken" className="btn btn--ghost">
              Looks entdecken
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="chips" role="group" aria-label="Status">
            {(
              [
                ["alle", `Alle (${mine.length})`],
                ["veroeffentlicht", `Veröffentlicht (${mine.filter((l) => l.status === "veroeffentlicht").length})`],
                ["privat", `Privat (${mine.filter((l) => l.status === "privat").length})`],
              ] as [Filter, string][]
            ).map(([id, label]) => (
              <button key={id} type="button" className="chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>

          {shown.length ? (
            <ul className="look-cards">
              {shown.map((look) => (
                <li key={look.id} data-reveal>
                  <LookCard look={look} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <h2 className="empty__title">{mine.length ? "Keine Looks mit diesem Status" : "Noch keine gespeicherten Looks"}</h2>
              <p>Stell im Builder einen Look zusammen und tippe auf «Speichern» oder «Veröffentlichen».</p>
              <div className="empty__actions">
                <Link href="/builder" className="btn btn--primary">
                  Look erstellen
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LookCard({ look }: { look: Look }) {
  const [confirming, setConfirming] = useState(false);
  const published = look.status === "veroeffentlicht";

  function toggleStatus() {
    upsertLook({ ...look, status: published ? "privat" : "veroeffentlicht", updatedAt: new Date().toISOString() });
    toast(published ? "Zurückgezogen. Der Look ist jetzt privat." : "Veröffentlicht");
  }

  function duplicate() {
    const now = new Date().toISOString();
    upsertLook({ ...look, id: newLookId(look.title), title: `${look.title} (Kopie)`, status: "privat", createdAt: now, updatedAt: now, basedOn: look.id });
    toast("Kopie erstellt");
  }

  return (
    <article className="look-card">
      <Link href={`/look/${look.id}`} className="look-card__window" tabIndex={-1} aria-hidden="true">
        <LookWindow items={look.items} backdrop={look.backdrop} frame="thin" />
      </Link>
      <div className="look-card__body">
        <h2 className="look-card__title">
          <Link href={`/look/${look.id}`}>{look.title}</Link>
        </h2>
        <p className="look-card__meta">
          <span className={`badge ${published ? "badge--live" : ""}`}>{published ? "Veröffentlicht" : "Privat"}</span>{" "}
          {pieces(distinctCount(look.items))} · <span className="num">{formatCHF(lookTotal(look.items))}</span> · geändert am {formatDate(look.updatedAt)}
        </p>
        <div className="look-card__actions">
          <Link href={`/builder?edit=${look.id}`} className="btn btn--primary btn--sm">
            <Icon name="edit" size={16} /> Bearbeiten
          </Link>
          <button type="button" className="btn btn--ghost btn--sm" onClick={toggleStatus}>
            {published ? "Zurückziehen" : "Veröffentlichen"}
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={duplicate}>
            <Icon name="copy" size={16} /> Duplizieren
          </button>
          {confirming ? (
            <span className="confirm" role="group" aria-label="Löschen bestätigen">
              <span>Endgültig löschen?</span>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => {
                  deleteLook(look.id);
                  toast("Look gelöscht");
                }}
              >
                Löschen
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)} autoFocus>
                Abbrechen
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="icon-btn btn--quiet-danger look-card__delete"
              onClick={() => setConfirming(true)}
              aria-label={`«${look.title}» löschen`}
              title="Löschen"
            >
              <Icon name="trash" size={18} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
