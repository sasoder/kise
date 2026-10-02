import React from "react";
import {
  ACCENT,
  ADVANCE_EM,
  FundamentalsFill,
  GROUND_Y,
  HALF_STEP,
  INK,
  INK_HI,
  INK_LO,
  KraftStage,
  MULTIPLE,
  MoneyBar,
  NOW_GAP_BAR_PX,
  NOW_GAP_ROW_PX,
  NOW_REV_PX,
  NOW_SLICE_PX,
  NowColumn,
  PX_PER_B,
  ProfitSlice,
  Readout,
  SOHNE,
  SportTile,
  TILE,
  TILE_TOP,
  ValuationColumn,
  X_NOW,
  cameraTrack,
  toScreen,
  clamp01,
  easeOut,
  ENTER_LIFT_PX,
  nowLabelLayout,
  rung,
  settleBump,
  smoothstep,
  sz,
  typeSize,
  type Cam,
  type Glide,
  type SportName,
} from "./wolffShared";
import { CAM_LIFT, sway } from "./fieldShared";
import { CAM_NOW_END } from "./wolffActA";

// ---------------------------------------------------------------------------
// wolffActB — ACT B of the Toto Wolff "Mercedes F1 financials" clip (Cheeky
// Pint S4E01): ONE world on ONE story clock S_B, rendered through two windows.
// Builder B. Both cuts draw `ActBScene` at S_B, so the join is identical by
// construction (cut 4's f0 = cut 3's f94; the in-points are 94 frames apart on
// the 24 fps grid, edit frames 605 -> 699).
//
//   cut 3 ConservativeMultiples  S_B 0-96    (in 0:25.199)
//     "These multiples are actually on the conservative side."
//     DURATION = round((28.559 - 25.199) x 24) = 81, + 16 = 97 f
//   cut 4 SomeHaveFundamentals   S_B 94-233  (in 0:29.140)
//     "When you look at the valuations of the US teams, you have fundamentals
//      for some of the teams."
//     DURATION = round((34.320 - 29.140) x 24) = 124, + 16 = 140 f
//
// THE WORLD: the Mercedes "now" column only (NowColumn: star tile, $1B white
// bar, $300M amber slice), plus four anonymous US teams that enter in cut 4.
// No history bars, no time axis, no sport line. AMBER = PROFIT and only profit:
// the slices, and profit stretched x20 (FundamentalsFill). Everything else is
// white at INK_HI / INK_LO.
//
// ONE MOTION PER CUT.
//   cut 3 — ONE STRETCH: a transparent copy of the profit slice pulls upward to
//   twenty times its height, and the camera rides its top until it lands on $6B.
//   cut 4 — THE SAME YARDSTICK, SWEPT ACROSS FOUR US TEAMS: their valuations rise
//   tall beside Mercedes, then each team's own profit stretches up inside its
//   column, filling two and falling far short in two.
// The camera is ONE monotone pull-back across the whole act (six superposed
// glides, k 2.12 -> 0.64): it never changes direction (monotone to 0.01 world
// px), and it is never still (frame-edge speed >= 0.8 px/f after the ride).
//
// GESTURES -> the word they serve -> S_B frames (cut 4 frame = S_B - 94)
//  cut 3
//   1. THE STRETCH: a ValuationColumn + FundamentalsFill (unit = the slice, 48)
//      grow together from the slice's lower edge, m 1 -> 20 on one ease,
//      smoothstep(u^1.35) over S -6..58, so on f0 it is already 9 screen px
//      clear of the slice and moving; slow off the slice, fastest just past
//      mid-way, decelerating into 20; a rung is left behind each time the top
//      passes a slice-height -> "these multiples are actually" -> lands S 58, 4 f
//      before "conservative" (62); zero-sloped settle (STRETCH_OVER) S 58-64.
//   2. THE COUNTER "1x" ... "20x" (Halbfett, ACCENT) rides centred just above
//      the top, cut 1's grammar (the readout that rode the bar's top and became
//      "$1B"); a hard tick per rung passed. It slides up + fades in from the
//      frame it rides clear of the old labels -> "multiples" -> S 10-22 (it
//      reads "2x" as it appears).
//   3. ROLE CHANGE: "30%" eases ACCENT 1.0 -> INK_LO -> "these multiples" ->
//      S 0-12. "$1B" over "revenue" stand in the column's path: the pair exits
//      (the reverse entrance) the frame the rising top reaches it, BEHIND the
//      glass -> S 2-14.
//   4. CAMERA G1 rides the top and pulls back to LAND (solved from the picture:
//      k 0.85, the stack's top at screen y 306, the tiles' foot at 1394): the
//      zoom S 0-48 leads, the tilt S 4-50 follows, so the foot never drops
//      under the captions -> "these multiples are actually" (damped to ~S 60).
//   5. "$6B" (Halbfett, INK_HI) slides up into the slot over "20x" — the stack
//      reads "$6B / 20x", as cut 1's "$1B / revenue" — and lands S 64 with THE
//      ONE CLICK (HALF_STEP S 64-66) -> "conservative" (62) -> S 52-64.
//   6. The column's outline eases INK_LO -> INK_HI as it completes: fully
//      backed by profit -> "conservative" -> S 56-68.
//   7. CAMERA G2: the slow pull-back that cut 4 continues, overlapping G1's
//      deceleration so the camera flows through the landing (never under
//      1 screen px/f at the frame edge there), C1 across the join -> "on the
//      conservative side" + tail -> S 44-140.
//  cut 4
//   8. Mercedes' "30%"/"profit" exit; "$6B"/"20x" ease to INK_LO (context
//      now) -> "when you look" -> S 98-110 (f4-16).
//   9. THE FOUR US TILES slide up 24 screen px + fade into their slots, ONE
//      group move as a wave outward from Mercedes (inner S 98, outer S 101,
//      13 f each) -> "look at the" -> S 98-114 (f4-20).
//  10. Their bars rise out of the tiles, the amber slice first (inner S 104,
//      outer S 107, 15 f) -> "valuations" -> S 104-122 (f10-28).
//  11. Their VALUATION COLUMNS (outline + white fill, no amber) stretch up from
//      the slices' lower edges to their valuations, inner S 114 / outer S 117,
//      the duration growing with height (31-36 f) so the tallest lands last,
//      S 153 = f59, with a zero-sloped settle -> "valuations of the US teams"
//      -> S 114-159 (f20-65). Tops peak at 42 screen px/f (cap 45).
//  12. CAMERA G3 reacts to them, the reveal pull-back (zoom S 114-166 to k 0.665
//      leading, tilt S 116-168) -> "of the US teams".
//  13. BREATH: the creep (CAMERA G4, S 148-250, k -> 0.64) carries on; the
//      outlines have settled -> "teams" (154) -> S 159-170 (f65-76).
//  14. THE YARDSTICK: every US team's own profit slice stretches x20 inside its
//      column at once (inner S 170, outer S 172, 34 f, the same ease as cut 3,
//      rungs at that team's own slice height) and stops at its own x20 height:
//      two reach (or all but reach: 92 %) their tops, two stop low (36 %, 20 %)
//      with the air above in plain view -> "you have fundamentals for some"
//      -> S 170-206 (f76-112), landing on "of the teams".
//  15. As a fill passes 90 % of its column, that outline eases INK_LO -> INK_HI
//      (the basketball S 201, the big football team S 199); the two that fall
//      short stay INK_LO -> "some ... of the teams" -> S 199-213 (f105-119).
//  16. TAIL: the creep decays; nothing new -> "teams" + tail -> S 206-233.
//  No click in cut 4 (group arrivals never click).
//
// DATA (out/wolff/briefs/data.md):
//   Mercedes "now": $1B revenue, 30 % margin = $300M profit (Toto, the clip).
//   Mercedes valuation $6B: the Kurtz deal, Nov 2025, GBP 4.57B / $5.97B (CNBC
//     20 Nov 2025; BlackBook 21 Nov 2025) = 20 x the $300M profit on screen.
//   US teams: ANONYMOUS, ILLUSTRATIVE archetypes (no names, logos or numbers on
//     screen) reproducing the real spread: NFL 2025 average $7.1B valuation /
//     $127M operating income = ~56x (Forbes, 28 Aug 2025); Dallas Cowboys $13B /
//     $629M = ~21x (Sportico 2025). Scale PX_PER_B = 160 world px per $1B.
// ---------------------------------------------------------------------------

