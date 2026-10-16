import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  ChainEcho,
  EASE_LAND,
  INK,
  ORANGE,
  PAPER_BASE,
  PURPLE,
  PaperGround,
  SHADOW,
  SHADOW_OFF,
  camEase,
  clamp,
  runCamera2,
  sway,
  textRise,
  type,
} from "../kits/core-memory/cerroShared";

// ---------------------------------------------------------------------------
// "HARVARD NUMBER ONE" — the CM_EARLY_JS trailer (Core Memory podcast, Andrew
// Kiguel), sequence 26.652-34.993 s. 2048 x 1080 (the 4096 x 2160 sequence at
// half size; the final is rendered --scale 2), 24000/1001 fps, 200 frames,
// opaque, the core memory graphic standard on cerroShared's 16:9 kit.
// ONE graphic, one clock, one camera across both of the editor's clips: it
// replaces the 9:16 pair HarvardReport + NumberOneCompanionship, whose drawing
// (sheet, shield + masthead, the underlined date, the ranked rows, row 1's
// slab, the picture frame, the pair, the label, the crown, the cascade) is
// copied here and laid out for 16:9.
//
// CHECK LINE: "A Harvard Business Review report from April 2025 ranked what
// people use AI for, and number one is companionship: a person and an AI."
//
// THE PICTURE: one wide report page lying on the squared paper, turned 2 deg,
// landscape like a magazine spread. LEFT half: the shield and HARVARD /
// BUSINESS / REVIEW, a heavy rule, the real headline HOW PEOPLE ARE / REALLY
// USING / GEN AI IN 2025 in black Barlow 900, and the date line APRIL 2025.
// RIGHT half: the ranked list, six rows. Rows 2-6 carry their real names over
// a bar (ORGANIZING MY LIFE, FINDING PURPOSE, ENHANCED LEARNING, GENERATING
// CODE, GENERATING IDEAS); row 1 is a plain black bar until the payoff.
// Fact: Harvard Business Review, "How People Are Really Using Gen AI in 2025",
// Marc Zao-Sanders, 9 April 2025.
// Colours: PURPLE = the report's ranking mark (the 1). ORANGE = the AI.
// The chain crown rises once, on the slab, as the payoff.
//
// THE WORDS (frame; f0 = sequence 26.652 s):
//   Harvard 0 · came 4 · out 12 · with 20 · report 28-40 · about 43 · nine 53 ·
//   months 60 · ago 66 · And 75 · the 82 · number 92 · one 99 · use 106 ·
//   case 111 · for 116 · AI 120 · not 130 · that 135 · there 140 · aren't 143 ·
//   several 146-154 · but 155 · the 158 · number 160 · one 165 · was 170 ·
//   companionship 174-192 · So 194 · END 200
//
// THE MOTION (one move; the words are its inflections):
//   f0       the page is already about 60 % in frame, sliding up from below,
//            turned -6 deg                                   — "Harvard"
//   f0-26    it slides onto its place (cubic ease-out) while its turn swings to
//            -2 deg with one soft overshoot; ~90 % of the frame width
//                                                            — "came out with a report"
//   f50-60   the pen underlines APRIL 2025, left to right    — "nine months"
//   f80-96   row 1 lifts off the page as a white slab on a hard shadow
//                                                            — "the number"
//   f90-99   purple rises through its "1" from the foot      — "number one"
//   f98-160  the slab grows upward, its bar thickening and (f104-134) hollowing
//            from its centre line into a thick black picture frame
//                                                            — "use case for AI ..."
//   f132-153 rows 2-6 answer top to bottom (starts 132/135/138/141/144, 9 f
//            each): name and bar slide 70 px out and back, the numeral bumps
//                                                            — "not that there aren't several"
//   f152-176 the slab grows to full size over the list column only (rows 2-6
//            all under it; masthead, headline and date stay readable on the
//            left)                                           — "but the number one was"
//   f172-181 the white bust stands up out of the frame's lower lip; f175-184
//            the ORANGE one marked "AI"; f180-185 the link is drawn between
//            them; f173-185 THERAPY / COMPANIONSHIP slides up under the frame;
//            f170- the chain crown rises behind the slab's top edge
//                                                            — "companionship"
//   f186-199 hold: the pair sways, the slab hovers, the camera creeps in
//
// THE CAMERA: keyed per frame, damped by runCamera2, pre-rolled 40 frames so
// it is already moving on f0. The WHOLE PAGE stays in frame for all 200
// frames: one geometric push that never stops (k 1.04 at the landing -> 1.115
// on the last frame), a gentle lean toward the list (f24-96, 46 world px) and
// back to centre for the payoff (f140-184). The hand-held sway rides on top.
// Damped numbers: `layoutAt` (printed in the builder's report).
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 200;
export const W = 2048;
export const H = 1080;

