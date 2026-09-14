import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
// The kraft backdrop, the D1 mark and the company cards. Imported, never redrawn.
import {
  CARD_SIZE,
  CompanyCard,
  D1Mark,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  MARK_SIZE,
  SECTOR_NAMES,
} from "./d1Shared";
// THE WORLD. This piece IS the cut before it, ten seconds later, so every piece
// of geometry — the ground, the twelve cards, the threads, the return pile on
// top of the mark — AND the motion language that carries them — the `flow`
// travel curve, the `overshoot` settle, the linear COIN_FLIGHT, the click
// lengths, the camera's resolved framing — are IMPORTED from
// `IsItEvenWorthItV2.tsx` and none of them is restated here. f0 of this piece
// is that piece's last frame.
import {
  AMBIENT,
  CLICK_HALF,
  CLICK_HALF_DUR,
  CLICK_INK,
  COIN_FLIGHT,
  COIN_GROW,
  COIN_R,
  C_FINAL,
  CY_FINAL,
  DURATION as IW2_DURATION,
  DEPTH_DEEP,
  DEPTH_SETTLED,
  EASE_LAND,
  GROUND_OP,
  GROUND_W,
  GROUND_X0,
  GROUND_X1,
  GROUND_Y,
  K_FINAL,
  MARK_BOTTOM,
  MARK_X,
  MARK_Y,
  N_CARDS,
  PACKET_DUR,
  PACKET_R,
  PACKET_STEP,
  PRESS_OVER,
  RETURN_FINAL,
  RETURN_PEAK,
  RETURN_ROW0_Y,
  RETURN_ROW_PITCH,
  RETURN_X,
  SUBJECT,
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  WORLD_H,
  WORLD_W,
  cardTopY,
  cardX,
  flow,
  originX,
  overshoot,
  returnCoinPos,
} from "./IsItEvenWorthItV2";

export const FPS = 24;
// Dan Sundheim (D1 Capital), on the short book after the year off:
// "As it turns out, if you look at our short alpha since that time, our short
// alpha has been as good or better."
//
// SRT span 0:43.259 -> 0:49.359 at 24fps.
// round((49.359 - 43.259) * 24) = round(6.100 * 24) = round(146.4) = 146
// frames of speech, plus a 16 frame tail so the resolved state holds = 162.
export const DURATION = 162;
// f0 of this piece is the frame AFTER cut 2's last one, so the two ambient
// clocks that are pure functions of the frame number — the camera's `sway` and
// the kraft sheet's own drift and parallax — are read at `frame + CONTINUE_FROM`
// rather than at `frame`. Without it both restart from zero at the cut: the
// sheet's mottle jumps back 52 px and every edge in the frame shifts by the
// sway's amplitude. Measured: the difference image between cut 2's last frame
// and this one's first goes from lit edges on every card, thread and tile to
// nothing but the two frames' own drift.
export const CONTINUE_FROM = IW2_DURATION;

