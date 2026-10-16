// ---------------------------------------------------------------------------
// pearlShared: THE KIT of the Pearl Harbor clip (Sarah Paine, "How the
// Depression pushed Japan to Pearl Harbor"; Oct 2026). Dwarkesh map style: the
// paper, the two map worlds and the vocabulary shared by cuts B-F. Shared
// read-only; additions only after PEARL_KIT_READY.md.
//
// COLOUR RULE: ORANGE = JAPAN (its empire, troops, seizures, strikes); DASHED
// orange = what Japan plans or claims but does not hold. CREAM = everything else.
//
// WORLDS (data modules, import the one you need):
//   pearlAsiaMapData.ts     ASIA, cuts B-E: LCC, k 1 = all of China (65 deg in 1080 px)
//   pearlPacificMapData.ts  PACIFIC, cut F: Mercator at 160 E, k 1 = 90 E..150 W
// Each has project(lon, lat) -> world px, regions { d, edge, box }, places,
// routes, suggested FRAMINGS. The static map of a world is <MapBase world cam>.
//
// CAMERA: a camera is { x, y, k }: the WORLD point (x, y) lands on the frame
// centre (540, 960) at zoom k. Author it as keys and run it through the damped
// tracker (plagueShared's): const CAM: CamKey[] = [...]; runCamera(CAM, frame).
// Everything inside <WorldSvg cam> is drawn in world px; screen-constant sizes
// are v / cam.k (helper px(cam, v)).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { CAM_DAMP, CAM_STIFF, clamp01, hash, smoothstep } from "../kits/dwarkesh/fieldShared";
import { PEARL_LEVELS_ASIA, PEARL_LEVELS_PACIFIC, PEARL_PAD, PEARL_TILE, type PearlLevel } from "./pearlLevels";

export const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
loadFell("italic", { weights: ["400"], subsets: ["latin"] });

export const FPS = 24;
export const FRAME_W = 1080;
export const FRAME_H = 1920;

// ---------------------------------------------------------------------------
// PALETTE
// ---------------------------------------------------------------------------
export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF"; // cream: everyone and everything that is not Japan
export const DARK = "#17120D"; // casing / outline
export const SHADOW = "#0B0907"; // the deepest casing (the reference's rail casing)
export const ACCENT = "#FFB000"; // JAPAN
export const ACCENT_DEEP = "#D98A0C"; // JAPAN, a shade down (fills)
export const INK_HI = 0.9;
export const INK_LO = 0.5;

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
/** 0..1 LINEAR between frames a and b (constant speed: marching, sailing, flying) */
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
// CAMERA (plagueShared's damped keyed tracker)
// ---------------------------------------------------------------------------
export type CamKey = { f: number; x: number; y: number; k: number };
export type Cam = { x: number; y: number; k: number };
const PREROLL = 60;
type Track = { target: (f: number) => number[]; s: number[]; v: number[]; out: Cam[] };
const TRACKS = new WeakMap<CamKey[], Track>();
/** the camera at `frame`: keys -> monotone cubic (k in log space) -> damped follow
 *  (trails the keys by ~5 frames: key a landing a few frames before its word).
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
// THE STATIC MAP: <MapBase world cam> draws the raster LOD tiles for this camera
// (scripts/maps/bake.mjs scripts/maps/configs/pearl.mjs) and the world-space paper mottle over them.
// <MapPage world cam> = SEA ground + MapBase + children + grain + vignette.
// ---------------------------------------------------------------------------
export type World = "asia" | "pacific";
const LEVELS: Record<World, PearlLevel[]> = { asia: PEARL_LEVELS_ASIA, pacific: PEARL_LEVELS_PACIFIC };
const levelOps = (levels: PearlLevel[], k: number) =>
  levels.map((L) => (L.band ? smoothstep(Math.log(k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1));
type View = { x0: number; x1: number; y0: number; y1: number };
const cellSpan = (L: PearlLevel, v: View) => ({
  c0: Math.floor((v.x0 - L.x0) / L.tw),
  c1: Math.floor((v.x1 - L.x0) / L.tw),
  r0: Math.floor((v.y0 - L.y0) / L.tw),
  r1: Math.floor((v.y1 - L.y0) / L.tw),
});
const coversView = (L: PearlLevel, v: View) => {
  const { c0, c1, r0, r1 } = cellSpan(L, v);
  if (c0 < 0 || r0 < 0 || c1 >= L.cols || r1 >= L.rows) return false;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (L.cells[r * L.cols + c] === ".") return false;
  return true;
};
/** which LOD levels a camera draws (for checks): [{ name, op }] */
export const mapLevelsAt = (world: World, cam: Cam) => {
  const levels = LEVELS[world];
  const view = viewRect(cam, 12);
  const ops = levelOps(levels, cam.k);
  let base = 0;
  for (let i = levels.length - 1; i >= 0; i--)
    if (ops[i] >= 0.999 && coversView(levels[i], view)) {
      base = i;
      break;
    }
  return levels.map((L, i) => ({ name: L.name, op: i >= base ? ops[i] : 0, covers: coversView(L, view), magnify: cam.k / L.s })).filter((q) => q.op > 0.001);
};

