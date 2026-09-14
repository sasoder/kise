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
// THE ONE WORLD (V3). Every piece of geometry — the ground, the eight companies
// standing on it, the depths a short can be held at, the mark, the thread
// origins, the return pile's grid and its three counts — is imported from
// `d1Shared`, and nothing here restates any of it.
import {
  CARD_SIZE,
  COIN_R,
  CompanyCard,
  D1Mark,
  DEPTH_DEEP,
  DEPTH_SHALLOW,
  GROUND_OP,
  GROUND_W,
  GROUND_X0,
  GROUND_X1,
  GROUND_Y,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  MARK_BOTTOM,
  MARK_SIZE,
  MARK_X,
  MARK_Y,
  N_CARDS,
  RETURN_AFTER_DROP,
  RETURN_FINAL,
  RETURN_PEAK,
  RETURN_ROW0_Y,
  RETURN_ROW_PITCH,
  RETURN_X,
  SECTOR_SET,
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  cardX,
  cardY,
  originX,
  returnCoinPos,
} from "./d1Shared";
// THE MOTION, AND THE FRAME THIS CUT OPENS ON. This piece IS cut 2 ten seconds
// later, so its travel curve, its press overshoot, its landing ease, its click
// lengths, its ambient ceiling and traffic clock, the speed a coin climbs a
// thread, and the camera it resolved on are all IMPORTED from
// `IsItEvenWorthItV3.tsx` and none of them is restated here. f0 of this piece is
// that piece's last frame.
import {
  AMBIENT,
  CAM_CY as IW3_CAM_CY,
  CLICK_HALF,
  CLICK_HALF_DUR,
  CLICK_INK,
  COIN_GROW,
  COIN_SPEED,
  C_FINAL,
  CY_FINAL,
  DURATION as IW3_DURATION,
  EASE_LAND,
  K_FINAL,
  PACKET_DUR,
  PACKET_F0,
  PACKET_R,
  PACKET_STEP,
  PRESS_OVER,
  WORLD_H,
  WORLD_W,
  cardLevel,
  cardTopY,
  flow,
  hang,
  overshoot,
} from "./IsItEvenWorthItV3";

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
// sheet's mottle jumps back and every edge in the frame shifts by the sway's
// amplitude. Measured as a difference image against cut 2's last frame.
export const CONTINUE_FROM = IW3_DURATION;

