// ---------------------------------------------------------------------------
// koreaShared: THE 1950 KOREA MAP WORLD, shared read-only by Twosome,
// ReuniteTheWholeThing and ChineseAreIn (Sarah Paine, "Both sides overreached
// in Korea", Dwarkesh map style). Once SP/READY exists the existing exports
// never change; additions only.
//
// THE WORLD. North-up Lambert conformal conic (parallels 35/41, centre meridian
// 127.5 E), baked by scripts/build-korea-map.mjs into koreaMapData.ts /
// koreaStatic.ts. World px == screen px at PENINSULA_WIDE. 0.90 world px per km.
// The static map (sea, 4 water-lines, 5 deg graticule, land + rim, 1950
// borders: Korea-China, Korea-USSR, China-USSR; coast) is a raster LOD pyramid
// (scripts/bake-korea-rasters.mjs -> public/korea/lod-*.png, koreaLevels.ts):
// far (base) / wide k 0.72+ / mid k 1.2+ / close k 1.95+, sharp to k ~3.4.
// Korea is ONE land mass; its only internal line is the 38th (<Parallel38>).
//
// THE CAMERA. A camera is { cx, cy, k }: the world point (cx, cy) sits on
// screen (540, 835) at zoom k. screen = (540 + (x - cx) k, 835 + (y - cy) k).
//
// API
//   palette: SEA LAND LAND_RIM INK ACCENT ACCENT_DEEP DARK; ink ladder INK_HI
//     0.9 / INK_LO 0.5 (cream carries everything that is not orange at these two)
//   MEN_PER_DOT = 3000; dotScreen(k) = the dot diameter law (9.5 px x k^0.35)
//   project(lon, lat) -> [x, y] world px; projectLine(LonLat[]) -> P2[]
//   PENINSULA_WIDE, NORTH_FRAME: named framings (Cam)
//   <KoreaPage cam>{children}</KoreaPage>: the baked backdrop + world-space
//     mottle, then children, then screen-space grain + vignette on top
//   <WorldSvg cam>{...}</WorldSvg>: a full-frame svg whose children are drawn in
//     world px (put FrontHatch / Army / Parallel38 / MapLabel in it)
//   <FrontHatch front side cam opacity id>: orange hatch clipped to Korean land on
//     the `side` of a front ("north": everything north of the line is hatched,
//     i.e. the North's gain in cut 1; "south": everything south of it, the UN's
//     gain), with the front's dashed orange edge over land only. The hatch
//     spacing is octave-stable (constant on screen, anchored to the world: it
//     never swims)
//   <Army front side count color frame cam seed>: a blue-noise crowd of `count`
//     dots massed just behind `front` on `side`, riding it; `front` may be a
//     function of the frame (f) => LonLat[], and then every dot reads it with its
//     own 0-3 f lag, so the crowd never moves in unison; plus a hashed breath
//   <Parallel38 swallowedBy side bright cam>: the 38th, dashed cream over land,
//     INK_LO -> INK_HI by `bright`; wherever the `side` region of `swallowedBy`
//     has passed over it, it fades out (by the geometry, never a timer)
//   <MapLabel text lon lat frame f0 cam>: IM Fell English SC spaced caps; slides
//     up 24 px while fading in from f0 (start ~8 f before the word)
//   camera helpers: makeTrack (integral of tapered velocity bumps, LopsidedV2),
//     pchip (monotone cubic keys, transsibCamera), dampTrack (critically damped
//     follow), camStats (max screen speed px/f and |dv| px/f^2 over the frame)
//   geometry helpers: hatchRegion, landAt, frontLandSpan
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import type { LonLat } from "./korea1950Fronts";
import { PARALLEL_38, frontThrough as frontThroughLL } from "./korea1950Fronts";
import { KOREA_D, LAND_MASK, LAND_MASK_B64, NORTH_FRAME as NF, PENINSULA_WIDE as PW, PROJ } from "./koreaMapData";
import { LEVELS } from "./koreaLevels";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export { fellSC };

export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const SCREEN_CX = 540;
export const SCREEN_CY = 835;

export const SEA = "#1B2226";
export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DARK = "#0B0907";
export const INK_HI = 0.9;
export const INK_LO = 0.5;
export const MEN_PER_DOT = 3000;

