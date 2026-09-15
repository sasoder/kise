import { AbsoluteFill, useCurrentFrame } from "remotion";
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
  camEase,
  camMove,
  clamp01,
  iconShadow,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { KRAFT_BASE, KRAFT_BLUR, KRAFT_DIM, KRAFT_SRC, KraftBackground } from "./d1Shared";
import {
  BAND,
  BAND_AIR,
  CONTENT,
  CONTENT_CY_FINAL,
  CX_FINAL,
  CoinDefs,
  FIELD_COINS,
  FieldCoin,
  K_FINAL,
  MAP,
  MARK_POS,
  MARK_SIZE_RAMP,
  N_FIELD,
  N_LIT,
  ORDER_WINDOW,
  PATCH_POS,
  RampMark,
  SEED,
  SEED_POS,
  THREAD_FROM,
  THREAD_LIVE,
  THREAD_W,
  coinBreath,
  coinLitBump,
  orderRadius,
  strain,
} from "./rampShared";

// ---------------------------------------------------------------------------
// CUT 1 — "TwoPercentOfTransactions". Cheeky Pint on kraft, opaque, 24fps,
// 1080x1920. The first of the three Ramp cuts; it writes the world the other
// two open on (`rampShared.tsx`).
//
// THE LINE (Eric Glyman, Ramp, on Cheeky Pint):
//   "I believe today Ramp powers more than 2% of all corporate and small
//    business card transactions in the United States,"
//
// SRT span 0.000 -> 6.759. round(6.759 * 24) = round(162.2) = 162 frames of
// speech, plus a 16-frame tail so the resolved picture holds = 178.
//
// WORD ONSETS (frames from 0.000)
//   f0 I · f4 believe · f12 today · f30 Ramp · f35 powers · f48 more ·
//   f59 than · f62 2% (to f75) · f75 of · f83 all · f89 corporate · f99 and ·
//   f108 small · f114 business · f122 card · f128 transactions · f142 in ·
//   f146 the · f152 united states (to f162) · speech ends f162 · tail to f178.
//
// ---------------------------------------------------------------------------
// THE PICTURE — ONE MOTION: a touch that spreads, a camera that dives into it
// and then rises to show the country.
//
// The United States is a field of 2,441 coins (`rampShared`): one coin per hex
// cell inside the contiguous-US outline, 11 px pitch, jittered. A coin is a
// card transaction. Amber is what Ramp has touched and nothing else, so the
// amber count IS the number in the line: N_LIT = round(0.02 * 2441) = 49.
// There is no numeral, no label, no pie, no bar and no stroke around the map;
// the quantity is read off the picture or it is not there.
//
// PHASES — all of it is one arc; the words are inflections in it.
//
//   0 · THE DULL PART                                           f0 -> f30
//     The camera is tight on the northeast: the Ramp disc at the top right, a
//     field of white coins below and left of it, nothing amber. It is never
//     parked — k creeps K_OPEN -> K_CREEP across f0-f34 and every coin breathes
//     on its own phase.
//
//   1 · "Ramp" f30                                              f30 -> f34
//     The cut's ONE single-object ink click: the disc's tile goes to flat white
//     at full opacity for 4 frames and back. Nothing else moves.
//
//   2 · "powers" f35 — THE REACH AND THE SPREAD                 f35 -> f150
//     A thread grows head-led out of the disc's bottom edge (`THREAD_FROM`) to
//     the seed coin — New York, where Ramp is — on `flow(a = 0.1)`, exactly
//     BackIntoItV5's thread draw, arriving on f46. THE MOMENT IT ARRIVES the
//     seed goes amber with `coinLitBump`, and from that frame one curve carries
//     the lit count from 1 to 49 across f46 -> f150. Each coin lights when its
//     `order` is reached — never on a timer — and its order is
//     `hop + ORDER_JITTER*hash`, so the front is ragged rather than a drawn
//     circle. The spread is still running under everything else in the cut, and
//     its last ring lands on f150.
//
//   3 · "more than 2%" f48-f75 — THE DIVE                       f48 -> f80
//     Two frames after the spread starts, the camera reacts: k K_CREEP ->
//     K_DIVE (2.38 -> 14.13), content centre -> the lit patch, keys f48-f74 on
//     warp 0.72, settled by ~f80. "more than 2%" plays over the plunge, and it
//     lands on a screen full of money — coins r 65 screen px with a legible "$",
//     a frame 76 world px wide, seven coins across — with the amber front
//     eating outward through it.
//
//   4 · "of all corporate and small business card transactions" — THE RISE
//                                                                f84 -> f147
//     One move: k K_DIVE -> K_FINAL, centre -> the whole picture's centre, keys
//     f84-f139 on warp 0.85, within 1% by f144 — eight frames ahead of "united
//     states" (f152). The coastline enters the frame under "corporate", and the
//     mark and its thread come back in from the top right under "card". The
//     amber never stops spreading while the frame opens, and the last ring
//     lights on f150 as the frame settles: the payoff — 2% is THIS much of THAT
//     — lands in the last third of the words.
//
//   5 · HELD                                                    f150 -> f178
//     The patch's outer ring strains 1.5 px toward the next white ring on
//     hashed phases, every coin breathes <= 3%, the thread is live at 0.95 and
//     the camera rides `sway`. Nothing fades.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE CUT BRIEF — five, all forced by the brief's own rules.
//
//  A. THE OPENING k IS 2.20, NOT 3.5. The brief asks for the thread to draw
//     THREAD_FROM -> the seed in 11 frames on "powers". That thread is 185.1
//     world px long, and `flow(a = 0.1)` peaks at 1.111x its average, so its
//     head runs 18.70 world px a frame at its fastest. The house cap is 45
//     SCREEN px a frame, so the camera cannot be above k 2.41 while it draws —
//     K_CREEP is solved off exactly that and the head measures 44.8. At k 3.5
//     the same head measures 65 px a frame. The alternatives were both worse:
//     starting the thread on "Ramp" (f30) to buy 16 frames leaves "powers" with
//     nothing on it and puts the arrival 11 frames off its word, and stretching
//     the draw past f46 pushes the spread — and therefore the dive, and
//     therefore the payoff — out of the line. So the opening frame is 491 x 873
//     world instead of 309 x 549: still the northeast, still the mark alone at
//     the top right over white coins, still nothing amber.
//
//  B. THE DIVE GOES TO k 14.13, NOT k 8. The brief wants the amber to fill the
//     frame edge to edge at the bottom of the dive. That cannot happen at k 8,
//     and it is arithmetic rather than taste: the lit count is fixed at 2% of
//     the field, so the patch's area is fixed at 0.02 * 255,790 world px^2 and
//     its radius can never exceed ~46 px whatever the pitch is, while k 8 shows
//     a frame 135 px wide — the patch tops out at 40% of it and at the landing
//     it is 28%. k 14.13 shows 76 px: the patch covers 58% of the width when
//     the rise leaves and is still eating white coins at the edges, which is
//     the picture the brief is describing, and it keeps the mechanism visible
//     (a wall of solid amber shows nothing happening). K_DIVE is not typed —
//     it is the deeper of "fill the width" (K_DIVE_IDEAL 18.6) and what the
//     scenery speed allows, and the second one binds.
//
//  C. THE DIVE LANDS ON THE PATCH, NOT ON THE SEED, and the opening centre is
//     hung off the mark rather than set to the mark/seed midpoint. Both are
//     framing: New York is ON the coast, so a frame centred there is two fifths
//     Atlantic, and a frame centred on the mark/seed midpoint puts the mark in
//     the middle with the ocean filling the right half. Argued at C_OPEN_X1 and
//     at PATCH_POS.
//
//  D. THE RESOLVED CENTRE IS x 556, NOT 540. Argued in `rampShared` where
//     K_FINAL is solved: 540 is the MAP's centre and the mark hangs 32 px off
//     its right, so centring there leaves the mark 8 px of air inside the band
//     instead of the 40 the brief asks for. Measured on the render across all
//     28 held frames, the resolved ink is x 100-974, y 560-1102: 40 px of air
//     on the left, 46 on the right, 360 above and 348 below.
//
//  E. THE TWO BIG MOVES INTERPOLATE k IN LOG SPACE, not through `camMove`.
//     Argued at `logMove`. Everything else about them is `camMove`'s.
//
// ---------------------------------------------------------------------------
// REVISION PASS — `ORDER_JITTER` 0.8 -> 0.35 (rampShared). IT IS A NO-OP, and
// nothing in this file moved with it. Recorded here because the next person to
// look at the interior of the amber patch needs to know why.
//
//   The light-up order sorts on `hop + ORDER_JITTER * hash(i, 7)`, and `hash`
//   returns [0, 1). For ANY jitter in (0, 1) that key is just the lexicographic
//   order (hop, then hash): a coin can never overtake one a whole hop ring
//   closer in, because the most the jitter can add is less than one hop. So the
//   permutation at 0.35 is the permutation at 0.8, element for element — checked
//   on the real 2,441-coin field, and the two half-res renders are identical
//   frame for frame (max per-frame luma difference 0 on all 178). Only a jitter
//   >= 1 changes anything at all.
//
//   Everything this cut solves off the order is therefore unchanged: PATCH_POS
//   (the lit set is the same 49 coins, centroid 863.92, 767.43), orderRadius and
//   so K_DIVE_IDEAL (18.61), the LIT_FRAME table and every camera landing.
//   K_DIVE never depended on the order in the first place — the EDGE_CAP branch
//   binds at 14.13 and it is made of K_CREEP, the window and the damper.
//
//   WHAT THE WHITE HOLES ACTUALLY ARE, measured (a hole = an unlit coin with >=
//   4 of its six hex neighbours lit):
//     * 1-3 of them, at f70, f74, f90, f100 and f150. They are coins whose BFS
//       `hop` overshoots their geometry: the +/-1.2 px jitter can stretch a hex
//       edge past ADJ_MAX (12.65) and drop it, so the coin is reached the long
//       way round and lights a whole ring late while its neighbours are already
//       amber. Ranking the order on DISTANCE from the seed instead of on `hop`
//       (`d / FIELD_PITCH + ORDER_JITTER * hash`) takes that count to 0 on every
//       frame of the cut, and makes ORDER_JITTER mean what its name says — the
//       rim's raggedness in ring widths. That is a rampShared change and is left
//       to the director.
//     * The rest of what reads as speckle is not holes at all, it is RIM. The
//       hop rings off this seed hold 1, 3, 7, 12, 14 and 18 coins (New York is
//       on the coast, so they are half rings), and N_LIT is only 49 — so the
//       outermost, half-filled ring is 40-70% of the whole patch at every frame
//       of the dive (f74: 19 amber, 8 of them in a half-lit ring of 12, with 13
//       ragged white coins touching them). A patch that small has almost no
//       interior to be solid. The only thing that buys one is more coins in it:
//       N_LIT is pinned at 2%, so it takes a finer FIELD_PITCH (~7.7 gives
//       N_FIELD ~5,000 and N_LIT ~100, and the rim falls to a quarter of the
//       patch), or a shallower dive than k 14.13, where the frame is 7 coins
//       wide and the rim is most of what is on screen.
//
// THE FRAME TABLE (as built, verified against the render)
//   f0           open: k 2.20, content centre (835.1, 728) — the mark's own frame
//   f0  -> f34   the creep, k 2.20 -> 2.38, centre -> (827.1, 756); spent by ~f40
//   f30 -> f33   the ink click on the mark (tile +6.3% mean, measured)
//   f35 -> f46   the thread draws, 185.1 world px, head peak 44.8 screen px/f
//   f46          it arrives; the seed lights; the spread starts (n = 1)
//   f48 -> f74   the dive's keys, k 2.38 -> 14.13, centre -> PATCH_POS, warp 0.72
//   f61          the dive's fastest frame: 62.0 screen px/f at the frame's edge
//   f80 -> f84   the camera's one held breath, 4 frames
//   f84 -> f139  the rise's keys, k 14.13 -> 0.958, centre by the offset rule,
//                warp 0.85
//   f144         the camera is within 1% of K_FINAL (0.83%), 8 frames ahead of
//                "united states"; 0.30% by f146, 0.01% by f150
//   f150         the last ring lights; n = 49 = N_LIT
//   f150 -> f178 held: the outer ring strains, coins breathe, the camera sways
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 178;

