// ---------------------------------------------------------------------------
// EightCompaniesTwentyRobots — the plan (pure data, no React): the camera, and
// who rises when. Imported by the cut; also run by bun for the numbers in the
// cut's header. World px are cut 16's field layout (superpowerField.tsx): at
// the resolved frame the camera is k ~1 at (540, 960), so world = screen.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 115;

const W = 1080;
const H = 1920;

// -- the layout (mirrors superpowerField's BRAIN_ROW / ROBOT_ROWS; asserted
//    equal in the cut at module load) ----------------------------------------
export const P_BRAIN = { n: 8, size: 112, pitch: 122, cx: 540, ruleY: 410, first: 3, hRatio: 1.15 };
export const P_ROBOT = { cols: 10, size: 84, pitch: 96, cx: 540, ruleYs: [720, 1040], first: 4, hRatio: 207 / 86 };
const brainX = (i: number) => P_BRAIN.cx + (i - (P_BRAIN.n - 1) / 2) * P_BRAIN.pitch;
const robotX = (c: number) => P_ROBOT.cx + (c - (P_ROBOT.cols - 1) / 2) * P_ROBOT.pitch;
const BRAIN_H = P_BRAIN.size * P_BRAIN.hRatio;
const ROBOT_H = P_ROBOT.size * P_ROBOT.hRatio;
const BRAIN_FY = P_BRAIN.ruleY - BRAIN_H / 2; // the brain glyph's centre
const ROBOT0_FY = P_ROBOT.ruleYs[0] - ROBOT_H / 2; // the first robot's centre

// -- the camera -------------------------------------------------------------------
// One coarse target track, followed by the house damper (CAM_STIFF 0.09 /
// CAM_DAMP 0.468), run from a pre-roll at f-PRE so the camera is ALREADY
// pulling back at f0. Four moves, each overlapping the next:
//   A  the pull-back f-PRE..A_END: log k on an S-curve from K_PRE to 1.0; the
//      focus slides from the first brain to the row's middle; the brain
//      glyph's centre goes from screen y SY_A0 to SY_A1.
//   B  the tilt down with a push in, B0..B1: cy runs down to put the first
//      robot's centre on screen y SY_B and k rises to K_B, so it reads big on
//      "humanoid" (f66).
//   C  the pull-back to the resolved frame, C0..C1: k back to K_C at (540, 960)
//      while the copies rise.
//   D  the creep, C1..end: log k at one steady rate to K_END.
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;
const PRE = 14;
const K_PRE = 4.6;
const A_END = 36;
const A_POW = 1.25;
const K_A = 1.0;
const SY_A0 = 720;
const SY_A1 = 760;
const B0 = 34;
const B1 = 58;
const K_B = 1.1;
const SY_B = 830;
const C0 = 57;
const C1 = 80;
const K_C = 0.99;
const K_END = 1.03;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};

/** the target (undamped) camera at frame f (may be negative: the pre-roll) */
export const cameraTarget = (f: number) => {
  const eA = smooth(Math.pow(clamp01((f + PRE) / (A_END + PRE)), A_POW));
  const logkA = Math.log(K_PRE) + (Math.log(K_A) - Math.log(K_PRE)) * eA;
  const kA = Math.exp(logkA);
  const sy = SY_A0 + (SY_A1 - SY_A0) * eA;
  const fx = brainX(P_BRAIN.first) + (P_BRAIN.cx - brainX(P_BRAIN.first)) * smooth((f + 4) / (A_END + 4));
  const cyA = BRAIN_FY - (sy - H / 2) / kA;
  const cyAEnd = BRAIN_FY - (SY_A1 - H / 2) / K_A;
  const cyB = ROBOT0_FY - (SY_B - H / 2) / K_B;
  const eB = smooth((f - B0) / (B1 - B0));
  const eC = smooth((f - C0) / (C1 - C0));
  const cy = cyA + (cyB - cyAEnd) * eB + (H / 2 - cyB) * eC;
  let logk = logkA + (Math.log(K_B) - Math.log(K_A)) * eB + (Math.log(K_C) - Math.log(K_B)) * eC;
  if (f > C1) logk += ((Math.log(K_END) - Math.log(K_C)) * (f - C1)) / (DURATION - 1 - C1);
  return { cx: fx, cy, k: Math.exp(logk) };
};

const CAM: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  const t0 = cameraTarget(-PRE);
  let { cx, cy } = t0;
  let lk = Math.log(t0.k);
  let vx = 0;
  let vy = 0;
  let vk = 0;
  for (let f = -PRE + 1; f <= DURATION + 1; f++) {
    const t = cameraTarget(f);
    vx += (t.cx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (t.cy - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (Math.log(t.k) - lk) * CAM_STIFF - vk * CAM_DAMP;
    lk += vk;
    if (f >= 0) out.push({ cx, cy, k: Math.exp(lk) });
  }
  return out;
})();

