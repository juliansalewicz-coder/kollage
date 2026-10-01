"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { budgetSummary, mostExpensive } from "@/lib/budget";
import { getProduct, imageAspect } from "@/lib/catalog";
import {
  addItem,
  autoArrange,
  clampItem,
  defaultWidth,
  duplicateItem,
  infoFromProduct,
  layerItem,
  newUid,
  removeItem,
  replaceItem,
  rotateItem,
  scaleItem,
  updateItem,
} from "@/lib/collage";
import { draftNeedsGuard } from "@/lib/draft-guard";
import { requireLogin, toast } from "@/lib/events";
import { formatCHF, pieces } from "@/lib/format";
import { distinctCount, pieceRows } from "@/lib/look";
import { BACKDROPS, getSeedLook, lookup, OCCASIONS } from "@/lib/seed-looks";
import { decodeLook } from "@/lib/share";
import {
  archiveDraft,
  getArchivedDrafts,
  getLooks,
  getSession,
  newLookId,
  removeArchivedDraft,
  toggleFavorite,
  upsertLook,
  useFavorites,
  useSession,
  useStorageStatus,
} from "@/lib/store";
import type { Look, LookStatus, Occasion } from "@/lib/types";
import { Icon } from "../Icon";
import { LookWindow } from "../LookWindow";
import { Sheet } from "../Sheet";
import { BudgetBox } from "./BudgetBox";
import { BuilderCanvas } from "./BuilderCanvas";
import { Gallery } from "./Gallery";
import { PieceInspector } from "./PieceInspector";
import { ReplaceSheet } from "./ReplaceSheet";
import { EMPTY, useBuilder, type Snapshot } from "./useBuilder";

const START_LOOKS = ["herbst-in-bern", "erster-arbeitstag", "sonntag-am-see"];

