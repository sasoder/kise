// ---------------------------------------------------------------------------
// tenEarthsGlobe: THE EARTH GLOBE, the shared world module of rsi-ten-earths (Dwarkesh 3D style, styles/dwarkesh-3d.md).
// Read-only for the cut builders; additions go through the director (animation_source/notes/SHARED_CHANGES.md).
// One Earth in the misty teal air: an orthographic sphere with the real land (Natural Earth 1:110m, world-atlas),
// drawn like the style's volumes (soft form light from the upper left: lit cap, mid, a soft core shadow lower right,
// a little reflected air on the far edge; a CREAM RIM on the upper-left limb; a faint atmosphere halo in the air
// colour; no black outline). Sea in deep teal-petrol tones of the air ramp, land in warm sand-umber/khaki, coastlines
// a darker local tone, no borders except China's when it is lit. It can be a normal Earth, have China lit, be partly
// covered by an orange tide of AIs spreading over the land from a seed, and be a fully orange planet (= one Earth's
// worth of AIs, the clip's colour rule). Frame-driven and seek-safe: every frame is a pure function of the props.
//
// API (screen px; a cut converts its world point with globeFromWorld)
//   type GlobeSpec = {
//     cx, cy, r            the disc's centre and radius on screen (r 350 = the 700 px hero; ~75 = the 150 px mid globes)
//     lon?, lat?, roll?    the point facing the viewer (deg; default CHINA_FACE, China turned to the camera) and a
//                          roll (deg, d3 rotate's gamma). Turn a globe slowly by animating lon.
//     china?   0..1        China's land lifts to a light cream with a thin darker outline (crossfade)
//     cover?   0..1        THE ORANGE TIDE over the LAND from the seed: 0 none, CHINA_COVERED (0.12) exactly China
//                          (the front sits on China's border, then crosses it from WORLD_T0 = 0.122), 1 all land
//     sea?     0..1        then the tide closes over the oceans from the coasts outward: 1 = a fully orange planet
//     seed?    [lon, lat]  another seed for the tide (default China's centroid, which uses the baked China-first field;
//                          any other seed spreads by plain geodesic distance + the same noise)
//     fog?     0..1        the fog of the globe's depth (A.fog(Z)); orange takes half of it (as A.toneO)
//     air?     hex         the air it fogs toward (A.airHex(Z, h)); default the mid air #466C66
//     halo?, rim?          multipliers (default 1) for the atmosphere halo and the cream rim
//     dots?    0..1        the visible dot texture of the tide (default: by size, full from r ~200, none under r ~80)
//     light?   number      the light's angle (deg, screen, 0 = from the right, 225 = the upper left; default 225)
//     clipY?   number      draw only above this screen row (a globe rising out from behind a roof or an edge)
//   }
//   <EarthGlobe {...GlobeSpec} />            one globe on its own canvas (its bbox + halo), absolutely positioned
//   <OrangeEarth {...spec} />                the fully covered planet, the cheap variant for many copies (cover 1, sea 1;
//                                            no per-dot work under r ~80): ACCENT seas, the continents faintly legible
//                                            in ACCENT_DEEP, the same light, rim and halo
//   <GlobeLayer globes={GlobeSpec[]} logMs? />  many globes on ONE full-frame canvas (1080x1920), painted in array order
//                                            (pass them back to front). The way to draw ten Earths. logMs (a label)
//                                            prints "[globe-ms] <label> <ms>" to the browser console (probes only).
//   drawGlobe(ctx, spec)                     the painter (for a cut's own canvas)
//   globePoint(spec, lon, lat) -> {x, y, front}  where a place sits on screen (front = cos of the angle from the
//                                            viewer, > 0 on the near side): the hook for labels (ChinaLabel)
//   chinaAnchor(spec) = globePoint(spec, ...CHINA_CENTROID)  the ChinaLabel hook at China's centroid
//   globeFromWorld(cam, X, Y, R) -> {cx, cy, r}  a world-space globe (WorldSvg world px, centre X, Y, radius R) on screen
//   globeFog(A, Z, h?) -> {fog, air}         the AirWorld's fog for a globe at depth Z (spread into a spec)
//   constants: CHINA_CENTROID [103.45, 36.68], CHINA_FACE {lon, lat}, CHINA_COVERED (0.12), WORLD_T0 (0.122),
//              ORANGE_EARTH {cover: 1, sea: 1}
//
// PERFORMANCE: the canvases are CPU-rastered (willReadFrequently; the GPU path took seconds per frame on thousands of
// discs). The land is 1:110m vectors projected per frame by d3 (Path2D, ~5k vertices); the tide is a baked 40k-point
// lattice (tenEarthsGlobeData.ts, tenEarthsGlobeMath.latticePoint): its patches ("mats") are squares painted into a
// small mask and smoothed up (true discs once they are >= 8 px), its figures one Path2D of squares (discs >= 2.4 px),
// points off the canvas skipped; a fully covered layer is one fill + its figures. Measured (best of 5, this Mac):
// the hero 700 px 10-20 ms plain, 40-150 ms with the tide (worst both fronts at once), ten 150 px OrangeEarths
// ~25 ms, the hero + ten ~200 ms. GLOBE_READY.md has the table.
//
// SOURCES: Natural Earth 1:110m land and admin-0 countries via world-atlas 2.0.2 (China = ISO 3166 numeric 156; Taiwan
// is a separate feature and not lit). The bake: scripts/clips/rsi-ten-earths/bake-ten-earths-globe.mjs.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
// @ts-expect-error untyped module
import { geoOrthographic, geoPath, geoRotation } from "d3-geo";
import { ACCENT, ACCENT_DEEP, c01, mixHex, smoothstep, type AirWorld, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CHINA, CHINA_CENTROID, LAND, T_LAND_B64, T_SEA_B64 } from "./tenEarthsGlobeData";
import { CHINA_COVERED, CHINA_T_MAX, LAND_W, LATTICE_N, LATTICE_SPACING, SEA_W, T_NONE, T_SCALE, WORLD_T0, hash01, latticePoint, sphereNoise, toXYZ, type V3 } from "./tenEarthsGlobeMath";

