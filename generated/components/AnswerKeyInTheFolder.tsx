import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { arriveEase } from "./levelUp";
import {
  ANG_MID,
  ANG_QUESTION,
  CAM_CLOSE,
  CAM_WIDE,
  EVALUATOR,
  FOLDER,
  FOLDER_R,
  GAZE_LEN,
  INK,
  MODEL_HOME,
  MODEL_MARK,
  PERSON_H,
  QUESTION,
  STATION_R,
  STROKE_W,
  Tableau,
  TableauState,
  WALL,
  camKnots3,
  lerp,
  runCam3,
} from "./trapShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Trap`, cut 3 of 5: `AnswerKeyInTheFolder`.
// Line (SRT in-point 24.660 s, on "evaluations"):
//   "[very simple] evaluations for this where it's like you give it a math
//    question and then it has like a folder with the answer key in it and like,
//    does it look at the answer key?"
//
// DURATION. Every beat is frame = round((t - 24.660) * 24):
//   evaluations f0-17 · for this f17-32 · where f32 · you f41 · give f42 ·
//   it f45 · a math f48 · question f52-62 · and then f68 · it has f72 ·
//   folder f84 · with f90 · the f98 · answer f101 · key f106 · in it f110 ·
//   and like f119 · does f124 · it f126 · look f129 · at f132 · the f134 ·
//   answer f137 · key f142-152
// Speech ends f152 and the set's 16-frame tail holds the resolved state:
// DURATION = 152 + 16 = 168.
export const DURATION = 168;

