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
  camEase,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
// THE ONE WORLD (V5). The ground, the SIX companies standing on it, their
// price lines, the drops a tip can be dragged to, the coin-per-px rule, the
// mark, the thread origins, the `Coin` and the return pile's grid all come
// from `d1Shared`; nothing here restates any of them. How many companies there
// are is read from `N_CARDS` everywhere, so cutting eight to six moved the
// sweep's step, the coin count and the pile's height without a number in this
// file changing.
import {
  CARD_SIZE,
  Coin,
  CompanyCard,
  D1Mark,
  GROUND_OP,
  GROUND_W,
  GROUND_X0,
  GROUND_X1,
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
  THREAD_IDLE,
  THREAD_LIVE,
  THREAD_W,
  V4,
  cardX,
  originX,
  priceTip,
  returnCoinPosV4,
} from "./d1Shared";
// THE MOTION, AND THE FRAME THIS CUT OPENS ON. This piece IS cut 2 ten seconds
// later, so the travel curve, the landing ease, the click lengths, the ambient
// ceiling and traffic clock, the speed a coin climbs a thread, the strain a
// held tip carries, the drops cut 2 resolved on and the camera it resolved on
// are all IMPORTED and none of them is restated here. f0 of this piece is that
// piece's last frame.
import {
  AMBIENT,
  CAM_CY as IW5_CAM_CY,
  CLICK_INK,
  COIN_GROW,
  COIN_SPEED,
  CY_FINAL,
  C_FINAL,
  DURATION as IW5_DURATION,
  EASE_LAND,
  HALF_STEP,
  K_FINAL,
  PACKET_DUR,
  PACKET_F0,
  PACKET_R,
  PACKET_STEP,
  RESOLVED_DROPS,
  WORLD_H,
  WORLD_W,
  cardLevel,
  flow,
  overshoot,
  strainDrop,
} from "./IsItEvenWorthItV5";

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
export const CONTINUE_FROM = IW5_DURATION;

