// ---------------------------------------------------------------------------
// iraqShared: THE IRAQ WORLD, shared read-only by cuts A B C E F G of the clip
// "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (Dwarkesh with Si Sheppard;
// Dwarkesh map style). Built by builder W; once SPD/iraq/WORLD_READY.md exists the
// existing exports never change (additions only, each logged there as CHANGED:).
//
// THE WORLD. North-up Lambert conformal conic, parallels 30/36 N, centre
// meridian 44 E (d3 geoConicConformal().parallels([30, 36]).rotate([-44, 0]);
// scripts/build-iraq-map.mjs -> iraqMapData.ts / iraqStatic.ts). k = 1 is the
// framing in which Iraq's bbox is 880 px wide and its area centroid sits at
// screen (540, 835) (camera { k 1, cx 540, cy 960 }; world px == screen px).
// 0.9515 world px per km. The static map (sea, 4 engraved water-lines, 5 deg
// graticule, land + #6A5838 rim, cream coast; NO borders) is a tiled raster LOD
// pyramid (scripts/bake-iraq-rasters.mjs -> public/iraq/*.png, iraqLevels.ts):
//   far (base, the region from k 0.4; sharp to k 0.63) | wide band 0.62-0.68 |
//   mid band 1.2-1.3 | near band 2.0-2.15 (Iraq + Kuwait to k 3.2) |
//   closeS / closeK band 3.2-3.45 (Baghdad-Samarra / Kuwait-Basra, sharp to k 5)
// HOLD THE CAMERA OUTSIDE THE BANDS. mapSharpness(cam).texelsPerPx >= ~0.95 = sharp.
//
// SOURCES. Natural Earth 10m admin-0 countries + land (world-atlas; public
// domain; Iraq's land borders unchanged 1991-2006). 2003 routes: CLIP_SPEC
// waypoints (Wikipedia "2003 invasion of Iraq"; 3rd Infantry Division west of
// the Euphrates via Tallil, As Samawah, An Najaf, the Karbala Gap, Baghdad
// airport; I MEF via Safwan, An Nasiriyah, Ad Diwaniyah, An Numaniyah, the
// Diyala bridge). Border lengths for TYPE: CIA World Factbook (Kuwait 254 km =
// 158 mi; total 3,809 km = 2,367 mi) - the 10m ring's own lengths differ.
//
// API (world px unless noted) - see WORLD_READY.md for usage lines
//   frame/palette: FPS FRAME_W FRAME_H SCREEN_CX SCREEN_CY CONTENT_Y CAM_LIFT
//     CAPTION_TOP; SEA LAND LAND_RIM INK ACCENT ACCENT_DEEP DARK; RUNG (the
//     opacity ladder 1 / 0.45 / 0.2); fellSC fell (IM Fell English SC / roman)
//   maths: clamp01 smoothstep smootherstep easeInOutSine hash mixColor lerp
//   projection: project(lon, lat); PX_PER_KM; inIraq(x, y)
//   camera: Cam screenOf worldOf camFor viewRect camTransform sway swayCam
//     pchip makeTrack camScan; makeCamTrack(framings, moves) (the keyed track)
//   map: levelWeights mapSharpness MapStack PaperTop MapPage WorldSvg
//   geometry: IRAQ_RING IRAQ_ROUTE (the ring as a closed Route) IRAQ_SEG
//     IRAQ_BORDERS IRAQ_BORDER_D IRAQ_D KUWAIT_D COUNTRY_D OTHER_BORDERS_D
//     KUWAIT_SAUDI_D IRAQ_CENTROID IRAQ_BOX KUWAIT_CENTROID KUWAIT_BOX SITES
//     IRAQ_SCATTER ROUTE_ARMY ROUTE_MARINES makeRoute
//   drawing: <InkLine> <DashedBorder> <OrangeLine> <RouteLine> <Hatch>
//     revealHalfPlane revealScaled <Label> labelSlide <CityDot> <Ring>
//     <Highlight> columnDots <Dots>
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { LEVELS } from "./iraqLevels";
import {
  COUNTRY_D,
  IRAQ_BORDERS,
  IRAQ_BOX,
  IRAQ_CENTROID,
  IRAQ_RING,
  IRAQ_SCATTER,
  IRAQ_SEGMENTS,
  KUWAIT_BOX,
  KUWAIT_CENTROID,
  KUWAIT_POLYS,
  KUWAIT_SAUDI_D,
  OTHER_BORDERS_D,
  PROJ,
  PX_PER_KM,
  ROUTE_ARMY_DATA,
  RIVERS_D,
  ROUTE_MARINES_DATA,
  SITES,
  type BorderKey,
  type P2,
  type RouteData,
} from "./iraqMapData";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
loadFell("italic", { weights: ["400"], subsets: ["latin"] });
export { fellSC, fell };

export type { BorderKey, P2, RouteData };
export {
  COUNTRY_D,
  IRAQ_BORDERS,
  IRAQ_BOX,
  IRAQ_CENTROID,
  IRAQ_RING,
  IRAQ_SCATTER,
  KUWAIT_BOX,
  KUWAIT_CENTROID,
  KUWAIT_POLYS,
  KUWAIT_SAUDI_D,
  OTHER_BORDERS_D,
  PX_PER_KM,
  RIVERS_D,
  SITES,
};

