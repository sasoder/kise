// ManchuriaAutarky — Sarah Paine, "How the Depression pushed Japan to Pearl Harbor"
// (Dwarkesh map style, the ASIA world of pearlShared). Sequence 00:00:39:01-00:00:47:03.
//
// CHECK LINE: "Japan took Manchuria so its own empire could supply the coal, iron and food
// it used to buy abroad."
//
// THE MOTION (one job: Manchuria turns orange and becomes the empire's own supply, so the
// trade lanes from outside stop mattering). Frame 0 is north-east Asia with Japan's 1931
// empire orange, its South Manchuria Railway an orange thread into cream Manchuria, and
// cream freighters sailing in along four sea-lanes to Yokohama, Nagoya, Kobe and Nagasaki.
// On "invade Manchuria" three bold orange arrows break out of the railway zone (north up
// the line from Changchun, east to Jilin, west from Mukden) and the hatch follows them as an
// irregular ink frontier to the Amur; behind it a coal heap, ingots and a soybean sack rise
// out of the ground. The camera pushes in on south Manchuria; orange wagons leave the three
// glyphs, run down to Dairen and by sea to Japan; as the first reach Japan the return leg is
// drawn (Tsuruga, across the Sea of Japan to Chongjin, rail to Changchun) while the camera
// pulls back, landing by ~f160 on one closed orange ring round Korea. On "don't have to
// worry about trade" the camera is calm: the last freighters turn back out to sea and each
// lane withdraws out through its frame edge; the ring keeps circulating to the last frame.
// Geometry, clocks, camera keys, the front's field and the wagons: manchuriaAutarkyMotion.ts.
//
// DURATION: the slot is frames 937-1131 of the 24 fps sequence = 194 frames, + 12 frames
// of living tail = 206.
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
} from "./pearlShared";
import { JAPAN_1931, MANCHUKUO } from "./pearlAsiaMapData";
import {
  CAM_KEYS,
  FEED,
  FEED_LEN,
  FRONT_DONE,
  GLYPH,
  GLYPH_SCALE,
  GLYPH_W,
  ARROWS,
  ARROW_FADE,
  LANES,
  LANE_LEN,
  LEGS,
  LOOP,
  RISE,
  SHIP_PERIOD,
  SHIP_PHASE,
  SHIP_R,
  SHIP_V,
  SIM,
  type Src,
  T,
  V,
  arrowHead,
  drawnIntervals,
  frontRings,
  frontT,
  lengthOf,
  pointAt,
  wagonAt,
} from "./manchuriaAutarkyMotion";

export const FPS = 24;
export const DURATION = 206;

export const schema = z.object({
  label: z.string(),
  debug: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ label: "MANCHURIA", debug: false });

const KEYS: CamKey[] = CAM_KEYS;
const routeOf = (pts: P2[]): RouteData => ({ pts, len: lengthOf(pts), stations: {} });
const FEED_ROUTE: Record<Src, RouteData> = { coal: routeOf(FEED.coal), iron: routeOf(FEED.iron), soy: routeOf(FEED.soy) };

// line weights (screen px; the orange ones grow gently with the zoom): the cream lanes
// are as heavy as the orange route, so both read at 270 px wide
const RAIL_W = 10;
const SEA_W = 7.5;
const LANE_W = 7;
const WAGON = 30;
const ROUTE_OP = 0.72; // lines sit a shade under their wagons, so the traffic reads on them
const DASH_K = 3; // the rail chequers are their nominal size at k 3 (constant: they never crawl)
const zoomGrow = (k: number) => Math.pow(k / 2.6, 0.3);

/** each lane's arclength where it leaves the widest late view (+ margin): retracting the
 *  line's port end back past this point takes it wholly out through the frame edge */
const LANE_OUT = (() => {
  const views = [166, 180, 194, 206].map((f) => runCamera(KEYS, f));
  const inView = (x: number, y: number) =>
    views.some((c) => {
      const m = 70;
      return Math.abs(x - c.x) * c.k < FRAME_W / 2 + m && Math.abs(y - c.y) * c.k < FRAME_H / 2 + m;
    });
  return LANES.map((L) => {
    const len = lengthOf(L);
    for (let s = 0; s < len; s += 0.5) {
      const q = pointAt(L, s);
      if (inView(q.x, q.y)) return Math.max(0, s - 1);
    }
    return len;
  });
})();

