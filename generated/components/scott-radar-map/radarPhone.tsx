// ---------------------------------------------------------------------------------------------------------------
// radarPhone — the shared prop of scott-radar-map (Cheeky Pint S4E05, Scott Kirby): a modern smartphone as a lit
// object in the clip's warm light, its screen a Messages-style thread from United, and the weather RADAR MAP that
// United sent to delayed customers. Used big by cut 1 (RadarMapOnThePhone) and small by cut 3 (MinusSixtyToPlusSixty,
// at the column feet). Read-only for other cuts; additions keep the old exports (log them in notes/SHARED_CHANGES.md).
//
// EXPORTS
//   <Phone variant="plain"|"radar" scale reveal drift b1 b2 glow shadow sun res />  — the whole phone (DOM, opaque
//       body, no backdrop). Occupies PHONE_W*scale x PHONE_H*scale px from its top-left; position it absolutely.
//   <RadarMap width reveal drift res />  — the radar image alone (RADAR_W x RADAR_H intrinsic, 4:3), drawn at `width` px.
//   PHONE_W, PHONE_H, SCREEN, THREAD (the thread's layout in phone px), RADAR_W, RADAR_H, ORD_XY, mapXY(lon, lat),
//   SQUALL (the line's leading edge in map units and miles west of ORD), UnitedAvatar.
//
// THE RADAR MAP: a warm-graded basemap of the Chicago area (lon -89.0..-86.9, lat 42.57..41.39: 108 x 81 mi; cream-tan
// land, Lake Michigan a muted teal in the east, the urban footprint a shade darker, interstates and the IL–IN line as
// hairlines, O'Hare an ink ring + "ORD"), and a squall line of reflectivity returns running NNE–SSW WEST of O'Hare
// (leading edge ~19 mi west of ORD at its latitude, bowing east in the middle; trailing stratiform rain to the west),
// in a warm-graded NEXRAD ramp: olive greens -> yellow -> amber -> brick-red cores (amber and up bloom, fixed).
// `reveal` 0..1 is a clockwise radar sweep about ORD starting due south (the line, SSW..NNW of ORD, is painted in the
// first ~45 % of the sweep); unswept map sits dimmed. `drift` is the story clock S (frames): the line creeps east
// (~0.35 map units a frame) while its cells ride north along it.
//
// SOURCES: shoreline, ORD (41.978 N, 87.904 W) and interstate courses from public maps (OpenStreetMap / USGS), drawn
// as simplified polylines. The squall line is illustrative (the speaker's "line of thunderstorms" west of the airport),
// not one day's NEXRAD scan. United globe: generated/components/scott-aircraft-order/airlineMarks.ts (Simple Icons, CC0).
// ---------------------------------------------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { COLOR, FONT_LABEL, bloomFilter } from "../kits/cheeky-pint/stoutShared";
import { MARKS } from "../scott-aircraft-order/airlineMarks";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const u = clamp01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===================================================================================================================
// THE RADAR MAP
// ===================================================================================================================
export const RADAR_W = 720;
export const RADAR_H = 540;
const LON0 = -89.0;
const LON1 = -86.9;
const LAT0 = 42.57;
const LAT1 = 41.39;
/** lon/lat -> map units (RADAR_W x RADAR_H) */
export const mapXY = (lon: number, lat: number): [number, number] => [((lon - LON0) / (LON1 - LON0)) * RADAR_W, ((LAT0 - lat) / (LAT0 - LAT1)) * RADAR_H];
export const ORD_XY = mapXY(-87.904, 41.978);
/** map units per statute mile (108 mi across) */
export const MAP_PER_MI = RADAR_W / 108;

/** the squall line's leading edge (map x at map y, before drift): NNE–SSW, bowing east in the middle */
const leadX = (y: number) => 246 - 0.1 * (y - ORD_XY[1]) + 26 * Math.exp(-(((y - ORD_XY[1] - 11) / 150) ** 2));
export const SQUALL = {
  /** leading edge, map x at map y (add DRIFT_X * S for the creep) */
  leadX,
  /** east creep, map units per frame of S */
  DRIFT_X: 0.35,
  /** the leading edge's distance west of ORD at ORD's latitude, miles (at S = 0) */
  milesWestOfOrd: (ORD_XY[0] - leadX(ORD_XY[1])) / MAP_PER_MI,
  /** the convective core sits ~3 mi behind the edge; the stratiform rain trails ~10-40 mi further west */
  coreMilesBehindEdge: 3,
} as const;

