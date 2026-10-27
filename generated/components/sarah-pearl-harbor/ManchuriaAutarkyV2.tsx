// ManchuriaAutarkyV2 — Sarah Paine, "How the Depression pushed Japan to Pearl Harbor"
// (Dwarkesh map style, the ASIA world of pearlShared). Cold-review V2 of 39_ManchuriaAutarky
// (sequence frames 937-1142, 24 fps, all 206 frames used).
//
// CHECK LINE: "Japan took Manchuria so its own empire could supply the coal, iron and food
// it used to buy abroad."
//
// LINE (local frames, ±2): They 1, decide 5, invade 19, Manchuria 24, because 47, practice 62,
// autarky 75, independence 95, If 110, enough 119, resources 130, within 145, own 156,
// empire 161, worry 178, about 182, trade 187, So 194, go 200, into 202, Manchuria 205.
//
// THE MOTION (one job: Manchuria turns orange and becomes the empire's own supply, so the
// trade lanes from outside stop mattering). Frame 0 is north-east Asia with Japan's 1931
// empire orange, its South Manchuria Railway (Japan's zone since 1905) an orange line with
// wagons already running from the Changchun terminal into the Dairen terminal, and big cream
// freighters on four heavy cased sea-lanes running into Yokohama, Nagoya, Kobe and Nagasaki;
// the camera is already drifting toward Manchuria. On "invade Manchuria" three orange arrows
// break out of the railway zone and the hatch follows them to the Amur; the camera pushes in
// on the newly held land with the railway running. On "enough resources" (119-142) a soybean
// sack, a coal heap and ingots rise one after another, each whole out of the ground behind a
// ground line, and their own wagons start down spurs onto the railway. On "within their own
// empire" (145-161) a pen draws the loop from Dairen round Korea to Japan and back by rail to
// Changchun; wagons follow it, Japan takes every other one in under Kyushu and sends wagons
// back out of Tsuruga, so the whole ring runs. On "worry about trade" every freighter still
// at sea turns back to seaward (contact f169-171) and runs out of frame by f186 while each
// lane's port end retracts out through its frame edge (f177-187): by "trade" only Japan's
// orange loop remains. On "So they go into Manchuria" one push in (k 2.9 -> 3.7) lands by
// f205 as the ring keeps circulating.
//
// DURATION: the slot is frames 937-1142 of the 24 fps sequence = 206 frames.
// Sources: the South Manchuria Railway, Kwantung Army advance (Sept 1931 - Feb 1932) and the
// Fushun coal / Anshan iron / soybean economy as in ManchuriaAutarky (V1) and its motion module.
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  type Cam,
  type CamKey,
  DARK,
  FRAME_H,
  FRAME_W,
  Hatch,
  INK,
  InkStroke,
  Label,
  MapPage,
  type P2,
  Route,
  type RouteData,
  SHADOW,
  WorldSvg,
  clamp01,
  dOf,
  ramp,
  runCamera,
  slicePts,
  smoother,
  viewRect,
} from "./pearlShared";
import { JAPAN_1931, MANCHUKUO } from "./pearlAsiaMapData";
import {
  CAM_KEYS_V2,
  FEED_LEN_V2,
  FEED_V2,
  FRONT_DONE,
  GLYPH_ASPECT,
  GLYPH_SCALE,
  GLYPH_V2,
  GLYPH_W,
  GROUND_FRAMES,
  ARROWS,
  ARROW_FADE,
  LANES_V2 as LANES,
  LANE_LEN_V2 as LANE_LEN,
  LEGS,
  LOOP,
  RISE_FRAMES,
  RISE_V2,
  SHIP_PERIOD,
  SHIP_PHASE,
  SHIP_V,
  SIM_V2,
  S_DAIREN,
  type Src,
  T,
  V,
  W,
  arrowHead,
  drawnIntervalsV2,
  frontRings,
  frontT,
  lengthOf,
  pointAt,
  wagonAtV2,
} from "./manchuriaAutarkyMotionV2";

export const FPS = 24;
export const DURATION = 206;

export const schema = z.object({
  label: z.string(),
  debug: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ label: "MANCHURIA", debug: false });

