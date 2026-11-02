// Makes public/pushp-trailer/aircraft_palms_decon.png from aircraft_palms.png (untouched) for cuts where the aircraft
// passes over white ink:
//  1. Sky key: sky-coloured pixels (bluish and light) lose their alpha in the prop discs and in a band along the outline.
//     Over the sky this changes nothing visible; over white the grey-blue smear goes.
//  2. Dust: the faint alpha veil, isolated specks and one-pixel spurs on the outline go to alpha 0.
//  3. Decontamination: every pixel still below alpha 0.95 takes the colour of the nearest opaque pixel, so no sky colour
//     is left in the blur or the edge.
// bun scripts/clips/pushp-trailer/clean-aircraft-matte.ts
import { spawnSync } from "node:child_process";

const W = 760;
const H = 400;
const SRC = "public/pushp-trailer/aircraft_palms.png";
const OUT = "public/pushp-trailer/aircraft_palms_decon.png";
const SOLID = 40; // alpha that counts as part of a shape
const OPAQUE = 242; // alpha 0.95
const MIN_AREA = 150; // px; anything smaller is dust
const EDGE_BAND = 3; // px from the outline where the sky key applies on the hull
const PROP_RECTS = [
  { x0: 110, y0: 85, x1: 240, y1: 170 }, // left disc
  { x0: 470, y0: 40, x1: 670, y1: 108 }, // right disc
];

const buf = new Uint8Array(
  spawnSync("ffmpeg", ["-v", "error", "-i", SRC, "-f", "rawvideo", "-pix_fmt", "rgba", "-"], { maxBuffer: 1e8 }).stdout,
);
if (buf.length !== W * H * 4) throw new Error(`unexpected size ${buf.length}`);
const idx = (x: number, y: number) => y * W + x;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const inProp = (x: number, y: number) => PROP_RECTS.some((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
const skyness = (p: number) => {
  const r = buf[p * 4];
  const g = buf[p * 4 + 1];
  const b = buf[p * 4 + 2];
  return clamp((b - r - 6) / 10) * clamp((0.3 * r + 0.59 * g + 0.11 * b - 62) / 25);
};

// Distance from the outline, in px, out to the band's width.
const nearEdge = new Uint8Array(W * H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    if (buf[idx(x, y) * 4 + 3] < SOLID) continue;
    search: for (let dy = -EDGE_BAND; dy <= EDGE_BAND; dy++)
      for (let dx = -EDGE_BAND; dx <= EDGE_BAND; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || buf[idx(nx, ny) * 4 + 3] < SOLID) {
          nearEdge[idx(x, y)] = 1;
          break search;
        }
      }
  }

// 1. the sky key
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const p = idx(x, y);
    if (!buf[p * 4 + 3] || !(inProp(x, y) || nearEdge[p])) continue;
    buf[p * 4 + 3] = Math.round(buf[p * 4 + 3] * (1 - skyness(p)));
  }

// 2. dust: components, spurs, components again
const keep = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) keep[p] = buf[p * 4 + 3] >= SOLID ? 1 : 0;
const dropSmall = () => {
  const seen = new Uint8Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (!keep[s] || seen[s]) continue;
    const stack = [s];
    const members: number[] = [];
    seen[s] = 1;
    while (stack.length) {
      const p = stack.pop() as number;
      members.push(p);
      const x = p % W;
      const y = (p - x) / W;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = idx(nx, ny);
          if (keep[n] && !seen[n]) {
            seen[n] = 1;
            stack.push(n);
          }
        }
    }
    if (members.length < MIN_AREA) for (const m of members) keep[m] = 0;
    else console.log(`shape kept: ${members.length} px`);
  }
};
dropSmall();
for (let pass = 0; pass < 2; pass++) {
  const drop: number[] = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const p = idx(x, y);
      if (!keep[p]) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && keep[p + dy * W + dx]) n++;
      if (n <= 1) drop.push(p);
    }
  for (const p of drop) keep[p] = 0;
}
dropSmall();
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    let touching = 0; // an antialiased pixel stays only if it hugs the shape
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && keep[idx(nx, ny)]) touching++;
      }
    if (!keep[idx(x, y)] && touching < 2) buf[idx(x, y) * 4 + 3] = 0;
  }

// 3. decontaminate: breadth-first from every opaque, non-sky pixel
const owner = new Int32Array(W * H).fill(-1);
let frontier: number[] = [];
for (let p = 0; p < W * H; p++)
  if (buf[p * 4 + 3] >= OPAQUE && skyness(p) < 0.5) {
    owner[p] = p;
    frontier.push(p);
  }
while (frontier.length) {
  const next: number[] = [];
  for (const p of frontier) {
    const x = p % W;
    const y = (p - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = idx(nx, ny);
      if (owner[n] < 0) {
        owner[n] = owner[p];
        next.push(n);
      }
    }
  }
  frontier = next;
}
let recoloured = 0;
const src = new Uint8Array(buf);
for (let p = 0; p < W * H; p++) {
  if (buf[p * 4 + 3] >= OPAQUE && skyness(p) < 0.5) continue;
  for (let c = 0; c < 3; c++) buf[p * 4 + c] = src[owner[p] * 4 + c];
  if (buf[p * 4 + 3]) recoloured++;
}
console.log("recoloured pixels with alpha:", recoloured);

const res = spawnSync(
  "ffmpeg",
  ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", "-", "-frames:v", "1", OUT],
  { input: buf, maxBuffer: 1e8 },
);
if (res.status !== 0) throw new Error(String(res.stderr));
