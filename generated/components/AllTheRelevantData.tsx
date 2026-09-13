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
  SQUIRCLE_MIN,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
// The set's shared line values: the stroke every line is drawn at, the duration
// a dot takes to ramp deep -> ripe, the speed a head-led line travels at, and
// the dash the "uncertain" edge is drawn with. Imported, never restated.
import { GATE_DASH, GATE_GAP, LINE_SPEED, STROKE, TONE_DUR, clampi } from "./ImpossibleTasks";
import {
  DEPTH_BANDS,
  EASE_ARRIVE,
  ExperimentsSchema,
  HIGHLIGHT,
  HIGHLIGHT_FRAMES,
  LEGATO,
  Streak,
  Trail,
  WAVE_FRONT_WIDTH,
  depthK,
  ease,
} from "./levelUp";
// THE WORLD. Cut 1 built it and this cut does not own one value of it: the
// seats, the grid they are indexed by, the ring, the wave's final edge, every
// seat's lit amount, the depth bands, the resolved camera and the idle traffic's
// own schedule all come from `ThreeOrSomething`. Frame 0 of this piece IS frame
// 244 of that one (see THE HAND-OVER below), so nothing here may re-derive
// anything: a value restated is a value that can drift between two cuts that are
// four seconds apart in the same edit.
import {
  BUCKETS,
  CAM as TOS_CAM,
  COLS,
  DURATION as TOS_DURATION,
  FIELD_Y0,
  FIELD_Y1_FULL,
  GRID_X0,
  GRID_Y0,
  IDLE_N,
  IDLE_OP,
  IDLE_POOL,
  IDLE_REACH,
  LIT_EDGE,
  NSEAT,
  RING_CX,
  RING_CY,
  RING_R,
  RING_STROKE,
  ROWS,
  SEATS,
  SEAT_ALIVE,
  SEAT_AT,
  SEAT_BAND,
  STEP_X,
  STEP_Y,
  TIP_R,
  idleAt,
  litAmount,
  seatOpacity,
} from "./ThreeOrSomething";

export const FPS = 24;
// Dwarkesh clip `Ajeya_The_Investigation`. Ajeya Cotra, on what the
// investigators found when they looked at the OpenAI / Hugging Face sandbox
// attack:
//
//   "And it's so much larger and so much more complicated, in a way that makes
//    it very tough to ascertain whether you have all the relevant data."
//
// SRT span 0:30.440 -> 0:38.520 at 24fps.
// DURATION = round((38.520 - 30.440) * 24) = round(8.080 * 24) = round(193.92)
// = 194 frames of speech, plus a 48 frame tail so the resolved state holds and
// the editor can cut out of it wherever it wants = 242.
export const DURATION = 242;

