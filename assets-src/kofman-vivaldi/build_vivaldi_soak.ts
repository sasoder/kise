// Bakes the Vivaldi flood field -> generated/components/kofman-vivaldi/vivaldiSoakData.ts
// Run: bun assets-src/kofman-vivaldi/build_vivaldi_soak.ts
//
// The field is the harmonic interpolation (Laplace's equation) inside RETAKEN_VIVALDI between the patch's
// Ukrainian-side edge (the 15 Aug 2026 front there, value 0) and its east edge (the 15 Oct 2026 front, value 1).
// Its level sets sweep smoothly from the old front to the new one, pinned at the two points where the fronts meet.
// The values are then equalised by area (the level v holds the fraction v of the patch's area on its west side), so a
// threshold rising linearly floods equal areas per frame and 8-bit levels are evenly spaced over the patch.
// Stored as the ALPHA of a white RGBA PNG (alpha = v), 2 world px per pixel, cells outside the patch extended from
// their inside neighbours so bilinear sampling at the patch's edge stays clean (the cut clips to the vector patch).
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";
import { MAINFRONT_20261015, RETAKEN_VIVALDI } from "../../generated/components/kofman-vivaldi/lymanFrontData";

const OUT = `${import.meta.dir}/../../generated/components/kofman-vivaldi/vivaldiSoakData.ts`;
const CHECK = process.argv[2]; // optional: also write the PNG here to look at
type P = [number, number];
const ring: P[] = RETAKEN_VIVALDI.split("M")
  .filter((s) => s.trim())
  .map((s) => s.replace(/Z/g, "").trim().split("L").map((p) => p.trim().split(/\s+/).map(Number) as P))
  .sort((a, b) => b.length - a.length)[0];
const eq = (a: P, b: P) => Math.abs(a[0] - b[0]) < 0.05 && Math.abs(a[1] - b[1]) < 0.05;
// the patch's east edge = the stretch of the 15 Oct front that is also patch boundary
const onOct = ring.map((p) => MAINFRONT_20261015.some((q) => eq(p, q as P)));
// a ring segment is on the Oct edge when both ends are on it and consecutive on the front
const octIdx = (p: P) => MAINFRONT_20261015.findIndex((q) => eq(p, q as P));
const segOct = ring.map((p, i) => {
  const q = ring[(i + 1) % ring.length];
  if (!onOct[i] || !onOct[(i + 1) % ring.length]) return false;
  return Math.abs(octIdx(p) - octIdx(q)) === 1;
});
console.log("ring", ring.length, "oct segments", segOct.filter(Boolean).length);

const C = 2;
const X0 = 10, Y0 = 310, NX = 406, NY = 446;
const inside = (x: number, y: number) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const segDist = (x: number, y: number, a: P, b: P) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
};
const N = NX * NY;
const isIn = new Uint8Array(N);
const u = new Float64Array(N);
const fixed = new Uint8Array(N);
for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) isIn[j * NX + i] = inside(X0 + (i + 0.5) * C, Y0 + (j + 0.5) * C) ? 1 : 0;
// Dirichlet values on the outside cells next to the patch: the class of the nearest boundary segment;
// initial guess inside: distance ratio
for (let j = 0; j < NY; j++)
  for (let i = 0; i < NX; i++) {
    const id = j * NX + i;
    const x = X0 + (i + 0.5) * C, y = Y0 + (j + 0.5) * C;
    let dA = Infinity, dO = Infinity;
    for (let s = 0; s < ring.length; s++) {
      const d = segDist(x, y, ring[s], ring[(s + 1) % ring.length]);
      if (segOct[s]) dO = Math.min(dO, d);
      else dA = Math.min(dA, d);
    }
    if (isIn[id]) u[id] = dA / (dA + dO);
    else {
      fixed[id] = 1;
      u[id] = dO < dA ? 1 : 0;
    }
  }
