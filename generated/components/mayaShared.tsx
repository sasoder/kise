// ---------------------------------------------------------------------------
// mayaShared: THE MAYA WORLD (central Mexico to Yucatan and the Guatemalan
// highlands, c. 1519-1540s) for the cut OneFellSwoop of the clip "Sheppard:
// centralized empires fell fast" (Dwarkesh with Si Sheppard; Dwarkesh map
// style). The map-scale cousin of the clip's tree vocabulary (hierShared): a
// polity = ONE ORANGE HEAD with cream links running out to cream dependents.
//
// THE MAP (world px). North-up Lambert conformal conic, standard parallels
// 14 N / 22 N, centre meridian 94.7 W (scripts/build-maya-map.mjs ->
// mayaMapData.ts / mayaStatic.ts). World px == screen px at THE WIDE (camera
// { k: 1, cx: 540, cy: 960 }): lon -103.7 ... -85.7 across the frame,
// Tenochtitlan at (274, 797); 0.572 world px per km. The static map (sea, 4
// engraved water-lines, 5 deg graticule, land + #6A5838 rim, cream coast; NO
// borders) is ONE tiled raster level (scripts/bake-maya-rasters.mjs ->
// public/maya/*.png, mayaLevels.ts), sharp for k <= 2.3, over world x -110 ...
// 1190, y -110 ... 2030: keep every view inside it.
//
// Camera, palette, fonts, paper, labels: incaShared's (imported, re-exported).
//
// API
//   project(lon, lat) -> [x, y] world px; PX_PER_KM; K_OPEN (the close zoom
//     the Maya polities were spaced for)
//   <MapStack cam /> the baked map + world-space mottle; <MapPage cam> =
//     MapStack + children + PaperTop (grain, vignette)
//   sizeAt(px, k) the house size law of this world: px on screen at K_OPEN,
//     shrinking as k^0.5 (a 7 px head at k 1.95 is 5 px in the wide)
//   LINK_W(k) the mini-trees' link weight (screen px); the big tree's is 3 px
//   THE AZTEC EMPIRE: TENOCHTITLAN, AZTEC_NODES ({ x, y, d, parent }: parent =
//     the nearest head closer to the capital, -1 = the capital), EMPIRE_D,
//     EMPIRE_BORDER_D; <EmpireHatch cam sunk? /> cream hatch at the context
//     rung + the fine dashed border; sunk = { r (world px), to } sinks both to
//     `to` x their opacity inside a circle of radius r round Tenochtitlan
//     (a crisp front, 8 screen px feather)
//   THE MAYA: MAYA_POLITIES ({ name, x, y, r, deps })
//   TREE PRIMITIVES (all inside a WorldSvg; sizes in screen px)
//     <TreeLink a b cam passed? sag? /> a cased cream link a -> b; passed =
//       (p: P2) => 0..1 how far the collapse front is past world point p: the
//       part it has passed drops to INK_CONTEXT and slackens (sags `sag` px)
//     <Dot x y cam r level? /> a cream dependent (level 1 = INK_FULL .. 0 =
//       INK_CONTEXT)
//     <Head x y cam r out? breath? /> an orange head (dark casing); out 0..1
//       crossfades it to a dashed cream ring (an emptied seat)
//     <Ripple x y cam r opacity /> a crisp cream ring (r in screen px)
//     breath(frame, seed) -> { r (0.94..1.06), tone (0..1) } each head's own
//       slow phase
//   THE SWOOP (the Spaniards' stroke; neutral cream): makeSwoop(from, to) ->
//     swoopShapeOf(from, c1, c2, to) -> the cubic's shape in its chord's frame;
//     makeSwoop(from, to, shape) -> { pts, cum, len, pointAt } that shape laid
//     on another chord by a similarity (so two swoops are the same gesture);
//     <Swoop path cam head tail opacity width? /> the tapering engraved stroke between
//     arclengths tail..head (22 px at its head) with 3 fine trailing hatch lines
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_CONTEXT,
  INK_FULL,
  Mottle,
  PaperTop,
  SEA,
  camTransform,
  clamp01,
  hash,
  mixColor,
  smoothstep,
  viewRect,
  type Cam,
} from "./incaShared";
import { AZTEC_NODES, EMPIRE_BORDER_D, EMPIRE_D, K_OPEN, MAYA_POLITIES, PROJ, PX_PER_KM, TENOCHTITLAN, type P2 } from "./mayaMapData";
import { LEVELS } from "./mayaLevels";