export { CHINA_CENTROID, CHINA_COVERED, WORLD_T0 };
export const FRAME_W = 1080;
export const FRAME_H = 1920;
/** China turned to the camera (a little north of its centroid faces the viewer, so China sits just above the disc's
 *  centre and the Indian Ocean below; tilted 12 deg so the northern hemisphere leans toward the light) */
export const CHINA_FACE = { lon: 100, lat: 24 };
export const ORANGE_EARTH = { cover: 1, sea: 1 } as const;

export type GlobeSpec = {
  cx: number;
  cy: number;
  r: number;
  lon?: number;
  lat?: number;
  roll?: number;
  china?: number;
  cover?: number;
  sea?: number;
  seed?: [number, number];
  fog?: number;
  air?: string;
  halo?: number;
  rim?: number;
  dots?: number;
  light?: number;
  clipY?: number;
};

// ===================================================================================================================
// THE BAKED DATA (decoded once per tab)
// ===================================================================================================================
const decode16 = (b64: string) => {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Uint16Array(u8.buffer);
};
type Lattice = {
  xyz: Float32Array;
  landIdx: Uint32Array;
  landT: Float32Array;
  seaIdx: Uint32Array;
  seaT: Float32Array;
  landPt: V3[];
  /** the default (China) field split in two: the China group (drawn clipped to China, so cover 0.12 is exactly China)
   *  and the rest of the land */
  chinaIdx: Uint32Array;
  chinaT: Float32Array;
  restIdx: Uint32Array;
  restT: Float32Array;
};
let LAT: Lattice | null = null;
const lattice = (): Lattice => {
  if (LAT) return LAT;
  const tl = decode16(T_LAND_B64);
  const ts = decode16(T_SEA_B64);
  const xyz = new Float32Array(LATTICE_N * 3);
  const li: number[] = [];
  const si: number[] = [];
  for (let i = 0; i < LATTICE_N; i++) {
    const p = latticePoint(i);
    xyz[i * 3] = p[0];
    xyz[i * 3 + 1] = p[1];
    xyz[i * 3 + 2] = p[2];
    if (tl[i] !== T_NONE) li.push(i);
    if (ts[i] !== T_NONE) si.push(i);
  }
  const landIdx = Uint32Array.from(li);
  const seaIdx = Uint32Array.from(si);
  const ci: number[] = [];
  const ri: number[] = [];
  for (const i of li) (tl[i] / T_SCALE <= CHINA_T_MAX + 1e-4 ? ci : ri).push(i);
  LAT = {
    chinaIdx: Uint32Array.from(ci),
    chinaT: Float32Array.from(ci, (i) => tl[i] / T_SCALE),
    restIdx: Uint32Array.from(ri),
    restT: Float32Array.from(ri, (i) => tl[i] / T_SCALE),
    xyz,
    landIdx,
    landT: Float32Array.from(li, (i) => tl[i] / T_SCALE),
    seaIdx,
    seaT: Float32Array.from(si, (i) => ts[i] / T_SCALE),
    landPt: li.map((i) => [xyz[i * 3], xyz[i * 3 + 1], xyz[i * 3 + 2]] as V3),
  };
  return LAT;
};
/** the land tide's T for another seed: geodesic distance from it, normalised over the land layer, + the same noise */
const seedCache = new Map<string, Float32Array>();
const isDefaultSeed = (seed?: [number, number]) => !seed || (Math.abs(seed[0] - CHINA_CENTROID[0]) < 1e-6 && Math.abs(seed[1] - CHINA_CENTROID[1]) < 1e-6);
const landTFor = (seed?: [number, number]) => {
  const L = lattice();
  if (!seed || isDefaultSeed(seed)) return L.landT;
  const key = `${seed[0].toFixed(4)},${seed[1].toFixed(4)}`;
  const hit = seedCache.get(key);
  if (hit) return hit;
  const s = toXYZ(seed[0], seed[1]);
  const d = L.landPt.map((p) => Math.acos(Math.max(-1, Math.min(1, p[0] * s[0] + p[1] * s[1] + p[2] * s[2]))));
  const dMax = d.reduce((m, v) => Math.max(m, v), 0);
  const T = Float32Array.from(d, (v, j) => {
    const q = v / dMax;
    return c01(0.95 * Math.pow(q, 0.9) + 0.022 * (sphereNoise(L.landPt[j]) + 1) * 0.5 * Math.min(1, q * 12));
  });
  seedCache.set(key, T);
  return T;
};

