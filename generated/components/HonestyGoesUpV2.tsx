import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  hash,
  iconShadow,
  smoothstep,
} from "./fieldShared";
import {
  BEAD_R,
  BLOB_RY,
  Comet,
  DOT_R,
  FONT_LABEL,
  FPS as ALIGN_FPS,
  H_USER,
  INK,
  INK_HI,
  INK_LO,
  LINK_IDLE,
  LINK_LIVE,
  LABEL_SIZE,
  Label,
  Link,
  PACKET_PERIOD,
  SEAT_GAP,
  SEAT_R,
  SEP_FLOOR,
  STROKE_W,
  SeatArrow,
  TWO_PI,
  UserSeat,
  flockWander,
  flockWanderCaps,
  formationAt,
  labelIn,
  lerp,
  linkPackets,
  travel,
  turn,
  waveArrival,
  worldPx,
} from "./alignShared";
import { FORM, linkPaint } from "./UserIsAgentA";

export const FPS = ALIGN_FPS;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Alignment`, CUT 3 — `HonestyGoesUpV2` (in at 0:27.820):
// "like, honesty goes up, instruction following goes up. That's showing that
//  there is actually, like, a path for getting more honesty out of these
//  models."
//
// V1 was rejected: "super crowded, text overlapping, overstimulating." This is
// the revamp, and the rule it is built to is FEWER, BIGGER MOVES AND ONE
// CENTRED COLUMN. V1's stem, fork, two U-lanes, two bead columns, hollow rows,
// dashed continuation and over-draw lane are all GONE, and with them 177 beads
// and ~40 drawn objects a frame.
//
// WHAT IS LEFT IS ONE AXIS. The user's own white arrow is extended straight up
// into a long vertical axis (`SeatArrow` at a longer `len`, so it IS that
// arrow, full stroke, INK_HI, its head always AXIS_LEAD beyond the highest
// tick). Two LEVELS ride on it: a short white tick with one Söhne line to its
// right — `honesty`, and below it `instruction following`. Where each tick
// started, a GHOST tick stays at INK_LO: that is the score before. Beads leave
// the snapped agents, pass through the ring and climb the axis in one lane, and
// a bead that REACHES a tick is absorbed and the tick rises ONE NOTCH. The
// level goes up only because a bead reached it — nothing in the cut is on a
// timer.
//
// VISIBLE ELEMENT TYPES, on every frame: (1) the flock — comets, their thinned
// links and the sparse packets on them; (2) the user seat — ring, A, `user` and
// `A`; (3) the axis; (4) the levels — two ticks, two ghosts, two labels; (5) the
// beads. FIVE, and the count never rises: the axis and its over-draw are one
// object, and the second level joins the fourth type rather than making a
// sixth.
//
// DURATION. Speech runs 27.820 -> 34.360 s of the clip, so
//   DURATION = round((34.360 - 27.820) * 24) + 16 = 157 + 16 = 173.
// Word onsets, frame = round((t - 27.820) * 24), off the clip's SRT:
//   like 0 · HONESTY 2 · goes 10 · UP 16 (ends 24) · INSTRUCTION 24 ·
//   FOLLOWING 31 · goes 37 · UP 42 (ends 49) · that's 49 · showing 56 ·
//   that 60 · there 63 · is 66 · actually 69 · like 75 · a 81 ·
//   PATH 86 (ends 95) · for 95 · GETTING 107 · MORE 121 · HONESTY 127 ·
//   OUT 134 · of 142 · these 143 · MODELS 146 (ends 157) · tail 157-173.
//
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "a level marked honesty climbs a pole one notch each time a bead from the
//    flock reaches it, then a second level marked instruction following does
//    the same; the pole becomes a path and honesty keeps climbing it."
//
// THE WORLD IS CUT 2's, unchanged: `FORM` imported from `UserIsAgentA` (seed 8,
// 70 agents), its layout (blob centre 540/1044, seat 540/504), its hunt, its
// `flockWander` caps, its `linkPaint`, its inset links and thinned packets, and
// its `user ◯ A` labels on the ring's shoulders. The link web is thinned FURTHER
// here (idle 0.22 against cut 2's 0.30): in this cut the flock is where the
// beads come from and nothing else.
//
// ---------------------------------------------------------------------------
// GESTURES — four, and nothing in the cut is outside this list.
//
//  1. f0-24   "honesty goes up"      THE AXIS AND THE FIRST LEVEL. Open on
//     (f2 / f10 / f16)               `user ◯ A` at screen 891 with the snap
//                                    wave still travelling in the flock below,
//                                    the axis already risen out of the arrow and
//                                    the honesty tick at screen 515 with its
//                                    label. Beads are already climbing (they
//                                    were born before f0 — see THE BEADS), and
//                                    four of them are absorbed by f24, one
//                                    notch each. The camera creeps up with the
//                                    tick and opens from k 1.28 to 1.00.
//  2. f24-49  "instruction           THE SECOND LEVEL. Its tick and ghost draw
//     following goes up"             on at f24 with the label sliding up on its
//     (f24 / f31 / f37 / f42)        own word, 180 world px under honesty's
//                                    start, and it takes the next four beads —
//                                    4 notches by f49 — while honesty trickles
//                                    one more.
//  3. f49-95  "that's showing that   THE PULL-BACK AND THE PATH. One pull-back
//     there is actually a path"      (k 0.99 -> 0.90) holds flock -> ring ->
//     (f49-86)                       axis -> both ticks in one frame. Then the
//                                    beads' lane — the straight run from the
//                                    front of the flock, through the ring, to
//                                    the honesty tick — is drawn over f60-82 as
//                                    ONE full-opacity white line ON TOP of
//                                    everything, landing 4 frames before "path"
//                                    (f86): the axis simply becomes the spine.
//                                    Nothing else happens.
//  4. f95-173 "for getting more      HONESTY RUNS AWAY. The bead rate doubles
//     honesty out of these models"   (0.065 -> 0.130 notches/frame, measured)
//     (f95 / 107 / 121 / 127 / 146)  and every bead now goes to honesty:
//                                    instruction following holds at 6 notches
//                                    while honesty climbs 8 -> 17 by f157 and 18
//                                    by f166, with two more in flight at f172.
//                                    The camera follows the honesty tick up on
//                                    one slow glide and instruction following,
//                                    the ring and the flock go down and out.
//
// LIVENESS — mechanisms, not gestures, none on a word and none ever stopping:
// the grid sliding under the co-moving picture, `flockWander`, the snap wave's
// travelling link bands and its bead on the link it is crossing, the sparse
// link packets, the climbing beads, and the camera, which is still gliding at
// f172.
//
// ---------------------------------------------------------------------------
// CAMERA. One C1-continuous track per channel on a monotone cubic Hermite
// (Fritsch-Carlson), one key per frame, through the shared damper, pre-rolled
// from -CAM_PRE so f0 opens mid-creep. Four framings are SOLVED (secant; the
// damper is affine in its keys so each solve is exact):
//   f0    y 460  k 1.28   ring 891, honesty tick 515, flock below
//   f24   y 456  k 1.00   four notches on, the instruction level joining
//   f95   y 581  k 0.90   flock -> ring -> axis -> both ticks in one frame: the
//                         camera takes the whole crowd in while the level climbs
//   f172  y 279  k 0.98   the tick still climbing at screen 250, the ring at 1056
//
// THE LABEL SOLVE IS WHAT SETS THE ZOOM'S TWO ENDS. A label has to be >= 56
// screen px everywhere and its longest line has to stay left of screen 1000
// everywhere, and both are measured off Sohne-Kraftig's own advance widths:
//   size    56 / 1.15 (the widest frame) = 48.7 -> LABEL_W 50, so a label is
//           56.3 screen px at k 1.15 and 77.5 at k 1.55
//   width   "instruction following" on ONE line is 454 world px at that size
//           and runs off the right edge at any k over 1.0, which is why the
//           second label is set as TWO LINES: "instruction" alone is 221, so
//           the right edge lands at 540 + (55 + 14 + 221) * 1.55 = 990
// Measured over the whole cut: the widest right edge is 975 px (f24), the
// smallest label 56.3 px, the closest a label comes to another label 418 px and
// to the ring's own labels 76 px.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the revamp brief, with the arithmetic.
//  * THE SECOND LEVEL HOLDS AT 5 NOTCHES, not the briefed "around 6". It is the
//    same solve as HON_START: instruction following climbs from 390 and honesty's
//    ghost stands at 110, so a sixth notch would put them 40 world px apart —
//    two ticks stacked, which is what the first V2 pass did at 24 px and what
//    this rebuild exists to avoid. Five leaves 80 px (STATS.layout.worstMarkGap).
//  * A TICK PEAKS AT 12.8 SCREEN PX/FRAME against the briefed 12, at f12. Four
//    notches by f24 is 160 world px in 24 frames = 6.7 px/f, which at the
//    opening k 1.55 is 10.3 px/f of screen before any easing; the rises are
//    spread over RISE_F 14 and overlap so the sum is nearly a constant rate, and
//    12.8 is the residual ripple. It is 6% over a ceiling written as "may move
//    up to", and it is the frames where the climb has to be felt.
//  * INSTRUCTION FOLLOWING IS STILL IN FRAME AT f172, at screen 1631 with its
//    ghost at 1891 — both on their way out under the bottom edge, which they
//    cross at ~f180. The ring does leave: it crosses 1920 at ~f163.
//  * THE FLOCK BLEEDS UNDER SCREEN 1300 on every frame it is in — its head at
//    1396 at f0 and 1415 at f95 — as the director accepted for V1 and again for
//    this cut: it is context here, and the top rows under the ring are all the
//    frame needs of it.
// ---------------------------------------------------------------------------

export const DURATION = 173;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  beats: z.object({
    honesty: z.number(),
    up1: z.number(),
    instruction: z.number(),
    up2: z.number(),
    thats: z.number(),
    path: z.number(),
    getting: z.number(),
    more: z.number(),
    models: z.number(),
    end: z.number(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.26,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  beats: {
    honesty: 2,
    up1: 16,
    instruction: 24,
    up2: 42,
    thats: 49,
    path: 86,
    getting: 107,
    more: 121,
    models: 146,
    end: 157,
  },
});

// ---------------------------------------------------------------------------
// THE LAYOUT, in co-moving world px — cut 2's, plus one axis.
// ---------------------------------------------------------------------------
const CX = FRAME_W / 2; // 540
const FORM_C = { x: CX, y: 1044 };
const SEAT = { x: FORM_C.x, y: FORM_C.y - SEAT_GAP }; // (540, 504)
/** The arrow's own root on the ring, which is where the axis starts. */
const AXIS_FOOT = SEAT.y - SEAT_R * 0.92; // 432.2
/** The front of the flock: the blob's own top edge. The bead lane's straight
 *  run — and gesture 3's over-draw — starts here. */
const FLOCK_FRONT = FORM_C.y - BLOB_RY; // 734

const SEAT_LOCAL = { x: 0, y: -SEAT_GAP };
const DIST = FORM.distFrom(SEAT_LOCAL);
const WANDER_CAPS: number[] = flockWanderCaps(FORM);
/** Cut 2's five front agents, ported: the nearest 14 seats spread across x. */
const FRONT_POOL = 14;
const FRONT: number[] = (() => {
  const pool = FORM.seats
    .map((s, i) => ({ i, x: s.x }))
    .slice(0, FRONT_POOL)
    .sort((a, b) => a.x - b.x);
  return [0, 1, 2, 3, 4].map((n) => pool[Math.round((n * (pool.length - 1)) / 4)].i);
})();
const headingAt = () => H_USER;

/** THE LEVELS. `start` is where the tick stands before anything reaches it —
 *  which is also where its GHOST stays for the rest of the cut. */
export const NOTCH = 40; // world px a level rises when a bead reaches it
/** THE TWO STARTS ARE SOLVED, not chosen, and the 40 px notch is what solves
 *  them. INS_START is fixed from below: the ring's own top edge is at world
 *  426, so 390 keeps 33 px of air under the tick's stroke. Instruction
 *  following then climbs 5 notches — 200 px — to 190, and honesty's GHOST
 *  stands at HON_START for the whole cut, so HON_START has to sit at least a
 *  tick's-worth of air below that: 110 leaves 80 world px (92-124 screen px
 *  over the cut's k range) between instruction following's last level and
 *  honesty's ghost, and no ghost/tick pair ever comes closer than that
 *  (STATS.layout.worstMarkGap measures every pair on every frame). */
export const HON_START = 110;
export const INS_START = 390;
export const TICK_HALF = 55; // a tick reaches this far either side of the axis
/** A ghost is the same mark at 60% of the length, so the pair never reads as a
 *  ruler with two rungs on it. */
const GHOST_F = 0.6;
const LABEL_GAP = 14; // ...and its label sits this far past the tick's end
/** THE LABEL SIZE IS SOLVED off the two ends of the zoom. It has to be >= 56
 *  screen px at the widest (k 1.15) and its longest LINE has to stay left of
 *  screen 1000 at the closest (k 1.55): 56 / 1.15 = 48.7 -> 49 world px, and
 *  "instruction" — the wider of the two lines, which is why the second label is
 *  set over two lines rather than one — is then 217 world px (measured off
 *  Sohne-Kraftig's advance widths), so its right edge lands at
 *  540 + (55 + 14 + 217) * 1.55 = 983. */
const LABEL_W = 50;
/** How far the arrow's head stays beyond the highest tick. */
const AXIS_LEAD = 74;
/** The frame the second level draws on, with its label: "instruction" (f24). */
const INS_IN = 24;

// ---------------------------------------------------------------------------
// THE WAVE. Cut 2's telling is still crossing the flock when this cut starts,
// and it is re-keyed here (3.2 s of face shot sit between, so the phase is not
// continuous): arrival is keyed on DISTANCE from the seat's ring edge through a
// quadratic fitted to three anchors — the nearest agent at WAVE_PRE, the 45th
// percentile at 0 and the farthest at WAVE_END — so at f0 the wave stands 45%
// through the flock and still travelling, and the last agent turns by f49.
// ---------------------------------------------------------------------------
const WDIST: number[] = DIST.dist.map((d) => Math.max(0, d - SEAT_R));
const WD_MIN = Math.min(...WDIST);
const WD_MAX = Math.max(...WDIST);
const WD_45 = (() => {
  const s = WDIST.slice().sort((a, b) => a - b);
  return s[Math.floor(0.45 * (s.length - 1))];
})();
const WAVE_PRE = -96;
const WAVE_END = 40;
const WAVE_Q = (() => {
  const s12 = (0 - WAVE_PRE) / (WD_45 - WD_MIN);
  const s23 = (WAVE_END - 0) / (WD_MAX - WD_45);
  const a = (s23 - s12) / (WD_MAX - WD_MIN);
  const b = s12 - a * (WD_MIN + WD_45);
  const c = 0 - a * WD_45 * WD_45 - b * WD_45;
  return { a, b, c };
})();
const SNAP_F = 7; // cut 2's own: the frames an agent takes to turn onto the arrow
const waveAt = (w: number) => WAVE_Q.a * w * w + WAVE_Q.b * w + WAVE_Q.c;
const SNAP_AT: number[] = FORM.seats.map((s, i) =>
  waveArrival(0, s.i, waveAt(WDIST[i]), 1, 2.5),
);
export const snapOf = (i: number, f: number) =>
  smoothstep(clamp01((f - SNAP_AT[i]) / SNAP_F));

// ---------------------------------------------------------------------------
// THE AGENTS — cut 2's, value for value.
// ---------------------------------------------------------------------------
const HUNT_ENVELOPE = (45 * Math.PI) / 180;
const HUNT_SWING_MIN = (15 * Math.PI) / 180;
const HUNT_SWING_MAX = (23 * Math.PI) / 180;
const HUNT_BASE_MAX = (22 * Math.PI) / 180;
const HUNT_P_MIN = 40;
const HUNT_P_MAX = 70;
const HUNT_TIGHT = (2 * Math.PI) / 180;
const huntSwing = (i: number) =>
  HUNT_SWING_MIN + (HUNT_SWING_MAX - HUNT_SWING_MIN) * hash(i, 81);
const huntBase = (i: number) => {
  const b = (hash(i, 84) * 2 - 1) * HUNT_BASE_MAX;
  const room = HUNT_ENVELOPE - huntSwing(i);
  return Math.sign(b) * Math.min(Math.abs(b), room);
};
const huntRate = (i: number) =>
  TWO_PI / (HUNT_P_MIN + (HUNT_P_MAX - HUNT_P_MIN) * hash(i, 82));
const huntPhase = (i: number) => hash(i, 83) * TWO_PI;

export const agentAt = (i: number, f: number) => {
  const s = FORM.seats[i];
  const w = flockWander(s, f, WANDER_CAPS[i]);
  const p = formationAt({ x: s.x + w.dx, y: s.y + w.dy }, FORM_C, headingAt());
  const t = snapOf(i, f);
  const osc = Math.sin(f * huntRate(s.i) + huntPhase(s.i));
  const loose = H_USER + huntBase(s.i) + huntSwing(s.i) * osc + w.da;
  const tight = H_USER + HUNT_TIGHT * osc + w.da * 0.3;
  return { x: p.x, y: p.y, r: s.r, heading: turn(loose, tight, t), tone: t };
};
/** Every agent's seat in the world, wander off: what the bead routes are built
 *  on (the wander is +-3.5 px, a fifth of a bead). */
const AGENT_POS = FORM.seats.map((s) => formationAt(s, FORM_C, headingAt()));

// ---------------------------------------------------------------------------
// THE LINK WEB. Cut 2's `linkPaint` — idle, a 5/12-frame travelling band as a
// wave crosses, and a rest floor once the channel wake has passed (which it did
// during cut 2) — scaled DOWN by LINK_DIM so the idle rung is 0.22 rather than
// cut 2's 0.30. In this cut the flock is the source of the beads and nothing
// else, and the axis is the only thing that should read as structure.
// ---------------------------------------------------------------------------
const LINK_DIM = 0.22 / 0.3;
const CH_DONE = -400; // the channel wake's arrival in this cut's clock: long past
const PKT_R = 0.45 * DOT_R;
const PKT_PERIOD_IDLE = PACKET_PERIOD * 3.4;
const PKT_PERIOD_LIT = PACKET_PERIOD * 1.7;
const WAVE_BEAD_R = 0.62 * DOT_R;
const LINK_GAP = 1.35;
const linkAlpha = (op: number, band: number) => op / lerp(LINK_IDLE, LINK_LIVE, band);
const beadOn = (ta: number, tb: number, f: number) => {
  if (tb <= ta) return null;
  const u = (f - ta) / (tb - ta);
  return u >= 0 && u <= 1 ? u : null;
};

// ---------------------------------------------------------------------------
// THE BEADS. One bead, one notch. The arrivals are AUTHORED — this is a cut
// about two levels going up at particular moments in a sentence, and 24 of them
// is the whole population, against V1's 177 — and everything else is derived
// from them: the nth bead on a level flies to where that level is STANDING when
// it gets there (start - NOTCH * (n - 1)), so its flight length is known, its
// birth is its arrival minus that flight, and the agent that sent it is one the
// wave had already reached by then.
//
// The rate is the gesture: 4 notches on honesty by f24, 4 on instruction
// following by f49 while honesty trickles one, then 3 more on honesty to f95 —
// and from f95 every bead goes to honesty at twice that rate (measured below).
// ---------------------------------------------------------------------------
export const BEAD_V = 22; // world px/frame
/** Frames a level takes to rise one notch. It is SOLVED against the 12 screen
 *  px/frame ceiling on a tick: a smoothstep's peak slope is 1.5 / RISE_F, so a
 *  40 px notch at the closest zoom peaks at 40 * 1.5 * 1.55 / RISE_F, and 10
 *  frames puts that at 9.3. Late in the cut the arrivals are 6 frames apart and
 *  the rises therefore overlap, which is what makes the last third read as one
 *  continuous climb rather than a staircase; overlapping smoothsteps average
 *  out, and the measured worst is STATS.levels.maxTickScreenV.
 *  */
const RISE_F = 14;
/** Four beads are still climbing at f172 — the cut hands over mid-motion, and
 *  the axis above the departed ring would otherwise be a bare 1650 screen px —
 *  so the honesty list runs four past what lands inside the cut. */
const HON_ARR = [
  0, 5, 10, 15, 29, 40, 52, 64, 76, 88, 96, 102, 108, 114, 120, 126, 132, 138, 144, 150, 156,
  162, 174, 182, 190, 198,
];
const INS_ARR = [26, 31, 36, 41, 70];

type Bead = {
  n: number; // which notch it makes, 1-based
  level: 0 | 1;
  agent: number;
  born: number;
  arrive: number;
  from: { x: number; y: number };
  to: number; // the world y it climbs to
  jink: number; // its hashed lateral jink past the lower tick
};

const LEVEL_START = [HON_START, INS_START];

const BEADS: Bead[] = (() => {
  const all: { level: 0 | 1; n: number; arrive: number }[] = [];
  HON_ARR.forEach((a, i) => all.push({ level: 0, n: i + 1, arrive: a }));
  INS_ARR.forEach((a, i) => all.push({ level: 1, n: i + 1, arrive: a }));
  all.sort((p, q) => p.arrive - q.arrive);
  const used = new Set<number>();
  return all.map((b, idx) => {
    const to = LEVEL_START[b.level] - NOTCH * (b.n - 1);
    // the flight: out of the flock to the ring, then up the axis to the level
    const pick = (agent: number) =>
      Math.hypot(AGENT_POS[agent].x - SEAT.x, AGENT_POS[agent].y - SEAT.y) + (SEAT.y - to);
    // whichever agent the wave has already reached can send it; prefer the one
    // it reached MOST RECENTLY, so a bead reads as coming out of the wavefront
    let best = -1;
    let bestSnap = -Infinity;
    for (let i = 0; i < FORM.seats.length; i++) {
      if (used.has(i)) continue;
      const born = b.arrive - pick(i) / BEAD_V;
      if (SNAP_AT[i] > born - 2) continue;
      const s = SNAP_AT[i] + hash(i, 96) * 4;
      if (s > bestSnap) {
        bestSnap = s;
        best = i;
      }
    }
    if (best < 0) {
      // nothing has been reached early enough (only possible for the first
      // beads, which are in flight before f0): fall back to the nearest agent
      best = 0;
      let d = Infinity;
      FORM.seats.forEach((_, i) => {
        if (used.has(i)) return;
        const dd = Math.hypot(AGENT_POS[i].x - SEAT.x, AGENT_POS[i].y - SEAT.y);
        if (dd < d) {
          d = dd;
          best = i;
        }
      });
    }
    used.add(best);
    return {
      n: b.n,
      level: b.level,
      agent: best,
      born: b.arrive - pick(best) / BEAD_V,
      arrive: b.arrive,
      from: AGENT_POS[best],
      to,
      jink: (hash(idx, 97) * 2 - 1) * 9,
    };
  });
})();

/** How many notches a level stands at, frame by frame: one smoothstep per
 *  arrival, so the level can only move while a bead is being absorbed. */
export const notchesAt = (level: 0 | 1, f: number) => {
  let n = 0;
  for (const b of BEADS) {
    if (b.level !== level) continue;
    n += smoothstep(clamp01((f - b.arrive) / RISE_F));
  }
  return n;
};
export const levelAt = (level: 0 | 1, f: number) =>
  LEVEL_START[level] - NOTCH * notchesAt(level, f);

/** A bead's position: out of the flock to the ring on one straight leg, then
 *  straight up the axis. The jink is a small hashed sideways bump as it passes
 *  the lower level, so a bead going past it never looks like a hit. */
const beadAt = (b: Bead, f: number) => {
  const legA = Math.hypot(b.from.x - SEAT.x, b.from.y - SEAT.y);
  const s = (f - b.born) * BEAD_V;
  if (s <= legA) {
    const u = legA <= 1e-6 ? 1 : s / legA;
    return { x: lerp(b.from.x, SEAT.x, u), y: lerp(b.from.y, SEAT.y, u) };
  }
  const y = SEAT.y - (s - legA);
  let x = SEAT.x;
  if (b.level === 0) {
    const ins = levelAt(1, f);
    const d = Math.abs(y - ins);
    if (d < 44) x += b.jink * (1 - smoothstep(d / 44));
  }
  return { x, y };
};

// ---------------------------------------------------------------------------
// THE CAMERA. Knots on a monotone cubic Hermite (Fritsch-Carlson), one key per
// frame, through the shared damper, pre-rolled from -CAM_PRE so f0 is already
// mid-creep. The construction is `trapShared`'s, kept here rather than imported
// because that file is another clip's world.
// ---------------------------------------------------------------------------
const hermite = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
};

const CAM_PRE = 30;
const CAM_LAST = DURATION + 18;
const KF = [-CAM_PRE, 0, 24, 49, 95, 130, DURATION + 8];
const KY0 = [560, 372, 253, 246, 230, 66, -470];
const KK0 = [1.62, 1.55, 1.5, 1.44, 1.15, 1.18, 1.31];

const camTrack = (KY: number[], KK: number[]) => {
  const yOf = hermite(KF, KY);
  const kOf = hermite(KF, KK);
  return (upto: number) => {
    const y0 = KY[0];
    let k = KK[0];
    let cy = y0 + CAM_LIFT / k;
    let vy = 0;
    let vk = 0;
    const n = Math.round(upto);
    for (let f = -CAM_PRE + 1; f <= n; f++) {
      const tk = kOf(f);
      const ty = yOf(f) + CAM_LIFT / tk;
      vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
      cy += vy;
      vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
      k += vk;
    }
    return { cy, k, y: cy - CAM_LIFT / k };
  };
};

/** The framings the cut is designed around. */
const TARGET_FRAMES: [number, number, number][] = [
  [0, 372, 1.55],
  [24, 253, 1.5],
  [95, 230, 1.15],
  [130, 2, 1.17],
  [DURATION - 1, -422, 1.3],
];

const CAM = (() => {
  const KY = KY0.slice();
  const KK = KK0.slice();
  const idxOf = (f: number) => {
    if (f === 0) return 1;
    if (f === 24) return 2;
    if (f === 95) return 4;
    if (f === 130) return 5;
    return 6;
  };
  const secant = (
    arr: number[],
    i: number,
    f: number,
    target: number,
    pick: (r: { y: number; k: number }) => number,
  ) => {
    const a = arr[i];
    const fa = pick(camTrack(KY, KK)(f));
    arr[i] = a + 1;
    const fb = pick(camTrack(KY, KK)(f));
    arr[i] = fb === fa ? a : a + (target - fa) / (fb - fa);
  };
  for (let pass = 0; pass < 4; pass++) {
    for (const [f, ty, tk] of TARGET_FRAMES) {
      const i = idxOf(f);
      secant(KK, i, f, tk, (r) => r.k);
      secant(KY, i, f, ty, (r) => r.y);
    }
  }
  const run = camTrack(KY, KK);
  const table: { cy: number; k: number; y: number }[] = [];
  for (let f = 0; f <= CAM_LAST; f++) table.push(run(f));
  return { KY, KK, table };
})();

const camAt = (f: number) => CAM.table[Math.max(0, Math.min(CAM_LAST, Math.round(f)))];
export const CAM_AT = camAt;
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: CX + (wx - CX) * c.k, y: FRAME_H / 2 + (wy - c.cy) * c.k };
};
export const SCREEN_AT = screenAt;

// ---------------------------------------------------------------------------
// THE SPINE (gesture 3). The bead lane's straight run, drawn over as one
// full-opacity white line ON TOP of everything, bottom to top over f60-82,
// landing 4 frames before "path" (f86).
//
// IT IS THE SEGMENT FROM THE FLOCK'S FRONT TO THE ARROW'S FOOT, not the whole
// run to the tick: above the ring that run IS the axis and it is already INK_HI
// white, so drawing a second white line over it changes nothing anyone can see
// — measured on the first pass, the only visible part of the over-draw was this
// lower 230 px, and with the draw spread over the whole 747 px run it finished
// at f68, fourteen frames before its word. Drawn as the lower segment alone it
// lands at f82 and the picture gains what the gesture is for: one continuous
// white line from the head of the flock to the arrowhead, with the beads now
// passing BEHIND it. The axis has become the spine.
// ---------------------------------------------------------------------------
const SPINE_F0 = 60;
const SPINE_F1 = 82;
const spineDraw = (f: number) => smoothstep(clamp01((f - SPINE_F0) / (SPINE_F1 - SPINE_F0)));

// ---------------------------------------------------------------------------

const HonestyGoesUpV2: React.FC<Props> = ({
  ink,
  accent,
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
}) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const cy = cam.cy;
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  const tx = FRAME_W / 2 - CX * k;
  const ty = FRAME_H / 2 - cy * k;
  const tv = travel(frame, headingAt);

  const agents = FORM.seats.map((_, i) => agentAt(i, frame));

  // -- the two levels --------------------------------------------------------
  const lv = [levelAt(0, frame), levelAt(1, frame)];
  const insIn = labelIn(frame, INS_IN);
  /** The axis reaches AXIS_LEAD beyond the highest tick, so the arrow's head is
   *  always ahead of the level it carries. */
  const axisTop = Math.min(lv[0], lv[1]) - AXIS_LEAD;
  const sp = spineDraw(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy + tv.y}
        cyRest={CAM.table[0].cy}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          {/* 1. THE FLOCK: links first, so a comet always sits on top of the
              wires between them. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {FORM.links.map(([i, j], n) => {
              const a0 = agents[i];
              const b0 = agents[j];
              const ang = Math.atan2(b0.y - a0.y, b0.x - a0.x);
              const cs = Math.cos(ang);
              const sn = Math.sin(ang);
              const p = { x: a0.x + cs * a0.r * LINK_GAP, y: a0.y + sn * a0.r * LINK_GAP };
              const q = { x: b0.x - cs * b0.r * LINK_GAP, y: b0.y - sn * b0.r * LINK_GAP };
              const near = SNAP_AT[i] <= SNAP_AT[j] ? i : j;
              const far = near === i ? j : i;
              const u = beadOn(SNAP_AT[near], SNAP_AT[far], frame);
              const from = near === i ? p : q;
              const to = near === i ? q : p;
              const paint = linkPaint(CH_DONE, Math.min(SNAP_AT[i], SNAP_AT[j]), frame);
              const op = paint.op * LINK_DIM;
              const pk =
                u === null
                  ? linkPackets({
                      frame,
                      k,
                      from: p,
                      to: q,
                      period: lerp(PKT_PERIOD_IDLE, PKT_PERIOD_LIT, paint.band),
                      phase: hash(n, 7) * PKT_PERIOD_IDLE,
                    })
                  : [];
              return (
                <g key={`l${n}`}>
                  <Link
                    frame={frame}
                    k={k}
                    kind="agent"
                    from={p}
                    to={q}
                    live={paint.band}
                    packets={false}
                    opacity={linkAlpha(op, paint.band)}
                  />
                  {pk.map((w, m) => (
                    <circle key={`t${m}`} cx={w.x} cy={w.y} r={PKT_R} fill={accent} opacity={op} />
                  ))}
                  {u === null ? null : (
                    <circle
                      cx={from.x + (to.x - from.x) * u}
                      cy={from.y + (to.y - from.y) * u}
                      r={WAVE_BEAD_R}
                      fill={accent}
                    />
                  )}
                </g>
              );
            })}

            {FRONT.map((i) => {
              const p = agents[i];
              const ang = Math.atan2(p.y - SEAT.y, p.x - SEAT.x);
              const from = {
                x: SEAT.x + Math.cos(ang) * SEAT_R,
                y: SEAT.y + Math.sin(ang) * SEAT_R,
              };
              const to = {
                x: p.x - Math.cos(ang) * p.r * 1.7,
                y: p.y - Math.sin(ang) * p.r * 1.7,
              };
              return (
                <Link
                  key={`s${i}`}
                  frame={frame}
                  k={k}
                  kind="seat"
                  from={from}
                  to={to}
                  live={1}
                  phase={hash(i, 7) * PACKET_PERIOD * 2.2}
                />
              );
            })}

            {agents.map((a, i) => (
              <Comet key={`a${i}`} x={a.x} y={a.y} heading={a.heading} r={a.r} tone={a.tone} />
            ))}
          </svg>

          {/* 3. THE AXIS — the user's own arrow at a longer `len`, with its head
              always ahead of the highest tick. 4. THE LEVELS: a ghost tick where
              each one started, the tick itself, and one Söhne line to its
              right. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <SeatArrow k={k} cx={SEAT.x} cy={SEAT.y} len={SEAT.y - axisTop} />

            <g style={{ filter: icon }}>
              {([0, 1] as const).map((n) => {
                const show = n === 1 ? insIn : 1;
                if (show <= 0) return null;
                return (
                  <g key={`g${n}`} opacity={show}>
                    <line
                      x1={CX - TICK_HALF * GHOST_F}
                      y1={LEVEL_START[n]}
                      x2={CX + TICK_HALF * GHOST_F}
                      y2={LEVEL_START[n]}
                      stroke={ink}
                      strokeWidth={STROKE_W}
                      strokeLinecap="round"
                      opacity={INK_LO}
                    />
                    <line
                      x1={CX - TICK_HALF}
                      y1={lv[n]}
                      x2={CX + TICK_HALF}
                      y2={lv[n]}
                      stroke={ink}
                      strokeWidth={STROKE_W}
                      strokeLinecap="round"
                      opacity={INK_HI}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 5. THE BEADS: out of the flock, through the ring, up the axis. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {BEADS.map((b, i) => {
              if (frame < b.born) return null;
              // absorbed: it shrinks into the level over the rise
              const out = clamp01((frame - b.arrive) / 3);
              if (out >= 1) return null;
              const p = beadAt(b, Math.min(frame, b.arrive));
              const grow = Math.min(1, (frame - b.born) / 3);
              const r = BEAD_R * grow * (1 - out);
              if (r < 0.2) return null;
              return <circle key={`b${i}`} cx={p.x} cy={p.y} r={r} fill={accent} />;
            })}
          </svg>

          {/* 2. THE USER SEAT, over the flock and the beads that pass through it:
              the ring, A in it, and `user ◯ A` on its shoulders — cut 2's own
              geometry, both INK_HI. */}
          <UserSeat
            k={k}
            x={SEAT.x}
            y={SEAT.y}
            frame={frame}
            occupant="agent"
            arrow={0}
            agentTone={1}
            agentHeading={H_USER}
          />
          <Label
            k={k}
            x={SEAT.x - SEAT_R - 26 - LABEL_SIZE * 1.1}
            y={SEAT.y - LABEL_SIZE * 0.52}
            text="user"
            inT={1}
            opacity={INK_HI}
          />
          <Label
            k={k}
            x={SEAT.x + SEAT_R + 26}
            y={SEAT.y - LABEL_SIZE * 0.5}
            text="A"
            inT={1}
            align="left"
            opacity={INK_HI}
          />

          {/* THE SPINE, on top of everything: the run from the front of the
              flock to the honesty tick, drawn over bottom to top. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {sp > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={CX}
                  y1={FLOCK_FRONT}
                  x2={CX}
                  y2={FLOCK_FRONT - (FLOCK_FRONT - AXIS_FOOT) * sp}
                  stroke={ink}
                  strokeWidth={STROKE_W}
                  strokeLinecap="round"
                  opacity={INK_HI}
                />
              </g>
            ) : null}
          </svg>

          {/* THE LEVEL LABELS, last, so type is never crossed by anything. */}
          {([0, 1] as const).map((n) => {
            const t = n === 1 ? insIn : 1;
            if (t <= 0) return null;
            // `honesty` is one line on the tick's own level; `instruction
            // following` is TWO lines, left-aligned at the same x and the block
            // centred on its tick, which is what keeps its longest line inside
            // screen 1000 at the closest zoom.
            const lines = n === 0 ? 1 : 2;
            const lh = LABEL_W * 0.95;
            const blockH = lines * lh;
            return (
              <div
                key={`lb${n}`}
                style={{
                  position: "absolute",
                  left: CX + TICK_HALF + LABEL_GAP,
                  top: lv[n] - blockH / 2 - LABEL_W * 0.09 + worldPx(24) * (1 - t),
                  fontFamily: FONT_LABEL,
                  fontSize: LABEL_W,
                  lineHeight: 0.95,
                  color: ink,
                  opacity: INK_HI * t,
                  whiteSpace: "nowrap",
                  filter: icon,
                }}
              >
                {n === 0 ? (
                  "honesty"
                ) : (
                  <>
                    instruction
                    <br />
                    following
                  </>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HonestyGoesUpV2;

// ---------------------------------------------------------------------------
// THE NUMBERS, computed rather than asserted.
// ---------------------------------------------------------------------------
const PROBES: [number, number][] = [
  [SEAT.x, SEAT.y],
  [CX, HON_START],
  [CX, HON_START - 18 * NOTCH],
  [FORM_C.x, FORM_C.y],
  [FORM_C.x, FORM_C.y + BLOB_RY],
];

const camStats = (() => {
  let dv = 0;
  let dvAt = 0;
  let v = 0;
  let vAt = 0;
  for (const [px, py] of PROBES) {
    for (let f = 2; f < DURATION; f++) {
      const p0 = screenAt(f - 2, px, py);
      const p1 = screenAt(f - 1, px, py);
      const p2 = screenAt(f, px, py);
      if (p1.y < -120 || p1.y > FRAME_H + 120) continue;
      const m = Math.hypot(p2.x - 2 * p1.x + p0.x, p2.y - 2 * p1.y + p0.y);
      if (m > dv) {
        dv = m;
        dvAt = f;
      }
      const s = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (s > v) {
        v = s;
        vAt = f;
      }
    }
  }
  return { dv, dvAt, v, vAt };
})();

/** Every bead's and every tick's screen speed, against the set's 45 px/f. */
const speedStats = (() => {
  let bead = 0;
  let beadAt = 0;
  let tick = 0;
  let tickAt = 0;
  for (let f = 1; f < DURATION; f++) {
    const kk = camAt(f).k;
    for (const b of BEADS) {
      if (f < b.born || f > b.arrive) continue;
      const p0 = beadAtProbe(b, f - 1);
      const p1 = beadAtProbe(b, f);
      const s = Math.hypot(p1.x - p0.x, p1.y - p0.y) * kk;
      if (s > bead) {
        bead = s;
        beadAt = f;
      }
    }
    for (const n of [0, 1] as const) {
      const s = Math.abs(levelAt(n, f) - levelAt(n, f - 1)) * kk;
      if (s > tick) {
        tick = s;
        tickAt = f;
      }
    }
  }
  return { bead, beadAt, tick, tickAt };
})();
function beadAtProbe(b: Bead, f: number) {
  return beadAt(b, Math.min(f, b.arrive));
}

/** NO FUSED COMETS: the worst pair over every frame, in mean radii. */
const sepStats = (() => {
  let worst = Infinity;
  let at = 0;
  for (let f = 0; f < DURATION; f++) {
    const pos = FORM.seats.map((_, i) => agentAt(i, f));
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const d = Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y);
        const m = d / (0.5 * (pos[i].r + pos[j].r));
        if (m < worst) {
          worst = m;
          at = f;
        }
      }
    }
  }
  return { worst: Number(worst.toFixed(3)), at, floor: SEP_FLOOR };
})();