export const schema = z.object({
  masthead: z.tuple([z.string(), z.string(), z.string()]),
  headline: z.tuple([z.string(), z.string(), z.string()]),
  dateLine: z.string(),
  /** the names of rows 2-6 */
  rows: z.tuple([z.string(), z.string(), z.string(), z.string(), z.string()]),
  /** the rank-1 label: the small line, then the word */
  labelTop: z.string(),
  labelMain: z.string(),
  /** the mark on the orange bust */
  aiMark: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  masthead: ["HARVARD", "BUSINESS", "REVIEW"],
  headline: ["HOW PEOPLE ARE", "REALLY USING", "GEN AI IN 2025"],
  dateLine: "APRIL 2025",
  rows: ["ORGANIZING MY LIFE", "FINDING PURPOSE", "ENHANCED LEARNING", "GENERATING CODE", "GENERATING IDEAS"],
  labelTop: "THERAPY /",
  labelMain: "COMPANIONSHIP",
  aiMark: "AI",
});

// -- the sheet, world px (unrotated; it is then turned about SHEET_C) -----------
export const SHEET = { x: 0, y: 0, w: 1760, h: 760 } as const;
export const SHEET_C = { x: SHEET.x + SHEET.w / 2, y: SHEET.y + SHEET.h / 2 } as const;
export const TILT_REST = -2; // degrees, SVG sense (negative = anticlockwise)
const CAP = 0.7; // Barlow's cap height per em

// LEFT half
const MARGIN = 58;
const COL_R = 672; // the left column's right edge
const SHIELD = { x: MARGIN, y: 56, w: 124, h: 156 } as const;
const MAST = { x: 206, size: 88, baselines: [118, 194, 270] } as const;
const RULE = { y: 294, h: 10 } as const;
const HEAD = { size: 76, baselines: [388, 462, 536] } as const;
const DATE = { x: MARGIN + 2, baseline: 640, size: 76 } as const;
const DATE_W = 398; // the date line's ink width at DATE.size (measured off a render)
const UNDER_Y = 668;
const UNDER_W = 10;
const DIVIDER = { x: 694, y0: 56, y1: 704, w: 6 } as const;

// RIGHT half: the ranked list
export const LIST = {
  rowY0: 130,
  pitch: 106,
  numX: 770,
  numSize: 96,
  barX0: 826,
  barMax: 874,
  /** row 1: a plain bar, centred on the row */
  barH: 44,
  barR: 6,
  /** rows 2-6: the name (cap top at row - 41) over a thinner bar */
  nameSize: 56,
  nameBase: -2,
  subY: 13,
  subH: 24,
  lengths: [1.0, 0.86, 0.74, 0.66, 0.55, 0.47],
} as const;
const rowY = (r: number) => LIST.rowY0 + r * LIST.pitch;
export const Y1 = LIST.rowY0;

// -- the drop -------------------------------------------------------------------
const DROP = { from: 300, land: 26 } as const;
const SLIDE = Easing.out(Easing.cubic);
export const dropAt = (f: number) => (f >= DROP.land ? 0 : DROP.from * (1 - SLIDE(Math.max(0, f) / DROP.land)));
/** the sheet's turn, degrees: -6 at f0, swinging to -2 with one soft overshoot */
export const tiltAt = (f: number) => TILT_REST - 4 * Math.exp(-f / 7) * Math.cos(f / 9);

