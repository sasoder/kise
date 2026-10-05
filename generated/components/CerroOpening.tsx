import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  CAM_DAMP,
  CAM_STIFF,
  ChainEcho,
  COLLAR_Y,
  FRAME_H,
  FRAME_W,
  INK,
  OP_MID,
  PaperGround,
  SHADOW,
  SHADOW_OFF,
  SHAFT_LEFT,
  SHAFT_W,
  SectionEarth,
  ShadowText,
  camEase,
  clamp,
  sway,
  textRise,
  type,
  World,
} from "./cerroShared";
import { CA_BOUNDS, CA_PATH } from "./cerroMapData";

// ---------------------------------------------------------------------------
// CERRO OPENING — Brent Underwood / Core Memory trailer, cuts 1 + 2, one
// master on ONE GLOBAL CLOCK, cut into two files by the `cut` prop.
//   cut 1 "CerroGordo"          global 0-64   (65 f, no tail: cut 2 butts on)
//   cut 2 "EightHundredMillion" global 65-196 (132 f = 116 speech + 16 tail)
// Every clock (paper drift, camera, sway, the stream) runs on the GLOBAL frame,
// so the butt join is pure continuity: cut 2 f0 IS master f65.
// 1920 x 1080, 24 fps, opaque, the core memory podcast graphic standard (16:9)
// on `cerroShared.tsx`.
//
// THE LINES (trailer SRT, refined on the word-level transcript)
//   cut 1 "So right now we are at Cerro Gordo California"  0.000-2.711 s
//     So right now 0.000 f0 | we are at 0.459 f11 | Cerro 1.460 f35 |
//     California ~2.340 f56 | cut 2 begins 2.711 f65
//   cut 2 "Out of that hole right there they pulled something like $800
//          million worth of minerals"  2.711-7.549 s  (LOCAL frames)
//     Out of that hole f0 | right there f20 | they pulled f32 |
//     something like f51 | $800 f72 | million ~f81 | worth of minerals f90 |
//     speech end f116 -> DURATION round(4.838 * 24) = 116 + 16 tail = 132
//
// THE WORLD. World px, origin = Cerro Gordo = the collar of the shaft. Cut 1
// is California in plan (scripts/us-states-10m.json, Teale Albers, 13 world
// px/km, generated into cerroMapData.ts); cut 2 is the mountain in SECTION
// (cerroShared MINE) at the same origin, so "the map becomes the section" is
// one world, not a cut. The nearest California boundary (the Nevada line, NE)
// is 981 world px from the origin: the frame is all land from k ~1.1, which
// is where the plunge whites out and the section swaps in, unseen.
//
// v2 (director's review): cut 1 STAYS A MAP — the push is capped at ~2.2x
// the opening by "Cerro" and creeps only 1.22x more, so the coast, the Nevada
// line and the paper are in every frame of cut 1. The dive moved into cut 2,
// motivated by "out of that hole". The payoff got a push-in so the stack and
// the readout are big, and the bars lost their inner shadow marks.
//
// THE CHAIN: one echoed moment per cut, on the payoff.
//   cut 1 — THE PIN (Cerro): it drops from above the frame and the three
//     colours trail it 2 f apart, closing up into its crown (12 px steps).
//   cut 2 — THE STACK ($800 million): the whole pyramid's silhouette, three
//     times, rising from behind it into a stepped crown (clipped above the
//     ground, masked out of the stack so it shows only as the stripes).
//
// GESTURES (global f; cut 2 local in brackets) — each with its word
//   f0      California exists, 820 px tall, already creeping  "So right now"
//   f11-31  THE PUSH: one eased move to the state's SE half    "we are at"
//           (k 0.134 at f35, 2.2x), the pin's spot to (1000, 330)
//   f25-64  a creep about the pin, 1.22x in all; the coast and the Nevada
//           line stay in frame on every frame
//   f26     THE PIN drops (core f26, blue 28, purple 30, orange
//           32), ~95% down on f35, crown closed by ~f45       "Cerro"
//   f33-45  CERRO GORDO slides up under-left of the pin, on land "Cerro Gordo"
//   f50-62  CALIFORNIA slides up at 0.55                      "California"
//   f65-75 (0-10) THE PLUNGE: log zoom straight into the pin's
//           tip, accelerating to 35%/f; the labels slide down
//           + fade over f0-6; the frame whites out at ~f9      "Out of that hole"
//   f75-82 (10-17) under the whiteout the section swaps in and
//           the ridge line comes down out of the sky onto the
//           collar — the pin's tip is on the surface the whole time
//   f80-94 (15-29) the pin lifts out straight up (ease-in)     "out of that hole"
//   f83 (18) THE SHAFT opens top-down from where the tip left,
//           85 world px/f, each level unrolling as it passes;
//           the camera pulls back to the section (f13-27)      "right there"
//   f97-131 (32-66) THE STREAM: 36 ingots rise up the shaft
//           (52 world px/f), surface at the collar (first on
//           f97 "pulled") and arc onto an 8-row pyramid on the
//           bench; landings accelerate f110 -> f131 (^0.62)    "they pulled ... something like"
//   f118-130 (53-65) THE PAYOFF PUSH: one eased move in onto the
//           stack (lands ~f70): stack ~660 px, "$800" 231 px,
//           MILLION 84 px, the shaft + its top level running
//           out of the bottom, the mountain shoulder left
//   f127 (62) THE ECHO on the stack: orange 62, purple 64,
//           blue 66, crown read by ~(72)                       "$800"
//   f132 (67) "≈ $800" slides up (800M only)                   "$800"
//   f141 (76) "MILLION" slides up (800M only)                  "million"
//   f130-196 (65-131) only a creep (k x1.02)                    "worth of minerals"
//   readout "none": no text; the same push, centred on the stack alone (k 1.1).
//
// THE BARS: chunky flat trapezoids 72/60 x 32, 78 pitch, a 3 px paper
// hairline between rows. Their hard shadows are masked out of the LANDED
// stack, so the paper between two bars stays paper (no inner "T" marks) and
// only the stack's outside edge — and any bar in flight — carries the shadow.
//
// THE CAMERA. State (ln k, sx, sy): the zoom in LOG space and the screen
// offset of the origin, keyed once per frame and damped by the house tracker
// (CAM_STIFF / CAM_DAMP), plus `sway` in screen px. EXCEPT THE PLUNGE
// (cut 2 f0-10), which is driven directly from the damped camera's own state
// at f64 and hands back a third of its last step: a damped plunge lags 5-6
// frames and would still show the coast when the section must arrive.
// Damped values (800M):
//     g    k       dlnk/f   content centre (world)   origin on screen
//     0    0.0597   0.00%   (-1481, -1102)  CA centre (1048, 586)
//     20   0.0768   4.48%   the push
//     35   0.1339   1.38%   SE half of the state           (1002, 338)
//     47   0.1473   0.73%   creep                          (1000, 330)
//     64   0.1632   0.30%   cut 1 ends: still a map        (1000, 330)
//     68   0.1932  10.22%   THE PLUNGE
//     72   0.5642  35.13%                                  (975, 430)
//     74   1.0637  28.32%   whiteout
//     75   1.2000  12.06%   lands on the tip               (960, 490)
//     77   1.2395   0.99%   settles under the ridge
//     85   1.1113  -2.65%   the pull-back to the section
//     97   0.8706  -0.63%   "they pulled"
//     118  0.8419  -0.07%   creep through the stream
//     125  0.8960   1.79%   THE PAYOFF PUSH
//     135  1.0374   0.55%   "$800" lands
//     146  1.0520   0.02%   "million"
//     196  1.0705   0.01%   (300, -196)
//   readout "none": the same to f118, then to k 1.12 at (399, -139).
// The pin's screen position moves at most ~27 px/f in the plunge. The paper
// scales on ln k (1 + 0.07 ln(k / 0.0597) <= 1.22), never over 1.0x of
// source; it follows the origin's screen motion at parallax 0.15.
//
// DEVIATIONS (approved in review)
//   * THE PIN IS BLACK (map ink, like its labels), with a white eye and no
//     shadow: a white pin on the white land read as a "9". The labels are
//     black because they sit ON the white land.
//   * The pin and labels live in SCREEN space (a map marker keeps its size);
//     everything else is world.
//   * "≈" is drawn (two sine strokes): Barlow's latin subset has no U+2248.
// ---------------------------------------------------------------------------

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
const CA_H = CA_BOUNDS[1][1] - CA_BOUNDS[0][1];
const CA_CX = (CA_BOUNDS[0][0] + CA_BOUNDS[1][0]) / 2;
const CA_CY = (CA_BOUNDS[0][1] + CA_BOUNDS[1][1]) / 2;
export const CA_SCREEN_H = 820;
export const K_MAP = CA_SCREEN_H / CA_H; // f0 zoom: the state 820 px tall
export const K_PIN = 0.135; // cut 1 at "Cerro": ~2.3x the opening, the SE half of the state
export const K_CREEP = 1.22; // cut 1 f35-64 creeps only this much more onto the pin
export const K_DIVE = 1.2; // cut 2's plunge lands here: the frame is all land from k 1.1
const LIFT = 20; // content centre on screen y 520
const PIN_SCREEN = { x: 1000, y: 330 }; // the pin's tip on screen through cut 1's creep
const PIN_SCREEN_DIVE = { x: 960, y: 490 }; // ... and at the bottom of the plunge

