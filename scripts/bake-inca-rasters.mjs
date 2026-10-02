// Bakes the STATIC layers of THE PERU WORLD (sea, 4 engraved water-lines,
// 5 deg graticule, land + hand-coloured rim, Lago Titicaca + Lago Poopo, cream
// coast) into a TILED raster LOD pyramid, so a frame draws a few 2048-texel
// tiles instead of re-rasterising ~0.6 MB of 10m vectors.
//
//   bun scripts/bake-inca-rasters.mjs            (all levels)
//   bun scripts/bake-inca-rasters.mjs close,tight (only these; the others' tiles stay)
//
// Needs generated/components/incaStatic.ts (scripts/build-inca-map.mjs).
// Writes
//   public/inca/<level>-<i>-<j>.png         the tiles (opaque)
//   generated/components/incaLevels.ts      each level's world rect, bake zoom,
//                                           texels per world px, k band, tiles
//
// LEVELS (the Cortes pattern, bake-cortes-rasters.mjs). A level's rect is every
// view of every camera whose k is at least the level's band start and whose
// subject lies in the level's box (lon/lat) anywhere in the level's screen band
// (+ the house sway + the runtime's 48 px cover fade). A level is baked at kBake
// (screen-constant stroke widths, dashes and water-line gaps for that zoom) and
// at s texels per world px (>= ~0.95 texel per screen px up to k = s / 0.95).
// The runtime (incaShared MapStack) fades a level in across its k band AND by
// how far the view lies inside its rect, so a level never shows its edge.
//   far    base       the whole of western South America at k >= 0.75
//   wide   0.80-0.88  THE REALM WIDE (k ~1): sharp to k 1.68
//   stage  1.45-1.60  the Tumbes box anywhere in screen y 300..1060 (the dive's
//                     early frames, the speck still high in the frame); to 2.84
//   mid    2.35-2.60  the Tumbes box, screen y 300..1060; to 4.6
//   near   3.90-4.30  the Tumbes box, screen y 420..1060; to 7.7
//   close  6.60-7.20  the Tumbes box, screen y 560..1060; to 12.6
//   tight  11.0-12.0  the Tumbes box, the content band y 640..1060; to 21.6
// The Tumbes box = the brief's lon -81.5 ... -79.5, lat -3.0 ... -5.5 (Tumbes
// and the coast south to Piura).

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoConicConformal } from "d3-geo";
import { GRATICULE_D, LAKES_D, LAND_D, LAND_WL_D } from "../generated/components/incaStatic.ts";
import { PROJ } from "../generated/components/incaMapData.ts";

const OUT_DIR = "public/inca";
const OUT_TS = "generated/components/incaLevels.ts";
const TILE = 2048;
const APRON = 2; // texels of overlap on a tile's right / bottom edge (no seams)
const COVER_FADE = 48; // the runtime's cover fade (screen px)

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx, Railways, Cortes).
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";

