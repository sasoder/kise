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
  breath,
  clamp01,
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  ANG_FOLDER,
  ANG_MID,
  CAM_WIDE,
  EVALUATOR,
  FOLDER,
  FOLDER_R,
  GAZE_LEN,
  INK,
  MODEL_HOME,
  MODEL_MARK,
  PACKET_R,
  PERSON_H,
  QUESTION,
  STATION_R,
  STROKE_W,
  THREAD_GAP,
  Tableau,
  TableauState,
  WALL,
  WIRE_PACKET_R,
  angleTo,
  camKnots3,
  lerp,
  runCam3,
} from "./trapShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Trap`, cut 4 of 5: `SeemsLikeATrap`.
// Line (SRT in-point 33.740 s, on "a situation"):
//   "[we have] a situation now where the models see that there's an answer key
//    in this file, in this folder, and they're like: huh, this seems like a
//    trap."
//
// DURATION. Every beat is frame = round((t - 33.740) * 24):
//   a f0 · situation f5 · now f14 · where f18 · the f20 · models f22 ·
//   see f28-42 · that f42 · there's f46 · an f49 · answer f51 · key f57 ·
//   in this file f60-73 · in this f74 · folder f77 · and f83 · they're f88 ·
//   like f91 · huh f97 · this f103 · seems f107 · like f111 · a f115 ·
//   trap f117-138
// Speech ends f138 and the set's 16-frame tail holds the resolved state:
// DURATION = 138 + 16 = 154.
export const DURATION = 154;

