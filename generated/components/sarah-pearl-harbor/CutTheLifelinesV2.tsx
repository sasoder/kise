// ---------------------------------------------------------------------------
// CutTheLifelinesV2 — cold-review V2 of CutTheLifelines. Sarah Paine, "How the
// Depression pushed Japan to Pearl Harbor" (Dwarkesh map style, the ASIA world
// of pearlShared). 1080x1920, 24 fps, 230 frames (timeline seq 1763..1992, all
// 230 frames used).
//
// CHECK LINE: "Japan moved south to cut the roads that fed Nationalist China,
// betting China would then collapse."
//
// LINE: "And so this is when the Japanese decide, OK, we're going to cut off all
// the foreign aid going into the Nationalists. And then surely they'll cave and
// we'll take over China. And that'll be good. So Americans…"
// WORDS (local frames, ±2): And 2, so 5, this 9, when 18, the 29, Japanese 32,
// decide 44, OK 55, we're 65, cut 73, off 81, all 88, foreign 97, aid 111,
// going 118, into 125, Nationalists 132, And 143, surely 152, they'll 160,
// cave 167, we'll 177, take 182, over 187, China 193, that'll 203, good 211,
// So 219, Americans 229.
//
// THE MOTION (r2): the aid is alive from f0 — big cream convoy wagons leave the
// ports at constant speed up the Burma Road (Rangoon -> Lashio -> Kunming ->
// Chongqing) and the Yunnan railway (Haiphong -> Kunming) under a strong push.
// On "the Japanese decide" Japan's front marches out of the Gulf of Tonkin up
// the Red River (the seized rail only half-toned); on "cut" it reaches the
// border and the line SNAPS there (a wide gap, the far end springing back); the
// stretch beyond drains to dead grey in 9 f and its wagons brake to a stop. On
// "foreign aid" a bold orange closure bar is driven across the Burma Road past
// Lashio: the road snaps, the convoys behind keep coming and bunch up against
// the bar, and the drain runs slowly up the road with the camera, reaching
// Chongqing dead on "cave" (164; the last wagons stopped short of the city).
// NATIONALISTS lands on its word fully in frame. The pull-back settles ~f180;
// then JAPAN'S BET (it never happened) grows from "take": a PLANNED zone (faint
// wash, sparse dashed -45 deg hatch, heavy dashed cased edge — unlike the dense
// solid-hatched, solid-edged held land) leaves Japan's real front, sweeps
// "over China" and closes toward the ringed city, stopping short of it (no
// collapse), never drawing back, creeping on under a slow push to the cut.
//
// r3: wagons run singly with clear gaps; BOTH cuts use one grammar (a bold dashed
// orange bar driven across the line, wagons bunching behind it); on "cave" (167)
// a dashed orange PLANNED ring closes in from beyond the frame and lands round
// Chongqing (Japan's bet, not a collapse) as the dead road stops short of the
// city; the planned hatch then sweeps up to that ring from "take". Japan's held
// east is in the world from f0 and revealed by a near-pure zoom-out. Both side
// labels sit on the same dark plate.
//
// r4 (finish): one move at a time 143-182 — the zoom-out from "And" (143) done by
// ~160; the planned ring DRAWN ON round the city by a travelling tip (closing from
// 1.15x) f157-167, whole on "cave"; the plan hatch from "take" (sparser, dimmer
// than the held coast). Labels clear of the ring: NATIONALISTS upper-left of the
// city, JAPANESE inside Tonkin. Wagons stack nose to tail at BOTH bars; past the
// rail bar the last wagons run on to Kunming, so that far side is empty by ~f98.
// End framing ~12% tighter than r3; caption bands clear on every frame.
//
// CAUSE -> EFFECT:
//   rail: contact (Japan's front on the rail at the border) f72 = T.railCut; the
//         bar is driven out of the contact point f72-76; first reaction (gap opens,
//         wagons beyond brake, wagons behind bunch) f73.
//   road: contact (closure bar fully across the road) f96 = T.roadCut;
//         first reaction (gap opens, wagons brake) f97; drain reaches Chongqing f164.
//
// DURATION: delivered native media graphics/73_CutTheLifelines.mov = 230 f @ 24.
// GEOGRAPHY: 1940 — Japan's 1938 front, northern Indochina entered Sept 1940,
// the Burma Road closure Japan forced on Britain (July–Oct 1940); orange = Japan.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CityDot,
  HatchPattern,
  INK,
  Label,
  MapPage,
  SHADOW,
  WorldSvg,
  clamp01,
  dOf,
  labelIn,
  mixColor,
  cumOf,
  pchip,
  pointAt,
  ramp,
  runCamera,
  slicePts,
  smoothstep,
  type Cam,
  type P2,
} from "./pearlShared";
import {
  BURMA_RAIL,
  BURMA_ROAD,
  BURMA_ROUTE,
  FREE_CHINA,
  INDOCHINA_NORTH,
  JAPAN_1931,
  MANCHUKUO,
  OCCUPIED_1938,
  PLACES,
  YUNNAN_RAILWAY,
} from "./pearlAsiaMapData";
import { CAM_KEYS_V2, PLAN_START, anchorLoop, contourLoopsOf, makePlanField, nums, planLevelOf, planSources } from "./cutTheLifelinesPlanV2";

