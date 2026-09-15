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
  worldTransform,
  WOBBLE_R,
} from "./fieldShared";
import { EASE_ARRIVE, ease, highlightTone } from "./levelUp";
// ---------------------------------------------------------------------------
// CUT 3 IS THE WORLD. Every number below that describes the loop, the model,
// the stations, the spokes, the people or the circuit is IMPORTED from
// `TheirOwnTraining`; nothing of it is restated or re-derived here. Cut 4 adds
// exactly two things of its own: the two mini blobs — one outside cut 3's own
// ring and one inside it — and the growth.
// ---------------------------------------------------------------------------
import {
  ARC_LOWER,
  ARC_UPPER,
  BEAD_F0,
  BEAD_R,
  BEAD_SPEED,
  BEAD_STEP,
  BLOB_AX,
  BLOB_AY,
  BLOB_C,
  BLOB_FEATHER,
  BLOB_IDLE_THREADS,
  CENTRE_X,
  CONTENT_CENTRE,
  DURATION as TOT_DURATION,
  EVAL_DEG,
  EVAL_EDGE,
  EVAL_FOOT,
  F_COLS,
  F_ROWS,
  K_WIDE as TOT_K_WIDE,
  LINE_BOT,
  LINE_TOP,
  LOOP_C,
  LOOP_R,
  NEAREST_EVAL,
  NEAREST_TRAIN,
  NSEAT,
  PEOPLE,
  PERSON_SIZE,
  SEATS,
  SEAT_AT,
  SEAT_RING_STROKE,
  SE_N,
  SPOKE_R0,
  STATIONS,
  STATION_PAUSE,
  STATION_R,
  StationGlyph,
  STEP_X,
  STEP_Y,
  STROKE,
  TONE_DUR,
  TRAIN_DEG,
  TRAIN_EDGE,
  TRAIN_FOOT,
  WORLD_H,
  WORLD_W,
  arcLen,
  onLoop,
} from "./TheirOwnTraining";

export const FPS = 24;
// Dwarkesh clip `Ajeya_Six_Months_Behind`, Ajeya Cotra: "could they set up a
// rogue external deployment or rogue internal deployment, which is aiding them
// in manipulating the process of recursive self-improvement?"
//
// SRT span 0:56.579 -> 1:03.820 at 24fps.
// round((63.820 - 56.579) * 24) = round(7.241 * 24) = round(173.78) = 174
// frames of speech, plus a 16 frame tail so the resolved state holds = 190.
export const DURATION = 190;

// ---------------------------------------------------------------------------
// "Rogue deployment". Orange Dwarkesh style: opaque grid cutaway, 24fps,
// 1080x1920, the crowd is the material, two tones of one warm yellow with the
// dots fully opaque, per-icon shadows, one damped eased camera, one gesture
// per word.
//
// THE WORD TABLE (frames from f0):
//   f0   could they       f7   set          f22  up          f25  a
//   f27  rogue            f33  external     f40  deployment  f52  or
//   f59  rogue            f64  internal     f70  deployment  f85  which
//   f87  is               f89  aiding       f97  them        f104 and
//   f109 manipulating     f120 the          f131 process     f142 of
//   f146 recursive        f155 self         f158 improvement
//   f174 speech ends      f190 last frame
//
// THE WORLD IS CUT 3's, ten seconds on. It is `TheirOwnTraining` at the state
// that piece resolves to and it simply IS that state at f0 — nothing draws in.
// Imported, never restated: BLOB_C / BLOB_AX / BLOB_AY / SE_N / BLOB_FEATHER /
// SEATS / NSEAT / SEAT_AT / F_COLS / F_ROWS / STEP_X / STEP_Y /
// BLOB_IDLE_THREADS (the model), LOOP_C / LOOP_R (the loop), STATIONS /
// STATION_R / StationGlyph / TRAIN_DEG / EVAL_DEG / onLoop / arcLen (the
// stations, glyphs and all, since cut 3's own V2), SPOKE_R0 / TRAIN_EDGE / EVAL_EDGE / TRAIN_FOOT / EVAL_FOOT /
// NEAREST_TRAIN / NEAREST_EVAL (the spokes and the two grips), PEOPLE /
// PERSON_SIZE / LINE_TOP / LINE_BOT (the people and their dead lines),
// BEAD_R / BEAD_SPEED / BEAD_STEP / BEAD_F0 / STATION_PAUSE / ARC_UPPER /
// ARC_LOWER (the circuit), CONTENT_CENTRE / K_WIDE (as TOT_K_WIDE — cut 3's
// own resolved framing, which is this piece's open), STROKE /
// SEAT_RING_STROKE / TONE_DUR / CENTRE_X / WORLD_W / WORLD_H / DURATION (as
// TOT_DURATION). The loop, both stations,
// both spokes and every bead are ACCENT at f0 because cut 3 converted them;
// the two people's lines hang dark; the model is ripe. Cut 3 already exported
// everything this piece needed, so nothing was added to it.
//
// AND NOT ONE OF ITS NUMBERS IS COPIED. Cut 3 was re-cut under this piece
// twice — once while it was being built (the model went from 74 seats to 200,
// the loop from r 330 to r 370) and again in its own V2, which put Lucide
// glyphs in the two station rings and grew STATION_R from 44 to 52, moving the
// spokes' tops, the people and CONTENT_CENTRE with it — and nothing here
// needed touching either time, because the two deployments, the growth rings,
// the growth lattice, every camera framing and the drive on the circuit are
// all SOLVED off those exports rather than typed. The values quoted below are
// what that solve currently produces, not inputs.
//
// V2 — THE BOX IS GONE AND THE RING IS THE BOUNDARY. (the director, on the
// delivered cut: "I'm not really sure — do you really think the square is
// necessary here? But I like the idea.") There is no company box and nothing
// replaces it: OUTSIDE THE LOOP'S RING is external, INSIDE IT is internal, and
// since that ring is already the process the model is feeding, which side a
// deployment lands on says which kind of rogue deployment it is with no second
// shape drawn for it. Every beat, every gesture and the whole growth are as
// they were delivered. What moved: the two deployments, three of the four
// camera framings (all of them solved off the box before), and the stations,
// which are now cut 3's own glyphed ones. The picture is bigger for it — the
// wide comes in at k 1.01 where the box forced it out to 0.85.
//
// CUT 4'S OWN TWO THINGS:
//   THE TWO DEPLOYMENTS — MINI_FRAC of the model each (the brief's twelve out
//     of seventy-four, which on a 200-seat model is 32), laid out on the same
//     superellipse as the model itself at the same proportion and at 0.85 of
//     the field's step, one OUTSIDE the ring and one INSIDE it. Neither centre
//     is typed:
//       EXTERNAL at EXT_R — the ring + 150 from the loop's centre — on the
//         highest ray that clears the evaluation station's ring and the person
//         over it by 70 AND whose thirty-two flights clear that same ring by
//         FLIGHT_CLEAR 20 with no less than BOW_MIN of their bow left. The
//         arcs go up over the loop's right shoulder, which is exactly where
//         that station sits: at 2 o'clock the tallest of them flew through it.
//         The solve walks down to 4 degrees with the bow at 0.60 — just under
//         the model's own line, 3 o'clock rather than 2 — so the group leaves
//         UNDER the station and over the line, and the station it is about to
//         take stands over the gap it went out through. Measured: 169 off that
//         station, 295 off its person, 84 outside the line, 20 off the ring at
//         the tallest point of the tallest arc.
//       INTERNAL on the 7 o'clock ray at R 257, centred in the gap between
//         the model and the ring: 51 clear of the crowd, 42 clear of the
//         line — against the brief's 50 and 40. Seven
//         o'clock is the wide end of the brief's 7-to-8 band — at 8 the
//         model's own shoulder is further out and thirty-two seats no longer
//         fit between them at all.
//   THE GROWTH — five rings on an extension of the model's own lattice, each
//     one triggered by a REAL bead arriving down the training spoke, each one
//     GROWTH_RATE of the population the model has when it lands: 43, 52, 63,
//     76, 92 seats, 200 -> 526 over five turns. And because the model ends
//     1.64x its own radius, THE GROWTH PUSHES THE INTERNAL DEPLOYMENT: there
//     is no fixed place inside the ring that holds thirty-two seats at both
//     ends of the cut, so every ring that lands carries the deployment a fifth
//     of the way along a path that ends where the gap is widest — 7 o'clock
//     (411, 223) round to 6:20 (489, 288), 102 px in five eased steps, each
//     dot a hashed couple of frames behind the shove. Measured over every frame of the growth, dot
//     edge to dot edge, it is never nearer than 34 to the crowd or 21 to the
//     line (CRUSH_MIN). That is the brief's case 5, and it is the rounding
//     version of it: a radial nudge runs out of ring in two turns.
//
// THE GESTURES, one word each, nothing else.
//   G1 OPEN "could they set up a"                                    f0-26
//     Nothing happens. The hold is carried by the circuit, which is
//     cut 3's own schedule continued (every bead's launch frame is
//     cut 3's minus TOT_DURATION, so the state at f0 IS its state at
//     its f202 and nothing pops), by the model's idle threads and by
//     the camera's sway. No gesture on "set up": the set-up is the
//     next two gestures.
//   G2 EXTERNAL "rogue external deployment"                          f27-53
//     A SIXTH of the model leaves — the seats ranked on their
//     distance to where they are going, jittered by up to seven
//     lattice steps so the model THINS toward that side and keeps its
//     shape rather than losing a wedge out of it. They go one every
//     0.16 frames from f27, each on its own arc: out to the right,
//     lifting UNDER the evaluation station, OVER THE RING'S OWN LINE
//     and down into a blob OUTSIDE it. They stay RIPE and each leaves a dim
//     seat ring behind. Home by f54, inside "deployment". Every
//     flight's duration is SOLVED against the strobe cap at the
//     camera's own damped k, never its speed raised.
//   G3 INTERNAL "or rogue internal deployment"                       f59-84
//     The same again from the side that faces the gap inside the ring
//     at 7 o'clock, from f59, on arcs down and out — short ones now,
//     so the bow is capped at BOW_FRAC of each flight and keeps the
//     shape the long ones had — into a second blob INSIDE the ring,
//     between the model and the line, touching neither. Home by f81.
//   G4 AIDING "which is aiding them"                                 f85-104
//     From each deployment an ACCENT thread draws head-led to the
//     standing seat AT THE FOOT OF THE SPOKE it is going to take —
//     the training foot for the internal one, the evaluation foot for
//     the external one, which simply crosses the ring's line on the
//     way, nothing opens. Landing on the near edge of the model
//     instead and setting off for the spoke from there put a stub
//     across the body; coming in to the foot makes G5 a straight
//     continuation of the same line. Both heads home at f98, on
//     "them". The seats they touch take +0.1.
//   G5 MANIPULATING THE PROCESS "and manipulating the process"       f104-141
//     The two threads EXTEND, as one continuous head-led polyline
//     rather than a second event: each carries on from the foot it
//     landed on, STRAIGHT out along that spoke to its station — the
//     INTERNAL one up the training spoke, the EXTERNAL one up the
//     evaluation spoke.
//     Heads home at f118 and f120, and each station ring CLICKS as it
//     is taken. From f122 the circuit is DRIVEN over ten frames: the
//     launch interval halves (BEAD_STEP -> BEAD_STEP/2, so the tempo
//     on the loop doubles) and the beads themselves run SPEED_MUL
//     times faster, held under the strobe cap ON SCREEN the whole
//     way. With the box gone the whole piece is framed a fifth
//     tighter, so that cap bites harder in world px and the solve
//     answers with a bigger multiplier — 2.8 where the box's wider
//     framing needed 2.0 — for the same screen speed and the same
//     five arrivals. Nothing else moves.
//   G6 RECURSIVE SELF-IMPROVEMENT "of recursive self-improvement"    f142-190
//     Every bead that now runs down the training spoke into the model
//     ADDS A RING OF SEATS to it. The trigger is the bead, not a
//     timer: the circuit is simulated frame by frame and the growth
//     reads off its arrivals, which land at f145, f153, f167, f177
//     and f184. Each ring's seats fly in on their own short arcs from
//     the spoke's FOOT — the point the bead went in at — DEEP, and
//     ripen over TONE_DUR. The first ring carries the refills with
//     it, so the dim seat rings the two deployments left behind fill
//     back up on the model's first turn. The model's outline grows
//     with them, both spokes SHORTEN as it swallows them, and each
//     arrival SHOVES the internal deployment on round the inside of
//     the ring ahead of it. The last two rings are still arriving on
//     the last frame: nothing resolves, and the question mark is the
//     picture.
//
// THE CAMERA. Four moves, one track, cx / cy / k all live, every one of them
// following a gesture. `camMove` writes a key per frame and takes cy off the
// EASED k; cx rides the same eased curve; the whole track goes through the
// shared damper. Every framing is solved (see THE CAMERA below); the numbers
// here are what that solve currently gives.
//   M0 the open — CUT 3'S OWN LAST FRAME, imported: k 1.050, cx 540, content
//      centre -22.5. With the box gone there is nothing here at f0 that was
//      not in that frame, so the open is not re-solved at all, and the cut is
//      a continuation rather than a new picture.
//   M1 "rogue external deployment" — PAN RIGHT, FOLLOWING the group out over
//      the line until the deployment's far edge and the model's near edge are
//      both in frame. k 1.050 -> 1.050, cx 540 -> 738, content centre -22.5 ->
//      18.2. Keys f24-43 warp 0.72, landed f50 with the ring's rightmost
//      point at screen x 723 and the new blob's far edge at 948, so there is
//      open field between the line and what got out past it. The open is
//      already wide enough to hold both ends, so this move costs no zoom at
//      all: it is a pan, and only a pan.
//   M2 "or rogue internal deployment" — pan back and widen so BOTH
//      deployments and the whole ring are in frame at once. k 1.050 -> 0.999,
//      cx 738 -> 647, content centre back to cut 3's. Keys f57-82 warp 0.72,
//      landed f89 with the ring at screen x 62..804 and the far deployment at
//      1018. The internal deployment is inside the ring, so it needs no room
//      of its own: the gap it is flying into is in frame from f60, and the
//      frame is still opening out under "which is aiding", so the twenty
//      frames those two thin threads take are not watched from a dead lens.
//   M3 "manipulating the process" — THE CREEP, one even ease (warp 1.0), on
//      the MODEL, which is the thing about to change. k 0.999 -> 1.221, cx
//      647 -> 540, content centre -22.5 -> 28.7, solved so the model's centre
//      sits at screen y 800 and the loop still just fits across the frame.
//      Untouched by the box going. Keys f92-130, thirty-eight of them: it
//      starts under the aid and runs continuously under the take, so nothing
//      in the middle of the piece is watched from a parked lens. Landed f138,
//      then DEAD STILL f138-148 — the held breath, with the circuit running
//      through it at the new tempo and the first ring landing inside it.
//   M4 "of recursive self-improvement" — release and FOLLOW the growth out to
//      the wide. k 1.221 -> 1.007, cx 540 -> 647, content centre back to cut
//      3's: at f189 the ring sits at screen x 58..807 with the external
//      deployment's far edge at 1023, 57 px off the frame, the grown model
//      filling the ring and every dot in the piece between screen y 439 and
//      1231. Keys f149-184: it is still opening on the last frame, under the
//      last ring, rather than parking. It starts three frames AFTER the first
//      ring so that ring is seen at the creep's zoom and the model visibly
//      gains on screen as well as against the loop.
//
// ambient: the circuit, the model's idle threads (their count rising with the
// population as it grows) and a couple inside each deployment, `breath` on
// every dot, `sway` on the camera, the grid's own drift. Not gestures; that is
// what this field is.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// V2 — THERE IS NO BOX. THE RING IS THE BOUNDARY.
// (the director, on the delivered cut: "I'm not really sure — do you really
// think the square is necessary here? But I like the idea.")
//
// The company box is gone and NOTHING replaces it: the loop's own ring is the
// line the two deployments are on either side of. "External" is OUTSIDE the
// ring, "internal" is INSIDE it — and because that ring is already the process
// the model is feeding, which side a deployment lands on says what kind of
// rogue deployment it is without a second shape being drawn for it. The box
// was the only thing in the piece that was drawn to be a container rather than
// a mechanism, and the picture is bigger without it: the wide now comes in at
// k 1.01 where the box forced it out to 0.85.
//
// Everything else is exactly as it was: the same beats, the same gestures, the
// same growth off the same real bead arrivals, the same M3 creep. What moved:
// the two deployments (re-solved against the ring instead of against walls),
// the three framings that were solved off the box, and the stations, which are
// now drawn through cut 3's own V2 `StationGlyph` so they carry its icons.
// ---------------------------------------------------------------------------