// ---------------------------------------------------------------------------
// "As good or better" — the payoff cut of the clip. V2: every noun is a thing.
//
// Orange Dwarkesh style on kraft: opaque 1080x1920 cutaway at 24fps, ink
// #FFFFFF, two tones of one amber (ACCENT_DEEP at rest, ACCENT lit), solid
// dots, one stroke weight, one landing ease, `iconShadow(k)` on every card and
// mark, `Vignette` last.
//
// THE WORLD IS THE CUT BEFORE IT, AND IT IS IMPORTED, NOT RESTATED.
// `IsItEvenWorthItV2.tsx` resolves on: the ground line at GROUND_Y, the D1 mark
// at (MARK_X, MARK_Y) with RETURN_FINAL coins left on top of it in the DEEP
// tone, and N_CARDS different company cards held a little way under the line at
// DEPTH_SETTLED, each on a THREAD_IDLE thread that leaves the mark's bottom at
// originX(i), with one ambient ink bead every PACKET_STEP frames drifting DOWN
// a thread. Its pile once reached RETURN_PEAK coins — that height is the thing
// this piece measures against. f0 opens on that piece's K_FINAL / C_FINAL, so a
// viewer sees the same world ten seconds on, mid-traffic.
//
// THE PICTURE. Twelve companies pressed properly deep, one after another left
// to right, and money coming back up every thread and piling on D1 — first up
// to the old peak ("as good"), then past it ("or better"). Comparison is HEIGHT
// AGAINST A MARKED PEAK, and the number is read off the pile, never a chart.
//
// Word onsets, from composition start (= 43.259):
//   f0 as · f8 it · f11 turns · f15 out · f27 if · f33 you · f36 look · f43 at
//   f48 our · f54 short · f60 alpha · f66 since · f74 that · f89 time
//   f98 our · f100 short · f105 alpha · f110 has · f116 been · f120 as
//   f126 good · f131 or · f134 better (speech ends f146) · tail to f162
//
// THE SIX GESTURES, one per word, and nothing else.
//
//   1. THE THREADS WAKE                      — "as it TURNS OUT"     f0-f50
//      f0 is the inherited resolved frame, exactly: same cards at the same
//      depth, same idle threads, same RETURN_FINAL deep-tone coins on the mark,
//      same camera, and cut 2's tail traffic still drifting DOWN the threads so
//      the world carries over mid-motion. At f11 ("turns") the twelve threads
//      go THREAD_IDLE -> THREAD_LIVE over one WAKE_DUR ramp, the six coins
//      already on the mark warm deep -> ripe on the same ramp, and the mark's
//      amber dot ticks to the half-step for CLICK_INK frames: D1 is looking
//      again. From f15 the traffic has reversed and single ink beads come UP at
//      the shared AMBIENT ceiling, so the push is never dead air. THE CAMERA
//      pushes from f4 toward the LEFT END of the row — k K_FINAL -> K_WAVE, cx
//      MARK_X -> CX_LEFT, content C_FINAL -> C_WAVE, warp 0.72, keys f4-f38 so
//      the damper has it landed by f50 — framing where the wave will start.
//
//   2. THE FIRST COMPANY GOES DEEP           — "our SHORT ALPHA"    f50-f66
//      Card 0 (the car) is pressed DEPTH_SETTLED -> DEPTH_DEEP on cut 2's own
//      press — `flow` plus PRESS_OVER px of back(0.75) overshoot, so it goes a
//      few px too deep and eases up — keys f50-f62; `flow`'s soft start means
//      the eye sees it leave on "short" at f54. Its thread goes full ink for
//      CLICK_INK frames — a single-object beat, so it takes the full click —
//      and its first coin rises out of the tile's top edge and leaves up the
//      thread at f60, on cut 2's LINEAR COIN_FLIGHT. The camera has been dead
//      still since f50 and stays still to f66: the held breath.
//
//   3. THE WAVE                              — "SINCE THAT TIME"    f66-f127
//      The big motion, one continuous wave left -> right: card i (1..11) starts
//      its press at f66 + (i-1) * WAVE_STEP, hashed +-WAVE_JIT so the wave
//      breathes, each press WAVE_DUR frames on the same curve; card 11 starts
//      at f111 and is home at f127. Every card puts TWO coins up its thread:
//      each rises out of the tile's top edge, sits on it in the deep tone, and
//      climbs the thread ripe, absorbed at the mark's bottom — where the pile
//      gains one coin (scale-in over COIN_GROW frames on the house landing
//      ease, the arrival taking the half-step CLICK_HALF). THE CAMERA TRACKS
//      THE WAVEFRONT: one continuous eased pan, cx CX_LEFT -> CX_RIGHT at
//      k K_WAVE over keys f64-f94, warp 1.0, no stalls — measured, the front
//      sits at screen x 311 on f66, 561 on f82, 655 on f98.
//
//   4. PULL BACK AND RE-CENTRE               — "ALPHA has been"     f94-f126
//      k K_WAVE -> K_WIDE, cx -> MARK_X, content -> C_WIDE, warp 0.72, keys
//      f94-f118, landed by f126 — the whole row, the mark AND the pile at its
//      future full height in frame for the comparison. Both framings are
//      SOLVED, not typed: `frameFor` takes the top and bottom of what has to be
//      in shot, returns the largest k that fits that span inside the
//      caption-safe band and the content centre that puts the span's middle at
//      the middle of it. The pan hands straight over to the pull-back on one
//      frame, and the pull-back is 24 keys rather than 14 because coins are in
//      the air through it: a zoom-out and a coin climbing the same diagonal ADD
//      on screen, and the shorter move put one at 50 screen px/frame. Measured
//      at the resolve: row screen x 63-1017, pile top 343, ground 1081, the
//      deep cards' bottoms 1329 — inside x 60-1020 and y 200-1450, as is every
//      frame of the piece vertically.
//
//   5. THE REFERENCE RULE                    — "as GOOD"            f118-f128
//      A dashed ink rule at the height of the OLD PEAK's top — RETURN_ROW0_Y
//      less (rows(RETURN_PEAK) - 1) row pitches less a coin radius — draws in
//      ONE stroke from RULE_X0 to RULE_X1, f118-f128, RULE_W, dash RULE_DASH,
//      at GROUND_OP. The coin arrivals are timed so the pile holds exactly
//      RETURN_PEAK coins at f126 and NOTHING arrives between PRE_HOME and the
//      release run: the pile is level with the rule and holds there across the
//      word. That is "as good". No click; the rule is a measurement, not an
//      event.
//
//   6. PAST IT                               — "or BETTER"          f128-f146
//      The N_POST coins still sitting on their cards release in one staggered
//      run and the pile climbs PAST the rule, one coin a frame from f128 to
//      f146 — four rows to ten, six rows clear of it by the tail. Each
//      arrival is above the rule and takes the half-step. The camera creeps UP
//      RIDE_SCREEN screen px (warp 0.72, keys f130-f144) so the growing top of
//      the pile stays framed, then holds.
//
//   TAIL, f146-f162. Twelve deep cards, twelve live threads, RETURN_FINAL +
//   N_DELIVER coins on D1, and one ambient ink bead at AMBIENT travelling UP a
//   thread every TAIL_STEP frames — the return still coming home. Held
//   resolved; never fades out.
//
// ambient: the traffic this piece INHERITS (cut 2's tail runs one bead at a
// time DOWN an idle thread; those keep running until the threads wake, then the
// direction reverses), a sub-pixel bob on every card — ramped in after f11, so
// f0 is byte-for-byte the inherited frame — `sway` on the camera, and the kraft
// sheet's own parallax and drift. Not gestures; that is what this world is.
//
// THREE THINGS THE BRIEF ASKED FOR THAT THIS FILE DOES DIFFERENTLY, the first
// two so the two cuts match rather than so this one is nicer:
//   * coins ride LINEARLY at cut 2's own COIN_SPEED, not on a 16-frame `flow`.
//     Cut 2 chose linear deliberately — a stream whose spacing pumps reads as
//     stuttering — and the same coins on the same threads one cut later must
//     move the same way. Its SPEED, not its 22-frame duration: this row is 836
//     px wide, so an outer card's path is diagonal and half again as long, and
//     a fixed duration would both break the 45 px/frame cap and read as the far
//     companies paying faster than the near ones. Measured peak anywhere in the
//     piece, camera included: 43.9 screen px/frame, at f106.
//   * the pile is drawn here from cut 2's exported `returnCoinPos` rather than
//     through its `ReturnStack`, which scales only the single newest coin in.
//     The release run lands about one coin a frame against a COIN_GROW of 5, so
//     up to five are mid-scale-in at once and `arriving` cannot express it. The
//     geometry, the radius, the ease and the fill are still cut 2's.
//   * "past the rule by two full rows" is not arithmetically available. The
//     brief also fixes RETURN_FINAL + 24 = 30 coins and RETURN_PEAK coins on
//     f126; cut 2 exports RETURN_PEAK 12 and RETURN_FINAL 6, so the pile runs
//     four rows -> ten rows and clears the rule by SIX. The two hard reads —
//     level with the rule on "good", clearly past it on "better" — are kept.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a coin in flight, a live thread
  accentDeep: z.string(), // deep: a coin at rest on a card
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
  coinRadius: z.number(),
  cardSize: z.number(),
  markSize: z.number(),
  beats: z.object({
    as: z.number(), // "as"          — f0, the inherited resolved frame
    it: z.number(), // "it"
    turns: z.number(), // "turns"    — the threads wake, the mark's dot ticks
    out: z.number(), // "out"
    ifWord: z.number(), // "if"
    you: z.number(), // "you"
    look: z.number(), // "look"
    at: z.number(), // "at"
    our: z.number(), // "our"
    short: z.number(), // "short"    — card 0 leaves
    alpha: z.number(), // "alpha"    — and lands; its first coin is on the wire
    since: z.number(), // "since"    — THE WAVE starts, the camera tracks it
    that: z.number(), // "that"
    time: z.number(), // "time"
    ourTwo: z.number(), // "our"
    shortTwo: z.number(), // "short"
    alphaTwo: z.number(), // "alpha" — the pull-back starts
    has: z.number(), // "has"
    been: z.number(), // "been"
    asTwo: z.number(), // "as"       — the rule is drawing
    good: z.number(), // "good"      — the pile is exactly RETURN_PEAK high
    or: z.number(), // "or"
    better: z.number(), // "better"  — the held coins release, past the rule
    end: z.number(), // speech ends; tail to 162
  }),
});

