// ---------------------------------------------------------------------------
// sugarShared: THE SUGAR WORLD, shared read-only by cuts A-E of the clip
// "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands" (Dwarkesh with
// Sarah Paine; Dwarkesh map style). Built by builder W; once
// <clip>/animation_source/notes/WORLD_READY.md exists the existing exports never
// change (additions only, each logged there as a dated CHANGED: note).
//
// THE WORLD. North-up MERCATOR, 40 world px per degree of longitude:
//   x = 40 (lon + 110),  y = 40 (M(68) - M(lat)),  M(lat) = ln tan(45 + lat/2) in degrees
// The page: lon -110..100, lat -40..68 = world x 0..8400, y 0..5502 (the far raster
// levels run on to lat -80..85 so a k < 0.32 frame never shows an edge).
// k = screen px per world px: k 1 = 40 screen px per degree (the eastern seaboard
// Maine -> Georgia fills the column at k ~0.95); the Atlantic from Britain to New
// York at k ~0.2; India close at k ~2.
// The static map (sea, 4 engraved water-lines, 10 deg graticule, land + rim, cream
// coast; NO borders, NO fills) is a tiled raster LOD pyramid
// (scripts/bake-sugar-rasters.mjs -> public/sugar/*.png, sugarLevels.ts):
//   globe (base, sharp to k 0.2) | world band 0.19-0.21 | atlantic + indian band
//   0.46-0.50 (sharp to 1.25) | usEast carib channel capeVerde southIndia band
//   1.25-1.35 (sharp to 3.0). HOLD THE CAMERA OUTSIDE THE BANDS.
// Geometry: scripts/build-sugar-map.mjs -> sugarMapData.ts (its header lists every
// source URL, the 1778 polity groups and every approximation).
//
// ONE GLOBAL CLOCK. Every cut is a window onto ONE scene (sugarScene.tsx) of the
// global sequence frame g. Animated values run on the STORY clock s = S(g): g minus
// the frames of every gap before it, frozen inside a gap, so cut N+1's first frame
// is one story step after cut N's last (0 px joins).
//   A 42..161 -> s 42..161 | B 312..446 -> s 162..296 | C 571..865 -> s 297..591 |
//   D 920..1513 -> s 592..1185 | E 1679..1826 -> s 1186..1333
//
// API: see WORLD_READY.md (one line per export).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { LEVELS } from "./sugarLevels";
import {
  COLONIES,
  COLONIES_D,
  COLONY_COAST,
  COLONY_INNER_D,
  COLONY_OUTER_D,
  COLONY_RINGS,
  GROUPS,
  MISSISSIPPI,
  PERIOD_BORDERS_D,
  PLACES,
  POSTS,
  PROJ,
  type Box,
  type Group,
  type GroupKey,
  type P2,
  type Piece,
  type Place,
  type Side,
} from "./sugarMapData";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
loadFell("italic", { weights: ["400"], subsets: ["latin"] });
export { fellSC, fell };

export type { Box, Group, GroupKey, P2, Piece, Place, Side };
export { COLONIES, COLONIES_D, COLONY_COAST, COLONY_INNER_D, COLONY_OUTER_D, COLONY_RINGS, GROUPS, MISSISSIPPI, PERIOD_BORDERS_D, PLACES, POSTS };

// ---------------------------------------------------------------------------
// Frame, palette
// ---------------------------------------------------------------------------
export const FPS = 24;
export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const SCREEN_CX = 540;
export const SCREEN_CY = 960;
export const CONTENT_Y = 835;
export const CAPTION_TOP = 1150;

export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DARK = "#0B0907";
/** THE OPACITY LADDER of the clip: in play / context / receded context */
export const RUNG = { full: 1, mid: 0.45, low: 0.2 } as const;
/** CHANGED 2026-10-05: the rung earlier acts' orange recedes to during D's tour (CD's
 *  polity fills use the same) */
export const TOUR_RUNG = 0.3;
/** CHANGED 2026-10-05: THE DARK ATLAS PAGE - the colour the rasters fade into poleward
 *  (the sea darkened 40 %) and the scene's background, so no raster edge or tone step
 *  can ever show (the grain comes from PaperTop) */
export const PAGE = "#101417";

