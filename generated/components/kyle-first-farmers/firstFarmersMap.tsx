// ---------------------------------------------------------------------------
// firstFarmersMap: THE MAP KIT of the first-farmers clip (Kyle Harper, "Did disease help the first farmers replace
// hunter-gatherers?"; Oct 2026). Dwarkesh map style. The map half of sarah-pearl-harbor/pearlShared.tsx on this
// clip's one world, plus the front model's two layers. Read-only once animation_source/notes/MAP_READY.md exists;
// additions only. The page / figures / germs half of the clip is firstFarmersShared.tsx (another builder's).
//
// ORANGE = the incoming farmers (their land, their people as dots). CREAM = the foragers and everything else.
//
// THE WORLD (firstFarmersEuropeMapData.ts): Neolithic Europe, north-up LCC (parallels 38/58, centre 14 E); world px ==
// screen px at the Europe wide (k 1). project(lon, lat) -> world px; ANCHORS (the dated sites), LEPENSKI_VIR,
// FRAMINGS. The static map is <MapPage cam> (tiles: scripts/maps/bake.mjs scripts/maps/configs/firstfarmers.mjs).
//
// CAMERA: { x, y, k }: the WORLD point (x, y) lands on the frame centre (540, 960) at zoom k. Author keys and run them
// through the damped tracker: const CAM: CamKey[] = [...]; runCamera(CAM, frame). Everything inside <WorldSvg cam>
// is in world px; screen-constant sizes are v / cam.k (px(cam, v)).
//
// THE FRONT (neolithicFront.ts): <FarmedLand T cam id /> draws the land farmed by date T (cal BC): an orange wash +
// world-anchored octave hatch clipped to the land, its crisp leading edge as a thin orange line over land only.
// <PopulationDots pop f cam /> draws the forager (cream) and farmer (orange) dots of makePopulation(timeline).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { CAM_DAMP, CAM_STIFF, clamp01, hash, smoothstep } from "../kits/dwarkesh/fieldShared";
import { FIRSTFARMERS_LEVELS_EUROPE, FIRSTFARMERS_PAD, FIRSTFARMERS_TILE, type FirstfarmersLevel } from "./firstfarmersLevels";
import { ACCENT, ACCENT_DEEP, DARK, FRAME_H, FRAME_W, INK, SEA } from "./firstFarmersTokens";
import { LAND_MASKS } from "./neolithicLandMask";
import { frontPaths, type Population } from "./neolithicFront";

export const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// MATHS
// ---------------------------------------------------------------------------
export { clamp01, smoothstep, hash };
export type P2 = [number, number];
/** 0..1 eased (smoothstep) between frames a and b */
export const ramp = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));
/** 0..1 smootherstep */
export const smoother = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** 0..1 LINEAR between frames a and b */
export const lin = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** mix two #RRGGBB colours -> "rgb(...)" */
export const mixColor = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};
/** monotone cubic (PCHIP) through [x, y] keys: C1, no overshoot; linear beyond the ends */
export const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  if (n === 1) return () => ys[0];
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

// ---------------------------------------------------------------------------
// CAMERA (the damped keyed tracker of pearlShared / plagueShared)
// ---------------------------------------------------------------------------
export type CamKey = { f: number; x: number; y: number; k: number };
export type Cam = { x: number; y: number; k: number };
const PREROLL = 60;
type Track = { target: (f: number) => number[]; s: number[]; v: number[]; out: Cam[] };
const TRACKS = new WeakMap<CamKey[], Track>();
/** the camera at `frame`: keys -> monotone cubic (k in log space) -> damped follow (trails the keys by ~5 frames).
 *  Pre-rolled, so frame 0 is already in steady motion. Pass a module-level array. */