export const FPS = 24;
export const DURATION = 230;

export const schema = z.object({
  nationalists: z.string(),
  japanese: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ nationalists: "NATIONALISTS", japanese: "JAPANESE" });

const DEAD = "#8A7B62"; // the style's dead line
const LINE_INK = mixColor(INK, "#3F3428", 0.2); // a live route, a shade under the wagons

// ---------------------------------------------------------------------------
// GEOMETRY (all world px of the ASIA world)
// ---------------------------------------------------------------------------
type Box = [number, number, number, number];
type Region = { d: string; edge?: string; box: Box };
const YR = YUNNAN_RAILWAY;
const BR = BURMA_ROUTE;
const CQ = PLACES.chongqing;

// -- Tonkin: one straight front out of the Gulf, moving up the Red River (Haiphong -> Lao Cai)
const HP = pointAt(YR.pts, 0);
const LC = pointAt(YR.pts, YR.stations.laoCai);
const TK_DIR: P2 = (() => {
  const dx = LC.x - HP.x;
  const dy = LC.y - HP.y;
  const l = Math.hypot(dx, dy);
  return [dx / l, dy / l];
})();
const tkProj = (x: number, y: number) => (x - HP.x) * TK_DIR[0] + (y - HP.y) * TK_DIR[1];
const TK_PS = nums(INDOCHINA_NORTH.d).map(([x, y]) => tkProj(x, y));
const TK_SMIN = Math.min(...TK_PS);
const TK_SMAX = Math.max(...TK_PS);
/** the railway's arclength where it is severed: just past Lao Cai, on the border */
const RAIL_CUT_S = YR.stations.laoCai + 1;
const RAIL_CUT_PT = pointAt(YR.pts, RAIL_CUT_S);
const RAIL_CUT_P = tkProj(RAIL_CUT_PT.x, RAIL_CUT_PT.y);
// the front's position per frame: in from offshore on "the Japanese", on the coast
// ~f38, on the border (the cut) at f72 — near-constant march — then the rest of Tonkin
const TK_S = pchip([
  [14, TK_SMIN - 40],
  [38, TK_SMIN],
  [72, RAIL_CUT_P],
  [88, TK_SMAX + 4],
]);
const RAIL_PROJ: { s: number; p: number }[] = [];
for (let s = 0; s <= RAIL_CUT_S + 0.001; s += 0.5) {
  const q = pointAt(YR.pts, s);
  RAIL_PROJ.push({ s, p: tkProj(q.x, q.y) });
}
const railSeized = (f: number) => {
  const p = TK_S(f);
  if (p <= 0) return 0;
  let s = 0;
  for (const r of RAIL_PROJ) {
    if (r.p > p) break;
    s = r.s;
  }
  return s;
};
const firstFrame = (pred: (f: number) => boolean, f0: number, f1: number) => {
  for (let f = f0; f <= f1; f += 0.25) if (pred(f)) return f;
  return f1;
};
/** contact: the front reaches the rail at the border */
const F_RAIL_CUT = Math.round(firstFrame((f) => TK_S(f) >= RAIL_CUT_P - 0.5, 20, 120));
const F_TK_LAND = firstFrame((f) => TK_S(f) >= TK_SMIN, 0, 120);

// -- the Burma Road closure: a bold dashed orange bar across the road just past Lashio
const ROAD_CUT_S = 10; // on BURMA_ROAD (Lashio = 0)
const ROUTE_CUT_S = BR.stations.lashio + ROAD_CUT_S;
const GATE = pointAt(BURMA_ROAD.pts, ROAD_CUT_S);
const BAR_HALF = 34; // world px either side of the line

/** r3: THE CUT BAR, one grammar for both cuts — a bold dashed orange bar with a dark
 *  casing, driven out of the line across it (u 0..1), centred on the cut point */