export const WORLD_W = 1080;
export const WORLD_H = 1450;

// -- the beat table ---------------------------------------------------------
export const BEATS = {
  i: 0,
  believe: 4,
  today: 12,
  ramp: 30, // the ink click
  powers: 35, // the thread leaves
  more: 48, // the camera reacts, two frames after the spread starts
  than: 59,
  twoPercent: 62, // the dive is at its deepest travel under this word
  of: 75,
  all: 83,
  corporate: 89, // the coastline enters the frame
  and: 99,
  small: 108,
  business: 114,
  card: 122, // the mark and the thread are back in frame
  transactions: 128,
  inW: 142,
  the: 146,
  unitedStates: 152, // the resolved picture
  end: 162,
} as const;

// -- the reach --------------------------------------------------------------
// The thread's length is geometry, not a number: the disc's bottom edge to the
// seed. Its head runs `flow(a = DRAW_A)`, BackIntoItV5's ease, whose peak is
// 1/(1 - DRAW_A) = 1.111x its average — which is the whole reason the opening
// k can be as high as it is (deviation A above).
export const F_CLICK = BEATS.ramp;
export const CLICK_DUR = 4;
export const MARK_OP = 0.9; // the house's OP_READ; the click lifts it to 1
export const F_THREAD0 = BEATS.powers;
export const F_TOUCH = 46;
export const THREAD_LEN = Math.hypot(SEED_POS.x - THREAD_FROM.x, SEED_POS.y - THREAD_FROM.y);
export const DRAW_A = 0.1;
export const HEAD_R = 3;