// ---------------------------------------------------------------------------
// Maths
// ---------------------------------------------------------------------------
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const easeInOutSine = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(v));
/** 0 -> 1 over [a, b] with smoothstep */
export const ramp = (v: number, a: number, b: number) => smoothstep((v - a) / (b - a));
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** a deterministic LCG in 0..1 */
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mixColor = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};
export const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const dOf = (pts: P2[], close = false) =>
  pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}${close ? "Z" : ""}` : "";

// ---------------------------------------------------------------------------
// THE STORY CLOCK
// ---------------------------------------------------------------------------
/** the five cuts on the Premiere sequence (global frames; OUT exclusive) */
export const CUTS = [
  { key: "A", name: "ThirteenColonies", in: 42, out: 162 },
  { key: "B", name: "DeathGround", in: 312, out: 447 },
  { key: "C", name: "DownAPeg", in: 571, out: 866 },
  { key: "D", name: "GlobalWar", in: 920, out: 1514 },
  { key: "E", name: "KeepTheCaribbean", in: 1679, out: 1827 },
] as const;
export type CutKey = (typeof CUTS)[number]["key"];
/** global frame -> story frame (gaps frozen: s(IN of cut N+1) = s(last frame of cut N) + 1) */
export const S = (g: number) => {
  let s = g;
  for (let i = 1; i < CUTS.length; i++) {
    const g0 = CUTS[i - 1].out;
    const g1 = CUTS[i].in;
    if (g >= g1) s -= g1 - g0;
    else if (g > g0) s -= g - g0;
  }
  return s;
};
/** story frame -> the global frame inside a cut that shows it (s inside a cut's span) */
export const G = (s: number) => {
  for (const c of CUTS) {
    const s0 = S(c.in);
    const s1 = S(c.out - 1);
    if (s <= s1 + 0.5) return c.in + Math.max(0, s - s0);
  }
  return CUTS[CUTS.length - 1].out - 1 + (s - S(CUTS[CUTS.length - 1].out - 1));
};
/** each cut's story span [s0, s1] (inclusive) and its first story frame */
export const CUT_S = Object.fromEntries(CUTS.map((c) => [c.key, { s0: S(c.in), s1: S(c.out - 1), in: c.in, out: c.out }])) as Record<
  CutKey,
  { s0: number; s1: number; in: number; out: number }
>;

/** WORD ONSETS (global frame, word, cut) from notes/cut_frames.md (faster-whisper on
 *  the edit audio). Use sw(g) to convert a word's global frame to the story clock. */
export const WORDS: [number, string, CutKey][] = [
  [28, "Think", "A"], [30, "about", "A"], [35, "it.", "A"], [42, "The", "A"], [46, "13", "A"], [53, "revolting", "A"],
  [69, "colonies,", "A"], [83, "they", "A"], [89, "had", "A"], [93, "no", "A"], [96, "intention", "A"], [108, "of", "A"],
  [123, "doing", "A"], [128, "regime", "A"], [137, "change", "A"], [146, "in", "A"], [150, "London.", "A"], [162, "So", "A"],
  [288, "Continental", "B"], [297, "Congress.", "B"], [313, "So", "B"], [319, "the", "B"], [329, "colonists", "B"],
  [341, "fought", "B"], [352, "harder", "B"], [371, "because", "B"], [380, "they're", "B"], [385, "on", "B"], [388, "death", "B"],
  [394, "ground.", "B"], [414, "It's", "B"], [425, "big", "B"], [430, "theater.", "B"], [446, "It", "B"], [450, "protracts", "B"],
  [562, "because", "C"], [573, "a", "C"], [577, "lot", "C"], [579, "of", "C"], [583, "people", "C"], [591, "want", "C"],
  [595, "to", "C"], [598, "take", "C"], [602, "Britain", "C"], [609, "down", "C"], [615, "a", "C"], [623, "peg", "C"],
  [629, "in", "C"], [632, "this", "C"], [636, "era.", "C"], [646, "So", "C"], [655, "the", "C"], [659, "French", "C"],
  [668, "ally", "C"], [678, "with", "C"], [683, "the", "C"], [685, "colonies", "C"], [694, "in", "C"], [698, "1778,", "C"],
  [725, "then", "C"], [727, "the", "C"], [730, "Spanish", "C"], [738, "ally", "C"], [745, "with", "C"], [749, "the", "C"],
  [751, "French", "C"], [757, "in", "C"], [762, "1779,", "C"], [780, "and", "C"], [795, "the", "C"], [798, "Britain", "C"],
  [804, "attacks", "C"], [816, "the", "C"], [821, "Dutch", "C"], [829, "in", "C"], [839, "1780.", "C"], [861, "So", "C"],
  [902, "regional", "D"], [910, "war", "D"], [919, "becomes", "D"], [930, "a", "D"], [936, "global", "D"], [946, "war.", "D"],
  [965, "The", "D"], [969, "French", "D"], [976, "attack", "D"], [984, "Savannah.", "D"], [1001, "The", "D"], [1003, "Spanish", "D"],
  [1011, "attack", "D"], [1020, "Louisiana.", "D"], [1034, "The", "D"], [1047, "French", "D"], [1054, "want", "D"], [1060, "to", "D"],
  [1064, "try", "D"], [1070, "to", "D"], [1073, "invade", "D"], [1083, "England", "D"], [1098, "from", "D"], [1104, "the", "D"],
  [1107, "Isle", "D"], [1113, "of", "D"], [1116, "Wight.", "D"], [1128, "The", "D"], [1130, "British", "D"], [1137, "are", "D"],
  [1140, "trying", "D"], [1143, "to", "D"], [1146, "fight", "D"], [1152, "with", "D"], [1155, "the", "D"], [1157, "French", "D"],
  [1163, "at", "D"], [1167, "Ushant.", "D"], [1185, "And", "D"], [1188, "then", "D"], [1190, "the", "D"], [1197, "French", "D"],
  [1209, "and", "D"], [1213, "the", "D"], [1215, "Spanish", "D"], [1226, "are", "D"], [1235, "attacking", "D"], [1245, "British", "D"],
  [1253, "possessions", "D"], [1264, "of", "D"], [1270, "Gibraltar,", "D"], [1286, "Menorca.", "D"], [1300, "And", "D"], [1307, "the", "D"],
  [1310, "French,", "D"], [1318, "I", "D"], [1319, "guess,", "D"], [1325, "are", "D"], [1326, "attacking", "D"], [1334, "British", "D"],
  [1343, "possessions", "D"], [1355, "Cape", "D"], [1360, "Verde", "D"], [1369, "Islands", "D"], [1379, "off", "D"], [1387, "Africa.", "D"],
  [1408, "The", "D"], [1409, "British", "D"], [1416, "attack", "D"], [1428, "French", "D"], [1439, "possessions", "D"], [1458, "at", "D"],
  [1465, "Mahe", "D"], [1474, "and", "D"], [1476, "Pondicherry", "D"], [1489, "in", "D"], [1500, "India.", "D"], [1518, "And", "D"],
  [1659, "what's", "E"], [1672, "valuable.", "E"], [1684, "And", "E"], [1686, "the", "E"], [1689, "British", "E"], [1696, "decide,", "E"],
  [1713, "get", "E"], [1716, "rid", "E"], [1718, "of", "E"], [1721, "the", "E"], [1723, "revolting", "E"], [1734, "colonies.", "E"],
  [1750, "They", "E"], [1750, "aren't", "E"], [1753, "much", "E"], [1758, "in", "E"], [1768, "this", "E"], [1785, "day", "E"],
  [1791, "and", "E"], [1796, "keep", "E"], [1802, "things", "E"], [1809, "in", "E"], [1812, "the", "E"], [1814, "Caribbean.", "E"],
  [1826, "And", "E"], [1836, "so", "E"],
];
/** the story frame of a word's global onset frame */
export const sw = (g: number) => S(g);

// ---------------------------------------------------------------------------
// Projection (Mercator; identical to scripts/build-sugar-map.mjs)
// ---------------------------------------------------------------------------
const MERC = (lat: number) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
/** lon/lat (deg) -> world px */
export const project = (lon: number, lat: number): P2 => [PROJ.ppd * (lon - PROJ.lon0), PROJ.ppd * (PROJ.mercTop - MERC(lat))];
/** world px -> [lon, lat] */
export const unproject = ([x, y]: P2): P2 => [x / PROJ.ppd + PROJ.lon0, ((2 * Math.atan(Math.exp(((PROJ.mercTop - y / PROJ.ppd) * Math.PI) / 180)) - Math.PI / 2) * 180) / Math.PI];
/** world px per km at latitude lat (Mercator scale 1 / cos lat) */
export const pxPerKm = (lat: number) => (PROJ.ppd / 111.32) / Math.cos((lat * Math.PI) / 180);
{
  const L = project(PLACES.london.lon, PLACES.london.lat);
  if (Math.hypot(L[0] - PLACES.london.x, L[1] - PLACES.london.y) > 0.02) throw new Error("sugarShared project() disagrees with the build");
}
/** a place as a world point */
export const at = (k: keyof typeof PLACES): P2 => [PLACES[k].x, PLACES[k].y];

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
export type Cam = { k: number; cx: number; cy: number };
export const screenOf = ([x, y]: P2, cam: Cam): P2 => [SCREEN_CX + (x - cam.cx) * cam.k, SCREEN_CY + (y - cam.cy) * cam.k];
export const worldOf = ([sx, sy]: P2, cam: Cam): P2 => [cam.cx + (sx - SCREEN_CX) / cam.k, cam.cy + (sy - SCREEN_CY) / cam.k];
/** the camera that puts world point p at screen (sx, sy) at zoom k */
export const camFor = (p: P2, k: number, sx = SCREEN_CX, sy = CONTENT_Y): Cam => ({ k, cx: p[0] - (sx - SCREEN_CX) / k, cy: p[1] - (sy - SCREEN_CY) / k });
export const viewRect = (cam: Cam, marginPx = 0) => ({
  x0: cam.cx - (SCREEN_CX + marginPx) / cam.k,
  x1: cam.cx + (FRAME_W - SCREEN_CX + marginPx) / cam.k,
  y0: cam.cy - (SCREEN_CY + marginPx) / cam.k,
  y1: cam.cy + (FRAME_H - SCREEN_CY + marginPx) / cam.k,
});
export const camTransform = (cam: Cam) => {
  const tx = SCREEN_CX - cam.cx * cam.k;
  const ty = SCREEN_CY - cam.cy * cam.k;
  return { tx, ty, svg: `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(6)})` };
};
/** the house hand on the camera (screen px); pass the STORY frame s */
export const sway = (s: number) => ({ dx: 3 * Math.sin(s / 23), dy: 5 * Math.sin(s / 19) });
export const swayCam = (cam: Cam, s: number): Cam => {
  const w = sway(s);
  return { k: cam.k, cx: cam.cx + w.dx / cam.k, cy: cam.cy + w.dy / cam.k };
};
/** monotone cubic (pchip) through keys [x, y]; heldEnds = zero end slopes */
export const pchip = (keys: [number, number][], heldEnds = false) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return heldEnds ? 0 : d[0];
    if (i === n - 1) return heldEnds ? 0 : d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};
/** [from, to, area, taper]: a cosine-tapered velocity bump whose integral is `area` */
export type Bump = [number, number, number, number];
const bumpV = ([a, b, area, alpha]: Bump, f: number) => {
  if (f <= a || f >= b) return 0;
  const len = b - a;
  const tp = Math.max(1e-6, (alpha * len) / 2);
  const hgt = area / (len - tp);
  const x = f - a;
  if (x < tp) return hgt * 0.5 * (1 - Math.cos((Math.PI * x) / tp));
  if (x > len - tp) return hgt * 0.5 * (1 - Math.cos((Math.PI * (len - x)) / tp));
  return hgt;
};
/** a channel as the integral of velocity bumps (C1 end to end); value v0 before every bump */
export const makeTrack = (bumps: Bump[], v0: number, fLo = -100, fHi = 1600, sub = 4) => {
  const n = (fHi - fLo) * sub;
  const arr = new Float64Array(n + 1);
  let acc = v0;
  arr[0] = acc;
  let vPrev = bumps.reduce((s, bb) => s + bumpV(bb, fLo), 0);
  for (let i = 1; i <= n; i++) {
    const f = fLo + i / sub;
    const v = bumps.reduce((s, bb) => s + bumpV(bb, f), 0);
    acc += ((vPrev + v) / 2) * (1 / sub);
    arr[i] = acc;
    vPrev = v;
  }
  return (f: number) => {
    const p = (f - fLo) * sub;
    const i = Math.max(0, Math.min(n - 1, Math.floor(p)));
    const u = clamp01(p - i);
    return arr[i] + (arr[i + 1] - arr[i]) * u;
  };
};
/** the normalised integral of a tapered bump: 0 -> 1 over u 0 -> 1 (taper 1 = raised cosine) */
const taperEase = (alpha: number) => {
  const tr = makeTrack([[0, 1000, 1, alpha]], 0, 0, 1000, 1);
  return (u: number) => tr(clamp01(u) * 1000);
};
/** VAN WIJK & NUIJ smooth zoom-pan (2003; rho ~1.4): the optimal path between two
 *  cameras for a long hop (zoom out, travel, zoom in). Returns p(t) -> Cam for t 0..1
 *  (t linear in perceived path length) and S (the path length; seconds ~ S / speed). */
export const zoomPath = (a: Cam, b: Cam, rho = 1.4) => {
  const w0 = FRAME_W / a.k;
  const w1 = FRAME_W / b.k;
  const ux0 = a.cx;
  const uy0 = a.cy;
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const d2 = dx * dx + dy * dy;
  const r2 = rho * rho;
  const r4 = r2 * r2;
  if (d2 < 1e-9) {
    const Sx = Math.log(w1 / w0) / rho;
    return { S: Math.abs(Sx), p: (t: number): Cam => ({ k: FRAME_W / (w0 * Math.exp(rho * t * Sx)), cx: ux0 + t * dx, cy: uy0 + t * dy }) };
  }
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + r4 * d2) / (2 * w0 * r2 * d1);
  const b1 = (w1 * w1 - w0 * w0 - r4 * d2) / (2 * w1 * r2 * d1);
  const rr0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const rr1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const Sx = (rr1 - rr0) / rho;
  const ch = Math.cosh(rr0);
  const sh = Math.sinh(rr0);
  return {
    S: Sx,
    p: (t: number): Cam => {
      const s = t * Sx;
      const u = (w0 / (r2 * d1)) * (ch * Math.tanh(rho * s + rr0) - sh);
      const w = (w0 * ch) / Math.cosh(rho * s + rr0);
      return { k: FRAME_W / w, cx: ux0 + u * dx, cy: uy0 + u * dy };
    },
  };
};
/** a framing: world point p at screen (sx, sy) at zoom k */
export type Framing = { p: P2; k: number; sx?: number; sy?: number };
/** a move carries the camera from framing i to framing i + 1 over story frames
 *  [from, to]: path "line" (default) = one cosine-tapered velocity bump in (ln k, cx,
 *  cy) (taper 1 lands at rest, C1); path "vw" = the van Wijk-Nuij zoom-out/zoom-in
 *  path, eased by the same taper. Moves may overlap (they add: a creep under a glide). */
export type Move = { from: number; to: number; taper?: number; path?: "line" | "vw"; rho?: number };
export type CamTrack = ((s: number) => Cam) & { rest: Cam };
const camOfFraming = (q: Framing): Cam => camFor(q.p, q.k, q.sx ?? SCREEN_CX, q.sy ?? CONTENT_Y);
/** THE KEYED CAMERA TRACK. Framings F0..Fn and n moves (move i = Fi -> Fi+1). Before
 *  move 0 the camera sits at F0; after the last it rests at Fn (track.rest). Returns
 *  camAt(s) (no sway: render swayCam(camAt(s), s)). */
export const makeCamTrack = (framings: Framing[], moves: Move[]): CamTrack => extendCamTrack(null, framings, moves);
/** EXTEND an earlier act's track: framing 0 is the base's rest (do not pass it), so
 *  pass only your new framings; each of your moves adds its delta on top of the base
 *  (which may still be creeping when you start). The result rests at your last
 *  framing. extendCamTrack(base, [], []) = the base. */
export const extendCamTrack = (base: CamTrack | null, framings: Framing[], moves: Move[]): CamTrack => {
  const cams: Cam[] = base ? [base.rest, ...framings.map(camOfFraming)] : framings.map(camOfFraming);
  if (moves.length !== cams.length - 1) throw new Error("extendCamTrack: one move per framing step");
  const F = cams.map((c) => [Math.log(c.k), c.cx, c.cy]);
  const lineMoves = moves.map((m, i) => ({ m, i })).filter((q) => (q.m.path ?? "line") === "line");
  const vwMoves = moves
    .map((m, i) => ({ m, i }))
    .filter((q) => q.m.path === "vw")
    .map(({ m, i }) => ({ m, i, zp: zoomPath(cams[i], cams[i + 1], m.rho ?? 1.4), ease: taperEase(m.taper ?? 1) }));
  const ch = (c: number) =>
    makeTrack(
      lineMoves.map(({ m, i }) => [m.from, m.to, F[i + 1][c] - F[i][c], m.taper ?? 1] as Bump),
      0,
    );
  const LK = ch(0);
  const CX = ch(1);
  const CY = ch(2);
  const f0 = F[0];
  const fn = (s: number): Cam => {
    let lk = LK(s);
    let cx = CX(s);
    let cy = CY(s);
    for (const v of vwMoves) {
      const u = v.ease((s - v.m.from) / (v.m.to - v.m.from));
      if (u <= 0) continue;
      const c = v.zp.p(u);
      lk += Math.log(c.k) - F[v.i][0];
      cx += c.cx - F[v.i][1];
      cy += c.cy - F[v.i][2];
    }
    if (base) {
      const b = base(s);
      return { k: b.k * Math.exp(lk), cx: b.cx + cx, cy: b.cy + cy };
    }
    return { k: Math.exp(f0[0] + lk), cx: f0[1] + cx, cy: f0[2] + cy };
  };
  return Object.assign(fn, { rest: cams[cams.length - 1] });
};
/** the camera's per-story-frame velocity (d ln k, d cx, d cy) */
export const camVel = (camAt: (s: number) => Cam, s: number) => {
  const a = camAt(s - 0.5);
  const b = camAt(s + 0.5);
  return { lnk: Math.log(b.k) - Math.log(a.k), cx: b.cx - a.cx, cy: b.cy - a.cy };
};
/** max screen speed (px/frame) and max |dv| (px/f^2) over s0..s1 of a probe grid above
 *  the caption band and of the given world points */
export const camScan = (camAt: (s: number) => Cam, s0: number, s1: number, pts: P2[] = []) => {
  const probes: P2[] = [];
  for (let sy = 150; sy <= 1150; sy += 250) for (let sx = 60; sx <= 1020; sx += 240) probes.push([sx, sy]);
  const gridV = (f: number) =>
    probes.map(([sx, sy]) => {
      const w = worldOf([sx, sy], camAt(f));
      const [bx, by] = screenOf(w, camAt(f + 1));
      return [bx - sx, by - sy] as P2;
    });
  const out = { gridMaxV: 0, gridMaxVf: s0, gridMaxDv: 0, gridMaxDvf: s0, pts: pts.map(() => ({ maxV: 0, maxVf: s0 })) };
  let pg = gridV(s0);
  for (let f = s0 + 1; f < s1; f++) {
    const g = gridV(f);
    g.forEach(([x, y], i) => {
      const sp = Math.hypot(x, y);
      if (sp > out.gridMaxV) [out.gridMaxV, out.gridMaxVf] = [sp, f];
      const dv = Math.hypot(x - pg[i][0], y - pg[i][1]);
      if (dv > out.gridMaxDv) [out.gridMaxDv, out.gridMaxDvf] = [dv, f];
    });
    pts.forEach((p, i) => {
      const a = screenOf(p, camAt(f));
      const b = screenOf(p, camAt(f + 1));
      const sp = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (sp > out.pts[i].maxV) [out.pts[i].maxV, out.pts[i].maxVf] = [sp, f];
    });
    pg = g;
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE MAP: LOD tiles (sugarLevels.ts), world-space mottle, paper on top
// ---------------------------------------------------------------------------
const COVER_FADE = 48;
export const levelWeights = (cam: Cam) => {
  const v = viewRect(cam, 16);
  return LEVELS.map((L) => {
    const kw = L.band ? smoothstep(Math.log(cam.k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1;
    if (kw <= 0) return 0;
    if (!L.band) return 1;
    const inset = Math.min(v.x0 - L.x0, L.x0 + L.w - v.x1, v.y0 - L.y0, L.y0 + L.h - v.y1) * cam.k;
    return kw * smoothstep(inset / COVER_FADE);
  });
};
/** the level that dominates this camera's frame and its sharpness (texels per screen px; >= ~0.95 sharp) */
export const mapSharpness = (cam: Cam) => {
  const w = levelWeights(cam);
  let top = 0;
  let best = -1;
  for (let i = 0; i < w.length; i++) if (w[i] >= 0.5 && LEVELS[i].s > best) [top, best] = [i, LEVELS[i].s];
  return { level: LEVELS[top].name, weight: w[top], texelsPerPx: LEVELS[top].s / cam.k, weights: w };
};
/** the baked map under the camera (no grain / vignette: see PaperTop) */
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number }> = ({ cam, mottleOpacity = 0.9 }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  // draw far -> close; skip a level fully covered by an opaque sharper one
  const order = LEVELS.map((L, i) => ({ L, i })).sort((a, b) => a.L.s - b.L.s);
  const layers = order.map(({ L, i: li }) => {
    if (w[li] <= 0.001) return null;
    if (order.some(({ L: o, i: j }) => o.s > L.s && w[j] >= 0.999)) return null;
    const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
    return (
      <div key={L.name} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: w[li] }}>
        {tiles.map((t) => (
          <Img
            key={t.f}
            src={staticFile(`sugar/${t.f}`)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: t.W,
              height: t.H,
              transformOrigin: "0 0",
              transform: `translate(${(tx + t.x0 * k).toFixed(3)}px, ${(ty + t.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
            }}
          />
        ))}
      </div>
    );
  });
  // mottle tiles, world space, in octaves: stains keep ~ the same screen size through a zoom
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const mt: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const Sz = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((v.x0 - ox) / Sz) * Sz + ox;
    const y0 = Math.floor((v.y0 - oy) / Sz) * Sz + oy;
    for (let y = y0; y < v.y1; y += Sz) for (let x = x0; x < v.x1; x += Sz) mt.push({ x, y, s: Sz, o: op });
  });
  return (
    <>
      {layers}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: mottleOpacity,
        }}
      >
        {mt.map((t, i) => (
          <Img key={`m-${i}`} src={staticFile("manchuria/mottle.png")} style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }} />
        ))}
      </div>
    </>
  );
};
/** screen-space paper: grain, then the soft vignette (draw it LAST) */
export const PaperTop: React.FC<{ vignette?: number; grainOpacity?: number }> = ({ vignette = 0.55, grainOpacity = 1 }) => (
  <>
    <Img src={staticFile("manchuria/grain.png")} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: grainOpacity }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
      }}
    />
  </>
);
/** a full-frame svg whose children draw in world px under the camera */
export const WorldSvg: React.FC<{ cam: Cam; children?: React.ReactNode }> = ({ cam, children }) => (
  <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
    <g transform={camTransform(cam).svg}>{children}</g>
  </svg>
);

