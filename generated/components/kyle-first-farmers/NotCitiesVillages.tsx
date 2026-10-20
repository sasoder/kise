// ---------------------------------------------------------------------------
// NotCitiesVillages (kyle-first-farmers, cut 76). Dwarkesh map style (styles/dwarkesh-map.md), the umber page
// with no map, on the clip's own kit (firstFarmersShared: page, camera, ground) and cast (farmersFigures).
// Opaque 1080x1920, 29.97 fps, 308 frames.
//
// CHECK LINE: "the first farmers lived in villages: nowhere near a city, but already far bigger and denser than a
// forager camp."
//
// THE LINE: "early farmers, the first farming societies that are starting to live sedentary lifestyles where you
// have aggregations, these are not cities, these are villages. But still, that's more than like a hunter-gatherer"
// WORD -> FRAME: early 1 · farmers 12 · the 28 · first 31 · farming 35 · societies 42 · that 54 · are 68 ·
//   starting 72 · to 84 · live 88 · sedentary 94 · lifestyles 108 · where 127 · you 131 · have 134 ·
//   aggregations 140 · these 163 · are 168 · not 171 · cities 177 · these 191 · are 197 · villages 201 · But 227 ·
//   still 241 · that's 252 · more 260 · than 272 · like 280 · a 285 · hunter-gatherer 288-293 · (and 308).
// DURATION: the slot 76.7100 -> 86.9869 s = 10.277 s x 29.97 = 308 frames (f0..f307).
//
// THE MOTION: one ground line (screen row 1040 throughout: y is derived from the zoom) under one camera path, and a
// ladder in DEPTH. f0: close on an LBK longhouse (a man ~420 px), a farmer hoeing his garden behind a wattle
// hurdle, a woman at the door, a grazing goat; a family walks in from the left edge and comes to rest at the
// doorway on "sedentary" (stops f88-f92). From f100 the camera eases back while more families walk in from both
// sides into a village of three longhouses ("aggregations", f140; last arrival f174). On "these are not cities" the
// pull-back continues and, BEHIND the village, a walled CITY at a far larger scale (towers, crenellated wall, a
// gate, rows of flat roofs climbing to a stepped temple) is drawn in DASHED cream by ONE moving tip: it enters at
// the right edge on the skyline (f167), runs leftward over the temple (f173-f177) and down the west corner tower to
// the ground (f195); every inner line is drawn as the tip passes, and lines behind buildings are clipped. On "these
// are villages" (k ~0.30, the city across the full frame width, its temple top at y ~270) the city drains to a
// faint ghost (cream 0.34, f190-f201) while the village stays bright at its foot: orange people and wheat,
// longhouses in the architecture manner; the camera eases in a touch. On "But still" (f224) a short glide right
// brings a forager camp (two hide huts, five cream foragers round a fire) in from the right edge (f235), settled by
// "more" (f260). Resolved frame (k 0.29): the ghost city fills the width behind; on the ground line the village
// spans x ~25-690 (farmers ~122 px) and, past a clear gap with the city gate behind it, the camp x ~790-1035
// (foragers ~100 px, standing a little further back). Below the ground only the quiet ground hatching. Living to
// the last frame: the hoer hoes, idles, the wheat and the fire move, the smoke curls.
// Orange = the farmers' side (their people and fields); the longhouses are architecture (dark planes, cream line,
// a thin orange ridge: director's ruling); no sickle is carried low (clip ruling); the city, the foragers and their
// camp are cream. No text.
//
// SOURCES: none on screen (no figures, no places). The LBK longhouse and the Mesolithic hut are the shared cast's
// (farmersFigures, sourced there). The ghost city is a generic early walled city (towers, gate, flat roofs, a
// stepped temple, after Uruk-period Mesopotamia), drawn only as "the scale the village is not".
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, DARK, INK, INK_DEEP, INK_HI, LAND, GroundLine, Page, WorldSvg, hash, mixColor, runCamera, smoothstep, type Cam, type CamKey, type P2 } from "./firstFarmersShared";
import { CHILD_F, Farmer, Forager, Goat, HideTent, Longhouse, POSES, WheatField, hoeLoop, idle, walkPose, type FigPose } from "./farmersFigures";

export const FPS = 30000 / 1001;
export const DURATION = 308;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// WORLD: the ground line is y = 0 (up is - y). People stand on it at S (a man ~420 px at k 1).
// ---------------------------------------------------------------------------
const S = 1.355;
/** the screen row the ground sits on, every frame (the pull-back is anchored on the ground) */
const GROUND_SY = 1040;

