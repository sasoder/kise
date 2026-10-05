import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLUE,
  CAM_DAMP,
  CAM_STIFF,
  CROWN_STEP,
  EASE_LAND,
  FRAME_H,
  FRAME_W,
  INK,
  ORANGE,
  PURPLE,
  PaperGround,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  OP_LOW,
  BARLOW_CAP,
  CONTENT_SCREEN_Y,
  camEase,
  clamp,
  sway,
  textRise,
  type,
} from "./cerroShared";

export const FPS = 24;
// HEADER: see the block comment below `DURATION`.
export const DURATION = 101;

// ---------------------------------------------------------------------------
// "SIX YEARS LATER" — cut 5 of the Cerro Gordo trailer (Core Memory, Ashlee
// Vance x Brent Underwood). A small calendar that stretches into years.
//
// THE LINE: "I thought this was maybe going to be a couple weeks, maybe a
// month at most. Six years later — I'm here"
// Trailer SRT 32.282 -> the graphic ENDS at 36.161, the onset of "I'm here",
// where the editor cuts back to his face.  round((36.161 - 32.282) * 24) = 93
// frames, plus an 8-frame HANDLE continuing the hold = DURATION 101.
//   word                 trailer s   f
//   I thought this        32.282     0
//   was maybe going       32.658     9
//   to be a               33.158    21
//   couple                33.742    35
//   weeks                ~34.06     43
//   maybe a               34.326    49
//   month                ~34.61     56
//   at most               34.826    61
//   Six                   35.494    77
//   years                ~35.79     84
//   I'm here (CUT POINT)  36.161    93
// Fact (verified by the director): Brent moved up in March 2020 planning to
// stay a few weeks as COVID began, and has lived there since — six years by
// 2026.
//
// SECOND PASS (director's review): (1) a lived day is a LEFT->RIGHT WIPE, not
// a corner or centre growth; (2) the other 71 months never draw cells — each
// is ONE rounded block that wipes in; (3) the wall recedes earlier, f64-74.
//
// ONE MATERIAL: CELLS AND THE BLOCKS THEY CLOSE INTO. Month 0 is 7 x 5 day
// cells (no weekday letters, no numbers, no header, no pages, no rings). An
// unlived day is a white OUTLINE square; a lived day is a FILLED white square
// on the hard black shadow, wiped in LEFT->RIGHT inside its cell: a horizontal
// clip of the filled square AND its shadow, its edge at x + (side + shadow) * e,
// ease-out cubic over 6 frames, reading direction. Every other month is ONE
// filled rounded block (month-shaped, 88.2 x 62.2, its own 4 px hard shadow)
// wiped in the same way over 5 frames. The wall is 6 rows (years) x 12 months;
// rows are 30 world px apart and months 17, so the six years read as strips.
// Corner radius: BLOCK_R = 4 SCREEN px (BLOCK_R / k world), like the shadow,
// so a block is the same barely-rounded card at every zoom.
//
// FILL TIMES (each day's wipe LANDS on these frames):
//   month 0 (the one we watch being lived; outlines from f0)
//     day 1          lands f10   — "was maybe going" (wipe starts f4)
//     days 2..14     land f37 -> f43 in reading order, ~2 a frame — "couple weeks"
//     days 15..35    land f50 -> f56 in reading order, 3 a frame — "maybe a month"
//   months 1..71: they do not exist until they are lived (so at the open the
//     month really is alone — month 1's outline would sit at screen x 1596).
//     Each block's wipe starts the frame THE WAVE reaches its left edge. The
//     wave is a front that leaves month 0 as the pull-back starts and runs out
//     across the wall ahead of the camera, month by month and leaning along
//     the rows (anisotropic distance from month 0's centre, dy weighted 2.0, so
//     a year's months go before the next year's). Its radius is derived from
//     the DAMPED camera (MEMORY: derive state from the visible thing): it grows
//     by WAVE_GAIN (1.04) of the growth of the frame's reach to its far corner,
//     so it is visible inside the frame through the pull. Blocks start f59-71
//     and every month has landed by f76. Numbers in the camera table below.
//
// STROKE. 6 px at the open shot, in world px that is STROKE / K_REF = 0.574
// world px (the one-stroke-weight rule, scaled once). It only ever draws
// month 0's unlived days, which are all filled by f56, before the pull.
//
// HARD SHADOW: 4 SCREEN px at every k, i.e. SHADOW_OFF / k world px. A local
// variation (see DEVIATIONS) — across a 10x pull a world-px shadow would be
// either 42 px at the open or 0.4 px on the wall.
//
// MONTH 0 CLOSES INTO ITS BLOCK. The gutter between its cells is GAP (2.8
// world px) times m(k) = smoothstep((GAP*k - 6) / 10): full detail while the
// screen gutter is >= 16 px (k >= 5.7, cells >= 58 px), closed at <= 6 px
// (k <= 2.14, cells ~22 px). The cells grow into the gutter (the month's outer
// edge never moves), landed cells bleed 0.75 screen px into a closing gutter so
// no seam shows, and the month's four outer corners round in as m -> 0. Once
// closed it is drawn as the same rounded block as every other month. That is
// the only fine texture in the pull; everything else is clean blocks.
//
// THE PAYOFF: "6 YEARS", Barlow 900 at 230 (~900 px wide), centred on the
// wall (x 960, cap centre on screen y 520), with THIS CUT'S ONE CHAIN ECHO.
// The type is pinned to the content centre in screen space (same sway) and
// takes the camera's scale only inside the hold's range, clamp(k, 1, 1.02), so
// it never rides the tail of the 10x pull.
//   f70-82  the core slides up 24 screen px while it fades 0 -> 1 (textRise);
//           opacity 0.70 at f74, 0.88 at f76, 0.96 at f78.
//   f75 / 77 / 79  orange / purple / blue rise out from BEHIND the core to
//           36 / 24 / 12 px above it (EASE_LAND, 22 f travel, 2 f stagger) —
//           a crown, one column. At f84 they stand at 34 / 21 / 9.5 px (94 /
//           89 / 79 % of the ease), visually landed. They are born hidden
//           under the core and travel out; nothing in the chain fades. (Core +
//           chain share one group opacity, so while the core finishes its fade
//           a copy behind it cannot show through it.)
//   f64-74  the wall recedes 1 -> 0.3 (OP_LOW, ease in-out), so the type slides
//           up over an already-quiet wall.
//
// THE GESTURES — every one on a word, nothing else:
//   f0      the month exists (outlines), camera already creeping — "I thought this"
//   f4-10   day 1 wipes in                                      — "was maybe going"
//   f31-43  days 2-14, one quick wave left->right               — "couple weeks"
//   f44-56  days 15-35, one wave                                — "maybe a month"
//   f58-80  THE STRETCH: the camera pulls back 10.4x in log
//           space while the wave of lived months (blocks
//           wiping in f59-71, all landed by f76) runs out across
//           the wall ahead of it; month 0's gutters close into
//           its block as it shrinks                             — "at most" -> "Six"
//   f64-74  the wall recedes to 0.3                             — (leads "Six")
//   f70-84  "6 YEARS" slides up (f70); chain crown f75/77/79     — "Six years"
//   f84-101 hold, the creep only                                — "later" / handle
//
// THE CAMERA — authored in LOG ZOOM so the 10x pull reads as one even
// acceleration and ease-out, damped by the house tracker (CAM_STIFF/CAM_DAMP).
// Channels: L = ln k, and A = how far (screen px) month 0's centre has been
// carried away from the content centre (960, 520). screen = C + (world - m0)*k - A.
// Panning in screen px rather than in world px keeps the drift of month 0 a
// gentle 575 px glide whatever the zoom.
//   CREEP  f0-56   k 10.10 -> 10.45 (warp 1): month 0 held centred.
//   PULL   f56-68  L ln10.45 -> 0, A 0 -> (W - m0) (warp 1). Keys land at f68;
//                  the damped camera starts visibly at f58 (3 f ahead of
//                  "at most"), peaks at 22%/frame of zoom at f66 and is within
//                  2.7% of rest at f77 ("Six").
//   CREEP  f68-101 k 1.00 -> 1.02 about the wall's centre (A = (W-m0)*k).
// THE DAMPED NUMBERS (cx, cy = the world point at the frame centre; wave R =
// the front's anisotropic radius in world px, month wipes starting that frame):
//     f    k        cx      cy      dlnk/frame  month-0 glide  wave R  starts
//     0    10.100   381.4   291.5       0.00%        0.0 px        -      -
//     9    10.110   381.4   291.5       0.03%        0.0 px        -      -
//     35   10.300   381.4   291.4       0.09%        0.0 px        -      -
//     43   10.369   381.4   291.4       0.08%        0.0 px        -      -
//     56   10.442   381.4   291.4       0.03%        0.0 px       50      0
//     58   10.222   381.9   291.7      -1.73%        4.6 px       54      0
//     61   8.238    388.5   294.8     -10.50%       27.9 px       99      0
//     64   4.943    418.8   308.4     -19.86%       52.7 px      262      3
//     66   3.182    473.5   332.5     -22.38%       59.4 px      506      7  peak
//     68   2.091    571.2   374.7     -20.10%       53.4 px      886     15
//     71   1.360    751.3   451.6     -11.39%       30.3 px     1517      3
//     74   1.109    880.4   506.3      -4.90%       13.2 px     1942      0
//     77   1.028    939.2   531.2      -1.67%        4.8 px     2129      0  "Six"
//     80   1.005    958.1   539.1      -0.39%        1.6 px     2187      0
//     84   1.004    961.9   540.7      +0.07%        0.5 px     2195      0  creep
//     93   1.013    960.2   539.8      +0.09%        0.5 px                  cut
//     101  1.019    960.0   539.6      +0.04%        0.3 px                  handle
// One acceleration lobe and one settle lobe on the zoom; the damped k bottoms
// at 1.0028 (f82) and the creep takes over with no visible reversal. cx
// overshoots its rest by 1.9 world px around f84 and returns over ~15 frames.
// At rest the wall spans screen x 337..1583, y 258..782 — 188 px clear of the
// bottom (YouTube chrome) and centred on (960, 520).
//
// DEVIATIONS from the common brief, and why.
//   * Own screen-space SVG world (`<g translate scale>`) instead of cerroShared's
//     `World` (a CSS scale(k) on a 1920 x 1080 SVG): at k 10 a CSS-scaled layer
//     risks being rasterised small and upscaled. Same transform maths.
//   * Hard shadow 4 SCREEN px (SHADOW_OFF / k world) — see HARD SHADOW above.
//   * The paper uses the shared PaperGround with a REMAPPED camera: the shared
//     bgScale 1 + (k - 1) * 0.3 would be 3.8x at k 10.4 (far over 1.0x of
//     source). Here bgScale = k^0.09 (max 1.235 -> 0.986x of source) and the
//     paper slides 0.15 of month 0's screen glide; drift -0.3 px/frame as shared.
//   * The sway is applied in SCREEN px (3 / 5 px) — in world px it would be a
//     50 px wobble at the open.
//   * The chain is drawn locally, not with `ChainEcho`: its single `from`
//     offset can't start all three text copies hidden behind the core (they
//     need 36 / 24 / 12 px of travel each); same colours, steps, ease, travel
//     and stagger.
//   * The payoff type is screen-pinned (see THE PAYOFF).
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  payoff: z.string(),
  beats: z.object({
    iThought: z.number(), // 0
    maybeGoing: z.number(), // 9  — day 1
    couple: z.number(), // 35
    weeks: z.number(), // 43 — days 2-14 land
    maybeA: z.number(), // 49
    month: z.number(), // 56 — days 15-35 land
    atMost: z.number(), // 61 — the stretch
    six: z.number(), // 77 — the payoff
    years: z.number(), // 84 — landed
    cut: z.number(), // 93 — "I'm here"
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  shadow: SHADOW,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  payoff: "6 YEARS",
  beats: {
    iThought: 0,
    maybeGoing: 9,
    couple: 35,
    weeks: 43,
    maybeA: 49,
    month: 56,
    atMost: 61,
    six: 77,
    years: 84,
    cut: 93,
  },
});

