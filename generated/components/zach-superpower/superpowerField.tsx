import React from "react";
import { Easing, interpolate } from "remotion";
import { BLACK, CHAIN, EASE_LAND, INK, SHADOW, SHADOW_OFF, clamp } from "../kits/core-memory/deathCountShared";

// ---------------------------------------------------------------------------
// "ZACH — AMERICA'S REAL SUPERPOWER" — the FIELD glyph module (owner: builder B,
// cut 16 EightCompaniesTwentyRobots). Core memory graphic standard: flat white
// glyphs on the hard black +4/+4 copy, black print marks, one weight.
//
// LEGEND (COMMON.md): the chain echo means COPIES only. Solid = counted.
//
// THE GLYPHS. Both are drawn about their BASE CENTRE: (x, y) = the middle of
// the line the glyph stands on, the glyph goes UP from there (negative y).
// `size` is the glyph's WIDTH in world px. Both take the same props:
//   ink     the fill of the silhouette (white, a chain colour, black)
//   detail  true (default) = the full glyph with its black print marks.
//           false = the silhouette only, one flat fill: what ChainEcho copies
//           and what the hard shadow is drawn from ("copy the shape only").
//   shadow  true (default) = the whole glyph's hard black copy behind it.
//   bare    the silhouette the chain colours copy (now the same as detail=false).
//   `FieldEchoRise` = a copy rising as a chain echo; the crown closes up
//   under the core once it is in, so a copy at rest is plain white.
//
//   BrainChip     the brain-computer interface as the conventional icon: a
//                 head in profile facing LEFT (smooth white silhouette, one dot
//                 eye, a short neck down to the standing line) with a black
//                 printed chip and three circuit traces inside it where the
//                 brain sits. Height BRAIN_H_RATIO x size.
//   HumanoidRobot a front-view humanoid in Unitree H1 proportions (tall,
//                 slender), kept a little cute: round helmet, wraparound visor,
//                 round shoulder and knee joints, narrow waist, arms with a
//                 slight elbow. Height ROBOT_H_RATIO x size.
//
// THE ROW: cut 11's RowRule / RuleClip / riseFromRule (superpowerRockets.tsx),
// imported by the cut, not redefined here. A glyph's base sits ON the rule's
// top edge (`baseOnRule`), as the rockets do.
//
// THE LAYOUT of cut 16's resolved frame (world px, camera k 1 at (540, 960),
// so world = screen there): BRAIN_ROW and ROBOT_ROWS, below.
// ---------------------------------------------------------------------------

export type GlyphProps = {
  x: number;
  y: number;
  size: number;
  ink?: string;
  detail?: boolean;
  shadow?: boolean;
  /** silhouette only, minus the thin parts that would stripe as a crown (the
   *  brain's cable and plug): what the chain colours copy */
  bare?: boolean;
};

// =========================================================================
// THE BRAIN-COMPUTER INTERFACE: the conventional BCI icon, a HEAD IN PROFILE
// with a chip in it. A smooth flat white silhouette facing LEFT (cranium,
// forehead, a small nose bump, lips, chin, a short neck down to the standing
// line), one black dot eye, and printed in black inside the head where the
// brain sits: a rounded square chip with short pin ticks on its four sides
// and a white die, and three thin circuit traces running a little way from
// it through the head, each ending in a dot. No brain folds, no cable, no
// stalk. Designed in a 100-wide unit box, base centre at (0, 0): ink
// x -48..+49, y -115..0.
// (The export keeps its old name, BrainChip.)
// =========================================================================
export const BRAIN_UNIT = 100;
/** height / width of the glyph's ink */
export const BRAIN_H_RATIO = 1.15;
const HEAD =
  "M -8 0 " +
  "C -9 -8 -9 -16 -10 -22 " + // the front of the neck
  "C -16 -26 -25 -29 -31 -33 " + // under the jaw
  "C -36 -36 -38 -40 -37 -44 " + // the chin
  "C -40 -47 -40 -51 -38 -54 " + // the lips
  "C -41 -56 -48 -60 -48 -64 " + // the nose
  "C -48 -68 -42 -71 -39 -75 " +
  "C -40 -85 -36 -96 -27 -103 " + // the forehead
  "C -17 -112 3 -117 21 -111 " + // the crown
  "C 39 -105 50 -88 49 -68 " + // the back of the head
  "C 48 -52 40 -41 29 -35 " + // the nape
  "C 24 -31 23 -24 24 -16 " +
  "C 25 -10 27 -5 29 0 Z";
