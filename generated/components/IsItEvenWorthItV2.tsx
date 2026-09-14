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
// "Is it even worth it?" V2 — Orange Dwarkesh on kraft, opaque cutaway, 24fps,
// 1080x1920. V1's beat table, duration, camera shape, press profile, strain and
// yank, and the centre-outward wave are kept exactly. What CHANGED is what the
// things ARE (the user on V1: "too abstract … add some icons") and how softly
// they move ("not super smooth"):
//   * a stock is a COMPANY CARD (a white tile with a sector glyph knocked out),
//     not a dot. Twelve sectors in SECTOR_NAMES order, so "diverse" is visibly
//     twelve DIFFERENT kinds of thing.
//   * the money is back. A short pays: coins climb the thread from the pressed
//     company UP to D1 and pile ON TOP of the mark. That pile is the return,
//     and "your returns are going down" is that pile losing coins — the whole
//     second half now has a number in it.
//   * nothing pops. Every arrival SLIDES along the line it belongs to on the
//     flat-topped `flow` curve with a couple of px of `back(0.75)` settle; the
//     only scale-in in the piece is a coin joining the stack (5 frames).
//
// WORD ONSETS (frames from the composition start, = 26.600s)
//   f0 shorting · f13 is · f23 a · f43 really · f62 hard · f66 thing · f70 to ·
//   f72 do · f76 so · f83 at · f86 some · f91 point · f100 it's · f105 like ·
//   f108 okay · f114 if · f117 you're · f119 going · f120 to · f120 diversify ·
//   f131 so · f137 much · f145 and · f151 your · f153 returns · f158 are ·
//   f161 going · f162 down · f171 like · f174 is · f178 it · f180 even ·
//   f181 worth · f187 it? (ends f193) · tail to f209.
//
// THE PICTURE. The ground line is the market's surface. A short is D1 pressing
// a company UNDER that line on a thread; the deeper it is held, the more money
// comes back up the thread and piles on top of D1. Shorting is hard: the
// company fights its way back up and the money stops coming. Diversify so much:
// eleven more companies, each held only a little way under. Returns going down:
// the pile on top of D1 loses coins. Worth it? Hold.
//
// THE GESTURES, one per word, and nothing else.
//   1. "shorting"                                                     f0-f34
//      At f0: the mark, the line, and ONE card — index 5, SMARTPHONE — sitting
//      ON the line at x 502, where it stays for the whole piece. A thread draws
//      head-led from the mark's bottom edge to the card's top edge f0-f10 and
//      presses it to DEPTH_DEEP by f30 on the V1 press profile: `flow` (accel,
//      cruise, decelerate) plus PRESS_OVER px of `back(0.75)` overshoot, so it
//      goes a few px too deep and eases up — the market pushing back. There is
//      no ink click here: the click is the thread going to 1.0 and the MONEY.
//      From f26 coins leave the card's top edge and climb the thread to the
//      mark's bottom edge, one every 4 frames, 22 frames each; each is absorbed
//      at the tile and the return stack on top of the mark gains one coin.
//      CAMERA M0: opens k 1.25 on mark + line + the depth under it and pushes
//      to 1.36 with the press, keys f8-f28 warp 0.72, landed f34.
//   2. "really hard"                                                 f36-f70
//      THE FIGHT. From f36 the card creeps back UP STRAIN px on an even climb
//      (linear: strain, not an arrival) and the coin launches STOP — the last
//      two in flight still arrive, so the money visibly dries up. The thread
//      pulses once to 1.0 and the mark's own amber dot ticks to the half-step:
//      it is the one pulling. At f62 "hard" the YANK takes the card back to
//      DEPTH_DEEP over 8 frames on Easing.inOut(Easing.quad) — a pull, not a
//      snap; V1's 6-frame in-quad read as a cut — with a single-object full-ink
//      click on the thread for 4 frames.
//      CAMERA M1: even creep k 1.36 -> 1.47 with cy on the card, keys f37-f49
//      warp 1.0, landed f55, then DEAD STILL f55-f61 (the held breath).
//      CAMERA M2: rides the yank down ~10 screen px, keys f62-f70 warp 0.72.
//   3. "so at some point it's like okay if you're going to"          f70-f118
//      THE HOLD BEFORE THE TURN, and nothing in it is still. The card bobs +-6
//      px about DEPTH_DEEP (still fighting). The coins resume at f70 and run to
//      the end of the window, so the stack reaches RETURN_PEAK = 12 (four full
//      rows) exactly at f118.
//      CAMERA M3: the long even pull-back that opens the whole line AND the room
//      above the mark the stack now needs, k 1.47 -> 1.00, keys f96-f110 warp
//      1.0, landed f116.
//   4. "diversify so much"                                          f115-f139
//      ONE MOTION. Eleven more cards enter along the line, under it at
//      DEPTH_SHALLOW, as TWO TRAINS: cards 0-4 from off-frame left and 6-11
//      from off-frame right, sliding in on `flow` at one shared speed, the
//      innermost of each train stopping first (4 and 6 at f134, then outward
//      one frame at a time; the last, card 11, at f139). Meanwhile the original
//      card RISES DEPTH_DEEP -> DEPTH_SHALLOW f118-f134 on the same curve — the
//      same object, never swapped — and the single thread fans into twelve: the
//      heads leave the mark's bottom edge together at ~f124 and, because they
//      all run at one speed over threads of different lengths, LAND in a wave
//      out of the centre, each on the frame its card stops in its seat. Group
//      beat, so the click is the half-step #FFD98A on the thread for 3 frames
//      per card. Coin launches stopped at f96 so the last one lands at f118:
//      the return is made before the diversification starts, which is the
//      argument.
//      CAMERA: holds the frame the pull-back opened.
//   5. "returns are going down"                                    f148-f180
//      THE RETURN FALLS. The stack loses its top six coins (rows 4 and 3,
//      right -> left) one every 3 frames from f150: each lets go, falls 40 px
//      and fades over 10 frames. Twelve to RETURN_FINAL = 6. On one
//      centre-outward wave f150-f180 the twelve threads dim 0.95 -> 0.40, the
//      six surviving coins cool ripe -> deep, and every card settles 4 px
//      shallower (56 -> 52). Less return is literally less depth and less pile.
//      CAMERA M4: creeps back a touch, k 1.00 -> 0.92, keys f148-f164 warp 1.0,
//      landed f170, so the row reads thin.
//   6. "worth it?" and the tail                                    f181-f209
//      HOLD ON THE QUESTION. The only motion: the wave finishing at the outer
//      cards, the paper's own drift, and one ambient ink packet at AMBIENT
//      drifting DOWN an idle thread every ~10 frames across the whole set. Six
//      deep-tone coins sit on the mark and the mark's own dot is the only ripe
//      thing in frame. Held to f209; never fades out.
//
// ambient: `breath` on every coin, `sway` on the camera, the kraft sheet's
// parallax and drift. Not gestures; that is what this field is.
//
// EXPORTS the next cut needs (cut 3 imports them and restates none of them):
//   world     GROUND_Y, GROUND_X0, GROUND_X1, GROUND_W, GROUND_OP,
//             MARK_X, MARK_Y, MARK_BOTTOM, N_CARDS, CARD_PITCH, cardX,
//             cardRank, cardWave, SUBJECT, DEPTH_LINE, DEPTH_DEEP,
//             DEPTH_SHALLOW, DEPTH_SETTLED, cardTopY
//   threads   THREAD_W, THREAD_LIVE, THREAD_IDLE, FAN_ORIGIN_SPREAD, originX
//   return    COIN_R, RETURN_X, RETURN_ROW0_Y, RETURN_ROW_PITCH,
//             returnCoinPos, ReturnStack, RETURN_PEAK, RETURN_FINAL
//   motion    flow, overshoot, EASE_LAND, AMBIENT
//   camera    CAM_SEGS, CAM_F, CAM_K, CAM_CY, K_WIDE, C_WIDE, K_FINAL,
//             C_FINAL, CY_FINAL
// ---------------------------------------------------------------------------