// -- the underline ---------------------------------------------------------------
const UNDER_D = (() => {
  const x0 = DATE.x + 2;
  const x1 = DATE.x + DATE_W + 6;
  const w = x1 - x0;
  return `M${x0} ${UNDER_Y + 3} C ${x0 + w * 0.22} ${UNDER_Y - 7}, ${x0 + w * 0.48} ${UNDER_Y + 9}, ${x0 + w * 0.68} ${UNDER_Y} S ${x0 + w * 0.92} ${UNDER_Y + 4}, ${x1} ${UNDER_Y - 6}`;
})();
const STROKE_EASE = Easing.bezier(0.3, 0, 0.3, 1);

// -- row 1's slab, SHEET px (it lives in the sheet's turned frame) ---------------
type Box = { x0: number; y0: number; x1: number; y1: number };
/** [at rest, grown above the rows (f160), full size (f180)] */
const SLAB_KEYS: [Box, Box, Box] = [
  { x0: 716, y0: 78, x1: 1736, y1: 182 },
  { x0: 716, y0: 30, x1: 1736, y1: 184 },
  { x0: 716, y0: 30, x1: 1736, y1: 740 },
];
const BAR_KEYS: [Box, Box, Box] = [
  { x0: 826, y0: 108, x1: 1700, y1: 152 },
  { x0: 826, y0: 46, x1: 1700, y1: 164 },
  { x0: 880, y0: 60, x1: 1700, y1: 560 },
];
const NUM_KEYS = [
  { size: 96, x: 770 },
  { size: 124, x: 772 },
  { size: 260, x: 800 },
] as const;
const SLAB_PIVOT = { x: 1226, y: Y1 }; // the slab's own turn is about row 1's middle
const LIFT = { dx: -5, dy: -8, shadow: 14, turn: 0.5 };
const CROWN = { step: 8, strip: 30 }; // a lower crown: it stays just above the page's top edge, in frame
const FRAME_T = 22; // the frame the bar leaves around the opening
// the pair
export const BUST = 420;
const PAIR_GAP = 70; // between the two shoulders' ink at their base
const STAND = 34; // their base above the lower lip
const LINK_H = 32;
const LINK_UP = 0.2 * BUST;
const LINK_HALF = PAIR_GAP / 2 + (0.38 - Math.sqrt(0.38 * 0.38 - 0.2 * 0.2)) * BUST + 10;
const AI_SIZE = 128;
// the label, printed on the slab under the frame
const TOP_SIZE = 54;
const MAIN_SIZE = 104;
const TOP_BASE = BAR_KEYS[2].y1 + 22 + CAP * TOP_SIZE;
export const MAIN_BASE = TOP_BASE + 16 + CAP * MAIN_SIZE;

// -- timing -------------------------------------------------------------------------
export const T = {
  under: [50, 60],
  lift: [80, 96],
  purple: [90, 99],
  growA: [98, 160],
  hollow: [104, 134],
  cascade: [132, 135, 138, 141, 144], // 9 frames each: done by f153
  growB: [152, 176],
  white: [172, 181],
  orange: [175, 184],
  link: [180, 185],
  echo: 170,
  label: 173,
} as const;

// -- sheet <-> world ---------------------------------------------------------------
const RAD = Math.PI / 180;
const turnPt = (x: number, y: number, deg: number, ox: number, oy: number) => {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: ox + (x - ox) * c - (y - oy) * s, y: oy + (x - ox) * s + (y - oy) * c };
};
/** a sheet point -> world (the sheet at rest: turned TILT_REST about SHEET_C) */
export const sheetToWorld = (x: number, y: number) => turnPt(x, y, TILT_REST, SHEET_C.x, SHEET_C.y);
const slabToSheet = (x: number, y: number, turn: number, lx: number, ly: number) => {
  const p = turnPt(x, y, turn, SLAB_PIVOT.x, SLAB_PIVOT.y);
  return { x: p.x + lx, y: p.y + ly };
};

