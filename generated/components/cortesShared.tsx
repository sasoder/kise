// ---------------------------------------------------------------------------
// cortesShared: THE CORTES WORLD, shared read-only by every cut of the clip
// "Sheppard_Cortes_recruits_the_arrest_army" (Dwarkesh with Si Sheppard;
// Dwarkesh map style): SpanishDivided + GoingBeyondHisMission (cut 1),
// LargerForce (cut 2), EmpireAtMyDisposal (cut 3). Once SP/cortes/WORLD_READY.md
// exists the existing exports never change; additions only.
//
// THE WORLD. North-up Lambert conformal conic, parallels 17/23, centre meridian
// 87 W (d3 geoConicConformal().parallels([17, 23]).rotate([87, 0]); baked by
// scripts/build-cortes-map.mjs into cortesMapData.ts / cortesStatic.ts).
// k = 1 is the framing in which lon 100.5 W ... 73.5 W at lat 20 N spans the
// 1080 px width: world px == screen px at the k 1 GULF WIDE (camera
// { k: 1, cx: 540, cy: 960 }; lat 20 N meets x 0 and x 1080 on y 835).
// 0.383 world px per km. The static map (sea, 4 engraved water-lines, 5 deg
// graticule, land + #6A5838 rim, Lake Texcoco 1519, cream coast; NO borders, no
// modern lakes) is a tiled raster LOD pyramid (scripts/bake-cortes-rasters.mjs ->
// public/cortes/*.png, cortesLevels.ts):
//   far k<=0.88 | wide ~0.9-1.5 | stage 1.36-2.3 | mid 2.05-3.7 | near 3.3-5.0 |
//   close 4.6-7.2 | tight 6.6-11 (sharp to k 11 at Cempoala).
// Hold the camera OUTSIDE the crossfade bands (k 1.36-1.52, 2.05-2.3, 3.3-3.6,
// 4.6-5.0, 6.6-7.2): inside one two levels' water-lines ghost. Check a camera
// track with mapSharpness(cam) (>= ~0.95 texels per screen px = sharp).
//
// THE CAMERA. A camera is { k, cx, cy }: the world point (cx, cy) sits at the
// frame's centre (540, 960). screen = (540 + (x - cx) k, 960 + (y - cy) k).
// CAPTION-SAFE RULE: the subject of every framing sits near y 835 (CONTENT_Y):
// cy = subjectY + CAM_LIFT / k (CAM_LIFT 125); nothing important below y 1150.
//
// API (all world px unless noted)
//   palette: SEA LAND LAND_RIM INK ACCENT ACCENT_DEEP DARK; the two cream rungs
//     INK_FULL (in play) / INK_CONTEXT (~0.5, context). Orange = Cortes's side
//     ONLY (his men, his road, what he holds); everything else cream.
//   FRAME_W FRAME_H SCREEN_CX SCREEN_CY CONTENT_Y CAM_LIFT CAPTION_TOP FPS
//   project(lon, lat) -> [x, y]; PX_PER_KM; WORLD (the baked rect)
//   screenOf([x, y], cam) -> [sx, sy]; worldOf([sx, sy], cam) -> [x, y]
//   camFor([x, y], k, sx = 540, sy = CONTENT_Y) -> Cam (that point at that
//     screen point); viewRect(cam, marginPx) -> world rect of the frame
//   sway(frame) / swayCam(cam, frame): the house hand-held drift (3/5 screen px)
//   CAMERA RUNNERS (copied from erMotion / koreaShared):
//     pchip(keys, heldEnds?) monotone cubic, C1, no overshoot; open ends keep
//       their end slopes (a track never starts or ends at rest)
//     makeCamera(keys: CamKey[]) -> (f) => Cam. A key puts world point (wx, wy)
//       at screen (sx, sy) (default 540, CONTENT_Y) at zoom k on frame f; cx,
//       cy and ln k each run through pchip
//     makeTrack(bumps, v0) a channel as the integral of cosine-tapered velocity
//       bumps [from, to, area, taper] (C1 end to end)
//     camScan(camAt, f0, f1, pts?) -> max screen speed (px/f) and max |dv|
//       (px/f^2) of a probe grid above the caption band and of the given world
//       points (the "fixed world point" check)
//   MAP
//     <MapStack cam /> the baked map (LOD tiles, world-space mottle);
//     <PaperTop /> screen-space grain + vignette (put it LAST);
//     <MapPage cam>{children}</MapPage> = MapStack + children + PaperTop;
//     <WorldSvg cam>{...}</WorldSvg> a full-frame svg drawing its children in
//       world px under the camera; levelWeights(cam); mapSharpness(cam)
//   SITES.{santiago, caboSanAntonio, sanJuanDeUlua, cempoala, tenochtitlan}
//     { x, y, lon, lat }; <CityDot x y cam r? opacity? /> small cream dot
//   ROUTES (Route: pts, cum, len, wpS (arclength at each waypoint), d,
//     pointAt(s), tangentAt(s) (unit), partialPath(s0, s1) -> P2[],
//     partialD(s0, s1) -> svg d; s clamped to [0, len]):
//     NARVAEZ_VOYAGE (Santiago -> San Juan de Ulua; >= 5 km offshore except the
//       bay exit 13 km and the anchorage approach 9 km, asserted in the build),
//     NARVAEZ_VOYAGE_RIDE (CHANGED 2026-10-01: the path a ship glyph sails, one
//       smooth open-water B-spline: between Cuba and Jamaica, south of the
//       Caymans, through the Yucatan Channel, north of the Alacranes reef, into
//       the anchorage; a carrack 37.5 k^0.6 px long keeps >= 5 world px off
//       land between RIDE_CLEAR_S[0] and RIDE_CLEAR_S[1]; >= 105 km off Cuba),
//     NARVAEZ_LAND_LEG (Ulua -> Cempoala), NARVAEZ_FULL (the two joined; the
//       landing at NARVAEZ_FULL.wpS[19] == NARVAEZ_VOYAGE.len), CORTES_ROAD
//       (Cempoala -> Tenochtitlan, 13 waypoints; on land)
//   EMPIRE_D (evenodd fill, clipped to land, lake removed), EMPIRE_POLYS,
//     EMPIRE_BORDER_D (its border lines over land only, no coast),
//     LAKE_TEXCOCO (ring), LAKE_TEXCOCO_D; landAt(x, y) -> boolean
//   THE CEMPOALA CROWDS, 1 dot = 10 men; index i < N_CREAM (90) = Narvaez's
//     (cream), i >= N_CREAM = Cortes's 27 (orange); the same index is the same
//     dot in every layout: SPANISH_ONE (117, one even blue-noise crowd, its
//     east end on the coast, Cempoala at its seaward edge), CREAM_REST (90),
//     ORANGE_REST (27, inland/west, Cortes's road runs through it), FISSURE and
//     CHANNEL (N -> S lines: the split's fissure through SPANISH_ONE and the open
//     channel's centre line between the groups at rest), CROWD_CENTRE, CROWD_SLOT
//     (3.4, centre spacing), isOrange(i), restOf(i);
//     dotRadius(k) = max(DOT_R_WORLD 1.25, 2.5 / k): world size (20 px wide at
//     k 8), never under 2.5 screen px radius in wide shots;
//     <CrowdDots dots cam /> dots = { x, y, t (0 cream .. 1 orange), op? }[]:
//     dark casings first, fills on top (a clean blob outline when they overlap)
//   GLYPHS (sizes in screen px; one engraved stroke family, DARK casings):
//     <Carrack x y cam frame size? seed? hollow? opacity? pitch? wake? rock? /> a
//       16th-century carrack in profile facing WEST; (x, y) = the waterline
//       under its middle; filled cream with dark engraved hatching; hollow =
//       orange outline only; wake (0..1) = 4 cream dashes astern; a gentle
//       bob/pitch with hashed phase (seed); pitch = extra tilt in degrees;
//       rock = the rocking amplitude in degrees (default 1.6; added 2026-10-01)
//       Its box about (x, y), in units of size/100: x -56.5 (bowsprit) .. +46
//       (stern), y -81.6 (pennant) .. +6.6 (keel), before bob (+-1.1) and tilt
//     <Swords x y cam size? opacity? color? /> Lucide "swords", engraved cream
//     <Coin x y cam size? opacity? /> the house coin (Railways)
//     <HoldRing x y cam r? progress? opacity? /> thin orange ring round a city
//       dot = Cortes holds it (progress 0..1 draws it clockwise from the top)
//     <MapLabel text x y cam frame f0 size? spacing? anchor? dx? dy? opacity? />
//       IM Fell English SC spaced caps, cream, screen size (>= 36 px), anchored
//       to a world point (+ screen offset dx, dy); slides up 24 px while fading
//       in from f0 (start it ~8 f before its word); labelSlide(frame, f0)
//   maths: clamp01 smoothstep smootherstep hash mixColor
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import {
  CHANNEL,
  CORTES_ROAD_DATA,
  CREAM_REST,
  CROWD_CENTRE,
  CROWD_SLOT,
  DOT_R_WORLD,
  EMPIRE_BORDER_D,
  EMPIRE_D,
  EMPIRE_POLYS,
  FISSURE,
  LAKE_TEXCOCO,
  LAND_MASK_FINE,
  LAND_MASK_STAGE,
  NARVAEZ_LAND_LEG_DATA,
  NARVAEZ_VOYAGE_DATA,
  NARVAEZ_VOYAGE_RIDE_DATA,
  N_CREAM,
  N_ORANGE,
  ORANGE_REST,
  PROJ,
  PX_PER_KM,
  RIDE_CLEAR_S,
  SITES,
  SPANISH_ONE,
  type P2,
  type RouteData,
} from "./cortesMapData";
import { LEVELS } from "./cortesLevels";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export { fellSC };

