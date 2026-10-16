// CHECK LINE: Russia came at Ukraine from three sides expecting Kyiv to fall fast;
// the thrusts on Kyiv stalled short of the city and pulled back, and Ukraine held.
// R2: one lifted geographic camera track clears both caption bands throughout.
// Broad dark-cased northern counterheads contact Brovary f162, Irpin f167,
// Chernihiv f174; first cream reaction is on the same contact frames.
// Reversal completes by f200; camera and shortening tails carry f201-211.
// 24 fps, 212 frames, opaque 1080x1920. V1 and map waypoints are unchanged.
// UkraineNotGivingUpV2: the cold-review pass copy of UkraineNotGivingUp.tsx
// (composition id UkraineNotGivingUpV2, delivered as graphics/30_UkraineNotGivingUp_V2.mov;
// the V1 file and graphic stay untouched).
// ---------------------------------------------------------------------------
// UkraineNotGivingUp: Sarah Paine, "Death ground: why regime change is brutal"
// (Dwarkesh map style). Delivered as 30_UkraineNotGivingUp.mov.
//
// CHECK LINE: Russia came at Ukraine from three sides expecting Kyiv to fall
// fast; the thrusts on Kyiv stalled short of the city and pulled back, and
// Ukraine held.
//
// THE MOTION: one map, one clock. Ukraine (the territory it held on 23 Feb 2022,
// ORANGE hatch) sits inside its internationally recognised border; the Russian
// thrusts of 24 Feb 2022 (CREAM engraved arrows) wait as stubs on the far side of
// the border, brighten and drive in at constant speed from Belarus, Russia and
// Crimea. Kyiv is a cream dot; a thin cream ring (the target) is drawn round it as
// they launch, and bold dashed EXPECTATIONS march ahead of the two Kyiv arrows into
// Kyiv while the camera pushes in (k ~1.9). The two arrows halt short of the ring and
// the dashes erase back into their heads; the camera pulls back to the whole country
// (RUSSIA), the arrows pressing on three sides, and leans slowly north again as short
// broad ORANGE counter-arrows grow out of Kyiv and Chernihiv and push the three
// northern thrusts back out across the border, tip to tip; the orange settles as
// arrowheads on the border, the cream as dim stubs behind it.
//
// "...and you've seen it in your own lives in Ukraine, where they have defied all
// expectations of people who don't get death ground. The Russians have put them
// on death ground and the Ukrainians aren't giving up." Sequence 30.000-38.833 s
// = frames 720-932 at 24 fps -> DURATION 212 (frame 0 = "lives").
//
// BEATS (frames from the composition start; word onsets in the brief)
//   f0       wide, composed (k 1.03, Ukraine ~93 % of the width, lifted so the
//            southern heads stay above the captions): held Ukraine = orange, the
//            Kyiv dot, the six thrusts staged as stubs behind the border
//   f4-18    UKRAINE slides up, landing on "Ukraine" (12)
//   f14-26   the stubs brighten (committed) and launch on "where" (20)
//   f20-34   the target ring is drawn round Kyiv
//   f19-98   the thrusts advance at constant speed, each easing to a stop:
//            Kharkiv ~f62, Chernihiv ~f64, Irpin and Brovary ~f82 (short of the
//            ring), Kherson/Mykolaiv ~f86, Mariupol ~f98
//   f22-50   the bold dashed expectations run out of the two Kyiv heads into Kyiv,
//            ending just past the ring (the dashes march with the arrows); held to
//            ~f80
//   f0-50    one continuous push from the wide to Kyiv (k 1.9, Kyiv at (440, 785)),
//            arriving as the dashes reach Kyiv; creep to k 1.94 under the stall
//   f80-106  the dashes erase back into the heads ("people who don't get death
//            ground"): the gap between the halted heads and the ring is left
//   f102-142 pull back to the whole country (k ~1.06); RUSSIA slides up f124-138,
//            landing on "Russians" (128); all three sides of pressure in frame
//   f142-212 a slow push north (k 1.06 -> 1.31, still moving on the last frame)
//   f158-200 "and the Ukrainians aren't giving up": orange counter-arrows grow out
//            of Kyiv (east edge f158, west edge f160) and Chernihiv (f161), meet the
//            cream heads (Brovary f162, Irpin f167, Chernihiv f174) and push them
//            back along their own paths out across the border (f194-199); the cream
//            dims to stubs; the orange settles as arrowheads on the border (tails
//            draw in over 10 frames, by ~f210); the ring is undrawn (f178-194), the
//            dot stays; Kharkiv and the south stay
//   f164-212 the orange edge firms (2.6 -> 3.2 px); a faint highlight travels the
//            northern border (still moving at the cut)
//   UKRAINE sits on the 49.3 N parallel so it stays above y ~970 at the push; it
//   never enters the caption bands (y 1080-1250, 1360-1460).
//
// SOURCES / FACTS: Natural Earth 10m via world-atlas 2.0.2 (Crimea moved back to
// Ukraine for the international border: world-atlas files it under Russia). The
// 2015-22 line of contact through the director's points (smoothed). Thrust
// waypoints: Wikipedia "Kyiv offensive (2022)", "Northern Ukraine campaign",
// "Eastern Ukraine campaign", "Southern Ukraine campaign" (positions approximate;
// the Sumy thrust is drawn as one axis Sumy - Romny - Pryluky - Brovary, and the
// Chernihiv thrust as its own arrow stopping at Chernihiv, which was besieged and
// never taken).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { HELD_D, HELD_RING, INTL_D, LEVELS, PLACES, RUSSIA_ARC, THRUSTS, UKRAINE_ARC, type P2 } from "./ukraineDgMapData";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

