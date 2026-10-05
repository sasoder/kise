import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { hash } from "./fieldShared";
import {
  BLUE,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  CROWN_STEP,
  EASE_LAND,
  Inked,
  OP_LOW,
  OP_MID,
  ORANGE,
  PURPLE,
  PaperGround,
  Person,
  SHADOW_OFF,
  World,
  camEase,
  camMove169,
  clamp,
  fontFamily,
  runCamera2,
  sway,
  textRise,
} from "./cerroShared";

export const FPS = 24;
// Trailer sequence SRT: "The old caretaker handed me this keyring with like 80
// keys on it. And he's just like — good luck". The graphic opens on "The",
// trailer 26.526 s, and ENDS on the onset of "good luck", 30.989 s, where the
// editor cuts back to Brent's face: round((30.989 - 26.526) * 24) = 107. Plus
// an 8-frame HANDLE that simply continues the hold, so the editor can trim to
// the cut point: 107 + 8 = 115.
export const DURATION = 115;

// ---------------------------------------------------------------------------
// "EIGHTY KEYS" — cut 4 of the Cerro Gordo trailer (Core Memory podcast,
// Ashlee Vance x Brent Underwood). 1920 x 1080, 24 fps, opaque, on the
// trailer's shared paper / ink / crown / camera from `cerroShared.tsx`.
//
// v2, on the director's review: the v1 radial burst read as a sunburst / spiky
// gear, the echo crossed inside the ring, and the caretaker ballooned at the
// frame edge. Now: a JAILER'S HOOP whose keys hang under gravity, the crown is
// clipped outside the hoop, and the camera opens tighter with a gentle push.
//
// THE IDEA (the director's): the hoop is handed over, then it turns out to
// carry 80 keys. The caretaker (Robert Desmarais — no name on screen) stands
// left with five keys on the hoop in his hand; the hoop leaves him in one arc
// to the frame centre (to Brent — to us), swings to rest, and on "80" the keys
// slide out along the hoop until 80 hang off it. The text names the number;
// the bunch IS the count. Then the weight: a dip and one slow swing, and the
// editor cuts to his face.
//
// WORD -> FRAME (chunk onsets from the SRT, words inside refined off the
// episode's word-level transcript):
//   The old caretaker      26.526   f0
//   caretaker             ~27.25    f17
//   handed me this keyring 27.861   f32
//   keyring               ~28.12    f38
//   with like              28.779   f54
//   80                    ~29.14    f63
//   keys                  ~29.78    f78
//   on it                  30.197   f88
//   And he's just like     30.489   f95
//   good luck (CUT POINT)  30.989   f107     handle to f114
//
// THE MATERIAL. White ink on its hard black copy at +4/+4 world px (`Inked`)
// on the dimmed squared paper. The world is laid out so the rest camera is
// k 1.0: world px = screen px on the payoff.
//   THE HOOP: a white circle stroke 14 px, radius 155, on its hard shadow. It
//   is painted over every bow, so it threads them, and it is never covered.
//   A KEY (v3, on "too skinny — reads as a comb") is a bold antique-key
//   icon that reads at half size on its own: ~210 px overall, a hollow bow 64
//   px across with a 26 px hole (round, a trefoil of three bold loops, or an
//   oval), a collar ring and a bead, an 18 px shank, and a 44 x 38 bit with two
//   clear notches (three notch patterns). Variants by a stable hash.
//   HANGING: the bow's centre sits RADIALLY 22.5 px outside the hoop's
//   centre-line, so the hoop runs along the top of the loop and the hole shows
//   just below it; the key hangs from there at phi + 0.65 * (90 - phi)
//   (radial mixed 0.65 toward straight down), +-3 deg of hash jitter. Bits
//   fan OUTWARD (away from the bunch's centre line). Every key layer is
//   clipped outside the hoop's inner edge: the hoop's interior is only paper.
//   SLOTS BY SEPARATION: neighbours are separated by arc pitch x sin(A), A the
//   angle between the hoop's tangent and the key (1 at the bottom, ~0.25 up
//   the sides), so slot density follows sin(A): dense at the bottom, sparse up
//   the sides, an even gap all round. Bow centres at phi 90 +- 104 (the bows'
//   ink covers the lower ~240 deg); the crown's ends sit on paper.
//   DEPTH BY LAYER, NOT BY COUNT: front 22 keys at 1.0, alternating long /
//   short by 36 px so neighbouring bits never fuse; mid 28 at the 0.55 rung and
//   back 30 at the 0.3 rung, offset half a slot, a little longer (186 / 196)
//   and a little narrower in span, filling in behind. Each layer is one union
//   with its own one-piece hard shadow.
//   PAINT ORDER: back, mid, THE CROWN, front, hoop — so no pale bow ever sits
//   over a colour and the crown's tapering ends tuck under the front bows.
//
// THE GESTURES — one continuous motion: rise, toss, swing, fan, dip, swing.
//   f-2..10 THE CARETAKER RISES with his hoop and five keys as one group, the
//           text-rise entrance (24 screen px up, 0 -> 1, 12 f, ease-out),
//           started 2 f before the cut so f0 is never blank — "The old caretaker"
//   f30-53  THE HANDOVER: the hoop's top leaves his hand on one eased arc (a
//           quadratic Bezier lifting ~90 world px) to the frame centre. The
//           hoop hangs on a simulated damped pendulum (period 16 f, zeta 0.6)
//           driven by the arc, so it trails as it is tossed (+19.8 deg, f38)
//           and swings forward as it lands (-12.8 deg, f46).
//                                                   — "handed me this keyring"
//   f46-62  ONE SWING TO REST: the same pendulum, through 0 at f57, +0.45 deg
//           at f60, still by f64.                      — into "with like"
//   f59     THE ECHO, the cut's one chain moment: three copies of the HOOP,
//           orange f59 / purple f61 / blue f63, rising 36 / 24 / 12 px over
//           22 f on EASE_LAND, each CLIPPED TO OUTSIDE the white hoop's outer
//           edge, so only a crown of 12 px arcs shows above the hoop's clear
//           top arc. Painted behind the keys.                   — lands on "80"
//   f60-76  THE FAN: from the bunch the keys slide out ALONG the hoop, one
//           sweep each way. Departures stream out of the bunch: the farthest
//           keys leave first (f60) and travel 16 f, the nearest leave last
//           (~f67) and travel ~7 f, so no key ever crosses one already home and
//           all 80 hang by f76. Each key rides its own damped pendulum (period
//           11 f, zeta 0.42) driven by its bow's acceleration along the hoop:
//           it trails as it is carried and swings down into its hanging angle
//           as it settles. The five bunch keys open from 12 deg apart to their
//           slots on the same rule.                    — "with like 80 keys"
//   f64-84  THE LOAD: the hoop's top dips 10 px as the keys arrive.
//   f66-78  "80 KEYS" (Barlow 900, 190 / 118 px) slides up below the bunch
//           (textRise, 24 screen px, 12 f)                 — lands on "keys"
//   f81-115 THE WEIGHT: one slow damped swing of the whole hoop about its top:
//           +2.8 deg at f88-89, back through 0 at f99, -0.8 at f102-105,
//           -0.2 by f114. The crown stays vertical.  — "on it / and he's just like"
//   Nothing else. No jingle, no sparkle, no spin.
//
// THE CAMERA — four keyed moves through the house damped tracker (`runCamera2`,
// `camMove169`, content centre on screen y 520):
//   OPEN   f0-21   k 0.77 -> 0.775: the caretaker is 380 screen px tall, left
//                  of centre, the hoop in his hand, keys ~125 px.
//   PUSH   f21-59  k 0.775 -> 1.04 (1.35x the open), x -> 960: the pan lets him
//                  slide out of frame left at his own size, peak 42.7 screen
//                  px/frame (f48); he is gone by f59.
//   EASE   f60-78  k 1.04 -> 1.0 (warp 0.75), centre -> the hoop + text block:
//                  the room for the bunch, as it fills.
//   CREEP  f82-115 k 1.0 -> 1.018, the held breath before "good luck".
//   DAMPED NUMBERS, printed off the real tracker by out/cerro/c-entry/probe.ts
//   (alpha = the hoop's swing, deg clockwise; vL = his right edge's screen
//   speed, px/frame, while he is in frame):
//     f    k          cx        cy     alpha   vL
//     0    0.7700   -100.96    521.16    0.00   0.0
//     17   0.7733    -95.74    521.05    0.00   0.4
//     32   0.8012     11.17    517.89    1.68   17.9
//     45   0.9158    466.66    504.86  -11.60   41.6
//     54   0.9983    794.22    495.91   -2.04   36.4
//     59   1.0269    907.98    492.86    0.38   (out)
//     63   1.0353    946.65    494.32    0.26
//     70   1.0238    959.92    522.14   -0.04
//     78   1.0051    960.12    557.72    0.00
//     88   1.0005    960.00    567.15    2.82
//     107  1.0123    960.00    567.01   -0.76
//     114  1.0165    960.00    566.93   -0.23
//   (cy includes CAM_LIFT_169 / k; the hand-held `sway` rides on top.)
//   At rest the crown's top is at screen ~147 and "80 KEYS"'s baseline ~889
//   (v3's longer keys moved the derived centres ~22 px; the keys are unchanged).
//
// LOCAL VARIATIONS of the shared module (cerroShared untouched):
//   * HoopEcho: `ChainEcho` travels all three colours from ONE shared offset
//     and cannot clip; here each copy rises from 0 to its own step and is
//     clipped outside the hoop. Same colours, steps, stagger, travel, ease.
//   * The hoop's stroke is 14 px, not STROKE (6): the director's call, so the
//     hoop reads as THE ring at every frame.
// ---------------------------------------------------------------------------

