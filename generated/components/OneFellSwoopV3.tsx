// ---------------------------------------------------------------------------
// OneFellSwoopV3: the cut AFTER CityStates in the clip "Sheppard: centralized
// empires fell fast" (Dwarkesh with Si Sheppard), rebuilt in CityStates' own
// language: WALLED ORANGE STATES. Dwarkesh map style, mayaShared's world.
// 1080x1920, 24 fps, opaque. It keeps OneFellSwoopV2's story, word timings,
// swoop gesture, year readout and glide west and back; the picture of the
// polities (dots with spokes) and of the empire (a tree) is replaced.
//
// LINE (sequence 44.336-57.391 s): "...meant that the Spanish couldn't take
// out the Maya in one fell swoop. They couldn't do to the Maya what they'd done
// to the Aztecs. They had to reduce their cities one by one. And that was a
// long, laborious process that took almost to the end of the 17th century to
// finally consummate."
// DURATION = round(13.055 s x 23.976) = 313 frames.
//
// CHECK LINE: "One stroke took the whole Aztec empire because it was one walled
// country; the Maya were seventeen, so they had to be taken one at a time, and
// the last one stood until 1697."
//
// ELEMENT TYPES (no others): the map; orange walled states; the cream swoop;
// the year readout; the two labels.
//   A STANDING STATE = CityStates' cell: orange hatch, a solid orange wall,
//     teeth toward its neighbours, the slow shove going on at a low rate.
//   A FALLEN STATE = the same cell with the orange drained out: bare land and
//     a dashed cream outline (2.8 px, long dashes: a taken state still reads as a
//     taken state at phone width). The drain is ONE crisp front that starts
//     where the stroke lands and runs across THAT CELL ONLY. It stops at the
//     cell's own wall; nothing crosses a seam. That is the whole point.
//   THE AZTEC EMPIRE = ONE big state in the same language: its outer outline
//     (mayaMapData EMPIRE_D, the enclaves' interiors ignored, Soconusco not in
//     it) as one orange hatch behind ONE wall, teeth on its landward sides, no
//     seams inside. So one stroke drains all of it.
//
// THE MOTION (one continuous film), word -> frame
//   0. f0 IS CityStates' last frame (its scene clock runs on from frame 125:
//      same camera, cells, walls, teeth, shoves, MAYA over the Gulf). A slow
//      eased pull-back (k 3.63 -> 3.0 by ~f50) makes room.
//   1. "in one fell swoop" (one f56, fell f68, swoop f74): V2's big swoop
//      crosses the whole north of the peninsula (f48 -> f71) and lands on ONE
//      state in the west (unnamed). Only that state drains (f71-f81).
//   2. "They couldn't do to the Maya what they'd done to the Aztecs": one glide
//      west and out (f76 -> f117) until the empire, ONE big walled state, and
//      the Maya, many small ones, share the frame. AZTECS slides up f122 (f130) over the
//      bare land north of the empire and fades as the glide back starts.
//   3. "done" f121: the SAME swoop lands on the big state at f119. The orange
//      drains out of the WHOLE empire in one front (f119 -> f145).
//   4. "They had to reduce their cities" (f141-166): one glide back east and in
//      (f141 -> f176). The year slides up f160-172 over the Gulf of Campeche.
//   5. "one / by / one" f175 / f185 / f190 -> f238: the states fall singly, each
//      by its own drain from its north-west side (9 frames), the first three 2
//      frames before their words, then every 3-5 frames, west and north first,
//      until ONE is left: the Itza. The year steps to each fall's year.
//   6. "that took almost to the end of the 17th century" (f240-285): MAYA fades
//      (f236-250, its job done) and the camera travels and pushes ONTO the last
//      state (k 3.4, its centre at (575, 900) by f285:
//      35 px right of centre so the year has open water on the left); the year drifts once
//      to the Gulf, top-left; the last state stands whole among the empty lots and the year rolls 1544 -> 1697 (f242 -> f289, a true odometer).
//   7. "to finally consummate" f291 / f299: the big swoop once more, lands on
//      the Itza at f296; it drains f296-f306; the year holds 1697.
//
// FACTS OF RECORD (the readout is a displayed fact)
//   Francisco de Montejo's conquest of Yucatan, 1540-46, after failed entradas
//   from 1527. Merida founded on T'ho, January 1542 (firm). The Xiu of Mani
//   submitted 1542 (firm). The Uaymil-Chetumal campaign, 1544 (firm). Nojpeten,
//   the Itza capital, fell 13 March 1697: the last independent Maya kingdom.
//   APPROXIMATE: the other provinces' years are approximate submission dates
//   within the 1540-46 campaign (several rose again in 1546): Chanputun 1540,
//   Acalan 1540 (DOUBTFUL: Davila's entrada reached it in 1530; its submission
//   is not firmly dated), Ah Canul 1541, Chakan 1542, Ceh Pech 1542, Ah Kin
//   Chel 1542, Sotuta 1542, Cupul 1543, Tases 1543, Chikinchel 1543, Ecab 1544,
//   Cochuah 1544. Can Pech (1541) is the state the first stroke takes, a
//   figure of speech made visible, not an event: it simply stays fallen.
//   The last standing state is the cell that contains Nojpeten's own site
//   (-89.89, 16.93): checked in code (NOJPETEN_CELL).
//   The cells are SCHEMATIC (see cityStatesGeo.ts): Voronoi regions of the
//   provincial capitals after Roys 1957, not surveyed boundaries. The highland
//   Maya (conquered 1524-30) and the Lakandon (Sac Balam, 1695) are outside
//   this frame and are not drawn. The swoops are gestures, not routes.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { SWOOP_1, swoopAt } from "./OneFellSwoop";
import { CASE, EXCHANGES, FOCUS, HATCH_P, HATCH_W, LABEL_AT, T as CS_T, WALL, bump, cameraAt as csCameraAt, leanAt as csLeanAt, LEAN } from "./CityStates";
import { FINAL, GAP, MAINLAND, REGION_BOX, SEAMS, SITES, TEETH, TOOTH_HALF, TOOTH_LEN, TOOTH_PITCH, cellsAt, dOf, inRing, simplify, sweepS, teethD, type Tooth } from "./cityStatesGeo";
import { octaveDashes, pchip } from "./incaShared";
import { EMPIRE_D } from "./mayaMapData";
import { ACCENT, ACCENT_DEEP, DARK, FRAME_H, FRAME_W, INK, INK_FULL, MapPage, SEA, Swoop, TENOCHTITLAN, WorldSvg, camFor, clamp01, fellSC, hash, labelSlide, makeSwoop, screenOf, smoothstep, smootherstep, swayCam, swoopShapeOf, worldOf, project, type Cam, type P2 } from "./mayaShared";
import { YearOdometer } from "./apacheShared";

