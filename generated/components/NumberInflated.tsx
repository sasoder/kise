import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLUE,
  CaptionStripDebug,
  EASE_LAND,
  FPS as SET_FPS,
  Figure,
  INK,
  Newspaper,
  ORANGE,
  PAPERS_NUMBER,
  PAPER_BASE,
  PURPLE,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  ShadowText,
  TallPaper,
  WorldTall,
  camEase,
  clamp,
  gridPos,
  runCamera2,
  sway,
  textRise,
  worldTransformTall,
} from "./deathCountShared";

// ---------------------------------------------------------------------------
// "NUMBER INFLATED" — cut B of "brent - the mine death count" (Core Memory,
// Ashlee Vance x Brent Underwood). 1080 x 1920, 24000/1001 fps, 142 frames,
// opaque, the core memory graphic standard (deathCountShared / cerroShared).
//
// CHECK LINE: "Every time the story was retold the death toll grew: the
// papers' 8-to-30 became 50, then 60."
//
// THE PICTURE: a message thread running down the frame. Bubble 1 belongs to a
// newspaper and holds the papers' number (8 solid + 22 hollow, "8–30").
// Bubble 2 inflates out of a person and has to stretch for twenty more
// (30 white + 20 orange, "50"); bubble 3 inflates out of the next person at
// fifty and stretches for ten more (+10 purple, "60"). The camera opens tight
// on bubble 1, glides down the thread at one steady speed while it widens,
// comes to rest on "60" and eases back to hold the staircase of three growing
// bubbles, and a fourth, EMPTY blue bubble inflates out of the next person and
// is still growing on the last frame.
//
// THE WORDS (local frame; f0 = sequence frame 640 = 26.693 s):
//   then over time 2-14 · I saw 14-23 · that 23 · number 30-40 · get 40 ·
//   inflated 47-57 · to 57 · 50 62-71 · to 71 · 60 75-81 · people 81-90 ·
//   you know 93 · as it 97 · happens 104 · with 112 · retelling 116-125 ·
//   of 125 · stories 129-137 · END 142
//
// THE MOTION (one move; the words are its inflections):
//   f0        bubble 1 + newspaper fill the width (954 px, 88 %), the bubble's
//             bottom edge at y 1064; teller 3 stands bottom-left; teller 2 is
//             just outside the right edge and comes in as the camera travels
//             (wholly in by f26); the camera is already moving
//   f35-49    bubble 2 inflates out of teller 2 from its tail tip: visible
//             f37, 100 % f46.3, 3.5 % over at f49, settled f57. Its three
//             rules are drawn across from the teller's side as it opens
//                                                           — "number get"
//   f46-57.5  its three white rows rise from behind their rules, a row at a
//             time (starts f46 / 48 / 50)                    — "inflated"
//   f49.5-57.5 it STRETCHES two rows taller: two new rules peel off the last
//             rule and ride the bottom edge down to their places
//   f53.5-64  the two ORANGE rows rise (starts f53.5 / 56.5; the 50th figure
//             is 96 % up at f61, 99 % at f62, at rest f64); "50" rises
//             f55-67 and the outline opens behind it f55-60  — "to 50"
//   f62-71    bubble 3 inflates out of teller 3 AT FIFTY: visible f63, 100 %
//             f69.5, 3 % over at f71, settled f78; its five rows fill
//             f68-79 (starts f68..72)                        — "50 ... to"
//   f73-78    it stretches ONE row; the PURPLE row rises f76.5-83.3 (the 60th
//             figure is 91 % up at f80, 98 % at f81); "60" rises f73-85
//                                                           — "60 people"
//   f64-86    the camera's travel decelerates to rest; from f84 it eases back
//             (zoom only) to the whole thread          — "you know, as it happens"
//   f100-     teller 4's EMPTY BLUE bubble (stroke 8) inflates, slowly: visible
//             f102, s 0.41 at f118, 0.58 at f130, 0.69 at f141 = 420 px wide on
//             screen and still growing 0.009 per frame (the cut's one
//             chain-coloured payoff)     — "as it happens with retelling of stories"
//
// THE CAMERA — keyed per frame, damped by runCamera2, pre-rolled 40 frames so
// it is already moving on f0. ONE move:
//   * it opens at k 1.135 centred on bubble 1 (cx 420) and k eases OUT to 0.96
//     by f58 while cx slides to the thread's centre line (522, by f40);
//   * it travels straight down at a steady 10.8 world px per frame (12 -> 10
//     screen px) from before f0 to f64, then DECELERATES on a raised cosine to
//     rest at f86, cy 1248.5, and stays there;
//   * from f84 the ease back takes over: k only, about the screen centre
//     (0.953 -> 0.738 by f118), running on as a slow creep to 0.72 on f141.
// cy never decreases (the damper's own ring is 0.04 world px) and k only ever
// falls: no overshoot, no return, no kink. Bubble 2 is filled ABOVE the
// caption strip (its last rule is at y 1048 when the fifth row starts); bubble
// 3 is filled across it: "60" just above the strip, its first two white rows
// behind it, its third white row and the orange and purple rows below.
//
// THE DAMPED NUMBERS (no sway; screen y top-bottom of each bubble's box and of
// the two numerals' caps; "px/f" = the camera's vertical screen speed):
//     f    k      cx     cy      px/f   bubble 1    bubble 2    "50"       bubble 3    "60"       bubble 4
//     0    1.135  419.8   440.7   12.2   666-1064    -           -           -           -           -
//     10   1.077  464.0   548.4   11.6   565-943     -           -           -           -           -
//     20   1.032  495.9   656.1   11.1   471-832     -           -           -           -           -
//     30   0.999  515.0   763.8   10.8   379-729     -           -           -           -           -
//     40   0.976  521.6   871.5   10.5   287-629     742-865     -           -           -           -
//     48   0.965  522.0   957.7   10.4   211-550     661-1010    -           -           -           -
//     56   0.961  522.0  1043.8   10.3   132-469     580-1090    -           -           -           -
//     62   0.959  522.0  1108.4   10.3   72-408      519-1031    446-557     -           -           -
//     64   0.958  522.0  1129.8   10.2   52-388      499-1011    426-537     1096-1155   -           -
//     72   0.956  522.0  1204.2    7.3   -17-318     429-940     356-467     1050-1576   -           -
//     76   0.955  522.0  1228.2    4.8   -39-295     406-917     333-444     1027-1606   955-1066    -
//     80   0.954  522.0  1241.6    2.3   -51-283     394-904     321-432     1015-1612   942-1053    -
//     84   0.948  522.0  1246.8    0.8   -50-283     393-899     320-430     1009-1603   937-1047    -
//     86   0.941  522.0  1247.8    0.4   -43-287     396-899     324-434     1008-1597   936-1046    -
//     88   0.930  522.0  1248.2    0.2   -31-294     402-899     331-439     1007-1589   936-1044    -
//     90   0.916  522.0  1248.4    0.1   -17-304     410-900     340-447     1006-1580   936-1043    -
//     96   0.867  522.0  1248.5    0.0   36-339      440-903     374-475     1004-1546   938-1038    -
//     104  0.800  522.0  1248.5    0.0   107-387     480-907     419-512     1000-1502   939-1032    1569-1610
//     110  0.763  522.0  1248.5    0.0   147-414     502-910     444-533     998-1476    940-1029    1557-1679
//     118  0.738  522.0  1248.4    0.0   173-431     517-912     461-547     997-1460    941-1027    1545-1735
//     130  0.728  522.0  1248.4    0.0   184-439     523-912     468-552     997-1453    941-1026    1537-1803
//     141  0.720  522.0  1248.5    0.0   192-444     528-913     473-557     996-1447    941-1025    1531-1844
// Final frame: the three bubbles are 605 px wide and 252 / 385 / 451 px tall,
// the blue one 420 x 313 and growing; the numerals' caps 84 px; the thread
// spans x 164-910 and y 61-1844.
// ---------------------------------------------------------------------------