// ---------------------------------------------------------------------------
// Frame, palette
// ---------------------------------------------------------------------------
export const FPS = 24;
export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const SCREEN_CX = 540;
export const SCREEN_CY = 960;
export const CONTENT_Y = 835;
export const CAM_LIFT = SCREEN_CY - CONTENT_Y; // 125
export const CAPTION_TOP = 1150;

export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DARK = "#0B0907";
/** THE OPACITY LADDER of the clip: in play / context / receded context */
export const RUNG = { full: 1, mid: 0.45, low: 0.2 } as const;

// ---------------------------------------------------------------------------
// Maths
// ---------------------------------------------------------------------------
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const easeInOutSine = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(v));
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mixColor = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const dOf = (pts: P2[], close = false) =>
  pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}${close ? "Z" : ""}` : "";

// ---------------------------------------------------------------------------
// Projection (spherical LCC, identical to d3-geo geoConicConformal with PROJ)
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
const C0 = rawLcc(0, 0);
/** lon/lat (deg) -> world px */
export const project = (lon: number, lat: number): P2 => {
  const p = rawLcc((lon + PROJ.rotate[0]) * RAD, lat * RAD);
  return [PROJ.translate[0] + PROJ.scale * (p[0] - C0[0]), PROJ.translate[1] - PROJ.scale * (p[1] - C0[1])];
};
{
  const b = project(SITES.baghdad.lon, SITES.baghdad.lat);
  if (Math.hypot(b[0] - SITES.baghdad.x, b[1] - SITES.baghdad.y) > 0.01) throw new Error("iraqShared project() disagrees with the build");
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
export type Cam = { k: number; cx: number; cy: number };
export const screenOf = ([x, y]: P2, cam: Cam): P2 => [SCREEN_CX + (x - cam.cx) * cam.k, SCREEN_CY + (y - cam.cy) * cam.k];
export const worldOf = ([sx, sy]: P2, cam: Cam): P2 => [cam.cx + (sx - SCREEN_CX) / cam.k, cam.cy + (sy - SCREEN_CY) / cam.k];
/** the camera that puts world point p at screen (sx, sy) at zoom k */
export const camFor = (p: P2, k: number, sx = SCREEN_CX, sy = CONTENT_Y): Cam => ({
  k,
  cx: p[0] - (sx - SCREEN_CX) / k,
  cy: p[1] - (sy - SCREEN_CY) / k,
});
export const viewRect = (cam: Cam, marginPx = 0) => ({
  x0: cam.cx - (SCREEN_CX + marginPx) / cam.k,
  x1: cam.cx + (FRAME_W - SCREEN_CX + marginPx) / cam.k,
  y0: cam.cy - (SCREEN_CY + marginPx) / cam.k,
  y1: cam.cy + (FRAME_H - SCREEN_CY + marginPx) / cam.k,
});
export const camTransform = (cam: Cam) => {
  const tx = SCREEN_CX - cam.cx * cam.k;
  const ty = SCREEN_CY - cam.cy * cam.k;
  return { tx, ty, svg: `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(6)})` };
};
/** the house hand on the camera (screen px); pass the GLOBAL frame */
export const sway = (g: number) => ({ dx: 3 * Math.sin(g / 23), dy: 5 * Math.sin(g / 19) });
export const swayCam = (cam: Cam, g: number): Cam => {
  const s = sway(g);
  return { k: cam.k, cx: cam.cx + s.dx / cam.k, cy: cam.cy + s.dy / cam.k };
};
/** monotone cubic (pchip) through keys [x, y]; heldEnds = zero end slopes */
export const pchip = (keys: [number, number][], heldEnds = false) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return heldEnds ? 0 : d[0];
    if (i === n - 1) return heldEnds ? 0 : d[n - 2];
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
/** [from, to, area, taper]: a cosine-tapered velocity bump whose integral is `area` */
export type Bump = [number, number, number, number];
const bumpV = ([a, b, area, alpha]: Bump, f: number) => {
  if (f <= a || f >= b) return 0;
  const len = b - a;
  const tp = Math.max(1e-6, (alpha * len) / 2);
  const hgt = area / (len - tp);
  const x = f - a;
  if (x < tp) return hgt * 0.5 * (1 - Math.cos((Math.PI * x) / tp));
  if (x > len - tp) return hgt * 0.5 * (1 - Math.cos((Math.PI * (len - x)) / tp));
  return hgt;
};
/** a channel as the integral of velocity bumps (C1 end to end); value v0 before every bump */
export const makeTrack = (bumps: Bump[], v0: number, fLo = -200, fHi = 3300, sub = 4) => {
  const n = (fHi - fLo) * sub;
  const arr = new Float64Array(n + 1);
  let acc = v0;
  arr[0] = acc;
  let vPrev = bumps.reduce((s, bb) => s + bumpV(bb, fLo), 0);
  for (let i = 1; i <= n; i++) {
    const f = fLo + i / sub;
    const v = bumps.reduce((s, bb) => s + bumpV(bb, f), 0);
    acc += ((vPrev + v) / 2) * (1 / sub);
    arr[i] = acc;
    vPrev = v;
  }
  return (f: number) => {
    const p = (f - fLo) * sub;
    const i = Math.max(0, Math.min(n - 1, Math.floor(p)));
    const u = clamp01(p - i);
    return arr[i] + (arr[i + 1] - arr[i]) * u;
  };
};
/** a framing: world point p at screen (sx, sy) at zoom k */
export type Framing = { p: P2; k: number; sx?: number; sy?: number };
/** a move: carries the camera from framing i to framing i + 1 as one cosine-tapered
 *  velocity bump over frames [from, to] (taper 1 = a full raised cosine: lands at rest
 *  in velocity, C1). Overlapping moves add (a creep under a glide). */
export type Move = { from: number; to: number; taper?: number };
/** THE KEYED CAMERA TRACK: framings F0..Fn and n moves (move i = Fi -> Fi+1), in ln k,
 *  cx, cy. Before move 0 the camera sits at F0; after the last move it rests at Fn.
 *  Moves may start before your first frame or end after your last (a creep that is
 *  still moving at the cut). Returns camAt(g) (no sway) - wrap it in swayCam(cam, g). */
export const makeCamTrack = (framings: Framing[], moves: Move[], fLo = -200, fHi = 3300) => {
  if (moves.length !== framings.length - 1) throw new Error("makeCamTrack: one move per framing step");
  const F = framings.map((q) => {
    const c = camFor(q.p, q.k, q.sx ?? SCREEN_CX, q.sy ?? CONTENT_Y);
    return [Math.log(q.k), c.cx, c.cy];
  });
  const ch = (c: number) =>
    makeTrack(
      moves.map((m, i) => [m.from, m.to, F[i + 1][c] - F[i][c], m.taper ?? 1] as Bump),
      F[0][c],
      fLo,
      fHi,
    );
  const LK = ch(0);
  const CX = ch(1);
  const CY = ch(2);
  return (g: number): Cam => ({ k: Math.exp(LK(g)), cx: CX(g), cy: CY(g) });
};
/** the camera's per-frame velocity at g (d ln k, d cx, d cy) */
export const camVel = (camAt: (g: number) => Cam, g: number) => {
  const a = camAt(g - 0.5);
  const b = camAt(g + 0.5);
  return { lnk: Math.log(b.k) - Math.log(a.k), cx: b.cx - a.cx, cy: b.cy - a.cy };
};
/** max screen speed (px/f) and max |dv| (px/f^2) over g0..g1 of a probe grid above the
 *  caption band and of the given world points */
export const camScan = (camAt: (g: number) => Cam, f0: number, f1: number, pts: P2[] = []) => {
  const probes: P2[] = [];
  for (let sy = 150; sy <= 1150; sy += 250) for (let sx = 60; sx <= 1020; sx += 240) probes.push([sx, sy]);
  const gridV = (f: number) =>
    probes.map(([sx, sy]) => {
      const w = worldOf([sx, sy], camAt(f));
      const [bx, by] = screenOf(w, camAt(f + 1));
      return [bx - sx, by - sy] as P2;
    });
  const out = { gridMaxV: 0, gridMaxVf: f0, gridMaxDv: 0, gridMaxDvf: f0, pts: pts.map(() => ({ maxV: 0, maxVf: f0 })) };
  let pg = gridV(f0);
  for (let f = f0 + 1; f < f1; f++) {
    const g = gridV(f);
    g.forEach(([x, y], i) => {
      const s = Math.hypot(x, y);
      if (s > out.gridMaxV) [out.gridMaxV, out.gridMaxVf] = [s, f];
      const dv = Math.hypot(x - pg[i][0], y - pg[i][1]);
      if (dv > out.gridMaxDv) [out.gridMaxDv, out.gridMaxDvf] = [dv, f];
    });
    pts.forEach((p, i) => {
      const a = screenOf(p, camAt(f));
      const b = screenOf(p, camAt(f + 1));
      const s = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (s > out.pts[i].maxV) [out.pts[i].maxV, out.pts[i].maxVf] = [s, f];
    });
    pg = g;
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE MAP: LOD tiles (iraqLevels.ts), world-space mottle, paper on top
// ---------------------------------------------------------------------------
const COVER_FADE = 48; // screen px: a level fades out as the frame's edge nears its rect's
export const levelWeights = (cam: Cam) => {
  const v = viewRect(cam, 16);
  return LEVELS.map((L) => {
    const kw = L.band ? smoothstep(Math.log(cam.k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1;
    if (kw <= 0) return 0;
    if (!L.band) return 1;
    const inset = Math.min(v.x0 - L.x0, L.x0 + L.w - v.x1, v.y0 - L.y0, L.y0 + L.h - v.y1) * cam.k;
    return kw * smoothstep(inset / COVER_FADE);
  });
};
/** the level that dominates this camera's frame and its sharpness (texels per screen px; >= ~0.95 sharp) */
export const mapSharpness = (cam: Cam) => {
  const w = levelWeights(cam);
  let top = 0;
  for (let i = 0; i < w.length; i++) if (w[i] >= 0.5) top = i;
  return { level: LEVELS[top].name, weight: w[top], texelsPerPx: LEVELS[top].s / cam.k, weights: w };
};
/** the baked map under the camera (no grain / vignette: see PaperTop) */
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number }> = ({ cam, mottleOpacity = 0.9 }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  const layers = LEVELS.map((L, li) => {
    if (w[li] <= 0.001) return null;
    if (w.some((o, j) => j > li && o >= 0.999)) return null;
    const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
    return (
      <div key={L.name} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: w[li] }}>
        {tiles.map((t) => (
          <Img
            key={t.f}
            src={staticFile(`iraq/${t.f}`)}
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
      </div>
    );
  });
  // mottle tiles, world space, in octaves: stains keep ~ the same screen size through a zoom
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const mt: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((v.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((v.y0 - oy) / S) * S + oy;
    for (let y = y0; y < v.y1; y += S) for (let x = x0; x < v.x1; x += S) mt.push({ x, y, s: S, o: op });
  });
  return (
    <>
      {layers}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: mottleOpacity,
        }}
      >
        {mt.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile("manchuria/mottle.png")}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>
    </>
  );
};
/** screen-space paper: grain, then the soft vignette (draw it LAST) */
export const PaperTop: React.FC<{ vignette?: number; grainOpacity?: number }> = ({ vignette = 0.55, grainOpacity = 1 }) => (
  <>
    <Img src={staticFile("manchuria/grain.png")} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: grainOpacity }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
      }}
    />
  </>
);
/** MapStack + children + PaperTop on the sea colour */
export const MapPage: React.FC<{ cam: Cam; vignette?: number; children?: React.ReactNode }> = ({ cam, vignette, children }) => (
  <AbsoluteFill style={{ backgroundColor: SEA }}>
    <MapStack cam={cam} />
    {children}
    <PaperTop vignette={vignette} />
  </AbsoluteFill>
);
/** a full-frame svg whose children draw in world px under the camera */
export const WorldSvg: React.FC<{ cam: Cam; children?: React.ReactNode }> = ({ cam, children }) => (
  <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
    <g transform={camTransform(cam).svg}>{children}</g>
  </svg>
);

// ---------------------------------------------------------------------------
// Routes (polylines with arclength)
// ---------------------------------------------------------------------------
export type Route = {
  pts: P2[];
  cum: number[];
  len: number;
  wpS: number[];
  d: string;
  pointAt: (s: number) => P2;
  tangentAt: (s: number) => P2;
  partialPath: (s0: number, s1: number) => P2[];
  partialD: (s0: number, s1: number) => string;
};
export const makeRoute = (data: { pts: P2[]; wpS?: number[] }): Route => {
  const pts = data.pts;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const seg = (s: number) => {
    const t = Math.max(0, Math.min(len, s));
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= t) lo = mid;
      else hi = mid;
    }
    return { lo, hi, u: (t - cum[lo]) / (cum[hi] - cum[lo] || 1) };
  };
  const pointAt = (s: number): P2 => {
    const { lo, hi, u } = seg(s);
    return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * u, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * u];
  };
  const tangentAt = (s: number): P2 => {
    const a = pointAt(Math.max(0, s - 1.5));
    const b = pointAt(Math.min(len, s + 1.5));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const partialPath = (s0: number, s1: number): P2[] => {
    const a0 = Math.max(0, Math.min(len, Math.min(s0, s1)));
    const a1 = Math.max(0, Math.min(len, Math.max(s0, s1)));
    const A = seg(a0);
    const B = seg(a1);
    const out: P2[] = [pointAt(a0)];
    for (let i = A.hi; i <= B.lo; i++) out.push(pts[i]);
    out.push(pointAt(a1));
    return out;
  };
  return { pts, cum, len, wpS: data.wpS ?? [0, len], d: dOf(pts), pointAt, tangentAt, partialPath, partialD: (s0, s1) => dOf(partialPath(s0, s1)) };
};

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
/** Iraq's ring as a Route: s = 0 at the Kuwait-Iraq-Saudi tripoint, running Kuwait ->
 *  coast -> Iran -> Turkey -> Syria -> Jordan -> Saudi -> back (s = IRAQ_ROUTE.len) */
export const IRAQ_ROUTE = makeRoute({ pts: IRAQ_RING });
/** each part's arclength range on IRAQ_ROUTE: IRAQ_SEG.kuwait = { s0: 0, s1, km } ... */
export const IRAQ_SEG = Object.fromEntries(IRAQ_SEGMENTS.map((q) => [q.key, q])) as Record<BorderKey, { key: BorderKey; s0: number; s1: number; km: number }>;
/** each Iraq-X border as its own svg d (open, in the ring's direction) */
export const IRAQ_BORDER_D = Object.fromEntries(Object.entries(IRAQ_BORDERS).map(([k, v]) => [k, dOf(v as P2[])])) as Record<BorderKey, string>;
export const IRAQ_D = COUNTRY_D.iraq;
export const KUWAIT_D = COUNTRY_D.kuwait;
const IRAQ_OPEN = IRAQ_RING.slice(0, -1);
/** is world point (x, y) inside Iraq? */
export const inIraq = (x: number, y: number) => {
  let c = false;
  for (let i = 0, j = IRAQ_OPEN.length - 1; i < IRAQ_OPEN.length; j = i++) {
    const [xi, yi] = IRAQ_OPEN[i];
    const [xj, yj] = IRAQ_OPEN[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
/** the 2003 columns' routes: s = 0 in the Kuwait assembly area, .borderS = where each
 *  enters Iraq, the end = 13 world px short of Baghdad */
export const ROUTE_ARMY = Object.assign(makeRoute(ROUTE_ARMY_DATA), { borderS: ROUTE_ARMY_DATA.borderS });
export const ROUTE_MARINES = Object.assign(makeRoute(ROUTE_MARINES_DATA), { borderS: ROUTE_MARINES_DATA.borderS });
export const BAGHDAD: P2 = [SITES.baghdad.x, SITES.baghdad.y];
export const SAMARRA: P2 = [SITES.samarra.x, SITES.samarra.y];

// ---------------------------------------------------------------------------
// LINES. One stroke family: cream ink 2.0 px, orange 2.6 px over a dark casing,
// fine dashed cream 1.4 px. Dashes are world-anchored octave dashes (a period per
// octave of k), so they keep their screen size through a zoom and never crawl.
// ---------------------------------------------------------------------------
export const W_INK = 2.0; // screen px: Iraq's crisp cream border
export const W_FINE = 1.4; // screen px: the fine dashed cream borders
export const W_ORANGE = 2.6; // screen px: orange lines (borders, outlines)
const DASH = 11; // screen px dash period at the bottom of an octave
export const octaveDashes = (k: number, base = DASH) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = base / Math.pow(2, o);
  return [
    { p: a, op: 1 - t },
    { p: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
/** a crisp cream line (Iraq's own border in cut A) over a faint dark casing */
export const InkLine: React.FC<{ d: string; cam: Cam; opacity?: number; width?: number }> = ({ d, cam, opacity = 1, width = W_INK }) => {
  if (opacity <= 0.002 || !d) return null;
  const px = (v: number) => v / cam.k;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.45 * opacity} strokeWidth={px(width + 2.4)} />
      <path d={d} stroke={INK} strokeOpacity={0.94 * opacity} strokeWidth={px(width)} />
    </g>
  );
};
/** fine dashed cream: the international borders (default the 0.45 rung) */
export const DashedBorder: React.FC<{ d: string; cam: Cam; opacity?: number; width?: number }> = ({ d, cam, opacity = RUNG.mid, width = W_FINE }) => {
  if (opacity <= 0.002 || !d) return null;
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {octaveDashes(cam.k).map((q) => (
        <path key={`db-${q.p}`} d={d} stroke={INK} strokeOpacity={opacity * q.op} strokeWidth={width / cam.k} strokeDasharray={`${(q.p * 0.58).toFixed(5)} ${(q.p * 0.42).toFixed(5)}`} />
      ))}
    </g>
  );
};
/** an orange line over a dark casing. dash 0 = dashed (62 % on), 1 = solid; dashOffset
 *  (world px) phases the dashes (pass the path's start arclength - the anchor's, so the
 *  dashes stay put on the world while a head extends) */
export const OrangeLine: React.FC<{ d: string; cam: Cam; opacity?: number; width?: number; dash?: number; dashOffset?: number; color?: string; dashBase?: number }> = ({
  d,
  cam,
  opacity = 1,
  width = W_ORANGE,
  dash = 1,
  dashOffset = 0,
  color = ACCENT,
  dashBase = DASH,
}) => {
  if (opacity <= 0.002 || !d) return null;
  const px = (v: number) => v / cam.k;
  const s = clamp01(dash);
  if (s >= 0.999)
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke={DARK} strokeOpacity={0.55 * opacity} strokeWidth={px(width + 2.8)} />
        <path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={px(width)} />
      </g>
    );
  const on = 0.62 + 0.38 * s;
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {octaveDashes(cam.k, dashBase).map((q) => (
        <g key={`ol-${q.p}`} opacity={q.op}>
          <path
            d={d}
            stroke={DARK}
            strokeOpacity={0.55 * opacity}
            strokeWidth={px(width + 2.8)}
            strokeDasharray={`${(q.p * on + px(2.8)).toFixed(5)} ${Math.max(0, q.p * (1 - on) - px(2.8)).toFixed(5)}`}
            strokeDashoffset={dashOffset + px(1.4)}
          />
          <path d={d} stroke={color} strokeOpacity={opacity} strokeWidth={px(width)} strokeDasharray={`${(q.p * on).toFixed(5)} ${(q.p * (1 - on)).toFixed(5)}`} strokeDashoffset={dashOffset} />
        </g>
      ))}
    </g>
  );
};
/** an orange line along a route from s0 to s1 (dash as OrangeLine; the dashes anchored at
 *  route arclength dashFrom, default 0, so they never crawl as s0 / s1 move) */
export const RouteLine: React.FC<{
  route: Route;
  cam: Cam;
  s0: number;
  s1: number;
  dash?: number;
  dashFrom?: number;
  opacity?: number;
  width?: number;
  color?: string;
  dashBase?: number;
}> = ({
  route,
  cam,
  s0,
  s1,
  dash = 1,
  dashFrom = 0,
  opacity = 1,
  width,
  color,
  dashBase,
}) => {
  if (s1 - s0 < 0.01) return null;
  return (
    <OrangeLine d={route.partialD(s0, s1)} cam={cam} dash={dash} dashOffset={Math.min(s0, s1) - dashFrom} opacity={opacity} width={width} color={color} dashBase={dashBase} />
  );
};

// ---------------------------------------------------------------------------
// CHANGED 2026-10-05 (Fable's A/B review): THE IRAQ LAYERS every cut draws so
// Iraq reads against its neighbours, and the rivers.
//   <IraqLand cam strength?/>   a warm lighter wash inside Iraq + an inner rim
//                               (like the coast rim) inside its border; the
//                               neighbours stay base umber. strength 0..1 (1 = the
//                               standard, 0 = invisible)
//   <IraqBorder cam s0? s1? opacity? width?/>  Iraq's crisp cream border, 3 px at
//                               0.9 (IRAQ_BORDER_OP), optionally only arclength
//                               s0..s1 of IRAQ_ROUTE
//   <Rivers cam opacity?/>      Tigris, Euphrates, Shatt al-Arab: fine engraved
//                               cream at the 0.45 rung; never labelled
//   W_OBJ (4.2) / DASH_OBJ (22): the stroke and dash period of the orange
//                               OBJECTIVE outline (OrangeLine/RouteLine dashBase)
// ---------------------------------------------------------------------------
export const W_IRAQ_BORDER = 3.0;
export const IRAQ_BORDER_OP = 0.9;
export const W_OBJ = 4.2;
export const DASH_OBJ = 22;
const IRAQ_WASH = 0.2; // LAND_RIM fill inside Iraq at strength 1
export const IraqLand: React.FC<{ cam: Cam; strength?: number }> = ({ cam, strength = 1 }) => {
  const a = clamp01(strength);
  if (a <= 0.002) return null;
  const px = (v: number) => v / cam.k;
  return (
    <g>
      <defs>
        <clipPath id="iqLandClip">
          <path d={COUNTRY_D.iraq} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={COUNTRY_D.iraq} fill={LAND_RIM} fillOpacity={IRAQ_WASH * a} />
      <g clipPath="url(#iqLandClip)" fill="none" strokeLinejoin="round">
        <path d={COUNTRY_D.iraq} stroke={LAND_RIM} strokeOpacity={0.3 * a} strokeWidth={px(30)} />
        <path d={COUNTRY_D.iraq} stroke={LAND_RIM} strokeOpacity={0.38 * a} strokeWidth={px(11)} />
      </g>
    </g>
  );
};
export const IraqBorder: React.FC<{ cam: Cam; s0?: number; s1?: number; opacity?: number; width?: number }> = ({
  cam,
  s0 = 0,
  s1 = IRAQ_ROUTE.len,
  opacity = 1,
  width = W_IRAQ_BORDER,
}) => {
  if (opacity <= 0.002 || s1 - s0 < 0.3) return null;
  const d = s0 <= 0 && s1 >= IRAQ_ROUTE.len ? COUNTRY_D.iraq : IRAQ_ROUTE.partialD(s0, s1);
  const px = (v: number) => v / cam.k;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.5 * opacity} strokeWidth={px(width + 2.6)} />
      <path d={d} stroke={INK} strokeOpacity={IRAQ_BORDER_OP * opacity} strokeWidth={px(width)} />
    </g>
  );
};
export const Rivers: React.FC<{ cam: Cam; opacity?: number; width?: number }> = ({ cam, opacity = RUNG.mid, width = 1.5 }) => {
  if (opacity <= 0.002) return null;
  const d = RIVERS_D.tigris + RIVERS_D.euphrates + RIVERS_D.shatt;
  const px = (v: number) => v / cam.k;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.35 * opacity} strokeWidth={px(width + 1.8)} />
      <path d={d} stroke={INK} strokeOpacity={opacity} strokeWidth={px(width)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// HATCH: orange engraved hatch + a deep fill, clipped to a polygon, optionally
// revealed by a travelling front (reveal = the covered region as an svg d in world
// px; feather = the front's soft edge in screen px, <= 10). World-anchored lines at
// a fixed angle, octave-stable spacing (HATCH_PX .. 2 HATCH_PX on screen at any k).
// ---------------------------------------------------------------------------
export const HATCH_ANGLE = 45;
export const HATCH_PX = 9;
const HATCH_W = 1.9;
const hatchGeom = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  return { P: (2 * HATCH_PX) / Math.pow(2, o), mid: L2 - o };
};
export const Hatch: React.FC<{
  id: string; // unique per frame (used for the pattern / mask / filter ids)
  d: string;
  cam: Cam;
  opacity?: number;
  reveal?: string;
  feather?: number;
  color?: string;
  fill?: number; // the deep fill's opacity at opacity 1 (default 0.2)
}> = ({ id, d, cam, opacity = 1, reveal, feather = 6, color = ACCENT, fill = 0.2 }) => {
  if (opacity <= 0.002 || !d) return null;
  const { P, mid } = hatchGeom(cam.k);
  const w = HATCH_W / cam.k;
  const v = viewRect(cam, 40);
  const body = (
    <>
      <path d={d} fillRule="evenodd" fill={ACCENT_DEEP} fillOpacity={fill * opacity} />
      <path d={d} fillRule="evenodd" fill={`url(#${id}-p)`} opacity={0.85 * opacity} />
    </>
  );
  return (
    <g>
      <defs>
        <pattern id={`${id}-p`} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform={`rotate(${HATCH_ANGLE})`}>
          <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={color} strokeWidth={w} />
          <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={color} strokeWidth={w} strokeOpacity={mid} />
          <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={color} strokeWidth={w} />
        </pattern>
        {reveal !== undefined ? (
          <>
            {feather > 0 ? (
              <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0}>
                <feGaussianBlur stdDeviation={feather / 2.5 / cam.k} />
              </filter>
            ) : null}
            <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0}>
              <path d={reveal} fill="#fff" fillRule="evenodd" filter={feather > 0 ? `url(#${id}-f)` : undefined} />
            </mask>
          </>
        ) : null}
      </defs>
      {reveal !== undefined ? <g mask={`url(#${id}-m)`}>{body}</g> : body}
    </g>
  );
};
/** the region on the near side of a straight front: { p : (p - origin) . n <= dist }
 *  (n a unit normal pointing the way the front travels), as a big quad (svg d) */
