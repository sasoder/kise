import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
// The one V3 world: the kraft backdrop, the mark, the eight companies, the
// ground, the depths and the thread constants. Imported, never restated.
import {
  CARD_SIZE,
  CompanyCard,
  D1Mark,
  DEPTH_DEEP,
  DEPTH_MEDIUM,
  DEPTH_ON,
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
  MARK_TOP,
  MARK_X,
  MARK_Y,
  N_CARDS,
  SECTOR_SET,
  SUBJECT,
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  cardX,
  cardY,
  originX,
} from "./d1Shared";

export const FPS = 24;
// Dan Sundheim, D1 Capital, on coming back to shorting after a year out:
// "When we got back into it I said, look, we're going to have to be more
//  diverse, we're going to have to be less aggressive."
//
// SRT span 0:15.480 -> 0:21.339 at 24fps.
// round((21.339 - 15.480) * 24) = round(5.859 * 24) = round(140.6) = 141
// frames of speech, plus a 16 frame tail so the resolved state holds = 157.
export const DURATION = 157;

// Word onsets, in frames from the composition's start (= 15.480):
//   f0 when · f3 we · f7 got · f10 back · f15 into · f22 it · f28 i · f33 said
//   · f38 look · f45 we're · f52 going · f53 to · f57 have · f60 to · f62 be
//   · f64 more · f84 diverse · f84 we're · f91 going · f95 to · f99 have
//   · f110 to · f113 be · f115 less · f120 aggressive · f141 end · tail to f157
//
// ---------------------------------------------------------------------------
// "Back into it", V3 — ONE WORLD, NO COINS. Same beat table, same DURATION,
// same `flow` and the same camera-track SHAPE as V2. What changes is the
// picture: nothing slides in from off-frame, nothing pops, no money is drawn.
// Eight companies STAND ON the ground from frame 0 and the only verb in the
// cut is D1 pulling them under the line and then easing them back up toward
// it. Depth IS the size of the short.
//
//   1. WHEN WE GOT BACK INTO IT — f0 is the resting market: the mark, the
//      ground, eight companies standing on it at DEPTH_ON, no threads at all.
//      From f0.7 ONE thread draws head-led out of `originX(SUBJECT)` on the
//      mark's bottom edge and touches the phone's top edge on "back" (f10);
//      from that frame it PULLS, DEPTH_ON -> DEPTH_DEEP, arriving on "it"
//      (f22) with the V2 press profile — accel, cruise, a 3 px back(0.75)
//      overshoot easing back. One object arrives, so it takes the full house
//      click: the thread goes ink at 1.0 for four frames. The camera pushes
//      with the pull, f8-22, its centre following the phone down
//                                      — "when we got back into it"   f0-22
//   2. LOOK — the held breath, and the strain. Three ripe packets run once
//      down the thread f34-f60, and the phone bobs +/-4 px on a 40 frame
//      period: it is pulling back against the line. Camera dead still
//                                      — "look"                       f38
//   3. MORE DIVERSE — one motion, the only big one in the cut. Seven threads
//      leave the mark's bottom edge together at f62 (+/-1 frame of hash) and
//      run at ONE tip speed, so the nearest company is caught first and the
//      ends last and the wave is centre-outward without a stagger being
//      authored on top of it. The moment a head touches, that card is pulled
//      DEPTH_ON -> DEPTH_MEDIUM on the same press profile; meanwhile the
//      phone RISES DEPTH_DEEP -> DEPTH_MEDIUM f66-84, so the book evens up and
//      all eight hang level by f86. Group beat, so each landing takes the
//      half-step (#FFD98A, 3 frames), never full ink, and no tile ever
//      changes colour. Camera pull-back k 1.30 -> 1.00 keyed f54-72, landed
//      before f80                       — "more diverse"              f62-86
//   4. LESS AGGRESSIVE — all eight rise together, DEPTH_MEDIUM ->
//      DEPTH_SHALLOW, from f113 with a 0-4 frame hash so the row breathes
//      rather than snapping as a sheet. The threads shorten with them and dim
//      0.95 -> 0.40 over f120-140. It is a settle, so there is no click at all
//                                      — "less aggressive"            f113-140
//   5. TAIL — held, never faded: eight companies hanging a little way under
//      the line, eight idle threads, the mark. One ambient packet at 0.38
//      every ~9 frames drifting down one of the threads, and a 2.2 px idle bob
//      on the row                       — tail                        f141-157
//
// Ambient, throughout and not a gesture: `sway` on the camera, the kraft's own
// parallax drift, the packets, and the idle bob.
//
// FOUR NUMBERS DEVIATE FROM THE BRIEF AND ALL FOUR ARE ARGUED WHERE THEY ARE
// SET: the camera opens at 1.18 and pushes to 1.30 rather than 1.30 -> 1.40
// (at 1.40 the outer cards are cut by the frame — see K_OPEN); the subject's
// thread starts at f0.7 rather than f4 (its tip has 327 px to cover before
// f10 — see THREAD_SPEED); the seven threads' press is 10 frames rather than
// 16 (16 puts the outermost pair's landing at f92, six frames past the level
// row — see PRESS_DUR); and the "look" packets take 20 frames rather than 14
// (a packet on the deep thread is a small object and 14 frames is 73 screen px
// a frame — see PACKET_TRAVEL).
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: every line and every packet, at its own opacity
  accentDeep: z.string(), // the set's shared palette; this cut has no dot at rest
  accentHalf: z.string(), // the half-step click, for a GROUP beat
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
  markSize: z.number(),
  cardSize: z.number(),
  beats: z.object({
    when: z.number(), // "when"
    we: z.number(), // "we"
    got: z.number(), // "got"
    back: z.number(), // "back" — the thread touches the phone
    into: z.number(), // "into"
    it: z.number(), // "it" — the phone lands at DEPTH_DEEP
    i: z.number(), // "I"
    said: z.number(), // "said"
    look: z.number(), // "look" — packets down the thread, the phone strains
    were1: z.number(), // "we're"
    going1: z.number(), // "going"
    to1: z.number(), // "to"
    have1: z.number(), // "have"
    to2: z.number(), // "to"
    be1: z.number(), // "be" — the seven threads leave the mark
    more: z.number(), // "more"
    diverse: z.number(), // "diverse" — the row is level at DEPTH_MEDIUM
    were2: z.number(), // "we're"
    going2: z.number(), // "going"
    to3: z.number(), // "to"
    have2: z.number(), // "have"
    to4: z.number(), // "to"
    be2: z.number(), // "be" — the eight start to ease up
    less: z.number(), // "less"
    aggressive: z.number(), // "aggressive"
    end: z.number(), // speech ends; tail to 157
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE WORLD. Every placement comes from d1Shared: the mark at (540, 430), the
// ground at 880, eight companies at `cardX(i)` and the three depths. Nothing
// is placed by eye and nothing is restated here.
// ---------------------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1400;
export const CENTRE_X = MARK_X;
// A card standing ON the ground has its top edge here; it is where every
// thread is drawn to, because that is where the card is when it is caught.
export const CARD_TOP_ON = cardY(DEPTH_ON) - CARD_SIZE / 2; // 808

// The landing shape, shared by every press and every rise: a few px past and
// easing back, never a spring, and never on a hold.
export const LAND_BACK = 0.75;
export const SETTLE_PX = 3;

const landEase = Easing.out(Easing.back(LAND_BACK));
// `overshoot(u)` is the part of landEase that sticks out past 1, normalised to
// peak at 1, so it can be scaled in world px along a travel's own direction.
const BACK_PEAK = (4 * LAND_BACK ** 3) / (27 * (LAND_BACK + 1) ** 2); // 0.0204
const overshoot = (u: number) => Math.max(0, landEase(clamp01(u)) - 1) / BACK_PEAK;

// A travel curve with a flat middle. Eases in over the first `a` and out over
// the last `a` and runs at one speed in between, so the peak is 1/(1-a) times
// the average and both ends still have zero velocity — which is what keeps a
// mass reading as one body rather than as n thrown objects.
const FLOW_A = 0.28;
const flow = (u: number, a: number = FLOW_A) => {
  const x = clamp01(u);
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};

// One segment of a depth track: `delta` px of travel between f0 and f1, on
// `flow`, with the landing overshoot applied ALONG the travel. A segment that
// has not started contributes exactly 0, so the tracks simply add up.
const seg = (f: number, f0: number, f1: number, delta: number) => {
  const u = clamp01((f - f0) / (f1 - f0));
  return delta * flow(u) + Math.sign(delta) * Math.min(SETTLE_PX, 0.1 * Math.abs(delta)) * overshoot(u);
};

// ---------------------------------------------------------------------------
// 1. WHEN WE GOT BACK INTO IT. One company pulled hard under the line.
//
// THE THREAD'S TIP RUNS AT ONE SPEED, and that speed is what sets when a
// thread starts rather than the other way round. The subject's thread has 327
// px to cover between the mark's bottom edge and the phone's top edge, and it
// has to be THERE on "back" at f10: at the brief's f4 start that is 55 world
// px a frame, 64 screen px at this zoom, half again over the house cap of 45.
// So the tip is given the cap's speed instead and the start falls out of it —
// f0.65, which still leaves f0 with no thread in the picture and f1 with a
// sub-pixel nub, which is the thing the brief is actually protecting.
//
// The same speed then drives the seven in gesture 3, and because a nearer card
// is a shorter thread, the centre-outward wave comes out of the geometry
// instead of being authored as a stagger on top of it.
// ---------------------------------------------------------------------------
export const THREAD_SPEED = 35; // world px per frame, the tip's cruise speed
export const DRAW_A = 0.08; // the tip's own ease: peak 1.087x its average
export const HEAD_R = 3;

export const SUBJ_TOUCH = 10; // "back" — the thread reaches the phone
export const PRESS1_F0 = SUBJ_TOUCH; // it pulls from the frame it touches
export const PRESS1_F1 = 22; // "it" — the phone is at DEPTH_DEEP

export const CLICK_F = PRESS1_F1; // the house click, on the landing
export const CLICK_DUR = 4; // ONE object arrives, so it is the full ink click
export const GROUP_CLICK_DUR = 3; // a group beat takes the half-step instead

// ---------------------------------------------------------------------------
// 2. LOOK. A hold with two pieces of motion and nothing else.
//
// PACKET_TRAVEL IS 20, NOT THE BRIEF'S 14. By f34 the thread is 622 px long —
// the phone is at DEPTH_DEEP — and a packet is a 3 px disc, the one kind of
// object the speed cap is really about. 14 frames is 44 world px a frame, 58
// screen px at k 1.30, and it strobes. 20 frames is 31 / 40, inside the cap,
// and the three of them still read as one run down the line.
// ---------------------------------------------------------------------------
export const PACKET_R = 3;
export const LOOK_F = 34;
export const LOOK_GAP = 3;
export const LOOK_N = 3;
export const PACKET_TRAVEL = 20;

export const BOB_PERIOD = 40; // the strain: a slow pull back against the line
export const BOB_STRAIN = 4;
export const BOB_STRAIN_F0 = 26; // in, once the phone has landed
export const BOB_STRAIN_F1 = 34;
export const BOB_STRAIN_OUT0 = 60; // out, before the row starts moving
export const BOB_STRAIN_OUT1 = 68;
// and the idle version of the same thing, on every card that is hanging
export const BOB_IDLE = 2.2;

// ---------------------------------------------------------------------------
// 3. MORE DIVERSE. Seven more threads, one wave, and the first one evens up.
//
// PRESS_DUR IS 10, NOT THE BRIEF'S 16. The outermost thread is 462 px long, so
// at the tip speed above it touches its card at f75.9; a 16 frame press puts
// that card at DEPTH_MEDIUM at f92, six frames after the row is supposed to be
// level and eight after "diverse". 10 frames lands it at f86 with the rest,
// and 166 px in 10 frames peaks at 23 world px a frame — half the cap, so the
// press still reads as a pull rather than a snap.
// ---------------------------------------------------------------------------
export const WAVE_F0 = 62; // "be", two frames ahead of "more"
export const WAVE_JITTER = 1; // +/- 1 frame, so seven starts are not one start
export const PRESS_DUR = 10;
export const RISE_F0 = 66; // the phone comes up to meet them
export const RISE_F1 = 84; // "diverse"

// ---------------------------------------------------------------------------
// 4. LESS AGGRESSIVE. One group settle, no click.
// ---------------------------------------------------------------------------
export const EASE_F0 = 113; // "be", two frames ahead of "less"
export const EASE_HASH = 4;
export const EASE_DUR = 16;
export const DIM_F0 = 120; // "aggressive"
export const DIM_F1 = 140;

// ---------------------------------------------------------------------------
// 5. TAIL. One packet every ~9 frames, forever, so the line is never dead.
// ---------------------------------------------------------------------------
export const AMBIENT_F0 = 88;
export const AMBIENT_GAP = 9;
export const AMBIENT_OP = 0.38;
// a fixed order rather than a hash, so two packets never leave on the same
// thread back to back
export const AMBIENT_ORDER = [3, 0, 5, 2, 7, 4, 1, 6];

// ---------------------------------------------------------------------------
// THE THREADS. Origin on the mark's bottom edge, target the card's top edge as
// it stands on the ground, duration = length / speed.
// ---------------------------------------------------------------------------
export type ThreadPlan = {
  i: number;
  x0: number;
  y0: number;
  tx: number;
  ty: number;
  len: number;
  start: number;
  touch: number;
  land: number; // when that card reaches the depth this thread pulls it to
};

export const THREADS: ThreadPlan[] = Array.from({ length: N_CARDS }, (_, i) => {
  const x0 = originX(i);
  const y0 = MARK_BOTTOM;
  const tx = cardX(i);
  const ty = CARD_TOP_ON;
  const len = Math.hypot(tx - x0, ty - y0);
  const dur = len / THREAD_SPEED;
  if (i === SUBJECT) {
    return { i, x0, y0, tx, ty, len, start: SUBJ_TOUCH - dur, touch: SUBJ_TOUCH, land: PRESS1_F1 };
  }
  const start = WAVE_F0 + WAVE_JITTER * (hash(i, 17) * 2 - 1);
  const touch = start + dur;
  return { i, x0, y0, tx, ty, len, start, touch, land: touch + PRESS_DUR };
});

export const easeStart = (i: number) => EASE_F0 + EASE_HASH * hash(i, 23);

// A card's depth at a frame: its pull, its rise if it is the subject, and the
// group's ease up at the end, added together.
export const depthAt = (i: number, f: number) => {
  const t = THREADS[i];
  let d = DEPTH_ON;
  if (i === SUBJECT) {
    d += seg(f, PRESS1_F0, PRESS1_F1, DEPTH_DEEP - DEPTH_ON);
    d += seg(f, RISE_F0, RISE_F1, DEPTH_MEDIUM - DEPTH_DEEP);
  } else {
    d += seg(f, t.touch, t.land, DEPTH_MEDIUM - DEPTH_ON);
  }
  d += seg(f, easeStart(i), easeStart(i) + EASE_DUR, DEPTH_SHALLOW - DEPTH_MEDIUM);
  return d;
};

// The bob. The subject strains against its thread while it is held deep; every
// card idles once it is hanging, and the row goes quiet while it is rising.
export const bobAt = (i: number, f: number) => {
  const t = THREADS[i];
  const strain =
    i === SUBJECT
      ? BOB_STRAIN *
        smoothstep((f - BOB_STRAIN_F0) / (BOB_STRAIN_F1 - BOB_STRAIN_F0)) *
        (1 - smoothstep((f - BOB_STRAIN_OUT0) / (BOB_STRAIN_OUT1 - BOB_STRAIN_OUT0)))
      : 0;
  const settled = smoothstep((f - (t.land + 4)) / 10);
  const quiet = 1 - smoothstep((f - (EASE_F0 - 2)) / 6) + smoothstep((f - (EASE_F0 + EASE_DUR + 4)) / 12);
  const idle = BOB_IDLE * settled * clamp01(quiet);
  const amp = Math.max(strain, idle);
  return amp * Math.sin((2 * Math.PI * (f - hash(i, 5) * BOB_PERIOD)) / BOB_PERIOD);
};

export const cardCentreY = (i: number, f: number) => cardY(depthAt(i, f)) + bobAt(i, f);
export const cardTopY = (i: number, f: number) => cardCentreY(i, f) - CARD_SIZE / 2;

// Where a thread's far end is: its tip while it is drawing, its card's top
// edge — bob and all — from the frame it touches.
export const threadEnd = (i: number, f: number) => {
  const t = THREADS[i];
  if (f >= t.touch) return { x: t.tx, y: cardTopY(i, f), drawing: false };
  const u = clamp01((f - t.start) / (t.touch - t.start));
  const g = flow(u, DRAW_A);
  return { x: t.x0 + (t.tx - t.x0) * g, y: t.y0 + (t.ty - t.y0) * g, drawing: true };
};

// ---------------------------------------------------------------------------
// THE CAMERA. V2's track shape: a push riding the first pull, dead still under
// "look", one pull-back keyed f54-72 landed before "diverse", one creep under
// "less aggressive". `cy = c + CAM_LIFT / k` off the same eased k, so the
// content centre sits on screen y 835 — under the captions — at every zoom.
//
// K_OPEN IS 1.18 AND THE PUSH LANDS ON 1.30, NOT 1.30 -> 1.40. The row of
// eight spans x 140..940 and a camera at k sees 540 +/- 540/k, so anything
// tighter than k 1.34 cuts the outer two cards: at the brief's 1.40 the frame
// is 154..926 and the end companies lose 14 px each, which is a sliced tile
// parked on the frame edge for the whole of gestures 1 and 2. The push keeps
// its size (a little over 10%) and slides down the scale so it LANDS on 1.30,
// where the row still has 15 world px of margin with the sway at its worst.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.18;
export const K_PUSH = 1.3; // the row's own limit: 540/1.30 = 415 >= 400 + sway
export const K_WIDE = 1.0;
export const K_FINAL = 1.04;
// The content centre is the midpoint of the mark's top edge and the lowest
// thing in the picture, so the framing follows the book down and back up.
export const CONTENT_OPEN = (MARK_TOP + GROUND_Y) / 2; // 628
export const CONTENT_DEEP = (MARK_TOP + cardY(DEPTH_DEEP) + CARD_SIZE / 2) / 2; // 776
export const CONTENT_WIDE = (MARK_TOP + cardY(DEPTH_MEDIUM) + CARD_SIZE / 2) / 2; // 711
export const CONTENT_FINAL = CONTENT_WIDE - 40;

export const PUSH = camMove({
  f0: 8,
  f1: 22,
  k0: K_OPEN,
  k1: K_PUSH,
  c0: CONTENT_OPEN,
  c1: CONTENT_DEEP,
  warp: 1,
});
export const PULL = camMove({
  f0: 54,
  f1: 72,
  k0: K_PUSH,
  k1: K_WIDE,
  c0: CONTENT_DEEP,
  c1: CONTENT_WIDE,
  warp: 0.72,
});
export const CREEP = camMove({
  f0: 110,
  f1: 128,
  k0: K_WIDE,
  k1: K_FINAL,
  c0: CONTENT_WIDE,
  c1: CONTENT_FINAL,
  warp: 1,
});
export const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL;
export const CAM_F = [0, ...PUSH.F, ...PULL.F, ...CREEP.F, DURATION];
export const CAM_K = [K_OPEN, ...PUSH.K, ...PULL.K, ...CREEP.K, K_FINAL];
export const CAM_CY = [PUSH.CY[0], ...PUSH.CY, ...PULL.CY, ...CREEP.CY, CY_FINAL];

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  accentHalf: "#FFD98A",
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
  markSize: MARK_SIZE,
  cardSize: CARD_SIZE,
  beats: {
    when: 0,
    we: 3,
    got: 7,
    back: 10,
    into: 15,
    it: 22,
    i: 28,
    said: 33,
    look: 38,
    were1: 45,
    going1: 52,
    to1: 53,
    have1: 57,
    to2: 60,
    be1: 62,
    more: 64,
    diverse: 84,
    were2: 84,
    going2: 91,
    to3: 95,
    have2: 99,
    to4: 110,
    be2: 113,
    less: 115,
    aggressive: 120,
    end: 141,
  },
});