export type Props = z.infer<typeof schema>;

// -- the world beyond what is inherited -------------------------------------
export const CARD_HALF = CARD_SIZE / 2;
export const RETURN_COLS = RETURN_X.length;
export const rows = (n: number) => Math.ceil(n / RETURN_COLS);
// The top edge of the pile when it holds n coins.
export const stackTopY = (n: number) =>
  RETURN_ROW0_Y - (Math.max(1, rows(n)) - 1) * RETURN_ROW_PITCH - COIN_R;
export const DEEP_BOTTOM_Y = GROUND_Y + DEPTH_DEEP + CARD_HALF;

// The old peak's top: what "as good" is measured against.
export const RULE_Y = stackTopY(RETURN_PEAK);
export const RULE_X0 = 430;
export const RULE_X1 = 650;
export const RULE_DASH = "10 8";
export const RULE_W = 2.5;
export const RULE_F0 = 118; // draws under "as" (f120) and reads on "good" (f126)
export const RULE_F1 = 128;

// The whole delivery: two coins per card, so the pile ends RETURN_FINAL +
// N_DELIVER high. N_PRE of them are home by "good"; the rest come after.
export const COINS_PER_CARD = 2;
export const N_DELIVER = N_CARDS * COINS_PER_CARD;
export const N_FINAL = RETURN_FINAL + N_DELIVER;
export const N_PRE = Math.max(0, Math.min(N_DELIVER, RETURN_PEAK - RETURN_FINAL));
export const N_POST = N_DELIVER - N_PRE;

