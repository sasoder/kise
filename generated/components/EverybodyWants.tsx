import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  clamp,
  clamp01,
  hash,
  smoothstep,
  sway,
} from "./fieldShared";
// The map is drawn in two halves. The STATIC layers (sea, water-lines,
// graticule, land + rim, 1914 borders, colonial borders, coast) are a raster
// LOD pyramid baked once by `scripts/bake-ww1-rasters.mjs` (public/ww1/lod-*.png,
// rects in ww1Levels.ts). The DYNAMIC overlays (wants, fronts, arrows, ties,
// labels, the Bosnia lines) are light vectors from `scripts/build-ww1-map.mjs`
// (ww1Overlay.ts). Natural Earth 10m + 1914 polities on a north-up Lambert
// azimuthal equal-area centred 15 E, 25 N.
import {
  BOSNIA_EAST_D,
  CITIES,
  FRANCE_1870_PTS,
  ITALY_ARC_D,
  PLACES,
  SAVA_D,
  WANT_BOX,
  WANT_D,
  WANT_EDGE_D,
  type WantKey,
} from "./ww1Overlay";
import { LEVELS } from "./ww1Levels";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
loadFell("italic", { weights: ["400"], subsets: ["latin"] });

export const FPS = 24;
// In-point 18.10 s of the clip SRT = f0. Last word "well" at 56.44 s:
// round((56.44 - 18.10) * 24) = 920, + the 16-frame house tail = 936.
export const DURATION = 936;

// ---------------------------------------------------------------------------
// Sarah Paine on why nobody could end the First World War:
// "The problem is everybody wants different things, even with an alliance
// system. Britain wants the status quo, no one else does. France wants
// Alsace-Lorraine back, it's what Prussia had taken from them in the
// Franco-Prussian War. Italy wants more territories on the eastern
// Mediterranean. Russia wants the Balkans, and it wants Catholic
// Austria-Hungary out of the Balkans. Germany just wants lots of colonies. So
// what it means is that even within alliance systems objectives don't align.
// In this war primary theaters, generally speaking, don't align, and
// everybody's off for different things, and so you get these parallel wars for
// different places. Well…"
// In-point 18.10 s = f0, 24 fps, frame = round((t - 18.10) * 24).
// DURATION = round((56.44 - 18.10) * 24) + 16 = 920 + 16 = 936.
//
// THE DWARKESH MAP STYLE (MEMORY.md; reference SouthManchuriaRailway.tsx):
// opaque 1080x1920, a real map, never the grid.
//   sea    #1B2226 with 4 engraved water-lines following the coast, fading out
//   land   #3F3428 with a lighter hand-coloured rim #6A5838 inside the coast
//   ink    #E9DDBF cream: coast, graticule (5 deg, 0.12), 1914 borders (fine
//          dashed 0.5; African colonial borders a rung fainter, 0.32), all type
//   accent #FFB000 / #D98A0C = TERRITORY A POWER WANTS, and nothing else: the
//          orange hatch clipped to land with a dashed edge over land, and in
//          act 9 the desire-arrows, which mean the same thing
//   ladder want at full (1) while its power speaks, 0.45 once the next power
//          starts; one arrow stroke; labels full cream for the claimant, 0.45
//          for the rest
//   paper  world-space mottle + screen-space grain (public/ww1/), vignette
//   type   IM Fell English SC for names (spaced caps), italic for the one sea
//          name; a name appears ONLY on its spoken word (see CUE), sliding up
//          24 px while it fades in; no capital names; a capital's small cream
//          dot exists only while a tie or an arrow is attached to it
//
// THE GESTURES, each with its frames and word. Nothing else.
//   1. f0-60   WIDE EUROPE 1914, k 1.1, borders drawn, Africa's north coast at
//      the bottom; no text                  — "everybody wants different things"
//   2. f76-100 the alliance ties draw on as fine dotted cream arcs, one at a
//      time, each capital's dot rising as its first tie starts: London-Paris-
//      St Petersburg and Berlin-Vienna-Rome            — "alliance system" f82/91
//   3. f88-175 the camera glides to Britain and the Channel (lands ~f112); BRITAIN on "britain" f106. No
//      orange. f124-150 the 1914 borders firm from dashed 0.5 to solid 0.8 in
//      ONE wave out of London; f150-175 they relax back to dashed while the
//      camera is already easing toward France     — "status quo" f128 / "no one else" f152
//   4. f152-317 the camera lands on the Franco-German border (k 4, ~f188).
//      f200-222 Alsace-Lorraine fills with orange hatch in ONE front running east
//      from the French side; ALSACE-LORRAINE on "alsace" f202. f240-306 the
//      pre-1871 French border (the Rhine, the Lauter, the Saar line) draws on
//      along its length; slow creep. FRANCE on "france" f180
//                                  — "wants Alsace-Lorraine back … Franco-Prussian war"
//   5. f298-392 the camera glides southeast to Italy and the Adriatic (~f326).
//      f326-345 one orange front out of Italy's Adriatic shore crosses into
//      Dalmatia and Vlore. f358-378 the same front reaches Adalia
//      on the Anatolian coast while the camera follows it south; ITALY on "italy"
//      f318, "Eastern Mediterranean" (italic) on "eastern" f362, out at f393.
//      France's want settles to 0.45 f318-332 — "Italy wants more territories … eastern Mediterranean"
//   6. f380-518 the camera pulls up and east over the Black Sea and the whole
//      Balkans (~f406). f415-440 one front out of Odessa sweeps southwest over
//      Serbia, Montenegro and Bulgaria; RUSSIA on f393, THE BALKANS on f423. The
//      AUSTRIA-HUNGARY name comes up on "austro" f472 and f456-478 Bosnia-Herzegovina is traced
//      in cream. f490-512 the same front runs on over Bosnia and
//      Dalmatia (Sazonov's 13 points) and Austria-Hungary's border round Bosnia
//      retracts north to the Sava line. Its hatch crosses Italy's in Dalmatia.
//      Italy's want settles f393-407       — "Russia wants the Balkans … out of the Balkans"
//   7. f503-554 the camera falls south off Europe before the word (target f503-530,
//      lands ~f536); GERMANY on "germany" f519 (never earlier); f536-556 Togo, Kamerun, South-West
//      Africa and East Africa fill orange in one hashed wave, then the
//      Mittelafrika dream, the Belgian Congo and Angola, joins it
//                                            — "Germany just wants lots of colonies"
//   8. f556-640 ONE damped glide (<= ~60 px/frame, like the fall) pulls back
//      from Africa to the EUROPE wide again (k 1.25, lands ~f600; tighter than
//      asked so Kamerun's tip clears the bottom edge): the
//      Mediterranean and the North African coast in frame, the Balkans and
//      Adalia near y 835, the colonies gone off the bottom. Every want at 0.45;
//      only the four claimants named (FRANCE, GERMANY, ITALY, RUSSIA slide up
//      f590-599 at 0.45, set clear of dots, hatches and arrow heads; all other
//      names fade f556-576; capital dots stay); the alliance ties re-emphasised
//      f605-625                     — "so what it means is … within alliance systems"
//   9. f636-700 every want and the four names relight to full in one eased rise
//      (f636-660); four orange desire-arrows draw one at a time f638-672:
//      Paris -> Alsace-Lorraine (east), Rome -> Dalmatia and on to Adalia
//      (north-east, then south-east), St Petersburg -> the Balkans (south),
//      Berlin bowing west over the Alps, down the Tyrrhenian and over Tunisia
//      and Libya, off the bottom of the frame toward the colonies (it touches
//      no other want and never crosses Rome's arrow).
//      Britain none                                    — "objectives don't align"
//  10. f700-860 the hold: a ~3% creep, a faint highlight travelling each arrow,
//      the dashed hatch edges marching         — "primary theaters … different things"
//  11. f866-904 a bright band crosses every want at the same time, each in its
//      own arrow's direction (Germany's is off-frame: its arrow carries it);
//      settle and hold to f935               — "parallel wars for different places"
// No flashes, pulses, ripples, springs, glows, roses or cartouches.
// ---------------------------------------------------------------------------