export const FPS = 24;
export const DURATION = 212;

const FRAME_W = 1080;
const FRAME_H = 1920;
const SCREEN_CX = 540;
const SCREEN_CY = 960;

export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DARK = "#0B0907";
const TEX = "deathground/ukraine";

export const schema = z.object({
  vignette: z.number(),
  labels: z.object({ ukraine: z.string(), russia: z.string() }),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  labels: { ukraine: "UKRAINE", russia: "RUSSIA" },
});

// ---------------------------------------------------------------------------
// Maths (iraqShared's)
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixColor = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};
const dOf = (pts: P2[], close = false) =>
  pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}${close ? "Z" : ""}` : "";
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

// ---------------------------------------------------------------------------
// Camera: the keyed track (iraqShared's makeCamTrack), damped in ln k
// ---------------------------------------------------------------------------
type Cam = { k: number; cx: number; cy: number };
const camFor = (p: P2, k: number, sx = SCREEN_CX, sy = 835): Cam => ({
  k,
  cx: p[0] - (sx - SCREEN_CX) / k,
  cy: p[1] - (sy - SCREEN_CY) / k,
});
const screenOf = ([x, y]: P2, cam: Cam): P2 => [SCREEN_CX + (x - cam.cx) * cam.k, SCREEN_CY + (y - cam.cy) * cam.k];
const viewRect = (cam: Cam, marginPx = 0) => ({
  x0: cam.cx - (SCREEN_CX + marginPx) / cam.k,
  x1: cam.cx + (FRAME_W - SCREEN_CX + marginPx) / cam.k,
  y0: cam.cy - (SCREEN_CY + marginPx) / cam.k,
  y1: cam.cy + (FRAME_H - SCREEN_CY + marginPx) / cam.k,
});
const camTransform = (cam: Cam) => {
  const tx = SCREEN_CX - cam.cx * cam.k;
  const ty = SCREEN_CY - cam.cy * cam.k;
  return { tx, ty, svg: `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(6)})` };
};
/** the house hand on the camera (screen px) */
const sway = (g: number) => ({ dx: 3 * Math.sin(g / 23), dy: 5 * Math.sin(g / 19) });
type Bump = [number, number, number, number];
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
const makeTrack = (bumps: Bump[], v0: number, fLo = -60, fHi = 300, sub = 4) => {
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
type Framing = { p: P2; k: number; sx?: number; sy?: number };
type Move = { from: number; to: number; taper?: number };
const makeCamTrack = (framings: Framing[], moves: Move[]) => {
  const F = framings.map((q) => {
    const c = camFor(q.p, q.k, q.sx ?? SCREEN_CX, q.sy ?? 835);
    return [Math.log(q.k), c.cx, c.cy];
  });
  const ch = (c: number) => makeTrack(moves.map((m, i) => [m.from, m.to, F[i + 1][c] - F[i][c], m.taper ?? 1] as Bump), F[0][c]);
  const LK = ch(0);
  const CX = ch(1);
  const CY = ch(2);
  return (g: number): Cam => ({ k: Math.exp(LK(g)), cx: CX(g), cy: CY(g) });
};

const KYIV: P2 = [PLACES.kyiv.x, PLACES.kyiv.y];
// Ukraine's bbox centre at k 1 is world (540, 790) (the build's fit).
const UA_C: P2 = [540, 790];
// THE R2 CAMERA. Wide country centre y710, then Kyiv at (440,430), k1.65.
// Creep to k1.68, return country centre y700, then a restrained northern push
// toward Kyiv (375,505), k1.62. Geography is untouched; all moving heads clear
// y1080 throughout the cut. The final push continues beyond the cut at f232.
export const CAM_FRAMINGS: Framing[] = [
  { p: UA_C, k: 1.0, sy: 710 },
  { p: KYIV, k: 1.65, sx: 440, sy: 430 },
  { p: KYIV, k: 1.68, sx: 440, sy: 430 },
  { p: [540, 784], k: 1.03, sy: 700 },
  { p: KYIV, k: 1.62, sx: 375, sy: 505 },
];
export const CAM_MOVES: Move[] = [
  { from: -12, to: 52 },
  { from: 40, to: 112 },
  { from: 102, to: 146 },
  { from: 140, to: 232 },
];
export const camAt = makeCamTrack(CAM_FRAMINGS, CAM_MOVES);

// ---------------------------------------------------------------------------
// The static map: LOD rasters + world-space mottle (iraqShared's MapStack)
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
export const mapSharpness = (cam: Cam) => {
  const w = levelWeights(cam);
  let top = 0;
  for (let i = 0; i < w.length; i++) if (w[i] >= 0.5) top = i;
  return { level: LEVELS[top].name, texelsPerPx: LEVELS[top].s / cam.k, weights: w };
};
const MapStack: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  const layers = LEVELS.map((L, li) => {
    if (w[li] <= 0.001) return null;
    if (w.some((o, j) => j > li && o >= 0.999)) return null;
    return (
      <Img
        key={L.name}
        src={staticFile(`${TEX}/lod-${L.name}.png`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.W,
          height: L.H,
          opacity: w[li],
          transformOrigin: "0 0",
          transform: `translate(${(tx + L.x0 * k).toFixed(3)}px, ${(ty + L.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
        }}
      />
    );
  });
  // mottle, world space, in octaves: stains keep ~ the same screen size through a zoom
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const mt: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((v.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((v.y0 - oy) / S) * S + oy;
    for (let y = y0; y < v.y1; y += S) for (let x = x0; x < v.x1; x += S) mt.push({ x, y, s: S, o: op });
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
          opacity: 0.9,
        }}
      >
        {mt.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile(`${TEX}/mottle.png`)}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Routes (polylines with arclength; iraqShared's makeRoute)
// ---------------------------------------------------------------------------
type Route = {
  pts: P2[];
  cum: number[];
  len: number;
  pointAt: (s: number) => P2;
  tangentAt: (s: number) => P2;
  partialPath: (s0: number, s1: number) => P2[];
};
const makeRoute = (pts: P2[]): Route => {
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
  return { pts, cum, len, pointAt, tangentAt, partialPath };
};

// ---------------------------------------------------------------------------
// Hatch geometry (world-anchored lines that keep their screen spacing through a zoom)
// ---------------------------------------------------------------------------
/** octave-stable hatch pattern geometry: period P (world), the mid line's weight */
const hatchGeom = (k: number, px: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  return { P: (2 * px) / Math.pow(2, o), mid: L2 - o };
};

// ---------------------------------------------------------------------------
// THE THRUSTS
// ---------------------------------------------------------------------------
type ThrustKey = keyof typeof THRUSTS;
type CounterKey = "kyivWest" | "kyivEast" | "chernihiv";
type Plan = {
  key: ThrustKey;
  go: [number, number]; // advance: stub -> end, constant speed with eased ends
  a: number; // ease-in frames
  b: number; // ease-out frames
  counter?: [number, number]; // its orange counter-arrow: grows at [0], reaches the border at [1]
};
// Constant speed for each (k 1 world px / frame): Irpin 1.5, Brovary 4.2 (the race
// from Sumy), Chernihiv 1.4, Kharkiv 1.3, Kherson 1.9, Mariupol 3.1. The three
// northern thrusts are pushed back out by orange counter-arrows from ~f160.
export const PLANS: Plan[] = [
  { key: "kharkiv", go: [21, 62], a: 6, b: 16 },
  { key: "kherson", go: [20, 86], a: 6, b: 20 },
  { key: "mariupol", go: [20, 98], a: 6, b: 22 },
  { key: "chernihiv", go: [22, 64], a: 6, b: 16, counter: [161, 196] },
  { key: "kyivEast", go: [19, 82], a: 6, b: 14, counter: [158, 200] },
  { key: "kyivWest", go: [20, 82], a: 6, b: 14, counter: [160, 198] },
];
const COMMIT: [number, number] = [14, 26]; // the stubs brighten as they launch
const ARROW_DIM = "#ACA087"; // cream sunk toward the page: staged / pushed out
const ROUTES = {} as Record<ThrustKey, Route>;
(Object.keys(THRUSTS) as ThrustKey[]).forEach((k) => {
  ROUTES[k] = makeRoute(THRUSTS[k].pts);
});
/** advance fraction 0..1: velocity ramps in over a, flat, ramps out over b (C1) */
const advance = (f: number, f0: number, f1: number, a: number, b: number) => {
  const D = f1 - f0;
  const area = D - a / 2 - b / 2;
  const x = f - f0;
  if (x <= 0) return 0;
  if (x >= D) return 1;
  let v: number;
  if (x < a) v = 0.5 * (x - (a / Math.PI) * Math.sin((Math.PI * x) / a));
  else if (x < D - b) v = 0.5 * a + (x - a);
  else {
    const y = x - (D - b);
    v = 0.5 * a + (D - b - a) + 0.5 * (y + (b / Math.PI) * Math.sin((Math.PI * (b - y)) / b));
  }
  return v / area;
};

// Arrow dimensions, screen px at k 1; they grow as k^ARROW_GROW on screen.
// V2: 0.55 (was 0.3), so the close shots (the Kyiv stall at k 1.9, the counter-push
// at k ~1.75) carry arrows ~1.4x the wide's, readable at phone size.
const ARROW_GROW = 0.55;
type Dims = { shaft: number; tail: number; headHW: number; headL: number; taper: number };
// the cream thrusts: shaft half-width, tail half-width, barb half-width, head length,
// taper (world px over which the shaft widens from the tail)
const CREAM_DIMS: Dims = { shaft: 12.5, tail: 7.5, headHW: 27, headL: 45, taper: 56 };
// the orange counter-arrows: short and broad (V2: 1.3x V1, the payoff of the cut)
const COUNTER_DIMS: Dims = { shaft: 14, tail: 10, headHW: 50, headL: 64, taper: 18 };
const COUNTER_LEN = 82; // screen px at k 1, tail to tip
const NECK = 0.78; // where the shaft meets the head, as a fraction of the head length back from the tip

type ArrowGeom = { outline: string; shade: string };
/** the engraved arrow along route r from sTail to sTip: a tapering shaft, swept-back
 *  barbs, a notched tail; shade = the half on the side `side` (+1 left of travel, -1
 *  right); g = world units per screen px of the arrow's size, sc scales the dims */
const arrowGeom = (r: Route, sTail: number, sTip: number, g: number, side: number, D: Dims, sc = 1): ArrowGeom => {
  const HL = D.headL * g * sc;
  const HW = D.headHW * g * sc;
  const sBase = Math.max(sTail + 0.01, sTip - HL);
  const sNeck = Math.max(sTail + 0.005, sTip - HL * NECK);
  const tip = r.pointAt(sTip);
  const base = r.pointAt(sBase);
  const al = Math.hypot(tip[0] - base[0], tip[1] - base[1]) || 1;
  const dir: P2 = [(tip[0] - base[0]) / al, (tip[1] - base[1]) / al];
  const nrm: P2 = [-dir[1], dir[0]];
  const hw = (s: number) => (D.tail + (D.shaft - D.tail) * smoothstep((s - sTail) / D.taper)) * g * sc;
  const N = Math.max(3, Math.ceil((sNeck - sTail) / (3 * g)));
  const left: P2[] = [];
  const right: P2[] = [];
  const centre: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const s = sTail + ((sNeck - sTail) * i) / N;
    const p = r.pointAt(s);
    const t = r.tangentAt(s);
    const n: P2 = [-t[1], t[0]];
    const w = hw(s);
    left.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    right.push([p[0] - n[0] * w, p[1] - n[1] * w]);
    centre.push(p);
  }
  const barbL: P2 = [base[0] + nrm[0] * HW, base[1] + nrm[1] * HW];
  const barbR: P2 = [base[0] - nrm[0] * HW, base[1] - nrm[1] * HW];
  const t0 = r.tangentAt(sTail);
  const nd = D.tail * 0.7 * g * sc;
  const notch: P2 = [centre[0][0] + t0[0] * nd, centre[0][1] + t0[1] * nd];
  const outline = dOf([notch, ...left, barbL, tip, barbR, ...right.slice().reverse()], true);
  const sideEdge = side > 0 ? left : right;
  const barb = side > 0 ? barbL : barbR;
  const shade = dOf([notch, ...centre.slice(1), tip, barb, ...sideEdge.slice().reverse()], true);
  return { outline, shade };
};
/** the shade side: the one facing away from a light in the upper left (screen SE) */
const shadeSideOf = (r: Route) => {
  let acc = 0;
  for (let s = 0; s <= r.len; s += 4) {
    const t = r.tangentAt(s);
    acc += -t[1] * 1 + t[0] * 1; // left normal (-ty, tx) . (1, 1)
  }
  return acc >= 0 ? 1 : -1;
};
const SHADE_SIDE = {} as Record<ThrustKey, number>;
(Object.keys(THRUSTS) as ThrustKey[]).forEach((k) => {
  SHADE_SIDE[k] = shadeSideOf(ROUTES[k]);
});