const KEYS: CamKey[] = CAM_KEYS_V2;
const routeOf = (pts: P2[]): RouteData => ({ pts, len: lengthOf(pts), stations: {} });
const FEED_ROUTE: Record<Src, RouteData> = { coal: routeOf(FEED_V2.coal), iron: routeOf(FEED_V2.iron), soy: routeOf(FEED_V2.soy) };

// line weights (screen px; the orange ones grow gently with the zoom)
const RAIL_W = 10;
const SEA_W = 7.5;
const LANE_W = 14; // the foreign lanes: heavy cased cream lines (V1 7), readable at 270 px
const LANE_OP = 0.92;
const WAGON = 32;
/** the glyphs' size on screen relative to V1's world scale at the close-up (round-2 note: ~1.4x) */
const GLYPH_BIG = 1.4;
const ROUTE_OP = 0.72; // lines sit a shade under their wagons, so the traffic reads on them
const DASH_K = 3; // the rail chequers are their nominal size at k 3 (constant: they never crawl)
const zoomGrow = (k: number) => Math.pow(k / 2.6, 0.3);
/** the glyphs' effective zoom: world-scaled in the close-up, a screen-size floor as the camera
 *  pulls out (k 2.9 -> ~85 % of the close-up size instead of 58 %) */
const GLYPH_K_REF = 5;
const glyphK = (k: number) => (k >= GLYPH_K_REF ? k : Math.pow(k, 0.3) * Math.pow(GLYPH_K_REF, 0.7));
/** MANCHURIA's world anchor: east of the sack, over the plain between Changchun and Jilin (V1
 *  sat it at 735, 590, which the closing push would carry to the top edge) */
const LABEL_AT: P2 = [822, 641]; // clear of the sack to its west and of the frame edges at every zoom
const LABEL_CAP = 30;
/** which way each glyph grows when it is above world size: away from the railway between them */
const GLYPH_GROW: Record<Src, number> = { coal: 1, iron: -1, soy: -1 };

const inView = (c: Cam, x: number, y: number, m: number) => Math.abs(x - c.x) * c.k < FRAME_W / 2 + m && Math.abs(y - c.y) * c.k < FRAME_H / 2 + m;

/** each lane's arclength where it enters any view from the end of its retraction to the last
 *  frame (+ margin): retracting the port end back past this point takes it wholly out
 *  through the frame edge, and it stays out */
const LANE_OUT = LANES.map((L) => {
  const f0 = Math.floor(W.TIP_END) - 1;
  const views: Cam[] = [];
  for (let f = f0; f < DURATION; f++) views.push(runCamera(KEYS, f));
  const len = lengthOf(L);
  for (let s = 0; s < len; s += 0.5) {
    const q = pointAt(L, s);
    if (views.some((c) => inView(c, q.x, q.y, 60))) return Math.max(0, s - 1);
  }
  return len;
});

// ---------------------------------------------------------------------------
// FOREIGN TRADE: cream freighters sail in at constant speed along each lane, from beyond the
// frame edge into the port, where they slide in under Japan's coast. At W.turn[i] every
// freighter still at sea on lane i turns back to seaward along one smooth track (a wide half
// circle, then an S-curve back onto its lane) and runs out in one eased move, all of a lane's
// ships together, the innermost out of frame by W.OUT_END; a freighter already near its
// port docks. No sailings after the turn.
// ---------------------------------------------------------------------------
const SHIP_R2 = W.R;
type Sail = { t0: number; turns: boolean; sTurn: number };
const SAILINGS: Sail[][] = LANES.map((_, i) => {
  const out: Sail[] = [];
  for (let j = -40; j < 20; j++) {
    const t0 = SHIP_PHASE[i] + j * SHIP_PERIOD;
    if (t0 > W.turn[i]) continue; // not yet sailed at the turn: never sails
    if (t0 + LANE_LEN[i] / SHIP_V < 0) continue; // docked before f0
    const sTurn = SHIP_V * (W.turn[i] - t0);
    if (sTurn >= LANE_LEN[i]) continue; // docked before the turn: handled as a plain sailing
    out.push({ t0, turns: sTurn < LANE_LEN[i] - W.DOCK_MARGIN, sTurn });
  }
  for (let j = -40; j < 20; j++) {
    const t0 = SHIP_PHASE[i] + j * SHIP_PERIOD;
    const sTurn = SHIP_V * (W.turn[i] - t0);
    if (sTurn >= LANE_LEN[i] && t0 + LANE_LEN[i] / SHIP_V >= 0) out.push({ t0, turns: false, sTurn });
  }
  return out;
});
const TURN_SIDE = [1, 1, -1, 1]; // which way each ship turns (to seaward)
const REJOIN = 6 * SHIP_R2; // the S-curve back onto the lane after the half circle
/** a turning ship's whole outbound track, as one smooth polyline: a half circle to seaward,
 *  an S-curve back onto the lane, the lane back out past its start, then straight on. The
 *  hull always points along this track (its tangent): no pivot, no sideways slide. */
