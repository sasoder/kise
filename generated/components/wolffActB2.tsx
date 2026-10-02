import React from "react";
import {
  ACCENT,
  FundamentalsFill,
  GROUND_Y,
  HALF_STEP,
  INK,
  INK_HI,
  INK_LO,
  KraftStage,
  LogoTile,
  MoneyBar,
  NOW_SLICE_PX,
  NowColumn,
  ProfitSlice,
  Readout,
  SportTile,
  TILE,
  TILE_TOP,
  ValuationColumn,
  X_NOW,
  cameraTrack,
  clamp01,
  easeOut,
  ENTER_LIFT_PX,
  rung,
  settleBump,
  smoothstep,
  toScreen,
  type Cam,
  type Glide,
} from "./wolffShared";
import { CAM_LIFT, sway } from "./fieldShared";
import { CRESTS, crestFigure, type CrestId } from "./wolffLogos";
import {
  BILLION_EXIT_S,
  CAM_B,
  CAM_OPEN,
  CLICK_F,
  COL_SETTLE_F,
  COL_OVER,
  COUNTER_IN_S,
  CTX_S,
  CUT4,
  FOOT_Y,
  GLIDES_B,
  MERC_BASE,
  MERC_OUTLINE_S,
  REVENUE_EXIT_S,
  ROLE_S,
  S_END,
  SIX_B_IN_S,
  SIX_B_LAND_S,
  W,
  colStart,
  counterN,
  mercH,
  outlineS,
  topStack,
  usBarH,
  usFillH,
  usGeom,
  usTileLift,
  type UsTeam,
} from "./wolffActB";

// ---------------------------------------------------------------------------
// wolffActB2 — cut 4 V2 of the Toto Wolff "Mercedes F1 financials" clip (Cheeky
// Pint S4E01): the user's revision ("doesn't it make sense to also add logos to
// the 29 graphic?"). Builder B. Act B's world and clock are unchanged (S_B, the
// Mercedes stretch, every phase and its frames come from wolffActB.tsx); V2
// swaps the four anonymous sport-glyph teams for four REAL US teams, drawn with
// their crests (LogoTile, exactly as cut 5 draws them, so the Lakers and the
// Cowboys are the same objects in cuts 4 and 5) and built from their REAL
// Forbes figures. V1 (wolffActB.tsx, SomeHaveFundamentals.tsx) stays as it was
// delivered; cut 3 is untouched.
//
// THE JOIN. V2's f0 is still cut 3's f94 to the pixel: the camera here is V1's
// glide list with only the reveal and the creep re-solved, both starting at S
// 104 or later, so CAM_B2 equals CAM_B bit for bit through S 103 (asserted
// below), and the teams only enter at S 98. Cut 3's last three frames are this
// cut's first three.
//
// LINE: "When you look at the valuations of the US teams, you have fundamentals
// for some of the teams." In 0:29.140, S_B 94-233,
// DURATION = round((34.320 - 29.140) x 24) = 124, + 16 = 140 f.
//
// THE SAME YARDSTICK, SWEPT ACROSS FOUR US TEAMS: their valuations rise tall
// beside Mercedes, then each team's own operating income stretches x20 inside
// its column (Mercedes' own multiple from cut 3), filling one to the top, one
// most of the way, and falling far short in two.
//
// GESTURES -> the word -> S_B (cut 4 frame = S_B - 94). Unchanged from V1
// unless marked V2.
//   Mercedes' "30%"/"profit" exit, "$6B"/"20x" ease to INK_LO -> "when you
//     look" -> S 98-110 (f4-16)
//   the four crest tiles slide up 24 screen px + fade into their slots, one
//     group move as a wave outward from Mercedes (inner S 98, outer S 101,
//     13 f) -> "look at the" -> S 98-114 (f4-20)
//   their revenue bars rise out of the tiles, the amber operating-income slice
//     first (inner S 104, outer S 107, 15 f) -> "valuations" -> f10-28
//   their valuation columns stretch up from the slices' lower edges, inner
//     S 114 / outer S 117; V2: the duration grows with sqrt(height) to
//     COL_F_MAX_V2 = 38 f for the Cowboys' 2,080 px, landing S 155 = f61, on
//     "teams" (60), zero-sloped settle -> "valuations of the US teams"
//   V2 CAMERA, the reveal: it reacts to the columns — the zoom S 104-150 to
//     k 0.495 leads, the tilt S 116-164 follows (the look climbs 400 world px),
//     so the tops stay in frame (the Cowboys' highest is screen y ~229) and the
//     feet stay above the captions -> "of the US teams"
//   breath: the creep (V2: S 140-250, k -> 0.465) carries on -> "teams" -> f61-76
//   THE YARDSTICK: every team's operating income stretched x20 inside its
//     column at once (inner S 170, outer S 172, 34 f, cut 3's ease, rungs at
//     that team's own slice height); Cowboys 97 %, Warriors 74 %, Lakers 34 %,
//     Knicks 20 % -> "you have fundamentals for some" -> S 170-206 (f76-112),
//     landing on "of the teams"
//   the outline of a column whose fill reaches its top eases INK_LO -> INK_HI
//     (V2: only the Cowboys, S 201; the Warriors at 74 % stay INK_LO, "mostly")
//     -> "some ... of the teams"
//   tail: the creep decays -> "teams" + tail -> f112-139
//   No click in this cut.
//
// DATA (out/wolff/briefs/data.md, "Cut 4 V2"): Forbes team pages (NBA list
// calculated Oct 2025; NFL 2025 list) — forbes.com/teams/los-angeles-lakers,
// /golden-state-warriors, /new-york-knicks, /dallas-cowboys. Operating income =
// Forbes' EBITDA-style figure. "x20" is Mercedes' own multiple from cut 3 ($6B /
// $300M). Scale PX_PER_B = 160 world px per $1B, as every cut of the clip.
// ---------------------------------------------------------------------------