// ---------------------------------------------------------------------------
// Routes (polylines with arclength)
// ---------------------------------------------------------------------------
export type Route = {
  pts: P2[];
  cum: number[];
  len: number;
  d: string;
  pointAt: (s: number) => P2;
  tangentAt: (s: number) => P2;
  partialPath: (s0: number, s1: number) => P2[];
  partialD: (s0: number, s1: number) => string;
};
export const makeRoute = (pts: P2[]): Route => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const seg = (s: number) => {
    const t = Math.max(0, Math.min(len, s));
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= t) lo = mid;
      else hi = mid;
    }
    return { lo, hi, u: (t - cum[lo]) / (cum[hi] - cum[lo] || 1) };
  };
  const pointAt = (s: number): P2 => {
    const { lo, hi, u } = seg(s);
    return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * u, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * u];
  };
  const tangentAt = (s: number): P2 => {
    const a = pointAt(Math.max(0, s - 1.5));
    const b = pointAt(Math.min(len, s + 1.5));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const partialPath = (s0: number, s1: number): P2[] => {
    const a0 = Math.max(0, Math.min(len, Math.min(s0, s1)));
    const a1 = Math.max(0, Math.min(len, Math.max(s0, s1)));
    const A = seg(a0);
    const B = seg(a1);
    const out: P2[] = [pointAt(a0)];
    for (let i = A.hi; i <= B.lo; i++) out.push(pts[i]);
    out.push(pointAt(a1));
    return out;
  };
  return { pts, cum, len, d: dOf(pts), pointAt, tangentAt, partialPath, partialD: (s0, s1) => dOf(partialPath(s0, s1)) };
};
/** a smooth route through waypoints (world px): centripetal Catmull-Rom, ~step px samples */
export const smoothRoute = (wps: P2[], step = 3): Route => {
  if (wps.length < 3) return makeRoute(wps);
  const ext: P2[] = [
    [2 * wps[0][0] - wps[1][0], 2 * wps[0][1] - wps[1][1]],
    ...wps,
    [2 * wps[wps.length - 1][0] - wps[wps.length - 2][0], 2 * wps[wps.length - 1][1] - wps[wps.length - 2][1]],
  ];
  const out: P2[] = [wps[0]];
  const dd = (p: P2, q: P2) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const knot = (p: P2, q: P2) => Math.pow(dd(p, q), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const n = Math.max(4, Math.ceil(dd(p1, p2) / step));
    for (let s = 1; s <= n; s++) {
      const t = t1 + ((t2 - t1) * s) / n;
      const L = (A: P2, B: P2, ta: number, tb: number): P2 => [((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0], ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1]];
      const A1 = L(p0, p1, 0, t1);
      const A2 = L(p1, p2, t1, t2);
      const A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, 0, t2);
      const B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  return makeRoute(out);
};

// ---------------------------------------------------------------------------
// LINES. One stroke family: cream ink 2.0 px, orange 2.6 px over a dark casing, fine
// dashed cream 1.4 px. Dashes are world-anchored octave dashes (keep their screen
// size through a zoom, never crawl).
// ---------------------------------------------------------------------------
export const W_INK = 2.0;
export const W_FINE = 1.4;
export const W_ORANGE = 2.6;
const DASH = 11;
export const octaveDashes = (k: number, base = DASH) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = base / Math.pow(2, o);
  return [
    { p: a, op: 1 - t },
    { p: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
/** a crisp cream line over a faint dark casing */
export const InkLine: React.FC<{ d: string; cam: Cam; opacity?: number; width?: number; color?: string }> = ({ d, cam, opacity = 1, width = W_INK, color = INK }) => {
  if (opacity <= 0.002 || !d) return null;
  const px = (v: number) => v / cam.k;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.45 * opacity} strokeWidth={px(width + 2.4)} />
      <path d={d} stroke={color} strokeOpacity={0.94 * opacity} strokeWidth={px(width)} />
    </g>
  );
};
/** fine dashed cream: borders (default the 0.45 rung) */
export const DashedBorder: React.FC<{ d: string; cam: Cam; opacity?: number; width?: number; color?: string }> = ({ d, cam, opacity = RUNG.mid, width = W_FINE, color = INK }) => {
  if (opacity <= 0.002 || !d) return null;
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {octaveDashes(cam.k).map((q) => (
        <path key={`db-${q.p}`} d={d} stroke={color} strokeOpacity={opacity * q.op} strokeWidth={width / cam.k} strokeDasharray={`${(q.p * 0.58).toFixed(5)} ${(q.p * 0.42).toFixed(5)}`} />
      ))}
    </g>
  );
};
/** an orange (or any colour) line over a dark casing. dash 0 = dashed (62 % on), 1 =
 *  solid; dashOffset (world px) phases the dashes */