const turnPath = (i: number, a: number): P2[] => {
  const L = LANES[i];
  const side = TURN_SIDE[i];
  const R = SHIP_R2;
  const qa = pointAt(L, a);
  const na: P2 = [-qa.ty * side, qa.tx * side];
  const pts: P2[] = [];
  for (let q = 0; q <= 32; q++) {
    const ph = (Math.PI * q) / 32;
    pts.push([qa.x + na[0] * R * (1 - Math.cos(ph)) + qa.tx * R * Math.sin(ph), qa.y + na[1] * R * (1 - Math.cos(ph)) + qa.ty * R * Math.sin(ph)]);
  }
  const rj = Math.min(REJOIN, Math.max(1, a));
  for (let q = 1; q <= 30; q++) {
    const u = q / 30;
    const s = a - u * rj;
    const p = pointAt(L, s);
    const off = 2 * R * (1 - smoother(u));
    pts.push([p.x - p.ty * side * off, p.y + p.tx * side * off]);
  }
  for (let s = a - rj - 2; s > 0; s -= 2) {
    const p = pointAt(L, s);
    pts.push([p.x, p.y]);
  }
  const p0 = pointAt(L, 0);
  pts.push([p0.x, p0.y], [p0.x - p0.tx * 400, p0.y - p0.ty * 400]);
  return pts;
};
const TURN_PATHS: (P2[] | null)[][] = SAILINGS.map((list, i) => list.map((sl) => (sl.turns ? turnPath(i, sl.sTurn) : null)));
/** per lane: how far along its track the innermost turning ship must go to leave the frame */
const OUT_RUN = LANES.map((_, i) => {
  const sIn = Math.max(0, ...SAILINGS[i].filter((s) => s.turns).map((s) => s.sTurn));
  const dur = W.OUT_END - W.turn[i];
  const D = Math.PI * SHIP_R2 + Math.min(REJOIN, sIn) + Math.max(0, sIn - REJOIN - (LANE_OUT[i] - 70));
  return { D, dur };
});
/** distance along the track t frames after the turn begins: cruising speed plus one eased surge */
const outDist = (i: number, t: number) => {
  const { D, dur } = OUT_RUN[i];
  return W.U_V * t + Math.max(0, D - W.U_V * dur) * smoother(t / dur);
};
/** a ship's pose at frame f, or null (not launched, docked, or gone out to sea) */
const shipPose = (i: number, j: number, sl: Sail, f: number) => {
  const L = LANES[i];
  const sig = SHIP_V * (f - sl.t0);
  if (sig < 0) return null;
  const path = TURN_PATHS[i][j];
  if (!path || f <= W.turn[i]) {
    if (sig >= LANE_LEN[i]) return null;
    const q = pointAt(L, sig);
    return { x: q.x, y: q.y, hx: q.tx, hy: q.ty };
  }
  const d = outDist(i, f - W.turn[i]);
  if (d >= lengthOf(path)) return null;
  const q = pointAt(path, d);
  return { x: q.x, y: q.y, hx: q.tx, hy: q.ty };
};

