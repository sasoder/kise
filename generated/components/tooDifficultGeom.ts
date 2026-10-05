// ---------------------------------------------------------------------------
// tooDifficultGeom — the world, the clocks and the camera of TooDifficultToShutDown
// (Logan Wright credit-boom V2, cut 4). Pure maths, no React, so it can be
// checked from a script. All coordinates are WORLD px (y grows down); f is the
// cut's local frame (0 = "growth").
// ---------------------------------------------------------------------------
import {
  type Cam,
  type Glide,
  type Pt,
  camFromTrack,
  clamp01,
  easeInOutCubic,
  glideTargetAt,
  hash01,
  runFollower,
  shootEase,
  smoothstep,
} from "./chinatalkShared";

export const FPS = 24;
export const IN = 794;
/** last word "down" ends at S 948 -> 154 + 28-frame tail */
export const DURATION = 182;

// --- the growth line ---------------------------------------------------------
/** the line's first point (x) and the x where its shape function ends */
export const LINE_X0 = 200;
export const LINE_X1 = 860;
const LINE_Y0 = 1010;
const LINE_RISE = 440;
/** the growth line's stroke (world px at K_REF, through the size law) */
export const LINE_W = 6.2;
/** the hand stroke (a solid ink line, ~7 screen px) */
export const HAND_W = 6;
/** the dashed projection stroke (~6 screen px) */
export const DASH_W = 5.1;
/** The line's resting height at x: a gently accelerating rise with a faint
 *  hand-written undulation (strong growth, not a ruler). */
export const baseY = (x: number) => {
  const u = (x - LINE_X0) / (LINE_X1 - LINE_X0);
  const wob = 4 * Math.sin(u * 9.1 + 0.6) * Math.min(1, u * 4);
  return LINE_Y0 - LINE_RISE * (0.5 * u + 0.5 * u * u) + wob;
};

// --- the colonnade -----------------------------------------------------------
export const GROUND_Y = 1200;
export const GROUND_X0 = 252;
export const GROUND_X1 = 828;
export const PILLAR_X = [310, 425, 540, 655, 770];
export const MID = 2;
/** a pillar's width (a slim pill) */
/** an investment BLOCK: a wide pill (~48 screen px at the final framing) */
export const PILLAR_W = 42;
/** rise start per pillar: one wave left -> right with hashed offsets */
export const PILLAR_RISE0 = PILLAR_X.map((_, i) => 33 + i * 4.7 + (hash01(i + 3, 7) - 0.5) * 2.6);
export const PILLAR_RISE_F = 17;
export const pillarRise = (f: number, i: number) => shootEase((f - PILLAR_RISE0[i]) / PILLAR_RISE_F);
export const GROUND_F0 = 22;
export const GROUND_F = 16;
export const LABEL_Y = GROUND_Y + 112;
export const LABEL_WORD_F = 55;

// --- the pull ----------------------------------------------------------------
/** how far the middle pillar is slid out (down-left, toward the hand) */
export const PULL_DX = -10;
export const PULL_DY = 80;
/** the line sags into the gap (soft-min of the pillar drop, ~56 world px at full pull) */
const SAG_A = 105;
export const SAG_HALF = 115;
/** pull 0..1: out on "shut down" (136-154), a held stop, then eased back in */
export const PULL_F0 = 135;
export const PULL_F1 = 154;
export const BACK_F0 = 159;
export const BACK_F1 = 179;
export const pullAt = (f: number) => {
  if (f < BACK_F0) return easeInOutCubic((f - PULL_F0) / (PULL_F1 - PULL_F0));
  return 1 - easeInOutCubic((f - BACK_F0) / (BACK_F1 - BACK_F0));
};
export const sagAt = (f: number) => {
  const drop = PULL_DY * pullAt(f);
  return SAG_A * (1 - Math.exp(-drop / SAG_A));
};
/** the sag profile: one soft droop spanning the whole gap between the
 *  neighbouring pillars (a beam losing its middle support: a full parabolic
 *  belly, 0 at pillars 2 and 4, deepest over the middle one) */
export const sagBump = (x: number) => {
  const d = Math.abs(x - PILLAR_X[MID]) / SAG_HALF;
  return d >= 1 ? 0 : 1 - d * d;
};
export const lineY = (x: number, f: number) => baseY(x) + sagAt(f) * sagBump(x);

// --- the tip clock -----------------------------------------------------------
/** The tip's x per frame: a confident write already a third done at f0 (velocity
 *  bell peaking ~f10) on top
 *  of a slow inch that never stops. Integrated from f = -12. */
