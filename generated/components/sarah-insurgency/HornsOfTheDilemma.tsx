// ---------------------------------------------------------------------------
// HornsOfTheDilemma (sarah-insurgency, cut 40). The clip's one-off "Dwarkesh 3D map" look (COMMON.md): the old printed
// China map laid as the floor of the Dwarkesh 3D misty air, wooden wargame pieces standing on it.
// Opaque 1080x1920, 24 fps, 389 frames. RENDER WITH --gl=angle (WebGL2 ground).
//
// CHECK LINE: whichever way Japan moved its troops, the other side gained: massing them at the front left the rear to
// the guerrillas; spreading them back over the rear left the front to the Nationalist army.
//
// THE LINE: "So this puts Japan on the horns of the dilemma. Are you going to concentrate your forces to fight the
// nationalist conventional forces? But if you do that, you're leaving the rear areas open to the guerrillas. Okay, if
// you try to stabilize the rear, then you've got to disperse your forces to go deal with the other problem."
// WORD -> FRAME (f0 = 40.500 s): So -3 · this 2 · puts 8 · JAPAN 13 · on 21 · the 28 · horns 30 · of 36 · the 39 ·
//   DILEMMA 41 · Are 52 · you 54 · going 58 · to 60 · CONCENTRATE 63 · your 74 · forces 81 · to 92 · fight 100 · the 108 ·
//   NATIONALIST 113 · conventional 125 · forces 132 · But 154 · if 161 · you 164 · do 166 · that 171 · you're 179 ·
//   LEAVING 183 · the 190 · REAR 196 · areas 202 · OPEN 214 · to 226 · the 232 · GUERRILLAS 235 · Okay 253 · if 269 ·
//   you 272 · try 274 · to 278 · STABILIZE 281 · the 293 · REAR 300 · then 307 · you've 310 · got 313 · to 315 ·
//   DISPERSE 318 · your 330 · forces 332 · to 342 · go 355 · deal 357 · with 362 · the 366 · other 368 · problem 372 ·
//   (And 386)
// DURATION: the slot 40.500 -> 56.708 s = 16.208 s x 24 = 389 frames (f0..f388). Speaker after.
//
// THE MOTION: one continuous camera, a seesaw front -> rear -> both. f0-63 the whole theatre with a slow drift in,
// looking north-north-east (the front at Changsha near the lens, the North China plain up the frame): Japan's cream
// garrisons at the held towns, the cream Wuhan-front block (Hinomaru), the orange ROC block at Changsha, four pawns
// lurking. Pieces face cut 12's fixed map directions (BLOCK_FACE 162, GARRISON_FACE 160).
// CONCENTRATE (f63): every garrison leaves its town (departures f63-74, staggered so no two share a stretch of line)
// and slides along the lines at constant speed 30 (the Pinghan; the Jinpu -> the Yangtze; then the Yuehan), the
// Wuhan block first (at Yueyang f80); each garrison slides into the back of the block, which grows with every
// arrival (72 -> 170 wide, f87 -> f135); the camera pushes in on the front. The grown block advances on Changsha
// (f114-140), its face touches the orange block's on f128 (the contact) and the orange block is pressed back from
// f129 (first reaction), 28 world px by f140.
// LEAVING THE REAR OPEN (f150-235): the camera pans north over the emptied towns (the cream hold along the lines thins
// as the garrisons leave) while orange pawns rise out of the map, south to north as the camera reaches them (starts
// f166-206, all up by ~f232), round the bare towns and on three railways (the rail broken where a pawn stands).
// STABILIZE / DISPERSE (f280-372): the merge run backwards: the camera pulls back to frame both halves (f235-300); from
// f280 the garrisons slide out of the block's back one after another (2.3 f apart, the farthest town first), the block
// shrinking with each, and file back up the lines (speed 32); the remnant is the Wuhan block again and goes home last
// (f312 -> f330). They reach their towns f339-346; each arrival sinks the pawn by that town (cause: the garrison in
// its last stretch; the pawn's rise run in reverse over 18 f: the map parts, it drops, the map closes). At the
// now-unopposed front the orange ROC block steps forward and grows (120 x 120 -> 150 x 250, f318-366). f366-388: the
// settled wide, the rear thinly held with pawns still lurking between the lines (and on the cut rails), the front
// orange and strong.
// Orange = China (the ROC block, the pawns); cream = Japan (block, garrisons, the held bands). No text, no numbers.
//
// DEPTH: one pinhole (F 1300) on the clip camera (insurgencyCamera.ts), keys KEYS: D 1380 -> 1277 (the theatre filling
// ~87% of the width, Taiyuan to Shanghai) -> 540 (front push-in, f138) -> 1150 (rear, f226) -> 1312 (both, f300) -> 1294;
// pitch 46 -> 34 -> 50 -> 42; yaw 19 -> -6 -> 15 -> 22.5 (north-north-east keeps the front and the rear in one
// vertical column). Fog: fogFor(cam). Pieces (world px): garrisons 62, pawns 72, the cream block 72 -> 170 -> 72
// (square face). Bands: the Wuhan block stands in band 1 until it leaves (f63); the ROC block's plain top reaches
// into band 2 in the wides (its sticker stays below it); pieces in transit cross both.
//
// SOURCES (COMMON.md, WORLD_READY.md): the towns, railways, base areas and the 1939 occupied area are the kit's
// CHINA data (approximate railway courses, city to city). Held towns and lines as cut 12 (pointsAndLinesState.ts).
// Changsha, the Nationalist front (Battles of Changsha 1939, 1941: Japan concentrated its forces from Yueyang).
// SIMPLIFICATION (flagged): the western garrisons ride the whole Pinghan from Xinxiang to Hankou, a stretch Japan did
// not hold in 1939-41 (the eastern ones ride the held Jinpu and the Yangtze); approximate, as a schematic of the move.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Block,
  CHINA,
  Garrison,
  GroundLine,
  HorizonHaze,
  INK,
  InsurgencyStage,
  MapGround3D,
  Pawn,
  WorldLayer,
  blockSpec,
  camTrack,
  dirOfYaw,
  insWorld,
  sortFarToNear,
  type BlockSpec,
  type CamKey,
  type P2,
  type TerritoryLayer,
} from "./insurgencyShared";
import { BANDS, BLOCK_FACE, GARRISONS, GARRISON_FACE, HELD_LINES, WUHAN_AT, WUHAN_W } from "./pointsAndLinesState";