const EYE = { cx: -27, cy: -71, r: 3.8 };
const CHIP = { cx: 8, cy: -77, s: 28, rx: 4.5 };
const DIE = 11;
const PIN = { len: 5.5, w: 3.4, at: [-7.5, 0, 7.5] };
const TRACE_W = 3;
const TRACE_DOT = 3.8;
const TRACES: { d: string; end: [number, number] }[] = [
  { d: "M 22 -73 L 31 -73 L 36 -67 L 36 -58", end: [36, -58] }, // out of the right side, down the back
  { d: "M 2 -91 L 2 -97 L -8 -101", end: [-8, -101] }, // out of the top, toward the forehead
  { d: "M -6 -81 L -14 -81 L -18 -87", end: [-18, -87] }, // out of the left side
];

const headPrint = () => {
  const h = CHIP.s / 2;
  const ticks: React.ReactNode[] = [];
  for (const t of PIN.at) {
    ticks.push(
      <rect key={`l${t}`} x={-h - PIN.len + 0.5} y={t - PIN.w / 2} width={PIN.len} height={PIN.w} fill={BLACK} />,
      <rect key={`r${t}`} x={h - 0.5} y={t - PIN.w / 2} width={PIN.len} height={PIN.w} fill={BLACK} />,
      <rect key={`t${t}`} x={t - PIN.w / 2} y={-h - PIN.len + 0.5} width={PIN.w} height={PIN.len} fill={BLACK} />,
      <rect key={`b${t}`} x={t - PIN.w / 2} y={h - 0.5} width={PIN.w} height={PIN.len} fill={BLACK} />,
    );
  }
  return (
    <>
      <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill={BLACK} />
      <g fill="none" stroke={BLACK} strokeWidth={TRACE_W} strokeLinecap="round" strokeLinejoin="round">
        {TRACES.map((t) => (
          <path key={t.d} d={t.d} />
        ))}
      </g>
      {TRACES.map((t) => (
        <circle key={`d${t.d}`} cx={t.end[0]} cy={t.end[1]} r={TRACE_DOT} fill={BLACK} />
      ))}
      <g transform={`translate(${CHIP.cx} ${CHIP.cy})`}>
        {ticks}
        <rect x={-h} y={-h} width={CHIP.s} height={CHIP.s} rx={CHIP.rx} fill={BLACK} />
        <rect x={-DIE / 2} y={-DIE / 2} width={DIE} height={DIE} rx={1.5} fill={INK} />
      </g>
    </>
  );
};

const brainPaint = (fill: string, detail: boolean) => (
  <>
    <path d={HEAD} fill={fill} />
    {detail ? headPrint() : null}
  </>
);

/** THE BRAIN-COMPUTER INTERFACE (a head with a chip in it). (x, y) = base
 *  centre, size = width. `bare` = the head silhouette only. */
export const BrainChip: React.FC<GlyphProps> = ({ x, y, size, ink = INK, detail = true, shadow = true, bare = false }) => {
  const s = size / BRAIN_UNIT;
  const off = SHADOW_OFF / s; // the hard shadow stays +4/+4 WORLD px at every size
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow ? <g transform={`translate(${off} ${off})`}>{brainPaint(SHADOW, false)}</g> : null}
      {brainPaint(ink, bare ? false : detail)}
    </g>
  );
};

// =========================================================================
// HUMANOID ROBOT, Unitree H1 proportions (tall, slender), kept a little cute:
// a round helmet head with a wraparound black visor, broad shoulders on
// round joints, a torso tapering to a narrow waist over the hips, arms with a
// slight elbow, legs with a round knee joint. Designed in an 83-wide unit
// box, base centre at (0, 0): ink x -43..+43, y -207..0.
// =========================================================================
export const ROBOT_UNIT = 86;
/** height / width of the glyph's ink */
export const ROBOT_H_RATIO = 207 / 86;
const R_HEAD = { x: -22, y: -207, w: 44, h: 40, rx: 19 };
const R_VISOR = { x: -16.5, y: -198, w: 33, h: 17, rx: 8.5 };
const R_NECK = { x: -7, y: -170, w: 14, h: 10, rx: 0 };
const R_TORSO =
  "M -18 -163 L 18 -163 Q 26 -163 26 -155 L 22 -130 Q 20 -119 12 -115 L -12 -115 Q -20 -119 -22 -130 L -26 -155 Q -26 -163 -18 -163 Z";
