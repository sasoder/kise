import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { z } from "zod";
import {
  COLOR,
  GEO,
  METRIC,
  MONEY,
  SPACE,
  TILE_TOP,
  TYPE,
  ChartBar,
  Label,
  Numeral,
  Pillar,
  Rule,
  StoutNameTag,
  StoutStage,
  StoutWatchHere,
  amberBandFor,
  camFor,
  labelWidth,
  numeralWidth,
  snapLen,
  type Figure,
} from "./stoutShared";
import type { Cam } from "./outgrowShared";
import { V3_DATA } from "./BackInTheDayV3";
import { V2_YEARS, V2_YEAR_LABELS } from "./wolffActA2";
import { US_TEAMS_V2 } from "./wolffActB2";
import { MERC_VAL_B } from "./wolffActB";
import { RIVALS } from "./MostSponsorship";
import { MULTIPLE, NOW_REV_PX, NOW_SLICE_PX, PX_PER_B, type SportName } from "./wolffShared";
import type { CrestId } from "./wolffLogos";

// ---------------------------------------------------------------------------
// StoutFrames — STYLE FRAMES of the Toto Wolff "Mercedes F1 financials" clip in
// the stout system (stoutShared.tsx), one still per payoff, each composed at
// the camera its cut will rest on (world -> camera, exactly as a cut draws it).
// Brief: out/wolff/briefs/STOUT.md. Stills only; 1080 x 1920.
//
//   c1_end       cut 1 "around a billion dollars in revenue and 30% profit margin"
//   c2_hold      cut 2 on "considerably less": the $326M 2015 bar in its chart
//   c2_end       cut 2's end: the whole climb, $326M (2015) to the $1B / 30% now pillar
//   c3_end       cut 3 "these multiples ... conservative": profit x20 = the $6B valuation
//   c4_end       cut 4 "fundamentals for some of the teams": five pillars, the x20 fills
//   c5_overtake  cut 5 just after the overtake: Mercedes' amber tower over four rivals
//   c5_end       cut 5's end: the world's teams, one amber tower
//   nametag(_alpha)  Toto Wolff / CEO of Mercedes F1 team, over the footage (or alone)
//   cta(_alpha)      the end card: "Watch here" and the chevrons pointing down
//
// DATA (out/wolff/briefs/data.md), imported, never retyped:
//   now: $1B revenue / $300M profit (Toto) = NOW_REV_PX / NOW_SLICE_PX at 160 px/$B.
//   cut 2: V3_DATA (BackInTheDayV3) — the filed accounts, 2015-2025, in USD at the
//     Fed's yearly rates; labels "$326M", 392 ... 836; years 2015 / 2020 / 2025.
//   cut 3: $6B (MERC_VAL_B, Kurtz deal Nov 2025) = 20 x the $300M profit.
//   cut 4: US_TEAMS_V2 (Forbes): value / revenue / operating income; x20 fills
//     34 / 74 / 100 / 20 / 97 %.
//   cut 5: RIVALS (MostSponsorship): Mercedes ~$558M = the tallest; Cowboys 0.54
//     (Sportico); Real Madrid 0.85, Man United 0.62, Lakers 0.40 illustrative.
//
// MONEY per act (stoutShared MONEY): act A 160 px/$B (as data.md's px tables);
// act B 42 px/$B (valuations are 13x the revenues); cut 5 576 px for Mercedes.
// ---------------------------------------------------------------------------

export const FRAMES = [
  "c1_end",
  "c2_hold",
  "c2_end",
  "c3_end",
  "c4_end",
  "c5_overtake",
  "c5_end",
  "nametag",
  "nametag_alpha",
  "cta",
  "cta_alpha",
] as const;
export type FrameName = (typeof FRAMES)[number];

const X_NOW = GEO.X_NOW;
const FLOOR = GEO.FLOOR;
const rnd = (v: number) => Math.round(v);
/** World point for a screen point under camera c. */
const W = (c: Cam, sx: number, sy: number) => ({ x: c.x + (sx - 540) / c.k, y: c.y + (sy - 960) / c.k });
/** Screen y of a world y. */
const SY = (c: Cam, wy: number) => 960 + (wy - c.y) * c.k;
const SX = (c: Cam, wx: number) => 540 + (wx - c.x) * c.k;
/** The amber light band: every amber body in a frame samples one gradient locked to the
 *  screen's band (y 300 -> 1368): the light comes from above. */
