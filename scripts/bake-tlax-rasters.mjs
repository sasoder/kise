// Bakes the VALLEY LEVELS of THE TLAXCALA WORLD (clip
// "Sheppard_Tlaxcalans_thought_they_used_Cortes"): a copy of
// scripts/bake-cortes-rasters.mjs for three deep levels over the Valley of
// Mexico, Tlaxcala and Cholula, drawn ON TOP of the shared Cortes pyramid
// (public/cortes, cortesLevels.ts; never re-baked here) by tlaxShared's
// MapStack. Same static stack (sea, water-lines, graticule, land + rim, cream
// coast) from cortesStatic.ts, except Lake Texcoco, which is the SMOOTHED ring
// of tlaxStatic.ts (scripts/build-tlax-map.mjs; the same ring the overlays cut
// out of the empire), and its inner water-line, which sits a constant 2.0 world
// px inside the shore in every valley level (the Cortes tight level's distance),
// so crossing a band never doubles it.
//
//   bun scripts/bake-tlax-rasters.mjs
//
// Writes
//   public/tlax/<level>-<i>-<j>.png        the tiles (opaque)
//   generated/components/tlaxLevels.ts     each level's world rect, bake zoom,
//                                          texels per world px, k band, tiles
//
// LEVELS (the subject anywhere in the VALLEY BOX, lon 99.45 W - 97.40 W, lat
// 18.62 N - 19.95 N (the brief's box, extended south and east to take cut A's
// claim and its pen line), anywhere in the content band of the frame (screen x
// 240..840, y 640..1060), plus the house sway):
//   valley   k 7.6-8.4 band, kBake 12, s 16   (sharp to k 16.8)
//   valley2  k 15.2-16.4,    kBake 20, s 27   (sharp to k 28.4)
//   valley3  k 25-27,        kBake 31, s 42.5 (sharp to k 44.7)
// Hold a camera OUTSIDE the bands (k 7.6-8.4, 15.2-16.4, 25-27).

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoConicConformal } from "d3-geo";
import { GRATICULE_D, LAND_D } from "../generated/components/cortesStatic.ts";
import { LAKE_SMOOTH_D as LAKE_D } from "../generated/components/tlaxStatic.ts";
import { PROJ } from "../generated/components/cortesMapData.ts";

const OUT_DIR = "public/tlax";
const OUT_TS = "generated/components/tlaxLevels.ts";
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

// the valley box (lon / lat)
const BOX = { valley: { lon: [-99.45, -97.4], lat: [18.62, 19.95] } };
// subject anywhere in the content band: screen x 240..840, y 640..1060
const SUBJ_X = 300;
const SUBJ_UP = 320; // the subject as high as y 640 -> the view centre 320/k below it
const SUBJ_DOWN = 100; // as low as y 1060 -> the view centre 100/k above it
const SWAY = 16;
const viewRectFor = (r, kMin) => ({
  x0: r.x0 - (SUBJ_X + 540 + SWAY) / kMin,
  x1: r.x1 + (SUBJ_X + 540 + SWAY) / kMin,
  y0: r.y0 - (SUBJ_DOWN + 960 + SWAY) / kMin,
  y1: r.y1 + (SUBJ_UP + 960 + SWAY) / kMin,
});
const WL_WORLD = 2.0; // the lake's inner water-line, world px inside the shore (every valley level)
export const LEVEL_DEF = [
  { name: "valley", kBake: 12, s: 16, band: [7.6, 8.4], rects: (k) => [viewRectFor(boxRect(BOX.valley), k)] },
  { name: "valley2", kBake: 20, s: 27, band: [15.2, 16.4], rects: (k) => [viewRectFor(boxRect(BOX.valley), k)] },
  { name: "valley3", kBake: 31, s: 42.5, band: [25, 27], rects: (k) => [viewRectFor(boxRect(BOX.valley), k)] },
];

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
// Lake Texcoco's bbox (world px): its layers go only on the tiles that touch it
// (resvg panics on a clipped group whose content misses the canvas)
const LAKE_BOX = (() => {
  const nums = LAKE_D.match(/-?\d+(\.\d+)?/g).map(Number);
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
    tile.x0 < LAKE_BOX.x1 + m && tile.x0 + tile.w > LAKE_BOX.x0 - m && tile.y0 < LAKE_BOX.y1 + m && tile.y0 + tile.h > LAKE_BOX.y0 - m;
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
  <clipPath id="lake"><path d="${LAKE_D}" clip-rule="evenodd"/></clipPath>
  <clipPath id="dry"><path d="M-5000,-5000H7000V9000H-5000Z ${LAKE_D}" clip-rule="evenodd"/></clipPath>
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
  <path d="${LAKE_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAKE_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
</g>
<path d="${LAKE_D}" fill="${SEA}" fill-rule="evenodd"/>
<g clip-path="url(#lake)">
  <path d="${LAKE_D}" fill="none" stroke="${mix(SEA, INK, 0.3)}" stroke-width="${2 * WL_WORLD + px(1.15)}" stroke-linejoin="round"/>
  <path d="${LAKE_D}" fill="none" stroke="${SEA}" stroke-width="${2 * WL_WORLD - px(1.15)}" stroke-linejoin="round"/>
</g>`
    : ""
}
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>
${lakeHere ? `<path d="${LAKE_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>` : ""}`;
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
      if (process.env.DBG) console.log(`tile ${file} ${TW}x${TH} vb ${tile.x0} ${tile.y0} ${tile.w} ${tile.h}`);
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
  `// Generated by scripts/bake-tlax-rasters.mjs — do not edit by hand.
// The Tlaxcala world's VALLEY LEVELS (drawn over the Cortes pyramid), each
// level's world rect (x0, y0, w, h in world px), its bake zoom kBake, its texels
// per world px s, the k band it fades in over (null = the base, always drawn),
// and its tiles (public/tlax/<f>; world rect + texel size; neighbours overlap
// by ${APRON} texels on the right / bottom).
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
