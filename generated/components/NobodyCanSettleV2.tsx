import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, camEase, clamp, clamp01, hash, smoothstep, sway } from "./fieldShared";
// The 1914 world of EverybodyWants, read-only: its palette, projection, its
// Dalmatia want and places (ww1Overlay.ts), and its baked static map. The
// static layers are rasters: EverybodyWants' wide and britain levels
// (public/ww1/, ww1Levels.ts) and one Adriatic crop of the same stack baked for
// this piece by `bun scripts/bake-settle-rasters.mjs V2` (public/ww1settle/,
// settleV2Levels.ts). The Entente wash shapes come from
// scripts/build-settle-entente.mjs (settleEntente.ts); the settlement line's
// limits, the arrows' target and Belgrade from scripts/build-settle-geometry.mjs
// (settleGeometry.ts, shared with NobodyCanSettle V1).
import { CITIES, PLACES, WANT_BOX, WANT_D, WANT_EDGE_D } from "./ww1Overlay";
import { LEVELS, type Level } from "./ww1Levels";
import { SETTLE_V2_LEVELS } from "./settleV2Levels";
import { ENTENTE } from "./settleEntente";
import { BELGRADE, COAST, INLAND, TARGET, type P2 } from "./settleGeometry";

export const FPS = 24;
// ---------------------------------------------------------------------------
// Sarah Paine, "Why nobody could end World War I":
// "And one of the reasons nobody can settle is because within your alliance
// system, you cannot come up with a settlement that will satisfy everyone
// within your alliance."
// In-point 64.44 s = f0, 24 fps, frame = round((t - 64.44) * 24). The next line
// ("let") starts at 73.98 s: round((73.98 - 64.44) * 24) = round(228.96) = 229,
// + the 16-frame house tail: DURATION = 229 + 16 = 245.
//
// Word frames: and 0 · one of the reasons 10/17 · nobody 23 · can settle 33/39 ·
// is because 48/54 · within your 60/66 · alliance system 71/81 · you cannot
// 95/113 · come up with a 120/131/138 · settlement 147 · that will satisfy
// 156/163/166 · everyone 181 · within your alliance 194/202/213 · (let 229).
//
// V2 (the user's idea): open on Europe, light up the whole alliance on
// "alliance system", then go into the Adriatic, where two of its members want
// the same coast.
//
// THE HISTORY. The Entente in Europe in 1915: Britain, France, Russia,
// Serbia, Montenegro, Belgium, and Italy from the Treaty of London (26 April
// 1915). Italy demanded all of Dalmatia as its price for joining; the treaty
// gave it the northern part (Lisarica/Tribanj to Cape Planka, with Zara and
// Sebenico, and most of the islands). Serbia, the Entente's first cause and
// Russia's client, claimed all of Dalmatia for a South Slav state. So two
// allies wanted one coast, and no line down it could satisfy both. The piece
// hatches the whole Dalmatian shape of EverybodyWants (Italy's demand, and
// Serbia's). UNVERIFIED (from memory, not sourced here): that Serbia put the
// claim formally in the Nis Declaration (Dec 1914), and that Sazonov argued the
// Serb case in the London bargaining.
//
// THE DWARKESH MAP STYLE, exactly as EverybodyWants: opaque 1080x1920, sea
// #1B2226 with engraved water-lines, land #3F3428 with the rim #6A5838, cream
// ink #E9DDBF, world-space mottle + screen-space grain, vignette 0.55. The
// orange #FFB000 / #D98A0C is the one accent, in two forms that mean two
// things: the WASH (a flat 0.35 fill + a 0.7 edge, never a hatch) = the
// alliance, one team; the HATCH (EverybodyWants' +45 deg, 11 px octaves, with
// its dashed edge) and the two desire-arrows = wanted land. No text at all:
// no name in this line is a place name.
//   weights  settlement line 3.4 px solid cream over a 6.4 px dark casing
//            (2x the 1.7 px 1914 border); arrow 2.6 px over a 5.4 px casing,
//            12 px head; tie 2.6 px dotted; wash edge 1.6 px; want edge 2.2 px
//            dashed; capital dot r 6
//   ladder   the wash at 1 (0.35 fill) on "alliance system", 0.1 of that from
//            the Adriatic on. The hatch full once drawn (the land is always
//            wanted). Each ally's arrow full unless the coast is on the other
//            ally's side of the line, then 0.15, easing over ~6 f as the line
//            passes (near s = 0 both are full); its capital dot and its half of
//            the tie follow, floored at 0.3
//
// THE GESTURES, each with its frames and word. Nothing else.
//   1. f0-60   the Europe wide (EverybodyWants' opening framing, k 1.18 creeping
//      to 1.22), nothing orange      — "one of the reasons nobody can settle is because"
//   2. f60-91  the Entente lights up: the seven members' wash fades up over
//      10 f each, one every 3.5 f in a hashed order from "within" (f60), all
//      in by f91                               — "within your alliance system"
//   3. f86-109 one van Wijk glide into the Adriatic (k 3.3, the coast on y 835;
//      target f86-103, landed ~f109). The wash fades to 0.1 over f88-112; the
//      Dalmatia hatch draws in as one front from the north, f96-112
//                                                           — "you cannot"
//   4. f100-130 the Rome <-> Belgrade tie draws on (f100-118, dotted, bowed south,
//      the capitals' dots rising with it); the settlement line draws on from
//      its NW end (f104-122) at s ~ 0; the two desire-arrows draw on at FULL,
//      nose to nose on the coast: Rome's f108-124, Belgrade's f114-130
//                                                   — "you cannot come up with"
//   5. f126-181 the swing, one damped pendulum: s = -0.95 at f150 (the coast on
//      Italy's side, Belgrade's arrow 0.15; "settlement" f147), +0.85 at f166
//      ("satisfy": Belgrade's side, Rome's arrow 0.15), -0.72 at f181
//      ("everyone": Rome's)   — "a settlement that will satisfy everyone"
//   6. f181-245 the camera eases back gently (k 3.45 -> 2.95, f181-203, landed
//      ~f209, ahead of "alliance" f213); the line keeps swinging, slower and
//      smaller (s +0.52 f207, -0.46 f233), never resolving; a faint highlight
//      travels the tie Rome -> Belgrade from f190     — "within your alliance"
// No flashes, pulses, springs, glows, labels, roses or cartouches.
// ---------------------------------------------------------------------------
export const DURATION = 245;