// THE COUNTER-PUSH ("and the Ukrainians aren't giving up"). Each orange counter-arrow
// grows out of the orange at Kyiv (its west edge for Irpin, its east edge for Brovary;
// out of Chernihiv for the Chernihiv thrust), meets the cream head from in front, then
// runs on along the cream thrust's own path, reversed, to the border: tip to tip, it
// pushes the cream head back (the cream body shortens from the head); its tail stays
// at the city until it reaches full length, then it slides. At the border its tail
// draws in and it settles as an orange arrowhead on the border, the cream thrust a
// dim stub behind it.
type Counter = { r: Route; lenA: number; side: number };
const COUNTERS = {} as Record<CounterKey, Counter>;
(["kyivWest", "kyivEast", "chernihiv"] as const).forEach((key) => {
  const cr = ROUTES[key];
  const T = THRUSTS[key];
  const tip = cr.pointAt(cr.len);
  const tan = cr.tangentAt(cr.len);
  // origins: the west / east edge of the Kyiv dot, and Chernihiv itself (in front of
  // its head); a short smooth curve to the cream tip, arriving head-on
  const toTip = (o: P2): P2 => {
    const l = Math.hypot(tip[0] - o[0], tip[1] - o[1]) || 1;
    return [(tip[0] - o[0]) / l, (tip[1] - o[1]) / l];
  };
  const O: P2 =
    key === "chernihiv"
      ? [tip[0] + tan[0] * 24, tip[1] + tan[1] * 24]
      : [KYIV[0] + toTip(KYIV)[0] * 6, KYIV[1] + toTip(KYIV)[1] * 6];
  const d = Math.hypot(tip[0] - O[0], tip[1] - O[1]) || 1;
  const p1: P2 = [O[0] + toTip(O)[0] * (d / 3), O[1] + toTip(O)[1] * (d / 3)];
  const p2: P2 = [tip[0] + (tan[0] * d) / 3, tip[1] + (tan[1] * d) / 3];
  const ptsA: P2[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const a0 = (1 - u) * (1 - u) * (1 - u);
    const a1 = 3 * (1 - u) * (1 - u) * u;
    const a2 = 3 * (1 - u) * u * u;
    const a3 = u * u * u;
    ptsA.push([a0 * O[0] + a1 * p1[0] + a2 * p2[0] + a3 * tip[0], a0 * O[1] + a1 * p1[1] + a2 * p2[1] + a3 * tip[1]]);
  }
  const back = cr.partialPath(T.entry, cr.len).slice().reverse(); // the stop .. the border
  const r = makeRoute([...ptsA, ...back.slice(1)]);
  COUNTERS[key] = { r, lenA: makeRoute(ptsA).len, side: shadeSideOf(r) };
});
const SETTLE = 10; // frames for a counter-arrow's tail to draw in at the border
/** the counter-arrow's tip arclength on its route (constant speed, eased ends) */
const counterU = (p: Plan, f: number) =>
  p.counter ? COUNTERS[p.key as CounterKey].r.len * advance(f, p.counter[0], p.counter[1], 4, 8) : 0;
