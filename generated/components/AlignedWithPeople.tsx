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
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  ARROW_LEN,
  BLOB_RX,
  BLOB_RY,
  Comet,
  DOT_R,
  H_USER,
  INK_HI,
  INK_LO,
  LINK_IDLE,
  LINK_LIVE,
  Link,
  PARALLAX,
  SEAT_GAP,
  SEAT_R,
  SLIDE_V,
  STROKE_W,
  TIP_LOOSE,
  TIP_TIGHT,
  UserSeat,
  arcTo,
  buildFormation,
  camKnots3,
  flockWander,
  flockWanderCaps,
  huntSettle,
  huntStep,
  lerp,
  meanAngle,
  runCam3,
  turn,
  waveArrival,
} from "./alignShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Alignment`, cut 1 `AlignedWithPeople` (in 0:06.640):
//   "we've managed to get these agents to be super aligned with each other. Can
//    we use, like, similar techniques to get agents to be highly aligned with
//    people?"
//
// DURATION. The cut starts at 6.640 s and speech ends at 12.400 s, so
//   DURATION = round((12.400 - 6.640) * 24) + 16 = 138 + 16 = 154
// — the spoken frames plus the set's 16-frame tail, which holds the resolved
// state without ever going still.
//
// Word onsets, frame = round((t - 6.640) * 24):
//   we've 0 · managed 6 · to 9 · get 11 · these 13 · AGENTS 17 (ends 32) ·
//   to 32 · be 36 · SUPER 38 · ALIGNED 43 · with 47 · EACH 49 · OTHER 52
//   (ends 60) · can 60 · we 63 · use 66 · like 71 · SIMILAR 80 ·
//   TECHNIQUES 86 (ends 97) · to 97 · get 104 · agents 107 · to 112 · be 115 ·
//   HIGHLY 118 · ALIGNED 123 · with 128 · PEOPLE 130 (ends 138) · tail 138-154.
export const DURATION = 154;

// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "a flock turns as one through the links between its members; the same
//    links, in white, reach down from a person, and the flock starts, only
//    loosely, to turn the person's way."
//
// THE WORLD. One formation of 90 agents as a feathered superellipse blob
// (`buildFormation`, 700 x 620 screen px at K_WIDE), 150 accent links between
// neighbours idling at 0.4 with sparse packets on them, and the USER SEAT — a
// white ring with person.png in it and a white arrow straight up out of it —
// SEAT_GAP above the blob's centre and fully off the top of the frame until the
// camera goes looking for it.
//
// THE BLOB DOES NOT TUMBLE, THE NOSES TURN. `formationAt` is in the shared
// module for a cut that wants a rotating body; this cut keeps the blob's own
// frame upright and rotates only the agents' HEADINGS, for two reasons. An 80
// degree tumble of the whole body would swing the composition off the centred
// column and would carry the seat round with the head, putting it up-RIGHT of
// the blob instead of straight above it, which is where the briefed resolved
// framing needs it. And the gesture reads better this way round: what changes
// course is the flock's direction of travel, and that is carried by the noses
// and by the GROUND — the world travels along the mean heading at SLIDE_V and
// the grid slides under the held formation at PARALLAX of it, so the course
// change is legible as the ground swinging from down-right to down-left.
//
// ---------------------------------------------------------------------------
// GESTURES — the brief's three, each with the camera move that belongs to it,
// and one thing the frame forced (7). Every gesture leads its word and overlaps
// its neighbour; nothing in the cut is outside this list.
//
//  1. f6-53   "these agents ... be    THE TURN AS ONE. The formation is in
//             SUPER ALIGNED with      flight at -130 deg (up-left), deep-toned.
//             EACH OTHER"             From f6 a heading change to -50 deg
//             (17/38/43/49/52)        (up-right) starts at the HEAD agents and
//                                     travels back through the links KEYED ON
//                                     DISTANCE from the head with a hashed
//                                     +-1.5 f jitter (never a hop count, never
//                                     unison): as the wave reaches an agent the
//                                     link FEEDING it lights to 0.95 AS A
//                                     TRAVELLING BAND (5 f up, 12 f back to
//                                     idle, no hold), the agent rotates by the
//                                     shortest arc over its own
//                                     hashed 8-13 f and ripens deep -> ripe.
//                                     Last arrival f38, last rotation complete
//                                     f46.5 — inside "other", which ends at
//                                     f60. Measured, agents within 10 deg of
//                                     the flock's own mean heading: 90 at f0,
//                                     7 at f30 (mid-turn), 82 on "aligned"
//                                     (f43), 90 on "each" (f49) and on "other".
//  2. f0-60   (the same words)        THE PULL-BACK ALONG THE WAVE. ONE glide:
//                                     the camera opens CLOSE at k 1.90 just
//                                     ahead of the blob's centre — comets 30
//                                     screen px, links 6.2, the crowd bleeding
//                                     off both sides (blob x -11..1319) — and
//                                     opens to k 1.60 while its centre travels
//                                     DOWN the way the wave is going, which is
//                                     also what keeps the seat off the top.
//  3. f60-88  "CAN WE USE"            FIND THE SEAT. The same glide keeps
//             (60/63/66)              opening and now LIFTS: the camera goes up
//                                     ahead of the formation, the seat's ring
//                                     crosses into frame on f69 (on "we") and
//                                     is fully clear of the top edge by f76.
//                                     One continuous k track from f0 to the
//                                     end — the pull-back never reverses, never
//                                     stops and has no stall at the turn
//                                     (Hermite knots, measured |dv| 1.263).
//  4. f80-104 "SIMILAR TECHNIQUES"    THE SAME LINK, IN WHITE. Five white links
//             (80/86)                 draw from the seat ring down to five front
//                                     agents, fanned (no two within 150 world
//                                     px of each other) — the SAME `Link`, the
//                                     same width, the same packets, the same
//                                     geometry as the accent links, white
//                                     instead of accent, which is the whole
//                                     "similar techniques". They land on five
//                                     FRONT RIM agents, one per column across
//                                     the head's width (local x -223, -69, -22,
//                                     141, 233), and none of them passes over
//                                     another comet — measured worst clearance
//                                     22.5 px at f100, asserted on every drawn
//                                     frame. They start f80, 83, 86, 89, 92 and
//                                     land f92, 95, 98, 101, 104, dealt to the
//                                     five by hash so each lands on its own
//                                     frame. Each holds INK_HI while its agent
//                                     is turning and then settles to INK_LO
//                                     with its packets still running, so the
//                                     last third puts the eye on the flock and
//                                     not on five white lines.
//  5. f92-154 "HIGHLY ALIGNED with    THE LOOSE TURN. As each white link lands,
//             PEOPLE"                 that agent starts to rotate from -50 deg
//             (118/123/130)           toward the arrow's -90 — and the turn
//                                     passes back through the ACCENT links at
//                                     WAVE3_SPEED = 5.85 world px/frame. Every
//                                     agent's turn is an UNDERDAMPED step
//                                     (`huntStep`): it overshoots the arrow by
//                                     12 deg and hunts either side of it with a
//                                     decaying amplitude instead of arriving,
//                                     and it drops ripe -> DEEP as the wave
//                                     reaches it, because it has left tight
//                                     alignment. Measured within 10 deg of the
//                                     arrow: 1 at f104, 10 on "highly" (f118),
//                                     22 on "people" (f130), 36 (40.0%) at f138
//                                     where "people" ends, 57 on the last frame
//                                     — and the last arrival is f179.3, so the
//                                     wave is still travelling 25 frames past
//                                     the end of the cut. It never completes;
//                                     the question stays open. Meanwhile the
//                                     count still aligned with EACH OTHER falls
//                                     90 -> 7 -> 0, which is the other half of
//                                     the line: this does not translate
//                                     directly.
//  6. f88-154 "people" + tail         THE SETTLE. The end of the same single
//                                     glide: k eases to K_WIDE and the content
//                                     centre creeps, holding the seat's ring at
//                                     screen y 434 and the formation's centre at
//                                     974 — and still moving on f154, where the
//                                     track carries on to f186.
//  7. f94-124 "to get agents to be"   THE ARROW RISES, which the frame forced
//             leading "PEOPLE" (130)  and which the cut is better for: see the
//                                     ARROW'S RISE below. The seat is FOUND as a
//                                     ring with a person in it; what that person
//                                     WANTS grows out of the ring as the camera
//                                     makes the room, completing six frames
//                                     before "people". The chain is then in the
//                                     right order — the white links land, the
//                                     want becomes legible, the flock turns to
//                                     it — and the arrow's head is on screen for
//                                     every frame it exists (tip screen y never
//                                     above 124, asserted).
//
// LIVENESS — mechanisms, not gestures, none on a word and none ever off:
//   * the GRID SLIDE. The whole world travels at SLIDE_V = 8 world px/frame
//     along the formation's circular-mean heading; the grid sits at PARALLAX
//     0.32 of the camera, so it slides under the held formation at 2.56 screen
//     px/frame on the resolved frame (measured 4.35 at f40, 3.61 at f80, 2.82
//     at f120), bending with the mean heading as the flock turns: the mean goes
//     -130 deg at f0 -> -119 at f20 -> -57 at f40 -> -50 through the middle ->
//     -76.5 by f154, so the ground swings from down-right to down-left and then
//     starts back.
//   * the FLOCK WANDER: a coherent field (two long plane waves per axis) so the
//     crowd breathes as a body, plus a small independent drift per agent capped
//     by that agent's own measured clearance, plus +-3 deg of heading jitter.
//     See THE FLOCK WANDER in `alignShared` for why the independent-only
//     version fused comets.
//   * PACKETS on all 150 accent links at the idle rate (~25 in flight) and on
//     the five white ones at the live rate, each link with its own hashed phase.
//     The white ones keep running after their link dims to INK_LO.
//   * the camera, which is one monotone pull-back and is still creeping on f154.
//
// MOTION ENERGY, measured on the rendered preview as the mean absolute frame
// difference (scratchpad ydif.txt): mean 1.76, max 3.68, and the weakest
// six-frame block 0.65. Per ten frames: 0.83 1.48 2.09 2.35 1.60 1.19 2.10 3.54
// 3.34 2.40 1.82 1.48 1.08 0.82 0.72 0.68. The tail is the quietest stretch by
// construction — the gesture there is a rotation, which moves headings and not
// bodies — and it was lifted from 0.50 to 0.78 by three passes: the coherent
// wander's amplitude and rate (see `alignShared`), the idle packet rate
// (PACKET_IDLE_MUL 2.2 -> 1.6), and landing the pull-back at f126 rather than
// f114 so the zoom is still opening under "highly aligned" and the creep past
// f154 is real.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//   * THE SEAT RESOLVES AT SCREEN y 434, NOT 330, and the formation's centre at
//     974 rather than 900 — the whole composition is 74 px lower than briefed.
//     The seat's arrow is ARROW_LEN_PX = 230 from the ring centre, so a ring
//     centre at 330 puts the arrow's TIP at screen y 100, which is 100 px
//     outside the caption-safe band the same brief asks for. 433 is the
//     smallest shift that clears it: measured on f153, arrow tip 204, ring
//     centre 434, blob centre 974, lowest comet 1284 — all inside 200-1400,
//     with the blob at screen x 189-889. The seat-to-blob distance on screen is
//     unchanged at 540 px, so K_WIDE still resolves to exactly 1.0.
//   * THE WHOLE FORMATION IS FRAMED AT f82, NOT f50, and that is a hard
//     geometric conflict in the brief rather than a choice. 700 world px of
//     crowd fits inside the 1080 frame only at k <= 1.23 with the band's 110 px
//     margins; and at k 1.23 the content centre needed to keep the seat's ring
//     off the top is local y 217, which puts the ring's BOTTOM EDGE exactly on
//     screen y 0 — the sliver the cut brief forbids outright. So the pull-back
//     keeps going through gesture 3 instead: measured, the blob's feathered
//     flanks bleed off both sides until f74 (x -20..1118 at f54, 6..1073 at
//     f70) and the formation is fully inside the frame from f82 (56..1027) with
//     the seat above it. One glide, and the two reveals land together — which is
//     better than the brief's split, because the wide shot then arrives WITH
//     the thing it was going to find rather than before it.
//   * THE SEAT ENTERS AT f69 AND SETTLES OVER f76-124, NOT f70 AND f82. The
//     entry is the brief's, on the frame after "we" (f63). The landing is not:
//     the ring's screen position, the zoom and the arrow's room are all the SAME
//     single monotone pull-back, so "landed" is not a frame but a settle — the
//     ring is fully clear of the top edge at f76, at 296 by f104, and at its
//     resolved 434 by f153. Forcing the resolved framing at f82 needs the frame
//     content to average 22 screen px/frame with an eased peak near 34; as
//     spread, the measured worst screen speed of anything in the cut is 21.3
//     px/frame (f33) against the set's 45 ceiling, and the camera's worst |dv|
//     is 1.263 px/f^2 against the 2.5 budget.
//   * THE CLOSE OPENING IS CENTRED ON THE BLOB, NOT INSIDE ITS FRONT. At k 1.90
//     the 164 world px between the blob's head edge (-298) and the seat ring's
//     bottom (-462) is 312 screen px, so the deepest the camera can look into
//     the front of the flock and still keep the seat fully off the top is a
//     content centre at local y = 10 — the blob's own centre. At anything more
//     forward the ring appears at the top edge, which the cut brief forbids
//     outright. What the opening buys instead is real: the blob fills screen y
//     227-1405 and bleeds off BOTH sides (700 world px at k 1.90 is 1330
//     against a 1080 frame, x -11..1319), the head agents where the wave starts
//     sit at 227-500, and the empty band above them is where the camera is
//     about to go looking.
//   * WAVE 3's PROPAGATION IS 0.31 OF WAVE 1's, which is the brief's third. "About a third of
//     gesture 1's speed" is taken as the ROTATION rate, which is exactly what
//     it is: gesture 1 turns an agent in a hashed 8-13 frames, and gesture 5's
//     underdamped step does not come inside 10 degrees of the arrow for
//     HUNT_SETTLE = 15.7 frames after arrival and is still hunting after that,
//     which is a third of the rate and then some. The wave's own speed is then
//     not free — it is pinned by the brief's other number for this gesture, "at
//     f138 roughly the front 40% are within 10 deg of the arrow" — so
//     WAVE3_SPEED is SOLVED for that count rather than asserted — and once the
//     five seeds moved to the rim in the director's pass the solve landed on
//     5.85 world px/frame against wave 1's 19.0, which IS a third. (It was 3.8
//     with the old centreline seeds: seeds buried in the crowd start the wave
//     closer to everything, so a slower wave gave the same count.) Measured:
//     36 of 90 agents (40.0%) within 10 degrees at f138, 57 at f153, last
//     arrival f179.3 — still travelling 25 frames past the end of the cut, so
//     it never completes and the question stays open, exactly as briefed.
//   * THE ARROW RISES rather than being there when the seat is found. Forced by
//     the frame; the arithmetic is in THE ARROW'S RISE below, and gesture 7 is
//     why it is an improvement rather than a loss.
//   * THE COHERENT WANDER AND THE IDLE PACKET RATE were both changed in
//     `alignShared` after this cut's first preview measured the held frames as
//     still; both are additions of this cut's own and the separation bound they
//     are solved against is unchanged. See THE FLOCK WANDER there.
//   * THIS CUT'S WEB IDLES AT 0.30, not the shared LINK_IDLE 0.40. The shared
//     ladder is untouched — the other three cuts import it — and this cut
//     divides it back out and multiplies its own in (`webOpacity`). At k 1 a
//     150-link web at 0.40 reads as a mesh laid OVER the crowd rather than as
//     texture under it. The lit end is still the shared 0.95.
//
// ---------------------------------------------------------------------------
// DIRECTOR'S PASS (mechanism, camera, timing and deviations all accepted; three
// fixes, all inside this component):
//   1. A LIT LINK IS A BAND, NOT A STATE. 6 up / 7 hold / 15 down left ~38 of
//      the 150 links standing at 0.95 behind the wavefront through gesture 5 —
//      a wire cage over comets that are dropping to DEEP at that exact moment.
//      Now 5 up / 12 down with no hold, measured 62 lit at f30 (wave 1 is a
//      broad front crossing the whole crowd, which is the gesture), then 5 at
//      f104, 27 at f118, 18 at f130, 19 at f153 — a ridge travelling through a
//      quiet web. Plus the 0.30 idle above, so the comets are the brightest
//      orange thing on every wide frame.
//   2. THE FIVE WHITE LINKS LAND ON THE FRONT RIM, one per column across the
//      head, and no link passes over another comet (worst clearance 22.5 px,
//      asserted every drawn frame). See the gesture-4 block for why nearest-to-
//      the-seat walked into the crowd instead of across its rim.
//   3. THE WHITE LINKS SETTLE to INK_LO once their agent has stopped turning,
//      packets still running: measured 1.00 at f92 and f104, 1.00/0.59 at f118,
//      0.68/0.55 at f130, 0.55 from f138 on.
//   * NO iconShadow ON THE AGENTS OR THEIR LINKS. 90 comets and 150 links each
//     with their own drop-shadow is the haze `fieldShared` warns about; they
//     take the one global shadow. The white ink — the seat, its arrow, its five
//     links — takes iconShadow(k) as the set requires.
// ---------------------------------------------------------------------------

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
  beats: z.object({
    weve: z.number(),
    agents: z.number(),
    superr: z.number(),
    aligned1: z.number(),
    each: z.number(),
    other: z.number(),
    can: z.number(),
    similar: z.number(),
    techniques: z.number(),
    highly: z.number(),
    aligned2: z.number(),
    people: z.number(),
    end: z.number(), // speech ends; tail to 154
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
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
    weve: 0,
    agents: 17,
    superr: 38,
    aligned1: 43,
    each: 49,
    other: 52,
    can: 60,
    similar: 80,
    techniques: 86,
    highly: 118,
    aligned2: 123,
    people: 130,
    end: 138,
  },
});