/** A V2 team: V1's team record plus who it is. `sport` is only the placeholder
 *  tile drawn if its crest is missing from wolffLogos (as cut 5 does). */
export type UsTeamV2 = UsTeam & { name: string; crest: CrestId };
export const US_TEAMS_V2: UsTeamV2[] = [
  { x: 180, name: "LA Lakers", crest: "LAKERS", sport: "BASKETBALL", rev: 0.551, profit: 0.17, val: 10.0, fill: 0.34 },
  { x: 360, name: "Golden State Warriors", crest: "WARRIORS", sport: "BASKETBALL", rev: 0.88, profit: 0.409, val: 11.0, fill: 0.74 },
  { x: 720, name: "New York Knicks", crest: "KNICKS", sport: "BASKETBALL", rev: 0.532, profit: 0.098, val: 9.75, fill: 0.2 },
  { x: 900, name: "Dallas Cowboys", crest: "COWBOYS", sport: "FOOTBALL", rev: 1.2, profit: 0.629, val: 13.0, fill: 0.97 },
];

// The columns are much taller than V1's (the Cowboys' valuation stands 2,080 px
// above its slice), so the rise is a little longer to keep every top under 45
// screen px/f: duration = COL_F_MAX_V2 x sqrt(height / tallest).
export const COL_F_MAX_V2 = 38;
const H_MAX_V2 = Math.max(...US_TEAMS_V2.map((t) => usGeom(t).colH));
export const colDurV2 = (t: UsTeam) => Math.round(COL_F_MAX_V2 * Math.sqrt(usGeom(t).colH / H_MAX_V2));
export const usColHV2 = (t: UsTeam, S: number) => {
  const g = usGeom(t);
  const t0 = colStart(t);
  const d = colDurV2(t);
  return g.colH * smoothstep((S - t0) / d) + settleBump(S - t0 - d, COL_SETTLE_F, COL_OVER);
};

// --- the camera: V1's list, the reveal and the creep re-solved ---------------------------
// GLIDES_B[0..2] are cut 3's ride (zoom + tilt) and the slow pull-back that
// crosses the join; nothing new starts before S 104, so S <= 103 is V1's camera.
// The landing is solved from the picture: the Cowboys' column top (and its
// outline stroke) inside the padding box from S 205 on, the tiles' contact
// shadows above y 1400, sway included.
export const GLIDES_B2: Glide[] = [
  ...GLIDES_B.slice(0, 3),
  { f0: 104, f1: 150, k: 0.495, warp: 0.85 }, // the reveal's zoom, leading
  { f0: 116, f1: 164, dy: -400, warp: 1 }, // the reveal's tilt, following the tops up
  { f0: 140, f1: 250, dy: -80, k: 0.465, warp: 1 }, // the creep through the breath, the fills and the tail
];
export const CAM_B2: Cam[] = cameraTrack(CAM_OPEN, GLIDES_B2, S_END + 2);
export const camB2 = (S: number) => CAM_B2[Math.max(0, Math.min(CAM_B2.length - 1, Math.round(S)))];
export const lookOf2 = (c: Cam) => ({ x: c.x, y: c.y - CAM_LIFT / c.k });

// --- a crest, exactly as cut 5 draws it ------------------------------------------------
// LogoTile with wolffLogos' crestFigure (the same fit cut 5 uses), at TILE, so
// the Lakers and the Cowboys are the same objects in cuts 4 and 5.
const TeamTile: React.FC<{ t: UsTeamV2; y: number; k: number }> = ({ t, y, k }) => {
  const crest = CRESTS[t.crest];
  return crest ? (
    <LogoTile x={t.x} y={y} k={k} figure={crestFigure(crest, TILE)} />
  ) : (
    <SportTile x={t.x} y={y} k={k} sport={t.sport} />
  );
};