// EverybodyWants' palette, restated rather than imported: importing that
// module would run its camera, LOD and font loading in this render.
export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const CASING = "#0B0907";
const HILITE = "#FFE3A6";
const LOW = 0.15; // the arrow of the ally on the wrong side of the line
const TIE_FLOOR = 0.3; // its capital dot and half of the tie
const WASH = 0.35; // the alliance wash's fill
const WASH_EDGE = 0.7;
const WASH_LOW = 0.1; // the wash, relative, once in the Adriatic

export const schema = z.object({
  sea: z.string(),
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  grainSrc: z.string(),
  mottleSrc: z.string(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  sea: SEA,
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  grainSrc: "ww1/grain.png",
  mottleSrc: "ww1/mottle.png",
  vignette: 0.55,
});

export const T = {
  wash: [60, 3.5, 10] as const, // first start ("within"), step, fade
  washDown: [88, 112] as const,
  glide: [86, 103] as const, // target; the damped camera lands ~f109
  hatch: [96, 112] as const, // the Dalmatia front from the north
  tie: [100, 118] as const,
  lineDraw: [104, 122] as const,
  arrowRome: [108, 124] as const,
  arrowBelgrade: [114, 130] as const,
  ease: [181, 203] as const, // "everyone" -> "within your alliance"
  hilite: 190,
};

// ---------------------------------------------------------------------------
// THE SWING: s(f) = A(f) sin(phi(f)), phi and A monotone Hermite splines.
// ---------------------------------------------------------------------------
/** Monotone cubic Hermite (Fritsch-Carlson) through (xs, ys); m0 = start slope. */
const hermite = (xs: number[], ys: number[], m0?: number) => {
  const n = xs.length;
  const sec = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = xs.map((_, i) => (i === 0 ? sec[0] : i === n - 1 ? sec[n - 2] : sec[i - 1] * sec[i] <= 0 ? 0 : (sec[i - 1] + sec[i]) / 2));
  if (m0 !== undefined) m[0] = m0;
  for (let i = 0; i < n - 1; i++) {
    if (sec[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / sec[i];
    const b = m[i + 1] / sec[i];
    const r = a * a + b * b;
    if (r > 9) {
      const tau = 3 / Math.sqrt(r);
      m[i] = tau * a * sec[i];
      m[i + 1] = tau * b * sec[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const u = (x - xs[i]) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1]
    );
  };
};
const PI = Math.PI;
// Phase knots at the swing's extremes (phi = -pi/2 + m pi): Italy's side f150,
// Belgrade's f166 ("satisfy"), Rome's f181 ("everyone"), then slower through
// the hold (f207, f233, f259). The amplitude is its own spline: a slight drift
// (0.1) until f126, so the line holds near s = 0 while it and both arrows draw
// on, then 0.95 at the first extreme, shrinking to ~0.45 and never to 0.
const PHASE: [number, number][] = [
  [104, -PI],
  [150, -PI / 2],
  [166, PI / 2],
  [181, (3 * PI) / 2],
  [207, (5 * PI) / 2],
  [233, (7 * PI) / 2],
  [259, (9 * PI) / 2],
];
const AMPS: [number, number][] = [
  [104, 0.1],
  [126, 0.1],
  [150, 0.95],
  [166, 0.85],
  [181, 0.72],
  [207, 0.52],
  [233, 0.46],
  [259, 0.43],
];
const PHI = hermite(
  PHASE.map((k) => k[0]),
  PHASE.map((k) => k[1]),
  0,
);
const AMP = hermite(
  AMPS.map((k) => k[0]),
  AMPS.map((k) => k[1]),
);
/** The line's position (its middle) at (fractional) frame f. */
export const swingS = (f: number) => (f <= PHASE[0][0] ? 0 : AMP(f) * Math.sin(PHI(f)));
const LAG = 3.5; // frames: how far the ends of the line trail its middle
const N = INLAND.length;
const lagOf = (i: number) => LAG * Math.pow((2 * i) / (N - 1) - 1, 2);
/** The settlement line at frame f: N points, NW -> SE. */
export const lineAt = (f: number): P2[] =>
  INLAND.map((p, i) => {
    const w = (swingS(f - lagOf(i)) + 1) / 2;
    return [p[0] + (COAST[i][0] - p[0]) * w, p[1] + (COAST[i][1] - p[1]) * w];
  });
/** How much of the coast lies on Italy's (seaward) side of the line: 1 at s = -1. */
export const italyShare = (f: number) => (1 - swingS(f)) / 2;
// THE LADDER (as V1). An ally's arrow is full unless the coast has gone to the
// other ally's side: it eases to LOW as the other's share of the coast runs
// from 0.55 to 0.85 (~6 f at the swing's speed), reading the line 3 f late.
// The capital dot and the ally's half of the tie follow, floored at TIE_FLOOR.
export const allyRung = (share: number) => 1 - (1 - LOW) * smoothstep((1 - share - 0.55) / 0.3);
export const tieRungOf = (rung: number) => TIE_FLOOR + ((1 - TIE_FLOOR) * (rung - LOW)) / (1 - LOW);
const REACT = 3;

// ---------------------------------------------------------------------------
// THE CAMERA: a keyed track damped by the house spring (CAM_STIFF / CAM_DAMP)
// on log k, x and cy, so every move is C1 and lands ~6 f after its target;
// cy = c + CAM_LIFT / k puts content point c on screen y 835.
// EUROPE: EverybodyWants' opening framing, creeping. ADRIATIC: V1's framing,
// centred between Rome and Belgrade, the coast on y 835, creeping, then one
// gentle ease back. The move between is a van Wijk glide (as EverybodyWants).
// ---------------------------------------------------------------------------
type View = { k: number; x: number; c: number };
const EUROPE: View = { k: 1.18, x: PLACES.shotEurope.x, c: PLACES.shotEurope.y };
const K_EUROPE_END = 1.22;
const ADRIATIC: View = { k: 3.3, x: (CITIES.rome.x + BELGRADE.x) / 2, c: 1128 };
const K_CLOSE = 3.45;
const K_BACK = 2.95;
const K_END = 3.0;
const zoomPath = (a: View, b: View, RHO: number) => {
  const w0 = FRAME_W / a.k;
  const w1 = FRAME_W / b.k;
  const dx = b.x - a.x;
  const dy = b.c - a.c;
  const d2 = dx * dx + dy * dy;
  const r2 = RHO * RHO;
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + r2 * r2 * d2) / (2 * w0 * r2 * d1);
  const b1 = (w1 * w1 - w0 * w0 - r2 * r2 * d2) / (2 * w1 * r2 * d1);
  const q0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const q1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (q1 - q0) / RHO;
  return (t: number): View => {
    const s = t * S;
    const u = (w0 / (r2 * d1)) * (Math.cosh(q0) * Math.tanh(RHO * s + q0) - Math.sinh(q0));
    const w = (w0 * Math.cosh(q0)) / Math.cosh(RHO * s + q0);
    return { x: a.x + u * dx, c: a.c + u * dy, k: FRAME_W / w };
  };
};
const creep = (u: number) => {
  const v = clamp01(u);
  return v * v * (1.5 - 0.5 * v);
};
const EUROPE_END: View = { ...EUROPE, k: K_EUROPE_END };
const GLIDE = zoomPath(EUROPE_END, ADRIATIC, 1.25);
const camTarget = (f: number): View => {
  if (f <= T.glide[0]) return { ...EUROPE, k: EUROPE.k * Math.pow(K_EUROPE_END / EUROPE.k, creep(f / T.glide[0])) };
  if (f < T.glide[1]) return GLIDE(camEase((f - T.glide[0]) / (T.glide[1] - T.glide[0]), 0.85));
  if (f <= T.ease[0]) return { ...ADRIATIC, k: ADRIATIC.k * Math.pow(K_CLOSE / ADRIATIC.k, creep((f - T.glide[1]) / (T.ease[0] - T.glide[1]))) };
  if (f < T.ease[1]) return { ...ADRIATIC, k: K_CLOSE * Math.pow(K_BACK / K_CLOSE, camEase((f - T.ease[0]) / (T.ease[1] - T.ease[0]), 0.85)) };
  return { ...ADRIATIC, k: K_BACK * Math.pow(K_END / K_BACK, creep((f - T.ease[1]) / (DURATION - T.ease[1]))) };
};
export const CAM_TRACK = (() => {
  const out: { k: number; cx: number; cy: number }[] = [];
  const t0 = camTarget(0);
  let lk = Math.log(t0.k);
  let cx = t0.x;
  let cy = t0.c + CAM_LIFT / t0.k;
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k: t0.k, cx, cy });
  for (let f = 1; f <= DURATION; f++) {
    const t = camTarget(f);
    vk += (Math.log(t.k) - lk) * CAM_STIFF - vk * CAM_DAMP;
    lk += vk;
    vx += (t.x - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (t.c + CAM_LIFT / t.k - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k: Math.exp(lk), cx, cy });
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE STATIC MAP, a raster LOD stack, sharpest on top: EverybodyWants' wide
// (k 1.18) and britain (k 2.72) levels and this piece's Adriatic crop (k 3.4).
// Each frame picks the level whose bake zoom is nearest (in log) its k, among
// those that cover the view (the crop is baked to cover its frames). A level
// is at 1 through its run; entering over a lower level it fades in over the
// first 4 frames of its run (the lower one held at 1 beneath it), and leaving
// to a lower level it fades out over the 4 frames after (the level below is
// opaque throughout). Levels under an
// opaque one are not drawn. Precomputed once; a frame whose drawn levels do
// not cover the view throws.
// ---------------------------------------------------------------------------
export const CROPS = [{ name: "v2adriatic", kBake: 3.4, s: 3.55 }] as const;
type Cand = { name: string; kBake: number; rect: Level | null };
const WIDE_L = LEVELS.find((L) => L.name === "wide") as Level;
const BRITAIN_L = LEVELS.find((L) => L.name === "britain") as Level;
const CANDS: Cand[] = [
  { name: "wide", kBake: WIDE_L.kBake, rect: WIDE_L },
  { name: "britain", kBake: BRITAIN_L.kBake, rect: BRITAIN_L },
  ...CROPS.map((c) => ({ name: c.name as string, kBake: c.kBake, rect: SETTLE_V2_LEVELS.find((l) => l.name === c.name) ?? null })),
];
const covers = (L: Level, f: number) => {
  const { k, cx, cy } = CAM_TRACK[f];
  const m = 12 / k; // the house sway, plus a hair
  return cx - 540 / k - m >= L.x0 && cy - 960 / k - m >= L.y0 && cx + 540 / k + m <= L.x0 + L.w && cy + 960 / k + m <= L.y0 + L.h;
};
const FADE = 4;
const PICK: number[] = CAM_TRACK.map(({ k }, f) => {
  let best = 0;
  let bs = Infinity;
  CANDS.forEach((c, i) => {
    // a crop not yet baked is assumed to cover (the bake makes it so)
    if (c.rect && !CROPS.some((p) => p.name === c.name) && !covers(c.rect, f)) return;
    const sc = Math.abs(Math.log(k / c.kBake));
    if (sc < bs) [bs, best] = [sc, i];
  });
  return best;
});
/** For each crop, the frames it is picked for (the bake covers them +- FADE). */
export const CROP_RUNS: { name: string; f0: number; f1: number }[] = CROPS.map((c) => {
  const i = CANDS.findIndex((x) => x.name === c.name);
  const fs = PICK.map((p, f) => (p === i ? f : -1)).filter((f) => f >= 0);
  return { name: c.name, f0: fs.length ? fs[0] : -1, f1: fs.length ? fs[fs.length - 1] : -2 };
});
export const LEVEL_OP: number[][] = (() => {
  const n = CAM_TRACK.length;
  const op = CANDS.map(() => new Array<number>(n).fill(0));
  let f = 0;
  while (f < n) {
    const i = PICK[f];
    let b = f;
    while (b + 1 < n && PICK[b + 1] === i) b++;
    for (let g = f; g <= b; g++) op[i][g] = 1;
    // entering over a lower level: fade in over the first FADE frames of the
    // run, the lower level held at 1 beneath it meanwhile
    if (f > 0 && PICK[f - 1] < i)
      for (let d = 0; d < FADE && f + d <= b; d++) {
        op[i][f + d] = smoothstep((d + 1) / (FADE + 1));
        op[PICK[f - 1]][f + d] = 1;
      }
    // leaving to a lower level: fade out over the FADE frames after the run
    if (b < n - 1 && PICK[b + 1] < i) for (let d = 1; d <= FADE && b + d < n; d++) op[i][b + d] = Math.max(op[i][b + d], smoothstep(1 - d / (FADE + 1)));
    f = b + 1;
  }
  return op;
})();
// check: every frame's drawn levels cover the view (skipped until the crop is baked)
if (CANDS.every((c) => c.rect)) {
  for (let f = 0; f < CAM_TRACK.length; f++)
    CANDS.forEach((c, i) => {
      if (LEVEL_OP[i][f] > 0 && !covers(c.rect as Level, f)) throw new Error(`NobodyCanSettleV2: level ${c.name} does not cover f${f}`);
    });
}

// ---------------------------------------------------------------------------
// Geometry helpers (as EverybodyWants).
// ---------------------------------------------------------------------------
const arcPts = (a: { x: number; y: number }, b: { x: number; y: number }, bow: number, n = 96): P2[] => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = mx + dy * bow;
  const cy = my - dx * bow;
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([(1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y]);
  }
  return out;
};
const cum = (pts: P2[]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
const fmt = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
const toward = (a: { x: number; y: number }, b: { x: number; y: number }, d: number) => {
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: a.x + ((b.x - a.x) * d) / l, y: a.y + ((b.y - a.y) * d) / l };
};
/** The stretch of a polyline between arc lengths s0 and s1. */
const rangePts = (pts: P2[], c: number[], s0: number, s1: number): P2[] => {
  const at = (s: number): P2 => {
    let i = 1;
    while (i < pts.length - 1 && c[i] < s) i++;
    const u = clamp01((s - c[i - 1]) / (c[i] - c[i - 1] || 1));
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
  };
  const out: P2[] = [at(s0)];
  for (let i = 0; i < pts.length; i++) if (c[i] > s0 && c[i] < s1) out.push(pts[i]);
  out.push(at(s1));
  return out;
};

// The alliance tie, Rome -> Belgrade, bowed south under the coast (as V1).
const TIE = arcPts(toward(CITIES.rome, BELGRADE, 5), toward(BELGRADE, CITIES.rome, 5), -0.18);
const TIE_C = cum(TIE);
const TIE_L = TIE_C[TIE_C.length - 1];

// The two desire-arrows, capital -> the coast, bowed north, nose to nose in
// the hatch (as V1).
const arrowTo = (from: { x: number; y: number }, bow: number) => {
  const probe = arcPts(toward(from, TARGET, 9), TARGET, bow);
  const [p, q] = [probe[probe.length - 2], probe[probe.length - 1]];
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
  const tip = { x: TARGET.x - ((q[0] - p[0]) / l) * 3, y: TARGET.y - ((q[1] - p[1]) / l) * 3 };
  const pts = arcPts(toward(from, TARGET, 9), tip, bow);
  const c = cum(pts);
  return { pts, c, L: c[c.length - 1] };
};
const ARROWS = [
  { id: "rome", ...arrowTo(CITIES.rome, 0.16), t: T.arrowRome, italy: true },
  { id: "belgrade", ...arrowTo(BELGRADE, -0.16), t: T.arrowBelgrade, italy: false },
];

// The wash's hashed order: one member every 3.5 f from "within".
const WASH_ORDER = ENTENTE.map((_, i) => i).sort((p, q) => hash(p, 13) - hash(q, 13));
const washStart = (i: number) => T.wash[0] + T.wash[1] * WASH_ORDER.indexOf(i);
const DAL = WANT_BOX.dalmatia;
const FRONT_F = 14; // world px, the soft edge of the hatch's front

// ---------------------------------------------------------------------------
const NobodyCanSettleV2: React.FC<Props> = ({ sea, ink, accent, accentDeep, grainSrc, mottleSrc, vignette }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(DURATION, Math.max(0, Math.round(frame)));

  // -- camera --------------------------------------------------------------
  const cam = CAM_TRACK[fi];
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx / k;
  const cy = cam.cy + drift.dy / k;
  const tx = FRAME_W / 2 - cx * k;
  const ty = FRAME_H / 2 - cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;
  const grow = (v: number, e = 0.18) => (v * Math.pow(k, e)) / k;

  // -- hatch octaves (as EverybodyWants): screen spacing 11-22 px ------------
  const L2 = Math.log2(k);
  const oct = Math.floor(L2);
  const octT = smoothstep(L2 - oct);
  const HS = 11 / Math.pow(2, oct);

  // -- the wash ---------------------------------------------------------------------
  const down = 1 - (1 - WASH_LOW) * smoothstep((frame - T.washDown[0]) / (T.washDown[1] - T.washDown[0]));
  const washOf = (i: number) => smoothstep((frame - washStart(i)) / T.wash[2]) * down;

  // -- the hatch's front from the north: ONE progress value decides the mask's
  // definition and its use (the REVEAL rule): p <= 0 nothing, 0 < p < 1 masked,
  // p >= 1 unmasked
  const hatchP = interpolate(frame, [T.hatch[0], T.hatch[1]], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });
  const hatchMasked = hatchP > 0 && hatchP < 1;
  const frontY = DAL.y0 - FRONT_F + (DAL.y1 - DAL.y0 + 2 * FRONT_F) * hatchP;

  // -- the settlement line -----------------------------------------------------
  const drawT = interpolate(frame, [T.lineDraw[0], T.lineDraw[1]], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });
  const line = lineAt(frame);
  const lineC = cum(line);
  const drawn = drawT > 0 ? rangePts(line, lineC, 0, lineC[N - 1] * drawT) : null;

  // -- the ladder -------------------------------------------------------------------
  const share = italyShare(frame - REACT);
  const rung = { rome: allyRung(share), belgrade: allyRung(1 - share) };

  // -- the tie ---------------------------------------------------------------------
  const tieU = interpolate(frame, [T.tie[0], T.tie[1]], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });
  const dotIn = smoothstep((frame - T.tie[0]) / 6);
  const pitch = px(7.6); // the tie's dash pitch (0.1 + 7.5 screen px)
  const tieEnd = tieU * TIE_L;
  const half = TIE_L / 2;
  const holdT = smoothstep((frame - T.hilite) / 16);
  const PERIOD = 48;
  const ph = ((((frame - T.hilite) % PERIOD) + PERIOD) % PERIOD) / PERIOD;
  const hiOp = holdT * Math.sin(PI * ph) * 0.75;
  const hiDots: { p: P2; o: number }[] = [];
  if (hiOp > 0.01 && frame >= T.hilite) {
    const head = (ph * 1.3 - 0.15) * TIE_L;
    const sig = 0.09 * TIE_L;
    for (let s = px(0.05); s <= TIE_L; s += pitch) {
      const o = hiOp * Math.exp(-((s - head) * (s - head)) / (2 * sig * sig));
      if (o > 0.02) hiDots.push({ p: rangePts(TIE, TIE_C, s, s)[0], o });
    }
  }
  const tieHalf = (s0: number, s1: number, op: number, key: string) =>
    s1 > s0 ? (
      <path
        key={key}
        d={fmt(rangePts(TIE, TIE_C, s0, s1))}
        fill="none"
        stroke={ink}
        strokeOpacity={op}
        strokeWidth={px(2.6)}
        strokeDasharray={`${px(0.1)} ${px(7.5)}`}
        strokeDashoffset={s0 % pitch}
        strokeLinecap="round"
      />
    ) : null;

  // -- mottle tiles, world space (as EverybodyWants), culled to the view ------
  const view = { x0: cx - 560 / k, x1: cx + 560 / k, y0: cy - 980 / k, y1: cy + 980 / k };
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  for (let y = -900; y < 4700; y += 1180) for (let x = -1400; x < 2400; x += 1180) tiles.push({ x, y, s: 1180, o: 0.75 });
  for (let y = -1300; y < 4700; y += 770) for (let x = -1700; x < 2400; x += 770) tiles.push({ x: x + 310, y: y + 170, s: 770, o: 0.45 });
  const visTiles = tiles.filter((t) => t.x + t.s > view.x0 && t.x < view.x1 && t.y + t.s > view.y0 && t.y < view.y1);

  // the static map: the drawn levels, sharpest on top, none under an opaque one
  const levelImg = (L: Level, op: number, src: string) => (
    <Img
      key={src}
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: L.W,
        height: L.H,
        transformOrigin: "0 0",
        transform: `translate(${(tx + L.x0 * k).toFixed(3)}px, ${(ty + L.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
        opacity: op,
      }}
    />
  );
  const drawnLevels: { c: Cand; op: number }[] = [];
  for (let i = CANDS.length - 1; i >= 0; i--) {
    const op = LEVEL_OP[i][fi];
    if (op <= 0.001 || !CANDS[i].rect) continue;
    drawnLevels.unshift({ c: CANDS[i], op });
    if (op >= 0.999) break;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: sea }}>
      {/* ---------------- THE MAP: baked levels ---------------- */}
      {drawnLevels.map(({ c, op }) =>
        levelImg(c.rect as Level, op, CROPS.some((p) => p.name === c.name) ? `ww1settle/lod-${c.name}.png` : `ww1/lod-${c.name}.png`),
      )}

      {/* ---------------- PAPER MOTTLING, world space ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: 0.9,
        }}
      >
        {visTiles.map((t) => (
          <Img
            key={`m-${t.x}-${t.y}`}
            src={staticFile(mottleSrc)}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s + 1, height: t.s + 1, opacity: t.o }}
          />
        ))}
      </div>

      {/* ---------------- THE ALLIANCE, THE COAST, THE TIE, THE ARROWS, THE LINE ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          <pattern id="hA" patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform="rotate(45)">
            <line x1={HS / 2} y1={0} x2={HS / 2} y2={HS} stroke={accent} strokeWidth={px(2)} />
          </pattern>
          <pattern id="hB" patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={HS} stroke={accent} strokeWidth={px(2)} />
            <line x1={HS} y1={0} x2={HS} y2={HS} stroke={accent} strokeWidth={px(2)} />
          </pattern>
          {hatchMasked ? (
            <mask id="mDal" maskUnits="userSpaceOnUse" x={-1500} y={-800} width={4200} height={5800}>
              <linearGradient id="mDalg" gradientUnits="userSpaceOnUse" x1={0} y1={frontY - FRONT_F} x2={0} y2={frontY}>
                <stop offset={0} stopColor="#fff" />
                <stop offset={1} stopColor="#000" />
              </linearGradient>
              <rect x={DAL.x0 - 40} y={DAL.y0 - 40} width={DAL.x1 - DAL.x0 + 80} height={DAL.y1 - DAL.y0 + 80} fill="url(#mDalg)" />
            </mask>
          ) : null}
        </defs>
        <g transform={camT}>
          {/* the alliance: one flat wash per member, a brighter edge round it */}
          {ENTENTE.map((c, i) => {
            const w = washOf(i);
            if (w <= 0.002) return null;
            return (
              <g key={c.key}>
                <path d={c.d} fill={accent} fillOpacity={WASH * w} fillRule="evenodd" />
                <path d={c.d} fill="none" stroke={accent} strokeOpacity={WASH_EDGE * w} strokeWidth={px(1.6)} strokeLinejoin="round" />
              </g>
            );
          })}

          {/* the wanted coast: one hatch, drawn in from the north, then full */}
          {hatchP > 0 ? (
            <g mask={hatchMasked ? "url(#mDal)" : undefined}>
              <path d={WANT_D.dalmatia} fill={accentDeep} fillOpacity={0.2} fillRule="evenodd" />
              <path d={WANT_D.dalmatia} fill="url(#hA)" fillRule="evenodd" opacity={0.85} />
              {octT > 0.01 ? <path d={WANT_D.dalmatia} fill="url(#hB)" fillRule="evenodd" opacity={0.85 * octT} /> : null}
              <path
                d={WANT_EDGE_D.dalmatia}
                fill="none"
                stroke={accent}
                strokeWidth={px(2.2)}
                strokeDasharray={`${px(7)} ${px(5)}`}
                strokeLinecap="round"
              />
            </g>
          ) : null}

          {/* the alliance tie, dotted: each ally's half on its ladder */}
          {tieHalf(0, Math.min(tieEnd, half), tieRungOf(rung.rome), "tieRome")}
          {tieHalf(half, tieEnd, tieRungOf(rung.belgrade), "tieBelgrade")}
          {hiDots.map((d, i) => (
            <circle key={`hi${i}`} cx={d.p[0]} cy={d.p[1]} r={px(1.5)} fill={HILITE} opacity={d.o} />
          ))}

          {/* the two desire-arrows (EverybodyWants' act-9 arrows), each on its ladder */}
          {ARROWS.map((a) => {
            const u = interpolate(frame, [a.t[0], a.t[1]], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
            if (u <= 0) return null;
            const pts = rangePts(a.pts, a.c, 0, a.L * u);
            const tip = pts[pts.length - 1];
            const prev = pts.length > 1 ? pts[pts.length - 2] : a.pts[0];
            const dl = Math.hypot(tip[0] - prev[0], tip[1] - prev[1]);
            const [dx, dy] = dl > 1e-6 ? [(tip[0] - prev[0]) / dl, (tip[1] - prev[1]) / dl] : [1, 0];
            const hs = px(12);
            const head = `M${(tip[0] - dx * hs + dy * hs * 0.62).toFixed(2)},${(tip[1] - dy * hs - dx * hs * 0.62).toFixed(2)}L${tip[0].toFixed(2)},${tip[1].toFixed(2)}L${(tip[0] - dx * hs - dy * hs * 0.62).toFixed(2)},${(tip[1] - dy * hs + dx * hs * 0.62).toFixed(2)}`;
            const headOp = smoothstep(u / 0.12);
            const op = a.italy ? rung.rome : rung.belgrade;
            const d = fmt(pts);
            return (
              <g key={a.id} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={op}>
                <path d={d} stroke={CASING} strokeOpacity={0.55} strokeWidth={px(5.4)} />
                <path d={head} stroke={CASING} strokeOpacity={0.55 * headOp} strokeWidth={px(5.4)} />
                <path d={d} stroke={accent} strokeWidth={px(2.6)} />
                <path d={head} stroke={accent} strokeOpacity={headOp} strokeWidth={px(2.6)} />
              </g>
            );
          })}

          {/* the settlement line */}
          {drawn ? (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={fmt(drawn)} stroke={CASING} strokeOpacity={0.6} strokeWidth={px(6.4)} />
              <path d={fmt(drawn)} stroke={ink} strokeWidth={px(3.4)} />
            </g>
          ) : null}

          {/* the two capitals, on their allies' ladder */}
          {dotIn > 0
            ? (
                [
                  [CITIES.rome, rung.rome],
                  [BELGRADE, rung.belgrade],
                ] as const
              ).map(([p, r], i) => (
                <circle key={`cd${i}`} cx={p.x} cy={p.y} r={grow(6)} fill={ink} stroke={CASING} strokeWidth={grow(2)} opacity={dotIn * tieRungOf(r)} />
              ))
            : null}
        </g>
      </svg>

      {/* ---------------- PAPER: grain and vignette, screen space ---------------- */}
      <Img src={staticFile(grainSrc)} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default NobodyCanSettleV2;