// ---------------------------------------------------------------------------
// THE FORMATION, and the two points every wave in the cut is keyed on.
// ---------------------------------------------------------------------------
const N_AGENTS = 90;
export const FORM = buildFormation({ n: N_AGENTS, seed: 3 });
const SEATS = FORM.seats;

/** The user seat, in formation-local coords: straight above the blob's centre. */
export const SEAT_PT = { x: 0, y: -SEAT_GAP };
/** The blob's head — where gesture 1's wave is born. */
export const HEAD_PT = { x: 0, y: -BLOB_RY };

const DIST_HEAD = FORM.distFrom(HEAD_PT).dist;
const DIST_HEAD_MAX = Math.max(...DIST_HEAD);

// --- gesture 1: the turn as one ---------------------------------------------
const H_LEFT = (-130 * Math.PI) / 180; // up-left: where the flock is going at f0
const H_RIGHT = (-50 * Math.PI) / 180; // up-right: where it turns to
export const WAVE1_F0 = 6;
/** Front to back over WAVE1_SPAN frames: last arrival f38, and the slowest
 *  rotation (13 f) then completes at f51, inside "other" (which ends f60). */
const WAVE1_SPAN = 32;
export const WAVE1_SPEED = DIST_HEAD_MAX / WAVE1_SPAN;
const WAVE1_JITTER = 1.5;

export const A1: number[] = SEATS.map((s, i) =>
  waveArrival(DIST_HEAD[i], s.i, WAVE1_F0, WAVE1_SPEED, WAVE1_JITTER),
);

// --- gesture 4: the five white links ----------------------------------------
// THE FIVE FRONT AGENTS ARE FIVE RIM AGENTS, ONE PER COLUMN. Taking the five
// seats simply NEAREST the seat picks along the blob's centreline, because the
// seat is straight above it: a seat at local (0, -250) is 290 from the seat
// while one out at (300, -150) is 480, so the near set walks INTO the crowd
// instead of across its rim, and the middle link then dives deep into the blob
// and crosses whatever it passes.
//
// So the head's width is cut into FAN_COLS equal columns and each column offers
// its MOST FORWARD seat — which, with the seat directly above, is also that
// column's nearest to the seat. That is a rim by construction and it is spread
// across the head by construction.
//
// Then the OCCLUSION rule: a white link may not pass over another comet. The
// first candidate in a column whose segment from the ring clears every other
// body by CLEAR_R is taken; if none does, the column falls back to its most
// forward seat and the assertion below fails loudly rather than shipping a
// crossing. The clearance carries the wander's own amplitude, so a link that
// clears at rest cannot be crossed by a drifting neighbour later — asserted on
// every frame the link is drawn.
const FAN_COLS = 5;
const FAN_SPAN = 0.82; // of BLOB_RX, so the outermost column is inside the rim
/** How far a white link must stay from any other comet's centre. */
const CLEAR_R = (r: number) => r + DOT_R * 1.15;
/** ...and the extra the PICK demands on top of it, because the pick is made on
 *  the seats and the wander then drifts bodies around afterwards. Without it the
 *  chosen fan cleared at rest and a neighbour slid 1.4 px inside a link by f91.
 *  The assertion below still checks the real CLEAR_R on every drawn frame. */