// ---------------------------------------------------------------------------
// "As good or better" — the payoff cut of the clip, V3.
//
// Orange Dwarkesh style on kraft: opaque 1080x1920 cutaway at 24fps, ink
// #FFFFFF, two tones of one amber (ACCENT_DEEP at rest, ACCENT lit), solid
// dots, one stroke weight, one landing ease, `iconShadow(k)` on every card and
// mark, `Vignette` last.
//
// THE PICTURE. Ten seconds after cut 2: eight companies held a little way under
// the line at DEPTH_SHALLOW, their threads idle, RETURN_AFTER_DROP coins cooled
// on top of D1. D1 looks again — the threads go live — and then a WAVE runs
// left to right, pulling every company all the way down to DEPTH_DEEP, and
// money climbs every thread and piles on the mark. The pile reaches the height
// the old peak reached, marked by two ticks either side of it, on "as good",
// and climbs past it on "better". Comparison is HEIGHT AND COUNT against a
// marked peak; there is no chart anywhere in it.
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
//      f0 is cut 2's resolved frame exactly: eight cards at DEPTH_SHALLOW,
//      eight THREAD_IDLE threads leaving the mark's bottom edge at originX(i),
//      RETURN_AFTER_DROP deep-tone coins on the mark, cut 2's tail traffic
//      still drifting DOWN the threads, the same camera, the paper still
//      drifting. At f11 ("turns") the eight threads go THREAD_IDLE ->
//      THREAD_LIVE over one WAKE_DUR ramp, the eight coins warm deep -> ripe on
//      the same ramp, and the mark's amber dot ticks to the half-step for
//      CLICK_INK frames: D1 is looking again. From f15 the traffic reverses and
//      single ink beads come UP, so the push is never dead air. THE CAMERA
//      pushes from f4 toward the LEFT END of the row — k K_FINAL -> K_WAVE, cx
//      MARK_X -> CX_LEFT, content C_FINAL -> C_WAVE, warp 0.72, keys f4-f38 so
//      the damper has it landed by f50 — framing where the wave will start.
//
//   2. THE FIRST COMPANY IS PULLED DEEP      — "our SHORT ALPHA"    f50-f66
//      Card 0 (the car) goes DEPTH_SHALLOW -> DEPTH_DEEP on cut 2's press —
//      `flow` plus PRESS_OVER px of `overshoot`, so it goes a few px too deep
//      and eases up — keys f50-f62; `flow`'s soft start means the eye sees it
//      leave on "short" at f54. Its thread goes full ink for CLICK_INK frames
//      (a single-object beat, so it takes the full click) and its first coin
//      leaves the tile's top edge at f60. The camera has been still since f50
//      and stays still to f64: the held breath.
//
//   3. THE WAVE                              — "SINCE THAT TIME"    f66-f124
//      The big motion, one continuous wave left -> right: card i (1..7) starts
//      its press at WAVE_F0 + (i-1) * WAVE_STEP, hashed +-WAVE_JIT so the wave
//      breathes, each press WAVE_DUR frames on the same curve; card 7 starts at
//      f108 and is home at f124. Every card puts TWO coins up its thread: each
//      rises out of the tile's top edge, sits on it in the deep tone, then
//      climbs the thread ripe at COIN_SPEED and is absorbed at MARK_BOTTOM,
//      where the pile gains one coin at returnCoinPos(n) (scale-in over
//      COIN_GROW frames on the house landing ease, the arrival taking the
//      half-step CLICK_HALF). THE CAMERA TRACKS THE WAVEFRONT: one continuous
//      eased pan, cx CX_LEFT -> CX_RIGHT at k K_WAVE over keys f64-f106,
//      warp 1.0, no stalls — measured, the wavefront crosses the middle of the
//      frame with the wave rather than being chased.
//
//   4. PULL BACK AND RE-CENTRE               — "ALPHA has been"     f105-f130
//      k K_WAVE -> K_WIDE, cx -> MARK_X, content -> C_WIDE, warp 0.72 on the
//      zoom and warpX 1.6 on the pan, keys f106-f122, landed by f128 — the whole
//      row, the mark AND the pile at its future full height in frame for the
//      comparison. Both framings are SOLVED, not typed: `frameFor` takes the
//      top and the bottom of what has to be in shot and returns the largest k
//      that fits that span inside the caption-safe band plus the content centre
//      that puts the span's middle at the middle of it. The window is f106-f122
//      rather than f108-f124 so the damper has the frame STILL by the time the
//      ticks are read: 6.6 screen px/frame at f126 against 13.9.
//
//   5. THE TWO TICKS                         — "as GOOD"            f118-f126
//      Two short dashed ink ticks, TICK_LEN long, draw in ONE stroke each —
//      LEFT of the pile from TICK_L0 and RIGHT of it from TICK_R0 — at the OLD
//      PEAK's top: TICK_Y = RETURN_ROW0_Y - 2 * RETURN_ROW_PITCH - COIN_R, the
//      top edge of the third row, which is where RETURN_PEAK (12 = three rows
//      of four) reached. They sit clear of the pile's own width on both sides,
//      so nothing is ever drawn through the coins. The arrivals are scheduled
//      so the pile holds exactly RETURN_PEAK coins at f126 and NOTHING arrives
//      between PRE_HOME and the release run: the pile is level with the ticks
//      and holds there across the word. That is "as good". No click; a tick is
//      a measurement, not an event.
//
//   6. PAST THEM                             — "or BETTER"          f128-f146
//      The N_POST coins still sitting on their cards release in one run and the
//      pile climbs PAST the ticks, one arrival every RELEASE_STEP frames from
//      RELEASE_ARR0 to RELEASE_ARR1 — RETURN_PEAK to RETURN_FINAL, three rows
//      clear of them. Every one of those arrivals is above the ticks and takes
//      the half-step. The camera creeps UP RIDE_SCREEN screen px (warp 0.72,
//      keys f130-f144) so the growing top of the pile stays framed, then holds.
//
//   TAIL, f146-f162. Eight deep companies, eight live threads, RETURN_FINAL
//   coins on D1, and one ambient ink bead at AMBIENT travelling UP a thread
//   every TAIL_STEP frames — the return still coming home. Held resolved;
//   never fades out.
//
// ambient: the traffic this piece INHERITS (cut 2's tail runs one bead at a
// time DOWN an idle thread on ITS clock — PACKET_F0 + n * PACKET_STEP less
// CONTINUE_FROM here — and two of them are mid-flight on f0; they keep running
// until the threads wake, then the direction reverses), cut 2's own per-card
// `hang` carried straight across the join, `sway` on the camera, and the kraft
// sheet's parallax and drift. Not gestures; that is what this world is.
//
// THREE THINGS THIS FILE DOES DIFFERENTLY FROM A LITERAL READING OF THE BRIEF,
// and why:
//   * the brief asks each card to release two coins "at landing and 6 frames
//     later" AND for the pile to hold exactly RETURN_PEAK at f126 with nothing
//     arriving between f114 and f128. Those cannot both be true: card 2 lands
//     at f89 and its coins would be home at f111 and f117, inside the pause. So
//     the first two cards pay out on their landing (N_PRE coins, all home by
//     f109) and the remaining twelve RISE OUT of their tiles on the same
//     landing/+COIN_GAP clock, SIT there in the deep tone while the wave runs
//     past them, and then release together on "better". The money visibly
//     accumulates on the row and comes home in one wave, which is the argument.
//   * the pile is drawn here from d1Shared's `returnCoinPos` rather than
//     through cut 2's `ReturnStack`, which scales only the single newest coin
//     in. The release run lands one coin every RELEASE_STEP frames against a
//     COIN_GROW of 5, so up to four are mid-scale-in at once and `arriving`
//     cannot express it. The geometry, the radius, the ease and the fill are
//     still the shared ones.
//   * RETURN_FINAL is 24 = six rows and the ticks sit at the top of row three,
//     so the pile ends THREE rows past them, not two. The two hard reads —
//     level with the ticks on "good", clearly past them on "better" — are what
//     the beat needs, and the counts are d1Shared's.
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
    out: z.number(), // "out"        — the ambient traffic reverses, upward
    ifWord: z.number(), // "if"
    you: z.number(), // "you"
    look: z.number(), // "look"
    at: z.number(), // "at"
    our: z.number(), // "our"
    short: z.number(), // "short"    — card 0 leaves the shallow depth
    alpha: z.number(), // "alpha"    — its first coin is on the wire
    since: z.number(), // "since"    — THE WAVE starts, the camera tracks it
    that: z.number(), // "that"
    time: z.number(), // "time"
    ourTwo: z.number(), // "our"
    shortTwo: z.number(), // "short"
    alphaTwo: z.number(), // "alpha" — the pull-back starts
    has: z.number(), // "has"
    been: z.number(), // "been"
    asTwo: z.number(), // "as"       — the two ticks are drawing
    good: z.number(), // "good"      — the pile is exactly RETURN_PEAK high
    or: z.number(), // "or"          — the release run starts
    better: z.number(), // "better"  — the pile is climbing past the ticks
    end: z.number(), // speech ends; tail to 162
  }),
});

