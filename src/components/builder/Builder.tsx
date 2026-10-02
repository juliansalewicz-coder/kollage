"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { alternatives, bestSaving, budgetSummary } from "@/lib/budget";
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
import { distinctCount, lookTotal, pieceRows } from "@/lib/look";
import { BACKDROPS, getSeedLook, lookup, OCCASIONS } from "@/lib/seed-looks";
import { COMPACT_QUERY, isolate } from "@/lib/modal";
import { decodeLook } from "@/lib/share";
import { track } from "@/lib/track";
import { renderLookImage, shareOrDownload } from "@/lib/export-image";
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
  useLooks,
  useSession,
  useStorageStatus,
} from "@/lib/store";
import type { Look, LookStatus, Occasion } from "@/lib/types";
import { Icon } from "../Icon";
import { LookWindow } from "../LookWindow";
import { Sheet } from "../Sheet";
import { BudgetBox } from "./BudgetBox";
import { BuilderCanvas, type CanvasFx } from "./BuilderCanvas";
import { PriceTicker } from "./PriceTicker";
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
  const { state, ready, commit, preview, checkpoint, undo, redo, canUndo, canRedo, live, draftSaved } = useBuilder();
  const looks = useLooks();
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerOpener = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  /* Phones: the open product drawer is modal. Background stays visible but cannot be reached. */
  useEffect(() => {
    if (!drawerOpen || !drawerRef.current || !window.matchMedia(COMPACT_QUERY).matches) return;
    const scrim = drawerRef.current.parentElement?.querySelector(".sheet-scrim");
    return isolate(drawerRef.current, scrim ? [scrim] : []);
  }, [drawerOpen]);
  const [replaceFor, setReplaceFor] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  /** Phones: title, saving and publishing live in one sheet instead of a tall bar above the canvas. */
  const [saveOpen, setSaveOpen] = useState(false);
  /** False until the stored draft and the URL (?look=, ?d=, ...) are applied. */
  const [booted, setBooted] = useState(false);
  /* Funnel: builder ready with what, and the first real change after that. */
  const tracked = useRef({ loaded: false, edited: false, baseline: "" });
  useEffect(() => {
    if (!booted || tracked.current.loaded) return;
    tracked.current.loaded = true;
    tracked.current.baseline = JSON.stringify(live.current.items);
    track("builder_loaded", { basedOn: live.current.basedOn, pieces: live.current.items.length });
  }, [booted, live]);
  useEffect(() => {
    const t = tracked.current;
    if (!t.loaded || t.edited || JSON.stringify(state.items) === t.baseline) return;
    t.edited = true;
    track("first_edit", { basedOn: live.current.basedOn });
  }, [state.items, live]);
  /* Motion feedback. Pieces added while the phone drawer covers the canvas animate when it closes. */
  const [fx, setFx] = useState<CanvasFx | null>(null);
  const queuedAdds = useRef<string[]>([]);
  const drawerOpenRef = useRef(false);
  useEffect(() => {
    if (!fx) return;
    const t = window.setTimeout(() => setFx(null), 700);
    return () => window.clearTimeout(t);
  }, [fx]);
  function arrived(uid: string) {
    if (drawerOpenRef.current) queuedAdds.current.push(uid);
    else setFx({ uids: [uid], kind: "add", key: Date.now() });
  }
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const applied = useRef("");
  const storageStatus = useStorageStatus();
  /** Something the user asked to open while the current draft has unsaved work. */
  const [pending, setPending] = useState<{ next: Snapshot; label: string; archiveId?: string } | null>(null);

  /** Changes whenever a whole look is loaded, so price feedback only follows real edits. */
  const [loadKey, setLoadKey] = useState(0);
  useEffect(() => {
    if (ready) setLoadKey((k) => k + 1);
  }, [ready]);

  function apply(next: Snapshot, archiveId?: string) {
    setLoadKey((k) => k + 1);
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

  /**
   * Removes ?look= etc. once applied. Native history keeps the builder mounted; a router
   * navigation re-suspended the page and showed the empty canvas for a moment.
   */
  function clearQuery() {
    window.history.replaceState(window.history.state, "", "/builder");
  }

  /* Open a look from ?look= (remix), ?edit= (own look), ?d= (shared), ?entwurf= (archived), ?neu, ?add. */
  useEffect(() => {
    if (!ready) return;
    // On a direct visit the search params can arrive one render after the page: wait for them
    // instead of showing the empty canvas (and loading its template images) in between.
    if (!params.toString() && window.location.search.length > 1) return;
    // From here on the canvas shows the real state (stored draft or the requested look), never the start templates first.
    setBooted(true);
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
      clearQuery();
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
    clearQuery();
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

  drawerOpenRef.current = drawerOpen;

  function closeDrawer() {
    setDrawerOpen(false);
    // After the background is interactive again (the modal effect cleans up after this render).
    requestAnimationFrame(() => drawerOpener.current?.focus());
    if (queuedAdds.current.length) {
      setFx({ uids: queuedAdds.current, kind: "add", key: Date.now() });
      queuedAdds.current = [];
    }
  }

  function add(productId: string) {
    const uid = newUid();
    commit((s) => ({ ...s, items: addItem(s.items, productId, lookup, uid) }));
    setSelected(uid);
    arrived(uid);
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
    arrived(uid);
  }

  const edit = (fn: (xs: typeof items) => typeof items) => commit((s) => ({ ...s, items: fn(s.items) }));

  /** Swaps one placement, or every placement of the same product (one undo step either way). */
  /** Swaps the product of one or more placements in one undo step, with the cross-fade. */
  function swapPiece(uid: string, productId: string, uids: string[]) {
    const before = live.current.items.find((i) => i.uid === uid);
    const oldP = before ? getProduct(before.productId) : undefined;
    const newP = getProduct(productId);
    edit((xs) => uids.reduce((acc, u) => replaceItem(acc, u, productId, lookup), xs));
    if (before) setFx({ uids, kind: "swap", from: before.productId, key: Date.now() });
    setSelected(uid);
    return { oldP, newP };
  }

  function replaceWith(productId: string, uids: string[]) {
    const uid = replaceFor;
    if (!uid) return;
    const { oldP, newP } = swapPiece(uid, productId, uids);
    setReplaceFor(null);
    setMoreOpen(false);
    if (oldP && newP) toast(`${uids.length > 1 ? `${uids.length}× ` : ""}${oldP.title} ersetzt durch ${newP.title}. «Rückgängig» stellt es wieder her.`);
  }

  /**
   * «Mischen»: tries a different piece of the same kind for the selected piece (or a random one),
   * so a look can be varied with one tap. Undo brings the previous piece back.
   */
  function shuffle() {
    const xs = live.current.items;
    if (!xs.length) return;
    const variants = (it: (typeof xs)[number]) => {
      const { cheaper, others } = alternatives(it.productId);
      return [...cheaper, ...others].filter((a) => a.similar && !xs.some((i) => i.productId === a.product.id));
    };
    // The selected piece, otherwise a random piece that actually has a variant (a cap may have none).
    const candidates = xs.filter((i) => variants(i).length);
    const target = xs.find((i) => i.uid === selected) ?? candidates[Math.floor(Math.random() * candidates.length)] ?? xs[0];
    const pool = variants(target);
    if (!pool.length) {
      toast("Für dieses Teil gibt es keine weitere Variante im Katalog.");
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const { oldP, newP } = swapPiece(target.uid, pick.product.id, [target.uid]);
    if (oldP && newP) toast(`Gemischt: ${newP.title} statt ${oldP.title}`);
  }

  /**
   * Saves the draft as a look in this browser. Saving needs no sign-in (it would add nothing in the demo);
   * only publishing asks for a name, because it is shown as the author.
   */
  function persist(status?: LookStatus): { look: Look; persisted: boolean } {
    const user = getSession();
    const s = live.current;
    const now = new Date().toISOString();
    const existing = s.lookId ? getLooks().find((l) => l.id === s.lookId) : undefined;
    const title = s.title.trim() || "Unbenannter Look";
    const look: Look = {
      id: existing?.id ?? newLookId(title),
      title,
      note: s.note.trim(),
      occasion: s.occasion,
      items: s.items,
      backdrop: s.backdrop,
      status: status ?? existing?.status ?? "privat",
      authorName: user?.name ?? existing?.authorName ?? "Gast",
      ownerEmail: user?.email ?? existing?.ownerEmail ?? null,
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
    setSaveOpen(false);
    const { look, persisted } = persist();
    track("look_saved", { look: look.id, published: look.status === "veroeffentlicht" });
    const what = look.status === "veroeffentlicht" ? "Änderungen veröffentlicht" : "Gespeichert in «Meine Looks»";
    toast(persisted ? what : `${what}, aber nur für diese Sitzung: Browserspeicher blockiert`);
  }

  /** PNG of the collage with title and total, shared on phones or downloaded elsewhere. */
  const [exporting, setExporting] = useState(false);
  async function exportImage() {
    if (!items.length || exporting) return;
    setExporting(true);
    try {
      const s = live.current;
      const title = s.title.trim() || "Mein Look";
      const blob = await renderLookImage(s.items, s.backdrop, title, lookTotal(s.items));
      const how = await shareOrDownload(blob, title);
      track("look_exported", { how });
      if (how === "gespeichert") toast("Bild gespeichert");
    } catch (err) {
      // Closing the share sheet is not an error worth a message.
      if (!(err instanceof DOMException && err.name === "AbortError")) toast("Bild konnte nicht erstellt werden. Bitte nochmals versuchen.");
    } finally {
      setExporting(false);
    }
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
      // On phones the title field lives in the save sheet.
      if (window.matchMedia("(max-width: 1023px)").matches) {
        if (saveOpen) document.getElementById("sheet-look-title")?.focus();
        else setSaveOpen(true);
      } else titleRef.current?.focus();
      return;
    }
    if (problems.length) return;
    requireLogin("Melde dich an, um deinen Look zu veröffentlichen.", () => {
      const { look, persisted } = persist("veroeffentlicht");
      track("look_published", { look: look.id });
      if (!persisted) {
        toast("Veröffentlicht, aber nur für diese Sitzung: Browserspeicher blockiert");
        return;
      }
      toast("Veröffentlicht");
      router.push(`/look/${look.id}`);
    });
  }

  // Every saved look in this browser belongs to this browser (demo without accounts).
  const ownLook = state.lookId ? looks.find((l) => l.id === state.lookId) : undefined;
  const isPublished = ownLook?.status === "veroeffentlicht";

  /* What is saved where. Only claims "gesichert" after a write that really succeeded. */
  const unsaved = draftNeedsGuard(state, looks);
  const blocked = storageStatus === "sitzung" || draftSaved === false;
  const status: { tone: "ok" | "warn" | "muted"; text: string; detail: string } = blocked
    ? { tone: "warn", text: "Nicht gesichert: Browserspeicher blockiert", detail: "Änderungen gehen beim Schliessen des Tabs verloren." }
    : !items.length
      ? { tone: "muted", text: "Leere Leinwand", detail: "Sobald ein Teil darauf liegt, wird dein Entwurf in diesem Browser gesichert." }
      : ownLook && !unsaved
        ? { tone: "ok", text: isPublished ? "Veröffentlicht, alles gespeichert" : "Gespeichert in «Meine Looks»", detail: "" }
        : draftSaved
          ? {
              tone: "ok",
              text: "Entwurf in diesem Browser gesichert",
              detail: isPublished ? "Änderungen sind noch nicht veröffentlicht." : "Noch nicht in «Meine Looks» gespeichert.",
            }
          : { tone: "muted", text: "Entwurf wird gesichert …", detail: "" };
  const saveLabel = isPublished ? "Änderungen veröffentlichen" : "Speichern";
  const publishLabel = !session ? "Anmelden & veröffentlichen" : "Veröffentlichen";
  const saveHint = isPublished ? "Aktualisiert die Look-Seite und den Eintrag unter «Entdecken»." : "Legt den Look unter «Meine Looks» ab, ohne Anmeldung.";
  const publishHint = session ? "Zeigt den Look mit eigener Seite unter «Entdecken»." : "Zeigt den Look unter «Entdecken». Dafür brauchst du einen Namen (Demo-Anmeldung).";
  const demoHint = "Alles bleibt in diesem Browser und wird nicht zwischen Geräten abgeglichen. Die Anmeldung ist eine Demo ohne echtes Konto.";
  /** One line under the desktop status: what the two buttons add to the automatic draft. */
  const explain = `Speichern legt den Look in «Meine Looks», ohne Anmeldung. Veröffentlichen zeigt ihn unter «Entdecken»${session ? "" : " und fragt nach einem Namen"}. Nur in diesem Browser.`;

  const short: Record<string, string> = {
    "Entwurf in diesem Browser gesichert": "Entwurf gesichert",
    "Nicht gesichert: Browserspeicher blockiert": "Nicht gesichert",
    "Gespeichert in «Meine Looks»": "In «Meine Looks»",
    "Veröffentlicht, alles gespeichert": "Veröffentlicht",
  };
  const statusLine = (compact = false) => (
    <span className={`save-status is-${status.tone}`} role="status">
      <Icon name={status.tone === "warn" ? "lock" : status.tone === "ok" ? "check" : "edit"} size={16} />
      <span>{compact ? (short[status.text] ?? status.text) : status.text}</span>
    </span>
  );

  const titleField = (id: string, ref?: React.Ref<HTMLInputElement>) => (
    <div className="field builder__title">
      <label htmlFor={id}>Titel des Looks</label>
      <input
        ref={ref}
        id={id}
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
        aria-describedby={titleError ? `${id}-err` : undefined}
      />
      {titleError && (
        <p id={`${id}-err`} className="field__error" role="alert">
          {titleError}
        </p>
      )}
    </div>
  );

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
                  <LookWindow items={l.items} backdrop={l.backdrop} frame="thin" width={{ phoneVw: 26, px: 96 }} />
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

  const saving = summary.remaining !== null && summary.remaining < 0 ? bestSaving(items) : null;

  const budgetPanel = (prefix: string) => (
    <section className="side-block" aria-labelledby={`${prefix}-budget-title`}>
      <h2 id={`${prefix}-budget-title`} className="panel__title">
        Budget
      </h2>
      <BudgetBox
        summary={summary}
        loadKey={loadKey}
        idPrefix={prefix}
        onBudget={(value) => preview((s) => ({ ...s, budget: value }))}
        onCheaper={
          saving
            ? {
                title: saving.product.title,
                saving: saving.saving,
                run: () => {
                  setSelected(saving.item.uid);
                  setLookOpen(false);
                  setReplaceFor(saving.item.uid);
                },
              }
            : null
        }
      />
    </section>
  );

  // Budget stays first so selecting a piece never pushes it out of view.
  const lookDetails = (prefix: string) => (
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
  );

  const lookPanel = (prefix: string, withBudget = true, withDetails = true) => (
    <>
      {withBudget && budgetPanel(prefix)}
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

      {withDetails && lookDetails(prefix)}
    </>
  );

  const favSelected = selProduct ? favs.products.includes(selProduct.id) : false;

  return (
    <div className="builder" data-sheet={drawerOpen ? "open" : "closed"}>
      <div className="builder__bar">
        {titleField("look-title", titleRef)}
        <div className="builder__status" id="builder-status">
          {statusLine()}
          <span className="save-status__detail" id="builder-explain">
            {ownLook && status.detail ? status.detail : explain}
          </span>
        </div>
        <div className="builder__actions">
          <button type="button" className="btn btn--ghost btn--icon-text" onClick={exportImage} disabled={!items.length || exporting} title="PNG 4:5 mit Titel und Preis">
            <Icon name="image" size={18} /> {exporting ? "Erstellt …" : "Als Bild"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={save} aria-describedby="builder-explain">
            {saveLabel}
          </button>
          {!isPublished && (
            <button type="button" className="btn btn--primary" onClick={publish} aria-describedby="builder-explain">
              {publishLabel}
            </button>
          )}
        </div>
        {formError && (
          <p className="builder__error" role="alert">
            {formError}
          </p>
        )}
      </div>

      {/* Phones: one compact row. Title, saving and publishing open in a sheet. */}
      <div className="mbar">
        <button type="button" className="mbar__look" onClick={() => setSaveOpen(true)} aria-haspopup="dialog" aria-label={`Look «${state.title.trim() || "ohne Titel"}»: Titel, Speichern und Veröffentlichen. ${status.text}`}>
          <span className="mbar__title">
            {state.title.trim() || "Look ohne Titel"} <Icon name="edit" size={14} />
          </span>
          {statusLine(true)}
        </button>
        <button type="button" className="tool tool--icon" onClick={undo} disabled={!canUndo} aria-label="Rückgängig">
          <Icon name="undo" />
        </button>
        <button type="button" className="tool tool--icon" onClick={redo} disabled={!canRedo} aria-label="Wiederholen">
          <Icon name="redo" />
        </button>
        <button type="button" className="btn btn--primary btn--sm mbar__save" onClick={() => setSaveOpen(true)} aria-haspopup="dialog">
          Speichern
        </button>
      </div>
      {formError && (
        <p className="builder__error builder__error--m" role="alert">
          {formError}
        </p>
      )}

      <Sheet open={saveOpen} onClose={() => setSaveOpen(false)} title="Look speichern" className="sheet--compact sheet--save" initialFocus={titleError ? "#sheet-look-title" : undefined}>
        {titleField("sheet-look-title")}
        <div className="save-box">
          {statusLine()}
          {status.detail && <span className="save-status__detail">{status.detail}</span>}
        </div>
        <div className="save-actions">
          <button type="button" className="save-action" onClick={save}>
            <span className="save-action__label">{saveLabel}</span>
            <span className="save-action__hint">{saveHint}</span>
          </button>
          {!isPublished && (
            <button type="button" className="save-action save-action--primary" onClick={publish}>
              <span className="save-action__label">{publishLabel}</span>
              <span className="save-action__hint">{publishHint}</span>
            </button>
          )}
        </div>
        <button type="button" className="save-action" onClick={exportImage} disabled={!items.length || exporting}>
          <span className="save-action__label">{exporting ? "Bild wird erstellt …" : "Als Bild teilen"}</span>
          <span className="save-action__hint">PNG im Format 4:5 mit Titel und Preis, z. B. für Instagram oder TikTok.</span>
        </button>
        <p className="fineprint">{session ? "Alles bleibt in diesem Browser." : demoHint}</p>
        {lookDetails("sheet")}
      </Sheet>

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
        items={items}
        uid={replaceItemNow?.uid ?? null}
        open={Boolean(replaceItemNow)}
        onClose={() => setReplaceFor(null)}
        onPick={replaceWith}
      />

      <Sheet open={moreOpen && Boolean(selItem)} onClose={() => setMoreOpen(false)} title="Teil bearbeiten" className="sheet--compact">
        {inspector("more")}
      </Sheet>

      <Sheet open={lookOpen} onClose={() => setLookOpen(false)} title="Budget und Teile" className="sheet--compact">
        {lookPanel("sheet", true, false)}
      </Sheet>

      <div className="builder__body">
        <div className="sheet-scrim" aria-hidden="true" onClick={closeDrawer} />
        <aside
          ref={drawerRef}
          id="panel-galerie"
          className="builder__gallery panel"
          aria-label="Produkte"
          role={drawerOpen ? "dialog" : undefined}
          aria-modal={drawerOpen ? true : undefined}
          onKeyDown={(e) => {
            if (e.key === "Escape" && drawerOpen) closeDrawer();
          }}
        >
          <Gallery onAdd={add} counts={counts} onClose={closeDrawer} open={drawerOpen} status={drawerOpen ? announce : ""} />
        </aside>

        <section className="builder__stage" aria-label="Leinwand bearbeiten">
          <div className="stage-tools" role="toolbar" aria-label="Leinwand">
            <button type="button" className="tool tool--icon" onClick={undo} disabled={!canUndo} aria-label="Rückgängig" title="Rückgängig (Strg+Z)">
              <Icon name="undo" />
            </button>
            <button type="button" className="tool tool--icon" onClick={redo} disabled={!canRedo} aria-label="Wiederholen" title="Wiederholen (Strg+Umschalt+Z)">
              <Icon name="redo" />
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
            <button type="button" className="tool" onClick={shuffle} disabled={!items.length} title="Ein Teil gegen eine passende Variante tauschen">
              <Icon name="sparkle" /> <span className="tool__label">Mischen</span>
            </button>
          </div>

          <BuilderCanvas
            items={items}
            backdrop={state.backdrop}
            selected={selected}
            onSelect={setSelected}
            commit={commit}
            onDropProduct={dropAt}
            emptyState={booted ? emptyState : <p className="canvas-loading">Look wird geladen …</p>}
            fx={fx}
          />

          {/* On phones this dock sticks to the bottom so the tools stay next to the outfit. */}
          <div className="stage-dock">
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
                  <button type="button" className="tool tool--minor" onClick={() => edit((xs) => scaleItem(xs, selItem.uid, 1 / 1.1))} aria-label="Kleiner">
                    <Icon name="shrink" />
                    <span className="tool__label">Kleiner</span>
                  </button>
                  <button type="button" className="tool tool--minor" onClick={() => edit((xs) => scaleItem(xs, selItem.uid, 1.1))} aria-label="Grösser">
                    <Icon name="grow" />
                    <span className="tool__label">Grösser</span>
                  </button>
                  <button type="button" className="tool" onClick={() => edit((xs) => rotateItem(xs, selItem.uid, 10))} aria-label="Drehen">
                    <Icon name="rotateRight" />
                    <span className="tool__label">Drehen</span>
                  </button>
                  <button type="button" className="tool tool--minor" onClick={() => edit((xs) => layerItem(xs, selItem.uid, "forward"))} aria-label="Eine Ebene nach vorne">
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
                <>
                  <span className="piece-tools__hint">
                    {items.length ? "Tippe ein Teil an, um es zu ersetzen oder zu bearbeiten." : "Ausgewählte Produkte erscheinen auf der Leinwand."}
                  </span>
                  {/* Phones: canvas actions live here because the toolbar above the canvas is gone. */}
                  <span className="idle-tools">
                    <button type="button" className="tool" onClick={shuffle} disabled={!items.length}>
                      <span className="tool__label">Mischen</span>
                    </button>
                    <button type="button" className="tool" onClick={() => edit((xs) => autoArrange(xs, lookup))} disabled={!items.length}>
                      <span className="tool__label">Anordnen</span>
                    </button>
                    <button
                      type="button"
                      className="tool"
                      onClick={() => openGuarded({ ...live.current, items: [] }, "eine leere Leinwand")}
                      disabled={!items.length}
                    >
                      <span className="tool__label">Leeren</span>
                    </button>
                  </span>
                </>
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
                <PriceTicker value={summary.productValue} className="lookbar__value" resetKey={loadKey} />
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
          </div>
        </section>

        <aside id="panel-fenster" className="builder__side panel" aria-label="Teil, Budget und Look">
          {budgetPanel("side")}
          {selItem && selProduct && (
            <section className="side-block" aria-labelledby="insp-title">
              <h2 id="insp-title" className="panel__title">
                Ausgewähltes Teil
              </h2>
              {inspector("side")}
            </section>
          )}
          {lookPanel("side", false)}
        </aside>
      </div>
    </div>
  );
}