// ---------------------------------------------------------------------------
// V2 — TWO CHANGES, AND ONLY TWO. (1) THE MODEL IS THE OPENAI MARK, not a dot:
// `trapShared.ModelDot` now draws `brandGlyphs.OPENAI` filled, on a 72 screen px
// em box (MODEL_MARK_PX), in the same two-tone orange on the FILL. This is an
// interview with someone from OpenAI. (2) THE ANSWER KEY is lucide `key-round`
// instead of `key`, and the folder glyph is masked behind its silhouette. Every
// staging, timing, camera, beat and duration in this file is untouched.
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "a model sits alone; a dashed ring closes around it; a person outside hands
//    a maths question down into the ring and the model starts working it; a
//    folder appears beside it with a key in it; and the model's needle leaves
//    the question, drifts toward the key — and stops half-way."
//
// The whole world (sizes, ink, the wall, the stations, the people, the threads,
// the tableau coordinates, both cameras) is `trapShared.tsx`. Nothing is
// restated here. DASHED = fake, SOLID = real; accent is the model and its
// attention and nothing else; white ink has two opacities, INK_HI and INK_LO.
//
// ---------------------------------------------------------------------------
// GESTURES — the word each serves and the frames it runs over. One continuous
// motion: the gestures lead and overlap and the words are the landings. Nothing
// in the piece is outside this list.
//
//  1. f0-20   "evaluations"      THE ONE. The cut opens CLOSE on the OpenAI mark
//             (f0)               alone at k 1.755 (97 screen px of em box), deep,
//                                breathing, near the centre of the frame. Thirty
//                                frames of pre-roll mean it is already easing
//                                back on f0 rather than starting from rest.
//  2. f0-36   "evaluations for   THE ENCLOSURE. The dashed wall draws as a
//             this where"        centre-out wipe from its BOTTOM point, both
//             (f0/f17/f32)       ways, dashes already marching, and closes at the
//                                top on f36 — SOLVED, not keyed: the two heads
//                                run at min(36 world px/f, 45 screen px/f) under
//                                the camera, which is what a half-circumference
//                                of 1068 world px affords over that zoom. An eval
//                                is a staged enclosure, so the ring is BUILT
//                                around the model rather than revealed.
//                                90% is drawn by "where" (f32).
//  3. f14-44  "for this where"   THE PULL-BACK FINDS YOU. The camera keeps
//             -> "you" f41       opening — k 1.755 -> 1.149, CAM_WIDE — and the
//                                EVALUATOR is revealed standing OUTSIDE the wall,
//                                above it: their feet cross the top edge at f29,
//                                they are fully framed by f36, and their head is
//                                56 px clear of it on "you" (f41), 79 at the
//                                widest. The camera creeps open through the hold.
//  4. f34-50  "you give it a     THE QUESTION IS MADE. A station ring wipes on in
//             math question"     the evaluator's hands (f34-42, under "you
//             (f41/f42/f45/f48)  give") and the Lucide radical strokes on inside
//                                it (f40-50, under "a math question").
//  5. f43-59  "give it a math    IT IS HANDED DOWN, THROUGH THE WALL. The station
//             question" (f52-62) descends on one arriveEase arc, bowing left,
//                                from the hands to QUESTION, straight through the
//                                dashed wall, landing on f59 — inside "question".
//                                Its fastest frame is 44.0 screen px/f, under the
//                                set's 45 (it was 38.8 at the old, wider wide —
//                                the same world arc costs more screen px now).
//                                The camera pushes back IN with it, so the frame
//                                closes on the lower half of the world as the
//                                ring falls into it, and settles at CAM_CLOSE.
//  6. f57-68  "question"         IT STARTS WORKING. The model ripens
//                                ACCENT_DEEP -> ACCENT from f57 (it wakes two
//                                frames before the ring lands) and its WORK
//                                THREAD reaches the question's ring edge over
//                                f59-68. From f68 accent packets run out and back
//                                along it and NEVER stop for the rest of the cut:
//                                it is working the problem.
//  7. f71-85  "it has like a     THE FOLDER. The second station draws on in
//             folder" (f72/f84)  place — it belongs to the environment — ring
//                                f71-81, folder glyph f76-85, landing on "folder"
//                                (f84). Its ring is 1.35x a station's, because it
//                                has to hold a folder AND the key.
//  8. f92-110 "with the answer   THE KEY (lucide `key-round`, KEY_FRACTION 0.798,
//                                84 screen px of box; the folder glyph behind it
//                                is masked where the key's silhouette plus 3
//                                screen px covers it, so the folder's lines stop
//                                at the key instead of running through it). It
//                                rises out of the folder's mouth
//             key in it"         (genuinely clipped by the mouth line until it is
//             (f90/f98/f101/     clear of it, so there is nothing to pop when the
//              f106/f110)        clip is dropped), comes over the top of the
//                                folder and settles into its body in front, at
//                                INK_HI, while the folder glyph eases to INK_LO.
//                                Settled by f110, on "in it". The folder's RING
//                                does not dim: it is a station like any other.
//  9. f120-   "the answer key"   THE BAIT. Once it is home the key bobs on a slow
//     tail    (f137/f142)        continuous sine, +-4 world px. No flash.
// 10. f124-   "does it look at   THE NEEDLE. A second accent hand is born ON the
//     152 +   the answer key?"   work thread's own angle (so its birth cannot be
//     tail    (f124/f129/f132/   seen) and swings slowly off it toward the folder
//             f137/f142-152)     — and stops about HALF-WAY, which in this
//                                tableau is exactly straight up: -118.4 deg to
//                                -90 deg over f130-152, its tip never over 8.6
//                                screen px/frame. Through the tail it drifts
//                                +-3.5 deg on a 60-frame sine, so the hold is a
//                                hover and not a park. It never reaches the key:
//                                the question is left open.
// 11. f60-168 (no word)          THE CREEP. The camera settles at CAM_CLOSE and
//                                then PUSHES IN 1.5% (knots 1.300 -> 1.3195,
//                                damped 1.3003 -> 1.3185) for the rest of the
//                                cut, on the centre column: x is 540 at every
//                                knot. It used to drift x 540 -> 556 instead,
//                                which left the wall's ink 25 px left of centre
//                                on the last frame; it now sits on 536.7, which
//                                is the sway. Audited over f2..167 on the wall,
//                                the model and both stations: the fastest frame
//                                moves 10.41 screen px, the slowest 0.187 (the
//                                "parked" floor is 0.15) and the largest frame-
//                                to-frame change in that speed is 1.24 against
//                                the set's 2.2.
//
// LIVENESS — mechanisms, not gestures; none is on a word and none ever stops, so
// no window of the piece is still. Measured on the rendered preview at 270 px
// wide, the quietest EIGHT-frame window of the whole cut (f88-95, between the
// folder landing and the key) still changes 0.21 of a grey level per frame, and
// no frame anywhere changes less than 0.20: the wall's dashes march at 0.6
// screen px/frame from f1 to the last frame, the model breathes from f0, the
// work thread's packets run from f68 to the last frame, the key bobs from f120,
// the needle drifts through the tail, the grid has its parallax and its own
// -0.3 px/frame drift, and the camera never parks.
//
// ---------------------------------------------------------------------------
// CAMERA — knots on ONE monotone cubic Hermite (`camKnots3`), one key per frame,
// through the shared damper, with a third channel for the pan; cy is taken off
// the eased k. Chained `camMove`s would have to stop dead at each junction, and
// this camera turns twice on purpose (at the evaluator, and at CAM_CLOSE) — a
// Hermite carries real velocity through everything else.
//
// It is ONE continuous zoom gesture, out and then back in, rather than the pan
// the brief sketched: to PAN from the model up to the evaluator and back is
// 1040 world px of travel in sixty frames, which measured 43.7 screen px/frame
// on the wall and put the audit's |dv| at 5.7 — the camera itself becoming the
// fastest thing in the frame. Pulling back to CAM_WIDE reveals the evaluator
// standing above the wall (that is what CAM_WIDE is for), and pushing back in
// closes the frame on the descending station. Same three landings, a third of
// the travel.
//
//   knot f -30  k 2.060  x 540  y 1074  PRE-ROLL, through the damper before f0
//   knot f   0  k 1.700  x 540  y 1002  f0 damped reads k 1.755
//   knot f  14  k 1.480  x 540  y  941  the opening ease-back
//   knot f  26  k 1.292  x 540  y  881
//   knot f  38  k 1.150  x 540  y  830  CAM_WIDE: the evaluator is revealed
//   knot f  46  k 1.140  x 540  y  827  a creep, not a park
//   knot f  53  k 1.214  x 537  y  864  the push-in, led so that it lands with
//   knot f  62  k 1.335  x 538  y  915  the station instead of behind it
//   knot f  74  k 1.300  x 540  y  922  CAM_CLOSE
//   knot f  90  k 1.3035 x 540  y  925
//   knot f 167  k 1.3195 x 540  y  929  the tail push-in, on the centre column
//   knot f 240  k 1.338  x 540  y  933  its continuation, off the end
// (y is the world point CAM_LIFT puts on screen y 835.) The two knots between f0
// and CAM_WIDE are the same ease-back as before, re-spread over the shorter drop
// the new CAM_WIDE asks for (1.70 -> 1.15, not 1.70 -> 1.00) at the same
// fractions of it; the same is true of the f53 knot inside the push-in.
//
// DAMPED, measured: f0 1.755 · f12 1.580 · f20 1.451 · f33 1.252 · f44 1.149 ·
//   f58 1.228 · f60 1.257 · f84 1.300 · f110 1.306 · f167 1.3185.
// Every weight in the piece is written against CAM_CLOSE's k 1.3, and the
// resolved camera reads 1.3185 — 1.4% over, so the stroke lands at 6.09 screen
// px against its 6.00 target, a station at 131.9 against 130 and the mark's em
// box at 73.0 against 72.
//
// FRAMING, measured. Wall: screen x 97..991 at f110 and 85..988 at f167 (side
// margin >= 85, the brief asks 70), screen y 324..1218 at f110 and 309..1211 at
// f167 (the caption band wants the ink above ~1400); its ink centres on screen
// x 536.7 on the last frame, which is the sway and nothing else. The model sits
// at screen (537, 938) and the two stations at y 609 — the question at x 359,
// the folder at 715, symmetric about the column. The evaluator's feet clear the
// top edge at f64 and stay off for the rest of the cut.
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
    evaluations: z.number(),
    where: z.number(),
    you: z.number(),
    question: z.number(),
    itHas: z.number(),
    folder: z.number(),
    answer: z.number(),
    key: z.number(),
    inIt: z.number(),
    does: z.number(),
    look: z.number(),
    key2: z.number(),
    end: z.number(), // speech ends; tail to 168
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
    evaluations: 0,
    where: 32,
    you: 41,
    question: 52,
    itHas: 72,
    folder: 84,
    answer: 101,
    key: 106,
    inIt: 110,
    does: 124,
    look: 129,
    key2: 142,
    end: 152,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
