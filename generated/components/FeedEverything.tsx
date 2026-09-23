import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_LIFT, FRAME_H, camEase, sway } from "./fieldShared";
import {
  CFE_CREEP_DK,
  CFE_CREEP_F0,
  CFE_CREEP_F1,
  CFE_DURATION,
  CFE_RESOLVED,
  CX_REST,
  C_REST,
  EXH,
  EX_GAP,
  ExchangeSpec,
  FOOD,
  IB_Y1,
  K_REST,
  LOG_BOTTOM,
  LogWindow,
  SHADOW,
  World,
  makeLog,
  runCamera2,
} from "./cottageShared";

export const FPS = 24;
// Clip "anna - chatgpt knows my cottage cheese", 44.6 s. The composition starts
// at clip 9.05 s (just before "I"); speech ends on the end of "calories",
// 13.10 s. round((13.10 - 9.05) * 24) = 97 frames of speech, plus a 24-frame
// tail so the resolved window holds = 121. Delivered as `9_FeedEverything.mov`.
export const DURATION = CFE_DURATION; // 121

// ---------------------------------------------------------------------------
// "FEED EVERYTHING" — cut 1 of 2. The line:
//   "(you know,) I feed everything I eat into ChatGPT to calculate my calories,"
//
// Word onsets (faster-whisper large-v3, clip-relative), frame = round((t - 9.05) * 24):
//   I 9.26 -> 5 · feed 9.36 -> 7 · everything 9.76 -> 17 · I 10.38 -> 32 ·
//   eat 10.64 -> 38 · into 10.94 -> 45 · ChatGPT 11.22 -> 52 · to 11.82 -> 66 ·
//   calculate 12.04 -> 72 · my 12.34 -> 79 · calories 12.68 -> 87 (ends 13.10 -> 97)
//
// THE WORLD is `cottageShared.tsx` (this cut owns it; cut 2 imports it): one
// ChatGPT chat in the paper/ink material — header lockup, a log that scrolls
// up under the header, user pills on the right, AI replies written behind a
// white caret on the left, an input bar with a black caret and a send button.
// The geometry, the verified USDA numbers and the API are in its header.
//
// THE CONCEPT — THE LOG EATS. One continuous motion: messages flowing up a
// ChatGPT log while the camera glides back from the input bar to reveal the
// ChatGPT header that everything flows under. Typed, sent, answered, pushed up
// under the header, on a steady ~30 f per exchange; each reply finishes before
// the next send, like the real app.
//
// V2 (director's note on V1: the open read as a parked camera drifting up).
// ONE BIG GLIDE from a close-up on the act of typing to the whole window.
// V3 (note on V2: still top-heavy): THE INPUT BAR IS ANCHORED LOW, like a
// phone's chat screen — its bottom edge on screen y 1400 at the open and held
// near that line through the glide, which becomes a pull-back pinned on the bar.
//
// THE GESTURES — each with the word it serves. Nothing else moves except the
// paper's drift and the camera's sway.
//   1. f0      CLOSE on the act (k 1.40, cx 640): the input bar low (bottom edge
//              at screen y 1400) with its black caret and send button, the
//              right-hand pill lane above it (TOAST, APPLE), the older replies
//              cut by the LEFT frame edge; the send button's right edge 123 px
//              inside the frame. Above TOAST (y 428 up) is the log's empty top
//              slot: only two exchanges of history exist. "2 EGGS" types f1-f6.
//                                                                 — "I" (5)
//   2. f7-f22  SEND "2 EGGS" (15 f at this k): the pill grows out of the bar and
//              rises into the bottom slot; the log scrolls up by one exchange on
//              the same clock; the arrow nudges.                   — "feed" (7)
//   3. f6-f49  THE ONE CAMERA MOVE: one eased, C1 pull-back pinned on the input
//              bar (k 1.40 -> 1.00, cx 640 -> 540, the bar's bottom edge held on
//              screen y 1397-1425), starting with the first send. The log widens
//              above the bar, the column's left edge comes in (x 120 at screen
//              60 by f32), the HEADER descends into frame from the top (wholly
//              in f27, below y 200 from f39) and the window is framed, k 1.002
//              at f46, still by f49.          — "everything I eat into ChatGPT"
//   4. f29-f56 the first reply, once x 120 is 60 px inside: the caret grows in
//              (f29-32), writes three bars and "143 KCAL" (whole at f52), thins.
//   5. f40-f51 "BLACK COFFEE" types; f52-f63 SEND (11 f) — TOAST slides under
//              the header; the reply writes f61-f75 ("2 KCAL" whole at f75).
//   6. f69-f74 "BANANA" types; f75-f86 SEND — APPLE slides under the header;
//              the reply writes f84-f98, "105 KCAL" whole at f98.
//                                                 — "calculate my calories" (72-97)
//   7. f98-f120 HOLD on the resolved frame (unchanged from V1: header, 2 EGGS /
//              143, BLACK COFFEE / 2, BANANA / 105, the bar with its caret); the
//              creep k 1.000 -> 1.013 carries it; the paper drifts.
//
// THE CAMERA — cut-local (constants below), PeakForSolar's `runCamera2`.
//   OPEN   f0      k 1.40, cx 640, cy 1112.71: cy is solved so the bar's bottom
//                  edge (world 1427) sits on screen y 1400
//   GLIDE  f6-40   k 1.40 -> 1.00 and the bar's screen line 1400 -> 1427 on one
//                  curve (warp 0.9), cy = 1427 - (line - 960) / k; cx 640 -> 540
//                  on the same family over f6-32 (warp 1.0); one key per frame
//   CREEP  f84-136 the shared CFE creep, key for key; the last frame equals
//                  CFE_RESOLVED (asserted at module load)
//   THE DAMPED NUMBERS (no sway):
//     f    k        cx       cy        bar bottom   x of x120   header top
//     0    1.4000   640.00   1112.71   1400.0       -188        -263
//     7    1.3998   639.96   1112.66   1397.5       -189        -265   "feed"
//     14   1.3704   631.24   1104.35   1397.6       -163        -230
//     22   1.2650   596.18   1071.33   1404.1        -65         -99
//     26   1.1991   574.79   1047.90   1408.7         -9         -16
//     32   1.1049   549.75   1009.86   1415.4         62         103   first reply
//     38   1.0351   541.13    977.61   1420.4        101         191   "eat"
//     46   1.0022   539.96    961.18   1423.6        116         233   "into"
//     52   0.9999   539.98    959.98   1425.0        118         237   "ChatGPT"
//     87   1.0000   540.00    960.00   1432.0        122         244   "calories"
//     120  1.0132   540.00    958.37   1434.7        117         231
//   On screen (band corners + centre followed frame to frame): max speed 22.1
//   px/f, max |dv| 1.80 px/f^2 at f12 (the glide's first frames).
//
// MEASURED (scratchpad cfe/sim.ts + measure2.ts, 1080x1920 screen px):
//   speeds   continuous motions all <= 45.1: 2 EGGS pill 45.1 (f15, 15 f send
//            at k 1.40 — the anchored camera no longer offsets its rise) /
//            COFFEE 44.9 / BANANA 45.0; AI caret 43.8 / 44.0 / 44.1; header
//            21.8 while on screen. The only step over 45 is a keystroke: at
//            k 1.40 each "2 EGGS" character pushes the right-aligned line left
//            by up to 51.6 px (f4).
//   band     right-most ink 1003.6 at every frame (send button >= 108 px
//            inside); bottom <= 1438.7; the left side is cut by the frame at
//            the open by design. TOAST's pill: y 428 at the open, pushed up to
//            148 by the first send (f20), carried back down by the pull-back.
//
// DEVIATION — "105 KCAL" IS WHOLE AT f98, NOT ~f86. With the bars fixed (they
// are the resolved frame cut 2 starts from), the chain after the first reply
// starts is 2 EGGS reply + COFFEE send->reply + COFFEE reply + BANANA
// send->reply + BANANA reply = 62-66 frames under the 45 px/f cap, and a smooth
// glide (|dv| <= 3) cannot bring x 120 to screen 60 before f31-32. f86 needs
// the first reply to start by f24, which takes a camera at |dv| ~12 and
// ~60 px/f.
// ---------------------------------------------------------------------------

