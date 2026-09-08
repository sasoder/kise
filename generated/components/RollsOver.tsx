import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
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
  camEase,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  BILL_D,
  BLK_N,
  BLK_STEP,
  TREASURY_PEDIMENT,
  TREASURY_RECTS,
  runCameraX,
} from "./debtPileLegacy";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Debt_Crisis`, cut 4 (cuts 1-3 are `TenTimesTheCost`,
// `RateOfInterestHigher` and `TwentyPercentServicing`): "Now a lot of debt is
// short duration, so every five years it rolls over. Suppose interest rates
// rise 1%. Then over a five-year basis, the fraction of tax revenue that goes
// towards servicing the debt basically goes from 20 to 25."
//
// SRT span 0:40.020 -> 0:50.780 at 24fps.
// round((50.780 - 40.020) * 24) = round(10.76 * 24) = round(258.24) = 258
// frames of speech, plus a 16 frame tail so the resolved state holds = 274.
export const DURATION = 274;

// ---------------------------------------------------------------------------
// "Rolls over." The mechanism, and only the mechanism: the government's debt is
// bonds that MATURE and get REPLACED at whatever the rate is at that moment.
// A fifth of the stock every year, so the whole stock turns over in five. If
// the rate has gone up a point, each new bond costs more interest than the one
// it replaced, and once every bond has been replaced the interest bill — as a
// share of tax revenue — has grown from 20% to 25%.
//
// Four things, and the arithmetic between them is the piece:
//   the BONDS   five copies of cut 3's bill glyph (the same object: the debt,
//               so the audience recognises it), 88 x 96 world px, white, one
//               `iconShadow(k)` each. Row centred x 742, pitch 112, y 0.
//   the COUPONS what one bond costs per year: a row of solid ripe dots under
//               it at y +80. Four before the rate rises, FIVE after. Five
//               bonds x 4 = 20; five x 5 = 25.
//   the RATE    cut 2's mechanism verbatim: an ink LEVEL at y -150 that steps
//               up to -210 and leaves a dashed rung (9/7, OP_UNREAD) behind at
//               the height it was.
//   the REVENUE cut 3's treasury over cut 3's hundred-dot block, on the left.
//               The bottom two rows are ripe at the open: twenty of a hundred.
//               Row 7 lights one dot per roll: 21, 22, 23, 24, 25.
//
// A ROLL is one gesture, used twice: the old bond and its coupons drop straight
// down out of the frame, and a new bond with its coupons falls in from above,
// through the rate line, into the empty slot. Run once at the old rate it
// changes nothing — that is the lesson of the first five. Run again after the
// step, each replacement carries one more coupon and one more of the hundred
// goes ripe.
//
// Geometry (world px; final camera k 1.0, cx 540, content centre 0, so world
// y 0 sits at screen y 835 at BOTH framings):
//   bonds     centres x 518 630 742 854 966, y 0; the glyph spans -44..+44 and
//             -48..+48, so the row's ink runs x 474..1010.
//   coupons   y +80. Four at x offsets -33 -11 +11 +33 (step 22); five at
//             -36 -18 0 +18 +36 (step 18). Both rows are symmetric about the
//             bond and both sit inside its 88px width, and both leave a gap to
//             the next bond's coupons about 2.1x their own step, so five bonds
//             carrying five coupons still read as five groups and not as one
//             long bar. See the note on COUPON_NEW.
//   the line  y -150 -> -210, x 430..2500, stroke 3 at OP_READ. Its right end
//             is never in frame; its left end is off-frame at k 1.75 (the
//             frame reaches world x 433) and sits 84px right of the block at
//             k 1.0. The rung it leaves is the same span, dashed 9/7, stroke 3,
//             at OP_UNREAD.
//   treasury  cut 3's facade, origin (242, +16), spanning y -254..+16.
//   block     100 dots, step 22, columns x 143..341, rows y +57..+255. Rows 8
//             and 9 are ripe at the open (20 of 100); row 7's dots j 0..4 light
//             one per post-rise roll. Ripe in place: no tier, nothing drops.
//   draw order grid, rung, rate line, bonds, coupons, treasury, block.
//             The bonds are drawn AFTER the line, so a bond falling in passes
//             in front of it.
//
// Every gesture is one word. Nothing else happens.
//   open on the DEBT: five bonds, twenty coupon dots,
//     the rate line above them, at k 1.75. The frame
//     spans world x 433..1051, so neither the block
//     (right edge 346) nor the line's left end (430)
//     is in it. Breath and sway only; nothing appears — "short duration"    f0
//   THE ROLLOVER, five times, left to right: bond k
//     rolls at f28 + 5k. The old bond and its four
//     coupons drop 180px over 8 frames, ease-in,
//     fading over the last 5; a new bond with four
//     coupons falls in from y -620 (above the k 1.75
//     frame) through the line over 10 frames,
//     ease-out and no bounce, starting 2 frames
//     later, so it lands at f28 + 5k + 12 — f40, 45,
//     50, 55, 60. Twenty coupons before, twenty
//     after: a rollover at the same rate changes
//     nothing                                        — "so every five years
//                                                      it rolls over"     f28-60
//   the rate LINE STEPS UP -150 -> -210 on one
//     10-frame ease-out ramp and leaves a dashed rung
//     at -150 that fades in over 4 frames as it
//     goes. Nothing else moves                       — "rates rise ...
//                                                      one percent"       f74-84
//   the ONE camera move, and the only one: pull back
//     k 1.75 -> 1.0 and pan cx 742 -> 540 together,
//     keyed f100-116 warp 0.72. Traced through the
//     damper: |dk| < 0.5%/frame from f123 and
//     |dcx| < 1px/frame from f124, so the frame has
//     stopped before the first post-rise roll at
//     f126. It reveals the REVENUE — the treasury and
//     the hundred with twenty already lit. Nothing
//     else moves while it runs                       — "then over a"      f100-116
//   FIVE ROLLS AT THE NEW RATE: bond k rolls at
//     f126 + 27k. Same gesture, 14 frames — the old
//     drops over frames 0-8, the new starts falling
//     at +4 and lands at +14: f140, 167, 194, 221,
//     248. Every new bond carries FIVE coupons, and
//     on each landing one more block dot ramps deep
//     -> ripe over 6 frames: 21, 22, 23, 24, 25 of a
//     hundred. The fifth lands on "twenty-five".
//     Between rolls nothing else moves               — "five-year basis ...
//                                                      goes from 20 to
//                                                      25"               f126-248
//   hold resolved: five bonds carrying five coupons
//     each, the hundred with twenty-five lit, the
//     line one notch above its dashed rung. Breath
//     and sway only                                  — tail              f248-274
//
// There is no ambient layer beyond breath and sway, and no text, no people, no
// arrows, no counters. The holds are carried by the breath on the dots and the
// camera's own drift.
//
// orange dwarkesh style: ACCENT / ACCENT_DEEP, solid dots with no stroke and
// the ladder carried by tone, white ink at OP_READ, BG_DIM 0.45, one global
// drop-shadow 2/7/0.12, a per-icon drop-shadow 2/3/0.38 on every bond, on the
// treasury and on the line and its rung, one stroke weight (3) throughout, one
// eased camera move (warp 0.72) with cy taken off the eased k.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(), // the bonds, the treasury, the line and its rung
  accent: z.string(), // ripe: a coupon, and a lit dot of the hundred
  accentDeep: z.string(), // deep: a dot of the hundred at rest
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
    shortDuration: z.number(), // "short duration"
    soEvery: z.number(), // "so every"
    fiveYears: z.number(), // "five years"
    itRollsOver: z.number(), // "it rolls over"
    suppose: z.number(), // "suppose"
    interest: z.number(), // "interest"
    ratesRise: z.number(), // "rates rise"
    onePercent: z.number(), // "one percent"
    thenOverA: z.number(), // "then over a"
    fiveYear: z.number(), // "five year"
    basisThe: z.number(), // "basis the"
    fractionOfTax: z.number(), // "fraction of tax"
    revenue: z.number(), // "revenue"
    thatGoes: z.number(), // "that goes"
    towards: z.number(), // "towards"
    servicing: z.number(), // "servicing"
    theDebt: z.number(), // "the debt"
    basically: z.number(), // "basically"
    goesFrom: z.number(), // "goes from"
    twenty: z.number(), // "twenty"
    to: z.number(), // "to"
    twentyFive: z.number(), // "twenty-five"
    end: z.number(), // speech ends; tail to 274
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
    shortDuration: 0,
    soEvery: 14,
    fiveYears: 24,
    itRollsOver: 36,
    suppose: 55,
    interest: 59,
    ratesRise: 64,
    onePercent: 82,
    thenOverA: 104,
    fiveYear: 123,
    basisThe: 132,
    fractionOfTax: 150,
    revenue: 163,
    thatGoes: 170,
    towards: 179,
    servicing: 189,
    theDebt: 203,
    basically: 212,
    goesFrom: 220,
    twenty: 231,
    to: 242,
    twentyFive: 248,
    end: 258,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// The camera. ONE move: the pull-back and pan off "then over a", keyed f100-116
// with warp 0.72 so the speed is early in it. Both things it has to hold — the
// debt on the right and the revenue on the left — do not share a centre, so
// this camera pans as well as zooms, exactly as cut 3's does: the x track is
// the same eased curve run through the same damper (`runCameraX`, imported from
// cut 3), so the pan and the zoom settle together and it reads as one hand.
//
// The content centre is 0 at both ends, so world y 0 — the bond row — sits at
// screen y 835 the whole way through, under the captions.
//
//   f0-100    k 1.75, cx 742, centre 0. The frame spans world x 433..1051 and
//             world y -477..+620. The bond row is at screen y 835, its coupons
//             at 975, the rate line at 573 (467 after the step). The block's
//             right edge is at world 346 and the line's left end at 430, so
//             neither is in frame; sway only ever pushes cx up over f0..f72,
//             and the worst case in the whole tight framing is x0 = 430.4.
//   f100-116  -> k 1.0, cx 540, centre 0. Traced through the damper frame by
//             frame: |dk| < 0.5%/frame from f123, |dcx| < 1px/frame from f124,
//             peak zoom speed 4.21%/frame at f109. The frame is still by f124,
//             two frames before the first post-rise roll at f126. At rest the
//             frame spans world x 0..1080 and y -835..+1085: the treasury sits
//             at screen x 70..414, the block at 143..341, the bond row's ink at
//             474..1010, and the line's left end at 430 is 84px clear of the
//             block. Margins 70px left and 65px right; nothing below y 1090.
// ---------------------------------------------------------------------------
const K_OPEN = 1.75;
const K_FINAL = 1.0;
const CX_OPEN = 742;
const CX_FINAL = 540;
const CONTENT_CY = 0;
const CAM_F0 = 100;
const CAM_F1 = 116;
const CAM_WARP = 0.72;

const CAM = camMove({
  f0: CAM_F0,
  f1: CAM_F1,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_CY,
  c1: CONTENT_CY,
  warp: CAM_WARP,
});
const CAM_FR = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [CONTENT_CY + CAM_LIFT / K_OPEN, ...CAM.CY, CONTENT_CY + CAM_LIFT / K_FINAL];

// the x track: the same eased curve, one key per frame, over the same span
const CAM_CX = (() => {
  const F: number[] = [0];
  const X: number[] = [CX_OPEN];
  const span = CAM_F1 - CAM_F0;
  for (let i = 0; i <= span; i++) {
    F.push(CAM_F0 + i);
    X.push(CX_OPEN + (CX_FINAL - CX_OPEN) * camEase(i / span, CAM_WARP));
  }
  F.push(DURATION);
  X.push(CX_FINAL);
  return { F, X };
})();

// ---------------------------------------------------------------------------
// The debt: five bonds in a row, and under each one its coupons.
//
// A bond is cut 3's bill glyph, unchanged — the same 88 x 96 torn note with its
// four cut-out lines — because it is the same object in the same clip: the
// debt. Five of them is the whole stock, and a fifth of the stock maturing each
// year is one bond rolling.
//
// A coupon is what the bond costs its issuer in a year. Four dots at the old
// rate, five at the new one, on the same 22px step the hundred-dot block uses,
// so a coupon and a unit of tax revenue are visibly the same kind of thing.
// ---------------------------------------------------------------------------
const BOND_N = 5;
const BOND_CX = 742;
const BOND_PITCH = 112;
const BOND_X = Array.from(
  { length: BOND_N },
  (_, k) => BOND_CX - ((BOND_N - 1) * BOND_PITCH) / 2 + k * BOND_PITCH,
);
const BOND_Y = 0;
const COUPON_DY = 80;
const COUPON_OLD = [-33, -11, 11, 33]; // step 22, group 66, gap 46 — 2.09 : 1
// The brief's five-coupon row was {-44, -22, 0, +22, +44}: step 22, group 88,
// and a gap of 112 - 88 = 24 between one bond's coupons and the next one's.
// Rendered, that is a gap-to-step ratio of 1.09 : 1 and the twenty-five read as
// ONE continuous bar of dots — measured on the resolved frame, the five groups
// are not separable at all, and "each bond now costs five" disappears. The
// four-coupon row above works because its ratio is 2.09 : 1. Step 18 puts the
// five-row at 40 / 18 = 2.22 : 1, so it groups exactly the way the four-row
// does, still sits inside its own bond (group 72 < the glyph's 88), and reads
// as five coupons crammed under one bond rather than a wider row.
const COUPON_NEW = [-36, -18, 0, 18, 36]; // step 18, group 72, gap 40 — 2.22 : 1

// ---------------------------------------------------------------------------
// The rate: cut 2's level, verbatim. An ink line that steps up once and leaves
// a dashed rung at the height it was, so the step is still readable after it
// has happened. Same stroke (3), same dash (9/7), same 4-frame rung fade, same
// ease-out ramp. Its right end runs far off the right of every frame; its left
// end is a deliberate landmark at k 1.0, 84px clear of the block.
// ---------------------------------------------------------------------------
const LINE_LO = -150;
const LINE_HI = -210;
const LINE_X0 = 430;
const LINE_X1 = 2500;
const STROKE = 3;
const DASH = "9 7";
const RUNG_FADE = 4;
// The step is keyed off the word it serves, not off a parallel timer: it starts
// 8 frames before "one percent" (f82) and its last frame of motion is 2 frames
// after it, so the line is moving across the word and settled just behind it.
const STEP_LEAD = 8;
const STEP_OVER = 2;

// ---------------------------------------------------------------------------
// The revenue: cut 3's treasury standing over cut 3's hundred, moved to the
// left of the world so the debt and the revenue can be seen side by side. The
// block is deep at rest except for its bottom two rows, which are ripe from
// frame 0 — the twenty percent the previous cut ended on, so this one opens
// where that one resolved.
//
// Row 7 is the row directly above them, so the share grows UPWARD out of the
// twenty, one dot per roll, and never moves: no tier, no drop, no flight. The
// count is the only thing that changes.
// ---------------------------------------------------------------------------
const BLOCK_CX = 242;
const TREASURY_Y = 16;
const BLK_X = Array.from({ length: BLK_N }, (_, j) => BLOCK_CX - 99 + BLK_STEP * j);
const BLK_Y = Array.from({ length: BLK_N }, (_, i) => 57 + BLK_STEP * i);
const RIPE_ROW0 = 8; // rows 8 and 9 are ripe at the open: 20 of 100
const GROW_ROW = 7; // and row 7's first five dots light, one per roll
const DOT_LIGHT = 6; // frames, deep -> ripe

// ---------------------------------------------------------------------------
// The roll. One gesture, used twice.
//
// The old bond and its coupons drop straight down 180 world px over 8 frames,
// eased IN — it is falling out of the world, not being placed — and fade over
// the last 5 of those frames. The new bond and its coupons fall in from above
// the top of the frame over 10 frames, eased OUT with no bounce, and land in
// the slot the old one left.
//
// Demo (f28 + 5k, k = 0..4): the new one starts 2 frames after the old begins
// to drop, so it lands at f28 + 5k + 12 — f40, 45, 50, 55, 60. Four coupons in,
// four coupons out.
//
// At the new rate (f126 + 27k): the roll is given 14 frames because it now has
// something to say — the new one starts at +4 and lands at +14, f140, 167, 194,
// 221, 248, one landing per beat and the last of them on "twenty-five". Five
// coupons in place of four, and one more dot of the hundred goes ripe.
//
// The two spawn heights differ because they are the same instruction — "from
// beyond the top of the frame" — at two zooms: at k 1.75 the frame top is world
// y -477 and -620 clears it; at k 1.0 it is -835, so the post-rise bonds start
// at -900 instead of materialising in mid-air at screen y 215. The fall is 10
// frames either way, and 900px in 10 frames at k 1.0 is 90 screen px/frame
// against 620px at k 1.75's 108, so the wide rolls read a little heavier rather
// than faster.
// ---------------------------------------------------------------------------
const DEMO_T0 = 28;
const DEMO_GAP = 5;
const DEMO_LAG = 2; // the new one starts this long after the old begins to drop
const ROLL_T0 = 126;
const ROLL_GAP = 27;
const ROLL_LAG = 4;
const FALL_DUR = 10;
const SPAWN_TIGHT = -620; // clears the k 1.75 frame top (-477)
const SPAWN_WIDE = -900; // clears the k 1.0 frame top (-835)
const DROP_DUR = 8;
const DROP_DIST = 180;
const DROP_FADE0 = 3; // the last 5 of the 8 drop frames

const easeIn = Easing.in(Easing.cubic);
const easeOut = Easing.out(Easing.cubic);

type Inst = { key: string; y: number; op: number; offsets: number[]; slot: number; gen: number };

// One bond's life, as three generations of the same slot: the one that is there
// at the open, the one that replaces it at the old rate, and the one that
// replaces THAT at the new rate. Each is drawn only while it exists, and the
// only state any of them has is how far it has fallen or dropped.
const fallY = (age: number, from: number) =>
  from + (BOND_Y - from) * easeOut(clamp01(age / FALL_DUR));
const dropY = (age: number) => BOND_Y + DROP_DIST * easeIn(clamp01(age / DROP_DUR));
const dropOp = (age: number) =>
  interpolate(age, [DROP_FADE0, DROP_DUR], [1, 0], clamp);

const RollsOver: React.FC<Props> = ({
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

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_FR, CAM_CY, CAM_K);
  const camX = runCameraX(frame, CAM_CX.F, CAM_CX.X);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the rate --------------------------------------------------------------
  const stepF0 = beats.onePercent - STEP_LEAD; // f74
  const stepF1 = beats.onePercent + STEP_OVER; // f84
  const lineY = interpolate(frame, [stepF0, stepF1], [LINE_LO, LINE_HI], {
    ...clamp,
    easing: easeOut,
  });
  const rungOp = interpolate(frame, [stepF0, stepF0 + RUNG_FADE], [0, OP_UNREAD], clamp);

  // -- the bonds -------------------------------------------------------------
  const bonds: Inst[] = [];
  for (let s = 0; s < BOND_N; s++) {
    const demo = DEMO_T0 + DEMO_GAP * s; // the old bond starts dropping
    const roll = ROLL_T0 + ROLL_GAP * s; // and so does its replacement, later

    // gen 0: there from the first frame, gone when the demo roll takes it
    if (frame <= demo + DROP_DUR) {
      const age = frame - demo;
      bonds.push({
        key: `s${s}g0`,
        y: age <= 0 ? BOND_Y : dropY(age),
        op: age <= 0 ? 1 : dropOp(age),
        offsets: COUPON_OLD,
        slot: s,
        gen: 0,
      });
    }

    // gen 1: falls in at the old rate, carrying the same four coupons
    if (frame >= demo + DEMO_LAG && frame <= roll + DROP_DUR) {
      const fa = frame - (demo + DEMO_LAG);
      const da = frame - roll;
      bonds.push({
        key: `s${s}g1`,
        y: da <= 0 ? fallY(fa, SPAWN_TIGHT) : dropY(da),
        op: da <= 0 ? 1 : dropOp(da),
        offsets: COUPON_OLD,
        slot: s,
        gen: 1,
      });
    }

    // gen 2: falls in at the new rate, and costs five
    if (frame >= roll + ROLL_LAG) {
      bonds.push({
        key: `s${s}g2`,
        y: fallY(frame - (roll + ROLL_LAG), SPAWN_WIDE),
        op: 1,
        offsets: COUPON_NEW,
        slot: s,
        gen: 2,
      });
    }
  }

  // -- the hundred -----------------------------------------------------------
  // A dot's tone is read off the roll that lit it, never off a counter: row 7's
  // dot j goes ripe over 6 frames from the landing of roll j. A lit dot is also
  // 1.2x the radius and an unlit one 0.85x (director pass 2026-09-08): at k 1.0
  // deep vs ripe alone did not separate the twenty from the eighty, and the
  // count is the whole point of the block.
  const litAt = (row: number, col: number) => {
    if (row >= RIPE_ROW0) return 1;
    if (row !== GROW_ROW || col >= BOND_N) return 0;
    const landed = ROLL_T0 + ROLL_GAP * col + ROLL_LAG + FALL_DUR;
    return clamp01((frame - landed) / DOT_LIGHT);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CX_OPEN}
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
            {/* the rung the rate left behind, under everything */}
            {rungOp <= 0 ? null : (
              <g style={{ filter: icon }}>
                <line
                  x1={LINE_X0}
                  y1={LINE_LO}
                  x2={LINE_X1}
                  y2={LINE_LO}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeDasharray={DASH}
                  opacity={rungOp}
                />
              </g>
            )}

            {/* the rate itself */}
            <g style={{ filter: icon }}>
              <line
                x1={LINE_X0}
                y1={lineY}
                x2={LINE_X1}
                y2={lineY}
                stroke={ink}
                strokeWidth={STROKE}
                opacity={OP_READ}
              />
            </g>

            {/* the bonds, OVER the line: one falling in passes in front of it */}
            {bonds.map((b) => (
              <g key={b.key} style={{ filter: icon }}>
                <path
                  d={BILL_D}
                  fill={ink}
                  fillRule="evenodd"
                  opacity={OP_READ * b.op}
                  transform={`translate(${BOND_X[b.slot]} ${b.y.toFixed(2)})`}
                />
              </g>
            ))}

            {/* the coupons, riding with their bond */}
            {bonds.map((b) =>
              b.offsets.map((dx, n) => (
                <circle
                  key={`${b.key}c${n}`}
                  cx={BOND_X[b.slot] + dx}
                  cy={b.y + COUPON_DY}
                  r={dotRadius * breath(frame, hash(b.slot * 8 + n, 9))}
                  fill={accent}
                  opacity={dotOpacity * b.op}
                />
              )),
            )}

            {/* the treasury: static, the revenue is already there */}
            <g style={{ filter: icon }}>
              <g transform={`translate(${BLOCK_CX} ${TREASURY_Y})`}>
                {TREASURY_RECTS.map((r, i) => (
                  <rect
                    key={`tr${i}`}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    rx={r.r}
                    fill={ink}
                    opacity={OP_READ}
                  />
                ))}
                <path d={TREASURY_PEDIMENT} fill={ink} opacity={OP_READ} />
              </g>
            </g>

            {/* the hundred: tax revenue, twenty ripe at the open and five more
                to come */}
            {BLK_Y.map((y, row) =>
              BLK_X.map((x, col) => (
                <circle
                  key={`h${row}-${col}`}
                  cx={x}
                  cy={y}
                  r={
                    dotRadius *
                    (0.85 + 0.35 * litAt(row, col)) *
                    breath(frame, hash(row * BLK_N + col, 9))
                  }
                  fill={tone(litAt(row, col))}
                  opacity={dotOpacity}
                />
              )),
            )}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default RollsOver;