const PICK_ROOM = 9;

/** Distance from point p to the segment a-b. */
const segDist = (
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L2 = dx * dx + dy * dy;
  const t = L2 <= 0 ? 0 : clamp01(((p.x - a.x) * dx + (p.y - a.y) * dy) / L2);
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
};

export const FRONT: number[] = (() => {
  const out: number[] = [];
  for (let c = 0; c < FAN_COLS; c++) {
    const x0 = -FAN_SPAN * BLOB_RX + ((2 * FAN_SPAN * BLOB_RX) / FAN_COLS) * c;
    const x1 = x0 + (2 * FAN_SPAN * BLOB_RX) / FAN_COLS;
    const col = SEATS.map((s, i) => ({ i, s }))
      .filter((q) => q.s.x >= x0 && q.s.x < x1)
      .sort((a, b) => a.s.y - b.s.y);
    if (col.length === 0) continue;
    // every OTHER comet, including the other columns' targets: a link may not
    // pass over any of them, which makes the test order-independent
    const clear = col.find((cand) =>
      SEATS.every(
        (t, j) => j === cand.i || segDist(t, SEAT_PT, cand.s) >= CLEAR_R(t.r) + PICK_ROOM,
      ),
    );
    out.push((clear ?? col[0]).i);
  }
  // left to right, so the fan is drawn in the order it reads
  return out.sort((a, b) => SEATS[a].x - SEATS[b].x);
})();

export const LINK_DRAW_F = 12; // frames a white link takes to draw
/** Landing frames 92, 95, 98, 101, 104, dealt to the five by hash — so each
 *  lands on its own frame and which agent gets which is not the reading order. */
export const LAND: number[] = (() => {
  const slots = [92, 95, 98, 101, 104];
  const order = FRONT.map((i, j) => ({ j, h: hash(SEATS[i].i, 77) })).sort((a, b) => a.h - b.h);
  const out = new Array<number>(FRONT.length);
  order.forEach((o, r) => {
    out[o.j] = slots[r];
  });
  return out;
})();

// --- gesture 5: the loose turn ----------------------------------------------
/** The overshoot, as a fraction of the 40 degree turn from -50 to -90: 12 deg. */
const HUNT_OVER = 12 / 40;
/** Frames from arrival to the first overshoot peak. */
const HUNT_PEAK = 13;
/** Frames from arrival before the agent is permanently inside 10 deg of the
 *  arrow — 10/40 of the turn. Measured off the step's own envelope. */
export const HUNT_SETTLE = huntSettle(HUNT_OVER, HUNT_PEAK, 10 / 40);
const WAVE3_JITTER = 2.0;

/** WAVE3_SPEED is SOLVED, not asserted: the brief's number for this gesture is
 *  "at f138 roughly the front 40% are within 10 deg of the arrow", and with the
 *  rotation fixed by HUNT_OVER / HUNT_PEAK the wave's speed is the only free
 *  variable left. Scanned over 3..30 world px/frame for the speed whose count
 *  at f138 is closest to 40% of the crowd. */
const arrivalsAt = (speed: number) =>
  SEATS.map((s) => {
    let best = Infinity;
    FRONT.forEach((fi, j) => {
      const d = Math.hypot(s.x - SEATS[fi].x, s.y - SEATS[fi].y);
      best = Math.min(best, LAND[j] + d / speed);
    });
    return best + (hash(s.i, 62) - 0.5) * 2 * WAVE3_JITTER;
  });

export const WAVE3_SPEED = (() => {
  const want = Math.round(0.4 * SEATS.length);
  let best = 8;
  let bestErr = Infinity;
  for (let v = 3; v <= 30.001; v += 0.05) {
    const a = arrivalsAt(v);
    let n = 0;
    for (let i = 0; i < a.length; i++) {
      const t = 138 - a[i];
      if (t <= 0) continue;
      // within 10 deg of the arrow: read the real heading, hunting included
      const u = huntStep(t, HUNT_OVER, HUNT_PEAK);
      if (Math.abs((1 - u) * 40) <= 10) n++;
    }
    const err = Math.abs(n - want);
    if (err < bestErr) {
      bestErr = err;
      best = v;
    }
    if (err === 0) break;
  }
  return best;
})();

export const A3: number[] = arrivalsAt(WAVE3_SPEED);

/** Frames over which an agent's tone falls ripe -> deep once wave 3 reaches it:
 *  it has left tight alignment, and it leaves it as slowly as it turns. */
const TONE3_F = 30;

// ---------------------------------------------------------------------------
// AN AGENT, at a frame. Pure, and the same function feeds the drawn frame, the
// mean-heading table, the separation assertion and the speed check — so nothing
// measured here can disagree with what is rendered.
// ---------------------------------------------------------------------------
export type Live = { x: number; y: number; r: number; hd: number; tone: number };

/** The heading WITHOUT the per-agent jitter: the base the mean is taken of. */
export const headingBase = (i: number, f: number) => {
  const s = SEATS[i];
  const u1 = smoothstep(clamp01((f - A1[i]) / s.rotF));
  const base = turn(H_LEFT, H_RIGHT, u1);
  const u3 = huntStep(f - A3[i], HUNT_OVER, HUNT_PEAK);
  return base + arcTo(base, H_USER) * u3;
};

/** The per-agent cap on the INDEPENDENT half of the wander, measured once off
 *  the formation's own clearances — see THE FLOCK WANDER in `alignShared`. */
const WANDER_CAP = flockWanderCaps(FORM);

export const agentAt = (i: number, f: number): Live => {
  const s = SEATS[i];
  const w = flockWander(s, f, WANDER_CAP[i]);
  const u1 = smoothstep(clamp01((f - A1[i]) / s.rotF));
  const e3 = smoothstep(clamp01((f - A3[i]) / TONE3_F));
  return {
    x: s.x + w.dx,
    y: s.y + w.dy,
    r: s.r,
    hd: headingBase(i, f) + w.da,
    tone: u1 * (1 - e3),
  };
};

// ---------------------------------------------------------------------------
// THE MEAN HEADING, and the world's travel along it. The flock's course is the
// circular mean of its members' headings — which depends on nothing but the
// waves, so it can be tabulated once and the grid slide cannot drift from what
// the noses are doing.
// ---------------------------------------------------------------------------
const TRACK_LAST = DURATION + 16;

export const MEAN_H: number[] = Array.from({ length: TRACK_LAST + 2 }, (_, f) =>
  meanAngle(SEATS.map((_, i) => headingBase(i, f))),
);

/** The world offset at each frame, integrated along the mean heading. Only the
 *  GRID reads it: the scene itself is drawn in formation-local coordinates and
 *  the camera is keyed there too, so the formation cannot drift out of its own
 *  framing, while the background sees the whole journey. */