// -- the world -------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1240;

// The market's surface. The shared 5 px line at 0.40 rather than 0.24, because
// something is measured against it from f0 to f209. Its ends ARE the house side
// margin, which is what caps the camera at k 1.00 once the row is out (see
// K_WIDE): at any k above 1 the line's own ends leave the safe area.
export const GROUND_Y = 880;
export const GROUND_X0 = 60;
export const GROUND_X1 = 1020;
export const GROUND_W = 5;
export const GROUND_OP = 0.4;

// The actor above it.
export const MARK_X = 540;
export const MARK_Y = 430;
export const MARK_TOP = MARK_Y - MARK_SIZE / 2; // 376
export const MARK_BOTTOM = MARK_Y + MARK_SIZE / 2; // 484, where every thread leaves

// The twelve companies. Always twelve, always in SECTOR_NAMES order left to
// right, always at pitch 76 centred on the mark: 122 … 958.
export const N_CARDS = 12;
export const CARD_PITCH = 76;
export const CARD_MID = (N_CARDS - 1) / 2; // 5.5
export const cardX = (i: number) => MARK_X + (i - CARD_MID) * CARD_PITCH;
export const SUBJECT = 5; // SMARTPHONE — the one that is shorted first, at x 502
export const cardRank = (i: number) => Math.abs(i - CARD_MID); // 0.5 … 5.5
export const cardWave = (i: number) => (cardRank(i) - 0.5) / 5; // 0 centre, 1 outer

