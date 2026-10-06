// Bakes the STATIC layers of THE NORTH ATLANTIC WORLD (clip "Sheppard_Vikings",
// cuts D and E; Dwarkesh map style) into a TILED raster LOD pyramid: sea, 4
// engraved water-lines, 10 deg graticule, land + hand-coloured rim, the natural
// lakes, cream coast. NO borders. A copy of scripts/bake-cortes-rasters.mjs
// with two changes: the land is filtered per tile (only the polygons a tile can
// see are rasterised: the whole North Atlantic at 10m is ~230k vertices) and
// decimated per level (to a quarter texel), and the three deepest levels round
// the coast's corners (2-3 Chaikin passes: Natural Earth 10m is 1-2 km segments,
// 10-30 px at k 12-18).
//
//   bun scripts/bake-vik-atlantic-rasters.mjs [level,level]
//
// Needs generated/components/vikAtlanticStatic.ts (scripts/build-vik-atlantic-map.mjs).
// Writes
//   public/vik-atlantic/<level>-<i>-<j>.png      the tiles (opaque)
//   generated/components/vikAtlanticLevels.ts    each level's world rect, bake
//                                                zoom, texels per world px, k
//                                                band, tiles
//
// LEVELS (a level's rect = every view of zoom >= its band start whose CENTRE
// lies in the level's centre box, world px, plus the house sway; the runtime
// fades a level in across its k band and by how far the view lies inside its
// rect, and falls back to the level below wherever a camera strays outside):
//   far    base       sharp to k 0.75   everything (Iceland .. the Great Lakes at k ~0.45-0.6)
//   wide   0.62-0.70  sharp to k 1.3    Iceland .. the Gulf of St Lawrence
//   stage  1.15-1.30  sharp to k 2.5    south Greenland, Labrador, Newfoundland (+ Iceland's west)
//   mid    2.2-2.5    sharp to k 4.8    the route's corridor: Greenland's south .. Newfoundland
//   near   4.2-4.7    sharp to k 9      the Strait of Belle Isle, the north of Newfoundland
//   gnear  4.2-4.7    sharp to k 9      the Eastern Settlement, Greenland's south tip
//   close  7.2-8.0    sharp to k 15     the north tip of Newfoundland
//   tight  12.5-14    sharp to k 26     L'Anse aux Meadows
//   vtight 23-25.5    sharp to k 40     L'Anse aux Meadows (cut D's foothold close-up, k 28-34)
// Hold a camera OUTSIDE the bands (0.62-0.70, 1.15-1.30, 2.2-2.5, 4.2-4.7,
// 7.2-8.0, 12.5-14, 23-25.5): inside one, two levels' water-lines ghost.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { GRATICULE_D, LAKE_POLYS, LAND_POLYS } from "../generated/components/vikAtlanticStatic.ts";

const OUT_DIR = "public/vik-atlantic";
const OUT_TS = "generated/components/vikAtlanticLevels.ts";
const TILE = 2048;
const APRON = 2; // texels of overlap on a tile's right / bottom edge (no seams)

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx, Railways).
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";

const SWAY = 16;
// every view of k >= kMin whose centre lies in c (world px)
const centreRect = (c, kMin) => ({
  x0: c.x0 - (540 + SWAY) / kMin,
  x1: c.x1 + (540 + SWAY) / kMin,
  y0: c.y0 - (960 + SWAY) / kMin,
  y1: c.y1 + (960 + SWAY) / kMin,
});
export const LEVEL_DEF = [
  { name: "far", kBake: 0.5, s: 0.75, band: null, kMin: 0.4, centres: { x0: -300, x1: 1100, y0: 200, y1: 1400 } },
  { name: "wide", kBake: 0.95, s: 1.3, band: [0.62, 0.7], centres: { x0: 150, x1: 1000, y0: 350, y1: 1150 } },
  { name: "stage", kBake: 1.8, s: 2.5, band: [1.15, 1.3], centres: { x0: 250, x1: 900, y0: 400, y1: 1150 } },
  { name: "mid", kBake: 3.5, s: 4.8, band: [2.2, 2.5], centres: { x0: 330, x1: 780, y0: 480, y1: 1120 } },
  { name: "near", kBake: 6.5, s: 9, band: [4.2, 4.7], centres: { x0: 380, x1: 480, y0: 960, y1: 1090 } },
  { name: "gnear", kBake: 6.5, s: 9, band: [4.2, 4.7], centres: { x0: 650, x1: 745, y0: 540, y1: 640 } },
  { name: "close", kBake: 11, s: 15, band: [7.2, 8], centres: { x0: 405, x1: 455, y0: 1020, y1: 1075 }, chaikin: 2 },
  { name: "tight", kBake: 19, s: 26, band: [12.5, 14], centres: { x0: 415, x1: 450, y0: 1030, y1: 1068 }, chaikin: 2 },
  { name: "vtight", kBake: 31, s: 40, band: [23, 25.5], centres: { x0: 416, x1: 446, y0: 1036, y1: 1068 }, chaikin: 3 },
];

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

