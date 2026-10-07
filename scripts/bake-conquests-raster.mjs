// Bakes THE WIDE of the Americas world for the cut TheseConquests (the opening
// of "Sheppard: why captured emperors cooperated"): the same static stack as
// scripts/bake-americas-rasters.mjs (sea, 4 engraved water-lines, 10 deg
// graticule, land + hand-coloured rim, cream coast; no borders), drawn for
// k ~0.82, over a rect wider than the americas base level (that level
// only fills a 1080 px frame down to k 0.885). ONE png; it does not touch
// public/americas or americasLevels.ts.
//
//   bun scripts/bake-conquests-raster.mjs
//
// Needs generated/components/americasStatic.ts. Writes public/conquests/wide.png.
// World rect x -210 ... 1250, y -360 ... 2160, 1.3 texels per world px (1.59
// texels per screen px at k 0.82).
import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { LAND_D, LAND_WL_D } from "../generated/components/americasStatic.ts";
import { PROJ } from "../generated/components/americasMapData.ts";

const RECT = { x0: -210, x1: 1250, y0: -360, y1: 2160 };
const S = 1.3;
const KB = 0.82;
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";
const RAD = Math.PI / 180;
const px = (lon) => PROJ.translate[0] + PROJ.scale * lon * RAD;
const py = (lat) => PROJ.translate[1] - PROJ.scale * Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2));
let GRAT = "";
for (let lon = -150; lon <= -20; lon += 10) GRAT += `M${px(lon).toFixed(2)},-600L${px(lon).toFixed(2)},3100`;
for (let lat = -70; lat <= 60; lat += 10) GRAT += `M-600,${py(lat).toFixed(2)}L1700,${py(lat).toFixed(2)}`;

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
const w = (v) => v / KB;
const wlGap = 6.5 * Math.pow(KB, 0.45);
const wlOp = [0.3, 0.2, 0.12, 0.065];
let wl = "";
for (let i = 3; i >= 0; i--) {
  const d = wlGap * (i + 1);
  wl += `<path d="${LAND_WL_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${w(2 * d + 1.15)}" stroke-linejoin="round"/>`;
  wl += `<path d="${LAND_WL_D}" fill="none" stroke="${SEA}" stroke-width="${w(2 * d - 1.15)}" stroke-linejoin="round"/>`;
}
const W = Math.ceil((RECT.x1 - RECT.x0) * S);
const H = Math.ceil((RECT.y1 - RECT.y0) * S);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${RECT.x0} ${RECT.y0} ${W / S} ${H / S}">
<defs><clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath></defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${SEA}"/>
${wl}
<path d="${GRAT}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${w(1.2)}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${w(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${w(10)}" stroke-linejoin="round"/>
  <path d="${GRAT}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${w(1.2)}"/>
</g>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${w(1.5)}" stroke-linejoin="round"/>
</svg>`;
mkdirSync("public/conquests", { recursive: true });
const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
writeFileSync("public/conquests/wide.png", png);