export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const CASING = "#0B0907";
const HILITE = "#FFE3A6";

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

// ---------------------------------------------------------------------------
// Timing (frames at 24 fps from the 18.10 s in-point).
// ---------------------------------------------------------------------------
export const T = {
  ties: [76, 92] as const, // start of the first .. start of the last tie
  tieDraw: 12,
  wave: [124, 150] as const, // "status quo"
  relax: [150, 175] as const, // "no one else does"
  alFront: [200, 222] as const, // "wants Alsace-Lorraine back"
  line1870: [240, 306] as const, // "Prussia had taken … Franco-Prussian war"
  itFront1: [326, 345] as const, // Dalmatia, Vlore
  itFront2: [358, 378] as const, // Adalia
  ruFront1: [415, 440] as const, // Serbia, Montenegro, Bulgaria
  ahBright: [450, 462] as const, // "Catholic Austria-Hungary"
  bosTrace: [456, 478] as const,
  ruFront2: [490, 512] as const, // "out of the Balkans"
  retract: [492, 512] as const,
  sava: [496, 512] as const,
  geBright: [519, 531] as const, // "Germany"
  colonies: [536, 556] as const, // "lots of colonies"
  wantLabelsOut: 556,
  tieBack: [605, 625] as const, // "within alliance systems"
  relight: [636, 660] as const, // "objectives"
  arrows: [638, 668] as const, // "don't align"
  hold: [700, 860] as const,
  bands: [866, 904] as const, // "parallel wars for different places"
};
// THE LABEL RULE (V3): a name appears only when she says its word, on that
// word: the slide starts 8 f before the word's onset (opaque 1 f after it,
// settled 6 f after), or on the first word of a two-word name so it is in by
// the second. Nothing else carries a name. Word frames from the SRT.
export const CUE = {
  britain: 106 - 8, // "britain" f106
  france: 180 - 8, // "france" f180
  alsaceLorraine: 202, // "alsace" f202, in by "lorraine" f216
  italy: 318 - 8, // "italy" f318
  easternMed: 362, // "eastern" f362, in by "mediterranean" f368
  russia: 393 - 8, // "russia" f393
  balkans: 423 - 8, // "balkans" f423
  austriaHungary: 472, // "austro" f472, in by "hungary" f483
  germany: 519 - 8, // "germany" f519
};
const LABEL_TRAVEL = 24; // screen px
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const RUNG_LOW = 0.45;

const ramp = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));

