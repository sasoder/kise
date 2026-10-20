// ---------------------------------------------------------------------------
// NotCitiesVillagesV2 (kyle-first-farmers, cut 76; cold-review V2 of NotCitiesVillages). Dwarkesh map style (styles/dwarkesh-map.md), the umber page
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
import { CHILD_F, CREAM, Farmer, Forager, Goat, HideTent, Longhouse, POSES, Sheaf, TurnForager, WheatField, aimTool, aimToolWorld, farmAnchors, hoeLoop, idle, lerpFig, mirrorPose, shadeInk, turnPose, walkPose, type FigPose } from "./farmersFigures";

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
  { f: 0, x: 60, y: 0, k: 0.93 },
  { f: 30, x: 20, y: 0, k: 0.95 },
  { f: 70, x: -60, y: 0, k: 0.985 },
  { f: 100, x: -120, y: 0, k: 0.97 },
  { f: 125, x: -170, y: 0, k: 0.78 },
  { f: 145, x: -220, y: 0, k: 0.6 },
  { f: 165, x: -320, y: 0, k: 0.46 },
  { f: 185, x: -365, y: 0, k: 0.39 },
  { f: 200, x: -370, y: 0, k: 0.38 },
  { f: 224, x: -365, y: 0, k: 0.382 },
  { f: 255, x: 508, y: 0, k: 0.443 },
  { f: 307, x: 518, y: 0, k: 0.445 },
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
const XR = 1000;
const XL = -1650;
const WALL_TOP = -1150;
/** the city stands centred behind the village; it rises from behind the roofline, bottom-up, centre first */
const XC = -300;
const RECTS: Rect[] = [];
const WINDOWS: Rect[] = [];
// ONE long wall with merlons, two corner towers and two lower towers along it
RECTS.push({ x0: XL, x1: XR, top: WALL_TOP, bot: 0, d: 0 });
const TOWERS: [number, number, number][] = [
  [770, 1000, -1560],
  [360, 540, -1420],
  [-1140, -960, -1420],
  [-1650, -1420, -1560],
];
TOWERS.forEach(([a, b, top]) => {
  RECTS.push({ x0: a, x1: b, top, bot: 0, d: -1 });
  const w = 62;
  [a, (a + b) / 2 - w / 2, b - w].forEach((m) => RECTS.push({ x0: m, x1: m + w, top: top - 80, bot: top, d: -1.01 }));
});
const stretches = TOWERS.map(([a, b]) => [a, b] as [number, number])
  .sort((p, q) => p[0] - q[0])
  .map((t, i, arr) => (i < arr.length - 1 ? [t[1], arr[i + 1][0]] : null))
  .filter((v): v is [number, number] => v !== null);
stretches.forEach(([a, b]) => {
  const n = Math.max(1, Math.round((b - a - 40) / 170));
  const step = (b - a) / n;
  for (let i = 0; i < n; i++) {
    const m = a + step * (i + 0.5) - 48;
    RECTS.push({ x0: m, x1: m + 96, top: WALL_TOP - 90, bot: WALL_TOP, d: -0.01 });
  }
});
// the stepped tower that towers over everything: four plain stages and a door at the top
RECTS.push({ x0: XC - 480, x1: XC + 480, top: -1720, bot: 0, d: 4 });
RECTS.push({ x0: XC - 345, x1: XC + 345, top: -2080, bot: 0, d: 4.1 });
RECTS.push({ x0: XC - 220, x1: XC + 220, top: -2380, bot: 0, d: 4.2 });
RECTS.push({ x0: XC - 110, x1: XC + 110, top: -2580, bot: -2380, d: 4.3 });
WINDOWS.push({ x0: XC - 36, x1: XC + 36, top: -2530, bot: -2380, d: 4.29, edges: true });

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
// THE RISE: the city is drawn as one silhouette growing bottom-up from behind the village's roofline, centre
// first: a point is drawn when a rising front reaches it (higher = later, further from the centre = a little
// later), so every upright draws upward and every roof line draws outward from the middle.
export const DRAW_F0 = 166;
export const DRAW_F1 = 194;
const RISE_FROM = 650; // world px above the ground (about the roofline): the front starts here
const RISE_H = 2580 - RISE_FROM;
const revealT = (p: P2) => DRAW_F0 + 21 * c01((-p[1] - RISE_FROM) / RISE_H) + 7 * Math.min(1, Math.abs(p[0] - XC) / ((XR - XL) / 2));
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
const STROKES: Stroke[] = SEGS.map((g) => mkStroke([g.a, g.b]));
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
const DASH = "60 36";
/** the city's tone: drawn in play (INK_HI); after "these are villages" it clears completely (f201-f213, eased) */
/** ... and on "these are villages" it un-draws: the reverse of the rise, every line retracting back down into the
 *  roofline (top first) over f197-f209, so "villages" (f201) lands on the real houses */