export type { P2 };
export {
  CHANNEL,
  CREAM_REST,
  CROWD_CENTRE,
  CROWD_SLOT,
  DOT_R_WORLD,
  EMPIRE_BORDER_D,
  EMPIRE_D,
  EMPIRE_POLYS,
  FISSURE,
  LAKE_TEXCOCO,
  N_CREAM,
  N_ORANGE,
  ORANGE_REST,
  PX_PER_KM,
  RIDE_CLEAR_S,
  SITES,
  SPANISH_ONE,
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
// center [0, 0]; checked against the build's projected sites to 1e-3 px)
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
// THE MAP: LOD tiles (cortesLevels.ts), world-space mottle, paper on top
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
/** the baked map under the camera (no grain / vignette: see PaperTop) */
export const MapStack: React.FC<{ cam: Cam; mottleOpacity?: number; mottleSrc?: string }> = ({
  cam,
  mottleOpacity = 0.9,
  mottleSrc = "manchuria/mottle.png",
}) => {
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
            src={staticFile(`cortes/${t.f}`)}
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
  // mottle tiles, world space, in octaves (TroopsOutOfAsia / KoreaPage): stains
  // keep ~ the same screen size through a zoom, the next octave fading in
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
            src={staticFile(mottleSrc)}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>
    </>
  );
};
/** screen-space paper: grain, then the soft vignette (draw it last) */
export const PaperTop: React.FC<{ vignette?: number; grainOpacity?: number; grainSrc?: string }> = ({
  vignette = 0.55,
  grainOpacity = 1,
  grainSrc = "manchuria/grain.png",
}) => (
  <>
    <Img src={staticFile(grainSrc)} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: grainOpacity }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(
          3,
        )}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
      }}
    />
  </>
);
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
// Land (bitmasks baked by the build: the stage at 1 cell / world px, round
// Cempoala at 4 cells / world px)
// ---------------------------------------------------------------------------
type Mask = { x0: number; y0: number; s: number; w: number; h: number; b64: string };
const decode = (m: Mask) => {
  const bin = atob(m.b64);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
};
const MASKS = [LAND_MASK_FINE, LAND_MASK_STAGE].map((m) => ({ m: m as Mask, bits: decode(m as Mask) }));
/** is the world point on land (Natural Earth 10m)? false outside the stage */
export const landAt = (x: number, y: number) => {
  for (const { m, bits } of MASKS) {
    const i = Math.floor((x - m.x0) * m.s);
    const j = Math.floor((y - m.y0) * m.s);
    if (i < 0 || j < 0 || i >= m.w || j >= m.h) continue;
    const q = j * m.w + i;
    return ((bits[q >> 3] >> (q & 7)) & 1) === 1;
  }
  return false;
};
export const LAKE_TEXCOCO_D = dOf(LAKE_TEXCOCO as P2[], true);
export const isOrange = (i: number) => i >= N_CREAM;
/** dot i's rest position after the split */
export const restOf = (i: number): P2 => (i < N_CREAM ? (CREAM_REST[i] as P2) : (ORANGE_REST[i - N_CREAM] as P2));

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
export const NARVAEZ_VOYAGE = makeRoute(NARVAEZ_VOYAGE_DATA);
export const NARVAEZ_LAND_LEG = makeRoute(NARVAEZ_LAND_LEG_DATA);
export const NARVAEZ_FULL = makeRoute({
  pts: [...NARVAEZ_VOYAGE_DATA.pts, ...NARVAEZ_LAND_LEG_DATA.pts.slice(1)],
  wpS: [...NARVAEZ_VOYAGE_DATA.wpS, ...NARVAEZ_LAND_LEG_DATA.wpS.slice(1).map((s) => s + NARVAEZ_VOYAGE.len)],
  len: NARVAEZ_VOYAGE.len + NARVAEZ_LAND_LEG.len,
});
export const CORTES_ROAD = makeRoute(CORTES_ROAD_DATA);
/** CHANGED 2026-10-01: the path a ship glyph sails, Santiago -> San Juan de Ulua, one smooth (C2) open-water
 *  line: down Santiago's bay, west between Cabo Cruz and Jamaica, south of the three Caymans, north-west
 *  through the Yucatan Channel, one broad arc over the Gulf north of the Arrecife Alacranes, south-west into
 *  the anchorage. A carrack's whole box (37.5 k^0.6 px long; cut 1's zoom k 0.95 .. 1.7) keeps >= 5 world px
 *  off land between RIDE_CLEAR_S[0] (130 km out of Santiago) and RIDE_CLEAR_S[1] (the anchorage, 67 km
 *  short of Ulua); >= 105 km off Cuba. len 970.3. */