// --- deterministic value noise --------------------------------------------------------------------------------------
const hash2 = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const vnoise = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};

/** reflectivity (dBZ-like) at map (x, y) for story clock S */
const dbzAt = (x: number, y: number, S: number) => {
  const xs = x - SQUALL.DRIFT_X * S;
  const ys = y + 0.22 * S; // cells ride north along the line
  const wig = 14 * (vnoise(ys / 70, 3.1) - 0.5) + 6 * (vnoise(ys / 24, 9.7) - 0.5);
  const d = xs - (leadX(y) + wig); // >0: ahead (east) of the leading edge
  if (d > 14) return 0;
  // the convective line: a sharp leading edge, the cores ~20 units behind it, fading west by ~70
  const edge = 1 - smooth(-12, 7, d);
  const back = d < -16 ? Math.exp(-(((-16 - d) / 44) ** 2)) : 1;
  const cells = vnoise(ys / 40 + 11.3, d / 34 + 4.2);
  const cells2 = vnoise(ys / 13 + 2.7, d / 11 + 7.9);
  const conv = 59 * edge * back * (0.56 + 0.4 * cells + 0.14 * cells2);
  // the trailing stratiform rain: a broad, softer band to the west, ragged
  const sn = vnoise(xs / 46 + 5.5, ys / 40 + 1.3);
  const strat = 30 * smooth(-26, -70, d) * (1 - smooth(-180, -280, d)) * (0.58 + 0.62 * sn);
  // ragged texture on every edge
  const tex = 5 * (vnoise(xs / 7 + 1.1, ys / 7 + 3.3) - 0.5) + 3 * (vnoise(xs / 3.2, ys / 3.2) - 0.5);
  return Math.max(conv, strat) + tex * (0.5 + 0.5 * edge);
};

/** the warm-graded radar ramp: [dBZ floor, r, g, b, alpha, hot (blooms)] */
const RAMP: [number, number, number, number, number, boolean][] = [
  [16, 0xb8, 0xbb, 0x7c, 0.52, false],
  [23, 0x96, 0xa5, 0x5a, 0.7, false],
  [30, 0x6f, 0x8a, 0x44, 0.82, false],
  [37, 0xe8, 0xc9, 0x4c, 0.92, false],
  [42, 0xff, 0xb0, 0x00, 0.97, true],
  [47, 0xec, 0x86, 0x16, 1, true],
  [52, 0xbf, 0x4e, 0x2e, 1, true],
  [57, 0x93, 0x31, 0x1f, 1, true],
];
const DIM = { r: 0x43, g: 0x2c, b: 0x1c, a: 0.34 }; // unswept map: dimmed toward the ground
const SWEEP_FROM = Math.PI; // the sweep starts due south and turns clockwise (through west first)
const FEATHER = 0.32; // rad: the sweep's soft trailing edge