/** Frames of pre-roll run through the damper before frame 0, so the camera is
 *  already easing back at f0 instead of taking a standing start. The opening
 *  knot is the move's own continuation backwards; without it the damper sees a
 *  step in its target on f1 and the audit's |dv| goes over the set's 2.2. */
const PRE = 30;

const KNOTS = [
  { f: 0, k: 2.06, x: 540, y: 1074 }, // f -30: the pre-roll
  { f: PRE + 0, k: 1.7, x: 540, y: 1002 }, // f 0: damped, this reads k 1.76
  { f: PRE + 14, k: 1.48, x: 540, y: 941 },
  { f: PRE + 26, k: 1.292, x: 540, y: 881 },
  // CAM_WIDE: the evaluator is revealed. Taken from the module, not restated —
  // the three knots above are the same ease-back re-spread over the shorter
  // drop (1.70 -> 1.15 instead of 1.70 -> 1.00) at the same fractions of it.
  { f: PRE + 38, k: CAM_WIDE.k, x: CAM_WIDE.x, y: CAM_WIDE.y },
  { f: PRE + 46, k: CAM_WIDE.k - 0.01, x: 540, y: CAM_WIDE.y - 3 }, // a creep, not a park
  { f: PRE + 53, k: 1.214, x: 537, y: 864 }, // the push-in, led so it lands with
  { f: PRE + 62, k: 1.335, x: 538, y: 915 }, // the station instead of behind it
  { f: PRE + 74, k: 1.3, x: 540, y: 922 }, // CAM_CLOSE
  { f: PRE + 90, k: 1.3035, x: 540, y: 925 },
  // THE TAIL CREEP IS A PUSH-IN ON ONE AXIS. It used to drift x 540 -> 556,
  // which left the ring 25 px left of centre on the last frame; the liveness is
  // now +1.5% of zoom over the same stretch, on the centre column.
  { f: PRE + 167, k: 1.3195, x: 540, y: 929 },
  { f: PRE + 240, k: 1.338, x: 540, y: 933 },
];