export type { Cam, CamKey } from "./incaShared";
export type { AztecNode, MayaPolity, P2 } from "./mayaMapData";
export {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  CAPTION_TOP,
  CONTENT_Y,
  DARK,
  FPS,
  FRAME_H,
  FRAME_W,
  INK,
  INK_CONTEXT,
  INK_FULL,
  LAND,
  LAND_RIM,
  MapLabel,
  PaperTop,
  SCREEN_CX,
  SCREEN_CY,
  SEA,
  WorldSvg,
  camFor,
  camScan,
  camTransform,
  clamp01,
  fell,
  fellSC,
  hash,
  labelSlide,
  mixColor,
  screenOf,
  smootherstep,
  smoothstep,
  sway,
  swayCam,
  viewRect,
  worldOf,
} from "./incaShared";
export { AZTEC_NODES, EMPIRE_BORDER_D, EMPIRE_D, K_OPEN, MAYA_POLITIES, PX_PER_KM, TENOCHTITLAN };

// ---------------------------------------------------------------------------
// Projection (spherical LCC, identical to d3-geo's geoConicConformal with PROJ)
// ---------------------------------------------------------------------------
const RAD = Math.PI / 180;
const tany = (y: number) => Math.tan((Math.PI / 2 + y) / 2);
const Y0 = PROJ.parallels[0] * RAD;
const Y1 = PROJ.parallels[1] * RAD;
const N_ = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
const F_ = (Math.cos(Y0) * Math.pow(tany(Y0), N_)) / N_;
const rawLcc = (x: number, y: number): P2 => {
  const r = F_ / Math.pow(tany(y), N_);
  return [r * Math.sin(N_ * x), F_ - r * Math.cos(N_ * x)];
};
export const project = (lon: number, lat: number): P2 => {
  const p = rawLcc((lon + PROJ.rotate[0]) * RAD, lat * RAD);
  return [PROJ.translate[0] + PROJ.scale * p[0], PROJ.translate[1] - PROJ.scale * p[1]];
};

