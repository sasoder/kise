// ---------------------------------------------------------------------------
// incaShared: THE PERU WORLD, shared read-only by every cut of the clip
// "Sheppard_Atahualpa_ambush" (Dwarkesh with Si Sheppard on Pizarro and
// Atahualpa, Cajamarca 1532; Dwarkesh map style): StrangersInHisRealm (cut 1,
// the realm map), VastExpanseOfHisArmy (cut 2) and LetsOffTheAmbush (cut 3)
// (the Cajamarca local plan). Once SP/WORLD_READY.md exists the existing
// exports never change; additions only, announced there under a dated CHANGED
// heading. This module does not depend on the Cortes world (cortesShared): the
// camera runners, MapStack, CrowdDots, Carrack and MapLabel are copied.
//
// TWO FRAMES on the same page.
//
// 1. THE REALM MAP (world px). North-up Lambert conformal conic, standard
// parallels 5 S / 30 S, centre meridian 75 W (d3 geoConicConformal()
// .parallels([-5, -30]).rotate([75, 0]); scripts/build-inca-map.mjs ->
// incaMapData.ts / incaStatic.ts). North is up on 75 W; the meridians lean
// <= 3.3 deg at the realm's corners. k = 1 is THE REALM WIDE: world px ==
// screen px at the camera { k: 1, cx: 540, cy: 960 }, where the whole realm
// (lat +2.32 ... -35.74) spans y 205 ... 1465, its box centred on (540, 835).
// 0.301 world px per km at Tumbes. The static map (sea, 4 engraved
// water-lines, 5 deg graticule, land + #6A5838 rim, Lago Titicaca and Lago
// Poopo, cream coast; NO borders, rivers or labels) is a tiled raster LOD
// pyramid (scripts/bake-inca-rasters.mjs -> public/inca/*.png, incaLevels.ts):
//   far base | wide 0.80-0.88 | stage 1.45-1.60 | mid 2.35-2.60 |
//   near 3.90-4.30 | close 6.60-7.20 | tight 11.0-12.0 (sharp to k 21 round
//   Tumbes and the coast south to Piura: lon -81.5 ... -79.5, lat -3 ... -5.5).
// Hold the camera OUTSIDE the crossfade bands (k 1.45-1.60, 2.35-2.60,
// 3.90-4.30, 6.60-7.20, 11.0-12.0); check a track with mapSharpness(cam)
// (>= ~0.95 texels per screen px = sharp).
//
// 2. THE CAJAMARCA LOCAL PLAN (local metres). A tangent plane on the plaza
// centroid (OSM -7.1570, -78.5174): 1 unit = 1 metre, x east, y SOUTH.
// localOf(lon, lat) -> [x, y]. The same camera API ({ k, cx, cy }, makeCamera,
// camScan) in local units: k = screen px per metre (k 0.08 = a 13 km valley
// wide, k ~4.5 = the plaza filling the frame). <PlanPage cam> is the same
// umber paper (no sea, coast or graticule).
//
// THE CAMERA. A camera is { k, cx, cy }: the world point (cx, cy) sits at the
// frame's centre (540, 960). screen = (540 + (x - cx) k, 960 + (y - cy) k).
// CAPTION-SAFE RULE: the subject of every framing sits near y 835 (CONTENT_Y):
// cy = subjectY + CAM_LIFT / k (CAM_LIFT 125); nothing important below y 1150.
//
// API (realm: world px; plan: metres)
//   palette: SEA LAND LAND_RIM INK ACCENT ACCENT_DEEP DARK; the two cream rungs
//     INK_FULL (in play) / INK_CONTEXT (~0.5, context). CLIP RULE: orange =
//     PIZARRO'S SIDE ONLY (his ship, his 168, his guns and their fire, his
//     horses); everything Inca is cream.
//   fonts: fellSC (IM Fell English SC: regions, names), fell (IM Fell English
//     roman: numerals, towns)
//   FRAME_W FRAME_H SCREEN_CX SCREEN_CY CONTENT_Y CAM_LIFT CAPTION_TOP FPS
//   maths: clamp01 smoothstep smootherstep hash mixColor makeRng(seed) (a
//     deterministic LCG in [0, 1))
//   project(lon, lat) -> [x, y] world px; PX_PER_KM; WORLD (the baked rect);
//     REALM_BOX (the realm's box at k 1)
//   CAMERA: Cam, screenOf, worldOf, camFor([x, y], k, sx = 540, sy = 835),
//     viewRect(cam, marginPx), camTransform, sway(frame) / swayCam(cam, frame)
//     (the house hand-held drift, 3 / 5 screen px)
//   CAMERA RUNNERS (copied from cortesShared): pchip(keys, heldEnds?);
//     makeCamera(keys: CamKey[], heldEnds?) with CamKey { f, k, wx, wy, sx?,
//     sy? } (world point (wx, wy) at screen (sx, sy) [default 540, 835] at
//     zoom k on frame f; cx, cy, ln k through pchip, C1); makeTrack(bumps:
//     [from, to, area, taper][], v0) (velocity bumps, C1); camScan(camAt, f0,
//     f1, worldPts?) -> { gridMaxV, gridMaxDv, pts: [{ maxV, maxDv, ... }] }
//     (px/f, px/f^2 of a probe grid above the caption band and of fixed points)
//   THE REALM MAP
//     <MapStack cam /> the baked map (LOD tiles + world-space mottle);
//     <PaperTop /> screen grain + soft vignette (draw it LAST);
//     <MapPage cam>{children}</MapPage> = MapStack + children + PaperTop;
//     <WorldSvg cam>{...}</WorldSvg> children in world units under the camera
//     (works for both frames); levelWeights(cam); mapSharpness(cam);
//     landAt(x, y) (10m land round Tumbes, 6 cells / world px; false outside)
//   THE REALM, 1525-32 (cream only)
//     REALM_D (evenodd fill, meets the 10m coast exactly; Titicaca and Poopo
//       removed; the mainland only), REALM_POLYS, REALM_BORDER_D (the land
//       border: no coast), REALM_LOOP (the director's ring incl. its coast, the
//       parameter of a wave) + REALM_LOOP_LEN, REALM_BORDER_RUNS ({ pts, s }:
//       each border vertex's loop arclength), realmLoopS([x, y]) (the loop
//       arclength nearest a point)
//     <RealmWash cam opacity={0.05} /> the faint cream wash
//     <RealmBorder cam level={0} wave? /> the fine dashed border (house: 1.7 px,
//       11 px period, 58 % on, world-anchored octave dashes); its rung =
//       INK_CONTEXT + (INK_FULL - INK_CONTEXT) * level; wave = { from, to?,
//       progress, soft? } brightens it to the full rung as two fronts that leave
//       loop point `from` both ways and meet at `to` (default from + LOOP / 2)
//       at progress 1
//   SITES.{tumbes, poechos, sanMiguel, piuraFort, pabor, serran, motupe,
//     illimo, zana, nanchoc, niepos, llapa, cajamarca, banosDelInca}
//     { x, y, lon, lat } (FACTS.md section 5 / OSM); LANDING { x, y, lon, lat,
//     seaward } (the 10m beach nearest Inca Tumbes, computed)
//   ROUTES (Route: pts, cum, len, wpS, d, pointAt(s), tangentAt(s) (unit),
//     partialPath(s0, s1), partialD(s0, s1); s clamped to [0, len]):
//     PIZARRO_1532 (world px) LANDING -> Tumbes -> Poechos -> San Miguel ->
//     ... -> Cajamarca, wpS per PIZARRO_1532_STOPS; ROAD_TO_CAMP (metres)
//   CROWDS: dotRadius(k) = max(DOT_R_WORLD 0.234, 1.6 / k) world px (3.75 px at
//     k 16, never under 1.6 px); <CrowdDots dots cam casing? /> (dots = { x, y,
//     t (0 cream .. 1 orange), op?, r? }[]; dark casings first, then fills);
//     <CanvasDots cam layers /> tens of thousands of dots on a canvas (layers =
//     { xy: flat [x0, y0, x1, y1, ...] in world units, r (screen px), color,
//     opacity?, casing? (screen px) }[]); packCrowd(polygon, n, spacing?,
//     seed?) -> n even blue-noise points filling a polygon (P2[] or rings
//     P2[][], even-odd), pointInPoly(rings, x, y)
//   GLYPHS (sizes in screen px; one engraved stroke family, DARK casings)
//     <Carrack x y cam frame size? seed? hollow? facing? opacity? pitch? wake?
//       rock? /> (cortesShared's; facing "west" (default) | "east")
//     <CityDot x y cam r? opacity? />
//     <MapLabel text x y cam frame f0 size? spacing? anchor? dx? dy? opacity? />
//       IM Fell English SC spaced caps; labelSlide(frame, f0, frames?, fade?)
//     <NumeralLabel text x y cam frame f0 size={110} dx? dy? frames? fade?
//       opacity? /> IM Fell English roman, cream, the same slide-up entrance
//   THE LOCAL PLAN (metres)
//     LOCAL, localOf(lon, lat), lonLatOfLocal(x, y); CAMP (the springs, local)
//     <PlanPage cam>{children}</PlanPage> umber paper + world-space mottle
//       (octaves blended by k) + PaperTop
//     PLAZA (see the PLAZA section below) and <PlazaPlan cam opacity? />
//     <RouteLine route cam s0? s1? width? color? opacity? casing? /> a route as
//       a cased line (screen px widths)
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import {
  CAMP_LOCAL,
  LAKE_RINGS,
  LANDING,
  LAND_MASK_TUMBES,
  LOCAL,
  PIZARRO_1532_DATA,
  PIZARRO_1532_STOPS,
  PLAZA_DATA,
  PROJ,
  PX_PER_KM,
  REALM_BORDER_D,
  REALM_BORDER_RUNS,
  REALM_BOX,
  REALM_D,
  REALM_LOOP,
  REALM_LOOP_LEN,
  REALM_POLYS,
  ROAD_TO_CAMP_DATA,
  SITES,
  type Doorway,
  type Gate,
  type Hall,
  type P2,
  type RouteData,
} from "./incaMapData";
import { LEVELS } from "./incaLevels";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
export { fell, fellSC };

