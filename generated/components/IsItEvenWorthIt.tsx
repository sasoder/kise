import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
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
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  D1Mark,
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  MARK_SIZE,
} from "./d1Shared";

export const FPS = 24;
// Dan Sundheim (D1 Capital) on shorting: "Shorting is a really hard thing to do,
// so at some point it's like, okay, if you're going to diversify so much and
// your returns are going down, like, is it even worth it?"
//
// SRT span 0:26.600 -> 0:34.659 at 24fps.
// round((34.659 - 26.600) * 24) = round(8.059 * 24) = round(193.4) = 193 frames
// of speech, plus a 16-frame tail so the resolved state holds = 209.
export const DURATION = 209;

// ---------------------------------------------------------------------------
// "Is it even worth it?" — Orange Dwarkesh style on kraft paper: opaque
// cutaway, 24fps, 1080x1920, two tones of one warm yellow with the dots fully
// opaque, one stroke weight for threads, per-icon shadows, eased camera moves,
// one gesture per word.
//
// WORD ONSETS (frames from the composition start, = 26.600s)
//   f0 shorting · f13 is · f23 a · f43 really · f62 hard · f66 thing · f70 to ·
//   f72 do · f76 so · f83 at · f86 some · f91 point · f100 it's · f105 like ·
//   f108 okay · f114 if · f117 you're · f119 going · f120 to · f120 diversify ·
//   f131 so · f137 much · f145 and · f151 your · f153 returns · f158 are ·
//   f161 going · f162 down · f171 like · f174 is · f178 it · f180 even ·
//   f181 worth · f187 it? (ends f193) · tail to f209.
//
// THE PICTURE. A ground line is the market's surface. A stock is a solid amber
// dot. To short it, D1 pushes it BELOW the line down a thread from its own
// mark, and how deep it goes is the return. Nothing here is a chart and nothing
// here is a crowd: it is one wire with signal on it.
//
// THE GESTURES, one per word, and nothing else.
//   1. "shorting"                                                    f0-f34
//      At f0 the dot sits ON the line (depth DEPTH_LINE, ripe), the mark above
//      it, no thread. The thread draws head-led from the mark's bottom centre
//      down to the dot f0-f10, and the FRAME IT TOUCHES the dot is pushed to
//      DEPTH_DEEP, arriving f30 on Easing.out(Easing.back(1.5)) — the back
//      overshoot IS the dot going a few px too deep and easing up, which is the
//      market pushing back. Ink click-bright 4 frames on the landing. The
//      thread is a straight mark->dot line that lengthens as the dot goes down.
//      CAMERA M0: opens at k 1.35 framing mark + line + the depth under it and
//      pushes in with the dot, k 1.35 -> 1.55, c 690 -> 730, keys f8-f28
//      warp 0.72, landed f34.
//   2. "really hard"                                              f36-f72
//      THE FIGHT. f36-f60 the dot creeps back UP 46 px toward the line on an
//      even climb (linear — this is strain, not an arrival), and the thread
//      goes taut: it stays straight, its opacity pulses once 0.95 -> 1.00 and
//      the mark's own amber dot ticks to the half-step and back. It is the one
//      pulling. At f62 "hard" the thread YANKS it back to DEPTH_DEEP in six
//      frames, Easing.in(Easing.quad) — accelerate into a hard stop, no
//      overshoot — and ink click-bright 4 frames on f68. 46 rather than 28: see
//      STRAIN, the creep was eating the climb.
//      CAMERA M1: a slow even creep on the dot, k 1.55 -> 1.70, c 730 -> 735,
//      keys f37-f51 warp 1.0, landed f57, then DEAD STILL f57-f62 (the held
//      breath, sway only).
//      CAMERA M2: rides the yank down ~10 screen px, c 735 -> 740.9 at k 1.70,
//      keys f62-f68 warp 0.72, and settles.
//   3. "so at some point it's like okay if you're going to"        f70-f118
//      THE HOLD BEFORE THE TURN. The dot never stops pushing back: a bob of
//      +-6 px on a 40-frame period about DEPTH_DEEP, amplitude ramped in
//      f70-f84 so the yank's stop is not undone.
//      CAMERA M3: the long even pull-back that opens the whole line into frame
//      AHEAD of the fan, k 1.70 -> 1.15, c 740.9 -> 592, keys f92-f110
//      warp 1.0, landed f116. The viewer sees the empty line and knows
//      something is coming.
//   4. "diversify so much"                                        f117-f140
//      THE BIG MOTION, one continuous gesture. The single thread becomes 25:
//      they fan from the mark's BOTTOM EDGE (+-34 px, not one pin — see
//      FAN_ORIGIN_SPREAD) to 25 points on the line in one wave out of the
//      centre (start = f117 + 2.5 * rank/12 + 1.5 * hash, and every head runs
//      at ONE speed, so the outer threads — half as long again — are still
//      landing when the centre ones are done: the fan opens like a hand). Each
//      head's dot grows in under it at the line over the five frames before the
//      touch, deep, and is PRESSED to DEPTH_SHALLOW in six frames as the head
//      arrives, going deep -> ripe with the press and taking the dense-front
//      half-step click (#FFD98A, 2 frames). The original centre dot rises
//      DEPTH_DEEP -> DEPTH_SHALLOW f118-f132 on the same landing ease and
//      becomes dot 13 of the row — the same object, never swapped.
//      25 shallow depths (25 x 26 = 650) against the single 220: spread thinner
//      AND wider, which is the whole point. They do not sum.
//      CAMERA: holds the frame the pull-back opened. The row spans screen x
//      60-1020 at k 1.15, inside the 60 px margin.
//   5. "returns are going down"                                   f150-f172
//      THE RECEDE. One wave out of the centre (start = f150 + 14 * rank/12,
//      8 frames each, last one home at f172) does three things at once and
//      nothing else: the dots cool ripe -> deep, their threads dim 0.95 ->
//      0.40, and every dot in the row settles 4 px SHALLOWER (26 -> 22). Less
//      return is literally less depth.
//      CAMERA M4: creeps back a touch further, k 1.15 -> 1.02, c 592, keys
//      f146-f164 warp 1.0, landed f170, so the row reads thin.
//   6. "worth it?"                                                f172-f209
//      HOLD ON THE QUESTION. The only motion is the wave finishing its outer
//      ends, the paper's own drift, and one packet at a time drifting DOWN an
//      idle thread at the ambient ceiling 0.38 — one launch per 10 frames
//      across the whole fan, not per thread, and only on a thread the wave has
//      already passed. The mark's amber dot is the only ripe thing left in
//      frame. Held resolved to f209; never fades out.
//
// ambient: `breath` on every dot, `sway` on the camera, the kraft sheet's
// parallax and drift. Not gestures; that is what this field is.
// ---------------------------------------------------------------------------

