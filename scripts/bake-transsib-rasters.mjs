// Bakes the STATIC layers of TroopsOutOfAsia (sea, engraved water-lines,
// graticule, land + hand-coloured rim, Lake Baikal + the 1905 Aral, 1905
// borders, coast) into a
// raster LOD pyramid, so a frame draws one or two images instead of
// re-rasterising ~0.9 MB of 10m vectors.
//
//   bun scripts/bake-transsib-rasters.mjs
//
// Needs generated/components/transsibStatic.ts (scripts/build-transsib-map.mjs)
// and the camera in generated/components/transsibCamera.ts. Writes
//   public/transsib/lod-<name>.png           one per level (opaque)
//   generated/components/transsibLevels.ts   each level's world rect and scale
//
// LEVELS (LEVEL_DEF in transsibCamera.ts). The blend between levels is a
// function of the camera's k alone, so each level's rect is the union of the
// camera's views over every frame it is drawn in (its opacity > 0 and the level
// above not yet opaque), plus the house sway. A level is baked at kBake
// (screen-constant stroke widths, dashes and water-line gaps computed for that
// zoom, exactly as the vector reference draws them) and at s texels per world
// px, >= the largest k it serves.

import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { BORDERS_D, GRATICULE_D, LAKES_D, LAND_D } from "../generated/components/transsibStatic.ts";
import { CAM_TRACK, LEVEL_DEF, levelDrawn, levelOps } from "../generated/components/transsibCamera.ts";

const OUT_DIR = "public/transsib";
const OUT_TS = "generated/components/transsibLevels.ts";

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx).
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";

const viewOf = (f) => {
  const { k, cx, cy } = CAM_TRACK[f];
  const m = 12 / k; // the house sway, plus a hair
  return { x0: cx - 540 / k - m, x1: cx + 540 / k + m, y0: cy - 960 / k - m, y1: cy + 960 / k + m };
};

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

// The same stack, order and weights as SouthManchuriaRailway's vector map.
const stack = (kB) => {
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
  return `
<defs>
  <clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath>
  <clipPath id="lake"><path d="${LAKES_D}" clip-rule="evenodd"/></clipPath>
  <!-- land outside the lakes (Olkhon counts as land) -->
  <clipPath id="dry"><path d="M-5000,-5000H7000V9000H-5000Z ${LAKES_D}" clip-rule="evenodd"/></clipPath>
</defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${SEA}"/>
${wl}
<path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>
<!-- Lakes (Baikal, the 1905 Aral) with the sea treatment: the rim wash on the
     land round them, sea fill, one engraved water-line inside, the coast -->
<g clip-path="url(#dry)">
  <path d="${LAKES_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAKES_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
</g>
<path d="${LAKES_D}" fill="${SEA}" fill-rule="evenodd"/>
<g clip-path="url(#lake)">
  <path d="${LAKES_D}" fill="none" stroke="${mix(SEA, INK, 0.3)}" stroke-width="${px(2 * wlGap + 1.15)}" stroke-linejoin="round"/>
  <path d="${LAKES_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * wlGap - 1.15)}" stroke-linejoin="round"/>
</g>
<path d="${BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>
<path d="${LAKES_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`;
};

mkdirSync(OUT_DIR, { recursive: true });
const levels = [];
LEVEL_DEF.forEach((L, li) => {
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const frames = [];
  CAM_TRACK.forEach(({ k }, f) => {
    if (!levelDrawn(levelOps(k), li)) return;
    frames.push(f);
    const v = viewOf(f);
    r.x0 = Math.min(r.x0, v.x0);
    r.y0 = Math.min(r.y0, v.y0);
    r.x1 = Math.max(r.x1, v.x1);
    r.y1 = Math.max(r.y1, v.y1);
  });
  for (const key of ["x0", "y0"]) r[key] = Math.floor(r[key]);
  for (const key of ["x1", "y1"]) r[key] = Math.ceil(r[key]);
  const W = Math.round((r.x1 - r.x0) * L.s);
  const H = Math.round((r.y1 - r.y0) * L.s);
  if (W > 8000 || H > 8000) throw new Error(`${L.name}: ${W}x${H} exceeds 8k`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${r.x0} ${r.y0} ${W / L.s} ${H / L.s}">${stack(L.kBake)}</svg>`;
  const t0 = Date.now();
  const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
  const file = `${OUT_DIR}/lod-${L.name}.png`;
  writeFileSync(file, png);
  console.log(
    `${file}: ${W}x${H}, ${(png.length / 1e6).toFixed(2)} MB, ${Date.now() - t0} ms, frames ${frames[0]}-${frames[frames.length - 1]} (${frames.length})`,
  );
  levels.push({ name: L.name, kBake: L.kBake, s: L.s, x0: r.x0, y0: r.y0, w: W / L.s, h: H / L.s, W, H });
});

writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-transsib-rasters.mjs — do not edit by hand.
// The static map as a raster LOD pyramid: each level's world rect (x0, y0, w, h
// in world px), its bake zoom kBake and its texels per world px s. Images are
// public/transsib/lod-<name>.png, in LEVEL_DEF order (wide -> close).
export type Level = { name: string; kBake: number; s: number; x0: number; y0: number; w: number; h: number; W: number; H: number };
export const LEVELS: Level[] = ${JSON.stringify(levels, null, 2)};
`,
);
console.log(`Wrote ${OUT_TS}`);
