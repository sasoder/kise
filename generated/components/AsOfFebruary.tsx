import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
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
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  wobble,
  worldTransform,
  WOBBLE_R,
} from "./fieldShared";
import { EASE_ARRIVE, Trail, softFront } from "./levelUp";
import { CLAUDE } from "./brandGlyphs";

export const FPS = 24;

// ---------------------------------------------------------------------------
// CUT 1 of the Dwarkesh clip `Ajeya_Six_Months_Behind`. Ajeya Cotra:
//
//   "the best available model as of this recording finished training and was
//    being used internally as of February."
//
// (The sentence after it, which this cut does NOT cover but which its resolved
// frame has to set up: "So Fable was being used internally at Anthropic as of
// February. We are six months behind the frontier already." — so the last
// thing the frame may say is SIX EMPTY MONTHS between the model and now.)
//
// SRT span 0:01.320 -> 0:06.679. round(5.359 * 24) = round(128.6) = 129 speech
// frames, plus the house 16-frame tail so the resolved state holds = 145.
//
// WORD ONSETS, frames from f0 (the table the whole piece is cut to):
//   f0   the          f64  and
//   f3   best         f73  was
//   f10  available    f77  being
//   f17  model        f84  used
//   f24  as           f92  internally
//   f31  of           f102 as
//   f33  this         f112 of
//   f35  recording    f114 february
//   f44  finished     f129 speech ends
//   f55  training     f145 last frame, held
//
// ---------------------------------------------------------------------------
// THE PICTURE. One motion: a model ASSEMBLES, its training COMPLETES, it is
// ENCLOSED with the people using it, and then the whole thing is PUSHED BACK
// IN TIME along a timeline, leaving six empty months between it and "now".
//
// THE WORLD (y down; world units = screen px at k 1):
//   THE MODEL    the Claude mark (inline `brandGlyphs.CLAUDE`, white, 108 world
//                px on the shared 24-unit em box, `iconShadow`) at (690, -120)
//                standing over a FLEET BLOB of 76 seats centred (690, 76) —
//                `RogueInstancesInterfere`'s superellipse (n 2.4) inscribed in
//                a 9 x 11 lattice at the field's own step, wobbled and
//                feathered, so the fleet is a rounded blob and never a box.
//                The two of them are one column, 333 world px tall.
//   THE COMPANY  an ink squircle 700 x 440 centred (540, 0) — x 190..890,
//                y -220..220. The mark and the blob stand in its right half,
//                the three people down its left.
//   THE PEOPLE   three `person.png` glyphs, white, 110 world px, on a shallow
//                DESCENDING DIAGONAL — (280, feet 35), (390, 105), (505, 178),
//                each nudged by its own hash — so that every thread out of them
//                passes clear above the heads of the ones to its right.
//   THE TIMELINE an ink rule at y 380.5 (snapped, odd stroke) running far past
//                both frame edges; THE PLAYHEAD = "now" is the vertical ink
//                line at x 540 hanging 240 from the rule down to y 620 with a
//                solid r 8 dot where it meets it; six month TICKS, 30 tall,
//                every 120 world px to the LEFT of the playhead (420, 300, 180,
//                60, -60, -180).
//
// ---------------------------------------------------------------------------
// THE GESTURES. Every one of them is one word, and there is nothing else in
// the piece.
//
//   G1 ASSEMBLE   — "the best available model"        f-6..20
//        76 seats converge on the blob from beyond the frame's edges, each on
//        its OWN shallow hashed arc, with ONE speed (20 world px/frame) for all
//        of them, so a longer arc simply takes longer and the stagger is
//        carried by the launch frames. Landings are hashed across f13-20 and a
//        launch is the difference — which for the longest arcs is up to six
//        frames before f0, off-frame and invisible. Each fades up over its first
//        three tenths and lands on EASE_ARRIVE, DEEP tone; `Trail` smears any
//        head fast enough to need it (the worst measures 80 screen px/frame,
//        at f2, decaying to nothing by the seat). The last seat is home at f20,
//        one frame before "model" is spent. The mark is already there. No box,
//        no timeline, no people yet.
//   G2 NOW        — "as of this recording"            f24..42
//        The now-dot opens at x 540 on the rule's line (f24-27), the TIMELINE
//        draws head-led out of it BOTH ways past the frame edges (f24-36, to
//        +-610), and the PLAYHEAD draws head-led DOWN from the dot to y 620
//        (f30-40) and clicks ink-bright on f40. Between f36 and f48 the rule
//        goes on out to +-1700 — off-frame at every k this piece reaches — so
//        nothing new ever draws at the left during the slide.
//   G3 FINISHED   — "finished training"               f44..58
//        The blob goes DEEP -> RIPE as ONE wave out of its own centre, the
//        front softened over three seat-rings (`softFront`) and solved so the
//        OUTERMOST seat is fully ripe exactly on "training" at f55 — the front
//        has to cross the farthest seat's distance PLUS the width of its own
//        soft edge. The mark clicks ink-bright at f56.
//   G4 INSIDE     — "and was being used internally"   f64..92
//        The BOX draws head-led from the bottom-centre BOTH ways, f64-84,
//        closing at the top-centre with a click on "used" f84. The THREE PEOPLE
//        descend into it through that still-open top seam on individual arcs —
//        one speed again (32 world px/frame), launches f64, f68, f69, landings
//        f76, f80, f83 — each fading up over its first third. Every one of them
//        is inside before the wall that would have been in its way exists: the
//        last of the three crosses the top run at f70.6, when the two heads are
//        still 28 px up the side walls.
//        As each lands an ACCENT THREAD draws head-led from its chest to a seat
//        AT ITS OWN HEIGHT in the blob, at one speed (24 world px/frame). The
//        three are 316, 236 and 206 px long and land at f89.2, f89.8 and f91.6
//        — staggered, the last of them on "internally" f92 — and they STAY.
//        From f92 ACCENT PACKETS run person -> blob and back along all three,
//        three or four alive at a time, for the rest of the piece: that is
//        "being used".
//   G5 BACK TO FEBRUARY — "as of February"            f102..126
//        THE SLIDE. The whole assembly — box, people, blob, mark, threads,
//        packets — travels 720 world px LEFT along the timeline (six ticks) on
//        one trapezoid-velocity profile, f102-126: smoothstep ramps over the
//        first and last 22% and a long even middle. Peak speed is 1.28x the
//        average instead of the 3x an in-out cubic gives, and — the reason it
//        is built this way — the six ticks it passes come up EVENLY. Under
//        EASE_MOVE four of the six landed inside five frames.
//        The playhead does not move. Each tick draws head-led over 3 frames as
//        the box's centre reaches it, two frames of anticipation: f105.8,
//        f108.9, f112.0, f115.1, f118.2, f124.0 — read back out of the slide's
//        own table by inversion, never off a parallel timer.
//   RESOLVED      — f126..145
//        The box at February with its three people using the lit model, six
//        ticks of empty month between it and the playhead at "now". Packets
//        keep running, the crowd keeps breathing, the camera is still opening
//        out under the tail. The gap is the hook for the next sentence and
//        nothing is put into it.
//
// ---------------------------------------------------------------------------
// THE CAMERA. THREE moves, an opening hold and a held breath, all through ONE
// damped track (`camMove` keys per frame; `runCamera` for cy and k, and a second
// pass of the same damper over the cx track, so a pan can never lead or lag the
// zoom it belongs to). It is MONOTONE: every move opens out and travels left, so
// the whole cut is one continuous widening and the lens never doubles back on
// itself. Every number below is MEASURED through the damper, not read off the
// key windows.
//
//   M0 HOLD      k 1.70  cx 690  content y -7                    f0-20
//        Tight on the blob region: the mark's top lands at screen y 552 and the
//        blob's bottom at 1130, so the assembly happens dead centre under the
//        caption band and the dots arrive from outside all four edges.
//   M1 OUT+LEFT  k 1.70 -> 1.15, cx 690 -> 620, c -7 -> 223
//        keys f21-31, warp 0.72, landed f42     — "as of this recording" f24-42
//        Opens to take in the rule and the playhead. Peak 3.9% of zoom and 7.0
//        world px of pan a frame — a move, not a drift. At the landing the
//        mark's top is at screen y 379 and the playhead's foot at 1293, the
//        block centred on 836.
//   M2 OUT+LEFT  k 1.15 -> 0.88, cx 620 -> 520, c 223 -> 180
//        keys f52-84, warp 0.72, landed f92  — "used" f84, "internally" f92
//        ONE move where there were two. It was a pull-back over the box's draw
//        (keys f52-62) and then a creep onto the sealed box (keys f73-85), and
//        between their two landings the damped zoom came down to 0.4%/frame,
//        held that for three frames and set off again — same direction, same
//        kind of move, so the pair read as one move that hesitated in the
//        middle rather than as two beats. Merged, the damper sees a single
//        deceleration lobe: 1.15%/frame at its peak (f68, the middle of the box
//        drawing itself), never a second acceleration, and by f88 it is inside
//        0.15%/frame with the box shut and the threads still landing. It takes
//        the whole construction of the box in one breath, opens the empty
//        timeline to the LEFT of the box into frame, and settles on the sealed
//        box as the three threads land on "internally".
//   M3 THE HELD BREATH                                            f92-101
//        TEN FRAMES DEAD STILL, and they are not a gap in the track but the
//        thing the slide is released out of: measured across them the zoom
//        moves 0.05% in total, the pan 0.16 world px in total, and the box's
//        centre sits at screen y 659.0 +- 0.1. Nothing in the frame is still —
//        the packets run, the crowd breathes — but the LENS is, so when the
//        slide goes on f102 it is the only thing that moves.
//   M4 FOLLOW    k 0.88 -> 0.78, cx 520 -> 43, c 180
//        keys f102-130, warp 0.6                          — "february" f114
//        Released on the slide's own first frame and follows it out and left.
//        Its cx does NOT ride an ease of its own: it rides the SLIDE's profile,
//        read CAM_LEAD frames ahead of itself (see `xSlide`). Its keys run past
//        the end of the slide on purpose, so the frame is still opening at f134
//        and only settles at f140 — the last thing the piece does is a move,
//        not a park.
//        SOLVED at the resolved zoom and checked at every frame of the slide:
//        the box (now x -530..170) keeps 93 screen px of margin on the left and
//        the playhead 152 px of frame to its right, and the box never comes
//        closer than 67 px to the left edge on its way there.
//
// THE FRAME'S BALANCE. Every content centre above is the MIDPOINT OF THE BLOCK
// THAT IS ACTUALLY ON SCREEN, and `CAM_LIFT / k` puts that midpoint on screen y
// 835 at every k — measured, the block's centre is 834-841 at every beat of the
// piece. At the resolved wide (k 0.780) the block runs screen y 507..1163: the
// box's centre at 679, the rule at 976, the playhead's foot at 1163, and 317 px
// of clear frame under it before the captions. The lowest ink the piece ever
// puts on screen is the now-dot at 1461 on the single frame it opens, f24, with
// the camera still at k 1.66 and pulling back; from f30 on nothing is below
// 1305 (the playhead's foot at f37, the deepest the settled frame ever goes).
// Nothing is ever inside the bottom 440 px.
//
// ambient, not gestures: idle thread traffic inside the blob from f20 at the
// shared rate (180 per 1,200 agents = 11 threads), `breath` on every dot,
// `sway` on the camera, the grid's own drift and parallax.
// ---------------------------------------------------------------------------