/** THE LABEL BOXES, in SCREEN px, against the frame's right edge and against
 *  everything they could cross: each other, the axis, the ticks and the ring's
 *  own two labels. Measured off Sohne-Kraftig's advance widths at LABEL_PX. */
const W_HON = (142.9 * LABEL_W) / 40; // "honesty"
const W_INS = (177.0 * LABEL_W) / 40; // "instruction", the wider of the two lines
const W_USER = 79.1; // the ring's own labels are still at LABEL_SIZE
const W_A = 28.4;
const labelStats = (() => {
  let right = 0;
  let rightAt = 0;
  let gapLevels = Infinity;
  let gapLevelsAt = 0;
  let gapRing = Infinity;
  let gapRingAt = 0;
  let minPx = Infinity;
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const box = (wy: number, x0w: number, ww: number, hw: number) => {
      const p = screenAt(f, x0w, wy);
      return { x0: p.x, x1: p.x + ww * c.k, y0: p.y, y1: p.y + hw * c.k };
    };
    const lvl = [levelAt(0, f), levelAt(1, f)];
    const lh = LABEL_W * 0.95;
    const hon = box(
      lvl[0] - lh / 2 - LABEL_W * 0.09,
      CX + TICK_HALF + LABEL_GAP,
      W_HON,
      lh,
    );
    const ins = box(
      lvl[1] - lh - LABEL_W * 0.09,
      CX + TICK_HALF + LABEL_GAP,
      W_INS,
      2 * lh,
    );
    const insLive = f >= INS_IN;
    const user = box(
      SEAT.y - LABEL_SIZE * 0.52,
      SEAT.x - SEAT_R - 26 - LABEL_SIZE * 1.1 - W_USER / 2,
      W_USER,
      LABEL_SIZE,
    );
    const aLab = box(SEAT.y - LABEL_SIZE * 0.5, SEAT.x + SEAT_R + 26, W_A, LABEL_SIZE);
    if (hon.x1 > right) {
      right = hon.x1;
      rightAt = f;
    }
    if (insLive && ins.x1 > right) {
      right = ins.x1;
      rightAt = f;
    }
    minPx = Math.min(minPx, LABEL_W * c.k);
    const gapOf = (a: typeof hon, b: typeof hon) => {
      const dx = Math.max(a.x0 - b.x1, b.x0 - a.x1);
      const dy = Math.max(a.y0 - b.y1, b.y0 - a.y1);
      return Math.max(dx, dy);
    };
    if (insLive) {
      const g = gapOf(hon, ins);
      if (g < gapLevels) {
        gapLevels = g;
        gapLevelsAt = f;
      }
    }
    for (const lab of insLive ? [hon, ins] : [hon]) {
      for (const other of [user, aLab]) {
        const g = gapOf(lab, other);
        if (g < gapRing) {
          gapRing = g;
          gapRingAt = f;
        }
      }
    }
  }
  return {
    maxRightEdge: Number(right.toFixed(0)),
    maxRightEdgeAt: rightAt,
    minGapBetweenLevelLabels: Number(gapLevels.toFixed(0)),
    minGapBetweenLevelLabelsAt: gapLevelsAt,
    minGapToRingLabels: Number(gapRing.toFixed(0)),
    minGapToRingLabelsAt: gapRingAt,
    minLabelPx: Number(minPx.toFixed(1)),
  };
})();