/** the freighter, top view, in world px, cream with dark casing; heading +x (CutTheLifelines' glyph, scaled up 1.5x over V1) */
const SHIP_L = 46;
const SHIP_B = 14.7;
const INK_DEEP_SHIP = "#C9BB97";
const Ship: React.FC<{ x: number; y: number; hx: number; hy: number; cam: Cam }> = ({ x, y, hx, hy, cam }) => {
  const L = SHIP_L;
  const B = SHIP_B;
  const k = cam.k;
  const a = (Math.atan2(hy, hx) * 180) / Math.PI;
  const u = L / 15;
  const hull = `M${L / 2},0 C${L / 2 - 1.2 * u},${B * 0.45} ${L / 2 - 3.2 * u},${B / 2} ${L / 2 - 4.6 * u},${B / 2} L${-L / 2 + 0.9 * u},${B / 2} Q${-L / 2},${B / 2} ${-L / 2},0 Q${-L / 2},${-B / 2} ${-L / 2 + 0.9 * u},${-B / 2} L${L / 2 - 4.6 * u},${-B / 2} C${L / 2 - 3.2 * u},${-B / 2} ${L / 2 - 1.2 * u},${-B * 0.45} ${L / 2},0 Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={hull} fill={INK} stroke={SHADOW} strokeWidth={3 / k} strokeLinejoin="round" />
      <rect x={-L / 2 + 1.1 * u} y={-B * 0.3} width={2.3 * u} height={B * 0.6} rx={0.3 * u} fill={INK_DEEP_SHIP} stroke={SHADOW} strokeWidth={2 / k} />
      {[-1.8, 1.2, 4.2].map((hx0) => (
        <rect key={hx0} x={(hx0 - 0.9) * u} y={-B * 0.24} width={1.8 * u} height={B * 0.48} fill="none" stroke={SHADOW} strokeWidth={1.8 / k} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ADVANCE ARROWS (as V1)
// ---------------------------------------------------------------------------
const AdvanceArrow: React.FC<{ pts: P2[]; sh: number; cam: Cam; zg: number; opacity: number }> = ({ pts, sh, cam, zg, opacity }) => {
  if (sh < 1 || opacity <= 0.001) return null;
  const k = cam.k;
  const headL = (30 * zg) / k;
  const headW = (17 * zg) / k;
  const bodyW = (6.5 * zg) / k;
  const neck = Math.max(0, sh - headL);
  const left: P2[] = [];
  const right: P2[] = [];
  const n = Math.max(2, Math.ceil(neck / 1.5));
  for (let q = 0; q <= n; q++) {
    const s = (neck * q) / n;
    const p = pointAt(pts, s);
    const w = bodyW * (0.45 + 0.55 * Math.min(1, s / Math.max(1e-6, neck * 0.6)));
    left.push([p.x - p.ty * w, p.y + p.tx * w]);
    right.push([p.x + p.ty * w, p.y - p.tx * w]);
  }
  const pn = pointAt(pts, neck);
  const tip = pointAt(pts, sh);
  const hw = headW * Math.min(1, sh / headL);
  const poly: P2[] = [...left, [pn.x - pn.ty * hw, pn.y + pn.tx * hw], [tip.x, tip.y], [pn.x + pn.ty * hw, pn.y - pn.tx * hw], ...right.reverse()];
  const d = dOf(poly, true);
  return (
    <g opacity={opacity} strokeLinejoin="round">
      <path d={d} fill={SHADOW} fillOpacity={0.6} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={6 / k} />
      <path d={d} fill={ACCENT} stroke={DARK} strokeWidth={2.2 / k} />
      <path d={dOf(slicePts(pts, neck * 0.08, Math.max(neck * 0.08 + 0.01, neck - (4 * zg) / k)))} fill="none" stroke={DARK} strokeOpacity={0.75} strokeWidth={1.8 / k} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE RESOURCE GLYPHS (as V1): bold cream silhouettes on a dark casing, standing on a ground
// line; drawn in a 100-unit-tall box (ground at y 100, x centred on 0).
// ---------------------------------------------------------------------------
const COAL_LUMPS: P2[][] = [
  [[-22, 34], [-8, 14], [12, 10], [28, 24], [22, 42], [-2, 46]],
  [[-52, 60], [-44, 38], [-22, 32], [-6, 44], [-12, 64], [-36, 68]],
  [[2, 60], [8, 40], [30, 32], [52, 44], [48, 64], [24, 68]],
  [[-74, 100], [-68, 76], [-48, 62], [-28, 68], [-24, 86], [-32, 100]],
  [[-36, 100], [-28, 76], [-6, 64], [16, 72], [20, 90], [12, 100]],
  [[6, 100], [16, 78], [38, 68], [58, 72], [70, 86], [74, 100]],
];
const INGOTS: { front: P2[]; top: P2[] }[] = [
  { front: [[-76, 100], [-6, 100], [-12, 72], [-70, 72]], top: [[-70, 72], [-12, 72], [-4, 62], [-62, 62]] },
  { front: [[4, 100], [74, 100], [68, 72], [10, 72]], top: [[10, 72], [68, 72], [76, 62], [18, 62]] },
  { front: [[-36, 62], [36, 62], [30, 34], [-30, 34]], top: [[-30, 34], [30, 34], [38, 24], [-22, 24]] },
];
const SACK_D =
  "M-30,100C-47,99 -51,78 -43,62C-37,50 -25,42 -14,38L-12,30C-18,26 -23,18 -19,8C-13,13 -6,15 0,15C6,15 13,13 19,8C23,18 18,26 12,30L14,38C25,42 37,50 43,62C51,78 47,99 30,100Z";
const INK_SHADE = "#CDBF9C";

/** each glyph's ground line half-width (glyph units): just wider than its footprint */
const GROUND_HW: Record<Src, number> = { coal: 80, iron: 82, soy: 54 };
/** each glyph's top (glyph units): the rise starts with the top at the ground, so its first
 *  frame already shows a third of the glyph, never a sliver */
const GLYPH_TOP: Record<Src, number> = { coal: 10, iron: 24, soy: 8 };
/** ground 0..1 draws the ground line out from its centre; reveal 0..1 raises the whole glyph
 *  up out of the ground behind that line (clipped at the ground: never a flat sliver) */
const Glyph: React.FC<{ kind: Src; x: number; y: number; h: number; cam: Cam; reveal: number; ground: number; id: string }> = ({ kind, x, y, h, cam, reveal, ground, id }) => {
  const rv = clamp01(reveal);
  const gr = clamp01(ground);
  if (gr <= 0) return null;
  const s = h / cam.k / 100;
  const u = (v: number) => (v * 100) / h;
  const casing = u(7);
  const line = u(2.4);
  let body: React.ReactNode;
  if (kind === "coal") {
    body = (
      <>
        {COAL_LUMPS.map((L, i) => (
          <path key={`c${i}`} d={dOf(L, true)} fill={SHADOW} stroke={SHADOW} strokeWidth={casing} strokeLinejoin="round" />
        ))}
        {COAL_LUMPS.map((L, i) => {
          const top = L.reduce((a, b) => (b[1] < a[1] ? b : a));
          const xs = L.map((q) => q[0]);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
          const bot = Math.max(...L.map((q) => q[1]));
          return (
            <g key={`l${i}`}>
              <path d={dOf(L, true)} fill={INK} stroke={DARK} strokeWidth={line} strokeLinejoin="round" />
              <path d={`M${top[0]},${top[1]}L${cx + 6},${bot - 4}L${Math.max(...xs) - 2},${bot - 8}`} fill="none" stroke={DARK} strokeWidth={line * 0.8} strokeLinejoin="round" />
            </g>
          );
        })}
      </>
    );
  } else if (kind === "iron") {
    body = (
      <>
        {INGOTS.map((b, i) => (
          <g key={`c${i}`}>
            <path d={dOf(b.front, true)} fill={SHADOW} stroke={SHADOW} strokeWidth={casing} strokeLinejoin="round" />
            <path d={dOf(b.top, true)} fill={SHADOW} stroke={SHADOW} strokeWidth={casing} strokeLinejoin="round" />
          </g>
        ))}
        {INGOTS.map((b, i) => (
          <g key={`b${i}`}>
            <path d={dOf(b.front, true)} fill={INK_SHADE} stroke={DARK} strokeWidth={line} strokeLinejoin="round" />
            <path d={dOf(b.top, true)} fill={INK} stroke={DARK} strokeWidth={line} strokeLinejoin="round" />
          </g>
        ))}
      </>
    );
  } else {
    body = (
      <>
        <path d={SACK_D} fill={SHADOW} stroke={SHADOW} strokeWidth={casing} strokeLinejoin="round" />
        <path d={SACK_D} fill={INK} stroke={DARK} strokeWidth={line} strokeLinejoin="round" />
        <path d="M-8,46C-4,62 -6,82 -12,96M10,46C16,62 16,82 12,96" fill="none" stroke={DARK} strokeWidth={line * 0.8} strokeLinecap="round" />
        <path d="M-15,36C-6,40 6,40 15,36" fill="none" stroke={DARK} strokeWidth={u(5)} strokeLinecap="round" />
      </>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(0 -100)`}>
      <defs>
        <clipPath id={`${id}-rise`}>
          <rect x={-100} y={-20} width={200} height={120.5} />
        </clipPath>
      </defs>
      {rv > 0 ? (
        <g clipPath={rv < 1 ? `url(#${id}-rise)` : undefined}>
          <g transform={`translate(0 ${(1 - rv) * (102 - GLYPH_TOP[kind])})`}>{body}</g>
        </g>
      ) : null}
      <path d={`M${-GROUND_HW[kind] * gr},100.5L${GROUND_HW[kind] * gr},100.5`} stroke={SHADOW} strokeOpacity={0.8} strokeWidth={u(5)} strokeLinecap="round" />
    </g>
  );
};