export type Props = z.infer<typeof schema>;

// -- the world beyond what is imported ---------------------------------------
export const CARD_HALF = CARD_SIZE / 2;
export const RETURN_COLS = RETURN_X.length;
export const rows = (n: number) => Math.ceil(n / RETURN_COLS);
// The top edge of the pile when it holds n coins.
export const stackTopY = (n: number) =>
  RETURN_ROW0_Y - (Math.max(1, rows(n)) - 1) * RETURN_ROW_PITCH - COIN_R;
export const DEEP_BOTTOM_Y = cardY(DEPTH_DEEP) + CARD_HALF;

// The old peak's top: the height RETURN_PEAK reached, and what "as good" is
// measured against. Two ticks, one either side of the pile, clear of its own
// width (the pile spans RETURN_X[0] - COIN_R … RETURN_X[3] + COIN_R) so nothing
// is ever drawn through the coins.
export const TICK_Y = RETURN_ROW0_Y - 2 * RETURN_ROW_PITCH - COIN_R;
export const TICK_LEN = 60;
export const TICK_L0 = 430;
export const TICK_R0 = 590;
export const TICK_DASH = "10 8";
export const TICK_W = 2.5;
export const TICK_OP = 0.4;
export const TICK_F0 = 118; // draws under "as" (f120) and reads on "good" (f126)
export const TICK_F1 = 126;