// --- the act's clock ---------------------------------------------------------------
export const S_END = 233;
/** The two windows on S_B. Cut 4 opens on cut 3's f94 (edit frames 605 -> 699). */
export const CUT3 = { S0: 0, DURATION: 97 } as const;
export const CUT4 = { S0: 94, DURATION: 140 } as const;

/** Word onsets on S_B (cut 3 frames as given; cut 4 frames + 94). */
export const W = {
  these: 0,
  multiples: 3,
  are: 15,
  actually: 33,
  onThe: 45,
  conservative: 62,
  side: 71,
  end3: 81,
  when: 94,
  you: 100,
  look: 103,
  atThe: 107,
  valuations: 116,
  ofThe: 129,
  us: 138,
  teams: 154,
  you2: 170,
  have: 173,
  fundamentals: 177,
  for: 189,
  some: 196,
  ofThe2: 200,
  teams2: 206,
  end4: 218,
} as const;

// --- Mercedes ------------------------------------------------------------------------
/** The slice's LOWER edge: where Mercedes' valuation column stands. */
export const MERC_BASE = TILE_TOP - NOW_REV_PX + NOW_SLICE_PX; // 1092
export const MERC_VAL_B = 6.0; // the Kurtz deal, Nov 2025 ($5.97B)
export const MERC_COL_H = MERC_VAL_B * PX_PER_B; // 960