// -- the world -------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1240;

// The market's surface. One ground, the shared 5 px at 0.24 — lifted to 0.40
// for the whole piece because something is being measured against it from f0.
export const GROUND_Y = 760;
export const GROUND_X0 = 100;
export const GROUND_X1 = 980;
export const GROUND_W = 5;
export const GROUND_OP = 0.4;

// The actor above it.
export const MARK_X = 540;
export const MARK_Y = 430;
export const MARK_BOTTOM = MARK_Y + MARK_SIZE / 2; // where every thread leaves

// The unit. A stock is a solid dot; depth below the line is the return.
export const DOT_R = 9;
export const DEPTH_LINE = -DOT_R; // sitting ON the line: centre y 751
export const DEPTH_DEEP = 220; // one stock, pressed all the way down
export const DEPTH_SHALLOW = 26; // twenty-five stocks, each barely under
export const DEPTH_SETTLED = 22; // ...and 4 px less again once returns fall
// How far it climbs back before the yank. The brief's number was 28, and 28 is
// INVISIBLE here: the camera is creeping in over the same window, and a zoom
// pushes a dot that sits below the content centre DOWNWARD on screen. Measured
// on the first render, the dot's screen y went 1240 -> 1277 across f36-f57 —
// it read as sinking while it was climbing. 46 world px is what it takes for
// the climb to beat the creep and read as a ~45 screen px RISE, which is what
// the brief actually asks for ("it must be visible on the strip"). The yank
// takes the same 46 back in six frames: 13 screen px/frame, well inside the cap.
export const STRAIN = 66;