// The whole delivery: two coins per card, so the pile ends RETURN_AFTER_DROP +
// N_DELIVER high — which is RETURN_FINAL, the count d1Shared fixes for this cut.
export const COINS_PER_CARD = 2;
export const N_DELIVER = N_CARDS * COINS_PER_CARD;
export const N_FINAL = RETURN_AFTER_DROP + N_DELIVER;
// …which has to BE the count d1Shared fixes for the end of this cut. Two coins
// a company is not a taste decision: it is the only whole number that takes the
// inherited pile to RETURN_FINAL over eight companies, and if either number
// moves in d1Shared this stops the render rather than quietly mis-counting.
if (N_FINAL !== RETURN_FINAL) {
  throw new Error(
    `AsGoodOrBetterV3: ${RETURN_AFTER_DROP} + ${N_CARDS} * ${COINS_PER_CARD} = ${N_FINAL}, but d1Shared fixes RETURN_FINAL at ${RETURN_FINAL}`,
  );
}
// N_PRE of them are home before the ticks are read; the rest come after.
export const N_PRE = Math.max(0, Math.min(N_DELIVER, RETURN_PEAK - RETURN_AFTER_DROP));
export const N_POST = N_DELIVER - N_PRE;

export const PRESS_SPAN = DEPTH_DEEP - DEPTH_SHALLOW;

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
export const WAVE_STEP = 7; // frames between two cards leaving
export const WAVE_DUR = 16; // one press
export const WAVE_JIT = 1; // +-1 frame per card, so the wave breathes

export const pressStart = (i: number) =>
  i === 0 ? PRESS0_F0 : WAVE_F0 + (i - 1) * WAVE_STEP + (hash(i, 31) - 0.5) * 2 * WAVE_JIT;
export const pressDur = (i: number) => (i === 0 ? PRESS0_DUR : WAVE_DUR);
export const pressAt = (i: number, f: number) => clamp01((f - pressStart(i)) / pressDur(i));
export const cardLand = (i: number) => pressStart(i) + pressDur(i);
// THE HANG IS INHERITED, NOT INVENTED. A card held under the line on a thread
// is hanging, and cut 2 gives every card its own `hang` — HANG_AMP px, its own
// phase, clocked from the frame that card came to rest (`cardLevel(i)`). Read
// at `f + CONTINUE_FROM` it simply keeps going across the join, so f0 is
// exactly the frame cut 2 ended on and no card is ever frozen. It stays on
// through the press, so a card that has been pulled deep is still breathing.
export const depthAt = (i: number, f: number) => {
  const u = pressAt(i, f);
  return (
    DEPTH_SHALLOW +
    PRESS_SPAN * flow(u) +
    PRESS_OVER * overshoot(u) +
    hang(i, f + CONTINUE_FROM, cardLevel(i))
  );
};

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
// the deep cards; C_WIDE has to hold the pile at its RETURN_FINAL height and
// the deep cards, which is what sets how far the pull-back goes.
// ---------------------------------------------------------------------------
export const SAFE_TOP = 200;
export const SAFE_BOT = 1450;
export const SAFE_MID = (SAFE_TOP + SAFE_BOT) / 2;
export const frameFor = (top: number, bot: number, kMax: number) => {
  const k = Math.min(kMax, (SAFE_BOT - SAFE_TOP) / (bot - top));
  return { k, c: (top + bot) / 2 + (960 - SAFE_MID - CAM_LIFT) / k };
};

