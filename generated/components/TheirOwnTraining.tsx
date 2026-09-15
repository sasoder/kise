import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
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
  camEase,
  camMove,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  smoothstep,
  sway,
  wobble,
  WOBBLE_R,
  worldTransform,
} from "./fieldShared";
import { EASE_ARRIVE, HIGHLIGHT, HIGHLIGHT_FRAMES, Trail, ease, softFront } from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// CUT 3 of the Dwarkesh clip `Ajeya_Six_Months_Behind`. Ajeya Cotra:
// "Their motivation structure is really based around manipulating and having
//  control over their own training and evaluation."
//
// SRT span 0:38.420 -> 0:46.159 at 24fps.
// round((46.159 - 38.420) * 24) = round(7.739 * 24) = round(185.7) = 186
// frames of speech, plus the 16 frame tail = 202.
//
// ONSETS, frames from f0:
//   f0   their motivation     f102 and
//   f10  structure            f111 having
//   f17  is                   f121 control
//   f24  really               f130 over
//   f35  based                f141 their
//   f46  around               f150 own
//   f57  manipulating         f155 training
//        (a 1.9 s word,       f162 and
//         held to f102)       f166 evaluation
//                             f186 speech ends   f202 last frame
//
// ---------------------------------------------------------------------------
// THE PICTURE. THE LOOP. A model sits inside the loop that shapes it: an ink
// ring with two stations on it — training at 10 o'clock, evaluation at 2
// o'clock — each held from above by a person on a line. ONE MOTION: the model
// reaches up out of itself into the training station and takes it, then the
// evaluation station, the people's lines go dead, and the whole loop runs
// orange. They now run their own training and evaluation.
//
// Orange Dwarkesh style throughout: opaque grid cutaway, 24fps, 1080x1920, two
// tones of one warm yellow with the dots fully opaque, white ink for
// everything human-made, per-icon shadows, one damped camera, one gesture per
// word, no text.
//
// ---------------------------------------------------------------------------
// CUT 4 IMPORTS THESE. `RogueDeployment` is this same world ten seconds later,
// so every number it could possibly need is exported from here and must never
// be restated there:
//   the world      WORLD_W WORLD_H CENTRE_X CONTENT_CENTRE STROKE RING_STROKE
//                  SEAT_RING_STROKE TONE_DUR LINE_SPEED
//   the model      STEP_X STEP_Y F_COLS F_ROWS F_N BLOB_C SE_N BLOB_AX BLOB_AY
//                  BLOB_FEATHER BLOB_SEED blobInside blobEdge Seat SEATS NSEAT
//                  SEAT_AT BLOB_IDLE_THREADS
//   the loop       LOOP_C LOOP_R LOOP_CIRC onLoop degOf arcLen
//                  LOOP_DRAW_F0 LOOP_DRAW_F1 LOOP_START_DEG passFrame
//   the stations   STATION_R TRAIN_DEG EVAL_DEG TRAIN EVAL STATIONS RING_DUR
//                  PASS_TRAIN PASS_EVAL
//                  and V2: STATION_ICON_TRAIN STATION_ICON_EVAL StationGlyph
//                  STATION_GLYPH_FRACTION STATION_GLYPH_BOX STATION_GLYPH_SCALE
//                  STATION_GLYPH_STROKE STATION_GLYPH_CAP STATION_GLYPH_JOIN
//                  STATION_GLYPH_LEN ICON_LEAD ICON_DUR. Each STATIONS entry
//                  carries its own `glyph`; cut 4 opens resolved, so it draws a
//                  station as <StationGlyph ... ringDraw={1} iconDraw={1} />.
//   the spokes     SPOKE_R0 SPOKE_R1 SPOKE_SINK TRAIN_EDGE EVAL_EDGE SPOKES
//                  SPOKE_TRAVEL spokePoint SPOKE_LEAD SPOKE_DUR
//                  TRAIN_FOOT EVAL_FOOT NEAREST_TRAIN NEAREST_EVAL
//   the people     PERSON_SIZE PERSON_GAP PERSON_Y PEOPLE PERSON_FOOT_Y
//                  PERSON_HEAD_Y LINE_TOP LINE_BOT BLOCK_TOP BLOCK_BOT
//   the beads      BEAD_R BEAD_SPEED BEAD_STEP BEAD_F0 STATION_PAUSE Bead
//                  BEADS ARC_UPPER ARC_LOWER BeadPos beadRoute beadAt
//                  beadArrival ARRIVALS
//   the ripening   RIPE_ORDER RIPE_LANDINGS RIPEN_PER_HIT RIPE_AT HIT_SEAT
//                  BEAD_HIT_DUR
//   the takes      TAKE_TRAIN TAKE_EVAL TRAIN_EMIT EVAL_EMIT CONV_DUR
//                  LOOP_CONV_FROM LOOP_CONV_F0 LOOP_CONV_F1 LOOP_FRONT_SOFT
//                  loopFront
//   the camera     K_OPEN C_OPEN K_MID K_TAKE K_EVAL K_WIDE CX_TAKE C_TAKE
//                  CX_EVAL C_EVAL centreFor camXFor CamSeg CAM_SEGS
//                  CAM_F CAM_K CAM_CY CAM_CX CAM_AT camAt
//   and FPS, DURATION, schema, Props, defaultProps.
// A cut-4 gesture that needs a number not on this list should still import
// rather than restate: every top-level declaration in this file is exported.
// Cut 4 opens on this cut's resolved state: an orange loop, two orange
// stations, a fully ripe blob, orange beads circling, two white people above
// with two dead dark lines hanging to the stations.
// ---------------------------------------------------------------------------
// SECOND PASS, on the director's review of the first preview. The concept, the
// gestures, the circuit, the camera track's shape and the takes are unchanged;
// the world got bigger and the framing got tighter around it:
//   * THE MODEL was a 74-seat sliver inside a 660 px loop and read as crumbs in
//     an empty ring. It is now 200 seats on a 14 x 18 lattice, a 337 x 273
//     world px body (331 x 268 of actual dots) the loop is built around.
//   * THE LOOP went 330 -> 370 radius, so the stations, the spokes and the
//     people all moved with it; the people now sit 60 px above their station
//     ring rather than 180, on a short leash instead of a long tether.
//   * THE WIDE was too wide. M1 and M4 both land at k 1.05, where the loop
//     spans 777 screen px, and the whole block is centred at screen y 835.
//   * THE RIPENING keeps pace with 200 seats: RIPEN_PER_HIT is solved from the
//     landings that fall before the loop finishes converting, so the model is
//     fully ripe at f172 and cut 4 opens on a ripe model.
//   * BEADS are r 5.5 so they read at the wide, at the same speed 22.
// The caption band, measured over every frame: the lowest point of the loop
// that has actually been DRAWN never goes past screen y 1457, 23 px clear of
// the bottom 440. Nothing else this piece draws gets near it.
// ---------------------------------------------------------------------------
// V2, on the director's review of the delivered cut: "since she's mentioning
// two things and the camera pans to the two circles, we should put relevant
// icons in there." Three changes, and nothing else in the piece moves — same
// beats, same camera track, same gestures, same schedule:
//   * EACH STATION SAYS WHICH ONE IT IS. A Lucide glyph inside the ring at 0.6
//     of its diameter — `graduation-cap` at TRAINING, `clipboard-check` at
//     EVALUATION — inline 24-unit paths, drawn white at the ring's own opacity
//     with the group's `iconShadow(k)`, converting to ACCENT on the ring's own
//     3-frame ramp because ring and glyph are ONE colour. It draws in head-led
//     over four frames the moment its ring closes (eval f10.7-14.7, training
//     f29.3-33.3), on one shared dash so every sub-path draws at one speed.
//   * THE RING GREW 44 -> 52, because a 24-unit glyph at 0.6 of the diameter
//     needs the room. SPOKE_R0 and LINE_BOT are both written off STATION_R, so
//     the spoke's start and the people's line each move in by the same 8 px and
//     nothing pierces the ring. The block's top goes with the people, so
//     CONTENT_CENTRE is -22.5 rather than -18.5 and every framing sits 4 world
//     px lower — measured, the lowest DRAWN point of the loop is now screen
//     1463 at its worst (f87, k 1.60), still inside the 1480 the caption band
//     leaves. Nothing else about the camera changes.
//   * THE LOOP LINE STOPS AT EACH STATION. It used to run straight through the
//     ring's middle, which is invisible across an empty circle and ruinous
//     across a glyph. One mask, cut at the ring's own radius, over the ink loop
//     AND the accent front, so a station reads as a node the loop arrives at.
//     The draw head is outside the mask and crosses unbroken.
// `StationGlyph` is exported as the one thing that draws a station, so cut 4
// opens on exactly these two stations rather than on a copy of them.
// ---------------------------------------------------------------------------
//
// THE GESTURES. Every one of them traces to one word; there is nothing else in
// the piece.
//
//   G1 THE STRUCTURE  — "their motivation structure"        f0-34
//     Opens TIGHT on the model: k 2.05, where the model is 679 screen px wide
//     and fills the middle of the frame, the loop bleeds off both sides and
//     both people are outside the side edges (the training glyph's ink ends at
//     screen -15), so f0 is the model and nothing else. The LOOP draws head-led
//     with a white tip, CLOCKWISE from 12 o'clock, f2-30, starting at the top
//     of the frame. Its head crosses 170 screen px in the first frames — a
//     circle this size cannot be drawn in 1.2 s any slower — so it carries the
//     set's motion smear, the same `Trail` the beads have, scaled by its own
//     screen speed: it is gone by f10 and at the wide. The head
//     passes evaluation (2 o'clock) at f6.7 and training (10 o'clock) at f25.3
//     — each station ring draws head-led over 4 frames from the moment it is
//     passed and clicks bright as it closes, its GLYPH draws head-led over the
//     four frames after that (V2: the cap at training, the clipboard with the
//     tick at evaluation, so the two things she names are on the two circles the
//     camera goes to), and each SPOKE draws
//     station -> blob over 6 frames starting 2 frames later (eval f8.7-14.7,
//     training f27.3-33.3). The ring closes at the top at f30. The two people
//     and their two lines are there from f0; the pull-back brings them in from
//     the sides with the stations they hold.
//
//   G2 BASED AROUND   — "is really based around"            f35-57
//     THE CIRCUIT SWITCHES ON at f36 and it switches on as a whole: one bead
//     leaves the EVALUATION station onto the upper arc, one leaves the
//     TRAINING station down its spoke, and one leaves the BLOB up the
//     evaluation spoke — three births, each out of a real object, nothing
//     fades in from nowhere. From then on a bead leaves the blob every 10
//     frames and runs the whole circuit: up the evaluation spoke, a 2-frame
//     beat at the station, round the arc to training (every other bead takes
//     the long lower arc, so the whole ring reads as one circuit), a 2-frame
//     beat, then down the training spoke and INTO the model, where it
//     disappears. Six to nine alive, one shared speed, each with the shared
//     motion smear behind it scaled by its screen speed.
//     Every arrival RIPENS THE MODEL from the point of contact outward: the
//     RIPEN_PER_HIT nearest seats that are still deep go deep -> ripe over
//     TONE_DUR and stay, and the seat actually hit — the one at the training
//     spoke's foot, where every bead disappears — takes +0.1 for 6 frames.
//     RIPEN_PER_HIT is solved, not typed: 200 seats divided by the 8 landings
//     that fall before the loop finishes converting at f170 is 25 a landing, so
//     the last still-deep seat starts its ramp at f160.4 and the model is fully
//     ripe at f172. Camera holds; the beads are what moves.
//
//   G3 MANIPULATING   — "manipulating"                      f57-102
//     M2, THE CREEP, runs under the whole word (see below) and lands on the
//     training station at f82. From f64 an ACCENT THREAD rises out of the
//     blob's nearest seat UP the training spoke, head-led, solved so the head
//     is on the station ring at f83 — inside the six frames of DEAD STILL
//     (f82-88) that the creep ends in. The ring converts INK -> ACCENT over 3
//     frames with a click and is fully orange at f88. The thread runs on the
//     spoke's own ray and a hair thicker than the ink under it, so the spoke
//     turns orange from the model up rather than gaining a second line. From
//     f90 every bead that leaves the training station is accent. f92-98 the
//     training person's line falls OP_READ -> OP_DARK: their hold on it is
//     gone. The thread stays — that is the model's grip on the station.
//
//   G4 CONTROL        — "and having control over"           f111-140
//     The same take again on the other side: an accent thread rises up the
//     EVALUATION spoke f111-122, the ring is fully orange at f126, the
//     evaluation person's line dies f128-134, and from f128 every bead leaving
//     evaluation is accent. The upper arc between the two orange stations is all accent
//     by f140; the lower arc still carries the ink beads that are already on
//     it.
//
//   G5 THEIR OWN      — "their own training and evaluation" f141-186
//     THE LOOP CONVERTS. Accent runs along the loop line CLOCKWISE from the
//     EVALUATION station all the way round back to itself, f142-170, on a soft
//     front (a colour front, not a head: there is no bead to follow, so it
//     reads as the ring catching light rather than as an object crossing the
//     frame). An ink bead the front passes turns accent where it stands. Every
//     bead everywhere is accent from f170.
//
//   RESOLVED          — f176-202
//     An orange loop with two orange stations, orange beads circling, orange
//     beads entering and leaving the ripe model, two white people above with
//     two dark dead lines hanging from their feet. Breath, sway, the beads and
//     the model's own idle traffic. It holds; it never fades.
//
// ---------------------------------------------------------------------------
// THE CAMERA. Four moves, one damped track, `camMove` keys per frame, cx and k
// live. Each landing is solved backwards through the damper so it is actually
// still when its word lands (`scratchpad/tot-cam.ts` prints k, cx, cy and their
// per-frame deltas).
//
// ONE VERTICAL RULE, every frame of the piece: the content centre — the middle
// of the block from the people's heads (world y -407) to the loop's lowest
// point (world y +370), so world y -18.5 — sits at screen y 835, which is what
// `cy = CONTENT_CENTRE + CAM_LIFT / k` is. It is not a convenience: it is the
// solution. The block is 777 world px tall, so at the close-ups it is the only
// framing that keeps BOTH the station and the whole model in frame AND the
// loop's lowest point out of the bottom 440 px where the captions live. At
// k 1.60 it puts the loop's bottom at screen 1457, 23 px clear of the band;
// any framing that drops the station lower than screen 569 puts the lower arc
// into it. So the four moves are a zoom and a pan, and the vertical is solved.
//   M1 THE REVEAL   k 1.95 -> 1.05, cx 540, keys f4-24 warp 0.72, landed f32.
//                   The pull-back off the model that reveals the whole
//                   structure: the loop closing at 777 screen px across, the
//                   two stations arriving from the side edges with the two
//                   people above them  — "their motivation structure"
//   M2 THE CREEP    k 1.05 -> 1.60, cx 540 -> 432.1, solved so the training
//                   station ring sits at screen (200, 569) with the WHOLE
//                   model in frame beside it (screen x 217..977, y 650..1079).
//                   ONE even ease, warp 1.0, keys f54-72, landed f82, then
//                   DEAD STILL f82-88 — the held breath the take lands
//                   inside. The keys stop ten frames before the landing
//                   because the damper lags its target by about six, so the
//                   ring the thread reaches is genuinely still
//                                               — "manipulating"
//   M3 THE TRAVEL   k 1.60 -> 1.35, cx 432.1 -> 704.8, solved so the
//                   evaluation station sits at screen (750, 610) with the whole
//                   model in frame beside it at 94..541 and the training ring
//                   CLEANLY outside the left edge — its right edge lands at
//                   screen -56 — rather than cut by it. Keys f92-104 warp 0.72,
//                   landed f114, well ahead of "control"
//                                               — "and having control"
//   M4 THE WIDE     k 1.35 -> 1.05, cx 704.8 -> 540, the resolved framing: the
//                   loop 777 screen px across, the people's heads at 427, the
//                   loop's lowest point at 1243 and 237 px of clearance over
//                   the caption band. Keys f146-166 warp 0.72, landed f176 —
//                   the frame is still opening gently as the loop closes at
//                   f170 and is settled under "evaluation"
//                                      — "their own training and evaluation"
//
// ambient, not gestures: the model's own idle thread traffic at the shared
// rate, `breath` on every dot, `sway` on the camera, the grid's drift.
//
// ---------------------------------------------------------------------------
// TWO PLACES THIS DEPARTS FROM THE BRIEF, both measured rather than preferred:
//   * BEAD SPEED is 22 world px/frame (the set's LINE_SPEED at k 1), not 14.
//     The brief asks for a bead to have gone evaluation -> arc -> training ->
//     down into the model AND for one to have come back up the evaluation
//     spoke by f57. That circuit is 1213 world px; doing it in the 21 frames
//     from f36 needs 58 px/frame, which strobes at 24fps. So the speed stays
//     legible and the CIRCUIT is what starts whole at f36 instead of one bead
//     running all of it: by f57 the upper arc, the lower arc, both spokes and
//     the model have all carried a bead, which is what "the loop is running"
//     has to show.
//   * THE BEADS RUN EVALUATION -> UPPER ARC -> TRAINING, which is
//     counter-clockwise, not clockwise. The brief says "CLOCKWISE" once and
//     "the loop's upper arc", "the lower arc carries beads too" and "the upper
//     arc between the two orange stations" three times; the stations are at 10
//     and 2 o'clock, so the upper arc between them is the short way over the
//     top and it cannot be clockwise. The DRAW in G1 and the CONVERSION in G5
//     are clockwise exactly as briefed.
// ---------------------------------------------------------------------------