// Depth is the card's CENTRE below the line.
export const DEPTH_LINE = -CARD_SIZE / 2; // -36: the tile sits ON the line
export const DEPTH_DEEP = 200; // one company, pressed all the way down (centre 1080)
export const DEPTH_SHALLOW = 56; // twelve companies, each barely under (top 20 px below)
export const DEPTH_SETTLED = 52; // …and 4 px less again once the returns fall
export const cardTopY = (depth: number) => GROUND_Y + depth - CARD_SIZE / 2;

// How far the company climbs back before the yank. Same number as V1 and for
// the same reason: the camera creeps IN over the same window, and a zoom pushes
// anything below the content centre downward on screen, so a climb smaller than
// this reads as sinking while it is rising.
export const STRAIN = 66;

// -- the money -------------------------------------------------------------
// A coin is a solid amber dot. Never a coin icon: the dots stay the money.
export const COIN_R = 9;

// The return: a stack ON TOP of the mark, three wide, filled left to right row
// by row, growing upward from the tile's top edge (376 - 10 = 366).
export const RETURN_X = [518, 540, 562];
export const RETURN_ROW0_Y = 366;
export const RETURN_ROW_PITCH = 20;
export const returnCoinPos = (i: number) => ({
  x: RETURN_X[i % 3],
  y: RETURN_ROW0_Y - Math.floor(i / 3) * RETURN_ROW_PITCH,
});
export const RETURN_PEAK = 12; // four full rows, reached at f118
export const RETURN_FINAL = 6; // two rows, what is left after "going down"
export const COIN_GROW = 5; // frames a coin scales in when it joins the stack

// The flow up the thread. 22 frames over the ~560 px of a deep thread is 25.5
// world px/frame, 37.4 screen px/frame at the tightest k — inside the house 45
// cap. It is LINEAR, not `flow`: a stream whose spacing pumps reads as
// stuttering rather than as a flow, and flow's 1.39x peak would put a coin at
// 52 screen px/frame under the close camera.
export const COIN_FLIGHT = 22;
export const COIN_A0 = 26; // the first launch, on the press landing
export const COIN_A_STEP = 4;
export const COIN_A_STOP = 36; // …and the launches stop when the fight starts
export const COIN_B0 = 70; // they resume after the yank
export const COIN_B_STEP = 3.25;
export const COIN_B_N = 9;

// Launch times, and therefore arrivals. Three before the fight and nine after
// it, so the twelfth coin is absorbed exactly on f118 — the frame the
// diversification starts. Cut 3 wants the arrivals, so they are exported.
export const COIN_LAUNCH: number[] = (() => {
  const L: number[] = [];
  for (let t = COIN_A0; t < COIN_A_STOP; t += COIN_A_STEP) L.push(t);
  for (let n = 0; n < COIN_B_N; n++) L.push(COIN_B0 + n * COIN_B_STEP);
  return L;
})();
export const COIN_ARRIVE = COIN_LAUNCH.map((t) => t + COIN_FLIGHT);

// The shed: the top six let go, right to left, one every 3 frames.
export const SHED_F0 = 150;
export const SHED_STEP = 3;
export const SHED_ORDER = [11, 10, 9, 8, 7, 6];
export const SHED_FALL = 40;
export const SHED_FADE = 10;