export const schema = z.object({
  keyCount: z.number().int(),
  label: z.string(),
  labelSub: z.string(),
  beats: z.object({
    rise: z.number(), // "The old caretaker"   — he rises with the hoop
    toss: z.number(), // "handed me"           — the arc starts
    land: z.number(), // the arc lands, ahead of "with like"
    echo: z.number(), // "80" lead             — the hoop's crown (orange)
    fan: z.number(), // the fan starts out of the bunch
    fanEnd: z.number(), // the last keys reach the top sides
    text: z.number(), // "80 KEYS" starts, landing on "keys"
    sway: z.number(), // the weight: the hoop swings once, peak on "on it"
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  keyCount: 80,
  label: "80",
  labelSub: "KEYS",
  beats: {
    rise: -2, // already 2 f into its rise at the cut, so f0 is never a blank sheet
    toss: 30,
    land: 53,
    echo: 59,
    fan: 60,
    fanEnd: 78,
    text: 66,
    sway: 81,
  },
});

// ---------------------------------------------------------------------------
// GEOMETRY (world px). The world is laid out so the rest camera is k 1.0: a
// world px IS a screen px on the payoff frame.
// ---------------------------------------------------------------------------
const K_REST = 1.0;
const HOOP_R = 155; // hoop centre-line radius
const HOOP_W = 14; // the hoop's stroke (the director's 14 screen px at rest)
const HOOP_OUT = HOOP_R + HOOP_W / 2;
// A skeleton key, drawn along +x from its bow's centre: a bold antique-key
// icon that reads at half size on its own. v3 sizes (the director's): ~210 px
// overall, a 64 px bow with a 26 px hole, a collar ring, an 18 px shank, a
// 44 x 38 bit with two clear notches.
const BOW_OUT = 32; // bow outer radius -> 64 px across
const BOW_HOLE = 13; // -> 26 px hole
const BOW_R = (BOW_OUT + BOW_HOLE) / 2; // band centre-line, 22.5
const BOW_BAND = BOW_OUT - BOW_HOLE; // 19
const SHANK = 18;
const BIT_L = 44; // bit length along the shank
const BIT_D = 38; // bit depth from the shank's centre-line
const NOTCH_W = 9;
const NOTCH_D = 15;
// The bow hangs OUTSIDE the hoop: its centre sits BOW_R out from the hoop's
// centre-line, RADIALLY, so the hoop runs along the top of the bow's hole and
// the loop shows below it. The key then hangs from its bow's centre.
const BOW_HANG = BOW_R;
// Three depth layers, back to front: density by layer, not by count. The front
// layer is few enough that paper shows between its shanks; the mid and back
// fill in behind on the 0.55 and 0.3 rungs, each offset by half a slot.
const LAYERS = [
  { name: "back", n: 30, len: 196, opacity: OP_LOW, offset: 0, span: 0.93 },
  { name: "mid", n: 28, len: 186, opacity: OP_MID, offset: 0.5, span: 0.97 },
  { name: "front", n: 22, len: 178, opacity: 1, offset: 0, span: 1 },
] as const;
const LEN_FRONT = LAYERS[2].len + BOW_HANG; // hoop -> tip
const LEN_BACK = LAYERS[0].len + BOW_HANG;
// Gravity: a key's hanging angle is radial-outward mixed toward straight down.
const GRAVITY_MIX = 0.65;
// Bow centres at phi = 90 +- 104; with each bow's own +-10 deg of width the
// keys' ink covers the hoop's lower ~240 deg and the crown's ends sit on paper.
const PHI_SPAN = 104;

const RC = { x: 960, y: 372 }; // hoop centre at rest
const PIVOT_END = { x: RC.x, y: RC.y - HOOP_R }; // the hoop hangs from its top

// THE CARETAKER. `Person` takes the 512-box's top-left and side. The glyph's
// ink runs 0.078..0.918 of the box vertically and 0.08..0.92 sideways.
const PERSON_S = 588; // ink 494 world tall -> 380 screen px at the open k 0.77
const PERSON_RIGHT = -25; // world x of his ink's right edge: out of the rest frame
const PERSON_BOX = { x: PERSON_RIGHT - 0.92 * PERSON_S, y: 70 };
// The hoop hangs in his hand at his side, from about his collar.
const PIVOT_START = {
  x: PERSON_RIGHT + HOOP_OUT + 18,
  y: PERSON_BOX.y + 0.5 * PERSON_S,
};
// The arc's control point: lifts the path ~90 world px at the top.
const PIVOT_CTRL = {
  x: (PIVOT_START.x + PIVOT_END.x) / 2,
  y: Math.min(PIVOT_START.y, PIVOT_END.y) - 180,
};

// THE TEXT, sized in SCREEN px at the rest k, laid out in world px.
const NUM_PX = 190; // "80"
const SUB_PX = 118; // "KEYS"
const NUM_SIZE = NUM_PX / K_REST;
const SUB_SIZE = SUB_PX / K_REST;
const CAP = 0.7; // Barlow cap height per em
const TEXT_GAP = 34; // world px between the bunch's lowest ink and the cap top
const BUNCH_BOTTOM = RC.y + HOOP_R + LEN_BACK + 4; // the straight-down back keys' tips
const TEXT_BASELINE = BUNCH_BOTTOM + TEXT_GAP + CAP * NUM_SIZE;
const CROWN_TOP = RC.y - HOOP_OUT - 3 * CROWN_STEP;
const C_REST = (CROWN_TOP + TEXT_BASELINE + SHADOW_OFF) / 2;

// The opening group: the glyph's ink to the bunch's tips.
const OPEN_TOP = PERSON_BOX.y + 0.078 * PERSON_S;
const OPEN_BOTTOM = PIVOT_START.y + 2 * HOOP_R + LEN_FRONT;
const C_OPEN = (OPEN_TOP + OPEN_BOTTOM) / 2;
const X_OPEN = (PERSON_BOX.x + 0.08 * PERSON_S + PIVOT_START.x + HOOP_OUT) / 2;
// The bunch on arrival: hoop top to the hanging tips.
const C_ARRIVE = (PIVOT_END.y + PIVOT_END.y + 2 * HOOP_R + LEN_FRONT) / 2;

// ---------------------------------------------------------------------------
// THE CAMERA: an open, one push-and-pan that follows the hoop (<= 1.35x), the
// ease-back that gives the burst its room, and the held creep.
// ---------------------------------------------------------------------------
const K_OPEN = 0.77;
const K_OPEN2 = 0.775;
const K_PUSH = 1.04; // 1.342x the open
const K_REST2 = 1.018;

const M0 = camMove169({
  f0: 0,
  f1: 21,
  k0: K_OPEN,
  k1: K_OPEN2,
  c0: C_OPEN,
  c1: C_OPEN,
  x0: X_OPEN,
  x1: X_OPEN + 8,
});
const M1 = camMove169({
  f0: 21,
  f1: 59,
  k0: K_OPEN2,
  k1: K_PUSH,
  c0: C_OPEN,
  c1: C_ARRIVE,
  x0: X_OPEN + 8,
  x1: RC.x,
});
const M2 = camMove169({
  f0: 60,
  f1: 78,
  k0: K_PUSH,
  k1: K_REST,
  c0: C_ARRIVE,
  c1: C_REST,
  x0: RC.x,
  x1: RC.x,
  warp: 0.75,
});
const M3 = camMove169({
  f0: 82,
  f1: 115,
  k0: K_REST,
  k1: K_REST2,
  c0: C_REST,
  c1: C_REST,
  x0: RC.x,
  x1: RC.x,
});

const join = (
  ...moves: { F: number[]; K: number[]; CY: number[]; CX: number[] }[]
) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  for (const m of moves) {
    m.F.forEach((f, i) => {
      if (F.length && f <= F[F.length - 1]) return;
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CX.push(m.CX[i]);
    });
  }
  return { F, K, CY, CX };
};
export const CAM = join(M0, M1, M2, M3);
export const camAt = (f: number) => runCamera2(f, CAM.F, CAM.CY, CAM.CX, CAM.K);

// ---------------------------------------------------------------------------
// THE HANDOVER: the pivot's arc, and the pendulum it drives (the whole hoop).
// ---------------------------------------------------------------------------
const TOSS_EASE = Easing.bezier(0.45, 0, 0.2, 1);
const pivotAt = (f: number, toss: number, land: number) => {
  const u = TOSS_EASE(Math.max(0, Math.min(1, (f - toss) / (land - toss))));
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return {
    x: a * PIVOT_START.x + b * PIVOT_CTRL.x + c * PIVOT_END.x,
    y: a * PIVOT_START.y + b * PIVOT_CTRL.y + c * PIVOT_END.y,
  };
};

// A damped pendulum, angle in degrees-clockwise (SVG's rotate sense): in the
// pivot's accelerating frame l * a'' = -(g - ay) sin a + ax cos a, plus
// 2 * zeta * w0 damping.
const PEND_W0 = (2 * Math.PI) / 16; // natural period 16 f
const PEND_L = 300; // effective length, world px (pivot -> the bunch's mass)
const PEND_G = PEND_W0 * PEND_W0 * PEND_L;
const PEND_ZETA = 0.6; // one visible overshoot, the next is under a degree
const SUB = 8;

export const simulatePendulum = (toss: number, land: number, upto: number) => {
  const out: number[] = [0];
  let a = 0;
  let w = 0;
  const h = 1 / SUB;
  const acc = (t: number) => {
    const e = 0.25;
    const p0 = pivotAt(t - e, toss, land);
    const p1 = pivotAt(t, toss, land);
    const p2 = pivotAt(t + e, toss, land);
    return {
      x: (p2.x - 2 * p1.x + p0.x) / (e * e),
      y: (p2.y - 2 * p1.y + p0.y) / (e * e),
    };
  };
  for (let f = 1; f <= upto; f++) {
    for (let s = 0; s < SUB; s++) {
      const t = f - 1 + s * h;
      const ac = acc(t);
      const dd =
        (-(PEND_G - ac.y) * Math.sin(a) + ac.x * Math.cos(a)) / PEND_L -
        2 * PEND_ZETA * PEND_W0 * w;
      w += dd * h;
      a += w * h;
    }
    out.push((a * 180) / Math.PI);
  }
  return out;
};
const PEND = simulatePendulum(
  defaultProps.beats.toss,
  defaultProps.beats.land,
  DURATION,
);

// THE WEIGHT: the hoop dips as the keys load it, then swings once.
const DIP = 10; // world px
const dipAt = (f: number, fan: number, fanEnd: number) =>
  DIP * camEase((f - (fan + 4)) / (fanEnd + 6 - (fan + 4)), 1);
const SWAY_A = 3.0; // deg
const SWAY_T = 36; // frames
const SWAY_TAU = 13;
const swayAt = (f: number, f0: number) => {
  if (f <= f0) return 0;
  const t = f - f0;
  const ramp = 1 - Math.exp(-t / 3); // the angular velocity starts at 0
  return (
    SWAY_A *
    ramp *
    Math.sin((2 * Math.PI * t) / SWAY_T) *
    Math.exp(-t / SWAY_TAU) *
    1.9
  );
};

// ---------------------------------------------------------------------------
// THE KEYS
// ---------------------------------------------------------------------------
type KeySpec = {
  i: number;
  layer: number; // 0 back .. 2 front
  phi: number; // where its bow hangs on the hoop, deg, SVG sense (90 = bottom)
  phi0: number; // where it starts the fan
  len: number;
  jit: number; // its own small deviation from the hanging angle, deg
  bow: number; // 0 round, 1 trefoil, 2 oval
  bit: number; // tooth pattern
  side: 1 | -1; // which side of the shank the bit hangs
  bunch: boolean; // one of the five in his hand from the start
};

/** The hanging angle of a key whose bow is at `phi` on the hoop. */
const hangAngle = (phi: number) => phi + GRAVITY_MIX * (90 - phi);

// SLOTS BY SEPARATION. Neighbouring keys are separated by their arc pitch
// times sin(A), A being the angle between the hoop's tangent and the hanging
// key: 1 at the bottom (keys hang across the hoop), ~0.23 at the upper sides
// (keys hang almost along it, like shingles). So the slot density follows
// sin(A) — dense at the bottom where a real bunch is heaviest, sparse up the
// sides — and the gap between neighbours is even all the way round.
const SLOT_TABLE = (() => {
  const N = 2000;
  const phis: number[] = [];
  const cdf: number[] = [0];
  for (let k = 0; k <= N; k++)
    phis.push(90 - PHI_SPAN + (2 * PHI_SPAN * k) / N);
  for (let k = 1; k <= N; k++) {
    const phi = (phis[k - 1] + phis[k]) / 2;
    const A = ((90 + (1 - GRAVITY_MIX) * (phi - 90)) * Math.PI) / 180;
    cdf.push(cdf[k - 1] + Math.max(0.12, Math.abs(Math.sin(A))));
  }
  return { phis, cdf: cdf.map((v) => v / cdf[N]) };
})();
/** u in [0, 1] -> the slot's phi at that quantile of the density. */
const slotPhi = (u: number) => {
  const { phis, cdf } = SLOT_TABLE;
  const q = Math.max(0, Math.min(1, u));
  let lo = 0;
  let hi = cdf.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] < q) lo = mid;
    else hi = mid;
  }
  const t = (q - cdf[lo]) / Math.max(1e-9, cdf[hi] - cdf[lo]);
  return phis[lo] + (phis[hi] - phis[lo]) * t;
};