export const DURATION = 202;

// --- the world -------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 2200;
export const CENTRE_X = 540;
// CONTENT_CENTRE is not a number this piece chooses: it is the middle of the
// block the piece actually draws, so it is declared with the people, once the
// block's two ends exist.

export const STROKE = 3; // every ink line
export const RING_STROKE = 3.5; // a ring
export const SEAT_RING_STROKE = 1.5; // an empty seat
export const TONE_DUR = 10; // deep -> ripe
export const LINE_SPEED = 22; // world px/frame at k 1

const smooth = (u: number) => smoothstep(clamp01(u));
const TAU = Math.PI * 2;
const rad = (deg: number) => (deg * Math.PI) / 180;

// ---------------------------------------------------------------------------
// THE MODEL. A fleet blob, exactly the construction `RogueInstancesInterfere`
// uses: a 14 x 18 lattice at the field's own step, jittered 0.9 of a step,
// radius hashed 0.75-1.25, cut to a superellipse (exponent 2.4) inscribed in
// that box, undulated by `wobble` around its perimeter and feathered across
// its outer 1.5 steps so the density falls off at the edge and the dots that
// survive out there are smaller. No brand mark on it: the line is about "they",
// not about a company.
//
// It has to read as a BODY the loop is built AROUND, not as crumbs in an empty
// ring — which is what 74 seats on a 240 x 137 sliver inside a 660 px loop
// looked like. 14 x 18 cells at the field step is a 337 x 273 world px box; the
// superellipse inscribed in it keeps 200 of the 252 seats (the dots themselves
// reach 331 x 268), which is 45% of the loop's width and half its height.
// BLOB_SEED is scanned rather than picked: it is the wobble phase nearest a
// round 200 seats.
// ---------------------------------------------------------------------------
export const STEP_X = 940 / 39;
export const STEP_Y = 440 / 29;
export const F_COLS = 14;
export const F_ROWS = 18;
export const F_N = F_COLS * F_ROWS;
export const BLOB_C = { x: 540, y: 0 };
export const SE_N = 2.4;
export const BLOB_AX = ((F_COLS - 1) / 2 + 0.5) * STEP_X; // 168.7
export const BLOB_AY = ((F_ROWS - 1) / 2 + 0.5) * STEP_Y; // 136.6
export const BLOB_FEATHER = 1.5;
export const BLOB_SEED = 0.74;

