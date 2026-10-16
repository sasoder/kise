import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { hash } from "../kits/dwarkesh/fieldShared";
import {
  BLUE,
  INK,
  PAPER_BASE,
  SHADOW,
  SHADOW_OFF,
  TallPaper,
  WorldTall,
  camEase,
  clamp,
  figureGeom,
  runCamera2,
  sway,
  textRise,
  type,
} from "../kits/core-memory/deathCountShared";
import { CAM as WIDE_CAM, DURATION as WIDE_DURATION, FPS as WIDE_FPS, T } from "./OneInFourLonelyWide";

// ---------------------------------------------------------------------------
// "ONE IN FOUR LONELY — TALL" — the 1080 x 1920 version of the approved 16:9
// cut OneInFourLonelyWide (CM_EARLY_JS trailer, Core Memory, Andrew Kiguel),
// for the vertical cut. 24000/1001 fps, 93 frames, opaque, the core memory
// graphic standard on the portrait kit (deathCountShared). Same content, same
// cue frames (the timing table `T` is IMPORTED from the 16:9 component), recomposed for portrait.
//
// CHECK LINE: "Out of every hundred people in the world, about twenty-five are
// lonely: one in four."
//
// THE PICTURE: the same plain pictogram chart, stood up: one hundred people as
// 10 columns x 10 rows of busts, white on the hard black shadow, x 82-998. The
// count runs in READING ORDER along the top: rows 1 and 2, then the left five
// of row 3, so the lonely 25 are the top of the chart. "1 IN 4" (the 1 blue)
// rises above them. Then the quarter pulls apart UPWARD: a gap opens between
// the blue 25 and the white 75, and the blue figures move away from each other
// (three loose rows, each figure a little off its place, the short row of five
// centred) into the upper area. The white 75 stay a tidy block of separate
// people; its short row (the right five of row 3) slides over to sit centred
// on top of it. Symmetric, and still obviously the same hundred.
// Fact: Meta-Gallup "Global State of Social Connections" 2023, 142 countries,
// 24 % feel very or fairly lonely. The label is "1 IN 4"; no percentage.
//
// THE WORDS (local frame, identical to the 16:9):
//   you 1 · think 3 · about 6 · loneliness 11-33 · (pause) · something 36 ·
//   like 40 · 25 44 · percent 51 · of 59 · the 62 · world 64 ·
//   identifies 69 · as 76 · lonely 84 · END 93
//
// THE MOTION (cue frames identical to the 16:9):
//   f0       the whole hundred is there; the top-left figure is already blue
//   f1-52    THE COUNT: one figure every 2 frames, each a 5-frame fill from
//            the feet up with a small hop; the 25th starts f47, full f52
//   f43-55   "1 IN 4" slides up above the top row
//   f58-79   THE QUARTER PULLS APART: the blue 25 rise and open out (pitch
//            93.5 x 101 -> 112 x 120, the short row centring), a 72 px gap to
//            the white 75, whose short row centres on the same frames
//   f64-92   settled and alive: blue figures inch apart and sway on their own
//            clocks; the white block sways as one
//
// THE CAMERA — per-frame targets through runCamera2, pre-rolled 24 frames; the
// chart's bottom edge is pinned to screen y 1230 at every k:
//   f-8..50  k 1.015 -> 1.00 (the gentle ease out; grid inside x 70-1010)
//   f50..76  k 1.00 -> 0.834 on the pull-apart's own curve, 8 frames ahead of
//            it, so the spread stays inside the safe area throughout
//   f76..93  k creeps on to 0.831
//   Figures are 76 px wide at k 1 and 63 px at the end; the blue rows span
//   the full 940 px.
//
// The chain-colour echo is NOT used.
// ---------------------------------------------------------------------------

export const FPS = WIDE_FPS;
export const DURATION = WIDE_DURATION;
export const FRAME_W = 1080;
export const FRAME_H = 1920;

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

