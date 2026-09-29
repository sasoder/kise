// PivotalNotDecisiveV2: the transition and the timeline. Pure maths, no
// React, so the checks (glyph continuity, row geometry vs NotConveyingAnything,
// dot speeds) read exactly what the component draws.
//
// Two worlds, two cameras:
//   MAP  V1's map and camera (pivotalMotion) with V1's travel north switched
//        off: through f78 the same frames as V1; from f80 an extra pull-back
//        (k x0.5 by f106) while the map layers fade out (f80-100).
//   ROW  NotConveyingAnything's war row (its PLACED, AXIS_Y, X_MID, HALF,
//        K_WIDE, CY, imported unchanged), seen from its own camera (see
//        makeRowCam): the transition's pull-back settles close on Port Arthur
//        (k 1.15), follows the emphasis to the end cap, then reveals cut 1's
//        0.645 wide (f166); a 2% creep after.
// The Port Arthur glyph lives in SCREEN space and glides from its map position
// to its slot on the row (f80-102), so it never leaves the frame.
import { CITIES } from "./manchuriaMapData";
import { CAM_LIFT, makeCam, smootherstep, smoothstep } from "./pivotalMotion";
import { K_CLOSE } from "./pivotalMapData";
import { AXIS_Y, CY, GLYPH, HALF, K_WIDE, PLACED, X_MID } from "./NotConveyingAnything";

export const FPS = 24;
export const DURATION = 177;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const sway = (f: number) => ({ dy: 5 * Math.sin(f / 19), dx: 3 * Math.sin(f / 23) });

export const T2 = {
  mapFade: [80, 100] as const, // map layers -> the bare page
  mapOut: [80, 106] as const, // the map's extra pull-back (k x MAP_OUT)
  glide: [80, 102] as const, // the glyph: map position -> its slot on the row
  rowZoom: [80, 112] as const, // row k 1.3 x K_WIDE -> K_WIDE (the transition as built)
  axis: [88, 108] as const, // the axis draws out both ways from under the glyph
  caps: 6, // each cap draws in 6 f as its tip arrives
  ink: 8, // a battle inks in 0 -> 0.5 over 8 f as the tip reaches it
  emph: [116, 137] as const, // the emphasis: Port Arthur -> the end cap
  light: 10, // a battle lifts 0.5 -> 1 over 10 f on contact
  creep: [166, 177] as const, // tail creep, row k x1.02
};
const MAP_OUT = 0.5;
const ROW_ZOOM_FROM = 1.3;
const ROW_CREEP = 1.02;

// ---------------------------------------------------------------------------
// MAP camera: V1's, travel switched off, plus the extra pull-back.
// ---------------------------------------------------------------------------
const OFF = 1e4;
const v1NoTravel = makeCam({ za: 72, zc: 86, a: OFF, b: OFF + 1, c2: OFF + 2, c: OFF + 3, ya: OFF, yc: OFF + 1 });
export const mapCam = (f: number) => {
  const b = v1NoTravel(f);
  const k = b.k * Math.pow(MAP_OUT, smootherstep((f - T2.mapOut[0]) / (T2.mapOut[1] - T2.mapOut[0])));
  return { k, cx: b.cx, cy: b.c + CAM_LIFT / k };
};
export const mapOpacity = (f: number) => 1 - smoothstep((f - T2.mapFade[0]) / (T2.mapFade[1] - T2.mapFade[0]));

/** the map camera's world -> screen transform, with V1's sway */
export const mapXform = (f: number) => {
  const c = mapCam(f);
  const d = sway(f);
  const cx = c.cx + d.dx / c.k;
  const cy = c.cy + d.dy / c.k;
  return { k: c.k, tx: 540 - cx * c.k, ty: 960 - cy * c.k };
};