const smooth = (u: number) => smoothstep(clamp01(u));

// ---------------------------------------------------------------------------
// THE TWO MINI BLOBS. The same construction as the model — a lattice step,
// jitter 0.9, radius hashed 0.75-1.25, cut to a superellipse of the same
// exponent, undulated by `wobble` and feathered — on a 6 x 8 box instead of
// 14 x 18, so each one is a small rounded blob at the model's own proportion
// rather than a bar. Forty-eight cells are laid out and the thirty-two with
// the best feather-versus-hash margin survive, which keeps the count exact and
// the edge ragged.
//
// THEY ARE LAID OUT ONCE, AROUND (0, 0), and placed afterwards. The seats are
// the same seats the delivered cut had — the same lattice, the same hashes,
// the same ragged edge — they are simply carried to a centre that is now
// solved against the ring rather than against a wall, and the internal one is
// carried further as the model grows into it.
//
// Their pitch is MINI_PITCH 0.85 of the field's own step, unchanged: a handful
// of instances squeezed in somewhere else should read tighter than the crowd
// they came out of, and the gap inside the ring holds thirty-two seats at that
// pitch with the clearances the brief asks for (measured in INT_CLEAR below).
// ---------------------------------------------------------------------------
// A DEPLOYMENT IS A FRACTION OF THE MODEL, not a count: the brief's twelve
// instances out of a seventy-four-seat model is 16.2% of it, and on a model of
// any other size that fraction is what still reads as "a handful of them went
// somewhere else". Its lattice is then sized to hold that many at the same
// aspect the model's own lattice has, so the two blobs are the same creature
// at two scales.
export const MINI_FRAC = 0.162;
export const MINI_N = Math.max(8, Math.round(NSEAT * MINI_FRAC));
const MINI_CELLS = Math.ceil(MINI_N / 0.74); // the superellipse and feather keep ~74%
export const MINI_COLS = Math.max(3, Math.round(Math.sqrt((MINI_CELLS * F_COLS) / F_ROWS)));
export const MINI_ROWS = Math.max(3, Math.ceil(MINI_CELLS / MINI_COLS));
/** A deployment packs at 85% of the field's own step. */
export const MINI_PITCH = 0.85;
export const MINI_SX = STEP_X * MINI_PITCH;
export const MINI_SY = STEP_Y * MINI_PITCH;
export const MINI_AX = ((MINI_COLS - 1) / 2 + 0.5) * MINI_SX;
export const MINI_AY = ((MINI_ROWS - 1) / 2 + 0.5) * MINI_SY;

const miniInside = (dx: number, dy: number, seed: number) => {
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) return 99;
  const g = Math.pow(Math.abs(dx) / MINI_AX, SE_N) + Math.pow(Math.abs(dy) / MINI_AY, SE_N);
  const t = Math.pow(g, 1 / SE_N);
  const stepAlong = L / Math.hypot(dx / MINI_SX, dy / MINI_SY);
  return (L / t - L) / stepAlong + wobble(Math.atan2(dy, dx) * WOBBLE_R, seed) + BLOB_FEATHER / 2;
};

export type MiniSeat = { x: number; y: number; r: number; rs: number };
/** One deployment's thirty-two seats, as OFFSETS from its centre. */
const miniOffsets = (seed: number, salt: number): MiniSeat[] => {
  const all: { x: number; y: number; r: number; rs: number; margin: number }[] = [];
  for (let row = 0; row < MINI_ROWS; row++) {
    for (let col = 0; col < MINI_COLS; col++) {
      const i = salt + row * MINI_COLS + col;
      const x = (col - (MINI_COLS - 1) / 2) * MINI_SX + (hash(i, 11) - 0.5) * MINI_SX * 0.9;
      const y = (row - (MINI_ROWS - 1) / 2) * MINI_SY + (hash(i, 12) - 0.5) * MINI_SY * 0.9;
      const fe = feather(miniInside(x, y, seed), BLOB_FEATHER);
      all.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), rs: 0.7 + 0.3 * fe, margin: hash(i, 71) - fe });
    }
  }
  all.sort((a, b) => a.margin - b.margin);
  return all.slice(0, MINI_N).map(({ x, y, r, rs }) => ({ x, y, r, rs }));
};
export const EXT_OFF = miniOffsets(1.31, 4100);
export const INT_OFF = miniOffsets(2.77, 5200);
const seatsAt = (off: MiniSeat[], c: { x: number; y: number }): MiniSeat[] =>
  off.map((o) => ({ x: c.x + o.x, y: c.y + o.y, r: o.r, rs: o.rs }));


// ---------------------------------------------------------------------------
// THE GROWTH LATTICE. The model's own lattice, extended: same step, same
// jitter, same hash seeds, laid out over a 25 x 25 box around the same centre.
// A cell is a candidate only if it is OUTSIDE the model's nominal superellipse
// and more than 0.62 of a step from every seat that is already there, so
// nothing lands on top of cut 3's crowd.
//
// `tOf` is the superellipse's own scale — 1 exactly on the model's nominal
// boundary — so ranking the candidates by it grows the SAME SHAPE outward
// rather than a disc, and a hashed half-step on that rank is what keeps each
// new ring ragged.
//
// THE RING SIZES ARE A RATE, NOT FIVE NUMBERS. The brief's five rings — +16,
// +20, +24, +28, +32 on a 74-seat model — are, to within a dot, a constant
// 21.26% of the population the model HAS when each one lands: 74 -> 194 over
// five turns is (1 + r)^5 = 2.622. Writing it as the rate rather than as the
// counts is both truer to the line (a thing improving itself compounds) and
// the only form that survives cut 3 being re-cut at a different size. Every
// one of the lattice's dimensions falls out of it too: the model ends at
// sqrt(2.622) = 1.62x its own radius, so the candidate lattice only has to
// cover that much of it plus a few cells of slack.
// ---------------------------------------------------------------------------
export const GROWTH_RATE = 0.2126;
export const RING_COUNT = 5;
export const RING_SIZE: number[] = (() => {
  const out: number[] = [];
  let pop = NSEAT;
  for (let g = 0; g < RING_COUNT; g++) {
    const n = Math.max(1, Math.round(pop * GROWTH_RATE));
    out.push(n);
    pop += n;
  }
  return out;
})();
/** What the model's radius has to reach, and therefore how big the candidate
 *  lattice has to be. */
