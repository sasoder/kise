import React from "react";
import {
  HALF_STEP,
  INK,
  INK_HI,
  INK_LO,
  KraftStage,
  MoneyBar,
  NowColumn,
  ProfitSlice,
  Readout,
  SOHNE,
  TILE,
  TILE_TOP,
  X_NOW,
  cameraTrack,
  clamp01,
  smoothstep,
  strokeW,
  sz,
  typeSize,
} from "./wolffShared";
import type { Cam, Glide } from "./wolffShared";
import { CAM_GLIDES, CAM_PRE, CAM_REST, CAM_START, CAM_TRACK, DUR_2, S_JOIN, c2 } from "./wolffActA";
import { iconShadow } from "./fieldShared";

// ---------------------------------------------------------------------------
// wolffActA2 — cut 2 V2 of the Toto Wolff clip (`BackInTheDayV2`), the user's
// revision of the delivered BackInTheDay: "show the real numbers to the left
// and adjust the bar chart accordingly … the graph with the F1 box isn't
// necessary … go to the left and then before the end go back to the right and
// capture the scale". V1 (wolffActA / BackInTheDay) stays as delivered; this
// module imports Act A's camera rig and clock and edits nothing.
//
// SAME STORY CLOCK: S_A = 124 + f. The camera is Act A's track — cut 1's glides
// unchanged (so f0 IS cut 1's last frame, asserted below) plus V2's own glides,
// all starting at S_A >= 124. Sway and the kraft drift run on S_A.
//
// THE PICTURE: an honest bar chart of the filed history to the LEFT of the now
// column, revealed by the camera looking back, then the camera turns and pulls
// back to the whole growth, $326M (2015) to $1B (now).
//
// DATA (out/wolff/briefs/data.md, "Cut 2 V2"): Mercedes-Benz Grand Prix Ltd
// filings (Companies House), GBP converted at each year's AVERAGE USD/GBP rate
// (2015-2020 fxrates.com ECB yearly averages; 2021-2025 IRS yearly averages);
// px = USD $B x 160. 2019 turnover GBP 363.6M (Motorsport Week, 5 Sep 2020).
// Profit slices approximate where only net profit was found (2017-2021); 2015
// an operating loss (no slice). "now" = Toto's $1B / $300M, NowColumn as cut 1.
// ---------------------------------------------------------------------------

export const V2_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
export const V2_BAR = [52.1, 62.7, 69.5, 72.3, 74.2, 73.0, 84.4, 93.6, 108.8, 130.0, 133.5];
export const V2_SLICE = [0, 3.1, 2.5, 2.7, 3.0, 2.8, 15.1, 22.4, 22.6, 32.8, 35.1];
// The values. Eleven full "$xxxM" labels (3.2 em each in Söhne Buch) only fit
// side by side in the 840 px padding box at k ~0.7, where the type is ~17 px —
// illegible at 270 px wide. So the start callout carries the unit in full and
// INK_HI ("$326M"), and the row continues in $M as bare figures (1.5-1.8 em),
// which fit at k 1.0 with the type at 26 px.
export const V2_VALUE = ["$326M", "392", "434", "452", "464", "456", "527", "585", "680", "812", "835"];
// Only these years are labelled under the axis: all eleven collide at the
// final framing's 23 px year size.
export const V2_YEAR_LABELS = [2015, 2020, 2025];

// --- geometry (world px), solved for the final framing ------------------------------
// Pitch 55 / bar 44 (the now bar stays BAR_W 56): the narrowest row whose
// figures never touch at k 1.0. 2025 stands 80 left of now, clear of the
// Mercedes tile's left edge (492).
export const V2_PITCH = 55;
export const V2_BAR_W = 44;
export const V2_X2025 = X_NOW - 80; // 460
export const v2x = (year: number) => V2_X2025 - (2025 - year) * V2_PITCH; // 2015 at -90
export const V2_CALLOUT_RIGHT = v2x(2015) + V2_BAR_W / 2; // "$326M" right-aligned on the first bar's right edge
export const V2_AXIS_X0 = X_NOW - TILE / 2; // 492, the tile's top-left corner
export const V2_AXIS_END = v2x(2015) - V2_BAR_W / 2 - 16; // where the time axis begins
export const V2_VALUE_GAP_PX = 12; // bar top -> value baseline, screen px at K_REF
export const V2_YEAR_GAP_PX = 14; // axis -> year cap top, screen px at K_REF