/** THE CAPTION BAND, every frame: the highest ink of a tick or a label box and
 *  the lowest, against 200 and 1400. The ring, its own labels and the flock are
 *  not in this — the flock is context and bleeds under 1300 by agreement — but
 *  every tick and every level label is. */
const bandStats = (() => {
  let hi = Infinity;
  let hiAt = 0;
  let lo = -Infinity;
  let loAt = 0;
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const yOf = (w: number) => FRAME_H / 2 + (w - c.cy) * c.k;
    const lh = LABEL_W * 0.95;
    const items: number[][] = [
      [levelAt(0, f), levelAt(0, f)],
      [HON_START, HON_START],
      [levelAt(0, f) - lh / 2 - LABEL_W * 0.09, levelAt(0, f) + lh / 2 - LABEL_W * 0.09],
    ];
    if (f >= INS_IN) {
      items.push([levelAt(1, f), levelAt(1, f)]);
      items.push([INS_START, INS_START]);
      items.push([levelAt(1, f) - lh - LABEL_W * 0.09, levelAt(1, f) + lh - LABEL_W * 0.09]);
    }
    for (const [a, b] of items) {
      const ya = yOf(a);
      const yb = yOf(b);
      if (ya < hi) {
        hi = ya;
        hiAt = f;
      }
      if (yb > lo) {
        lo = yb;
        loAt = f;
      }
    }
  }
  return {
    topMin: Number(hi.toFixed(0)),
    topMinAt: hiAt,
    bottomMax: Number(lo.toFixed(0)),
    bottomMaxAt: loAt,
  };
})();