export const PRESS_SPAN = DEPTH_DEEP - DEPTH_SETTLED;

// ---------------------------------------------------------------------------
// THE PRESS SCHEDULE. Every frame here is a word's frame or is solved from one.
// The press CURVE is cut 2's, imported: `flow` for the travel and PRESS_OVER px
// of `overshoot` along it for the settle. One curve across the two cuts.
// ---------------------------------------------------------------------------
export const WAKE_DUR = 6; // THREAD_IDLE -> THREAD_LIVE, on "turns"

export const PRESS0_F0 = 50; // card 0; `flow`'s soft start reads on f54
export const PRESS0_DUR = 12;
export const PRESS0_LAND = PRESS0_F0 + PRESS0_DUR; // f62

export const WAVE_F0 = 66; // "since"
export const WAVE_STEP = 4.5; // frames between two cards leaving
export const WAVE_DUR = 16; // one press
export const WAVE_JIT = 1; // +-1 frame per card, so the wave breathes

export const pressStart = (i: number) =>
  i === 0 ? PRESS0_F0 : WAVE_F0 + (i - 1) * WAVE_STEP + (hash(i, 31) - 0.5) * 2 * WAVE_JIT;
export const pressDur = (i: number) => (i === 0 ? PRESS0_DUR : WAVE_DUR);
export const pressAt = (i: number, f: number) => clamp01((f - pressStart(i)) / pressDur(i));
export const cardLand = (i: number) => pressStart(i) + pressDur(i);
export const depthAt = (i: number, f: number) => {
  const u = pressAt(i, f);
  return DEPTH_SETTLED + PRESS_SPAN * flow(u) + PRESS_OVER * overshoot(u);
};
// a sub-pixel bob so a card at rest is never frozen; ramped in after "turns" so
// f0 is exactly the frame cut 2 ended on. Not a gesture — the world breathing.
export const CARD_BOB = 0.7;
export const BOB_RAMP = 14;
export const bobAt = (i: number, f: number) =>
  CARD_BOB *
  clamp01((f - 11) / BOB_RAMP) *
  Math.sin(f * 0.11 + hash(i, 9) * 6.283);

// ---------------------------------------------------------------------------
// THE CAMERA. Four moves, one track, all through the shared damper, and every
// one of them follows a gesture: the lens goes where the thing that is about to
// happen is, arrives ahead of the word, and then holds. Between moves nothing
// is on the camera but `sway`.
//
// The two framings are SOLVED rather than typed. `frameFor` takes the top and
// the bottom of what has to be in shot and returns the largest k that fits it
// inside the caption-safe band plus the content centre that puts the span's
// middle at the middle of that band (`cy = c + CAM_LIFT/k`, so zoom and framing
// settle together). C_WAVE has to hold the pile at its RETURN_PEAK height and
// the deep cards; C_WIDE has to hold the pile at its FINAL height and the deep
// cards, which is what sets how far the pull-back goes.
// ---------------------------------------------------------------------------
export const SAFE_TOP = 200;
export const SAFE_BOT = 1450;
export const SAFE_MID = (SAFE_TOP + SAFE_BOT) / 2;
export const frameFor = (top: number, bot: number, kMax: number) => {
  const k = Math.min(kMax, (SAFE_BOT - SAFE_TOP) / (bot - top));
  return { k, c: (top + bot) / 2 + (960 - SAFE_MID - CAM_LIFT) / k };
};

export const WAVE_FRAME = frameFor(stackTopY(RETURN_PEAK), DEEP_BOTTOM_Y, 1.5);
export const WIDE_FRAME = frameFor(stackTopY(N_FINAL), DEEP_BOTTOM_Y, 1.05);
export const K_WAVE = WAVE_FRAME.k;
export const C_WAVE = WAVE_FRAME.c;
export const K_WIDE = WIDE_FRAME.k;
export const C_WIDE = WIDE_FRAME.c;