const drawReturns = (base: CanvasRenderingContext2D, hot: CanvasRenderingContext2D, cw: number, ch: number, reveal: number, S: number) => {
  const k = RADAR_W / cw;
  const img = base.createImageData(cw, ch);
  const himg = hot.createImageData(cw, ch);
  const D = img.data;
  const HD = himg.data;
  const A = reveal * (2 * Math.PI + FEATHER);
  const soft = 1.4 / k; // the band edges: a soft step ~1.4 px wide
  for (let j = 0; j < ch; j++) {
    const y = (j + 0.5) * k;
    for (let i = 0; i < cw; i++) {
      const x = (i + 0.5) * k;
      // the sweep mask
      let mask = 1;
      if (reveal < 1) {
        let th = Math.atan2(x - ORD_XY[0], -(y - ORD_XY[1])) - SWEEP_FROM; // from the start, clockwise
        th = ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        mask = reveal <= 0 ? 0 : smooth(A, A - FEATHER, th);
      }
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let ha = 0;
      if (mask > 0) {
        const z = dbzAt(x, y, S);
        if (z > RAMP[0][0] - 2) {
          // the highest band reached, blended softly into the one below over `soft` dBZ-ish
          for (let q = 0; q < RAMP.length; q++) {
            const L = RAMP[q];
            const t = smooth(L[0] - 0.6 * soft, L[0] + 0.6 * soft, z);
            if (t <= 0) break;
            r = r + (L[1] - r) * t;
            g = g + (L[2] - g) * t;
            b = b + (L[3] - b) * t;
            a = a + (L[4] - a) * t;
            if (L[5]) ha = Math.max(ha, t);
          }
          a *= mask;
          ha *= mask;
        }
      }
      const da = DIM.a * (1 - mask);
      const oa = a + da * (1 - a);
      const o = (j * cw + i) * 4;
      if (oa > 0) {
        D[o] = (r * a + DIM.r * da * (1 - a)) / oa;
        D[o + 1] = (g * a + DIM.g * da * (1 - a)) / oa;
        D[o + 2] = (b * a + DIM.b * da * (1 - a)) / oa;
        D[o + 3] = oa * 255;
      }
      if (ha > 0) {
        HD[o] = r;
        HD[o + 1] = g;
        HD[o + 2] = b;
        HD[o + 3] = ha * 255;
      }
    }
  }
  base.putImageData(img, 0, 0);
  hot.putImageData(himg, 0, 0);
};

// --- the basemap geometry (map units) -------------------------------------------------------------------------------
const pathOf = (pts: [number, number][], close = false) =>
  pts.map(([lon, lat], i) => {
    const [x, y] = mapXY(lon, lat);
    return `${i ? "L" : "M"}${f3(x)} ${f3(y)}`;
  }).join(" ") + (close ? " Z" : "");
const SHORE: [number, number][] = [
  [-87.79, 42.66],
  [-87.8, 42.56],
  [-87.805, 42.5],
  [-87.83, 42.36],
  [-87.8, 42.25],
  [-87.73, 42.15],
  [-87.68, 42.06],
  [-87.64, 41.97],
  [-87.61, 41.89],
  [-87.58, 41.8],
  [-87.53, 41.73],
  [-87.52, 41.69],
  [-87.43, 41.665],
  [-87.33, 41.625],
  [-87.2, 41.632],
  [-87.05, 41.665],
  [-86.9, 41.72],
  [-86.82, 41.76],
];
const LAKE = pathOf([...SHORE, [-86.8, 42.66]], true);
const URBAN = pathOf(
  [
    [-87.66, 42.17],
    [-87.86, 42.13],
    [-88.1, 42.08],
    [-88.24, 41.96],
    [-88.2, 41.79],
    [-88.06, 41.68],
    [-87.86, 41.6],
    [-87.62, 41.56],
    [-87.4, 41.57],
    [-87.33, 41.625],
    [-87.52, 41.69],
    [-87.58, 41.8],
    [-87.62, 41.92],
  ],
  true,
);
const ROADS: [number, number][][] = [
  // I-90 Kennedy / Jane Addams to the NW
  [[-87.63, 41.88], [-87.76, 41.95], [-87.9, 41.99], [-88.1, 42.05], [-88.32, 42.08], [-88.62, 42.2], [-89.05, 42.3]],
  // I-88 west
  [[-87.94, 41.86], [-88.3, 41.8], [-88.7, 41.79], [-89.05, 41.78]],
  // I-55 southwest
  [[-87.63, 41.86], [-87.9, 41.75], [-88.18, 41.56], [-88.4, 41.4], [-88.55, 41.3]],
  // I-57 south
  [[-87.64, 41.73], [-87.74, 41.5], [-87.8, 41.4], [-87.84, 41.3]],
  // I-94 north
  [[-87.74, 42.0], [-87.84, 42.24], [-87.93, 42.66]],
  // I-80 east-west
  [[-89.05, 41.5], [-88.1, 41.525], [-87.52, 41.57], [-87.15, 41.6], [-86.8, 41.62]],
  // the tollway ring (I-294)
  [[-87.86, 42.17], [-87.9, 41.98], [-87.88, 41.8], [-87.73, 41.64], [-87.52, 41.6]],
];
const STATE_LINE = pathOf([[-87.525, 41.7], [-87.525, 41.3]]);
const PLANE = "M12 2c.8 0 1.3.9 1.3 2v5.2l7.7 4.3v2l-7.7-2.2v4.6l2.2 1.7V21L12 20l-3.5 1v-1.4l2.2-1.7v-4.6L3 15.5v-2l7.7-4.3V4c0-1.1.5-2 1.3-2z";