export const FPS = 24;
export const DURATION = 313; // round(13.055 s x 23.976)
export const CS0 = 125; // CityStates' last frame = this cut's f0

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
export const T = {
  pull: 50, // the opening pull-back lands
  swoop1: [48, 71] as [number, number],
  glide: [76, 117] as [number, number],
  swoop2: [99, 119] as [number, number],
  empireDrain: 26,
  aztecsLabel: 122,
  back: [141, 176] as [number, number],
  readout: 160,
  roll: [242, 289] as [number, number], // 1544 -> 1697
  last: [280, 296] as [number, number],
};
const DRAIN_F = 9; // frames: a state drains
const DRAIN_BIG = 10; // the two states a swoop lands on
const STEP_F = 4; // frames: a year step

// ---------------------------------------------------------------------------
// THE FALLS: state, the frame its drain starts, its year
// ---------------------------------------------------------------------------
const STRUCK_NAME = "Can Pech";
const FALL_LIST: [string, number, number][] = [
  ["Chanputun", 173, 1540],
  ["Acalan", 183, 1540],
  ["Ah Canul", 188, 1541],
  ["Chakan", 192, 1542],
  ["Ceh Pech", 196, 1542],
  ["Tutul Xiu", 201, 1542],
  ["Ah Kin Chel", 205, 1542],
  ["Sotuta", 210, 1542],
  ["Cupul", 214, 1543],
  ["Chikinchel", 219, 1543],
  ["Tases", 222, 1543],
  ["Ecab", 226, 1544],
  ["Cochuah", 231, 1544],
  ["Uaymil", 234, 1544],
  ["Chetumal", 238, 1544],
];
const idx = (name: string) => {
  const i = FINAL.findIndex((c) => c.name === name);
  if (i < 0) throw new Error(`no state ${name}`);
  return i;
};
const STRUCK = idx(STRUCK_NAME);
const ITZA = idx("Itza");
const N = FINAL.length;
/** each state's drain: start frame, length, origin (world), reach */
export const FALLS: { f: number; len: number; o: P2; r: number }[] = FINAL.map((c, i) => {
  const big = i === STRUCK || i === ITZA;
  const f = i === STRUCK ? T.swoop1[1] : i === ITZA ? T.last[1] : (FALL_LIST.find(([n]) => n === c.name) ?? ["", Infinity, 0])[1];
  if (!Number.isFinite(f)) throw new Error(`state ${c.name} never falls`);
  // a stroke's drain starts where it lands; the others' from the cell's north-west point
  let o: P2 = c.c;
  if (!big) {
    o = c.ring[0];
    for (const p of c.ring) if (sweepS(p) < sweepS(o)) o = p;
  }
  const r = Math.max(...c.ring.map((p) => Math.hypot(p[0] - o[0], p[1] - o[1]))) + 1;
  return { f, len: big ? DRAIN_BIG : DRAIN_F, o, r };
});
const drainEase = (p: number) => 0.4 * p + 0.6 * smoothstep(p);