const CAM = camKnots3(KNOTS, PRE + DURATION + 70);

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

// ---------------------------------------------------------------------------
// THE WIPE. Two heads leave the wall's BOTTOM point and climb both ways to the
// top. Their speed is integrated forward at min(WIPE_V, WIPE_CAP / k(f)), so
// neither head is ever over the set's screen-speed ceiling however tight the
// camera is, with a taper over the last stretch so they meet decelerating
// instead of stopping dead. The closing frame is therefore SOLVED, not keyed —
// it is whatever that integral gives (WIPE_CLOSE, in STATS).
// ---------------------------------------------------------------------------
const WIPE_F0 = 0;
const WIPE_V = 36; // world px/frame nominal; the cap binds for most of the climb
const WIPE_CAP = 45; // screen px/frame — the set's ceiling
const WIPE_TAPER = 0.1;
const WIPE_HALF = Math.PI * WALL.r;

const WIPE = (() => {
  const s: number[] = new Array(DURATION + 3).fill(0);
  let cur = 0;
  let close = -1;
  for (let f = WIPE_F0 + 1; f <= DURATION + 2; f++) {
    const v =
      Math.min(WIPE_V, WIPE_CAP / kAt(f)) *
      (1 - 0.45 * smoothstep(clamp01((cur / WIPE_HALF - (1 - WIPE_TAPER)) / WIPE_TAPER)));
    cur = Math.min(WIPE_HALF, cur + v);
    s[f] = cur;
    if (close < 0 && cur >= WIPE_HALF - 1e-6) close = f;
  }
  return { s, close };
})();
const wallDrawAt = (f: number) => WIPE.s[clampF(f)] / WIPE_HALF;

