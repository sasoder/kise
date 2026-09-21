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
  ARROW_LEN,
  BEAD_R,
  BLOB_RX,
  BLOB_RY,
  Comet,
  DASH_OFF,
  DASH_ON,
  DOT_R,
  EVAL_COL_W,
  EVAL_COLS,
  EVAL_ROW_H,
  EvalColumn,
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
  MARCH_W,
  PACKET_PERIOD,
  SEAT_GAP,
  SEAT_R,
  SEP_FLOOR,
  STROKE_W,
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
// Noam Brown, clip `Noam_Alignment`, CUT 3 — `HonestyGoesUp` (in at 0:27.820):
// "like, honesty goes up, instruction following goes up. That's showing that
//  there is actually, like, a path for getting more honesty out of these
//  models."
//
// DURATION. Speech runs 27.820 -> 34.360 s of the clip, so
//   DURATION = round((34.360 - 27.820) * 24) + 16 = 157 + 16 = 173
// — the spoken frames plus the set's 16-frame tail, which holds the resolved
// state without ever going still.
//
// Word onsets, frame = round((t - 27.820) * 24), off the clip's SRT:
//   like 0 · HONESTY 2 · goes 10 · UP 16 (ends 24) · INSTRUCTION 24 ·
//   FOLLOWING 31 · goes 37 · UP 42 (ends 49) · that's 49 · showing 56 ·
//   that 60 · there 63 · is 66 · actually 69 · like 75 · a 81 ·
//   PATH 86 (ends 95) · for 95 · GETTING 107 · MORE 121 · HONESTY 127 ·
//   OUT 134 · of 142 · these 143 · MODELS 146 (ends 157) · tail 157-173.
// (The cut brief lists OUT at 135 and these at 144; the SRT's own arithmetic
//  is 134.4 and 143.5, so both round one frame earlier. Nothing lands on
//  either word, so it changes nothing.)
//
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "as the agents snap into line behind A, beads stream out of them up the
//    arrow into two columns — honesty, instruction following — that stack above
//    their old marks; the route lights up as a path and the honesty column
//    keeps climbing along it."
//
// THIS CUT PICKS UP CUT 2. `FORM` is imported from `UserIsAgentA` rather than
// rebuilt, so the seats, their links and their hashes are literally the same
// crowd; the layout constants below are cut 2's own (FORM_C 540/1044, the seat
// at 540/504, the arrow tip at 274) copied with their derivation. 3.2 s of face
// shot sit between the two cuts, so the seats' PHASE is not continuous and the
// snap wave is re-keyed here (see THE WAVE): it stands 45% through the flock at
// f0 and completes at f40, which is what the brief asks for.
//
// WHAT IS NEW IN THIS CUT — one thing: the seat's white arrow CONTINUES as an
// INK_LO STEM that rises and forks into the baselines of two `EvalColumn`s on
// the column axis (x 540 -+ 150), labelled "honesty" and "instruction /
// following", each standing at 3 hollow INK_LO rows = the score before. They
// are off-frame above at f0.
//
// ---------------------------------------------------------------------------
// GESTURES — four, and nothing in the cut is outside this list. Each leads its
// word and overlaps its neighbour; nothing starts from a dead stop.
//
//  1. f0-28   "honesty goes up"      THE STREAM AND THE FIRST COLUMN. Every
//     (f2 / f10 / f16)               agent the wave has reached sends accent
//                                    BEADS up its links to the seat, behind A,
//                                    up the arrow, up the stem and out the left
//                                    fork; each one STACKS as one bead of a
//                                    solid row on top of "honesty"'s hollow
//                                    rows. The column goes up because beads
//                                    reach it — its height is a bead count and
//                                    nothing else (ROWS_AT): 4 rows by f24.
//                                    The camera is already gliding up the stem
//                                    at f0 (the seat at screen 1299, beads
//                                    leaving the top of frame, the columns
//                                    off-frame above by 95 px) and settles on
//                                    them at f28 — the column enters the frame
//                                    at f14 and is inside the caption band from
//                                    f28 (see DEVIATIONS). The label "honesty"
//                                    slides up + fades in f10-20, as its column
//                                    arrives.
//  2. f28-49  "instruction           THE SAME STREAM FEEDS THE RIGHT COLUMN.
//     following goes up"             The fork sends beads right; "instruction /
//     (f24 / f31 / f37 / f42)        following" slides up + fades in f24-34 on
//                                    its own word and its column climbs to 4
//                                    rows by f49, while honesty keeps
//                                    trickling (5.67 rows at f49). The camera
//                                    creeps up and open with the growth
//                                    (k 1.71 -> 1.34).
//  3. f49-95  "that's showing that   THE PULL-BACK AND THE PATH. One long
//     there is actually a path"      pull-back (k 1.34 -> 1.00, the set's own
//     (f49-86)                       K_WIDE) opens the whole vertical chain:
//                                    the formation's head at screen 1544, the
//                                    seat with A at 1314, the arrow, the stem,
//                                    the fork, both columns and both labels.
//                                    Across f58-82 the route from the seat to
//                                    the honesty column is drawn OVER in
//                                    full-opacity white, bottom to top, on top
//                                    of the bead lane (the spine rule),
//                                    landing 4 frames before "path" (f86).
//  4. f95-173 "for getting more      THE PATH CARRIES ON. From here the fork
//     honesty out of these models"   sends the WHOLE stream left — instruction
//     (f95 / 107 / 121 / 127 / 146)  following holds at 8 rows — so the traffic
//                                    ALONG THE PATH doubles, which is the
//                                    brief's "rate x 2" (the beads' own
//                                    production period also halves, keeping the
//                                    stem full to the last frame). Honesty
//                                    climbs past it and keeps going: 8 rows at
//                                    f95, 12 at f121, 17 at f146, 21 at f172.
//                                    A white DASHED continuation of the path
//                                    marches upward ahead of the column's top
//                                    and off the top of frame, and the camera
//                                    follows that top up on one slow glide
//                                    (y 25 -> -548, k back in to 1.28, which is
//                                    also what takes the seat ring cleanly off
//                                    the bottom edge by f163 instead of leaving
//                                    a sliver of it and a clipped "user" on the
//                                    last ten frames — the director's polish,
//                                    and it costs nothing: |dv| stays 2.331 and
//                                    the peak probe speed 39.3, both still set
//                                    by the f28 landing). At f172
//                                    it is still climbing, mid-motion.
//
// LIVENESS — mechanisms, not gestures. None is on a word and none ever stops:
//   * the GRID SLIDE. Everything co-moves along the formation's mean heading
//     (straight up, H_USER) at SLIDE_V, and the camera tracks it, so on screen
//     the picture holds and the grid slides under it (`travel` + parallax).
//   * per-agent wander and heading jitter (`wanderOf`), never keyed.
//   * packets on every link, both kinds, at the shared period.
//   * the bead stream itself, which never has a gap (see STREAM).
//   * the marching dashes on the path's continuation.
//   * the camera, which has no parked frame: a glide, a creep, a long pull-back
//     and a slow climb, the last of which is still running at f172.
//
// ---------------------------------------------------------------------------
// CAMERA. One C1-continuous track per channel (y and k; cx never moves off the
// column axis, which is what "one centred column" means here), authored as
// KNOTS on a monotone cubic Hermite — Fritsch-Carlson tangents, so the track
// cannot overshoot a knot and reverse — sampled one key per frame and pushed
// through the shared damper (CAM_STIFF / CAM_DAMP). cy is taken off the EASED k
// of the same frame (cy = y + CAM_LIFT / k) so the composition cannot sag while
// a move runs.
//
// The damper is PRE-ROLLED from f = -CAM_PRE with zero velocity, which is how
// the cut can open mid-move: by f0 the camera is already travelling at ~20
// screen px/frame and decelerating, instead of starting from rest.
//
// The knots at f0, f28, f95 and f172 are SOLVED (secant, and the damper is
// affine in its keys so each solve is exact) so the DAMPED camera reads the four
// framings the cut is designed around:
//   f0    y  293  k 2.20  the seat at screen 1299, the label block off-frame
//                         above by 95 px, the flock's head entering at 1805
//   f28   y  -55  k 1.62  the columns landed: 4 rows, top at screen 203
//   f95   y   25  k 1.00  the whole chain — honesty's top 224, the labels 680,
//                         the seat with A 1314, the flock's head 1544
//   f172  y -548  k 1.28  the top still climbing at screen 287, the flock gone
//                         and the seat clear of the bottom edge from f163
// Measured on six world probes, counting only the frames each probe is actually
// on screen: max |dv| 2.331 px/f^2 (f28), max probe speed 39.3 px/f (f12), and
// the y track never reverses by more than 94 px in total (1.7 px/frame, the
// pull-back taking the flock back in) against the 1.15 px/frame the eye reads.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the cut brief, with the arithmetic.
//
//  * THE CAMERA SETTLES ON THE COLUMNS AT f28, NOT f10, AND THE FIRST TWO ROWS
//    LAND OFF-FRAME. The brief asks for the columns off-frame above at f0 with
//    the seat in the lower third, for the landing at f10, and for four rows by
//    f24. The first three cannot hold together under the set's 45 screen
//    px/frame ceiling. "Off-frame above" with the seat at screen 1300 forces
//        k(0) > 1300 / (STEM_D - the label block's drop) = 1300/934 = 1.39,
//    and at that zoom the label block's own bottom has to travel from screen
//    -95 to ~690 before the picture can hold four stacked rows inside the
//    caption band: ~790 screen px. A damped move covering that in 10 frames
//    peaks near 100 px/frame; over 28 it peaks at 39.3 (measured, f12). So the
//    landing is f28: the column's top crosses into frame at f14, the third and
//    fourth rows land on screen, and the first two land above the top edge
//    while the beads that carry them are in plain sight streaming out of it.
//    That is the set's own "payoff off-frame, the camera follows it up", and it
//    is the only reading of the brief's own opening — "beads leaving the top of
//    frame" — that is internally consistent.
//  * THE FORMATION IS ITS HEAD AT THE WIDE FRAME, AND IT CROSSES SCREEN 1400.
//    The brief asks for nothing below screen y 1400 on wide frames AND for
//    labels >= 36 screen px AND for the pull-back to hold formation -> seat
//    with A -> stem -> columns. All three cannot hold: the chain from honesty's
//    top at f95 (world -556) to the blob's bottom edge (1354) is 1910 world px,
//    which inside a 1200 px band is k = 0.63, at which the labels are 25 screen
//    px and the whole picture is a thin spine on an empty field (it was built
//    that way first — see STEM_D). At k 1.00 the band holds the columns, their
//    labels, the fork, the stem, the arrow and the seat with A at 1314, and the
//    flock's head enters at 1544 with its body running off the bottom edge.
//    That is the set's "crowd bleeding off the frame edge", and it is the right
//    thing to give up here: the payoff is upward, so the crowd is what leaves.
//  * THE COLUMN LABELS ARE INK_HI, NOT INK_LO. The only place the label block
//    can stand is the mouth of the fork — hollow rows directly above, the stem
//    directly below — so each branch crosses the outer end of its own label
//    wherever it is put (measured: the left branch crosses "honesty"'s h, the
//    right one the last two letters of "instruction"). Two INK_LO layers
//    crossing read as one tangle. At INK_HI the words are plainly in front,
//    which is also what they are: these two are what the line is ABOUT, where
//    the seat's "user" and "A" are context and stay at INK_LO.
//  * PARALLAX 0.26, NOT THE MODULE'S 0.32. This cut's camera travels 874 world
//    px, the most in the set, and at 0.32 the grid's own offset reaches 682 px
//    against the 716 px of slack `BG_OVERSIZE` 1.8 leaves at the widest k — a
//    34 px margin, i.e. one damper wobble from showing an edge. At 0.26 the
//    offset is 554 px, the margin is 162, and the slide is still 2.2-3.2 screen
//    px/frame along the mean heading, which is the brief's 2-3.
//  * BEADS FROM BEFORE THE CUT ARE NOT DRAWN. An emission whose arrival would
//    land before f1 is dropped rather than clamped: the hollow rows are the
//    score as MEASURED at f0, so whatever the agents delivered before this
//    moment is already inside them. What f0 shows is the beads still in flight.
//  * A BEAD IS 20 WORLD PX/FRAME, which at the opening k is 44 screen px/frame
//    — inside the 45 ceiling and the fastest thing in the cut. Its flight is
//    63-160 frames, which is why the beads that make the first four rows are
//    the BACKLOG (see the stream): nothing the wave does inside this cut could
//    reach the column before f60.
//  * THE WAVE IS RE-KEYED, NOT EXTRAPOLATED, and it completes at f49 rather
//    than f40: the brief's f40 is the frame the wave's FRONT reaches the last
//    agent, and cut 2's own 7-frame turn then carries the last of them to f49
//    (measured: 62 of 70 fully turned at f40, 70 at f49, 8 mid-turn between).
//    At f0 it stands with 26 of 70 turned and 5 mid-turn — 44% of the flock
//    touched, the briefed "45% through and still travelling".
//
// ---------------------------------------------------------------------------
// THE DIRECTOR'S NOTE ON CUT 2 (after cut 2 was approved), applied here value
// for value, because the two cuts are the same flock three seconds apart:
//   * the link web is painted by cut 2's own `linkPaint` — 0.30 idle, 0.45
//     once the channel wake has passed (which it did during cut 2), and 0.95
//     only as a TRAVELLING BAND, 5 f up and 12 f down with no hold, fired here
//     by the snap wave that is still crossing the flock;
//   * links are INSET off both comet bodies by LINK_GAP = 1.35 radii, so the
//     blob is comets with links between them rather than a truss;
//   * the idle packets are 0.45 of a comet's head on 3.4x the module's period
//     (1.7x under a band) and the wave's own bead on a link is 0.62, so the
//     COMETS stay the biggest, brightest orange things in the flock. The eval
//     beads up the stem stay at the module's BEAD_R_PX: they are the subject
//     of this cut, and they are outside the flock for all but their first leg;
//   * the loose agents keep cut 2's hunt — static hashed base +-22 deg, swing
//     15-23 deg on a 40-70 frame period, envelope 45 deg, deep-toned — and the
//     snapped ones sit on -90 +- 2 deg, ripe;
//   * the wander is `flockWander` with `flockWanderCaps`, and the worst pair
//     over all 173 frames is 2.754 mean radii against the SEP_FLOOR of 2.62;
//   * the seat reads `user ◯ A`, both labels parked and both INK_HI, on cut 2's
//     own offsets off the ring's shoulders.
//
// WHAT IS LIVE BELOW SCREEN 1300 ON THE WIDE FRAMES (the director's check).
// Measured (STATS.screen.below1300): on every frame of the pull-back the
// columns, their labels, the fork, the stem and the arrow are above it; what
// crosses it is the lower half of the SEAT RING (its top edge is at 1236 on the
// widest frame, its centre at 1314) and the FLOCK, whose head enters at 1544
// and whose body runs off the bottom edge between roughly f60 and f140. It is
// not a framing choice: the seat sits SEAT_GAP above the blob's centre, so the
// flock's head is only 230 world px under the seat, and holding the columns'
// top at screen 200 and the seat at 1300 at once needs
//     (504 + 556) * k <= 1100  =>  k <= 1.04,
// at which 230 world px is 240 screen px and the flock's head is at 1540
// whatever else is done. The alternatives are to drop the formation out of the
// wide frame entirely — which takes the source of the beads off the one frame
// that holds the whole argument — or to accept the crowd bleeding off the
// bottom edge, which is what the set does elsewhere and what this does.
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
// THE LAYOUT, in co-moving world px. K_WIDE is 1, so a world px is a screen px
// at the set's resting zoom.
//
// FORM_C, SEAT and ARROW_TIP_Y are CUT 2's, unchanged (UserIsAgentA's own
// layout block): the formation's box centres on world 835 including the comet
// tails, and the seat sits SEAT_GAP above the blob's centre with its arrow
// reaching ARROW_LEN beyond that.
//
// NEW HERE: everything above the arrow. `STEM_D` is the distance from the seat
// to the columns' baseline, and it is SOLVED against the two framings the cut
// has to hit at once:
//   * f0 wants the columns off-frame above with the seat at screen 1300, i.e.
//     k(0) > 1300 / (STEM_D - LABEL_DROP) where LABEL_DROP is how far the label
//     block hangs below the baseline (211 px);
//   * f95 wants honesty's top, the labels, the stem, the arrow and the seat
//     inside the caption band at a k where the labels are still 36+ screen px.
//   A bigger STEM_D buys a lower opening k (and therefore a faster legal bead)
//   and costs the wide frame; 1100 is where the opening k is 1.50 and the wide
//   is 0.87, and the bead's 28 world px/frame is 42 screen px at the former.
// ---------------------------------------------------------------------------
const CX = FRAME_W / 2; // 540
/** cut 2's own numbers, copied with their meaning, not re-derived. */
const FORM_C = { x: CX, y: 1044 };
const SEAT = { x: FORM_C.x, y: FORM_C.y - SEAT_GAP }; // (540, 504)
const ARROW_TIP_Y = SEAT.y - ARROW_LEN; // 274

