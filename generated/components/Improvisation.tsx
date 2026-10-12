import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  EMPIRE_BOX,
  EMPIRE_D,
  FRAME_H,
  FRAME_W,
  INK,
  INK_FULL,
  MapPage,
  REALM_BOX,
  REALM_D,
  SEA,
  WorldSvg,
  clamp01,
  fellSC,
  project,
  screenOf,
  smoothstep,
  type Cam,
  type P2,
} from "./americasShared";
import { Mottle, camFor, camTransform, makeCamera, makeRoute, type CamKey, type Route } from "./incaShared";

// ---------------------------------------------------------------------------
// Improvisation — clip "Sheppard: capture, not kill" (Dwarkesh Patel with Si
// Sheppard), Dwarkesh map style, on THE AMERICAS WORLD (americasShared.tsx,
// read-only here).
//
// CHECK LINE: "Cortés in Mexico and Pizarro in Peru each snaked their way into
// the heart of an empire, changing course again and again, while the two
// empires just sat there."
//
// THE LINE (sequence 39.331 s -> 46.797 s): "[how a very military-focused
// culture did] not have the strategic wherewithal to do this improvisation
// that, you know, Cortés was doing improvisation, Pizarro was doing a bunch of
// improvisation. Why weren't they able to do the same thing?"
// DURATION = round((46.797 - 39.331) * 24000 / 1001) = 179 frames, 23.976 fps,
// 1080 x 1920, opaque.
//
// MOTION. One tall map, Mexico upper left, Peru lower right, on one slow push.
// The two empires are orange hatch from frame 0 and never change. A cream line
// A loupe is pulled out of each invader's country along a tie line to rest over
// open sea (the Caribbean, then the Pacific); inside it the same map at close-up scale, where
// a pen nib walks the real march at constant speed, turning at every stop:
// Cortés 1519 (San Juan de Ulúa -> Tenochtitlan), then Pizarro 1532 (Tumbes ->
// Cajamarca). Both lines end on their target inside the orange.
//
// BEATS (local frames)
//   f0        the map and the two orange empires; the camera is already moving
//   f13-20    the site ring is ruled round central Mexico
//   f20-50    inset 1 is a loupe pulled out of that ring: it travels out along
//             its tie to the open sea, growing; always a whole magnified disc
//                                               ["strategic wherewithal to do this"]
//   f59-118   Cortés's march, constant speed            ["improvisation" f59 ...]
//   f82-90    label CORTÉS lands on f90                             ["Cortés" f90]
//   f63-70, f70-102   the Peru site ring, then inset 2 pulled out the same way
//   f110-150  Pizarro's march, constant speed                    ["Pizarro" f119]
//   f111-119  label PIZARRO lands on f119
//   f148-179  both routes complete; a white highlight travels each once; the orange
//             does nothing                     ["Why weren't they able to ..."]
//
// SOURCES. Cortés's road: scripts/cortes-geo.json (San Juan de Ulúa, Cempoala,
// Xalapa, Xico, Ixhuacán, Zautla = Xocotlan, Ixtacamaxtitlán, Tlaxcala, Cholula,
// Paso de Cortés, Amecameca, Ayotzingo, Iztapalapa, Tenochtitlan). Pizarro's
// march: scripts/inca-geo.json (Tumbes, Poechos, San Miguel at Tangarará, the
// Piura valley, Pabur, Serrán, Motupe, Íllimo, Zaña, Nanchoc, Niepos, Llapa,
// Cajamarca). Empires: americasMapData (the Aztec Empire 1519 and Tawantinsuyu
// 1532 after the Commons maps). Lens rasters: scripts/bake-capture-improvisation-lenses.mjs.
// ---------------------------------------------------------------------------
export const FPS = 24000 / 1001;
export const DURATION = 179;

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const TAU = Math.PI * 2;

// -- the camera: one slow damped push, moving on every frame -------------------
// The push is anchored low (screen y ~1255, the top of the Peru inset), so that inset and the Peru
// site ring stay clear of the caption strip (y 1080-1250) for as long as they exist.
export const CAM_KEYS: CamKey[] = [
  { f: 0, k: 1.36, wx: 545, wy: 878.1, sx: 540, sy: 960 },
  { f: 70, k: 1.44, wx: 548.7, wy: 890.1, sx: 540, sy: 960 },
  { f: 130, k: 1.515, wx: 551.9, wy: 900.3, sx: 540, sy: 960 },
  { f: 179, k: 1.58, wx: 554.4, wy: 908.3, sx: 540, sy: 960 },
];
export const camAt = makeCamera(CAM_KEYS);