// ---------------------------------------------------------------------------
// THE HAND-DOWN. The station is made in the evaluator's hands and descends on
// one arriveEase arc, bowing left, into QUESTION — straight through the wall.
// ---------------------------------------------------------------------------
const HANDS = { x: EVALUATOR.x, y: EVALUATOR.y + PERSON_H / 2 + STATION_R + 24 };
const DESC_CTRL = { x: 425, y: 520 };
const DESC_F0 = 43;
const DESC_F1 = 59;

const bez = (
  P0: { x: number; y: number },
  C: { x: number; y: number },
  P1: { x: number; y: number },
  u: number,
) => {
  const v = 1 - u;
  return {
    x: v * v * P0.x + 2 * v * u * C.x + u * u * P1.x,
    y: v * v * P0.y + 2 * v * u * C.y + u * u * P1.y,
  };
};

const questionAtF = (f: number) => {
  if (f >= DESC_F1) return QUESTION;
  if (f <= DESC_F0) return HANDS;
  return bez(HANDS, DESC_CTRL, QUESTION, arriveEase(clamp01((f - DESC_F0) / (DESC_F1 - DESC_F0))));
};

// ---------------------------------------------------------------------------
// THE NEEDLE. It is born ON the work thread's angle, so its birth cannot be
// seen, and then swings off it toward the folder — stopping half-way, which in
// this tableau is exactly straight up. Through the tail it drifts on a slow
// sine, so the hold is a hover rather than a park.
// ---------------------------------------------------------------------------
const GAZE_BORN = 124;
const GAZE_GROWN = 130;
const SWING_F0 = 130;
const SWING_F1 = 152;
const DRIFT_DEG = 3.5;
const DRIFT_F0 = 144;
const DRIFT_RAMP = 18;
const DRIFT_W = 0.105; // rad/frame: a ~60-frame sine

const gazeAt = (f: number) => {
  if (f < GAZE_BORN) return null;
  const grow = clamp01((f - GAZE_BORN) / (GAZE_GROWN - GAZE_BORN));
  const swing = smoothstep(clamp01((f - SWING_F0) / (SWING_F1 - SWING_F0)));
  const drift =
    ((DRIFT_DEG * Math.PI) / 180) *
    smoothstep(clamp01((f - DRIFT_F0) / DRIFT_RAMP)) *
    Math.sin((f - DRIFT_F0) * DRIFT_W);
  return {
    angle: lerp(ANG_QUESTION, ANG_MID, swing) + drift,
    length: GAZE_LEN * arriveEase(grow),
  };
};

// ---------------------------------------------------------------------------
// THE STATE, frame by frame. Everything a cut can say about the standing
// picture is one object; `Tableau` draws it in the one legal z-order.
// ---------------------------------------------------------------------------
const stateAt = (frame: number): TableauState => {
  const g = gazeAt(frame);
  const keyRise = clamp01((frame - 92) / 18);
  const keyBob =
    4 * smoothstep(clamp01((frame - 120) / 14)) * Math.sin((frame - 120) * 0.157);
  return {
    frame,
    wallDraw: wallDrawAt(frame),
    questionDraw: clamp01((frame - 34) / 8),
    questionIconDraw: clamp01((frame - 40) / 10),
    questionAt: questionAtF(frame),
    folderDraw: clamp01((frame - 71) / 10),
    folderIconDraw: clamp01((frame - 76) / 9),
    keyRise,
    keyBob,
    folderDashed: 0,
    workThread: arriveEase(clamp01((frame - 59) / 9)),
    workPackets: true,
    gazeAngle: g ? g.angle : null,
    gazeLength: g ? g.length : 0,
    wire: 0,
    modelTone: smoothstep(clamp01((frame - 57) / 10)),
    modelOffset: { x: 0, y: 0 },
    evaluatorOpacity: 1,
  };
};