// THE STRETCH: m runs 1 -> MULTIPLE on one smoothstep over [STRETCH_S0, STRETCH_S1].
// Its start is before f0, so the copy is already separating from the slice on
// the first frame and still slow; it lands 4 f before "conservative".
// The ease is smoothstep(u^STRETCH_WARP): slow off the slice, fastest just past
// mid-way, decelerating into 20 with zero slope. The warp evens out the top's
// path on screen — at k 2.1 an early rush would outrun the camera, which then
// has to bring the top back down; at 1.35 the counter only ever rises on
// screen (measured: 606 -> 483 -> 464 -> 384 at S 0/20/40/64).
export const STRETCH_S0 = -6;
export const STRETCH_S1 = 58;
export const STRETCH_WARP = 1.35;
export const STRETCH_SETTLE_F = 6;
export const STRETCH_OVER = 3.4; // world px past $6B and back (~3 screen px at k 0.85)
export const mercM = (S: number) =>
  1 + (MULTIPLE - 1) * smoothstep(Math.pow(clamp01((S - STRETCH_S0) / (STRETCH_S1 - STRETCH_S0)), STRETCH_WARP));
/** Height of the stretched copy (= Mercedes' valuation column while it grows). */
export const mercH = (S: number) =>
  NOW_SLICE_PX * mercM(S) + settleBump(S - STRETCH_S1, STRETCH_SETTLE_F, STRETCH_OVER);
export const mercTop = (S: number) => MERC_BASE - mercH(S);
/** The counter: the number of slice-heights the top has passed (hard ticks). */
export const counterN = (S: number) => Math.max(1, Math.min(MULTIPLE, Math.floor(mercM(S) + 1e-6)));

export const SIX_B_IN_S = 52; // "$6B" slides up from here and lands on S 64
export const SIX_B_LAND_S = SIX_B_IN_S + 12;
export const CLICK_F = 3; // HALF_STEP frames on "$6B"'s arrival: the one click of cut 3
export const MERC_OUTLINE_S = 56; // the outline eases INK_LO -> INK_HI as the column completes
export const ROLE_S = 0; // "30%" eases to INK_LO as the stretch starts
export const CTX_S = 98; // cut 4 f4: Mercedes' labels exit / ease to INK_LO