// ---------------------------------------------------------------------------
// GEOMETRY (world px; the wall's rest frame is k = 1, world = screen).
// ---------------------------------------------------------------------------
export const PITCH = 13; // cell pitch
export const GAP = 2.8; // gutter between cells at full detail
export const MW = 7 * PITCH - GAP; // 88.2 — a month's outer width
export const MH = 5 * PITCH - GAP; // 62.2 — a month's outer height
export const COL_G = 17; // between months
export const ROW_G = 30; // between years
export const MONTHS = 12;
export const YEARS = 6;
export const WALL_W = MONTHS * MW + (MONTHS - 1) * COL_G; // 1245.4
export const WALL_H = YEARS * MH + (YEARS - 1) * ROW_G; // 523.2
export const C_X = FRAME_W / 2; // 960
export const C_Y = CONTENT_SCREEN_Y; // 520
export const WALL_X0 = C_X - WALL_W / 2; // 337.3
export const WALL_Y0 = C_Y - WALL_H / 2; // 258.4
export const M0X = WALL_X0 + MW / 2; // month 0 centre
export const M0Y = WALL_Y0 + MH / 2;
const monthX = (mo: number) => WALL_X0 + mo * (MW + COL_G);
const monthY = (yr: number) => WALL_Y0 + yr * (MH + ROW_G);

