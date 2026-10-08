// Counts the dots of MinorityInOwnCountry on chosen frames, checks the final shares,
// that frame 0 shows no newcomer, and how fast anything moves ON SCREEN.
//   bun scripts/check-minority-dots.ts
import { DOTS, DURATION, FRAME_H, FRAME_W, PORT_COUNTS, cameraAt, countAt, placeDot, toScreen } from "../generated/components/minorityMotion";

console.log("ports", JSON.stringify(PORT_COUNTS));
const inFrame = (s: number[], m = 9) => s[0] > -m && s[0] < FRAME_W + m && s[1] > -m && s[1] < FRAME_H + m;
for (const f of [0, 12, 20, 34, 50, 64, 80, 84, 88, 96, 105]) {
  const c = countAt(f);
  const cam = cameraAt(f);
  const p = [0, 0, 1];
  let sea = 0;
  let walk = 0;
  let creamInFrame = 0;
  DOTS.forEach((d, i) => {
    const st = placeDot(i, f, p);
    const vis = inFrame(toScreen(p, cam));
    if (!d.orange && vis) creamInFrame++;
    if (st === 0 && vis) sea++;
    if (st === 1) walk++;
  });
  console.log(`f${f}: AUS orange ${c.aus.orange} cream ${c.aus.cream} | NZ orange ${c.nz.orange} cream ${c.nz.cream} | in frame: cream ${creamInFrame}, at sea ${sea} | walking ${walk} | k ${cam.k.toFixed(3)}`);
}
// on-screen speeds
let vDot = 0;
let vCam = 0;
const a = [0, 0, 1];
const b = [0, 0, 1];
for (let f = 1; f < DURATION; f++) {
  const c0 = cameraAt(f - 1);
  const c1 = cameraAt(f);
  const m0 = toScreen([600, 850], c0);
  const m1 = toScreen([600, 850], c1);
  vCam = Math.max(vCam, Math.hypot(m1[0] - m0[0], m1[1] - m0[1]));
  for (let i = 0; i < DOTS.length; i++) {
    placeDot(i, f - 1, a);
    placeDot(i, f, b);
    const s0 = toScreen(a, c0);
    const s1 = toScreen(b, c1);
    if (!inFrame(s0, 0) || !inFrame(s1, 0)) continue;
    vDot = Math.max(vDot, Math.hypot(s1[0] - s0[0], s1[1] - s0[1]));
  }
}
const cream = DOTS.filter((d) => !d.orange);
console.log(`max on-screen step: map ${vCam.toFixed(1)} px/frame, any dot in frame ${vDot.toFixed(1)} px/frame`);
console.log(`first landing f${Math.min(...cream.map((d) => d.tLand)).toFixed(1)}; last dot stands at f${Math.max(...cream.map((d) => d.tSettle)).toFixed(1)}`);
{
  const cam = cameraAt(0);
  const p = [0, 0, 1];
  const seen = DOTS.filter((d, i) => !d.orange && (placeDot(i, 0, p), inFrame(toScreen(p, cam)))).length;
  if (seen) throw new Error(`${seen} cream dots are in frame on frame 0`);
}
const end = countAt(DURATION - 1);
const share = (o: number, c: number) => ((100 * o) / (o + c)).toFixed(1);
console.log(`FINAL: Australia ${end.aus.orange}/${end.aus.orange + end.aus.cream} = ${share(end.aus.orange, end.aus.cream)} %, New Zealand ${end.nz.orange}/${end.nz.orange + end.nz.cream} = ${share(end.nz.orange, end.nz.cream)} %`);
if (end.aus.orange !== 19 || end.aus.cream !== 481 || end.nz.orange !== 18 || end.nz.cream !== 83) throw new Error("final counts are off");
