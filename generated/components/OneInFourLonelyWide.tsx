import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { hash } from "./fieldShared";
import {
  BLUE,
  INK,
  PAPER_BASE,
  PaperGround,
  SHADOW,
  SHADOW_OFF,
  camEase,
  clamp,
  runCamera2,
  sway,
  textRise,
  type,
} from "./cerroShared";
import { figureGeom } from "./deathCountShared";

// ---------------------------------------------------------------------------
// "ONE IN FOUR LONELY — WIDE" — cut 5 of the CM_EARLY_JS trailer (Core Memory,
// Andrew Kiguel), the 16:9 round. 2048 x 1080 (the 4096 x 2160 sequence at
// half size; the final renders with --scale 2), 24000/1001 fps, 93 frames,
// opaque, the core memory graphic standard (cerroShared kit, 16:9).
//
// CHECK LINE: "Out of every hundred people in the world, about twenty-five are
// lonely: one in four."
//
// THE PICTURE: a plain pictogram chart. One hundred people, 20 columns x 5
// rows of head-and-shoulders busts (deathCountShared's frozen figure), white
// on the hard black shadow, 87 % of the frame width. The left quarter (5
// columns = 25 people) turns BLUE one figure at a time, the label "1 IN 4"
// (the 1 blue) rises above it, then the quarter pulls apart: a gap opens to
// the white 75, and the blue figures move away from each other until each
// stands alone on empty paper. The white 75 stay a tidy block of separate
// people (director's round 2: closing them up made a mush).
// Fact: Meta-Gallup "Global State of Social Connections" 2023, 142 countries,
// 24 % feel very or fairly lonely. The label is "1 IN 4"; no percentage is
// printed.
//
// THE WORDS (local frame; f0 = sequence 5.589 s):
//   you 1 · think 3 · about 6 · loneliness 11-33 · (pause) · something 36 ·
//   like 40 · 25 44 · percent 51 · of 59 · the 62 · world 64 ·
//   identifies 69 · as 76 · lonely 84 · END 93
//
// THE MOTION (one move; the words are its inflections):
//   f0       the whole hundred is there, white, shoulder to shoulder; the
//            top-left figure is already blue; the second starts on f1
//   f0-52    THE COUNT: blue runs down column 1, then column 2 ... column 5,
//            one figure every 2 frames, each a quick fill from the feet up
//            (5 frames) with a small hop. The 13th turns at the end of
//            "loneliness", the 25th starts on f47 and is full on f52
//                                             — "loneliness ... 25 percent"
//   f43-55   "1 IN 4" slides up above the blue block       — "25 percent"
//   f58-79   THE QUARTER PULLS APART: the white 75 slide right a little
//            (pitch 90 -> 86.5, rows unchanged), the blue 25 open out (pitch
//            90 x 110 -> 130 x 134, each a little off the grid), a 90 px gap
//            between the blocks; the outer
//            blue figures lead by up to 3 frames; on a long ease-out, so
//            it reads as arrived by ~f73   — "of the world identifies"
//   f66-92   settled and alive: the blue figures keep drifting very slowly
//            apart, each swaying on its own clock; the white crowd sways
//            together as one (it has done so since f0)        — "as lonely"
//
// THE CAMERA — one keyed target per frame through the house damped tracker
// (runCamera2), pre-rolled 24 frames so it is already easing out on f0:
//   f-8..50  k 1.24 -> 1.00, x 800 -> 1024: slightly tight on the left half,
//            easing out to the whole hundred as the count completes
//   f56..73  k 1.00 -> 0.988: gives the quarter the room to pull apart
//   f73..93  k creeps on to 0.98
//   The grid's centre line stays on screen y 525 at every k (bottom band free).
//
// The chain-colour echo is NOT used. No links, no dots, no globe, no pie.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 93;
export const FRAME_W = 2048;
export const FRAME_H = 1080;

export const schema = z.object({
  /** the label, in two inks: the "1" is blue (a lonely person) */
  labelOne: z.string(),
  labelRest: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  labelOne: "1",
  labelRest: " IN 4",
});

