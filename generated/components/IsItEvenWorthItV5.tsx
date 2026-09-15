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
  Coin,
  CompanyCard,
  D1Mark,
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
  PriceLine,
  RETURN_AFTER_DROP,
  RETURN_PEAK,
  SECTOR_SET,
  SUBJECT,
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  V4,
  cardX,
  originX,
  priceTip,
  returnCoinPosV4,
} from "./d1Shared";

// The set's two pile counts are d1Shared's, and cut 3 reads them off THIS cut
// (it is cut 2 that makes the return and then shows it shrinking), so they are
// re-exported here rather than restated.
export { RETURN_AFTER_DROP, RETURN_PEAK };

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
// "Is it even worth it?" V5 — Orange Dwarkesh on kraft, opaque cutaway, 24fps,
// 1080x1920.
//
// V4's MOTION IS APPROVED AND UNCHANGED: one continuous tug-of-war on one price
// that spreads to the rest of the row and thins out; the words are inflections
// in that pull, never separate events. Same DURATION (209), same beat table,
// same five phases, same camera keys, warps and landing frames, same helpers
// and the same exports contract. V5 changes four things and nothing else:
//
//   1. SIX COMPANIES, not eight (user on V4: "slightly overwhelming, cut maybe
//      2 of the blocks"). Nothing is counted by hand: the fan's rank spread,
//      the recede wave, the shed, RESOLVED_DROPS and every coin count derive
//      from d1Shared's N_CARDS. The five others still fan inside the same
//      f118-f142 window — the wave just breathes a little more per card — and
//      still take DROP_SHALLOW (60), which is exactly one coin each.
//   2. MONEY THAT READS AS MONEY, MINTED BY THE FALL. Every coin in the cut is
//      d1Shared's <Coin> (a radial-lit amber disc with a "$" knocked out, r
//      V4.COIN_R_V5) — in flight, on the pile and shedding. And no coin is ever
//      spawned already flying: on a new low it APPEARS ON THE TIP and scales in
//      over COIN_MINT frames while the tip is still falling, riding the falling
//      leg down, and only then climbs the thread at COIN_SPEED. That is true of
//      the four press coins, the eight grind coins and the five fan coins.
//   3. DEPTH, from d1Shared: the lit sheet, gradient tiles, contact shadows,
//      the longer tile shadow, and the FALLEN LEG IN AMBER — a price line whose
//      tip is held draws its last segment in the accent, so the drop itself is
//      the money — plus <Vignette strength={0.55} />. No glow, no bevel, no
//      blend mode; threads and price lines stay flat lines.
//   4. A TIGHTER CLOSE LADDER. K_CREEP was clamped at 1.18 by the eight-card
//      row; six cards span 600 world px (204 … 876), so the same keys, warps and
//      landing frames now carry k 1.32 without touching the 60/1020 guide. M0's
//      1.04/1.13 are scaled by the same 1.118 (1.16 / 1.26) so the three close
//      moves keep the sizes they were approved at — M0 a push, M1 a creep about
//      a third of it. The WIDE is untouched (K_WIDE 1.00, K_FINAL 0.96): its job
//      is to make the row read thin, and cut 3 opens on it.
//
// WORD ONSETS (frames from the composition start, = 26.600s)
//   f0 shorting · f13 is · f23 a · f43 really · f62 hard · f66 thing · f70 to ·
//   f72 do · f76 so · f83 at · f86 some · f91 point · f100 it's · f105 like ·
//   f108 okay · f114 if · f117 you're · f119 going · f120 to · f120 diversify ·
//   f131 so · f137 much · f145 and · f151 your · f153 returns · f158 are ·
//   f161 going · f162 down · f171 like · f174 is · f178 it · f180 even ·
//   f181 worth · f187 it? (ends f193) · tail to f209.
//
// THE MOTION, in five phases of one continuous tug-of-war. Every tip that has
// started moving keeps moving until its final state; every hold carries the
// motion that is still going.
//
//   1. GRAB AND DRAG                                              f0 -> f30
//      f0 is the world at rest: the mark, the ground, six companies standing on
//      it, six untouched price lines idling, no threads, no coins. ONE thread
//      grows head-led from originX(SUBJECT) on the mark's bottom edge to the
//      phone's tip f0-f10 (the tip turns accent the moment it is held, and its
//      last leg goes with it), and then drags that tip from 0 to V4.DROP_DEEP
//      by f30 on the press profile (`flow` + PRESS_OVER px of `back(0.75)`
//      settle). The chart's last leg falls: that is the short, and it reads
//      without narration. A coin is MINTED ON THE TIP on each 1/V4.COIN_PER_PX
//      = 36 px of NEW LOW — four of them, f16-f27 — each scaling in on the
//      falling leg over COIN_MINT frames and then climbing the thread at
//      COIN_SPEED onto D1, where the pile starts.
//      CAMERA M0: opens k 1.16 on mark + row and pushes to 1.26 travelling down
//      with the tip, keys f6-f34 warp 0.72, flowing straight into M1.
//
//   2. THE FIGHT                                                 f30 -> f70
//      The tip never rests. From f34 it strains UPWARD against the thread — an
//      even 60 px climb to f60 on `flow`, the price fighting back — and the
//      minting STOPS, because a rise is not a new low; the coins already minted
//      still climb and arrive, so the money visibly dries up. The thread stays
//      straight and taut and pulses once to 1.0, and the mark's own dot ticks to
//      the half-step: D1 is the one pulling.
//      At f62 ("hard") THE YANK: the thread pulls the tip back down to
//      V4.DROP_DEEP over 8 frames on Easing.inOut(Easing.quad) — the one ink
//      click in this cut, on the thread, 4 frames. It returns to the OLD low, so
//      it mints nothing.
//      CAMERA M1: even creep k 1.26 -> 1.32, keys f35-f50 warp 1.0, settled f56,
//      then an authored HELD BREATH f56-f61 (dead still). CAMERA M2 rides the
//      drop ~10 screen px, keys f62-f70, and keeps moving into phase 3.
//
//   3. A HOLD THAT ISN'T A HOLD                                 f70 -> f118
//      The fight goes on. The tip is ground down the last GRIND px to its floor
//      (V4.TIP_MIN) over f70-f100 — a continuous new low the whole way, so the
//      money runs again as an even column, eight coins minted f76-f94 — and then
//      the price fights back up to the old low by f118, where the minting stops
//      again. The pile is exactly RETURN_PEAK (12, three rows) before the
//      diversification starts: the return is made first, which is the argument.
//      CAMERA M3: one long even pull-back k 1.32 -> 1.00, cx 540 throughout,
//      keys f88-f110, landed f116 — the row, the mark and the pile all framed.
//
//   4. THE PULL SPREADS THIN                                   f118 -> f140
//      Five more threads grow from the mark in ONE centre-outward wave (from
//      f118, nearest first, FAN_SPREAD frames from the nearest head to the
//      outermost), each attaching to its own tip and dragging it only to
//      V4.DROP_SHALLOW — 60 px, which crosses exactly one 36 px new low and so
//      mints exactly one coin each, on the tip, as it falls. Meanwhile the
//      phone's tip eases UP from its floor to the same DROP_SHALLOW on `flow`
//      f118-f138 and mints nothing: the same object, never swapped. All six
//      level by f140 — six little drops instead of one big one.
//      CAMERA: holds the wide on `sway` while the fan runs, then a creep
//      k 1.00 -> 0.96, keys f130-f146, so the row reads thin.
//
//   5. THE PILE THINS                                          f150 -> f186
//      The five fan coins are still arriving f146-f157 and the pile tops out at
//      RETURN_FAN_PEAK (17). From f162 it sheds from the top,
//      right -> left, one coin every SHED_STEP frames, each letting go, falling
//      SHED_FALL px and fading over SHED_FADE — down to RETURN_AFTER_DROP (8).
//      On one centre-outward wave f150-f172 the six threads dim THREAD_LIVE ->
//      THREAD_IDLE and the eight surviving coins cool ripe -> deep (a
//      cross-dissolve between the two <Coin> tones, no blend mode). Every tip
//      goes on straining ±STRAIN_AMP px against its thread.
//
//   TAIL                                                       f181 -> f209
//      Six companies each pulled a little, their charts each bent down a little
//      with the fallen leg in amber, idle threads, eight deep-tone coins on D1,
//      the tips still straining, and one ambient ink packet at AMBIENT drifting
//      DOWN an idle thread every PACKET_STEP frames. Held to f209; never fades.
//
// ambient (not gestures — this is what the world is): an untouched price idles
// IDLE_AMP px, `breath` on every coin in flight, `sway` on the camera, the kraft
// sheet's parallax and drift.
//
// DEVIATIONS from the brief, and why:
//   * The phase-3 grind pays 8 coins over GRIND (8) px of remaining new low
//     rather than V4.COIN_PER_PX's 36 px per coin — inherited from V4, where the
//     pile is fixed at 12 by f118 and the yank has already returned the tip to
//     DROP_DEEP. The rule's DIRECTION is kept exactly: a coin is only ever
//     minted on a new low, never on a rise.
//   * COIN_C1 is 94, not V4's 99. The schedule is otherwise identical — the same
//     eight mints evenly spaced from the same COIN_C0 — but minting now costs
//     COIN_MINT frames before the climb starts, and at 99 the last grind coin
//     would be absorbed on f119.5, after f118, leaving the pile at 11 when the
//     fan starts. At 94 it is absorbed on f114.7 and the whole mint still
//     happens while the tip is falling (the floor is f100).
//   * The shed opens on f162, not V4's f156, and is DERIVED rather than typed:
//     a coin cannot fall off the top of the pile before it has finished landing
//     on it, and minting costs COIN_MINT frames before the climb, so the
//     outermost card's coin is not absorbed until f156.7. SHED_F0 is that
//     arrival plus COIN_GROW. At the same SHED_STEP 1.8 the last coin lets go
//     on f176.4 and is gone by f186.4 — earlier than V4's f184 — so the pile
//     stops growing on "your returns", holds one beat, and thins across
//     "down … like, is it even worth it".
//
// EXPORTS the other two cuts import (the world itself comes from d1Shared):
//   money     COIN_SPEED (defined here), COIN_GROW, COIN_MINT, COINS,
//             ReturnStack, RETURN_PEAK, RETURN_FAN_PEAK, RETURN_AFTER_DROP
//   camera    K_OPEN, K_PUSH, K_CREEP, K_WIDE, K_FINAL, C_*, CY_FINAL,
//             CAM_SEGS, CAM_F, CAM_K, CAM_CY
//   state     RESOLVED_DROPS (the exact drop each card ends on), RESOLVED_DROP
//   beats     BEATS, DURATION, FPS
//   motion    flow, overshoot, EASE_LAND, EASE_YANK, AMBIENT, dropAt, dragDrop
// ---------------------------------------------------------------------------

