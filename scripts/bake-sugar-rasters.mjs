// Bakes the STATIC layers of THE SUGAR WORLD (sea, 4 engraved water-lines, 10 deg
// graticule, land + hand-coloured rim, cream coast; NO borders, NO fills: those are
// vector overlays in sugarShared) into a TILED raster LOD pyramid (the pattern of
// scripts/bake-iraq-rasters.mjs, on the sugar world's Mercator).
//
//   bun scripts/bake-sugar-rasters.mjs [level,level,...]
//
// Needs generated/components/sugarStatic.ts (scripts/build-sugar-map.mjs).
// Writes
//   public/sugar/<level>-<i>-<j>.png       the tiles (opaque)
//   generated/components/sugarLevels.ts    each level's world rect, bake zoom,
//                                          texels per world px, k band, tiles
//
// LEVELS (k = screen px per world px; 40 world px per degree). A level fades in over
// its k band and covers every camera whose CENTRE lies in its centre box (lon/lat)
// at k >= the band start (the half-frame + sway are added); outside it the level
// fades out by levelWeights' cover test and the level below shows.
//   globe   base            the far page, lon -200..200, lat -85..87 (polar Mercator
//                            shows above ~lat 68 / below -40 at k < ~0.32) - sharp to k 0.2
//   world   band 0.19-0.21  lon -190..190, lat -85..87                         - sharp to k 0.45
//   atlantic band 0.46-0.50 centres lon -100..30, lat 5..62                    - sharp to k 1.25
//   indian   band 0.46-0.50 centres lon 45..95, lat -30..25                    - sharp to k 1.25
//   usEast   band 1.25-1.35 centres lon -92..-72, lat 29..42                   - sharp to k 3.0
//   carib    band 1.25-1.35 centres lon -85..-60, lat 11..24                   - sharp to k 3.0
//   channel  band 1.25-1.35 centres lon -11..6, lat 35.5..51.5 (Channel, Biscay,
//                            Iberia, Gibraltar, Menorca)                       - sharp to k 3.0
//   capeVerde band 1.25-1.35 centres lon -25.5..-21, lat 14..17.5              - sharp to k 3.0
//   southIndia band 1.25-1.35 centres lon 74..81, lat 9..14 (Mahe, Pondicherry) - sharp to k 3.0
//   lowerMiss band 2.6-2.85 centres lon -92.5..-89, lat 29.3..31 (New Orleans, Manchac,
//                            Baton Rouge)                                     - sharp to k 4.2
// HOLD THE CAMERA OUTSIDE THE BANDS (0.19-0.21, 0.46-0.50, 1.25-1.35, 2.6-2.85).
// Everything outside the rasters is the scene's PAGE colour = the polar fade's colour.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LAND_D, LAND_WIDE_D } from "../generated/components/sugarStatic.ts";

const OUT_DIR = "public/sugar";
const OUT_TS = "generated/components/sugarLevels.ts";
const TILE = 2048;
const APRON = 2;

const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";

// the projection (identical to the build)
const PPD = 40;
const LON0 = -110;
const M = (lat) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
const MERC_TOP = M(68);
const px = (lon) => PPD * (lon - LON0);
const py = (lat) => PPD * (MERC_TOP - M(lat));
const SWAY = 16; // screen px

/** world rect of the region where views at k >= kMin centred in the box can see */
const centreRect = ({ lon, lat }, kMin) => ({
  x0: px(lon[0]) - (540 + SWAY) / kMin,
  x1: px(lon[1]) + (540 + SWAY) / kMin,
  y0: py(lat[1]) - (960 + SWAY) / kMin,
  y1: py(lat[0]) + (960 + SWAY) / kMin,
});
const llRect = ({ lon, lat }) => ({ x0: px(lon[0]), x1: px(lon[1]), y0: py(lat[1]), y1: py(lat[0]) });