// -- the chart, world px (world = screen at k 1) ---------------------------------
const COLS = 10;
const ROWS = 10;
const N_LONELY = 25; // rows 1 and 2 and the left five of row 3, in reading order
const S = 100; // the figure's box; ink is 0.76 S wide (76), 0.80 S tall (80)
const INK_H = 0.8 * S;
const GX = FRAME_W / 2;
const PITCH_X = 93.5;
const PITCH_Y = 101;
const BOTTOM = 1230; // the chart's bottom edge, world and screen
const ROW0 = BOTTOM - INK_H / 2 - (ROWS - 1) * PITCH_Y; // centre line of the top row
// resolved: the blue 25, each alone, above the white 75
const B_PITCH_X = 112;
const B_PITCH_Y = 120;
const B_OFF_X = 6; // each one a little off its place
const B_OFF_Y = 12;
const GAP = 72; // paper between the blue group's ink and the white block's
const WHITE_TOP = ROW0 + 2 * PITCH_Y - INK_H / 2; // the white block's first (short) row
const B_ROW2 = WHITE_TOP - GAP - INK_H / 2 - B_OFF_Y; // centre line of the blue group's last row
const B_CY = B_ROW2 - B_PITCH_Y; // the blue group's centre

type Fig = {
  i: number;
  lonely: boolean;
  /** its place in the count, 0..24 (reading order) */
  order: number;
  home: { x: number; y: number };
  rest: { x: number; y: number };
  /** blue only: its distance from the group's centre, 0..1 */
  reach: number;
};
const FIGS: Fig[] = (() => {
  const out: Fig[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const i = row * COLS + col;
      const lonely = i < N_LONELY;
      const home = { x: GX + (col - (COLS - 1) / 2) * PITCH_X, y: ROW0 + row * PITCH_Y };
      const rest = lonely
        ? {
            // the short row of five sits centred under the two rows of ten
            x: GX + (row === 2 ? col - 2 : col - (COLS - 1) / 2) * B_PITCH_X + (hash(i, 31) - 0.5) * 2 * B_OFF_X,
            y: B_CY + (row - 1) * B_PITCH_Y + (hash(i, 32) - 0.5) * 2 * B_OFF_Y,
          }
        : row === 2
          ? // the white block's short row slides over to sit centred on top of it
            { x: GX + (col - 7) * PITCH_X, y: home.y }
          : home;
      const reach = lonely ? Math.hypot((rest.x - GX) / (4.5 * B_PITCH_X), row - 1) / Math.SQRT2 : 0;
      out.push({ i, lonely, order: i, home, rest, reach });
    }
  }
  return out;
})();

