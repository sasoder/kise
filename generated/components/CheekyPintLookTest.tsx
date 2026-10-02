import React from "react";
import { z } from "zod";
import { CheekyPint2Stage, LOOKS, SOHNE2, heroWidth, labelWidth, type Scene } from "./cheekyPint2";
import { MULTIPLE, NOW_REV_PX, NOW_SLICE_PX, PX_PER_B } from "./wolffShared";
import { MERC_VAL_B } from "./wolffActB";
import { US_TEAMS_V2 } from "./wolffActB2";
import { RIVALS } from "./MostSponsorship";
import type { CrestId } from "./wolffLogos";

// ---------------------------------------------------------------------------
// CheekyPintLookTest — LOOK DEVELOPMENT STILLS for "Cheeky Pint 2.0" (brief:
// out/wolff/briefs/LOOKDEV.md). Not a cut: three static frames of the Toto Wolff
// "Mercedes F1 financials" clip (Cheeky Pint S4E01), restaged for the new
// looks of cheekyPint2.tsx. 1080 x 1920, one frame; props `look` and `frame`.
//
// THE FRAMES (same subjects, same data, same layout logic as the delivered cuts;
// scale, widths, framing and type re-solved so each frame is FULL and its
// numbers are heroes; everything in the caption-safe band: subject ink above
// y 1400, content centre ~835, labels inside x 120-960 / y 300-1350):
//   hero      cut 1's payoff, "around a billion dollars in revenue and 30% profit
//             margin": the Mercedes star tile, the $1B revenue column standing
//             on it, its top 30 % amber; "$1B" over "REVENUE" crowning the
//             column, "30%" printed ON the amber it measures, "PROFIT" beside it.
//             The column is 310 px, ~2.6x the delivered bar (120 px on screen at 03 f124).
//   teams     cut 4 V2's payoff, "you have fundamentals for some of the teams":
//             five teams across 82 % of the width (pitch 195), crest tiles,
//             revenue bars with their profit slices, the valuation glass, and
//             each team's profit x20 (Mercedes' own multiple) filling 34 / 74 /
//             100 / 20 / 97 %; "$6B" over "20x" on Mercedes' column.
//   overtake  cut 5 V2 just after the overtake (f132), "the most sponsorship of
//             any sports team": the four rival crest tiles with their
//             sponsorship bars at the context rung, Mercedes' AMBER bar towering
//             in the middle. No numbers (cut 5 has none).
//
// DATA (out/wolff/briefs/data.md), imported, never retyped:
//   Mercedes now: $1B revenue, $300M profit (Toto, the clip) = NOW_REV_PX /
//     NOW_SLICE_PX (30 %); valuation $6B (MERC_VAL_B; Kurtz deal Nov 2025) =
//     MULTIPLE (20) x the profit.
//   US teams: US_TEAMS_V2 (wolffActB2) — Forbes team pages, NBA list calculated
//     Oct 2025 / NFL 2025 list: Lakers $10.0B / $0.551B / $0.170B, Warriors
//     $11.0B / $0.880B / $0.409B, Knicks $9.75B / $0.532B / $0.098B, Cowboys
//     $13.0B / $1.2B / $0.629B (value / revenue / operating income).
//   Sponsorship: RIVALS (MostSponsorship) — Mercedes ~$558M (SponsorUnited via
//     The Race, 30 Apr 2026) = the tallest bar; Cowboys 0.54 (Sportico 2025);
//     Real Madrid 0.85, Man United 0.62, Lakers 0.40 ILLUSTRATIVE.
// ---------------------------------------------------------------------------

export const FRAMES = ["hero", "teams", "overtake", "ground"] as const; // "ground": the bare sheet (checks, material reference)
export type FrameName = (typeof FRAMES)[number];

const CX = 540;
const FLOOR = 1368; // tiles stand here; their contact and drop shadows have died out by y ~1401 (measured against the bare sheet)