const projection = geoConicConformal().parallels(PROJ.parallels).rotate(PROJ.rotate).scale(PROJ.scale).translate(PROJ.translate);
const boxRect = ({ lon, lat }) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i <= 20; i++)
    for (let j = 0; j <= 20; j++) {
      const [x, y] = projection([lon[0] + ((lon[1] - lon[0]) * i) / 20, lat[0] + ((lat[1] - lat[0]) * j) / 20]);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  return { x0, x1, y0, y1 };
};
const TUMBES_BOX = { lon: [-81.5, -79.5], lat: [-5.5, -3.0] };
const SWAY = 16;
/** every view at k >= kMin of a subject in world rect r anywhere in screen x sx0..sx1, y sy0..sy1 */
const viewsOf = (r, kMin, [sx0, sx1, sy0, sy1]) => {
  const m = (SWAY + COVER_FADE) / kMin;
  return {
    x0: r.x0 - sx1 / kMin - m,
    x1: r.x1 + (1080 - sx0) / kMin + m,
    y0: r.y0 - sy1 / kMin - m,
    y1: r.y1 + (1920 - sy0) / kMin + m,
  };
};
/** every view at k >= kMin whose centre lies in world rect c */
const centreRect = (c, kMin) => {
  const m = (SWAY + COVER_FADE) / kMin;
  return { x0: c.x0 - 540 / kMin - m, x1: c.x1 + 540 / kMin + m, y0: c.y0 - 960 / kMin - m, y1: c.y1 + 960 / kMin + m };
};
const TB = boxRect(TUMBES_BOX);
export const LEVEL_DEF = [
  { name: "far", kBake: 0.8, s: 0.9, band: null, kMin: 0.75, rect: (k) => centreRect({ x0: 380, x1: 700, y0: 700, y1: 1180 }, k) },
  { name: "wide", kBake: 1.1, s: 1.6, band: [0.8, 0.88], rect: (k) => centreRect({ x0: 380, x1: 700, y0: 640, y1: 1120 }, k) },
  { name: "stage", kBake: 1.95, s: 2.7, band: [1.45, 1.6], rect: (k) => viewsOf(TB, k, [200, 880, 300, 1060]) },
  { name: "mid", kBake: 3.2, s: 4.4, band: [2.35, 2.6], rect: (k) => viewsOf(TB, k, [200, 880, 300, 1060]) },
  { name: "near", kBake: 5.3, s: 7.3, band: [3.9, 4.3], rect: (k) => viewsOf(TB, k, [240, 840, 420, 1060]) },
  { name: "close", kBake: 8.8, s: 12, band: [6.6, 7.2], rect: (k) => viewsOf(TB, k, [240, 840, 560, 1060]) },
  { name: "tight", kBake: 15, s: 20.5, band: [11, 12], rect: (k) => viewsOf(TB, k, [240, 840, 640, 1060]) },
];

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
// the lakes' bbox (world px): their layers go only on the tiles that touch them
// (resvg panics on a clipped group whose content misses the canvas)
const LAKES_BOX = (() => {
  const nums = LAKES_D.match(/-?\d+(\.\d+)?/g).map(Number);
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    x0 = Math.min(x0, nums[i]);
    x1 = Math.max(x1, nums[i]);
    y0 = Math.min(y0, nums[i + 1]);
    y1 = Math.max(y1, nums[i + 1]);
  }
  return { x0, x1, y0, y1 };
})();
/** the static stack at bake zoom kB (stroke widths in screen px at kB), for a tile */
const stack = (kB, tile) => {
  const m = 40 / kB + 2;
  const lakeHere =
    tile.x0 < LAKES_BOX.x1 + m && tile.x0 + tile.w > LAKES_BOX.x0 - m && tile.y0 < LAKES_BOX.y1 + m && tile.y0 + tile.h > LAKES_BOX.y0 - m;
  const px = (v) => v / kB;
  const wlGap = 6.5 * Math.pow(kB, 0.45);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  let wl = "";
  for (let i = 3; i >= 0; i--) {
    const d = wlGap * (i + 1);
    wl += `<path d="${LAND_WL_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
    wl += `<path d="${LAND_WL_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
  }
  // a lake's single engraved water-line sits closer to its shore (the lakes are small)
  const lakeGap = Math.min(wlGap, 4.2 * Math.pow(kB, 0.45));
  return `
<defs>
  <clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath>
  <clipPath id="lake"><path d="${LAKES_D}" clip-rule="evenodd"/></clipPath>
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
${
  lakeHere
    ? `<g clip-path="url(#dry)">
  <path d="${LAKES_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAKES_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
</g>
<path d="${LAKES_D}" fill="${SEA}" fill-rule="evenodd"/>
<g clip-path="url(#lake)">
  <path d="${LAKES_D}" fill="none" stroke="${mix(SEA, INK, 0.3)}" stroke-width="${px(2 * lakeGap + 1.15)}" stroke-linejoin="round"/>
  <path d="${LAKES_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * lakeGap - 1.15)}" stroke-linejoin="round"/>
</g>`
    : ""
}
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>
${lakeHere ? `<path d="${LAKES_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>` : ""}`;
};