/** the damped camera at frame f (fractional frames interpolate) */
export const cameraAt = (f: number) => {
  const i = Math.max(0, Math.min(CAM.length - 2, Math.floor(f)));
  const t = Math.max(0, Math.min(1, f - i));
  const a = CAM[i];
  const b = CAM[i + 1];
  return { cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, k: a.k * Math.pow(b.k / a.k, t) };
};

/** where a world point lands on screen at frame f (no sway) */
export const toScreen = (f: number, x: number, y: number) => {
  const c = cameraAt(f);
  return { x: W / 2 + (x - c.cx) * c.k, y: H / 2 + (y - c.cy) * c.k };
};

// -- the rises ------------------------------------------------------------------
/** The seven brain copies, outward from the first one (slot 3), alternating
 *  right / left. Each rises as the pull-back brings its slot in: on the first
 *  frame its middle is REVEAL_IN px inside the frame edge, and never sooner
 *  than BRAIN_F0 + n * BRAIN_GAP (so they stay a sweep, not a burst). */
export const BRAIN_ORDER = [4, 2, 5, 1, 6, 0, 7];
const BRAIN_F0 = 8;
const BRAIN_GAP = 2;
const REVEAL_IN = 0;
const revealFrame = (x: number) => {
  for (let f = 0; f < DURATION; f += 0.25) {
    const sx = toScreen(f, x, 0).x;
    if (sx > REVEAL_IN && sx < W - REVEAL_IN) return f;
  }
  return DURATION;
};
const BRAIN_STARTS: number[] = (() => {
  const out = new Array<number>(P_BRAIN.n).fill(-Infinity);
  let prev = -Infinity;
  BRAIN_ORDER.forEach((slot, n) => {
    const s = Math.max(BRAIN_F0 + n * BRAIN_GAP, revealFrame(brainX(slot)), prev + 1);
    out[slot] = s;
    prev = s;
  });
  return out;
})();
/** the first one (slot 3) is there at f0: -Infinity */
export const brainStart = (slot: number) => BRAIN_STARTS[slot];

/** the first robot (row 0, slot 4): a plain rise, landed before "humanoid" f66 */
export const ROBOT0_F = 54;
/** the nineteen copies: row 0 outward from slot 4, then row 1 outward from its middle */
export const ROBOT_ORDER_ROW0 = [5, 3, 6, 2, 7, 1, 8, 0, 9];
export const ROBOT_ORDER_ROW1 = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
export const ROBOT_ROW0_F = [64, 73];
export const ROBOT_ROW1_F = [79, 88];
export const robotStart = (row: number, col: number) => {
  if (row === 0 && col === P_ROBOT.first) return ROBOT0_F;
  const order = row === 0 ? ROBOT_ORDER_ROW0 : ROBOT_ORDER_ROW1;
  const span = row === 0 ? ROBOT_ROW0_F : ROBOT_ROW1_F;
  const n = order.indexOf(col);
  return span[0] + ((span[1] - span[0]) * n) / (order.length - 1);
};
export const isCopy = (row: number, col: number) => !(row === 0 && col === P_ROBOT.first);

/** A row's rule exists only under what stands on it: it runs out from under
 *  the first glyph AS that glyph rises (from its start), and its ends run out to each new slot just before that glyph
 *  rises (up to RULE_LEAD frames, ease-out, never before the row's first glyph
 *  starts), so no line is drawn into emptiness or stands alone.
 *  `slots` = [x, start] for every glyph on the row; `half` = how far the
 *  rule reaches past a glyph's middle. Returns [x0, x1] (x0 === x1: none). */
const RULE_LEAD = 5;
export const ruleSpan = (f: number, slots: [number, number][], half: number): [number, number] => {
  const sorted = [...slots].sort((a, b) => a[1] - b[1]);
  const [x00, s00] = sorted[0];
  const p0 = Number.isFinite(s00) ? clamp01((f - (s00 - 0.5)) / (RULE_LEAD + 1)) : 1;
  const e = (p: number) => 1 - Math.pow(1 - p, 3);
  let x0 = x00 - half * e(p0);
  let x1 = x00 + half * e(p0);
  for (const [x, s] of sorted.slice(1)) {
    // never before the row's first glyph starts: no rule alone
    const a = Number.isFinite(s00) ? Math.max(s - RULE_LEAD, s00 - 1) : s - RULE_LEAD;
    const p = smooth((f - a) / Math.max(3, s + 1 - a));
    if (x - half < x0) x0 += (x - half - x0) * p;
    if (x + half > x1) x1 += (x + half - x1) * p;
  }
  return [x0, x1];
};

export const brainSlotX = brainX;
export const robotSlotX = robotX;
/** the paper's rest: the middle of the camera's travel */
export const PAPER_REST = { cx: 520, cy: 760 };