const TIP_F0 = -32;
const TIP_X_AT_F0 = 186;
const INCH = 0.62;
const WRITE_VP = 11.2;
const bell = (f: number) => {
  const u = (f + 30) / 80;
  return u <= 0 || u >= 1 ? 0 : Math.pow(Math.sin(Math.PI * u), 2);
};
const TIP_TABLE: number[] = (() => {
  const out: number[] = [];
  let x = TIP_X_AT_F0;
  for (let f = TIP_F0; f <= DURATION + 2; f++) {
    out.push(x);
    x += INCH + WRITE_VP * bell(f + 0.5);
  }
  // shift so that the tip is exactly LINE_X0 + 230 at f0 (a third of the line already written)
  const off = LINE_X0 + 230 - out[-TIP_F0];
  return out.map((v) => v + off);
})();
export const tipX = (f: number) => {
  const t = Math.max(0, Math.min(TIP_TABLE.length - 1.001, f - TIP_F0));
  const i = Math.floor(t);
  return TIP_TABLE[i] + (TIP_TABLE[i + 1] - TIP_TABLE[i]) * (t - i);
};
/** the (fractional) frame at which the tip passed x */
export const fAtX = (x: number) => {
  if (x <= TIP_TABLE[0]) return TIP_F0;
  let lo = 0;
  let hi = TIP_TABLE.length - 1;
  if (x >= TIP_TABLE[hi]) return TIP_F0 + hi;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (TIP_TABLE[m] <= x) lo = m;
    else hi = m;
  }
  return TIP_F0 + lo + (x - TIP_TABLE[lo]) / (TIP_TABLE[hi] - TIP_TABLE[lo]);
};
/** the drawn line at frame f as a polyline (deformed by the sag) */
export const linePoints = (f: number): Pt[] => {
  const xt = tipX(f);
  const pts: Pt[] = [];
  for (let x = LINE_X0; x < xt - 0.5; x += 5) pts.push({ x, y: lineY(x, f) });
  pts.push({ x: xt, y: lineY(xt, f) });
  return pts;
};

// --- the dashed projection (the collapse that would follow) -----------------
export const DASH_F0 = 139;
export const DASH_F = 19;
export const DASH_DIFF_F0 = 160;
export const DASH_DIFF_F = 21;
/** a steep fall ahead of the tip: quadratic, leaving along the line's tangent */
export const dashPoints = (f: number): Pt[] => {
  const tx = tipX(f);
  const ty = lineY(tx, f);
  const p1 = { x: tx + 38, y: ty - 13 };
  const p2 = { x: tx + 58, y: ty + 310 };
  const pts: Pt[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const a = (1 - t) * (1 - t);
    const b = 2 * t * (1 - t);
    const c = t * t;
    pts.push({ x: a * tx + b * p1.x + c * p2.x, y: a * ty + b * p1.y + c * p2.y });
  }
  return pts;
};
export const dashDraw = (f: number) => {
  const u = clamp01((f - DASH_F0) / DASH_F);
  // falls: starts gently, accelerates, lands softly
  return easeInOutCubic(u);
};

// --- the hand ----------------------------------------------------------------
/** grip point on the middle pillar (the hand's local origin) */
export const GRIP = { x: PILLAR_X[MID], y: 1076 };
export const HAND_F0 = 98;
export const HAND_F1 = 128;
export const HAND_FROM = { x: -70, y: 1108 };
export const GRIP_F0 = 123;
export const GRIP_F = 13;
export const handPos = (f: number): Pt => {
  const u = smoothstep((f - HAND_F0) / (HAND_F1 - HAND_F0));
  // a slight rising arc into the grip
  const x = HAND_FROM.x + (GRIP.x - HAND_FROM.x) * u;
  const y = HAND_FROM.y + (GRIP.y - HAND_FROM.y) * Math.pow(u, 0.8);
  const p = pullAt(f);
  return { x: x + PULL_DX * p, y: y + PULL_DY * p };
};
export const gripAt = (f: number) => smoothstep((f - GRIP_F0) / GRIP_F);

// --- the camera --------------------------------------------------------------
/** LOOK (content centre, lands at screen y 835) at the start of the track */
export const CAM_F0 = -12;
export const LOOK_START: Cam = { x: 372, y: 930, k: 2.05 };
export const GLIDES: Glide[] = [
  // "growth was strong": ride the tip up-right
  { f0: -10, f1: 46, dx: 198, dy: -5, k: 1.4, warp: 0.8 },
  // "dependent upon investment": settle on line + colonnade, still close
  { f0: 32, f1: 76, dx: -8, dy: 18, k: 1.3 },
  // "and then it became too difficult": a long even creep toward the middle pillar
  { f0: 76, f1: 130, dx: -12, dy: 14, k: 1.34, even: 0.3 },
  // "shut down": the payoff wide, taking in the projected fall
  { f0: 132, f1: 172, dx: 20, dy: 8, k: 1.15 },
];
export const CAM_TRACK: Cam[] = runFollower((f) => glideTargetAt(LOOK_START, GLIDES, f), CAM_F0, DURATION + 1).cams;
export const camAt = camFromTrack(CAM_TRACK, CAM_F0);
/** the paper's parallax rest camera */
export const CAM_REST: Cam = camAt(76);
