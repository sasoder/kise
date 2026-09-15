import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_DARK,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
  WOBBLE_R,
} from "./fieldShared";
// The set's shared line values: the stroke every line is drawn at and the
// duration a dot takes to ramp deep -> ripe. Imported, never restated.
import { STROKE, TONE_DUR } from "./ImpossibleTasks";
import {
  DARK_TRAFFIC_OPACITY,
  DEPTH_BANDS,
  EASE_ARRIVE,
  ExperimentsSchema,
  HIGHLIGHT,
  HIGHLIGHT_FRAMES,
  HOLD_DRIFT_MAX,
  HOLD_DRIFT_PX,
  LEGATO,
  PACKET_AMBIENT,
  PACKET_HERO,
  PACKET_PERIOD,
  PACKET_R,
  PACKET_SPEED,
  TRAIL_FRAMES,
  TRAIL_OPACITY,
  Trail,
  arriveEase,
  depthK,
  ease,
  holdDriftK,
  trailFactor,
} from "./levelUp";
// THE MARK. Cut 4 derived the Hugging Face mark's ink-area size against the
// whole set's one scale; cut 0a placed it. Both are imported, never re-derived.
import { HUGGINGFACE } from "./OpenInternet";
import { Board, MarkGlyph, postLen, postX0, postY } from "./SecondMessageBoard";
// THE WORLD, PART ONE. Cut 1 built the field: the seats, the grid they are
// indexed by, the depth bands, the tone ramp, the bucket count and the seat
// renderer. Nothing here restates a value of it.
import {
  BUCKETS,
  COLS,
  GRID_X0,
  GRID_Y0,
  NSEAT,
  ROWS,
  SEATS,
  SEAT_ALIVE,
  SEAT_AT,
  STEP_X,
  STEP_Y,
  TIP_R,
  seatOpacity,
} from "./ThreeOrSomething";
// THE WORLD, PART TWO. Cut 0a put the Hugging Face mark over that field, lit
// five agents, ran five reaches into the mark and fourteen dim ones, and left
// the camera creeping at K_FINAL. Frame 0 of this piece IS frame 127 of that
// one, so every one of those things — including its camera's own key track and
// its depth-band assignment — is imported whole and none of it is re-derived.
import {
  BAND,
  BOARD_DY,
  CAM as HHF_CAM,
  DARK_K_MIN,
  DARK_N,
  DARK_POOL,
  DARK_STEPS,
  DIM,
  DIM_OPACITY,
  DIM_SEAT_OP,
  DOT_MAX,
  DURATION as HHF_DURATION,
  HACKERS,
  HF_BOARD,
  HF_INK_BOTTOM,
  HF_POST_ROWS,
  HF_ROWS,
  HF_X,
  PAIR_CENTRE,
  REACH_OP,
  convertAt,
  darkAt,
  dimReachAt,
  reachAt,
  reachPacketsAt,
} from "./HackedHuggingFace";

export const FPS = 24;
// Dwarkesh clip `Ajeya_The_Investigation`. Ajeya Cotra, on what investigating
// the OpenAI / Hugging Face sandbox attack turned into:
//
//   "And then you're like uncovering more and more logs until you find this
//    like vast conspiracy and cabal."
//
// (The SRT hears "walks"; it is "logs".) SRT span 0:06.620 -> 0:11.419 at 24fps.
// DURATION = round((11.419 - 6.620) * 24) = round(4.799 * 24) = round(115.176)
// = 115 frames of speech, plus a 48 frame tail so the resolved web holds and the
// editor can cut out of it wherever it wants = 163.
export const DURATION = 163;

