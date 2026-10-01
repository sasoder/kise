// Bakes the STATIC layers of THE CORTES WORLD (sea, 4 engraved water-lines,
// 5 deg graticule, land + hand-coloured rim, Lake Texcoco 1519, cream coast)
// into a TILED raster LOD pyramid, so a frame draws a few 2048-texel tiles
// instead of re-rasterising ~0.8 MB of 10m vectors.
//
//   bun scripts/bake-cortes-rasters.mjs
//
// Needs generated/components/cortesStatic.ts (scripts/build-cortes-map.mjs).
// Writes
//   public/cortes/<level>-<i>-<j>.png       the tiles (opaque)
//   generated/components/cortesLevels.ts    each level's world rect, bake zoom,
//                                           texels per world px, k band, tiles
//
// LEVELS. The world is shared by every cut of the clip, so a level's rect is
// NOT the union of one camera's views: it is every view of every camera whose
// k is at least the level's band start and whose subject lies in one of the
// level's boxes (the director's list, lon/lat) anywhere in the content band of
// the frame (screen x 240..840, y 640..1060), plus the house sway. A level is
// baked at kBake (screen-constant stroke widths, dashes and water-line gaps for
// that zoom) and at s texels per world px (>= ~1 texel per screen px at the top
// of the k range it serves). The runtime (cortesShared MapStack) fades a level
// in across its k band AND by how far the view lies inside its rect, so a
// level never shows its edge, and falls back to the level below wherever a
// camera strays outside it.
//   far    k <= 0.88  fallback for anything wide
//   wide   k ~0.9-1.5 the whole Cuba-Mexico stage (the brief's whole-extent level)
//   stage  k 1.36-2.3 the voyage corridor (Cuba's south coast, Yucatan, the Bay
//                     of Campeche), Santiago, the Tenochtitlan-Cempoala corridor
//                     and the empire
//   mid    k 2.05-3.7 the corridor + empire box, western Cuba and the Yucatan
//                     Channel (to k 3.5), Cempoala
//   near   k 3.3-5.0  the corridor + empire box (to k 4), Cempoala
//   close  k 4.6-7.2  Cempoala
//   tight  k 6.6-9.8  Cempoala (sharp to k 11)
//   vtight k 9.2-14   Cempoala (sharp to k 13.5; added for cut 1's opening at k ~11)

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoConicConformal } from "d3-geo";
import { GRATICULE_D, LAKE_D, LAND_D } from "../generated/components/cortesStatic.ts";
import { PROJ } from "../generated/components/cortesMapData.ts";

const OUT_DIR = "public/cortes";
const OUT_TS = "generated/components/cortesLevels.ts";
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

// the director's boxes (cortes brief): where the subjects of the four cuts lie
const BOX = {
  stage: { lon: [-101.8, -74.5], lat: [16.2, 23.6] }, // voyage corridor, Santiago, corridor + empire to k 2
  corridor4: { lon: [-100.5, -95.3], lat: [17.6, 21.0] }, // Tenochtitlan-Cempoala, to k 4
  cuba35: { lon: [-88.5, -82.0], lat: [19.8, 23.6] }, // western Cuba, the Yucatan Channel, to k 3.5
  cempoala: { lon: [-97.6, -95.6], lat: [18.7, 20.2] }, // Cempoala close, to k 9
};
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
// a view-centre box given directly (world px): every view of k >= kMin centred in it
const centreRect = (c, kMin) => ({
  x0: c.x0 - (540 + SWAY) / kMin,
  x1: c.x1 + (540 + SWAY) / kMin,
  y0: c.y0 - (960 + SWAY) / kMin,
  y1: c.y1 + (960 + SWAY) / kMin,
});
export const LEVEL_DEF = [
  { name: "far", kBake: 0.85, s: 1.0, band: null, rects: (k) => [centreRect({ x0: -200, x1: 1300, y0: 600, y1: 1300 }, k)], kMin: 0.7 },
  { name: "wide", kBake: 1.12, s: 1.6, band: [0.8, 0.88], rects: (k) => [centreRect({ x0: 40, x1: 840, y0: 760, y1: 1100 }, k)], kMin: 0.95 },
  { name: "stage", kBake: 1.7, s: 2.35, band: [1.36, 1.52], rects: (k) => [viewRectFor(boxRect(BOX.stage), k)] },
  {
    name: "mid",
    kBake: 2.6,
    s: 3.7,
    band: [2.05, 2.3],
    rects: (k) => [viewRectFor(boxRect(BOX.corridor4), k), viewRectFor(boxRect(BOX.cuba35), k), viewRectFor(boxRect(BOX.cempoala), k)],
  },
  { name: "near", kBake: 4.1, s: 5.25, band: [3.3, 3.6], rects: (k) => [viewRectFor(boxRect(BOX.corridor4), k), viewRectFor(boxRect(BOX.cempoala), k)] },
  { name: "close", kBake: 5.8, s: 7.6, band: [4.6, 5.0], rects: (k) => [viewRectFor(boxRect(BOX.cempoala), k)] },
  { name: "tight", kBake: 8.4, s: 11, band: [6.6, 7.2], rects: (k) => [viewRectFor(boxRect(BOX.cempoala), k)] },
  // ADDED 2026-10-01: cut 1 opens on the whole crowd at k ~11-11.6
  { name: "vtight", kBake: 11, s: 13.5, band: [9.2, 9.8], rects: (k) => [viewRectFor(boxRect(BOX.cempoala), k)] },
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
  <path d="${LAKE_D}" fill="none" stroke="${mix(SEA, INK, 0.3)}" stroke-width="${px(2 * wlGap + 1.15)}" stroke-linejoin="round"/>
  <path d="${LAKE_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * wlGap - 1.15)}" stroke-linejoin="round"/>
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
  `// Generated by scripts/bake-cortes-rasters.mjs — do not edit by hand.
// The static Cortes map as a TILED raster LOD pyramid, far -> tight: each
// level's world rect (x0, y0, w, h in world px), its bake zoom kBake, its texels
// per world px s, the k band it fades in over (null = the base, always drawn),
// and its tiles (public/cortes/<f>; world rect + texel size; neighbours overlap
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