export const OrangeLine: React.FC<{ d: string; cam: Cam; opacity?: number; width?: number; dash?: number; dashOffset?: number; color?: string; dashBase?: number }> = ({
  d,
  cam,
  opacity = 1,
  width = W_ORANGE,
  dash = 1,
  dashOffset = 0,
  color = ACCENT,
  dashBase = DASH,
}) => {
  if (opacity <= 0.002 || !d) return null;
  const px = (v: number) => v / cam.k;
  const s = clamp01(dash);
  if (s >= 0.999)
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke={DARK} strokeOpacity={0.55 * opacity} strokeWidth={px(width + 2.8)} />
        <path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={px(width)} />
      </g>
    );
  const on = 0.62 + 0.38 * s;
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {octaveDashes(cam.k, dashBase).map((q) => (
        <g key={`ol-${q.p}`} opacity={q.op}>
          <path
            d={d}
            stroke={DARK}
            strokeOpacity={0.55 * opacity}
            strokeWidth={px(width + 2.8)}
            strokeDasharray={`${(q.p * on + px(2.8)).toFixed(5)} ${Math.max(0, q.p * (1 - on) - px(2.8)).toFixed(5)}`}
            strokeDashoffset={dashOffset + px(1.4)}
          />
          <path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={px(width)} strokeDasharray={`${(q.p * on).toFixed(5)} ${(q.p * (1 - on)).toFixed(5)}`} strokeDashoffset={dashOffset} />
        </g>
      ))}
    </g>
  );
};
/** a line along a route from s0 to s1 (dash as OrangeLine; dashes anchored at route
 *  arclength dashFrom so they never crawl as s0 / s1 move) */
