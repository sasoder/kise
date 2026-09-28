import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, camEase, clamp, clamp01, smoothstep, sway } from "./fieldShared";
// The 1914 world of EverybodyWants, read-only: its palette, projection, its
// Dalmatia want (ww1Overlay.ts) and its baked static map. The static layers
// are rasters: one Adriatic crop of the same stack baked for this piece by
// scripts/bake-settle-rasters.mjs (public/ww1settle/, settleLevels.ts), and
// EverybodyWants' britain crop (public/ww1/) for the eased-back end. The
// settlement line's limits, the arrows' target and Belgrade come from
// scripts/build-settle-geometry.mjs (settleGeometry.ts).
import { CITIES, WANT_D, WANT_EDGE_D } from "./ww1Overlay";
import { LEVELS, type Level } from "./ww1Levels";
import { SETTLE_LEVELS } from "./settleLevels";
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
// THE HISTORY. Inside one alliance, two allies wanted the same coast. Italy
// demanded all of Dalmatia as its price for joining the Entente in 1915; the
// secret Treaty of London (26 April 1915, art. 5) gave it the northern part,
// from Lisarica and Tribanj to Cape Planka (with Zara and Sebenico) and most
// of the islands. Serbia, the Entente's first cause and Russia's client,
// claimed all of Dalmatia for a South Slav state. So two allies wanted one
// coast, and no line down it could satisfy both. The piece hatches the whole
// Dalmatian shape of EverybodyWants (Italy's demand, and Serbia's), which
// reads at this scale; the treaty's northern half is not drawn separately.
// UNVERIFIED (from memory, not sourced here): that Serbia put the claim
// formally in the Nis Declaration (Dec 1914), and that Sazonov argued the Serb
// case in the London bargaining.
//
// THE DWARKESH MAP STYLE, exactly as EverybodyWants: opaque 1080x1920, sea
// #1B2226 with engraved water-lines, land #3F3428 with the rim #6A5838, cream
// ink #E9DDBF, world-space mottle + screen-space grain, vignette 0.55. The
// orange #FFB000 / #D98A0C means WANTED TERRITORY and nothing else: the one
// Dalmatia hatch (EverybodyWants' +45 deg, 11 px octaves) with its dashed
// edge, and the two desire-arrows (EverybodyWants' act-9 arrows), which mean
// the same thing. No text at all: none of Italy, Serbia, Dalmatia, Rome or
// Belgrade is spoken in this line.
//   weights  settlement line 3.4 px solid cream over a 6.4 px dark casing
//            (2x the 1.7 px 1914 border); arrow 2.6 px over a 5.4 px casing,
//            12 px head; tie 2.6 px dotted; want edge 2.2 px dashed; capital
//            dot r 6
//   ladder   the hatch full throughout (the land is always wanted). Each
//            ally's arrow full unless the coast is on the other ally's side
//            of the line, then 0.15, easing over ~6 f as the line passes (so
//            near s = 0 both are full); its capital dot and its half of the
//            tie follow, floored at 0.3; context = the baked map
//
// THE ONE MOTION: a settlement line swings across the coast and never comes
// to rest. Its position is one parameter s in [-1, +1]: at -1 it lies just
// inland of the Dalmatian strip (the coast on Italy's, seaward, side), at +1
// just seaward of the outer islands (the coast on Serbia's, inland, side).
// s(f) = A(f) sin(phi(f)): phi and A are monotone Hermite splines through the
// swing's extremes, so the swing is one C1 damped motion, not a keyframed
// list. Each station of the line samples s a little in the past, the ends
// 3.5 f behind the middle, so the line bows with its own motion.
//
// THE GESTURES, each with its frames and word. Nothing else.
//   1. f0-56   open on the Adriatic, k 3.3 creeping to 3.45 by f181: Rome, the
//      Dalmatian coast (y ~835) and Belgrade in frame, the coast already
//      hatched. On "settle" (f39) the settlement line draws on from its NW
//      (Istrian) end at s = 0, complete by f56
//                                      — "one of the reasons nobody can settle"
//   2. f60-81  the Rome <-> Belgrade tie draws on, dotted, bowed south under the
//      coast, each capital's dot rising as it starts. The line holds near
//      s = 0 with a slight drift (|s| <= ~0.05 to f110)
//                                                 — "within your alliance system"
//   3. f95-125 the two desire-arrows draw on at FULL, bowed north, nose to
//      nose on the coast: Rome's f95-113, Belgrade's f105-125. Two allies
//      pointing at one piece of land      — "you cannot come up with"
//   4. f112-181 the first real swing: s = -0.95 at f145 ("with a" /
//      "settlement": the coast on Italy's side, Belgrade's arrow 0.15), +0.85
//      at f166 ("satisfy": Belgrade's side, Rome's 0.15), -0.72 at f181
//      ("everyone": Rome's). The dots and tie halves follow (floor 0.3)
//                     — "a settlement that will satisfy everyone"
//   5. f181-245 the camera eases back gently (k 3.45 -> 2.95, f181-203,
//      landed ~f209, ahead of "alliance" f213); the line keeps swinging,
//      slower and smaller (s +0.52 f207, -0.46 f233), never resolving, the
//      arrows trading the light only in part now; a faint highlight travels
//      the tie Rome -> Belgrade from f190               — "within your alliance"
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
  lineDraw: [39, 56] as const, // "settle" f39
  tie: [60, 81] as const, // "within your alliance system"
  arrowRome: [95, 113] as const, // "you cannot come up with"
  arrowBelgrade: [105, 125] as const,
  ease: [181, 203] as const, // "everyone" -> "within your alliance"
  hilite: 190,
};