export const WAVE_FRAME = frameFor(stackTopY(RETURN_PEAK), DEEP_BOTTOM_Y, 1.4);
// K_WIDE is 1.00 and not the largest k that would fit: at any k above 1 the
// ground line's own ends — which ARE the house side margin, GROUND_X0/X1 — are
// pushed outside it. So the resolved frame is exactly the width of the market.
export const WIDE_FRAME = frameFor(stackTopY(N_FINAL), DEEP_BOTTOM_Y, 1.0);
export const K_WAVE = WAVE_FRAME.k;
export const C_WAVE = WAVE_FRAME.c;
export const K_WIDE = WIDE_FRAME.k;
export const C_WIDE = WIDE_FRAME.c;

// The close-up's two lateral ends. CX_LEFT is NOT the first card: at K_WAVE the
// frame is 771 world px wide and the first card and the mark are 364 apart, so
// centring on the card alone hangs the mark off the right edge and parks the
// left third of the frame empty — a side instrument and a parked edge, neither
// of which this set does. These two put the wavefront near the middle of frame
// at both ends of the pan while the mark, with the pile growing on it, stays
// whole throughout.
// 400, not the 330 the brief asks for. At 330 the held breath on f50-f64 parks
// the mark and its pile in the top RIGHT corner (mark's right edge at screen
// 910) with the ground line stopping at screen 162 and the whole upper left of
// the frame empty — a composition pushed to an edge, which this set does not
// do. At 400 the same beat reads with card 0 at screen 226, the mark at 736 and
// the line reaching screen 64, which is where its end sits at the resolved
// framing anyway: the group's midpoint lands at 481 against a frame centre of
// 540 instead of 592.
export const CX_LEFT = 400;
// …and 700, not 750, measured rather than chosen: the pan's lateral RETURN in
// M2 and a coin climbing a left-hand thread push that coin the same way on
// screen and they ADD. At 750 coin 5 peaks at 45.9 screen px/frame, over the
// house cap; at 700 the peak anywhere in the piece is 43.8. Card 7's right edge
// still sits at screen 906 at the end of the pan, so the wavefront is framed.
export const CX_RIGHT = 700;
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
  // curve puts a coin in flight over the house 45 px/frame cap. Warp 0.72 on k
  // spends the zoom early — the frame widens first — and warp 1 on cx holds the
  // lateral return back until it is cheap.
  warpX?: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M0 "as it turns out" — push in on the LEFT END, where the wave will start
  { f0: 4, f1: 38, k0: K_FINAL, k1: K_WAVE, c0: C_FINAL, c1: C_WAVE, x0: MARK_X, x1: CX_LEFT, warp: 0.72 },
  // M1 "since that time" — TRACK THE WAVEFRONT. One continuous eased pan, no
  // stalls, still moving under the words because it is following the front.
  { f0: 64, f1: 106, k0: K_WAVE, k1: K_WAVE, c0: C_WAVE, c1: C_WAVE, x0: CX_LEFT, x1: CX_RIGHT, warp: 1 },
  // M2 "alpha has been" — pull back and re-centre for the comparison. warpX 1.6
  // holds the lateral return back until the frame has already widened and it is
  // cheap: at warpX 1.3 the same move puts a coin at 47.3 screen px/frame and at
  // 1.0 at 48.9, both over the cap; at 1.6 the peak is 43.7. The window ends at
  // f122 so the damper has the frame still by f128 — the ticks are read on a
  // camera that has stopped (6.6 screen px/frame at f126, against 13.9 for the
  // brief's f108-f124 window).
  { f0: 106, f1: 122, k0: K_WAVE, k1: K_WIDE, c0: C_WAVE, c1: C_WIDE, x0: CX_RIGHT, x1: MARK_X, warp: 0.72, warpX: 1.6 },
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
// WHEN A COIN RISES OUT OF ITS CARD. Coin A of a card emerges OFF_A frames
// after that card lands and coin B COIN_GAP frames after A, so every card puts
// its two coins on its own top edge on one clock. Card 0's A is at f60, two
// frames before it touches down, which is the beat.
//
// WHEN A COIN LEAVES, AND WHEN IT ARRIVES. The N_PRE coins of the first two
// cards go straight up their thread and are all home well before PRE_HOME. The
// N_POST that are left RIDE NOTHING until "better": they sit on their card's
// top edge in the deep tone while the wave runs past them, and then release in
// one run, one arrival every RELEASE_STEP frames between RELEASE_ARR0 and
// RELEASE_ARR1. So the pile holds exactly RETURN_PEAK coins across "as good" —
// level with the ticks, with no arrival to distract from the read — and then
// goes past them. A coin can never leave before its card is COIN_READY through
// its own press.
// ---------------------------------------------------------------------------
export const SPEED_CAP = 45; // screen px per frame, the house cap
export const COIN_GAP = 6; // the two coins of one card emerge 6 frames apart
export const COIN_EMERGE = 4; // it rises out of the tile's top edge
export const COIN_LIFT = COIN_R + 2; // where it sits above the tile's top edge
export const COIN_SIDE = COIN_R + 2; // the two coins sit either side of centre
export const COIN_READY = 0.32; // how far into its press a card can pay out
export const PRE_HOME = 114; // the last pre-tick arrival is well before this
export const RELEASE_ARR0 = 128; // the first arrival past the ticks, on "or"
export const RELEASE_ARR1 = 146; // …and the last, as speech ends
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
  return Math.hypot(coinRestY(i, f) - MARK_BOTTOM, originX(i) - (cardX(i) + coinSideX(j)));
};
// The row is 728 px wide and the threads converge on a 68 px spread under the
// mark, so an outer coin's path is markedly diagonal — which is why the
// DISTANCE, not the vertical drop, sets the duration. Every coin moves at cut
// 2's COIN_SPEED and the far ones simply take longer, which is both the correct
// picture (the far companies do not pay faster) and inside the cap by
// construction.
export const coinDur = (j: number, f: number) =>
  Math.max(1, Math.round(coinDist(j, f) / COIN_SPEED));

