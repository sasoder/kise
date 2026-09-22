import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
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
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  AGENT_TONE,
  ARROW_LEN,
  BEAD_R,
  Comet,
  DASH_OFF,
  DASH_ON,
  DOT_R,
  FPS as ALIGN_FPS,
  H_USER,
  INK,
  INK_HI,
  INK_LO,
  LABEL_SIZE,
  LINK_IDLE,
  Label,
  Link,
  MARCH_W,
  PARALLAX,
  SEAT_R,
  STROKE_W,
  TIP_LOOSE,
  TWO_PI,
  UserSeat,
  buildFormation,
  formationAt,
  travel,
  wanderOf,
} from "./alignShared";
import { hermite } from "./trapShared";

export const FPS = ALIGN_FPS;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Alignment`, cut 4 `TranslateDirectlyV2` (in at 0:38.280):
// "There's a lot of reasons why this is, like, challenging to translate
//  directly into alignment gains."
//
// V2, on the user's verdict on V1: "the idea works but it feels super crowded
// and overstimulating; needs fine tuning to help visualize WHY it's
// challenging." So two changes and nothing else: the frame is EMPTIED, and the
// bars are given something to DO.
//
// DURATION, the word table, the head's easing, the camera budget and every
// shared import are V1's, untouched.
//
//   DURATION = round((41.500 - 38.280) * 24) + 16 = 77 + 16 = 93
//
// Word onsets, frame = round((t - 38.280) * 24), lifted from the SRT:
//   there's 0 · a 3 · LOT 4 · of 6 · REASONS 8 · why 12 · this 17 · is 22 ·
//   like 25 · CHALLENGING 29 · to 36 · TRANSLATE 40 · DIRECTLY 47 · into 56 ·
//   ALIGNMENT 59 · GAINS 66 (ends 77) · tail 77-93.
//
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "a line carrying orange beads tries to go straight up to the person's
//    flock, but bars keep blocking the direct way; it winds round each one and
//    at every bar some of the beads get stuck."
//
// ---------------------------------------------------------------------------
// THE WHY, which is the new thing. In V1 the bars were obstacles and that was
// all they were: the line went round them and nothing was lost, so the picture
// said "this is fiddly" rather than "this is costly". Now the ALIGNMENT GAINS
// ARE CARGO. Accent BEADS — cut 3's eval beads, at the shared BEAD_R — leave
// A's ring in a steady train and ride the line ON the route, each one a fixed
// lag behind the head and travelling at exactly the head's speed. At every bar,
// as the train comes up to the open end, a hashed STICK_P of the beads DO NOT
// MAKE THE TURN: STICK_LEAD world px short of the bar they stop following the
// route, hold their lateral offset, run STRAIGHT into the bar and stop against
// it, ripening down deep over STICK_FADE frames. They never move again. The
// ones that make the turn carry on behind the head.
//
// So every bar now costs something, the cost is visible and cumulative, and the
// line arrives at the top of the cut carrying less than it set out with. That
// is the "why".
//
// Measured: 10 beads leave the ring by f93 (the tenth is still on the ring at
// f91.3), BEADS_STUCK of them are stopped against the three passed bars, and
// the rest are still travelling behind a head that is mid-swerve at bar 4.
// NOTHING REACHES THE PERSON'S FLOCK: the leading bead is at u 602 of the 950
// px corridor on the last frame.
//
// ---------------------------------------------------------------------------
// THE DE-CLUTTER, counted. V1 put six bars, two 32-comet flocks, two seats, a
// guide, a route, a head and a label on screen at once. V2 holds at most FIVE
// kinds of thing on any frame:
//   1. the dashed GUIDE, straight up the axis — the direct route
//   2. the BARS: four, and only ever ONE of them unpassed and visible
//   3. the solid ROUTE and its HEAD
//   4. the BEADS, travelling and stuck
//   5. the SEATS: A's ring with A in it and "A" beside it at the bottom, and
//      the person's ring with its arrow and its flock at the top
// and what went:
//   * THE A-FLOCK IS GONE. A's ring is the start point and there is nothing
//     under it. It was 32 comets and ~53 links inside the caption band for the
//     first third of the cut, i.e. most of the crowding, and it was saying
//     something ("already aligned") the cut does not need: this cut is about
//     the journey, not the origin.
//   * ONLY THE NEXT BAR IS VISIBLE. Bar 1 stands from f0; bar j+1 fades in over
//     BAR_IN = 10 frames from the frame the head passes bar j. So the frame
//     carries exactly one unpassed bar at a time — the reason you are at, not a
//     wall of reasons — and the passed ones stay INK_HI behind as the tally.
//     At f0 the guide runs 896 world px up the frame with ONE bar on it.
//   * FOUR BARS, NOT SIX, with longer gaps (130 / 177 / 213 / 270) and wider
//     swerves: the widest apex is 135 world px = 129.6 screen px at the final k
//     against V1's 118.5, so the detour is bigger and there is less of it.
//   * THE LINKS DROP TO LINK_OP 0.2 (V1: 0.3), still through a local multiplier.
//
// ---------------------------------------------------------------------------
// GESTURES — TWO, and nothing in the piece is outside this list.
//
//  1. f0-40   "there's a LOT    THE WINDING HEAD AND ITS TRAIN. Opens
//             of REASONS why    mid-flight at k 1.300 on A's ring with the
//             this is like      first bead just leaving it, 50 world px of
//             CHALLENGING"      drawn line, and ONE bar standing ahead. As the
//             (4/8/12/17/       head nears each bar that bar draws up INK_LO ->
//              22/25/29)        INK_HI FROM THE GUIDE OUTWARDS over 65 world px
//                               of the head's travel, and the head swerves
//                               round its open end on the route's C1 arcs —
//                               bar 1 passed at f8 ("REASONS"), bar 2 at f30
//                               ("CHALLENGING"), bar 3 at f66 ("GAINS"). At
//                               each one, beads that do not make the turn run
//                               into the bar and stop.
//  2. f26-93  "to TRANSLATE     THE PULL-BACK. ONE glide, k 1.328 at f26 easing
//             DIRECTLY into     to K_WIDE_CUT 0.960 at RESOLVED_F 86 and on
//             ALIGNMENT GAINS"  past it (TAIL_DK), while the camera's rise
//             (36/40/47/56/     carries on. It reveals the straight dashed
//              59/66)           guide against the winding solid route, the
//                               stuck beads standing on the bars behind, the
//                               one bar still ahead, and the destination: the
//                               person's ring and its loose, deep, hunting
//                               flock. At f93 the head is 68.6% of the way, mid
//                               swerve between bars 3 and 4, and it does not
//                               arrive.
//
// LIVENESS — mechanisms, not gestures, none on a word and none ever stopping:
// the grid sliding under everything (`travel`, PARALLAX * SLIDE_V = 2.56 screen
// px/frame at k 1), the destination's HUNTING (every comet swinging its full
// +-28 deg on its own hashed 40-70 frame period), the wander, the packets on
// its links, the guide's dashes marching at 3 x MARCH_W, the bead train, the
// head (5.21 to 20.33 world px/frame, never 0) and the camera, which never
// parks.
//
// ---------------------------------------------------------------------------
// CAMERA. V1's construction exactly: monotone Hermite knots (Fritsch-Carlson),
// one key per frame, cy off the EASED k, through the shared damper, PRE-ROLLED
// PRE frames so it is already travelling on f0. The rise knots are the HEAD's
// own y at a screen target — 1100 (f0), 1120 (f12), 1150 (f26), 1190 (F_MID 40)
// — and the f0 and last keys of both channels are SOLVED so the damped camera
// reads K_OPEN and the opening centre on f0, and K_WIDE_CUT / C_WIDE on f86.
// x never pans; `sway` is the only hand on it.
//
// END FRAMING, V1's rules: the arrow tip on screen 200, the head mid-swerve at
// 1149, nothing live below 1300 after f40, k 0.960 >= 0.95 — which puts
// `person.png` at 113.4 screen px, an agent at 15.4, a bead at 17.3 and the
// stroke at 6.24.
// ---------------------------------------------------------------------------

export const DURATION = 93;

export const schema = z.object({
  ink: z.string(),
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
    lot: z.number(),
    reasons: z.number(),
    challenging: z.number(),
    translate: z.number(),
    directly: z.number(),
    alignment: z.number(),
    gains: z.number(),
    end: z.number(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: PARALLAX,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  beats: {
    lot: 4,
    reasons: 8,
    challenging: 29,
    translate: 40,
    directly: 47,
    alignment: 59,
    gains: 66,
    end: 77,
  },
});

// ---------------------------------------------------------------------------
// THE WORLD, in world px (k = 1 means world px = screen px).
// ---------------------------------------------------------------------------
export const AXIS = 540;

/** The DESTINATION's blob. With the A-flock gone, the whole vertical budget
 *  belongs to this one formation, so it can be the shared blob's own 1.13:1
 *  shape instead of V1's flattened 1.67:1 — 340 x 300 world px holding 32
 *  comets at 48 px of spacing, against the shared blob's 59. */
export const BLOB_RX_CUT = 170;
export const BLOB_RY_CUT = 150;
/** Air between the blob's top edge and the seat's CENTRE: the ring's radius,
 *  the 20 px a feathered seat can sit outside the nominal edge, and 22 of air.
 *  Every px of it comes off K_WIDE_CUT. */
export const SEAT_STANDOFF = 120;
export const SEAT_GAP_CUT = BLOB_RY_CUT + SEAT_STANDOFF;
export const N_AGENTS = 32;
/** The person-formation's headings hunt over this half-angle. */
export const LOOSE_DEG = 28;

/** WHERE THE LINKS SIT — V1's local multiplier, one rung quieter. `Link`
 *  multiplies its idle rung by `opacity`, so the multiplier that lands an idle
 *  link on LINK_OP is LINK_OP / LINK_IDLE. No exported value is touched, and
 *  the comets stay the brightest orange thing in the frame. */
export const LINK_OP = 0.2;
export const LINK_MUL = LINK_OP / LINK_IDLE;
/** THE HUNTING: the full +-LOOSE_DEG on each seat's own hashed period and
 *  phase, so the destination is visibly casting about for a heading it has not
 *  found rather than holding a static fan. */
export const HUNT_P0 = 40;
export const HUNT_P1 = 70;
/** How far LEFT of A's ring the "A" sits, to the text's centre. */
export const LABEL_SIDE = SEAT_R + 40;

/** A's SEAT: a ring with Agent A in it, and NOTHING UNDER IT. It is the start
 *  point of the line and of the bead train, and that is all it is now. */
export const A_SEAT = { x: AXIS, y: 2000 };
/** The route, the guide and the beads all leave the ring's top edge. */
export const ROUTE_Y0 = A_SEAT.y - SEAT_R;
/** The clear corridor from that ring to the person-flock's tail. */
export const GUIDE_LEN = 950;
export const ROUTE_Y1 = ROUTE_Y0 - GUIDE_LEN;
export const P_CENTRE = { x: AXIS, y: ROUTE_Y1 - DOT_R - BLOB_RY_CUT };
export const P_SEAT = { x: AXIS, y: P_CENTRE.y - SEAT_GAP_CUT };
export const ARROW_TIP_Y = P_SEAT.y - ARROW_LEN;

// ---------------------------------------------------------------------------
// THE BARRIERS. Four, irregularly spaced, strictly alternating which side they
// leave open. The apex the route has to reach to clear an open end is solved
// off the SPACING, so a bar with room gets a big swerve and one squeezed
// between two close neighbours does not — and the bar's OVERHANG past the guide
// is then the apex less the clearance the head needs, so the open end always
// sits just inside the swerve and going round the far end is always visibly
// longer.
//
// The u positions are chosen so that V1's head easing — kept exactly — passes
// them on the director's frames: measured, f8.0, f30.0 and f66.0.
// ---------------------------------------------------------------------------
export const BAR_L0 = 340;
export const BAR_L1 = 440;
export const N_BARS = 4;
export const barLen = (i: number) => BAR_L0 + ((BAR_L1 - BAR_L0) * i) / (N_BARS - 1);
/** head radius + half the bar's stroke + air. */
export const BAR_CLEAR = 22;
export const APEX_MAX = 135;
export const APEX_MIN = 40;
export const APEX_K = 0.68;
/** How far before a bar the head is when that bar starts drawing up, and how
 *  far the head travels while it does — both in world px of the head's own
 *  vertical progress, so the wipe is derived from the visible thing. */
export const BAR_LEAD_D = 110;
export const BAR_WIPE_D = 65;
/** Frames a bar takes to fade in once the head has passed the one before it. */
export const BAR_IN = 10;

const BAR_U = [130, 307, 520, 790];
const BAR_SIDE = [1, -1, 1, -1];

export type Barrier = {
  u: number;
  y: number;
  side: number;
  apex: number;
  g: number;
  len: number;
  x0: number;
  x1: number;
};

export const BARRIERS: Barrier[] = BAR_U.map((ui, i) => {
  const before = ui - (i === 0 ? 0 : BAR_U[i - 1]);
  const after = (i === BAR_U.length - 1 ? GUIDE_LEN : BAR_U[i + 1]) - ui;
  const apex = Math.min(APEX_MAX, Math.max(APEX_MIN, APEX_K * Math.min(before, after)));
  const g = apex - BAR_CLEAR;
  const side = BAR_SIDE[i];
  const len = barLen(i);
  return {
    u: ui,
    y: ROUTE_Y0 - ui,
    side,
    apex,
    g,
    len,
    x0: AXIS + side * (g - len),
    x1: AXIS + side * g,
  };
});

// ---------------------------------------------------------------------------
// THE ROUTE. x as a function of the head's vertical progress u: a chain of
// smoothsteps through the apexes, C1 by construction (zero lateral slope at
// every control point) and bending everywhere, so the dashed guide is the only
// straight line in the frame.
// ---------------------------------------------------------------------------
const CTRL: { u: number; x: number }[] = [
  { u: 0, x: 0 },
  ...BARRIERS.map((b) => ({ u: b.u, x: b.side * b.apex })),
  { u: GUIDE_LEN, x: 0 },
];

export const offAt = (u: number) => {
  if (u <= 0) return 0;
  for (let i = 0; i < CTRL.length - 1; i++) {
    const a = CTRL[i];
    const b = CTRL[i + 1];
    if (u <= b.u) return a.x + (b.x - a.x) * smoothstep((u - a.u) / (b.u - a.u));
  }
  return 0;
};

export const routeAt = (u: number) => ({ x: AXIS + offAt(u), y: ROUTE_Y0 - u });

export const routePath = (u: number, step = 4) => {
  let d = "";
  for (let v = 0; v <= u; v += step) {
    const p = routeAt(v);
    d += `${v === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  const e = routeAt(u);
  d += `L${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  return d;
};

// ---------------------------------------------------------------------------
// THE HEAD'S SCHEDULE — V1's, unchanged: one decaying rate, integrated, already
// travelling at f0 and never pausing.
// ---------------------------------------------------------------------------
export const U_START = 50;
const V_FLOOR = 4.2;
const V_EXTRA = 6.5;
const V_TAU = 35;

export const vY = (f: number) => V_FLOOR + V_EXTRA * Math.exp(-Math.max(0, f) / V_TAU);

const U_AT: number[] = (() => {
  const out = [U_START];
  for (let f = 1; f <= DURATION + 24; f++) out.push(out[f - 1] + vY(f - 0.5));
  return out;
})();
export const uHead = (f: number) => {
  const i = Math.max(0, Math.min(U_AT.length - 2, Math.floor(f)));
  const t = clamp01(f - i);
  return U_AT[i] + (U_AT[i + 1] - U_AT[i]) * t;
};
export const frameAtU = (u: number) => {
  for (let f = 0; f < U_AT.length - 1; f++) {
    if (U_AT[f + 1] >= u) {
      return f + (u - U_AT[f]) / Math.max(1e-6, U_AT[f + 1] - U_AT[f]);
    }
  }
  return Infinity;
};

/** A bar's draw-up, 0..1, read off the head's own position. Monotone, so a bar
 *  the head has passed stays at INK_HI. */
export const barBright = (b: Barrier, f: number) =>
  clamp01((uHead(f) - (b.u - BAR_LEAD_D)) / BAR_WIPE_D);

/** ONLY THE NEXT BAR IS VISIBLE. Bar 0 stands from f0; bar j fades in over
 *  BAR_IN frames from the frame the head passes bar j-1. */
export const BAR_APPEAR: number[] = BARRIERS.map((_, j) =>
  j === 0 ? -BAR_IN : frameAtU(BARRIERS[j - 1].u),
);
export const barPresence = (j: number, f: number) =>
  smoothstep(clamp01((f - BAR_APPEAR[j]) / BAR_IN));

// ---------------------------------------------------------------------------
// THE BEADS — the alignment gains, as cargo on the line.
//
// A bead is emitted from A's ring every BEAD_GAP world px of the head's travel
// and then moves at EXACTLY the head's speed, so its lag behind the head is
// fixed for life and the train's SPACING IS UNIFORM IN SPACE — which is what
// the eye reads as a steady train, and what keeps two beads from ever touching
// (BEAD_GAP is 7.3 bead radii against the brief's floor of 4).
//
// Emitting on a fixed SPACE interval rather than a fixed time interval is a
// deviation with a reason: the head decelerates from 10.7 to 4.7 world px/frame
// over the cut, so one bead per 6 frames would put the late ones 28 px apart —
// inside the 4-radii floor — and would also put 15 beads on the line by f93
// against the briefed ~9. BEAD_GAP 66 gives an emission interval of 6.5 frames
// at the start easing to 13.8 at the end, and exactly 10 beads by f93.
//
// STICKING. For each bead, the bars are walked in order and the FIRST one whose
// hash comes up short of STICK_P is the bar it dies on. STICK_LEAD world px
// before that bar it stops following the route, holds the lateral offset it had
// there, and runs straight up into the bar, stopping with its own body against
// the bar's stroke. Measured, every one of the four stick points lands ON its
// bar and 16-40 px inside the open end — so a stuck bead reads as one that
// nearly made it.
// ---------------------------------------------------------------------------
export const BEAD_GAP = 66;
export const STICK_P = 1 / 3;
export const STICK_LEAD = 60;
export const STICK_FADE = 8;
/** Where the FIRST stuck bead's centre comes to rest: its own body against the
 *  bar's stroke. */
export const STICK_STOP = STROKE_W / 2 + BEAD_R;
/** ...and every bead after it on the SAME bar stops one pitch further back down
 *  the straight line they all came up, so a bar that catches several of them
 *  grows a short stalled QUEUE under it instead of one bead drawn three times.
 *  (Measured before this: five beads share bar 2's stick point, and the
 *  closest-approach check read 0.00 radii.) */
export const BEAD_PITCH = 2 * BEAD_R + 6;
/** Which seed the 1-in-3 draw is taken on. SWEPT over 1..2000 and scored on
 *  four things, because with only ten beads the draw is the choreography: that
 *  a bead is lost EARLY (so the mechanism is established while the head is
 *  still in the close half), that 4-5 are lost by f93, that EVERY passed bar
 *  has caught at least one — "at every bar some of the beads get stuck" — and
 *  that the losses are spread rather than clumped. 1987 gives losses at f20.1,
 *  35.1, 57.8, 73.4 and 78.8, spread 2 / 2 / 1 over bars 1-3, with no gap
 *  longer than 22.7 frames and 5 beads still travelling. (The first seed tried,
 *  91, put 3 of its 5 on one bar and none of them before f49 — half the cut
 *  went by before a single bead was lost, which is the one thing this revision
 *  exists to show.)
 *
 *  It is a hashed draw and not a quota: the beads are not counted out three at
 *  a time, each one takes its own chance at each bar it reaches. */
export const STICK_SEED = 1987;

export type Bead = {
  i: number;
  /** its fixed lag behind the head, in world px of vertical progress */
  lag: number;
  /** the frame it leaves the ring */
  born: number;
  /** the barrier index it sticks on, or -1 if it is still travelling */
  stickBar: number;
  /** its place in that bar's queue, 0 = the one against the bar itself */
  queue: number;
};

export const BEADS: Bead[] = (() => {
  const out: Bead[] = [];
  const last = uHead(DURATION + 12);
  for (let i = 0; ; i++) {
    const lag = U_START + i * BEAD_GAP;
    if (lag > last) break;
    let stickBar = -1;
    for (let j = 0; j < BARRIERS.length; j++) {
      if (hash(i * 7 + j, STICK_SEED) < STICK_P) {
        stickBar = j;
        break;
      }
    }
    // beads are built in lag order, so the queue index is just how many have
    // already claimed that bar: the nearest to the head arrives first.
    const queue = out.filter((q) => q.stickBar === stickBar).length;
    out.push({ i, lag, born: frameAtU(lag), stickBar, queue });
  }
  return out;
})();

/** The u a stuck bead comes to rest at: its own place in its bar's queue. */
export const beadStopU = (b: Bead) =>
  BARRIERS[b.stickBar].u - STICK_STOP - b.queue * BEAD_PITCH;

export type BeadAt = { x: number; y: number; tone: number } | null;

export const beadAt = (b: Bead, f: number): BeadAt => {
  const u = uHead(f) - b.lag;
  if (u < 0) return null;
  if (b.stickBar >= 0) {
    const bar = BARRIERS[b.stickBar];
    const breakU = bar.u - STICK_LEAD;
    if (u >= breakU) {
      // off the route: the lateral offset it had at the break, held, and a
      // straight run up into the bar
      const x = AXIS + offAt(breakU);
      const stopU = beadStopU(b);
      // stopped: its body against the bar's stroke, and it never moves again.
      // The tone is read off the CLOCK in `beadDraw`, not off u, because a
      // stuck bead's u never advances.
      return { x, y: ROUTE_Y0 - Math.min(u, stopU), tone: 1 };
    }
  }
  const p = routeAt(u);
  return { x: p.x, y: p.y, tone: 1 };
};

/** The tone ramp is a function of FRAMES since it stopped, not of u — a stuck
 *  bead's u never advances again, so it has to be read off the clock. */
export const beadStopFrame = (b: Bead) =>
  b.stickBar < 0 ? Infinity : frameAtU(beadStopU(b) + b.lag);

export const beadDraw = (b: Bead, f: number) => {
  const p = beadAt(b, f);
  if (!p) return null;
  const sf = beadStopFrame(b);
  const tone = f >= sf ? 1 - smoothstep(clamp01((f - sf) / STICK_FADE)) : 1;
  return { x: p.x, y: p.y, tone };
};

// ---------------------------------------------------------------------------
// THE RESOLVED FRAMING — V1's rules. The arrow tip on BAND.y0 and the head
// mid-swerve at 1149 are the two ends that fix K_WIDE_CUT: 950 screen px for
// the 989 world px between them.
// ---------------------------------------------------------------------------
export const K_WIDE_CUT = 0.96;
export const K_OPEN = 1.3;
export const K_CREEP = 1.328;
export const RESOLVED_F = 86;
export const K_MID = 1.26;
export const BAND = { y0: 200, y1: 1400 };
export const C_WIDE = ARROW_TIP_Y - (BAND.y0 - 835) / K_WIDE_CUT;

// ---------------------------------------------------------------------------
// THE CAMERA — V1's construction, values retargeted to this world.
// ---------------------------------------------------------------------------
const TRACK_F1 = DURATION + 16;
const F_CREEP = 26;
/** The cut opens MID-FLIGHT, so the camera is already travelling on f0: the
 *  track is extended PRE frames backwards along its own opening slope and the
 *  damper is run from there. */
const PRE = 18;
/** The tail is not a hold — the line does not arrive, so the pull-back keeps
 *  easing out past RESOLVED_F and is still moving on the last frame. */
const TAIL_DK = 0.055;
const TAIL_DC = 80;

const idx = (f: number) => f + PRE;

const F_MID = 40;
const KF = [-PRE, 0, 12, F_CREEP, F_MID, RESOLVED_F, TRACK_F1];
const K_F12 = 1.311;

/** The RISE's knots are the HEAD's own y at a screen target. */
const RISE_SCREEN: [number, number, number][] = [
  [0, 1100, K_OPEN],
  [12, 1120, K_F12],
  [F_CREEP, 1150, K_CREEP],
  [F_MID, 1190, K_MID],
];
const riseKnot = (n: number) => {
  const [f, s, kk] = RISE_SCREEN[n];
  return routeAt(uHead(f)).y - (s - 835) / kk;
};

const kTrack = (k0: number, kEnd: number) => {
  const h = hermite(KF, [
    k0 - ((K_F12 - k0) / 12) * PRE,
    k0,
    K_F12,
    K_CREEP,
    K_MID,
    kEnd,
    kEnd - TAIL_DK,
  ]);
  const K: number[] = [];
  for (let f = -PRE; f <= TRACK_F1; f++) K.push(h(f));
  return K;
};

const cTrack = (c0: number, cEnd: number, K: number[]) => {
  const c1 = riseKnot(1);
  const h = hermite(KF, [
    c0 - ((c1 - c0) / 12) * PRE,
    c0,
    c1,
    riseKnot(2),
    riseKnot(3),
    cEnd,
    cEnd - TAIL_DC,
  ]);
  const CY: number[] = [];
  const F: number[] = [];
  for (let f = -PRE; f <= TRACK_F1; f++) {
    F.push(idx(f));
    CY.push(h(f) + CAM_LIFT / K[idx(f)]);
  }
  return { F, CY };
};

const solve = (target: number, at: (v: number) => number, a: number, b: number) =>
  a + ((target - at(a)) * (b - a)) / (at(b) - at(a));

export const K_0 = solve(
  K_OPEN,
  (k0) => {
    const K = kTrack(k0, K_WIDE_CUT);
    const c = cTrack(riseKnot(0), C_WIDE, K);
    return runCamera(idx(0), c.F, c.CY, K).k;
  },
  K_OPEN * 0.95,
  K_OPEN * 1.05,
);

export const K_END = solve(
  K_WIDE_CUT,
  (kEnd) => {
    const K = kTrack(K_0, kEnd);
    const c = cTrack(riseKnot(0), C_WIDE, K);
    return runCamera(idx(RESOLVED_F), c.F, c.CY, K).k;
  },
  K_WIDE_CUT * 0.9,
  K_WIDE_CUT * 1.1,
);

const K_TRACK = kTrack(K_0, K_END);

const cReadAt = (f: number, c0: number, cEnd: number) => {
  const c = cTrack(c0, cEnd, K_TRACK);
  const r = runCamera(idx(f), c.F, c.CY, K_TRACK);
  return r.cy - CAM_LIFT / r.k;
};

export const C_0 = solve(
  riseKnot(0),
  (c0) => cReadAt(0, c0, C_WIDE),
  riseKnot(0) - 200,
  riseKnot(0) + 200,
);
export const C_END = solve(
  C_WIDE,
  (cEnd) => cReadAt(RESOLVED_F, C_0, cEnd),
  C_WIDE - 300,
  C_WIDE + 300,
);

export const CAM = (() => {
  const c = cTrack(C_0, C_END, K_TRACK);
  return { F: c.F, CY: c.CY, K: K_TRACK };
})();

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(idx(f), CAM.F, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: AXIS + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
export const camAt = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return [AXIS + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE GRID. Everything co-moves along H_USER and the camera tracks it, so the
// ground has to run; `travel` is added to the camera's cy where the grid reads
// it and nowhere else, so the layout stays in the co-moving frame it is written
// in. GRID_REST is solved to minimise the worst background offset.
// ---------------------------------------------------------------------------
const H_MEAN = () => H_USER;
const gridCyAt = (f: number) => camAt(f).cy + travel(f, H_MEAN).y;

export const GRID_REST = (() => {
  const g: number[] = [];
  for (let f = 0; f <= DURATION; f++) g.push(gridCyAt(f));
  const worst = (R: number) => {
    let m = 0;
    for (let f = 0; f <= DURATION; f++) {
      m = Math.max(m, Math.abs(-(g[f] - R) * camAt(f).k * PARALLAX - f * 0.3));
    }
    return m;
  };
  let lo = Math.min(...g);
  let hi = Math.max(...g);
  for (let i = 0; i < 60; i++) {
    const a = lo + (hi - lo) / 3;
    const b = hi - (hi - lo) / 3;
    if (worst(a) <= worst(b)) hi = b;
    else lo = a;
  }
  return (lo + hi) / 2;
})();

// ---------------------------------------------------------------------------
// THE DESTINATION FLOCK. The only crowd in the cut.
// ---------------------------------------------------------------------------
const FORM_P = buildFormation({ n: N_AGENTS, seed: 9, rx: BLOB_RX_CUT, ry: BLOB_RY_CUT });

export type Agent = { x: number; y: number; r: number; heading: number };

export const agentsOf = (frame: number): Agent[] =>
  FORM_P.seats.map((s) => {
    const w = wanderOf(s, frame);
    const p = formationAt({ x: s.x + w.dx, y: s.y + w.dy }, P_CENTRE, H_USER);
    const period = HUNT_P0 + (HUNT_P1 - HUNT_P0) * hash(s.i, 82);
    const hunt =
      ((LOOSE_DEG * Math.PI) / 180) *
      Math.sin((TWO_PI * frame) / period + hash(s.i, 81) * TWO_PI);
    return { x: p.x, y: p.y, r: s.r, heading: H_USER + hunt + w.da };
  });

// ---------------------------------------------------------------------------

const TranslateDirectlyV2: React.FC<Props> = ({
  ink,
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

  const cam = runCamera(idx(frame), CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = AXIS + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const u = uHead(frame);
  const head = routeAt(u);
  const headR = 0.625 * STROKE_W;
  const ag = agentsOf(frame);

  const svgStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "visible",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy + travel(frame, H_MEAN).y}
        cyRest={GRID_REST}
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
          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
            {/* 1. THE GUIDE: the direct route, dashed, marching toward the
                destination, at INK_LO, at the set's one stroke weight. */}
            <g style={{ filter: icon }}>
              <line
                x1={AXIS}
                y1={ROUTE_Y0}
                x2={AXIS}
                y2={ROUTE_Y1}
                stroke={ink}
                strokeWidth={STROKE_W}
                strokeLinecap="butt"
                strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                strokeDashoffset={-frame * MARCH_W * 3}
                opacity={INK_LO}
              />
            </g>

            {/* 2. THE BARS. Only the next one is present; passed ones stay
                INK_HI. Each draws up from the guide OUTWARDS as the head nears
                it, both ends at once and each at its own length's rate so they
                finish together. */}
            {BARRIERS.map((b, i) => {
              const pres = barPresence(i, frame);
              if (pres <= 0) return null;
              const t = barBright(b, frame);
              return (
                <g key={`b${i}`} style={{ filter: icon }} opacity={pres}>
                  <line
                    x1={b.x0}
                    y1={b.y}
                    x2={b.x1}
                    y2={b.y}
                    stroke={ink}
                    strokeWidth={STROKE_W}
                    strokeLinecap="round"
                    opacity={INK_LO}
                  />
                  {t > 0 ? (
                    <>
                      <line
                        x1={AXIS}
                        y1={b.y}
                        x2={AXIS + (b.x1 - AXIS) * t}
                        y2={b.y}
                        stroke={ink}
                        strokeWidth={STROKE_W}
                        strokeLinecap="round"
                        opacity={INK_HI}
                      />
                      <line
                        x1={AXIS}
                        y1={b.y}
                        x2={AXIS + (b.x0 - AXIS) * t}
                        y2={b.y}
                        stroke={ink}
                        strokeWidth={STROKE_W}
                        strokeLinecap="round"
                        opacity={INK_HI}
                      />
                    </>
                  ) : null}
                </g>
              );
            })}

            {/* 5a. THE DESTINATION's flock: links first, then the comets over
                them, so the comets are what reads. */}
            {FORM_P.links.map(([i, j], n) => (
              <Link
                key={`l${n}`}
                frame={frame}
                k={k}
                kind="agent"
                from={{ x: ag[i].x, y: ag[i].y }}
                to={{ x: ag[j].x, y: ag[j].y }}
                live={0}
                opacity={LINK_MUL}
                phase={hash(i * 31 + j, 47) * 30}
              />
            ))}
            {ag.map((a, i) => (
              <Comet
                key={`c${i}`}
                x={a.x}
                y={a.y}
                heading={a.heading}
                r={a.r}
                tone={0}
                tipMul={TIP_LOOSE}
              />
            ))}
          </svg>

          {/* 5b. THE SEATS. The person at the top with the arrow that is what
              they want; A's ring at the bottom with Agent A in it and nothing
              under it. No arrow on A's ring — the route leaves its top edge and
              the two would read as one line. */}
          <UserSeat k={k} x={P_SEAT.x} y={P_SEAT.y} frame={frame} occupant="person" arrow={1} />
          <UserSeat k={k} x={A_SEAT.x} y={A_SEAT.y} frame={frame} occupant="agent" arrow={0} />
          <Label
            k={k}
            x={A_SEAT.x - LABEL_SIDE}
            y={A_SEAT.y - LABEL_SIZE / 2}
            text="A"
            f0={0}
            frame={frame}
            opacity={INK_HI}
          />

          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
            {/* 3. THE SPINE: the winding route, solid, over everything, fully
                opaque, with its head. */}
            <g style={{ filter: icon }}>
              <path
                d={routePath(u)}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE_W}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={INK_HI}
              />
              <circle cx={head.x} cy={head.y} r={headR} fill={ink} opacity={INK_HI} />
            </g>

            {/* 4. THE BEADS, on top of the line they ride. */}
            {BEADS.map((b) => {
              const p = beadDraw(b, frame);
              return p ? (
                <circle
                  key={`bd${b.i}`}
                  cx={p.x}
                  cy={p.y}
                  r={BEAD_R}
                  fill={AGENT_TONE(p.tone)}
                />
              ) : null;
            })}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default TranslateDirectlyV2;

// ---------------------------------------------------------------------------
// The numbers the cut is built on, exported so they are measured, not asserted.
// ---------------------------------------------------------------------------
const probeSpeeds = () => {
  const probes: [number, number][] = [
    [AXIS, ARROW_TIP_Y],
    [AXIS, P_CENTRE.y + BLOB_RY_CUT],
    [AXIS, ROUTE_Y0],
    [AXIS - LABEL_SIDE, A_SEAT.y],
    [AXIS, A_SEAT.y + SEAT_R],
    [BARRIERS[0].x0, BARRIERS[0].y],
    [BARRIERS[N_BARS - 1].x0, BARRIERS[N_BARS - 1].y],
    [AXIS - BLOB_RX_CUT, P_CENTRE.y],
    [AXIS + BLOB_RX_CUT, P_CENTRE.y],
  ];
  let maxV = 0;
  let atV = 0;
  let maxAny = 0;
  let maxA = 0;
  let atA = 0;
  for (const [px, py] of probes) {
    const p: number[][] = [];
    for (let f = 0; f <= DURATION; f++) p.push(screenAt(f, px, py));
    for (let f = 1; f <= DURATION; f++) {
      const v = Math.hypot(p[f][0] - p[f - 1][0], p[f][1] - p[f - 1][1]);
      const seen = (g: number) => p[g][1] >= -40 && p[g][1] <= FRAME_H + 40;
      if (v > maxAny) maxAny = v;
      if (v > maxV && seen(f) && seen(f - 1)) {
        maxV = v;
        atV = f;
      }
    }
    for (let f = 2; f <= DURATION; f++) {
      const ax = p[f][0] - 2 * p[f - 1][0] + p[f - 2][0];
      const ay = p[f][1] - 2 * p[f - 1][1] + p[f - 2][1];
      const a = Math.hypot(ax, ay);
      if (a > maxA) {
        maxA = a;
        atA = f;
      }
    }
  }
  return {
    maxV: Number(maxV.toFixed(2)),
    atV,
    maxVOffFrame: Number(maxAny.toFixed(2)),
    maxA: Number(maxA.toFixed(3)),
    atA,
  };
};

const headSpeeds = () => {
  let maxS = 0;
  let minS = Infinity;
  let maxW = 0;
  let minW = Infinity;
  for (let f = 1; f <= DURATION; f++) {
    const a = routeAt(uHead(f - 1));
    const b = routeAt(uHead(f));
    const w = Math.hypot(b.x - a.x, b.y - a.y);
    maxW = Math.max(maxW, w);
    minW = Math.min(minW, w);
    const pa = screenAt(f - 1, a.x, a.y);
    const pb = screenAt(f, b.x, b.y);
    const s = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    maxS = Math.max(maxS, s);
    minS = Math.min(minS, s);
  }
  return {
    maxScreen: Number(maxS.toFixed(2)),
    minScreen: Number(minS.toFixed(2)),
    maxWorld: Number(maxW.toFixed(2)),
    minWorld: Number(minW.toFixed(2)),
  };
};

/** Every bead's state on the last frame, and the tally the cut is about. */
const beadTally = (f: number) => {
  let emitted = 0;
  let stuck = 0;
  let travelling = 0;
  const perBar = BARRIERS.map(() => 0);
  let lead = 0;
  for (const b of BEADS) {
    const u = uHead(f) - b.lag;
    if (u < 0) continue;
    emitted++;
    lead = Math.max(lead, u);
    if (b.stickBar >= 0 && u >= beadStopU(b)) {
      stuck++;
      perBar[b.stickBar]++;
    } else travelling++;
  }
  return { emitted, stuck, travelling, perBar, lead: Number(lead.toFixed(0)) };
};

export const STATS = {
  duration: DURATION,
  world: {
    aSeat: A_SEAT.y,
    routeY0: ROUTE_Y0,
    routeY1: ROUTE_Y1,
    pCentre: P_CENTRE.y,
    pSeat: P_SEAT.y,
    arrowTip: ARROW_TIP_Y,
    guideLen: GUIDE_LEN,
    blob: [BLOB_RX_CUT, BLOB_RY_CUT],
    seatGap: SEAT_GAP_CUT,
    agents: FORM_P.seats.length,
    links: FORM_P.links.length,
  },
  barriers: BARRIERS.map((b, i) => ({
    i: i + 1,
    u: b.u,
    side: b.side > 0 ? "open right" : "open left",
    apex: Number(b.apex.toFixed(1)),
    apexScreenAtRest: Number((b.apex * K_WIDE_CUT).toFixed(1)),
    len: Number(b.len.toFixed(0)),
    overhang: Number(b.g.toFixed(1)),
    passedAtF: Number(frameAtU(b.u).toFixed(1)),
    appearsAtF: Number(BAR_APPEAR[i].toFixed(1)),
    wipeF: [
      Number(frameAtU(b.u - BAR_LEAD_D).toFixed(1)),
      Number(frameAtU(b.u - BAR_LEAD_D + BAR_WIPE_D).toFixed(1)),
    ],
    /** where a bead that fails here comes to rest, and that x against the
     *  bar's own span — it must be ON the bar and inside the open end */
    stickX: Number((AXIS + offAt(b.u - STICK_LEAD)).toFixed(1)),
    barSpan: [Number(Math.min(b.x0, b.x1).toFixed(1)), Number(Math.max(b.x0, b.x1).toFixed(1))],
    stuckAt93: BEADS.filter(
      (bd) => bd.stickBar === i && uHead(DURATION) - bd.lag >= beadStopU(bd),
    ).length,
  })),
  /** how many bars are drawn at all, per frame — the de-clutter count */
  barsVisible: [0, 8, 20, 30, 45, 66, 80, 93].map((f) => [
    f,
    BARRIERS.filter((_, i) => barPresence(i, f) > 0.02).length,
  ]),
  maxSlantDeg: (() => {
    let m = 0;
    for (let v = 0; v <= GUIDE_LEN; v += 1) m = Math.max(m, Math.abs(offAt(v + 0.5) - offAt(v - 0.5)));
    return Number(((Math.atan(m) * 180) / Math.PI).toFixed(1));
  })(),
  maxOffWorld: Number(
    Math.max(...Array.from({ length: GUIDE_LEN }, (_, v) => Math.abs(offAt(v)))).toFixed(1),
  ),
  head: {
    uAt: [0, 8, 30, 40, 66, 77, 86, 93].map((f) => [f, Number(uHead(f).toFixed(1))]),
    fracAt93: Number((uHead(DURATION) / GUIDE_LEN).toFixed(3)),
    crossAt93: Number(
      ((uHead(DURATION) - BARRIERS[2].u) / (BARRIERS[3].u - BARRIERS[2].u)).toFixed(2),
    ),
    ...headSpeeds(),
  },
  beads: {
    count: BEADS.length,
    gapWorld: BEAD_GAP,
    gapRadii: Number((BEAD_GAP / BEAD_R).toFixed(1)),
    beadScreenAtRest: Number((2 * BEAD_R * K_WIDE_CUT).toFixed(1)),
    emitF: BEADS.map((b) => Number(b.born.toFixed(1))),
    emitIntervals: BEADS.slice(1).map((b, i) => Number((b.born - BEADS[i].born).toFixed(1))),
    stickBar: BEADS.map((b) => b.stickBar),
    tallyAt93: beadTally(DURATION),
    tallyAt66: beadTally(66),
    /** the smallest gap between any two drawn beads, in radii, over the cut */
    minGapRadii: (() => {
      let m = Infinity;
      for (let f = 0; f <= DURATION; f++) {
        const pts = BEADS.map((b) => beadDraw(b, f)).filter(Boolean) as {
          x: number;
          y: number;
        }[];
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            m = Math.min(m, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) / BEAD_R);
          }
        }
      }
      return Number(m.toFixed(2));
    })(),
  },
  camera: {
    kEnd: Number(K_END.toFixed(4)),
    cEnd: Number(C_END.toFixed(1)),
    cWide: Number(C_WIDE.toFixed(1)),
    kAt: [0, 12, 26, 40, 56, 66, 77, 86, 93].map((f) => [f, Number(camAt(f).k.toFixed(3))]),
    cAt: [0, 12, 26, 40, 56, 66, 77, 86, 93].map((f) => [
      f,
      Number((camAt(f).cy - CAM_LIFT / camAt(f).k).toFixed(1)),
    ]),
    kAtResolved: Number(camAt(RESOLVED_F).k.toFixed(4)),
    cAtResolved: Number((camAt(RESOLVED_F).cy - CAM_LIFT / camAt(RESOLVED_F).k).toFixed(1)),
    ...probeSpeeds(),
    gridRest: Number(GRID_REST.toFixed(1)),
    worstBgY: (() => {
      let m = 0;
      for (let f = 0; f <= DURATION; f++) {
        m = Math.max(m, Math.abs(-(gridCyAt(f) - GRID_REST) * camAt(f).k * PARALLAX - f * 0.3));
      }
      return Number(m.toFixed(0));
    })(),
  },
  screenSizes: [0, RESOLVED_F].map((f) => {
    const kk = camAt(f).k;
    return {
      f,
      k: Number(kk.toFixed(3)),
      person: Number((118 * kk).toFixed(1)),
      agentD: Number((2 * DOT_R * kk).toFixed(1)),
      beadD: Number((2 * BEAD_R * kk).toFixed(1)),
      stroke: Number((STROKE_W * kk).toFixed(2)),
      barL: [BAR_L0, BAR_L1].map((L) => Number((L * kk).toFixed(0))),
      seatD: Number((2 * SEAT_R * kk).toFixed(0)),
    };
  }),
  resolvedScreen: {
    arrowTip: Number(screenAt(RESOLVED_F, AXIS, ARROW_TIP_Y)[1].toFixed(0)),
    pRingTop: Number(screenAt(RESOLVED_F, AXIS, P_SEAT.y - SEAT_R)[1].toFixed(0)),
    pBlobTop: Number(screenAt(RESOLVED_F, AXIS, P_CENTRE.y - BLOB_RY_CUT)[1].toFixed(0)),
    pBlobBottom: Number(screenAt(RESOLVED_F, AXIS, P_CENTRE.y + BLOB_RY_CUT)[1].toFixed(0)),
    bars: BARRIERS.map((b) => Number(screenAt(RESOLVED_F, AXIS, b.y)[1].toFixed(0))),
    head: Number(
      screenAt(RESOLVED_F, routeAt(uHead(RESOLVED_F)).x, routeAt(uHead(RESOLVED_F)).y)[1].toFixed(0),
    ),
    aRingTop: Number(screenAt(RESOLVED_F, AXIS, A_SEAT.y - SEAT_R)[1].toFixed(0)),
    aRingBottom: Number(screenAt(RESOLVED_F, AXIS, A_SEAT.y + SEAT_R)[1].toFixed(0)),
  },
  openScreen: {
    head: Number(screenAt(0, routeAt(U_START).x, routeAt(U_START).y)[1].toFixed(0)),
    aRing: [
      Number(screenAt(0, AXIS, A_SEAT.y - SEAT_R)[1].toFixed(0)),
      Number(screenAt(0, AXIS, A_SEAT.y + SEAT_R)[1].toFixed(0)),
    ],
    aLabelX: Number(screenAt(0, AXIS - LABEL_SIDE, A_SEAT.y)[0].toFixed(0)),
    bar1: [
      Number(screenAt(0, BARRIERS[0].x0, BARRIERS[0].y)[0].toFixed(0)),
      Number(screenAt(0, BARRIERS[0].x1, BARRIERS[0].y)[0].toFixed(0)),
    ],
    /** how far up the guide is visible at f0, in world px of corridor */
    guideVisibleU: Number(
      (ROUTE_Y0 - (camAt(0).cy - FRAME_H / 2 / camAt(0).k)).toFixed(0),
    ),
  },
  headScreenY: Array.from({ length: 13 }, (_, i) => i * 8).map((f) => [
    f,
    Number(screenAt(f, routeAt(uHead(f)).x, routeAt(uHead(f)).y)[1].toFixed(0)),
  ]),
  headWorstAfter40: (() => {
    let m = 0;
    let at = 0;
    for (let f = 41; f <= DURATION; f++) {
      const y = screenAt(f, routeAt(uHead(f)).x, routeAt(uHead(f)).y)[1];
      if (y > m) {
        m = y;
        at = f;
      }
    }
    return [Number(m.toFixed(0)), at];
  })(),
  pEntry: (() => {
    const find = (wy: number) => {
      for (let f = 0; f <= DURATION; f++) if (screenAt(f, AXIS, wy)[1] >= 0) return f;
      return -1;
    };
    return {
      flockTail: find(ROUTE_Y1),
      ringTop: find(P_SEAT.y - SEAT_R),
      arrowTip: find(ARROW_TIP_Y),
    };
  })(),
};