export const tipS = (p: Plan, f: number) => {
  const T = THRUSTS[p.key];
  const out = T.stub + (T.len - T.stub) * advance(f, p.go[0], p.go[1], p.a, p.b);
  if (!p.counter) return out;
  const C = COUNTERS[p.key as CounterKey];
  return Math.max(T.stub, Math.min(out, T.len - Math.max(0, counterU(p, f) - C.lenA)));
};
/** 0 = staged / pushed out (cream sunk toward the page), 1 = committed */
const commitOf = (p: Plan, f: number) => {
  const c = smoothstep((f - COMMIT[0]) / (COMMIT[1] - COMMIT[0]));
  if (!p.counter) return c;
  return c * (1 - smoothstep((f - (p.counter[1] - 16)) / 18));
};

// THE EXPECTATION: a bold dashed projection (about a shaft wide) from each Kyiv
// arrow's tip on into Kyiv and a little beyond (the expected sweep). A cubic leaving
// along the head's direction and arriving along a direction fixed per arrow (so the
// part beyond Kyiv never swings), then straight on for OVER world px. Tip first; the
// dash pattern is anchored at the tip, so the dashes march with the arrow.
const OVER = 15; // world px beyond Kyiv: the expected sweep ends just past the ring
const ARRIVE = {} as Record<"kyivWest" | "kyivEast", P2>;
(["kyivWest", "kyivEast"] as const).forEach((key) => {
  const r = ROUTES[key];
  const tip = r.pointAt(r.len);
  const t = r.tangentAt(r.len);
  const d = Math.hypot(KYIV[0] - tip[0], KYIV[1] - tip[1]) || 1;
  const v: P2 = [(KYIV[0] - tip[0]) / d + 0.5 * t[0], (KYIV[1] - tip[1]) / d + 0.5 * t[1]];
  const l = Math.hypot(v[0], v[1]) || 1;
  ARRIVE[key] = [v[0] / l, v[1] / l];
});
const projectionPts = (key: "kyivWest" | "kyivEast", sTip: number): P2[] => {
  const r = ROUTES[key];
  const tip = r.pointAt(sTip);
  const t = r.tangentAt(sTip);
  const e = ARRIVE[key];
  const d = Math.hypot(KYIV[0] - tip[0], KYIV[1] - tip[1]);
  const p1: P2 = [tip[0] + (t[0] * d) / 3, tip[1] + (t[1] * d) / 3];
  const p2: P2 = [KYIV[0] - (e[0] * d) / 3, KYIV[1] - (e[1] * d) / 3];
  const out: P2[] = [];
  const N = 32;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a0 = (1 - u) * (1 - u) * (1 - u);
    const a1 = 3 * (1 - u) * (1 - u) * u;
    const a2 = 3 * (1 - u) * u * u;
    const a3 = u * u * u;
    out.push([a0 * tip[0] + a1 * p1[0] + a2 * p2[0] + a3 * KYIV[0], a0 * tip[1] + a1 * p1[1] + a2 * p2[1] + a3 * KYIV[1]]);
  }
  for (let j = 1; j <= 6; j++) out.push([KYIV[0] + (e[0] * OVER * j) / 6, KYIV[1] + (e[1] * OVER * j) / 6]);
  return out;
};
// run: the front runs out at constant speed (eased ends), Kyiv and beyond by ~f50;
// erase: back into the heads ("people who don't get death ground")
const PROJ_T = {
  kyivWest: { run: [22, 47] as [number, number], erase: [80, 104] as [number, number] },
  kyivEast: { run: [24, 50] as [number, number], erase: [82, 106] as [number, number] },
};
const PROJ_DASH = 15; // world px on
const PROJ_GAP = 9; // world px off
const PROJ_W = 0.8 * 2 * 12.5; // screen px at k 1: about a shaft wide
// Kyiv: a small cream dot (there while arrows point at it: from the staged stubs on)
// and a thin cream ring, the target, drawn as the thrusts launch, undrawn as they go
const RING_IN: [number, number] = [20, 34];
const RING_OUT: [number, number] = [178, 194];

