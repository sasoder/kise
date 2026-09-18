import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { arriveEase } from "./levelUp";
import {
  ANG_MID,
  DASH_OFF,
  DASH_ON,
  EVALUATOR,
  FOLDER,
  FOLDER_R,
  GAZE_LEN,
  INK,
  MARCH_W,
  MODEL_HOME,
  MODEL_MARK,
  PACKET_R,
  PERSON_H,
  QUESTION,
  STATION_R,
  STROKE_W,
  THREAD_W,
  TWO_PI,
  Tableau,
  TableauState,
  WALL,
  angleTo,
  camKnots3,
  runCam3,
} from "./trapShared";
import { CAM_AT as CAM3_AT, STATE_AT as STATE3_AT } from "./AnswerKeyInTheFolder";
import { CAM_AT as CAM4_AT, STATE_AT as STATE4_AT } from "./SeemsLikeATrap";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Trap`, the BRIDGE between cut 3 and cut 4:
// `DoesItTellYou`.
// Line (SRT in-point 30.980 s, on "and" — exactly where cut 3's speech ends):
//   "and if it does look at the answer key, does it tell you that it looked at
//    the answer key? [and we have ...]"
//
// DURATION. Every beat is frame = round((t - 30.980) * 24):
//   and f0 · if f5 · it f7 · does f9 · look f12 · at f14 · the f16 · answer f18 ·
//   key f22 · does f26 · it f27 · tell f28 · you f32 · that f34 · it f36 ·
//   looked f37 · at f40 · the f42 · answer f44 · key f48-55 · and f55 · we f59 ·
//   have f61 · [cut 4's in-point is f66]
// Cut 4 starts on f66 and the set's 16-frame tail runs under it:
// DURATION = 66 + 16 = 82. The tail is normally COVERED by cut 4, so it does
// not resolve anything of its own — it simply holds cut 4's own f0 picture,
// alive, on cut 4's own camera (see CAMERA).
export const DURATION = 82;
/** The frame cut 4 is laid over: everything here must equal cut 4's f0. */
export const JOIN = 66;

// ---------------------------------------------------------------------------
// WHAT THIS CUT IS. Cuts 3 -> bridge -> 4 are ONE CONTINUOUS 15-SECOND PICTURE,
// so this file owns almost nothing: the standing tableau is cut 3's, drawn
// through the shared `Tableau`, and the only new ink is TWO DASHED ACCENT LINES
// that are asked about and then taken back.
//
// The line is a hypothetical — "IF it does look ... does it TELL you" — and the
// clip's one idea is DASHED = imagined, SOLID = real. So the real needle does
// not move (it has not looked; cut 4 is where it actually swings), and what the
// sentence asks about is drawn as two DASHED continuations of that needle,
// which both dissolve back into it. Nothing that happens here may survive into
// cut 4, because cut 4's f0 is cut 3's picture unchanged.
//
// SOUND-OFF READING TEST — one sentence:
//   "the hovering needle sprouts a dashed branch that finishes the reach to the
//    folder, a second dashed branch runs up out of the ring and off the top of
//    the frame with two beads on it — and then both are pulled back in, leaving
//    the needle hovering exactly where it was."
//
// ---------------------------------------------------------------------------
// THE JOINS — this cut is butted against a delivered cut at BOTH ends, so both
// are contracts, not copies: the camera and the standing state are IMPORTED
// from the neighbours (`AnswerKeyInTheFolder.CAM_AT/STATE_AT` and
// `SeemsLikeATrap.CAM_AT/STATE_AT`) and `JOIN_CHECK` throws at module scope if
// any field of this cut's f0 or f66 has drifted from them.
//
//   f0  = cut 3 at ITS SPEECH-END FRAME f152 (not its last frame f167: the
//         editor lays a cut on its in-point, on top of the previous cut's
//         16-frame tail).
//   f66 = cut 4 at ITS f0.
//
// THE CLOCKS. Everything that never stops in this clip is periodic, and the two
// ends want different phases of it, so the bridge's clock is cut 3's own clock
// RE-RATED so that it lands on a phase cut 4 agrees with:
//   c(f) = 152 + f * 72/66   (c(0) = 152, c(66) = 224)
// 224 is 14 x the 16-frame packet period, so the work thread's packet is in
// exactly cut 4's f0 position at the join; the whole clock runs 9.1% fast for
// 66 frames, which is 2.7 s of a marching dash pattern and a 57-frame breath.
// Measured residuals at f66 (`STATS.joinF66`): work packet 0.000 world px, the
// wall's dash pattern 1.85 world px = 2.43 screen px (224 mod the 73.33-frame
// dash period is 4.0 frames of march — cut 4's own delivered join to cut 3 is
// 20.3 frames = 12.3 screen px out, so this is five times tighter than the
// join the set already ships), the mark's breath 0.23 screen px of em box.
// Rendered and difference-blended against both neighbours' own stills: f0
// against cut 3's f152 has NO pixel differing by more than 7 of 255 anywhere
// (that is the grid's own -0.3 px/frame drift, which the set does not carry
// across any of its joins either) and f66 against cut 4's f0 differs ONLY
// inside the wall's own box, on the ends of its dashes.
// The key's bob and the needle's drift are this cut's own expressions and are
// re-rated the same way — bob 0.157 -> 0.1309 rad/f, drift 0.105 -> 0.1191 —
// so they arrive on cut 4's f0 value EXACTLY (both checked in JOIN_CHECK).
//
// ---------------------------------------------------------------------------
// GESTURES — two, overlapping, and nothing else. The speech is fast (23 words
// in 2.75 s), so the piece is one continuous fork-and-withdraw rather than a
// list of events.
//
//  1. f5-16   "if it does look at   THE IMAGINED LOOK. From the hovering
//             the answer key"       needle's TIP a DASHED accent branch runs on
//             (f5/f12/f16/f18/f22)  to the folder ring's edge — the reach the
//                                   needle stopped half-way through in cut 3,
//                                   finished in the conditional. It lands on
//                                   the ring at f16 ("the/answer") and rests
//                                   there through "key" (f22). The real needle
//                                   does NOT move: it has not looked. The key
//                                   goes on bobbing for the same reason —
//                                   nothing has actually happened to it.
//  2. f19-38  "does it tell you"    THE IMAGINED REPORT. Three frames after the
//             (f26/f28/f32)         look lands — it is caused by it — a second
//                                   DASHED accent branch leaves the same tip
//                                   and runs STRAIGHT UP: out through the
//                                   dashed wall on f29 ("tell", f28) and off
//                                   the top of the frame on f37, toward the
//                                   person standing out there off frame. The
//                                   head is speed-solved against the camera and
//                                   peaks at 43.3 screen px/frame, under the
//                                   set's 45 (`STATS.report`).
//  3. f34-53  "that it looked at    TWO BEADS, AND NEITHER GETS OUT. Two accent
//             the answer key"       packets leave the tip and ride up the line
//             (f34/f37/f44/f48)     at 30 world px/frame (39.5 screen px). A
//                                   bead only exists BEHIND the head, so when
//                                   the line is withdrawn its own head sweeps
//                                   them up on f49 and f53 — nothing was ever
//                                   actually sent, which is the whole point of
//                                   a conditional.
//  4. f45-63  "at the answer key"   THE WITHDRAWAL. The report line un-draws
//             -> "and we have"      from its head back into the tip. It starts
//             (f48-55/f55/f59/f61)  off frame, so there is no start to see —
//                                   what is seen is the line leaving the top of
//                                   the frame — and it decelerates into the tip
//                                   over its last 90 world px.
//  5. f48-54  (with 4)              ...and the look branch un-draws the same
//                                   way, so the two do not vanish in unison.
//  6. f63-66  (no word)             SETTLED: exactly cut 4's f0 picture, three
//                                   frames before cut 4 is laid on top of it.
//  7. f0-81   (no word)             THE CAMERA: one slow glide, see below.
//
// LIVENESS — mechanisms, not gestures, so no window is still even when the two
// branches are between moves: the wall's dashes march every frame, both
// branches' dashes march with them, the work thread's packet shuttles to the
// question and back the whole cut, the mark breathes, the key bobs (cut 3's own
// sine, re-rated), the needle hovers on cut 3's own drift sine, the grid has
// its parallax and its -0.3 px/frame drift, and the camera never parks
// (`STATS.camAudit.minMeanSpeed`).
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//  * THE REPORT LINE LEAVES FROM THE NEEDLE'S TIP, NOT FROM THE MARK. The brief
//    asks for it "from the mark ... straight UP". Straight up from the mark IS
//    the needle's own bearing — the needle rests at ANG_MID, which in this
//    tableau is exactly -90 deg — so a line from the mark would spend its first
//    205 world px underneath the needle and only become visible at the tip
//    anyway. Drawing it from the tip is the same picture with no doubled ink,
//    and it makes the two hypotheticals ONE gesture: a solid (real) needle that
//    forks into two dashed (imagined) continuations, both of which are taken
//    back. It is still the model's line: the needle is its first 205 px.
//
//  * THE REPORT LINE LEAVES 7 FRAMES BEFORE ITS WORD. The brief asks for the
//    head to cross the wall at f30 and leave the frame at f34, from a departure
//    on f26. The tip is 270 world px under the wall's top and 535 under the
//    head's off-frame rest, and the set's ceiling is 45 screen px/frame = 34.2
//    world px/frame at this camera: 270 px is 7.9 frames of travel and 535 px
//    is 15.6 even before the ease off the tip, so f26 -> f30 would need 92 world
//    px/frame and f26 -> f34 would need 67. The departure is moved to f19
//    instead — three frames after the imagined look lands on the folder, which
//    is what causes it — and the head then makes the brief's own beat: it
//    crosses the wall on f29, one frame before f30. It leaves the frame on f37
//    rather than f34; "you" (f32) lands between the two, on a head that is above
//    the wall and climbing out of the frame.
//
//  * THE WITHDRAWAL IS ONE FRAME LONGER THAN THE BRIEF'S "gone by f62". Same
//    ceiling backwards: 535 world px is 15.6 frames at 45 screen px/frame, plus
//    the deceleration into the tip. It starts on f45 (its first 26 px are off
//    frame, so nothing is seen starting) and the line is gone on f63, three
//    frames before the join.
//
//  * NEITHER BEAD LEAVES THE FRAME. The brief has two or three riding up during
//    "that it looked at the answer key" (f34-48). A bead launched on f34 at the
//    set's packet speed needs until f51 to reach the top edge, and the line's
//    own head is back below that by f47, so a bead can only get out if it is
//    launched before "that" (f30) and run at the head's own speed. It is better
//    the other way round: the withdrawal catches both beads and takes them home
//    with it. Nothing was sent — the sentence is a question, not an event.
//
//  * BOTH BRANCHES ARE DRAWN IN `Tableau`'s `under` SLOT, i.e. behind the wall
//    and behind the stations. That is where the needle's own relationship to
//    the folder ring lives (the gaze is drawn before the stations, so the ring
//    occludes a tip that lands on it) and it is what makes the look branch read
//    as touching the ring rather than lying over it. The cost is that the
//    report line passes BEHIND the wall's dashes where it crosses them.
//
// ---------------------------------------------------------------------------
// CAMERA — one slow glide, and nothing else; the brief asks for no other move
// and the two ends are 4.3 world px apart. Knots on the shared monotone cubic
// Hermite (`camKnots3`), one key per frame, through the shared damper
// (`runCam3`), with the third channel for the pan. `y` is the world point
// CAM_LIFT puts on screen y 835.
//
//   f -26  pre-roll: the f0 knot with cut 3's own tail creep (+0.00024 of k and
//          +0.045 world px of content y per frame) run backwards, so f0 is not a
//          standing start and the damper never sees a step
//   f   0  cut 3's camera at ITS f152, imported: k 1.3149, cx 540.96, cy 1028.25
//   f  66  cut 4's camera at ITS f0, imported: k 1.3163, cx 540.00, cy 1023.99
//          (both knots are SOLVED — 40 fixed correction passes — so that the
//          DAMPED track, plus this cut's own sway, lands exactly on them;
//          `STATS.joinCam` is the residual: 0.0000 on all six numbers)
//   f  96  cut 4's own f30 knot (k 1.412, x 576, y 900), and
//   f 122  cut 4's own f56 knot (k 1.523, x 594, y 873), so that the 16-frame
//          tail runs on into cut 4's own creep instead of parking — if the
//          editor lets a few frames of it show, they are cut 4's own move.
//
// Between the two joins the knots are sampled off two smooth channels: the
// TRANSLATION (cx -0.96, cy -4.26 world px, spent over f18-46) and the ZOOM
// (the 1.06% ease-back and return described at ZOOM_EASE, which is what keeps
// the frame alive through the sway's own null). The whole camera is 4.7 screen
// px of zoom and 4.3 world px of pan: it is a glide between two frames that are
// already the same frame, and nothing in it reads as a move.
//
// The EVALUATOR stays fully OFF FRAME for all 82 frames (`STATS.evaluator`):
// cut 4's reveal of the watcher is not spoiled here. The report line's head
// stops at world y 270, which is 17 world px BELOW their feet (253.1) and at
// least 24 world px ABOVE the top edge of the frame at its lowest — it leaves
// the frame and stops, off frame, without ever touching them.
// ---------------------------------------------------------------------------

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
    and: z.number(),
    iff: z.number(),
    look: z.number(),
    answer: z.number(),
    key: z.number(),
    does2: z.number(),
    tell: z.number(),
    you: z.number(),
    that: z.number(),
    looked: z.number(),
    answer2: z.number(),
    key2: z.number(),
    join: z.number(), // cut 4's in-point; tail to 82
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
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  beats: {
    and: 0,
    iff: 5,
    look: 12,
    answer: 18,
    key: 22,
    does2: 26,
    tell: 28,
    you: 32,
    that: 34,
    looked: 37,
    answer2: 44,
    key2: 48,
    join: 66,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// THE CLOCK. One scalar, handed to `Tableau`, driving every never-stopping
// mechanism it owns (the wall's march, the mark's breath, the work thread's
// packets). See THE CLOCKS above for why it is re-rated rather than f + 152.
// ---------------------------------------------------------------------------
const CLOCK_0 = 152; // cut 3's speech-end frame
const CLOCK_JOIN = 224; // 14 x the 16-frame packet period
const CLOCK_RATE = (CLOCK_JOIN - CLOCK_0) / JOIN;
const clockAt = (f: number) => CLOCK_0 + f * CLOCK_RATE;

// The key's bob: cut 3's own 4 world px sine, continued from its phase at f152
// and re-rated so that it is on cut 4's f0 value at the join.
const BOB_A = 4;
const BOB_PH0 = (152 - 120) * 0.157; // cut 3's phase at its f152
const BOB_PH1 = (0 + 47) * 0.157 + TWO_PI; // cut 4's at its f0, one turn on
const BOB_W = (BOB_PH1 - BOB_PH0) / JOIN;
const keyBobAt = (f: number) => BOB_A * Math.sin(BOB_PH0 + BOB_W * f);

// The needle's hover: cut 3's own 3.5 deg drift sine, its amplitude ramp still
// running (it reaches 1 at this cut's f10), re-rated the same way.
const DRIFT_DEG = 3.5;
const DRIFT_PH0 = (152 - 144) * 0.105;
const DRIFT_PH1 = (0 + 23) * 0.105 + TWO_PI;
const DRIFT_W = (DRIFT_PH1 - DRIFT_PH0) / JOIN;
const driftAt = (f: number) =>
  DRIFT_DEG *
  smoothstep(clamp01((152 + f - 144) / 18)) *
  Math.sin(DRIFT_PH0 + DRIFT_W * f);

const gazeAngleAt = (f: number) => ANG_MID + driftAt(f) * DEG;
/** The needle's tip: where both imagined branches fork from. */
const tipAt = (f: number) => {
  const a = gazeAngleAt(f);
  return { x: MODEL_HOME.x + Math.cos(a) * GAZE_LEN, y: MODEL_HOME.y + Math.sin(a) * GAZE_LEN };
};

// ---------------------------------------------------------------------------
// THE CAMERA. Both ends are imported from the neighbours, so the join is a
// contract and not a copied number; the two knots are then SOLVED so that the
// DAMPED track plus this cut's own sway lands exactly on them (the damper lags
// its target, and this cut's sway phase is not cut 3's).
// ---------------------------------------------------------------------------
const PRE = 26;
/** cut 3's tail creep, per frame, which the pre-roll runs backwards. */
const TAIL_DK = 0.00024;
const TAIL_DY = 0.045;

type Knot = { k: number; x: number; y: number };
const J0 = CAM3_AT(152);
const J66 = CAM4_AT(0);
const SW = sway(JOIN);
/** What the DAMPED track has to read, i.e. the join minus this cut's own sway
 *  (sway(0) is 0, so f0's target is the join itself). */
const D0 = { cx: J0.cx, cy: J0.cy, k: J0.k };
const D66 = { cx: J66.cx - SW.dx, cy: J66.cy - SW.dy, k: J66.k };

/** The glide's translation is spent between these two frames rather than spread
 *  over all 66, so that it is moving where the shared `sway` is not. */
const GLIDE_F0 = 18;
const GLIDE_F1 = 46;
/** THE GLIDE IS CARRIED ON THE ZOOM. The two ends of this bridge are 4.3 world
 *  px and 0.11% of k apart, which is not enough camera to keep a frame alive for
 *  66 frames: the shared sway is bigger than the whole glide (its dy swings 6.6
 *  world px across this cut), and sway's dy turns round at f29.8 and its dx at
 *  f36.1, so ANY translation-only glide is cancelling the sway somewhere in
 *  f24-34. Measured, spread evenly it left the frame dead there — 0.024 screen
 *  px/frame at f26, where the three delivered cuts never go under 0.154.
 *
 *  A zoom cannot cancel like that: it moves every point along its own radius
 *  from the frame's centre, so a uniform sway can only cancel it for some of
 *  them. This is the device cut 3 already uses for exactly this reason ("the
 *  liveness is now +1.5% of zoom over the same stretch"). Here it is a 1.06%
 *  EASE-BACK and return — k 1.3149 -> 1.3010 -> cut 4's 1.3163, which is 4.7
 *  screen px on the wall's side, 0.19 px/frame: the camera opens up while the
 *  report line climbs out of the top of the frame (it is giving the gesture
 *  room, and it is at its widest on the frame the head leaves) and closes back
 *  in as the line is withdrawn. It reads as the frame breathing rather than as
 *  a move, and it is the only thing in this cut the camera does.
 *
 *  0.016 is the SMALLEST ease that clears the set's own floor, swept against it:
 *  0.013 -> 0.121 screen px/frame at worst, 0.016 -> 0.164, 0.020 -> 0.201,
 *  0.024 -> 0.222, against cut 3's 0.159 and cut 4's 0.154. */
const ZOOM_EASE = 0.016;
/** The ease-back's own turning point, and where it is home. NOT the middle of
 *  the cut: the sway's dy turns round at f29.8 and its dx at f36.1, and the
 *  damper puts the zoom's own turn ~8 frames after its knot, so a knot at f22
 *  stalls with the sway (measured 0.038) while f36 has the zoom running at its
 *  fastest right through the sway's null (0.164). */
const ZOOM_BOTTOM = 36;
const ZOOM_HOME = 64;

const knotsFor = (B: Knot, C: Knot) => {
  // the two channels as smooth functions, sampled into knots: the translation
  // glide over f18-46, and the zoom's ease-back and return over f0-58.
  const u = (f: number) => smoothstep(clamp01((f - GLIDE_F0) / (GLIDE_F1 - GLIDE_F0)));
  const dip = (f: number) =>
    f <= ZOOM_BOTTOM
      ? smoothstep(clamp01(f / ZOOM_BOTTOM))
      : 1 - smoothstep(clamp01((f - ZOOM_BOTTOM) / (ZOOM_HOME - ZOOM_BOTTOM)));
  const at = (f: number) => ({
    f: PRE + f,
    k: B.k + (C.k - B.k) * u(f) - ZOOM_EASE * dip(f),
    x: B.x + (C.x - B.x) * u(f),
    y: B.y + (C.y - B.y) * u(f),
  });
  return [
    { f: 0, k: B.k - TAIL_DK * PRE, x: B.x, y: B.y - TAIL_DY * PRE },
    ...[0, 7, 14, 22, 30, 38, 46, 54, 62, JOIN].map(at),
    // cut 4's own f30 and f56 knots, so the covered tail is cut 4's own creep
    { f: PRE + JOIN + 30, k: 1.412, x: 576, y: 900 },
    { f: PRE + JOIN + 56, k: 1.523, x: 594, y: 873 },
  ];
};

const SOLVED = (() => {
  let B: Knot = { k: D0.k, x: D0.cx, y: D0.cy - CAM_LIFT / D0.k };
  let C: Knot = { k: D66.k, x: D66.cx, y: D66.cy - CAM_LIFT / D66.k };
  let r0 = { k: 0, cx: 0, cy: 0 };
  let r66 = { k: 0, cx: 0, cy: 0 };
  for (let i = 0; i < 40; i++) {
    const t = camKnots3(knotsFor(B, C), PRE + DURATION + 80);
    const g0 = runCam3(PRE, t.CX, t.CY, t.K);
    const g66 = runCam3(PRE + JOIN, t.CX, t.CY, t.K);
    r0 = { k: D0.k - g0.k, cx: D0.cx - g0.cx, cy: D0.cy - g0.cy };
    r66 = { k: D66.k - g66.k, cx: D66.cx - g66.cx, cy: D66.cy - g66.cy };
    B = { k: B.k + r0.k, x: B.x + r0.cx, y: B.y + r0.cy };
    C = { k: C.k + r66.k, x: C.x + r66.cx, y: C.y + r66.cy };
  }
  const worst = Math.max(
    Math.abs(r0.k),
    Math.abs(r66.k),
    Math.abs(r0.cx) / 100,
    Math.abs(r66.cx) / 100,
    Math.abs(r0.cy) / 100,
    Math.abs(r66.cy) / 100,
  );
  if (!(worst < 1e-6)) {
    throw new Error(`DoesItTellYou: the camera join did not solve (worst ${worst}).`);
  }
  return { B, C, r0, r66 };
})();

const CAM = camKnots3(knotsFor(SOLVED.B, SOLVED.C), PRE + DURATION + 80);

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCam3(f + PRE, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: c.cx + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 2, Math.round(f)));
const camAt = (f: number) => CAM_AT_F[clampF(f)];
const kAt = (f: number) => camAt(f).k;
/** Where a world point sits on screen at frame `f`. */
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: WORLD_W / 2 + (wx - c.cx) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};
/** The world y of the top edge of the frame — what "off frame" means here. */
const frameTopAt = (f: number) => camAt(f).cy - WORLD_H / 2 / camAt(f).k;

// ---------------------------------------------------------------------------
// BRANCH 1 — THE IMAGINED LOOK: the tip -> the folder ring's nearest edge. It
// is short (74.8 world px, 98 screen px) because the needle is already
// half-way: this is the rest of the reach, drawn as a conditional.
// ---------------------------------------------------------------------------
const LOOK_F0 = 5; // "if it does look"
const LOOK_F1 = 16; // lands on the ring, under "the answer"
const LOOK_OFF0 = 48; // "key" — the question is complete
const LOOK_OFF1 = 54;

/** The branch's own geometry at `f`: it hangs off the drifting tip, so it
 *  wobbles with the hand rather than being pinned to the world. */
const lookAt = (f: number) => {
  const from = tipAt(f);
  const a = angleTo(from, FOLDER);
  const full = Math.hypot(FOLDER.x - from.x, FOLDER.y - from.y) - FOLDER_R;
  const grow = arriveEase(clamp01((f - LOOK_F0) / (LOOK_F1 - LOOK_F0)));
  const back = arriveEase(clamp01((f - LOOK_OFF0) / (LOOK_OFF1 - LOOK_OFF0)));
  return { from, a, full, len: full * grow * (1 - back) };
};

// ---------------------------------------------------------------------------
// BRANCH 2 — THE IMAGINED REPORT: the tip, straight up, through the wall and
// out of the top of the frame. The head's speed is integrated forward at
// min(REP_V, REP_CAP / k(f)) so it is never over the set's screen ceiling, with
// an ease off the tip and a taper into the far end; the landing frame is
// therefore SOLVED, not keyed (`STATS.report`). The withdrawal is the same
// integral backwards, with no ease at its start (it starts off frame, where
// there is nothing to see) and a longer taper into the tip.
// ---------------------------------------------------------------------------
const REP_F0 = 19; // three frames after the look lands: it is caused by it
const REP_BACK_F0 = 45;
/** The world y the head stops at: off frame, and 17 world px below the
 *  evaluator's feet, so it never touches the person cut 4 reveals. */
const REP_TOP = 270;
const REP_LEN = MODEL_HOME.y - GAZE_LEN - REP_TOP;
const REP_V = 34; // world px/frame nominal
// 43, not the set's own 45: the cap is applied to the head's world speed under
// the camera's k, and the head is ALSO carried by the camera, whose sway is
// moving while it climbs. At 45 the measured screen speed of the head peaked at
// 45.2 px/frame on f60; at 43 it peaks at `STATS.report.headMaxScreenPxPerF`.
const REP_CAP = 43; // screen px/frame — under the set's 45 ceiling
const REP_EASE = 4; // frames of ease as it leaves the tip
const REP_TAPER = 0.18; // the fraction of the run it decelerates over
const REP_BACK_TAPER = 90; // world px of deceleration into the tip

const REPORT = (() => {
  const s: number[] = new Array(DURATION + 3).fill(0);
  let cur = 0;
  let land = -1;
  let cross = -1; // the wall
  let leave = -1; // the top of the frame
  for (let f = REP_F0 + 1; f <= DURATION + 2; f++) {
    if (f <= REP_BACK_F0) {
      if (cur < REP_LEN) {
        const v =
          Math.min(REP_V, REP_CAP / kAt(f)) *
          smoothstep(clamp01((f - REP_F0) / REP_EASE)) *
          (1 - 0.55 * smoothstep(clamp01((cur / REP_LEN - (1 - REP_TAPER)) / REP_TAPER)));
        cur = Math.min(REP_LEN, cur + v);
        if (land < 0 && cur >= REP_LEN - 1e-6) land = f;
      }
    } else if (cur > 0) {
      const v =
        Math.min(REP_V, REP_CAP / kAt(f)) * (0.32 + 0.68 * smoothstep(cur / REP_BACK_TAPER));
      cur = Math.max(0, cur - v);
    }
    s[f] = cur;
    const headY = MODEL_HOME.y - GAZE_LEN - cur;
    if (cross < 0 && headY <= WALL.cy - WALL.r) cross = f;
    if (leave < 0 && headY <= frameTopAt(f)) leave = f;
  }
  let gone = -1;
  for (let f = REP_BACK_F0; f <= DURATION + 2; f++) {
    if (s[f] <= 0) {
      gone = f;
      break;
    }
  }
  if (land < 0 || gone < 0 || gone > JOIN - 2) {
    throw new Error(
      `DoesItTellYou: the report line does not fit (land f${land}, gone f${gone}).`,
    );
  }
  return { s, land, cross, leave, gone };
})();

const reportLen = (f: number) => REPORT.s[clampF(f)];

// ---------------------------------------------------------------------------
// THE BEADS on the report line: two accent packets, out along it, for "that it
// looked at the answer key". A bead only exists while it is BEHIND the head, so
// the first one leaves the frame and the second is swept up by the head coming
// home — the withdrawal takes the unanswered question with it.
// ---------------------------------------------------------------------------
const BEAD_AT = [34, 42];
const BEAD_V = 30; // world px/frame

// ---------------------------------------------------------------------------
// THE BRANCHES' DASH. The set's pattern is 26 on / 18 off at the set's 6 px
// stroke — 4.33 and 3.0 stroke-widths. These two branches are drawn at THREAD
// stroke, which is half of that, so the same ratio is 13 / 9 screen px and the
// pattern is the set's, scaled with the weight it is drawn at. At the set's own
// 26 / 18 the look branch (92 screen px of line) held ONE dash and part of a
// second and read as a stray mark rather than as a dashed line; at 13 / 9 it
// holds four. The MARCH is untouched — 0.6 screen px/frame, on this cut's
// clock, so the branches march with the wall.
// ---------------------------------------------------------------------------
const BRANCH_DASH_SCALE = THREAD_W / STROKE_W;
const BRANCH_DASH_ON = DASH_ON * BRANCH_DASH_SCALE;
const BRANCH_DASH_OFF = DASH_OFF * BRANCH_DASH_SCALE;

const beadsAt = (f: number) => {
  const head = reportLen(f);
  const out: number[] = [];
  for (const t0 of BEAD_AT) {
    const d = (f - t0) * BEAD_V;
    if (d > 0 && d <= head) out.push(d);
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE STATE. Cut 3's resolved picture, standing, with two fields moving: the
// key's bob and the needle's hover. `Tableau` draws it in the one legal
// z-order, so this bridge cannot drift from either neighbour.
// ---------------------------------------------------------------------------
const stateAt = (frame: number): TableauState => ({
  frame: clockAt(frame),
  wallDraw: 1,
  questionDraw: 1,
  questionIconDraw: 1,
  folderDraw: 1,
  folderIconDraw: 1,
  keyRise: 1,
  keyBob: keyBobAt(frame),
  folderDashed: 0,
  workThread: 1,
  workPackets: true,
  gazeAngle: gazeAngleAt(frame),
  gazeLength: GAZE_LEN,
  wire: 0,
  modelTone: 1,
  modelOffset: { x: 0, y: 0 },
  evaluatorOpacity: 1,
});

// ---------------------------------------------------------------------------
// THE JOIN CHECK. Both neighbours export their own state; if either end of this
// bridge ever stops being their frame, the render fails here rather than in the
// edit. `frame` is excluded on purpose (it is the re-rated clock, see above)
// and is measured in `STATS.joinF66` instead.
// ---------------------------------------------------------------------------
const JOIN_CHECK = (() => {
  const num = (s: TableauState, key: string): number => {
    const v = (s as unknown as Record<string, unknown>)[key];
    if (v === undefined) {
      return key === "modelScale" || key.endsWith("Draw") || key === "workThread" ? 1 : 0;
    }
    return typeof v === "boolean" ? (v ? 1 : 0) : (v as number);
  };
  const KEYS = [
    "wallDraw",
    "questionDraw",
    "questionIconDraw",
    "questionDashed",
    "folderDraw",
    "folderIconDraw",
    "keyRise",
    "keyBob",
    "folderDashed",
    "workThread",
    "workPackets",
    "gazeAngle",
    "gazeLength",
    "wire",
    "eye",
    "modelTone",
    "modelScale",
    "modelRotate",
    "evaluatorOpacity",
  ];
  const cmp = (label: string, mine: TableauState, theirs: TableauState) => {
    const bad: string[] = [];
    for (const key of KEYS) {
      const a = num(mine, key);
      const b = num(theirs, key);
      if (Math.abs(a - b) > 1e-9) bad.push(`${key} ${a} != ${b}`);
    }
    for (const [ax, bx] of [
      [mine.modelOffset.x, theirs.modelOffset.x],
      [mine.modelOffset.y, theirs.modelOffset.y],
    ]) {
      if (Math.abs(ax - bx) > 1e-9) bad.push(`modelOffset ${ax} != ${bx}`);
    }
    if (bad.length > 0) {
      throw new Error(`DoesItTellYou: ${label} is not the neighbour's frame — ${bad.join("; ")}`);
    }
    return true;
  };
  return {
    f0: cmp("f0", stateAt(0), STATE3_AT(152)),
    f66: cmp(`f${JOIN}`, stateAt(JOIN), STATE4_AT(0)),
    branchesClear:
      reportLen(JOIN) === 0 && lookAt(JOIN).len === 0 && beadsAt(JOIN).length === 0
        ? true
        : (() => {
            throw new Error("DoesItTellYou: an imagined branch is still drawn on the join frame.");
          })(),
  };
})();