export const CITY_UNDRAW_F0 = 197;
export const CITY_UNDRAW_F1 = 209;
const cityTone = () => INK_HI;
/** the rise's clock as it runs backwards during the un-draw */
const cityClock = (f: number) => (f < CITY_UNDRAW_F0 ? f : DRAW_F1 - (DRAW_F1 - DRAW_F0 + 1) * smoothstep((f - CITY_UNDRAW_F0) / (CITY_UNDRAW_F1 - CITY_UNDRAW_F0)));

const GhostCity: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  if (frame < DRAW_F0) return null;
  if (frame >= CITY_UNDRAW_F1) return null;
  const tone = cityTone();
  const t = cityClock(frame);
  const w = 4.4 / k; // screen-constant weight (heavy enough to read at phone size); the dashes stay in world space (no crawl)
  const ink = mixColor(LAND, INK, tone);
  const done = t >= CITY_DONE;
  const paths: { d: string; off: number }[] = [];
  STROKES.forEach((st) => {
    if (done || st.tMax <= t) paths.push({ d: st.d, off: 0 });
    else revealed(st, t).forEach(([a, b]) => paths.push({ d: subPath(st, a, b), off: -a }));
  });
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
    </g>
  );
};
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
  { at: [-1000, -120], scale: 0.65, len: 900, uid: "lhB", seed: 2 },
  { at: [600, -120], scale: 0.65, len: 700, uid: "lhC", seed: 4 },
];
const HOUSE_A = { at: [-150, -50] as P2, scale: 0.8, len: 900, uid: "lhA", seed: 0 };
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
  /** default "farmer"; the camp's two late arrivals are foragers */
  kind?: "farmer" | "forager";
  hold2?: "spear" | "none";
  seed: number;
};
const STRIDE = 54;
const CYCLE = 26;
const DEC = 14;
const PEOPLE: Person[] = [
  // the west house: a pair talking (one arrives to meet the other), a child with the goat, a man with his hoe
  { id: "P1", x: -1090, dir: -1, base: POSES.stand(-1), woman: true, hold: "none", seed: 31 },
  { id: "P2", x: -1185, dir: 1, base: POSES.stand(1), woman: true, hold: "none", stop: 150, freeArms: true, seed: 32 },
  { id: "C1", x: -930, dir: 1, base: POSES.stand(1), child: true, hold: "none", stop: 160, freeArms: true, seed: 33 },
  { id: "L1", x: -760, dir: 1, base: POSES.hoeShoulder(1), hold: "hoe", stop: 172, seed: 34 },
  // the near house: the family that settles at its door on "sedentary", a woman who sets her sheaf down by the
  // door on "starting", two men talking
  { id: "famM", x: DOOR_X - 95, dir: 1, base: POSES.hoeShoulder(1), hold: "hoe", stop: 92, seed: 3 },
  { id: "famC", x: DOOR_X - 185, dir: 1, base: POSES.stand(1), child: true, hold: "none", stop: 90, freeArms: true, seed: 4 },
  { id: "famW", x: DOOR_X - 280, dir: 1, base: POSES.stand(1), woman: true, hold: "none", stop: 88, freeArms: true, seed: 5 },
  { id: "wA", x: -110, dir: -1, base: POSES.stand(-1), woman: true, hold: "none", seed: 2 },
  { id: "T1", x: 20, dir: 1, base: POSES.stand(1), hold: "none", seed: 35 },
  { id: "T2", x: 170, dir: -1, base: POSES.sheaf(-1), hold: "none", holdFar: "sheaf", seed: 36 },
  // the east house: the hoer in its garden; a family walking in from the right ("aggregations")
  { id: "hoer", x: 470, y: -30, dir: 1, base: POSES.hoe(1, 0), hold: "hoe", seed: 1 },
  { id: "R1", x: 690, dir: -1, base: POSES.hoeShoulder(-1), hold: "hoe", stop: 150, seed: 11 },
  { id: "R2", x: 775, dir: -1, base: POSES.stand(-1), child: true, hold: "none", stop: 152, freeArms: true, seed: 13 },
  { id: "R3", x: 865, dir: -1, base: POSES.stand(-1), woman: true, hold: "none", stop: 158, freeArms: true, seed: 12 },
];
/** "more": villagers come out from behind the near longhouse's east end (they wait unseen behind it, x <= NEW_HIDE)
 *  into the yard between the houses, the last settling on "more" (stops f252-f262) */