export const NARVAEZ_VOYAGE_RIDE = makeRoute(NARVAEZ_VOYAGE_RIDE_DATA);

// ---------------------------------------------------------------------------
// The crowds
// ---------------------------------------------------------------------------
/** a crowd dot's world radius at zoom k: world-sized (20 px wide at k 8),
 *  never under 2.5 screen px radius in wide shots */
export const dotRadius = (k: number) => Math.max(DOT_R_WORLD, 2.5 / k);
export type CrowdDot = { x: number; y: number; t: number; op?: number; r?: number };
/** crowd dots: the dark casings of all first, then the fills (cream -> orange
 *  by t), so overlapping dots in wide shots read as one blob with one outline */
export const CrowdDots: React.FC<{ dots: CrowdDot[]; cam: Cam; casing?: number }> = ({ dots, cam, casing = 1.6 }) => {
  const r = dotRadius(cam.k);
  const cw = Math.min(casing, 0.32 * r * cam.k) / cam.k; // casing width (screen px, thinner on tiny dots), in world px
  return (
    <g>
      {dots.map((d, i) =>
        (d.op ?? 1) > 0.002 ? (
          <circle key={`c${i}`} cx={d.x} cy={d.y} r={(d.r ?? r) + cw / 2} fill={DARK} fillOpacity={0.62 * (d.op ?? 1)} />
        ) : null,
      )}
      {dots.map((d, i) =>
        (d.op ?? 1) > 0.002 ? (
          <circle key={`f${i}`} cx={d.x} cy={d.y} r={(d.r ?? r) - cw / 2} fill={mixColor(INK, ACCENT, d.t)} fillOpacity={d.op ?? 1} />
        ) : null,
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// GLYPHS. One engraved stroke family: cream ink, DARK casings / hatching.
// ---------------------------------------------------------------------------
/** a small cream city dot */
export const CityDot: React.FC<{ x: number; y: number; cam: Cam; r?: number; opacity?: number }> = ({ x, y, cam, r = 5.5, opacity = 1 }) =>
  opacity > 0.002 ? (
    <circle cx={x} cy={y} r={r / cam.k} fill={INK} fillOpacity={INK_FULL * opacity} stroke={DARK} strokeOpacity={0.65 * opacity} strokeWidth={1.8 / cam.k} />
  ) : null;

/** thin orange ring round a city dot: Cortes holds it. progress 0..1 draws it
 *  clockwise from the top */
export const HoldRing: React.FC<{ x: number; y: number; cam: Cam; r?: number; progress?: number; opacity?: number }> = ({
  x,
  y,
  cam,
  r = 15,
  progress = 1,
  opacity = 1,
}) => {
  if (opacity <= 0.002 || progress <= 0.001) return null;
  const R = r / cam.k;
  const C = 2 * Math.PI * R;
  const dash = progress >= 0.999 ? undefined : `${(C * progress).toFixed(4)} ${C.toFixed(4)}`;
  return (
    <g opacity={opacity} transform={`rotate(-90 ${x} ${y})`}>
      <circle cx={x} cy={y} r={R} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={4.4 / cam.k} strokeDasharray={dash} strokeLinecap="round" />
      <circle cx={x} cy={y} r={R} fill="none" stroke={ACCENT} strokeWidth={2.4 / cam.k} strokeDasharray={dash} strokeLinecap="round" />
    </g>
  );
};

/** the house coin (RailwaysInEuropeanRussia): orange disc, deep core, thin engraved cream ring */
export const Coin: React.FC<{ x: number; y: number; cam: Cam; size?: number; opacity?: number }> = ({ x, y, cam, size = 16, opacity = 1 }) => {
  if (opacity <= 0.002) return null;
  const R = size / 2 / cam.k;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={R} fill={ACCENT} stroke={DARK} strokeOpacity={0.7} strokeWidth={1.5 / cam.k} />
      <circle cx={x} cy={y} r={R * 0.6} fill={ACCENT_DEEP} />
      <circle cx={x} cy={y} r={R * 0.64} fill="none" stroke={INK} strokeOpacity={0.85} strokeWidth={1.1 / cam.k} />
    </g>
  );
};

// Lucide "swords" (24 x 24, stroke 2, round caps / joins)
const SWORDS_D =
  "M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2";
/** Lucide "swords" as an engraved cream stroke over a dark casing; size = screen px of its 24-unit box */
export const Swords: React.FC<{ x: number; y: number; cam: Cam; size?: number; opacity?: number; color?: string }> = ({
  x,
  y,
  cam,
  size = 110,
  opacity = 1,
  color = INK,
}) => {
  if (opacity <= 0.002) return null;
  const s = size / 24 / cam.k; // world units per glyph unit
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${s}) translate(-12 -12)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={SWORDS_D} stroke={DARK} strokeOpacity={0.7} strokeWidth={2 + (3.2 * 24) / size} />
      <path d={SWORDS_D} stroke={color} strokeOpacity={INK_FULL} strokeWidth={2} />
    </g>
  );
};

// THE CARRACK, in profile facing west (bow left), in a 100-unit frame: x 0
// (bow) .. 100 (stern), the waterline y 0, up negative. Hull with a sheer line
// (forecastle forward, a low waist, a tall sterncastle), bowsprit; three masts:
// square fore and main courses (main topsail over it, a fighting top), lateen
// mizzen on a slanted yard; a pennant from the main truck streaming forward.
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
/** a 16th-century carrack facing west; (x, y) = the waterline under its middle */
export const Carrack: React.FC<{
  x: number;
  y: number;
  cam: Cam;
  frame: number;
  size?: number;
  seed?: number;
  hollow?: boolean;
  opacity?: number;
  pitch?: number;
  wake?: number;
  rock?: number;
}> = ({ x, y, cam, frame, size = 84, seed = 1, hollow = false, opacity = 1, pitch = 0, wake = 1, rock: rockAmp = 1.6 }) => {
  if (opacity <= 0.002) return null;
  const u = size / 100 / cam.k; // world px per glyph unit
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
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${u}) translate(0 ${bob.toFixed(3)}) rotate(${rock.toFixed(3)}) translate(-50 0)`}>
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
export const labelSlide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...CLAMP }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], CLAMP),
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