// ===================================================================================================================
// MATERIALS (local colours before fog): hi = the lit cap's highlight, lit, mid, shadow (the soft core), refl (the far
// edge, lifted by reflected air)
// ===================================================================================================================
type Shade = { hi: string; lit: string; mid: string; shadow: string; refl: string };
const SEA: Shade = { hi: "#557F77", lit: "#456E69", mid: "#33575A", shadow: "#1F3538", refl: "#2E4D4E" };
const LANDM: Shade = { hi: "#CDBC94", lit: "#B9A67E", mid: "#9C8862", shadow: "#5A4C38", refl: "#6E6550" };
const COAST: Shade = { hi: "#8C7A58", lit: "#7D6B4C", mid: "#68583E", shadow: "#3A3027", refl: "#463C30" };
const CREAM: Shade = { hi: "#FBF6EC", lit: "#F3EBDD", mid: "#DED2B9", shadow: "#958A74", refl: "#9E957F" };
const CHINA_LINE: Shade = { hi: "#8E7E60", lit: "#7E6E52", mid: "#6A5B43", shadow: "#3E342A", refl: "#4A4034" };
/** the tide: the land's mat (ACCENT_DEEP family), its figures (ACCENT), the sea's mat (ACCENT), its figures (paler) */
const O_LAND: Shade = { hi: "#F0A11E", lit: "#E2930F", mid: ACCENT_DEEP, shadow: "#8C5108", refl: "#9C600F" };
const O_LAND_DOT: Shade = { hi: "#FFCB4A", lit: ACCENT, mid: "#F5A600", shadow: "#A86607", refl: "#B87410" };
const O_SEA: Shade = { hi: "#FFC43C", lit: ACCENT, mid: "#F3A500", shadow: "#9E6107", refl: "#B07010" };
const O_SEA_DOT: Shade = { hi: "#FFDB7E", lit: "#FFC84A", mid: "#FFB81E", shadow: "#B47209", refl: "#C27E14" };
const O_COAST: Shade = { hi: "#C9800C", lit: "#BD780A", mid: "#A86608", shadow: "#6A3E06", refl: "#77470A" };
const CREAM_RIM = "#F3EBDD";
const HALO = "#BCD4C4";
const AIR_MID = "#466C66";

