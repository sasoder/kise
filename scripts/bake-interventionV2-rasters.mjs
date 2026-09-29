// InterventionV2's copy of scripts/bake-world-rasters.mjs: the SAME static stack
// and levels (worldStatic.ts, LEVEL_DEF from worldCamera.ts, both read-only),
// with each level's rect fitted to InterventionV2's own camera
// (interventionV2Motion.ts) instead of the V1 pair's. Written to
// public/interventionV2/ + generated/components/interventionV2Levels.ts, so the
// V1 bake (public/world/) stays exactly as committed.
//
// The original header: bakes the STATIC layers of the Korea 1950 world pair (ThirdPartyIntervention
// + CivilRegionalGlobal: the page, the sea inside the sphere, 4 engraved
// water-lines, the graticule, land + hand-coloured rim, the 1950 borders of the
// lit polities, the coast, the sphere's edge) into a raster LOD pyramid, so a
// frame draws one or two images instead of re-rasterising megabytes of 10m
// vectors.
//
//   bun scripts/bake-interventionV2-rasters.mjs
//
// Needs generated/components/worldStatic.ts (scripts/build-world-map.mjs) and
// the camera in generated/components/worldCamera.ts. Writes
//   public/world/lod-<name>.png            one per level (opaque)
//   generated/components/worldLevels.ts    each level's world rect and scale
//
// LEVELS (LEVEL_DEF in worldCamera.ts). The blend between levels is a function
// of the camera's k alone, so each level's rect is the union of the camera's
// views over every global frame it is drawn in, clipped to the sphere (outside
// it the page is a flat colour drawn by the component). A level is baked at
// kBake (screen-constant stroke widths, dashes and water-line gaps for that
// zoom) and at s texels per world px, ~ the largest k it serves.
// Detail: "world" = 50m land/borders + the 10 deg graticule; "near" = 10m in the
// Asia-Pacific box + 5 deg graticule; "korea" = 10m, finely, in the Korea box.

import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import * as S from "../generated/components/worldStatic.ts";
import { LEVEL_DEF, levelDrawn, levelOps } from "../generated/components/worldCamera.ts";
import { CAM_TRACK } from "../generated/components/interventionV2Motion.ts";

const OUT_DIR = "public/interventionV2";
const OUT_TS = "generated/components/interventionV2Levels.ts";

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx).
export const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";
export const PAGE = "#241F1A"; // the page outside the world's edge

const SPHERE_BOX = { x0: 40, y0: 591, x1: 1040, y1: 1079 };

const viewOf = (g) => {
  const { k, cx, cy } = CAM_TRACK[g];
  const m = 10 / k; // the house sway, plus a hair
  return { x0: cx - 540 / k - m, x1: cx + 540 / k + m, y0: cy - 960 / k - m, y1: cy + 960 / k + m };
};

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

const GEO = {
  world: { land: S.LAND_WORLD_D, wl: S.LAND_WORLD_WL_D, borders: S.BORDERS_WORLD_D, grat: S.GRAT10_D, box: null },
  near: { land: S.LAND_NEAR_D, wl: S.LAND_NEAR_D, borders: S.BORDERS_NEAR_D, grat: S.GRAT5_D, box: S.NEAR_BOX },
  korea: { land: S.LAND_KOREA_D, wl: S.LAND_KOREA_D, borders: S.BORDERS_KOREA_D, grat: S.GRAT5_D, box: S.KOREA_BOX },
};

// Screen-constant sizes as a function of the bake zoom: the water-line gap and
// the rim wash tighten on the wides, so the whole world does not drown in lines.
export const wlGapAt = (kB) => 3.3 * Math.pow(kB, 0.72);
const rimAt = (kB) => Math.min(1, Math.sqrt(kB / 4));