export const TRAVEL: { x: number; y: number }[] = (() => {
  const out = [{ x: 0, y: 0 }];
  for (let f = 1; f <= TRACK_LAST + 1; f++) {
    const h = MEAN_H[Math.max(0, f - 1)];
    out.push({
      x: out[f - 1].x + Math.cos(h) * SLIDE_V,
      y: out[f - 1].y + Math.sin(h) * SLIDE_V,
    });
  }
  return out;
})();
const travelAt = (f: number) => TRAVEL[Math.max(0, Math.min(TRACK_LAST + 1, Math.round(f)))];

// ---------------------------------------------------------------------------
// THE CAMERA. ONE monotone pull-back from k 1.90 to K_WIDE across the whole
// cut, with the content centre travelling DOWN the wave through gesture 1 and
// then UP to find the seat — knots on one Hermite, a key per frame, through the
// shared damper. Written in FORMATION-LOCAL coordinates.
//
// The framing arithmetic, which every knot below was chosen with:
//     screen y of local p.y = 835 + (p.y - C.y) * k
// so a ring centre at local -SEAT_GAP and the blob centre at local 0 are
// exactly SEAT_GAP * k apart on screen, and the resolved 435 / 975 fixes
// k = 540 / 540 = 1. The seat is OFF-FRAME while
//     835 + (-SEAT_GAP + SEAT_R - C.y) * k <= -30
// (ring bottom 30 px clear of the top edge, so a sliver cannot appear under the
// camera's sway), which is what forces the centre DOWN as the zoom opens: at
// k 1.90 it needs C.y >= 8, at 1.42 it needs C.y >= 154.
//
// The last knot is SOLVED so the DAMPED camera reads exactly K_WIDE and a
// content centre of (0, -140) on f154 — k first (it does not depend on the
// centres), then each centre by one secant, which is exact because each is
// affine in its own key.
// ---------------------------------------------------------------------------
const C_RESOLVED = { x: 0, y: -144 };
const K_RESOLVED = 1.0;
const K_OPEN = 1.9;

const KNOTS = (kEnd: number, xEnd: number, yEnd: number) => [
  { f: 0, k: K_OPEN, x: -60, y: 10 },
  { f: 22, k: 1.78, x: -34, y: 45 },
  { f: 46, k: 1.64, x: -12, y: 85 },
  { f: 60, k: 1.58, x: 0, y: 100 },
  { f: 86, k: 1.3, x: 0, y: -40 },
  { f: 108, k: 1.14, x: 0, y: -100 },
  { f: 154, k: kEnd, x: xEnd, y: yEnd },
  // The tail's own creep, and it is deliberately BIG for a creep: the camera
  // keeps opening and drifting past f154 so that inside the frames the edit
  // uses it is still moving. Measured on the rendered preview (mean absolute
  // frame difference), the last 30 frames ran at 0.53 against a 1.73 mean with
  // the creep at -26 / -0.03; the whole of the tail's motion is the wave, the
  // packets and this, and the wave moves nothing but headings.
  { f: TRACK_LAST + 16, k: kEnd - 0.05, x: xEnd, y: yEnd - 64 },
];

const trackOf = (kEnd: number, xEnd: number, yEnd: number) =>
  camKnots3(KNOTS(kEnd, xEnd, yEnd), TRACK_LAST + 16);

const secant = (f: (v: number) => number, target: number, a: number, b: number) =>
  a + ((target - f(a)) * (b - a)) / (f(b) - f(a));

export const K_END = secant(
  (kEnd) => {
    const t = trackOf(kEnd, C_RESOLVED.x, C_RESOLVED.y);
    return runCam3(DURATION, t.CX, t.CY, t.K).k;
  },
  K_RESOLVED,
  K_RESOLVED * 0.9,
  K_RESOLVED * 1.05,
);

const Y_END = secant(
  (yEnd) => {
    const t = trackOf(K_END, C_RESOLVED.x, yEnd);
    const c = runCam3(DURATION, t.CX, t.CY, t.K);
    return c.cy - CAM_LIFT / c.k;
  },
  C_RESOLVED.y,
  C_RESOLVED.y - 200,
  C_RESOLVED.y + 200,
);

const X_END = secant(
  (xEnd) => {
    const t = trackOf(K_END, xEnd, Y_END);
    return runCam3(DURATION, t.CX, t.CY, t.K).cx;
  },
  C_RESOLVED.x,
  C_RESOLVED.x - 200,
  C_RESOLVED.x + 200,
);

export const CAM = trackOf(K_END, X_END, Y_END);

/** The camera at every frame, sway included: the table every measurement in
 *  STATS is taken against, and the same one the component draws with. */
export const CAM_AT_F: { cx: number; cy: number; k: number }[] = Array.from(
  { length: TRACK_LAST + 2 },
  (_, f) => {
    const c = runCam3(f, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f);
    return { cx: c.cx + d.dx, cy: c.cy + d.dy, k: c.k };
  },
);
export const camAt = (f: number) => CAM_AT_F[Math.max(0, Math.min(TRACK_LAST + 1, Math.round(f)))];

/** A formation-local point on screen at frame f. */
export const screenAt = (f: number, x: number, y: number) => {
  const c = camAt(f);
  return { x: FRAME_W / 2 + (x - c.cx) * c.k, y: FRAME_H / 2 + (y - c.cy) * c.k };
};

// ---------------------------------------------------------------------------
// THE LINKS. An accent link lights when the wave reaches the LATER of its two
// endpoints — that is the link "feeding" that agent — and eases back to idle;
// the same pulse, on the same links, carries gesture 5's wave. Nothing about a
// link is keyed: `live` is read off the arrival times the rotations are read
// off, so a retime moves both together.
// ---------------------------------------------------------------------------
// A LIT LINK IS A TRAVELLING BAND, not a state. It rises to LINK_LIVE as the
// wave CROSSES it and is back at idle PULSE_DOWN frames later — no hold, so at
// no point is a quarter of the web standing bright behind the wavefront. The
// old shape (6 f up, 7 f hold, 15 f down = a 28 f window per link) put ~38 of
// the 150 links at 0.95 on any frame of gesture 5, which read as a wire cage
// over comets that are dropping to DEEP at exactly that moment. At 5 up and 12
// down it is ~11, and what you see is a ridge moving through the web.
const PULSE_LEAD = 5; // frames a link lights before its agent starts turning
const PULSE_DOWN = 12;

const pulse = (f: number, t0: number) =>
  f < t0
    ? smoothstep(clamp01((f - (t0 - PULSE_LEAD)) / PULSE_LEAD))
    : 1 - smoothstep(clamp01((f - t0) / PULSE_DOWN));