export const buildKeys = (count: number): KeySpec[] => {
  // the layer counts are the director's 30 / 28 / 22; a different keyCount
  // scales them
  const total = LAYERS.reduce((t, L) => t + L.n, 0);
  const per = LAYERS.map((L) => Math.round((L.n * count) / total));
  per[per.length - 1] += count - per.reduce((t, m) => t + m, 0);
  const keys: KeySpec[] = [];
  let i = 0;
  per.forEach((m, l) => {
    const phis = Array.from(
      { length: m },
      (_, j) =>
        90 +
        (slotPhi((j + 0.5 + LAYERS[l].offset - 0.25) / m) - 90) *
          LAYERS[l].span,
    );
    const front = l === LAYERS.length - 1;
    const bunchIdx = front
      ? phis
          .map((p, j) => ({ p, j }))
          .sort((a, b) => Math.abs(a.p - 90) - Math.abs(b.p - 90))
          .slice(0, 5)
          .map((o) => o.j)
          .sort((a, b) => phis[a] - phis[b])
      : [];
    phis.forEach((phi, j) => {
      const b = bunchIdx.indexOf(j);
      keys.push({
        i,
        layer: l,
        phi: phi + (hash(i, 3) - 0.5) * 2,
        // the bunch hangs together in his hand, 12 deg apart; every other key
        // leaves from just inside the bunch, on its own side
        phi0: b >= 0 ? 90 + (b - 2) * 12 : 90 + Math.sign(phi - 90) * 12,
        // front keys alternate long / short by 36 px so neighbouring bits sit
        // at different heights instead of fusing side by side
        len:
          LAYERS[l].len +
          (front ? (j % 2 === 0 ? 18 : -18) : 0) +
          (hash(i, 5) - 0.5) * 12,
        jit: (hash(i, 17) - 0.5) * 6,
        bow: Math.floor(hash(i, 7) * 3),
        bit: Math.floor(hash(i, 11) * 3),
        // bits fan outward: away from the bunch's centre line
        side: phi < 90 ? -1 : 1,
        bunch: b >= 0,
      });
      i++;
    });
  });
  return keys;
};
const KEYS = buildKeys(defaultProps.keyCount);