// --- the camera: one there-and-back -------------------------------------------------
// The ride glides were fitted (least squares on the damped track) so the pan
// is monotone and the camera's look reaches 2020 on "300 million" and 2015 on
// "considerably"; the return is one glide.
export const CAM2_GLIDES: Glide[] = [
  ...CAM_GLIDES.filter((g) => g.f0 < S_JOIN), // cut 1, unchanged
  { f0: c2(0), f1: c2(42), k: 1.6, dy: 15, warp: 1 }, // eases back a little (back in the day)
  { f0: c2(0), f1: c2(50), dx: -174, warp: 1 }, // and glides left into the past (it wasn't a billion)
  { f0: c2(24), f1: c2(78), dx: -349, warp: 1 }, // (and it wasn't 300 million)
  { f0: c2(52), f1: c2(96), dx: -123, warp: 1 }, // decelerates onto 2015 (it was)
  { f0: c2(74), f1: c2(94), k: 1.8, dy: 10, warp: 1 }, // creeps in on $326M, then still ~f99-106 (considerably less)
  { f0: c2(106), f1: c2(172), dx: 347, dy: -17, k: 1.0, warp: 0.9 }, // turns back right and pulls back to the whole growth (because we're growing very strong ...)
  { f0: c2(150), f1: c2(250), k: 0.975, warp: 1 }, // the pull-back's slow continuation, decaying through the tail (still growing strong)
];
export const CAM2: Cam[] = cameraTrack(
  { x: CAM_START.x, y: CAM_START.y, k: CAM_START.k },
  CAM2_GLIDES.map((g) => ({ ...g, f0: g.f0 + CAM_PRE, f1: g.f1 + CAM_PRE })),
  S_JOIN + DUR_2 + CAM_PRE + 4,
).slice(CAM_PRE);
export const cam2At = (S: number): Cam => CAM2[Math.max(0, Math.min(CAM2.length - 1, Math.round(S)))];

// The join: V2's camera up to S_A 124 is Act A's to the bit.
for (let S = 0; S <= S_JOIN; S++) {
  const a = CAM2[S];
  const b = CAM_TRACK[S];
  if (a.x !== b.x || a.y !== b.y || a.k !== b.k) {
    throw new Error(`wolffActA2: camera differs from Act A at S_A ${S} — the join would break`);
  }
}

// --- the reveal: the camera's look back is the mechanism -----------------------------
// A year's bar rises from the axis when the camera's look reaches it: the
// reveal line sits REVEAL_PX left of the frame's centre and only ever moves
// left (running minimum), so a bar rises in plain view in the left of the
// frame, and its figure slides up as it lands.
export const REVEAL_PX = 160;
export const RISE_F = 12;
export const LABEL_LAG_F = 3;
export const ENTER_F = 12;
export const CLICK_F = 3;
export const REVEAL_F: number[] = (() => {
  const out: number[] = V2_YEARS.map(() => NaN);
  let line = Infinity;
  for (let f = 0; f <= DUR_2; f += 0.05) {
    const c = cam2At(S_JOIN + Math.round(f));
    line = Math.min(line, c.x - REVEAL_PX / c.k);
    V2_YEARS.forEach((y, i) => {
      if (Number.isNaN(out[i]) && line <= v2x(y)) out[i] = Number(f.toFixed(2));
    });
  }
  return out;
})();
/** The "$326M" start callout lands here: THE ONE CLICK of this cut. */
export const CALLOUT_LAND_F = REVEAL_F[0] + LABEL_LAG_F + ENTER_F;