// ---------------------------------------------------------------------------
// THE AZTEC EMPIRE as one state: its outer ring, its teeth on the landward sides
// ---------------------------------------------------------------------------
const EMPIRE: P2[] = EMPIRE_D.slice(1, EMPIRE_D.indexOf("Z"))
  .split("L")
  .map((q) => q.split(",").map(Number) as P2);
const EMPIRE_RING_D = dOf(EMPIRE);
const EMPIRE_BOX = (() => {
  const xs = EMPIRE.map((p) => p[0]);
  const ys = EMPIRE.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
})();
const EMPIRE_REACH = Math.max(...EMPIRE.map((p) => Math.hypot(p[0] - TENOCHTITLAN[0], p[1] - TENOCHTITLAN[1]))) + 1;
const EMPIRE_TEETH: Tooth[] = (() => {
  const s = simplify([...EMPIRE, EMPIRE[0]], 0.4);
  const cum = [0];
  for (let i = 1; i < s.length; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  const len = cum[cum.length - 1];
  const at = (q: number): P2 => {
    const u = ((q % len) + len) % len;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < u) i++;
    const w = (u - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [s[i - 1][0] + (s[i][0] - s[i - 1][0]) * w, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * w];
  };
  const n = Math.floor(len / TOOTH_PITCH);
  const pitch = len / n;
  const out: Tooth[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * pitch;
    const p = at(u);
    const a = at(u - pitch * 0.5);
    const b = at(u + pitch * 0.5);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // none at corners or on a crumpled stretch of the line
    if (l < pitch * 0.9) continue;
    const t: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    if (Math.abs((p[0] - a[0]) * t[1] - (p[1] - a[1]) * t[0]) > 0.9) continue;
    let nrm: P2 = [t[1], -t[0]];
    if (inRing(EMPIRE, p[0] + nrm[0] * 2, p[1] + nrm[1] * 2)) nrm = [-nrm[0], -nrm[1]];
    // a tooth only where the wall faces land (a neighbour), and never back into the empire
    let ok = true;
    for (const du of [-TOOTH_HALF * 1.2, 0, TOOTH_HALF * 1.2])
      for (const dn of [1.2, TOOTH_LEN + 2.5]) {
        const x = p[0] + t[0] * du + nrm[0] * dn;
        const y = p[1] + t[1] * du + nrm[1] * dn;
        if (!inRing(MAINLAND, x, y) || inRing(EMPIRE, x, y)) ok = false;
      }
    if (ok) out.push({ base: p, n: nrm, t, seam: 0, cell: 0 });
  }
  return out;
})();
const EMPIRE_TEETH_D = teethD(EMPIRE_TEETH, 1);

// ---------------------------------------------------------------------------
// The camera. CityStates' last camera -> M1 (the Maya, k 3.0, creeping out) ->
// W (the wide: the pair's middle at the true centre) -> M2 (the Maya again,
// then the slow move toward the last state). Each framing creeps; the blends
// are single eased moves.
// ---------------------------------------------------------------------------
const CS_END = csCameraAt(CS0);
const camM1 = (f: number): Cam => camFor(FOCUS, 3.0 * Math.exp(-0.0009 * (f - T.pull)), 540, 960);
const PAIR: P2 = [(EMPIRE_BOX.x0 + REGION_BOX.x1) / 2, (Math.min(EMPIRE_BOX.y0, REGION_BOX.y0) + Math.max(EMPIRE_BOX.y1, REGION_BOX.y1)) / 2];
export const WIDE_K = 1.1;
const camW = (f: number): Cam => camFor(PAIR, WIDE_K * Math.exp(-0.0006 * (f - T.glide[1])), 540, 960);
type WKey = { f: number; k: number; sx: number; sy: number };
// the last framing: the last state's centre at (575, 900), expressed as where FOCUS then sits
const onItza = (f: number, k: number, sx: number, sy: number): WKey => ({ f, k, sx: sx + (FOCUS[0] - FINAL[ITZA].c[0]) * k, sy: sy + (FOCUS[1] - FINAL[ITZA].c[1]) * k });
const M2_KEYS: WKey[] = [
  { f: 141, k: 2.96, sx: 625, sy: 965 },
  { f: 176, k: 3.0, sx: 625, sy: 960 },
  { f: 238, k: 3.03, sx: 625, sy: 948 },
  onItza(285, 3.4, 575, 900),
  onItza(313, 3.44, 575, 898),
];
const M2_LK = pchip(M2_KEYS.map((q) => [q.f, Math.log(q.k)] as [number, number]));
const M2_SX = pchip(M2_KEYS.map((q) => [q.f, q.sx] as [number, number]));
const M2_SY = pchip(M2_KEYS.map((q) => [q.f, q.sy] as [number, number]));
const camM2 = (f: number): Cam => camFor(FOCUS, Math.exp(M2_LK(f)), M2_SX(f), M2_SY(f));
const mixCam = (a: Cam, b: Cam, g: number): Cam => {
  if (g <= 0) return a;
  if (g >= 1) return b;
  const k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * g);
  // the centre rides 1 / k, so a point of the page crosses the screen evenly through the zoom
  const w = Math.abs(a.k - b.k) < 1e-6 ? g : (1 / k - 1 / a.k) / (1 / b.k - 1 / a.k);
  return { k, cx: a.cx + (b.cx - a.cx) * w, cy: a.cy + (b.cy - a.cy) * w };
};
export const cameraAt = (f: number): Cam => {
  if (f <= 0) return CS_END;
  const g0 = smoothstep(f / T.pull);
  const g1 = smoothstep((f - T.glide[0]) / (T.glide[1] - T.glide[0]));
  const g2 = smoothstep((f - T.back[0]) / (T.back[1] - T.back[0]));
  if (g2 >= 1) return camM2(f);
  const near = mixCam(CS_END, camM1(f), g0);
  const wide = mixCam(near, camW(f), g1);
  return mixCam(wide, camM2(f), g2);
};