// ---------------------------------------------------------------------------
// V2 — TWO CHANGES, AND ONLY TWO. (1) THE MODEL IS THE OPENAI MARK, not a dot:
// `trapShared.ModelDot` now draws `brandGlyphs.OPENAI` filled, on a 72 screen px
// em box (MODEL_MARK_PX), in the same two-tone orange on the FILL. This is an
// interview with someone from OpenAI. (2) THE ANSWER KEY is lucide `key-round`
// instead of `key`, and the folder glyph is masked behind its silhouette. Every
// staging, timing, camera, beat and duration in this file is untouched.
// ---------------------------------------------------------------------------
// THIS CUT PICKS UP CUT 3's PICTURE. It does not start over: frame 0 is
// `STATE_END_CUT3` — the dashed wall marching, the question station with the
// work thread pulsing on it, the folder with the key in it, the needle hovering
// half-way between them — seen from cut 3's own resolved camera (k 1.288,
// x 560, y 897; this cut opens at k 1.290, x 558, y 905, see CAMERA). Every
// noun is drawn through the shared `Tableau`, so it cannot drift from cut 3.
//
// SOUND-OFF READING TEST — one sentence:
//   "the model's needle swings off the middle and lands on the folder; it reads
//    the key and pulls back; a wire is hanging off that folder, and when it runs
//    up and out through the wall the camera goes with it and finds a person
//    standing outside, watching — and the folder turns dashed, like the wall."
//
// VOCABULARY — `trapShared`'s, unchanged. DASHED = fake, SOLID = real. Accent
// is the model and its attention and NOTHING else; the wire and its packets are
// WHITE because the wire is real. Two ink rungs only (INK_HI 1.0, INK_LO 0.5 —
// the folder glyph behind its key is the only thing on the low rung).
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion, the words are landings. Everything the cut
// does is in this list; nothing else moves on its own.
//
//  1. f0-21   "a situation now    THE PICKUP. Cut 3's standing picture, alive:
//             where the models"   the wall's dashes march, the work thread
//             (f0/f5/f14/f18)     shuttles a packet to the question and back,
//                                 the key bobs in the folder, the needle hovers
//                                 straight up drifting on cut 3's own 3.5 deg
//                                 sine. The camera is already moving at f0 (26
//                                 frames of pre-roll) and creeps in toward the
//                                 model/folder side.
//  2. f22-34  "the models SEE"    THE SWING LANDS. The needle leaves the middle
//             (f22, f28-42)       (ANG_MID) and completes cut 3's unfinished
//                                 swing onto the folder (ANG_FOLDER), lengthening
//                                 205 -> 221.6 world px as it goes, so its TIP
//                                 reaches the folder ring's edge exactly at f34
//                                 — in the middle of the long "see".
//  3. f34-42  (caused by 2)       THE BAIT GOES STILL. The key's bob — cut 3's
//                                 continuing 4 px sine — decays to nothing over
//                                 the eight frames after the tip touches. The
//                                 state change is the TOUCH, not a timer: the
//                                 thing that was wiggling to be looked at has
//                                 been looked at.
//  4. f46-97  "there's an answer  READING THE LABEL. An accent packet leaves the
//             key in this file,   model along the needle, runs to the tip and
//             in this folder"     comes back, launching on f46 ("there's an"),
//             (f46/f51/f57/       f62 ("in this file"), f78 ("folder") and f94.
//              f60-73/f77)        It stops AT the ring, never inside it: the
//                                 model is reading the label, not opening it.
//                                 The work thread on the question keeps its own
//                                 packet shuttling the whole cut — it is still
//                                 working the problem. The camera glides on to
//                                 favour the dot-folder pair (k 1.49 by f51,
//                                 1.556 by f77, landing on "answer" f51's
//                                 neighbourhood and holding through "folder").
//  5. f94-102 "and they're like:  THE RECOIL. The f94 packet stops 38% of the
//             HUH" (f88/f91/f97)  way out and drains back to the model, home by
//                                 f101. The model backs off 20 world px (30
//                                 screen px where it happens, 24 on "trap": a
//                                 third of the mark's own width) along the
//                                 needle's own line, on one
//                                 eased ramp, and holds its breath (the 5%
//                                 breath is damped to 1% over f94-116). The
//                                 work thread is anchored to the model, so the
//                                 whole attention structure flinches with it.
//                                 No bounce, no flash.
//  6. f96-108 (continues 5)       THE NEEDLE LIFTS. Its tip comes off the ring
//                                 and tilts UP to the ring's upper-left, onto
//                                 the point the wire is attached at — it has
//                                 noticed something hanging off the folder.
//  7. f100-117 "this seems like   THE ONE BIG MOVE. A white SOLID wire reveals
//             a TRAP" (f103/      out of that point, its head running up and out
//              f107/f111/f117)    THROUGH the dashed wall (it crosses the wall
//                                 at f106) and on to the evaluator's feet,
//                                 landing on "trap" (f117). Speed-capped against
//                                 the camera at 42 screen px/frame (worst frame
//                                 measured 37.0), tapered so the head
//                                 decelerates into the feet.
//  8. f102-112 (caused by 7)      THE FOLDER IS BAIT. Keyed on the wire's own
//                                 progress, the folder ring's stroke opens into
//                                 dashes and starts marching — it is made of the
//                                 same stuff as the wall. Completed before
//                                 "trap".
//  9. f94-126 (with 7)            THE CAMERA GOES WITH THE HEAD. One long glide,
//                                 C1-continuous out of the creep: k 1.552 ->
//                                 1.15 (CAM_WIDE) with the frame rising and the
//                                 pan coming back to centre. The EVALUATOR is
//                                 not faded in — the pull-back finds them: their
//                                 feet cross the top edge at f105 and they stand
//                                 fully in frame from f113, four frames before
//                                 the head reaches them. The whole staged
//                                 enclosure and the watcher above it are in one
//                                 frame: that is the trap.
// 10. f106-128 (with 7 and 9)     THE NEEDLE FOLLOWS THE HEAD. The gaze angle
//                                 blends off the wire's root onto the head
//                                 itself and goes three quarters of the way to
//                                 it (-69.4 -> -84.0 deg), shortening 205 ->
//                                 150 world px as it does: it becomes a hand
//                                 leaning into the wire, not a second wire
//                                 beside it, and the payoff is left to the
//                                 wire, the pull-back and the person.
// 11. f117-153 "trap" + tail      THE REPORT LINE. White packets leave the
//                                 wire's root every 16 frames from the frame the
//                                 head lands, and climb to the evaluator: the
//                                 folder reports. The needle settles slowly back
//                                 onto the wire's root (-84.0 -> -69.4 deg)
//                                 across f128-152, the wall and folder dashes
//                                 march, the work thread still shuttles, the
//                                 model breathes again and the camera keeps
//                                 creeping. Nothing fades; the last frame is
//                                 still moving.
//
// LIVENESS — mechanisms, not gestures, so no window of the piece is still: the
// wall's 680 dashes and (from f102) the folder's march 0.6 screen px/frame; the
// work thread's packet, out and back, every 16 frames, from f0 to the last
// frame; the gaze packet f46-100 and the wire packets f117-153; the model's
// breath; the needle's own 0.8 deg hover sine while it rests on the ring and its
// 24-frame settle in the tail; the grid's parallax and -0.3 px/frame drift; and
// a camera that is moving on f0 and still moving on f153.
//
// ---------------------------------------------------------------------------
// CAMERA — knots on ONE monotone cubic Hermite (`camKnots3`, Fritsch-Carlson,
// one key per frame), through the shared damper (`runCam3`). Three channels: it
// pans as well as zooms. `y` is the world point CAM_LIFT puts on screen y 835.
//
//   f -26  k 1.3123 x 540  y 927.6 the pre-roll: cut 3's tail creep (+0.00024 of
//                                  k and +0.045 world px of content y per frame,
//                                  on the centre column) run backwards, so f0 is
//                                  not a standing start
//   f   0  k 1.3185 x 540  y 928.8 CUT 3's RESOLVED CAMERA, read off its own
//                                  damped track at its f167: k 1.31851, cx
//                                  540.00, content y 928.80. Damped, this cut's
//                                  f0 reads k 1.3163 / cx 540.00 / y 929.02 —
//                                  the same frame to a fifth of a world px.
//   f  30  k 1.412  x 576  y 900   the creep in, toward the model/folder side
//   f  56  k 1.523  x 594  y 873   the pair framed: the dot bottom-left, the
//                                  folder upper-right, their ink centre on 835
//   f  84  k 1.552  x 598  y 867   the creep's own continuation — a hold that
//                                  is not a park
//   f  94  k 1.492  x 592  y 862   THE PULL-BACK leaves, ahead of "huh"
//   f 104  k 1.332  x 572  y 848
//   f 114  k 1.192  x 548  y 833
//   f 126  k 1.157  x 540  y 829
//   f 154  k solved x 540  y 830   CAM_WIDE, solved by secant so the DAMPED k
//                                  on the last frame is exactly 1.150
//   f 230  k -0.098 x 540  y 850   its continuation, off the end, so the last
//                                  frame is still moving
//
// The five pull-back knots are the old ones re-spread over the shorter drop the
// new CAM_WIDE asks for (1.552 -> 1.15 rather than 1.552 -> 1.00) at the same
// fractions of it, so the glide's shape is the approved one; the two creep knots
// before it are the same against the higher opening k.
//
// The damped camera reads k 1.274 on f112 and 1.210 on f117. The brief wanted
// it landed by f110-112; a 1.55 -> CAM_WIDE pull cannot both land there and stay
// under the set's 2.2 screen px/f^2 ceiling. What the landing is FOR is
// satisfied instead: the evaluator's feet cross the top edge on f105 and they
// stand fully in frame from f113, four frames before the head reaches them, and
// the frame is within 5.2% of CAM_WIDE on "trap".
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//  * THE MODEL DOES NOT RIPEN ON "the models see". `STATE_END_CUT3.modelTone`
//    is already 1: cut 3 lights it when the question lands and it never stops
//    working. Ripening it again would be a change with nothing behind it, so
//    "see" is carried by the two things that DO change — the needle's swing
//    completing onto the ring, and the key going still when the tip touches.
//
//  * THE WORK THREAD DOES NOT THIN TO IDLE. `Tableau` exposes the work thread
//    as a 0..1 progress and a packets on/off; there is no packet rate on it,
//    and pulling the progress below 1 retracts the line off the question ring
//    AND kills its traffic, which is a bigger change than the brief asked for
//    in the opposite direction. It therefore keeps cut 3's rate, which is also
//    what cut 3's own note says ("packets ... NEVER stop for the rest of the
//    cut"). The subject moves to the folder by the needle and the camera.
//
//  * THE FOLDER RING'S CONVERSION IS THE MODULE'S, NOT AN ANGULAR SWEEP.
//    `Station`'s `dashed` 0..1 opens the gaps between the dashes continuously,
//    the whole ring at once; there is no angular range on it as there is on the
//    `Wall`, and drawing a second ring over the shared one would double the
//    ink. The conversion is keyed on the WIRE'S OWN PROGRESS instead, which is
//    still the mechanism reaching it and not a timer: 0 at the root, 1 by the
//    time the head is 48% of the way out (f108, two frames after it leaves the
//    wall).
//
//  * THE WIRE LEAVES ON f100, NOT f103. It is what the needle noticed at f97,
//    so the reveal leads the words by three frames, and it has to: 457 world px
//    under the 42 screen px/frame cap needs 17 frames to land on "trap" (f117),
//    and from f103 the head would have to run at 56 screen px/frame.
//
//  * THE WIRE'S PACKETS ARE DRAWN HERE. `Wire`'s own are phased on frame 0 with
//    a fixed 16-frame period, and its travel time (17.6 frames) is longer than
//    that period, so there is always one in flight: switching them on at ANY
//    frame pops a packet into existence in the middle of the line. These launch
//    from the root on the frame the head lands. They are sized at the module's
//    `WIRE_PACKET_R` — PACKET_R_PX of SCREEN at CAM_WIDE, 4.35 world px — rather
//    than at K_REF, because unlike every other packet in the clip they are only
//    ever seen at CAM_WIDE; `Wire` itself now uses the same constant, so a bead
//    does not change size when cut 5 takes the wire over.
//
//  * THE RESOLVED FRAME IS `STATE_END_CUT4`, and that constant now says so: it
//    carries this cut's folderDashed 1, the model's 20 world px recoil down the
//    folder bearing (offset -9.50, +17.60), the short needle (150 world px) lying
//    on the wire's root at -69.4 deg and the key's bob stopped — not cut 3's
//    ANG_MID at GAZE_LEN. Cut 5 opens on it.
//
// Everything measured is in STATS at the bottom and quoted in the report.
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
    a: z.number(),
    now: z.number(),
    models: z.number(),
    see: z.number(),
    theres: z.number(),
    answer: z.number(),
    key: z.number(),
    folder: z.number(),
    theyre: z.number(),
    huh: z.number(),
    seems: z.number(),
    trap: z.number(),
    end: z.number(), // speech ends; tail to 154
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
    a: 0,
    now: 14,
    models: 22,
    see: 28,
    theres: 46,
    answer: 51,
    key: 57,
    folder: 77,
    theyre: 88,
    huh: 97,
    seems: 107,
    trap: 117,
    end: 138,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
