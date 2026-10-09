import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_OVERSIZE,
  BLACK,
  CAM_DAMP,
  CAM_STIFF,
  ChainEcho,
  COLLAR_Y,
  DRIFT_H,
  INK,
  PAPER_BASE,
  PAPER_BLUR,
  PAPER_DIM,
  PAPER_PARALLAX,
  PAPER_SRC,
  SHADOW,
  SHADOW_OFF,
  SHAFT_LEFT,
  SHAFT_RIGHT,
  SHAFT_W,
  SectionEarth,
  ShadowText,
  camEase,
  clamp,
  levelOpen,
  sway,
  textRise,
  type,
} from "./cerroShared";
import { CA_BOUNDS, CA_PATH } from "./cerroMapData";

// ---------------------------------------------------------------------------
// CERRO OPENING, TALL — the 9:16 sibling (1080 x 1920) of `CerroOpening.tsx`,
// cuts 1 + 2 of the Brent Underwood / Core Memory set, for a separate vertical
// video. One master on ONE GLOBAL CLOCK, cut by the `cut` prop:
//   cut 1 "CerroGordoTall"          global 0-64   (65 f, butt join)
//   cut 2 "EightHundredMillionTall" global 65-196 (132 f = 116 speech + 16)
// Same audio, same durations, same word tables, same gestures as the 16:9 cut;
// only the framing, the sizes and the camera are re-authored. The 16:9 file
// and cerroShared are not touched (this file copies what it needs).
//
// CHECK LINES — what the viewer can say after each cut, sound off:
//   cut 1: "Cerro Gordo is up in the eastern mountains of California, right by
//           the Nevada line."
//   cut 2: "The money came straight up out of the ground at that exact spot: a
//           shaft under the pin, and a pile of bullion on top."
//
// THE LINES (LOCAL frames)
//   cut 1 "So right now we are at Cerro Gordo California"
//     So right now f0 | we are at f11 | Cerro f35 | California ~f56 | end f65
//   cut 2 "Out of that hole right there they pulled something like $800
//          million worth of minerals"
//     Out of that hole f0 | right there f20 | they pulled f32 | something
//     like f51 | $800 f72 | million ~f81 | worth of minerals f90 | end f116
//
// 9:16 FRAMING (the user's rule): the action at the true middle or a little
// above; y 1080-1250 (their captions) free of anything that must be read;
// the subject fills the width; text out of the top 200 / bottom 300 px.
//
// TRANSLATED from 16:9: the world (California in plan -> the mountain in
// section at the same origin), the black pin and its chain trail, the black
// labels on land, the plunge / whiteout / ridge / pin-lift / shaft, the
// 36-ingot stream and its arc, the stepped chain crown on the stack, the
// drawn "≈", the readout prop, every beat frame.
// REIMAGINED for the tall frame:
//   * f0: the state is fitted to the WIDTH (1000 px wide = 1159 tall). Its
//     box is 0.86 as wide as tall, so the brief's 1500 px tall would crop
//     107 px off both the north coast and the south-east corner.
//   * Cut 1's push lands with the pin at (700, 900), not x 540, and ends at
//     k 0.245 so the southern coast stays a recognisable piece of the state
//     in the lower left. The Nevada line cuts in from the right just north
//     of the pin, so the labels sit UP-LEFT of it, right-aligned on x 630
//     (40 px clear of the pin's column, so the falling trail crosses no
//     letter): CERRO GORDO 90 px over CALIFORNIA 84 px (black at 0.7),
//     y 697-841, wholly on land for every k of the cut (polygon check).
//   * "Right there" shows THE DEPTH: the collar at y ~600, the shaft and
//     its levels running down the frame (k 0.86), the stream rising the
//     whole height of it. In the shaft each ingot is drawn on its own hard
//     shadow, deepest first, so the column reads as stacked bars.
//   * The payoff frames THE PAIR, shaft + stack, centred on x 540: the
//     shaft is 399 world px left of the stack's centre, so a stack centred
//     on 540 would push the hole off the left edge. The push lands at
//     k 1.218 and the hold creeps +4% to 1.266, where the shaft's left wall
//     and the stack's right foot are each 60 px inside the frame. The
//     stack's foot is on y 1120 (770-800 px wide); "$800" 231-240 px and
//     MILLION 141-147 px (900) sit over it from y ~365-390 to 700.
//   * Three more east drifts (this file only, via SectionEarth's
//     extra-holes hook) so the lower half of the payoff reads as a mine.
//   * "none": the same framing, the stack's centre at y ~900.
//
// GESTURES (global f; cut 2 local in brackets) — as the 16:9 cut
//   f0      California exists, already creeping                 "So right now"
//   f11-31  THE PUSH to the state's SE half (k 0.220 at f35)     "we are at"
//   f25-64  a creep about the pin, 1.09x; the Nevada line and the
//           southern coast in frame on every frame
//   f26     THE PIN drops, colours trailing 2 f apart            "Cerro"
//   f34-46  CERRO GORDO slides up, up-left of the pin            "Cerro Gordo"
//   f50-62  CALIFORNIA slides up under it at 0.7                 "California"
//   f65-75 (0-10)  THE PLUNGE into the pin's tip; labels out in 6 f;
//           whiteout ~f9                                         "Out of that hole"
//   f75-82 (10-17) the ridge line comes down onto the collar
//   f80-96 (15-31) the pin lifts out straight up
//   f83 (18) THE SHAFT opens top-down; the camera pulls back to
//           the depth view (f13-27)                              "right there"
//   f97-131 (32-66) THE STREAM: 36 ingots up the shaft and over
//           onto the bench                                       "they pulled ..."
//   f118-130 (53-65) THE PAYOFF PUSH (lands ~f70)
//   f127 (62) THE ECHO on the stack: orange, purple +2, blue +4   "$800"
//   f132 (67) "≈ $800" slides up; f141 (76) "MILLION" (800M only)
//   f130-196 creep (+4%, eased, about the pair's centre)          "worth of minerals"
//
// THE CAMERA — the 16:9 rig: (ln k, origin's screen offset), one key per
// frame, the house damper, the plunge driven directly. Damped (800M):
//     g    k       dlnk/f   origin (the collar) on screen
//     0    0.0844   0.00%   (665, 1053)  the state centred
//     20   0.1135   5.43%   the push
//     35   0.2203   1.40%   (699, 905)   the pin lands
//     64   0.2443   0.13%   (700, 900)   cut 1 ends, still a map
//     72   plunge: up to ~27%/f, the pin's fastest frame ~41 px
//     75   1.2000   8.68%   (580, 700)   whiteout, on the tip
//     85   1.1086  -2.57%   the pull-back to the depth view
//     97   0.8706  -0.63%   (333, 602)   "they pulled"
//     118  0.8419  -0.07%   (330, 618)
//     125  0.9352   2.99%   THE PAYOFF PUSH
//     135  1.1937   0.91%   (150, 1093)  "$800" lands
//     146  1.2224   0.05%   (138, 1120)
//     196  1.2654   0.03%   (124, 1120)  the creep, +4% over the hold
//   readout "none": the same zooms, the stack's foot on y 1075.
// The paper is PeakForSolar's portrait ground (the landscape still turned 90
// degrees), scaling on ln k (<= 1.2x, under 1.0x of source).
// ---------------------------------------------------------------------------

