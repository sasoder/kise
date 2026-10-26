// ---------------------------------------------------------------------------
// sixToolsPlan: the camera and the row of stations of SixOrSevenTools (kyle-vaccine, cut 1). Pure numbers.
// World: the kit's units (a man ~312 = 1.75 m, U = 178 per metre), X across, Y height (floor 0, up -), Z depth.
// The camera is one keyed track (k = zoom of the front plane, cx / cy = the world point at the frame's middle) on a
// londonDepth perspective whose zoom is ALL dolly (DEPTH.dolly 1): the eye travels from ~27 m out (the six signs as a
// row) to ~5.8 m (the stations' people ~480 px tall) and glides right along them at a constant speed.
// ---------------------------------------------------------------------------
import type { DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 30000 / 1001;
export const DURATION = 400;
export const U = 178;

/** eye 2 m up; pure dolly: Dc = 1920 / k (1038 on the glide at k 1.85) */
export const DEPTH: DepthOpts = { eyeY: -2 * U, dRef: 1200, kRef: 1.6, dolly: 1 };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
/** 0 -> 1 with zero slope at both ends (raised cosine) */
export const ramp = (f: number, a: number, b: number) => 0.5 - 0.5 * Math.cos(Math.PI * c01((f - a) / (b - a)));
/** smootherstep */
const s5 = (f: number, a: number, b: number) => {
  const t = c01((f - a) / (b - a));
  return t * t * t * (t * (6 * t - 15) + 10);
};

// ---- the x track: one velocity function -------------------------------------------------------------------------
/** the glide's constant speed (world units per frame): ~15.5 px/frame on the people at k 1.85 */
export const V = 10;
const PUSH_A = 70;
const PUSH_B = 140;
const GLIDE_A = 116;
const GLIDE_B = 168;
const STOP_A = 322;
const STOP_B = 396;
/** the push's leftward travel (solved below so the f0 frame is centred on the row of signs) */
let L_PUSH = 0;
const vx = (f: number) => V * ramp(f, GLIDE_A, GLIDE_B) * (1 - ramp(f, STOP_A, STOP_B)) - (L_PUSH * (1 - Math.cos((2 * Math.PI * c01((f - PUSH_A) / (PUSH_B - PUSH_A)))))) / (PUSH_B - PUSH_A);
const STEP = 0.25;
const integ = (f0: number, f1: number) => {
  let s = 0;
  const n = Math.max(1, Math.round(Math.abs(f1 - f0) / STEP));
  const h = (f1 - f0) / n;
  for (let i = 0; i < n; i++) s += vx(f0 + (i + 0.5) * h) * h;
  return s;
};

// ---- the stations: X from the glide's timing (each passes the frame's middle on its words) -----------------------
/** station 2 (hygiene) is at the frame's middle on f166 ("hygiene" 164); X2 = 0 */
const T_PASS = { s2: 166, s3: 216, s4: 266, s5: 316 };
const X2 = 0;
export const X3 = X2 + integ(T_PASS.s2, T_PASS.s3);
export const X4 = X2 + integ(T_PASS.s2, T_PASS.s4);
export const X5 = X2 + integ(T_PASS.s2, T_PASS.s5);
/** where the glide comes to rest (f396): the vaccination's needle point sits here */
export const X_END = X2 + integ(T_PASS.s2, STOP_B);
/** the six signs: evenly spaced (one row at f0); signs 2-5 over their stations, 1 and 6 one step out */
const SP = (X5 - X3) / 2;
export const SIGN_X = [X2 - SP, X2, X3, X4, X5, X5 + SP];
const XC = (SIGN_X[0] + SIGN_X[5]) / 2;
// x(0) = XC: solve the push's leftward travel
{
  L_PUSH = 0;
  const r = integ(0, T_PASS.s2); // the glide's share before f166
  L_PUSH = XC + r - X2;
}
const X_AT = (() => {
  const n = Math.round((DURATION + 20) / STEP);
  const a = new Float64Array(n + 1);
  let x = XC;
  a[0] = x;
  for (let i = 0; i < n; i++) {
    x += vx((i + 0.5) * STEP) * STEP;
    a[i + 1] = x;
  }
  return a;
})();
export const camX = (f: number) => {
  const u = Math.max(0, f) / STEP;
  const i = Math.min(X_AT.length - 2, Math.floor(u));
  return X_AT[i] + (X_AT[i + 1] - X_AT[i]) * (u - i);
};
export const camVX = vx;
/** the leftmost point of the swing (the camera's x turns here): the water station */
export const X_TURN = (() => {
  let m = Infinity;
  for (let f = 80; f < 170; f += 0.5) m = Math.min(m, camX(f));
  return m;
})();
export const STATION_X = {
  water: X_TURN - 40,
  hygiene: X2,
  antibiotics: X3,
  therapy: X4,
  rehab: X5,
  vaccine: X_END,
};

// ---- zoom and height ------------------------------------------------------------------------------------------------
export const K_WIDE = 0.385;
export const K_PAN = 2.05;
export const K_END = 3.3;
const CREEP = 0.1;
const logK = (f: number) =>
  Math.log(K_WIDE) + CREEP * Math.sin((Math.PI / 2) * c01(f / 150)) + (Math.log(K_PAN) - Math.log(K_WIDE) - CREEP) * s5(f, 76, 146) + Math.log(K_END / K_PAN) * ramp(f, STOP_A - 6, STOP_B);
export const CY_WIDE = -395;
export const CY_PAN = -223.7;
export const CY_END = -185.9;
const camY = (f: number) => CY_WIDE + 14 * Math.sin((Math.PI / 2) * c01(f / 150)) + (CY_PAN - CY_WIDE - 14) * s5(f, 76, 146) + (CY_END - CY_PAN) * ramp(f, STOP_A - 6, STOP_B);

export const camAt = (f: number) => ({ k: Math.exp(logK(f)), cx: camX(f), cy: camY(f) });

// ---- the signs ------------------------------------------------------------------------------------------------------
export const SIGN_Z = 700;
/** the plate's centre height and size (world units) */
export const SIGN_Y = -556;
export const SIGN_W = 400;
export const SIGN_H = 290;
