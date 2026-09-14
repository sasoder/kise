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
  CARD_SIZE,
  COIN_R,
  CompanyCard,
  D1Mark,
  DEPTH_DEEP,
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
  MARK_X,
  MARK_Y,
  N_CARDS,
  RETURN_AFTER_DROP,
  RETURN_PEAK,
  SECTOR_SET,
  SUBJECT,
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  cardX,
  cardY,
  originX,
  returnCoinPos,
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
// "Is it even worth it?" V3 — Orange Dwarkesh on kraft, opaque cutaway, 24fps,
// 1080x1920. V2's beat table, duration, press profile, strain and yank, coin
// flight, ReturnStack and camera-track structure are kept. What changed is the
// WORLD: the user on V2 — "some things are unclear and a bit hard to follow …
// not very harmonious, inconsistent" — so all three cuts are now ONE scene,
// exported whole from `d1Shared.tsx` and never restated here:
//   * EIGHT companies stand ON the ground from frame 0. Nothing slides in from
//     off-frame, there are no trains and there is no mid-air knot.
//   * Shorting a company IS D1 pulling it UNDER the line on a thread that
//     leaves the mark's own bottom edge. Depth is how hard the short is.
//   * Coins are the return and nothing else: they climb the pulled company's
//     thread onto D1 and pile on top of the mark. Never a coin on a card.
//
// WORD ONSETS (frames from the composition start, = 26.600s)
//   f0 shorting · f13 is · f23 a · f43 really · f62 hard · f66 thing · f70 to ·
//   f72 do · f76 so · f83 at · f86 some · f91 point · f100 it's · f105 like ·
//   f108 okay · f114 if · f117 you're · f119 going · f120 to · f120 diversify ·
//   f131 so · f137 much · f145 and · f151 your · f153 returns · f158 are ·
//   f161 going · f162 down · f171 like · f174 is · f178 it · f180 even ·
//   f181 worth · f187 it? (ends f193) · tail to f209.
//
// THE PICTURE. D1 pulls one company hard under the line and money climbs the
// thread onto D1. The company fights back up and the money stops. D1 pulls the
// other seven under too, but only a little way, and evens the first one up to
// them. The pile on D1 shrinks. Hold.
//
// THE GESTURES, one per word, and nothing else.
//   1. "shorting"                                                     f0-f30
//      f0 is the whole world at rest: the mark, the ground, eight companies
//      standing on it, no threads, no coins. A thread draws head-led from
//      originX(SUBJECT) on the mark's bottom edge to the phone's top edge
//      f0-f10 and then pulls it DEPTH_ON -> DEPTH_DEEP by f30 on the press
//      profile (`flow`, plus PRESS_OVER px of `back(0.75)` overshoot so it goes
//      a few px too deep and eases back). Single-object click: the thread goes
//      to a full 1.0 for CLICK_INK frames at f30. From f26 coins leave the
//      phone's top edge and climb the thread at COIN_SPEED, one every
//      COIN_A_STEP frames; each is absorbed at MARK_BOTTOM and the pile gains
//      one at returnCoinPos(n), scaled in over COIN_GROW frames.
//      CAMERA M0: opens on mark + row and travels DOWN with the phone,
//      k 1.04 -> 1.13, c 640 -> 758, keys f8-f28 warp 0.72, landed f34.
//   2. "really hard"                                                 f36-f70
//      THE FIGHT. From f36 the phone creeps back UP STRAIN px on an even climb
//      (linear — this is strain, not an arrival) and the coin launches STOP;
//      the two already in flight still arrive, so the money visibly dries up.
//      The thread pulses once to 1.0 and the mark's amber dot ticks to the
//      half-step: it is the one pulling. At f62 the YANK takes the phone back
//      to DEPTH_DEEP over 8 frames on Easing.inOut(Easing.quad), with a
//      single-object FULL-INK click on the thread for 4 frames.
//      CAMERA M1: even creep k 1.13 -> 1.18, c 758 -> 775, keys f37-f49 warp
//      1.0, landed f55, then DEAD STILL f55-f61 (the held breath).
//      CAMERA M2: rides the drop ~10 screen px, keys f62-f70 warp 0.72.
//   3. "so at some point it's like okay if you're going to"          f76-f118
//      THE HOLD BEFORE THE TURN, and nothing in it is still. The phone bobs
//      +-BOB_AMP px about DEPTH_DEEP. Launches resume at f70 and are scheduled
//      BACKWARDS from the last arrival, so the pile is exactly RETURN_PEAK (12)
//      on f118 — the return is made before the diversification starts, which is
//      the argument.
//      CAMERA M3: the long even pull-back that opens the whole row AND the room
//      above the mark the pile needs, k 1.18 -> 1.00, c 783 -> 700, keys
//      f96-f110 warp 1.0, landed f116.
//   4. "diversify so much"                                          f118-f139
//      ONE MOTION. Seven threads leave the mark's bottom edge together at f118
//      (+ a 0-0.9 frame hash) and run at one speed, so they LAND centre-outward
//      — nearest first — and each pulls its card DEPTH_ON -> DEPTH_SHALLOW the
//      moment its head touches. Meanwhile the phone RISES DEPTH_DEEP ->
//      DEPTH_SHALLOW on `flow` f118-f136: the same object, never swapped. All
//      eight are level a little way under the line by f139. Group beat, so the
//      click is the half-step #FFD98A on the thread for 3 frames per landing.
//      Launches stop at f118.
//      CAMERA: holds the frame the pull-back opened.
//   5. "returns are going down"                                    f150-f172
//      THE RETURN FALLS. The pile loses its top four coins (the third row,
//      right -> left) one every SHED_STEP frames from f150: each lets go, falls
//      SHED_FALL px and fades over SHED_FADE frames. RETURN_PEAK 12 ->
//      RETURN_AFTER_DROP 8. On one centre-outward wave f150-f172 the eight
//      threads dim THREAD_LIVE -> THREAD_IDLE and the eight surviving coins
//      cool ripe -> deep.
//      CAMERA M4: creeps back a touch, k 1.00 -> 0.94, c 700 -> 655, keys
//      f142-f162 warp 1.0, landed f168, so the row reads thin. It starts on
//      the frame after the row is level rather than at f148: the ten frames
//      between the fan landing and the shed were otherwise the only dead air
//      in the cut, and a creep that is already running when "returns" lands is
//      what the beat wants anyway.
//   6. "worth it?" and the tail                                    f181-f209
//      HOLD ON THE QUESTION. Eight companies hang a little way under the line,
//      their threads idle, eight deep-tone coins sit on D1 and the mark's own
//      dot is the only ripe thing in frame. The only motion: the hang, the
//      paper's drift, and one ambient ink packet at AMBIENT drifting DOWN an
//      idle thread every PACKET_STEP frames. Held to f209; never fades out.
//
// ambient: `breath` on every coin in flight, a HANG_AMP px hang on every card
// once it is under the line, `sway` on the camera, the kraft sheet's parallax
// and drift. Not gestures; that is what this world is.
//
// EXPORTS the next cut imports (the world itself comes from d1Shared, not from
// here — this file exports only what is its own):
//   money     COIN_SPEED, COIN_GROW, COIN_LAUNCH, COIN_ARRIVE, ReturnStack
//   camera    K_OPEN, K_PUSH, K_CREEP, K_WIDE, K_FINAL, C_*, CY_FINAL,
//             CAM_SEGS, CAM_F, CAM_K, CAM_CY
//   beats     BEATS (the word-onset table), DURATION, FPS
//   motion    flow, overshoot, EASE_LAND, EASE_YANK, AMBIENT, CLICK_*
// ---------------------------------------------------------------------------