/** The seat in FORMATION-LOCAL coordinates: the origin is the blob's centre and
 *  -y is the head, so the seat is straight up the mean heading. Every wave in
 *  this clip is keyed on the distance from THIS point. */
const SEAT_LOCAL = { x: 0, y: -SEAT_GAP };
const DIST = FORM.distFrom(SEAT_LOCAL);
/** The per-agent wander caps, measured once off this formation: the coherent
 *  field plus a capped independent drift, which is the set's answer to two
 *  independent drifts closing a floor-separated gap from both sides. */
const WANDER_CAPS: number[] = flockWanderCaps(FORM);
/** THE FIVE FRONT AGENTS the seat is wired to — cut 2's own selection, ported
 *  verbatim because the white fan has to be the same five wires it was: the
 *  nearest FRONT_POOL seats SPREAD ACROSS x, so the fan spans the head of the
 *  blob instead of converging into puppet strings. */
const FRONT_POOL = 14;
const FRONT: number[] = (() => {
  const pool = FORM.seats
    .map((s, i) => ({ i, x: s.x }))
    .slice(0, FRONT_POOL)
    .sort((a, b) => a.x - b.x);
  return [0, 1, 2, 3, 4].map((n) => pool[Math.round((n * (pool.length - 1)) / 4)].i);
})();
/** The formation's mean heading: every agent is turning onto the user's arrow,
 *  so the mean IS the arrow and `travel` is straight up at SLIDE_V. */