// -- the 16:9 component's motion helpers, copied exactly ----------------------------
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
export const CAM = {
  k0: 1.015, // the grid inside x 70-1010 on f0
  kWhole: 1.0,
  kEnd: 0.834,
  kLast: 0.831,
  out: WIDE_CAM.out, // the same window as the 16:9
  // The ease back is TIED to the pull-apart itself (the same curve), asked for
  // `lead` frames early so the damped tracker (which trails its target by ~5
  // frames) has made the room before the blue group needs it: nothing leaves
  // the safe area on the way.
  lead: 8,
  creep: 76,
} as const;
const desired = (f: number) => {
  const a = camEase((f - CAM.out[0]) / (CAM.out[1] - CAM.out[0]), 0.9);
  const b = apartAt(f, CAM.lead);
  const c = Math.max(0, Math.min(1, (f - CAM.creep) / (DURATION - CAM.creep)));
  const k = CAM.k0 + (CAM.kWhole - CAM.k0) * a + (CAM.kEnd - CAM.kWhole) * b + (CAM.kLast - CAM.kEnd) * c;
  // the chart's bottom edge stays on screen y BOTTOM
  return { k, cx: GX, cy: BOTTOM - (BOTTOM - FRAME_H / 2) / k };
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
const CY_REST = (desired(0).cy + desired(DURATION).cy) / 2;

// -- the label ---------------------------------------------------------------------
const LABEL_SIZE = 112;
const LABEL_GAP = 22; // paper between the blue group's top and the baseline

const GEOM = figureGeom(S);
const bust = (fill: string) => (
  <>
    <path d={GEOM.solidShoulders} fill={fill} />
    <path d={GEOM.solidHead} fill={fill} />
  </>
);

/** where everyone and the label are at a frame, world px */
const layoutAt = (frame: number) => {
  const drift = driftAt(frame);
  // the white crowd sways together, as one
  const crowdTilt = 1.3 * Math.sin(frame / 7.5);
  const crowdDx = 2.5 * Math.sin(frame / 7.5 - 0.6);

  const placed = FIGS.map((fig) => {
    if (!fig.lonely) {
      const e = apartAt(frame);
      return { fig, x: fig.home.x + (fig.rest.x - fig.home.x) * e + crowdDx, y: fig.home.y, tilt: crowdTilt, fill: 0 };
    }
    const e = apartAt(frame, T.lead * fig.reach);
    const fill = fillAt(fig.order, frame);
    // alone, it sways on its own clock and keeps drifting out from the group's centre
    const own = e;
    const sx = 4 * Math.sin(frame / (6 + 3 * hash(fig.i, 7)) + 6.283 * hash(fig.i, 8));
    const sy = 3 * Math.cos(frame / (7 + 3 * hash(fig.i, 9)) + 6.283 * hash(fig.i, 10));
    const ownTilt = 3.2 * Math.sin(frame / (5.5 + 3 * hash(fig.i, 11)) + 6.283 * hash(fig.i, 12));
    const rx = fig.rest.x + (fig.rest.x - GX) * drift * 0.5;
    // upward only: the gap to the white block never closes
    const ry = fig.rest.y + Math.min(0, fig.rest.y - B_CY) * drift * 2;
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

  // the label rides on the blue group's top edge
  const eBlock = apartAt(frame, T.lead);
  const topRest = B_CY - B_PITCH_Y * (1 + 2 * drift) - B_OFF_Y;
  const blockTop = ROW0 + (topRest - ROW0) * eBlock - INK_H / 2;
  return { placed, labelY: blockTop - LABEL_GAP };
};

/** screen extents of the essential ink (no hand-held sway), for the probe */
export const extentsAt = (frame: number) => {
  const cam = cameraAt(frame);
  const { placed, labelY } = layoutAt(frame);
  const sx = (x: number) => FRAME_W / 2 + (x - cam.cx) * cam.k;
  const sy = (y: number) => FRAME_H / 2 + (y - cam.cy) * cam.k;
  const blue = placed.filter((p) => p.fig.lonely);
  return {
    k: cam.k,
    labelTop: sy(labelY - 0.7 * LABEL_SIZE),
    blueLeft: sx(Math.min(...blue.map((p) => p.x)) - 0.38 * S),
    blueRight: sx(Math.max(...blue.map((p) => p.x)) + 0.38 * S + SHADOW_OFF),
    left: sx(Math.min(...placed.map((p) => p.x)) - 0.38 * S),
    right: sx(Math.max(...placed.map((p) => p.x)) + 0.38 * S + SHADOW_OFF),
    bottom: sy(BOTTOM + SHADOW_OFF),
  };
};

const OneInFourLonelyTall: React.FC<Props> = ({ labelOne, labelRest }) => {
  const frame = useCurrentFrame();

  const cam = cameraAt(frame);
  const hand = sway(frame);
  const k = cam.k;
  const cx = cam.cx + hand.dx;
  const cy = cam.cy + hand.dy;

  const { placed, labelY } = layoutAt(frame);
  const rise = textRise(frame, T.label, k);
  const labelText = (one: string, others: string, off: number) => (
    <text
      x={GX + off}
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
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={GX} cyRest={CY_REST} />
      <WorldTall cx={cx} cy={cy} k={k} id="oiflt-world">
        {/* row by row, left to right, the white crowd first and the lonely
            over it: each figure on its own hard shadow */}
        {[...placed.filter((p) => !p.fig.lonely), ...placed.filter((p) => p.fig.lonely)].map(({ fig, x, y, tilt, fill }) => {
          const bx = x - S / 2;
          const by = y - S / 2;
          const clipId = `oiflt-fill-${fig.i}`;
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
      </WorldTall>
    </AbsoluteFill>
  );
};

export default OneInFourLonelyTall;
