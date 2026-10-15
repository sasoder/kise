import React, { useId } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  AmberGradient,
  BLOOM_LAYERS,
  COLOR,
  EDGE,
  STROKE,
  StoutStage,
  amberBandFor,
  clamp01,
  lerp,
  mixHex,
  smoothstep,
} from "./stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack, type Glide } from "./museShared";

// ---------------------------------------------------------------------------
// InsideThePintV2 — cold-review copy of InsideThePint (delivered Oct 15 2026); cut 1 of 3, Cheeky Pint S4E02 "will - guinness invented the t-test" (Will O'Brien),
// in the Cheeky Pint S4 stout system (stoutShared.tsx, palette B1). 1080x1920, 23.976 fps, opaque, no text.
//
// CHECK LINE: after this cut the viewer can say "what everyone sees as just a pint of Guinness is,
// underneath, full of technical innovation — that's what the business grew on."
//
// THE ONE MOTION: the pint fills with innovation, then the stout and head cover it. Close on the empty
// Guinness glass, an amber column rises out of the slot in its base — four segments, each carrying an ink
// innovation glyph (flask, microscope, gear, bell curve) — and the camera rises with it. A stream of stout
// falls into the glass and the surge runs DOWN through it: cream-tan particles cascading, the body
// darkening, the amber sinking by tone to warm embers. The cream head settles out of the surge at the top
// while the camera pulls back to the whole pint, the harp printed on its glass; one light sweep on "Guinness".
//
// SPOKEN (just before: "A great example of a business,"): "…largely derived from technical innovations. And
// you don't think of it, you think of just like a pint of Guinness."
// WORD -> FRAME (this composition's frame 0 = sequence 1.710 s): (silence f0-26) largely 26 · derived 31 ·
// from 43 · technical 52 · innovations 62-76 · And 83 · you 87 · don't 90 · think 97 · of it 101-105 · you 106
// · think 107 · of 110 · just 114 · like 117 · a 120 · pint 123 · of 126 · Guinness 129-138 · cut back f140.
// DURATION: sequence 1.710 -> 7.549 s = 5.839 s x 23.976 = 140 frames, + a 16-frame living tail = 156.
//
//   f0-8      close on the lower half of the empty glass (k 1.94, creeping); the slot across its floor
//   f8-86     the amber column rises out of the slot: one continuous rise (ease in, constant, long landing)
//             to 584 world px (4 x 146 segments, rungs between); the camera rises and eases out with it
//   f74-106   a stream of stout falls from above the frame into the glass (constant speed), its tail follows
//   f84-106   the surge front runs down from the rim to the floor (leading at the walls); behind it cream-tan
//             particles cascade down, the haze thins, the amber sinks by tone to embers (14 f per segment)
//   f98-126   the head settles out of the haze at the top, its lower edge rising and sharpening
//   f88-142   the pull-back to the whole pint (k -> 1.0): rim ~y 285, beer mat ~y 1150-1220, harp ~y 370-555
//   f129-139  THE ONE CLICK: a light sweep across the glass on "Guinness"
//   f140-156  living tail: particles still drifting down out of the head, slow drift, grain, light pool
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const SPAN = 140;
export const DURATION = SPAN + 16;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// --- the glass (world px; at the end camera k ~ 1 world ~ screen) -----------------------------------------
const CX = 540;
const RIM = 296; // the glass's top edge
const BOT = 1180; // its outer bottom (stands on the beer mat)
const FLOOR = 1124; // the inner floor: the top of the heavy glass base, where the slot is
const HG = BOT - RIM;
const WALL = 7;
/** The Guinness tulip: a narrow heavy foot, flaring to a gentle bulge ~30 % down from the rim, then a clear
 *  turn-in to the lip (half width; rim ~480, bulge ~564, foot ~340). */
const hwO = (y: number) => {
  const t = clamp01((BOT - y) / HG);
  return 170 + 70 * t + 62 * Math.sin(Math.PI * Math.pow(t, 1.9));
};
const hwI = (y: number) => hwO(y) - WALL;
/** The lip and the foot as thin ellipses (a slight look down onto the glass). */
const RIM_RY = 9;
const FOOT_RY = 10;
/** The beer mat the pint stands on: a round kraft mat seen in slight perspective (context, so board tone). */
const MAT = { cx: CX, cy: BOT - 2, rx: 300, ry: 34, thick: 6, ring: 0.8 } as const;

const sideYs = (y0: number, y1: number, n = 48) => Array.from({ length: n + 1 }, (_, i) => lerp(y0, y1, i / n));
/** A region between y0 and y1 bounded by a half-width profile. */
const bandPath = (y0: number, y1: number, hw: (y: number) => number) => {
  const ys = sideYs(y0, y1);
  const right = ys.map((y) => `${f3(CX + hw(y))} ${f3(y)}`);
  const left = [...ys].reverse().map((y) => `${f3(CX - hw(y))} ${f3(y)}`);
  return `M${right.join("L")}L${left.join("L")}Z`;
};
const HB = hwO(BOT);
const OUTLINE_D = (() => {
  // the outer glass: sides from the rim down to the foot, closed by the foot ellipse's front arc
  const ys = sideYs(RIM, BOT - FOOT_RY);
  const right = ys.map((y) => `${f3(CX + hwO(y))} ${f3(y)}`).join("L");
  const left = [...ys]
    .reverse()
    .map((y) => `${f3(CX - hwO(y))} ${f3(y)}`)
    .join("L");
  return `M${right}A${f3(HB)} ${FOOT_RY} 0 0 1 ${f3(CX - HB)} ${f3(BOT - FOOT_RY)}L${left}Z`;
})();
/** The heavy glass base: from the inner floor down to the foot's front arc. */
const BASE_SOLID_D = (() => {
  const ys = sideYs(FLOOR, BOT - FOOT_RY, 12);
  const right = ys.map((y) => `${f3(CX + hwO(y))} ${f3(y)}`).join("L");
  const left = [...ys]
    .reverse()
    .map((y) => `${f3(CX - hwO(y))} ${f3(y)}`)
    .join("L");
  return `M${f3(CX - hwO(FLOOR))} ${FLOOR}L${right}A${f3(HB)} ${FOOT_RY} 0 0 1 ${f3(CX - HB)} ${f3(BOT - FOOT_RY)}L${left}Z`;
})();
/** The one specular streak down the lit (left) side: a narrow band hugging the outer wall. */
const STREAK_D = (() => {
  const y0 = RIM + 34;
  const y1 = FLOOR - 70;
  const ys = sideYs(y0, y1, 40);
  const w = (y: number) => 4 + 7 * Math.sin(Math.PI * clamp01((y - y0) / (y1 - y0)));
  const inset = 16;
  const outer = ys.map((y) => `${f3(CX - hwO(y) + inset)} ${f3(y)}`);
  const inner = [...ys].reverse().map((y) => `${f3(CX - hwO(y) + inset + w(y))} ${f3(y)}`);
  return `M${outer.join("L")}L${inner.join("L")}Z`;
})();
const INTERIOR_D = bandPath(RIM, FLOOR, hwI);
const sidePath = (side: -1 | 1, y0: number, y1: number, inset = 0) =>
  `M${sideYs(y0, y1)
    .map((y) => `${f3(CX + side * (hwI(y) - inset))} ${f3(y)}`)
    .join("L")}`;

