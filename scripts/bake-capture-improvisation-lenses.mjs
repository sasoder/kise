// Bakes the two LENS close-ups of the cut Improvisation (clip "Sheppard: capture,
// not kill", Dwarkesh map style) from THE AMERICAS WORLD's static layers: the
// same stack as scripts/bake-americas-rasters.mjs (sea, 4 engraved water-lines,
// graticule, land + rim, cream coast), drawn for the lens zoom, plus Lake
// Texcoco 1519 (scripts/cortes-geo.json) as water in the Mexico lens.
//
//   bun scripts/bake-capture-improvisation-lenses.mjs
//
// Writes public/capture/improv-lens-mexico.png and improv-lens-peru.png. The
// rects (world px of americasShared.project) are repeated in
// generated/components/Improvisation.tsx (LENS_RASTERS).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { GRATICULE_D, LAND_D, LAND_WL_D } from "../generated/components/americasStatic.ts";
import { PROJ } from "../generated/components/americasMapData.ts";

const OUT_DIR = "public/capture";
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";

const RAD = Math.PI / 180;
const project = (lon, lat) => [PROJ.translate[0] + PROJ.scale * lon * RAD, PROJ.translate[1] - PROJ.scale * Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];

const geo = JSON.parse(readFileSync("scripts/cortes-geo.json", "utf8"));
const LAKE_D = geo.lake_texcoco_1519.rings
  .map(
    (ring) =>
      ring
        .map(([lon, lat], i) => {
          const [x, y] = project(lon, lat);
          return `${i ? "L" : "M"}${x.toFixed(3)},${y.toFixed(3)}`;
        })
        .join("") + "Z",
  )
  .join("");

export const LENSES = [
  { name: "improv-lens-mexico", kBake: 5.4, s: 7, rect: { x0: 236, y0: 378, w: 125, h: 125 }, lake: true },
  { name: "improv-lens-peru", kBake: 4.5, s: 6, rect: { x0: 570, y0: 849, w: 140, h: 140 }, lake: false },
];

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
const stack = (kB, lake) => {
  const px = (v) => v / kB;
  const wlGap = 6.5 * Math.pow(kB, 0.45);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  let wl = "";
  for (let i = 3; i >= 0; i--) {
    const d = wlGap * (i + 1);
    wl += `<path d="${LAND_WL_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
    wl += `<path d="${LAND_WL_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
  }
  return `
<defs><clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath></defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${SEA}"/>
${wl}
<path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>
${lake ? `<path d="${LAKE_D}" fill="${SEA}" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.3)}" stroke-linejoin="round"/>` : ""}`;
};

mkdirSync(OUT_DIR, { recursive: true });
for (const L of LENSES) {
  const r = L.rect;
  const W = Math.round(r.w * L.s);
  const H = Math.round(r.h * L.s);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${r.x0} ${r.y0} ${r.w} ${r.h}">${stack(L.kBake, L.lake)}</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
  writeFileSync(`${OUT_DIR}/${L.name}.png`, png);
  console.log(`${L.name}: ${W}x${H} texels, ${(png.length / 1e6).toFixed(2)} MB`);
}