export const revealHalfPlane = (origin: P2, n: P2, dist: number, size = 6000) => {
  const t: P2 = [-n[1], n[0]];
  const c: P2 = [origin[0] + n[0] * dist, origin[1] + n[1] * dist];
  const a: P2 = [c[0] + t[0] * size, c[1] + t[1] * size];
  const b: P2 = [c[0] - t[0] * size, c[1] - t[1] * size];
  const a2: P2 = [a[0] - n[0] * size, a[1] - n[1] * size];
  const b2: P2 = [b[0] - n[0] * size, b[1] - n[1] * size];
  return dOf([a, b, b2, a2], true);
};
/** a ring scaled by s about origin (svg d): the front that grows a country from a point
 *  and meets its whole border at s = 1 */
export const revealScaled = (ring: P2[], origin: P2, s: number) => {
  if (s <= 0.0005) return "M0,0Z";
  return dOf(
    ring.map(([x, y]) => [origin[0] + (x - origin[0]) * s, origin[1] + (y - origin[1]) * s] as P2),
    true,
  );
};

// ---------------------------------------------------------------------------
// LABELS: names only when spoken; slide up 24 px + fade, start ~8 f before the word
// ---------------------------------------------------------------------------
export const LABEL_TRAVEL = 24;
export const LABEL_FRAMES = 14;
export const LABEL_FADE = 9;
export const LABEL_LEAD = 8; // start this many frames before the word's onset
export const labelSlide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...CLAMP }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], CLAMP),
});
/** a label anchored to world point (x, y) + a screen offset (dx, dy); screen-sized.
 *  font "sc" = IM Fell English SC spaced caps (countries, regions), "roman" = IM Fell
 *  English (cities), "italic" (seas). f0 = the frame the slide starts (word - 8). */