// --- the amber column: four segments rising out of the slot -------------------------------------------------
const SEG_H = 138; // V2r5: taller layers for the bigger glyphs; the column's top lands at y 572, under the harp
const N_SEG = 4;
const H_MAX = SEG_H * N_SEG; // 520: the column's top lands at y 604, under the harp
type GlyphName = "flask" | "microscope" | "gear" | "bulb";
/** V2r3: layers from the BOTTOM up (the amber fills like a liquid); each glyph drops in whole and lands on the
 *  rising surface over its layer. */
const SEG_GLYPH: GlyphName[] = ["flask", "microscope", "gear", "bulb"];
const GLYPH_SIZE = 126; // V2r5: ~1.45x (ink ~108 px world)
/** The rise: velocity eases in (f8-20), holds, and lands softly (f68-86). Integrated, normalised to H_MAX. */
/** V2r2: the column is pushed up out of the slot, one segment at a time entering from below (each glyph carried in
 *  whole through the slot), timed to the words: segment i's glyph is wholly out by KEYS (f26 "largely", f43 "from",
 *  f52 "technical", f62 "innovations"); complete and at rest by f76. Already moving by f3. A monotone cubic
 *  (Fritsch-Carlson) through the keys, zero speed at both ends. */
const LAND_F = [26, 43, 52, 62]; // V2r3: each glyph lands on the amber surface on its word
const LAND_H = 40; // the surface's height inside the layer when its glyph lands
const RISE_KEYS: [number, number][] = [
  [2, 0],
  ...LAND_F.map((f, i) => [f, i * SEG_H + LAND_H] as [number, number]),
  [76, H_MAX],
];
/** A glyph's drop: from above the rim (off frame) at a constant fall speed, onto the surface; it then settles 19 px
 *  into its layer (a short plunge) while the surface rises over it. */