export const RouteLine: React.FC<{ route: Route; cam: Cam; s0: number; s1: number; dash?: number; dashFrom?: number; opacity?: number; width?: number; color?: string; dashBase?: number }> = ({
  route,
  cam,
  s0,
  s1,
  dash = 1,
  dashFrom = 0,
  opacity = 1,
  width,
  color,
  dashBase,
}) => {
  if (s1 - s0 < 0.01) return null;
  return <OrangeLine d={route.partialD(s0, s1)} cam={cam} dash={dash} dashOffset={Math.min(s0, s1) - dashFrom} opacity={opacity} width={width} color={color} dashBase={dashBase} />;
};

// ---------------------------------------------------------------------------
// FILLS. The orange side = deep orange fill + orange engraved hatch (the house
// "gained territory" symbol); Britain's side = a lit cream wash + a FINER cream hatch
// at the 0.45 rung. Both clipped to the polity's land (the d is land-only), optionally
// revealed by a crisp travelling front (reveal = the covered region as an svg d in
// world px; feather <= 10 screen px). World-anchored lines at 45 deg, octave-stable
// spacing. `id` must be unique within a frame.
// ---------------------------------------------------------------------------
export const HATCH_ANGLE = 45;
export const HATCH_PX = 9; // orange: 9..18 screen px spacing
export const CREAM_HATCH_PX = 6; // cream: finer
const HATCH_W = 1.9;
const CREAM_HATCH_W = 1.1;
const hatchGeom = (k: number, px: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  return { P: (2 * px) / Math.pow(2, o), mid: L2 - o };
};
export type FillSide = "orange" | "cream";
/** cream wash / hatch strengths at opacity 1 */
export const CREAM_WASH = 0.16;
export const CREAM_HATCH_OP = RUNG.mid;
export const Fill: React.FC<{
  id: string;
  d: string;
  cam: Cam;
  side?: FillSide;
  opacity?: number;
  reveal?: string;
  feather?: number;
  fill?: number; // the base wash's opacity at opacity 1 (orange default 0.2, cream CREAM_WASH)
  hatch?: number; // the hatch's opacity at opacity 1 (orange default 0.85, cream CREAM_HATCH_OP)
}> = ({ id, d, cam, side = "orange", opacity = 1, reveal, feather = 6, fill, hatch }) => {
  if (opacity <= 0.002 || !d) return null;
  const orange = side === "orange";
  const { P, mid } = hatchGeom(cam.k, orange ? HATCH_PX : CREAM_HATCH_PX);
  const w = (orange ? HATCH_W : CREAM_HATCH_W) / cam.k;
  const col = orange ? ACCENT : INK;
  const v = viewRect(cam, 40);
  const fo = (fill ?? (orange ? 0.2 : CREAM_WASH)) * opacity;
  const ho = (hatch ?? (orange ? 0.85 : CREAM_HATCH_OP)) * opacity;
  const body = (
    <>
      {fo > 0.002 ? <path d={d} fillRule="evenodd" fill={orange ? ACCENT_DEEP : INK} fillOpacity={fo} /> : null}
      {ho > 0.002 ? <path d={d} fillRule="evenodd" fill={`url(#${id}-p)`} opacity={ho} /> : null}
    </>
  );
  return (
    <g>
      <defs>
        <pattern id={`${id}-p`} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform={`rotate(${HATCH_ANGLE})`}>
          <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={col} strokeWidth={w} />
          <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={col} strokeWidth={w} strokeOpacity={mid} />
          <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={col} strokeWidth={w} />
        </pattern>
        {reveal !== undefined ? (
          <>
            {feather > 0 ? (
              <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0}>
                <feGaussianBlur stdDeviation={feather / 2.5 / cam.k} />
              </filter>
            ) : null}
            <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0}>
              <path d={reveal} fill="#fff" fillRule="evenodd" filter={feather > 0 ? `url(#${id}-f)` : undefined} />
            </mask>
          </>
        ) : null}
      </defs>
      {reveal !== undefined ? <g mask={`url(#${id}-m)`}>{body}</g> : body}
    </g>
  );
};
/** the d of a polity group at this zoom (the coarse dLo below k 1.2) */
export const groupD = (key: GroupKey, k: number) => (k < 1.2 && GROUPS[key].dLo ? GROUPS[key].dLo : GROUPS[key].d);
/** a 1778 polity group filled orange or cream (Fill with the group's land-only d) */
export const PolityFill: React.FC<Omit<React.ComponentProps<typeof Fill>, "d"> & { group: GroupKey }> = ({ group, cam, ...rest }) => (
  <Fill d={groupD(group, cam.k)} cam={cam} {...rest} />
);
/** a group's LAND edge (coasts excluded): dashed, orange or cream */
export const GroupEdge: React.FC<{ group: GroupKey; cam: Cam; side?: FillSide; opacity?: number; width?: number }> = ({ group, cam, side = "orange", opacity = 1, width }) =>
  side === "orange" ? (
    <OrangeLine d={GROUPS[group].border} cam={cam} dash={0} opacity={opacity} width={width ?? W_ORANGE} />
  ) : (
    <DashedBorder d={GROUPS[group].border} cam={cam} opacity={opacity} width={width ?? W_FINE} />
  );