// the pin (SCREEN px, tip at 0,0)
const PIN_R = 30;
const PIN_D = 60; // tip to head centre
const PIN_HOLE = 11;
const PIN_TAN = { x: PIN_R * Math.sin(Math.PI / 3), y: -PIN_D + PIN_R * Math.cos(Math.PI / 3) };
const pinPath = (x: number, y: number) =>
  `M${x} ${y} L${x + PIN_TAN.x} ${y + PIN_TAN.y} A${PIN_R} ${PIN_R} 0 1 0 ${x - PIN_TAN.x} ${y + PIN_TAN.y} Z`;
const PIN_START = 26; // the core leaves; ~95% down by "Cerro" f35
const PIN_DROP = 600; // screen px it falls: from above the frame top

// the labels (SCREEN px, black on the white land), set under-left of the pin
// so every letter sits on California (checked against the polygon at k >= 0.125)
const NAME_SIZE = 120;
const STATE_SIZE = 56;
const LABEL_DX = -160;
const NAME_BASE = 36 + NAME_SIZE * 0.7; // below the tip
const STATE_BASE = NAME_BASE + 22 + STATE_SIZE * 0.7;

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

// the echo on the stack
const ECHO_START = CUT2_OFFSET + 62; // orange; purple +2, blue +4
const ECHO_FROM = STACK_H + 3 * 12 + 10;