// ---------------------------------------------------------------------------
// FOREIGN TRADE: cream freighters (the sibling cut CutTheLifelines' glyph) sail in at
// constant speed along each lane, from beyond the frame edge into the port, where they
// slide in under Japan's coast. Sailings stop in time for every ship to have docked by
// T.turn; one last ship per lane is just inside the frame edge at T.turn and turns
// back (a half circle of radius SHIP_R) and sails out the way it came.
// ---------------------------------------------------------------------------
type Sail = { t0: number; last: boolean };
const LANE_EDGE_AT_TURN = LANES.map((L, i) => {
  const c = runCamera(KEYS, T.turn[i]);
  const len = lengthOf(L);
  for (let s = 0; s < len; s += 0.5) {
    const q = pointAt(L, s);
    if (Math.abs(q.x - c.x) * c.k < FRAME_W / 2 && Math.abs(q.y - c.y) * c.k < FRAME_H / 2) return s;
  }
  return len;
});
const TURN_S = LANE_EDGE_AT_TURN.map((e, i) => Math.min(e + 45, LANE_LEN[i] - 24));
const SAILINGS: Sail[][] = LANES.map((_, i) => {
  const out: Sail[] = [];
  for (let j = -40; j < 20; j++) {
    const t0 = SHIP_PHASE[i] + j * SHIP_PERIOD;
    if (t0 + LANE_LEN[i] / SHIP_V <= T.turn[i] - 4) out.push({ t0, last: false });
  }
  if (LANE_EDGE_AT_TURN[i] < LANE_LEN[i] - 40) out.push({ t0: T.turn[i] - TURN_S[i] / SHIP_V, last: true });
  return out;
});
/** a ship's pose at frame f, or null (not launched, docked, or gone out of frame) */
const shipPose = (i: number, sl: Sail, f: number, side: number) => {
  const L = LANES[i];
  const sig = SHIP_V * (f - sl.t0);
  if (sig < 0) return null;
  if (!sl.last) {
    if (sig >= LANE_LEN[i]) return null;
    const q = pointAt(L, sig);
    return { x: q.x, y: q.y, hx: q.tx, hy: q.ty };
  }
  const a = TURN_S[i];
  if (sig <= a) {
    const q = pointAt(L, sig);
    return { x: q.x, y: q.y, hx: q.tx, hy: q.ty };
  }
  const qa = pointAt(L, a);
  const na: P2 = [-qa.ty * side, qa.tx * side];
  const R = SHIP_R;
  if (sig <= a + Math.PI * R) {
    const ph = (sig - a) / R;
    const cx = qa.x + na[0] * R;
    const cy = qa.y + na[1] * R;
    return {
      x: cx - na[0] * R * Math.cos(ph) + qa.tx * R * Math.sin(ph),
      y: cy - na[1] * R * Math.cos(ph) + qa.ty * R * Math.sin(ph),
      hx: qa.tx * Math.cos(ph) + na[0] * Math.sin(ph),
      hy: qa.ty * Math.cos(ph) + na[1] * Math.sin(ph),
    };
  }
  const s = a - (sig - a - Math.PI * R);
  if (s < LANE_EDGE_AT_TURN[i] - 40) return null;
  const q = pointAt(L, Math.max(0, s));
  return { x: q.x - q.ty * side * 2 * R, y: q.y + q.tx * side * 2 * R, hx: -q.tx, hy: -q.ty };
};
const TURN_SIDE = [1, 1, -1, 1]; // which way each last ship turns (to seaward)