const amberBand = (c: Cam): [number, number] => amberBandFor(c);

// --- act A: the now pillar and the history -------------------------------------------------------
const NOW_BAR = NOW_REV_PX; // 160 px = $1B (act A)
const NOW_SLICE = NOW_SLICE_PX; // 48 px = $300M
const hx = (year: number) => X_NOW - GEO.TILE / 2 - GEO.HIST_GAP_NOW - GEO.HIST_BAR / 2 - (2025 - year) * GEO.HIST_PITCH;
const AXIS_X0 = hx(2015) - GEO.HIST_BAR / 2 - 16; // where the time axis begins (left)
const AXIS_X1 = X_NOW - GEO.TILE / 2; // it runs into the now tile's top-left corner

// --- c1_end -------------------------------------------------------------------------------------------
const K1 = 3.25;
const CAM1 = camFor(X_NOW, FLOOR, 470, 1368, K1);
const C1: React.FC = () => {
  const c = CAM1;
  const k = c.k;
  const barTop = SY(c, TILE_TOP - NOW_BAR); // 536
  const sliceH = NOW_SLICE * k;
  const barRight = SX(c, X_NOW + GEO.BAR / 2);
  const revenueY = rnd(barTop - SPACE.CLEAR);
  const billionY = rnd(revenueY - TYPE.LABEL * METRIC.cap - SPACE.LOCKUP);
  const lock = TYPE.SECONDARY * METRIC.fig + SPACE.LOCKUP + TYPE.LABEL * METRIC.cap;
  const pctY = rnd(barTop + (sliceH - lock) / 2 + TYPE.SECONDARY * METRIC.fig);
  const profitY = rnd(pctY + SPACE.LOCKUP + TYPE.LABEL * METRIC.cap);
  const sideX = rnd(barRight + SPACE.CLEAR);
  const at = (sx: number, sy: number) => W(c, sx, sy);
  return (
    <StoutStage S={0} cam={c} pool={{ x: X_NOW, y: TILE_TOP - NOW_BAR / 2 }} sway={false}>
      <Pillar x={X_NOW} k={k} figure={{ kind: "mercedes" }} bar={NOW_BAR} slice={NOW_SLICE} amberBand={amberBand(c)} />
      <Numeral {...at(SX(c, X_NOW), billionY)} k={k} px={TYPE.HERO} text="$1B" tone="cream" />
      <Label {...at(SX(c, X_NOW), revenueY)} k={k} text="revenue" tone="creamLo" />
      <Numeral {...at(sideX, pctY)} k={k} px={TYPE.SECONDARY} text="30%" tone="amber" anchor="start" glow />
      <Label {...at(sideX, profitY)} k={k} text="profit" tone="creamLo" anchor="start" />
    </StoutStage>
  );
};