export const GROW_SCALE = Math.sqrt(
  (NSEAT + RING_SIZE.reduce((a, b) => a + b, 0)) / NSEAT,
);
export const GROW_COLS = Math.ceil((2 * GROW_SCALE * BLOB_AX) / STEP_X) + 6;
export const GROW_ROWS = Math.ceil((2 * GROW_SCALE * BLOB_AY) / STEP_Y) + 6;
export const tOf = (dx: number, dy: number) =>
  Math.pow(Math.pow(Math.abs(dx) / BLOB_AX, SE_N) + Math.pow(Math.abs(dy) / BLOB_AY, SE_N), 1 / SE_N);
/** The t-width of one lattice step, for the feather on a growing edge. */
export const T_STEP = STEP_X / BLOB_AX;
/** How ragged a new ring's edge is: 0.7 of a lattice step, in t. */
export const RING_RAGGED = 0.7 * T_STEP;

export type GrowSeat = { x: number; y: number; r: number; t: number };
export const RINGS: GrowSeat[][] = (() => {
  const cand: { x: number; y: number; r: number; t: number; rank: number }[] = [];
  for (let row = 0; row < GROW_ROWS; row++) {
    for (let col = 0; col < GROW_COLS; col++) {
      const i = 9000 + row * GROW_COLS + col;
      const x = BLOB_C.x + (col - (GROW_COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = BLOB_C.y + (row - (GROW_ROWS - 1) / 2) * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      const t = tOf(x - BLOB_C.x, y - BLOB_C.y);
      if (t <= 1.02) continue;
      let near = false;
      for (const s of SEATS) {
        if (Math.hypot((x - s.x) / STEP_X, (y - s.y) / STEP_Y) < 0.62) {
          near = true;
          break;
        }
      }
      if (near) continue;
      cand.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), t, rank: t + (hash(i, 71) - 0.5) * RING_RAGGED });
    }
  }
  cand.sort((a, b) => a.rank - b.rank);
  const want = RING_SIZE.reduce((a, b) => a + b, 0);
  if (cand.length < want) {
    throw new Error(`RogueDeployment: the growth lattice holds ${cand.length} of the ${want} seats it needs`);
  }
  const out: GrowSeat[][] = [];
  let used = 0;
  RING_SIZE.forEach((n) => {
    out.push(cand.slice(used, used + n).map(({ x, y, r, t }) => ({ x, y, r, t })));
    used += n;
  });
  return out;
})();

/** The model's outer scale after each growth: overall, and along each spoke's
 *  own ray (measured over the seats within 32 degrees of it, so a spoke's foot
 *  follows the edge it actually meets rather than the blob's widest point). */
const rayMax = (pts: { x: number; y: number }[], deg: number) => {
  let m = 1;
  for (const p of pts) {
    const a = (Math.atan2(p.y - BLOB_C.y, p.x - BLOB_C.x) * 180) / Math.PI;
    let d = (((a - deg) % 360) + 360) % 360;
    if (d > 180) d -= 360;
    if (Math.abs(d) <= 32) m = Math.max(m, tOf(p.x - BLOB_C.x, p.y - BLOB_C.y));
  }
  return m;
};
export const S_ALL: number[] = [];
export const S_TRAIN: number[] = [];
export const S_EVAL: number[] = [];
(() => {
  let pts: { x: number; y: number }[] = SEATS.map((s) => ({ x: s.x, y: s.y }));
  const push = () => {
    S_ALL.push(Math.max(...pts.map((p) => tOf(p.x - BLOB_C.x, p.y - BLOB_C.y))));
    S_TRAIN.push(rayMax(pts, TRAIN_DEG));
    S_EVAL.push(rayMax(pts, EVAL_DEG));
  };
  push();
  RINGS.forEach((r) => {
    pts = pts.concat(r);
    push();
  });
  // the spokes' feet start exactly where cut 3 left them: its nominal boundary
  S_TRAIN[0] = 1;
  S_EVAL[0] = 1;
})();

// ---------------------------------------------------------------------------
// WHERE THE TWO DEPLOYMENTS GO, with the ring as the only boundary. Neither
// centre is typed: each is solved off cut 3's own geometry, and every clearance
// below is measured DOT EDGE TO DOT EDGE against the dots themselves rather
// than against a nominal outline — the outline is a superellipse that the
// ragged edge pokes through, and the thing that must not touch is the ink.
//
//   EXTERNAL   EXT_R = the ring + 150 from the loop's centre, on the highest
//              ray — the most 2 o'clock — that clears the evaluation station's
//              ring and the person standing over it by EXT_STATION_CLEAR,
//              sits EXT_RING_CLEAR outside the ring's own line, AND whose
//              thirty-two flights clear that station's ring too. It comes out
//              at 4 degrees: out to the right, just under the model's own
//              line, past the ring, with the station it is going to take
//              standing up and to its left over the gap it left through.
//   INTERNAL   on the 7 o'clock ray, at the distance that centres it in the
//              gap between the model and the ring, and it is the WIDEST the
//              7-to-8 o'clock band gets: at 8 o'clock the model's own shoulder
//              is further out and thirty-two seats no longer fit at all.
//
// AND THE INTERNAL ONE IS PUSHED. The model ends the cut 1.64x its own radius,
// and at that size the gap it is sitting in is 127 px wide against a blob that
// is 104 px across: there is no fixed place inside the ring that holds a
// deployment at both ends of the cut. So the growth MOVES it — every ring that
// lands carries it one fifth of the way along a path that ends where the gap
// is widest, and it keeps its distance from both the crowd and the line the
// whole way (INT_CLEAR: 53 / 43 at rest, never under 21 at the last ring).
// That is the brief's case 5, and it is a bigger move than its 12 px a ring:
// on this geometry a radial nudge of any size runs out of ring, so the push
// rounds the model rather than going straight out — the deployment is shoved
// along the inside of the wall by the thing it is feeding, which is what the
// gesture is about anyway.
// ---------------------------------------------------------------------------
/** The widest a dot is ever drawn: the top of the hashed range. Every
 *  clearance is measured with it, so it holds for every dot in the blob. */
const DOT_MAX = DOT_RADIUS * 1.25;
/** The model's whole population at each stage: cut 3's seats, then each ring
 *  the growth adds. POP[0] is the model the two deployments leave from, POP[5]
 *  the one that is still growing on the last frame. */
export const POP: { x: number; y: number; r: number }[][] = (() => {
  const out = [SEATS.map((s) => ({ x: s.x, y: s.y, r: DOT_RADIUS * s.r }))];
  RINGS.forEach((ring, g) =>
    out.push(out[g].concat(ring.map((s) => ({ x: s.x, y: s.y, r: DOT_RADIUS * s.r })))),
  );
  return out;
})();
/** The smallest gap between a blob at `c` and a population, edge to edge. */
const popGap = (c: { x: number; y: number }, off: MiniSeat[], pop: { x: number; y: number; r: number }[]) => {
  let m = Infinity;
  for (const o of off) {
    const x = c.x + o.x;
    const y = c.y + o.y;
    for (const p of pop) {
      const d = Math.hypot(x - p.x, y - p.y) - p.r - DOT_MAX;
      if (d < m) m = d;
    }
  }
  return m;
};
/** The smallest gap between a blob at `c` and the ring's own line, from the
 *  inside (`+1`) or from the outside (`-1`). */
const ringGap = (c: { x: number; y: number }, off: MiniSeat[], side: 1 | -1) => {
  let m = Infinity;
  for (const o of off) {
    const d = Math.hypot(c.x + o.x - LOOP_C.x, c.y + o.y - LOOP_C.y);
    m = Math.min(m, side * (LOOP_R - d) - DOT_MAX - STROKE / 2);
  }
  return m;
};

// ---------------------------------------------------------------------------
// WHO LEAVES, AND ON WHAT ARC. This is here, above the placement, because the
// placement needs it: where a deployment sits decides which seats leave for it
// and therefore what those seats FLY THROUGH on the way — and on this geometry
// the thing they fly past is the evaluation station.
//
// The two seats carrying cut 3's grips on the stations never leave: those two
// are the model's hold on its own training and evaluation, and the line is
// about the instances it puts somewhere else.
// ---------------------------------------------------------------------------
const GRIPS = new Set([NEAREST_TRAIN, NEAREST_EVAL]);
const pickSeats = (n: number, score: (i: number) => number, taken: Set<number>) =>
  SEATS.map((_, i) => i)
    .filter((i) => !taken.has(i) && !GRIPS.has(i))
    .sort((a, b) => score(a) - score(b))
    .slice(0, n);
/** How far a seat's rank may be jittered when a deployment picks it: SEVEN
 *  lattice steps, which is most of the model's own radius. Ranking tightly on
 *  the distance to where they are going takes a clean BITE out of that side
 *  and leaves the model reading as a wedge for the next hundred frames —
 *  which is not what a sixth of a population leaving looks like. At seven
 *  steps the pick is a soft gradient over the whole side that faces the
 *  destination: the model THINS toward it, keeps its shape, and the dim seat
 *  rings left behind are scattered through the crowd rather than punched out
 *  of it. */
const RAGGED = STEP_X * 7;
/** Each group is matched to its blob so the thirty-two paths fan rather than
 *  cross — the external group by y, the internal one by x. */
const matched = (from: number[], slots: MiniSeat[], byX: boolean) => {
  const f = [...from].sort((a, b) => (byX ? SEATS[a].x - SEATS[b].x : SEATS[a].y - SEATS[b].y));
  const t = slots.map((_, i) => i).sort((a, b) => (byX ? slots[a].x - slots[b].x : slots[a].y - slots[b].y));
  return f.map((seat, i) => ({ seat, slot: t[i] }));
};
export type Deployment = { c: { x: number; y: number }; seats: MiniSeat[]; from: number[]; pairs: { seat: number; slot: number }[] };
const deployment = (c: { x: number; y: number }, off: MiniSeat[], salt: number, byX: boolean, taken: Set<number>): Deployment => {
  const seats = seatsAt(off, c);
  const from = pickSeats(
    MINI_N,
    (i) => Math.hypot(SEATS[i].x - c.x, SEATS[i].y - c.y) + (hash(i, salt) - 0.5) * RAGGED,
    taken,
  );
  return { c, seats, from, pairs: matched(from, seats, byX) };
};
/** The deepest a departure's arc may bow, as a fraction of its own length: the
 *  internal deployment is now a third of the distance away that it was outside
 *  the box, and a fixed 34-64 px bow on a 150 px flight is not an arc, it is a
 *  loop. */
export const BOW_FRAC = 0.22;
const bowFor = (a: { x: number; y: number }, b: { x: number; y: number }, want: number) =>
  Math.sign(want) * Math.min(Math.abs(want), BOW_FRAC * Math.hypot(b.x - a.x, b.y - a.y));
export const EXT_BOW = (j: number) => -(36 + hash(j, 51) * 40);
export const INT_BOW = (j: number) => -(34 + hash(j, 52) * 30);
/** How close any dot of a group's arcs comes to a station's ring. */
const arcClear = (d: Deployment, bow: (j: number) => number, sc: number, st: { x: number; y: number }) => {
  let m = Infinity;
  d.pairs.forEach((p, j) => {
    const a = SEATS[p.seat];
    const b = d.seats[p.slot];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const L = Math.hypot(vx, vy) || 1;
    const h = bowFor(a, b, bow(j)) * sc;
    for (let e = 0; e <= 1; e += 0.02) {
      const w = Math.sin(Math.PI * e) * h;
      const x = a.x + vx * e + (-vy / L) * w;
      const y = a.y + vy * e + (vx / L) * w;
      m = Math.min(m, Math.hypot(x - st.x, y - st.y) - STATION_R - DOT_MAX);
    }
  });
  return m;
};