/** the freighter, top view, in world px, cream with dark casing; heading +x (CutTheLifelines' glyph, scaled up) */
const SHIP_L = 31;
const SHIP_B = 9.9;
const INK_DEEP_SHIP = "#C9BB97";
const Ship: React.FC<{ x: number; y: number; hx: number; hy: number; cam: Cam }> = ({ x, y, hx, hy, cam }) => {
  const L = SHIP_L;
  const B = SHIP_B;
  const k = cam.k;
  const a = (Math.atan2(hy, hx) * 180) / Math.PI;
  // CutTheLifelines' hull (15 x 4.8), every dimension scaled by L / 15
  const u = L / 15;
  const hull = `M${L / 2},0 C${L / 2 - 1.2 * u},${B * 0.45} ${L / 2 - 3.2 * u},${B / 2} ${L / 2 - 4.6 * u},${B / 2} L${-L / 2 + 0.9 * u},${B / 2} Q${-L / 2},${B / 2} ${-L / 2},0 Q${-L / 2},${-B / 2} ${-L / 2 + 0.9 * u},${-B / 2} L${L / 2 - 4.6 * u},${-B / 2} C${L / 2 - 3.2 * u},${-B / 2} ${L / 2 - 1.2 * u},${-B * 0.45} ${L / 2},0 Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={hull} fill={INK} stroke={SHADOW} strokeWidth={3 / k} strokeLinejoin="round" />
      {/* the bridge aft, three hatches forward */}
      <rect x={-L / 2 + 1.1 * u} y={-B * 0.3} width={2.3 * u} height={B * 0.6} rx={0.3 * u} fill={INK_DEEP_SHIP} stroke={SHADOW} strokeWidth={2 / k} />
      {[-1.8, 1.2, 4.2].map((hx0) => (
        <rect key={hx0} x={(hx0 - 0.9) * u} y={-B * 0.24} width={1.8 * u} height={B * 0.48} fill="none" stroke={SHADOW} strokeWidth={1.8 / k} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ADVANCE ARROWS: bold engraved orange arrows (cased, a dark centre line), drawn by
// their heads, which run just ahead of the hatch; screen-constant widths.
// ---------------------------------------------------------------------------
const AdvanceArrow: React.FC<{ pts: P2[]; sh: number; cam: Cam; zg: number; opacity: number }> = ({ pts, sh, cam, zg, opacity }) => {
  if (sh < 1 || opacity <= 0.001) return null;
  const k = cam.k;
  const headL = (30 * zg) / k;
  const headW = (17 * zg) / k; // half width
  const bodyW = (6.5 * zg) / k; // half width at the neck
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
  const poly: P2[] = [
    ...left,
    [pn.x - pn.ty * hw, pn.y + pn.tx * hw],
    [tip.x, tip.y],
    [pn.x + pn.ty * hw, pn.y - pn.tx * hw],
    ...right.reverse(),
  ];
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
// THE RESOURCE GLYPHS: bold cream silhouettes on a dark casing, standing on a ground
// line; drawn in a 100-unit-tall box (ground at y 100, x centred on 0). reveal 0..1
// raises them out of the ground (a clip rising from the ground line).
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
const INK_SHADE = "#CDBF9C"; // cream on the shaded face

const Glyph: React.FC<{ kind: Src; x: number; y: number; h: number; cam: Cam; reveal: number; id: string }> = ({ kind, x, y, h, cam, reveal, id }) => {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const s = h / cam.k / 100; // world px per unit
  const u = (v: number) => (v * 100) / h; // screen px -> units
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
              {/* the facet: one dark crease from the crown down, the right face shaded */}
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
          <rect x={-90} y={104 - 110 * rv} width={180} height={110 * rv + 2} />
        </clipPath>
      </defs>
      <g clipPath={rv < 1 ? `url(#${id}-rise)` : undefined}>{body}</g>
      <path d="M-84,100.5L84,100.5" stroke={SHADOW} strokeOpacity={0.7} strokeWidth={u(5)} strokeLinecap="round" opacity={rv} />
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

// ---------------------------------------------------------------------------
const ManchuriaAutarky: React.FC<Props> = ({ label, debug }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(KEYS, frame);
  const k = cam.k;
  const zg = zoomGrow(k);

  // -- the front: the contour of the travel-time field at this frame's level ---------
  const lv = frontT(frame);
  const frontLive = lv > 0 && frame < FRONT_DONE;
  const frontD = frontLive ? frontRings(lv).map((r) => dOf(r, true)).join("") : "";
  const frontOp = clamp01((frame - T.front[0]) / 3) * (1 - ramp(frame, T.front[1] - 6, T.front[1]));

  // -- the orange flow -------------------------------------------------------------
  const drawn = drawnIntervals(frame);
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
    const w = SIM.first[src];
    return w && frame >= w.born ? Math.min(FEED_LEN[src], V * (frame - w.born)) : 0;
  };
  const wagons: React.ReactNode[] = [];
  for (const w of SIM.wagons) {
    const q = wagonAt(w, frame);
    if (q) wagons.push(<OrangeWagon key={w.id} x={q.x} y={q.y} tx={q.tx} ty={q.ty} cam={cam} size={WAGON * zg} />);
  }

  // -- foreign trade: lanes (full styling until they withdraw) and the ships on them ------
  const lanes = LANES.map((L, i) => {
    const u = smoother(clamp01((frame - T.turn[i] - T.withdrawDelay) / T.withdrawFrames));
    const drawnTo = LANE_LEN[i] - (LANE_LEN[i] - LANE_OUT[i]) * u;
    return { L, drawnTo };
  });
  const ships: React.ReactNode[] = [];
  SAILINGS.forEach((list, i) =>
    list.forEach((sl, j) => {
      const q = shipPose(i, sl, frame, TURN_SIDE[i]);
      if (q) ships.push(<Ship key={`s-${i}-${j}`} x={q.x} y={q.y} hx={q.hx} hy={q.hy} cam={cam} />);
    }),
  );

  // -- the advance arrows ---------------------------------------------------------------
  const arrowOp = 1 - ramp(frame, ARROW_FADE[0], ARROW_FADE[1]);

  const rise = (src: Src) => ramp(frame, RISE[src], RISE[src] + T.glyphRise);
  const gh = (src: Src) => GLYPH_W * GLYPH_SCALE[src] * k;

  // Japan proper round the Kanmon strait and the Chugoku hills (world px): its land hides
  // the wagons Japan takes in and the ones it sends on through to Tsuruga
  const JB = { x0: 848, y0: 780, x1: 948, y1: 866 };

  return (
    <MapPage world="asia" cam={cam}>
      <WorldSvg
        cam={cam}
        defs={
          <>
            <mask id="ma-japan" maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={8000} height={8000}>
              <rect x={-3000} y={-3000} width={8000} height={8000} fill="#fff" />
              <path d={JAPAN_1931.d} fill="#000" fillRule="evenodd" />
            </mask>
            <clipPath id="ma-jbox">
              <rect x={JB.x0} y={JB.y0} width={JB.x1 - JB.x0} height={JB.y1 - JB.y0} />
            </clipPath>
            <mask id="ma-japanproper" maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={8000} height={8000}>
              <rect x={-3000} y={-3000} width={8000} height={8000} fill="#fff" />
              <g clipPath="url(#ma-jbox)">
                <path d={JAPAN_1931.d} fill="#000" fillRule="evenodd" />
              </g>
            </mask>
            {frontLive ? (
              <>
                <clipPath id="ma-front">
                  <path d={frontD} clipRule="evenodd" />
                </clipPath>
                <clipPath id="ma-mkland">
                  <path d={MANCHUKUO.d} clipRule="evenodd" />
                </clipPath>
              </>
            ) : null}
          </>
        }
      >
        {/* Japan's empire of 1931, and Manchuria taken behind one irregular frontier */}
        <Hatch region={JAPAN_1931} cam={cam} id="ma-j31" />
        {lv > 0 ? (
          <g clipPath={frontLive ? "url(#ma-front)" : undefined}>
            <Hatch region={MANCHUKUO} cam={cam} id="ma-mk" />
          </g>
        ) : null}
        {frontLive && frontOp > 0 ? (
          <g clipPath="url(#ma-mkland)" opacity={frontOp}>
            <path d={frontD} fill="none" stroke={SHADOW} strokeOpacity={0.55} strokeWidth={6 / k} strokeLinejoin="round" />
            <path d={frontD} fill="none" stroke={ACCENT} strokeWidth={3 / k} strokeLinejoin="round" />
          </g>
        ) : null}

        {/* the Kwantung Army's advance: three arrows out of the railway zone, leading the front */}
        {arrowOp > 0 ? ARROWS.map((A, i) => <AdvanceArrow key={`arr-${i}`} pts={A} sh={arrowHead(i, frame)} cam={cam} zg={zg} opacity={arrowOp} />) : null}

        {/* foreign trade: four cream sea-lanes, freighters docking under Japan's coast */}
        <g mask="url(#ma-japan)">
          {lanes.map(({ L, drawnTo }, i) =>
            drawnTo > 0.5 ? <InkStroke key={`lane-${i}`} d={dOf(slicePts(L, 0, drawnTo))} cam={cam} width={LANE_W} tone={0} opacity={0.7} /> : null,
          )}
          {ships}
        </g>

        {/* the empire's own supply: feeders, then one ring round Korea */}
        <g mask="url(#ma-japanproper)">
          {(["soy", "coal", "iron"] as Src[]).map((src) => (
            <Route key={`feed-${src}`} route={FEED_ROUTE[src]} kind="rail" cam={cam} drawn={feedDrawn(src)} tone={1} width={(RAIL_W - 1) * zg} dashK={DASH_K} opacity={ROUTE_OP} />
          ))}
          {legPieces}
          {wagons}
        </g>

        {/* the resources, raised out of the ground once the front has passed them */}
        {(["soy", "coal", "iron"] as Src[]).map((src) => (
          <Glyph key={src} kind={src} x={GLYPH[src][0]} y={GLYPH[src][1]} h={gh(src)} cam={cam} reveal={rise(src)} id={`ma-g-${src}`} />
        ))}

        <Label x={735} y={590} text={label} appear={T.label} frame={frame} cam={cam} cap={42} />

        {debug ? (
          <g>
            <path d={dOf(LOOP)} fill="none" stroke="#f0f" strokeWidth={1 / k} />
            {LANES.map((L, i) => (
              <path key={i} d={dOf(L)} fill="none" stroke="#0ff" strokeWidth={1 / k} />
            ))}
            {(["soy", "coal", "iron"] as Src[]).map((s) => (
              <path key={s} d={dOf(FEED[s])} fill="none" stroke="#0f0" strokeWidth={1 / k} />
            ))}
            <rect x={JB.x0} y={JB.y0} width={JB.x1 - JB.x0} height={JB.y1 - JB.y0} fill="none" stroke="#ff0" strokeWidth={1 / k} />
          </g>
        ) : null}
      </WorldSvg>
    </MapPage>
  );
};

export default ManchuriaAutarky;