const W = 1080;
const H = 1920;

export const FPS = 24;
export const CUT1_DURATION = 65;
export const CUT2_OFFSET = 65;
export const CUT2_DURATION = 132;
export const MASTER_DURATION = CUT2_OFFSET + CUT2_DURATION; // 197
export const DURATION = MASTER_DURATION;

export const schema = z.object({
  cut: z.enum(["1", "2", "master"]),
  readout: z.enum(["800M", "none"]),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ cut: "master", readout: "800M" });

// ---------------------------------------------------------------------------
// BEATS, global frames (cut 2 local = global - 65)
// ---------------------------------------------------------------------------
const B = {
  weAreAt: 11, // push begins
  cerro: 35, // the pin lands
  california: 56,
  cut2: CUT2_OFFSET, // "Out of that hole"
  rightThere: CUT2_OFFSET + 20,
  theyPulled: CUT2_OFFSET + 32,
  somethingLike: CUT2_OFFSET + 51,
  eightHundred: CUT2_OFFSET + 72,
  million: CUT2_OFFSET + 81,
  worthOf: CUT2_OFFSET + 90,
  end: CUT2_OFFSET + 116,
};

// ---------------------------------------------------------------------------
// GEOMETRY
// ---------------------------------------------------------------------------
const CA_W = CA_BOUNDS[1][0] - CA_BOUNDS[0][0];
const CA_CX = (CA_BOUNDS[0][0] + CA_BOUNDS[1][0]) / 2;
const CA_CY = (CA_BOUNDS[0][1] + CA_BOUNDS[1][1]) / 2;
// f0: the whole state, fitted to the WIDTH (its bounding box is 0.86 as wide
// as it is tall, so "1500 px tall" would run 107 px off both sides): 1000 px
// wide = 1159 px tall, centred on the true middle.
export const CA_SCREEN_W = 1000;
export const K_MAP = CA_SCREEN_W / CA_W;
export const K_PIN = 0.225; // cut 1 at "Cerro": the SE half, Nevada line + southern coast in frame
export const K_CREEP = 1.09; // cut 1 f35-64 creeps only this much more (ends k 0.245: the coast stays)
export const K_DIVE = 1.2; // cut 2's plunge lands here: the frame is all land
// the pin's tip on screen through cut 1's creep: at the middle height, 160 px
// right of centre so CERRO GORDO fits ABOVE it wholly on land (the Nevada
// line cuts in from the right just north of the pin)
const PIN_SCREEN = { x: 700, y: 900 };
const PIN_SCREEN_DIVE = { x: 580, y: 700 }; // ... and at the bottom of the plunge (a short enough trip that the pin never moves > 45 px/f)