// -- the camera ----------------------------------------------------------------
export const K_OPEN = 10.1; // month 0 is 628 px tall (58%)
export const K_REF = 10.45; // end of the creep, 650 px (60%) — also the stroke's reference
export const K_REST = 1.0;
export const K_HOLD = 1.02;
export const CREEP_F1 = 56;
export const PULL_F0 = 56;
export const PULL_F1 = 68;
export const PULL_WARP = 1;
const AX = C_X - M0X; // (W - m0), screen px at k 1
const AY = C_Y - M0Y;

const keyAt = (f: number) => {
  if (f <= CREEP_F1) {
    const g = camEase(f / CREEP_F1, 1);
    return { L: Math.log(K_OPEN) + (Math.log(K_REF) - Math.log(K_OPEN)) * g, a: 0, kc: 1 };
  }
  if (f <= PULL_F1) {
    const g = camEase((f - PULL_F0) / (PULL_F1 - PULL_F0), PULL_WARP);
    return { L: Math.log(K_REF) * (1 - g) + Math.log(K_REST) * g, a: g, kc: 1 };
  }
  const g = camEase((f - PULL_F1) / (DURATION - PULL_F1), 1);
  const L = Math.log(K_REST) + (Math.log(K_HOLD) - Math.log(K_REST)) * g;
  return { L, a: 1, kc: Math.exp(L) };
};