export const Label: React.FC<{
  text: string;
  x: number;
  y: number;
  cam: Cam;
  frame: number;
  f0: number;
  size?: number;
  spacing?: number; // em
  font?: "sc" | "roman" | "italic";
  anchor?: "start" | "middle" | "end";
  dx?: number;
  dy?: number;
  color?: string;
  opacity?: number;
}> = ({ text, x, y, cam, frame, f0, size = 40, spacing, font = "sc", anchor = "middle", dx = 0, dy = 0, color = INK, opacity = 1 }) => {
  const sl = labelSlide(frame, f0);
  if (sl.op * opacity <= 0.002) return null;
  const sp = spacing ?? (font === "sc" ? 0.32 : 0.02);
  const [sx, sy] = screenOf([x, y], cam);
  const trail = size * sp; // letter-spacing trails the last glyph
  const ax = anchor === "middle" ? trail / 2 : anchor === "end" ? trail : 0;
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + dx + ax}
        y={sy + dy + sl.dy}
        textAnchor={anchor}
        opacity={sl.op * opacity}
        fill={color}
        stroke={SEA}
        strokeOpacity={0.55}
        strokeWidth={size * 0.11}
        paintOrder="stroke"
        style={{ fontFamily: font === "sc" ? fellSC : fell, fontStyle: font === "italic" ? "italic" : "normal", fontSize: size, letterSpacing: size * sp }}
      >
        {text}
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// GLYPHS
// ---------------------------------------------------------------------------
/** a small cream city dot (screen-sized) */
export const CityDot: React.FC<{ x: number; y: number; cam: Cam; r?: number; opacity?: number }> = ({ x, y, cam, r = 5.5, opacity = 1 }) =>
  opacity > 0.002 ? (
    <circle cx={x} cy={y} r={r / cam.k} fill={INK} fillOpacity={0.94 * opacity} stroke={DARK} strokeOpacity={0.65 * opacity} strokeWidth={1.8 / cam.k} />
  ) : null;