const flow = (u: number, a: number = DRAW_A) => {
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

// -- the spread -------------------------------------------------------------
// ONE curve from the seed to the last ring. `camEase` is the same warped
// smoothstep the camera moves on, so the spread and the camera are made of the
// same thing; SPREAD_WARP < 1 puts the speed early — fast out of the seed,
// easing into the last ring — without giving the profile a corner.
export const F_LIT0 = F_TOUCH;
export const F_LIT1 = 150;
export const SPREAD_WARP = 0.66;

export const litCountAt = (f: number) =>
  1 + (N_LIT - 1) * camEase((f - F_LIT0) / (F_LIT1 - F_LIT0), SPREAD_WARP);

// The inverse, solved rather than scanned: the frame each ORDER lights. A coin
// changes state because the front reaches it, so this array is the mechanism —
// nothing in the cut fires on a timer.
const invSmoothstep = (y: number) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp01(y)) / 3);
export const LIT_FRAME: Float64Array = (() => {
  const out = new Float64Array(N_LIT);
  for (let o = 0; o < N_LIT; o++) {
    const g = o / (N_LIT - 1);
    const u = Math.pow(invSmoothstep(g), 1 / SPREAD_WARP);
    out[o] = F_LIT0 + (F_LIT1 - F_LIT0) * u;
  }
  return out;
})();

