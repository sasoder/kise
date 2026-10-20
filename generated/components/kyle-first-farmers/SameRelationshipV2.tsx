// ---------------------------------------------------------------------------
// SameRelationshipV2 (kyle-first-farmers, cut 17, cold-review V2; file 17_SameRelationship_V2.mov). Dwarkesh map
// style (styles/dwarkesh-map.md), the umber page with no map. Opaque 1080x1920, 29.97 fps, 181 frames.
// Kit: firstFarmersShared (page, camera, ground) and farmersFigures (the turn-safe cast, the hut), read-only.
// The delivered V1 (SameRelationship.tsx, sameRelationshipState.ts) is untouched.
//
// CHECK LINE: "the first farmers displacing the foragers is staged exactly like the Spaniards meeting the
// Aztecs: the same pair twice."
//
// THE LINE: "foragers that they were taking over from was similar to the relationship the Europeans had to the
// Native Americans, where inadvertently"
// WORD -> FRAME: foragers 3 · that 14 · they 22 · were 29 · taking 36 · over 46 · from 55 · was 67 ·
//   similar 80 · to 87 · the 94 · relationship 96 · the 106 · Europeans 114 · had 121 · to 132 · the 135 ·
//   Native 136 · Americans 143 · where 158 · inadvertently 173.
// DURATION: the slot 17.4508 -> 23.4901 s = 6.0393 s x 29.97 = 181 frames (f0..f180).
//
// THE MOTION: one takeover beat done twice, stacked (r2). Row 1, close (f0-f60, "foragers that they were taking
// over from"): the orange farmer walks in; orange ground and wheat rising stalk by stalk advance with him in a front
// that overtakes him and swallows the hide hut (f0-f58); the cream forager backs away ahead of it (f4-f58), turning
// partly away (f26-f54). From f72 the camera makes ONE eased move out and down (f72-f145) while row 2 rises into
// place under row 1 as a whole row (f86-f128; held below the frame until then): the orange Spaniard walks in with
// his orange ground and Spanish wheat rising in the same front; it swallows the Aztec's maize (~f120) and his
// thatched house on "Native Americans" (f136-f143); the Aztec commoner backs off two steps (f98-f130, the forager's
// stride and rhythm) and turns partly away (f118-f143). The wide fills y 0-1060, a clear gap between the rows; both
// fronts stop at the cream figures' toes. On "inadvertently" both orange men turn back to their own fields
// (f156-f178/180), not looking at the men they displaced. The camera creeps in to the end (24 V2 continues it).
// Cause before effect: each front's tip leads its orange figure and stays short of the cream figure's toes (asserted).
// Orange = the incoming side (the farmers, their ground and wheat; their counterpart the Spaniard and his); cream =
// the foragers and the Aztec, their homes and his maize. No text, no arrows, no germs (24's).
//
// SOURCES: none on screen. Costume: LBK farmer / Mesolithic forager / conquistador / Aztec commoner (farmersFigures).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { add, mix2, mul, norm } from "../kits/maps/stringsMotion";
import { DARK, FPS as CLIP_FPS, GroundLine, INK, LAND, Page, WorldSvg, hash, mixColor, smoothstep, type P2 } from "./firstFarmersShared";
import { HideTent, ORANGE, TurnFarmer, TurnForager, TurnSpaniard, TurnTilmaCommoner, WALK_CYCLE, idle, walkPose, type FigPose, type Ink } from "./farmersFigures";
import {
  SRV2_BAND1,
  SRV2_BAND2,
  SRV2_CAM_END,
  SRV2_COMMONER,
  SRV2_COMMONER_STEP,
  SRV2_COMMONER_STEPS,
  SRV2_CREEP,
  SRV2_END_FRAME,
  SRV2_FARMER,
  SRV2_FORAGER,
  SRV2_FORAGER_STEP,
  SRV2_FRONT_END,
  SRV2_GROUND1,
  SRV2_GROUND2,
  SRV2_GROUND_Y2,
  SRV2_HOUSE,
  SRV2_HUT,
  SRV2_IDLE_SEED,
  SRV2_MAIZE,
  SRV2_ROW2_SLIDE,
  SRV2_SCALE,
  SRV2_SETTLED,
  SRV2_SINK,
  SRV2_SPANIARD,
  SRV2_SPANIARD_DELAY,
  SRV2_WHEAT1,
  SRV2_WHEAT2,
  SRV2_X_CREAM,
  SRV2_X_CREAM0,
  srBaseV2,
  srCamV2,
  srFrontRowV2,
  srRow2SlideV2,
  srSinkV2,
} from "./sameRelationshipStateV2";