export const FPS = 24;
export const DURATION = 389;
export const schema = z.object({ bands: z.boolean().optional() });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => {
  const v = c01(t);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};

// ===================================================================================================================
// PATHS along the lines
// ===================================================================================================================
type Path = { pts: P2[]; cs: number[]; len: number };
const mkPath = (raw: P2[]): Path => {
  const pts: P2[] = [];
  for (const p of raw) {
    const q = pts[pts.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.01) pts.push(p);
  }
  const cs = [0];
  for (let i = 1; i < pts.length; i++) cs.push(cs[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cs, len: cs[cs.length - 1] };
};
const pathAt = (p: Path, s: number): P2 => {
  const S = Math.max(0, Math.min(p.len, s));
  let lo = 0;
  let hi = p.cs.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (p.cs[m] <= S) lo = m;
    else hi = m;
  }
  const a = p.pts[lo];
  const b = p.pts[hi];
  const q = (S - p.cs[lo]) / Math.max(1e-9, p.cs[hi] - p.cs[lo]);
  return [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q];
};
type Route = { pts: P2[]; stations: Record<string, number> };
/** the part of a route from arclength a to b (b < a: reversed) */
const sub = (r: Route, a: number, b: number): P2[] => {
  const P = mkPath(r.pts);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const out: P2[] = [pathAt(P, lo)];
  for (let i = 0; i < P.pts.length; i++) if (P.cs[i] > lo && P.cs[i] < hi) out.push(P.pts[i]);
  out.push(pathAt(P, hi));
  return a <= b ? out : out.reverse();
};
const st = (r: Route, k: string) => r.stations[k];
const PH = CHINA.RAIL_PINGHAN;
const JP = CHINA.RAIL_JINPU;
const YH = CHINA.RAIL_YUEHAN;
const YZ = CHINA.RIVER_YANGTZE;
const P = CHINA.PLACES;
/** Hankou -> Wuchang (across the river at Wuhan) -> down the Yuehan to Yueyang station */
const WUHAN_TO_YUEYANG: P2[] = sub(YH, 0, st(YH, "yueyang"));
const YUEYANG_ST: P2 = WUHAN_TO_YUEYANG[WUHAN_TO_YUEYANG.length - 1];
const PINGHAN_FROM = (k: string) => [...sub(PH, st(PH, k), st(PH, "hankou")), ...WUHAN_TO_YUEYANG];
const YANGTZE_FROM_NANJING: P2[] = [...sub(YZ, st(YZ, "nanjing"), st(YZ, "wuhan")), ...WUHAN_TO_YUEYANG];
const JINPU_FROM = (k: string) => [...sub(JP, st(JP, k), st(JP, "pukou")), ...YANGTZE_FROM_NANJING];
const HUNING_FROM_SHANGHAI = [...sub(CHINA.RAIL_HUNING, 0, st(CHINA.RAIL_HUNING, "nanjing")), ...YANGTZE_FROM_NANJING];
/** each garrison's way from its town to Yueyang station (the lines it really rides) */
const TO_FRONT: Record<string, P2[]> = {
  beiping: PINGHAN_FROM("beiping"),
  baoding: PINGHAN_FROM("baoding"),
  shijiazhuang: PINGHAN_FROM("shijiazhuang"),
  xinxiang: PINGHAN_FROM("xinxiang"),
  taiyuan: [...sub(CHINA.RAIL_ZHENGTAI, st(CHINA.RAIL_ZHENGTAI, "taiyuan"), 0), ...PINGHAN_FROM("shijiazhuang")],
  kaifeng: [...sub(CHINA.RAIL_LONGHAI, st(CHINA.RAIL_LONGHAI, "kaifeng"), 0), ...PINGHAN_FROM("zhengzhou")],
  tianjin: JINPU_FROM("tianjin"),
  jinan: JINPU_FROM("jinan"),
  xuzhou: JINPU_FROM("xuzhou"),
  qingdao: [...sub(CHINA.RAIL_JIAOJI, st(CHINA.RAIL_JIAOJI, "qingdao"), 0), ...JINPU_FROM("jinan")],
  nanjing: YANGTZE_FROM_NANJING,
  shanghai: HUNING_FROM_SHANGHAI,
  hangzhou: [...sub(CHINA.RAIL_HUHANG, st(CHINA.RAIL_HUHANG, "hangzhou"), 0), ...HUNING_FROM_SHANGHAI],
};
const CORE_TO_FRONT: P2[] = [WUHAN_AT, ...WUHAN_TO_YUEYANG];