export const DURATION = 145;

export const WORLD_W = FRAME_W;
export const WORLD_H = 1400;

export const STROKE = 3; // the one stroke weight in this piece
export const CENTRE_X = 540;

// ---------------------------------------------------------------------------
// THE WORLD'S SCALE IS SOLVED BACKWARDS FROM THE RESOLVED FRAME, and that is
// the one thing in this piece that could not be taken off the brief as written.
//
// The resolved frame has to hold the slid box's left edge and the playhead at
// once, with the margins the brief names (60 screen px on the left, 120 on the
// right). That fixes the zoom:  1080/k >= (540 - boxLeft) + 180/k.  With the
// brief's 150 px month and its 700 px box that is 1,250 world px and k <= 0.72
// — and 0.72 is a ceiling, not a value, because at the ceiling the legal camera
// is a single point and a damped camera cannot sit on a point. Built at the
// brief's numbers and measured, the resolved frame came out at k 0.62: the box
// 434 screen px wide, the dots 3.4 px across, and 71% of a 1080 x 1920 frame
// empty. On a phone at 270 px wide that is a 108 px box.
//
// Three numbers move, and nothing else does:
//   * THE MONTH is 120 world px, not 150, so six of them are 720 and the frame
//     has to hold 1,070 rather than 1,250. k lands at 0.78 and the box at 546
//     screen px — half the frame's width instead of two fifths.
//   * THE BOX is 460 tall, not 520. Its right-hand column (mark, gap, blob) is
//     303 px and its left-hand one (the people) is 118; 520 left sixty px of
//     dead air inside it that no gesture ever used.
//   * THE TIMELINE HANGS LOWER — 160 below the box instead of 80 — because the
//     9:16 frame is 1,920 px tall and the composition was only using 29% of it.
//     THE PLAYHEAD DROPS 240, not the brief's 300 and not the 480 this piece
//     first shipped with: see PLAY_Y1. The content block is 880 world px and at
//     the resolved zoom it runs screen y 507..1163, centred on 835, with 317 px
//     of clear frame between its foot and the caption band.
// Everything else — the box's width, the blob, the mark, the people, the six
// ticks, the 900-to-720 slide being exactly six months — is the brief's.
// ---------------------------------------------------------------------------

// -- the company -------------------------------------------------------------
export const BOX_W = 700;
export const BOX_H = 440;
export const BOX_CY = 0;
export const BOX_X0 = CENTRE_X - BOX_W / 2; // 190
export const BOX_X1 = CENTRE_X + BOX_W / 2; // 890
export const BOX_Y0 = BOX_CY - BOX_H / 2; // -260
export const BOX_Y1 = BOX_CY + BOX_H / 2; // 260
export const BOX_PATH = squirclePath(BOX_W, BOX_H);