// ---------------------------------------------------------------------------
// THE CAMERA: x and k are keyed (runCamera: pchip, log k, damped follow); y is derived from k so the ground stays
// on GROUND_SY through the whole pull-back (CRAFT: derive the vertical framing from the zoom).
// ---------------------------------------------------------------------------
const CAM: CamKey[] = [
  { f: 0, x: 0, y: 0, k: 1.0 },
  { f: 45, x: -40, y: 0, k: 0.97 },
  { f: 90, x: -110, y: 0, k: 0.88 },
  { f: 120, x: -170, y: 0, k: 0.68 },
  { f: 145, x: -200, y: 0, k: 0.5 },
  { f: 165, x: -260, y: 0, k: 0.39 },
  { f: 183, x: -390, y: 0, k: 0.318 },
  { f: 200, x: -400, y: 0, k: 0.3 },
  { f: 224, x: -360, y: 0, k: 0.307 },
  { f: 255, x: 490, y: 0, k: 0.2815 },
  { f: 307, x: 560, y: 0, k: 0.28 },
];
export const camAt = (frame: number): Cam => {
  const c = runCamera(CAM, frame);
  return { x: c.x, y: -(GROUND_SY - 960) / c.k, k: c.k };
};

// ---------------------------------------------------------------------------
// THE GHOST CITY: axis-aligned rectangles {x0, x1, top, bot, depth} (depth: smaller = nearer). Every edge is
// clipped against the rectangles in front of it, so the dashed outline shows only what a viewer would see.
// ---------------------------------------------------------------------------
type Rect = { x0: number; x1: number; top: number; bot: number; d: number; edges?: boolean };
const XR = 2400;
const XL = -2000;
const WALL_TOP = -1050;
const TOWER_TOP = -1500;
/** the tip enters the skyline here, just off the right edge of the frame; the city to the right of it is there
 *  already and is only seen when the "But still" glide reaches it (after the drain) */
const XS = 1450;
const RECTS: Rect[] = [];
const WINDOWS: Rect[] = [];
// the wall and its merlons
RECTS.push({ x0: XL, x1: XR, top: WALL_TOP, bot: 0, d: 0 });
const TOWERS: [number, number][] = [
  [2100, 2400],
  [1330, 1480],
  [1020, 1170],
  [450, 750],
  [-450, -150],
  [-1150, -850],
  [-2000, -1700],
];
TOWERS.forEach(([a, b]) => {
  RECTS.push({ x0: a, x1: b, top: TOWER_TOP, bot: 0, d: -1 });
  // three merlons on each tower (two on the narrow gate towers)
  const w = b - a > 200 ? 64 : 50;
  (b - a > 200 ? [a, (a + b) / 2 - w / 2, b - w] : [a, b - w]).forEach((m) => RECTS.push({ x0: m, x1: m + w, top: TOWER_TOP - 72, bot: TOWER_TOP, d: -1.01 }));
  // two arrow slits
  const cx = (a + b) / 2;
  WINDOWS.push({ x0: cx - 15, x1: cx + 15, top: -1340, bot: -1240, d: -1.02, edges: true });
  WINDOWS.push({ x0: cx - 15, x1: cx + 15, top: -820, bot: -720, d: -1.02, edges: true });
});
// the wall's merlons, in each stretch between towers
const stretches = TOWERS.slice()
  .sort((p, q) => p[0] - q[0])
  .map((t, i, arr) => (i < arr.length - 1 ? [t[1], arr[i + 1][0]] : null))
  .filter((v): v is [number, number] => v !== null);