// ---------------------------------------------------------------------------
// "Uncovering the logs". CUT 0b, and the cut that turns cut 0a's five hackers
// into a network. Cut 0a revealed LIGHT — five agents, and fourteen more you
// cannot count. This one reveals EDGES: a log is a thread found between two
// agents, and finding one lights both ends. That is what keeps it distinct from
// cut 1's wave, which is light spreading over a crowd that never connects.
//
// Orange Dwarkesh style: opaque grid cutaway, 1080x1920, 24fps, two tones of one
// warm yellow with the dots fully opaque, ink on the OP_* ladder, per-icon
// shadows, `runCamera` over authored `camMove` keys, one gesture per word.
//
// THE HAND-OVER. Frame 0 is cut 0a's frame 127, and it is that frame rather
// than a copy of it:
//   * the camera's key track is cut 0a's own, truncated at f127 and continued —
//     my segments are appended in GLOBAL frames (local f + HANDOVER) and the
//     whole piece reads `runCamera(frame + HANDOVER)`. So f0 is literally cut
//     0a's f127 through the same damper, with the damper's own velocity carried
//     across the cut instead of being reset to zero;
//   * every clock — `breath`, `sway`, the grid's drift — is `frame + HANDOVER`;
//   * the Hugging Face BOARD and its two post lines, the mark above it, the five
//     hackers, the fourteen dim seats, both reach sets and the depth-band
//     assignment are cut 0a's exports, drawn in cut 0a's own order with cut 0a's
//     own opacities — including the board's outline, whose ink -> accent
//     crossfade is still read off that cut's `convertAt` rather than hard-coded.
// Proved: this piece's f0 against cut 0a's own f127, rendered from the same
// source, blends to a maximum difference of 0/255 over the whole 1080x1920
// frame — byte-identical, not "within tolerance".
//
// Every gesture is one word. Nothing else happens.
//   AND THEN YOU'RE LIKE: CAMERA M1 tilts DOWN off the
//     board and into the field — k 0.95 -> 1.20 with
//     the content centre going C_HAND (cut 0a's own
//     resolved centre) -> C_FIELD 300, warp 0.7. The
//     mark's ink top leaves the top of frame at f9 and
//     the mark is gone by f11; what is left is the
//     board's lower edge at the top of frame with the
//     five reaches and the fourteen dim ones hanging
//     off it, and unlooked-at field under all of it
//                          — "and then you're like"     keys f1-5 / f2-15
//   UNCOVERING: the FIRST log. One thread between two
//     dark seats beside (0, 300), drawn head-led with
//     a white tip and a `Trail`, over 8 frames — the
//     longest log the geometry allows, on purpose, so
//     that the one the sentence names is the one you
//     can watch. On arrival BOTH ends go deep@OP_DARK
//     -> ripe over TONE_DUR and the thread drops to
//     LOG_REST 0.6: a record, not live traffic
//                          — "uncovering"                            f15-23
//   MORE AND MORE LOGS: the rate steps UP on each of
//     the three words and never between them — the
//     launch table is piecewise, not smooth. f15-26
//     intervals 8 then 6; f27 ("more") 5 then 4; f34
//     ("more") 3; f37 ("logs") 2, 2, and from f41 the
//     density ramp starts and the table stops being
//     countable: 2 a frame at f41, 5 at f45, 13 at
//     f46, 22 at f50. The FRONTIER — the radius the
//     launches are hashed inside — is 123 world px on
//     "uncovering" and 500 on "until", so the web
//     spreads as well as thickens, and the launches
//     overlap by construction: from f41 a log leaves
//     before its predecessors have landed, and 24 are
//     in flight at f46 against 12 already at rest
//                          — "more and more logs"                    f15-46
//   UNTIL YOU FIND: CAMERA M2 pulls back k 1.20 ->
//     0.80 (warp 0.7). Under it the frontier grows
//     500 -> 1,365 and the rate steps to the table's
//     second segment, so the web is already past the
//     frame's sides while the lens is opening away
//     from it: 12 resting logs at f46, 187 at f58,
//     249 at f60
//                          — "until you find"           keys f45-50 / f46-60
//   THIS LIKE VAST CONSPIRACY: CAMERA M3, the big pull
//     -back k 0.80 -> 0.50 (warp 0.72). The frontier
//     passes the FIELD'S OWN SIDES on "vast" f68
//     (1,883 against 1,097) and the frame's BOTTOM
//     edge on "conspiracy" f78 (2,348 against 2,162),
//     and the density ramp is fully in on "vast", so
//     the web outruns the frame on that word — 675
//     resting logs and 917 lit seats at f68, 1,124 /
//     1,456 at f74 — and keeps thickening through
//     "conspiracy" (1,439 / 1,796 at f78). The mark
//     and the original reaches are back in frame at
//     the top; they are part of the web now
//                    — "this like vast conspiracy"      keys f59-66 / f60-92
//   AND CABAL: the whole network steps to ONE thing.
//     Every resting log rises LOG_REST 0.6 -> LOG_STEP
//     0.95 over f92-103 on EASE_ARRIVE, landing on
//     "cabal", and on that frame every one of the
//     4,313 lit seats takes `highlightTone` for
//     HIGHLIGHT_STEP frames. That is this cut's ONE
//     highlight. No log launches after f102 — the
//     finding is done — and the heads still in flight
//     land by f110.23
//                          — "and cabal"                             f92-108
// ---------------------------------------------------------------------------
// THE SLEEK PASS (Sep 2026), on the director's note that the delivered set
// looked "a bit unfinished ... too static". Same concept, same beats, same
// camera landings, same words, same 4,366 logs; nothing new that has no word.
// Five of the six mechanisms are in this cut, all of them `levelUp` v2's:
//   1 HOLD DRIFT   D1 (f16-44) keeps M1's tilt CLOSING at drift speed until
//                  M2's keys open, and K_END is re-solved so the tail creep's
//                  PEAK is inside HOLD_DRIFT_MAX where v1's was 2.1. Both holds
//                  are asserted at module scope against a point at the frame's
//                  own edge, sway included
//   2 PACKETS      cut 0a's five reaches keep carrying ITS packets (they are
//                  still live lines, and it is also what makes f0 blend), and
//                  from "cabal" f103 the web itself carries ambient ones —
//                  about one launch a frame on the logs the frame can see
//   3 DARK TRAFFIC cut 0a's pool and cut 0a's schedule over the UNLIT field, so
//                  the tilt down on "and then you're like" lands on a field that
//                  is alive but unread. A thread stops the frame a log lights
//                  either of its ends: from there the web is what that seat
//                  carries
//   4 ARRIVE EASE  every log head cruises and decelerates into its landing on
//                  `arriveEase`; every arrival frame, the rate step-ups and the
//                  lit-seat schedule are bit-for-bit unchanged
//   6 WAKE         nothing in this cut posts or reaches — a log is found, not
//                  sent — so there is nothing to wake ahead of. Cut 0a owns the
//                  wake in this pair
// Mechanism 5 (`marchDash`) is NOT USED: there is no dashed edge in this cut.
//
//   TAIL: hold at k 0.50 with the web at 0.95, and
//     CAMERA M4 under it — a slow even creep k 0.50 ->
//     K_END over f114-162, warp 1.0. The sleek pass
//     re-solves K_END from `holdDriftK` so that the
//     creep's PEAK, not its mean, is inside
//     HOLD_DRIFT_MAX: v1 took 0.47 by hand and measured
//     2.1 screen px/frame on a point at the frame's
//     edge, over the max; it is 1.24 now. `breath` on
//     every dot, `sway` on the lens and the web's own
//     packets carry the rest of it. It never fades out
//     — the editor controls the out  — tail            keys f114-162 / f115-162
//
// CAMERA. Four moves on ONE damped track that STARTS as cut 0a's: cx is HF_X
// throughout (the web, the mark and the reaches are all on that axis, so a pan
// would be motion with nothing to look at), and from M1 on the content centre is
// C_FIELD 300 — the web's own centre — at every k, so `camMove` is only ever
// moving k and the framing it drags with it. World (0, 300) sits at screen y 835
// under the captions from f12 to the last frame, by construction.
//
// EVERY LANDING IS SOLVED AGAINST THE DAMPER, NOT ASSERTED, and see DEVIATION 1:
//   M1 keys f1-5   warp 0.70  k 0.95 -> 1.20, centre C_HAND -> 300
//                  8.26% left at f12, 2.26% at f15 ("uncovering"), 0.09% at f19
//   M2 keys f45-50 warp 0.70  k 1.20 -> 0.80
//                  4.47% left at f58, 0.72% at f60 ("this")
//   M3 keys f59-66 warp 0.72  k 0.80 -> 0.50
//                  2.94% left at f74, 0.24% at f78 ("conspiracy")
//   M4 keys f114-162 warp 1.0 k 0.50 -> 0.47, the tail creep
// Peak camera speed: on the CONTENT CENTRE — the point the eye follows — 82.2
// screen px/frame at f6, all of it M1's; on the point at the frame's own EDGE,
// 107.3 at f6 (M1), 54.1 at f50 (M2), 58.8 at f66 (M3), 2.1 through the tail.
// Cut 4 (`OpenInternet`, delivered) peaks at 52.9 and 93.4 on the same two
// measures. M1 is the fastest camera move in the set and it cannot not be: it
// travels 610 world px of tilt AND a 0.95 -> 1.20 zoom, and the brief gives it
// from f2 to a landing before "uncovering" f15 to do both in. It runs over a
// field that is entirely dark and entirely uniform, which is the one place in
// the set a whip can be spent — see the f2-9 tile in the DONE note.
//
// ambient: `breath` on every dot, `sway` on the camera, the grid's own drift,
// and — the sleek pass — DARK TRAFFIC over the part of the field no log has
// reached yet, at DARK_TRAFFIC_OPACITY, with no heads, on cut 0a's own pool and
// cut 1's own schedule. The field is unread, not DEAD; a LOG is still the only
// BRIGHT line that ever appears, and the distance between the two is what
// "uncovering" means.
//
// ---------------------------------------------------------------------------
// WHAT IS DERIVED RATHER THAN HAND-SET, each noted where it is computed.
//
//   * LOG_SPEED. One speed for every log, so a longer log visibly takes longer.
//     The brief fixes the first log at "~8 frames" and every log at 2-6 grid
//     steps, so the speed is that first log's own length over 8: the longest
//     offset the table allows is six columns across (LOG_LEN_MAX 144.6 world
//     px) and the seats' jitter makes that particular pair 134.26, so
//     LOG_SPEED = 16.78 world px a frame. On screen that is 20.1 px/frame at
//     k 1.20, the hardest zoom a log is ever drawn at — well under this set's
//     45 px/frame close-up cap, asserted at module scope — and over `Trail`'s
//     own TRAIL_MIN_SPEED, so every head smears. The shortest log the table
//     allows (20.1 world px) takes 1.2 frames; the median takes 4.5.
//   * THE FIRST LOG IS THE LONGEST ONE. Gesture 2 is the only log the viewer can
//     actually watch, and at one speed the only way to give it 8 frames is to
//     give it the longest offset in the table (six columns across, no rows). It
//     is the one log whose endpoints are not hashed.
//   * THE LAUNCH TABLE IS PIECEWISE. The brief names a step-up on "more" f27,
//     "more" f34 and "logs" f37, and per-frame rates that step on "logs" f37
//     (an interval of two), f41 (one a frame), "until" f46 (two), "this" f60
//     (three) and "conspiracy" f78 (four). A smooth rate curve cannot put a
//     step on a word, so the table is a list of explicit early launches and
//     then six constant-rate segments whose boundaries ARE those words —
//     LOG_EARLY and LOG_RATE, read by `logLaunches`.
//   * THE FRONTIER AND ITS EXPONENT. V2. `logRadius` is not a table any more:
//     the web's AREA grows with the number of logs found, so the radius is the
//     cumulative launch count to the power 1/LOG_R_GAMMA, and LOG_R_GAMMA is
//     solved by bisection from the frontier bias so that the finished density
//     does not depend on the radius. The one scale left is pinned by the brief's
//     own point, 500 world px on "until" f46; 123 at f15 (the brief's 120),
//     1,883 on "vast", 2,348 on "conspiracy" and 2,941 at f92 then fall out of
//     it and are asserted rather than set. See THE FRONTIER.
//   * A LOG STARTS AT THE EDGE. LOG_FRONTIER of the launches start in the outer
//     30% of the current radius and the rest anywhere inside it, which is what
//     keeps the web from being a knot: mass moves outward while the interior
//     keeps gaining junctions. Measured at f103 in five concentric bands from
//     the content centre out to the frame's corner, the lit-seat density is
//     within 19% of its own mean, against the brief's 30%.
//   * A LOG FOLLOWS ONE YOU ALREADY HAVE. LOG_CHAIN of the launches start at a
//     seat an earlier log has already lit — at the frontier, if that is where
//     the launch is — which is what makes the result a network rather than four
//     thousand dashes: 41% of the lit seats end up on two or more logs and the
//     busiest carries seventeen. See LOG_CHAIN.
//   * A LAUNCH OFF THE FIELD IS RE-HASHED, NOT CLAMPED. The frontier ends up
//     3,272 world px across and the field is only 2,194 wide, so more than half
//     of every late launch falls outside it. Snapping those to the nearest seat
//     would draw a bright rule down both sides of the frame; they are rejected
//     and re-hashed instead, which is also what shapes the web into the field's
//     own strip. See FIELD_X.
//   * NO TWO LOGS ON THE SAME PAIR. The schedule is built once at module scope
//     with a Set of packed (min, max) seat pairs; a collision re-hashes the
//     launch with a new sub-seed, up to LOG_TRIES times.
//   * THE WEB IS ONE PLANE. Cut 0a forces its nineteen hero seats into the
//     middle depth band, because a seat and the reach that leaves it may not sit
//     on two parallax planes. The same rule applies to a log and its two ends,
//     but forcing the log seats into the middle band at module scope would move
//     them at f0 and break the hand-over. So a seat CHANGES PLANE WHEN IT LIGHTS:
//     while it is dark it is drawn in its own band's path, and from the frame its
//     first log lands it is drawn in the middle band with the rest of the web.
//     The jump is at most 3% of the seat's distance from the camera's centre and
//     it happens on the frame the seat is still at OP_DARK, among twenty thousand
//     identical dark dots — it cannot be seen, and it is the only way the web's
//     lines can end on the web's own dots.
//   * THE WEB IS NOT 4,366 LINES AND 9,000 CIRCLES. The resting logs are grouped
//     by their quantised opacity and emitted as one <path> per group; the lit
//     seats are bucketed by lit amount exactly as cut 1 buckets its field and
//     emitted as one <path> per bucket; the dark crowd is one <path> per depth
//     band. V2: the logs IN FLIGHT are bucketed too — up to 543 heads at once,
//     and every one of them travels at LOG_SPEED under one camera and therefore
//     has the same screen speed and the same `trailFactor`, so the live threads
//     are one path, the white tips another and the trail one path per
//     TRAIL_OPACITY step. Peak per-frame DOM is 126 nodes against the set's
//     ~3,000 ceiling; measured in the DONE note.
//
// EXPERIMENTS IN THIS PIECE (all on by default, each behind `experiments`):
//   EASE_ARRIVE  every seat's tone ramp, every log's settle from live to record,
//                and the whole network's step on "cabal". EASE_MOVE is the
//                camera's, through `camMove`'s warped smoothstep. EASE_PAYOFF is
//                UNUSED — the brief spends the overshoot budget on nothing, and
//                this cut's payoff is the step, not a landing
//   legato       the launch table overlaps by construction from f41 on (a log
//                leaves before its predecessors land). With `legato: false` the
//                four countable early launches — f23, f27, f32, f34 — are pushed
//                LEGATO frames later so each of them stands alone; the
//                constant-rate segments are unchanged, because a rate of two,
//                three or four a frame has no gaps to close
//   trails       the `Trail` smear on every log head in flight — the same three
//                circles at the same radii and the same TRAIL_OPACITY steps,
//                emitted as three paths instead of 543 components (see above)
//   softFront    declared, and NOT USED: there is no wave in this cut. A log is
//                an edge between two named seats, and a tone front over three
//                rows is the mechanism this cut exists to be different from
//   highlight    `highlightTone` on every lit seat on "cabal" f103 — one
//                gesture, the only use in the cut. HIGHLIGHT_STEP frames rather
//                than HIGHLIGHT_FRAMES: see HIGHLIGHT_STEP
//   depth        cut 0a's three bands, on the DARK crowd only; the web itself is
//                one plane (see THE WEB IS ONE PLANE)
//
// DEVIATIONS FROM THE BRIEF — see the DONE note for the measurements.
//   1. THE CAMERA LANDINGS ARE 2-7% SHORT AT THE BRIEFED FRAME. The brief asks
//      each move to be "landed >= 99.4%" 11 to 14 frames after its own first
//      moving frame. `runCamera`'s damper (stiffness 0.09, damping 0.468) takes
//      19 frames to reach 99.4% of a STEP — the fastest target any key track can
//      hand it — so 99.4% at f12, f58 or f74 is not available at any warp or key
//      window. As `ThreeOrSomething` and `UnderHeel` do, the SHAPE and the
//      LANDING WORD are kept and the key window is solved backwards from them:
//      each move is 97-99% landed at the briefed frame and inside 0.3% by its
//      word. The numbers are in the CAMERA block above.
//   2. THE BOARD NEVER LEAVES THE FRAME, AND THE MARK COMES BACK DURING M2. The
//      brief was written against cut 0a's first world, where the mark sat alone
//      at world y -520 over hackers at y 30-210; cut 0a v2 put a 420 x 120 board
//      under the mark and moved the five hackers up to y -127 to -68, with the
//      fourteen dim seats running from y -131 down to 690. At the briefed tilt
//      (k 1.20 on world (0, 300)) the MARK does leave the top of frame, on f11
//      as the brief asks — but the board's bottom edge sits at screen y 181 at
//      f12 and 110-129 through the whole "more and more logs" section, with the
//      reach fan hanging off it, and the lowest dim seats are inside the web's
//      own disc. Taking the board off the top as well would need the content
//      centre at 396 rather than 300, which drops world (0, 300) to screen 720
//      and gives up the caption line; taking the hackers off with it would need
//      635 and the web would not be in frame at all. So the board stays, the
//      brief's camera numbers are kept, and the reaches read as what the logs
//      are being uncovered UNDER. The mark's ink bottom then crosses back into
//      frame at f49, inside M2 rather than on "vast conspiracy"; holding it out
//      until f60 would need the centre to move up during M2 and back down
//      during M3, two centre moves with no word on either.
//   3. LOG_RATE_SCALE. Read literally, the brief's launch table is 194 logs and
//      385 lit seats by f103; the brief also says "the web will reach thousands
//      of lines" and caps the resting logs (v1 at ~2,500, v2 at 4,500). Those
//      two cannot both be true, and 194 was built first and looked at: at k 0.50
//      it is a scatter of two hundred dashes across an empty frame, which is not
//      a vast conspiracy and not a cabal. So the table is implemented exactly as
//      written and then multiplied by a ramp to LOG_RATE_SCALE that starts on
//      "logs" f37 — the word the count stops being countable — and is fully in
//      on "vast" f68. Every step-up frame, the segment rates' own ratios and the
//      whole of f15-40 are the brief's; only the density is dialled. V2 takes
//      the scale 14 -> 26 because the web now has to fill a frame rather than a
//      ball in the middle of it: 4,366 resting logs and 4,701 lit seats at the
//      end, against the brief's own LOG_CAP of 4,500, asserted at module scope.
//   4. V2: THE RADIUS SCHEDULE IS DERIVED, NOT THE BRIEF'S TABLE. V1 used the
//      brief's own four points (120 / 500 / 900 / 1,400) and that is what made
//      the knot: 1,400 is barely wider than the frame is tall at k 0.50, and a
//      disc filled from the middle out has its whole history in the middle. V2
//      keeps the two points the revision brief keeps — 500 on "until" f46,
//      which pins the curve, and 120 on "uncovering" f15, which comes out 123 —
//      and lets the other two go, because the same brief asks the frontier to
//      pass the frame's sides on "vast" and its bottom on "conspiracy" and to
//      be past 2,200 at f92, which 900 and 1,400 cannot do. The curve through
//      them is one derived exponent, and every one of those four crossings is
//      asserted against this cut's own camera rather than set.
//   5. V2: THE HIGHLIGHT IS FOUR FRAMES, NOT TWO. See HIGHLIGHT_STEP: at two it
//      is four thousand dots across the whole frame going pale and back inside
//      83 ms, which reads as a blink. The revision brief names four as the fix.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE HAND-OVER. Cut 0a's last frame, and the offset every clock in this piece
// reads through.
// ---------------------------------------------------------------------------
export const HANDOVER = HHF_DURATION - 1; // 127
export const CX = HF_X; // 0: no pan, in either cut

