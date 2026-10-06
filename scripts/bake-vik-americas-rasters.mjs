// Bakes the STATIC layers of THE AMERICAS WORLD (clip "Sheppard_Vikings": sea,
// 4 engraved water-lines, 10 deg graticule, land + hand-coloured rim, Lakes
// Titicaca and Poopo, cream coast; NO borders) into a TILED raster LOD pyramid.
// A copy of scripts/bake-cortes-rasters.mjs for this world.
//
//   bun scripts/bake-vik-americas-rasters.mjs [level,level]
//
// Needs generated/components/vikAmericasStatic.ts (scripts/build-vik-americas-map.mjs).
// Writes
//   public/vik-americas/<level>-<i>-<j>.png        the tiles (opaque)
//   generated/components/vikAmericasLevels.ts      each level's world rect, bake
//                                                  zoom, texels per world px, k
//                                                  band, tiles
//
// LEVELS (world px == screen px at k 1, THE WIDE: both realms + Hispaniola):
//   far   k <= 1.30        s 1.5 texels / world px (sharp to k 1.58); every view of
//                          k >= 0.85 whose centre lies in x 300..800, y 700..1200
//   near  band k 1.30-1.45 s 2.75 (sharp to k 2.9); every view of k >= 1.30 whose
//                          subject lies in the stage box (lon 112 W .. 58 W, lat
//                          28 N .. 24 S) anywhere in the content band of the frame
//                          (screen x 240..840, y 640..1060), plus the house sway
// Hold a camera OUTSIDE the band k 1.30-1.45 (inside it two levels' water-lines
// ghost); crossing it in a move is fine.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { GRATICULE_D, LAKES_D, LAND_D } from "../generated/components/vikAmericasStatic.ts";
import { PROJ } from "../generated/components/vikAmericasMapData.ts";

const OUT_DIR = "public/vik-americas";
const OUT_TS = "generated/components/vikAmericasLevels.ts";
const TILE = 2048;
const APRON = 2; // texels of overlap on a tile's right / bottom edge (no seams)

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx, Railways).
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";

const mercDeg = (lat) => (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const P = ([lon, lat]) => [PROJ.x0 + (lon - PROJ.lon0) * PROJ.pxPerDeg, PROJ.yEq - PROJ.pxPerDeg * mercDeg(lat)];
const boxRect = ({ lon, lat }) => {
  const a = P([lon[0], lat[1]]);
  const b = P([lon[1], lat[0]]);
  return { x0: a[0], x1: b[0], y0: a[1], y1: b[1] };
};
const BOX = { stage: { lon: [-112, -58], lat: [-24, 28] } };
// subject anywhere in the content band: screen x 240..840, y 640..1060
const SUBJ_X = 300;
const SUBJ_UP = 320;
const SUBJ_DOWN = 100;
const SWAY = 16;
const viewRectFor = (r, kMin) => ({
  x0: r.x0 - (SUBJ_X + 540 + SWAY) / kMin,
  x1: r.x1 + (SUBJ_X + 540 + SWAY) / kMin,
  y0: r.y0 - (SUBJ_DOWN + 960 + SWAY) / kMin,
  y1: r.y1 + (SUBJ_UP + 960 + SWAY) / kMin,
});
const centreRect = (c, kMin) => ({
  x0: c.x0 - (540 + SWAY) / kMin,
  x1: c.x1 + (540 + SWAY) / kMin,
  y0: c.y0 - (960 + SWAY) / kMin,
  y1: c.y1 + (960 + SWAY) / kMin,
});
export const LEVEL_DEF = [
  { name: "far", kBake: 1.0, s: 1.5, band: null, rects: (k) => [centreRect({ x0: 300, x1: 800, y0: 700, y1: 1200 }, k)], kMin: 0.85 },
  { name: "near", kBake: 2.0, s: 2.75, band: [1.3, 1.45], rects: (k) => [viewRectFor(boxRect(BOX.stage), k)] },
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
    wl += `<path d="${LAND_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
    wl += `<path d="${LAND_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
  }
  // a lake's single engraved water-line sits close to its shore (the lakes are small)
  const lakeGap = 3.2;
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
  <path d="${LAKES_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(8)}" stroke-linejoin="round"/>
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
const tAll = Date.now();
for (const L of LEVEL_DEF) {
  const kMin = L.band ? L.band[0] : L.kMin;
  const rs = L.rects(kMin);
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const q of rs) {
    r.x0 = Math.min(r.x0, q.x0);
    r.y0 = Math.min(r.y0, q.y0);
    r.x1 = Math.max(r.x1, q.x1);
    r.y1 = Math.max(r.y1, q.y1);
  }
  r.x0 = Math.floor(r.x0);
  r.y0 = Math.floor(r.y0);
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
  console.log(
    `${L.name.padEnd(6)} kBake ${L.kBake} s ${L.s} band ${JSON.stringify(L.band)}: rect x ${r.x0}..${(r.x0 + W / L.s).toFixed(0)} y ${r.y0}..${(r.y0 + H / L.s).toFixed(0)} = ${W}x${H} texels (${((W * H) / 1e6).toFixed(1)} Mpx), ${nx}x${ny} tiles, ${(bytes / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(1)} s`,
  );
  levels.push({ name: L.name, kBake: L.kBake, s: L.s, band: L.band, x0: r.x0, y0: r.y0, w: W / L.s, h: H / L.s, W, H, tiles });
}
console.log(`total ${(totalTexels / 1e6).toFixed(0)} Mpx, ${(totalBytes / 1e6).toFixed(1)} MB, ${((Date.now() - tAll) / 1000).toFixed(0)} s`);

writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-vik-americas-rasters.mjs — do not edit by hand.
// The static Americas map as a TILED raster LOD pyramid: each level's world rect
// (x0, y0, w, h in world px), its bake zoom kBake, its texels per world px s, the
// k band it fades in over (null = the base, always drawn), and its tiles
// (public/vik-americas/<f>; world rect + texel size; neighbours overlap by
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