/** How many coins are lit on this frame — counted off `LIT_FRAME`, so the
 *  picture and the count can never disagree. */
export const litAt = (f: number) => {
  let n = 0;
  while (n < N_LIT && LIT_FRAME[n] <= f) n++;
  return n;
};

// The front's radius in world px, read off the field's own order statistics.
export const frontRadius = (f: number) => orderRadius(Math.max(1, litAt(f)));

export const STRAIN_IN = 8; // frames a coin takes to join the straining ring

// -- the camera -------------------------------------------------------------
// Three segments through one damped `runCamera`, one key per frame, cy taken
// off the eased k so the content centre sits on screen y 835 at every zoom.
// cx has its own key-per-frame track through the SAME damper (the hurricane's
// pattern: `runCamera` with an inert k channel), because `camMove` only carries
// cy and k.
//
// K_OPEN / K_CREEP are the thread's cap, solved: the head's peak world speed is
// THREAD_LEN / (F_TOUCH - F_THREAD0) / (1 - DRAW_A), and k * that must stay
// under 45.
export const HEAD_PEAK_WORLD = THREAD_LEN / (F_TOUCH - F_THREAD0) / (1 - DRAW_A);
export const SPEED_CAP = 45;
export const K_CREEP = Math.floor((100 * (SPEED_CAP - 0.5)) / HEAD_PEAK_WORLD) / 100; // 2.38
export const K_OPEN = Math.round(K_CREEP * 0.925 * 100) / 100; // 2.2 — a 7.5% creep, never parked

