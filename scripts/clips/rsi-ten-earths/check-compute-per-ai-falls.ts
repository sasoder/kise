// check-compute-per-ai-falls (rev 1): every frame of ComputePerAIFalls along camAt6: the robot and the floor year inside
// the keep-in box (8 px sway margin), the robot face and the year clear of the caption bands, and each step's racks on
// screen at their wave. Run: bun scripts/clips/rsi-ten-earths/check-compute-per-ai-falls.ts
import { camAt6 } from "../../../generated/components/rsi-ten-earths/ComputePerAIFalls";
import { screenOf3, scaleAt, HERO_STATION, YEAR_PAINT, RACKS, stepRacks, type BlockCam } from "../../../generated/components/rsi-ten-earths/computeBlockRev1";
const M = 8, KX0 = 65, KX1 = 1015, KY0 = 290, KY1 = 1070;
const BANDS = [[1080, 1250], [1360, 1460]];
const an = HERO_STATION.an.at;
const box = (c: BlockCam, pts: [number, number, number][]) => {
  const s = pts.map((p) => screenOf3(c, ...p));
  return { x0: Math.min(...s.map((q) => q[0])), x1: Math.max(...s.map((q) => q[0])), y0: Math.min(...s.map((q) => q[1])), y1: Math.max(...s.map((q) => q[1])) };
};
const inBand = (b: { y0: number; y1: number }) => BANDS.some(([a, z]) => b.y1 + M > a && b.y0 - M < z);
const keep = (b: { x0: number; x1: number; y0: number; y1: number }) => b.x0 - M >= KX0 && b.x1 + M <= KX1 && b.y0 - M >= KY0 && b.y1 + M <= KY1;
let bad = 0;
const rows: string[] = [];
for (let f = 0; f <= 141; f++) {
  const c = camAt6(f);
  const robot = box(c, [[an.X - 70, -240, an.Z], [an.X + 70, -240, an.Z], [an.X - 70, 0, an.Z], [an.X + 70, 0, an.Z]]);
  const face = box(c, [[an.X - 50, -235, an.Z], [an.X + 50, -150, an.Z]]);
  const yr = box(c, [[YEAR_PAINT.x0, 0, YEAR_PAINT.z0], [YEAR_PAINT.x1, 0, YEAR_PAINT.z0], [YEAR_PAINT.x0, 0, YEAR_PAINT.z1], [YEAR_PAINT.x1, 0, YEAR_PAINT.z1]]);
  const px = 235 * scaleAt(c, an.Z);
  const issues: string[] = [];
  if (!keep(robot)) issues.push("robot out of keep-in");
  if (inBand(face)) issues.push("FACE IN BAND");
  if (inBand(yr)) issues.push("YEAR IN BAND");
  if (!keep(yr)) issues.push("year out of keep-in");
  if (issues.length) bad++;
  if (f % 10 === 0 || issues.length || f === 141) rows.push(`f${f} robot ${px.toFixed(0)}px x${robot.x0.toFixed(0)}-${robot.x1.toFixed(0)} y${robot.y0.toFixed(0)}-${robot.y1.toFixed(0)} | year x${yr.x0.toFixed(0)}-${yr.x1.toFixed(0)} y${yr.y0.toFixed(0)}-${yr.y1.toFixed(0)} ${issues.join(", ")}`);
}
console.log(rows.join("\n"));
console.log(`frames with issues: ${bad}/142`);
// each step's changing racks on screen at their wave
const W = [68, 84, 96, 106];
for (let i = 1; i <= 4; i++) {
  const c = camAt6(W[i - 1] + 4);
  const ids = stepRacks(i);
  const vis = ids.filter((id) => { const r = RACKS[id]; const [x, y] = screenOf3(c, r.X, -178, r.Z + 89); return x > 0 && x < 1080 && y > 0 && y < 1920; });
  console.log(`step ${i} (f${W[i - 1] + 4}): ${vis.length}/${ids.length} changing racks on screen`);
}
