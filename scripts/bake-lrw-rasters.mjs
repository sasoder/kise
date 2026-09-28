// Bakes LittleRegionalWar's static layers into RGBA rasters (transparent sea):
//
//   bun scripts/bake-lrw-rasters.mjs
//
// For each level two images:
//   public/lrw/<name>-land.png      land only: a soft contact shadow (black,
//                                   offset down, blurred, 0.3) baked into the
//                                   alpha, the umber land + hand-coloured rim,
//                                   world-space mottle and grain clipped to land,
//                                   the cream coast. Sea alpha = 0.
//   public/lrw/<name>-borders.png   the 1914 borders at their dashed default
//                                   (0.5; African colonial 0.32), minus the
//                                   stretches that get pushed (vectors).
// and generated/components/lrwLevels.ts with each level's world rect.
//
// LEVELS. `wide` holds every frame; `serbia` holds the close-up and both
// glides' ends. A level is baked at the zoom it is shown at (kBake: screen-
// constant stroke widths and dashes) and at s texels per world px >= the
// largest k it is seen at in its hold.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import { COLONIAL_D, LAND_D } from "../generated/components/ww1MapData.ts";
import { LRW_BORDERS_D, LRW_FEATHER_D, LRW_PX_PER_KM } from "../generated/components/lrwMapData.ts";
import { CAM_TRACK, LAND, LAND_RIM, INK, SHADOW } from "../generated/components/LittleRegionalWar.tsx";

const OUT_DIR = "public/lrw";
const OUT_TS = "generated/components/lrwLevels.ts";
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
// [name, kBake, s, frames the rect must hold]
const DEF = [
  ["wide", 1.22, 1.28, range(0, CAM_TRACK.length - 1)],
  ["serbia", 3.4, 3.5, range(67, 158)],
];
const viewOf = (f) => {
  const { k, cx, cy } = CAM_TRACK[f];
  const m = 12 / k;
  return { x0: cx - 540 / k - m, x1: cx + 540 / k + m, y0: cy - 960 / k - m, y1: cy + 960 / k + m };
};
const b64 = (file) => `data:image/png;base64,${readFileSync(file).toString("base64")}`;
const MOTTLE = b64("public/ww1/mottle.png");
const GRAIN = b64("public/ww1/grain.png");

// THE ISLAND OF EUROPE: every layer (land, shadow, borders) is multiplied by
// one world-space mask, the feather polygon blurred by sigma ~70 km, so the
// land is whole over Europe and dissolves over ~250-300 km beyond it. (resvg
// ignores a blur inside an SVG <mask>, so the mask is rendered on its own and
// multiplied into the layers' pixels here.)
const FEATHER_SIGMA = 70 * LRW_PX_PER_KM;
const featherSvg = `<defs><filter id="fb" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${FEATHER_SIGMA}"/></filter></defs><path d="${LRW_FEATHER_D}" fill="#fff" filter="url(#fb)"/>`;

// a minimal RGBA PNG writer
const CRC = (() => {
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
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
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
const encodePng = (w, h, rgba) => {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};
/** premultiplied layer x mask -> straight-alpha PNG */
const applyMask = (layer, mask, w, h) => {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const m = mask[i * 4 + 3] / 255; // the mask's alpha (white on transparent)
    const a = layer[i * 4 + 3] * m;
    if (a < 0.5) continue; // exactly 0
    for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.min(255, Math.round((layer[i * 4 + c] * m * 255) / a));
    out[i * 4 + 3] = Math.round(a);
  }
  return encodePng(w, h, out);
};

const landSvg = (kB) => {
  const px = (v) => v / kB;
  const gw = 1080 / kB;
  const gh = 1920 / kB;
  return `
<defs>
  <clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath>
  <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${px(6)}"/><feComponentTransfer><feFuncA type="linear" slope="1.08" intercept="-0.08"/></feComponentTransfer></filter>
  <pattern id="m1" patternUnits="userSpaceOnUse" x="-1400" y="-900" width="1180" height="1180"><image href="${MOTTLE}" width="1181" height="1181" opacity="0.75"/></pattern>
  <pattern id="m2" patternUnits="userSpaceOnUse" x="-1390" y="-1130" width="770" height="770"><image href="${MOTTLE}" width="771" height="771" opacity="0.45"/></pattern>
  <pattern id="gr" patternUnits="userSpaceOnUse" width="${gw}" height="${gh}"><image href="${GRAIN}" width="${gw}" height="${gh}"/></pattern>
</defs>
<g filter="url(#soft)" opacity="${SHADOW}"><path d="${LAND_D}" transform="translate(${px(2)} ${px(5)})" fill="#000" fill-rule="evenodd"/></g>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <g opacity="0.9"><rect x="-3000" y="-3000" width="9000" height="12000" fill="url(#m1)"/><rect x="-3000" y="-3000" width="9000" height="12000" fill="url(#m2)"/></g>
  <rect x="-3000" y="-3000" width="9000" height="12000" fill="url(#gr)"/>
</g>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`;
};
const borderSvg = (kB) => {
  const px = (v) => v / kB;
  const dash = `${px(8)} ${px(5)}`;
  return `
<path d="${COLONIAL_D}" fill="none" stroke="${INK}" stroke-opacity="0.32" stroke-width="${px(1.5)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${LRW_BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>`;
};

mkdirSync(OUT_DIR, { recursive: true });
const levels = [];
for (const [name, kB, s, frames] of DEF) {
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const f of frames) {
    const v = viewOf(f);
    r.x0 = Math.min(r.x0, v.x0);
    r.y0 = Math.min(r.y0, v.y0);
    r.x1 = Math.max(r.x1, v.x1);
    r.y1 = Math.max(r.y1, v.y1);
  }
  r.x0 = Math.floor(r.x0);
  r.y0 = Math.floor(r.y0);
  const W = Math.round((Math.ceil(r.x1) - r.x0) * s);
  const H = Math.round((Math.ceil(r.y1) - r.y0) * s);
  if (W > 8000 || H > 8000) throw new Error(`${name}: ${W}x${H} exceeds 8k`);
  const wrap = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="${r.x0} ${r.y0} ${W / s} ${H / s}">${body}</svg>`;
  const render = (body) => new Resvg(wrap(body), { fitTo: { mode: "original" }, background: "rgba(0,0,0,0)" }).render().pixels;
  const mask = render(featherSvg);
  for (const [layer, body] of [
    ["land", landSvg(kB)],
    ["borders", borderSvg(kB)],
  ]) {
    const t0 = Date.now();
    const png = applyMask(render(body), mask, W, H);
    const file = `${OUT_DIR}/${name}-${layer}.png`;
    writeFileSync(file, png);
    console.log(`${file}: ${W}x${H}, ${(png.length / 1e6).toFixed(2)} MB, ${Date.now() - t0} ms`);
  }
  levels.push({ name, kBake: kB, s, x0: r.x0, y0: r.y0, w: W / s, h: H / s, W, H });
}
writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-lrw-rasters.mjs — do not edit by hand.
// LittleRegionalWar's raster levels: world rect (x0, y0, w, h), bake zoom kBake
// and texels per world px s. Images: public/lrw/<name>-land.png, -borders.png.
export type Level = { name: string; kBake: number; s: number; x0: number; y0: number; w: number; h: number; W: number; H: number };
export const LEVELS: Level[] = ${JSON.stringify(levels, null, 2)};
`,
);
console.log(`Wrote ${OUT_TS}`);