// ---------------------------------------------------------------------------
// "As good or better" — the payoff cut of the clip, V5.
//
// V5 IS V4's MOTION, UNCHANGED, IN A LIGHTER ROOM. The wake, the sweep, the
// climb, the one summed camera curve, the keyed arrivals and the ticks are
// exactly what was approved on V4. Five things are different, all of them from
// d1Shared or from the user's V4 note ("slightly overwhelming, cut maybe 2 of
// the blocks · another way to make it clear they're earning money when the
// stock goes down · a subtle 3d vibe"):
//   1. SIX companies, not eight. Nothing here counts them: `N_CARDS` does. The
//      sweep keeps its f52-f108 window, so six tips leave SWEEP_STEP = 11.2
//      frames apart instead of 8 and the wave breathes a little more per card.
//   2. TWELVE coins, not sixteen — two a card, off the same COIN_STEP rule —
//      so the pile goes RETURN_AFTER_DROP -> RETURN_PEAK at f126 -> N_FINAL
//      (20, five rows, two past the ticks) at f146.
//   3. Every coin is d1Shared's `Coin`: a radial-lit amber disc with a "$"
//      knocked out of it, r V4.COIN_R_V5. A coin is MINTED AT THE TIP — it
//      scales in over COIN_MINT frames on EASE_LAND while the tip is still
//      being dragged down under it, so the money visibly comes out of the
//      falling leg — waits there in the deep tone if it has to, and warms to
//      ripe over COIN_WARM frames as it leaves up the thread.
//   4. The fallen leg of every held price line is amber (d1Shared's `PriceLine`
//      does it off `held`), so the drop itself is the money.
//   5. Depth: the kraft sheet's top light and foot shade, the tiles' gradient
//      and contact shadows (all d1Shared) and `Vignette` at 0.55. Still flat
//      shapes — no glow, no bevel, no blend mode.
// The camera is V4's curve with ONE number changed: six cards span 600 world px
// instead of 728, so K_SWEEP_MAX goes 1.35 -> 1.5 and the whole close half of
// the cut sits ~11% tighter. Every ramp, landing frame and warp is V4's.
//
// Orange Dwarkesh style on kraft: opaque 1080x1920 cutaway at 24fps, ink
// #FFFFFF, two tones of one amber (ACCENT_DEEP at rest, ACCENT lit), solid
// dots, one stroke weight, one landing ease, `iconShadow(k)` on every card,
// price line and mark, `Vignette` last.
//
// ONE CONTINUOUS MOTION. The cut is a single left-to-right sweep that never
// stops: six price lines, each already pulled down a little by cut 2, are
// dragged one after another all the way to V4.DROP_DEEP while the camera runs
// with the wavefront and the money that each new low pays out climbs the
// threads onto the mark. The words are inflections in that one motion, not
// separate events: there is no click anywhere in the sweep and nothing waits
// for a word to start.
//
// Word onsets, from composition start (= 43.259):
//   f0 as · f8 it · f11 turns · f15 out · f27 if · f33 you · f36 look · f43 at
//   f48 our · f54 short · f60 alpha · f66 since · f74 that · f89 time
//   f98 our · f100 short · f105 alpha · f110 has · f116 been · f120 as
//   f126 good · f131 or · f134 better (speech ends f146) · tail to f162
//
// THE THREE PHASES OF THE ONE MOTION
//
//   WAKE, f0-f50 — "as it TURNS OUT"
//     f0 is cut 2's resolved frame exactly: six companies on the ground with
//     their price lines pulled to RESOLVED_DROPS[i], six THREAD_IDLE threads on
//     the tips, RETURN_AFTER_DROP deep-tone coins piled on the mark, the tips
//     straining on cut 2's own clock, cut 2's tail traffic still drifting DOWN
//     the threads and the paper still drifting. At f11 ("turns") the threads
//     go THREAD_IDLE -> THREAD_LIVE over WAKE_DUR frames, the piled coins warm
//     deep -> ripe on the same ramp and the mark's dot ticks to the half-step
//     for CLICK_INK frames: D1 is looking again. At f15 ("out") the traffic
//     reverses and single ink beads come UP. THE CAMERA is already moving at
//     f4 and does not stop again until the tail: a push toward the left end of
//     the row (k K_FINAL -> K_SWEEP, cx MARK_X -> CX_LEFT, cy landing on the
//     tips) that settles on f50 and runs straight on into the pan — the pan's
//     ramp opens inside the push's tail, so there is no frame between them.
//
//   THE SWEEP, f50-f120 — "our SHORT ALPHA" f54/f60, "SINCE THAT TIME" f66-f89
//     ONE wave, left to right. Card i's tip leaves its shallow drop at
//     SWEEP_F0 + i * SWEEP_STEP (+-SWEEP_JIT hashed) and is dragged to
//     V4.DROP_DEEP over SWEEP_DUR frames on cut 2's `flow`, so card 0 leaves on
//     f52 and reads on "short", and card 5 leaves on SWEEP_LAST, f108. Every
//     COIN_STEP px of NEW LOW on a tip MINTS a coin at that tip —
//     COINS_PER_CARD of them,
//     N_COINS in all, counted off the curve rather than typed, so the drop
//     d1Shared resolves on is what decides how much money a short pays — and a
//     coin climbs its own thread at COIN_SPEED onto the mark. No
//     click on any of it: the sweep IS the event. THE CAMERA pans with the
//     wavefront, cx CX_LEFT -> CX_RIGHT, and from f104 that pan bends straight
//     into the pull-back without ever stopping — the three moves are summed on
//     one authored curve rather than played in sequence, so cx has no stall
//     between them and k starts widening while the pan is still running.
//
//   THE CLIMB, f110-f146 — "AS GOOD" f120/f126, "BETTER" f134
//     The coins keep arriving the whole way through. The pile holds exactly
//     RETURN_PEAK on f126 — the height cut 2's pile reached before it shrank,
//     marked by TICK_LEN dashed ticks either side of it at TICK_Y, drawn in one
//     stroke each between TICK_F0 and TICK_F1 and clear of the pile's own width
//     so nothing is ever drawn through the coins. That is "as good". From there
//     one arrival every RELEASE_STEP frames takes it to N_FINAL, five rows past
//     the ticks, and every one of those arrivals takes the half-step HALF_STEP.
//     That is "better". The camera creeps up RIDE_SCREEN px over the same
//     window — the tail of the pull-back, not a new move — so the top of the
//     growing pile stays framed.
//
//   TAIL, f146-f162. Six companies with their prices dragged to the floor,
//   six live threads, N_FINAL coins on D1, the tips still straining, and one
//   ambient ink bead at AMBIENT travelling UP a thread every TAIL_STEP frames.
//   Held resolved; never fades out.
//
// WHAT IS INHERITED, NOT INVENTED: the drops cut 2 resolved on (RESOLVED_DROPS),
// its strain on every held tip (carried across the join by reading it at
// `frame + CONTINUE_FROM`), its camera's last k and cy, its coin speed, its
// pile count, its `flow`, its landing ease, its click lengths, its ambient
// ceiling and packet clock, and the kraft sheet's drift. Not gestures; that is
// what this world is.
//
// NOTHING HERE COUNTS COINS BY HAND. `MADE` walks each card's authored drop and
// records every crossing of a new low, so when d1Shared cut the market from
// eight companies to six this cut went from 16 coins in the air to 12 and from
// a pile of 24 to one of 20 — five rows, two of them past the ticks — with no
// number in this file changing. The counts are asserted against RETURN_PEAK at
// f126 by the check script rather than assumed.
//
// ONE THING THIS FILE DOES DIFFERENTLY FROM A LITERAL READING OF THE BRIEF:
//   * a coin is MADE at the new low that earns it and does not always leave at
//     once. Every coin's ARRIVAL is the authored number and its launch is
//     solved back from it: N_PRE of them — the first coin of each of the first
//     N_PRE cards — are delivered evenly through the sweep so the pile climbs
//     all the way across it, and the rest wait on their own tip in the deep
//     tone, riding it down as it is dragged further, and come home on the
//     release run. Left to free flight the first four bunch into f80-f100 and
//     the pile then stands still for the best part of thirty frames, which is
//     the one stretch where nothing would be happening at the mark; and the
//     pile could not be exactly RETURN_PEAK on f126 either way.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a coin in flight, a live thread, a held tip
  accentDeep: z.string(), // deep: a coin resting on a tip or cooled on the pile
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
    short: z.number(), // "short"    — card 0's tip is being dragged down
    alpha: z.number(), // "alpha"    — its first coin is on the wire
    since: z.number(), // "since"    — the wave is running, the camera with it
    that: z.number(), // "that"
    time: z.number(), // "time"
    ourTwo: z.number(), // "our"
    shortTwo: z.number(), // "short"
    alphaTwo: z.number(), // "alpha" — the pull-back has started
    has: z.number(), // "has"
    been: z.number(), // "been"
    asTwo: z.number(), // "as"       — the two ticks are drawing
    good: z.number(), // "good"      — the pile is exactly RETURN_PEAK high
    or: z.number(), // "or"          — it is climbing past them
    better: z.number(), // "better"  — and clear of them
    end: z.number(), // speech ends; tail to 162
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE INHERITED FRAME. One place, and only one, adapts cut 2's names to the
// three things this cut needs from its resolved state.
// ---------------------------------------------------------------------------
export const drop0 = (i: number) => RESOLVED_DROPS[i];
// The strain cut 2 leaves on a held tip, read on CUT 2's clock — `f +
// CONTINUE_FROM` — so it simply keeps going across the join instead of ramping
// in again from zero. It is NEGATIVE by construction over there (a held tip
// strains upward, never into a new low), which is also why the press below can
// afford its overshoot: nothing this cut draws can be pushed past V4.TIP_MIN.
export const tipStrain = (i: number, f: number) =>
  strainDrop(i, f + CONTINUE_FROM, cardLevel(i));
