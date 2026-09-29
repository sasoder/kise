// The Korea 1950 WORLD pair (ThirdPartyIntervention + CivilRegionalGlobal) on
// ONE global clock G: the word table, the authored camera track, the ring and
// the raster LOD blend. Pure maths, no React, so the raster bake
// (scripts/bake-world-rasters.mjs) and the check script read the exact same
// camera the components draw.
//
// G 0 = 10.599 s (ThirdPartyIntervention f0). CivilRegionalGlobal f0 = G 149 =
// round((16.820 - 10.599) x 24). Cut 2 = G 0..164, cut 3 = G 149..372; the
// 16 frames G 149..164 are drawn by both, from the same function of G.
import { LIT_BOUNDS, PLACES } from "./worldMapData";

export const FPS = 24;
export const CUT2_G0 = 0;
export const CUT3_G0 = 149; // round((16.820 - 10.599) * 24)
// Cut 2: speech 6.221 s -> round(6.221 x 24) = 149, + the 16-frame tail = 165.
export const CUT2_DURATION = 165;
// Cut 3: speech 8.660 s -> round(8.660 x 24) = 208, + the 16-frame tail = 224.
export const CUT3_DURATION = 224;
export const G_LAST = CUT3_G0 + CUT3_DURATION - 1; // 372

/** word onsets, GLOBAL frames */
export const W = {
  // cut 2 (local == global)
  until: 0,
  triggered: 17,
  third: 31,
  intervention: 45,
  hell: 62,
  when: 82,
  united: 88,
  states: 93,
  and: 102,
  un: 107,
  partners: 120,
  got: 128,
  involved: 134,
  // cut 3 (local + 149)
  then: 149 + 0,
  civil: 149 + 28,
  war1: 149 + 34,
  becomes: 149 + 41,
  regional: 149 + 58,
  war2: 149 + 66,
  with: 149 + 75,
  potential: 149 + 81,
  global: 149 + 105,
  war3: 149 + 112,
  and2: 149 + 121,
  completely: 149 + 145,
  different: 149 + 157,
  race: 149 + 166,
  much: 149 + 183,
  higher: 149 + 191,
  cost: 149 + 197,
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const ramp = (g: number, a: number, b: number) => smoothstep((g - a) / (b - a));

// ---------------------------------------------------------------------------
// Monotone cubic (PCHIP) through keys: C1, no overshoot.
// ---------------------------------------------------------------------------
export const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0]; // already moving on the first frame
    if (i === n - 1) return d[n - 2]; // runs on at the end (no stop on the last frame)
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

// ---------------------------------------------------------------------------
// THE CAMERA: one authored track (k, and the SCREEN position of one world
// anchor, the middle of the peninsula), C1 by construction, never chasing.
// World point X is drawn at  anchorScreen + k (X - anchor).  Because the anchor
// is the subject of the whole piece (Korea, and the ring round it), its screen
// speed is exactly the authored sx', sy', and everything else zooms about it.
//   G   0  k 22     Korea close (the North's hatch down to the 4 Aug perimeter)
//   G  30  k 22.66  a 3 % creep in (the held breath)
//   G  64  k 4.6    the long pull-back out over the Pacific, Korea sliding left
//   G  82  k 2.2    ... east / out until the USA is in frame
//   G 128  k 1.30   the whole-world wide (K_WIDE): the lit span, 44 px margins
//   G 138  x1.01    creep (the push gathers from here, gently)
//   G 173  k 5.6    cut 3: the push back in to Korea (ring 6 deg framed)
//   G 186  k 5.82   creep
//   G 209  k 4.0    the ring at 28 deg framed (the camera pulled back with it)
//   G 221  k 3.94   creep out, into
//   G 250  k 1.30   the whole-world wide again, 4 f before "global"
//   G 264  x1.012   creep, gathering into
//   G 372  k ~8.5   ONE slow push back into Korea (TAIL below): the atlas
//                   plate's top edge leaves frame by G339 (f190), Korea to
//                   x 540, y 830, still creeping on the last frame
// ---------------------------------------------------------------------------
export const ANCHOR = { x: PLACES.koreaMid[0], y: PLACES.koreaMid[1] };
// THE WORLD WIDE (director review): the largest k at which every lit polity
// (the 16 UN combat contributors, the PRC, the USSR) sits inside the frame with
// WIDE_MARGIN px each side; the oval's left/right ends are cropped by the frame.
// The lit span is centred on x 540, the band (the sphere's middle, world y 835)
// on y 835.
export const WIDE_MARGIN = 44;
const LIT_X0 = Math.min(...Object.values(LIT_BOUNDS).map((b) => b[0]));
const LIT_X1 = Math.max(...Object.values(LIT_BOUNDS).map((b) => b[2]));
export const K_WIDE = (1080 - 2 * WIDE_MARGIN) / (LIT_X1 - LIT_X0);
export const CX_WIDE = (LIT_X0 + LIT_X1) / 2;
/** the anchor's screen position in a wide at zoom k (centred on the lit span, band on y 835) */
const wideS = (k: number) => [540 + k * (ANCHOR.x - CX_WIDE), 835 + k * (ANCHOR.y - 835)] as const;
type Key = [number, number, number, number]; // G, k, sx, sy
const KEYS: Key[] = [
  [0, 22, 540, 835],
  [30, 22.66, 540, 835],
  [64, 4.6, 222, 832],
  [82, 2.2, 148, 829],
  [128, K_WIDE, ...wideS(K_WIDE)],
  [138, K_WIDE * 1.01, ...wideS(K_WIDE * 1.01)],
  [173, 5.6, 540, 835],
  [186, 5.82, 540, 835],
  [209, 4.0, 540, 746],
  [221, 3.94, 540, 744],
  [250, K_WIDE, ...wideS(K_WIDE)],
  [264, K_WIDE * 1.012, ...wideS(K_WIDE * 1.012)],
  [339, 7.6, 540, 760], // k here is not used: the tail's zoom is authored below (TAIL)
  [372, 8.6, 540, 830],
];
const SX = pchip(KEYS.map(([g, , sx]) => [g, sx]));
const SY = pchip(KEYS.map(([g, , , sy]) => [g, sy]));
// the tail's shape: see CUT 3's TAIL below
const TAIL = { g0: 264, up: [264, 282] as const, down: [320, 348] as const, vEnd: 0.005, plateOff: 339 };
// ln k through the keys up to the tail's start (the last key's slope runs on, C1)
const LNK_HEAD = pchip(KEYS.filter(([g]) => g <= TAIL.g0).map(([g, k]) => [g, Math.log(k)]));