// Coin A leaves two frames before its card lands — card 0's at f60, on "alpha".
export const OFF_B = 4;
export const OFF_A = OFF_B - COIN_GAP;
export const emergeF = (j: number) =>
  cardLand(coinCard(j)) + OFF_A + coinSlot(j) * COIN_GAP;

export const RELEASE_STEP =
  N_POST > 1 ? (RELEASE_ARR1 - RELEASE_ARR0) / (N_POST - 1) : 0;

export type Coin = {
  j: number;
  i: number;
  born: number;
  go: number;
  home: number;
  // WHERE it leaves from, FROZEN at the frame it leaves. Reading the card's
  // live top edge instead stretches the path a coin has to cover while its card
  // is still sinking under it, which both breaks the speed cap and reads as the
  // coin being dragged. A coin has let go; it does not drag.
  x0: number;
  y0: number;
};
export const COINS: Coin[] = Array.from({ length: N_DELIVER }, (_, j) => {
  const i = coinCard(j);
  let go: number;
  let home: number;
  if (j < N_PRE) {
    go = emergeF(j);
    home = go + coinDur(j, go);
  } else {
    // ARRIVAL-KEYED: the pile climbs at one steady rate past the ticks whatever
    // each card's distance is, so the arrival IS the authored number and the
    // launch is solved back from it — never earlier than the frame its card is
    // COIN_READY through its own press. Two fixed-point steps, because the
    // depth the card is at when the coin leaves sets how far the coin has to
    // fly. The flight then lasts home - go, which is within a frame of
    // coinDist / COIN_SPEED — the speed is shared, the arrival is exact.
    home = RELEASE_ARR0 + (j - N_PRE) * RELEASE_STEP;
    go = home - coinDur(j, home - 22);
    for (let step = 0; step < 2; step++) go = Math.max(coinReadyF(i), home - coinDur(j, go));
  }
  return {
    j,
    i,
    born: Math.min(go, emergeF(j)) - COIN_EMERGE,
    go,
    home,
    x0: cardX(i) + coinSideX(j),
    y0: coinRestY(i, go),
  };
});

