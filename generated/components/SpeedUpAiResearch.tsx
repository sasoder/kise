import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
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
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  EASE_ARRIVE,
  HIGHLIGHT,
  TRAIL_FRAMES,
  TRAIL_OPACITY,
  ease,
  highlightTone,
  softFront,
  trailFactor,
} from "./levelUp";
// CUT 3 IS THE WORLD. Every piece of geometry, every schedule constant and the
// framing rule are IMPORTED from it; nothing here is restated or re-derived.
import {
  ARC_LOWER,
  ARC_UPPER,
  BEAD_R,
  BEAD_SPEED,
  BEAD_STEP,
  BLOB_IDLE_THREADS,
  BLOCK_BOT,
  CENTRE_X,
  CONV_DUR,
  EVAL_DEG,
  EVAL_FOOT,
  F_COLS,
  F_ROWS,
  LINE_BOT,
  LINE_TOP,
  LOOP_C,
  LOOP_CIRC,
  LOOP_FRONT_SOFT,
  LOOP_R,
  NSEAT,
  PEOPLE,
  PERSON_SIZE,
  PERSON_Y,
  SEATS,
  SEAT_AT,
  SPOKES,
  SPOKE_R1,
  SPOKE_TRAVEL,
  STATIONS,
  STATION_PAUSE,
  STATION_R,
  STROKE,
  StationGlyph,
  TRAIN_DEG,
  TRAIN_FOOT,
  WORLD_H,
  WORLD_W,
  arcLen,
  centreFor,
  degOf,
  onLoop,
} from "./TheirOwnTraining";
// CUT 2 IS THE THOUGHT BUBBLE. Same squircle, same air over the head, same
// draw, same glyph weight — a question mark instead of a check.
import {
  BUB_DRAW,
  BUB_GAP,
  BUB_H,
  BUB_PATH,
  BUB_TRAIL,
  BUB_TRAIL_DUR,
  BUB_W,
  CHECK_S,
  CHECK_STROKE,
  PERSON_INK_TOP,
} from "./SubvertTheInfrastructure";

export const FPS = 24;