stretches.forEach(([a, b]) => {
  const n = Math.max(1, Math.round((b - a - 40) / 160));
  const step = (b - a) / n;
  for (let i = 0; i < n; i++) {
    const m = a + step * (i + 0.5) - 45;
    RECTS.push({ x0: m, x1: m + 90, top: WALL_TOP - 80, bot: WALL_TOP, d: -0.01 });
  }
});
// rows of flat-roofed houses climbing behind the wall
const roofRow = (d: number, xa: number, xb: number, topA: number, topB: number, seed: number) => {
  let x = xb;
  let i = 0;
  while (x > xa + 90) {
    const w = 190 + 160 * hash(i, seed);
    const gap = 24 + 30 * hash(i, seed + 1);
    const x0 = Math.max(xa, x - w);
    const top = mix(topA, topB, hash(i, seed + 2));
    RECTS.push({ x0, x1: x, top, bot: 0, d: d + 0.001 * hash(i, seed + 3) });
    // a window or two under the roof line
    const nWin = x - x0 > 280 ? 2 : 1;
    for (let j = 0; j < nWin; j++) {
      const cx = x0 + ((x - x0) * (j + 1)) / (nWin + 1);
      WINDOWS.push({ x0: cx - 22, x1: cx + 22, top: top + 36, bot: top + 92, d: d - 0.0005, edges: true });
    }
    x = x0 - gap;
    i++;
  }
};
roofRow(1, XL + 250, XR - 250, -1150, -1360, 11);
roofRow(2, XL + 600, XR - 600, -1430, -1660, 23);
roofRow(3, XL + 1100, XR - 1000, -1700, -1900, 37);
// the stepped temple on top: three plain stages, each lower and narrower than the one below, and its house
RECTS.push({ x0: -560, x1: 1160, top: -2000, bot: 0, d: 4 });
RECTS.push({ x0: -230, x1: 830, top: -2220, bot: 0, d: 4.1 });
RECTS.push({ x0: 60, x1: 540, top: -2400, bot: 0, d: 4.2 });
RECTS.push({ x0: 170, x1: 430, top: -2540, bot: -2400, d: 4.3 });
WINDOWS.push({ x0: 262, x1: 338, top: -2512, bot: -2400, d: 4.29, edges: true });

type Seg = { a: P2; b: P2 };
/** subtract intervals [lo, hi] from [a, b] */
const subtract = (ivs: [number, number][], lo: number, hi: number): [number, number][] =>
  ivs.flatMap(([a, b]): [number, number][] => {
    if (hi <= a || lo >= b) return [[a, b]];
    const out: [number, number][] = [];
    if (lo > a) out.push([a, lo]);
    if (hi < b) out.push([hi, b]);
    return out;
  });
const occluders = (d: number) => RECTS.filter((r) => r.d < d);
const clipH = (y: number, x0: number, x1: number, d: number): Seg[] => {
  let ivs: [number, number][] = [[Math.min(x0, x1), Math.max(x0, x1)]];
  occluders(d).forEach((r) => {
    if (r.top < y && y <= r.bot) ivs = subtract(ivs, r.x0, r.x1);
  });
  // right to left: the way the tip runs
  return ivs.filter(([a, b]) => b - a > 4).map(([a, b]) => ({ a: [b, y], b: [a, y] }));
};
const clipV = (x: number, y0: number, y1: number, d: number): Seg[] => {
  let ivs: [number, number][] = [[Math.min(y0, y1), Math.max(y0, y1)]];
  occluders(d).forEach((r) => {
    if (r.x0 < x && x < r.x1) ivs = subtract(ivs, r.top, r.bot);
  });
  // top to bottom
  return ivs.filter(([a, b]) => b - a > 4).map(([a, b]) => ({ a: [x, a], b: [x, b] }));
};
const SEGS: Seg[] = [];
RECTS.forEach((r) => {
  SEGS.push(...clipH(r.top, r.x0, r.x1, r.d));
  if (r.bot - r.top > 4) {
    SEGS.push(...clipV(r.x0, r.top, r.bot, r.d));
    SEGS.push(...clipV(r.x1, r.top, r.bot, r.d));
  }
});
WINDOWS.forEach((r) => {
  SEGS.push(...clipH(r.top, r.x0, r.x1, r.d));
  SEGS.push(...clipV(r.x1, r.top, r.bot, r.d));
  SEGS.push(...clipV(r.x0, r.top, r.bot, r.d));
  if (r.bot < WALL_TOP || r.d < 0) SEGS.push(...clipH(r.bot, r.x0, r.x1, r.d));
});
// the arched gate between the two gate towers (the nearest thing on the wall face: nothing occludes it)
const GATE_CX = 1250;
const GATE_R = 82;
const GATE_SPRING = -420;
const gatePts: P2[] = [[GATE_CX + GATE_R, 0]];
for (let i = 0; i <= 16; i++) {
  const a = (Math.PI * i) / 16;
  gatePts.push([GATE_CX + GATE_R * Math.cos(a), GATE_SPRING - GATE_R * Math.sin(a)]);
}
gatePts.push([GATE_CX - GATE_R, 0]);