/** an orange wagon (the kit's convoy mark in Japan's orange) at a point, along its heading */
const OrangeWagon: React.FC<{ x: number; y: number; tx: number; ty: number; cam: Cam; size: number }> = ({ x, y, tx, ty, cam, size }) => {
  const w = size / cam.k;
  const h = (size * 0.6) / cam.k;
  const a = (Math.atan2(ty, tx) * 180) / Math.PI;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <rect x={-w / 2} y={-h / 2} width={w * 0.68} height={h} rx={h * 0.16} fill={ACCENT} stroke={SHADOW} strokeWidth={2.8 / cam.k} />
      <rect x={w * 0.22} y={-h * 0.36} width={w * 0.28} height={h * 0.72} rx={h * 0.16} fill={ACCENT} stroke={SHADOW} strokeWidth={2.8 / cam.k} />
      <line x1={-w * 0.27} y1={-h / 2} x2={-w * 0.27} y2={h / 2} stroke={SHADOW} strokeWidth={1.7 / cam.k} />
      <line x1={-w * 0.04} y1={-h / 2} x2={-w * 0.04} y2={h / 2} stroke={SHADOW} strokeWidth={1.7 / cam.k} />
    </g>
  );
};

/** a railway terminal shed (dark umber plane in cream line, a roof ridge), centred on the rail
 *  at arclength s along its heading: wagons run out of it and into it. Twice a wagon long. */