// --- hero -------------------------------------------------------------------------------------
// Two candidate stagings, same data (a $1B column whose top 30 % is amber, on the star tile):
//   side   "$1B" over "REVENUE" crowning the column (cut 1's own grammar), "30%" printed ON the amber
//          it measures, "PROFIT" beside the slice — the reading order of the line.
//   inset  both numbers set on the column itself: "30%" over "PROFIT" on the amber, "$1B" over
//          "REVENUE" on the cream — no empty card, the column becomes the label.
export const HERO_LAYOUTS = ["side", "inset"] as const;
export type HeroLayout = (typeof HERO_LAYOUTS)[number];
export const HERO = {
  side: { tile: 310, barW: 310, billion: 186, pct: 140, label: 38, topInk: 302, gapNumLabel: 12, gapLabelBar: 22, gapSide: 24 },
  inset: { tile: 330, barW: 330, billion: 176, pct: 148, label: 38, labelOnSlice: 36, topInk: 312, gapPct: 12, gapNumLabel: 14 },
} as const;
const heroScene = (layout: HeroLayout): Scene => {
  const sliceFrac = NOW_SLICE_PX / NOW_REV_PX; // 30 %: $300M of $1B
  if (layout === "side") {
    const H = HERO.side;
    const billionY = H.topInk + SOHNE2.dollarTop * H.billion;
    const revenueY = billionY + SOHNE2.dollarDesc * H.billion + H.gapNumLabel + SOHNE2.cap * H.label;
    const barTop = revenueY + H.gapLabelBar;
    const tileTop = FLOOR - H.tile;
    const barH = tileTop - barTop;
    const sliceH = barH * sliceFrac;
    const sliceMid = barTop + sliceH / 2;
    if (SOHNE2.fig * H.pct > sliceH - 44) throw new Error(`CheekyPintLookTest: "30%" does not fit the slice (${sliceH.toFixed(0)} px)`);
    return {
      tiles: [{ x: CX, y: FLOOR, size: H.tile, figure: { kind: "mercedes" }, role: "hi" }],
      bars: [{ x: CX, baseY: tileTop, w: H.barW, h: barH, role: "hi" }],
      slices: [{ x: CX, topY: barTop, w: H.barW, h: sliceH }],
      glass: [],
      fills: [],
      texts: [
        { text: "$1B", x: CX, y: billionY, size: H.billion, kind: "hero", role: "hi" },
        { text: "revenue", x: CX, y: revenueY, size: H.label, kind: "label", role: "lo" },
        { text: "30%", x: CX, y: sliceMid + (SOHNE2.fig * H.pct) / 2, size: H.pct, kind: "hero", role: "hi", on: "accent" },
        {
          text: "profit",
          x: CX + H.barW / 2 + H.gapSide,
          y: sliceMid + (SOHNE2.cap * H.label) / 2,
          size: H.label,
          kind: "label",
          role: "lo",
          anchor: "start",
        },
      ],
      focus: { x: CX, y: sliceMid + 60, rx: 560, ry: 640 },
      subject: [
        { x: CX - H.barW / 2, y: barTop, w: H.barW, h: barH },
        { x: CX - H.tile / 2, y: tileTop, w: H.tile, h: H.tile },
      ],
    };
  }
  const H = HERO.inset;
  const barTop = H.topInk;
  const tileTop = FLOOR - H.tile;
  const barH = tileTop - barTop;
  const sliceH = barH * sliceFrac;
  const sliceMid = barTop + sliceH / 2;
  const pairH = SOHNE2.fig * H.pct + H.gapPct + SOHNE2.cap * H.labelOnSlice;
  if (pairH > sliceH - 40) throw new Error(`CheekyPintLookTest: "30% / PROFIT" does not fit the slice (${sliceH.toFixed(0)} px)`);
  const pctY = sliceMid - pairH / 2 + SOHNE2.fig * H.pct;
  // "$1B" over "REVENUE", centred on the cream (the revenue that is not profit)
  const bodyMid = (barTop + sliceH + tileTop) / 2;
  const blockH = (SOHNE2.dollarTop + SOHNE2.dollarDesc) * H.billion + H.gapNumLabel + SOHNE2.cap * H.label;
  const billionY = bodyMid - blockH / 2 + SOHNE2.dollarTop * H.billion;
  const revenueY = billionY + SOHNE2.dollarDesc * H.billion + H.gapNumLabel + SOHNE2.cap * H.label;
  return {
    tiles: [{ x: CX, y: FLOOR, size: H.tile, figure: { kind: "mercedes" }, role: "hi" }],
    bars: [{ x: CX, baseY: tileTop, w: H.barW, h: barH, role: "hi" }],
    slices: [{ x: CX, topY: barTop, w: H.barW, h: sliceH }],
    glass: [],
    fills: [],
    texts: [
      { text: "30%", x: CX, y: pctY, size: H.pct, kind: "hero", role: "hi", on: "accent" },
      { text: "profit", x: CX, y: pctY + H.gapPct + SOHNE2.cap * H.labelOnSlice, size: H.labelOnSlice, kind: "label", role: "lo", on: "accent" },
      { text: "$1B", x: CX, y: billionY, size: H.billion, kind: "hero", role: "hi", on: "card" },
      { text: "revenue", x: CX, y: revenueY, size: H.label, kind: "label", role: "lo", on: "card" },
    ],
    focus: { x: CX, y: bodyMid, rx: 560, ry: 700 },
    subject: [
      { x: CX - H.barW / 2, y: barTop, w: H.barW, h: barH },
      { x: CX - H.tile / 2, y: tileTop, w: H.tile, h: H.tile },
    ],
  };
};