// THE FAN: every new key slides along the hoop from behind the bunch to its
// slot on ONE shared eased progress, so the far keys lead and the fan opens as
// one sweep each way. While it slides each key hangs on its own small damped
// pendulum driven by its bow's acceleration along the hoop, so it trails as it
// is carried and swings down into its hanging angle as it settles.
// Each key's own slide: the farthest keys leave the bunch first (f60) and
// travel longest; the nearest leave last and travel least, so at any moment
// only a few keys are in transit, they never cross a key already in its slot,
// and every key is home by ~f76. The stream of departures IS the one wave.
const FAN_LEAD = 7; // frames between the first and the last departure
const slideOf = (key: KeySpec, fan: number, fanEnd: number) => {
  const reach = Math.min(1, Math.abs(key.phi - key.phi0) / PHI_SPAN);
  const start = fan + FAN_LEAD * (1 - reach);
  const dur = 6 + (fanEnd - 2 - fan - 6) * reach; // far keys: fan -> fanEnd - 2
  return { start, dur };
};
// Pushed out of the bunch at speed, then a long ease into the slot: a key never
// loiters at the bunch's edge, so the departures never pile into a slab.
const SLIDE_EASE = Easing.bezier(0.2, 0.55, 0.3, 1);
const keyPhiAt = (key: KeySpec, f: number, fan: number, fanEnd: number) => {
  const { start, dur } = slideOf(key, fan, fanEnd);
  return (
    key.phi0 +
    (key.phi - key.phi0) *
      SLIDE_EASE(Math.max(0, Math.min(1, (f - start) / dur)))
  );
};
const keyOutAt = (key: KeySpec, f: number, fan: number, fanEnd: number) =>
  key.bunch || f >= slideOf(key, fan, fanEnd).start;