// The close-up's two lateral ends. CX_LEFT is NOT the first card: at K_WAVE the
// frame is 720 world px wide and the first card and the mark are 418 apart, so
// centring on the card alone hangs the mark off the right edge and parks the
// left third of frame empty — a side instrument and a parked edge, neither of
// which this set does. 350 is the midpoint of the two with a little lead left,
// so the first card sits well inside frame and the mark — with the pile growing
// on it — stays whole at BOTH ends of the pan.
export const CX_LEFT = 350;
export const CX_RIGHT = 660;
export const RIDE_SCREEN = 12; // "better": the camera creeps up with the pile
export const C_RIDE = C_WIDE - RIDE_SCREEN / K_WIDE;

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
  // cx carries its OWN warp. In the pull-back the zoom and the pan fight each
  // other: a point off-centre moves on screen by both, and running them on one
  // curve put a coin in flight at 51 screen px/frame, over the house cap. Warp
  // 0.72 on k spends the zoom early — the frame widens first — and a warp above
  // 1 on cx holds the lateral return back until it is cheap. Measured, not
  // guessed: the peak drops to under the cap with nothing else changed.
  warpX?: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M0 "as it turns out" — push in on the LEFT END, where the wave will start
  { f0: 4, f1: 38, k0: K_FINAL, k1: K_WAVE, c0: C_FINAL, c1: C_WAVE, x0: MARK_X, x1: CX_LEFT, warp: 0.72 },
  // M1 "since that time" — TRACK THE WAVEFRONT. One continuous eased pan, no
  // stalls, still moving under the words because it is following the front.
  { f0: 64, f1: 94, k0: K_WAVE, k1: K_WAVE, c0: C_WAVE, c1: C_WAVE, x0: CX_LEFT, x1: CX_RIGHT, warp: 1 },
  // M2 "alpha has been" — pull back and re-centre for the comparison
  { f0: 94, f1: 118, k0: K_WAVE, k1: K_WIDE, c0: C_WAVE, c1: C_WIDE, x0: CX_RIGHT, x1: MARK_X, warp: 0.72, warpX: 1 },
  // M3 "better" — creep up with the pile, and settle
  { f0: 130, f1: 144, k0: K_WIDE, k1: K_WIDE, c0: C_WIDE, c1: C_RIDE, x0: MARK_X, x1: MARK_X, warp: 0.72 },
];

// `camMove` does not expose the ease it uses, and a segment with a constant k
// has no k to read it back off, so the pan carries its own copy. Same function
// and same warp — this is `camEase` from `fieldShared`.
const camEaseLocal = (u: number, warp: number) => smoothstep(Math.pow(clamp01(u), warp));

// One track out of the four moves. `camMove` emits a key per frame inside a
// move; a gap between two moves gets ONE key holding the last value, which is
// what makes a hold a hold rather than a slow ramp into the next key. f0 is
// pinned to the inherited resolved framing, so the world does not move at all
// under "as it".
const CAM_TRACK = (() => {
  const F: number[] = [0];
  const K: number[] = [K_FINAL];
  const CY: number[] = [CY_FINAL];
  const CX: number[] = [MARK_X];
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
      // M1 hands straight over to M2 on the same frame — the pan does not stop
      // and then start again — so the shared key is written once, by the move
      // that is taking over.
      if (f === F[F.length - 1]) {
        F.pop();
        K.pop();
        CY.pop();
        CX.pop();
      }
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CX.push(s.x0 + (s.x1 - s.x0) * camEaseLocal(i / span, s.warpX ?? s.warp));
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY, CX };
})();

export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;
export const CAM_CX = CAM_TRACK.CX;

