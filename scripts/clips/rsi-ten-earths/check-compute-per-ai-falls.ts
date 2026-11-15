// check-compute-per-ai-falls: every-frame checks for ComputePerAIFalls (rsi-ten-earths, cut 64): the keep-in box
// (racks, Genius head and feet, the year plate) and the threads' clearance from the plate's glyph box (padded 6 px).
// Run: bun scripts/clips/rsi-ten-earths/check-compute-per-ai-falls.ts
import { camState, screenAt, GENIUS, PLATE, F_LENS, BLOCK_RACKS, threadPathPool, threadPointPool } from "../../../generated/components/rsi-ten-earths/computeBlockState";
import { threadHead } from "../../../generated/components/rsi-ten-earths/ComputePerAIFalls";
import { RACK } from "../../../generated/components/rsi-ten-earths/tenEarthsHall";
let minGap = 1e9, at = "";
const w = { gHead: 1e9, gFeet: 0, xL: 1e9, xR: 0, top: 1e9, plTop: 1e9, plBot: 0, plL: 1e9, plR: 0, threadMaxY: 0 };
for (let f = 0; f <= 141; f++) {
  const c = camState(f);
  const sg = F_LENS / (c.Dc + GENIUS.Z);
  const feet = screenAt(c, GENIUS.X, 0, GENIUS.Z);
  w.gHead = Math.min(w.gHead, feet[1] - 325 * sg); w.gFeet = Math.max(w.gFeet, feet[1]);
  for (const rk of BLOCK_RACKS) {
    const a = screenAt(c, rk.X - RACK.w / 2, -RACK.h, rk.Z), b = screenAt(c, rk.X + RACK.w / 2, 0, rk.Z), bb = screenAt(c, rk.X + RACK.w / 2, -RACK.h, rk.Z + RACK.d);
    w.xL = Math.min(w.xL, a[0], bb[0]); w.xR = Math.max(w.xR, b[0], bb[0]); w.top = Math.min(w.top, a[1], bb[1]);
  }
  const sp = PLATE.size * F_LENS / (c.Dc + PLATE.Z), pc = screenAt(c, PLATE.X, PLATE.Y, PLATE.Z), tw = 4 * 0.62 * sp;
  const box = { l: pc[0] - tw / 2 - 6, r: pc[0] + tw / 2 + 6, t: pc[1] - 0.38 * sp - 6, b: pc[1] + 0.34 * sp + 6 };
  w.plTop = Math.min(w.plTop, box.t); w.plBot = Math.max(w.plBot, box.b); w.plL = Math.min(w.plL, box.l); w.plR = Math.max(w.plR, box.r);
  for (const rk of BLOCK_RACKS) {
    const head = threadHead(rk, f); if (head <= 0.004) continue;
    const path = threadPathPool(rk);
    for (let i = 0; i <= 80; i++) {
      const u = (head * i) / 80; const p = threadPointPool(path, u); const s = screenAt(c, p[0], 0, p[1]);
      w.threadMaxY = Math.max(w.threadMaxY, s[1]);
      // distance outside the plate box (negative = inside)
      const dx = Math.max(box.l - s[0], 0, s[0] - box.r), dy = Math.max(box.t - s[1], 0, s[1] - box.b);
      const d = dx > 0 || dy > 0 ? Math.hypot(dx, dy) : -1;
      if (d < minGap) { minGap = d; at = `f${f} rack ${rk.id} u ${u.toFixed(2)}`; }
    }
  }
}
console.log(Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.round(v)])), "thread-plate min gap (px, box padded 6):", minGap.toFixed(1), at);
