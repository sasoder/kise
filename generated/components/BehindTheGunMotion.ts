// ---------------------------------------------------------------------------
// BehindTheGunMotion: the clocks of BehindTheGun (pure functions of the frame,
// no React): the camera (a coarse keyed track through a damped follow), the
// orange front that draws the organization upward, the barrel's elevation and
// the highlight that travels back down the links.
// World units == screen px in the settled frame (k 1, centre 540, 960).
// ---------------------------------------------------------------------------
export const FPS = 24000 / 1001;
export const DURATION = 162;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const lerpKeys = (keys: readonly (readonly [number, number])[], f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const [f0, v0] = keys[i - 1];
      const [f1, v1] = keys[i];
      return v0 + ((f - f0) / (f1 - f0)) * (v1 - v0);
    }
  }
  return keys[keys.length - 1][1];
};

// --- the camera -------------------------------------------------------------
// Coarse keys (frame, value); log-zoom and the centre's y are each followed by
// a two-stage damped follower, so the track never pops and never stops dead.
export const K_KEYS: readonly (readonly [number, number])[] = [
  [-40, 1.5],
  [-8, 1.5],
  [31, 2.04], // the push on the gun as it rolls into action ("advantages in technology")
  [84, 1.07], // the long pull-back and tilt up, easing out from ~f42, ahead of "but"
  [126, 1.0],
  [175, 1.03], // the settled creep in
];
export const CY_KEYS: readonly (readonly [number, number])[] = [
  [-40, 1668],
  [30, 1668],
  [80, 985],
  [124, 955],
  [175, 955],
];
const TAU = 5.5; // frames, per stage
const SUB = 4;
const F_START = -40;
const buildTrack = (keys: readonly (readonly [number, number])[], map: (v: number) => number) => {
  const out: number[] = [];
  let a = map(lerpKeys(keys, F_START));
  let b = a;
  const al = 1 - Math.exp(-1 / (TAU * SUB));
  for (let i = 0; i <= (DURATION + 2 - F_START) * SUB; i++) {
    const f = F_START + i / SUB;
    const t = map(lerpKeys(keys, f));
    a += (t - a) * al;
    b += (a - b) * al;
    if (i % SUB === 0) out.push(b);
  }
  return out;
};
const LOGK = buildTrack(K_KEYS, Math.log);
const CY = buildTrack(CY_KEYS, (v) => v);
const sample = (track: number[], f: number) => {
  const p = Math.max(0, Math.min(track.length - 1.001, f - F_START));
  const i = Math.floor(p);
  return track[i] + (track[i + 1] - track[i]) * (p - i);
};
export type Cam = { k: number; cx: number; cy: number };
export const cameraAt = (f: number): Cam => ({ k: Math.exp(sample(LOGK, f)), cx: 540, cy: sample(CY, f) });

// --- the orange front (world y; everything orange below it is drawn) ---------
export const FRONT_START = 55; // "but"
export const FRONT_TABLE = 102; // "governance": the front reaches the board table
export const FRONT_END = 134; // the table is whole before "organization" (f140)
export const Y_FRONT_0 = 1600;
export const Y_FRONT_TABLE = 545;
export const Y_FRONT_1 = 150;
export const frontY = (f: number) => {
  if (f <= FRONT_START) return Y_FRONT_0 + 60;
  if (f <= FRONT_TABLE) {
    // a short ease in, then an even climb
    const u = (f - FRONT_START) / (FRONT_TABLE - FRONT_START);
    const e = u < 0.15 ? (u * u) / 0.3 : u - 0.075;
    return Y_FRONT_0 + (e / 0.925) * (Y_FRONT_TABLE - Y_FRONT_0);
  }
  const u = clamp01((f - FRONT_TABLE) / (FRONT_END - FRONT_TABLE));
  return Y_FRONT_TABLE + (1 - Math.pow(1 - u, 1.7)) * (Y_FRONT_1 - Y_FRONT_TABLE);
};

// --- the gun is brought into action: it rolls right to its rest position ------
export const ROLL_END = 34;
export const ROLL_DIST = 100; // world px left of rest at f0 (~160 px on screen)
/** the gun's offset from rest (world px, - = left); the wheels turn by offset / radius */
export const gunDx = (f: number) => -ROLL_DIST * Math.pow(1 - clamp01(f / ROLL_END), 2.4);

// --- the barrel: one slow elevation as the gun comes to rest ------------------
export const barrelDeg = (f: number) => 2 - 9 * smooth((f - 14) / 32); // + = muzzle down

// --- the highlight that travels down the links in the settled frame ----------
export const SHIMMER = [132, 166] as const;
export const shimmerAt = (f: number) => {
  const t = clamp01((f - SHIMMER[0]) / (SHIMMER[1] - SHIMMER[0]));
  return { y: 430 + t * (1640 - 430), op: Math.sin(Math.PI * Math.min(1, t * 1.15)) };
};

// --- the figures: each appears WHOLE as the front reaches its feet ------------
/** the frame at which the front reaches world y (quarter-frame scan) */
export const frontReaches = (y: number) => {
  for (let f = FRONT_START; f <= FRONT_END; f += 0.25) if (frontY(f) <= y) return f;
  return FRONT_END;
};
export const APPEAR_F = 8;
/** 0..1, eased out (no bounce), over APPEAR_F frames from t0 */
export const appearAt = (f: number, t0: number) => 1 - Math.pow(1 - clamp01((f - t0) / APPEAR_F), 3);