export const MapBase: React.FC<{ world: World; cam: Cam; mottle?: number }> = ({ world, cam, mottle = 0.9 }) => {
  const levels = LEVELS[world];
  const k = cam.k;
  const view = viewRect(cam, 12);
  const ops = levelOps(levels, k);
  let base = 0;
  for (let i = levels.length - 1; i >= 0; i--)
    if (ops[i] >= 0.999 && coversView(levels[i], view)) {
      base = i;
      break;
    }
  const layers: React.ReactNode[] = [];
  for (let i = base; i < levels.length; i++) {
    if (ops[i] <= 0.001) continue;
    const L = levels[i];
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
              src={staticFile(`pearl/${world}-${L.name}-${c}-${r}.png`)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: PEARL_TILE + 2 * PEARL_PAD,
                height: PEARL_TILE + 2 * PEARL_PAD,
                maxWidth: "none",
                transformOrigin: "0 0",
                transform: `translate(${(sx - PEARL_PAD * sc).toFixed(3)}px, ${(sy - PEARL_PAD * sc).toFixed(3)}px) scale(${sc.toFixed(6)})`,
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
  // mottle tiles, world space, in octaves: the stains keep ~ their screen size
  // through a zoom, the next octave fading in across it
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
                src={staticFile("pearl/mottle.png")}
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
  <Img src={staticFile("pearl/grain.png")} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity, pointerEvents: "none" }} />
);
/** the reference map's soft vignette (screen space; draw last) */
export const Vignette: React.FC<{ amount?: number }> = ({ amount = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(amount * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${amount.toFixed(3)}) 100%)`,
    }}
  />
);
/** SEA ground + the static map + your overlays + grain + vignette */
export const MapPage: React.FC<{ world: World; cam: Cam; vignette?: number; grain?: number; mottle?: number; children?: React.ReactNode }> = ({
  world,
  cam,
  vignette = 0.55,
  grain = 1,
  mottle = 0.9,
  children,
}) => (
  <AbsoluteFill style={{ backgroundColor: SEA, overflow: "hidden" }}>
    <MapBase world={world} cam={cam} mottle={mottle} />
    {children}
    <Grain opacity={grain} />
    <Vignette amount={vignette} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// POLYLINES: arclength tables, points along, slices
// ---------------------------------------------------------------------------
const CUM = new WeakMap<P2[], number[]>();
/** cumulative arclength of a polyline (cached per array) */
export const cumOf = (pts: P2[]) => {
  let c = CUM.get(pts);
  if (!c) {
    c = [0];
    for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    CUM.set(pts, c);
  }
  return c;
};
export const lengthOf = (pts: P2[]) => {
  const c = cumOf(pts);
  return c[c.length - 1];
};
const segAt = (c: number[], s: number) => {
  let lo = 0;
  let hi = c.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c[m] <= s) lo = m;
    else hi = m;
  }
  return lo;
};
/** the point at arclength s, and the unit tangent */
export const pointAt = (pts: P2[], s: number) => {
  const c = cumOf(pts);
  const L = c[c.length - 1];
  const t = Math.max(0, Math.min(L, s));
  const i = Math.min(pts.length - 2, segAt(c, t));
  const seg = c[i + 1] - c[i] || 1e-9;
  const u = (t - c[i]) / seg;
  const a = pts[i];
  const b = pts[i + 1];
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, tx: (b[0] - a[0]) / seg, ty: (b[1] - a[1]) / seg };
};
/** the sub-polyline between arclengths s0 and s1 */
export const slicePts = (pts: P2[], s0: number, s1: number): P2[] => {
  const c = cumOf(pts);
  const L = c[c.length - 1];
  const a = Math.max(0, Math.min(L, s0));
  const b = Math.max(0, Math.min(L, s1));
  if (b <= a) return [];
  const pa = pointAt(pts, a);
  const pb = pointAt(pts, b);
  const out: P2[] = [[pa.x, pa.y]];
  for (let i = segAt(c, a) + 1; i < pts.length && c[i] < b; i++) out.push(pts[i]);
  out.push([pb.x, pb.y]);
  return out;
};
export const dOf = (pts: P2[], close = false) => (pts.length < 2 ? "" : `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}${close ? "Z" : ""}`);

// ---------------------------------------------------------------------------
// INK (plagueShared): roughen / inkPath / InkStroke
// ---------------------------------------------------------------------------
/** points with a slow seeded wobble (amp ~1-2.5 world px; the ends stay put) */
export const roughen = (points: P2[], seed = 0, amp = 1.6): P2[] => {
  if (points.length < 2) return points;
  const pts: P2[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 36));
    for (let j = 1; j <= n; j++) pts.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
  }
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = s[s.length - 1];
  const p1 = hash(seed, 11) * 6.283;
  const p2 = hash(seed, 12) * 6.283;
  return pts.map(([x, y], i): P2 => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const w = (amp * Math.min(1, s[i] / 30, (total - s[i]) / 30) * (Math.sin(s[i] / 55 + p1) + 0.6 * Math.sin(s[i] / 23 + p2))) / 1.6;
    return [x - ((b[1] - a[1]) / len) * w, y + ((b[0] - a[0]) / len) * w];
  });
};
/** a smooth path d through the points (Catmull-Rom) */
export const inkPath = (points: P2[], closed = false) => {
  const n = points.length;
  if (n < 2) return "";
  const at = (i: number) => (closed ? points[((i % n) + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return closed ? `${d}Z` : d;
};
/** an engraved stroke in world space: dark casing under a cream (tone 0) / orange (tone 1) core; width in SCREEN px */
export const InkStroke: React.FC<{ d: string; cam: Cam; width?: number; tone?: number; casing?: boolean; opacity?: number; dash?: [number, number] }> = ({ d, cam, width = 3, tone = 0, casing = true, opacity = 1, dash }) => {
  const da = dash ? `${px(cam, dash[0])} ${px(cam, dash[1])}` : undefined;
  return (
    <g opacity={opacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {casing ? <path d={d} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={px(cam, width + Math.max(1.6, width * 0.6))} strokeDasharray={da} /> : null}
      <path d={d} stroke={mixColor(INK, ACCENT, tone)} strokeWidth={px(cam, width)} strokeDasharray={da} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// HATCH: "Japan holds this". Orange hatch + a faint orange wash over a region's
// (land-clipped) fill, its dashed orange edge over land only. World-anchored,
// octave-stable spacing (~10-20 screen px; the lines never swim in a zoom).
//   reveal: grow it along a travelling front from where Japan already is:
//     { from: [x, y], progress }               radial, from a point
//     { from: [x, y], dir: [dx, dy], progress } a straight front moving along dir,
//                                              starting on the line through `from`
//   progress 0..1 covers the region's box (the far corner); front: the leading
//   edge drawn as a thin orange line (default on while 0 < progress < 1).
//   ghost: the "PLANNED" variant: no wash, a sparse faint hatch and the WHOLE
//     outline dashed (coast included).
// ---------------------------------------------------------------------------
export type RegionShape = { d: string; edge?: string; box: [number, number, number, number] };
export type Reveal = { from: P2; progress: number; dir?: P2 };
const revealGeom = (box: [number, number, number, number], rv: Reveal) => {
  const corners: P2[] = [
    [box[0], box[1]],
    [box[2], box[1]],
    [box[0], box[3]],
    [box[2], box[3]],
  ];
  if (!rv.dir) {
    const reach = Math.max(...corners.map(([x, y]) => Math.hypot(x - rv.from[0], y - rv.from[1])));
    return { kind: "radial" as const, r: Math.max(0.001, reach * clamp01(rv.progress)) };
  }
  const l = Math.hypot(rv.dir[0], rv.dir[1]) || 1;
  const ux = rv.dir[0] / l;
  const uy = rv.dir[1] / l;
  const reach = Math.max(...corners.map(([x, y]) => (x - rv.from[0]) * ux + (y - rv.from[1]) * uy));
  const s = reach * clamp01(rv.progress);
  const B = 20000;
  const cx = rv.from[0] + ux * s;
  const cy = rv.from[1] + uy * s;
  const nx = -uy;
  const ny = ux;
  const poly: P2[] = [
    [cx + nx * B, cy + ny * B],
    [cx - nx * B, cy - ny * B],
    [cx - nx * B - ux * B, cy - ny * B - uy * B],
    [cx + nx * B - ux * B, cy + ny * B - uy * B],
  ];
  return { kind: "linear" as const, poly, line: [[cx + nx * B, cy + ny * B] as P2, [cx - nx * B, cy - ny * B] as P2] };
};
/** the octave-stable world-anchored hatch pattern (put in <defs> or inline) */
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
export const Hatch: React.FC<{
  region: RegionShape;
  cam: Cam;
  /** unique per Hatch in a frame */
  id: string;
  opacity?: number;
  reveal?: Reveal;
  front?: boolean;
  ghost?: boolean;
  /** edge opacity (default = opacity) */
  edgeOpacity?: number;
}> = ({ region, cam, id, opacity = 1, reveal, front, ghost = false, edgeOpacity }) => {
  if (opacity <= 0.001) return null;
  const p = reveal ? clamp01(reveal.progress) : 1;
  if (p <= 0) return null;
  const rg = reveal && p < 1 ? revealGeom(region.box, reveal) : null;
  const eo = edgeOpacity ?? opacity;
  const clip = rg ? `url(#${id}-rv)` : undefined;
  const showFront = rg && (front ?? true);
  return (
    <g>
      <defs>
        <HatchPattern id={`${id}-pat`} cam={cam} spacing={ghost ? 16 : 10} width={ghost ? 1.6 : 2.1} />
        {rg ? (
          <clipPath id={`${id}-rv`}>{rg.kind === "radial" ? <circle cx={reveal!.from[0]} cy={reveal!.from[1]} r={rg.r} /> : <path d={dOf(rg.poly, true)} />}</clipPath>
        ) : null}
        {showFront ? (
          <clipPath id={`${id}-in`}>
            <path d={region.d} clipRule="evenodd" />
          </clipPath>
        ) : null}
      </defs>
      <g clipPath={clip}>
        {ghost ? (
          <>
            <path d={region.d} fill={`url(#${id}-pat)`} fillRule="evenodd" opacity={0.4 * opacity} />
            <path d={region.d} fill="none" stroke={ACCENT} strokeOpacity={eo} strokeWidth={px(cam, 2.2)} strokeDasharray={`${px(cam, 8)} ${px(cam, 6)}`} strokeLinejoin="round" />
          </>
        ) : (
          <>
            <path d={region.d} fill={ACCENT_DEEP} fillOpacity={0.2 * opacity} fillRule="evenodd" />
            <path d={region.d} fill={`url(#${id}-pat)`} fillRule="evenodd" opacity={0.7 * opacity} />
            {region.edge ? (
              <path d={region.edge} fill="none" stroke={ACCENT} strokeOpacity={eo} strokeWidth={px(cam, 2.2)} strokeDasharray={`${px(cam, 7)} ${px(cam, 5)}`} strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
          </>
        )}
      </g>
      {showFront ? (
        <g clipPath={`url(#${id}-in)`} opacity={opacity * smoothstep(p / 0.04) * smoothstep((1 - p) / 0.04)}>
          {rg.kind === "radial" ? (
            <circle cx={reveal!.from[0]} cy={reveal!.from[1]} r={rg.r} fill="none" stroke={ACCENT} strokeWidth={px(cam, 2.6)} />
          ) : (
            <path d={dOf(rg.line)} fill="none" stroke={ACCENT} strokeWidth={px(cam, 2.6)} />
          )}
        </g>
      ) : null}
    </g>
  );
};

/** PLAN: a dashed orange outline drawn on by a pen (e.g. CHINA_OUTLINE_PTS): the
 *  dashes are anchored to the start, so they never crawl as the line grows */
export const PlanOutline: React.FC<{ pts: P2[]; cam: Cam; drawn: number; width?: number; opacity?: number; nib?: boolean }> = ({ pts, cam, drawn, width = 2.4, opacity = 1, nib = true }) => {
  const u = clamp01(drawn);
  if (u <= 0 || opacity <= 0.001) return null;
  const L = lengthOf(pts);
  const part = u >= 1 ? pts : slicePts(pts, 0, L * u);
  const head = pointAt(pts, L * u);
  return (
    <g opacity={opacity} fill="none" strokeLinejoin="round">
      <path d={dOf(part)} stroke={SHADOW} strokeOpacity={0.45} strokeWidth={px(cam, width + 2)} strokeDasharray={`${px(cam, 10)} ${px(cam, 7)}`} />
      <path d={dOf(part)} stroke={ACCENT} strokeWidth={px(cam, width)} strokeDasharray={`${px(cam, 10)} ${px(cam, 7)}`} />
      {nib && u < 1 ? <circle cx={head.x} cy={head.y} r={px(cam, width * 1.3)} fill={ACCENT} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={px(cam, 1.2)} /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// LABEL: IM Fell English SC, widely spaced caps (or roman / italic), cream or
// orange; slides up 24 screen px while fading in over ~14 frames from `appear`
// (start it ~8 frames before the word). Counter-scaled: `cap` is the CAP HEIGHT
// in screen px at any zoom. (x, y) = world anchor; dx, dy = screen-px offset.
// ---------------------------------------------------------------------------
export const CAP_RATIO = 0.66; // IM Fell cap height / font size
export type LabelProps = {
  x: number;
  y: number;
  text: string;
  appear: number;
  frame: number;
  cam: Cam;
  cap?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  dx?: number;
  dy?: number;
  sc?: boolean;
  italic?: boolean;
  /** letter spacing in em (default 0.16 for SC caps, 0.01 otherwise) */
  spacing?: number;
  opacity?: number;
  /** [f0, f1]: fade out between these frames */
  out?: [number, number];
};
export const labelIn = (frame: number, appear: number) => {
  const u = clamp01((frame - appear) / 14);
  const e = 1 - Math.pow(1 - u, 3);
  return { dy: 24 * (1 - e), op: smoothstep((frame - appear) / 9) };
};
export const Label: React.FC<LabelProps> = ({ x, y, text, appear, frame, cam, cap = 38, color = INK, anchor = "middle", dx = 0, dy = 0, sc = true, italic = false, spacing, opacity = 1, out }) => {
  const sl = labelIn(frame, appear);
  const op = sl.op * opacity * (out ? 1 - ramp(frame, out[0], out[1]) : 1);
  if (op <= 0.002) return null;
  const size = cap / CAP_RATIO;
  const k = cam.k;
  return (
    <text
      x={x + dx / k}
      y={y + (dy + sl.dy) / k}
      textAnchor={anchor}
      opacity={op}
      fill={color}
      stroke={SHADOW}
      strokeOpacity={0.6}
      strokeWidth={(size * 0.12) / k}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ fontFamily: sc ? fellSC : fell, fontStyle: italic && !sc ? "italic" : "normal", fontSize: size / k, letterSpacing: `${spacing ?? (sc ? 0.16 : 0.01)}em`, textRendering: "geometricPrecision" }}
    >
      {text}
    </text>
  );
};
/** a city dot (cream, dark ring; orange for Japan's own), screen-constant radius */
export const CityDot: React.FC<{ x: number; y: number; cam: Cam; r?: number; color?: string; opacity?: number }> = ({ x, y, cam, r = 6.5, color = INK, opacity = 1 }) =>
  opacity <= 0.002 ? null : <circle cx={x} cy={y} r={px(cam, r)} fill={color} stroke={SHADOW} strokeWidth={px(cam, 2.2)} opacity={opacity} />;

// ---------------------------------------------------------------------------
// ROUTE: an aid route. kind "rail" = the chequered railway symbol of the
// reference (cream casing, dark core, cream dashes); "road" = a cased cream line
// with a dark dashed centre. drawn: arclength drawn so far (world px, from the
// start). cut: the line breaks at arclength s with two clean ends (open 0..1
// opens the gap), and the remainder beyond the break drops to ~0.35 (dim 0..1).
// dashK: the zoom at which the dashes are their nominal size (pass a constant in
// a zooming shot so the chequers do not crawl; default: the camera's k).
// ---------------------------------------------------------------------------
export type RouteData = { pts: P2[]; len: number; stations: Record<string, number> };
export type RouteCut = { s: number; open: number; dim: number; gap?: number };
export const Route: React.FC<{ route: RouteData; kind: "road" | "rail"; cam: Cam; drawn?: number; cut?: RouteCut; opacity?: number; tone?: number; width?: number; dashK?: number }> = ({
  route,
  kind,
  cam,
  drawn,
  cut,
  opacity = 1,
  tone = 0,
  width,
  dashK,
}) => {
  const pts = route.pts;
  const L = lengthOf(pts);
  const end = Math.min(L, drawn ?? L);
  if (end <= 0 || opacity <= 0.001) return null;
  const k = cam.k;
  const kd = dashK ?? k;
  const ink = mixColor(INK, ACCENT, tone);
  const pieces: { a: number; b: number; op: number }[] = [];
  if (cut && cut.open > 0) {
    const g = ((cut.gap ?? 11) / k) * smoothstep(cut.open);
    pieces.push({ a: 0, b: Math.min(end, cut.s - g), op: 1 });
    if (end > cut.s + g) pieces.push({ a: cut.s + g, b: end, op: 1 - 0.65 * smoothstep(cut.dim) });
  } else {
    if (cut) pieces.push({ a: 0, b: end, op: 1 });
    else pieces.push({ a: 0, b: end, op: 1 });
  }
  const sym = (a: number, b: number, key: string, op: number) => {
    if (b - a <= 0.01) return null;
    const d = dOf(slicePts(pts, a, b));
    if (kind === "rail") {
      const RW = width ?? 6.5;
      const dash = 9 / kd;
      return (
        <g key={key} fill="none" strokeLinejoin="round" opacity={op}>
          <path d={d} stroke={SHADOW} strokeOpacity={0.55} strokeWidth={(RW + 3.5) / k} />
          <path d={d} stroke={ink} strokeWidth={RW / k} />
          <path d={d} stroke="#15120E" strokeWidth={(RW - 3) / k} />
          <path d={d} stroke={ink} strokeWidth={(RW - 3) / k} strokeDasharray={`${dash} ${dash}`} strokeDashoffset={a} />
        </g>
      );
    }
    const RW = width ?? 5.5;
    const dash = 7 / kd;
    return (
      <g key={key} fill="none" strokeLinejoin="round" opacity={op}>
        <path d={d} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={(RW + 3.5) / k} />
        <path d={d} stroke={ink} strokeWidth={RW / k} />
        <path d={d} stroke="#15120E" strokeWidth={1.5 / k} strokeDasharray={`${dash} ${dash * 0.8}`} strokeDashoffset={a} />
      </g>
    );
  };
  return <g opacity={opacity}>{pieces.map((q, i) => sym(q.a, q.b, `p${i}`, q.op))}</g>;
};

/** PACKETS: positions (arclength) of convoy marks travelling a route at constant
 *  speed, evenly spaced. Emitted from the start every gap / speed frames from f0
 *  (pass a negative f0 to have the line already flowing on frame 0).
 *  cut { s, frame, gap }: at `frame` the line breaks at s: packets beyond it brake
 *  to a stop where they are (decel frames) and stay; packets before it queue up
 *  behind the break (queue spacing qGap). op is 0..1 (fades at the two ends). */
export type Packet = { id: number; s: number; op: number; beyond: boolean };
export const packetsAt = ({
  len,
  frame,
  f0 = 0,
  speed,
  gap,
  cut,
  decel = 10,
  qGap,
  fadeIn = 14,
  fadeOut = 14,
}: {
  len: number;
  frame: number;
  f0?: number;
  /** world px per frame */
  speed: number;
  /** world px between packets */
  gap: number;
  cut?: { s: number; frame: number; gap: number };
  decel?: number;
  qGap?: number;
  /** world px over which a packet fades in after leaving the start / out arriving */
  fadeIn?: number;
  fadeOut?: number;
}): Packet[] => {
  const out: Packet[] = [];
  const tNow = frame - f0;
  if (tNow < 0) return out;
  const iMax = Math.floor((tNow * speed) / gap);
  const iMin = Math.max(0, Math.floor((tNow * speed - len) / gap) - 2);
  const qg = qGap ?? gap * 0.55;
  const fc = cut ? cut.frame - f0 : Infinity;
  const iFirst = cut ? Math.ceil((fc * speed - cut.s) / gap) : 0;
  const brake = (s0: number, d: number, t: number) => {
    if (d <= 0) return s0;
    const D = (2 * d) / speed;
    if (t >= D) return s0 + d;
    const u = t / D;
    return s0 + d * (1 - (1 - u) * (1 - u));
  };
  for (let i = cut ? Math.min(iMin, Math.max(0, iFirst - 1)) : iMin; i <= iMax; i++) {
    const sNom = tNow * speed - i * gap;
    let s = sNom;
    let beyond = false;
    if (cut && tNow > fc) {
      const sc = fc * speed - i * gap; // where it was when the line broke
      if (sc > cut.s) {
        beyond = true;
        s = brake(sc, (speed * decel) / 2, tNow - fc);
      } else {
        const j = i - iFirst;
        const T = cut.s - cut.gap - j * qg;
        if (T < 0) continue;
        const startBrake = T - (speed * decel) / 2;
        if (sc >= startBrake) {
          // already inside its braking distance when the line broke: brake from there
          s = brake(sc, Math.max(0, T - sc), tNow - fc);
        } else if (sNom <= startBrake) s = sNom;
        else s = brake(startBrake, T - startBrake, (sNom - startBrake) / speed);
      }
    } else if (cut && sNom > cut.s) beyond = true;
    if (s < 0 || s > len) continue;
    const op = smoothstep(s / fadeIn) * smoothstep((len - s) / fadeOut);
    if (op <= 0.01) continue;
    out.push({ id: i, s, op, beyond });
  }
  return out;
};
/** the convoy marks: small engraved cream crates (wider than the line, dark-cased) oriented along the route; size = length in screen px */
export const Packets: React.FC<{ route: RouteData; packets: Packet[]; cam: Cam; size?: number; tone?: number; dimBeyond?: number; opacity?: number }> = ({
  route,
  packets,
  cam,
  size = 21,
  tone = 0,
  dimBeyond = 0,
  opacity = 1,
}) => {
  const w = size / cam.k;
  const h = (size * 0.6) / cam.k;
  const fill = mixColor(INK, ACCENT, tone);
  return (
    <g opacity={opacity}>
      {packets.map((p) => {
        const q = pointAt(route.pts, p.s);
        const a = (Math.atan2(q.ty, q.tx) * 180) / Math.PI;
        const op = p.op * (p.beyond ? 1 - 0.65 * smoothstep(dimBeyond) : 1);
        return (
          <g key={p.id} transform={`translate(${q.x} ${q.y}) rotate(${a})`} opacity={op}>
            {/* a wagon: the load (long body) and a short cab in front, cased dark */}
            <rect x={-w / 2} y={-h / 2} width={w * 0.68} height={h} rx={h * 0.16} fill={fill} stroke={SHADOW} strokeWidth={2.4 / cam.k} />
            <rect x={w * 0.22} y={-h * 0.36} width={w * 0.28} height={h * 0.72} rx={h * 0.16} fill={fill} stroke={SHADOW} strokeWidth={2.4 / cam.k} />
            <line x1={-w * 0.27} y1={-h / 2} x2={-w * 0.27} y2={h / 2} stroke={SHADOW} strokeWidth={1.4 / cam.k} />
            <line x1={-w * 0.04} y1={-h / 2} x2={-w * 0.04} y2={h / 2} stroke={SHADOW} strokeWidth={1.4 / cam.k} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// STRIKES: an orange arc from origin to target drawn by a travelling head (a
// short arrowhead) at constant speed (t LINEAR in frames: lin()), the tail
// staying as a fine orange line. Then <Target> rings the target when it lands.
// ---------------------------------------------------------------------------
/** a bowed arc between two world points (the bow to the LEFT of travel; -bow for the right) */
export const arcPath = (a: P2, b: P2, bow = 0.12, n = 48): P2[] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = dy / L;
  const ny = -dx / L;
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const h = bow * L * Math.sin(Math.PI * t);
    out.push([a[0] + dx * t + nx * h, a[1] + dy * t + ny * h]);
  }
  return out;
};
/** the great circle between two [lon, lat] points, projected with the world's project(), plus a bow */
export const greatCirclePath = (project: (lon: number, lat: number) => [number, number], a: [number, number], b: [number, number], bow = 0.08, n = 64): P2[] => {
  const R = Math.PI / 180;
  const v = ([lon, lat]: [number, number]) => [Math.cos(lat * R) * Math.cos(lon * R), Math.cos(lat * R) * Math.sin(lon * R), Math.sin(lat * R)];
  const A = v(a);
  const B = v(b);
  const om = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])));
  const raw: P2[] = [];
  let prevLon = a[0];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s0 = om < 1e-9 ? 1 - t : Math.sin((1 - t) * om) / Math.sin(om);
    const s1 = om < 1e-9 ? t : Math.sin(t * om) / Math.sin(om);
    const p = [0, 1, 2].map((j) => A[j] * s0 + B[j] * s1);
    let lon = Math.atan2(p[1], p[0]) / R;
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    prevLon = lon;
    raw.push(project(lon, Math.asin(Math.max(-1, Math.min(1, p[2]))) / R));
  }
  if (!bow) return raw;
  const a0 = raw[0];
  const b0 = raw[raw.length - 1];
  const L = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1;
  const nx = (b0[1] - a0[1]) / L;
  const ny = -(b0[0] - a0[0]) / L;
  return raw.map(([x, y], i) => {
    const h = bow * L * Math.sin((Math.PI * i) / n);
    return [x + nx * h, y + ny * h] as P2;
  });
};
/** a smooth path through waypoints (world px), resampled */
export const viaPath = (pts: P2[], per = 16): P2[] => {
  if (pts.length < 3) return pts;
  const out: P2[] = [];
  const n = pts.length;
  const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const w = [-0.5 * t3 + t2 - 0.5 * t, 1.5 * t3 - 2.5 * t2 + 1, -1.5 * t3 + 2 * t2 + 0.5 * t, 0.5 * t3 - 0.5 * t2];
      out.push([w[0] * p0[0] + w[1] * p1[0] + w[2] * p2[0] + w[3] * p3[0], w[0] * p0[1] + w[1] * p1[1] + w[2] * p2[1] + w[3] * p3[1]]);
    }
  }
  out.push(pts[n - 1]);
  return out;
};
export const StrikeArc: React.FC<{ pts: P2[]; t: number; cam: Cam; width?: number; head?: number; opacity?: number; color?: string }> = ({ pts, t, cam, width = 2, head = 15, opacity = 1, color = ACCENT }) => {
  const u = clamp01(t);
  if (u <= 0 || opacity <= 0.001) return null;
  const L = lengthOf(pts);
  const s = L * u;
  const k = cam.k;
  const tail = slicePts(pts, 0, s);
  const heavy = slicePts(pts, Math.max(0, s - 34 / k), s);
  const hp = pointAt(pts, s);
  const ang = Math.atan2(hp.ty, hp.tx);
  const hl = head / k;
  const wing = (sgn: number): P2 => [hp.x - Math.cos(ang + sgn * 0.45) * hl, hp.y - Math.sin(ang + sgn * 0.45) * hl];
  const headD = u < 1 ? dOf([wing(1), [hp.x, hp.y], wing(-1)]) : "";
  return (
    <g opacity={opacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={dOf(tail)} stroke={SHADOW} strokeOpacity={0.5} strokeWidth={(width + 2) / k} />
      <path d={dOf(tail)} stroke={color} strokeWidth={width / k} />
      {u < 1 ? (
        <>
          <path d={dOf(heavy)} stroke={color} strokeWidth={(width + 1.4) / k} />
          <path d={headD} stroke={SHADOW} strokeOpacity={0.65} strokeWidth={5.6 / k} />
          <path d={headD} stroke={color} strokeWidth={3 / k} />
        </>
      ) : null}
    </g>
  );
};
/** TARGET: a thin orange ring + a small engraved burst, at (x, y). arrive 0..1:
 *  0 until the strike touches; then the burst rays shoot out of the impact point
 *  and the ring is drawn round from the side the strike came from (`from`).
 *  size = ring radius in screen px at k 1, growing k^grow (default 0.2). */
export const Target: React.FC<{ x: number; y: number; cam: Cam; arrive: number; from?: P2; size?: number; grow?: number; opacity?: number }> = ({ x, y, cam, arrive, from, size = 30, grow = 0.2, opacity = 1 }) => {
  const a = clamp01(arrive);
  if (a <= 0 || opacity <= 0.001) return null;
  const k = cam.k;
  const R = (size * Math.pow(k, grow)) / k;
  const sw = 1 / k;
  const ringU = smoother(a / 0.7);
  const rayU = smoother((a - 0.05) / 0.6);
  const th0 = from ? Math.atan2(from[1] - y, from[0] - x) : -Math.PI / 2;
  const arcD = (dir: number) => {
    const n = 40;
    const pts: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const th = th0 + dir * Math.PI * ringU * (i / n);
      pts.push([x + Math.cos(th) * R, y + Math.sin(th) * R]);
    }
    return dOf(pts);
  };
  const rays: string[] = [];
  for (let i = 0; i < 8; i++) {
    const th = th0 + Math.PI / 8 + (i * Math.PI) / 4;
    const r0 = R * 0.2;
    const r1 = r0 + R * (i % 2 === 0 ? 0.52 : 0.34) * rayU;
    rays.push(`M${(x + Math.cos(th) * r0).toFixed(3)},${(y + Math.sin(th) * r0).toFixed(3)}L${(x + Math.cos(th) * r1).toFixed(3)},${(y + Math.sin(th) * r1).toFixed(3)}`);
  }
  const ringD = arcD(1) + arcD(-1);
  return (
    <g opacity={opacity} fill="none" strokeLinecap="round">
      <circle cx={x} cy={y} r={R} fill={DARK} fillOpacity={0.35 * ringU} stroke="none" />
      <path d={ringD} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={4.6 * sw} />
      <path d={ringD} stroke={ACCENT} strokeWidth={2.4 * sw} />
      {rayU > 0 ? (
        <>
          <path d={rays.join("")} stroke={SHADOW} strokeOpacity={0.65} strokeWidth={4.4 * sw} />
          <path d={rays.join("")} stroke={ACCENT} strokeWidth={2.2 * sw} />
        </>
      ) : null}
      <circle cx={x} cy={y} r={R * 0.11} fill={ACCENT} stroke={SHADOW} strokeWidth={1.4 * sw} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// DOT FIELDS (crowds): an even blue-noise field of dots inside a polygon
// (Bridson Poisson-disc, deterministic per seed), bands to move them into,
// a matching, a staggered eased interpolation and a spacing relax.
// Polygons are the coarse rings of the data modules (P2[][][]: polygons of rings,
// even-odd) or a single ring P2[].
// ---------------------------------------------------------------------------
export type Rings = P2[][][] | P2[][] | P2[];
const ringsOf = (poly: Rings): P2[][] => {
  if (!poly.length) return [];
  const a = poly[0] as unknown;
  if (Array.isArray(a) && typeof (a as unknown[])[0] === "number") return [poly as P2[]];
  const b = (poly as P2[][])[0][0] as unknown;
  if (Array.isArray(b) && typeof (b as unknown[])[0] === "number") return poly as P2[][];
  return (poly as P2[][][]).flat();
};
/** even-odd point-in-polygon over every ring */
export const inRings = (x: number, y: number, poly: Rings) => {
  let c = false;
  for (const r of ringsOf(poly))
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i];
      const [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  return c;
};
export const ringsBox = (poly: Rings): [number, number, number, number] => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const r of ringsOf(poly)) for (const [x, y] of r) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return [x0, y0, x1, y1];
};
const mulberry = (seed: number) => {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** Bridson Poisson-disc samples inside `inside`, within box, min spacing r (world px).
 *  Deterministic. max: stop after that many dots. Seeds start at `start` if given. */
export const poissonDots = ({ inside, box, spacing, seed = 1, max = 5000, start }: { inside: (x: number, y: number) => boolean; box: [number, number, number, number]; spacing: number; seed?: number; max?: number; start?: P2 }): P2[] => {
  const rnd = mulberry(seed);
  const [x0, y0, x1, y1] = box;
  const cs = spacing / Math.SQRT2;
  const gw = Math.max(1, Math.ceil((x1 - x0) / cs));
  const gh = Math.max(1, Math.ceil((y1 - y0) / cs));
  const grid = new Int32Array(gw * gh).fill(-1);
  const pts: P2[] = [];
  const active: number[] = [];
  const put = (p: P2) => {
    pts.push(p);
    active.push(pts.length - 1);
    grid[Math.floor((p[1] - y0) / cs) * gw + Math.floor((p[0] - x0) / cs)] = pts.length - 1;
  };
  const ok = (x: number, y: number) => {
    if (x < x0 || x >= x1 || y < y0 || y >= y1 || !inside(x, y)) return false;
    const gx = Math.floor((x - x0) / cs);
    const gy = Math.floor((y - y0) / cs);
    for (let j = Math.max(0, gy - 2); j <= Math.min(gh - 1, gy + 2); j++)
      for (let i = Math.max(0, gx - 2); i <= Math.min(gw - 1, gx + 2); i++) {
        const q = grid[j * gw + i];
        if (q >= 0 && Math.hypot(pts[q][0] - x, pts[q][1] - y) < spacing) return false;
      }
    return true;
  };
  // seed points: the given start, else scan for inside points on a coarse lattice (so every island of the polygon gets one)
  const seeds: P2[] = start ? [start] : [];
  if (!start)
    for (let y = y0 + spacing / 2; y < y1; y += spacing * 6)
      for (let x = x0 + spacing / 2; x < x1; x += spacing * 6) if (inside(x, y)) seeds.push([x, y]);
  for (const s of seeds) {
    if (pts.length >= max) break;
    if (!ok(s[0], s[1])) continue;
    put(s);
    while (active.length && pts.length < max) {
      const ai = Math.floor(rnd() * active.length);
      const p = pts[active[ai]];
      let found = false;
      for (let t = 0; t < 24; t++) {
        const a = rnd() * Math.PI * 2;
        const r = spacing * (1 + rnd());
        const x = p[0] + Math.cos(a) * r;
        const y = p[1] + Math.sin(a) * r;
        if (ok(x, y)) {
          put([x, y]);
          found = true;
          break;
        }
      }
      if (!found) active.splice(ai, 1);
    }
  }
  return pts;
};
const FIELD_CACHE = new Map<string, P2[]>();
/** an even field of dots inside a polygon (cached per key) */
export const dotsInRings = (poly: Rings, spacing: number, seed = 1, max = 5000, key?: string): P2[] => {
  const ck = key ? `${key}|${spacing}|${seed}|${max}` : "";
  if (ck && FIELD_CACHE.has(ck)) return FIELD_CACHE.get(ck)!;
  const out = poissonDots({ inside: (x, y) => inRings(x, y, poly), box: ringsBox(poly), spacing, seed, max });
  if (ck) FIELD_CACHE.set(ck, out);
  return out;
};
/** an even field of dots in a disc, optionally also inside a polygon (e.g. a faction round its seat, inside CHINA_POLY) */
export const dotsInDisc = (cx: number, cy: number, r: number, spacing: number, seed = 1, within?: Rings, max = 2000): P2[] =>
  poissonDots({ inside: (x, y) => Math.hypot(x - cx, y - cy) <= r && (!within || inRings(x, y, within)), box: [cx - r, cy - r, cx + r, cy + r], spacing, seed, max, start: [cx, cy] });
/** a band polygon on one side of a polyline: from gap to gap + depth (side 1 = left of travel, -1 = right) */
export const bandRing = (line: P2[], side: 1 | -1, gap: number, depth: number): P2[] => {
  const off = (d: number) =>
    line.map((p, i): P2 => {
      const a = line[Math.max(0, i - 2)];
      const b = line[Math.min(line.length - 1, i + 2)];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = ((b[1] - a[1]) / L) * side;
      const ny = (-(b[0] - a[0]) / L) * side;
      return [p[0] + nx * d, p[1] + ny * d];
    });
  return [...off(gap), ...off(gap + depth).reverse()];
};
/** reorder `to` so to[i] pairs with from[i] without crossings along the main axis (both sorted by projection on it) */
export const matchDots = (from: P2[], to: P2[], axis?: P2): P2[] => {
  const n = Math.min(from.length, to.length);
  let ax = axis;
  if (!ax) {
    const xs = to.map((p) => p[0]);
    const ys = to.map((p) => p[1]);
    ax = Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys) ? [1, 0] : [0, 1];
  }
  const key = (p: P2) => p[0] * ax![0] + p[1] * ax![1];
  const fi = from.slice(0, n).map((p, i) => ({ i, v: key(p) })).sort((a, b) => a.v - b.v);
  const tj = to.map((p) => ({ p, v: key(p) })).sort((a, b) => a.v - b.v);
  const out: P2[] = new Array(n);
  fi.forEach((f, r) => {
    out[f.i] = tj[Math.round((r * (tj.length - 1)) / Math.max(1, n - 1))].p;
  });
  return out;
};
/** per-dot eased move from -> to at u (0..1), each dot starting at its own hashed delay (stagger: fraction of the move) */
export const lerpDots = (from: P2[], to: P2[], u: number, stagger = 0.35, seed = 1): P2[] =>
  from.map((p, i) => {
    const q = to[i] ?? p;
    const d = stagger * hash(seed * 131 + i, 3);
    const e = smoother((u - d) / Math.max(1e-6, 1 - stagger));
    return [p[0] + (q[0] - p[0]) * e, p[1] + (q[1] - p[1]) * e];
  });