// ---------------------------------------------------------------------------
// The house size law of this cut: CityStates' sizes are world-anchored; below
// k 3 they shrink only as k^0.5 so the walls keep their weight in the wide
// ---------------------------------------------------------------------------
const sig = (k: number) => (k >= 3 ? 1 : Math.sqrt(3 / k));

// ---------------------------------------------------------------------------
// THE SHOVES go on after CityStates' own (its clock): a low rate, only between
// two standing states, never while one of them is about to fall
// ---------------------------------------------------------------------------
const MORE = (() => {
  const busy = FINAL.map(() => 0);
  const span = CS_T.shoveF + CS_T.answer;
  for (const e of EXCHANGES) {
    busy[e.a] = Math.max(busy[e.a], e.t0 + span);
    busy[e.b] = Math.max(busy[e.b], e.t0 + span);
  }
  const out: { a: number; b: number; n: P2; t0: number }[] = [];
  let t = CS0 + 3;
  let turn = 0;
  while (t < CS0 + DURATION) {
    const order = SEAMS.map((s, q) => ({ s, key: hash(q * 7 + turn, 21) })).sort((x, y) => x.key - y.key);
    for (const { s } of order) {
      const flip = hash(turn, 5) > 0.5;
      const a = flip ? s.j : s.i;
      const b = flip ? s.i : s.j;
      if (busy[a] > t || busy[b] > t) continue;
      if (t + span + 2 > CS0 + Math.min(FALLS[a].f, FALLS[b].f)) continue;
      const pa = SITES[a].p;
      const pb = SITES[b].p;
      const l = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      out.push({ a, b, n: [(pb[0] - pa[0]) / l, (pb[1] - pa[1]) / l], t0: t });
      busy[a] = busy[b] = t + span;
      break;
    }
    turn++;
    t += 7 + Math.round(3 * hash(turn, 9));
  }
  return out;
})();
const leanAt = (f: number): P2[] => {
  const cf = CS0 + f;
  const v = csLeanAt(cf);
  for (const e of MORE) {
    const wa = LEAN * bump((cf - e.t0) / CS_T.shoveF);
    const wb = LEAN * bump((cf - e.t0 - CS_T.answer) / CS_T.shoveF);
    if (wa === 0 && wb === 0) continue;
    v[e.a] = [v[e.a][0] + e.n[0] * wa, v[e.a][1] + e.n[1] * wa];
    v[e.b] = [v[e.b][0] - e.n[0] * wb, v[e.b][1] - e.n[1] * wb];
  }
  return v;
};
const TEETH_OF = FINAL.map((_, i) => TEETH.filter((t) => t.cell === i));