// Cut 2 fixes the half-step colour but not how long an arrival wears it; three
// frames is this cut's number, one less than its CLICK_INK, so a group arrival
// can never read as loud as a single-object click.
export const HALF_DUR = 3;

// -- the world beyond what is imported ---------------------------------------
export const CARD_HALF = CARD_SIZE / 2;
// V5's coin: bigger, because it now carries a "$". Everything that used to be
// written against the old r 9 dot — the pile's height, the ticks, the lift off
// a tip, the gap between two coins waiting on one — reads this instead, so the
// radius is still stated in exactly one place (d1Shared).
export const COIN_R5 = V4.COIN_R_V5;
export const RETURN_COLS = V4.RETURN_COLS;
export const rows = (n: number) => Math.ceil(n / RETURN_COLS);
// The top edge of the pile when it holds n coins.
export const stackTopY = (n: number) =>
  V4.RETURN_ROW0_Y - (Math.max(1, rows(n)) - 1) * V4.RETURN_ROW_PITCH - COIN_R5;

// The height cut 2's pile reached before it shrank, and what "as good" is
// measured against: the top edge of row three, which is where RETURN_PEAK (12 =
// three rows of four) reached — on V5's RETURN_ROW_PITCH of 24 and the r 11
// coin, y 305. Two ticks, one either side of the pile and clear of its own
// width (the pile spans V4.RETURN_X[0] - COIN_R5 … [3] + COIN_R5), so nothing
// is ever drawn through the coins. Their x is SOLVED off that span rather than
// typed: at pitch 24 the pile is wider than it was at V4's r 9, and V4's typed
// 590 would have put the right tick 3 px off the coins.
export const TICK_LEN = 60;
export const TICK_GAP = 6;
export const TICK_Y = V4.RETURN_ROW0_Y - 2 * V4.RETURN_ROW_PITCH - COIN_R5;
export const TICK_R0 = V4.RETURN_X[RETURN_COLS - 1] + COIN_R5 + TICK_GAP;
export const TICK_L0 = V4.RETURN_X[0] - COIN_R5 - TICK_GAP - TICK_LEN;
export const TICK_DASH = "10 8";
export const TICK_W = 2.5;
export const TICK_OP = 0.4;
export const TICK_F0 = 118; // draws under "as" (f120) and reads on "good" (f126)
export const TICK_F1 = 128;