const R_CHEST = { x: -9, y: -152, w: 18, h: 6, rx: 3 };
const R_WAIST = { x: -10, y: -119, w: 20, h: 12, rx: 0 };
const R_HIPS = { x: -20, y: -112, w: 40, h: 17, rx: 7 };
const R_SHOULDER = { x: 30, y: -154, r: 10 };
const R_ARM = "M 30 -154 L 36 -122 L 33 -92"; // shoulder, elbow, hand
const R_ARM_W = 14;
const R_THIGH = "M 11 -100 L 13 -56";
const R_THIGH_W = 17;
const R_SHIN = "M 13 -56 L 11 -12";
const R_SHIN_W = 15;
const R_KNEE = { x: 13, y: -56, r: 10 };
const R_FOOT = { x: 3, y: -12, w: 18, h: 12, rx: 4.5 };

const rr = (r: { x: number; y: number; w: number; h: number; rx: number }, fill: string, key?: string) => (
  <rect key={key} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} fill={fill} />
);
const robotSide = (fill: string, sx: 1 | -1) => (
  <g key={sx} transform={sx === 1 ? undefined : "scale(-1 1)"}>
    {rr(R_FOOT, fill)}
    <path d={R_SHIN} fill="none" stroke={fill} strokeWidth={R_SHIN_W} strokeLinecap="round" />
    <path d={R_THIGH} fill="none" stroke={fill} strokeWidth={R_THIGH_W} strokeLinecap="round" />
    <circle cx={R_KNEE.x} cy={R_KNEE.y} r={R_KNEE.r} fill={fill} />
    <path d={R_ARM} fill="none" stroke={fill} strokeWidth={R_ARM_W} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={R_SHOULDER.x} cy={R_SHOULDER.y} r={R_SHOULDER.r} fill={fill} />
  </g>
);
const robotMarks = (sx: 1 | -1) => (
  <g key={`m${sx}`} transform={sx === 1 ? undefined : "scale(-1 1)"}>
    <circle cx={R_KNEE.x} cy={R_KNEE.y} r={3.6} fill={BLACK} />
  </g>
);

const robotPaint = (fill: string, detail: boolean) => (
  <>
    {robotSide(fill, 1)}
    {robotSide(fill, -1)}
    {rr(R_HIPS, fill)}
    {rr(R_WAIST, fill)}
    <path d={R_TORSO} fill={fill} />
    {rr(R_NECK, fill)}
    {rr(R_HEAD, fill)}
    {detail ? (
      <>
        {rr(R_VISOR, BLACK)}
        {rr(R_CHEST, BLACK)}
        {robotMarks(1)}
        {robotMarks(-1)}
      </>
    ) : null}
  </>
);

/** THE HUMANOID ROBOT. (x, y) = base centre, size = width. */
export const HumanoidRobot: React.FC<GlyphProps> = ({ x, y, size, ink = INK, detail = true, shadow = true, bare = false }) => {
  const s = size / ROBOT_UNIT;
  const off = SHADOW_OFF / s;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow ? <g transform={`translate(${off} ${off})`}>{robotPaint(SHADOW, false)}</g> : null}
      {robotPaint(ink, bare ? false : detail)}
    </g>
  );
};

/** The crown step while a copy rises (world px per colour): half the kit's
 *  CROWN_STEP, so the band reads as three thin stripes on a glyph this small. */
export const FIELD_CROWN_STEP = 6;
/** frames the crown takes to close up under the core once the core is in */
export const FIELD_CROWN_CLOSE = 8;