export type { Doorway, Gate, Hall, P2, RouteData };
export {
  CAMP_LOCAL as CAMP,
  LAKE_RINGS,
  LANDING,
  LOCAL,
  PIZARRO_1532_STOPS,
  PX_PER_KM,
  REALM_BORDER_D,
  REALM_BORDER_RUNS,
  REALM_BOX,
  REALM_D,
  REALM_LOOP,
  REALM_LOOP_LEN,
  REALM_POLYS,
  SITES,
};

// ---------------------------------------------------------------------------
// Frame, palette, timing
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
export const INK_FULL = 0.94;
export const INK_CONTEXT = 0.5;

// ---------------------------------------------------------------------------
// Maths
// ---------------------------------------------------------------------------
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** a deterministic LCG in [0, 1) (Numerical Recipes constants) */
export const makeRng = (seed: number) => {
  let s = (Math.floor(seed) >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** rgb() between two #rrggbb colours */
export const mixColor = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const dOf = (pts: P2[], close = false) =>
  pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}${close ? "Z" : ""}` : "";

// ---------------------------------------------------------------------------
// Projection (spherical LCC, identical to d3-geo's geoConicConformal with PROJ,
// center [0, 0]; the parallels are both south, so the cone's n < 0)
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
export const project = (lon: number, lat: number): P2 => {
  const p = rawLcc((lon + PROJ.rotate[0]) * RAD, lat * RAD);
  return [PROJ.translate[0] + PROJ.scale * (p[0] - C0[0]), PROJ.translate[1] - PROJ.scale * (p[1] - C0[1])];
};
/** the world the static map is baked over (the far level's rect) */
export const WORLD = { x0: LEVELS[0].x0, y0: LEVELS[0].y0, x1: LEVELS[0].x0 + LEVELS[0].w, y1: LEVELS[0].y0 + LEVELS[0].h };

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
/** the frame's world rect, grown by marginPx screen px */
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
/** the house hand on the camera (screen px) */
export const sway = (frame: number) => ({ dx: 3 * Math.sin(frame / 23), dy: 5 * Math.sin(frame / 19) });
export const swayCam = (cam: Cam, frame: number): Cam => {
  const s = sway(frame);
  return { k: cam.k, cx: cam.cx + s.dx / cam.k, cy: cam.cy + s.dy / cam.k };
};

/** monotone cubic (pchip) through keys [x, y]; heldEnds = zero end slopes,
 *  else one-sided end slopes (a track never starts or ends at rest) */
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
/** a camera key: world point (wx, wy) at screen (sx, sy) at zoom k on frame f */
export type CamKey = { f: number; k: number; wx: number; wy: number; sx?: number; sy?: number };
export const makeCamera = (keys: CamKey[], heldEnds = false) => {
  const LK = pchip(
    keys.map((q) => [q.f, Math.log(q.k)] as [number, number]),
    heldEnds,
  );
  const CX = pchip(
    keys.map((q) => [q.f, q.wx - ((q.sx ?? SCREEN_CX) - SCREEN_CX) / q.k] as [number, number]),
    heldEnds,
  );
  const CY = pchip(
    keys.map((q) => [q.f, q.wy - ((q.sy ?? CONTENT_Y) - SCREEN_CY) / q.k] as [number, number]),
    heldEnds,
  );
  return (f: number): Cam => ({ k: Math.exp(LK(f)), cx: CX(f), cy: CY(f) });
};
/** [from, to, area, taper]: a cosine-tapered velocity bump (taper 1 = a full
 *  raised cosine) whose integral is `area` */
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
/** a channel as the integral of overlapping velocity bumps: C1 end to end; value v0 at f = 0 */
export const makeTrack = (bumps: Bump[], v0: number, fLo = -80, fHi = 480, sub = 8) => {
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i <= (fHi - fLo) * sub; i++) {
    const f = fLo + i / sub;
    if (i > 0) {
      const fp = f - 1 / sub;
      const vA = bumps.reduce((s, bb) => s + bumpV(bb, fp), 0);
      const vB = bumps.reduce((s, bb) => s + bumpV(bb, f), 0);
      acc += ((vA + vB) / 2) * (1 / sub);
    }
    out.push(acc);
  }
  const at0 = out[(0 - fLo) * sub];
  const arr = out.map((x) => x - at0 + v0);
  return (f: number) => {
    const p = (f - fLo) * sub;
    const i = Math.max(0, Math.min(arr.length - 2, Math.floor(p)));
    const u = clamp01(p - i);
    return arr[i] + (arr[i + 1] - arr[i]) * u;
  };
};
/** max screen speed (px/f) and max |dv| (px/f^2) over frames f0..f1 of (a) a
 *  probe grid above the caption band, (b) each given world point (fixed in the
 *  world, so its screen motion is the camera's alone) */
export const camScan = (camAt: (f: number) => Cam, f0: number, f1: number, pts: P2[] = []) => {
  const probes: P2[] = [];
  for (let sy = 150; sy <= 1150; sy += 250) for (let sx = 60; sx <= 1020; sx += 240) probes.push([sx, sy]);
  const gridV = (f: number) =>
    probes.map(([sx, sy]) => {
      const w = worldOf([sx, sy], camAt(f));
      const [bx, by] = screenOf(w, camAt(f + 1));
      return [bx - sx, by - sy] as P2;
    });
  const ptV = (f: number) =>
    pts.map((p) => {
      const a = screenOf(p, camAt(f));
      const b = screenOf(p, camAt(f + 1));
      return [b[0] - a[0], b[1] - a[1]] as P2;
    });
  const out = { gridMaxV: 0, gridMaxVf: f0, gridMaxDv: 0, gridMaxDvf: f0, pts: pts.map(() => ({ maxV: 0, maxVf: f0, maxDv: 0, maxDvf: f0 })) };
  let pg = gridV(f0);
  let pp = ptV(f0);
  for (let f = f0 + 1; f < f1; f++) {
    const g = gridV(f);
    g.forEach(([x, y], i) => {
      const s = Math.hypot(x, y);
      if (s > out.gridMaxV) [out.gridMaxV, out.gridMaxVf] = [s, f];
      const dv = Math.hypot(x - pg[i][0], y - pg[i][1]);
      if (dv > out.gridMaxDv) [out.gridMaxDv, out.gridMaxDvf] = [dv, f];
    });
    const q = ptV(f);
    q.forEach(([x, y], i) => {
      const o = out.pts[i];
      const s = Math.hypot(x, y);
      if (s > o.maxV) [o.maxV, o.maxVf] = [s, f];
      const dv = Math.hypot(x - pp[i][0], y - pp[i][1]);
      if (dv > o.maxDv) [o.maxDv, o.maxDvf] = [dv, f];
    });
    pg = g;
    pp = q;
  }
  return out;
};

// ---------------------------------------------------------------------------
// PAPER: world-space mottle (octaves: the stains keep ~ the same screen size
// through a zoom, the next octave fading in), screen grain + vignette on top
// ---------------------------------------------------------------------------
const MOTTLE_SRC = "manchuria/mottle.png";
const GRAIN_SRC = "manchuria/grain.png";
/** the world-space mottle under the camera (any frame: realm px or plan metres) */
export const Mottle: React.FC<{ cam: Cam; opacity?: number; tile?: number }> = ({ cam, opacity = 0.9, tile = 640 }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const v = viewRect(cam, 24);
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const mt: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = tile / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const oxS = (ox / 640) * S;
    const oyS = (oy / 640) * S;
    const x0 = Math.floor((v.x0 - oxS) / S) * S + oxS;
    const y0 = Math.floor((v.y0 - oyS) / S) * S + oyS;
    for (let y = y0; y < v.y1; y += S) for (let x = x0; x < v.x1; x += S) mt.push({ x, y, s: S, o: op });
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: FRAME_W,
        height: FRAME_H,
        transformOrigin: "0 0",
        transform: `translate(${tx}px, ${ty}px) scale(${k})`,
        opacity,
      }}
    >
      {mt.map((t, i) => (
        <Img
          key={`m-${i}`}
          src={staticFile(MOTTLE_SRC)}
          style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
        />
      ))}
    </div>
  );
};
/** screen-space paper: grain, then the soft vignette (draw it last) */
export const PaperTop: React.FC<{ vignette?: number; grainOpacity?: number }> = ({ vignette = 0.55, grainOpacity = 1 }) => (
  <>
    <Img src={staticFile(GRAIN_SRC)} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: grainOpacity }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(
          3,
        )}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
      }}
    />
  </>
);

// ---------------------------------------------------------------------------
// THE REALM MAP: LOD tiles (incaLevels.ts) + mottle
// ---------------------------------------------------------------------------
const COVER_FADE = 48; // screen px: a level fades out as the frame's edge nears its rect's
/** each level's opacity for this camera: its k band x how far the frame lies inside its rect */
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
/** the level that dominates this camera's frame and its sharpness (texels per
 *  screen px; >= ~0.95 is sharp) */
export const mapSharpness = (cam: Cam) => {
  const w = levelWeights(cam);
  let top = 0;
  for (let i = 0; i < w.length; i++) if (w[i] >= 0.5) top = i;
  return { level: LEVELS[top].name, weight: w[top], texelsPerPx: LEVELS[top].s / cam.k, weights: w };
};
/** the baked realm map under the camera (no grain / vignette: see PaperTop) */
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number }> = ({ cam, mottleOpacity = 0.9 }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  const layers = LEVELS.map((L, li) => {
    if (w[li] <= 0.001) return null;
    // hidden under an opaque level above (an opaque weight implies full cover)
    if (w.some((o, j) => j > li && o >= 0.999)) return null;
    const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
    return (
      <div key={L.name} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: w[li] }}>
        {tiles.map((t) => (
          <Img
            key={t.f}
            src={staticFile(`inca/${t.f}`)}
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
  return (
    <>
      {layers}
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
/** a full-frame svg whose children draw in world units under the camera */
export const WorldSvg: React.FC<{ cam: Cam; children?: React.ReactNode }> = ({ cam, children }) => (
  <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
    <g transform={camTransform(cam).svg}>{children}</g>
  </svg>
);

// ---------------------------------------------------------------------------
// Land round Tumbes (a bitmask baked by the build: 6 cells / world px over
// lon -81.6 ... -79.4, lat -2.9 ... -5.6)
// ---------------------------------------------------------------------------
type Mask = { x0: number; y0: number; s: number; w: number; h: number; b64: string };
const MASK = (() => {
  const m = LAND_MASK_TUMBES as Mask;
  const bin = atob(m.b64);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return { m, bits: a };
})();
/** is the world point on land (Natural Earth 10m)? false outside the Tumbes mask */
export const landAt = (x: number, y: number) => {
  const { m, bits } = MASK;
  const i = Math.floor((x - m.x0) * m.s);
  const j = Math.floor((y - m.y0) * m.s);
  if (i < 0 || j < 0 || i >= m.w || j >= m.h) return false;
  const q = j * m.w + i;
  return ((bits[q >> 3] >> (q & 7)) & 1) === 1;
};

// ---------------------------------------------------------------------------
// THE REALM (Tawantinsuyu, 1525-32): the wash and the dashed land border
// ---------------------------------------------------------------------------
/** the loop arclength of the REALM_LOOP point nearest p */
export const realmLoopS = (p: P2) => {
  const L = REALM_LOOP as P2[];
  let best = Infinity;
  let at = 0;
  let acc = 0;
  for (let i = 1; i < L.length; i++) {
    const [ax, ay] = L[i - 1];
    const [bx, by] = L[i];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-12;
    const t = clamp01(((p[0] - ax) * dx + (p[1] - ay) * dy) / l2);
    const d = Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy);
    const seg = Math.sqrt(l2);
    if (d < best) [best, at] = [d, acc + t * seg];
    acc += seg;
  }
  return at;
};
/** the faint cream wash inside the realm */
export const RealmWash: React.FC<{ cam: Cam; opacity?: number }> = ({ opacity = 0.05 }) =>
  opacity > 0.001 ? <path d={REALM_D} fillRule="evenodd" fill={INK} fillOpacity={opacity} /> : null;

const BORDER_DASH = 11; // screen px dash period at the bottom of an octave (58 % on)
/** world-anchored dashes that keep ~DASH..2 DASH px on screen: two octaves crossfaded */
export const octaveDashes = (k: number, dash = BORDER_DASH) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = dash / Math.pow(2, o);
  return [
    { d: a, op: 1 - t },
    { d: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
export type RealmWave = { from: number; to?: number; progress: number; soft?: number };
/** how lit (0..1) loop arclength s is by the wave: two fronts leave `from`
 *  both ways round the loop and meet at `to` at progress 1 (each front covers
 *  its own arc in progress 0..1); `soft` = the front's width as a fraction of
 *  each arc */
export const waveLit = (s: number, w: RealmWave) => {
  const L = REALM_LOOP_LEN;
  const mod = (v: number) => ((v % L) + L) % L;
  const to = w.to ?? w.from + L / 2;
  const dA = mod(to - w.from) || L / 2; // the arc in +s
  const dB = L - dA; // the arc in -s
  const soft = w.soft ?? 0.14;
  const a = mod(s - w.from);
  const b = mod(w.from - s);
  const sA = soft * dA;
  const sB = soft * dB;
  const litA = smoothstep((w.progress * (dA + sA) - a) / sA);
  const litB = smoothstep((w.progress * (dB + sB) - b) / sB);
  return Math.max(a <= dA ? litA : 0, b <= dB ? litB : 0);
};
const CHUNK = 5; // world px: the border is cut into chunks this long while a wave runs
/** the border drawn whole from the same points as the chunks (so the dashes never jump when a wave starts or ends) */
const BORDER_RUN_D = REALM_BORDER_RUNS.map((r) => dOf(r.pts as P2[])).join("");
const BORDER_CHUNKS = (() => {
  const out: { d: string; s: number; a0: number }[] = [];
  for (const run of REALM_BORDER_RUNS) {
    const pts = run.pts as P2[];
    const ss = run.s;
    let acc = 0;
    let cur: P2[] = [pts[0]];
    let a0 = 0;
    let s0 = ss[0];
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      acc += seg;
      cur.push(pts[i]);
      if (acc - a0 >= CHUNK || i === pts.length - 1) {
        out.push({ d: dOf(cur), s: (s0 + ss[i]) / 2, a0 });
        cur = [pts[i]];
        a0 = acc;
        s0 = ss[i];
      }
    }
  }
  return out;
})();
/** the realm's land border: fine dashed cream (1.7 px, world-anchored octave
 *  dashes); rung = INK_CONTEXT .. INK_FULL by level (0..1); a wave brightens
 *  it to the full rung where its fronts have passed */
export const RealmBorder: React.FC<{ cam: Cam; level?: number; wave?: RealmWave; width?: number; opacity?: number }> = ({
  cam,
  level = 0,
  wave,
  width = 1.7,
  opacity = 1,
}) => {
  if (opacity <= 0.002) return null;
  const k = cam.k;
  const dashes = octaveDashes(k);
  const rung = (lv: number) => (INK_CONTEXT + (INK_FULL - INK_CONTEXT) * clamp01(lv)) * opacity;
  const sw = width / k;
  const uniform = !wave || wave.progress <= 0 || wave.progress >= 1;
  if (uniform) {
    const lv = wave && wave.progress >= 1 ? 1 : level;
    return (
      <g fill="none" strokeLinecap="butt">
        {dashes.map((d) => (
          <path key={`b-${d.d}`} d={BORDER_RUN_D} stroke={INK} strokeOpacity={rung(lv) * d.op} strokeWidth={sw} strokeDasharray={`${d.d * 0.58} ${d.d * 0.42}`} />
        ))}
      </g>
    );
  }
  return (
    <g fill="none" strokeLinecap="butt">
      {BORDER_CHUNKS.map((c, i) => {
        const lv = Math.max(level, waveLit(c.s, wave));
        return dashes.map((d) => (
          <path
            key={`c-${i}-${d.d}`}
            d={c.d}
            stroke={INK}
            strokeOpacity={rung(lv) * d.op}
            strokeWidth={sw}
            strokeDasharray={`${d.d * 0.58} ${d.d * 0.42}`}
            strokeDashoffset={c.a0 % d.d}
          />
        ));
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Routes
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
export const makeRoute = (data: RouteData): Route => {
  const pts = data.pts as P2[];
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
  const tStep = Math.max(1e-3, len / 400);
  const tangentAt = (s: number): P2 => {
    const a = pointAt(Math.max(0, s - tStep));
    const b = pointAt(Math.min(len, s + tStep));
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
  return {
    pts,
    cum,
    len,
    wpS: data.wpS,
    d: dOf(pts),
    pointAt,
    tangentAt,
    partialPath,
    partialD: (s0, s1) => dOf(partialPath(s0, s1)),
  };
};
/** Pizarro's march, 1532 (world px): LANDING -> Tumbes -> Poechos -> San Miguel
 *  -> ... -> Cajamarca; wpS[i] is the arclength of PIZARRO_1532_STOPS[i] */
export const PIZARRO_1532 = makeRoute(PIZARRO_1532_DATA);
/** the causeway from the plaza to Atahualpa's camp (local metres) */
export const ROAD_TO_CAMP = makeRoute(ROAD_TO_CAMP_DATA);
/** a route drawn as a cased line (widths in screen px), between arclengths s0 and s1 */
export const RouteLine: React.FC<{
  route: Route;
  cam: Cam;
  s0?: number;
  s1?: number;
  width?: number;
  color?: string;
  opacity?: number;
  casing?: number;
  dash?: number;
}> = ({ route, cam, s0 = 0, s1, width = 2, color = INK, opacity = INK_CONTEXT, casing = 2.6, dash }) => {
  if (opacity <= 0.002) return null;
  const d = route.partialD(s0, s1 ?? route.len);
  const k = cam.k;
  const da = dash ? `${(dash * 0.58) / k} ${(dash * 0.42) / k}` : undefined;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      {casing > 0 ? <path d={d} stroke={DARK} strokeOpacity={0.6} strokeWidth={(width + casing) / k} strokeDasharray={da} /> : null}
      <path d={d} stroke={color} strokeWidth={width / k} strokeDasharray={da} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// The crowds
// ---------------------------------------------------------------------------
/** the realm map's crowd dot: 3.75 screen px radius at k 16 (world-sized),
 *  never under 1.6 screen px (a crowd stays a speck in the realm wide) */
export const DOT_R_WORLD = 3.75 / 16;
export const dotRadius = (k: number) => Math.max(DOT_R_WORLD, 1.6 / k);
export type CrowdDot = { x: number; y: number; t: number; op?: number; r?: number };
/** crowd dots: the dark casings of all first, then the fills (cream -> orange
 *  by t), so overlapping dots in wide shots read as one blob with one outline.
 *  r (per dot or the default dotRadius(k)) in world units */
export const CrowdDots: React.FC<{ dots: CrowdDot[]; cam: Cam; casing?: number; radius?: number }> = ({ dots, cam, casing = 1.6, radius }) => {
  const r = radius ?? dotRadius(cam.k);
  const cw = Math.min(casing, 0.32 * r * cam.k) / cam.k; // casing width (screen px, thinner on tiny dots), in world units
  return (
    <g>
      {dots.map((d, i) =>
        (d.op ?? 1) > 0.002 ? <circle key={`c${i}`} cx={d.x} cy={d.y} r={(d.r ?? r) + cw / 2} fill={DARK} fillOpacity={0.62 * (d.op ?? 1)} /> : null,
      )}
      {dots.map((d, i) =>
        (d.op ?? 1) > 0.002 ? (
          <circle key={`f${i}`} cx={d.x} cy={d.y} r={(d.r ?? r) - cw / 2} fill={mixColor(INK, ACCENT, d.t)} fillOpacity={d.op ?? 1} />
        ) : null,
      )}
    </g>
  );
};

/** even-odd point-in-polygon over rings (outer + holes) */
export const pointInPoly = (rings: P2[][], x: number, y: number) => {
  let c = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  }
  return c;
};
/** n even blue-noise points filling a polygon (P2[] or rings P2[][], even-odd):
 *  Mitchell's best candidate on a grid, then a few relaxation passes that push
 *  pairs apart to the target spacing (default: the hex spacing of n points in
 *  the polygon's area; `spacing` caps it), every point kept inside. Organic and
 *  even: never a lattice, never strings. Deterministic in `seed`. */
export const packCrowd = (poly: P2[] | P2[][], n: number, spacing?: number, seed = 1): P2[] => {
  const rings: P2[][] = Array.isArray((poly as P2[][])[0][0]) ? (poly as P2[][]) : [poly as P2[]];
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of rings[0]) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const ringArea = (r: P2[]) => {
    let a = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
    return Math.abs(a / 2);
  };
  const area = ringArea(rings[0]) - rings.slice(1).reduce((s, r) => s + ringArea(r), 0);
  const natural = Math.sqrt(area / (n * 0.866));
  const target = Math.min(spacing ?? natural, natural) * 0.97;
  const rand = makeRng(seed * 7919 + 17);
  const inside = (x: number, y: number) => pointInPoly(rings, x, y);
  const cell = natural;
  const GW = Math.max(1, Math.ceil((x1 - x0) / cell));
  const GH = Math.max(1, Math.ceil((y1 - y0) / cell));
  const grid: number[][] = Array.from({ length: GW * GH }, () => []);
  const cellOf = (x: number, y: number) => {
    const i = Math.max(0, Math.min(GW - 1, Math.floor((x - x0) / cell)));
    const j = Math.max(0, Math.min(GH - 1, Math.floor((y - y0) / cell)));
    return j * GW + i;
  };
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const nearest = (x: number, y: number, count: number) => {
    const i0 = Math.floor((x - x0) / cell);
    const j0 = Math.floor((y - y0) / cell);
    let best = Infinity;
    for (let ring = 0; ring <= 3; ring++) {
      for (let j = j0 - ring; j <= j0 + ring; j++)
        for (let i = i0 - ring; i <= i0 + ring; i++) {
          if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== ring) continue;
          if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
          for (const q of grid[j * GW + i]) {
            if (q >= count) continue;
            const d = Math.hypot(xs[q] - x, ys[q] - y);
            if (d < best) best = d;
          }
        }
      if (best <= ring * cell) break;
    }
    return best;
  };
  const K = 14;
  for (let p = 0; p < n; p++) {
    let bx = 0;
    let by = 0;
    let bd = -1;
    for (let c = 0, tries = 0; c < K && tries < K * 40; tries++) {
      const x = x0 + rand() * (x1 - x0);
      const y = y0 + rand() * (y1 - y0);
      if (!inside(x, y)) continue;
      c++;
      const d = Math.min(nearest(x, y, p), 4 * cell);
      if (d > bd) [bd, bx, by] = [d, x, y];
    }
    xs[p] = bx;
    ys[p] = by;
    grid[cellOf(bx, by)].push(p);
  }
  // relaxation: push close pairs apart (Jacobi, grid neighbours), stay inside
  for (let it = 0; it < 10; it++) {
    const dx = new Float64Array(n);
    const dy = new Float64Array(n);
    for (let p = 0; p < n; p++) {
      const i0 = Math.floor((xs[p] - x0) / cell);
      const j0 = Math.floor((ys[p] - y0) / cell);
      for (let j = j0 - 1; j <= j0 + 1; j++)
        for (let i = i0 - 1; i <= i0 + 1; i++) {
          if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
          for (const q of grid[j * GW + i]) {
            if (q <= p) continue;
            const ex = xs[q] - xs[p];
            const ey = ys[q] - ys[p];
            const d = Math.hypot(ex, ey);
            if (d >= target || d < 1e-9) continue;
            const m = (0.5 * (target - d)) / d;
            dx[p] -= ex * m * 0.5;
            dy[p] -= ey * m * 0.5;
            dx[q] += ex * m * 0.5;
            dy[q] += ey * m * 0.5;
          }
        }
    }
    for (const g of grid) g.length = 0;
    for (let p = 0; p < n; p++) {
      const nx = xs[p] + dx[p];
      const ny = ys[p] + dy[p];
      if (inside(nx, ny)) [xs[p], ys[p]] = [nx, ny];
      else if (inside(xs[p] + dx[p] * 0.3, ys[p] + dy[p] * 0.3)) [xs[p], ys[p]] = [xs[p] + dx[p] * 0.3, ys[p] + dy[p] * 0.3];
      grid[cellOf(xs[p], ys[p])].push(p);
    }
  }
  return Array.from({ length: n }, (_, p) => [xs[p], ys[p]] as P2);
};

/** a dot layer for CanvasDots: positions as a flat [x0, y0, x1, y1, ...] in
 *  world units; r = the dot radius in SCREEN px; casing = a dark rim (screen px) */
export type DotLayer = { xy: ArrayLike<number>; r: number; color: string; opacity?: number; casing?: number };
/** tens of thousands of dots on one canvas (deterministic; drawn in a layout
 *  effect each frame). Each layer is one path per pass (casing, fill); dots
 *  under 0.9 px radius are drawn as squares of the same area (equivalent at
 *  that size, and much faster); dots off the frame are culled. */
export const CanvasDots: React.FC<{ cam: Cam; layers: DotLayer[] }> = ({ cam, layers }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    const { k } = cam;
    const tx = SCREEN_CX - cam.cx * k;
    const ty = SCREEN_CY - cam.cy * k;
    for (const L of layers) {
      const op = L.opacity ?? 1;
      if (op <= 0.002 || L.r <= 0) continue;
      const xy = L.xy;
      const n = xy.length >> 1;
      const pass = (rad: number, style: string, alpha: number) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = style;
        const m = rad + 1;
        if (rad < 0.9) {
          const side = rad * 1.7725; // a square of the disc's area
          const h = side / 2;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const sx = tx + xy[2 * i] * k;
            const sy = ty + xy[2 * i + 1] * k;
            if (sx < -m || sy < -m || sx > FRAME_W + m || sy > FRAME_H + m) continue;
            ctx.rect(sx - h, sy - h, side, side);
          }
          ctx.fill();
          return;
        }
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const sx = tx + xy[2 * i] * k;
          const sy = ty + xy[2 * i + 1] * k;
          if (sx < -m || sy < -m || sx > FRAME_W + m || sy > FRAME_H + m) continue;
          ctx.moveTo(sx + rad, sy);
          ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        }
        ctx.fill();
      };
      const cs = L.casing ?? 0;
      if (cs > 0) pass(L.r + cs / 2, DARK, 0.62 * op);
      pass(cs > 0 ? Math.max(0.3, L.r - cs / 2) : L.r, L.color, op);
    }
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />;
};

// ---------------------------------------------------------------------------
// GLYPHS. One engraved stroke family: cream ink, DARK casings / hatching.
// ---------------------------------------------------------------------------
/** a small cream city dot */
export const CityDot: React.FC<{ x: number; y: number; cam: Cam; r?: number; opacity?: number }> = ({ x, y, cam, r = 5.5, opacity = 1 }) =>
  opacity > 0.002 ? (
    <circle cx={x} cy={y} r={r / cam.k} fill={INK} fillOpacity={INK_FULL * opacity} stroke={DARK} strokeOpacity={0.65 * opacity} strokeWidth={1.8 / cam.k} />
  ) : null;

// THE CARRACK (cortesShared's), in profile facing west (bow left), in a
// 100-unit frame: x 0 (bow) .. 100 (stern), the waterline y 0, up negative.
const C_HULL =
  "M7,-15 L23,-14.5 L24.5,-10.5 L47,-8.6 L64,-10.4 L65.5,-17 L88,-21 L95.5,-21.5 L95,-17 L92.5,-6 L89,1.2 C78,5.4 60,6.6 40,6 C26,5.6 15,3.6 11,0.2 L8.4,-6 Z";
const C_CASTLES = "M7,-15 L7.6,-18.6 L22.6,-17.9 L23,-14.5 M65.5,-17 L66,-21.6 L88.6,-25.4 L95.7,-25.6 L95.5,-21.5";
const C_PLANKS = "M10.2,-4.2 C30,-1.6 60,-2.2 91.2,-9.6 M9.4,-9.6 C28,-6.6 58,-6.2 93.6,-14.4 M67,-19.6 L93.4,-23.6";
const C_MASTS = "M20,-14.8 L20,-55 M45,-8.8 L45,-80 M74,-18.5 L74,-56";
const C_BOWSPRIT = "M8.6,-15.6 L-6.5,-25.5";
const C_FORE = "M9.6,-49 L30.4,-49 C31.8,-41 31.6,-30 29.4,-21.5 C24,-19.8 16.4,-19.8 11.2,-21.5 C9,-30 8.6,-41 9.6,-49 Z";
const C_MAIN = "M31.6,-62 L58.4,-62 C60.2,-51 60,-38 57.4,-26.5 C50.6,-24.4 39.6,-24.4 32.8,-26.5 C30,-38 29.8,-51 31.6,-62 Z";
const C_MAIN_TOP = "M36.4,-77 L53.6,-77 C54.6,-72.4 54.4,-68.2 53,-64.4 C48.6,-63.4 41.4,-63.4 37,-64.4 C35.6,-68.2 35.4,-72.4 36.4,-77 Z";
const C_TOP = "M41.4,-63.8 L48.6,-63.8 L47.8,-60.6 L42.2,-60.6 Z";
const C_YARDS = "M8,-49.6 L32,-49.6 M30,-62.6 L60,-62.6 M35,-77.6 L55,-77.6";
const C_MIZZEN = "M61.5,-21.8 L91.5,-60.5 C90.6,-48 89.2,-35 86.4,-24.2 C78,-22.6 69,-22.2 61.5,-21.8 Z";
const C_MIZZEN_YARD = "M59.6,-19.4 L93.4,-63";
const C_PENNANT = "M45,-80 C38,-81.6 33,-79.2 26.5,-80.4 C31.6,-78.8 37.6,-78.6 45,-77.4";
const C_HATCH =
  "M55.6,-58.5 L55.2,-31.5 M52.6,-59.5 L52.4,-35 M28.4,-46 L28,-26 M26,-46.5 L25.8,-31 M51.6,-74.2 L51.2,-67.2 M86.8,-50 L84.6,-27.6 M84,-44.8 L82.2,-26.4";
/** a 16th-century carrack; (x, y) = the waterline under its middle; facing
 *  "west" (bow left, the drawing's own) or "east" (mirrored) */
export const Carrack: React.FC<{
  x: number;
  y: number;
  cam: Cam;
  frame: number;
  size?: number;
  seed?: number;
  hollow?: boolean;
  facing?: "west" | "east";
  opacity?: number;
  pitch?: number;
  wake?: number;
  rock?: number;
}> = ({ x, y, cam, frame, size = 84, seed = 1, hollow = false, facing = "west", opacity = 1, pitch = 0, wake = 1, rock: rockAmp = 1.6 }) => {
  if (opacity <= 0.002) return null;
  const u = size / 100 / cam.k; // world units per glyph unit
  const ph1 = 6.283 * hash(seed, 3);
  const ph2 = 6.283 * hash(seed, 4);
  const bob = 1.1 * Math.sin(frame * (0.105 + 0.02 * hash(seed, 5)) + ph1); // glyph units
  const rock = rockAmp * Math.sin(frame * (0.083 + 0.015 * hash(seed, 6)) + ph2) + pitch; // degrees
  const sw = 1 / (size / 100); // 1 screen px in glyph units
  const fill = hollow ? "none" : INK;
  const fo = hollow ? 0 : INK_FULL;
  const line = hollow ? ACCENT : INK;
  // the wake: four dashes astern on the waterline, drifting aft and fading out
  const wakeEls: React.ReactNode[] = [];
  if (wake > 0.01) {
    const phase = (((frame * 0.09 + hash(seed, 7)) % 1) + 1) % 1;
    for (let i = 0; i < 4; i++) {
      const q = i + phase; // 0..4
      const a = (1 - q / 4) * Math.min(1, q * 1.6) * wake;
      if (a <= 0.01) continue;
      const x0 = 98 + q * 11;
      const L = 8.5 - q * 1.1;
      wakeEls.push(
        <line key={`w${i}`} x1={x0} y1={1.4 + q * 0.5} x2={x0 + L} y2={1.4 + q * 0.5} stroke={INK} strokeOpacity={0.75 * a} strokeWidth={2.2 * sw} strokeLinecap="round" />,
      );
    }
  }
  const sx = facing === "east" ? -u : u;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${sx} ${u}) translate(0 ${bob.toFixed(3)}) rotate(${rock.toFixed(3)}) translate(-50 0)`}>
      {wakeEls}
      <g strokeLinejoin="round" strokeLinecap="round">
        {/* dark casing under everything, so the glyph reads on land and sea */}
        {!hollow ? (
          <g fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={3.4 * sw}>
            <path d={C_MASTS} />
            <path d={C_BOWSPRIT} />
            <path d={C_MIZZEN_YARD} />
            <path d={C_FORE} />
            <path d={C_MAIN} />
            <path d={C_MAIN_TOP} />
            <path d={C_MIZZEN} />
            <path d={C_HULL} />
            <path d={C_CASTLES} />
            <path d={C_PENNANT} />
          </g>
        ) : null}
        <path d={C_MASTS} fill="none" stroke={line} strokeWidth={2 * sw} />
        <path d={C_BOWSPRIT} fill="none" stroke={line} strokeWidth={1.8 * sw} />
        <path d={C_MIZZEN_YARD} fill="none" stroke={line} strokeWidth={1.6 * sw} />
        <path d={C_YARDS} fill="none" stroke={line} strokeWidth={1.6 * sw} />
        <path d={C_FORE} fill={fill} fillOpacity={fo} stroke={hollow ? ACCENT : DARK} strokeOpacity={hollow ? 1 : 0.55} strokeWidth={(hollow ? 1.7 : 0.9) * sw} />
        <path d={C_MAIN} fill={fill} fillOpacity={fo} stroke={hollow ? ACCENT : DARK} strokeOpacity={hollow ? 1 : 0.55} strokeWidth={(hollow ? 1.7 : 0.9) * sw} />
        <path d={C_MAIN_TOP} fill={fill} fillOpacity={fo} stroke={hollow ? ACCENT : DARK} strokeOpacity={hollow ? 1 : 0.55} strokeWidth={(hollow ? 1.7 : 0.9) * sw} />
        <path d={C_MIZZEN} fill={fill} fillOpacity={fo} stroke={hollow ? ACCENT : DARK} strokeOpacity={hollow ? 1 : 0.55} strokeWidth={(hollow ? 1.7 : 0.9) * sw} />
        <path d={C_TOP} fill={fill} fillOpacity={fo} stroke={hollow ? ACCENT : DARK} strokeOpacity={hollow ? 1 : 0.55} strokeWidth={(hollow ? 1.4 : 0.8) * sw} />
        <path d={C_PENNANT} fill={hollow ? "none" : INK} fillOpacity={fo} stroke={hollow ? ACCENT : "none"} strokeWidth={1.4 * sw} />
        <path d={C_HULL} fill={fill} fillOpacity={fo} stroke={hollow ? ACCENT : DARK} strokeOpacity={hollow ? 1 : 0.55} strokeWidth={(hollow ? 1.8 : 0.9) * sw} />
        <path d={C_CASTLES} fill="none" stroke={hollow ? ACCENT : INK} strokeOpacity={hollow ? 1 : INK_FULL} strokeWidth={(hollow ? 1.6 : 1.8) * sw} />
        {/* engraved hatching: planks along the sheer, shade on the sails' lee side */}
        {!hollow ? (
          <g fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={0.95 * sw}>
            <path d={C_PLANKS} />
            <path d={C_HATCH} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// LABELS
// ---------------------------------------------------------------------------
export const LABEL_TRAVEL = 24;
export const LABEL_FRAMES = 14;
export const LABEL_FADE = 9;
/** the house label entrance: slides up 24 px while fading in from f0 */
export const labelSlide = (frame: number, f0: number, frames = LABEL_FRAMES, fade = LABEL_FADE) => ({
  dy: interpolate(frame, [f0, f0 + frames], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...CLAMP }),
  op: interpolate(frame, [f0, f0 + fade], [0, 1], CLAMP),
});
/** IM Fell English SC spaced caps anchored to world point (x, y) + a screen
 *  offset (dx, dy); screen-sized (size px, >= 36); its own full-frame svg */
export const MapLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  cam: Cam;
  frame: number;
  f0: number;
  size?: number;
  spacing?: number;
  anchor?: "start" | "middle" | "end";
  dx?: number;
  dy?: number;
  color?: string;
  opacity?: number;
}> = ({ text, x, y, cam, frame, f0, size = 40, spacing = 0.32, anchor = "middle", dx = 0, dy = 0, color = INK, opacity = INK_FULL }) => {
  const sl = labelSlide(frame, f0);
  if (sl.op * opacity <= 0.002) return null;
  const sz = Math.max(36, size);
  const [sx, sy] = screenOf([x, y], cam);
  // letter-spacing trails the last glyph: shift so the ink is centred / flush
  const trail = sz * spacing;
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
        strokeWidth={sz * 0.11}
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: sz, letterSpacing: sz * spacing }}
      >
        {text}
      </text>
    </svg>
  );
};
/** a numeral (or any short roman text) in IM Fell English roman, cream,
 *  anchored to world point (x, y) + a screen offset; its baseline at the
 *  anchor; the house slide-up entrance (24 px, `frames`, fading over `fade`) */
