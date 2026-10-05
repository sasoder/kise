import { clamp01, evenEase, glideTargetAt, runFollower, camFromTrack, shootEase, smoothstep } from "./chinatalkShared";
import type { Cam, Glide } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// largestCreditGeom -- the world, the clocks and the camera of
// LargestCreditExpansion (Logan Wright credit-boom clip, V2 cut 1). World px,
// y grows down, the shared baseline is y = 0, the table is centred on x = 0.
// Everything is a function of the local frame S (= edit frame - IN).
// ---------------------------------------------------------------------------

export const FPS = 24;
/** edit frame of "china" */
export const IN = 41;
/** "seen" ends at edit 156 -> local 115, + 16 f tail */
export const DURATION = 131;

/** world px per $T of credit added in the boom */
export const H_PER_T = 40;
export const PITCH = 160;
export const PILL_W = 56;
export const BASE_X0 = -360;
export const BASE_X1 = 360;
/** the baseline's ink weight (world px at K_REF; ~7 screen px, director note) */
export const BASE_W = 5.8;
/** caps centre of the country labels, world px under the baseline */
export const LABEL_Y = 40;
/** screen floor of the country labels */
export const LABEL_MIN_PX = 40;

export type Country = { name: string; t: number; x: number; start: number; dur: number };
/** The four ink booms: one soft wave left -> right (hashed offsets inside it). */
export const INK_COUNTRIES: Country[] = [
  { name: "JAPAN", t: 1.7, x: -2 * PITCH, start: 20, dur: 13 },
  { name: "SPAIN", t: 2.0, x: -PITCH, start: 24, dur: 13 },
  { name: "UK", t: 2.6, x: 0, start: 27.5, dur: 14 },
  { name: "US", t: 13, x: PITCH, start: 31, dur: 24 },
];
export const CHINA = { name: "CHINA", t: 25, x: 2 * PITCH };
export const CHINA_H = CHINA.t * H_PER_T;

// --- the baseline: written left -> right in wet ink, already moving at S 0 ---
export const BASE_S0 = -30;
export const BASE_S1 = 12;
export const baseProgress = (S: number) => evenEase((S - BASE_S0) / (BASE_S1 - BASE_S0), 0.45);
/** the S at which the baseline's tip reached arc length s */
export const baseReachS = (s: number) => {
  const target = s / (BASE_X1 - BASE_X0);
  let lo = BASE_S0;
  let hi = BASE_S1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (baseProgress(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

// --- the flag lands on "china" at the China slot ---
export const FLAG_W = 120;
export const FLAG_H = (FLAG_W * 2) / 3;
export const FLAG_GAP = 14;
export const FLAG_ENTER_S = -3;
export const CHINA_LABEL_S = 1;

// --- China's red pill shoots up: launch S 47, settles ~S 104 ---
export const SHOOT_S0 = 45;
export const SHOOT_F = 60;
export const chinaH = (S: number) => CHINA_H * shootEase((S - SHOOT_S0) / SHOOT_F);
/** world px / frame of the red tip */
export const chinaV = (S: number) => {
  const u = (S - SHOOT_S0) / SHOOT_F;
  if (u <= 0 || u >= 1) return 0;
  return (12 * u * (1 - u) * (1 - u) * CHINA_H) / SHOOT_F;
};
/** the S at which the red tip reached height hh */
export const chinaReachS = (hh: number) => {
  const target = hh / CHINA_H;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (shootEase(mid) < target) lo = mid;
    else hi = mid;
  }
  return SHOOT_S0 + SHOOT_F * ((lo + hi) / 2);
};

// --- the travelling highlight in the hold ---
export const HI_S0 = 98;
export const HI_S1 = 127;
export const HI_Y0 = -90;
export const HI_Y1 = -CHINA_H + 20;
export const highlightAt = (S: number) => {
  const u = (S - HI_S0) / (HI_S1 - HI_S0);
  if (u <= 0 || u >= 1) return null;
  const y = HI_Y0 + (HI_Y1 - HI_Y0) * evenEase(u, 0.25);
  const op = smoothstep(u / 0.15) * (1 - smoothstep((u - 0.75) / 0.25));
  return { y, op };
};

// --- the camera: three long glides + a decaying creep, one damped follower ---
export const CAM_START: Cam = { x: 200, y: -25, k: 1.62 };
export const GLIDES: Glide[] = [
  // "china ... largest single country": open on the baseline + flag, tilt up with the rising wave
  { f0: -16, f1: 38, dx: -200, dy: -207, k: 1.27 },
  // "credit expansion": push in on the US top as the red pill shoots past it, tilting up after it;
  // it crests early (warp 0.85) and blends into the pull-back, so the turn is one C1 move
  { f0: 42, f1: 74, dx: 235, dy: -170, k: 1.8, warp: 0.85 },
  // "that the world has seen": one long pull-back (starting under the push-in), the whole table re-enters
  { f0: 68, f1: 108, dx: -235, dy: -75, k: 1.0, warp: 1.3 },
  // the hold: a slow creep that decays into the last frame
  { f0: 92, f1: 140, dy: -8, k: 1.025 },
];
export const camTargetAt = (f: number) => glideTargetAt(CAM_START, GLIDES, f);
const CAM_F0 = -16;
const TRACK = runFollower(camTargetAt, CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (the final framing) */
export const REST_CAM: Cam = TRACK.cams[TRACK.cams.length - 1];

export const pillReveal = (c: Country, S: number) => clamp01((S - c.start) / c.dur);