// the skyline (upper envelope of every rectangle), from the right foot up, leftward, down to the left foot
const breaks = Array.from(new Set(RECTS.flatMap((r) => [r.x0, r.x1]))).sort((p, q) => q - p);
const envTop = (x: number) => RECTS.reduce((m, r) => (r.x0 <= x && x <= r.x1 ? Math.min(m, r.top) : m), 0);
const ENV: P2[] = [[XR, 0]];
for (let i = 0; i < breaks.length - 1; i++) {
  const xa = breaks[i];
  const xb = breaks[i + 1];
  const y = envTop((xa + xb) / 2);
  ENV.push([xa, y], [xb, y]);
}
ENV.push([XL, 0]);
const ENV_S: number[] = [0];
for (let i = 1; i < ENV.length; i++) ENV_S.push(ENV_S[i - 1] + Math.hypot(ENV[i][0] - ENV[i - 1][0], ENV[i][1] - ENV[i - 1][1]));
const ENV_L = ENV_S[ENV_S.length - 1];
const envAt = (s: number): P2 => {
  const u = Math.max(0, Math.min(ENV_L, s));
  let i = 1;
  while (i < ENV_S.length - 1 && ENV_S[i] < u) i++;
  const t = (u - ENV_S[i - 1]) / Math.max(1e-6, ENV_S[i] - ENV_S[i - 1]);
  return [mix(ENV[i - 1][0], ENV[i][0], t), mix(ENV[i - 1][1], ENV[i][1], t)];
};
/** arc length at which the tip first reaches x (it runs right to left) */
const envFirst = (x: number) => {
  for (let i = 1; i < ENV.length; i++) {
    const [ax] = ENV[i - 1];
    const [bx] = ENV[i];
    if (bx <= x && ax >= x) return ax === bx ? ENV_S[i - 1] : ENV_S[i - 1] + ((ax - x) / (ax - bx)) * (ENV_S[i] - ENV_S[i - 1]);
  }
  return x > XR ? 0 : ENV_L;
};
/** arc length of p if it lies on the skyline, else -1 */
const envOn = (p: P2) => {
  for (let i = 1; i < ENV.length; i++) {
    const a = ENV[i - 1];
    const b = ENV[i];
    const minX = Math.min(a[0], b[0]) - 0.5;
    const maxX = Math.max(a[0], b[0]) + 0.5;
    const minY = Math.min(a[1], b[1]) - 0.5;
    const maxY = Math.max(a[1], b[1]) + 0.5;
    if (p[0] < minX || p[0] > maxX || p[1] < minY || p[1] > maxY) continue;
    const L = ENV_S[i] - ENV_S[i - 1];
    if (L < 1e-6) continue;
    const t = Math.hypot(p[0] - a[0], p[1] - a[1]) / L;
    return ENV_S[i - 1] + t * L;
  }
  return -1;
};