// ---------------------------------------------------------------------------
// THE SWING: s(f) = A(f) sin(phi(f)). Knots at the extremes (phi = -pi/2 + m pi):
// the line is still at s = 0 until f56, then drifts, swings, and keeps swinging.
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
// Phase knots at the swing's extremes (phi = -pi/2 + m pi): Italy's side f145
// ("with a" / "settlement"), Belgrade's f166 ("satisfy"), Rome's f181
// ("everyone"), then slower through the hold (f207, f233, f259). The
// amplitude is its own spline: a slight drift (0.12) until f112, so the line
// holds near s = 0 while both arrows draw on at full, then 0.95 at the first
// extreme, shrinking to ~0.45 and never to 0.
const PHASE: [number, number][] = [
  [56, -PI],
  [145, -PI / 2],
  [166, PI / 2],
  [181, (3 * PI) / 2],
  [207, (5 * PI) / 2],
  [233, (7 * PI) / 2],
  [259, (9 * PI) / 2],
];
const AMPS: [number, number][] = [
  [56, 0.12],
  [112, 0.12],
  [145, 0.95],
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
// THE LADDER. An ally's arrow is full unless the coast has gone to the other
// ally's side: it eases to LOW as the other's share of the coast runs from
// 0.55 to 0.85 (the line from s ~0.1 to ~0.7 past the middle, ~6 f at the
// swing's speed). So near s = 0 both arrows are full: the conflict. It reads
// the line 3 f late, so the arrows answer its passage rather than lead it.
// The capital dot and the ally's half of the tie follow the same ladder,
// floored at TIE_FLOOR so both capitals stay findable.
export const allyRung = (share: number) => 1 - (1 - LOW) * smoothstep((1 - share - 0.55) / 0.3);
export const tieRungOf = (rung: number) => TIE_FLOOR + ((1 - TIE_FLOOR) * (rung - LOW)) / (1 - LOW);
const REACT = 3;

// ---------------------------------------------------------------------------
// THE CAMERA: centred on the Adriatic between Rome and Belgrade, the coast on
// y 835 (cy = c + CAM_LIFT / k), a slow creep in, then one gentle ease back.
// A keyed log-k track damped by the house spring, so it is C1 and lands ~6 f
// after its target.
// ---------------------------------------------------------------------------
const CX = (CITIES.rome.x + BELGRADE.x) / 2;
const CC = 1128;
const K_OPEN = 3.3;
const K_CLOSE = 3.45;
const K_BACK = 2.95;
const K_END = 3.0;
const creep = (u: number) => {
  const v = clamp01(u);
  return v * v * (1.5 - 0.5 * v);
};
const kTarget = (f: number) => {
  if (f <= T.ease[0]) return K_OPEN * Math.pow(K_CLOSE / K_OPEN, creep(f / T.ease[0]));
  if (f < T.ease[1]) return K_CLOSE * Math.pow(K_BACK / K_CLOSE, camEase((f - T.ease[0]) / (T.ease[1] - T.ease[0]), 0.85));
  return K_BACK * Math.pow(K_END / K_BACK, creep((f - T.ease[1]) / (DURATION - T.ease[1])));
};
export const CAM_TRACK = (() => {
  const out: { k: number; cx: number; cy: number }[] = [];
  let lk = Math.log(kTarget(0));
  let vk = 0;
  for (let f = 0; f <= DURATION; f++) {
    if (f > 0) {
      vk += (Math.log(kTarget(f)) - lk) * CAM_STIFF - vk * CAM_DAMP;
      lk += vk;
    }
    const k = Math.exp(lk);
    out.push({ k, cx: CX, cy: CC + CAM_LIFT / k });
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE STATIC MAP, a raster LOD stack: each frame picks the level whose bake
// zoom is nearest (in log) its k, the piece's Adriatic crop or EverybodyWants'
// britain crop. The crop is at 1 through the frames it is picked for and fades
// out over the 4 frames after, over the britain crop, and is baked to cover
// those frames too. The britain crop covers every frame and is drawn only when
// the crop is not fully opaque.
// ---------------------------------------------------------------------------
export const CROPS = [{ name: "adriatic", kBake: 3.4, s: 3.55 }] as const;
const BRITAIN = LEVELS.find((L) => L.name === "britain") as Level;
const FADE = 4;
/** For each crop, the first and last frame it is picked for. */
export const CROP_RUNS: { name: string; f0: number; f1: number }[] = (() => {
  const cands = [...CROPS.map((c) => ({ name: c.name as string, kBake: c.kBake })), { name: "britain", kBake: BRITAIN.kBake }];
  const pick = CAM_TRACK.map(({ k }) => cands.reduce((b, c) => (Math.abs(Math.log(k / c.kBake)) < Math.abs(Math.log(k / b.kBake)) ? c : b)).name);
  return CROPS.map((c) => {
    const fs = pick.map((p, f) => (p === c.name ? f : -1)).filter((f) => f >= 0);
    return { name: c.name, f0: fs.length ? fs[0] : -1, f1: fs.length ? fs[fs.length - 1] : -2 };
  });
})();
const cropOp = (name: string, f: number) => {
  const r = CROP_RUNS.find((c) => c.name === name);
  if (!r || r.f0 < 0 || f < r.f0) return 0;
  if (f <= r.f1) return 1;
  return f === DURATION ? 0 : smoothstep((r.f1 + FADE + 1 - f) / FADE);
};

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

// The alliance tie, Rome -> Belgrade, bowed south under the coast so the two
// arrows (bowed north) never run along it.
const TIE = arcPts(toward(CITIES.rome, BELGRADE, 5), toward(BELGRADE, CITIES.rome, 5), -0.18);
const TIE_C = cum(TIE);
const TIE_L = TIE_C[TIE_C.length - 1];

// The two desire-arrows, capital -> the coast, bowed north, their heads
// stopping 3 world px short of TARGET from either side: nose to nose in the
// hatch.
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

// ---------------------------------------------------------------------------
const NobodyCanSettle: React.FC<Props> = ({ sea, ink, accent, accentDeep, grainSrc, mottleSrc, vignette }) => {
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
  // the hold's highlight: the tie's own dots brighten in a window travelling
  // Rome -> Belgrade, one pass every 48 f from f190
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

  // the static map: the picked crop over the britain crop
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
  const crops = CROPS.map((c) => ({ L: SETTLE_LEVELS.find((l) => l.name === c.name), op: cropOp(c.name, fi) })).filter(
    (c): c is { L: Level; op: number } => !!c.L && c.op > 0.001,
  );
  const needBase = !crops.some((c) => c.op >= 0.999);

  return (
    <AbsoluteFill style={{ backgroundColor: sea }}>
      {/* ---------------- THE MAP: baked levels ---------------- */}
      {needBase ? levelImg(BRITAIN, 1, `ww1/lod-${BRITAIN.name}.png`) : null}
      {crops.map((c) => levelImg(c.L, c.op, `ww1settle/lod-${c.L.name}.png`))}

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

      {/* ---------------- THE COAST, THE TIE, THE ARROWS, THE LINE ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          <pattern id="hA" patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform="rotate(45)">
            <line x1={HS / 2} y1={0} x2={HS / 2} y2={HS} stroke={accent} strokeWidth={px(2)} />
          </pattern>
          <pattern id="hB" patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={HS} stroke={accent} strokeWidth={px(2)} />
            <line x1={HS} y1={0} x2={HS} y2={HS} stroke={accent} strokeWidth={px(2)} />
          </pattern>
        </defs>
        <g transform={camT}>
          {/* the wanted coast: one hatch, full throughout */}
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
            const dl = Math.hypot(tip[0] - prev[0], tip[1] - prev[1]) || 1;
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

export default NobodyCanSettle;