// ---------------------------------------------------------------------------
// THE SWEEP. One press per card on cut 2's `flow`, SWEEP_STEP frames apart, so
// the six of them are one wave rather than six events. The overshoot is
// cut 2's `overshoot` at OVER_TIP px — small, because a tip has only
// V4.PRICE_H - V4.TIP_MIN of room and the strain it carries needs the rest.
// ---------------------------------------------------------------------------
export const WAKE_DUR = 6; // THREAD_IDLE -> THREAD_LIVE, on "turns"
export const SWEEP_F0 = 52; // card 0; `flow`'s soft start reads on "short", f54
export const SWEEP_LAST = 108; // …and the LAST card leaves here, whatever N_CARDS is
// So the wave spans the same f52-f108 window it was approved on and the step
// follows the market's size: 8 frames at eight companies, 11.2 at six. Keeping
// the step at 8 instead would have finished the sweep on f92 and left 28 frames
// of the cut with nothing being dragged.
export const SWEEP_STEP = (SWEEP_LAST - SWEEP_F0) / (N_CARDS - 1);
export const SWEEP_DUR = 16; // one press
export const SWEEP_JIT = 1; // +-1 frame per card, so the wave breathes
export const OVER_TIP = 2; // px of "a little too far" on the press landing

export const pressStart = (i: number) =>
  SWEEP_F0 + i * SWEEP_STEP + (hash(i, 31) - 0.5) * 2 * SWEEP_JIT;
export const pressLand = (i: number) => pressStart(i) + SWEEP_DUR;
export const pressAt = (i: number, f: number) => clamp01((f - pressStart(i)) / SWEEP_DUR);

// The AUTHORED drop: what the hand on the thread is doing, with no strain on
// it. A new low is read off this, so a tip breathing up and down can never pay
// out a coin it has not earned.
export const dropPress = (i: number, f: number) => {
  const u = pressAt(i, f);
  return drop0(i) + (V4.DROP_DEEP - drop0(i)) * flow(u) + OVER_TIP * overshoot(u);
};
// The tip can never be dragged closer than V4.TIP_MIN to the card top; this
// stays one px clear of that so the strain is never clipped flat.
export const DROP_CEIL = V4.PRICE_H - V4.TIP_MIN - 1;
export const dropAt = (i: number, f: number) =>
  Math.min(DROP_CEIL, dropPress(i, f) + tipStrain(i, f));
export const tipAt = (i: number, f: number) => priceTip(i, dropAt(i, f));

// ---------------------------------------------------------------------------
// THE MONEY. d1Shared's rule, not a schedule: a coin is made at the tip every
// COIN_STEP px of NEW LOW, tracked per card against its lowest-so-far. Six
// cards going from their inherited drop to V4.DROP_DEEP make N_COINS of them.
// ---------------------------------------------------------------------------
export const COIN_STEP = 1 / V4.COIN_PER_PX;
// Where a made coin sits above its tip: clear of the tip dot, not on it. At
// COIN_R + 2 the coin's lower edge cuts across the accent tip and the two read
// as one lump at 3x, and the one signal that says D1 still has hold of this
// price is gone under its own profit.
export const COIN_LIFT = COIN_R5 + V4.TIP_R + 3;
export const COIN_PITCH = 2 * COIN_R5 + 2; // …and how far apart, if two of them wait
// V5: a coin is MINTED where the price falls. It does not rise out of the tip
// any more — it appears at its resting place above the tip at scale 0 and
// scales in on the landing ease over COIN_MINT frames, WHILE the tip is still
// being dragged down under it, so the coin is visibly made by the fall. Same
// number of frames as a coin joining the pile (COIN_GROW), because it is the
// same gesture at the other end of the wire.
export const COIN_MINT = COIN_GROW;
// …and how long it takes to warm from the deep tone to ripe once it lets go.
export const COIN_WARM = 4;

export type Made = { i: number; m: number; f: number };
export const MADE: Made[] = (() => {
  const out: Made[] = [];
  for (let i = 0; i < N_CARDS; i++) {
    let next = drop0(i) + COIN_STEP;
    let m = 1;
    for (let f = SWEEP_F0 - 4; f <= DURATION; f += 0.25) {
      if (dropPress(i, f) >= next) {
        out.push({ i, m, f });
        m++;
        next += COIN_STEP;
      }
    }
  }
  return out.sort((a, b) => a.f - b.f);
})();
export const N_COINS = MADE.length;
export const N_FINAL = RETURN_AFTER_DROP + N_COINS;

// N_PRE coins are delivered DURING the sweep — the first coin of each of the
// first N_PRE cards — so the pile climbs the whole way through it and is
// exactly RETURN_PEAK by the time the ticks are drawn.
export const N_PRE = RETURN_PEAK - RETURN_AFTER_DROP;
export const N_POST = N_COINS - N_PRE;
export const isPre = (c: Made) => c.m === 1 && c.i < N_PRE;