// -- the drawing surface ----------------------------------------------------
// The world is d1Shared's V4 world; this is only how much of it the SVG spans.
// The deepest thing in the piece is the ground / card bottoms at V4.GROUND_Y.
export const WORLD_W = 1080;
export const WORLD_H = 1040;

// -- eases ------------------------------------------------------------------
// One landing ease for anything that arrives.
export const LAND_BACK = 0.75;
export const EASE_LAND = Easing.out(Easing.back(LAND_BACK));

// THE SETTLE. A travel is given a fixed couple of px of "a few px too far and
// back" instead of a percentage of its own reach, so a 150 px drag and a 60 px
// one settle by the same amount. V3 took that bump off `Easing.out(back)` as
// max(0, ease - 1): that max() is a KINK — the velocity steps from 0 to the
// bump's onset slope the instant the ease crosses 1, which measured as a real
// 21% velocity discontinuity on the press in the per-frame scan. This is the
// same bump written as sin^2 over the last (1 - SETTLE_FROM) of the move: 0 at
// both ends, peak 1 at u = 0.775, and zero slope at both ends, so it adds a
// settle without adding a step anywhere.
export const SETTLE_FROM = 0.55;
export const overshoot = (u: number) => {
  const b = clamp01((clamp01(u) - SETTLE_FROM) / (1 - SETTLE_FROM));
  const s = Math.sin(Math.PI * b);
  return s * s;
};