// The damped camera at every integer frame, run once. Same loop and same
// constants as `runCamera`, with cx on it as well — so this table IS the
// camera, and every speed figure in this file was measured off it.
export const CAM_AT = (() => {
  const kA = new Float64Array(DURATION + 1);
  const cyA = new Float64Array(DURATION + 1);
  const cxA = new Float64Array(DURATION + 1);
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let cx = CAM_CX[0];
  let vy = 0;
  let vk = 0;
  let vx = 0;
  kA[0] = k;
  cyA[0] = cy;
  cxA[0] = cx;
  for (let f = 1; f <= DURATION; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    const txr = interpolate(f, CAM_F, CAM_CX, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (txr - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    kA[f] = k;
    cyA[f] = cy;
    cxA[f] = cx;
  }
  return { k: kA, cy: cyA, cx: cxA };
})();

export const camAt = (f: number) => {
  const i = Math.max(0, Math.min(DURATION, Math.round(f)));
  return { k: CAM_AT.k[i], cy: CAM_AT.cy[i], cx: CAM_AT.cx[i] };
};

// ---------------------------------------------------------------------------
// THE COINS. N_DELIVER of them, two per card, numbered in wave order, and the
// pile fills in that order — so the read of the pile and the read of the row
// cannot drift apart.
//
// WHEN A COIN LEAVES. Coin A of a card leaves OFF_A frames after that card
// lands and coin B COIN_GAP frames after A — card 0's A is at f60, two frames
// before it touches down, and that one offset is used by the whole piece. It is
// SOLVED DOWNWARD from OFF_B_MAX until the last coin that has to be home before
// the rule is read actually is: with a small pre-group the pair leaves on the
// landing, with a large one it leaves during the press.
//
// WHEN A COIN ARRIVES. The N_PRE coins of the pre-group leave on that schedule
// and are all home by PRE_HOME. The N_POST that are left RIDE NOTHING until
// "better": they rise out of their card, sit on its top edge in the deep tone
// while the wave runs past them, and then release in one staggered run
// one coin per frame between RELEASE_ARR0 and RELEASE_ARR1. So the pile
// holds exactly RETURN_PEAK coins across "as good" — level with the rule, with
// no arrival to distract from the read — and then goes past it. A coin can
// never leave before its card is COIN_READY through its own press.
// ---------------------------------------------------------------------------
export const SPEED_CAP = 45; // screen px per frame, the house cap
// Cut 2's coin speed, derived from cut 2's own numbers rather than restated:
// its subject card is nearly under the mark, so its 22-frame COIN_FLIGHT over
// that path IS the speed a coin moves in this world. Here the row is 836 px
// wide, so an outer card's path is diagonal and up to 670 px long — a third
// again as far. Flying them all in 22 frames would put the outer ones at 46
// screen px/frame, over the cap, and would also read as the far companies
// paying faster than the near ones. So every coin moves at COIN_SPEED and the
// far ones simply take longer, which is both the correct picture and inside the
// cap by construction.
export const COIN_SPEED =
  Math.hypot(
    cardTopY(DEPTH_DEEP) - MARK_BOTTOM,
    originX(SUBJECT) - cardX(SUBJECT),
  ) / COIN_FLIGHT;
export const COIN_GAP = 6; // the two coins of one card leave 6 frames apart
export const COIN_EMERGE = 4; // it rises out of the tile's top edge
export const COIN_LIFT = COIN_R + 2; // where it sits above the tile's top edge
export const COIN_SIDE = COIN_R + 2; // the two coins sit either side of centre
export const COIN_READY = 0.32; // how far into its press a card can pay out
export const PRE_HOME = 124; // the last pre-rule arrival, two frames before "good"
export const RELEASE_ARR0 = 128; // the first arrival past the rule, on "or"
export const RELEASE_ARR1 = 145; // …and the last, one frame before speech ends
export const TAIL_P0 = 146;
export const TAIL_STEP = 8;

export const coinCard = (j: number) => Math.floor(j / COINS_PER_CARD);
export const coinSlot = (j: number) => j % COINS_PER_CARD;
export const coinSideX = (j: number) => (coinSlot(j) === 0 ? -COIN_SIDE : COIN_SIDE);
export const coinReadyF = (i: number) => pressStart(i) + COIN_READY * pressDur(i);

// how far a coin leaving card i at frame f has to fly, and how long that takes
export const coinRestY = (i: number, f: number) => cardTopY(depthAt(i, f)) - COIN_LIFT;
export const coinDist = (j: number, f: number) => {
  const i = coinCard(j);
  return Math.hypot(
    coinRestY(i, f) - MARK_BOTTOM,
    originX(i) - (cardX(i) + coinSideX(j)),
  );
};
// The row is 836 px wide and the threads converge on a 68 px spread under the
// mark, so an outer coin's path is markedly diagonal — which is why the
// distance, not the vertical drop, sets the duration.
export const coinDur = (j: number, f: number) =>
  Math.max(1, Math.round(coinDist(j, f) / COIN_SPEED));


export const OFF_B_MAX = 4;
export const OFF_B_MIN = -0.55 * WAVE_DUR;
// the natural launch of coin j for a given offset, before any release run
const naturalLaunch = (j: number, offB: number) =>
  cardLand(coinCard(j)) + offB - (coinSlot(j) === 0 ? COIN_GAP : 0);
export const OFF_B = (() => {
  if (N_PRE === 0) return OFF_B_MAX;
  const j = N_PRE - 1;
  for (let off = OFF_B_MAX; off >= OFF_B_MIN; off -= 0.25) {
    const f = naturalLaunch(j, off);
    if (f + coinDur(j, f) <= PRE_HOME) return off;
  }
  return OFF_B_MIN;
})();
export const OFF_A = OFF_B - COIN_GAP;

export const RELEASE_STEP =
  N_POST > 1 ? (RELEASE_ARR1 - RELEASE_ARR0) / (N_POST - 1) : 0;

// Every coin, solved once: when it appears, when it leaves, when it is home.
// The pre-group is LAUNCH-keyed (the coin leaves as its card lands and gets
// there when it gets there); the release run is ARRIVAL-keyed, so the pile
// climbs at one steady rate past the rule whatever each card's distance is, and
// the launch is solved back from the arrival — never earlier than the frame its
// card is COIN_READY through its own press.
export type Coin = {
  j: number;
  i: number;
  born: number;
  go: number;
  home: number;
  // WHERE it leaves from, FROZEN at the frame it leaves. Reading the card's
  // live top edge instead was the one real bug in this file: a coin that left
  // while its card was still sinking had its own start point sinking under it,
  // which stretched the path it had to cover in a fixed number of frames and
  // put it 8 screen px/frame over the cap. A coin has let go; it does not drag.
  x0: number;
  y0: number;
};
export const COINS: Coin[] = Array.from({ length: N_DELIVER }, (_, j) => {
  const i = coinCard(j);
  let go: number;
  let home: number;
  if (j < N_PRE) {
    go = naturalLaunch(j, OFF_B);
    home = go + coinDur(j, go);
  } else {
    home = RELEASE_ARR0 + (j - N_PRE) * RELEASE_STEP;
    // one fixed-point step: guess the launch off the deep-card distance, then
    // re-solve the duration at the depth the card is actually at then
    go = home - coinDur(j, home - COIN_FLIGHT);
    go = Math.max(coinReadyF(i), home - coinDur(j, go));
    home = go + coinDur(j, go);
  }
  return {
    j,
    i,
    born: Math.min(go, cardLand(i) + OFF_A + coinSlot(j) * COIN_GAP) - COIN_EMERGE,
    go,
    home,
    x0: cardX(i) + coinSideX(j),
    y0: coinRestY(i, go),
  };
});

// The pile's height at any frame: RETURN_FINAL inherited plus everything home.
export const HOME_F = COINS.map((c) => c.home).sort((a, b) => a - b);
export const stackCount = (f: number) => {
  let n = RETURN_FINAL;
  for (const h of HOME_F) if (f >= h) n++;
  return n;
};
// diagnostics, read back by the check script and quoted in the report
export const COUNT_AT_GOOD = stackCount(126);
export const COUNT_AT_END = stackCount(146);
export const RELEASE_ARR_0 = HOME_F[N_PRE];

// ---------------------------------------------------------------------------

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  coinRadius: COIN_R,
  cardSize: CARD_SIZE,
  markSize: MARK_SIZE,
  beats: {
    as: 0,
    it: 8,
    turns: 11,
    out: 15,
    ifWord: 27,
    you: 33,
    look: 36,
    at: 43,
    our: 48,
    short: 54,
    alpha: 60,
    since: 66,
    that: 74,
    time: 89,
    ourTwo: 98,
    shortTwo: 100,
    alphaTwo: 105,
    has: 110,
    been: 116,
    asTwo: 120,
    good: 126,
    or: 131,
    better: 134,
    end: 146,
  },
});