// -- the model ---------------------------------------------------------------
// The right-hand column of the box: the mark over the fleet it stands for,
// 59 world px apart, the pair spanning y -174..159, and the box's height is
// that column plus 46 of margin at the top and 61 at the bottom — nothing else
// decides it.
export const BLOB = { x: 690, y: 76 };
export const MARK = { x: 690, y: -120 };
export const MARK_SIZE = 108;

// -- the people --------------------------------------------------------------
// person.png is a 512 box whose glyph runs to y 471, so the feet sit at 0.920
// of the drawn height — that is what puts them ON the floor and not through it.
// 110 rather than the house 118: person.png's ink fills 0.844 of its box, so a
// 118 glyph is 100 world px of shoulder and three of them will not stand apart
// inside a 350 px half-box without touching. At 110 the ink is 93 and the three
// of them keep 19 px of air between them.
export const PERSON_SIZE = 110;
export const PERSON_FOOT = 471 / 512;
// NOT A ROW. Three people standing level in a line to the left of the blob
// cannot each have a thread into it: the leftmost one's thread has to cross the
// other two, and drawn behind a 0.9-opacity glyph it shows through the body as
// a scratch. Rendered and looked at, that is exactly what it did.
//
// So they stand on a shallow DESCENDING DIAGONAL instead — 110 world px apart
// across and 70 down, each nudged by its own hash so the diagonal is not ruled
// either. Every thread then leaves its own person at a different height and
// passes clear ABOVE the heads of the ones to its right (the tightest of the
// three clears by 17 world px, checked against the glyph's real ink box, which
// is 0.844 of the drawn size). It also puts people down the whole left side of
// the box instead of in a strip along its floor, which is what that half of the
// box is for.
export const PEOPLE_X = [0, 1, 2].map((i) => 280 + i * 110 + (hash(i, 42) - 0.5) * 14);
export const PEOPLE_FOOT_Y = [0, 1, 2].map((i) => 40 + i * 70 + (hash(i, 41) - 0.5) * 16);

// -- the timeline ------------------------------------------------------------
// Snapped to Math.round(y) + 0.5 against the odd stroke, or an ink rule
// antialiases anywhere between 4% and 13% and the whole field shimmers.
export const TL_Y = Math.round(BOX_Y1 + 160) + 0.5; // 380.5
export const PLAY_X = CENTRE_X;
// THE PLAYHEAD DROPS 240, NOT 480. At 480 the "now" line was the tallest thing
// in the piece: it hung 480 world px under a 440 px box, so the content block
// was 1,120 world px of which more than two fifths was one empty vertical line,
// and centring that block on screen y 835 pushed the box — the thing the cut is
// actually about — up to screen y 590 with the line's foot sitting on the lip of
// the caption band. At 240 the block is 880, the box centre comes back down to
// 695 and the rule to 991, and the playhead still reads as a line that hangs
// rather than a tick, because it is eight times the tick's own 30.
export const PLAY_Y1 = TL_Y + 240 - 0.5; // 620
export const PLAY_DOT_R = 8;
export const TICK_STEP = 120;
export const TICK_N = 6;
export const TICK_H = 30;
export const TICKS = Array.from({ length: TICK_N }, (_, i) => PLAY_X - TICK_STEP * (i + 1));
export const SLIDE_DX = -TICK_STEP * TICK_N; // -900: six months to the left

// ---------------------------------------------------------------------------
// THE FLEET BLOB. `RogueInstancesInterfere`'s construction, unchanged: the
// 10 x 9 lattice at the field's own step is only where a seat may STAND; the
// fleet's outline is a superellipse inscribed in that box, undulated by
// `wobble` along its perimeter and feathered across its outer 1.5 steps, so
// density falls off toward the edge and the dots that survive out there are
// smaller. 90 cells laid out, 75 alive.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29;
// 9 x 11, not `RogueInstancesInterfere`'s 10 x 9. The field's step is 24.1 x
// 15.2, so a 10 x 9 lattice is 241 x 137 world px — nearly twice as wide as it
// is tall — and the superellipse cut through it reads as a crescent rather than
// as a body of instances standing under a mark. That is fine for that piece,
// where two small fleets sit side by side; here the blob is the hero of the
// first twenty frames and it has to read as one rounded thing. 9 x 11 is
// 217 x 167, the roundest lattice at this step that still holds ~75 seats.
const F_COLS = 9;
const F_ROWS = 11;
const SE_N = 2.4;
const BLOB_AX = ((F_COLS - 1) / 2 + 0.5) * STEP_X;
const BLOB_AY = ((F_ROWS - 1) / 2 + 0.5) * STEP_Y;
const BLOB_FEATHER = 1.5;
const BLOB_SEED = 2.208;

const blobInside = (dx: number, dy: number) => {
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) return 99;
  const g = Math.pow(Math.abs(dx) / BLOB_AX, SE_N) + Math.pow(Math.abs(dy) / BLOB_AY, SE_N);
  const t = Math.pow(g, 1 / SE_N); // 1 exactly on the boundary
  const stepAlong = L / Math.hypot(dx / STEP_X, dy / STEP_Y);
  return (L / t - L) / stepAlong + wobble(Math.atan2(dy, dx) * WOBBLE_R, BLOB_SEED) + BLOB_FEATHER / 2;
};

export type Seat = { x: number; y: number; r: number; rs: number; gc: number; gr: number; d: number };
export const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let gr = 0; gr < F_ROWS; gr++) {
    for (let gc = 0; gc < F_COLS; gc++) {
      const i = gr * F_COLS + gc;
      const x = BLOB.x + (gc - (F_COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = BLOB.y + (gr - (F_ROWS - 1) / 2) * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      const ins = blobInside(x - BLOB.x, y - BLOB.y);
      const fe = feather(ins, BLOB_FEATHER);
      if (hash(i, 71) >= fe) continue;
      out.push({
        x,
        y,
        r: 0.75 + 0.5 * hash(i, 13),
        rs: 0.7 + 0.3 * fe,
        gc,
        gr,
        d: Math.hypot(x - BLOB.x, y - BLOB.y),
      });
    }
  }
  return out;
})();
export const NSEAT = SEATS.length;
const SEAT_AT = new Int32Array(F_ROWS * F_COLS).fill(-1);
SEATS.forEach((s, i) => {
  SEAT_AT[s.gr * F_COLS + s.gc] = i;
});

// ---------------------------------------------------------------------------
// G5 THE SLIDE. A trapezoid velocity profile with smoothstep ramps: the box
// accelerates over the first 22% of the move, holds one speed through the
// middle, and eases out over the last 22%. Peak speed is 1.28x the average
// rather than the 3x an in-out cubic would give, and — the reason it is built
// this way rather than taken off `EASE_MOVE` — the six ticks it passes come up
// EVENLY. Under an in-out cubic four of the six land inside five frames.
//
// The profile is integrated once into a table and normalised, and the tick
// frames are read back out of that same table by inversion, so a tick's draw is
// derived from where the box actually is and the two can never drift.
// ---------------------------------------------------------------------------
export const SLIDE_F0 = 102;
export const SLIDE_F1 = 126;
export const SLIDE_RAMP = 0.22;
export const TICK_DRAW = 3; // frames, head-led
export const TICK_LEAD = 2; // frames of anticipation, never late