// A travel curve with a flat middle: eases in over the first 28%, runs at one
// speed, eases out over the last 28%. Peak 1.39x the average against a plain
// smoothstep's 1.5x, and zero velocity at both ends — which is what keeps the
// per-frame velocity scan free of steps at every join in the piece.
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

export const THREAD_MIN = 6; // world px; below this a thread is still inside the mark
export const CLICK_INK = 4; // the one single-object ink click, on the yank
export const HALF_STEP = "#FFD98A"; // the mark's dot while it is straining
export const AMBIENT = 0.38; // the shared ceiling for anything subordinate

// -- phase 1: the grab ------------------------------------------------------
export const F_DRAW0 = 0; // the thread leaves the mark
export const F_TOUCH = 10; // …and reaches the phone's tip
export const F_DEEP = 30; // the tip is all the way down
export const PRESS_OVER = 7; // px of "a few px too far" on the press landing

// -- phase 2: the fight -----------------------------------------------------
export const F_CLIMB0 = 34; // the price starts fighting back up
export const F_CLIMB1 = 60; // …and is at its highest, two frames before "hard"
export const CLIMB = 60; // px it wins back
export const F_YANK0 = 62;
export const F_YANK1 = 70;

// -- phase 3: the grind -----------------------------------------------------
// After the yank the tip has exactly this much room left above its floor.
export const GRIND = V4.PRICE_H - V4.TIP_MIN - V4.DROP_DEEP; // 8
export const F_GRIND0 = 70;
export const F_GRIND1 = 100; // the floor, and the last new low
export const F_BACKUP1 = 118; // …then the price fights back to the old low

// -- phase 4: the fan and the rise -----------------------------------------
export const F_RISE0 = 118;
export const F_RISE1 = 138;
export const FAN_F0 = 118; // the nearest head leaves…
// …and the outermost head leaves this much later. A SPREAD, not a per-rank
// step, so six cards open the hand over the same frames eight did.
export const FAN_SPREAD = 1.8;
// One speed for every head, so the seven threads of different lengths LAND
// centre-outward: the fan opens like a hand. 43 world px/frame is 43 screen
// px/frame at the k the fan plays at (1.00) — inside the house 45 cap.
export const FAN_SPEED = 43;
export const PRESS_DUR = 12; // the DROP_SHALLOW press, once a head touches
export const PRESS_OVER_FAN = 5;