type Cam = { k: number; ax: number; ay: number };
// The damped camera for every frame, once. A key per frame, so the damper's
// target is the eased curve itself.
export const CAM: Cam[] = (() => {
  const out: Cam[] = [];
  const k0 = keyAt(0);
  let L = k0.L;
  let ax = 0;
  let ay = 0;
  let vL = 0;
  let vx = 0;
  let vy = 0;
  for (let f = 0; f <= DURATION; f++) {
    if (f > 0) {
      const t = keyAt(f);
      const tx = AX * t.a * t.kc;
      const ty = AY * t.a * t.kc;
      vL += (t.L - L) * CAM_STIFF - vL * CAM_DAMP;
      L += vL;
      vx += (tx - ax) * CAM_STIFF - vx * CAM_DAMP;
      ax += vx;
      vy += (ty - ay) * CAM_STIFF - vy * CAM_DAMP;
      ay += vy;
    }
    out.push({ k: Math.exp(L), ax, ay });
  }
  return out;
})();
const camAt = (f: number) => CAM[Math.max(0, Math.min(DURATION, Math.round(f)))];

// -- the wave ------------------------------------------------------------------
export const ANISO_Y = 2.0;
export const WAVE_R0 = 50; // just inside month 1's nearest column (61)
export const WAVE_GAIN = 1.04;
const dist = (dx: number, dy: number) => Math.hypot(dx, dy * ANISO_Y);
// How far (anisotropic, world px) the frame reaches from month 0's centre:
// the bottom-right frame corner, the way the wall extends.
const reach = (c: Cam) =>
  dist((FRAME_W - C_X + c.ax) / c.k, (FRAME_H - C_Y + c.ay) / c.k);