// -- the chart, world px (the world is 2048 x 1080; k 1 = screen px) -----------
const COLS = 20;
const ROWS = 5;
const LONELY_COLS = 5;
const S = 108; // the figure's box; ink is 0.76 S wide (82), 0.80 S tall (86)
const INK_W = 0.76 * S;
const INK_H = 0.8 * S;
const GX = FRAME_W / 2;
const GY = 525; // the chart's centre line
// the full hundred, shoulder to shoulder
const PITCH_X = 90;
const PITCH_Y = 110; // no head touches the shoulders above it
const X0 = GX - ((COLS - 1) / 2) * PITCH_X;
// resolved: the white 75 stay a tidy block of separate people (3 % tighter,
// slid right to make room) ...
const W_PITCH_X = 86.5;
const W_PITCH_Y = PITCH_Y;
// ... and the blue 25 carry the pull-apart, each alone: 1.45x the pitch
// across; down, as far as the usable height (screen y 90-850, label included)
// allows, 1.25x
const B_PITCH_X = 130;
const B_PITCH_Y = 134;
const B_JITTER = 9;
const GAP = 90; // paper between the blue block's ink and the white block's
// centred as one picture on GX
const TOTAL = (LONELY_COLS - 1) * B_PITCH_X + INK_W + GAP + (COLS - LONELY_COLS - 1) * W_PITCH_X + INK_W;
const B_CX = GX - TOTAL / 2 + INK_W / 2 + ((LONELY_COLS - 1) / 2) * B_PITCH_X;
const W_X0 = GX + TOTAL / 2 - INK_W / 2 - (COLS - LONELY_COLS - 1) * W_PITCH_X;
const B_CX0 = X0 + ((LONELY_COLS - 1) / 2) * PITCH_X; // the blue block's centre in the full grid

// -- timing ---------------------------------------------------------------------
export const T = {
  count: { first: 1, step: 2, fill: 5 }, // figure n (1..24) starts at first + step * (n - 1)
  label: 43,
  apart: [58, 79] as const,
  lead: 3, // frames the outermost blue figures lead the innermost by
  drift: 64,
} as const;

type Fig = {
  i: number;
  col: number;
  row: number;
  lonely: boolean;
  /** its place in the count, 0..24 (column by column, top to bottom) */
  order: number;
  home: { x: number; y: number };
  rest: { x: number; y: number };
  /** blue only: its direction and distance from the block's centre, 0..1 */
  reach: number;
};
const FIGS: Fig[] = (() => {
  const out: Fig[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col;
      const lonely = col < LONELY_COLS;
      const home = { x: X0 + col * PITCH_X, y: GY + (row - (ROWS - 1) / 2) * PITCH_Y };
      const rest = lonely
        ? {
            x: B_CX + (col - (LONELY_COLS - 1) / 2) * B_PITCH_X + (hash(i, 31) - 0.5) * 2 * B_JITTER,
            y: GY + (row - (ROWS - 1) / 2) * B_PITCH_Y + (hash(i, 32) - 0.5) * 2 * B_JITTER,
          }
        : { x: W_X0 + (col - LONELY_COLS) * W_PITCH_X, y: GY + (row - (ROWS - 1) / 2) * W_PITCH_Y };
      const reach = lonely
        ? Math.hypot(col - (LONELY_COLS - 1) / 2, row - (ROWS - 1) / 2) / Math.hypot((LONELY_COLS - 1) / 2, (ROWS - 1) / 2)
        : 0;
      out.push({ i, col, row, lonely, order: col * ROWS + row, home, rest, reach });
    }
  }
  return out;
})();

/** how far figure `order` has filled with blue, 0..1 (the first is blue on f0) */
const fillAt = (order: number, f: number) => {
  if (order === 0) return 1;
  const start = T.count.first + T.count.step * (order - 1);
  return interpolate(f, [start, start + T.count.fill], [0, 1], { easing: Easing.out(Easing.quad), ...clamp });
};