export const schema = z.object({
  // the hand on the camera, as in every piece of the set
  sway: z.boolean(),
  beats: z.object({
    i: z.number(), // "I"            — "2 EGGS" types
    feed: z.number(), // "feed"      — send 2 EGGS
    everything: z.number(), // "everything" — the glide is under way
    eat: z.number(), // "eat"        — send BLACK COFFEE
    chatgpt: z.number(), // "ChatGPT" — header in, window framed
    calculate: z.number(), // "calculate" — the BANANA send
    calories: z.number(), // "calories"   — the BANANA reply writes
    end: z.number(), // speech ends; tail to 121
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  sway: true,
  beats: {
    i: 5,
    feed: 7,
    everything: 17,
    eat: 38,
    chatgpt: 52,
    calculate: 72,
    calories: 87,
    end: 97,
  },
});

// ---------------------------------------------------------------------------
// V2 — CUT-LOCAL OPEN, CAMERA AND SCHEDULE. The shared module's K_OPEN /
// CX_OPEN / CY_OPEN / C_OPEN and its CFE_CAM_* / CFE_SPECS are cut 1's V1 and
// are left untouched for cut 2 (which imports them); this cut no longer reads
// them. Its end state is unchanged: same log, same creep, and the camera on
// the last frame equals the shared CFE_RESOLVED (asserted below).
// ---------------------------------------------------------------------------
/** The open: tight on the act of typing, the right-hand part of the column. */
export const K_OPEN_CFE = 1.4;
/** The send button's right edge (938) lands at screen 957, 123 px inside; the
 *  input bar's shadowed end (964) at 993.6. The column runs off the LEFT edge. */
export const CX_OPEN_CFE = 640;
/** V3: THE INPUT BAR IS ANCHORED LOW, like a phone's chat screen. cy is not
 *  keyed from a content centre but from the SCREEN LINE the bar's bottom edge
 *  (ink, world IB_Y1 = 1427) sits on: y 1400 at the open, easing on the zoom's
 *  own curve to 1427, where the resting camera (k 1, cy 960) already puts it.
 *  So the glide is a pull-back pinned on the bar: the log widens above it and
 *  the header descends into frame from the top. */
export const BAR_SCREEN_OPEN = 1400;
export const BAR_SCREEN_REST = FRAME_H / 2 + (IB_Y1 - (C_REST + CAM_LIFT / K_REST)) * K_REST; // 1427
const cyForBar = (k: number, barScreen: number) => IB_Y1 - (barScreen - FRAME_H / 2) / k;
/** This cut's opening cy (V3): the bar's bottom edge on screen y 1400. */
export const CY_OPEN_BAR_CFE = cyForBar(K_OPEN_CFE, BAR_SCREEN_OPEN); // 1112.71

/** V2's open, KEPT AT ITS V2 VALUES because `WhereDoesThatGo.tsx` (cut 2, built
 *  in parallel) imports these two names for its own opening camera. This cut
 *  no longer uses them; changing them would move cut 2's camera. See
 *  SHARED_CHANGES.md. */
export const C_OPEN_CFE = (LOG_BOTTOM - EXH + EX_GAP + IB_Y1 + SHADOW) / 2; // 1225.45
export const CY_OPEN_CFE = C_OPEN_CFE + CAM_LIFT / K_OPEN_CFE; // 1314.74

// THE GLIDE: one move, three channels on one family of curves. k and the bar's
// screen line (so cy) ease together over f6-40; cx eases over f6-32, a little
// ahead, so the column's left edge is framed before the zoom settles.
export const GLIDE_F0 = 6;
export const GLIDE_F1 = 40;
export const GLIDE_WARP = 0.9;
export const PAN_F1 = 32;
export const PAN_WARP = 1.0;

const buildTrack = () => {
  const F: number[] = [0];
  const K: number[] = [K_OPEN_CFE];
  const CY: number[] = [CY_OPEN_BAR_CFE];
  const CX: number[] = [CX_OPEN_CFE];
  for (let f = GLIDE_F0; f <= GLIDE_F1; f++) {
    const g = camEase((f - GLIDE_F0) / (GLIDE_F1 - GLIDE_F0), GLIDE_WARP);
    const gx = camEase((f - GLIDE_F0) / (PAN_F1 - GLIDE_F0), PAN_WARP);
    const k = K_OPEN_CFE + (K_REST - K_OPEN_CFE) * g;
    const bar = BAR_SCREEN_OPEN + (BAR_SCREEN_REST - BAR_SCREEN_OPEN) * g;
    F.push(f);
    K.push(k);
    CY.push(cyForBar(k, bar));
    CX.push(CX_OPEN_CFE + (CX_REST - CX_OPEN_CFE) * gx);
  }
  // the creep — the shared CFE track's, key for key
  for (let f = CFE_CREEP_F0; f <= CFE_CREEP_F1; f++) {
    const g = camEase((f - CFE_CREEP_F0) / (CFE_CREEP_F1 - CFE_CREEP_F0), 1);
    const k = K_REST + CFE_CREEP_DK * g;
    F.push(f);
    K.push(k);
    CY.push(C_REST + CAM_LIFT / k);
    CX.push(CX_REST);
  }
  return { F, K, CY, CX };
};
const TRACK = buildTrack();
export const cfeCameraV2 = (f: number) => runCamera2(f, TRACK.F, TRACK.CY, TRACK.CX, TRACK.K);
{
  const end = cfeCameraV2(CFE_DURATION - 1);
  const err = Math.max(
    Math.abs(end.k - CFE_RESOLVED.k),
    Math.abs(end.cx - CFE_RESOLVED.cx),
    Math.abs(end.cy - CFE_RESOLVED.cy),
  );
  if (err > 1e-6) {
    throw new Error(`FeedEverything: the V2 camera does not end on CFE_RESOLVED (off by ${err})`);
  }
}

// THE SCHEDULE. The first reply waits for the column's left edge (x 120) to be
// 60 screen px inside the frame (f32); each reply is whole before the next send.
export const CFE_V2_SPECS: ExchangeSpec[] = [
  { food: FOOD.toast },
  { food: FOOD.apple },
  // the first send runs at k 1.40, so it takes 15 f; the reply writes at 32
  // world px/f because the camera's settle adds to it on screen
  { food: FOOD.eggs, typeAt: 1, sendAt: 7, sendF: 15, replyAt: 32, replyRate: 32 },
  // later sends at rest: 11 f, reply 9 f after the send starts (the slot has
  // slowed to 18 world px/f, so caret + slot stays under 45)
  { food: FOOD.coffee, typeAt: 40, sendAt: 52, sendF: 11, replyAt: 61 },
  { food: FOOD.banana, typeAt: 69, sendAt: 75, sendF: 11, replyAt: 84 },
];

const LOG = makeLog(CFE_V2_SPECS);
const REST = { cx: CX_OPEN_CFE, cy: CY_OPEN_BAR_CFE };

const FeedEverything: React.FC<Props> = ({ sway: withSway }) => {
  const frame = useCurrentFrame();
  const cam = cfeCameraV2(frame);
  const d = withSway ? sway(frame) : { dx: 0, dy: 0 };
  return (
    <World frame={frame} cam={{ cx: cam.cx + d.dx, cy: cam.cy + d.dy, k: cam.k }} rest={REST}>
      <LogWindow log={LOG} frame={frame} idPrefix="cfe" />
    </World>
  );
};

export default FeedEverything;