// The six that stay cool ripe -> deep, each on its own small offset so the
// group breathes rather than switching as one sheet.
export const COIN_COOL0 = 156;
export const COIN_COOL_STEP = 2;
export const COIN_COOL_DUR = 12;

// -- the trains ------------------------------------------------------------
// Every card must be FULLY off-frame on its first drawn frame, at the k it
// enters at (~1.02). The row is not symmetric about the mark — card 4 sits 114
// px left of centre and card 6 only 38 px right of it — so the two trains have
// different reaches and therefore different durations at ONE shared speed
// (~28 world px/frame). Peak with the settle is 42 screen px/frame, inside the
// house 45 cap; the measured cost of the settle is ENTER_OVER * 15.8 / dur
// px/frame, which is why it is 4 px and not V1's 8 (8 put the trains at 47).
export const LEFT_L = 470;
export const LEFT_DUR = 17;
export const RIGHT_L = 535;
export const RIGHT_DUR = 19;
export const ENTER_OVER = 4; // px of back(0.75) settle, along the direction of travel
export const ENTER_INNER_STOP = 134;
// 1.0, not 1.6: a train whose cars start 1.6 frames apart is stretched by 1.6 *
// 34 = 54 px mid-flight against a 76 px pitch, and the row visibly CONCERTINAS
// shut as it lands. At 1.0 the stretch is under half a card and the queue reads
// as one body closing up, which is what the stagger is for.
export const ENTER_STAGGER = 1.0;
export const RISE0 = 118; // the original card starts coming up
export const RISE1 = ENTER_INNER_STOP; // …and lands with the innermost pair

// When card i is home, and how it got there. The subject rises rather than
// slides, so its "stop" is the top of its rise.
export const cardStop = (i: number) =>
  i === SUBJECT
    ? RISE1
    : ENTER_INNER_STOP + ENTER_STAGGER * (i < SUBJECT ? SUBJECT - 1 - i : i - (SUBJECT + 1));
export const enterL = (i: number) => (i < SUBJECT ? LEFT_L : RIGHT_L);
export const enterDur = (i: number) => (i < SUBJECT ? LEFT_DUR : RIGHT_DUR);

// -- the threads -----------------------------------------------------------
export const THREAD_W = 2.5;
export const THREAD_LIVE = 0.95;
export const THREAD_IDLE = 0.4;
// Not one pin: twelve threads converging on a point draw a spike and the fan
// reads as one filled triangle. They leave the mark's bottom EDGE, spread +-34
// px inside its 108 px width.
export const FAN_ORIGIN_SPREAD = 34;
export const originX = (i: number) =>
  MARK_X + ((i - CARD_MID) / CARD_MID) * FAN_ORIGIN_SPREAD;

// Every head runs at one speed, so the outer threads — half as long again as
// the inner ones — are still travelling when the inner ones are home: the fan
// opens like a hand. 42 world px/frame is 42 screen px/frame at the k the fan
// plays at (1.00), just inside the cap, and it is deliberately the fastest
// legal speed: the longer the draw, the longer eleven heads hang over a row
// that has not arrived yet.
export const FAN_SPEED = 42;
export const threadLen = (i: number) =>
  Math.hypot(cardX(i) - originX(i), cardTopY(DEPTH_SHALLOW) - MARK_BOTTOM);
export const threadStart = (i: number) => cardStop(i) - threadLen(i) / FAN_SPEED;

// -- the recede wave -------------------------------------------------------
export const WAVE_F0 = 150;
export const WAVE_SPREAD = 22; // centre to outer edge: starts run f150 … f172
export const WAVE_DUR = 8; // one card's own ramp; the outermost is home at f180
export const waveStart = (i: number) => WAVE_F0 + WAVE_SPREAD * cardWave(i);

// -- the ambient packets ---------------------------------------------------
export const AMBIENT = 0.38; // the shared ceiling for anything subordinate
export const PACKET_F0 = 176;
export const PACKET_STEP = 10; // one launch per ten frames, across the whole set
export const PACKET_DUR = 18;
export const PACKET_R = 3.5;