// THE WEB'S OWN LADDER. `Link` carries the clip's shared LINK_IDLE 0.4 ->
// LINK_LIVE 0.95, which the other three cuts import, so it is not touched. This
// cut divides it back out and multiplies its own in: on the wide frames at k 1
// the blob is 90 comets over 150 links and an idle 0.4 web still reads as a
// mesh laid over the crowd rather than as texture under it, so THIS cut's idle
// is 0.30. The lit end stays at the shared 0.95 — the band is what changed, not
// the brightness of the wavefront.
const WEB_IDLE = 0.3;
const webOpacity = (lv: number) =>
  lerp(WEB_IDLE, LINK_LIVE, clamp01(lv)) / lerp(LINK_IDLE, LINK_LIVE, clamp01(lv));

/** For each accent link, the arrival time of its LATER endpoint under each
 *  wave. Precomputed: 150 links x 2. */
export const LINK_T: { a: number; b: number; t1: number; t3: number }[] = FORM.links.map(
  ([a, b]) => ({
    a,
    b,
    t1: Math.max(A1[a], A1[b]),
    t3: Math.max(A3[a], A3[b]),
  }),
);

export const linkLive = (li: number, f: number) => {
  const t = LINK_T[li];
  return Math.max(pulse(f, t.t1), pulse(f, t.t3));
};

// THE WHITE LINKS SETTLE. A seat link is INK_HI while the agent on the end of
// it is TURNING — that is what it is doing something about — and then eases to
// INK_LO over WHITE_SETTLE_F with its packets still running, so the last third
// of the cut puts the eye on the turning flock and not on five bright white
// lines. "Turning" is read off the agent's own underdamped step: it starts at
// A3 and is inside 10 degrees of the arrow HUNT_SETTLE frames later.
const WHITE_SETTLE_F = 14;
export const whiteInk = (ai: number, f: number) =>
  lerp(INK_HI, INK_LO, smoothstep(clamp01((f - (A3[ai] + HUNT_SETTLE)) / WHITE_SETTLE_F)));
/** Divided back out of `Link`'s shared ladder the same way the web is, so the
 *  drawn opacity IS `whiteInk` while `live` still drives the packet rate. */
export const whiteOpacity = (ai: number, f: number, lv: number) =>
  whiteInk(ai, f) / lerp(LINK_IDLE, LINK_LIVE, clamp01(lv));

/** A white link's two ends: the seat ring's edge, and the agent's body edge. */
export const seatLinkEnds = (agent: Live) => {
  const dx = agent.x - SEAT_PT.x;
  const dy = agent.y - SEAT_PT.y;
  const L = Math.max(1e-6, Math.hypot(dx, dy));
  const ux = dx / L;
  const uy = dy / L;
  const r0 = SEAT_R + STROKE_W * 0.6;
  const r1 = L - (agent.r + DOT_R * 0.7);
  return {
    from: { x: SEAT_PT.x + ux * r0, y: SEAT_PT.y + uy * r0 },
    to: { x: SEAT_PT.x + ux * r1, y: SEAT_PT.y + uy * r1 },
  };
};

// ---------------------------------------------------------------------------
// THE ARROW'S RISE. The seat is FOUND as a ring with a person in it, and the
// arrow — what that person WANTS — rises out of the ring over ARROW_F0 ..
// ARROW_F1, completing six frames before "people" (f130).
//
// It is not decoration and it is not a second version of the gesture: it is
// forced by the frame. The arrow reaches ARROW_LEN above the ring centre, so at
// frame f it needs ARROW_LEN * k of room above the ring, and the ring does not
// have it until the pull-back is nearly done — measured, the ring sits at screen
// y 85 on f82 (the frame the brief calls "landed") against 320 px of arrow at
// that zoom, so a full arrow there is three quarters off the top of the frame
// and its HEAD, which is the only thing that makes it an arrow rather than a
// stalk, is never on screen at all. Growing it with the room the camera makes
// also puts the chain in the right order: the white links land, what the person
// wants becomes legible, and then the flock starts turning to it.
export const ARROW_F0 = 94;
export const ARROW_F1 = 124;
export const arrowGrow = (f: number) => smoothstep(clamp01((f - ARROW_F0) / (ARROW_F1 - ARROW_F0)));

const AlignedWithPeople: React.FC<Props> = ({
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

  // -- camera ----------------------------------------------------------------
  const cam = runCam3(frame, CAM.CX, CAM.CY, CAM.K);
  const d = sway(frame);
  const cx = cam.cx + d.dx;
  const cy = cam.cy + d.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the grid's own camera: the local one plus the world's travel, so the
  //    background carries the whole journey while the scene holds ----------
  const tr = travelAt(frame);
  const tr0 = travelAt(0);

  // -- the agents ------------------------------------------------------------
  const agents = SEATS.map((_, i) => agentAt(i, frame));

  // -- the seat's arrow and the ring: both simply exist; the CAMERA is what
  //    finds them, which is the gesture ------------------------------------
  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy + tr.y}
        cyRest={CAM.CY[0] + tr0.y}
        cx={cx + tr.x}
        cxRest={CAM.CX[0] + tr0.x}
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
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the agents' own links, under the crowd: idle at 0.4 with sparse
                packets, lighting to 0.95 where a wave is passing */}
            {LINK_T.map((t, li) => (
              <Link
                key={`a${li}`}
                frame={frame}
                k={k}
                kind="agent"
                from={{ x: agents[t.a].x, y: agents[t.a].y }}
                to={{ x: agents[t.b].x, y: agents[t.b].y }}
                live={linkLive(li, frame)}
                opacity={webOpacity(linkLive(li, frame))}
                phase={hash(li, 81) * 30}
              />
            ))}

            {/* the agents: one solid comet each, state carried by tone */}
            {agents.map((a, i) => (
              <Comet
                key={`c${i}`}
                x={a.x}
                y={a.y}
                heading={a.hd}
                r={a.r}
                tone={a.tone}
                tipMul={TIP_LOOSE + (TIP_TIGHT - TIP_LOOSE) * a.tone}
              />
            ))}

            {/* the SAME link, in white: the seat reaching down to the five
                front agents. Same width, same packets, same geometry. */}
            <g style={{ filter: icon }}>
              {FRONT.map((ai, j) => {
                const ends = seatLinkEnds(agents[ai]);
                const lv = clamp01((frame - (LAND[j] - 6)) / 10);
                return (
                  <Link
                    key={`w${j}`}
                    frame={frame}
                    k={k}
                    kind="seat"
                    from={ends.from}
                    to={ends.to}
                    live={lv}
                    opacity={whiteOpacity(ai, frame, lv)}
                    progress={clamp01((frame - (LAND[j] - LINK_DRAW_F)) / LINK_DRAW_F)}
                    phase={hash(j, 83) * 20}
                  />
                );
              })}
            </g>
          </svg>

          {/* the user seat: person.png must be a Remotion <Img>, so it is a DOM
              element in the world div rather than an <image> in the svg */}
          <UserSeat
            k={k}
            x={SEAT_PT.x}
            y={SEAT_PT.y}
            frame={frame}
            occupant="person"
            arrow={arrowGrow(frame)}
            opacity={INK_HI}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AlignedWithPeople;