// THE HOLD: a faint highlight along the held territory's northern border, from where
// the Irpin thrust crossed it eastward past the Sumy crossing.
const HELD_ROUTE = makeRoute(HELD_RING);
const ringS = (p: P2) => {
  let best = Infinity;
  let bs = 0;
  for (let i = 0; i < HELD_RING.length; i++) {
    const d = Math.hypot(HELD_RING[i][0] - p[0], HELD_RING[i][1] - p[1]);
    if (d < best) {
      best = d;
      bs = HELD_ROUTE.cum[i];
    }
  }
  return bs;
};
const HL_FROM = ringS(ROUTES.kyivWest.pointAt(THRUSTS.kyivWest.entry));
const HL_TO = ringS(ROUTES.kyivEast.pointAt(THRUSTS.kyivEast.entry));
const HL_T: [number, number] = [166, 226];

// Labels
const LABEL_TRAVEL = 24;
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
const T_UKRAINE = 4; // "Ukraine" 12
const T_RUSSIA = 120; // "Russians" 128
const labelSlide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...CLAMP }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], CLAMP),
});

// ---------------------------------------------------------------------------
const UkraineNotGivingUp: React.FC<Props> = ({ vignette, labels }) => {
  const frame = useCurrentFrame();
  const base = camAt(frame);
  const sw = sway(frame);
  const cam: Cam = { k: base.k, cx: base.cx + sw.dx / base.k, cy: base.cy + sw.dy / base.k };
  const { k } = cam;
  const px = (v: number) => v / k;
  /** marks grow gently with the zoom, never as fast as the map */
  const grow = (v: number, e: number) => (v * Math.pow(k, e)) / k;

  // -- the held territory: deep fill + engraved orange hatch (iraqShared's Hatch) --
  const hz = hatchGeom(k, 9);
  const hatchW = 1.9 / k;
  const firm = smoothstep((frame - 164) / 30); // "aren't giving up": the edge firms
  const edgeW = 2.6 + 0.6 * firm;

  // -- the arrows' shade hatch --
  const az = hatchGeom(k, 4.6);
  const aw = 1.25 / k;

  // -- the hold's highlight --
  const hlU = clamp01((frame - HL_T[0]) / (HL_T[1] - HL_T[0]));
  const hlS = HL_FROM + (HL_TO - HL_FROM) * hlU;
  const hlOp = 0 * smoothstep(hlU / 0.25) * (1 - smoothstep((hlU - 0.8) / 0.2));

  const arrows = PLANS.map((p) => {
    const s = tipS(p, frame);
    const c = commitOf(p, frame);
    const g = grow(1, ARROW_GROW);
    const geo = arrowGeom(ROUTES[p.key], 0, s, g, SHADE_SIDE[p.key], CREAM_DIMS);
    return { p, s, c, geo };
  });
  // the orange counter-arrows
  const counters = PLANS.filter((p) => p.counter).map((p) => {
    const C = COUNTERS[p.key as CounterKey];
    const g = grow(1, ARROW_GROW);
    const u = counterU(p, frame);
    if (u <= 0.05) return null;
    const L = COUNTER_LEN * g;
    const sc = 0.45 + 0.55 * Math.min(1, u / L); // it grows out of the orange
    const settle = smootherstep((frame - (p.counter as [number, number])[1]) / SETTLE);
    const tailRun = Math.max(0, u - L);
    const tailSet = Math.max(0, u - COUNTER_DIMS.headL * g * 1.02);
    const tail = tailRun + (tailSet - tailRun) * settle;
    const geo = arrowGeom(C.r, tail, u, g, C.side, COUNTER_DIMS, sc);
    return { key: p.key, geo, op: smoothstep(u / (0.22 * L)) };
  });

  // the expectation projections
  const projections = (["kyivWest", "kyivEast"] as const).map((key) => {
    const plan = PLANS.find((q) => q.key === key) as Plan;
    const s = tipS(plan, frame);
    const T = PROJ_T[key];
    const reach =
      advance(frame, T.run[0], T.run[1], 3, 7) *
      (1 - interpolate(frame, T.erase, [0, 1], { easing: Easing.inOut(Easing.cubic), ...CLAMP }));
    if (reach <= 0.002) return null;
    const r = makeRoute(projectionPts(key, s)); // s 0 at the tip
    return { key, d: dOf(r.partialPath(0, r.len * reach)) };
  });
  const ringT =
    interpolate(frame, RING_IN, [0, 1], { easing: EASE_LAND, ...CLAMP }) -
    interpolate(frame, RING_OUT, [0, 1], { easing: Easing.inOut(Easing.cubic), ...CLAMP });
  const ringR = grow(13, 0.3);

  const ukSl = labelSlide(frame, T_UKRAINE);
  const ruSl = labelSlide(frame, T_RUSSIA);
  const ukSize = grow(54, 0.2);
  const ruSize = grow(46, 0.3);

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />

      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <pattern id="heldHatch" patternUnits="userSpaceOnUse" width={hz.P} height={hz.P} patternTransform="rotate(45)">
            <line x1={0} y1={-1} x2={0} y2={hz.P + 1} stroke={ACCENT} strokeWidth={hatchW} />
            <line x1={hz.P / 2} y1={-1} x2={hz.P / 2} y2={hz.P + 1} stroke={ACCENT} strokeWidth={hatchW} strokeOpacity={hz.mid} />
            <line x1={hz.P} y1={-1} x2={hz.P} y2={hz.P + 1} stroke={ACCENT} strokeWidth={hatchW} />
          </pattern>
          <pattern id="arrowHatch" patternUnits="userSpaceOnUse" width={az.P} height={az.P} patternTransform="rotate(-38)">
            <line x1={0} y1={-1} x2={0} y2={az.P + 1} stroke={DARK} strokeWidth={aw} />
            <line x1={az.P / 2} y1={-1} x2={az.P / 2} y2={az.P + 1} stroke={DARK} strokeWidth={aw} strokeOpacity={az.mid} />
            <line x1={az.P} y1={-1} x2={az.P} y2={az.P + 1} stroke={DARK} strokeWidth={aw} />
          </pattern>
        </defs>
        <g transform={camTransform(cam).svg}>
          {/* Ukraine's internationally recognised border (Crimea and the Donbas strip inside it) */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={INTL_D} stroke={DARK} strokeOpacity={0.45} strokeWidth={px(4.6)} />
            <path d={INTL_D} stroke={INK} strokeOpacity={0.85} strokeWidth={px(2.1)} />
          </g>
          {/* THE HELD TERRITORY, 23 Feb 2022: orange */}
          <path d={HELD_D} fill={ACCENT_DEEP} fillOpacity={0.22} />
          <path d={HELD_D} fill="url(#heldHatch)" opacity={0.85} />
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={HELD_D} stroke={DARK} strokeOpacity={0.55} strokeWidth={px(edgeW + 2.8)} />
            <path d={HELD_D} stroke={ACCENT} strokeWidth={px(edgeW)} />
          </g>
          {hlOp > 0.01
            ? [0, 1, 2, 3, 4, 5, 6].map((i) => {
                const u0 = i / 7 - 0.5;
                const u1 = (i + 1) / 7 - 0.5;
                const wv = Math.cos(Math.PI * ((u0 + u1) / 2));
                const L = px(200);
                return (
                  <path
                    key={`hl-${i}`}
                    d={dOf(HELD_ROUTE.partialPath(hlS + u0 * L, hlS + u1 * L))}
                    fill="none"
                    stroke={mixColor(ACCENT, INK, 0.65)}
                    strokeOpacity={hlOp * wv * wv}
                    strokeWidth={px(edgeW + 1.2)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })
            : null}

          {/* the dashed expectations, under the arrows (they erase back into the heads) */}
          {projections.map((e) => {
            if (!e) return null;
            const w = grow(PROJ_W, ARROW_GROW);
            const cw = px(4.5);
            return (
              <g key={`pj-${e.key}`} fill="none" strokeLinecap="butt" strokeLinejoin="round">
                <path d={e.d} stroke={DARK} strokeOpacity={0.55} strokeWidth={w + cw} strokeDasharray={`${PROJ_DASH + cw} ${Math.max(0.01, PROJ_GAP - cw)}`} strokeDashoffset={cw / 2} />
                <path d={e.d} stroke={INK} strokeOpacity={0.85} strokeWidth={w} strokeDasharray={`${PROJ_DASH} ${PROJ_GAP}`} />
              </g>
            );
          })}

          {/* THE THRUSTS: engraved cream arrows */}
          {arrows.map(({ p, c, geo }) => {
            const body = mixColor(ARROW_DIM, INK, c);
            return (
              <g key={`ar-${p.key}`} strokeLinejoin="round">
                <path d={geo.outline} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={px(7)} />
                <path d={geo.outline} fill={body} />
                <path d={geo.shade} fill="url(#arrowHatch)" opacity={0.42 + 0.2 * c} />
                <path d={geo.outline} fill="none" stroke={DARK} strokeOpacity={0.92} strokeWidth={px(2.2)} />
              </g>
            );
          })}

          {/* THE COUNTER-PUSH: engraved orange counter-arrows */}
          {counters.map((o) =>
            o ? (
              <g key={`co-${o.key}`} strokeLinejoin="round" opacity={o.op}>
                <path d={o.geo.outline} fill="none" stroke={DARK} strokeOpacity={1} strokeWidth={px(12)} />
                <path d={o.geo.outline} fill={ACCENT} />
                <path d={o.geo.shade} fill="url(#arrowHatch)" opacity={0.5} />
                <path d={o.geo.outline} fill="none" stroke={DARK} strokeOpacity={0.92} strokeWidth={px(2.2)} />
              </g>
            ) : null,
          )}

          {/* Kyiv: the target ring (pen-drawn from the top) and the small cream dot */}
          {ringT > 0.002 ? (
            <g fill="none" transform={`rotate(-90 ${KYIV[0]} ${KYIV[1]})`}>
              <circle cx={KYIV[0]} cy={KYIV[1]} r={ringR} stroke={DARK} strokeOpacity={0.6} strokeWidth={px(5)} pathLength={100} strokeDasharray={`${100 * ringT} 101`} />
              <circle cx={KYIV[0]} cy={KYIV[1]} r={ringR} stroke={INK} strokeOpacity={0.92} strokeWidth={px(2.4)} pathLength={100} strokeDasharray={`${100 * ringT} 101`} />
            </g>
          ) : null}
          <circle cx={KYIV[0]} cy={KYIV[1]} r={grow(6.5, 0.3)} fill={INK} stroke={DARK} strokeOpacity={0.75} strokeWidth={grow(2.2, 0.3)} />
        </g>
      </svg>

      {/* labels, world-anchored, type set along a parallel */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <path id="ukArc" d={UKRAINE_ARC.d} />
          <path id="ruArc" d={RUSSIA_ARC.d} />
        </defs>
        <g transform={camTransform(cam).svg}>
          {ukSl.op > 0.002 ? (
            <g transform={`translate(0 ${px(ukSl.dy)})`} opacity={ukSl.op * 0.92}>
              <text
                fill={INK}
                stroke={SEA}
                strokeOpacity={0.6}
                strokeWidth={ukSize * 0.12}
                paintOrder="stroke"
                style={{ fontFamily: fellSC, fontSize: ukSize, letterSpacing: ukSize * 0.34 }}
              >
                <textPath href="#ukArc" startOffset="50%" textAnchor="middle">
                  {labels.ukraine}
                </textPath>
              </text>
            </g>
          ) : null}
          {ruSl.op > 0.002 ? (
            <g transform={`translate(0 ${px(ruSl.dy)})`} opacity={ruSl.op * 0.88}>
              <text
                fill={INK}
                stroke={SEA}
                strokeOpacity={0.6}
                strokeWidth={ruSize * 0.12}
                paintOrder="stroke"
                style={{ fontFamily: fellSC, fontSize: ruSize, letterSpacing: ruSize * 0.3 }}
              >
                <textPath href="#ruArc" startOffset="50%" textAnchor="middle">
                  {labels.russia}
                </textPath>
              </text>
            </g>
          ) : null}
        </g>
      </svg>

      {/* paper: grain, then the soft vignette */}
      <Img src={staticFile(`${TEX}/grain.png`)} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default UkraineNotGivingUp;

// for the review scripts
export const _debug = { screenOf, camAt, mapSharpness, PLANS, tipS, THRUSTS, KYIV, ROUTES, COUNTERS, counterU, arrowGeom, CREAM_DIMS, COUNTER_DIMS, COUNTER_LEN, ARROW_GROW, sway, smootherstep, smoothstep, SETTLE };