// -- eases -----------------------------------------------------------------
// One landing ease for anything that arrives.
export const LAND_BACK = 0.75;
export const EASE_LAND = Easing.out(Easing.back(LAND_BACK));
const BACK_PEAK = (4 * LAND_BACK ** 3) / (27 * (LAND_BACK + 1) ** 2); // 0.0204
// The part of that landing that sticks out past 1, normalised to peak at 1, so
// a long travel can be given a fixed couple of px of settle instead of 2% of
// its own reach (which on a 480 px train would be a 10 px bounce).
export const overshoot = (u: number) => Math.max(0, EASE_LAND(clamp01(u)) - 1) / BACK_PEAK;

// A travel curve with a flat middle: eases in over the first 28%, runs at one
// speed, eases out over the last 28%. Peak 1.39x the average against a plain
// smoothstep's 1.5x, and zero velocity at both ends, which is what keeps a
// train reading as one body rather than as five thrown objects.
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
// The yank. An in/out ease over 8 frames rather than V1's 6-frame in-quad,
// which read as a cut rather than as a pull.
export const EASE_YANK = Easing.inOut(Easing.quad);

// One click-bright. Ink for 4 frames on a single-object beat (the yank); the
// half-step for 3 on a group beat (each card of the trains arriving). A card
// tile NEVER changes colour — emphasis is carried by the thread and the coins.
export const CLICK_INK = 4;
export const CLICK_HALF = "#FFD98A";
export const CLICK_HALF_DUR = 3;

// ---------------------------------------------------------------------------
// THE CAMERA. Five moves on one authored track through the shared damper, each
// framing the thing about to move: in with the press, a creep onto the strain,
// a ride down on the yank, the pull-back that opens the line AND the room the
// stack needs above the mark, and the last widening that makes the row read
// thin. Nothing pans — cx is MARK_X for the whole piece.
//
// The zooms are lower than V1's all the way through, and they have to be: V1
// measured 9 px dots against a 613 px tall composition, and V2 measures 72 px
// tiles at depth 200 with a coin stack above the mark — 759 world px of
// content. The binding frames, both solved against the house 200/1450 band:
//   k 1.47 c 752.8 (after the yank's ride)  row-1 coin top at screen 232,
//                                           the deep card's bottom at 1373
//   k 1.00 c 665   the ground's own ends at screen 60 and 1020 exactly, the
//                  twelve-card row at 86 … 994, the four-row stack top at 467
// Anything above k 1.00 in the second half puts the ground line's ends outside
// the side margin, so K_WIDE is 1.00 rather than V1's 1.15 and K_FINAL is 0.92.
//
// Key windows end BEFORE their landing on purpose: the damper lags its target
// by ~6 frames, so keys that run to the landing frame leave the camera visibly
// moving under the word.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.25;
export const C_OPEN = 720;
export const K_PUSH = 1.36; // "shorting" — in with the press
export const C_PUSH = 738;
export const K_CREEP = 1.47; // "really hard" — the creep and the yank
export const C_CREEP = 746;
export const C_YANK = C_CREEP + 10 / K_CREEP; // the 10 screen px ride
export const K_WIDE = 1.0; // "diversify" — the whole line opened out
export const C_WIDE = 665;
export const K_FINAL = 0.92; // "returns going down" — thinner again
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
  // M0 "shorting" — push in with the card as it is driven under the line
  { f0: 8, f1: 28, k0: K_OPEN, k1: K_PUSH, c0: C_OPEN, c1: C_PUSH, warp: 0.72 },
  // M1 "really" — the even creep onto the card, then dead still for "hard"
  { f0: 37, f1: 49, k0: K_PUSH, k1: K_CREEP, c0: C_PUSH, c1: C_CREEP, warp: 1.0 },
  // M2 "hard" — ride the yank down ~10 screen px and settle
  { f0: 62, f1: 70, k0: K_CREEP, k1: K_CREEP, c0: C_CREEP, c1: C_YANK, warp: 0.72 },
  // M3 "so at some point … going to" — the pull-back, ahead of the trains
  { f0: 96, f1: 110, k0: K_CREEP, k1: K_WIDE, c0: C_YANK, c1: C_WIDE, warp: 1.0 },
  // M4 "returns are going down" — a touch further out, so the row reads thin
  { f0: 148, f1: 164, k0: K_WIDE, k1: K_FINAL, c0: C_WIDE, c1: C_FINAL, warp: 1.0 },
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
// THE RETURN STACK. Cut 3 imports this component and draws the same pile from
// the same geometry: `count` is how many coins are present, `arriving` scales
// the newest one in over COIN_GROW frames, `fill` may be one colour or a
// per-coin function, and `drop` lets a cut shed coins out of the stack.
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
    diversify: z.number(), // "diversify" — the two trains
    soTwo: z.number(), // "so"
    much: z.number(), // "much"           — the row is down
    and: z.number(), // "and"
    your: z.number(), // "your"
    returns: z.number(), // "returns"     — the stack sheds, the wave
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