// Ranks run 0.5 (the two inner cards) to RANK_MAX + 0.5 (the outer pair), so
// `cardWave` is 0 at the centre and 1 at the outer edge for ANY N_CARDS: with
// six cards the same authored windows simply breathe a little more per card.
export const cardRank = (i: number) => Math.abs(i - (N_CARDS - 1) / 2); // 0.5 … 2.5
export const RANK_MAX = (N_CARDS - 1) / 2 - 0.5; // 2
export const cardWave = (i: number) => (cardRank(i) - 0.5) / RANK_MAX; // 0 centre, 1 outer
export const fanStart = (i: number) => FAN_F0 + FAN_SPREAD * cardWave(i);
export const fanLen = (i: number) => {
  const t = priceTip(i, 0);
  return Math.hypot(t.x - originX(i), t.y - MARK_BOTTOM);
};
export const fanTouch = (i: number) => fanStart(i) + fanLen(i) / FAN_SPEED;
export const cardLevel = (i: number) => (i === SUBJECT ? F_RISE1 : fanTouch(i) + PRESS_DUR);

// -- the strain and the idle ------------------------------------------------
// A tip with a thread on it is being held against its will, so it never goes
// dead still: it strains UPWARD (never a new low, so it can never pay a coin it
// has not earned) on a per-card phase, so the six breathe as a group and not
// as a sheet. An untouched price idles both ways — it is a live market.
export const STRAIN_AMP = 3;
export const STRAIN_PERIOD = 33;
export const STRAIN_RAMP = 16;
export const IDLE_AMP = 2;
export const IDLE_PERIOD = 41;
export const ATTACH_FADE = 6; // frames the idle takes to hand over to the thread

export const idleDrop = (i: number, f: number) =>
  IDLE_AMP * 0.5 * (1 - Math.cos((2 * Math.PI * f) / IDLE_PERIOD + hash(i, 11) * 6.28));
export const strainDrop = (i: number, f: number, from: number) =>
  -STRAIN_AMP *
  smoothstep((f - from) / STRAIN_RAMP) *
  0.5 *
  (1 - Math.cos((2 * Math.PI * (f - from)) / STRAIN_PERIOD + hash(i, 3) * 6.28));

// -- the money --------------------------------------------------------------
// Constant speed up the thread, defined HERE and imported by the other two
// cuts. 26 world px/frame crosses the deep thread (384 px from the phone's tip
// to the mark's bottom edge) in 14.8 frames, and at the tightest camera in the
// piece (k 1.30) that is 33.8 screen px/frame — inside the house 45 cap. It is
// LINEAR, not `flow`: a stream whose spacing pumps reads as stuttering rather
// than as a flow.
export const COIN_SPEED = 26;
export const COIN_GROW = 5; // frames a coin scales in when it joins the pile
// V5: a coin is MINTED WHERE THE PRICE FALLS. On a new low it appears ON the
// tip and scales in over these frames while the tip is still going down — it
// rides the falling leg — and only then does it start climbing. Nothing is ever
// spawned already in flight, so the money visibly comes out of the drop.
export const COIN_MINT = 5;
export const COIN_C1 = 94; // the grind's last mint — climbing f99, absorbed f114.7, before f118

// -- phase 5: the recede wave ----------------------------------------------
export const WAVE_F0 = 150;
export const WAVE_SPREAD = 22; // centre to outer edge: starts run f150 … f172
export const WAVE_DUR = 8;
export const waveStart = (i: number) => WAVE_F0 + WAVE_SPREAD * cardWave(i);

// -- the tail: ambient packets ---------------------------------------------
export const PACKET_F0 = 181;
export const PACKET_STEP = 10;
export const PACKET_DUR = 18;
export const PACKET_R = 3.5;