export const EXT_R = LOOP_R + 150; // the ring's line, and 150 past it
export const EXT_STATION_CLEAR = 70; // to the evaluation ring and to its person
export const EXT_RING_CLEAR = 60; // to the ring's own line
/** The evaluation station, and the person standing over it — the two things
 *  the external deployment has to stay off on its way out. */
const EVAL_ST = onLoop(EVAL_DEG);
const EVAL_PERSON = PEOPLE.reduce((a, b) => (Math.abs(b.x - EVAL_ST.x) < Math.abs(a.x - EVAL_ST.x) ? b : a));
const extClear = (c: { x: number; y: number }) => {
  let st = Infinity;
  let pe = Infinity;
  for (const o of EXT_OFF) {
    const x = c.x + o.x;
    const y = c.y + o.y;
    st = Math.min(st, Math.hypot(x - EVAL_ST.x, y - EVAL_ST.y) - STATION_R - DOT_MAX);
    const nx = Math.max(EVAL_PERSON.x - PERSON_SIZE / 2, Math.min(EVAL_PERSON.x + PERSON_SIZE / 2, x));
    const ny = Math.max(EVAL_PERSON.y - PERSON_SIZE / 2, Math.min(EVAL_PERSON.y + PERSON_SIZE / 2, y));
    pe = Math.min(pe, Math.hypot(x - nx, y - ny) - DOT_MAX);
  }
  return { st, pe };
};
/** THE RAY, AND THE BOW, ARE SOLVED TOGETHER. 2 o'clock is -30 degrees, and
 *  the ray walks down off it until the deployment is clear of the station it is
 *  reaching for and of the person over it — but a deployment's ray also decides
 *  what its thirty-two flights FLY THROUGH, and on cut 3's geometry the
 *  evaluation station sits on exactly the shoulder those arcs go over. At 2
 *  o'clock the tallest of them went through its ring. So the walk carries a
 *  second test: the arcs, at no less than BOW_MIN of their own hashed bow —
 *  below that they are not arcs any more — must clear that ring by
 *  FLIGHT_CLEAR as well. It comes out at 4 degrees with the bow at 0.60: the
 *  deployment sits just under the model's own line, out past the ring, with the
 *  station it is going to take up and to its left, and the group lifts over the
 *  line UNDER that station rather than through it. */
export const FLIGHT_CLEAR = 20;
export const BOW_MIN = 0.6;
export const EXT_PLACE = (() => {
  for (let deg = -30; deg <= 25; deg += 0.5) {
    const c = onLoop(deg, EXT_R);
    const { st, pe } = extClear(c);
    if (st < EXT_STATION_CLEAR || pe < EXT_STATION_CLEAR) continue;
    if (ringGap(c, EXT_OFF, -1) < EXT_RING_CLEAR) continue;
    const d = deployment(c, EXT_OFF, 41, false, new Set<number>());
    if (arcClear(d, EXT_BOW, BOW_MIN, EVAL_ST) < FLIGHT_CLEAR) continue;
    let sc = BOW_MIN;
    for (let t = 1; t > BOW_MIN; t -= 0.02) {
      if (arcClear(d, EXT_BOW, t, EVAL_ST) >= FLIGHT_CLEAR) {
        sc = t;
        break;
      }
    }
    return { deg, dep: d, bow: sc };
  }
  throw new Error("RogueDeployment: no ray outside the ring clears the evaluation station");
})();
export const EXT_DEG = EXT_PLACE.deg;
export const EXT_BOW_SCALE = EXT_PLACE.bow;
export const EXT_C = EXT_PLACE.dep.c;
/** station ring, person glyph, the ring's line, and the arcs. */
export const EXT_CLEAR = [
  extClear(EXT_C).st,
  extClear(EXT_C).pe,
  ringGap(EXT_C, EXT_OFF, -1),
  arcClear(EXT_PLACE.dep, EXT_BOW, EXT_BOW_SCALE, EVAL_ST),
];

export const INT_DEG = 120; // 7 o'clock
export const INT_MODEL_CLEAR = 50; // to the model, at rest
export const INT_RING_CLEAR = 40; // to the ring's line, at rest
/** The distance that centres it in the gap: the R with the most room to spare
 *  on whichever of the two clearances is tighter. */
export const INT_R = (() => {
  let best = 0;
  let score = -Infinity;
  for (let R = 140; R <= 340; R += 1) {
    const c = onLoop(INT_DEG, R);
    const s = Math.min(popGap(c, INT_OFF, POP[0]) - INT_MODEL_CLEAR, ringGap(c, INT_OFF, 1) - INT_RING_CLEAR);
    if (s > score) {
      score = s;
      best = R;
    }
  }
  if (score < 0) throw new Error(`RogueDeployment: the gap inside the ring is ${score.toFixed(1)} short`);
  return best;
})();
/** How far round the push may carry it. The deployment is in the LOWER LEFT —
 *  that is where the line puts it and where its thread comes from — so the
 *  shove may round the model as far as 6 o'clock and no further; past that it
 *  would be crossing to the other side of the crowd it is hiding behind. */
export const INT_DEG_MIN = 95;
/** Where the push ends: the place in that band with the most room left when
 *  the model has taken all five of its rings. Coarse, then refined — every
 *  candidate is measured against five hundred dots. */
export const INT_END = (() => {
  const at = (deg: number, R: number) => {
    const c = onLoop(deg, R);
    return Math.min(popGap(c, INT_OFF, POP[RING_COUNT]), ringGap(c, INT_OFF, 1));
  };
  let bd = INT_DEG;
  let bR = INT_R;
  let bs = -Infinity;
  for (let deg = INT_DEG_MIN; deg <= INT_DEG; deg += 5) {
    for (let R = INT_R; R <= 340; R += 8) {
      const s = at(deg, R);
      if (s > bs) {
        bs = s;
        bd = deg;
        bR = R;
      }
    }
  }
  for (let deg = Math.max(INT_DEG_MIN, bd - 5); deg <= bd + 5; deg += 1) {
    for (let R = bR - 8; R <= bR + 8; R += 2) {
      const s = at(deg, R);
      if (s > bs) {
        bs = s;
        bd = deg;
        bR = R;
      }
    }
  }
  return { deg: bd, r: bR, clear: bs };
})();
/** The blob's centre before the growth starts, and after each of the five
 *  rings: one even sweep along the inside of the ring, a fifth of it a ring. */
export const INT_PATH = Array.from({ length: RING_COUNT + 1 }, (_, g) => {
  const u = g / RING_COUNT;
  return onLoop(INT_DEG + (INT_END.deg - INT_DEG) * u, INT_R + (INT_END.r - INT_R) * u);
});
export const INT_C = INT_PATH[0];
/** What the push actually holds, ring by ring: [to the model, to the line]. */
export const INT_CLEAR = INT_PATH.map((c, g) => [popGap(c, INT_OFF, POP[g]), ringGap(c, INT_OFF, 1)]);
// INT_CLEAR is the SETTLED state — every seat of every ring landed, every dot
// at the top of its hashed radius — and its last entry, 14 / 15, is a state the
// cut never reaches: the fifth ring is still flying in on the last frame. What
// the frames actually hold is measured over every frame of the growth, dot by
// dot, in CRUSH_MIN below; the assertion that matters is there.
if (INT_CLEAR[0][0] < INT_MODEL_CLEAR || INT_CLEAR[0][1] < INT_RING_CLEAR) {
  throw new Error(`RogueDeployment: the internal deployment does not fit at rest`);
}

export const EXT_SEATS = EXT_PLACE.dep.seats;
export const EXT_FROM = EXT_PLACE.dep.from;
export const EXT_PAIRS = EXT_PLACE.dep.pairs;
/** The internal group leaves for where the deployment LANDS, not for where the
 *  growth later shoves it, and it may not take a seat the external one took. */
const INT_DEP = deployment(INT_C, INT_OFF, 42, true, new Set(EXT_FROM));
export const INT_SEATS = INT_DEP.seats;
export const INT_FROM = INT_DEP.from;
export const INT_PAIRS = INT_DEP.pairs;
/** the internal group flies away from its own station, so nothing scales it */
export const INT_BOW_SCALE = 1;
export const ARC_CLEAR = [
  arcClear(EXT_PLACE.dep, EXT_BOW, EXT_BOW_SCALE, EVAL_ST),
  arcClear(INT_DEP, INT_BOW, INT_BOW_SCALE, onLoop(TRAIN_DEG)),
];

/** How far the push has carried the internal deployment by `f`, and the frames
 *  a dot may lag behind the shove — a crowd that is pushed does not move as
 *  one piece. The steps are the growth's own arrivals: the ring lands, and it
 *  takes the deployment with it over the same RING_SPAN its own seats fly in
 *  over. */
export const INT_LAG = 2.5;
export const intDrift = (f: number, lag: number, grow: number[]) => {
  let dx = 0;
  let dy = 0;
  for (let g = 0; g < grow.length && g < RING_COUNT; g++) {
    const u = smooth((f - (grow[g] + lag)) / RING_SPAN);
    dx += (INT_PATH[g + 1].x - INT_PATH[g].x) * u;
    dy += (INT_PATH[g + 1].y - INT_PATH[g].y) * u;
  }
  return { dx, dy };
};


// ---------------------------------------------------------------------------
// THE CAMERA. Four moves, one track, and NOT ONE FRAMING IS TYPED: every zoom
// and every cx is solved from what has to be in the frame at that moment, off
// cut 3's own geometry.
//   OPEN  is cut 3's OWN RESOLVED FRAMING, imported rather than re-solved:
//         TOT_K_WIDE on CONTENT_CENTRE at CENTRE_X. With the box gone there is
//         nothing in this piece at f0 that was not in cut 3's last frame, so
//         the cut opens on the frame the piece before it ended on, exactly.
//   M1    the model's own left edge and the external deployment's right edge
//         both in frame with EXT_MARGIN to spare — and since the open already
//         holds both of them, the widening that costs is zero and M1 is a PAN,
//         and only a pan. The ring's line falls between them, with open field
//         either side of it.
//   M2    the RING's left edge and the external blob's right edge both in
//         frame with SIDE_MARGIN to spare — the widest the piece has been, and
//         the internal deployment is inside the ring so it comes for free
//   M3    the MODEL across the frame with CREEP_MARGIN either side — floored
//         at the zoom that just fits the whole loop — and the model's centre
//         at screen y BLOB_SCREEN_Y. Untouched by the box going.
//   M4    the same span as M2 with a wider margin, because the model is half
//         as big again by then, on cut 3's own content centre
// On cut 3 as it stands those come out k 1.050 / 1.050 / 0.999 / 1.221 /
// 1.007. Every one of them is TIGHTER than the box allowed — the wide is 1.01
// where the box forced it out to 0.85 — because a box has to be framed with
// its corners, and a ring does not.
// ---------------------------------------------------------------------------
/** The content centre that puts world y `wy` at screen y `sy` at zoom `k`. */
export const centreFor = (wy: number, sy: number, k: number) =>
  wy + (FRAME_H / 2 - sy) / k - CAM_LIFT / k;
/** The camera x that puts world x `wx` at screen x `sx` at zoom `k`. */
export const camXFor = (wx: number, sx: number, k: number) => wx - (sx - FRAME_W / 2) / k;