const CutBar: React.FC<{ at: { x: number; y: number; tx: number; ty: number }; u: number; cam: Cam }> = ({ at, u, cam }) => {
  if (u <= 0.002) return null;
  const k = cam.k;
  const w = 19 * Math.pow(K_REF / k, 0.5);
  const n: P2 = [-at.ty, at.tx];
  const ends: P2[] = [
    [at.x - n[0] * BAR_HALF * u, at.y - n[1] * BAR_HALF * u],
    [at.x + n[0] * BAR_HALF * u, at.y + n[1] * BAR_HALF * u],
  ];
  return (
    <g fill="none" strokeLinecap="butt">
      {ends.map((end, i) => (
        <g key={i}>
          <path d={dOf([[at.x, at.y], end])} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={(w + 6) / k} strokeDasharray="9 3" strokeDashoffset={4.5} />
          <path d={dOf([[at.x, at.y], end])} stroke={ACCENT} strokeWidth={w / k} strokeDasharray="9 3" strokeDashoffset={4.5} />
        </g>
      ))}
    </g>
  );
};
const barU = (f: number, a: number, b: number) => 1 - Math.pow(1 - clamp01((f - a) / (b - a)), 2.2);
/** JAPANESE: start-anchored just above northern Tonkin, east of the railway */
// r4: inside Tonkin (Japan's held land), east of the railway and clear of the
// planned ring's bottom (ring bottom ~y 1058; label box ~y 1112-1133)
const JP_LABEL: P2 = [417, 1129];
/** r4: NATIONALISTS upper-left of the city, its box wholly outside the planned ring
 *  (right end at (-84, -56) world from Chongqing: >= 100 world px from the centre) */
const NAT_LABEL: P2 = [PLACES.chongqing[0] - 84, PLACES.chongqing[1] - 56];
const LABEL_CAP_V2 = 30; // both side labels: one size, one plate

// ---------------------------------------------------------------------------
// TIMING (local frames)
// ---------------------------------------------------------------------------
export const T = {
  tonkinLand: F_TK_LAND, // ~38: Japan's front reaches the Tonkin coast
  haiphongClosed: 40, // Haiphong lost: no more trains leave it
  railCut: F_RAIL_CUT, // 72: contact on the border; the line snaps from f73 ("cut" 73)
  railOpen: 3, // a crisp break
  railBar: [72, 76] as const, // r3: the front touches the rail at f72 and drives the bar out of it
  gate: [89, 96] as const, // the closure bar is driven across the road
  roadCut: 96, // contact: the bar is across; the road snaps from f97 ("foreign" 97)
  roadOpen: 3,
  roadArrive: 164, // the drain reaches Chongqing on "cave" (167): the city's supply arrives dead
  japanese: 22, // JAPANESE slides up, settled by "Japanese" 32
  nationalists: 116, // settled by "Nationalists" 132, fully in frame
  plan: PLAN_START, // 178: the bet grows from "take" (182), sweeps "over China", stops short of the city
};
if (T.railCut !== 72) throw new Error(`CutTheLifelinesV2: rail contact moved to f${T.railCut}`);
const V_RAIL = 2.1; // trains, world px / frame
const V_ROAD = 1.45; // lorries
const CUT_GAP = 10; // world px: a severed line's gap (r2: larger, readable at phone size)
const cutGap = (k: number) => Math.max(CUT_GAP, 40 / k);
const NEAR = 0.25; // share of the gap on the near side of a break
const FAR = 1.75; // and on the far side (the far end springs back)
/** a crisp opening: ease-out over `open` frames from the first reaction frame */
const openU = (f: number, fCut: number, open: number) => 1 - Math.pow(1 - clamp01((f - fCut) / open), 3);

// ---------------------------------------------------------------------------
// CAMERA: cutTheLifelinesPlanV2 (caption-band safe on every frame)
// ---------------------------------------------------------------------------
const DASH_K = 3.6; // route chequers fixed in world (no crawl in the zooms)
const K_REF = 3.6;

// ---------------------------------------------------------------------------
// THE AID FROM ABROAD (r3): single wagons leave the ports at an even interval,
// WAGON_GAP world px apart (~3x a wagon's length: distinct wagons, clear gaps,
// the flow readable at phone size), emerging from under the port's city dot,
// until the line is cut. Behind a cut they bunch up nose to tail.
// ---------------------------------------------------------------------------
const WAGON_GAP = 36; // world px between running wagons
const QUEUE_GAP = 14.5; // world px between bunched wagons behind a cut

