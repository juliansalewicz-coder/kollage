import type { GarmentKind } from "./types";

/**
 * Demo garment illustrations. Each kind is a flat-lay cut-out drawn in its own
 * viewBox. Tones are resolved at render time from the product colours, so one
 * shape serves every colourway.
 */
export type Tone = "main" | "accent" | "dark" | "light" | "inner" | "line" | "stitch" | "none";

export interface PathLayer {
  d: string;
  fill?: Tone;
  stroke?: Tone;
  sw?: number;
  dash?: string;
  /** Apply the light falloff and the product pattern to this shape. */
  body?: boolean;
  cap?: "round" | "butt";
}

export interface CircleLayer {
  cx: number;
  cy: number;
  r: number;
  fill?: Tone;
  stroke?: Tone;
  sw?: number;
}

export type Layer = PathLayer | CircleLayer;

export interface GarmentShape {
  w: number;
  h: number;
  layers: Layer[];
  defaultAccent?: string;
}

const L = (d: string, extra: Partial<PathLayer> = {}): PathLayer => ({ d, stroke: "line", sw: 1.6, fill: "none", ...extra });
const B = (d: string, extra: Partial<PathLayer> = {}): PathLayer => ({ d, fill: "main", body: true, ...extra });
const S = (d: string): PathLayer => ({ d, stroke: "stitch", sw: 1.2, dash: "3 3", fill: "none" });
const C = (cx: number, cy: number, r: number, fill: Tone = "dark", extra: Partial<CircleLayer> = {}): CircleLayer => ({ cx, cy, r, fill, ...extra });