// -- geometry per level --------------------------------------------------------
const bboxOf = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i < ring.length; i += 2) {
    x0 = Math.min(x0, ring[i]);
    x1 = Math.max(x1, ring[i]);
    y0 = Math.min(y0, ring[i + 1]);
    y1 = Math.max(y1, ring[i + 1]);
  }
  return { x0, x1, y0, y1 };
};
/** radial decimation of a closed flat ring to `tol` world px */
const decimate = (ring, tol) => {
  const out = [ring[0], ring[1]];
  let [px, py] = [ring[0], ring[1]];
  for (let i = 2; i < ring.length; i += 2) {
    if (Math.hypot(ring[i] - px, ring[i + 1] - py) < tol) continue;
    px = ring[i];
    py = ring[i + 1];
    out.push(px, py);
  }
  return out;
};
/** one Chaikin corner-cutting pass on a closed flat ring */
const chaikin = (ring) => {
  // drop a duplicated closing vertex
  let n = ring.length / 2;
  if (n > 1 && ring[0] === ring[2 * n - 2] && ring[1] === ring[2 * n - 1]) n--;
  const out = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [ax, ay, bx, by] = [ring[2 * i], ring[2 * i + 1], ring[2 * j], ring[2 * j + 1]];
    out.push(0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by, 0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by);
  }
  return out;
};
const ringD = (ring, dp) => {
  let s = "M";
  for (let i = 0; i < ring.length; i += 2) s += `${i ? "L" : ""}${+ring[i].toFixed(dp)},${+ring[i + 1].toFixed(dp)}`;
  return `${s}Z`;
};
/** the polygons of `polys` a level can see, decimated (and rounded), as { b, d }[] */
const prepare = (polys, L, rect, minDim) => {
  const tol = 0.25 / L.s;
  const dp = L.s >= 9 ? 3 : 2;
  const m = 140 / L.kBake + 4; // strokes reach this far (the 4th water-line, the rim)
  const out = [];
  for (const poly of polys) {
    const b = bboxOf(poly[0]);
    if (b.x1 < rect.x0 - m || b.x0 > rect.x1 + m || b.y1 < rect.y0 - m || b.y0 > rect.y1 + m) continue;
    if (Math.max(b.x1 - b.x0, b.y1 - b.y0) < minDim / L.s) continue;
    let d = "";
    for (const ring0 of poly) {
      let ring = ring0;
      for (let q = 0; q < (L.chaikin ?? 0); q++) ring = chaikin(ring);
      ring = decimate(ring, tol);
      if (ring.length >= 6) d += ringD(ring, dp);
    }
    if (d) out.push({ b, d });
  }
  return out;
};
const pick = (items, tile, m) =>
  items
    .filter(({ b }) => b.x1 >= tile.x0 - m && b.x0 <= tile.x0 + tile.w + m && b.y1 >= tile.y0 - m && b.y0 <= tile.y0 + tile.h + m)
    .map((q) => q.d)
    .join("");