// --- cut 2: the chart ----------------------------------------------------------------------------------
const Chart: React.FC<{ c: Cam; hold: boolean }> = ({ c, hold }) => {
  const k = c.k;
  const band = amberBand(c);
  const bars = V2_YEARS.map((year, i) => ({
    year,
    x: hx(year),
    h: snapLen(V3_DATA.bar[i], k),
    slice: snapLen(V3_DATA.slice[i], k),
    value: V3_DATA.value[i],
  }));
  const axisY = SY(c, TILE_TOP);
  const yearY = rnd(axisY + SPACE.AXIS + TYPE.LABEL * METRIC.fig);
  const labels: React.ReactNode[] = [];
  bars.forEach((b, i) => {
    const sx = SX(c, b.x);
    const top = SY(c, TILE_TOP - b.h);
    const y = rnd(top - SPACE.VALUE);
    if (i === 0) {
      // the start callout, in the cream tone: SECONDARY on the hold, LABEL in the chart,
      // anchored on the bar's top-right corner at both rests, hanging into the empty past, so it
      // eases from SECONDARY (the hold) to LABEL (the chart) about one fixed point
      const right = SX(c, b.x + GEO.HIST_BAR / 2);
      labels.push(<Numeral key="v0" {...W(c, right, y)} k={k} px={hold ? TYPE.SECONDARY : TYPE.LABEL} text={b.value} tone="cream" anchor="end" />);
    } else {
      const w = numeralWidth(b.value, TYPE.LABEL);
      if (sx - w / 2 < 60 || sx + w / 2 > 1020) return; // beyond the frame: not drawn
      labels.push(<Numeral key={`v${i}`} {...W(c, sx, y)} k={k} px={TYPE.LABEL} text={b.value} tone="creamLo" />);
    }
    if (V2_YEAR_LABELS.includes(b.year)) {
      const w = numeralWidth(`${b.year}`, TYPE.LABEL);
      if (sx - w / 2 >= 60 && sx + w / 2 <= 1020)
        labels.push(<Numeral key={`y${b.year}`} {...W(c, sx, yearY)} k={k} px={TYPE.LABEL} text={`${b.year}`} tone="creamLo" />);
    }
  });
  // the now pillar's figures in the chart: "$1B" over its bar, "30%" printed on its slice
  const nowTop = SY(c, TILE_TOP - NOW_BAR);
  const nowLabels = hold
    ? null
    : [
        <Numeral key="n1" {...W(c, SX(c, X_NOW), rnd(nowTop - SPACE.VALUE))} k={k} px={TYPE.LABEL} text="$1B" tone="cream" />,
        <Numeral
          key="n2"
          {...W(c, SX(c, X_NOW), rnd(nowTop + (NOW_SLICE * k) / 2 + (TYPE.LABEL * METRIC.fig) / 2))}
          k={k}
          px={TYPE.LABEL}
          text="30%"
          tone="dark"
        />,
      ];
  return (
    <>
      <Rule x0={AXIS_X0} x1={AXIS_X1} y={TILE_TOP} k={k} />
      {bars.map((b) => (
        <ChartBar key={b.year} x={b.x} baseY={TILE_TOP} h={b.h} slice={b.slice} k={k} amberBand={band} />
      ))}
      <Pillar x={X_NOW} k={k} figure={{ kind: "mercedes" }} bar={NOW_BAR} slice={NOW_SLICE} amberBand={band} />
      {labels}
      {nowLabels}
    </>
  );
};
const K2H = 3.0;
const CAM2H = camFor(hx(2015), TILE_TOP, 560, 960, K2H);
const K2E = 1.375;
const CAM2E = camFor(X_NOW, TILE_TOP, 912, 899, K2E);
const C2Hold: React.FC = () => (
  <StoutStage S={0} cam={CAM2H} pool={{ x: hx(2015), y: TILE_TOP - 60 }} sway={false}>
    <Chart c={CAM2H} hold />
  </StoutStage>
);
const C2End: React.FC = () => (
  <StoutStage S={0} cam={CAM2E} pool={{ x: (hx(2015) + X_NOW) / 2, y: TILE_TOP - 80 }} sway={false}>
    <Chart c={CAM2E} hold={false} />
  </StoutStage>
);