export const LEVEL_DEF = [
  { name: "globe", kBake: 0.18, s: 0.2, band: null, wide: true, rect: () => llRect({ lon: [-200, 200], lat: [-85, 87] }) },
  { name: "world", kBake: 0.4, s: 0.45, band: [0.19, 0.21], wide: true, rect: () => llRect({ lon: [-190, 190], lat: [-85, 87] }) },
  { name: "atlantic", kBake: 1.0, s: 1.25, band: [0.46, 0.5], rect: (k) => centreRect({ lon: [-100, 30], lat: [5, 62] }, k) },
  { name: "indian", kBake: 1.0, s: 1.25, band: [0.46, 0.5], rect: (k) => centreRect({ lon: [45, 95], lat: [-30, 25] }, k) },
  { name: "usEast", kBake: 2.4, s: 3.0, band: [1.25, 1.35], rect: (k) => centreRect({ lon: [-92, -72], lat: [29, 42] }, k) },
  { name: "carib", kBake: 2.4, s: 3.0, band: [1.25, 1.35], rect: (k) => centreRect({ lon: [-85, -60], lat: [11, 24] }, k) },
  { name: "channel", kBake: 2.4, s: 3.0, band: [1.25, 1.35], rect: (k) => centreRect({ lon: [-11, 6], lat: [35.5, 51.5] }, k) },
  { name: "capeVerde", kBake: 2.4, s: 3.0, band: [1.25, 1.35], rect: (k) => centreRect({ lon: [-25.5, -21], lat: [14, 17.5] }, k) },
  { name: "southIndia", kBake: 2.4, s: 3.0, band: [1.25, 1.35], rect: (k) => centreRect({ lon: [74, 81], lat: [9, 14] }, k) },
  // CHANGED 2026-10-05 (CD): the lower Mississippi close-up (Louisiana lands at k 3.6)
  { name: "lowerMiss", kBake: 3.6, s: 4.2, band: [2.6, 2.85], rect: (k) => centreRect({ lon: [-92.5, -89], lat: [29.3, 31] }, k) },
];

// ---------------------------------------------------------------------------
// land rings (world px) and a per-tile clip (Sutherland-Hodgman with a margin
// wider than any stroke, so the clip's bridges never show)
// ---------------------------------------------------------------------------
const parseRings = (d) =>
  d
    .split("M")
    .filter(Boolean)
    .map((s) =>
      s
        .replace(/Z$/, "")
        .split("L")
        .map((p) => p.split(",").map(Number)),
    );
const areaOf = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
  return Math.abs(a / 2);
};
const RINGS = parseRings(LAND_D).map((r) => ({ r, b: bbox(r), a: areaOf(r) }));
const RINGS_WIDE = parseRings(LAND_WIDE_D).map((r) => ({ r, b: bbox(r), a: areaOf(r) }));
function bbox(r) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of r) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}
const shRing = (ring, [x0, y0, x1, y1]) => {
  const inside = [(p) => p[0] >= x0, (p) => p[0] <= x1, (p) => p[1] >= y0, (p) => p[1] <= y1];
  const cut = [
    (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])],
    (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1],
  ];
  let pts = ring;
  for (let e = 0; e < 4 && pts.length; e++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length];
      const b = pts[i];
      const ia = inside[e](a);
      const ib = inside[e](b);
      if (ib) {
        if (!ia) out.push(cut[e](a, b));
        out.push(b);
      } else if (ia) out.push(cut[e](a, b));
    }
    pts = out;
  }
  return pts.length >= 3 ? pts : null;
};
const f2 = (v) => Math.round(v * 100) / 100;
// CHANGED 2026-10-05 (Fable's A/B review): concentric water-lines round tiny islands
// read as targets / bubbles. A ring's water-lines by its SCREEN area at the bake zoom
// (a = world px^2 x kB^2): >= WL_FULL all 4; >= WL_ONE only the innermost; below that
// none (the cream coast stroke stays). North of 60 N (the Arctic archipelago) at most 1.
const WL_FULL = 160 * 160;
const WL_ONE = 42 * 42;
const ARCTIC_Y = py(60);
const wlCount = (q, kB) => {
  const sa = q.a * kB * kB;
  const n = sa >= WL_FULL ? 4 : sa >= WL_ONE ? 1 : 0;
  return q.b[3] < ARCTIC_Y ? Math.min(n, 1) : n;
};
const landFor = (rings, rect, filter = () => true) => {
  let d = "";
  for (const q of rings) {
    const { r, b } = q;
    if (!filter(q)) continue;
    if (b[2] < rect[0] || b[0] > rect[2] || b[3] < rect[1] || b[1] > rect[3]) continue;
    const inside = b[0] >= rect[0] && b[2] <= rect[2] && b[1] >= rect[1] && b[3] <= rect[3];
    const c = inside ? r : shRing(r, rect);
    if (!c) continue;
    d += `M${c.map(([x, y]) => `${f2(x)},${f2(y)}`).join("L")}Z`;
  }
  return d;
};
const gratFor = (rect) => {
  let d = "";
  for (let lon = -180; lon <= 180; lon += 10) {
    const x = px(lon);
    if (x >= rect[0] && x <= rect[2]) d += `M${f2(x)},${f2(rect[1])}L${f2(x)},${f2(rect[3])}`;
  }
  for (let lat = -80; lat <= 80; lat += 10) {
    const y = py(lat);
    if (y >= rect[1] && y <= rect[3]) d += `M${f2(rect[0])},${f2(y)}L${f2(rect[2])},${f2(y)}`;
  }
  return d;
};