export const NumeralLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  cam: Cam;
  frame: number;
  f0: number;
  size?: number;
  dx?: number;
  dy?: number;
  frames?: number;
  fade?: number;
  color?: string;
  opacity?: number;
}> = ({ text, x, y, cam, frame, f0, size = 110, dx = 0, dy = 0, frames = 14, fade = 12, color = INK, opacity = INK_FULL }) => {
  const sl = labelSlide(frame, f0, frames, fade);
  if (sl.op * opacity <= 0.002) return null;
  const [sx, sy] = screenOf([x, y], cam);
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + dx}
        y={sy + dy + sl.dy}
        textAnchor="middle"
        opacity={sl.op * opacity}
        fill={color}
        stroke={SEA}
        strokeOpacity={0.5}
        strokeWidth={size * 0.07}
        paintOrder="stroke"
        style={{ fontFamily: fell, fontSize: size }}
      >
        {text}
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// THE CAJAMARCA LOCAL PLAN (metres; x east, y south; origin the plaza centroid)
// ---------------------------------------------------------------------------
/** local metres of a lon/lat (a tangent plane on the plaza centroid, WGS84 radii) */
export const localOf = (lon: number, lat: number): P2 => [(lon - LOCAL.lon0) * LOCAL.mPerDegLon, -(lat - LOCAL.lat0) * LOCAL.mPerDegLat];
export const lonLatOfLocal = (x: number, y: number): P2 => [LOCAL.lon0 + x / LOCAL.mPerDegLon, LOCAL.lat0 - y / LOCAL.mPerDegLat];
/** the umber page of the local plan: land, world-space mottle (octaves by k:
 *  reads right from k 0.08 to k 6), children, then grain + vignette */