// The readouts at the column's top, centred on it — cut 1's grammar (a readout
// rides the top of whatever is growing, "$1B" over "revenue"): the counter rides
// just above the stretch's top at "revenue"'s gap, "$6B" stacks over it at the
// row gap. Centred, so the pair still fits between the neighbouring US columns
// in cut 4's wide.
export const topStack = (S: number, k: number) => {
  const fn = typeSize("num", k);
  const counterY = mercTop(S) - sz(NOW_GAP_BAR_PX, k);
  const sixY = counterY - SOHNE.fig * fn - sz(NOW_GAP_ROW_PX, k) - SOHNE.dollarDesc * fn;
  return { counterY, sixY, fn, top: sixY - SOHNE.dollarTop * fn };
};

// "revenue" and "$1B" stand in the stretch's path (centred above the bar). The
// pair exits as one group the frame the rising top reaches the stack's foot
// ("revenue"'s baseline) — the mechanism moves them — BEHIND the glass, which
// passes in front of them as they go.
const reachS = (y: number) => {
  for (let S = STRETCH_S0; S <= STRETCH_S1; S += 0.25) if (mercTop(S) <= y) return S;
  return STRETCH_S1;
};
const L_OPEN = nowLabelLayout(2.0);
export const REVENUE_EXIT_S = Math.max(0, reachS(L_OPEN.revenue.y));
export const BILLION_EXIT_S = REVENUE_EXIT_S;
// The counter appears once it rides clear of "$1B"'s ink (so the two never
// overlap), and ticks on from whatever multiple the top has reached.
export const COUNTER_IN_S = (() => {
  for (let S = 0; S <= STRETCH_S1; S++) if (topStack(S, 2.0).counterY <= L_OPEN.top) return S;
  return STRETCH_S1;
})();

// --- the US teams (cut 4) --------------------------------------------------------------
export type UsTeam = {
  x: number;
  sport: SportName;
  rev: number; // $B
  profit: number; // $B
  val: number; // $B
  fill: number; // profit x 20 / valuation, as data.md tabulates it
};
export const US_TEAMS: UsTeam[] = [
  { x: 180, sport: "BASEBALL", rev: 0.7, profit: 0.152, val: 8.5, fill: 0.36 },
  { x: 360, sport: "BASKETBALL", rev: 0.8, profit: 0.3, val: 6.5, fill: 0.92 },
  { x: 720, sport: "FOOTBALL", rev: 0.45, profit: 0.075, val: 7.5, fill: 0.2 },
  { x: 900, sport: "FOOTBALL", rev: 1.1, profit: 0.45, val: 9.0, fill: 1.0 },
];
export const usGeom = (t: UsTeam) => {
  const barH = t.rev * PX_PER_B;
  const sliceH = t.profit * PX_PER_B;
  const colH = t.val * PX_PER_B;
  return { barH, sliceH, colH, base: TILE_TOP - barH + sliceH, fundH: sliceH * MULTIPLE };
};
/** The wave outward from Mercedes: 0 for the inner pair, 1 for the outer pair. */
export const ring = (t: UsTeam) => Math.round(Math.abs(t.x - X_NOW) / 180) - 1;

export const TILE_IN_S = 98; // f4
export const TILE_IN_F = 13;
export const TILE_WAVE = 3;
export const BAR_IN_S = 104; // f10
export const BAR_IN_F = 15;
export const COL_IN_S = 114; // f20
export const COL_WAVE = 3;
export const COL_F_MAX = 36; // the tallest ($9B) rises f23 -> f59, through "US teams" (f44-60)
export const COL_SETTLE_F = 6;
export const COL_OVER = 3.5; // world px
export const FILL_IN_S = 170; // f76, "you"
export const FILL_WAVE = 2;
export const FILL_F = 34; // lands f110-112, on "of the teams"
export const OUTLINE_AT = 0.9; // a column counts as backed once its fill passes 90 % of it

