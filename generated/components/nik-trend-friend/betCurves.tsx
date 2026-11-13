// ---------------------------------------------------------------------------
// betCurves: the shared chart world of the nik-trend-friend clip (cuts A RaceOnTheCurve, B GradualStart,
// C TrendIsYourFriend). Cheeky Pint, the stout board, palette B1. Owner: builder A. Cuts B and C import, never edit.
//
// WHAT IT IS. One revenue-cohort chart on the espresso board: x = months since launch (0..12), y = revenue (no scale,
// no numbers). A pack of 40 earlier bets fans out of the origin as board-tone lines (6.5 px on screen), each tipped
// by a small board product tile (rimmed, no mark); its top 5 lines run close together as a front group. A highlighted
// product is a cream line drawn by its cream product tile (Revolut's R stamped on it), and turns amber when it is
// working (amber = traction, COMMON.md). Final after rev 1 (director, 2026-11-13): only render bugs change from here,
// logged in CLIP/animation_source/notes/SHARED_CHANGES.md.
// NO DATA: every curve is a proxy shape. SOURCES: none. The pack is an unlabelled proxy shape for "historical data on performance of say about 100 bets"
// (Nik, same episode, ~19:00); the x unit (months since launch) is Nik's ("month one after launch ... month 12").
//
// WORLD UNITS. World px. Origin (month 0, revenue 0) at (0, 0); MX = 150 world px per month (month 12 at x 1800);
// revenue grows UP (y = -revenue). The pack's body (lines 0..34) has its median at revenue ~950 at month 6, ~1710 at
// month 12, its bottom ~620 at month 12; the front group (lines 35..39) runs just above it, its top line ~2190 at
// month 6, ~3940 at month 12.
//
// EXPORTS (geometry, also in betCurvesGeo.ts, which scripts can import without fonts)
//   MX, AXIS_Y, AXIS_END_M         world px per month; the axis rule's y (0); the rule runs to month 12.6
//   monthX(m), xMonth(x), revY(r)  months <-> world x; revenue -> world y
//   shapeG(m)                      the one shape every curve is a multiple of (0 at m 0, slightly concave)
//   packLines                      40 x { id, a, rev(m), at(m) }, ordered lowest (0) -> highest (39); monotone rising,
//                                  near-parallel in log: a steep starter stays steep (they rarely cross)
//   PACK_N, A_MED                  40; the body's median coefficient (230; log spread 0.45)
//   packTop(m), packBottom(m), packMedian(m)   the pack's highest / lowest / median revenue at month m
//   riserRev(a0, a1, ma, mb, pw)   a highlighted bet's revenue function: its coefficient climbs a0 -> a1 over months
//                                  ma..mb (a0 = a1: it keeps its place)
//   samplerOf(rev), pathTo(s, m)   revenue fn -> world-point sampler; the path d from month 0 to month m
//   packWeight(k), lineWeight(k), packTipSize(k), BET_TILE   world sizes at camera k: pack lines 6.5 px on screen,
//                                  pack tiles ~55 px at k 1.3 / ~44 px at k 0.85 / ~27 px at k 0.32; product tile 120
//   FRONT_N, FRONT_A0, FRONT_STEP, frontLines   the pack's top 5 lines, a close front group (a 410..530, step 30)
//   keyedRev(keys)                 a highlighted bet keyed as [month, a] (monotone cubic, flat outside the keys)
//   camOn(m, rev, k, sx?, sy?)     the camera centre that puts the chart point at screen (sx, sy) (default the middle)
// EXPORTS (components; all world px, draw inside StoutStage)
//   <Axis k dim? enter? yTitle? px? />  the rule, month ticks, numerals 1..12 and MONTHS SINCE LAUNCH (under months
//                                  0..4) at AXIS_PX 40 (axisPx(k) steps it to 30 on a wide, k < ~0.43; 40 is the
//                                  chart's own size, one step above the kit's LABEL 30, accepted by the director),
//                                  REVENUE up the left of the origin (yTitle={false} drops it: it is ~150 screen px
//                                  tall, so keep it out of the caption bands). `enter` 0..1 = the house text entrance.
//   <PackFan month k dim? tips? /> the 40 pack lines drawn from the origin to `month` (12 = the full history), one
//                                  shared shadow, a board tile on every tip (tips={false} hides them). dim 0..1 sinks
//                                  lines and tiles toward the ground by tone (never opacity).
//   <BetLine rev month k band amber? tile? mark? lift? />   one highlighted product: its line to `month`, its tile
//                                  at the tip. amber 0..1 = the tone (0 cream, 1 amber: line, tile, bloom, hot edge);
//                                  band = amberBandFor(cam). tile={false} for a line with no tile; mark={false} drops
//                                  the R.
// Draw order: Axis, PackFan, BetLine(s). Everything is at full precision.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { ALPHA, COLOR, EDGE, FONT_NUM, GEO, Label, SPACE, TYPE, bloomFilter, clamp01, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow } from "../kits/cheeky-pint/museShared";
import { AXIS_END_M, AXIS_Y, BET_TILE, MX, monthX, packLines, packTipSize, packWeight, lineWeight, pathTo, samplerOf } from "./betCurvesGeo";
import { REVOLUT_R_BOX, REVOLUT_R_D } from "./revolutMark";