// ---------------------------------------------------------------------------
// THE CAMERA: a keyed track of framings (content centre x, c and zoom k; world
// == screen at the Europe wide). Holds creep in (<= 3%); moves are van Wijk
// smooth-zoom glides under the house ease; the house spring (CAM_STIFF /
// CAM_DAMP) damps log k, x and cy, which lands each framing ~6 frames after its
// target and keeps every glide C1. cy = c + CAM_LIFT / k puts c on screen y 835.
// ---------------------------------------------------------------------------
type View = { k: number; x: number; c: number };
const V = (p: { x: number; y: number }, k: number): View => ({ k, x: p.x, c: p.y });
export const SHOTS = {
  europe: V(PLACES.shotEurope, 1.1),
  britain: V(PLACES.shotBritain, 2.7),
  alsace: V(PLACES.shotAlsace, 5.2),
  italyA: V(PLACES.shotItalyA, 2.8),
  italyB: V(PLACES.shotItalyB, 2.3),
  balkans: V(PLACES.shotBalkans, 2.2),
  africa: V(PLACES.shotAfrica, 0.8),
  wide: V(PLACES.shotWide, 1.25),
};
// [shot, hold start, hold end, creep, rho of the move out]; the move to the
// next shot fills the gap. The fall to Africa gets the highest rho: it rises
// before it travels, so the long pan never outruns the eye.
const PLAN: [keyof typeof SHOTS, number, number, number, number][] = [
  ["europe", 0, 88, 0.026, 1.25],
  ["britain", 106, 152, 0.014, 1.25],
  ["alsace", 182, 294, 0.03, 1.25],
  ["italyA", 320, 342, 0.008, 1.25],
  ["italyB", 368, 380, 0.0, 1.25],
  ["balkans", 400, 497, 0.03, 1.5],
  ["africa", 532, 553, 0.008, 1.5],
  ["wide", 597, DURATION, 0.03, 1.25],
];
const zoomPath = (a: View, b: View, RHO: number) => {
  // van Wijk & Nuij: (x, c, w) with w the world width on screen
  const w0 = FRAME_W / a.k;
  const w1 = FRAME_W / b.k;
  const dx = b.x - a.x;
  const dy = b.c - a.c;
  const d2 = dx * dx + dy * dy;
  const r2 = RHO * RHO;
  if (d2 < 1e-6) {
    const S = Math.log(w1 / w0) / RHO;
    return (t: number): View => ({ x: a.x + t * dx, c: a.c + t * dy, k: FRAME_W / (w0 * Math.exp(RHO * t * S)) });
  }
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
const creepAt = (i: number, f: number) => {
  const [, h0, h1, amt] = PLAN[i];
  const u = clamp01((f - h0) / Math.max(1, h1 - h0));
  return 1 + amt * u * u * (1.5 - 0.5 * u); // eases in, still moving at the end
};
const camTarget = (f: number): View => {
  for (let i = 0; i < PLAN.length; i++) {
    const [name, h0, h1] = PLAN[i];
    const s = SHOTS[name];
    if (f >= h0 && f <= h1) return { ...s, k: s.k * creepAt(i, f) };
    const next = PLAN[i + 1];
    if (next && f > h1 && f < next[1]) {
      const from = { ...s, k: s.k * creepAt(i, h1) };
      const path = zoomPath(from, SHOTS[next[0]], PLAN[i][4]);
      return path(camEase((f - h1) / (next[1] - h1), 0.85));
    }
  }
  return SHOTS.wide;
};
// Precomputed once: the damped camera at every frame.
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
// The raster LOD pyramid: which baked level each frame shows. `wide` is always
// drawn; a crop is chosen when it covers the whole view and its bake zoom is
// closest (in log) to the camera's k, and fades in/out over 8 frames inside
// the run of frames it is chosen for, so every crossfade happens while it
// still covers the view. Precomputed once.
// ---------------------------------------------------------------------------
export const LEVEL_OP: number[][] = (() => {
  const n = CAM_TRACK.length;
  const wideI = LEVELS.findIndex((L) => L.name === "wide");
  const covers = (li: number, f: number) => {
    const { k, cx, cy } = CAM_TRACK[f];
    const m = 10 / k;
    const L = LEVELS[li];
    return cx - 540 / k - m >= L.x0 && cy - 960 / k - m >= L.y0 && cx + 540 / k + m <= L.x0 + L.w && cy + 960 / k + m <= L.y0 + L.h;
  };
  // with hysteresis: keep the current crop while it covers and is within 30%
  // of its bake zoom, so glides do not flicker between neighbouring crops
  const pick: number[] = [];
  CAM_TRACK.forEach(({ k }, f) => {
    const prev = f > 0 ? pick[f - 1] : wideI;
    if (prev !== wideI && covers(prev, f) && Math.abs(Math.log(k / LEVELS[prev].kBake)) < Math.log(1.3)) {
      pick.push(prev);
      return;
    }
    let best = wideI;
    let bs = Infinity;
    LEVELS.forEach((L, i) => {
      if (i === wideI || !covers(i, f)) return;
      const sc = Math.abs(Math.log(k / L.kBake));
      if (sc < Math.log(1.8) && sc < bs) [bs, best] = [sc, i];
    });
    pick.push(best);
  });
  return LEVELS.map((_, li) => {
    const op = new Array<number>(n).fill(0);
    if (li === wideI) return op.fill(1);
    let f = 0;
    while (f < n) {
      if (pick[f] !== li) {
        f++;
        continue;
      }
      let b = f;
      while (b + 1 < n && pick[b + 1] === li) b++;
      if (b - f < 15) {
        f = b + 1; // a crop merely passed through mid-glide: skip it
        continue;
      }
      // fade out after the run, under the next crop's fade-in, for as long as
      // this crop still covers the view (never past it)
      let e = b;
      while (e + 1 < n && e < b + 8 && covers(li, e + 1)) e++;
      for (let g = f; g <= e; g++) {
        const fin = f === 0 ? 1 : smoothstep((g - f + 1) / 8);
        const fout = e === n - 1 ? 1 : smoothstep((e - g + 1) / 8);
        op[g] = Math.max(op[g], Math.min(fin, fout));
      }
      f = b + 1;
    }
    return op;
  });
})();

// ---------------------------------------------------------------------------
// Geometry helpers.
// ---------------------------------------------------------------------------
type P2 = [number, number];
/** A quadratic arc a -> b bowed by `bow` x its length to the left of travel. */
const arcPts = (a: { x: number; y: number }, b: { x: number; y: number }, bow: number, n = 64): P2[] => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = mx + dy * bow;
  const cy = my - dx * bow;
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([
      (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x,
      (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y,
    ]);
  }
  return out;
};
const cum = (pts: P2[]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
/** The first `t` (0..1) of a polyline, as a path, plus its tip and tangent. */
const partial = (pts: P2[], t: number) => {
  const c = cum(pts);
  const L = c[c.length - 1] * clamp01(t);
  const out: P2[] = [pts[0]];
  let i = 1;
  while (i < pts.length && c[i] <= L) out.push(pts[i++]);
  let tip = out[out.length - 1];
  let dir: P2 = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]];
  if (i < pts.length) {
    const u = (L - c[i - 1]) / (c[i] - c[i - 1] || 1);
    tip = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    out.push(tip);
    dir = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]];
  } else if (pts.length > 1) {
    dir = [pts[pts.length - 1][0] - pts[pts.length - 2][0], pts[pts.length - 1][1] - pts[pts.length - 2][1]];
  }
  const dl = Math.hypot(dir[0], dir[1]) || 1;
  return { d: `M${out.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`, tip, dir: [dir[0] / dl, dir[1] / dl] as P2 };
};
const dOf = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
/** Shorten a point toward another by `d` world px. */
const toward = (a: { x: number; y: number }, b: { x: number; y: number }, d: number) => {
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: a.x + ((b.x - a.x) * d) / l, y: a.y + ((b.y - a.y) * d) / l };
};

// The alliance ties, capital to capital (world px).
type Capital = keyof typeof CITIES;
const TIES = (
  [
    ["london", "paris", -0.18],
    ["paris", "stPetersburg", 0.1],
    ["london", "stPetersburg", -0.08],
    ["berlin", "vienna", -0.18],
    ["vienna", "rome", -0.14],
    ["rome", "berlin", -0.16],
  ] as [Capital, Capital, number][]
).map(([a, b, bow]) => ({ ends: [a, b], pts: arcPts(toward(CITIES[a], CITIES[b], 5), toward(CITIES[b], CITIES[a], 5), bow) }));
const TIE_ORDER = TIES.map((_, i) => i).sort((p, q) => hash(p, 3) - hash(q, 3));
const tieStart = (i: number) => T.ties[0] + ((T.ties[1] - T.ties[0]) * TIE_ORDER.indexOf(i)) / (TIES.length - 1);
// A capital's dot exists only while a tie (or, later, an arrow) is attached to
// it: it comes up as its first tie starts to draw. The ties stay on to the end,
// so the six tied capitals keep their dots; Constantinople never gets one.
const DOT_IN: Partial<Record<Capital, number>> = {};
TIES.forEach((t, i) => {
  for (const c of t.ends) DOT_IN[c] = Math.min(DOT_IN[c] ?? Infinity, tieStart(i));
});