// the pin (SCREEN px, tip at 0,0)
const PIN_R = 30;
const PIN_D = 60; // tip to head centre
const PIN_HOLE = 11;
const PIN_TAN = { x: PIN_R * Math.sin(Math.PI / 3), y: -PIN_D + PIN_R * Math.cos(Math.PI / 3) };
const pinPath = (x: number, y: number) =>
  `M${x} ${y} L${x + PIN_TAN.x} ${y + PIN_TAN.y} A${PIN_R} ${PIN_R} 0 1 0 ${x - PIN_TAN.x} ${y + PIN_TAN.y} Z`;
const PIN_START = 26; // the core leaves; ~95% down by "Cerro" f35
const PIN_DROP = 600; // screen px it falls: from above the frame top

// the labels (SCREEN px, black on the white land), UP-LEFT of the pin — under
// it is the caption strip. Both lines are right-aligned on x 630, 40 px clear
// of the pin's column (x 670-730), so the falling trail never crosses a
// letter. CERRO GORDO 90 px (x 62-630, y 697-760) with CALIFORNIA 84 px under
// it (y 782-841). Checked against the California polygon with a 10 px pad for
// every k of the cut (0.21-0.245): every letter is on land.
const NAME_SIZE = 90;
const STATE_SIZE = 84;
const LABEL_RIGHT = 630 - PIN_SCREEN.x; // right edge, relative to the pin
const NAME_BASE = 760 - PIN_SCREEN.y; // baseline, relative to the tip
const STATE_BASE = NAME_BASE + 22 + STATE_SIZE * 0.7;
const STATE_OPACITY = 0.7; // solid black at 0.7: it holds at phone width

// the bars: Cerro Gordo silver-lead bullion, chunky flat trapezoids (WORLD px)
const BAR_BOT = 72;
const BAR_TOP = 60;
const BAR_H = 32;
const BAR_PITCH = 78; // 6 px of paper between two bars at the foot
const ROW_GAP = 3; // and a hairline of paper between rows
const ROW_PITCH = BAR_H + ROW_GAP;
const ROWS = 8;
const STACK_X0 = 90; // the pyramid's left foot, 40 px clear of the shaft wall
export const STACK_X = STACK_X0 + ((ROWS - 1) * BAR_PITCH + BAR_BOT) / 2; // 399
const STACK_H = ROWS * ROW_PITCH - ROW_GAP; // 277
export const N_BARS = (ROWS * (ROWS + 1)) / 2; // 36
const BAR_V = 52; // world px / frame up the shaft
const BAR_FLIGHT = 13; // frames from the collar to the slot
const FIRST_LAND = CUT2_OFFSET + 45;
const LAST_LAND = CUT2_OFFSET + 66;
const ARC_LEAD = 110; // the landing comes straight down from this far above

type Slot = { x: number; y: number; row: number };
const SLOTS: Slot[] = (() => {
  const s: Slot[] = [];
  for (let r = 0; r < ROWS; r++) {
    const n = ROWS - r;
    // right to left, away from the collar first
    for (let i = n - 1; i >= 0; i--) {
      s.push({ x: STACK_X + (i - (n - 1) / 2) * BAR_PITCH, y: -r * ROW_PITCH, row: r });
    }
  }
  return s;
})();
const LAND = SLOTS.map((_, i) => FIRST_LAND + (LAST_LAND - FIRST_LAND) * Math.pow(i / (N_BARS - 1), 0.62));
const SURFACE = LAND.map((a) => a - BAR_FLIGHT);

const barD = (bx: number, by: number) =>
  `M${bx - BAR_BOT / 2} ${by} L${bx - BAR_TOP / 2} ${by - BAR_H} L${bx + BAR_TOP / 2} ${by - BAR_H} L${bx + BAR_BOT / 2} ${by} Z`;

// One row of the pyramid as a solid band from bar xl to bar xr, reaching down
// over the paper hairline to the row below, so the stack is one silhouette.
const rowSil = (r: number, xl: number, xr: number) => {
  const yb = -r * ROW_PITCH + (r > 0 ? ROW_GAP : 0);
  const yt = -r * ROW_PITCH - BAR_H;
  return `M${xl - BAR_BOT / 2} ${yb} L${xl - BAR_TOP / 2} ${yt} L${xr + BAR_TOP / 2} ${yt} L${xr + BAR_BOT / 2} ${yb} Z`;
};
const rowEnds = (r: number) => {
  const n = ROWS - r;
  return [STACK_X - ((n - 1) / 2) * BAR_PITCH, STACK_X + ((n - 1) / 2) * BAR_PITCH];
};
// the whole pyramid (the echo's shape)
const STACK_SIL = Array.from({ length: ROWS }, (_, r) => rowSil(r, ...(rowEnds(r) as [number, number]))).join(" ");
// what has landed by g (rows fill right to left, so it is one band per row):
// the bars' hard shadows are masked out of it, so the paper between two
// bars stays paper and only the stack's outside edge carries the shadow
const landedSil = (g: number) => {
  const parts: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    const xs = SLOTS.filter((sl, i) => sl.row === r && g >= LAND[i]).map((sl) => sl.x);
    if (xs.length) parts.push(rowSil(r, Math.min(...xs), Math.max(...xs)));
  }
  return parts.join(" ");
};

