// ---------------------------------------------------------------------------
// onlyDivergenceMotion: the pure geometry and timing of OnlyDivergence (cut C
// of Sheppard_Vikings). No React, so it can be audited from a script.
// World units == screen px at k 1. Time runs left (earlier) to right (later).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 141;
export const W = 1080;
export const H = 1920;

/** monotone cubic through keys [x, y] (same as cortesShared.pchip) */
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

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// ---- the axis ---------------------------------------------------------------
export const CENTURY = 300; // world px per century
export const X_FORK = 900; // the tick where the branch leaves
export const N_CENT = 5; // the 500 years
export const X_END = X_FORK + N_CENT * CENTURY; // where the Europeans arrive
export const Y_AXIS = 1000; // the history that happened
export const RISE = 330;
export const Y_BRANCH = Y_AXIS - RISE;
export const PEEL = 450; // length of the railway-switch curve
export const TICK_FIRST = -4; // centuries drawn, relative to the fork
export const TICK_LAST = 9;

/** centreline of the branch */
export const branchY = (x: number) => Y_AXIS - RISE * smoothstep((x - X_FORK) / PEEL);
/** its weight: strength accumulating with time, 10 px -> 24 px */
export const W0 = 10;
export const W1 = 24;
export const branchW = (x: number) => W0 + (W1 - W0) * clamp01((x - X_FORK) / (X_END - X_FORK));

// ---- the head of the branch: an authored speed profile, integrated ---------
// px/frame keys; never constant, never zero between the fork and the arrival.
const SPEED = pchip(
  [
    [3, 0],
    [7, 28.5],
    [21, 28],
    [34, 13.5],
    [85, 12.5],
    [104, 8.5],
    [114, 0],
  ],
  true,
);
const SUB = 8;
const HEAD_RAW: number[] = (() => {
  const out = [0];
  let acc = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    for (let j = 0; j < SUB; j++) {
      const t = f + (j + 0.5) / SUB;
      acc += (t <= 3 || t >= 114 ? 0 : Math.max(0, SPEED(t))) / SUB;
    }
    out.push(acc);
  }
  return out;
})();
const HEAD_TOTAL = HEAD_RAW[HEAD_RAW.length - 1];
/** world x of the head on frame f */
export const headX = (f: number) => {
  const i = Math.max(0, Math.min(HEAD_RAW.length - 1, Math.round(f)));
  return X_FORK + (HEAD_RAW[i] / HEAD_TOTAL) * (X_END - X_FORK);
};
/** first frame on which the head has reached world x */
export const frameAt = (x: number) => {
  for (let f = 0; f <= DURATION; f++) if (headX(f) >= x - 0.5) return f;
  return DURATION;
};

// ---- the camera: its own keyed track (never chasing) -------------------------
// cx relative to the fork. One long travel, already gliding on f0, never at rest.
const CX = pchip([
  [0, -80],
  [8, -35],
  [22, 190],
  [34, 405],
  [60, 815],
  [85, 1205],
  [104, 1452],
  [114, 1524],
  [124, 1548],
  [132, 1555],
  [142, 1561],
]);
const LK = pchip([
  [0, Math.log(1.05)],
  [22, Math.log(1.04)],
  [70, Math.log(1.0)],
  [114, Math.log(1.004)],
  [142, Math.log(1.04)],
]);
export const PIVOT_Y = 835; // world y == screen y here at every k
export const cam = (f: number) => ({ cx: X_FORK + CX(f), k: Math.exp(LK(f)) });
export const screenX = (x: number, f: number) => {
  const c = cam(f);
  return W / 2 + (x - c.cx) * c.k;
};

// ---- the Europeans: two fronts of three barbed arrows from the right --------
// (tip at the origin, pointing left; a filled head and a shaft tapering to
// nothing at the tail)
export const ARROW = { len: 260, half: 55, barb: 94, neck: 68, shaft: 7 };
const E = X_END;
export const GAP = 112; // where the leading arrow on the branch's line stops, short of the cap
const DRIFT = 2.4; // the ones on the axis never quite stop
const TOP = pchip([
  [96, E + GAP + 458],
  [114, E + GAP + 80],
  [122, E + GAP],
  [142, E + GAP],
]);
const BOT = pchip([
  [98, E + 442],
  [124, E - 130],
  [132, E - 250],
  [142, E - 250 - DRIFT * 10],
]);
// followers close up on the leader as the front arrives
const lag = (a: number, b: number, f0: number, f1: number) => (f: number) => a + (b - a) * smoothstep((f - f0) / (f1 - f0));
const TOP_LAG = [lag(0, 0, 0, 1), lag(238, 178, 108, 126), lag(262, 214, 110, 128)];
const BOT_LAG = [lag(0, 0, 0, 1), lag(232, 186, 112, 134), lag(270, 222, 112, 136)];
const DY = [0, -62, 60];
export const ARROWS: { y: number; tip: (f: number) => number; onAxis: boolean }[] = [
  ...TOP_LAG.map((l, i) => ({ y: Y_BRANCH + DY[i], onAxis: false, tip: (f: number) => TOP(f) + l(f) })),
  ...BOT_LAG.map((l, i) => ({ y: Y_AXIS + (i === 1 ? -58 : i === 2 ? 58 : 0), onAxis: true, tip: (f: number) => BOT(f) + l(f) })),
];
/** world x of the leading tip on the axis */
export const breakTip = (f: number) => BOT(f);
/** the frame on which the breaking front (just behind the barbs) passed world x; Infinity if not yet */
export const BREAK_BACK = 80;
export const breakFrameAt = (x: number, upTo: number) => {
  for (let f = 90; f <= upTo; f++) if (BOT(f) + BREAK_BACK <= x) return f;
  return Infinity;
};

export const T = {
  shimmer: [124, 146] as const,
};