// ---------------------------------------------------------------------------
// WAGONS: convoys at constant speed, four per docked ship. At a cut: wagons
// beyond the break run on until the drain (from the break, `waveV`) reaches
// them, then brake to a stop and turn the dead tone; wagons before it brake and
// pile up behind the break.
// ---------------------------------------------------------------------------
type Stream = {
  pts: P2[];
  len: number;
  v: number;
  em: number[];
  rank: number[];
  cut: { s: number; f: number; g: number };
  waveV: number;
  decel: number;
  upDecel: number;
  qGap: number;
  runOut: boolean;
};
type Wagon = { id: number; s: number; op: number; dead: number };
const brake = (s0: number, d: number, t: number, v: number) => {
  if (d <= 0) return s0;
  const D = (2 * d) / v;
  if (t >= D) return s0 + d;
  const u = t / D;
  return s0 + d * (1 - (1 - u) * (1 - u));
};
const makeStream = (
  route: { pts: P2[] },
  phase: number,
  v: number,
  spacing: number,
  lastEmit: number,
  cut: { s: number; f: number; g: number },
  waveV: number,
  upDecel: number,
  qGap: number,
  runOut = false,
): Stream => {
  const pts: P2[] = route.pts;
  const len = cumOf(pts)[pts.length - 1];
  const period = spacing / v;
  const em: number[] = [];
  for (let t = phase - Math.ceil((len / v + 60) / period) * period; t <= lastEmit; t += period) em.push(t);
  const ems = em;
  const c = { ...cut };
  let r = 0;
  const rank = ems.map((te) => ((c.f - te) * v <= c.s ? r++ : -1));
  return { pts, len, v, em: ems, rank, cut: c, waveV, decel: 8, upDecel, qGap, runOut };
};
const streamAt = (st: Stream, f: number): Wagon[] => {
  const out: Wagon[] = [];
  for (let i = 0; i < st.em.length; i++) {
    const te = st.em[i];
    if (te > f) break;
    let s = (f - te) * st.v;
    let dead = 0;
    if (f > st.cut.f) {
      const sc = (st.cut.f - te) * st.v;
      if (sc > st.len) continue;
      if (sc > st.cut.s && st.runOut) {
        // r4 (rail): the wagons already past the cut run on and arrive; the far side empties
        s = sc + st.v * (f - st.cut.f);
      } else if (sc > st.cut.s) {
        const fStar = st.cut.f + (sc - st.cut.s) / (st.waveV - st.v);
        if (f <= fStar) s = sc + st.v * (f - st.cut.f);
        else {
          const sStar = sc + st.v * (fStar - st.cut.f);
          s = brake(sStar, (st.v * st.decel) / 2, f - fStar, st.v);
          dead = ramp(f, fStar, fStar + 8);
        }
      } else {
        // r2: the convoys behind keep coming at speed and brake into a queue behind the break
        const slot = Math.max(sc, st.cut.s - st.cut.g - Math.max(0, st.rank[i]) * st.qGap);
        const bd = (st.v * st.decel) / 2;
        const startBrake = slot - bd;
        const sNom = sc + st.v * (f - st.cut.f);
        if (sc >= startBrake) s = brake(sc, Math.max(0, slot - sc), f - st.cut.f, st.v);
        else if (sNom <= startBrake) s = sNom;
        else s = brake(startBrake, bd, (sNom - startBrake) / st.v, st.v);
      }
    }
    if (s < 0 || s > st.len) continue;
    const op = smoothstep(s / 6) * smoothstep((st.len - s) / 10);
    if (op <= 0.01) continue;
    out.push({ id: i, s, op, dead });
  }
  return out;
};
// r4 (rail): the line beyond the cut drains to dead grey right behind the last wagon
// that got through (it runs on to Kunming and arrives ~f98), so the far side is empty
const RAIL_WAVE = V_RAIL;
const ROAD_WAVE = (BURMA_ROAD.len - ROAD_CUT_S) / (T.roadArrive - T.roadCut);
// r4: trains keep coming up from the delta and stack nose to tail against the rail bar
// (four by ~f110), as the lorries do against the road bar
const RAIL_STREAM = makeStream(YR, 3, V_RAIL, WAGON_GAP, 112, { s: RAIL_CUT_S, f: T.railCut, g: 9 }, RAIL_WAVE, 18, QUEUE_GAP, true);
const ROAD_STREAM = makeStream(BR, 11, V_ROAD, WAGON_GAP, T.roadCut, { s: ROUTE_CUT_S, f: T.roadCut, g: 10 }, ROAD_WAVE, 40, QUEUE_GAP);

/** a convoy wagon: a long load and a short cab in front, cream on a heavy dark casing;
 *  `size` = length in screen px; dead wagons turn the dead tone */
