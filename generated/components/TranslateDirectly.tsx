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
  ARROW_LEN,
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
  TIP_TIGHT,
  UserSeat,
  buildFormation,
  formationAt,
  travel,
  wanderOf,
} from "./alignShared";
import { hermite } from "./trapShared";

export const FPS = ALIGN_FPS;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Alignment`, cut 4 `TranslateDirectly` (in at 0:38.280):
// "There's a lot of reasons why this is, like, challenging to translate
//  directly into alignment gains."
//
// DURATION. The cut starts at 38.280 s and speech ends at 41.500 s, so
//   DURATION = round((41.500 - 38.280) * 24) + 16 = 77 + 16 = 93
// — the spoken frames plus the set's 16-frame tail, which holds the unresolved
// state without ever going still.
//
// Word onsets, frame = round((t - 38.280) * 24), lifted from the SRT:
//   there's 0 · a 3 · LOT 4 · of 6 · REASONS 8 · why 12 · this 17 · is 22 ·
//   like 25 · CHALLENGING 29 · to 36 · TRANSLATE 40 · DIRECTLY 47 · into 56 ·
//   ALIGNMENT 59 · GAINS 66 (ends 77) · tail 77-93.
// ("alignment" is 59.50 and the brief rounds it to 60; nothing is keyed on it.)
//
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "a white line leaves the tight flock led by A and tries to run straight up
//    to the loose flock led by a person, but bar after bar draws across its way
//    and it has to wind round each one; the pull-back shows the straight route
//    it could not take and how far it still has to go."
//
// THE WORLD (tall, and every noun is alignShared's, imported never restated):
//   * the A-FORMATION at the bottom — 32 agents, RIPE (tone 1), tight on -90
//     with only the shared +-3 deg wander jitter, its user seat at its head with
//     AGENT A in the ring and the label "A" beside it. This is the experiment's
//     result: already aligned.
//   * the PERSON-FORMATION, GUIDE_LEN = 1000 world px of CLEAR CORRIDOR above it
//     — 32 agents, DEEP (tone 0), HUNTING over +-28 deg (see HUNT_P0),
//     `person.png` in its ring and the white ARROW rising out of it. These are
//     real users, and the alignment to that arrow — "alignment gains" — DOES NOT
//     HAPPEN in this cut: no comet ever turns onto the arrow, and the flock is
//     the same loose flock on f93 as on f0.
//   * between them the GUIDE: one straight vertical white DASHED line at INK_LO,
//     marching, from the A-seat's ring to the person-flock's tail. That is the
//     direct route, and it is the thing the line cannot take. It is at the set's
//     ONE stroke weight and DASHED is what separates it from the route.
//   * and SIX BARRIERS: white bars across the guide, BAR_L0 320 to BAR_L1 420
//     world px, full stroke, round caps, irregularly spaced (gaps 95 / 100 / 130
//     / 195 / 180 / 195 / 105) and STRICTLY ALTERNATING which side they leave
//     open (R L R L R L), standing at INK_LO until the head nears them.
//
// Both formations carry the SAME link balance (LINK_OP), so what separates them
// is only what the clip says separates them: TONE and HEADING.
//
// ---------------------------------------------------------------------------
// GESTURES — TWO, and nothing in the piece is outside this list.
//
//  1. f0-40   "there's a LOT    THE WINDING HEAD. Opens mid-flight at k 1.300
//             of REASONS why    on the head of a solid white line that has just
//             this is like      left the A-seat's ring (50 world px of it drawn
//             CHALLENGING"      at f0), the A-formation below it in the lower
//             (4/8/12/17/       frame and five bars already standing ahead. The
//              22/25/29)        head never stops. As it nears each bar THAT BAR
//                               DRAWS UP INK_LO -> INK_HI FROM THE GUIDE
//                               OUTWARDS (both ends at once, each at its own
//                               length's rate so they finish together) over
//                               BAR_WIPE_D = 65 world px of travel, i.e. ~6
//                               frames; and the head swerves round its open end
//                               on the route's own C1 arcs. The wipes are
//                               derived from the HEAD's position, never from a
//                               timer: f0 ("a LOT", b1 already drawing at f0),
//                               f3.4-10.2 ("REASONS"/"why"), f17.7-26.2
//                               ("CHALLENGING"), f46-57.5 ("DIRECTLY into") and
//                               f80-93.6 (b5, still drawing on the last frame).
//                               Barriers 1-3 are passed at f4.4 / f15.3 / f32.6
//                               — each on its own rhythm, none evenly spaced —
//                               and the next bar is always already standing
//                               ahead at INK_LO: "a lot of reasons". The "A"
//                               slides up and fades in over f0-10; it is the
//                               only text in the cut.
//  2. f26-93  "to TRANSLATE     THE PULL-BACK. ONE glide, on the camera's own
//             DIRECTLY into     keyed track: k 1.328 at f26 easing to K_WIDE_CUT
//             ALIGNMENT GAINS"  0.968 at RESOLVED_F 86, and on past it (TAIL_DK),
//             (36/40/47/56/     while the camera's rise — which has been
//              59/66)           following the head since f0 — carries on. It
//                               reveals the straight dashed guide against the
//                               winding solid route, the TWO BARRIERS STILL
//                               AHEAD, and the destination, which arrives ON the
//                               words: the flock's tail crosses the top edge at
//                               f26, the person's ring at f55 and the ARROW TIP
//                               COMPLETES AT f67 — "alignment GAINS" (f59/f66).
//                               The head keeps winding, passes barrier 4 at f66
//                               and at f93 is 65.2% of the way, 73% through the
//                               crossing from b4's side to b5's and still short
//                               of b5's open end: MID-SWERVE, and it does not
//                               arrive.
//
// LIVENESS — mechanisms, not gestures. None is on a word and none ever stops:
//   * the GRID SLIDES under everything at PARALLAX * SLIDE_V = 2.56 screen px
//     per frame at k 1 (alignShared's `travel`, mean heading H_USER): the whole
//     world co-moves and the camera tracks it, so the formations HOLD on screen
//     and the ground runs down under them.
//   * the HUNTING: every comet in the person-formation swinging its full +-28
//     deg on its own 40-70 frame period, so the destination is visibly casting
//     about for a heading it has not found. It is the second half's motor.
//   * per-agent wander and heading jitter on both formations (`wanderOf`)
//   * packets on both formations' agent links (108 links between them)
//   * the guide's dashes marching toward the destination at 3 x MARCH_W
//   * the head, which never pauses between f0 and f93 (5.21 to 20.33 world
//     px/frame, never 0)
//   * the camera, which never parks: the rise runs the whole cut and the
//     pull-back is still easing out on the last frame (TAIL_DK)
//
// NO ORANGE-LESS STRETCH: the A-formation's blob is in frame to f47 and the
// person-flock's tail arrives at f26, so there are agents on screen on every one
// of the 93 frames, and both flocks are in frame together over f26-47.
//
// Measured motion energy (mean absolute frame difference, the preview at
// 270x480 grey): mean 3.72, min 1.50 (f92), max 5.52, weakest six-frame block
// 1.60 = 43% of the mean, matching GoodTrajectory's 43%.
//
// ---------------------------------------------------------------------------
// CAMERA. Its own keyed track — knots on one monotone cubic Hermite
// (Fritsch-Carlson, so the track cannot overshoot a knot and reverse), one key
// per frame, cy taken off the EASED k so the framing and the zoom settle
// together — pushed through the shared damper, and PRE-ROLLED PRE frames so it
// is already travelling on f0 (the cut opens mid-flight; a damper started at f0
// begins at rest and that measured 3.20 px/f^2 in the first frames). x never
// pans: at k 1.300 the frame is 831 world px wide and the winding only reaches
// +-122, so chasing it sideways would be the camera following the wiggle.
// `sway` is the only hand on x.
//
//   RISE   the knots are the HEAD's own y at a screen target — 900 (f0), 970
//          (f12), 1050 (f26), 1190 (F_MID 40) — then on to C_END (f86) and past
//          it. Measured, the damped content centre runs 1780 (f0), 1658 (f12),
//          1499 (f26), 1289 (f40), 1116 (f56), 1043 (f66), 978 (f77), 942 (f84),
//          898 (f93): monotone, never still, decelerating as the head does.
//   ZOOM   k 1.300 -> 1.308 (f12) -> 1.328 (f26): the creep tightens
//          k 1.328 -> K_MID 1.26 (f40) -> K_END (f86): ONE opening — 1.180 at
//                    f56, 1.105 at f66, 1.024 at f77
//          k        -> K_END - TAIL_DK (f109): still easing at f93 (0.936)
//
// The f0 AND last key of each channel are SOLVED at module scope so the DAMPED
// camera reads exactly K_OPEN and the opening centre on f0 despite the pre-roll,
// and K_WIDE_CUT / C_WIDE on RESOLVED_F (measured 0.9680 and 931.6 against
// 0.968 and 936.0, the difference being `sway`'s own 5 px hand).
//
// Measured on nine world probes at the EXTREMES of the picture: max |dv| 1.356
// px/f^2 at f30 against the set's 2.5 budget, peak |v| 24.0 screen px/f at f37
// against the 45 ceiling. The fastest thing in the piece is the head at 23.9
// screen px/f (f10).
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//  * THE CORRIDOR IS 1000, NOT 1500, AND THERE ARE SIX BARS, NOT SEVEN — the
//    director's revision, because the first cut of this piece could only hold
//    both ends of a 1500 px corridor at k 0.68, where `person.png` was 80 screen
//    px, an agent 10.9, the stroke 4.4, and the live head sat at y 1343 on top of
//    the captions. The corridor is what pays for k: at 1000 the resolved frame
//    runs from the arrow tip at screen 204 to the head at 1154 — 950 screen px
//    for 981 world px — so K_WIDE_CUT = 0.968 and `person.png` is 114.2 screen
//    px, an agent 15.5, the stroke 6.29, a bar 310-407 and the seat ring 151.
//  * THE END FRAMING IS NOT "EVERYTHING". It holds, top to bottom: the arrow tip
//    (204), the person's ring (351), the loose deep flock (545-777), the two bars
//    still ahead (887 and 1075), the dashed guide, and the head mid-swerve at
//    1154 with its winding trail running on below it — b4 at 1250, b3 at 1438,
//    b2 1564, b1 1661, the A-seat's ring 1753. The A-formation's blob is out of
//    frame from f47. Nothing LIVE is below screen 1300 after f40: the head's
//    worst is 1188 (f61), b4's wipe finishes at f57.5 at screen ~1160 and b5's
//    runs at ~1075.
//  * THE SWERVE IS SOLVED OFF THE SPACING, and APEX_K is raised 0.42 -> 0.68 so
//    the widest apex (b4 and b5, between the corridor's three biggest gaps) is
//    122.4 world px = 118.5 screen px at K_WIDE_CUT, inside the director's
//    110-140 band. The cost is the slant: the route reaches 63.9 degrees off
//    vertical mid-crossing, against 51.6 before. That IS the detour being
//    obvious; the head's own speed there is 11.5 world px/frame, nowhere near
//    the cap.
//  * THE LINKS ARE PINNED BELOW alignShared's OWN IDLE RUNG, at LINK_OP 0.3, with
//    a LOCAL multiplier (LINK_MUL = LINK_OP / LINK_IDLE) passed as each `Link`'s
//    `opacity`. No exported value is touched. Before this the destination read as
//    a wire scribble — the links outshone the comets.
//  * THE HUNTING IS A SWING, NOT A FAN. A static spread of headings is a fan; the
//    director's note was that the +-28 deg has to be SEEN happening at the final
//    k. Each comet now swings the full amplitude on its own hashed 40-70 frame
//    period and phase (HUNT_P0), sweeping its whole range every 20-35 frames.
//  * THE BLOB IS 200 x 120, NOT alignShared's 350 x 310, and SEAT_GAP_CUT is
//    BLOB_RY + SEAT_STANDOFF 122 rather than the shared 540. BLOB_RX/RY and the
//    gap are `buildFormation` PARAMETERS and the arrow-tip-to-flock-tail height
//    is the whole vertical budget: ARROW_LEN + SEAT_GAP_CUT + BLOB_RY + DOT_R =
//    600 world px, and every px of it comes straight off K_WIDE_CUT. 200 x 120
//    holds 32 comets at 46 world px of spacing — slightly TIGHTER than the shared
//    blob's 59 — so the flock reads as a crowd rather than a scatter, and every
//    SHARED SIZE (the dot, the stroke, the seat ring, the person, the arrow) is
//    untouched.
//  * THE "A" SITS BESIDE THE RING, not under it. SEAT_STANDOFF is spent down to
//    the minimum, so the ring's bottom edge is only 44 world px above the blob's
//    nominal top and a feathered seat can sit 20 px inside that: there is no
//    62 px for a label there. Beside the ring it costs nothing of the budget and
//    still reads as a tag on the seat (measured at f0: screen x 387, y 1040-1092,
//    with the ring's left edge at 439).
//  * NO ARROW ON THE A-SEAT, and NO SEAT-TO-AGENT LINKS on either formation. The
//    route leaves the A-ring's top edge going straight up, which is exactly where
//    that arrow would be drawn. The seat links are in the clip's vocabulary and
//    not in this cut's brief, and rendered they were long white strings that made
//    each seat read as a balloon tethered to its crowd.
//  * THE GUIDE IS AT THE FULL STROKE, not a thread's half: at THREAD_W it
//    measured 2.1 screen px on the first cut's resolved frame and the straight
//    line the whole reading test turns on was the faintest thing in the picture.
//    Dashed against the route's solid is what separates them, and it is the
//    clip's own grammar — the direct route is the one that does not exist. Its
//    dashes march at 3 x MARCH_W because at the shared 0.6 world px/frame a
//    1000 px line advances under one dash period over the whole cut.
//  * THE BARRIERS STAY INK_HI ONCE PASSED. The brief says they stand at INK_LO
//    and draw up as the head nears; it does not say they go back down, and
//    leaving them up is the only thing in the picture that accumulates — on the
//    resolved frame four bars are bright behind the head and two are still dim
//    ahead, which is "a lot of reasons" as a fact rather than as a caption.
//  * THE HEAD'S SPEED IS SCHEDULED ON VERTICAL PROGRESS, not on arc length, and
//    "slowing into each and recovering after" falls out of that for free: the
//    route's slope is zero at every bar and up to 2.04 mid-crossing, so the
//    head's real speed is at its minimum exactly where it comes alongside a bar
//    and over twice that where it crosses between two. No dip is keyed anywhere.
//  * THE HEAD'S SCREEN SPEED DIPS TO 0.80 px/f AROUND f61, where the camera's own
//    rise and zoom-out momentarily cancel its 5.4 world px/frame. Its WORLD speed
//    never drops below 5.21 and the rest of the frame is sliding past it at
//    10-20 screen px/f, so it reads as the camera landing on the head rather than
//    as a stall; moving the camera's turnaround off it (F_MID 34) costs |dv|
//    3.531, over the budget, so it stays.
//  * THE TAIL IS NOT A HOLD — see TAIL_DK. The line is "it does not arrive", so
//    the pull-back keeps easing out past RESOLVED_F and is still moving on f93.
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
    end: z.number(), // speech ends; tail to 93
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

/** The blob, and the seat's standoff above it — see DEVIATIONS. */
export const BLOB_RX_CUT = 200;
export const BLOB_RY_CUT = 120;
/** The air between the blob's top edge and the seat's CENTRE. It is the only
 *  slack in the vertical budget and it is spent down to the minimum: the ring's
 *  own radius (78), the 20 px a feathered seat can sit outside the nominal edge,
 *  and 24 px of air. Every px added here comes straight off K_WIDE_CUT. */
export const SEAT_STANDOFF = 122;
export const SEAT_GAP_CUT = BLOB_RY_CUT + SEAT_STANDOFF;
export const N_AGENTS = 32;
/** The person-formation's headings are loose over this half-angle. */
export const LOOSE_DEG = 28;
/** How live each formation's agent links are. The A-formation is the tightly
 *  aligned one, so its links are lit and its traffic is at full rate; the
 *  person-formation's are idle, because nothing has reached it. 0.8 rather than
 *  1.0 on the A side is measured, not taste: 50 links at LINK_LIVE 0.95 across
 *  32 comets at k 1.300 rendered as a lattice laid over the flock and the crowd
 *  read as a molecule. */
/** WHERE THE LINKS SIT. On the director's note that the destination flock read
 *  as a wire scribble — the links outshone the comets. Both formations' links
 *  are pinned at LINK_OP, which is BELOW `alignShared`'s own idle rung, using a
 *  LOCAL multiplier: `Link` multiplies its idle/live rung by `opacity`, so the
 *  multiplier that lands an idle link on LINK_OP is LINK_OP / LINK_IDLE. No
 *  exported value is touched. The comets are then the brightest orange thing in
 *  the frame, which is what the clip's grammar wants — the agents are the
 *  subject, the links are how they are wired.
 *
 *  Both formations get the SAME balance, so what separates them is what the
 *  clip says separates them: TONE (ripe / deep) and HEADING (tight / hunting). */
export const LINK_OP = 0.3;
export const LINK_MUL = LINK_OP / LINK_IDLE;
/** THE HUNTING. A static fan of +-28 deg headings is a fan, not hunting, and at
 *  K_WIDE_CUT it read as a scribble that happened to be untidy. Each comet in
 *  the person-formation now SWINGS the full amplitude on its own hashed period
 *  and phase, so the flock is visibly casting about for a heading it has not
 *  found. At 28 deg over a 40-70 frame period a comet's tail tip travels ~1.4
 *  world px/frame and sweeps its whole range in half a period, i.e. 20-35
 *  frames: slow enough to be hunting, fast enough to be seen. */
export const HUNT_P0 = 40;
export const HUNT_P1 = 70;
/** How far LEFT of the A-seat's ring the "A" sits, to the text's centre. It is
 *  beside the ring and not under it because the vertical budget has no 62 px to
 *  spare there (see SEAT_STANDOFF): the ring's bottom edge is 44 px above the
 *  blob's nominal top and a feathered seat can sit 20 px inside that. Beside the
 *  ring it costs nothing and still reads as a tag on the seat. */
export const LABEL_SIDE = SEAT_R + 40;

export const A_CENTRE = { x: AXIS, y: 2200 };
export const A_SEAT = { x: AXIS, y: A_CENTRE.y - SEAT_GAP_CUT };
/** The route and the guide both leave the A-seat's ring at its top edge. */
export const ROUTE_Y0 = A_SEAT.y - SEAT_R;
/** The CLEAR CORRIDOR between the A-seat's ring and the person-flock's tail.
 *  1000, not the first cut's 1500: at 1500 the resolved frame could only hold
 *  both ends at k 0.68, where the destination was an 11 px-agent scribble under
 *  a postage-stamp person and the live head sat on the captions at y 1343. The
 *  corridor is what pays for k. */
export const GUIDE_LEN = 1000;
export const ROUTE_Y1 = ROUTE_Y0 - GUIDE_LEN;
/** ...which is the person-flock's near edge, a dot's radius clear of it. */
export const P_CENTRE = { x: AXIS, y: ROUTE_Y1 - DOT_R - BLOB_RY_CUT };
export const P_SEAT = { x: AXIS, y: P_CENTRE.y - SEAT_GAP_CUT };
export const ARROW_TIP_Y = P_SEAT.y - ARROW_LEN;

// ---------------------------------------------------------------------------
// THE BARRIERS. `u` is the fraction of the corridor; `side` is which side the
// bar LEAVES OPEN. The apex the route has to reach to get round that open end
// is solved off the SPACING rather than chosen — a bar squeezed between two
// close neighbours gets a smaller swerve, because the route's peak slope over a
// crossing is 1.5 * (apex_i + apex_j) / gap and a 60-degree zigzag between two
// bars 135 px apart reads as a stunt. The bar's OVERHANG past the guide is then
// the apex less the clearance the head needs, so the open end always sits just
// inside the swerve and going round the far end is always visibly longer.
// ---------------------------------------------------------------------------
/** A bar's length, world px end to end. It GROWS down the corridor, for the
 *  same reason the spacing opens out: the near bars are seen at k 1.3 and a
 *  300 px one is already 390 screen px there, while the far ones are only ever
 *  seen at K_WIDE_CUT and a 300 px bar is 204 px in a 1080 frame. Sized so the
 *  widest end at the opening zoom still lands inside the caption-safe x band
 *  (measured: b2's far end, screen x 920 of the 970 ceiling). */
export const BAR_L0 = 320;
export const BAR_L1 = 420;
export const N_BARS = 6;
export const barLen = (i: number) => BAR_L0 + ((BAR_L1 - BAR_L0) * i) / (N_BARS - 1);
/** head radius + half the bar's stroke + air. */
export const BAR_CLEAR = 22;
/** The swerve. APEX_K is raised from 0.42 on the director's note that the detour
 *  must be OBVIOUS against the straight guide at the final k: it puts the widest
 *  apex (b5, between the corridor's two biggest gaps) at 124.8 world px, i.e.
 *  118.6 screen px at K_WIDE_CUT, inside the briefed 110-140 band. The apex is
 *  still solved off the SPACING, so the bars 95-100 px apart at the bottom get
 *  the small swerves and the ones with room get the big ones. */
export const APEX_MAX = 132;
export const APEX_MIN = 40;
export const APEX_K = 0.68;
/** How far before a bar the head is when that bar starts drawing up, and how
 *  far the head travels while it does — both in world px of the head's own
 *  vertical progress, so the wipe is derived from the visible thing. */
export const BAR_LEAD_D = 110;
export const BAR_WIPE_D = 65;

const BAR_U = [0.095, 0.195, 0.325, 0.52, 0.7, 0.895];
const BAR_SIDE = [1, -1, 1, -1, 1, -1];

export type Barrier = {
  /** vertical progress along the corridor, world px from ROUTE_Y0 */
  u: number;
  y: number;
  side: number;
  apex: number;
  /** how far past the guide the open end reaches */
  g: number;
  /** end to end, world px */
  len: number;
  /** the closed end and the open end, in world x */
  x0: number;
  x1: number;
};

export const BARRIERS: Barrier[] = (() => {
  const u = BAR_U.map((f) => f * GUIDE_LEN);
  return u.map((ui, i) => {
    const before = ui - (i === 0 ? 0 : u[i - 1]);
    const after = (i === u.length - 1 ? GUIDE_LEN : u[i + 1]) - ui;
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
})();

// ---------------------------------------------------------------------------
// THE ROUTE. x as a function of the head's vertical progress u: a chain of
// smoothsteps through the apexes, which is C1 by construction (zero lateral
// slope at every control point) and never has a straight stretch — so the solid
// route is bending everywhere and the dashed guide it is measured against is
// the only straight line in the frame. Two bars that leave the SAME side open
// give a near-plateau rather than a wiggle, which is the head staying on that
// side; that is where "to translate directly" sits, and it is why the camera
// has the second gesture to itself.
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

/** The route as an SVG path from the A-ring to vertical progress `u`. */
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
// THE HEAD'S SCHEDULE, as VERTICAL progress. One decaying rate, integrated: it
// is already travelling at f0 (U_START of the route is drawn), it eases from
// 13.6 to 6.6 world px/frame of climb, and it never pauses. Solved against the
// three landmarks the brief fixes: barriers 1-3 passed by ~f40, barrier 4 at
// ~f70, and 55% of the corridor at f93.
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
/** The frame the head's vertical progress first reaches `u`. */
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

// ---------------------------------------------------------------------------
// THE RESOLVED FRAMING. The A-formation's blob is out of frame (see
// DEVIATIONS), so the box that has to fit the caption-safe band runs from the
// person's arrow tip down the corridor, and K_WIDE_CUT is the largest zoom that
// still holds the destination, the four bars still ahead and the head inside it
// with `person.png` over the brief's 70 screen px floor.
// ---------------------------------------------------------------------------
export const K_WIDE_CUT = 0.968;
export const K_OPEN = 1.3;
export const K_CREEP = 1.33;
/** The frame the resolved framing is solved on. */
export const RESOLVED_F = 86;
/** The zoom's knot half way down the pull-back. It is also what carries the
 *  A-formation out of the bottom of the frame by f45. */
export const K_MID = 1.26;
export const BAND = { y0: 200, y1: 1400 };

/** The content centre that puts the arrow tip EXACTLY on BAND.y0. The end
 *  framing is no longer "everything": it holds the arrow tip at 200, the ring,
 *  the loose deep flock, the two bars still ahead, the guide and the head
 *  mid-swerve at 1149 with its winding trail running on below — and whatever is
 *  further down (bars 1-3, the A-seat, its flock) simply leaves the bottom.
 *  Those two ends are what fix K_WIDE_CUT: 950 screen px for the 981 world px
 *  between them. */
export const C_WIDE = ARROW_TIP_Y - (BAND.y0 - 835) / K_WIDE_CUT;

// ---------------------------------------------------------------------------
// THE CAMERA. Knots on one monotone Hermite, one key per frame, cy off the
// eased k, through the shared damper. The last key of each channel is SOLVED so
// the DAMPED camera reads exactly (K_WIDE_CUT, C_WIDE) on RESOLVED_F.
// ---------------------------------------------------------------------------
const TRACK_F1 = DURATION + 16;
const F_CREEP = 26;
/** The cut OPENS MID-FLIGHT, so the camera has to be travelling on f0. A damper
 *  started at f0 begins at rest, and with a track already moving at 17 world
 *  px/frame that is an acceleration spike in the first frames — measured before
 *  this, 3.20 px/f^2 at f3 against the set's 2.5 budget, and visible as a lurch
 *  on the edit. The track is therefore extended PRE frames BACKWARDS along its
 *  own opening slope and the damper is run from there, so by f0 it is up to
 *  speed. The f0 knots are then SOLVED (below) so the damped camera still reads
 *  exactly the opening framing on f0 despite the lag. */
const PRE = 18;
/** THE TAIL IS NOT A HOLD. Measured on the first cut of this piece, the mean
 *  absolute frame difference fell from 4.97 at f37 to 0.42 at f92 and the
 *  weakest six-frame block was 19% of the cut's mean — the camera landed, the
 *  head slowed and the pull-back had made everything small, so the last fifteen
 *  frames were nearly dead. The line itself says the cut must not resolve ("it
 *  does not arrive"), so the glide keeps going: the last knot carries the
 *  pull-back's OWN direction on past the frame the framing is solved on, and
 *  the camera is still easing out on the last frame. */
const TAIL_DK = 0.055;
const TAIL_DC = 80;

/** frame -> index into the key arrays. */
const idx = (f: number) => f + PRE;

const F_MID = 40;
const KF = [-PRE, 0, 12, F_CREEP, F_MID, RESOLVED_F, TRACK_F1];
const K_F12 = 1.311;

/** The RISE's knots are not written down, they are the HEAD's own position with
 *  a screen target: the camera follows the head from screen 900 on f0 down to
 *  1150 by F_MID, which it then holds to the end (the resolved head reads 1149).
 *  That slow 250 px settle is also what carries the A-formation out of the
 *  bottom of the frame — measured, its blob's top edge leaves at f45 — and it
 *  is what keeps the only live thing in the second half well above the
 *  captions. */
/** SOLVED, not chosen: F_MID's screen target is the one lever on WHEN the
 *  destination arrives and WHEN the A-formation leaves, because the head's
 *  screen position and the camera's centre are the same number read two ways
 *  (c = head - (screen - 835) / k, so a head LOWER in frame is a camera centred
 *  HIGHER in the world, showing more of what is above). Swept 1060 / 1090 /
 *  1120 / 1150 / 1190 / 1230 / 1270: at 1190 the person's ring crosses the top
 *  edge at f55 and the arrow tip at f67 — the director's f56 and f66 — the
 *  A-formation's blob is out of frame by f47, the head never goes below screen
 *  1188, and |dv| is 1.356 against the 2.5 budget. 1230 buys four frames on the
 *  A-flock's exit and costs the head 35 px toward the captions. */
const RISE_SCREEN: [number, number, number][] = [
  [0, 900, K_OPEN],
  [12, 970, K_F12],
  [F_CREEP, 1050, K_CREEP],
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

/** The damper is a linear filter, so every key it reads is affine in what it
 *  reads out and one secant per key is EXACT. k does not depend on the centre,
 *  so it goes first; and the f0 knot's own segment only reaches the f12 knot, so
 *  the opening is independent of the f84 key and can be solved on its own. */
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
export const C_END = solve(C_WIDE, (cEnd) => cReadAt(RESOLVED_F, C_0, cEnd), C_WIDE - 300, C_WIDE + 300);

export const CAM = (() => {
  const c = cTrack(C_0, C_END, K_TRACK);
  return { F: c.F, CY: c.CY, K: K_TRACK };
})();

/** The camera at every frame, sway included — what every check is solved on. */
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
// THE GRID. Everything in the cut co-moves along the formations' mean heading
// (H_USER, straight up) and the camera tracks it, so on screen the formations
// HOLD and the ground has to run. `travel` is that world offset; adding it to
// the world AND to the camera is the same thing on screen as adding it to
// neither, EXCEPT for the grid, which reads the camera's cy — so it is added
// exactly there and the layout stays in the co-moving frame it is written in.
//
// `cyRest` is NOT f0's value: the cut's cy travels 1280 world px of camera plus
// 744 of world travel, and measuring the parallax from f0 puts the background's
// worst offset at 403 screen px against the 602 px of slack BG_OVERSIZE leaves
// at K_WIDE_CUT. Measuring it from the middle of the range halves that. Solved,
// not chosen: GRID_REST minimises the worst |bgY| over every frame.
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
// THE TWO FORMATIONS. Same shape, same density, same links; what differs is
// what the brief says differs — the tone, the spread of the headings, and how
// live the links are. Nothing else about them is keyed: they fly for 93 frames.
// ---------------------------------------------------------------------------
const FORM_A = buildFormation({ n: N_AGENTS, seed: 4, rx: BLOB_RX_CUT, ry: BLOB_RY_CUT });
const FORM_P = buildFormation({ n: N_AGENTS, seed: 9, rx: BLOB_RX_CUT, ry: BLOB_RY_CUT });

// NO SEAT-TO-AGENT LINKS. They are in the clip's vocabulary and they are NOT in
// this cut's brief, and rendered they were three long white strings from each
// ring down to its blob: the seat stands SEAT_GAP_CUT clear of the blob's head,
// so at this cut's zooms those links are 250-340 world px long and the seat read
// as a balloon tethered to the crowd. On the A-seat they also crossed the "A"
// label. The seat leading its blob with air between them is the same fact with
// nothing drawn.

export type Agent = { x: number; y: number; r: number; heading: number };

export const agentsOf = (
  form: typeof FORM_A,
  centre: { x: number; y: number },
  frame: number,
  loose: number,
): Agent[] =>
  form.seats.map((s) => {
    const w = wanderOf(s, frame);
    const p = formationAt({ x: s.x + w.dx, y: s.y + w.dy }, centre, H_USER);
    // THE HUNTING, not a fan: the full +-`loose` amplitude on this seat's own
    // hashed period and phase, so the flock is visibly casting about for a
    // heading it has not found. `loose` 0 is the A-formation, which is tight on
    // -90 and carries only the shared +-3 deg jitter.
    const period = HUNT_P0 + (HUNT_P1 - HUNT_P0) * hash(s.i, 82);
    const hunt =
      loose === 0
        ? 0
        : ((loose * Math.PI) / 180) *
          Math.sin((TWO_PI * frame) / period + hash(s.i, 81) * TWO_PI);
    return { x: p.x, y: p.y, r: s.r, heading: H_USER + hunt + w.da };
  });

// ---------------------------------------------------------------------------

const TranslateDirectly: React.FC<Props> = ({
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

  // -- camera ---------------------------------------------------------------
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

  const agA = agentsOf(FORM_A, A_CENTRE, frame, 0);
  const agP = agentsOf(FORM_P, P_CENTRE, frame, LOOSE_DEG);

  const svgStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "visible",
  };

  const formation = (form: typeof FORM_A, ag: Agent[], tone: number, key: string) => (
    <g key={key}>
      {form.links.map(([i, j], n) => (
        <Link
          key={`${key}l${n}`}
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
          key={`${key}c${i}`}
          x={a.x}
          y={a.y}
          heading={a.heading}
          r={a.r}
          tone={tone}
          tipMul={tone > 0.5 ? TIP_TIGHT : TIP_LOOSE}
        />
      ))}
    </g>
  );

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
            {/* THE GUIDE: the direct route. Dashed, marching toward the
                destination, at INK_LO because it is the thing that cannot be
                taken — and at the set's ONE stroke weight rather than at a
                thread's half, because it is a path and not a link, and because
                at THREAD_W it measured 2.1 screen px on the resolved frame and
                the straight line the winding one is judged against was the
                faintest thing in the picture. Dashed against the route's solid
                is what separates them. */}
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

            {/* THE BARRIERS: standing at INK_LO, drawing up to INK_HI from the
                guide outwards as the head nears. Both ends move at their own
                length's rate, so they finish together. */}
            {BARRIERS.map((b, i) => {
              const t = barBright(b, frame);
              return (
                <g key={`b${i}`} style={{ filter: icon }}>
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

            {formation(FORM_P, agP, 0, "p")}
            {formation(FORM_A, agA, 1, "a")}
          </svg>

          {/* the person-formation's seat: a real person, and the arrow is what
              they want. Nothing has reached it in this cut. */}
          <UserSeat k={k} x={P_SEAT.x} y={P_SEAT.y} frame={frame} occupant="person" arrow={1} />
          {/* the A-formation's seat: AGENT A in the user's ring. No arrow — the
              route leaves this ring's top edge and the two would read as one
              line. */}
          <UserSeat
            k={k}
            x={A_SEAT.x}
            y={A_SEAT.y}
            frame={frame}
            occupant="agent"
            arrow={0}
          />
          {/* "A". Drawn here rather than through `UserSeat`'s own label so it
              sits at INK_HI — it names the subject of the opening frame, not a
              piece of context — and placed BESIDE the ring rather than under it,
              because the vertical budget has no room under it (SEAT_STANDOFF).
              It slides up 24 px and fades in over f0-10, landing on "a LOT of
              REASONS", and it is the only text in the cut. */}
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
            {/* THE SPINE: the winding route, solid, on top, fully opaque. */}
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
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default TranslateDirectly;

// ---------------------------------------------------------------------------
// The numbers the cut is built on, exported so they are measured, not asserted.
// ---------------------------------------------------------------------------
/** The probes are the EXTREMES of the picture, not its middle: a camera move's
 *  screen speed grows with the distance from the centre, so the honest numbers
 *  come off the corners of the content — the A-seat and its label at the bottom,
 *  the arrow tip at the top, and the widest bar ends. */
const probeSpeeds = () => {
  const probes: [number, number][] = [
    [AXIS, ARROW_TIP_Y],
    [AXIS, P_CENTRE.y + BLOB_RY_CUT],
    [AXIS, ROUTE_Y0],
    [AXIS - LABEL_SIDE, A_SEAT.y],
    [AXIS, A_CENTRE.y + BLOB_RY_CUT],
    [BARRIERS[0].x0, BARRIERS[0].y],
    [BARRIERS[N_BARS - 1].x0, BARRIERS[N_BARS - 1].y],
    [AXIS - BLOB_RX_CUT, P_CENTRE.y],
    [AXIS + BLOB_RX_CUT, A_CENTRE.y],
  ];
  let maxV = 0;
  let atV = 0;
  let maxAny = 0;
  let atAny = 0;
  let maxA = 0;
  let atA = 0;
  for (const [px, py] of probes) {
    const p: number[][] = [];
    for (let f = 0; f <= DURATION; f++) p.push(screenAt(f, px, py));
    // ...and only on the frames the probe is actually ON SCREEN. The set's
    // 45 px/frame ceiling is about what a viewer can follow; a world point the
    // pull-back has already thrown off the bottom of the frame is not being
    // followed by anyone. Both numbers are reported.
    for (let f = 1; f <= DURATION; f++) {
      const v = Math.hypot(p[f][0] - p[f - 1][0], p[f][1] - p[f - 1][1]);
      const seen = (g: number) => p[g][1] >= -40 && p[g][1] <= FRAME_H + 40;
      if (v > maxAny) {
        maxAny = v;
        atAny = f;
      }
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
    atVOffFrame: atAny,
    maxA: Number(maxA.toFixed(3)),
    atA,
  };
};

const headSpeeds = () => {
  let maxS = 0;
  let atS = 0;
  let minS = Infinity;
  let atMinS = 0;
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
    if (s > maxS) {
      maxS = s;
      atS = f;
    }
    if (s < minS) {
      minS = s;
      atMinS = f;
    }
  }
  return {
    maxScreen: Number(maxS.toFixed(2)),
    atMaxScreen: atS,
    minScreen: Number(minS.toFixed(2)),
    atMinScreen: atMinS,
    maxWorld: Number(maxW.toFixed(2)),
    minWorld: Number(minW.toFixed(2)),
  };
};

/** The lowest white ink on screen at frame f: the A-seat's ring, which is the
 *  bottom of the picture until it leaves the frame. The "A" now sits beside the
 *  ring rather than under it, so the ring's own bottom edge is the floor. */
const lowestInk = (f: number) =>
  Math.max(
    screenAt(f, A_SEAT.x, A_SEAT.y + SEAT_R)[1],
    screenAt(f, A_SEAT.x - LABEL_SIDE, A_SEAT.y + LABEL_SIZE / 2)[1],
  );

export const STATS = {
  duration: DURATION,
  world: {
    aCentre: A_CENTRE.y,
    aSeat: A_SEAT.y,
    routeY0: ROUTE_Y0,
    routeY1: ROUTE_Y1,
    pCentre: P_CENTRE.y,
    pSeat: P_SEAT.y,
    arrowTip: ARROW_TIP_Y,
    guideLen: GUIDE_LEN,
    blob: [BLOB_RX_CUT, BLOB_RY_CUT],
    seatGap: SEAT_GAP_CUT,
    agents: [FORM_A.seats.length, FORM_P.seats.length],
    links: [FORM_A.links.length, FORM_P.links.length],
  },
  barriers: BARRIERS.map((b, i) => ({
    i: i + 1,
    u: Number(b.u.toFixed(1)),
    side: b.side > 0 ? "open right" : "open left",
    apex: Number(b.apex.toFixed(1)),
    len: Number(b.len.toFixed(1)),
    overhang: Number(b.g.toFixed(1)),
    passedAtF: Number(frameAtU(b.u).toFixed(1)),
    wipeF: [
      Number(frameAtU(b.u - BAR_LEAD_D).toFixed(1)),
      Number(frameAtU(b.u - BAR_LEAD_D + BAR_WIPE_D).toFixed(1)),
    ],
    brightAt93: Number(barBright(b, DURATION).toFixed(2)),
  })),
  /** peak |dx/du| over each stretch: the route's slant, in degrees off vertical */
  maxSlantDeg: (() => {
    let m = 0;
    for (let v = 0; v <= GUIDE_LEN; v += 1) {
      m = Math.max(m, Math.abs(offAt(v + 0.5) - offAt(v - 0.5)));
    }
    return Number(((Math.atan(m) * 180) / Math.PI).toFixed(1));
  })(),
  maxOffWorld: Number(
    Math.max(...Array.from({ length: GUIDE_LEN }, (_, v) => Math.abs(offAt(v)))).toFixed(1),
  ),
  head: {
    uAt: [0, 4, 8, 20, 29, 40, 47, 59, 66, 77, 84, 93].map((f) => [f, Number(uHead(f).toFixed(1))]),
    fracAt93: Number((uHead(DURATION) / GUIDE_LEN).toFixed(3)),
    /** where in the b4 -> b5 crossing the head is on the last frame */
    crossAt93: Number(
      ((uHead(DURATION) - BARRIERS[3].u) / (BARRIERS[4].u - BARRIERS[3].u)).toFixed(2),
    ),
    ...headSpeeds(),
  },
  camera: {
    kEnd: Number(K_END.toFixed(4)),
    cEnd: Number(C_END.toFixed(1)),
    cWide: Number(C_WIDE.toFixed(1)),
    kAt: [0, 12, 26, 40, 56, 66, 77, 84, 93].map((f) => [f, Number(camAt(f).k.toFixed(3))]),
    cAt: [0, 12, 26, 40, 56, 66, 77, 84, 93].map((f) => [
      f,
      Number((camAt(f).cy - CAM_LIFT / camAt(f).k).toFixed(1)),
    ]),
    kAtResolved: Number(camAt(RESOLVED_F).k.toFixed(4)),
    cAtResolved: Number(
      (camAt(RESOLVED_F).cy - CAM_LIFT / camAt(RESOLVED_F).k).toFixed(1),
    ),
    ...probeSpeeds(),
    gridRest: Number(GRID_REST.toFixed(1)),
    worstBgY: (() => {
      let m = 0;
      for (let f = 0; f <= DURATION; f++) {
        m = Math.max(
          m,
          Math.abs(-(gridCyAt(f) - GRID_REST) * camAt(f).k * PARALLAX - f * 0.3),
        );
      }
      return Number(m.toFixed(0));
    })(),
  },
  /** screen sizes at the two ends of the pull-back */
  screenSizes: [0, RESOLVED_F].map((f) => {
    const kk = camAt(f).k;
    return {
      f,
      k: Number(kk.toFixed(3)),
      person: Number((118 * kk).toFixed(1)),
      agentD: Number((2 * DOT_R * kk).toFixed(1)),
      stroke: Number((STROKE_W * kk).toFixed(2)),
      barL: [BAR_L0, BAR_L1].map((L) => Number((L * kk).toFixed(0))),
      seatD: Number((2 * SEAT_R * kk).toFixed(0)),
    };
  }),
  /** the resolved frame, as screen y of everything in it */
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
    aBlobTop: Number(screenAt(RESOLVED_F, AXIS, A_CENTRE.y - BLOB_RY_CUT)[1].toFixed(0)),
  },
  openScreen: {
    head: Number(screenAt(0, routeAt(U_START).x, routeAt(U_START).y)[1].toFixed(0)),
    aRing: [
      Number(screenAt(0, AXIS, A_SEAT.y - SEAT_R)[1].toFixed(0)),
      Number(screenAt(0, AXIS, A_SEAT.y + SEAT_R)[1].toFixed(0)),
    ],
    aLabel: [
      Number(screenAt(0, AXIS - LABEL_SIDE, A_SEAT.y - LABEL_SIZE / 2)[1].toFixed(0)),
      Number(screenAt(0, AXIS - LABEL_SIDE, A_SEAT.y + LABEL_SIZE / 2)[1].toFixed(0)),
      Number(screenAt(0, AXIS - LABEL_SIDE, A_SEAT.y)[0].toFixed(0)),
    ],
    aBlobTop: Number(screenAt(0, AXIS, A_CENTRE.y - BLOB_RY_CUT)[1].toFixed(0)),
    /** the bar nearest the top edge that is visible at f0 */
    barsVisible: BARRIERS.filter((b) => screenAt(0, AXIS, b.y)[1] > 0).length,
    widestBarX: (() => {
      const b = BARRIERS[0];
      return [
        Number(screenAt(0, b.x0, b.y)[0].toFixed(0)),
        Number(screenAt(0, b.x1, b.y)[0].toFixed(0)),
      ];
    })(),
  },
  /** when the A-formation leaves: band = screen 1400, frame = screen 1920 */
  aExit: (() => {
    const find = (wy: number, limit: number) => {
      for (let f = 0; f <= DURATION; f++) if (screenAt(f, AXIS, wy)[1] > limit) return f;
      return -1;
    };
    return {
      labelOutOfBand: find(A_SEAT.y + LABEL_SIZE / 2, BAND.y1),
      ringOutOfBand: find(A_SEAT.y - SEAT_R, BAND.y1),
      blobOutOfFrame: find(A_CENTRE.y - BLOB_RY_CUT, FRAME_H),
      labelOutOfFrame: find(A_SEAT.y + LABEL_SIZE / 2, FRAME_H),
    };
  })(),
  lowestInk: [0, 26, 40, 66, 84, 93].map((f) => [f, Number(lowestInk(f).toFixed(0))]),
  /** THE HEAD'S OWN SCREEN y, every 8 frames, and its worst value after f40 —
   *  the "nothing live below screen 1300" check. The head is the only live thing
   *  in the second half. */
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
  /** When each part of the DESTINATION first shows at the top of the frame. */
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