// THE OPENING FRAME, solved rather than typed. The subject is the mark, so the
// frame is hung off it: its right edge sits BAND_AIR inside the band's right
// edge, and its top edge BAND_AIR inside the band's top, both at K_CREEP. The
// brief's "about (920, 690)" is the mark/seed midpoint, which puts the mark in
// the middle of the frame with the Atlantic filling the right half; this puts
// the mark in the top right corner where the brief says it is, with the field
// running away from it to the left and down.
export const C_OPEN_X1 =
  MARK_POS.x + MARK_SIZE_RAMP / 2 - (BAND.X1 - BAND_AIR - 540) / K_CREEP;
export const C_OPEN_Y1 =
  MARK_POS.y - MARK_SIZE_RAMP / 2 + (835 - BAND.Y0 - BAND_AIR) / K_CREEP;
// The creep's start: 8 px right and 28 px above where it lands, so the 34
// frames before "Ramp" are a slow settle DOWN onto the field and IN, and no
// frame of the dull part is a still one. At ~3 screen px a frame it is the
// smallest drift that still reads as drift.
export const C_OPEN_X0 = C_OPEN_X1 + 8;
export const C_OPEN_Y0 = C_OPEN_Y1 - 28;
export const F_CREEP1 = 34;

// The dive, solved between two pictures it has to make.
//
// K_DIVE_IDEAL is the zoom at which the amber front's DIAMETER exactly fills
// the frame's width on the frame the rise leaves — "a screen full of amber
// money", read off the field's own order statistics rather than typed.
//
// EDGE_CAP is what stops it going that deep. Under a zoom every static coin
// moves, at 540 * d(ln k)/df screen px a frame at the frame's edge (the house's
// 45 px cap is for tracked heads — a thread tip, a coin in flight, the front —
// and PowerTheEntireUs's approved 19x pull-back runs its scenery at 79; this
// field is discrete coins rather than a photograph, so it gets a tighter one).
// `camEase` at warp 0.72 peaks at g' = 1.483, so the deepest dive this window
// allows is K_CREEP * exp(EDGE_CAP * span / (540 * 1.483)).
//
// IT LANDS ON `PATCH_POS`, NOT ON THE SEED (a deviation from the brief, argued
// in rampShared): New York is on the coast and the front spreads inland, so the
// lit patch's centre of mass ends up 13 world px north west of the seed — 170
// screen px at this zoom, which is the difference between a frame full of money
// and a frame two fifths of which is the Atlantic.
export const F_RISE0 = 84; // "all" — four frames of held breath after the dive settles
export const F_DIVE1 = 74;
export const DIVE_WARP = 0.72;
export const CAM_EASE_PEAK = 1.483; // max g'(u) of camEase(u, 0.72)
export const EDGE_CAP = 62;
// The damper does not follow the eased target exactly — it lags, then catches
// up, and while it is catching up its own d(ln k)/df runs ABOVE the target's.
// Measured on this cut's first build: the target predicted 62 screen px a frame
// at the frame's edge and the render delivered 77. With both big moves now in log space (below) the
// measured factor is 1.13; the solve carries it, so EDGE_CAP is the number the
// RENDER hits rather than the number the keys ask for.
export const DAMP_OVERSHOOT = 1.13;
export const K_DIVE_IDEAL = 540 / frontRadius(F_RISE0);
export const F_DIVE0 = BEATS.more;
export const K_DIVE =
  Math.round(
    100 *
      Math.min(
        K_DIVE_IDEAL,
        K_CREEP *
          Math.exp((EDGE_CAP * (F_DIVE1 - F_DIVE0)) / (540 * CAM_EASE_PEAK * DAMP_OVERSHOOT)),
      ),
  ) / 100;
export const F_RISE1 = 139;
export const RISE_WARP = 0.85;

export const CY_FINAL = CONTENT_CY_FINAL + CAM_LIFT / K_FINAL;