export const PlanPage: React.FC<{ cam: Cam; vignette?: number; mottleOpacity?: number; children?: React.ReactNode }> = ({
  cam,
  vignette,
  mottleOpacity = 0.9,
  children,
}) => (
  <AbsoluteFill style={{ backgroundColor: LAND }}>
    <Mottle cam={cam} opacity={mottleOpacity} />
    {children}
    <PaperTop vignette={vignette} />
  </AbsoluteFill>
);

// THE PLAZA OF CAJAMARCA, 16 Nov 1532 (local metres): a SCHEMATIC from the
// texts (FACTS.md section 3; the build's PLAZA comment lists what is sourced
// and what is a neutral choice). An equilateral triangle, side 200 m, its
// "fortress" corner pointing at the camp (bearing 95.6 deg: "towards the open
// country"); three halls (150 x 12 m, 20 doorways each on the square); two
// gates (the NW and SW corners, onto the town); the ushnu platform (12 m) in
// the fortress corner with its stair on the square; the small door beside it.
//   PLAZA.enclosure    the wall's triangle [fortress corner, NW, SW]
//   PLAZA.corners      { fortress, northwest, southwest }
//   PLAZA.wallRuns     the wall as polylines, the openings left open
//   PLAZA.halls[]      { name ("northeast" | "west" | "southeast"), rect [back0,
//                      back1, front1, front0], back, front (the doorway line),
//                      centre, along (unit, back0 -> back1), toSquare (unit
//                      normal from the hall into the square), len, depth,
//                      doorways[] { p (on the front line), n (= toSquare), w } }
//   PLAZA.gates[]      { name, a, b (the opening's ends on the wall), p (its
//                      middle), n (unit, outward to the street), w }
//   PLAZA.smallDoor    the same shape (the small door to the open country)
//   PLAZA.fortress     { rect, centre, toSquare, size, stair: { rect, treads,
//                      foot (on the square), top (on the platform), w } }
//   PLAZA.interior     the open square for a crowd: rings (outer first),
//                      inside the wall, clear of the halls (0.6 m), the
//                      platform (1 m) and its stair; PLAZA.interiorArea (m^2)
export const PLAZA = PLAZA_DATA;
/** the plaza as an engraved plan in cream line (local metres under the camera;
 *  put it inside a WorldSvg): the wall (with its openings), the halls (dark
 *  roofs with a cream outline, the doorways open in their fronts), the ushnu
 *  platform with its stair. Line weights are screen px, thinning in wide shots */