// The same stack, order and weights as SouthManchuriaRailway's vector map.
const stack = (kB, geo) => {
  const px = (v) => v / kB;
  const { land, wl: wlLand, borders, grat } = geo;
  const wlGap = wlGapAt(kB);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  let wl = "";
  for (let i = 3; i >= 0; i--) {
    const d = wlGap * (i + 1);
    wl += `<path d="${wlLand}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
    wl += `<path d="${wlLand}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
  }
  const dash = `${px(8)} ${px(5)}`;
  const rim = rimAt(kB);
  return `
<defs>
  <clipPath id="sphere"><path d="${S.SPHERE_D}"/></clipPath>
  <clipPath id="land"><path d="${land}" clip-rule="evenodd"/></clipPath>
</defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${PAGE}"/>
<g clip-path="url(#sphere)">
  <path d="${S.SPHERE_D}" fill="${SEA}"/>
  ${wl}
  <path d="${grat}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
  <path d="${land}" fill="${LAND}" fill-rule="evenodd"/>
  <g clip-path="url(#land)">
    <path d="${land}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28 * rim)}" stroke-linejoin="round"/>
    <path d="${land}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10 * rim)}" stroke-linejoin="round"/>
    <path d="${grat}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
  </g>
  <path d="${borders}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${land}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>
</g>
<path d="${S.SPHERE_D}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.5)}"/>`;
};

mkdirSync(OUT_DIR, { recursive: true });
const levels = [];
const only = process.argv[2];
LEVEL_DEF.forEach((L, li) => {
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const frames = [];
  CAM_TRACK.forEach(({ k }, g) => {
    if (!levelDrawn(levelOps(k), li)) return;
    frames.push(g);
    const v = viewOf(g);
    r.x0 = Math.min(r.x0, v.x0);
    r.y0 = Math.min(r.y0, v.y0);
    r.x1 = Math.max(r.x1, v.x1);
    r.y1 = Math.max(r.y1, v.y1);
  });
  // clip to the sphere (plus a margin for its edge stroke)
  r.x0 = Math.floor(Math.max(r.x0, SPHERE_BOX.x0 - 4));
  r.y0 = Math.floor(Math.max(r.y0, SPHERE_BOX.y0 - 4));
  r.x1 = Math.ceil(Math.min(r.x1, SPHERE_BOX.x1 + 4));
  r.y1 = Math.ceil(Math.min(r.y1, SPHERE_BOX.y1 + 4));
  const geo = GEO[L.detail];
  if (geo.box) {
    const [[bx0, by0], [bx1, by1]] = geo.box;
    // the page outside the sphere is flat, so only the part of the rect inside the sphere must be in the box
    if (r.x0 < bx0 || r.x1 > bx1 || r.y0 < Math.max(by0, SPHERE_BOX.y0 - 4) || r.y1 > by1) {
      throw new Error(`${L.name}: rect ${JSON.stringify(r)} leaves its ${L.detail} box ${JSON.stringify(geo.box)}`);
    }
  }
  const W = Math.round((r.x1 - r.x0) * L.s);
  const H = Math.round((r.y1 - r.y0) * L.s);
  if (W > 8000 || H > 8000) throw new Error(`${L.name}: ${W}x${H} exceeds 8k`);
  const lv = { name: L.name, kBake: L.kBake, s: L.s, x0: r.x0, y0: r.y0, w: W / L.s, h: H / L.s, W, H };
  levels.push(lv);
  if (only && only !== L.name) {
    console.log(`(skip ${L.name}: ${W}x${H})`);
    return;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${r.x0} ${r.y0} ${W / L.s} ${H / L.s}">${stack(L.kBake, geo)}</svg>`;
  const t0 = Date.now();
  const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
  const file = `${OUT_DIR}/lod-${L.name}.png`;
  writeFileSync(file, png);
  console.log(
    `${file}: ${W}x${H} (${((W * H) / 1e6).toFixed(1)} Mpx), ${(png.length / 1e6).toFixed(2)} MB, ${Date.now() - t0} ms, G ${frames[0]}-${frames[frames.length - 1]} (${frames.length} frames)`,
  );
});

writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-interventionV2-rasters.mjs — do not edit by hand.
// The static world map as a raster LOD pyramid: each level's world rect (x0,
// y0, w, h in world px), its bake zoom kBake and its texels per world px s.
// Images are public/interventionV2/lod-<name>.png, in LEVEL_DEF order (wide -> close).
// Outside every rect the page is the flat PAGE colour.
export type Level = { name: string; kBake: number; s: number; x0: number; y0: number; w: number; h: number; W: number; H: number };
export const PAGE = "${PAGE}";
export const LEVELS: Level[] = ${JSON.stringify(levels, null, 2)};
`,
);
console.log(`Wrote ${OUT_TS}`);