const KEY_W0 = (2 * Math.PI) / 11; // a key's own period, 11 f
const KEY_ZETA = 0.42;
const KEY_L = 110; // a key's centre of mass below its bow

const simulateKeySwing = (
  key: KeySpec,
  fan: number,
  fanEnd: number,
  upto: number,
) => {
  const out: number[] = new Array(upto + 1).fill(0);
  if (key.phi === key.phi0) return out;
  const bowAt = (t: number) => {
    const p = (keyPhiAt(key, t, fan, fanEnd) * Math.PI) / 180;
    return { x: HOOP_R * Math.cos(p), y: HOOP_R * Math.sin(p) };
  };
  let d = 0; // offset from the hanging angle, rad
  let w = 0;
  const h = 1 / SUB;
  for (let f = 1; f <= upto; f++) {
    if (f > fan - 1) {
      for (let s = 0; s < SUB; s++) {
        const t = f - 1 + s * h;
        const e = 0.25;
        const p0 = bowAt(t - e);
        const p1 = bowAt(t);
        const p2 = bowAt(t + e);
        const ax = (p2.x - 2 * p1.x + p0.x) / (e * e);
        const ay = (p2.y - 2 * p1.y + p0.y) / (e * e);
        const th =
          (hangAngle(keyPhiAt(key, t, fan, fanEnd)) * Math.PI) / 180 + d;
        const dd =
          (ax * Math.sin(th) - ay * Math.cos(th)) / KEY_L -
          KEY_W0 * KEY_W0 * d -
          2 * KEY_ZETA * KEY_W0 * w;
        w += dd * h;
        d += w * h;
      }
    }
    out[f] = (d * 180) / Math.PI;
  }
  return out;
};
const KEY_SWING = new Map(
  KEYS.map((k) => [
    k.i,
    simulateKeySwing(
      k,
      defaultProps.beats.fan,
      defaultProps.beats.fanEnd,
      DURATION,
    ),
  ]),
);