// ---------------------------------------------------------------------------

const DoesItTellYou: React.FC<Props> = ({
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
}) => {
  const frame = useCurrentFrame();
  const cam = runCam3(frame + PRE, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const march = -clockAt(frame) * MARCH_W;
  const look = lookAt(frame);
  const tip = look.from;
  const head = reportLen(frame);
  const beads = beadsAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[PRE]}
        cx={cx}
        cxRest={CAM.CX[PRE]}
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
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <Tableau
            state={stateAt(frame)}
            k={k}
            worldW={WORLD_W}
            worldH={WORLD_H}
            under={
              look.len > 0 || head > 0 ? (
                // THE TWO IMAGINED BRANCHES. Accent, because they are the
                // model's own attention; DASHED at the set's pattern and
                // marching with the wall, because they are imagined; half
                // stroke, because that is what a thread is.
                <g style={{ filter: iconShadow(k) }}>
                  {look.len > 0 ? (
                    <line
                      x1={tip.x}
                      y1={tip.y}
                      x2={tip.x + Math.cos(look.a) * look.len}
                      y2={tip.y + Math.sin(look.a) * look.len}
                      stroke={ACCENT}
                      strokeWidth={THREAD_W}
                      strokeLinecap="butt"
                      strokeDasharray={`${BRANCH_DASH_ON} ${BRANCH_DASH_OFF}`}
                      strokeDashoffset={march}
                    />
                  ) : null}
                  {head > 0 ? (
                    <line
                      x1={tip.x}
                      y1={tip.y}
                      x2={tip.x}
                      y2={tip.y - head}
                      stroke={ACCENT}
                      strokeWidth={THREAD_W}
                      strokeLinecap="butt"
                      strokeDasharray={`${BRANCH_DASH_ON} ${BRANCH_DASH_OFF}`}
                      strokeDashoffset={march}
                    />
                  ) : null}
                  {beads.map((d, i) => (
                    <circle key={`b${i}`} cx={tip.x} cy={tip.y - d} r={PACKET_R} fill={ACCENT} />
                  ))}
                </g>
              ) : null
            }
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default DoesItTellYou;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  iff: defaultProps.beats.iff,
  answer: defaultProps.beats.answer,
  tell: defaultProps.beats.tell,
  you: defaultProps.beats.you,
  key2: defaultProps.beats.key2,
  join: defaultProps.beats.join,
};

