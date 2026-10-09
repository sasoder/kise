// ClosedWorldsTide: THE CAMERA. One track for all 235 frames, pure maths, so the
// build script (which bakes exactly what the camera sees) and the check script
// can use it.
//   f0-f96    the pull-back of ClosedWorlds: a pure zoom about PIVOT, k 9 -> ~0.9
//   f96-f150  it keeps creeping out (k ~0.8 at its widest, f ~140) and leaves along
//             a rail: the Atlantic -> West Africa -> the Cape -> the Indian Ocean
//   f150-235  the descent on Australia, gliding on across the Tasman to the final
//             framing of MinorityInOwnCountry, and a slow push-in as it holds
import { K0, PIVOT, routeAt, routeOf, type P2 } from "./tideGeo";

export const DURATION = 235;
export const FRAME_W = 1080;
export const FRAME_H = 1920;
export type Cam = { k: number; cx: number; cy: number };

const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
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

// ---- zoom: the velocity of ln k, integrated on a 1/8-frame grid ------------------------
// f0-f74 is ClosedWorlds' own (a creep that never stops + one long bump); from f74 the
// creep carries on out, turns at f ~140 and becomes the descent.
const CREEP = 0.0034;
const BUMP = { a0: 2, a1: 16, b0: 57, b1: 74 };
const bump = (f: number) => {
  if (f <= BUMP.a0 || f >= BUMP.b1) return 0;
  if (f < BUMP.a1) return 0.5 - 0.5 * Math.cos((Math.PI * (f - BUMP.a0)) / (BUMP.a1 - BUMP.a0));
  if (f <= BUMP.b0) return 1;
  return 0.5 + 0.5 * Math.cos((Math.PI * (f - BUMP.b0)) / (BUMP.b1 - BUMP.b0));
};
const MAIN = (Math.log(K0 / 0.972) - CREEP * 84) / ((BUMP.a1 - BUMP.a0) / 2 + (BUMP.b0 - BUMP.a1) + (BUMP.b1 - BUMP.b0) / 2);
/** the final framing (Mercator fit of MinorityInOwnCountry's last frame) */
export const CAM_END: Cam = { k: 2.673, cx: 2443, cy: 1529 };
const K_LAST = CAM_END.k * 1.022;
/** d ln k / d frame after f74: [frame, rate]; the positive side is scaled so the last frame lands on K_LAST */
const ZOOM_KEYS: [number, number][] = [
  [74, -CREEP],
  [100, -0.0042],
  [124, -0.0036],
  [138, 0],
  [146, 0.012],
  [154, 0.03],
  [160, 0.04],
  [168, 0.04],
  [178, 0.026],
  [190, 0.012],
  [204, 0.0036],
  [216, 0.0012],
  [240, 0.0009],
];
const zoomRate = pchip(ZOOM_KEYS);
const SUB = 8;
const LNK: number[] = (() => {
  const run = (g: number) => {
    const out = [Math.log(K0)];
    for (let i = 1; i <= (DURATION + 2) * SUB; i++) {
      const f = (i - 0.5) / SUB;
      let v = -(CREEP + MAIN * bump(f));
      if (f > 74) {
        v = zoomRate(f);
        if (v > 0) v *= g;
      }
      out.push(out[i - 1] + v / SUB);
    }
    return out;
  };
  let g = 1;
  for (let it = 0; it < 30; it++) {
    const o = run(g);
    g *= Math.pow(Math.log(K_LAST) - Math.min(...o), 1) / (o[(DURATION - 1) * SUB] - Math.min(...o));
  }
  return run(g);
})();
export const kAt = (f: number) => {
  const x = Math.max(0, Math.min(LNK.length - 1.001, f * SUB));
  const i = Math.floor(x);
  return Math.exp(LNK[i] + (LNK[i + 1] - LNK[i]) * (x - i));
};

// ---- travel: the frame's centre (world px) ------------------------------------------------
const F_RAIL = 96;
/** the gain the solver put on RAIL_V (1 = the keys as written) */
export let RAIL_GAIN = 1;
const pivotC = (f: number): [number, number] => {
  const k = kAt(f);
  return [PIVOT[0] + (FRAME_W / 2 - PIVOT[0]) / k, PIVOT[1] + (FRAME_H / 2 - PIVOT[1]) / k];
};
// From F_RAIL the centre rides a RAIL (world px) at a prescribed SCREEN speed: the rail
// says where, RAIL_V says how fast the map slides under the middle of the frame
// (px / frame), so the crossing is one long even glide and nothing whips.
const RAIL_WAY: P2[] = [
  [640, 959],
  [712, 985],
  [805, 1085],
  [1040, 1335],
  [1450, 1468],
  [1830, 1478],
  [2080, 1466],
  [2235, 1462],
  [2335, 1474],
  [2390, 1492],
  [2425, 1513],
  [2439, 1525],
  [CAM_END.cx + 1.5, CAM_END.cy + 0.5],
];
/** [frame, screen px per frame] */
const RAIL_V: [number, number][] = [
  [104, 4],
  [112, 9],
  [118, 18],
  [124, 28],
  [129, 31],
  [150, 31],
  [158, 26],
  [166, 21],
  [176, 17],
  [186, 11],
  [198, 5],
  [210, 1.6],
  [222, 0.5],
  [240, 0.3],
];
const RAIL_TAB: number[] = (() => {
  const c0 = pivotC(F_RAIL);
  const c1 = pivotC(F_RAIL - 1);
  const v0 = Math.hypot(c0[0] - c1[0], c0[1] - c1[1]) * kAt(F_RAIL);
  const rail = routeOf([c0, ...RAIL_WAY], 2);
  const speed = pchip([[F_RAIL, v0], ...RAIL_V]);
  const run = (g: number) => {
    const out = [0];
    for (let i = 1; i <= (DURATION + 2 - F_RAIL) * SUB; i++) {
      const f = F_RAIL + (i - 0.5) / SUB;
      const e = Math.min(1, (f - F_RAIL) / 12);
      out.push(out[i - 1] + (speed(f) * (1 + (g - 1) * e * e * (3 - 2 * e))) / kAt(f) / SUB);
    }
    return out;
  };
  // one gain on the whole profile so the glide ends exactly on the final framing
  let g = 1;
  for (let it = 0; it < 40; it++) g *= rail.len / run(g)[(DURATION - 1 - F_RAIL) * SUB];
  RAIL_GAIN = g;
  const s = run(g);
  const out: number[] = [];
  const q = [0, 0];
  for (const v of s) {
    routeAt(rail, Math.min(v, rail.len), 0, q);
    out.push(q[0], q[1]);
  }
  return out;
})();
export const cameraAt = (f: number): Cam => {
  const k = kAt(f);
  if (f <= F_RAIL) {
    const c = pivotC(f);
    return { k, cx: c[0], cy: c[1] };
  }
  const x = Math.min((f - F_RAIL) * SUB, RAIL_TAB.length / 2 - 1.001);
  const i = Math.floor(x);
  const t = x - i;
  return { k, cx: RAIL_TAB[2 * i] + (RAIL_TAB[2 * i + 2] - RAIL_TAB[2 * i]) * t, cy: RAIL_TAB[2 * i + 1] + (RAIL_TAB[2 * i + 3] - RAIL_TAB[2 * i + 1]) * t };
};
export const toScreen = (p: ArrayLike<number>, cam: Cam): [number, number] => [FRAME_W / 2 + (p[0] - cam.cx) * cam.k, FRAME_H / 2 + (p[1] - cam.cy) * cam.k];
