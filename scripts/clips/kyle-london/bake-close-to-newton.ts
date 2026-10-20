// Bake the CloseToNewton portrait medallions (kyle-london, cut 22).
//
//   bun scripts/clips/kyle-london/bake-close-to-newton.ts "<working>/animation_source/refs"
//
// The refs are downloaded files (untrusted data): only ffmpeg decodes them; this script handles raw pixel bytes.
// Per portrait: ffmpeg crops head-and-shoulders, scales and sharpens -> raw RGB; here: luminance, levels from the
// 1st / 99.6th percentile inside the oval, a gentle S curve, the cream duotone (DARK umber shadows -> INK cream,
// the plagueShared manner: roughly a linear mix, mid grey ~ rgb(106,98,79)), a soft darkening toward the oval rim
// and an oval alpha. Writes public/kyle-london/ctn_<name>.png and the inlined webp data module
// generated/components/kyle-london/closeToNewtonData.ts (an SVG <image> via staticFile drops frames: CRAFT.md).
import { join } from "node:path";

const refs = process.argv[2];
if (!refs) throw new Error("usage: bun bake-close-to-newton.ts <refs dir>");
const ROOT = join(import.meta.dir, "../../..");
const OUT_PNG = join(ROOT, "public/kyle-london");
const OUT_TS = join(ROOT, "generated/components/kyle-london/closeToNewtonData.ts");

// crop boxes in SOURCE px (x, y, w, h); the box aspect = the output aspect
type Spec = { name: string; file: string; crop: [number, number, number, number]; out: [number, number]; gamma?: number; lift?: number };
const ASPECT = 0.78;
const box = (cx: number, top: number, w: number): [number, number, number, number] => [Math.round(cx - w / 2), Math.round(top), Math.round(w), Math.round(w / ASPECT)];
const SPECS: Spec[] = [
  { name: "pepys", file: "portrait_Pepys_1666.jpg", crop: box(885, 0, 1190), out: [1100, 1410] },
  { name: "newton", file: "portrait_Newton_1689.jpg", crop: box(1010, 0, 1090), out: [720, 923] },
  { name: "wren", file: "portrait_Wren_1711.jpg", crop: box(475, 180, 345), out: [560, 718] },
  { name: "halley", file: "portrait_Halley_1690.jpg", crop: box(826, 240, 1000), out: [560, 718] },
  { name: "boyle", file: "portrait_Boyle_1689.jpg", crop: box(787, 214, 690), out: [560, 718] },
  { name: "evelyn", file: "portrait_Evelyn_1687.jpg", crop: box(461, 0, 528), out: [560, 718] },
];
const only = process.argv[3]?.split(",");

const DARK = [23, 18, 13];
const MID = [106, 98, 79];
const INK = [233, 221, 191];
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

const run = async (args: string[], input?: Uint8Array) => {
  const p = Bun.spawn(["ffmpeg", "-v", "error", ...args], { stdin: input ? "pipe" : "ignore", stdout: "pipe", stderr: "pipe" });
  if (input) {
    p.stdin!.write(input);
    p.stdin!.end();
  }
  const out = new Uint8Array(await new Response(p.stdout).arrayBuffer());
  const err = await new Response(p.stderr).text();
  if ((await p.exited) !== 0) throw new Error(err);
  return out;
};

const lines: string[] = [];
for (const s of SPECS) {
  if (only && !only.includes(s.name)) continue;
  const [W, H] = s.out;
  const [cx, cy, cw, ch] = s.crop;
  const rgb = await run(["-i", join(refs, s.file), "-vf", `crop=${cw}:${ch}:${cx}:${cy},scale=${W}:${H}:flags=lanczos,unsharp=5:5:0.7:5:5:0`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
  if (rgb.length !== W * H * 3) throw new Error(`${s.name}: got ${rgb.length} bytes`);
  const L = new Float32Array(W * H);
  const r = new Float32Array(W * H);
  const inside: number[] = [];
  for (let i = 0; i < W * H; i++) {
    // luminance with a slight red lean (lifts faces out of the brown coats)
    L[i] = 0.36 * rgb[i * 3] + 0.54 * rgb[i * 3 + 1] + 0.1 * rgb[i * 3 + 2];
    const x = ((i % W) + 0.5) / W - 0.5;
    const y = (Math.floor(i / W) + 0.5) / H - 0.5;
    r[i] = Math.hypot(x / 0.5, y / 0.5);
    if (r[i] < 0.92) inside.push(L[i]);
  }
  inside.sort((a, b) => a - b);
  const lo = inside[Math.floor(inside.length * 0.01)];
  const hi = inside[Math.floor(inside.length * 0.996)];
  const g = s.gamma ?? 0.92;
  const out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    let t = Math.min(1, Math.max(0, (L[i] - lo) / (hi - lo)));
    t = Math.pow(t, g);
    t = 0.75 * t + 0.25 * smooth(t); // gentle S
    t *= 1 - 0.38 * smooth((r[i] - 0.72) / 0.28); // sink toward the rim
    // duotone through the marmot roundel's mid
    const c = t < 0.4 ? DARK.map((d, k) => d + (MID[k] - d) * (t / 0.4)) : MID.map((m, k) => m + (INK[k] - m) * ((t - 0.4) / 0.6));
    out[i * 4] = Math.round(c[0]);
    out[i * 4 + 1] = Math.round(c[1]);
    out[i * 4 + 2] = Math.round(c[2]);
    const edge = Math.min(W, H) * 0.004; // ~3 px feather
    out[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, ((1 - r[i]) * Math.min(W, H)) / (2 * edge) + 0.5)));
  }
  const png = join(OUT_PNG, `ctn_${s.name}.png`);
  await run(["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", "-", "-frames:v", "1", png], out);
  const webp = await run(["-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-i", "-", "-frames:v", "1", "-c:v", "libwebp", "-quality", "88", "-f", "webp", "-"], out);
  lines.push(`  ${s.name}: "data:image/webp;base64,${Buffer.from(webp).toString("base64")}",`);
  console.log(`${s.name}: ${W}x${H} levels ${lo.toFixed(0)}..${hi.toFixed(0)} webp ${(webp.length / 1024).toFixed(0)} KB`);
}

if (!only) {
  const ts = `// Baked by scripts/clips/kyle-london/bake-close-to-newton.ts: the CloseToNewton portrait medallions, cream duotone,
// oval alpha (w / h = ${ASPECT}). PNGs in public/kyle-london/ctn_*.png. Sources: see CloseToNewton.tsx header.
export const PORTRAIT_ASPECT = ${ASPECT};
export const PORTRAITS = {
${lines.join("\n")}
} as const;
export type PortraitName = keyof typeof PORTRAITS;
`;
  await Bun.write(OUT_TS, ts);
  console.log(`wrote ${OUT_TS}`);
}