const NEW_HIDE = 100;
const NEWCOMERS: Person[] = [
  { id: "N1", x: 390, y: -70, dir: 1, base: POSES.sheaf(1), hold: "none", holdFar: "sheaf", stop: 262, seed: 41 },
  { id: "N2", x: 300, y: -70, dir: 1, base: POSES.stand(1), woman: true, hold: "none", stop: 257, freeArms: true, seed: 42 },
  { id: "N3", x: 215, y: -70, dir: 1, base: POSES.stand(1), child: true, hold: "none", stop: 252, freeArms: true, seed: 43 },
];
/** the camp's own arrival: two foragers walk in from the right to the fire, the last settling on "hunter-gatherer" */
const CAMP_WALKERS: Person[] = [
  { id: "cw1", kind: "forager", x: 1452, dir: -1, base: POSES.stand(-1), hold2: "none", stop: 282, freeArms: true, seed: 26 },
  { id: "cw2", kind: "forager", x: 1500, dir: -1, base: POSES.stand(-1), woman: true, hold2: "none", stop: 288, freeArms: true, seed: 27 },
];
/** the hoer's timing: the shared hoeLoop's strike (loop phase 0.75-0.87) lasts under 5 frames of a 40-frame stroke
 *  and ends in one big jump of the blade. Re-time the loop (same 40-frame period, phase 0 = the blade in the ground):
 *  pull back 11 f, raise 16 f, strike 9 f, dig in 4 f. Inside the strike the loop's own u = s^2 acceleration is
 *  re-timed to u = s^1.5 (s = time through the strike), so the blade sweeps one even arc that quickens smoothly from
 *  the top: its tip moves at most ~100 units a frame (the raw loop: 216 in one frame). */