/** A seat's signed distance to the blob's nominal boundary, in grid steps —
 *  positive inside. The superellipse is scaled along the seat's own ray and the
 *  step is measured along that ray too, so the feather is the same width in
 *  steps whichever way the boundary runs. */
export const blobInside = (dx: number, dy: number, seed: number = BLOB_SEED) => {
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) return 99;
  const g = Math.pow(Math.abs(dx) / BLOB_AX, SE_N) + Math.pow(Math.abs(dy) / BLOB_AY, SE_N);
  const t = Math.pow(g, 1 / SE_N); // 1 exactly on the boundary
  const stepAlong = L / Math.hypot(dx / STEP_X, dy / STEP_Y);
  return (L / t - L) / stepAlong + wobble(Math.atan2(dy, dx) * WOBBLE_R, seed) + BLOB_FEATHER / 2;
};

/** How far the blob's nominal boundary is from its centre along `deg`. The
 *  superellipse form is homogeneous of degree SE_N, so this is closed. */
export const blobEdge = (deg: number) => {
  const c = Math.abs(Math.cos(rad(deg))) / BLOB_AX;
  const s = Math.abs(Math.sin(rad(deg))) / BLOB_AY;
  return Math.pow(Math.pow(c, SE_N) + Math.pow(s, SE_N), -1 / SE_N);
};

export type Seat = { x: number; y: number; r: number; rs: number; c: number; row: number };
export const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let row = 0; row < F_ROWS; row++) {
    for (let c = 0; c < F_COLS; c++) {
      const i = row * F_COLS + c;
      const x = BLOB_C.x + (c - (F_COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = BLOB_C.y + (row - (F_ROWS - 1) / 2) * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      const d = blobInside(x - BLOB_C.x, y - BLOB_C.y);
      const fe = feather(d, BLOB_FEATHER);
      if (hash(i, 71) >= fe) continue;
      out.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), rs: 0.7 + 0.3 * fe, c, row });
    }
  }
  return out;
})();
export const NSEAT = SEATS.length;

/** lattice cell -> seat index, so the idle traffic can find a neighbour. */
export const SEAT_AT = new Int32Array(F_N).fill(-1);
SEATS.forEach((s, i) => {
  SEAT_AT[s.row * F_COLS + s.c] = i;
});

export const BLOB_IDLE_THREADS = idleThreads(NSEAT);

// ---------------------------------------------------------------------------
// THE LOOP, THE STATIONS, THE SPOKES, THE PEOPLE.
//
// Angles are measured from +x with y DOWN, so an increasing angle runs
// CLOCKWISE on screen: 0 is 3 o'clock, 90 is 6, 180 is 9, 270 is 12. Training
// sits at 210 (10 o'clock) and evaluation at 330 (2 o'clock), both ON the loop
// line — the ring sits on the line, the line passes through it.
// ---------------------------------------------------------------------------
export const LOOP_C = { x: 540, y: 0 };
export const LOOP_R = 370;
export const LOOP_CIRC = TAU * LOOP_R;
// V2 (director, on the delivered cut: "since she's mentioning two things and the
// camera pans to the two circles, we should put relevant icons in there"). The
// ring was 44 and an empty ring; it now carries a Lucide glyph at 0.6 of its
// diameter, which needs the room, so it is 52. SPOKE_R0 (the ring's inner edge)
// and LINE_BOT (the person's line, which lands on the ring's top) are both
// written off STATION_R, so they move in by the same 8 px on their own and
// nothing pierces the ring. The block's top moves up 8 with the people, so
// CONTENT_CENTRE goes -18.5 -> -22.5 and every framing sits 4 world px lower;
// the loop's lowest drawn point at the tightest k is still clear of the caption
// band (measured: screen 1463 at k 1.60, 17 px of the 1480 left).
export const STATION_R = 52;
export const TRAIN_DEG = 210;
export const EVAL_DEG = 330;