// -- the two marches (lon, lat) --------------------------------------------------
export const CORTES_1519: { name: string; lon: number; lat: number }[] = [
  { name: "San Juan de Ulúa", lon: -96.133, lat: 19.209 },
  { name: "(coast road)", lon: -96.3, lat: 19.33 },
  { name: "Cempoala", lon: -96.405, lat: 19.448 },
  { name: "Xalapa", lon: -96.92, lat: 19.54 },
  { name: "Xico", lon: -97.01, lat: 19.42 },
  { name: "Ixhuacán", lon: -97.135, lat: 19.35 },
  { name: "Zautla (Xocotlan)", lon: -97.655, lat: 19.725 },
  { name: "Ixtacamaxtitlán", lon: -97.82, lat: 19.62 },
  { name: "Tlaxcala", lon: -98.237, lat: 19.318 },
  { name: "Cholula", lon: -98.303, lat: 19.063 },
  { name: "Paso de Cortés", lon: -98.654, lat: 19.081 },
  { name: "Amecameca", lon: -98.766, lat: 19.124 },
  { name: "Ayotzingo", lon: -98.92, lat: 19.25 },
  { name: "Iztapalapa", lon: -99.09, lat: 19.358 },
  { name: "Tenochtitlan", lon: -99.133, lat: 19.435 },
];
export const PIZARRO_1532: { name: string; lon: number; lat: number }[] = [
  { name: "Tumbes", lon: -80.492, lat: -3.601 },
  { name: "Poechos", lon: -80.527, lat: -4.683 },
  { name: "San Miguel (Tangarará)", lon: -80.825, lat: -4.886 },
  { name: "Piura valley", lon: -80.076, lat: -5.152 },
  { name: "Pabur", lon: -80.089, lat: -5.172 },
  { name: "Serrán", lon: -79.777, lat: -5.433 },
  { name: "Motupe", lon: -79.717, lat: -6.154 },
  { name: "Íllimo", lon: -79.855, lat: -6.474 },
  { name: "Zaña", lon: -79.584, lat: -6.924 },
  { name: "Nanchoc", lon: -79.243, lat: -6.96 },
  { name: "Niepos", lon: -79.13, lat: -6.926 },
  { name: "Llapa", lon: -78.808, lat: -6.981 },
  { name: "Cajamarca", lon: -78.5174, lat: -7.157 },
];

/** centripetal Catmull-Rom through the control points (world px) */
const splineRoute = (ctl: P2[], sub = 14): Route => {
  const first = ctl[0];
  const last = ctl[ctl.length - 1];
  const P: P2[] = [[2 * first[0] - ctl[1][0], 2 * first[1] - ctl[1][1]], ...ctl, [2 * last[0] - ctl[ctl.length - 2][0], 2 * last[1] - ctl[ctl.length - 2][1]]];
  const knot = (a: P2, b: P2) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  const mix = (a: P2, b: P2, ta: number, tb: number, t: number): P2 => {
    const u = (t - ta) / (tb - ta);
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  };
  const pts: P2[] = [first];
  const wpS: number[] = [0];
  let len = 0;
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const t0 = 0;
    const t1 = t0 + knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let j = 1; j <= sub; j++) {
      const t = t1 + ((t2 - t1) * j) / sub;
      const a1 = mix(p0, p1, t0, t1, t);
      const a2 = mix(p1, p2, t1, t2, t);
      const a3 = mix(p2, p3, t2, t3, t);
      const b1 = mix(a1, a2, t0, t2, t);
      const b2 = mix(a2, a3, t1, t3, t);
      const c = mix(b1, b2, t1, t2, t);
      const prev = pts[pts.length - 1];
      len += Math.hypot(c[0] - prev[0], c[1] - prev[1]);
      pts.push(c);
    }
    wpS.push(len);
  }
  return makeRoute({ pts, wpS, len });
};
export const CORTES_ROUTE = splineRoute(CORTES_1519.map((p) => project(p.lon, p.lat)));
export const PIZARRO_ROUTE = splineRoute(PIZARRO_1532.map((p) => project(p.lon, p.lat)));