// ---------------------------------------------------------------------------

const AnswerKeyInTheFolder: React.FC<Props> = ({
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
          <Tableau state={stateAt(frame)} k={k} worldW={WORLD_W} worldH={WORLD_H} />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AnswerKeyInTheFolder;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  you: defaultProps.beats.you,
  question: defaultProps.beats.question,
  folder: defaultProps.beats.folder,
  inIt: defaultProps.beats.inIt,
  look: defaultProps.beats.look,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);
export const STATE_AT = (f: number) => stateAt(f);

const LAST = DURATION - 1;

/** The screen speed of a world point that is itself moving, frame to frame. */
const screenSpeed = (f: number, at: (g: number) => { x: number; y: number }) => {
  const a = screenAt(f - 1, at(f - 1).x, at(f - 1).y);
  const b = screenAt(f, at(f).x, at(f).y);
  return Math.hypot(b.x - a.x, b.y - a.y);
};

export const STATS = {
  duration: DURATION,
  kAt: [0, 12, 20, 33, 36, 44, 52, 58, 60, 84, 110, 140, LAST].map((f) => [
    f,
    Number(kAt(f).toFixed(4)),
  ]),
  camYAt: [0, 20, 36, 44, 58, 60, LAST].map((f) => [f, Number(camAt(f).cy.toFixed(1))]),
  wipeClose: WIPE.close,
  wipeFrac: [10, 20, 30, 33, 36].map((f) => [f, Number(wallDrawAt(f).toFixed(3))]),
  /** the wipe head's own screen speed, worst frame */
  wipeHeadMax: (() => {
    let worst = { f: -1, v: 0 };
    for (let f = WIPE_F0 + 2; f <= (WIPE.close < 0 ? DURATION : WIPE.close); f++) {
      const a = (WIPE.s[f] - WIPE.s[f - 1]) * kAt(f);
      if (a > worst.v) worst = { f, v: a };
    }
    return [worst.f, Number(worst.v.toFixed(1))];
  })(),
  /** the descending station's screen speed while the camera follows it */
  descentMax: (() => {
    let worst = { f: -1, v: 0 };
    for (let f = DESC_F0 + 1; f <= DESC_F1 + 2; f++) {
      const v = screenSpeed(f, questionAtF);
      if (v > worst.v) worst = { f, v };
    }
    return [worst.f, Number(worst.v.toFixed(1))];
  })(),
  /** the camera itself: the screen speed of a fixed world point, and its
   *  frame-to-frame change (the set's ceiling for |dv| is 2.2) */
  camAudit: (() => {
    const pts = [
      [WALL.cx, WALL.cy],
      [MODEL_HOME.x, MODEL_HOME.y],
      [QUESTION.x, QUESTION.y],
      [FOLDER.x, FOLDER.y],
    ];
    let vMax = { f: -1, v: 0 };
    let vMin = { f: -1, v: 1e9 };
    let dMax = { f: -1, v: 0 };
    for (let f = 2; f <= LAST; f++) {
      let v = 0;
      let vp = 0;
      for (const [wx, wy] of pts) {
        const a = screenAt(f - 2, wx, wy);
        const b = screenAt(f - 1, wx, wy);
        const c = screenAt(f, wx, wy);
        v = Math.max(v, Math.hypot(c.x - b.x, c.y - b.y));
        vp = Math.max(vp, Math.hypot(b.x - a.x, b.y - a.y));
      }
      if (v > vMax.v) vMax = { f, v };
      if (v < vMin.v) vMin = { f, v };
      if (Math.abs(v - vp) > dMax.v) dMax = { f, v: Math.abs(v - vp) };
    }
    return {
      max: [vMax.f, Number(vMax.v.toFixed(2))],
      min: [vMin.f, Number(vMin.v.toFixed(3))],
      dvMax: [dMax.f, Number(dMax.v.toFixed(3))],
    };
  })(),
  /** the wall's own box on screen, and the side margin, at the resolved end */
  wallScreen: [0, 36, 60, 110, LAST].map((f) => {
    const l = screenAt(f, WALL.cx - WALL.r, WALL.cy);
    const r = screenAt(f, WALL.cx + WALL.r, WALL.cy);
    const t = screenAt(f, WALL.cx, WALL.cy - WALL.r);
    const b = screenAt(f, WALL.cx, WALL.cy + WALL.r);
    const s = STROKE_W * kAt(f) * 0.5;
    return [
      f,
      Number((l.x - s).toFixed(0)),
      Number((r.x + s).toFixed(0)),
      Number((t.y - s).toFixed(0)),
      Number((b.y + s).toFixed(0)),
    ];
  }),
  /** the evaluator: the frame they first touch the frame, and their framing */
  evaluatorEnter: (() => {
    for (let f = 0; f <= DURATION; f++) {
      if (screenAt(f, EVALUATOR.x, EVALUATOR.y + PERSON_H / 2).y > 0) return f;
    }
    return -1;
  })(),
  evaluatorAt36: (() => {
    const head = screenAt(36, EVALUATOR.x, EVALUATOR.y - PERSON_H / 2);
    const feet = screenAt(36, EVALUATOR.x, EVALUATOR.y + PERSON_H / 2);
    return [Number(head.y.toFixed(0)), Number(feet.y.toFixed(0))];
  })(),
  evaluatorOffAt: (() => {
    for (let f = 60; f <= DURATION; f++) {
      if (screenAt(f, EVALUATOR.x, EVALUATOR.y + PERSON_H / 2).y < 0) return f;
    }
    return -1;
  })(),
  /** the screen sizes every weight is written against, on the last frame */
  screenSizes: {
    k: Number(kAt(LAST).toFixed(4)),
    stroke: Number((STROKE_W * kAt(LAST)).toFixed(2)),
    stationDia: Number((2 * STATION_R * kAt(LAST)).toFixed(1)),
    folderDia: Number((2 * FOLDER_R * kAt(LAST)).toFixed(1)),
    markEm: Number((MODEL_MARK * kAt(LAST)).toFixed(1)),
    markEmOpen: Number((MODEL_MARK * kAt(0)).toFixed(1)),
    personH: Number((PERSON_H * kAt(36)).toFixed(1)),
  },
  /** the model and the two stations on the last frame */
  inkScreen: {
    model: (() => {
      const p = screenAt(LAST, MODEL_HOME.x, MODEL_HOME.y);
      return [Number(p.x.toFixed(0)), Number(p.y.toFixed(0))];
    })(),
    question: (() => {
      const p = screenAt(LAST, QUESTION.x, QUESTION.y);
      return [Number(p.x.toFixed(0)), Number(p.y.toFixed(0))];
    })(),
    folder: (() => {
      const p = screenAt(LAST, FOLDER.x, FOLDER.y);
      return [Number(p.x.toFixed(0)), Number(p.y.toFixed(0))];
    })(),
  },
  gaze: {
    born: GAZE_BORN,
    swing: [SWING_F0, SWING_F1],
    angles: [124, 130, 136, 142, 152, 160, LAST].map((f) => {
      const g = gazeAt(f);
      return [f, g ? Number(((g.angle * 180) / Math.PI).toFixed(2)) : 0];
    }),
  },
  camClose: CAM_CLOSE,
};