export const GARMENTS: Record<GarmentKind, GarmentShape> = {
  tshirt: {
    w: 200,
    h: 200,
    layers: [
      B("M70 14 C80 26 120 26 130 14 L166 26 L196 70 L166 86 L156 72 L156 192 L44 192 L44 72 L34 86 L4 70 L34 26 Z"),
      { d: "M76 15 C88 23 112 23 124 15 C114 18 86 18 76 15 Z", fill: "dark" },
      L("M70 14 C80 31 120 31 130 14", { sw: 2.2 }),
      L("M44 74 C46 56 44 40 36 27"),
      L("M156 74 C154 56 156 40 164 27"),
      S("M47 184 L153 184"),
      S("M11 66 L38 79"),
      S("M189 66 L162 79"),
    ],
  },
  shirt: {
    w: 220,
    h: 250,
    layers: [
      B("M78 14 L142 14 L182 30 L208 200 L184 208 L164 96 L164 240 L56 240 L56 96 L36 208 L12 200 L38 30 Z"),
      B("M78 14 L110 42 L96 58 L70 24 Z"),
      B("M142 14 L110 42 L124 58 L150 24 Z"),
      L("M78 14 L110 42 L96 58 L70 24 Z"),
      L("M142 14 L110 42 L124 58 L150 24 Z"),
      L("M110 44 L110 240"),
      L("M15 186 L38 192"),
      L("M205 186 L182 192"),
      L("M56 98 C58 70 52 46 40 30"),
      L("M164 98 C162 70 168 46 180 30"),
      L("M126 80 L148 80 L148 104 L137 108 L126 104 Z"),
      C(110, 72, 2.6, "light", { stroke: "line", sw: 0.8 }),
      C(110, 106, 2.6, "light", { stroke: "line", sw: 0.8 }),
      C(110, 140, 2.6, "light", { stroke: "line", sw: 0.8 }),
      C(110, 174, 2.6, "light", { stroke: "line", sw: 0.8 }),
      C(110, 208, 2.6, "light", { stroke: "line", sw: 0.8 }),
    ],
  },
  knit: {
    w: 230,
    h: 240,
    layers: [
      B("M82 16 C94 30 136 30 148 16 L188 30 L222 196 L196 204 L170 98 L172 226 L58 226 L60 98 L34 204 L8 196 L42 30 Z"),
      { d: "M88 17 C98 25 132 25 142 17 C130 21 100 21 88 17 Z", fill: "dark" },
      L("M82 16 C94 37 136 37 148 16", { sw: 2.4 }),
      L("M60 210 L170 210", { sw: 2 }),
      L("M12 181 L37 189", { sw: 2 }),
      L("M218 181 L193 189", { sw: 2 }),
      L("M60 98 C62 70 56 46 44 31"),
      L("M170 98 C168 70 174 46 186 31"),
    ],
  },
  hoodie: {
    w: 230,
    h: 246,
    layers: [
      B("M84 28 L146 28 L188 42 L222 206 L196 214 L170 108 L172 238 L58 238 L60 108 L34 214 L8 206 L42 42 Z"),
      B("M80 36 C70 10 92 4 115 4 C138 4 160 10 150 36 C140 54 90 54 80 36 Z"),
      { d: "M92 32 C96 17 134 17 138 32 C132 44 98 44 92 32 Z", fill: "dark" },
      L("M80 36 C70 10 92 4 115 4 C138 4 160 10 150 36 C140 54 90 54 80 36 Z"),
      { d: "M104 48 L101 88", stroke: "light", sw: 2.4, fill: "none", cap: "round" },
      { d: "M126 48 L129 88", stroke: "light", sw: 2.4, fill: "none", cap: "round" },
      L("M76 168 L154 168 L166 214 L64 214 Z"),
      L("M60 224 L170 224", { sw: 2 }),
      L("M12 191 L37 199", { sw: 2 }),
      L("M218 191 L193 199", { sw: 2 }),
      L("M60 108 C62 80 56 56 44 42"),
      L("M170 108 C168 80 174 56 186 42"),
    ],
  },
  blazer: {
    w: 230,
    h: 260,
    defaultAccent: "#2b2a27",
    layers: [
      B("M76 14 L154 14 L192 30 L222 216 L196 224 L172 102 L174 250 L56 250 L58 102 L34 224 L8 216 L38 30 Z"),
      { d: "M92 14 L115 118 L138 14 Z", fill: "inner" },
      B("M92 14 L78 62 L100 76 L115 118 Z"),
      B("M138 14 L152 62 L130 76 L115 118 Z"),
      L("M92 14 L78 62 L100 76 L115 118"),
      L("M138 14 L152 62 L130 76 L115 118"),
      L("M115 118 L115 250"),
      L("M68 188 L100 186"),
      L("M130 186 L162 188"),
      L("M140 92 L162 90"),
      L("M58 102 C60 72 52 46 40 30"),
      L("M172 102 C170 72 178 46 190 30"),
      L("M12 204 L36 210"),
      L("M218 204 L194 210"),
      C(115, 150, 3.6, "accent"),
      C(115, 182, 3.6, "accent"),
    ],
  },
  coat: {
    w: 230,
    h: 320,
    defaultAccent: "#5b4630",
    layers: [
      B("M74 14 L156 14 L194 30 L222 250 L196 258 L174 108 L184 310 L46 310 L56 108 L34 258 L8 250 L36 30 Z"),
      { d: "M92 14 L115 92 L138 14 Z", fill: "inner" },
      B("M92 14 L76 60 L98 72 L115 92 Z"),
      B("M138 14 L154 60 L132 72 L115 92 Z"),
      L("M92 14 L76 60 L98 72 L115 92"),
      L("M138 14 L154 60 L132 72 L115 92"),
      L("M140 94 L146 310"),
      { d: "M53 166 L177 166 L178 182 L52 182 Z", fill: "dark" },
      { d: "M120 163 L138 163 L138 185 L120 185 Z", fill: "none", stroke: "accent", sw: 2.4 },
      C(100, 116, 3.4, "accent"),
      C(130, 116, 3.4, "accent"),
      C(100, 142, 3.4, "accent"),
      C(130, 142, 3.4, "accent"),
      L("M56 108 C58 76 50 48 38 31"),
      L("M174 108 C172 76 180 48 192 31"),
      S("M50 300 L180 300"),
    ],
  },
  jeans: {
    w: 160,
    h: 260,
    defaultAccent: "#c8902f",
    layers: [
      B("M22 10 L138 10 L142 30 L152 250 L96 252 L82 76 L78 76 L64 252 L8 250 L18 30 Z"),
      L("M19 26 L141 26"),
      L("M86 26 L86 64 C86 71 83 75 80 76"),
      L("M22 31 C40 35 50 44 54 57"),
      L("M138 31 C120 35 110 44 106 57"),
      L("M10 240 L64 241"),
      L("M96 241 L150 240"),
      { d: "M24 33 C40 37 48 46 51 56", stroke: "accent", sw: 1.1, dash: "3 2.5", fill: "none" },
      { d: "M136 33 C120 37 112 46 109 56", stroke: "accent", sw: 1.1, dash: "3 2.5", fill: "none" },
      { d: "M90 28 L90 64 C90 72 86 77 82 79", stroke: "accent", sw: 1.1, dash: "3 2.5", fill: "none" },
      { d: "M12 236 L64 237", stroke: "accent", sw: 1.1, dash: "3 2.5", fill: "none" },
      { d: "M96 237 L148 236", stroke: "accent", sw: 1.1, dash: "3 2.5", fill: "none" },
      L("M40 10 L40 28", { sw: 2.6 }),
      L("M120 10 L120 28", { sw: 2.6 }),
      C(80, 18, 3, "accent"),
    ],
  },
  trousers: {
    w: 170,
    h: 270,
    layers: [
      B("M30 10 L140 10 L146 30 L166 262 L96 264 L86 82 L84 82 L74 264 L4 262 L24 30 Z"),
      L("M27 26 L143 26"),
      L("M50 40 L40 262", { sw: 1.2 }),
      L("M120 40 L130 262", { sw: 1.2 }),
      L("M89 26 L89 70"),
      L("M28 34 L44 72"),
      L("M142 34 L126 72"),
      C(85, 18, 2.6, "dark"),
    ],
  },
  skirt: {
    w: 180,
    h: 220,
    layers: [
      B("M52 10 L128 10 L132 28 L174 210 L6 210 L48 28 Z"),
      L("M48 28 L132 28"),
      L("M72 28 L52 210", { sw: 1.2 }),
      L("M90 28 L90 210", { sw: 1.2 }),
      L("M108 28 L128 210", { sw: 1.2 }),
      S("M10 200 L170 200"),
    ],
  },
  shorts: {
    w: 170,
    h: 140,
    layers: [
      B("M24 10 L146 10 L152 30 L166 124 L98 132 L86 66 L84 66 L72 132 L4 124 L18 30 Z"),
      L("M20 28 L150 28"),
      L("M8 112 L72 120"),
      L("M98 120 L162 112"),
      L("M89 28 L89 60"),
      L("M24 34 L40 58"),
      L("M146 34 L130 58"),
    ],
  },
  sneaker: {
    w: 240,
    h: 120,
    defaultAccent: "#f4f2ec",
    layers: [
      B("M18 92 C14 64 24 46 46 42 L92 40 C104 22 126 14 146 18 L164 26 C188 36 212 54 224 74 L226 92 Z"),
      { d: "M46 42 C60 35 80 35 94 40 C84 47 58 49 46 42 Z", fill: "dark" },
      { d: "M12 90 L212 90 C222 89 230 86 236 80 C239 94 232 110 212 112 L28 112 C14 112 10 102 12 90 Z", fill: "accent", stroke: "line", sw: 1.2 },
      L("M14 99 L230 99", { sw: 1 }),
      L("M190 50 C204 58 216 70 222 86"),
      L("M46 44 C60 62 80 74 120 80 L178 80"),
      { d: "M112 32 L134 46", stroke: "light", sw: 2.4, fill: "none", cap: "round" },
      { d: "M122 25 L144 40", stroke: "light", sw: 2.4, fill: "none", cap: "round" },
      { d: "M133 20 L153 34", stroke: "light", sw: 2.4, fill: "none", cap: "round" },
      L("M22 52 L36 50 L40 86"),
    ],
  },
  loafer: {
    w: 240,
    h: 110,
    defaultAccent: "#2a1d16",
    layers: [
      { d: "M10 86 L232 86 C234 96 228 100 218 100 L56 100 L56 92 L22 92 C12 92 8 90 10 86 Z", fill: "accent" },
      { d: "M14 88 L54 88 L52 104 L18 104 Z", fill: "accent" },
      B("M16 88 L14 60 C14 46 20 40 30 40 C46 42 70 50 100 50 C130 48 170 54 200 64 C220 70 230 78 230 88 Z"),
      { d: "M28 42 C48 44 74 50 100 50 C80 57 46 55 28 47 Z", fill: "inner", stroke: "line", sw: 1 },
      L("M100 55 C130 55 160 59 184 67", { sw: 2.4 }),
      { d: "M134 57 L152 59", stroke: "dark", sw: 3.4, fill: "none", cap: "round" },
      S("M104 52 C140 72 190 76 216 71"),
      L("M18 64 C30 70 46 74 60 74"),
    ],
  },
  boot: {
    w: 200,
    h: 224,
    defaultAccent: "#1e1b18",
    layers: [
      { d: "M40 2 L54 2 L53 18 L42 18 Z", fill: "dark" },
      B("M44 10 L102 10 C104 56 106 100 114 122 C134 130 162 140 180 158 C192 170 196 182 194 194 L26 194 C26 176 32 160 34 140 C36 116 40 96 40 70 C40 44 42 24 44 10 Z"),
      { d: "M66 20 L96 20 L100 112 C90 122 74 122 64 112 Z", fill: "dark" },
      L("M74 28 L72 110", { sw: 0.8 }),
      L("M82 28 L82 114", { sw: 0.8 }),
      L("M90 28 L92 110", { sw: 0.8 }),
      L("M112 122 C108 140 108 160 116 176", { sw: 1 }),
      { d: "M60 194 L196 194 C198 202 194 207 186 207 L60 207 Z", fill: "accent" },
      { d: "M24 194 L64 194 L62 220 L28 220 Z", fill: "accent" },
      S("M30 188 L190 188"),
    ],
  },
  tote: {
    w: 200,
    h: 230,
    layers: [
      { d: "M62 76 C62 12 138 12 138 76", fill: "none", stroke: "dark", sw: 9, cap: "round" },
      B("M24 70 L176 70 L190 222 L10 222 Z"),
      L("M23 84 L177 84"),
      S("M14 210 L186 210"),
    ],
  },
  shoulderbag: {
    w: 220,
    h: 170,
    defaultAccent: "#c9a75a",
    layers: [
      { d: "M52 66 C52 8 168 8 168 66", fill: "none", stroke: "dark", sw: 8, cap: "round" },
      B("M20 70 C20 62 26 58 34 58 L186 58 C194 58 200 62 200 70 L196 150 C196 158 190 162 182 162 L38 162 C30 162 24 158 24 150 Z"),
      B("M22 62 L198 62 L194 116 C194 122 190 124 184 124 L36 124 C30 124 26 122 26 116 Z"),
      L("M22 62 L198 62 L194 116 C194 122 190 124 184 124 L36 124 C30 124 26 122 26 116 Z"),
      { d: "M98 106 L122 106 L122 132 L98 132 Z", fill: "none", stroke: "accent", sw: 3.4 },
      S("M32 70 L188 70"),
    ],
  },
  crossbody: {
    w: 200,
    h: 240,
    defaultAccent: "#c9a75a",
    layers: [
      { d: "M34 116 L100 8 L166 116", fill: "none", stroke: "dark", sw: 3.4, cap: "round" },
      B("M24 120 C24 112 30 108 38 108 L162 108 C170 108 176 112 176 120 L176 214 C176 222 170 226 162 226 L38 226 C30 226 24 222 24 214 Z"),
      L("M26 112 C40 160 160 160 174 112"),
      C(100, 156, 6.5, "accent"),
      S("M34 216 L166 216"),
    ],
  },
  sunglasses: {
    w: 220,
    h: 80,
    defaultAccent: "#3a3631",
    layers: [
      { d: "M100 24 C106 15 114 15 120 24", fill: "none", stroke: "main", sw: 6, cap: "round" },
      B("M8 18 C8 12 12 10 18 10 L92 10 C98 10 100 14 100 20 L96 50 C94 64 86 70 72 70 L36 70 C20 70 12 62 10 50 Z"),
      B("M212 18 C212 12 208 10 202 10 L128 10 C122 10 120 14 120 20 L124 50 C126 64 134 70 148 70 L184 70 C200 70 208 62 210 50 Z"),
      { d: "M17 20 L91 18 L88 48 C86 58 80 62 70 62 L38 62 C26 62 20 56 18 48 Z", fill: "accent" },
      { d: "M203 20 L129 18 L132 48 C134 58 140 62 150 62 L182 62 C194 62 200 56 202 48 Z", fill: "accent" },
      { d: "M28 26 L46 26", stroke: "light", sw: 2.4, fill: "none", cap: "round" },
      { d: "M140 26 L158 26", stroke: "light", sw: 2.4, fill: "none", cap: "round" },
    ],
  },
  cap: {
    w: 200,
    h: 120,
    layers: [
      B("M30 90 C30 40 66 14 104 14 C142 14 172 40 174 88 Z"),
      B("M20 86 C70 78 140 78 184 86 C198 90 198 104 186 108 C140 100 70 100 18 106 C6 104 6 90 20 86 Z"),
      L("M20 86 C70 78 140 78 184 86 C198 90 198 104 186 108 C140 100 70 100 18 106 C6 104 6 90 20 86 Z"),
      L("M104 16 L104 82"),
      L("M72 22 C60 40 56 64 58 84"),
      L("M136 22 C148 40 152 64 150 84"),
      S("M14 98 C70 90 140 90 190 98"),
      C(104, 14, 4.5, "dark"),
    ],
  },
  beanie: {
    w: 180,
    h: 160,
    layers: [
      B("M22 108 C22 50 52 16 90 16 C128 16 158 50 158 108 Z"),
      B("M14 102 L166 102 L166 150 L14 150 Z"),
      L("M14 102 L166 102 L166 150 L14 150 Z"),
      L("M40 30 C50 60 54 86 54 102", { sw: 0.8 }),
      L("M90 16 L90 102", { sw: 0.8 }),
      L("M140 30 C130 60 126 86 126 102", { sw: 0.8 }),
    ],
  },
  scarf: {
    w: 120,
    h: 260,
    layers: [
      B("M22 6 L98 6 L104 234 L16 234 Z"),
      L("M60 6 L60 234", { sw: 0.8 }),
      L("M20 234 L20 254 M30 234 L30 254 M40 234 L40 254 M50 234 L50 254 M60 234 L60 254 M70 234 L70 254 M80 234 L80 254 M90 234 L90 254 M100 234 L100 254", {
        stroke: "dark",
        sw: 2,
      }),
    ],
  },
  belt: {
    w: 260,
    h: 70,
    defaultAccent: "#c9a75a",
    layers: [
      B("M18 22 L222 22 L222 48 L18 48 C10 48 6 42 6 35 C6 28 10 22 18 22 Z"),
      S("M14 27 L218 27"),
      S("M14 43 L218 43"),
      C(60, 35, 2.6, "dark"),
      C(82, 35, 2.6, "dark"),
      C(104, 35, 2.6, "dark"),
      { d: "M196 14 L238 14 C246 14 250 20 250 28 L250 42 C250 50 246 56 238 56 L196 56 Z", fill: "none", stroke: "accent", sw: 6 },
      { d: "M200 35 L236 35", stroke: "accent", sw: 3.4, fill: "none", cap: "round" },
    ],
  },
  watch: {
    w: 90,
    h: 230,
    defaultAccent: "#c7c9c6",
    layers: [
      B("M28 4 L62 4 L62 226 L28 226 Z"),
      S("M32 10 L32 220"),
      S("M58 10 L58 220"),
      C(45, 175, 2.2, "dark"),
      C(45, 192, 2.2, "dark"),
      { d: "M80 108 L88 108 L88 122 L80 122 Z", fill: "accent" },
      C(45, 115, 37, "accent"),
      C(45, 115, 30, "inner", { stroke: "line", sw: 0.8 }),
      { d: "M45 115 L45 94", stroke: "dark", sw: 2.4, fill: "none", cap: "round" },
      { d: "M45 115 L60 122", stroke: "dark", sw: 2, fill: "none", cap: "round" },
      C(45, 115, 2.4, "dark"),
    ],
  },
  necklace: {
    w: 160,
    h: 190,
    defaultAccent: "#c9a75a",
    layers: [
      { d: "M14 8 C14 108 60 148 80 148 C100 148 146 108 146 8", fill: "none", stroke: "accent", sw: 3, dash: "4 2.4", cap: "round" },
      { d: "M80 148 L80 160", stroke: "accent", sw: 2, fill: "none" },
      C(80, 172, 13, "accent"),
      C(80, 172, 7, "light"),
    ],
  },
};

export function garmentAspect(kind: GarmentKind): number {
  const g = GARMENTS[kind];
  return g.h / g.w;
}

/* ---------- colour helpers ---------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

export function mix(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex([a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount]);
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function resolveTones(main: string, accent: string | undefined, fallbackAccent: string | undefined): Record<Tone, string> {
  const isLight = luminance(main) > 0.45;
  const isDark = luminance(main) < 0.04;
  return {
    main,
    accent: accent ?? fallbackAccent ?? mix(main, "#000000", 0.35),
    dark: isDark ? mix(main, "#ffffff", 0.12) : mix(main, "#000000", 0.38),
    light: isLight ? mix(main, "#000000", 0.08) : mix(main, "#ffffff", 0.55),
    inner: "#efede6",
    line: isDark ? mix(main, "#ffffff", 0.22) : mix(main, "#000000", isLight ? 0.22 : 0.32),
    stitch: isDark ? mix(main, "#ffffff", 0.32) : mix(main, "#000000", isLight ? 0.2 : 0.28),
    none: "none",
  };
}