/** a thin orange ring round a point (screen-sized); progress 0..1 draws it clockwise from the top */
export const Ring: React.FC<{ x: number; y: number; cam: Cam; r?: number; progress?: number; opacity?: number; width?: number }> = ({
  x,
  y,
  cam,
  r = 16,
  progress = 1,
  opacity = 1,
  width = 2.4,
}) => {
  if (opacity <= 0.002 || progress <= 0.001) return null;
  const R = r / cam.k;
  const C = 2 * Math.PI * R;
  const dash = progress >= 0.999 ? undefined : `${(C * progress).toFixed(4)} ${C.toFixed(4)}`;
  return (
    <g opacity={opacity} transform={`rotate(-90 ${x} ${y})`}>
      <circle cx={x} cy={y} r={R} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={(width + 2) / cam.k} strokeDasharray={dash} strokeLinecap="round" />
      <circle cx={x} cy={y} r={R} fill="none" stroke={ACCENT} strokeWidth={width / cam.k} strokeDasharray={dash} strokeLinecap="round" />
    </g>
  );
};
/** a faint travelling highlight: a soft bright stretch of `len` screen px centred on
 *  arclength s of a route (or of a circle: pass ring { x, y, r } and s as the angle in turns) */
export const Highlight: React.FC<{
  cam: Cam;
  route?: Route;
  s: number;
  len?: number;
  ring?: { x: number; y: number; r: number };
  opacity?: number;
  width?: number;
  color?: string;
}> = ({ cam, route, s, len = 70, ring, opacity = 0.4, width = W_ORANGE + 1.2, color = mixColor(ACCENT, INK, 0.65) }) => {
  if (opacity <= 0.002) return null;
  const N = 7;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const u0 = i / N - 0.5;
    const u1 = (i + 1) / N - 0.5;
    const w = Math.cos(Math.PI * ((u0 + u1) / 2)); // 1 in the middle, soft ends
    const a = opacity * w * w;
    if (a < 0.01) continue;
    let d = "";
    if (route) {
      const L = len / cam.k;
      d = route.partialD(s + u0 * L, s + u1 * L);
    } else if (ring) {
      const R = ring.r / cam.k;
      const turn = len / (2 * Math.PI * ring.r);
      const pts: P2[] = [];
      for (let j = 0; j <= 6; j++) {
        const ang = 2 * Math.PI * (s + (u0 + ((u1 - u0) * j) / 6) * turn) - Math.PI / 2;
        pts.push([ring.x + R * Math.cos(ang), ring.y + R * Math.sin(ang)]);
      }
      d = dOf(pts);
    }
    els.push(<path key={`hl-${i}`} d={d} fill="none" stroke={color} strokeOpacity={a} strokeWidth={width / cam.k} strokeLinecap="round" strokeLinejoin="round" />);
  }
  return <g>{els}</g>;
};