// ---------------------------------------------------------------------------
// THE CAMERA. Cut 0a's key track, truncated at HANDOVER and continued. The key
// at HANDOVER itself is cut 0a's own target read back off its array, so every
// target from f1 to f127 is bit-identical to that cut's and `runCamera(127)`
// through this array IS `runCamera(127)` through cut 0a's.
// ---------------------------------------------------------------------------
export const K_HAND = interpolate(HANDOVER, HHF_CAM.F, HHF_CAM.K, clamp);
export const CY_HAND = interpolate(HANDOVER, HHF_CAM.F, HHF_CAM.CY, clamp);
export const C_HAND = CY_HAND - CAM_LIFT / K_HAND; // == cut 0a's CONTENT_FINAL

/** The web's centre, and the content centre from M1 on. Cut 0a owns the number
 *  — it has to know how wide this cut ever gets, to size the pair's one dark
 *  traffic pool — so it is imported rather than declared twice. */
export const C_FIELD = PAIR_CENTRE;
export const K_TILT = 1.2; // "and then you're like": down into the field
export const K_BACK = 0.8; // "until you find"
export const K_VAST = 0.5; // "this like vast conspiracy"

// ---------------------------------------------------------------------------
// SLEEK PASS — NOTHING IS EVER PARKED. v1 landed M1 at f15 and then held the
// camera dead still for thirty frames while the logs came in, and its tail crept
// at up to 2.1 screen px/frame on a point at the frame's edge, which is over the
// sleek pass's own HOLD_DRIFT_MAX. Two `holdDriftK` changes, and nothing else
// about the camera moves:
//   * D1, f16-44: M1's TILT KEEPS CLOSING at drift speed until M2's keys open.
//     It starts FROM the landed K_TILT so M1's landing on "uncovering" f15 does
//     not move, and M2 then opens from K_TILT_DRIFT instead of from K_TILT.
//     It drifts k ONLY: the content centre stays at C_FIELD because world
//     (0, 300) is pinned to screen y 835, the caption-safe line, and a centre
//     that kept tilting down would walk the whole cut off it — 1.2 px a frame
//     over the 29 frames of the hold is 35 px of the band. See DEVIATION 6.
//   * K_END is re-solved rather than taken at v1's 0.47, so the tail creep's
//     PEAK — not its mean — is inside HOLD_DRIFT_MAX. `camMove`'s smoothstep
//     peaks at about 1.5x its own mean, so a drift solved flat at
//     HOLD_DRIFT_PX overshoots; DRIFT_TRIM is the measured factor that brings
//     the peak back inside, and the pair of holds is ASSERTED below.
// ---------------------------------------------------------------------------
/** The screen point every drift here is solved for: the frame's own edge, the
 *  fastest-moving point on screen at any k. */
export const DRIFT_TRIM = 0.62;
export const DRIFT_DIST = FRAME_H / 2 / DRIFT_TRIM;
export const M1_LAND = 15; // measured: 97.7% of M1, on "uncovering"
export const D1_F0 = M1_LAND + 1;
export const D1_F1 = 44; // ...to the frame before M2's keys open
export const K_TILT_DRIFT = holdDriftK(K_TILT, D1_F1 - D1_F0, DRIFT_DIST, 1);
export const M4_F0 = 114;
export const M4_F1 = 162;
export const K_END = holdDriftK(K_VAST, M4_F1 - M4_F0, DRIFT_DIST, -1);

export type CamSeg = {
  name: string;
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  warp: number;
};
/** The key track, with the sleek pass's drift in or out. `drift: false` is v2's
 *  own four-move track at v2's own K_END, so the experiment is a real switch. */
export const camSegs = (drift: boolean): CamSeg[] =>
  drift
    ? [
        { name: "M1", f0: 1, f1: 5, k0: K_HAND, k1: K_TILT, c0: C_HAND, c1: C_FIELD, warp: 0.7 },
        { name: "D1", f0: D1_F0, f1: D1_F1, k0: K_TILT, k1: K_TILT_DRIFT, c0: C_FIELD, c1: C_FIELD, warp: 1.0 },
        { name: "M2", f0: 45, f1: 50, k0: K_TILT_DRIFT, k1: K_BACK, c0: C_FIELD, c1: C_FIELD, warp: 0.7 },
        { name: "M3", f0: 59, f1: 66, k0: K_BACK, k1: K_VAST, c0: C_FIELD, c1: C_FIELD, warp: 0.72 },
        { name: "M4", f0: M4_F0, f1: M4_F1, k0: K_VAST, k1: K_END, c0: C_FIELD, c1: C_FIELD, warp: 1.0 },
      ]
    : [
        { name: "M1", f0: 1, f1: 5, k0: K_HAND, k1: K_TILT, c0: C_HAND, c1: C_FIELD, warp: 0.7 },
        { name: "M2", f0: 45, f1: 50, k0: K_TILT, k1: K_BACK, c0: C_FIELD, c1: C_FIELD, warp: 0.7 },
        { name: "M3", f0: 59, f1: 66, k0: K_BACK, k1: K_VAST, c0: C_FIELD, c1: C_FIELD, warp: 0.72 },
        { name: "M4", f0: M4_F0, f1: M4_F1, k0: K_VAST, k1: 0.47, c0: C_FIELD, c1: C_FIELD, warp: 1.0 },
      ];
export const CAM_SEGS = camSegs(true);
/** A move by name, so a segment can be inserted without renumbering an assert. */
export const camSeg = (name: string) => {
  const s = CAM_SEGS.find((x) => x.name === name);
  if (!s) throw new Error(`UncoveringTheLogs: no camera move ${name}`);
  return s;
};