export * from "./betCurvesGeo";

const n6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `bc${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- tones ------------------------------------------------------------------------------------------------------
/** A pack line's tone (board sunk a little toward the ground, so the tips read above their lines), by `dim`. */
const packLineTone = (dim: number) => mixHex(mixHex(COLOR.board, COLOR.ground, 0.22), COLOR.ground, 0.55 * clamp01(dim));
const packTipTop = (dim: number) => mixHex(COLOR.board, COLOR.ground, 0.55 * clamp01(dim));
const packTipFoot = (dim: number) => mixHex(COLOR.boardFoot, COLOR.ground, 0.55 * clamp01(dim));
const packRim = (dim: number) => mixHex(mixHex(COLOR.boardFoot, COLOR.shadow, 0.5), COLOR.ground, 0.55 * clamp01(dim));

// --- the axis ---------------------------------------------------------------------------------------------------
const TICK_PX = 12; // screen px, down from the rule
/** The x axis: rule, month ticks, numerals 1..12, the axis title, and REVENUE up the left of the origin. */
/** The axis type (screen px): one step up from the kit's 30 px LABEL, which is hard to read on a phone. The kit has no
 *  token between LABEL 30 and SECONDARY 136; this is the chart's own size (director, Rev 1). */
export const AXIS_PX = 40;
/** Default axis type at camera k: AXIS_PX, stepped down to the kit's LABEL (30) on a wide where the month numerals
 *  are closer than ~1.6 em (k < ~0.43), so "10 11 12" never touch. */
export const axisPx = (k: number) => Math.max(TYPE.LABEL, Math.min(AXIS_PX, 0.62 * MX * k));
export const Axis: React.FC<{ k: number; dim?: number; enter?: number; yTitle?: boolean; px?: number }> = ({ k, dim = 0, enter = 1, yTitle = true, px = axisPx(k) }) => {
  const ink = mixHex(COLOR.rule, COLOR.ground, 0.5 * clamp01(dim));
  const sw = 2 / k;
  const ticks: string[] = [];
  for (let m = 1; m <= 12; m++) ticks.push(`M${n6(monthX(m))} ${n6(AXIS_Y)}V${n6(AXIS_Y + TICK_PX / k)}`);
  // numerals: their cap top SPACE.AXIS below the tick; the title's cap top SPACE.CLEAR + 8 under the numerals
  const numBase = AXIS_Y + (TICK_PX + SPACE.AXIS + 0.729 * px) / k;
  const titleBase = numBase + (SPACE.CLEAR + 8 + 0.718 * px) / k;
  const numFs = px / k;
  return (
    <g>
      <path d={`M${n6(-14 / k)} ${n6(AXIS_Y)}H${n6(monthX(AXIS_END_M))}`} stroke={ink} strokeWidth={n6(sw)} strokeLinecap="round" />
      <path d={ticks.join("")} stroke={ink} strokeWidth={n6(sw)} strokeLinecap="butt" />
      <g fontFamily={FONT_NUM} fontWeight={700} fontSize={n6(numFs)} fill={dim > 0 ? mixHex(COLOR.inkCreamLo, COLOR.ground, 0.5 * clamp01(dim)) : COLOR.inkCreamLo} textAnchor="middle" style={{ fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <text key={i} x={n6(monthX(i + 1))} y={n6(numBase)}>
            {i + 1}
          </text>
        ))}
      </g>
      <Label x={0} y={titleBase} k={k} px={px} text="Months since launch" anchor="start" tone="creamLo" enter={enter} />
      {yTitle ? (
        <g transform={`translate(${n6(-(SPACE.CLEAR + 8) / k)} ${n6(AXIS_Y)}) rotate(-90)`}>
          <Label x={0} y={0} k={k} px={px} text="Revenue" anchor="start" tone="creamLo" enter={enter} />
        </g>
      ) : null}
    </g>
  );
};

// --- the pack ---------------------------------------------------------------------------------------------------
/** The 40 earlier bets drawn from the origin to `month`, one shared shadow, a small board tile on every tip. */
export const PackFan: React.FC<{ month: number; k: number; dim?: number; tips?: boolean }> = ({ month, k, dim = 0, tips = true }) => {
  const uid = uidOf(useId());
  if (month <= 0) return null;
  const W = packWeight(k);
  const ds = packLines.map((l) => pathTo(l.at, month, 0.06));
  const t = packTipSize(k);
  const r = (GEO.RADIUS * t) / GEO.TILE;
  const tipRects = tips ? packLines.map((l) => { const p = l.at(month); return rectPath(p.x - t / 2, p.y - t / 2, t, t, r); }) : [];
  const s = t / GEO.TILE;
  return (
    <g>
      <UnionShadow sil={ds.map((d) => ({ d, stroke: W }))} s={0.35} elevation="rest" strength={1 - 0.5 * clamp01(dim)} />
      <path d={ds.join("")} fill="none" stroke={packLineTone(dim)} strokeWidth={n6(W)} strokeLinecap="round" strokeLinejoin="round" />
      {tips ? (
        <>
          <UnionShadow sil={[{ d: tipRects.join("") }]} s={s} elevation="rest" strength={1 - 0.5 * clamp01(dim)} />
          <defs>
            <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={packTipTop(dim)} />
              <stop offset="1" stopColor={packTipFoot(dim)} />
            </linearGradient>
          </defs>
          {/* each tile on its own, low to high, so a stacked pair shows its lit top edge */}
          {packLines.map((l, i) => {
            const p = l.at(month);
            return (
              <g key={l.id}>
                {/* the tile's darker rim: a stacked pair reads as two tiles, never one bar */}
                <path d={tipRects[i]} fill={`url(#${uid}t)`} stroke={packRim(dim)} strokeWidth={n6(1.5 / k)} />
                <path
                  d={`M${n6(p.x - t / 2 + r)} ${n6(p.y - t / 2 + EDGE.CREAM / k / 2)}H${n6(p.x + t / 2 - r)}`}
                  stroke={COLOR.edge}
                  strokeOpacity={ALPHA.edgeBoard}
                  strokeWidth={n6(EDGE.CREAM / k)}
                />
              </g>
            );
          })}
        </>
      ) : null}
    </g>
  );
};