// -- the camera ---------------------------------------------------------------------
const PRE = 40;
const LAG = 4.2; // runCamera2 trails a smooth target by CAM_DAMP / CAM_STIFF - 1 frames
const PAGE_C = sheetToWorld(SHEET_C.x, SHEET_C.y);
/** ONE push that never stops (geometric, k 1.04 at the landing -> 1.115 at
 *  the end: the whole page stays in frame), a gentle lean toward the list and
 *  back to centre for the payoff, and a slow rise of the page on screen. */
export const CAM = {
  kLand: 1.04,
  kEnd: 1.115,
  land: 26,
  lean: 46, // world px toward the list
  leanIn: [24, 96],
  leanOut: [140, 184],
  screenY: [508, 498], // where the page's centre sits, f0 -> end
} as const;
const PUSH = Math.log(CAM.kEnd / CAM.kLand) / (DURATION - 1 - CAM.land);
const desired = (f: number) => {
  const k = CAM.kLand * Math.exp(PUSH * (f - CAM.land));
  const lean =
    CAM.lean *
    (camEase((f - CAM.leanIn[0]) / (CAM.leanIn[1] - CAM.leanIn[0]), 1) -
      camEase((f - CAM.leanOut[0]) / (CAM.leanOut[1] - CAM.leanOut[0]), 1));
  const sy = CAM.screenY[0] + (CAM.screenY[1] - CAM.screenY[0]) * camEase(f / (DURATION - 1), 1);
  return { k, cx: PAGE_C.x + lean, cy: PAGE_C.y + (H / 2 - sy) / k };
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
const CAM_TRACK = Array.from({ length: DURATION }, (_, f) => runCamera2(f + PRE, CAM_F, CAM_CY, CAM_CX, CAM_K));
/** the damped camera at a frame (no sway) */
export const cameraAt = (frame: number) => CAM_TRACK[Math.max(0, Math.min(DURATION - 1, Math.round(frame)))];
const CX_REST = 900;
const CY_REST = 400;

// -- the growth ---------------------------------------------------------------------
const growth = (frame: number) => ({
  a: interpolate(frame, [T.growA[0], T.growA[1]], [0, 1], { easing: Easing.inOut(Easing.sin), ...clamp }),
  b: interpolate(frame, [T.growB[0], T.growB[1]], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp }),
});
const mix3 = (v: readonly [number, number, number], a: number, b: number) => v[0] + (v[1] - v[0]) * a + (v[2] - v[1]) * b;
const boxAt = (keys: [Box, Box, Box], a: number, b: number): Box => ({
  x0: mix3([keys[0].x0, keys[1].x0, keys[2].x0], a, b),
  y0: mix3([keys[0].y0, keys[1].y0, keys[2].y0], a, b),
  x1: mix3([keys[0].x1, keys[1].x1, keys[2].x1], a, b),
  y1: mix3([keys[0].y1, keys[1].y1, keys[2].y1], a, b),
});
/** the slab's lower edge leads the frame's on the last growth, so a row is
 *  under the slab before the window through the page reaches it */
const slabAt = (a: number, b: number): Box => ({
  ...boxAt(SLAB_KEYS, a, b),
  y1: mix3([SLAB_KEYS[0].y1, SLAB_KEYS[1].y1, SLAB_KEYS[2].y1], a, Math.min(1, b * 1.8)),
});

/** where things are on screen, for the report table and the reviews */
export const layoutAt = (frame: number) => {
  const cam = cameraAt(frame);
  const pt = (x: number, y: number) => {
    const w = sheetToWorld(x, y);
    return { x: W / 2 + (w.x - cam.cx) * cam.k, y: H / 2 + (w.y - cam.cy) * cam.k };
  };
  const { a, b } = growth(frame);
  const slab = slabAt(a, b);
  return {
    cam,
    pt,
    slab,
    slabScreenW: (slab.x1 - slab.x0) * cam.k,
    rows: LIST.lengths.map((_, r) => pt(1226, rowY(r)).y),
    labelBase: pt(1290, MAIN_BASE).y,
    underline: pt(DATE.x + DATE_W / 2, UNDER_Y),
    pageLeft: pt(0, SHEET.h).x,
    pageRight: pt(SHEET.w, 0).x,
  };
};