/** THE POLAR PAGE FADE for vector overlays (CHANGED 2026-10-05): a world-space mask
 *  (opacity 1 between lat -35 and 64, 0 poleward of -40.5 / 68 = the overlay data's
 *  edge), matching the baked rasters' fade into the dark page (raster: lat 69 -> 78 N,
 *  -37 -> -48 S). sugarScene applies it round every act's layers when the frame reaches
 *  that far; acts need do nothing. */
export const POLAR_OVERLAY = { n1: 64, n0: 68, s1: -35, s0: -40.5 };
export const polarNeeded = (cam: Cam) => {
  const v = viewRect(cam, 20);
  return v.y0 < project(0, POLAR_OVERLAY.n1)[1] || v.y1 > project(0, POLAR_OVERLAY.s1)[1];
};
export const PolarMaskDefs: React.FC<{ id: string; cam: Cam }> = ({ id, cam }) => {
  const v = viewRect(cam, 40);
  const yN0 = project(0, POLAR_OVERLAY.n0)[1];
  const yN1 = project(0, POLAR_OVERLAY.n1)[1];
  const yS1 = project(0, POLAR_OVERLAY.s1)[1];
  const yS0 = project(0, POLAR_OVERLAY.s0)[1];
  const H = yS0 - yN0;
  return (
    <defs>
      <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={0} y1={yN0} x2={0} y2={yS0}>
        <stop offset={0} stopColor="#fff" stopOpacity={0} />
        <stop offset={(yN1 - yN0) / H} stopColor="#fff" stopOpacity={1} />
        <stop offset={(yS1 - yN0) / H} stopColor="#fff" stopOpacity={1} />
        <stop offset={1} stopColor="#fff" stopOpacity={0} />
      </linearGradient>
      <mask id={id} maskUnits="userSpaceOnUse" x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0}>
        <rect x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0} fill={`url(#${id}-g)`} />
      </mask>
    </defs>
  );
};
/** the 1778 land borders of every group (fine dashed cream, default 0.45 x 0.8) */
export const PeriodBorders: React.FC<{ cam: Cam; opacity?: number }> = ({ cam, opacity = RUNG.mid * 0.8 }) => <DashedBorder d={PERIOD_BORDERS_D} cam={cam} opacity={opacity} />;
/** the region on the near side of a straight front: { p : (p - origin) . n <= dist } (n a
 *  unit normal pointing the way the front travels), as a big quad (svg d) */
export const revealHalfPlane = (origin: P2, n: P2, dist: number, size = 20000) => {
  const t: P2 = [-n[1], n[0]];
  const c: P2 = [origin[0] + n[0] * dist, origin[1] + n[1] * dist];
  const a: P2 = [c[0] + t[0] * size, c[1] + t[1] * size];
  const b: P2 = [c[0] - t[0] * size, c[1] - t[1] * size];
  const a2: P2 = [a[0] - n[0] * size, a[1] - n[1] * size];
  const b2: P2 = [b[0] - n[0] * size, b[1] - n[1] * size];
  return dOf([a, b, b2, a2], true);
};
/** a disc of radius r round c (svg d): a front spreading from a point */
export const revealCircle = (c: P2, r: number, n = 72) => {
  if (r <= 0.001) return "M0,0Z";
  return dOf(
    Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos((2 * Math.PI * i) / n), c[1] + r * Math.sin((2 * Math.PI * i) / n)] as P2),
    true,
  );
};
/** a ring scaled by s about origin (svg d): grows a shape from a point, meeting its outline at s = 1 */
export const revealScaled = (ring: P2[], origin: P2, s: number) => {
  if (s <= 0.0005) return "M0,0Z";
  return dOf(
    ring.map(([x, y]) => [origin[0] + (x - origin[0]) * s, origin[1] + (y - origin[1]) * s] as P2),
    true,
  );
};
/** is world point p inside polygons given as [outer, ...holes][] (even-odd) */
export const inRings = (p: P2, polys: P2[][][]) => {
  let c = false;
  for (const poly of polys)
    for (const r of poly) {
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i];
        const [xj, yj] = r[j];
        if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
      }
    }
  return c;
};
export const inColonies = (p: P2) => inRings(p, COLONY_RINGS);

// ---------------------------------------------------------------------------
// LABELS: names only when spoken; slide up 24 px + fade, start ~8 f before the word
// ---------------------------------------------------------------------------
export const LABEL_TRAVEL = 24;
export const LABEL_FRAMES = 14;
export const LABEL_FADE = 9;
export const LABEL_LEAD = 8;
export const labelSlide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...CLAMP }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], CLAMP),
});
/** a label anchored to world point (x, y) + a screen offset (dx, dy); screen-sized.
 *  font "sc" = IM Fell English SC spaced caps (countries, regions), "roman" = IM Fell
 *  English (cities), "italic" (seas). frame / f0 on the STORY clock (f0 = word - 8). */
export const Label: React.FC<{
  text: string;
  x: number;
  y: number;
  cam: Cam;
  frame: number;
  f0: number;
  size?: number;
  spacing?: number;
  font?: "sc" | "roman" | "italic";
  anchor?: "start" | "middle" | "end";
  dx?: number;
  dy?: number;
  color?: string;
  opacity?: number;
}> = ({ text, x, y, cam, frame, f0, size = 40, spacing, font = "sc", anchor = "middle", dx = 0, dy = 0, color = INK, opacity = 1 }) => {
  const sl = labelSlide(frame, f0);
  if (sl.op * opacity <= 0.002) return null;
  const sp = spacing ?? (font === "sc" ? 0.32 : 0.02);
  const [sx, sy] = screenOf([x, y], cam);
  const trail = size * sp;
  const ax = anchor === "middle" ? trail / 2 : anchor === "end" ? trail : 0;
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + dx + ax}
        y={sy + dy + sl.dy}
        textAnchor={anchor}
        opacity={sl.op * opacity}
        fill={color}
        stroke={SEA}
        strokeOpacity={0.55}
        strokeWidth={size * 0.11}
        paintOrder="stroke"
        style={{ fontFamily: font === "sc" ? fellSC : fell, fontStyle: font === "italic" ? "italic" : "normal", fontSize: size, letterSpacing: size * sp }}
      >
        {text}
      </text>
    </svg>
  );
};
/** a big IM Fell numeral (13, 1778 ...) anchored to a world point, screen-sized:
 *  size = font px (IM Fell's old-style figures: font 230 px -> "13" ~160 px tall). */