export type P2 = [number, number];
export type Cam = { cx: number; cy: number; k: number };
export const PENINSULA_WIDE: Cam = PW;
export const NORTH_FRAME: Cam = NF;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ---------------------------------------------------------------------------
// Projection (spherical LCC, identical to d3-geo's geoConicConformal with PROJ;
// checked to 1e-3 px).
// ---------------------------------------------------------------------------
const RAD = Math.PI / 180;
const tany = (y: number) => Math.tan((Math.PI / 2 + y) / 2);
const Y0 = PROJ.parallels[0] * RAD;
const Y1 = PROJ.parallels[1] * RAD;
const N_ = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
const F_ = (Math.cos(Y0) * Math.pow(tany(Y0), N_)) / N_;
const raw = (x: number, y: number): P2 => {
  const r = F_ / Math.pow(tany(y), N_);
  return [r * Math.sin(N_ * x), F_ - r * Math.cos(N_ * x)];
};
const C0 = raw(0, PROJ.center[1] * RAD);
export const project = (lon: number, lat: number): P2 => {
  const p = raw((lon + PROJ.rotate[0]) * RAD, lat * RAD);
  return [PROJ.translate[0] + PROJ.scale * (p[0] - C0[0]), PROJ.translate[1] - PROJ.scale * (p[1] - C0[1])];
};
export const projectLine = (line: LonLat[]): P2[] => line.map(([lon, lat]) => project(lon, lat));

export const toScreen = (x: number, y: number, cam: Cam): P2 => [
  SCREEN_CX + (x - cam.cx) * cam.k,
  SCREEN_CY + (y - cam.cy) * cam.k,
];
export const camTransform = (cam: Cam) => {
  const tx = SCREEN_CX - cam.cx * cam.k;
  const ty = SCREEN_CY - cam.cy * cam.k;
  return { tx, ty, svg: `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(5)})` };
};