// ---------------------------------------------------------------------------
// CUT 3's TAIL (director review 2): ONE slow push from the world wide back into
// Korea, the bookend to the pull-back. ln k's velocity is authored as a
// trapezoid with smoothstep shoulders (C1 zoom): from the wide's creep rate at
// G264 (f115) up to vMax over TAIL.up, held, then down to the creep TAIL.vEnd
// over TAIL.down, still creeping on the last frame. vMax is solved so the
// atlas plate's top edge (the sphere's 90 N line, world y SPHERE_TOP) leaves
// the top of the frame, with the sway and 8 px to spare, at TAIL.plateOff
// (G339 = f190), so "much higher cost" (f183-197) lands on a full frame. A
// flat-topped velocity keeps the zoom's frame-edge content speed down (the peak
// is only ~1.3x the mean; a plain ease would be ~1.5x).
// ---------------------------------------------------------------------------
export const SPHERE_TOP = 591.64; // world y of the Equal Earth 90 N line
const TAIL_DT = 0.05;
const tailTable = (vMax: number) => {
  const v0 = (LNK_HEAD(TAIL.g0 + 0.01) - LNK_HEAD(TAIL.g0 - 0.01)) / 0.02;
  const n = Math.ceil((G_LAST + 2 - TAIL.g0) / TAIL_DT) + 1;
  const out = new Float64Array(n);
  out[0] = LNK_HEAD(TAIL.g0);
  for (let i = 1; i < n; i++) {
    const g = TAIL.g0 + (i - 0.5) * TAIL_DT;
    const up = smoothstep((g - TAIL.up[0]) / (TAIL.up[1] - TAIL.up[0]));
    const down = smoothstep((g - TAIL.down[0]) / (TAIL.down[1] - TAIL.down[0]));
    const v = v0 + (vMax - v0) * up - (vMax - TAIL.vEnd) * down;
    out[i] = out[i - 1] + v * TAIL_DT;
  }
  return out;
};
const tabAt = (t: Float64Array, g: number) => {
  const x = (g - TAIL.g0) / TAIL_DT;
  const i = Math.max(0, Math.min(t.length - 2, Math.floor(x)));
  return t[i] + (t[i + 1] - t[i]) * (x - i);
};
const TAIL_TAB = (() => {
  const target = Math.log((SY(TAIL.plateOff) + 4 + 8) / (ANCHOR.y - SPHERE_TOP));
  let lo = 0;
  let hi = 0.2;
  for (let it = 0; it < 50; it++) {
    const m = (lo + hi) / 2;
    if (tabAt(tailTable(m), TAIL.plateOff) < target) lo = m;
    else hi = m;
  }
  return tailTable(hi);
})();
const LNK = (g: number) => (g <= TAIL.g0 ? LNK_HEAD(g) : tabAt(TAIL_TAB, g));

/** the camera at global frame g: zoom k and the world point (cx, cy) at screen centre (540, 960) */
export const camAt = (g: number) => {
  const k = Math.exp(LNK(g));
  const sx = SX(g);
  const sy = SY(g);
  return { k, sx, sy, cx: ANCHOR.x + (540 - sx) / k, cy: ANCHOR.y + (960 - sy) / k };
};
export const CAM_TRACK = Array.from({ length: G_LAST + 1 }, (_, g) => camAt(g));

// ---------------------------------------------------------------------------
// The raster LOD pyramid: the level blend is a function of k alone, so a level
// fades in across a band of k and never pops. Level i is drawn while its
// opacity > 0 and the level above is not yet opaque.
//   kBake: the zoom its screen-constant strokes are baked for; s: texels per
//   world px (>= ~the largest k it serves); detail: which geometry it bakes.
// ---------------------------------------------------------------------------
export const LEVEL_DEF = [
  { name: "world", kBake: 1.3, s: 1.9, band: null, detail: "world" },
  { name: "l2", kBake: 2.1, s: 3.3, band: [1.45, 1.75] as const, detail: "world" },
  { name: "l3", kBake: 3.9, s: 6, band: [2.6, 3.1] as const, detail: "world" },
  { name: "l4", kBake: 7.2, s: 11, band: [5.0, 5.8] as const, detail: "near" },
  { name: "l5", kBake: 13, s: 18.5, band: [9, 10.8] as const, detail: "korea" },
  { name: "l6", kBake: 21, s: 26, band: [15.5, 18] as const, detail: "korea" },
];
export const levelOps = (k: number) =>
  LEVEL_DEF.map((L) => (L.band ? smoothstep(Math.log(k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1));
export const levelDrawn = (ops: number[], i: number) => ops[i] > 0.001 && (i === ops.length - 1 || ops[i + 1] < 0.999);