// ---------------------------------------------------------------------------
// THE CAMERA. Five moves on one authored track through the shared damper, each
// framing the thing about to move, and no two of them separated by a parked
// wide: down with the tip as it is dragged under, a creep onto the strain, a
// ride down on the yank, the long pull-back that opens the row AND the room the
// pile needs above the mark, and the last widening that makes the row read
// thin. Nothing pans — cx is MARK_X for the whole cut.
//
// The binding frames, both solved against the house 200/1450 band:
//   k 1.32 c 737.6  the ground (960) at screen 1129, the pile's top at 264,
//                   the row's own edges at screen x 97 … 983
//   k 0.96 c 645    the row at screen x 217 … 863, the pile's top at 462,
//                   the ground at 1137
//
// Key windows end BEFORE their landing on purpose: the damper lags its target
// by ~6 frames, so keys that run to the landing frame leave the camera visibly
// moving under the word.
// ---------------------------------------------------------------------------
// V5: the whole CLOSE ladder is one 12% tighter, not just its last rung. Only
// K_CREEP was named in the revision, but M0 and M1 are moves whose SIZE is part
// of the approved motion (M0 a push, M1 an even creep of about a third of it),
// and raising the creep's landing alone would have quadrupled M1's zoom delta.
// Every key frame, warp and landing frame is V4's; the three close k values are
// V4's × 1.118, which is exactly the room six cards give back.
export const K_OPEN = 1.16; // was 1.04
export const C_OPEN = 668; // mark top 376 … ground 960, centred
export const K_PUSH = 1.26; // "shorting" — down with the drag (was 1.13)
export const C_PUSH = 740;
// V5: eight cards spanned 800 world px and any k over 1.20 pushed the outer
// chart past the 60/1020 side guide, which is what held this at 1.18. Six span
// 600 (204 … 876), so the same creep, on the same keys and the same landing
// frames, now carries 1.32 — the tightest frame in the cut, and the row's own
// edges still land at screen x 97 … 983.
export const K_CREEP = 1.32; // "really hard" — the creep, the breath and the yank
export const C_CREEP = 730;
export const C_YANK = C_CREEP + 10 / K_CREEP; // the 10 screen px ride
export const K_WIDE = 1.0; // the pull-back: the row, the mark and the pile
export const C_WIDE = 640;
export const K_FINAL = 0.96; // "returns are going down" — thinner again
export const C_FINAL = 645;
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
  // M0 "shorting" — travel down with the tip as it is dragged
  { f0: 6, f1: 34, k0: K_OPEN, k1: K_PUSH, c0: C_OPEN, c1: C_PUSH, warp: 0.72 },
  // M1 "really" — the even creep onto the fight, then dead still for "hard"
  { f0: 35, f1: 50, k0: K_PUSH, k1: K_CREEP, c0: C_PUSH, c1: C_CREEP, warp: 1.0 },
  // M2 "hard" — ride the yank down ~10 screen px and keep moving
  { f0: 62, f1: 70, k0: K_CREEP, k1: K_CREEP, c0: C_CREEP, c1: C_YANK, warp: 0.72 },
  // M3 "so at some point … going to" — the long pull-back, ahead of the fan
  { f0: 88, f1: 110, k0: K_CREEP, k1: K_WIDE, c0: C_YANK, c1: C_WIDE, warp: 1.0 },
  // M4 "so much / your returns" — a touch further out, so the row reads thin
  { f0: 130, f1: 146, k0: K_WIDE, k1: K_FINAL, c0: C_WIDE, c1: C_FINAL, warp: 1.0 },
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
// THE SUBJECT'S DROP, phase by phase. The phone's tip is ONE object for the
// whole cut: grabbed, dragged, strained, yanked, ground down, and finally eased
// up to join the other five. Every join has zero velocity on both sides, so
// the per-frame velocity scan is continuous everywhere — including the yank,
// which is fast but is still an in/out ease.
// ---------------------------------------------------------------------------
export const subjectDrop = (f: number): number => {
  if (f <= F_TOUCH) return 0;
  if (f < F_DEEP) {
    const u = clamp01((f - F_TOUCH) / (F_DEEP - F_TOUCH));
    return V4.DROP_DEEP * flow(u) + PRESS_OVER * overshoot(u);
  }
  if (f < F_CLIMB0) return V4.DROP_DEEP;
  if (f < F_YANK0) {
    const u = clamp01((f - F_CLIMB0) / (F_CLIMB1 - F_CLIMB0));
    return V4.DROP_DEEP - CLIMB * flow(u);
  }
  if (f < F_YANK1)
    return interpolate(f, [F_YANK0, F_YANK1], [V4.DROP_DEEP - CLIMB, V4.DROP_DEEP], {
      ...clamp,
      easing: EASE_YANK,
    });
  if (f < F_RISE0) {
    // the grind to the floor, then the price fighting back to the old low
    const s =
      f < F_GRIND1
        ? smoothstep((f - F_GRIND0) / (F_GRIND1 - F_GRIND0))
        : 1 - smoothstep((f - F_GRIND1) / (F_BACKUP1 - F_GRIND1));
    return V4.DROP_DEEP + GRIND * s;
  }
  const u = clamp01((f - F_RISE0) / (F_RISE1 - F_RISE0));
  return V4.DROP_DEEP + (V4.DROP_SHALLOW - V4.DROP_DEEP) * flow(u);
};

// The five: untouched until their own head touches, then a 12-frame press to
// DROP_SHALLOW with a few px of settle.
export const otherDrop = (i: number, f: number): number => {
  const t = fanTouch(i);
  if (f <= t) return 0;
  const u = clamp01((f - t) / PRESS_DUR);
  if (u < 1) return V4.DROP_SHALLOW * flow(u) + PRESS_OVER_FAN * overshoot(u);
  return V4.DROP_SHALLOW;
};

// The authored drag, with no breathing on it: this is the track the money is
// paid against.
export const dragDrop = (i: number, f: number) => (i === SUBJECT ? subjectDrop(f) : otherDrop(i, f));

export const attached = (i: number, f: number) =>
  smoothstep((f - (i === SUBJECT ? F_TOUCH : fanTouch(i))) / ATTACH_FADE);