// ---------------------------------------------------------------------------
// DOTS: men as dots (orange = America's, cream = everyone else), screen-sized
// ---------------------------------------------------------------------------
export const DOT_R = 3.8; // screen px
export type Dot = { x: number; y: number; t?: number; op?: number; r?: number };
/** a column marching along a route: n dots, the head at arclength sHead, `gap` world px
 *  apart (keep gap x k >= 12 screen px); a dot behind s = 0 is hidden, one within `emerge`
 *  world px of s = 0 fades in (the column streams out of its start) */
export const columnDots = (route: Route, sHead: number, n: number, gap: number, emerge = 8): Dot[] =>
  Array.from({ length: n }, (_, i) => {
    const s = sHead - i * gap;
    const [x, y] = route.pointAt(Math.max(0, s));
    return { x, y, t: 1, op: s <= 0 ? 0 : clamp01(s / emerge) };
  });
/** dots: the dark casings of all first, then the fills (cream -> orange by t) */
export const Dots: React.FC<{ dots: Dot[]; cam: Cam; r?: number; opacity?: number }> = ({ dots, cam, r = DOT_R, opacity = 1 }) => {
  const cw = 1.6 / cam.k;
  return (
    <g>
      {dots.map((d, i) =>
        (d.op ?? 1) * opacity > 0.002 ? <circle key={`c${i}`} cx={d.x} cy={d.y} r={(d.r ?? r) / cam.k + cw / 2} fill={DARK} fillOpacity={0.62 * (d.op ?? 1) * opacity} /> : null,
      )}
      {dots.map((d, i) =>
        (d.op ?? 1) * opacity > 0.002 ? (
          <circle key={`f${i}`} cx={d.x} cy={d.y} r={(d.r ?? r) / cam.k - cw / 2 + 0.6 / cam.k} fill={mixColor(INK, ACCENT, d.t ?? 1)} fillOpacity={(d.op ?? 1) * opacity} />
        ) : null,
      )}
    </g>
  );
};