// THE SWEEP'S OWN ARRIVALS, evenly across it. The first is the earliest card 0
// can physically deliver; the last lands six frames before the ticks start
// drawing. Keyed rather than left to free flight because free flight bunches
// all four into f80-f100 and then leaves the pile standing still for 27 frames
// — the one stretch of this cut where nothing would be happening at the mark.
// Keyed like this the pile ticks up every ten frames through the sweep and
// then holds at RETURN_PEAK for exactly as long as the ticks take to draw and
// the words "as good" take to land.
export const PRE_ARR0 = 80;
export const PRE_ARR1 = 112;
export const PRE_STEP = N_PRE > 1 ? (PRE_ARR1 - PRE_ARR0) / (N_PRE - 1) : 0;

// THE RELEASE RUN: the rest of the money, evenly from "or" to the end of the
// line. The step is over a frame wide, so no two coins can ever land on the
// same frame, and the pile is still exactly RETURN_PEAK on f126.
export const RELEASE_ARR0 = 128;
export const RELEASE_ARR1 = 146;
export const RELEASE_STEP = N_POST > 1 ? (RELEASE_ARR1 - RELEASE_ARR0) / (N_POST - 1) : 0;
export const TAIL_P0 = 146;
export const TAIL_STEP = 8;

// Where a coin waits, and where it is going. Coins waiting on a tip sit in a
// row centred on it, whatever number that
// card's drop works out to, so a tip is never lopsided.
export const COINS_PER_CARD = Math.max(...MADE.map((c) => c.m));
// A slot, not a formula repeated: the frame that draws a waiting coin and the
// solver that works out how far it has to fly both call these, so a coin can
// never be drawn anywhere but where it is about to leave from.
export type Slot = { i: number; m: number };
export const coinRestX = (c: Slot, f: number) =>
  tipAt(c.i, f).x + (c.m - (COINS_PER_CARD + 1) / 2) * COIN_PITCH;
export const coinRestY = (c: Slot, f: number) => tipAt(c.i, f).y - COIN_LIFT;
export const coinDist = (c: Slot, f: number) =>
  Math.hypot(coinRestY(c, f) - MARK_BOTTOM, coinRestX(c, f) - originX(c.i));
export const coinDur = (c: Slot, f: number) => Math.max(1, Math.round(coinDist(c, f) / COIN_SPEED));

export type Coin = {
  n: number; // its place in the pile
  i: number;
  m: number;
  made: number;
  go: number;
  home: number;
  // WHERE it leaves from, FROZEN at the frame it leaves. Reading the tip's live
  // position instead stretches the path while the tip is still being dragged
  // under it, which both breaks the speed cap and reads as the coin being
  // dragged. A coin has let go; it does not drag.
  x0: number;
  y0: number;
};

export const COINS: Coin[] = (() => {
  const out: Coin[] = [];
  // ARRIVAL-KEYED, both runs: the pile climbs at one authored rate whatever each
  // card's distance from the mark is, so the arrival IS the number and the
  // launch is solved back from it — never before the frame the coin was made.
  // Two fixed-point steps, because how far the tip has been dragged when the
  // coin leaves sets how far the coin has to fly.
  const put = (c: Made, home: number) => {
    let go = home - coinDur(c, home - 20);
    for (let s = 0; s < 2; s++) go = Math.max(c.f + COIN_MINT, home - coinDur(c, go));
    out.push({ n: 0, i: c.i, m: c.m, made: c.f, go, home, x0: coinRestX(c, go), y0: coinRestY(c, go) });
  };
  MADE.filter(isPre).forEach((c, n) => put(c, PRE_ARR0 + n * PRE_STEP));
  MADE.filter((c) => !isPre(c)).forEach((c, n) => put(c, RELEASE_ARR0 + n * RELEASE_STEP));
  // the pile fills in arrival order, so the read of the pile and the read of
  // the row cannot drift apart
  out.sort((a, b) => a.home - b.home);
  out.forEach((c, n) => {
    c.n = RETURN_AFTER_DROP + n;
  });
  return out;
})();

export const HOME_F = COINS.map((c) => c.home).sort((a, b) => a - b);
export const stackCount = (f: number) => {
  let n = RETURN_AFTER_DROP;
  for (const h of HOME_F) if (f >= h) n++;
  return n;
};
// diagnostics, read back by the check script and quoted in the report
export const COUNT_AT_GOOD = stackCount(126);
export const COUNT_AT_END = stackCount(146);