export const makeCam = (segs: CamSeg[]) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  HHF_CAM.F.forEach((f, i) => {
    if (f < HANDOVER) {
      F.push(f);
      K.push(HHF_CAM.K[i]);
      CY.push(HHF_CAM.CY[i]);
    }
  });
  F.push(HANDOVER);
  K.push(K_HAND);
  CY.push(CY_HAND);
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
  };
  segs.forEach((s) => {
    const g0 = s.f0 + HANDOVER;
    const g1 = s.f1 + HANDOVER;
    if (g0 > F[F.length - 1] + 1) hold(g0 - 1);
    const m = camMove({ ...s, f0: g0, f1: g1 });
    m.F.forEach((f, i) => {
      if (f <= F[F.length - 1]) return;
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
  });
  if (F[F.length - 1] < DURATION - 1 + HANDOVER) hold(DURATION - 1 + HANDOVER);
  for (let i = 1; i < F.length; i++) {
    if (F[i] <= F[i - 1]) {
      throw new Error(`UncoveringTheLogs: the camera's moves overlap at f${F[i]}`);
    }
  }
  return { F, K, CY };
};

export const CAM = makeCam(CAM_SEGS);
/** ...and v2's own, for `experiments.drift: false`. */
export const CAM_PLAIN = makeCam(camSegs(false));

// THE TWO HOLDS ARE ASSERTED. A fixed world point at the frame's own edge must
// keep moving through both of them, and never fast enough for a hold to read as
// a move. Measured exactly as the sleek brief measures it, `sway` included.
// M1 is the fastest move in the set and `runCamera` is still bleeding its
// velocity off well past the landing — 2.26% of a 615 px centre move is left on
// "uncovering" f15 and it is only gone by f19 — so the HOLD is measured from f20,
// where the settle has finished and what is left is the drift itself.
export const M1_SETTLED = 20;
export const HOLDS: [number, number, string][] = [
  [M1_SETTLED, 45, "D1, M1 landed -> M2's keys"],
  [M4_F0, DURATION - 1, "M4, the tail creep"],
];
export const driftRange = (
  track: { F: number[]; K: number[]; CY: number[] },
  f0: number,
  f1: number,
) => {
  const c0 = runCamera(f0 + HANDOVER, track.F, track.CY, track.K);
  const wy = c0.cy + FRAME_H / 2 / c0.k; // the point on the frame's bottom edge
  const at = (f: number) => {
    const c = runCamera(f + HANDOVER, track.F, track.CY, track.K);
    return 960 + (wy - (c.cy + sway(f + HANDOVER).dy)) * c.k;
  };
  let mn = Infinity;
  let mx = 0;
  for (let f = f0 + 1; f <= f1; f++) {
    const v = Math.abs(at(f) - at(f - 1));
    mn = Math.min(mn, v);
    mx = Math.max(mx, v);
  }
  return { mn, mx };
};
HOLDS.forEach(([f0, f1, what]) => {
  const d = driftRange(CAM, f0, f1);
  if (d.mx > HOLD_DRIFT_MAX) {
    throw new Error(`UncoveringTheLogs: ${what} drifts at ${d.mx.toFixed(2)} px/frame, over the max`);
  }
  if (d.mx < HOLD_DRIFT_PX * 0.6) {
    throw new Error(`UncoveringTheLogs: ${what} is parked — ${d.mx.toFixed(2)} px/frame`);
  }
});
// ...and the pair's dark traffic pool was built for a camera no wider than this.
if (K_END < DARK_K_MIN) {
  throw new Error(`UncoveringTheLogs: K_END ${K_END.toFixed(3)} is wider than the pool's ${DARK_K_MIN}`);
}

// ---------------------------------------------------------------------------
// THE LOGS. A log is a thread found BETWEEN two agents: it is drawn head-led
// from one dark seat to another two to six grid steps away, and when it arrives
// both ends light and the thread stays as a record.
// ---------------------------------------------------------------------------
export const LOG_ORIGIN = { x: 0, y: C_FIELD };
export const LOG_STEPS_MIN = 2;
export const LOG_STEPS_MAX = 6;
/** The longest offset the table allows: six columns across, no rows — before
 *  the seats' own jitter, which is what LOG_LEN_FIRST measures. */
export const LOG_LEN_MAX = LOG_STEPS_MAX * STEP_X;
export const LOG_FIRST_FRAMES = 8; // the brief's "~8 frames" for the first log
export const LOG_REST = 0.6; // a record
export const LOG_LIVE = 0.95; // ...and what it is worth while it is being found
export const LOG_STEP = 0.95; // where every record goes on "cabal"
export const LOG_SETTLE = TONE_DUR; // live -> record, alongside the ends lighting
export const LOG_TRIES = 24;

// ---------------------------------------------------------------------------
// THE FRONTIER. V2: the web's edge, and the rule that keeps its density flat.
//
// V1 grew the launch radius through a hand-set table (120, 500, 900, 1,400) and
// hashed every launch uniformly inside it. That is a KNOT: a disc filled from
// the middle out gets every launch of every earlier frame in its centre and only
// the last few at its rim, and at k 0.50 it read as a ball of web with dark
// field on all four sides — which is neither "vast" nor "everywhere you look".
// Two things change, and they are one idea: the launches are biased to the EDGE,
// and the edge's own schedule is then solved so that the result is FLAT.
//
//   * LOG_FRONTIER of every launch starts on a seat in the outer
//     1 - LOG_FRONTIER_BAND of the current radius; the rest start anywhere
//     inside it, uniformly by area, so the interior keeps gaining junctions
//     while the mass moves outward.
//   * with p = LOG_FRONTIER launched uniformly by area into the annulus
//     [B*r, r] (B = LOG_FRONTIER_BAND) and 1 - p uniformly by area into [0, r],
//     the finished density at a radius s is
//
//       rho(s) = INT over r in [s, s/B] of p N'(r) / ((1-B^2) pi r^2) dr
//              + INT over r in [s, R]   of (1-p) N'(r) / (pi r^2) dr
//
//     where N(r) is how many logs have been launched by the time the frontier
//     reaches r. Put N(r) = C r^g: both integrals come out proportional to
//     s^(g-2) plus a constant, and the s-dependence — the knot — cancels
//     exactly when
//
//       p (B^(2-g) - 1) / (1 - B^2) = 1 - p
//
//     LOG_R_GAMMA solves that by bisection, so the frontier is
//     r ∝ N^(1/g): the web's AREA grows with the number of logs found, which is
//     the sentence read literally. At p 0.7, B 0.7 the exponent is 2.554 and
//     r ∝ N^0.3915.
//   * the one free scale left is LOG_R_MAX, and it is pinned by the brief's own
//     point: 500 world px on "until" f46. Everything else — 120 at f15, past
//     the field's sides on "vast", past the frame's bottom on "conspiracy",
//     2,200 by "and" f92 — then falls out of that one number and is ASSERTED
//     below rather than set.
// ---------------------------------------------------------------------------
export const LOG_FRONTIER = 0.7; // of the launches start out at the edge
export const LOG_FRONTIER_BAND = 0.7; // ...which is the outer 30% of the radius
/** The exponent that makes the finished density independent of the radius. */
export const LOG_R_GAMMA = (() => {
  const p = LOG_FRONTIER;
  const B = LOG_FRONTIER_BAND;
  const f = (g: number) => (p * (Math.pow(B, 2 - g) - 1)) / (1 - B * B) - (1 - p);
  let lo = 2.0001;
  let hi = 8;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (f(m) < 0) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
})();
export const LOG_R_EXP = 1 / LOG_R_GAMMA;
export const LOG_R_PIN_F = 46; // "until": the brief's own point on the curve...
export const LOG_R_PIN = 500; // ...and its radius

// ...and the frontier's EDGE, because a population never ends on a ruled line
// and a disc of logs is the same sin as a box of dots. The nominal radius
// UNDULATES with the angle on `wobble` (its two harmonics made whole around the
// loop by WOBBLE_R, so there is no seam at theta = pi) at LOG_WOB of the radius
// either way — proportional, so the young web is not a splat — and the chained
// logs reach up to six more steps past whatever edge that leaves. V1 also thinned
// the density toward the rim (LOG_RIM 0.62); that is gone, because thinning the
// rim is exactly the knot the frontier bias exists to undo. From "vast" on the
// edge is outside the frame anyway and what is on screen is the middle of the
// web, which is the point of the cut.
export const LOG_WOB = 0.18; // of the radius, either way
export const LOG_WOB_SEED = 3.4;
const LOG_WOB_NORM = 1.2 + 0.7; // `wobble`'s own amplitude, so LOG_WOB is exact
/** The launch edge's offset at an angle, as a fraction of the radius. */
export const logWobble = (angle: number) =>
  (LOG_WOB / LOG_WOB_NORM) * wobble(angle * WOBBLE_R, LOG_WOB_SEED);

// THE FIELD'S OWN EDGE. A launch hashed outside the field is REJECTED and
// re-hashed, never clamped: clamping a disc that is wider than the field piles
// every outside sample onto the two edge columns and draws a bright rule down
// each side of the frame. Read off the seats, not restated.
export const FIELD_X = (() => {
  let x = 0;
  for (let i = 0; i < NSEAT; i++) if (SEAT_ALIVE[i]) x = Math.max(x, Math.abs(SEATS[i].x));
  return x;
})();
export const FIELD_Y0 = (() => {
  let y = Infinity;
  for (let i = 0; i < NSEAT; i++) if (SEAT_ALIVE[i]) y = Math.min(y, SEATS[i].y);
  return y;
})();
export const FIELD_Y1 = (() => {
  let y = -Infinity;
  for (let i = 0; i < NSEAT; i++) if (SEAT_ALIVE[i]) y = Math.max(y, SEATS[i].y);
  return y;
})();

// ---------------------------------------------------------------------------
// THE LAUNCH TABLE. Explicit launches while the count is still countable, then
// four constant-rate segments whose boundaries are the words. The step-ups are
// ON "more" f27, "more" f34 and "logs" f37 and nowhere between them, and the
// whole of f15-45 — every log the viewer could actually count — is the brief's
// table at its own rate, untouched.
//
// From "logs" f37, the word at which the count stops being countable, the rate
// is multiplied by a ramp that reaches LOG_RATE_SCALE on "vast" f68 and holds —
// so the web is vast on the word "vast" and keeps thickening through
// "conspiracy" and "cabal" behind a four-a-frame segment that is now the
// densest of the four. The brief's own per-segment rates (two, three, four a
// frame) still step on their own words; the ramp only decides how many lines a
// "frame" is.
// See DEVIATION 3 in the header.
// ---------------------------------------------------------------------------
export const LOG_RATE_SCALE = 26;
export const LOG_SCALE_F0 = 37; // "logs": where the scale starts to bite
export const LOG_SCALE_F1 = 68; // "vast": ...and where it is fully in
/** The countable launches: one frame each, in order. */
export const LOG_EARLY = [15, 23, 27, 32, 34];
/** The countable launches that come after the first — the ones `legato` moves. */
export const LOG_EARLY_LEGATO = 1;
export type RateSeg = { f0: number; f1: number; per: number };
export const LOG_RATE: RateSeg[] = [
  { f0: 37, f1: 38, per: 0.5 }, // "logs": intervals 2, 2
  { f0: 39, f1: 40, per: 0.5 },
  { f0: 41, f1: 45, per: 1 }, // ...then one a frame
  { f0: 46, f1: 59, per: 2 }, // "until you find": two a frame
  { f0: 60, f1: 77, per: 3 }, // "this like vast": three a frame
  { f0: 78, f1: 102, per: 4 }, // "conspiracy": four a frame, and stop on "cabal"
];
/** The density ramp: 1 until "until", LOG_RATE_SCALE from "conspiracy" on. */
export const logScale = (f: number) =>
  1 + (LOG_RATE_SCALE - 1) * smoothstep((f - LOG_SCALE_F0) / (LOG_SCALE_F1 - LOG_SCALE_F0));

/** Every launch frame, in order, for a given legato setting. */
export const logLaunches = (legato: boolean): number[] => {
  const out: number[] = [];
  LOG_EARLY.forEach((f, n) => {
    out.push(n < LOG_EARLY_LEGATO || legato ? f : f + LEGATO);
  });
  LOG_RATE.forEach((s) => {
    for (let f = s.f0; f <= s.f1; f++) {
      const n = s.per < 1 ? (f === s.f0 ? 1 : 0) : Math.round(s.per * logScale(f));
      for (let i = 0; i < n; i++) out.push(f);
    }
  });
  return out.sort((a, b) => a - b);
};

// ---------------------------------------------------------------------------
// ...and the frontier that rides on it. `cumOf` is how many logs have been
// launched by a frame; the radius is that count to the power 1/LOG_R_GAMMA,
// scaled so it is the brief's own 500 on "until" f46. One smooth monotone curve
// with no hand-set knots in it, and a different one for each legato setting,
// because legato moves four of the early launches.
// ---------------------------------------------------------------------------
const cumOf = (launches: number[]) => {
  const per = new Float64Array(DURATION + 1);
  launches.forEach((f) => {
    if (f <= DURATION) per[f] += 1;
  });
  const cum = new Float64Array(DURATION + 1);
  let n = 0;
  for (let f = 0; f <= DURATION; f++) {
    n += per[f];
    cum[f] = n;
  }
  return cum;
};
export const LOG_CUM_LEGATO = cumOf(logLaunches(true));
export const LOG_CUM_PLAIN = cumOf(logLaunches(false));
export const LOG_N_TOTAL = LOG_CUM_LEGATO[DURATION];
export const LOG_R_MAX =
  LOG_R_PIN / Math.pow(LOG_CUM_LEGATO[LOG_R_PIN_F] / LOG_N_TOTAL, LOG_R_EXP);
/** The frontier's radius at a frame, for one legato setting's own schedule. */
export const makeRadius = (cum: Float64Array) => (f: number) => {
  const n = cum[Math.max(0, Math.min(DURATION, Math.round(f)))];
  return n <= 0 ? 0 : LOG_R_MAX * Math.pow(n / LOG_N_TOTAL, LOG_R_EXP);
};
export const logRadius = makeRadius(LOG_CUM_LEGATO);
export const logRadiusPlain = makeRadius(LOG_CUM_PLAIN);

export type LogPair = { a: number; b: number; f0: number; len: number };
export type Log = LogPair & { arrive: number };

/** A seat's grid neighbour `s` steps away at an angle, or -1. */
const neighbour = (i: number, s: number, theta: number) => {
  const dc = Math.round(s * Math.cos(theta));
  const dr = Math.round(s * Math.sin(theta));
  const d = Math.hypot(dc, dr);
  if (d < LOG_STEPS_MIN || d > LOG_STEPS_MAX) return -1;
  const gc = SEATS[i].gc + dc;
  const gr = SEATS[i].gr + dr;
  if (gc < 0 || gr < 0 || gc >= COLS || gr >= ROWS) return -1;
  return SEAT_AT[gr * COLS + gc];
};

/** The nearest live seat to a world point, through the grid — or -1 if the
 *  point is outside the field, so a launch off the field is re-hashed rather
 *  than snapped onto the edge column. */
const seatNear = (wx: number, wy: number) => {
  if (Math.abs(wx) > FIELD_X || wy < FIELD_Y0 || wy > FIELD_Y1) return -1;
  const gc = Math.max(0, Math.min(COLS - 1, Math.round((wx - GRID_X0) / STEP_X)));
  const gr = Math.max(0, Math.min(ROWS - 1, Math.round((wy - GRID_Y0) / STEP_Y)));
  let best = -1;
  let bestD = Infinity;
  for (let r = gr - 3; r <= gr + 3; r++) {
    for (let c = gc - 3; c <= gc + 3; c++) {
      if (r < 0 || c < 0 || r >= ROWS || c >= COLS) continue;
      const i = SEAT_AT[r * COLS + c];
      if (i < 0) continue;
      const d = Math.hypot(SEATS[i].x - wx, SEATS[i].y - wy);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  }
  return best;
};

/** The one log the sentence names: the seat beside the origin and the longest
 *  offset the table allows, six columns across. */
export const LOG_FIRST: LogPair = (() => {
  const a = seatNear(LOG_ORIGIN.x, LOG_ORIGIN.y);
  const b = neighbour(a, LOG_STEPS_MAX, 0);
  if (a < 0 || b < 0) throw new Error("UncoveringTheLogs: no first log");
  return { a, b, f0: LOG_EARLY[0], len: Math.hypot(SEATS[b].x - SEATS[a].x, SEATS[b].y - SEATS[a].y) };
})();

// ONE SPEED, SOLVED. The first log is the longest offset in the table and the
// brief gives it eight frames; the seats' own jitter means its real length is
// not exactly LOG_LEN_MAX, so the speed is read off the log itself. Every other
// log is drawn at that speed and therefore takes as long as it is long.
export const LOG_LEN_FIRST = LOG_FIRST.len;
export const LOG_SPEED = LOG_LEN_FIRST / LOG_FIRST_FRAMES;

// ---------------------------------------------------------------------------
// HOW A LOG PICKS ITS FIRST END, and why it is not simply hashed in the disc.
// The brief says the first endpoint is "any seat inside the radius (lit or
// not)". Hashed uniformly over a disc that ends up 1,400 world px across, "lit
// or not" is never lit: at ~2,000 logs against ~20,000 seats inside the radius,
// two logs share an end about once. That was built and looked at first, and it
// is two thousand disconnected dashes — a scatter, not a conspiracy, because
// nothing in it ever meets anything else.
//
// So LOG_CHAIN of them start at a seat that is ALREADY LIT, chosen from the
// seats every earlier log has landed on, and the rest seed new ground inside
// the radius. That is the same sentence read the other way round: some logs are
// found on their own and some are found by following one you already have, and
// only the second kind makes a network out of the first. The lit pool is grown
// in launch order as the schedule is built, so it is exactly the set of seats
// that have been found by the frame the log leaves.
// ---------------------------------------------------------------------------
export const LOG_CHAIN = 0.6;

/** The whole schedule, built once. Deterministic, and never two logs on one
 *  pair: a collision re-hashes the launch with a new sub-seed.
 *
 *  V2: WHERE a launch starts and HOW it starts are two separate coins.
 *    WHERE — LOG_FRONTIER of the launches are at the frontier (the outer
 *      1 - LOG_FRONTIER_BAND of the current radius), the rest anywhere inside.
 *    HOW  — LOG_CHAIN of them follow a seat an earlier log already lit, the
 *      rest seed new ground; a frontier launch that follows one you already
 *      have picks from the lit seats OUT AT THE FRONTIER, which is why the lit
 *      pool is kept sorted by its distance from the origin and the band is a
 *      binary search rather than a filter. A frontier launch with nothing lit
 *      that far out yet falls through to new ground, which is how the web gets
 *      past its own edge in the first place. */
export const buildPairs = (legato: boolean): LogPair[] => {
  const launches = logLaunches(legato);
  const radius = legato ? logRadius : logRadiusPlain;
  const used = new Set<number>();
  const out: LogPair[] = [];
  const pending: { seat: number; at: number }[] = [];
  // the lit seats, kept sorted by distance from LOG_ORIGIN
  const lit: number[] = [];
  const litD: number[] = [];
  const litSet = new Set<number>();
  const lowerBound = (d: number) => {
    let lo = 0;
    let hi = litD.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (litD[m] < d) lo = m + 1;
      else hi = m;
    }
    return lo;
  };
  const admit = (f: number) => {
    for (let i = pending.length - 1; i >= 0; i--) {
      if (pending[i].at > f) continue;
      const s = pending[i].seat;
      if (!litSet.has(s)) {
        litSet.add(s);
        const d = Math.hypot(SEATS[s].x - LOG_ORIGIN.x, SEATS[s].y - LOG_ORIGIN.y);
        const at = lowerBound(d);
        litD.splice(at, 0, d);
        lit.splice(at, 0, s);
      }
      pending.splice(i, 1);
    }
  };
  launches.forEach((f0, n) => {
    admit(f0);
    const R = radius(f0);
    for (let t = 0; t < LOG_TRIES; t++) {
      const seed = n * 977 + t * 31;
      const front = hash(seed, 27) < LOG_FRONTIER;
      let a: number;
      if (n === 0) {
        a = LOG_FIRST.a;
      } else {
        const lo = front ? lowerBound(LOG_FRONTIER_BAND * R) : 0;
        const pool = lit.length - lo;
        if (pool > 0 && hash(seed, 25) < LOG_CHAIN) {
          // follow one you already have, in this launch's own band
          a = lit[lo + Math.floor(hash(seed, 26) * pool)];
        } else {
          // new ground: uniformly by area, inside a wobbled edge — in the
          // frontier annulus for a frontier launch, in the whole disc otherwise
          const u = hash(seed, 21);
          const B2 = LOG_FRONTIER_BAND * LOG_FRONTIER_BAND;
          const r = R * Math.sqrt(front ? B2 + u * (1 - B2) : u);
          const th = hash(seed, 22) * Math.PI * 2;
          const rw = r * (1 + logWobble(th));
          a = seatNear(LOG_ORIGIN.x + rw * Math.cos(th), LOG_ORIGIN.y + rw * Math.sin(th));
        }
      }
      if (a < 0) continue;
      const b =
        n === 0
          ? LOG_FIRST.b
          : neighbour(
              a,
              LOG_STEPS_MIN + (LOG_STEPS_MAX - LOG_STEPS_MIN) * hash(seed, 23),
              hash(seed, 24) * Math.PI * 2,
            );
      if (b < 0 || a === b) continue;
      const key = Math.min(a, b) * NSEAT + Math.max(a, b);
      if (used.has(key)) continue;
      used.add(key);
      const len = Math.hypot(SEATS[b].x - SEATS[a].x, SEATS[b].y - SEATS[a].y);
      const at = f0 + len / LOG_SPEED;
      pending.push({ seat: a, at }, { seat: b, at });
      out.push({ a, b, f0, len });
      return;
    }
  });
  return out;
};

export const PAIRS_LEGATO = buildPairs(true);
export const PAIRS_PLAIN = buildPairs(false);

// The brief's own cap on the resting web, asserted rather than trusted: past
// this the per-frame path string, not the DOM, is what gets expensive.
// V2: 4,500 — the web now has to fill the whole frame rather than a ball in the
// middle of it, and the frame at k 0.50 is 8.3 million world px of field.
export const LOG_CAP = 4500;
if (PAIRS_LEGATO.length > LOG_CAP || PAIRS_PLAIN.length > LOG_CAP) {
  throw new Error(
    `UncoveringTheLogs: ${Math.max(PAIRS_LEGATO.length, PAIRS_PLAIN.length)} logs, over the ${LOG_CAP} cap`,
  );
}
const withArrival = (ps: LogPair[]): Log[] =>
  ps.map((p) => ({ ...p, arrive: p.f0 + p.len / LOG_SPEED }));
export const LOGS_LEGATO = withArrival(PAIRS_LEGATO);
export const LOGS_PLAIN = withArrival(PAIRS_PLAIN);

/** Per-seat: the frame its first log lands on, or Infinity. One array per
 *  legato setting, both built once. */
const litFrames = (logs: Log[]) => {
  const out = new Float32Array(NSEAT).fill(Infinity);
  logs.forEach((l) => {
    if (l.arrive < out[l.a]) out[l.a] = l.arrive;
    if (l.arrive < out[l.b]) out[l.b] = l.arrive;
  });
  return out;
};
export const LIT_F_LEGATO = litFrames(LOGS_LEGATO);
export const LIT_F_PLAIN = litFrames(LOGS_PLAIN);

// Nothing may be drawn faster than the set's close-up cap at the hardest zoom a
// log is ever seen at, which is K_TILT. Asserted rather than assumed.
export const SPEED_CAP = 45; // screen px/frame, this set's close-up cap
// SLEEK PASS: a log head no longer runs at one speed — it cruises and then
// decelerates into its landing on `arriveEase`, which puts the CRUISE at
// (1 + 2 * LOG_TAIL) times the nominal speed and leaves the arrival FRAME
// exactly where it was. The tail is the helper's own default here, because even
// at 1.3x this cut's head is less than two thirds of the ceiling. The k it is
// checked at is the drift's own K_TILT_DRIFT, which is the hardest zoom a log is
// ever drawn at now that D1 keeps closing past K_TILT.
export const LOG_TAIL = 0.15;
export const LOG_CRUISE = LOG_SPEED * (1 + 2 * LOG_TAIL);
if (LOG_CRUISE * K_TILT_DRIFT > SPEED_CAP) {
  throw new Error(
    `UncoveringTheLogs: a log head cruises at ${(LOG_CRUISE * K_TILT_DRIFT).toFixed(1)} screen px/frame at k ${K_TILT_DRIFT.toFixed(3)}`,
  );
}
/** How far along its line a log's head is at a frame, 0..1. */
export const logProgress = (l: Log, f: number, arrive = true) => {
  const u = clamp01((f - l.f0) / (l.arrive - l.f0));
  return arrive ? arriveEase(u, LOG_TAIL) : u;
};

// ---------------------------------------------------------------------------
// SIGNAL ON THE WEB. From "cabal" f103 the network is not a set of records any
// more, it is ONE THING IN OPERATION — so from that frame ambient packets run on
// it: a white head r PACKET_R with a `Trail` at PACKET_AMBIENT, travelling the
// length of a resting log picked at random, about one launch a frame across the
// whole web. Before f103 the found logs carry NONE: they are records being read,
// not traffic. The logs still in flight carry none either — they already have a
// head on them.
//
// WEB_PACKET_SLOTS is PACKET_PERIOD * the launch rate, so `~1 a frame` is a
// property of the pair rather than a number typed twice; a log is ~77 world px
// and a packet crosses it in about three frames, so about three are ever in
// flight, well inside the sleek brief's own cap of sixty.
// ---------------------------------------------------------------------------
export const WEB_PACKET_RATE = 1; // launches a frame, across the web ON SCREEN
export const WEB_PACKET_SLOTS = Math.round(PACKET_PERIOD * WEB_PACKET_RATE);
export const WEB_PACKET_CAP = 60;
// ...and the traffic is WHERE THE LENS IS, which is cut 1's own rule for its
// idle threads: its slots draw from a pool of the seats inside its widest
// camera. By "cabal" the web is 3,272 world px across and the frame at K_VAST
// reaches about 2,200, so a log picked uniformly out of the whole web is off
// screen more often than not and one launch a frame would show as one every two
// or three. The pool is the logs the tail's own frame can see, built once.
export const webPacketPool = (logs: Log[]): Int32Array => {
  const cy = C_FIELD + CAM_LIFT / K_END;
  const hw = FRAME_W / 2 / K_END;
  const hh = FRAME_H / 2 / K_END;
  const out: number[] = [];
  logs.forEach((l, n) => {
    const A = SEATS[l.a];
    if (Math.abs(A.x - CX) > hw || Math.abs(A.y - cy) > hh) return;
    out.push(n);
  });
  return Int32Array.from(out);
};
export const WEB_POOL_LEGATO = webPacketPool(LOGS_LEGATO);
export const WEB_POOL_PLAIN = webPacketPool(LOGS_PLAIN);
export const TRAIL_Q = 4; // the trail's smear factor is quantised this finely

// ---------------------------------------------------------------------------
// The field is emitted as one <path> of circle arcs per bucket, exactly as cut 1
// emits its own: the dark crowd is one path per depth band, and the web's lit
// seats are one path per lit bucket on the middle band.
// ---------------------------------------------------------------------------
const arc = (x: number, y: number, r: number) => {
  const d = (2 * r).toFixed(2);
  return `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(
    2,
  )} 0 1 0 ${d} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 -${d} 0`;
};
const seg = (x1: number, y1: number, x2: number, y2: number) =>
  `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;

// THE HIGHLIGHT'S LENGTH. `HIGHLIGHT_FRAMES` is two, which is right for a
// highlight on ONE landing. V2's highlight is on four thousand seats at once,
// across the whole frame, and it was built at two frames first and looked at
// (tile_cabal at f101-106): two frames of every dot in the frame going pale and
// back is a blink, not a step. So it is doubled — and only doubled, because the
// brief says four — and the pale frames are f103-106. Derived from `levelUp`'s
// own constant rather than written out, so a change there still carries.
export const HIGHLIGHT_STEP = 2 * HIGHLIGHT_FRAMES;

const MID_BAND = DEPTH_BANDS.findIndex((b) => b === 1);
const HERO = new Set<number>([...HACKERS, ...DIM]);
export const LOG_OP_STEPS = 40; // the quantisation the resting logs are grouped by

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
  accentDeep: z.string(), // deep: an unlooked-at dot
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
  dotRadius: z.number(),
  dotOpacity: z.number(),
  experiments: ExperimentsSchema,
  beats: z.object({
    and: z.number(), // "and"           — M1 tilts down off the board
    then: z.number(), // "then"
    youre: z.number(), // "you're"
    like: z.number(), // "like"
    uncovering: z.number(), // "uncovering" — the first log
    more: z.number(), // "more"         — the rate steps up
    and2: z.number(), // "and"
    more2: z.number(), // "more"        — ...and again
    logs: z.number(), // "logs"         — ...and again, and stops being countable
    until: z.number(), // "until"       — M2 pulls back
    you: z.number(), // "you"
    find: z.number(), // "find"
    this: z.number(), // "this"         — M2 has landed
    like2: z.number(), // "like"
    vast: z.number(), // "vast"         — the web is past the frame's edges
    conspiracy: z.number(), // "conspiracy" — M3 has landed
    and3: z.number(), // "and"          — the whole network starts to step up
    cabal: z.number(), // "cabal"       — ...and lands, with the one highlight
    end: z.number(), // speech ends; tail to 163
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  experiments: {},
  beats: {
    and: 0,
    then: 2,
    youre: 5,
    like: 10,
    uncovering: 15,
    more: 27,
    and2: 31,
    more2: 34,
    logs: 37,
    until: 46,
    you: 51,
    find: 55,
    this: 60,
    like2: 64,
    vast: 68,
    conspiracy: 78,
    and3: 92,
    cabal: 103,
    end: 115,
  },
});

// ---------------------------------------------------------------------------
// THE TABLE'S FRAMES ARE THE WORDS, ASSERTED. The launch table and the radius
// schedule are built once at module scope, before any prop exists, so they
// cannot read `beats` the way cut 1's ring reads `beats.three`. They are
// checked against the default beats instead: a retime that moves a word without
// moving the table fails the render rather than drifting quietly away from it.
// ---------------------------------------------------------------------------
((b) => {
  const must: [number, number, string][] = [
    [LOG_EARLY[0], b.uncovering, "the first log / uncovering"],
    [LOG_EARLY[2], b.more, "the second step-up / more"],
    [LOG_EARLY[4], b.more2, "the third step-up / more"],
    [LOG_RATE[0].f0, b.logs, "the fourth step-up / logs"],
    [LOG_RATE[3].f0, b.until, "two a frame / until"],
    [LOG_RATE[4].f0, b.this, "three a frame / this"],
    [LOG_RATE[5].f0, b.conspiracy, "four a frame / conspiracy"],
    [LOG_RATE[5].f1 + 1, b.cabal, "the last launch / cabal"],
    [LOG_SCALE_F0, b.logs, "the density ramp's start / logs"],
    [LOG_SCALE_F1, b.vast, "the density ramp's end / vast"],
    [LOG_R_PIN_F, b.until, "the frontier's pinned radius / until"],
    [camSeg("M2").f0 + 1, b.until, "M2's first moving frame / until"],
    [camSeg("M3").f0 + 1, b.this, "M3's first moving frame / this"],
  ];
  must.forEach(([got, want, what]) => {
    if (got !== want) {
      throw new Error(`UncoveringTheLogs: ${what} is f${got}, the word is f${want}`);
    }
  });

  // ...AND THE FRONTIER REACHES THE FRAME ON ITS OWN WORDS. The whole curve is
  // one number (LOG_R_MAX, pinned at f46), so every other point on it is a
  // consequence and is checked rather than set: the web must be past the
  // FIELD'S OWN SIDES on "vast", past the frame's own BOTTOM edge — the far
  // corner of a 1080x1920 frame at k 0.50 — on "conspiracy", and still growing
  // at f92. The frame's reach at a frame is read off this cut's own camera.
  const reach = (f: number) => {
    const c = runCamera(f + HANDOVER, CAM.F, CAM.CY, CAM.K);
    const d = sway(f + HANDOVER);
    const cyf = c.cy + d.dy;
    const hw = FRAME_W / 2 / c.k;
    const hh = FRAME_H / 2 / c.k;
    return {
      side: hw,
      down: cyf + hh - C_FIELD,
      up: C_FIELD - (cyf - hh),
    };
  };
  const wants: [number, number, string][] = [
    [logRadius(b.uncovering), 120 * 0.9, `the frontier on "uncovering" vs the brief's 120`],
    [logRadius(b.vast), FIELD_X, `the frontier on "vast" vs the field's own side ${FIELD_X.toFixed(0)}`],
    [
      logRadius(b.conspiracy),
      reach(b.conspiracy).down,
      `the frontier on "conspiracy" vs the frame's bottom edge`,
    ],
    [logRadius(b.and3), 2200, `the frontier on "and" f92 vs the brief's 2200`],
  ];
  wants.forEach(([got, want, what]) => {
    if (got < want) {
      throw new Error(`UncoveringTheLogs: ${what} — ${got.toFixed(0)} < ${want.toFixed(0)}`);
    }
  });
})(defaultProps.beats);

