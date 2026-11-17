// Measures tower : small stack on a RENDERED frame (full-res PNG). The squared paper is neutral to bluish and bright,
// the dashes white, the chain colours saturated; the graded photo bricks are grey, warm (B - R <= -3) or dark. Both
// stacks stand upright: up a few columns across each stack's left brick (clear of its strap), from the limb upward, the
// last brick pixel = the stack's top edge; its height is then taken on the stack's centre line (limb y at X minus top y),
// as the geometry defines it.
//   bun scripts/clips/shruti-trailer/measure-ratio.ts <frame.png> <frame>
import { spawnSync } from "node:child_process";
import { BW, SMALL_H, STACK_W, TOWER_H, X_S, X_T, camAt, limbY, towerRise } from "../../../generated/components/shruti-trailer/OrbitOnEightyMillion";
import { depthTransform } from "../../../generated/components/neal-stephenson-trailer/nealShared";

const [png, fs] = process.argv.slice(2);
const f = Number(fs);
const W = 1920;
const raw = spawnSync("ffmpeg", ["-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1e8 }).stdout as Buffer;
const t = depthTransform(camAt(f));
const warm = (x: number, y: number) => {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const i = ((y + dy) * W + (x + dx)) * 3;
      const sat = Math.max(raw[i], raw[i + 1], raw[i + 2]) - Math.min(raw[i], raw[i + 1], raw[i + 2]);
      if ((raw[i + 2] - raw[i] <= -3 || raw[i + 1] < 140) && raw[i + 1] < 232 && sat < 30) n++; // the grey photo bricks: warm or dark, never the neutral paper, white dashes or the chain colours
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
    for (let v = 2; v <= 900; v += 0.25) {
      const sp = t.toScreen(cx, y0 - v);
      if (warm(Math.round(sp.x), Math.round(sp.y))) last = v;
      else if (v - last > 4) break;
    }
    best = Math.max(best, limbY(X) - (y0 - last));
  }
  return best;
};
const hs = height(X_S);
const ht = height(X_T);
console.log(`f${f}: small stack ${hs.toFixed(1)} world px (${(hs * t.k).toFixed(1)} screen px; geometry ${SMALL_H.toFixed(2)})`);
console.log(`f${f}: tower ${ht.toFixed(1)} world px (${(ht * t.k).toFixed(1)} screen px; geometry ${towerRise(f).toFixed(2)} of ${TOWER_H.toFixed(2)})`);
console.log(`measured ratio ${(ht / hs).toFixed(3)} (target 12.5)`);