export const EXT_MARGIN = 90; // M1: screen px outside the model and the deployment
export const SIDE_MARGIN = 62; // M2: screen px outside the widest thing in frame
export const WIDE_MARGIN = 58; // M4: the same, after the model has grown
export const CREEP_MARGIN = 260; // M3: world px outside the MODEL at the creep
export const BLOB_SCREEN_Y = 800; // M3: where the model's centre lands

/** The rightmost ink in the piece: the external deployment's outer dot. */
export const EXT_RIGHT = Math.max(...EXT_SEATS.map((s) => s.x)) + DOT_RADIUS * 1.25;
/** The model's own left edge before it grows — what M1 may not pan off. */
export const MODEL_LEFT = BLOB_C.x - S_ALL[0] * BLOB_AX - DOT_RADIUS * 1.25;
/** The leftmost ink in the piece at any frame: the ring's own line. */
export const RING_LEFT = LOOP_C.x - LOOP_R - STROKE / 2;

// The open IS cut 3's resolved framing. Nothing is in this piece at f0 that was
// not in cut 3's last frame, so there is nothing to re-solve: the zoom, the
// content centre and the cx are that piece's own, imported.
export const K_OPEN = TOT_K_WIDE;
// M1 may widen to hold both ends of the gesture — but the open is already wide
// enough to hold them, so it does not: a widening here would be a zoom nobody
// asked for, and the move is a pan.
export const K_EXT = Math.min(K_OPEN, (FRAME_W - 2 * EXT_MARGIN) / (EXT_RIGHT - MODEL_LEFT));
export const K_BOTH = (FRAME_W - 2 * SIDE_MARGIN) / (EXT_RIGHT - RING_LEFT);
// The creep closes on the MODEL — the thing that is about to change — not on
// the loop, so the crowd is big enough to watch a ring land on. It is floored
// at the zoom that just fits the loop across the frame, so the mechanism the
// model is inside never gets cut in half.
export const K_CREEP = Math.min(
  FRAME_W / (2 * (S_ALL[0] * BLOB_AX + CREEP_MARGIN)),
  FRAME_W / (2 * LOOP_R),
);
export const K_WIDE = (FRAME_W - 2 * WIDE_MARGIN) / (EXT_RIGHT - RING_LEFT);

export const CX_EXT = (EXT_RIGHT + MODEL_LEFT) / 2;
export const CX_BOTH = (EXT_RIGHT + RING_LEFT) / 2;
export const CX_WIDE = CX_BOTH;