export const Numeral: React.FC<{ text: string; x: number; y: number; cam: Cam; frame: number; f0: number; size?: number; color?: string; opacity?: number; anchor?: "start" | "middle" | "end" }> = ({
  text,
  x,
  y,
  cam,
  frame,
  f0,
  size = 230,
  color = INK,
  opacity = 1,
  anchor = "middle",
}) => {
  const sl = labelSlide(frame, f0);
  if (sl.op * opacity <= 0.002) return null;
  const [sx, sy] = screenOf([x, y], cam);
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx}
        y={sy + sl.dy * 1.5}
        textAnchor={anchor}
        opacity={sl.op * opacity}
        fill={color}
        stroke={SEA}
        strokeOpacity={0.6}
        strokeWidth={size * 0.035}
        paintOrder="stroke"
        style={{ fontFamily: fell, fontSize: size }}
      >
        {text}
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// GLYPHS
// ---------------------------------------------------------------------------
/** a small cream city dot (screen-sized) */
export const CityDot: React.FC<{ x: number; y: number; cam: Cam; r?: number; opacity?: number; color?: string }> = ({ x, y, cam, r = 5.5, opacity = 1, color = INK }) =>
  opacity > 0.002 ? <circle cx={x} cy={y} r={r / cam.k} fill={color} fillOpacity={0.94 * opacity} stroke={DARK} strokeOpacity={0.65 * opacity} strokeWidth={1.8 / cam.k} /> : null;
/** a thin ring round a point (screen-sized); progress 0..1 draws it clockwise from the top */
export const Ring: React.FC<{ x: number; y: number; cam: Cam; r?: number; progress?: number; opacity?: number; width?: number; color?: string }> = ({
  x,
  y,
  cam,
  r = 16,
  progress = 1,
  opacity = 1,
  width = 2.4,
  color = ACCENT,
}) => {
  if (opacity <= 0.002 || progress <= 0.001) return null;
  const R = r / cam.k;
  const C = 2 * Math.PI * R;
  const dash = progress >= 0.999 ? undefined : `${(C * progress).toFixed(4)} ${C.toFixed(4)}`;
  return (
    <g opacity={opacity} transform={`rotate(-90 ${x} ${y})`}>
      <circle cx={x} cy={y} r={R} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={(width + 2) / cam.k} strokeDasharray={dash} strokeLinecap="round" />
      <circle cx={x} cy={y} r={R} fill="none" stroke={color} strokeWidth={width / cam.k} strokeDasharray={dash} strokeLinecap="round" />
    </g>
  );
};
/** a faint travelling highlight: a soft bright stretch of `len` screen px centred on
 *  arclength s of a route (or of a circle: ring { x, y, r } and s in turns) */
export const Highlight: React.FC<{ cam: Cam; route?: Route; s: number; len?: number; ring?: { x: number; y: number; r: number }; opacity?: number; width?: number; color?: string }> = ({
  cam,
  route,
  s,
  len = 70,
  ring,
  opacity = 0.4,
  width = W_ORANGE + 1.2,
  color = mixColor(ACCENT, INK, 0.65),
}) => {
  if (opacity <= 0.002) return null;
  const N = 7;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const u0 = i / N - 0.5;
    const u1 = (i + 1) / N - 0.5;
    const w = Math.cos(Math.PI * ((u0 + u1) / 2));
    const a = opacity * w * w;
    if (a < 0.01) continue;
    let d = "";
    if (route) {
      const L = len / cam.k;
      d = route.partialD(s + u0 * L, s + u1 * L);
    } else if (ring) {
      const R = ring.r / cam.k;
      const turn = len / (2 * Math.PI * ring.r);
      const pts: P2[] = [];
      for (let j = 0; j <= 6; j++) {
        const ang = 2 * Math.PI * (s + (u0 + ((u1 - u0) * j) / 6) * turn) - Math.PI / 2;
        pts.push([ring.x + R * Math.cos(ang), ring.y + R * Math.sin(ang)]);
      }
      d = dOf(pts);
    }
    els.push(<path key={`hl-${i}`} d={d} fill="none" stroke={color} strokeOpacity={a} strokeWidth={width / cam.k} strokeLinecap="round" strokeLinejoin="round" />);
  }
  return <g>{els}</g>;
};
/** AN ENGRAVED ARROW that draws along a route: the shaft from s0 to the head at s1
 *  (route arclength, world px), a chevron head (screen-sized), orange or cream, solid
 *  or dashed (an intended-but-never-made move). opacity fades both. */
export const Arrow: React.FC<{
  route: Route;
  cam: Cam;
  s1: number;
  s0?: number;
  color?: string;
  dashed?: boolean;
  width?: number;
  head?: number; // chevron length, screen px
  opacity?: number;
}> = ({ route, cam, s1, s0 = 0, color = ACCENT, dashed = false, width = 3.2, head = 22, opacity = 1 }) => {
  if (opacity <= 0.002 || s1 - s0 < 0.5 / cam.k) return null;
  const hw = head / cam.k;
  const tip = route.pointAt(s1);
  const [tx, ty] = route.tangentAt(Math.max(0, s1 - hw * 0.5));
  const back = Math.max(s0, s1 - hw * 0.55);
  const a: P2 = [tip[0] - tx * hw - ty * hw * 0.55, tip[1] - ty * hw + tx * hw * 0.55];
  const b: P2 = [tip[0] - tx * hw + ty * hw * 0.55, tip[1] - ty * hw - tx * hw * 0.55];
  const headD = dOf([a, tip, b]);
  const showHead = s1 - s0 > hw * 0.6;
  return (
    <g>
      <RouteLine route={route} cam={cam} s0={s0} s1={showHead ? back : s1} dash={dashed ? 0 : 1} dashFrom={s0} color={color} width={width} opacity={opacity} dashBase={16} />
      {showHead ? (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={headD} stroke={DARK} strokeOpacity={0.55 * opacity} strokeWidth={(width + 2.8) / cam.k} />
          <path d={headD} stroke={color} strokeOpacity={opacity} strokeWidth={width / cam.k} />
        </g>
      ) : null}
    </g>
  );
};
// Lucide `swords` (lucide-static, ISC), as in NotConveyingAnything.tsx
const SWORDS = [
  "m13 19 6-6",
  "M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5",
  "m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586",
  "m16 16 4 4",
  "m19 21 2-2",
  "m5 14 4 4",
  "m5 21-2-2",
  "M7.5 16.5 4 20",
];
/** A BATTLE: the Lucide swords glyph in a thin ring, screen-sized (size = the ring's
 *  diameter, px), coloured by the ATTACKER (orange / cream). progress 0..1: the ring
 *  draws clockwise (0..0.6) while the glyph fades + rises in (0.3..1). */
