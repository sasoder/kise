import React, { useId } from "react";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  GEO,
  Label,
  LightSweep,
  METRIC,
  STROKE,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  type Silhouette,
} from "./stoutShared";
import { FLOOR, SEQ, bayX, personHead, personPath, restToRest, type SceneCam, type ScenePool, type SceneProps } from "./fourThingsShared";

// ===========================================================================
// fourThingsScene3 — META4 "Four things Mark did", scene 3: "A BET ON POTENTIAL"
// (Cheeky Pint S4 / stout; brief out/meta4/BRIEF.md, contract out/meta4/SHARED_READY.md).
//
// LINE (clip FourThings3, sequence frames 831-1183, 352 f at 23.976): "Thing three is, I'll note
// Alex had never trained a frontier model before. And so you were taking some amount of a bet on
// Alex's potential to do something where he had like done the stuff in AI, but like, no offense,
// you just had not done the specific thing that you were being hired to do."
// CHECK LINE: the viewer can say "Alex had a record in AI data, but none in the one job he was
// hired for; Meta put its chips on the empty column."
//
// THE PICTURE (bay 3, world px; x below is relative to the bay centre). Three cream tiles in a row,
// their bodies crossing the caption strip, everything that matters ABOVE it, the names BELOW it:
//   left   the SCALE pillar: a SOLID cream bar risen out of its tile's slot, the Scale logo knocked
//          out of the bar's head (what he has done)
//   middle ALEX WANG, the cream bust, on his own tile (as the people of scene 2 stand)
//   right  FRONTIER MODEL: an EMPTY glass column (the stout glass: hairline + faint tint), taller
//          than the Scale bar, and beside it, on the same tile, the amber chip stack
// Amber = Mark's move = the chips, and nothing else. The glass stays EMPTY to the end.
//
// ONE MOTION (local frames; word onsets: Thing 1 · three 4 · I'll note 21 · Alex 33 · never 47 ·
// trained 53 · frontier 67 · model 73 · before 78 · taking 101 · amount 120 · of a bet 126 ·
// on 140 · Alex's 148 · potential 164 · to do 174 · he had 208 · done 216 · the stuff 225 · AI 239 ·
// but 254 · no offense 272 · had not 288 · the specific 297 · thing 310 · hired 335 · to do 340):
//   f 0-30    the shell's camera arrives from bay 2; the Scale bar is already rising out of its slot
//             (f 0-56) and the glass follows it out of its own (f 22-82), taller
//   f 30-42   `ALEX WANG` (blur-in)
//   f 44-98   the camera settles toward the empty glass (W -> G), the light pool with it;
//             `FRONTIER MODEL` arrives f 64-76; the Scale pillar loses the light by tone
//   f 98-173  eight amber chips slide in from off-frame right, one every 7 f (24 f each), and stack
//             on the frontier tile beside the empty column; the LightSweep crosses the finished
//             stack f 174-188 (the clip's one click)
//   f 188-248 the camera drifts left to the wide three-shot (G -> S), the light goes to the solid
//             Scale pillar (cream again)
//   f 266-322 back toward the glass (S -> F), only as far as keeps all three in frame: the glass
//             still empty, the stake complete, the light on them; the Scale pillar dims by tone
//   f 334-    sceneCam3 is CONSTANT (clip 4 leaves from it); living hold: stage sway, light drift
// ===========================================================================

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `s3${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const LEN = SEQ[3].len;

// --- geometry (WORLD px; x relative to the bay centre) --------------------------------------------
const TILE_H = 150;
const TILE_TOP = FLOOR - TILE_H; // 1146
const COL_W = 170; // the Scale bar and the glass: like for like
const SCALE = { x: -330, w: 210, bar: 360 };
const ALEX = { x: -55, w: 240, h: 204 };
const FRONT = { x: 275, w: 320, glassX: 215, glass: 480 };
const CHIP = { x: 372, w: 96, h: 22, r: 8, n: 8, stripe: 9, pitch: 32 };
/** The Scale AI wordmark (public/cheekypint2/meta4/Scale_AI.svg, its one path; box 2178 x 703). */
/** The names: 40 SCREEN px (the director's size for this set: read at phone width). */
const NAME_PX = 40;
/** The empty glass as a measuring column: a faint rung every RUNG world px, hung from its top. */
const RUNG = 60;
const SCALE_BOX = { w: 2178, h: 703 };
const SCALE_LOGO_W = 128; // world px, inside the 170 bar
const SCALE_LOGO_TOP = 26; // from the bar's top edge
const SCALE_D =
  "M1560 0.9C1552.1 3.5 1545.9 8 1541.5 14.4C1534.5 24.8 1535 -2.9 1535 350C1535 702.9 1534.5 675.2 1541.5 685.5C1545.2 691 1548 693.4 1555 697.1C1558.9 699.2 1560.9 699.5 1569.5 699.5C1579 699.5 1579.8 699.3 1585.8 696.1C1592.9 692.2 1596.8 688 1600.8 680L1603.5 674.5 1603.5 350L1603.5 25.5 1600.8 20C1596.8 11.9 1592.9 7.8 1585.8 4C1580.3 1 1578.5 0.6 1571 0.3C1566.3 0.2 1561.4 0.4 1560 0.9M174.8 226C80.2 232.2 16.1 278.5 6.2 347.9C3.5 367 6.5 389.3 14.4 407.9C23.9 430.3 42.8 450.1 67.5 463.5C94 477.8 125.2 486 195 497C271.7 509.1 300.8 517.7 316.3 532.8C325.3 541.5 329 550.6 329 564C329 578 324.5 588.5 314.1 599.3C299.3 614.7 276 624.6 243 629.6C229 631.8 193.5 632.1 178.5 630.1C135.2 624.7 93.2 609.7 56.8 586.8C46 580 41.3 578.6 31.3 579.2C21.5 579.8 15.1 582.9 8.7 590C2.8 596.5 0 604 0 612.9C0 630.2 6.8 637.9 37.3 654.9C80.6 679.2 129.1 694.2 179.2 699C196.1 700.7 239.7 699.8 254 697.5C296.9 690.8 328.8 677.7 354.3 656.2C385 630.4 401.2 591.2 397.2 552.7C391.9 502.2 361.3 468.5 303.4 449.4C281.5 442.3 257.7 437.4 201.5 428.5C146.3 419.8 120 413.2 100.8 403.3C82.3 393.8 74 381 74 361.9C74 329.1 106.1 305.3 162.5 296.3C176.2 294.1 214.6 293.9 229 295.9C270.1 301.5 300.2 313.3 329.6 335.1C342.3 344.5 347.7 346.5 358.4 345.8C370.7 344.9 380.1 338.9 386.1 327.8C389.3 322 389.5 320.9 389.5 312.5C389.5 304.3 389.2 302.9 386.2 296.7C382.2 288.7 376.2 283.3 357.6 270.9C314.7 242.3 263.7 227.3 204 225.6C194.9 225.4 181.8 225.5 174.8 226M685 226C583 234.1 497.5 305.5 472.5 403.5C466.5 426.9 465.5 435.7 465.5 463.5C465.6 491.4 467 502.7 473.5 526.3C495.3 605.9 558.8 669.3 639.3 691.9C661.4 698.1 672.8 699.5 702 699.5C725.3 699.5 729.9 699.2 740.5 697.2C793.9 687.1 840.1 660.6 873.1 621.1C891.6 599 896.4 588.7 894.1 576.1C893.4 572.6 892 568 891 566C884.6 553.5 871.2 546 857.3 547.3C845.1 548.5 839 552.8 827.8 567.9C772.2 643.4 664.3 653.3 591 589.8C545 549.9 524.2 486.2 537.6 426.1C555.3 346.9 627.5 291.1 708 294.4C732.1 295.4 750 299.9 771.5 310.5C793.7 321.5 814.9 339.5 828.6 359C838.6 373.3 847 378.4 860.5 378.5C867.6 378.5 869.3 378.1 875.2 375.2C887.5 369.2 894.3 358.2 894.3 344.5C894.3 334.9 891.7 328.8 881.8 315.5C872.3 302.7 851.1 281.1 839.5 272.3C800.2 242.7 757.4 227.4 709 225.7C701.6 225.4 690.8 225.5 685 226M1187 225.6C1142.5 228.5 1103.4 241.6 1067.5 265.5C1015.9 299.8 978.9 354.7 966.6 415C963.1 432.2 962 444.1 962 463.2C962 517.1 979.1 566.4 1012.8 610C1021.3 620.9 1041.1 640.7 1052 649.2C1093.1 681 1139.6 698.2 1188.5 699.7C1204.4 700.2 1205.9 700.1 1211.4 698C1221.3 694.2 1230 684.5 1232.4 674.5C1233.8 668.9 1233.1 659.4 1231 653.7C1228.2 646.3 1221.6 639.1 1214.4 635.6C1209.3 633.1 1206.8 632.6 1195.5 631.9C1179.2 630.9 1174.8 630.3 1163.1 627.8C1142.3 623.4 1119.3 613.2 1101 600.2C1088.9 591.6 1070.4 573.2 1061.7 561C1053.7 549.7 1043.2 529.1 1039 516.3C1022.8 467.3 1029.7 414.2 1057.8 371C1090.2 321 1146.5 291.8 1205.5 294.3C1254 296.4 1297.6 320.1 1326.1 360C1337.4 375.8 1347.5 399.1 1351.4 418.1C1354.6 433.8 1355 448.8 1355 560.7L1355 672.9 1357.2 678.7C1360.1 686.6 1368.4 694.9 1376.3 697.8C1393.1 704.1 1411.6 697 1419.5 681.3L1422.5 675.5 1422.8 557C1423 476.2 1422.8 435 1422 427.5C1416.8 375.5 1394.3 328.1 1357.1 291C1316 250 1263.8 227.5 1205.5 225.7C1198.3 225.4 1190 225.4 1187 225.6M1936 226C1889.8 229.7 1847.5 245.7 1810.5 273.5C1761.7 310.2 1729.2 364.2 1718.9 425.5C1716.3 441.3 1715.3 468.8 1716.9 484.5C1723.7 551.7 1757.4 612.3 1809.6 651.6C1841.7 675.8 1876.4 690.7 1916 697.6C1928.8 699.8 1965.6 700.6 1980.3 699.1C2042.1 692.5 2096.6 666.2 2138.7 622.7C2154.3 606.5 2156.5 602.4 2156.5 589C2156.5 580.6 2156.2 578.9 2153.7 574.2C2150 567.2 2144 561.4 2137.1 558.2C2132.4 556 2130.1 555.5 2123 555.5C2110.1 555.5 2106.7 557.5 2088.5 575.6C2070.9 593.2 2059.9 601.3 2040.7 611C1988.2 637.4 1929 638.7 1879.5 614.6C1832.4 591.5 1799 548.5 1787.8 496.4C1785.8 486.8 1785.5 482.8 1785.5 463C1785.5 437.8 1786.5 430.9 1792.7 411.5C1804.2 375.6 1828.1 343.8 1859.4 322.8C1889.6 302.7 1925.2 292.6 1960.4 294.4C1983.8 295.5 2000.9 300 2022.5 310.5C2055.2 326.5 2082.4 355.3 2096.6 389C2099.6 396.3 2106 416.6 2106 419.2C2106 419.6 2057.3 420.1 1997.8 420.2L1889.5 420.5 1884.9 422.8C1877.5 426.4 1872.4 431.5 1868.8 438.8C1865.8 444.7 1865.5 446.4 1865.5 454C1865.5 461.1 1865.9 463.4 1868.1 468.1C1871.5 475.3 1877.7 481.5 1884.9 484.9L1890.5 487.5 2021.5 487.5L2152.5 487.5 2157.5 485C2164.9 481.4 2172.3 473.6 2174.8 466.7C2178.8 456.1 2177.5 426 2172 400.5C2167 377.5 2154.4 347.6 2141.3 327.5C2109.2 278.6 2058.8 243.4 2002.6 230.9C1982.1 226.3 1956 224.4 1936 226";

// --- timing (local frames) ----------------------------------------------------------------------------
const T = {
  bar: [-6, 56] as const, // under way on frame 0
  glass: [22, 82] as const,
  alex: [30, 42] as const,
  frontier: [64, 76] as const,
  toGlass: [44, 98] as const,
  chip0: 98,
  chipStep: 7,
  chipF: 24,
  sweep: [174, 188] as const,
  toScale: [188, 248] as const,
  back: [266, 322] as const,
  settle: [318, 334] as const,
};
const win = (t: number, a: readonly [number, number] | readonly number[]) => smoothstep((t - a[0]) / (a[1] - a[0]));

// --- camera -----------------------------------------------------------------------------------------
// Four rests: W (the arrival, all three), G (Alex + the empty glass + the chips), S (the wide
// three-shot, a touch left: the light is on the Scale pillar), F (the settled three-shot, pushed in
// toward the glass as far as keeps the Scale pillar whole). The tiles' top edge stays on screen
// y TOP_Y at every k, so the tile bodies cross the caption strip (1080-1250), the columns, the bust
// and the chips stand above it and the names sit just below it.
const TOP_Y = 1078;
// F is the SETTLED frame (the editor may hold on it): all three in frame, >= 40 px side margins.
const REST = { W: { dx: 0, k: 1.0 }, G: { dx: 205, k: 1.28 }, S: { dx: -45, k: 1.05 }, F: { dx: 5, k: 1.13 } };
const dyOf = (k: number) => TILE_TOP - (TOP_Y - 960) / k - 960;
const targetAt = (t: number) => {
  const a = win(t, T.toGlass);
  const b = win(t, T.toScale);
  const c = win(t, T.back);
  const dx = REST.W.dx + (REST.G.dx - REST.W.dx) * a + (REST.S.dx - REST.G.dx) * b + (REST.F.dx - REST.S.dx) * c;
  const lk =
    Math.log(REST.W.k) +
    (Math.log(REST.G.k) - Math.log(REST.W.k)) * a +
    (Math.log(REST.S.k) - Math.log(REST.G.k)) * b +
    (Math.log(REST.F.k) - Math.log(REST.S.k)) * c;
  return { dx, lk };
};
/** The damped follower (the house camera: stiffness 0.145, damping 0.59), solved once. */
const TRACK = (() => {
  const out: { dx: number; lk: number }[] = [];
  let c = targetAt(0);
  let v = { dx: 0, lk: 0 };
  for (let f = 0; f <= LEN + 80; f++) {
    if (f > 0) {
      const g = targetAt(f);
      v = { dx: v.dx + (g.dx - c.dx) * 0.145 - v.dx * 0.59, lk: v.lk + (g.lk - c.lk) * 0.145 - v.lk * 0.59 };
      c = { dx: c.dx + v.dx, lk: c.lk + v.lk };
    }
    out.push({ ...c });
  }
  return out;
})();
export const sceneCam3 = (t: number): SceneCam => {
  const u = Math.max(0, Math.min(TRACK.length - 1.001, t));
  const i = Math.floor(u);
  const fr = u - i;
  const p = { dx: lerp(TRACK[i].dx, TRACK[i + 1].dx, fr), lk: lerp(TRACK[i].lk, TRACK[i + 1].lk, fr) };
  // the follower's last crumbs ease out: from T.settle[1] the camera is exactly F
  const s = win(t, T.settle);
  const dx = lerp(p.dx, REST.F.dx, s);
  const k = Math.exp(lerp(p.lk, Math.log(REST.F.k), s));
  return { dx, dy: dyOf(k), k };
};

// --- the light --------------------------------------------------------------------------------------
/** 0 = the light is on the glass side, 1 = on the Scale pillar. It opens on the pillar (rising). */
const lightOnScale = (t: number) => 1 - win(t, [50, 96]) + win(t, [196, 240]) - win(t, [270, 312]);
export const scenePool3 = (t: number): ScenePool => {
  const g = SEQ[3].start + t;
  const s = lightOnScale(t);
  const open = 1 - win(t, [40, 96]); // the arrival: the light on Alex, between the two
  const gx = lerp(FRONT.glassX + 30, ALEX.x + 40, open);
  return {
    dx: lerp(gx, SCALE.x, s * (1 - open)) + 26 * Math.sin(g / 37),
    dy: -110 + 16 * Math.sin(g / 29 + 1),
    strength: 1.5,
  };
};

// --- small parts -----------------------------------------------------------------------------------
/** A lit top edge of a cream card (SCREEN px weight). */
const LitEdge: React.FC<{ x0: number; x1: number; y: number; k: number; a?: number }> = ({ x0, x1, y, k, a = ALPHA.edge }) =>
  x1 - x0 > 0.5 ? <path d={`M${f2(x0)} ${f2(y + EDGE.CREAM / k / 2)}H${f2(x1)}`} stroke={COLOR.edge} strokeOpacity={a} strokeWidth={f2(EDGE.CREAM / k)} /> : null;
/** The slot a column rises out of, across the tile's top edge. */
const Slot: React.FC<{ x: number; w: number; k: number }> = ({ x, w, k }) => {
  const sw = w + (2 * EDGE.SLOT_LIP) / k;
  const sh = EDGE.SLOT / k;
  return <rect x={f2(x - sw / 2)} y={f2(TILE_TOP - sh / 2)} width={f2(sw)} height={f2(sh)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />;
};
const CreamGradient: React.FC<{ id: string; y0: number; y1: number; dim?: number }> = ({ id, y0, y1, dim = 0 }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y1)}>
    <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dim)} />
    <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dim)} />
  </linearGradient>
);

// --- the chips ---------------------------------------------------------------------------------------
type ChipState = { i: number; x: number; y: number; fly: number; landed: boolean; shown: boolean };
const chipAt = (i: number, t: number, cx: number, fromX: number): ChipState => {
  const u = (t - (T.chip0 + i * T.chipStep)) / T.chipF;
  const yLand = TILE_TOP - (i + 1) * CHIP.h;
  if (u <= 0) return { i, x: fromX, y: yLand - 30, fly: 1, landed: false, shown: false };
  if (u >= 1) return { i, x: cx, y: yLand, fly: 0, landed: true, shown: true };
  // slides in above its place, soft landing; comes down onto the stack over the last stretch
  const e = restToRest(u, 3);
  const down = smoothstep((u - 0.55) / 0.45);
  return { i, x: lerp(fromX, cx, e), y: yLand - 30 * (1 - down), fly: 1 - down, landed: false, shown: true };
};
const chipPath = (c: ChipState) => rectPath(c.x - CHIP.w / 2, c.y, CHIP.w, CHIP.h, CHIP.r);

// ===========================================================================
// THE SCENE
// ===========================================================================
export const Scene3: React.FC<SceneProps> = ({ t, cam, k }) => {
  const uid = uidOf(useId());
  const X = bayX(3);
  const r = GEO.RADIUS;
  const band = amberBandFor(cam);

  // --- state
  const barH = SCALE.bar * restToRest((t - T.bar[0]) / (T.bar[1] - T.bar[0]), 3);
  const glassH = FRONT.glass * restToRest((t - T.glass[0]) / (T.glass[1] - T.glass[0]), 3);
  const scaleDim = 0.6 * (1 - lightOnScale(t));
  const alexIn = clamp01((t - T.alex[0]) / (T.alex[1] - T.alex[0]));
  const frontierIn = clamp01((t - T.frontier[0]) / (T.frontier[1] - T.frontier[0]));
  const sweep = (t - T.sweep[0]) / (T.sweep[1] - T.sweep[0]);

  // --- the Scale pillar
  const sx = X + SCALE.x;
  const sTile = { x: sx - SCALE.w / 2, y: TILE_TOP, w: SCALE.w, h: TILE_H };
  const sBar = { x: sx - COL_W / 2, y: TILE_TOP - barH, w: COL_W, h: barH };
  const logoS = SCALE_LOGO_W / SCALE_BOX.w;
  const scaleSil: Silhouette = [{ d: rectPath(sTile.x, sTile.y, sTile.w, sTile.h, r) }];
  if (barH > 0.5) scaleSil.push({ d: rectPath(sBar.x, sBar.y, sBar.w, sBar.h + r, r, true, false) });
  const sEdge = lerp(ALPHA.edge, ALPHA.edgeBoard, scaleDim);

  // --- Alex
  const ax = X + ALEX.x;
  const aTile = { x: ax - ALEX.w / 2, y: TILE_TOP, w: ALEX.w, h: TILE_H };
  const bust = personPath(ax, TILE_TOP, ALEX.h);
  const head = personHead(ax, TILE_TOP, ALEX.h);
  const alexSil: Silhouette = [{ d: rectPath(aTile.x, aTile.y, aTile.w, aTile.h, r) }, { d: bust }];

  // --- the frontier tile: the empty glass and the chips
  const fx = X + FRONT.x;
  const gx = X + FRONT.glassX;
  const fTile = { x: fx - FRONT.w / 2, y: TILE_TOP, w: FRONT.w, h: TILE_H };
  const glass = { x: gx - COL_W / 2, y: TILE_TOP - glassH, w: COL_W, h: glassH };
  const cx = X + CHIP.x;
  // a chip starts beyond the frame's right edge (the camera of this frame), never in view
  const fromX = Math.max(cx + 300, cam.x + 540 / k + CHIP.w / 2 + 40);
  const chips = Array.from({ length: CHIP.n }, (_, i) => chipAt(i, t, cx, fromX));
  const landed = chips.filter((c) => c.landed);
  const flying = chips.filter((c) => c.shown && !c.landed);
  const frontSil: Silhouette = [{ d: rectPath(fTile.x, fTile.y, fTile.w, fTile.h, r) }];
  if (glassH > 0.5) frontSil.push({ d: rectPath(glass.x, glass.y, glass.w, glass.h, r, true, false), a: 0.3 });
  if (landed.length) {
    const h = landed.length * CHIP.h;
    frontSil.push({ d: rectPath(cx - CHIP.w / 2, TILE_TOP - h, CHIP.w, h + r, CHIP.r, true, false) });
  }
  const stackTop = TILE_TOP - landed.length * CHIP.h;
  const hair = STROKE.RULE / k; // the subject: the cream hairline one step up, at full strength
  const rungs: number[] = [];
  for (let y = glass.y + RUNG; y < TILE_TOP - 12; y += RUNG) rungs.push(y);

  // --- the names (SCREEN px sizes; baseline a fixed screen distance under the floor)
  const nameY = FLOOR + (32 + METRIC.cap * NAME_PX) / k;

  const chipBody = (c: ChipState) => {
    const x0 = c.x - CHIP.w / 2;
    const phase = ((c.i * 13) % CHIP.pitch) - CHIP.pitch / 2; // the inserts of a real stack never line up
    const stripes: number[] = [];
    for (let q = -2; q <= 2; q++) stripes.push(c.x + q * CHIP.pitch + phase - CHIP.stripe / 2);
    return (
      <g key={c.i}>
        <clipPath id={`${uid}cc${c.i}`}>
          <path d={chipPath(c)} />
        </clipPath>
        <path d={chipPath(c)} fill={`url(#${uid}a)`} />
        <g clipPath={`url(#${uid}cc${c.i})`}>
          {stripes.map((sxx, j) => (
            <rect key={j} x={f2(sxx)} y={f2(c.y)} width={CHIP.stripe} height={CHIP.h} fill={COLOR.rung} />
          ))}
          {/* the seam under a chip: where it meets the one below */}
          <rect x={f2(x0)} y={f2(c.y + CHIP.h - EDGE.SLOT / k)} width={CHIP.w} height={f2(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
        </g>
      </g>
    );
  };
  /** The hot top edge of a chip (a true top surface: a chip in flight, or the top of the stack). */
  const chipHot = (c: ChipState, a: number) =>
    a > 0.01 ? (
      <g key={`h${c.i}`} opacity={f2(a)}>
        <path d={rectPath(c.x - CHIP.w / 2, c.y, CHIP.w, Math.min(CHIP.h, EDGE.HOT_FALL / k), CHIP.r, true, false)} fill={`url(#${uid}hf)`} />
        <path d={`M${f2(c.x - CHIP.w / 2 + CHIP.r)} ${f2(c.y + EDGE.HOT / k / 2)}H${f2(c.x + CHIP.w / 2 - CHIP.r)}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
      </g>
    ) : null;

  return (
    <g>
      <defs>
        <CreamGradient id={`${uid}cs`} y0={Math.min(sBar.y, TILE_TOP)} y1={FLOOR} dim={scaleDim} />
        <CreamGradient id={`${uid}ca`} y0={head.y - head.r} y1={FLOOR} />
        <CreamGradient id={`${uid}cf`} y0={TILE_TOP} y1={FLOOR} />
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        {/* the Scale logo, knocked out of the bar's head to the ground */}
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={f2(sBar.x - 2)} y={f2(TILE_TOP - SCALE.bar - 4)} width={COL_W + 4} height={SCALE.bar + 8}>
          <rect x={f2(sBar.x - 2)} y={f2(TILE_TOP - SCALE.bar - 4)} width={COL_W + 4} height={SCALE.bar + 8} fill="#fff" />
          <path
            d={SCALE_D}
            fill="#000"
            fillRule="evenodd"
            transform={`translate(${f2(sx - SCALE_LOGO_W / 2)} ${f2(sBar.y + SCALE_LOGO_TOP)}) scale(${logoS.toFixed(6)})`}
          />
        </mask>
        <clipPath id={`${uid}hc`}>
          <circle cx={f2(head.x)} cy={f2(head.y)} r={f2(head.r)} />
        </clipPath>
      </defs>

      {/* ---- 1. THE SCALE PILLAR: tile + solid bar, one shadow ---- */}
      <ElevationShadow silhouette={scaleSil} elevation="rest" contact={{ x: sx, y: FLOOR, w: SCALE.w }} />
      {barH > 0.5 ? <path d={rectPath(sBar.x, sBar.y, sBar.w, sBar.h, r, true, false)} fill={`url(#${uid}cs)`} mask={`url(#${uid}k)`} /> : null}
      <path d={rectPath(sTile.x, sTile.y, sTile.w, sTile.h, r)} fill={`url(#${uid}cs)`} />
      {barH > 0.5 ? <LitEdge x0={sBar.x + r} x1={sBar.x + sBar.w - r} y={sBar.y} k={k} a={sEdge} /> : null}
      <LitEdge x0={sTile.x + r} x1={sx - COL_W / 2 - EDGE.SLOT_LIP / k} y={TILE_TOP} k={k} a={sEdge} />
      <LitEdge x0={sx + COL_W / 2 + EDGE.SLOT_LIP / k} x1={sTile.x + sTile.w - r} y={TILE_TOP} k={k} a={sEdge} />
      {barH > 0.5 ? (
        <rect x={f2(sBar.x)} y={f2(TILE_TOP - Math.min(barH, EDGE.FOOT_AO / k))} width={COL_W} height={f2(Math.min(barH, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
      ) : null}
      <Slot x={sx} w={COL_W} k={k} />

      {/* ---- 2. ALEX: tile + bust, one shadow ---- */}
      <ElevationShadow silhouette={alexSil} elevation="rest" contact={{ x: ax, y: FLOOR, w: ALEX.w }} />
      <path d={bust} fill={`url(#${uid}ca)`} />
      <g clipPath={`url(#${uid}hc)`}>
        <path
          d={`M${f2(head.x - head.r * 0.8)} ${f2(head.y - head.r * 0.6)}A${f2(head.r - EDGE.CREAM / k / 2)} ${f2(head.r - EDGE.CREAM / k / 2)} 0 0 1 ${f2(head.x + head.r * 0.8)} ${f2(head.y - head.r * 0.6)}`}
          fill="none"
          stroke={COLOR.edge}
          strokeOpacity={ALPHA.edge}
          strokeWidth={f2(EDGE.CREAM / k)}
        />
      </g>
      {/* the bust's foot on the tile: a short occlusion, as a bar's foot */}
      <rect x={f2(ax - ALEX.h / 2 + 4)} y={f2(TILE_TOP - EDGE.FOOT_AO / k)} width={ALEX.h - 8} height={f2(EDGE.FOOT_AO / k)} fill={`url(#${uid}ao)`} />
      <path d={rectPath(aTile.x, aTile.y, aTile.w, aTile.h, r)} fill={`url(#${uid}cf)`} />
      <LitEdge x0={aTile.x + r} x1={ax - ALEX.h / 2} y={TILE_TOP} k={k} />
      <LitEdge x0={ax + ALEX.h / 2} x1={aTile.x + aTile.w - r} y={TILE_TOP} k={k} />

      {/* ---- 3. THE FRONTIER TILE: the empty glass + the chip stack, one shadow ---- */}
      <ElevationShadow silhouette={frontSil} elevation="rest" contact={{ x: fx, y: FLOOR, w: FRONT.w }} />
      {glassH > 0.5 ? <path d={rectPath(glass.x, glass.y, glass.w, glass.h, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} /> : null}
      <path d={rectPath(fTile.x, fTile.y, fTile.w, fTile.h, r)} fill={`url(#${uid}cf)`} />
      <LitEdge x0={fTile.x + r} x1={gx - COL_W / 2 - EDGE.SLOT_LIP / k} y={TILE_TOP} k={k} />
      <LitEdge x0={gx + COL_W / 2 + EDGE.SLOT_LIP / k} x1={fTile.x + fTile.w - r} y={TILE_TOP} k={k} />
      <Slot x={gx} w={COL_W} k={k} />
      {rungs.length ? (
        <g stroke={COLOR.glass} strokeOpacity={ALPHA.glassLo} strokeWidth={f2(STROKE.HAIRLINE / k)}>
          {rungs.map((y, j) => (
            <line key={j} x1={f2(glass.x + hair)} x2={f2(glass.x + glass.w - hair)} y1={f2(y)} y2={f2(y)} />
          ))}
        </g>
      ) : null}
      {glassH > 0.5
        ? (() => {
            const x0 = glass.x + hair / 2;
            const x1 = glass.x + glass.w - hair / 2;
            const y0 = glass.y + hair / 2;
            const rr = Math.min(r, glassH / 2);
            return (
              <path
                d={`M${f2(x0)} ${f2(TILE_TOP)}V${f2(y0 + rr)}A${f2(rr)} ${f2(rr)} 0 0 1 ${f2(x0 + rr)} ${f2(y0)}H${f2(x1 - rr)}A${f2(rr)} ${f2(rr)} 0 0 1 ${f2(x1)} ${f2(y0 + rr)}V${f2(TILE_TOP)}`}
                fill="none"
                stroke={COLOR.glass}
                strokeOpacity={1}
                strokeWidth={f2(hair)}
              />
            );
          })()
        : null}

      {/* the chips in flight: each its own shadow, a level up while it travels */}
      {flying.map((c) => (
        <ElevationShadow key={c.i} silhouette={[{ d: chipPath(c) }]} elevation="rest" lift={c.fly} />
      ))}
      {/* amber: one glow pass for every chip */}
      <g style={{ filter: bloomFilter(k) }}>
        {landed.map(chipBody)}
        {flying.map(chipBody)}
      </g>
      {landed.length ? chipHot(landed[landed.length - 1], 1) : null}
      {flying.map((c) => chipHot(c, 1))}
      {landed.length === CHIP.n ? (
        <LightSweep x={cx - CHIP.w / 2} y={stackTop} w={CHIP.w} h={CHIP.n * CHIP.h} k={k} t={sweep} on="amber" r={CHIP.r} />
      ) : null}

      {/* ---- 4. the names, under the tiles (below the caption strip) ---- */}
      <Label x={ax} y={nameY} k={k} text="ALEX WANG" px={NAME_PX} tone="cream" enter={alexIn} />
      <Label x={fx} y={nameY} k={k} text="FRONTIER MODEL" px={NAME_PX} tone="cream" enter={frontierIn} />
    </g>
  );
};