/** distance travelled at frame t: from rest at t0, accelerating over ta to v, cruising, easing to a stop over the
 *  last td frames at L (td 0: arrives at speed) */
const travel = (t: number, t0: number, L: number, v: number, ta: number, td: number) => {
  const u = t - t0;
  if (u <= 0) return 0;
  const sa = (v * ta) / 2;
  if (u <= ta) return (v * u * u) / (2 * ta);
  const sd = (v * td) / 2;
  const tc = (L - sa - sd) / v;
  if (u <= ta + tc) return sa + v * (u - ta);
  const w = Math.min(td, u - ta - tc);
  if (td <= 0) return L;
  return Math.min(L, sa + v * tc + v * w - (v * w * w) / (2 * td));
};
const travelEnd = (t0: number, L: number, v: number, ta: number, td: number) => t0 + ta + (L - (v * ta) / 2 - (v * td) / 2) / v + td;

// ===================================================================================================================
// THE PIECES
// ===================================================================================================================
const GS = 62; // garrison size
const FACE = BLOCK_FACE; // the pieces face one fixed map direction, as in cut 12 (blocks 162, garrisons 160)
const PAWN_SIZE = 72;
const W_CORE = WUHAN_W; // 72: the Wuhan-front block (cut 12)
const W_BIG = 170; // the concentrated block
/** the ROC block: at Changsha, facing the lens */
const OR0: P2 = [P.changsha[0] + 6, P.changsha[1] - 8];
const OR_W0 = 120;
const OR_H0 = 120;
const OR_W1 = 150;
const OR_H1 = 250;
/** the concentrated block assembles at Yueyang, then advances on Changsha */
const B0: P2 = [P.yueyang[0] + 14, P.yueyang[1] + 8];
const B_ADV: [number, number] = [114, 140]; // the advance (frames)
const B_ADV_X = 48; // it veers a little east as it advances (keeps the two stickers apart on screen)
const PUSH = 28; // how far the orange block is pressed back
/** the faces' normal (both blocks face FACE): two blocks touch when their centres are (d1 + d2) / 2 apart along it */
const NF = dirOfYaw(FACE);
/** the orange block's centre z when the cream block (centre c, thickness dc) presses it (orange thickness dO) */
const pressedZ = (c: P2, dc: number, dO: number) => c[1] + ((dc + dO) / 2 - (OR0[0] - c[0]) * NF[0]) / NF[2];
/** the cream block's centre z at the end of the advance: it has pressed the orange block PUSH back */
const ADV_TO_Z = OR0[1] + PUSH - ((0.42 * W_BIG + 0.42 * OR_W0) / 2 - (OR0[0] - (B0[0] + B_ADV_X)) * NF[0]) / NF[2];
const advU = (f: number) => easeInOut((f - B_ADV[0]) / (B_ADV[1] - B_ADV[0]));
const bigCentre = (f: number): P2 => {
  const u = advU(f);
  return [B0[0] + B_ADV_X * u, B0[1] + (ADV_TO_Z - B0[1]) * u];
};

