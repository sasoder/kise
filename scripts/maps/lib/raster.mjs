// The map tool's raster bake: a world's STATIC layers (sea, 4 engraved
// water-lines, the graticule, land + the hand-coloured rim, period water,
// period borders dashed cream ~0.5, the coast) as a TILED LOD pyramid, so a
// frame draws a few small images instead of re-rasterising megabytes of 10m
// vectors. The paper mottle and grain are NOT baked: the clip kit lays the
// mottle in world-space octaves over the tiles and the grain in screen space.
//
// A level (config worlds.<w>.levels[]): { name, s, kBake, band, rects }
//   s      texels per world px (>= the largest k it serves: never magnified)
//   kBake  the zoom its screen-constant strokes, dashes and water-line gaps are drawn for
//   band   [k0, k1] the k range it fades in over; null = the base level, always drawn
//   rects  where it has cells, generous: every view a camera takes inside the level's
//          band must lie inside them. { lon, lat } boxes, world px { x0, y0, x1, y1 },
//          or { around: [lon, lat], k, views: [west, east, north, south] } = every
//          view at zoom >= k whose centre is up to that many views from the point
// A level's cells are TILE-texel squares on one grid; a cell of one flat colour
// is not written (the kit paints a flat div), a cell outside every rect is ".".
// Tiles are rendered CHUNK x CHUNK at a time (one resvg canvas) and sliced with
// PAD texels of overlap all round.

import { deflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import { boxPx, bordersOf, graticuleOf, lakesOf, landOf } from "./geo.mjs";
import { writeOut } from "./data.mjs";

// The Dwarkesh map style palette (styles/dwarkesh-map.md)
export const PALETTE = { sea: "#1B2226", land: "#3F3428", rim: "#6A5838", ink: "#E9DDBF" };

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

/** the SVG of one chunk: world rect `rect` at level L, Wt x Ht texels */
const chunkSvg = (geo, rect, L, Wt, Ht, pad, C) => {
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
  // period water: only on the chunks it touches (resvg panics on a clipped group whose content misses the canvas)
  let lake = "";
  for (const l of geo.lakes) {
    if (l.box.x1 < rx.x0 || l.box.x0 > rx.x1 || l.box.y1 < rx.y0 || l.box.y0 > rx.y1) continue;
    const c = clipRing(l.ring, rx);
    if (c) lake += ringD(c);
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
      wl += `<path d="${wlLand}" fill="none" stroke="${mix(C.sea, C.ink, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
      wl += `<path d="${wlLand}" fill="none" stroke="${C.sea}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
    }
  const dash = `${px(8)} ${px(5)}`;
  const vb = `${rect.x0 - pad / L.s} ${rect.y0 - pad / L.s} ${Wt / L.s} ${Ht / L.s}`;
  const lakeDefs = lake
    ? `<clipPath id="lake"><path d="${lake}" clip-rule="evenodd"/></clipPath><clipPath id="dry"><path d="M${rx.x0 - 10},${rx.y0 - 10}H${rx.x1 + 10}V${rx.y1 + 10}H${rx.x0 - 10}Z ${lake}" clip-rule="evenodd"/></clipPath>`
    : "";
  const lakeLayers = lake
    ? `
<g clip-path="url(#dry)">
  <path d="${lake}" fill="none" stroke="${C.rim}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${lake}" fill="none" stroke="${C.rim}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
</g>
<path d="${lake}" fill="${C.sea}" fill-rule="evenodd"/>
<g clip-path="url(#lake)">
  <path d="${lake}" fill="none" stroke="${mix(C.sea, C.ink, 0.3)}" stroke-width="${px(2 * wlGap + 1.15)}" stroke-linejoin="round"/>
  <path d="${lake}" fill="none" stroke="${C.sea}" stroke-width="${px(2 * wlGap - 1.15)}" stroke-linejoin="round"/>
</g>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Wt}" height="${Ht}" viewBox="${vb}">
<defs><clipPath id="land"><path d="${land || "M0,0Z"}" clip-rule="evenodd"/></clipPath>${lakeDefs}</defs>
<rect x="${rx.x0 - 10}" y="${rx.y0 - 10}" width="${rx.x1 - rx.x0 + 20}" height="${rx.y1 - rx.y0 + 20}" fill="${C.sea}"/>
${wl}
<path d="${grat}" fill="none" stroke="${C.ink}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
${
  land
    ? `<path d="${land}" fill="${C.land}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${land}" fill="none" stroke="${C.rim}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${land}" fill="none" stroke="${C.rim}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${grat}" fill="none" stroke="${C.ink}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>${lakeLayers}`
    : ""
}
${borders ? `<path d="${borders}" fill="none" stroke="${C.ink}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
${land ? `<path d="${land}" fill="none" stroke="${C.ink}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>` : ""}${lake ? `\n<path d="${lake}" fill="none" stroke="${C.ink}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>` : ""}
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
/** the RGB tile at (tx, ty) texels of an RGBA pixmap; { flat: "#rrggbb" } if it is one colour */
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

// --- levels -----------------------------------------------------------------------
/** a level rect spec -> world px { x0, y0, x1, y1 } */
export const rectOf = (W, q, frame) => {
  if (typeof q === "function") return q(W);
  if (q.lon) return boxPx(W, q);
  if (q.around) {
    const [ox, oy] = W.proj(q.around);
    const w = frame[0] / q.k;
    const h = frame[1] / q.k;
    const [west, east, north, south] = q.views;
    return { x0: ox - west * w, x1: ox + east * w, y0: oy - north * h, y1: oy + south * h };
  }
  return q;
};

/** bake one world's tiles; returns its level grids (for the levels module) */
export const bakeWorld = async (W, levelDefs, opt) => {
  const { tile: TILE, pad: PAD, chunk: CH, tileDir, outPath, frame, palette, onlyLevels } = opt;
  const t0 = Date.now();
  const geo = {
    land: landOf(W),
    borders: bordersOf(W),
    grat: graticuleOf(W),
    lakes: lakesOf(W).map((ring) => {
      let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const [x, y] of ring) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      return { ring, box: { x0, y0, x1, y1 } };
    }),
  };
  console.log(`${W.name}: geometry ${Date.now() - t0} ms (${geo.land.length} polygons, ${geo.borders.length} border lines, ${geo.lakes.length} lakes)`);
  const levels = [];
  let bytes = 0;
  let files = 0;
  for (const L0 of levelDefs) {
    const L = { ...L0, rects: L0.rects.map((q) => rectOf(W, q, frame)) };
    const tl = Date.now();
    const x0 = Math.floor(Math.min(...L.rects.map((r) => r.x0)));
    const y0 = Math.floor(Math.min(...L.rects.map((r) => r.y0)));
    const x1 = Math.max(...L.rects.map((r) => r.x1));
    const y1 = Math.max(...L.rects.map((r) => r.y1));
    const tw = TILE / L.s;
    const cols = Math.ceil((x1 - x0) / tw);
    const rows = Math.ceil((y1 - y0) / tw);
    if (onlyLevels && !onlyLevels.has(L.name)) continue;
    const want = (c, r) => {
      const cx0 = x0 + c * tw;
      const cy0 = y0 + r * tw;
      return L.rects.some((q) => cx0 < q.x1 && cx0 + tw > q.x0 && cy0 < q.y1 && cy0 + tw > q.y0);
    };
    // land cut at the world's clip box draws a false coast: fine in a grid's padding, not inside a rect a camera views
    const cut = geo.land.cutPts.filter(([x, y]) => L.rects.some((q) => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1));
    if (cut.length) console.warn(`  WARNING ${L.name}: land is cut at the world's clip box inside this level's rects (a false coast; widen clip), e.g. lon/lat ${W.proj.invert(cut[0]).map((v) => v.toFixed(1))}`);
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
        const svg = chunkSvg(geo, rect, L, Wt, Ht, PAD, palette);
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
              writeOut(outPath(`${tileDir}/${W.name}-${L.name}-${c}-${r}.png`), t.png);
              bytes += t.png.length;
              files++;
              cells[r * cols + c] = "#";
            }
          }
        // resvg's canvases are native memory, released by finalizers that only run when
        // the event loop turns: collect and yield after every chunk, or a bake climbs to ~10 GB
        if (globalThis.Bun) Bun.gc(true);
        await new Promise((res) => setImmediate(res));
      }
    levels.push({ name: L.name, s: L.s, kBake: L.kBake, band: L.band, x0, y0, tw, cols, rows, cells: cells.join(""), colors });
    console.log(
      `  ${L.name}: s ${L.s}, ${cols}x${rows} cells, ${cells.filter((v) => v === "#").length} tiles, ${cells.filter((v) => v >= "a" && v <= "z").length} flat; ${(rendered / 1e6).toFixed(0)} Mpx in ${((Date.now() - tl) / 1000).toFixed(1)} s`,
    );
  }
  console.log(`${W.name}: ${files} tiles, ${(bytes / 1e6).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return levels;
};

// --- the levels modules -------------------------------------------------------------
const cap = (s) => s[0].toUpperCase() + s.slice(1);
/** names: pearl -> pearlLevels.ts, pearlLevelsAsia.ts, PearlLevel, PEARL_LEVELS_ASIA, PEARL_TILE */
export const levelNames = (name, world) => ({
  index: `${name}Levels`,
  file: `${name}Levels${cap(world)}`,
  type: `${cap(name)}Level`,
  konst: `${name.toUpperCase()}_LEVELS_${world.toUpperCase()}`,
  prefix: name.toUpperCase(),
});
export const worldLevelsTs = (name, world, levels, { tile, pad, tileDir }, generatedBy) => {
  const n = levelNames(name, world);
  return `// Generated by ${generatedBy} — do not edit by hand.
// The ${world.toUpperCase()} world's static map as a tiled raster LOD pyramid. A level's
// cell (col, row) covers world [x0 + col tw, x0 + (col + 1) tw) x [y0 + row tw, ...);
// its image ${tileDir}/${world}-<name>-<col>-<row>.png has ${tile} + 2 x ${pad} px (a ${pad} px
// overlap all round). cells[row * cols + col]: "#" = a tile image, "." = no cell,
// "a".."z" = one flat colour (colors[code - 97]). band: the k range the level
// fades in over (null = the base, always drawn).
import type { ${n.type} } from ${JSON.stringify(`./${n.index}`)};
export const ${n.konst}: ${n.type}[] = ${JSON.stringify(levels)};
`;
};
export const placeholderLevelsTs = (name, world, generatedBy) => {
  const n = levelNames(name, world);
  return `// placeholder until ${generatedBy} ${world} runs\nimport type { ${n.type} } from ${JSON.stringify(`./${n.index}`)};\nexport const ${n.konst}: ${n.type}[] = [];\n`;
};
export const indexLevelsTs = (name, worlds, { tile, pad }, generatedBy) => {
  const n0 = levelNames(name, worlds[0]);
  const files = worlds.map((w) => levelNames(name, w).file);
  const pretty = files.length === 1 ? `${files[0]}.ts` : `${files.slice(0, -1).map((f) => `${f}.ts`).join(", ")} / ${files[files.length - 1]}.ts`;
  const what = worlds.length === 1 ? "the world's raster LOD pyramid" : worlds.length === 2 ? "the two worlds' raster LOD pyramids" : `the ${worlds.length} worlds' raster LOD pyramids`;
  return `// Generated by ${generatedBy} — do not edit by hand.
// Index of ${what} (see ${pretty}).
export type ${n0.type} = {
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
export const ${n0.prefix}_TILE = ${tile};
export const ${n0.prefix}_PAD = ${pad};
${worlds.map((w) => `export { ${levelNames(name, w).konst} } from ${JSON.stringify(`./${levelNames(name, w).file}`)};`).join("\n")}
`;
};
