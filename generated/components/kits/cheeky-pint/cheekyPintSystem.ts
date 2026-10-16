import { Easing, interpolate } from "remotion";

// ---------------------------------------------------------------------------
// Cheeky Pint — shared system for the brown-paper cutaways
//
// These three graphics are cut into one edit within twenty seconds of each
// other, so the things a viewer compares across them have to match. None of
// what is fixed here is visible inside any single piece; all of it is visible
// in a row, which is how they get watched.
//
// Fixed here: how the camera settles, how the ground reads, how a thing lands,
// how deep the paper sits, and how bright ambient traffic is allowed to be.
// Not fixed here: geometry. A pile of businesses and a rack of products are
// different objects and should be built to their own proportions — but each one
// on a grid of its own, not by eye.
// ---------------------------------------------------------------------------

// One camera hand. All three used zeta ~0.78 already but at three different
// stiffnesses, so they settled at three different speeds and read as three
// different operators. One stiffness means one settle time in frames — about
// 13 — which suits the shortest of the three as well as the longest.
export const CAM_STIFF = 0.145;
export const CAM_DAMP = 0.59; // zeta ~0.77

// One ground. Was 5px at an animated 0.16-0.46, then 4px flat at 0.26, then
// 5px flat at 0.26 — three different floors under the same house.
export const GROUND_W = 5;
export const GROUND_O = 0.24;
// Only lifted when something is actually being measured against it.
export const GROUND_LIFT = 0.4;

// One landing. Was back(1.4), back(1.5) and back(1.6) across the three.
export const LAND = Easing.out(Easing.back(1.5));
export const RISE = Easing.out(Easing.cubic);
export const GLIDE = Easing.inOut(Easing.cubic);
export const EASE = Easing.inOut(Easing.quad);

// One depth for the paper. The backdrop scaled at 0.3 of the zoom in two of
// them and 0.16 in the third, so the sheet sat at two different distances.
export const BG_OVERSIZE = 1.8;
export const PARALLAX = 0.15;
export const BG_SCALE_K = 0.24;
export const BG_DRIFT = 0.25; // px per frame, so a hold is never fully still

// One click-bright. The flash is ink because that is the state ladder — a thing
// is read white before it is understood in accent.
export const FLASH = 4;

// Where arrivals are dense the beat overlaps itself. At five a frame, two
// frames of pure ink is ten white dots at once and the ladder stops reading as
// a beat and starts reading as a pale band laid through the mass. So a dense
// front takes a half-step of the same ladder — warm, most of the way to the
// accent — and gets it for half as long. Measured on the tower, where full ink
// left a visible seam and, at the cut, a white cap.
export const FLASH_DENSE = 2;
export const FLASH_DENSE_INK = "#FFD98A";

// One ceiling for ambient traffic — packets, impressions, drifting makers.
// Anything a viewer should read as subordinate lives at or under this.
export const AMBIENT_O = 0.38;

// The minimum air between two things that sit side by side. Where a graphic
// varies its objects' widths, this is the gap the widest pair gets.
export const GAP = 36;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Stable per-element scatter — same value every frame, so nothing flickers.
export const hash = (i: number) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
export const sgnRand = (i: number) => hash(i) * 2 - 1;
export const sgnPick = (i: number) => (hash(i) > 0.5 ? 1 : -1);

export const qbez = (a: number, c: number, b: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

// ---------------------------------------------------------------------------
// The camera
//
// A coarse key track run through a damped follow, integrated from frame 0 every
// render. The keys are authored — deliberately held still through the busiest
// moments — and the damping rounds every corner so the move never starts or
// stops abruptly and always trails the action slightly, like a real operator.
// `cy` is either its own key track or a function of the zoom, for scenes whose
// content stays put in the world and only needs reframing.
// ---------------------------------------------------------------------------
export const runCamera = (
  upto: number,
  F: number[],
  K: number[],
  cyTarget: number[] | ((k: number) => number),
) => {
  const at = (arr: number[], f: number) =>
    interpolate(f, F, arr, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const target = (f: number, k: number) =>
    typeof cyTarget === "function" ? cyTarget(k) : at(cyTarget, f);

  let k = K[0];
  let cy = target(0, K[0]);
  let vk = 0;
  let vcy = 0;
  for (let f = 1; f <= upto; f++) {
    const tk = at(K, f);
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vcy += (target(f, tk) - cy) * CAM_STIFF - vcy * CAM_DAMP;
    cy += vcy;
  }
  return { cy, k };
};

// The paper, identical in all three.
export const backdropStyle = (
  frame: number,
  cy: number,
  k: number,
  cy0: number,
  blur: number,
  dim: number,
): React.CSSProperties => ({
  position: "absolute",
  left: "50%",
  top: "50%",
  width: 1080 * BG_OVERSIZE,
  height: 1920 * BG_OVERSIZE,
  objectFit: "cover",
  transform: `translate(-50%, -50%) translateY(${(-(cy - cy0) * k * PARALLAX - frame * BG_DRIFT).toFixed(2)}px) scale(${(1 + (k - 1) * BG_SCALE_K).toFixed(4)})`,
  filter: `blur(${blur}px) brightness(${dim})`,
});