const DROP = { from: 110, v: 44, settle: 11, x: 682 } as const; // V2r5: falls right of the harp, settles to centre
const layerCy = (i: number) => FLOOR - (i + 0.5) * SEG_H;
const contactY = (i: number) => FLOOR - (i * SEG_H + LAND_H) - GLYPH_SIZE / 2;
/** The fall's x at height y: right of the harp, kept clear of the glass wall by the glyph's half-ink + 8. */
const GLYPH_HALF = 0.43 * GLYPH_SIZE;
const fallX = (y: number) => Math.min(DROP.x, CX + hwI(Math.min(FLOOR, y + GLYPH_HALF)) - WALL - GLYPH_HALF - 8);
const glyphDrop = (i: number, f: number): { x: number; y: number } | null => {
  const tc = LAND_F[i];
  const yc = contactY(i);
  const ts = tc - (yc - DROP.from) / DROP.v;
  if (f < ts) return null;
  if (f < tc) {
    const y = yc - DROP.v * (tc - f);
    return { x: fallX(y), y };
  }
  // in the amber: it sinks to its layer's centre and drifts gently over to the centre line (ease out)
  const u = clamp01((f - tc) / DROP.settle);
  const e = 1 - Math.pow(1 - u, 2.4);
  return { x: lerp(fallX(yc), CX, e), y: yc + (layerCy(i) - yc) * e };
};
const RISE_M = (() => {
  const n = RISE_KEYS.length;
  const d = RISE_KEYS.slice(1).map((k, i) => (k[1] - RISE_KEYS[i][1]) / (k[0] - RISE_KEYS[i][0]));
  const m = RISE_KEYS.map((_, i) => (i === 0 || i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i])));
  return m;
})();
/** V2r4: once the stack is complete, the surface settles with a tiny damped bob (a meniscus settle). */
const bob = (f: number) => (f <= 72 ? 0 : 2.6 * Math.exp(-(f - 72) / 9) * Math.sin((f - 72) * 0.55));
export const riseH = (f: number) => {
  const K = RISE_KEYS;
  if (f <= K[0][0]) return 0;
  if (f >= K[K.length - 1][0]) return H_MAX;
  let j = 0;
  while (f > K[j + 1][0]) j++;
  const h = K[j + 1][0] - K[j][0];
  const t = (f - K[j][0]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * K[j][1] + (t3 - 2 * t2 + t) * h * RISE_M[j] + (-2 * t3 + 3 * t2) * K[j + 1][1] + (t3 - t2) * h * RISE_M[j + 1];
};

// --- the stout -------------------------------------------------------------------------------------------
const RUBY = "#5C1A12"; // the deep ruby the stout leans toward (light through a Guinness)
const STOUT = mixHex(COLOR.shadow, RUBY, 0.3); // the body: shadow brown toward ruby, never black
const STOUT_TOP = mixHex(STOUT, RUBY, 0.18);
const RUBY_GLOW = mixHex("#8A2614", COLOR.amberFoot, 0.15);
const EMBER_GLYPH = mixHex(STOUT, COLOR.amberTop, 0.94); // V2r3: the relit glyphs: fully lit amber glowing through the stout
/** V2r3: once the dark has settled over a layer, its glyph stays as a faint dark-amber silhouette in the stout. */
const GHOST_GLYPH = mixHex(STOUT, COLOR.amberFoot, 0.075);
/** V2 THE TURN: the stout closes over the glyphs (fully dark), then ONCE on "Guinness" a warm glow rises behind them
 *  and settles at the ember level (bottom glyph first, 1.5 f apart; 16 f each). */
const REVEAL = { f0: 123, each: 4.2, step: 0.3 } as const; // final: from "pint" (f123), full by ~f128, held to the cut
// (was: f0 126, each 4.6, step 0.5) // V2r4: starts on "of" (f126), full on "Guinness" (f131-132), held
const revealAt = (i: number, f: number) => smoothstep((f - REVEAL.f0 - i * REVEAL.step) / REVEAL.each);
const HAZE = mixHex(COLOR.creamFoot, COLOR.board, 0.55);
const SPECK = mixHex(COLOR.creamFoot, COLOR.board, 0.3);
/** The stream: its head falls from above the frame to the rim (constant speed), its tail follows. */
const STREAM = { x: 556, w: 32, from: -260, v: 52, head0: 67.7, tail0: 95 } as const;
/** The surge front: from just above the rim to just past the floor; it leads at the walls. */
const FRONT = { f0: 84, f1: 96, lead: 12, blur: 20, band: 0.26 } as const; // V2r2: the pour clouds the glass top to bottom
/** V2r2 THE SURGE: the whole glass goes tan and cloudy; then the dark body settles from the BOTTOM UP (the cloud
 *  line rising, ragged, particles riding it) and the cream head is what is left on top. Everything hidden by ~f117. */
// the surge's caramel tan: kraft board toward the stout below, toward cream at the top
const CLOUD = mixHex(COLOR.board, STOUT, 0.42);
const CLOUD_TOP = mixHex(COLOR.board, COLOR.creamFoot, 0.3);
/** V2r5: no cloud. The dark rises from the floor (f85-113) and covers the amber layers; the head rides its top. */
const SETTLE = { f0: 85, f1: 113 } as const;
const settleY = (f: number) => {
  const u = clamp01((f - SETTLE.f0) / (SETTLE.f1 - SETTLE.f0));
  return lerp(FLOOR + 30, 380, 1 - Math.pow(1 - u, 1.5));
};
const cloudEdge = (x: number, f: number) => 8 * Math.sin(x / 31 + f * 0.4) + 5 * Math.sin(x / 13 - f * 0.7 + 0.8);
/** The front's ragged edge (world y offset at x, frame f): a soft lead at the walls and two slow, small waves. */
const frontEdge = (x: number, f: number, hw: number) =>
  FRONT.lead * Math.pow(Math.min(1, Math.abs(x - CX) / hw), 2) + 9 * Math.sin(x / 27 + f * 0.35) + 6 * Math.sin(x / 13 - f * 0.6 + 1.3);
const frontY = (f: number) => {
  const u = clamp01((f - FRONT.f0) / (FRONT.f1 - FRONT.f0));
  return lerp(RIM - 44, FLOOR + 50, lerp(u, smoothstep(u), 0.5));
};
const HEAD = { f0: 98, f1: 114, b0: 470, b1: 380, feather0: 24, feather1: 7, apex: 274, wallY: 300 } as const;
const headAmt = (f: number) => smoothstep((f - HEAD.f0) / (HEAD.f1 - HEAD.f0));

// --- the surge particles ---------------------------------------------------------------------------------
type Speck = { u: number; y0: number; tb: number; v: number; r: number; a: number; w: number; ph: number };
/** Born out of the head's lower edge once it forms: the few that still drift down in the end frame. */
const HEAD_SPECKS: Speck[] = Array.from({ length: 70 }, (_, i) => {
  const side = random(`hs${i}`) < 0.5 ? -1 : 1;
  return {
    u: side * Math.pow(random(`hu${i}`), 0.6) * 0.9,
    y0: 0,
    tb: lerp(117, 156, random(`ht${i}`)),
    v: lerp(2.2, 4.6, random(`hv${i}`)),
    r: lerp(1.3, 2.4, random(`hr${i}`)),
    a: lerp(0.4, 0.85, random(`ha${i}`)),
    w: lerp(2, 5, random(`hw${i}`)),
    ph: random(`hp${i}`) * Math.PI * 2,
  };
});
/** Carried in the front itself: a particle-rich band riding the settling edge (most just behind it). */
const BAND_SPECKS = Array.from({ length: 260 }, (_, i) => {
  const side = random(`bs${i}`) < 0.5 ? -1 : 1;
  return {
    u: side * Math.pow(random(`bu${i}`), 0.7) * 0.95,
    o: 10 - 80 * Math.pow(random(`bo${i}`), 1.5),
    r: lerp(1.4, 3, random(`br${i}`)),
    a: lerp(0.5, 1, random(`ba${i}`)),
    w: lerp(3, 9, random(`bw${i}`)),
    ph: random(`bp${i}`) * Math.PI * 2,
  };
});
/** The surge's density: dense through the pour, thinning to a few as it settles. */
const density = (f: number) => lerp(1, 0.22, smoothstep((f - 100) / 40));

// --- the camera and the light ---------------------------------------------------------------------------
/** V2r3 CAMERA (look = the world point on the frame's middle): wide from f0 (the finished glass, rim and harp in
 *  frame, the mat's bottom at screen ~1075); a slow creep; f54-84 a gentle push up toward the harp; a slight
 *  ease back for the surge; from f116 a slow push in on the glyph column so the relit glyphs are big at the cut
 *  (the lowest glyph stays above the caption line). */
const LOOK0 = { x: CX, y: 1225 - 115 / 1.05, k: 1.05 };
const GLIDES: Glide[] = [
  // V2r5: a slow push in from f0 (the mat's bottom held at ~1075)
  { f0: -6, f1: 60, k: 1.115, dy: 6 },
  // a gentle push up toward the harp while the stack settles
  { f0: 46, f1: 76, k: 1.13, dy: -22 },
  // V2r4: ease back so the pour has room above the rim (the mat's bottom stays at ~1075)
  { f0: 64, f1: 100, k: 0.985, dy: 36, warp: 0.85 },
  // final: a slow, gentle push in on the glowing stack from f120 through the tail
  { f0: 106, f1: 124, k: 1.03, dy: -14 },
  { f0: 118, f1: 176, k: 1.2, dy: -114 },
];
export const CAM = makeClockCam(LOOK0, GLIDES, DURATION + 4);
const POOL = makePoolTrack(
  { x: CX, y: 1060 },
  [
    { f0: 8, f1: 86, x: CX, y: 720 },
    { f0: 88, f1: 136, x: CX - 10, y: 660 },
  ],
  DURATION + 4,
);

// --- the harp, printed on the glass (a clean redraw of the Brian Boru harp, facing right) -----------------
// Filled bands, as on the real glass: a broad sound box on the left running from under the scroll down to the
// foot, an S-curved neck along the top ending in a knob at its upper left, an outward-bowed forepillar on the
// right meeting the sound box in a point at the foot, strings between. Box units; ~136 x 172 ink (0.79 : 1).
type Pt = [number, number];
const cubicAt = (c: Pt[], t: number): Pt => {
  const m = 1 - t;
  return [0, 1].map((i) => m * m * m * c[0][i] + 3 * m * m * t * c[1][i] + 3 * m * t * t * c[2][i] + t * t * t * c[3][i]) as Pt;
};
/** A filled band of width w(t) along a cubic (its two offset edges joined). */
const bandAlong = (c: Pt[], w: (t: number) => number, n = 40) => {
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = cubicAt(c, t);
    const q = cubicAt(c, Math.min(1, t + 0.01));
    const o = cubicAt(c, Math.max(0, t - 0.01));
    const dx = q[0] - o[0];
    const dy = q[1] - o[1];
    const d = Math.hypot(dx, dy) || 1;
    const h = w(t) / 2;
    L.push(`${f3(p[0] - (dy / d) * h)} ${f3(p[1] + (dx / d) * h)}`);
    R.push(`${f3(p[0] + (dy / d) * h)} ${f3(p[1] - (dx / d) * h)}`);
  }
  return `M${L.join("L")}L${R.reverse().join("L")}Z`;
};
const H_NECK: Pt[] = [
  [18, 22],
  [52, -4],
  [86, 42],
  [124, 16],
];
const H_PILLAR: Pt[] = [
  [124, 16],
  [146, 70],
  [128, 140],
  [84, 179],
];
const H_BOX: Pt[] = [
  [20, 24],
  [40, 82],
  [62, 140],
  [84, 179],
];
const boxW = (t: number) => (22 + 10 * smoothstep(t / 0.22)) * (1 - 0.9 * Math.pow(t, 2.6));
const HARP_D = [
  bandAlong(H_NECK, (t) => 13 - 2 * t),
  bandAlong(H_PILLAR, (t) => 15 - 12 * Math.pow(t, 3)),
  bandAlong(H_BOX, boxW),
].join("");
/** The strings: from the sound box's inner edge, leaning a touch right, up to the neck's underside. */
const HARP_STRINGS = (() => {
  const neck = Array.from({ length: 201 }, (_, i) => cubicAt(H_NECK, i / 200));
  const neckY = (x: number) => neck.reduce((b, p) => (Math.abs(p[0] - x) < Math.abs(b[0] - x) ? p : b), neck[0])[1];
  return [0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82].map((t) => {
    const p = cubicAt(H_BOX, t);
    const q = cubicAt(H_BOX, t + 0.01);
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const d = Math.hypot(dx, dy);
    const x0 = p[0] + (dy / d) * (boxW(t) / 2 - 1);
    const y0 = p[1] - (dx / d) * (boxW(t) / 2 - 1);
    let y = y0;
    while (y > 0 && y > neckY(x0 + 0.18 * (y0 - y)) + 5) y -= 0.5;
    return `M${f3(x0)} ${f3(y0)}L${f3(x0 + 0.18 * (y0 - y))} ${f3(y)}`;
  });
})();
const HARP = { scale: 1.0, top: 390, cx: 72, inkTop: 8 } as const; // V2r5: just under the head, above the column // V2r2: ~a quarter down the glass, clear of the head
const HarpPrint: React.FC<{ color: string; opacity: number }> = ({ color, opacity }) => {
  const s = HARP.scale;
  return (
    <g transform={`translate(${f3(CX - HARP.cx * s)} ${f3(HARP.top - HARP.inkTop * s)}) scale(${s})`} opacity={opacity}>
      <path d={HARP_D} fill={color} />
      {/* the scroll: a knob at the neck's upper-left end, over the sound box's head */}
      <circle cx={14} cy={20} r={10} fill={color} />
      {/* the joint where the neck turns down into the forepillar */}
      <circle cx={124} cy={16} r={6.6} fill={color} />
      <path d={HARP_STRINGS.join("")} fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" />
    </g>
  );
};