// ---------------------------------------------------------------------------
// THE CAMERA. ONE curve, not four moves. Every one of k, the content centre and
// cx is authored as a SUM of eased ramps evaluated at every integer frame, and
// the sum is what the shared damper is handed. Summing rather than sequencing
// is the whole point: the pan's ramp is still running when the pull-back's ramp
// opens at f104, so cx bends from going right to coming back without ever
// passing through a stall, and k starts widening while the pan is still under
// way. A key per frame means the damper's target IS the eased curve.
//
// Both framings are SOLVED rather than typed. `frameFor` takes the top and the
// bottom of what has to be in shot and returns the largest k that fits that
// span inside the caption-safe band, plus the content centre that puts the
// span's middle at the middle of it (cy = c + CAM_LIFT/k, so zoom and framing
// settle together). The sweep framing has to hold the pile at RETURN_PEAK and
// the ground; the wide one has to hold the pile at N_FINAL and the ground,
// which is what sets how far the pull-back goes.
// ---------------------------------------------------------------------------
export const SAFE_TOP = 200;
export const SAFE_BOT = 1450;
export const SAFE_MID = (SAFE_TOP + SAFE_BOT) / 2;
export const frameFor = (top: number, bot: number, kMax: number) => {
  const k = Math.min(kMax, (SAFE_BOT - SAFE_TOP) / (bot - top));
  return { k, c: (top + bot) / 2 + (960 - SAFE_MID - CAM_LIFT) / k };
};

// V5: six cards span 600 world px where eight spanned 728, so the close half of
// the cut can sit tighter. 1.5 is not a taste number — it is what the pile at
// RETURN_PEAK and the ground fit inside the caption-safe band at, and it is
// also the widest k at which the whole row, the mark and the pile all stay on
// screen at both ends of the pan (checked at CX_LEFT and CX_RIGHT).
export const K_SWEEP_MAX = 1.5;
export const SWEEP_FRAME = frameFor(stackTopY(RETURN_PEAK), V4.GROUND_Y, K_SWEEP_MAX);
// K_WIDE is 1.00 and not the largest k that would fit: at any k above 1 the
// ground line's own ends — which ARE the house side margin, GROUND_X0/X1 — are
// pushed outside it. So the resolved frame is exactly the width of the market.
export const WIDE_FRAME = frameFor(stackTopY(N_FINAL), V4.GROUND_Y, 1.0);
export const K_SWEEP = SWEEP_FRAME.k;
export const C_SWEEP = SWEEP_FRAME.c;
export const K_WIDE = WIDE_FRAME.k;
export const C_WIDE = WIDE_FRAME.c;

// The close-up's two lateral ends. CX_LEFT is not the first card: at K_SWEEP
// the frame is 800 world px wide and the first card and the mark are 364 apart,
// so centring on the card alone hangs the mark off the right edge and parks the
// left third of the frame empty. These two put the wavefront near the middle of
// frame at both ends of the pan while the mark, with the pile growing on it,
// stays whole throughout.
// V5 KEEPS V4's 400/700. Deriving the pan from the row's width instead (the
// same 300/728 fraction, so 247 px across a 600 px row) was tried and rejected:
// it does pull card 0's worst overhang in from 129 px to 101, but it also puts
// the wavefront at screen x 258 and 800 at the two ends of the pan instead of
// 297 and 770, which is further from the middle of frame than V4 itself
// managed. At K_SWEEP 1.5 the frame is 720 world px wide against a 672 px row,
// so the trailing card leaves frame either way — as it did on V4, which went
// 153 px off at f100 against V5's 129. Centred wavefront wins.
export const CX_LEFT = 400;
export const CX_RIGHT = 700;
export const RIDE_SCREEN = 12; // "better": the camera creeps up with the pile
export const C_RIDE = C_WIDE - RIDE_SCREEN / K_WIDE;

// The five ramps, as [f0, f1, warp]. R_PAN opens at f46 and not after the push
// has finished: at f56 — the word it serves — the summed curve leaves the
// camera under 0.35 screen px/frame for f52-f58, which is a parked camera
// sitting exactly on the frames the first tip is being dragged. Opening it
// inside the push's tail costs nothing (the two ramps are summed, so the pan
// simply carries on out of the push) and the velocity scan then finds no frame
// in f5-f146 where the camera is still.
//
// THE ONE RAMP FRAME V5 MOVED: R_BACK opens at f96, not V4's f104. Its LANDING
// is still f126 and its warp is still 0.72 — what changed is that it now has to
// give back 0.5 of zoom instead of 0.35, and doing that in V4's 22 frames puts
// the damped camera at 27.3 screen px/frame, which pushes the one coin crossing
// the frame at the time (coin 12, card 0's second, leaving on f112) to 50.6
// px/frame — over the house cap. Spread over 30 frames the same pull-back peaks
// at 20.6 (under V4's own 21.3) and that coin tops out at 44.6. It also opens
// four frames before R_BACK_X, so k starts widening while the pan is still
// running, which is the behaviour the header describes.
export const R_PUSH: [number, number, number] = [4, 44, 0.72];
export const R_PAN: [number, number, number] = [46, 112, 1];
export const R_BACK: [number, number, number] = [96, 126, 0.72];
export const R_BACK_X: [number, number, number] = [100, 128, 1];
export const R_RIDE: [number, number, number] = [130, 148, 0.72];
const ramp = (f: number, [f0, f1, warp]: [number, number, number]) =>
  camEase(clamp01((f - f0) / (f1 - f0)), warp);