// What is actually drawn: the drag, plus the market's own idle while nothing
// holds the tip, plus the upward strain once the thread has it at rest.
export const dropAt = (i: number, f: number): number =>
  dragDrop(i, f) +
  idleDrop(i, f) * (1 - attached(i, f)) +
  strainDrop(i, f, cardLevel(i));

export const tipAt = (i: number, f: number) => priceTip(i, dropAt(i, f));

// The state the next cut opens on.
export const RESOLVED_DROP = V4.DROP_SHALLOW;
export const RESOLVED_DROPS: number[] = Array.from({ length: N_CARDS }, (_, i) =>
  dragDrop(i, DURATION - 1),
);

// ---------------------------------------------------------------------------
// THE MONEY. Every coin is launched from the tip WHERE IT IS at that instant
// and flown at one constant speed, so the arrivals fall out of the geometry
// rather than being keyed.
//   phase 1  one per 36 px of new low on the press — four, solved off the curve
//   phase 2  none: a rise is not a new low
//   phase 3  eight, evenly across the grind, every frame of which is a new low
//   phase 4  one per company, on the frame its press crosses 36 px
// ---------------------------------------------------------------------------
const crossing = (target: number, f0: number, f1: number, fn: (f: number) => number) => {
  for (let f = f0; f <= f1; f += 0.05) if (fn(f) >= target) return Number(f.toFixed(2));
  return f1;
};

export const PRESS_COINS = Math.floor(V4.DROP_DEEP * V4.COIN_PER_PX); // 4
export const COIN_C_N = RETURN_PEAK - PRESS_COINS; // 8

// The press settles a fraction past DROP_DEEP and eases back, so THAT is the
// low the grind has to beat before it may pay anything. Derived, not typed, so
// a change to PRESS_OVER or the settle cannot quietly pay a coin on a frame
// that is not a new low.
export const PRESS_LOW = (() => {
  let m = 0;
  for (let f = F_TOUCH; f <= F_CLIMB0; f += 0.05) m = Math.max(m, subjectDrop(f));
  return m;
})();
export const COIN_C0 = crossing(PRESS_LOW + 0.05, F_GRIND0, F_GRIND1, subjectDrop);
export const COIN_C_STEP = (COIN_C1 - COIN_C0) / (COIN_C_N - 1);

// m0 the frame it is minted on the tip · t0 the frame it leaves (m0 + COIN_MINT)
// · t1 the frame it is absorbed at the mark · (x0, y0) where the tip had fallen
// to by t0, which is where the climb starts.
export type CoinFlight = {
  i: number;
  m0: number;
  t0: number;
  t1: number;
  flight: number;
  x0: number;
  y0: number;
};

export const COINS: CoinFlight[] = (() => {
  const L: { i: number; t: number }[] = [];
  for (let n = 1; n <= PRESS_COINS; n++)
    L.push({ i: SUBJECT, t: crossing(n / V4.COIN_PER_PX, F_TOUCH, F_DEEP + 4, subjectDrop) });
  for (let n = 0; n < COIN_C_N; n++) L.push({ i: SUBJECT, t: COIN_C0 + n * COIN_C_STEP });
  // The five pay on the real quantum: DROP_SHALLOW is 60 px, so each press
  // crosses one 36 px new low on its way down and pays exactly one coin
  // (floor(60/36) = 1), launched on the frame it crosses.
  for (let i = 0; i < N_CARDS; i++)
    if (i !== SUBJECT)
      L.push({
        i,
        t: crossing(1 / V4.COIN_PER_PX, fanTouch(i), fanTouch(i) + PRESS_DUR + 2, (f) =>
          otherDrop(i, f),
        ),
      });
  return L.map(({ i, t }) => {
    // It is minted on the tip at `t` and climbs from where that tip has fallen
    // to COIN_MINT frames later, so the flight is measured from there.
    const t0 = t + COIN_MINT;
    const p = tipAt(i, t0);
    const d = Math.hypot(originX(i) - p.x, MARK_BOTTOM - p.y);
    const flight = d / COIN_SPEED;
    return { i, m0: t, t0, t1: t0 + flight, flight, x0: p.x, y0: p.y };
  }).sort((a, b) => a.t1 - b.t1);
})();

export const coinsAt = (f: number) => COINS.filter((c) => f >= c.t1).length;

// -- phase 5: the shed ------------------------------------------------------
export const RETURN_FAN_PEAK = RETURN_PEAK + (N_CARDS - 1); // 12 + 5 = 17
// The pile cannot shed a coin that has not finished landing on it, so the shed
// opens COIN_GROW frames after the LAST fan coin is absorbed rather than on a
// typed frame. In V4 that was f156; minting costs COIN_MINT frames before the
// climb, and the outermost card's coin now arrives on f156.7, so this resolves
// to f162 — the pile stops growing on "your returns", holds one beat, and
// thins across "down … like, is it even worth it".
export const SHED_F0 = Math.ceil(COINS[RETURN_FAN_PEAK - 1].t1 + COIN_GROW);
export const SHED_STEP = 1.8;
export const SHED_N = RETURN_FAN_PEAK - RETURN_AFTER_DROP; // 17 - 8 = 9
// The top of the pile, right -> left, row by row down.
export const SHED_ORDER = Array.from({ length: SHED_N }, (_, n) => RETURN_FAN_PEAK - 1 - n);
export const SHED_FALL = 40;
export const SHED_FADE = 10;
export const COIN_COOL0 = 158;
export const COIN_COOL_STEP = 1.5;
export const COIN_COOL_DUR = 12;