// CHANGED 2026-10-05 (Fable): THE POLAR PAGE FADE. Poleward of 70 N and 38 S the map
// (land, sea, water-lines, coast) fades into the dark atlas page (the sea tone darkened
// 40 %; the grain comes from the paper on top), feathered over 9-11 deg of latitude:
// map 69 N -> page 78 N; map 37 S -> page 48 S. A world wide reads as a band floating
// on the dark page. No neatline.
const PAGE_DARK = "rgb(16,20,23)";
const FADE = { n1: 69, n0: 78, s1: -37, s0: -48 };
const polarFade = () => {
  const yN0 = py(FADE.n0);
  const yN1 = py(FADE.n1);
  const yS1 = py(FADE.s1);
  const yS0 = py(FADE.s0);
  return `<defs>
  <linearGradient id="pfN" gradientUnits="userSpaceOnUse" x1="0" y1="${yN0}" x2="0" y2="${yN1}"><stop offset="0" stop-color="${PAGE_DARK}" stop-opacity="1"/><stop offset="1" stop-color="${PAGE_DARK}" stop-opacity="0"/></linearGradient>
  <linearGradient id="pfS" gradientUnits="userSpaceOnUse" x1="0" y1="${yS1}" x2="0" y2="${yS0}"><stop offset="0" stop-color="${PAGE_DARK}" stop-opacity="0"/><stop offset="1" stop-color="${PAGE_DARK}" stop-opacity="1"/></linearGradient>
</defs>
<rect x="-20000" y="-20000" width="60000" height="${yN1 + 20000}" fill="url(#pfN)"/>
<rect x="-20000" y="-20000" width="60000" height="${yN0 + 20000}" fill="${PAGE_DARK}"/>
<rect x="-20000" y="${yS1}" width="60000" height="${60000}" fill="url(#pfS)"/>
<rect x="-20000" y="${yS0}" width="60000" height="${60000}" fill="${PAGE_DARK}"/>`;
};
const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
/** the static stack at bake zoom kB for one tile (stroke widths in screen px at kB) */
const stack = (kB, land, grat, wlLand) => {
  const w = (v) => v / kB;
  const wlGap = 6.5 * Math.pow(kB, 0.45);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  let wl = "";
  // wlLand[i] = the land whose rings carry water-line i (i 0 = innermost)
  for (let i = 3; i >= 0; i--) {
    if (!wlLand[i]) continue;
    const d = wlGap * (i + 1);
    wl += `<path d="${wlLand[i]}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${w(2 * d + 1.15)}" stroke-linejoin="round"/>`;
    wl += `<path d="${wlLand[i]}" fill="none" stroke="${SEA}" stroke-width="${w(2 * d - 1.15)}" stroke-linejoin="round"/>`;
  }
  return `
<defs><clipPath id="land"><path d="${land}" clip-rule="evenodd"/></clipPath></defs>
<rect x="-20000" y="-20000" width="60000" height="60000" fill="${SEA}"/>
${wl}
<path d="${grat}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${w(1.2)}"/>
<path d="${land}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${land}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${w(28)}" stroke-linejoin="round"/>
  <path d="${land}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${w(10)}" stroke-linejoin="round"/>
  <path d="${grat}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${w(1.2)}"/>
</g>
<path d="${land}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${w(1.5)}" stroke-linejoin="round"/>
${polarFade()}`;
};