const MAP = { land: "#E4D4B5", landLo: "#DCCAA9", urban: "#D3BF9C", lake: "#8EAEA3", lakeLo: "#7FA196", shore: "#B79D7D", road: "#B89A78", state: "#A98B6C" } as const;

/** the two canvases of the returns (base + hot cores under the bloom), redrawn every frame in one layout effect
 *  (software rasteriser, like the world's canvases) */
const ReturnsCanvases: React.FC<{ cw: number; ch: number; reveal: number; drift: number; bloom: string }> = ({ cw, ch, reveal, drift, bloom }) => {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const hotRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const b = baseRef.current;
    const h = hotRef.current;
    if (!b || !h) return;
    b.width = cw;
    b.height = ch;
    h.width = cw;
    h.height = ch;
    const bc = b.getContext("2d", { willReadFrequently: true });
    const hc = h.getContext("2d", { willReadFrequently: true });
    if (bc && hc) drawReturns(bc, hc, cw, ch, reveal, drift);
  }, [cw, ch, reveal, drift]);
  const st: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" };
  return (
    <>
      <canvas ref={baseRef} width={cw} height={ch} style={st} />
      <canvas ref={hotRef} width={cw} height={ch} style={{ ...st, filter: bloom, opacity: 0.85 }} />
    </>
  );
};

export type RadarMapProps = {
  /** display width px (height = width * RADAR_H / RADAR_W = 3/4) */
  width: number;
  /** 0..1 the sweep about ORD (1 = fully painted, no beam) */
  reveal?: number;
  /** story clock S (frames): the line creeps east, its cells ride north */
  drift?: number;
  /** canvas resolution as a fraction of RADAR_W x RADAR_H (1 = 720x480; 0.5 is plenty at ~260 px) */
  res?: number;
  /** bloom strength divisor (bloomFilter's k; larger = tighter) */
  bloomK?: number;
};