/** Frames of pre-roll run through the damper before frame 0, so the camera is
 *  already creeping at f0 (cut 3 ends creeping) instead of taking a standing
 *  start, which would put a step in the damper's target on f1. */
const PRE = 26;

const KNOTS_FOR = (kEnd: number) => [
  // f -26: the pre-roll — cut 3's tail creep (+0.00024 of k and +0.045 world px
  // of content y per frame, on the centre column) run backwards
  { f: 0, k: 1.3123, x: 540, y: 927.6 },
  // f 0 = cut 3's resolved camera, measured off its own damped track: k 1.31851,
  // cx 540.00, content y 928.80. Damped, this reads k 1.3185 / cx 540 / y 928.8.
  { f: PRE + 0, k: 1.3185, x: 540, y: 928.8 },
  { f: PRE + 30, k: 1.412, x: 576, y: 900 },
  { f: PRE + 56, k: 1.523, x: 594, y: 873 },
  { f: PRE + 84, k: 1.552, x: 598, y: 867 },
  // THE PULL-BACK. The same five knots as before, re-spread over the shorter
  // drop the new CAM_WIDE asks for (1.552 -> 1.15 instead of 1.552 -> 1.00) at
  // the same fractions of it, so the glide's shape is unchanged.
  { f: PRE + 94, k: 1.492, x: 592, y: 862 }, // the pull-back leaves
  { f: PRE + 104, k: 1.332, x: 572, y: 848 },
  { f: PRE + 114, k: 1.192, x: 548, y: 833 },
  { f: PRE + 126, k: 1.157, x: 540, y: 829 },
  { f: PRE + 154, k: kEnd, x: CAM_WIDE.x, y: CAM_WIDE.y }, // CAM_WIDE
  // the continuation, off the end, so the last frame is still moving; scaled
  // with CAM_WIDE's own zoom (0.085 x 1.15) so the creep reads the same
  { f: PRE + 230, k: kEnd - 0.098, x: CAM_WIDE.x, y: CAM_WIDE.y + 20 },
];