// ---------------------------------------------------------------------------
// The strokes: V1's ONE shape
// ---------------------------------------------------------------------------
const S1_PTS = SWOOP_1.pts;
const SHAPE = swoopShapeOf(S1_PTS[0], project(-88.3, 21.6), project(-90.8, 21.0), S1_PTS[S1_PTS.length - 1]);
const STRUCK_P = FINAL[STRUCK].c;
const S1_FROM = worldOf([1030, 600], cameraAt(T.swoop1[0]));
export const SWOOP_A = makeSwoop(S1_FROM, STRUCK_P, SHAPE);
const S2_SCALE = 300 / WIDE_K / SWOOP_A.len;
export const SWOOP_B = makeSwoop([TENOCHTITLAN[0] - (STRUCK_P[0] - S1_FROM[0]) * S2_SCALE, TENOCHTITLAN[1] - (STRUCK_P[1] - S1_FROM[1]) * S2_SCALE], TENOCHTITLAN, SHAPE);
export const SWOOP_C = makeSwoop(worldOf([930, 330], cameraAt(T.last[0])), FINAL[ITZA].c, SHAPE);
// Nojpeten's own site and the cell it falls in (the header's claim is checked here)
export const NOJPETEN = project(-89.89, 16.93);
export const NOJPETEN_CELL = FINAL.findIndex((c) => inRing(c.ring, NOJPETEN[0], NOJPETEN[1]));