// the readout (WORLD px; at the payoff k 1.05: numeral 231 px, MILLION 84 px)
const NUM_SIZE = 220;
const MIL_SIZE = 80;
const MIL_TRACK = 0.08;
const CROWN_TOP = -STACK_H - 36;
const MIL_BASE = CROWN_TOP - 26;
const NUM_BASE = MIL_BASE - MIL_SIZE * 0.7 - 24 - NUM_SIZE * 0.081;
const NUM_W = 2.282 * NUM_SIZE; // "$800", measured on Barlow 900
const APPROX_W = 0.5 * NUM_SIZE;
const APPROX_GAP = 0.12 * NUM_SIZE;
const READ_W = APPROX_W + APPROX_GAP + NUM_W;
const READ_X0 = STACK_X - READ_W / 2;
const READ_TOP = NUM_BASE - 0.791 * NUM_SIZE; // the "$" ascender
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
const sFromCentre = (wx: number, wy: number, k: number) => ({ sx: -wx * k, sy: -LIFT - wy * k });
const sOfPin = (p: { x: number; y: number }) => ({ sx: p.x - FRAME_W / 2, sy: p.y - FRAME_H / 2 });

// cut 1
const PUSH = { f0: B.weAreAt, f1: 31, warp: 0.8 }; // lands ahead of "Cerro"
const CREEP = { f0: 25, f1: 64 }; // overlaps the push's tail so it never stalls
const CREEP0 = 0.004; // ln k per frame before the push
// cut 2 (global)
// THE PLUNGE is driven DIRECTLY, not through the damper: a damped plunge lags
// 5-6 frames and is still showing the coast when the section has to arrive.
// It starts from the damped camera's own state at cut 1's last frame and ends
// on zero velocity, so the tracker picks up from it without a seam.
const DIVE = { f0: CUT2_OFFSET, f1: CUT2_OFFSET + 10, warp: 1.7 }; // accelerating
const M1 = { f0: CUT2_OFFSET + 13, f1: CUT2_OFFSET + 27, warp: 0.8 }; // pull back: the section
const M2 = { f0: CUT2_OFFSET + 27, f1: CUT2_OFFSET + 53, warp: 1 }; // creep through the stream
const M3 = { f0: CUT2_OFFSET + 53, f1: CUT2_OFFSET + 65, warp: 0.85 }; // THE PAYOFF PUSH
const M4 = { f0: CUT2_OFFSET + 65, f1: MASTER_DURATION, warp: 1 }; // creep
// the section framing after the plunge, then the payoff
const WC_DIVE = { x: 0, y: (FRAME_H / 2 - LIFT - PIN_SCREEN_DIVE.y) / K_DIVE };
const CAM_PLAN = {
  // 800M: stack ~650 px, readout's "$" 50 world px under the frame top, the
  // shaft and its top level running out of the bottom, the shoulder left
  "800M": {
    wc1: { x: 140, y: 140 },
    k1: 0.86,
    wc2: { x: 170, y: 90 },
    k2: 0.84,
    k3: 1.05,
    wc3: { x: 300, y: READ_TOP - 80 + (FRAME_H / 2 - LIFT) / 1.05 },
  },
  // none: the same move, centred on the stack alone
  none: { wc1: { x: 140, y: 140 }, k1: 0.86, wc2: { x: 170, y: 90 }, k2: 0.84, k3: 1.1, wc3: { x: STACK_X, y: -STACK_H / 2 } },
};
const K_END = 1.02; // M4's creep