/** push dots apart to at least minSep (a few Jacobi rounds; pure function) */
export const relaxDots = (pts: P2[], minSep: number, iters = 3): P2[] => {
  let cur = pts.map((p) => [p[0], p[1]] as P2);
  for (let it = 0; it < iters; it++) {
    const cell = new Map<string, number[]>();
    cur.forEach(([x, y], i) => {
      const key = `${Math.floor(x / minSep)},${Math.floor(y / minSep)}`;
      if (!cell.has(key)) cell.set(key, []);
      cell.get(key)!.push(i);
    });
    const next = cur.map((p) => [p[0], p[1]] as P2);
    cur.forEach(([x, y], i) => {
      const gx = Math.floor(x / minSep);
      const gy = Math.floor(y / minSep);
      for (let a = gx - 1; a <= gx + 1; a++)
        for (let b = gy - 1; b <= gy + 1; b++)
          for (const j of cell.get(`${a},${b}`) ?? []) {
            if (j === i) continue;
            const dx = x - cur[j][0];
            const dy = y - cur[j][1];
            const d = Math.hypot(dx, dy);
            if (d >= minSep) continue;
            const m = (0.5 * (minSep - d)) / (d || 1e-6);
            next[i][0] += (d ? dx : Math.cos(i)) * m * 0.5;
            next[i][1] += (d ? dy : Math.sin(i)) * m * 0.5;
          }
    });
    cur = next;
  }
  return cur;
};
/** the house dot diameter law (screen px): 9.5 x k^0.35 */
export const dotScreen = (k: number) => 9.5 * Math.pow(k, 0.35);
/** dots: cream (tone 0) or orange (tone 1), dark ring, screen-constant size */
export const Dots: React.FC<{ pts: P2[]; cam: Cam; d?: number; tone?: number; opacity?: number; ops?: number[] }> = ({ pts, cam, d, tone = 0, opacity = 1, ops }) => {
  const r = (d ?? dotScreen(cam.k)) / 2 / cam.k;
  const fill = mixColor(INK, ACCENT, tone);
  return (
    <g opacity={opacity}>
      {pts.map(([x, y], i) => (ops && ops[i] <= 0.002 ? null : <circle key={i} cx={x} cy={y} r={r} fill={fill} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={1.4 / cam.k} opacity={ops ? ops[i] : 1} />))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// RESOURCE GLYPHS (cut B): engraved cream objects standing on the map: a coal
// heap, pig iron, a soybean sack. (x, y) = world point of the ground under the
// glyph's middle; h = height in SCREEN px (45-60 at the close-up); strokes are
// screen-constant (the map's weight). reveal 0..1 raises it out of the ground
// line (a clip rising from the base); tone 0 cream -> 1 orange (seized).
// ---------------------------------------------------------------------------
type GlyphProps = { x: number; y: number; cam: Cam; id: string; h?: number; reveal?: number; tone?: number; opacity?: number };
const Glyph: React.FC<GlyphProps & { top: number; draw: (u: (v: number) => number, ink: string, id: string) => React.ReactNode }> = ({ x, y, cam, id, h = 54, reveal = 1, tone = 0, opacity = 1, top, draw }) => {
  const rv = clamp01(reveal);
  if (rv <= 0 || opacity <= 0.001) return null;
  const s = h / cam.k / (96 - top); // world px per glyph unit (the drawing spans y top..96)
  const u = (v: number) => v / (s * cam.k); // screen px -> glyph units
  const ink = mixColor(INK, ACCENT, tone);
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${s}) translate(-50 -96)`}>
      <defs>
        <clipPath id={`${id}-rise`}>
          <rect x={-10} y={96 - (96 - top + 2) * rv} width={120} height={(96 - top + 2) * rv + 6} />
        </clipPath>
      </defs>
      <g clipPath={rv < 1 ? `url(#${id}-rise)` : undefined}>{draw(u, ink, id)}</g>
      <path d="M4,96.5L96,96.5" stroke={SHADOW} strokeOpacity={0.6} strokeWidth={u(3.4)} strokeLinecap="round" />
      <path d="M8,96.5L92,96.5" stroke={ink} strokeWidth={u(1.6)} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};
const hatchLines = (x0: number, y0: number, x1: number, y1: number, step: number, slope: number) => {
  let d = "";
  for (let x = x0 - (y1 - y0) * Math.abs(slope); x <= x1; x += step) d += `M${x.toFixed(1)},${y1}L${(x + (y1 - y0) * slope).toFixed(1)},${y0}`;
  return d;
};
const COAL_LUMPS: P2[][] = [
  [[38, 58], [46, 44], [58, 42], [66, 52], [60, 62], [46, 64]],
  [[18, 77], [22, 62], [34, 55], [45, 62], [43, 76], [30, 80]],
  [[44, 75], [49, 60], [62, 55], [75, 62], [72, 77], [58, 80]],
  [[6, 96], [10, 82], [22, 75], [33, 80], [35, 96]],
  [[30, 96], [34, 80], [48, 73], [62, 78], [65, 96]],
  [[60, 96], [64, 80], [78, 72], [90, 80], [94, 96]],
];
export const CoalHeap: React.FC<GlyphProps> = (p) => (
  <Glyph
    {...p}
    top={42}
    draw={(u, ink, id) => (
      <>
        {COAL_LUMPS.map((L, i) => {
          const d = dOf(L, true);
          const xs = L.map((q) => q[0]);
          const ys = L.map((q) => q[1]);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
          // the facet: from the top vertex down to the base, shading the right side
          const top = L.reduce((a, b) => (b[1] < a[1] ? b : a));
          return (
            <g key={i}>
              <clipPath id={`${id}-l${i}`}>
                <path d={d} />
              </clipPath>
              <path d={d} fill={DARK} stroke={SHADOW} strokeWidth={u(4)} strokeLinejoin="round" />
              <path d={hatchLines(cx, Math.min(...ys), Math.max(...xs), Math.max(...ys), u(4.2), 0.6)} clipPath={`url(#${id}-l${i})`} stroke={ink} strokeOpacity={0.7} strokeWidth={u(1.2)} />
              <path d={`M${top[0]},${top[1]}L${cx + 2},${Math.max(...ys) - 3}`} stroke={ink} strokeWidth={u(1.3)} strokeOpacity={0.9} />
              <path d={d} fill="none" stroke={ink} strokeWidth={u(2.1)} strokeLinejoin="round" />
            </g>
          );
        })}
      </>
    )}
  />
);
export const IronPig: React.FC<GlyphProps> = (p) => (
  <Glyph
    {...p}
    top={52}
    draw={(u, ink, id) => {
      const bar = (fx: number, fy: number, w: number, hh: number, taper: number, dx: number, dy: number, key: string) => {
        const front: P2[] = [[fx, fy], [fx + w, fy], [fx + w - taper, fy - hh], [fx + taper, fy - hh]];
        const top: P2[] = [[fx + taper, fy - hh], [fx + w - taper, fy - hh], [fx + w - taper + dx, fy - hh + dy], [fx + taper + dx, fy - hh + dy]];
        const end: P2[] = [[fx + w, fy], [fx + w + dx, fy + dy], [fx + w - taper + dx, fy - hh + dy], [fx + w - taper, fy - hh]];
        return (
          <g key={key}>
            <clipPath id={`${id}-${key}f`}>
              <path d={dOf(front, true)} />
            </clipPath>
            <clipPath id={`${id}-${key}e`}>
              <path d={dOf(end, true)} />
            </clipPath>
            {[front, top, end].map((f, i) => (
              <path key={i} d={dOf(f, true)} fill={DARK} stroke={SHADOW} strokeWidth={u(4)} strokeLinejoin="round" />
            ))}
            <path d={hatchLines(fx, fy - hh, fx + w, fy, u(4.5), 0)} clipPath={`url(#${id}-${key}f)`} stroke={ink} strokeOpacity={0.55} strokeWidth={u(1.1)} />
            <path d={hatchLines(fx + w - taper, fy - hh + dy, fx + w + dx, fy, u(3), 0.9)} clipPath={`url(#${id}-${key}e)`} stroke={ink} strokeOpacity={0.8} strokeWidth={u(1.1)} />
            {[front, top, end].map((f, i) => (
              <path key={`o${i}`} d={dOf(f, true)} fill="none" stroke={ink} strokeWidth={u(2.1)} strokeLinejoin="round" />
            ))}
          </g>
        );
      };
      return (
        <>
          {bar(8, 96, 72, 16, 5, 11, -10, "a")}
          {bar(22, 75, 52, 14, 4, 10, -9, "b")}
        </>
      );
    }}
  />
);
const SACK_D =
  "M28,96C14,95 11,77 17,63C21,53 29,47 36,43L38,35C33,31 29,25 32,18C37,22 42,24 50,24C58,24 63,22 68,18C71,25 67,31 62,35L64,43C71,47 79,53 83,63C89,77 86,95 72,96Z";
export const SoySack: React.FC<GlyphProps> = (p) => (
  <Glyph
    {...p}
    top={18}
    draw={(u, ink, id) => (
      <>
        <clipPath id={`${id}-sack`}>
          <path d={SACK_D} />
        </clipPath>
        <path d={SACK_D} fill={DARK} stroke={SHADOW} strokeWidth={u(4)} strokeLinejoin="round" />
        <path d={hatchLines(58, 40, 92, 96, u(4.2), 0.35)} clipPath={`url(#${id}-sack)`} stroke={ink} strokeOpacity={0.6} strokeWidth={u(1.1)} />
        <path d="M42,50C46,62 45,80 40,92M58,48C64,60 66,78 62,92M28,30C36,33 44,30 50,30C56,30 64,33 72,30" fill="none" stroke={ink} strokeOpacity={0.85} strokeWidth={u(1.3)} strokeLinecap="round" />
        <path d={SACK_D} fill="none" stroke={ink} strokeWidth={u(2.1)} strokeLinejoin="round" />
        <path d="M36.5,39.5C44,42.5 56,42.5 63.5,39.5" fill="none" stroke={SHADOW} strokeWidth={u(5)} strokeLinecap="round" />
        <path d="M36.5,39.5C44,42.5 56,42.5 63.5,39.5" fill="none" stroke={ink} strokeWidth={u(2.6)} strokeLinecap="round" />
        {[
          [8, 93.5],
          [14.5, 94.5],
          [11, 90],
        ].map(([bx, by], i) => (
          <ellipse key={i} cx={bx} cy={by} rx={3.2} ry={2.3} fill={DARK} stroke={ink} strokeWidth={u(1.4)} />
        ))}
      </>
    )}
  />
);

// ---------------------------------------------------------------------------
// ISLAND DOTS (cut F, added with the PACIFIC world): small islands Japan holds
// (the South Seas Mandate: MANDATE_POINTS) at a minimum visible size: an orange
// disc + ring of radius r WORLD px (map scale: it grows with the zoom like the
// land, default 2.4 = ~2.6 px at the Pacific wide), held between rMin and rMax
// SCREEN px so it never vanishes at the wide nor swamps the island when close.
// ops: per-dot 0..1 (e.g. a wave spreading out from Japan); tone 0 = cream.
// ---------------------------------------------------------------------------
export const IslandDots: React.FC<{ pts: P2[]; cam: Cam; r?: number; rMin?: number; rMax?: number; tone?: number; opacity?: number; ops?: number[] }> = ({
  pts,
  cam,
  r: rWorld = 2.4,
  rMin = 2.6,
  rMax = 13,
  tone = 1,
  opacity = 1,
  ops,
}) => {
  const c = mixColor(INK, ACCENT, tone);
  const cd = mixColor(INK, ACCENT_DEEP, tone);
  const r = Math.max(rMin, Math.min(rMax, rWorld * cam.k)) / cam.k;
  return (
    <g opacity={opacity}>
      {pts.map(([x, y], i) => {
        const o = ops ? clamp01(ops[i]) : 1;
        if (o <= 0.002) return null;
        return (
          <g key={i} opacity={o}>
            <circle cx={x} cy={y} r={r} fill={cd} fillOpacity={0.45} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={3.6 / cam.k} />
            <circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth={1.8 / cam.k} />
          </g>
        );
      })}
    </g>
  );
};
