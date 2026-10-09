import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLUE,
  CHAIN_TRAVEL,
  CaptionStripDebug,
  EASE_LAND,
  FPS as SET_FPS,
  FRAME_H,
  FRAME_W,
  Figure,
  INK,
  OP_MID,
  ORANGE,
  PAPERS_NUMBER,
  PAPER_BASE,
  PURPLE,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  TallPaper,
  WorldTall,
  camEase,
  clamp,
  gridPos,
  runCamera2,
  sway,
  textRise,
  type,
  worldTransformTall,
} from "./deathCountShared";

// ---------------------------------------------------------------------------
// "ZEROED IT DOWN" — cut C of "brent - the mine death count" (Core Memory,
// Ashlee Vance x Brent Underwood). 1080 x 1920, 24000/1001 fps, 142 frames,
// opaque, the core memory graphic standard on `deathCountShared`.
//
// CHECK LINE: "Checked against the record, the thirty shrinks to two, maybe
// four; the big number was only ever repetition."
//
// THE MOTION — one search that tightens to a point, then a step back. A
// reader's lens (a plain ring with four reticle ticks) sweeps the papers'
// number in ONE serpentine, bottom row to top row; behind it every figure that
// does not hold up sinks behind its row's rule. The FRAME does not follow the
// lens: it only tightens, in one ease, onto the top-left four, where the lens
// comes to rest: two stay solid, two drain to hollow, and "2–4" rises in
// above them. Then the camera steps back part of the way, ONE line strikes the
// "30", and chain-colour copies of the "30" keep stepping out from behind it to
// the last frame.
//
// THE WORDS (local frames, f0 = sequence 870 = 36.286 s):
//   I kind of 0-9 · zeroed 9-15 · it down 15-20 · that it was 20-28 ·
//   actually 28-33 · probably 33-43 · between 43-55 · 2 55-65 · to 65 ·
//   4 67-72 · people 72-79 · (pause) 79-86 · not 87 · 30 92-100 ·
//   people 100-109 · It's been 114 · repeated 118-123 · so 123 · many 128 ·
//   times 132-139 · END 142
//
// THE PICTURE, world px (world = screen at the opening camera):
//   ledger   PAPERS_NUMBER, figure 84 on a 96 x 120 pitch, 948 wide from x 66;
//            row centres y 760 / 880 / 1000. Each row stands 4 px clear of a
//            6 px rule (top y 797.6 / 917.6 / 1037.6) so the figures' hard
//            shadow reads as a line under them.
//   lens     a ring, inner r 198, 12 px line (outer r 210), four 20 px ticks
//            pointing in. It is this big because at rest it has to hold slots
//            1-4 (372 px of figures, corner 184 px from its centre): the
//            brief's 300 px ring cannot.
//   "30"     Barlow 900, cap 205, right edge x 756, baseline y 1515: placed
//            for the FINAL framing (lower-right of the ring, cap ~265 px on
//            screen, stack and all below the caption band) and still whole in
//            the opening wide.
//   "2–4"    Barlow 900, cap 160, centred over slots 1-4, baseline y 526
//            (24 px above the resting ring).
//
// THE LENS'S PATH. The whole ring has to stay inside a frame that is closing
// in from the right, so the two turns sit INSIDE the ledger: row 3 right ->
// left from x 820 to 300, up round a 60 px turn (leftmost x 240), row 2 left ->
// right to x 748, up round the right turn (rightmost x 808) and row 1 right ->
// left to rest on (252, 760). The ring (r 198) still covers the end columns
// from there: column 1 passes 141 px from its centre, column 10 172 px.
//
// TIMINGS (a beat is the first frame its change is VISIBLE):
//   f0-49    the lens, 55.6 world px/f: row 3 (f0-9.4), the left turn
//            (-f12.7), row 2 (-f20.8), the apex of the right turn at f22.5,
//            then a run-out (power 2.5, same speed at its start) along row 1
//            to REST at f49; within 15 px of it from f43.
//   sinks    a figure lets go when, after the lens's closest approach on its
//            own row's pass, the lens centre is 180 px from it — the ring's
//            trailing edge is crossing it — and falls 76 px behind its rule
//            over 7 frames, quadratic ease-in; then a 22 px stub rises out of
//            the rule in its slot (ladder step 0.55). Because the turns are
//            inside the ledger, the end columns go as the lens LEAVES a turn:
//            row 3's first four with row 2's (f12-25), row 2's last four with
//            row 1's (f23-37). First: slot 30, f0.5-7.5. Last: slot 6
//            f33.5-40.5 and slot 5 f38.5-45.5; nothing but the four survivors
//            is left in row 1 after that.
//   f55-62   "2" rises · f66-73 "–4" rises (24 screen px, 8 frames)
//   f60-67   slot 3 drains to hollow · f66-73 slot 4 drains to hollow
//   f74-92   the camera steps back to k 1.26 (keys; settled by ~f99)
//   f92-99   the strike is drawn through the "30", left to right, rising:
//            a 14 px white line on a 28 px black one
//   f114-141 the chain: copy n steps out from behind copy n-1 at
//            f114 + 4(n-1), ONE 14 px step up-left over 22 frames on
//            EASE_LAND; blue, purple, orange, blue, purple, orange, blue from
//            the core outward. Seven copies are out at f141: 1-2 landed, 3-5
//            within 0.3 px, 6 at 12.9 / 14 px and 7 at 10.1 / 14 px, still
//            travelling.
//
// THE CAMERA — keyed per frame, damped by runCamera2. (cx, cy) = the world
// point at the middle of the frame.
//   f0-58    ONE ease (smoothstep on (f/58)^1.7) from the opening wide to the
//            close-up: the lens's resting point slides in a straight line on
//            screen from (252, 760) to (540, 930) while k goes 1.0 -> 1.95.
//            cx only falls, cy only falls, k only rises (checked per frame);
//            the house sway fades in behind it (f24-60) so it cannot reverse
//            any of them. The world point (540, 880) never crosses the screen
//            faster than 21.8 px/f (f49). The ring stays inside the frame: 27
//            px clear on the left at f11, 12 px on the right at f23.
//   f58-74   the close-up creeps in, k 1.95 -> 2.0.
//   f74-92   the step back, anchored on the same point, to k 1.26 with the
//            ring 50 px in from the left edge: the right end of the ledger
//            runs out of frame.
//   f92-142  a creep in to k 1.30 that is still going on the last frame.
// THE DAMPED NUMBERS (lens = the ring's centre on screen, ring l..r = its
// outer edge, px/f = how fast the world point (540, 880) crosses the screen):
//     f     k      cx      cy    lens x,y     ring l..r    px/f
//     0  1.000   540.0   960.0    820, 1000    610..1030    0.0
//     6  1.000   539.9   959.9    487, 1000    277.. 697    0.1
//    11  1.002   538.3   958.9    241,  944     31.. 452    0.6
//    16  1.011   532.4   955.2    488,  884    276.. 700    2.0
//    20  1.026   522.2   948.8    726,  889    510.. 941    3.7
//    23  1.044   510.4   941.3    844,  806    625..1063    5.3
//    28  1.091   482.2   923.5    649,  782    420.. 878    8.6
//    32  1.148   452.6   905.0    534,  794    292.. 775   11.6
//    36  1.225   418.5   883.6    459,  809    201.. 716   14.8
//    40  1.323   382.3   860.7    421,  827    143.. 698   17.8
//    44  1.441   346.8   838.1    417,  848    114.. 719   20.4
//    49  1.610   307.7   812.5    450,  875    112.. 788   21.8
//    52  1.713   288.5   799.6    478,  892    118.. 837   20.9
//    55  1.808   273.2   789.2    502,  907    122.. 881   18.2
//    58  1.881   262.6   781.7    520,  919    125.. 915   13.0
//    62  1.935   255.5   776.2    533,  929    127.. 940    5.7
//    70  1.975   252.3   772.6    539,  935    125.. 954    1.6
//    74  1.987   251.7   771.7    541,  937    123.. 958    1.4
//    78  1.906   263.4   782.2    518,  918    118.. 918   24.1
//    82  1.704   298.1   813.9    461,  868    104.. 819   37.1
//    86  1.503   342.6   854.7    404,  818     88.. 719   31.4
//    90  1.362   382.1   890.9    363,  782     77.. 649   19.8
//    92  1.318   396.2   903.9    350,  770     73.. 627   13.8
//    96  1.275   411.1   917.9    337,  759     69.. 605    4.7
//    99  1.266   414.8   921.8    334,  755     68.. 600    1.7
//   104  1.266   416.1   923.9    332,  752     66.. 598    0.3
//   116  1.276   416.2   926.6    331,  747     63.. 598    0.4
//   128  1.285   417.0   929.7    328,  742     58.. 598    0.3
//   141  1.296   418.5   932.0    324,  737     52.. 596    0.2
//   The close-up (f62-74): figures 163-167 px, ink y 864-1004, rule 1 at
//   y 1001-1012; "2–4" cap 310-318 px, y 154-476. The "30" is whole at f0
//   (x 437-760, y 1310-1519), leaves by the bottom edge on f56 and is whole
//   again from f91 (x 593-1019, y 1495-1771 on f92). The final frame (f141):
//   "2–4" cap 207 px, top at y 227; ring 544 px (x 52-596), figures 109 px;
//   rules at y 786 / 941 / 1097, running off the right edge; "30" cap 266 px
//   at x 564-982, y 1450-1721, its strike x 520-1028; the stack's top-left at
//   (437, 1330); caption band 1080-1250 holds only row 3's empty rule. Still
//   moving on f141: k +0.06 %/f, the sway, and copies 6 and 7.
// ---------------------------------------------------------------------------