export const runCamera = (keys: CamKey[], frame: number): Cam => {
  let tr = TRACKS.get(keys);
  if (!tr) {
    const px = pchip(keys.map((q) => [q.f, q.x]));
    const py = pchip(keys.map((q) => [q.f, q.y]));
    const pk = pchip(keys.map((q) => [q.f, Math.log(q.k)]));
    const target = (f: number) => [px(f), py(f), pk(f)];
    let s = target(-PREROLL);
    let v = [0, 0, 0];
    for (let f = -PREROLL + 1; f <= 0; f++) {
      const t = target(f);
      v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
      s = s.map((si, i) => si + v[i]);
    }
    tr = { target, s, v, out: [{ x: s[0], y: s[1], k: Math.exp(s[2]) }] };
    TRACKS.set(keys, tr);
  }
  const n = Math.max(0, Math.round(frame));
  for (let f = tr.out.length; f <= n; f++) {
    const t = tr.target(f);
    const s0 = tr.s;
    tr.v = tr.v.map((vi, i) => vi + (t[i] - s0[i]) * CAM_STIFF - vi * CAM_DAMP);
    const v0 = tr.v;
    tr.s = tr.s.map((si, i) => si + v0[i]);
    tr.out.push({ x: tr.s[0], y: tr.s[1], k: Math.exp(tr.s[2]) });
  }
  return tr.out[n];
};
/** screen px -> world units at this camera */
export const px = (cam: Cam, v: number) => v / cam.k;
/** world -> screen */
export const toScreen = (cam: Cam, x: number, y: number): P2 => [FRAME_W / 2 + (x - cam.x) * cam.k, FRAME_H / 2 + (y - cam.y) * cam.k];
/** the world rect in view (plus a screen-px margin) */
export const viewRect = (cam: Cam, margin = 0) => ({
  x0: cam.x - (FRAME_W / 2 + margin) / cam.k,
  x1: cam.x + (FRAME_W / 2 + margin) / cam.k,
  y0: cam.y - (FRAME_H / 2 + margin) / cam.k,
  y1: cam.y + (FRAME_H / 2 + margin) / cam.k,
});
export const camSvg = (cam: Cam) => `translate(${(FRAME_W / 2 - cam.x * cam.k).toFixed(3)} ${(FRAME_H / 2 - cam.y * cam.k).toFixed(3)}) scale(${cam.k.toFixed(6)})`;
const camCss = (cam: Cam) => `translate(${FRAME_W / 2 - cam.x * cam.k}px, ${FRAME_H / 2 - cam.y * cam.k}px) scale(${cam.k})`;

/** a full-frame svg whose children are in world px */
export const WorldSvg: React.FC<{ cam: Cam; children?: React.ReactNode; defs?: React.ReactNode; style?: React.CSSProperties }> = ({ cam, children, defs, style }) => (
  <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", ...style }}>
    {defs ? <defs>{defs}</defs> : null}
    <g transform={camSvg(cam)}>{children}</g>
  </svg>
);
/** a div whose children (Img, HTML) are positioned in world px */
export const WorldDiv: React.FC<{ cam: Cam; children?: React.ReactNode; style?: React.CSSProperties }> = ({ cam, children, style }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: camCss(cam), ...style }}>{children}</div>
);

