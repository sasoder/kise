// Bakes NobodyCanSettle's raster crop: the same static stack as
// scripts/bake-ww1-rasters.mjs (sea, engraved water-lines, graticule, land +
// hand-coloured rim, 1914 borders dashed, colonial borders, coast), in the same
// order and weights, cropped to the Adriatic framing this piece holds (k 3.3 to
// 3.45; the ww1 pyramid has only the britain crop, baked at k 2.72, here).
// EverybodyWants' britain crop still serves the eased-back end (k ~2.95).
//
//   bun scripts/bake-settle-rasters.mjs
//
// Reads ww1MapData.ts (read-only) and the camera track + crop runs from
// NobodyCanSettle.tsx. Writes
//   public/ww1settle/lod-<name>.png       one per crop (opaque)
//   generated/components/settleLevels.ts  each crop's world rect and scale
// Each crop is baked at its bake zoom (screen-constant strokes, dashes and
// water-line gaps computed for that k) at s >= that k texels per world px, and
// its rect holds every view of the frames it is picked for plus the 4-frame
// fade after (NobodyCanSettle's CROP_RUNS).

import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { BORDERS_D, COLONIAL_D, GRATICULE_D, LAND_D } from "../generated/components/ww1MapData.ts";
import { CAM_TRACK, CROPS, CROP_RUNS, SEA, LAND, LAND_RIM, INK } from "../generated/components/NobodyCanSettle.tsx";

const OUT_DIR = "public/ww1settle";
const OUT_TS = "generated/components/settleLevels.ts";
const FADE = 4;

const viewOf = (f) => {
  const { k, cx, cy } = CAM_TRACK[f];
  const m = 12 / k; // the house sway, plus a hair
  return { x0: cx - 540 / k - m, x1: cx + 540 / k + m, y0: cy - 960 / k - m, y1: cy + 960 / k + m };
};
const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
// The stack exactly as scripts/bake-ww1-rasters.mjs draws it (dashed borders).
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
<path d="${COLONIAL_D}" fill="none" stroke="${INK}" stroke-opacity="0.32" stroke-width="${px(1.5)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`;
};

mkdirSync(OUT_DIR, { recursive: true });
const levels = [];
for (const c of CROPS) {
  const run = CROP_RUNS.find((r) => r.name === c.name);
  if (!run || run.f0 < 0) {
    console.log(`${c.name}: never picked, skipped`);
    continue;
  }
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (let f = run.f0; f <= Math.min(CAM_TRACK.length - 1, run.f1 + FADE); f++) {
    const v = viewOf(f);
    r.x0 = Math.min(r.x0, v.x0);
    r.y0 = Math.min(r.y0, v.y0);
    r.x1 = Math.max(r.x1, v.x1);
    r.y1 = Math.max(r.y1, v.y1);
  }
  for (const key of ["x0", "y0"]) r[key] = Math.floor(r[key]);
  for (const key of ["x1", "y1"]) r[key] = Math.ceil(r[key]);
  const W = Math.round((r.x1 - r.x0) * c.s);
  const H = Math.round((r.y1 - r.y0) * c.s);
  if (W > 8000 || H > 8000) throw new Error(`${c.name}: ${W}x${H} exceeds 8k`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${r.x0} ${r.y0} ${W / c.s} ${H / c.s}">${stack(c.kBake)}</svg>`;
  const t0 = Date.now();
  const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
  writeFileSync(`${OUT_DIR}/lod-${c.name}.png`, png);
  console.log(`${OUT_DIR}/lod-${c.name}.png: frames ${run.f0}-${run.f1}, ${W}x${H}, ${(png.length / 1e6).toFixed(2)} MB, ${Date.now() - t0} ms`);
  levels.push({ name: c.name, kBake: c.kBake, s: c.s, x0: r.x0, y0: r.y0, w: W / c.s, h: H / c.s, W, H });
}
writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-settle-rasters.mjs — do not edit by hand.
// NobodyCanSettle's close raster levels (public/ww1settle/lod-<name>.png): each
// crop's world rect (x0, y0, w, h in world px), bake zoom kBake and texels per
// world px s. The wide end framing uses EverybodyWants' britain crop.
import type { Level } from "./ww1Levels";
export const SETTLE_LEVELS: Level[] = ${JSON.stringify(levels, null, 2)};
`,
);
console.log(`Wrote ${OUT_TS}`);