const headingAt = () => H_USER;

export const STEM_D = 820;
export const BASE_Y = SEAT.y - STEM_D; // -596: the columns' baseline
const COL_DX = 150;
export const COL_X = [CX - COL_DX, CX + COL_DX]; // 390 (honesty), 690 (instruction)
/** The lane each column is fed up, outside its own beads: a row's outermost
 *  bead edge is COL_X -+ (EVAL_COL_W + BEAD_R) = -+39, so 70 leaves 22 world px
 *  of air between a climbing bead and a standing one. */
const LANE_DX = 70;
export const LANE_X = [COL_X[0] - LANE_DX, COL_X[1] + LANE_DX]; // 320, 760
/** `EvalColumn`'s own baseline tick reaches this far either side of its axis. */
const TICK_HALF = ((EVAL_COLS - 1) / 2) * EVAL_COL_W + EVAL_COL_W * 0.45; // 43.5
/** The fork, below the hollow rows, and each branch's control point. The branch
 *  BOWS OUTSIDE the hollow rows rather than cutting across them: measured on
 *  the sampled curve, its closest approach to a hollow bead's edge is 21.3
 *  world px. */
export const FORK = { x: CX, y: BASE_Y + 360 };
const BR_C = [
  { x: LANE_X[0], y: BASE_Y + 225 },
  { x: LANE_X[1], y: BASE_Y + 225 },
];
const BR_END = [
  { x: LANE_X[0], y: BASE_Y },
  { x: LANE_X[1], y: BASE_Y },
];
/** The stem starts just clear of the arrow's own head. */
const STEM_TOP = { x: CX, y: FORK.y };
const STEM_BOT = { x: CX, y: ARROW_TIP_Y - 10 };

/** Rows hang BELOW the baseline for the hollow ones and stack ABOVE it for the
 *  solid ones — `EvalColumn`'s own geometry, restated here only so a bead can
 *  be flown to the exact slot the column would have drawn. */
export const ROWS_HOLLOW = 3;
const slotY = (row: number) => BASE_Y - (row + 1) * EVAL_ROW_H;
/** A row fills from the FAR side, so a bead never crosses one already standing:
 *  honesty is fed from its left, so its rows fill right to left. */
const slotX = (col: number, n: number) => {
  const c = col === 0 ? EVAL_COLS - 1 - n : n;
  return COL_X[col] - ((EVAL_COLS - 1) / 2) * EVAL_COL_W + c * EVAL_COL_W;
};
/** How far below its slot a bead leaves the lane and turns in. */
const CORNER_LEAD = 45;
/** The labels are the house LABEL_PX in world px, which at K_WIDE is exactly
 *  LABEL_PX on screen — and the cut's minimum zoom is 1.15, so they never fall
 *  below 46 screen px. That is what STEM_D was shortened for: at the 1100 px
 *  stem the pull-back had to reach k 0.87 to hold the chain and the labels came
 *  out at 39 px with the picture sparse around them. */
export const LABEL_PX_WORLD = worldPx(40);
const LABEL_Y1 = BASE_Y + ROWS_HOLLOW * EVAL_ROW_H + LABEL_PX_WORLD * 1.25;
const LABEL_Y2 = LABEL_Y1 + LABEL_PX_WORLD * 0.95;
const LABEL_INK_BOT = LABEL_Y2 + LABEL_PX_WORLD * 0.21;

// ---------------------------------------------------------------------------
// GEOMETRY. A polyline with its own arc-length table: every route in this cut
// (the stem, a fork branch, a bead's whole journey) is one of these, so a bead's
// position is an arc length and the drawn route is the same points.
// ---------------------------------------------------------------------------
type P = { x: number; y: number };

const quadPts = (p0: P, c: P, p1: P, n = 16): P[] => {
  const out: P[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({
      x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
      y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
    });
  }
  return out;
};

type Poly = { pts: P[]; cum: number[]; len: number };

const poly = (pts: P[]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return { pts, cum, len: cum[cum.length - 1] };
};

const polyAt = (p: Poly, s: number): P => {
  if (s <= 0) return p.pts[0];
  if (s >= p.len) return p.pts[p.pts.length - 1];
  let lo = 0;
  let hi = p.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p.cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const seg = p.cum[hi] - p.cum[lo];
  const t = seg <= 1e-9 ? 0 : (s - p.cum[lo]) / seg;
  return {
    x: lerp(p.pts[lo].x, p.pts[hi].x, t),
    y: lerp(p.pts[lo].y, p.pts[hi].y, t),
  };
};

