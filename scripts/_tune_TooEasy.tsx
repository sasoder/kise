import { QUESTIONS, COLUMN, hw } from "../generated/components/challengeShared";

const Q = QUESTIONS;
console.log("count", Q.length);

let minDy = Infinity;
for (let i = 1; i < Q.length; i++) minDy = Math.min(minDy, Q[i].y - Q[i - 1].y);
console.log("min dy", minDy.toFixed(2));

let minGap = Infinity;
for (let i = 0; i < Q.length; i++)
  for (let j = i + 1; j < Q.length; j++)
    minGap = Math.min(minGap, Math.hypot(Q[i].x - Q[j].x, Q[i].y - Q[j].y) - (Q[i].r + Q[j].r));
console.log("min rim gap", minGap.toFixed(2));

const left = Q.filter((q) => q.x < COLUMN.x).length;
console.log("left", left, "right", Q.length - left);
console.log("above y470:", Q.filter((q) => q.y < 470).length);
console.log("below y1250:", Q.filter((q) => q.y > 1250).length);

let worstShaft = Infinity;
for (const q of Q) worstShaft = Math.min(worstShaft, Math.abs(q.x - COLUMN.x) - q.r);
console.log("shaft clearance:", worstShaft.toFixed(1), "(floor", COLUMN.shaftHalf, ")");

let minX = Infinity;
let maxX = -Infinity;
for (const q of Q) {
  minX = Math.min(minX, q.x - q.r);
  maxX = Math.max(maxX, q.x + q.r);
}
console.log("ink x", minX.toFixed(1), maxX.toFixed(1));
console.log("ink y", (Q[0].y - Q[0].r).toFixed(1), (Q[Q.length - 1].y + Q[Q.length - 1].r).toFixed(1));

console.log("\nrings inside a 72px height window:");
for (let y = 250; y <= 1300; y += 100) {
  const n = Q.filter((q) => Math.abs(q.y - y) <= 36).length;
  console.log(`  y ${y}  hw ${hw(y).toFixed(0)}  across ${n}`);
}

console.log("\nrings per 100 px of height:");
for (let y = 200; y < 1300; y += 100) {
  const n = Q.filter((q) => q.y >= y && q.y < y + 100).length;
  console.log(`  ${String(y).padStart(4)}-${y + 100}: ${"#".repeat(n)} ${n}`);
}

console.log("\nrings (sorted by height):");
for (const q of Q)
  console.log(
    `  y ${q.y.toFixed(0).padStart(4)}  dx ${(q.x - 540).toFixed(0).padStart(5)}  r ${q.r.toFixed(1)}`,
  );

console.log("\nband checks:");
console.log("  above y475 :", Q.filter((q) => q.y < 475).length, "(want ~6)");
console.log("  in 480..740:", Q.filter((q) => q.y >= 480 && q.y <= 740).length, "(want 14-18)");
console.log("  below y1250:", Q.filter((q) => q.y > 1250).length, "(want 2-3)");