// --- one highlighted bet ----------------------------------------------------------------------------------------
/** The product tile's corner radius (the kit's one radius, scaled from the 96 tile). */
const TILE_R = (GEO.RADIUS * BET_TILE) / GEO.TILE;
/** The R stamp's height on the tile. */
const MARK_H = 0.54 * BET_TILE;

/** One highlighted product: its line from the origin to `month`, its cream (-> amber) tile drawing it. */
export const BetLine: React.FC<{
  rev: (m: number) => number;
  month: number;
  k: number;
  band: [number, number];
  amber?: number;
  tile?: boolean;
  mark?: boolean;
  lift?: number;
}> = ({ rev, month, k, band, amber = 0, tile = true, mark = true, lift = 0 }) => {
  const uid = uidOf(useId());
  if (month <= 0) return null;
  const s = samplerOf(rev);
  const d = pathTo(s, month, 0.03);
  const e = s(month);
  const W = lineWeight(k);
  const a = clamp01(amber);
  const T = BET_TILE;
  const tx = e.x - T / 2;
  const ty = e.y - T / 2;
  const tileD = rectPath(tx, ty, T, T, TILE_R);
  const sc = MARK_H / REVOLUT_R_BOX.h;
  const mx = e.x - (REVOLUT_R_BOX.w * sc) / 2;
  const my = e.y - MARK_H / 2;
  // the tone is mixed into the paint itself (no see-through middle of a crossfade): the line's gradient runs from
  // cream to the amber band in screen-locked world y, the tile's from cream to the band's colour at the tile
  const bandAt = (y: number) => clamp01((y - band[0]) / (band[1] - band[0]));
  const tTop = mixHex(COLOR.amberTop, COLOR.amberFoot, bandAt(ty));
  const tFoot = mixHex(COLOR.amberTop, COLOR.amberFoot, bandAt(ty + T));
  return (
    <g>
      <UnionShadow sil={tile ? [{ d, stroke: W }, { d: tileD }] : [{ d, stroke: W }]} s={1.1} elevation="rest" lift={lift} />
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={n6(band[0])} x2="0" y2={n6(band[1])}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.amberTop, a)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.amberFoot, a)} />
        </linearGradient>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixHex(COLOR.cream, tTop, a)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, tFoot, a)} />
        </linearGradient>
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the bloom: an amber copy under the body, its glow rising with the tone (the body covers the copy) */}
      {a > 0 ? (
        <g opacity={n6(a)} style={{ filter: bloomFilter(k) }}>
          <path d={d} fill="none" stroke={COLOR.amberTop} strokeWidth={n6(W)} strokeLinecap="round" strokeLinejoin="round" />
          {tile ? <path d={tileD} fill={COLOR.amberTop} /> : null}
        </g>
      ) : null}
      <path d={d} fill="none" stroke={`url(#${uid}a)`} strokeWidth={n6(W)} strokeLinecap="round" strokeLinejoin="round" />
      {a > 0 ? <path d={d} fill="none" stroke={COLOR.amberHot} strokeOpacity={n6(0.42 * a)} strokeWidth={n6(W * 0.16)} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {tile ? (
        <g>
          <path d={tileD} fill={`url(#${uid}c)`} />
          {a < 1 ? (
            <path d={`M${n6(tx + TILE_R)} ${n6(ty + EDGE.CREAM / k / 2)}H${n6(tx + T - TILE_R)}`} stroke={COLOR.edge} strokeOpacity={n6(ALPHA.edge * (1 - a))} strokeWidth={n6(EDGE.CREAM / k)} />
          ) : null}
          {a > 0 ? (
            <g opacity={n6(a)}>
              <path d={rectPath(tx, ty, T, EDGE.HOT_FALL / k, TILE_R, true, false)} fill={`url(#${uid}hf)`} />
              <path d={`M${n6(tx + TILE_R)} ${n6(ty + EDGE.HOT / k / 2)}H${n6(tx + T - TILE_R)}`} stroke={COLOR.amberHot} strokeWidth={n6(EDGE.HOT / k)} />
            </g>
          ) : null}
          {mark ? <path d={REVOLUT_R_D} fill={COLOR.inkDark} fillRule="evenodd" transform={`translate(${n6(mx)} ${n6(my)}) scale(${n6(sc)})`} /> : null}
        </g>
      ) : null}
    </g>
  );
};