// --- the scene (ActBScene's tree and order, with the V2 cast and camera) -------------------
export const ActB2Scene: React.FC<{ S: number }> = ({ S }) => {
  const cam = camB2(S);
  const k = cam.k;

  const mH = mercH(S);
  const mercOutline = rung(S, MERC_OUTLINE_S, INK_LO, INK_HI);

  const exitAt = (s0: number) => 1 - clamp01((S - s0) / 12);
  const nowLabels = {
    billion: { enter: 0 },
    revenue: { enter: 0 },
    thirty: { enter: exitAt(CTX_S), opacity: rung(S, ROLE_S, 1, INK_LO) },
    profit: { enter: exitAt(CTX_S) },
  };
  // "$1B"/"revenue" left in cut 3 (exit S 2-14); this cut starts at S 94.
  if (S < Math.max(REVENUE_EXIT_S, BILLION_EXIT_S) + 12) throw new Error("ActB2Scene draws cut 4 only (S_B >= 94)");

  const st = topStack(S, k);
  const ctx = rung(S, CTX_S, INK_HI, INK_LO);
  const counterIn = clamp01((S - COUNTER_IN_S) / 12);
  const sixIn = clamp01((S - SIX_B_IN_S) / 12);
  const sixColor = S >= SIX_B_LAND_S && S < SIX_B_LAND_S + CLICK_F ? HALF_STEP : INK;

  return (
    <KraftStage S={S} cam={cam} rest={CAM_B2[0]}>
      {/* 1. every valuation column and its fundamentals, behind the bars and
             slices; the fill first, the column's glass and outline over it */}
      {US_TEAMS_V2.map((t) => {
        const g = usGeom(t);
        const colH = usColHV2(t, S);
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

      {/* 2. the US teams: crest tile, white revenue bar, amber operating-income slice */}
      {US_TEAMS_V2.map((t) => {
        const g = usGeom(t);
        const e = usTileLift(t, S);
        if (e <= 0) return null;
        const lift = ((1 - easeOut(e)) * ENTER_LIFT_PX) / k;
        const barH = usBarH(t, S);
        return (
          <g key={`team${t.x}`}>
            <g opacity={easeOut(e)}>
              <TeamTile t={t} y={GROUND_Y + lift} k={k} />
            </g>
            <MoneyBar x={t.x} baseY={TILE_TOP} h={barH} k={k} />
            <ProfitSlice x={t.x} topY={TILE_TOP - barH} h={Math.min(g.sliceH, barH)} />
          </g>
        );
      })}

      {/* 3. Mercedes "now": tile, bar, slice and its labels */}
      <NowColumn k={k} labels={nowLabels} />

      {/* 4. the counter at the column's top, "$6B" stacked over it */}
      <Readout x={X_NOW} y={st.counterY} text={`${counterN(S)}×`} kind="num" k={k} enter={counterIn} color={ACCENT} opacity={ctx} />
      <Readout x={X_NOW} y={st.sixY} text="$6B" kind="num" k={k} enter={sixIn} color={sixColor} opacity={ctx} />
    </KraftStage>
  );
};

// --- load-time assertions ------------------------------------------------------------------
const fail = (m: string) => {
  throw new Error(`wolffActB2: ${m}`);
};
for (const t of US_TEAMS_V2) {
  const g = usGeom(t);
  if (Math.abs(g.fundH / g.colH - t.fill) > 0.006) fail(`${t.name}: x20 fills ${(g.fundH / g.colH).toFixed(3)}, data.md says ${t.fill}`);
  if (TILE / 2 + 60 > Math.min(t.x, 1080 - t.x)) fail(`${t.name} is too close to the side`);
}
// the join: V2's camera is V1's (cut 3's) to the bit wherever the two cuts overlap
for (let S = 0; S <= 103; S++) {
  const a = CAM_B2[S];
  const b = CAM_B[S];
  if (a.x !== b.x || a.y !== b.y || a.k !== b.k) fail(`S${S}: the camera differs from cut 3's`);
}
if (CUT4.S0 + CUT4.DURATION - 1 !== S_END) fail("cut 4 does not end on S_END");
// the outline rule: INK_HI only where the fill reaches its top (the Cowboys), never the Warriors
const reached = US_TEAMS_V2.filter((t) => outlineS(t) !== null).map((t) => t.crest);
if (reached.join() !== "COWBOYS") fail(`outlines going INK_HI: ${reached.join() || "none"} (want COWBOYS only)`);
// caption band and padding box, sway included
const TALL = US_TEAMS_V2.reduce((a, b) => (usGeom(b).base - usGeom(b).colH < usGeom(a).base - usGeom(a).colH ? b : a));
for (let S = CUT4.S0; S <= S_END; S++) {
  const c = camB2(S);
  const dy = sway(S).dy;
  const foot = toScreen(c, X_NOW, FOOT_Y).y + dy;
  if (foot > 1400) fail(`S${S}: the tiles' foot is at screen y ${foot.toFixed(0)} (> 1400)`);
  if (S >= W.teams2 - 1) {
    const top = toScreen(c, TALL.x, usGeom(TALL).base - usColHV2(TALL, S) - 2).y + dy;
    if (top < 300) fail(`S${S}: the tallest column top is at screen y ${top.toFixed(0)} (< 300)`);
    const six = toScreen(c, X_NOW, topStack(S, c.k).top).y + dy;
    if (six < 300 || six > 1350) fail(`S${S}: "$6B" is outside the padding box`);
  }
}