// --- the axis: draws leftward from the tile's top-left corner, just ahead of the frame ---
export const AXIS_WAVE_PX = 20; // world px / f while it races to the frame's edge (<= 45 screen px/f)
export const AXIS_LEAD_PX = 24; // screen px beyond the frame's left edge
export const AXIS_HEAD: number[] = (() => {
  const out: number[] = [];
  let head = V2_AXIS_X0;
  for (let f = 0; f <= DUR_2 + 1; f++) {
    const c = cam2At(S_JOIN + f);
    const frameLeft = c.x - 540 / c.k - AXIS_LEAD_PX / c.k;
    const target = Math.max(V2_AXIS_END, Math.max(frameLeft, V2_AXIS_X0 - AXIS_WAVE_PX * f));
    head = Math.min(head, target);
    out.push(head);
  }
  return out;
})();

// ===========================================================================
// THE WORLD — cut 2 V2 at cut-2 frame f (S_A = 124 + f).
// ===========================================================================
/** A chart's numbers: per year 2015 ... 2025, the bar px, the profit slice px and
 *  the label. V2's table is the default; cut 2 V3 passes its own (filed figures). */
export type ChartData = { bar: number[]; slice: number[]; value: string[] };
export const V2_DATA: ChartData = { bar: V2_BAR, slice: V2_SLICE, value: V2_VALUE };

export const ActA2: React.FC<{ f: number; data?: ChartData }> = ({ f, data = V2_DATA }) => {
  const S = S_JOIN + f;
  const cam = cam2At(S);
  const k = cam.k;
  const icon = iconShadow(k);
  const head = AXIS_HEAD[Math.max(0, Math.min(AXIS_HEAD.length - 1, Math.round(f)))];
  const fy = typeSize("year", k);
  const yearY = TILE_TOP + sz(V2_YEAR_GAP_PX, k) + SOHNE.fig * fy;

  const bars: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  V2_YEARS.forEach((year, i) => {
    const rf = REVEAL_F[i];
    if (Number.isNaN(rf) || f <= rf) return;
    const rise = smoothstep((f - rf) / RISE_F);
    const x = v2x(year);
    const h = data.bar[i] * rise;
    bars.push(
      <g key={year}>
        <MoneyBar x={x} baseY={TILE_TOP} h={h} k={k} w={V2_BAR_W} />
        <ProfitSlice x={x} topY={TILE_TOP - h} h={data.slice[i] * rise} w={V2_BAR_W} />
      </g>,
    );
    const enter = clamp01((f - rf - LABEL_LAG_F) / ENTER_F);
    const valueY = TILE_TOP - data.bar[i] - sz(V2_VALUE_GAP_PX, k);
    if (i === 0) {
      const land = CALLOUT_LAND_F;
      labels.push(
        <Readout
          key={`v${year}`}
          x={V2_CALLOUT_RIGHT}
          y={valueY}
          text={data.value[i]}
          kind="word"
          k={k}
          enter={enter}
          color={f >= land && f < land + CLICK_F ? HALF_STEP : INK}
          opacity={INK_HI}
          anchor="end"
        />,
      );
    } else {
      labels.push(
        <Readout key={`v${year}`} x={x} y={valueY} text={data.value[i]} kind="word" k={k} enter={enter} opacity={INK_LO} />,
      );
    }
    if (V2_YEAR_LABELS.includes(year)) {
      labels.push(<Readout key={`y${year}`} x={x} y={yearY} text={`${year}`} kind="year" k={k} enter={enter} opacity={INK_LO} />);
    }
  });

  return (
    <KraftStage S={S} cam={cam} rest={CAM_REST}>
      {V2_AXIS_X0 - head > 0.5 ? (
        <line
          x1={V2_AXIS_X0}
          y1={TILE_TOP}
          x2={head}
          y2={TILE_TOP}
          stroke={INK}
          strokeOpacity={INK_LO}
          strokeWidth={strokeW(k)}
          strokeLinecap="square"
          style={{ filter: icon }}
        />
      ) : null}
      {bars}
      <NowColumn k={k} />
      {labels}
    </KraftStage>
  );
};

