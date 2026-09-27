// Bakes the STATIC layers of EverybodyWants (sea, engraved water-lines,
// graticule, land + hand-coloured rim, 1914 borders at their dashed default,
// colonial borders, coast) into a small raster LOD pyramid, so a frame draws a
// few images instead of re-rasterising ~2.5 MB of 10m vectors.
//
//   bun scripts/bake-ww1-rasters.mjs
//
// Needs generated/components/ww1MapData.ts (scripts/build-ww1-map.mjs) and the
// camera track in EverybodyWants.tsx. Writes
//   public/ww1/lod-<name>.png           one per level (opaque)
//   public/ww1/lod-britain-solid.png    Britain with the 1914 borders SOLID (the
//                                       "status quo" wave reveals it)
//   generated/components/ww1Levels.ts   each level's world rect and scale
//
// LEVELS. `wide` covers every frame of the piece (k <= ~1.3); the crops cover
// only where the camera goes close. A level is baked at the zoom it is shown at
// (`kBake`: screen-constant stroke widths, dash lengths and water-line gaps are
// computed for that k, exactly as the vector build did) and at `s` texels per
// world px, >= the largest k it serves, so it is never magnified in its hold.
// Each crop's world rect is the union of the camera's views over its frames.

import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import {
  BORDERS_D,
  COLONIAL_D,
  GRATICULE_D,
  LAND_D,
} from "../generated/components/ww1MapData.ts";
import { CAM_TRACK, SEA, LAND, LAND_RIM, INK } from "../generated/components/EverybodyWants.tsx";

const OUT_DIR = "public/ww1";
const OUT_TS = "generated/components/ww1Levels.ts";

// [name, kBake, s, frames whose views the rect must hold]
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const DEF = [
  // wide: every frame (it is always drawn underneath, the fallback for glides)
  ["wide", 1.18, 1.32, range(0, CAM_TRACK.length - 1)],
  // each crop also holds the ends of the glides into and out of its hold, so
  // the crossfades happen on a crop, not on the magnified wide
  ["britain", 2.72, 2.8, range(96, 184)],
  ["alsace", 5.28, 5.45, range(176, 304)],
  // (no italyA crop: the britain crop, baked at k 2.72, already holds every
  // view of the Italy/Adriatic framing at k 2.8, and the picker keeps it)
  ["italyB", 2.3, 2.36, range(348, 390)],
  ["balkans", 2.23, 2.33, range(390, 506)],
  ["africa", 0.8, 0.85, range(524, 566)],
];

const viewOf = (f) => {
  const { k, cx, cy } = CAM_TRACK[f];
  const m = 10 / k; // the house sway, plus a hair
  return { x0: cx - 540 / k - m, x1: cx + 540 / k + m, y0: cy - 960 / k - m, y1: cy + 960 / k + m };
};

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

// The same stack, in the same order and weights, as the vector build drew it.
const stack = (kB, solid) => {
  const px = (v) => v / kB;
  const wlGap = 6.5 * Math.pow(kB, 0.45);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  let wl = "";
  for (let i = 3; i >= 0; i--) {
    const d = wlGap * (i + 1);
    wl += `<path d="${LAND_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
    wl += `<path d="${LAND_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
  }
  const dash = `${px(8)} ${px(5)}`;
  const borders = solid
    ? `<path d="${BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.8" stroke-width="${px(1.7)}" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="${BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `
<defs><clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath></defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${SEA}"/>
${wl}
<path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>
<path d="${COLONIAL_D}" fill="none" stroke="${INK}" stroke-opacity="0.32" stroke-width="${px(1.5)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
${borders}
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`;
};

mkdirSync(OUT_DIR, { recursive: true });
const levels = [];
const bake = (name, kB, s, r, solid = false) => {
  const W = Math.round((r.x1 - r.x0) * s);
  const H = Math.round((r.y1 - r.y0) * s);
  if (W > 8000 || H > 8000) throw new Error(`${name}: ${W}x${H} exceeds 8k`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${r.x0} ${r.y0} ${W / s} ${H / s}">${stack(kB, solid)}</svg>`;
  const t0 = Date.now();
  const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
  const file = `${OUT_DIR}/lod-${name}${solid ? "-solid" : ""}.png`;
  writeFileSync(file, png);
  console.log(`${file}: ${W}x${H}, ${(png.length / 1e6).toFixed(2)} MB, ${Date.now() - t0} ms`);
  return { W, H };
};
for (const [name, kB, s, frames] of DEF) {
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const f of frames) {
    const v = viewOf(f);
    r.x0 = Math.min(r.x0, v.x0);
    r.y0 = Math.min(r.y0, v.y0);
    r.x1 = Math.max(r.x1, v.x1);
    r.y1 = Math.max(r.y1, v.y1);
  }
  for (const key of ["x0", "y0"]) r[key] = Math.floor(r[key]);
  for (const key of ["x1", "y1"]) r[key] = Math.ceil(r[key]);
  const { W, H } = bake(name, kB, s, r);
  if (name === "britain") bake(name, kB, s, r, true);
  levels.push({ name, kBake: kB, s, x0: r.x0, y0: r.y0, w: W / s, h: H / s, W, H });
}

writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-ww1-rasters.mjs — do not edit by hand.
// The static map as a raster LOD pyramid: each level's world rect (x0, y0, w, h
// in world px), its bake zoom kBake and its texels per world px s. Images are
// public/ww1/lod-<name>.png (and lod-britain-solid.png for the wave).
export type Level = { name: string; kBake: number; s: number; x0: number; y0: number; w: number; h: number; W: number; H: number };
export const LEVELS: Level[] = ${JSON.stringify(levels, null, 2)};
`,
);
console.log(`Wrote ${OUT_TS}`);