// BOTH BIG MOVES INTERPOLATE k IN LOG SPACE. `camMove` lerps k itself, which is
// right for the 1.15 -> 1.40 pushes the other Cheeky Pint cuts make and wrong
// here: apparent size is proportional to k, so a 12.6x pull-back lerped in k
// spends most of its visible change in the first third and then, because the
// frame-edge speed is 540 * (dk/df) / k, SPEEDS UP again at the end as k goes
// small. Measured on the linear build: the pull-back's frame-edge speed peaked
// at 70.8 px a frame at f132, seven eighths of the way through the move, which
// is exactly where a pull-back should be settling. In log space the same move
// reads at one rate and its peak sits where the ease puts it.
// (`PowerTheEntireUs` reached the same conclusion for its 19x pull-back.)
// Everything else is `camMove`'s: one key per frame, and cy taken off the eased
// k so the content centre holds screen y 835 at every zoom.
const logMove = ({
  f0,
  f1,
  k0,
  k1,
  c0,
  c1,
  warp,
}: {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  warp: number;
}) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const span = f1 - f0;
  const l0 = Math.log(k0);
  const l1 = Math.log(k1);
  for (let i = 0; i <= span; i++) {
    const g = camEase(i / span, warp);
    const k = Math.exp(l0 + (l1 - l0) * g);
    F.push(f0 + i);
    K.push(k);
    CY.push(c0 + (c1 - c0) * g + CAM_LIFT / k);
  }
  return { F, K, CY };
};

// THE RISE'S PAN IS NOT A LERP BETWEEN TWO CENTRES. A pan eased on the same
// curve as the zoom outruns it: measured on the first build, the frame had
// walked 158 world px west by f110 while k was still 7.1, and the amber — the
// entire subject of the cut — was off the right-hand edge from f105 to f126.
// (PowerTheEntireUs hit the same thing and fixed it by starting its pan eight
// frames late.) Here the fix is exact instead of delayed: the patch KEEPS ITS
// PLACE IN THE FRAME, and its screen offset from the frame's centre grows at
// the rate the country appears —
//     offset(q) = q * (PATCH_POS.x - CX_FINAL) * K_FINAL   screen px
//     cx(q)     = PATCH_POS.x - offset(q) / k(q)
// which is PATCH_POS at q = 0 and exactly CX_FINAL at q = 1, and in between
// slides New York out to its place on the right as the map opens under it. The
// same rule carries the content centre in y.
const RISE = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const X: number[] = [];
  const span = F_RISE1 - F_RISE0;
  const offX = (PATCH_POS.x - CX_FINAL) * K_FINAL;
  const offY = (PATCH_POS.y - CONTENT_CY_FINAL) * K_FINAL;
  const l0 = Math.log(K_DIVE);
  const l1 = Math.log(K_FINAL);
  for (let i = 0; i <= span; i++) {
    const q = camEase(i / span, RISE_WARP);
    const k = Math.exp(l0 + (l1 - l0) * q);
    F.push(F_RISE0 + i);
    K.push(k);
    X.push(PATCH_POS.x - (offX * q) / k);
    CY.push(PATCH_POS.y - (offY * q) / k + CAM_LIFT / k);
  }
  return { F, K, CY, X };
})();

const CREEP = camMove({
  f0: 0,
  f1: F_CREEP1,
  k0: K_OPEN,
  k1: K_CREEP,
  c0: C_OPEN_Y0,
  c1: C_OPEN_Y1,
  warp: 1,
});
const DIVE = logMove({
  f0: F_DIVE0,
  f1: F_DIVE1,
  k0: K_CREEP,
  k1: K_DIVE,
  c0: C_OPEN_Y1,
  c1: PATCH_POS.y,
  warp: DIVE_WARP,
});

const HOLD1 = F_DIVE0 - 1; // the creep's value carried to the frame before the dive
const HOLD2 = F_RISE0 - 1; // the dive's value carried to the frame before the rise

export const CAM_F = [...CREEP.F, HOLD1, ...DIVE.F, HOLD2, ...RISE.F, DURATION];
export const CAM_K = [...CREEP.K, K_CREEP, ...DIVE.K, K_DIVE, ...RISE.K, K_FINAL];
export const CAM_CY = [
  ...CREEP.CY,
  C_OPEN_Y1 + CAM_LIFT / K_CREEP,
  ...DIVE.CY,
  PATCH_POS.y + CAM_LIFT / K_DIVE,
  ...RISE.CY,
  CY_FINAL,
];