// ---------------------------------------------------------------------------
// The numbers the cut is built on — measured off the same functions that draw
// it, never asserted. The assertions the cut brief names are here too: they
// THROW at module scope, so a violation cannot render.
// ---------------------------------------------------------------------------
const ringBottomScreen = (f: number) => screenAt(f, SEAT_PT.x, SEAT_PT.y + SEAT_R).y;

const MEASURE = (() => {
  let minSep = Infinity;
  let minSepF = -1;
  let maxSpeed = 0;
  let maxSpeedF = -1;
  let lowestInk = -Infinity;
  let lowestInkF = -1;
  let wideLowest = -Infinity;
  let seatEnter = -1;
  let energyMin = Infinity;
  let energyMinF = -1;
  let energySum = 0;
  const K_WIDE_ENOUGH = 1.1; // "the wide frames": the resolved framing and after

  let prev: { x: number; y: number }[] | null = null;
  for (let f = 0; f <= DURATION; f++) {
    const a = SEATS.map((_, i) => agentAt(i, f));
    const c = camAt(f);
    const scr = a.map((q) => screenAt(f, q.x, q.y));

    // -- no two comets closer than 2.6 mean radii, in WORLD px --------------
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j < a.length; j++) {
        const dd =
          Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y) / (0.5 * (a[i].r + a[j].r));
        if (dd < minSep) {
          minSep = dd;
          minSepF = f;
        }
      }
    }

    // -- the lowest ink on screen: a comet's TAIL runs behind its nose ------
    for (let i = 0; i < a.length; i++) {
      const L = 2 * a[i].r * (TIP_LOOSE + (TIP_TIGHT - TIP_LOOSE) * a[i].tone);
      const ty2 = a[i].y - Math.sin(a[i].hd) * L;
      const low = Math.max(
        scr[i].y + a[i].r * c.k,
        screenAt(f, a[i].x, ty2).y + a[i].r * 0.3 * c.k,
      );
      if (low > lowestInk) {
        lowestInk = low;
        lowestInkF = f;
      }
      if (c.k <= K_WIDE_ENOUGH) wideLowest = Math.max(wideLowest, low);
    }

    // -- screen speed of everything that is drawn. A comet's TIP is a probe
    //    as well as its body: a rotation moves no body at all and is most of
    //    what happens through gesture 5, so a body-only energy reads the whole
    //    back half of the cut as dead when it is turning. ------------------
    const probes = [
      ...scr,
      ...a.map((q) => {
        const L = 2 * q.r * (TIP_LOOSE + (TIP_TIGHT - TIP_LOOSE) * q.tone);
        return screenAt(f, q.x - Math.cos(q.hd) * L, q.y - Math.sin(q.hd) * L);
      }),
      screenAt(f, SEAT_PT.x, SEAT_PT.y),
      screenAt(f, SEAT_PT.x, SEAT_PT.y - ARROW_LEN),
      screenAt(f, -BLOB_RX, BLOB_RY),
      screenAt(f, BLOB_RX, -BLOB_RY),
    ];
    if (prev) {
      let e = 0;
      for (let i = 0; i < probes.length; i++) {
        const v = Math.hypot(probes[i].x - prev[i].x, probes[i].y - prev[i].y);
        if (v > maxSpeed) {
          maxSpeed = v;
          maxSpeedF = f;
        }
        e += v;
      }
      e /= probes.length;
      // the ground is the other half of the motion floor, and it never stops
      const tA = travelAt(f - 1);
      const tB = travelAt(f);
      e += Math.hypot(tB.x - tA.x, tB.y - tA.y) * c.k * PARALLAX;
      energySum += e;
      if (e < energyMin) {
        energyMin = e;
        energyMinF = f;
      }
    }
    prev = probes;

    // -- when the seat's ring first shows -----------------------------------
    if (seatEnter < 0 && ringBottomScreen(f) > 0) seatEnter = f;
  }

  return {
    minSep,
    minSepF,
    maxSpeed,
    maxSpeedF,
    lowestInk,
    lowestInkF,
    wideLowest,
    seatEnter,
    energyMin,
    energyMinF,
    energyMean: energySum / DURATION,
  };
})();

// The cut brief's three assertions. They run once, at module scope.
if (MEASURE.minSep < 2.6) {
  throw new Error(
    `AlignedWithPeople: two comets ${MEASURE.minSep.toFixed(2)} mean radii apart at f${
      MEASURE.minSepF
    } (floor 2.6)`,
  );
}
if (MEASURE.wideLowest > 1400) {
  throw new Error(
    `AlignedWithPeople: ink at screen y ${MEASURE.wideLowest.toFixed(0)} on a wide frame (floor 1400)`,
  );
}
if (MEASURE.maxSpeed > 45) {
  throw new Error(
    `AlignedWithPeople: ${MEASURE.maxSpeed.toFixed(1)} screen px/frame at f${
      MEASURE.maxSpeedF
    } (ceiling 45)`,
  );
}
// NO WHITE LINK PASSES OVER A COMET, on any frame any of them is drawn — the
// rim pick above solves it at rest and this proves it under the wander, which
// moves a body after the pick is made. Measured against each comet's own body
// radius plus CLEAR_R's margin, on the segment actually drawn.
const WHITE_CLEAR = (() => {
  let worst = Infinity;
  let worstF = -1;
  for (let f = LAND[0] - LINK_DRAW_F; f <= DURATION; f++) {
    const a = SEATS.map((_, i) => agentAt(i, f));
    FRONT.forEach((ai, j) => {
      if (f < LAND[j] - LINK_DRAW_F) return;
      const ends = seatLinkEnds(a[ai]);
      const p = clamp01((f - (LAND[j] - LINK_DRAW_F)) / LINK_DRAW_F);
      const tip = { x: lerp(ends.from.x, ends.to.x, p), y: lerp(ends.from.y, ends.to.y, p) };
      a.forEach((q, i) => {
        if (i === ai) return;
        const slack = segDist(q, ends.from, tip) - CLEAR_R(q.r);
        if (slack < worst) {
          worst = slack;
          worstF = f;
        }
      });
    });
  }
  return [worst, worstF] as [number, number];
})();
if (WHITE_CLEAR[0] < 0) {
  throw new Error(
    `AlignedWithPeople: a white link passes ${(-WHITE_CLEAR[0]).toFixed(1)} px inside a comet at f${WHITE_CLEAR[1]}`,
  );
}
// The arrow's TIP is never clipped by the top of the frame once it exists: an
// arrow whose head is off screen is a stalk, not an arrow.
for (let f = 0; f <= DURATION; f++) {
  const g = arrowGrow(f);
  if (g <= 0) continue;
  const tip = screenAt(f, SEAT_PT.x, SEAT_PT.y - ARROW_LEN * g).y;
  if (tip < 8) {
    throw new Error(
      `AlignedWithPeople: arrow tip at screen y ${tip.toFixed(0)} on f${f} (grow ${g.toFixed(2)})`,
    );
  }
}
// The seat and its arrow are FULLY off-frame until gesture 2 — not a sliver at
// the edge. Checked on the ring's BOTTOM, which is its lowest point.
for (let f = 0; f <= 60; f++) {
  const rb = ringBottomScreen(f);
  if (rb > -10) {
    throw new Error(`AlignedWithPeople: seat ring at screen y ${rb.toFixed(0)} on f${f}`);
  }
}