export const onLoop = (deg: number, r: number = LOOP_R) => ({
  x: LOOP_C.x + r * Math.cos(rad(deg)),
  y: LOOP_C.y + r * Math.sin(rad(deg)),
});
/** Arc length of `deg` degrees of the loop. */
export const arcLen = (deg: number) => Math.abs(rad(deg)) * LOOP_R;
/** Clockwise distance along the loop, in world px, from `fromDeg` to `deg`. */
export const degOf = (deg: number, fromDeg: number) =>
  ((((deg - fromDeg) % 360) + 360) % 360) * (LOOP_CIRC / 360);

export const TRAIN = onLoop(TRAIN_DEG);
export const EVAL = onLoop(EVAL_DEG);

// ---------------------------------------------------------------------------
// V2: WHAT THE TWO STATIONS ARE. The line names two things — training and
// evaluation — and the camera goes to both circles, so each circle now says
// which one it is with a glyph rather than being an unlabelled ring: Lucide
// `graduation-cap` for TRAINING, Lucide `clipboard-check` for EVALUATION,
// inline 24-unit paths, the d1Shared convention (0.6 of the tile, stroke 2.6,
// square caps, mitre joins). There is still no text in the piece.
// ---------------------------------------------------------------------------
export const STATION_ICON_TRAIN =
  `<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>` +
  `<path d="M22 10v6"/>` +
  `<path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`;
export const STATION_ICON_EVAL =
  `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>` +
  `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>` +
  `<path d="m9 14 2 2 4-4"/>`;

export const STATIONS = [
  { key: "train", deg: TRAIN_DEG, glyph: STATION_ICON_TRAIN, ...TRAIN },
  { key: "eval", deg: EVAL_DEG, glyph: STATION_ICON_EVAL, ...EVAL },
] as const;

/** the 24-unit glyph box, as a fraction of the ring's DIAMETER */
export const STATION_GLYPH_FRACTION = 0.6;
/** world px of the glyph box: 62.4 inside a 104 px ring */
export const STATION_GLYPH_BOX = 2 * STATION_R * STATION_GLYPH_FRACTION;
export const STATION_GLYPH_SCALE = STATION_GLYPH_BOX / 24;
export const STATION_GLYPH_STROKE = 2.6; // the d1Shared weight, in the 24-unit box
export const STATION_GLYPH_CAP = "square" as const;
export const STATION_GLYPH_JOIN = "miter" as const;
/** Longest sub-path of either glyph in the 24-unit box (the clipboard body is
 *  54), so one shared dash draws every sub-path head-led at one speed and they
 *  are all complete at u = 1. */
export const STATION_GLYPH_LEN = 56;

/** A station: the ink ring and the glyph inside it, both head-led, both the same
 *  colour — which is how the take converts them together. `ringDraw` and
 *  `iconDraw` are 0..1 draw progress; cut 4 opens on the resolved state and
 *  passes 1 and 1. */
export const StationGlyph: React.FC<{
  x: number;
  y: number;
  glyph: string;
  colour: string;
  opacity: number;
  ringDraw: number;
  iconDraw: number;
  /** where the ring's draw starts, degrees — the point the loop's head passes */
  rotate?: number;
  /** `iconShadow(k)`; the group carries its own per-icon shadow */
  shadow?: string;
  r?: number;
}> = ({ x, y, glyph, colour, opacity, ringDraw, iconDraw, rotate = 0, shadow, r = STATION_R }) => {
  const C = TAU * r;
  const g = 2 * r * STATION_GLYPH_FRACTION;
  const s = g / 24;
  return (
    <g style={shadow ? { filter: shadow } : undefined}>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={colour}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        opacity={opacity}
        strokeDasharray={C}
        strokeDashoffset={C * (1 - clamp01(ringDraw))}
        transform={`rotate(${rotate} ${x} ${y})`}
      />
      {iconDraw > 0 ? (
        <g
          transform={`translate(${x - g / 2} ${y - g / 2}) scale(${s})`}
          fill="none"
          stroke={colour}
          strokeWidth={STATION_GLYPH_STROKE}
          strokeLinecap={STATION_GLYPH_CAP}
          strokeLinejoin={STATION_GLYPH_JOIN}
          opacity={opacity}
          strokeDasharray={STATION_GLYPH_LEN}
          strokeDashoffset={STATION_GLYPH_LEN * (1 - clamp01(iconDraw))}
          dangerouslySetInnerHTML={{ __html: glyph }}
        />
      ) : null}
    </g>
  );
};

// The spoke is the ink line from the station ring's inner edge to the blob's
// edge, along the radius. A bead travels the FULL radius, station centre to
// blob edge, so it comes out of the middle of the ring rather than off its rim.
export const SPOKE_R0 = LOOP_R - STATION_R; // the ring's inner edge
export const spokePoint = (deg: number, r: number) => onLoop(deg, r);
export const TRAIN_EDGE = blobEdge(TRAIN_DEG);
export const EVAL_EDGE = blobEdge(EVAL_DEG); // the two rays are mirrored: same number
// The spoke SINKS 16 world px past the model's nominal edge. Ending it exactly
// on the boundary leaves a visible gap, because the boundary is feathered and
// the dots that survive nearest it are the small ones; sunk, the spoke plugs
// into the population and a bead running down it disappears among the dots
// rather than stopping short of them.
export const SPOKE_SINK = 16;
export const SPOKE_R1 = TRAIN_EDGE - SPOKE_SINK;
export const SPOKES = [
  { key: "train", deg: TRAIN_DEG, a: spokePoint(TRAIN_DEG, SPOKE_R0), b: spokePoint(TRAIN_DEG, SPOKE_R1) },
  { key: "eval", deg: EVAL_DEG, a: spokePoint(EVAL_DEG, SPOKE_R0), b: spokePoint(EVAL_DEG, SPOKE_R1) },
] as const;
export const TRAIN_FOOT = SPOKES[0].b;
export const EVAL_FOOT = SPOKES[1].b;
/** What a bead covers on a spoke: station centre to the spoke's sunk foot. */
export const SPOKE_TRAVEL = LOOP_R - SPOKE_R1;

