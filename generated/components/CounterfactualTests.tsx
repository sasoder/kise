import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  SQUIRCLE_MIN,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  TONE_STEPS,
  Vignette,
  breath,
  camMove,
  clamp,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
// Cut 1 of this world. THE BOX, its crowd, the mark, the ring, the gate's
// x-range and the deal's geometry are all IMPORTED from it, never re-derived,
// so the two cuts cannot drift apart in the edit.
import {
  BOX_CY,
  BOX_H,
  BOX_PATH,
  BOX_X0,
  BOX_X1,
  BOX_Y0,
  CENTRE_X,
  COLS,
  CONTENT_OPEN,
  GATE_DASH,
  GATE_GAP,
  GATE_X0,
  GATE_X1,
  K_OPEN,
  MARK,
  NSEAT,
  RING,
  ROWS,
  SEATS,
  SEAT_AT,
  STROKE,
  TILE_HALF,
  TILE_LIFT,
  TILE_PATH,
  TONE_DUR,
  WIFI,
  WORLD_H,
  WORLD_W,
  clamp01,
  clampi,
  smooth,
} from "./ImpossibleTasks";

export const FPS = 24;
// Dwarkesh clip `Ajeya_DC_Way`, cut 2 (Ajeya Cotra on the OpenAI / Hugging Face
// sandbox attack): "to be able to run counterfactual tests on this model. And
// you can try and do that in a much more secure and hardened way".
//
// SRT span 0:33.000 -> 0:39.960 at 24fps ("than" starts at 39.960).
// round((39.960 - 33.000) * 24) = round(6.960 * 24) = round(167.04) = 167
// frames of speech, plus a 48 frame tail the editor trims = 215.
export const DURATION = 215;