/** the static stack at bake zoom kB (stroke widths in screen px at kB), for a tile */
const stack = (kB, tile, land, lakes) => {
  const px = (v) => v / kB;
  const wlGap = 6.5 * Math.pow(kB, 0.45);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  const m = px(8 * wlGap + 40) + 2;
  const LAND_D = pick(land, tile, m);
  const LAKE_D = pick(lakes, tile, m);
  let wl = "";
  if (LAND_D)
    for (let i = 3; i >= 0; i--) {
      const d = wlGap * (i + 1);
      wl += `<path d="${LAND_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
      wl += `<path d="${LAND_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
    }
  const BIG = "M-9000,-9000H9000V9000H-9000Z";
  return `
<defs>
  ${LAND_D ? `<clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath>` : ""}
  ${LAKE_D ? `<clipPath id="lake"><path d="${LAKE_D}" clip-rule="evenodd"/></clipPath><clipPath id="dry"><path d="${BIG} ${LAKE_D}" clip-rule="evenodd"/></clipPath>` : ""}
</defs>
<rect x="-9000" y="-9000" width="18000" height="18000" fill="${SEA}"/>
${wl}
<path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
${
  LAND_D
    ? `<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>`
    : ""
}
${
  LAKE_D
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
${LAND_D ? `<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>` : ""}
${LAKE_D ? `<path d="${LAKE_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>` : ""}`;
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
  const q = centreRect(L.centres, kMin);
  const r = { x0: Math.floor(q.x0), y0: Math.floor(q.y0) };
  const W = Math.ceil((Math.ceil(q.x1) - r.x0) * L.s);
  const H = Math.ceil((Math.ceil(q.y1) - r.y0) * L.s);
  const nx = Math.ceil(W / TILE);
  const ny = Math.ceil(H / TILE);
  const tiles = [];
  const t0 = Date.now();
  let bytes = 0;
  const baking = !only || only.has(L.name);
  const rect = { x0: r.x0, y0: r.y0, x1: r.x0 + W / L.s, y1: r.y0 + H / L.s };
  const land = baking ? prepare(LAND_POLYS, L, rect, 0.5) : [];
  const lakes = baking ? prepare(LAKE_POLYS, L, rect, 1.5) : [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const tx = i * TILE;
      const ty = j * TILE;
      const TW = Math.min(W, tx + TILE + APRON) - tx;
      const TH = Math.min(H, ty + TILE + APRON) - ty;
      const file = `${L.name}-${i}-${j}.png`;
      const tile = { f: file, x0: r.x0 + tx / L.s, y0: r.y0 + ty / L.s, w: TW / L.s, h: TH / L.s, W: TW, H: TH };
      tiles.push(tile);
      if (!baking) continue;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="${tile.x0} ${tile.y0} ${tile.w} ${tile.h}">${stack(L.kBake, tile, land, lakes)}</svg>`;
      const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
      writeFileSync(`${OUT_DIR}/${file}`, png);
      bytes += png.length;
    }
  totalBytes += bytes;
  totalTexels += W * H;
  console.log(
    `${L.name.padEnd(6)} kBake ${L.kBake} s ${L.s} band ${JSON.stringify(L.band)}: rect x ${r.x0}..${rect.x1.toFixed(0)} y ${r.y0}..${rect.y1.toFixed(0)} = ${W}x${H} texels (${((W * H) / 1e6).toFixed(1)} Mpx), ${nx}x${ny} tiles, ${land.length} land polygons, ${(bytes / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(1)} s`,
  );
  levels.push({ name: L.name, kBake: L.kBake, s: L.s, band: L.band, x0: r.x0, y0: r.y0, w: W / L.s, h: H / L.s, W, H, tiles });
}
console.log(`total ${(totalTexels / 1e6).toFixed(0)} Mpx, ${(totalBytes / 1e6).toFixed(1)} MB, ${((Date.now() - tAll) / 1000).toFixed(0)} s`);

writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-vik-atlantic-rasters.mjs — do not edit by hand.
// The static North Atlantic map as a TILED raster LOD pyramid, far -> tight: each
// level's world rect (x0, y0, w, h in world px), its bake zoom kBake, its texels
// per world px s, the k band it fades in over (null = the base, always drawn),
// and its tiles (public/vik-atlantic/<f>; world rect + texel size; neighbours
// overlap by ${APRON} texels on the right / bottom).
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