// ---- the merge (CONCENTRATE) --------------------------------------------------------------------------------------
const V_IN = 30; // world px / frame on the lines
const TA = 8;
const T_GO = 63; // CONCENTRATE
const GAP = 3; // frames between arrivals (no two share a stretch of line)
const corePathIn = mkPath([...CORE_TO_FRONT, B0]);
const LEG_IN = Math.hypot(B0[0] - YUEYANG_ST[0], B0[1] - YUEYANG_ST[1]);
const CORE_ARR = travelEnd(T_GO, corePathIn.len, V_IN, TA, 10);
type GarrisonPlan = { city: string; at: P2; pin: Path; t0: number; arr: number; pout: Path; d0: number; arr2: number };
const plans: GarrisonPlan[] = GARRISONS.map((g) => ({ city: g.city, at: g.at, pin: mkPath([...TO_FRONT[g.city], B0]), t0: 0, arr: 0, pout: mkPath([]), d0: 0, arr2: 0 }));
{
  const order = plans.slice().sort((a, b) => a.pin.len - b.pin.len);
  let prev = CORE_ARR;
  for (const p of order) {
    const earliest = travelEnd(T_GO, p.pin.len, V_IN, TA, 0);
    p.arr = Math.max(earliest, prev + GAP);
    p.t0 = T_GO + (p.arr - earliest);
    prev = p.arr;
  }
}
/** a garrison's merge into the block: it slides in from behind; the block grows over GROW frames around its arrival */
const GROW: [number, number] = [-5, 5];
const mergedN = (f: number) => plans.reduce((n, p) => n + sstep(p.arr + GROW[0], p.arr + GROW[1], f), 0);

// ---- the split (STABILIZE / DISPERSE): the merge run backwards; the garrisons slide out of the block's back one
// after another (the farthest town first) and file up the lines, the block shrinking with each -----------------------
const T_SPLIT = 280;
const V_OUT = 32;
const GAP_OUT = 2.3;
const TD = 9;
const OUT_CLEAR = 7; // frames for a leaving garrison to clear the block (its share of the block goes with it)
const B2: P2 = bigCentre(1e4); // the block where it stands when it splits
{
  const byFar = plans.slice().sort((a, b) => b.pin.len - a.pin.len);
  byFar.forEach((p, k) => {
    p.pout = mkPath([B2, ...TO_FRONT[p.city].slice().reverse()]);
    p.d0 = T_SPLIT + k * GAP_OUT;
    p.arr2 = travelEnd(p.d0, p.pout.len, V_OUT, TA, TD);
  });
}
/** the remnant (the Wuhan block again) goes home last */
const CORE_OUT = mkPath([B2, YUEYANG_ST, ...CORE_TO_FRONT.slice().reverse()]);
const CORE_D0 = Math.max(...plans.map((p) => p.d0)) + GAP_OUT + 2;
const CORE_ARR2 = travelEnd(CORE_D0, CORE_OUT.len, V_OUT, TA, TD);
const SPLIT_END = CORE_D0;
const emergedN = (f: number) => plans.reduce((n, p) => n + sstep(p.d0, p.d0 + OUT_CLEAR, f), 0);