// -- the drawing surface ----------------------------------------------------
// The world is d1Shared's; this is only how much of it the SVG spans. The
// deepest thing in the piece is the phone's tile bottom at DEPTH_DEEP (1176).
export const WORLD_W = 1080;
export const WORLD_H = 1240;

export const cardTopY = (depth: number) => cardY(depth) - CARD_SIZE / 2;

// -- eases ------------------------------------------------------------------
// One landing ease for anything that arrives.
export const LAND_BACK = 0.75;
export const EASE_LAND = Easing.out(Easing.back(LAND_BACK));
const BACK_PEAK = (4 * LAND_BACK ** 3) / (27 * (LAND_BACK + 1) ** 2); // 0.0204
// The part of that landing that sticks out past 1, normalised to peak at 1, so
// a travel can be given a fixed couple of px of settle instead of 2% of its own
// reach.
export const overshoot = (u: number) => Math.max(0, EASE_LAND(clamp01(u)) - 1) / BACK_PEAK;

// A travel curve with a flat middle: eases in over the first 28%, runs at one
// speed, eases out over the last 28%. Peak 1.39x the average against a plain
// smoothstep's 1.5x, and zero velocity at both ends.
export const FLOW_A = 0.28;
export const flow = (u: number, a: number = FLOW_A) => {
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
// The yank: an in/out ease over 8 frames — a pull, not a cut.
export const EASE_YANK = Easing.inOut(Easing.quad);

// One click-bright. Full ink for 4 frames on a single-object beat (the yank);
// the half-step for 3 on a group beat (each card of the fan landing). A card
// tile NEVER changes colour — emphasis is carried by the thread and the coins.
export const THREAD_MIN = 6; // world px; below this a thread is still inside the mark
export const CLICK_INK = 4;
export const CLICK_HALF = "#FFD98A";
export const CLICK_HALF_DUR = 3;
export const AMBIENT = 0.38; // the shared ceiling for anything subordinate

// -- gesture 1-3: the one short --------------------------------------------
export const F_DRAW0 = 0; // the thread leaves the mark
export const F_TOUCH = 10; // …and reaches the phone's top edge
export const F_DEEP = 30; // the phone is all the way down
export const F_STRAIN0 = 36; // the climb back starts, and the launches stop
export const F_STRAIN1 = 60; // …and it is at its highest, two frames before "hard"
export const F_YANK0 = 62;
export const F_YANK1 = 70;
export const PRESS_OVER = 7; // px of "a few px too deep" on the press landing
// How far the company climbs back before the yank. The camera creeps IN over
// the same window and a zoom pushes anything below the content centre downward
// on screen, so a climb smaller than this reads as sinking while it is rising.
export const STRAIN = 66;
export const BOB_AMP = 6;
export const BOB_PERIOD = 40;
export const BOB_RAMP = 14;

// -- gesture 4: the fan -----------------------------------------------------
export const FAN_F0 = 118; // every head leaves together…
export const FAN_JITTER = 0.9; // …give or take one hash frame
// One speed for every head, so the seven threads of different lengths LAND
// centre-outward: the fan opens like a hand. 42 world px/frame is 42 screen
// px/frame at the k the fan plays at (1.00) — the fastest speed inside the
// house 45 cap, and the draw wants to be over before the presses finish.
export const FAN_SPEED = 42;
export const PRESS_DUR = 9; // the 106 px press, once a head touches
export const PRESS_OVER_FAN = 5;
export const RISE0 = 118; // the phone starts coming up to join them
export const RISE1 = 136;

export const fanStart = (i: number) => FAN_F0 + hash(i, 17) * FAN_JITTER;
export const fanLen = (i: number) =>
  Math.hypot(cardX(i) - originX(i), cardTopY(DEPTH_ON) - MARK_BOTTOM);
export const fanTouch = (i: number) => fanStart(i) + fanLen(i) / FAN_SPEED;
export const cardLevel = (i: number) => (i === SUBJECT ? RISE1 : fanTouch(i) + PRESS_DUR);

// -- the hang ---------------------------------------------------------------
// A card held under the line on a thread is hanging, so it never goes dead
// still. Per-card phase, so the eight breathe as a group and not as a sheet.
export const HANG_AMP = 5;
export const HANG_PERIOD = 36;
export const HANG_RAMP = 14;
export const hang = (i: number, f: number, from: number) =>
  HANG_AMP *
  smoothstep((f - from) / HANG_RAMP) *
  Math.sin((2 * Math.PI * (f - from)) / HANG_PERIOD + hash(i, 3) * 6.28);

// -- the money --------------------------------------------------------------
// Constant speed up the thread. 28 world px/frame crosses the DEEP thread
// (621.8 px from the phone's top edge to the mark's bottom edge) in 22.2
// frames, and at the tightest camera in the piece (k 1.18) that is 33.0 screen
// px/frame — inside the house 45 cap. It is LINEAR, not `flow`: a stream whose
// spacing pumps reads as stuttering rather than as a flow.
export const COIN_SPEED = 28;
export const COIN_GROW = 5; // frames a coin scales in when it joins the pile

export const COIN_A0 = 26; // the first launch, as the press lands
export const COIN_A_STEP = 6;
export const COIN_A_STOP = 36; // …and the launches stop when the fight starts
export const COIN_B0 = 70; // they resume after the yank
// The last launch is solved BACKWARDS from its arrival: the twelfth coin is
// absorbed on f118, the frame the diversification starts. Ten launches evenly
// spaced from f70 to there is one every 2.87 frames — an 80 px gap on a 620 px
// thread, so the thread carries a continuous column of money rather than the
// four coins an 8-frame step would have paid out by f118.
export const COIN_B1 = 95.8;
export const COIN_B_N = RETURN_PEAK - 2; // 10; two were paid before the fight
export const COIN_B_STEP = (COIN_B1 - COIN_B0) / (COIN_B_N - 1);

// -- gesture 5: the shed ----------------------------------------------------
export const SHED_F0 = 150;
export const SHED_STEP = 3;
export const SHED_ORDER = [11, 10, 9, 8]; // the third row, right -> left
export const SHED_FALL = 40;
export const SHED_FADE = 10;
export const COIN_COOL0 = 156;
export const COIN_COOL_STEP = 2;
export const COIN_COOL_DUR = 12;

// -- gesture 5: the recede wave --------------------------------------------
export const cardRank = (i: number) => Math.abs(i - (N_CARDS - 1) / 2); // 0.5 … 3.5
export const cardWave = (i: number) => (cardRank(i) - 0.5) / 3; // 0 centre, 1 outer
export const WAVE_F0 = 150;
export const WAVE_SPREAD = 22; // centre to outer edge: starts run f150 … f172
export const WAVE_DUR = 8;
export const waveStart = (i: number) => WAVE_F0 + WAVE_SPREAD * cardWave(i);

// -- gesture 6: the ambient packets ----------------------------------------
export const PACKET_F0 = 174;
export const PACKET_STEP = 10;
export const PACKET_DUR = 18;
export const PACKET_R = 3.5;

// ---------------------------------------------------------------------------
// THE CAMERA. Five moves on one authored track through the shared damper, each
// framing the thing about to move: down with the phone as it is pulled under,
// a creep onto the strain, a ride down on the yank, the pull-back that opens
// the row AND the room the pile needs above the mark, and the last widening
// that makes the row read thin. Nothing pans — cx is MARK_X for the whole cut.
//
// The zoom range is narrower than V2's and the world sets it, not taste: eight
// company tiles span 800 world px (140 … 940), so at any k above 1.20 the outer
// pair crosses the house side margin, and no k below 1.65 gets them fully OFF
// frame — which the vertical band forbids, since the phone's tile bottom at
// DEPTH_DEEP and the pile's top are 819 world px apart and 819 * 1.53 already
// fills the 1250 px band. A tighter push would therefore park a cropped sliver
// of a card at the frame edge for the whole first half. So the "push in" is
// carried by the TRACK instead: c travels 640 -> 783 with the phone, which is
// ~150 screen px of camera travel, while k moves 1.04 -> 1.18.
//
// The binding frames, both solved against the house 200/1450 band:
//   k 1.18 c 783   phone's tile bottom (1176) at screen 1298, pile top at 323
//   k 0.94 c 655   row at screen x 164 … 916, ground's own ends at 89 … 991,
//                  two rows of coins topping out at screen 535
//
// Key windows end BEFORE their landing on purpose: the damper lags its target
// by ~6 frames, so keys that run to the landing frame leave the camera visibly
// moving under the word.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.04;
export const C_OPEN = 640;
export const K_PUSH = 1.13; // "shorting" — down with the pull
export const C_PUSH = 758;
export const K_CREEP = 1.18; // "really hard" — the creep and the yank
export const C_CREEP = 775;
export const C_YANK = C_CREEP + 10 / K_CREEP; // the 10 screen px ride
export const K_WIDE = 1.0; // "diversify" — the whole row opened out
export const C_WIDE = 700;
export const K_FINAL = 0.94; // "returns going down" — thinner again
export const C_FINAL = 655;
export const CY_FINAL = C_FINAL + CAM_LIFT / K_FINAL;

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
  // M0 "shorting" — travel down with the phone as it is driven under the line
  { f0: 8, f1: 28, k0: K_OPEN, k1: K_PUSH, c0: C_OPEN, c1: C_PUSH, warp: 0.72 },
  // M1 "really" — the even creep onto the phone, then dead still for "hard"
  { f0: 37, f1: 49, k0: K_PUSH, k1: K_CREEP, c0: C_PUSH, c1: C_CREEP, warp: 1.0 },
  // M2 "hard" — ride the yank down ~10 screen px and settle
  { f0: 62, f1: 70, k0: K_CREEP, k1: K_CREEP, c0: C_CREEP, c1: C_YANK, warp: 0.72 },
  // M3 "so at some point … going to" — the pull-back, ahead of the fan
  { f0: 96, f1: 110, k0: K_CREEP, k1: K_WIDE, c0: C_YANK, c1: C_WIDE, warp: 1.0 },
  // M4 "returns are going down" — a touch further out, so the row reads thin
  { f0: 142, f1: 162, k0: K_WIDE, k1: K_FINAL, c0: C_WIDE, c1: C_FINAL, warp: 1.0 },
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

// ---------------------------------------------------------------------------
// THE SUBJECT'S DEPTH, gesture by gesture. The phone is ONE object for the
// whole cut: pressed, strained, yanked, bobbed, raised to join the others.
// ---------------------------------------------------------------------------
const bobAt = (f: number) =>
  DEPTH_DEEP +
  BOB_AMP *
    interpolate(f, [F_YANK1 + 2, F_YANK1 + 2 + BOB_RAMP], [0, 1], clamp) *
    Math.sin((2 * Math.PI * (f - F_YANK1 - 2)) / BOB_PERIOD);

export const subjectDepth = (f: number): number => {
  if (f <= F_TOUCH) return DEPTH_ON;
  if (f < F_DEEP) {
    const u = clamp01((f - F_TOUCH) / (F_DEEP - F_TOUCH));
    return DEPTH_ON + (DEPTH_DEEP - DEPTH_ON) * flow(u) + PRESS_OVER * overshoot(u);
  }
  if (f < F_STRAIN0) return DEPTH_DEEP;
  if (f < F_YANK0)
    // an even climb: this is strain, not an arrival, so no landing ease
    return interpolate(f, [F_STRAIN0, F_STRAIN1], [DEPTH_DEEP, DEPTH_DEEP - STRAIN], clamp);
  if (f < F_YANK1)
    return interpolate(f, [F_YANK0, F_YANK1], [DEPTH_DEEP - STRAIN, DEPTH_DEEP], {
      ...clamp,
      easing: EASE_YANK,
    });
  if (f < RISE0) return bobAt(f);
  if (f < RISE1) {
    const u = clamp01((f - RISE0) / (RISE1 - RISE0));
    const from = bobAt(RISE0);
    return from + (DEPTH_SHALLOW - from) * flow(u) - PRESS_OVER * overshoot(u);
  }
  return DEPTH_SHALLOW + hang(SUBJECT, f, RISE1);
};

// The seven: standing on the ground until their own head touches, then a
// 9-frame press to DEPTH_SHALLOW with a few px of settle, then hanging.
export const otherDepth = (i: number, f: number): number => {
  const t = fanTouch(i);
  if (f <= t) return DEPTH_ON;
  const lvl = t + PRESS_DUR;
  if (f < lvl) {
    const u = clamp01((f - t) / PRESS_DUR);
    return DEPTH_ON + (DEPTH_SHALLOW - DEPTH_ON) * flow(u) + PRESS_OVER_FAN * overshoot(u);
  }
  return DEPTH_SHALLOW + hang(i, f, lvl);
};

export const cardDepth = (i: number, f: number) =>
  i === SUBJECT ? subjectDepth(f) : otherDepth(i, f);

// ---------------------------------------------------------------------------
// THE MONEY. Two before the fight and ten after it, every one of them launched
// from the phone's top edge WHERE IT IS at that instant and flown at one
// constant speed, so the arrivals fall out of the geometry rather than being
// keyed. The twelfth lands on f118.
// ---------------------------------------------------------------------------
export const COIN_LAUNCH: number[] = (() => {
  const L: number[] = [];
  for (let t = COIN_A0; t < COIN_A_STOP; t += COIN_A_STEP) L.push(t);
  for (let n = 0; n < COIN_B_N; n++) L.push(COIN_B0 + n * COIN_B_STEP);
  return L;
})();
export const coinFrom = (t0: number) => ({
  x: cardX(SUBJECT),
  y: cardTopY(subjectDepth(t0)),
});
export const COIN_FLIGHT: number[] = COIN_LAUNCH.map((t0) => {
  const p = coinFrom(t0);
  return Math.hypot(originX(SUBJECT) - p.x, MARK_BOTTOM - p.y) / COIN_SPEED;
});
export const COIN_ARRIVE: number[] = COIN_LAUNCH.map((t0, n) => t0 + COIN_FLIGHT[n]);

// ---------------------------------------------------------------------------
// THE RETURN STACK. Cut 3 imports this and draws the same pile from the same
// d1Shared geometry: `count` is how many coins are present, `arriving` scales
// the newest one in over COIN_GROW frames, `fill` may be one colour or a
// per-coin function, and `drop` lets a cut shed coins out of the pile.
// ---------------------------------------------------------------------------
export const ReturnStack: React.FC<{
  count: number;
  arriving?: number;
  r?: number;
  fill?: string | ((i: number) => string);
  drop?: (i: number) => { dy: number; opacity: number };
}> = ({ count, arriving = 1, r = COIN_R, fill = ACCENT, drop }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const d = drop ? drop(i) : { dy: 0, opacity: 1 };
    if (d.opacity <= 0) continue;
    const p = returnCoinPos(i);
    const s = i === count - 1 ? EASE_LAND(clamp01(arriving)) : 1;
    out.push(
      <circle
        key={i}
        cx={p.x}
        cy={p.y + d.dy}
        r={r * s}
        fill={typeof fill === "function" ? fill(i) : fill}
        opacity={d.opacity}
      />,
    );
  }
  return <>{out}</>;
};