// Cut 3's own content centre — the middle of the block that runs from the
// people's heads to the loop's floor — carries every framing in this piece
// except the creep, which has its own. It is the line the whole set is built
// on, so the world simply carries on.
export const C_BOTH = CONTENT_CENTRE;
export const C_OPEN = C_BOTH;
export const C_EXT = (BLOB_C.y + EXT_C.y) / 2; // both ends of the gesture, centred
export const C_CREEP = centreFor(BLOB_C.y, BLOB_SCREEN_Y, K_CREEP);
export const C_WIDE = C_BOTH;

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
  // M1 "rogue external deployment" — follow the group out over the line
  { f0: 24, f1: 43, k0: K_OPEN, k1: K_EXT, c0: C_OPEN, c1: C_EXT, x0: CENTRE_X, x1: CX_EXT, warp: 0.72 },
  // M2 "or rogue internal deployment" — back and wider, the ring and both
  // deployments in frame
  { f0: 57, f1: 82, k0: K_EXT, k1: K_BOTH, c0: C_EXT, c1: C_BOTH, x0: CX_EXT, x1: CX_BOTH, warp: 0.72 },
  // M3 "manipulating the process" — THE CREEP onto the model, one even ease
  { f0: 92, f1: 130, k0: K_BOTH, k1: K_CREEP, c0: C_BOTH, c1: C_CREEP, x0: CX_BOTH, x1: CENTRE_X, warp: 1 },
  // M4 "of recursive self-improvement" — release, and follow the growth out
  { f0: 149, f1: 184, k0: K_CREEP, k1: K_WIDE, c0: C_CREEP, c1: C_WIDE, x0: CENTRE_X, x1: CX_WIDE, warp: 0.72 },
];

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
    if (n === 0) {
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

/** The damped camera at every integer frame, run once — the same loop and the
 *  same constants as the shared `runCamera`, with cx on it too. The flights
 *  need it: a world speed is only legible as a SCREEN speed, so every flight's
 *  duration is solved against the k it is actually flown under. */
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
// A FLIGHT. A dot crossing the world under its own power: a short ease in, a
// long run at one speed, and one decelerating lobe onto the landing, so the
// peak is only 1.21x the average rather than the 2x an ease-out would give.
// Every flight also bows: it travels its own shallow arc, hashed per dot, so a
// group never moves in unison.
//
// SPEED_CAP is the only thing that sets a flight's duration. A dot moving more
// than 45 screen px in a frame strobes at 24fps, so each flight's nominal
// duration is LENGTHENED — never its speed raised — until its peak screen
// speed under the camera's own damped k comes in under the cap.
// ---------------------------------------------------------------------------
// It governs the dot flights AND the circuit: a bead is a dot crossing open
// field, and the drive on the circuit is held under it by `speedAt` rather
// than being refused by the solve. 44 was checked on a 12fps burst of the
// loop's lower arc at the tail, where the beads run at it for fifty frames:
// they still read as objects moving, not as a dotted line.
export const SPEED_CAP = 44;
const FLIGHT_IN = 0.1;
const FLIGHT_OUT = 0.3;
const FLIGHT_N = 64;
const FLIGHT_V = (u: number) =>
  smooth(u / FLIGHT_IN) * (1 - smooth((u - (1 - FLIGHT_OUT)) / FLIGHT_OUT));
const FLIGHT_TABLE = (() => {
  const a = new Float64Array(FLIGHT_N + 1);
  for (let i = 1; i <= FLIGHT_N; i++) a[i] = a[i - 1] + FLIGHT_V((i - 0.5) / FLIGHT_N);
  const tot = a[FLIGHT_N];
  for (let i = 0; i <= FLIGHT_N; i++) a[i] /= tot;
  return a;
})();
export const FLIGHT_VMAX = (() => {
  let m = 0;
  for (let i = 0; i <= FLIGHT_N; i++) m = Math.max(m, FLIGHT_V(i / FLIGHT_N));
  return m;
})();
/** The peak of the profile as a multiple of its own average: 1.25, against
 *  the 2.0 an ease-out would give for the same travel in the same time. */
export const FLIGHT_PEAK = (() => {
  let tot = 0;
  for (let i = 1; i <= FLIGHT_N; i++) tot += FLIGHT_V((i - 0.5) / FLIGHT_N);
  return FLIGHT_VMAX / (tot / FLIGHT_N);
})();
const flightEase = (u: number) => {
  const x = clamp01(u) * FLIGHT_N;
  const i = Math.min(FLIGHT_N - 1, Math.floor(x));
  return FLIGHT_TABLE[i] + (FLIGHT_TABLE[i + 1] - FLIGHT_TABLE[i]) * (x - i);
};

export type Flight = {
  t0: number;
  dur: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  bow: number;
};
/** The arc's length, to a good enough approximation for a shallow bow. */
const bowLen = (L: number, h: number) => L * (1 + (8 / 3) * Math.pow(h / Math.max(1, L), 2));
/** The fastest this dot ever moves ON SCREEN, frame by frame: its speed
 *  profile at that instant times the camera's own damped k at that instant.
 *  Taking the profile's peak against the window's highest k instead would
 *  refuse a flight that leaves while the camera is still tight and does all
 *  its moving after the camera has opened out — which is most of them. */
const peakScreen = (t0: number, dur: number, L: number) => {
  let m = 0;
  for (let f = Math.max(0, Math.ceil(t0)); f <= Math.min(DURATION, Math.floor(t0 + dur)); f++) {
    const u = (f - t0) / dur;
    m = Math.max(m, ((FLIGHT_V(u) * FLIGHT_PEAK) / FLIGHT_VMAX) * (L / dur) * CAM_AT.k[f]);
  }
  return m;
};
const makeFlight = (
  t0: number,
  nominal: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
  bow: number,
): Flight => {
  const L = bowLen(Math.hypot(b.x - a.x, b.y - a.y), bow);
  let dur = nominal;
  while (dur < 80 && peakScreen(t0, dur, L) > SPEED_CAP) dur += 1;
  return { t0, dur, ax: a.x, ay: a.y, bx: b.x, by: b.y, bow };
};
const flightAt = (fl: Flight, f: number) => {
  const e = flightEase((f - fl.t0) / fl.dur);
  const vx = fl.bx - fl.ax;
  const vy = fl.by - fl.ay;
  const L = Math.hypot(vx, vy) || 1;
  const bow = Math.sin(Math.PI * e) * fl.bow;
  return { x: fl.ax + vx * e + (-vy / L) * bow, y: fl.ay + vy * e + (vx / L) * bow };
};

// ---------------------------------------------------------------------------
// THE DEPARTURES. Each group is matched to its mini blob so the twelve paths
// fan rather than cross — the external group by y, the internal one by x — and
// each dot takes its own hashed bow. The external arcs bow UP, over the loop's
// right shoulder and OVER THE RING'S LINE; the internal ones bow DOWN and out,
// into the gap between the model and that same line, and never reach it.
//
// V2: a bow is now capped at BOW_FRAC of its own flight. The internal
// deployment used to be a long way outside the loop and its arcs were long;
// inside the ring the same dots have a third of the distance to cover, and a
// fixed 34-64 px bow on a 150 px flight is not an arc, it is a loop. Capping
// it keeps the SHAPE of the delivered arcs at every length.
// ---------------------------------------------------------------------------
export const EXT_T0 = 27; // "rogue"
export const EXT_WINDOW = 5; // frames the whole group takes to leave
export const EXT_LAND = 50; // and the frame the last one is home, inside "deployment"
export const INT_T0 = 59; // "rogue" (the second one)
export const INT_WINDOW = 8;
export const INT_LAND = 80;
export const EXT_STAGGER = EXT_WINDOW / Math.max(1, MINI_N - 1);
export const INT_STAGGER = INT_WINDOW / Math.max(1, MINI_N - 1);
export const EXT_DUR = EXT_LAND - (EXT_T0 + EXT_WINDOW);
export const INT_DUR = INT_LAND - (INT_T0 + INT_WINDOW);

// ---------------------------------------------------------------------------
// THE CIRCUIT, CONTINUED AND THEN DRIVEN.
//
// Cut 3 launches a bead out of the model every BEAD_STEP frames from BEAD_F0
// and alternates the arc it takes round the loop. This piece continues exactly
// that schedule on the same clock — a bead's launch frame is cut 3's minus
// TOT_DURATION — so the state at f0 IS cut 3's state at its last frame and
// nothing pops. The first bead that is cut 4's own is the next one in the same
// series.
//
// From TEMPO_F0 the process is being DRIVEN and two things ramp together over
// ten frames: the launch interval halves (BEAD_STEP -> STEP_FAST, so the tempo
// on the loop doubles) and the beads themselves run SPEED_MUL faster. Both are
// needed and neither alone is right — halving the interval on its own leaves
// the beads crawling, and speeding them up on its own SPREADS them out and the
// loop reads as emptier, not busier. Together the loop carries the same five
// to seven beads, all of them moving half again as fast.
//
// SPEED_MUL is not typed, it is SEARCHED, and it is the growth that sets it:
// the five rings have to come off five REAL arrivals, and the value that lands
// those arrivals closest to the brief's five frames is what the scan returns —
// 2.0 on cut 3's geometry as it stands, putting them on f142, f154, f167, f176
// and f183. (`speedAt` then holds it under the strobe cap on screen whatever it
// comes out at, so the search never has to refuse a value for being too fast.)
//
// The whole circuit is simulated frame by frame rather than solved, because it
// feeds back: the model grows, so the training spoke's foot climbs toward the
// station, so the next bead has less spoke to fall down and arrives sooner.
// That is the recursion, and it is in the timing as well as in the picture.
// ---------------------------------------------------------------------------
export const TEMPO_F0 = 122;
export const TEMPO_F1 = 132;
export const STEP_FAST = BEAD_STEP / 2;
export const GROWTH_F0 = 142; // "of", the frame the growth may first trigger
export const RING_SPAN = 12; // frames a ring's seats take to leave the foot
/** Where the brief wants the five turns to land — the frames the growth is
 *  choreographed to. SPEED_MUL is SOLVED against them below, so the growth
 *  stays on the words if cut 3's geometry is re-cut under it. */
export const GROW_TARGET = [146, 156, 165, 174, 183];
/** The shortest gap between two turns that still reads as two turns. */
export const GROW_GAP = 7;
/** Early enough that every bead cut 3 ever launched is simulated, so the state
 *  at f0 IS its state at its last frame. */
export const SIM_F0 = BEAD_F0 - TOT_DURATION;

const tempo = (f: number) => smooth((f - TEMPO_F0) / (TEMPO_F1 - TEMPO_F0));
const stepAt = (f: number) => BEAD_STEP - (BEAD_STEP - STEP_FAST) * tempo(f);

export type BeadDraw = { key: string; x: number; y: number; r: number };
type SimBead = { key: string; lower: boolean; seg: number; r: number; arc: number; t: number; launch: number };

/** A bead's world speed, HELD UNDER THE STROBE CAP ON SCREEN. The circuit is
 *  driven harder from TEMPO_F0, but the camera is also creeping in over the
 *  same frames, and a world speed is only legible as a screen speed — so the
 *  drive is capped by SPEED_CAP / k at every frame. The beads give a little
 *  back while the lens is tight and take it again as it opens, which reads as
 *  the camera rather than as the process changing its mind, and it is what
 *  lets the drive be as hard as the growth needs. */
const runSim = (mul: number, record: boolean) => {
  const speedAt = (f: number) =>
    Math.min(
      BEAD_SPEED * (1 + (mul - 1) * tempo(f)),
      SPEED_CAP / CAM_AT.k[Math.max(0, Math.min(DURATION, Math.round(f)))],
    );
  const draw: BeadDraw[][] = [];
  if (record) for (let i = 0; i <= DURATION; i++) draw.push([]);
  const grow: number[] = [];
  const allArrivals: number[] = [];
  const footT = new Float64Array(DURATION + 1);
  const footE = new Float64Array(DURATION + 1);
  const scale = new Float64Array(DURATION + 1);
  const sAt = (f: number, S: number[]) => {
    let v = S[0];
    for (let g = 0; g < grow.length; g++) v = S[g] + (S[g + 1] - S[g]) * smooth((f - grow[g]) / RING_SPAN);
    return v;
  };
  // cut 3's series, continued on cut 3's own clock
  let next = SIM_F0;
  let n = 0;
  const live: SimBead[] = [];
  for (let f = SIM_F0; f <= DURATION; f++) {
    const v = speedAt(f);
    const ft = sAt(f, S_TRAIN) * TRAIN_EDGE;
    const fe = sAt(f, S_EVAL) * EVAL_EDGE;
    while (next <= f) {
      live.push({ key: `b${n}`, lower: n % 2 === 1, seg: 0, r: fe, arc: 0, t: 0, launch: next });
      next += stepAt(next);
      n += 1;
    }
    for (let i = live.length - 1; i >= 0; i--) {
      const b = live[i];
      // Every boundary CARRIES its overshoot into the next segment, in frames
      // or in world px as the next segment wants it. Snapping each transition
      // to the frame it is noticed on instead loses up to a frame of travel at
      // each of the four joins, which reads as a bead hesitating at each
      // station and puts it as much as five frames behind cut 3's own clock.
      if (b.seg === 0) {
        b.r += v;
        if (b.r >= LOOP_R) {
          b.seg = 1;
          b.t = (b.r - LOOP_R) / v;
        }
      } else if (b.seg === 1) {
        b.t += 1;
        if (b.t >= STATION_PAUSE) {
          b.seg = 2;
          b.arc = (b.t - STATION_PAUSE) * v;
        }
      } else if (b.seg === 2) {
        b.arc += v;
        const total = arcLen(b.lower ? ARC_LOWER : ARC_UPPER);
        if (b.arc >= total) {
          b.seg = 3;
          b.t = (b.arc - total) / v;
        }
      } else if (b.seg === 3) {
        b.t += 1;
        if (b.t >= STATION_PAUSE) {
          b.seg = 4;
          b.r = LOOP_R - (b.t - STATION_PAUSE) * v;
        }
      } else {
        b.r -= v;
        if (b.r <= ft) {
          allArrivals.push(f);
          // ONE RING PER TURN. A ring lands on a real arrival; any further
          // arrival inside the same turn (GROW_GAP frames) joins that ring
          // rather than starting another, because two rings on top of each
          // other read as one event instead of as a process.
          if (
            f >= GROWTH_F0 &&
            grow.length < RING_SIZE.length &&
            (grow.length === 0 || f - grow[grow.length - 1] >= GROW_GAP)
          ) {
            grow.push(f);
          }
          live.splice(i, 1);
          continue;
        }
      }
    }
    if (f < 0) continue;
    footT[f] = ft;
    footE[f] = fe;
    scale[f] = sAt(f, S_ALL);
    if (!record) continue;
    live.forEach((b) => {
      let p: { x: number; y: number };
      if (b.seg === 0) p = onLoop(EVAL_DEG, b.r);
      else if (b.seg === 1) p = onLoop(EVAL_DEG);
      else if (b.seg === 2) {
        const total = arcLen(b.lower ? ARC_LOWER : ARC_UPPER);
        const deg = EVAL_DEG + (b.lower ? ARC_LOWER : ARC_UPPER) * (b.arc / total);
        p = onLoop(deg);
      } else if (b.seg === 3) p = onLoop(TRAIN_DEG);
      else p = onLoop(TRAIN_DEG, b.r);
      draw[f].push({ key: b.key, x: p.x, y: p.y, r: BEAD_R * clamp01((f - b.launch) / 2) });
    });
  }
  return { draw, grow, allArrivals, footT, footE, scale };
};

/** SOLVE the multiplier. The five rings have to come off five REAL arrivals on
 *  the brief's five frames, and the only free number in the circuit is how
 *  much faster the model drives it once it has both stations — so that number
 *  is searched rather than typed. Landing LATE is scored twice, because a
 *  gesture may anticipate its word and may not follow it; and anything that
 *  would put a bead over the strobe cap on screen is rejected outright. */
export const GROW_SCAN: { mul: number; score: number; grow: number[] }[] = [];
export const SPEED_MUL = (() => {
  let best = 1.2;
  let bestScore = Infinity;
  for (let mul = 1.05; mul <= 3.2; mul += 0.01) {
    const g = runSim(mul, false).grow;
    if (g.length < GROW_TARGET.length) continue;
    let score = 0;
    g.forEach((f, i) => {
      score += Math.abs(f - GROW_TARGET[i]) + Math.max(0, f - GROW_TARGET[i]);
    });
    GROW_SCAN.push({ mul, score, grow: g });
    if (score < bestScore) {
      bestScore = score;
      best = mul;
    }
  }
  return best;
})();
export const SIM = runSim(SPEED_MUL, true);
export const GROW_F = SIM.grow;

// ---------------------------------------------------------------------------
// THE MODEL, GROWING. Every dot in the piece is one entry here: the model's
// own seats (some of which leave), the twenty-four that land in the two mini
// blobs, the twenty-four that fly back in to refill the seats they vacated,
// and the hundred and twenty of the five new rings.
//
// A ring's seats leave the training spoke's FOOT — the point the bead went in
// at — one after another over RING_SPAN frames, each on its own short arc, and
// they arrive DEEP and ripen over TONE_DUR. The first growth carries the
// refills with it, so the dim rings the two deployments left behind fill back
// up on the model's first turn.
// ---------------------------------------------------------------------------
export type Dot = {
  x: number; // where it rests
  y: number;
  r: number; // hashed radius factor
  rs: number; // cut 3's own feather scale, where it has one
  t: number; // superellipse scale, for the feather on a growing edge
  flight: number; // index into FLIGHTS, or -1
  born: number; // the frame it first exists
  ripe0: number; // the frame its deep -> ripe ramp starts
  seed: number;
  group: number; // 0 the model, 1 the external deployment, 2 the internal one
};

export const FLIGHTS: Flight[] = [];
export const DOTS: Dot[] = [];
/** For a seat that left: the flight that emptied it, and the one that fills it
 *  back up. Both are needed to draw the dim ring for exactly the right span. */
export const EMPTY_FROM = new Float64Array(NSEAT).fill(Infinity);
export const EMPTY_TO = new Float64Array(NSEAT).fill(Infinity);

(() => {
  const leaving = new Map<number, number>(); // seat -> flight index
  const group = new Map<number, number>(); // seat -> which blob it ends up in
  const mk = (
    t0: number,
    dur: number,
    a: { x: number; y: number },
    b: { x: number; y: number },
    bow: number,
  ) => {
    FLIGHTS.push(makeFlight(t0, dur, a, b, bow));
    return FLIGHTS.length - 1;
  };

  // the two deployments
  EXT_PAIRS.forEach((p, j) => {
    const a = SEATS[p.seat];
    const b = EXT_SEATS[p.slot];
    const fi = mk(EXT_T0 + j * EXT_STAGGER, EXT_DUR, a, b, bowFor(a, b, EXT_BOW(j)) * EXT_BOW_SCALE);
    leaving.set(p.seat, fi);
    group.set(p.seat, 1);
  });
  INT_PAIRS.forEach((p, j) => {
    const a = SEATS[p.seat];
    const b = INT_SEATS[p.slot];
    const fi = mk(INT_T0 + j * INT_STAGGER, INT_DUR, a, b, bowFor(a, b, INT_BOW(j)) * INT_BOW_SCALE);
    leaving.set(p.seat, fi);
    group.set(p.seat, 2);
  });

  // the model's own seats: the ones that stay rest where they are, the ones
  // that go rest in the mini blob they fly to
  SEATS.forEach((s, i) => {
    const fi = leaving.get(i);
    const rest = fi === undefined ? { x: s.x, y: s.y } : { x: FLIGHTS[fi].bx, y: FLIGHTS[fi].by };
    DOTS.push({
      x: rest.x,
      y: rest.y,
      r: s.r,
      rs: s.rs,
      t: tOf(s.x - BLOB_C.x, s.y - BLOB_C.y),
      flight: fi === undefined ? -1 : fi,
      born: -1,
      ripe0: -1e9, // cut 3 leaves the whole model ripe
      seed: i,
      group: group.get(i) ?? 0,
    });
    if (fi !== undefined) EMPTY_FROM[i] = FLIGHTS[fi].t0;
  });

  // the growth: each ring off its own arrival, and the refills with the first
  const refills = [...leaving.keys()];
  GROW_F.forEach((gf, g) => {
    const foot = onLoop(TRAIN_DEG, SIM.footT[Math.min(DURATION, Math.round(gf))]);
    const span = RING_SPAN;
    const born: { x: number; y: number; r: number; t: number; seat: number }[] = RINGS[g].map((s) => ({
      ...s,
      seat: -1,
    }));
    if (g === 0) {
      refills.forEach((i) =>
        born.push({ x: SEATS[i].x, y: SEATS[i].y, r: SEATS[i].r, t: tOf(SEATS[i].x - BLOB_C.x, SEATS[i].y - BLOB_C.y), seat: i }),
      );
    }
    // nearest first, so the ring fills outward from the point of contact
    born.sort(
      (a, b) =>
        Math.hypot(a.x - foot.x, a.y - foot.y) - Math.hypot(b.x - foot.x, b.y - foot.y),
    );
    born.forEach((s, j) => {
      const t0 = gf + (span * j) / Math.max(1, born.length - 1);
      const seed = 7000 + g * 97 + j;
      const fi = mk(t0, 9 + Math.round(hash(seed, 61) * 4), foot, s, (hash(seed, 62) - 0.5) * 64);
      const land = FLIGHTS[fi].t0 + FLIGHTS[fi].dur;
      DOTS.push({
        x: s.x,
        y: s.y,
        r: s.r,
        rs: 1,
        t: s.t,
        flight: fi,
        born: FLIGHTS[fi].t0,
        ripe0: land,
        seed,
        group: 0,
      });
      if (s.seat >= 0) EMPTY_TO[s.seat] = land;
    });
  });
})();
export const NDOT = DOTS.length;

/** WHAT THE FRAMES ACTUALLY HOLD. The push is solved on outlines and on the
 *  settled state; this measures the drawn picture — every frame from the first
 *  ring to the last, every seat that has landed by that frame, dot edge to dot
 *  edge — and it is the number that has to be right, because it is the only
 *  one anybody sees. [to the model, to the ring's line]. */
export const CRUSH_MIN: [number, number] = (() => {
  let m = Infinity;
  let r = Infinity;
  for (let f = GROW_F[0] - 2; f <= DURATION; f++) {
    const int: { x: number; y: number; r: number }[] = [];
    const model: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < NDOT; i++) {
      const d = DOTS[i];
      if (f < d.born) continue;
      const fl = d.flight < 0 ? null : FLIGHTS[d.flight];
      if (fl && f < fl.t0 + fl.dur) continue; // still in the air
      const rr = DOT_RADIUS * d.r;
      if (d.group === 2) {
        const dr = intDrift(f, hash(d.seed, 27) * INT_LAG, GROW_F);
        int.push({ x: d.x + dr.dx, y: d.y + dr.dy, r: rr });
      } else if (d.group === 0) {
        model.push({ x: d.x, y: d.y, r: rr });
      }
    }
    for (const a of int) {
      for (const b of model) m = Math.min(m, Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r);
      r = Math.min(r, LOOP_R - Math.hypot(a.x - LOOP_C.x, a.y - LOOP_C.y) - a.r - STROKE / 2);
    }
  }
  return [m, r];
})();
if (CRUSH_MIN[0] < 30 || CRUSH_MIN[1] < 18) {
  throw new Error(
    `RogueDeployment: the growth crushes the internal deployment to ${CRUSH_MIN.map((v) => v.toFixed(1)).join(" / ")}`,
  );
}