// ---------------------------------------------------------------------------
// THE YEAR: a real-valued clock; the wheels are a true odometer whose units
// wheel dwells on each year (a still reads a real year)
// ---------------------------------------------------------------------------
const YEAR_0 = FALL_LIST[0][2];
const SEGS: { f0: number; f1: number; to: number }[] = (() => {
  const out: { f0: number; f1: number; to: number }[] = [];
  let y = YEAR_0;
  for (const [, f, year] of FALL_LIST) {
    if (year === y) continue;
    out.push({ f0: f - 1, f1: f - 1 + STEP_F, to: year });
    y = year;
  }
  return out;
})();
export const yearAt = (f: number) => {
  let y = YEAR_0;
  for (const s of SEGS) {
    if (f <= s.f0) return y;
    if (f < s.f1) return y + (s.to - y) * smoothstep((f - s.f0) / (s.f1 - s.f0));
    y = s.to;
  }
  // the long roll: gentle start, fastest in the middle, gentle landing
  return y + (1697 - y) * smootherstep(clamp01((f - T.roll[0]) / (T.roll[1] - T.roll[0])));
};
const dwell = (fr: number) => smoothstep((fr - 0.3) / 0.4);
export const columnsAt = (f: number) => {
  const y = yearAt(f);
  const whole = Math.floor(y + 1e-9);
  const pos: number[] = [(whole % 10) + dwell(y - whole)];
  for (let i = 1; i < 4; i++) pos.push((Math.floor(whole / Math.pow(10, i)) % 10) + clamp01(pos[i - 1] - 9));
  return pos;
};
export const READ_SIZE = 88;
// the readout rides with the map: over the Gulf of Campeche, west of the peninsula
export const READ_AT: P2 = [FOCUS[0] - 157, FOCUS[1] - 112];
// ... until the move onto the last state: then ONE eased drift to a fixed place over the Gulf, top-left
export const READ_END: P2 = [122, 204];
export const readAt = (f: number, cam: Cam): P2 => {
  const p = screenOf(READ_AT, cam);
  const g = smoothstep((f - 238) / (285 - 238));
  return [p[0] + (READ_END[0] - p[0]) * g, p[1] + (READ_END[1] - p[1]) * g];
};
export const mayaOpacity = (f: number) => 1 - smoothstep((f - 236) / 14);
export const aztecsOpacity = (f: number) => 1 - smoothstep((f - 141) / 9);
// AZTECS: over the bare land directly north of the empire; it rides with the land and fades as the glide back starts
const LABEL_AZTECS: P2 = worldOf([150, 724], camW(126));
const AZTECS_SIZE = 42;
export const MAYA_SIZE = (k: number) => 84 * Math.pow(Math.min(1, k / 3), 0.37);
/** in the wide the (relatively bigger) label lifts off the coast a little (screen px) */
export const MAYA_LIFT = (k: number) => 42 * (1 - Math.min(1, k / 3));
export { LABEL_AT, LABEL_AZTECS };