// ---------------------------------------------------------------------------
// CUT 5 of the Dwarkesh clip `Ajeya_Six_Months_Behind`. Ajeya Cotra:
// "we could maybe be misunderstanding the ease of automating AI research and
//  stuff like that, or how much speed-up AI research is really getting."
//
// SRT span 1:12.980 -> 1:19.159 at 24fps.
// round((79.159 - 72.980) * 24) = round(6.179 * 24) = round(148.3) = 148
// frames of speech, plus the 16 frame tail = 164.
//
// ONSETS, frames from f0:
//   f0   we                 f84  and
//   f4   could              f91  stuff
//   f7   maybe              f95  like
//   f12  be                 f99  that
//   f17  misunderstanding   f107 or / how
//   f36  the                f109 much
//   f51  ease               f113 speed
//   f59  of                 f118 up
//   f62  automating         f120 ai
//   f70  ai                 f126 research
//   f74  research           f135 is
//                           f138 really
//                           f142 getting
//                           f148 speech ends   f164 last frame
//
// ---------------------------------------------------------------------------
// THE WORLD IS CUT 3's, ten seconds after cut 4. `TheirOwnTraining.tsx` is
// FINAL and read-only; this piece imports it and restates nothing:
//   the world      WORLD_W WORLD_H CENTRE_X STROKE RING_STROKE centreFor
//                  BLOCK_BOT (and CONTENT_CENTRE's rule, re-solved below
//                  because this cut's block has two thought bubbles on top
//                  of it — see THE BLOCK)
//   the model      SEATS NSEAT SEAT_AT F_COLS F_ROWS BLOB_IDLE_THREADS
//   the loop       LOOP_C LOOP_R LOOP_CIRC onLoop degOf arcLen LOOP_FRONT_SOFT
//   the stations   STATION_R TRAIN_DEG EVAL_DEG STATIONS StationGlyph CONV_DUR
//                  (the graduation-cap at training, the clipboard-check at
//                  evaluation, drawn through cut 3's own component at
//                  ringDraw 1 / iconDraw 1 — this cut opens on them resolved)
//   the spokes     SPOKES SPOKE_R1 SPOKE_TRAVEL
//   the people     PERSON_SIZE PERSON_Y PEOPLE LINE_TOP LINE_BOT
//   the beads      BEAD_R BEAD_SPEED BEAD_STEP STATION_PAUSE ARC_UPPER
//                  ARC_LOWER
// and from CUT 2, `SubvertTheInfrastructure.tsx` (also FINAL, also read-only),
// the thought bubble: BUB_W BUB_H BUB_GAP BUB_PATH BUB_TRAIL BUB_TRAIL_DUR
// BUB_DRAW CHECK_S CHECK_STROKE PERSON_INK_TOP. Nothing in either file was
// edited to build this one.
//
// THE STATE AT f0 is the HUMAN state — cut 3's f35 with the model cut 4 left
// behind. An ink loop, two ink stations with their two ink glyphs, two ink
// spokes, ink beads already circling at cut 3's base tempo (the circuit does
// not switch on here, it has been running for a minute), the model fully RIPE,
// and the two people's lines LIVE at OP_READ. The loop is the research
// process and it is still theirs: their beads run it.
//
// ---------------------------------------------------------------------------
// THE PICTURE. ONE MOTION. The two people look at their research loop and
// don't know; the model takes the whole loop in one easy sweep; then the loop
// starts to run faster and faster and does not settle. The question is how
// easy, and how fast — so nothing resolves, and the last frame is still
// accelerating.
//
// ---------------------------------------------------------------------------
// THE GESTURES. Every one of them is a word, and there is nothing else in the
// piece. No overshoot; the sweep is one continuous pass. The one punctuation is
// the set's own: each station CLICKS half a step brighter for two frames as its
// ring closes, exactly as cut 3's takes do (harmony pass — cut 5 was the only
// cut in the set whose rings converted silently, and it landed softer than its
// neighbours for it).
//
//   G1 WE DON'T KNOW — "we could maybe be misunderstanding"          f12-24
//     A THOUGHT BUBBLE goes up over each person exactly the way cut 2's do:
//     the small trail dot, then the big one, then the squircle draws round
//     over BUB_DRAW (5 frames), then a QUESTION MARK draws head-led inside it
//     over four — the hook over three and its dot landing on the fourth. The
//     left one starts on f12 "be", the right one three frames later, and both
//     are complete at f21 / f24, inside "misunderstanding". They never change
//     again: two white question marks are still there on the last frame over a
//     loop spinning orange. That contrast is the line.
//
//   G2 THE EASE — "the ease of"                                      f34-58
//     Camera M1 alone: the pull-back off the two people onto the whole loop
//     with its two bubbles. Nothing else happens; the beads keep circling.
//
//   G3 AUTOMATING — "automating AI research"                         f62-80
//     THE SWEEP, and it is the whole cut. The loop converts ink -> ACCENT in
//     ONE continuous pass: an accent front runs round the loop from the
//     TRAINING station CLOCKWISE through evaluation and back to training,
//     f62-78, at one solved speed. It is cut 3's G5 — which took 28 frames and
//     a camera move — compressed into 16 frames and one stroke. That
//     compression IS the "ease".
//       * each station converts as the front passes it: training at f62 (the
//         front's own start) and evaluation at f67.2, each over CONV_DUR
//         frames, ring and glyph together because cut 3 draws them as one
//         colour — and each CLICKS to HIGHLIGHT for HIGHLIGHT_FRAMES as its
//         ring closes on it, f64-65 and f69-70, which is cut 3's own
//         `conv + CONV_DUR - 1` rule to the frame.
//       * each spoke converts with its station, running DOWN from the ring's
//         inner edge into the model over SPOKE_CONV frames (train f62-67,
//         eval f67.2-72.2) — the sweep spilling inward. Every spoke is accent
//         by f73.
//       * every bead takes its colour from the front at the point it is
//         standing on, so a bead the front passes turns accent where it is.
//       * the two people's lines fall OP_READ -> OP_DARK together, f74-80.
//     From f80 the loop, both stations, both spokes and every bead are accent,
//     and the people are holding two dead lines.
//
//   G4 AND STUFF LIKE THAT — "and stuff like that"                   f84-107
//     Hold. Camera M2 creeps in on the loop's centre under it. The beads are
//     the motion: still at base tempo, still going in and out of the model.
//
//   G5 SPEED-UP — "or how much speed-up AI research is really getting"
//                                                            f109-163 and on
//     THE RAMP. From f109 "much", everything that moves rides ONE curve —
//     ramp(f) = ((f - 109) / 55)^1.3, an ease-IN that is 7% at "speed" (f113),
//     34% at "research" (f126) and 52% at "getting" (f142), and that is still
//     rising on the last rendered frame:
//       (1) BEAD COLOUR   ACCENT -> HIGHLIGHT -> #FFFFFF on ramp^0.75, so the
//                         smear whitens with its head and the ring carries
//                         WHITE COMETS by the end: 17% hot at f118, 48% at
//                         f135, 98% on the last frame. The HEADS go pure white;
//                         the smear behind them is held to the set's trail
//                         ladder x1.5 (0.65 / 0.33 / 0.12 at the top) so the
//                         LOOP ITSELF still reads orange between the comets —
//                         see BeadSmear.
//       (2) BEAD SIZE     BEAD_R -> BEAD_R x 1.5, on the same curve
//       (3) BEAD SPEED    x1 -> x3.2 asked, x2.60 given: the cap holds the
//                         peak to exactly 60.0 screen px/frame (from f152)
//       (4) LAUNCH RATE   x1 -> x6 (interval BEAD_STEP -> BEAD_STEP/6) — the
//                         ramp's remainder, and what makes the COUNT of beads
//                         on the ring climb 7 -> 9 -> 11 -> 13 across
//                         f109 / f135 / f150 / f163
//       (5) FLICKER       the 12 seats at each spoke's foot go HIGHLIGHT for
//                         two frames on every landing / departure: a mean gap
//                         of 9.4 / 9.9 frames (train / eval) before f100, and
//                         4.3 / 2.2 over f140-163
//       (6) IDLE THREADS  x1 -> x3 inside the model
//     PASS 2 added (1) (2) (5), the cap and the rate's ceiling. The first
//     build had only the speed, the rate on the same curve as the speed, and
//     the threads — and on an orange ring carrying orange beads that is not a
//     picture: f109 and f163 were indistinguishable. The acceleration now has
//     to be READ off colour, size and count, which hold up in a still; the
//     speed is the smallest part of it.
//     The beads are not retimed by a schedule: their position is the integral
//     of the ramped speed, so the acceleration is continuous and a bead that
//     is mid-arc when the ramp starts simply speeds up. The station pause is
//     44 world px of route rather than 2 frames, so it shortens with
//     everything else. DEAD STILL f110-113 (the held breath, only the beads
//     moving), then camera M3 pulls back WITH the ramp from f114.
//     The ramp does NOT settle: it reaches its maximum at f164, which is one
//     frame past the last rendered frame, so the cut ends mid-acceleration.
//
//   RESOLVED f150-163 — the wide: the loop a ring of white comets running a
//     process nobody is holding, the model's two feet boiling, and two white
//     people with two white question marks above it. It holds; it never fades.
//
// ---------------------------------------------------------------------------
// THE CAMERA. Three moves, one damped track, `camMove` keys per frame. cx is
// CENTRE_X for the whole piece — the two people sit at +-320 of it and the
// loop is centred on it, so there is nothing to pan to; the camera only zooms
// and tilts, and `GridBackground` gets no cx at all.
//
//   M0 THE OPEN   k 1.22, the people's ink head tops at screen y 520.
//                 The brief asked for k 1.5 with both station rings in frame
//                 and the heads at 560. Those cannot both hold: the rings are
//                 744.8 world px apart across their outer edges, so at k 1.5
//                 the training ring's left edge lands at screen -18 (cut by
//                 the frame) and the loop's lowest point at 1740, three
//                 hundred px inside the caption band. The two binding
//                 constraints are the briefed head height and the band, and
//                 they solve to k <= 1.229 (the block is 775.8 world px from
//                 a head top to the loop's lowest point, and `sway` puts 6 px
//                 of that budget on the camera): at k 1.22 the heads sit at
//                 520, the loop's lowest point at 1466 — 14 px clear of the
//                 1480 the captions leave, sway and all — and the two rings
//                 keep 82 px of margin each side at their worst frame. The
//                 loop's top lands at screen 574 and the rings at 799, so the
//                 people stand on top of their own research loop with the two
//                 question marks above them
//                                            — "we could maybe be"      f0-33
//   M1 THE REVEAL k 1.22 -> 1.05, c -153.8 -> CONTENT_CENTRE_5 (the block's
//                 middle at screen 835), keys f34-50 warp 0.72, landed f58,
//                 peak 1.12%/frame. The whole loop with its two people and
//                 two bubbles: 777 screen px across, block screen 383..1287
//                                            — "the ease of"           f36-62
//   M2 THE CREEP  k 1.05 -> 1.25 on the same content centre, so the model's
//                 own centre climbs to screen 905 and the loop fills the
//                 frame. ONE even ease, warp 1.0, keys f84-102, landed f110,
//                 peak 1.28%/frame, then DEAD STILL f110-113 (<= 0.09%/frame,
//                 sway only) — the held breath the ramp starts inside. The
//                 bubbles stay in frame: the block's top is at screen 297 at
//                 k 1.25, so no cap on k was needed
//                                            — "and stuff like that"  f84-107
//   M3 THE RELEASE k 1.25 -> 1.05, keys f112-136 warp 0.7, LANDED f142, peak
//                 0.97%/frame at f125 — the pull-back rides the ramp out: the
//                 frame opens as the loop speeds up, which is the one reading
//                 that makes a faster loop look faster rather than just
//                 busier. Pass 2 moved its landing from k 0.95 to k 1.05, so
//                 the cut ends on M1's own framing — as big as cut 3's wide
//                 and no smaller: block screen 384..1286, the loop's lowest
//                 point 194 px clear of the 1480 the captions take (1473 at
//                 its worst frame of the whole piece, sway included) and the
//                 bubbles' tops 384 px down from the top of the frame.
//                   HARMONY PASS: the keys came back 8 frames, f120-144 ->
//                 f112-136, same warp. The delivered build LANDED AT f151 on a
//                 word that is spoken at f142 — the one late landing in the
//                 five-cut set, and against a house rule that every move lands
//                 4-10 frames BEFORE its word. It now releases at f114, one
//                 frame after "speed" (f113) rather than five after "up", and
//                 is settled at f142 on "getting". The cost is the held breath,
//                 which goes from nine frames to four; four frames dead still
//                 with the beads already accelerating inside them still reads
//                 as a breath, and a late landing does not read at all. It
//                 remains the one move in the piece under the 1%/frame floor,
//                 by three hundredths.
//                            — "speed-up AI research is really getting" f113-
//
// ambient, not gestures: `breath` on every dot, `sway` on the camera, the
// grid's drift, and the model's own idle traffic (which is on the ramp).
// ---------------------------------------------------------------------------

