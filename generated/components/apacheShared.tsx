// ---------------------------------------------------------------------------
// apacheShared: THE APACHE WORLD (the American Southwest and northern Mexico)
// for the cut VeryLongTime of the clip "Sheppard: centralized empires fell
// fast" (Dwarkesh map style), plus the YEAR ODOMETER first built for
// OneFellSwoopV2, here as a reusable component.
//
// THE MAP (world px): north-up Lambert conformal conic, parallels 27 N / 37 N,
// centre meridian 107 W (scripts/build-apache-map.mjs -> apacheMapData.ts,
// public/apache/*.png). World px == screen px at { k: 1, cx: 540, cy: 960 }:
// 69 px per degree of longitude, (107 W, 32 N) at the frame's true centre. ONE
// baked level (1.35 texels per world px: sharp to k ~1.4) over world x -90 ...
// 1170, y -90 ... 2010. No borders, no state lines, no rivers.
//
// API (palette, camera, fonts, paper, labels are incaShared's, re-exported)
//   project(lon, lat); <MapStack cam />; <MapPage cam vignette?>
//   APACHERIA (the schematic ring, world px), APACHERIA_C (its centroid)
//   <OrangeCountry ring cam highlight? edge? /> the orange country: deep wash, orange
//     45 deg hatch, dashed orange edge; ring = the (possibly flexed) outline;
//     highlight = 0..1 phase of a faint brighter band travelling the hatch
//   <FortifiedEdge ring cam press? /> (V2) the reinforced border: a solid
//     orange line with outward teeth, thickening where press(p) > 0
//   <YearOdometer frame yearAt x top size? columnsAt? maxBlur? /> IM Fell English numerals, cream
//     with a dark halo, four wheels of a TRUE odometer (the units wheel turns
//     with the year, each higher wheel only while the one below runs 9 -> 0),
//     each wheel blurred vertically by its own speed; x = its centre, top = the
//     cell's top (screen px; the cell is 1.2 x size tall); odometerColumns(y)
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ACCENT, ACCENT_DEEP, INK, INK_FULL, Mottle, PaperTop, SEA, camTransform, clamp01, fell, viewRect, type Cam } from "./incaShared";
import { APACHERIA, APACHERIA_C, BASE, PROJ, PX_PER_KM, TILES, type P2 } from "./apacheMapData";

export type { Cam } from "./incaShared";
export type { P2 } from "./apacheMapData";
export {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_CONTEXT,
  INK_FULL,
  MapLabel,
  PaperTop,
  SEA,
  WorldSvg,
  camFor,
  camScan,
  clamp01,
  fell,
  fellSC,
  hash,
  screenOf,
  smoothstep,
  swayCam,
  worldOf,
} from "./incaShared";
export { APACHERIA, APACHERIA_C, PX_PER_KM };

const RAD = Math.PI / 180;
const tany = (y: number) => Math.tan((Math.PI / 2 + y) / 2);
const Y0 = PROJ.parallels[0] * RAD;
const Y1 = PROJ.parallels[1] * RAD;
const N_ = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
const F_ = (Math.cos(Y0) * Math.pow(tany(Y0), N_)) / N_;
export const project = (lon: number, lat: number): P2 => {
  const r = F_ / Math.pow(tany(lat * RAD), N_);
  const x = N_ * (lon + PROJ.rotate[0]) * RAD;
  return [PROJ.translate[0] + PROJ.scale * r * Math.sin(x), PROJ.translate[1] - PROJ.scale * (F_ - r * Math.cos(x))];
};

