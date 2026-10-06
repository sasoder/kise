import { camFromTrack, clamp01, glideTargetAt, runFollower, smoothstep } from "./mavenKit";
import type { Cam, Glide, Pt } from "./mavenKit";

// ---------------------------------------------------------------------------
// keepCollectingGeom -- the world, the clocks and the camera of KeepCollecting
// (Bharat "Project Maven's data problem", V3 cut C). World px, y grows down, the
// ring is centred on (0, 0) (camera look (0, 0) at k 1 puts it at screen
// (540, 835)). Everything is a function of the local frame f (= seq frame - IN).
//
// THE SCHEDULE (one consistent clock):
//   lap LAP = 44 f with TWO wet heads opposite each other, so a head passes the
//   TOP of the ring every PASS = 22 f, at f = 12 + 22 n (-32, -10, 12, 34, 56,
//   78, 100, 122), and releases a slab there; every slab falls for FALL = 13 f
//   and lands at f = -19, 3, 25, 47 (ink) · 69 ("relevant"), 91, 113 (vermilion)
//   · (135). The cycle has been running before the cut: the ring is closed at
//   f 0, one ink slab is seated and the second is falling.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = 686;
export const DURATION = 133;

// --- the ring -----------------------------------------------------------------
export const RING_R = 440;
export const LAP = 44;
/** a head passes the top every PASS frames */
export const PASS = 22;
export const TOP_F0 = 12;
/** clockwise angle from the top (radians) of the head at frame f */
export const headAngle = (f: number) => (2 * Math.PI * (f - TOP_F0)) / LAP;
export const ringPt = (a: number): Pt => ({ x: RING_R * Math.sin(a), y: -RING_R * Math.cos(a) });
/** the arc [a0, a1] (clockwise angles) as a polyline */
export const arcPts = (a0: number, a1: number, stepDeg = 2): Pt[] => {
  const n = Math.max(2, Math.ceil(((a1 - a0) * 180) / Math.PI / stepDeg));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(ringPt(a0 + ((a1 - a0) * i) / n));
  return pts;
};

// --- the stack ------------------------------------------------------------------
export const SLAB_W = 400;
export const SLAB_H = 70;
export const SLAB_GAP = 9;
/** the baseline the stack stands on */
export const BASE_Y = 298;
export const BASE_HALF = 270;
/** slabs in the stack when the model is built */
export const N_STACK = 7;
export const N_SLABS = N_STACK + 1;
/** ink (data) for the first four, vermilion (relevant data) from the fifth */
export const N_INK = 4;
export const FALL = 13;
export const OPEN_F = 6;
/** the model outline: gap from the slabs to its inside edge */
export const FRAME_GAP = 14;
export const releaseF = (i: number) => TOP_F0 + PASS * (i - 2);
export const landF = (i: number) => releaseF(i) + FALL;
/** the resting centre of slab i (the eighth rests on top of the model outline) */
export const slotY = (i: number, lw: number) =>
  i < N_STACK
    ? BASE_Y - SLAB_H / 2 - i * (SLAB_H + SLAB_GAP)
    : BASE_Y - N_STACK * (SLAB_H + SLAB_GAP) - FRAME_GAP - lw - 4 - SLAB_H / 2 + SLAB_GAP;
/** the fall: from rest at the head, one eased landing (no bounce) */
export const fallEase = (u: number) => smoothstep(Math.pow(clamp01(u), 1.15));
export const STACK_TOP = BASE_Y - N_STACK * SLAB_H - (N_STACK - 1) * SLAB_GAP;

// --- the model outline: an arch standing on the baseline, hugging the stack -----
export const FRAME_F0 = 111;
export const FRAME_F = 17;
export const FRAME_R = 30;
export const framePts = (lw: number): Pt[] => {
  const hw = SLAB_W / 2 + FRAME_GAP + lw / 2;
  const top = STACK_TOP - FRAME_GAP - lw / 2;
  const r = FRAME_R;
  const pts: Pt[] = [{ x: -hw, y: BASE_Y }];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI + (Math.PI / 2) * (i / N);
    pts.push({ x: -hw + r + r * Math.cos(a), y: top + r + r * Math.sin(a) });
  }
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / N);
    pts.push({ x: hw - r + r * Math.cos(a), y: top + r + r * Math.sin(a) });
  }
  pts.push({ x: hw, y: BASE_Y });
  return pts;
};

// --- labels (local word frames) ---------------------------------------------------
export const W_DATA = 42;
export const W_RELEVANT = 69;
export const W_MODEL = 119;

// --- the camera: open a little close and high on the ring, ease to the whole ring,
// then a slow creep in on the stack ---
export const CAM_START: Cam = { x: 0, y: -22, k: 1.08 };
export const GLIDES: Glide[] = [
  { f0: -6, f1: 38, dy: 22, k: 1.0 },
  { f0: 82, f1: 150, dy: 26, k: 1.055 },
];
export const camTargetAt = (f: number) => glideTargetAt(CAM_START, GLIDES, f);
const CAM_F0 = -6;
const TRACK = runFollower(camTargetAt, CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
export const REST_CAM: Cam = TRACK.cams[TRACK.cams.length - 1];