const avgShade = (a: Shade, b: Shade, t: number): Shade => ({
  hi: mixHex(a.hi, b.hi, t),
  lit: mixHex(a.lit, b.lit, t),
  mid: mixHex(a.mid, b.mid, t),
  shadow: mixHex(a.shadow, b.shadow, t),
  refl: mixHex(a.refl, b.refl, t),
});

// ===================================================================================================================
// THE PAINTER
// ===================================================================================================================
const TAU = Math.PI * 2;
/** two scratch canvases per tab (the mats' mask and the layer), cleared and sized on use */
const SCRATCH: (CanvasRenderingContext2D | null)[] = [null, null];
const scratch = (k: number, w: number, h: number) => {
  let c = SCRATCH[k];
  if (!c) {
    const el = document.createElement("canvas");
    c = el.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    SCRATCH[k] = c;
  }
  if (c.canvas.width < w || c.canvas.height < h) {
    c.canvas.width = Math.max(c.canvas.width, w);
    c.canvas.height = Math.max(c.canvas.height, h);
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, w + 2, h + 2);
  return c;
};
/** probe switches (benchmarks only; cuts never touch them) */
export const GLOBE_DEBUG: { blob: "auto" | "arc"; noDots: boolean; noMats: boolean } = { blob: "auto", noDots: false, noMats: false };
/** the rotation as a 3x3 matrix (rows), taken from d3's own geoRotation so dots and vectors agree exactly */
const rotMatrix = (rot: [number, number, number]) => {
  const R = geoRotation(rot);
  const col = (lon: number, lat: number) => toXYZ(...(R([lon, lat]) as [number, number]));
  const a = col(0, 0);
  const b = col(90, 0);
  const c = col(0, 90);
  // p' = a * p.x + b * p.y + c * p.z
  return [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]];
};

export const globePoint = (g: GlobeSpec, lon: number, lat: number) => {
  const M = rotMatrix([-(g.lon ?? CHINA_FACE.lon), -(g.lat ?? CHINA_FACE.lat), g.roll ?? 0]);
  const p = toXYZ(lon, lat);
  const X = M[0] * p[0] + M[1] * p[1] + M[2] * p[2];
  const Y = M[3] * p[0] + M[4] * p[1] + M[5] * p[2];
  const Z = M[6] * p[0] + M[7] * p[1] + M[8] * p[2];
  return { x: g.cx + g.r * Y, y: g.cy - g.r * Z, front: X };
};
export const chinaAnchor = (g: GlobeSpec) => globePoint(g, CHINA_CENTROID[0], CHINA_CENTROID[1]);
export const globeFromWorld = (cam: Cam, X: number, Y: number, R: number) => ({ cx: FRAME_W / 2 + (X - cam.cx) * cam.k, cy: FRAME_H / 2 + (Y - cam.cy) * cam.k, r: R * cam.k });
export const globeFog = (A: AirWorld, Z: number, h = 0) => ({ fog: A.fog(Z), air: A.airHex(Z, h) });

