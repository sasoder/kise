// Heals the paint-out patch in public/pushp-trailer/sky_palms_clean.jpg (a smooth hexagon with a seam and radial streaks
// left where the aircraft was removed) into sky_palms_healed.jpg: real cloud from the same photograph, mirrored across
// the patch's left edge, blended in on a wide feather. Palms and everything outside the patch are untouched.
// bun scripts/clips/pushp-trailer/heal-sky-plate.ts
import { spawnSync } from "node:child_process";

const W = 3000;
const H = 1600;
const SRC = "public/pushp-trailer/sky_palms_clean.jpg";
const OUT = "public/pushp-trailer/sky_palms_healed.jpg";
// The patch's core, in source px, and the width of the blend beyond it.
const CX = 1740;
const CY = 595;
const RX = 370;
const RY = 245;
const FEATHER = 110;
const MIRROR_X = 1400; // x' = 2 * MIRROR_X - x
const SHIFT_Y = -90;

const buf = new Uint8Array(
  spawnSync("ffmpeg", ["-v", "error", "-i", SRC, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1e8 }).stdout,
);
if (buf.length !== W * H * 3) throw new Error(`unexpected size ${buf.length}`);
const out = new Uint8Array(buf);
const smooth = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    // Superellipse distance: 1 at the core's edge, growing outward.
    const d = Math.pow(Math.pow(Math.abs(x - CX) / RX, 3) + Math.pow(Math.abs(y - CY) / RY, 3), 1 / 3);
    const outside = (d - 1) * Math.min(RX, RY);
    const m = 1 - smooth(outside / FEATHER);
    if (m <= 0) continue;
    const sx = Math.max(0, Math.min(W - 1, 2 * MIRROR_X - x));
    const sy = Math.max(0, Math.min(H - 1, y + SHIFT_Y));
    for (let c = 0; c < 3; c++) {
      const i = (y * W + x) * 3 + c;
      out[i] = Math.round(buf[i] * (1 - m) + buf[(sy * W + sx) * 3 + c] * m);
    }
  }
const res = spawnSync(
  "ffmpeg",
  ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-i", "-", "-q:v", "2", "-frames:v", "1", OUT],
  { input: out, maxBuffer: 1e8 },
);
if (res.status !== 0) throw new Error(String(res.stderr));