/**
 * A COPY rising from behind its rule as a chain echo: the three colours lead
 * (orange, purple, blue, `stagger` apart), each travelling up from `drop`
 * below on EASE_LAND to its crown step above the rest; the white core follows
 * on its hard shadow. Once the core is in, the crown CLOSES UP: the colours
 * slide down behind the core over FIELD_CROWN_CLOSE frames until they sit
 * exactly under it, and then they are no longer drawn. At rest a copy is
 * plain white on its shadow; the chain is the gesture of copying, not a
 * costume. The caller clips it to above the rule (RuleClip).
 *   (x, y) = rest base centre; `drop` = world px below rest it starts (the
 *   core and all three colours wholly behind the rule).
 *   `closeAt` = frames after the core's start that the close begins (default
 *   travel * 0.55, when EASE_LAND has the core within a few px of rest).
 * Paint order: the core's shadow at the very back, the colours, the core.
 */
export const FieldEchoRise: React.FC<{
  Glyph: React.FC<GlyphProps>;
  frame: number;
  start: number;
  x: number;
  y: number;
  size: number;
  drop: number;
  id?: string;
  stagger?: number;
  travel?: number;
  step?: number;
  closeAt?: number;
  closeFrames?: number;
}> = ({
  Glyph,
  frame,
  start,
  x,
  y,
  size,
  drop,
  stagger = 1,
  travel = 14,
  step = FIELD_CROWN_STEP,
  closeAt,
  closeFrames = FIELD_CROWN_CLOSE,
}) => {
  if (frame < start) return null;
  const coreStart = start + 3 * stagger;
  const cp = interpolate(frame, [coreStart, coreStart + travel], [0, 1], { easing: EASE_LAND, ...clamp });
  const coreDy = (1 - cp) * drop;
  const c0 = coreStart + (closeAt ?? travel * 0.55);
  const close = interpolate(frame, [c0, c0 + closeFrames], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  const colours = close < 1;
  return (
    <g>
      {frame >= coreStart ? (
        <g transform={`translate(${SHADOW_OFF} ${coreDy + SHADOW_OFF})`}>
          <Glyph x={x} y={y} size={size} ink={SHADOW} detail={false} shadow={false} />
        </g>
      ) : null}
      {colours
        ? CHAIN.map((fill, i) => {
            const s0 = start + i * stagger;
            if (frame < s0) return null;
            const t = interpolate(frame, [s0, s0 + travel], [0, 1], { easing: EASE_LAND, ...clamp });
            const dy = (1 - t) * drop - step * (3 - i) * (1 - close);
            return (
              <g key={fill} transform={`translate(0 ${dy})`}>
                <Glyph x={x} y={y} size={size} ink={fill} bare shadow={false} />
              </g>
            );
          })
        : null}
      {frame >= coreStart ? <Glyph x={x} y={y + coreDy} size={size} shadow={false} /> : null}
    </g>
  );
};

// =========================================================================
// THE ROW. The rule and the rise are cut 11's (superpowerRockets.tsx:
// RowRule, RuleClip, riseFromRule, ECHO_STAGGER / ECHO_TRAVEL): a glyph
// stands with its base ON the rule's top edge, like the rockets.
// =========================================================================
export const baseOnRule = (ruleY: number) => ruleY;

// =========================================================================
// CUT 16's RESOLVED LAYOUT (world px; at the resolved frame world = screen)
// =========================================================================
/** eight brains in one row; slot 3 is the first one (the cut opens on it) */
export const BRAIN_ROW = (() => {
  const n = 8;
  const size = 112;
  const pitch = 122;
  const cx = 540;
  const ruleY = 410;
  const xs = Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * pitch);
  return { n, size, pitch, cx, ruleY, base: baseOnRule(ruleY), xs, x0: xs[0] - size / 2 - 22, x1: xs[n - 1] + size / 2 + 22, first: 3 };
})();
/** twenty robots, two rows of ten (gridPos order: row-major from the
 *  top-left); slot 4 of row 0 is the first one */
export const ROBOT_ROWS = (() => {
  const cols = 10;
  const size = 84;
  const pitch = 96;
  const cx = 540;
  const ruleYs = [720, 1040];
  const xs = Array.from({ length: cols }, (_, i) => cx + (i - (cols - 1) / 2) * pitch);
  return {
    cols,
    rows: 2,
    size,
    pitch,
    cx,
    ruleYs,
    bases: ruleYs.map(baseOnRule),
    xs,
    x0: xs[0] - size / 2 - 22,
    x1: xs[cols - 1] + size / 2 + 22,
    first: 4,
  };
})();