/** A centripetal Catmull-Rom through `ps`, densely sampled. */
const catmull = (ps: { x: number; y: number }[], per = 40): P2[] => {
  const P = ps.map((p) => [p.x, p.y] as P2);
  const ext: P2[] = [
    [2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1]],
    ...P,
    [2 * P[P.length - 1][0] - P[P.length - 2][0], 2 * P[P.length - 1][1] - P[P.length - 2][1]],
  ];
  const out: P2[] = [P[0]];
  const knot = (a: P2, b: P2) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const lerp = (A: P2, B: P2, ta: number, tb: number, t: number): P2 => [
      ((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0],
      ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1],
    ];
    for (let s = 1; s <= per; s++) {
      const t = t1 + ((t2 - t1) * s) / per;
      const A1 = lerp(p0, p1, 0, t1, t);
      const A2 = lerp(p1, p2, t1, t2, t);
      const A3 = lerp(p2, p3, t2, t3, t);
      out.push(lerp(lerp(A1, A2, 0, t2, t), lerp(A2, A3, t1, t3, t), t1, t2, t));
    }
  }
  return out;
};
const unit = (a: { x: number; y: number }, b: { x: number; y: number }): P2 => {
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return [(b.x - a.x) / l, (b.y - a.y) / l];
};

// The four desire arrows, capital to want (world px), drawn at the Europe wide:
// Paris east to Alsace-Lorraine; Rome north-east to Dalmatia and on south-east
// to Adalia; St Petersburg south to the Balkans; Berlin south, off the bottom
// of the frame toward the colonies.
const ARROWS = [
  arcPts(toward(CITIES.paris, PLACES.alTarget, 9), toward(PLACES.alTarget, CITIES.paris, 5), 0.3, 96),
  catmull([toward(CITIES.rome, PLACES.dalmatiaTarget, 9), PLACES.dalmatiaTarget, toward(PLACES.adaliaTarget, PLACES.dalmatiaTarget, 6)]),
  arcPts(toward(CITIES.stPetersburg, PLACES.balkansTarget, 9), toward(PLACES.balkansTarget, CITIES.stPetersburg, 6), -0.14, 96),
  catmull([
    toward(CITIES.berlin, PLACES.berlinVia1, 9),
    PLACES.berlinVia1,
    PLACES.berlinVia2,
    PLACES.berlinVia3,
    PLACES.berlinVia4,
    PLACES.berlinVia5,
    PLACES.berlinVia6,
    PLACES.eastAfricaTarget,
  ]),
].map((pts) => ({ pts, L: cum(pts)[pts.length - 1] }));
// staggered; all four home (or off the frame) by "align" (f668)
const ARROW_T: [number, number][] = [
  [638, 650],
  [643, 657],
  [648, 661],
  [652, 672],
];

// ---------------------------------------------------------------------------
// The wants: who claims what, at which hatch angle, and how it arrives.
// ---------------------------------------------------------------------------
type Layer = { key: WantKey; angle: 45 | -45; power: "france" | "italy" | "russia" | "germany"; dir: P2 };
// `dir` is the arrow's direction over this want: its band (act 11) runs that way.
const D_FR = unit(CITIES.paris, PLACES.alTarget);
const D_IT1 = unit(CITIES.rome, PLACES.dalmatiaTarget);
const D_IT2 = unit(PLACES.dalmatiaTarget, PLACES.adaliaTarget);
const D_RU = unit(CITIES.stPetersburg, PLACES.balkansTarget);
const D_GE = unit(CITIES.berlin, PLACES.eastAfricaTarget);
const LAYERS: Layer[] = [
  { key: "alsaceLorraine", angle: 45, power: "france", dir: D_FR },
  { key: "dalmatia", angle: -45, power: "italy", dir: D_IT1 },
  { key: "vlore", angle: -45, power: "italy", dir: D_IT1 },
  { key: "adalia", angle: -45, power: "italy", dir: D_IT2 },
  { key: "balkans", angle: 45, power: "russia", dir: D_RU },
  { key: "bosnia", angle: 45, power: "russia", dir: D_RU },
  { key: "dalmatia", angle: 45, power: "russia", dir: D_RU },
  { key: "togo", angle: 45, power: "germany", dir: D_GE },
  { key: "kamerun", angle: 45, power: "germany", dir: D_GE },
  { key: "swAfrica", angle: 45, power: "germany", dir: D_GE },
  { key: "eastAfrica", angle: 45, power: "germany", dir: D_GE },
  { key: "congo", angle: 45, power: "germany", dir: D_GE },
  { key: "angola", angle: 45, power: "germany", dir: D_GE },
];
// Each power's want is at full while it speaks, then settles; all relight at f636.
const SETTLE: Record<Layer["power"], number> = { france: 318, italy: 393, russia: 519, germany: 560 };
const wantRung = (power: Layer["power"], f: number) => {
  const s = SETTLE[power];
  const low = 1 - (1 - RUNG_LOW) * ramp(f, s, s + 14);
  return low + (1 - low) * ramp(f, T.relight[0], T.relight[1]);
};
const distTo = (p: { x: number; y: number }, b: { x0: number; y0: number; x1: number; y1: number }) => {
  const near = Math.hypot(Math.max(b.x0 - p.x, 0, p.x - b.x1), Math.max(b.y0 - p.y, 0, p.y - b.y1));
  const far = Math.max(
    Math.hypot(b.x0 - p.x, b.y0 - p.y),
    Math.hypot(b.x1 - p.x, b.y0 - p.y),
    Math.hypot(b.x0 - p.x, b.y1 - p.y),
    Math.hypot(b.x1 - p.x, b.y1 - p.y),
  );
  return { near, far };
};
const FEATHER = 22; // world px, the soft edge of every front
const IT1 = (() => {
  const a = distTo(PLACES.ancona, WANT_BOX.dalmatia);
  const b = distTo(PLACES.ancona, WANT_BOX.vlore);
  return { near: Math.min(a.near, b.near), far: Math.max(a.far, b.far) };
})();
const IT2 = distTo(PLACES.ancona, WANT_BOX.adalia);
const RU1 = distTo(PLACES.odessa, WANT_BOX.balkans);
const RU2 = (() => {
  const a = distTo(PLACES.odessa, WANT_BOX.bosnia);
  const b = distTo(PLACES.odessa, WANT_BOX.dalmatia);
  return { near: Math.min(a.near, b.near), far: Math.max(a.far, b.far) };
})();
const COLONY_ORDER: WantKey[] = ["togo", "kamerun", "swAfrica", "eastAfrica"]
  .sort((p, q) => hash(p.length, 7) - hash(q.length, 11))
  .concat(["congo", "angola"]) as WantKey[];

// ---------------------------------------------------------------------------
const slide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...clamp }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], clamp),
});