// --- teams ------------------------------------------------------------------------------------------
export const TEAMS = { pitch: 195, tile: 152, colW: 104, topInk: 318, six: 140, twenty: 104, gapTop: 24, gapRow: 22 } as const;
type TeamRow = { name: string; crest: CrestId | null; rev: number; profit: number; val: number };
const TEAM_ROW: TeamRow[] = (() => {
  const us = [...US_TEAMS_V2].sort((a, b) => a.x - b.x);
  const merc: TeamRow = {
    name: "Mercedes",
    crest: null,
    rev: NOW_REV_PX / PX_PER_B, // $1B
    profit: NOW_SLICE_PX / PX_PER_B, // $0.3B
    val: MERC_VAL_B, // $6B
  };
  const row: TeamRow[] = us.map((t) => ({ name: t.name, crest: t.crest, rev: t.rev, profit: t.profit, val: t.val }));
  row.splice(2, 0, merc); // Lakers, Warriors, MERCEDES, Knicks, Cowboys
  return row;
})();
const teamsScene = (): Scene => {
  const T = TEAMS;
  const tileTop = FLOOR - T.tile;
  // one scale for every team: the tallest valuation (glass top) lands on topInk
  const reach = Math.max(...TEAM_ROW.map((t) => t.rev - t.profit + t.val));
  const s = (tileTop - T.topInk) / reach; // px per $1B
  const scene: Scene = {
    tiles: [],
    bars: [],
    slices: [],
    glass: [],
    fills: [],
    texts: [],
    focus: { x: CX, y: 900, rx: 600, ry: 760 },
    subject: [],
  };
  TEAM_ROW.forEach((t, i) => {
    const x = CX + (i - 2) * T.pitch;
    const barH = t.rev * s;
    const sliceH = t.profit * s;
    const base = tileTop - barH + sliceH;
    const colH = t.val * s;
    const fundH = Math.min(t.profit * MULTIPLE * s, colH);
    const backed = fundH / colH >= 0.9; // the delivered rule: outline to the HI rung once 90 % backed
    scene.tiles.push({ x, y: FLOOR, size: T.tile, figure: t.crest ? { kind: "crest", id: t.crest } : { kind: "mercedes" }, role: "hi" });
    scene.bars.push({ x, baseY: tileTop, w: T.colW, h: barH, role: "hi" });
    scene.slices.push({ x, topY: tileTop - barH, w: T.colW, h: sliceH });
    scene.glass.push({ x, baseY: base, w: T.colW, h: colH, role: backed ? "hi" : "lo" });
    scene.fills.push({ x, baseY: base, w: T.colW, h: fundH, unit: sliceH, full: fundH >= colH - 0.5 });
    if (!t.crest) {
      const top = base - colH;
      const twentyY = top - T.gapTop;
      const sixY = twentyY - SOHNE2.fig * T.twenty - T.gapRow - SOHNE2.dollarDesc * T.six;
      scene.texts.push({ text: "$6B", x, y: sixY, size: T.six, kind: "hero", role: "hi" });
      scene.texts.push({ text: `${MULTIPLE}×`, x, y: twentyY, size: T.twenty, kind: "hero", role: "hi", tone: "accent" });
      scene.subject.push({ x: x - T.colW / 2, y: top, w: T.colW, h: FLOOR - top });
    }
  });
  return scene;
};

