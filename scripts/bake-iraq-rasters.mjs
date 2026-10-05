// Bakes the STATIC layers of THE IRAQ WORLD (sea, 4 engraved water-lines,
// 5 deg graticule, land + hand-coloured rim, cream coast; NO borders: those are
// vector overlays in iraqShared) into a TILED raster LOD pyramid (a copy of
// scripts/bake-cortes-rasters.mjs for the Iraq world).
//
//   bun scripts/bake-iraq-rasters.mjs [level,level,...]
//
// Needs generated/components/iraqStatic.ts (scripts/build-iraq-map.mjs).
// Writes
//   public/iraq/<level>-<i>-<j>.png       the tiles (opaque)
//   generated/components/iraqLevels.ts    each level's world rect, bake zoom,
//                                         texels per world px, k band, tiles
//
// LEVELS (world px; Iraq + Kuwait box = IQ, x 98..978, y 372..1300 at k 1).
// A level covers every view of k >= its band start whose subject lies in its box
// anywhere in the content band (screen x 240..840, y 640..1060), + the sway.
//   far     base (k <= 0.62)  views centred on Iraq at k >= 0.4: the region
//                              (Turkey's south, Iran's west, Saudi's north, Syria,
//                              Jordan, Kuwait, the head of the Gulf) - sharp to k 0.63
//   wide    band 0.62-0.68     subject in IQ                      - sharp to k 1.2
//   mid     band 1.2-1.3       subject in IQ                      - sharp to k 2.1
//   near    band 2.0-2.15      subject in IQ                      - sharp to k 3.2
//   closeS  band 3.2-3.45      Baghdad-Samarra (lon 43.3-45.0, lat 32.9-34.6) - sharp to k 5.2
//   closeK  band 3.2-3.45      Kuwait / Basra (lon 46.4-48.6, lat 28.9-30.8)  - sharp to k 5.2
// Hold a camera OUTSIDE the bands (0.62-0.68, 1.2-1.3, 2.0-2.15, 3.2-3.45).

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoConicConformal } from "d3-geo";
import { GRATICULE_D, LAND_D } from "../generated/components/iraqStatic.ts";
import { PROJ } from "../generated/components/iraqMapData.ts";

const OUT_DIR = "public/iraq";
const OUT_TS = "generated/components/iraqLevels.ts";
const TILE = 2048;
const APRON = 2; // texels of overlap on a tile's right / bottom edge (no seams)

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx, Railways).
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
const IQ = { x0: 98, x1: 978, y0: 372, y1: 1300 }; // Iraq + Kuwait (world px)
const BOX = {
  samarra: boxRect({ lon: [43.3, 45.0], lat: [32.9, 34.6] }),
  kuwait: boxRect({ lon: [46.4, 48.6], lat: [28.9, 30.8] }),
};
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
// every view of k >= kMin whose centre lies in c
const centreRect = (c, kMin) => ({
  x0: c.x0 - (540 + SWAY) / kMin,
  x1: c.x1 + (540 + SWAY) / kMin,
  y0: c.y0 - (960 + SWAY) / kMin,
  y1: c.y1 + (960 + SWAY) / kMin,
});
export const LEVEL_DEF = [
  { name: "far", kBake: 0.5, s: 0.63, band: null, kMin: 0.4, rects: (k) => [centreRect({ x0: 300, x1: 780, y0: 600, y1: 1100 }, k)] },
  { name: "wide", kBake: 0.9, s: 1.15, band: [0.62, 0.68], rects: (k) => [viewRectFor(IQ, k)] },
  { name: "mid", kBake: 1.6, s: 2.0, band: [1.2, 1.3], rects: (k) => [viewRectFor(IQ, k)] },
  { name: "near", kBake: 2.7, s: 3.05, band: [2.0, 2.15], rects: (k) => [viewRectFor(IQ, k)] },
  { name: "closeS", kBake: 4.3, s: 5.0, band: [3.2, 3.45], rects: (k) => [viewRectFor(BOX.samarra, k)] },
  { name: "closeK", kBake: 4.3, s: 5.0, band: [3.2, 3.45], rects: (k) => [viewRectFor(BOX.kuwait, k)] },
];

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
/** the static stack at bake zoom kB (stroke widths in screen px at kB) */
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
  return `
<defs>
  <clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath>
</defs>
<rect x="-6000" y="-6000" width="14000" height="16000" fill="${SEA}"/>
${wl}
<path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`;
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
  const body = stack(L.kBake);
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
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="${tile.x0} ${tile.y0} ${tile.w} ${tile.h}">${body}</svg>`;
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
  `// Generated by scripts/bake-iraq-rasters.mjs — do not edit by hand.
// The static Iraq map as a TILED raster LOD pyramid, far -> close: each level's
// world rect (x0, y0, w, h in world px), its bake zoom kBake, its texels per
// world px s, the k band it fades in over (null = the base, always drawn), and
// its tiles (public/iraq/<f>; world rect + texel size; neighbours overlap by
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
export const LEVELS: Level[] = ${JSON.stringify(levels)};
`,
);
console.log(`Wrote ${OUT_TS}`);