const H_MAX = Math.max(...US_TEAMS.map((t) => usGeom(t).colH));
export const colStart = (t: UsTeam) => COL_IN_S + COL_WAVE * ring(t);
export const colDur = (t: UsTeam) => Math.round(COL_F_MAX * Math.sqrt(usGeom(t).colH / H_MAX));
export const fillStart = (t: UsTeam) => FILL_IN_S + FILL_WAVE * ring(t);

export const usTileLift = (t: UsTeam, S: number) => clamp01((S - (TILE_IN_S + TILE_WAVE * ring(t))) / TILE_IN_F);
export const usBarH = (t: UsTeam, S: number) =>
  usGeom(t).barH * smoothstep((S - (BAR_IN_S + TILE_WAVE * ring(t))) / BAR_IN_F);
export const usColH = (t: UsTeam, S: number) => {
  const g = usGeom(t);
  const t0 = colStart(t);
  const d = colDur(t);
  return g.colH * smoothstep((S - t0) / d) + settleBump(S - t0 - d, COL_SETTLE_F, COL_OVER);
};
export const usFillM = (t: UsTeam, S: number) => 1 + (MULTIPLE - 1) * smoothstep((S - fillStart(t)) / FILL_F);
export const usFillH = (t: UsTeam, S: number) => (S < fillStart(t) ? 0 : usGeom(t).sliceH * usFillM(t, S));
/** The frame a fill passes OUTLINE_AT of its column, or null if it never does. */
export const outlineS = (t: UsTeam): number | null => {
  const g = usGeom(t);
  for (let S = fillStart(t); S <= fillStart(t) + FILL_F; S += 0.25)
    if (usFillH(t, S) >= OUTLINE_AT * g.colH) return Math.round(S);
  return null;
};

// --- the camera: ONE monotone pull-back, four superposed glides on S_B -------------------
// `look` is the content centre; cameraTrack lifts it by CAM_LIFT / k so the
// content sits at screen y ~835, above the captions.
// OPEN: cut 1's resolved camera, CAM_NOW_END (a camera CENTRE), as a look.
export const CAM_OPEN = { x: CAM_NOW_END.x, y: CAM_NOW_END.y - CAM_LIFT / CAM_NOW_END.k, k: CAM_NOW_END.k };
// THE LANDING, solved from the picture rather than typed: the widest-in k (and
// its look) at which the whole column — the tile's contact shadow up to the top
// of "$6B" — fills the band from PAD_TOP to FOOT_MAX on screen.
export const PAD_TOP = 306; // the padding box's top (300) + a margin
export const FOOT_MAX = 1394; // subject ink stays above 1400
export const FOOT_Y = GROUND_Y + 9; // contact ellipse (cy + 1, ry 5) + its 3 px blur
export const LAND = (() => {
  const top = (k: number) => topStack(STRETCH_S1 + STRETCH_SETTLE_F, k).top;
  let k = 1.2;
  while ((FOOT_Y - top(k)) * k > FOOT_MAX - PAD_TOP) k -= 0.0005;
  return { k, look: top(k) + (835 - PAD_TOP) / k };
})();
export const GLIDES_B: Glide[] = [
  // G1 the ride, as two superposed glides: the zoom LEADS (so the tiles' foot
  // never drops under the captions while the look climbs) and the tilt follows,
  // riding the stretch's top up to the landing
  { f0: 0, f1: 48, k: LAND.k - 0.005, warp: 0.8 },
  { f0: 4, f1: 50, dx: X_NOW - CAM_OPEN.x, dy: LAND.look - CAM_OPEN.y, warp: 1.1 },
  // G2 the slow pull-back that carries through the landing and across the join
  { f0: 44, f1: 140, dy: -70, k: LAND.k - 0.08, warp: 1 },
  // G3 the reveal, reacting to the US valuations as they rise past the frame:
  // again the zoom leads and the tilt follows, so the tiles' foot holds
  { f0: 114, f1: 166, k: 0.665, warp: 0.9 },
  { f0: 116, f1: 168, dy: -80, warp: 1 },
  // G4 the creep through the breath, the fills and the tail, still easing out
  // on the last frame (it lands at S 250, past the cut)
  { f0: 148, f1: 250, dy: -70, k: 0.64, warp: 1 },
];
export const CAM_B: Cam[] = cameraTrack(CAM_OPEN, GLIDES_B, S_END + 2);
export const camB = (S: number) => CAM_B[Math.max(0, Math.min(CAM_B.length - 1, Math.round(S)))];
export const lookOf = (c: Cam) => ({ x: c.x, y: c.y - CAM_LIFT / c.k });