// ---------------------------------------------------------------------------
// THE STATIC MAP: <MapBase cam> draws the raster LOD tiles for this camera and the world-space paper mottle over them.
// <MapPage cam> = SEA ground + MapBase + children + grain + vignette.
// ---------------------------------------------------------------------------
const LEVELS: FirstfarmersLevel[] = FIRSTFARMERS_LEVELS_EUROPE;
const levelOps = (levels: FirstfarmersLevel[], k: number) => levels.map((L) => (L.band ? smoothstep(Math.log(k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1));
type View = { x0: number; x1: number; y0: number; y1: number };
const cellSpan = (L: FirstfarmersLevel, v: View) => ({
  c0: Math.floor((v.x0 - L.x0) / L.tw),
  c1: Math.floor((v.x1 - L.x0) / L.tw),
  r0: Math.floor((v.y0 - L.y0) / L.tw),
  r1: Math.floor((v.y1 - L.y0) / L.tw),
});
const coversView = (L: FirstfarmersLevel, v: View) => {
  const { c0, c1, r0, r1 } = cellSpan(L, v);
  if (c0 < 0 || r0 < 0 || c1 >= L.cols || r1 >= L.rows) return false;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (L.cells[r * L.cols + c] === ".") return false;
  return true;
};
/** which LOD levels a camera draws (for checks): [{ name, op, covers, magnify }] */
export const mapLevelsAt = (cam: Cam) => {
  const view = viewRect(cam, 12);
  const ops = levelOps(LEVELS, cam.k);
  let base = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--)
    if (ops[i] >= 0.999 && coversView(LEVELS[i], view)) {
      base = i;
      break;
    }
  return LEVELS.map((L, i) => ({ name: L.name, op: i >= base ? ops[i] : 0, covers: coversView(L, view), magnify: cam.k / L.s })).filter((q) => q.op > 0.001);
};

export const MapBase: React.FC<{ cam: Cam; mottle?: number }> = ({ cam, mottle = 0.9 }) => {
  const k = cam.k;
  const view = viewRect(cam, 12);
  const ops = levelOps(LEVELS, k);
  let base = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--)
    if (ops[i] >= 0.999 && coversView(LEVELS[i], view)) {
      base = i;
      break;
    }
  const layers: React.ReactNode[] = [];
  for (let i = base; i < LEVELS.length; i++) {
    if (ops[i] <= 0.001) continue;
    const L = LEVELS[i];
    const sp = cellSpan(L, view);
    const sc = k / L.s;
    const kids: React.ReactNode[] = [];
    for (let r = Math.max(0, sp.r0); r <= Math.min(L.rows - 1, sp.r1); r++)
      for (let c = Math.max(0, sp.c0); c <= Math.min(L.cols - 1, sp.c1); c++) {
        const code = L.cells[r * L.cols + c];
        if (code === ".") continue;
        const [sx, sy] = toScreen(cam, L.x0 + c * L.tw, L.y0 + r * L.tw);
        if (code === "#") {
          kids.push(
            <Img
              key={`${c}-${r}`}
              src={staticFile(`firstfarmers/europe-${L.name}-${c}-${r}.png`)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: FIRSTFARMERS_TILE + 2 * FIRSTFARMERS_PAD,
                height: FIRSTFARMERS_TILE + 2 * FIRSTFARMERS_PAD,
                maxWidth: "none",
                transformOrigin: "0 0",
                transform: `translate(${(sx - FIRSTFARMERS_PAD * sc).toFixed(3)}px, ${(sy - FIRSTFARMERS_PAD * sc).toFixed(3)}px) scale(${sc.toFixed(6)})`,
              }}
            />,
          );
        } else {
          kids.push(
            <div
              key={`${c}-${r}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: L.tw * k + 2,
                height: L.tw * k + 2,
                transform: `translate(${(sx - 1).toFixed(3)}px, ${(sy - 1).toFixed(3)}px)`,
                background: L.colors[code.charCodeAt(0) - 97],
              }}
            />,
          );
        }
      }
    // one group opacity per level: the 2 px tile overlaps never double up in a crossfade
    layers.push(
      <div key={L.name} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: ops[i] }}>
        {kids}
      </div>,
    );
  }
  // mottle tiles, world space, in octaves: the stains keep ~ their screen size through a zoom
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((view.x0 - ox / Math.pow(2, o)) / S) * S + ox / Math.pow(2, o);
    const y0 = Math.floor((view.y0 - oy / Math.pow(2, o)) / S) * S + oy / Math.pow(2, o);
    for (let y = y0; y < view.y1; y += S) for (let x = x0; x < view.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });
  return (
    <>
      {layers}
      {mottle > 0 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: mottle, overflow: "hidden" }}>
          {tiles.map((t, i) => {
            const [sx, sy] = toScreen(cam, t.x, t.y);
            return (
              <Img
                key={`m-${i}`}
                src={staticFile("firstfarmers/mottle.png")}
                style={{ position: "absolute", left: 0, top: 0, width: 512, height: 512, maxWidth: "none", transformOrigin: "0 0", transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${((t.s * k * 1.002) / 512).toFixed(5)})`, opacity: t.o }}
              />
            );
          })}
        </div>
      ) : null}
    </>
  );
};