/** the cream block's spec at frame f (null: not there) and its centre */
const bigSpec = (f: number): BlockSpec => {
  if (f < CORE_ARR) {
    const s = travel(f, T_GO, corePathIn.len, V_IN, TA, 10);
    const c = pathAt(corePathIn, s);
    return blockSpec(c[0], c[1], W_CORE, FACE);
  }
  if (f < T_SPLIT) {
    const c = bigCentre(f);
    const w = W_CORE + ((W_BIG - W_CORE) * mergedN(f)) / plans.length;
    return blockSpec(c[0], c[1], w, FACE);
  }
  const w = W_BIG - ((W_BIG - W_CORE) * emergedN(f)) / plans.length;
  if (f < CORE_D0) return blockSpec(B2[0], B2[1], w, FACE);
  const c = pathAt(CORE_OUT, travel(f, CORE_D0, CORE_OUT.len, V_OUT, TA, TD));
  return blockSpec(c[0], c[1], w, FACE);
};

/** the ROC block: pressed back by the cream block's face, then (freed) it steps forward and grows */
const OR_GROW: [number, number] = [318, 366];
const orangeSpec = (f: number): BlockSpec => {
  const g = easeInOut((f - OR_GROW[0]) / (OR_GROW[1] - OR_GROW[0]));
  const w = OR_W0 + (OR_W1 - OR_W0) * g;
  const h = OR_H0 + (OR_H1 - OR_H0) * g;
  const d = 0.42 * w;
  const pressed = (ff: number) => {
    const b = bigSpec(Math.min(ff, T_SPLIT - 0.001));
    return Math.max(OR0[1], pressedZ([b.x, b.z], b.d, 0.42 * OR_W0));
  };
  // pressed by the cream block until it splits; freed, it steps back up to its line as it grows
  const zc = f < OR_GROW[0] ? pressed(f) : pressed(T_SPLIT) + (OR0[1] - pressed(T_SPLIT)) * g;
  return { x: OR0[0], z: zc, w, h, d, face: FACE };
};
/** the first frame the cream block's face touches the orange block (for the header) */
export const CONTACT_F = (() => {
  for (let f = B_ADV[0]; f < B_ADV[1] + 4; f += 0.25) if (orangeSpec(f).z > OR0[1] + 0.01) return f;
  return -1;
})();

// ---- the guerrillas -------------------------------------------------------------------------------------------------
type PawnPlan = { at: P2; kind: "lurk" | "town" | "rail" | "base"; town?: string; rail?: { key: string; s: number } };
const railLine = (key: string) => HELD_LINES.find((l) => l.key === key)!;
const railPt = (key: string, u: number) => {
  const p = mkPath(railLine(key).pts);
  return pathAt(p, u * p.len);
};
const PAWNS: PawnPlan[] = [
  // lurking from the start (the base areas)
  { at: [-205, -380], kind: "lurk" }, // Jin-Cha-Ji
  { at: [235, 45], kind: "lurk" }, // Shandong (Yimeng)
  { at: [-265, -40], kind: "lurk" }, // Jin-Ji-Lu-Yu
  { at: [400, 318], kind: "lurk" }, // N4A, central Jiangsu
  // closing round the towns (they sink when the town's garrison is back)
  { at: [-125, -350], kind: "town", town: "baoding" },
  { at: [-62, -178], kind: "town", town: "shijiazhuang" },
  { at: [12, -42], kind: "town", town: "jinan" },
  { at: [180, 128], kind: "town", town: "xuzhou" },
  { at: [-112, 198], kind: "town", town: "kaifeng" },
  { at: [-118, 22], kind: "town", town: "xinxiang" },
  { at: [-365, -148], kind: "town", town: "taiyuan" },
  { at: [52, -292], kind: "town", town: "tianjin" },
  { at: [-42, -500], kind: "town", town: "beiping" },
  { at: [326, 44], kind: "town", town: "qingdao" },
  { at: [186, 478], kind: "town", town: "nanjing" },
  // on the railways (the line broken where it stands; these lines stay cut)
  { at: railPt("beining:beiping-shanhaiguan", 0.16), kind: "rail", rail: { key: "beining:beiping-shanhaiguan", s: 0.16 } },
  { at: railPt("beining:beiping-shanhaiguan", 0.62), kind: "rail", rail: { key: "beining:beiping-shanhaiguan", s: 0.62 } },
  { at: railPt("longhai:kaifeng-xinpu", 0.82), kind: "rail", rail: { key: "longhai:kaifeng-xinpu", s: 0.82 } },
  // more of the countryside
  { at: [-12, -250], kind: "base" }, // Jizhong
  { at: [222, -150], kind: "base" }, // north Shandong
  { at: [-30, 75], kind: "base" }, // between Kaifeng and Xuzhou
  { at: [-235, -265], kind: "base" }, // Taihang
];
const RISE_LEN = 26;
const SINK_LEN = 18;
/** rising south to north as the camera pans up over them (f166 -> f206 starts, all up by ~f232) */
const riseStart = (p: PawnPlan) => 166 + 40 * c01((480 - p.at[1]) / 980);
const townArr = (city: string) => plans.find((p) => p.city === city)!.arr2;
const pawnRise = (p: PawnPlan, f: number) => {
  if (p.kind === "lurk") return 1;
  const up = c01((f - riseStart(p)) / RISE_LEN);
  if (p.kind !== "town") return up;
  // the garrison is back (its last stretch into town): the pawn sinks (the rise run in reverse)
  const t0 = townArr(p.town!) - 6;
  return Math.min(up, 1 - c01((f - t0) / SINK_LEN));
};