// MORE MINE, in this file only (SectionEarth's extra-holes hook; the shared
// geometry is untouched): three more east drifts off the shaft, so the lower
// half of the payoff frame reads as a mine. They unroll with the shaft front
// exactly like the shared levels.
const EXTRA_LEVELS = [
  { y: 112, len: 210 },
  { y: 350, len: 560 },
  { y: 478, len: 400 },
];
const extraHoles = (open: number) =>
  EXTRA_LEVELS.map((L) => ({ x: SHAFT_RIGHT - 1, y: L.y, w: L.len * levelOpen(open, L) + 1, h: DRIFT_H })).filter((h) => h.w > 1.5);

// the echo on the stack
const ECHO_START = CUT2_OFFSET + 62; // orange; purple +2, blue +4
const ECHO_FROM = STACK_H + 3 * 12 + 10;

// the readout (WORLD px; at the payoff k 1.215 -> 1.264: numeral 231 -> 240 px,
// MILLION 141 -> 147 px, Barlow 900, white on the 4 px hard shadow)
const NUM_SIZE = 190;
const MIL_SIZE = 116;
const MIL_TRACK = 0.08;
const CROWN_TOP = -STACK_H - 36;
const MIL_BASE = CROWN_TOP - 20;
const NUM_BASE = MIL_BASE - MIL_SIZE * 0.7 - 20 - NUM_SIZE * 0.081;
const NUM_W = 2.282 * NUM_SIZE; // "$800", measured on Barlow 900
const APPROX_W = 0.5 * NUM_SIZE;
const APPROX_GAP = 0.12 * NUM_SIZE;
const READ_W = APPROX_W + APPROX_GAP + NUM_W;
const READ_X0 = STACK_X - READ_W / 2;
const NUM_IN = CUT2_OFFSET + 67; // "$800"
const MIL_IN = CUT2_OFFSET + 76; // "million"

// ---------------------------------------------------------------------------
// THE CAMERA. State = (ln k, sx, sy): ln of the zoom and the SCREEN offset of
// the world origin (the collar / Cerro Gordo) from the frame centre. Keyed
// once per frame, damped by the house tracker. Zooming in log space and
// moving the origin's screen position (not the world centre) is what makes a
// fly-in read as one even push onto the point.
// ---------------------------------------------------------------------------
type Cam = { k: number; sx: number; sy: number };
// a key: the zoom and where the world origin (the collar) sits ON SCREEN
type Key = { k: number; ox: number; oy: number };
const sOf = (ox: number, oy: number) => ({ sx: ox - W / 2, sy: oy - H / 2 });
const sOfPin = (p: { x: number; y: number }) => sOf(p.x, p.y);

// cut 1
const PUSH = { f0: B.weAreAt, f1: 31, warp: 0.8 }; // lands ahead of "Cerro"
const CREEP = { f0: 25, f1: 64 }; // overlaps the push's tail so it never stalls
const CREEP0 = 0.004; // ln k per frame before the push
// cut 2 (global)
// THE PLUNGE is driven DIRECTLY, not through the damper (as in the 16:9 cut).
const DIVE = { f0: CUT2_OFFSET, f1: CUT2_OFFSET + 10, warp: 1.7 }; // accelerating
const M1 = { f0: CUT2_OFFSET + 13, f1: CUT2_OFFSET + 27, warp: 0.8 }; // pull back: the section, in depth
const M2 = { f0: CUT2_OFFSET + 27, f1: CUT2_OFFSET + 53, warp: 1 }; // creep through the stream
const M3 = { f0: CUT2_OFFSET + 53, f1: CUT2_OFFSET + 65, warp: 0.85 }; // THE PAYOFF PUSH
const M4 = { f0: CUT2_OFFSET + 65, f1: MASTER_DURATION, warp: 1 }; // creep
const K_END = 1.04; // M4's creep: +4% over the hold, eased, about the pair's centre
const KEY_DIVE: Key = { k: K_DIVE, ox: PIN_SCREEN_DIVE.x, oy: PIN_SCREEN_DIVE.y };
// THE DEPTH: the collar in the upper third, the shaft and its levels down the frame
const KEY_DEPTH: Key = { k: 0.86, ox: 325, oy: 600 };
const KEY_STREAM: Key = { k: 0.84, ox: 330, oy: 620 };
// THE PAYOFF frames THE PAIR, shaft + stack (world x -50..708), centred on
// x 540. At the END of the creep the shaft's left wall is 60 px inside the
// left edge (k 1.266) and the stack's right foot 60 px inside the right.
const PAIR_X = (SHAFT_LEFT + STACK_X0 + (ROWS - 1) * BAR_PITCH + BAR_BOT) / 2; // 329
const K_PAY_END = (W / 2 - 60) / (PAIR_X - SHAFT_LEFT); // 1.266
const K_PAY = K_PAY_END / K_END; // 1.218 when the push lands
const payoffKey = (k: number, baseY: number): Key => ({ k, ox: W / 2 - PAIR_X * k, oy: baseY });
const CAM_PLAN = {
  // 800M: the stack's foot on y 1120, the readout over it from y ~390
  "800M": { baseY: 1120 },
  // none: the same framing, the stack's centre at y ~900
  none: { baseY: 900 + (STACK_H / 2) * K_PAY_END },
};