const APART_EASE = Easing.bezier(0.45, 0, 0.2, 1);
/** how far the quarter has pulled apart, 0..1; `lead` frames early */
const apartAt = (f: number, lead = 0) =>
  interpolate(f + lead, [T.apart[0], T.apart[1]], [0, 1], { easing: APART_EASE, ...clamp });
/** the slow drift further apart once they stand alone (soft start, then steady) */
const driftAt = (f: number) => {
  const t = Math.max(0, f - T.drift);
  return 0.0011 * (t - 6 * (1 - Math.exp(-t / 6)));
};

// -- the camera --------------------------------------------------------------------
const PRE = 24;
const SCREEN_Y = 525; // where the chart's centre line sits on screen
export const CAM = {
  k0: 1.24,
  kWhole: 1.0,
  kEnd: 0.988,
  kLast: 0.98,
  x0: 800,
  out: [-8, 50] as const,
  wide: [56, 73] as const,
} as const;
const desired = (f: number) => {
  const a = camEase((f - CAM.out[0]) / (CAM.out[1] - CAM.out[0]), 0.9);
  const b = camEase((f - CAM.wide[0]) / (CAM.wide[1] - CAM.wide[0]), 1);
  const c = Math.max(0, Math.min(1, (f - CAM.wide[1]) / (DURATION - CAM.wide[1])));
  const k = CAM.k0 + (CAM.kWhole - CAM.k0) * a + (CAM.kEnd - CAM.kWhole) * b + (CAM.kLast - CAM.kEnd) * c;
  return { k, cx: CAM.x0 + (GX - CAM.x0) * a, cy: GY + (FRAME_H / 2 - SCREEN_Y) / k };
};
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
for (let g = 0; g <= DURATION + PRE; g++) {
  const d = desired(g - PRE);
  CAM_F.push(g);
  CAM_K.push(d.k);
  CAM_CX.push(d.cx);
  CAM_CY.push(d.cy);
}
/** the damped camera at a local frame (no sway) */
export const cameraAt = (frame: number) => runCamera2(frame + PRE, CAM_F, CAM_CY, CAM_CX, CAM_K);

// -- the label ---------------------------------------------------------------------
const LABEL_SIZE = 140;
const LABEL_GAP = 28; // paper between the blue block's top and the baseline

const GEOM = figureGeom(S);

/** The world layer for the 2048-wide frame (cerroShared's World is 1920). */
const WideWorld: React.FC<{ cx: number; cy: number; k: number; children: React.ReactNode }> = ({ cx, cy, k, children }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: FRAME_W,
        height: FRAME_H,
        transformOrigin: "0 0",
        transform: `translate(${FRAME_W / 2 - cx * k}px, ${FRAME_H / 2 - cy * k}px) scale(${k})`,
      }}
    >
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {children}
      </svg>
    </div>
  </AbsoluteFill>
);

const bust = (fill: string) => (
  <>
    <path d={GEOM.solidShoulders} fill={fill} />
    <path d={GEOM.solidHead} fill={fill} />
  </>
);