// ---------------------------------------------------------------------------
// ONE STATE: standing where the drain has not reached, fallen where it has
// ---------------------------------------------------------------------------
type Drain = { o: P2; r: number; p: number };
const State: React.FC<{ id: string; d: string; outlineD: string; teeth: string; k: number; drain: Drain | null; box: { x0: number; x1: number; y0: number; y1: number } }> = ({
  id,
  d,
  outlineD,
  teeth,
  k,
  drain,
  box,
}) => {
  const p = drain ? drain.p : 0;
  const s = sig(k);
  const R = drain ? drain.r * drainEase(p) : 0;
  const part = p > 0 && p < 1;
  return (
    <g>
      {part && drain ? (
        <defs>
          <mask id={`${id}Out`} maskUnits="userSpaceOnUse" x={box.x0 - 20} y={box.y0 - 20} width={box.x1 - box.x0 + 40} height={box.y1 - box.y0 + 40}>
            <rect x={box.x0 - 20} y={box.y0 - 20} width={box.x1 - box.x0 + 40} height={box.y1 - box.y0 + 40} fill="#fff" />
            <circle cx={drain.o[0]} cy={drain.o[1]} r={R} fill="#000" />
          </mask>
          <clipPath id={`${id}In`}>
            <circle cx={drain.o[0]} cy={drain.o[1]} r={R} />
          </clipPath>
        </defs>
      ) : null}
      {p < 1 ? (
        <g mask={part ? `url(#${id}Out)` : undefined}>
          <defs>
            <clipPath id={`${id}Clip`}>
              <path d={d} />
            </clipPath>
          </defs>
          <path d={d} fill={ACCENT_DEEP} fillOpacity={0.3} />
          <path d={d} fill="url(#v3Hatch)" opacity={0.86} />
          <g clipPath={`url(#${id}Clip)`} fill="none" strokeLinejoin="round">
            <path d={d} stroke={DARK} strokeOpacity={0.62} strokeWidth={2 * (WALL + CASE) * s} />
            <path d={d} stroke={ACCENT} strokeWidth={2 * WALL * s} />
          </g>
          {teeth ? <path d={teeth} fill={ACCENT} /> : null}
        </g>
      ) : null}
      {p > 0 ? (
        <g clipPath={part ? `url(#${id}In)` : undefined} fill="none" strokeLinecap="butt" strokeLinejoin="round">
          {octaveDashes(k, 22).map((q) => (
            <path key={q.d} d={outlineD} stroke={INK} strokeOpacity={0.68 * q.op} strokeWidth={2.8 / k} strokeDasharray={`${(q.d * 0.58).toFixed(4)} ${(q.d * 0.42).toFixed(4)}`} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

const OneFellSwoopV3: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame + CS0);
  const k = cam.k;
  const s = sig(k);

  // --- the cells of this frame (CityStates' own computation, its clock running on)
  const lean = leanAt(frame);
  const rings = cellsAt(() => GAP, lean).map((c) => dOf(c.ring));

  // --- the hatch: CityStates' own while close; every other line fades out toward the wide
  const thin = smoothstep((2.6 - k) / 0.6);

  const empireIn = screenOf([EMPIRE_BOX.x1, 0], cam)[0] > -30;
  const eP = clamp01((frame - T.swoop2[1]) / T.empireDrain);

  const sA = swoopAt(frame, T.swoop1, SWOOP_A.len);
  const sB = swoopAt(frame, T.swoop2, SWOOP_B.len);
  const sC = swoopAt(frame, T.last, SWOOP_C.len);

  const [lx, ly] = screenOf(LABEL_AT, cam);
  const SIZE = MAYA_SIZE(k);
  const SPACING = 0.34;
  const rl = labelSlide(frame, T.readout, 12, 9);
  const [rx, ry] = readAt(frame, cam);
  const al = labelSlide(frame, T.aztecsLabel, 8, 7);
  const [ax, ay] = screenOf(LABEL_AZTECS, cam);
  const mOp = mayaOpacity(frame);
  const aOp = al.op * aztecsOpacity(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <MapPage cam={cam} vignette={vignette}>
        <WorldSvg cam={cam}>
          <defs>
            {thin <= 0 ? (
              <pattern id="v3Hatch" patternUnits="userSpaceOnUse" width={HATCH_P} height={HATCH_P} patternTransform="rotate(45)">
                <line x1={0} y1={-1} x2={0} y2={HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W * s} />
                <line x1={HATCH_P} y1={-1} x2={HATCH_P} y2={HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W * s} />
              </pattern>
            ) : (
              <pattern id="v3Hatch" patternUnits="userSpaceOnUse" width={2 * HATCH_P} height={2 * HATCH_P} patternTransform="rotate(45)">
                <line x1={0} y1={-1} x2={0} y2={2 * HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W * s} />
                <line x1={HATCH_P} y1={-1} x2={HATCH_P} y2={2 * HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W * s} strokeOpacity={1 - thin} />
                <line x1={2 * HATCH_P} y1={-1} x2={2 * HATCH_P} y2={2 * HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W * s} />
              </pattern>
            )}
          </defs>

          {/* THE AZTEC EMPIRE: one state */}
          {empireIn ? (
            <State id="v3Emp" d={EMPIRE_RING_D} outlineD={EMPIRE_RING_D} teeth={EMPIRE_TEETH_D} k={k} box={EMPIRE_BOX} drain={eP > 0 ? { o: TENOCHTITLAN, r: EMPIRE_REACH, p: eP } : null} />
          ) : null}

          {/* THE MAYA: seventeen */}
          {FINAL.map((c, i) => {
            const fl = FALLS[i];
            const p = clamp01((frame - fl.f) / fl.len);
            return (
              <State
                key={i}
                id={`v3C${i}`}
                d={rings[i]}
                outlineD={c.d}
                teeth={p < 1 ? teethD(TEETH_OF[i], 1, lean[i][0], lean[i][1]) : ""}
                k={k}
                box={REGION_BOX}
                drain={p > 0 ? { o: fl.o, r: fl.r, p } : null}
              />
            );
          })}

          {/* THE STROKES */}
          <Swoop path={SWOOP_A} cam={cam} head={sA.head} tail={sA.tail} opacity={sA.opacity} />
          <Swoop path={SWOOP_B} cam={cam} head={sB.head} tail={sB.tail} opacity={sB.opacity} />
          <Swoop path={SWOOP_C} cam={cam} head={sC.head} tail={sC.tail} opacity={sC.opacity} />
        </WorldSvg>

        {/* THE LABELS */}
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {mOp > 0.002 ? (
            <text
              x={lx + (SIZE * SPACING) / 2}
              y={ly - MAYA_LIFT(k)}
              textAnchor="middle"
              opacity={INK_FULL * mOp}
              fill={INK}
              stroke={SEA}
              strokeOpacity={0.7}
              strokeWidth={SIZE * 0.11}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fontFamily: fellSC, fontSize: SIZE, letterSpacing: SIZE * SPACING }}
            >
              MAYA
            </text>
          ) : null}
          {aOp > 0.002 ? (
            <text
              x={ax + (AZTECS_SIZE * 0.3) / 2}
              y={ay + al.dy}
              textAnchor="middle"
              opacity={INK_FULL * aOp}
              fill={INK}
              stroke={DARK}
              strokeOpacity={0.75}
              strokeWidth={AZTECS_SIZE * 0.14}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fontFamily: fellSC, fontSize: AZTECS_SIZE, letterSpacing: AZTECS_SIZE * 0.3 }}
            >
              AZTECS
            </text>
          ) : null}
        </svg>

        {/* THE YEAR */}
        <YearOdometer frame={frame} yearAt={yearAt} columnsAt={columnsAt} x={rx} top={ry - 0.6 * READ_SIZE + rl.dy} size={READ_SIZE} opacity={rl.op} maxBlur={2} samples={1} fadePx={6} />
      </MapPage>
    </AbsoluteFill>
  );
};

export default OneFellSwoopV3;
export { N as STATE_COUNT };