export const camK = (f: number) =>
  K_FINAL + (K_SWEEP - K_FINAL) * ramp(f, R_PUSH) + (K_WIDE - K_SWEEP) * ramp(f, R_BACK);
export const camC = (f: number) =>
  C_FINAL +
  (C_SWEEP - C_FINAL) * ramp(f, R_PUSH) +
  (C_WIDE - C_SWEEP) * ramp(f, R_BACK) +
  (C_RIDE - C_WIDE) * ramp(f, R_RIDE);
export const camCx = (f: number) =>
  MARK_X +
  (CX_LEFT - MARK_X) * ramp(f, R_PUSH) +
  (CX_RIGHT - CX_LEFT) * ramp(f, R_PAN) +
  (MARK_X - CX_RIGHT) * ramp(f, R_BACK_X);

export const CAM_F: number[] = [];
export const CAM_K: number[] = [];
export const CAM_CY: number[] = [];
export const CAM_CX: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const k = camK(f);
  CAM_F.push(f);
  CAM_K.push(k);
  CAM_CY.push(camC(f) + CAM_LIFT / k);
  CAM_CX.push(camCx(f));
}

// f0's camera IS cut 2's resolved camera, reached by two different routes —
// its own CY_FINAL, and this cut's content centre plus CAM_LIFT/k. If the join
// ever moves, this stops the render instead of quietly cutting on a jump.
if (Math.abs(CAM_CY[0] - CY_FINAL) > 1e-9) {
  throw new Error(
    `AsGoodOrBetterV5: f0 cy is ${CAM_CY[0]} but cut 2 resolved on ${CY_FINAL}`,
  );
}

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
  coinRadius: COIN_R5,
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