// -- drawing helpers -----------------------------------------------------------------
const n = (v: number) => v.toFixed(2);
const rectPath = (b: Box) => `M${n(b.x0)} ${n(b.y0)} H${n(b.x1)} V${n(b.y1)} H${n(b.x0)} Z`;
const roundPath = (b: Box, r: number) =>
  `M${n(b.x0 + r)} ${n(b.y0)} H${n(b.x1 - r)} A${r} ${r} 0 0 1 ${n(b.x1)} ${n(b.y0 + r)} V${n(b.y1 - r)} A${r} ${r} 0 0 1 ${n(b.x1 - r)} ${n(b.y1)} H${n(b.x0 + r)} A${r} ${r} 0 0 1 ${n(b.x0)} ${n(b.y1 - r)} V${n(b.y0 + r)} A${r} ${r} 0 0 1 ${n(b.x0 + r)} ${n(b.y0)} Z`;
const growBox = (b: Box, d: number): Box => ({ x0: b.x0 - d, y0: b.y0 - d, x1: b.x1 + d, y1: b.y1 + d });
const shiftBox = (b: Box, dx: number, dy: number): Box => ({ x0: b.x0 + dx, y0: b.y0 + dy, x1: b.x1 + dx, y1: b.y1 + dy });

const Shield: React.FC = () => {
  const { x, y, w, h } = SHIELD;
  const d = `M${x} ${y} H${x + w} V${y + h * 0.56} C${x + w} ${y + h * 0.82}, ${x + w * 0.72} ${y + h * 0.94}, ${x + w / 2} ${y + h} C${x + w * 0.28} ${y + h * 0.94}, ${x} ${y + h * 0.82}, ${x} ${y + h * 0.56} Z`;
  const bw = 34;
  const bh = 25;
  return (
    <g>
      <path d={d} fill={BLACK} />
      <rect x={x + w / 2 - bw - 6} y={y + 25} width={bw} height={bh} fill={INK} />
      <rect x={x + w / 2 + 6} y={y + 25} width={bw} height={bh} fill={INK} />
      <rect x={x + w / 2 - bw / 2} y={y + 25 + bh + 16} width={bw} height={bh} fill={INK} />
    </g>
  );
};

/** the flat bust (deathCountShared's frozen geometry): head = circle centre
 *  (0.50, 0.27) r 0.17; shoulders = a half-disc, centre (0.50, 0.90) r 0.38 */
const Bust: React.FC<{ x: number; y: number; size: number; fill: string }> = ({ x, y, size, fill }) => {
  const hr = 0.17 * size;
  const sr = 0.38 * size;
  const sx = 0.5 * size;
  const sy = 0.9 * size;
  return (
    <g transform={`translate(${n(x)} ${n(y)})`}>
      <path d={`M${sx - sr} ${sy} A${sr} ${sr} 0 0 1 ${sx + sr} ${sy} Z`} fill={fill} />
      <circle cx={0.5 * size} cy={0.27 * size} r={hr} fill={fill} />
    </g>
  );
};

/** the world layer: a W x H SVG under translate + scale(k) */
const World: React.FC<{ cx: number; cy: number; k: number; children: React.ReactNode }> = ({ cx, cy, k, children }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: "0 0",
        transform: `translate(${W / 2 - cx * k}px, ${H / 2 - cy * k}px) scale(${k})`,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {children}
      </svg>
    </div>
  </AbsoluteFill>
);