const UncoveringTheLogs: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
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
  dotRadius,
  dotOpacity,
  experiments,
  beats,
}) => {
  const frame = useCurrentFrame();
  // Every clock in this piece — the camera's key track, `breath`, `sway` and the
  // grid's own drift — runs on cut 0a's frame, so nothing restarts at the cut.
  const wf = frame + HANDOVER;
  const tone = makeTone(accentDeep, accent);
  // Cut 0a's board outline was taken ink -> accent by its five reaches and is
  // fully accent long before this cut opens; the crossfade is still read off
  // that cut's own `convertAt` rather than hard-coded, so the board this piece
  // holds is the board that cut left, whatever it lands on.
  const edgeTone = makeTone(ink, accent);
  const LOGS = experiments.legato ? LOGS_LEGATO : LOGS_PLAIN;
  const LIT_F = experiments.legato ? LIT_F_LEGATO : LIT_F_PLAIN;
  const POOL = experiments.legato ? WEB_POOL_LEGATO : WEB_POOL_PLAIN;

  // -- camera ----------------------------------------------------------------
  const track = experiments.drift ? CAM : CAM_PLAIN;
  const cam = runCamera(wf, track.F, track.CY, track.K);
  const drift = sway(wf);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- how lit a seat is -----------------------------------------------------
  const litOf = (i: number) => {
    const f0 = LIT_F[i];
    return f0 === Infinity ? 0 : ease((frame - f0) / TONE_DUR, EASE_ARRIVE);
  };
  // "and cabal": every record steps from 0.6 to 0.95 and lands on the word, and
  // every lit seat takes the one highlight for two frames as it does.
  const stepUp = ease((frame - beats.and3) / (beats.cabal - beats.and3), EASE_ARRIVE);
  const restOp = LOG_REST + (LOG_STEP - LOG_REST) * stepUp;
  const hot = experiments.highlight && frame >= beats.cabal && frame < beats.cabal + HIGHLIGHT_STEP;

  // -- the field -------------------------------------------------------------
  // Cut 0a's cull, cut 0a's margin, cut 0a's band assignment: at f0 this loop
  // emits exactly the three paths that cut's f127 emits.
  const bandK = DEPTH_BANDS.map((b) => depthK(k, b, experiments.depth));
  const kCull = Math.min(...bandK);
  const margin = DOT_MAX + 4;
  const x0 = cx - FRAME_W / 2 / kCull - margin;
  const x1 = cx + FRAME_W / 2 / kCull + margin;
  const y0 = cy - FRAME_H / 2 / kCull - margin;
  const y1 = cy + FRAME_H / 2 / kCull + margin;
  const gc0 = Math.max(0, Math.floor((x0 - GRID_X0) / STEP_X) - 1);
  const gc1 = Math.min(COLS - 1, Math.ceil((x1 - GRID_X0) / STEP_X) + 1);
  const gr0 = Math.max(0, Math.floor((y0 - GRID_Y0) / STEP_Y) - 1);
  const gr1 = Math.min(ROWS - 1, Math.ceil((y1 - GRID_Y0) / STEP_Y) + 1);

  const dark: string[][] = DEPTH_BANDS.map(() => []);
  // the web's own seats, on the middle band: one bucket per lit amount, plus one
  // more for the two highlight frames
  const litBucket: string[][] = Array.from({ length: BUCKETS + 1 }, () => []);
  for (let gr = gr0; gr <= gr1; gr++) {
    for (let gc = gc0; gc <= gc1; gc++) {
      const i = gr * COLS + gc;
      if (!SEAT_ALIVE[i]) continue;
      if (HERO.has(i)) continue;
      const s = SEATS[i];
      const r = dotRadius * s.r * breath(wf, hash(i, 9));
      if (frame < LIT_F[i]) {
        dark[BAND[i]].push(arc(s.x, s.y, r));
      } else {
        const l = clamp01(litOf(i));
        litBucket[hot ? BUCKETS : Math.round(l * (BUCKETS - 1))].push(arc(s.x, s.y, r));
      }
    }
  }

  // -- cut 0a's nineteen -----------------------------------------------------
  // The five are ripe and stay ripe; the fourteen are half-known and stay there,
  // unless a log finds one of them, in which case it lights like any other seat.
  const heroDots = [
    ...HACKERS.map((i, n) => ({ i, n, t: 1, op: 1 })),
    ...DIM.map((i, n) => ({
      i,
      n: n + 100,
      t: 0,
      op: (DIM_SEAT_OP - OP_DARK) / (1 - OP_DARK),
    })),
  ].map(({ i, n, t, op }) => {
    const s = SEATS[i];
    const l = clamp01(litOf(i));
    const lit = Math.max(t, l);
    return {
      key: n,
      x: s.x,
      y: s.y,
      r: dotRadius * s.r * breath(wf, hash(i, 9)),
      fill: hot && lit > 0 ? HIGHLIGHT : tone(lit),
      opacity: dotOpacity * seatOpacity(Math.max(op, l)),
    };
  });

  // -- the web ---------------------------------------------------------------
  // Resting logs are grouped by quantised opacity into one <path> each. V2: the
  // logs IN FLIGHT are bucketed too. At four a frame times LOG_RATE_SCALE there
  // are up to ~550 heads at once, and six elements each — a group, a thread, a
  // white tip and three `Trail` circles — is 3,300 nodes on its own, over the
  // set's ~3,000 ceiling. Every head travels at LOG_SPEED under one camera, so
  // every head has the SAME screen speed and therefore the same `trailFactor`:
  // the threads become one <path>, the tips one more, and the trail is one path
  // per TRAIL_OPACITY step at that step's own opacity — the same circles at the
  // same radii and the same opacities `Trail` would have drawn, off `levelUp`'s
  // own constants, and still switched by `experiments.trails`.
  const rest = new Map<number, string[]>();
  const live: string[] = [];
  const tips: string[] = [];
  // SLEEK PASS: a head no longer travels at one speed, so the heads in flight no
  // longer all share one `trailFactor` — a cruising head smears and a head
  // decelerating into its landing does not. The factor is quantised into TRAIL_Q
  // steps and the trail is one <path> per (trail frame, step), which is at most
  // TRAIL_FRAMES * TRAIL_Q = 12 nodes rather than one per head.
  const trails: string[][][] = TRAIL_OPACITY.map(() =>
    Array.from({ length: TRAIL_Q }, () => [] as string[]),
  );
  for (let n = 0; n < LOGS.length; n++) {
    const l = LOGS[n];
    if (frame < l.f0) continue;
    const A = SEATS[l.a];
    const B = SEATS[l.b];
    if (Math.min(A.x, B.x) > x1 || Math.max(A.x, B.x) < x0) continue;
    if (Math.min(A.y, B.y) > y1 || Math.max(A.y, B.y) < y0) continue;
    if (frame >= l.arrive) {
      const fresh = 1 - clamp01((frame - l.arrive) / LOG_SETTLE);
      const op = restOp + (LOG_LIVE - restOp) * fresh;
      const q = Math.round(op * LOG_OP_STEPS);
      const bucket = rest.get(q);
      if (bucket) bucket.push(seg(A.x, A.y, B.x, B.y));
      else rest.set(q, [seg(A.x, A.y, B.x, B.y)]);
      continue;
    }
    const ux = (B.x - A.x) / l.len;
    const uy = (B.y - A.y) / l.len;
    const p = logProgress(l, frame, experiments.arrive);
    const d = l.len * p;
    const px = A.x + ux * d;
    const py = A.y + uy * d;
    live.push(seg(A.x, A.y, px, py));
    tips.push(arc(px, py, TIP_R));
    if (!experiments.trails) continue;
    const dPrev = l.len * logProgress(l, frame - 1, experiments.arrive);
    const tq = Math.round(trailFactor((d - dPrev) * k) * (TRAIL_Q - 1));
    if (tq <= 0) continue;
    for (let i = 0; i < TRAIL_FRAMES; i++) {
      const g = frame - (i + 1);
      if (g < l.f0) break; // the head did not exist that frame
      const db = l.len * logProgress(l, g, experiments.arrive);
      trails[i][tq].push(arc(A.x + ux * db, A.y + uy * db, TIP_R * (1 - 0.15 * (i + 1))));
    }
  }

  // -- dark traffic, and signal on the finished web --------------------------
  // The unlooked-at field is unseen, not dead: cut 0a's pool and cut 0a's
  // schedule, and a thread is only drawn while BOTH of its ends are still dark.
  // A seat's traffic stops being dark traffic the moment a log lights it — from
  // there the web's own lines are what it carries.
  const darkLines: string[][] = Array.from({ length: DARK_STEPS }, () => []);
  if (experiments.darkTraffic) {
    for (let j = 0; j < DARK_N; j++) {
      const t = darkAt(DARK_POOL, j, wf);
      if (!t) continue;
      if (HERO.has(t.a) || HERO.has(t.b)) continue;
      if (frame >= LIT_F[t.a] || frame >= LIT_F[t.b]) continue;
      const A = SEATS[t.a];
      const B = SEATS[t.b];
      if (Math.min(A.x, B.x) > x1 || Math.max(A.x, B.x) < x0) continue;
      if (Math.min(A.y, B.y) > y1 || Math.max(A.y, B.y) < y0) continue;
      const q = Math.min(DARK_STEPS - 1, Math.max(0, Math.round(t.fade * DARK_STEPS) - 1));
      darkLines[q].push(seg(A.x, A.y, A.x + (B.x - A.x) * t.dn, A.y + (B.y - A.y) * t.dn));
    }
  }

  // ...and from "cabal" the network is one thing in operation.
  const webHeads: string[] = [];
  const webTrails: string[][] = TRAIL_OPACITY.map(() => []);
  const webTrailF = experiments.trails ? trailFactor(PACKET_SPEED * k) : 0;
  // A SCREEN-SPACE radius, which is what `iconShadow` does and for the same
  // reason: the web's packets only exist from "cabal", at k 0.50 falling to
  // K_END, where PACKET_R in WORLD px is 1.5 screen px across and the signal is
  // not there at all. Divided by k it is the same 3 px head cut 0a puts on its
  // five reaches. Cut 0a's own packets, held here, keep their world radius —
  // they are hero lines drawn at k 1.0-1.6 and they read as they are.
  const packetR = PACKET_R / k;
  if (experiments.packets && frame >= beats.cabal && POOL.length > 0) {
    for (let j = 0; j < WEB_PACKET_SLOTS && webHeads.length < WEB_PACKET_CAP; j++) {
      const first = beats.cabal + hash(j, 41) * PACKET_PERIOD;
      const cyc = Math.floor((frame - first) / PACKET_PERIOD);
      for (let c = cyc; c >= 0 && c >= cyc - 1; c--) {
        const launch = first + c * PACKET_PERIOD;
        const l = LOGS[POOL[Math.floor(hash(j * 977 + c, 53) * POOL.length)]];
        if (!l || frame < l.arrive) continue;
        const travel = l.len / PACKET_SPEED;
        const u = (frame - launch) / travel;
        if (u < 0 || u > 1) continue;
        const A = SEATS[l.a];
        const B = SEATS[l.b];
        if (A.x > x1 || A.x < x0 || A.y > y1 || A.y < y0) continue;
        const px = A.x + (B.x - A.x) * u;
        const py = A.y + (B.y - A.y) * u;
        webHeads.push(arc(px, py, packetR));
        for (let i = 0; i < TRAIL_FRAMES && webTrailF > 0; i++) {
          const ub = u - ((i + 1) / travel);
          if (ub < 0) break;
          webTrails[i].push(
            arc(A.x + (B.x - A.x) * ub, A.y + (B.y - A.y) * ub, packetR * (1 - 0.15 * (i + 1))),
          );
        }
      }
    }
  }

  // -- cut 0a's reaches and its mark, at rest --------------------------------
  // The five are still LIVE lines — that is what the logs are being uncovered
  // under — so they keep carrying cut 0a's own packets, from cut 0a's own
  // schedule. This is also what makes f0 blend: that cut's f127 has signal on
  // them, so this cut's f0 has to have the same signal in the same places.
  const reaches = HACKERS.map((i, n) => {
    const p = reachAt(n, wf);
    return p ? { key: n, x1: SEATS[i].x, y1: SEATS[i].y, x2: p.x, y2: p.y } : null;
  });
  const reachPackets = reachPacketsAt(wf, k, experiments.packets);
  const dimReaches = DIM.map((i, n) => {
    const p = dimReachAt(n, wf);
    return p ? { key: n, x1: SEATS[i].x, y1: SEATS[i].y, x2: p.x, y2: p.y } : null;
  });

  const midT = worldTransform(cx, cy, bandK[MID_BAND]);
  const midTransform = `translate(${midT.tx.toFixed(3)} ${midT.ty.toFixed(3)}) scale(${
    bandK[MID_BAND]
  })`;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={wf}
        cy={cy}
        cyRest={HHF_CAM.CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <svg
          width={FRAME_W}
          height={FRAME_H}
          viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {/* the unlooked-at crowd: one path per depth band, nothing else */}
          {DEPTH_BANDS.map((b, bi) => {
            const t = worldTransform(cx, cy, bandK[bi]);
            return dark[bi].length === 0 ? null : (
              <path
                key={b}
                transform={`translate(${t.tx.toFixed(3)} ${t.ty.toFixed(3)}) scale(${bandK[bi]})`}
                d={dark[bi].join("")}
                fill={tone(0)}
                opacity={dotOpacity * OP_DARK}
              />
            );
          })}

          {/* everything that is ink or web, on one plane */}
          <g transform={midTransform}>
            {/* DARK TRAFFIC, first in the tree exactly as cut 0a draws it, so
                this cut's f0 IS that cut's f127 down to the draw order. On the
                middle band with the rest of the ink: a thread whose two ends are
                in two different parallax bands cannot be drawn in either. */}
            {darkLines.map((d, q) =>
              d.length === 0 ? null : (
                <path
                  key={`k${q}`}
                  d={d.join("")}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  fill="none"
                  opacity={DARK_TRAFFIC_OPACITY * ((q + 1) / DARK_STEPS)}
                />
              ),
            )}

            {/* CUT 0A'S BOARD, held. Drawn exactly as that cut draws it: cut 3's
                `Board` with an EMPTY post list, because `Board` takes one ink
                colour for the panel and its posts and here the panel is accent
                (taken) while the two posts stay ink, and then cut 3's own
                `postX0` / `postY` / `postLen` for those two lines. Nothing about
                the geometry is this cut's. */}
            <g transform={`translate(0 ${BOARD_DY})`}>
              <Board
                board={HF_BOARD}
                rows={HF_ROWS}
                posts={[]}
                inkOp={OP_READ}
                ink={edgeTone(convertAt(wf))}
                icon={icon}
                frame={wf}
                k={k}
                trails={false}
              />
              <g style={{ filter: icon }}>
                {HF_POST_ROWS.map((row) => (
                  <line
                    key={row}
                    x1={postX0(HF_BOARD)}
                    y1={postY(row)}
                    x2={postX0(HF_BOARD) + postLen(HF_BOARD, row)}
                    y2={postY(row)}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={OP_READ}
                  />
                ))}
              </g>
            </g>

            {/* cut 0a's fourteen dim reaches, at rest */}
            {dimReaches.map((d) =>
              d ? (
                <line
                  key={`d${d.key}`}
                  x1={d.x1}
                  y1={d.y1}
                  x2={d.x2}
                  y2={d.y2}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={DIM_OPACITY}
                />
              ) : null,
            )}

            {/* the web's records: one path per opacity step */}
            {[...rest.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([q, d]) => (
                <path
                  key={`w${q}`}
                  d={d.join("")}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  fill="none"
                  opacity={q / LOG_OP_STEPS}
                />
              ))}

            {/* the web's seats: one path per lit bucket */}
            {litBucket.map((d, n) =>
              d.length === 0 ? null : (
                <path
                  key={`l${n}`}
                  d={d.join("")}
                  fill={n === BUCKETS ? HIGHLIGHT : tone(n / (BUCKETS - 1))}
                  opacity={n === BUCKETS ? 1 : dotOpacity * seatOpacity(n / (BUCKETS - 1))}
                />
              ),
            )}

            {/* cut 0a's nineteen */}
            {heroDots.map((d) => (
              <circle key={d.key} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={d.opacity} />
            ))}

            {/* the logs still in flight: live threads, their trails, their
                white heads — one path each, see the note above */}
            {live.length === 0 ? null : (
              <path
                d={live.join("")}
                stroke={accent}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
                opacity={LOG_LIVE}
              />
            )}
            {trails.map((byQ, i) =>
              byQ.map((d, q) =>
                d.length === 0 ? null : (
                  <path
                    key={`t${i}_${q}`}
                    d={d.join("")}
                    fill={ink}
                    opacity={(TRAIL_OPACITY[i] * q) / (TRAIL_Q - 1)}
                  />
                ),
              ),
            )}
            {tips.length === 0 ? null : <path d={tips.join("")} fill={ink} />}

            {/* the signal running on the finished web, from "cabal" */}
            {webTrails.map((d, i) =>
              d.length === 0 ? null : (
                <path
                  key={`wt${i}`}
                  d={d.join("")}
                  fill={ink}
                  opacity={TRAIL_OPACITY[i] * webTrailF * PACKET_AMBIENT}
                />
              ),
            )}
            {webHeads.length === 0 ? null : (
              <path d={webHeads.join("")} fill={ink} opacity={PACKET_AMBIENT} />
            )}

            {/* cut 0a's five reaches, at rest */}
            <g style={{ filter: icon }}>
              {reaches.map((r) =>
                r ? (
                  <line
                    key={`r${r.key}`}
                    x1={r.x1}
                    y1={r.y1}
                    x2={r.x2}
                    y2={r.y2}
                    stroke={accent}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={REACH_OP}
                  />
                ) : null,
              )}
              {reachPackets.map((p) => (
                <g key={`p${p.key}`}>
                  <Trail
                    frame={wf}
                    k={k}
                    at={p.at}
                    r={PACKET_R}
                    fill={ink}
                    opacity={PACKET_HERO}
                    enabled={experiments.trails}
                  />
                  <circle
                    cx={p.at(wf).x}
                    cy={p.at(wf).y}
                    r={PACKET_R}
                    fill={ink}
                    opacity={PACKET_HERO}
                  />
                </g>
              ))}
            </g>

            {/* the mark */}
            <g opacity={OP_READ}>
              <MarkGlyph
                mark={HUGGINGFACE}
                cx={HF_X}
                at={() => HF_INK_BOTTOM}
                frame={wf}
                k={k}
                ink={ink}
                icon={icon}
                trails={false}
              />
            </g>
          </g>
        </svg>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default UncoveringTheLogs;