export function Builder() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const favs = useFavorites();
  const { state, ready, commit, preview, checkpoint, undo, redo, canUndo, canRedo, live } = useBuilder();
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerOpener = useRef<HTMLButtonElement>(null);
  const [replaceFor, setReplaceFor] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const applied = useRef("");
  const storageStatus = useStorageStatus();
  /** Something the user asked to open while the current draft has unsaved work. */
  const [pending, setPending] = useState<{ next: Snapshot; label: string; archiveId?: string } | null>(null);

  function apply(next: Snapshot, archiveId?: string) {
    // The personal budget belongs to the person, not to the look being opened.
    commit((cur) => ({ ...next, budget: cur.budget ?? null }));
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

  /* Open a look from ?look= (remix), ?edit= (own look), ?d= (shared), ?entwurf= (archived), ?neu, ?add. */
  useEffect(() => {
    if (!ready) return;
    const lookParam = params.get("look");
    const editParam = params.get("edit");
    const data = params.get("d");
    const fresh = params.get("neu");
    const archived = params.get("entwurf");
    const addParam = params.get("add");
    const key = params.toString();
    if (!lookParam && !editParam && !data && !fresh && !archived && !addParam) {
      applied.current = "";
      return;
    }
    if (applied.current === key) return;
    applied.current = key;
    if (addParam) {
      // From «Gemerkt»: add to whatever is on the canvas, nothing gets replaced.
      const p = getProduct(addParam);
      if (p) {
        const uid = newUid();
        commit((s) => ({ ...s, items: addItem(s.items, p.id, lookup, uid) }));
        setSelected(uid);
        toast(`${p.title} liegt jetzt auf deiner Leinwand`);
      }
      router.replace("/builder", { scroll: false });
      return;
    }
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
      if (src) {
        next = {
          items: src.items.map((it) => ({ ...it, uid: newUid() })),
          title: `${src.title} (Variante)`,
          note: "",
          occasion: src.occasion,
          backdrop: src.backdrop,
          lookId: null,
          basedOn: src.id,
        };
        label = `den Look «${src.title}»`;
      }
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
      if (el.closest("input, textarea, select, dialog")) return;
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
  const budget = state.budget ?? null;
  const summary = useMemo(() => budgetSummary(items, budget), [items, budget]);
  const replaceItemNow = replaceFor ? items.find((i) => i.uid === replaceFor) ?? null : null;

  function closeDrawer() {
    setDrawerOpen(false);
    drawerOpener.current?.focus();
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

  function replaceWith(productId: string) {
    const uid = replaceFor;
    if (!uid) return;
    const before = live.current.items.find((i) => i.uid === uid);
    const oldP = before ? getProduct(before.productId) : undefined;
    const newP = getProduct(productId);
    edit((xs) => replaceItem(xs, uid, productId, lookup));
    setReplaceFor(null);
    setMoreOpen(false);
    setSelected(uid);
    if (oldP && newP) toast(`${oldP.title} ersetzt durch ${newP.title}. «Rückgängig» stellt es wieder her.`);
  }

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

  const ownLook = state.lookId && session ? getLooks().find((l) => l.id === state.lookId && l.ownerEmail === session.email) : undefined;
  const isPublished = ownLook?.status === "veroeffentlicht";

  const emptyState = (
    <div className="canvas-empty">
      <p className="canvas-empty__title">Womit fängst du an?</p>
      <p>Übernimm einen Look und tausche Teile aus, oder wähle Produkte und ziehe sie hierher.</p>
      <div className="canvas-start">
        <ul className="canvas-start__list">
          {START_LOOKS.map((id) => {
            const l = getSeedLook(id)!;
            return (
              <li key={id}>
                <Link href={`/builder?look=${id}`} className="canvas-start__item">
                  <LookWindow items={l.items} backdrop={l.backdrop} frame="thin" />
                  {l.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  const inspector = (prefix: string) =>
    selItem && selProduct ? (
      <PieceInspector
        item={selItem}
        product={selProduct}
        idPrefix={prefix}
        onReplace={() => setReplaceFor(selItem.uid)}
        onStart={checkpoint}
        onScale={(w) => preview((s) => ({ ...s, items: updateItem(s.items, selItem.uid, { w }) }))}
        onRotate={(rotation) => preview((s) => ({ ...s, items: updateItem(s.items, selItem.uid, { rotation }) }))}
        onLayer={(move) => edit((xs) => layerItem(xs, selItem.uid, move))}
        onDuplicate={() => {
          const id = newUid();
          edit((xs) => duplicateItem(xs, selItem.uid, id));
          setSelected(id);
        }}
      />
    ) : null;

  const lookPanel = (prefix: string) => (
    <>
      <section className="side-block" aria-labelledby={`${prefix}-budget-title`}>
        <h2 id={`${prefix}-budget-title`} className="panel__title">
          Budget
        </h2>
        <BudgetBox
          summary={summary}
          idPrefix={prefix}
          onBudget={(value) => preview((s) => ({ ...s, budget: value }))}
          onCheaper={
            items.length
              ? () => {
                  const it = mostExpensive(items);
                  if (it) {
                    setSelected(it.uid);
                    setLookOpen(false);
                    setReplaceFor(it.uid);
                  }
                }
              : null
          }
        />
      </section>

      <section className="side-block" aria-labelledby={`${prefix}-list-title`}>
        <h2 id={`${prefix}-list-title`} className="panel__title">
          Im Look <span className="panel__count">{pieces(distinctCount(items))}</span>
        </h2>
        {rows.length ? (
          <ol className="mini-list">
            {rows.map((r) => (
              <li key={r.uid}>
                <button
                  type="button"
                  className={`mini-row ${selected === r.uid ? "is-selected" : ""}`}
                  onClick={() => {
                    setSelected(r.uid);
                    setLookOpen(false);
                  }}
                  aria-pressed={selected === r.uid}
                >
                  <span className="tag-num tag-num--sm">{r.number}</span>
                  <span className="mini-row__title">{r.product.title}</span>
                  <span className="num">{formatCHF(r.offer.priceCHF)}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="panel__empty">Noch keine Teile ausgewählt.</p>
        )}
      </section>

      <details className="side-block details" open={prefix === "side"}>
        <summary className="panel__title details__summary">
          Look-Details <Icon name="chevronDown" size={16} />
        </summary>
        <div className="details__body">
          <div className="field">
            <label htmlFor={`${prefix}-occasion`}>Anlass</label>
            <select
              id={`${prefix}-occasion`}
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
            <label htmlFor={`${prefix}-note`}>Notiz zum Look (optional)</label>
            <textarea
              id={`${prefix}-note`}
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
            <legend>Hintergrund der Leinwand</legend>
            <div className="backdrops">
              {BACKDROPS.map((b) => (
                <label key={b.id} className="backdrop-opt" data-backdrop={b.id}>
                  <input
                    type="radio"
                    name={`${prefix}-backdrop`}
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
        </div>
      </details>
    </>
  );

  const favSelected = selProduct ? favs.products.includes(selProduct.id) : false;

  return (
    <div className="builder" data-sheet={drawerOpen ? "open" : "closed"}>
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
            aria-describedby={titleError ? "look-title-err" : "builder-status"}
          />
          {titleError && (
            <p id="look-title-err" className="field__error" role="alert">
              {titleError}
            </p>
          )}
        </div>
        <div className="builder__status" id="builder-status">
          {storageStatus === "sitzung" ? (
            <span className="builder__saved is-warning" role="status">
              <Icon name="lock" size={16} /> Nicht dauerhaft gesichert: Browserspeicher blockiert. Änderungen gehen beim Schliessen verloren.
            </span>
          ) : isPublished ? (
            <span className="builder__saved is-public">
              Veröffentlichter Look: «Änderungen veröffentlichen» macht deine Änderungen sofort öffentlich sichtbar.
            </span>
          ) : (
            <span className="builder__saved">{ownLook ? "Gespeicherter Look, Entwurf wird laufend gesichert" : "Entwurf, automatisch in diesem Browser gesichert"}</span>
          )}
        </div>
        <div className="builder__actions">
          <button type="button" className="btn btn--ghost" onClick={save}>
            {isPublished ? "Änderungen veröffentlichen" : "Speichern"}
          </button>
          {!isPublished && (
            <button type="button" className="btn btn--primary" onClick={publish}>
              Veröffentlichen
            </button>
          )}
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
          Auf deiner Leinwand liegt ein Entwurf mit {distinctCount(state.items) === 1 ? "einem Teil" : `${distinctCount(state.items)} Teilen`}, der nicht gespeichert
          ist. Du willst {pending?.label} öffnen.
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

      <ReplaceSheet
        productId={replaceItemNow?.productId ?? null}
        open={Boolean(replaceItemNow)}
        onClose={() => setReplaceFor(null)}
        onPick={replaceWith}
      />

      <Sheet open={moreOpen && Boolean(selItem)} onClose={() => setMoreOpen(false)} title="Teil bearbeiten" className="sheet--compact">
        {inspector("more")}
      </Sheet>

      <Sheet open={lookOpen} onClose={() => setLookOpen(false)} title="Budget und Look" className="sheet--compact">
        {lookPanel("sheet")}
      </Sheet>

      <div className="builder__body">
        <div className="sheet-scrim" aria-hidden="true" onClick={closeDrawer} />
        <aside
          id="panel-galerie"
          className="builder__gallery panel"
          aria-label="Produkte"
          onKeyDown={(e) => {
            if (e.key === "Escape" && drawerOpen) closeDrawer();
          }}
        >
          <Gallery onAdd={add} counts={counts} onClose={closeDrawer} open={drawerOpen} />
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

          <div className={`piece-tools ${selItem ? "" : "is-idle"}`} role="toolbar" aria-label="Ausgewähltes Teil">
            {selItem && selProduct ? (
              <>
                <span className="piece-tools__name">{selProduct.title}</span>
                <button type="button" className="tool tool--key" onClick={() => setReplaceFor(selItem.uid)}>
                  <Icon name="swap" />
                  <span className="tool__label">Ersetzen</span>
                </button>
                <button
                  type="button"
                  className={`tool ${favSelected ? "is-fav" : ""}`}
                  aria-pressed={favSelected}
                  onClick={() => {
                    const res = toggleFavorite("products", selProduct.id);
                    toast(res.persisted ? (res.active ? "Produkt gemerkt" : "Aus Gemerkt entfernt") : "Gemerkt, aber nur für diese Sitzung: Browserspeicher blockiert");
                  }}
                >
                  <Icon name={favSelected ? "heartFilled" : "heart"} />
                  <span className="tool__label">{favSelected ? "Gemerkt" : "Merken"}</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => scaleItem(xs, selItem.uid, 1 / 1.1))} aria-label="Kleiner">
                  <Icon name="shrink" />
                  <span className="tool__label">Kleiner</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => scaleItem(xs, selItem.uid, 1.1))} aria-label="Grösser">
                  <Icon name="grow" />
                  <span className="tool__label">Grösser</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => rotateItem(xs, selItem.uid, 10))} aria-label="Drehen">
                  <Icon name="rotateRight" />
                  <span className="tool__label">Drehen</span>
                </button>
                <button type="button" className="tool" onClick={() => edit((xs) => layerItem(xs, selItem.uid, "forward"))} aria-label="Eine Ebene nach vorne">
                  <Icon name="layerUp" />
                  <span className="tool__label">Nach vorne</span>
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
                <button type="button" className="tool tool--more" onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
                  <Icon name="more" />
                  <span className="tool__label">Mehr</span>
                </button>
              </>
            ) : (
              <span className="piece-tools__hint">
                {items.length ? "Tippe ein Teil an, um es zu ersetzen oder zu bearbeiten." : "Ausgewählte Produkte erscheinen auf der Leinwand."}
              </span>
            )}
          </div>

          <div className="stage-bottom">
            <button
              ref={drawerOpener}
              type="button"
              className="btn btn--primary add-sheet-btn"
              aria-controls="panel-galerie"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="plus" /> Produkte
            </button>
            <button type="button" className={`lookbar ${summary.remaining !== null && summary.remaining < 0 ? "is-over" : ""}`} onClick={() => setLookOpen(true)} aria-haspopup="dialog">
              <span className="lookbar__value num">{formatCHF(summary.productValue)}</span>
              <span className="lookbar__state">
                {summary.remaining === null
                  ? "Budget festlegen"
                  : summary.remaining < 0
                    ? `${formatCHF(-summary.remaining)} über Budget`
                    : `Rest ${formatCHF(summary.remaining)}`}
              </span>
              <Icon name="chevronRight" size={16} />
            </button>
          </div>
        </section>

        <aside id="panel-fenster" className="builder__side panel" aria-label="Teil, Budget und Look">
          {selItem && selProduct && (
            <section className="side-block" aria-labelledby="insp-title">
              <h2 id="insp-title" className="panel__title">
                Ausgewähltes Teil
              </h2>
              {inspector("side")}
            </section>
          )}
          {lookPanel("side")}
        </aside>
      </div>
    </div>
  );
}