const trackFor = (kEnd: number) => camKnots3(KNOTS_FOR(kEnd), PRE + DURATION + 140);
const kAtLast = (kEnd: number) => {
  const t = trackFor(kEnd);
  return runCam3(LAST + PRE, t.CX, t.CY, t.K).k;
};
/** Solved so the DAMPED camera reads exactly CAM_WIDE.k on the last frame. */
const K_END = (() => {
  const a = CAM_WIDE.k - 0.05;
  const b = CAM_WIDE.k + 0.05;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((CAM_WIDE.k - fa) * (b - a)) / (fb - fa);
})();

const CAM = trackFor(K_END);

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
// THE WIRE. `trapShared`'s Wire runs from the folder ring's edge on the bearing
// of the evaluator to the evaluator's feet, as a straight line; this cut owns
// only WHEN its head is where. The head's speed is integrated forward at
// min(WIRE_V, WIRE_CAP / k(f)) — so it is never over the set's screen ceiling
// however tight the camera still is — with a taper over the last stretch so it
// decelerates into the feet instead of stopping dead. The START frame is SOLVED:
// the latest frame from which that integral still lands on "trap" (f117).
// ---------------------------------------------------------------------------
const ANG_WIRE = angleTo(FOLDER, EVALUATOR);
/** Where the wire is attached to the folder ring — the point the needle lifts
 *  onto, and the root every white packet leaves from. */
const WIRE_A = {
  x: FOLDER.x + Math.cos(ANG_WIRE) * FOLDER_R,
  y: FOLDER.y + Math.sin(ANG_WIRE) * FOLDER_R,
};
const WIRE_B = { x: EVALUATOR.x, y: EVALUATOR.y + PERSON_H * 0.42 };
const WIRE_LEN = Math.hypot(WIRE_B.x - WIRE_A.x, WIRE_B.y - WIRE_A.y);

const WIRE_LAND = 117; // "trap"
const WIRE_F0_FLOOR = 99; // never before the needle has finished lifting onto it
const WIRE_V = 30; // world px/frame nominal
const WIRE_CAP = 42; // screen px/frame — under the set's 45 ceiling
const WIRE_TAPER = 0.22;

const wireRun = (f0: number) => {
  const s: number[] = new Array(DURATION + 3).fill(0);
  let cur = 0;
  for (let f = f0 + 1; f <= WIRE_LAND; f++) {
    const v =
      Math.min(WIRE_V, WIRE_CAP / kAt(f)) *
      (1 - 0.5 * smoothstep(clamp01((cur / WIRE_LEN - (1 - WIRE_TAPER)) / WIRE_TAPER)));
    cur += v;
    s[f] = cur;
  }
  for (let f = WIRE_LAND + 1; f <= DURATION + 2; f++) s[f] = cur;
  return { s, reach: cur };
};

const WIRE = (() => {
  let f0 = WIRE_LAND - 2;
  let run = wireRun(f0);
  while (run.reach < WIRE_LEN && f0 > WIRE_F0_FLOOR) {
    f0 -= 1;
    run = wireRun(f0);
  }
  if (run.reach < WIRE_LEN) {
    throw new Error(
      `SeemsLikeATrap: the wire cannot reach the evaluator by f${WIRE_LAND} from ` +
        `f${WIRE_F0_FLOOR} under the ${WIRE_CAP} screen px/frame cap ` +
        `(${run.reach.toFixed(0)} of ${WIRE_LEN.toFixed(0)} world px).`,
    );
  }
  // Scaling DOWN only lowers the head's speed, so the cap still holds.
  const scale = WIRE_LEN / Math.max(1e-6, run.reach);
  return { f0, s: run.s.map((v) => Math.min(WIRE_LEN, v * scale)) };
})();