const OneInFourLonelyWide: React.FC<Props> = ({ labelOne, labelRest }) => {
  const frame = useCurrentFrame();

  const cam = cameraAt(frame);
  const hand = sway(frame);
  const k = cam.k;
  const cx = cam.cx + hand.dx;
  const cy = cam.cy + hand.dy;

  // -- where everyone is ----------------------------------------------------------
  const drift = driftAt(frame);
  // the white crowd sways together, as one
  const crowdTilt = 1.3 * Math.sin(frame / 7.5);
  const crowdDx = 2.5 * Math.sin(frame / 7.5 - 0.6);

  const placed = FIGS.map((fig) => {
    if (!fig.lonely) {
      const e = apartAt(frame);
      return {
        fig,
        x: fig.home.x + (fig.rest.x - fig.home.x) * e + crowdDx,
        y: fig.home.y + (fig.rest.y - fig.home.y) * e,
        tilt: crowdTilt,
        fill: 0,
      };
    }
    const e = apartAt(frame, T.lead * fig.reach);
    const fill = fillAt(fig.order, frame);
    // alone, it sways on its own clock and keeps drifting out from the block's centre
    const own = e;
    const sx = 4 * Math.sin(frame / (6 + 3 * hash(fig.i, 7)) + 6.283 * hash(fig.i, 8));
    const sy = 3 * Math.cos(frame / (7 + 3 * hash(fig.i, 9)) + 6.283 * hash(fig.i, 10));
    const ownTilt = 3.2 * Math.sin(frame / (5.5 + 3 * hash(fig.i, 11)) + 6.283 * hash(fig.i, 12));
    const rx = fig.rest.x + (fig.rest.x - B_CX) * drift;
    const ry = fig.rest.y + (fig.rest.y - GY) * drift;
    // the small hop as it turns blue
    const hop = fig.order === 0 ? 0 : -7 * Math.sin(Math.PI * fill);
    return {
      fig,
      x: fig.home.x + (rx - fig.home.x) * e + crowdDx * (1 - own) + sx * own,
      y: fig.home.y + (ry - fig.home.y) * e + sy * own + hop,
      tilt: crowdTilt * (1 - own) + ownTilt * own,
      fill,
    };
  });

  // -- the label rides on the blue block's top edge ----------------------------------
  const eBlock = apartAt(frame, T.lead);
  const blockTop =
    GY - ((ROWS - 1) / 2) * (PITCH_Y + (B_PITCH_Y * (1 + drift) - PITCH_Y) * eBlock) - INK_H / 2 - B_JITTER * eBlock;
  const labelX = B_CX0 + (B_CX - B_CX0) * eBlock;
  const labelY = blockTop - LABEL_GAP;
  const rise = textRise(frame, T.label, k);
  const labelText = (one: string, others: string, off: number) => (
    <text
      x={labelX + off}
      y={labelY + rise.dy + off}
      textAnchor="middle"
      style={{ ...type(LABEL_SIZE, 900, 0.02), whiteSpace: "pre" }}
    >
      <tspan fill={one}>{labelOne}</tspan>
      <tspan fill={others}>{labelRest}</tspan>
    </text>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround frame={frame} cx={cx} cy={cy} cxRest={GX} cyRest={GY + (FRAME_H / 2 - SCREEN_Y)} k={k} />
      <WideWorld cx={cx} cy={cy} k={k}>
        {/* row by row, left to right, the white crowd first and the lonely
            over it: each figure on its own hard shadow, so a closed-up crowd
            still reads as separate people */}
        {[...placed.filter((p) => !p.fig.lonely), ...placed.filter((p) => p.fig.lonely)].map(({ fig, x, y, tilt, fill }) => {
          const bx = x - S / 2;
          const by = y - S / 2;
          const clipId = `oiflw-fill-${fig.i}`;
          const filling = fill > 0 && fill < 1;
          const top = S * (0.9 - 0.8 * fill);
          return (
            <g
              key={fig.i}
              transform={`translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${tilt.toFixed(3)} ${S / 2} ${0.9 * S})`}
            >
              <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{bust(SHADOW)}</g>
              {fill >= 1 ? bust(BLUE) : bust(INK)}
              {filling ? (
                <>
                  <defs>
                    <clipPath id={clipId}>
                      <rect x={-10} y={top} width={S + 20} height={S - top + 10} />
                    </clipPath>
                  </defs>
                  <g clipPath={`url(#${clipId})`}>{bust(BLUE)}</g>
                </>
              ) : null}
            </g>
          );
        })}

        {/* the label: the 1 is one of the blue ones */}
        {rise.opacity > 0 ? (
          <g opacity={rise.opacity >= 1 ? undefined : rise.opacity}>
            {labelText(SHADOW, SHADOW, SHADOW_OFF)}
            {labelText(BLUE, INK, 0)}
          </g>
        ) : null}
      </WideWorld>
    </AbsoluteFill>
  );
};

export default OneInFourLonelyWide;