// Notch patterns: the two notches' positions along the bit, as fractions.
const NOTCHES = [
  [0.22, 0.6],
  [0.3, 0.68],
  [0.18, 0.5],
];

// One skeleton key, in its own frame: bow centre at the origin, pointing along
// +x, the bit off the `side` of the shank at the tip.
const KeyShape: React.FC<{
  fill: string;
  len: number;
  bow: number;
  bit: number;
  side: 1 | -1;
}> = ({ fill, len, bow, bit, side }) => {
  const x1 = len; // the tip
  const x0 = len - BIT_L;
  const [n1, n2] = NOTCHES[bit];
  // the bit as one outline with two notches cut into its far edge
  const pts: [number, number][] = [
    [x0, 0],
    [x0, BIT_D],
    [x0 + n1 * BIT_L, BIT_D],
    [x0 + n1 * BIT_L, BIT_D - NOTCH_D],
    [x0 + n1 * BIT_L + NOTCH_W, BIT_D - NOTCH_D],
    [x0 + n1 * BIT_L + NOTCH_W, BIT_D],
    [x0 + n2 * BIT_L, BIT_D],
    [x0 + n2 * BIT_L, BIT_D - NOTCH_D],
    [x0 + n2 * BIT_L + NOTCH_W, BIT_D - NOTCH_D],
    [x0 + n2 * BIT_L + NOTCH_W, BIT_D],
    [x1, BIT_D],
    [x1, 0],
  ];
  const d =
    "M" +
    pts.map(([x, y]) => `${x.toFixed(2)} ${(side * y).toFixed(2)}`).join(" L") +
    " Z";
  return (
    <>
      {bow === 1 ? (
        // trefoil: three bold loops round the bow's centre
        [180, 60, -60].map((a) => (
          <circle
            key={a}
            cx={14 * Math.cos((a * Math.PI) / 180) - 3}
            cy={14 * Math.sin((a * Math.PI) / 180)}
            r={12}
            fill="none"
            stroke={fill}
            strokeWidth={10}
          />
        ))
      ) : bow === 2 ? (
        <ellipse
          cx={-2}
          cy={0}
          rx={BOW_R + 3}
          ry={BOW_R - 3}
          fill="none"
          stroke={fill}
          strokeWidth={BOW_BAND - 1}
        />
      ) : (
        <circle
          cx={0}
          cy={0}
          r={BOW_R}
          fill="none"
          stroke={fill}
          strokeWidth={BOW_BAND}
        />
      )}
      {/* the collar ring and a second, thinner bead */}
      <rect x={BOW_OUT - 3} y={-17} width={12} height={34} fill={fill} />
      <rect x={BOW_OUT + 15} y={-13} width={7} height={26} fill={fill} />
      {/* shank */}
      <rect
        x={BOW_OUT - 4}
        y={-SHANK / 2}
        width={len - BOW_OUT + 4}
        height={SHANK}
        fill={fill}
      />
      {/* bit */}
      <path d={d} fill={fill} />
    </>
  );
};