// --- act B -------------------------------------------------------------------------------------------------
const PB = MONEY.B; // px per $B in act B
type Team = { crest: CrestId | null; rev: number; profit: number; val: number };
const MERC: Team = { crest: null, rev: NOW_REV_PX / PX_PER_B, profit: NOW_SLICE_PX / PX_PER_B, val: MERC_VAL_B };
const TEAMS: Team[] = (() => {
  const us = [...US_TEAMS_V2].sort((a, b) => a.x - b.x).map((t) => ({ crest: t.crest, rev: t.rev, profit: t.profit, val: t.val }));
  return [us[0], us[1], MERC, us[2], us[3]]; // Lakers, Warriors, MERCEDES, Knicks, Cowboys
})();
const teamGeom = (t: Team, k: number) => {
  const bar = snapLen(t.rev * PB, k);
  const slice = snapLen(t.profit * PB, k);
  const glass = snapLen(t.val * PB, k);
  const fill = Math.min(glass, snapLen(t.profit * MULTIPLE * PB, k));
  return { bar, slice, glass, fill, backed: fill / glass >= 0.9 };
};
const TeamPillar: React.FC<{ t: Team; x: number; c: Cam }> = ({ t, x, c }) => {
  const g = teamGeom(t, c.k);
  const figure: Figure = t.crest ? { kind: "crest", id: t.crest } : { kind: "mercedes" };
  return (
    <Pillar
      x={x}
      k={c.k}
      figure={figure}
      bar={g.bar}
      slice={g.slice}
      glass={g.glass}
      fill={g.fill}
      rung={g.slice}
      glassRole={g.backed ? "hi" : "lo"}
      amberBand={amberBand(c)}
    />
  );
};
/** "$6B" over "20x", stacked on Mercedes' glass: the multiple's numeral just above the glass. */
const SixTwenty: React.FC<{ c: Cam; sixPx: number; twentyPx: number; sixTone: "cream" | "creamLo" }> = ({ c, sixPx, twentyPx, sixTone }) => {
  const g = teamGeom(MERC, c.k);
  const glassTop = SY(c, TILE_TOP - g.bar + g.slice - g.glass);
  const twentyY = rnd(glassTop - SPACE.CLEAR);
  const sixY = rnd(twentyY - twentyPx * METRIC.fig - SPACE.LOCKUP);
  const sx = SX(c, X_NOW);
  return (
    <>
      <Numeral {...W(c, sx, sixY)} k={c.k} px={sixPx} text="$6B" tone={sixTone} />
      <Numeral {...W(c, sx, twentyY)} k={c.k} px={twentyPx} text={`${MULTIPLE}×`} tone="amber" glow />
    </>
  );
};
const K3 = 2.0;
const CAM3 = camFor(X_NOW, FLOOR, 540, 1368, K3);
const C3: React.FC = () => (
  <StoutStage S={0} cam={CAM3} pool={{ x: X_NOW, y: TILE_TOP - 140 }} sway={false}>
    <TeamPillar t={MERC} x={X_NOW} c={CAM3} />
    <SixTwenty c={CAM3} sixPx={TYPE.SECONDARY} twentyPx={TYPE.HERO} sixTone="cream" />
  </StoutStage>
);
const K4 = 1.5625;
const CAM4 = camFor(X_NOW, FLOOR, 540, 1368, K4);
const C4: React.FC = () => (
  <StoutStage S={0} cam={CAM4} pool={{ x: X_NOW, y: TILE_TOP - 220 }} sway={false}>
    {TEAMS.map((t, i) => (
      <TeamPillar key={i} t={t} x={X_NOW + (i - 2) * GEO.PITCH} c={CAM4} />
    ))}
    <SixTwenty c={CAM4} sixPx={TYPE.SECONDARY} twentyPx={TYPE.SECONDARY} sixTone="creamLo" />
  </StoutStage>
);

// --- cut 5 -------------------------------------------------------------------------------------------------
type Rival = { crest: CrestId | null; ratio: number };
const NAMED: Rival[] = (() => {
  const r = [...RIVALS].sort((a, b) => a.x - b.x).map((v) => ({ crest: v.id, ratio: v.ratio }));
  return [r[0], r[1], { crest: null, ratio: 1 }, r[2], r[3]]; // Lakers, Man United, MERCEDES, Real Madrid, Cowboys
})();
const WORLD_SPORTS: SportName[] = ["BASEBALL", "HOCKEY", "SOCCER", "RACECAR", "FOOTBALL", "BASKETBALL"];
const hash01 = (n: number) => {
  const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};