export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number }> = ({ cam, mottleOpacity = 0.9 }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const v = viewRect(cam, 24);
  return (
    <>
      {TILES.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0).map((t) => (
        <Img
          key={t.f}
          src={staticFile(`apache/${t.f}`)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: t.W,
            height: t.H,
            transformOrigin: "0 0",
            transform: `translate(${(tx + t.x0 * k).toFixed(3)}px, ${(ty + t.y0 * k).toFixed(3)}px) scale(${(k / BASE.s).toFixed(6)})`,
          }}
        />
      ))}
      <Mottle cam={cam} opacity={mottleOpacity} />
    </>
  );
};
export const MapPage: React.FC<{ cam: Cam; vignette?: number; children?: React.ReactNode }> = ({ cam, vignette, children }) => (
  <AbsoluteFill style={{ backgroundColor: SEA }}>
    <MapStack cam={cam} />
    {children}
    <PaperTop vignette={vignette} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// THE ORANGE COUNTRY
// ---------------------------------------------------------------------------
const HATCH_P = 10; // world px between hatch lines
export const OrangeCountry: React.FC<{ ring: P2[]; cam: Cam; highlight?: number; edge?: boolean }> = ({ ring, cam, highlight, edge = true }) => {
  const k = cam.k;
  const d = `M${ring.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
  // the highlight: a soft band crossing the country from the south-west to the north-east
  const hx = 100 + 900 * (highlight ?? 0);
  return (
    <g>
      <defs>
        <pattern id="apHatch" patternUnits="userSpaceOnUse" width={HATCH_P} height={HATCH_P} patternTransform="rotate(45)">
          <line x1={0} y1={-1} x2={0} y2={HATCH_P + 1} stroke={ACCENT} strokeWidth={2.1 / k} />
          <line x1={HATCH_P} y1={-1} x2={HATCH_P} y2={HATCH_P + 1} stroke={ACCENT} strokeWidth={2.1 / k} />
        </pattern>
        <linearGradient id="apBand" gradientUnits="userSpaceOnUse" x1={hx - 130} y1={0} x2={hx + 130} y2={0} gradientTransform="rotate(-35 540 960)">
          <stop offset={0} stopColor="#000" />
          <stop offset={0.5} stopColor="#fff" />
          <stop offset={1} stopColor="#000" />
        </linearGradient>
        <mask id="apBandMask" maskUnits="userSpaceOnUse" x={-200} y={-200} width={1500} height={2400}>
          <rect x={-200} y={-200} width={1500} height={2400} fill="url(#apBand)" />
        </mask>
      </defs>
      <path d={d} fill={ACCENT_DEEP} fillOpacity={0.2} />
      <path d={d} fill="url(#apHatch)" opacity={0.78} />
      {highlight !== undefined ? <path d={d} fill="url(#apHatch)" opacity={0.5} mask="url(#apBandMask)" /> : null}
      {edge ? (
        <>
          <path d={d} fill="none" stroke="#0B0907" strokeOpacity={0.5} strokeWidth={5.4 / k} strokeLinejoin="round" />
          <path d={d} fill="none" stroke={ACCENT} strokeWidth={3 / k} strokeLinejoin="round" strokeDasharray={`${9 / k} ${6 / k}`} />
        </>
      ) : null}
    </g>
  );
};

/** (added for V2) THE REINFORCED BORDER: a solid orange line round the ring with
 *  short outward teeth (a palisade tick every ~16 px); press(p) (0..1) = how
 *  hard an army leans on the edge at world point p: there the line thickens
 *  (4 -> 6 px) and the teeth lengthen (9 -> 16 px). It never moves. */
export const FortifiedEdge: React.FC<{ ring: P2[]; cam: Cam; press?: (p: P2) => number; lineMax?: number; toothMax?: number }> = ({
  ring,
  cam,
  press,
  lineMax = 6,
  toothMax = 16,
}) => {
  const k = cam.k;
  const n = ring.length;
  const cx = ring.reduce((a, p) => a + p[0], 0) / n;
  const cy = ring.reduce((a, p) => a + p[1], 0) / n;
  const w = ring.map((p) => (press ? clamp01(press(p)) : 0));
  // the outward normal at each vertex
  const nrm = ring.map((p, i) => {
    const a = ring[(i - 1 + n) % n];
    const b = ring[(i + 1) % n];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = (b[1] - a[1]) / l;
    let ny = -(b[0] - a[0]) / l;
    if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) [nx, ny] = [-nx, -ny];
    return [nx, ny] as P2;
  });
  // teeth every ~16 px of arclength
  const teeth: { p: P2; q: P2; w: number }[] = [];
  let acc = 8;
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (acc <= seg) {
      const t = acc / seg;
      const wi = w[i] + (w[(i + 1) % n] - w[i]) * t;
      const p: P2 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const len = (9 + (toothMax - 9) * wi) / k;
      teeth.push({ p, q: [p[0] + nrm[i][0] * len, p[1] + nrm[i][1] * len], w: wi });
      acc += 16 / k;
    }
    acc -= seg;
  }
  const d = `M${ring.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
  // the pressed stretches: runs of vertices with w > 0, drawn heavier on top
  const heavy: { d: string; w: number }[] = [];
  for (let i = 0; i < n; i++) {
    const wa = (w[i] + w[(i + 1) % n]) / 2;
    if (wa < 0.02) continue;
    const a = ring[i];
    const b = ring[(i + 1) % n];
    heavy.push({ d: `M${a[0].toFixed(2)},${a[1].toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`, w: wa });
  }
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {teeth.map((t, i) => (
        <path key={`tc${i}`} d={`M${t.p[0].toFixed(2)},${t.p[1].toFixed(2)}L${t.q[0].toFixed(2)},${t.q[1].toFixed(2)}`} stroke="#0B0907" strokeOpacity={0.55} strokeWidth={(5.4 + 1.2 * t.w) / k} />
      ))}
      <path d={d} stroke="#0B0907" strokeOpacity={0.55} strokeWidth={6.6 / k} />
      {heavy.map((h, i) => (
        <path key={`hc${i}`} d={h.d} stroke="#0B0907" strokeOpacity={0.55} strokeWidth={(6.6 + (lineMax - 4) * 1.1 * h.w) / k} />
      ))}
      {teeth.map((t, i) => (
        <path key={`t${i}`} d={`M${t.p[0].toFixed(2)},${t.p[1].toFixed(2)}L${t.q[0].toFixed(2)},${t.q[1].toFixed(2)}`} stroke={ACCENT} strokeWidth={(3 + 1.2 * t.w) / k} />
      ))}
      <path d={d} stroke={ACCENT} strokeWidth={4 / k} />
      {heavy.map((h, i) => (
        <path key={`h${i}`} d={h.d} stroke={ACCENT} strokeWidth={(4 + (lineMax - 4) * h.w) / k} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE YEAR ODOMETER
// ---------------------------------------------------------------------------
/** the four wheels' positions for year y (units first): a digit d shows at position d */
export const odometerColumns = (y: number) => {
  const pos: number[] = [((y % 10) + 10) % 10];
  for (let i = 1; i < 4; i++) pos.push((Math.floor(y / Math.pow(10, i) + 1e-9) % 10) + clamp01(pos[i - 1] - 9));
  return pos;
};
const SHUTTER = 0.35; // frames
const BLUR_N = 3;
export const YearOdometer: React.FC<{
  frame: number;
  yearAt: (f: number) => number;
  x: number;
  top: number;
  size?: number;
  opacity?: number;
  /** the wheels' positions (units first) if they are not the plain odometer of yearAt */
  columnsAt?: (f: number) => number[];
  /** the cap of a wheel's vertical blur (px; default 0.35 x size) */
  maxBlur?: number;
  /** sub-frame samples per wheel (default 3; 1 = no ghosting, for wheels that never run fast) */
  samples?: number;
  /** the soft fade at the window's top and bottom (px; default 13 % of the cell) */
  fadePx?: number;
}> = ({ frame, yearAt, x, top, size = 120, opacity = 1, columnsAt, maxBlur, samples: nSamples = BLUR_N, fadePx }) => {
  if (opacity <= 0.002) return null;
  const CELL_W = 0.5 * size;
  const CELL_H = 1.2 * size;
  const cols = columnsAt ?? ((f: number) => odometerColumns(yearAt(f)));
  const samples = nSamples <= 1 ? [cols(frame)] : Array.from({ length: nSamples }, (_, j) => cols(frame + (j / (nSamples - 1) - 0.5) * SHUTTER));
  const copyA = 1 - Math.pow(1 - INK_FULL, 1 / samples.length);
  const pa = cols(frame - 0.25);
  const pb = cols(frame + 0.25);
  // a slow turn stays crisp; the blur comes in above ~60 px per frame
  const sigma = pa.map((a, i) => {
    let dd = Math.abs(pb[i] - a);
    if (dd > 5) dd = 10 - dd;
    return Math.min(maxBlur ?? 0.35 * size, 0.25 * Math.max(0, dd * 2 * CELL_H - 60));
  });
  const glyph = (key: string, dgt: number, dy: number, halo: boolean) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CELL_W,
        height: CELL_H,
        lineHeight: `${CELL_H}px`,
        textAlign: "center",
        fontFamily: fell,
        fontSize: size,
        transform: `translateY(${dy.toFixed(2)}px)`,
        color: halo ? "transparent" : INK,
        opacity: halo ? 0.5 / samples.length + 0.06 : copyA,
        WebkitTextStroke: halo ? `${size * 0.085}px ${SEA}` : undefined,
      }}
    >
      {dgt}
    </div>
  );
  const column = (c: number) => {
    const els: React.ReactNode[] = [];
    for (const halo of [true, false])
      samples.forEach((pos, j) => {
        const p = pos[c];
        const dgt = Math.floor(p + 1e-9);
        const fr = p - dgt;
        els.push(glyph(`${halo ? "h" : "f"}${j}a`, ((dgt % 10) + 10) % 10, -fr * CELL_H, halo));
        if (fr > 0.002) els.push(glyph(`${halo ? "h" : "f"}${j}b`, (dgt + 1) % 10, (1 - fr) * CELL_H, halo));
      });
    return els;
  };
  const fp = fadePx === undefined ? 13 : (100 * fadePx) / CELL_H;
  const fade = `linear-gradient(to bottom, transparent 0%, #000 ${fp.toFixed(2)}%, #000 ${(100 - fp).toFixed(2)}%, transparent 100%)`;
  return (
    <div style={{ position: "absolute", left: x - 2 * CELL_W, top, width: 4 * CELL_W, height: CELL_H, opacity }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {sigma.map((sg, c) => (
            <filter key={c} id={`odoBlur${c}`} x="-10%" y="-60%" width="120%" height="220%">
              <feGaussianBlur stdDeviation={`0 ${sg.toFixed(2)}`} />
            </filter>
          ))}
        </defs>
      </svg>
      {[3, 2, 1, 0].map((c, i) => (
        <div key={c} style={{ position: "absolute", left: i * CELL_W - 12, top: 0, width: CELL_W + 24, height: CELL_H, overflow: "hidden", WebkitMaskImage: fade, maskImage: fade }}>
          <div style={{ position: "absolute", left: 12, top: 0, width: CELL_W, height: CELL_H, filter: sigma[c] > 0.3 ? `url(#odoBlur${c})` : undefined }}>{column(c)}</div>
        </div>
      ))}
    </div>
  );
};