// -- the two insets (world px: they live on the sheet and share the camera) -----
type LensDef = {
  id: string;
  /** the inset's centre and radius on the sheet (world px) */
  centre: P2;
  R: number;
  /** the world point shown at its centre, and its magnification over the sheet */
  focus: P2;
  Z: number;
  raster: { src: string; x0: number; y0: number; w: number; h: number; s: number };
  /** the frames over which the loupe is pulled out of its site */
  draw: [number, number];
};
export const LENS_MEXICO: LensDef = {
  id: "mx",
  centre: [696.8, 579.2],
  R: 170,
  focus: [298.5, 440.6],
  Z: 170 / 45,
  raster: { src: "capture/improv-lens-mexico.png", x0: 236, y0: 378, w: 125, h: 125, s: 7 },
  draw: [20, 50],
};
export const LENS_PERU: LensDef = {
  id: "pe",
  centre: [402.5, 1245.6],
  R: 150.6,
  focus: [640, 919],
  Z: 150.6 / 53,
  raster: { src: "capture/improv-lens-peru.png", x0: 570, y0: 849, w: 140, h: 140, s: 6 },
  draw: [70, 102],
};

/** frames before the pull over which the site ring is ruled on the sheet */
const SITE_LEAD = 7;
const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** THE LOUPE: it starts as the site ring itself (same place, same size, magnification 1) and is pulled
 *  out along the tie to its resting place, growing to full size, on one eased move. It always shows the
 *  same disc of the map (radius R / Z round the focus), so the picture inside only ever grows. */