// ---- the ground: the cream hold along the lines thins while the towns stand empty ----------------------------------
const homeFrac = (f: number) => {
  const n = plans.reduce((acc, p) => {
    const gone = sstep(p.t0, p.t0 + 14, f);
    const back = sstep(p.arr2 - 10, p.arr2 + 4, f);
    return acc + (1 - gone) + back;
  }, 0);
  return n / plans.length;
};

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export const KEYS: CamKey[] = [
  { f: -40, x: 82, z: 380, D: 1380, pitch: 46.5, yaw: 19 },
  { f: 72, x: 78, z: 391, D: 1277, pitch: 46, yaw: 20 },
  { f: 104, x: -185, z: 680, D: 860, pitch: 37.5, yaw: 2 },
  { f: 138, x: -250, z: 845, D: 540, pitch: 34, yaw: -6 },
  { f: 150, x: -246, z: 836, D: 565, pitch: 35, yaw: -5 },
  { f: 226, x: 23, z: -29, D: 1150, pitch: 50, yaw: 15 },
  { f: 300, x: 83, z: 355, D: 1312, pitch: 42, yaw: 22 },
  { f: 400, x: 78, z: 354, D: 1294, pitch: 42, yaw: 22.5 },
];
const camAt = camTrack(KEYS, DURATION + 10);
const REST = camAt(0);

// ===================================================================================================================
// THE LINES on the ground
// ===================================================================================================================
const RAILS = HELD_LINES.filter((l) => l.kind === "rail");
/** the lines the pieces ride that Japan did not hold (drawn as the map's own railways, a little dimmer) */
const EXTRA_RAILS: P2[][] = [sub(PH, st(PH, "xinxiang"), st(PH, "hankou")), sub(CHINA.RAIL_LONGHAI, 0, st(CHINA.RAIL_LONGHAI, "kaifeng")), sub(YH, 0, st(YH, "changsha"))];
const YANGTZE = CHINA.RIVER_YANGTZE.pts;
const GAP_W = 34; // world px of rail removed under a rail pawn (half each side)

type Item = { at: P2; key: string; inside?: boolean; el: React.ReactNode };

const Bands: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {[
      [1080, 1250],
      [1360, 1460],
    ].map(([a, b]) => (
      <rect key={a} x={2} y={a} width={1076} height={b - a} fill="#FFFFFF" fillOpacity={0.06} stroke="#FF00FF" strokeOpacity={0.7} strokeDasharray="8 6" />
    ))}
  </svg>
);

const inFootprint = (b: BlockSpec, p: P2, pad = 0) => Math.abs(p[0] - b.x) < b.w / 2 + pad && Math.abs(p[1] - b.z) < b.d / 2 + pad;

