"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { bestOffer, getProduct, getShop, imageAspect } from "@/lib/catalog";
import {
  addItem,
  autoArrange,
  clampItem,
  defaultWidth,
  duplicateItem,
  infoFromProduct,
  layerItem,
  MAX_W,
  MIN_W,
  newUid,
  removeItem,
  rotateItem,
  scaleItem,
  updateItem,
} from "@/lib/collage";
import { requireLogin, toast } from "@/lib/events";
import { formatCHF, pieces } from "@/lib/format";
import { distinctCount, lookTotal, offerHref, pieceRows, shippingText } from "@/lib/look";
import { BACKDROPS, getSeedLook, lookup, OCCASIONS } from "@/lib/seed-looks";
import { decodeLook } from "@/lib/share";
import { draftNeedsGuard } from "@/lib/draft-guard";
import {
  archiveDraft,
  getArchivedDrafts,
  getLooks,
  getSession,
  newLookId,
  removeArchivedDraft,
  upsertLook,
  useSession,
  useStorageStatus,
} from "@/lib/store";
import type { Look, LookStatus, Occasion } from "@/lib/types";
import { ProductImage } from "../GarmentArt";
import { Sheet } from "../Sheet";
import { Icon } from "../Icon";
import { BuilderCanvas } from "./BuilderCanvas";
import { Gallery } from "./Gallery";
import { EMPTY, useBuilder, type Snapshot } from "./useBuilder";

