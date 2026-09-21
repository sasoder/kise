import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
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
  camEase,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  AGENT_A_SCALE,
  ARROW_LEN,
  BLOB_RX,
  BLOB_RY,
  Comet,
  DOT_R,
  FPS as ALIGN_FPS,
  H_USER,
  INK_HI,
  INK_LO,
  Label,
  LABEL_SIZE,
  Link,
  PACKET_PERIOD,
  PERSON_H,
  SEAT_GAP,
  SEAT_R,
  TIP_TIGHT,
  TWO_PI,
  LINK_IDLE,
  LINK_LIVE,
  SEP_FLOOR,
  UserSeat,
  buildFormation,
  flockWander,
  flockWanderCaps,
  formationAt,
  lerp,
  linkPackets,
  travel,
  turn,
  waveArrival,
  worldPx,
} from "./alignShared";

export const FPS = ALIGN_FPS;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Alignment`, CUT 2 — `UserIsAgentA` (in at 0:19.280):
//   "you have this, like, one agent, let's call it Agent A, and you have all
//    the other agents. What happens if you tell the other agents that the user
//    is Agent A?"
//
// DURATION. The cut starts at 19.280 s and the line ends at 24.620 s, so
//   DURATION = round((24.620 - 19.280) * 24) + 16 = 128 + 16 = 144
// — the spoken frames plus the set's 16-frame tail, which holds the unresolved
// state without ever going still.
//
// WORD ONSETS, frame = round((t - 19.280) * 24), lifted from the SRT:
//   you 0 · have 3 · this 5 · like 8 · ONE 11 · AGENT 14 · let's 20 · call 22 ·
//   it 24 · agent 26 · A 31 (ends 39) · and 39 · you 43 · have 44 · all 47 ·
//   the 48 · OTHER 50 · AGENTS 54 (ends 63) · what 63 · happens 66 · if 72 ·
//   you 74 · TELL 74 · the 79 · other 82 · agents 85 (ends 93) · that 93 ·
//   the 96 · USER 100 (ends 108) · is 108 · agent 116 · A 121 (ends 128) ·
//   tail 128-144.
// (The cut brief's table says OTHER 54; the SRT has "other" opening at 50 and
// "agents" at 54. The gestures are keyed on the SRT.)
//
// SOUND-OFF READING TEST — one sentence:
//   "one agent, named A, flies up past a loosely-following flock and takes the
//    person's place in the ring marked 'user' — and the flock starts snapping
//    into line behind it."
//
// ---------------------------------------------------------------------------
// THE WORLD. `alignShared` owns it: the formation is a feathered superellipse
// blob of 70 comets with the USER SEAT (person.png in a white ring, a white
// arrow straight up) SEAT_GAP above its centre; ORANGE is the agents and
// nothing else; ALIGNMENT IS HEADING and it always happens as a shortest-arc
// `turn` when a wave travelling through the links REACHES an agent.
//
// Everything is authored in the CO-MOVING frame — the formation's own anchor is
// fixed at FORM_C and the camera is keyed and damped in that same frame — and
// `travel(f)` is added to BOTH, exactly as `alignShared` asks. Adding the same
// vector to the world and to the camera cancels inside `worldTransform`, so it
// is added once, in arithmetic, at the one place where it does not cancel: the
// background's parallax term. The grid therefore slides under the held
// formation at PARALLAX * SLIDE_V = 2.56 screen px/frame at k 1 (the briefed
// 2-3), and no point of the world has to carry the offset.
//
// ---------------------------------------------------------------------------
// GESTURES — four, and nothing in the cut is outside this list. Each leads its
// word and overlaps its neighbour; nothing starts from a dead stop.
//
//  1. f0-39   "this ONE AGENT,   THE RIDE. Open CLOSE at k 1.85 with A ALONE
//             let's call it       at the column axis — screen (541, 805), body
//             Agent A"            40 screen px — and the flock entirely out of
//             (11/14/26/31)       frame above it: it is at 0% of the frame on
//                                 f0, 6% at f12 and 11% at f18 as A climbs
//                                 toward it. A is already travelling at f0
//                                 (0.45 of cruise; the camera is PRE-ROLLED 24
//                                 frames so it is already moving with it) up its
//                                 own single curve, weaving +-6 deg on a slow
//                                 hashed sine, and the grid slides under
//                                 everything. The LABEL "A" slides up 24 px
//                                 while fading in over f24-34 and rides beside A
//                                 for the rest of the cut.
//  2. f24-78  "and you have ALL   THE GLIDE. ONE move, BLENDED rather than
//             the OTHER AGENTS"   keyed: the target is lerp(ride, wide, camEase)
//             (39/47/50/54)       on each channel, so there is no junction
//                                 anywhere in the track — it leaves the ride at
//                                 exactly A's velocity and arrives at the column
//                                 axis with exactly zero. The camera's interest
//                                 in A decelerates to a stop over f24-46
//                                 (`sRide`) while A itself never slows: that is
//                                 "the centre slides from A to the column axis",
//                                 and it is what keeps the pan from reversing
//                                 when A climbs past the wide centre. Zoom
//                                 f26-72, pan f20-82: k 1.761 at f30 -> 1.132
//                                 at f60 -> 0.949 at f80, and the whole
//                                 formation with the seat at its head and A on
//                                 the flank is inside the caption-safe band
//                                 from f69 (see DEVIATIONS on f60).
//  3. f72-108 "TELL the other     THE CHANNEL. The five white seat-links wake
//             agents that the     (live 0 -> 1 over f72-80), and the wake
//             USER"               travels on through the agents' own accent
//             (74/85/100)         links in DISTANCE order from the ring edge
//                                 (`waveArrival`, 34.7 world px/f, +-1.5 f of
//                                 hashed jitter), reaching the back of the blob
//                                 at f95. It travels as a BAND, not a switch:
//                                 each link goes 0.30 -> 0.95 over 5 f and back
//                                 down over 12 with no hold, and settles at
//                                 0.45 behind the wave (see HOW A LINK IS
//                                 PAINTED). On "user" the label "user" slides
//                                 up beside the ring f98-108 (see DEVIATIONS).
//  4. f103-144 "is AGENT A"       THE HANDOVER. A crosses the ring's edge at
//             (108/116/121)       f103.5 and settles on the ring's centre at
//                                 f124 with its nose turned onto the arrow
//                                 (-90 deg) by the shortest arc. The person
//                                 glyph slides UP 24 px and fades out over the
//                                 four frames from that crossing — the text
//                                 entrance, reversed — and A only crosses the
//                                 glyph's feet line at f106.5, by which point
//                                 the glyph is at 0.16, so the two are never on
//                                 top of each other. The label "A" eases out to
//                                 park at the ring's right. From f122 accent
//                                 packets run OUT of the seat along the lit
//                                 links, each firing its own band through a
//                                 flock that has settled back to 0.45: A
//                                 PACKET'S ARRIVAL IS THE SNAP, so each agent it
//                                 reaches turns onto -90 deg exactly over 7 f,
//                                 ripens deep -> ripe (which lengthens its tail
//                                 with it) and its hunting drops from the loose
//                                 +-45 deg envelope to +-2. At f144, 24 of 70 have snapped, 31 are
//                                 mid-turn and 15 are untouched: the cut hands
//                                 to the speaker's "and the answer is..."
//                                 unfinished. Camera: ONE continuous slow push
//                                 from f72 to past the last frame (see THE PUSH),
//                                 k 0.949 -> 1.101, which is the brief's creep-in
//                                 and the hold's own creep as a single move.
//
// LIVENESS — mechanisms, not gestures; none is on a word and none ever stops:
//   * the grid sliding under the co-moving formation, every frame
//   * the per-agent wander (+-3.5 px, hashed phases) and the heading hunting
//     (+-8-28 deg, each on its own slow hashed period)
//   * packets on all ~150 links, idle before the wake and at full rate after
//   * A, which is moving on every frame from f0 (and hovers once docked)
//   * the camera, which never parks: a creep on the ride, one long glide, a
//     creep through the hold and a creep-in still running at f144
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the cut brief, with the arithmetic. Nothing here is a taste
// call; each one is a number that did not fit.
//
//  * K_OPEN 1.85, NOT 2.2 (the director's pick from the two measured options). The brief asks for a close open at k 2.2 AND for the
//    wide shot to hold by f60, and the set's camera budget is |dv| <= 2.5
//    px/f^2 with nothing on screen over 45 px/frame. The move is a 534 world px
//    pan and a change in k, and the pan's own acceleration term (6 * 534 / N^2,
//    times k) is 60% of the total, so the three cannot hold together: measured
//    at k 2.2 over a 34-frame window, |dv| is 3.5-4.0 and the fastest agent ON
//    SCREEN is 43-57 px/frame. Five configurations were measured
//    (scratchpad sweep): 1.60 / 1.70 / 1.85 / 2.00 / 2.20 against windows from
//    32 to 54 frames. 1.85 with the pan and the zoom on their own windows is
//    the most punch that stays inside both numbers — |dv| 2.642, fastest
//    on-screen agent 38.0 px/frame — and A's body opens at 40 screen px.
//  * THE FLOCK IS 18.6% OF THE FRAME AT f24, NOT 15%. The brief asks for it out
//    of the opening framing until the glide and under 15% through f24. Out is
//    achieved: it is at 0% on f0-3, 2% at f6, 6% at f12 and 11% at f18, because
//    A now starts 260 world px lower and opens at 0.45 of cruise over 22 frames.
//    The f24 number is what A's own climb costs — the camera rides it, so every
//    px A rises brings the flock down the frame — and buying it back is priced:
//    starting A at 1900 instead of 1780 gives 5.5% at f24 for |dv| 2.907, and
//    opening at 0.28 of cruise gives 13.7% for |dv| 3.167. Both are over the
//    2.75 the director approved, and by f24 the pan has already been running
//    four frames, so the flock arriving IS the next gesture.
//  * THE WIDE SHOT RESOLVES AT f69-78, NOT f60. Same arithmetic: a window short
//    enough to land at f58 costs |dv| 3.5+. At f60 the whole formation IS in
//    frame (k 1.132, box 237..1069 of 1080) with the arrow's tip above the band;
//    every piece of ink is inside screen y 200..1400 from f69, and the pan
//    settles on the column axis at f82 while the channel wave is running. The
//    pull-back therefore overlaps gesture 3 rather than finishing before it,
//    which is the set's own "gestures lead and overlap" rather than a stall.
//  * THE RING CROSSING IS AT f103.5, NOT f110. The brief asks for the crossing
//    at f110 and the settle at f124, 14 frames apart — but the ring is SEAT_R =
//    78 world px in radius and a settle that decelerates to zero at f124 covers
//    its last 78 px over ~20 frames, so a crossing at f110 would need A to
//    arrive at 4x its own approach speed and stop dead. What the geometry gives
//    instead lands better on the words: the person leaves the seat across
//    f103.5-107.5, which is "...that the USER" (f100-108), and A settles on
//    "is Agent A" (f108-128).
//  * THE CROSS-FADE IS FOUR FRAMES, NOT EIGHT. The brief allows <= 8 and asks
//    that A be below the glyph's feet line until the glyph is under 0.3, and
//    those two numbers fight the geometry: the ring's arc below the feet line
//    is only 28 world px deep, so a monotone approach has ~29 px of path — 3.0
//    frames at A's approach speed — between the two crossings. The first build
//    bought more by scooping UNDER the seat, and the nose flicked 49 degrees in
//    ONE frame at f104 (a comet spinning on the spot, measured). The approach
//    is a constant-curvature arc instead, whose heading is monotone by
//    construction and never turns faster than 3 deg/frame, and the fade is 4
//    frames: A crosses the feet line with the glyph at 0.156, under the 0.3.
//  * THE LABEL "user" IS ON THE RING'S LEFT SHOULDER, NOT UNDER IT. Under the
//    ring is where this cut's five white seat-links leave it; at 34 px below the
//    ring the bundle is still only ~80 px wide, so the word sat inside it and
//    read as a smudge on the wires. It is centred on the ring's own centre on
//    the one side nothing crosses, mirroring where "A" parks — "user (ring) A",
//    which is also the sentence.
//  * ONE PUSH INSTEAD OF A HOLD AND A CREEP-IN. See THE PUSH: the briefed hold
//    measured as dead air against three approved cuts of this style.
//  * THE FORMATION'S SEED IS MEASURED (8), AND n IS 70 PER THE BRIEF. Both are
//    the SET's to agree on rather than this cut's — see the note on `FORM`.
//
// THE DIRECTOR'S PASS, and the local constants cut 3 should copy:
//   1. THE WEB WAS A WIRE CAGE. Links are painted here, never in `alignShared`:
//      LINK_IDLE_OP 0.30 / LINK_REST_OP 0.45 / LINK_BAND_OP 0.95, BAND_UP 5,
//      BAND_DOWN 12, BAND_WAKE_F 8, and `linkPaint` / `linkAlpha` divide the
//      target by the module's own idle->live ramp so `Link` is used as written.
//      The traffic is drawn here too: PKT_R = 0.45 * DOT_R = 3.6 world px,
//      idle period 3.4x the module's (51 f), lit 1.7x; the wave bead is
//      0.62 * DOT_R = 4.96. A comet's head is 8, so nothing on a link can be
//      mistaken for an agent, and the comets are the brightest orange on every
//      wide frame (measured: the flock's fill is 1.0 against a link's 0.30-0.45).
//   2. LOOSE NOW LOOKS LOOSE. HUNT_ENVELOPE 45 deg, base +-22 deg static and
//      hashed, swing 15-23 deg, period 40-70 f, HUNT_TIGHT 2 deg. Measured at
//      f143: the 37 loose agents span -32.8..+41.6 deg off the arrow, the 24
//      snapped span -2.8..+2.6.
//   3. NO FUSED COMETS. `flockWander` + `flockWanderCaps` from the module's
//      added block instead of `wanderOf`, asserted on every frame over all 451
//      pairs within 160 world px: the worst separation in the cut is 2.756 mean
//      radii against the 2.6 floor.
//   4. THE OPENING. k 1.85, RIDE_OFF (-7, -10) so A sits at screen (541, 805)
//      on f0 with the flock out of frame, A's start 260 px lower and its
//      opening speed 0.45 of cruise over 22 f. Both labels reach INK_HI by the
//      time A is docked.
//
// MEASURED — `STATS` at the foot of the file computes all of it rather than
// asserting it. Motion energy (mean abs frame difference, 135x240 grey, on the
// half-res preview): mean 1.29, 6-frame blocks 1.41 -> 2.90 across the
// pull-back and 0.44-0.63 across the second half, against 0.25-4.78 for
// `1_GoodTrajectory`, 0.75-8.86 for `26_ChainOfThought_V3` and 1.16-12.4 for
// `13_IncreasinglyCapable_V2` measured the same way. No frame is still: the
// quietest camera probe still moves 0.99 screen px/frame.
// ---------------------------------------------------------------------------
export const DURATION = 144;

export const schema = z.object({
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
  agents: z.number(),
  beats: z.object({
    one: z.number(), // "one agent"
    agentA: z.number(), // "...call it Agent A"
    other: z.number(), // "all the other agents"
    tell: z.number(), // "if you tell the other agents"
    user: z.number(), // "...that the user"
    isAgentA: z.number(), // "is Agent A"
    end: z.number(), // speech ends; tail to 144
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.32,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  agents: 70,
  beats: {
    one: 11,
    agentA: 31,
    other: 50,
    tell: 74,
    user: 100,
    isAgentA: 116,
    end: 128,
  },
});

// ---------------------------------------------------------------------------
// THE LAYOUT, in co-moving world px. K_WIDE is 1, so a world px IS a screen px
// at the set's resting zoom and every number below can be read as screen px.
//
// The formation's box is the module's own: 2*BLOB_RX wide, and from the arrow's
// tip (SEAT_GAP + ARROW_LEN above the blob's centre) down to the blob's bottom
// edge, 1080 px tall. What the module's solve does not contain is the COMET
// TAILS — a comet's tip is TIP_TIGHT * 2r = 41.6 px behind its body — and the
// feather, which lets a seat sit up to half a lattice cell outside the nominal
// boundary. FORM_C is placed so the box INCLUDING the rearmost tail centres on
// world 835, and the wide camera then sits 15 px below that (C_WIDE) so the
// creep-in at the end has somewhere to go.
// ---------------------------------------------------------------------------
const CX = FRAME_W / 2; // 540
const FORM_C = { x: CX, y: 1044 };
const SEAT = { x: FORM_C.x, y: FORM_C.y - SEAT_GAP }; // (540, 504)
const ARROW_TIP_Y = SEAT.y - ARROW_LEN; // 274
const N_AGENTS = 70;

/** SEED 8, and it is measured rather than picked: with n 70 in the module's
 *  BLOB_RX x BLOB_RY the lattice leaves real holes and real stragglers, and the
 *  links to a straggler read as a stray antenna on the flock rather than as a
 *  link. Seeds 0-11 were scored on (a) seats outside the nominal superellipse,
 *  (b) links longer than 95 world px, (c) the largest hole inside the blob —
 *  the furthest a point inside it can be from any seat. Seed 8 is the only one
 *  with NO seat outside the boundary, has 3 long links against a median of 8,
 *  and its largest hole is 69 px against 69-134 across the set. The whole clip
 *  should stand on one formation, so this is a value for the set to agree on,
 *  not a private choice — see the report. */
export const FORM = buildFormation({ n: N_AGENTS, seed: 8 });
/** The seat, in formation-local coordinates: the origin is the blob's centre
 *  and -y is the head, so the seat is straight up the heading. Every wave in
 *  this cut is keyed on the distance from THIS point. */
/** THE WANDER'S PER-AGENT CAPS (director's fix 3: fused comets). `wanderOf`
 *  gives every agent an independent drift, and at this density two independent
 *  drifts can close a floor-separated gap from both sides at once — measured on
 *  this formation, a pair at 1.79 mean radii against a floor of 2.6. The set's
 *  answer, added to `alignShared` by cut 1, is a COHERENT field (the blob
 *  undulates as a body) plus a small independent drift capped per agent against
 *  its own worst neighbour. `flockWanderCaps` does that measurement once. */
const WANDER_CAPS: number[] = [];
const SEAT_LOCAL = { x: 0, y: -SEAT_GAP };
WANDER_CAPS.push(...flockWanderCaps(FORM));
const DIST = FORM.distFrom(SEAT_LOCAL);
/** THE FIVE FRONT AGENTS the seat is wired to. `buildFormation` sorts its seats
 *  head first, so `slice(0, 5)` is the five nearest the seat — but those five
 *  are all at the blob's tip (local x 111, 33, -192, 106, -8), and five white
 *  links leaving one point for one point read as puppet strings rather than as
 *  a seat wired into the front of a formation. So the five are taken from the
 *  FRONT_POOL nearest seats and SPREAD ACROSS x: sorted by x, then sampled
 *  evenly. They are still the front of the blob (all inside the nearest 14 by
 *  distance), and the fan they make now spans the head instead of converging. */
const FRONT_POOL = 14;
const FRONT: number[] = (() => {
  const pool = FORM.seats
    .map((s, i) => ({ i, x: s.x }))
    .slice(0, FRONT_POOL)
    .sort((a, b) => a.x - b.x);
  return [0, 1, 2, 3, 4].map((n) => pool[Math.round((n * (pool.length - 1)) / 4)].i);
})();

/** The formation's mean heading. The blob is loosely aligned with the person
 *  from the first frame — the agents' own headings are spread +-28 deg about it
 *  — so the MEAN is the user's own arrow, and `travel` is therefore straight up
 *  at SLIDE_V. */
const headingAt = () => H_USER;

// ---------------------------------------------------------------------------
// AGENT A'S PATH. ONE curve from below-left to the seat, rounding the blob's
// left flank: a Catmull-Rom through nine waypoints, resampled to an arc-length
// table so A's SPEED is authored separately from its SHAPE and the two cannot
// interfere. The waypoints are chosen against the superellipse: at the blob's
// mid-height its left edge is x 190, at 200 px above/below it is x 247, and
// above y 734 there is no blob at all, so the flank leg sits 40-45 px clear of
// the crowd the whole way up and the hook into the ring happens in open space.
//
// The last waypoint before the dock is ON the ring's edge (|(540,504) - it| =
// 76, against SEAT_R 78) and BELOW the person glyph's feet line (504 + 118 *
// 0.42 = 553.6), which is what lets the glyph leave before A is anywhere near
// it — see the handover.
// ---------------------------------------------------------------------------
const WAY: [number, number][] = [
  [400, 1780],
  [300, 1364],
  [212, 1200],
  [168, 1050],
  [182, 920],
  [248, 800],
  [340, 730],
  // ...and from here the approach is a CONSTANT-CURVATURE arc, solved backwards
  // from the dock: 217 world px turning 55 degrees, so the nose rotates at
  // 0.253 deg per px and never faster than 3 deg/frame. The first version of
  // this hooked under the seat to buy the glyph's cross-fade more room and the
  // nose flicked 49 degrees in ONE frame at f104 — a comet spinning on the spot.
  // An arc cannot do that: its heading is monotone by construction.
  [444, 689],
  [476, 661],
  [503, 628],
  [523, 590],
  [536, 549],
  [540, 504],
];

type Pt = { x: number; y: number; tx: number; ty: number };

const PATH = (() => {
  const p = [WAY[0], ...WAY, WAY[WAY.length - 1]];
  const pts: { x: number; y: number }[] = [];
  const SEG = 200;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    for (let j = 0; j < SEG; j++) {
      const t = j / SEG;
      const t2 = t * t;
      const t3 = t2 * t;
      pts.push({
        x:
          0.5 *
          (2 * x1 + (-x0 + x2) * t + (2 * x0 - 5 * x1 + 4 * x2 - x3) * t2 + (-x0 + 3 * x1 - 3 * x2 + x3) * t3),
        y:
          0.5 *
          (2 * y1 + (-y0 + y2) * t + (2 * y0 - 5 * y1 + 4 * y2 - y3) * t2 + (-y0 + 3 * y1 - 3 * y2 + y3) * t3),
      });
    }
  }
  pts.push({ x: WAY[WAY.length - 1][0], y: WAY[WAY.length - 1][1] });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return { pts, cum, total: cum[cum.length - 1] };
})();

/** The path at arc position `s`, with its unit tangent. Clamped at the dock end
 *  — A never leaves the curve — and EXTRAPOLATED along the opening tangent for
 *  s < 0, which is what the camera's pre-roll runs on (see the camera). */
export const pathAt = (s: number): Pt => {
  const { pts, cum } = PATH;
  const last = pts.length - 1;
  if (s < 0) {
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    const m = Math.max(1e-9, Math.hypot(dx, dy));
    return { x: pts[0].x + (dx / m) * s, y: pts[0].y + (dy / m) * s, tx: dx / m, ty: dy / m };
  }
  const target = Math.max(0, Math.min(cum[last], s));
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= target) lo = mid;
    else hi = mid;
  }
  const span = Math.max(1e-9, cum[hi] - cum[lo]);
  const u = (target - cum[lo]) / span;
  const a = pts[lo];
  const b = pts[hi];
  const tl = Math.max(0, lo - 3);
  const th = Math.min(last, hi + 3);
  const dx = pts[th].x - pts[tl].x;
  const dy = pts[th].y - pts[tl].y;
  const m = Math.max(1e-9, Math.hypot(dx, dy));
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, tx: dx / m, ty: dy / m };
};

// A's SPEED: one integrated track. It is already travelling at f0 (A_V_IN of
// cruise, so nothing starts from a dead stop), holds cruise up the flank, and
// decelerates to zero exactly at the dock — a settle, not a stop mid-air. After
// the dock the schedule adds nothing, so the arc position holds with no step in
// velocity. A_V is SOLVED so the integral is the path's own length.
const A_DOCK_F = 124;
const A_V_IN = 0.45;
const A_V_IN_F = 22;
const A_DEC_F0 = 96;
const A_DEC_P = 1;
const aShape = (f: number) =>
  (A_V_IN + (1 - A_V_IN) * smoothstep(clamp01(f / A_V_IN_F))) *
  Math.pow(1 - smoothstep(clamp01((f - A_DEC_F0) / (A_DOCK_F - A_DEC_F0))), A_DEC_P);

export const A_V = (() => {
  let sum = 0;
  for (let f = 0.5; f < A_DOCK_F; f += 1) sum += aShape(f);
  return PATH.total / sum;
})();

/** The camera's pre-roll needs A's position before f0, so the table starts
 *  CAM_PRE frames early at the opening speed and the arc position is negative
 *  there (`pathAt` extrapolates). Index 0 is frame -CAM_PRE. */
const CAM_PRE = 24;
const S_A: number[] = (() => {
  const out = [-A_V * aShape(0) * CAM_PRE];
  for (let f = 1 - CAM_PRE; f <= DURATION + 24; f++) {
    out.push(out[out.length - 1] + A_V * aShape(Math.max(0, f - 0.5)));
  }
  return out;
})();
const sA = (f: number) =>
  S_A[Math.max(0, Math.min(S_A.length - 1, Math.round(f) + CAM_PRE))];

/** Where A is, on the curve. The camera rides THIS — never the hover below —
 *  so the camera can never chase a wobble. */
export const aOnPath = (f: number) => pathAt(sA(f));

/** Once docked, A holds the seat with a slow hover of its own, so the resolved
 *  frame is not a parked dot. */
const A_HOVER = 2.5;
export const aPos = (f: number) => {
  const p = aOnPath(f);
  const h = smoothstep(clamp01((f - A_DOCK_F) / 8));
  return {
    x: p.x + A_HOVER * h * Math.sin(f * 0.07 + 0.9),
    y: p.y + A_HOVER * h * Math.sin(f * 0.053 + 2.2),
  };
};

// A's NOSE. The tangent, plus a +-6 deg weave that eases out as it comes in to
// dock, turned onto the user's arrow by the SHORTEST ARC over f112-126: A is
// the one agent that ends up aligned with the person, and it aligns the way
// every agent in this clip does.
const A_WEAVE = (6 * Math.PI) / 180;
const A_SNAP_F0 = 112;
const A_SNAP_F1 = 126;
const A_HUNT_TIGHT = (1.2 * Math.PI) / 180;
export const aSnap = (f: number) => smoothstep(clamp01((f - A_SNAP_F0) / (A_SNAP_F1 - A_SNAP_F0)));
export const aHeading = (f: number) => {
  const p = aOnPath(f);
  const tan = Math.atan2(p.ty, p.tx);
  const weave = A_WEAVE * Math.sin(f * 0.085 + 1.7) * (1 - smoothstep(clamp01((f - 96) / 24)));
  return turn(tan + weave, H_USER + A_HUNT_TIGHT * Math.sin(f * 0.06), aSnap(f));
};

export const A_R = DOT_R * AGENT_A_SCALE;
/** The frame A crosses the seat ring's edge, solved off its own arc position
 *  rather than written down: the handover hangs on it. */
export const F_RING = (() => {
  for (let f = 0; f <= DURATION; f += 0.25) {
    const p = aOnPath(f);
    if (Math.hypot(p.x - SEAT.x, p.y - SEAT.y) <= SEAT_R) return f;
  }
  return DURATION;
})();
/** ...and the frame it crosses the person glyph's feet line, which has to be
 *  LATER than the glyph is gone. */
export const F_FEET = (() => {
  const feet = SEAT.y + PERSON_H * 0.42;
  for (let f = 0; f <= DURATION; f += 0.25) {
    if (aOnPath(f).y <= feet) return f;
  }
  return DURATION;
})();

// The glyph's exit: it starts when A touches the ring and takes GLYPH_OUT_F
// frames — the label entrance run backwards, up 24 px while fading out. Six
// frames, not eight, and this is solved rather than chosen: A crosses the feet
// line at F_FEET, and the glyph has to be under 0.3 by then, so
// 1 - smoothstep((F_FEET - F_RING) / GLYPH_OUT_F) < 0.3.
const GLYPH_OUT_F = 4;
export const glyphOut = (f: number) => smoothstep(clamp01((f - F_RING) / GLYPH_OUT_F));

// ---------------------------------------------------------------------------
// THE TWO WAVES. Both are keyed on DISTANCE from the seat with a small hashed
// jitter (`waveArrival`) — never on link hops, never in unison.
//
// WAVE 1, the CHANNEL (gesture 3): the telling's route lighting up. It is a
// light, not a mover, so it is fast: 42 world px/frame covers the blob's whole
// depth from the seat (D_MAX below) by f95, which is the brief's "reaching the
// back by ~f95".
//
// WAVE 2, the TELLING (gesture 4): accent packets leaving the seat on the lit
// links. A packet's ARRIVAL IS THE SNAP — the two are one number, so the
// mechanism is derived from the visible thing and cannot drift from it. Its
// speed is SOLVED against the brief's "about the front third has snapped at
// f144": see WAVE2_V.
// ---------------------------------------------------------------------------
const D_MAX = Math.max(...DIST.dist);
/** Both waves leave the seat's RING EDGE, not its centre: the 78 world px of
 *  ring is not crowd, and a wave clocked from the centre spends its first two
 *  frames crossing a white circle. */
const WDIST: number[] = DIST.dist.map((d) => d - SEAT_R);
const WD_MAX = D_MAX - SEAT_R;

const WAVE1_F0 = 74; // "tell" (f74); the wake reads from f76
const WAVE1_BACK_F = 95;
const WAVE1_V = WD_MAX / (WAVE1_BACK_F - WAVE1_F0);
const WAVE1_RAMP = 6;
const lightArrival = (i: number) => waveArrival(WDIST[i], FORM.seats[i].i, WAVE1_F0, WAVE1_V, 1.5);
export const liveOf = (i: number, f: number) =>
  smoothstep(clamp01((f - lightArrival(i)) / WAVE1_RAMP));

const SEAT_WAKE_F0 = 72;
const SEAT_WAKE_F = 8;
export const seatLive = (f: number) => smoothstep(clamp01((f - SEAT_WAKE_F0) / SEAT_WAKE_F));

const WAVE2_F0 = 122;
const SNAP_F = 7; // frames an agent takes to turn onto the arrow
/** The telling's own speed, CHOSEN AGAINST THE LAST FRAME rather than off a
 *  taste for packet speeds. The cut has 22 frames between the seat and its own
 *  end, the snap takes 7 of them, and the flock's front-to-back depth from the
 *  ring edge is 176..730 world px — so the census at f144 is entirely a
 *  function of this number, and it was measured on this formation:
 *      24 -> 15 snapped, 27 turning, 28 untouched
 *      26 -> 18, 31, 21
 *      28 -> 24, 31, 15    <- the brief's "about the front third has snapped"
 *      30 -> 28, 32, 10
 *      32 -> 32, 35, 3
 *  28 is the one that lands a third of the flock (24 of 70) fully turned with a
 *  band of 31 still turning behind it and 15 still deep at the back. It is 2x
 *  the module's own PACKET_SPEED, which is the price of the brief's count; at
 *  28 world px/f a bead runs at 27.5 screen px/frame at the resolved zoom,
 *  comfortably inside the 45 ceiling. */
export const WAVE2_V = 28;
const snapArrival = (i: number) => waveArrival(WDIST[i], FORM.seats[i].i, WAVE2_F0, WAVE2_V, 2.5);
const SNAP_AT: number[] = FORM.seats.map((_, i) => snapArrival(i));
export const snapOf = (i: number, f: number) => smoothstep(clamp01((f - SNAP_AT[i]) / SNAP_F));

// ---------------------------------------------------------------------------
// THE AGENTS. Position: the seat plus its own hashed wander, placed by
// `formationAt`. Heading: the user's arrow plus a HUNT — an amplitude of 8-28
// deg on its own hashed slow period, which is the brief's "loosely aligned,
// headings spread +-28 deg, each hunting slowly on its own hashed period" —
// plus the wander's own +-3 deg of jitter. When the telling reaches it, the
// whole thing is turned by the SHORTEST ARC onto the arrow and the hunt drops
// to +-2 deg. Tone rides the same number, so a snapping agent ripens as it
// turns and its tail lengthens with it (`Comet` reads tone for both).
// ---------------------------------------------------------------------------
// LOOSE HAS TO LOOK LOOSE (director's fix 2). The first build spread the
// headings +-8-28 deg on periods of 140-350 frames, and at f143 the 24 snapped
// agents were indistinguishable from the 15 untouched ones: everybody pointed
// roughly up. The envelope is now the briefed +-45 deg and the hunt is a real
// swing on a period an agent actually completes inside the cut:
//
//   base_i   +-22 deg, hashed and STATIC, so no agent sits on -90 by default
//   swing_i  15-23 deg, hashed, and |base| is clamped so |base| + swing <= 45
//   period_i 40-70 frames, hashed — every agent completes 2-3 hunts in 144 f
//
// so at any instant the crowd is spread across the full envelope, the ones with
// base 22 and swing 23 reach the whole 45, and each agent visibly swings by at
// least +-15. Snapped is then unmistakable: the target is -90 exactly with a
// +-2 deg hunt on the agent's own period, and the jitter drops to 0.3 of the
// wander's own. The wavefront reads as a line across the flock — a tidy bright
// parade above it, a restless deep-toned crowd below.
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
// THE CAMERA. One C1-continuous track per channel, and it has NO SEGMENT
// JUNCTIONS: instead of chaining moves that each have to come to a dead stop
// where they meet, the target is a BLEND of the three things the camera is
// doing — riding A, holding the wide shot, creeping in on the seat — under
// `camEase` weights. `camEase` has zero slope at both ends of its window, so at
// f30 the blended target is still exactly the ride's own velocity and at f64 it
// is exactly the wide shot's; the move has one deceleration lobe and nothing
// else. cy is taken off the EASED k of the same frame (cy = c + CAM_LIFT / k),
// so the composition cannot sag while the move runs, and both channels then go
// through the shared damper with the shared constants.
//
// The ride FOLLOWS A's arc position, which is safe here and is not the "chasing
// the subject" the set warns about: A's schedule is an integrated smooth speed
// track, so the camera inherits a C1 path rather than a reactive one.
// ---------------------------------------------------------------------------
// The ZOOM and the PAN are keyed on their OWN windows. They are not the same
// gesture: the zoom is the pull-back and it has to land before the words move
// on, while the pan has 2.4x more distance to cover (534 world px against a
// 0.76 change in k) and is therefore what sets the acceleration. Measured on
// five fixed world probes: with one shared 34-frame window this move runs at
// |dv| 3.5-4.0 against the set's 2.5 budget, and the pan's own term is 60% of
// it; giving the pan 54 frames and the zoom 46 takes the whole thing to 2.64
// with no reversal in either channel.
const TRACK_F1 = DURATION + 22;
const F_Z0 = 26; // the pull-back
const F_Z1 = 72;
const F_P0 = 20; // the pan off A and on to the column axis
const F_P1 = 82;
const RIDE_FREEZE = 30;
/** The opening zoom. The brief asks for k 2.2 and this is 1.70: see the
 *  DEVIATIONS note at `STATS`. At 2.2 the same move measures |dv| 3.5-4.0 and
 *  puts the fastest agent ON SCREEN at 43-57 px/frame, over the set's 45
 *  ceiling; at 1.70 they are 2.64 and 27, and A's body is still 37 screen px
 *  with the flock's corner filling the top right of the opening frame. */
const K_OPEN = 1.85;
const K_RIDE_CREEP = 0.07;
const K_HOLD = 0.94;
/** THE PUSH. The brief asks for "a slow creep-in on the seat across f100-144",
 *  and it was built that way first: k 0.94 held from f72 to f100 and then crept
 *  to 0.98. Measured against three approved cuts of this style on the same
 *  metric (mean abs frame difference, 135x240 grey), that held stretch was the
 *  problem with the whole second half — 6-frame blocks of 0.29-0.41 where
 *  `GoodTrajectory` runs 0.25-4.78 and `ChainOfThought_V3` never drops below
 *  0.75 after its opening. The gestures in that stretch are all SMALL by
 *  construction (a wake travelling through links, a label landing, A settling,
 *  then 24 comets turning 28 degrees each), so the only thing that can carry it
 *  is the camera. So the hold and the creep-in are ONE continuous push instead:
 *  from the frame the pull-back lands (f72) to well past the last frame, warped
 *  so the speed comes early and is still running at f144. It is still a creep
 *  — 0.28%/frame, k 0.94 -> 1.08 over 72 frames — and the composition stays
 *  inside the caption-safe band the whole way (measured: 244..1381 at f144). */
const C_WIDE = 850;
const F_PUSH0 = 72;
const F_PUSH1 = 172; // past the last frame, so the push is still running at f144
const K_PUSH = 0.185;
const C_PUSH = 34;
const PUSH_WARP = 0.65;
/** The camera sits above-right of A in the close-up, so A reads below centre
 *  with the flock's corner bleeding into the top of the frame — and so that
 *  nothing at all sits below A. */
const RIDE_OFF = { x: -7, y: -10 };

const win = (f: number, f0: number, f1: number, warp = 1) =>
  camEase(clamp01((f - f0) / (f1 - f0)), warp);

const gZoom = (f: number) => win(f, F_Z0, F_Z1, 0.85);
const gPan = (f: number) => win(f, F_P0, F_P1, 0.9);
const gPush = (f: number) => win(f, F_PUSH0, F_PUSH1, PUSH_WARP);

const kTarget = (f: number) => {
  const ride = K_OPEN + K_RIDE_CREEP * win(f, 0, F_Z0, 0.75);
  const wide = K_HOLD + K_PUSH * gPush(f);
  return lerp(ride, wide, gZoom(f));
};

/** THE RIDE LETS GO. Following A all the way through the pull-back would drag
 *  the camera UP past the wide centre as soon as A starts climbing to the seat,
 *  and the pan would dip and come back — a reversal, which reads worse than any
 *  acceleration number. So the ride's own ARC POSITION decelerates to a stop
 *  over RIDE_FREEZE frames from the pan's start: it leaves at exactly A's
 *  velocity (`win` has zero slope at its start) and arrives at exactly zero, so
 *  the target stays C1 and the pan window can be long enough to stay in budget.
 *  A itself never slows down for this — only the camera's interest in it does,
 *  which is the brief's "the camera's centre slides from A to the column axis". */
const sRide = (f: number) => {
  if (f <= F_P0) return sA(f);
  const held = sA(F_P0);
  return held + (sA(f) - held) * (1 - win(f, F_P0, F_P0 + RIDE_FREEZE));
};

const cTarget = (f: number) => {
  const a = pathAt(sRide(f));
  const ff = Math.max(0, f);
  const wideY = C_WIDE - C_PUSH * gPush(ff);
  const g = gPan(ff);
  return {
    x: lerp(a.x + RIDE_OFF.x, CX, g),
    y: lerp(a.y + RIDE_OFF.y, wideY, g),
  };
};

/** PRE-ROLL. `runCamera` starts at rest, and this camera's target is already
 *  travelling with A at f0, so without a pre-roll the damper spends the first
 *  eight frames catching up: A drifts off its framing and back, and the biggest
 *  acceleration in the cut is at f4. The track therefore starts CAM_PRE frames
 *  BEFORE f0 with A's path extrapolated backwards along its opening tangent,
 *  and the arrays are indexed from there — so `runCamera` is used unchanged and
 *  the camera is already moving with A on the first frame. */
const CAM_TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CXT: number[] = [];
  const CY: number[] = [];
  for (let i = 0; i <= TRACK_F1 + CAM_PRE; i++) {
    const f = i - CAM_PRE;
    const k = kTarget(Math.max(0, f));
    const c = cTarget(f);
    F.push(i);
    K.push(k);
    CXT.push(c.x);
    CY.push(c.y + CAM_LIFT / k);
  }
  return { F, K, CX: CXT, CY };
})();

/** The x channel through the shared damper: `runCamera` with x in the centre
 *  slot, the same stiffness and damping and the same k track, so the two axes
 *  are one hand on one camera. */
const dampX = (upto: number) =>
  runCamera(upto, CAM_TRACK.F, CAM_TRACK.CX, CAM_TRACK.K).cy;

/** The camera at every frame, sway included: the table every check below is
 *  solved against. */
const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f + CAM_PRE, CAM_TRACK.F, CAM_TRACK.CY, CAM_TRACK.K);
    const d = sway(f);
    out.push({ cx: dampX(f + CAM_PRE) + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const camAt = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const CAM_AT = camAt;

/** The camera the background's parallax is measured from: the DAMPED f0 camera,
 *  not the track's first key — the track's first key is at f -CAM_PRE now — so
 *  the grid sits exactly where the image does on the first frame. */
const CAM_REST = { cx: CAM_AT_F[0].cx, cy: CAM_AT_F[0].cy };

const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: CX + (wx - c.cx) * c.k, y: FRAME_H / 2 + (wy - c.cy) * c.k };
};
export const SCREEN_AT = screenAt;

// ---------------------------------------------------------------------------
// THE LABEL "A". It rides beside A for the whole cut, and the offset EASES as A
// docks so the label ends up parked outside the ring rather than sitting on its
// stroke: 40 px to the right of the body in flight, SEAT_R + 26 to the right of
// the ring's centre once docked.
// ---------------------------------------------------------------------------
const LABEL_A_F0 = 24;
const LABEL_A_OFF = { x: 40, y: -0.5 * LABEL_SIZE };
const LABEL_A_PARK = { x: SEAT_R + 26, y: -0.5 * LABEL_SIZE };
const labelAAt = (f: number) => {
  const p = aPos(f);
  const g = smoothstep(clamp01((f - 108) / 20));
  return {
    x: p.x + lerp(LABEL_A_OFF.x, LABEL_A_PARK.x, g),
    y: p.y + lerp(LABEL_A_OFF.y, LABEL_A_PARK.y, g),
  };
};

// ---------------------------------------------------------------------------
// HOW A LINK IS PAINTED (director's fix 1: the web was a wire cage). The first
// build left every link at LINK_IDLE and then, once the "tell" wake had passed,
// at LINK_LIVE 0.95 for the rest of the cut: 110 lines as bright as the comets
// and nearly as heavy, held blazing to the end, so the flock read as a truss
// with dots at its joints. Nothing in `alignShared` changes for this — its
// values are the set's — the painting is done HERE, with local multipliers:
//
//   idle   0.30   never touched by the telling
//   rest   0.45   the tell wake has passed: woken, not blazing
//   band   0.95   and ONLY as a TRAVELLING BAND — 5 f up, 12 f down, no hold
//
// A band is fired by whichever wave reaches the link, and BOTH waves fire one:
// the channel wake at f74+ and the snap packets at f122+, so the second wave
// lights its own band through a flock that has settled back to 0.45. The target
// opacity is then divided by the `Link`'s own idle->live ramp and handed back as
// its `opacity`, so the product IS the number above and the component is used
// exactly as written.
//
// The packets are drawn HERE too, off the module's own `linkPackets`, because
// `Link`'s are PACKET_R = 4.5 world px — 0.56 of a comet's head — and at f143
// there were ~20 of them reading as extra agents. Capped at 0.45 of the head
// radius and thinned: the idle period is 3.4x the module's, which puts ~8 on
// the whole flock at any moment instead of 20.
// ---------------------------------------------------------------------------
const LINK_IDLE_OP = 0.3;
const LINK_REST_OP = 0.45;
const LINK_BAND_OP = 0.95;
const BAND_UP = 5;
const BAND_DOWN = 12;
const BAND_WAKE_F = 8; // frames the floor takes to lift 0.30 -> 0.45

/** The travelling band: 0 before the wave, up over BAND_UP, straight back down
 *  over BAND_DOWN, 0 after. No hold anywhere in it. */
const bandAt = (t: number) => {
  if (t <= 0) return 0;
  if (t < BAND_UP) return smoothstep(t / BAND_UP);
  if (t < BAND_UP + BAND_DOWN) return 1 - smoothstep((t - BAND_UP) / BAND_DOWN);
  return 0;
};

/** A link's target opacity and its band value, from the two waves' arrival at
 *  its NEARER end. */
export const linkPaint = (tCh: number, tSn: number, f: number) => {
  const band = Math.max(bandAt(f - tCh), bandAt(f - tSn));
  const floor =
    LINK_IDLE_OP +
    (LINK_REST_OP - LINK_IDLE_OP) * smoothstep(clamp01((f - tCh) / BAND_WAKE_F));
  return { band, op: floor + (LINK_BAND_OP - floor) * band };
};

/** `Link` multiplies its own `opacity` by lerp(LINK_IDLE, LINK_LIVE, live), so
 *  this is what to hand it for the product to come out at `op`. */
const linkAlpha = (op: number, band: number) => op / lerp(LINK_IDLE, LINK_LIVE, band);

/** A packet on an agent link: 0.45 of a comet's head radius, and the idle
 *  period is 3.4x the module's so the traffic is sparse. */
const PKT_R = 0.45 * DOT_R;
const PKT_PERIOD_IDLE = PACKET_PERIOD * 3.4;
const PKT_PERIOD_LIT = PACKET_PERIOD * 1.7;

// ---------------------------------------------------------------------------
// THE WAVE PACKET. One accent bead per link, and it exists only while the
// telling is crossing that link: the link is oriented from whichever end snaps
// FIRST, and the bead's position is (f - arrival(near)) / (arrival(far) -
// arrival(near)). So the bead leaves the agent that has just been told and
// lands on the next one exactly as that one starts to turn — the snap is not a
// separate event, it is what the bead arriving means. Bigger than the idle
// traffic (0.62 of a comet's head against 0.45) and still smaller than a comet,
// so it reads as the message and never as an agent.
// ---------------------------------------------------------------------------
const WAVE_BEAD_R = 0.62 * DOT_R;
/** How far off a comet's own body a link starts and ends, in that comet's
 *  radii. 1.35 clears the body (a comet's tail is a wake and a line crossing it
 *  is not a collision), and it is what turns the blob from a truss with dots at
 *  its joints into comets with links between them. */
const LINK_GAP = 1.35;
const beadOn = (ta: number, tb: number, f: number) => {
  if (tb <= ta) return null;
  const u = (f - ta) / (tb - ta);
  return u >= 0 && u <= 1 ? u : null;
};

// ---------------------------------------------------------------------------

const UserIsAgentA: React.FC<Props> = ({
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
  const cam = camAt(frame);
  const k = cam.k;
  const { tx, ty } = worldTransform(cam.cx, cam.cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the co-moving offset -------------------------------------------------
  // Added to the world AND to the camera, so it cancels in the transform above
  // and survives only in the background's parallax — which is the grid sliding
  // under the held formation.
  const tv = travel(frame, headingAt);
  const tv0 = travel(0, headingAt);

  // -- the agents -----------------------------------------------------------
  const agents = FORM.seats.map((_, i) => agentAt(i, frame));
  const seatWake = seatLive(frame);

  // -- agent A --------------------------------------------------------------
  const a = aPos(frame);
  const aHead = aHeading(frame);
  const lab = labelAAt(frame);
  const gOut = glyphOut(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cam.cy + tv.y}
        cyRest={CAM_REST.cy + tv0.y}
        cx={cam.cx + tv.x}
        cxRest={CAM_REST.cx + tv0.x}
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
          {/* the links and the flock. Links first, so a comet always sits on
              top of the wires between them. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the agents' own links: accent, because they are the agents'.
                Each one is INSET off both bodies by LINK_GAP radii, so a link
                runs BETWEEN two comets instead of through them, and painted by
                `linkPaint` — idle 0.30, a 5/12-frame travelling band to 0.95 as
                a wave crosses it, 0.45 at rest after the wake. */}
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
              const paint = linkPaint(
                Math.min(lightArrival(i), lightArrival(j)),
                Math.min(SNAP_AT[i], SNAP_AT[j]),
                frame,
              );
              // the traffic, thinned and small: the module's own geometry, this
              // cut's radius and period
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
                      fill={ACCENT}
                      opacity={paint.op}
                    />
                  ))}
                  {u === null ? null : (
                    <circle
                      cx={from.x + (to.x - from.x) * u}
                      cy={from.y + (to.y - from.y) * u}
                      r={WAVE_BEAD_R}
                      fill={ACCENT}
                    />
                  )}
                </g>
              );
            })}

            {/* the seat's own links to the five front agents: WHITE, and the
                same geometry, width, dash and packets as the accent ones. That
                sameness is the line's "similar techniques". */}
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
              const u = beadOn(WAVE2_F0, SNAP_AT[i], frame);
              return (
                <g key={`s${i}`}>
                  <Link
                    frame={frame}
                    k={k}
                    kind="seat"
                    from={from}
                    to={to}
                    live={seatWake}
                    packets={u === null}
                    phase={hash(i, 7) * PACKET_PERIOD * 2.2}
                  />
                  {u === null ? null : (
                    <circle
                      cx={from.x + (to.x - from.x) * u}
                      cy={from.y + (to.y - from.y) * u}
                      r={WAVE_BEAD_R}
                      fill={ACCENT}
                    />
                  )}
                </g>
              );
            })}

            {agents.map((p, i) => (
              <Comet
                key={`a${i}`}
                x={p.x}
                y={p.y}
                heading={p.heading}
                r={p.r}
                tone={p.tone}
              />
            ))}
          </svg>

          {/* the user seat: the ring and the arrow. Its occupant is drawn
              separately, because the handover is a CROSS-FADE — the person
              leaves on the text entrance run backwards while A arrives — and a
              single `opacity` on the whole seat cannot say that. */}
          <UserSeat
            k={k}
            x={SEAT.x}
            y={SEAT.y}
            frame={frame}
            occupant="none"
            arrow={1}
          />
          {/* "user". `UserSeat` puts its own label UNDER the ring, which is
              where this cut's five white seat-links leave it: at 34 px below the
              ring the bundle is still only 80 px wide and the word sits inside
              it, and at INK_LO it reads as a smudge on the wires. So it is
              drawn here instead, on the ring's LEFT SHOULDER and centred on the
              ring's own centre — the one side of the seat that nothing crosses,
              and the mirror of where the label "A" parks. The entrance is the
              module's own: up 24 px while fading in, landing on "user". */}
          <Label
            k={k}
            x={SEAT.x - SEAT_R - 26 - LABEL_SIZE * 1.1}
            y={SEAT.y - LABEL_SIZE * 0.52}
            text="user"
            f0={98}
            frame={frame}
            // INK_LO while it is just naming the seat, INK_HI by the time A is
            // docked in it: once the ring holds A, "user" is not context any
            // more, it is half of what the cut is saying (director's fix 4).
            opacity={lerp(INK_LO, INK_HI, smoothstep(clamp01((frame - 108) / 16)))}
          />
          {gOut < 1 ? (
            <Img
              src={staticFile("person.png")}
              style={{
                position: "absolute",
                left: SEAT.x - PERSON_H / 2,
                top: SEAT.y - PERSON_H / 2 - worldPx(24) * gOut,
                width: PERSON_H,
                height: PERSON_H,
                opacity: INK_HI * (1 - gOut),
                filter: `brightness(0) invert(1) ${icon}`,
              }}
            />
          ) : null}

          {/* AGENT A, on top: the same comet as everyone else, one size up and
              ripe from the first frame. */}
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <Comet x={a.x} y={a.y} heading={aHead} r={A_R} tone={1} tipMul={TIP_TIGHT} />
          </svg>
          <Label
            k={k}
            x={lab.x}
            y={lab.y}
            text="A"
            f0={LABEL_A_F0}
            frame={frame}
            align="left"
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default UserIsAgentA;

// ---------------------------------------------------------------------------
// WHAT CUT 3 PICKS UP. `STATE_AT(f)` is the picture as state — every agent's
// heading and tone, the snap order, the seat, A — and `CAM_AT(f)` is the
// camera, both exported so the next cut opens on this cut's own last frame
// rather than on a sketch of it.
// ---------------------------------------------------------------------------
export const STATE_AT = (f: number) => {
  const ag = FORM.seats.map((s, i) => {
    const p = agentAt(i, f);
    return { i, seed: s.i, x: p.x, y: p.y, r: p.r, heading: p.heading, tone: p.tone };
  });
  return {
    frame: f,
    formCentre: { ...FORM_C },
    heading: headingAt(),
    travel: travel(f, headingAt),
    agents: ag,
    /** seat indices in the order the telling reaches them */
    snapOrder: FORM.seats
      .map((_, i) => i)
      .sort((p, q) => SNAP_AT[p] - SNAP_AT[q]),
    snapAt: SNAP_AT.slice(),
    seat: {
      x: SEAT.x,
      y: SEAT.y,
      r: SEAT_R,
      arrow: 1,
      occupant: f >= F_RING + GLYPH_OUT_F ? "agent" : "person",
      personOpacity: 1 - glyphOut(f),
      label: "user",
      seatLinkLive: seatLive(f),
      front: FRONT.slice(),
    },
    a: {
      ...aPos(f),
      r: A_R,
      heading: aHeading(f),
      tone: 1,
      snap: aSnap(f),
      docked: f >= A_DOCK_F,
      label: { text: "A", ...labelAAt(f) },
    },
  };
};

// ---------------------------------------------------------------------------
// THE NUMBERS, computed rather than asserted.
// ---------------------------------------------------------------------------
const PROBES: [number, number][] = [
  [SEAT.x, SEAT.y],
  [FORM_C.x, FORM_C.y],
  [FORM_C.x - BLOB_RX, FORM_C.y],
  [FORM_C.x, FORM_C.y + BLOB_RY],
  [CX, ARROW_TIP_Y],
];

const camDv = (() => {
  let worst = 0;
  let at = 0;
  for (const [px, py] of PROBES) {
    for (let f = 2; f <= DURATION; f++) {
      const p0 = screenAt(f - 2, px, py);
      const p1 = screenAt(f - 1, px, py);
      const p2 = screenAt(f, px, py);
      const ax = p2.x - 2 * p1.x + p0.x;
      const ay = p2.y - 2 * p1.y + p0.y;
      const m = Math.hypot(ax, ay);
      if (m > worst) {
        worst = m;
        at = f;
      }
    }
  }
  return { worst, at };
})();

const camV = (() => {
  let worst = 0;
  let quiet = Infinity;
  for (let f = 1; f <= DURATION; f++) {
    let m = 0;
    for (const [px, py] of PROBES) {
      const p0 = screenAt(f - 1, px, py);
      const p1 = screenAt(f, px, py);
      m = Math.max(m, Math.hypot(p1.x - p0.x, p1.y - p0.y));
    }
    worst = Math.max(worst, m);
    quiet = Math.min(quiet, m);
  }
  return { worst, quiet };
})();

/** The fastest thing on screen, in screen px/frame: every agent, A, and the
 *  grid's own slide. The set's ceiling is 45. */
const speeds = (() => {
  let agent = 0;
  let agentAtF = 0;
  let aa = 0;
  let aaF = 0;
  let grid = 0;
  for (let f = 1; f <= DURATION; f++) {
    for (let i = 0; i < FORM.seats.length; i++) {
      const p0 = agentAt(i, f - 1);
      const p1 = agentAt(i, f);
      const s0 = screenAt(f - 1, p0.x, p0.y);
      const s1 = screenAt(f, p1.x, p1.y);
      const m = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      if (m > agent) {
        agent = m;
        agentAtF = f;
      }
    }
    const q0 = aPos(f - 1);
    const q1 = aPos(f);
    const t0 = screenAt(f - 1, q0.x, q0.y);
    const t1 = screenAt(f, q1.x, q1.y);
    const m = Math.hypot(t1.x - t0.x, t1.y - t0.y);
    if (m > aa) {
      aa = m;
      aaF = f;
    }
    // the grid's own screen offset, exactly as GridBackground computes it
    const g = (ff: number) => {
      const c = camAt(ff);
      const tvv = travel(ff, headingAt);
      const tv00 = travel(0, headingAt);
      return {
        x: -(c.cx + tvv.x - (CAM_REST.cx + tv00.x)) * c.k * 0.32,
        y: -(c.cy + tvv.y - (CAM_REST.cy + tv00.y)) * c.k * 0.32 - ff * 0.3,
      };
    };
    const a0 = g(f - 1);
    const a1 = g(f);
    grid = Math.max(grid, Math.hypot(a1.x - a0.x, a1.y - a0.y));
  }
  return { agent, agentAtF, a: aa, aAtF: aaF, grid };
})();

/** Does the background ever run out of image? BG_OVERSIZE is 1.8 and it is
 *  scaled by 1 + (k - 1) * 0.3, so the slack is (FRAME * 1.8 * bgScale - FRAME)
 *  / 2 on each side. */
const bgSlack = (() => {
  let worstX = Infinity;
  let worstY = Infinity;
  for (let f = 0; f <= DURATION; f++) {
    const c = camAt(f);
    const tvv = travel(f, headingAt);
    const tv00 = travel(0, headingAt);
    const bx = -(c.cx + tvv.x - (CAM_REST.cx + tv00.x)) * c.k * 0.32;
    const by = -(c.cy + tvv.y - (CAM_REST.cy + tv00.y)) * c.k * 0.32 - f * 0.3;
    const s = 1 + (c.k - 1) * 0.3;
    worstX = Math.min(worstX, (FRAME_W * 1.8 * s - FRAME_W) / 2 - Math.abs(bx));
    worstY = Math.min(worstY, (FRAME_H * 1.8 * s - FRAME_H) / 2 - Math.abs(by));
  }
  return { x: worstX, y: worstY };
})();

/** Every piece of ink, on screen, at a frame: the lowest and the highest. The
 *  comet tails count — a body's tip is tipMul * 2r behind it — and so does the
 *  arrow's tip and the seat's ring. */
const inkBand = (f: number) => {
  let lo = Infinity;
  let hi = -Infinity;
  const put = (wx: number, wy: number) => {
    const s = screenAt(f, wx, wy);
    lo = Math.min(lo, s.y);
    hi = Math.max(hi, s.y);
  };
  for (let i = 0; i < FORM.seats.length; i++) {
    const p = agentAt(i, f);
    put(p.x, p.y + p.r);
    const tip = 2 * p.r * lerp(1.6, 2.6, p.tone);
    put(p.x - Math.cos(p.heading) * tip, p.y - Math.sin(p.heading) * tip);
  }
  const q = aPos(f);
  const at = 2 * A_R * 2.6;
  put(q.x, q.y + A_R);
  put(q.x - Math.cos(aHeading(f)) * at, q.y - Math.sin(aHeading(f)) * at);
  put(SEAT.x, SEAT.y + SEAT_R);
  put(SEAT.x, ARROW_TIP_Y);
  return { lo, hi };
};

const band = (() => {
  let lowest = -Infinity;
  let lowestAt = 0;
  let highest = Infinity;
  let highestAt = 0;
  for (let f = 0; f <= DURATION; f++) {
    const b = inkBand(f);
    if (b.hi > lowest) {
      lowest = b.hi;
      lowestAt = f;
    }
    if (b.lo < highest) {
      highest = b.lo;
      highestAt = f;
    }
  }
  return { lowest, lowestAt, highest, highestAt };
})();

/** THE SEPARATION ASSERTION (director's fix 3). Every pair that could ever
 *  touch — the seats within 160 world px of each other, which is far more than
 *  the wander's reach — measured on EVERY frame, in mean radii. The set's floor
 *  is SEP_FLOOR 2.62 and the cut is asserted at 2.6; if this drops under it the
 *  crowd has a fused pair somewhere and the caps are wrong. */
const minSep = (() => {
  const pairs: [number, number][] = [];
  for (let i = 0; i < FORM.seats.length; i++) {
    for (let j = i + 1; j < FORM.seats.length; j++) {
      if (Math.hypot(FORM.seats[i].x - FORM.seats[j].x, FORM.seats[i].y - FORM.seats[j].y) < 160) {
        pairs.push([i, j]);
      }
    }
  }
  let worst = Infinity;
  let at = 0;
  let which: [number, number] = [0, 0];
  for (let f = 0; f <= DURATION; f++) {
    for (const [i, j] of pairs) {
      const a = agentAt(i, f);
      const b = agentAt(j, f);
      const d = Math.hypot(a.x - b.x, a.y - b.y) / (0.5 * (a.r + b.r));
      if (d < worst) {
        worst = d;
        at = f;
        which = [i, j];
      }
    }
  }
  return { worst, at, which, pairs: pairs.length };
})();

/** The headings, in degrees off the user's arrow, at a frame: the spread the
 *  loose crowd shows and how many are inside 3 degrees of it. */
const headingSpread = (f: number) => {
  const off = FORM.seats.map((_, i) => ((agentAt(i, f).heading - H_USER) * 180) / Math.PI);
  const loose = off.filter((_, i) => snapOf(i, f) < 0.5);
  const snapped = off.filter((_, i) => snapOf(i, f) > 0.95);
  const span = (a: number[]) =>
    a.length === 0 ? [0, 0] : [Number(Math.min(...a).toFixed(1)), Number(Math.max(...a).toFixed(1))];
  return { loose: span(loose), snapped: span(snapped), nLoose: loose.length, nSnapped: snapped.length };
};

/** THE OPENING FRAMING (director's fix 4). How far down the frame the FLOCK
 *  reaches, as a percentage of the frame height: its top is off-frame above in
 *  the close-up, so this is the share of the frame it occupies. The brief wants
 *  it out of the opening framing if the geometry allows and under 15% through
 *  f24 if it cannot be. Comet tails included. */
const flockReach = (f: number) => {
  let lo = -Infinity;
  for (let i = 0; i < FORM.seats.length; i++) {
    const p = agentAt(i, f);
    const s1 = screenAt(f, p.x, p.y + p.r);
    lo = Math.max(lo, s1.y);
    const tip = 2 * p.r * lerp(1.6, 2.6, p.tone);
    const s2 = screenAt(f, p.x - Math.cos(p.heading) * tip, p.y - Math.sin(p.heading) * tip);
    lo = Math.max(lo, s2.y);
  }
  return Math.max(0, Math.min(FRAME_H, lo)) / FRAME_H;
};

/** ...and where A actually sits on screen, which is the other half of fix 4. */
const aScreen = (f: number) => {
  const p = aPos(f);
  const s1 = screenAt(f, p.x, p.y);
  return [Number(s1.x.toFixed(0)), Number(s1.y.toFixed(0))];
};

const snappedAt = (f: number) => SNAP_AT.filter((t) => f - t >= SNAP_F).length;
const turningAt = (f: number) => SNAP_AT.filter((t) => f - t > 0 && f - t < SNAP_F).length;

export const BEATS = defaultProps.beats;
export const STATS = {
  duration: DURATION,
  fps: FPS,
  agents: FORM.seats.length,
  links: FORM.links.length,
  seatLinks: FRONT.length,
  layout: {
    formCentre: [FORM_C.x, FORM_C.y],
    seat: [SEAT.x, SEAT.y],
    arrowTipY: ARROW_TIP_Y,
    blob: [Number(BLOB_RX.toFixed(1)), Number(BLOB_RY.toFixed(1))],
    dMaxFromSeat: Number(D_MAX.toFixed(1)),
  },
  camera: {
    kAt: [0, 12, 30, 40, 52, 60, 64, 80, 100, 122, 144].map((f) => [
      f,
      Number(camAt(f).k.toFixed(3)),
    ]),
    centreAt: [0, 30, 64, 100, 144].map((f) => {
      const c = camAt(f);
      return [f, Number(c.cx.toFixed(1)), Number((c.cy - CAM_LIFT / c.k).toFixed(1))];
    }),
    maxAbsDv: Number(camDv.worst.toFixed(3)),
    maxAbsDvAt: camDv.at,
    peakProbeV: Number(camV.worst.toFixed(2)),
    quietestProbeV: Number(camV.quiet.toFixed(3)),
    stiffness: CAM_STIFF,
  },
  a: {
    pathLen: Number(PATH.total.toFixed(1)),
    cruise: Number(A_V.toFixed(2)),
    dockF: A_DOCK_F,
    ringCrossF: Number(F_RING.toFixed(2)),
    feetCrossF: Number(F_FEET.toFixed(2)),
    glyphOutFrames: GLYPH_OUT_F,
    glyphAtFeetCross: Number((1 - glyphOut(F_FEET)).toFixed(3)),
    headingAt: [0, 30, 60, 100, 112, 120, 126, 144].map((f) => [
      f,
      Number(((aHeading(f) * 180) / Math.PI).toFixed(1)),
    ]),
  },
  waves: {
    channelV: Number(WAVE1_V.toFixed(1)),
    channelBackLitAt: WAVE1_BACK_F,
    tellingV: WAVE2_V,
    tellingF0: WAVE2_F0,
    snapFrames: SNAP_F,
    snappedAt: [122, 130, 136, 144].map((f) => [f, snappedAt(f)]),
    turningAt: [130, 136, 144].map((f) => [f, turningAt(f)]),
    snappedFractionAtEnd: Number((snappedAt(DURATION) / FORM.seats.length).toFixed(3)),
  },
  speeds: {
    maxAgentScreen: Number(speeds.agent.toFixed(1)),
    maxAgentAtF: speeds.agentAtF,
    maxAScreen: Number(speeds.a.toFixed(1)),
    maxAAtF: speeds.aAtF,
    maxGridScreen: Number(speeds.grid.toFixed(1)),
    ceiling: 45,
  },
  band: {
    lowestInkY: Number(band.lowest.toFixed(1)),
    lowestAtF: band.lowestAt,
    highestInkY: Number(band.highest.toFixed(1)),
    highestAtF: band.highestAt,
    atF60: [Number(inkBand(60).lo.toFixed(1)), Number(inkBand(60).hi.toFixed(1))],
    /** the first frame from which every piece of ink is inside screen y
     *  200..1400 and stays there: before it the camera is still opening and the
     *  arrow's tip is above the frame, which is the pull-back, not a framing
     *  fault. */
    insideBandFrom: (() => {
      for (let f = DURATION; f >= 0; f--) {
        const b = inkBand(f);
        if (b.lo < 200 || b.hi > 1400) return f + 1;
      }
      return 0;
    })(),
    atF144: [Number(inkBand(144).lo.toFixed(1)), Number(inkBand(144).hi.toFixed(1))],
  },
  backgroundSlack: { x: Number(bgSlack.x.toFixed(1)), y: Number(bgSlack.y.toFixed(1)) },
  opening: {
    flockReachPct: [0, 6, 12, 18, 24, 30, 36].map((f) => [f, Number((flockReach(f) * 100).toFixed(1))]),
    aScreenAt: [0, 12, 24, 30, 48].map((f) => [f, ...aScreen(f)]),
    aBodyScreenPx: Number((2 * A_R * CAM_AT_F[0].k).toFixed(1)),
  },
  separation: {
    floor: SEP_FLOOR,
    assertAt: 2.6,
    minMeanRadii: Number(minSep.worst.toFixed(3)),
    atFrame: minSep.at,
    pair: minSep.which,
    pairsChecked: minSep.pairs,
  },
  headings: {
    atF60: headingSpread(60),
    atF130: headingSpread(130),
    atF143: headingSpread(143),
  },
  linkPaint: {
    idle: LINK_IDLE_OP,
    rest: LINK_REST_OP,
    band: LINK_BAND_OP,
    bandFrames: [BAND_UP, BAND_DOWN],
    packetR: Number(PKT_R.toFixed(2)),
    beadR: Number(WAVE_BEAD_R.toFixed(2)),
    cometHeadR: Number(DOT_R.toFixed(2)),
    idlePeriod: Number(PKT_PERIOD_IDLE.toFixed(1)),
  },
};