export const RadarMap: React.FC<RadarMapProps> = ({ width, reveal = 1, drift = 0, res = 1, bloomK }) => {
  const h = (width * RADAR_H) / RADAR_W;
  const cw = Math.max(8, Math.round(RADAR_W * res));
  const ch = Math.max(8, Math.round(RADAR_H * res));
  const sweepDeg = ((SWEEP_FROM + reveal * (2 * Math.PI + FEATHER)) * 180) / Math.PI;
  const beam = reveal > 0 && reveal < 1 ? smooth(0, 0.04, reveal) * (1 - smooth(0.86, 1, reveal)) : 0;
  const s = width / RADAR_W; // display px per map unit
  const [ox, oy] = ORD_XY;
  // bloom radius in display px: scaled with the map so the glow belongs to the picture at every size
  const k = bloomK ?? Math.max(1.2, 2.6 / Math.max(0.25, s));
  return (
    <div style={{ position: "relative", width, height: h, overflow: "hidden", backgroundColor: MAP.land }}>
      {/* the basemap */}
      <svg width={width} height={h} viewBox={`0 0 ${RADAR_W} ${RADAR_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="rpLand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={MAP.land} />
            <stop offset="1" stopColor={MAP.landLo} />
          </linearGradient>
          <linearGradient id="rpLake" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={MAP.lake} />
            <stop offset="1" stopColor={MAP.lakeLo} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={RADAR_W} height={RADAR_H} fill="url(#rpLand)" />
        <path d={URBAN} fill={MAP.urban} opacity={0.7} />
        {ROADS.map((r, i) => (
          <path key={i} d={pathOf(r)} fill="none" stroke={MAP.road} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        <path d={STATE_LINE} fill="none" stroke={MAP.state} strokeWidth={1.8} strokeDasharray="7 6" />
        <path d={LAKE} fill="url(#rpLake)" stroke={MAP.shore} strokeWidth={2} strokeLinejoin="round" />
      </svg>
      {/* the returns (and the unswept dim), then the hot cores again under the fixed amber bloom */}
      <ReturnsCanvases cw={cw} ch={ch} reveal={reveal} drift={drift} bloom={bloomFilter(k)} />
      {/* the sweep: a soft trailing fan and the beam line about ORD (only while painting) */}
      {beam > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: beam,
            background: `conic-gradient(from ${f3(sweepDeg - 46)}deg at ${f3(ox * s)}px ${f3(oy * s)}px, rgba(255,240,212,0) 0deg, rgba(255,240,212,0.26) 45.4deg, rgba(255,246,228,0.8) 46deg, rgba(255,240,212,0) 46.4deg, rgba(255,240,212,0) 360deg)`,
          }}
        />
      ) : null}
      {/* O'Hare */}
      <svg width={width} height={h} viewBox={`0 0 ${RADAR_W} ${RADAR_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={ox} cy={oy} r={15} fill={COLOR.cream} stroke={COLOR.inkDark} strokeWidth={4} />
        <g transform={`translate(${f3(ox - 10.5)},${f3(oy - 10.5)}) scale(0.875)`}>
          <path d={PLANE} fill={COLOR.inkDark} />
        </g>
      </svg>
      {/* its label as DOM text (SVG text placement was unstable across render tabs) */}
      <div
        style={{
          position: "absolute",
          left: (ox + 23) * s,
          top: (oy - 18) * s,
          height: 36 * s,
          fontFamily: FONT_LABEL,
          fontSize: 29 * s,
          lineHeight: `${36 * s}px`,
          letterSpacing: 1.5 * s,
          color: COLOR.inkDark,
          whiteSpace: "nowrap",
        }}
      >
        ORD
      </div>
    </div>
  );
};

// ===================================================================================================================
// THE PHONE
// ===================================================================================================================
export const PHONE_W = 780;
/** a modern iPhone (71.5 x 147.5 mm): height / width = 2.063 */
export const PHONE_H = 1608;
/** the metal frame band, then the dark glass border: together a thin, even bezel (~2.5 % of the width) */
const FRAME = 6;
const BEZEL = 20;
/** corner radius ~0.14 x width; the screen's corners concentric with the body's */
const R_BODY = 109;
const R_SCREEN = R_BODY - BEZEL;
export const SCREEN = { x: BEZEL, y: BEZEL, w: PHONE_W - 2 * BEZEL, h: PHONE_H - 2 * BEZEL } as const;
/** the thread's layout in SCREEN px (add SCREEN.x / SCREEN.y for phone px) */
export const THREAD = {
  /** the Dynamic Island: a pill ~0.27 x the body width, near the top */
  island: { y: 22, w: 211, h: 60 },
  /** the header row: United's avatar with "United" next to it, centred as a group */
  avatar: { cy: 142, r: 38 },
  name: { px: 38, gap: 18 },
  divider: 198,
  pad: 30,
  b1: { y: 222, h: 246, px: 50, line: 62, padX: 34, padY: 30 },
  /** the image bubble spans the thread's full width; the map inside it is 4:3 */
  b2: { y: 486, w: SCREEN.w - 60, h: ((SCREEN.w - 60) * RADAR_H) / RADAR_W, r: 40 },
  input: { y: SCREEN.h - 150, h: 74 },
} as const;
const UI = {
  screenTop: "#EAE0CE",
  screenFoot: "#E2D6C1",
  bubble: "#D6C8B1",
  divider: "#D5C8B3",
  inputLine: "#CDBFA8",
  island: "#24170F",
  glass: "#2B1D13",
  metal: ["#C9B49A", "#7A6250", "#4A3627", "#8E7661", "#D8C7AE"],
} as const;
const B1_LINES = ["Your flight UA 1453 is", "delayed 1 hr due to", "weather."];

/** United's globe in a round avatar: the tail crop's field stamped in ink, the globe left in the tile's cream. */
export const UnitedAvatar: React.FC<{ r: number; id?: string }> = ({ r, id = "ua" }) => {
  const p = MARKS.united.paths;
  return (
    <svg width={2 * r} height={2 * r} viewBox="0 0 24 24" style={{ display: "block" }}>
      <defs>
        <clipPath id={`${id}clip`}>
          <circle cx={12} cy={12} r={12} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}clip)`}>
        <rect x={0} y={0} width={24} height={24} fill={COLOR.cream} />
        {p.map((q, i) => (
          <path key={i} d={q.d} transform={`matrix(${q.m.join(",")})`} fill={COLOR.inkDark} />
        ))}
      </g>
    </svg>
  );
};

const entrance = (p: number): React.CSSProperties => ({
  transform: `translateY(${f3((1 - p) * 44)}px)`,
  opacity: f3(clamp01(p * 1.25)),
  filter: p < 1 ? `blur(${f3((1 - p) * 7)}px)` : undefined,
});

export type PhoneProps = {
  variant?: "plain" | "radar";
  /** display scale (1 = PHONE_W x PHONE_H px) */
  scale?: number;
  /** the radar sweep 0..1 (radar variant) */
  reveal?: number;
  /** story clock S (frames): radar creep, sun drift */
  drift?: number;
  /** entrance progress 0..1 of the plain delay bubble / the radar image bubble (stout entrance: slide up, unblur) */
  b1?: number;
  b2?: number;
  /** the screen's soft glow 0..1 */
  glow?: number;
  /** draw the phone's own soft shadow (off when the scene casts its own) */
  shadow?: boolean;
  /** offset (phone px) of the soft sun bands across the glass; null = none */
  sun?: number | null;
  /** radar canvas resolution (see RadarMap) */
  res?: number;
  /** unique prefix for SVG ids when several phones share a frame */
  id?: string;
};

export const Phone: React.FC<PhoneProps> = ({ variant = "radar", scale = 1, reveal = 1, drift = 0, b1 = 1, b2 = 1, glow = 1, shadow = true, sun = null, res = 1, id = "ph" }) => {
  const T = THREAD;
  const s0 = sun === null ? 0 : (((sun % 520) + 520) % 520) - 520;
  return (
    <div style={{ position: "relative", width: PHONE_W * scale, height: PHONE_H * scale }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: PHONE_W, height: PHONE_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        {/* one soft shadow (the key light is above-left: it falls down-right) */}
        {shadow ? (
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 50,
              width: PHONE_W,
              height: PHONE_H,
              borderRadius: R_BODY,
              backgroundColor: COLOR.shadow,
              opacity: 0.42,
              filter: "blur(38px)",
            }}
          />
        ) : null}
        {/* the screen's glow on the air around it */}
        {glow > 0 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: R_BODY,
              boxShadow: `0 0 90px 14px rgba(250,232,196,${f3(0.22 * glow)})`,
            }}
          />
        ) : null}
        {/* the side buttons (small, in the frame's metal): action + volume on the left, the side button on the right */}
        {[
          { x: -4, y: 262, h: 56 },
          { x: -4, y: 362, h: 96 },
          { x: -4, y: 482, h: 96 },
          { x: PHONE_W - 1, y: 400, h: 150 },
        ].map((k, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: k.x,
              top: k.y,
              width: 5,
              height: k.h,
              borderRadius: 2.5,
              background: `linear-gradient(to bottom, ${UI.metal[3]}, ${UI.metal[2]})`,
            }}
          />
        ))}
        {/* the metal frame: a thin band round the body, lit from above-left (a cream glint on its top-left edge) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: R_BODY,
            background: `linear-gradient(150deg, ${UI.metal[4]} 0%, ${UI.metal[0]} 12%, ${UI.metal[1]} 40%, ${UI.metal[2]} 70%, ${UI.metal[3]} 100%)`,
            boxShadow: `inset 1.5px 1.5px 0 0 rgba(255,246,230,0.55), inset -1.5px -1.5px 0 0 rgba(34,21,11,0.5)`,
          }}
        />
        {/* the dark glass border inside the frame (even all round) */}
        <div
          style={{
            position: "absolute",
            inset: FRAME,
            borderRadius: R_BODY - FRAME,
            background: `linear-gradient(155deg, ${UI.glass} 0%, ${UI.island} 100%)`,
          }}
        />
        {/* the screen */}
        <div
          style={{
            position: "absolute",
            left: SCREEN.x,
            top: SCREEN.y,
            width: SCREEN.w,
            height: SCREEN.h,
            borderRadius: R_SCREEN,
            overflow: "hidden",
            background: `linear-gradient(to bottom, ${UI.screenTop}, ${UI.screenFoot})`,
          }}
        >
          {/* the dynamic island */}
          <div style={{ position: "absolute", left: (SCREEN.w - T.island.w) / 2, top: T.island.y, width: T.island.w, height: T.island.h, borderRadius: T.island.h / 2, backgroundColor: UI.island }} />
          {/* the header row: United's avatar with its name next to it */}
          <div
            style={{
              position: "absolute",
              left: 0,
              width: SCREEN.w,
              top: T.avatar.cy - T.avatar.r,
              height: 2 * T.avatar.r,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: T.name.gap,
            }}
          >
            <div style={{ width: 2 * T.avatar.r, height: 2 * T.avatar.r, borderRadius: "50%", boxShadow: `0 0 0 2px ${UI.divider}` }}>
              <UnitedAvatar r={T.avatar.r} id={`${id}av`} />
            </div>
            <div style={{ fontFamily: FONT_LABEL, fontSize: T.name.px, lineHeight: `${T.name.px * 1.2}px`, color: COLOR.inkDark, paddingRight: 8 }}>United</div>
          </div>
          <div style={{ position: "absolute", left: 0, top: T.divider, width: SCREEN.w, height: 2, backgroundColor: UI.divider }} />
          {/* the plain delay message (an incoming bubble with its tail) */}
          <div style={{ position: "absolute", left: T.pad, top: T.b1.y, ...entrance(b1) }}>
            <div
              style={{
                position: "relative",
                height: T.b1.h,
                boxSizing: "border-box",
                padding: `${T.b1.padY}px ${T.b1.padX}px`,
                borderRadius: 42,
                backgroundColor: UI.bubble,
                fontFamily: FONT_LABEL,
                fontSize: T.b1.px,
                lineHeight: `${T.b1.line}px`,
                color: COLOR.inkDark,
                whiteSpace: "nowrap",
              }}
            >
              {B1_LINES.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
              <svg width={34} height={30} viewBox="0 0 34 30" style={{ position: "absolute", left: -11, bottom: 0 }}>
                <path d="M26 0 C26 14 20 24 0 30 C16 30 28 27 34 20 Z" fill={UI.bubble} />
              </svg>
            </div>
          </div>
          {/* the radar image message */}
          {variant === "radar" ? (
            <div
              style={{
                position: "absolute",
                left: T.pad,
                top: T.b2.y,
                width: T.b2.w,
                height: T.b2.h,
                borderRadius: T.b2.r,
                overflow: "hidden",
                boxShadow: `0 0 0 2px ${UI.divider}`,
                ...entrance(b2),
              }}
            >
              <RadarMap width={T.b2.w} reveal={reveal} drift={drift} res={res} />
            </div>
          ) : null}
          {/* the input bar and the home indicator (no text) */}
          <div style={{ position: "absolute", left: 30, top: T.input.y, width: T.input.h, height: T.input.h, borderRadius: "50%", backgroundColor: UI.divider }} />
          <div
            style={{
              position: "absolute",
              left: 30 + T.input.h + 18,
              top: T.input.y,
              width: SCREEN.w - 60 - T.input.h - 18,
              height: T.input.h,
              borderRadius: T.input.h / 2,
              boxSizing: "border-box",
              border: `2.5px solid ${UI.inputLine}`,
            }}
          />
          <div style={{ position: "absolute", left: (SCREEN.w - 250) / 2, top: SCREEN.h - 30, width: 250, height: 10, borderRadius: 5, backgroundColor: COLOR.inkDark, opacity: 0.75 }} />
          {/* the glass: a faint diagonal sheen, and the low sun's soft bands drifting over it */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(118deg, rgba(255,250,240,0) 30%, rgba(255,250,240,0.09) 44%, rgba(255,250,240,0) 58%)" }} />
          {sun !== null ? (
            <div
              style={{
                position: "absolute",
                inset: -200,
                mixBlendMode: "soft-light",
                background: `repeating-linear-gradient(104deg, rgba(255,241,214,0) ${f3(s0 + 520)}px, rgba(255,241,214,0.34) ${f3(s0 + 640)}px, rgba(255,241,214,0) ${f3(s0 + 780)}px, rgba(255,241,214,0) ${f3(s0 + 1040)}px)`,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