const HornsOfTheDilemma: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const A = insWorld({ cam, rest: REST, frame });

  // the ground: the faint orange of the land between + the cream hold, thinning while the towns stand empty
  const home = homeFrac(frame);
  const territory: TerritoryLayer[] = [
    { d: CHINA.OCCUPIED_1939.d, color: "orange", wash: 0.1, hatch: 0 },
    { d: BANDS.d, color: "cream", wash: 0.3, hatch: 0.62, edge: 0, amount: 0.4 + 0.6 * home },
  ];

  const items: Item[] = [];
  const big = bigSpec(frame);
  items.push({ at: [big.x, big.z], key: "big", el: <Block key="big" A={A} spec={big} color="cream" sticker="japan" uid="big" /> });
  const orn = orangeSpec(frame);
  items.push({ at: [orn.x, orn.z], key: "roc", el: <Block key="roc" A={A} spec={orn} color="orange" sticker="roc" uid="roc" /> });

  plans.forEach((p, i) => {
    let at: P2 | null = null;
    if (frame < p.t0) at = p.at;
    else if (frame < p.arr) {
      // the last leg (Yueyang station -> the block) follows the block as it advances
      const sIn = travel(frame, p.t0, p.pin.len, V_IN, TA, 0);
      const q = c01((sIn - (p.pin.len - LEG_IN)) / LEG_IN);
      const b = bigCentre(frame);
      const q0 = pathAt(p.pin, sIn);
      at = [q0[0] + (b[0] - B0[0]) * q, q0[1] + (b[1] - B0[1]) * q];
    }
    else if (frame >= p.d0) at = pathAt(p.pout, travel(frame, p.d0, p.pout.len, V_OUT, TA, TD));
    if (!at) return;
    const inside = inFootprint(big, at, 4);
    items.push({ at, key: `g${i}`, inside, el: <Garrison key={`g${i}`} A={A} x={at[0]} z={at[1]} size={GS} face={GARRISON_FACE} uid={`g${i}`} /> });
  });

  PAWNS.forEach((p, i) => {
    const u = pawnRise(p, frame);
    if (u <= 0) return;
    items.push({ at: p.at, key: `p${i}`, el: <Pawn key={`p${i}`} A={A} x={p.at[0]} z={p.at[1]} size={PAWN_SIZE} rise={u} uid={`p${i}`} seed={i + 3} /> });
  });

  // painter's order far -> near; a garrison inside the big block is drawn just before it (it goes into / comes out of it)
  const sorted = sortFarToNear(A, items, (it) => it.at);
  const inner = sorted.filter((it) => it.inside);
  const rest = sorted.filter((it) => !it.inside);
  const bi = rest.findIndex((it) => it.key === "big");
  const ordered = [...rest.slice(0, bi), ...inner, ...rest.slice(bi)];

  // the rails, broken under the rail pawns as they rise
  const railEls = RAILS.map((r) => {
    const cuts = PAWNS.filter((p) => p.rail?.key === r.key)
      .map((p) => {
        const L = mkPath(r.pts).len;
        const g = (GAP_W / 2 / L) * sstep(0.04, 0.3, pawnRise(p, frame));
        return [p.rail!.s - g, p.rail!.s + g] as [number, number];
      })
      .filter(([a, b]) => b > a)
      .sort((a, b) => a[0] - b[0]);
    const spans: [number, number][] = [];
    let s0 = 0;
    for (const [a, b] of cuts) {
      spans.push([s0, a]);
      s0 = b;
    }
    spans.push([s0, 1]);
    return spans.map(([a, b], k) => (b > a ? <GroundLine key={`${r.key}-${k}`} A={A} pts={r.pts} kind="rail" w={7} dash={10} from={a} to={b} /> : null));
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#2A2620" }}>
      <InsurgencyStage A={A}>
        <MapGround3D world="china" cam={cam} air={A.ground} fog={A.fog} territory={territory} />
        <HorizonHaze A={A} id="hzHD" />
        <WorldLayer>
          <GroundLine A={A} pts={YANGTZE} w={3.2} color={INK.creamDim} opacity={0.5} />
          {EXTRA_RAILS.map((pts, k) => (
            <GroundLine key={`x${k}`} A={A} pts={pts} kind="rail" w={6} dash={10} opacity={0.55} />
          ))}
          {railEls}
          {ordered.map((it) => (
            <React.Fragment key={it.key}>{it.el}</React.Fragment>
          ))}
        </WorldLayer>
      </InsurgencyStage>
      {bands ? <Bands /> : null}
    </AbsoluteFill>
  );
};

/** the schedule, for the checks (scratch scripts) */
export const SCHEDULE = { CORE_ARR, CORE_D0, CORE_ARR2, SPLIT_END, plans: plans.map((p) => ({ city: p.city, t0: p.t0, arr: p.arr, d0: p.d0, arr2: p.arr2, lin: p.pin.len, lout: p.pout.len })) };

export default HornsOfTheDilemma;