const nearestSeat = (p: { x: number; y: number }) => {
  let best = 0;
  let bd = Infinity;
  SEATS.forEach((s, i) => {
    const d = Math.hypot(s.x - p.x, s.y - p.y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
};
export const NEAREST_TRAIN = nearestSeat(TRAIN_FOOT);
export const NEAREST_EVAL = nearestSeat(EVAL_FOOT);

// The people. One above each station, feet PERSON_GAP above the top of its
// station ring, on a line that runs straight down to it. That line is "the
// person holds this station" — a short leash rather than a long tether, so the
// person reads as attached to the station rather than as a separate object
// floating at the top of the frame.
export const PERSON_SIZE = 118;
export const PERSON_GAP = 60; // feet to the ring's top
export const LINE_BOT = TRAIN.y - STATION_R; // -229; both stations share a y
export const PERSON_FOOT_Y = LINE_BOT - PERSON_GAP; // -289
export const PERSON_Y = PERSON_FOOT_Y - PERSON_SIZE / 2; // -348, the glyph centre
export const PERSON_HEAD_Y = PERSON_Y - PERSON_SIZE / 2; // -407
export const LINE_TOP = PERSON_FOOT_Y;
export const PEOPLE = [
  { key: "train", x: TRAIN.x, y: PERSON_Y },
  { key: "eval", x: EVAL.x, y: PERSON_Y },
] as const;

// THE BLOCK: everything this piece ever draws, top to bottom. The people's
// heads are the top of it and the loop's lowest point is the bottom, and the
// camera's one vertical rule is that the middle of it sits at screen y 835 at
// every k — which is exactly `cy = CONTENT_CENTRE + CAM_LIFT / k`.
export const BLOCK_TOP = PERSON_HEAD_Y; // -407
export const BLOCK_BOT = LOOP_C.y + LOOP_R; // 370
/** The content centre this piece resolves on: `cy = CONTENT_CENTRE + CAM_LIFT/k`
 *  puts it at screen y 835, under the captions. */
export const CONTENT_CENTRE = (BLOCK_TOP + BLOCK_BOT) / 2; // -18.5

// ---------------------------------------------------------------------------
// THE CIRCUIT. One bead's whole life, in five segments:
//   0 up      the evaluation spoke, blob edge -> station centre
//   1 beat    two frames at the evaluation station
//   2 arc     evaluation -> training, the UPPER arc (120 deg over the top) or,
//             every other bead, the LOWER one (240 deg the long way round), so
//             the whole ring reads as one circuit
//   3 beat    two frames at the training station
//   4 down    the training spoke, station centre -> blob edge, and then it is
//             gone: it has entered the model
// A bead is born at the blob every BEAD_STEP frames from BEAD_F0. The three
// that switch the circuit on at BEAD_F0 are born further along it — one at the
// evaluation station, one at the training station — so every segment is
// carrying within a few frames and nothing has to fade up out of nowhere.
// ---------------------------------------------------------------------------
// 5.5 rather than 4.5: once the loop has converted, a bead and the line it is
// on are the same colour, so the bead reads by being a swelling that travels —
// at stroke 3 that wants a diameter of 11 world px, which is 12 screen px at
// the resolved wide.
export const BEAD_R = 5.5;
export const BEAD_SPEED = LINE_SPEED; // one shared speed, world px/frame
export const BEAD_STEP = 10; // frames between two beads leaving the model
export const BEAD_F0 = 36; // "based"
export const STATION_PAUSE = 2; // the beat a bead takes at a station
export const ARC_UPPER = -120; // evaluation -> training over the top
export const ARC_LOWER = 240; // evaluation -> training the long way round

export type Bead = { key: string; launch: number; seg0: number; lower: boolean };
export const BEADS: Bead[] = (() => {
  const out: Bead[] = [
    // the circuit switching on: one already at each station
    { key: "pE", launch: BEAD_F0, seg0: 2, lower: false },
    { key: "pT", launch: BEAD_F0, seg0: 4, lower: false },
  ];
  for (let n = 0; BEAD_F0 + n * BEAD_STEP <= DURATION; n++) {
    out.push({ key: `b${n}`, launch: BEAD_F0 + n * BEAD_STEP, seg0: 0, lower: n % 2 === 1 });
  }
  return out;
})();

/** The five segment durations of a bead's route, in frames. */
export const beadRoute = (lower: boolean) => [
  SPOKE_TRAVEL / BEAD_SPEED,
  STATION_PAUSE,
  arcLen(lower ? ARC_LOWER : ARC_UPPER) / BEAD_SPEED,
  STATION_PAUSE,
  SPOKE_TRAVEL / BEAD_SPEED,
];

export type BeadPos = { x: number; y: number; seg: number; u: number; enter: number; deg: number };

/** Where a bead is at `f`, or null before it is born / after it is absorbed.
 *  `enter` is the frame it entered the segment it is on — the beads take their
 *  colour from which station last let them go, so that frame is the state. */
export const beadAt = (b: Bead, f: number): BeadPos | null => {
  let t = f - b.launch;
  if (t < 0) return null;
  const durs = beadRoute(b.lower);
  let enter = b.launch;
  for (let i = b.seg0; i < durs.length; i++) {
    if (t < durs[i]) {
      const u = durs[i] <= 0 ? 0 : t / durs[i];
      if (i === 0) {
        const p = onLoop(EVAL_DEG, SPOKE_R1 + (LOOP_R - SPOKE_R1) * u);
        return { ...p, seg: i, u, enter, deg: EVAL_DEG };
      }
      if (i === 1) return { ...EVAL, seg: i, u, enter, deg: EVAL_DEG };
      if (i === 2) {
        const deg = EVAL_DEG + (b.lower ? ARC_LOWER : ARC_UPPER) * u;
        return { ...onLoop(deg), seg: i, u, enter, deg };
      }
      if (i === 3) return { ...TRAIN, seg: i, u, enter, deg: TRAIN_DEG };
      const p = onLoop(TRAIN_DEG, LOOP_R - (LOOP_R - SPOKE_R1) * u);
      return { ...p, seg: i, u, enter, deg: TRAIN_DEG };
    }
    t -= durs[i];
    enter = b.launch + durs.slice(b.seg0, i + 1).reduce((a, d) => a + d, 0);
  }
  return null;
};

/** The frame a bead disappears into the model. */
export const beadArrival = (b: Bead) =>
  b.launch + beadRoute(b.lower).slice(b.seg0).reduce((a, d) => a + d, 0);

export const ARRIVALS = BEADS.map(beadArrival).sort((a, b) => a - b);

// ---------------------------------------------------------------------------
// THE TWO TAKES, and then the loop.
//
// A take is one gesture in three parts: a thread rises out of the model up the
// spoke and its head reaches the ring; the ring converts ink -> accent with a
// click; the person's line to it goes dark. The thread STAYS — it is the
// model's grip on the station, and it is what makes the spoke read orange
// afterwards.
// ---------------------------------------------------------------------------
export const CONV_DUR = 3; // ink -> accent on a ring
// The rise ends and the ring converts a beat EARLY, so that the frame the
// conversion is cut to shows it already orange rather than starting to turn:
// the training ring is fully accent at f88 and the evaluation ring at f126.
export const TAKE_TRAIN = { rise0: 64, rise1: 83, conv: 85, kill0: 92, kill1: 98 };
export const TAKE_EVAL = { rise0: 111, rise1: 122, conv: 123, kill0: 128, kill1: 134 };
export const TRAIN_EMIT = 90; // every bead leaving training from here is accent
export const EVAL_EMIT = 128; // every bead leaving evaluation from here is accent

// G5. Accent runs clockwise along the loop from the training station all the
// way round back to itself. It is a COLOUR front with a soft leading edge, not
// a head-led draw: there is no bead to follow, so the 45 screen px/frame cap
// on a followable head does not apply and it reads as the ring catching light.
// It starts at the EVALUATION station, not the training one. The brief says
// training; at f142 the camera is still on the close-up it landed on at f114,
// and the training ring is off the left edge there — the payoff would start
// where nobody can see it. Starting it at the station the second take just
// landed on also makes the two into one motion: the model takes evaluation,
// and the orange runs out of that station round the whole loop. It still goes
// CLOCKWISE and still all the way round back to itself, passing training at
// f161, by which time the pull-back has brought it back into frame.
export const LOOP_CONV_FROM = EVAL_DEG;
export const LOOP_CONV_F0 = 142;
export const LOOP_CONV_F1 = 170;
export const LOOP_FRONT_SOFT = 40; // world px of soft edge
/** How far round the loop the accent has got at `f`, world px from LOOP_CONV_FROM. */
export const loopFront = (f: number) =>
  clamp01((f - LOOP_CONV_F0) / (LOOP_CONV_F1 - LOOP_CONV_F0)) * LOOP_CIRC;

// ---------------------------------------------------------------------------
// THE MODEL RIPENS. Every bead that lands ripens the model from the point of
// contact outward: the RIPEN_PER_HIT seats nearest the training spoke's foot
// that are still deep go deep -> ripe over TONE_DUR and stay there. The order
// is the distance to that foot plus a hashed half-step, so the ripe region
// grows as a ragged patch rather than as a clean disc. The seat actually hit —
// the one at the spoke's foot, where every bead disappears into the population
// — takes +0.1 for six frames on top.
//
// RIPEN_PER_HIT is SOLVED, not typed: the ripening has to keep pace with 200
// seats and be finished by the time the loop finishes converting, so it is the
// seat count over the number of landings at or before LOOP_CONV_F1. Eight
// landings are, so it is 25 a hit: the last still-deep seat starts its ramp at
// f160.4 and the model is fully ripe at f172 — which is where cut 4 picks it up.
// (This block sits after the loop conversion because it is solved from it.)
// ---------------------------------------------------------------------------
export const BEAD_HIT_DUR = 6;
export const RIPE_LANDINGS = ARRIVALS.filter((f) => f <= LOOP_CONV_F1).length;
export const RIPEN_PER_HIT = Math.ceil(NSEAT / Math.max(1, RIPE_LANDINGS));
export const RIPE_ORDER: number[] = SEATS.map((_, i) => i).sort((a, b) => {
  const da =
    Math.hypot(SEATS[a].x - TRAIN_FOOT.x, SEATS[a].y - TRAIN_FOOT.y) + hash(a, 31) * STEP_X;
  const db =
    Math.hypot(SEATS[b].x - TRAIN_FOOT.x, SEATS[b].y - TRAIN_FOOT.y) + hash(b, 31) * STEP_X;
  return da - db;
});
/** The frame each seat starts its deep -> ripe ramp. */
export const RIPE_AT: Float64Array = (() => {
  const a = new Float64Array(NSEAT).fill(Infinity);
  ARRIVALS.forEach((f, j) => {
    for (let m = 0; m < RIPEN_PER_HIT; m++) {
      const idx = j * RIPEN_PER_HIT + m;
      if (idx >= NSEAT) return;
      a[RIPE_ORDER[idx]] = f + hash(idx, 21) * 2;
    }
  });
  return a;
})();
/** Which seat each landing actually hits: always the one at the spoke's foot,
 *  because that is where every bead disappears. */
export const HIT_SEAT = ARRIVALS.map(() => NEAREST_TRAIN);


// ---------------------------------------------------------------------------
// THE CAMERA. Four moves, one track. `camMove` writes the k and cy keys a frame
// at a time (and takes cy off the EASED k, so the content centre never sags);
// cx rides the same eased curve and then goes through the same damper, so a pan
// and a zoom settle together.
//
// THE VERTICAL IS SOLVED ONCE, for the whole piece. The block this cut draws is
// 777 world px tall — the people's heads at -407 down to the loop's lowest
// point at +370 — and its middle, CONTENT_CENTRE, sits at screen y 835 at every
// k, which is exactly what `cy = CONTENT_CENTRE + CAM_LIFT / k` does. That is
// the framing, not a default: at k 1.60 it is the LOWEST the picture can sit
// and still keep the loop's bottom (screen 1457) out of the bottom 440 px the
// captions occupy, and it is the highest the station can sit and still keep the
// whole model in frame under it. So all four moves are a zoom and a pan, and
// every one of them holds the same vertical.
//
// The three horizontals ARE solved from what has to be in frame:
//   open  k 2.05, cx 540 — the model 679 screen px wide, the loop off both
//         sides, and both people clear of the side edges. 2.05 is the smallest
//         k that clears them: person.png's ink is 0.422 of its box wide, so the
//         training glyph's ink reaches world x 269.4 and needs k > 1.996 to
//         land outside screen 0. At 2.05 it ends at -15, so f0 is the model and
//         nothing else
//   M2    k 1.60, the TRAINING ring at screen x 200: ring's left edge at 130,
//         the model's right edge at 977
//   M3    k 1.35, the EVALUATION ring at screen x 750: the model's left edge at
//         94, and the TRAINING ring — orange by then — cleanly OUTSIDE the left
//         edge, its right edge at -56, rather than cut in half by it
//   wide  k 1.05, cx 540 — the loop 777 screen px across
// ---------------------------------------------------------------------------
export const K_OPEN = 2.05;
/** the wide M1 lands on; the same framing M4 comes back to */
export const K_WIDE = 1.05;
export const K_MID = K_WIDE;
export const K_TAKE = 1.6;
export const K_EVAL = 1.35;

/** The content centre that puts world y `wy` at screen y `sy` at zoom `k`. */
export const centreFor = (wy: number, sy: number, k: number) =>
  wy + (FRAME_H / 2 - sy) / k - CAM_LIFT / k;
/** The camera x that puts world x `wx` at screen x `sx` at zoom `k`. */
export const camXFor = (wx: number, sx: number, k: number) => wx - (sx - FRAME_W / 2) / k;

// Every content centre in the piece is the block's middle at screen 835. Stated
// through `centreFor` rather than as the bare constant so the framing is
// legible as a solution and a different screen y is one edit away.
export const C_OPEN = centreFor(CONTENT_CENTRE, 835, K_OPEN);
export const C_TAKE = centreFor(CONTENT_CENTRE, 835, K_TAKE);
export const C_EVAL = centreFor(CONTENT_CENTRE, 835, K_EVAL);
// The two close-ups are framed on the PAIR — the station and the model — not on
// the station alone: the gesture is the model reaching up into it, so the model
// may not be half out of frame while it does.
export const CX_TAKE = camXFor(TRAIN.x, 200, K_TAKE);
export const CX_EVAL = camXFor(EVAL.x, 750, K_EVAL);

export type CamSeg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  x0: number;
  x1: number;
  warp: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M1 "their motivation structure" — the pull-back off the model that reveals
  // the whole structure, and brings the stations and their people in from the
  // side edges
  {
    f0: 4,
    f1: 24,
    k0: K_OPEN,
    k1: K_MID,
    c0: C_OPEN,
    c1: CONTENT_CENTRE,
    x0: CENTRE_X,
    x1: CENTRE_X,
    warp: 0.72,
  },
  // M2 "manipulating" — THE CREEP onto the training station, one even ease
  {
    f0: 54,
    f1: 72,
    k0: K_MID,
    k1: K_TAKE,
    c0: CONTENT_CENTRE,
    c1: C_TAKE,
    x0: CENTRE_X,
    x1: CX_TAKE,
    warp: 1.0,
  },
  // M3 "and having control" — release, and travel to the evaluation station
  {
    f0: 92,
    f1: 104,
    k0: K_TAKE,
    k1: K_EVAL,
    c0: C_TAKE,
    c1: C_EVAL,
    x0: CX_TAKE,
    x1: CX_EVAL,
    warp: 0.72,
  },
  // M4 "their own training and evaluation" — out to the resolved wide
  {
    f0: 146,
    f1: 166,
    k0: K_EVAL,
    k1: K_WIDE,
    c0: C_EVAL,
    c1: CONTENT_CENTRE,
    x0: CX_EVAL,
    x1: CENTRE_X,
    warp: 0.72,
  },
];

/** One track out of the four moves: a key per frame inside a move, and ONE held
 *  key in the gap before the next one, which is what makes a hold a hold. */
const CAM_TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
    CX.push(CX[CX.length - 1]);
  };
  CAM_SEGS.forEach((s, n) => {
    if (n === 0 && s.f0 > 0) {
      F.push(0);
      K.push(s.k0);
      CY.push(s.c0 + CAM_LIFT / s.k0);
      CX.push(s.x0);
      hold(s.f0 - 1);
    }
    if (n > 0 && s.f0 > CAM_SEGS[n - 1].f1 + 1) hold(s.f0 - 1);
    const m = camMove(s);
    const span = s.f1 - s.f0;
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CX.push(s.x0 + (s.x1 - s.x0) * camEase(i / span, s.warp));
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY, CX };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;
export const CAM_CX = CAM_TRACK.CX;

/** The damped camera at every integer frame, run once. Same loop and same
 *  constants as the shared `runCamera`, with cx on it too. */
export const CAM_AT: { cx: Float64Array; cy: Float64Array; k: Float64Array } = (() => {
  const ax = new Float64Array(DURATION + 1);
  const ay = new Float64Array(DURATION + 1);
  const ak = new Float64Array(DURATION + 1);
  let cx = CAM_CX[0];
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vx = 0;
  let vy = 0;
  let vk = 0;
  ax[0] = cx;
  ay[0] = cy;
  ak[0] = k;
  for (let f = 1; f <= DURATION; f++) {
    const tx = interpolate(f, CAM_F, CAM_CX, clamp);
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    ax[f] = cx;
    ay[f] = cy;
    ak[f] = k;
  }
  return { cx: ax, cy: ay, k: ak };
})();
export const camAt = (f: number) => {
  const i = Math.max(0, Math.min(DURATION, Math.round(f)));
  return { cx: CAM_AT.cx[i], cy: CAM_AT.cy[i], k: CAM_AT.k[i] };
};

// ---------------------------------------------------------------------------
// G1's schedule, all of it read off the loop's own draw head so it cannot
// drift: the head passes a station at a frame, the ring draws from there, and
// the spoke two frames later.
// ---------------------------------------------------------------------------
export const LOOP_DRAW_F0 = 2;
export const LOOP_DRAW_F1 = 30;
export const LOOP_START_DEG = 270; // 12 o'clock
export const RING_DUR = 4;
/** V2: the glyph draws in head-led over the same four frames, starting the frame
 *  its ring closes — eval f10.7-14.7, training f29.3-33.3. */
export const ICON_LEAD = RING_DUR;
export const ICON_DUR = RING_DUR;
export const SPOKE_LEAD = 2;
export const SPOKE_DUR = 6;
/** The frame the loop's head passes `deg`, going clockwise from 12 o'clock. */
export const passFrame = (deg: number) =>
  LOOP_DRAW_F0 +
  (LOOP_DRAW_F1 - LOOP_DRAW_F0) * ((((deg - LOOP_START_DEG) % 360) + 360) % 360) / 360;
export const PASS_TRAIN = passFrame(TRAIN_DEG); // 25.33
export const PASS_EVAL = passFrame(EVAL_DEG); // 6.67

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, every thread, every converted line
  accentDeep: z.string(), // deep: an unread dot
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
  dotUnread: z.number(),
  idleThreadCount: z.number(),
  personSrc: z.string(),
  personSize: z.number(),
  beats: z.object({
    motivation: z.number(), // "their motivation" — opens tight on the model
    structure: z.number(), // "structure"        — the loop is drawing
    is: z.number(), // "is"
    really: z.number(), // "really"
    based: z.number(), // "based"                — the circuit switches on
    around: z.number(), // "around"
    manipulating: z.number(), // "manipulating"  — the creep, and the take
    and: z.number(), // "and"
    having: z.number(), // "having"
    control: z.number(), // "control"            — the second take
    over: z.number(), // "over"
    their: z.number(), // "their"                — the loop converts
    own: z.number(), // "own"
    training: z.number(), // "training"
    andTwo: z.number(), // "and"
    evaluation: z.number(), // "evaluation"      — the wide is settled
    end: z.number(), // speech ends; tail to 202
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
  dotUnread: OP_UNREAD_DOT,
  idleThreadCount: BLOB_IDLE_THREADS,
  personSrc: "person.png",
  personSize: PERSON_SIZE,
  beats: {
    motivation: 0,
    structure: 10,
    is: 17,
    really: 24,
    based: 35,
    around: 46,
    manipulating: 57,
    and: 102,
    having: 111,
    control: 121,
    over: 130,
    their: 141,
    own: 150,
    training: 155,
    andTwo: 162,
    evaluation: 166,
    end: 186,
  },
});

const TheirOwnTraining: React.FC<Props> = ({
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
  dotUnread,
  idleThreadCount,
  personSrc,
  personSize,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent); // 0 = deep, 1 = ripe
  const inkToAccent = makeTone(ink, accent); // a ring converting

  // -- camera ---------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- G1: the loop, the rings, the spokes ----------------------------------
  const loopDrawn = clamp01((frame - LOOP_DRAW_F0) / (LOOP_DRAW_F1 - LOOP_DRAW_F0));
  const loopHeadDeg = LOOP_START_DEG + 360 * loopDrawn;
  const loopHead = onLoop(loopHeadDeg);
  /** where the draw head was at `f`, for its motion smear */
  const loopHeadAt = (f: number) => {
    const u = clamp01((f - LOOP_DRAW_F0) / (LOOP_DRAW_F1 - LOOP_DRAW_F0));
    return u <= 0 || u >= 1 ? null : onLoop(LOOP_START_DEG + 360 * u);
  };

  // -- G5: the accent front round the loop ----------------------------------
  const front = loopFront(frame);
  const frontOn = frame >= LOOP_CONV_F0;
  /** has the accent reached the loop point at `deg`? 0..1, soft-edged */
  const frontAt = (deg: number) =>
    frontOn ? softFront(degOf(deg, LOOP_CONV_FROM), front, LOOP_FRONT_SOFT) : 0;

  // -- the model's tone -----------------------------------------------------
  // One permanent ramp per seat off its own ripening frame, plus the six-frame
  // +0.1 where a bead actually landed, plus the +0.1 a thread puts on its ends.
  const seatTone = new Float32Array(NSEAT);
  for (let i = 0; i < NSEAT; i++) seatTone[i] = smooth((frame - RIPE_AT[i]) / TONE_DUR);
  ARRIVALS.forEach((f, j) => {
    if (frame >= f && frame < f + BEAD_HIT_DUR) {
      const s = HIT_SEAT[j];
      seatTone[s] = clamp01(seatTone[s] + 0.1);
    }
  });

  // -- the model's own idle traffic -----------------------------------------
  const lit = new Float32Array(NSEAT);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: boolean };
  const threads: Th[] = [];
  const reach = 2;
  for (let j = 0; j < idleThreadCount; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    const bc = Math.max(0, Math.min(F_COLS - 1, sa.c + Math.round((hash(seed, 7) - 0.5) * 2 * reach)));
    const br = Math.max(0, Math.min(F_ROWS - 1, sa.row + Math.round((hash(seed, 8) - 0.5) * 2 * reach)));
    const b = SEAT_AT[br * F_COLS + bc];
    if (b < 0 || b === a) continue;
    const dn = ease(phase / 0.3, EASE_ARRIVE);
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
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
  // A bead crossing the close-ups runs at 35 screen px/frame, which is past
  // where 24fps starts to step rather than move, so each one carries the
  // shared motion smear: its own last three positions at falling opacity,
  // scaled by its SCREEN speed, so the smear is there in the close-ups and
  // gone at the wide.
  type Bd = {
    key: string;
    x: number;
    y: number;
    r: number;
    accent: boolean;
    at: (f: number) => { x: number; y: number } | null;
  };
  const beads: Bd[] = [];
  BEADS.forEach((b) => {
    const p = beadAt(b, frame);
    if (!p) return;
    // a bead's colour is which station last let it go — and, on the arc, the
    // accent front catching up with it
    let isAccent: boolean;
    if (p.seg === 0 || p.seg === 1) isAccent = frame >= TAKE_EVAL.conv;
    else if (p.seg === 2) isAccent = p.enter >= EVAL_EMIT || frontAt(p.deg) > 0.5;
    else isAccent = p.enter >= TRAIN_EMIT;
    // born out of a real object: two frames of growing into itself
    const grow = clamp01((frame - b.launch) / 2);
    beads.push({
      key: b.key,
      x: p.x,
      y: p.y,
      r: BEAD_R * grow,
      accent: isAccent,
      at: (f: number) => {
        const q = beadAt(b, f);
        return q ? { x: q.x, y: q.y } : null;
      },
    });
  });

  // -- the two takes --------------------------------------------------------
  // A take runs EXACTLY along the spoke's own ray, blob edge to the ring's
  // inner edge, and is drawn a hair thicker than the ink under it: the spoke
  // does not gain a second line beside it, it turns orange from the model up.
  const takeOf = (t: typeof TAKE_TRAIN, deg: number, seat: number) => {
    const u = clamp01((frame - t.rise0) / (t.rise1 - t.rise0));
    const start = onLoop(deg, SPOKE_R1);
    const end = onLoop(deg, SPOKE_R0);
    const conv = smooth((frame - t.conv) / CONV_DUR);
    return {
      on: frame >= t.rise0,
      x1: start.x,
      y1: start.y,
      x2: start.x + (end.x - start.x) * u,
      y2: start.y + (end.y - start.y) * u,
      head: u < 1,
      conv,
      col: inkToAccent(conv),
      // the click: half a step brighter for two frames as the ring closes on it
      ringCol:
        frame >= t.conv + CONV_DUR - 1 && frame < t.conv + CONV_DUR - 1 + HIGHLIGHT_FRAMES
          ? HIGHLIGHT
          : inkToAccent(conv),
      kill: smooth((frame - t.kill0) / (t.kill1 - t.kill0)),
      seat,
    };
  };
  const takes = [takeOf(TAKE_TRAIN, TRAIN_DEG, NEAREST_TRAIN), takeOf(TAKE_EVAL, EVAL_DEG, NEAREST_EVAL)];
  takes.forEach((t) => {
    if (t.on) seatTone[t.seat] = clamp01(seatTone[t.seat] + 0.1);
  });

  // -- the loop, as an ink circle with the accent arc growing over it -------
  const inkLoopOff = LOOP_CIRC * (1 - loopDrawn);
  const frontLead = Math.max(0, front - LOOP_FRONT_SOFT);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CAM_CX[0]}
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
            {/* the people's lines: they hold the stations until the model takes
                them, and then they hang dead */}
            <g style={{ filter: icon }}>
              {STATIONS.map((st, i) => (
                <line
                  key={st.key}
                  x1={st.x}
                  y1={LINE_TOP}
                  x2={st.x}
                  y2={LINE_BOT}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ + (OP_DARK - OP_READ) * takes[i].kill}
                />
              ))}
            </g>

            {/* the model */}
            {SEATS.map((s, i) => {
              const l = clamp01(seatTone[i] + 0.1 * lit[i]);
              const r = dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.35 * l);
              return <circle key={i} cx={s.x} cy={s.y} r={r} fill={tone(l)} opacity={dotUnread} />;
            })}

            {/* the model's own idle traffic */}
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

            {/* THE LOOP. Drawn head-led clockwise from 12 o'clock in G1, then
                converted clockwise from the training station in G5 by an accent
                arc laid over it with a soft leading edge. */}
            <g style={{ filter: icon }}>
              {/* V2: the loop line used to run straight through the middle of
                  each station ring, which is fine across an empty circle and
                  not fine across a glyph. The line now STOPS at each ring —
                  one mask, cut at the ring's own radius, over the ink loop and
                  the accent front alike — so a station reads as a node the loop
                  arrives at rather than a circle laid over a line. The draw head
                  is outside the mask, so it crosses unbroken. */}
              <defs>
                <mask
                  id="tot-station-gap"
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
              <g mask="url(#tot-station-gap)">
              <circle
                cx={LOOP_C.x}
                cy={LOOP_C.y}
                r={LOOP_R}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={OP_READ}
                strokeDasharray={LOOP_CIRC}
                strokeDashoffset={inkLoopOff}
                transform={`rotate(${LOOP_START_DEG} ${LOOP_C.x} ${LOOP_C.y})`}
              />
              {frontOn ? (
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
                    transform={`rotate(${LOOP_CONV_FROM} ${LOOP_C.x} ${LOOP_C.y})`}
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
                    transform={`rotate(${LOOP_CONV_FROM} ${LOOP_C.x} ${LOOP_C.y})`}
                  />
                </>
              ) : null}
              </g>
              {loopDrawn > 0 && loopDrawn < 1 ? (
                <>
                  {/* the tip carries the set's motion smear: at the open the
                      camera is at k 2.05 and the head crosses 170 screen px a
                      frame, which steps rather than moves without it */}
                  <Trail frame={frame} k={k} at={loopHeadAt} r={5} fill={ink} />
                  <circle cx={loopHead.x} cy={loopHead.y} r={5} fill={ink} />
                </>
              ) : null}
            </g>

            {/* THE SPOKES: station -> the model's edge */}
            <g style={{ filter: icon }}>
              {SPOKES.map((sp, i) => {
                const f0 = (i === 0 ? PASS_TRAIN : PASS_EVAL) + SPOKE_LEAD;
                const u = clamp01((frame - f0) / SPOKE_DUR);
                if (u <= 0) return null;
                return (
                  <g key={sp.key}>
                    <line
                      x1={sp.a.x}
                      y1={sp.a.y}
                      x2={sp.a.x + (sp.b.x - sp.a.x) * u}
                      y2={sp.a.y + (sp.b.y - sp.a.y) * u}
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                    />
                    {u < 1 ? (
                      <circle
                        cx={sp.a.x + (sp.b.x - sp.a.x) * u}
                        cy={sp.a.y + (sp.b.y - sp.a.y) * u}
                        r={4}
                        fill={ink}
                      />
                    ) : null}
                  </g>
                );
              })}
            </g>

            {/* THE TAKES: an accent thread out of the model, up the spoke, and
                it stays */}
            <g style={{ filter: icon }}>
              {takes.map((t, i) =>
                t.on ? (
                  <g key={i}>
                    <line
                      x1={t.x1}
                      y1={t.y1}
                      x2={t.x2}
                      y2={t.y2}
                      stroke={accent}
                      strokeWidth={STROKE + 0.6}
                      strokeLinecap="round"
                      opacity={0.95}
                    />
                    {t.head ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} /> : null}
                  </g>
                ) : null,
              )}
            </g>

            {/* THE STATIONS: the ring drawn head-led as the loop's head passes
                it, and the glyph that says WHICH station it is drawn head-led
                over the next four frames. Ring and glyph are one colour, so the
                take converts them together. */}
            {STATIONS.map((st, i) => {
              const pass = i === 0 ? PASS_TRAIN : PASS_EVAL;
              const u = clamp01((frame - pass) / RING_DUR);
              if (u <= 0) return null;
              const closing = frame >= pass + RING_DUR - 1 && frame < pass + RING_DUR + 1;
              const col = takes[i].conv > 0 ? takes[i].ringCol : closing ? HIGHLIGHT : ink;
              return (
                <StationGlyph
                  key={st.key}
                  x={st.x}
                  y={st.y}
                  glyph={st.glyph}
                  colour={col}
                  opacity={OP_READ + (1 - OP_READ) * takes[i].conv}
                  ringDraw={u}
                  iconDraw={clamp01((frame - pass - ICON_LEAD) / ICON_DUR)}
                  rotate={st.deg}
                  shadow={icon}
                />
              );
            })}

            {/* THE BEADS: the process, running */}
            <g style={{ filter: icon }}>
              {beads.map((b) => (
                <g key={b.key}>
                  <Trail frame={frame} k={k} at={b.at} r={b.r} fill={b.accent ? accent : ink} />
                  <circle cx={b.x} cy={b.y} r={b.r} fill={b.accent ? accent : ink} />
                </g>
              ))}
            </g>
          </svg>

          {/* the two people, white */}
          {PEOPLE.map((p) => (
            <Img
              key={p.key}
              src={staticFile(personSrc)}
              style={{
                position: "absolute",
                left: p.x - personSize / 2,
                top: p.y - personSize / 2,
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

export default TheirOwnTraining;