type Power = "britain" | "france" | "germany" | "austriaHungary" | "russia" | "italy";
// full cream from its word while that power is the subject, then the low rung
const SPEAKING: Record<Power, [number, number]> = {
  britain: [CUE.britain, 176],
  france: [CUE.france, 318],
  italy: [CUE.italy, 393],
  russia: [CUE.russia, 519],
  austriaHungary: [CUE.austriaHungary, 519],
  germany: [CUE.germany, 557],
};
const CLAIMANTS: Power[] = ["france", "italy", "russia", "germany"];
const powerRung = (p: Power, f: number) => {
  let op = RUNG_LOW + (1 - RUNG_LOW) * (1 - ramp(f, SPEAKING[p][1], SPEAKING[p][1] + 14));
  if (CLAIMANTS.includes(p)) {
    // handed over to the payoff instance (below) while Europe is off-frame
    op *= 1 - ramp(f, 546, 554);
  } else {
    // at the payoff wide only the four claimants are named
    op *= 1 - ramp(f, 560, 576);
  }
  return op;
};
// The claimants' names at the payoff wide: set clear of every dot, hatch and
// arrow head, they slide up as the camera lands, sit at the low rung, and go
// full cream with their wants on "objectives".
const W_LABEL_IN = 590;
const payoffRung = (f: number) => RUNG_LOW + (1 - RUNG_LOW) * ramp(f, T.relight[0], T.relight[1]);