const CAMX = (() => {
  const F: number[] = [];
  const X: number[] = [];
  for (let i = 0; i <= F_CREEP1; i++) {
    F.push(i);
    X.push(C_OPEN_X0 + (C_OPEN_X1 - C_OPEN_X0) * camEase(i / F_CREEP1, 1));
  }
  F.push(HOLD1);
  X.push(C_OPEN_X1);
  for (let i = 0; i <= F_DIVE1 - F_DIVE0; i++) {
    F.push(F_DIVE0 + i);
    X.push(C_OPEN_X1 + (PATCH_POS.x - C_OPEN_X1) * camEase(i / (F_DIVE1 - F_DIVE0), DIVE_WARP));
  }
  F.push(HOLD2);
  X.push(PATCH_POS.x);
  RISE.F.forEach((f, i) => {
    F.push(f);
    X.push(RISE.X[i]);
  });
  F.push(DURATION);
  X.push(CX_FINAL);
  return { F, X, K: F.map(() => 1) };
})();
export const CAMX_F = CAMX.F;
export const CAMX_X = CAMX.X;
export const CAMX_K = CAMX.K;

export const camAt = (f: number) => {
  const c = runCamera(f, CAM_F, CAM_CY, CAM_K);
  const x = runCamera(f, CAMX_F, CAMX_X, CAMX_K).cy;
  return { k: c.k, cy: c.cy, cx: x };
};

/** Where a world point lands on screen at frame f, sway included. The velocity
 *  scan reads every speed off this, so the scan and the render cannot drift. */
export const screenAt = (f: number, x: number, y: number) => {
  const cam = camAt(f);
  const d = sway(f);
  const { tx, ty } = worldTransform(cam.cx + d.dx, cam.cy + d.dy, cam.k);
  return { x: tx + x * cam.k, y: ty + y * cam.k, k: cam.k };
};

/** The thread's far end at frame f: its own head while it draws, the seed after. */
export const threadEnd = (f: number) => {
  if (f >= F_TOUCH) return { x: SEED_POS.x, y: SEED_POS.y, drawing: false };
  const g = flow(clamp01((f - F_THREAD0) / (F_TOUCH - F_THREAD0)));
  return {
    x: THREAD_FROM.x + (SEED_POS.x - THREAD_FROM.x) * g,
    y: THREAD_FROM.y + (SEED_POS.y - THREAD_FROM.y) * g,
    drawing: true,
  };
};

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
  markSize: z.number(),
  beats: z.object({
    i: z.number(),
    believe: z.number(),
    today: z.number(),
    ramp: z.number(), // the ink click on the mark
    powers: z.number(), // the thread leaves the mark
    more: z.number(), // the camera reacts to the spread
    than: z.number(),
    twoPercent: z.number(), // the dive's deepest travel
    of: z.number(),
    all: z.number(),
    corporate: z.number(), // the coastline enters the frame
    and: z.number(),
    small: z.number(),
    business: z.number(),
    card: z.number(), // the mark is back in frame
    transactions: z.number(),
    inW: z.number(),
    the: z.number(),
    unitedStates: z.number(), // the resolved picture
    end: z.number(), // speech ends; tail to 178
  }),
});

export type Props = z.infer<typeof schema>;

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
  markSize: MARK_SIZE_RAMP,
  beats: BEATS,
});

