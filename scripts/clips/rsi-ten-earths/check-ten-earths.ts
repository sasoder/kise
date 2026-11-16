// TenEarths (rsi-ten-earths, cut 99, rev 1) per-frame checks: year plates, the China label and China itself inside the
// keep-in box (x 65-1015, y 290-1070) and off the caption bands; 2030 (on the globe) clear of China; 2031/2032 in clear
// air above the group top; the ten inside the box once dealt and spaced; the "and so on" Earths clear of the ten and the
// plate; the camera's ln-k rate (never zero) and its jerk. Run: bun scripts/clips/rsi-ten-earths/check-ten-earths.ts
import { sceneAt, camAt, plateAt, plateBox, lnkRate, DURATION, FAR, FAR_FADE } from "../../../generated/components/rsi-ten-earths/TenEarths";
import { globePoint } from "../../../generated/components/rsi-ten-earths/tenEarthsGlobe";
const bands = (y0: number, y1: number) => (y1 > 1080 && y0 < 1250) || (y1 > 1360 && y0 < 1460);
const issues: string[] = [];
const log: string[] = [];
const CHINA = [[73.5, 39.5], [134.7, 48.3], [122.5, 53.5], [109.5, 18.2], [101, 21.3], [79, 31], [87, 49], [121, 31]];
for (let f = 0; f < DURATION; f++) {
  const s = sceneAt(f);
  const c = s.cam;
  const h = s.hero;
  const chinaPts = CHINA.map(([lo, la]) => globePoint(h, lo, la));
  const cTop = Math.min(...chinaPts.map((p) => p.y));
  if (s.china.o > 0.05 || f < 146) {
    const cx0 = Math.min(...chinaPts.map((p) => p.x));
    const cx1 = Math.max(...chinaPts.map((p) => p.x));
    if (cx0 < 65 || cx1 > 1015 || cTop < 290 || Math.max(...chinaPts.map((p) => p.y)) > 1070) issues.push(`f${f} China outside the box x ${cx0.toFixed(0)}-${cx1.toFixed(0)}`);
  }
  for (const p of plateAt(f, h, c.k)) {
    if (!p.on || p.opacity < 0.05) continue;
    const y = p.sy - p.lift + 0.5 * p.size * (1 - p.tIn);
    const x0 = p.sx - 1.24 * p.size;
    const x1 = p.sx + 1.24 * p.size;
    const y0 = y - 0.42 * p.size;
    const y1 = y + 0.36 * p.size;
    if (x0 < 65 || x1 > 1015 || y0 < 290 || y1 > 1070 || bands(y0, y1)) issues.push(`f${f} ${p.text} ${y0.toFixed(0)}-${y1.toFixed(0)}`);
    if (p.text === "2030") {
      if (y1 > cTop - 4) issues.push(`f${f} 2030 touches China (${y1.toFixed(0)} vs ${cTop.toFixed(0)})`);
    } else if (p.tIn > 0.15 && y1 > h.cy - h.r - 10) issues.push(`f${f} ${p.text} touches the group top`);
    if (f % 12 === 0) log.push(`f${f} ${p.text} at ${p.sx.toFixed(0)},${y.toFixed(0)} size ${p.size.toFixed(0)} o ${p.opacity.toFixed(2)}`);
  }
  if (s.china.t > 0 && s.china.o > 0.05) {
    const sz = 56 * c.k;
    const w = 2.6 * sz;
    const y0 = s.china.y - 0.42 * sz;
    const y1 = s.china.y + 0.36 * sz;
    if (s.china.x - w / 2 < 65 || s.china.x + w / 2 > 1015 || y0 < 290 || bands(y0, y1)) issues.push(`f${f} China label ${(s.china.x - w / 2).toFixed(0)}-${(s.china.x + w / 2).toFixed(0)}`);
  }
  // the ten (front plane: r within 15 % of the hero's) and the rest ("and so on")
  const ten = s.globes.filter((g) => g.r > 0.8 * h.r);
  const more = s.far.filter((q) => q.a > 0.05).map((q) => ({ cx: q.x, cy: q.y, r: q.r }));
  if (f >= 184) {
    const xs0 = Math.min(...ten.map((g) => g.cx - g.r));
    const xs1 = Math.max(...ten.map((g) => g.cx + g.r));
    if (xs0 < 65 || xs1 > 1015) issues.push(`f${f} the ten leave the box sideways ${xs0.toFixed(0)}-${xs1.toFixed(0)}`);
  }
  if (f >= 222) {
    const ys0 = Math.min(...ten.map((g) => g.cy - g.r));
    const ys1 = Math.max(...ten.map((g) => g.cy + g.r));
    let minGap = 1e9;
    for (let a = 0; a < ten.length; a++) for (let b = a + 1; b < ten.length; b++) minGap = Math.min(minGap, Math.hypot(ten[a].cx - ten[b].cx, ten[a].cy - ten[b].cy) - ten[a].r - ten[b].r);
    if (ys0 < 290 || ys1 > 1070) issues.push(`f${f} the ten outside y ${ys0.toFixed(0)}-${ys1.toFixed(0)}`);
    if (minGap < 6) issues.push(`f${f} ten gap ${minGap.toFixed(1)}`);
    let moreGap = 1e9;
    for (const m of more) for (const t of ten) moreGap = Math.min(moreGap, Math.hypot(m.cx - t.cx, m.cy - t.cy) - m.r - t.r);
    if (more.length && moreGap < 24) issues.push(`f${f} a far Earth within ${moreGap.toFixed(0)} px of the ten`);
    // the plate: >= 24 px from each far Earth's disc
    const pb = plateBox(f, c);
    let plateGap = 1e9;
    for (const m of more) plateGap = Math.min(plateGap, Math.hypot(Math.max(pb.x0 - m.cx, 0, m.cx - pb.x1), Math.max(pb.y0 - m.cy, 0, m.cy - pb.y1)) - m.r);
    if (more.length && plateGap < 24) issues.push(`f${f} a far Earth within ${plateGap.toFixed(0)} px of the 2032 plate`);
    for (const m of more) if (m.cy + m.r > 1072 && m.cx + m.r > 0 && m.cx - m.r < 1080) issues.push(`f${f} far Earth below y 1072: ${(m.cy - m.r).toFixed(0)}-${(m.cy + m.r).toFixed(0)}`);
    if (f % 6 === 0) log.push(`f${f} k ${c.k.toFixed(3)} ten r ${h.r.toFixed(0)} gap ${minGap.toFixed(1)} x ${xs(ten)} y ${ys0.toFixed(0)}-${ys1.toFixed(0)} | far ${more.length} on screen ${more.filter((m) => m.cx + m.r > 0 && m.cx - m.r < 1080).length}, diam ${more.length ? (2 * Math.max(...more.map((m) => m.r))).toFixed(0) + "-" + (2 * Math.min(...more.map((m) => m.r))).toFixed(0) : "-"}, min gap to ten ${moreGap === 1e9 ? "-" : moreGap.toFixed(0)}, to plate ${plateGap === 1e9 ? "-" : plateGap.toFixed(0)}`);
  }
}
function xs(g: { cx: number; r: number }[]) {
  return `${Math.min(...g.map((q) => q.cx - q.r)).toFixed(0)}-${Math.max(...g.map((q) => q.cx + q.r)).toFixed(0)}`;
}
console.log(log.join("\n"));
// the field: count, depth spread, arrival window, how many are still arriving on the last frame
{
  const last = sceneAt(DURATION - 1).far;
  const arriving = FAR.filter((e) => e.t0 + FAR_FADE > DURATION - 1).length;
  const ys = last.map((q) => q.y);
  const hist = Array.from({ length: 10 }, (_, b) => FAR.filter((e) => e.b === b).length).join("/");
  console.log(`far field: ${FAR.length} Earths, by depth bucket (near->far) ${hist}; t0 ${Math.min(...FAR.map((e) => e.t0)).toFixed(1)}-${Math.max(...FAR.map((e) => e.t0)).toFixed(1)}; still fading up on f${DURATION - 1}: ${arriving}; last-frame y ${Math.min(...ys).toFixed(0)}-${Math.max(...ys).toFixed(0)}`);
}
console.log("ISSUES", issues.length);
console.log(issues.slice(0, 60).join("\n"));
// the camera: ln-k rate per frame (never zero: the camera never stops), its change per frame (jerk proxy)
let out = "";
let minRate = 9;
let maxJ = 0;
for (let f = 0; f < DURATION; f++) {
  const r = (Math.log(camAt(f + 1).k) - Math.log(camAt(f).k));
  minRate = Math.min(minRate, Math.abs(lnkRate(f)));
  if (f > 0) maxJ = Math.max(maxJ, Math.abs(lnkRate(f + 1) - 2 * lnkRate(f) + lnkRate(f - 1)));
  if (f % 6 === 0) out += `${f}:${r.toFixed(4)} `;
}
console.log("camera dlnk/frame", out);
console.log("min |rate|", minRate.toFixed(4), "max d2(rate)", maxJ.toFixed(5), "k f0", camAt(0).k.toFixed(3), "k end", camAt(DURATION - 1).k.toFixed(3));
