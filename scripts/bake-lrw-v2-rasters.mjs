// Bakes LittleRegionalWarV2's static layers: ONE fixed framing, no camera.
//
//   bun scripts/bake-lrw-v2-rasters.mjs
//
// The whole feathered island of Europe sits centred in the 1080x1920 frame,
// scaled as large as it can be while its feather reaches alpha 0 at least
// MARGIN px before every frame edge. Writes, at exactly 1 texel per screen px:
//   public/lrw-v2/land.png      land + rim + mottle/grain + cream coast + the
//                               contact shadow, times the island feather
//   public/lrw-v2/borders.png   the 1914 borders at their dashed default (the
//                               pushed stretches removed), times the feather
//   generated/components/lrwV2Frame.ts   the fixed framing (k, tx, ty)
//
// The island's feather polygon is V2's own (a little tighter than V1's, so the
// island can be bigger), projected here with the same projection as
// scripts/build-ww1-map.mjs; nothing shared is rewritten.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { geoAzimuthalEqualArea } from "d3-geo";
import { Resvg } from "@resvg/resvg-js";
import { COLONIAL_D, LAND_D } from "../generated/components/ww1MapData.ts";
import { LRW_BORDERS_D, LRW_PX_PER_KM } from "../generated/components/lrwMapData.ts";

const OUT_DIR = "public/lrw-v2";
const OUT_TS = "generated/components/lrwV2Frame.ts";
const W = 1080;
const H = 1920;
const MARGIN = 40; // screen px of alpha 0 at every edge, at least
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";
const SHADOW = 0.3;