// The pile's height at any frame: RETURN_AFTER_DROP inherited plus everything
// home.
export const HOME_F = COINS.map((c) => c.home).sort((a, b) => a - b);
export const stackCount = (f: number) => {
  let n = RETURN_AFTER_DROP;
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

const AsGoodOrBetterV3: React.FC<Props> = ({
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
  // deep -> ripe, for the coins cut 2 left cooled on the mark
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

  // -- the eight companies, this frame --------------------------------------
  const cards = Array.from({ length: N_CARDS }, (_, i) => {
    const depth = depthAt(i, frame);
    return { i, x: cardX(i), y: cardY(depth), top: cardTopY(depth) };
  });

  // -- the money on the wire and on the cards -------------------------------
  // A coin rises out of its tile's top edge (COIN_EMERGE frames, from fully
  // behind the tile to COIN_LIFT above it), waits there in the deep tone if it
  // is being held, then climbs its own thread ripe at COIN_SPEED and is
  // absorbed at the mark's bottom edge.
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
    let fill = n < RETURN_AFTER_DROP ? inherited : accent;
    if (n >= RETURN_AFTER_DROP) {
      const h = HOME_F[n - RETURN_AFTER_DROP];
      s = EASE_LAND(clamp01((frame - h) / COIN_GROW));
      if (frame >= h && frame < h + CLICK_HALF_DUR) fill = CLICK_HALF;
    }
    piled.push({ n, x: p.x, y: p.y, r: coinRadius * s, fill });
  }

  // -- gesture 5: the two ticks at the old peak ------------------------------
  const tickG = smoothstep(clamp01((frame - TICK_F0) / (TICK_F1 - TICK_F0)));

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
  // The inherited stream, phased so it IS cut 2's: its launches are at
  // PACKET_F0 + n * PACKET_STEP on its own clock, which is that less
  // CONTINUE_FROM on this one, and the thread each bead takes is its own
  // hash(n, 5). Two of them are mid-flight on f0, exactly where cut 2 left them.
  for (let n = 0; ; n++) {
    const t0 = PACKET_F0 + n * PACKET_STEP - CONTINUE_FROM;
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
      {/* cyRest is CUT 2's opening cy, not this piece's: the sheet's parallax
          is measured from wherever the camera started, and using this cut's own
          rest would slide the mottle sideways by a few px on the join. Same
          reason the frame counter continues. cxRest is MARK_X, which is where
          cut 2's camera sat for its whole length, so bgX is 0 on f0 and only
          opens up once this cut actually pans. */}
      <KraftBackground
        frame={frame + CONTINUE_FROM}
        cy={cy}
        cyRest={IW3_CAM_CY[0]}
        cx={cx}
        cxRest={MARK_X}
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
              {tickG > 0.002 ? (
                <>
                  <line
                    x1={TICK_L0}
                    y1={TICK_Y}
                    x2={TICK_L0 + TICK_LEN * tickG}
                    y2={TICK_Y}
                    stroke={ink}
                    strokeWidth={TICK_W}
                    strokeLinecap="round"
                    strokeDasharray={TICK_DASH}
                    opacity={TICK_OP}
                  />
                  <line
                    x1={TICK_R0}
                    y1={TICK_Y}
                    x2={TICK_R0 + TICK_LEN * tickG}
                    y2={TICK_Y}
                    stroke={ink}
                    strokeWidth={TICK_W}
                    strokeLinecap="round"
                    strokeDasharray={TICK_DASH}
                    opacity={TICK_OP}
                  />
                </>
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

            {/* the eight companies, pulled under the line */}
            {cards.map((c) => (
              <CompanyCard
                key={`k${c.i}`}
                x={c.x}
                y={c.y}
                sector={SECTOR_SET[c.i]}
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

export default AsGoodOrBetterV3;