// ---------------------------------------------------------------------------
// ROW camera: world (cx, CY) on screen (540, 835), sway as cut 1 (0.6 / 0.5).
// Four strokes, each a smootherstep in log k and in cx, so the camera is C2:
//   TRANSITION f80-112  cut 1's wide, pulled in 1.3x, settling toward
//                       K_WIDE on the war's midpoint (V2's match cut, kept)
//   SETTLE     f98-120  ...instead settles closer, K_SET on Port Arthur
//                       (its glyph at screen x ~400); the war before it runs
//                       off-frame left
//   FOLLOW     f114-134 glides right with the emphasis head, leading it,
//                       landing with the end cap centre-right (x ~700)
//   REVEAL     k f136-158, cx f144-168: one eased pull-back to cut 1's 0.645
//                       wide on the midpoint (within 2 px of rest by f166);
//                       then a 2% creep
// The windows were fitted by a search against the 45 px/f cap on every
// glyph, both caps and the emphasis head (worst 44.2, f151).
// ---------------------------------------------------------------------------
export const K_SET = 1.15;
const PA_SCREEN_X = 400;
const END_SCREEN_X = 700;
export type RowParams = { sa: number; sb: number; fa: number; fb: number; ka: number; kb: number; xa: number; xb: number };
export const ROW_PARAMS: RowParams = { sa: 98, sb: 120, fa: 114, fb: 134, ka: 136, kb: 158, xa: 144, xb: 168 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const makeRowCam = (P: RowParams) => {
  const pa = PLACED.find((b) => b.name === "Port Arthur falls")!;
  const CX_SET = pa.x - (PA_SCREEN_X - 540) / K_SET;
  const CX_END = X_MID + HALF - (END_SCREEN_X - 540) / K_SET;
  return (f: number) => {
    const kOld = K_WIDE * Math.pow(ROW_ZOOM_FROM, 1 - smootherstep((f - T2.rowZoom[0]) / (T2.rowZoom[1] - T2.rowZoom[0])));
    const b1 = smootherstep((f - P.sa) / (P.sb - P.sa));
    const b2 = smootherstep((f - P.fa) / (P.fb - P.fa));
    const bk = smootherstep((f - P.ka) / (P.kb - P.ka));
    const bx = smootherstep((f - P.xa) / (P.xb - P.xa));
    const g = clamp01((f - T2.creep[0]) / (T2.creep[1] - T2.creep[0]));
    const creep = Math.pow(ROW_CREEP, g * g * (1.5 - 0.5 * g)); // eases in, still moving at the end
    const lk = lerp(Math.log(kOld), Math.log(K_SET), b1) + bk * (Math.log(K_WIDE) - Math.log(K_SET));
    const cx = lerp(X_MID, CX_SET, b1) + b2 * (CX_END - CX_SET) + bx * (X_MID - CX_END);
    return { k: Math.exp(lk) * creep, cx };
  };
};
export const rowCam = makeRowCam(ROW_PARAMS);
export const rowK = (f: number) => rowCam(f).k;
export const rowXform = (f: number, withSway = true, cam = rowCam) => {
  const { k, cx } = cam(f);
  const d = withSway ? sway(f) : { dx: 0, dy: 0 };
  return { k, tx: 540 - cx * k + d.dx * 0.6, ty: CY - CY * k + d.dy * 0.5 };
};

// ---------------------------------------------------------------------------
// The row. Port Arthur's fall (2 Jan 1905) is PLACED "Port Arthur falls".
// ---------------------------------------------------------------------------
export const PA_ROW = PLACED.find((b) => b.name === "Port Arthur falls")!;
export const OTHERS = PLACED.filter((b) => b !== PA_ROW);
export const INK_HALF = GLYPH / 2 - (GLYPH * 3) / 24; // swords ink spans 3..21 of 24
export const X_START = X_MID - HALF;
export const X_END = X_MID + HALF;
const DL = PA_ROW.x - X_START;
const DR = X_END - PA_ROW.x;

/** the axis tips at frame f (both arrive together, f108) */
export const axisTips = (f: number) => {
  const u = smootherstep((f - T2.axis[0]) / (T2.axis[1] - T2.axis[0]));
  return { xl: PA_ROW.x - DL * u, xr: PA_ROW.x + DR * u, u };
};
const firstFrame = (test: (f: number) => boolean) => {
  for (let f = 0; f < 400; f += 0.05) if (test(f)) return f;
  return 400;
};
/** when the drawing axis reaches each battle's date */
export const INK_AT = new Map(
  OTHERS.map((b) => [
    b.name,
    firstFrame((f) => {
      const t = axisTips(f);
      return b.x < PA_ROW.x ? t.xl <= b.x : t.xr >= b.x;
    }),
  ]),
);
export const CAP_AT = firstFrame((f) => axisTips(f).u >= 0.9999);

/** the emphasis: from Port Arthur rightward only, reaching the end cap f137 */
export const emphX = (f: number) =>
  PA_ROW.x + DR * smoothstep((f - T2.emph[0]) / (T2.emph[1] - T2.emph[0]));
export const LIGHT_AT = new Map(
  OTHERS.filter((b) => b.x > PA_ROW.x).map((b) => [b.name, firstFrame((f) => emphX(f) >= b.x - INK_HALF)]),
);
export const END_CAP_LIT = firstFrame((f) => emphX(f) >= X_END - 0.5);

// ---------------------------------------------------------------------------
// The Port Arthur glyph, screen space: V1's map glyph (75 px at K_CLOSE,
// k^0.35) gliding into its row slot (GLYPH world px at the row's k).
// ---------------------------------------------------------------------------
export const GLYPH_CLOSE = 75;
export const glyphAt = (f: number) => {
  const m = mapXform(f);
  const r = rowXform(f);
  const mx = m.tx + CITIES.portArthur.x * m.k;
  const my = m.ty + CITIES.portArthur.y * m.k;
  const mSize = GLYPH_CLOSE * Math.pow(m.k / K_CLOSE, 0.35);
  const rx = r.tx + PA_ROW.x * r.k;
  const ry = r.ty + PA_ROW.y * r.k;
  const rSize = GLYPH * r.k;
  const e = smootherstep((f - T2.glide[0]) / (T2.glide[1] - T2.glide[0]));
  // the label: V1's (gBox / 2 + 62 below, 50 px x (k/K_CLOSE)^0.18) -> under
  // the axis below the glyph at 36 px
  const mLabSize = 50 * Math.pow(m.k / K_CLOSE, 0.18);
  const mLabOff = mSize * 0.5 + 62;
  const rLabSize = 36;
  const rLabOff = (AXIS_Y - PA_ROW.y) * r.k + 14 + 0.72 * rLabSize;
  return {
    x: mx + (rx - mx) * e,
    y: my + (ry - my) * e,
    size: mSize + (rSize - mSize) * e,
    labSize: mLabSize + (rLabSize - mLabSize) * e,
    labOff: mLabOff + (rLabOff - mLabOff) * e,
    e,
  };
};