export const WAVE_R: number[] = (() => {
  const r0 = reach(CAM[PULL_F0]);
  const out: number[] = [];
  let best = -Infinity;
  for (let f = 0; f <= DURATION; f++) {
    const r = f < PULL_F0 ? -Infinity : WAVE_R0 + WAVE_GAIN * (reach(CAM[f]) - r0);
    best = Math.max(best, r);
    out.push(best);
  }
  return out;
})();
const waveStart = (d: number) => {
  for (let f = PULL_F0; f <= DURATION; f++) {
    if (WAVE_R[f] >= d) return f;
  }
  return DURATION;
};

// -- the cells (month 0 only) and the blocks (every other month) --------------
export const FILL_FRAMES = 6; // a day of month 0 wipes in over 6 frames
export const MONTH_WIPE = 5; // a lived month wipes in over 5 frames
export const BLOCK_R = 4; // SCREEN px, a month block's corner radius (BLOCK_R / k world)
const EASE_FILL = Easing.out(Easing.cubic);
// The wipe's progress. It reaches 1 at 94% of the ease, so a landing cell
// closes on its neighbour in one frame instead of leaving a hairline for two.
const wipeAt = (frame: number, start: number, dur: number) =>
  Math.min(1, EASE_FILL(Math.max(0, Math.min(1, (frame - start) / dur))) / 0.94);

type Cell = { r: number; c: number; start: number; dur: number };
const lerpLand = (i: number, n: number, a: number, b: number) =>
  Math.round(n <= 1 ? b : a + ((b - a) * i) / (n - 1));
export const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      const day = r * 7 + c; // 0-based
      let land: number;
      if (day === 0) land = 10;
      else if (day < 14) land = lerpLand(day - 1, 13, 37, 43);
      else land = lerpLand(day - 14, 21, 50, 56);
      out.push({ r, c, start: land - FILL_FRAMES, dur: FILL_FRAMES });
    }
  }
  return out;
})();
export const MONTH0_DONE = Math.max(...CELLS.map((c) => c.start + c.dur));
// Every other month: the frame the wave reaches its LEFT edge (mid-height),
// where its wipe starts.
export const MONTH_START: number[] = (() => {
  const out: number[] = [];
  for (let yr = 0; yr < YEARS; yr++) {
    for (let mo = 0; mo < MONTHS; mo++) {
      out.push(
        yr === 0 && mo === 0 ? 0 : waveStart(dist(monthX(mo) - M0X, monthY(yr) + MH / 2 - M0Y)),
      );
    }
  }
  return out;
})();
export const WALL_DONE = Math.max(...MONTH_START.map((f) => f + MONTH_WIPE));

// A rect with its own radius per corner (tl, tr, br, bl), origin top-left.
const rrect = (x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number) =>
  `M${x + tl} ${y}H${x + w - tr}${tr ? `A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}` : ""}V${y + h - br}${
    br ? `A${br} ${br} 0 0 1 ${x + w - br} ${y + h}` : ""
  }H${x + bl}${bl ? `A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}` : ""}V${y + tl}${tl ? `A${tl} ${tl} 0 0 1 ${x + tl} ${y}` : ""}Z`;

// m(k): 1 = full detail gutters, 0 = the month is one block. Screen gutter
// >= MERGE_HI px: full detail; <= MERGE_LO px: closed.
export const MERGE_LO = 6;
export const MERGE_HI = 16;
const mergeAt = (k: number) => {
  const v = Math.max(0, Math.min(1, (GAP * k - MERGE_LO) / (MERGE_HI - MERGE_LO)));
  return v * v * (3 - 2 * v);
};

// -- the payoff ------------------------------------------------------------------
export const PAY_SIZE = 230;
export const PAY_BASELINE = C_Y + (BARLOW_CAP * PAY_SIZE) / 2; // cap centre on 520
export const TEXT_F0 = 70;
export const CHAIN_F0 = 75;
export const RECEDE_F0 = 64;
export const RECEDE_F1 = 74;