// THE TIP: it runs the skyline from XS (entering at the right edge) to the west tower f162 -> f195, quick in the
// middle, easing at both ends
export const DRAW_F0 = 162;
export const DRAW_F1 = 195;
const tipEase = (u: number) => 0.35 * u + 0.65 * smoothstep(u);
const TIP_S0 = (() => {
  // arc length where the skyline first reaches XS
  let s0 = 0;
  for (let i = 1; i < ENV.length; i++) {
    if (ENV[i][0] <= XS && ENV[i - 1][0] >= XS) {
      const [ax] = ENV[i - 1];
      const [bx] = ENV[i];
      s0 = ax === bx ? ENV_S[i - 1] : ENV_S[i - 1] + ((ax - XS) / (ax - bx)) * (ENV_S[i] - ENV_S[i - 1]);
      break;
    }
  }
  return s0;
})();
const tipS = (t: number) => TIP_S0 + (ENV_L - TIP_S0) * tipEase(c01((t - DRAW_F0) / (DRAW_F1 - DRAW_F0)));
/** the (fractional) frame the tip reaches arc length s */
const timeAtS = (s: number) => {
  let lo = DRAW_F0;
  let hi = DRAW_F1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (tipS(m) < s) lo = m;
    else hi = m;
  }
  return hi;
};
const V_DOWN = ((ENV_L - TIP_S0) / (DRAW_F1 - DRAW_F0)) * 0.9; // world px per frame an inner line is drawn down from the skyline
const LAG = 1.5;
const revealT = (p: P2) => {
  if (p[0] > XS + 0.5) return DRAW_F0 - 1;
  const on = envOn(p);
  if (on >= 0 && on <= TIP_S0) return DRAW_F0 - 1;
  if (on >= 0) return timeAtS(on);
  return timeAtS(envFirst(p[0])) + LAG + Math.max(0, p[1] - envTop(p[0])) / V_DOWN;
};
type Stroke = { pts: P2[]; s: number[]; t: number[]; tMax: number; d: string };
const mkStroke = (raw: P2[]): Stroke => {
  const pts: P2[] = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const [ax, ay] = raw[i - 1];
    const [bx, by] = raw[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 30));
    for (let j = 1; j <= n; j++) pts.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
  }
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const t = pts.map(revealT);
  return { pts, s, t, tMax: Math.max(...t), d: `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}` };
};
const STROKES: Stroke[] = [...SEGS.map((g) => mkStroke([g.a, g.b])), mkStroke(gatePts)];
export const CITY_DONE = Math.max(...STROKES.map((s) => s.tMax));
/** the arc-length intervals of a stroke revealed at time t */
const revealed = (st: Stroke, t: number): [number, number][] => {
  const out: [number, number][] = [];
  const push = (a: number, b: number) => {
    if (b - a < 0.01) return;
    const last = out[out.length - 1];
    if (last && a - last[1] < 0.01) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  };
  for (let i = 0; i < st.pts.length - 1; i++) {
    const ta = st.t[i];
    const tb = st.t[i + 1];
    const sa = st.s[i];
    const sb = st.s[i + 1];
    if (ta <= t && tb <= t) push(sa, sb);
    else if (ta <= t) push(sa, sa + (sb - sa) * c01((t - ta) / Math.max(1e-6, tb - ta)));
    else if (tb <= t) push(sb - (sb - sa) * c01((t - tb) / Math.max(1e-6, ta - tb)), sb);
  }
  return out;
};
const ptAt = (st: Stroke, s: number): P2 => {
  let i = 1;
  while (i < st.s.length - 1 && st.s[i] < s) i++;
  const u = (s - st.s[i - 1]) / Math.max(1e-6, st.s[i] - st.s[i - 1]);
  return [mix(st.pts[i - 1][0], st.pts[i][0], u), mix(st.pts[i - 1][1], st.pts[i][1], u)];
};
const subPath = (st: Stroke, a: number, b: number) => {
  const pts: P2[] = [ptAt(st, a)];
  st.s.forEach((s, i) => {
    if (s > a && s < b) pts.push(st.pts[i]);
  });
  pts.push(ptAt(st, b));
  return `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}`;
};
const DASH = "44 32";
/** the city's tone: drawn in play (INK_HI), drained to a faint ghost on "these are villages" */
export const CITY_DRAIN_F0 = 190;
export const CITY_DRAIN_F1 = 201;
const cityTone = (f: number) => mix(INK_HI, 0.34, smoothstep((f - CITY_DRAIN_F0) / (CITY_DRAIN_F1 - CITY_DRAIN_F0)));

const GhostCity: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  if (frame < DRAW_F0) return null;
  const tone = cityTone(frame);
  const w = 2.9 / k; // screen-constant weight; the dashes stay in world space (no crawl)
  const ink = mixColor(LAND, INK, tone);
  const done = frame >= CITY_DONE;
  const paths: { d: string; off: number }[] = [];
  STROKES.forEach((st) => {
    if (done || st.tMax <= frame) paths.push({ d: st.d, off: 0 });
    else revealed(st, frame).forEach(([a, b]) => paths.push({ d: subPath(st, a, b), off: -a }));
  });
  const tipOn = frame <= DRAW_F1 + 1;
  const tip = envAt(tipS(frame));
  const tipR = (4.6 / k) * (1 - 0.6 * smoothstep((frame - (DRAW_F1 - 4)) / 5));
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="miter">
      <g stroke={DARK} strokeOpacity={0.55 * Math.min(1, tone / 0.6)} strokeWidth={w + 2 / k} strokeDasharray={DASH}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} strokeDashoffset={p.off} />
        ))}
      </g>
      <g stroke={ink} strokeWidth={w} strokeDasharray={DASH}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} strokeDashoffset={p.off} />
        ))}
      </g>
      {tipOn ? (
        <g opacity={tone / INK_HI}>
          <circle cx={tip[0]} cy={tip[1]} r={tipR + 1.6 / k} fill={DARK} fillOpacity={0.7} />
          <circle cx={tip[0]} cy={tip[1]} r={tipR} fill={INK} />
        </g>
      ) : null}
    </g>
  );
};
/** for the checks: where the tip is, in world px */
export const tipWorld = (f: number) => envAt(tipS(f));