export const drawGlobe = (ctx: CanvasRenderingContext2D, g: GlobeSpec) => {
  if (g.clipY === undefined) return paintGlobe(ctx, g);
  // rising out from behind an edge: only the part above the screen row clipY is drawn
  ctx.save();
  ctx.beginPath();
  ctx.rect(-1e5, -1e5, 2e5, g.clipY + 1e5);
  ctx.clip();
  paintGlobe(ctx, g);
  ctx.restore();
};
const paintGlobe = (ctx: CanvasRenderingContext2D, g: GlobeSpec) => {
  const { cx, cy, r } = g;
  if (!(r > 0.5)) return;
  const china = c01(g.china ?? 0);
  const cover = c01(g.cover ?? 0);
  const sea = c01(g.sea ?? 0);
  const fog = c01(g.fog ?? 0);
  const air = g.air ?? AIR_MID;
  const halo = g.halo ?? 1;
  const rim = g.rim ?? 1;
  const dotAmt = c01(g.dots ?? smoothstep(80, 200, r));
  const la = (((g.light ?? 225) * Math.PI) / 180);
  const lx = Math.cos(la);
  const ly = Math.sin(la);
  // the light's centre on the disc (the lit cap) and the shading gradient that reaches the far limb
  const Lc: [number, number] = [cx + lx * 0.54 * r, cy + ly * 0.54 * r];
  const gR = 1.56 * r;
  const fogged = (s: Shade, amt: number): Shade => (amt <= 0 ? s : { hi: mixHex(s.hi, air, amt), lit: mixHex(s.lit, air, amt), mid: mixHex(s.mid, air, amt), shadow: mixHex(s.shadow, air, amt), refl: mixHex(s.refl, air, amt * 0.7) });
  const shadeOf = (s0: Shade, orange = false) => {
    const s = fogged(s0, orange ? 0.5 * fog : fog);
    const gr = ctx.createRadialGradient(Lc[0], Lc[1], 0, Lc[0], Lc[1], gR);
    gr.addColorStop(0, s.hi);
    gr.addColorStop(0.2, s.lit);
    gr.addColorStop(0.5, s.mid);
    gr.addColorStop(0.8, s.shadow);
    gr.addColorStop(0.92, s.shadow);
    gr.addColorStop(1, mixHex(s.refl, air, 0.3));
    return gr;
  };

  // projection + paths
  const rot: [number, number, number] = [-(g.lon ?? CHINA_FACE.lon), -(g.lat ?? CHINA_FACE.lat), g.roll ?? 0];
  const proj = geoOrthographic().scale(r).translate([cx, cy]).rotate(rot).clipAngle(90).precision(r > 200 ? 0.25 : 0.6);
  const disc = new Path2D();
  disc.arc(cx, cy, r, 0, TAU);
  const landP = new Path2D();
  geoPath(proj, landP)(LAND);
  const chinaFirst = isDefaultSeed(g.seed) && cover > 0 && cover < 1;
  const chinaP = china > 0.001 || chinaFirst ? new Path2D() : null;
  if (chinaP) geoPath(proj, chinaP)(CHINA);
  /** a line width that scales with the globe, within [min, max] px */
  const lw = (base: number, min: number, max = 3) => Math.min(max, Math.max(min, base * r));

  // the full-cover shortcuts
  const L = lattice();
  const landT = landTFor(g.seed);
  const landFull = cover >= 1 - 1e-6;
  const seaFull = sea >= 1 - 1e-6;

  // ---- 1. the atmosphere halo (in the air colour, stronger toward the light) ---------------------------------------
  if (halo > 0) {
    const hc = mixHex(HALO, air, 0.35 * fog);
    const hg = ctx.createRadialGradient(cx + lx * 0.04 * r, cy + ly * 0.04 * r, r * 0.97, cx, cy, r * 1.17);
    const a = 0.3 * halo * (1 - 0.5 * fog);
    hg.addColorStop(0, rgbaHex(hc, a));
    hg.addColorStop(0.35, rgbaHex(hc, a * 0.42));
    hg.addColorStop(1, rgbaHex(hc, 0));
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.18, 0, TAU);
    ctx.fill();
  }

  // ---- 2. the sea --------------------------------------------------------------------------------------------------
  ctx.save();
  ctx.clip(disc);
  if (seaFull) {
    ctx.fillStyle = shadeOf(O_SEA, true);
    ctx.fill(disc);
  } else {
    ctx.fillStyle = shadeOf(SEA);
    ctx.fill(disc);
  }

  // projected lattice (visible half only)
  const M = rotMatrix(rot);
  const sp = r * LATTICE_SPACING;
  // the view (the canvas's own rect in screen px): patches outside it are skipped (close-ups)
  const tf = ctx.getTransform();
  const vx0 = -tf.e - 4;
  const vy0 = -tf.f - 4;
  const vx1 = vx0 + ctx.canvas.width + 8;
  const vy1 = vy0 + ctx.canvas.height + 8;
  // the globe's box inside the view (whole px)
  const bx0 = Math.floor(Math.max(vx0, cx - r - 2));
  const by0 = Math.floor(Math.max(vy0, cy - r - 2));
  const bx1 = Math.ceil(Math.min(vx1, cx + r + 2));
  const by1 = Math.ceil(Math.min(vy1, cy + r + 2));
  const rm = 0.8 * sp;
  const rd = 0.3 * sp;
  // the mats' mask scale: small mats (rm < 8 px) are painted as squares into a small mask and smoothed up, so they merge
  // into soft round-edged blobs (the CPU raster's cost is the number of path edges: rects are its fast path; arcs and polygons
  // by the ten thousand cost ~10x)
  const ms = Math.min(1, 2.2 / Math.max(rm, 1e-3));
  // one tide layer: mats (merging patches that grow behind the front) and figures (the dots, first at the front); a
  // full layer skips the mats (it is one fill underneath)
  const tideLayer = (idx: Uint32Array, T: Float32Array, c: number, w: number, mat: Shade, dot: Shade, full: boolean, dotEvery = 1) => {
    if (bx1 <= bx0 || by1 <= by0) return;
    const withMats = !full && !GLOBE_DEBUG.noMats;
    const withDots = dotAmt > 0.01 && !GLOBE_DEBUG.noDots;
    const mats = new Path2D();
    const dots = new Path2D();
    let nm = 0;
    let nd = 0;
    const dotArc = rd >= 2.4 || GLOBE_DEBUG.blob === "arc";
    // big patches (close-ups: few on screen) are drawn as true discs; small ones through the soft mask
    const matArc = rm >= 8 || GLOBE_DEBUG.blob === "arc";
    const xyz = L.xyz;
    for (let j = 0; j < idx.length; j++) {
      const u = full ? 2 : (c - T[j]) / w;
      if (u <= 0) continue;
      const i3 = idx[j] * 3;
      const x = xyz[i3];
      const y = xyz[i3 + 1];
      const z = xyz[i3 + 2];
      if (M[0] * x + M[1] * y + M[2] * z <= -0.02) continue;
      const qx = cx + r * (M[3] * x + M[4] * y + M[5] * z);
      const qy = cy - r * (M[6] * x + M[7] * y + M[8] * z);
      if (qx < bx0 - rm || qx > bx1 + rm || qy < by0 - rm || qy > by1 + rm) continue;
      if (withMats) {
        const g = smoothstep(0.15, 1, u);
        if (matArc) {
          const m = rm * g;
          if (m > 0.05) {
            mats.moveTo(qx + m, qy);
            mats.arc(qx, qy, m, 0, TAU);
            nm++;
          }
        } else {
          const m = 0.886 * rm * g * ms;
          if (m > 0.02) {
            mats.rect((qx - bx0) * ms - m, (qy - by0) * ms - m, 2 * m, 2 * m);
            nm++;
          }
        }
      }
      if (withDots && (dotEvery <= 1 || hash01(idx[j] * 0.731 + 0.17) < 1 / dotEvery)) {
        const d = rd * smoothstep(0, 0.45, u);
        if (d > 0.05) {
          if (dotArc) {
            dots.moveTo(qx + d, qy);
            dots.arc(qx, qy, d, 0, TAU);
          } else {
            const h = 0.886 * d;
            dots.rect(qx - h, qy - h, 2 * h, 2 * h);
          }
          nd++;
        }
      }
    }
    if (nm && matArc) {
      ctx.fillStyle = shadeOf(mat, true);
      ctx.fill(mats);
    } else if (nm) {
      const W = bx1 - bx0;
      const H = by1 - by0;
      const mw = Math.max(1, Math.ceil(W * ms));
      const mh = Math.max(1, Math.ceil(H * ms));
      const mk = scratch(0, mw, mh);
      mk.fillStyle = "#fff";
      mk.fill(mats);
      const ly = scratch(1, W, H);
      ly.imageSmoothingEnabled = true;
      ly.imageSmoothingQuality = "high";
      ly.drawImage(mk.canvas, 0, 0, mw, mh, 0, 0, mw / ms, mh / ms);
      ly.globalCompositeOperation = "source-in";
      ly.setTransform(1, 0, 0, 1, -bx0, -by0);
      ly.fillStyle = shadeOf(mat, true);
      ly.fillRect(bx0, by0, W, H);
      ly.setTransform(1, 0, 0, 1, 0, 0);
      ly.globalCompositeOperation = "source-over";
      ctx.drawImage(ly.canvas, 0, 0, W, H, bx0, by0, W, H);
    }
    if (nd) {
      // the figures sink into their mat as the globe gets small (no sub-pixel speckle)
      ctx.fillStyle = shadeOf(avgShade(mat, dot, dotAmt), true);
      ctx.fill(dots);
    }
  };

  // ---- 3. the sea tide (under the land: the land's own fill hides its coastal spill) ---------------------------------
  if (sea > 0 && (!seaFull || dotAmt > 0.01)) tideLayer(L.seaIdx, L.seaT, sea, SEA_W, O_SEA, O_SEA_DOT, seaFull, 2); // the sea's figures at half density

  // ---- 4. the land, China, the coasts ----------------------------------------------------------------------------
  if (!landFull) {
    ctx.fillStyle = shadeOf(LANDM);
    ctx.fill(landP);
    if (chinaP) {
      ctx.globalAlpha = china;
      ctx.fillStyle = shadeOf(CREAM);
      ctx.fill(chinaP);
      ctx.globalAlpha = 1;
    }
  }

  // ---- 5. the land tide (clipped to the land) ----------------------------------------------------------------------
  if (cover > 0) {
    ctx.save();
    ctx.clip(landP);
    if (landFull) {
      ctx.fillStyle = shadeOf(O_LAND, true);
      ctx.fill(landP);
    }
    if (chinaFirst && chinaP) {
      // China's own patches stay inside China (the front sits exactly on its border at CHINA_COVERED)
      ctx.save();
      ctx.clip(chinaP);
      tideLayer(L.chinaIdx, L.chinaT, cover, LAND_W, O_LAND, O_LAND_DOT, false);
      ctx.restore();
      if (cover > WORLD_T0) tideLayer(L.restIdx, L.restT, cover, LAND_W, O_LAND, O_LAND_DOT, false);
    } else if (!landFull || dotAmt > 0.01) tideLayer(L.landIdx, landT, cover, LAND_W, O_LAND, O_LAND_DOT, landFull);
    ctx.restore();
  }

  // ---- 6. coasts (a darker local tone; orange-deep where the tide has closed over both sides) ------------------------
  const coastW = lw(0.0042, 0.7, 2.6);
  const coastMix = sea;
  ctx.lineJoin = "round";
  ctx.strokeStyle = shadeOf(avgShade(COAST, O_COAST, coastMix), coastMix > 0.5);
  ctx.lineWidth = coastW;
  ctx.globalAlpha = 0.85;
  ctx.stroke(landP);
  ctx.globalAlpha = 1;
  // China's outline (thin, darker; over the tide too, so "exactly China" reads)
  if (chinaP) {
    const covered = c01(cover / CHINA_COVERED);
    ctx.strokeStyle = shadeOf(avgShade(CHINA_LINE, O_COAST, covered), covered > 0.5);
    ctx.lineWidth = lw(0.0052, 0.8, 3.2);
    ctx.globalAlpha = china;
    ctx.stroke(chinaP);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // ---- 7. the cream rim on the upper-left limb (fogged) -----------------------------------------------------------
  if (rim > 0) {
    const ra = rim * (1 - fog);
    const rw = lw(0.011, 1.1);
    const g0: [number, number] = [cx - lx * 0.1 * r, cy - ly * 0.1 * r];
    const g1: [number, number] = [cx + lx * r, cy + ly * r];
    const rg = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
    rg.addColorStop(0, rgbaHex(CREAM_RIM, 0));
    rg.addColorStop(0.45, rgbaHex(CREAM_RIM, 0.12 * ra));
    rg.addColorStop(0.8, rgbaHex(CREAM_RIM, 0.55 * ra));
    rg.addColorStop(1, rgbaHex(CREAM_RIM, 0.85 * ra));
    ctx.save();
    ctx.clip(disc);
    ctx.strokeStyle = rg;
    ctx.lineWidth = rw;
    ctx.beginPath();
    ctx.arc(cx, cy, r - rw * 0.5, 0, TAU);
    ctx.stroke();
    // its soft inner glow
    ctx.lineWidth = rw * 5;
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(cx, cy, r - rw * 2.5, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
};

const rgbaHex = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${c01(a).toFixed(4)})`;
};

// ===================================================================================================================
// THE COMPONENTS
// ===================================================================================================================
/** one globe on its own canvas (its bbox + the halo), absolutely positioned in screen px */
export const EarthGlobe: React.FC<GlobeSpec> = (g) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const pad = 1.22 * g.r + 2;
  const x0 = Math.floor(g.cx - pad);
  const y0 = Math.floor(g.cy - pad);
  const w = Math.ceil(g.cx + pad) - x0;
  const h = Math.ceil(g.cy + pad) - y0;
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D; // CPU raster (see GlobeLayer)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(1, 0, 0, 1, -x0, -y0);
    drawGlobe(ctx, g);
  });
  return <canvas ref={ref} width={w} height={h} style={{ position: "absolute", left: x0, top: y0, width: w, height: h }} />;
};

/** the fully covered planet (one Earth's worth of AIs): the cheap variant for many copies */
export const OrangeEarth: React.FC<Omit<GlobeSpec, "cover" | "sea">> = (g) => <EarthGlobe {...g} {...ORANGE_EARTH} />;

/** many globes on one full-frame canvas, painted in array order (back to front) */
export const GlobeLayer: React.FC<{ globes: GlobeSpec[]; logMs?: string }> = ({ globes, logMs }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const tA = performance.now();
    lattice();
    const t0 = performance.now();
    // willReadFrequently keeps the canvas on the CPU raster: a Path2D of thousands of discs under a land clip is fast
    // in software and very slow on the GPU path (seconds per frame in headless Chrome)
    const ctx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    for (const g of globes) drawGlobe(ctx, g);
    // a probe's timing line (the draw calls; the canvas raster itself lands at capture)
    if (logMs) ctx.getImageData(0, 0, 1, 1); // forces the raster, so the timing includes it
    if (logMs) console.log(`[globe-ms] ${logMs} ${(performance.now() - t0).toFixed(1)} (data ${(t0 - tA).toFixed(1)})`);
  });
  return <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />;
};