/** the screen-space paper grain */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <Img src={staticFile("firstfarmers/grain.png")} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity, pointerEvents: "none" }} />
);
/** the soft vignette (screen space; draw last) */
export const Vignette: React.FC<{ amount?: number }> = ({ amount = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(amount * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${amount.toFixed(3)}) 100%)`,
    }}
  />
);
/** SEA ground + the static map + your overlays + grain + vignette */
export const MapPage: React.FC<{ cam: Cam; vignette?: number; grain?: number; mottle?: number; children?: React.ReactNode }> = ({ cam, vignette = 0.55, grain = 1, mottle = 0.9, children }) => (
  <AbsoluteFill style={{ backgroundColor: SEA, overflow: "hidden" }}>
    <MapBase cam={cam} mottle={mottle} />
    {children}
    <Grain opacity={grain} />
    <Vignette amount={vignette} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// HATCH (pearlShared): the octave-stable world-anchored hatch pattern (~10-20 screen px; never swims in a zoom)
// ---------------------------------------------------------------------------
export const HatchPattern: React.FC<{ id: string; cam: Cam; color?: string; spacing?: number; width?: number; angle?: number }> = ({ id, cam, color = ACCENT, spacing = 10, width = 2.1, angle = 45 }) => {
  const L2 = Math.log2(cam.k);
  const o = Math.floor(L2);
  const t = L2 - o;
  const P = (2 * spacing) / Math.pow(2, o);
  const sw = px(cam, width);
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform={`rotate(${angle})`}>
      <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={color} strokeWidth={sw} />
      <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={color} strokeWidth={sw} strokeOpacity={t} />
      <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={color} strokeWidth={sw} />
    </pattern>
  );
};

// ---------------------------------------------------------------------------
// LAND MASK: the coast of the baked map as an SVG luminance mask (two inline grayscale PNGs: the whole front grid
// at 1.5 texels / world px, the Aegean at 4.2). Put <LandMaskDef id /> in a <WorldSvg>'s defs, then mask="url(#id)".
// ---------------------------------------------------------------------------
export const LandMaskDef: React.FC<{ id: string }> = ({ id }) => {
  const m0 = LAND_MASKS[0];
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x={m0.x} y={m0.y} width={m0.w} height={m0.h}>
      {LAND_MASKS.map((m, i) => (
        <image key={i} href={m.href} x={m.x} y={m.y} width={m.w} height={m.h} preserveAspectRatio="none" />
      ))}
    </mask>
  );
};

// ---------------------------------------------------------------------------
// THE FARMED LAND at date T (cal BC): wash + hatch clipped to the land and to the front, the leading edge a thin
// orange line over land only (none along Africa / Iceland, which are outside the model). hatch: the hatch's opacity
// (recede it to ~0.3-0.4 under the farmer dots). Draw inside <WorldSvg cam>.
// ---------------------------------------------------------------------------
export const FarmedLand: React.FC<{ T: number; cam: Cam; id: string; opacity?: number; hatch?: number; wash?: number; line?: number }> = ({ T, cam, id, opacity = 1, hatch = 0.4, wash = 0.22, line = 0.95 }) => {
  if (opacity <= 0.001) return null;
  const fp = frontPaths(T, cam);
  if (!fp.fill) return null;
  const vr = viewRect(cam, 30);
  return (
    <g opacity={opacity}>
      <defs>
        <HatchPattern id={`${id}-pat`} cam={cam} />
        <LandMaskDef id={`${id}-land`} />
        <clipPath id={`${id}-farm`}>
          <path d={fp.fill} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g mask={`url(#${id}-land)`}>
        <g clipPath={`url(#${id}-farm)`}>
          <rect x={vr.x0} y={vr.y0} width={vr.x1 - vr.x0} height={vr.y1 - vr.y0} fill={ACCENT_DEEP} fillOpacity={wash} />
          <rect x={vr.x0} y={vr.y0} width={vr.x1 - vr.x0} height={vr.y1 - vr.y0} fill={`url(#${id}-pat)`} opacity={hatch} />
        </g>
        {line > 0 && fp.line ? (
          <>
            <path d={fp.line} fill="none" stroke={DARK} strokeOpacity={0.5 * line} strokeWidth={px(cam, 4.6)} strokeLinecap="round" strokeLinejoin="round" />
            <path d={fp.line} fill="none" stroke={ACCENT} strokeOpacity={line} strokeWidth={px(cam, 2.4)} strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// DOTS: the forager (cream) and farmer (orange) populations of makePopulation (neolithicFront.ts) at frame f.
// Screen-constant diameter d (default dotScreen(k): ~6.8 px at the Europe wide, ~10.8 at k 3), dark ring, world-space positions.
// Order: sliding foragers and emerging farmers under the settled dots (a dot slides into / out of another).
// ---------------------------------------------------------------------------
export const dotScreen = (k: number) => 6.8 * Math.pow(k, 0.42);
export const PopulationDots: React.FC<{ pop: Population; f: number; cam: Cam; d?: number; opacity?: number }> = ({ pop, f, cam, d, opacity = 1 }) => {
  const st = pop.at(f, cam);
  const r = (d ?? dotScreen(cam.k)) / 2 / cam.k;
  const ring = 1.5 / cam.k;
  const cream = INK;
  const orange = ACCENT;
  const dot = (key: string, x: number, y: number, fill: string) => <circle key={key} cx={x} cy={y} r={r} fill={fill} stroke={DARK} strokeOpacity={0.65} strokeWidth={ring} />;
  return (
    <g opacity={opacity}>
      {st.under.map((q) => dot(`u${q.id}`, q.x, q.y, q.tone > 0 ? mixColor(cream, orange, q.tone) : q.farmer ? orange : cream))}
      {st.over.map((q) => dot(`o${q.id}`, q.x, q.y, q.farmer ? orange : q.tone > 0 ? mixColor(cream, orange, q.tone) : cream))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// LABEL (pearlShared): IM Fell English SC, widely spaced caps, cream; slides up 24 screen px while fading in over
// ~14 frames from `appear`. Counter-scaled: `cap` is the CAP HEIGHT in screen px at any zoom. (x, y) = world anchor.
// ---------------------------------------------------------------------------
export const CAP_RATIO = 0.66;
export const labelIn = (frame: number, appear: number) => {
  const u = clamp01((frame - appear) / 14);
  const e = 1 - Math.pow(1 - u, 3);
  return { dy: 24 * (1 - e), op: smoothstep((frame - appear) / 9) };
};
export const Label: React.FC<{ x: number; y: number; text: string; appear: number; frame: number; cam: Cam; cap?: number; color?: string; spacing?: number; opacity?: number; sc?: boolean }> = ({
  x,
  y,
  text,
  appear,
  frame,
  cam,
  cap = 38,
  color = INK,
  spacing,
  opacity = 1,
  sc = true,
}) => {
  const sl = labelIn(frame, appear);
  const op = sl.op * opacity;
  if (op <= 0.002) return null;
  const size = cap / CAP_RATIO;
  const k = cam.k;
  const ls = spacing ?? (sc ? 0.16 : 0.01);
  return (
    <text
      x={x + (size * ls) / 2 / k}
      y={y + sl.dy / k}
      textAnchor="middle"
      opacity={op}
      fill={color}
      stroke={DARK}
      strokeOpacity={0.75}
      strokeWidth={(size * 0.14) / k}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ fontFamily: sc ? fellSC : fell, fontSize: size / k, letterSpacing: `${ls}em`, textRendering: "geometricPrecision" }}
    >
      {text}
    </text>
  );
};