export const BattleGlyph: React.FC<{ x: number; y: number; cam: Cam; size?: number; color?: string; progress?: number; opacity?: number }> = ({
  x,
  y,
  cam,
  size = 64,
  color = ACCENT,
  progress = 1,
  opacity = 1,
}) => {
  if (opacity <= 0.002 || progress <= 0.001) return null;
  const R = size / 2 / cam.k;
  const ringP = clamp01(progress / 0.6);
  const gp = smoothstep((progress - 0.3) / 0.7);
  const gs = (size * 0.62) / 24 / cam.k; // glyph box = 62 % of the ring
  const lift = (1 - gp) * 6;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={R} fill={SEA} fillOpacity={0.55 * ringP} />
      <Ring x={x} y={y} cam={cam} r={size / 2} progress={ringP} color={color} width={2.4} />
      {gp > 0.002 ? (
        <g transform={`translate(${x - 12 * gs} ${y - 12 * gs + lift / cam.k}) scale(${gs})`} opacity={gp} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {SWORDS.map((d, i) => (
            <path key={`sk${i}`} d={d} stroke={DARK} strokeOpacity={0.5} strokeWidth={4.2 / (gs * cam.k)} />
          ))}
          {SWORDS.map((d, i) => (
            <path key={`sw${i}`} d={d} stroke={color} strokeWidth={2.4 / (gs * cam.k)} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// DOTS: men as dots (1 dot = a body of men), screen-sized; orange = the side at war
// with Britain, cream = Britain's
// ---------------------------------------------------------------------------
export const DOT_R = 3.6; // screen px radius at k >= DOT_FULL_K
export const DOT_FULL_K = 0.45;
/** the dot radius at zoom k: full size at k >= 0.45, shrinking with the map below
 *  (so a crowd reads as a mass, not a smear, on the world wides); never under 1.6 px */
export const dotR = (k: number) => Math.max(1.6, DOT_R * Math.min(1, Math.pow(k / DOT_FULL_K, 0.6)));
export type Dot = { x: number; y: number; t?: number; op?: number; r?: number };
/** dots: the dark casings of all first, then the fills (t 0 cream -> 1 orange) */
export const Dots: React.FC<{ dots: Dot[]; cam: Cam; r?: number; opacity?: number }> = ({ dots, cam, r, opacity = 1 }) => {
  const R = r ?? dotR(cam.k);
  const cw = 1.6 / cam.k;
  return (
    <g>
      {dots.map((d, i) =>
        (d.op ?? 1) * opacity > 0.002 ? <circle key={`c${i}`} cx={d.x} cy={d.y} r={(d.r ?? R) / cam.k + cw / 2} fill={DARK} fillOpacity={0.62 * (d.op ?? 1) * opacity} /> : null,
      )}
      {dots.map((d, i) =>
        (d.op ?? 1) * opacity > 0.002 ? (
          <circle key={`f${i}`} cx={d.x} cy={d.y} r={(d.r ?? R) / cam.k - cw / 2 + 0.6 / cam.k} fill={mixColor(INK, ACCENT, d.t ?? 1)} fillOpacity={(d.op ?? 1) * opacity} />
        ) : null,
      )}
    </g>
  );
};
/** best-candidate blue noise: n points inside(box), each the farthest of `cand`
 *  candidates from those before it - any PREFIX is evenly spread (density rises
 *  evenly as you reveal points in order) */
export const blueNoise = (n: number, box: Box, inside: (p: P2) => boolean, seed = 1, cand = 24): P2[] => {
  const r = rng(seed);
  const pts: P2[] = [];
  let guard = 0;
  while (pts.length < n && guard < n * cand * 60) {
    let best: P2 | null = null;
    let bd = -1;
    let got = 0;
    while (got < cand && guard < n * cand * 60) {
      guard++;
      const p: P2 = [box.x0 + r() * (box.x1 - box.x0), box.y0 + r() * (box.y1 - box.y0)];
      if (!inside(p)) continue;
      got++;
      let d = Infinity;
      for (const q of pts) {
        const dd = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
        if (dd < d) d = dd;
      }
      if (d > bd) [bd, best] = [d, p];
    }
    if (best) pts.push(best);
  }
  return pts;
};
/** a COMPACT MARCHING COLUMN along a route: n dots `abreast` wide, ranks `gap` world px
 *  apart, the head at arclength sHead; the files keep their direction from a long chord
 *  so the body wheels through a bend; a dot behind s = 0 is hidden, one within `emerge`
 *  world px of s = 0 fades in (the column streams out of its start). Index-stable. */
export const columnAt = (route: Route, sHead: number, n: number, abreast: number, gap: number, emerge = 8, jitter = 0.12): Dot[] =>
  Array.from({ length: n }, (_, j) => {
    const rank = Math.floor(j / abreast);
    const file = (j % abreast) - (abreast - 1) / 2;
    const s = sHead - rank * gap + (hash(j, 11) - 0.5) * gap * jitter;
    const [x, y] = route.pointAt(Math.max(0, s));
    const a = route.pointAt(Math.max(0, s) - gap * 5);
    const b = route.pointAt(Math.max(0, s) + gap * 5);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [tx, ty] = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    const lat = file * gap + (hash(j, 12) - 0.5) * gap * jitter;
    return { x: x - ty * lat, y: y + tx * lat, t: 1, op: s <= 0 ? 0 : clamp01(s / emerge) };
  });
/** a very slight hashed drift (world px) so a crowd at rest never freezes; amp in screen px */
export const menDrift = (i: number, s: number, k: number, amp = 0.9): P2 => {
  const a = amp / k;
  const w1 = 0.03 + 0.025 * hash(i, 21);
  const w2 = 0.027 + 0.025 * hash(i, 22);
  return [a * Math.sin(s * w1 + 6.283 * hash(i, 23)), a * Math.sin(s * w2 + 6.283 * hash(i, 24))];
};

// ---------------------------------------------------------------------------
// ACTS AND HAND-OFFS (see sugarScene.tsx)
// ---------------------------------------------------------------------------
/** what every act's layers receive: the story frame s, the global frame g, the camera,
 *  and uid: a suffix the act MUST append to every svg id it creates (Fill ids, clipPath,
 *  mask, pattern ids) - the scene draws several sub-frame copies of every layer on a
 *  motion-blurred frame, and ids must not collide between them. (CHANGED 2026-10-05) */
export type ActProps = { s: number; g: number; cam: Cam; uid?: string };
/** an ACT module (sugarAB / sugarCD / sugarE): its FULL camera track (the previous
 *  act's track extended with extendCamTrack) and its layers. Under = fills / hatches
 *  (inside the world svg, under every act's lines); Over = lines, arrows, dots, glyphs
 *  (inside the world svg); Labels = screen-space type. Each act draws its own
 *  elements at EVERY s (they persist) unless it has handed one off (HANDOFF). */
export type Act = {
  name: string;
  cam: CamTrack;
  Under?: React.FC<ActProps>;
  Over?: React.FC<ActProps>;
  Labels?: React.FC<ActProps>;
};
/** THE HAND-OFF TABLE (story frames). From HANDOFF.x on, the earlier act stops drawing
 *  element x and the later act draws it, starting from the earlier act's exported
 *  state (sugarAB's AB_END). Infinity = never handed off. Ask W to add a row. */
export const HANDOFF = {
  /** Great Britain's cream wash + hatch (AB) -> CD at C's first frame (C brightens it on "Britain") */
  gbWash: CUT_S.C.s0,
  /** the British army enclave at New York (AB) -> E at E's first frame (E lifts it off) */
  enclave: CUT_S.E.s0,
  /** Britain's faint cream wash over the 13 colonies (AB) -> E at E's first frame (E withdraws it) */
  colonyWash: CUT_S.E.s0,
  /** the orange militia (AB) -> E at E's first frame (CHANGED 2026-10-05): E draws them
   *  from s1186 on, from sugarAB's militiaAt(s, k) (the exact positions; AB_END.militia) */
  militia: CUT_S.E.s0,
  /** the colonies' orange (wash, dashed edge, orange coast) (AB) -> E at E's first frame
   *  (CHANGED 2026-10-05: AB recedes it to TOUR_RUNG during D's tour; E restores it) */
  colonies: CUT_S.E.s0,
};
