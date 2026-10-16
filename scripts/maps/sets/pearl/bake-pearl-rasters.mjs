// Bakes the STATIC layers of the Pearl Harbor clip's two map worlds (sea, 4
// engraved water-lines, the graticule, land + the hand-coloured rim, the period
// borders dashed cream ~0.5, the coast) into a TILED raster LOD pyramid, so a
// frame draws a few small images instead of re-rasterising megabytes of 10m
// vectors. The paper mottle and grain are NOT baked: <MapBase> lays the mottle in
// world-space octaves over the tiles (stains keep their screen size through the
// 100x Oahu pull-back) and <MapPage> puts the grain in screen space on top.
//
//   bun scripts/maps/sets/pearl/bake-pearl-rasters.mjs asia      (or pacific; no arg = both)
//
// Writes
//   public/pearl/<world>-<level>-<col>-<row>.png   1024 px tiles (+2 px overlap)
//   public/pearl/mottle.png, grain.png               the house paper textures
//   generated/components/sarah-pearl-harbor/pearlLevels<World>.ts       the level grids
//   generated/components/sarah-pearl-harbor/pearlLevels.ts              index of both worlds
//
// A level is baked at kBake (screen-constant stroke widths, dashes and
// water-line gaps for that zoom) and s texels per world px (>= the largest k it
// serves, so it is never magnified). Its cells cover one or more world rects;
// a cell of one flat colour is not written (the component paints a flat div).
// The blend between levels is a function of k alone (band = the k range a level
// fades in over); where a finer level has no cell the coarser one shows.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import { WORLDS, boxPx, bordersOf, graticuleOf, landOf } from "./pearl-geo.mjs";

const OUT_DIR = "public/pearl";
const TILE = 1024;
const PAD = 2;
const CH = 4; // tiles per chunk side

// The Dwarkesh map style palette (SouthManchuriaRailway.tsx)
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";

const LEVEL_DEF = {
  asia: () => {
    const W = WORLDS.asia;
    const far = boxPx(W, W.far);
    // generous boxes: a camera inside a level's band must find the level all round its view (no seam)
    const wide = boxPx(W, { lon: [74, 166], lat: [-6, 64] });
    const east = boxPx(W, { lon: [100, 156], lat: [19, 62] });
    const sw = boxPx(W, { lon: [86, 116], lat: [6, 36] });
    const nClose = boxPx(W, { lon: [111, 138], lat: [32, 54] });
    const swClose = boxPx(W, { lon: [94, 113], lat: [14, 32] });
    return [
      { name: "a0", s: 0.7, kBake: 0.55, band: null, rects: [far] },
      { name: "a1", s: 1.3, kBake: 1.0, band: [0.62, 0.74], rects: [far] },
      { name: "a2", s: 2.3, kBake: 1.7, band: [1.12, 1.32], rects: [far] },
      { name: "a3", s: 4.0, kBake: 2.9, band: [1.95, 2.3], rects: [wide] },
      { name: "a4", s: 6.8, kBake: 4.9, band: [3.4, 4.0], rects: [east, sw] },
      { name: "a5", s: 11, kBake: 8, band: [5.8, 6.8], rects: [nClose, swClose] },
    ];
  },
  pacific: () => {
    const W = WORLDS.pacific;
    const far = boxPx(W, W.far);
    const core = boxPx(W, W.core);
    const [ox, oy] = W.proj([-157.98, 21.47]); // Oahu
    // deep levels round Oahu: a box that holds any view at that level's zoom with
    // the camera centre up to ~2 views west of Oahu (the pull-back runs west)
    const deep = (kLo) => {
      const w = 1080 / kLo;
      const h = 1920 / kLo;
      return { x0: ox - 2.6 * w, x1: ox + 1.4 * w, y0: oy - 1.3 * h, y1: oy + 1.3 * h };
    };
    return [
      { name: "p0", s: 0.75, kBake: 0.6, band: null, rects: [far] },
      { name: "p1", s: 1.4, kBake: 1.05, band: [0.66, 0.8], rects: [far] },
      { name: "p2", s: 2.6, kBake: 1.9, band: [1.25, 1.5], rects: [far] },
      { name: "p3", s: 4.8, kBake: 3.5, band: [2.3, 2.7], rects: [boxPx(W, { lon: [80, 220], lat: [-35, 66] })] },
      { name: "p4", s: 9, kBake: 6.5, band: [4.2, 5.0], rects: [core] },
      // p5 also covers the other strikes' close-ups (k up to ~17)
      {
        name: "p5",
        s: 17,
        kBake: 12,
        band: [8, 9.5],
        rects: [
          deep(8),
          boxPx(W, { lon: [97, 113], lat: [-2, 20] }), // Malaya, the Gulf of Siam, Saigon, Hainan
          boxPx(W, { lon: [113, 126], lat: [11, 26] }), // Formosa - Luzon (and Hong Kong)
          boxPx(W, { lon: [119, 124], lat: [29, 33] }), // Shanghai
          boxPx(W, { lon: [142, 148], lat: [11.5, 17] }), // Saipan - Guam
          boxPx(W, { lon: [163, 170], lat: [7, 21] }), // Kwajalein / Roi - Wake
        ],
      },
      { name: "p6", s: 32, kBake: 23, band: [15, 18], rects: [deep(15)] },
      { name: "p7", s: 60, kBake: 43, band: [28, 33], rects: [deep(28)] },
      { name: "p8", s: 112, kBake: 82, band: [52, 62], rects: [deep(52)] },
      { name: "p9", s: 170, kBake: 130, band: [100, 118], rects: [deep(100)] },
    ];
  },
};

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
const wlGapAt = (kB) => 6.5 * Math.pow(Math.min(kB, 6), 0.45);