const BackIntoItV3: React.FC<Props> = ({
  ink,
  accent,
  accentHalf,
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
  markSize,
  cardSize,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the eight companies ---------------------------------------------------
  const cards = SECTOR_SET.map((sector, i) => ({
    i,
    sector,
    x: cardX(i),
    y: cardCentreY(i, frame),
  }));

  // -- the threads -----------------------------------------------------------
  // One per company, all of them out of the mark's bottom edge, all of them
  // ending on the top edge of the thing they hold. The subject's is live from
  // f0.7; the other seven from f62. A thread is ripe while it is working, ink
  // for the four frames of the single-object click, the half-step for the
  // three frames of a group landing, and it dims with the row at the end.
  const dim = interpolate(frame, [DIM_F0, DIM_F1], [THREAD_LIVE, THREAD_IDLE], clamp);
  // The settle at the end is carried by OPACITY alone. A tone ramp ripe ->
  // deep was built on top of it first and measured on f156: a 2.5 px deep
  // line at 0.40 over kraft comes out at 1.47:1, under the 1.8:1 the house
  // asks of anything that has to stay readable, and the eight threads — the
  // one thing saying D1 is still holding the row — went to a whisper. The
  // house rule is the one that survives: an accent LINE is always the ripe
  // tone and carries its state in its opacity.
  const threads = THREADS.map((t) => {
    const end = threadEnd(t.i, frame);
    const clicked =
      t.i === SUBJECT && frame >= CLICK_F && frame < CLICK_F + CLICK_DUR
        ? "ink"
        : t.i !== SUBJECT && frame >= t.land && frame < t.land + GROUP_CLICK_DUR
          ? "half"
          : "live";
    return {
      key: t.i,
      on: frame >= t.start,
      x0: t.x0,
      y0: t.y0,
      x2: end.x,
      y2: end.y,
      head: end.drawing,
      stroke: clicked === "ink" ? ink : clicked === "half" ? accentHalf : accent,
      op: clicked === "ink" ? 1 : dim,
    };
  });

  // -- the packets -----------------------------------------------------------
  // "look": three of them, once, down the one live thread. Then one every nine
  // frames for the rest of the piece, so the eight lines are never dead.
  const packetAt = (i: number, t: number) => {
    const th = THREADS[i];
    const end = threadEnd(i, frame);
    const u = clamp01(t);
    return { x: th.x0 + (end.x - th.x0) * u, y: th.y0 + (end.y - th.y0) * u };
  };
  type Pk = { key: string; i: number; t: number; op: number };
  const packets: Pk[] = [];
  for (let n = 0; n < LOOK_N; n++) {
    const t = (frame - (LOOK_F + n * LOOK_GAP)) / PACKET_TRAVEL;
    if (t > 0 && t < 1) packets.push({ key: `l${n}`, i: SUBJECT, t, op: THREAD_LIVE });
  }
  for (let n = 0; ; n++) {
    const s = AMBIENT_F0 + n * AMBIENT_GAP;
    if (s > frame) break;
    const t = (frame - s) / PACKET_TRAVEL;
    if (t > 0 && t < 1) {
      packets.push({ key: `a${n}`, i: AMBIENT_ORDER[n % AMBIENT_ORDER.length], t, op: AMBIENT_OP });
    }
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CENTRE_X}
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
            {/* the ground: one floor, and every depth is read against it */}
            <line
              x1={GROUND_X0}
              y1={GROUND_Y}
              x2={GROUND_X1}
              y2={GROUND_Y}
              stroke={ink}
              strokeWidth={GROUND_W}
              strokeLinecap="round"
              opacity={GROUND_OP}
              style={{ filter: icon }}
            />

            {/* the threads, under the tiles so a tip never crosses a glyph */}
            <g style={{ filter: icon }}>
              {threads.map((t) =>
                t.on ? (
                  <line
                    key={t.key}
                    x1={t.x0}
                    y1={t.y0}
                    x2={t.x2}
                    y2={t.y2}
                    stroke={t.stroke}
                    strokeWidth={THREAD_W}
                    strokeLinecap="round"
                    opacity={t.op}
                  />
                ) : null,
              )}
              {threads.map((t) =>
                t.on && t.head ? (
                  <circle key={`h${t.key}`} cx={t.x2} cy={t.y2} r={HEAD_R} fill={ink} opacity={t.op} />
                ) : null,
              )}
            </g>

            {/* packets, down whichever thread they were launched on */}
            {packets.map((p) => {
              const at = packetAt(p.i, p.t);
              return (
                <circle key={p.key} cx={at.x} cy={at.y} r={PACKET_R} fill={accent} opacity={p.op} />
              );
            })}

            {/* the eight companies. They never move sideways and their tiles
                never change colour: the only thing that says anything about
                them is how far under the line they are. */}
            {cards.map((c) => (
              <CompanyCard key={c.i} x={c.x} y={c.y} sector={c.sector} size={cardSize} k={k} />
            ))}

            {/* the mark. It never moves. */}
            <D1Mark x={MARK_X} y={MARK_Y} size={markSize} k={k} dotColor={accent} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default BackIntoItV3;