const SLIDE_N = 480;
const rampTable = (ramp: number) => {
  const v = (t: number) =>
    t < ramp ? smoothstep(t / ramp) : t > 1 - ramp ? smoothstep((1 - t) / ramp) : 1;
  const a = new Float64Array(SLIDE_N + 1);
  for (let n = 1; n <= SLIDE_N; n++) a[n] = a[n - 1] + v((n - 0.5) / SLIDE_N);
  const total = a[SLIDE_N];
  for (let n = 0; n <= SLIDE_N; n++) a[n] /= total;
  return a;
};
const readTable = (a: Float64Array, t: number) => {
  const x = clamp01(t) * SLIDE_N;
  const n = Math.min(SLIDE_N - 1, Math.floor(x));
  return a[n] + (a[n + 1] - a[n]) * (x - n);
};
const SLIDE_TABLE = rampTable(SLIDE_RAMP);

export const slideP = (f: number) =>
  readTable(SLIDE_TABLE, (f - SLIDE_F0) / (SLIDE_F1 - SLIDE_F0));
export const slideX = (f: number) => SLIDE_DX * slideP(f);


/** The frame at which the slide has covered a share p of its travel. */
const slideFrameAt = (p: number) => {
  let n = 0;
  while (n < SLIDE_N && SLIDE_TABLE[n + 1] < p) n++;
  const lo = SLIDE_TABLE[n];
  const hi = SLIDE_TABLE[n + 1];
  const t = hi > lo ? (p - lo) / (hi - lo) : 0;
  return SLIDE_F0 + ((n + t) / SLIDE_N) * (SLIDE_F1 - SLIDE_F0);
};

// Each tick draws as the box's CENTRE reaches it, two frames early.
export const TICK_F0 = TICKS.map((x) => slideFrameAt((CENTRE_X - x) / -SLIDE_DX) - TICK_LEAD);

// ---------------------------------------------------------------------------
// THE CAMERA TRACK. Authored as consecutive `camMove` segments (a key per
// frame), the gaps between them one held key, and the whole thing put through
// the shared damper. cx rides the SAME eased profile and the SAME damper — a
// second `runCamera` pass over the cx track — so a pan can never lead or lag
// the zoom it belongs to.
//
// CONTENT CENTRES are solved, not typed, and every one of them is the MIDPOINT
// OF THE CONTENT BLOCK THAT IS IN FRAME AT THAT MOMENT — top of the highest ink
// to the foot of the lowest. `CAM_LIFT / k` is what drops such a centre onto
// screen y 835 under the captions, and `camMove` already takes cy off the eased
// k, so a move's endpoints are content centres in world y and the block stays
// centred THROUGH the move, not only at its ends.
//   C_OPEN   -7  the mark's top (-174) to the blob's bottom (159): the lockup
//                sits screen 501..1031 at k 1.70.
//   C_NOW   223  the mark's top (-174) to the playhead's foot (620) — the block
//                the piece is showing from the moment the playhead is down.
//   C_WIDE  180  the box's top (-260) to the playhead's foot (620), the block
//                every frame from the box's close onward.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.7;
export const K_NOW = 1.15;
export const K_CREEP = 0.88;
export const K_FINAL = 0.78;

export const C_OPEN = (MARK.y - MARK_SIZE / 2 + (BLOB.y + BLOB_AY)) / 2; // -7
export const C_NOW = (MARK.y - MARK_SIZE / 2 + PLAY_Y1) / 2; // 223
export const C_WIDE = (BOX_Y0 + PLAY_Y1) / 2; // 180

export const CX_OPEN = BLOB.x; // 690
export const CX_NOW = 620;
export const CX_CREEP = 520;

// K_FINAL and CX_FINAL are SOLVED, not chosen, and they are solved against the
// WHOLE slide rather than against its last frame. What has to be in frame is
// the slid box's left edge (BOX_X0 + SLIDE_DX = -530) keeping >= 60 screen px
// and the playhead (x 540) keeping >= 120 screen px of frame to its right, so
// the frame has to hold 1,070 world px plus both margins:
//     1080/k >= 1070 + 180/k   ->   k <= 0.841,
// and the interval of legal cx at 0.78 is [1.5, 85.4] — 84 px wide, so the
// damped camera has somewhere to sit. 43 is its middle and puts 93 screen px of
// margin to the left of the box and 152 to the right of the playhead. The same
// interval is checked at EVERY frame of the slide, not only at the end: the box
// travels left at up to 38 world px a frame, and a camera keyed on the zoom's
// own curve falls behind it in the middle — measured, the box's left edge fell
// to 40 screen px over f122-125. That is what `xSlide` below is for; with it
// the box never comes inside 67 screen px of the left edge.
export const CX_FINAL = 43;

export const CAM_LEAD = 4; // frames: the damper's lag, put back into a followed pan

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
  // A pan may be taken off the SLIDE'S OWN PROFILE instead of an ease of its
  // own, which is what M4 does. A camera following a moving thing has to move
  // the way that thing moves: keyed on the zoom's curve, the pan was ahead of
  // the box for the first six frames of the slide (the slide's velocity ramps
  // in and the camera's does not), so the box drifted 26 screen px to the RIGHT
  // before it started travelling left, and the whole gesture read as a lurch
  // backwards before it went anywhere. On the slide's own profile the two share
  // one velocity shape and the box only ever moves one way on screen.
  xSlide?: boolean;
};

export const CAM_SEGS: CamSeg[] = [
  // M1 "as of this recording" — out and left, the rule and the playhead arrive
  {
    f0: 21,
    f1: 31,
    k0: K_OPEN,
    k1: K_NOW,
    c0: C_OPEN,
    c1: C_NOW,
    x0: CX_OPEN,
    x1: CX_NOW,
    warp: 0.72,
  },
  // M2 "and was being used ... internally" — ONE move, not two. It used to be a
  // pull-back over the box's draw (f52-62) and then a creep onto the sealed box
  // (f73-85), both opening out and both travelling left, with a three-frame
  // dwell between them. Two moves the same way with a dwell in the middle do not
  // read as two beats — measured, the damped zoom came off its first landing at
  // 0.4%/frame, sat there for three frames and then went again, which is a stall
  // and then a restart, exactly the hesitation the house rule is about. Merged
  // it is one deceleration lobe: the zoom takes the box's whole construction,
  // opens the empty timeline to the LEFT of the box into frame, and settles on
  // the sealed box as the three threads land on "internally".
  {
    f0: 52,
    f1: 84,
    k0: K_NOW,
    k1: K_CREEP,
    c0: C_NOW,
    c1: C_WIDE,
    x0: CX_NOW,
    x1: CX_CREEP,
    warp: 0.72,
  },
  // M3 is not a segment: it is the HELD BREATH the gap leaves, f92-101, dead
  // still on the sealed box before the slide takes it.
  // M4 "as of February" — released with the slide and following it out and left
  {
    f0: 102,
    f1: 130,
    k0: K_CREEP,
    k1: K_FINAL,
    c0: C_WIDE,
    c1: C_WIDE,
    x0: CX_CREEP,
    x1: CX_FINAL,
    warp: 0.6,
    xSlide: true,
  },
];