// --- the scene --------------------------------------------------------------------------
export const ActBScene: React.FC<{ S: number }> = ({ S }) => {
  const cam = camB(S);
  const k = cam.k;

  // Mercedes' stretch (cut 3) — the column and its fill grow together.
  const mH = mercH(S);
  const mercOutline = rung(S, MERC_OUTLINE_S, INK_LO, INK_HI);

  // the now column's labels: "30%"/"profit" stay with NowColumn; "$1B" and
  // "revenue" are drawn here, under the glass, at NowColumn's own positions
  const exitAt = (s0: number) => 1 - clamp01((S - s0) / 12);
  const L = nowLabelLayout(k);
  const nowLabels = {
    billion: { enter: 0 },
    revenue: { enter: 0 },
    thirty: { enter: exitAt(CTX_S), opacity: rung(S, ROLE_S, 1, INK_LO) },
    profit: { enter: exitAt(CTX_S) },
  };
  const billionIn = exitAt(BILLION_EXIT_S);
  const revenueIn = exitAt(REVENUE_EXIT_S);

  // the readouts at the column's top
  const st = topStack(S, k);
  const ctx = rung(S, CTX_S, INK_HI, INK_LO);
  const counterIn = clamp01((S - COUNTER_IN_S) / 12);
  const sixIn = clamp01((S - SIX_B_IN_S) / 12);
  const sixColor = S >= SIX_B_LAND_S && S < SIX_B_LAND_S + CLICK_F ? HALF_STEP : INK;

  return (
    <KraftStage S={S} cam={cam} rest={CAM_B[0]}>
      {/* 0. "$1B" over "revenue" as cut 1 left them, leaving as the stretch reaches them */}
      {billionIn > 0 ? (
        <Readout x={L.billion.x} y={L.billion.y} text="$1B" kind="num" k={k} enter={billionIn} opacity={INK_HI} />
      ) : null}
      {revenueIn > 0 ? (
        <Readout x={L.revenue.x} y={L.revenue.y} text="revenue" kind="word" k={k} enter={revenueIn} opacity={INK_LO} />
      ) : null}

      {/* 1. every valuation column and its fundamentals, BEHIND the bars and
             slices (a column stands on its slice's lower edge, so its first
             unit is the slice itself, hidden under it). The fill is drawn
             first, the column's glass and outline over it. */}
      {US_TEAMS.map((t) => {
        const g = usGeom(t);
        const colH = usColH(t, S);
        const fillH = Math.min(usFillH(t, S), colH);
        const oS = outlineS(t);
        const outline = oS === null ? INK_LO : rung(S, oS, INK_LO, INK_HI);
        return (
          <g key={`col${t.x}`}>
            <FundamentalsFill x={t.x} baseY={g.base} h={fillH} unit={g.sliceH} k={k} />
            <ValuationColumn x={t.x} baseY={g.base} h={colH} k={k} outlineOpacity={outline} />
          </g>
        );
      })}
      <FundamentalsFill x={X_NOW} baseY={MERC_BASE} h={mH} unit={NOW_SLICE_PX} k={k} />
      <ValuationColumn x={X_NOW} baseY={MERC_BASE} h={mH} k={k} outlineOpacity={mercOutline} />

      {/* 2. the US teams: tile, white revenue bar, amber profit slice */}
      {US_TEAMS.map((t) => {
        const g = usGeom(t);
        const e = usTileLift(t, S);
        if (e <= 0) return null;
        const lift = ((1 - easeOut(e)) * ENTER_LIFT_PX) / k;
        const barH = usBarH(t, S);
        return (
          <g key={`team${t.x}`}>
            <g opacity={easeOut(e)}>
              <SportTile x={t.x} y={GROUND_Y + lift} k={k} sport={t.sport} />
            </g>
            <MoneyBar x={t.x} baseY={TILE_TOP} h={barH} k={k} />
            <ProfitSlice x={t.x} topY={TILE_TOP - barH} h={Math.min(g.sliceH, barH)} />
          </g>
        );
      })}

      {/* 3. Mercedes "now": tile, bar, slice and its four labels */}
      <NowColumn k={k} labels={nowLabels} />

      {/* 4. the counter riding the column's top, "$6B" stacked over it */}
      <Readout x={X_NOW} y={st.counterY} text={`${counterN(S)}×`} kind="num" k={k} enter={counterIn} color={ACCENT} opacity={ctx} />
      <Readout x={X_NOW} y={st.sixY} text="$6B" kind="num" k={k} enter={sixIn} color={sixColor} opacity={ctx} />
    </KraftStage>
  );
};