mkdirSync(OUT_DIR, { recursive: true });
const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
// remove only the tiles of the levels being baked (other cuts may be rendering from the rest)
for (const f of readdirSync(OUT_DIR)) if (f.endsWith(".png") && (!only || only.has(f.split("-")[0]))) rmSync(`${OUT_DIR}/${f}`);
const levels = [];
let totalBytes = 0;
let totalTexels = 0;
let totalTiles = 0;
const tAll = Date.now();
for (const L of LEVEL_DEF) {
  const kMin = L.band ? L.band[0] : L.kMin;
  const q = L.rect(kMin);
  const r = { x0: Math.floor(q.x0), y0: Math.floor(q.y0), x1: q.x1, y1: q.y1 };
  const W = Math.ceil((Math.ceil(r.x1) - r.x0) * L.s);
  const H = Math.ceil((Math.ceil(r.y1) - r.y0) * L.s);
  const nx = Math.ceil(W / TILE);
  const ny = Math.ceil(H / TILE);
  const tiles = [];
  const t0 = Date.now();
  let bytes = 0;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const tx = i * TILE;
      const ty = j * TILE;
      const TW = Math.min(W, tx + TILE + APRON) - tx;
      const TH = Math.min(H, ty + TILE + APRON) - ty;
      const file = `${L.name}-${i}-${j}.png`;
      const tile = { f: file, x0: r.x0 + tx / L.s, y0: r.y0 + ty / L.s, w: TW / L.s, h: TH / L.s, W: TW, H: TH };
      tiles.push(tile);
      if (only && !only.has(L.name)) continue;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="${tile.x0} ${tile.y0} ${tile.w} ${tile.h}">${stack(L.kBake, tile)}</svg>`;
      const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
      writeFileSync(`${OUT_DIR}/${file}`, png);
      bytes += png.length;
    }
  totalBytes += bytes;
  totalTexels += W * H;
  totalTiles += tiles.length;
  console.log(
    `${L.name.padEnd(6)} kBake ${L.kBake} s ${L.s} band ${JSON.stringify(L.band)}: rect x ${r.x0}..${(r.x0 + W / L.s).toFixed(0)} y ${r.y0}..${(r.y0 + H / L.s).toFixed(0)} = ${W}x${H} texels (${((W * H) / 1e6).toFixed(1)} Mpx), ${nx}x${ny} tiles, ${(bytes / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(1)} s`,
  );
  levels.push({ name: L.name, kBake: L.kBake, s: L.s, band: L.band, x0: r.x0, y0: r.y0, w: W / L.s, h: H / L.s, W, H, tiles });
}
console.log(`total ${totalTiles} tiles, ${(totalTexels / 1e6).toFixed(0)} Mpx, ${(totalBytes / 1e6).toFixed(1)} MB, ${((Date.now() - tAll) / 1000).toFixed(0)} s`);

writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-inca-rasters.mjs — do not edit by hand.
// The static Peru map as a TILED raster LOD pyramid, far -> tight: each level's
// world rect (x0, y0, w, h in world px), its bake zoom kBake, its texels per
// world px s, the k band it fades in over (null = the base, always drawn), and
// its tiles (public/inca/<f>; world rect + texel size; neighbours overlap by
// ${APRON} texels on the right / bottom).
export type Tile = { f: string; x0: number; y0: number; w: number; h: number; W: number; H: number };
export type Level = {
  name: string;
  kBake: number;
  s: number;
  band: [number, number] | null;
  x0: number;
  y0: number;
  w: number;
  h: number;
  W: number;
  H: number;
  tiles: Tile[];
};
export const LEVELS: Level[] = ${JSON.stringify(levels, null, 1)};
`,
);
console.log(`Wrote ${OUT_TS}`);
