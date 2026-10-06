import { camFromTrack, clamp01, cumLen, glideTargetAt, pointAtLen, runFollower, smoothstep, toScreen } from "./chinatalkShared";
import type { Cam, Glide, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// howUsefulGeom -- the world, the clocks and the camera of HowUsefulRealWorld
// (Bharat "synthetic data needs real data", ChinaTalk, cut A). World px, y grows
// down. The synthetic block is centred on (0, 0); the real world (the big ring)
// is centred on (0, D) below it. Everything is a function of the local frame S
// (= edit frame - IN).
// ---------------------------------------------------------------------------

export const FPS = 24;
/** edit frame of the cut's first frame */
export const IN = 80;
export const DURATION = 175;

/** the cut's one stroke weight, world px at K_REF (~6 screen px at k 1.2) */
export const W = 5;

// --- the synthetic block: 6 x 5 seal squares written as a snake ---------------
export const SIDE = 30;
export const PITCH = 42;
export const COLS = 6;
export const ROWS = 5;
export const N_SQ = COLS * ROWS;
export const CORNER = 3;
const ROW_S = (COLS - 1) * PITCH + PITCH; // caret travel per row incl. the drop to the next
export type Cell = { x: number; y: number; row: number; j: number; s: number; dir: 1 | -1 };
export const CELLS: Cell[] = Array.from({ length: N_SQ }, (_, n) => {
  const row = Math.floor(n / COLS);
  const j = n % COLS;
  const dir: 1 | -1 = row % 2 === 0 ? 1 : -1;
  const col = dir === 1 ? j : COLS - 1 - j;
  return { x: (col - (COLS - 1) / 2) * PITCH, y: (row - (ROWS - 1) / 2) * PITCH, row, j, s: row * ROW_S + j * PITCH, dir };
});
export const BLOCK_HALF_W = ((COLS - 1) * PITCH + SIDE) / 2;
export const BLOCK_HALF_H = ((ROWS - 1) * PITCH + SIDE) / 2;
/** the caret's speed along the snake, world px / frame */
export const CARET_V = 17.4;
/** the frame the caret clears the last square (on "this") */
export const WRITE_END = 30;
const LAST = CELLS[N_SQ - 1];
const CARET_S_END = LAST.s + SIDE / 2;
/** caret arc length along the snake at S (valid for S <= WRITE_END) */
export const caretS = (S: number) => CARET_S_END - CARET_V * (WRITE_END - S);
export const caretPos = (S: number): Pt => {
  const s = Math.max(0, caretS(S));
  const row = Math.min(ROWS - 1, Math.floor(s / ROW_S));
  const within = s - row * ROW_S;
  const dir = row % 2 === 0 ? 1 : -1;
  const x0 = -dir * ((COLS - 1) / 2) * PITCH;
  const y = (row - (ROWS - 1) / 2) * PITCH;
  const run = (COLS - 1) * PITCH;
  if (row === ROWS - 1 || within <= run) return { x: x0 + dir * within, y };
  return { x: x0 + dir * run, y: y + (within - run) };
};
/** how much of square n the caret has laid down (0..1) */
export const squareWipe = (n: number, S: number) => clamp01((caretS(S) - (CELLS[n].s - SIDE / 2)) / SIDE);
/** the frame square n was completed */
export const squareDoneS = (n: number) => WRITE_END - (CARET_S_END - (CELLS[n].s + SIDE / 2)) / CARET_V;

// --- the real world: one big ring, three domains inside ------------------------
export const D = 880;
export const R = 350;
// --- the camera: creep, one long travel (zoom-out leading), a decaying creep ----
export const CAM_START: Cam = { x: 0, y: -14, k: 2.58 };
export const LOOK_END_Y = D + 14;
export const GLIDES: Glide[] = [
  // "How useful is this": slow creep in on the block being written
  { f0: -14, f1: 18, k: 2.64 },
  // "for the sort of": the pull-back leads ...
  { f0: 14, f1: 48, k: 1.2 },
  // ... and the camera travels down the dashed path to the real world
  { f0: 26, f1: 76, dy: LOOK_END_Y - CAM_START.y, even: 0.46 },
  // the hold: a slow creep that decays into the last frame
  { f0: 112, f1: 205, k: 1.24, dy: -2 },
];
export const camTargetAt = (f: number) => glideTargetAt(CAM_START, GLIDES, f);
const CAM_F0 = -14;
const TRACK = runFollower(camTargetAt, CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (the final framing) */
export const REST_CAM: Cam = TRACK.cams[TRACK.cams.length - 1];

export const DOMAIN_R = [80, 53, 26];
export type Domain = { name: string; x: number; y: number; phi: number };
/** one row on the ring's centre line, in spoken order; phi = clockwise angle
 *  from the top of the big ring (deg) of the rim point where the bead lights it */
export const DOMAIN_X = 225;
export const DOMAIN_Y = D - 35;
export const DOMAINS: Domain[] = [
  { name: "TARGETING", x: -DOMAIN_X, y: DOMAIN_Y, phi: -90 },
  { name: "AUTONOMY", x: 0, y: DOMAIN_Y, phi: 180 },
  { name: "PHYSICAL", x: DOMAIN_X, y: DOMAIN_Y, phi: 90 },
];
export const DOMAIN_LABEL_DY = DOMAIN_R[0] + 27;

// the ring is written counter-clockwise by one ink bead, from RING_PHI0
export const RING_PHI0 = 50;
export const RING_S0 = 32;
/** deg / frame (42 screen px / frame at k 1.2) */
export const RING_W = 5.75;
export const RING_S1 = RING_S0 + 360 / RING_W;
const RING_N = 240;
export const ringPoint = (phiDeg: number, r = R): Pt => {
  const a = (phiDeg * Math.PI) / 180;
  return { x: r * Math.sin(a), y: D - r * Math.cos(a) };
};
export const RING_PTS: Pt[] = Array.from({ length: RING_N + 1 }, (_, i) => ringPoint(RING_PHI0 - (360 * i) / RING_N));
export const RING_LEN = 2 * Math.PI * R;
export const ringLen = (S: number) => RING_LEN * clamp01((S - RING_S0) / (RING_S1 - RING_S0));
export const ringReachS = (s: number) => RING_S0 + (s / RING_LEN) * (RING_S1 - RING_S0);
/** the frame the bead passes a domain (ccw distance from RING_PHI0) */
export const passS = (d: Domain) => {
  let delta = RING_PHI0 - d.phi;
  while (delta < 0) delta += 360;
  while (delta >= 360) delta -= 360;
  return RING_S0 + delta / RING_W;
};
export const DOMAIN_SWEEP_F = 16;
export const DOMAIN_STAGGER_F = 3;

// --- the dashed path: out of the last square, a hook back under the block, down ---
/** where the waiting squares sit: just outside the rim */
export const RIM_R = R + SIDE / 2 + 9;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n: number): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
const PATH_HEAD: Pt[] = [{ x: 0, y: BLOCK_HALF_H }];
export const PATH_END: Pt = { x: 0, y: D - RIM_R };
export const PATH_PTS: Pt[] = [...PATH_HEAD, PATH_END];
export const PATH_CUM = cumLen(PATH_PTS);
export const PATH_LEN = PATH_CUM[PATH_CUM.length - 1];
/** a new bead leaves the block's bottom-centre just after the last square */
export const PATH_S0 = WRITE_END + 2;
/** the head may not cross the screen faster than this (screen px / frame) */
const HEAD_CAP = 42;
const HEAD_ACC = 2.4;
/** Head arc length per integer frame from PATH_S0: it leaves at the caret's
 *  speed and runs as fast as the screen-speed cap allows under the travelling
 *  camera, then decelerates into the rim. */
const HEAD_TRACK: number[] = (() => {
  const out = [0];
  let s = 0;
  let v = 0;
  for (let f = PATH_S0; f < DURATION + 2; f++) {
    const c0 = camAt(f);
    const c1 = camAt(f + 1);
    const a = pointAtLen(PATH_PTS, PATH_CUM, s);
    const a0 = toScreen(c0, a.x, a.y);
    const hi = Math.min(v + HEAD_ACC, 34, Math.sqrt(2 * HEAD_ACC * Math.max(0, PATH_LEN - s)) + 0.4);
    const lo = Math.max(0, v - HEAD_ACC);
    let best = lo;
    let bestD = Infinity;
    let pick = -1;
    for (let i = 0; i <= 24; i++) {
      const ds = lo + ((hi - lo) * i) / 24;
      const b = pointAtLen(PATH_PTS, PATH_CUM, s + ds);
      const b1 = toScreen(c1, b.x, b.y);
      const d = Math.hypot(b1.x - a0.x, b1.y - a0.y);
      if (d <= HEAD_CAP) pick = ds;
      if (d < bestD) {
        bestD = d;
        best = ds;
      }
    }
    const ds = pick >= 0 ? pick : best;
    v = ds;
    s = Math.min(PATH_LEN, s + ds);
    out.push(s);
  }
  return out;
})();
export const pathLen = (S: number) => {
  const t = Math.max(0, Math.min(HEAD_TRACK.length - 1, S - PATH_S0));
  const i = Math.min(HEAD_TRACK.length - 2, Math.floor(t));
  return HEAD_TRACK[i] + (HEAD_TRACK[i + 1] - HEAD_TRACK[i]) * (t - i);
};
/** the frame the head reaches the rim */
export const PATH_S1 = PATH_S0 + HEAD_TRACK.findIndex((x) => x >= PATH_LEN - 0.5);
/** the caret bead (fades as it clears the last square) */
export const caretOpacity = (S: number) => 1 - smoothstep((S - WRITE_END) / 3);
/** the dashed line's head bead */
export const headPos = (S: number): Pt => pointAtLen(PATH_PTS, PATH_CUM, pathLen(S));
export const headOpacity = (S: number) => smoothstep((S - PATH_S0) / 3) * (1 - smoothstep((S - (PATH_S1 - 3)) / 9));

// --- the file of seven squares that travels the path and collects on the rim ---
export const N_FILE = 7;
/** rim slot of the k-th square in the file (outermost first, alternating sides) */
export const FILE_SLOT = [-3, 3, -2, 2, -1, 1, 0];
/** the seven rim slots are spread so the outer ones sit straight above the outer domains */
export const SLOT_DEG = ((Math.asin(DOMAIN_X / RIM_R) * 180) / Math.PI) / 3;
const FILLET = 22;
export const FILE_V = 22;
const FILE_GAP = 60;
const FILE_DECEL_F = 10;
export const FILE_ARRIVE0 = 112;
type Route = { pts: Pt[]; cum: number[]; len: number; sFillet: number; sArc: number; slot: number };
const filletDeg = (Math.asin(FILLET / RIM_R) * 180) / Math.PI;
export const ROUTES: Route[] = FILE_SLOT.map((slot) => {
  if (slot === 0) {
    const cum = PATH_CUM;
    return { pts: PATH_PTS, cum, len: PATH_LEN, sFillet: PATH_LEN, sArc: PATH_LEN, slot };
  }
  const sg = Math.sign(slot);
  const yTop = PATH_END.y - FILLET;
  const fil = arc(sg * FILLET, yTop, FILLET, sg > 0 ? Math.PI : 0, Math.PI / 2, 10);
  const n = Math.max(2, Math.round(Math.abs(slot) * 6));
  const rim: Pt[] = Array.from({ length: n + 1 }, (_, i) => ringPoint(sg * (filletDeg + ((Math.abs(slot) * SLOT_DEG - filletDeg) * i) / n), RIM_R));
  const pts = [...PATH_HEAD, { x: 0, y: yTop }, ...fil.slice(1, -1), ...rim];
  const cum = cumLen(pts);
  const sFillet = cum[PATH_HEAD.length];
  const sArc = cum[PATH_HEAD.length + fil.length - 2];
  return { pts, cum, len: cum[cum.length - 1], sFillet, sArc, slot };
});
/** arrival frames: an evenly spaced file (FILE_GAP apart) on the common path */
export const FILE_ARRIVE = ROUTES.map((r, i) => FILE_ARRIVE0 + (i * FILE_GAP + r.len - ROUTES[0].len) / FILE_V);
export const FILE_LAST = Math.max(...FILE_ARRIVE);
const toGo = (tau: number) => (tau >= FILE_DECEL_F ? FILE_V * (tau - FILE_DECEL_F / 2) : (FILE_V * tau * tau) / (2 * FILE_DECEL_F));
/** the waiting squares gently ride the rim (deg) */
export const rideDeg = (S: number) => 1.3 * Math.sin((S - FILE_LAST) / 13) * smoothstep((S - FILE_LAST) / 20);
/** position + rotation (deg) of the i-th square of the file, or null before it leaves */
export const fileSquare = (i: number, S: number): { x: number; y: number; rot: number } | null => {
  const r = ROUTES[i];
  const tau = FILE_ARRIVE[i] - S;
  if (tau <= 0) {
    const phi = r.slot * SLOT_DEG + rideDeg(S);
    const p = ringPoint(phi, RIM_R);
    return { x: p.x, y: p.y, rot: phi };
  }
  const s = r.len - toGo(tau);
  if (s < 0) return null;
  const p = pointAtLen(r.pts, r.cum, s);
  let rot = 0;
  if (r.slot !== 0 && s > r.sFillet) {
    const sg = Math.sign(r.slot);
    rot = s < r.sArc ? sg * filletDeg * ((s - r.sFillet) / (r.sArc - r.sFillet)) : (Math.atan2(p.x, D - p.y) * 180) / Math.PI;
  }
  return { x: p.x, y: p.y, rot };
};

// --- the three dashed links: straight down from the rim squares, stopping short ---
export const LINK_S0 = 134;
/** 24 screen px above each domain's outer ring */
const LINK_SHORT = 20;
export type Link = { slot: number; domain: number; s0: number; f: number };
export const LINKS: Link[] = [
  { slot: -3, domain: 0, s0: LINK_S0, f: 22 },
  { slot: 0, domain: 1, s0: LINK_S0 + 5, f: 28 },
  { slot: 3, domain: 2, s0: LINK_S0 + 10, f: 22 },
];
export const linkPts = (l: Link): Pt[] => {
  const a = ringPoint(l.slot * SLOT_DEG, RIM_R);
  const d = DOMAINS[l.domain];
  return [a, { x: d.x, y: d.y - DOMAIN_R[0] - LINK_SHORT }];
};
/** head-first growth: a soft start, a long deceleration into the open end */
export const linkDraw = (l: Link, S: number) => {
  const u = clamp01((S - l.s0) / l.f);
  return 1 - Math.pow(1 - smoothstep(Math.pow(u, 0.8)), 1.6);
};

// --- labels ---------------------------------------------------------------------
export const SYNTH_LABEL_Y = -BLOCK_HALF_H - 30;
export const SYNTH_LABEL_S = 28;
export const REAL_LABEL_Y = D + R + 48;
export const REAL_LABEL_S = 107;
export const DOMAIN_LABEL_LAND = [62, 76, 95];
export const LABEL_MIN_PX = 40;
export const REAL_MIN_PX = 50;