// The row the fan lands on.
export const ROW_N = 25;
export const ROW_PITCH = 34;
export const ROW_MID = (ROW_N - 1) / 2; // 12 — the original dot's index
export const rowX = (j: number) => MARK_X + (j - ROW_MID) * ROW_PITCH; // 132..948
export const rank = (j: number) => Math.abs(j - ROW_MID); // 0 at centre, 12 outside

// One stroke weight for threads, two opacities.
export const THREAD_W = 2.5;
export const THREAD_LIVE = 0.95;
export const THREAD_IDLE = 0.4;

// One landing ease for anything that arrives. The yank is the exception and is
// meant to be: it accelerates into a hard stop, which is what a yank is.
export const EASE_LAND = Easing.out(Easing.back(1.5));
export const EASE_YANK = Easing.in(Easing.quad);

// One click-bright. Ink for 4 frames on a single arrival; the dense front of
// the fan takes the half-step for 2, or the beat overlaps itself into a pale
// band laid through the row.
export const CLICK_INK = 4;
export const CLICK_HALF = "#FFD98A";
export const CLICK_HALF_DUR = 2;

export const AMBIENT = 0.38; // the shared ceiling for anything subordinate

// -- the fan's timing ------------------------------------------------------
// Every head runs at ONE speed. 37 world px/frame is 42.6 screen px/frame at
// the k the fan plays at (1.15), just inside the 45 px/frame close-up cap; it
// is also what makes the fan open like a hand, because the outer threads are
// 482 px long against the centre's 258 and therefore take 13 frames against 7.
export const FAN_SPEED = 37;
export const FAN_RANK_SPREAD = 2.5; // extra frames of delay at the outer edge
export const FAN_HASH = 1.5; // per-thread hashed delay, so no two leave together
export const PRESS_DUR = 6; // line -> DEPTH_SHALLOW
export const DOT_GROW = 5; // frames a pressed dot grows in at the line

// Where a thread leaves the mark. NOT one pin: twenty-five threads converging
// on a single point draw a hard spike and the whole fan reads as one filled
// triangle rather than as twenty-five wires. They leave the mark's BOTTOM EDGE
// instead, spread +-34 px inside its 108 px width, so the apex is the mark and
// the outer threads are visibly separate all the way up. The centre thread —
// the original one, drawn at f0 — still leaves dead centre, so nothing about
// the first eighty frames changes.
export const FAN_ORIGIN_SPREAD = 34;
export const originX = (j: number) =>
  MARK_X + ((j - ROW_MID) / ROW_MID) * FAN_ORIGIN_SPREAD;

export const LINE_TOP = GROUND_Y + DEPTH_LINE - DOT_R; // a dot's top, on the line
export const threadLen = (j: number) =>
  Math.hypot(rowX(j) - originX(j), LINE_TOP - MARK_BOTTOM);

// -- the recede wave -------------------------------------------------------
export const WAVE_SPREAD = 14; // centre to outer edge
export const WAVE_DUR = 8; // one dot's own ramp

// -- the ambient packets ---------------------------------------------------
export const PACKET_STEP = 10; // one launch per ten frames, across the whole fan
export const PACKET_DUR = 18;
export const PACKET_R = 3.5;