export function Builder() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const { state, ready, commit, preview, checkpoint, undo, redo, canUndo, canRedo, live } = useBuilder();
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetOpener = useRef<HTMLButtonElement>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const applied = useRef("");
  const storageStatus = useStorageStatus();
  /** Something the user asked to open while the current draft has unsaved work. */
  const [pending, setPending] = useState<{ next: Snapshot; label: string; archiveId?: string } | null>(null);

  function apply(next: Snapshot, archiveId?: string) {
    commit(() => next);
    setSelected(null);
    if (archiveId) removeArchivedDraft(archiveId);
  }

  /** Opens `next`, or asks first when that would replace unsaved work. */
  function openGuarded(next: Snapshot, label: string, archiveId?: string) {
    if (draftNeedsGuard(live.current, getLooks())) setPending({ next, label, archiveId });
    else apply(next, archiveId);
  }

  function resolvePending(choice: "keep" | "archive" | "replace") {
    const p = pending;
    setPending(null);
    if (!p || choice === "keep") return;
    if (choice === "archive") {
      const { persisted } = archiveDraft({ ...live.current, updatedAt: new Date().toISOString() });
      toast(persisted ? "Bisheriger Entwurf gesichert. Du findest ihn unter «Meine Looks»." : "Entwurf nur für diese Sitzung gesichert: Browserspeicher blockiert.");
    }
    apply(p.next, p.archiveId);
  }

  /* Open a look from ?look= (remix), ?edit= (own look) or ?d= (shared link). */
  useEffect(() => {
    if (!ready) return;
    const lookParam = params.get("look");
    const editParam = params.get("edit");
    const data = params.get("d");
    const fresh = params.get("neu");
    const archived = params.get("entwurf");
    const key = params.toString();
    if (!lookParam && !editParam && !data && !fresh && !archived) {
      applied.current = "";
      return;
    }
    if (applied.current === key) return;
    applied.current = key;
    let next: Snapshot | null = null;
    let label = "";
    let archiveId: string | undefined;
    if (editParam) {
      const own = getLooks().find((l) => l.id === editParam);
      if (own && live.current.lookId !== own.id) {
        next = { items: own.items, title: own.title, note: own.note, occasion: own.occasion, backdrop: own.backdrop, lookId: own.id, basedOn: own.basedOn };
        label = `deinen Look «${own.title}»`;
      }
    } else if (archived) {
      const entry = getArchivedDrafts().find((d) => d.archiveId === archived);
      if (entry) {
        next = { items: entry.items, title: entry.title, note: entry.note, occasion: entry.occasion, backdrop: entry.backdrop, lookId: entry.lookId, basedOn: entry.basedOn };
        label = `den gesicherten Entwurf «${entry.title || "Ohne Titel"}»`;
        archiveId = entry.archiveId;
      }
    } else if (lookParam) {
      const src = getSeedLook(lookParam) ?? getLooks().find((l) => l.id === lookParam);
      if (src)
        next = {
          items: src.items.map((it) => ({ ...it, uid: newUid() })),
          title: `${src.title} (Variante)`,
          note: "",
          occasion: src.occasion,
          backdrop: src.backdrop,
          lookId: null,
          basedOn: src.id,
        };
      if (src) label = `den Look «${src.title}»`;
    } else if (data) {
      const shared = decodeLook(data, (id) => Boolean(getProduct(id)));
      if (shared) next = { ...shared, items: shared.items.map((it) => ({ ...it, uid: newUid() })), note: "", lookId: null, basedOn: null };
      label = "den geteilten Look";
    }
    if (fresh) {
      next = EMPTY;
      label = "einen neuen, leeren Look";
    }
    if (next) openGuarded(next, label, archiveId);
    router.replace("/builder", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, params, commit, live, router]);

  /* Undo / redo shortcuts outside text fields. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const items = state.items;
  const selItem = items.find((i) => i.uid === selected) ?? null;
  const selProduct = selItem ? getProduct(selItem.productId) : undefined;
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((i) => m.set(i.productId, (m.get(i.productId) ?? 0) + 1));
    return m;
  }, [items]);
  const rows = pieceRows(items);

  function closeSheet() {
    setSheetOpen(false);
    sheetOpener.current?.focus();
  }

  function add(productId: string) {
    const uid = newUid();
    commit((s) => ({ ...s, items: addItem(s.items, productId, lookup, uid) }));
    setSelected(uid);
    setFormError(null);
    const p = getProduct(productId);
    if (p) setAnnounce(`${p.title} liegt auf der Leinwand. ${pieces(items.length + 1)} insgesamt.`);
  }

  function dropAt(productId: string, x: number, y: number) {
    const product = getProduct(productId);
    if (!product) return;
    const uid = newUid();
    const info = infoFromProduct(product, imageAspect(product));
    commit((s) => ({
      ...s,
      items: [...s.items, clampItem({ uid, productId, x, y, w: defaultWidth(info), rotation: 0, z: s.items.reduce((m, i) => Math.max(m, i.z), 0) + 1 })],
    }));
    setSelected(uid);
  }

  const edit = (fn: (xs: typeof items) => typeof items) => commit((s) => ({ ...s, items: fn(s.items) }));

  function persist(status?: LookStatus): { look: Look; persisted: boolean } {
    const user = getSession()!;
    const s = live.current;
    const now = new Date().toISOString();
    const existing = s.lookId ? getLooks().find((l) => l.id === s.lookId && l.ownerEmail === user.email) : undefined;
    const title = s.title.trim() || "Unbenannter Look";
    const look: Look = {
      id: existing?.id ?? newLookId(title),
      title,
      note: s.note.trim(),
      occasion: s.occasion,
      items: s.items,
      backdrop: s.backdrop,
      status: status ?? existing?.status ?? "privat",
      authorName: user.name,
      ownerEmail: user.email,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      basedOn: s.basedOn,
      isExample: false,
    };
    const persisted = upsertLook(look);
    preview((cur) => ({ ...cur, lookId: look.id, title }));
    return { look, persisted };
  }

  function save() {
    setTitleError(null);
    if (!items.length) {
      setFormError("Leg zuerst mindestens ein Teil auf die Leinwand.");
      return;
    }
    setFormError(null);
    requireLogin("Melde dich an, um deinen Look in «Meine Looks» zu speichern.", () => {
      const { look, persisted } = persist();
      const what = look.status === "veroeffentlicht" ? "Änderungen veröffentlicht" : "Gespeichert in «Meine Looks»";
      toast(persisted ? what : `${what}, aber nur für diese Sitzung: Browserspeicher blockiert`);
    });
  }

  function publish() {
    const problems: string[] = [];
    if (!live.current.title.trim()) {
      setTitleError("Gib dem Look einen Titel, bevor du ihn veröffentlichst.");
      problems.push("title");
    } else setTitleError(null);
    if (distinctCount(items) < 2) {
      setFormError("Ein veröffentlichter Look braucht mindestens zwei verschiedene Teile.");
      problems.push("items");
    } else setFormError(null);
    if (problems[0] === "title") {
      titleRef.current?.focus();
      return;
    }
    if (problems.length) return;
    requireLogin("Melde dich an, um deinen Look zu veröffentlichen.", () => {
      const { look, persisted } = persist("veroeffentlicht");
      if (!persisted) {
        toast("Veröffentlicht, aber nur für diese Sitzung: Browserspeicher blockiert");
        return;
      }
      toast("Veröffentlicht");
      router.push(`/look/${look.id}`);
    });
  }

  const editingOwn = Boolean(state.lookId && session && getLooks().some((l) => l.id === state.lookId && l.ownerEmail === session.email));

  const emptyState = (
    <div className="canvas-empty">
      <p className="canvas-empty__title">Deine Leinwand ist leer</p>
      <p>Wähle Produkte aus oder ziehe sie hierher.</p>
      <Link href="/builder?look=sonntag-am-see" className="btn btn--ghost btn--sm">
        Mit einem Beispiel-Look starten
      </Link>
    </div>
  );

  return (
    <div className="builder" data-sheet={sheetOpen ? "open" : "closed"}>
      <div className="builder__bar">
        <div className="field builder__title">
          <label htmlFor="look-title">Titel des Looks</label>
          <input
            ref={titleRef}
            id="look-title"
            value={state.title}
            maxLength={80}
            placeholder="z. B. Herbst in der Altstadt"
            onFocus={checkpoint}
            onChange={(e) => {
              const v = e.target.value;
              preview((s) => ({ ...s, title: v }));
              if (titleError && v.trim()) setTitleError(null);
            }}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? "look-title-err" : undefined}
          />
          {titleError && (
            <p id="look-title-err" className="field__error" role="alert">
              {titleError}
            </p>
          )}
        </div>
        <div className="builder__status">
          {storageStatus === "sitzung" ? (
            <span className="builder__saved is-warning" role="status">
              <Icon name="lock" size={16} /> Nicht dauerhaft gesichert: Browserspeicher blockiert. Änderungen gehen beim Schliessen verloren.
            </span>
          ) : (
            <span className="builder__saved">{editingOwn ? "Gespeicherter Look, Entwurf wird laufend gesichert" : "Entwurf, automatisch in diesem Browser gesichert"}</span>
          )}
        </div>
        <div className="builder__actions">
          <button type="button" className="btn btn--ghost" onClick={save}>
            Speichern
          </button>
          <button type="button" className="btn btn--primary" onClick={publish}>
            Veröffentlichen
          </button>
        </div>
        {formError && (
          <p className="builder__error" role="alert">
            {formError}
          </p>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <Sheet open={Boolean(pending)} onClose={() => resolvePending("keep")} title="Ungesicherten Entwurf behalten?" closeLabel="Am Entwurf weiterarbeiten">
        <p className="sheet__text">
          Auf deiner Leinwand liegt ein Entwurf mit {distinctCount(state.items) === 1 ? "einem Teil" : `${distinctCount(state.items)} Teilen`}, der nicht gespeichert ist. Du willst {pending?.label} öffnen.
        </p>
        <div className="sheet__choices">
          <button type="button" className="btn btn--primary" onClick={() => resolvePending("archive")}>
            Entwurf sichern und öffnen
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => resolvePending("keep")}>
            Am Entwurf weiterarbeiten
          </button>
          <button type="button" className="btn btn--ghost btn--quiet-danger" onClick={() => resolvePending("replace")}>
            Entwurf verwerfen und öffnen
          </button>
        </div>
        <p className="fineprint">Gesicherte Entwürfe findest du unter «Meine Looks», auch ohne Anmeldung.</p>
      </Sheet>


      <div className="builder__body">
        <div className="sheet-scrim" aria-hidden="true" onClick={closeSheet} />
        <aside
          id="panel-galerie"
          className="builder__gallery panel"
          aria-label="Produkte"
          onKeyDown={(e) => {
            if (e.key === "Escape" && sheetOpen) closeSheet();
          }}
        >
          <Gallery onAdd={add} counts={counts} onClose={closeSheet} open={sheetOpen} />
        </aside>

        <section className="builder__stage" aria-label="Leinwand bearbeiten">
          <div className="stage-tools" role="toolbar" aria-label="Leinwand">
            <button type="button" className="tool" onClick={undo} disabled={!canUndo}>
              <Icon name="undo" /> <span className="tool__label">Rückgängig</span>
            </button>
            <button type="button" className="tool" onClick={redo} disabled={!canRedo}>
              <Icon name="redo" /> <span className="tool__label">Wiederholen</span>
            </button>
            <button type="button" className="tool" onClick={() => edit((xs) => autoArrange(xs, lookup))} disabled={!items.length}>
              <Icon name="arrange" /> <span className="tool__label">Anordnen</span>
            </button>
            <button
              type="button"
              className="tool"
              onClick={() => openGuarded({ ...live.current, items: [] }, "eine leere Leinwand")}
              disabled={!items.length}
            >
              <Icon name="trash" /> <span className="tool__label">Leeren</span>
            </button>
          </div>

          <BuilderCanvas
            items={items}
            backdrop={state.backdrop}
            selected={selected}
            onSelect={setSelected}
            preview={preview}
            checkpoint={checkpoint}
            commit={commit}
            onDropProduct={dropAt}
            emptyState={emptyState}
          />

          <button
            ref={sheetOpener}
            type="button"
            className="btn btn--primary add-sheet-btn"
            aria-controls="panel-galerie"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
          >
            <Icon name="plus" /> Produkte hinzufügen
          </button>

          <div className={`piece-tools ${selItem ? "" : "is-idle"}`} role="toolbar" aria-label="Ausgewähltes Teil">
            {selItem && selProduct ? (
              <>
                <span className="piece-tools__name">{selProduct.title}</span>
                <button type="button" className="tool" onClick={() => edit((xs) => scaleItem(xs, selItem.uid, 1 / 1.1))} aria-label="Kleiner">
                  <Icon name="shrink" />
                  <span className="tool__label">Kleiner</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => scaleItem(xs, selItem.uid, 1.1))} aria-label="Grösser">
                  <Icon name="grow" />
                  <span className="tool__label">Grösser</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => rotateItem(xs, selItem.uid, -10))} aria-label="Nach links drehen">
                  <Icon name="rotateLeft" />
                  <span className="tool__label">Links</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => rotateItem(xs, selItem.uid, 10))} aria-label="Nach rechts drehen">
                  <Icon name="rotateRight" />
                  <span className="tool__label">Rechts</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => layerItem(xs, selItem.uid, "forward"))} aria-label="Eine Ebene nach vorne">
                  <Icon name="layerUp" />
                  <span className="tool__label">Vor</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => layerItem(xs, selItem.uid, "backward"))} aria-label="Eine Ebene nach hinten">
                  <Icon name="layerDown" />
                  <span className="tool__label">Zurück</span>
                </button>
                <button
                  type="button"
                  className="tool"
                  onClick={() => {
                    const id = newUid();
                    edit((xs) => duplicateItem(xs, selItem.uid, id));
                    setSelected(id);
                  }}
                  aria-label="Duplizieren"
                >
                  <Icon name="copy" />
                  <span className="tool__label">Kopie</span>
                </button>
                <button
                  type="button"
                  className="tool tool--danger"
                  onClick={() => {
                    edit((xs) => removeItem(xs, selItem.uid));
                    setSelected(null);
                  }}
                  aria-label="Von der Leinwand entfernen"
                >
                  <Icon name="trash" />
                  <span className="tool__label">Entfernen</span>
                </button>
              </>
            ) : (
              <span className="piece-tools__hint">
                {items.length ? "Tippe ein Teil an, um es zu bearbeiten." : "Ausgewählte Produkte erscheinen auf der Leinwand."}
              </span>
            )}
          </div>
        </section>

        <aside id="panel-fenster" className="builder__side panel" aria-label="Look und Details">
          {selItem && selProduct && (
            <section className="inspector" aria-labelledby="insp-title">
              <h2 id="insp-title" className="panel__title">
                Ausgewähltes Teil
              </h2>
              <div className="inspector__product">
                <div className="inspector__thumb" aria-hidden="true">
                  <ProductImage product={selProduct} className="buy-row__img" />
                </div>
                <div>
                  <p className="inspector__name">{selProduct.title}</p>
                  <p className="inspector__meta">{selProduct.colorName}</p>
                  <p className="inspector__meta">
                    <span className="num">{formatCHF(bestOffer(selProduct).priceCHF)}</span> · {getShop(bestOffer(selProduct).shopId).name}
                  </p>
                  <p className="inspector__meta">{shippingText(getShop(bestOffer(selProduct).shopId))}</p>
                  <a href={offerHref(bestOffer(selProduct).id, null)} target="_blank" rel="sponsored nofollow noopener" className="link-arrow">
                    Angebot ansehen <Icon name="external" size={16} />
                    <span className="sr-only">(Partnerlink, neues Fenster)</span>
                  </a>
                </div>
              </div>
              <div className="field">
                <label htmlFor="insp-size">Grösse</label>
                <input
                  id="insp-size"
                  type="range"
                  min={MIN_W}
                  max={MAX_W}
                  step={5}
                  value={Math.round(selItem.w)}
                  onPointerDown={checkpoint}
                  onKeyDown={checkpoint}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    preview((s) => ({ ...s, items: updateItem(s.items, selItem.uid, { w }) }));
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="insp-rot">
                  Drehung <span className="num">{Math.round(selItem.rotation)}°</span>
                </label>
                <input
                  id="insp-rot"
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={Math.round(selItem.rotation)}
                  onPointerDown={checkpoint}
                  onKeyDown={checkpoint}
                  onChange={(e) => {
                    const rotation = Number(e.target.value);
                    preview((s) => ({ ...s, items: updateItem(s.items, selItem.uid, { rotation }) }));
                  }}
                />
              </div>
              <div className="inspector__row">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => edit((xs) => layerItem(xs, selItem.uid, "front"))}>
                  Ganz nach vorne
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => edit((xs) => layerItem(xs, selItem.uid, "back"))}>
                  Ganz nach hinten
                </button>
              </div>
            </section>
          )}

          <section className="in-window" aria-labelledby="in-window-title">
            <h2 id="in-window-title" className="panel__title">
              Im Look <span className="panel__count">{pieces(distinctCount(items))}</span>
            </h2>
            {rows.length ? (
              <>
                <ol className="mini-list">
                  {rows.map((r) => (
                    <li key={r.uid}>
                      <button
                        type="button"
                        className={`mini-row ${selected === r.uid ? "is-selected" : ""}`}
                        onClick={() => setSelected(r.uid)}
                        aria-pressed={selected === r.uid}
                      >
                        <span className="tag-num tag-num--sm">{r.number}</span>
                        <span className="mini-row__title">{r.product.title}</span>
                        <span className="num">{formatCHF(r.offer.priceCHF)}</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="buy-total buy-total--sm">
                  <span>Alles zusammen</span>
                  <span className="num">{formatCHF(lookTotal(items))}</span>
                </p>
              </>
            ) : (
              <p className="panel__empty">Noch keine Teile ausgewählt.</p>
            )}
          </section>

          <section className="details" aria-labelledby="details-title">
            <h2 id="details-title" className="panel__title">
              Details
            </h2>
            <div className="field">
              <label htmlFor="look-occasion">Anlass</label>
              <select
                id="look-occasion"
                value={state.occasion}
                onChange={(e) => {
                  const occasion = e.target.value as Occasion;
                  commit((s) => ({ ...s, occasion }));
                }}
              >
                {OCCASIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="look-note">Notiz zum Look (optional)</label>
              <textarea
                id="look-note"
                rows={3}
                maxLength={280}
                value={state.note}
                placeholder="Wofür ist der Look gedacht?"
                onFocus={checkpoint}
                onChange={(e) => {
                  const note = e.target.value;
                  preview((s) => ({ ...s, note }));
                }}
              />
            </div>
            <fieldset className="field">
              <legend>Hintergrund</legend>
              <div className="backdrops">
                {BACKDROPS.map((b) => (
                  <label key={b.id} className="backdrop-opt" data-backdrop={b.id}>
                    <input
                      type="radio"
                      name="backdrop"
                      value={b.id}
                      checked={state.backdrop === b.id}
                      onChange={() => commit((s) => ({ ...s, backdrop: b.id }))}
                    />
                    <span className="backdrop-opt__chip" aria-hidden="true" />
                    <span className="backdrop-opt__label">{b.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        </aside>
      </div>
    </div>
  );
}