// -- the beat table, exported so the set can be cut against one clock --------
export const BEATS = {
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
} as const;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a live return
  accentDeep: z.string(), // deep: a cooled one
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
    shorting: z.number(), // "shorting"   — the thread leaves the mark, the press
    is: z.number(), // "is"
    a: z.number(), // "a"
    really: z.number(), // "really"       — the company starts climbing back
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
    diversify: z.number(), // "diversify" — the seven-thread fan
    soTwo: z.number(), // "so"
    much: z.number(), // "much"           — the row is level under the line
    and: z.number(), // "and"
    your: z.number(), // "your"
    returns: z.number(), // "returns"     — the pile sheds, the threads dim
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
  coinRadius: COIN_R,
  cardSize: CARD_SIZE,
  markSize: MARK_SIZE,
  beats: BEATS,
});

const IsItEvenWorthItV3: React.FC<Props> = ({
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
  // 0 = a cooled return (deep), 1 = a live one (ripe). Built once per frame.
  const tone = makeTone(accentDeep, accent);
  // the mark's own dot, ticking to the half-step while it is the one pulling
  const strainTone = makeTone(accent, CLICK_HALF);

  // -- the recede wave, one window per card ---------------------------------
  const waveAt = (i: number) => smoothstep((frame - waveStart(i)) / WAVE_DUR);

  // -- the eight companies, standing or hanging -----------------------------
  const cards = [];
  for (let i = 0; i < N_CARDS; i++) {
    const depth = cardDepth(i, frame);
    cards.push({
      i,
      x: cardX(i),
      y: cardY(depth),
      top: cardTopY(depth),
    });
  }

  // -- the money in flight, and the pile it builds --------------------------
  const coins = [];
  for (let n = 0; n < COIN_LAUNCH.length; n++) {
    const t0 = COIN_LAUNCH[n];
    if (frame < t0 || frame >= COIN_ARRIVE[n]) continue;
    const u = (frame - t0) / COIN_FLIGHT[n];
    const p = coinFrom(t0);
    coins.push({
      key: n,
      x: lerp(p.x, originX(SUBJECT), u),
      y: lerp(p.y, MARK_BOTTOM, u),
      r: coinRadius * breath(frame, hash(n, 9)),
    });
  }

  let arrived = 0;
  for (let n = 0; n < COIN_ARRIVE.length; n++) if (frame >= COIN_ARRIVE[n]) arrived = n + 1;
  const arriving = arrived > 0 ? clamp01((frame - COIN_ARRIVE[arrived - 1]) / COIN_GROW) : 1;

  // the shed, and the cool-down of the eight that stay
  const shedAt = (i: number) => {
    const rankInShed = SHED_ORDER.indexOf(i);
    if (rankInShed < 0) return { dy: 0, opacity: 1 };
    const t = frame - (SHED_F0 + SHED_STEP * rankInShed);
    if (t <= 0) return { dy: 0, opacity: 1 };
    const u = clamp01(t / SHED_FADE);
    return { dy: SHED_FALL * u * u, opacity: 1 - u };
  };
  const coinFill = (i: number) =>
    tone(1 - clamp01((frame - (COIN_COOL0 + COIN_COOL_STEP * i)) / COIN_COOL_DUR));

  // -- the threads ----------------------------------------------------------
  // The strain pulse: the one thread goes taut while the company climbs back.
  const taut = interpolate(
    frame,
    [beats.really, beats.really + 9, F_YANK0 - 2, F_YANK0],
    [0, 1, 1, 0],
    clamp,
  );
  // the press "click": the thread going to a full 1.0 as the phone lands deep
  const pressLit = interpolate(
    frame,
    [F_DEEP - 4, F_DEEP, F_DEEP + CLICK_INK, F_DEEP + CLICK_INK + 6],
    [0, 1, 1, 0],
    clamp,
  );

  const threads = [];
  for (let i = 0; i < N_CARDS; i++) {
    const subject = i === SUBJECT;
    const start = subject ? F_DRAW0 : fanStart(i);
    const arrive = subject ? F_TOUCH : fanTouch(i);
    if (frame < start) continue;
    const c = cards[i];
    const drawing = frame < arrive;
    const u = drawing ? clamp01((frame - start) / (arrive - start)) : 1;
    const ox = originX(i);
    // Head-led: the head runs from the mark's bottom edge to the card's top
    // edge WHERE IT STANDS, and the moment it touches, the press begins.
    const tx = cardX(i);
    const tyEnd = cardTopY(DEPTH_ON);
    const ex = drawing ? lerp(ox, tx, u) : c.x;
    const ey = drawing ? lerp(MARK_BOTTOM, tyEnd, u) : c.top;
    // A round-capped line of no length still draws its cap, so on the very
    // first frame of a draw the thread would be a dot sitting on the mark's
    // bottom edge. f0 is the world AT REST — no threads, no coins — so a head
    // that has not cleared the mark yet is not drawn at all.
    if (Math.hypot(ex - ox, ey - MARK_BOTTOM) < THREAD_MIN) continue;
    const w = waveAt(i);
    let op = THREAD_LIVE + (THREAD_IDLE - THREAD_LIVE) * w;
    let stroke = accent;
    if (subject) {
      // the strain pulse, and the press "click" — the thread going to a full 1.0
      op += (1 - THREAD_LIVE) * Math.max(taut, pressLit) * (1 - w);
      // single-object beat: full ink for four frames on the yank
      if (frame >= F_YANK0 && frame < F_YANK0 + CLICK_INK) stroke = ink;
    }
    // group beat: the half-step for three frames as each card comes to rest
    // under the line. The phone's own landing is the top of its RISE — the
    // first gesture's press has no colour click in it by design.
    const lvl = cardLevel(i);
    if (frame >= lvl && frame < lvl + CLICK_HALF_DUR) stroke = CLICK_HALF;
    threads.push({ i, ox, ex, ey, op, stroke, drawing });
  }

  // -- one packet at a time, drifting DOWN an idle thread -------------------
  const packets = [];
  for (let n = 0; ; n++) {
    const t0 = PACKET_F0 + n * PACKET_STEP;
    if (t0 > frame) break;
    if (frame >= t0 + PACKET_DUR) continue;
    const i = Math.floor(hash(n, 5) * N_CARDS);
    if (waveStart(i) + WAVE_DUR + 2 > t0) continue; // only a thread the wave has passed
    const c = cards[i];
    const u = (frame - t0) / PACKET_DUR;
    packets.push({
      key: n,
      x: lerp(originX(i), c.x, u),
      y: lerp(MARK_BOTTOM, c.top, u),
    });
  }

  // -- camera ---------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = MARK_X + drift.dx;
  const k = cam.k;
  const { tx: wx, ty: wy } = worldTransform(cx, cy, k);
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
            transform: `translate(${wx}px, ${wy}px) scale(${k})`,
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
                <g key={t.i}>
                  <line
                    x1={t.ox}
                    y1={MARK_BOTTOM}
                    x2={t.ex}
                    y2={t.ey}
                    stroke={t.stroke}
                    strokeWidth={THREAD_W}
                    strokeLinecap="round"
                    opacity={t.op}
                  />
                  {/* the head pin, on the FIRST thread only: seven white pins
                      travelling through empty paper read as a spider, and the
                      fan does not need pointing out twice */}
                  {t.drawing && t.i === SUBJECT ? (
                    <circle cx={t.ex} cy={t.ey} r={4} fill={ink} opacity={t.op} />
                  ) : null}
                </g>
              ))}
            </g>

            {/* the ambient traffic, at the shared ceiling */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PACKET_R} fill={ink} opacity={AMBIENT} />
            ))}

            {/* the eight companies */}
            {cards.map((c) => (
              <CompanyCard
                key={c.i}
                x={c.x}
                y={c.y}
                sector={SECTOR_SET[c.i]}
                size={cardSize}
                k={k}
                opacity={OP_READ}
              />
            ))}

            {/* the money on its way up the thread */}
            {coins.map((c) => (
              <circle key={c.key} cx={c.x} cy={c.y} r={c.r} fill={accent} />
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

            {/* the return, piled on top of it. No per-icon shadow: a coin is a
                dot, and dots take the global shadow only. */}
            <ReturnStack
              count={arrived}
              arriving={arriving}
              r={coinRadius}
              fill={coinFill}
              drop={shedAt}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default IsItEvenWorthItV3;

// RETURN_AFTER_DROP is the count this cut resolves on and cut 3 opens from; it
// is asserted here so a change to the shed schedule cannot silently break the
// handoff.
if (RETURN_PEAK - SHED_ORDER.length !== RETURN_AFTER_DROP) {
  throw new Error(
    `IsItEvenWorthItV3: the shed leaves ${RETURN_PEAK - SHED_ORDER.length} coins, not RETURN_AFTER_DROP (${RETURN_AFTER_DROP})`,
  );
}