const targetAt = (g: number, readout: Props["readout"]): Cam => {
  const pay = CAM_PLAN[readout];
  const lk0 = Math.log(K_MAP);
  const lkPush0 = lk0 + CREEP0 * PUSH.f0;
  const sAbout = (kk: number) => sOf(W / 2 - CA_CX * kk, H / 2 - CA_CY * kk);
  const cut1 = (gg: number): Cam => {
    if (gg <= PUSH.f0) {
      const k = Math.exp(lk0 + CREEP0 * gg);
      return { k, ...sAbout(k) };
    }
    const e = camEase((gg - PUSH.f0) / (PUSH.f1 - PUSH.f0), PUSH.warp);
    const c = camEase((gg - CREEP.f0) / (CREEP.f1 - CREEP.f0), 1);
    const k = Math.exp(lkPush0 + (Math.log(K_PIN) - lkPush0) * e + Math.log(K_CREEP) * c);
    const s0 = sAbout(Math.exp(lkPush0));
    const s1 = sOfPin(PIN_SCREEN);
    return { k, sx: s0.sx + (s1.sx - s0.sx) * e, sy: s0.sy + (s1.sy - s0.sy) * e };
  };
  if (g < CUT2_OFFSET) return cut1(g);
  const seg = (m: { f0: number; f1: number; warp: number }, a: Key, b: Key): Cam => {
    const e = camEase((g - m.f0) / (m.f1 - m.f0), m.warp);
    const k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * e);
    return { k, ...sOf(a.ox + (b.ox - a.ox) * e, a.oy + (b.oy - a.oy) * e) };
  };
  if (g < M1.f0) return seg(M1, KEY_DIVE, KEY_DIVE);
  if (g < M2.f0) return seg(M1, KEY_DIVE, KEY_DEPTH);
  if (g < M3.f0) return seg(M2, KEY_DEPTH, KEY_STREAM);
  if (g < M4.f0) return seg(M3, KEY_STREAM, payoffKey(K_PAY, pay.baseY));
  // the creep zooms about the pair's centre on the stack's foot line
  const e = camEase((g - M4.f0) / (M4.f1 - M4.f0), M4.warp);
  const key = payoffKey(K_PAY * Math.exp(Math.log(K_END) * e), pay.baseY);
  return { k: key.k, ...sOf(key.ox, key.oy) };
};

const buildTrack = (readout: Props["readout"]) => {
  const out: Cam[] = [];
  const t0 = targetAt(0, readout);
  let lk = Math.log(t0.k);
  let sx = t0.sx;
  let sy = t0.sy;
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k: t0.k, sx, sy });
  let from: Cam = out[0];
  for (let g = 1; g <= MASTER_DURATION + 2; g++) {
    if (g === DIVE.f0) from = { k: Math.exp(lk), sx, sy };
    if (g >= DIVE.f0 && g <= DIVE.f1) {
      // THE PLUNGE: log zoom straight into the pin's tip, accelerating, then
      // landing on zero velocity at K_DIVE (the whiteout).
      const e = camEase((g - DIVE.f0 + 1) / (DIVE.f1 - DIVE.f0 + 1), DIVE.warp);
      const s1 = sOfPin(PIN_SCREEN_DIVE);
      const nlk = Math.log(from.k) + (Math.log(K_DIVE) - Math.log(from.k)) * e;
      const nsx = from.sx + (s1.sx - from.sx) * e;
      const nsy = from.sy + (s1.sy - from.sy) * e;
      // at the landing frame the tracker inherits a fraction of the last
      // step, so the plunge eases into the hold instead of overshooting it
      const hand = g === DIVE.f1 ? 0.35 : 1;
      vk = (nlk - lk) * hand;
      vx = (nsx - sx) * hand;
      vy = (nsy - sy) * hand;
      lk = nlk;
      sx = nsx;
      sy = nsy;
      out.push({ k: Math.exp(lk), sx, sy });
      continue;
    }
    const t = targetAt(g, readout);
    vk += (Math.log(t.k) - lk) * CAM_STIFF - vk * CAM_DAMP;
    lk += vk;
    vx += (t.sx - sx) * CAM_STIFF - vx * CAM_DAMP;
    sx += vx;
    vy += (t.sy - sy) * CAM_STIFF - vy * CAM_DAMP;
    sy += vy;
    out.push({ k: Math.exp(lk), sx, sy });
  }
  return out;
};
export const CAM_TRACK = { "800M": buildTrack("800M"), none: buildTrack("none") };