export const DURATION = 164;

const smooth = (u: number) => smoothstep(clamp01(u));
const clampi = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// THE THOUGHT BUBBLE, and the question mark in it.
//
// Cut 2's bubble, unchanged: the same 78 x 58 squircle at the same BUB_GAP of
// air over the top of the head, the same two trail dots, the same 5-frame
// draw. The head top is measured off person.png's alpha box (its ink runs
// 40..472 of 512) exactly as cut 2 measures it, so the air over the head is
// real air and not image padding.
//
// Inside it is Lucide `circle-help`'s INNER strokes only — the hook and its
// dot, without the circle, because the bubble already is the circle. The two
// paths are the source file's verbatim (ISC).
//
// One thing is not the check's: the SIZE of the box. The check fills 16 x 11
// of its 24-unit box; these two paths fill 6 x 10.1 of theirs, because the
// box was drawn around a circle that is not here. At the check's own fraction
// the mark would be 10 world px tall in a 58 px bubble. So the box is drawn at
// QM_BOOST of the check's fraction and the stroke is divided back out by the
// same factor, which puts the ink at 16.8 x 10 world px — the check's optical
// weight — on a 3.46 world px stroke, which is the check's stroke to the
// hundredth and still lighter than the station ring's 3.5. Caps and joins are
// the check's exactly.
// ---------------------------------------------------------------------------
export const QM_PATHS = [
  "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", // the hook
  "M12 17h.01", // and its dot
];
export const QM_BOOST = 1.25;
export const QM_S = CHECK_S * QM_BOOST;
export const QM_STROKE = CHECK_STROKE / QM_BOOST; // 3.46 world px, the check's
export const QM_HOOK_DRAW = 3;
export const QM_DOT_DRAW = 1; // four frames all told, head-led

/** the world y of the top of a head, off the PNG's alpha box */
export const HEAD_TOP_Y = PERSON_Y - PERSON_SIZE / 2 + PERSON_SIZE * PERSON_INK_TOP; // -397.78
export const BUB_Y1 = HEAD_TOP_Y - BUB_GAP; // the bubble's foot
export const BUB_Y0 = BUB_Y1 - BUB_H; // its top
export const BUB_F0 = 12; // "be"
export const BUB_STAGGER = 3; // the right one three frames later
export const BUB_T0 = [BUB_F0, BUB_F0 + BUB_STAGGER];

// ---------------------------------------------------------------------------
// THE BLOCK, and the one vertical rule. Cut 3's rule holds — the middle of
// everything the piece draws sits at screen y 835, which is exactly
// `cy = centre + CAM_LIFT / k` — but the block is not cut 3's: two thought
// bubbles put 76.8 world px on top of the people's heads, so the block runs
// from the bubbles' tops (-481.8) to the loop's lowest point (BLOCK_BOT, 370)
// and its middle is -55.9 rather than cut 3's -22.5. Every framing in the
// piece except the open is that number.
// ---------------------------------------------------------------------------
export const BLOCK_TOP_5 = BUB_Y0; // -481.78
export const BLOCK_BOT_5 = BLOCK_BOT; // 370
export const CONTENT_CENTRE_5 = (BLOCK_TOP_5 + BLOCK_BOT_5) / 2; // -55.89

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.22;
export const K_WIDE = 1.05;
export const K_CREEP = 1.25;
export const K_OUT = 1.05;
export const OPEN_HEAD_Y = 520; // screen y of the people's ink head tops
export const C_OPEN = centreFor(HEAD_TOP_Y, OPEN_HEAD_Y, K_OPEN); // -145.78

export type CamSeg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  warp: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M1 "the ease of" — the pull-back onto the whole loop
  { f0: 34, f1: 50, k0: K_OPEN, k1: K_WIDE, c0: C_OPEN, c1: CONTENT_CENTRE_5, warp: 0.72 },
  // M2 "and stuff like that" — the creep in on the loop's centre, one even ease
  {
    f0: 84,
    f1: 102,
    k0: K_WIDE,
    k1: K_CREEP,
    c0: CONTENT_CENTRE_5,
    c1: CONTENT_CENTRE_5,
    warp: 1.0,
  },
  // M3 "speed-up AI research is really getting" — the release, riding the ramp.
  // Harmony pass: keys pulled back 8 frames (f120-144 -> f112-136) so the move
  // LANDS BEFORE "getting" instead of nine frames after it.
  {
    f0: 112,
    f1: 136,
    k0: K_CREEP,
    k1: K_OUT,
    c0: CONTENT_CENTRE_5,
    c1: CONTENT_CENTRE_5,
    warp: 0.7,
  },
];

/** One track out of the three moves: a key per frame inside a move, and ONE
 *  held key in the gap before the next one, which is what makes a hold a hold. */