// ---------------------------------------------------------------------------
// THE VILLAGE
// ---------------------------------------------------------------------------
/** a longhouse in the architecture manner (cream line), with a thin orange touch on the thatch ridge */
const House: React.FC<{ at: P2; scale: number; len: number; uid: string; seed?: number }> = ({ at, scale, len, uid, seed = 0 }) => {
  const L = len / 2;
  return (
    <g>
      <Longhouse at={at} scale={scale} len={len} tint={0} uid={uid} seed={seed} />
      <path
        transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`}
        d={`M${-L + 165},${-936}L${L - 165},${-936}`}
        stroke={ACCENT}
        strokeWidth={3.6}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
};
const HOUSES: { at: P2; scale: number; len: number; uid: string; seed: number }[] = [
  { at: [-780, -120], scale: 0.65, len: 1000, uid: "lhB", seed: 2 },
  { at: [780, -120], scale: 0.65, len: 1000, uid: "lhC", seed: 4 },
];
const HOUSE_A = { at: [0, -50] as P2, scale: 0.85, len: 1150, uid: "lhA", seed: 0 };
/** the door of house A in world px (Longhouse's door sits at -0.12 L) */
export const DOOR_X = HOUSE_A.at[0] - 0.12 * (HOUSE_A.len / 2) * HOUSE_A.scale;

/** a wattle hurdle: stakes with rods woven in and out, cream line on dark (side elevation) */
const Fence: React.FC<{ x0: number; x1: number; y: number; h: number; seed?: number }> = ({ x0, x1, y, h, seed = 0 }) => {
  const n = Math.max(2, Math.round((x1 - x0) / (h * 0.42)));
  const xs = Array.from({ length: n + 1 }, (_, i) => x0 + ((x1 - x0) * i) / n);
  const rods: string[] = [];
  for (let r = 0; r < 5; r++) {
    const yy = y - h * (0.18 + 0.15 * r);
    let d = `M${xs[0].toFixed(1)},${yy.toFixed(1)}`;
    for (let i = 1; i < xs.length; i++) {
      const sgn = (i + r) % 2 ? 1 : -1;
      d += `Q${((xs[i - 1] + xs[i]) / 2).toFixed(1)},${(yy + sgn * h * 0.045).toFixed(1)} ${xs[i].toFixed(1)},${(yy + 1.2 * (hash(i + r * 9, seed) - 0.5)).toFixed(1)}`;
    }
    rods.push(d);
  }
  const stakes = xs.map((x, i) => `M${x.toFixed(1)},${y.toFixed(1)}L${(x + 2 * (hash(i, seed + 3) - 0.5)).toFixed(1)},${(y - h * (0.93 + 0.12 * hash(i, seed + 4))).toFixed(1)}`).join("");
  const sw = h / 90;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={rods.join("")} stroke={DARK} strokeWidth={sw * 6.4} />
      <path d={stakes} stroke={DARK} strokeWidth={sw * 8.5} />
      <path d={stakes} stroke="#352A1F" strokeWidth={sw * 5} />
      <path d={stakes} stroke={INK_DEEP} strokeWidth={sw * 1.6} strokeOpacity={0.9} />
      <path d={rods.join("")} stroke={INK_DEEP} strokeWidth={sw * 2.6} />
    </g>
  );
};

// the people (no sickle is ever carried low: the clip ruling; sheaves go in the crook of the far arm). A walker keeps walking (from far outside the frame) until his stop frame, slowing over DEC frames.
type Person = {
  id: string;
  x: number;
  y?: number;
  dir: 1 | -1;
  base: FigPose;
  hold?: "hoe" | "none";
  holdFar?: "sheaf" | "none";
  woman?: boolean;
  child?: boolean;
  stop?: number; // walker: frame he comes to rest at x
  freeArms?: boolean;
  seed: number;
};
const STRIDE = 54;
const CYCLE = 26;
const DEC = 14;
const PEOPLE: Person[] = [
  // at home from the first frame
  { id: "hoer", x: 130, y: -30, dir: 1, base: POSES.hoe(1, 0), hold: "hoe", seed: 1 },
  { id: "wA", x: 30, dir: -1, base: POSES.stand(-1), woman: true, hold: "none", seed: 2 },
  // the family that settles by the doorway on "sedentary"
  { id: "famM", x: DOOR_X - 95, dir: 1, base: POSES.hoeShoulder(1), hold: "hoe", stop: 92, seed: 3 },
  { id: "famC", x: DOOR_X - 195, dir: 1, base: POSES.stand(1), child: true, hold: "none", stop: 90, freeArms: true, seed: 4 },
  { id: "famW", x: DOOR_X - 290, dir: 1, base: POSES.stand(1), woman: true, hold: "none", stop: 88, freeArms: true, seed: 5 },
  // "aggregations": families walking in from the left ...
  { id: "L1", x: -520, dir: 1, base: POSES.sheaf(1), hold: "none", holdFar: "sheaf", stop: 168, seed: 6 },
  { id: "L2", x: -635, dir: 1, base: POSES.stand(1), woman: true, hold: "none", stop: 165, freeArms: true, seed: 7 },
  { id: "L3", x: -725, dir: 1, base: POSES.stand(1), child: true, hold: "none", stop: 166, freeArms: true, seed: 8 },
  { id: "L4", x: -840, dir: 1, base: POSES.hoeShoulder(1), hold: "hoe", stop: 170, seed: 9 },
  { id: "L5", x: -965, dir: 1, base: POSES.sheaf(1), woman: true, hold: "none", holdFar: "sheaf", stop: 174, seed: 10 },
  // ... and from the right
  { id: "R1", x: 420, dir: -1, base: POSES.hoeShoulder(-1), hold: "hoe", stop: 150, seed: 11 },
  { id: "R2", x: 535, dir: -1, base: POSES.stand(-1), woman: true, hold: "none", stop: 152, freeArms: true, seed: 12 },
  { id: "R3", x: 625, dir: -1, base: POSES.stand(-1), child: true, hold: "none", stop: 150, freeArms: true, seed: 13 },
  { id: "R4", x: 735, dir: -1, base: POSES.sheaf(-1), hold: "none", holdFar: "sheaf", stop: 156, seed: 14 },
  { id: "R5", x: 850, dir: -1, base: POSES.stand(-1), woman: true, hold: "none", stop: 160, freeArms: true, seed: 15 },
  { id: "R6", x: 965, dir: -1, base: POSES.hoeShoulder(-1), hold: "hoe", stop: 166, seed: 16 },
];
/** amount of walk on frame f for a walker resting from `stop` */
const walkAmt = (p: Person, f: number) => (p.stop === undefined ? 0 : smoothstep(c01((p.stop - f) / DEC)));
type Track = { x: number[]; ph: number[] };
const TRACKS = new Map<string, Track>();
PEOPLE.forEach((p) => {
  if (p.stop === undefined) return;
  const sc = p.child ? S * CHILD_F : S;
  const cyc = p.child ? CYCLE * CHILD_F : CYCLE;
  const v = (2 * STRIDE * sc) / cyc;
  // distance still to walk from frame f to rest
  const rem: number[] = new Array(DURATION + 1).fill(0);
  for (let f = DURATION - 1; f >= 0; f--) rem[f] = rem[f + 1] + v * walkAmt(p, f);
  const x = rem.map((r) => p.x - p.dir * r);
  const ph: number[] = [0];
  for (let f = 1; f <= DURATION; f++) ph.push(ph[f - 1] + walkAmt(p, f - 1) / cyc);
  TRACKS.set(p.id, { x, ph });
});
const personAt = (p: Person, f: number): { at: P2; pose: FigPose } => {
  const y = p.y ?? 0;
  if (p.id === "hoer") return { at: [p.x, y], pose: hoeLoop(1, (f + 8) / 40) };
  const tr = TRACKS.get(p.id);
  if (!tr) return { at: [p.x, y], pose: idle(p.base, f, p.seed) };
  const fi = Math.max(0, Math.min(DURATION, Math.round(f)));
  const a = walkAmt(p, fi);
  const w = walkPose(p.base, tr.ph[fi], a, STRIDE);
  const pose = p.freeArms ? w : { ...w, armL: p.base.armL, armR: p.base.armR };
  return { at: [tr.x[fi], y], pose: idle(pose, f, p.seed, 1 - a) };
};
/** for the checks: where everybody stands */
export const peopleAt = (f: number) => PEOPLE.map((p) => ({ id: p.id, ...personAt(p, f) }));

const Village: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {HOUSES.map((h) => (
      <House key={h.uid} {...h} />
    ))}
    {/* the gardens: a wattle hurdle behind ripe wheat, between the houses; and a plot past the west house */}
    <House {...HOUSE_A} />
    <Fence x0={220} x1={470} y={-44} h={120} seed={3} />
    <WheatField x0={240} x1={455} y={-26} scale={0.7} rows={3} depth={26} spacing={15} g={frame} wind={0.6} seed={2} />
    <Goat at={[-470, -36]} scale={1.15} dir={-1} g={frame} graze={1} uid="goat1" seed={2} />
    {PEOPLE.map((p) => {
      const { at, pose } = personAt(p, frame);
      return <Farmer key={p.id} uid={p.id} pose={pose} at={at} scale={S} woman={p.woman} child={p.child} hold={p.hold} holdFar={p.holdFar} seed={p.seed} />;
    })}
  </g>
);

// ---------------------------------------------------------------------------
// THE FORAGER CAMP: two hide huts and five cream foragers round a fire
// ---------------------------------------------------------------------------
/** the camp stands a little further back on the same ground (its people ~100 px against the farmers' ~122) */
const CAMP_Y = -40;
const S_CAMP = S * 0.82;
const FIRE: P2 = [1890, CAMP_Y - 18];
const Fire: React.FC<{ frame: number }> = ({ frame }) => {
  const [fx, fy] = FIRE;
  const sc = 1.2;
  const tongue = (i: number) => {
    const h = (70 + 26 * Math.sin(frame / 5.3 + i * 2.1) + 14 * Math.sin(frame / 2.9 + i)) * sc * (i === 1 ? 1.35 : 1);
    const x = fx + (i - 1) * 24 * sc;
    const sway = 8 * sc * Math.sin(frame / 7 + i * 1.7);
    const w = (i === 1 ? 26 : 19) * sc;
    return `M${(x - w).toFixed(1)},${fy.toFixed(1)}Q${(x - w * 0.9 + sway * 0.3).toFixed(1)},${(fy - h * 0.55).toFixed(1)} ${(x + sway).toFixed(1)},${(fy - h).toFixed(1)}Q${(x + w * 0.8 + sway * 0.3).toFixed(1)},${(fy - h * 0.5).toFixed(1)} ${(x + w).toFixed(1)},${fy.toFixed(1)}Z`;
  };
  // the smoke: one thin curling line drifting up and to the right
  const smoke: P2[] = Array.from({ length: 16 }, (_, i) => {
    const u = i / 15;
    return [fx + 12 * sc + 60 * u * sc + 26 * sc * u * Math.sin(u * 7 - frame / 11), fy - 120 * sc - u * 420 * sc];
  });
  const logs = `M${fx - 60 * sc},${fy + 4}L${fx + 50 * sc},${fy - 22 * sc}M${fx - 46 * sc},${fy - 20 * sc}L${fx + 62 * sc},${fy + 2}`;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${smoke.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}`} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={6} />
      {[0, 2, 1].map((i) => (
        <path key={i} d={tongue(i)} fill={i === 1 ? INK : INK_DEEP} stroke={DARK} strokeWidth={5} />
      ))}
      <path d={logs} fill="none" stroke={DARK} strokeWidth={22} />
      <path d={logs} fill="none" stroke="#6A5838" strokeWidth={13} />
      {[-78, -44, 44, 78].map((dx, i) => (
        <ellipse key={i} cx={fx + dx * sc} cy={fy + 4} rx={17 * sc} ry={10 * sc} fill="#2A2119" stroke={INK} strokeWidth={3} />
      ))}
    </g>
  );
};
const FORAGERS: { x: number; dir: 1 | -1; woman?: boolean; child?: boolean; spear?: boolean; seed: number }[] = [
  { x: 1560, dir: 1, spear: true, seed: 21 },
  { x: 1680, dir: 1, woman: true, seed: 22 },
  { x: 1985, dir: -1, child: true, seed: 23 },
  { x: 2090, dir: -1, spear: true, seed: 24 },
  { x: 2215, dir: -1, woman: true, seed: 25 },
];
const Camp: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    <HideTent at={[2130, CAMP_Y - 34]} scale={0.84} uid="tent2" seed={3} open={0.4} />
    <HideTent at={[1740, CAMP_Y - 14]} scale={0.95} uid="tent1" seed={1} open={0.6} />
    <Fire frame={frame} />
    {FORAGERS.map((p, i) => (
      <Forager
        key={i}
        uid={`fg${i}`}
        pose={idle(p.spear ? POSES.spear(p.dir) : POSES.stand(p.dir), frame, p.seed)}
        at={[p.x, CAMP_Y]}
        scale={S_CAMP}
        woman={p.woman}
        child={p.child}
        hold={p.spear ? "spear" : "none"}
        seed={p.seed}
      />
    ))}
  </g>
);

// ---------------------------------------------------------------------------
const NotCitiesVillages: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const gw = 2.4 * Math.pow(1 / cam.k, 0.85);
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={cam}>
          <GhostCity frame={frame} k={cam.k} />
          <GroundLine x0={-7000} x1={7500} y={0} weight={gw} depth={70 * Math.pow(1 / cam.k, 0.75)} />
          <Village frame={frame} />
          <Camp frame={frame} />
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

export default NotCitiesVillages;