// the paper under the fly-in: it scales on ln k, not k, so it never passes
// 1.0x of source (1 + 0.07 ln(k / K_MAP) <= 1.2; the cover fit is 0.7985)
const PAPER_LNK = 0.07;

// ---------------------------------------------------------------------------
// TIMING HELPERS
// ---------------------------------------------------------------------------
const ramp = (g: number, f0: number, f1: number, easing: (t: number) => number) =>
  interpolate(g, [f0, f1], [0, 1], { easing, ...clamp });

// the plan -> section wipe: the ridge line comes down out of the sky
// (it starts under the plunge's whiteout, local f10: the frame is all land)
const WIPE = { f0: CUT2_OFFSET + 10, f1: CUT2_OFFSET + 17, from: 680 };
const WIPE_EASE = Easing.bezier(0.3, 0, 0.2, 1);
// the pin lifts out
// lifts out straight up once the ridge is on the collar ("out of that hole")
const PIN_OUT = { f0: CUT2_OFFSET + 15, f1: CUT2_OFFSET + 31, dist: 800 };
// the shaft front: eases in, then runs down at a constant speed
// ... from the exact point the pin's tip left ("right there")
const SHAFT = { f0: CUT2_OFFSET + 18, v: 85, ease: 5 };
const shaftOpen = (g: number) => {
  const t = g - SHAFT.f0;
  if (t <= 0) return 0;
  if (t < SHAFT.ease) return (SHAFT.v * t * t) / (2 * SHAFT.ease);
  return SHAFT.v * (t - SHAFT.ease / 2);
};

// a bar's position (bottom-centre) at global frame g, or null
const barAt = (i: number, g: number) => {
  const T = SURFACE[i];
  const slot = SLOTS[i];
  if (g >= LAND[i]) return { x: slot.x, y: slot.y, landed: true };
  if (g < T) {
    const y = COLLAR_Y + BAR_V * (T - g);
    if (y > 2600) return null; // far below any tall frame
    return { x: 0, y, landed: false };
  }
  const tau = (g - T) / BAR_FLIGHT;
  const u = tau + tau * tau - tau * tau * tau; // w'(0) = 1 (keeps the shaft speed), w'(1) = 0 (soft landing)
  const p1 = { x: 0, y: COLLAR_Y - (BAR_V * BAR_FLIGHT) / 3 };
  const p2 = { x: slot.x, y: slot.y - ARC_LEAD };
  const p3 = { x: slot.x, y: slot.y };
  const a = 1 - u;
  return {
    x: 3 * a * a * u * p1.x + 3 * a * u * u * p2.x + u * u * u * p3.x,
    y: a * a * a * COLLAR_Y + 3 * a * a * u * p1.y + 3 * a * u * u * p2.y + u * u * u * p3.y,
    landed: false,
  };
};

// "≈", drawn: Barlow's latin subset has no U+2248
const approxD = (x0: number, base: number, size: number) => {
  const w = APPROX_W;
  const A = 0.055 * size;
  const mid = base - 0.35 * size;
  const gap = 0.2 * size;
  const line = (yc: number) => {
    const pts: string[] = [];
    for (let j = 0; j <= 24; j++) {
      const x = x0 + (w * j) / 24;
      pts.push(`${x.toFixed(1)} ${(yc - A * Math.sin((2 * Math.PI * j) / 24)).toFixed(1)}`);
    }
    return `M${pts.join(" L")}`;
  };
  return `${line(mid - gap / 2)} ${line(mid + gap / 2)}`;
};

// ---------------------------------------------------------------------------
// THE GROUND AND THE WORLD, portrait. PeakForSolar's PaperGround: the
// landscape photograph (3864 x 2164) in a 1920*1.6 x 1080*1.6 box turned 90
// degrees, objectFit cover (0.7985 of source), `brightness(0.88) blur(3px)`
// on the image only, drift -0.3 px/frame; the offset follows the origin's
// screen motion at parallax 0.15 and the scale follows ln k (see PAPER_LNK).
// ---------------------------------------------------------------------------
const PaperTall: React.FC<{ frame: number; offset: { x: number; y: number }; scale: number }> = ({ frame, offset, scale }) => (
  <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
    <Img
      src={staticFile(PAPER_SRC)}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: H * BG_OVERSIZE,
        height: W * BG_OVERSIZE,
        objectFit: "cover",
        filter: `brightness(${PAPER_DIM}) blur(${PAPER_BLUR}px)`,
        transform: `translate(-50%, -50%) translate(${offset.x.toFixed(2)}px, ${(offset.y - frame * 0.3).toFixed(2)}px) scale(${scale.toFixed(4)}) rotate(90deg)`,
      }}
    />
  </AbsoluteFill>
);