// --- load-time assertions: the data, the joins and the beats ---------------------------------
const fail = (m: string) => {
  throw new Error(`wolffActB: ${m}`);
};
if (MULTIPLE * NOW_SLICE_PX !== MERC_COL_H) fail(`20 x the slice (${MULTIPLE * NOW_SLICE_PX}) is not $6B (${MERC_COL_H})`);
for (const t of US_TEAMS) {
  const g = usGeom(t);
  if (Math.abs(g.fundH / g.colH - t.fill) > 0.006) fail(`team at x ${t.x}: x20 fills ${(g.fundH / g.colH).toFixed(3)}, data.md says ${t.fill}`);
  if (TILE / 2 + 60 > Math.min(t.x, 1080 - t.x)) fail(`team at x ${t.x} is too close to the side`);
}
if (CUT4.S0 + CUT4.DURATION - 1 !== S_END) fail("cut 4 does not end on S_END");
if (CUT3.S0 + CUT3.DURATION - 1 < CUT4.S0 + 2) fail("cut 3's last three frames are not cut 4's first three");
if (W.conservative - STRETCH_S1 < 4 || W.conservative - STRETCH_S1 > 10) fail("the stretch does not land 4-10 f before 'conservative'");
if (Math.abs(mercH(STRETCH_S1 + STRETCH_SETTLE_F) - MERC_COL_H) > 1e-6) fail("the stretch does not end on $6B");
if (counterN(STRETCH_S1) !== MULTIPLE) fail("the counter does not read 20x on landing");
if (ADVANCE_EM["20×@num"] === undefined || ADVANCE_EM["$6B@num"] === undefined) fail("missing advance widths");
// The camera keeps the caption band and the padding box (screen y, sway included):
const scrY = (S: number, y: number) => toScreen(camB(S), X_NOW, y).y + sway(S).dy;
for (let S = 0; S <= S_END; S++) {
  if (scrY(S, FOOT_Y) > 1400) fail(`S${S}: the tiles' foot is at screen y ${scrY(S, FOOT_Y).toFixed(0)} (> 1400)`);
}
for (let S = STRETCH_S1; S <= CUT3.S0 + CUT3.DURATION - 1; S++) {
  const t = scrY(S, topStack(S, camB(S).k).top);
  if (t < 300) fail(`S${S}: "$6B" tops out at screen y ${t.toFixed(0)} (< 300) on cut 3's resolved frames`);
}
const TALL = US_TEAMS.reduce((a, b) => (usGeom(b).colH + (TILE_TOP - usGeom(b).base) > usGeom(a).colH + (TILE_TOP - usGeom(a).base) ? b : a));
for (let S = W.teams2 - 1; S <= S_END; S++) {
  const t = toScreen(camB(S), TALL.x, usGeom(TALL).base - usColH(TALL, S) - 2).y + sway(S).dy;
  if (t < 300) fail(`S${S}: the tallest column top is at screen y ${t.toFixed(0)} (< 300) on cut 4's resolved frames`);
}