export const FPS = SET_FPS;
export const DURATION = 142;

export const schema = z.object({
  /** preview aid: the caption band (screen y 1080-1250) in magenta */
  debugCaptions: z.boolean(),
  /** the block's numeral, and the two halves of what it shrinks to */
  thirty: z.string(),
  two: z.string(),
  toFour: z.string(),
  beats: z.object({
    two: z.number(), // "2" starts to rise
    toFour: z.number(), // "–4" starts to rise
    drain3: z.number(), // slot 3 starts to drain
    drain4: z.number(), // slot 4 starts to drain
    strike: z.number(), // the strike starts
    echo: z.number(), // the first chain copy steps out
  }),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = {
  debugCaptions: false,
  thirty: "30",
  two: "2",
  toFour: "–4",
  beats: { two: 55, toFour: 66, drain3: 60, drain4: 66, strike: 92, echo: 114 },
};

// -- the ledger -------------------------------------------------------------------
export const FIG = 84;
export const PITCH_X = 96;
export const PITCH_Y = 120;
export const GRID_W = 9 * PITCH_X + FIG; // 948
export const GRID_X0 = (FRAME_W - GRID_W) / 2; // 66
export const GRID_Y0 = 718; // row centres 760 / 880 / 1000
const ROW_CY = [0, 1, 2].map((r) => GRID_Y0 + r * PITCH_Y + FIG / 2);
/** the figures stand SHADOW_OFF clear of the rule, so their shadow reads */
export const ruleTop = (row: number) => GRID_Y0 + row * PITCH_Y + 0.9 * FIG + SHADOW_OFF;
const RULE_X0 = GRID_X0 - 4;
const RULE_X1 = GRID_X0 + GRID_W + 4;

export const SLOTS = PAPERS_NUMBER.map((mode, i) => {
  const p = gridPos(i, { pitchX: PITCH_X, pitchY: PITCH_Y });
  const x = GRID_X0 + p.x;
  const y = GRID_Y0 + p.y;
  return { i, mode, col: p.col, row: p.row, x, y, cx: x + FIG / 2, cy: y + FIG / 2 };
});
/** slots 1-4 are what is left: 1 and 2 hold, 3 and 4 drain to hollow */
const KEPT = 4;

// -- the lens ---------------------------------------------------------------------
export const LENS_R_IN = 198;
export const LENS_W = 12;
const LENS_R_MID = LENS_R_IN + LENS_W / 2;
export const LENS_R_OUT = LENS_R_IN + LENS_W;
const LENS_TICK = 20;

export const LENS_REST = { x: (SLOTS[0].cx + SLOTS[KEPT - 1].cx) / 2, y: ROW_CY[0] }; // 252, 760
const LENS_X_START = 820;
const TURN_XL = 300;
const TURN_XR = 748;
const TURN_R = PITCH_Y / 2;
const SEG_A = LENS_X_START - TURN_XL; // row 3, right -> left
const SEG_ARC = Math.PI * TURN_R;
const SEG_B = TURN_XR - TURN_XL; // row 2, left -> right
const SEG_C = TURN_XR - LENS_REST.x; // row 1, right -> left
export const LENS_L = SEG_A + SEG_ARC + SEG_B + SEG_ARC + SEG_C;

/** the lens centre at path length s (s < 0 runs back along row 3: where it
 *  was before the cut opened) */
export const lensXY = (s0: number) => {
  let s = s0;
  if (s <= SEG_A) return { x: LENS_X_START - s, y: ROW_CY[2] };
  s -= SEG_A;
  if (s <= SEG_ARC) {
    const a = s / TURN_R;
    return { x: TURN_XL - TURN_R * Math.sin(a), y: ROW_CY[2] - TURN_R + TURN_R * Math.cos(a) };
  }
  s -= SEG_ARC;
  if (s <= SEG_B) return { x: TURN_XL + s, y: ROW_CY[1] };
  s -= SEG_B;
  if (s <= SEG_ARC) {
    const a = s / TURN_R;
    return { x: TURN_XR + TURN_R * Math.sin(a), y: ROW_CY[1] - TURN_R + TURN_R * Math.cos(a) };
  }
  s -= SEG_ARC;
  return { x: TURN_XR - Math.min(s, SEG_C), y: ROW_CY[0] };
};

// Constant travel through rows 3 and 2 up to the APEX of the second turn, then
// a run-out into the stop that starts at that same speed (so there is no kink):
// s = S_APEX + D * (1 - (1 - t)^p).
const S_APEX = SEG_A + SEG_ARC + SEG_B + SEG_ARC / 2;
const S_RUNOUT = LENS_L - S_APEX;
/** the frame the lens is at the apex of the right-hand turn: the frame is
 *  closing in from the right, so this cannot be late */
export const LENS_APEX_F = 22.5;
export const LENS_SPEED = S_APEX / LENS_APEX_F; // world px per frame
const LENS_RUNOUT_P = 2.5;
export const LENS_REST_F = LENS_APEX_F + (LENS_RUNOUT_P * S_RUNOUT) / LENS_SPEED;
export const lensS = (f: number) => {
  if (f <= LENS_APEX_F) return LENS_SPEED * f;
  if (f >= LENS_REST_F) return LENS_L;
  const t = (f - LENS_APEX_F) / (LENS_REST_F - LENS_APEX_F);
  return S_APEX + S_RUNOUT * (1 - Math.pow(1 - t, LENS_RUNOUT_P));
};
/** the frame the lens reaches path length s (Infinity if it never does) */
const lensFrameAt = (s: number) => {
  if (s >= LENS_L) return Infinity;
  if (s <= S_APEX) return s / LENS_SPEED;
  return LENS_APEX_F + (LENS_REST_F - LENS_APEX_F) * (1 - Math.pow(1 - (s - S_APEX) / S_RUNOUT, 1 / LENS_RUNOUT_P));
};
export const lensAt = (f: number) => lensXY(lensS(f));

// -- the sinks ---------------------------------------------------------------------
// A figure lets go when, after the lens's closest approach to it (on the pass
// along the figure's own row), the lens centre is SINK_PAST px away from it:
// the ring's trailing edge is crossing it. Slots 1-4 are never that far from
// it again: the lens stops on them.
const SINK_PAST = 180;
const SINK_FRAMES = 7;
const SINK_DIST = 76; // ink height 67.2 + the 4 px stand-off + its shadow
const STUB_H = 22;
const STUB_FRAMES = 5;
const ROW_S_RANGE: Array<[number, number]> = [
  [SEG_A + SEG_ARC + SEG_B + SEG_ARC / 2, LENS_L], // row 1 (top), swept last
  [SEG_A + SEG_ARC / 2, SEG_A + SEG_ARC + SEG_B + SEG_ARC / 2],
  [-400, SEG_A + SEG_ARC / 2], // row 3 (bottom), swept first
];
export const SINK_START: number[] = SLOTS.map((slot) => {
  const [s0, s1] = ROW_S_RANGE[slot.row];
  const dist = (at: number) => {
    const p = lensXY(at);
    return Math.hypot(p.x - slot.cx, p.y - slot.cy);
  };
  let best = s0;
  let bestD = Infinity;
  for (let at = s0; at <= s1; at += 1) {
    const d = dist(at);
    if (d < bestD) {
      bestD = d;
      best = at;
    }
  }
  for (let at = best; at <= LENS_L; at += 1) {
    if (dist(at) >= SINK_PAST) return lensFrameAt(at);
  }
  return Infinity;
});

// -- the numerals -----------------------------------------------------------------
const BARLOW_CAP = 0.7;
export const N30_CAP = 205;
export const N30_SIZE = N30_CAP / BARLOW_CAP; // 292.9
export const N30_X1 = 756; // right edge (textAnchor end)
export const N30_BASE = 1515;
const N30_W = 1.09 * N30_SIZE; // the two digits' ink, measured off a still
const STRIKE_W = 14;
const STRIKE_CASE = 28; // the black line under it: it cuts through the white glyphs
const STRIKE_OVER = 30;
const STRIKE_RISE = 15; // the right end sits this far above the middle, the left below
const STRIKE_FRAMES = 8;
const N30_MID = N30_BASE - N30_CAP / 2;
const STRIKE = {
  x0: N30_X1 - N30_W - STRIKE_OVER,
  y0: N30_MID + STRIKE_RISE,
  x1: N30_X1 + STRIKE_OVER,
  y1: N30_MID - STRIKE_RISE,
};

export const N24_CAP = 160;
export const N24_SIZE = N24_CAP / BARLOW_CAP; // 200
export const N24_X = LENS_REST.x;
export const N24_BASE = LENS_REST.y - LENS_R_OUT - 24; // 522
const N24_RISE_FRAMES = 8;
const DRAIN_FRAMES = 8;

// -- the chain --------------------------------------------------------------------
// Copy n (1 = nearest the core) sits n steps up-left of the "30" and is painted
// behind copy n - 1. It starts exactly behind copy n - 1 and moves ONE step
// relative to it, so until its own start it is hidden and no sliver of it can
// show in the staircase of the copies in front.
export const ECHO_STEP = 14;
export const ECHO_EVERY = 4;
export const ECHO_COPIES = 7;
const ECHO_COLOURS = [BLUE, PURPLE, ORANGE] as const;
/** A change keyed at beat b starts one frame before it, so b is the first frame
 *  it is VISIBLE (every ease below is 0 on its own start frame). */
const lead = (b: number) => b - 1;
const echoStart = (first: number, n: number) => lead(first) + ECHO_EVERY * (n - 1);
/** how far copy n has travelled, in steps (0..n) */
export const echoSteps = (frame: number, first: number, n: number) => {
  let steps = 0;
  for (let j = 1; j <= n; j++) {
    steps += interpolate(frame, [echoStart(first, j), echoStart(first, j) + CHAIN_TRAVEL], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
  }
  return steps;
};

// -- the camera -------------------------------------------------------------------
export const K_OPEN = 1.0;
export const K_TIGHT = 1.95;
export const K_TIGHT_END = 2.0;
export const K_WIDE = 1.26;
export const K_END = 1.3;
const SX = FRAME_W / 2;
const SY = FRAME_H / 2;
const CAM_OPEN = { cx: 540, cy: 960 };
const CAM_WIDE = { cx: 419, cy: 927.5 };
/** where the four figures' row centre sits on screen in the close-up */
const TIGHT_SCREEN_Y = 930;
/** the sweep's keys run f0..SWEEP_END; damped, the frame lands ~5 frames later */
const SWEEP_END = 58;
const SWEEP_WARP = 1.7;
const BACK_F0 = 74;
const BACK_F1 = 92;

const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);
const kGeo = (k0: number, k1: number, g: number) => k0 * Math.pow(k1 / k0, g);
const tightFrame = (k: number) => ({ k, cx: LENS_REST.x, cy: LENS_REST.y + (SY - TIGHT_SCREEN_Y) / k });

// World point A slides in a straight line on screen while k eases
// geometrically (FiveDaysUndergroundTall's `anchored`).
const anchored = (
  g: number,
  a: { x: number; y: number },
  from: { k: number; cx: number; cy: number },
  to: { k: number; cx: number; cy: number },
) => {
  const k = kGeo(from.k, to.k, g);
  const sx0 = SX + (a.x - from.cx) * from.k;
  const sy0 = SY + (a.y - from.cy) * from.k;
  const sx1 = SX + (a.x - to.cx) * to.k;
  const sy1 = SY + (a.y - to.cy) * to.k;
  const sx = sx0 + (sx1 - sx0) * g;
  const sy = sy0 + (sy1 - sy0) * g;
  return { k, cx: a.x - (sx - SX) / k, cy: a.y - (sy - SY) / k };
};

// The sweep's camera does NOT follow the lens. It is ONE ease from the opening
// wide to the close-up: the lens's resting point slides in a straight line on
// screen to the middle while k rises, so cx, cy and k each move one way only
// and the frame just tightens onto the top-left four. The lens does all the
// travelling. The ease is late-weighted (SWEEP_WARP) because the frame closes
// in from the RIGHT and the lens has to round the right-hand turn first.
export const camKey = (f: number) => {
  if (f <= SWEEP_END) {
    return anchored(seg(f, 0, SWEEP_END, SWEEP_WARP), LENS_REST, { k: K_OPEN, ...CAM_OPEN }, tightFrame(K_TIGHT));
  }
  if (f <= BACK_F0) {
    return tightFrame(K_TIGHT + ((K_TIGHT_END - K_TIGHT) * (f - SWEEP_END)) / (BACK_F0 - SWEEP_END));
  }
  if (f <= BACK_F1) {
    return anchored(seg(f, BACK_F0, BACK_F1, 0.6), LENS_REST, tightFrame(K_TIGHT_END), { k: K_WIDE, ...CAM_WIDE });
  }
  // the hold: a creep toward the middle that is still going on the last frame
  const g = (f - BACK_F1) / (DURATION - BACK_F1);
  return { k: kGeo(K_WIDE, K_END, g), ...CAM_WIDE };
};

export const CAM_F: number[] = [];
export const CAM_K: number[] = [];
export const CAM_CY: number[] = [];
export const CAM_CX: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const key = camKey(f);
  CAM_F.push(f);
  CAM_K.push(key.k);
  CAM_CY.push(key.cy);
  CAM_CX.push(key.cx);
}
/** the camera the world is drawn with: damped + the house sway. The sway
 *  fades in behind the sweep, so that while the frame tightens cx, cy and k
 *  each only ever move one way. */
export const cameraAt = (frame: number) => {
  const cam = runCamera2(frame, CAM_F, CAM_CY, CAM_CX, CAM_K);
  const drift = sway(frame);
  const amt = seg(frame, 24, 60);
  return { k: cam.k, cx: cam.cx + drift.dx * amt, cy: cam.cy + drift.dy * amt };
};
/** world -> screen for that camera (for the checks) */
export const screenAt = (frame: number, x: number, y: number) => {
  const cam = cameraAt(frame);
  const t = worldTransformTall(cam.cx, cam.cy, cam.k);
  return { x: t.tx + x * cam.k, y: t.ty + y * cam.k };
};

// -- drawing ------------------------------------------------------------------------
const ID = "zid";

const Lens: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const body = (stroke: string) => (
    <g fill="none" stroke={stroke} strokeWidth={LENS_W} strokeLinecap="butt">
      <circle cx={0} cy={0} r={LENS_R_MID} />
      {[0, 90, 180, 270].map((deg) => (
        <line key={deg} x1={0} y1={-LENS_R_MID} x2={0} y2={-(LENS_R_IN - LENS_TICK)} transform={`rotate(${deg})`} />
      ))}
    </g>
  );
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
      <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{body(SHADOW)}</g>
      {body(INK)}
    </g>
  );
};