const AsGoodOrBetterV2: React.FC<Props> = ({
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
  coinRadius,
  cardSize,
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // deep -> ripe, for the six coins cut 2 left cooled on the mark
  const tone = makeTone(accentDeep, accent);
  // the mark's own amber dot, ticking to the half-step and back
  const strainTone = makeTone(accent, CLICK_HALF);

  // -- camera ----------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame + CONTINUE_FROM);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- gesture 1: the threads wake, the pile warms, the mark's dot ticks -----
  const wake = interpolate(frame, [beats.turns, beats.turns + WAKE_DUR], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const live = THREAD_IDLE + (THREAD_LIVE - THREAD_IDLE) * wake;
  const inherited = tone(wake);
  const tick = frame >= beats.turns && frame < beats.turns + CLICK_INK ? 1 : 0;

  // -- the twelve companies, this frame -------------------------------------
  const cards = Array.from({ length: N_CARDS }, (_, i) => {
    const depth = depthAt(i, frame);
    const bob = bobAt(i, frame);
    return { i, x: cardX(i), y: GROUND_Y + depth + bob, top: cardTopY(depth) + bob };
  });

  // -- the money on the wire and on the cards -------------------------------
  // A coin rises out of its tile's top edge (COIN_EMERGE frames, from fully
  // behind the tile to COIN_LIFT above it), waits there in the deep tone if it
  // is being held, then climbs its own thread ripe on the linear COIN_FLIGHT
  // and is absorbed at the mark's bottom edge.
  const flying: { key: string; x: number; y: number; fill: string }[] = [];
  for (const c of COINS) {
    if (frame < c.born || frame >= c.home) continue;
    const card = cards[c.i];
    const restX = card.x + coinSideX(c.j);
    const restY = card.top - COIN_LIFT;
    if (frame < c.go) {
      const e = smoothstep(clamp01((frame - c.born) / COIN_EMERGE));
      flying.push({
        key: `c${c.j}`,
        x: restX,
        y: card.top + coinRadius + (restY - card.top - coinRadius) * e,
        fill: accentDeep,
      });
    } else {
      const u = clamp01((frame - c.go) / (c.home - c.go));
      flying.push({
        key: `c${c.j}`,
        x: c.x0 + (originX(c.i) - c.x0) * u,
        y: c.y0 + (MARK_BOTTOM - c.y0) * u,
        fill: accent,
      });
    }
  }

  // -- the pile on top of the mark ------------------------------------------
  const nStack = stackCount(frame);
  const piled: { n: number; x: number; y: number; r: number; fill: string }[] = [];
  for (let n = 0; n < nStack; n++) {
    const p = returnCoinPos(n);
    let s = 1;
    let fill = n < RETURN_FINAL ? inherited : accent;
    if (n >= RETURN_FINAL) {
      const h = HOME_F[n - RETURN_FINAL];
      s = EASE_LAND(clamp01((frame - h) / COIN_GROW));
      if (frame >= h && frame < h + CLICK_HALF_DUR) fill = CLICK_HALF;
    }
    piled.push({ n, x: p.x, y: p.y, r: coinRadius * s, fill });
  }

  // -- gesture 5: the reference rule ----------------------------------------
  const ruleG = smoothstep(clamp01((frame - RULE_F0) / (RULE_F1 - RULE_F0)));
  const ruleX1 = RULE_X0 + (RULE_X1 - RULE_X0) * ruleG;

  // -- the ambient traffic ---------------------------------------------------
  // Inherited: cut 2's tail runs one bead at a time DOWN an idle thread, and
  // those keep running until the threads wake. Then the traffic reverses — a
  // single bead at a time coming UP — through the push, and again in the tail.
  // Same launcher, same ceiling, same radius; only the direction and the clock.
  const packets: { key: string; x: number; y: number }[] = [];
  const fly = (n: number, t0: number, up: boolean, tag: string) => {
    if (frame < t0 || frame >= t0 + PACKET_DUR) return;
    const i = Math.floor(hash(n, up ? 17 : 5) * N_CARDS) % N_CARDS;
    const card = cards[i];
    const u = (frame - t0) / PACKET_DUR;
    const a = up ? { x: card.x, y: card.top } : { x: originX(i), y: MARK_BOTTOM };
    const b = up ? { x: originX(i), y: MARK_BOTTOM } : { x: card.x, y: card.top };
    packets.push({ key: `${tag}${n}`, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  };
  for (let n = 0; ; n++) {
    const t0 = -4 + n * PACKET_STEP;
    if (t0 >= beats.turns) break;
    fly(n, t0, false, "d");
  }
  for (let n = 0; ; n++) {
    const t0 = beats.out + n * PACKET_STEP;
    if (t0 >= PRESS0_F0) break;
    fly(n, t0, true, "w");
  }
  for (let n = 0; ; n++) {
    const t0 = TAIL_P0 + n * TAIL_STEP;
    if (t0 >= DURATION) break;
    fly(n, t0, true, "t");
  }

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame + CONTINUE_FROM}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CAM_CX[0]}
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
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the market's surface, and the height the old peak reached */}
            <g style={{ filter: icon }}>
              <line
                x1={GROUND_X0}
                y1={GROUND_Y}
                x2={GROUND_X1}
                y2={GROUND_Y}
                stroke={ink}
                strokeWidth={GROUND_W}
                strokeLinecap="round"
                opacity={GROUND_OP}
              />
              {ruleG > 0.002 ? (
                <line
                  x1={RULE_X0}
                  y1={RULE_Y}
                  x2={ruleX1}
                  y2={RULE_Y}
                  stroke={ink}
                  strokeWidth={RULE_W}
                  strokeLinecap="round"
                  strokeDasharray={RULE_DASH}
                  opacity={GROUND_OP}
                />
              ) : null}
            </g>

            {/* the threads: every card hangs from the mark, idle until it wakes */}
            <g style={{ filter: icon }}>
              {cards.map((c) => (
                <line
                  key={`t${c.i}`}
                  x1={originX(c.i)}
                  y1={MARK_BOTTOM}
                  x2={c.x}
                  y2={c.top}
                  stroke={accent}
                  strokeWidth={THREAD_W}
                  strokeLinecap="round"
                  opacity={
                    c.i === 0 && frame >= PRESS0_LAND && frame < PRESS0_LAND + CLICK_INK ? 1 : live
                  }
                />
              ))}
            </g>

            {/* the ambient traffic, at the shared ceiling */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PACKET_R} fill={ink} opacity={AMBIENT} />
            ))}

            {/* the money: behind the tiles, so a coin rises out of its card */}
            {flying.map((c) => (
              <circle key={c.key} cx={c.x} cy={c.y} r={coinRadius} fill={c.fill} />
            ))}

            {/* the twelve companies, pressed under the line */}
            {cards.map((c) => (
              <CompanyCard
                key={`k${c.i}`}
                x={c.x}
                y={c.y}
                sector={SECTOR_NAMES[c.i]}
                size={cardSize}
                k={k}
                opacity={OP_READ}
              />
            ))}

            {/* D1, and the return piled on it */}
            <D1Mark
              x={MARK_X}
              y={MARK_Y}
              size={markSize}
              k={k}
              opacity={OP_READ}
              dotColor={strainTone(tick)}
            />
            <g style={{ filter: icon }}>
              {piled.map((p) => (
                <circle key={`p${p.n}`} cx={p.x} cy={p.y} r={p.r} fill={p.fill} />
              ))}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AsGoodOrBetterV2;
