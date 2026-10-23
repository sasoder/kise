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
//   detail  true (default) = the full glyph: its parts on their own hard
//           shadows (the chip over the brain) and the black print marks.
//           false = the silhouette only, one flat fill: what ChainEcho copies
//           and what the hard shadow is drawn from ("copy the shape only").
//   shadow  true (default) = the whole glyph's hard black copy behind it.
//   bare    the silhouette the chain colours copy (now the same as detail=false).
//   `FieldEchoRise` = a copy rising as a chain echo; the crown closes up
//   under the core once it is in, so a copy at rest is plain white.
//
//   BrainChip     a side-view brain facing LEFT (frontal lobe left, the
//                 cerebellum tucked under the back, the brainstem down to the
//                 standing line), nine short printed grooves, and a flat square
//                 implant chip seated on top with four fine electrode threads
//                 printed down into the brain (no cable).
//                 Height BRAIN_H_RATIO x size.
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
// BRAIN + CHIP. Designed in a 100-wide unit box, base centre at (0, 0).
// =========================================================================
export const BRAIN_UNIT = 100;
/** the glyph's ink: x -51..+48, y -100..0 (chip pins to brainstem foot) */
export const BRAIN_H_RATIO = 1.0;
const BRAIN_BODY =
  "M -36 -26 " +
  "C -46 -28 -52 -40 -50 -52 " + // the frontal pole
  "C -49 -64 -42 -74 -32 -80 " + // the forehead
  "C -24 -85 -14 -88 -4 -88 " + // the crown, two soft bumps
  "C 6 -89 16 -87 24 -83 " +
  "C 34 -78 42 -71 46 -62 " +
  "C 50 -54 50 -44 46 -38 " + // the occipital pole
  "C 44 -34 42 -32 40 -31 " +
  "C 48 -27 48 -14 38 -10 " + // the cerebellum, tucked under the back
  "C 31 -7 24 -8 19 -12 " +
  "L 22 0 L 10 0 L 7 -16 " + // the brainstem, down to the standing line
  "C 0 -17 -8 -16 -16 -17 " + // the temporal lobe's underside
  "C -24 -18 -30 -20 -32 -24 " +
  "C -33 -25 -34 -26 -36 -26 Z";
/** printed grooves (black, round caps): kept short of the outline */
const BRAIN_GROOVES = [
  "M -31 -31 C -18 -35 -2 -39 13 -51", // the lateral fissure
  "M 9 -82 C 5 -75 11 -70 7 -63 C 5 -59 7 -56 9 -55", // the central sulcus
  "M -41 -59 C -35 -55 -31 -63 -25 -59 C -20 -56 -17 -63 -12 -65", // frontal folds
  "M -43 -44 C -37 -42 -31 -48 -23 -44",
  "M 17 -78 C 21 -72 15 -66 21 -62 C 25 -59 26 -55 30 -55", // parietal
  "M 36 -69 C 33 -61 40 -57 37 -48", // occipital
  "M -22 -24 C -14 -27 -8 -22 0 -26 C 5 -28 10 -26 14 -31", // temporal
  "M 24 -19 C 30 -21 37 -23 42 -21", // the cerebellum's folia
  "M 26 -13 C 31 -15 37 -16 41 -15",
];
const BRAIN_GROOVE_W = 4.5;
// the implant: a flat square chip seated ON the top of the brain (seen edge
// on, so a slab), turned to the dome's slope, a black die on its face and four
// pins along its top; under it four fine electrode threads run DOWN into the
// brain (black printed lines, Neuralink style). No cable.
const CHIP = { cx: -10, cy: -89.5, w: 32, h: 11, rot: -5 };
const CHIP_PINS = [-11, -3.7, 3.7, 11]; // pin centres along the top, unit px
const CHIP_PIN = { w: 3.6, h: 4 };
const THREADS = [
  "M -21 -83 Q -23 -77 -25 -69",
  "M -14 -84 Q -15 -77 -16 -67",
  "M -7 -85 Q -7 -78 -8 -68",
  "M 0 -86 Q 1 -79 0 -70",
];
const THREAD_W = 3;

const chipShape = (fill: string) => (
  <g transform={`translate(${CHIP.cx} ${CHIP.cy}) rotate(${CHIP.rot})`}>
    <rect x={-CHIP.w / 2} y={-CHIP.h / 2} width={CHIP.w} height={CHIP.h} rx={2} fill={fill} />
    {CHIP_PINS.map((p) => (
      <rect key={p} x={p - CHIP_PIN.w / 2} y={-CHIP.h / 2 - CHIP_PIN.h + 1} width={CHIP_PIN.w} height={CHIP_PIN.h} fill={fill} />
    ))}
  </g>
);
const chipMark = () => (
  <g transform={`translate(${CHIP.cx} ${CHIP.cy}) rotate(${CHIP.rot})`}>
    <rect x={-8} y={-2.5} width={16} height={5} rx={1} fill={BLACK} />
  </g>
);

const brainPaint = (fill: string, detail: boolean, off = SHADOW_OFF) => {
  if (!detail) {
    return (
      <>
        <path d={BRAIN_BODY} fill={fill} />
        {chipShape(fill)}
      </>
    );
  }
  // full: the chip sits on its own hard shadow over the brain, so it
  // separates from the brain by its shadow (never an outline); `off` is in
  // unit px. The threads are printed under it.
  return (
    <>
      <path d={BRAIN_BODY} fill={fill} />
      <g fill="none" stroke={BLACK} strokeLinecap="round">
        {BRAIN_GROOVES.map((d) => (
          <path key={d} d={d} strokeWidth={BRAIN_GROOVE_W} />
        ))}
        {THREADS.map((d) => (
          <path key={d} d={d} strokeWidth={THREAD_W} />
        ))}
      </g>
      <g transform={`translate(${off} ${off})`}>{chipShape(SHADOW)}</g>
      {chipShape(fill)}
      {chipMark()}
    </>
  );
};

/** THE BRAIN-COMPUTER INTERFACE. (x, y) = base centre, size = width. */
export const BrainChip: React.FC<GlyphProps> = ({ x, y, size, ink = INK, detail = true, shadow = true, bare = false }) => {
  const s = size / BRAIN_UNIT;
  const off = SHADOW_OFF / s; // the hard shadow stays +4/+4 WORLD px at every size
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {shadow ? <g transform={`translate(${off} ${off})`}>{brainPaint(SHADOW, false)}</g> : null}
      {brainPaint(ink, bare ? false : detail, off)}
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
