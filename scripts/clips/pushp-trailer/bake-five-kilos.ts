// Bakes the cut-outs of FiveKilosThreeKilo (pushp-trailer, cut 30) into public/pushp-trailer/fk_*.png.
//   bun scripts/clips/pushp-trailer/bake-five-kilos.ts
// fk_land.png        the farmland of fields_clean_healed.jpg cut along its own horizon (mountains, chimneys), sky gone
// fk_land_soft.png   its alpha, quarter size and blurred: the soft shadow the print casts on the paper
// fk_iron.png        iron_weight_ai.png with the white inside its ring punched out
// fk_aircraft.png    aircraft_flight_ai.png with the nibbled belly edge smoothed and the pale rim taken down
// fk_cloud_a/b.png   scissor-cut clouds from public/zach-kelly-johnson (b&w plates)
// Colour stays in the files: the grade is applied in the component.
import { spawnSync } from "node:child_process";

const OUT = "public/pushp-trailer";

type Im = { w: number; h: number; d: Uint8Array };
const probe = (p: string) => {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", p]);
  const [w, h] = r.stdout.toString().trim().split(",").map(Number);
  return { w, h };
};
const read = (p: string): Im => {
  const { w, h } = probe(p);
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", p, "-f", "rawvideo", "-pix_fmt", "rgba", "-"], { maxBuffer: 1e9 });
  return { w, h, d: new Uint8Array(r.stdout) };
};
const write = (p: string, im: Im, scale?: number) => {
  const vf = scale ? ["-vf", `scale=iw*${scale}:ih*${scale}:flags=area`] : [];
  const r = spawnSync(
    "ffmpeg",
    ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${im.w}x${im.h}`, "-i", "-", ...vf, "-pix_fmt", "rgba", p],
    { input: im.d, maxBuffer: 1e9 },
  );
  if (r.status !== 0) throw new Error(r.stderr.toString());
  console.log(p, im.w, im.h);
};
const lum = (im: Im, x: number, y: number) => {
  const i = (y * im.w + x) * 4;
  return 0.299 * im.d[i] + 0.587 * im.d[i + 1] + 0.114 * im.d[i + 2];
};
const smooth = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
/** Separable box blur of a float field, run twice (close to a gaussian). */
const blur = (src: Float32Array, w: number, h: number, r: number) => {
  let a = src;
  for (let pass = 0; pass < 2; pass++) {
    const b = new Float32Array(a.length);
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += a[y * w + Math.max(0, Math.min(w - 1, x))];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = s / (2 * r + 1);
        s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)];
      }
    }
    const c = new Float32Array(a.length);
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += b[Math.max(0, Math.min(h - 1, y)) * w + x];
      for (let y = 0; y < h; y++) {
        c[y * w + x] = s / (2 * r + 1);
        s += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
    a = c;
  }
  return a;
};
/** Crisp scissor edge: blur the mask, then a narrow ramp around 0.5. */
const scissor = (m: Float32Array, w: number, h: number, r: number, level = 0.5, ramp = 0.04) => {
  const b = blur(m, w, h, r);
  const o = new Float32Array(m.length);
  for (let i = 0; i < m.length; i++) o[i] = smooth((b[i] - (level - ramp)) / (2 * ramp));
  return o;
};
const withAlpha = (src: Im, a: Float32Array, x0 = 0, y0 = 0, w = src.w, h = src.h): Im => {
  const d = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const si = ((y + y0) * src.w + x + x0) * 4;
      const i = (y * w + x) * 4;
      d[i] = src.d[si];
      d[i + 1] = src.d[si + 1];
      d[i + 2] = src.d[si + 2];
      d[i + 3] = Math.round(255 * a[y * w + x]);
    }
  return { w, h, d };
};
/** A rough polyline wobble: stable pseudo-random from the index. */
const wob = (i: number) => Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453);

// ---------------------------------------------------------------- the land
{
  const src = read(`${OUT}/fields_clean_healed.jpg`);
  const Y0 = 880;
  const Y1 = 1040;
  const top = new Float32Array(src.w);
  for (let x = 0; x < src.w; x++) {
    let sky = 0;
    for (let y = Y0 - 40; y < Y0; y++) sky += lum(src, x, y) / 40;
    let found = Y1;
    for (let y = Y0; y < Y1; y++) {
      let run = 0;
      for (let k = 0; k < 8; k++) if (lum(src, x, y + k) < sky * 0.72) run++;
      if (run >= 7) {
        found = y;
        break;
      }
    }
    top[x] = found;
  }
  // median, then a light mean: a hand with scissors follows the line, not every pixel
  const med = new Float32Array(src.w);
  for (let x = 0; x < src.w; x++) {
    const v: number[] = [];
    for (let k = -14; k <= 14; k++) v.push(top[Math.max(0, Math.min(src.w - 1, x + k))]);
    v.sort((a, b) => a - b);
    med[x] = v[14];
  }
  const line = new Float32Array(src.w);
  for (let x = 0; x < src.w; x++) {
    let s = 0;
    for (let k = -5; k <= 5; k++) s += med[Math.max(0, Math.min(src.w - 1, x + k))] / 11;
    line[x] = s;
  }
  let minY = 1e9;
  for (const v of line) minY = Math.min(minY, v);
  const y0 = Math.max(0, Math.floor(minY) - 12);
  const w = src.w;
  const h = src.h - y0;
  // the two side cuts: long nearly straight scissor runs
  const sideX = (y: number, base: number, sgn: number) => {
    const seg = y / 180;
    const i = Math.floor(seg);
    const t = seg - i;
    const a = wob(i + (sgn > 0 ? 40 : 90)) * 26;
    const b = wob(i + 1 + (sgn > 0 ? 40 : 90)) * 26;
    return base + sgn * (a + (b - a) * t + 0.035 * y);
  };
  const a = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const inTop = smooth((y + y0 - line[x] + 1) / 2);
      const inL = smooth((x - sideX(y, 22, 1) + 1) / 2);
      const inR = smooth((sideX(y, w - 22, -1) - x + 1) / 2);
      a[y * w + x] = inTop * inL * inR;
    }
  write(`${OUT}/fk_land.png`, withAlpha(src, a, 0, y0, w, h));
  console.log("land horizon rows", minY, "crop y0", y0, "aspect", w / h, "median row", med[Math.floor(w / 2)] - y0);
  const soft = blur(a, w, h, 22);
  const sd = new Uint8Array(w * h * 4);
  for (let i = 0; i < a.length; i++) sd[i * 4 + 3] = Math.round(255 * soft[i]);
  write(`${OUT}/fk_land_soft.png`, { w, h, d: sd }, 0.25);
}

// ---------------------------------------------------------------- the iron: punch the ring's white out
{
  const src = read(`${OUT}/iron_weight_ai.png`);
  const { w, h } = src;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [170 * w + 375];
  seen[stack[0]] = 1;
  while (stack.length) {
    const p = stack.pop() as number;
    const x = p % w;
    const y = Math.floor(p / w);
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (q < 0 || seen[q]) continue;
      if (lum(src, q % w, Math.floor(q / w)) >= 120) {
        seen[q] = 1;
        stack.push(q);
      }
    }
  }
  const hole = new Float32Array(w * h);
  for (let i = 0; i < hole.length; i++) hole[i] = seen[i] ? 1 : 0;
  // grow past the pale fringe, then a clean edge
  const grown = scissor(hole, w, h, 3, 0.28, 0.1);
  const a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = (src.d[i * 4 + 3] / 255) * (1 - grown[i]);
  write(`${OUT}/fk_iron.png`, withAlpha(src, a));
}

// ---------------------------------------------------------------- the aircraft: a smooth belly edge
{
  const src = read(`${OUT}/aircraft_flight_ai.png`);
  const { w, h } = src;
  const al = new Float32Array(w * h);
  for (let i = 0; i < al.length; i++) al[i] = src.d[i * 4 + 3] / 255;
  const sm = scissor(al, w, h, 7, 0.68, 0.06);
  const a = new Float32Array(al);
  // only inside the belly window, feathered into the untouched matte
  for (let y = 380; y < 540; y++)
    for (let x = 800; x < 1420; x++) {
      const f = smooth((x - 800) / 30) * smooth((1420 - x) / 30) * smooth((y - 380) / 20) * smooth((540 - y) / 10);
      a[y * w + x] = al[y * w + x] * (1 - f) + Math.min(al[y * w + x], sm[y * w + x]) * f;
    }
  // the pale rim: the matte's bright edge pixels are pulled down to dark carbon and the edge eaten by about a pixel.
  // The two rotors (soft baked blur) are left alone.
  const soft = blur(a, w, h, 4);
  const rimmed = withAlpha(src, a);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const inRotor = (x > 350 && x < 900 && y < 175) || (x > 1500 && y > 270 && y < 420);
      if (inRotor) continue;
      const i = y * w + x;
      const b = soft[i];
      const e = smooth((0.97 - b) / 0.2);
      const L = lum(src, x, y);
      if (e > 0 && L > 62) {
        const t = (L + (62 - L) * e) / L;
        rimmed.d[i * 4] = Math.round(rimmed.d[i * 4] * t);
        rimmed.d[i * 4 + 1] = Math.round(rimmed.d[i * 4 + 1] * t);
        rimmed.d[i * 4 + 2] = Math.round(rimmed.d[i * 4 + 2] * t);
      }
      rimmed.d[i * 4 + 3] = Math.round(rimmed.d[i * 4 + 3] * smooth((b - 0.5) / 0.12));
    }
  write(`${OUT}/fk_aircraft.png`, rimmed);
}

// ---------------------------------------------------------------- clouds
// Hand-placed puffs inside each cloud's body: the silhouette is a scissor line, the texture inside is the real photograph.
const cloud = (srcPath: string, out: string, puffs: [number, number, number][], floor: (x: number) => number) => {
  const src = read(srcPath);
  let x0 = 1e9;
  let y0 = 1e9;
  let x1 = 0;
  let y1 = 0;
  for (const [x, y, r] of puffs) {
    x0 = Math.min(x0, x - r);
    y0 = Math.min(y0, y - r);
    x1 = Math.max(x1, x + r);
    y1 = Math.max(y1, y + r);
  }
  x0 = Math.max(0, Math.floor(x0) - 12);
  y0 = Math.max(0, Math.floor(y0) - 12);
  const w = Math.min(src.w, Math.ceil(x1) + 12) - x0;
  const h = Math.min(src.h, Math.ceil(y1) + 12) - y0;
  const m = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const px = x + x0;
      const py = y + y0;
      if (py > floor(px)) continue;
      for (const [cx, cy, r] of puffs) {
        // a little wobble on each puff so no circle reads
        const an = Math.atan2(py - cy, px - cx);
        const rr = r * (1 + 0.06 * Math.sin(an * 5 + cx) + 0.035 * Math.sin(an * 11 + cy));
        if ((px - cx) ** 2 + (py - cy) ** 2 < rr * rr) {
          m[y * w + x] = 1;
          break;
        }
      }
    }
  // close the gaps between puffs: whatever the outside cannot reach is cloud
  const out_ = new Uint8Array(w * h);
  const st: number[] = [];
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) if (!m[y * w + x]) { out_[y * w + x] = 1; st.push(y * w + x); }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) if (!m[y * w + x]) { out_[y * w + x] = 1; st.push(y * w + x); }
  while (st.length) {
    const p = st.pop() as number;
    const x = p % w;
    const y = Math.floor(p / w);
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (q < 0 || out_[q] || m[q]) continue;
      out_[q] = 1;
      st.push(q);
    }
  }
  for (let i = 0; i < m.length; i++) if (!out_[i]) m[i] = 1;
  write(out, withAlpha(src, scissor(m, w, h, 4, 0.5, 0.06), x0, y0, w, h));
};

{
  const s = 2600 / 594; // puffs were read off a 594-wide view of the plate
  const puffs: [number, number, number][] = (
    [
      [300, 100, 54],
      [235, 130, 46],
      [360, 132, 44],
      [175, 150, 32],
      [125, 172, 26],
      [425, 188, 28],
      [470, 200, 30],
      [530, 215, 34],
      [60, 200, 28],
      [100, 205, 36],
      [200, 200, 66],
      [300, 205, 84],
      [400, 240, 70],
      [500, 262, 54],
      [120, 245, 46],
    ] as [number, number, number][]
  ).map(([x, y, r]) => [x * s, y * s, r * s]);
  cloud("public/zach-kelly-johnson/C/plate_sky_cumulus.jpg", `${OUT}/fk_cloud_a.png`, puffs, (x) => 1300 + 44 * Math.sin(x / 190) + 22 * Math.sin(x / 67 + 1.1));
}
cloud(
  "public/zach-kelly-johnson/C2/plate_sky_clouds_fortepan_clean.jpg",
  `${OUT}/fk_cloud_b.png`,
  [
    [1060, 545, 78],
    [970, 590, 56],
    [1150, 595, 62],
    [1250, 635, 44],
    [885, 630, 36],
    [925, 625, 40],
    [1205, 630, 46],
    [1060, 625, 84],
  ],
  (x) => 672 + 8 * Math.sin(x / 37),
);