// the projection of scripts/build-ww1-map.mjs, rebuilt identically
const projection = geoAzimuthalEqualArea().rotate([-15, -25]).scale(1).translate([0, 0]);
{
  const a = projection([-10.5, 53.5]);
  const b = projection([50, 53.5]);
  projection.scale(1080 / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const c = projection([19.75, 53.5]);
  projection.translate([540 - c[0], 835 - c[1]]);
}

// THE ISLAND: Britain and Ireland, France, the Low Countries, Germany,
// Austria-Hungary, Italy to Sicily, the Balkans to Greece, the Russian border
// region; everything beyond dissolves. Blurred by sigma, then clamped so the
// Gaussian tail is exactly 0 (the MARGIN check is on alpha == 0).
const SIGMA_KM = 60;
// (tighter than V1 east and west, so the island can be larger: Ireland's west
// and Bessarabia / the Ukraine feather out)
const FEATHER_LL = [
  [-3, 59.8], [5, 60.3], [12, 59.8], [19, 59.2], [24, 57], [26, 54], [26.8, 51], [28.2, 48.8],
  [29.5, 46.3], [29.3, 43.5], [29.2, 41.4], [27.3, 39.5], [25.5, 37.4], [22.5, 36.0], [15.8, 35.8],
  [12.8, 36.9], [10.5, 38.2], [8.4, 38.6], [7.8, 41.5], [3.8, 41.3], [-2.5, 42.1], [-5.5, 46.5],
  [-8.8, 50.5], [-9.0, 55], [-6.5, 58.8], [-3, 59.8],
];
const featherPts = FEATHER_LL.flatMap(([lon, lat], i, a) => {
  if (i === a.length - 1) return [];
  const [l2, t2] = a[i + 1];
  return Array.from({ length: 8 }, (_, k) => projection([lon + ((l2 - lon) * k) / 8, lat + ((t2 - lat) * k) / 8]));
});
const FEATHER_D = `M${featherPts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
const SIGMA = SIGMA_KM * LRW_PX_PER_KM; // world px
const TAIL = 3.2 * SIGMA; // beyond this the clamped mask is exactly 0

// THE FIXED FRAMING: the island's bbox (polygon + tail + shadow offset) fits
// inside the frame less MARGIN, as large as possible, centred on (540, 960).
const xs = featherPts.map((p) => p[0]);
const ys = featherPts.map((p) => p[1]);
const bb = { x0: Math.min(...xs) - TAIL, x1: Math.max(...xs) + TAIL, y0: Math.min(...ys) - TAIL, y1: Math.max(...ys) + TAIL + 3 };
const k = Math.min((W - 2 * MARGIN) / (bb.x1 - bb.x0), (H - 2 * MARGIN) / (bb.y1 - bb.y0));
const cxW = (bb.x0 + bb.x1) / 2;
const cyW = (bb.y0 + bb.y1) / 2;
const tx = W / 2 - cxW * k;
const ty = H / 2 - cyW * k;
const view = { x0: -tx / k, y0: -ty / k, w: W / k, h: H / k };
console.log(`k ${k.toFixed(4)}  island ${Math.round((bb.x1 - bb.x0) * k)}x${Math.round((bb.y1 - bb.y0) * k)} px`);

const b64 = (file) => `data:image/png;base64,${readFileSync(file).toString("base64")}`;
const MOTTLE = b64("public/ww1/mottle.png");
const GRAIN = b64("public/ww1/grain.png");
const px = (v) => v / k;
const landSvg = `
<defs>
  <clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath>
  <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${px(6)}"/><feComponentTransfer><feFuncA type="linear" slope="1.08" intercept="-0.08"/></feComponentTransfer></filter>
  <pattern id="m1" patternUnits="userSpaceOnUse" x="-1400" y="-900" width="1180" height="1180"><image href="${MOTTLE}" width="1181" height="1181" opacity="0.75"/></pattern>
  <pattern id="m2" patternUnits="userSpaceOnUse" x="-1390" y="-1130" width="770" height="770"><image href="${MOTTLE}" width="771" height="771" opacity="0.45"/></pattern>
  <pattern id="gr" patternUnits="userSpaceOnUse" x="${view.x0}" y="${view.y0}" width="${view.w}" height="${view.h}"><image href="${GRAIN}" width="${view.w}" height="${view.h}"/></pattern>
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
const dash = `${px(8)} ${px(5)}`;
const borderSvg = `
<path d="${COLONIAL_D}" fill="none" stroke="${INK}" stroke-opacity="0.32" stroke-width="${px(1.5)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${LRW_BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>`;
const featherSvg = `<defs><filter id="fb" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${SIGMA}"/></filter></defs><path d="${FEATHER_D}" fill="#fff" filter="url(#fb)"/>`;

// -- PNG + mask multiply (resvg ignores a blur inside an SVG <mask>) ----------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
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
const encodePng = (rgba) => {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};
const render = (body) =>
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="${view.x0} ${view.y0} ${view.w} ${view.h}">${body}</svg>`,
    { fitTo: { mode: "original" }, background: "rgba(0,0,0,0)" },
  )
    .render()
    .pixels;
const FLOOR = 0.012; // the Gaussian tail below this is clamped to exactly 0
const mask = render(featherSvg);
const applyMask = (layer) => {
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const m = Math.max(0, (mask[i * 4 + 3] / 255 - FLOOR) / (1 - FLOOR));
    const a = layer[i * 4 + 3] * m;
    if (a < 0.5) continue;
    for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.min(255, Math.round((layer[i * 4 + c] * m * 255) / a));
    out[i * 4 + 3] = Math.round(a);
  }
  return out;
};
mkdirSync(OUT_DIR, { recursive: true });
for (const [name, body] of [
  ["land", landSvg],
  ["borders", borderSvg],
]) {
  const px4 = applyMask(render(body));
  // the edge check, at bake time: the outer MARGIN px must be alpha 0
  let edge = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if ((x < MARGIN || x >= W - MARGIN || y < MARGIN || y >= H - MARGIN) && px4[(y * W + x) * 4 + 3]) edge++;
  const png = encodePng(px4);
  writeFileSync(`${OUT_DIR}/${name}.png`, png);
  console.log(`${OUT_DIR}/${name}.png: ${(png.length / 1e6).toFixed(2)} MB, non-zero alpha in the ${MARGIN} px edge band: ${edge}`);
}
writeFileSync(
  OUT_TS,
  `// Generated by scripts/bake-lrw-v2-rasters.mjs — do not edit by hand.
// LittleRegionalWarV2's one fixed framing: screen = world * k + (tx, ty).
export const FRAME = ${JSON.stringify({ k: +k.toFixed(6), tx: +tx.toFixed(3), ty: +ty.toFixed(3) })};
`,
);
console.log(`Wrote ${OUT_TS}`);