// ---------------------------------------------------------------------------
// THE RETURN STACK. Cut 3 imports this and draws the same pile from the same
// d1Shared V4 geometry: `count` is how many coins are present, `arriving` scales
// the newest one in over COIN_GROW frames, `fill` may be one colour or a
// per-coin function, and `drop` lets a cut shed coins out of the pile.
// ---------------------------------------------------------------------------
export const ReturnStack: React.FC<{
  count: number;
  arriving?: number;
  r?: number;
  ripe?: (i: number) => number; // 1 = a live return, 0 = a cooled one
  drop?: (i: number) => { dy: number; opacity: number };
}> = ({ count, arriving = 1, r = V4.COIN_R_V5, ripe, drop }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const d = drop ? drop(i) : { dy: 0, opacity: 1 };
    if (d.opacity <= 0) continue;
    const p = returnCoinPosV4(i);
    const s = i === count - 1 ? EASE_LAND(clamp01(arriving)) : 1;
    // Ripe -> deep is a cross-dissolve between the two <Coin> tones: the cooled
    // coin sits under the live one and the live one fades off it. No blend
    // mode, and the "$" never moves.
    const w = ripe ? clamp01(ripe(i)) : 1;
    out.push(
      <g key={i}>
        {w < 1 ? (
          <Coin x={p.x} y={p.y + d.dy} r={r} ripe={false} scale={s} opacity={d.opacity} />
        ) : null}
        {w > 0 ? <Coin x={p.x} y={p.y + d.dy} r={r} ripe scale={s} opacity={d.opacity * w} /> : null}
      </g>,
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
    shorting: z.number(), // "shorting"   — the thread, the grab, the drag
    is: z.number(), // "is"
    a: z.number(), // "a"
    really: z.number(), // "really"       — the price is fighting back up
    hard: z.number(), // "hard"           — the yank
    thing: z.number(), // "thing"
    to: z.number(), // "to"
    doWord: z.number(), // "do"
    so: z.number(), // "so"               — the grind, and the money runs again
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
    much: z.number(), // "much"           — all eight pulled a little
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
  coinRadius: V4.COIN_R_V5,
  cardSize: CARD_SIZE,
  markSize: MARK_SIZE,
  beats: BEATS,
});