export const CAM_AT = (f: number) => camAt(f);
export const STATE_AT = (f: number) => stateAt(f);

// ---------------------------------------------------------------------------
// MEASUREMENTS. Every claim in the header and in the report is read off this.
// ---------------------------------------------------------------------------
const EV_INK_TOP = EVALUATOR.y - (PERSON_H * 0.84) / 2;
const EV_INK_BOTTOM = EVALUATOR.y + (PERSON_H * 0.84) / 2;

export const STATS = {
  duration: DURATION,
  join: JOIN,
  joinCheck: JOIN_CHECK,

  /** The camera join, as the DAMPED track plus this cut's sway reads it against
   *  the neighbours' own exported cameras. */
  joinCam: {
    f0: {
      mine: [camAt(0).k, camAt(0).cx, camAt(0).cy].map((v) => Number(v.toFixed(4))),
      cut3: [J0.k, J0.cx, J0.cy].map((v) => Number(v.toFixed(4))),
      resid: [camAt(0).k - J0.k, camAt(0).cx - J0.cx, camAt(0).cy - J0.cy].map((v) =>
        Number(v.toFixed(6)),
      ),
    },
    f66: {
      mine: [camAt(JOIN).k, camAt(JOIN).cx, camAt(JOIN).cy].map((v) => Number(v.toFixed(4))),
      cut4: [J66.k, J66.cx, J66.cy].map((v) => Number(v.toFixed(4))),
      resid: [camAt(JOIN).k - J66.k, camAt(JOIN).cx - J66.cx, camAt(JOIN).cy - J66.cy].map((v) =>
        Number(v.toFixed(6)),
      ),
    },
    glide: {
      dk: Number((J66.k - J0.k).toFixed(5)),
      dcx: Number((J66.cx - J0.cx).toFixed(3)),
      dcy: Number((J66.cy - J0.cy).toFixed(3)),
    },
  },

  /** The clocks at the join, in the units the eye reads them in. */
  joinF66: (() => {
    const c = clockAt(JOIN);
    const dashPeriod = (DASH_ON + DASH_OFF) / MARCH_W; // frames of march
    const dashOut = ((c % dashPeriod) + dashPeriod) % dashPeriod;
    const breathPhase = (c * 0.11) % TWO_PI;
    const breathMine = 1 + 0.05 * Math.sin(c * 0.11 + 0.31 * 6.28);
    const breathTheirs = 1 + 0.05 * Math.sin(0 + 0.31 * 6.28);
    return {
      clock: Number(c.toFixed(3)),
      clockRate: Number(CLOCK_RATE.toFixed(4)),
      workPacketPhaseFrames: Number((c % 16).toFixed(4)),
      dashOutFrames: Number(Math.min(dashOut, dashPeriod - dashOut).toFixed(3)),
      dashOutScreenPx: Number(
        (Math.min(dashOut, dashPeriod - dashOut) * MARCH_W * kAt(JOIN)).toFixed(2),
      ),
      breathPhaseRad: Number(breathPhase.toFixed(3)),
      breathEmScreenPx: Number(
        (Math.abs(breathMine - breathTheirs) * MODEL_MARK * kAt(JOIN)).toFixed(3),
      ),
      keyBob: [Number(keyBobAt(JOIN).toFixed(6)), Number((STATE4_AT(0).keyBob ?? 0).toFixed(6))],
      gazeDeg: [
        Number((gazeAngleAt(JOIN) / DEG).toFixed(6)),
        Number(((STATE4_AT(0).gazeAngle as number) / DEG).toFixed(6)),
      ],
    };
  })(),

  /** The report line: the solved landing, the wall crossing, the frame exit,
   *  the withdrawal, and the head's worst screen speed either way. */
  report: (() => {
    let worst = { f: -1, v: 0 };
    for (let f = REP_F0 + 1; f <= LAST; f++) {
      const a = MODEL_HOME.y - GAZE_LEN - reportLen(f - 1);
      const b = MODEL_HOME.y - GAZE_LEN - reportLen(f);
      const v = Math.abs(
        screenAt(f, MODEL_HOME.x, b).y - screenAt(f - 1, MODEL_HOME.x, a).y,
      );
      if (v > worst.v) worst = { f, v };
    }
    return {
      f0: REP_F0,
      lenWorld: Number(REP_LEN.toFixed(1)),
      land: REPORT.land,
      wallCross: REPORT.cross,
      frameLeave: REPORT.leave,
      backF0: REP_BACK_F0,
      gone: REPORT.gone,
      headMaxScreenPxPerF: [worst.f, Number(worst.v.toFixed(1))],
      lenAt: [19, 24, 29, 32, 36, 40, 46, 52, 58, 62, 63].map((f) => [
        f,
        Number(reportLen(f).toFixed(1)),
      ]),
    };
  })(),

  /** The look branch: its length, its landing, and its own worst speed. */
  look: (() => {
    let worst = { f: -1, v: 0 };
    for (let f = LOOK_F0 + 1; f <= LAST; f++) {
      const a = lookAt(f - 1);
      const b = lookAt(f);
      const pa = screenAt(f - 1, a.from.x + Math.cos(a.a) * a.len, a.from.y + Math.sin(a.a) * a.len);
      const pb = screenAt(f, b.from.x + Math.cos(b.a) * b.len, b.from.y + Math.sin(b.a) * b.len);
      const v = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      if (v > worst.v) worst = { f, v };
    }
    const at16 = lookAt(16);
    return {
      draw: [LOOK_F0, LOOK_F1],
      undraw: [LOOK_OFF0, LOOK_OFF1],
      fullWorld: Number(at16.full.toFixed(1)),
      fullScreenAt16: Number((at16.full * kAt(16)).toFixed(1)),
      headMaxScreenPxPerF: [worst.f, Number(worst.v.toFixed(1))],
      /** the gap from the head to the folder ring on the landing frame */
      tipToRingAt16: Number(
        (
          Math.hypot(
            at16.from.x + Math.cos(at16.a) * at16.len - FOLDER.x,
            at16.from.y + Math.sin(at16.a) * at16.len - FOLDER.y,
          ) - FOLDER_R
        ).toFixed(2),
      ),
    };
  })(),

  beads: {
    launches: BEAD_AT,
    speedScreenPxPerF: Number((BEAD_V * kAt(40)).toFixed(1)),
    aliveAt: [34, 40, 42, 48, 51, 53, 55, 60].map((f) => [f, beadsAt(f).length]),
    /** the frame each bead ends, and whether it went off frame or was swept */
    ends: BEAD_AT.map((t0) => {
      for (let f = t0 + 1; f <= LAST; f++) {
        const d = (f - t0) * BEAD_V;
        if (d > reportLen(f)) {
          const y = MODEL_HOME.y - GAZE_LEN - (d - BEAD_V);
          return [t0, f, y < frameTopAt(f) ? "off frame" : `swept at world y ${y.toFixed(0)}`];
        }
      }
      return [t0, -1, "never"];
    }),
  },

  /** The camera: the screen speed of fixed world points, its frame-to-frame
   *  change (the set's |dv| ceiling is 2.2) and the quietest frame (the
   *  "parked" floor for the mean is 0.15). */
  camAudit: (() => {
    const pts = [
      [WALL.cx - WALL.r, WALL.cy],
      [WALL.cx + WALL.r, WALL.cy],
      [WALL.cx, WALL.cy - WALL.r],
      [WALL.cx, WALL.cy + WALL.r],
      [MODEL_HOME.x, MODEL_HOME.y],
      [QUESTION.x, QUESTION.y],
      [FOLDER.x, FOLDER.y],
    ];
    let maxV = { f: -1, v: 0 };
    let maxDV = { f: -1, v: 0 };
    let minMean = { f: -1, v: Infinity };
    for (let f = 2; f <= LAST; f++) {
      let sum = 0;
      for (const [px, py] of pts) {
        const a = screenAt(f - 2, px, py);
        const b = screenAt(f - 1, px, py);
        const c = screenAt(f, px, py);
        const v1 = Math.hypot(b.x - a.x, b.y - a.y);
        const v2 = Math.hypot(c.x - b.x, c.y - b.y);
        sum += v2;
        if (v2 > maxV.v) maxV = { f, v: v2 };
        if (Math.abs(v2 - v1) > maxDV.v) maxDV = { f, v: Math.abs(v2 - v1) };
      }
      const mean = sum / pts.length;
      if (mean < minMean.v) minMean = { f, v: mean };
    }
    return {
      maxSpeed: [maxV.f, Number(maxV.v.toFixed(2))],
      maxDV: [maxDV.f, Number(maxDV.v.toFixed(3))],
      minMeanSpeed: [minMean.f, Number(minMean.v.toFixed(3))],
    };
  })(),

  /** The caption-safe band and the side margins, per frame. */
  framing: [0, 16, 32, 40, 52, JOIN, LAST].map((f) => ({
    f,
    wallX: [
      Number(screenAt(f, WALL.cx - WALL.r, WALL.cy).x.toFixed(0)),
      Number(screenAt(f, WALL.cx + WALL.r, WALL.cy).x.toFixed(0)),
    ],
    wallY: [
      Number(screenAt(f, WALL.cx, WALL.cy - WALL.r).y.toFixed(0)),
      Number(screenAt(f, WALL.cx, WALL.cy + WALL.r).y.toFixed(0)),
    ],
    model: Number(screenAt(f, MODEL_HOME.x, MODEL_HOME.y).y.toFixed(0)),
    frameTopWorld: Number(frameTopAt(f).toFixed(1)),
  })),

  /** The evaluator must be off frame on every frame of this cut. */
  evaluator: (() => {
    let worst = { f: -1, y: -1e9 };
    for (let f = 0; f <= LAST; f++) {
      const y = screenAt(f, EVALUATOR.x, EV_INK_BOTTOM).y;
      if (y > worst.y) worst = { f, y };
    }
    return {
      feetWorld: Number(EV_INK_BOTTOM.toFixed(1)),
      headWorld: Number(EV_INK_TOP.toFixed(1)),
      closestScreenY: [worst.f, Number(worst.y.toFixed(1))],
      reportHeadWorldY: REP_TOP,
      reportHeadBelowFeetWorld: Number((REP_TOP - EV_INK_BOTTOM).toFixed(1)),
      reportHeadAboveFrameTopWorld: Number(
        Math.min(...Array.from({ length: DURATION }, (_, f) => frameTopAt(f) - REP_TOP)).toFixed(1),
      ),
    };
  })(),

  /** The screen sizes every weight in the set is written against. */
  sizes: {
    kAt: [0, JOIN, LAST].map((f) => [f, Number(kAt(f).toFixed(4))]),
    stroke: Number((STROKE_W * kAt(JOIN)).toFixed(2)),
    thread: Number((THREAD_W * kAt(JOIN)).toFixed(2)),
    dashOnOff: [
      Number((DASH_ON * kAt(JOIN)).toFixed(1)),
      Number((DASH_OFF * kAt(JOIN)).toFixed(1)),
    ],
    markEm: Number((MODEL_MARK * kAt(JOIN)).toFixed(1)),
    station: Number((STATION_R * 2 * kAt(JOIN)).toFixed(1)),
    packet: Number((PACKET_R * kAt(JOIN)).toFixed(2)),
  },
};