const ZeroedItDown: React.FC<Props> = ({ debugCaptions, thirty, two, toFour, beats }) => {
  const frame = useCurrentFrame();
  const { k, cx, cy } = cameraAt(frame);
  const lens = lensAt(frame);

  // -- the "30", its strike and its chain ---------------------------------------------
  const thirtyText = (fill: string, d = 0) => (
    <text x={N30_X1 + d} y={N30_BASE + d} textAnchor="end" fill={fill} style={type(N30_SIZE, 900)}>
      {thirty}
    </text>
  );
  const strikeP = interpolate(frame, [lead(beats.strike), lead(beats.strike) + STRIKE_FRAMES], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    ...clamp,
  });
  // the white line on a black one twice its weight: `grow` px longer at each
  // end, so the casing closes round the line's ends and leads its tip
  const strikeLen = Math.hypot(STRIKE.x1 - STRIKE.x0, STRIKE.y1 - STRIKE.y0);
  const strikeU = { x: (STRIKE.x1 - STRIKE.x0) / strikeLen, y: (STRIKE.y1 - STRIKE.y0) / strikeLen };
  const strikeLine = (stroke: string, width: number, grow = 0) => (
    <line
      x1={STRIKE.x0 - strikeU.x * grow}
      y1={STRIKE.y0 - strikeU.y * grow}
      x2={STRIKE.x0 + strikeU.x * (strikeLen * strikeP + grow)}
      y2={STRIKE.y0 + strikeU.y * (strikeLen * strikeP + grow)}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="butt"
    />
  );
  const copies: React.ReactNode[] = [];
  for (let n = ECHO_COPIES; n >= 1; n--) {
    if (frame < echoStart(beats.echo, n)) continue;
    const d = -ECHO_STEP * echoSteps(frame, beats.echo, n);
    copies.push(<g key={n}>{thirtyText(ECHO_COLOURS[(n - 1) % 3], d)}</g>);
  }

  // -- "2–4": one line of type, its two halves rising separately ----------------------
  const rise2 = textRise(frame, lead(beats.two), k, { frames: N24_RISE_FRAMES });
  const rise4 = textRise(frame, lead(beats.toFour), k, { frames: N24_RISE_FRAMES });
  // both halves are always laid out (so the line is centred as a whole); the
  // half that is not this layer's is laid out with no ink
  const twoFour = (which: 0 | 1, fill: string, dy: number) => (
    <text x={N24_X} y={N24_BASE + dy} textAnchor="middle" fill={fill} style={type(N24_SIZE, 900)}>
      <tspan fillOpacity={which === 0 ? 1 : 0}>{two}</tspan>
      <tspan fillOpacity={which === 1 ? 1 : 0}>{toFour}</tspan>
    </text>
  );
  const twoFourHalf = (which: 0 | 1, r: { dy: number; opacity: number }) =>
    r.opacity > 0 ? (
      <g opacity={r.opacity >= 1 ? undefined : r.opacity}>
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{twoFour(which, SHADOW, r.dy)}</g>
        {twoFour(which, INK, r.dy)}
      </g>
    ) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={540} cyRest={900} />
      <WorldTall cx={cx} cy={cy} k={k} id={`${ID}-world`}>
        <defs>
          {[0, 1, 2].map((r) => (
            <clipPath key={r} id={`${ID}-row-${r}`} clipPathUnits="userSpaceOnUse">
              <rect x={-4000} y={-4000} width={9000} height={4000 + ruleTop(r)} />
            </clipPath>
          ))}
        </defs>

        {/* the ledger: a row at a time, everything that stands on a rule is
            clipped at that rule's top edge (the rule is the occluder) */}
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <g clipPath={`url(#${ID}-row-${r})`}>
              {SLOTS.filter((s) => s.row === r).map((s) => {
                const start = SINK_START[s.i];
                const u = Math.max(0, Math.min(1, (frame - start) / SINK_FRAMES));
                const drop = SINK_DIST * u * u; // lets go, then falls
                const stubP = Number.isFinite(start)
                  ? interpolate(frame, [start + SINK_FRAMES - 1, start + SINK_FRAMES - 1 + STUB_FRAMES], [0, 1], {
                      easing: EASE_LAND,
                      ...clamp,
                    })
                  : 0;
                // slots 3 and 4: the fill drains out from the top down
                const drainAt = s.i === 2 ? beats.drain3 : s.i === 3 ? beats.drain4 : null;
                const drain =
                  drainAt === null
                    ? 0
                    : interpolate(frame, [lead(drainAt), lead(drainAt) + DRAIN_FRAMES], [0, 1], {
                        easing: Easing.inOut(Easing.sin),
                        ...clamp,
                      });
                const level = s.y + 0.1 * FIG - 1 + drain * (0.8 * FIG + SHADOW_OFF + 2);
                return (
                  <g key={s.i}>
                    {stubP > 0 ? (
                      <g opacity={OP_MID}>
                        <rect
                          x={s.cx - STROKE / 2 + SHADOW_OFF}
                          y={ruleTop(r) - STUB_H * stubP + SHADOW_OFF}
                          width={STROKE}
                          height={STUB_H * stubP}
                          fill={SHADOW}
                        />
                        <rect x={s.cx - STROKE / 2} y={ruleTop(r) - STUB_H * stubP} width={STROKE} height={STUB_H * stubP} fill={INK} />
                      </g>
                    ) : null}
                    {u >= 1 ? null : drain <= 0 ? (
                      <Figure x={s.x} y={s.y + drop} size={FIG} mode={s.mode} />
                    ) : (
                      <>
                        <Figure x={s.x} y={s.y} size={FIG} mode="hollow" />
                        {drain < 1 ? (
                          <>
                            <defs>
                              <clipPath id={`${ID}-drain-${s.i}`} clipPathUnits="userSpaceOnUse">
                                <rect x={s.x - 20} y={level} width={FIG + 40} height={FIG + 40} />
                              </clipPath>
                            </defs>
                            <g clipPath={`url(#${ID}-drain-${s.i})`}>
                              <Figure x={s.x} y={s.y} size={FIG} mode="solid" />
                            </g>
                          </>
                        ) : null}
                      </>
                    )}
                  </g>
                );
              })}
            </g>
            <rect x={RULE_X0 + SHADOW_OFF} y={ruleTop(r) + SHADOW_OFF} width={RULE_X1 - RULE_X0} height={STROKE} fill={SHADOW} />
            <rect x={RULE_X0} y={ruleTop(r)} width={RULE_X1 - RULE_X0} height={STROKE} fill={INK} />
          </g>
        ))}

        {/* the "30": chain copies (furthest first), then the white core on its
            shadow, then the strike (white on its black casing), which belongs
            to the white one only */}
        {copies}
        {thirtyText(SHADOW, SHADOW_OFF)}
        {thirtyText(INK)}
        {strikeP > 0 ? (
          <>
            {strikeLine(SHADOW, STRIKE_CASE, (STRIKE_CASE - STRIKE_W) / 2)}
            {strikeLine(INK, STRIKE_W)}
          </>
        ) : null}

        {twoFourHalf(0, rise2)}
        {twoFourHalf(1, rise4)}

        <Lens x={lens.x} y={lens.y} />
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default ZeroedItDown;