const hoeWarp = (p: number) => {
  const k = Math.floor(p);
  const t = p - k;
  let ph: number;
  if (t < 0.275) ph = (t / 0.275) * 0.3;
  else if (t < 0.675) ph = 0.3 + ((t - 0.275) / 0.4) * 0.45;
  else if (t < 0.9) ph = 0.75 + 0.12 * Math.pow((t - 0.675) / 0.225, 0.75);
  else ph = 0.87 + ((t - 0.9) / 0.1) * 0.13;
  return k + ph;
};
/** amount of walk on frame f for a walker resting from `stop` */
const walkAmt = (p: Person, f: number) => (p.stop === undefined ? 0 : smoothstep(c01((p.stop - f) / DEC)));
type Track = { x: number[]; ph: number[] };
const TRACKS = new Map<string, Track>();
[...PEOPLE, ...NEWCOMERS, ...CAMP_WALKERS].forEach((p) => {
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
// "starting" (f72): the woman at the near door stoops and sets her sheaf down on its butt by the door (contact f72),
// lets go (f74) and straightens empty-handed (f88). She faces left (the door); built facing right, then mirrored.
const SD_CARRY: FigPose = { ...POSES.stand(1), armR: { w: [40, -168], elbow: [-0.5, 1], fist: 1, hand: 0 } };
const SD_STOOP: FigPose = { ...POSES.stand(1), lean: 30, crouch: 32, pitch: 12, armR: { w: [74, -52], elbow: [-0.4, 1], fist: 1, hand: 0 } };
const SD_FREE: FigPose = POSES.stand(1);
export const SD_CONTACT = 72;
const setDownPose = (f: number): FigPose => {
  const down = smoothstep((f - 58) / (SD_CONTACT - 58));
  const up = smoothstep((f - (SD_CONTACT + 2)) / 14);
  const q = f <= SD_CONTACT + 2 ? lerpFig(SD_CARRY, SD_STOOP, down) : lerpFig(SD_STOOP, SD_FREE, up);
  return mirrorPose(q);
};
const SD_AT: P2 = [-110, 0];
/** the sheaf: in her far hand (its butt sliding down to the ground as she stoops), standing by the door from f72 */
const sheafAt = (f: number): { at: P2; angle: number } => {
  const fc = Math.min(f, SD_CONTACT);
  const hand = farmAnchors("farmer", setDownPose(fc), SD_AT, S, true).farHand;
  const c = smoothstep((fc - 58) / (SD_CONTACT - 58));
  // the sheaf's grip sits ~44 units above its butt (as farmersFigures' sheet stands it): butt on the ground at c = 1
  return { at: [hand[0], mix(hand[1] + 40, -44 * S, c)], angle: -14 * (1 - c) };
};
const SetDownSheaf: React.FC<{ frame: number }> = ({ frame }) => {
  const { at, angle } = sheafAt(frame);
  return <Sheaf at={at} scale={S} angle={angle} dir={-1} uid="sdsheaf" />;
};
const personAt = (p: Person, f: number): { at: P2; pose: FigPose } => {
  const y = p.y ?? 0;
  if (p.id === "hoer") return { at: [p.x, y], pose: hoeLoop(1, hoeWarp((f + 8) / 40)) };
  if (p.id === "wA") return { at: [p.x, y], pose: idle(setDownPose(f), f, p.seed, 0.6) };
  const tr = TRACKS.get(p.id);
  if (!tr) return { at: [p.x, y], pose: idle(p.base, f, p.seed) };
  const fi = Math.max(0, Math.min(DURATION, Math.round(f)));
  const a = walkAmt(p, fi);
  const w = walkPose(p.base, tr.ph[fi], a, STRIDE);
  const pose = p.freeArms ? w : { ...w, armL: p.base.armL, armR: p.base.armR };
  const x = NEWCOMERS.includes(p) ? Math.max(NEW_HIDE, tr.x[fi]) : tr.x[fi];
  return { at: [x, y], pose: idle(pose, f, p.seed, 1 - a) };
};
/** for the checks: where everybody stands */
export const peopleAt = (f: number) => [...PEOPLE, ...NEWCOMERS].map((p) => ({ id: p.id, ...personAt(p, f) }));

/** "sedentary": smoke starts to rise from the west smoke hole of the near longhouse (f90 on) and keeps curling */
const SMOKE_AT: P2 = [HOUSE_A.at[0] - (HOUSE_A.len / 2 - 150) * HOUSE_A.scale, HOUSE_A.at[1] - 960 * HOUSE_A.scale];
const RoofSmoke: React.FC<{ frame: number }> = ({ frame }) => {
  const grow = smoothstep((frame - 86) / 34);
  if (grow <= 0) return null;
  const strand = (seed: number, len: number, off: number) => {
    const n = 22;
    const pts: P2[] = Array.from({ length: n + 1 }, (_, i) => {
      const u = (i / n) * grow;
      return [SMOKE_AT[0] + off + 70 * u + 34 * u * Math.sin(u * 6.5 - frame / 13 + seed), SMOKE_AT[1] - u * len];
    });
    return `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L")}`;
  };
  return (
    <g fill="none" strokeLinecap="round" stroke={INK}>
      <path d={strand(0, 560, 0)} strokeOpacity={0.55} strokeWidth={11} />
      <path d={strand(2.1, 430, 16)} strokeOpacity={0.38} strokeWidth={7} />
    </g>
  );
};
/** the village's animals at the dim context tone (full cream belongs to the foragers) */
const VILLAGE_ANIMAL = shadeInk(CREAM, 0.55);
const Village: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {HOUSES.map((h) => (
      <House key={h.uid} {...h} />
    ))}
    <Fence x0={515} x1={690} y={-60} h={110} seed={3} />
    <WheatField x0={530} x1={680} y={-40} scale={0.7} rows={3} depth={24} spacing={15} g={frame} wind={0.6} seed={2} />
    {NEWCOMERS.map((p) => {
      const { at, pose } = personAt(p, frame);
      return <Farmer key={p.id} uid={p.id} pose={pose} at={at} scale={S} woman={p.woman} child={p.child} hold={p.hold} holdFar={p.holdFar} seed={p.seed} />;
    })}
    <House {...HOUSE_A} />
    <RoofSmoke frame={frame} />
    <Goat at={[-830, -36]} scale={1.15} dir={-1} g={frame} graze={1} uid="goat1" seed={2} ink={VILLAGE_ANIMAL} />
    {PEOPLE.map((p) => {
      const { at, pose } = personAt(p, frame);
      return <Farmer key={p.id} uid={p.id} pose={pose} at={at} scale={S} woman={p.woman} child={p.child} hold={p.hold} holdFar={p.holdFar} seed={p.seed} />;
    })}
    <SetDownSheaf frame={frame} />
  </g>
);

// ---------------------------------------------------------------------------
// THE FORAGER CAMP: a tight knot of cream foragers at one fire, a single hut behind
// ---------------------------------------------------------------------------
/** the camp stands on the same ground at the same figure scale as the village (a two-shot) */
const CAMP_Y = -20;
const S_CAMP = S;
const FIRE: P2 = [1352, CAMP_Y - 6];
const Fire: React.FC<{ frame: number }> = ({ frame }) => {
  const [fx, fy] = FIRE;
  const sc = 1.0;
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
const FORAGERS: { x: number; y?: number; dir: 1 | -1; woman?: boolean; child?: boolean; spear?: boolean; seed: number }[] = [
  { x: 1242, dir: 1, child: true, seed: 23 },
  { x: 1140, dir: 1, spear: true, seed: 21 },
  { x: 1203, dir: 1, woman: true, seed: 22 },
];
/** "hunter-gatherer" (f288): the hunter shoulders his spear and half-turns away from the fire, as if to move on
 *  (turnPose f284-f302; the spear stays in his left fist, tilting from upright back over his shoulder) */
const MOVE_F0 = 284;
const MOVE_F1 = 302;
const MOVE_TO: FigPose = { ...POSES.stand(1), yaw: -0.4, headYaw: -0.6, armL: { w: [14, -236], elbow: [-0.3, 1], fist: 1, hand: 0 } };
const hunterPose = (f: number): FigPose => {
  if (f < MOVE_F0 - 6) return spearPose(1, f);
  const from = spearPose(1, MOVE_F0 - 6);
  const q = turnPose(from, MOVE_TO, f, MOVE_F0, MOVE_F1);
  const e = smoothstep((f - MOVE_F0) / (MOVE_F1 - MOVE_F0));
  return aimToolWorld(q, 2 + 33 * e, "L", "forager");
};
/** the hunter shifts his spear now and then (a slow sway of its angle) */
const spearPose = (dir: 1 | -1, f: number) => {
  const q = aimTool(POSES.stand(1), 2 + 3.5 * Math.sin(f / 23) * Math.max(0, Math.sin(f / 61)), "near", "forager");
  return dir === 1 ? q : mirrorPose(q);
};
const Camp: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    <HideTent at={[1370, CAMP_Y - 75]} scale={0.85} uid="tent1" seed={1} open={0.6} />
    {FORAGERS.filter((p) => p.child).map((p, i) => (
      <Forager key={i} uid={`fgc${i}`} pose={idle(POSES.stand(p.dir), frame, p.seed)} at={[p.x, p.y ?? CAMP_Y]} scale={S_CAMP} child seed={p.seed} />
    ))}
    <Fire frame={frame} />
    {FORAGERS.filter((p) => !p.child && !p.spear).map((p, i) => (
      <Forager
        key={i}
        uid={`fg${i}`}
        pose={idle(p.spear ? spearPose(p.dir, frame) : POSES.stand(p.dir), frame, p.seed)}
        at={[p.x, p.y ?? CAMP_Y]}
        scale={S_CAMP}
        woman={p.woman}
        hold={p.spear ? "spear" : "none"}
        seed={p.seed}
      />
    ))}
    {FORAGERS.filter((p) => p.spear).map((p) => (
      <TurnForager key="hunter" uid="fghunter" pose={idle(hunterPose(frame), frame, p.seed)} at={[p.x, p.y ?? CAMP_Y]} scale={S_CAMP} hold="spear" holdSide="L" seed={p.seed} />
    ))}
    {CAMP_WALKERS.map((p) => {
      const { at, pose } = personAt(p, frame);
      return <Forager key={p.id} uid={p.id} pose={pose} at={[at[0], CAMP_Y]} scale={S} woman={p.woman} hold={p.hold2} seed={p.seed} />;
    })}
  </g>
);

// ---------------------------------------------------------------------------
const NotCitiesVillagesV2: React.FC<z.infer<typeof schema>> = () => {
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

export default NotCitiesVillagesV2;