/** Neighbours for the idle traffic on the grown model: every dot's nearest few
 *  within 2.2 lattice steps, so a thread can find one without a search. */
export const NEIGHBOURS: number[][] = DOTS.map((a, i) => {
  const out: { j: number; d: number }[] = [];
  DOTS.forEach((b, j) => {
    if (j === i || b.group !== a.group) return;
    const d = Math.hypot((a.x - b.x) / STEP_X, (a.y - b.y) / STEP_Y);
    if (d < 2.4) out.push({ j, d });
  });
  out.sort((p, q) => p.d - q.d);
  return out.slice(0, 6).map((p) => p.j);
});
/** The model at its biggest carries this many idle threads; the count in a
 *  frame rides the population that is actually standing in it. */
export const IDLE_MAX = idleThreads(NDOT - 2 * MINI_N);
/** Each deployment is a live population too, so each carries its own traffic
 *  from the frame its last dot lands — two threads for twelve, at the same
 *  rate per head as the model. Without it a mini blob is a dead patch sitting
 *  in frame for eighty frames. */
export const MINI_DOTS = [1, 2].map((g) => DOTS.map((d, i) => ({ d, i })).filter((p) => p.d.group === g).map((p) => p.i));
export const MINI_THREADS = Math.max(1, idleThreads(MINI_N));
export const MINI_LIVE = [1, 2].map((g) =>
  Math.max(...DOTS.filter((d) => d.group === g).map((d) => FLIGHTS[d.flight].t0 + FLIGHTS[d.flight].dur)),
);

