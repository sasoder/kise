// Bakes the STATIC map plate of RussiaAMultiple (sea, engraved water-lines,
// graticule, land + hand-coloured rim, Baikal + the 1905 Aral, the Russian
// Empire's cream hatch, 1904 Japan's orange fill + hatch, the 1904 borders,
// the coast, Japan's orange coast) into a raster LOD pyramid, so a frame
// draws one or two images instead of re-rasterising ~2 MB of 10m vectors.
// Modelled on scripts/bake-transsib-rasters.mjs.
//
//   bun scripts/bake-multiple-rasters.mjs
//
// Needs generated/components/multipleStatic.ts (scripts/build-multiple-map.mjs)
// and the camera in generated/components/multipleCamera.ts. Writes
//   public/multiple/lod-<name>.png           one per level (opaque)
//   generated/components/multipleLevels.ts   each level's world rect and scale
//
// Each level's rect is the union of the camera's views over every frame it is
// drawn in (plus the house sway), cut just past the plate's feathered bottom
// edge (the component masks the feather; below it is the page). A level is baked at kBake (screen-constant
// widths, dashes and water-line gaps computed for that zoom) and at s texels
// per world px, >= the largest k it serves. THE HATCHES are world-anchored
// with a spacing of 9 / kBake world px: kBake doubles level to level, so each
// level's hatch holds every line of the level below plus the ones between.

import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { BORDERS_D, GRATICULE_D, JP_D, LAKES_D, LAND_D, RU_BORDER_D, RU_D } from "../generated/components/multipleStatic.ts";
import { CAM_TRACK, FEATHER, LEVEL_DEF, levelDrawn, levelOps } from "../generated/components/multipleCamera.ts";
import { PLATE_BOTTOM } from "../generated/components/multipleMapData.ts";

const OUT_DIR = "public/multiple";
// the plate is baked a little past its feathered edge (the component masks it)
const MAP_END = Math.ceil(FEATHER[1]) + 4;
const OUT_TS = "generated/components/multipleLevels.ts";

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx).
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";
const ACCENT = "#FFB000";
const ACCENT_DEEP = "#D98A0C";
// one opacity ladder: full cream / second cream
export const RU_HATCH_OP = 0.5;
const RU_WASH = 0.07; // a faint cream wash: the empire reads as one pale mass
const HATCH = 9; // screen px between hatch lines at kBake

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
  const hd = px(HATCH);
  return `
<defs>
  <clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath>
  <clipPath id="lake"><path d="${LAKES_D}" clip-rule="evenodd"/></clipPath>
  <clipPath id="dry"><path d="M-5000,-5000H7000V9000H-5000Z ${LAKES_D}" clip-rule="evenodd"/></clipPath>
  <clipPath id="ru"><path d="${RU_D}" clip-rule="evenodd"/></clipPath>
  <clipPath id="jp"><path d="${JP_D}" clip-rule="evenodd"/></clipPath>
  <pattern id="ruHatch" patternUnits="userSpaceOnUse" x="0" y="0" width="${hd}" height="${hd}" patternTransform="rotate(45)">
    <rect x="${hd / 2 - px(0.8)}" y="0" width="${px(1.6)}" height="${hd}" fill="${INK}" fill-opacity="${RU_HATCH_OP}"/>
  </pattern>
  <pattern id="jpHatch" patternUnits="userSpaceOnUse" x="0" y="0" width="${hd}" height="${hd}" patternTransform="rotate(45)">
    <rect x="${hd / 2 - px(1.1)}" y="0" width="${px(2.2)}" height="${hd}" fill="${ACCENT}" fill-opacity="0.8"/>
  </pattern>
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
<g clip-path="url(#dry)">
  <path d="${LAKES_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAKES_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
</g>
<!-- THE RUSSIAN EMPIRE: cream engraved hatch at the second opacity (the
     lakes are painted over it below; resvg drops nested clips) -->
<g clip-path="url(#ru)">
  <rect x="-5000" y="-5000" width="12000" height="14000" fill="${INK}" fill-opacity="${RU_WASH}"/>
  <rect x="-5000" y="-5000" width="12000" height="14000" fill="url(#ruHatch)"/>
</g>
<!-- 1904 JAPAN: orange wash + orange hatch -->
<g clip-path="url(#jp)">
  <rect x="-5000" y="-5000" width="12000" height="14000" fill="${ACCENT_DEEP}" fill-opacity="0.24"/>
  <rect x="-5000" y="-5000" width="12000" height="14000" fill="url(#jpHatch)"/>
</g>
<path d="${LAKES_D}" fill="${SEA}" fill-rule="evenodd"/>
<g clip-path="url(#lake)">
  <path d="${LAKES_D}" fill="none" stroke="${mix(SEA, INK, 0.3)}" stroke-width="${px(2 * wlGap + 1.15)}" stroke-linejoin="round"/>
  <path d="${LAKES_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * wlGap - 1.15)}" stroke-linejoin="round"/>
</g>
<path d="${BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.32" stroke-width="${px(1.5)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${RU_BORDER_D}" fill="none" stroke="${INK}" stroke-opacity="0.55" stroke-width="${px(1.9)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>
<path d="${LAKES_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>
<path d="${JP_D}" fill="none" stroke="${ACCENT}" stroke-width="${px(2.1)}" stroke-linejoin="round"/>`;
};

mkdirSync(OUT_DIR, { recursive: true });
if (process.env.DEBUG_CROP) {
  const [x0, y0, w, h, sc] = process.env.DEBUG_CROP.split(",").map(Number);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * sc}" height="${h * sc}" viewBox="${x0} ${y0} ${w} ${h}">${stack(1)}</svg>`;
  writeFileSync(process.env.DEBUG_OUT, new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng());
  process.exit(0);
}
const levels = [];
LEVEL_DEF.forEach((L, li) => {
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const frames = [];
  CAM_TRACK.forEach(({ k }, f) => {
    if (!levelDrawn(levelOps(k), li)) return;
    const v = viewOf(f);
    if (v.y0 >= MAP_END) return; // only the page in view
    frames.push(f);
    r.x0 = Math.min(r.x0, v.x0);
    r.y0 = Math.min(r.y0, v.y0);
    r.x1 = Math.max(r.x1, v.x1);
    r.y1 = Math.max(r.y1, Math.min(v.y1, MAP_END));
  });
  for (const key of ["x0", "y0"]) r[key] = Math.floor(r[key]);
  r.x1 = Math.ceil(r.x1);
  r.y1 = Math.min(MAP_END, Math.ceil(r.y1));
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
  `// Generated by scripts/bake-multiple-rasters.mjs — do not edit by hand.
// The static map plate as a raster LOD pyramid: each level's world rect (x0,
// y0, w, h in world px), its bake zoom kBake and its texels per world px s.
// Images are public/multiple/lod-<name>.png, in LEVEL_DEF order (wide -> close).
// Every rect ends at the plate's bottom edge; below it is the page.
export type Level = { name: string; kBake: number; s: number; x0: number; y0: number; w: number; h: number; W: number; H: number };
export const LEVELS: Level[] = ${JSON.stringify(levels, null, 2)};
`,
);
console.log(`Wrote ${OUT_TS}`);