// ---------------------------------------------------------------------------
// THE ECHO on the hoop: the cut's one chain moment. Three copies of the hoop,
// orange / purple / blue, 2 f apart, rising 36 / 24 / 12 world px over
// CHAIN_TRAVEL frames on EASE_LAND, each CLIPPED TO OUTSIDE the white hoop's
// outer edge, so only a crown of 12 px arcs shows above the top arc. Painted
// behind the keys and the hoop. Nothing fades.
// ---------------------------------------------------------------------------
const HoopEcho: React.FC<{
  frame: number;
  start: number;
  c: { x: number; y: number };
}> = ({ frame, start, c }) => {
  const id = "ek-outside-hoop";
  const r = HOOP_OUT;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path
            clipRule="evenodd"
            d={`M${c.x - 4000} ${c.y - 4000} h8000 v8000 h-8000 Z M${c.x - r} ${c.y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {[ORANGE, PURPLE, BLUE].map((col, i) => {
          const f0 = start + i * CHAIN_STAGGER;
          if (frame < f0) return null;
          const t = interpolate(frame, [f0, f0 + CHAIN_TRAVEL], [0, 1], {
            easing: EASE_LAND,
            ...clamp,
          });
          const lift = t * CROWN_STEP * (3 - i);
          return (
            <circle
              key={col}
              cx={c.x}
              cy={c.y - lift}
              r={HOOP_R}
              fill="none"
              stroke={col}
              strokeWidth={HOOP_W}
            />
          );
        })}
      </g>
    </g>
  );
};

const EightyKeys: React.FC<Props> = ({ label, labelSub, beats }) => {
  const frame = useCurrentFrame();

  // -- the camera ------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;

  // -- the hoop: pivot on its arc, dipping under the load, swinging ---------
  const p = pivotAt(frame, beats.toss, beats.land);
  const pivot = { x: p.x, y: p.y + dipAt(frame, beats.fan, beats.fanEnd) };
  const alpha =
    PEND[Math.min(frame, PEND.length - 1)] + swayAt(frame, beats.sway);
  const ar = (alpha * Math.PI) / 180;
  const c = {
    x: pivot.x - HOOP_R * Math.sin(ar),
    y: pivot.y + HOOP_R * Math.cos(ar),
  };

  // -- the opening rise: the caretaker and his hoop, as one group ------------
  const rise = textRise(frame, beats.rise, k);
  const textR = textRise(frame, beats.text, k);

  const keyTransform = (key: KeySpec) => {
    const phi = keyPhiAt(key, frame, beats.fan, beats.fanEnd) + alpha;
    const th =
      hangAngle(keyPhiAt(key, frame, beats.fan, beats.fanEnd)) +
      key.jit +
      alpha +
      (KEY_SWING.get(key.i)?.[frame] ?? 0);
    const r = (phi * Math.PI) / 180;
    // the bow's centre sits RADIALLY outside the hoop line, so the hoop runs
    // along the top of the loop; the key hangs from there
    const bx = c.x + (HOOP_R + BOW_HANG) * Math.cos(r);
    const by = c.y + (HOOP_R + BOW_HANG) * Math.sin(r);
    return `translate(${bx.toFixed(3)} ${by.toFixed(3)}) rotate(${th.toFixed(3)})`;
  };
  const visible = (key: KeySpec) =>
    keyOutAt(key, frame, beats.fan, beats.fanEnd);

  // One union per layer: the layer's hard shadows, then its whites, all
  // clipped to OUTSIDE the hoop's inner edge, so the hoop's interior is only
  // ever paper (a bow's band would otherwise peek 2.5 px past it).
  const inner = HOOP_R - HOOP_W / 2;
  const outsideHoop = (
    <clipPath id="ek-keys-outside">
      <path
        clipRule="evenodd"
        d={`M${c.x - 4000} ${c.y - 4000} h8000 v8000 h-8000 Z M${c.x - inner} ${c.y} a${inner} ${inner} 0 1 0 ${2 * inner} 0 a${inner} ${inner} 0 1 0 ${-2 * inner} 0 Z`}
      />
    </clipPath>
  );
  const layer = (which: number, opacity: number) => (
    <Inked
      key={which}
      opacity={opacity}
      render={(fill) => (
        <g>
          {KEYS.map((key) =>
            key.layer === which && visible(key) ? (
              <g key={key.i} transform={keyTransform(key)}>
                <KeyShape
                  fill={fill}
                  len={key.len}
                  bow={key.bow}
                  bit={key.bit}
                  side={key.side}
                />
              </g>
            ) : null,
          )}
        </g>
      )}
    />
  );

  const hoop = (
    <Inked
      render={(fill) => (
        <circle
          cx={c.x}
          cy={c.y}
          r={HOOP_R}
          fill="none"
          stroke={fill}
          strokeWidth={HOOP_W}
        />
      )}
    />
  );

  return (
    <AbsoluteFill>
      <PaperGround
        frame={frame}
        cx={cx}
        cy={cy}
        cxRest={CAM.CX[0]}
        cyRest={CAM.CY[0]}
        k={k}
      />
      <World cx={cx} cy={cy} k={k}>
        {rise.opacity > 0 ? (
          <g
            opacity={rise.opacity < 1 ? rise.opacity : undefined}
            transform={`translate(0 ${rise.dy.toFixed(3)})`}
          >
            {/* THE CARETAKER — he never moves; the camera leaves him */}
            <Person
              x={PERSON_BOX.x}
              y={PERSON_BOX.y}
              size={PERSON_S}
              idPrefix="ek"
            />
          </g>
        ) : null}

        {rise.opacity > 0 ? (
          <g
            opacity={rise.opacity < 1 ? rise.opacity : undefined}
            transform={
              frame < beats.toss
                ? `translate(0 ${rise.dy.toFixed(3)})`
                : undefined
            }
          >
            {/* THE KEYS: back (0.3) and mid (0.55) behind the crown, so no
                pale bow ever sits over a colour; then THE CROWN, outside the
                hoop's edge; then the front keys (1.0) over its tapering ends */}
            <defs>{outsideHoop}</defs>
            <g clipPath="url(#ek-keys-outside)">
              {LAYERS.map((L, l) =>
                l < LAYERS.length - 1 ? layer(l, L.opacity) : null,
              )}
            </g>
            <HoopEcho frame={frame} start={beats.echo} c={c} />
            <g clipPath="url(#ek-keys-outside)">
              {layer(LAYERS.length - 1, LAYERS[LAYERS.length - 1].opacity)}
            </g>
            {/* THE HOOP over every bow: it threads them */}
            {hoop}
          </g>
        ) : null}

        {/* "80 KEYS" — names the count the bunch shows */}
        {textR.opacity > 0 ? (
          <Inked
            opacity={textR.opacity}
            render={(fill) => (
              <text
                x={RC.x}
                y={TEXT_BASELINE + textR.dy}
                textAnchor="middle"
                fill={fill}
                style={{
                  fontFamily,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                <tspan fontSize={NUM_SIZE}>{label}</tspan>
                <tspan fontSize={SUB_SIZE} dx={SUB_SIZE * 0.3}>
                  {labelSub}
                </tspan>
              </text>
            )}
          />
        ) : null}
      </World>
    </AbsoluteFill>
  );
};

export default EightyKeys;

// exported for the probe
export const GEOM = {
  RC,
  HOOP_R,
  TEXT_BASELINE,
  C_REST,
  C_OPEN,
  C_ARRIVE,
  X_OPEN,
  PIVOT_START,
  PIVOT_END,
  PERSON_BOX,
  PERSON_S,
  PERSON_RIGHT,
  BUNCH_BOTTOM,
  CROWN_TOP,
};
export const pendAt = (f: number) => PEND[Math.min(f, PEND.length - 1)];
export const swayFor = swayAt;
export const pivotFor = pivotAt;