const IsItEvenWorthItV5: React.FC<Props> = ({
  ink,
  accent,
  // `accentDeep` stays in the schema — it is the set's cooled tone and the
  // palette is declared in one place — but a coin's two tones now live inside
  // d1Shared's <Coin> (`ripe` false), so the component does not read it.
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
  // the mark's own dot, ticking to the half-step while it is the one pulling
  const strainTone = makeTone(accent, HALF_STEP);

  // -- the recede wave, one window per card ---------------------------------
  const waveAt = (i: number) => smoothstep((frame - waveStart(i)) / WAVE_DUR);

  // -- the six prices, idling, dragged, strained ----------------------------
  const prices = [];
  for (let i = 0; i < N_CARDS; i++) {
    const drop = dropAt(i, frame);
    prices.push({ i, drop, tip: priceTip(i, drop), held: frame >= (i === SUBJECT ? F_TOUCH : fanTouch(i)) });
  }

  // -- the money: minted on the falling tip, then climbing ------------------
  // Between m0 and t0 the coin IS on the tip — drawn at tipAt, so it rides the
  // last leg down while it scales in. At t0 it lets go and climbs.
  const minting = [];
  const coins = [];
  for (let n = 0; n < COINS.length; n++) {
    const c = COINS[n];
    if (frame < c.m0 || frame >= c.t1) continue;
    if (frame < c.t0) {
      const p = tipAt(c.i, frame);
      minting.push({
        key: n,
        x: p.x,
        y: p.y,
        scale: EASE_LAND(clamp01((frame - c.m0) / COIN_MINT)),
      });
      continue;
    }
    const u = (frame - c.t0) / c.flight;
    coins.push({
      key: n,
      x: lerp(c.x0, originX(c.i), u),
      y: lerp(c.y0, MARK_BOTTOM, u),
      scale: breath(frame, hash(n, 9)),
    });
  }

  const arrived = coinsAt(frame);
  const arriving = arrived > 0 ? clamp01((frame - COINS[arrived - 1].t1) / COIN_GROW) : 1;

  // the shed, and the cool-down of the eight that stay
  const shedAt = (i: number) => {
    const rankInShed = SHED_ORDER.indexOf(i);
    if (rankInShed < 0) return { dy: 0, opacity: 1 };
    const t = frame - (SHED_F0 + SHED_STEP * rankInShed);
    if (t <= 0) return { dy: 0, opacity: 1 };
    const u = clamp01(t / SHED_FADE);
    return { dy: SHED_FALL * u * u, opacity: 1 - u };
  };
  const coinRipe = (i: number) =>
    1 - clamp01((frame - (COIN_COOL0 + COIN_COOL_STEP * i)) / COIN_COOL_DUR);

  // -- the threads ----------------------------------------------------------
  // The strain pulse: the one thread goes taut while the price climbs back.
  const taut = interpolate(
    frame,
    [F_CLIMB0, F_CLIMB0 + 9, F_YANK0 - 2, F_YANK0],
    [0, 1, 1, 0],
    clamp,
  );

  const threads = [];
  for (let i = 0; i < N_CARDS; i++) {
    const subject = i === SUBJECT;
    const start = subject ? F_DRAW0 : fanStart(i);
    const arrive = subject ? F_TOUCH : fanTouch(i);
    if (frame < start) continue;
    const p = prices[i];
    const drawing = frame < arrive;
    const u = drawing ? clamp01((frame - start) / (arrive - start)) : 1;
    const ox = originX(i);
    // Head-led: the head runs from the mark's bottom edge to the tip of that
    // company's price line, and the moment it touches, the drag begins.
    const ex = drawing ? lerp(ox, p.tip.x, u) : p.tip.x;
    const ey = drawing ? lerp(MARK_BOTTOM, p.tip.y, u) : p.tip.y;
    // A round-capped line of no length still draws its cap, so on the very
    // first frame of a draw the thread would be a dot sitting on the mark's
    // bottom edge. f0 is the world AT REST — no threads, no coins — so a head
    // that has not cleared the mark yet is not drawn at all.
    if (Math.hypot(ex - ox, ey - MARK_BOTTOM) < THREAD_MIN) continue;
    const w = waveAt(i);
    let op = THREAD_LIVE + (THREAD_IDLE - THREAD_LIVE) * w;
    let stroke = accent;
    if (subject) {
      op += (1 - THREAD_LIVE) * taut * (1 - w);
      // the one single-object ink click in the cut: the yank
      if (frame >= F_YANK0 && frame < F_YANK0 + CLICK_INK) stroke = ink;
    }
    threads.push({ i, ox, ex, ey, op, stroke, drawing });
  }

  // -- one packet at a time, drifting DOWN an idle thread -------------------
  const packets = [];
  for (let n = 0; ; n++) {
    const t0 = PACKET_F0 + n * PACKET_STEP;
    if (t0 > frame) break;
    if (frame >= t0 + PACKET_DUR) continue;
    const i = Math.floor(hash(n, 5) * N_CARDS);
    const u = (frame - t0) / PACKET_DUR;
    packets.push({
      key: n,
      x: lerp(originX(i), prices[i].tip.x, u),
      y: lerp(MARK_BOTTOM, prices[i].tip.y, u),
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
            {/* V6 (user): no ground line — the contact shadows carry the floor */}
            <g style={{ filter: icon }}>
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
                  {/* the head pin, on the FIRST thread only: five white pins
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

            {/* the six prices — the short is the last leg of these falling, and
                while a thread holds the tip that leg is drawn in the accent */}
            {prices.map((p) => (
              <PriceLine key={p.i} i={p.i} drop={p.drop} held={p.held} opacity={OP_READ} k={k} />
            ))}

            {/* the six companies, standing on the ground, never moving */}
            {prices.map((p) => (
              <CompanyCard
                key={p.i}
                x={cardX(p.i)}
                y={V4.CARD_Y}
                sector={SECTOR_SET[p.i]}
                size={cardSize}
                k={k}
                opacity={OP_READ}
              />
            ))}

            {/* the money: minted on the falling tip, then climbing the thread */}
            {minting.map((c) => (
              <Coin key={`m${c.key}`} x={c.x} y={c.y} r={coinRadius} scale={c.scale} />
            ))}
            {coins.map((c) => (
              <Coin key={c.key} x={c.x} y={c.y} r={coinRadius} scale={c.scale} />
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
              ripe={coinRipe}
              drop={shedAt}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default IsItEvenWorthItV5;

// The two counts the cut is built around, asserted so a change to the launch
// schedule or the shed cannot silently break the set's handoff.
if (coinsAt(F_RISE0) !== RETURN_PEAK) {
  throw new Error(
    `IsItEvenWorthItV5: the pile is ${coinsAt(F_RISE0)} on f${F_RISE0}, not RETURN_PEAK (${RETURN_PEAK})`,
  );
}
if (RETURN_FAN_PEAK - SHED_ORDER.length !== RETURN_AFTER_DROP) {
  throw new Error(
    `IsItEvenWorthItV5: the shed leaves ${RETURN_FAN_PEAK - SHED_ORDER.length} coins, not RETURN_AFTER_DROP (${RETURN_AFTER_DROP})`,
  );
}