const worldTeam = (j: number) => {
  // left and right of the named five; no two neighbours alike (the named neighbours included)
  const idx = (Math.abs(j) * 2 + (j < 0 ? 1 : 0)) % WORLD_SPORTS.length;
  return { sport: WORLD_SPORTS[idx], ratio: 0.06 + 0.22 * hash01(j + 40) };
};
const C5Row: React.FC<{ c: Cam; world: boolean }> = ({ c, world }) => {
  const k = c.k;
  const band = amberBand(c);
  const nodes: React.ReactNode[] = [];
  const span = world ? 6 : 2;
  for (let j = -span; j <= span; j++) {
    const x = X_NOW + j * GEO.PITCH;
    if (Math.abs(j) <= 2) {
      const r = NAMED[j + 2];
      const bar = snapLen(r.ratio * MONEY.C5_MERC_BAR, k);
      nodes.push(
        r.crest ? (
          <Pillar key={j} x={x} k={k} figure={{ kind: "crest", id: r.crest }} bar={bar} role="lo" amberBand={band} />
        ) : (
          <Pillar key={j} x={x} k={k} figure={{ kind: "mercedes" }} bar={bar} accent amberBand={band} />
        ),
      );
    } else {
      const w = worldTeam(j);
      nodes.push(<Pillar key={j} x={x} k={k} figure={{ kind: "sport", sport: w.sport }} bar={snapLen(w.ratio * MONEY.C5_MERC_BAR, k)} role="lo" amberBand={band} />);
    }
  }
  return <>{nodes}</>;
};
const K5O = 1.5625;
const CAM5O = camFor(X_NOW, FLOOR, 540, 1368, K5O);
const K5E = 0.8125;
const CAM5E = camFor(X_NOW, FLOOR, 540, 1108, K5E);
const C5Over: React.FC = () => (
  <StoutStage S={0} cam={CAM5O} pool={{ x: X_NOW, y: TILE_TOP - 300 }} sway={false}>
    <C5Row c={CAM5O} world={false} />
  </StoutStage>
);
const C5End: React.FC = () => (
  <StoutStage S={0} cam={CAM5E} pool={{ x: X_NOW, y: TILE_TOP - 300 }} sway={false}>
    <C5Row c={CAM5E} world />
  </StoutStage>
);

// --- overlays ----------------------------------------------------------------------------------------------
const Backdrop: React.FC = () => (
  <Img src={staticFile("cheekypint2/toto_backdrop_9x16.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
);

export const schema = z.object({ frame: z.enum(FRAMES) });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ frame: "c1_end" });

const StoutFrames: React.FC<Props> = ({ frame }) => {
  switch (frame) {
    case "c1_end":
      return <C1 />;
    case "c2_hold":
      return <C2Hold />;
    case "c2_end":
      return <C2End />;
    case "c3_end":
      return <C3 />;
    case "c4_end":
      return <C4 />;
    case "c5_overtake":
      return <C5Over />;
    case "c5_end":
      return <C5End />;
    case "nametag":
    case "nametag_alpha":
      return (
        <AbsoluteFill>
          {frame === "nametag" ? <Backdrop /> : null}
          <StoutNameTag name="Toto Wolff" job="CEO of Mercedes F1 team" />
        </AbsoluteFill>
      );
    case "cta":
    case "cta_alpha":
      return (
        <AbsoluteFill>
          {frame === "cta" ? <Backdrop /> : null}
          <StoutWatchHere />
        </AbsoluteFill>
      );
    default:
      return null;
  }
};
export default StoutFrames;

// --- load-time checks -----------------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`StoutFrames: ${m}`);
  };
  // cut 4's fills, against data.md
  const want = [0.34, 0.74, 1.0, 0.2, 0.97];
  TEAMS.forEach((t, i) => {
    const got = Math.min(1, (t.profit * MULTIPLE) / t.val);
    if (Math.abs(got - want[i]) > 0.006) fail(`team ${i} fills ${(got * 100).toFixed(1)} % (data.md ${want[i] * 100} %)`);
  });
  // the caption band: every pillar's floor above y 1370, every frame's top inside the band
  for (const [name, c] of [
    ["c1", CAM1],
    ["c3", CAM3],
    ["c4", CAM4],
    ["c5o", CAM5O],
    ["c5e", CAM5E],
  ] as const) {
    if (SY(c, FLOOR) > 1370) fail(`${name}: the floor is at y ${SY(c, FLOOR).toFixed(0)}`);
  }
  if (labelWidth("profit", TYPE.LABEL) + SX(CAM1, X_NOW + GEO.BAR / 2) + SPACE.CLEAR > 1020) fail("c1: PROFIT runs off the frame");
  if (COLOR.amberTop !== "#FFB000") fail("amberTop must stay the clip's ACCENT");
}