const wireProgress = (f: number) => (f <= WIRE.f0 ? 0 : WIRE.s[clampF(f)] / WIRE_LEN);
const wireHead = (f: number) => {
  const p = wireProgress(f);
  return { x: lerp(WIRE_A.x, WIRE_B.x, p), y: lerp(WIRE_A.y, WIRE_B.y, p) };
};

// ---------------------------------------------------------------------------
// THE MODEL'S RECOIL, and the breath it holds while it backs off. Both are one
// eased ramp on "huh"; nothing bounces.
// ---------------------------------------------------------------------------
// 20 world px is 30 screen px at the framing the recoil happens in (k 1.49 at
// f94) and 24 on "trap". Against the old 42 px dot that was three quarters of
// its diameter; against the OpenAI mark's 72 px box it is 36% of it
// (`STATS.model.recoilOverMark`), so the flinch is smaller RELATIVE to the
// subject than it was. It is left at 20 on purpose: it is a gesture, not a
// clearance, and `CUT4_RECOIL` is also the offset cut 5 opens on and releases.
// 14 was tried first and was swallowed by the camera's pull-back, which starts
// in the middle of it.
const RECOIL = 20; // world px, straight back down the needle's own line
const RECOIL_F0 = 94;
const RECOIL_DUR = 8;
const HOLD_F0 = 94;
const HOLD_F1 = 116;
const HOLD_AMT = 0.8; // the fraction of the breath that is held
const MODEL_SEED = 0.31; // ModelDot's own default, so the hold cancels it exactly

const modelOffset = (f: number) => {
  const u = smoothstep(clamp01((f - RECOIL_F0) / RECOIL_DUR));
  return { x: -Math.cos(ANG_FOLDER) * RECOIL * u, y: -Math.sin(ANG_FOLDER) * RECOIL * u };
};
const modelAt = (f: number) => {
  const o = modelOffset(f);
  return { x: MODEL_HOME.x + o.x, y: MODEL_HOME.y + o.y };
};
/** 1 normally; against the breath while the model holds it. */
const modelScaleAt = (f: number) => {
  const hold =
    HOLD_AMT *
    smoothstep(clamp01((f - HOLD_F0) / 5)) *
    (1 - smoothstep(clamp01((f - HOLD_F1) / 10)));
  return lerp(1, 1 / breath(f, MODEL_SEED), hold);
};

// ---------------------------------------------------------------------------
// THE NEEDLE. One angle, built as a chain of eased blends so it never jumps:
// cut 3's hovering middle -> the folder -> the wire's root -> the wire's head ->
// back to the wire's root. Its length is one expression for the same reason.
//
//   ANG_MID    where cut 3 left it (straight up, half-way)
//   ANG_FOLDER onto the folder; at GAZE_TOUCH the TIP is on the ring's edge
//   ANG_ROOT   onto the point the wire hangs off
// ---------------------------------------------------------------------------
/** The needle's length that puts its tip exactly on the folder ring's edge. */
const GAZE_TOUCH = Math.hypot(FOLDER.x - MODEL_HOME.x, FOLDER.y - MODEL_HOME.y) - FOLDER_R;
const ANG_ROOT = angleTo(MODEL_HOME, WIRE_A);

const SWING_F0 = 22; // "models"
const SWING_F1 = 34; // mid "see": the tip lands on the ring
const LIFT_F0 = 96;
const LIFT_F1 = 108;
const TRACK_F0 = 106;
const TRACK_F1 = 118;
const SETTLE_F0 = 128;
const SETTLE_F1 = 152;
/** How far toward the wire's head the needle actually goes. */
const TRACK_FRAC = 0.75;
/** The short needle it rests as, once the wire is the subject. */
const GAZE_REST = 150;
const DEG = Math.PI / 180;

const gazeAt = (f: number) => {
  // cut 3's own 3.5 deg drift, still running at its phase, handed over to the
  // swing rather than switched off
  const drift =
    3.5 * DEG * (1 - smoothstep(clamp01((f - 18) / 14))) * Math.sin((f + 23) * 0.105);
  // the hover while the tip rests on the ring: 0.8 deg, so the hold breathes
  const hover =
    0.8 *
    DEG *
    smoothstep(clamp01((f - SWING_F1) / 6)) *
    (1 - smoothstep(clamp01((f - LIFT_F0) / 8))) *
    Math.sin(f * 0.09);

  const swing = smoothstep(clamp01((f - SWING_F0) / (SWING_F1 - SWING_F0)));
  const lift = smoothstep(clamp01((f - LIFT_F0) / (LIFT_F1 - LIFT_F0)));
  const track = smoothstep(clamp01((f - TRACK_F0) / (TRACK_F1 - TRACK_F0)));
  const settle = smoothstep(clamp01((f - SETTLE_F0) / (SETTLE_F1 - SETTLE_F0)));

  const onRing = lerp(ANG_MID, ANG_FOLDER, swing) + drift + hover;
  const onRoot = lerp(onRing, ANG_ROOT, lift);
  // TRACK_FRAC: the needle follows the head, but only three quarters of the way
  // to it. The head ends straight above the model, and a needle standing exactly
  // vertical beside an almost-vertical wire reads as a second wire; three
  // quarters leaves it visibly leaning into the wire instead, and leaves the
  // payoff to the wire, the pull-back and the person.
  const onHead = lerp(onRoot, angleTo(modelAt(f), wireHead(f)), track * TRACK_FRAC);
  const angle = lerp(onHead, ANG_ROOT, settle);

  const length =
    GAZE_LEN +
    (GAZE_TOUCH - GAZE_LEN) * smoothstep(clamp01((f - SWING_F0) / (SWING_F1 - SWING_F0))) -
    (GAZE_TOUCH - GAZE_LEN) * lift -
    // it shortens to a hand as it leaves the ring and looks up the wire
    (GAZE_LEN - GAZE_REST) * track +
    2.2 *
      smoothstep(clamp01((f - SWING_F1) / 6)) *
      (1 - smoothstep(clamp01((f - LIFT_F0) / 8))) *
      Math.sin(f * 0.11 + 1.4);

  return { angle, length };
};