// ---------------------------------------------------------------------------
const EverybodyWants: React.FC<Props> = ({ sea, ink, accent, accentDeep, grainSrc, mottleSrc, vignette }) => {
  const frame = useCurrentFrame();

  // -- camera --------------------------------------------------------------
  const cam = CAM_TRACK[Math.min(DURATION, Math.max(0, Math.round(frame)))];
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx / k;
  const cy = cam.cy + drift.dy / k;
  const tx = FRAME_W / 2 - cx * k;
  const ty = FRAME_H / 2 - cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;
  const grow = (v: number, e = 0.18) => (v * Math.pow(k, e)) / k;

  // -- borders: the London wave -------------------------------------------------
  const waveR = (450 + FEATHER * 3) * ramp(frame, T.wave[0], T.wave[1]);
  const solidT = frame < T.wave[0] ? 0 : 1 - ramp(frame, T.relax[0], T.relax[1]);
  const waveOn = solidT > 0.001 && waveR > 1;

  // -- Bosnia -------------------------------------------------------------------
  const bosTrace = ramp(frame, T.bosTrace[0], T.bosTrace[1]);
  const bosTraceOp = 0.85 * (1 - ramp(frame, T.retract[0], T.retract[1] + 10));
  const retractT = ramp(frame, T.retract[0], T.retract[1]);
  const savaT = ramp(frame, T.sava[0], T.sava[1]);
  const bb = WANT_BOX.bosnia;
  const retractY = bb.y1 + 12 - (bb.y1 - bb.y0 + 30) * retractT; // erases south -> north

  // -- the pre-1871 line ----------------------------------------------------------
  const l1870 = ramp(frame, T.line1870[0], T.line1870[1]);
  const l1870Op = 0.85 - 0.4 * ramp(frame, 318, 332);

  // -- hatch octaves: screen spacing stays 11-22 px, the in-between lines fade in
  const L2 = Math.log2(k);
  const oct = Math.floor(L2);
  const octT = smoothstep(L2 - oct);
  const HS = 11 / Math.pow(2, oct); // world px between full lines

  // -- fronts ---------------------------------------------------------------------
  const alT = ramp(frame, T.alFront[0], T.alFront[1]);
  const alB = WANT_BOX.alsaceLorraine;
  const alX = alB.x0 - FEATHER + (alB.x1 - alB.x0 + 2 * FEATHER) * alT;
  const itR =
    frame < (T.itFront1[1] + T.itFront2[0]) / 2
      ? IT1.near - FEATHER + (IT1.far + FEATHER - (IT1.near - FEATHER)) * ramp(frame, T.itFront1[0], T.itFront1[1])
      : IT2.near - FEATHER + (IT2.far + FEATHER - (IT2.near - FEATHER)) * ramp(frame, T.itFront2[0], T.itFront2[1]);
  const ruR1 = RU1.near - FEATHER + (RU1.far + FEATHER - (RU1.near - FEATHER)) * ramp(frame, T.ruFront1[0], T.ruFront1[1]);
  const ruR2 = RU2.near - FEATHER + (RU2.far + FEATHER - (RU2.near - FEATHER)) * ramp(frame, T.ruFront2[0], T.ruFront2[1]);
  const colonyT = (key: WantKey) => {
    const i = COLONY_ORDER.indexOf(key);
    const f0 = T.colonies[0] + (i < 4 ? i * 2.5 : 10 + (i - 4) * 3);
    return ramp(frame, f0, f0 + 10);
  };
  // visibility of each layer, and which mask draws it on
  // Every reveal has ONE progress value p. The rule, for every front: p <= 0
  // renders nothing; 0 < p < 1 renders through its mask, and the mask's <defs>
  // entry is emitted under exactly the same condition (`revealing`); p >= 1
  // renders unmasked. (The f200 flash: the Alsace layer referenced url(#mAL)
  // at p = 0 while the mask was only defined for p > 0, and a reference to a
  // missing mask renders the element UNMASKED for that frame.)
  const REVEAL = {
    mAL: alT,
    mIT:
      ramp(frame, T.itFront1[0], T.itFront1[1]) <= 0 ? 0 : ramp(frame, T.itFront2[0], T.itFront2[1]) >= 1 ? 1 : 0.5,
    mRU1: ramp(frame, T.ruFront1[0], T.ruFront1[1]),
    mRU2: ramp(frame, T.ruFront2[0], T.ruFront2[1]),
  };
  type RevealId = keyof typeof REVEAL;
  const revealing = (id: RevealId) => REVEAL[id] > 0 && REVEAL[id] < 1;
  const byReveal = (id: RevealId) => ({ vis: REVEAL[id] > 0 ? 1 : 0, mask: revealing(id) ? `url(#${id})` : null });
  const layerState = (l: Layer): { vis: number; mask: string | null } => {
    switch (l.power) {
      case "france":
        return byReveal("mAL");
      case "italy":
        return byReveal("mIT");
      case "russia":
        return byReveal(l.key === "balkans" ? "mRU1" : "mRU2");
      case "germany":
        return { vis: colonyT(l.key), mask: null };
    }
  };

  // -- the hold and the bands ---------------------------------------------------------
  const holdT = ramp(frame, T.hold[0], T.hold[0] + 20) * (1 - ramp(frame, T.hold[1], T.hold[1] + 12));
  const march = frame > T.hold[0] ? (frame - T.hold[0]) * 0.45 * ramp(frame, T.hold[0], T.hold[0] + 24) : 0;
  const bandT = clamp01((frame - T.bands[0]) / (T.bands[1] - T.bands[0]));
  // the band is off-shape at bandT 0 and 1, so it renders only strictly between
  const bandOn = bandT > 0 && bandT < 1;

  // -- ties -------------------------------------------------------------------------
  const tieOp =
    0.62 - 0.3 * ramp(frame, 104, 122) + 0.42 * ramp(frame, T.tieBack[0], T.tieBack[1]) - 0.12 * ramp(frame, 632, 652);

  // -- labels ---------------------------------------------------------------------------
  const outT = (f0: number) => 1 - ramp(frame, f0, f0 + 14);
  const label = (o: {
    key: string;
    text: string | string[];
    x: number;
    y: number;
    size: number;
    f0: number;
    fOut?: number;
    op?: number;
    e?: number;
    spacing?: number;
    family?: string;
    italic?: boolean;
    halo?: boolean;
    anchor?: "start" | "middle" | "end";
    color?: string;
  }) => {
    const sl = slide(frame, o.f0);
    const op = sl.op * (o.op ?? 1) * (o.fOut !== undefined ? outT(o.fOut) : 1);
    if (op <= 0.002) return null;
    const sz = grow(o.size, o.e ?? 0.35);
    const lines = Array.isArray(o.text) ? o.text : [o.text];
    const lh = sz * 1.05;
    const y0 = o.y + px(sl.dy) - ((lines.length - 1) * lh) / 2;
    return (
      <text
        key={o.key}
        x={o.x}
        y={y0}
        textAnchor={o.anchor ?? "middle"}
        dominantBaseline="middle"
        opacity={op}
        fill={o.color ?? ink}
        stroke={o.halo ? sea : undefined}
        strokeOpacity={o.halo ? 0.6 : undefined}
        strokeWidth={o.halo ? sz * 0.13 : undefined}
        paintOrder="stroke"
        style={{
          fontFamily: o.family ?? fellSC,
          fontStyle: o.italic ? "italic" : "normal",
          fontSize: sz,
          letterSpacing: sz * (o.spacing ?? 0.3),
        }}
      >
        {lines.map((t, i) => (
          <tspan key={i} x={o.x + (sz * (o.spacing ?? 0.3)) / 2} dy={i === 0 ? 0 : lh}>
            {t}
          </tspan>
        ))}
      </text>
    );
  };

  // mottle tiles, world space
  // two tilings of different pitch, so the wide shot shows no repeat
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  for (let y = -900; y < 4700; y += 1180) for (let x = -1400; x < 2400; x += 1180) tiles.push({ x, y, s: 1180, o: 0.75 });
  for (let y = -1300; y < 4700; y += 770) for (let x = -1700; x < 2400; x += 770) tiles.push({ x: x + 310, y: y + 170, s: 770, o: 0.45 });

  const dash = `${px(8)} ${px(5)}`;
  // the view, in world px, for culling the overlays
  const view = { x0: cx - 560 / k, x1: cx + 560 / k, y0: cy - 980 / k, y1: cy + 980 / k };
  const inView = (b: { x0: number; y0: number; x1: number; y1: number }) =>
    b.x1 > view.x0 && b.x0 < view.x1 && b.y1 > view.y0 && b.y0 < view.y1;

  // the static map: the wide level always, the right crop over it
  const fi = Math.min(DURATION, Math.max(0, Math.round(frame)));
  const levelImg = (L: (typeof LEVELS)[number], op: number, src: string, mask?: string) => (
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
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
  const britain = LEVELS.find((L) => L.name === "britain")!;
  const britainOp = LEVEL_OP[LEVELS.indexOf(britain)][fi];
  const waveMask = (() => {
    const lx = (CITIES.london.x - britain.x0) * britain.s;
    const ly = (CITIES.london.y - britain.y0) * britain.s;
    const rIn = Math.max(0, (waveR - FEATHER * 3) * britain.s);
    const rOut = Math.max(rIn + 1, waveR * britain.s);
    return `radial-gradient(circle at ${lx.toFixed(1)}px ${ly.toFixed(1)}px, #000 ${rIn.toFixed(1)}px, transparent ${rOut.toFixed(1)}px)`;
  })();

  // hatch patterns: an octave pair per angle
  const hatchDefs = ([45, -45] as const).map((a) => {
    const id = a > 0 ? "p" : "m";
    return (
      <React.Fragment key={id}>
        <pattern id={`hA${id}`} patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform={`rotate(${a})`}>
          <line x1={HS / 2} y1={0} x2={HS / 2} y2={HS} stroke={accent} strokeWidth={px(2)} />
        </pattern>
        <pattern id={`hB${id}`} patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform={`rotate(${a})`}>
          <line x1={0} y1={0} x2={0} y2={HS} stroke={accent} strokeWidth={px(2)} />
          <line x1={HS} y1={0} x2={HS} y2={HS} stroke={accent} strokeWidth={px(2)} />
        </pattern>
        <pattern id={`hL${id}`} patternUnits="userSpaceOnUse" width={HS / 2} height={HS / 2} patternTransform={`rotate(${a})`}>
          <line x1={HS / 4} y1={0} x2={HS / 4} y2={HS / 2} stroke={HILITE} strokeWidth={px(2.2)} />
        </pattern>
      </React.Fragment>
    );
  });

  const radialMask = (id: string, c: { x: number; y: number }, R: number) => {
    const big = Math.max(R + FEATHER, 10);
    const inner = clamp01((R - FEATHER) / big);
    return (
      <mask id={id} maskUnits="userSpaceOnUse" x={-1500} y={-800} width={4200} height={5800}>
        <radialGradient id={`${id}g`} gradientUnits="userSpaceOnUse" cx={c.x} cy={c.y} r={big}>
          <stop offset={0} stopColor="#fff" />
          <stop offset={inner} stopColor="#fff" />
          <stop offset={1} stopColor="#000" />
        </radialGradient>
        <rect x={-1500} y={-800} width={4200} height={5800} fill={`url(#${id}g)`} />
      </mask>
    );
  };

  // the bands (act 11): a bright stripe crossing each want along its arrow
  const bandMask = (i: number, l: Layer) => {
    const dir = l.dir;
    const b = WANT_BOX[l.key];
    const corners = [
      [b.x0, b.y0],
      [b.x1, b.y0],
      [b.x0, b.y1],
      [b.x1, b.y1],
    ].map(([x, y]) => x * dir[0] + y * dir[1]);
    const s0 = Math.min(...corners);
    const s1 = Math.max(...corners);
    const hw = Math.max(16, 0.3 * (s1 - s0));
    const p = s0 - hw + (s1 - s0 + 2 * hw) * Easing.inOut(Easing.cubic)(bandT);
    return (
      <mask key={`bm${i}`} id={`bm${i}`} maskUnits="userSpaceOnUse" x={-1500} y={-800} width={4200} height={5800}>
        <linearGradient
          id={`bm${i}g`}
          gradientUnits="userSpaceOnUse"
          x1={dir[0] * (p - hw)}
          y1={dir[1] * (p - hw)}
          x2={dir[0] * (p + hw)}
          y2={dir[1] * (p + hw)}
        >
          <stop offset={0} stopColor="#000" />
          <stop offset={0.5} stopColor="#fff" />
          <stop offset={1} stopColor="#000" />
        </linearGradient>
        <rect x={b.x0 - 20} y={b.y0 - 20} width={b.x1 - b.x0 + 40} height={b.y1 - b.y0 + 40} fill={`url(#bm${i}g)`} />
      </mask>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: sea }}>
      {/* ---------------- THE MAP: the baked static layers ---------------- */}
      {LEVELS.map((L, li) => {
        const op = LEVEL_OP[li][fi];
        return op > 0.001 ? levelImg(L, op, `ww1/lod-${L.name}.png`) : null;
      })}
      {/* the "status quo" wave: the solid-border bake, revealed out of London */}
      {waveOn && britainOp > 0.001 ? levelImg(britain, britainOp * solidT, "ww1/lod-britain-solid.png", waveMask) : null}

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
        {tiles.map((t, i) => (
          <Img key={`m-${i}`} src={staticFile(mottleSrc)} style={{ position: "absolute", left: t.x, top: t.y, width: t.s + 1, height: t.s + 1, opacity: t.o }} />
        ))}
      </div>

      {/* ---------------- WANTS, LINES, TYPE ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          {retractT > 0 && retractT < 1 ? (
            <mask id="retract" maskUnits="userSpaceOnUse" x={-1500} y={-800} width={4200} height={5800}>
              <linearGradient id="retractG" gradientUnits="userSpaceOnUse" x1={0} y1={retractY - 14} x2={0} y2={retractY}>
                <stop offset={0} stopColor="#fff" />
                <stop offset={1} stopColor="#000" />
              </linearGradient>
              <rect x={-1500} y={-800} width={4200} height={5800} fill="url(#retractG)" />
            </mask>
          ) : null}
          <path id="italyArc" d={ITALY_ARC_D} />
          {hatchDefs}
          {revealing("mAL") ? (
            <mask id="mAL" maskUnits="userSpaceOnUse" x={-1500} y={-800} width={4200} height={5800}>
              <linearGradient id="mALg" gradientUnits="userSpaceOnUse" x1={alX - FEATHER} y1={0} x2={alX} y2={0}>
                <stop offset={0} stopColor="#fff" />
                <stop offset={1} stopColor="#000" />
              </linearGradient>
              <rect x={alB.x0 - 40} y={alB.y0 - 40} width={alB.x1 - alB.x0 + 80} height={alB.y1 - alB.y0 + 80} fill="url(#mALg)" />
            </mask>
          ) : null}
          {revealing("mIT") ? radialMask("mIT", PLACES.ancona, itR) : null}
          {revealing("mRU1") ? radialMask("mRU1", PLACES.odessa, ruR1) : null}
          {revealing("mRU2") ? radialMask("mRU2", PLACES.odessa, ruR2) : null}
          {bandOn ? LAYERS.map((l, i) => bandMask(i, l)) : null}
          {l1870 > 0 && l1870 < 1 ? (
            <mask id="m1870" maskUnits="userSpaceOnUse" x={-1500} y={-800} width={4200} height={5800}>
              <path d={dOf(FRANCE_1870_PTS)} fill="none" stroke="#fff" strokeWidth={px(30)} pathLength={1} strokeDasharray={`${l1870} 2`} />
            </mask>
          ) : null}
        </defs>
        <g transform={camT}>
          {/* Austria-Hungary's border round Bosnia (retracts f492-512) and the Sava line (f496-512) */}
          {inView(WANT_BOX.bosnia) ? (
            <>
              {retractT < 1 ? (
                <path
                  d={BOSNIA_EAST_D}
                  mask={retractT > 0 ? "url(#retract)" : undefined}
                  fill="none"
                  stroke={ink}
                  strokeOpacity={0.5}
                  strokeWidth={px(1.7)}
                  strokeDasharray={dash}
                  strokeLinecap="round"
                />
              ) : null}
              {savaT > 0 ? (
                <path d={SAVA_D} fill="none" stroke={ink} strokeOpacity={0.5 * savaT} strokeWidth={px(1.7)} strokeDasharray={dash} strokeLinecap="round" />
              ) : null}
            </>
          ) : null}

          {/* the wants */}
          {LAYERS.map((l, i) => {
            const st = layerState(l);
            if (st.vis <= 0 || !inView(WANT_BOX[l.key])) return null;
            const rung = wantRung(l.power, frame) * st.vis;
            const id = l.angle > 0 ? "p" : "m";
            return (
              <g key={`w${i}`} opacity={rung}>
                <g>
                  <g mask={st.mask ?? undefined}>
                    <path d={WANT_D[l.key]} fill={accentDeep} fillOpacity={0.2} fillRule="evenodd" />
                    <path d={WANT_D[l.key]} fill={`url(#hA${id})`} fillRule="evenodd" opacity={0.85} />
                    {octT > 0.01 ? <path d={WANT_D[l.key]} fill={`url(#hB${id})`} fillRule="evenodd" opacity={0.85 * octT} /> : null}
                  </g>
                  {bandOn ? (
                    <g mask={`url(#bm${i})`}>
                      <path d={WANT_D[l.key]} fill={accent} fillOpacity={0.4} fillRule="evenodd" />
                      <path d={WANT_D[l.key]} fill={`url(#hL${id})`} fillRule="evenodd" />
                    </g>
                  ) : null}
                </g>
                <path
                  d={WANT_EDGE_D[l.key]}
                  mask={st.mask ?? undefined}
                  fill="none"
                  stroke={accent}
                  strokeWidth={px(2.2)}
                  strokeDasharray={`${px(7)} ${px(5)}`}
                  strokeDashoffset={-px(march)}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Bosnia traced, then its southern border retracts to the Sava */}
          {bosTrace > 0 && bosTraceOp > 0.01 ? (
            <path
              d={WANT_EDGE_D.bosnia}
              fill="none"
              stroke={ink}
              strokeOpacity={bosTraceOp}
              strokeWidth={px(2.4)}
              pathLength={1}
              strokeDasharray={`${bosTrace} 2`}
              strokeLinejoin="round"
            />
          ) : null}

          {/* the pre-1871 French border */}
          {l1870 > 0 ? (
            <g mask={l1870 < 1 ? "url(#m1870)" : undefined}>
              <path d={dOf(FRANCE_1870_PTS)} fill="none" stroke={CASING} strokeOpacity={0.6 * l1870Op} strokeWidth={px(6.5)} strokeLinejoin="round" />
              <path
                d={dOf(FRANCE_1870_PTS)}
                fill="none"
                stroke={ink}
                strokeOpacity={l1870Op / 0.85}
                strokeWidth={px(3.2)}
                strokeDasharray={`${px(12)} ${px(7)}`}
                strokeLinecap="round"
              />
            </g>
          ) : null}

          {/* the alliance ties, dotted, one at a time */}
          {TIES.map((t, i) => {
            const f0 = tieStart(i);
            const u = interpolate(frame, [f0, f0 + T.tieDraw], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });
            if (u <= 0) return null;
            return (
              <path
                key={`tie${i}`}
                d={partial(t.pts, u).d}
                fill="none"
                stroke={ink}
                strokeOpacity={tieOp}
                strokeWidth={px(2.6)}
                strokeDasharray={`${px(0.1)} ${px(7.5)}`}
                strokeLinecap="round"
              />
            );
          })}

          {/* the desire arrows */}
          {ARROWS.map((a, i) => {
            const [f0, f1] = ARROW_T[i];
            const u = interpolate(frame, [f0, f1], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
            if (u <= 0) return null;
            const p = partial(a.pts, u);
            const hs = px(12);
            const [dx, dy] = p.dir;
            const head = `M${(p.tip[0] - dx * hs + dy * hs * 0.62).toFixed(2)},${(p.tip[1] - dy * hs - dx * hs * 0.62).toFixed(2)}L${p.tip[0].toFixed(2)},${p.tip[1].toFixed(2)}L${(p.tip[0] - dx * hs - dy * hs * 0.62).toFixed(2)},${(p.tip[1] - dy * hs + dx * hs * 0.62).toFixed(2)}`;
            const headOp = smoothstep(u / 0.12);
            // the hold's travelling highlight
            const period = 56;
            const ph = (((frame - T.hold[0] - i * 11) % period) + period) % period / period;
            const shOp = holdT * Math.sin(Math.PI * ph) * 0.6;
            return (
              <g key={`ar${i}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={p.d} stroke={CASING} strokeOpacity={0.55} strokeWidth={px(5.4)} />
                <path d={head} stroke={CASING} strokeOpacity={0.55 * headOp} strokeWidth={px(5.4)} />
                <path d={p.d} stroke={accent} strokeWidth={px(2.6)} />
                <path d={head} stroke={accent} strokeOpacity={headOp} strokeWidth={px(2.6)} />
                {shOp > 0.01 ? (
                  <path
                    d={dOf(a.pts)}
                    stroke={HILITE}
                    strokeOpacity={shOp}
                    strokeWidth={px(2.6)}
                    pathLength={1}
                    strokeDasharray="0.14 2"
                    strokeDashoffset={-(ph * 1.14 - 0.14)}
                  />
                ) : null}
              </g>
            );
          })}

          {/* capital dots: only where a tie or an arrow is attached */}
          {(Object.keys(DOT_IN) as Capital[]).map((c) => {
            const op = smoothstep((frame - (DOT_IN[c] as number)) / 6);
            if (op <= 0) return null;
            const p = CITIES[c];
            return <circle key={`cd${c}`} cx={p.x} cy={p.y} r={grow(6)} fill={ink} stroke={CASING} strokeWidth={grow(2)} opacity={op} />;
          })}

          {/* the powers, each on its word */}
          {label({ key: "pBr", text: "BRITAIN", x: PLACES.britain.x, y: PLACES.britain.y, size: 40, f0: CUE.britain, op: powerRung("britain", frame) })}
          {label({ key: "pFr", text: "FRANCE", x: PLACES.france.x, y: PLACES.france.y, size: 40, f0: CUE.france, op: powerRung("france", frame) })}
          {label({ key: "pGe", text: "GERMANY", x: PLACES.germany.x, y: PLACES.germany.y, size: 40, spacing: 0.22, f0: CUE.germany, op: powerRung("germany", frame) })}
          {label({ key: "pAH", text: "AUSTRIA-HUNGARY", x: PLACES.austriaHungary.x, y: PLACES.austriaHungary.y, size: 34, spacing: 0.08, f0: CUE.austriaHungary, op: powerRung("austriaHungary", frame) })}
          {label({ key: "pRu", text: "RUSSIA", x: PLACES.russia.x, y: PLACES.russia.y, size: 44, spacing: 0.4, f0: CUE.russia, op: powerRung("russia", frame) })}
          {(() => {
            const sl = slide(frame, CUE.italy);
            const sz = grow(34, 0.35);
            const op = sl.op * powerRung("italy", frame);
            if (op <= 0.002) return null;
            return (
              <g transform={`translate(0 ${px(sl.dy)})`} opacity={op}>
                <text fill={ink} dominantBaseline="middle" style={{ fontFamily: fellSC, fontSize: sz, letterSpacing: sz * 0.34 }}>
                  <textPath href="#italyArc" startOffset="50%" textAnchor="middle">
                    ITALY
                  </textPath>
                </text>
              </g>
            );
          })()}
          {/* "eastern Mediterranean": the one sea name, on its words, gone when Russia starts */}
          {label({ key: "sEM", text: ["Eastern", "Mediterranean"], x: PLACES.easternMed.x, y: PLACES.easternMed.y, size: 30, f0: CUE.easternMed, fOut: 393, op: 0.8, family: fell, italic: true, spacing: 0.06, halo: true })}

          {/* the claimants at the payoff wide */}
          {label({ key: "wFr", text: "FRANCE", x: PLACES.wFrance.x, y: PLACES.wFrance.y, size: 40, spacing: 0.2, f0: W_LABEL_IN, op: payoffRung(frame) })}
          {label({ key: "wGe", text: "GERMANY", x: PLACES.wGermany.x, y: PLACES.wGermany.y, size: 40, spacing: 0.12, f0: W_LABEL_IN + 3, op: payoffRung(frame) })}
          {label({ key: "wIt", text: "ITALY", x: PLACES.wItaly.x, y: PLACES.wItaly.y, size: 40, spacing: 0.1, f0: W_LABEL_IN + 6, op: payoffRung(frame) })}
          {label({ key: "wRu", text: "RUSSIA", x: PLACES.wRussia.x, y: PLACES.wRussia.y, size: 42, spacing: 0.22, f0: W_LABEL_IN + 9, op: payoffRung(frame) })}

          {/* the wants named in the line */}
          {label({ key: "wAL", text: "ALSACE-LORRAINE", x: PLACES.alsaceLorraine.x, y: PLACES.alsaceLorraine.y, size: 26, spacing: 0.18, f0: CUE.alsaceLorraine, fOut: T.wantLabelsOut, halo: true })}
          {label({ key: "wBal", text: "THE BALKANS", x: PLACES.balkans.x, y: PLACES.balkans.y, size: 26, spacing: 0.22, f0: CUE.balkans, fOut: T.wantLabelsOut, halo: true })}
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

export default EverybodyWants;