const Wagons: React.FC<{ pts: P2[]; wagons: Wagon[]; cam: Cam; size: number }> = ({ pts, wagons, cam, size }) => {
  const w = size / cam.k;
  const h = (size * 0.6) / cam.k;
  const cs = 3 / cam.k;
  return (
    <g>
      {wagons.map((p) => {
        const q = pointAt(pts, p.s);
        const a = (Math.atan2(q.ty, q.tx) * 180) / Math.PI;
        const fill = mixColor(INK, DEAD, p.dead);
        return (
          <g key={p.id} transform={`translate(${q.x} ${q.y}) rotate(${a})`} opacity={p.op}>
            <rect x={-w / 2} y={-h / 2} width={w * 0.68} height={h} rx={h * 0.16} fill={fill} stroke={SHADOW} strokeWidth={cs} />
            <rect x={w * 0.22} y={-h * 0.36} width={w * 0.28} height={h * 0.72} rx={h * 0.16} fill={fill} stroke={SHADOW} strokeWidth={cs} />
            <line x1={-w * 0.27} y1={-h / 2} x2={-w * 0.27} y2={h / 2} stroke={SHADOW} strokeWidth={1.6 / cam.k} />
            <line x1={-w * 0.04} y1={-h / 2} x2={-w * 0.04} y2={h / 2} stroke={SHADOW} strokeWidth={1.6 / cam.k} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// HELD GROUND (r2, the AllOfChinaV2 rule): a firm orange wash + DENSE solid
// +45 deg hatch + a SOLID edge; optional straight reveal front (Tonkin). The
// plan is the opposite: faint wash, sparse open dashed -45 deg hatch, dashed edge.
// ---------------------------------------------------------------------------
const HeldHatch: React.FC<{ region: Region; cam: Cam; id: string; reveal?: { from: P2; dir: P2; s: number } }> = ({ region, cam, id, reveal }) => {
  const k = cam.k;
  let clipPoly: P2[] | null = null;
  let frontLine: P2[] | null = null;
  if (reveal) {
    const [ux, uy] = reveal.dir;
    const cx = reveal.from[0] + ux * reveal.s;
    const cy = reveal.from[1] + uy * reveal.s;
    const nx = -uy;
    const ny = ux;
    const B = 4000;
    clipPoly = [
      [cx + nx * B, cy + ny * B],
      [cx - nx * B, cy - ny * B],
      [cx - nx * B - ux * B, cy - ny * B - uy * B],
      [cx + nx * B - ux * B, cy + ny * B - uy * B],
    ];
    frontLine = [
      [cx + nx * B, cy + ny * B],
      [cx - nx * B, cy - ny * B],
    ];
  }
  const ew = Math.max(1.6, 2.4 * Math.pow(k / K_REF, 0.3));
  return (
    <g>
      <defs>
        <HatchPattern id={`${id}-pat`} cam={cam} spacing={8} width={2.3} />
        {clipPoly ? (
          <clipPath id={`${id}-rv`}>
            <path d={dOf(clipPoly, true)} />
          </clipPath>
        ) : null}
        {frontLine ? (
          <clipPath id={`${id}-in`}>
            <path d={region.d} clipRule="evenodd" />
          </clipPath>
        ) : null}
      </defs>
      <g clipPath={clipPoly ? `url(#${id}-rv)` : undefined}>
        <path d={region.d} fill={ACCENT_DEEP} fillOpacity={0.26} fillRule="evenodd" />
        <path d={region.d} fill={`url(#${id}-pat)`} fillRule="evenodd" opacity={0.85} />
        {region.edge ? (
          <path d={region.edge} fill="none" stroke={ACCENT} strokeWidth={(ew * 1.15) / k} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
      </g>
      {frontLine ? (
        <g clipPath={`url(#${id}-in)`}>
          <path d={dOf(frontLine)} fill="none" stroke={SHADOW} strokeOpacity={0.55} strokeWidth={6.5 / k} />
          <path d={dOf(frontLine)} fill="none" stroke={ACCENT} strokeWidth={4 / k} />
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BET (cutTheLifelinesPlanV2), r2 — PLANNED, NOT HELD: a faint orange wash,
// a SPARSE open dashed hatch at -45 deg (held land: dense solid +45 deg), and a
// heavy DASHED orange edge with a dark casing (held: solid edge). It grows only
// from Japan's real front (the occupied edge, Manchukuo, Tonkin's inland edge):
// no point sources, so no concentric arcs round the cut points. The plan only
// exists in the wide (k ~1.7-1.9), so the hatch is a fixed world tile (no octaves).
// ---------------------------------------------------------------------------
const PLAN_SRC = planSources([]);
const PLAN_FIELD = makePlanField(PLAN_SRC);
// final loop: >= ~30-45 world px round the city (never covers it)
const planLevel = planLevelOf(0.66, 0.74);
// r4: sparser and dimmer, so the held coast stays the brightest orange
const PLAN_WASH = 0.085;
const PLAN_TILE = 38; // world px between hatch lines (~80 screen px in the wide)
const PLAN_EDGE_DASH = "11 7"; // world px

// THE PLANNED RING (r3): Japan's bet drawn on "cave" — a dashed orange ring that
// closes in from beyond the frame and lands round Chongqing on f167 at ~2.5x the
// r2 hole (radius ~92 world px, ~200 screen px), then keeps tightening slowly
// (never retracts). The plan's hatch later sweeps up to it and stops there.
// r4: no swoop through the frame — the ring is drawn on round the city by a
// travelling tip (clockwise from the top) over f157-167 while closing from 1.15x
// its landing size, whole on "cave" (167); it never leaves the city's vicinity.
const RING_IN = 157;
const RING_LAND = 167;
const ringRadius = pchip([
  [RING_IN, 92],
  [RING_LAND, 92],
  [184, 86], // keeps tightening through the calm before "take": the frame stays alive
  [229, 80],
]);
const ringDrawn = (f: number) => 1 - Math.pow(1 - clamp01((f - RING_IN) / (RING_LAND - RING_IN)), 2);
/** an arc round c of radius r, from the top clockwise over p (0..1) of the circle */
const arcD = (c: P2, r: number, p: number) => {
  if (p <= 0.001) return "";
  const n = Math.max(2, Math.ceil(120 * p));
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + 2 * Math.PI * p * (i / n);
    pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
  }
  return dOf(pts, p >= 0.999);
};
const RING_DASH = "14 8"; // world px

/** a label's dark plate (r3: the same for both side labels): slides up with its label */
type Plate = { x: number; y: number; y0: number; w: number; h: number; rx: number; op: number };
const plateOf = (
  frame: number,
  cam: Cam,
  q: { x: number; y: number; dy: number; cap: number; letters: number; anchor: "start" | "middle" | "end"; appear: number },
): Plate | null => {
  const sl = labelIn(frame, q.appear);
  if (sl.op <= 0.002) return null;
  const k = cam.k;
  const pad = 13;
  const W = q.letters * 1.2 * q.cap; // IM Fell SC caps at 0.16 em spacing, measured on the r3 render
  const x = q.anchor === "middle" ? q.x - (W / 2 + pad) / k : q.anchor === "end" ? q.x - (W + pad) / k : q.x - pad / k;
  const top = (dyS: number) => q.y + (q.dy + dyS - q.cap - pad) / k;
  return { x, y: top(sl.dy), y0: top(0), w: (W + 2 * pad) / k, h: (q.cap + 2 * pad) / k, rx: 10 / k, op: sl.op };
};

const PlanHatchPattern: React.FC<{ id: string; cam: Cam }> = ({ id, cam }) => {
  const P = PLAN_TILE;
  const sw = 2.3 / cam.k;
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform="rotate(-45)">
      {/* dashes 10 on 9 off divide the 38 tile, so they stay put */}
      <line x1={P / 2} y1={0} x2={P / 2} y2={P} stroke={ACCENT} strokeOpacity={0.8} strokeWidth={sw} strokeDasharray="10 9" />
    </pattern>
  );
};

// ---------------------------------------------------------------------------
// ROUTE SYMBOLS (1.5x the V1 weight): rail = chequered symbol; road = solid
// cased cream line. `dead` mixes the line to the dead tone.
// ---------------------------------------------------------------------------
const routePiece = (pts: P2[], a: number, b: number, kind: "rail" | "road", cam: Cam, key: string, tone = 0, extra = 0, dead = 0) => {
  if (b - a <= 0.05) return null;
  const k = cam.k;
  const wk = Math.pow(K_REF / k, 0.5);
  const d = dOf(slicePts(pts, a, b));
  // live lines a shade under the wagons' full cream, so the convoys read on them
  const ink = dead > 0 ? mixColor(INK, DEAD, dead) : tone > 0 ? mixColor(INK, ACCENT, tone) : LINE_INK;
  if (kind === "rail") {
    const RW = (18 + extra) * wk;
    const core = RW - 6.6 * wk;
    const dash = 14 / DASH_K;
    return (
      <g key={key} fill="none" strokeLinejoin="round">
        <path d={d} stroke={SHADOW} strokeOpacity={0.75} strokeWidth={(RW + 5 * wk) / k} />
        <path d={d} stroke={ink} strokeWidth={RW / k} />
        <path d={d} stroke="#15120E" strokeWidth={core / k} />
        <path d={d} stroke={ink} strokeWidth={core / k} strokeDasharray={`${dash} ${dash}`} strokeDashoffset={a} />
      </g>
    );
  }
  const RW = (17 + extra) * wk;
  return (
    <g key={key} fill="none" strokeLinejoin="round">
      <path d={d} stroke={SHADOW} strokeOpacity={0.75} strokeWidth={(RW + 5 * wk) / k} />
      <path d={d} stroke={ink} strokeWidth={RW / k} />
    </g>
  );
};
/** a severed line: [0, cut - gap] live; beyond the break drains to the dead tone behind the wave */
const cutPieces = (pts: P2[], len: number, kind: "rail" | "road", cam: Cam, f: number, cutS: number, fCut: number, open: number, waveV: number, key: string) => {
  const out: React.ReactNode[] = [];
  if (f <= fCut) {
    out.push(routePiece(pts, 0, len, kind, cam, `${key}-all`));
    return out;
  }
  // the snap: the near end (the cutter's side) barely gives, the far end springs back
  const g = cutGap(cam.k) * openU(f, fCut, open);
  out.push(routePiece(pts, 0, cutS - NEAR * g, kind, cam, `${key}-a`));
  const sw = cutS + (f - fCut) * waveV;
  const soft = waveV * 4;
  const a0 = cutS + FAR * g;
  const s1 = Math.max(a0, Math.min(len, sw - soft));
  const s2 = Math.max(a0, Math.min(len, sw));
  out.push(routePiece(pts, a0, s1, kind, cam, `${key}-d`, 0, 0, 1));
  out.push(routePiece(pts, s1, s2, kind, cam, `${key}-m`, 0, 0, 0.5));
  out.push(routePiece(pts, s2, len, kind, cam, `${key}-b`));
  return out;
};

// ---------------------------------------------------------------------------
const CutTheLifelinesV2: React.FC<Props> = ({ nationalists, japanese }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM_KEYS_V2, frame);
  const k = cam.k;
  const sk = (v: number, e = 0.3) => v * Math.pow(k / K_REF, e);

  // -- Tonkin -----------------------------------------------------------------
  const tkS = TK_S(frame);
  const tkOn = tkS > TK_SMIN - 1;
  const tkDone = tkS >= TK_SMAX + 2;
  const seized = Math.min(railSeized(frame), RAIL_CUT_S - NEAR * cutGap(k) * openU(frame, T.railCut, T.railOpen));
  const hpTone = smoothstep((tkS + 1) / 5);

  // -- the bet ----------------------------------------------------------------
  const lvl = planLevel(frame);
  const planOn = frame > T.plan && lvl > 0.004;
  const loops = planOn ? contourLoopsOf(PLAN_FIELD, lvl) : [];
  const planClipD = loops.map((l) => dOf(anchorLoop(l, CQ as P2), true)).join("");

  // -- wagons -------------------------------------------------------------------
  const railWg = streamAt(RAIL_STREAM, frame);
  const roadWg = streamAt(ROAD_STREAM, frame);
  const wgSize = sk(46, 0.55);

  // -- the cut bars (r3: the same grammar for both cuts) -------------------------
  const railBarU = barU(frame, T.railBar[0], T.railBar[1]);
  const roadBarU = barU(frame, T.gate[0], T.gate[1]);

  // -- the planned ring round Chongqing (r4): drawn on round the city by a travelling
  //    tip while closing from 1.15x, landing whole on "cave" (167) -------------------
  const ringOn = frame >= RING_IN;
  const ringP = ringOn ? ringDrawn(frame) : 0;
  const ringW = ringOn ? ringRadius(frame) * (1 + 0.15 * (1 - ringP)) : 0;
  const ringD = ringOn ? arcD(CQ as P2, ringW, ringP) : "";

  // -- Chongqing and the label plates ---------------------------------------------
  const ringR = sk(30, 0.22);
  const nat = plateOf(frame, cam, { x: NAT_LABEL[0], y: NAT_LABEL[1], dy: 0, cap: LABEL_CAP_V2, letters: nationalists.length, anchor: "end", appear: T.nationalists });
  const jap = plateOf(frame, cam, { x: JP_LABEL[0], y: JP_LABEL[1], dy: 0, cap: LABEL_CAP_V2, letters: japanese.length, anchor: "start", appear: T.japanese });
  const planDefs = (
    <>
      <PlanHatchPattern id="plan-pat" cam={cam} />
      <mask id="plan-ko" maskUnits="userSpaceOnUse" x={-400} y={200} width={1700} height={1500}>
        <rect x={-400} y={200} width={1700} height={1500} fill="#fff" />
        <circle cx={CQ[0]} cy={CQ[1]} r={(ringR + 3) / k} fill="#000" />
        {ringOn ? <circle cx={CQ[0]} cy={CQ[1]} r={ringW} fill="#000" /> : null}
        {[nat, jap].map((p, i) => (p ? <rect key={i} x={p.x} y={p.y0} width={p.w} height={p.h} rx={p.rx} fill="#000" /> : null))}
      </mask>
      <mask id="ring-ko" maskUnits="userSpaceOnUse" x={-400} y={200} width={1700} height={1500}>
        <rect x={-400} y={200} width={1700} height={1500} fill="#fff" />
        {[nat, jap].map((p, i) => (p ? <rect key={i} x={p.x} y={p.y0} width={p.w} height={p.h} rx={p.rx} fill="#000" /> : null))}
      </mask>
      <clipPath id="free-in">
        <path d={FREE_CHINA.d} clipRule="evenodd" />
      </clipPath>
      {planOn && planClipD ? (
        <clipPath id="plan-rv">
          <path d={planClipD} clipRule="evenodd" />
        </clipPath>
      ) : null}
    </>
  );

  return (
    <MapPage world="asia" cam={cam}>
      <WorldSvg cam={cam} defs={planDefs}>
        {/* Japan's empire and its conquests, held since 1931-38: in the world from frame 0 */}
        <HeldHatch region={JAPAN_1931} cam={cam} id="jp" />
        <HeldHatch region={MANCHUKUO} cam={cam} id="mk" />
        <HeldHatch region={OCCUPIED_1938} cam={cam} id="occ" />
        {tkOn ? <HeldHatch region={INDOCHINA_NORTH} cam={cam} id="tk" reveal={tkDone ? undefined : { from: [HP.x, HP.y], dir: TK_DIR, s: tkS }} /> : null}

        {/* JAPAN'S BET (planned, not held): faint wash + sparse dashed hatch behind a heavy
            dashed cased edge, sweeping from "take" up to the planned ring; it stays */}
        {planOn && planClipD ? (
          <g mask="url(#plan-ko)">
            <g clipPath="url(#plan-rv)">
              <path d={FREE_CHINA.d} fill={ACCENT} fillOpacity={PLAN_WASH} fillRule="evenodd" />
              <path d={FREE_CHINA.d} fill="url(#plan-pat)" fillRule="evenodd" />
            </g>
            <g clipPath="url(#free-in)" fill="none" strokeLinejoin="round" strokeLinecap="butt">
              <path d={planClipD} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={9 / k} strokeDasharray={PLAN_EDGE_DASH} />
              <path d={planClipD} stroke={ACCENT} strokeWidth={5.5 / k} strokeDasharray={PLAN_EDGE_DASH} />
            </g>
          </g>
        ) : null}

        {/* the Burma route: rail Rangoon -> Lashio (live to the end), road Lashio -> Chongqing */}
        {routePiece(BURMA_RAIL.pts, 0, BURMA_RAIL.len, "rail", cam, "brail")}
        {cutPieces(BURMA_ROAD.pts, BURMA_ROAD.len, "road", cam, frame, ROAD_CUT_S, T.roadCut, T.roadOpen, ROAD_WAVE, "broad")}
        {/* the Yunnan railway; the seized stretch half-toned (the bar at 72-76 is THE event) */}
        {cutPieces(YR.pts, YR.len, "rail", cam, frame, RAIL_CUT_S, T.railCut, T.railOpen, RAIL_WAVE, "yr")}
        {seized > 0.2 ? routePiece(YR.pts, 0, seized, "rail", cam, "yr-j", 0.55, 0) : null}

        {/* the wagons (they leave from under the port dots, drawn on top below) */}
        <Wagons pts={RAIL_STREAM.pts} wagons={railWg} cam={cam} size={wgSize} />
        <Wagons pts={ROAD_STREAM.pts} wagons={roadWg} cam={cam} size={wgSize} />

        {/* the two cuts, one grammar: a bold dashed orange bar across the line */}
        <CutBar at={RAIL_CUT_PT} u={railBarU} cam={cam} />
        <CutBar at={GATE} u={roadBarU} cam={cam} />

        <CityDot x={BR.pts[0][0]} y={BR.pts[0][1]} cam={cam} r={sk(9.5)} />
        <CityDot x={HP.x} y={HP.y} cam={cam} r={sk(9.5)} color={mixColor(INK, ACCENT, hpTone)} />
        <CityDot x={PLACES.kunming[0]} y={PLACES.kunming[1]} cam={cam} r={sk(9.5)} />

        {/* THE PLANNED RING (Japan's bet, dashed = planned): closes in from beyond the frame
            and lands round the city on "cave" (167), then keeps tightening slowly */}
        {ringOn ? (
          <g mask="url(#ring-ko)" fill="none" strokeLinecap="butt">
            <path d={ringD} stroke={SHADOW} strokeOpacity={0.75} strokeWidth={11 / k} strokeDasharray={RING_DASH} />
            <path d={ringD} stroke={ACCENT} strokeWidth={6.5 / k} strokeDasharray={RING_DASH} />
          </g>
        ) : null}

        {/* Chongqing: the Nationalists' capital, ringed; a dark well keeps it clear of any hatch */}
        <circle cx={CQ[0]} cy={CQ[1]} r={ringR / k} fill={SHADOW} fillOpacity={0.55} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={7.5 / k} />
        <circle cx={CQ[0]} cy={CQ[1]} r={ringR / k} fill="none" stroke={INK} strokeWidth={4 / k} />
        <CityDot x={CQ[0]} y={CQ[1]} cam={cam} r={sk(9)} />

        {/* r3: both side labels on the same dark plate (slides up with its label) */}
        {[nat, jap].map((p, i) =>
          p ? <rect key={`plate-${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} fill={SHADOW} fillOpacity={0.62 * p.op} /> : null,
        )}
        <Label x={NAT_LABEL[0]} y={NAT_LABEL[1]} text={nationalists} appear={T.nationalists} frame={frame} cam={cam} cap={LABEL_CAP_V2} anchor="end" />
        <Label x={JP_LABEL[0]} y={JP_LABEL[1]} text={japanese} appear={T.japanese} frame={frame} cam={cam} cap={LABEL_CAP_V2} color={ACCENT} anchor="start" />
      </WorldSvg>
    </MapPage>
  );
};

export default CutTheLifelinesV2;
