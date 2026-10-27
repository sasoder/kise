// manchuriaAutarkyMotionV2.ts — what ManchuriaAutarkyV2 changes over manchuriaAutarkyMotion.ts
// (which it re-exports unchanged: the loop geometry, the front's field, the arrows, the lanes'
// geometry). V2 adds: a new camera track, the resources rising on "enough resources", the
// South Manchuria Railway already running from f0 (wagons out of the Changchun terminal and
// into the Dairen terminal), the loop to Japan drawn on "within their own empire", and the
// foreign trade's withdrawal on "worry about trade". React-free, so the beat frames can be
// printed with bun for checks.
export * from "./manchuriaAutarkyMotion";
import {
  ANSHAN,
  FUSHUN,
  GAP,
  GLYPH,
  L_LOOP,
  LANES,
  LOOP,
  MUKDEN,
  N_SLOTS,
  S_ANSHAN,
  S_DAIREN,
  S_J,
  S_MUKDEN,
  S_TSURUGA,
  type P2,
  type Src,
  TRUNK_RAIL,
  V,
  lengthOf,
  pointAt,
} from "./manchuriaAutarkyMotion";
import { project } from "./pearlAsiaMapData";

// ---------------------------------------------------------------------------
// CAMERA KEYS { f, x, y, k } (world point on the frame centre).
//   f0-48   one steady drift from the wide on Japan and Korea toward Manchuria (moving at f0)
//   48-96   in on south Manchuria (k ~3.9, loose enough to keep the coast, the railway and
//           Manchuria's shape readable): the front, then the railway already running
//   96-150  back out, panning south, onto the empire and the sea-lanes; the loop's south
//           stretch (world y 846-862) is held above the caption band (screen y < 1080):
//           y >= 862 - 110 / k; framed low enough that the lanes' ports sit above the band
//   150-184 a slow creep while the outside trade withdraws (the camera calm)
//   184-205 one push back up onto Manchuria (k 2.9 -> 3.7), landing by "Manchuria" (205)
//   x is held so the ingots (west of the railway) keep clear of the left edge
// ---------------------------------------------------------------------------
export const CAM_KEYS_V2 = [
  { f: 0, x: 835, y: 790, k: 2.25 },
  { f: 18, x: 804, y: 749, k: 2.38 },
  { f: 48, x: 752, y: 684, k: 2.62 },
  { f: 78, x: 745, y: 701, k: 3.8 },
  { f: 96, x: 748, y: 713, k: 3.95 },
  { f: 124, x: 780, y: 842, k: 3.45 },
  { f: 150, x: 792, y: 872, k: 2.92 },
  { f: 184, x: 790, y: 874, k: 2.9 },
  { f: 200, x: 762, y: 836, k: 3.68 },
  { f: 206, x: 760, y: 836, k: 3.72 },
];

// ---------------------------------------------------------------------------
// THE SEA-LANES: V1's three Pacific lanes unchanged; the South-east Asia lane to Nagasaki now
// follows the China coast north past the Yangtze mouth and runs east along ~32.5 N into
// Nagasaki (the old Shanghai-Nagasaki run), so its visible stretch sits above the band.
// ---------------------------------------------------------------------------
const ll = (pts: [number, number][]): P2[] => pts.map(([lo, la]) => project(lo, la));
const smoothV2 = (pts: P2[], per = 6): P2[] => {
  const out: P2[] = [];
  const n = pts.length;
  const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[n - 1]);
  return out;
};
export const LANES_V2: P2[][] = [
  LANES[0],
  LANES[1],
  LANES[2],
  smoothV2(
    ll([
      [111, 9],
      [114.5, 15.5],
      [117.6, 21.0],
      [119.0, 23.2],
      [119.4, 24.3],
      [120.35, 25.5],
      [121.7, 27.6],
      [122.7, 29.8],
      [123.3, 31.3],
      [124.6, 32.25],
      [126.6, 32.5],
      [128.4, 32.42], // south of the Goto islands
      [129.4, 32.6],
      [129.82, 32.73],
      [129.88, 32.76],
    ]),
  ),
];
export const LANE_LEN_V2 = LANES_V2.map(lengthOf);