const CAM_TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
  };
  CAM_SEGS.forEach((s, n) => {
    if (n === 0 && s.f0 > 0) {
      F.push(0);
      K.push(s.k0);
      CY.push(s.c0 + CAM_LIFT / s.k0);
      hold(s.f0 - 1);
    }
    if (n > 0 && s.f0 > CAM_SEGS[n - 1].f1 + 1) hold(s.f0 - 1);
    const m = camMove(s);
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

/** The damped camera at every integer frame, run once through the shared
 *  `runCamera`. cx never moves, so it is not on the track. */
export const CAM_AT: { cy: Float64Array; k: Float64Array } = (() => {
  const ay = new Float64Array(DURATION + 1);
  const ak = new Float64Array(DURATION + 1);
  for (let f = 0; f <= DURATION; f++) {
    const c = runCamera(f, CAM_F, CAM_CY, CAM_K);
    ay[f] = c.cy;
    ak[f] = c.k;
  }
  return { cy: ay, k: ak };
})();
export const camAt = (f: number) => {
  const i = clampi(Math.round(f), 0, DURATION);
  return { cy: CAM_AT.cy[i], k: CAM_AT.k[i] };
};

// ---------------------------------------------------------------------------
// THE RAMP. ONE curve, and everything that speeds up reads off it: the beads'
// speed, the rate they leave the model, the model's own idle traffic, and —
// pass 2 — the beads' COLOUR and SIZE and the flicker at the model's two feet.
// An ease-IN, so it is barely there under "speed" and violent by "getting",
// and it is still climbing on the last frame: at f163 it is at 97.6% of
// itself, so nothing in the cut settles.
//
// PASS 2, WHY THE RAMP IS NOW A COLOUR AND NOT ONLY A SPEED. The first build
// put every bit of the acceleration into speed and rate. On an orange ring
// carrying orange beads that is invisible in a still and nearly invisible in
// motion: f109 and f163 were the same picture. So the ramp now drives four
// things the eye can actually count, and the speed is the least of them:
//   (1) COLOUR  ACCENT -> HIGHLIGHT -> #FFFFFF. A bead goes hot as it goes
//       fast, so by the end the loop carries WHITE COMETS on an orange ring —
//       the one pairing in this palette that cannot be missed. Its smear takes
//       the same colour, so the comet is white too.
//   (2) SIZE    BEAD_R -> BEAD_R * 1.5.
//   (3) COUNT   the launch rate, which is what puts more comets on the ring.
//   (4) FLICKER the model's two feet, see THE FLICKER below.
// Below f109 all four are exactly the delivered build: accent beads, BEAD_R,
// one launch every BEAD_STEP, one flash every ~10 frames.
// ---------------------------------------------------------------------------
export const RAMP_F0 = 109; // "much"
export const RAMP_F1 = 164; // one frame past the last rendered frame
export const RAMP_POW = 1.3;
export const SPEED_MAX = 3.2; // bead speed, x
export const RATE_MAX = 6; // launches per unit time, x  (BEAD_STEP -> /6)
export const IDLE_MAX = 3; // idle threads inside the model, x
export const BEAD_HOT_R = 1.5; // bead radius, x, at ramp 1
/** colour and size take the ramp EARLIER than the speed does — see THE HOT
 *  TONE. ramp^0.75 is 8% at "speed" (f113), 48% at "is" (f135) and 98% on the
 *  last frame, so the middle of the ramp is a picture and not a tween. */
export const HOT_POW = 0.75;

export const ramp = (f: number) => Math.pow(clamp01((f - RAMP_F0) / (RAMP_F1 - RAMP_F0)), RAMP_POW);
export const hotAt = (f: number) => Math.pow(ramp(f), HOT_POW);

// --- the speed cap, and why the RATE is the thing that carries the ramp -----
// x3.2 is 70.4 world px/frame. At M3's landed k of 1.05 that is 73.9 SCREEN
// px/frame, and past about 60 a bead stops being a thing that moves and
// becomes a thing that is somewhere else — no smear saves it. So the world
// speed is capped at whatever 60 screen px/frame is AT THE CAMERA'S OWN k
// (from f152 on, which holds the peak to exactly 60.0), and the ramp's
// remainder is handed to the LAUNCH RATE: its ceiling goes from x4 to x6.
// `capAt` reads the damped camera, so it is a pure function of the frame like
// everything else, and because k only falls through M3 while the ramp only
// rises, the capped speed is monotonic to within the damper's own settling
// noise (worst backward step over the whole piece: 2.3e-5 x, half a thousandth
// of a world px per frame — four orders under a rendered pixel).
//
// The rate has to outrun the speed for a second reason, and it is the first
// build's actual bug. The number of beads standing on the ring is
// rate / speed — a launch rate that rides the SAME curve as the speed leaves
// that ratio flat, and the ring carries the same seven beads from f109 to the
// last frame however fast they are going. At x6 against a capped x2.6 the
// count climbs 7 -> 16, and a count is the one property of this picture that
// survives being a still.
export const BEAD_SCREEN_CAP = 60; // screen px/frame
const capAt = (f: number) => BEAD_SCREEN_CAP / (camAt(f).k * BEAD_SPEED);
/** what the curve asks for */
export const speedMulRaw = (f: number) => 1 + (SPEED_MAX - 1) * ramp(f);
/** what the camera allows */
export const speedMul = (f: number) => Math.min(speedMulRaw(f), capAt(f));
export const rateMul = (f: number) => 1 + (RATE_MAX - 1) * ramp(f);
export const idleMul = (f: number) => 1 + (IDLE_MAX - 1) * ramp(f);

// ---------------------------------------------------------------------------
// THE CIRCUIT, cut 3's, run off a PHASE rather than off launch frames.
//
// Cut 3's beads are scheduled: a bead launches at a frame and its position is
// a function of (frame - launch). That cannot accelerate — retiming it would
// teleport every bead already in flight. So here the circuit is driven by one
// integral instead: PHASE(f) is how far a bead has travelled by frame f, the
// integral of BEAD_SPEED * speedMul, and a bead is a phase it was born at.
// Its position is a function of PHASE(f) - born, so when the speed rises every
// bead in flight simply speeds up, continuously, wherever it is.
//
// The route is cut 3's exactly — up the evaluation spoke, a beat at the
// station, round to training on the upper arc (or, every other bead, the long
// lower one), a beat, then down the training spoke and into the model — with
// one change that falls out of the same reasoning: the station beat is
// STATION_PAUSE * BEAD_SPEED world px of route rather than STATION_PAUSE
// frames, so it is cut 3's two frames at base tempo and shortens with
// everything else when the loop speeds up. A station that still took two
// frames at x3.2 would be a stall the eye reads as a queue.
//
// The launch schedule is the other integral: the number of beads that have
// left the model by f is the integral of rateMul / BEAD_STEP. Both integrals
// start well before f0 (PHASE_F_MIN) so the loop is ALREADY FULL on the first
// frame — this cut opens on a process that has been running, not on one
// switching on.
// ---------------------------------------------------------------------------
export const PAUSE_PX = STATION_PAUSE * BEAD_SPEED; // 44 world px
export const ROUTE_PX = (lower: boolean) => [
  SPOKE_TRAVEL,
  PAUSE_PX,
  arcLen(lower ? ARC_LOWER : ARC_UPPER),
  PAUSE_PX,
  SPOKE_TRAVEL,
];
export const ROUTE_TOTAL = (lower: boolean) => ROUTE_PX(lower).reduce((a, b) => a + b, 0);

/** far enough before f0 that the longest route is already full of beads */
export const PHASE_F_MIN = -Math.ceil(ROUTE_TOTAL(true) / BEAD_SPEED) - 24; // -119
export const PHASE_F_MAX = DURATION + 4;

const PHASE: Float64Array = (() => {
  const n = PHASE_F_MAX - PHASE_F_MIN + 1;
  const a = new Float64Array(n);
  a[0] = 0;
  for (let i = 1; i < n; i++) {
    const f = PHASE_F_MIN + i;
    a[i] = a[i - 1] + BEAD_SPEED * speedMul(f - 0.5); // midpoint
  }
  return a;
})();
/** How far a bead born at phase 0 has travelled by frame `f`, world px.
 *  Fractional f is linear between the integer samples, so a bead's position
 *  can be asked for between frames — which is what the motion smear needs. */
export const phaseAt = (f: number) => {
  const x = clampi(f, PHASE_F_MIN, PHASE_F_MAX);
  const i0 = Math.floor(x);
  const t = x - i0;
  const a = PHASE[clampi(i0 - PHASE_F_MIN, 0, PHASE.length - 1)];
  const b = PHASE[clampi(i0 + 1 - PHASE_F_MIN, 0, PHASE.length - 1)];
  return a + (b - a) * t;
};

export type Bead = { key: string; born: number; lower: boolean; total: number };
export const BEADS: Bead[] = (() => {
  const out: Bead[] = [];
  const born = (lf: number, n: number) => {
    const lower = n % 2 === 1;
    out.push({ key: `b${n}`, born: phaseAt(lf), lower, total: ROUTE_TOTAL(lower) });
  };
  // bead 0 leaves the model on the first frame the integral exists; from there
  // bead n leaves the model when the launch count reaches n
  born(PHASE_F_MIN, 0);
  let n = 1;
  let acc = 0;
  for (let f = PHASE_F_MIN + 1; f <= DURATION; f++) {
    const before = acc;
    acc += rateMul(f - 0.5) / BEAD_STEP;
    while (n <= acc) {
      born(f - 1 + (n - before) / (acc - before), n);
      n++;
    }
  }
  return out;
})();

export type BeadPos = { x: number; y: number; seg: number; deg: number };
/** Where a bead is when the phase has reached `p`, or null before it is born /
 *  after it has disappeared into the model. */
export const beadAtPhase = (b: Bead, p: number): BeadPos | null => {
  let s = p - b.born;
  if (s < 0 || s >= b.total) return null;
  const durs = ROUTE_PX(b.lower);
  for (let i = 0; i < durs.length; i++) {
    if (s < durs[i]) {
      const u = durs[i] <= 0 ? 0 : s / durs[i];
      if (i === 0) {
        const q = onLoop(EVAL_DEG, SPOKE_R1 + (LOOP_R - SPOKE_R1) * u);
        return { ...q, seg: i, deg: EVAL_DEG };
      }
      if (i === 1) return { ...onLoop(EVAL_DEG), seg: i, deg: EVAL_DEG };
      if (i === 2) {
        const deg = EVAL_DEG + (b.lower ? ARC_LOWER : ARC_UPPER) * u;
        return { ...onLoop(deg), seg: i, deg };
      }
      if (i === 3) return { ...onLoop(TRAIN_DEG), seg: i, deg: TRAIN_DEG };
      const q = onLoop(TRAIN_DEG, LOOP_R - (LOOP_R - SPOKE_R1) * u);
      return { ...q, seg: i, deg: TRAIN_DEG };
    }
    s -= durs[i];
  }
  return null;
};
export const beadAt = (b: Bead, f: number) => beadAtPhase(b, phaseAt(f));

/** the inverse of `phaseAt`: the (fractional) frame the circuit's odometer
 *  reads `p`. PHASE is strictly increasing, so a binary search plus one linear
 *  step is exact between samples. */
export const frameAtPhase = (p: number) => {
  if (p <= PHASE[0]) return PHASE_F_MIN;
  let lo = 0;
  let hi = PHASE.length - 1;
  if (p >= PHASE[hi]) return PHASE_F_MAX;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (PHASE[m] <= p) lo = m;
    else hi = m;
  }
  const a = PHASE[lo];
  const b = PHASE[hi];
  return PHASE_F_MIN + lo + (b > a ? (p - a) / (b - a) : 0);
};

// ---------------------------------------------------------------------------
// THE FLICKER — pass 2, and the second half of what makes the ramp readable.
//
// The beads are the only traffic between the loop and the model, and the model
// is where they land. So every bead that runs DOWN the training spoke and
// disappears into the population flashes the disc of FLICKER_SEATS seats
// around the training foot to HIGHLIGHT for HIGHLIGHT_FRAMES, and every bead
// BORN out of the evaluation foot flashes that disc the same way. Nothing
// about a single flash is new — it is levelUp's `highlightTone`, the same two
// frames the rest of the set uses for a payoff. What is new is that there are
// many of them: the one-highlight-per-cut rule is waived here because the
// FREQUENCY is the read. At base tempo the two feet blink about once every ten
// frames each; by the last frame it is one every two or three, and the model's
// two corners are visibly boiling. That is the same information as the bead
// speed, carried by a part of the picture that is not a small dot on a line of
// its own colour.
//
// A landing is a phase, not a frame — the circuit is an odometer — so each
// event's frame comes back through `frameAtPhase` and is rounded UP to the
// first rendered frame on which the bead has actually gone in.
// ---------------------------------------------------------------------------
export const FLICKER_SEATS = 12;
const discAround = (q: { x: number; y: number }) =>
  SEATS.map((st, i) => ({ i, d: Math.hypot(st.x - q.x, st.y - q.y) }))
    .sort((u, v) => u.d - v.d)
    .slice(0, FLICKER_SEATS)
    .map((u) => u.i);
export const TRAIN_DISC = new Set(discAround(TRAIN_FOOT));
export const EVAL_DISC = new Set(discAround(EVAL_FOOT));

/** for every frame, the frame of the most recent event at that foot */
const eventTrack = (phases: number[]) => {
  const a = new Float64Array(DURATION + 1).fill(-1e9);
  phases.forEach((ph) => {
    const f = Math.ceil(frameAtPhase(ph));
    if (f >= 0 && f <= DURATION) a[f] = f;
  });
  for (let i = 1; i <= DURATION; i++) if (a[i - 1] > a[i]) a[i] = a[i - 1];
  return a;
};
/** a bead reaching the training foot: it has travelled its whole route */
export const LAND_F = eventTrack(BEADS.map((b) => b.born + b.total));
/** a bead leaving the evaluation foot: it is born */
export const LEAVE_F = eventTrack(BEADS.map((b) => b.born));

// ---------------------------------------------------------------------------
// THE HOT TONE. ACCENT -> HIGHLIGHT over the ramp's first half, HIGHLIGHT ->
// white over its second, both through the field's own 64-step `makeTone` so a
// bead never lands between two tones the rest of the set uses. At ramp 0 it is
// exactly ACCENT, so nothing before f109 moves a shade.
// ---------------------------------------------------------------------------
export const BEAD_WHITE = "#FFFFFF";
/** HIGHLIGHT is a third of the way along, not half: ACCENT -> HIGHLIGHT is a
 *  small step (one shade of the same orange) and HIGHLIGHT -> white is a big
 *  one, so splitting the ramp evenly spends most of it invisibly. */
export const HOT_MID = 0.35;
export const makeHot = (accent: string) => {
  const a = makeTone(accent, HIGHLIGHT);
  const b = makeTone(HIGHLIGHT, BEAD_WHITE);
  return (h: number) =>
    h <= HOT_MID ? a(clamp01(h / HOT_MID)) : b(clamp01((h - HOT_MID) / (1 - HOT_MID)));
};

// ---------------------------------------------------------------------------
// THE SWEEP. Cut 3's G5 — an accent COLOUR front running clockwise along the
// loop, with a soft leading edge, converting everything it passes — at 1.75x
// the speed and starting at TRAINING rather than at evaluation, because the
// camera is on the whole loop here and there is nothing to come back into
// frame for. 2325 world px in 16 frames is 145.3 px/frame; the 45 screen
// px/frame cap is about a head the eye follows and this is light arriving, so
// what carries instead is the soft edge, which is cut 3's LOOP_FRONT_SOFT
// scaled by the front's own speed (40 * 145.3 / 83.0 = 70) so the leading edge
// is the same fraction of one frame's travel as cut 3's was.
// ---------------------------------------------------------------------------
export const SWEEP_FROM = TRAIN_DEG;
export const SWEEP_F0 = 62; // "automating"
export const SWEEP_F1 = 78; // "research"
export const SWEEP_SPEED = LOOP_CIRC / (SWEEP_F1 - SWEEP_F0); // 145.3 world px/frame
export const SWEEP_SOFT = Math.round((LOOP_FRONT_SOFT * SWEEP_SPEED) / (LOOP_CIRC / 28)); // 70
/** The front travels one whole loop PLUS its own soft width. Stopping it at
 *  exactly LOOP_CIRC leaves the soft edge parked forever on the last 70 px of
 *  the loop — the arc just counter-clockwise of the training station, which is
 *  the last thing the front reaches — so that stretch of line stayed at 0.55
 *  of the accent over the white ink (a pale cream segment) and any bead
 *  standing on it stayed half-converted for the rest of the piece. Running the
 *  front 70 px past its own start closes it properly; it costs 0.15 of a frame
 *  on the evaluation station's conversion. */
export const SWEEP_LEN = LOOP_CIRC + SWEEP_SOFT;
/** how far round the loop the accent has got at `f`, world px from SWEEP_FROM */
export const sweepFront = (f: number) => clamp01((f - SWEEP_F0) / (SWEEP_F1 - SWEEP_F0)) * SWEEP_LEN;
/** the frame the front reaches `deg` */
export const sweepPassF = (deg: number) =>
  SWEEP_F0 + ((SWEEP_F1 - SWEEP_F0) * degOf(deg, SWEEP_FROM)) / SWEEP_LEN;
export const PASS_TRAIN = sweepPassF(TRAIN_DEG); // 62
export const PASS_EVAL = sweepPassF(EVAL_DEG); // 67.18

/** THE CLICK ON THE TAKES — harmony pass. Cut 3 clicks every ring it converts:
 *  `frame >= conv + CONV_DUR - 1` for HIGHLIGHT_FRAMES, ring and glyph together
 *  (TheirOwnTraining:1227). Cut 5 was the one cut in the set whose stations
 *  converted with no click at all — the sweep is one continuous pass and the
 *  first build read a click as cutting it into events. It doesn't: two frames
 *  half a step brighter on a ring that is already turning is the set's own
 *  punctuation, and without it cut 5's takes land softer than cuts 3 and 4's.
 *  The front passes training at f62 and evaluation at f67.2, so the rings close
 *  and click at f64-65 and f69-70. The pass frame is rounded so each click gets
 *  its two whole rendered frames. */
export const CLICK_F = STATIONS.map(
  (st) => Math.round(sweepPassF(st.deg)) + CONV_DUR - 1,
); // [64, 69]

/** the spoke runs orange DOWN from its station into the model */
export const SPOKE_CONV = 5;
/** the two people's lines die together, on "research" */
export const KILL_F0 = 74;
export const KILL_F1 = 80;

// ---------------------------------------------------------------------------
// THE MODEL'S IDLE TRAFFIC. Cut 3's, with the count on the ramp. A thread that
// appeared the moment the count reached it would pop in mid-flight, so every
// slot up to IDLE_MAX is allocated from the start and a slot above the base
// count is only allowed to run a cycle that BEGAN after the ramp reached it.
// ---------------------------------------------------------------------------
export const IDLE_SLOTS = Math.round(BLOB_IDLE_THREADS * IDLE_MAX);
/** the frame the ramp first wants slot `j`, inverted off `ramp` */
export const IDLE_ENABLE: Float64Array = (() => {
  const a = new Float64Array(IDLE_SLOTS);
  for (let j = 0; j < IDLE_SLOTS; j++) {
    if (j < BLOB_IDLE_THREADS) {
      a[j] = -Infinity;
      continue;
    }
    const r = clamp01(((j + 1) / BLOB_IDLE_THREADS - 1) / (IDLE_MAX - 1));
    a[j] = RAMP_F0 + Math.pow(r, 1 / RAMP_POW) * (RAMP_F1 - RAMP_F0);
  }
  return a;
})();

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
  dotRadius: z.number(),
  dotOpacity: z.number(),
  personSrc: z.string(),
  personSize: z.number(),
  beats: z.object({
    we: z.number(), // "we"                 — the human state, already running
    could: z.number(), // "could"
    maybe: z.number(), // "maybe"
    be: z.number(), // "be"                 — the first thought bubble
    misunderstanding: z.number(), // "misunderstanding" — both complete inside it
    the: z.number(), // "the"
    ease: z.number(), // "ease"             — the wide is settled
    of: z.number(), // "of"
    automating: z.number(), // "automating" — the sweep leaves training
    ai: z.number(), // "ai"
    research: z.number(), // "research"     — the sweep closes; the lines die
    and: z.number(), // "and"               — the creep
    stuff: z.number(), // "stuff"
    like: z.number(), // "like"
    that: z.number(), // "that"
    how: z.number(), // "or how"
    much: z.number(), // "much"             — the ramp starts
    speed: z.number(), // "speed"
    up: z.number(), // "up"
    aiTwo: z.number(), // "ai"
    researchTwo: z.number(), // "research"
    is: z.number(), // "is"
    really: z.number(), // "really"
    getting: z.number(), // "getting"
    end: z.number(), // speech ends; tail to 164
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
  personSrc: "person.png",
  personSize: PERSON_SIZE,
  beats: {
    we: 0,
    could: 4,
    maybe: 7,
    be: 12,
    misunderstanding: 17,
    the: 36,
    ease: 51,
    of: 59,
    automating: 62,
    ai: 70,
    research: 74,
    and: 84,
    stuff: 91,
    like: 95,
    that: 99,
    how: 107,
    much: 109,
    speed: 113,
    up: 118,
    aiTwo: 120,
    researchTwo: 126,
    is: 135,
    really: 138,
    getting: 142,
    end: 148,
  },
});

/** The motion smear on a bead, and the one thing in the piece that carries the
 *  ramp's own reading.
 *
 *  It is levelUp's smear — TRAIL_FRAMES back, at TRAIL_OPACITY, gated by
 *  `trailFactor` of the SCREEN speed — with two changes, both forced by what
 *  happens to a bead at x3.2:
 *    * it is drawn along the bead's own ARC (four samples per frame back)
 *      rather than as three dots, because at 69 world px/frame the three dots
 *      stand 65 screen px apart and read as three dots rather than as one
 *      thing moving.
 *    * it GETS HOTTER ON THE RAMP. `hot` is the ramp itself, so below f109 the
 *      smear is exactly cut 3's — 0.45 / 0.22 / 0.08 behind an accent bead on
 *      an accent line, a soft tail on a swelling. It also takes the BEAD'S OWN
 *      COLOUR (`fill`), which on the ramp is the hot tone, so the tail whitens
 *      with its head and what runs round the ring at the end is a white comet
 *      on an orange line rather than a swelling in a line of its own colour.
 *
 *  HARMONY PASS — THE SMEAR MAY NOT BEAT THE SET'S TRAIL LADDER. The delivered
 *  build ran the layers at `op + (1 - op) * hot`, which drives all three to 1.0
 *  at full ramp: the three arcs stack into one opaque band and the ring reads as
 *  a solid WHITE ROPE on the held last frame — cut 5's loop was white where cuts
 *  3 and 4's are orange, which is the one thing a five-cut set cannot do. So
 *  TRAIL_OPACITY is the BASE and `hot` may only LIFT it by SMEAR_HOT_LIFT
 *  (x1.5), and the first layer is clamped to SMEAR_OP_CAP (0.65) so the loop's
 *  own orange still shows through between the comets:
 *      0.45 / 0.22 / 0.08  ->  0.65 / 0.33 / 0.12  at ramp 1
 *  and the width is clamped to SMEAR_W_CAP (2 * BEAD_R * 1.5 = 16.5 world px).
 *  The bead HEADS still go pure white at full ramp: the HEADS are the read and
 *  the smear is only the motion behind them. */
export const SMEAR_HOT_LIFT = 1.5; // the most `hot` may lift a trail layer
export const SMEAR_OP_CAP = 0.65; // ...and the ceiling on the first layer
export const SMEAR_W_CAP = 2 * BEAD_R * BEAD_HOT_R; // 16.5 world px
const BeadSmear: React.FC<{
  frame: number;
  k: number;
  bead: Bead;
  r: number;
  fill: string;
  hot: number;
}> = ({ frame, k, bead, r, fill, hot }) => {
  const now = beadAt(bead, frame);
  const prev = beadAt(bead, frame - 1);
  if (!now || !prev) return null;
  const factor = trailFactor(Math.hypot(now.x - prev.x, now.y - prev.y) * k);
  if (factor === 0) return null;
  return (
    <>
      {TRAIL_OPACITY.slice(0, TRAIL_FRAMES).map((op, i) => {
        const pts: string[] = [];
        for (let s = 0; s <= 4; s++) {
          const q = beadAt(bead, frame - i - s / 4);
          if (!q) return null;
          pts.push(`${q.x.toFixed(2)},${q.y.toFixed(2)}`);
        }
        const lifted = Math.min(
          op * (1 + (SMEAR_HOT_LIFT - 1) * hot),
          i === 0 ? SMEAR_OP_CAP : 1,
        );
        return (
          <polyline
            key={i}
            points={pts.join(" ")}
            fill="none"
            stroke={fill}
            strokeWidth={Math.min(2 * r, SMEAR_W_CAP) * (1 - 0.15 * (i + 1))}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={lifted * factor}
          />
        );
      })}
    </>
  );
};

const SpeedUpAiResearch: React.FC<Props> = ({
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
  dotRadius,
  dotOpacity,
  personSrc,
  personSize,
}) => {
  const frame = useCurrentFrame();
  const inkToAccent = makeTone(ink, accent); // a line, a ring or a bead converting
  const accentToHot = makeHot(accent); // and a bead going hot as it goes fast

  // -- camera ---------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = CENTRE_X + drift.dx;
  const cy = cam.cy + drift.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- G3: the sweep --------------------------------------------------------
  const front = sweepFront(frame);
  const sweepOn = frame >= SWEEP_F0;
  /** has the accent reached the loop point at `deg`? 0..1, soft-edged */
  const sweptAt = (deg: number) =>
    sweepOn ? softFront(degOf(deg, SWEEP_FROM), front, SWEEP_SOFT) : 0;
  // each station converts as the front passes it; ring and glyph are one colour
  const stationConv = STATIONS.map((st) => smooth((frame - sweepPassF(st.deg)) / CONV_DUR));
  // ...and clicks half a step brighter for two frames as its ring closes, ring
  // and glyph together, exactly as cut 3's takes do
  const stationCol = STATIONS.map((_, i) =>
    highlightTone(frame, CLICK_F[i], inkToAccent(stationConv[i])),
  );
  // and each spoke runs orange DOWN from its station into the model
  const spokeConv = STATIONS.map((st) => clamp01((frame - sweepPassF(st.deg)) / SPOKE_CONV));
  const kill = smooth((frame - KILL_F0) / (KILL_F1 - KILL_F0));

  // -- the model's own idle traffic, on the ramp ----------------------------
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: boolean };
  const threads: Th[] = [];
  const reach = 2;
  for (let j = 0; j < IDLE_SLOTS; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    // a slot the ramp has not reached yet may not START a cycle
    if ((cycle - hash(j, 5)) * period < IDLE_ENABLE[j]) continue;
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    const bc = clampi(sa.c + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, F_COLS - 1);
    const br = clampi(sa.row + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, F_ROWS - 1);
    const b = SEAT_AT[br * F_COLS + bc];
    if (b < 0 || b === a) continue;
    const dn = ease(phase / 0.3, EASE_ARRIVE);
    const fade = phase < 0.55 ? 1 : Math.max(0, 1 - (phase - 0.55) / 0.45);
    if (fade <= 0.02) continue;
    const pb = SEATS[b];
    threads.push({
      key: `i${j}`,
      x1: sa.x,
      y1: sa.y,
      x2: sa.x + (pb.x - sa.x) * dn,
      y2: sa.y + (pb.y - sa.y) * dn,
      op: 0.4 * fade,
      head: dn < 1,
    });
  }

  // -- the beads ------------------------------------------------------------
  const p = phaseAt(frame);
  const hot = ramp(frame); // the ramp — what the smear's opacity reads off
  const hotV = hotAt(frame); // and its earlier sibling, for colour and size
  const beads = BEADS.map((b) => {
    const q = beadAtPhase(b, p);
    if (!q) return null;
    // a bead takes its colour from the front at the point it is standing on:
    // the front paints them where they are
    const conv = sweptAt(q.deg);
    // born out of the model: two base-frames of growing into itself
    const grow = clamp01((p - b.born) / (2 * BEAD_SPEED));
    // ...and on the ramp it goes hot and grows, everywhere on the route: on
    // the loop, at a station and on either spoke, so the in/out traffic
    // between the model and the loop whitens with the rest of it
    return {
      b,
      x: q.x,
      y: q.y,
      r: BEAD_R * grow * (1 + (BEAD_HOT_R - 1) * hotV),
      col: hotV > 0 ? accentToHot(hotV) : inkToAccent(conv),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // -- the model's two feet, flashing with the landings ---------------------
  const fi = clampi(frame, 0, DURATION);
  const landF = LAND_F[fi];
  const leaveF = LEAVE_F[fi];
  const seatFill = (i: number) =>
    TRAIN_DISC.has(i)
      ? highlightTone(frame, landF, accent)
      : EVAL_DISC.has(i)
        ? highlightTone(frame, leaveF, accent)
        : accent;

  // -- the loop's accent overlay -------------------------------------------
  const frontLead = Math.max(0, front - SWEEP_SOFT);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the people's lines: they hold the stations until the sweep takes
                them, and then they hang dead */}
            <g style={{ filter: icon }}>
              {STATIONS.map((st) => (
                <line
                  key={st.key}
                  x1={st.x}
                  y1={LINE_TOP}
                  x2={st.x}
                  y2={LINE_BOT}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ + (OP_DARK - OP_READ) * kill}
                />
              ))}
            </g>

            {/* the model: it came out of cut 3 fully ripe, so every seat is
                ACCENT for the whole piece and there is no tone ramp in this
                cut. The radius carries cut 3's resolved +35%. The only thing
                that moves on it is the FLICKER: the twelve seats round each
                spoke's foot go HIGHLIGHT for two frames every time a bead
                lands in the model or leaves it, so the two corners blink at
                the traffic's own rate and boil by the last frame. */}
            {SEATS.map((s, i) => (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * 1.35}
                fill={seatFill(i)}
                opacity={dotOpacity}
              />
            ))}

            {/* the model's own idle traffic — the research going on inside it,
                tripling with the ramp */}
            {threads.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.head ? <circle cx={t.x2} cy={t.y2} r={3} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* THE LOOP. Fully drawn at f0 and ink; the sweep lays an accent arc
                over it clockwise from the training station with a soft leading
                edge. Cut 3's station gap is kept: the line stops at each ring,
                so a station reads as a node the loop arrives at. */}
            <g style={{ filter: icon }}>
              <defs>
                <mask
                  id="sar-station-gap"
                  maskUnits="userSpaceOnUse"
                  x={LOOP_C.x - LOOP_R - 20}
                  y={LOOP_C.y - LOOP_R - 20}
                  width={2 * (LOOP_R + 20)}
                  height={2 * (LOOP_R + 20)}
                >
                  <rect
                    x={LOOP_C.x - LOOP_R - 20}
                    y={LOOP_C.y - LOOP_R - 20}
                    width={2 * (LOOP_R + 20)}
                    height={2 * (LOOP_R + 20)}
                    fill="#fff"
                  />
                  {STATIONS.map((st) => (
                    <circle key={st.key} cx={st.x} cy={st.y} r={STATION_R} fill="#000" />
                  ))}
                </mask>
              </defs>
              <g mask="url(#sar-station-gap)">
                <circle
                  cx={LOOP_C.x}
                  cy={LOOP_C.y}
                  r={LOOP_R}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
                {sweepOn ? (
                  <>
                    <circle
                      cx={LOOP_C.x}
                      cy={LOOP_C.y}
                      r={LOOP_R}
                      fill="none"
                      stroke={accent}
                      strokeWidth={STROKE + 0.6}
                      strokeLinecap="butt"
                      opacity={OP_READ * 0.55}
                      strokeDasharray={`${front} ${LOOP_CIRC}`}
                      transform={`rotate(${SWEEP_FROM} ${LOOP_C.x} ${LOOP_C.y})`}
                    />
                    <circle
                      cx={LOOP_C.x}
                      cy={LOOP_C.y}
                      r={LOOP_R}
                      fill="none"
                      stroke={accent}
                      strokeWidth={STROKE + 0.6}
                      strokeLinecap="butt"
                      opacity={OP_READ}
                      strokeDasharray={`${frontLead} ${LOOP_CIRC}`}
                      transform={`rotate(${SWEEP_FROM} ${LOOP_C.x} ${LOOP_C.y})`}
                    />
                  </>
                ) : null}
              </g>
            </g>

            {/* THE SPOKES: ink from f0, and the sweep runs down them into the
                model as each station converts */}
            <g style={{ filter: icon }}>
              {SPOKES.map((sp, i) => {
                const u = spokeConv[i];
                return (
                  <g key={sp.key}>
                    <line
                      x1={sp.a.x}
                      y1={sp.a.y}
                      x2={sp.b.x}
                      y2={sp.b.y}
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                    />
                    {u > 0 ? (
                      <line
                        x1={sp.a.x}
                        y1={sp.a.y}
                        x2={sp.a.x + (sp.b.x - sp.a.x) * u}
                        y2={sp.a.y + (sp.b.y - sp.a.y) * u}
                        stroke={accent}
                        strokeWidth={STROKE + 0.6}
                        strokeLinecap="round"
                        opacity={0.95}
                      />
                    ) : null}
                  </g>
                );
              })}
            </g>

            {/* THE BEADS: the research process, running — and from f109
                running faster every frame. They are drawn UNDER the stations
                rather than over them: at x3.2 a bead's smear is 208 world px
                long, twice the ring's diameter, so a bead entering a station
                over the top of it would wipe out the glyph that says which
                station it is. Under them the comet passes behind the ring and
                the cap and the clipboard stay readable on the last frame. */}
            <g style={{ filter: icon }}>
              {/* HEAD AND SMEAR BOTH take the loop's own station gap, so a
                  comet passes BEHIND a station exactly the way the loop line
                  does. The delivered build masked only the smear, on the
                  argument that an 11 px head is cut 3's bead — but on the ramp
                  the head is 16.5 px and pure WHITE, and it sat dead on the
                  graduation cap on the held last frame. The glyph says which
                  station it is; nothing crosses it. */}
              <g mask="url(#sar-station-gap)">
                {beads.map((b) => (
                  <BeadSmear
                    key={b.b.key}
                    frame={frame}
                    k={k}
                    bead={b.b}
                    r={b.r}
                    fill={b.col}
                    hot={hot}
                  />
                ))}
                {beads.map((b) => (
                  <circle key={b.b.key} cx={b.x} cy={b.y} r={b.r} fill={b.col} />
                ))}
              </g>
            </g>

            {/* THE STATIONS: cut 3's own component, opened resolved (ringDraw 1,
                iconDraw 1) and converted by the front passing through them */}
            {STATIONS.map((st, i) => (
              <StationGlyph
                key={st.key}
                x={st.x}
                y={st.y}
                glyph={st.glyph}
                colour={stationCol[i]}
                opacity={OP_READ + (1 - OP_READ) * stationConv[i]}
                ringDraw={1}
                iconDraw={1}
                rotate={st.deg}
                shadow={icon}
              />
            ))}

            {/* THE THOUGHT BUBBLES. Cut 2's bubble with a question mark in it.
                They go up on "be" and NOTHING about them changes for the
                remaining 140 frames: two white question marks are still there
                over a loop spinning orange. */}
            <g style={{ filter: icon }}>
              {PEOPLE.map((person, i) => {
                const t = frame - BUB_T0[i];
                if (t < 0) return null;
                const b = clamp01(t / BUB_DRAW);
                const c1 = clamp01((t - BUB_DRAW) / QM_HOOK_DRAW);
                const c2 = clamp01((t - BUB_DRAW - QM_HOOK_DRAW) / QM_DOT_DRAW);
                const g = 24 * QM_S;
                return (
                  <g key={`bub${i}`}>
                    {BUB_TRAIL.map((d, j) => {
                      const s = smoothstep((t - d.t) / BUB_TRAIL_DUR);
                      return s <= 0 ? null : (
                        <circle
                          key={j}
                          cx={person.x + d.dx}
                          cy={BUB_Y1 + d.dy}
                          r={d.r * s}
                          fill={ink}
                          opacity={OP_READ}
                        />
                      );
                    })}
                    <path
                      d={BUB_PATH}
                      transform={`translate(${person.x - BUB_W / 2} ${BUB_Y0})`}
                      fill="none"
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                      pathLength={1}
                      strokeDasharray="1 1"
                      strokeDashoffset={1 - b}
                    />
                    {c1 > 0 ? (
                      <g
                        transform={`translate(${person.x - g / 2} ${BUB_Y0 + BUB_H / 2 - g / 2}) scale(${QM_S})`}
                        fill="none"
                        stroke={ink}
                        strokeWidth={QM_STROKE}
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        opacity={OP_READ}
                      >
                        <path
                          d={QM_PATHS[0]}
                          pathLength={1}
                          strokeDasharray="1 1"
                          strokeDashoffset={1 - c1}
                        />
                        {c2 > 0 ? (
                          <path
                            d={QM_PATHS[1]}
                            transform={`translate(12 17) scale(${c2.toFixed(3)}) translate(-12 -17)`}
                          />
                        ) : null}
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* the two people, white. They never move and they never learn. */}
          {PEOPLE.map((person) => (
            <Img
              key={person.key}
              src={staticFile(personSrc)}
              style={{
                position: "absolute",
                left: person.x - personSize / 2,
                top: person.y - personSize / 2,
                width: personSize,
                height: personSize,
                filter: `brightness(0) invert(1) ${icon}`,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default SpeedUpAiResearch;