const WorldTall: React.FC<{ sx: number; sy: number; k: number; children: React.ReactNode }> = ({ sx, sy, k, children }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: "0 0",
        transform: `translate(${W / 2 + sx}px, ${H / 2 + sy}px) scale(${k})`,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {children}
      </svg>
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// THE COMPONENT
// ---------------------------------------------------------------------------
const ID = "cerro-open-tall";

export const CerroOpeningTall: React.FC<Props> = ({ cut, readout }) => {
  const local = useCurrentFrame();
  const g = cut === "2" ? local + CUT2_OFFSET : local;

  const cam0 = CAM_TRACK[readout][Math.min(g, MASTER_DURATION + 2)];
  const sw = sway(g);
  const sx = cam0.sx + sw.dx;
  const sy = cam0.sy + sw.dy;
  const k = cam0.k;
  const start = CAM_TRACK[readout][0];
  // where the collar / Cerro Gordo is on screen
  const P = { x: W / 2 + sx, y: H / 2 + sy };

  const section = g >= WIPE.f0;
  const lift = section ? WIPE.from * (1 - ramp(g, WIPE.f0, WIPE.f1, WIPE_EASE)) : 0;
  const open = shaftOpen(g);

  // -- the pin ----------------------------------------------------------------
  const pinOut = ramp(g, PIN_OUT.f0, PIN_OUT.f1, Easing.in(Easing.sin)) * PIN_OUT.dist;
  const pinVisible = g >= PIN_START && pinOut < PIN_OUT.dist - 1;
  const pinX = P.x;
  const pinY = P.y - pinOut;
  // The pin is MAP INK: black on the white land like its labels (a white
  // pin on white land read as a "9" — only its shadow side showed). A black
  // shape casts no visible hard shadow, so it has none; its echo is the
  // chain crown.
  const pinRender = (fill: string) =>
    fill === "none" ? null : fill === BLACK ? (
      <g>
        <path d={pinPath(pinX, pinY)} fill={BLACK} />
        <circle cx={pinX} cy={pinY - PIN_D} r={PIN_HOLE} fill={INK} />
      </g>
    ) : (
      <path d={pinPath(pinX, pinY)} fill={fill} />
    );

  // -- the labels (cut 1), out at the top of cut 2 ------------------------------
  const nameT = textRise(g, B.cerro - 1, 1, { out: CUT2_OFFSET, outFrames: 6 });
  const stateT = textRise(g, B.california - 6, 1, { out: CUT2_OFFSET, outFrames: 6 });

  // -- the bars ----------------------------------------------------------------
  // `bars` = surfaced (in the air or landed); `rising` = still in the shaft
  const bars: { x: number; y: number }[] = [];
  const rising: { x: number; y: number }[] = [];
  if (g >= CUT2_OFFSET) {
    for (let i = 0; i < N_BARS; i++) {
      const b = barAt(i, g);
      if (b) (g < SURFACE[i] ? rising : bars).push(b);
    }
  }
  const numT = textRise(g, NUM_IN, k);
  const milT = textRise(g, MIL_IN, k);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperTall
        frame={g}
        offset={{ x: (sx - start.sx) * PAPER_PARALLAX, y: (sy - start.sy) * PAPER_PARALLAX }}
        scale={1 + PAPER_LNK * Math.log(k / K_MAP)}
      />

      <WorldTall sx={sx} sy={sy} k={k}>
        <defs>
          {/* bars live above the ground and in the open shaft only */}
          <clipPath id={`${ID}-bars`}>
            <rect x={-8000} y={-8000} width={16000} height={8000 + COLLAR_Y} />
            <rect x={SHAFT_LEFT} y={COLLAR_Y} width={SHAFT_W} height={Math.max(0, open)} />
          </clipPath>
          {/* the echo shows only above the ground and outside the stack */}
          <clipPath id={`${ID}-sky`}>
            <rect x={-8000} y={-8000} width={16000} height={8000 + COLLAR_Y} />
          </clipPath>
          <mask id={`${ID}-not-stack`} maskUnits="userSpaceOnUse" x={-1000} y={-2000} width={3000} height={2400}>
            <rect x={-1000} y={-2000} width={3000} height={2400} fill="#FFFFFF" />
            <path d={STACK_SIL} fill="#000000" />
          </mask>
          <mask id={`${ID}-not-landed`} maskUnits="userSpaceOnUse" x={-8000} y={-8000} width={16000} height={16000}>
            <rect x={-8000} y={-8000} width={16000} height={16000} fill="#FFFFFF" />
            <path d={landedSil(g)} fill="#000000" />
          </mask>
        </defs>

        {/* THE LAND. Cut 1: California, plan view, on a 4 SCREEN px shadow.
            Cut 2: the earth in section, its ridge line coming down out of
            the sky onto the collar. */}
        {!section ? (
          <g>
            <path d={CA_PATH} fill={SHADOW} transform={`translate(${SHADOW_OFF / k} ${SHADOW_OFF / k})`} />
            <path d={CA_PATH} fill={INK} />
          </g>
        ) : (
          <SectionEarth idPrefix={ID} lift={lift} open={open} extraHoles={extraHoles(open)} />
        )}

        {section ? (
          <g>
            {/* every bar's shadow, under every bar, and never inside the
                landed stack: the paper between two bars stays paper */}
            <g mask={`url(#${ID}-not-landed)`}>
              <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
                <g clipPath={`url(#${ID}-bars)`}>
                  {bars.map((b, i) => (
                    <path key={i} d={barD(b.x, b.y)} fill={SHADOW} />
                  ))}
                </g>
              </g>
            </g>
            {/* THE ECHO: the whole stack's silhouette, three times, rising
                from behind it into a stepped crown. */}
            <g clipPath={`url(#${ID}-sky)`}>
              <g mask={`url(#${ID}-not-stack)`}>
                <ChainEcho
                  frame={g}
                  start={ECHO_START}
                  core="none"
                  order="colorsLead"
                  from={{ dx: 0, dy: ECHO_FROM }}
                  render={(fill) => <path d={STACK_SIL} fill={fill} />}
                />
              </g>
            </g>
            {/* IN THE SHAFT each ingot is drawn on its OWN hard shadow, deepest
                first, so a bar's black edge falls on the one below it: the
                column reads as stacked ingots, not a faint ladder */}
            <g clipPath={`url(#${ID}-bars)`}>
              {[...rising].reverse().map((b, i) => (
                <g key={i}>
                  <path d={barD(b.x + SHADOW_OFF, b.y + SHADOW_OFF)} fill={SHADOW} />
                  <path d={barD(b.x, b.y)} fill={INK} />
                </g>
              ))}
            </g>
            <g clipPath={`url(#${ID}-bars)`}>
              {bars.map((b, i) => (
                <path key={i} d={barD(b.x, b.y)} fill={INK} />
              ))}
            </g>

            {readout === "800M" && numT.opacity > 0 ? (
              <g opacity={numT.opacity} transform={`translate(0 ${numT.dy})`}>
                <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
                  <path
                    d={approxD(READ_X0, NUM_BASE, NUM_SIZE)}
                    stroke={SHADOW}
                    strokeWidth={0.105 * NUM_SIZE}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>
                <path
                  d={approxD(READ_X0, NUM_BASE, NUM_SIZE)}
                  stroke={INK}
                  strokeWidth={0.105 * NUM_SIZE}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <ShadowText text="$800" x={READ_X0 + APPROX_W + APPROX_GAP} y={NUM_BASE} size={NUM_SIZE} anchor="start" />
              </g>
            ) : null}
            {readout === "800M" && milT.opacity > 0 ? (
              <ShadowText
                text="MILLION"
                x={STACK_X}
                y={MIL_BASE + milT.dy}
                size={MIL_SIZE}
                weight={900}
                tracking={MIL_TRACK}
                opacity={milT.opacity}
              />
            ) : null}
          </g>
        ) : null}
      </WorldTall>

      {/* SCREEN LAYER: the pin and its labels keep their size through the
          fly-in, like any map marker. */}
      <AbsoluteFill>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {pinVisible ? (
            <ChainEcho
              frame={g}
              start={PIN_START}
              order="coreLeads"
              core="travel"
              from={{ dx: 0, dy: -PIN_DROP }}
              ink={BLACK}
              shadow="none"
              render={pinRender}
            />
          ) : null}
          {nameT.opacity > 0 ? (
            <text
              x={P.x + LABEL_RIGHT}
              y={P.y + NAME_BASE + nameT.dy}
              textAnchor="end"
              fill={BLACK}
              opacity={nameT.opacity}
              style={type(NAME_SIZE, 900)}
            >
              CERRO GORDO
            </text>
          ) : null}
          {stateT.opacity > 0 ? (
            <text
              x={P.x + LABEL_RIGHT + 0.06 * STATE_SIZE}
              y={P.y + STATE_BASE + stateT.dy}
              textAnchor="end"
              fill={BLACK}
              opacity={stateT.opacity * STATE_OPACITY}
              style={type(STATE_SIZE, 800, 0.06)}
            >
              CALIFORNIA
            </text>
          ) : null}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default CerroOpeningTall;