// ---------------------------------------------------------------------------
// THE CAMERA. Five moves on one authored track through the shared damper, and
// every one of them follows the action: in with the dot, a creep onto it, a
// ride down on the yank, the pull-back that opens the line before the fan, and
// the last widening that makes the row read thin. Nothing pans — cx is MARK_X
// for the whole piece, so the camera only tilts and zooms and `KraftBackground`
// gets no cx at all.
//
// Key windows end BEFORE their landing on purpose: the damper lags its target
// by ~6 frames, so keys that run to the landing frame leave the camera visibly
// moving under the word. M1's keys stop at f50 and it is dead still by f57,
// which is the held breath the yank comes out of.
//
// The framings are solved against what has to be in frame, with a content
// centre at cy - CAM_LIFT/k landing at screen y 835 under the captions:
//   k 1.35 c 690   mark top at screen 411, the deep dot at 1227
//   k 1.55 c 730   mark top 286, the deep dot 1223
//   k 1.70 c 735   mark top 225 (215 after the yank's ride), deep dot 1257
//   k 1.15 c 592   the whole row inside x 60-1020, ground at 1019
//   k 1.02 c 592   the row at x 116-964
// ---------------------------------------------------------------------------
export const K_OPEN = 1.35;
export const CONTENT_OPEN = 690;
export const K_PUSH = 1.55; // "shorting" — in with the dot
export const C_PUSH = 730;
// "really hard" — the creep and the yank. 1.80 was tried first and is too far
// in: at 1.80 the mark's top edge lands at screen y 202 once the yank's ride is
// added, and `sway` alone then takes it over the 200 line. 1.70 leaves 15 px of
// real margin and still reads as a push.
export const K_CREEP = 1.7;
export const C_CREEP = 735;
export const C_YANK = C_CREEP + 10 / K_CREEP; // the 10 screen px ride
export const K_WIDE = 1.15; // "diversify" — the line opened out
export const C_WIDE = 592;
export const K_FINAL = 1.02; // "returns going down" — thinner again
export const CONTENT_FINAL = C_WIDE;
export const CY_FINAL = CONTENT_FINAL + CAM_LIFT / K_FINAL;

export type CamSeg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  warp: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M0 "shorting" — push in with the dot as it is driven under the line
  { f0: 8, f1: 28, k0: K_OPEN, k1: K_PUSH, c0: CONTENT_OPEN, c1: C_PUSH, warp: 0.72 },
  // M1 "really" — the even creep onto the dot, then dead still for "hard".
  // Its keys start at f37 rather than f34: M0 is landed by f34 and a second
  // push six frames behind the first one reads as a stall inside one long move
  // rather than as two. Nine frames of real hold sit between them, and the dot
  // lands and clicks inside that hold.
  { f0: 37, f1: 51, k0: K_PUSH, k1: K_CREEP, c0: C_PUSH, c1: C_CREEP, warp: 1.0 },
  // M2 "hard" — ride the yank down ~10 screen px and settle
  { f0: 62, f1: 68, k0: K_CREEP, k1: K_CREEP, c0: C_CREEP, c1: C_YANK, warp: 0.72 },
  // M3 "so at some point ... going to" — the pull-back, ahead of the fan
  { f0: 92, f1: 110, k0: K_CREEP, k1: K_WIDE, c0: C_YANK, c1: C_WIDE, warp: 1.0 },
  // M4 "returns are going down" — a touch further out, so the row reads thin
  { f0: 146, f1: 164, k0: K_WIDE, k1: K_FINAL, c0: C_WIDE, c1: CONTENT_FINAL, warp: 1.0 },
];