// ---------------------------------------------------------------------------
// THE RESOURCES rise on "enough resources" (enough 119, resources 130), one after another,
// each whole out of the ground behind a ground line (the line draws out first).
// ---------------------------------------------------------------------------
export const RISE_V2: Record<Src, number> = { soy: 119, coal: 126, iron: 133 };
export const GROUND_FRAMES = 3; // the ground line draws out WITH the rise (never alone)
export const RISE_FRAMES = 9;
/** the sack stands a little lower than V1's (its taller V2 glyph clears the MANCHURIA label) */
export const GLYPH_V2: Record<Src, P2> = { ...GLYPH, soy: [721, 657] };
export const FEED_V2: Record<Src, P2[]> = {
  coal: [[GLYPH_V2.coal[0] - 2, GLYPH_V2.coal[1] - 7], [GLYPH_V2.coal[0] - 9, GLYPH_V2.coal[1] + 1], FUSHUN, MUKDEN],
  iron: [[GLYPH_V2.iron[0] + 2, GLYPH_V2.iron[1] - 7], [GLYPH_V2.iron[0] + 13, GLYPH_V2.iron[1] + 0.5], ANSHAN],
  soy: [[GLYPH_V2.soy[0] + 2, GLYPH_V2.soy[1] - 8], [GLYPH_V2.soy[0] + 8, GLYPH_V2.soy[1] + 0.5], TRUNK_RAIL[0]],
};
export const FEED_LEN_V2: Record<Src, number> = { coal: lengthOf(FEED_V2.coal), iron: lengthOf(FEED_V2.iron), soy: lengthOf(FEED_V2.soy) };
/** each source's first wagon leaves its glyph (and draws its spur) as the glyph stands up */
export const SRC_START: Record<Src, number> = {
  soy: RISE_V2.soy + RISE_FRAMES,
  coal: RISE_V2.coal + RISE_FRAMES,
  iron: RISE_V2.iron + RISE_FRAMES,
};

// ---------------------------------------------------------------------------
// THE LOOP TO JAPAN is drawn on "within their own empire" (within 145, empire 161): a pen
// tip at constant speed from Dairen round Korea, under Japan, across the Sea of Japan and
// back by rail to Changchun.
// ---------------------------------------------------------------------------
export const LOOP_T0 = 145;
export const LOOP_T1 = 161;
export const VD = (L_LOOP - S_DAIREN) / (LOOP_T1 - LOOP_T0);
export const loopTip = (f: number) => (f < LOOP_T0 ? S_DAIREN : Math.min(L_LOOP, S_DAIREN + VD * (f - LOOP_T0)));
const tipAt = (s: number) => LOOP_T0 + (s - S_DAIREN) / VD;