// ---------------------------------------------------------------------------
// "All the relevant data". CUT 2 of four, and the cut that finds the edge of
// cut 1's light. Cut 1 lit a blob of agents out of a ring and left the
// front stopped at WAVE_R_END; this cut pulls back until that blob's own
// boundary is on screen, knits the traffic behind it, throws three probes past
// the boundary that each find data where the map said there was none, and draws
// a box round what was looked at whose top side never closes.
//
// Orange Dwarkesh style: opaque grid cutaway, 1080x1920, 24fps, two tones of
// one warm yellow with the dots fully opaque, ink on the OP_* ladder, per-icon
// shadows, `runCamera` over authored `camMove` keys, one gesture per word.
//
// THE HAND-OVER. Frame 0 is cut 1's frame 244, and it is that frame rather than
// a copy of it: the camera starts at `runCamera(244)` of cut 1's own key track,
// every clock this piece reads (the idle schedule, `breath`, `sway`, the grid's
// drift) is `frame + HANDOVER` with HANDOVER = 244, and cut 1's own `idleAt` runs
// its own 300 slots. So this piece's f0 is cut 1's f244 to the pixel and its f1
// is cut 1's f245: the traffic continues mid-thread and nothing pops.
//
// Every gesture is one word. Nothing else happens.
//   SO MUCH LARGER: CAMERA M1 pulls back k 0.95 ->
//     0.62 and lifts the content centre 488 px, which
//     brings the lit blob's TOP boundary into frame at
//     screen y 330 with the unlooked-at field carrying
//     on above it — soft (the wave's own three-row
//     front) and wobbled, never a ruled edge. Even the
//     lit part has an end: that is "larger"
//                          — "so much larger"                       f7-31
//   SO MUCH MORE COMPLICATED: the traffic KNITS. From
//     f45 a second population of threads joins the idle
//     traffic among the lit seats — 0.6x the standing
//     count, so the rate is 1.6x — at DOUBLE the idle
//     reach, drawing over 0.45 of their cycle instead
//     of 0.3 so a longer thread visibly takes longer,
//     and one rung brighter than the ambient 0.4
//     because they are the gesture on the word. They
//     join over f45-59, the last cycles start by
//     f80-100, and the field is back to the idle rate
//     by f100. Measured: 374 threads drawn at f30, 650
//     at f70, 381 at f100
//                            — "so much more complicated"            f45-100
//   IN A WAY THAT MAKES IT VERY TOUGH TO ASCERTAIN:
//     CAMERA M2, the creep (warp 1.0) k 0.62 -> 0.80
//     with the centre moving so the boundary sits at
//     screen y 640, landed f128 and then dead still to
//     f137. v2: it LEAVES on "in a way" f72 rather than
//     "very" f93, which takes the longest parked
//     stretch in the piece from 62 frames to 41; it is
//     a creep, so its landing and the still after it do
//     not move. Under it, three PROBES: at f116, f121
//     and f126 a lit seat just inside the boundary
//     sends a thread OUT into the dark, head-led with a
//     `Streak`, each landing on a real dark seat
//     240-255 px past the boundary; on arrival that
//     seat goes dark -> ripe over TONE_DUR and STAYS
//     (with the cut's one highlight for two frames and
//     the set's 35% event swell on it), and the thread
//     fades over 8 frames. Data where the map said
//     there was none. Three different angles (-70,
//     -110, -90 degrees), dealt right / left / centre
//     so they read as three events and not as a sweep
//                          — "in a way ... to ascertain"             f72-137
//   WHETHER YOU HAVE ALL THE RELEVANT DATA: CAMERA M3
//     pulls back k 0.80 -> K_WIDE 0.42 with the box's
//     top edge settling at screen y 300, the boundary
//     at 343 and the three found seats above both,
//     landed f158 — seven frames before "relevant", and
//     early on purpose: the box is the size of the
//     frame now and it has to be drawn on a camera that
//     has arrived. THE BOX: a squircle round the light
//     itself, drawn head-led at ONE speed (318.9 world
//     px/frame, 134 on screen) with a `Streak` head —
//     down the LEFT side from "have" f150, along the
//     BOTTOM from "all" f157 (which starts while the
//     left side is still arriving: that overlap is
//     `legato`), up the RIGHT side from "the" f161 to
//     the top-right corner at f170, where the 4-frame
//     ink click lands. Then the TOP edge runs right ->
//     left as DASHED, no head, and STOPS on "data" one
//     third short of the top-left corner. The box never
//     closes: three solid sides are what was looked at,
//     the dashed side is the edge you cannot ascertain
//                    — "whether you have all the relevant data"      f137-177
//   TAIL: each found seat sends ONE more probe further
//     into the dark (f200, f212, f224), each lighting
//     one more seat and each fanning outward, so the
//     unknown keeps going after the sentence stops.
//     v3: CAMERA M4 under it — the camera no longer
//     holds at K_WIDE but DRIFTS toward the open edge,
//     k 0.42 -> 0.56 (measured 0.554 at f241) over the
//     whole tail at warp 1.0, the centre rising so the
//     dashed top edge comes down the frame and the six
//     found seats — 2 px dots at K_WIDE — end up in the
//     upper third at 2.29-3.81 px with dark field round
//     them. The box's bottom leaves the frame at ~f233.
//     It is a drift, not a move: the dashed edge's max
//     screen speed is 4.00 px/frame, which is what the
//     centre is SOLVED against (see M4 below). Idle
//     threads inside the box, `sway`, breath. It never
//     fades out — the editor controls the out
//                                    — tail                          f194-242
//
// CAMERA. Three moves on ONE damped track, cx = RING_CX throughout (the world is
// symmetric about the ring's axis and there is nothing off it to pan to), and
// every framing is solved from a SCREEN target rather than hand-set: a content
// centre c puts world y at screen 960 - CAM_LIFT + (y - c) * k, so M1 and M2 are
// inverted out of "the boundary sits at 330 / 640" and M3 out of "the box's top
// edge sits at 300".
//
// EVERY LANDING IS SOLVED AGAINST THE DAMPER, NOT ASSERTED. `runCamera` lags its
// target by ~6 frames, so the brief's key windows and its landings are not
// simultaneously satisfiable; as `UnderHeel` and cut 1 both do it, the SHAPE, the
// easing and the LANDINGS are kept and the windows are solved backwards from
// them (`$S/ard/cam3.ts`):
//   M1 keys f7-21   warp 0.70  k 0.95 -> 0.62  landed f31 ("and" f31)
//      residual 0.21% of the move, drifting 0.23% of it a frame
//   M2 keys f72-118 warp 1.00  k 0.62 -> 0.80  landed f128, still to f137
//      residual 0.03%; |dk| over f128-137 peaks at 7.2e-5, 0.04% of the creep a
//      frame, so the nine frames before "whether" are a still camera
//   M3 keys f137-147 warp 0.72 k 0.80 -> 0.42  landed f158 (7 frames before
//      "relevant" f165, inside the set's 4-10 rule) — residual 0.10% at f163
//   M4 keys f194-242 warp 1.00 k 0.42 -> 0.56 — v3, and the one move with NO
//      landing: it is still travelling when the piece ends (k 0.554 at f241,
//      99% of the move) because the tail is where the editor cuts out. Its end
//      centre is solved so the dashed edge's max screen speed is exactly the
//      brief's 4 px/frame — see M4 above for why the brief's own screen 720
//      is both 13.5 px/frame and 263 px outside the world
// Each move is one deceleration lobe and one settle lobe: |dk| peaks at f16
// (M1), f100 (M2) and f145 (M3), the longest flat-speed run inside a move is 2
// frames (6 in the creep, which is what a creep is), and there is no stall. The
// longest the camera is parked anywhere in the speech is 41 frames, f33-74.
//
// MEASURED, at the camera each thing is actually seen at (`$S/ard/final3.ts` and
// `$S/ard/idle.ts`). The set's 45 px/frame cap is a CLOSE-UP cap (k >= 2) and
// this cut never goes above k 0.95:
//   probe heads   22.4 px/frame at k 0.80 (LINE_SPEED)
//   tail heads    11.8 px/frame at K_WIDE
//   idle heads    36.1 px/frame worst single frame, p99 15.2, median 0
//   box head     149 px/frame at f150 (k 0.467), 134 from f160 on — the one
//                fast head in the piece, 318.9 world px/frame, one speed for
//                all three sides because the right side has to reach the corner
//                on f170. It carries the sub-sampled `Streak`
//   traffic      269 threads drawn at f10 (cut 1's own, mostly), 374 at f30,
//                650 at the top of the knit, 381 by f100, ~400 at the tail
//   the field    up to ~27,000 seats in frame at K_WIDE, emitted as one path
//                per lit bucket per depth band
//
// PAYOFF. EASE_PAYOFF is NOT USED. The point of this cut is that nothing lands:
// the box does not close and the probes find more field. `highlightTone` is
// spent on the six found seats, on the frame each one lights (3 in the probes
// and 3 in the tail — the same gesture repeated), and nowhere else.
//
// ambient: idle thread traffic between LIT seats, `breath` on every dot, `sway`
// on the camera, the grid's own drift. Not gestures; that is what this field is.
//
// ---------------------------------------------------------------------------
// WHAT IS DERIVED RATHER THAN HAND-SET, each noted where it is computed.
//
//   * THE BOUNDARY. Not a number: a seat's lit amount crosses 0.5 where its
//     distance from the ring is `LIT_EDGE(theta) - WAVE_FRONT_WIDTH / 2`, so the
//     apex of the blob (straight up) is world y -1302.3 and M1's and M2's camera
//     centres come out of that one function. The edge is a DOME, not a line, and
//     it wobbles by angle, because cut 1 built it that way.
//   * THE BOX. v2: measured off the LIT SEATS, not off a radius. The outermost
//     seat with any light on it at all is at |x| 1096.6 (the field's own
//     feathered side, not the blob, is what ends the light sideways) and the
//     light runs from y -1365.2 to 1424.7; + the brief's 40 px that is a box of
//     2273 x 2870 world px. NOTHING lit is outside it, which is the whole point
//     of the revision: solid sides mean "what was looked at".
//   * K_WIDE. The zoom at which that box fits the frame with 60 px side
//     margins: 960 / 2273 = 0.4223, taken down to 0.42 for 62.6 px a side. It
//     is the widest camera in the cut and everything else follows from it — the
//     box's stroke, the dot (1.73-2.89 screen px), the traffic pools.
//   * THE IDLE POOL. Cut 1's `IDLE_POOL` covers cut 1's widest camera only (x
//     +-628, y -937..1200, 7,342 seats): at K_WIDE this cut sees four times that
//     area, and outside the pool cut 1's traffic simply does not exist. So this
//     piece adds a SECOND population over the ring of world this camera newly
//     reaches, at cut 1's own rate — the house rule counts threads PER AGENT, so
//     it is 300 slots scaled by the seat count. They are held one full reach
//     clear of everything f0 can see, so frame 0 stays cut 1's frame 244 exactly
//     and the new traffic arrives with the pull-back.
//   * THE KNIT COUNT. 0.6 x the standing count over the whole of this camera's
//     reach, so the rate at the top of the knit is 1.6x the idle rate, which is
//     what the brief asks for. Their reach is 2 x IDLE_REACH and their draw
//     phase is 0.45 of their cycle rather than 0.3, so the longer thread takes
//     longer and its head stays at the same screen speed as an idle one.
//   * THE BOX'S DRAW SPEED. One speed for all three sides, solved off the right
//     side's deadline: it leaves the bottom-right corner on f161 and the ink
//     click is at the top-right corner on f170, so the speed is the box's height
//     over nine frames and the left side and the bottom take exactly as long as
//     their own lengths.
//   * THE PROBES' SEATS. Source and target are found by nearest-seat lookup
//     through the grid, so a probe always leaves a real agent and lands on a real
//     one, and the targets are asserted to be unlit at module scope.
//   * THE INK'S WEIGHT. `STROKE` and `TIP_R` are world px and every other piece
//     in this set resolves near k 1, where they are also the screen weight. This
//     one resolves at K_WIDE, so the two ink gestures are drawn at STROKE / k of
//     their own zoom and land on the set's own 3 screen px. The field's traffic
//     is not touched.
//
// DEVIATIONS FROM THE BRIEF — four, all forced or measured, none quiet.
//   1. THE THREE SOLID SIDES START ONE WORD LATER THAN BRIEFED: "have" f150,
//      "all" f157, "the" f161, not f141 / f150 / f160. The box is the size of
//      the frame now, so at f141 — four frames into M3, k still 0.746 — its left
//      side is 308 screen px OUTSIDE the frame and the whole of that side's
//      head-led draw would happen where nobody can see it. Measured
//      (`$S/ard/boxvis.ts`): at f141/150/160 the left head is in frame for 0 of
//      its 11 frames and the bottom for 6 of 8; at f150/157/161, with M3 landed
//      at f158, all three heads are in frame for every frame of their draw. The
//      click stays on f170 and the dashed top still stops on "data" f177.
//   2. M3 LANDS AT f158, NOT f165, for the same reason — seven frames before its
//      word, which is what the set's own "4-10 frames before" rule asks for
//      anyway.
//   3. DEPTH BANDS ARE ON, though the common brief scopes them to cut 1. They
//      have to be: two thirds of the seats are drawn at k * 0.97 and k * 1.03,
//      so turning them off would move most of the field by up to 14 screen px
//      and frame 0 would no longer be cut 1's frame 244. `experiments.depth`
//      still switches them.
//   4. THE TRAFFIC NEEDED TWO MORE POPULATIONS (see THE TRAFFIC below): cut 1's
//      pool covers cut 1's camera, and this one sees four times that area.
//   5. v3: M4's DASHED EDGE ENDS AT SCREEN 407, NOT 720. The revision asks for
//      both "the dashed top edge ends near screen y 720" and "so slow it reads
//      as a drift — max 4 screen px/frame", and the two cannot both be had: 720
//      is 420 px of travel in the tail's 48 frames, which measures 13.5
//      px/frame. 720 is also outside the world — it needs a content centre of
//      -1199.9, which shows world y -2713 at the top of the widest depth band
//      against a field that stops hard at -2450, and the assertion catches it;
//      the lowest the edge can legally be driven is ~555, and that still
//      measures 8.3 px/frame. So the cap is what the centre is solved against
//      and the edge lands at 407. The revision's other targets are all met at
//      that framing: the found seats are in the upper third (290-354) with dark
//      field round them, the box's bottom is off frame from ~f233, and the dot
//      goes from 1.73-2.89 px to 2.29-3.81. At 720 the found seats would have
//      sat at 600-666 — the middle of the frame, not the upper third — because
//      they are only 55-119 screen px above the edge.
// ---------------------------------------------------------------------------

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
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotOpacity: z.number(), // the dot body's own opacity; the ladder is colour
  idleThreadCount: z.number(), // cut 1's own slots, carried on unchanged
  idleOutCount: z.number(), // ...and the ring of world cut 1's pool never reached
  knitCount: z.number(), // the second population on "more complicated"
  experiments: ExperimentsSchema,
  beats: z.object({
    so: z.number(), // "so"            — M1 pulls back
    much: z.number(), // "much"
    larger: z.number(), // "larger"
    and: z.number(), // "and"           — M1 has landed
    so2: z.number(), // "so"
    much2: z.number(), // "much"
    more: z.number(), // "more"         — the knit is at its full rate
    complicated: z.number(), // "complicated"
    inAWay: z.number(), // "in a way"
    makes: z.number(), // "makes"
    very: z.number(), // "very"         — M2 creeps
    tough: z.number(), // "tough"
    to: z.number(), // "to"
    ascertain: z.number(), // "ascertain" — the three probes leave
    whether: z.number(), // "whether"   — M3 pulls back, the box starts
    you: z.number(), // "you"
    have: z.number(), // "have"
    all: z.number(), // "all"
    the: z.number(), // "the"
    relevant: z.number(), // "relevant" — M3 has landed, the click has landed
    data: z.number(), // "data"         — the dashed top stops short
    end: z.number(), // speech ends; tail to 242
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE HAND-OVER. Cut 1's last frame, and the offset every clock in this piece
// reads through.
// ---------------------------------------------------------------------------
export const HANDOVER = TOS_DURATION - 1; // 244
export const START = runCamera(HANDOVER, TOS_CAM.F, TOS_CAM.CY, TOS_CAM.K);
export const K_HAND = START.k; // 0.95
export const C_HAND = START.cy - CAM_LIFT / K_HAND; // 0, the ring's own axis
// The wave stopped at WAVE_R_END and stays there for every frame of this cut,
// so each seat's lit amount is a constant: read once, here, off cut 1's own
// `litAmount` at the first frame the front is settled.
export const FROZEN = TOS_DURATION;
const SX = new Float32Array(NSEAT);
const SY = new Float32Array(NSEAT);
const SR = new Float32Array(NSEAT);
const LIT = new Float32Array(NSEAT);
for (let i = 0; i < NSEAT; i++) {
  SX[i] = SEATS[i].x;
  SY[i] = SEATS[i].y;
  SR[i] = SEATS[i].r;
  LIT[i] = litAmount(i, FROZEN);
}

/** The nearest real seat to a world point, through the grid rather than by
 *  scanning the whole field. Cut 1 picks its three known agents the same way.
 *  A seat the side feather has taken away is not a seat. */
const seatNear = (x: number, y: number) => {
  const gc = clampi(Math.round((x - GRID_X0) / STEP_X), 0, COLS - 1);
  const gr = clampi(Math.round((y - GRID_Y0) / STEP_Y), 0, ROWS - 1);
  let best = -1;
  let bestD = Infinity;
  for (let r = gr - 3; r <= gr + 3; r++) {
    for (let c = gc - 3; c <= gc + 3; c++) {
      if (r < 0 || c < 0 || r >= ROWS || c >= COLS) continue;
      const i = r * COLS + c;
      if (!SEAT_ALIVE[i]) continue;
      const d = Math.hypot(SX[i] - x, SY[i] - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  }
  if (best < 0) throw new Error(`AllTheRelevantData: no seat near (${x.toFixed(0)}, ${y.toFixed(0)})`);
  return best;
};

// ---------------------------------------------------------------------------
// THE BOUNDARY. The lit blob's edge, as the field actually draws it: a seat's
// lit amount is `softFront(distance, WAVE_R_END)` over WAVE_FRONT_WIDTH, so it
// crosses 0.5 at LIT_EDGE(theta) - WAVE_FRONT_WIDTH / 2. Everything this cut
// frames is measured off this function and nothing off a number.
// ---------------------------------------------------------------------------
export const boundary = (theta: number) => LIT_EDGE(theta) - WAVE_FRONT_WIDTH / 2;
export const APEX = -boundary(-Math.PI / 2); // world y of the blob's top, -1302.3

// ---------------------------------------------------------------------------
// THE LIT REGION, AND THE BOX ROUND IT. v2: the box is no longer a rectangle
// the frame could hold with the light running out through three of its sides.
// Cut 1 v3 made the light a thing with a bounding box — the front stops at
// WAVE_R_END 1375 and the field's own sides dissolve at |x| ~ 1097 — so the box
// is measured off the LIT SEATS THEMSELVES rather than off the blob's radius:
// the outermost seat with any light on it at all, plus the brief's 40 px.
// Nothing outside these three solid sides is lit, and that is the grammar.
// ---------------------------------------------------------------------------
export const BOX_MARGIN = 40; // world px, as the brief asks
export const LIT_MIN = 0.02; // "any light on it at all"
const LIT_BOUNDS = (() => {
  let xHi = -Infinity;
  let yLo = Infinity;
  let yHi = -Infinity;
  let n = 0;
  for (let i = 0; i < NSEAT; i++) {
    if (!SEAT_ALIVE[i] || LIT[i] <= LIT_MIN) continue;
    n++;
    xHi = Math.max(xHi, Math.abs(SX[i] - RING_CX));
    yLo = Math.min(yLo, SY[i]);
    yHi = Math.max(yHi, SY[i]);
  }
  return { xHi, yLo, yHi, n };
})();
export const LIT_N = LIT_BOUNDS.n; // 13,048 seats carry the light
export const BOX_HALF = LIT_BOUNDS.xHi + BOX_MARGIN; // 1136.6
export const BOX_X0 = RING_CX - BOX_HALF;
export const BOX_X1 = RING_CX + BOX_HALF;
export const BOX_Y0 = LIT_BOUNDS.yLo - BOX_MARGIN; // -1405.2
export const BOX_Y1 = LIT_BOUNDS.yHi + BOX_MARGIN; // 1464.7
export const BOX_W = BOX_X1 - BOX_X0; // 2273
export const BOX_H = BOX_Y1 - BOX_Y0; // 2870

// ---------------------------------------------------------------------------
// THE CAMERA. A content centre c puts world y at screen 960 - CAM_LIFT + (y-c)*k
// — CAM_LIFT is the whole set's framing constant — so every centre here is
// solved from a SCREEN y rather than hand-set.
//
// K_WIDE is solved too, and it is the one number the whole cut hangs off: the
// widest the camera goes is the zoom at which the box fits the frame with the
// brief's 60 px side margins. 960 / BOX_W = 0.4223, and 0.42 is that rounded
// down, which leaves 62.6 px a side and puts the box's own height at 1205 px —
// so with its top edge at screen 300 its bottom lands at 1505, in the caption
// band, which the brief allows and which is what the extra 22 px of margin
// buys. The cost is the dot: 1.73-2.89 screen px at K_WIDE against 5.5 world.
// ---------------------------------------------------------------------------
export const centreFor = (y: number, screenY: number, k: number) =>
  y - (screenY - (FRAME_H / 2 - CAM_LIFT)) / k;

export const K_M1 = 0.62; // "so much larger": the boundary comes into frame
export const K_M2 = 0.8; // "very tough to ascertain": the creep in on it
export const K_WIDE = 0.42; // "all the relevant data": the box, and the widest shot
export const BOX_TOP_SCREEN = 300;
export const C_M1 = centreFor(APEX, 330, K_M1);
export const C_M2 = centreFor(APEX, 640, K_M2);
export const C_M3 = centreFor(BOX_Y0, BOX_TOP_SCREEN, K_WIDE);

// ---------------------------------------------------------------------------
// v3: M4, THE TAIL'S DRIFT. At K_WIDE the six found seats — the payoff of the
// whole cut — are 2 px dots, so through the tail, while the second probes go
// out, the camera creeps toward the open edge: k K_WIDE -> K_TAIL over the
// whole tail at warp 1.0, with the content centre RISING so the dashed top edge
// comes down the frame and the found seats sit in the upper third with dark
// field round them. The box's bottom leaves the frame on the way; the editor
// cuts out of the tail wherever it wants and the last frame is a resolved
// picture — dashed edge, found seats beyond it, light below.
//
// HOW FAR THE CENTRE MAY RISE IS MEASURED, NOT CHOSEN, and two things bound it:
//
//   * THE FIELD'S OWN TOP EDGE. Only the field's SIDES are feathered; its top
//     is hard at FIELD_Y0, and at K_TAIL the widest depth band shows 1767 world
//     px above the camera. The brief's "dashed edge ends near screen y 720"
//     needs a content centre of -1199.9, which puts the top of that band at
//     world -2713 — 263 px past the edge of the world, and the assertion below
//     catches it. The lowest the edge can legally be driven is screen ~555
//     (top of view -2431, 19 px of clearance), and that is a hard wall.
//   * THE BRIEF'S OWN DRIFT CAP: "so slow it reads as a drift, not a move",
//     max 4 screen px/frame on the dashed edge. The edge has 48 frames, so
//     4 px/frame is ~105 px of travel at the shape `camMove` draws. Screen 720
//     is 420 px of travel and measures 13.5 px/frame; even the legal 555 is
//     255 px and measures 8.3. The two bounds point the same way.
//
// The cap wins, and the framing is SOLVED from it exactly as every other
// framing in this cut is solved from its screen target: C_M4 is bisected so the
// dashed edge's own max screen speed — measured through `runCamera`, with the
// `sway` on it, over every frame of the tail — is exactly TAIL_DRIFT_CAP. It
// lands the edge at screen 407 on f241 with the six found seats at 290-354
// (the brief's "upper third with dark field around them"), the box's bottom
// off the frame from ~f233, and the dot at 2.29-3.81 screen px against
// 1.73-2.89 at K_WIDE — which is the legibility the addition is for.
// ---------------------------------------------------------------------------
export const K_TAIL = 0.56;
export const TAIL_CAM_F0 = 194; // "end": the speech stops and the drift starts
export const TAIL_DRIFT_CAP = 4; // screen px/frame, on the dashed top edge

// The field's sides are feathered now, so a camera may see past them — that is
// what the feather is for. Its TOP and BOTTOM are still hard, so every camera
// in this cut is asserted to keep those off screen, at the WIDEST depth band
// (the 0.97 one shows more world than the camera's own k does).
([
  [K_HAND, C_HAND, "M0"],
  [K_M1, C_M1, "M1"],
  [K_M2, C_M2, "M2"],
  [K_WIDE, C_M3, "M3"],
] as [number, number, string][]).forEach(([k, c, n]) => {
  const cy = c + CAM_LIFT / k;
  const hh = FRAME_H / 2 / (k * Math.min(...DEPTH_BANDS));
  if (cy - hh < FIELD_Y0 || cy + hh > FIELD_Y1_FULL) {
    throw new Error(`AllTheRelevantData: ${n} (k ${k}) can see the field's own top or bottom edge`);
  }
});
// ...and the box has to fit, with the margins the brief names.
if ((FRAME_W - BOX_W * K_WIDE) / 2 < 60) {
  throw new Error(`AllTheRelevantData: the box does not fit at k ${K_WIDE}`);
}

export type CamSeg = { f0: number; f1: number; k0: number; k1: number; c0: number; c1: number; warp: number };
// The three moves under the speech. v3 appends a fourth, the tail's drift, whose
// end is solved below.
const SPEECH_SEGS: CamSeg[] = [
  { f0: 7, f1: 21, k0: K_HAND, k1: K_M1, c0: C_HAND, c1: C_M1, warp: 0.7 }, // M1 "so much larger"
  // v2: the creep leaves on "in a way" f72 rather than "very" f93, so the
  // longest the camera is ever parked is 41 frames instead of 62. It is a
  // creep, so its landing (f128) and the still that follows it do not move.
  { f0: 72, f1: 118, k0: K_M1, k1: K_M2, c0: C_M1, c1: C_M2, warp: 1.0 }, // M2 the creep
  // v2: the keys close at f147 rather than f154, so M3 lands at f158 — seven
  // frames before "relevant" f165, inside the set's own 4-10 rule — and the box
  // is drawn on a camera that has arrived rather than one still pulling back.
  { f0: 137, f1: 147, k0: K_M2, k1: K_WIDE, c0: C_M2, c1: C_M3, warp: 0.72 }, // M3 the box
];

export const buildCam = (segs: CamSeg[]) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
  };
  F.push(0);
  K.push(K_HAND);
  CY.push(START.cy);
  segs.forEach((s) => {
    if (s.f0 > F[F.length - 1] + 1) hold(s.f0 - 1);
    const m = camMove(s);
    m.F.forEach((f, i) => {
      if (f <= F[F.length - 1]) return;
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  for (let i = 1; i < F.length; i++) {
    if (F[i] <= F[i - 1]) {
      throw new Error(`AllTheRelevantData: the camera's moves overlap at f${F[i]}`);
    }
  }
  return { F, K, CY };
};

// M4's keys, for a candidate end centre. Nothing before f194 changes: the
// builder holds M3's own values at f193 where it used to hold them at f242, so
// the damper's target over f0-f193 is the same number at every frame and f0-f193
// are the v2 frames exactly (proved by difference blend on f177).
const tailSegs = (c4: number): CamSeg[] => [
  ...SPEECH_SEGS,
  { f0: TAIL_CAM_F0, f1: DURATION, k0: K_WIDE, k1: K_TAIL, c0: C_M3, c1: c4, warp: 1.0 }, // M4 the drift
];

/** The dashed top edge's own max screen speed over the tail, as the frame
 *  actually shows it: through the damper, with the `sway` on it. This is the
 *  number the brief asks to be logged, and it is what C_M4 is solved against. */
const dashEdgeMaxSpeed = (c4: number) => {
  const T = buildCam(tailSegs(c4));
  const edgeAt = (f: number) => {
    const r = runCamera(f, T.F, T.CY, T.K);
    return FRAME_H / 2 + (BOX_Y0 - (r.cy + sway(f + HANDOVER).dy)) * r.k;
  };
  let worst = 0;
  let prev = edgeAt(TAIL_CAM_F0 - 2);
  for (let f = TAIL_CAM_F0 - 1; f < DURATION; f++) {
    const y = edgeAt(f);
    worst = Math.max(worst, Math.abs(y - prev));
    prev = y;
  }
  return worst;
};

// Bisected on the edge's own screen target, not on the centre: 300 is where M3
// left it and 900 is past the wall, and the speed rises monotonically between.
export const C_M4 = (() => {
  let lo = BOX_TOP_SCREEN;
  let hi = 900;
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2;
    if (dashEdgeMaxSpeed(centreFor(BOX_Y0, mid, K_TAIL)) > TAIL_DRIFT_CAP) hi = mid;
    else lo = mid;
  }
  return centreFor(BOX_Y0, lo, K_TAIL);
})();
export const TAIL_DRIFT_MAX = dashEdgeMaxSpeed(C_M4); // 4.00 screen px/frame

export const CAM_SEGS: CamSeg[] = tailSegs(C_M4);
export const CAM = buildCam(CAM_SEGS);

// M4 moves through k and centre together, so its worst frame for the field's own
// hard top edge is not necessarily either end: every frame of the drift is
// checked, at the widest depth band, the same test the four keys take above.
for (let f = TAIL_CAM_F0; f < DURATION; f++) {
  const r = runCamera(f, CAM.F, CAM.CY, CAM.K);
  const hh = FRAME_H / 2 / (r.k * Math.min(...DEPTH_BANDS));
  if (r.cy - hh < FIELD_Y0 || r.cy + hh > FIELD_Y1_FULL) {
    throw new Error(`AllTheRelevantData: M4 can see the field's own top or bottom edge at f${f}`);
  }
}

// ---------------------------------------------------------------------------
// THE PROBES. Three threads that leave a lit seat just inside the boundary and
// land on a real seat out in the dark, 205-255 world px past it. Three angles
// across the visible dome, dealt right / left / centre so they read as three
// events rather than as a sweep (cut 1 deals its tasks by the same rule).
//
// The tail repeats the gesture once per found seat, fanning outward: the
// unknown keeps going after the sentence has stopped.
// ---------------------------------------------------------------------------
// INK WEIGHT. `STROKE` is 3 and `TIP_R` is 4 in WORLD px, and every other piece
// in this set resolves near k 1, so in those pieces they are also 3 and 4 on
// screen. This cut resolves at k 0.55 — the widest camera this world can legally
// hold — where a world-3 line is 1.65 screen px: a hairline over a field of
// dots. So the two INK gestures are drawn at the weight that makes them the
// set's own 3 px at the zoom they are seen at, which is exactly what
// `iconShadow` does with the shadow. The field's own idle traffic is NOT
// touched: it is the crowd's texture and it shrinks with the crowd — and it has
// to stay bit-identical to cut 1's at frame 0.
export const PROBE_STROKE = STROKE / K_M2; // 3 screen px at the creep
export const PROBE_TIP = TIP_R / K_M2;
export const PROBE_IN = 40; // world px inside the boundary the source sits
export const PROBE_ANG = [-70, -110, -90]; // degrees, in launch order
export const PROBE_LEN = [255, 240, 255]; // world px past the boundary
export const PROBE_GAP = 5; // frames between launches — "as-cer-tain"
export const PROBE_SPEED = LINE_SPEED; // the set's shared head-led line speed
export const PROBE_FADE = 8; // frames the thread takes to go after it arrives
// The tail: which probe sends the next one, at which frame, in which direction.
export const TAIL_ORDER = [2, 0, 1];
export const TAIL_SLOTS = [200, 212, 224];
export const TAIL_ANG = [-30, -150, -172]; // degrees, per probe index: a fan
export const TAIL_LEN = 200;

export type Probe = {
  src: number; // seat index it leaves
  dst: number; // seat index it lands on
  from: number; // the frame it leaves
  len: number; // world px of flight
  arrive: number; // ...and the frame it lands, off the one shared speed
};

const probeTo = (theta: number, r0: number, r1: number, from: number): Probe => {
  const src = seatNear(r0 * Math.cos(theta), r0 * Math.sin(theta));
  const dst = seatNear(r1 * Math.cos(theta), r1 * Math.sin(theta));
  const len = Math.hypot(SX[dst] - SX[src], SY[dst] - SY[src]);
  return { src, dst, from, len, arrive: from + len / PROBE_SPEED };
};

export const buildProbes = (f0: number): Probe[] =>
  PROBE_ANG.map((deg, i) => {
    const th = (deg * Math.PI) / 180;
    const b = boundary(th);
    return probeTo(th, b - PROBE_IN, b + PROBE_LEN[i], f0 + i * PROBE_GAP);
  });

export const buildTail = (probes: Probe[]): Probe[] =>
  TAIL_ORDER.map((p, n) => {
    const s = probes[p].dst;
    const th = (TAIL_ANG[p] * Math.PI) / 180;
    const src = s;
    const dst = seatNear(SX[s] + TAIL_LEN * Math.cos(th), SY[s] + TAIL_LEN * Math.sin(th));
    const len = Math.hypot(SX[dst] - SX[src], SY[dst] - SY[src]);
    return { src, dst, from: TAIL_SLOTS[n], len, arrive: TAIL_SLOTS[n] + len / PROBE_SPEED };
  });

// Built once at module scope against the default beats so the assertions below
// run at import time; the component rebuilds them off its own `beats` prop.
const PROBES0 = buildProbes(116);
const TAIL0 = buildTail(PROBES0);
[...PROBES0, ...TAIL0].forEach((p, i) => {
  if (LIT[p.dst] > 0.02) {
    throw new Error(`AllTheRelevantData: probe ${i} lands on a seat that is already lit`);
  }
  if (i < PROBES0.length && LIT[p.src] < 0.98) {
    throw new Error(`AllTheRelevantData: probe ${i} leaves a seat that is not lit`);
  }
});

// The probe threads and the seats they light are drawn in the middle depth band
// with the ring, so a thread's head and the dot it lands on cannot be separated
// by the parallax. Cut 1 forces its three known agents into the same band for
// the same reason. Its own array is copied, never mutated.
export const BAND = Uint8Array.from(SEAT_BAND);
const MID_BAND = DEPTH_BANDS.findIndex((b) => b === 1);
export const FOUND_INDEX = new Map<number, number>();
[...PROBES0, ...TAIL0].forEach((p, i) => {
  BAND[p.src] = MID_BAND;
  BAND[p.dst] = MID_BAND;
  FOUND_INDEX.set(p.dst, i);
});

// ---------------------------------------------------------------------------
// THE BOX. What was looked at, as the set draws it: a squircle, stroke STROKE,
// ink at OP_READ, with the per-icon shadow — three sides solid and the top side
// dashed with the set's own GATE_DASH / GATE_GAP, stopping one third short of
// the top-left corner so it never closes.
//
// Its TOP edge is the meaningful one and it is measured: 40 world px above the
// blob's apex, in the dark, with the dome passing under it and out through the
// box's own sides. Its other three sides are the frame's safe area at the
// resolved camera — see the DEVIATIONS note in `$S/ard/DONE`: the blob is 2,900
// world px across and no camera this world can legally hold shows more than
// 1,964 of them, so a box round the blob's true bounding box would be drawn
// entirely off screen.
// ---------------------------------------------------------------------------
export const BOX_PATH = squirclePath(BOX_W, BOX_H);
// how far a squircle's corner reaches along each edge, which is what the
// reveal mask's three rects have to clear at the corners
export const BOX_CORNER =
  (1 + SQUIRCLE_SMOOTH) *
  Math.min(
    Math.min(BOX_W, BOX_H) / 2,
    Math.max(SQUIRCLE_RATIO * Math.min(BOX_W, BOX_H), SQUIRCLE_MIN),
  );
// v2: each side starts one word later than the brief's f141 / f150 / f160. The
// box is 2273 x 2870 world px now — it fills the frame at K_WIDE — so at f141,
// with M3 four frames old and k still 0.746, its left side is 308 screen px
// OUTSIDE the frame and the whole of that side's head-led draw would happen off
// screen. Measured ($S/ard/boxvis.ts): at f141/150/160 the left head is in frame
// for 0 of its 11 frames and the bottom for 6 of 8; at f150/157/161 all three
// heads are in frame for every frame of their draw. Every start is still a word
// — "have" f149, "all" f157, "the" f161 — the click is still f170 and the
// dashed top still stops on "data".
export const BOX_LEFT_F0 = 150; // "have" f149, one frame on
export const BOX_BOTTOM_F0 = 157; // "all"
export const BOX_RIGHT_F0 = 161; // "the"
export const BOX_CLICK = 170; // the head reaches the top-right corner
export const BOX_CLICK_DUR = 4; // the set's 4-frame ink click
// ONE speed for all three sides, solved off the right side's own deadline.
export const BOX_SPEED = BOX_H / (BOX_CLICK - BOX_RIGHT_F0);
export const BOX_STREAK = 1 / 3; // the head's smear, sub-sampled onto one frame
// the reveal mask's rects clear the stroke on both sides; the corners are
// cleared by BOX_CORNER, which is the squircle's own reach along each edge
export const MASK_PAD = 3 * STROKE;
export const BOX_STROKE = STROKE / K_WIDE; // 3 screen px at the resolved camera
export const BOX_TIP = TIP_R / K_WIDE;
export const DASH_FRACTION = 2 / 3; // ...so it stops one third short
export const DASH_F0 = BOX_CLICK;

// ---------------------------------------------------------------------------
// THE TRAFFIC. Three populations, and only the first of them is cut 1's.
//
//   1. cut 1's own `idleAt` over its own pool, run at `frame + HANDOVER`, so it
//      carries on mid-thread from its frame 245 and never pops.
//   2. the OUT population: the same mechanism over the ring of world this
//      camera reaches and cut 1's pool does not, at cut 1's own density. It is
//      held one full reach clear of everything f0 can see, so frame 0 is still
//      cut 1's frame 244 to the pixel.
//   3. the KNIT: "so much more complicated". A second population over the whole
//      of this camera's reach at 0.6x the standing count (so the rate is 1.6x)
//      and DOUBLE the reach, joining over f45-59 and stopping by f80-100. Each
//      slot runs whole cycles from its own start frame, so a thread is never
//      switched on halfway through its own draw.
//
// (2) and (3) are cut 1's `idleAt` with the pool, the reach and the draw phase
// made parameters — cut 1's function itself is used, unchanged, for cut 1's own
// slots, and this twin exists only because that function's pool and reach are
// baked in and this cut sees 2.5x the area at double the reach.
// ---------------------------------------------------------------------------
export type IdleThread = { a: number; b: number; dn: number; fade: number; cycle: number };

export const scheduleAt = (
  seed0: number,
  pool: Int32Array,
  reach: number,
  drawPhase: number,
  j: number,
  f: number,
  f0 = 0,
): IdleThread | null => {
  const period = 44 - 12 * hash(j + seed0, 4);
  const local = f - f0 + hash(j + seed0, 5) * period;
  if (local < 0) return null;
  const cycle = Math.floor(local / period);
  const phase = (local - cycle * period) / period;
  const seed = (j + seed0) * 131 + cycle * 7;
  const a = pool[Math.floor(hash(seed, 6) * pool.length)];
  const sa = SEATS[a];
  const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
  const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
  const b = SEAT_AT[br * COLS + bc];
  if (b < 0 || b === a) return null;
  const dn = interpolate(phase, [0, drawPhase], [0, 1], { ...clamp, easing: EASE_ARRIVE });
  const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
  if (fade <= 0.02) return null;
  return { a, b, dn, fade, cycle };
};

// The widest this camera ever reaches, and the area cut 1's pool already covers.
const VIEW_HALF_W = FRAME_W / 2 / K_WIDE;
const VIEW_HALF_H = FRAME_H / 2 / K_WIDE;
const VIEW_CY = C_M3 + CAM_LIFT / K_WIDE;
const inWidest = (i: number) =>
  SEAT_ALIVE[i] === 1 &&
  Math.abs(SX[i] - RING_CX) <= VIEW_HALF_W + 60 &&
  Math.abs(SY[i] - VIEW_CY) <= VIEW_HALF_H + 60;

const POOL1 = (() => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let n = 0; n < IDLE_POOL.length; n++) {
    const i = IDLE_POOL[n];
    x0 = Math.min(x0, SX[i]);
    x1 = Math.max(x1, SX[i]);
    y0 = Math.min(y0, SY[i]);
    y1 = Math.max(y1, SY[i]);
  }
  return { x0, x1, y0, y1 };
})();
// One reach of clearance, so no thread from the new population can draw INTO
// what frame 0 can see.
const CLEAR = IDLE_REACH * STEP_X;
export const POOL_OUT: Int32Array = (() => {
  const out: number[] = [];
  for (let i = 0; i < NSEAT; i++) {
    if (!inWidest(i)) continue;
    if (
      SX[i] > POOL1.x0 - CLEAR &&
      SX[i] < POOL1.x1 + CLEAR &&
      SY[i] > POOL1.y0 - CLEAR &&
      SY[i] < POOL1.y1 + CLEAR
    ) {
      continue;
    }
    out.push(i);
  }
  return Int32Array.from(out);
})();
export const POOL_ALL: Int32Array = (() => {
  const out: number[] = [];
  for (let i = 0; i < NSEAT; i++) if (inWidest(i)) out.push(i);
  return Int32Array.from(out);
})();

/** The new ring of world, at cut 1's own rate. The house rule counts traffic
 *  PER AGENT (180 threads per 1,200 of them), so the new population is cut 1's
 *  own slot count scaled by the number of seats, not by the area. */
export const OUT_N = Math.round((IDLE_N * POOL_OUT.length) / IDLE_POOL.length);
/** 0.6 x the standing count over the whole of this camera's reach, so the knit
 *  runs at 1.6x the idle rate. */
export const KNIT_N = Math.round((0.6 * IDLE_N * POOL_ALL.length) / IDLE_POOL.length);
export const KNIT_REACH = IDLE_REACH * 2;
// The knit is a gesture on a word rather than ambient, so its threads sit a rung
// above the idle traffic's 0.4 — under the 0.95 a hero thread gets, because they
// are still the crowd talking to itself.
export const KNIT_OP = 0.65;
export const KNIT_DRAW = 0.45; // a longer thread takes longer, at the same speed
export const KNIT_JOIN = 14; // frames the population joins over, from "so"
export const KNIT_STOP = 20; // ...and the window its last cycles start in
export const OUT_SEED = 7919;
export const KNIT_SEED = 104729;

// ---------------------------------------------------------------------------
// The field is emitted as one <path> of circle arcs per lit bucket per depth
// band, exactly as cut 1 emits it — 26,016 seats, of which this camera can see
// up to ~18,700, in 99 nodes rather than 18,700 circles. `arc` is cut 1's own
// private helper, written out identically here because it is not exported.
// ---------------------------------------------------------------------------
const arc = (x: number, y: number, r: number) => {
  const d = (2 * r).toFixed(2);
  return `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(
    2,
  )} 0 1 0 ${d} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 -${d} 0`;
};

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
  idleThreadCount: IDLE_N,
  idleOutCount: OUT_N,
  knitCount: KNIT_N,
  experiments: {},
  beats: {
    so: 7,
    much: 11,
    larger: 16,
    and: 31,
    so2: 45,
    much2: 48,
    more: 52,
    complicated: 56,
    inAWay: 72,
    makes: 86,
    very: 93,
    tough: 97,
    to: 106,
    ascertain: 116,
    whether: 137,
    you: 145,
    have: 149,
    all: 157,
    the: 161,
    relevant: 165,
    data: 177,
    end: 194,
  },
});

const AllTheRelevantData: React.FC<Props> = ({
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
  idleOutCount,
  knitCount,
  experiments,
  beats,
}) => {
  const frame = useCurrentFrame();
  // Cut 1's own clock. Frame 0 here is frame 244 there.
  const wf = frame + HANDOVER;
  // 0 = unlooked-at (deep), 1 = read (ripe). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(wf);
  const cy = cam.cy + drift.dy;
  const cx = RING_CX + drift.dx;
  const k = cam.k;
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the probes ------------------------------------------------------------
  // Three out of the boundary on "ascertain", three more in the tail. A found
  // seat takes the cut's one highlight on the frame it lights, then ramps
  // deep -> ripe over the shared TONE_DUR and stays.
  const probes = buildProbes(beats.ascertain);
  const allProbes = [...probes, ...buildTail(probes)];
  const foundTone = allProbes.map((p) => ease((frame - Math.ceil(p.arrive)) / TONE_DUR, EASE_ARRIVE));
  const foundHot = allProbes.map(
    (p) =>
      experiments.highlight &&
      frame >= Math.ceil(p.arrive) &&
      frame < Math.ceil(p.arrive) + HIGHLIGHT_FRAMES,
  );

  // -- the field -------------------------------------------------------------
  // Only what the camera can see, found through the grid's own row and column
  // ranges, bucketed by lit amount and emitted as one path per bucket per band.
  const bandK = DEPTH_BANDS.map((b) => depthK(k, b, experiments.depth));
  const kCull = Math.min(...bandK);
  const margin = dotRadius * 1.25 * 1.05 + 4;
  const x0 = cx - FRAME_W / 2 / kCull - margin;
  const x1 = cx + FRAME_W / 2 / kCull + margin;
  const y0 = cy - FRAME_H / 2 / kCull - margin;
  const y1 = cy + FRAME_H / 2 / kCull + margin;
  const gc0 = Math.max(0, Math.floor((x0 - GRID_X0) / STEP_X) - 1);
  const gc1 = Math.min(COLS - 1, Math.ceil((x1 - GRID_X0) / STEP_X) + 1);
  const gr0 = Math.max(0, Math.floor((y0 - GRID_Y0) / STEP_Y) - 1);
  const gr1 = Math.min(ROWS - 1, Math.ceil((y1 - GRID_Y0) / STEP_Y) + 1);

  // with `softFront` off the blob's edge is a hard cut instead of the wave's
  // own three-row ramp; everything else about the field is unchanged
  const litOf = (i: number) => (experiments.softFront ? LIT[i] : LIT[i] > 0.5 ? 1 : 0);

  const bucket: string[][][] = DEPTH_BANDS.map(() =>
    Array.from({ length: BUCKETS + 1 }, () => [] as string[]),
  );
  for (let gr = gr0; gr <= gr1; gr++) {
    for (let gc = gc0; gc <= gc1; gc++) {
      const i = gr * COLS + gc;
      if (!SEAT_ALIVE[i]) continue; // feathered away at the field's side edge
      let l = litOf(i);
      let hot = false;
      const fi = FOUND_INDEX.get(i);
      if (fi !== undefined) {
        l = Math.max(l, foundTone[fi]);
        hot = foundHot[fi];
      }
      const band = BAND[i];
      // the set's own event swell — 35%, as `ImpossibleTasks` and `UnderHeel`
      // give a dot that something happens to. It is an EVENT only: a seat that
      // is merely lit (all 18,000 of them out here) is never swollen, so this
      // is six dots in the piece and the field is exactly cut 1's.
      const r =
        dotRadius * SR[i] * breath(wf, hash(i, 9)) * (fi === undefined ? 1 : 1 + 0.35 * foundTone[fi]);
      bucket[band][hot ? BUCKETS : Math.round(l * (BUCKETS - 1))].push(arc(SX[i], SY[i], r));
    }
  }

  // -- idle traffic ----------------------------------------------------------
  // Between LIT seats only, in three populations (see THE TRAFFIC above). A
  // slot whose seat is unlit, or outside the frame, does not draw at all.
  type Th = {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    op: number;
    head: number;
    at: (f: number) => { x: number; y: number } | null;
  };
  const threadEls: Th[] = [];
  const push = (
    key: string,
    t: IdleThread,
    at: (f: number) => { x: number; y: number } | null,
    op = IDLE_OP,
  ) => {
    if (litOf(t.a) <= 0.5 || litOf(t.b) <= 0.5) return;
    const ax = SX[t.a];
    const ay = SY[t.a];
    if (ax < x0 || ax > x1 || ay < y0 || ay > y1) return;
    const bx = SX[t.b];
    const by = SY[t.b];
    threadEls.push({
      key,
      x1: ax,
      y1: ay,
      x2: ax + (bx - ax) * t.dn,
      y2: ay + (by - ay) * t.dn,
      op: op * t.fade,
      head: t.dn,
      at,
    });
  };

  // 1. cut 1's own slots, on cut 1's clock
  for (let j = 0; j < idleThreadCount; j++) {
    const t = idleAt(j, wf);
    if (!t) continue;
    const ax = SX[t.a];
    const ay = SY[t.a];
    const bx = SX[t.b];
    const by = SY[t.b];
    push(`i${j}`, t, (f: number) => {
      const u = idleAt(j, f + HANDOVER);
      if (!u || u.cycle !== t.cycle) return null;
      return { x: ax + (bx - ax) * u.dn, y: ay + (by - ay) * u.dn };
    });
  }

  // 2. the ring of world cut 1's pool never reached
  for (let j = 0; j < idleOutCount; j++) {
    const t = scheduleAt(OUT_SEED, POOL_OUT, IDLE_REACH, 0.3, j, wf);
    if (!t) continue;
    const ax = SX[t.a];
    const ay = SY[t.a];
    const bx = SX[t.b];
    const by = SY[t.b];
    push(`o${j}`, t, (f: number) => {
      const u = scheduleAt(OUT_SEED, POOL_OUT, IDLE_REACH, 0.3, j, f + HANDOVER);
      if (!u || u.cycle !== t.cycle) return null;
      return { x: ax + (bx - ax) * u.dn, y: ay + (by - ay) * u.dn };
    });
  }

  // 3. the knit, on "so much more complicated": each slot runs whole cycles
  //    from its own hashed start frame, so nothing is switched on mid-draw.
  const knitAt = (j: number, f: number) => {
    const start = beats.so2 + KNIT_JOIN * hash(j, 56);
    const stop = beats.so2 + 35 + KNIT_STOP * hash(j, 57);
    if (f < start) return null;
    const period = 44 - 12 * hash(j + KNIT_SEED, 4);
    if (start + Math.floor((f - start) / period) * period > stop) return null;
    return scheduleAt(KNIT_SEED, POOL_ALL, KNIT_REACH, KNIT_DRAW, j, f, start);
  };
  for (let j = 0; j < knitCount; j++) {
    const t = knitAt(j, frame);
    if (!t) continue;
    const ax = SX[t.a];
    const ay = SY[t.a];
    const bx = SX[t.b];
    const by = SY[t.b];
    push(
      `k${j}`,
      t,
      (f: number) => {
        const u = knitAt(j, f);
        if (!u || u.cycle !== t.cycle) return null;
        return { x: ax + (bx - ax) * u.dn, y: ay + (by - ay) * u.dn };
      },
      KNIT_OP,
    );
  }

  // -- the probe threads -----------------------------------------------------
  // Head-led at the set's one line speed, out into the dark, then gone.
  const probeEls = allProbes.map((p, i) => {
    if (frame < p.from) return null;
    const fade = interpolate(frame, [p.arrive, p.arrive + PROBE_FADE], [1, 0], clamp);
    if (fade <= 0) return null;
    const A = { x: SX[p.src], y: SY[p.src] };
    const B = { x: SX[p.dst], y: SY[p.dst] };
    const at = (f: number) => {
      if (f < p.from) return null;
      const d = clamp01(((f - p.from) * PROBE_SPEED) / p.len);
      return { x: A.x + (B.x - A.x) * d, y: A.y + (B.y - A.y) * d };
    };
    const q = at(frame);
    if (!q) return null;
    const drawn = clamp01(((frame - p.from) * PROBE_SPEED) / p.len);
    return { key: i, x1: A.x, y1: A.y, x2: q.x, y2: q.y, head: drawn, fade, at };
  });

  // -- the box ---------------------------------------------------------------
  // Three sides at one speed, head-led with a `Streak`, then a dashed top that
  // stops short. With `legato` off each side waits a LEGATO beat after the
  // previous one lands instead of leaving while it is still arriving.
  const sideDur = (len: number) => len / BOX_SPEED;
  const leftF0 = BOX_LEFT_F0;
  const leftEnd = leftF0 + sideDur(BOX_H);
  const bottomF0 = experiments.legato ? BOX_BOTTOM_F0 : Math.ceil(leftEnd) + LEGATO;
  const bottomEnd = bottomF0 + sideDur(BOX_W);
  const rightF0 = experiments.legato ? BOX_RIGHT_F0 : Math.ceil(bottomEnd) + LEGATO;
  const rightEnd = rightF0 + sideDur(BOX_H);
  const dLeft = clamp01((frame - leftF0) / (leftEnd - leftF0));
  const dBottom = clamp01((frame - bottomF0) / (bottomEnd - bottomF0));
  const dRight = clamp01((frame - rightF0) / (rightEnd - rightF0));
  const boxHeadAt = (f: number) => {
    if (f < leftF0) return null;
    if (f <= leftEnd) return { x: BOX_X0, y: BOX_Y0 + BOX_H * clamp01((f - leftF0) / (leftEnd - leftF0)) };
    if (f < bottomF0) return null;
    if (f <= bottomEnd) {
      return { x: BOX_X0 + BOX_W * clamp01((f - bottomF0) / (bottomEnd - bottomF0)), y: BOX_Y1 };
    }
    if (f < rightF0) return null;
    if (f <= rightEnd) {
      return { x: BOX_X1, y: BOX_Y1 - BOX_H * clamp01((f - rightF0) / (rightEnd - rightF0)) };
    }
    return null;
  };
  // the head's smear is sub-sampled onto a third of a frame's travel, exactly
  // as cut 1 sub-samples its ring head: three frames of a head this fast is a
  // smear longer than the side it is drawing
  const boxStreakAt = (f: number) => boxHeadAt(frame + (f - frame) * BOX_STREAK);
  const boxHead = boxHeadAt(frame);
  const clickEnd = rightEnd;
  const click =
    frame < clickEnd ? 0 : 1 - ease((frame - (clickEnd + BOX_CLICK_DUR)) / BOX_CLICK_DUR, EASE_ARRIVE);
  const boxOp = OP_READ + (1 - OP_READ) * click;
  // the dashed top: no head, just extending, right -> left, stopping on "data"
  const dashF0 = experiments.legato ? DASH_F0 : Math.ceil(clickEnd);
  const dash = clamp01((frame - dashF0) / Math.max(1, beats.data - dashF0));
  const dashFrom = BOX_X1;
  const dashTo = BOX_X1 - DASH_FRACTION * BOX_W;
  const dashX = dashFrom + (dashTo - dashFrom) * dash;

  const bands = DEPTH_BANDS.map((b, bi) => {
    const kb = bandK[bi];
    const t = worldTransform(cx, cy, kb);
    return { band: b, kb, transform: `translate(${t.tx.toFixed(3)} ${t.ty.toFixed(3)}) scale(${kb})` };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={wf}
        cy={cy}
        cyRest={TOS_CAM.CY[0]}
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
          <defs>
            {/* the box is revealed side by side rather than dash-offset: the
                squircle's corners are a cubic-arc-cubic construction and a dash
                offset into them cannot be solved without restating that
                geometry. The mask's three rects are the three sides, each
                growing at the one shared speed; the top edge is never revealed,
                because the top edge is the dashed one. */}
            <mask id="ard-box" maskUnits="userSpaceOnUse" x={-2000} y={-2600} width={4000} height={4400}>
              {dLeft > 0 ? (
                <rect
                  x={BOX_X0 - MASK_PAD}
                  y={BOX_Y0 - MASK_PAD}
                  width={BOX_CORNER + 2 * MASK_PAD}
                  height={MASK_PAD + BOX_H * dLeft}
                  fill="#fff"
                />
              ) : null}
              {dBottom > 0 ? (
                <rect
                  x={BOX_X0 + BOX_CORNER}
                  y={BOX_Y1 - MASK_PAD}
                  width={Math.max(1, BOX_W * dBottom - BOX_CORNER)}
                  height={2 * MASK_PAD}
                  fill="#fff"
                />
              ) : null}
              {dRight > 0 ? (
                <rect
                  x={BOX_X1 - BOX_CORNER - MASK_PAD}
                  y={BOX_Y1 - BOX_H * dRight - MASK_PAD}
                  width={BOX_CORNER + 2 * MASK_PAD}
                  height={MASK_PAD + BOX_H * dRight}
                  fill="#fff"
                />
              ) : null}
            </mask>
          </defs>

          {bands.map((b, bi) => (
            <g key={b.band} transform={b.transform}>
              {/* the crowd, one path per lit bucket: colour and opacity are
                  both the seat's lit amount, and nothing else */}
              {bucket[bi].map((d, n) =>
                d.length === 0 ? null : (
                  <path
                    key={n}
                    d={d.join("")}
                    fill={n === BUCKETS ? HIGHLIGHT : tone(n / (BUCKETS - 1))}
                    opacity={n === BUCKETS ? 1 : dotOpacity * seatOpacity(n / (BUCKETS - 1))}
                  />
                ),
              )}

              {bi === MID_BAND ? (
                <>
                  {/* idle traffic, head-led, between lit seats only */}
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
                      {t.head < 1 ? (
                        <>
                          <Trail
                            frame={frame}
                            k={k}
                            at={t.at}
                            r={TIP_R}
                            fill={ink}
                            opacity={t.op}
                            enabled={experiments.trails}
                          />
                          <circle cx={t.x2} cy={t.y2} r={TIP_R} fill={ink} opacity={t.op} />
                        </>
                      ) : null}
                    </g>
                  ))}

                  {/* the probes: out of the lit, into the dark */}
                  <g style={{ filter: icon }}>
                    {probeEls.map((p) =>
                      p ? (
                        <g key={p.key} opacity={p.fade}>
                          <line
                            x1={p.x1}
                            y1={p.y1}
                            x2={p.x2}
                            y2={p.y2}
                            stroke={accent}
                            strokeWidth={PROBE_STROKE}
                            strokeLinecap="round"
                            opacity={0.95}
                          />
                          {p.head < 1 ? (
                            <>
                              <Streak
                                frame={frame}
                                k={k}
                                at={p.at}
                                stroke={ink}
                                width={PROBE_TIP * 2}
                                enabled={experiments.trails}
                              />
                              <circle cx={p.x2} cy={p.y2} r={PROBE_TIP} fill={ink} />
                            </>
                          ) : null}
                        </g>
                      ) : null,
                    )}
                  </g>

                  {/* the box: three sides of what was looked at, and a top edge
                      that never closes */}
                  {dLeft > 0 ? (
                    <g style={{ filter: icon }}>
                      <g mask="url(#ard-box)">
                        <path
                          d={BOX_PATH}
                          transform={`translate(${BOX_X0} ${BOX_Y0})`}
                          fill="none"
                          stroke={ink}
                          strokeWidth={BOX_STROKE}
                          opacity={boxOp}
                        />
                      </g>
                      {dash > 0 ? (
                        <line
                          x1={BOX_X1}
                          y1={BOX_Y0}
                          x2={dashX}
                          y2={BOX_Y0}
                          stroke={ink}
                          strokeWidth={BOX_STROKE}
                          strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                          opacity={boxOp}
                        />
                      ) : null}
                      {boxHead ? (
                        <>
                          <Streak
                            frame={frame}
                            k={k}
                            at={boxStreakAt}
                            stroke={ink}
                            width={BOX_TIP * 2}
                            enabled={experiments.trails}
                          />
                          <circle cx={boxHead.x} cy={boxHead.y} r={BOX_TIP} fill={ink} />
                        </>
                      ) : null}
                    </g>
                  ) : null}

                  {/* the ring: cut 1's "what was looked at", still there */}
                  <g style={{ filter: icon }}>
                    <circle
                      cx={RING_CX}
                      cy={RING_CY}
                      r={RING_R}
                      fill="none"
                      stroke={ink}
                      strokeWidth={RING_STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                    />
                  </g>
                </>
              ) : null}
            </g>
          ))}
        </svg>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AllTheRelevantData;