// One track out of the five moves: `camMove` emits a key per frame inside a
// move, and a gap between two moves gets ONE key holding the last value, which
// is what makes a hold a hold rather than a slow ramp into the next key.
const CAM_TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
  };
  CAM_SEGS.forEach((s, n) => {
    if (n === 0 && s.f0 > 0) {
      F.push(0);
      K.push(s.k0);
      CY.push(s.c0 + CAM_LIFT / s.k0);
      hold(s.f0 - 1);
    }
    if (n > 0 && s.f0 > CAM_SEGS[n - 1].f1 + 1) hold(s.f0 - 1);
    const m = camMove(s);
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a dot that has been shorted
  accentDeep: z.string(), // deep: a dot at rest on the line, and a cooled return
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
  markSize: z.number(),
  beats: z.object({
    shorting: z.number(), // "shorting"   — the thread leaves the mark
    is: z.number(), // "is"
    a: z.number(), // "a"
    really: z.number(), // "really"       — the dot starts climbing back
    hard: z.number(), // "hard"           — the yank
    thing: z.number(), // "thing"
    to: z.number(), // "to"
    doWord: z.number(), // "do"
    so: z.number(), // "so"               — the bob, the hold before the turn
    at: z.number(), // "at"
    some: z.number(), // "some"
    point: z.number(), // "point"
    its: z.number(), // "it's"
    like: z.number(), // "like"
    okay: z.number(), // "okay"
    ifWord: z.number(), // "if"
    youre: z.number(), // "you're"
    going: z.number(), // "going"
    toTwo: z.number(), // "to"
    diversify: z.number(), // "diversify" — the fan
    soTwo: z.number(), // "so"
    much: z.number(), // "much"           — the row is down
    and: z.number(), // "and"
    your: z.number(), // "your"
    returns: z.number(), // "returns"     — the recede wave
    are: z.number(), // "are"
    goingTwo: z.number(), // "going"
    down: z.number(), // "down"
    likeTwo: z.number(), // "like"
    isTwo: z.number(), // "is"
    it: z.number(), // "it"
    even: z.number(), // "even"
    worth: z.number(), // "worth"         — the hold on the question
    itQ: z.number(), // "it?"
    end: z.number(), // speech ends; tail to 209
  }),
});

export type Props = z.infer<typeof schema>;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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
  dotRadius: DOT_R,
  markSize: MARK_SIZE,
  beats: {
    shorting: 0,
    is: 13,
    a: 23,
    really: 43,
    hard: 62,
    thing: 66,
    to: 70,
    doWord: 72,
    so: 76,
    at: 83,
    some: 86,
    point: 91,
    its: 100,
    like: 105,
    okay: 108,
    ifWord: 114,
    youre: 117,
    going: 119,
    toTwo: 120,
    diversify: 120,
    soTwo: 131,
    much: 137,
    and: 145,
    your: 151,
    returns: 153,
    are: 158,
    goingTwo: 161,
    down: 162,
    likeTwo: 171,
    isTwo: 174,
    it: 178,
    even: 180,
    worth: 181,
    itQ: 187,
    end: 193,
  },
});