/** How many agents are within `deg` of the user's arrow at frame f. */
export const alignedWithUser = (f: number, deg = 10) =>
  SEATS.filter((_, i) => Math.abs((arcTo(headingBase(i, f), H_USER) * 180) / Math.PI) <= deg)
    .length;

/** How many agents are within `deg` of EACH OTHER's mean heading at frame f. */
export const alignedWithEachOther = (f: number, deg = 10) => {
  const m = MEAN_H[Math.max(0, Math.min(TRACK_LAST, Math.round(f)))];
  return SEATS.filter((_, i) => Math.abs((arcTo(headingBase(i, f), m) * 180) / Math.PI) <= deg)
    .length;
};

export const BEATS = defaultProps.beats;
export const STATS = {
  duration: DURATION,
  agents: SEATS.length,
  agentLinks: FORM.links.length,
  landFrames: LAND,
  kOpen: Number(CAM.K[0].toFixed(4)),
  kEnd: Number(K_END.toFixed(4)),
  kAt: [0, 22, 46, 54, 69, 80, 88, 112, 138, 154].map((f) => [
    f,
    Number(camAt(f).k.toFixed(3)),
  ]),
  /** the damped content centre, in formation-local px */
  centreAt: [0, 46, 54, 69, 88, 138, 154].map((f) => {
    const c = runCam3(f, CAM.CX, CAM.CY, CAM.K);
    return [f, Number((c.cy - CAM_LIFT / c.k).toFixed(1))];
  }),
  /** the resolved framing, in screen px */
  arrowTipAt: [94, 104, 112, 118, 124, 130, 138, 153].map((f) => [
    f,
    Number(arrowGrow(f).toFixed(2)),
    Number(screenAt(f, SEAT_PT.x, SEAT_PT.y - ARROW_LEN * arrowGrow(f)).y.toFixed(0)),
  ]),
  resolved: {
    ringCentreY: Number(screenAt(DURATION, SEAT_PT.x, SEAT_PT.y).y.toFixed(0)),
    arrowTipY: Number(screenAt(DURATION, SEAT_PT.x, SEAT_PT.y - ARROW_LEN).y.toFixed(0)),
    blobCentreY: Number(screenAt(DURATION, 0, 0).y.toFixed(0)),
    blobLeftX: Number(screenAt(DURATION, -BLOB_RX, 0).x.toFixed(0)),
    blobRightX: Number(screenAt(DURATION, BLOB_RX, 0).x.toFixed(0)),
  },
  /** the damper's worst acceleration, on four fixed local probes */
  camMaxDv: (() => {
    const probes = [
      { x: 0, y: 0 },
      { x: 0, y: -SEAT_GAP },
      { x: -BLOB_RX, y: BLOB_RY },
      { x: BLOB_RX, y: -BLOB_RY },
    ];
    let worst = 0;
    let worstF = -1;
    for (let f = 2; f <= DURATION; f++) {
      for (const p of probes) {
        const a = screenAt(f - 2, p.x, p.y);
        const b = screenAt(f - 1, p.x, p.y);
        const c = screenAt(f, p.x, p.y);
        const dv = Math.hypot(c.x - 2 * b.x + a.x, c.y - 2 * b.y + a.y);
        if (dv > worst) {
          worst = dv;
          worstF = f;
        }
      }
    }
    return [Number(worst.toFixed(3)), worstF];
  })(),
  wave1: {
    f0: WAVE1_F0,
    speed: Number(WAVE1_SPEED.toFixed(2)),
    lastArrival: Number(Math.max(...A1).toFixed(1)),
    lastComplete: Number(
      Math.max(...SEATS.map((s, i) => A1[i] + s.rotF)).toFixed(1),
    ),
  },
  wave3: {
    speed: Number(WAVE3_SPEED.toFixed(2)),
    huntOverDeg: Number((HUNT_OVER * 40).toFixed(1)),
    huntSettleF: Number(HUNT_SETTLE.toFixed(1)),
    firstArrival: Number(Math.min(...A3).toFixed(1)),
    lastArrival: Number(Math.max(...A3).toFixed(1)),
    arrivedByEnd: A3.filter((a) => a <= DURATION).length,
  },
  alignedEachOther: [30, 43, 52, 60, 80].map((f) => [f, alignedWithEachOther(f)]),
  alignedWithUser: [104, 118, 130, 138, 154].map((f) => [f, alignedWithUser(f)]),
  alignedWithUserPctAt138: Number(((alignedWithUser(138) / SEATS.length) * 100).toFixed(1)),
  front: FRONT.map((i) => [Number(SEATS[i].x.toFixed(0)), Number(SEATS[i].y.toFixed(0))]),
  whiteLinkClearancePx: [Number(WHITE_CLEAR[0].toFixed(1)), WHITE_CLEAR[1]],
  whiteInkAt: [92, 104, 118, 130, 138, 153].map((f) => [
    f,
    Number(Math.max(...FRONT.map((ai) => whiteInk(ai, f))).toFixed(2)),
    Number(Math.min(...FRONT.map((ai) => whiteInk(ai, f))).toFixed(2)),
  ]),
  litLinksAt: [30, 43, 104, 118, 130, 138, 153].map((f) => [
    f,
    LINK_T.filter((_, li) => linkLive(li, f) > 0.5).length,
  ]),
  minCometSep: [Number(MEASURE.minSep.toFixed(2)), MEASURE.minSepF],
  maxScreenSpeed: [Number(MEASURE.maxSpeed.toFixed(1)), MEASURE.maxSpeedF],
  lowestInkY: [Number(MEASURE.lowestInk.toFixed(0)), MEASURE.lowestInkF],
  lowestInkYWide: Number(MEASURE.wideLowest.toFixed(0)),
  seatEntersFrame: MEASURE.seatEnter,
  ringBottomAt: [0, 30, 54, 60, 66, 69, 72, 88].map((f) => [
    f,
    Number(ringBottomScreen(f).toFixed(0)),
  ]),
  /** mean screen px/frame over every agent, the seat, the arrow tip and two
   *  blob corners — the cut's motion floor */
  motionEnergy: {
    min: Number(MEASURE.energyMin.toFixed(2)),
    minF: MEASURE.energyMinF,
    mean: Number(MEASURE.energyMean.toFixed(2)),
  },
  gridSlidePxPerF: [0, 40, 80, 120, 154].map((f) => {
    const a = travelAt(f - 1);
    const b = travelAt(f);
    const c = camAt(f);
    return [f, Number((Math.hypot(b.x - a.x, b.y - a.y) * c.k * PARALLAX).toFixed(2))];
  }),
  meanHeadingDeg: [0, 20, 40, 60, 100, 154].map((f) => [
    f,
    Number(((MEAN_H[f] * 180) / Math.PI).toFixed(1)),
  ]),
};