const CAM_TRACK = (() => {
  const F: number[] = [0];
  const K: number[] = [K_OPEN];
  const CY: number[] = [C_OPEN + CAM_LIFT / K_OPEN];
  const CX: number[] = [CX_OPEN];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
    CX.push(CX[CX.length - 1]);
  };
  CAM_SEGS.forEach((s) => {
    if (s.f0 > F[F.length - 1] + 1) hold(s.f0 - 1);
    const m = camMove(s);
    const span = s.f1 - s.f0;
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      // On the slide's own profile the pan is read CAM_LEAD frames ahead of
      // itself, which is the damper's own lag put back in: handed the profile
      // straight, the damped camera trails the box by about six frames and the
      // box overshoots to 11 screen px from the left edge before the lens
      // catches up. Leading it puts the box's travel inside its margins at
      // every frame of the slide (checked frame by frame).
      const gx = s.xSlide ? slideP(f + CAM_LEAD) : camEase(i / span, s.warp);
      CX.push(s.x0 + (s.x1 - s.x0) * gx);
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY, CX };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;
export const CAM_CX = CAM_TRACK.CX;

/** The damped camera at a frame: cy and k off one pass, cx off a second pass of
 *  the same damper over the same key frames, so all three settle together. */
export const cameraAt = (frame: number) => {
  const a = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const b = runCamera(frame, CAM_F, CAM_CX, CAM_K);
  return { cy: a.cy, k: a.k, cx: b.cy };
};

// The damped k at every integer frame, run once: the arrival solve needs to
// know what the lens is doing while a dot is in the air, because a world speed
// is only legible as a SCREEN speed.
export const K_AT: Float64Array = (() => {
  const a = new Float64Array(DURATION + 1);
  for (let f = 0; f <= DURATION; f++) a[f] = runCamera(f, CAM_F, CAM_CY, CAM_K).k;
  return a;
})();

// ---------------------------------------------------------------------------
// G1 THE ASSEMBLE. Every seat comes in from beyond the frame's edge at the
// opening framing, on its own shallow arc.
//
// The origin is the point where the seat's own ray leaves the OPENING FRAME
// (solved from k 1.60, cx 690, cy = C_OPEN + CAM_LIFT/1.60 — the real rect,
// not a guess), pushed a hashed 30-110 px further out and capped at
// ORIGIN_MAX. The cap is what makes the piece possible: the frame is 675 x 1200
// world px at that zoom, so a ray straight up leaves it 610 px away and a ray
// sideways only 338, and without the cap the vertical arrivals would have to
// run at nearly twice the speed of the lateral ones to land on the same beat.
// With it every arc is 380-470 px and ONE speed serves all of them, which is
// also the house habit: one speed, and the START frames carry the stagger.
//
// A seat's duration is therefore its own length over that speed, its landing
// frame is hashed across f12-20, and its launch is the difference — which for
// the longest arcs is a few frames BEFORE f0. That is deliberate and it is
// invisible: at f0 those dots are still outside the frame. The alternative,
// clamping every launch to f0, forces the long arcs to run at 2x and they
// strobe.
// ---------------------------------------------------------------------------
export const ARRIVE_SPEED = 20; // world px/frame, the one speed for all of them
export const ARRIVE_ORIGIN_MAX = 470;
export const ARRIVE_LAND_0 = 13;
export const ARRIVE_LAND_1 = 20;
export const ARRIVE_LAUNCH_MIN = -6; // how far before f0 an arc may already be running
export const ARRIVE_FADE = 0.3; // the share of a flight it fades up over

const OPEN_CY = C_OPEN + CAM_LIFT / K_OPEN;
const OPEN_HALF_W = FRAME_W / 2 / K_OPEN;
const OPEN_HALF_H = FRAME_H / 2 / K_OPEN;

/** How far along the ray (dx, dy) from (x, y) the opening frame's edge is. */
const exitDistance = (x: number, y: number, dx: number, dy: number) => {
  const tx = dx > 0 ? (CX_OPEN + OPEN_HALF_W - x) / dx : (CX_OPEN - OPEN_HALF_W - x) / dx;
  const ty = dy > 0 ? (OPEN_CY + OPEN_HALF_H - y) / dy : (OPEN_CY - OPEN_HALF_H - y) / dy;
  return Math.min(Math.abs(tx), Math.abs(ty));
};

export type Arrival = {
  ox: number;
  oy: number;
  cxp: number; // the arc's control point
  cyp: number;
  launch: number;
  dur: number;
};

export const ARRIVALS: Arrival[] = SEATS.map((s, i) => {
  const th = hash(i, 51) * Math.PI * 2;
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  const dist = Math.min(ARRIVE_ORIGIN_MAX, exitDistance(s.x, s.y, dx, dy) + 30 + hash(i, 52) * 80);
  const ox = s.x + dx * dist;
  const oy = s.y + dy * dist;
  const land = ARRIVE_LAND_0 + hash(i, 53) * (ARRIVE_LAND_1 - ARRIVE_LAND_0);
  // one speed for all of them, and then the only thing that is allowed to
  // shorten a flight is the floor on how early it may have launched
  const dur = Math.max(8, Math.min(dist / ARRIVE_SPEED, land - ARRIVE_LAUNCH_MIN));
  // the arc: the chord's midpoint pushed sideways, hashed either way, shallow
  const bulge = (hash(i, 54) - 0.5) * 0.34 * dist;
  return {
    ox,
    oy,
    cxp: (ox + s.x) / 2 - dy * bulge,
    cyp: (oy + s.y) / 2 + dx * bulge,
    launch: land - dur,
    dur,
  };
});

/** Where seat i is at a frame, and how far up its arrival fade has come. */
export const seatAt = (i: number, frame: number) => {
  const a = ARRIVALS[i];
  const s = SEATS[i];
  const u = clamp01((frame - a.launch) / a.dur);
  if (u >= 1) return { x: s.x, y: s.y, op: 1 };
  const t = EASE_ARRIVE(u);
  const m = 1 - t;
  return {
    x: m * m * a.ox + 2 * m * t * a.cxp + t * t * s.x,
    y: m * m * a.oy + 2 * m * t * a.cyp + t * t * s.y,
    op: clamp01(u / ARRIVE_FADE),
  };
};

// ---------------------------------------------------------------------------
// G2 THE TIMELINE. The rule draws head-led out of the now-dot both ways and
// then keeps going, off-frame, out to where the slide will need it: the whole
// point of the gesture is that by the time the box travels left the road is
// already there, so nothing new ever draws at the left edge under the slide.
// TL_VIS is how far it has to reach to be off both edges at k 1.15 (the frame
// runs world x 150..1090 there); TL_FULL is where it stops.
// ---------------------------------------------------------------------------
export const TL_F0 = 24;
export const TL_F1 = 36; // head-led, and off both frame edges by here
export const TL_FULL_F = 48; // off-frame the whole way, so this is unseen
export const TL_VIS = 610;
export const TL_FULL = 1700;
export const PLAY_F0 = 30;
export const PLAY_F1 = 40;
export const CLICK_DUR = 3;

export const tlExtent = (f: number) =>
  f < TL_F1
    ? TL_VIS * EASE_ARRIVE(clamp01((f - TL_F0) / (TL_F1 - TL_F0)))
    : interpolate(f, [TL_F1, TL_FULL_F], [TL_VIS, TL_FULL], clamp);

// ---------------------------------------------------------------------------
// G3 THE WAVE. Deep -> ripe out of the blob's own centre, the front softened
// over three seat-rings by the shared `softFront` rather than snapping ring by
// ring. The front is solved so the OUTERMOST seat is fully ripe exactly on
// "training": it has to travel the farthest seat's distance plus the width of
// its own soft edge.
// ---------------------------------------------------------------------------
export const WAVE_F0 = 44;
export const WAVE_F1 = 55; // "training"
export const WAVE_WIDTH = 3 * STEP_Y;
export const WAVE_R = Math.max(...SEATS.map((s) => s.d)) + WAVE_WIDTH;
export const MARK_CLICK = 56;

// ---------------------------------------------------------------------------
// G4 THE BOX, THE PEOPLE AND THE THREADS.
//
// THE BOX is the shared squircle, drawn head-led by two heads leaving the
// bottom-centre in opposite directions and meeting at the top-centre. The
// outline is stroked with a dash window rather than redrawn per frame, and the
// white tip rides a plain rectangle parameterisation of the same outline — the
// corner rounding is 3 world px out of a 2,440 px perimeter, so the tip sits on
// the drawn line to well under a pixel.
//
// THE PEOPLE come down through that seam while it is still open, which is the
// whole reason the box is drawn from the bottom: at every launch and crossing
// the top run is still unbuilt, so nobody is ever walked through an ink wall
// and the box shuts BEHIND them on "used". One speed, 38 world px/frame, so
// the three launches carry the stagger; each fades up over its first fifth.
//
// THE THREADS are the only accent line in the piece. One speed for all three
// (the house 22 world px/frame), and because each starts when its own person
// lands, the three different lengths all arrive inside two frames of each
// other, on "internally".
// ---------------------------------------------------------------------------
export const BOX_F0 = 64;
export const BOX_F1 = 84; // "used"
export const BOX_RAMP = 0.25;
// The box's wipe rides the same shape: two heads sweeping 1,220 px each in
// twenty frames want an even speed, not an ease-out. On an out-cubic the first
// frame of the wipe measured 186 screen px/frame — the head jumped a fifth of
// the way round the box between two frames.
const BOX_TABLE = rampTable(BOX_RAMP);
export const boxP = (u: number) => readTable(BOX_TABLE, u);

export const BOX_PERIM = 2 * (BOX_W + BOX_H);
export const S_BOTTOM = (BOX_H + BOX_W / 2) / BOX_PERIM;

/** A point at normalised distance s clockwise from the box's top-right corner. */
export const boxPoint = (s: number) => {
  let d = ((s % 1) + 1) % 1;
  d *= BOX_PERIM;
  if (d < BOX_H) return { x: BOX_X1, y: BOX_Y0 + d };
  d -= BOX_H;
  if (d < BOX_W) return { x: BOX_X1 - d, y: BOX_Y1 };
  d -= BOX_W;
  if (d < BOX_H) return { x: BOX_X0, y: BOX_Y1 - d };
  d -= BOX_H;
  return { x: BOX_X0 + d, y: BOX_Y0 };
};

export const PERSON_SPEED = 32; // world px/frame, one speed for all three
export const PERSON_LAND = [76, 80, 83];
export const PERSON_ORIGIN_Y = -270;
export const PERSON_ORIGIN_X = [500, 520, 540];
export const PERSON_FADE = 0.35;

export type PersonFlight = {
  ox: number;
  oy: number;
  cxp: number;
  cyp: number;
  tx: number;
  ty: number; // the FOOT lands here
  launch: number;
  dur: number;
};

export const PEOPLE: PersonFlight[] = PEOPLE_X.map((x, i) => {
  const ox = PERSON_ORIGIN_X[i];
  const oy = PERSON_ORIGIN_Y;
  const ty = PEOPLE_FOOT_Y[i];
  const len = Math.hypot(x - ox, ty - oy);
  const dur = Math.round(len / PERSON_SPEED);
  // a shallow arc, leaning out to the left on the way down
  const bulge = (0.10 + 0.05 * hash(i, 55)) * len;
  return {
    ox,
    oy,
    cxp: (ox + x) / 2 - bulge,
    cyp: (oy + ty) / 2,
    tx: x,
    ty,
    launch: PERSON_LAND[i] - dur,
    dur,
  };
});

export const personAt = (i: number, frame: number) => {
  const p = PEOPLE[i];
  const u = clamp01((frame - p.launch) / p.dur);
  if (u >= 1) return { x: p.tx, y: p.ty, op: 1 };
  const t = EASE_ARRIVE(u);
  const m = 1 - t;
  return {
    x: m * m * p.ox + 2 * m * t * p.cxp + t * t * p.tx,
    y: m * m * p.oy + 2 * m * t * p.cyp + t * t * p.ty,
    op: clamp01(u / PERSON_FADE),
  };
};

// Where a thread attaches: mid-torso, which is also the blob's own centre line,
// so the three threads run level rather than up into the crowd.
export const CHEST_UP = PERSON_SIZE * 0.45;
// One speed for all three threads, solved so the LAST of them is home on
// "internally". The three are 316, 236 and 206 px long and each leaves when its
// own person lands (f76, f80, f83), so 24 px/frame — a hair over the house 22,
// which would put the last one at f92.4 — brings them in at f89.2, f89.8 and
// f91.6: staggered, and the last of them on the word.
export const THREAD_SPEED = 24;

// Each person's thread goes to the seat at ITS OWN HEIGHT, not to the seat
// nearest it. Nearest-seat was tried and it does not work here: the middle
// person's nearest seat is low in the blob, so its thread dives across the
// person below it and across that person's thread. Three level threads at three
// heights cross nothing — not the glyphs (the tightest clears a head by 14
// world px) and not each other — and they read as three separate connections
// instead of a fan.
//
// The cost is twice `how far off my height` plus a third of `how far off a good
// length`, so a thread is level first and about 200 px long second. It must
// still reach THREAD_MIN into the crowd, or the person nearest the blob gets a
// stub with no room for a packet on it, and no two may land within THREAD_SEP
// of each other.
export const THREAD_MIN = 120; // world px: a thread has to be a thread
export const THREAD_WANT = 200; // world px: the length it would like to be
export const THREAD_SEP = 55; // world px between two landed threads
export type Thread = { seat: number; x1: number; y1: number; x2: number; y2: number; len: number };
export const THREADS: Thread[] = (() => {
  const taken: number[] = [];
  return PEOPLE_X.map((x, i) => {
    const y = PEOPLE_FOOT_Y[i] - CHEST_UP;
    let best = -1;
    let bestC = Infinity;
    let bestD = 0;
    SEATS.forEach((s, j) => {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < THREAD_MIN) return;
      const c = 2 * Math.abs(s.y - y) + Math.abs(d - THREAD_WANT) / 3;
      if (c >= bestC) return;
      if (taken.some((t) => Math.hypot(SEATS[t].x - s.x, SEATS[t].y - s.y) < THREAD_SEP)) return;
      bestC = c;
      bestD = d;
      best = j;
    });
    taken.push(best);
    return { seat: best, x1: x, y1: y, x2: SEATS[best].x, y2: SEATS[best].y, len: bestD };
  });
})();

// The traffic on the three threads, and the only thing moving through the
// resolved tail besides the breath: a 15-frame period against an 18-frame life
// is 1.2 packets per thread, so three or four are alive at once and no thread
// is ever empty for long. A packet is an agent-sized disc (DOT_RADIUS) rather
// than the 4 px bead the structures in this set use, because at the resolved
// k 0.78 a 4 px bead is three screen px and the gesture disappears.
export const PKT_F0 = 92; // "internally"
export const PKT_PERIOD = 15;
export const PKT_LIFE = 18;
export const PKT_OUT = 0.55; // the share of a life spent on the way out
export const PKT_R = DOT_RADIUS;


// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
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
  dotOpacity: z.number(),
  idleThreadCount: z.number(),
  markSize: z.number(),
  personSize: z.number(),
  trails: z.boolean(),
  beats: z.object({
    the: z.number(), // "the"        — the seats are already converging
    best: z.number(), // "best"
    available: z.number(), // "available"
    model: z.number(), // "model"     — the blob is whole
    as: z.number(), // "as"
    of: z.number(), // "of"
    this: z.number(), // "this"
    recording: z.number(), // "recording" — the playhead is down and clicks
    finished: z.number(), // "finished"  — the training wave leaves the centre
    training: z.number(), // "training"  — the last seat is ripe
    and: z.number(), // "and"        — the box starts drawing
    was: z.number(), // "was"
    being: z.number(), // "being"
    used: z.number(), // "used"       — the box shuts with a click
    internally: z.number(), // "internally" — the three threads are home
    asTwo: z.number(), // "as"        — THE SLIDE leaves
    ofTwo: z.number(), // "of"
    february: z.number(), // "february"
    end: z.number(), // speech ends; tail to 145
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
  idleThreadCount: idleThreads(NSEAT),
  markSize: MARK_SIZE,
  personSize: PERSON_SIZE,
  trails: true,
  beats: {
    the: 0,
    best: 3,
    available: 10,
    model: 17,
    as: 24,
    of: 31,
    this: 33,
    recording: 35,
    finished: 44,
    training: 55,
    and: 64,
    was: 73,
    being: 77,
    used: 84,
    internally: 92,
    asTwo: 102,
    ofTwo: 112,
    february: 114,
    end: 129,
  },
});

const clickAt = (frame: number, f0: number) =>
  clamp01(1 - Math.abs(frame - f0) / CLICK_DUR) * (frame >= f0 ? 1 : 0);

const AsOfFebruary: React.FC<Props> = ({
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
  idleThreadCount,
  markSize,
  personSize,
  trails,
  beats,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent);

  // -- camera ---------------------------------------------------------------
  const cam = cameraAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the slide ------------------------------------------------------------
  const sx = slideX(frame);

  // -- G1: where every seat is, and G3: how ripe it is ----------------------
  const pos = SEATS.map((_, i) => seatAt(i, frame));
  const front = interpolate(frame, [WAVE_F0, WAVE_F1], [0, WAVE_R], clamp);
  const seatTone = SEATS.map((s) => softFront(s.d, front, WAVE_WIDTH));

  // -- ambient: idle traffic inside the blob, from the frame it is whole ----
  const lit = new Float32Array(NSEAT);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: number };
  const threadEls: Th[] = [];
  const reach = 3;
  if (frame >= beats.model + 3) {
    for (let j = 0; j < idleThreadCount; j++) {
      const period = 44 - 12 * hash(j, 4);
      const local = frame + hash(j, 5) * period;
      const cycle = Math.floor(local / period);
      const phase = (local - cycle * period) / period;
      const seed = j * 131 + cycle * 7;
      const a = Math.floor(hash(seed, 6) * NSEAT);
      const sa = SEATS[a];
      const bc = Math.max(0, Math.min(F_COLS - 1, sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach)));
      const br = Math.max(0, Math.min(F_ROWS - 1, sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach)));
      const b = SEAT_AT[br * F_COLS + bc];
      if (b < 0 || b === a) continue;
      const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
      if (fade <= 0.02) continue;
      lit[a] = Math.max(lit[a], fade);
      lit[b] = Math.max(lit[b], dn * fade);
      threadEls.push({
        key: `i${j}`,
        x1: pos[a].x,
        y1: pos[a].y,
        x2: pos[a].x + (pos[b].x - pos[a].x) * dn,
        y2: pos[a].y + (pos[b].y - pos[a].y) * dn,
        op: 0.4 * fade,
        head: dn,
      });
    }
  }

  // -- G2: the rule, the now-dot and the playhead ---------------------------
  const tlE = tlExtent(frame);
  const tlOn = frame >= TL_F0;
  const dotR = PLAY_DOT_R * smoothstep(clamp01((frame - TL_F0) / 3));
  const playU = clamp01((frame - PLAY_F0) / (PLAY_F1 - PLAY_F0));
  const playY = TL_Y + (PLAY_Y1 - TL_Y) * EASE_ARRIVE(playU);
  const playClick = clickAt(frame, PLAY_F1);

  // -- G4: the box's two heads ----------------------------------------------
  const boxU = clamp01((frame - BOX_F0) / (BOX_F1 - BOX_F0));
  const boxDraw = boxP(boxU) * 0.5; // each head's share of the perimeter
  const boxClick = clickAt(frame, BOX_F1);
  const boxOp = OP_READ + (1 - OP_READ) * boxClick;
  const headF = boxPoint(S_BOTTOM + boxDraw);
  const headB = boxPoint(S_BOTTOM - boxDraw);

  // -- G4: the people, their threads and the packets ------------------------
  const people = PEOPLE_X.map((_, i) => personAt(i, frame));
  const threadDrawn = THREADS.map((t, i) => clamp01(((frame - PERSON_LAND[i]) * THREAD_SPEED) / t.len));
  THREADS.forEach((t, i) => {
    if (threadDrawn[i] >= 1) lit[t.seat] = Math.max(lit[t.seat], 1);
  });

  type Pkt = { key: string; x: number; y: number };
  const packets: Pkt[] = [];
  if (frame >= PKT_F0) {
    THREADS.forEach((t, i) => {
      for (let n = -1; n < 5; n++) {
        const born = PKT_F0 + PKT_PERIOD * n + hash(i, 61) * PKT_PERIOD;
        const age = frame - born;
        if (age < 0 || age > PKT_LIFE) continue;
        const u = age / PKT_LIFE;
        const p = u < PKT_OUT ? u / PKT_OUT : 1 - (u - PKT_OUT) / (1 - PKT_OUT);
        packets.push({
          key: `p${i}_${n}`,
          x: t.x1 + (t.x2 - t.x1) * p,
          y: t.y1 + (t.y2 - t.y1) * p,
        });
      }
    });
  }

  const markClick = clickAt(frame, MARK_CLICK);
  const markOp = OP_READ + (1 - OP_READ) * markClick;

  const bodyR = (i: number) => {
    const s = SEATS[i];
    const l = Math.max(seatTone[i], lit[i] * 0.6);
    return dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.35 * l);
  };

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
            {/* THE TIMELINE — the rule, its month ticks and the playhead. It
                does not travel: the box does. */}
            {tlOn ? (
              <g style={{ filter: icon }}>
                <line
                  x1={PLAY_X - tlE}
                  y1={TL_Y}
                  x2={PLAY_X + tlE}
                  y2={TL_Y}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
                {frame < TL_F1
                  ? [-1, 1].map((s) => (
                      <circle key={s} cx={PLAY_X + s * tlE} cy={TL_Y} r={4} fill={ink} />
                    ))
                  : null}
                {TICKS.map((x, i) => {
                  const u = clamp01((frame - TICK_F0[i]) / TICK_DRAW);
                  if (u <= 0) return null;
                  const y0 = TL_Y - TICK_H / 2;
                  const y1 = y0 + TICK_H * EASE_ARRIVE(u);
                  return (
                    <g key={x}>
                      <line
                        x1={Math.round(x) + 0.5}
                        y1={y0}
                        x2={Math.round(x) + 0.5}
                        y2={y1}
                        stroke={ink}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        opacity={OP_READ}
                      />
                      {u < 1 ? (
                        <circle cx={Math.round(x) + 0.5} cy={y1} r={3.5} fill={ink} />
                      ) : null}
                    </g>
                  );
                })}
                {frame >= PLAY_F0 ? (
                  <line
                    x1={PLAY_X}
                    y1={TL_Y}
                    x2={PLAY_X}
                    y2={playY}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={OP_READ + (1 - OP_READ) * playClick}
                  />
                ) : null}
                {playU > 0 && playU < 1 ? <circle cx={PLAY_X} cy={playY} r={4} fill={ink} /> : null}
                <circle
                  cx={PLAY_X}
                  cy={TL_Y}
                  r={dotR}
                  fill={ink}
                  opacity={OP_READ + (1 - OP_READ) * playClick}
                />
              </g>
            ) : null}

            {/* THE ASSEMBLY — everything that travels back in time together */}
            <g transform={`translate(${sx.toFixed(3)} 0)`}>
              {/* the company */}
              {boxU > 0 ? (
                <g style={{ filter: icon }}>
                  {boxU >= 1 ? (
                    <path
                      d={BOX_PATH}
                      transform={`translate(${BOX_X0} ${BOX_Y0})`}
                      fill="none"
                      stroke={ink}
                      strokeWidth={STROKE}
                      opacity={boxOp}
                    />
                  ) : (
                    <>
                      {[
                        { a: S_BOTTOM, len: boxDraw },
                        { a: Math.max(0, S_BOTTOM - boxDraw), len: Math.min(boxDraw, S_BOTTOM) },
                        {
                          a: 1 + S_BOTTOM - boxDraw,
                          len: Math.max(0, boxDraw - S_BOTTOM),
                        },
                      ]
                        .filter((d) => d.len > 0.0005)
                        .map((d) => (
                          <path
                            key={d.a}
                            d={BOX_PATH}
                            transform={`translate(${BOX_X0} ${BOX_Y0})`}
                            fill="none"
                            stroke={ink}
                            strokeWidth={STROKE}
                            strokeLinecap="round"
                            opacity={boxOp}
                            pathLength={1}
                            strokeDasharray={`${d.len} 2`}
                            strokeDashoffset={-d.a}
                          />
                        ))}
                      <circle cx={headF.x} cy={headF.y} r={4.5} fill={ink} />
                      <circle cx={headB.x} cy={headB.y} r={4.5} fill={ink} />
                    </>
                  )}
                </g>
              ) : null}

              {/* the fleet: idle traffic under the dots it belongs to */}
              {threadEls.map((t) => (
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
                  {t.head < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
                </g>
              ))}

              {/* the instances, converging and then lighting */}
              {SEATS.map((s, i) => {
                const p = pos[i];
                if (p.op <= 0) return null;
                const l = Math.max(seatTone[i], lit[i] * 0.6);
                return (
                  <g key={i}>
                    <Trail
                      frame={frame}
                      k={k}
                      at={(f) => {
                        const q = seatAt(i, f);
                        return q.op <= 0 ? null : { x: q.x, y: q.y };
                      }}
                      r={bodyR(i)}
                      fill={tone(l)}
                      opacity={dotOpacity * p.op}
                      enabled={trails}
                    />
                    <circle cx={p.x} cy={p.y} r={bodyR(i)} fill={tone(l)} opacity={dotOpacity * p.op} />
                  </g>
                );
              })}

              {/* the threads: the people using the model */}
              <g style={{ filter: icon }}>
                {THREADS.map((t, i) => {
                  const dn = threadDrawn[i];
                  if (dn <= 0) return null;
                  const hx = t.x1 + (t.x2 - t.x1) * dn;
                  const hy = t.y1 + (t.y2 - t.y1) * dn;
                  return (
                    <g key={i}>
                      <line
                        x1={t.x1}
                        y1={t.y1}
                        x2={hx}
                        y2={hy}
                        stroke={accent}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        opacity={0.95}
                      />
                      {dn < 1 ? <circle cx={hx} cy={hy} r={4} fill={ink} /> : null}
                    </g>
                  );
                })}
                {packets.map((p) => (
                  <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={accent} opacity={0.95} />
                ))}
              </g>

              {/* the model's mark */}
              <g
                style={{ filter: icon }}
                opacity={markOp}
                transform={`translate(${MARK.x} ${MARK.y}) scale(${markSize / 24}) translate(-12 -12)`}
              >
                {CLAUDE.paths.map((d) => (
                  <path key={d.length} d={d} fill={ink} fillRule="evenodd" />
                ))}
              </g>
            </g>
          </svg>

          {/* the people, riding the slide with everything else */}
          {PEOPLE_X.map((_, i) => {
            const p = people[i];
            if (p.op <= 0) return null;
            return (
              <Img
                key={i}
                src={staticFile("person.png")}
                style={{
                  position: "absolute",
                  left: p.x + sx - personSize / 2,
                  top: p.y - personSize * PERSON_FOOT,
                  width: personSize,
                  height: personSize,
                  objectFit: "contain",
                  filter: `brightness(0) invert(1) ${icon}`,
                  opacity: OP_READ * p.op,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AsOfFebruary;