/** The framing, on the frames the cut is designed around. */
const framing = (() => {
  const at = (f: number) => {
    const y = (w: number) => screenAt(f, CX, w).y;
    return {
      f,
      k: Number(camAt(f).k.toFixed(3)),
      axisHead: Number(y(Math.min(levelAt(0, f), levelAt(1, f)) - AXIS_LEAD).toFixed(0)),
      honesty: Number(y(levelAt(0, f)).toFixed(0)),
      instruction: Number(y(levelAt(1, f)).toFixed(0)),
      ring: Number(y(SEAT.y).toFixed(0)),
      flockHead: Number(y(FLOCK_FRONT).toFixed(0)),
      flockBottom: Number(y(FORM_C.y + BLOB_RY).toFixed(0)),
    };
  };
  return [0, 24, 49, 86, 95, 130, 157, 172].map(at);
})();

/** THE FOUR MARKS — two live ticks and two ghosts — on every frame, in world
 *  px. Nothing may come closer than a tick's own stroke plus air, and the pair
 *  that comes closest over the whole cut is what HON_START was solved against. */
const markStats = (() => {
  let worst = Infinity;
  let at = 0;
  let pair = "";
  for (let f = 0; f < DURATION; f++) {
    const marks: [string, number][] = [
      ["honesty", levelAt(0, f)],
      ["honesty-ghost", HON_START],
    ];
    if (f >= INS_IN) {
      marks.push(["instruction", levelAt(1, f)]);
      marks.push(["instruction-ghost", INS_START]);
    }
    for (let i = 0; i < marks.length; i++) {
      for (let j = i + 1; j < marks.length; j++) {
        if (marks[i][0].split("-")[0] === marks[j][0].split("-")[0]) continue;
        const d = Math.abs(marks[i][1] - marks[j][1]);
        if (d < worst) {
          worst = d;
          at = f;
          pair = `${marks[i][0]}/${marks[j][0]}`;
        }
      }
    }
  }
  return { worstMarkGap: Number(worst.toFixed(1)), at, pair };
})();