// -- the subject company's depth, gesture by gesture ------------------------
export const F_TOUCH = 10; // the thread reaches the card
export const F_DEEP = 30; // it is all the way down
export const F_STRAIN0 = 36; // the climb back starts, and the coins stop
export const F_STRAIN1 = 60; // …and it is at its highest, two frames before "hard"
export const F_YANK0 = 62;
export const F_YANK1 = 70;
export const PRESS_OVER = 7; // px of "a few px too deep" on the press landing
export const BOB_AMP = 6;
export const BOB_PERIOD = 40;
export const BOB_RAMP = 14;

const bobAt = (f: number) =>
  DEPTH_DEEP +
  BOB_AMP *
    interpolate(f, [F_YANK1 + 2, F_YANK1 + 2 + BOB_RAMP], [0, 1], clamp) *
    Math.sin((2 * Math.PI * (f - F_YANK1 - 2)) / BOB_PERIOD);

export const subjectDepth = (f: number): number => {
  if (f <= F_TOUCH) return DEPTH_LINE;
  if (f < F_DEEP) {
    const u = clamp01((f - F_TOUCH) / (F_DEEP - F_TOUCH));
    return DEPTH_LINE + (DEPTH_DEEP - DEPTH_LINE) * flow(u) + PRESS_OVER * overshoot(u);
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
  const u = clamp01((f - RISE0) / (RISE1 - RISE0));
  // the same curve the trains ride, so the twelve arrive as one family
  return bobAt(RISE0) + (DEPTH_SHALLOW - bobAt(RISE0)) * flow(u) - PRESS_OVER * overshoot(u);
};

// -- where card i is, this frame -------------------------------------------
export const cardPos = (i: number, f: number) => {
  if (i === SUBJECT) return { x: cardX(i), depth: subjectDepth(f), born: 0 };
  const L = enterL(i);
  const dur = enterDur(i);
  const start = cardStop(i) - dur;
  const dir = i < SUBJECT ? 1 : -1; // the left train travels right
  const u = clamp01((f - start) / dur);
  const x =
    u >= 1 ? cardX(i) : cardX(i) - dir * L + dir * (L * flow(u) + ENTER_OVER * overshoot(u));
  return { x, depth: DEPTH_SHALLOW, born: start };
};

const IsItEvenWorthItV2: React.FC<Props> = ({
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

  // -- the twelve companies -------------------------------------------------
  const cards = [];
  for (let i = 0; i < N_CARDS; i++) {
    const p = cardPos(i, frame);
    if (frame < p.born) continue;
    const w = waveAt(i);
    const depth = p.depth + (DEPTH_SETTLED - DEPTH_SHALLOW) * w;
    cards.push({ i, x: p.x, y: GROUND_Y + depth, top: cardTopY(depth), w });
  }
  const cardAt: Record<number, (typeof cards)[number]> = {};
  cards.forEach((c) => {
    cardAt[c.i] = c;
  });

  // -- the money in flight, and the stack it builds --------------------------
  const subjTop = cardTopY(subjectDepth(frame));
  const coins = [];
  for (let n = 0; n < COIN_LAUNCH.length; n++) {
    const t0 = COIN_LAUNCH[n];
    if (frame < t0 || frame >= COIN_ARRIVE[n]) continue;
    const u = (frame - t0) / COIN_FLIGHT;
    coins.push({
      key: n,
      x: lerp(cardX(SUBJECT), originX(SUBJECT), u),
      y: lerp(subjTop, MARK_BOTTOM, u),
      r: coinRadius * breath(frame, hash(n, 9)),
    });
  }

  let arrived = 0;
  for (let n = 0; n < COIN_ARRIVE.length; n++) if (frame >= COIN_ARRIVE[n]) arrived = n + 1;
  const arriving = arrived > 0 ? clamp01((frame - COIN_ARRIVE[arrived - 1]) / COIN_GROW) : 1;

  // the shed, and the cool-down of the six that stay
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

  // -- the threads ------------------------------------------------------------
  // The strain pulse: the one thread goes taut while the company climbs back.
  const taut = interpolate(
    frame,
    [beats.really, beats.really + 9, F_YANK0 - 2, F_YANK0],
    [0, 1, 1, 0],
    clamp,
  );
  // the press "click": the thread going to a full 1.0 as the card lands deep
  const pressLit = interpolate(frame, [F_DEEP - 4, F_DEEP, F_DEEP + 8, F_DEEP + 14], [0, 1, 1, 0], clamp);

  const threads = [];
  for (let i = 0; i < N_CARDS; i++) {
    const subject = i === SUBJECT;
    const start = subject ? beats.shorting : threadStart(i);
    const arrive = subject ? F_TOUCH : cardStop(i);
    if (frame < start) continue;
    const c = cardAt[i];
    const drawing = frame < arrive;
    const u = drawing ? clamp01((frame - start) / (arrive - start)) : 1;
    const ox = originX(i);
    // Head-led: the head runs from the mark's bottom edge to the SEAT its card
    // is sliding into and gets there on the frame the card does, so wire and
    // company meet at the seat. (Aiming at the card's live position instead was
    // tried and is wrong twice over: while the card is still off-frame the
    // target is 850 px away, which puts the head at 56 screen px/frame — over
    // the cap — and the aim then swings sideways as the card comes in.)
    const tx = subject ? cardX(SUBJECT) : cardX(i);
    const tyEnd = subject ? cardTopY(DEPTH_LINE) : cardTopY(DEPTH_SHALLOW);
    const ex = drawing ? lerp(ox, tx, u) : (c?.x ?? tx);
    const ey = drawing ? lerp(MARK_BOTTOM, tyEnd, u) : (c?.top ?? tyEnd);
    const w = waveAt(i);
    let op = THREAD_LIVE + (THREAD_IDLE - THREAD_LIVE) * w;
    let stroke = accent;
    if (subject) {
      // the strain pulse, and the press "click" — the thread going to a full 1.0
      op += (1 - THREAD_LIVE) * Math.max(taut, pressLit) * (1 - w);
      // single-object beat: full ink for four frames on the yank
      if (frame >= F_YANK0 && frame < F_YANK0 + CLICK_INK) stroke = ink;
    }
    // group beat: the half-step for three frames as each card of the row stops.
    // The subject's own stop is the TOP OF ITS RISE, not the f10 touch — the
    // first gesture has no click in it by design.
    const stopClick = subject ? RISE1 : arrive;
    if (frame >= stopClick && frame < stopClick + CLICK_HALF_DUR) stroke = CLICK_HALF;
    threads.push({ i, ox, ex, ey, op, stroke, drawing });
  }

  // -- one packet at a time, drifting DOWN an idle thread ---------------------
  const packets = [];
  for (let n = 0; ; n++) {
    const t0 = PACKET_F0 + n * PACKET_STEP;
    if (t0 > frame) break;
    if (frame >= t0 + PACKET_DUR) continue;
    const i = Math.floor(hash(n, 5) * N_CARDS);
    if (waveStart(i) + WAVE_DUR + 2 > t0) continue; // only a thread the wave has passed
    const c = cardAt[i];
    if (!c) continue;
    const u = (frame - t0) / PACKET_DUR;
    packets.push({
      key: n,
      x: lerp(originX(i), c.x, u),
      y: lerp(MARK_BOTTOM, c.top, u),
    });
  }

  // -- camera -----------------------------------------------------------------
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
                  {/* the head pin, on the FIRST thread only: twelve white
                      pins travelling through empty paper read as a spider,
                      and the fan does not need pointing out twice */}
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

            {/* the companies, pressed under the line */}
            {cards.map((c) => (
              <CompanyCard
                key={c.i}
                x={c.x}
                y={c.y}
                sector={SECTOR_NAMES[c.i]}
                size={cardSize}
                k={k}
                opacity={OP_READ}
              />
            ))}

            {/* the money on its way back up the thread */}
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

export default IsItEvenWorthItV2;