const Terminal: React.FC<{ s: number; cam: Cam; size: number }> = ({ s, cam, size }) => {
  const q = pointAt(LOOP, s);
  const w = (size * 2.1) / cam.k;
  const h = (size * 0.95) / cam.k;
  const a = (Math.atan2(q.ty, q.tx) * 180) / Math.PI;
  return (
    <g transform={`translate(${q.x} ${q.y}) rotate(${a})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.08} fill={SHED} stroke={SHADOW} strokeWidth={5 / cam.k} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.08} fill="none" stroke={INK} strokeWidth={2.2 / cam.k} />
      <line x1={-w / 2 + h * 0.18} y1={0} x2={w / 2 - h * 0.18} y2={0} stroke={INK} strokeWidth={1.8 / cam.k} />
    </g>
  );
};
const SHED = "#2E261D";

// ---------------------------------------------------------------------------
const ManchuriaAutarkyV2: React.FC<Props> = ({ label, debug }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(KEYS, frame);
  const k = cam.k;
  const zg = zoomGrow(k);
  // mask / clip regions: the view (+ margin) in world px, never a huge fixed box
  const vr = viewRect(cam, 80);
  const VR = { x: vr.x0, y: vr.y0, width: vr.x1 - vr.x0, height: vr.y1 - vr.y0 };

  // -- the front ------------------------------------------------------------------------
  const lv = frontT(frame);
  const frontLive = lv > 0 && frame < FRONT_DONE;
  const frontD = frontLive ? frontRings(lv).map((r) => dOf(r, true)).join("") : "";
  const frontOp = clamp01((frame - T.front[0]) / 3) * (1 - ramp(frame, T.front[1] - 6, T.front[1]));

  // -- the orange flow -------------------------------------------------------------------
  const drawn = drawnIntervalsV2(frame);
  const legPieces: React.ReactNode[] = [];
  drawn.forEach(([a, b], n) =>
    LEGS.forEach((leg, li) => {
      const s0 = Math.max(a, leg.a);
      const s1 = Math.min(b, leg.b);
      if (s1 - s0 < 0.01 || leg.kind === "hidden") return;
      const pts = slicePts(LOOP, s0, s1);
      if (leg.kind === "rail")
        legPieces.push(<Route key={`leg-${n}-${li}`} route={routeOf(pts)} kind="rail" cam={cam} tone={1} width={RAIL_W * zg} dashK={DASH_K} opacity={ROUTE_OP} />);
      else legPieces.push(<InkStroke key={`leg-${n}-${li}`} d={dOf(pts)} cam={cam} width={SEA_W * zg} tone={1} opacity={ROUTE_OP} />);
    }),
  );
  const feedDrawn = (src: Src) => {
    const w = SIM_V2.first[src];
    return w && frame >= w.born ? Math.min(FEED_LEN_V2[src], V * (frame - w.born)) : 0;
  };
  const wagons: React.ReactNode[] = [];
  for (const w of SIM_V2.wagons) {
    const q = wagonAtV2(w, frame);
    if (q && inView(cam, q.x, q.y, 60)) wagons.push(<OrangeWagon key={w.id} x={q.x} y={q.y} tx={q.tx} ty={q.ty} cam={cam} size={WAGON * zg} />);
  }

  // -- foreign trade: full-weight lanes until they retract, and the ships on them --------------
  const lanes = LANES.map((L, i) => {
    const u = smoother((frame - W.tipStart[i]) / (W.TIP_END - W.tipStart[i]));
    return { L, drawnTo: LANE_LEN[i] - (LANE_LEN[i] - LANE_OUT[i]) * u };
  });
  const ships: React.ReactNode[] = [];
  SAILINGS.forEach((list, i) =>
    list.forEach((sl, j) => {
      const q = shipPose(i, j, sl, frame);
      if (q && inView(cam, q.x, q.y, 90)) ships.push(<Ship key={`s-${i}-${j}`} x={q.x} y={q.y} hx={q.hx} hy={q.hy} cam={cam} />);
    }),
  );

  const arrowOp = 1 - ramp(frame, ARROW_FADE[0], ARROW_FADE[1]);

  // the resources: the ground line draws out, then the glyph rises whole out of the ground
  const ground = (src: Src) => ramp(frame, RISE_V2[src], RISE_V2[src] + GROUND_FRAMES);
  // ease-out: most of the climb in the first frames, so the part-risen state is brief
  const rise = (src: Src) => 1 - Math.pow(1 - clamp01((frame - RISE_V2[src]) / RISE_FRAMES), 3);
  const gK = glyphK(k);
  const glyphAt = (src: Src) => {
    const hWorld = GLYPH_W * GLYPH_SCALE[src];
    const h = GLYPH_BIG * hWorld * gK; // screen px
    const dx = (GLYPH_GROW[src] * (h / k - hWorld) * GLYPH_ASPECT[src]) / 2;
    return { x: GLYPH_V2[src][0] + dx, y: GLYPH_V2[src][1], h };
  };

  // Japan proper round the Kanmon strait and the Chugoku hills (world px): its land hides
  // the wagons Japan takes in and the ones it sends on through to Tsuruga
  const JB = { x0: 848, y0: 780, x1: 948, y1: 866 };

  return (
    <MapPage world="asia" cam={cam}>
      <WorldSvg
        cam={cam}
        defs={
          <>
            <mask id="ma2-japan" maskUnits="userSpaceOnUse" {...VR}>
              <rect {...VR} fill="#fff" />
              <path d={JAPAN_1931.d} fill="#000" fillRule="evenodd" />
            </mask>
            <clipPath id="ma2-jbox">
              <rect x={JB.x0} y={JB.y0} width={JB.x1 - JB.x0} height={JB.y1 - JB.y0} />
            </clipPath>
            <mask id="ma2-japanproper" maskUnits="userSpaceOnUse" {...VR}>
              <rect {...VR} fill="#fff" />
              <g clipPath="url(#ma2-jbox)">
                <path d={JAPAN_1931.d} fill="#000" fillRule="evenodd" />
              </g>
            </mask>
            {frontLive ? (
              <>
                <clipPath id="ma2-front">
                  <path d={frontD} clipRule="evenodd" />
                </clipPath>
                <clipPath id="ma2-mkland">
                  <path d={MANCHUKUO.d} clipRule="evenodd" />
                </clipPath>
              </>
            ) : null}
          </>
        }
      >
        {/* Japan's empire of 1931, and Manchuria taken behind one irregular frontier */}
        <Hatch region={JAPAN_1931} cam={cam} id="ma2-j31" />
        {lv > 0 ? (
          <g clipPath={frontLive ? "url(#ma2-front)" : undefined}>
            <Hatch region={MANCHUKUO} cam={cam} id="ma2-mk" />
          </g>
        ) : null}
        {frontLive && frontOp > 0 ? (
          <g clipPath="url(#ma2-mkland)" opacity={frontOp}>
            <path d={frontD} fill="none" stroke={SHADOW} strokeOpacity={0.55} strokeWidth={6 / k} strokeLinejoin="round" />
            <path d={frontD} fill="none" stroke={ACCENT} strokeWidth={3 / k} strokeLinejoin="round" />
          </g>
        ) : null}

        {/* the Kwantung Army's advance: three arrows out of the railway zone, leading the front */}
        {arrowOp > 0 ? ARROWS.map((A, i) => <AdvanceArrow key={`arr-${i}`} pts={A} sh={arrowHead(i, frame)} cam={cam} zg={zg} opacity={arrowOp} />) : null}

        {/* foreign trade: four cream sea-lanes, freighters docking under Japan's coast */}
        <g mask="url(#ma2-japan)">
          {lanes.map(({ L, drawnTo }, i) =>
            drawnTo > 0.5 ? <InkStroke key={`lane-${i}`} d={dOf(slicePts(L, 0, drawnTo))} cam={cam} width={LANE_W} tone={0} opacity={LANE_OP} /> : null,
          )}
          {ships}
        </g>

        {/* the empire's own supply: feeders, then one ring round Korea */}
        <g mask="url(#ma2-japanproper)">
          {(["soy", "coal", "iron"] as Src[]).map((src) => (
            <Route key={`feed-${src}`} route={FEED_ROUTE[src]} kind="rail" cam={cam} drawn={feedDrawn(src)} tone={1} width={(RAIL_W - 1) * zg} dashK={DASH_K} opacity={ROUTE_OP} />
          ))}
          {legPieces}
          {wagons}
        </g>
        {/* the railway's two terminals: wagons run out of Changchun and (until the loop) into Dairen */}
        <Terminal s={0.01} cam={cam} size={WAGON * zg} />
        <Terminal s={S_DAIREN - 0.01} cam={cam} size={WAGON * zg} />

        {/* the resources, raised on "enough resources", one after another */}
        {(["soy", "coal", "iron"] as Src[]).map((src) => {
          const g = glyphAt(src);
          return <Glyph key={src} kind={src} x={g.x} y={g.y} h={g.h} cam={cam} reveal={rise(src)} ground={ground(src)} id={`ma2-g-${src}`} />;
        })}

        <Label x={LABEL_AT[0]} y={LABEL_AT[1]} text={label} appear={T.label} frame={frame} cam={cam} cap={LABEL_CAP} />

        {debug ? (
          <g>
            <path d={dOf(LOOP)} fill="none" stroke="#f0f" strokeWidth={1 / k} />
            {LANES.map((L, i) => (
              <path key={i} d={dOf(L)} fill="none" stroke="#0ff" strokeWidth={1 / k} />
            ))}
            <rect x={JB.x0} y={JB.y0} width={JB.x1 - JB.x0} height={JB.y1 - JB.y0} fill="none" stroke="#ff0" strokeWidth={1 / k} />
          </g>
        ) : null}
      </WorldSvg>
    </MapPage>
  );
};

export default ManchuriaAutarkyV2;