export const FPS = SET_FPS;
export const DURATION = 142;

export const schema = z.object({
  debugCaptions: z.boolean(),
  /** the three numerals, top to bottom */
  badges: z.tuple([z.string(), z.string(), z.string()]),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = {
  debugCaptions: false,
  badges: ["8–30", "50", "60"],
};

// -- the thread, world px ---------------------------------------------------------
export const FIG = 66; // a counted figure's box
export const PITCH_X = 76;
export const PITCH_Y = 92;
export const BW = 840; // every bubble's width
const PAD_X = (BW - (9 * PITCH_X + FIG)) / 2; // 45
const PAD_T = 60; // top edge -> first row's box top
/** a row's rule (centre line) below that row's box top: the figures stand
 *  SHADOW_OFF clear of it, so their hard shadow reads as a line on the rule */
const RULE_DY = 0.9 * FIG + SHADOW_OFF + STROKE / 2; // 66.4
const PAD_B = 40; // last rule -> bottom edge
export const bubbleH = (rows: number) => PAD_T + (rows - 1) * PITCH_Y + RULE_DY + PAD_B;
const CORNER = 36;
const TAIL_H = 42;
const TAIL_B = 24; // half the tail's base
const GAP_B = 116; // a bubble's bottom edge -> the next bubble's top edge
const SHIFT = 200; // the right-hand bubbles sit this far right
const TELLER = 172; // a person's box
const NEWS_INSET = 20;
/** a person's box overhangs its bubble's outer corner by 12, so teller 2 is
 *  wholly outside the tight opening frame and comes in as the camera travels */
const TELLER_INSET = -12;
const NEWS_W = 200;
const NEWS_H = 145;

type Bubble = { key: string; x0: number; top: number; tipX: number; tipY: number };
type Teller = { x: number; y: number };

// Bubble 1: the newspaper, top-left.
const NEWS = { x: NEWS_INSET, y: 0 };
const B1: Bubble = {
  key: "b1",
  x0: 0,
  top: NEWS.y + NEWS_H - 5 + TAIL_H,
  tipX: NEWS.x + NEWS_W / 2,
  tipY: NEWS.y + NEWS_H - 5,
};
// A person stands above its bubble's outer corner; the tail's tip is tucked
// 5 px inside the shoulders' base, so the bubble comes out from behind them.
const personBubble = (key: string, prevBottom: number, right: boolean): { b: Bubble; t: Teller } => {
  const top = prevBottom + GAP_B;
  const x0 = right ? SHIFT : 0;
  const tx = right ? x0 + BW - TELLER_INSET - TELLER : x0 + TELLER_INSET;
  const ty = top - TAIL_H - (0.9 * TELLER - 5);
  return { b: { key, x0, top, tipX: tx + TELLER / 2, tipY: top - TAIL_H }, t: { x: tx, y: ty } };
};
const P2 = personBubble("b2", B1.top + bubbleH(3), true);
const P3 = personBubble("b3", P2.b.top + bubbleH(5), false);
const P4 = personBubble("b4", P3.b.top + bubbleH(6), true);
const B2 = P2.b;
const B3 = P3.b;
const B4 = P4.b;
const B4_ROWS = 6; // the size the empty one is heading for (it never gets there)
const B4_STROKE = 8; // the only thin line in the wide: a touch heavier

// Badges: Barlow 900, cap 116 world px, baseline 40 under the top edge, on the
// side away from the teller. The outline OPENS behind the numerals (the paper
// itself is the backing), so the line never runs through a glyph.
const BADGE_SIZE = 166;
const BADGE_DROP = 40;
const BADGES = [
  { b: B1, cx: B1.x0 + BW - 250, half: 196 },
  { b: B2, cx: B2.x0 + 180, half: 112 },
  { b: B3, cx: B3.x0 + BW - 180, half: 112 },
] as const;

// -- timing ------------------------------------------------------------------------
export const T = {
  b2: { start: 35, rise: 14, over: 0.035, settle: 8 },
  b2Rows: [46, 48, 50, 53.5, 56.5],
  b2Stretch: [49.5, 57.5],
  b2Badge: 55,
  b3: { start: 62, rise: 9, over: 0.03, settle: 7 },
  b3Rows: [68, 69, 70, 71, 72, 76.5],
  b3Stretch: [73, 78],
  b3Badge: 73,
  b4: { start: 100 },
  colStagger2: 0.22,
  colStagger3: 0.2,
  figRise2: 5.5,
  figRise3: 5,
} as const;
const BREATH = Easing.bezier(0.45, 0, 0.35, 1);

/** A bubble's size, 0..1(+over): blown up fast, a small overshoot, one settle. */
const inflate = (f: number, p: { start: number; rise: number; over: number; settle: number }) => {
  if (f <= p.start) return 0;
  const up = interpolate(f, [p.start, p.start + p.rise], [0, 1 + p.over], { easing: BREATH, ...clamp });
  const back = interpolate(f, [p.start + p.rise, p.start + p.rise + p.settle], [0, p.over], {
    easing: Easing.inOut(Easing.sin),
    ...clamp,
  });
  return up - back;
};
const stretch = (f: number, range: readonly [number, number] | readonly number[], rows: number) =>
  rows *
  PITCH_Y *
  interpolate(f, [range[0], range[1]], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
/** The empty one: out of the teller gently, then a long slowing breath that has
 *  not finished by the last frame. */
export const inflate4 = (f: number) => {
  const t = f - T.b4.start;
  if (t <= 0) return 0;
  const soft = Math.min(1, t / 6);
  // 0.694 of its rest size on f141 (420 px wide on screen), +0.009 per frame
  return 0.976 * (1 - Math.exp(-t / 33)) * soft * soft * (3 - 2 * soft);
};

// -- geometry helpers ----------------------------------------------------------------
/** The inflation, about the tail tip. The TAIL reaches its full size first
 *  (by s = 1/3) and the body then scales about the tip under it, positions
 *  only: strokes, shadows, corners and the figures keep their size, so this is
 *  a bubble filling up, not a picture being zoomed. `v` = px under the bubble's
 *  top edge at rest. */
const tailK = (s: number) => Math.min(1, s * 3);
const mapper = (b: Bubble, s: number) => {
  const yT = b.tipY + TAIL_H * tailK(s);
  return {
    x: (x: number) => b.tipX + (x - b.tipX) * s,
    v: (v: number) => yT + v * s,
  };
};

const outlinePath = (b: Bubble, s: number, h: number, gap?: { cx: number; half: number }) => {
  const m = mapper(b, s);
  const xL = m.x(b.x0);
  const xR = m.x(b.x0 + BW);
  const yT = m.v(0);
  const yB = m.v(h);
  const tb = TAIL_B * tailK(s);
  const rFar = Math.max(0, Math.min(CORNER, (xR - xL) / 2, (yB - yT) / 2));
  // the top corner beside the tail stays tight until there is room for it
  const tailLeft = b.tipX - b.x0 < BW / 2;
  const room = (tailLeft ? b.tipX - xL : xR - b.tipX) - tb - 1;
  const rNear = Math.max(0, Math.min(rFar, room));
  const rTL = tailLeft ? rNear : rFar;
  const rTR = tailLeft ? rFar : rNear;
  const n = (v: number) => v.toFixed(2);
  const tail = `L${n(b.tipX - tb)} ${n(yT)} L${n(b.tipX)} ${n(b.tipY)} L${n(b.tipX + tb)} ${n(yT)}`;
  const arc = (r: number, x: number, y: number) => `A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y)}`;
  const around = [
    `L${n(xR - rTR)} ${n(yT)}`,
    arc(rTR, xR, yT + rTR),
    `L${n(xR)} ${n(yB - rFar)}`,
    arc(rFar, xR - rFar, yB),
    `L${n(xL + rFar)} ${n(yB)}`,
    arc(rFar, xL, yB - rFar),
    `L${n(xL)} ${n(yT + rTL)}`,
    arc(rTL, xL + rTL, yT),
  ].join(" ");
  if (!gap || gap.half <= 0.5) return `M${n(xL + rTL)} ${n(yT)} ${tail} ${around} Z`;
  const g0 = m.x(gap.cx - gap.half);
  const g1 = m.x(gap.cx + gap.half);
  const tailRight = b.tipX > gap.cx;
  return `M${n(g1)} ${n(yT)} ${tailRight ? tail : ""} ${around} ${tailRight ? "" : tail} L${n(g0)} ${n(yT)}`;
};

const Outline: React.FC<{ d: string; ink?: string; weight?: number }> = ({ d, ink = INK, weight = STROKE }) => (
  <g>
    <path
      d={d}
      transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}
      fill="none"
      stroke={SHADOW}
      strokeWidth={weight}
      strokeLinejoin="round"
      strokeLinecap="butt"
    />
    <path d={d} fill="none" stroke={ink} strokeWidth={weight} strokeLinejoin="round" strokeLinecap="butt" />
  </g>
);

type RowSpec = {
  /** the rule's centre line, local px under the bubble's top edge */
  v: number;
  ink: string;
  modes: ReadonlyArray<"solid" | "hollow">;
  /** each figure's rise, 0 (hidden under the rule) .. 1 (standing) */
  t: number[];
  /** how much of the rule is drawn, 0..1, from the teller's side (default 1) */
  draw?: number;
};

const restV = (row: number) => PAD_T + row * PITCH_Y + RULE_DY;
const COLS = Array.from({ length: 10 }, (_, c) => c);

/** The rows of a bubble: each row's rule on its hard shadow, and its figures
 *  rising from behind the rule (clipped to the rule's top edge). */
const Rows: React.FC<{ b: Bubble; s: number; rows: RowSpec[] }> = ({ b, s, rows }) => {
  const m = mapper(b, s);
  const x0 = m.x(b.x0 + PAD_X);
  const x1 = m.x(b.x0 + BW - PAD_X);
  const fromRight = b.tipX - b.x0 > BW / 2;
  return (
    <g>
      {rows.map((row, r) => {
        const y = m.v(row.v);
        const ruleTop = y - STROKE / 2;
        const d = row.draw ?? 1;
        if (d <= 0) return null;
        // the rule is drawn on from the wall beside the teller
        const r0 = fromRight ? x1 - (x1 - x0) * d : x0;
        const r1 = fromRight ? x1 : x0 + (x1 - x0) * d;
        const moving = row.t.some((t) => t < 1);
        const figs = COLS.map((c) => {
          const t = row.t[c];
          if (t <= 0) return null;
          const slot = gridPos(c, { pitchX: PITCH_X, pitchY: PITCH_Y });
          const cx = m.x(b.x0 + PAD_X + slot.x + FIG / 2);
          return (
            <Figure
              key={c}
              x={cx - FIG / 2}
              y={ruleTop - SHADOW_OFF - 0.9 * FIG + (1 - t) * (0.9 * FIG + SHADOW_OFF)}
              size={FIG}
              mode={row.modes[c]}
              ink={row.ink}
            />
          );
        });
        const clipId = `ni-${b.key}-row-${r}`;
        return (
          <g key={r}>
            <line
              x1={r0 + SHADOW_OFF}
              y1={y + SHADOW_OFF}
              x2={r1 + SHADOW_OFF}
              y2={y + SHADOW_OFF}
              stroke={SHADOW}
              strokeWidth={STROKE}
            />
            <line x1={r0} y1={y} x2={r1} y2={y} stroke={INK} strokeWidth={STROKE} />
            {moving ? (
              <>
                <defs>
                  <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                    <rect x={x0 - 40} y={ruleTop - FIG - 60} width={x1 - x0 + 80} height={FIG + 60} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${clipId})`}>{figs}</g>
              </>
            ) : (
              figs
            )}
          </g>
        );
      })}
    </g>
  );
};

/** A rule is drawn across as its bubble opens: nothing in the small blob, the
 *  top rule first, all of them across by s = 0.9. */
const ruleDraw = (s: number, row: number) => Math.max(0, Math.min(1, (s - 0.25 - 0.03 * row) / 0.5));
const SOLID10: ReadonlyArray<"solid"> = COLS.map(() => "solid");
const DONE10 = COLS.map(() => 1);
const rowRise = (f: number, start: number, stagger: number, dur: number) =>
  COLS.map((c) =>
    interpolate(f, [start + c * stagger, start + c * stagger + dur], [0, 1], { easing: EASE_LAND, ...clamp }),
  );

// -- the camera ---------------------------------------------------------------------
// ONE move. It opens tight on bubble 1 (k 1.135: the bubble is 88 % of the
// frame width, centred) and is already travelling: straight down the thread at
// a steady V world px per frame while k eases out to 0.96 (by f58) and the
// centre slides from bubble 1's middle to the thread's centre line (by f40).
// From f64 the travel DECELERATES on a raised cosine and comes to rest at
// f86, cy 1248.5, and there it stays: the ease back that takes over from f84
// is k alone, about the screen centre, so cy never overshoots and never
// returns, and k itself only ever falls (the ease back runs on as a slow
// creep that is still going on the last frame).
// `desired` is what the damped camera should do; runCamera2 trails a smooth
// target by CAM_DAMP / CAM_STIFF - 1 = 4.2 frames, so the keys are `desired`
// read 4.2 frames early, and the pre-roll makes that true from f0.
const PRE = 40; // frames of pre-roll
const LAG = 4.2;
export const CAM = {
  k0: 1.135,
  kGlide: 0.96, // reached at zoomEnd, on the glide
  zoomEnd: 58,
  kHold: 0.953, // a creep while bubble 3 fills
  back: [84, 118], // the ease back (k only): its main part
  backCreep: 0.2, // the share of it that is a steady creep to the last frame
  kEnd: 0.72, // on f141, still easing back
  x0: 420, // bubble 1's middle
  x1: 522, // the thread's centre line
  panEnd: 40,
  cy0: 440.7, // bubble 1's bottom edge (with its shadow) at screen y 1072
  v: 10.77,
  decel: [64, 86], // the travel comes to rest
} as const;
const kGeo = (k0: number, k1: number, g: number) => k0 * Math.pow(k1 / k0, g);
/** quadratic ease-out, carried on along its tangent before 0 (the pre-roll) */
const easeOutQuad = (u: number) => (u <= 0 ? 2 * u : u >= 1 ? 1 : 1 - (1 - u) * (1 - u));
const CY_END = CAM.cy0 + CAM.v * CAM.decel[0] + (CAM.v * (CAM.decel[1] - CAM.decel[0])) / 2; // 1248.5
const desired = (f: number) => {
  let k: number;
  if (f <= CAM.zoomEnd) k = kGeo(CAM.k0, CAM.kGlide, easeOutQuad(f / CAM.zoomEnd));
  else if (f <= CAM.back[0]) k = kGeo(CAM.kGlide, CAM.kHold, (f - CAM.zoomEnd) / (CAM.back[0] - CAM.zoomEnd));
  else {
    // the ease back never quite finishes: 80 % of it on the eased curve to
    // f118, 20 % as a steady creep that is still running on the last frame
    const main = camEase((f - CAM.back[0]) / (CAM.back[1] - CAM.back[0]), 0.85);
    const creep = (f - CAM.back[0]) / (DURATION - 1 - CAM.back[0]);
    k = kGeo(CAM.kHold, CAM.kEnd, (1 - CAM.backCreep) * main + CAM.backCreep * creep);
  }
  const cx = CAM.x0 + (CAM.x1 - CAM.x0) * easeOutQuad(f / CAM.panEnd);
  let cy: number;
  if (f <= CAM.decel[0]) cy = CAM.cy0 + CAM.v * f;
  else if (f < CAM.decel[1]) {
    const span = CAM.decel[1] - CAM.decel[0];
    const u = (f - CAM.decel[0]) / span;
    cy = CAM.cy0 + CAM.v * CAM.decel[0] + ((CAM.v * span) / 2) * (u + Math.sin(Math.PI * u) / Math.PI);
  } else cy = CY_END;
  return { k, cx, cy };
};
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_CY: number[] = [];
const CAM_CX: number[] = [];
for (let g = 0; g <= DURATION + PRE; g++) {
  const key = desired(g - PRE + LAG);
  CAM_F.push(g);
  CAM_K.push(key.k);
  CAM_CY.push(key.cy);
  CAM_CX.push(key.cx);
}
/** the damped camera at a local frame (no sway) */
export const cameraAt = (frame: number) => runCamera2(frame + PRE, CAM_F, CAM_CY, CAM_CX, CAM_K);
const CX_REST = 480;
const CY_REST = 850; // the middle of the camera's travel

/** where things are on screen, for the header table and the reviews */
export const layoutAt = (frame: number) => {
  const cam = cameraAt(frame);
  const t = worldTransformTall(cam.cx, cam.cy, cam.k);
  const sy = (y: number) => t.ty + y * cam.k;
  const sx = (x: number) => t.tx + x * cam.k;
  const s2 = inflate(frame, T.b2);
  const s3 = inflate(frame, T.b3);
  const s4 = inflate4(frame);
  const h2 = bubbleH(3) + stretch(frame, T.b2Stretch, 2);
  const h3 = bubbleH(5) + stretch(frame, T.b3Stretch, 1);
  const box = (b: Bubble, s: number, h: number) => {
    const m = mapper(b, s);
    return { x0: sx(m.x(b.x0)), x1: sx(m.x(b.x0 + BW)), y0: sy(m.v(0)), y1: sy(m.v(h)) };
  };
  const badge = (b: Bubble) => ({ top: sy(b.top + BADGE_DROP - 0.7 * BADGE_SIZE), bottom: sy(b.top + BADGE_DROP) });
  return {
    cam,
    news: { y0: sy(NEWS.y), y1: sy(NEWS.y + NEWS_H) },
    b1: box(B1, 1, bubbleH(3)),
    b2: box(B2, s2, h2),
    b3: box(B3, s3, h3),
    b4: box(B4, s4, bubbleH(B4_ROWS)),
    badge1: badge(B1),
    badge2: badge(B2),
    badge3: badge(B3),
    t2: { y0: sy(P2.t.y), y1: sy(P2.t.y + TELLER) },
    /** the tellers' ink (with shadow), screen x */
    t2x: { x0: sx(P2.t.x + 0.12 * TELLER), x1: sx(P2.t.x + 0.88 * TELLER + SHADOW_OFF) },
    t3x: { x0: sx(P3.t.x + 0.12 * TELLER), x1: sx(P3.t.x + 0.88 * TELLER + SHADOW_OFF) },
    t3: { y0: sy(P3.t.y), y1: sy(P3.t.y + TELLER) },
    t4: { y0: sy(P4.t.y), y1: sy(P4.t.y + TELLER) },
    rowTop: (b: 1 | 2 | 3, row: number) => sy([B1, B2, B3][b - 1].top + PAD_T + row * PITCH_Y + 0.1 * FIG),
    rowBottom: (b: 1 | 2 | 3, row: number) => sy([B1, B2, B3][b - 1].top + restV(row) + STROKE / 2),
    s: { s2, s3, s4 },
  };
};

const NumberInflated: React.FC<Props> = ({ debugCaptions, badges }) => {
  const frame = useCurrentFrame();

  const cam = cameraAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;

  // -- bubble 1: the papers' number, complete from f0 --------------------------------
  const rows1: RowSpec[] = [0, 1, 2].map((r) => ({
    v: restV(r),
    ink: INK,
    modes: PAPERS_NUMBER.slice(r * 10, r * 10 + 10),
    t: DONE10,
  }));

  // -- bubble 2: thirty, then it stretches for twenty more ---------------------------
  const s2 = inflate(frame, T.b2);
  const h2 = bubbleH(3) + stretch(frame, T.b2Stretch, 2);
  const rows2: RowSpec[] = [0, 1, 2, 3, 4].map((r) => ({
    // a new row's rule rides the bottom edge down until it reaches its place
    v: Math.min(restV(r), h2 - PAD_B),
    draw: ruleDraw(s2, r),
    ink: r < 3 ? INK : ORANGE,
    modes: SOLID10,
    t: rowRise(frame, T.b2Rows[r], T.colStagger2, T.figRise2),
  }));

  // -- bubble 3: fifty, then it stretches for ten more -------------------------------
  const s3 = inflate(frame, T.b3);
  const h3 = bubbleH(5) + stretch(frame, T.b3Stretch, 1);
  const rows3: RowSpec[] = [0, 1, 2, 3, 4, 5].map((r) => ({
    v: Math.min(restV(r), h3 - PAD_B),
    draw: ruleDraw(s3, r),
    ink: r < 3 ? INK : r < 5 ? ORANGE : PURPLE,
    modes: SOLID10,
    t: rowRise(frame, T.b3Rows[r], T.colStagger3, T.figRise3),
  }));

  // -- bubble 4: the next retelling, empty, still inflating --------------------------
  const s4 = inflate4(frame);

  // -- the badges ---------------------------------------------------------------------
  const badgeStarts = [-100, T.b2Badge, T.b3Badge];
  const gapOpen = (i: number) =>
    BADGES[i].half *
    interpolate(frame, [badgeStarts[i], badgeStarts[i] + 5], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });
  const gapOf = (i: number) => ({ cx: BADGES[i].cx, half: gapOpen(i) });

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={CX_REST} cyRest={CY_REST} />
      <WorldTall cx={cx} cy={cy} k={k} id="ni-world">
        {/* the bubbles, behind their tellers */}
        <Outline d={outlinePath(B1, 1, bubbleH(3), gapOf(0))} />
        <Rows b={B1} s={1} rows={rows1} />

        {s2 > 0.004 ? (
          <>
            <Outline d={outlinePath(B2, s2, h2, gapOf(1))} />
            <Rows b={B2} s={s2} rows={rows2} />
          </>
        ) : null}

        {s3 > 0.004 ? (
          <>
            <Outline d={outlinePath(B3, s3, h3, gapOf(2))} />
            <Rows b={B3} s={s3} rows={rows3} />
          </>
        ) : null}

        {s4 > 0.004 ? <Outline d={outlinePath(B4, s4, bubbleH(B4_ROWS))} ink={BLUE} weight={B4_STROKE} /> : null}

        {/* the tellers: the paper, then three people. They do not move. */}
        <Newspaper x={NEWS.x} y={NEWS.y} w={NEWS_W} h={NEWS_H} />
        <Figure x={P2.t.x} y={P2.t.y} size={TELLER} mode="solid" />
        <Figure x={P3.t.x} y={P3.t.y} size={TELLER} mode="solid" />
        <Figure x={P4.t.x} y={P4.t.y} size={TELLER} mode="solid" />

        {/* the numerals */}
        {BADGES.map((bd, i) => {
          const r = textRise(frame, badgeStarts[i], k);
          if (r.opacity <= 0) return null;
          return (
            <ShadowText
              key={bd.b.key}
              text={badges[i]}
              x={bd.cx}
              y={bd.b.top + BADGE_DROP + r.dy}
              size={BADGE_SIZE}
              weight={900}
              anchor="middle"
              opacity={r.opacity}
            />
          );
        })}
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default NumberInflated;