const targetAt = (g: number, readout: Props["readout"]): Cam => {
  const plan = CAM_PLAN[readout];
  const lk0 = Math.log(K_MAP);
  const lkPush0 = lk0 + CREEP0 * PUSH.f0;
  const sAbout = (kk: number) => sFromCentre(CA_CX, CA_CY, kk);
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
  if (g < M1.f0) {
    // the target after the plunge: held on the pin's tip at K_DIVE
    return { k: K_DIVE, ...sOfPin(PIN_SCREEN_DIVE) };
  }
  const seg = (m: { f0: number; f1: number; warp: number }, ka: number, kb: number, a: { x: number; y: number }, b: { x: number; y: number }) => {
    const e = camEase((g - m.f0) / (m.f1 - m.f0), m.warp);
    const k = Math.exp(Math.log(ka) + (Math.log(kb) - Math.log(ka)) * e);
    return { k, ...sFromCentre(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e, k) };
  };
  if (g < M2.f0) return seg(M1, K_DIVE, plan.k1, WC_DIVE, plan.wc1);
  if (g < M3.f0) return seg(M2, plan.k1, plan.k2, plan.wc1, plan.wc2);
  if (g < M4.f0) return seg(M3, plan.k2, plan.k3, plan.wc2, plan.wc3);
  return seg(M4, plan.k3, plan.k3 * K_END, plan.wc3, plan.wc3);
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

// the paper under a 21x fly-in: it scales on ln k, not k, so it never passes
// 1.0x of source (bgScale 1 + 0.07 ln(k / K_MAP) <= 1.214 at the close-up)
const PAPER_LNK = 0.07;

// ---------------------------------------------------------------------------
// TIMING HELPERS
// ---------------------------------------------------------------------------
const ramp = (g: number, f0: number, f1: number, easing: (t: number) => number) =>
  interpolate(g, [f0, f1], [0, 1], { easing, ...clamp });

// the plan -> section wipe: the ridge line comes down out of the sky
// (it starts under the plunge's whiteout, local f10: the frame is all land)
const WIPE = { f0: CUT2_OFFSET + 10, f1: CUT2_OFFSET + 17, from: 470 };
const WIPE_EASE = Easing.bezier(0.3, 0, 0.2, 1);
// the pin lifts out
// lifts out straight up once the ridge is on the collar ("out of that hole")
const PIN_OUT = { f0: CUT2_OFFSET + 15, f1: CUT2_OFFSET + 29, dist: 600 };
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
    if (y > 1400) return null;
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
// THE COMPONENT
// ---------------------------------------------------------------------------
const ID = "cerro-open";

export const CerroOpening: React.FC<Props> = ({ cut, readout }) => {
  const local = useCurrentFrame();
  const g = cut === "2" ? local + CUT2_OFFSET : local;

  const cam0 = CAM_TRACK[readout][Math.min(g, MASTER_DURATION + 2)];
  const sw = sway(g);
  const sx = cam0.sx + sw.dx;
  const sy = cam0.sy + sw.dy;
  const k = cam0.k;
  const cx = -sx / k;
  const cy = -sy / k;
  const start = CAM_TRACK[readout][0];
  // where the collar / Cerro Gordo is on screen
  const P = { x: FRAME_W / 2 + sx, y: FRAME_H / 2 + sy };

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
  const nameT = textRise(g, B.cerro - 2, 1, { out: CUT2_OFFSET, outFrames: 6 });
  const stateT = textRise(g, B.california - 6, 1, { out: CUT2_OFFSET, outFrames: 6 });

  // -- the bars ----------------------------------------------------------------
  const bars: { x: number; y: number }[] = [];
  if (g >= CUT2_OFFSET) {
    for (let i = 0; i < N_BARS; i++) {
      const b = barAt(i, g);
      if (b) bars.push(b);
    }
  }
  const numT = textRise(g, NUM_IN, k);
  const milT = textRise(g, MIL_IN, k);

  return (
    <AbsoluteFill style={{ backgroundColor: "#C0C0C0" }}>
      <PaperGround
        frame={g}
        cx={cx}
        cy={cy}
        cxRest={cx}
        cyRest={cy}
        k={k}
        offset={{ x: (sx - start.sx) * 0.15, y: (sy - start.sy) * 0.15 }}
        scale={1 + PAPER_LNK * Math.log(k / K_MAP)}
      />

      <World cx={cx} cy={cy} k={k}>
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
          <SectionEarth idPrefix={ID} lift={lift} open={open} />
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
                weight={800}
                tracking={MIL_TRACK}
                opacity={milT.opacity}
              />
            ) : null}
          </g>
        ) : null}
      </World>

      {/* SCREEN LAYER: the pin and its labels keep their size through the
          fly-in, like any map marker. */}
      <AbsoluteFill>
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {nameT.opacity > 0 ? (
            <text
              x={P.x + LABEL_DX}
              y={P.y + NAME_BASE + nameT.dy}
              textAnchor="middle"
              fill={BLACK}
              opacity={nameT.opacity}
              style={type(NAME_SIZE, 900)}
            >
              CERRO GORDO
            </text>
          ) : null}
          {stateT.opacity > 0 ? (
            <text
              x={P.x + LABEL_DX - (0.06 * STATE_SIZE) / 2}
              y={P.y + STATE_BASE + stateT.dy}
              textAnchor="middle"
              fill={BLACK}
              opacity={stateT.opacity * OP_MID}
              style={type(STATE_SIZE, 800, 0.06)}
            >
              CALIFORNIA
            </text>
          ) : null}
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
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default CerroOpening;