// SOR on the inside cells
const W = 1.94;
for (let it = 0; it < 6000; it++) {
  let md = 0;
  for (let j = 1; j < NY - 1; j++)
    for (let i = 1; i < NX - 1; i++) {
      const id = j * NX + i;
      if (!isIn[id]) continue;
      const nv = 0.25 * (u[id - 1] + u[id + 1] + u[id - NX] + u[id + NX]);
      const d = W * (nv - u[id]);
      u[id] += d;
      md = Math.max(md, Math.abs(d));
    }
  if (md < 1e-7) {
    console.log("converged", it);
    break;
  }
}
// equalise by area over the inside cells
const vals: number[] = [];
for (let id = 0; id < N; id++) if (isIn[id]) vals.push(u[id]);
vals.sort((a, b) => a - b);
const cdf = (x: number) => {
  let lo = 0, hi = vals.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (vals[m] < x) lo = m + 1;
    else hi = m;
  }
  return lo / vals.length;
};
const v = new Float64Array(N).fill(-1);
for (let id = 0; id < N; id++) if (isIn[id]) v[id] = cdf(u[id]);
// extend outward 4 rings: each outside cell takes the mean of its valued neighbours
for (let pass = 0; pass < 4; pass++) {
  const nv = v.slice();
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const id = j * NX + i;
      if (v[id] >= 0) continue;
      let s = 0, n = 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= NX || b >= NY) continue;
        const w = v[b * NX + a];
        if (w >= 0) {
          s += w;
          n++;
        }
      }
      if (n) nv[id] = s / n;
    }
  v.set(nv);
}
// spacing stats: world px per 8-bit level (1 / |grad v| / 255)
const sp: number[] = [];
for (let j = 1; j < NY - 1; j++)
  for (let i = 1; i < NX - 1; i++) {
    const id = j * NX + i;
    if (!isIn[id]) continue;
    const gx = (v[id + 1] - v[id - 1]) / (2 * C), gy = (v[id + NX] - v[id - NX]) / (2 * C);
    const g = Math.hypot(gx, gy);
    if (g > 0) sp.push(1 / (g * 255));
  }
sp.sort((a, b) => a - b);
const q = (f: number) => sp[Math.floor(f * (sp.length - 1))].toFixed(2);
console.log("world px per level: p5", q(0.05), "p50", q(0.5), "p95", q(0.95), "p99", q(0.99));

// PNG: white RGBA, alpha = v
const raw = Buffer.alloc((NX * 4 + 1) * NY);
for (let j = 0; j < NY; j++) {
  raw[j * (NX * 4 + 1)] = 0;
  for (let i = 0; i < NX; i++) {
    const o = j * (NX * 4 + 1) + 1 + i * 4;
    const w = v[j * NX + i];
    raw[o] = raw[o + 1] = raw[o + 2] = 255;
    raw[o + 3] = w < 0 ? 0 : Math.max(0, Math.min(255, Math.round(w * 255)));
  }
}
const crcT = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc = (b: Buffer) => {
  let c = -1;
  for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (t: string, d: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(d.length);
  const td = Buffer.concat([Buffer.from(t), d]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(NX, 0);
ihdr.writeUInt32BE(NY, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
if (CHECK) writeFileSync(CHECK, png);
const b64 = png.toString("base64");
writeFileSync(
  OUT,
  `// GENERATED by assets-src/kofman-vivaldi/build_vivaldi_soak.ts — do not hand-edit.
// The Vivaldi flood field: harmonic interpolation inside RETAKEN_VIVALDI from its Ukrainian-side edge (the 15 Aug 2026
// front there, 0) to its east edge (the 15 Oct 2026 front, 1), equalised by area, stored as the ALPHA of a white RGBA PNG.
// SOAK_BOX is the image's world box (2 world px per pixel). Cells outside the patch are extended; clip to the patch.
export const SOAK_BOX = { x: ${X0}, y: ${Y0}, w: ${NX * C}, h: ${NY * C} };
export const SOAK_PNG = "data:image/png;base64,${b64}";
`,
);
console.log("wrote", OUT, (b64.length / 1024).toFixed(0), "KB");