const TwoPercentOfTransactions: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  // backgroundSrc / backgroundBlur / backgroundDim stay in the schema so the
  // three cuts are configured identically, but `KraftBackground` owns the kraft
  // sheet's own values (d1Shared) and takes none of them.
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  markSize,
}) => {
  const frame = useCurrentFrame();

  // -- camera ---------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the spread -----------------------------------------------------------
  const lit = litAt(frame);
  const frontN = Math.max(1, lit);

  // -- the reach ------------------------------------------------------------
  const end = threadEnd(frame);
  const threadOn = frame >= F_THREAD0;
  const clicked = frame >= F_CLICK && frame < F_CLICK + CLICK_DUR;

  // -- the coins ------------------------------------------------------------
  // Two passes so an amber coin's pop can never be clipped by a white
  // neighbour drawn after it. The white pass is the whole field minus the lit
  // ones; both are `<use>` of the same three symbols.
  const white: React.ReactNode[] = [];
  const amber: React.ReactNode[] = [];
  for (let i = 0; i < N_FIELD; i++) {
    const c = FIELD_COINS[i];
    const breathe = coinBreath(frame, i);
    if (c.order < N_LIT && frame >= LIT_FRAME[c.order]) {
      const age = frame - LIT_FRAME[c.order];
      // the outer ring leans toward the next white ring; a coin joins that ring
      // as the front passes it and leaves it as the front moves on
      const w =
        smoothstep((c.order - (frontN - ORDER_WINDOW)) / ORDER_WINDOW) *
        smoothstep(age / STRAIN_IN);
      const lean = w === 0 ? 0 : strain(frame, i);
      const dx = c.x - SEED_POS.x;
      const dy = c.y - SEED_POS.y;
      const r = Math.hypot(dx, dy) || 1;
      amber.push(
        FieldCoin({
          i,
          state: "amber",
          scale: coinLitBump(age) * breathe,
          dx: (dx / r) * lean,
          dy: (dy / r) * lean,
        }),
      );
    } else {
      white.push(FieldCoin({ i, state: "ink", scale: breathe }));
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={C_OPEN_X0}
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
            <CoinDefs k={k} />

            {/* Ramp reaching New York. It is drawn UNDER the field, so the
                coins it passes occlude it and it plugs into the seed rather
                than lying across the money: at the dive's k the thread is 33
                screen px wide and on top it read as a bar painted over the
                patch. */}
            {threadOn ? (
              <g style={{ filter: icon }}>
                <line
                  x1={THREAD_FROM.x}
                  y1={THREAD_FROM.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={accent}
                  strokeWidth={THREAD_W}
                  strokeLinecap="round"
                  opacity={THREAD_LIVE}
                />
                {end.drawing ? (
                  <circle cx={end.x} cy={end.y} r={HEAD_R} fill={ink} opacity={THREAD_LIVE} />
                ) : null}
              </g>
            ) : null}

            {/* the country, in money. No outline, no ground, no stroke: the
                coast is where the coins stop. */}
            <g>{white}</g>
            <g>{amber}</g>

            {/* Ramp. It never moves; the one ink click in the cut is on it. */}
            <RampMark
              x={MARK_POS.x}
              y={MARK_POS.y}
              size={markSize}
              k={k}
              opacity={clicked ? 1 : MARK_OP}
              bright={clicked}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default TwoPercentOfTransactions;

// The joins the cut rests on, asserted so a change to a window or an ease
// cannot quietly turn one motion into two or slide the payoff off its word.
if (Math.abs(LIT_FRAME[0] - F_TOUCH) > 0.01) {
  throw new Error(
    `TwoPercentOfTransactions: the seed lights on f${LIT_FRAME[0].toFixed(2)}, not on the thread's arrival (f${F_TOUCH})`,
  );
}
if (Math.abs(LIT_FRAME[N_LIT - 1] - F_LIT1) > 0.01) {
  throw new Error(
    `TwoPercentOfTransactions: the last ring lights on f${LIT_FRAME[N_LIT - 1].toFixed(2)}, not f${F_LIT1}`,
  );
}
if (litAt(DURATION) !== N_LIT) {
  throw new Error(
    `TwoPercentOfTransactions: ${litAt(DURATION)} coins are lit at the end, not N_LIT (${N_LIT})`,
  );
}
if (HEAD_PEAK_WORLD * K_CREEP > SPEED_CAP) {
  throw new Error(
    `TwoPercentOfTransactions: the thread head peaks at ${(HEAD_PEAK_WORLD * K_CREEP).toFixed(1)} screen px/frame, over the ${SPEED_CAP} cap`,
  );
}
// The resolved picture has to sit inside the house band with its air.
{
  const c = camAt(DURATION);
  const x0 = 540 + (CONTENT.x0 - c.cx) * c.k - 3;
  const x1 = 540 + (CONTENT.x1 - c.cx) * c.k + 3;
  const y0 = 960 + (CONTENT.y0 - c.cy) * c.k - 5;
  const y1 = 960 + (CONTENT.y1 - c.cy) * c.k + 5;
  if (x0 < 100 || x1 > 980 || y0 < 240 || y1 > 1410) {
    throw new Error(
      `TwoPercentOfTransactions: the resolved picture is x ${x0.toFixed(0)}-${x1.toFixed(0)}, y ${y0.toFixed(0)}-${y1.toFixed(0)} — outside the band plus 40 px of air`,
    );
  }
}
// MAP.Y1 is solved from the plate, not typed; if the outline file changes the
// whole field moves and every camera key with it.
if (Math.abs(MAP.Y1 - 1070.89) > 0.05 || SEED >= N_FIELD) {
  throw new Error(`TwoPercentOfTransactions: the map resolved to Y1 ${MAP.Y1.toFixed(2)}, not 1070.89`);
}