// --- overtake ----------------------------------------------------------------------------------------
export const OVER = { pitch: 195, tile: 160, barW: 124, topInk: 322 } as const;
const overtakeScene = (): Scene => {
  const O = OVER;
  const tileTop = FLOOR - O.tile;
  const merc = tileTop - O.topInk; // the tallest bar: ~$558M
  const row: { crest: CrestId | null; ratio: number }[] = [...RIVALS]
    .sort((a, b) => a.x - b.x)
    .map((r) => ({ crest: r.id, ratio: r.ratio }));
  row.splice(2, 0, { crest: null, ratio: 1 }); // Lakers, Man United, MERCEDES, Real Madrid, Cowboys
  const scene: Scene = {
    tiles: [],
    bars: [],
    slices: [],
    glass: [],
    fills: [],
    texts: [],
    focus: { x: CX, y: 760, rx: 520, ry: 760 },
    subject: [],
  };
  row.forEach((t, i) => {
    const x = CX + (i - 2) * O.pitch;
    const role = t.crest ? "lo" : "hi";
    scene.tiles.push({ x, y: FLOOR, size: O.tile, figure: t.crest ? { kind: "crest", id: t.crest } : { kind: "mercedes" }, role });
    scene.bars.push({ x, baseY: tileTop, w: O.barW, h: merc * t.ratio, role, accent: !t.crest });
    if (!t.crest) scene.subject.push({ x: x - O.barW / 2, y: O.topInk, w: O.barW, h: FLOOR - O.topInk });
  });
  return scene;
};

export const HERO_SCENES: Record<HeroLayout, Scene> = { side: heroScene("side"), inset: heroScene("inset") };
export const DEFAULT_HERO: HeroLayout = "side";
export const SCENES: Record<FrameName, Scene> = {
  hero: HERO_SCENES[DEFAULT_HERO],
  teams: teamsScene(),
  overtake: overtakeScene(),
  ground: { tiles: [], bars: [], slices: [], glass: [], fills: [], texts: [], focus: { x: CX, y: 840, rx: 560, ry: 700 }, subject: [] },
};

export const schema = z.object({
  look: z.enum(LOOKS),
  frame: z.enum(FRAMES),
  /** the hero frame's staging (look-dev comparison); the other frames ignore it */
  heroLayout: z.enum(HERO_LAYOUTS).optional(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ look: "freshKraft", frame: "hero" });

const CheekyPintLookTest: React.FC<Props> = ({ look, frame, heroLayout }) => (
  <CheekyPint2Stage look={look} scene={frame === "hero" && heroLayout ? HERO_SCENES[heroLayout] : SCENES[frame]} />
);
export default CheekyPintLookTest;

// --- load-time checks: the band, the padding box, the data --------------------------------------------
const fail = (m: string) => {
  throw new Error(`CheekyPintLookTest: ${m}`);
};
for (const [name, sc] of [...Object.entries(SCENES), ...Object.entries(HERO_SCENES).map(([k, v]) => [`hero-${k}`, v] as const)]) {
  for (const t of sc.tiles) {
    if (t.y > 1370) fail(`${name}: a tile stands below y 1370 (its shadow would reach the captions)`);
    if (t.x - t.size / 2 < 60 || t.x + t.size / 2 > 1020) fail(`${name}: a tile is within 60 px of a side`);
  }
  for (const x of sc.texts) {
    const w = x.kind === "hero" ? heroWidth(x.text, x.size) : labelWidth(x.text, x.size);
    const a = x.anchor ?? "middle";
    const x0 = a === "middle" ? x.x - w / 2 : a === "end" ? x.x - w : x.x;
    const top = x.y - (x.kind === "hero" ? SOHNE2.dollarTop : SOHNE2.cap) * x.size;
    if (x0 < 120 || x0 + w > 960 || top < 300 || x.y > 1350) fail(`${name}: "${x.text}" is outside the padding box`);
  }
}
{
  const t = SCENES.teams;
  const want = [0.34, 0.74, 1.0, 0.2, 0.97];
  t.fills.forEach((f, i) => {
    const got = f.h / t.glass[i].h;
    if (Math.abs(got - want[i]) > 0.006) fail(`teams: fill ${i} is ${(got * 100).toFixed(1)} %, data.md says ${want[i] * 100} %`);
  });
}