// ---------------------------------------------------------------------------
// THE WAGONS: one conveyor of evenly spaced slots round the loop at constant speed V.
// Slot classes (j mod 3) 0 = soy (Changchun), 1 = coal (Mukden), 2 = iron (Anshan).
//   - the railway is Japan's from f0: classes 0 and 1 leave the Changchun terminal ("smr")
//     until each source's own wagons take their slots over;
//   - at Dairen, before the loop is drawn, every wagon runs into the Dairen terminal;
//   - under Kyushu Japan takes every other wagon in;
//   - out of Tsuruga (from under Honshu) Japan fills every empty slot once the pen has
//     passed, so the return leg runs too.
// ---------------------------------------------------------------------------
export type WKind = "smr" | "jp" | Src;
export type WagonV2 = { kind: WKind; born: number; joinS: number; joinT: number; endT: number; id: number };
const CLASS_SRC: Src[] = ["soy", "coal", "iron"];
const JOIN_S: Record<Src, number> = { soy: 0, coal: S_MUKDEN, iron: S_ANSHAN };
export const SIM_V2 = (() => {
  const DT = GAP / V;
  const T0 = -500;
  type Ev = { t: number; at: "ch" | "mk" | "an" | "da" | "sj" | "ts"; j: number };
  const evs: Ev[] = [];
  for (let n = 0; ; n++) {
    const tB = T0 + n * DT; // slot (n mod N) passes Changchun (s = 0) at tB
    if (tB > 300) break;
    const j = n % N_SLOTS;
    evs.push({ t: tB, at: "ch", j });
    evs.push({ t: tB + S_MUKDEN / V, at: "mk", j });
    evs.push({ t: tB + S_ANSHAN / V, at: "an", j });
    evs.push({ t: tB + S_DAIREN / V, at: "da", j });
    evs.push({ t: tB + S_J / V, at: "sj", j });
    evs.push({ t: tB + S_TSURUGA / V, at: "ts", j });
  }
  evs.sort((a, b) => a.t - b.t);
  const occ: (WagonV2 | null)[] = new Array(N_SLOTS).fill(null);
  const wagons: WagonV2[] = [];
  const add = (kind: WKind, born: number, joinS: number, joinT: number, j: number) => {
    const w: WagonV2 = { kind, born, joinS, joinT, endT: Infinity, id: wagons.length };
    wagons.push(w);
    occ[j] = w;
  };
  let kc = 0;
  for (const e of evs) {
    const cls = e.j % 3;
    const w = occ[e.j];
    if (e.at === "ch") {
      if (w) continue;
      if (cls === 0) {
        const born = e.t - FEED_LEN_V2.soy / V;
        if (born >= SRC_START.soy) add("soy", born, 0, e.t, e.j);
        else add("smr", e.t, 0, e.t, e.j);
      } else if (cls === 1 && e.t + S_MUKDEN / V < SRC_START.coal + FEED_LEN_V2.coal / V) add("smr", e.t, 0, e.t, e.j);
    } else if (e.at === "mk" || e.at === "an") {
      const src = e.at === "mk" ? "coal" : "iron";
      if (w || CLASS_SRC[cls] !== src) continue;
      const born = e.t - FEED_LEN_V2[src] / V;
      if (born >= SRC_START[src]) add(src, born, JOIN_S[src], e.t, e.j);
    } else if (e.at === "da") {
      if (w && e.t < LOOP_T0) {
        w.endT = e.t + 0.4; // into the Dairen terminal
        occ[e.j] = null;
      }
    } else if (e.at === "sj") {
      if (!w) continue;
      kc++;
      if (kc % 2 === 0) {
        w.endT = e.t;
        occ[e.j] = null;
      }
    } else if (e.at === "ts") {
      if (!w && e.t >= tipAt(S_TSURUGA) + 1) add("jp", e.t, S_TSURUGA, e.t, e.j);
    }
  }
  const first = {} as Record<Src, WagonV2 | undefined>;
  for (const src of CLASS_SRC) first[src] = wagons.find((w) => w.kind === src);
  return { wagons, first };
})();
/** a wagon's world position + heading at a frame, or null when it is not on the map */
export const wagonAtV2 = (w: WagonV2, f: number) => {
  if (f < w.born || f >= w.endT) return null;
  if (f < w.joinT) {
    if (w.kind === "smr" || w.kind === "jp") return null;
    return pointAt(FEED_V2[w.kind], V * (f - w.born));
  }
  return pointAt(LOOP, (w.joinS + V * (f - w.joinT)) % L_LOOP);
};
/** the loop arclength intervals drawn at frame f: the railway (Japan's since 1905), then the pen */
export const drawnIntervalsV2 = (f: number): [number, number][] => [[0, loopTip(f)]];

// ---------------------------------------------------------------------------
// THE WITHDRAWAL ("they don't have to worry about trade": worry 178, about 182, trade 187).
// Per lane i: every freighter still at sea turns back to seaward at turn[i] (a half circle,
// U_V world px / frame), then runs out along its lane in one eased move, out of frame by
// OUT_END; the lane's port end retracts out through its frame edge, tipStart .. TIP_END.
// ---------------------------------------------------------------------------
export const W = {
  turn: LANES.map((_, i) => 168 + i * 0.7),
  U_V: 6, // world px / frame round the turn
  OUT_END: 186, // every freighter out of frame
  tipStart: LANES.map((_, i) => 177 + i * 0.5),
  TIP_END: 187, // every lane gone by "trade"
  DOCK_MARGIN: 60, // a ship this close to its port at the turn docks instead (no turn over land)
  R: 20, // world px: the turn's radius (the hull is 46 long: a wide, clean arc)
};