const HarvardNumberOne: React.FC<Props> = ({ masthead, headline, dateLine, rows, labelTop, labelMain, aiMark }) => {
  const frame = useCurrentFrame();

  const cam = cameraAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;

  // -- the sheet ------------------------------------------------------------------------
  const drop = dropAt(frame);
  const tilt = tiltAt(frame);
  const turned = `translate(0 ${n(drop)}) rotate(${tilt.toFixed(4)} ${SHEET_C.x} ${SHEET_C.y})`;
  const under = interpolate(frame, [T.under[0], T.under[1]], [0, 1], { easing: STROKE_EASE, ...clamp });

  // -- row 1 lifts ------------------------------------------------------------------------
  const lift = interpolate(frame, [T.lift[0], T.lift[1]], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  const hover = lift * 1.5 * Math.sin(frame / 8);
  const lx = LIFT.dx * lift - hover * 0.6;
  const ly = LIFT.dy * lift - hover;
  const slabShadow = LIFT.shadow * lift + hover;
  const turn = LIFT.turn * lift + 0.15 * lift * Math.sin(frame / 11);
  const slabFrame = `translate(${n(lx)} ${n(ly)}) rotate(${turn.toFixed(3)} ${SLAB_PIVOT.x} ${SLAB_PIVOT.y})`;
  // the hard shadow falls +x/+y on SCREEN: that direction, in the slab's turned frame
  const sh = turnPt(slabShadow, slabShadow, -(tilt + turn), 0, 0);
  const sh6 = turnPt(6, 6, -(tilt + turn), 0, 0);

  // -- it grows, its bar hollowing into the frame ---------------------------------------------
  const { a, b } = growth(frame);
  const hollow = interpolate(frame, [T.hollow[0], T.hollow[1]], [0, 1], { easing: Easing.inOut(Easing.sin), ...clamp });
  const slab = slabAt(a, b);
  const bar = boxAt(BAR_KEYS, a, b);
  const barC = (bar.y0 + bar.y1) / 2;
  const half = hollow * Math.max(0, (bar.y1 - bar.y0) / 2 - FRAME_T);
  const win: Box = { x0: bar.x0 + FRAME_T, x1: bar.x1 - FRAME_T, y0: barC - half, y1: barC + half };
  const hole = half > 0.5 ? win : null;
  const underBox = hole ? growBox(hole, 13) : null; // the layers below open a little wider
  const barPath = `${roundPath(bar, LIST.barR)}${hole ? ` ${rectPath(hole)}` : ""}`;
  const sheetBox: Box = { x0: SHEET.x, y0: SHEET.y, x1: SHEET.x + SHEET.w, y1: SHEET.y + SHEET.h };
  const underQuad = underBox
    ? [
        [underBox.x0, underBox.y0],
        [underBox.x1, underBox.y0],
        [underBox.x1, underBox.y1],
        [underBox.x0, underBox.y1],
      ]
        .map(([x, y], i) => {
          const p = slabToSheet(x, y, turn, lx, ly);
          return `${i === 0 ? "M" : "L"}${n(p.x)} ${n(p.y)}`;
        })
        .join(" ") + " Z"
    : "";
  const sheetPath = `${rectPath(sheetBox)} ${underQuad}`;

  // -- the "1" -----------------------------------------------------------------------------
  const purple = interpolate(frame, [T.purple[0], T.purple[1]], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  const numSize = mix3([NUM_KEYS[0].size, NUM_KEYS[1].size, NUM_KEYS[2].size], a, b);
  const numX = mix3([NUM_KEYS[0].x, NUM_KEYS[1].x, NUM_KEYS[2].x], a, b);
  const numBase = barC + (CAP * numSize) / 2;
  const one = (fill: string) => (
    <text x={numX} y={numBase} textAnchor="middle" fill={fill} style={type(numSize, 900)}>
      1
    </text>
  );

  // -- the pair -----------------------------------------------------------------------------
  const stand = (range: readonly [number, number]) =>
    interpolate(frame, [range[0], range[1]], [0, 1], { easing: EASE_LAND, ...clamp });
  const tW = stand(T.white);
  const tO = stand(T.orange);
  const link = interpolate(frame, [T.link[0], T.link[1]], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });
  const pairCx = (win.x0 + win.x1) / 2;
  const bustL = pairCx - PAIR_GAP / 2 - 0.88 * BUST;
  const bustR = pairCx + PAIR_GAP / 2 - 0.12 * BUST;
  const floor = win.y1 - STAND;
  const bustY = (t: number) => floor - 0.9 * BUST + (1 - t) * (0.84 * BUST + STAND);
  const lean = (phase: number) =>
    1.3 * Math.sin((frame - T.white[0]) / 8 + phase) * Math.min(1, Math.max(0, (frame - T.white[0] - 4) / 8));
  const linkY = floor - LINK_UP;
  const linkX0 = pairCx - LINK_HALF;
  const linkW = 2 * LINK_HALF * link;

  // -- the label -----------------------------------------------------------------------------
  const rise = textRise(frame, T.label, k);
  const labelX = (BAR_KEYS[2].x0 + BAR_KEYS[2].x1) / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround frame={frame} cx={cx} cy={cy} k={k} cxRest={CX_REST} cyRest={CY_REST} />
      <World cx={cx} cy={cy} k={k}>
        <defs>
          <clipPath id="hno-window" clipPathUnits="userSpaceOnUse">
            <rect x={win.x0} y={win.y0} width={win.x1 - win.x0} height={Math.max(0, win.y1 - win.y0)} />
          </clipPath>
          <clipPath id="hno-purple" clipPathUnits="userSpaceOnUse">
            <rect x={numX - 300} y={numBase - CAP * numSize * purple - 2 * purple} width={600} height={900} />
          </clipPath>
        </defs>

        {/* THE PAGE: its hard shadow, then the sheet */}
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
          <g transform={turned}>
            <path d={sheetPath} fill={SHADOW} fillRule="evenodd" />
          </g>
        </g>
        <g transform={turned}>
          <path d={sheetPath} fill={INK} fillRule="evenodd" />

          <g>
            {/* LEFT: masthead */}
            <Shield />
            {masthead.map((line, i) => (
              <text key={i} x={MAST.x} y={MAST.baselines[i]} fill={BLACK} style={type(MAST.size, 900)}>
                {line}
              </text>
            ))}
            <rect x={MARGIN} y={RULE.y} width={COL_R - MARGIN} height={RULE.h} fill={BLACK} />

            {/* the real headline */}
            {headline.map((line, i) => (
              <text key={i} x={MARGIN - 2} y={HEAD.baselines[i]} fill={BLACK} style={type(HEAD.size, 900)}>
                {line}
              </text>
            ))}

            {/* date line + the pen's underline */}
            <text x={DATE.x} y={DATE.baseline} fill={BLACK} style={type(DATE.size, 800, 0.02)}>
              {dateLine}
            </text>
            {under > 0 ? (
              <path
                d={UNDER_D}
                fill="none"
                stroke={BLACK}
                strokeWidth={UNDER_W}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={`${under} 1`}
              />
            ) : null}

            <rect x={DIVIDER.x} y={DIVIDER.y0} width={DIVIDER.w} height={DIVIDER.y1 - DIVIDER.y0} fill={BLACK} />

            {/* RIGHT: rows 2-6, named. One quick cascade, top to bottom. */}
            {LIST.lengths.map((len, r) => {
              if (r === 0) return null;
              // a row the slab has covered is gone before the window reaches it
              if (slab.y1 + ly > rowY(r) + 44) return null;
              const t0 = T.cascade[r - 1];
              const u = interpolate(frame, [t0, t0 + 9], [0, 1], clamp);
              const bump = 0.5 * (1 - Math.cos(2 * Math.PI * u)); // eased out and back
              const y = rowY(r);
              return (
                <g key={r}>
                  <text
                    x={LIST.numX}
                    y={y + (CAP * LIST.numSize) / 2 - 12 * bump}
                    textAnchor="middle"
                    fill={BLACK}
                    style={type(LIST.numSize, 900)}
                  >
                    {r + 1}
                  </text>
                  <g transform={`translate(${n(70 * bump)} 0)`}>
                    <text x={LIST.barX0 - 2} y={y + LIST.nameBase} fill={BLACK} style={type(LIST.nameSize, 800, 0.01)}>
                      {rows[r - 1]}
                    </text>
                    <rect
                      x={LIST.barX0}
                      y={y + LIST.subY}
                      width={LIST.barMax * len}
                      height={LIST.subH}
                      rx={LIST.barR}
                      fill={BLACK}
                    />
                  </g>
                </g>
              );
            })}
          </g>

          {/* ROW 1's SLAB: shadow, the chain crown behind its top edge, the slab */}
          <g transform={slabFrame}>
            {slabShadow > 0.05 ? (
              <path
                d={`${rectPath(shiftBox(slab, sh.x, sh.y))}${underBox ? ` ${rectPath(underBox)}` : ""}`}
                fill={SHADOW}
                fillRule="evenodd"
              />
            ) : null}
            <ChainEcho
              frame={frame}
              start={T.echo}
              core="none"
              step={CROWN.step}
              from={{ dx: 0, dy: 3 * CROWN.step }}
              render={(fill) => <rect x={slab.x0} y={slab.y0} width={slab.x1 - slab.x0} height={CROWN.strip} fill={fill} />}
            />
            <path d={`${rectPath(slab)}${hole ? ` ${rectPath(hole)}` : ""}`} fill={INK} fillRule="evenodd" />

            {/* the bar: thickening, hollowing into the picture frame */}
            <path d={barPath} fill={BLACK} fillRule="evenodd" />

            {/* the "1": black print, purple rising through it from its foot */}
            {purple < 1 ? one(BLACK) : null}
            {purple > 0 ? <g clipPath={purple < 1 ? "url(#hno-purple)" : undefined}>{one(PURPLE)}</g> : null}

            {/* the answer, standing in the frame on the squared paper */}
            {hole ? (
              <g clipPath="url(#hno-window)">
                {link > 0 ? (
                  <>
                    <rect x={linkX0 + sh6.x} y={linkY - LINK_H / 2 + sh6.y} width={linkW} height={LINK_H} fill={SHADOW} />
                    <rect x={linkX0} y={linkY - LINK_H / 2} width={linkW} height={LINK_H} fill={INK} />
                  </>
                ) : null}
                {tO > 0 ? (
                  <g transform={`rotate(${n(lean(2.2))} ${n(bustR + BUST / 2)} ${n(floor)})`}>
                    <Bust x={bustR + sh6.x} y={bustY(tO) + sh6.y} size={BUST} fill={SHADOW} />
                    <Bust x={bustR} y={bustY(tO)} size={BUST} fill={ORANGE} />
                    {/* which of the two is the AI */}
                    <text
                      x={bustR + BUST / 2}
                      y={bustY(tO) + 0.86 * BUST}
                      textAnchor="middle"
                      fill={BLACK}
                      style={type(AI_SIZE, 900)}
                    >
                      {aiMark}
                    </text>
                  </g>
                ) : null}
                {tW > 0 ? (
                  <g transform={`rotate(${n(lean(0))} ${n(bustL + BUST / 2)} ${n(floor)})`}>
                    <Bust x={bustL + sh6.x} y={bustY(tW) + sh6.y} size={BUST} fill={SHADOW} />
                    <Bust x={bustL} y={bustY(tW)} size={BUST} fill={INK} />
                  </g>
                ) : null}
              </g>
            ) : null}

            {/* the bar was the text: here it is, printed on the slab */}
            {rise.opacity > 0 ? (
              <g opacity={rise.opacity}>
                <text x={labelX} y={TOP_BASE + rise.dy} textAnchor="middle" fill={BLACK} style={type(TOP_SIZE, 800, 0.04)}>
                  {labelTop}
                </text>
                <text x={labelX} y={MAIN_BASE + rise.dy} textAnchor="middle" fill={BLACK} style={type(MAIN_SIZE, 900)}>
                  {labelMain}
                </text>
              </g>
            ) : null}
          </g>
        </g>
      </World>
    </AbsoluteFill>
  );
};

export default HarvardNumberOne;