// --- the innovation glyphs (Lucide grammar, one weight) ------------------------------------------------------
const gearD = (() => {
  const n = 8;
  const p = (Math.PI * 2) / n;
  const pt = (r: number, a: number) => `${f3(12 + r * Math.cos(a))} ${f3(12 + r * Math.sin(a))}`;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = i * p - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${pt(7.2, a - 0.3 * p)}L${pt(10, a - 0.17 * p)}L${pt(10, a + 0.17 * p)}L${pt(7.2, a + 0.3 * p)}`;
    d += `A7.2 7.2 0 0 1 ${pt(7.2, a + 0.7 * p)}`;
  }
  return `${d}Z`;
})();
const GLYPHS: Record<GlyphName, string[]> = {
  // Lucide "flask-conical"
  flask: [
    "M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2",
    "M8.5 2h7",
    "M7 16h10",
  ],
  // Lucide "microscope"
  microscope: [
    "M6 18h8",
    "M3 22h18",
    "M14 22a7 7 0 1 0 0-14h-1",
    "M9 14h2",
    "M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z",
    "M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3",
  ],
  // an eight-tooth gear with its hub
  gear: [gearD, "M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0Z"],
  // Lucide "lightbulb"
  bulb: [
    "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
    "M9 18h6",
    "M10 22h4",
  ],
};
const Glyph: React.FC<{ name: GlyphName; x?: number; cy: number; color: string; glow?: number; glowFilter?: string }> = ({ name, x = CX, cy, color, glow = 0, glowFilter }) => {
  const s = GLYPH_SIZE / 24;
  return (
    <g transform={`translate(${f3(x - 12 * s)} ${f3(cy - 12 * s)}) scale(${f3(s)})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {glow > 0.01 && glowFilter ? (
        <g stroke={COLOR.amberTop} strokeWidth={3.0} opacity={f3(0.85 * glow)} filter={glowFilter}>
          {GLYPHS[name].map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ) : null}
      <g stroke={color} strokeWidth={2.25}>
        {GLYPHS[name].map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </g>
  );
};
/** V2r4: the harp's ink, grown a little, as a black shape: a mask that keeps falling glyphs BEHIND the printed harp. */
const HarpKnock: React.FC = () => {
  const s = HARP.scale;
  return (
    <g transform={`translate(${f3(CX - HARP.cx * s)} ${f3(HARP.top - HARP.inkTop * s)}) scale(${s})`}>
      <path d={HARP_D} fill="#000" stroke="#000" strokeWidth={9} strokeLinejoin="round" />
      <circle cx={14} cy={20} r={14.5} fill="#000" />
      <circle cx={124} cy={16} r={11} fill="#000" />
      <path d={HARP_STRINGS.join("")} fill="none" stroke="#000" strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

/** The house bloom with its strength scaled (the amber's glow goes with its tone). */
const bloomScaled = (k: number, s: number) =>
  BLOOM_LAYERS.map((l) => {
    const m = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(l.color);
    const c = m ? `rgba(${m[1]},${m[2]},${m[3]},${f3(Number(m[4]) * s)})` : l.color;
    return `drop-shadow(0 0 ${f3(l.blur / k)}px ${c})`;
  }).join(" ");

const InsideThePintV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const raw = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const id = (s: string) => `itp${raw}${s}`;
  const cam = CAM.at(frame);
  const k = cam.k;
  const band = amberBandFor(cam);
  const pool = POOL(frame);

  // the column
  const H = riseH(frame);
  const top = FLOOR - H - bob(frame);
  const segs = Array.from({ length: N_SEG }, (_, i) => ({ i, cy: layerCy(i), g: glyphDrop(i, frame), rev: revealAt(i, frame) }));
  const rungs = [1, 2, 3].map((j) => FLOOR - j * SEG_H).filter((y) => y > top + 3);

  // the stout
  const F = frontY(frame);
  const poured = frame >= FRONT.f0;
  const ha = headAmt(frame);
  // the head rides on the stout's top: it starts as the dark passes HEAD.b0 and thickens up to the rim
  const D0 = settleY(frame);
  const hb = Math.max(D0, HEAD.b1);
  const headOn = frame >= SETTLE.f0 && D0 < HEAD.b0 + 6;
  const grow = smoothstep((HEAD.b0 + 6 - D0) / (HEAD.b0 - HEAD.b1)) * 0.55 + 0.45 * ha;
  const headTop = lerp(hb, HEAD.wallY, grow);
  const dome = smoothstep((ha - 0.6) / 0.4);
  const feather = lerp(HEAD.feather0, HEAD.feather1, ha);
  const headD = (() => {
    const ys = sideYs(headTop, hb, 16);
    const right = ys.map((y) => `${f3(CX + hwI(y))} ${f3(y)}`).join("L");
    const left = [...ys].reverse().map((y) => `${f3(CX - hwI(y))} ${f3(y)}`).join("L");
    return `M${f3(CX - hwI(headTop))} ${f3(headTop)}Q${CX} ${f3(headTop - 26 * dome)} ${f3(CX + hwI(headTop))} ${f3(headTop)}L${right}L${left}Z`;
  })();
  const frontD = (() => {
    const xs = Array.from({ length: 81 }, (_, i) => CX - 400 + i * 10);
    const hw = hwI(Math.min(FLOOR, Math.max(RIM, F)));
    const pts = xs.map((x) => `${f3(x)} ${f3(F + frontEdge(x, frame, hw))}`);
    return `M${CX - 400} ${RIM - 400}H${CX + 400}L${[...pts].reverse().join("L")}Z`;
  })();
  // the surge's settle line (the dark rising from the floor) and the cloud above it
  const D = settleY(frame);
  const settling = frame >= SETTLE.f0;
  const darkD = (() => {
    const xs = Array.from({ length: 81 }, (_, i) => CX - 400 + i * 10);
    const pts = xs.map((x) => `${f3(x)} ${f3(D + cloudEdge(x, frame))}`);
    return `M${pts.join("L")}L${CX + 400} ${FLOOR + 400}H${CX - 400}Z`;
  })();
  const cloudD = (() => {
    const xs = Array.from({ length: 81 }, (_, i) => CX - 400 + i * 10);
    const pts = xs.map((x) => `${f3(x)} ${f3((settling ? D : FLOOR + 60) + cloudEdge(x, frame))}`);
    return `M${CX - 400} ${RIM - 400}H${CX + 400}L${[...pts].reverse().join("L")}Z`;
  })();
  // the stream
  const sHead = STREAM.from + STREAM.v * (frame - STREAM.head0);
  // V2r4: the pour stops at its source: the stream thins and its lower end leaves upward, off the top of the frame
  const STOP = { f0: 97, v: 46 } as const;
  const stopU = clamp01((frame - STOP.f0) / 7);
  const surfaceY = Math.min(top, settleY(frame)) + 6;
  const sBottom = Math.min(sHead, surfaceY) - Math.max(0, frame - STOP.f0) * STOP.v;
  const frameTop = cam.y - 960 / cam.k;
  const streamOn = sHead > STREAM.from && sBottom > frameTop - 10;
  // V2: the stream as liquid: it narrows as it falls, its width breathes and its line wobbles a little;
  // a rounded drop leads it and the tail thins to a thread
  const streamD = (() => {
    const yTop = STREAM.from - 40;
    const yBot = sBottom;
    if (yBot - yTop < 2) return { body: "", lit: "" };
    const n = 40;
    const L: string[] = [];
    const Rr: string[] = [];
    const lit: string[] = [];
    for (let j = 0; j <= n; j++) {
      const y = lerp(yTop, yBot, j / n);
      const fall = clamp01((y - STREAM.from) / (RIM + 26 - STREAM.from));
      let w = lerp(42, 28, fall) * (1 + 0.12 * Math.sin(y / 23 + frame * 1.3) + 0.06 * Math.sin(y / 9 - frame * 2.1));
      // as it stops it thins; the head rounds off, and the retreating lower end tapers to a thread
      w *= 1 - 0.7 * stopU;
      if (sHead < surfaceY || frame > STOP.f0) w *= Math.sqrt(clamp01((yBot - y) / (w / 2 + 0.01)) * 0.9 + 0.1);
      const xc = STREAM.x + 3 * Math.sin(y / 41 - frame * 0.9) + 1.5 * Math.sin(y / 17 + frame * 1.7);
      L.push(`${f3(xc - w / 2)} ${f3(y)}`);
      Rr.push(`${f3(xc + w / 2)} ${f3(y)}`);
      lit.push(`${f3(xc - w / 2 + 3)} ${f3(y)}`);
    }
    return { body: `M${L.join("L")}L${Rr.reverse().join("L")}Z`, lit: `M${lit.join("L")}` };
  })();
  const churn = smoothstep((sHead - surfaceY) / 20) * (1 - smoothstep((frame - STOP.f0) / 3));

  // the shadow: glass (faint) and its contents (heavier as it fills): one object
  const contentA = lerp(0.42, 0.7, smoothstep((frame - SETTLE.f0) / (SETTLE.f1 - SETTLE.f0)));
  const sil = [
    { d: OUTLINE_D, a: 0.3 },
    // the poured stout above the column, and the column
    // (counted once the front has reached the column: above empty glass its offset shadow would smudge through)
    ...(settling && D < top ? [{ d: bandPath(Math.max(RIM, D), top, hwI), a: 0.7 }] : []),
    ...(H > 0.5 ? [{ d: bandPath(top, FLOOR, hwI), a: contentA }] : []),
  ];

  const hair = STROKE.HAIRLINE / k;
  // the base refracts what is above it: amber while the column stands lit, a ruby glow once the stout is down
  const sunkFloor = smoothstep((frame - SETTLE.f0) / 8);
  const baseTint = mixHex(COLOR.amberTop, RUBY_GLOW, sunkFloor);
  const baseA = smoothstep((frame + 4) / 8) * lerp(0.32, 0.5, sunkFloor); // V2r4: the base lights amber first (f-4..4)
  const slotGlow = smoothstep((frame + 2) / 6) * (1 - smoothstep((frame - FRONT.f1) / 8));
  // the hot highlight on the lip's front arc, on its lit (left) quarter
  const lipHotD = (() => {
    const rx = hwO(RIM);
    const pts = Array.from({ length: 21 }, (_, i) => {
      const a = Math.PI * (0.8 + 0.17 * (i / 20)); // angle along the front arc: its lit left end
      return `${f3(CX + rx * Math.cos(a))} ${f3(RIM + RIM_RY * Math.sin(a))}`;
    });
    return `M${pts.join("L")}`;
  })();

  const specks = (list: Speck[], head: boolean) => (
    <g fill={SPECK}>
      {list.map((p, i) => {
        if (frame < p.tb) return null;
        const t = frame - p.tb;
        // a speck is born on the front (or just inside the head's lower edge) and cascades down
        const y = (head ? hb - 6 : p.y0) + p.v * t;
        if (y > FLOOR + 4) return null;
        const x = CX + p.u * hwI(y) + p.w * Math.sin(p.ph + t / 9);
        // the surge thins as it settles; the few out of the head keep their strength
        const a = p.a * (head ? 1 : density(frame));
        return <circle key={i} cx={f3(x)} cy={f3(y)} r={f3(p.r)} opacity={f3(clamp01(a))} />;
      })}
    </g>
  );

  return (
    <AbsoluteFill>
      <StoutStage S={frame} cam={cam} rest={CAM.rest} pool={{ x: pool.x, y: pool.y, strength: pool.strength }}>
        <defs>
          <clipPath id={id("in")}>
            <path d={INTERIOR_D} />
          </clipPath>
          <clipPath id={id("out")}>
            <path d={OUTLINE_D} />
          </clipPath>
          <filter id={id("fb")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={FRONT.blur} />
          </filter>
          {/* the surge front: white above it (the poured stout), black below (still lit amber / air) */}
          <mask id={id("above")} maskUnits="userSpaceOnUse" x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700}>
            <rect x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700} fill="#000" />
            {poured ? <path d={frontD} fill="#fff" filter={`url(#${id("fb")})`} /> : null}
          </mask>
          <mask id={id("below")} maskUnits="userSpaceOnUse" x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700}>
            <rect x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700} fill="#fff" />
            {poured ? <path d={frontD} fill="#000" filter={`url(#${id("fb")})`} /> : null}
          </mask>
          {/* the ruby edge exists only where the stout is: it trails the front's centre */}
          <linearGradient id={id("rubyG")} gradientUnits="userSpaceOnUse" x1="0" y1={f3(F - 150)} x2="0" y2={f3(F - 30)}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id={id("rubyM")} maskUnits="userSpaceOnUse" x={CX - 420} y={RIM - 100} width={840} height={FLOOR - RIM + 200}>
            <rect x={CX - 420} y={RIM - 100} width={840} height={FLOOR - RIM + 200} fill={`url(#${id("rubyG")})`} />
          </mask>
          <AmberGradient id={id("amb")} y0={band[0]} y1={band[1]} />
          <linearGradient id={id("hotf")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
            <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("stout")} gradientUnits="userSpaceOnUse" x1="0" y1={RIM} x2="0" y2={FLOOR}>
            <stop offset="0" stopColor={STOUT_TOP} />
            <stop offset="0.45" stopColor={STOUT} />
            <stop offset="1" stopColor={STOUT} />
          </linearGradient>
          <linearGradient id={id("cloud")} gradientUnits="userSpaceOnUse" x1="0" y1={RIM} x2="0" y2={FLOOR}>
            <stop offset="0" stopColor={CLOUD_TOP} />
            <stop offset="1" stopColor={CLOUD} />
          </linearGradient>
          <filter id={id("cb")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={12} />
          </filter>
          <radialGradient id={id("halo")}>
            <stop offset="0" stopColor={COLOR.amberTop} stopOpacity="0.5" />
            <stop offset="0.55" stopColor={COLOR.amberFoot} stopOpacity="0.28" />
            <stop offset="1" stopColor={COLOR.amberFoot} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("diffuse")}>
            <stop offset="0" stopColor={COLOR.amberFoot} stopOpacity="0.2" />
            <stop offset="1" stopColor={COLOR.amberFoot} stopOpacity="0" />
          </radialGradient>
          <filter id={id("gglow")} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={1.2} />
          </filter>
          <mask id={id("harpK")} maskUnits="userSpaceOnUse" x={-1000} y={-2000} width={3080} height={5000}>
            <rect x={-1000} y={-2000} width={3080} height={5000} fill="#fff" />
            <HarpKnock />
          </mask>
          <mask id={id("darkM")} maskUnits="userSpaceOnUse" x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 900}>
            <rect x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 900} fill="#000" />
            {settling ? <path d={darkD} fill="#fff" filter={`url(#${id("cb")})`} /> : null}
          </mask>
          <clipPath id={id("aboveSurf")}>
            <rect x={CX - 600} y={-2000} width={1200} height={f3(top + 2000)} />
          </clipPath>
          <clipPath id={id("belowSurf")}>
            <rect x={CX - 600} y={f3(top)} width={1200} height={f3(FLOOR + 400 - top)} />
          </clipPath>
          <mask id={id("cloudM")} maskUnits="userSpaceOnUse" x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700}>
            <rect x={CX - 420} y={RIM - 500} width={840} height={FLOOR - RIM + 700} fill="#000" />
            <path d={cloudD} fill="#fff" filter={`url(#${id("cb")})`} />
          </mask>
          <linearGradient id={id("head")} gradientUnits="userSpaceOnUse" x1="0" y1={f3(headTop - 26 * dome)} x2="0" y2={f3(hb)}>
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset={f3(clamp01(1 - feather / Math.max(1, hb - headTop + 26 * dome)))} stopColor={COLOR.creamFoot} />
            <stop offset="1" stopColor={COLOR.creamFoot} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("mat")} gradientUnits="userSpaceOnUse" x1="0" y1={MAT.cy - MAT.ry} x2="0" y2={MAT.cy + MAT.ry}>
            <stop offset="0" stopColor={COLOR.boardFoot} />
            <stop offset="1" stopColor={COLOR.board} />
          </linearGradient>
          <linearGradient id={id("base")} gradientUnits="userSpaceOnUse" x1="0" y1={FLOOR} x2="0" y2={BOT}>
            <stop offset="0" stopColor={COLOR.glass} stopOpacity="0.26" />
            <stop offset="0.35" stopColor={COLOR.glass} stopOpacity="0.1" />
            <stop offset="1" stopColor={COLOR.glass} stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={id("streak")} gradientUnits="userSpaceOnUse" x1="0" y1={RIM + 34} x2="0" y2={FLOOR - 70}>
            <stop offset="0" stopColor={COLOR.edge} stopOpacity="0" />
            <stop offset="0.2" stopColor={COLOR.edge} stopOpacity="0.42" />
            <stop offset="0.6" stopColor={COLOR.edge} stopOpacity="0.3" />
            <stop offset="1" stopColor={COLOR.edge} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id("ruby")} gradientUnits="userSpaceOnUse" x1={CX - 300} y1="0" x2={CX + 300} y2="0">
            <stop offset="0" stopColor={RUBY_GLOW} stopOpacity="0.62" />
            <stop offset="1" stopColor={RUBY_GLOW} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={id("stream")} gradientUnits="userSpaceOnUse" x1={STREAM.x - STREAM.w / 2} y1="0" x2={STREAM.x + STREAM.w / 2} y2="0">
            <stop offset="0" stopColor={RUBY_GLOW} />
            <stop offset="0.35" stopColor={STOUT_TOP} />
            <stop offset="1" stopColor={STOUT} />
          </linearGradient>
        </defs>

        {/* 1. the beer mat on the ground: its one shadow, its thickness, its face, a printed inner ring */}
        <ellipse cx={MAT.cx + 3} cy={MAT.cy + MAT.thick + 4} rx={MAT.rx} ry={MAT.ry} fill={COLOR.shadow} opacity={0.42} style={{ filter: "blur(5px)" }} />
        <ellipse cx={MAT.cx} cy={MAT.cy + MAT.thick} rx={MAT.rx} ry={MAT.ry} fill={mixHex(COLOR.boardFoot, COLOR.shadow, 0.35)} />
        <rect x={MAT.cx - MAT.rx} y={MAT.cy} width={MAT.rx * 2} height={MAT.thick} fill={mixHex(COLOR.boardFoot, COLOR.shadow, 0.35)} />
        <ellipse cx={MAT.cx} cy={MAT.cy} rx={MAT.rx} ry={MAT.ry} fill={`url(#${id("mat")})`} />
        <ellipse cx={MAT.cx} cy={MAT.cy} rx={MAT.rx * MAT.ring} ry={MAT.ry * MAT.ring} fill="none" stroke={COLOR.cream} strokeOpacity={0.55} strokeWidth={f3(2 / k)} />
        <path d={`M${MAT.cx - MAT.rx} ${MAT.cy}A${MAT.rx} ${MAT.ry} 0 0 0 ${MAT.cx + MAT.rx} ${MAT.cy}`} fill="none" stroke={COLOR.edge} strokeOpacity={0.35} strokeWidth={f3(EDGE.CREAM / k)} />

        {/* 2. the pint's one shadow (glass + contents), and its contact shadow on the mat under the foot */}
        <UnionShadow sil={sil} s={2.4} elevation="rest" contact={null} />
        <ellipse cx={CX + 14} cy={BOT - 1} rx={HB * 1.06} ry={FOOT_RY * 1.4} fill={COLOR.shadow} opacity={0.62} style={{ filter: "blur(5px)" }} />

        {/* 3. the glass body: a faint tint, the heavy base a little more */}
        <path d={OUTLINE_D} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
        {/* the lip's back arc, seen through the glass */}
        <path d={`M${f3(CX - hwO(RIM))} ${RIM}A${f3(hwO(RIM))} ${RIM_RY} 0 0 1 ${f3(CX + hwO(RIM))} ${RIM}`} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassLo} strokeWidth={f3(hair)} />
        {/* the heavy base: solid glass, lighter than the body; the liquid above it refracts down into it */}
        <path d={BASE_SOLID_D} fill={`url(#${id("base")})`} />
        {baseA > 0.002 ? (
          <path d={BASE_SOLID_D} fill={baseTint} fillOpacity={f3(baseA)} style={{ mixBlendMode: "screen" }} />
        ) : null}
        <path d={`M${f3(CX - HB)} ${f3(BOT - FOOT_RY)}A${f3(HB)} ${FOOT_RY} 0 0 1 ${f3(CX + HB)} ${f3(BOT - FOOT_RY)}`} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassLo} strokeWidth={f3(hair)} />

        {/* 4. the amber column (V2r3: never eaten; the cloud forms over it, the dark settles over it in place) */}
        {H > 0.3 ? (
          <g style={{ filter: bloomScaled(k, 1) }}>
            <g>
              <g clipPath={`url(#${id("in")})`}>
                <rect x={CX - 320} y={f3(top)} width={640} height={f3(H)} fill={`url(#${id("amb")})`} />
                <rect x={CX - 320} y={f3(top)} width={640} height={f3(EDGE.HOT_FALL / k)} fill={`url(#${id("hotf")})`} />
                <line x1={CX - 320} x2={CX + 320} y1={f3(top + EDGE.HOT / k / 2)} y2={f3(top + EDGE.HOT / k / 2)} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
                <g stroke={COLOR.rung} strokeWidth={f3(hair)}>
                  {rungs.map((y) => (
                    <line key={y} x1={CX - 320} x2={CX + 320} y1={f3(y)} y2={f3(y)} />
                  ))}
                </g>
                {/* the landed part of each glyph: ink, inside the amber */}
                <g clipPath={`url(#${id("belowSurf")})`}>
                  {segs.map((s) => (s.g ? <Glyph key={s.i} name={SEG_GLYPH[s.i]} x={s.g.x} cy={s.g.y} color={COLOR.inkDark} /> : null))}
                </g>
              </g>
            </g>
          </g>
        ) : null}
        {/* the falling glyphs: whole, cream (lit), dropping from above the rim at a constant speed; the part above the
            surface stays cream until the amber rises over it */}
        <g clipPath={`url(#${id("aboveSurf")})`}>
          {segs.map((s) => (s.g && frame < LAND_F[s.i] + 14 ? <Glyph key={s.i} name={SEG_GLYPH[s.i]} x={s.g.x} cy={s.g.y} color={COLOR.inkCream} /> : null))}
        </g>

        {settling ? (
          <g mask={`url(#${id("darkM")})`}>
            <g clipPath={`url(#${id("in")})`}>
              <rect x={CX - 320} y={RIM - 4} width={640} height={FLOOR - RIM + 8} fill={`url(#${id("stout")})`} />
              {segs.map((s) =>
                s.rev > 0.001 ? (
                  <g key={`h${s.i}`} opacity={f3(s.rev)}>
                    {/* warm light diffusing into the stout, and a tight round halo hugging the glyph */}
                    <circle cx={CX} cy={f3(s.cy)} r={170} fill={`url(#${id("diffuse")})`} />
                    <circle cx={CX} cy={f3(s.cy)} r={86} fill={`url(#${id("halo")})`} />
                  </g>
                ) : null,
              )}
              {segs.map((s) => (
                <Glyph key={s.i} name={SEG_GLYPH[s.i]} cy={s.cy} color={mixHex(GHOST_GLYPH, EMBER_GLYPH, s.rev)} glow={s.rev} glowFilter={`url(#${id("gglow")})`} />
              ))}
              <g fill="none" stroke={`url(#${id("ruby")})`} strokeWidth={40} style={{ filter: "blur(12px)" }}>
                <path d={sidePath(-1, RIM, FLOOR)} />
                <path d={sidePath(1, RIM, FLOOR)} />
              </g>
              {specks(HEAD_SPECKS, true)}
            </g>
          </g>
        ) : null}
        {settling ? (
          <g clipPath={`url(#${id("in")})`} fill={SPECK}>
            {BAND_SPECKS.map((p, i) => {
              // a thin band of fine surge particles riding just above the rising dark line (inside the amber); where
              // the dark is rising through the air above the column they ride just under its surface instead
              const inAir = D < top;
              const y = D + (inAir ? -p.o * 0.4 + 4 : p.o * 0.45 - 4) + 2 * Math.sin(p.ph + frame / 3);
              if (y < RIM + 4 || y > FLOOR || y < D - 40) return null;
              const x = CX + p.u * hwI(y) + p.w * Math.sin(p.ph + frame / 7);
              return <circle key={i} cx={f3(x)} cy={f3(y + cloudEdge(x, frame) * 0.5)} r={f3(p.r * 0.75)} opacity={f3(p.a * (1 - smoothstep((frame - SETTLE.f1 + 4) / 5)))} />;
            })}
          </g>
        ) : null}

        {/* 6. the head: forms on the top of the rising stout and rides it up; when the dark reaches the top, it domes
            a touch above the rim */}
        {headOn ? (
          <path d={headD} fill={`url(#${id("head")})`} />
        ) : null}
        {headOn && dome > 0.5 ? (
          <path
            d={`M${f3(CX - hwI(headTop) + 6)} ${f3(headTop + 0.8)}Q${CX} ${f3(headTop - 26 * dome + EDGE.CREAM / k)} ${f3(CX + hwI(headTop) - 6)} ${f3(headTop + 0.8)}`}
            fill="none"
            stroke={COLOR.edge}
            strokeOpacity={f3(ALPHA.edge * smoothstep((dome - 0.5) / 0.5))}
            strokeWidth={f3(EDGE.CREAM / k)}
          />
        ) : null}

        {/* 7. the stream of stout falling into the glass */}
        {streamOn ? (
          <g>
            <path d={streamD.body} fill={`url(#${id("stream")})`} />
            <path d={streamD.lit} fill="none" stroke={mixHex(RUBY_GLOW, COLOR.cream, 0.35)} strokeOpacity={0.75} strokeWidth={f3(1.6 / k)} strokeLinecap="round" />
          </g>
        ) : null}
        {/* the churn where the stream meets the surface: a small tan swirl and a few specks, while it pours */}
        {churn > 0.01 ? (
          <g clipPath={`url(#${id("in")})`}>
            <ellipse cx={STREAM.x} cy={f3(surfaceY + 8)} rx={f3(26 + 6 * Math.sin(frame * 0.9))} ry={9} fill={HAZE} opacity={f3(0.55 * churn)} style={{ filter: "blur(4px)" }} />
            <g fill={SPECK}>
              {Array.from({ length: 14 }, (_, i) => {
                const a = random(`ch${i}`) * Math.PI * 2 + frame * (0.25 + 0.2 * random(`cv${i}`));
                const r = 10 + 26 * random(`cr${i}`);
                return <circle key={i} cx={f3(STREAM.x + Math.cos(a) * r)} cy={f3(surfaceY + 8 + Math.sin(a) * r * 0.35 + 4)} r={f3(1.6 + random(`cs${i}`))} opacity={f3(0.85 * churn)} />;
              })}
            </g>
          </g>
        ) : null}

        {/* 8. the slot across the floor, the floor's hairline, the column's foot occlusion */}
        <rect x={f3(CX - hwI(FLOOR) - 2 / k)} y={f3(FLOOR - EDGE.SLOT / k / 2)} width={f3(2 * hwI(FLOOR) + 4 / k)} height={f3(EDGE.SLOT / k)} fill={mixHex(COLOR.inkDark, COLOR.amberFoot, 0.75 * slotGlow * (H < 6 ? 1 : 0.4))} fillOpacity={f3(lerp(ALPHA.slot, 0.9, slotGlow))} />
        {H > 0.3 && !(poured && F > FLOOR) ? (
          <g clipPath={`url(#${id("in")})`}>
            <rect x={CX - 320} y={f3(FLOOR - Math.min(H, EDGE.FOOT_AO / k))} width={640} height={f3(Math.min(H, EDGE.FOOT_AO / k))} fill={COLOR.shadow} fillOpacity={ALPHA.footAO} />
          </g>
        ) : null}

        {/* 9. the glass: the wall's inner face, the one specular streak, the hairline, the lip, the harp printed on it */}
        <g fill="none" stroke={COLOR.glass} strokeOpacity={0.22} strokeWidth={f3(hair)}>
          <path d={sidePath(-1, RIM + RIM_RY, FLOOR)} />
          <path d={sidePath(1, RIM + RIM_RY, FLOOR)} />
        </g>
        <path d={STREAK_D} fill={`url(#${id("streak")})`} style={{ filter: "blur(1.2px)" }} />
        <path d={OUTLINE_D} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} strokeLinejoin="round" />
        <path d={`M${f3(CX - hwI(FLOOR))} ${FLOOR}H${f3(CX + hwI(FLOOR))}`} stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} />
        {/* the lip: its front arc, with the hot highlight where the key light catches it (upper left) */}
        <path d={`M${f3(CX + hwO(RIM))} ${RIM}A${f3(hwO(RIM))} ${RIM_RY} 0 0 1 ${f3(CX - hwO(RIM))} ${RIM}`} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair * 1.4)} />
        <path d={lipHotD} fill="none" stroke={COLOR.edge} strokeOpacity={0.9} strokeWidth={f3((EDGE.HOT * 1.2) / k)} strokeLinecap="round" />
        <HarpPrint color={COLOR.inkCream} opacity={0.92} />

      </StoutStage>
    </AbsoluteFill>
  );
};

export default InsideThePintV2;