const pathD = (pts: P[], from = 0, to = pts.length - 1) => {
  let d = "";
  for (let i = from; i <= to; i++) {
    d += `${i === from ? "M" : "L"}${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  return d;
};

// ---------------------------------------------------------------------------
// THE WAVE. Cut 2's telling is still travelling when this cut starts: 3.2 s of
// face shot sit between, so the phase is re-keyed here rather than extrapolated
// (at cut 2's own 26 world px/frame it would have finished during the face
// shot). The brief's shape is: 45% of the flock snapped at f0, and the last
// agent at f40.
//
// The arrival is keyed on DISTANCE from the seat's RING EDGE (never on link
// hops, which quantise the crowd into shells) through a QUADRATIC fitted to
// three anchors — the nearest agent at WAVE_PRE, the 45th percentile at 0, the
// farthest at 40. A straight line through the last two would put the nearest
// agent's snap at f-36 and the front of the flock would then be too young to
// have anything in flight; the quadratic is monotone over the whole range (its
// vertex is past the far end, asserted in STATS) and reads as a wave that has
// been spreading for a while and is speeding up as the links multiply, which is
// exactly what happened off-screen.
// ---------------------------------------------------------------------------
const WDIST: number[] = DIST.dist.map((d) => Math.max(0, d - SEAT_R));
const WD_MIN = Math.min(...WDIST);
const WD_MAX = Math.max(...WDIST);
const WD_45 = (() => {
  const s = WDIST.slice().sort((a, b) => a - b);
  return s[Math.floor(0.45 * (s.length - 1))];
})();
/** The frame the wave reached the FRONT of the flock, i.e. how long it had
 *  already been travelling when this cut cut in. */
const WAVE_PRE = -96;
const WAVE_END = 40;
const WAVE_Q = (() => {
  // the parabola through (WD_MIN, WAVE_PRE), (WD_45, 0), (WD_MAX, WAVE_END)
  const x1 = WD_MIN;
  const x2 = WD_45;
  const x3 = WD_MAX;
  const y1 = WAVE_PRE;
  const y2 = 0;
  const y3 = WAVE_END;
  const s12 = (y2 - y1) / (x2 - x1);
  const s23 = (y3 - y2) / (x3 - x2);
  const a = (s23 - s12) / (x3 - x1);
  const b = s12 - a * (x1 + x2);
  const c = y2 - a * x2 * x2 - b * x2;
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
// THE AGENTS. Position, hunt and snap EXACTLY as cut 2 draws them, ported
// value for value — the coherent wander field with its per-agent cap, the
// static hashed base, the real swing on a period an agent completes inside a
// cut, the shortest-arc turn onto the arrow, the tone riding the same number.
// The crowd is the same crowd doing the same thing, three seconds further on.
//
//   base_i   +-22 deg, hashed and STATIC, so no agent sits on -90 by default
//   swing_i  15-23 deg, hashed, |base| clamped so |base| + swing <= 45
//   period_i 40-70 frames — every agent completes several hunts in this cut
//   snapped  -90 exactly with a +-2 deg hunt, and the jitter down to 0.3
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

// ---------------------------------------------------------------------------
// THE LINK WEB, painted by cut 2's `linkPaint` — the set's fix for the web
// reading as a WIRE CAGE over the comets. Idle 0.30, a 5/12-frame TRAVELLING
// BAND to 0.95 as a wave crosses, and 0.45 once the channel wake has passed.
// In THIS cut the channel wake passed during cut 2 (its f74-95, three seconds
// ago), so every link is already standing at the 0.45 rest and the only band
// left to fire is the SNAP wave's, which is still crossing the flock — the
// wavefront lights its own links as it goes and they fall straight back.
//
// The packets are drawn here rather than by `Link` for the same reason cut 2
// draws its own: the module's PACKET_R is 0.56 of a comet's head and twenty of
// them read as extra agents. 0.45 of the head, and the idle period 3.4x the
// module's.
// ---------------------------------------------------------------------------
/** The channel wake's arrival, in this cut's clock: long done. Negative enough
 *  that `linkPaint`'s floor is fully lifted and its band long finished. */
const CH_DONE = -400;
const PKT_R = 0.45 * DOT_R;
const PKT_PERIOD_IDLE = PACKET_PERIOD * 3.4;
const PKT_PERIOD_LIT = PACKET_PERIOD * 1.7;
const WAVE_BEAD_R = 0.62 * DOT_R;
/** How far off a comet's own body a link starts and ends, in that comet's
 *  radii — cut 2's value, so the blob is comets with links between them and
 *  not a truss with dots at its joints. */
const LINK_GAP = 1.35;
/** `Link` multiplies its own `opacity` by lerp(LINK_IDLE, LINK_LIVE, live), so
 *  this is what to hand it for the product to come out at `op`. */
const linkAlpha = (op: number, band: number) => op / lerp(LINK_IDLE, LINK_LIVE, band);
/** The snap wave's own bead on a link: it exists only while the wave is
 *  crossing that link, from the end that snaps first to the end that snaps
 *  next, so a bead ARRIVING is what the snap means. */
const beadOn = (ta: number, tb: number, f: number) => {
  if (tb <= ta) return null;
  const u = (f - ta) / (tb - ta);
  return u >= 0 && u <= 1 ? u : null;
};

/** Every agent's seat in the world, wander off — what the routes are built on.
 *  The wander is +-3.5 px, which is a fifth of a bead, so a bead's first vertex
 *  is its agent to well inside the width of the line it leaves on. */
const AGENT_POS: P[] = FORM.seats.map((s) => formationAt(s, FORM_C, headingAt()));

// ---------------------------------------------------------------------------
// THE CHANNEL. A bead goes to the seat THROUGH THE LINKS — the agents' own
// accent links and then the white seat-link — so the route is a shortest path
// on the link graph, rooted at the seat: Dijkstra with Euclidean weights, the
// seat joined to the five front agents. That is the clip's point: the same
// channel the telling came down is the one the answer comes back up.
// ---------------------------------------------------------------------------
const CHAIN: number[][] = (() => {
  const n = FORM.seats.length;
  const adj: number[][] = Array.from({ length: n }, () => []);
  FORM.links.forEach(([a, b]) => {
    adj[a].push(b);
    adj[b].push(a);
  });
  const d = new Array<number>(n).fill(Infinity);
  const par = new Array<number>(n).fill(-1);
  FRONT.forEach((i) => {
    d[i] = Math.hypot(AGENT_POS[i].x - SEAT.x, AGENT_POS[i].y - SEAT.y);
  });
  const done = new Array<boolean>(n).fill(false);
  for (let it = 0; it < n; it++) {
    let best = -1;
    for (let i = 0; i < n; i++) if (!done[i] && d[i] < (best < 0 ? Infinity : d[best])) best = i;
    if (best < 0) break;
    done[best] = true;
    for (const j of adj[best]) {
      const w = Math.hypot(
        AGENT_POS[j].x - AGENT_POS[best].x,
        AGENT_POS[j].y - AGENT_POS[best].y,
      );
      if (d[best] + w < d[j]) {
        d[j] = d[best] + w;
        par[j] = best;
      }
    }
  }
  // A seat the link graph left isolated (the feather can strand one at the
  // edge) hands itself to the nearest agent that is not isolated, as one
  // segment: it is a bead crossing open crowd, which is what it would do.
  return FORM.seats.map((_, i) => {
    const out = [i];
    let cur = i;
    let guard = 0;
    while (par[cur] >= 0 && guard++ < n) {
      cur = par[cur];
      out.push(cur);
    }
    if (!Number.isFinite(d[i])) {
      let near = -1;
      for (let j = 0; j < n; j++) {
        if (j === i || !Number.isFinite(d[j])) continue;
        const dd = Math.hypot(AGENT_POS[j].x - AGENT_POS[i].x, AGENT_POS[j].y - AGENT_POS[i].y);
        if (near < 0 || dd < Math.hypot(AGENT_POS[near].x - AGENT_POS[i].x, AGENT_POS[near].y - AGENT_POS[i].y)) near = j;
      }
      if (near >= 0) {
        out.length = 1;
        let c2 = near;
        out.push(c2);
        let g2 = 0;
        while (par[c2] >= 0 && g2++ < n) {
          c2 = par[c2];
          out.push(c2);
        }
      }
    }
    return out;
  });
})();

// ---------------------------------------------------------------------------
// THE ROUTE. One polyline from the seat to each column: up the arrow, up the
// stem, out the fork, up the lane. A bead rides it; the INK_LO route is drawn
// under the beads and the INK_HI over-draw of gesture 3 on top of them, which
// is the spine rule.
// ---------------------------------------------------------------------------
const ROUTE: Poly[] = [0, 1].map((col) =>
  poly([
    { x: SEAT.x, y: SEAT.y },
    { x: CX, y: ARROW_TIP_Y },
    FORK,
    ...quadPts(FORK, BR_C[col], BR_END[col]),
  ]),
);

/** A bead's route as far as the baseline: its own chain, into the seat, up the
 *  arrow, up the stem, out the fork. */
const enterPts = (agent: number, col: number): P[] => {
  const pts: P[] = CHAIN[agent].map((j) => AGENT_POS[j]);
  pts.push({ x: SEAT.x, y: SEAT.y });
  pts.push({ x: CX, y: ARROW_TIP_Y });
  pts.push(FORK);
  pts.push(...quadPts(FORK, BR_C[col], BR_END[col]));
  return pts;
};

const beadRoute = (agent: number, col: number, row: number, n: number): Poly => {
  const pts = enterPts(agent, col);
  const by = slotY(row);
  const lead = Math.min(BASE_Y, by + CORNER_LEAD);
  if (lead < BASE_Y - 1e-6) pts.push({ x: LANE_X[col], y: lead });
  pts.push(
    ...quadPts({ x: LANE_X[col], y: lead }, { x: LANE_X[col], y: by }, { x: slotX(col, n), y: by }, 10),
  );
  return poly(pts);
};

// ---------------------------------------------------------------------------
// THE STREAM. A snapped agent produces eval beads: one when the wave reaches it
// and then one every EMIT_P frames on its own hashed phase. EMIT_P HALVES at
// f95 — that is gesture 4's "the stream thickens, rate x 2" and it is the only
// thing that changes there.
//
// Every timing in the columns is therefore a consequence of where its agent
// stands: a bead reaches the BASELINE at `enter` = born + (its chain + the stem
// + the branch) / BEAD_V, which is the same length for both columns and does
// not depend on which slot it is going to. THAT is what orders the queue, so
// there is no circularity between the slot a bead gets and the flight that gets
// it there. It then climbs the lane to its own slot and LANDS at `arrive`.
//
// Which column a bead goes to is decided before the fork, because that is where
// it physically has to be decided: whichever column is further below its share.
// The shares are the brief's — honesty alone until f26, then the right column
// takes most of f26-49, then honesty again from f95 — written as a target curve
// per column.
//
// A column's height is the number of beads that have LANDED in it (`ROWS_AT`
// reads the arrival table), so it can only change while a bead is arriving —
// asserted in STATS.
// ---------------------------------------------------------------------------
export const BEAD_V = 20; // world px/frame: 44 screen px/frame at the opening k
const EMIT_LAG = 2;
const EMIT_P = 200; // frames between one agent's beads...
const EMIT_HALVE = 70; // ...halving for beads BORN from here on
const emitPeriod = (f: number) => (f < EMIT_HALVE ? EMIT_P : EMIT_P / 2);
// An agent emits when its INTEGRATED production clock crosses the next integer
// past its own hashed offset (see BEADS). It has to be an integral of 1/period
// rather than `t += period`: an agent whose emission happens to land just before
// EMIT_HALVE would otherwise step a whole slow period straight over the fast
// window and never emit again, which is what thinned the stream to a third over
// the last 40 frames of the first pass.
/** The backlog: an agent that was ALREADY snapped when the cut cut in has been
 *  producing for a while, so it has a bead IN THE AIR at f0 — which is the
 *  opening frame the brief asks for, "beads leaving the top of frame". One per
 *  agent snapped before BACKLOG_SNAP, born so that it lands inside the first
 *  BACKLOG_SPAN frames on its own hashed phase. It is also what makes the
 *  honesty column climb four rows by f24: a bead takes 55-123 frames to fly, so
 *  nothing the wave does inside this cut can reach the column that early. */
const BACKLOG_SNAP = -30;
const BACKLOG_SPAN = 20;

/** The share each column is meant to have of the beads landed so far. Only the
 *  SPLIT comes from here; the total is the stream's own. */
const TARGET = (col: number, f: number): number => {
  const F = [0, 26, 49, 95, 173];
  const H = [0, 12, 18, 30, 120];
  const I = [0, 0, 12, 27, 38];
  const a = col === 0 ? H : I;
  if (f <= F[0]) return a[0];
  for (let i = 1; i < F.length; i++) {
    if (f <= F[i]) return a[i - 1] + ((a[i] - a[i - 1]) * (f - F[i - 1])) / (F[i] - F[i - 1]);
  }
  return a[a.length - 1];
};

export type Bead = {
  agent: number;
  col: number;
  row: number;
  n: number; // which of the three in its row
  born: number;
  arrive: number;
  route: Poly;
};

/** The flight from an agent to the BASELINE: its own chain, the seat, the arrow,
 *  the stem and the branch. Column-independent (the two branches are mirror
 *  images), which is what makes the queue orderable. */
const ENTER_LEN: number[] = FORM.seats.map((_, i) => poly(enterPts(i, 0)).len);

const BEADS: Bead[] = (() => {
  type Emit = { agent: number; born: number; enter: number };
  const emits: Emit[] = [];
  const push = (agent: number, born: number) => {
    emits.push({ agent, born, enter: born + ENTER_LEN[agent] / BEAD_V });
  };
  FORM.seats.forEach((s, i) => {
    const snap = SNAP_AT[i];
    // the bead already in the air at f0, for an agent snapped before the cut
    if (snap <= BACKLOG_SNAP) {
      push(i, 1 - ENTER_LEN[i] / BEAD_V + hash(s.i, 94) * BACKLOG_SPAN);
    }
    // the one it sends because the wave reached it
    push(i, snap + EMIT_LAG);
    // ...and its own steady production after that, on the integrated clock
    let acc = -hash(s.i, 93);
    for (let t = Math.ceil(snap) + 5; t <= DURATION - 2; t++) {
      const before = acc;
      acc += 1 / emitPeriod(t);
      if (Math.floor(acc) > Math.floor(before)) push(i, t);
    }
  });
  emits.sort((a, b) => a.enter - b.enter || a.agent - b.agent);

  // -- the stream's own separation pass -------------------------------------
  // Every bead in the cut shares one stem, so two emissions whose flights put
  // them at the same place at the same time fuse into one lumpy body — the same
  // thing `buildFormation`'s relaxation exists to stop. `born` is the free
  // variable, so the queue is walked once and any bead closer than BEAD_SEP
  // frames to the one in front is held back by the difference. It preserves the
  // order and costs a few frames at worst.
  const BEAD_SEP = 1.35; // frames: 27 world px between centres at BEAD_V
  for (let i = 1; i < emits.length; i++) {
    const need = emits[i - 1].enter + BEAD_SEP;
    if (emits[i].enter < need) {
      const d = need - emits[i].enter;
      emits[i].born += d;
      emits[i].enter += d;
    }
  }

  const count = [0, 0];
  const out: Bead[] = [];
  for (const e of emits) {
    // a bead that would have landed before the cut is already inside the hollow
    // rows — see DEVIATIONS
    if (e.enter < 1) continue;
    const at = e.enter + 8; // roughly where it will land, for the share test
    const d0 = TARGET(0, at) - count[0];
    const d1 = TARGET(1, at) - count[1];
    const col = d1 > d0 ? 1 : 0;
    const n = count[col] % EVAL_COLS;
    const row = Math.floor(count[col] / EVAL_COLS);
    count[col]++;
    const route = beadRoute(e.agent, col, row, n);
    out.push({
      agent: e.agent,
      col,
      row,
      n,
      born: e.born,
      arrive: e.born + route.len / BEAD_V,
      route,
    });
  }
  return out;
})();

/** Beads still in flight at `f`, and the ones that have landed, both derived
 *  from one table so a column cannot disagree with the stream. */
const LANDED: Bead[][] = [
  BEADS.filter((b) => b.col === 0).sort((a, b) => a.arrive - b.arrive),
  BEADS.filter((b) => b.col === 1).sort((a, b) => a.arrive - b.arrive),
];

/** How many solid rows a column stands at, as a CONTINUOUS number: the count of
 *  beads landed over EVAL_COLS, with the bead currently arriving counted by how
 *  far along its last EVAL_BEAD_IN frames it is. Height therefore only changes
 *  while a bead is arriving. */
export const ROWS_AT = (col: number, f: number) => {
  const list = LANDED[col];
  let n = 0;
  for (const b of list) {
    if (b.arrive <= f) n++;
    else break;
  }
  return n / EVAL_COLS;
};
export const BEADS_AT = (col: number, f: number) => Math.round(ROWS_AT(col, f) * EVAL_COLS);

/** The top of a column's ink: the highest slot a landed bead sits in. */
const colTop = (col: number, f: number) => {
  const rows = Math.ceil(ROWS_AT(col, f));
  return BASE_Y - Math.max(rows, 0) * EVAL_ROW_H;
};
/** ...and the top of its lane, which runs CORNER_LEAD above the next slot. */
const laneTop = (col: number, f: number) => Math.min(BASE_Y, colTop(col, f) - CORNER_LEAD);

// ---------------------------------------------------------------------------
// THE CAMERA. Knots on a monotone cubic Hermite (Fritsch-Carlson), one key per
// frame, through the shared damper, pre-rolled from -CAM_PRE so f0 is mid-move.
// The construction is `trapShared`'s `hermite` / `camKnots3`, kept here rather
// than imported because that file is another clip's world.
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
/** The knots. f0, f95 and DURATION+8 are SOLVED below so the DAMPED camera
 *  reads the three designed framings; the rest are authored, and the two
 *  between f0 and f49 exist only to make the glide's DECELERATION gradual — a
 *  single knot where the glide ends is a corner in the target's velocity, and
 *  the damper answers a corner with a spike in acceleration (measured: 2.87
 *  px/f^2 at f25 with one knot, 2.4 with these three). */
const KF = [-CAM_PRE, 0, 28, 49, 70, 95, DURATION + 8];
const KY0 = [560, 293, -55, -70, -30, 15, -560];
const KK0 = [2.4, 2.2, 1.62, 1.3, 1.14, 1.0, 1.3];

const camTrack = (KY: number[], KK: number[]) => {
  const yOf = hermite(KF, KY);
  const kOf = hermite(KF, KK);
  // one key per frame from -CAM_PRE, then the damper from rest at -CAM_PRE
  const run = (upto: number) => {
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
  return run;
};

/** The framings the cut is designed around, as (frame, world y at screen 835,
 *  k). See CAMERA in the header for where each number comes from. */
const TARGET_FRAMES: [number, number, number][] = [
  [0, 293, 2.2],
  [28, -55, 1.62],
  [95, 25, 1.0],
  [DURATION - 1, -548, 1.28],
];

const CAM = (() => {
  const KY = KY0.slice();
  const KK = KK0.slice();
  const idxOf = (f: number) => {
    if (f === 0) return 1;
    if (f === 28) return 2;
    if (f === 95) return 5;
    return 6;
  };
  const secant = (arr: number[], i: number, f: number, target: number, pick: (r: { y: number; k: number }) => number) => {
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
// THE OVER-DRAW (gesture 3). The route from the seat to the honesty column,
// re-drawn in full-opacity white bottom to top over f58-82 — landing four
// frames before "path" (f86), which is the set's "never late" rule rather than
// the brief's f66-92 — and from then on it IS the path: it keeps extending up
// the lane as the column grows, with a dashed continuation marching on ahead of
// it (gesture 4).
// ---------------------------------------------------------------------------
const OVER_F0 = 58;
const OVER_F1 = 82;
const overDraw = (f: number) => smoothstep(clamp01((f - OVER_F0) / (OVER_F1 - OVER_F0)));
/** The dashed continuation: it starts on "for" (f95) and keeps this far ahead
 *  of the lane's top. It is deliberately allowed to run OFF THE TOP OF FRAME —
 *  the path has not arrived anywhere, and a dashed line that stops inside the
 *  frame would say it had. */
const DASH_LEAD = (f: number) => 230 * smoothstep(clamp01((f - 95) / 26));

// ---------------------------------------------------------------------------

const HonestyGoesUp: React.FC<Props> = ({
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
  /** The world's own travel, for the grid only: the picture co-moves with the
   *  formation and the camera tracks it, so what moves on screen is the ground. */
  const tv = travel(frame, headingAt);

  const agents = FORM.seats.map((_, i) => agentAt(i, frame));

  // -- the routes, as drawn --------------------------------------------------
  const lane = [0, 1].map((col) => laneTop(col, frame));
  /** The stem, drawn ONCE (both branches share it, and two INK_LO strokes on
   *  one line would read as a brighter line than either). */
  const stemD = pathD([STEM_BOT, STEM_TOP]);
  const routeD = [0, 1].map(
    (col) =>
      pathD(ROUTE[col].pts.slice(2)) +
      `L${LANE_X[col].toFixed(2)} ${lane[col].toFixed(2)}` +
      `M${LANE_X[col].toFixed(2)} ${BASE_Y.toFixed(2)}L${(
        COL_X[col] + (col === 0 ? -TICK_HALF : TICK_HALF)
      ).toFixed(2)} ${BASE_Y.toFixed(2)}`,
  );

  // the over-drawn path: the same geometry, drawn on by fraction of its length
  const od = overDraw(frame);
  const pathPts: P[] = [
    { x: CX, y: ARROW_TIP_Y },
    FORK,
    ...quadPts(FORK, BR_C[0], BR_END[0]),
    { x: LANE_X[0], y: lane[0] },
  ];

  const dashLead = DASH_LEAD(frame);
  const dashTop = lane[0] - dashLead;

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
          {/* UNDER: the links, the route at INK_LO, and the columns' own hollow
              rows, baseline ticks and nothing else. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* The agents' own links: accent, INSET off both bodies by
                LINK_GAP radii, painted by cut 2's `linkPaint` — 0.45 at rest
                with a 5/12-frame travelling band to 0.95 where the snap wave is
                crossing right now, and its own bead on the link it is crossing. */}
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
                    opacity={linkAlpha(paint.op, paint.band)}
                  />
                  {pk.map((w, m) => (
                    <circle
                      key={`t${m}`}
                      cx={w.x}
                      cy={w.y}
                      r={PKT_R}
                      fill={accent}
                      opacity={paint.op}
                    />
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

            {/* The seat's white links to the five front agents: the same
                geometry, width and packets as the accent ones — that sameness
                is the line's "similar techniques". They were woken during cut 2
                and stand lit here. */}
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

            <g style={{ filter: icon }}>
              <path
                d={stemD}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE_W}
                strokeLinecap="round"
                opacity={INK_LO}
              />
              {[0, 1].map((col) => (
                <path
                  key={`r${col}`}
                  d={routeD[col]}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE_W}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={INK_LO}
                />
              ))}
            </g>

            {[0, 1].map((col) => (
              <EvalColumn
                key={`c${col}`}
                k={k}
                x={COL_X[col]}
                y={BASE_Y}
                frame={frame}
                rowsHollow={ROWS_HOLLOW}
                rowsSolid={0}
                seed={col + 1}
              />
            ))}
          </svg>

          {/* THE AGENTS, and then the BEADS they produce, over the links and
              under everything white. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {agents.map((a, i) => (
              <Comet key={`a${i}`} x={a.x} y={a.y} heading={a.heading} r={a.r} tone={a.tone} />
            ))}

            {BEADS.map((b, i) => {
              if (frame < b.born) return null;
              const landed = frame >= b.arrive;
              const s = landed ? b.route.len : (frame - b.born) * BEAD_V;
              const p = polyAt(b.route, s);
              const grow = Math.min(1, (frame - b.born) / 3);
              const r = BEAD_R * grow;
              if (r < 0.2) return null;
              return <circle key={`b${i}`} cx={p.x} cy={p.y} r={r} fill={accent} />;
            })}
          </svg>

          {/* OVER: the path, at INK_HI, on top of the lane it was a stream on,
              and its dashed continuation. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <g style={{ filter: icon }}>
              {od > 0 ? (
                <path
                  d={pathD(pathPts)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE_W}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={`${od.toFixed(4)} 1`}
                  opacity={INK_HI}
                />
              ) : null}
              {dashLead > 2 ? (
                <line
                  x1={LANE_X[0]}
                  y1={lane[0]}
                  x2={LANE_X[0]}
                  y2={dashTop}
                  stroke={ink}
                  strokeWidth={STROKE_W}
                  strokeLinecap="butt"
                  strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                  strokeDashoffset={-frame * MARCH_W}
                  opacity={INK_HI}
                />
              ) : null}
            </g>
          </svg>

          {/* THE SEAT: the ring, the arrow, A in it, and the labels this cut
              inherits. The beads pass BEHIND it and come out up the arrow. */}
          <UserSeat
            k={k}
            x={SEAT.x}
            y={SEAT.y}
            frame={frame}
            occupant="agent"
            arrow={1}
            agentTone={1}
            agentHeading={H_USER}
          />
          {/* `user ◯ A`, both parked and both INK_HI: cut 2's own geometry, so
              the ring reads the same way it did when A docked in it — "user" on
              the ring's left shoulder, "A" on its right, and by the end of cut 2
              "user" has ripened to INK_HI because it is half of what the clip is
              saying. Drawn here rather than through `UserSeat`'s own `label`,
              which puts it under the ring where the seat-link fan is. */}
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

          {/* THE TWO COLUMN LABELS. Each slides up 24 px while fading in over
              10 frames, on its own word.
              THEY ARE INK_HI, not INK_LO. The only place the label block can sit
              is the mouth of the fork — the hollow rows are directly above it
              and the stem directly below — so each branch crosses the outer end
              of its own label wherever they are put. At INK_LO over an INK_LO
              curve the two read as one tangle; at INK_HI the words are plainly
              in front of the line behind them, which they should be: these two
              are what the line being spoken is ABOUT, not context. Each is also
              nudged 20 px toward the axis, which takes the crossing off the
              letters and into the space before them. */}
          <Label
            k={k}
            x={COL_X[0] + 20}
            y={LABEL_Y1 - LABEL_PX_WORLD}
            text="honesty"
            f0={10}
            frame={frame}
            size={LABEL_PX_WORLD}
            opacity={INK_HI}
          />
          <div
            style={{
              position: "absolute",
              left: COL_X[1] - 20 - 600,
              top: LABEL_Y1 - LABEL_PX_WORLD + worldPx(24) * (1 - labelIn(frame, 24)),
              width: 1200,
              textAlign: "center",
              fontFamily: FONT_LABEL,
              fontSize: LABEL_PX_WORLD,
              lineHeight: 0.95,
              color: ink,
              opacity: INK_HI * labelIn(frame, 24),
              filter: icon,
            }}
          >
            instruction
            <br />
            following
          </div>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HonestyGoesUp;

// ---------------------------------------------------------------------------
// THE NUMBERS, computed rather than asserted.
// ---------------------------------------------------------------------------
const PROBES: [number, number][] = [
  [SEAT.x, SEAT.y],
  [FORM_C.x, FORM_C.y],
  [FORM_C.x - BLOB_RX, FORM_C.y + BLOB_RY],
  [COL_X[0], BASE_Y],
  [COL_X[0], BASE_Y - 690],
  [CX, ARROW_TIP_Y],
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
      // only a probe that is ON SCREEN counts: a world point far off-frame
      // moves fast under a zoom change and nothing is drawn there, so counting
      // it measures a phantom rather than anything anyone sees.
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

/** Every bead's screen speed, and the stream's density on the stem. */
const beadStats = (() => {
  let v = 0;
  let vAt = 0;
  let minGap = Infinity;
  const onStem: number[] = [];
  for (let f = 0; f < DURATION; f++) {
    const sPos: number[] = [];
    let n = 0;
    for (const b of BEADS) {
      if (f < b.born || f >= b.arrive) continue;
      const s = (f - b.born) * BEAD_V;
      const p0 = polyAt(b.route, s);
      const p1 = polyAt(b.route, s + BEAD_V);
      const sc = Math.hypot(p1.x - p0.x, p1.y - p0.y) * camAt(f).k;
      if (sc > v) {
        v = sc;
        vAt = f;
      }
      // on the shared stem? measured in world y between the arrow tip and the fork
      if (p0.y <= ARROW_TIP_Y && p0.y >= FORK.y && Math.abs(p0.x - CX) < 2) {
        n++;
        sPos.push(p0.y);
      }
    }
    onStem.push(n);
    sPos.sort((a, b) => a - b);
    for (let i = 1; i < sPos.length; i++) minGap = Math.min(minGap, sPos[i] - sPos[i - 1]);
  }
  return {
    v,
    vAt,
    minGapWorld: Number.isFinite(minGap) ? Math.abs(minGap) : null,
    stemMin: Math.min(...onStem),
    stemMax: Math.max(...onStem),
    stemMean: onStem.reduce((a, b) => a + b, 0) / onStem.length,
  };
})();

/** A column may only change height on an arrival. */
const heightChanges = (() => {
  let bad = 0;
  for (const col of [0, 1]) {
    for (let f = 1; f < DURATION; f++) {
      const a = ROWS_AT(col, f - 1);
      const b = ROWS_AT(col, f);
      if (a === b) continue;
      const arrived = LANDED[col].some((x) => x.arrive > f - 1 && x.arrive <= f);
      if (!arrived) bad++;
    }
  }
  return bad;
})();

/** The branch's closest approach to a hollow bead. */
const branchClearance = (() => {
  let worst = Infinity;
  for (const col of [0, 1]) {
    const pts = quadPts(FORK, BR_C[col], BR_END[col], 160);
    for (const p of pts) {
      for (let r = 0; r < ROWS_HOLLOW; r++) {
        for (let c = 0; c < EVAL_COLS; c++) {
          const bx = COL_X[col] - ((EVAL_COLS - 1) / 2) * EVAL_COL_W + c * EVAL_COL_W;
          const by = BASE_Y + (r + 0.5) * EVAL_ROW_H;
          worst = Math.min(worst, Math.hypot(p.x - bx, p.y - by) - BEAD_R - STROKE_W / 2);
        }
      }
    }
  }
  return worst;
})();

/** The caption-safe audit: on every frame, where the top of each column's ink
 *  and the bottom of its label block actually land on screen. The columns grow
 *  upward and the camera has to stay ahead of them, so this is the number the
 *  mid-cut knots are authored against. */
const bandAudit = (() => {
  let hiWorst = Infinity; // the smallest screen y any column top reaches
  let hiAt = 0;
  let loWorst = -Infinity; // the largest screen y the label block reaches
  let loAt = 0;
  const rows: [number, number, number][] = [];
  for (let f = 0; f < DURATION; f++) {
    let hi = Infinity;
    for (const col of [0, 1]) {
      if (ROWS_AT(col, f) <= 0) continue;
      const y = screenAt(f, COL_X[col], colTop(col, f) - BEAD_R).y;
      hi = Math.min(hi, y);
    }
    const lo = screenAt(f, COL_X[0], LABEL_INK_BOT).y;
    if (Number.isFinite(hi) && hi < hiWorst) {
      hiWorst = hi;
      hiAt = f;
    }
    if (lo > loWorst) {
      loWorst = lo;
      loAt = f;
    }
    if (f % 12 === 0) {
      rows.push([f, Number((Number.isFinite(hi) ? hi : -1).toFixed(0)), Number(lo.toFixed(0))]);
    }
  }
  // From f24 on — the frame the camera has settled on the columns — the whole
  // picture has to sit inside the caption-safe band.
  let settledTop = Infinity;
  let settledAt = 0;
  for (let f = 28; f < DURATION; f++) {
    for (const col of [0, 1]) {
      if (ROWS_AT(col, f) <= 0) continue;
      const y = screenAt(f, COL_X[col], colTop(col, f) - BEAD_R).y;
      if (y < settledTop) {
        settledTop = y;
        settledAt = f;
      }
    }
  }
  // and the camera never reverses
  let revY = 0;
  let revK = 0;
  let revYpx = 0;
  let revKamt = 0;
  for (let f = 1; f < DURATION; f++) {
    const dy = camAt(f).y - camAt(f - 1).y;
    const dk = camAt(f).k - camAt(f - 1).k;
    if (dy > 1e-6) {
      revY++;
      revYpx += dy;
    }
    if (dk > 1e-6) {
      revK++;
      revKamt += dk;
    }
  }
  return {
    topMin: Number(hiWorst.toFixed(0)),
    topMinAt: hiAt,
    topMinFrom24: Number(settledTop.toFixed(0)),
    topMinFrom24At: settledAt,
    labelMax: Number(loWorst.toFixed(0)),
    labelMaxAt: loAt,
    camReversalsY: revY,
    camReversalsYpx: Number(revYpx.toFixed(1)),
    camReversalsK: revK,
    camReversalsKamt: Number(revKamt.toFixed(4)),
    rows,
  };
})();

/** NO FUSED COMETS. The wander is a coherent field plus a capped solo drift, so
 *  this should never dip under SEP_FLOOR; it is measured on every frame rather
 *  than trusted, because the cap is solved on the SEATS and the drift is what
 *  moves. Reported as the worst pair over the whole cut, in mean radii. */
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

/** WHAT IS LIVE BELOW SCREEN 1300 on the wide frames, which is the director's
 *  own check. The answer is geometric and not a choice: cut 1/2's world puts the
 *  seat SEAT_GAP above the blob's centre, so the flock's head is only 230 world
 *  px below the seat, and this cut's columns are STEM_D above it. For the
 *  columns' top to sit at screen 200 and the seat at 1300 at the same time,
 *      (504 + 556) * k <= 1100  =>  k <= 1.04,
 *  and at any such k the flock's head lands 230 * k below the seat, i.e. at
 *  1530 — inside the frame whatever else is done. The only ways out are to drop
 *  the formation from the wide frame entirely (which loses the source of the
 *  beads on the one frame that holds the whole argument) or to accept the crowd
 *  bleeding off the bottom edge, which is what the set does elsewhere. This
 *  measures exactly what crosses the line so the director can pick. */
const belowStats = (() => {
  const at = (f: number) => {
    const c = camAt(f);
    const y = (w: number) => FRAME_H / 2 + (w - c.cy) * c.k;
    return {
      f,
      k: Number(c.k.toFixed(3)),
      colTop: Number(y(colTop(0, f)).toFixed(0)),
      labelInk: Number(y(LABEL_INK_BOT).toFixed(0)),
      seatRingTop: Number(y(SEAT.y - SEAT_R).toFixed(0)),
      seat: Number(y(SEAT.y).toFixed(0)),
      flockHead: Number(y(FORM_C.y - BLOB_RY).toFixed(0)),
    };
  };
  return [49, 72, 86, 95, 110, 130, 150, 172].map(at);
})();

export const BEATS = defaultProps.beats;
export const STATS = {
  duration: DURATION,
  layout: {
    formCentre: FORM_C,
    seat: SEAT,
    arrowTipY: ARROW_TIP_Y,
    stemD: STEM_D,
    baseY: BASE_Y,
    forkY: FORK.y,
    colX: COL_X,
    laneX: LANE_X,
    labelInkBot: Number(LABEL_INK_BOT.toFixed(1)),
    branchClearance: Number(branchClearance.toFixed(1)),
  },
  wave: {
    pre: WAVE_PRE,
    end: WAVE_END,
    wd: [Number(WD_MIN.toFixed(1)), Number(WD_45.toFixed(1)), Number(WD_MAX.toFixed(1))],
    vertex: Number((-WAVE_Q.b / (2 * WAVE_Q.a)).toFixed(0)),
    snappedAt: [0, 10, 20, 30, 40, 49].map((f) => [
      f,
      FORM.seats.filter((_, i) => snapOf(i, f) >= 0.999).length,
    ]),
    turningAt: [0, 20, 40].map((f) => [
      f,
      FORM.seats.filter((_, i) => snapOf(i, f) > 0.001 && snapOf(i, f) < 0.999).length,
    ]),
  },
  camera: {
    ky: CAM.KY.map((v) => Number(v.toFixed(1))),
    kk: CAM.KK.map((v) => Number(v.toFixed(4))),
    at: [0, 9, 16, 24, 49, 86, 95, 120, 172].map((f) => [
      f,
      Number(camAt(f).y.toFixed(1)),
      Number(camAt(f).k.toFixed(3)),
    ]),
    maxDv: Number(camStats.dv.toFixed(3)),
    maxDvAt: camStats.dvAt,
    maxProbeV: Number(camStats.v.toFixed(2)),
    maxProbeVAt: camStats.vAt,
  },
  stream: {
    beadV: BEAD_V,
    emitP: EMIT_P,
    beads: BEADS.length,
    maxScreenV: Number(beadStats.v.toFixed(2)),
    maxScreenVAt: beadStats.vAt,
    stemDensity: [beadStats.stemMin, Number(beadStats.stemMean.toFixed(2)), beadStats.stemMax],
    stemMinGapWorld:
      beadStats.minGapWorld === null ? null : Number(beadStats.minGapWorld.toFixed(1)),
    heightChangesWithoutArrival: heightChanges,
    rows: [0, 9, 16, 24, 31, 49, 66, 86, 95, 121, 146, 172].map((f) => [
      f,
      Number(ROWS_AT(0, f).toFixed(2)),
      Number(ROWS_AT(1, f).toFixed(2)),
    ]),
    flight: [
      Number(Math.min(...BEADS.map((b) => b.arrive - b.born)).toFixed(1)),
      Number(Math.max(...BEADS.map((b) => b.arrive - b.born)).toFixed(1)),
    ],
  },
  screen: {
    /** the framings the cut is designed around, measured off the damped camera */
    f0: {
      seat: screenAt(0, SEAT.x, SEAT.y).y,
      labelInkBot: screenAt(0, COL_X[0], LABEL_INK_BOT).y,
      baseline: screenAt(0, COL_X[0], BASE_Y).y,
      blobTop: screenAt(0, FORM_C.x, FORM_C.y - BLOB_RY).y,
    },
    f95: {
      honestyTop: screenAt(95, COL_X[0], colTop(0, 95)).y,
      labels: screenAt(95, COL_X[0], LABEL_INK_BOT).y,
      seat: screenAt(95, SEAT.x, SEAT.y).y,
      blobTop: screenAt(95, FORM_C.x, FORM_C.y - BLOB_RY).y,
      labelScreenPx: Number((LABEL_PX_WORLD * camAt(95).k).toFixed(1)),
    },
    f172: {
      honestyTop: screenAt(172, COL_X[0], colTop(0, 172)).y,
      instructionTop: screenAt(172, COL_X[1], colTop(1, 172)).y,
      labels: screenAt(172, COL_X[0], LABEL_INK_BOT).y,
      seat: screenAt(172, SEAT.x, SEAT.y).y,
      labelScreenPx: Number((LABEL_PX_WORLD * camAt(172).k).toFixed(1)),
    },
    band: bandAudit,
    below1300: belowStats,
    separation: sepStats,
    minLabelPx: Number(
      (LABEL_PX_WORLD * Math.min(...Array.from({ length: DURATION }, (_, f) => camAt(f).k))).toFixed(1),
    ),
  },
};