// ---------------------------------------------------------------------------
// THE MAP: the baked tiles + mottle
// ---------------------------------------------------------------------------
export const WORLD = { x0: LEVELS[0].x0, y0: LEVELS[0].y0, x1: LEVELS[0].x0 + LEVELS[0].w, y1: LEVELS[0].y0 + LEVELS[0].h };
/** texels per screen px of the baked map under this camera (>= ~0.95 = sharp) */
export const mapSharpness = (cam: Cam) => LEVELS[0].s / cam.k;
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number }> = ({ cam, mottleOpacity = 0.9 }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const v = viewRect(cam, 24);
  const L = LEVELS[0];
  const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
  return (
    <>
      {tiles.map((t) => (
        <Img
          key={t.f}
          src={staticFile(`maya/${t.f}`)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: t.W,
            height: t.H,
            transformOrigin: "0 0",
            transform: `translate(${(tx + t.x0 * k).toFixed(3)}px, ${(ty + t.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
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
// Sizes
// ---------------------------------------------------------------------------
/** px on screen at K_OPEN, shrinking as k^0.5 towards the wide */
export const sizeAt = (px: number, k: number) => px * Math.pow(k / K_OPEN, 0.5);
/** the one link weight (screen px): 2.4 in the close, 2.1 in the wide */
export const LINK_W = (k: number) => 2.4 * Math.pow(k / K_OPEN, 0.2);
const CASING = 2.6; // screen px wider than the ink

// ---------------------------------------------------------------------------
// THE EMPIRE'S TERRITORY: cream hatch (tlaxShared's engraved family: a
// world-anchored 45 deg line hatch, a period per octave of k) + the fine
// dashed border, both at the context rung
// ---------------------------------------------------------------------------
const HATCH_ANGLE = 45;
const HATCH_PX = 9;
const HATCH_W = 1.5;
const HATCH_RUNG = INK_CONTEXT;
const DASH = 11;
const octaveDashes = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = DASH / Math.pow(2, o);
  return [
    { p: a, op: 1 - t },
    { p: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
export type Sunk = { r: number; to: number };
export const EmpireHatch: React.FC<{ cam: Cam; opacity?: number; sunk?: Sunk }> = ({ cam, opacity = 1, sunk }) => {
  if (opacity <= 0.002) return null;
  const k = cam.k;
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const P = (2 * HATCH_PX) / Math.pow(2, o);
  const mid = L2 - o;
  const masked = !!sunk && sunk.r > 0.01;
  const feather = 8 / k;
  const rg = masked ? sunk.r + feather : 1;
  const g = Math.round(255 * (sunk?.to ?? 1));
  return (
    <g>
      <defs>
        <clipPath id="mayaEmpireClip">
          <path d={EMPIRE_D} clipRule="evenodd" />
        </clipPath>
        <pattern id="mayaHatchInk" patternUnits="userSpaceOnUse" width={P} height={P} patternTransform={`rotate(${HATCH_ANGLE})`}>
          <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={INK} strokeWidth={HATCH_W / k} />
          <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={INK} strokeWidth={HATCH_W / k} strokeOpacity={mid} />
          <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={INK} strokeWidth={HATCH_W / k} />
        </pattern>
        {masked ? (
          <>
            <radialGradient id="mayaSunkGrad" gradientUnits="userSpaceOnUse" cx={TENOCHTITLAN[0]} cy={TENOCHTITLAN[1]} r={rg}>
              <stop offset={0} stopColor={`rgb(${g},${g},${g})`} />
              <stop offset={Math.max(0, sunk.r - feather) / rg} stopColor={`rgb(${g},${g},${g})`} />
              <stop offset={1} stopColor="#fff" />
            </radialGradient>
            <mask id="mayaSunkMask" maskUnits="userSpaceOnUse" x={-200} y={-200} width={1600} height={2400}>
              <rect x={-200} y={-200} width={1600} height={2400} fill="url(#mayaSunkGrad)" />
            </mask>
          </>
        ) : null}
      </defs>
      <g mask={masked ? "url(#mayaSunkMask)" : undefined} opacity={opacity}>
        <path d={EMPIRE_D} fillRule="evenodd" fill="url(#mayaHatchInk)" opacity={HATCH_RUNG} />
        <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
          {octaveDashes(k).map((q) => (
            <path
              key={`eb-${q.p}`}
              d={EMPIRE_BORDER_D}
              stroke={INK}
              strokeOpacity={INK_CONTEXT * q.op}
              strokeWidth={1.7 / k}
              strokeDasharray={`${(q.p * 0.58).toFixed(5)} ${(q.p * 0.42).toFixed(5)}`}
            />
          ))}
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// TREE PRIMITIVES
// ---------------------------------------------------------------------------
const LINK_N = 16;
/** the point at u (0..1) of a link a -> b bowed sideways by bow x its length (a gentle curve) */
export const linkPoint = (a: P2, b: P2, bow: number, u: number): P2 => {
  const o = bow * Math.sin(Math.PI * u);
  return [a[0] + (b[0] - a[0]) * u - (b[1] - a[1]) * o, a[1] + (b[1] - a[1]) * u + (b[0] - a[0]) * o];
};
/** a cased cream link a -> b (width screen px, default LINK_W(k); bow = a
 *  sideways curve as a fraction of its length). `passed(p)` (0..1) = how far
 *  the collapse front is past world point p: where it has passed the link is
 *  at INK_CONTEXT and sags (screen-down, `sag` px at its middle); ahead of it,
 *  INK_FULL and taut */
export const TreeLink: React.FC<{
  a: P2;
  b: P2;
  cam: Cam;
  passed?: (p: P2) => number;
  sag?: number;
  opacity?: number;
  width?: number;
  bow?: number;
}> = ({ a, b, cam, passed, sag = 5, opacity = 1, width, bow = 0 }) => {
  const k = cam.k;
  const w = (width ?? LINK_W(k)) / k;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const amp = Math.min(sag / k, 0.22 * len);
  const pts: P2[] = [];
  const ps: number[] = [];
  let any = false;
  for (let i = 0; i <= LINK_N; i++) {
    const u = i / LINK_N;
    const p = linkPoint(a, b, bow, u);
    const q = passed ? clamp01(passed(p)) : 0;
    if (q > 0) any = true;
    ps.push(q);
    pts.push([p[0], p[1] + amp * Math.sin(Math.PI * u) * smoothstep(q)]);
  }
  const d = `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
  // the live part: runs of points the front has not reached (cut crisply at the front)
  let live = "";
  if (any) {
    const CUT = 0.12; // of `passed`: where the line drops its rung
    let run: P2[] = [];
    const flush = () => {
      if (run.length > 1) live += `M${run.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
      run = [];
    };
    for (let i = 0; i <= LINK_N; i++) {
      const on = ps[i] < CUT;
      if (i > 0 && on !== ps[i - 1] < CUT) {
        // the crossing between i - 1 and i
        const t = (CUT - ps[i - 1]) / (ps[i] - ps[i - 1] || 1e-9);
        const c: P2 = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
        run.push(c);
        if (!on) flush();
      }
      if (on) run.push(pts[i]);
    }
    flush();
  } else live = d;
  // base at INK_CONTEXT; the live part tops it up to INK_FULL
  const top = 1 - (1 - INK_FULL) / (1 - INK_CONTEXT);
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round" opacity={opacity}>
      <path d={d} stroke={DARK} strokeOpacity={0.55} strokeWidth={w + CASING / k} />
      <path d={d} stroke={INK} strokeOpacity={INK_CONTEXT} strokeWidth={w} />
      {live ? <path d={live} stroke={INK} strokeOpacity={top} strokeWidth={w} /> : null}
    </g>
  );
};
/** a cream dependent; level 1 = INK_FULL .. 0 = INK_CONTEXT */
export const Dot: React.FC<{ x: number; y: number; cam: Cam; r: number; level?: number }> = ({ x, y, cam, r, level = 1 }) => {
  const k = cam.k;
  const op = INK_CONTEXT + (INK_FULL - INK_CONTEXT) * clamp01(level);
  return (
    <g>
      <circle cx={x} cy={y} r={(r + 1.3) / k} fill={DARK} fillOpacity={0.62} />
      <circle cx={x} cy={y} r={r / k} fill={mixColor(DARK, INK, 0.3 + 0.7 * op)} />
    </g>
  );
};
/** each head's own slow breath: radius factor 0.94..1.06 and a tone 0..1 */
export const breath = (frame: number, seed: number) => {
  const T = 46 + 30 * hash(seed, 11);
  const s = Math.sin((frame / T) * Math.PI * 2 + 6.283 * hash(seed, 12));
  return { r: 1 + 0.06 * s, tone: 0.5 + 0.5 * s };
};
/** an orange head (the one at the top); out 0..1 crossfades the disc to a
 *  dashed cream ring: the seat emptied */
export const Head: React.FC<{ x: number; y: number; cam: Cam; r: number; out?: number; breath?: { r: number; tone: number } }> = ({
  x,
  y,
  cam,
  r,
  out = 0,
  breath: br,
}) => {
  const k = cam.k;
  const o = smoothstep(out);
  const rr = (r * (br ? 1 + (br.r - 1) * (1 - o) : 1)) / k;
  const dash = (2 * Math.PI * (r / k)) / 9; // 9 dashes round the ring
  return (
    <g>
      <circle cx={x} cy={y} r={rr + 1.9 / k} fill={DARK} fillOpacity={0.66} />
      {o < 0.999 ? <circle cx={x} cy={y} r={rr} fill={mixColor(ACCENT_DEEP, ACCENT, 0.35 + 0.65 * (br?.tone ?? 1))} fillOpacity={1 - o} /> : null}
      {o > 0.001 ? (
        <>
          <circle cx={x} cy={y} r={rr} fill={mixColor(SEA, DARK, 0.5)} fillOpacity={0.55 * o} />
          <circle
            cx={x}
            cy={y}
            r={r / k - 1 / k}
            fill="none"
            stroke={INK}
            strokeOpacity={INK_FULL * o}
            strokeWidth={Math.max(2, r * 0.2) / k}
            strokeDasharray={`${(dash * 0.6).toFixed(4)} ${(dash * 0.4).toFixed(4)}`}
          />
        </>
      ) : null}
    </g>
  );
};
/** a crisp cream ring, r in screen px; rung = its ink opacity (INK_FULL by
 *  default); inEmpire clips it to the empire's territory */
export const Ripple: React.FC<{ x: number; y: number; cam: Cam; r: number; opacity: number; rung?: number; inEmpire?: boolean }> = ({
  x,
  y,
  cam,
  r,
  opacity,
  rung = INK_FULL,
  inEmpire = false,
}) =>
  opacity > 0.004 && r > 0.5 ? (
    <g fill="none" clipPath={inEmpire ? "url(#mayaEmpireClip)" : undefined}>
      <circle cx={x} cy={y} r={r / cam.k} stroke={DARK} strokeOpacity={0.5 * opacity} strokeWidth={4.4 / cam.k} />
      <circle cx={x} cy={y} r={r / cam.k} stroke={INK} strokeOpacity={rung * opacity} strokeWidth={2.2 / cam.k} />
    </g>
  ) : null;

// ---------------------------------------------------------------------------
// THE SWOOP
// ---------------------------------------------------------------------------
export type SwoopPath = { pts: P2[]; cum: number[]; len: number; pointAt: (s: number) => P2; normalAt: (s: number) => P2 };
/** the ONE swoop shape: a cubic arc whose two inner control points are given
 *  in the chord's own frame (complex u + iv: 0 = start, 1 = end), so the same
 *  SwoopShape laid on another chord is the same gesture turned and scaled */
export type SwoopShape = { c1: P2; c2: P2 };
const cdiv = (a: P2, b: P2): P2 => {
  const m = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / m, (a[1] * b[0] - a[0] * b[1]) / m];
};
/** the shape of the cubic from -> c1 -> c2 -> to (world px) */
export const swoopShapeOf = (from: P2, c1: P2, c2: P2, to: P2): SwoopShape => {
  const ch: P2 = [to[0] - from[0], to[1] - from[1]];
  return { c1: cdiv([c1[0] - from[0], c1[1] - from[1]], ch), c2: cdiv([c2[0] - from[0], c2[1] - from[1]], ch) };
};
export const makeSwoop = (from: P2, to: P2, shape: SwoopShape, n = 140): SwoopPath => {
  const ch: P2 = [to[0] - from[0], to[1] - from[1]];
  const lay = ([u, v]: P2): P2 => [from[0] + ch[0] * u - ch[1] * v, from[1] + ch[1] * u + ch[0] * v];
  const P1 = lay(shape.c1);
  const P2_ = lay(shape.c2);
  // the outer (convex) side: away from the chord's middle
  const mid: P2 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const w0 = (1 - t) * (1 - t) * (1 - t);
    const w1 = 3 * (1 - t) * (1 - t) * t;
    const w2 = 3 * (1 - t) * t * t;
    const w3 = t * t * t;
    pts.push([w0 * from[0] + w1 * P1[0] + w2 * P2_[0] + w3 * to[0], w0 * from[1] + w1 * P1[1] + w2 * P2_[1] + w3 * to[1]]);
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const pointAt = (s: number): P2 => {
    const q = Math.max(0, Math.min(len, s));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < q) i++;
    const t = (q - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  };
  const normalAt = (s: number): P2 => {
    const a = pointAt(s - len / 200);
    const b = pointAt(s + len / 200);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (b[1] - a[1]) / l;
    const ny = -(b[0] - a[0]) / l;
    const p = pointAt(s);
    return nx * (p[0] - mid[0]) + ny * (p[1] - mid[1]) >= 0 ? [nx, ny] : [-nx, -ny];
  };
  return { pts, cum, len, pointAt, normalAt };
};
/** the stroke between arclengths tail..head (world px): a tapering cream blade
 *  (SWOOP_W screen px at its head, a point at its tail) and three fine hatch
 *  lines trailing on its outer side */
export const SWOOP_W = 22;
export const Swoop: React.FC<{ path: SwoopPath; cam: Cam; head: number; tail: number; opacity?: number; width?: number }> = ({
  path,
  cam,
  head,
  tail,
  opacity = 1,
  width = SWOOP_W,
}) => {
  if (opacity <= 0.004 || head - tail < 0.5) return null;
  const k = cam.k;
  const sc = width / SWOOP_W; // (added for V2) a lighter stroke scales its blade, hatch offsets and lags
  const M = 44;
  const left: P2[] = [];
  const right: P2[] = [];
  for (let i = 0; i <= M; i++) {
    const u = i / M;
    const s = tail + (head - tail) * u;
    const p = path.pointAt(s);
    const nrm = path.normalAt(s);
    const hw = ((width / 2) * Math.pow(u, 1.25)) / k;
    left.push([p[0] + nrm[0] * hw, p[1] + nrm[1] * hw]);
    right.push([p[0] - nrm[0] * hw, p[1] - nrm[1] * hw]);
  }
  // a round nose
  const hp = path.pointAt(head);
  const hn = path.normalAt(head);
  const tng: P2 = [-hn[1], hn[0]];
  const a = path.pointAt(head - 0.5);
  const fwd = (hp[0] - a[0]) * tng[0] + (hp[1] - a[1]) * tng[1] >= 0 ? 1 : -1;
  const nose: P2[] = [];
  const R = width / 2 / k;
  for (let i = 1; i < 8; i++) {
    const th = (i / 8) * Math.PI;
    nose.push([hp[0] + hn[0] * R * Math.cos(th) + fwd * tng[0] * R * Math.sin(th), hp[1] + hn[1] * R * Math.cos(th) + fwd * tng[1] * R * Math.sin(th)]);
  }
  const blade = `M${[...left, ...nose, ...right.reverse()].map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
  // the hatch lines: offset outward, each ending further behind the head
  const lines = [
    { off: 20, lag: 14, from: 0.08 },
    { off: 30, lag: 40, from: 0.18 },
    { off: 40, lag: 70, from: 0.3 },
  ].map(({ off, lag, from }) => {
    const s0 = tail + (head - tail) * from;
    const s1 = head - (lag * sc) / k;
    if (s1 - s0 < 4 / k) return "";
    const pts: P2[] = [];
    for (let i = 0; i <= 28; i++) {
      const s = s0 + ((s1 - s0) * i) / 28;
      const p = path.pointAt(s);
      const nrm = path.normalAt(s);
      pts.push([p[0] + (nrm[0] * off * sc) / k, p[1] + (nrm[1] * off * sc) / k]);
    }
    return `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
  });
  return (
    <g opacity={opacity}>
      <path d={blade} fill={DARK} fillOpacity={0.5} stroke={DARK} strokeOpacity={0.5} strokeWidth={3 / k} strokeLinejoin="round" />
      <g fill="none" strokeLinecap="round">
        {lines.map((d, i) => (d ? <path key={`hc${i}`} d={d} stroke={DARK} strokeOpacity={0.4} strokeWidth={3.4 / k} /> : null))}
        {lines.map((d, i) => (d ? <path key={`h${i}`} d={d} stroke={INK} strokeOpacity={INK_CONTEXT + 0.12 - 0.08 * i} strokeWidth={1.8 / k} /> : null))}
      </g>
      <path d={blade} fill={INK} fillOpacity={INK_FULL} />
    </g>
  );
};

/** a full-frame guard: is the camera's frame inside the baked world? */
export const viewInWorld = (cam: Cam, margin = 8) => {
  const v = viewRect(cam, margin);
  return v.x0 >= WORLD.x0 && v.x1 <= WORLD.x1 && v.y0 >= WORLD.y0 && v.y1 <= WORLD.y1 && FRAME_W > 0 && FRAME_H > 0;
};