// ---------------------------------------------------------------------------
// Korea's soft land mask (0..1; > 0.5 = land a little in from the coast).
// ---------------------------------------------------------------------------
const MASK = (() => {
  const bin = atob(LAND_MASK_B64);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
})();
/** bilinear sample of the blurred Korea land mask, 0..1 (0 outside its bbox) */
export const landAt = (x: number, y: number) => {
  const fx = (x - LAND_MASK.x0) * LAND_MASK.s - 0.5;
  const fy = (y - LAND_MASK.y0) * LAND_MASK.s - 0.5;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  if (i < 0 || j < 0 || i >= LAND_MASK.w - 1 || j >= LAND_MASK.h - 1) return 0;
  const u = fx - i;
  const v = fy - j;
  const W = LAND_MASK.w;
  const a = MASK[j * W + i];
  const b = MASK[j * W + i + 1];
  const c = MASK[(j + 1) * W + i];
  const d = MASK[(j + 1) * W + i + 1];
  return ((a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v) / 255;
};

// ---------------------------------------------------------------------------
// Front geometry.
// ---------------------------------------------------------------------------
export type Side = "north" | "south";
const BIG = 4000;
/** the region on `side` of a projected front (W -> E polyline, sea stub to sea
 *  stub), closed round the far side of the map; as a point list */
export const hatchRegion = (pts: P2[], side: Side): P2[] => {
  const a = pts[0];
  const b = pts[pts.length - 1];
  const yFar = side === "north" ? -BIG : BIG;
  return [...pts, [b[0] + BIG, b[1]], [b[0] + BIG, yFar], [a[0] - BIG, yFar], [a[0] - BIG, a[1]]];
};
const dOf = (pts: P2[], close = false) =>
  `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}${close ? "Z" : ""}`;
const inPoly = (x: number, y: number, poly: P2[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const distToLine = (x: number, y: number, pts: P2[]) => {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const t = clamp01(((x - ax) * dx + (y - ay) * dy) / l2);
    const d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
    if (d < best) best = d;
  }
  return best;
};
/** signed depth of a world point INTO the `side` region of a front (world px; < 0 outside) */
export const depthInto = (x: number, y: number, pts: P2[], side: Side) => {
  const d = distToLine(x, y, pts);
  return inPoly(x, y, hatchRegion(pts, side)) ? d : -d;
};

type LandSpan = { pts: P2[]; cum: number[]; land: number[]; total: number };
/** a projected front's land-weighted arclength: sea stubs and small islands weigh
 *  ~0, and with `side` + `probe` (world px) a stretch whose ground on that side is
 *  sea (a bay, a peninsula's tip) weighs ~0 too */
export const frontLandSpan = (pts: P2[], side?: Side, probe = 20): LandSpan => {
  const soft = (v: number) => smoothstep((v - 0.3) / 0.45);
  const land = pts.map(([x, y], i) => {
    let w = soft(landAt(x, y));
    if (side && w > 0) {
      const a = pts[Math.max(0, i - 4)];
      const b = pts[Math.min(pts.length - 1, i + 4)];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const sg = side === "north" ? 1 : -1;
      const nx = ((b[1] - a[1]) / L) * sg;
      const ny = (-(b[0] - a[0]) / L) * sg;
      w *= soft(landAt(x + nx * probe, y + ny * probe));
    }
    return w;
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const ds = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    cum.push(cum[i - 1] + ds * 0.5 * (land[i] + land[i - 1]));
  }
  return { pts, cum, land, total: cum[cum.length - 1] };
};
/** the point at land-arclength fraction u, and the unit normal toward `side` */
const spanAt = (sp: LandSpan, u: number, side: Side) => {
  const target = clamp01(u) * sp.total;
  let i = 1;
  while (i < sp.cum.length - 1 && sp.cum[i] < target) i++;
  const seg = sp.cum[i] - sp.cum[i - 1];
  const t = seg > 1e-6 ? (target - sp.cum[i - 1]) / seg : 0;
  const p = sp.pts;
  const x = p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t;
  const y = p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t;
  // normal from a +-4 sample chord, so a kink never flips it
  const a = p[Math.max(0, i - 5)];
  const b = p[Math.min(p.length - 1, i + 4)];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const tx = (b[0] - a[0]) / L;
  const ty = (b[1] - a[1]) / L;
  // travelling W -> E with y down, (ty, -tx) points north
  const sgn = side === "north" ? 1 : -1;
  return { x, y, nx: ty * sgn, ny: -tx * sgn, tx, ty };
};

// ---------------------------------------------------------------------------
// <KoreaPage>: backdrop (LOD rasters + world-space mottle), children, then
// screen-space grain and vignette.
// ---------------------------------------------------------------------------
export const levelOps = (k: number) =>
  LEVELS.map((L) => (L.band ? smoothstep(Math.log(k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1));

export const KoreaPage: React.FC<{
  cam: Cam;
  vignette?: number;
  grainOpacity?: number;
  children?: React.ReactNode;
}> = ({ cam, vignette = 0.55, grainOpacity = 1, children }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const ops = levelOps(k);
  const view = {
    x0: cam.cx - SCREEN_CX / k - 20,
    x1: cam.cx + (FRAME_W - SCREEN_CX) / k + 20,
    y0: cam.cy - SCREEN_CY / k - 20,
    y1: cam.cy + (FRAME_H - SCREEN_CY) / k + 20,
  };
  const levelImgs = LEVELS.map((L, li) => {
    // drawn unless the level above is opaque AND covers the whole view
    const above = LEVELS[li + 1];
    const drawn = ops[li] > 0.001 && (!above || ops[li + 1] < 0.999 || !covers(above, view));
    if (!drawn) return null;
    return (
      <Img
        key={L.name}
        src={staticFile(`korea/lod-${L.name}.png`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.W,
          height: L.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + L.x0 * k).toFixed(3)}px, ${(ty + L.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
          opacity: ops[li],
        }}
      />
    );
  });
  // mottle tiles, world space, in octaves (TroopsOutOfAsia): stains keep ~ the
  // same screen size through a zoom, the next octave fading in across it
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
    const x0 = Math.floor((view.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((view.y0 - oy) / S) * S + oy;
    for (let y = y0; y < view.y1; y += S) for (let x = x0; x < view.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      {levelImgs}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          opacity: 0.9,
        }}
      >
        {tiles.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile("korea/mottle.png")}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>
      {children}
      <Img
        src={staticFile("korea/grain.png")}
        style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: grainOpacity }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(
            3,
          )}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
const covers = (L: { x0: number; y0: number; w: number; h: number }, v: { x0: number; x1: number; y0: number; y1: number }) =>
  v.x0 >= L.x0 && v.y0 >= L.y0 && v.x1 <= L.x0 + L.w && v.y1 <= L.y0 + L.h;

/** a full-frame svg whose children draw in world px under the camera */
export const WorldSvg: React.FC<{ cam: Cam; children?: React.ReactNode }> = ({ cam, children }) => (
  <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <clipPath id="koreaLandClip">
        <path d={KOREA_D} clipRule="evenodd" />
      </clipPath>
    </defs>
    <g transform={camTransform(cam).svg}>{children}</g>
  </svg>
);

// ---------------------------------------------------------------------------
// <FrontHatch>
// ---------------------------------------------------------------------------
const HATCH_SCREEN = 10; // screen px between hatch lines (octave-stable)
export const FrontHatch: React.FC<{
  front: LonLat[];
  side: Side;
  cam: Cam;
  opacity?: number;
  edgeOpacity?: number;
  id?: string;
}> = ({ front, side, cam, opacity = 1, edgeOpacity, id = "fh" }) => {
  if (opacity <= 0.001) return null;
  const k = cam.k;
  const px = (v: number) => v / k;
  const pts = projectLine(front);
  const region = dOf(hatchRegion(pts, side), true);
  // octave-stable hatch: period P world px holds lines at 0 (full) and P/2
  // (fading in across the octave), so the on-screen spacing stays ~10-20 px
  // and the lines never slide against the map
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = L2 - o;
  const P = (2 * HATCH_SCREEN) / Math.pow(2, o);
  const sw = px(2.1);
  const eo = edgeOpacity ?? opacity;
  return (
    <g>
      <defs>
        <pattern id={`${id}-pat`} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform="rotate(45)">
          <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={ACCENT} strokeWidth={sw} />
          <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={ACCENT} strokeWidth={sw} strokeOpacity={t} />
          <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={ACCENT} strokeWidth={sw} />
        </pattern>
      </defs>
      <g clipPath="url(#koreaLandClip)">
        <g opacity={opacity}>
          <path d={region} fill={ACCENT_DEEP} fillOpacity={0.2} />
          <path d={region} fill={`url(#${id}-pat)`} opacity={0.7} />
        </g>
        <path
          d={dOf(pts)}
          fill="none"
          stroke={ACCENT}
          strokeOpacity={eo}
          strokeWidth={px(2.2)}
          strokeDasharray={`${px(7)} ${px(5)}`}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// <Army>
// ---------------------------------------------------------------------------
export const dotScreen = (k: number) => 9.5 * Math.pow(k, 0.35);
/** the crowd's blue-noise slots in (u along the land span 0..1, v depth 0..1):
 *  Mitchell best-candidate in an (aspect x 1) box, deterministic per (count, seed) */
const slotCache = new Map<string, P2[]>();
export const armySlots = (count: number, seed: number, aspect: number): P2[] => {
  const key = `${count}|${seed}|${aspect.toFixed(3)}`;
  const hit = slotCache.get(key);
  if (hit) return hit;
  const W = aspect;
  const pts: P2[] = [];
  let q = 0;
  for (let n = 0; n < count; n++) {
    let best: P2 = [0, 0];
    let bestD = -1;
    for (let c = 0; c < 14; c++) {
      const x = (0.01 + 0.98 * hash(seed * 7919 + q, 1)) * W;
      const y = 0.02 + 0.96 * hash(seed * 7919 + q, 2);
      q++;
      let dmin = Infinity;
      for (const [px, py] of pts) dmin = Math.min(dmin, Math.hypot(px - x, py - y));
      // keep off the box's long edges a touch, so ranks do not line up on them
      dmin = Math.min(dmin, 2.2 * Math.min(y, 1 - y) + 0.12);
      if (dmin > bestD) [bestD, best] = [dmin, [x, y]];
    }
    pts.push(best);
  }
  const out = pts.map(([x, y]) => [x / W, y] as P2);
  slotCache.set(key, out);
  return out;
};

const REPEL_STEP = 0.35;
const REPEL_ITERS = 6;
export type ArmyDot = { x: number; y: number; id: number; op: number };
/** a staggered arrival: each dot fades in over `dur` frames from its own start
 *  (f0 + spread * hash) while it closes `dist` world px onto its slot from behind */
export type ArmyEnter = { f0: number; dur: number; spread: number; dist: number };
/** every dot's world position (exported so cuts can assert spacing / land / caption band) */
/** a front the army rides: a fixed polyline, a function of the frame, or
 *  (smoothest) dated key fronts + a key index s(f) in [0, keys - 1]: then each dot
 *  glides C1 between its own slots on the key fronts (per-dot Catmull-Rom, the same
 *  weights as frontThrough), so no dot ever jumps when the land span changes shape */
export type ArmyFront = LonLat[] | ((f: number) => LonLat[]) | { keys: LonLat[][]; s: (f: number) => number };
const crW = (t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return [0.5 * (-t + 2 * t2 - t3), 0.5 * (2 - 5 * t2 + 3 * t3), 0.5 * (t + 4 * t2 - 3 * t3), 0.5 * (-t2 + t3)];
};
/** nearest point on a polyline, with the segment's unit tangent */
const nearestOn = (x: number, y: number, pts: P2[]) => {
  let best = { d: Infinity, x: 0, y: 0, tx: 1, ty: 0 };
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const t = clamp01(((x - ax) * dx + (y - ay) * dy) / l2);
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    const d = Math.hypot(x - qx, y - qy);
    if (d < best.d) {
      const L = Math.sqrt(l2);
      best = { d, x: qx, y: qy, tx: dx / L, ty: dy / L };
    }
  }
  return best;
};
/** own-side guard: a dot is never on or past its front (a blend between key
 *  slots, or a smoothed position, can cut a corner the front has not reached).
 *  Soft: depth d -> minD + soft * softplus((d - minD) / soft), C1 in d. */
const guardDot = (x: number, y: number, cur: P2[], side: Side, gap: number): P2 => {
  const minD = gap * 0.8;
  const soft = gap * 0.6;
  const dIn = depthInto(x, y, cur, side);
  if (dIn >= minD + 4 * soft) return [x, y];
  const u = (dIn - minD) / soft;
  const target = minD + soft * (u > 30 ? u : Math.log1p(Math.exp(u)));
  const nb = nearestOn(x, y, cur);
  const sg = side === "north" ? 1 : -1;
  return [x + nb.ty * sg * (target - dIn), y - nb.tx * sg * (target - dIn)];
};
/** spacing: Jacobi rounds of a smooth pairwise repulsion (world px), so
 *  converging normals at a concave corner never stack dots. Every step is a
 *  continuous function of the positions (smooth kernel, soft land brake, soft
 *  own-side guard), so the pass never kicks a dot from one frame to the next. */
const spaceOut = (
  raw: { x: number; y: number; lag: number }[],
  minSep: number,
  iters: number,
  side: Side,
  gap: number,
  currentAt: ((lag: number) => P2[]) | null,
) => {
  const guarded = !!currentAt;
  const R = minSep * 1.12;
  for (let it = 0; it < iters; it++) {
    const fx = new Float64Array(raw.length);
    const fy = new Float64Array(raw.length);
    for (let a = 0; a < raw.length; a++) {
      for (let b = a + 1; b < raw.length; b++) {
        const dx = raw[b].x - raw[a].x;
        const dy = raw[b].y - raw[a].y;
        const d = Math.hypot(dx, dy);
        if (d >= R) continue;
        let ux: number;
        let uy: number;
        if (d < 1e-3) {
          const t = 6.283 * hash(a * 97 + b, 9);
          ux = Math.cos(t);
          uy = Math.sin(t);
        } else {
          ux = dx / d;
          uy = dy / d;
        }
        const q = (R - d) / R;
        const m = REPEL_STEP * R * q * q * (1.5 - 0.5 * q); // smooth at d = R
        fx[a] -= ux * m;
        fy[a] -= uy * m;
        fx[b] += ux * m;
        fy[b] += uy * m;
      }
    }
    raw.forEach((r, i) => {
      if (fx[i] === 0 && fy[i] === 0) return;
      const nx = r.x + fx[i];
      const ny = r.y + fy[i];
      const brake = smoothstep((landAt(nx, ny) - 0.35) / 0.3);
      let x = r.x + fx[i] * brake;
      let y = r.y + fy[i] * brake;
      if (guarded) [x, y] = guardDot(x, y, currentAt!(r.lag), side, gap);
      r.x = x;
      r.y = y;
    });
  }
};

const armyDotsAt = ({
  front,
  side,
  count,
  frame,
  k: _k,
  seed = 1,
  gap = 6,
  depth = 34,
  inset = 0.06,
  maxLag = 3,
  aspect = 8,
  enter,
  minSep: minSepIn,
}: {
  front: ArmyFront;
  side: Side;
  count: number;
  frame: number;
  k: number;
  seed?: number;
  gap?: number;
  depth?: number;
  inset?: number;
  maxLag?: number;
  aspect?: number;
  enter?: ArmyEnter;
  /** minimum centre spacing, world px (default: 1.45 dot diameters at this k) */
  minSep?: number;
}) => {
  const slots = armySlots(count, seed, aspect);
  void minSepIn; // read by armyDots
  void _k; // the zoom is read by armyDots (spacing) and the breath
  const keyed = !Array.isArray(front) && typeof front !== "function" ? front : null;
  const probe = gap + depth * 0.5;
  // land spans: per lag (function mode) or per key (keyed mode)
  const spans = new Map<number, LandSpan>();
  const spanOf = (key: number, line: () => LonLat[]) => {
    let sp = spans.get(key);
    if (!sp) {
      sp = frontLandSpan(projectLine(line()), side, probe);
      spans.set(key, sp);
    }
    return sp;
  };
  // the current front per lag, for the own-side guard
  const current = new Map<number, P2[]>();
  const currentAt = (lag: number): P2[] => {
    let c = current.get(lag);
    if (!c) {
      const line = keyed
        ? frontThroughLL(keyed.keys, keyed.s(frame - lag))
        : typeof front === "function"
          ? front(frame - lag)
          : (front as LonLat[]);
      c = projectLine(line);
      current.set(lag, c);
    }
    return c;
  };
  const place = (sp: LandSpan, u: number, v: number, back: number): P2 => {
    const uu = inset + (1 - 2 * inset) * u;
    const p = spanAt(sp, uu, side);
    // the crowd is a mass, not a strip: deepest in the middle of the line,
    // thinning toward both ends
    const taper = 0.45 + 0.55 * Math.pow(Math.sin(Math.PI * u), 0.6);
    let d = gap + depth * v * taper + back;
    // keep the dot on land: pull it back toward the front if the coast cuts in
    if (landAt(p.x + p.nx * d, p.y + p.ny * d) < 0.5) {
      let lo = 0;
      let hi = d;
      for (let it = 0; it < 10; it++) {
        const m = (lo + hi) / 2;
        if (landAt(p.x + p.nx * m, p.y + p.ny * m) >= 0.5) lo = m;
        else hi = m;
      }
      d = lo * 0.92;
    }
    return [p.x + p.nx * d, p.y + p.ny * d];
  };
  const raw = slots.map(([u, v], i) => {
    const lag = typeof front === "function" || keyed ? Math.round(hash(seed * 31 + i, 5) * maxLag) : 0;
    let op = 1;
    let back = 0;
    if (enter) {
      const t0 = enter.f0 + enter.spread * hash(seed * 53 + i, 6);
      const e = smoothstep((frame - t0) / enter.dur);
      op = e;
      back = enter.dist * (1 - Math.sin((Math.PI / 2) * e));
    }
    let x: number;
    let y: number;
    if (keyed) {
      const n = keyed.keys.length;
      const sc = Math.min(n - 1, Math.max(0, keyed.s(frame - lag)));
      const i0 = Math.min(n - 2, Math.floor(sc));
      const w = crW(sc - i0);
      const idx = [Math.max(0, i0 - 1), i0, i0 + 1, Math.min(n - 1, i0 + 2)];
      x = 0;
      y = 0;
      idx.forEach((ki, j) => {
        const q = place(spanOf(ki, () => keyed.keys[ki]), u, v, back);
        x += w[j] * q[0];
        y += w[j] * q[1];
      });
    } else {
      const sp = spanOf(lag, () => (typeof front === "function" ? front(frame - lag) : (front as LonLat[])));
      [x, y] = place(sp, u, v, back);
    }
    let x1 = x;
    let y1 = y;
    if (keyed || typeof front === "function") [x1, y1] = guardDot(x, y, currentAt(lag), side, gap);
    return { x: x1, y: y1, op, lag, i };
  });
  return { raw, currentAt, guarded: keyed || typeof front === "function" };
};

type ArmyArgs = Parameters<typeof armyDotsAt>[0] & {
  /** temporal smoothing radius in frames (binomial taps over f-r..f+r), 0 = off:
   *  irons out any one-frame kick from the guard or the spacing pass. The placed
   *  positions are smoothed over +-r, and the spaced result again over +-1. */
  smooth?: number;
};
const armyDotsSpaced = ({ smooth = 0, ...args }: ArmyArgs): ArmyDot[] => {
  const { frame, k, gap = 6, side, seed = 1 } = args;
  const minSep = args.minSep ?? (1.45 * dotScreen(k)) / k;
  const here = armyDotsAt(args);
  const raw = here.raw;
  if (smooth > 0) {
    // average the placed (pre-spacing) positions over f-r..f+r, binomial taps
    const taps: number[] = [1];
    for (let i = 0; i < 2 * smooth; i++) {
      for (let j = taps.length - 1; j > 0; j--) taps[j] += taps[j - 1];
      taps.push(1);
    }
    const W = taps.reduce((a, b) => a + b, 0);
    const sets = taps.map((_, t) => (t === smooth ? raw : armyDotsAt({ ...args, frame: frame - smooth + t }).raw));
    const avg = raw.map((_, i) => {
      let x = 0;
      let y = 0;
      sets.forEach((set, t) => {
        x += set[i].x * taps[t];
        y += set[i].y * taps[t];
      });
      return [x / W, y / W];
    });
    const { currentAt: cur0, guarded: g0 } = here;
    raw.forEach((r, i) => {
      [r.x, r.y] = g0 ? guardDot(avg[i][0], avg[i][1], cur0(r.lag), side, gap) : [avg[i][0], avg[i][1]];
    });
  }
  const { currentAt, guarded } = here;
  spaceOut(raw, minSep, REPEL_ITERS, side, gap, guarded ? currentAt : null);
  return raw.map(({ x: x0, y: y0, op, i }) => {
    let x = x0;
    let y = y0;
    // breath: two incommensurate slow sines per dot (~1.1 screen px), never in unison
    const id = seed * 1000 + i;
    const w1 = 0.045 + 0.04 * hash(id, 11);
    const w2 = 0.04 + 0.045 * hash(id, 12);
    const a = 1.1 / k;
    x += a * Math.sin(frame * w1 + 6.283 * hash(id, 13));
    y += a * Math.sin(frame * w2 + 6.283 * hash(id, 14));
    return { x, y, id, op };
  });
};


export const armyDots = (args: ArmyArgs): ArmyDot[] => {
  if (!args.smooth) return armyDotsSpaced(args);
  const sets = [-1, 0, 1].map((o) => armyDotsSpaced({ ...args, frame: args.frame + o }));
  const pts = sets[1].map((d, i) => ({
    x: 0.25 * sets[0][i].x + 0.5 * d.x + 0.25 * sets[2][i].x,
    y: 0.25 * sets[0][i].y + 0.5 * d.y + 0.25 * sets[2][i].y,
    lag: 0,
  }));
  // a light final spacing pass on the averaged crowd (no guard: the average of
  // three guarded positions is on the right side)
  const minSep = args.minSep ?? (1.45 * dotScreen(args.k)) / args.k;
  spaceOut(pts, minSep, 4, args.side, args.gap ?? 6, null);
  return sets[1].map((d, i) => ({ ...d, x: pts[i].x, y: pts[i].y }));
};

export const Army: React.FC<{
  front: ArmyFront;
  side: Side;
  count: number;
  color: "orange" | "cream";
  frame: number;
  cam: Cam;
  seed?: number;
  opacity?: number;
  gap?: number;
  depth?: number;
  aspect?: number;
  enter?: ArmyEnter;
  smooth?: number;
}> = ({ front, side, count, color, frame, cam, seed = 1, opacity = 1, gap, depth, aspect, enter, smooth }) => {
  if (opacity <= 0.001 || count <= 0) return null;
  const k = cam.k;
  const dots = armyDots({ front, side, count, frame, k, seed, gap, depth, aspect, enter, smooth });
  const r = dotScreen(k) / 2 / k;
  const fill = color === "orange" ? ACCENT : INK;
  return (
    <g opacity={opacity}>
      {dots.map((d) =>
        d.op > 0.002 ? (
          <circle
            key={d.id}
            cx={d.x}
            cy={d.y}
            r={r}
            fill={fill}
            fillOpacity={d.op}
            stroke={DARK}
            strokeOpacity={0.6 * d.op}
            strokeWidth={1.6 / k}
          />
        ) : null,
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// <Parallel38>
// ---------------------------------------------------------------------------
// the 38th's two land runs (Ongjin; Haeju bay -> the east coast), densely sampled
const P38_RUNS: P2[][] = (() => {
  const runs: [number, number][] = [
    [PARALLEL_38[0][0], PARALLEL_38[1][0]],
    [PARALLEL_38[2][0], PARALLEL_38[PARALLEL_38.length - 1][0]],
  ];
  return runs.map(([a, b]) => {
    const n = Math.max(2, Math.ceil((b - a) / 0.02));
    return Array.from({ length: n + 1 }, (_, i) => project(a + ((b - a) * i) / n, 38));
  });
})();
const P38_DASH: [number, number] = [7, 4.5]; // world px (world-anchored: never swims)
export const Parallel38: React.FC<{
  cam: Cam;
  swallowedBy?: LonLat[];
  side?: Side;
  bright?: number;
  opacity?: number;
  feather?: number;
}> = ({ cam, swallowedBy, side = "north", bright = 0, opacity = 1, feather = 12 }) => {
  if (opacity <= 0.001) return null;
  const k = cam.k;
  const front = swallowedBy ? projectLine(swallowedBy) : null;
  const op0 = (INK_LO + (INK_HI - INK_LO) * clamp01(bright)) * opacity;
  const pieces: React.ReactNode[] = [];
  const STEP = 3; // samples per piece (~5 world px)
  P38_RUNS.forEach((run, ri) => {
    let cum = 0;
    for (let i = 0; i < run.length - 1; i += STEP) {
      const seg = run.slice(i, Math.min(run.length, i + STEP + 1));
      const mid = seg[Math.floor(seg.length / 2)];
      let o = 1;
      if (front) {
        const dIn = depthInto(mid[0], mid[1], front, side);
        o = 1 - smoothstep((dIn - 1.5) / feather);
      }
      let len = 0;
      for (let j = 1; j < seg.length; j++) len += Math.hypot(seg[j][0] - seg[j - 1][0], seg[j][1] - seg[j - 1][1]);
      if (o > 0.01) {
        pieces.push(
          <path
            key={`${ri}-${i}`}
            d={dOf(seg)}
            fill="none"
            stroke={INK}
            strokeOpacity={op0 * o}
            strokeWidth={1.9 / k}
            strokeDasharray={`${P38_DASH[0]} ${P38_DASH[1]}`}
            strokeDashoffset={-cum}
          />,
        );
      }
      cum += len;
    }
  });
  return <g clipPath="url(#koreaLandClip)">{pieces}</g>;
};

// ---------------------------------------------------------------------------
// <MapLabel>
// ---------------------------------------------------------------------------
export const LABEL_TRAVEL = 24;
export const LABEL_FRAMES = 14;
export const LABEL_FADE = 9;
export const labelSlide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...CLAMP }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], CLAMP),
});
export const MapLabel: React.FC<{
  text: string;
  lon: number;
  lat: number;
  frame: number;
  f0: number;
  cam: Cam;
  size?: number;
  spacing?: number;
  color?: string;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
}> = ({ text, lon, lat, frame, f0, cam, size = 40, spacing = 0.4, color = INK, opacity = INK_HI, anchor = "middle" }) => {
  const sl = labelSlide(frame, f0);
  if (sl.op <= 0) return null;
  const k = cam.k;
  const [x, y] = project(lon, lat);
  const sz = (size * Math.pow(k, 0.35)) / k;
  return (
    <text
      x={x}
      y={y + sl.dy / k}
      textAnchor={anchor}
      opacity={sl.op * opacity}
      fill={color}
      stroke={SEA}
      strokeOpacity={0.5}
      strokeWidth={sz * 0.1}
      paintOrder="stroke"
      style={{ fontFamily: fellSC, fontSize: sz, letterSpacing: sz * spacing }}
    >
      {text}
    </text>
  );
};

// ---------------------------------------------------------------------------
// Camera helpers.
// ---------------------------------------------------------------------------
/** [from, to, area, taper]: a cosine-tapered velocity bump (taper 1 = a full
 *  raised cosine) whose integral is `area` (LopsidedV2) */
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
/** a channel as the integral of overlapping velocity bumps: C1 end to end;
 *  value v0 at f = 0 */
export const makeTrack = (bumps: Bump[], v0: number, fLo = -60, fHi = 420, sub = 8) => {
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
/** monotone cubic through keys [x, y] (held ends): C1, no overshoot (transsibCamera) */
export const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};
/** a critically damped follow of a target channel (time constant tau frames),
 *  integrated from fLo at rest on the target */
export const dampTrack = (target: (f: number) => number, tau: number, fLo = -60, fHi = 420, sub = 8) => {
  const arr: number[] = [];
  let x = target(fLo);
  let v = 0;
  const dt = 1 / sub;
  for (let i = 0; i <= (fHi - fLo) * sub; i++) {
    const f = fLo + i * dt;
    if (i > 0) {
      v += ((target(f) - x) / (tau * tau) - (2 * v) / tau) * dt;
      x += v * dt;
    }
    arr.push(x);
  }
  return (f: number) => {
    const p = (f - fLo) * sub;
    const i = Math.max(0, Math.min(arr.length - 2, Math.floor(p)));
    const u = clamp01(p - i);
    return arr[i] + (arr[i + 1] - arr[i]) * u;
  };
};
/** max screen speed (px/f) and |dv| (px/f^2) of the map under a camera track,
 *  probed on a grid over the frame above the caption band */
export const camStats = (cam: (f: number) => Cam, f0: number, f1: number) => {
  const probes: P2[] = [];
  for (let sy = 150; sy <= 1150; sy += 250) for (let sx = 60; sx <= 1020; sx += 240) probes.push([sx, sy]);
  const vel = (f: number) =>
    probes.map(([sx, sy]) => {
      const a = cam(f);
      const wx = a.cx + (sx - SCREEN_CX) / a.k;
      const wy = a.cy + (sy - SCREEN_CY) / a.k;
      const [bx, by] = toScreen(wx, wy, cam(f + 1));
      return [bx - sx, by - sy] as P2;
    });
  let maxV = 0;
  let maxDv = 0;
  let fV = f0;
  let fDv = f0;
  let prev = vel(f0);
  for (let f = f0; f < f1; f++) {
    const v = f === f0 ? prev : vel(f);
    v.forEach(([x, y], i) => {
      const s = Math.hypot(x, y);
      if (s > maxV) [maxV, fV] = [s, f];
      const dv = Math.hypot(x - prev[i][0], y - prev[i][1]);
      if (dv > maxDv) [maxDv, fDv] = [dv, f];
    });
    prev = v;
  }
  return { maxV, fV, maxDv, fDv };
};