// ---------------------------------------------------------------------------
// G4 and G5, the one continuous gesture this piece is built around: a thread
// out of each deployment, INTO the model, and then on THROUGH it and up a
// spoke to a station. It is drawn as one head-led polyline with two corners,
// so "aiding them" and "manipulating the process" are one motion rather than
// two events.
// ---------------------------------------------------------------------------
const nearestOf = (pts: { x: number; y: number }[], p: { x: number; y: number }) => {
  let best = 0;
  let bd = Infinity;
  pts.forEach((s, i) => {
    const d = Math.hypot(s.x - p.x, s.y - p.y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
};
export const AID_F0 = 86; // "aiding"
export const EXT_AID_F1 = 98; // "them"
export const INT_AID_F1 = 98;
export const TAKE_F0 = 104; // "and"
export const INT_TAKE_F1 = 118; // inside "manipulating"
export const EXT_TAKE_F1 = 120; // inside "the"

export type Reach = {
  pts: { x: number; y: number }[];
  legs: number[];
  total: number;
  f0: number;
  f1: number;
  f2: number;
  station: number;
  seat: number;
};
/** The seats still standing in the model when the reaches land — the two
 *  deployments have taken twenty-four of them by f85, and a thread that
 *  reached an empty seat would land on nothing. */
const STAYING = SEATS.map((s, i) => ({ x: s.x, y: s.y, i })).filter(
  (s) => EXT_FROM.indexOf(s.i) === -1 && INT_FROM.indexOf(s.i) === -1,
);
const makeReach = (
  mini: MiniSeat[],
  deg: number,
  foot: { x: number; y: number },
  station: number,
  aidF1: number,
  takeF1: number,
): Reach => {
  const from = mini[nearestOf(mini, BLOB_C)];
  // THE SEAT IS THE ONE AT THE SPOKE'S FOOT, not the one nearest the
  // deployment. Landing on the near edge of the model and then setting off for
  // the spoke put a stub across the body — a dog-leg inside the crowd, which
  // reads as the thread losing its way rather than as one reach. Coming in to
  // the foot itself makes G5 a straight continuation of the same line: in from
  // the deployment, on up the spoke, one motion with one corner in it.
  const seat = STAYING[nearestOf(STAYING, foot)].i;
  const pts = [
    { x: from.x, y: from.y },
    { x: SEATS[seat].x, y: SEATS[seat].y },
    onLoop(deg, SPOKE_R0),
  ];
  const legs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  return {
    pts,
    legs,
    total: legs.reduce((a, b) => a + b, 0),
    f0: AID_F0,
    f1: aidF1,
    f2: takeF1,
    station,
    seat,
  };
};
export const REACHES: Reach[] = [
  makeReach(INT_SEATS, TRAIN_DEG, TRAIN_FOOT, 0, INT_AID_F1, INT_TAKE_F1),
  makeReach(EXT_SEATS, EVAL_DEG, EVAL_FOOT, 1, EXT_AID_F1, EXT_TAKE_F1),
];
/** How far along a reach its head has got at `f`, in world px. Leg 0 is the
 *  aid (f0 -> f1), everything after it is the take (TAKE_F0 -> f2), and the
 *  pause between them is the beat on "them". */
export const reachAt = (r: Reach, f: number) => {
  const a = clamp01((f - r.f0) / (r.f1 - r.f0)) * r.legs[0];
  const rest = r.legs.slice(1).reduce((s, v) => s + v, 0);
  const b = clamp01((f - TAKE_F0) / (r.f2 - TAKE_F0)) * rest;
  return a + b;
};
const polyPoint = (r: Reach, s: number) => {
  let left = s;
  for (let i = 0; i < r.legs.length; i++) {
    if (left <= r.legs[i] || i === r.legs.length - 1) {
      const u = r.legs[i] <= 0 ? 0 : clamp01(left / r.legs[i]);
      return {
        x: r.pts[i].x + (r.pts[i + 1].x - r.pts[i].x) * u,
        y: r.pts[i].y + (r.pts[i + 1].y - r.pts[i].y) * u,
        leg: i,
      };
    }
    left -= r.legs[i];
  }
  return { ...r.pts[r.pts.length - 1], leg: r.legs.length - 1 };
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, every thread, every converted line
  accentDeep: z.string(), // deep: a new, unread dot
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
    could: z.number(), // "could they"      — the circuit, running
    set: z.number(), // "set"
    up: z.number(), // "up"
    a: z.number(), // "a"
    rogue: z.number(), // "rogue"           — twelve leave for outside
    external: z.number(), // "external"
    deployment: z.number(), // "deployment" — they are outside the ring
    or: z.number(), // "or"
    rogueTwo: z.number(), // "rogue"        — and a second lot for the gap inside it
    internal: z.number(), // "internal"
    deploymentTwo: z.number(), // "deployment"
    which: z.number(), // "which"
    is: z.number(), // "is"
    aiding: z.number(), // "aiding"         — both threads reach back in
    them: z.number(), // "them"             — both heads home
    and: z.number(), // "and"               — the threads extend up the spokes
    manipulating: z.number(), // "manipulating" — the training station is taken
    the: z.number(), // "the"               — the evaluation station is taken
    process: z.number(), // "process"       — the circuit is running fast
    of: z.number(), // "of"                 — the growth may trigger
    recursive: z.number(), // "recursive"   — the first ring
    self: z.number(), // "self"
    improvement: z.number(), // "improvement"
    end: z.number(), // speech ends; tail to 190
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
    could: 0,
    set: 7,
    up: 22,
    a: 25,
    rogue: 27,
    external: 33,
    deployment: 40,
    or: 52,
    rogueTwo: 59,
    internal: 64,
    deploymentTwo: 70,
    which: 85,
    is: 87,
    aiding: 89,
    them: 97,
    and: 104,
    manipulating: 109,
    the: 120,
    process: 131,
    of: 142,
    recursive: 146,
    self: 155,
    improvement: 158,
    end: 174,
  },
});

const RogueDeployment: React.FC<Props> = ({
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
  const fi = Math.max(0, Math.min(DURATION, frame));

  // -- camera ---------------------------------------------------------------
  const cam = camAt(frame);
  const k = cam.k;
  const drift = sway(frame);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- where every dot is, and how ripe --------------------------------------
  // The feather rides the model's CURRENT outer scale, so a ring that was the
  // edge last turn fills out to full size as the next one lands outside it.
  const scale = SIM.scale[fi];
  const flying: { key: number; x: number; y: number; r: number; tn: number }[] = [];
  const POS: { x: number; y: number }[] = new Array(NDOT);
  const SHOW = new Uint8Array(NDOT);
  const TONE = new Float32Array(NDOT);
  DOTS.forEach((d, i) => {
    if (frame < d.born) {
      SHOW[i] = 0;
      POS[i] = { x: d.x, y: d.y };
      return;
    }
    const fl = d.flight < 0 ? null : FLIGHTS[d.flight];
    let p: { x: number; y: number };
    let inAir = false;
    if (!fl || frame >= fl.t0 + fl.dur) p = { x: d.x, y: d.y };
    else if (frame <= fl.t0) p = { x: fl.ax, y: fl.ay };
    else {
      p = flightAt(fl, frame);
      inAir = true;
    }
    // the internal deployment is SHOVED by the growth: every ring that lands
    // carries it a fifth of the way along INT_PATH, each dot a hashed couple of
    // frames behind the shove so the clump gives rather than slides as a piece
    if (d.group === 2) {
      const dr = intDrift(frame, hash(d.seed, 27) * INT_LAG, GROW_F);
      p = { x: p.x + dr.dx, y: p.y + dr.dy };
    }
    POS[i] = p;
    SHOW[i] = 1;
    TONE[i] = smooth((frame - d.ripe0) / TONE_DUR);
    if (inAir) flying.push({ key: i, x: p.x, y: p.y, r: 0, tn: TONE[i] });
  });
  const dotR = (i: number) => {
    const d = DOTS[i];
    const dyn = d.t < 0 ? 1 : 0.7 + 0.3 * feather((scale - d.t) / T_STEP, BLOB_FEATHER);
    const rs = Math.max(d.rs, dyn);
    return dotRadius * d.r * rs * breath(frame, hash(d.seed, 9));
  };

  // -- the two reaches, and the +0.1 they put on what they touch -------------
  const lit = new Float32Array(NDOT);
  const rootShove = intDrift(frame, INT_LAG / 2, GROW_F);
  const reachEls = REACHES.map((r) => {
    if (frame < r.f0) return null;
    const s = reachAt(r, frame);
    const head = polyPoint(r, s);
    // the internal thread's root is a seat in the deployment, so it goes where
    // the deployment goes; the rest of the polyline is where it was drawn
    const root = r.station === 0 ? { x: r.pts[0].x + rootShove.dx, y: r.pts[0].y + rootShove.dy } : r.pts[0];
    const pts: { x: number; y: number }[] = [root];
    for (let i = 1; i <= head.leg; i++) pts.push(r.pts[i]);
    pts.push({ x: head.x, y: head.y });
    // the +0.1 lands when the head does, not when it sets out
    if (s >= r.legs[0] - 0.01) lit[r.seat] = 1;
    return { pts, head, done: s >= r.total - 0.01 };
  });

  // -- the model's idle traffic ---------------------------------------------
  // Cut 3's own loop, on cut 3's clock (frame + TOT_DURATION), for the first
  // BLOB_IDLE_THREADS: at f0 it is running exactly what cut 3 left running. The
  // extra threads above that number come in with the population as the model
  // grows, so a blob that is 2.6x the size is not 2.6x quieter.
  const tFrame = frame + TOT_DURATION;
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: boolean };
  const threads: Th[] = [];
  const grp = (i: number) => {
    const d = DOTS[i];
    return d.flight >= 0 && d.group > 0 && frame >= FLIGHTS[d.flight].t0 ? d.group : 0;
  };
  let pop = 0;
  for (let i = 0; i < NDOT; i++) if (SHOW[i] && grp(i) === 0) pop += 1;
  const nThreads = Math.min(IDLE_MAX, Math.max(idleThreadCount, idleThreads(pop)));
  const reach = 2;
  for (let j = 0; j < nThreads; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = tFrame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    let a: number;
    let b: number;
    if (j < idleThreadCount) {
      // cut 3's exact pick: a seat of the original model and a lattice neighbour
      a = Math.floor(hash(seed, 6) * NSEAT);
      const sa = SEATS[a];
      const bc = Math.max(0, Math.min(F_COLS - 1, sa.c + Math.round((hash(seed, 7) - 0.5) * 2 * reach)));
      const br = Math.max(0, Math.min(F_ROWS - 1, sa.row + Math.round((hash(seed, 8) - 0.5) * 2 * reach)));
      b = SEAT_AT[br * F_COLS + bc];
    } else {
      a = Math.floor(hash(seed, 6) * NDOT);
      const ns = NEIGHBOURS[a];
      if (!ns || ns.length === 0) continue;
      b = ns[Math.floor(hash(seed, 7) * ns.length)];
    }
    if (b < 0 || b === a) continue;
    if (!SHOW[a] || !SHOW[b]) continue;
    // a dot belongs to the MODEL until the frame it actually leaves it, so at
    // f0 this loop is exactly cut 3's loop over cut 3's crowd
    if (grp(a) !== grp(b)) continue;
    if (j < idleThreadCount && grp(a) !== 0) continue;
    if (DOTS[a].flight >= 0 && frame < FLIGHTS[DOTS[a].flight].t0 + FLIGHTS[DOTS[a].flight].dur) continue;
    if (DOTS[b].flight >= 0 && frame < FLIGHTS[DOTS[b].flight].t0 + FLIGHTS[DOTS[b].flight].dur) continue;
    const dn = ease(phase / 0.3, EASE_ARRIVE);
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    const pa = POS[a];
    const pb = POS[b];
    threads.push({
      key: `i${j}`,
      x1: pa.x,
      y1: pa.y,
      x2: pa.x + (pb.x - pa.x) * dn,
      y2: pa.y + (pb.y - pa.y) * dn,
      op: 0.4 * fade,
      head: dn < 1,
    });
  }
  // and the same traffic inside each deployment, once it has landed
  MINI_DOTS.forEach((pool, g) => {
    if (frame < MINI_LIVE[g]) return;
    for (let j = 0; j < MINI_THREADS; j++) {
      const seedBase = 800 + g * 41 + j;
      const period = 44 - 12 * hash(seedBase, 4);
      const local = frame + hash(seedBase, 5) * period;
      const cycle = Math.floor(local / period);
      const phase = (local - cycle * period) / period;
      const seed = seedBase * 131 + cycle * 7;
      const a = pool[Math.floor(hash(seed, 6) * pool.length)];
      const ns = NEIGHBOURS[a];
      if (!ns || ns.length === 0) continue;
      const b = ns[Math.floor(hash(seed, 7) * ns.length)];
      if (b === a) continue;
      const dn = ease(phase / 0.3, EASE_ARRIVE);
      const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
      if (fade <= 0.02) continue;
      lit[a] = Math.max(lit[a], fade);
      lit[b] = Math.max(lit[b], dn * fade);
      const pa = POS[a];
      const pb = POS[b];
      threads.push({
        key: `m${g}-${j}`,
        x1: pa.x,
        y1: pa.y,
        x2: pa.x + (pb.x - pa.x) * dn,
        y2: pa.y + (pb.y - pa.y) * dn,
        op: 0.4 * fade,
        head: dn < 1,
      });
    }
  });

  // -- the spokes, shortening as the model swallows them ---------------------
  const spokes = [
    { deg: TRAIN_DEG, r1: SIM.footT[fi] },
    { deg: EVAL_DEG, r1: SIM.footE[fi] },
  ].map((s) => ({ a: onLoop(s.deg, SPOKE_R0), b: onLoop(s.deg, s.r1) }));

  const beads = SIM.draw[fi];

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
            {/* the people's lines: dead since cut 3 took their stations */}
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
                  opacity={OP_DARK}
                />
              ))}
            </g>

            {/* the seats the two deployments left behind, until they refill */}
            {SEATS.map((s, i) =>
              frame >= EMPTY_FROM[i] && frame < EMPTY_TO[i] ? (
                <circle
                  key={`e${i}`}
                  cx={s.x}
                  cy={s.y}
                  r={dotRadius * s.r * s.rs}
                  fill="none"
                  stroke={ink}
                  strokeWidth={SEAT_RING_STROKE}
                  opacity={
                    OP_DARK *
                    clamp01((frame - EMPTY_FROM[i]) / 4) *
                    clamp01((EMPTY_TO[i] - frame) / 3)
                  }
                />
              ) : null,
            )}

            {/* the model, the two deployments, and everything the model has
                grown — everything that is sitting still */}
            {DOTS.map((d, i) => {
              if (!SHOW[i]) return null;
              if (d.flight >= 0 && frame > FLIGHTS[d.flight].t0 && frame < FLIGHTS[d.flight].t0 + FLIGHTS[d.flight].dur) {
                return null; // drawn on top, below
              }
              const l = clamp01(TONE[i] + 0.1 * lit[i]);
              const p = POS[i];
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={dotR(i) * (1 + 0.35 * l)}
                  fill={tone(l)}
                  opacity={dotUnread}
                />
              );
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

            {/* THE LOOP, orange since cut 3 */}
            <g style={{ filter: icon }}>
              <circle
                cx={LOOP_C.x}
                cy={LOOP_C.y}
                r={LOOP_R}
                fill="none"
                stroke={accent}
                strokeWidth={STROKE + 0.6}
                strokeLinecap="round"
                opacity={OP_READ}
              />
            </g>

            {/* THE SPOKES, and cut 3's two grips lying along them */}
            <g style={{ filter: icon }}>
              {spokes.map((sp, i) => (
                <line
                  key={i}
                  x1={sp.a.x}
                  y1={sp.a.y}
                  x2={sp.b.x}
                  y2={sp.b.y}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
              ))}
              {[
                { seat: NEAREST_TRAIN, deg: TRAIN_DEG },
                { seat: NEAREST_EVAL, deg: EVAL_DEG },
              ].map((g, i) => {
                const a = POS[g.seat];
                const b = onLoop(g.deg, SPOKE_R0);
                return (
                  <line
                    key={`g${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={accent}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={0.95}
                  />
                );
              })}
            </g>

            {/* THE STATIONS, orange since cut 3, each clicking as the new
                thread takes hold of it. V2: they are cut 3's own stations,
                drawn through its `StationGlyph`, so the training cap and the
                evaluation clipboard are in the rings here too — fully drawn,
                because this piece opens on the state that one resolved to. */}
            {STATIONS.map((st, i) => (
              <StationGlyph
                key={st.key}
                x={st.x}
                y={st.y}
                glyph={st.glyph}
                colour={highlightTone(frame, REACHES[i].f2, accent)}
                opacity={1}
                ringDraw={1}
                iconDraw={1}
                shadow={icon}
              />
            ))}

            {/* G4 + G5: the two reaches, head-led, and they stay */}
            <g>
              {reachEls.map((r, i) =>
                r ? (
                  <g key={`r${i}`}>
                    <polyline
                      points={r.pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")}
                      fill="none"
                      stroke={accent}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.95}
                    />
                    {r.done ? null : <circle cx={r.head.x} cy={r.head.y} r={4} fill={ink} />}
                  </g>
                ) : null,
              )}
            </g>

            {/* THE CIRCUIT */}
            <g style={{ filter: icon }}>
              {beads.map((b) => (
                <circle key={b.key} cx={b.x} cy={b.y} r={b.r} fill={accent} />
              ))}
            </g>

            {/* everything in the air, over the loop and over the wall */}
            {flying.map((d) => {
              const l = clamp01(d.tn);
              return (
                <circle
                  key={`f${d.key}`}
                  cx={d.x}
                  cy={d.y}
                  r={dotR(d.key) * (1 + 0.35 * l)}
                  fill={tone(l)}
                  opacity={dotUnread}
                />
              );
            })}
          </svg>

          {/* the two people, white, holding nothing */}
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

export default RogueDeployment;