const lensState = (L: LensDef, frame: number) => {
  const p = smootherstep((frame - L.draw[0]) / (L.draw[1] - L.draw[0]));
  const r = L.R / L.Z;
  const dx = L.centre[0] - L.focus[0];
  const dy = L.centre[1] - L.focus[1];
  const dist = Math.hypot(dx, dy);
  const u: P2 = [dx / dist, dy / dist];
  return {
    p,
    r,
    u,
    theta: Math.atan2(u[1], u[0]),
    site: clamp01((frame - (L.draw[0] - SITE_LEAD)) / SITE_LEAD),
    centre: [L.focus[0] + dx * p, L.focus[1] + dy * p] as P2,
    R: r + (L.R - r) * p,
  };
};
/** a clockwise arc (y down) from angle a0 through `frac` of a turn */
const arcD = (cx: number, cy: number, r: number, a0: number, frac: number) => {
  const f = clamp01(frac);
  if (f >= 0.9999) return `M${cx + r},${cy}A${r},${r} 0 1 1 ${cx - r},${cy}A${r},${r} 0 1 1 ${cx + r},${cy}Z`;
  const a1 = a0 + TAU * f;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${r.toFixed(2)},${r.toFixed(2)} 0 ${f > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
};

// -- an empire: orange engraved hatch on a thin wash, a firm orange border ------
const HATCH_PX = 5;
const OrangeEmpire: React.FC<{
  id: string;
  d: string;
  box: { x0: number; x1: number; y0: number; y1: number };
  cam: Cam;
  edge?: number;
  /** a path along which the hatch recedes (so a line laid on it stays legible); width in screen px */
  sink?: { d: string; width: number };
}> = ({ id, d, box, cam, edge = 3.4, sink }) => {
  const k = cam.k;
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const P = (4 * HATCH_PX) / Math.pow(2, o);
  const mid = smoothstep((L2 - o - 0.2) / 0.6);
  const M = 30;
  const w = 1.8 / k;
  return (
    <g>
      <defs>
        <pattern id={`${id}-hatch`} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform="rotate(45)">
          <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={ACCENT} strokeWidth={w} />
          <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={ACCENT} strokeWidth={w} strokeOpacity={mid} />
          <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={ACCENT} strokeWidth={w} />
        </pattern>
        {sink ? (
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={box.x0 - M} y={box.y0 - M} width={box.x1 - box.x0 + 2 * M} height={box.y1 - box.y0 + 2 * M}>
            <rect x={box.x0 - M} y={box.y0 - M} width={box.x1 - box.x0 + 2 * M} height={box.y1 - box.y0 + 2 * M} fill="#fff" />
            <path d={sink.d} fill="none" stroke="rgb(70,70,70)" strokeWidth={sink.width / k} strokeLinecap="round" strokeLinejoin="round" />
          </mask>
        ) : null}
      </defs>
      <path d={d} fillRule="evenodd" fill={ACCENT_DEEP} fillOpacity={0.2} />
      <path d={d} fillRule="evenodd" fill={`url(#${id}-hatch)`} opacity={0.92} mask={sink ? `url(#${id}-mask)` : undefined} />
      <path d={d} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={(edge + 3) / k} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={ACCENT} strokeWidth={edge / k} strokeLinejoin="round" />
    </g>
  );
};

// -- a march: a cased cream line as far as the pen has come ---------------------
const RouteStroke: React.FC<{ route: Route; cam: Cam; s: number; width: number; casing: number }> = ({ route, cam, s, width, casing }) => {
  if (s <= 0.01) return null;
  const d = route.partialD(0, s);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.72} strokeWidth={(width + casing) / cam.k} />
      <path d={d} stroke={INK} strokeWidth={width / cam.k} />
    </g>
  );
};
/** the highlight that travels a finished route, once: a short white run, swelling in the middle */
const RouteGlint: React.FC<{ route: Route; cam: Cam; t: number; width: number }> = ({ route, cam, t, width }) => {
  if (t <= 0 || t >= 1) return null;
  const span = route.len * 0.26;
  const head = -span + (route.len + span) * t;
  const els: React.ReactNode[] = [];
  const N = 9;
  for (let i = 0; i < N; i++) {
    const a = head + (span * i) / N;
    const b = head + (span * (i + 1)) / N + 0.05;
    if (b <= 0 || a >= route.len) continue;
    const u = Math.sin((Math.PI * (i + 0.5)) / N);
    els.push(<path key={i} d={route.partialD(Math.max(0, a), Math.min(route.len, b))} stroke="#FFFFFF" strokeOpacity={0.35 + 0.65 * u} strokeWidth={(width + 5.5 * u) / cam.k} />);
  }
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {els}
    </g>
  );
};
/** the pen nib (engraved: cream on a dark casing, a slit and a breather hole); tip at the head, pointing where it goes */
const Nib: React.FC<{ route: Route; cam: Cam; s: number; size?: number }> = ({ route, cam, s, size = 1 }) => {
  const [x, y] = route.pointAt(s);
  const t = route.tangentAt(Math.max(route.len * 0.004, Math.min(route.len * 0.996, s)));
  const ang = (Math.atan2(t[1], t[0]) * 180) / Math.PI;
  const body = "M0,0C-6,-3.6 -13,-8.4 -21,-8.8L-31,-5.2L-36,-5.2L-36,5.2L-31,5.2L-21,8.8C-13,8.4 -6,3.6 0,0Z";
  return (
    <g transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${ang.toFixed(2)}) scale(${(size / cam.k).toFixed(5)})`}>
      <path d={body} fill="none" stroke={DARK} strokeOpacity={0.7} strokeWidth={5.5} strokeLinejoin="round" />
      <path d={body} fill={INK} stroke={DARK} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M-3,0L-18,0" stroke={DARK} strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={-20} cy={0} r={2.1} fill={DARK} />
      <path d="M-31,-5.2L-31,5.2" stroke={DARK} strokeWidth={1.2} />
    </g>
  );
};
/** the target: a period town sign in the empire's orange */
const Target: React.FC<{ at: P2; cam: Cam; r?: number }> = ({ at, cam, r = 10 }) => (
  <g>
    <circle cx={at[0]} cy={at[1]} r={(r + 3.2) / cam.k} fill={DARK} fillOpacity={0.85} />
    <circle cx={at[0]} cy={at[1]} r={r / cam.k} fill={ACCENT} />
    <circle cx={at[0]} cy={at[1]} r={(r * 0.36) / cam.k} fill={DARK} />
  </g>
);

// -- one inset: the loupe (a complete magnified disc in a double-ruled ring), its site ring, its tie
const LENS_WASH = 0.085;
const RING_OUT = 5;
const RING_IN = 1.7;
const RING_GAP = 10;
const SITE_W = 1.5;
const Lens: React.FC<{ L: LensDef; cam: Cam; frame: number; children: (lc: Cam, grow: number, ink: number) => React.ReactNode }> = ({ L, cam, frame, children }) => {
  const st = lensState(L, frame);
  if (st.site <= 0) return null;
  const k = cam.k;
  const p = st.p;
  const out = frame >= L.draw[0];
  const [fx, fy] = screenOf(L.focus, cam);
  const [cx, cy] = screenOf(st.centre, cam);
  const r = st.r * k;
  const R = st.R * k;
  // the close-up: the focus at the loupe's centre, magnified R / r over the sheet
  const lc = camFor(L.focus, (k * st.R) / st.r, cx, cy);
  const { tx, ty } = camTransform(lc);
  // the ring grows from the site ring's single thin rule into the double rule
  const wOut = SITE_W + (RING_OUT - SITE_W) * p;
  const gap = RING_GAP * p;
  const RC = R - gap - 2 * p;
  // the tie: from the site ring's edge to the loupe's edge, paid out behind it
  const t0: P2 = [fx + st.u[0] * r, fy + st.u[1] * r];
  const t1: P2 = [cx - st.u[0] * R, cy - st.u[1] * R];
  const tieLen = (t1[0] - t0[0]) * st.u[0] + (t1[1] - t0[1]) * st.u[1];
  const T = L.raster;
  const ring = (w: number, h: number) => ({ stroke: DARK, strokeOpacity: 0.5 + 0.32 * p, strokeWidth: w + h });
  return (
    <>
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g fill="none" strokeLinecap="round">
          {/* the site ring, ruled on the sheet just before the loupe leaves it */}
          <path d={arcD(fx, fy, r, st.theta, st.site)} stroke={DARK} strokeOpacity={0.5} strokeWidth={SITE_W + 2.1} />
          <path d={arcD(fx, fy, r, st.theta, st.site)} stroke={INK} strokeOpacity={0.9} strokeWidth={SITE_W} />
          {out && tieLen > 0.5 ? (
            <>
              <path d={`M${t0[0].toFixed(2)},${t0[1].toFixed(2)}L${t1[0].toFixed(2)},${t1[1].toFixed(2)}`} stroke={DARK} strokeOpacity={0.6} strokeWidth={5.4} />
              <path d={`M${t0[0].toFixed(2)},${t0[1].toFixed(2)}L${t1[0].toFixed(2)},${t1[1].toFixed(2)}`} stroke={INK} strokeWidth={2.6} />
            </>
          ) : null}
        </g>
      </svg>
      {out ? (
        <>
          <AbsoluteFill style={{ clipPath: `circle(${RC.toFixed(2)}px at ${cx.toFixed(2)}px ${cy.toFixed(2)}px)`, backgroundColor: SEA }}>
            <Img
              src={staticFile(T.src)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: T.w * T.s,
                height: T.h * T.s,
                transformOrigin: "0 0",
                transform: `translate(${(tx + T.x0 * lc.k).toFixed(3)}px, ${(ty + T.y0 * lc.k).toFixed(3)}px) scale(${(lc.k / T.s).toFixed(6)})`,
              }}
            />
            <Mottle cam={lc} />
            {/* the inset's own paper: a thin cream wash, so sea and land sit a tone lighter than the sheet */}
            <AbsoluteFill style={{ backgroundColor: INK, opacity: LENS_WASH * p }} />
            {/* what lies on the close-up starts at the sheet's own scale (so nothing pops as the loupe leaves) and grows with it */}
            <WorldSvg cam={lc}>{children(lc, st.r / st.R, clamp01(p * 14))}</WorldSvg>
          </AbsoluteFill>
          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
            <g fill="none">
              <circle cx={cx} cy={cy} r={R - gap / 2} {...ring(gap + wOut, 2.1 + 2.9 * p)} />
              <circle cx={cx} cy={cy} r={R} stroke={INK} strokeWidth={wOut} />
              {p > 0.02 ? <circle cx={cx} cy={cy} r={R - gap} stroke={INK} strokeOpacity={0.9 * clamp01(p * 3)} strokeWidth={RING_IN} /> : null}
            </g>
          </svg>
        </>
      ) : null}
    </>
  );
};

// -- the two spoken names -------------------------------------------------------
const LABEL_SIZE = 58;
const LABEL_SPACING = 0.3;
const Label: React.FC<{ text: string; sx: number; sy: number; frame: number; land: number }> = ({ text, sx, sy, frame, land }) => {
  const f0 = land - 8;
  const op = interpolate(frame, [f0, f0 + 6], [0, 1], CLAMP) * INK_FULL;
  if (op <= 0.002) return null;
  const dy = interpolate(frame, [f0, land], [24, 0], { easing: EASE_LAND, ...CLAMP });
  const trail = LABEL_SIZE * LABEL_SPACING;
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + trail / 2}
        y={sy + dy}
        textAnchor="middle"
        opacity={op}
        fill={INK}
        stroke={DARK}
        strokeOpacity={0.78}
        strokeWidth={LABEL_SIZE * 0.2}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: LABEL_SIZE, letterSpacing: trail }}
      >
        {text}
      </text>
    </svg>
  );
};

// -- timing ---------------------------------------------------------------------
const ROUTE_W = 8.5;
export const CORTES_MARCH: [number, number] = [59, 118];
export const PIZARRO_MARCH: [number, number] = [110, 150];
const GLINT_CORTES: [number, number] = [149, 177];
const GLINT_PIZARRO: [number, number] = [152, 180];
const span = (f: number, [a, b]: [number, number]) => clamp01((f - a) / (b - a));

/** 0 at the sheet's scale (the loupe still on its site) .. 1 at rest; `grow` = site radius / loupe radius */
const g = (grow: number, L: LensDef) => clamp01((1 / grow - 1) / (L.Z - 1));
/** the nib and the town sign keep the sheet's scale: 1 / Z of their resting size on the site, full at rest */
const m = (grow: number, L: LensDef) => 1 / grow / L.Z;
const TENOCHTITLAN_AT = CORTES_ROUTE.pts[CORTES_ROUTE.pts.length - 1];
const CAJAMARCA_AT = PIZARRO_ROUTE.pts[PIZARRO_ROUTE.pts.length - 1];

const Improvisation: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const sC = CORTES_ROUTE.len * span(frame, CORTES_MARCH);
  const sP = PIZARRO_ROUTE.len * span(frame, PIZARRO_MARCH);
  const gC = (frame - GLINT_CORTES[0]) / (GLINT_CORTES[1] - GLINT_CORTES[0]);
  const gP = (frame - GLINT_PIZARRO[0]) / (GLINT_PIZARRO[1] - GLINT_PIZARRO[0]);
  const [m1x, m1y] = screenOf(LENS_MEXICO.centre, cam);
  const [m2x, m2y] = screenOf(LENS_PERU.centre, cam);
  return (
    <MapPage cam={cam} vignette={vignette}>
      {/* the sheet: the two empires (the insets carry the marches) */}
      <WorldSvg cam={cam}>
        <OrangeEmpire id="imp-az" d={EMPIRE_D} box={EMPIRE_BOX} cam={cam} edge={2.6} />
        <OrangeEmpire id="imp-in" d={REALM_D} box={REALM_BOX} cam={cam} />
      </WorldSvg>
      {/* inset 1: Mexico */}
      <Lens L={LENS_MEXICO} cam={cam} frame={frame}>
        {(lc, grow, ink) => (
          <>
            <OrangeEmpire id="imp-az-l" d={EMPIRE_D} box={EMPIRE_BOX} cam={lc} edge={2.6 + 1.4 * g(grow, LENS_MEXICO)} sink={sC > 0.01 ? { d: CORTES_ROUTE.partialD(0, sC), width: 34 } : undefined} />
            <RouteStroke route={CORTES_ROUTE} cam={lc} s={sC} width={ROUTE_W} casing={4} />
            <RouteGlint route={CORTES_ROUTE} cam={lc} t={gC} width={ROUTE_W} />
            <g opacity={ink}>
              <Nib route={CORTES_ROUTE} cam={lc} s={sC} size={m(grow, LENS_MEXICO)} />
              <Target at={TENOCHTITLAN_AT} cam={lc} r={10 * m(grow, LENS_MEXICO)} />
            </g>
          </>
        )}
      </Lens>
      {/* inset 2: Peru */}
      <Lens L={LENS_PERU} cam={cam} frame={frame}>
        {(lc, grow, ink) => (
          <>
            <OrangeEmpire id="imp-in-l" d={REALM_D} box={REALM_BOX} cam={lc} edge={3.4 + 0.6 * g(grow, LENS_PERU)} sink={sP > 0.01 ? { d: PIZARRO_ROUTE.partialD(0, sP), width: 34 } : undefined} />
            <RouteStroke route={PIZARRO_ROUTE} cam={lc} s={sP} width={ROUTE_W} casing={4} />
            <RouteGlint route={PIZARRO_ROUTE} cam={lc} t={gP} width={ROUTE_W} />
            <g opacity={ink}>
              <Nib route={PIZARRO_ROUTE} cam={lc} s={sP} size={m(grow, LENS_PERU)} />
              <Target at={CAJAMARCA_AT} cam={lc} r={10 * m(grow, LENS_PERU)} />
            </g>
          </>
        )}
      </Lens>
      <Label text="CORTÉS" sx={m1x} sy={m1y - LENS_MEXICO.R * cam.k - 54} frame={frame} land={90} />
      <Label text="PIZARRO" sx={m2x} sy={m2y + LENS_PERU.R * cam.k + 58} frame={frame} land={119} />
    </MapPage>
  );
};

export default Improvisation;