mkdirSync(OUT_DIR, { recursive: true });
const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
for (const f of readdirSync(OUT_DIR)) if (f.endsWith(".png") && (!only || only.has(f.split("-")[0]))) rmSync(`${OUT_DIR}/${f}`);
const levels = [];
let totalBytes = 0;
let totalTexels = 0;
const tAll = Date.now();
for (const L of LEVEL_DEF) {
  const kMin = L.band ? L.band[0] : 0;
  const q = L.rect(kMin);
  const r = { x0: Math.floor(q.x0), y0: Math.floor(q.y0), x1: Math.ceil(q.x1), y1: Math.ceil(q.y1) };
  const W = Math.ceil((r.x1 - r.x0) * L.s);
  const H = Math.ceil((r.y1 - r.y0) * L.s);
  const nx = Math.ceil(W / TILE);
  const ny = Math.ceil(H / TILE);
  const tiles = [];
  const t0 = Date.now();
  let bytes = 0;
  const margin = (6.5 * Math.pow(L.kBake, 0.45) * 4 + 30) / L.kBake;
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
      const rect = [tile.x0 - margin, tile.y0 - margin, tile.x0 + tile.w + margin, tile.y0 + tile.h + margin];
      const RR = L.wide ? RINGS_WIDE : RINGS;
      const land = landFor(RR, rect);
      const wlLand = [0, 1, 2, 3].map((i) => landFor(RR, rect, (q) => wlCount(q, L.kBake) > i));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="${tile.x0} ${tile.y0} ${tile.w} ${tile.h}">${stack(L.kBake, land || "M0,0Z", gratFor(rect), wlLand)}</svg>`;
      const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
      writeFileSync(`${OUT_DIR}/${file}`, png);
      bytes += png.length;
    }
  totalBytes += bytes;
  totalTexels += W * H;
  console.log(
    `${L.name.padEnd(10)} kBake ${L.kBake} s ${L.s} band ${JSON.stringify(L.band)}: rect x ${r.x0}..${(r.x0 + W / L.s).toFixed(0)} y ${r.y0}..${(r.y0 + H / L.s).toFixed(0)} = ${W}x${H} texels (${((W * H) / 1e6).toFixed(1)} Mpx), ${nx}x${ny} tiles, ${(bytes / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(1)} s`,
  );
  levels.push({ name: L.name, kBake: L.kBake, s: L.s, band: L.band, x0: r.x0, y0: r.y0, w: W / L.s, h: H / L.s, W, H, tiles });
}
console.log(`total ${(totalTexels / 1e6).toFixed(0)} Mpx, ${(totalBytes / 1e6).toFixed(1)} MB, ${((Date.now() - tAll) / 1000).toFixed(0)} s`);

writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-sugar-rasters.mjs — do not edit by hand.
// The static sugar-world map as a TILED raster LOD pyramid, far -> close: each
// level's world rect (x0, y0, w, h in world px), its bake zoom kBake, its texels per
// world px s, the k band it fades in over (null = the base, always drawn), and its
// tiles (public/sugar/<f>; world rect + texel size; neighbours overlap by ${APRON}
// texels on the right / bottom).
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