export const FPS = CLIP_FPS;
export const DURATION = 181;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ss = (u: number) => smoothstep(Math.max(0, Math.min(1, u)));
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;

// ---------------------------------------------------------------------------
// RISING WHEAT: farmersFigures' WheatField drawing (its stalk, ear and awn shapes), with a FRONT: stalks behind
// it stand full height, stalks within `ramp` of it are rising out of the ground (their height grows from the
// soil, the ear on top from the first), stalks beyond it are not there yet. rows "back" (rows 1..), "front" (row
// 0) or "all", so a hut can stand among the rows.
// ---------------------------------------------------------------------------
export const RisingWheat: React.FC<{ x0: number; front: number; y: number; scale: number; rows?: number; depth?: number; spacing?: number; ramp?: number; g?: number; wind?: number; seed?: number; ink?: Ink; which?: "all" | "back" | "front" }> = ({
  x0,
  front,
  y,
  scale,
  rows = 4,
  depth = 13,
  spacing = 15,
  ramp = 120,
  g = 0,
  wind = 1,
  seed = 0,
  ink = ORANGE,
  which = "all",
}) => {
  const stems: string[] = Array.from({ length: rows }, () => "");
  const ears: string[] = Array.from({ length: rows }, () => "");
  const awns: string[] = Array.from({ length: rows }, () => "");
  for (let r = rows - 1; r >= 0; r--) {
    if ((which === "back" && r === 0) || (which === "front" && r > 0)) continue;
    const rs = 1 - 0.1 * r;
    const ry = y - r * depth * scale;
    const sp = spacing * scale * rs;
    // each row's front lags a little behind the one before it (the rows rise as a wave, front row first)
    const fr = front - r * 22;
    let i = 0;
    for (let x = x0 + sp * hash(r, 841 + seed); x < fr; x += sp * (0.75 + 0.5 * hash(i + r * 1000, 842 + seed)), i++) {
      const rise = ss((fr - x) / ramp);
      if (rise < 0.04) continue;
      const h = (140 + 26 * hash(i + r * 1000, 843 + seed)) * scale * rs * rise;
      const gust = wind * (8 + 14 * Math.max(0, Math.sin(x * 0.006 - g * 0.07))) * scale * rs * rise;
      const lean = ((hash(i + r * 1000, 844 + seed) - 0.5) * 10 * scale + gust + 3 * scale * Math.sin(g * 0.05 + x * 0.02)) * rise;
      const top: P2 = [x + lean, ry - h + Math.abs(lean) * 0.25];
      const mid: P2 = [x + lean * 0.25, ry - h * 0.55];
      stems[r] += `M${x.toFixed(1)},${ry.toFixed(1)}Q${mid[0].toFixed(1)},${mid[1].toFixed(1)} ${top[0].toFixed(1)},${top[1].toFixed(1)}`;
      const es = 0.55 + 0.45 * rise;
      const d = norm([lean * 0.7 + 4 * scale, -Math.max(h, 40 * scale) * 0.35]);
      const el = 30 * scale * rs * es;
      const ew = 5.2 * scale * rs * es;
      const e0 = top;
      const e1: P2 = [top[0] + d[0] * el + 3 * scale * es, top[1] + d[1] * el + 6 * scale * rs * es];
      const nn: P2 = [-d[1], d[0]];
      const m1 = mix2(e0, e1, 0.45);
      ears[r] += `M${P(e0)}Q${P(add(m1, mul(nn, ew)))} ${P(e1)}Q${P(add(m1, mul(nn, -ew)))} ${P(e0)}Z`;
      awns[r] += `M${P(mix2(e0, e1, 0.7))}l${P(add(mul(d, 14 * scale * rs * es), mul(nn, 5 * scale * es)))}M${P(mix2(e0, e1, 0.85))}l${P(add(mul(d, 15 * scale * rs * es), mul(nn, -4 * scale * es)))}`;
    }
  }
  const w = (v: number) => Math.max(0.6, v * scale);
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: rows }, (_, i) => rows - 1 - i).map((r) => {
        const rt = 1 - 0.16 * r;
        const main = mixColor(LAND, ink.main, rt);
        const deep = mixColor(LAND, ink.deep, rt);
        return stems[r] ? (
          <g key={r}>
            <path d={stems[r]} fill="none" stroke={DARK} strokeWidth={w(4.2)} strokeOpacity={0.9} />
            <path d={stems[r]} fill="none" stroke={deep} strokeWidth={w(1.8)} />
            <path d={awns[r]} fill="none" stroke={DARK} strokeWidth={w(1.2)} strokeOpacity={0.6} />
            <path d={ears[r]} fill={main} stroke={DARK} strokeWidth={w(1.7)} />
          </g>
        ) : null;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// ORANGE GROUND: the incoming side's ground. Behind the ground line, a strip of ground in depth (`back` world px
// deep) ploughed into orange furrows over an orange hatch; on the line itself, the line turned orange; under it a
// shallow hatched band (`depth`). All of it runs from x0 to one crisp front (the style's "territory gained": orange
// hatch, crisp travelling front). Draw it after the GroundLine and before the figures.
// ---------------------------------------------------------------------------
export const OrangeGround: React.FC<{ x0: number; front: number; y: number; depth?: number; back?: number; uid: string }> = ({ x0, front, y, depth = 18, back = 0, uid }) => {
  if (front <= x0 + 1) return null;
  const below = `M${x0},${y}L${front},${y}L${front - depth * 0.35},${y + depth}L${x0},${y + depth}Z`;
  // the strip behind leans back at the front like the receding ground (its far edge a little behind the near one)
  const behind = back > 0 ? `M${x0},${y - back}L${front - back * 0.3},${y - back}L${front},${y}L${x0},${y}Z` : "";
  // furrows: receding rows, closer together toward the back, each stopping at the leaning front
  let furrows = "";
  if (back > 0) {
    for (let r = 0; r < 5; r++) {
      const u = (r + 0.6) / 5.4;
      const yy = y - back * (1 - (1 - u) * (1 - u));
      const xf = front - (y - yy) * 0.3;
      if (xf > x0) furrows += `M${x0},${yy.toFixed(1)}L${xf.toFixed(1)},${yy.toFixed(1)}`;
    }
  }
  return (
    <g>
      <defs>
        <pattern id={`${uid}-h`} patternUnits="userSpaceOnUse" width={9} height={9} patternTransform="rotate(45)">
          <line x1={0} y1={4.5} x2={9} y2={4.5} stroke={ORANGE.deep} strokeWidth={2.6} />
        </pattern>
      </defs>
      {behind ? (
        <>
          <path d={behind} fill={mixColor(LAND, ORANGE.deep, 0.3)} />
          <path d={behind} fill={`url(#${uid}-h)`} opacity={0.7} />
          <path d={furrows} fill="none" stroke={DARK} strokeWidth={5.4} strokeOpacity={0.55} strokeLinecap="round" />
          <path d={furrows} fill="none" stroke={ORANGE.main} strokeWidth={2.6} strokeLinecap="round" />
          <path d={`M${front - back * 0.3},${y - back}L${front},${y}`} stroke={ORANGE.main} strokeWidth={2.4} strokeLinecap="round" />
        </>
      ) : null}
      <path d={below} fill={mixColor(LAND, ORANGE.deep, 0.22)} />
      <path d={below} fill={`url(#${uid}-h)`} opacity={0.85} />
      <path d={`M${x0},${y}L${front},${y}`} stroke={DARK} strokeWidth={6.4} strokeOpacity={0.7} strokeLinecap="round" />
      <path d={`M${x0},${y}L${front},${y}`} stroke={ORANGE.main} strokeWidth={3.8} strokeLinecap="round" />
      <path d={`M${front},${y}L${front - depth * 0.35},${y + depth}`} stroke={ORANGE.main} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE AZTEC'S HOME: a small thatched house (a calli: adobe walls, a doorway, a steep thatched roof), drawn like the
// forager's hut (dark umber planes in cream line, at a scale that sets it a little back), and his young MAIZE.
// at = the middle of the base, scale = px per unit (the house is ~330 units to the ridge, like the hut).
// ---------------------------------------------------------------------------
const PLANE = "#2A2119";
const PLANE_LIT = "#352A1F";
export const AztecHouse: React.FC<{ at: P2; scale: number; uid: string }> = ({ at, scale, uid }) => {
  const W = 170;
  const wallH = 165;
  const eave = -wallH + 6;
  const ridge = -330;
  const over = 34;
  const ROOF = `M${-W - over},${eave}L${-62},${ridge}L${62},${ridge}L${W + over},${eave}Q0,${eave + 12} ${-W - over},${eave}Z`;
  const st = (w = 2.6, a = 1) => ({ fill: "none", stroke: INK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
  // thatch: strokes from the ridge down to the eave, a little ragged at the bottom
  let thatch = "";
  for (let i = 0; i <= 22; i++) {
    const u = i / 22;
    const xt = -62 + 124 * u;
    const xb = -W - over + (2 * (W + over)) * u;
    const yb = eave + 6 * Math.sin(u * Math.PI) + 6 * hash(i, 951);
    thatch += `M${xt.toFixed(1)},${ridge + 4}L${xb.toFixed(1)},${yb.toFixed(1)}`;
  }
  const bands = [0.38, 0.7].map((v) => `M${(-62 - (W + over - 62) * v).toFixed(1)},${(ridge + (eave - ridge) * v).toFixed(1)}L${(62 + (W + over - 62) * v).toFixed(1)},${(ridge + (eave - ridge) * v).toFixed(1)}`).join("");
  // adobe courses on the wall
  let adobe = "";
  for (let r = 1; r < 6; r++) {
    const y = -r * (wallH / 6);
    adobe += `M${-W + 4},${y.toFixed(1)}L${W - 4},${y.toFixed(1)}`;
    for (let x = -W + ((r % 2) * 22 + 18); x < W - 10; x += 44) adobe += `M${x.toFixed(1)},${y.toFixed(1)}l0,${(wallH / 6).toFixed(1)}`;
  }
  const dx = -50;
  const DOOR = `M${dx - 30},0L${dx - 30},-112L${dx + 30},-112L${dx + 30},0Z`;
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`}>
      <clipPath id={`${uid}-w`}>
        <rect x={-W} y={-wallH} width={2 * W} height={wallH} />
      </clipPath>
      <rect x={-W} y={-wallH} width={2 * W} height={wallH} fill={PLANE} stroke={DARK} strokeWidth={8} />
      <g clipPath={`url(#${uid}-w)`}>
        <path d={adobe} {...st(1.4, 0.32)} />
      </g>
      <rect x={-W} y={-wallH} width={2 * W} height={wallH} {...st(3)} />
      <path d={DOOR} fill="#140F0A" stroke={INK} strokeWidth={2.6} />
      <path d={ROOF} fill={PLANE_LIT} stroke={DARK} strokeWidth={8} strokeLinejoin="round" />
      <clipPath id={`${uid}-r`}>
        <path d={ROOF} />
      </clipPath>
      <g clipPath={`url(#${uid}-r)`}>
        <path d={thatch} {...st(1.6, 0.6)} />
        <path d={bands} fill="none" stroke={DARK} strokeWidth={6} />
        <path d={bands} {...st(2.4, 0.9)} />
      </g>
      <path d={ROOF} {...st(3)} />
    </g>
  );
};
/** young maize, cream: a stalk with long arching leaves, a tassel, on some a husked ear; g = the wind */
export const Maize: React.FC<{ x0: number; x1: number; y: number; scale: number; g?: number; seed?: number }> = ({ x0, x1, y, scale, g = 0, seed = 0 }) => {
  let stalks = "";
  let leaves = "";
  let tassels = "";
  let ears = "";
  let i = 0;
  for (let x = x0 + 20 * hash(seed, 961); x < x1; x += 58 * (0.8 + 0.4 * hash(i, 962 + seed)), i++) {
    const h = (150 + 40 * hash(i, 963 + seed)) * scale;
    const sway = (4 + 3 * Math.sin(g * 0.05 + x * 0.03)) * scale;
    const top: P2 = [x + sway, y - h];
    stalks += `M${x.toFixed(1)},${y}Q${(x + sway * 0.3).toFixed(1)},${(y - h * 0.5).toFixed(1)} ${top[0].toFixed(1)},${top[1].toFixed(1)}`;
    for (let j = 0; j < 5; j++) {
      const v = 0.22 + j * 0.15;
      const px = x + sway * v * v;
      const py = y - h * v;
      const side = (j + i) % 2 === 0 ? 1 : -1;
      const L = (62 - j * 7) * scale;
      const droop = (18 + 10 * hash(i * 7 + j, 964)) * scale;
      leaves += `M${px.toFixed(1)},${py.toFixed(1)}Q${(px + side * L * 0.55).toFixed(1)},${(py - L * 0.38).toFixed(1)} ${(px + side * L).toFixed(1)},${(py + droop - L * 0.12).toFixed(1)}`;
    }
    tassels += [-0.5, 0, 0.5].map((a) => `M${top[0].toFixed(1)},${top[1].toFixed(1)}l${(a * 14 * scale).toFixed(1)},${(-18 * scale).toFixed(1)}`).join("");
    if (hash(i, 965 + seed) > 0.4) {
      const ey = y - h * 0.48;
      ears += `M${(x + 2).toFixed(1)},${ey.toFixed(1)}q${(9 * scale).toFixed(1)},${(-10 * scale).toFixed(1)} ${(6 * scale).toFixed(1)},${(-30 * scale).toFixed(1)}q${(-7 * scale).toFixed(1)},${(8 * scale).toFixed(1)} ${(-6 * scale).toFixed(1)},${(30 * scale).toFixed(1)}Z`;
    }
  }
  const cream = mixColor(LAND, INK, 0.82);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={stalks + leaves + tassels} stroke={DARK} strokeWidth={5.4 * scale} strokeOpacity={0.85} />
      <path d={stalks} stroke={cream} strokeWidth={2.6 * scale} />
      <path d={leaves} stroke={cream} strokeWidth={2.2 * scale} />
      <path d={tassels} stroke={cream} strokeWidth={1.6 * scale} />
      <path d={ears} fill={cream} stroke={DARK} strokeWidth={1.8 * scale} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WALKS (as V1): a speed profile v(f); position and walk phase both its integral (no foot slide); the phase
// is offset so each walk ends with the feet under him. Row 2 runs the same profiles SRV2_ROW2_DELAY later.
// ---------------------------------------------------------------------------
type Walk = { x: number[]; ph: number[]; amt: number[] };
const integral = (v: (f: number) => number) => {
  const s: number[] = [0];
  for (let f = 1; f <= DURATION; f++) s.push(s[f - 1] + v(f - 0.5));
  return s;
};
const makeWalk = (v: (f: number) => number, xEnd: number, stride: number, phaseSign: 1 | -1): Walk => {
  const adv = (2 * stride * SRV2_SCALE) / WALK_CYCLE;
  const s = integral(v);
  const total = s[DURATION];
  const endPh = (phaseSign * total) / WALK_CYCLE;
  const ph0 = 0.25 - (endPh - Math.floor(endPh));
  return { x: s.map((si) => xEnd - adv * (total - si)), ph: s.map((si) => ph0 + (phaseSign * si) / WALK_CYCLE), amt: s.map((_, f) => Math.min(1, 2.2 * v(f))) };
};
const legsOver = (base: FigPose, w: Walk, f: number, stride: number): FigPose => {
  const q = walkPose(base, w.ph[f], w.amt[f], stride);
  return { ...q, armL: base.armL, armR: base.armR };
};
const ORANGE_STRIDE = 44;
/** the orange figure: in his stride from before his row's f0, slows and stops by ~f47 of it */
const vOrange = (f: number) => 1 - ss((f - 33) / 14);
const farmerWalk = makeWalk(vOrange, SRV2_FARMER.at[0], ORANGE_STRIDE, 1);
const spaniardWalk = makeWalk((f) => vOrange(f - SRV2_SPANIARD_DELAY), SRV2_SPANIARD.at[0], ORANGE_STRIDE, 1);

// the cream figures' retreats: a backing-off (A), a stand, then one clear step back (B) off the ground he lost. Each
// segment is its own walk (its stride solved from its distance), backward (phase running back), feet never sliding.
type Seg = { off: number[]; ph: number[]; amt: number[]; stride: number };
const backSeg = (v: (f: number) => number, dist: number): Seg => {
  const s = integral(v);
  const total = s[DURATION];
  const stride = (dist * WALK_CYCLE) / (2 * SRV2_SCALE * total);
  const endPh = -total / WALK_CYCLE;
  const ph0 = 0.25 - (endPh - Math.floor(endPh));
  return { off: s.map((si) => (dist * si) / total), ph: s.map((si) => ph0 - si / WALK_CYCLE), amt: s.map((_, f) => Math.min(1, 2.2 * v(f))), stride };
};
const bump = (a: number, b: number, rise = 7) => (f: number) => ss((f - a) / rise) * (1 - ss((f - (b - rise)) / rise));
const FORAGER_A = backSeg(bump(4, 38, 8), 200);
const FORAGER_B = backSeg(bump(SRV2_FORAGER_STEP[0], SRV2_FORAGER_STEP[1], 5), SRV2_X_CREAM - SRV2_X_CREAM0 - 200);
const COMMONER_X0 = SRV2_X_CREAM - 170;
const COMMONER_A = backSeg(bump(SRV2_COMMONER_STEPS[0], SRV2_COMMONER_STEPS[1], 7), 100);
const COMMONER_B = backSeg(bump(SRV2_COMMONER_STEP[0], SRV2_COMMONER_STEP[1], 4), 70);
const creamX = (x0: number, a: Seg, b: Seg, f: number) => x0 + a.off[f] + b.off[f];
const creamLegs = (base: FigPose, a: Seg, b: Seg, f: number): FigPose => {
  const w = b.amt[f] > 0 ? b : a.amt[f] > 0 ? a : null;
  if (!w) return base;
  const q = walkPose(base, w.ph[f], w.amt[f], w.stride);
  return { ...q, armL: base.armL, armR: base.armR };
};

// ---------------------------------------------------------------------------
// THE CHECKS (module load)
// ---------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`SameRelationshipV2: ${m}`);
  };
  if (Math.abs(farmerWalk.x[SRV2_SETTLED] - SRV2_FARMER.at[0]) > 0.05 || farmerWalk.amt[SRV2_SETTLED] > 1e-6) fail("farmer still walking");
  if (Math.abs(spaniardWalk.x[SRV2_SETTLED] - SRV2_SPANIARD.at[0]) > 0.05 || spaniardWalk.amt[SRV2_SETTLED] > 1e-6) fail("spaniard still walking");
  if (Math.abs(creamX(SRV2_X_CREAM0, FORAGER_A, FORAGER_B, DURATION) - SRV2_X_CREAM) > 0.05) fail("forager end x");
  if (Math.abs(creamX(COMMONER_X0, COMMONER_A, COMMONER_B, DURATION) - SRV2_X_CREAM) > 0.05) fail("commoner end x");
  for (let f = 0; f <= DURATION; f++) {
    // the fronts stay short of the cream figures' toes (~30 world px ahead of their feet)
    if (srFrontRowV2(1, f) > creamX(SRV2_X_CREAM0, FORAGER_A, FORAGER_B, f) - 30) fail(`row 1 front reaches the forager at f${f}`);
    if (srFrontRowV2(2, f) > creamX(COMMONER_X0, COMMONER_A, COMMONER_B, f) - 30) fail(`row 2 front reaches the commoner at f${f}`);
  }
  if (Math.abs(srFrontRowV2(1, SRV2_END_FRAME) - SRV2_FRONT_END) > 1e-6 || Math.abs(srFrontRowV2(2, SRV2_END_FRAME) - SRV2_FRONT_END) > 1e-6) fail("fronts not at the toes");
  if (srRow2SlideV2(SRV2_ROW2_SLIDE[1]) !== 0) fail("row 2 not in place");
  // row 2 only comes into frame once its place is above the caption bands
  const c = srCamV2(SRV2_ROW2_SLIDE[0]);
  if (960 + (SRV2_GROUND_Y2 + 18 - c.y) * c.k > 1080) fail("row 2 would slide in through the caption bands");
  for (let f = 160; f < SRV2_END_FRAME; f++) {
    const r = Math.log(srCamV2(f + 1).k / srCamV2(f).k);
    if (r < SRV2_CREEP * 0.4 || r > SRV2_CREEP * 1.6) fail(`camera creep at f${f} is ${r}`);
  }
  if (srCamV2(SRV2_END_FRAME).x !== SRV2_CAM_END.x) fail("camera end");
}

const orangePose = (who: "farmer" | "spaniard", w: Walk, f: number) => {
  const b = srBaseV2(who, f);
  return idle(w.amt[f] > 0 ? legsOver(b, w, f, ORANGE_STRIDE) : b, f, SRV2_IDLE_SEED[who]);
};
/** a home sinking into the field: lowered by SRV2_SINK x sink, its base clipped at its own base line */
const Sunk: React.FC<{ base: number; sink: number; uid: string; children: React.ReactNode }> = ({ base, sink, uid, children }) => {
  if (sink <= 0.001) return <>{children}</>;
  return (
    <g>
      <clipPath id={`${uid}-sink`}>
        <rect x={-4000} y={-4000} width={8000} height={4000 + base} />
      </clipPath>
      <g clipPath={`url(#${uid}-sink)`}>
        <g transform={`translate(0 ${(SRV2_SINK * sink).toFixed(2)})`}>{children}</g>
      </g>
    </g>
  );
};

const SameRelationshipV2: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = Math.max(0, Math.min(DURATION - 1, frame));
  const cam = srCamV2(f);
  const g = f;
  const front1 = srFrontRowV2(1, f);
  const front2 = srFrontRowV2(2, f);
  const slide = srRow2SlideV2(f);
  const foragerPose = idle(creamLegs(srBaseV2("forager", f), FORAGER_A, FORAGER_B, f), g, SRV2_IDLE_SEED.forager);
  const commonerPose = idle(creamLegs(srBaseV2("commoner", f), COMMONER_A, COMMONER_B, f), g, SRV2_IDLE_SEED.commoner);
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={cam}>
          {/* row 1 */}
          <GroundLine {...SRV2_GROUND1} />
          <OrangeGround {...SRV2_BAND1} front={front1} />
          <RisingWheat {...SRV2_WHEAT1} front={front1} g={g} which="back" />
          <Sunk base={SRV2_HUT.at[1]} sink={srSinkV2(front1)} uid="srv2-hut">
            <HideTent {...SRV2_HUT} />
          </Sunk>
          <RisingWheat {...SRV2_WHEAT1} front={front1} g={g} which="front" />
          <TurnFarmer {...SRV2_FARMER} at={[farmerWalk.x[f], SRV2_FARMER.at[1]]} pose={orangePose("farmer", farmerWalk, f)} />
          <TurnForager {...SRV2_FORAGER} at={[creamX(SRV2_X_CREAM0, FORAGER_A, FORAGER_B, f), SRV2_FORAGER.at[1]]} pose={foragerPose} />
          {/* row 2: off the left edge, then sliding in at its final height (f94-f128) */}
          {(
            <g transform={slide < -0.001 ? `translate(${slide.toFixed(3)} 0)` : undefined}>
              <GroundLine {...SRV2_GROUND2} />
              <OrangeGround {...SRV2_BAND2} front={front2} />
              <RisingWheat {...SRV2_WHEAT2} front={front2} g={g} which="back" />
              <Sunk base={SRV2_HOUSE.at[1]} sink={srSinkV2(front2)} uid="srv2-house">
                <AztecHouse {...SRV2_HOUSE} />
              </Sunk>
              <Maize {...SRV2_MAIZE} g={g} />
              <RisingWheat {...SRV2_WHEAT2} front={front2} g={g} which="front" />
              <TurnSpaniard {...SRV2_SPANIARD} at={[spaniardWalk.x[f], SRV2_SPANIARD.at[1]]} pose={orangePose("spaniard", spaniardWalk, f)} />
              <TurnTilmaCommoner {...SRV2_COMMONER} at={[creamX(COMMONER_X0, COMMONER_A, COMMONER_B, f), SRV2_COMMONER.at[1]]} pose={commonerPose} />
            </g>
          )}
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

export default SameRelationshipV2;
/** the front at the end, for 24 V2 (row 1 and row 2 alike) */
export const SRV2_FRONTS_END = { row1: SRV2_FRONT_END, row2: SRV2_FRONT_END };
export { Sunk };