const AsGoodOrBetterV5: React.FC<Props> = ({
  ink,
  accent,
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
  // the mark's own amber dot, ticking to the half-step and back
  const strainTone = makeTone(accent, HALF_STEP);

  // -- camera ----------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame + CONTINUE_FROM);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the wake: the threads go live, the pile warms, the dot ticks ----------
  const wake = interpolate(frame, [beats.turns, beats.turns + WAKE_DUR], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const live = THREAD_IDLE + (THREAD_LIVE - THREAD_IDLE) * wake;
  const tick = frame >= beats.turns && frame < beats.turns + CLICK_INK ? 1 : 0;

  // -- the six price lines, this frame --------------------------------------
  const tips = Array.from({ length: N_CARDS }, (_, i) => {
    const drop = dropAt(i, frame);
    return { i, drop, ...priceTip(i, drop) };
  });

  // -- the money on the tips and on the wire --------------------------------
  // V5: a coin is MINTED at its tip — it scales in over COIN_MINT frames where
  // it will sit, while the tip is still being dragged down under it, so the
  // money is made by the fall and not delivered to it. It then waits there in
  // the DEEP tone, riding the tip down as the price is dragged further, and
  // warms to ripe over COIN_WARM frames as it lets go and climbs the thread at
  // COIN_SPEED to be absorbed at the mark's bottom edge. `warm` is the
  // crossfade: a deep coin under a ripe one whose opacity is the ramp, so the
  // tone changes without either coin's "$" flickering.
  const flying: { key: string; x: number; y: number; s: number; warm: number }[] = [];
  for (const c of COINS) {
    if (frame < c.made || frame >= c.home) continue;
    if (frame < c.go) {
      flying.push({
        key: `c${c.n}`,
        x: coinRestX(c, frame),
        y: coinRestY(c, frame),
        s: EASE_LAND(clamp01((frame - c.made) / COIN_MINT)),
        warm: 0,
      });
    } else {
      const u = clamp01((frame - c.go) / (c.home - c.go));
      flying.push({
        key: `c${c.n}`,
        x: c.x0 + (originX(c.i) - c.x0) * u,
        y: c.y0 + (MARK_BOTTOM - c.y0) * u,
        s: 1,
        warm: smoothstep(clamp01((frame - c.go) / COIN_WARM)),
      });
    }
  }

  // -- the pile on top of the mark ------------------------------------------
  // `warm` is cut 2's cooled coins coming back up to ripe on the wake ramp;
  // `half` is the 3-frame half-step an arrival of the release run wears — a
  // wash over the coin rather than a fill, so the "$" is never lost under it.
  const nStack = stackCount(frame);
  const piled: { n: number; x: number; y: number; s: number; warm: number; half: number }[] = [];
  for (let n = 0; n < nStack; n++) {
    const p = returnCoinPosV4(n);
    let s = 1;
    let half = 0;
    let warm = 1;
    if (n < RETURN_AFTER_DROP) {
      warm = wake;
    } else {
      const h = HOME_F[n - RETURN_AFTER_DROP];
      s = EASE_LAND(clamp01((frame - h) / COIN_GROW));
      if (frame >= h && frame < h + HALF_DUR) half = 1 - (frame - h) / HALF_DUR;
    }
    piled.push({ n, x: p.x, y: p.y, s, warm, half });
  }

  // -- the two ticks at the old peak ----------------------------------------
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
    const t = tips[i];
    const u = (frame - t0) / PACKET_DUR;
    const a = up ? { x: t.x, y: t.y } : { x: originX(i), y: MARK_BOTTOM };
    const b = up ? { x: originX(i), y: MARK_BOTTOM } : { x: t.x, y: t.y };
    packets.push({ key: `${tag}${n}`, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  };
  // The inherited stream, phased so it IS cut 2's: its launches are at
  // PACKET_F0 + n * PACKET_STEP on its own clock, which is that less
  // CONTINUE_FROM on this one, and the thread each bead takes is its own
  // hash(n, 5), so the beads mid-flight on f0 are exactly where cut 2 left them.
  for (let n = 0; ; n++) {
    const t0 = PACKET_F0 + n * PACKET_STEP - CONTINUE_FROM;
    if (t0 >= beats.turns) break;
    fly(n, t0, false, "d");
  }
  for (let n = 0; ; n++) {
    const t0 = beats.out + n * PACKET_STEP;
    if (t0 >= SWEEP_F0) break;
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
          reason the frame counter continues. */}
      <KraftBackground
        frame={frame + CONTINUE_FROM}
        cy={cy}
        cyRest={IW5_CAM_CY[0]}
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
                y1={V4.GROUND_Y}
                x2={GROUND_X1}
                y2={V4.GROUND_Y}
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

            {/* the threads: D1's hand on every price, idle until it wakes */}
            <g style={{ filter: icon }}>
              {tips.map((t) => (
                <line
                  key={`t${t.i}`}
                  x1={originX(t.i)}
                  y1={MARK_BOTTOM}
                  x2={t.x}
                  y2={t.y}
                  stroke={accent}
                  strokeWidth={THREAD_W}
                  strokeLinecap="round"
                  opacity={live}
                />
              ))}
            </g>

            {/* the ambient traffic, at the shared ceiling */}
            {packets.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={PACKET_R} fill={ink} opacity={AMBIENT} />
            ))}

            {/* the six prices, each with D1's thread on its tip. `held` is what
                draws the FALLEN leg in amber — the drop is the money. */}
            {tips.map((t) => (
              <PriceLine key={`p${t.i}`} i={t.i} drop={t.drop} held k={k} opacity={OP_READ} />
            ))}

            {/* the six companies, standing where they always stand */}
            {tips.map((t) => (
              <CompanyCard
                key={`k${t.i}`}
                x={cardX(t.i)}
                y={V4.CARD_Y}
                sector={SECTOR_SET[t.i]}
                size={cardSize}
                k={k}
                opacity={OP_READ}
              />
            ))}

            {/* the money the drops have paid out: minted at the tip in the deep
                tone, warmed to ripe as it lets go and climbs */}
            {flying.map((c) => (
              <g key={c.key}>
                <Coin x={c.x} y={c.y} r={coinRadius} ripe={false} scale={c.s} />
                {c.warm > 0.002 ? (
                  <Coin x={c.x} y={c.y} r={coinRadius} scale={c.s} opacity={c.warm} />
                ) : null}
              </g>
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
            {/* the return, piled on top of it. No per-icon shadow: a coin takes
                the global shadow only — same as cut 2, which is why f0 differs
                from its last frame by nothing but one frame of drift. Drawn
                here rather than through cut 2's `ReturnStack` because that
                scales only the single newest coin in, and the release run lands
                one every RELEASE_STEP frames against a COIN_GROW of 5, so up to
                five are mid-scale-in at once. The geometry, the radius, the ease
                and the coin itself are still shared. The half-step on a release
                arrival is a 3-frame WASH over the coin, never a fill: at 0.45 it
                reads as the same tick it was in V4 and the "$" stays legible
                through it, which a flat fill would have covered. */}
            {piled.map((p) => (
              <g key={`p${p.n}`}>
                <Coin x={p.x} y={p.y} r={coinRadius} ripe={false} scale={p.s} />
                {p.warm > 0.002 ? (
                  <Coin x={p.x} y={p.y} r={coinRadius} scale={p.s} opacity={p.warm} />
                ) : null}
                {p.half > 0.002 ? (
                  <circle cx={p.x} cy={p.y} r={coinRadius * p.s} fill={HALF_STEP} opacity={0.45 * p.half} />
                ) : null}
              </g>
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default AsGoodOrBetterV5;
