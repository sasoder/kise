// TimelineToTheDataCenter (rsi-ten-earths, cut 17) per-frame checks: the dolly (one acceleration lobe, one deceleration
// lobe, never stopping before the settle at f152, D(152) = 2600, f >= 90 equal to the approved v5 camera), the year
// plates (2026 inside the keep-in box x 65-1015 at f0 with ~100 px figures; 2027 / 2028 inside the box until they sink,
// their ground line above y ~1075 while their type is visible, no two plates' type overlapping), the building's base on the
// vanishing line at f0. Screen maths without the sway (a few px). Run: bun scripts/clips/rsi-ten-earths/check-timeline-to-dc.ts
import { DURATION, EYE, F, HY, PLATES, PLATE_SIZE, SINK_DUR, dollyD } from "../../../generated/components/rsi-ten-earths/TimelineToTheDataCenter";
const issues: string[] = [];
const log: string[] = [];
const D0 = dollyD(0);
// the approved v5 camera from f90 on (sampled when it was approved)
const V5: [number, number][] = [[90, 6314.8], [110, 4339.4], [123, 3310.8], [133, 2860.0], [143, 2653.0], [152, 2600.0], [164, 2571.2], [172, 2552.0]];
for (const [f, d] of V5) if (Math.abs(dollyD(f) - d) > 0.5) issues.push(`camera f${f} D ${dollyD(f).toFixed(1)} != v5 ${d}`);
// speed: positive to the settle, one rise then one fall
let peak = 0;
const sp = (f: number) => dollyD(f) - dollyD(f + 1);
for (let f = 1; f < DURATION - 1; f++) if (sp(f) > sp(peak)) peak = f;
for (let f = 0; f < 150; f++) {
  if (sp(f) <= 0) issues.push(`camera stops at f${f}`);
  if (f < peak && sp(f + 1) < sp(f) - 0.05) issues.push(`speed dips before the peak at f${f}`);
  if (f > peak && f < 150 && sp(f + 1) > sp(f) + 0.05) issues.push(`speed rises after the peak at f${f}`);
}
log.push(`D0 ${D0.toFixed(0)}, speed peak f${peak} (${sp(peak).toFixed(1)} u/f), f0 speed ${sp(0).toFixed(1)}`);
const base = HY + (EYE * F) / (D0 - 53);
log.push(`building base y at f0 ${base.toFixed(0)}`);
if (base < 700 || base > 800) issues.push(`building base y ${base.toFixed(0)} outside 700-800 at f0`);
type Box = { year: string; x0: number; x1: number; y0: number; y1: number };
for (let f = 0; f < DURATION; f++) {
  const T = D0 - dollyD(f);
  const boxes: Box[] = [];
  for (const p of PLATES) {
    const d = p.d0 - T;
    const sink = Math.min(1, Math.max(0, (f - p.f) / SINK_DUR));
    if (d < 150 || sink >= 1) continue;
    const r = F / d;
    const s = PLATE_SIZE * r;
    const x = 540 + p.X * r;
    const dy = (p.h + 0.45 * PLATE_SIZE) * sink * sink;
    const y = HY + (EYE - p.h + dy) * r;
    const ground = HY + EYE * r;
    const b = { year: p.year, x0: x - 1.24 * s, x1: x + 1.24 * s, y0: y - 0.42 * s, y1: y + 0.36 * s };
    if (b.x1 < 0 || b.x0 > 1080) continue;
    boxes.push(b);
    if (f === 0 && p.year === "2026" && (b.x0 < 65 || b.x1 > 1015 || Math.abs(0.85 * s - 100) > 8)) issues.push(`f0 2026 box ${b.x0.toFixed(0)}-${b.x1.toFixed(0)} figures ${(0.85 * s).toFixed(0)} px`);
    if (p.year !== "2026" && sink === 0 && (b.x0 < 65 || b.x1 > 1015 || b.y0 < 290 || b.y1 > 1070)) issues.push(`f${f} ${p.year} outside the keep-in box`);
    // the type's opacity while sinking (as drawn: 1 - smoothstep(0.55, 0.95, sink)); a sliver under 10 % does not count
    const u = Math.min(1, Math.max(0, (sink - 0.55) / 0.4));
    const op = 1 - u * u * (3 - 2 * u);
    if (p.year !== "2026" && sink > 0 && op > 0.1 && ground > 1075) issues.push(`f${f} ${p.year} sinks below y ${ground.toFixed(0)}`);
    if (f % 6 === 0) log.push(`f${f} ${p.year} figures ${(0.85 * s).toFixed(0)} px x ${b.x0.toFixed(0)}-${b.x1.toFixed(0)} y ${y.toFixed(0)} sink ${sink.toFixed(2)}`);
  }
  for (let a = 0; a < boxes.length; a++)
    for (let c = a + 1; c < boxes.length; c++) {
      const A = boxes[a];
      const B = boxes[c];
      if (A.x0 < B.x1 && B.x0 < A.x1 && A.y0 < B.y1 && B.y0 < A.y1) issues.push(`f${f} ${A.year} overlaps ${B.year}`);
    }
}
console.log(log.join("\n"));
console.log("ISSUES", issues.length);
console.log(issues.slice(0, 40).join("\n"));
