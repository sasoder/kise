// Bakes the STATIC layers of the 1950 Korea map (sea, engraved water-lines,
// graticule, land + hand-coloured rim, 1950 borders, coast) into a raster LOD
// pyramid shared by every Korea cut (Twosome, ReuniteTheWholeThing,
// ChineseAreIn), so a frame draws one or two images instead of re-rasterising
// ~0.4 MB of 10m vectors.
//
//   bun scripts/build-korea-map.mjs && bun scripts/bake-korea-rasters.mjs
//
// Writes
//   public/korea/lod-<name>.png             one per level (opaque)
//   public/korea/mottle.png, grain.png      the house paper textures (copied
//                                           from public/manchuria)
//   generated/components/koreaLevels.ts     each level's world rect, bake zoom
//                                           kBake, texels per world px s, and the
//                                           k band it fades in over
//
// The levels are FIXED (not fitted to one camera), because three cuts with
// three cameras share them. Each covers every view its band can serve:
//   far    k < ~0.8   the whole extent (Shandong .. Honshu, Manchuria .. Kyushu)
//   wide   k 0.75+    the peninsula, Liaodong, Kyushu, the Tumen mouth
//   mid    k 1.25+    Korea + the Yalu edge, any camera centred on Korea
//   close  k 2.0+     Korea itself, ~1.3 texels per screen px up to k ~3.4
// A level is baked at kBake (screen-constant stroke widths, dashes and water-line
// gaps computed for that zoom) and at s texels per world px (>= the largest k it
// serves, so it is never magnified). The blend is a function of k alone.

import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { BORDERS_D, GRATICULE_D, LAND_D } from "../generated/components/koreaStatic.ts";

const OUT_DIR = "public/korea";
const OUT_TS = "generated/components/koreaLevels.ts";

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx).
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";

export const LEVEL_DEF = [
  { name: "far", kBake: 0.62, s: 0.82, band: null, rect: { x0: -1400, y0: -1100, x1: 2500, y1: 3000 } },
  { name: "wide", kBake: 1.0, s: 1.35, band: [0.72, 0.86], rect: { x0: -380, y0: -170, x1: 1460, y1: 2060 } },
  { name: "mid", kBake: 1.6, s: 2.2, band: [1.2, 1.45], rect: { x0: -80, y0: -320, x1: 1160, y1: 1760 } },
  { name: "close", kBake: 2.6, s: 3.4, band: [1.95, 2.35], rect: { x0: 60, y0: 60, x1: 1030, y1: 1600 } },
];

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
<path d="${BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`;
};

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync("public/manchuria/mottle.png", `${OUT_DIR}/mottle.png`);
copyFileSync("public/manchuria/grain.png", `${OUT_DIR}/grain.png`);
const only = process.argv[2];
const levels = [];
for (const L of LEVEL_DEF) {
  const r = L.rect;
  const W = Math.round((r.x1 - r.x0) * L.s);
  const H = Math.round((r.y1 - r.y0) * L.s);
  if (W > 8000 || H > 8000) throw new Error(`${L.name}: ${W}x${H} exceeds 8k`);
  if (!only || only === L.name) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${r.x0} ${r.y0} ${W / L.s} ${H / L.s}">${stack(L.kBake)}</svg>`;
    const t0 = Date.now();
    const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
    const file = `${OUT_DIR}/lod-${L.name}.png`;
    writeFileSync(file, png);
    console.log(`${file}: ${W}x${H}, ${(png.length / 1e6).toFixed(2)} MB, ${Date.now() - t0} ms`);
  }
  levels.push({ name: L.name, kBake: L.kBake, s: L.s, band: L.band, x0: r.x0, y0: r.y0, w: W / L.s, h: H / L.s, W, H });
}

writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-korea-rasters.mjs — do not edit by hand.
// The static 1950 Korea map as a raster LOD pyramid: each level's world rect
// (x0, y0, w, h in world px), its bake zoom kBake, its texels per world px s and
// the k band it fades in over (null = the base, always drawn). Images are
// public/korea/lod-<name>.png, wide -> close.
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
};
export const LEVELS: Level[] = ${JSON.stringify(levels, null, 2)};
`,
);
console.log(`Wrote ${OUT_TS}`);
