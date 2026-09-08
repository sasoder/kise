import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  sway,
  worldTransform,
} from "./fieldShared";
// The column, the type, the bar, the bond row, the coupon slots and the two
// Söhne faces are all `explainerShared`: cut 3 opens this exact composition six
// seconds earlier in the edit, so not one of those numbers is written twice.
import {
  BAR_ROWS,
  BAR_TOP,
  BILL_D,
  BOND_CY,
  BOND_PITCH,
  COLUMN_CX,
  COUNTER_Y,
  DEBT_LABEL_Y,
  HUNDRED,
  LABEL_FADE,
  LABEL_OP,
  PAY_ARC,
  RATE_DASH,
  RATE_LABEL_Y,
  RATE_STROKE,
  RATE_Y,
  READOUT_Y,
  REVENUE_LABEL_Y,
  SCENE_CY,
  SCENE_K,
  SUBLABEL_Y,
  TRAVEL_DUR,
  arcAt,
  barDotR,
  barX,
  barY,
  couponAt,
  litIndex,
  litSeat,
  makeLabel,
  makeReadout,
  rankBy,
  rowX,
  travellerR,
} from "./explainerShared";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Debt_Crisis`, the explainer cut that REPLACES cut 4
// (`RollsOver.tsx`): "Now a lot of debt is short duration, so every five years
// it rolls over. Suppose interest rates rise 1%. Then over a five-year basis,
// the fraction of tax revenue that goes towards servicing the debt basically
// goes from 20 to 25. If it rises five percentage points, that would go
// towards, like, north of 40. But if you take into account the fact that the
// government is borrowing 2 trillion every single year, then that goes from
// like 40 to like north of 60. So 60% of tax revenue basically just goes
// towards paying interest payments on the debt."
//
// SRT span 38.299 -> 64.459 at 24fps.
// round((64.459 - 38.299) * 24) = round(26.16 * 24) = round(627.84) = 628
// frames of speech, plus a 16 frame tail so the resolved state holds = 644.
export const DURATION = 644;

// ---------------------------------------------------------------------------
// The arithmetic, made countable. Cut 4 was rebuilt because the mechanism did
// not read: the goal here is only that it is easy to understand and follow, so
// every number he says is a COUNT ON SCREEN, the frame never reframes while the
// arithmetic runs, and three labels say which zone is which.
//
// The model, in three zones stacked down one fixed frame:
//   ZONE 1  the RATE. An ink line at y 480. It steps up a notch (36px) when he
//           says 1%, four more when he says five percentage points, and leaves
//           a dashed rung behind at every height it left, so the step is still
//           readable after it has happened. `INTEREST RATE` centred under it;
//           the delta (+1%, +5%) rides the line's right end.
//   ZONE 2  the DEBT. Five bonds — cut 3's bill glyph, the same object the rest
//           of the clip calls the debt — in a row centred on x 540. Under each
//           one its COUPONS: solid ripe dots, what that bond costs in interest
//           every year. Four at the opening rate, five after +1%, eight after
//           +5%. A bond ROLLS OVER by dropping out of the world while its
//           replacement falls in from above through the rate line, carrying
//           whatever the current rate costs. A YEAR counter ticks on each
//           landing, so five landings read as five years.
//   ZONE 3  the TAX REVENUE. A hundred dots as a WIDE BAR, twenty by five. The
//           dots that go to interest are LIT — ripe and 1.2x — and they fill
//           COLUMN BY COLUMN FROM THE LEFT, so the lit share reads as a bar
//           filling left to right. Twenty of them (four columns) at the open.
//           The READOUT sits directly under the bar and says the same number
//           in Söhne, so the count and the percentage are the same fact twice.
//
// harmony pass (2026-09-08): cut 3 was rebuilt as the FIRST ACT of this
// composition — the same column, the same five bonds, the same bar — so this
// piece now opens on cut 3's last frame instead of assembling itself. `DEBT`,
// `TAX REVENUE`, `TO INTEREST PAYMENTS`, the `20%` readout and the four coupons
// under every bond are present at f0 with no fade. The only thing that arrives
// is the rate line and its label, together, over 8 frames from f28. Everything
// after f36 is untouched, frame for frame. Every constant the two cuts share
// now lives in `explainerShared.tsx` and is imported, never restated.
//
// phone pass: everything centred, the hundred is a 20x5 bar filling left to
// right, readout under the bar (user note 2026-09-08: "everything is sitting to
// the left ... viewed on a phone"). One centred column top to bottom — rate,
// debt, revenue — with nothing left-aligned and nothing parked at an edge, and
// the readout pulled under the bar so the numeral and the count read as one
// element. Timing, beats, gestures, mechanics, fonts and tones are untouched;
// only geometry and label placement moved.
//
// The whole piece is the arithmetic running through those three zones:
//   5 bonds x 4 coupons = 20 of 100. Roll them at the same rate: still 20.
//   Rate +1%  -> each replacement costs 5 -> 25 of 100.
//   Rate +5%  -> each replacement costs 8 -> 40 of 100.
//   Borrowing -> 3 MORE bonds at 8 each   -> 64 of 100, "north of 60".
//   And then the payment itself: sixty-four revenue dots fly up to the
//   sixty-four coupons, one each.
//
// Layout (world px = screen px: k 1.0, cx 540, cy 960, no camera move, sway
// only, so every number below is where it lands in the render). Everything is
// centred on x 540 and every label is text-anchor middle, except the delta,
// which has to ride the line's right end to mean anything:
//   rate line   x 100..980 (span centred on 540) at y 480 -> 444 -> 300, stroke
//               3 at OP_READ; rungs at 480 and 444, dashed 9/7, stroke 3 at
//               OP_UNREAD. `INTEREST RATE` centred, baseline 518. The delta
//               right-aligned at x 980, baseline lineY - 14, riding the line.
//   bonds       88 x 96, centre y 690 (glyph 642..738), pitch 112, row centred
//               on x 540 at every count. Five: x 316..764 (ink 272..808).
//               Eight: x 148..932 (ink 104..976). `DEBT` centred, baseline 600.
//   coupons     row A y 770, row B y 792, x offsets -33 -11 +11 +33, filled
//               A1..A4 then B1..B4, so 4 is one row, 5 is a row and one, 8 is
//               two rows. They travel with their bond.
//   counters    centred, baseline 850, in one slot under the bonds: `YEAR n OF
//               5` while a rollover cycle runs — the "OF 5" says "five-year
//               basis" without a word — then `+ $2T / YEAR` from f434 on.
//   the bar     the hundred as 20 columns x 5 rows, step 26: x 293 + 26j
//               (j 0..19, 293..787), y 980 + 26i (i 0..4, 980..1084), base
//               radius 7. Lit = ripe at 1.2r, unlit = deep at 0.85r; lit fills
//               COLUMN-MAJOR FROM THE LEFT (column 0 rows 0..4, then column 1),
//               so 20 is four columns, 25 is five, 40 is eight and 64 is twelve
//               columns and four dots of the thirteenth. `TAX REVENUE` centred,
//               baseline 950.
//   readout     the numeral 150px Dreiviertelfett, centred on x 540, baseline
//               1230, directly under the bar; `TO INTEREST PAYMENTS` 30px
//               Kräftig centred under it at 1275. Nothing below y 1290.
//   labels      30px Kräftig, uppercase, 0.08em, white at 0.70.
//   draw order  grid, rungs, rate line, bonds, coupons, labels, hundred,
//               readout, travellers. Global shadow over all of it; the per-icon
//               shadow is on the bonds only.
//
// Every gesture is one word, and there are nine of them. Nothing else happens.
//  1. the RATE LINE and its `INTEREST RATE` label fade
//     in TOGETHER, 8 frames from f28. Nothing else
//     arrives: `DEBT`, `TAX REVENUE`, the five bonds
//     with four coupons each, the bar lit to twenty,
//     the `20%` readout and `TO INTEREST PAYMENTS` are
//     all on screen at f0, because cut 3's last frame
//     IS this frame. The line is the one thing cut 3
//     does not have, and it is introduced before
//     "interest rates rise" (f106) needs it      — "of debt is"        f28-36
//                                                   readout 20
//  2. ROLLOVER CYCLE 1, at the same rate. Bond k
//     rolls at f56 + 8k, 12 frames each: landings
//     f68 76 84 92 100. Four coupons out, four
//     coupons in. `YEAR 1`..`YEAR 5` ticks on the
//     landings, gone f112. NOTHING changes — that is
//     the lesson of rolling at the same rate      — "so every five years
//                                                   it rolls over"     f56-100
//                                                   readout 20
//  3. the rate LINE STEPS UP one notch, 480 -> 444,
//     10-frame ease-out, and leaves a dashed rung at
//     480. `+1%` fades in at its right end        — "rates rise ...
//                                                   one percent"       f118-128
//                                                   readout 20
//  4. ROLLOVER CYCLE 2, at the new rate. Bond k rolls
//     at f158 + 30k: landings f170 200 230 260 289.
//     Each replacement carries FIVE coupons, and on
//     each landing one more revenue dot lights and the
//     readout ticks 21 22 23 24 25. `YEAR 1`..`YEAR 5`
//     again, gone f301. `25%` lands on "twenty-five"  — "then over a five-year
//                                                   basis ... goes from
//                                                   20 to 25"          f158-289
//                                                   readout 20 -> 25
//  5. the line steps up FOUR MORE notches, 444 -> 300,
//     12-frame ease-out, rung at 444, `+1%`
//     crossfades to `+5%`                        — "five percentage
//                                                   points"            f312-324
//                                                   readout 25
//  6. ROLLOVER CYCLE 3, fast. Bond k rolls at
//     f328 + 7k, 11 frames each: landings f339 346
//     353 360 367. Each replacement carries EIGHT
//     coupons — both rows — and each landing lights
//     THREE more revenue dots: 28 31 34 37 40.
//     `40%` lands on "forty"                     — "that would go
//                                                   towards like north
//                                                   of 40"             f328-367
//                                                   readout 25 -> 40
//  7. the BORROWING label `+ $2T / YEAR` fades in,
//     8 frames, in the year counter's slot, and stays
//     to the end. Nothing else                   — "borrowing"         f434-442
//                                                   readout 40
//  8. THREE NEW BONDS. Each slides in from beyond the
//     right edge of the frame (x 1180) at bond height
//     over 12 frames, carrying eight coupons, while
//     the whole row shifts 56px left on the same ease
//     so it stays centred: landings f479 505 533, the
//     row ending at eight bonds, x 148..932. Each
//     landing lights EIGHT more revenue dots: 48, 56,
//     64. `64%` lands on "sixty"                 — "two trillion every
//                                                   single year ... goes
//                                                   from 40 to north of
//                                                   60"                f467-533
//                                                   readout 40 -> 64
//  9. THE PAYMENT. Sixty-four travellers, one per lit
//     revenue dot, one launch a frame from f556 in a
//     hashed order, each on its own shallow arc up to
//     one of the sixty-four coupons — a bijection, so
//     every coupon is paid exactly once. Ten frames of
//     travel; the coupon it reaches beats 1.0 -> 1.35
//     -> 1.0 over 6 frames and the traveller is gone.
//     Last arrival f629                          — "so 60% of tax revenue
//                                                   basically just goes
//                                                   towards paying
//                                                   interest payments on
//                                                   the debt"          f556-629
//                                                   readout 64
//     hold resolved to f644.
//
// There is no ambient layer beyond breath and sway, and no gesture without a
// word. No camera move: the frame that holds the arithmetic must not move while
// the arithmetic runs.
//
// orange dwarkesh style: ACCENT / ACCENT_DEEP, solid dots with no stroke and
// the lit ladder carried by tone plus the lit/unlit radius rule, white ink at
// OP_READ, BG_DIM 0.45, one global drop-shadow 2/7/0.12, a per-icon
// drop-shadow 2/3/0.38 on the bonds, one stroke weight (3) for the line and its
// rungs, text in Söhne only.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(), // the bonds, the rate line, its rungs and all the type
  accent: z.string(), // ripe: a coupon, a lit revenue dot, a traveller
  accentDeep: z.string(), // deep: a revenue dot that is not going to interest
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
  dotOpacity: z.number(), // a dot is solid; the ladder is tone
  beats: z.object({
    nowALot: z.number(), // "now a lot"
    ofDebtIs: z.number(), // "of debt is"
    shortDuration: z.number(), // "short duration"
    soEvery: z.number(), // "so every"          -> cycle 1 starts
    fiveYears: z.number(), // "five years"
    itRollsOver: z.number(), // "it rolls over"
    suppose: z.number(), // "suppose"
    interest: z.number(), // "interest"         -> cycle 1's last landing
    ratesRise: z.number(), // "rates rise"
    onePercent: z.number(), // "one percent"     -> the first rate step
    thenOverA: z.number(), // "then over a"
    fiveYear: z.number(), // "five year"
    basisThe: z.number(), // "basis the"
    fractionOfTax: z.number(), // "fraction of tax"
    revenue: z.number(), // "revenue"
    thatGoesTowards: z.number(), // "that goes towards"
    servicing: z.number(), // "servicing"
    theDebt: z.number(), // "the debt"
    basically: z.number(), // "basically"
    goesFrom: z.number(), // "goes from"
    twenty: z.number(), // "twenty"
    to: z.number(), // "to"
    twentyFive: z.number(), // "twenty-five"    -> cycle 2's last landing
    ifItRise: z.number(), // "if it rise"
    fivePoints: z.number(), // "five"            -> the second rate step
    percentages: z.number(), // "percentages"
    thatWould: z.number(), // "that would"      -> cycle 3 starts
    goTowards: z.number(), // "go towards"      -> cycle 3's first landing
    likeNorth: z.number(), // "like north"
    ofForty: z.number(), // "of forty"
    forty: z.number(), // "forty"            -> cycle 3's last landing
    butIfYou: z.number(), // "but if you"
    takeIntoAccount: z.number(), // "take into account"
    theFactThat: z.number(), // "the fact that"
    governmentIs: z.number(), // "government is"
    borrowing: z.number(), // "borrowing"       -> the +$2T label
    twoTrillion: z.number(), // "two trillion"
    everySingle: z.number(), // "every single"
    yearThen: z.number(), // "year then"       -> new bond 1 lands
    thatGoesAgain: z.number(), // "that goes"
    fromLike: z.number(), // "from like"
    fortyToLike: z.number(), // "forty to like"  -> new bond 2 lands
    northOfSixty: z.number(), // "north of sixty"
    sixty: z.number(), // "sixty"           -> new bond 3 lands
    soSixtyOfTax: z.number(), // "so sixty of tax"
    revenueAgain: z.number(), // "revenue"
    basicallyAgain: z.number(), // "basically"
    justGoes: z.number(), // "just goes"
    towardsPaying: z.number(), // "towards paying"
    interestAgain: z.number(), // "interest"
    paymentsOnThe: z.number(), // "payments on the"
    debt: z.number(), // "debt"
    end: z.number(), // speech ends; tail to 644
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    nowALot: 0,
    ofDebtIs: 25,
    shortDuration: 41,
    soEvery: 56,
    fiveYears: 66,
    itRollsOver: 77,
    suppose: 96,
    interest: 100,
    ratesRise: 106,
    onePercent: 123,
    thenOverA: 145,
    fiveYear: 165,
    basisThe: 173,
    fractionOfTax: 191,
    revenue: 205,
    thatGoesTowards: 211,
    servicing: 230,
    theDebt: 245,
    basically: 253,
    goesFrom: 262,
    twenty: 273,
    to: 283,
    twentyFive: 289,
    ifItRise: 300,
    fivePoints: 312,
    percentages: 315,
    thatWould: 328,
    goTowards: 339,
    likeNorth: 355,
    ofForty: 362,
    forty: 367,
    butIfYou: 379,
    takeIntoAccount: 397,
    theFactThat: 410,
    governmentIs: 422,
    borrowing: 434,
    twoTrillion: 445,
    everySingle: 458,
    yearThen: 479,
    thatGoesAgain: 490,
    fromLike: 497,
    fortyToLike: 505,
    northOfSixty: 524,
    sixty: 533,
    soSixtyOfTax: 542,
    revenueAgain: 567,
    basicallyAgain: 576,
    justGoes: 585,
    towardsPaying: 598,
    interestAgain: 609,
    paymentsOnThe: 614,
    debt: 626,
    end: 628,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;

// ---------------------------------------------------------------------------
// The camera: there isn't one. k 1.0, cx 540, cy 960 — the identity, so a world
// coordinate below IS a screen coordinate — plus `sway`, which is the hand and
// nothing else. Cut 4 failed partly because the frame moved while the
// arithmetic ran; the three zones have to stay exactly where the viewer left
// them for twenty-six seconds, so the only thing that moves is what changed.
// Cut 3 is the same camera, so the two cuts join without a jump.
//
// Every zone's y, the bond row's pitch and glyph, the bar's geometry, the
// coupon slots and the two type sizes are imported from `explainerShared`. What
// is left below belongs to this piece alone: the rate's steps, the roll, and
// the payment's schedule.
// ---------------------------------------------------------------------------

// -- zone 1: the rate --------------------------------------------------------
// The span is centred: 100..980 has its midpoint on COLUMN_CX.
const RATE_X0 = 100;
const RATE_X1 = 980;
const RATE0 = RATE_Y; // where it opens
const NOTCH = 36; // one percentage point
const RATE1 = RATE0 - NOTCH; // 444, after +1%
const RATE2 = RATE0 - 5 * NOTCH; // 300, after +5%
const RUNG_FADE = 4;
const STEP1_DUR = 10;
const STEP2_DUR = 12;
const STEP1_LEAD = 5; // the +1% step straddles its word: f118..f128 on f123
const DELTA_FADE = 6;
const DELTA_DY = -14; // the delta label rides the line, just above it
// The line and its label arrive together, 8 frames from here: the one thing on
// screen that cut 3 does not already have.
const RATE_IN = 28;

// -- zone 2: the debt --------------------------------------------------------
const N_OPEN = 5;
const N_FULL = 8;
// A slot's x with the row NOT yet shifted. Slots 0..4 are the opening row —
// `rowX(5, 540)`, which is exactly where cut 3 leaves them (316..764) — and
// 5..7 are the borrowed bonds, placed so that at the full shift of -168 the
// eight of them land on 148..932.
const SLOT_BASE = Array.from(
  { length: N_FULL },
  (_, i) => rowX(N_OPEN, COLUMN_CX)[0] + i * BOND_PITCH,
);
const ROW_SHIFT = BOND_PITCH / 2; // 56 px left per new bond, so the row re-centres

// -- zone 3: tax revenue -----------------------------------------------------
const BAR_X = barX(COLUMN_CX); // 293..787
const BAR_Y = barY(BAR_TOP); // 980..1084
const DOT_LIGHT = 6; // frames, deep -> ripe
const DOT_STAGGER = 2; // frames between the dots of one increment

// -- the roll ----------------------------------------------------------------
// One gesture, used fifteen times. The old bond and its coupons drop 180px over
// 8 frames, eased in — it is falling out of the world, not being placed — and
// fade over the last 5. The replacement falls in from above the frame, through
// the rate line, over 10 frames eased out with no bounce, and lands in the slot
// the old one left carrying whatever the current rate costs.
const DROP_DUR = 8;
const DROP_DIST = 180;
const DROP_FADE0 = 3;
const FALL_DUR = 10;
const SPAWN_Y = -140; // above the frame, so a new bond crosses the rate line
const SLIDE_DUR = 12; // a borrowed bond's slide in from the right
const SLIDE_X = 1180; // beyond the right edge: its left edge is at 1136

const easeIn = Easing.in(Easing.cubic);
const easeOut = Easing.out(Easing.cubic);

const fallY = (age: number) => SPAWN_Y + (BOND_CY - SPAWN_Y) * easeOut(clamp01(age / FALL_DUR));
const dropY = (age: number) => BOND_CY + DROP_DIST * easeIn(clamp01(age / DROP_DUR));
const dropOp = (age: number) => interpolate(age, [DROP_FADE0, DROP_DUR], [1, 0], clamp);

// -- the payment -------------------------------------------------------------
// Sixty-four lit revenue dots and sixty-four coupons, and a bijection between
// them so that every coupon is paid exactly once and no dot pays twice. Both
// the pairing and the launch order are hashed permutations, and they are
// DIFFERENT hashes, so the block does not empty in the order it filled.
const PAY_N = 64;
const PAY_T0 = 556; // "so 60% of tax revenue" (f542) — he names it, it starts
const PAY_GAP = 1; // one launch a frame; the last leaves at f619
const PAY_DUR = TRAVEL_DUR; // ...and arrives at f629
const POP_DUR = 6; // the coupon's 1.0 -> 1.35 -> 1.0 on arrival
const POP_SCALE = 0.35;

const PAY_COUPON = rankBy(PAY_N, 91); // dot t pays coupon PAY_COUPON[t]
const PAY_ORDER = rankBy(PAY_N, 83); // and leaves at PAY_T0 + PAY_ORDER[t]
// the inverse, so a coupon can find the frame its payment lands
const COUPON_ARRIVAL = (() => {
  const out = new Array<number>(PAY_N);
  for (let t = 0; t < PAY_N; t++) {
    out[PAY_COUPON[t]] = PAY_T0 + PAY_ORDER[t] * PAY_GAP + PAY_DUR;
  }
  return out;
})();

type Inst = {
  key: string;
  slot: number;
  x: number;
  y: number;
  op: number;
  coupons: number;
  /** which of the eight coupon indices this bond's dots can be paid on, or -1 */
  payFrom: number;
};

const DebtExplainer: React.FC<Props> = ({
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
  dotOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent);

  // -- camera: none. The identity plus the hand. -----------------------------
  const drift = sway(frame);
  const cx = COLUMN_CX + drift.dx;
  const cy = SCENE_CY + drift.dy;
  const k = SCENE_K;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the schedule ----------------------------------------------------------
  // Every landing frame is a beat or a fixed offset from one, and everything
  // else in the piece is derived from these three arrays. Nothing runs on a
  // timer the visible thing cannot be read off.
  const cycle1 = [68, 76, 84, 92, beats.interest]; // gesture 2, rolls at landing - 12
  const cycle2 = [170, 200, 230, 260, beats.twentyFive]; // gesture 4, landing - 12
  const cycle3 = [beats.goTowards, 346, 353, 360, beats.forty]; // gesture 6, landing - 11
  const borrow = [beats.yearThen, beats.fortyToLike, beats.sixty]; // gesture 8, landing - 12

  const c1Start = cycle1.map((f) => f - 12);
  const c2Start = cycle2.map((f) => f - 12);
  const c3Start = cycle3.map((f) => f - 11);

  // -- zone 1: the rate ------------------------------------------------------
  const step1F0 = beats.onePercent - STEP1_LEAD; // f118
  const step2F0 = beats.fivePoints; // f312
  const lineY =
    frame < step2F0
      ? interpolate(frame, [step1F0, step1F0 + STEP1_DUR], [RATE0, RATE1], {
          ...clamp,
          easing: easeOut,
        })
      : interpolate(frame, [step2F0, step2F0 + STEP2_DUR], [RATE1, RATE2], {
          ...clamp,
          easing: easeOut,
        });
  // the line itself, and its label, fading in together over 8 frames from f28
  const rateIn = clamp01((frame - RATE_IN) / LABEL_FADE);
  const rung1Op = interpolate(frame, [step1F0, step1F0 + RUNG_FADE], [0, OP_UNREAD], clamp);
  const rung2Op = interpolate(frame, [step2F0, step2F0 + RUNG_FADE], [0, OP_UNREAD], clamp);
  // the delta at the line's right end: absent, then +1%, then +5%
  const d1 = interpolate(
    frame,
    [step1F0 + 4, step1F0 + 4 + DELTA_FADE, step2F0 + 6, step2F0 + 6 + DELTA_FADE],
    [0, 1, 1, 0],
    clamp,
  );
  const d5 = interpolate(frame, [step2F0 + 6, step2F0 + 6 + DELTA_FADE], [0, 1], clamp);

  // -- zone 2: the bonds -----------------------------------------------------
  // The row re-centres as it grows: each borrowed bond pulls the whole row 56px
  // left on the same ease it arrives on, so eight bonds are centred on x 540
  // exactly as five were.
  let shiftSteps = 0;
  for (let a = 0; a < borrow.length; a++) {
    shiftSteps += easeOut(clamp01((frame - (borrow[a] - SLIDE_DUR)) / SLIDE_DUR));
  }
  const shift = -ROW_SHIFT * shiftSteps;

  const bonds: Inst[] = [];
  for (let s = 0; s < N_OPEN; s++) {
    const base = SLOT_BASE[s] + shift;
    // gen 0: there from the first frame, four coupons, taken by cycle 1
    if (frame <= c1Start[s] + DROP_DUR) {
      const age = frame - c1Start[s];
      bonds.push({
        key: `s${s}g0`,
        slot: s,
        x: base,
        y: age <= 0 ? BOND_CY : dropY(age),
        op: age <= 0 ? 1 : dropOp(age),
        coupons: 4,
        payFrom: -1,
      });
    }
    // gen 1: rolls in at the SAME rate, so it still costs four
    if (frame >= c1Start[s] + 2 && frame <= c2Start[s] + DROP_DUR) {
      const da = frame - c2Start[s];
      bonds.push({
        key: `s${s}g1`,
        slot: s,
        x: base,
        y: da <= 0 ? fallY(frame - (c1Start[s] + 2)) : dropY(da),
        op: da <= 0 ? 1 : dropOp(da),
        coupons: 4,
        payFrom: -1,
      });
    }
    // gen 2: rolls in after +1%, and costs five
    if (frame >= c2Start[s] + 2 && frame <= c3Start[s] + DROP_DUR) {
      const da = frame - c3Start[s];
      bonds.push({
        key: `s${s}g2`,
        slot: s,
        x: base,
        y: da <= 0 ? fallY(frame - (c2Start[s] + 2)) : dropY(da),
        op: da <= 0 ? 1 : dropOp(da),
        coupons: 5,
        payFrom: -1,
      });
    }
    // gen 3: rolls in after +5%, costs eight, and is the one that gets paid
    if (frame >= c3Start[s] + 1) {
      bonds.push({
        key: `s${s}g3`,
        slot: s,
        x: base,
        y: fallY(frame - (c3Start[s] + 1)),
        op: 1,
        coupons: 8,
        payFrom: s * 8,
      });
    }
  }
  // the three borrowed bonds, sliding in from beyond the right edge
  for (let a = 0; a < borrow.length; a++) {
    const t0 = borrow[a] - SLIDE_DUR;
    if (frame < t0) continue;
    const s = N_OPEN + a;
    const e = easeOut(clamp01((frame - t0) / SLIDE_DUR));
    const home = SLOT_BASE[s] + shift;
    bonds.push({
      key: `s${s}`,
      slot: s,
      x: SLIDE_X + (home - SLIDE_X) * e,
      y: BOND_CY,
      op: 1,
      coupons: 8,
      payFrom: s * 8,
    });
  }

  // -- zone 3: the hundred ---------------------------------------------------
  // A dot's lit ramp is read off the landing that lit it. Twenty are lit from
  // frame 0; cycle 2 lights one per landing, cycle 3 lights three, and each
  // borrowed bond lights eight, staggered two frames apart inside the group.
  const litStart = new Array<number>(HUNDRED).fill(Infinity);
  for (let n = 0; n < 20; n++) litStart[n] = -1000;
  let next = 20;
  const readoutChanges: { f: number; v: number }[] = [];
  const addLit = (at: number, count: number) => {
    for (let j = 0; j < count; j++) litStart[next + j] = at + j * DOT_STAGGER;
    next += count;
    readoutChanges.push({ f: at, v: next });
  };
  cycle2.forEach((f) => addLit(f, 1)); // 21 22 23 24 25
  cycle3.forEach((f) => addLit(f, 3)); // 28 31 34 37 40
  borrow.forEach((f) => addLit(f, 8)); // 48 56 64

  const litAt = (n: number) => clamp01((frame - litStart[n]) / DOT_LIGHT);

  // the readout: a HARD tick on the landing frame (director pass). A crossfade
  // of any shape left a ghost numeral on the frame the word lands on, and a
  // counter that clicks reads as a count; one that fades reads as a smear.
  const done = readoutChanges.filter((c) => frame >= c.f);
  const curV = done.length === 0 ? 20 : done[done.length - 1].v;

  // -- the year counter ------------------------------------------------------
  // `YEAR n` = one more than the number of landings behind us, capped at five,
  // so five rolls read as five years and the counter is derived from the bonds
  // rather than from a parallel clock.
  const cycleFor = (): { start: number; landings: number[] } | null => {
    if (frame >= c1Start[0] && frame < cycle1[4] + 12 + LABEL_FADE)
      return { start: c1Start[0], landings: cycle1 };
    if (frame >= c2Start[0] && frame < cycle2[4] + 12 + LABEL_FADE)
      return { start: c2Start[0], landings: cycle2 };
    if (frame >= c3Start[0] && frame < cycle3[4] + 12 + LABEL_FADE)
      return { start: c3Start[0], landings: cycle3 };
    return null;
  };
  const cyc = cycleFor();
  const yearN = cyc ? Math.min(5, 1 + cyc.landings.filter((f) => frame >= f).length) : 1;
  const yearOp = cyc
    ? interpolate(
        frame,
        [
          cyc.start,
          cyc.start + LABEL_FADE,
          cyc.landings[4] + 12,
          cyc.landings[4] + 12 + LABEL_FADE,
        ],
        [0, 1, 1, 0],
        clamp,
      )
    : 0;

  const borrowOp = interpolate(
    frame,
    [beats.borrowing, beats.borrowing + LABEL_FADE],
    [0, 1],
    clamp,
  );

  // -- the payment -----------------------------------------------------------
  // Every traveller is one lit dot flying to one coupon. The coupons are read
  // off the bonds as they actually stand, so the targets cannot drift from the
  // things on screen.
  const couponPos: { x: number; y: number }[] = new Array(PAY_N);
  for (const b of bonds) {
    if (b.payFrom < 0) continue;
    for (let c = 0; c < 8; c++) {
      couponPos[b.payFrom + c] = couponAt(b.x, c);
    }
  }
  const travellers: { key: string; x: number; y: number; r: number }[] = [];
  if (frame >= PAY_T0 && couponPos[0]) {
    for (let t = 0; t < PAY_N; t++) {
      const dep = PAY_T0 + PAY_ORDER[t] * PAY_GAP;
      const u = (frame - dep) / PAY_DUR;
      if (u <= 0 || u >= 1) continue;
      const seat = litSeat(t);
      const from = { x: BAR_X[seat.col], y: BAR_Y[seat.row] };
      const to = couponPos[PAY_COUPON[t]];
      const p = arcAt(from, to, u, (hash(t, 53) - 0.5) * PAY_ARC);
      travellers.push({
        key: `p${t}`,
        x: p.x,
        y: p.y,
        // it leaves as a lit bar dot and arrives the size of a coupon
        r: travellerR(u, dotRadius) * breath(frame, hash(t, 9)),
      });
    }
  }
  const popAt = (m: number) => {
    if (frame < PAY_T0) return 1;
    const a = frame - COUPON_ARRIVAL[m];
    if (a < 0 || a > POP_DUR) return 1;
    return 1 + POP_SCALE * Math.sin((Math.PI * a) / POP_DUR);
  };

  const label = makeLabel(ink);
  const readout = makeReadout(ink);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={SCENE_CY}
        cx={cx}
        cxRest={COLUMN_CX}
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
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            {/* the rungs the rate left behind, under everything */}
            {rung1Op <= 0 ? null : (
              <line
                x1={RATE_X0}
                y1={RATE0 + 0.5}
                x2={RATE_X1}
                y2={RATE0 + 0.5}
                stroke={ink}
                strokeWidth={RATE_STROKE}
                strokeDasharray={RATE_DASH}
                opacity={rung1Op}
              />
            )}
            {rung2Op <= 0 ? null : (
              <line
                x1={RATE_X0}
                y1={RATE1 + 0.5}
                x2={RATE_X1}
                y2={RATE1 + 0.5}
                stroke={ink}
                strokeWidth={RATE_STROKE}
                strokeDasharray={RATE_DASH}
                opacity={rung2Op}
              />
            )}

            {/* the rate itself: it and its label arrive together at f28 */}
            {rateIn <= 0 ? null : (
              <line
                x1={RATE_X0}
                y1={lineY + 0.5}
                x2={RATE_X1}
                y2={lineY + 0.5}
                stroke={ink}
                strokeWidth={RATE_STROKE}
                opacity={OP_READ * rateIn}
              />
            )}

            {/* the bonds, OVER the line: one falling in passes in front of it */}
            {bonds.map((b) => (
              <g key={b.key} style={{ filter: icon }}>
                <path
                  d={BILL_D}
                  fill={ink}
                  fillRule="evenodd"
                  opacity={OP_READ * b.op}
                  transform={`translate(${b.x.toFixed(2)} ${b.y.toFixed(2)})`}
                />
              </g>
            ))}

            {/* the coupons, riding with their bond */}
            {bonds.map((b) =>
              Array.from({ length: b.coupons }, (_, c) => {
                const p = couponAt(b.x, c);
                const pop = b.payFrom < 0 ? 1 : popAt(b.payFrom + c);
                return (
                  <circle
                    key={`${b.key}c${c}`}
                    cx={p.x}
                    cy={p.y + (b.y - BOND_CY)}
                    r={dotRadius * pop * breath(frame, hash(b.slot * 8 + c, 9))}
                    fill={accent}
                    opacity={dotOpacity * b.op}
                  />
                );
              }),
            )}

            {/* the three zone labels, and the two counters in zone 2's slot */}
            {label("l-rate", COLUMN_CX, RATE_LABEL_Y, "INTEREST RATE", LABEL_OP * rateIn)}
            {/* cut 3 leaves these two on screen; they do not fade in again */}
            {label("l-debt", COLUMN_CX, DEBT_LABEL_Y, "DEBT", LABEL_OP)}
            {label("l-rev", COLUMN_CX, REVENUE_LABEL_Y, "TAX REVENUE", LABEL_OP)}
            {d1 <= 0 ? null : label("l-d1", RATE_X1, lineY + DELTA_DY, "+1%", LABEL_OP * d1, "end")}
            {d5 <= 0 ? null : label("l-d5", RATE_X1, lineY + DELTA_DY, "+5%", LABEL_OP * d5, "end")}
            {yearOp <= 0
              ? null
              : label("l-year", COLUMN_CX, COUNTER_Y, `YEAR ${yearN} OF 5`, LABEL_OP * yearOp)}
            {borrowOp <= 0
              ? null
              : label("l-borrow", COLUMN_CX, COUNTER_Y, "+ $2T / YEAR", LABEL_OP * borrowOp)}

            {/* the hundred, as a bar: tax revenue, and the share that is interest */}
            {BAR_Y.map((y, row) =>
              BAR_X.map((x, col) => {
                const t = litAt(litIndex(row, col));
                return (
                  <circle
                    key={`h${row}-${col}`}
                    cx={x}
                    cy={y}
                    r={barDotR(t) * breath(frame, hash(col * BAR_ROWS + row, 9))}
                    fill={tone(t)}
                    opacity={dotOpacity}
                  />
                );
              }),
            )}

            {/* the readout: the same count, said as a percentage */}
            {readout("readout", COLUMN_CX, READOUT_Y, `${curV}%`, 1)}
            {label("l-sub", COLUMN_CX, SUBLABEL_Y, "TO INTEREST PAYMENTS", LABEL_OP)}

            {/* the payment: one traveller per lit dot, one coupon each */}
            {travellers.map((t) => (
              <circle key={t.key} cx={t.x} cy={t.y} r={t.r} fill={accent} opacity={dotOpacity} />
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default DebtExplainer;