export const BEATS = defaultProps.beats;
export const STATS = {
  duration: DURATION,
  elementTypes: 5,
  layout: {
    seat: SEAT,
    axisFoot: Number(AXIS_FOOT.toFixed(1)),
    flockFront: FLOCK_FRONT,
    honStart: HON_START,
    insStart: INS_START,
    notch: NOTCH,
    tickHalf: TICK_HALF,
    ringTopEdge: Number((SEAT.y - SEAT_R).toFixed(0)),
    insTickClearOfRing: Number((SEAT.y - SEAT_R - INS_START - STROKE_W / 2).toFixed(1)),
    labelWorldPx: LABEL_W,
    ghostFraction: GHOST_F,
    ...markStats,
  },
  wave: {
    pre: WAVE_PRE,
    end: WAVE_END,
    vertex: Number((-WAVE_Q.b / (2 * WAVE_Q.a)).toFixed(0)),
    snappedAt: [0, 20, 40, 49].map((f) => [
      f,
      FORM.seats.filter((_, i) => snapOf(i, f) >= 0.999).length,
      FORM.seats.filter((_, i) => snapOf(i, f) > 0.001 && snapOf(i, f) < 0.999).length,
    ]),
  },
  camera: {
    ky: CAM.KY.map((v) => Number(v.toFixed(1))),
    kk: CAM.KK.map((v) => Number(v.toFixed(4))),
    at: [0, 24, 49, 86, 95, 130, 172].map((f) => [
      f,
      Number(camAt(f).y.toFixed(1)),
      Number(camAt(f).k.toFixed(3)),
    ]),
    maxDv: Number(camStats.dv.toFixed(3)),
    maxDvAt: camStats.dvAt,
    maxProbeV: Number(camStats.v.toFixed(2)),
    maxProbeVAt: camStats.vAt,
  },
  levels: {
    beads: BEADS.length,
    beadV: BEAD_V,
    maxBeadScreenV: Number(speedStats.bead.toFixed(2)),
    maxBeadScreenVAt: speedStats.beadAt,
    maxTickScreenV: Number(speedStats.tick.toFixed(2)),
    maxTickScreenVAt: speedStats.tickAt,
    notchesAt: [0, 16, 24, 31, 49, 66, 86, 95, 121, 146, 157, 172].map((f) => [
      f,
      Number(notchesAt(0, f).toFixed(2)),
      Number(notchesAt(1, f).toFixed(2)),
    ]),
    honestyRateBefore95: Number((3 / 46).toFixed(4)),
    honestyRateAfter95: Number((10 / 77).toFixed(4)),
    inFlightAt172: BEADS.filter((b) => b.born <= 172 && b.arrive > 172).length,
    flight: [
      Number(Math.min(...BEADS.map((b) => b.arrive - b.born)).toFixed(1)),
      Number(Math.max(...BEADS.map((b) => b.arrive - b.born)).toFixed(1)),
    ],
    bornBeforeF0: BEADS.filter((b) => b.born < 0).length,
  },
  label: labelStats,
  band: bandStats,
  framing,
  separation: sepStats,
};