// ---------------------------------------------------------------------------
// "Forks in a hardened box". Orange Dwarkesh style: opaque grid cutaway,
// 1080x1920, 24fps, two-tone warm yellow dots fully opaque, per-icon shadows,
// one eased camera move, one gesture per word.
//
// The attacking model is a scientific artifact. A counterfactual test is the
// SAME model run again with exactly one thing changed — so the box forks into
// three, the crowd and the task identical in all three, and the only variable
// is the gate: never built (dashed), walled shut (solid), or standing open.
// Then one second perimeter draws itself around all three: the same
// experiments, run in a place that was built to hold them.
//
// Every gesture is one word. Nothing else happens.
//   THE ONE CAMERA MOVE. Opens at k 1.50 with the
//     content centre at BOX_CY + 80 — inside the box,
//     the crowd bleeding off both sides, the mark
//     above the frame — and pulls back to k 0.54 with
//     the content centre at world y 742. Keyed f0-22,
//     settled by ~f32, warp 0.72. No other camera move — "to be able to run" f0-32
//   THE TEST. One task tile is dealt from the mark to
//     the agent nearest the box's centre: 12 frames on
//     a shallow lateral bow, back-overshoot on the
//     landing, the agent deep -> ripe over TONE_DUR    — "run"               f23-35
//   THE FORK. Two copies of box 0 — the box, the same
//     SEATS crowd at the same tones, the same landed
//     tile — slide DOWN out of it on their own shallow
//     lateral bows and rest at world centres 810 and
//     1560 (pitch 750 = 700 box + 50 gap). The far
//     copy leaves first: box 2 f47-73 bowing 18 right,
//     box 1 f49-67 bowing 18 left, each landing with a
//     10 px overshoot. While a copy overlaps what it
//     came out of it is drawn on top at full opacity,
//     so the emerging edge reads as a copy peeling out.
//     Their idle traffic starts when they land
//                             — "counterfactual tests on this model" f47-73
//   THE DIFFERENCE. One variable, three states, each a
//     4-frame crossfade on the same 120 px of top wall:
//     box 0 stays DASHED (the gate that was never
//     built — no change); box 1 goes SOLID at f60 (a
//     wall, no gate at all); box 2 goes OPEN at f66
//     (the dashes clear away, the two wall ends
//     round-capped). Nothing else changes            — "tests / on this"    f56-70
//   HOLD. Idle traffic, breath, grid drift, sway. The
//     line is arguing, the picture is not
//                        — "and you can try and do that in a much more" f71-108
//   HARDENED. ONE SECOND PERIMETER around the whole
//     three-box rig — not three shells. A squircle
//     rectangle 40 px outside the boxes' sides and
//     box 2's floor, and 30 px above box 0's top wall,
//     which leaves the internet ring OUTSIDE it, above
//     it, by 40 world px. Same STROKE, same corner
//     rule, ink at OP_READ. It draws HEAD-LED FROM TWO
//     HEADS: both leave the top edge's centre at f108
//     in opposite directions at one shared speed —
//     half the 6500 px perimeter in 42 frames, 77.4
//     world px a frame, 41.8 screen px at k 0.54 — and
//     meet at the bottom edge's centre at f150. The
//     heads vanish there and the whole perimeter
//     clicks ink-bright for 4 frames, settling to
//     OP_READ by f156. The ring, the mark and the box
//     outlines do not change        — "secure and hardened way"  f108-150
//   hold resolved, never fades                        — tail               f157-215
//
// ambient: idle thread traffic in every crowd at the shared opacities, `breath`
// on every dot, `sway` on the camera, the grid's own drift. Not gestures; that
// is what this field is.
//
// THE FRAMING, solved rather than dialled. Captions sit at the bottom of the
// frame, so the whole rig has to live in the band above them: the mark's top
// no higher than screen 90 and the enclosure's floor no lower than 1500.
//
// The tallest thing in frame runs from the mark's top (MARK.y - markSize/2 =
// -614) to the enclosure's bottom (box 2's floor 1910 + 40 = 1950): 2564 world
// px. The two constraints are
//     835 + (-614 - c) * k >=   90   ->  (c + 614) * k <= 745
//     835 + (1950 - c) * k <= 1500   ->  (1950 - c) * k <= 665
// and adding them bounds the zoom on its own: 2564 * k <= 1410, k <= 0.5499.
// k 0.54 leaves 25 screen px of slack; splitting it evenly puts the content
// centre — the point `camMove` lands at screen y 835 — at world 742, with
// ~12.8 px in hand at each end, four times the 3.2 px the camera's own `sway`
// can spend. Measured:
//     mark top      -614 -> screen  103      box 1 top     460 -> screen  683
//     ring top      -440 -> screen  197      box 1 bottom 1160 -> screen 1061
//     ring bottom   -360 -> screen  240      box 2 top    1210 -> screen 1088
//     enclosure top -320 -> screen  262      box 2 bottom 1910 -> screen 1466
//     box 0 top     -290 -> screen  278      enclosure bot 1950 -> screen 1487
//     box 0 bottom   410 -> screen  656      stack centre   810 -> screen  872
// The enclosure spans screen x 275-805, margins 275 either side, and the ring's
// bottom clears its top by 40 world / 21.6 screen px, so the internet reads as
// outside the hardened rig and above it.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot
  accentDeep: z.string(), // deep: an unread dot
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  idleThreadCount: z.number(),
  markSrc: z.string(), // the OpenAI mark, tinted white
  markSize: z.number(), // world px, square
  beats: z.object({
    to: z.number(), // "to"
    be: z.number(), // "be"
    able: z.number(), // "able"
    toTwo: z.number(), // "to"
    run: z.number(), // "run"
    counterfactual: z.number(), // "counterfactual"
    tests: z.number(), // "tests"
    on: z.number(), // "on"
    thisW: z.number(), // "this"
    model: z.number(), // "model"
    and: z.number(), // "and"
    you: z.number(), // "you"
    can: z.number(), // "can"
    try: z.number(), // "try"
    andTwo: z.number(), // "and"
    doW: z.number(), // "do"
    that: z.number(), // "that"
    inA: z.number(), // "in a"
    much: z.number(), // "much"
    more: z.number(), // "more"
    secure: z.number(), // "secure"
    andThree: z.number(), // "and"
    hardened: z.number(), // "hardened"
    way: z.number(), // "way"
    end: z.number(), // speech ends; tail to 215
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE CAMERA. One move, and it is the whole of "to be able to run": the pull
// back out of the crowd. Keyed f0-22 and damped by `runCamera`, so it is within
// 1% of k 0.60 by f32 and every gesture after it happens under a still camera.
// At f47 the copies do not exist yet, so nothing is clipped while it runs; it
// simply lands wide early, which is what the fork needs.
// ---------------------------------------------------------------------------
export const K_FINAL = 0.54;
export const CONTENT_FINAL = 742;
export const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL;
export const CAM = camMove({
  f0: 0,
  f1: 22,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_OPEN,
  c1: CONTENT_FINAL,
  warp: 0.72,
});
export const CAM_F = [...CAM.F, DURATION];
export const CAM_K = [...CAM.K, K_FINAL];
export const CAM_CY = [...CAM.CY, CY_FINAL];

// ---------------------------------------------------------------------------
// THE FORK. Box 0 stays at BOX_CY; the two copies rest a PITCH and two PITCHes
// below it. PITCH is the box plus a 50 px gap, so the three read as one stack
// rather than three unrelated boxes. 780 -> 750 on the reframe: the stack is
// what sets the zoom, and 60 px off its height is 60 px the enclosure does not
// have to spend reaching down into the caption band.
// ---------------------------------------------------------------------------
export const PITCH = 750; // 700 box + 50 gap; box centres 60, 810, 1560

// A copy's travel, and the one place the brief's letter had to give way to its
// own numbers. `Easing.out(Easing.back(1.6))` overshoots by 4s^3/(27(s+1)^2) =
// 9.0% of the run — 70 world px on a 780 px slide, 140 on a 1560 px one, where
// the brief caps the overshoot at 10 — and it leaves at (3+s) times the average
// speed, because its velocity is maximal at the very first frame: 156 world px
// a frame on box 1, which at 24fps is a strobe and not a slide. Solving its s
// down for a 10 px overshoot does not help; the departure is still 2.7x average.
//
// So the landing's SHAPE is written directly instead, as two terms:
//   * the travel, a smoothstep that reaches the target at FLIGHT_PRIMARY of
//     the flight, so it leaves and arrives at zero speed and peaks at
//     1.5 / 0.86 = 1.744 times the average;
//   * the settle, a single sin^2 lobe of OVERSHOOT_PX px over the last 30% —
//     zero slope at both ends, so it grafts onto the travel with no kick, and
//     it crests just after the travel tops out, which is what makes the box go
//     ~10 px past its resting place and come back.
// Peak speed at k 0.54 on the new 750 px pitch: box 1 39 screen px/frame,
// box 2 54 — both DOWN from the 45 / 63 they ran at pitch 780 and k 0.60,
// because the copies now travel less far under a wider camera.
export const OVERSHOOT_PX = 10;
export const FLIGHT_PRIMARY = 0.86;
export const FLIGHT_SETTLE = 0.7; // where the settle lobe starts
export const flight = (u: number) => {
  const x = clamp01(u);
  const p = smooth(Math.min(1, x / FLIGHT_PRIMARY));
  const t = clamp01((x - FLIGHT_SETTLE) / (1 - FLIGHT_SETTLE));
  const s = Math.sin(Math.PI * t) ** 2;
  return { p, over: OVERSHOOT_PX * s };
};

export type Fork = {
  id: number;
  dy: number; // its resting offset from box 0
  f0: number;
  f1: number;
  arc: number; // its lateral bow at mid-flight, world px
  jOff: number; // hash offset for its idle traffic, so no two crowds sync
  gateF: number; // the frame its gate starts changing
  gate: "solid" | "open";
};

// TWO DEVIATIONS from the briefed schedule, both rendered before and after.
//
//  * Box 2 flies for 26 frames, not 22. It has twice box 1's distance to cover,
//    and at 22 frames its peak was 112 screen px a frame — more than twice the
//    40-50 the brief asks for, and a visible strobe on a crowd of 6 px dots.
//    The brief authorises lengthening box 2 for exactly this; 26 frames brings
//    it to 63.
//  * Box 2 leaves FIRST, at f47, and box 1 at f49 — the reverse of the briefed
//    order. Dealt the briefed way, box 2 has to overtake box 1 in flight,
//    because it covers 1560 px while box 1 covers 780: measured on the render,
//    f58-f62 is the two copies inside one another, 67 px apart on a 700 px box,
//    and the fork reads for four frames as one thick smeared box rather than as
//    two copies. Sending the far one first makes the gap monotonic — 96 px at
//    f51, 195 at f55, 347 at f60, 626 at f65 — so the three worlds separate
//    cleanly and never cross. The stagger, the bows and the landings are
//    otherwise exactly as briefed.
//
// Box 2 rests at f73 and box 1 at f67; both are inside "model" (f70-77 / f64-70),
// so the stack is complete before she starts the next clause.
export const FORKS: Fork[] = [
  { id: 1, dy: PITCH, f0: 49, f1: 67, arc: -18, jOff: 4211, gateF: 60, gate: "solid" },
  { id: 2, dy: 2 * PITCH, f0: 47, f1: 73, arc: 18, jOff: 8677, gateF: 66, gate: "open" },
];

// ---------------------------------------------------------------------------
// THE GATE'S THREE STATES. All three boxes mask their gate segment out of their
// own wall, exactly as cut 1 does, and draw the state on top, so a solid and a
// dashed gate are never both there. Box 0 never changes: it is cut 1's dashed
// gate, the one OpenAI forgot to build.
// ---------------------------------------------------------------------------
export const GATE_XFADE = 4;

// ---------------------------------------------------------------------------
// THE ENCLOSURE. "A much more secure and hardened way" is ONE second perimeter
// around the whole three-box rig, not a shell per box: three shells read as
// three separate armourings of three separate experiments, and the line is
// about the place you run them all.
//
// The rectangle is 40 px outside the boxes' sides and box 2's floor, and 30 px
// above box 0's top wall. The 30 is the load-bearing number: it has to clear
// box 0 and it has to stay BELOW the internet ring, so the ring keeps reading
// as the outside world rather than as something sealed in. The ring's bottom is
// at RING.y + RING.r = -360 and the enclosure's top at BOX_Y0 - 30 = -320, so
// the ring clears it by 40 world px (21.6 screen at k 0.54) — comfortably over
// the 20 px the framing asks for, and no midpoint fallback is needed.
// ---------------------------------------------------------------------------
export const ENC_SIDE = 40; // sides and floor
export const ENC_TOP = 30; // above box 0's top wall, and under the ring
export const ENC_X0 = BOX_X0 - ENC_SIDE; // 50
export const ENC_X1 = BOX_X1 + ENC_SIDE; // 1030
export const ENC_Y0 = BOX_Y0 - ENC_TOP; // -320
export const ENC_Y1 = BOX_CY + 2 * PITCH + BOX_H / 2 + ENC_SIDE; // 1950
export const ENC_W = ENC_X1 - ENC_X0; // 980
export const ENC_H = ENC_Y1 - ENC_Y0; // 2270
export const ENC_PATH = squirclePath(ENC_W, ENC_H);
export const ENC_PERIM = 2 * (ENC_W + ENC_H); // 6500
export const ENC_HALF = ENC_PERIM / 2; // 3250

// TWO HEADS, one speed. Both leave the top edge's centre at ENC_F0 in opposite
// directions and meet at the bottom edge's centre at ENC_F1, so each covers
// half the perimeter in 42 frames:
//   3250 / 42 = 77.38 world px a frame = 41.8 SCREEN px a frame at k 0.54,
// under the ~45 px/frame cap, so the draw starts on "much" at f108 and does not
// need to be moved earlier.
export const ENC_F0 = 108; // = defaultProps.beats.much, the frame "much" lands
export const ENC_F1 = 150;
export const ENC_SPEED = ENC_HALF / (ENC_F1 - ENC_F0); // 77.38 world px/frame
export const ENC_CLICK = 4; // frames ink-bright on meeting, then settle to OP_READ
export const ENC_SETTLE = 2; // ...over these, so it is resolved by f156, before "way"

// `squirclePath` starts on the TOP edge a corner-inset `p` short of the
// top-right corner and runs clockwise, so the top edge's CENTRE is at
// ENC_PERIM - (ENC_W / 2 - p) measured forward along the path. `p` is the
// package's own corner reach, recomputed here from the same three constants the
// helper uses rather than guessed, so it cannot drift if the squircle is
// retuned again.
const ENC_SHORT = Math.min(ENC_W, ENC_H);
const ENC_R = Math.min(ENC_SHORT / 2, Math.max(SQUIRCLE_RATIO * ENC_SHORT, SQUIRCLE_MIN));
export const ENC_P = Math.min(ENC_SHORT / 2, (1 + SQUIRCLE_SMOOTH) * ENC_R); // 18.816
// in `pathLength={1000}` units: 927.51
export const ENC_TOP_U = (1000 * (ENC_PERIM - (ENC_W / 2 - ENC_P))) / ENC_PERIM;
export const ENC_HALF_U = 500; // half the perimeter, same units

// The drawn arcs, as dash intervals in path units. A dash is NEVER allowed to
// run past the path's end and wrap: a dash pattern on a closed path restarts at
// the path's own start point, it does not continue around, so an interval that
// crosses 1000 silently loses its tail. The clockwise head is therefore split
// into two intervals at the seam and the counter-clockwise one — which runs
// from 927.51 DOWN to 427.51 — never reaches it.
export const encSegs = (drawn: number): [number, number][] => {
  const L = ENC_HALF_U * clamp01(drawn);
  const end = ENC_TOP_U + L;
  const segs: [number, number][] = [[ENC_TOP_U - L, ENC_TOP_U]];
  if (end <= 1000) segs.push([ENC_TOP_U, end]);
  else {
    segs.push([ENC_TOP_U, 1000]);
    segs.push([0, end - 1000]);
  }
  return segs.filter(([a, b]) => b - a > 0.001);
};

// The clockwise head's position, walked around the RECTANGLE from the top
// edge's centre. The squircle's corners cut a few px off each of them, so this
// runs a fraction ahead of the dash's own tip — well under a head's 4 px radius
// over a 6500 px perimeter. The counter-clockwise head is its mirror in the
// rig's own axis, x = 2 * CENTRE_X - x.
export const encHead = (s: number) => {
  const half = ENC_W / 2;
  if (s <= half) return { x: CENTRE_X + s, y: ENC_Y0 };
  if (s <= half + ENC_H) return { x: ENC_X1, y: ENC_Y0 + (s - half) };
  return { x: ENC_X1 - (s - half - ENC_H), y: ENC_Y1 };
};

// ---------------------------------------------------------------------------
// THE TEST. One tile, dealt from the mark to the agent nearest the box's own
// centre — cut 1's deal exactly: 12 frames on a shallow lateral bow, a
// back-overshoot landing, the tile's centre TILE_LIFT above the agent's dot so
// the agent stays visible under its own task.
// ---------------------------------------------------------------------------
export const DEAL_LAUNCH = 23;
export const DEAL_DUR = 12;
export const DEAL_LAND = DEAL_LAUNCH + DEAL_DUR; // 35

export const TEST_SEAT = (() => {
  let best = 0;
  let bestD = Infinity;
  SEATS.forEach((s, i) => {
    const d = Math.hypot(s.x - CENTRE_X, s.y - BOX_CY);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
})();
export const TEST_X = SEATS[TEST_SEAT].x;
export const TEST_Y = SEATS[TEST_SEAT].y - TILE_LIFT;
// its own bow, 45-90 px, hashed like cut 1's five so it is never a straight line
export const TEST_ARC = (hash(0, 65) < 0.5 ? -1 : 1) * (45 + 45 * hash(0, 66));

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotUnread: OP_UNREAD_DOT,
  idleThreadCount: idleThreads(NSEAT),
  markSrc: "openai-chatgpt-logo.png",
  markSize: 108,
  beats: {
    to: 0,
    be: 4,
    able: 10,
    toTwo: 15,
    run: 23,
    counterfactual: 47,
    tests: 54,
    on: 59,
    thisW: 64,
    model: 70,
    and: 77,
    you: 80,
    can: 83,
    try: 86,
    andTwo: 89,
    doW: 93,
    that: 97,
    inA: 103,
    much: 108,
    more: 111,
    secure: 121,
    andThree: 130,
    hardened: 138,
    way: 157,
    end: 167,
  },
});

// ---------------------------------------------------------------------------
// The field's ambient traffic and the batching it needs, taken from cut 2 of
// the sibling clip: three crowds of ~950 agents is ~2,900 dots a frame, and one
// <circle> each is what makes that a slideshow. A dot's colour is already
// quantised to the tone ramp's 64 steps, so every dot in a bucket can be one
// subpath of one <path>. Same geometry, 65 elements a crowd instead of 950.
// ---------------------------------------------------------------------------
export type Th = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  op: number;
  head: number;
};

export const idleFor = (f: number, jOff: number, count: number, lit: Float32Array, out: Th[]) => {
  const reach = 5;
  for (let j = 0; j < count; j++) {
    const jj = j + jOff;
    const period = 44 - 12 * hash(jj, 4);
    const local = f + hash(jj, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = jj * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = SEAT_AT[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const sb = SEATS[b];
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    out.push({
      x1: sa.x,
      y1: sa.y,
      x2: sa.x + (sb.x - sa.x) * dn,
      y2: sa.y + (sb.y - sa.y) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }
};

export const dotPaths = (lit: Float32Array, jOff: number, f: number, dotRadius: number) => {
  const buckets: string[] = new Array(TONE_STEPS + 1).fill("");
  for (let i = 0; i < NSEAT; i++) {
    const s = SEATS[i];
    const l = lit[i];
    const b = Math.round(clamp01(l) * TONE_STEPS);
    const r = dotRadius * s.r * s.rs * breath(f, hash(i + jOff, 9)) * (1 + 0.35 * l);
    const rr = r.toFixed(2);
    buckets[b] +=
      `M${(s.x - r).toFixed(2)} ${s.y.toFixed(2)}` +
      `a${rr} ${rr} 0 1 0 ${(2 * r).toFixed(2)} 0` +
      `a${rr} ${rr} 0 1 0 ${(-2 * r).toFixed(2)} 0`;
  }
  return buckets;
};

export const THREAD_OP_STEPS = 16;
export const threadPaths = (list: Th[]) => {
  const lines: string[] = new Array(THREAD_OP_STEPS + 1).fill("");
  const heads: string[] = new Array(THREAD_OP_STEPS + 1).fill("");
  for (const t of list) {
    const b = Math.round(clamp01(t.op) * THREAD_OP_STEPS);
    if (b === 0) continue;
    lines[b] += `M${t.x1.toFixed(1)} ${t.y1.toFixed(1)}L${t.x2.toFixed(1)} ${t.y2.toFixed(1)}`;
    if (t.head < 1) {
      heads[b] += `M${(t.x2 - 4).toFixed(1)} ${t.y2.toFixed(1)}a4 4 0 1 0 8 0a4 4 0 1 0 -8 0`;
    }
  }
  return { lines, heads };
};

const CounterfactualTests: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotUnread,
  idleThreadCount,
  markSrc,
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = unread (deep), 1 = lit (ripe). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- the test tile ---------------------------------------------------------
  // Dealt once, into box 0; the copies inherit it landed, because a
  // counterfactual is the same run with one thing changed.
  const tileTone = smooth((frame - DEAL_LAND) / TONE_DUR);
  const dealt = (() => {
    if (frame < DEAL_LAUNCH) return null;
    const lin = clamp01((frame - DEAL_LAUNCH) / DEAL_DUR);
    const e = Easing.out(Easing.cubic)(lin);
    const dx = TEST_X - MARK.x;
    const dy = TEST_Y - MARK.y;
    const L = Math.hypot(dx, dy) || 1;
    // the bow is perpendicular to the run, so the tile never travels a straight
    // line from the mark to its agent
    const bow = Math.sin(Math.PI * e) * TEST_ARC;
    return {
      x: MARK.x + dx * e + (-dy / L) * bow,
      y: MARK.y + dy * e + (dx / L) * bow,
      scale: interpolate(frame, [DEAL_LAND - 2, DEAL_LAND + 7], [0.82, 1], {
        ...clamp,
        easing: Easing.out(Easing.back(1.6)),
      }),
      op: OP_READ * smooth(lin / 0.15),
    };
  })();

  // -- the three crowds ------------------------------------------------------
  // Same seats, same tone for the tile's agent; each box's idle schedule is its
  // own, so three identical crowds never pulse in unison. A copy's traffic
  // starts when it lands.
  const crowdFor = (jOff: number, live: boolean) => {
    const lit = new Float32Array(NSEAT);
    const threads: Th[] = [];
    if (live) idleFor(frame, jOff, idleThreadCount, lit, threads);
    lit[TEST_SEAT] = Math.max(lit[TEST_SEAT], tileTone);
    return { dots: dotPaths(lit, jOff, frame, dotRadius), threads: threadPaths(threads) };
  };

  const crowd0 = crowdFor(0, true);

  // -- the fork --------------------------------------------------------------
  const forks = FORKS.filter((f) => frame >= f.f0).map((f) => {
    const u = clamp01((frame - f.f0) / (f.f1 - f.f0));
    const { p, over } = flight(u);
    // its own shallow lateral bow, so no copy travels a straight line and no
    // two travel the same one
    const bow = Math.sin(Math.PI * p) * f.arc;
    return {
      f,
      dx: bow,
      dy: f.dy * p + over,
      crowd: crowdFor(f.jOff, frame >= f.f1),
    };
  });

  // -- the gates -------------------------------------------------------------
  const gateOf = (f: Fork) => smooth((frame - f.gateF) / GATE_XFADE);

  // -- the enclosure ---------------------------------------------------------
  const enc = (() => {
    // the start comes off the beat map, exactly as the old second walls did;
    // ENC_F0 is the same frame and is what the module-scope speed is solved on
    const f0 = beats.much;
    if (frame < f0) return null;
    const drawn = clamp01((frame - f0) / (ENC_F1 - f0));
    const cw = encHead(ENC_HALF * drawn);
    return {
      drawn,
      cw,
      ccw: { x: 2 * CENTRE_X - cw.x, y: cw.y },
      // OP_READ while it draws; ink-bright the frame the two heads meet, held
      // ENC_CLICK frames, then settled back onto the ladder
      op:
        frame < ENC_F1
          ? OP_READ
          : interpolate(
              frame,
              [ENC_F1 + ENC_CLICK, ENC_F1 + ENC_CLICK + ENC_SETTLE],
              [1, OP_READ],
              clamp,
            ),
    };
  })();

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // One small shadow on every icon: the boxes, the second walls, the tile, the
  // ring and the mark. Not the dots and not the threads — those are the field.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const RING_C = 2 * Math.PI * RING.r;
  const wifiCx = RING.x;
  const wifiCy = RING.y + WIFI.dy;

  const drawCrowd = (c: { dots: string[]; threads: { lines: string[]; heads: string[] } }) => (
    <>
      {c.dots.map((d, bi) =>
        d ? <path key={`d${bi}`} d={d} fill={tone(bi / TONE_STEPS)} opacity={dotUnread} /> : null,
      )}
      {c.threads.lines.map((d, bi) =>
        d ? (
          <path
            key={`l${bi}`}
            d={d}
            fill="none"
            stroke={accent}
            strokeWidth={STROKE}
            strokeLinecap="round"
            opacity={bi / THREAD_OP_STEPS}
          />
        ) : null,
      )}
      {c.threads.heads.map((d, bi) =>
        d ? <path key={`t${bi}`} d={d} fill={ink} opacity={bi / THREAD_OP_STEPS} /> : null,
      )}
    </>
  );

  const drawTile = () =>
    dealt ? (
      <g style={{ filter: icon }}>
        <path
          d={TILE_PATH}
          transform={`translate(${dealt.x} ${dealt.y}) scale(${dealt.scale}) translate(${-TILE_HALF} ${-TILE_HALF})`}
          fill={ink}
          opacity={dealt.op}
        />
      </g>
    ) : null;

  const drawEnclosure = () =>
    enc ? (
      <g style={{ filter: icon }}>
        {encSegs(enc.drawn).map(([a, b]) => (
          <path
            key={a}
            d={ENC_PATH}
            transform={`translate(${ENC_X0} ${ENC_Y0})`}
            fill="none"
            stroke={ink}
            strokeWidth={STROKE}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray={`${(b - a).toFixed(3)} 1000`}
            strokeDashoffset={-a}
            opacity={enc.op}
          />
        ))}
        {enc.drawn < 1 ? (
          <>
            <circle cx={enc.cw.x} cy={enc.cw.y} r={4} fill={ink} />
            <circle cx={enc.ccw.x} cy={enc.ccw.y} r={4} fill={ink} />
          </>
        ) : null}
      </g>
    ) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              {/* every box masks its own gate segment out of its own wall, so a
                  solid gate and a dashed one are never both there. The mask is
                  in user space, which for a copy is already its own translated
                  space, so one mask serves all three boxes. */}
              <mask
                id="cft-gate"
                maskUnits="userSpaceOnUse"
                x={-400}
                y={-900}
                width={1900}
                height={3400}
              >
                <rect x={-400} y={-900} width={1900} height={3400} fill="#fff" />
                <rect x={GATE_X0} y={BOX_Y0 - 6} width={GATE_X1 - GATE_X0} height={12} fill="#000" />
              </mask>
            </defs>

            {/* ------------------------------------------------- BOX 0, ours */}
            {drawCrowd(crowd0)}

            <g style={{ filter: icon }}>
              <g mask="url(#cft-gate)">
                <path
                  d={BOX_PATH}
                  transform={`translate(${BOX_X0} ${BOX_Y0})`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  opacity={OP_READ}
                />
              </g>
              {/* the gate that was never built — box 0's variable, unchanged */}
              <line
                x1={GATE_X0}
                y1={BOX_Y0}
                x2={GATE_X1}
                y2={BOX_Y0}
                stroke={ink}
                strokeWidth={STROKE}
                strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                opacity={OP_READ}
              />
            </g>

            {/* the internet: cut 1's ring outside the box, closed, with its
                wifi glyph. It does not change in this cut. */}
            <g style={{ filter: icon }}>
              <circle
                cx={RING.x}
                cy={RING.y}
                r={RING.r}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_C}
                opacity={OP_READ}
                transform={`rotate(-90 ${RING.x} ${RING.y})`}
              />
              <g
                opacity={OP_READ}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
              >
                {WIFI.radii.map((r) => (
                  <path
                    key={r}
                    d={`M ${wifiCx - r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)} A ${r} ${r} 0 0 1 ${wifiCx + r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)}`}
                  />
                ))}
                <circle cx={wifiCx} cy={wifiCy} r={WIFI.dot} fill={ink} stroke="none" />
              </g>
            </g>

            {drawTile()}

            {/* --------------------------------------------------- THE COPIES
                drawn after box 0 and in order, so while a copy still overlaps
                what it came out of it sits on top at full opacity and the
                emerging edge reads as a copy peeling out. */}
            {forks.map((fk) => {
              const g = gateOf(fk.f);
              return (
                <g key={fk.f.id} transform={`translate(${fk.dx.toFixed(2)} ${fk.dy.toFixed(2)})`}>
                  {drawCrowd(fk.crowd)}
                  <g style={{ filter: icon }}>
                    <g mask="url(#cft-gate)">
                      <path
                        d={BOX_PATH}
                        transform={`translate(${BOX_X0} ${BOX_Y0})`}
                        fill="none"
                        stroke={ink}
                        strokeWidth={STROKE}
                        opacity={OP_READ}
                      />
                    </g>
                    {/* the one variable: the gate it fades out of, and the one
                        it fades into */}
                    {g < 1 ? (
                      <line
                        x1={GATE_X0}
                        y1={BOX_Y0}
                        x2={GATE_X1}
                        y2={BOX_Y0}
                        stroke={ink}
                        strokeWidth={STROKE}
                        strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                        opacity={OP_READ * (1 - g)}
                      />
                    ) : null}
                    {fk.f.gate === "solid" && g > 0 ? (
                      <line
                        x1={GATE_X0}
                        y1={BOX_Y0}
                        x2={GATE_X1}
                        y2={BOX_Y0}
                        stroke={ink}
                        strokeWidth={STROKE}
                        opacity={OP_READ * g}
                      />
                    ) : null}
                    {/* an open gap: the mask cuts the wall square, so the two
                        ends get their own round caps as the dashes clear */}
                    {fk.f.gate === "open" && g > 0
                      ? [GATE_X0, GATE_X1].map((x) => (
                          <circle
                            key={x}
                            cx={x}
                            cy={BOX_Y0}
                            r={STROKE / 2}
                            fill={ink}
                            opacity={OP_READ * g}
                          />
                        ))
                      : null}
                  </g>
                  {drawTile()}
                </g>
              );
            })}

            {/* ---------------------------------------------- THE ENCLOSURE
                one perimeter around the whole rig, drawn last so the two
                heads are never behind a box or a crowd */}
            {drawEnclosure()}
          </svg>

          {/* the OpenAI mark, tinted white. It does not change in this cut. */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: MARK.y - markSize / 2,
              width: markSize,
              height: markSize,
              filter: `brightness(0) invert(1) ${icon}`,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default CounterfactualTests;
