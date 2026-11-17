// Measures the raised-before-orbit row on a RENDERED frame (full-res PNG): each stack's height vs Skyroot's. The squared
// paper is neutral to bluish and bright, the dashes white, the chain colours saturated, the labels sit >= 10 px above
// the tops; the graded photo bricks are grey, warm (B - R <= -5; the paper is -3..+) or dark. All stand upright: up a few columns across
// each stack's left brick (clear of its strap), from the limb upward, the last brick pixel = the stack's top edge; its
// height is then taken on the stack's centre line (limb y at X minus top y), as the geometry defines it.
//   bun scripts/clips/shruti-trailer/measure-ratio.ts <frame.png> <frame>   (a --scale 2 still measures finer)
import { spawnSync } from "node:child_process";
import { BW, ROW, SKYROOT_USD, SMALL_H, STACK_W, X_S, camAt, cmpRise, limbY } from "../../../generated/components/shruti-trailer/OrbitOnEightyMillion";
import { depthTransform } from "../../../generated/components/neal-stephenson-trailer/nealShared";

const [png, fs] = process.argv.slice(2);
const f = Number(fs);
// the frame may be rendered at --scale 2 (3840 wide) for a finer measure: screen px x S
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=width", "-of", "csv=p=0", png]).stdout.toString().trim();
const W = Number(probe.split(",")[0]);
const S = W / 1920;
const raw = spawnSync("ffmpeg", ["-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1e8 }).stdout as Buffer;
const t = depthTransform(camAt(f));
const brick = (x: number, y: number) => {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const i = ((y + dy) * W + (x + dx)) * 3;
      const sat = Math.max(raw[i], raw[i + 1], raw[i + 2]) - Math.min(raw[i], raw[i + 1], raw[i + 2]);
      if ((raw[i + 2] - raw[i] <= -5 || raw[i + 1] < 140) && raw[i + 1] < 232 && sat < 30) n++; // the grey photo bricks: warm or dark, never the neutral paper, white dashes or the chain colours
    }
  return n >= 5;
};
const height = (X: number) => {
  // a few columns across the left brick's face (clear of its strap); the highest top edge wins
  let best = 0;
  for (const fx of [0.1, 0.2, 0.3, 0.4]) {
    const cx = X - STACK_W / 2 + BW * fx;
    const y0 = limbY(cx);
    let last = 0;
    for (let v = 2; v <= 900; v += 0.25 / S) {
      const sp = t.toScreen(cx, y0 - v);
      if (brick(Math.round(sp.x * S), Math.round(sp.y * S))) last = v;
      else if (v - last > 4 / S) break;
    }
    best = Math.max(best, limbY(X) - (y0 - last));
  }
  return best;
};
const hs = height(X_S);
console.log(`f${f}: SKYROOT ${hs.toFixed(2)} world px measured (geometry ${SMALL_H.toFixed(2)}) = $${SKYROOT_USD}M`);
let worst = 0;
for (const c of ROW) {
  const h = height(c.x);
  const r = h / hs;
  const want = c.usd / SKYROOT_USD;
  const err = (r / want - 1) * 100;
  worst = Math.max(worst, Math.abs(err));
  console.log(`f${f}: ${c.name.padEnd(11)} ${h.toFixed(2)} world px (geometry ${cmpRise(c, f).toFixed(2)}); measured ratio ${r.toFixed(4)} vs ${want.toFixed(4)} (${err >= 0 ? "+" : ""}${err.toFixed(2)} %)`);
}
console.log(`worst ratio error ${worst.toFixed(2)} % (limit 2 %)`);