const SixYearsLater: React.FC<Props> = ({ ink, shadow, orange, purple, blue, payoff }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const s = sway(frame);
  // screen = C + (world - m0) * k - A, plus the hand's sway in screen px
  const tx = C_X - M0X * k - cam.ax + s.dx;
  const ty = C_Y - M0Y * k - cam.ay + s.dy;
  const off = SHADOW_OFF / k; // 4 screen px at every k
  const sw = STROKE / K_REF; // 6 px at the open shot

  // The paper: the shared PaperGround, handed a remapped camera so that across
  // a 10x pull it zooms only k^0.09 (<= 1.235, under 1.0x of source) and slides
  // 0.15 of month 0's screen glide. bgScale = 1 + (kp - 1) * 0.3 = k^0.09.
  const kp = 1 + (Math.pow(k, 0.09) - 1) / 0.3;
  const paperCx = cam.ax / kp;
  const paperCy = cam.ay / kp;

  // the visible world box, for culling
  const vx0 = (0 - tx) / k - 20;
  const vx1 = (FRAME_W - tx) / k + 20;
  const vy0 = (0 - ty) / k - 20;
  const vy1 = (FRAME_H - ty) / k + 20;

  const m = mergeAt(k);
  const g = GAP * m; // the gutter between cells, world px
  const cs = (MW - 6 * g) / 7; // cell side (width)
  const csh = (MH - 4 * g) / 5; // cell side (height) — equal to cs

  const shadows: React.ReactNode[] = [];
  const whites: React.ReactNode[] = [];

  // the corner radius is screen-constant, like the shadow, so a block reads
  // as the same barely-rounded card at every zoom
  const rb = BLOCK_R / k;
  const clips: React.ReactNode[] = [];
  // A left->right wipe: everything of the shape (white AND its shadow) left of
  // x + (w + off) * e, so the shadow is uncovered with the white it belongs to.
  const wipeClip = (id: string, x: number, y: number, w: number, h: number, e: number) => {
    clips.push(
      <clipPath key={id} id={id}>
        <rect x={x - 2} y={y - 2} width={2 + (w + off) * e} height={h + off + 4} />
      </clipPath>,
    );
    return `url(#${id})`;
  };

  // EVERY OTHER MONTH: one filled rounded block on its own hard shadow, never
  // cells. It wipes in left->right when the wave reaches it.
  for (let yr = 0; yr < YEARS; yr++) {
    for (let mo = 0; mo < MONTHS; mo++) {
      const i = yr * MONTHS + mo;
      if (i === 0) continue;
      const x = monthX(mo);
      const y = monthY(yr);
      if (x > vx1 || x + MW < vx0 || y > vy1 || y + MH < vy0) continue;
      const e = wipeAt(frame, MONTH_START[i], MONTH_WIPE);
      if (e <= 0) continue;
      const d = rrect(x, y, MW, MH, rb, rb, rb, rb);
      const clip = e < 1 ? wipeClip(`sy-m${i}`, x, y, MW, MH, e) : undefined;
      shadows.push(
        <path key={`ms${i}`} d={d} transform={`translate(${off} ${off})`} fill={shadow} clipPath={clip} />,
      );
      whites.push(<path key={`mw${i}`} d={d} fill={ink} clipPath={clip} />);
    }
  }

  // MONTH 0: its 35 day cells until the gutters have closed, then the same
  // rounded block as every other month.
  const m0x = monthX(0);
  const m0y = monthY(0);
  if (m === 0 && frame >= MONTH0_DONE) {
    const d = rrect(m0x, m0y, MW, MH, rb, rb, rb, rb);
    shadows.push(<path key="m0s" d={d} transform={`translate(${off} ${off})`} fill={shadow} />);
    whites.push(<path key="m0w" d={d} fill={ink} />);
  } else {
    // the month's outer corners round in as the gutters close, so the block
    // it becomes is the same rounded block as the others
    const rc = rb * (1 - m);
    CELLS.forEach((cell, idx) => {
      const x = m0x + cell.c * (cs + g);
      const y = m0y + cell.r * (csh + g);
      if (x > vx1 || x + cs < vx0 || y > vy1 || y + csh < vy0) return;
      const e = wipeAt(frame, cell.start, cell.dur);
      if (e < 1) {
        shadows.push(
          <rect
            key={`os${idx}`}
            x={x + sw / 2 + off}
            y={y + sw / 2 + off}
            width={cs - sw}
            height={csh - sw}
            fill="none"
            stroke={shadow}
            strokeWidth={sw}
          />,
        );
        whites.push(
          <rect
            key={`ow${idx}`}
            x={x + sw / 2}
            y={y + sw / 2}
            width={cs - sw}
            height={csh - sw}
            fill="none"
            stroke={ink}
            strokeWidth={sw}
          />,
        );
      }
      if (e <= 0) return;
      if (e < 1) {
        // the day being lived: the filled square and its shadow, wiped in
        // left->right (only ever at the open, where the corners are square)
        const edge = (cs + off) * e;
        shadows.push(
          <rect key={`fs${idx}`} x={x + off} y={y + off} width={Math.max(0, edge - off)} height={csh} fill={shadow} />,
        );
        whites.push(<rect key={`fw${idx}`} x={x} y={y} width={Math.min(cs, edge)} height={csh} fill={ink} />);
        return;
      }
      // A lived day. It bleeds into a CLOSING gutter (right/bottom, never past
      // the month's own edge) so abutting cells leave no antialiased seam for
      // the shadow layer to show through.
      const bleed = (1 - m) * (0.75 / k);
      const w = cs + (cell.c < 6 ? bleed : 0);
      const h = csh + (cell.r < 4 ? bleed : 0);
      const tl = cell.r === 0 && cell.c === 0 ? rc : 0;
      const tr = cell.r === 0 && cell.c === 6 ? rc : 0;
      const br = cell.r === 4 && cell.c === 6 ? rc : 0;
      const bl = cell.r === 4 && cell.c === 0 ? rc : 0;
      const d = rrect(x, y, w, h, tl, tr, br, bl);
      shadows.push(<path key={`fs${idx}`} d={d} transform={`translate(${off} ${off})`} fill={shadow} />);
      whites.push(<path key={`fw${idx}`} d={d} fill={ink} />);
    });
  }

  // the recede, 1 -> 0.3, behind the type
  const wallOp = interpolate(frame, [RECEDE_F0, RECEDE_F1], [1, OP_LOW], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });

  // the payoff: core slide-up + fade, and the crown rising out from behind it
  // The type is pinned to the content centre (plus the same sway) and only
  // takes the camera's scale once the camera is within the hold's range, so it
  // never rides the tail of the 10x pull: kt = clamp(k, 1, K_HOLD).
  const kt = Math.max(1, Math.min(K_HOLD, k));
  const toff = SHADOW_OFF / kt;
  const rise = textRise(frame, TEXT_F0, kt);
  const chainT = (i: number) =>
    interpolate(frame, [CHAIN_F0 + i * CHAIN_STAGGER, CHAIN_F0 + i * CHAIN_STAGGER + CHAIN_TRAVEL], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
  const textStyle = type(PAY_SIZE, 900);
  const word = (fill: string, dx: number, dy: number, key: string) => (
    <text key={key} x={C_X + dx} y={PAY_BASELINE + dy} textAnchor="middle" fill={fill} style={textStyle}>
      {payoff}
    </text>
  );
  const chain = [orange, purple, blue];

  return (
    <AbsoluteFill style={{ backgroundColor: "#C0C0C0" }}>
      <PaperGround frame={frame} cx={paperCx} cy={paperCy} cxRest={0} cyRest={0} k={kp} />
      <AbsoluteFill>
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
          <g transform={`translate(${tx} ${ty}) scale(${k})`}>
            <defs>{clips}</defs>
            <g opacity={wallOp < 1 ? wallOp : undefined}>
              <g>{shadows}</g>
              <g>{whites}</g>
            </g>
          </g>
          {rise.opacity > 0 ? (
            <g
              transform={`translate(${C_X + s.dx} ${C_Y + s.dy}) scale(${kt}) translate(${-C_X} ${-C_Y})`}
            >
              <g opacity={rise.opacity < 1 ? rise.opacity : undefined} transform={`translate(0 ${rise.dy})`}>
                {word(shadow, toff, toff, "pshadow")}
                {chain.map((c, i) =>
                  frame >= CHAIN_F0 + i * CHAIN_STAGGER
                    ? word(c, 0, -CROWN_STEP * (3 - i) * chainT(i), `pc${i}`)
                    : null,
                )}
                {word(ink, 0, 0, "pcore")}
              </g>
            </g>
          ) : null}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SixYearsLater;