const IsItEvenWorthIt: React.FC<Props> = ({
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
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = at rest on the line (deep), 1 = shorted (ripe). Built once per frame.
  const tone = makeTone(accentDeep, accent);
  // the mark's own dot, ticking to the half-step while it is the one pulling
  const strainTone = makeTone(accent, CLICK_HALF);

  // -- the schedule, off the words -------------------------------------------
  const fTouch = beats.shorting + 10; // the thread reaches the dot
  const fDeep = beats.shorting + 30; // it is all the way down
  const fStrain0 = fDeep + 6; // the climb back starts
  const fStrain1 = beats.hard - 2; // ...and is at its highest just before "hard"
  const fYank0 = beats.hard; // "hard" — the thread takes it back
  const fYank1 = beats.hard + 6;
  const fBob0 = fYank1 + 2; // it never stops pushing back
  const fFan0 = beats.diversify - 3; // the first thread leaves
  const fRise0 = beats.diversify - 2; // the original dot comes up to join the row
  const fRise1 = beats.diversify + 12;
  const fWave0 = beats.returns - 3; // the recede
  // The first idle packet. +24, not +22: the outermost thread's wave only
  // finishes at fWave0 + 22, and a launch that picks a thread still cooling is
  // dropped — which silently costs a launch and leaves a hole in the tail.
  const fPacket0 = fWave0 + 24;

  // -- the original dot's depth, gesture by gesture ---------------------------
  const bobAt = (f: number) =>
    DEPTH_DEEP +
    6 *
      interpolate(f, [fBob0, fBob0 + 14], [0, 1], clamp) *
      Math.sin((2 * Math.PI * (f - fBob0)) / 40);

  const centreDepthAt = (f: number): number => {
    if (f <= fTouch) return DEPTH_LINE;
    if (f < fDeep)
      return interpolate(f, [fTouch, fDeep], [DEPTH_LINE, DEPTH_DEEP], {
        ...clamp,
        easing: EASE_LAND,
      });
    if (f < fStrain0) return DEPTH_DEEP;
    if (f < fYank0)
      // an even climb: this is strain, not an arrival, so no landing ease
      return interpolate(f, [fStrain0, fStrain1], [DEPTH_DEEP, DEPTH_DEEP - STRAIN], clamp);
    if (f < fYank1)
      return interpolate(f, [fYank0, fYank1], [DEPTH_DEEP - STRAIN, DEPTH_DEEP], {
        ...clamp,
        easing: EASE_YANK,
      });
    return bobAt(f);
  };
  // the bob's value the frame the rise takes over, so the two meet exactly
  const riseFrom = bobAt(fRise0);

  // -- the fan: one start and one arrival per thread --------------------------
  const START: number[] = [];
  const ARRIVE: number[] = [];
  for (let j = 0; j < ROW_N; j++) {
    if (j === ROW_MID) {
      START[j] = beats.shorting;
      ARRIVE[j] = fTouch;
    } else {
      START[j] =
        fFan0 + (FAN_RANK_SPREAD * rank(j)) / ROW_MID + FAN_HASH * hash(j, 17);
      ARRIVE[j] = START[j] + threadLen(j) / FAN_SPEED;
    }
  }

  // -- the recede wave, one window per dot ------------------------------------
  const waveStart = (j: number) => fWave0 + (WAVE_SPREAD * rank(j)) / ROW_MID;
  const waveAt = (j: number) =>
    smoothstep((frame - waveStart(j)) / WAVE_DUR); // 0 = ripe and live, 1 = cooled

  // -- where every dot is, and what colour, this frame ------------------------
  const dots = [];
  for (let j = 0; j < ROW_N; j++) {
    const centre = j === ROW_MID;
    const arrive = ARRIVE[j];
    const born = centre ? beats.shorting : arrive - DOT_GROW;
    if (frame < born) continue;

    const w = waveAt(j);
    let depth: number;
    let lit: number;
    if (centre) {
      depth =
        frame < fRise0
          ? centreDepthAt(frame)
          : interpolate(frame, [fRise0, fRise1], [riseFrom, DEPTH_SHALLOW], {
              ...clamp,
              easing: EASE_LAND,
            });
      lit = 1; // the subject from f0: this is the stock being shorted
    } else {
      depth = interpolate(frame, [arrive, arrive + PRESS_DUR], [DEPTH_LINE, DEPTH_SHALLOW], {
        ...clamp,
        easing: EASE_LAND,
      });
      // deep on the line, ripe once it has been pressed under it
      lit = clamp01((frame - arrive) / 3);
    }
    // the recede: 4 px shallower and back to the deep tone, on one wave
    depth += (DEPTH_SETTLED - DEPTH_SHALLOW) * w * clamp01((frame - fRise1) / 4);
    lit *= 1 - w;

    // click-bright: ink for four frames on a single arrival, the half-step for
    // two on the fan's dense front
    let fill = tone(lit);
    if (centre) {
      if (frame >= fDeep && frame < fDeep + CLICK_INK) fill = ink;
      if (frame >= fYank1 && frame < fYank1 + CLICK_INK) fill = ink;
    } else if (frame >= arrive && frame < arrive + CLICK_HALF_DUR) {
      fill = CLICK_HALF;
    }

    const grow = centre ? 1 : smoothstep((frame - born) / DOT_GROW);
    dots.push({
      j,
      x: rowX(j),
      y: GROUND_Y + depth,
      r: dotRadius * grow * breath(frame, hash(j, 9)),
      fill,
      w,
    });
  }
  const dotAt: Record<number, (typeof dots)[number]> = {};
  dots.forEach((d) => {
    dotAt[d.j] = d;
  });

  // -- the threads ------------------------------------------------------------
  // The strain pulse: the one thread goes taut while the dot climbs back.
  const taut = interpolate(
    frame,
    [beats.really, beats.really + 9, fYank0 - 2, fYank0],
    [0, 1, 1, 0],
    clamp,
  );

  const threads = [];
  for (let j = 0; j < ROW_N; j++) {
    if (frame < START[j]) continue;
    const arrive = ARRIVE[j];
    const d = dotAt[j];
    const drawing = frame < arrive;
    const u = drawing ? clamp01((frame - START[j]) / (arrive - START[j])) : 1;
    const ox = originX(j);
    const ex = drawing ? lerp(ox, rowX(j), u) : rowX(j);
    const ey = drawing
      ? lerp(MARK_BOTTOM, LINE_TOP, u)
      : (d?.y ?? GROUND_Y + DEPTH_SHALLOW) - (d?.r ?? dotRadius);
    const w = waveAt(j);
    const op =
      (j === ROW_MID ? THREAD_LIVE + (1 - THREAD_LIVE) * taut : THREAD_LIVE) +
      (THREAD_IDLE - THREAD_LIVE) * w;
    threads.push({ j, ox, ex, ey, op, drawing, u });
  }

  // -- one packet at a time, drifting DOWN an idle thread ---------------------
  const packets = [];
  for (let n = 0; ; n++) {
    const t0 = fPacket0 + n * PACKET_STEP;
    if (t0 > frame) break;
    if (frame >= t0 + PACKET_DUR) continue;
    const j = Math.floor(hash(n, 5) * ROW_N);
    if (waveStart(j) + WAVE_DUR + 2 > t0) continue; // only a thread the wave has passed
    const d = dotAt[j];
    if (!d) continue;
    const u = (frame - t0) / PACKET_DUR;
    packets.push({
      key: n,
      x: lerp(originX(j), d.x, u),
      y: lerp(MARK_BOTTOM, d.y - d.r, u),
    });
  }

  // -- camera -----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = MARK_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
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
            {/* the market's surface — something is measured against it from f0 */}
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
            </g>

            {/* the threads: one stroke weight, live until the wave passes */}
            <g style={{ filter: icon }}>
              {threads.map((t) => (
                <g key={t.j}>
                  <line
                    x1={t.ox}
                    y1={MARK_BOTTOM}
                    x2={t.ex}
                    y2={t.ey}
                    stroke={accent}
                    strokeWidth={THREAD_W}
                    strokeLinecap="round"
                    opacity={t.op}
                  />
                  {t.drawing ? (
                    <circle cx={t.ex} cy={t.ey} r={4} fill={ink} opacity={t.op} />
                  ) : null}
                </g>
              ))}
            </g>

            {/* the ambient traffic, at the shared ceiling */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PACKET_R} fill={accent} opacity={AMBIENT} />
            ))}

            {/* the stocks, pressed under the line */}
            {dots.map((d) => (
              <circle key={d.j} cx={d.x} cy={d.y} r={d.r} fill={d.fill} />
            ))}

            {/* D1, the one pulling */}
            <D1Mark
              x={MARK_X}
              y={MARK_Y}
              size={markSize}
              k={k}
              opacity={OP_READ}
              dotColor={strainTone(taut)}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default IsItEvenWorthIt;