// --- clipping (world px) -------------------------------------------------------
const clipRing = (ring, r) => {
  const edges = [
    [(q) => q[0] >= r.x0, (a, b) => [r.x0, a[1] + ((b[1] - a[1]) * (r.x0 - a[0])) / (b[0] - a[0])]],
    [(q) => q[0] <= r.x1, (a, b) => [r.x1, a[1] + ((b[1] - a[1]) * (r.x1 - a[0])) / (b[0] - a[0])]],
    [(q) => q[1] >= r.y0, (a, b) => [a[0] + ((b[0] - a[0]) * (r.y0 - a[1])) / (b[1] - a[1]), r.y0]],
    [(q) => q[1] <= r.y1, (a, b) => [a[0] + ((b[0] - a[0]) * (r.y1 - a[1])) / (b[1] - a[1]), r.y1]],
  ];
  let pts = ring;
  for (const [inside, cut] of edges) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ia = inside(a);
      const ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) out.push(cut(a, b));
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  return pts;
};
const clipLine = (line, r) => {
  const runs = [];
  let run = [];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const hit = Math.max(a[0], b[0]) >= r.x0 && Math.min(a[0], b[0]) <= r.x1 && Math.max(a[1], b[1]) >= r.y0 && Math.min(a[1], b[1]) <= r.y1;
    if (hit) {
      if (!run.length) run.push(a);
      run.push(b);
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
};
const n3 = (v) => Math.round(v * 1000) / 1000;
const ringD = (r) => `M${r.map(([x, y]) => `${n3(x)},${n3(y)}`).join("L")}Z`;
const lineD = (l) => `M${l.map(([x, y]) => `${n3(x)},${n3(y)}`).join("L")}`;

const chunkSvg = (geo, rect, L, Wt, Ht) => {
  const kB = L.kBake;
  const px = (v) => v / kB;
  const m = 80 / kB;
  const rx = { x0: rect.x0 - m, y0: rect.y0 - m, x1: rect.x1 + m, y1: rect.y1 + m };
  let land = "";
  let wlLand = "";
  for (const poly of geo.land) {
    const b = poly.box;
    if (b[2] < rx.x0 || b[0] > rx.x1 || b[3] < rx.y0 || b[1] > rx.y1) continue;
    let d = "";
    for (const ring of poly.rings) {
      const c = clipRing(ring, rx);
      if (c) d += ringD(c);
    }
    land += d;
    if (poly.area * kB * kB >= 120) wlLand += d;
  }
  const lines = (arr) => arr.flatMap((l) => clipLine(l, rx)).map(lineD).join("");
  const borders = lines(geo.borders);
  const grat = lines(geo.grat);
  const wlGap = wlGapAt(kB);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  let wl = "";
  if (wlLand)
    for (let i = 3; i >= 0; i--) {
      const d = wlGap * (i + 1);
      wl += `<path d="${wlLand}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
      wl += `<path d="${wlLand}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
    }
  const dash = `${px(8)} ${px(5)}`;
  const vb = `${rect.x0 - PAD / L.s} ${rect.y0 - PAD / L.s} ${Wt / L.s} ${Ht / L.s}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wt}" height="${Ht}" viewBox="${vb}">
<defs><clipPath id="land"><path d="${land || "M0,0Z"}" clip-rule="evenodd"/></clipPath></defs>
<rect x="${rx.x0 - 10}" y="${rx.y0 - 10}" width="${rx.x1 - rx.x0 + 20}" height="${rx.y1 - rx.y0 + 20}" fill="${SEA}"/>
${wl}
<path d="${grat}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
${
  land
    ? `<path d="${land}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${land}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${land}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${grat}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>`
    : ""
}
${borders ? `<path d="${borders}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
${land ? `<path d="${land}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>` : ""}
</svg>`;
};

// --- PNG (RGB, Up filter) -------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
/** the RGB tile at (tx, ty) texels of an RGBA pixmap; null if it is one colour (then .flat) */
const sliceTile = (pix, PW, tx, ty, w, h) => {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  const i0 = (ty * PW + tx) * 4;
  const c0 = [pix[i0], pix[i0 + 1], pix[i0 + 2]];
  let flat = true;
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1);
    raw[row] = y === 0 ? 0 : 2;
    for (let x = 0; x < w; x++) {
      const i = ((ty + y) * PW + tx + x) * 4;
      const o = row + 1 + x * 3;
      raw[o] = pix[i];
      raw[o + 1] = pix[i + 1];
      raw[o + 2] = pix[i + 2];
      if (flat && (pix[i] !== c0[0] || pix[i + 1] !== c0[1] || pix[i + 2] !== c0[2])) flat = false;
    }
  }
  if (flat) return { flat: `#${c0.map((v) => v.toString(16).padStart(2, "0")).join("")}` };
  // Up filter (rows 1..h-1): subtract the row above, from the bottom up
  for (let y = h - 1; y >= 1; y--) {
    const row = y * (w * 3 + 1) + 1;
    const up = (y - 1) * (w * 3 + 1) + 1;
    for (let x = 0; x < w * 3; x++) raw[row + x] = (raw[row + x] - raw[up + x]) & 0xff;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return {
    png: Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(raw, { level: 7 })),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  };
};

// --- bake -----------------------------------------------------------------------
const bakeWorld = (worldName) => {
  const W = WORLDS[worldName];
  const t0 = Date.now();
  const geo = { land: landOf(W), borders: bordersOf(W), grat: graticuleOf(W) };
  console.log(`${worldName}: geometry ${Date.now() - t0} ms (${geo.land.length} polygons, ${geo.borders.length} border lines)`);
  const levels = [];
  let bytes = 0;
  let files = 0;
  for (const L of LEVEL_DEF[worldName]()) {
    const tl = Date.now();
    const x0 = Math.floor(Math.min(...L.rects.map((r) => r.x0)));
    const y0 = Math.floor(Math.min(...L.rects.map((r) => r.y0)));
    const x1 = Math.max(...L.rects.map((r) => r.x1));
    const y1 = Math.max(...L.rects.map((r) => r.y1));
    const tw = TILE / L.s;
    const cols = Math.ceil((x1 - x0) / tw);
    const rows = Math.ceil((y1 - y0) / tw);
    const want = (c, r) => {
      const cx0 = x0 + c * tw;
      const cy0 = y0 + r * tw;
      return L.rects.some((q) => cx0 < q.x1 && cx0 + tw > q.x0 && cy0 < q.y1 && cy0 + tw > q.y0);
    };
    const cells = new Array(cols * rows).fill(".");
    const colors = [];
    let rendered = 0;
    for (let cr = 0; cr < rows; cr += CH)
      for (let cc = 0; cc < cols; cc += CH) {
        const nc = Math.min(CH, cols - cc);
        const nr = Math.min(CH, rows - cr);
        let any = false;
        for (let r = cr; r < cr + nr; r++) for (let c = cc; c < cc + nc; c++) if (want(c, r)) any = true;
        if (!any) continue;
        const Wt = nc * TILE + 2 * PAD;
        const Ht = nr * TILE + 2 * PAD;
        const rect = { x0: x0 + cc * tw, y0: y0 + cr * tw, x1: x0 + (cc + nc) * tw, y1: y0 + (cr + nr) * tw };
        const svg = chunkSvg(geo, rect, L, Wt, Ht);
        const img = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render();
        rendered += Wt * Ht;
        const pix = img.pixels;
        for (let r = cr; r < cr + nr; r++)
          for (let c = cc; c < cc + nc; c++) {
            if (!want(c, r)) continue;
            const t = sliceTile(pix, Wt, (c - cc) * TILE, (r - cr) * TILE, TILE + 2 * PAD, TILE + 2 * PAD);
            if (t.flat) {
              let ci = colors.indexOf(t.flat);
              if (ci < 0) {
                colors.push(t.flat);
                ci = colors.length - 1;
              }
              cells[r * cols + c] = String.fromCharCode(97 + ci);
            } else {
              writeFileSync(`${OUT_DIR}/${worldName}-${L.name}-${c}-${r}.png`, t.png);
              bytes += t.png.length;
              files++;
              cells[r * cols + c] = "#";
            }
          }
      }
    levels.push({ name: L.name, s: L.s, kBake: L.kBake, band: L.band, x0, y0, tw, cols, rows, cells: cells.join(""), colors });
    console.log(
      `  ${L.name}: s ${L.s}, ${cols}x${rows} cells, ${cells.filter((v) => v === "#").length} tiles, ${cells.filter((v) => v >= "a" && v <= "z").length} flat; ${(rendered / 1e6).toFixed(0)} Mpx in ${((Date.now() - tl) / 1000).toFixed(1)} s`,
    );
  }
  console.log(`${worldName}: ${files} tiles, ${(bytes / 1e6).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  const Wn = worldName === "asia" ? "Asia" : "Pacific";
  writeFileSync(
    `generated/components/sarah-pearl-harbor/pearlLevels${Wn}.ts`,
    `// Generated by scripts/maps/sets/pearl/bake-pearl-rasters.mjs — do not edit by hand.
// The ${worldName.toUpperCase()} world's static map as a tiled raster LOD pyramid. A level's
// cell (col, row) covers world [x0 + col tw, x0 + (col + 1) tw) x [y0 + row tw, ...);
// its image public/pearl/${worldName}-<name>-<col>-<row>.png has ${TILE} + 2 x ${PAD} px (a ${PAD} px
// overlap all round). cells[row * cols + col]: "#" = a tile image, "." = no cell,
// "a".."z" = one flat colour (colors[code - 97]). band: the k range the level
// fades in over (null = the base, always drawn).
import type { PearlLevel } from "./pearlLevels";
export const PEARL_LEVELS_${worldName.toUpperCase()}: PearlLevel[] = ${JSON.stringify(levels)};
`,
  );
};

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync("public/manchuria/mottle.png", `${OUT_DIR}/mottle.png`);
copyFileSync("public/manchuria/grain.png", `${OUT_DIR}/grain.png`);
const only = process.argv[2];
for (const w of ["asia", "pacific"]) if (!only || only === w) bakeWorld(w);
for (const [w, Wn] of [
  ["asia", "Asia"],
  ["pacific", "Pacific"],
])
  if (!existsSync(`generated/components/sarah-pearl-harbor/pearlLevels${Wn}.ts`))
    writeFileSync(
      `generated/components/sarah-pearl-harbor/pearlLevels${Wn}.ts`,
      `// placeholder until scripts/maps/sets/pearl/bake-pearl-rasters.mjs ${w} runs\nimport type { PearlLevel } from "./pearlLevels";\nexport const PEARL_LEVELS_${w.toUpperCase()}: PearlLevel[] = [];\n`,
    );
writeFileSync(
  "generated/components/sarah-pearl-harbor/pearlLevels.ts",
  `// Generated by scripts/maps/sets/pearl/bake-pearl-rasters.mjs — do not edit by hand.
// Index of the two worlds' raster LOD pyramids (see pearlLevelsAsia.ts / pearlLevelsPacific.ts).
export type PearlLevel = {
  name: string;
  s: number; // texels per world px
  kBake: number; // the zoom its stroke widths were baked for
  band: [number, number] | null; // k range it fades in over
  x0: number; // world px of cell (0, 0)
  y0: number;
  tw: number; // world px per cell
  cols: number;
  rows: number;
  cells: string; // "#" tile, "." none, "a".. flat colour
  colors: string[];
};
export const PEARL_TILE = ${TILE};
export const PEARL_PAD = ${PAD};
export { PEARL_LEVELS_ASIA } from "./pearlLevelsAsia";
export { PEARL_LEVELS_PACIFIC } from "./pearlLevelsPacific";
`,
);
