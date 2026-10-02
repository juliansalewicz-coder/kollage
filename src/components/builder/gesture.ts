import { CANVAS_H, CANVAS_W, MAX_W, MIN_W, itemStyle } from "@/lib/collage";
import type { CanvasItem } from "@/lib/types";

/*
 * Direct manipulation without React in the loop. While a finger or the mouse moves a piece,
 * only the piece's `transform` and the selection frame are written, once per animation frame.
 * React state changes once, when the gesture ends (one undo step).
 */

export type GestureMode = "move" | "scale" | "rotate";

interface Point {
  x: number;
  y: number;
}

export interface Pose {
  x: number;
  y: number;
  w: number;
  rotation: number;
}

/** Snap distance on screen; converted to canvas units with the current zoom of the canvas. */
const SNAP_PX = 7;
const ROTATION_SNAP_DEG = 4;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const angle = (a: Point, b: Point) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function snapRotation(deg: number): number {
  const target = Math.round(deg / 45) * 45;
  return Math.abs(deg - target) < ROTATION_SNAP_DEG ? target : deg;
}

/** Writes the committed geometry of an item to an element, exactly as React would. */
export function applyBox(el: HTMLElement, item: Pose, aspect: number) {
  const s = itemStyle({ ...item, uid: "", productId: "", z: 0 }, aspect);
  el.style.left = s.left;
  el.style.top = s.top;
  el.style.width = s.width;
  el.style.height = s.height;
  el.style.transform = s.transform ?? "";
}

export interface GestureHost {
  glass: HTMLElement;
  piece: HTMLElement;
  frame: () => HTMLElement | null;
  guides: { v: HTMLElement | null; h: HTMLElement | null };
  aspect: number;
  onFirstMove: () => void;
  onEnd: (pose: Pose | null) => void;
}

/**
 * One gesture on one piece. Handles one pointer (move, scale handle, rotate handle) and a second
 * touch for pinch: distance scales, angle rotates, the midpoint moves the piece.
 */
export class PieceGesture {
  private pointers = new Map<number, Point>();
  private base: Pose;
  private next: Pose;
  private anchor = new Map<number, Point>();
  private rect: DOMRect;
  private ux: number;
  private uy: number;
  private frameId = 0;
  private moved = false;
  private snapped = { v: false, h: false };
  /** Geometry the element was laid out with when the gesture started; transforms are relative to it. */
  private origin: Pose;

  constructor(
    private host: GestureHost,
    private mode: GestureMode,
    item: CanvasItem,
    first: PointerEvent,
  ) {
    this.base = { x: item.x, y: item.y, w: item.w, rotation: item.rotation };
    this.next = { ...this.base };
    this.origin = { ...this.base };
    // Measure once; reading layout on every move is what made dragging stutter.
    this.rect = host.glass.getBoundingClientRect();
    this.ux = CANVAS_W / this.rect.width;
    this.uy = CANVAS_H / this.rect.height;
    this.add(first);
  }

  get pointerCount() {
    return this.pointers.size;
  }

  has(id: number) {
    return this.pointers.has(id);
  }

  /** A pointer joins (second finger turns the gesture into a pinch). */
  add(e: PointerEvent) {
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.rebase();
  }

  /** A finger lifts while another stays: continue with the remaining one. */
  remove(id: number) {
    this.pointers.delete(id);
    if (this.pointers.size) {
      if (this.mode !== "move") this.mode = "move";
      this.rebase();
    }
  }

  private rebase() {
    this.base = { ...this.next };
    this.anchor = new Map(this.pointers);
  }

  move(e: PointerEvent) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const [id0, id1] = [...this.pointers.keys()];
    const p0 = this.pointers.get(id0)!;
    const a0 = this.anchor.get(id0)!;
    if (!this.moved) {
      if (this.pointers.size < 2 && dist(p0, a0) < 3) return;
      this.moved = true;
      this.host.piece.style.willChange = "transform";
      this.host.onFirstMove();
    }

    const b = this.base;
    let pose: Pose;
    if (this.pointers.size >= 2) {
      const p1 = this.pointers.get(id1)!;
      const a1 = this.anchor.get(id1)!;
      const k = dist(p0, p1) / (dist(a0, a1) || 1);
      const m = mid(p0, p1);
      const m0 = mid(a0, a1);
      pose = {
        x: b.x + (m.x - m0.x) * this.ux,
        y: b.y + (m.y - m0.y) * this.uy,
        w: b.w * k,
        rotation: snapRotation(b.rotation + angle(p0, p1) - angle(a0, a1)),
      };
    } else if (this.mode === "move") {
      pose = { ...b, x: b.x + (p0.x - a0.x) * this.ux, y: b.y + (p0.y - a0.y) * this.uy };
    } else {
      const c = { x: this.rect.left + b.x / this.ux, y: this.rect.top + b.y / this.uy };
      pose =
        this.mode === "scale"
          ? { ...b, w: b.w * (dist(p0, c) / (dist(a0, c) || 1)) }
          : { ...b, rotation: snapRotation(b.rotation + angle(c, p0) - angle(c, a0)) };
    }
    this.next = this.snapCentre(this.clamp(pose));
    if (!this.frameId) this.frameId = requestAnimationFrame(this.paint);
  }

  private clamp(p: Pose): Pose {
    return {
      x: Math.min(CANVAS_W, Math.max(0, p.x)),
      y: Math.min(CANVAS_H, Math.max(0, p.y)),
      w: Math.min(MAX_W, Math.max(MIN_W, p.w)),
      rotation: p.rotation,
    };
  }

  /** Centre lines of the canvas pull the piece in, with a guide and a tiny tick on phones that vibrate. */
  private snapCentre(p: Pose): Pose {
    if (this.mode !== "move" && this.pointers.size < 2) {
      this.setGuides(false, false);
      return p;
    }
    const tx = SNAP_PX * this.ux;
    const ty = SNAP_PX * this.uy;
    const v = Math.abs(p.x - CANVAS_W / 2) < tx;
    const h = Math.abs(p.y - CANVAS_H / 2) < ty;
    this.setGuides(v, h);
    return { ...p, x: v ? CANVAS_W / 2 : p.x, y: h ? CANVAS_H / 2 : p.y };
  }

  private setGuides(v: boolean, h: boolean) {
    if ((v && !this.snapped.v) || (h && !this.snapped.h)) navigator.vibrate?.(6);
    this.snapped = { v, h };
    this.host.guides.v?.classList.toggle("is-on", v);
    this.host.guides.h?.classList.toggle("is-on", h);
  }

  private paint = () => {
    this.frameId = 0;
    const { piece } = this.host;
    const o = this.origin;
    const dx = (this.next.x - o.x) / this.ux;
    const dy = (this.next.y - o.y) / this.uy;
    const k = this.next.w / o.w;
    // GPU only: no layout, no re-render, the image is not re-rasterised while it moves.
    piece.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${this.next.rotation}deg) scale(${k})`;
    const frame = this.host.frame();
    if (frame) applyBox(frame, this.next, this.host.aspect);
  };

  /** Finish: write the final box so React's next render is a no-op, then report it. */
  end(cancelled = false) {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.setGuides(false, false);
    const { piece, aspect } = this.host;
    piece.style.willChange = "";
    const final = cancelled ? this.origin : this.next;
    applyBox(piece, final, aspect);
    const frame = this.host.frame();
    if (frame) applyBox(frame, final, aspect);
    this.host.onEnd(this.moved && !cancelled ? final : null);
  }
}
