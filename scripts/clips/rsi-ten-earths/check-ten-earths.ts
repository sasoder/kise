// TenEarths (rsi-ten-earths, cut 99) per-frame checks: year plates and the China label inside the keep-in box (x 65-1015, y 290-1070) and off the caption bands, clear air between plate and group top, no lone small globe after f175, formation gaps/extent at landing, camera ln-k speed and min k. Run: bun scripts/clips/rsi-ten-earths/check-ten-earths.ts
import { sceneAt, camAt, plateAt, DURATION } from "../../../generated/components/rsi-ten-earths/TenEarths";
const bands = (y0: number, y1: number) => (y1 > 1080 && y0 < 1250) || (y1 > 1360 && y0 < 1460);
const issues: string[] = []; const log: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const s = sceneAt(f); const c = s.cam; const h = s.hero;
  for (const p of plateAt(f, h, c.k)) {
    if (!p.on) continue;
    const y = p.sy - p.lift + 0.5 * p.size * (1 - p.tIn);
    const x0 = 540 - 1.24 * p.size, x1 = 540 + 1.24 * p.size, y0 = y - 0.42 * p.size, y1 = y + 0.36 * p.size;
    if (x0 < 65 || x1 > 1015 || y0 < 290 || y1 > 1070 || bands(y0, y1)) issues.push(`f${f} ${p.text} ${y0.toFixed(0)}-${y1.toFixed(0)}`);
    // clear air under the plate: the top of the group
    if (y1 > h.cy - h.r - 10) issues.push(`f${f} ${p.text} touches the group top`);
    if (f % 10 === 0) log.push(`f${f} ${p.text} y ${y.toFixed(0)} size ${p.size.toFixed(0)} o ${p.opacity.toFixed(2)}`);
  }
  if (s.china.t > 0 && s.china.o > 0.05) {
    const sz = 56 * c.k, w = 2.6 * sz; const y0 = s.china.y - 0.42 * sz, y1 = s.china.y + 0.36 * sz;
    if (s.china.x - w / 2 < 65 || s.china.x + w / 2 > 1015 || y0 < 290 || bands(y0, y1)) issues.push(`f${f} China`);
  }
  // the group's extent and the biggest globe; a lone-globe check: frames after f175 where the hero is the only globe
  const front = s.globes.filter((g) => g.r > 0.8 * h.r);
  const xs0 = Math.min(...front.map((g) => g.cx - g.r)), xs1 = Math.max(...front.map((g) => g.cx + g.r));
  const ys0 = Math.min(...front.map((g) => g.cy - g.r)), ys1 = Math.max(...front.map((g) => g.cy + g.r));
  if (f >= 175 && s.globes.length === 1 && h.r < 300) issues.push(`f${f} lone globe r ${h.r.toFixed(0)}`);
  if (f % 6 === 0 && f >= 168) log.push(`f${f} k ${c.k.toFixed(3)} hero r ${h.r.toFixed(0)} n ${s.globes.length} group x ${xs0.toFixed(0)}-${xs1.toFixed(0)} y ${ys0.toFixed(0)}-${ys1.toFixed(0)}`);
  if (f >= 226) {
    let minGap = 1e9;
    for (let a = 0; a < front.length; a++) for (let b = a + 1; b < front.length; b++) minGap = Math.min(minGap, Math.hypot(front[a].cx - front[b].cx, front[a].cy - front[b].cy) - front[a].r - front[b].r);
    if (f % 10 === 0) log.push(`f${f} n ${front.length} gap ${minGap.toFixed(1)} x ${xs0.toFixed(0)}-${xs1.toFixed(0)} y ${ys0.toFixed(0)}-${ys1.toFixed(0)}`);
    if (ys1 > 1070) issues.push(`f${f} formation below 1070`);
  }
}
console.log(log.join("\n")); console.log("ISSUES", issues.length); console.log(issues.slice(0, 40).join("\n"));
let out = ""; for (let f = 160; f < 240; f += 2) { const a = camAt(f - 1), c2 = camAt(f + 1); out += `${f}:${((Math.log(c2.k) - Math.log(a.k)) / 2).toFixed(4)} `; } console.log("camera dlnk/frame", out);
let mn = 9; for (let f = 0; f < DURATION; f++) mn = Math.min(mn, camAt(f).k); console.log("min k", mn.toFixed(4));