export const PlazaPlan: React.FC<{ cam: Cam; opacity?: number; hallFill?: number; inkOpacity?: number }> = ({
  cam,
  opacity = 1,
  hallFill = 0.6,
  inkOpacity = INK_FULL,
}) => {
  if (opacity <= 0.002) return null;
  const k = cam.k;
  const lw = Math.max(0.8, Math.min(2.2, 2.2 * Math.pow(k / 4, 0.35))); // screen px
  const px = (v: number) => v / k;
  const doorsOpen = k >= 0.6; // a 3 m doorway is ~2 px at k 0.6
  const hallOutline = (h: Hall) => {
    // back + the two ends as one line; the front as segments between the doorways
    const [b0, b1, f1, f0] = h.rect as P2[];
    let d = `M${f0[0]},${f0[1]}L${b0[0]},${b0[1]}L${b1[0]},${b1[1]}L${f1[0]},${f1[1]}`;
    if (!doorsOpen) return `${d}Z`;
    const t = h.along as P2;
    const pts: P2[] = [f0];
    for (const dw of h.doorways) {
      pts.push([dw.p[0] - (t[0] * dw.w) / 2, dw.p[1] - (t[1] * dw.w) / 2]);
      pts.push([dw.p[0] + (t[0] * dw.w) / 2, dw.p[1] + (t[1] * dw.w) / 2]);
    }
    pts.push(f1);
    for (let i = 0; i + 1 < pts.length; i += 2) d += `M${pts[i][0]},${pts[i][1]}L${pts[i + 1][0]},${pts[i + 1][1]}`;
    return d;
  };
  const wallD = (PLAZA.wallRuns as P2[][]).map((r) => dOf(r)).join("");
  const fort = PLAZA.fortress;
  return (
    <g opacity={opacity} strokeLinejoin="round" strokeLinecap="butt">
      {/* the halls' roofs: dark, so men inside read as inside */}
      {(PLAZA.halls as Hall[]).map((h) => (
        <path key={`r-${h.name}`} d={dOf(h.rect as P2[], true)} fill={DARK} fillOpacity={hallFill} />
      ))}
      {/* the ushnu platform: a stone floor (a light ink fill) */}
      <path d={dOf(fort.rect as P2[], true)} fill={INK} fillOpacity={0.14} />
      {/* casings */}
      <g fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={px(lw + 2.2)}>
        <path d={wallD} />
        {(PLAZA.halls as Hall[]).map((h) => (
          <path key={`hc-${h.name}`} d={hallOutline(h)} />
        ))}
        <path d={dOf(fort.rect as P2[], true)} />
      </g>
      {/* the ink */}
      <g fill="none" stroke={INK} strokeOpacity={inkOpacity}>
        <path d={wallD} strokeWidth={px(lw)} />
        {(PLAZA.halls as Hall[]).map((h) => (
          <path key={`h-${h.name}`} d={hallOutline(h)} strokeWidth={px(lw * 0.8)} />
        ))}
        <path d={dOf(fort.rect as P2[], true)} strokeWidth={px(lw * 0.9)} />
        {k >= 0.8
          ? (fort.stair.treads as [P2, P2][]).map((t, i) => <path key={`t-${i}`} d={dOf(t)} strokeWidth={px(lw * 0.55)} />)
          : null}
      </g>
    </g>
  );
};