// ---------------------------------------------------------------------------
// THE GAZE PACKETS — accent, out along the needle and back, one at a time, the
// same 16-frame period as the work thread so the piece has ONE rhythm. They stop
// AT the ring, never inside it: the model is reading the label.
//
// On "huh" every packet still travelling OUT turns round where it is and drains
// home. That is the halt, and it is the packets' own geometry, not a fade.
// ---------------------------------------------------------------------------
const GP_F0 = 46; // "there's an"
const GP_PERIOD = 16; // -> launches on f46, f62, f78, f94
const GP_LAST = 95; // no launch on or after this frame
const GP_SPEED = 26; // world px/frame (the 45 px/frame cap never binds here)
const GP_HALT = 97; // "huh"
const GP_TRAVEL = (GAZE_TOUCH - THREAD_GAP) / GP_SPEED;

/** How far out along the needle each live packet is, 0..1 of the needle's
 *  travel, on frame `f`. */
const gazePackets = (f: number) => {
  const out: number[] = [];
  const span = GAZE_TOUCH - THREAD_GAP;
  for (let t0 = GP_F0; t0 < GP_LAST; t0 += GP_PERIOD) {
    const t = f - t0;
    if (t < 0) continue;
    const tHalt = GP_HALT - t0;
    let d: number;
    if (tHalt >= 0 && tHalt < GP_TRAVEL && f > GP_HALT) {
      // it was still outbound when the model stopped: turn round, there
      d = GP_SPEED * tHalt - GP_SPEED * (f - GP_HALT);
    } else if (t <= GP_TRAVEL) {
      d = GP_SPEED * t;
    } else {
      d = GP_SPEED * (2 * GP_TRAVEL - t);
    }
    // `d === 0` is a packet on the model's own rim, the frame it launches: the
    // thread must not blink empty for one frame every period.
    if (d < 0 || d > span) continue;
    out.push(d / span);
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE WIRE PACKETS — white, up the wire to the evaluator, the first one leaving
// the root on the frame the head lands. (Drawn here rather than through the
// shared `Wire`, whose packet phase is tied to frame 0: switching that on at
// f117 pops a packet into existence in the middle of the line.)
// ---------------------------------------------------------------------------
const WP_PERIOD = 16;
const WP_SPEED = 26;
const WP_TRAVEL = WIRE_LEN / WP_SPEED;
/** Every other packet in the clip is PACKET_R_PX of SCREEN at CAM_CLOSE, which
 *  is where those cuts resolve. These ones live entirely at CAM_WIDE, so they
 *  are solved at the camera they are actually seen at — and the value is the
 *  module's `WIRE_PACKET_R`, which `Wire` itself now uses, so a bead on the wire
 *  is the same size here as it is in cut 5. */
const WP_R = WIRE_PACKET_R;

const wirePackets = (f: number) => {
  const out: number[] = [];
  for (let t0 = WIRE_LAND; t0 <= f; t0 += WP_PERIOD) {
    const u = (f - t0) / WP_TRAVEL;
    if (u >= 0 && u <= 1) out.push(u);
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE STATE, frame by frame. `Tableau` draws it in the one legal z-order, so
// this cut's picture cannot drift from cut 3's.
// ---------------------------------------------------------------------------
const KEY_BOB_STOP = 34; // the frame the needle's tip touches the ring
const KEY_BOB_DECAY = 8;

const stateAt = (frame: number): TableauState => {
  const g = gazeAt(frame);
  return {
    frame,
    // the eval, exactly as cut 3 left it: drawn, fully dashed, marching
    wallDraw: 1,
    // the question and the folder, in place
    questionDraw: 1,
    folderDraw: 1,
    keyRise: 1,
    // cut 3's bob, at its own phase, stopped by the touch and not by a timer
    keyBob:
      4 *
      Math.sin((frame + 47) * 0.157) *
      (1 - smoothstep(clamp01((frame - KEY_BOB_STOP) / KEY_BOB_DECAY))),
    // the folder is bait: its ring opens into dashes as the wire is revealed
    folderDashed: smoothstep(clamp01((wireProgress(frame) - 0.03) / 0.45)),
    // it never stops working the problem
    workThread: 1,
    workPackets: true,
    gazeAngle: g.angle,
    gazeLength: g.length,
    wire: wireProgress(frame),
    wirePackets: false, // this cut draws them, see wirePackets()
    modelTone: 1, // cut 3 left it lit, and it never stops thinking
    modelOffset: modelOffset(frame),
    modelScale: modelScaleAt(frame),
    evaluatorOpacity: 1, // never faded in: the pull-back finds them
  };
};

// ---------------------------------------------------------------------------

const SeemsLikeATrap: React.FC<Props> = ({
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

  const g = gazeAt(frame);
  const m = modelAt(frame);
  const gc = Math.cos(g.angle);
  const gs = Math.sin(g.angle);
  const gp = gazePackets(frame);
  const wp = wirePackets(frame);

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
              gp.length > 0 ? (
                <g style={{ filter: iconShadow(k) }}>
                  {gp.map((u, i) => (
                    <circle
                      key={`gp${i}`}
                      cx={m.x + gc * (THREAD_GAP + u * (g.length - THREAD_GAP))}
                      cy={m.y + gs * (THREAD_GAP + u * (g.length - THREAD_GAP))}
                      r={PACKET_R}
                      fill={ACCENT}
                    />
                  ))}
                </g>
              ) : null
            }
            over={
              wp.length > 0 ? (
                <g style={{ filter: iconShadow(k) }}>
                  {wp.map((u, i) => (
                    <circle
                      key={`wp${i}`}
                      cx={lerp(WIRE_A.x, WIRE_B.x, u)}
                      cy={lerp(WIRE_A.y, WIRE_B.y, u)}
                      r={WP_R}
                      fill={INK}
                    />
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

export default SeemsLikeATrap;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  models: defaultProps.beats.models,
  see: defaultProps.beats.see,
  theres: defaultProps.beats.theres,
  folder: defaultProps.beats.folder,
  huh: defaultProps.beats.huh,
  trap: defaultProps.beats.trap,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);
export const STATE_AT = (f: number) => stateAt(f);

// ---------------------------------------------------------------------------
// MEASUREMENTS. Every claim in the report is read off this.
// ---------------------------------------------------------------------------
const EV_INK_TOP = EVALUATOR.y - (PERSON_H * 0.84) / 2;
const EV_INK_BOTTOM = EVALUATOR.y + (PERSON_H * 0.84) / 2;

export const STATS = {
  duration: DURATION,
  kEnd: Number(K_END.toFixed(5)),
  kAt: [0, 22, 34, 51, 77, 90, 97, 103, 110, 112, 117, 126, 138, LAST].map((f) => [
    f,
    Number(kAt(f).toFixed(4)),
  ]),
  camAt: [0, 34, 56, 90, 104, 117, LAST].map((f) => [
    f,
    Number(camAt(f).cx.toFixed(1)),
    Number(camAt(f).cy.toFixed(1)),
  ]),

  /** The camera itself: the screen speed of fixed world points and its
   *  frame-to-frame change (the set's |dv| ceiling is 2.2, the "parked" floor
   *  for the mean is 0.15). */
  camAudit: (() => {
    const pts = [
      [WALL.cx - WALL.r, WALL.cy],
      [WALL.cx + WALL.r, WALL.cy],
      [WALL.cx, WALL.cy - WALL.r],
      [WALL.cx, WALL.cy + WALL.r],
      [MODEL_HOME.x, MODEL_HOME.y],
      [QUESTION.x, QUESTION.y],
      [FOLDER.x, FOLDER.y],
      [EVALUATOR.x, EVALUATOR.y],
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

  /** The caption-safe band: where the ink actually sits, per frame. */
  framing: [0, 34, 56, 90, 104, 117, LAST].map((f) => {
    const wl = screenAt(f, WALL.cx - WALL.r, WALL.cy).x;
    const wr = screenAt(f, WALL.cx + WALL.r, WALL.cy).x;
    const wt = screenAt(f, WALL.cx, WALL.cy - WALL.r).y;
    const wb = screenAt(f, WALL.cx, WALL.cy + WALL.r).y;
    return {
      f,
      wallX: [Number(wl.toFixed(0)), Number(wr.toFixed(0))],
      wallY: [Number(wt.toFixed(0)), Number(wb.toFixed(0))],
      evalY: [
        Number(screenAt(f, EVALUATOR.x, EV_INK_TOP).y.toFixed(0)),
        Number(screenAt(f, EVALUATOR.x, EV_INK_BOTTOM).y.toFixed(0)),
      ],
      model: [
        Number(screenAt(f, modelAt(f).x, modelAt(f).y).x.toFixed(0)),
        Number(screenAt(f, modelAt(f).x, modelAt(f).y).y.toFixed(0)),
      ],
      folder: [
        Number(screenAt(f, FOLDER.x, FOLDER.y).x.toFixed(0)),
        Number(screenAt(f, FOLDER.x, FOLDER.y).y.toFixed(0)),
      ],
    };
  }),

  /** Screen sizes of the shared nouns at this cut's two framings. */
  sizes: {
    strokeAtOpen: Number((STROKE_W * kAt(0)).toFixed(2)),
    strokeAtLast: Number((STROKE_W * kAt(LAST)).toFixed(2)),
    markAtOpen: Number((MODEL_MARK * kAt(0)).toFixed(1)),
    markAtLast: Number((MODEL_MARK * kAt(LAST)).toFixed(1)),
    stationAtOpen: Number((STATION_R * kAt(0)).toFixed(1)),
    personAtLast: Number((PERSON_H * 0.84 * kAt(LAST)).toFixed(1)),
  },

  /** The wire: the solved start, the wall crossing, and the head's worst frame. */
  wire: (() => {
    let worst = { f: -1, v: 0 };
    for (let f = WIRE.f0 + 1; f <= WIRE_LAND; f++) {
      const a = wireHead(f - 1);
      const b = wireHead(f);
      const sa = screenAt(f - 1, a.x, a.y);
      const sb = screenAt(f, b.x, b.y);
      const v = Math.hypot(sb.x - sa.x, sb.y - sa.y);
      if (v > worst.v) worst = { f, v };
    }
    let cross = -1;
    for (let f = WIRE.f0; f <= WIRE_LAND; f++) {
      const h = wireHead(f);
      if (Math.hypot(h.x - WALL.cx, h.y - WALL.cy) > WALL.r) {
        cross = f;
        break;
      }
    }
    return {
      f0: WIRE.f0,
      land: WIRE_LAND,
      lenWorld: Number(WIRE_LEN.toFixed(1)),
      root: [Number(WIRE_A.x.toFixed(1)), Number(WIRE_A.y.toFixed(1))],
      feet: [Number(WIRE_B.x.toFixed(1)), Number(WIRE_B.y.toFixed(1))],
      wallCrossFrame: cross,
      headMaxScreenSpeed: [worst.f, Number(worst.v.toFixed(1))],
      progressAt: [100, 105, 110, 114, 117].map((f) => [f, Number(wireProgress(f).toFixed(3))]),
    };
  })(),

  /** The folder ring's conversion, keyed on the wire and not on a timer. */
  folderDashedAt: [100, 104, 108, 112, 117].map((f) => [
    f,
    Number(stateAt(f).folderDashed.toFixed(3)),
  ]),

  /** The needle, in degrees, and its tip's distance from the folder's centre
   *  (FOLDER_R means the tip is exactly on the ring). */
  gaze: [0, 22, 28, 34, 60, 96, 103, 108, 117, 128, LAST].map((f) => {
    const g = gazeAt(f);
    const m = modelAt(f);
    const tip = { x: m.x + Math.cos(g.angle) * g.length, y: m.y + Math.sin(g.angle) * g.length };
    return {
      f,
      deg: Number((g.angle / DEG).toFixed(1)),
      len: Number(g.length.toFixed(1)),
      tipToFolder: Number(Math.hypot(tip.x - FOLDER.x, tip.y - FOLDER.y).toFixed(1)),
    };
  }),
  folderR: Number(FOLDER_R.toFixed(1)),
  gazeTouchLen: Number(GAZE_TOUCH.toFixed(1)),

  /** Traffic: nothing may be still for more than a few frames. */
  packets: {
    gazeLaunches: (() => {
      const out: number[] = [];
      for (let t0 = GP_F0; t0 < GP_LAST; t0 += GP_PERIOD) out.push(t0);
      return out;
    })(),
    gazeTravel: Number(GP_TRAVEL.toFixed(2)),
    gazeAliveAt: [46, 55, 62, 78, 94, 97, 99, 101].map((f) => [f, gazePackets(f).length]),
    gazeDrainDone: (() => {
      for (let f = GP_HALT; f <= DURATION; f++) if (gazePackets(f).length === 0) return f;
      return -1;
    })(),
    wireTravel: Number(WP_TRAVEL.toFixed(2)),
    wireAliveAt: [117, 125, 133, 140, 149, LAST].map((f) => [f, wirePackets(f).length]),
  },

  /** The model: the recoil and the held breath. `emAt` is the OpenAI mark's em
   *  box in world px, which is what `breath` and the hold now act on. */
  model: {
    recoilWorld: RECOIL,
    recoilScreenAt117: Number((RECOIL * kAt(117)).toFixed(1)),
    /** the recoil as a fraction of the mark's own width, which is what the eye
     *  reads it against (it was 0.75 of the 42 px dot's diameter) */
    recoilOverMark: Number((RECOIL / MODEL_MARK).toFixed(3)),
    emAt: [90, 100, 106, 112, 130, LAST].map((f) => [
      f,
      Number((MODEL_MARK * modelScaleAt(f) * breath(f, MODEL_SEED)).toFixed(3)),
    ]),
  },

  /** The frame the evaluator's ink first crosses the top edge, and the frame
   *  they are fully in frame. */
  evaluatorEnters: (() => {
    let first = -1;
    let full = -1;
    for (let f = 0; f <= LAST; f++) {
      if (first < 0 && screenAt(f, EVALUATOR.x, EV_INK_BOTTOM).y > 0) first = f;
      if (full < 0 && screenAt(f, EVALUATOR.x, EV_INK_TOP).y > 0) full = f;
    }
    return { first, full };
  })(),
};
