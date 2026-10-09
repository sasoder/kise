// Counts the dots of ClosedWorldsTide on chosen frames, checks the final shares (the
// honest numbers), that no newcomer stands in Oceania before the stream arrives, and
// how fast the camera and the dots move ON SCREEN.
//   bun scripts/check-tide-dots.ts
import { DOTS, DURATION, FRAME_H, FRAME_W, PORT_COUNTS, cameraAt, countAt, headAt, placeDot, toScreen } from "../generated/components/tideMotion";

console.log("ports", JSON.stringify(PORT_COUNTS));
const inFrame = (s: number[], m = 9) => s[0] > -m && s[0] < FRAME_W + m && s[1] > -m && s[1] < FRAME_H + m;
for (const f of [0, 60, 76, 90, 101, 110, 115, 122, 130, 141, 151, 158, 163, 170, 176, 184, 196, 205, 212, 216, 224, 234]) {
  const c = countAt(f);
  const cam = cameraAt(f);
  const p = [0, 0, 1];
  let sea = 0;
  let walk = 0;
  let creamInFrame = 0;
  DOTS.forEach((d, i) => {
    const st = placeDot(i, f, p);
    if (st < 0) return;
    const vis = inFrame(toScreen(p, cam));
    if (!d.orange && vis) creamInFrame++;
    if (st === 0 && vis) sea++;
    if (st === 1) walk++;
  });
  const h = [0, 0, 1];
  const hs = headAt(f, h) >= 0 ? toScreen(h, cam).map((v) => v.toFixed(0)).join(",") : "-";
  console.log(
    `f${f}: MEX cream ${c.mex.cream} | AUS orange ${c.aus.orange} cream ${c.aus.cream} | NZ orange ${c.nz.orange} cream ${c.nz.cream} | in frame: cream ${creamInFrame}, at sea ${sea} | walking ${walk} | k ${cam.k.toFixed(3)} | ribbon head at screen ${hs}`,
  );
}
// on-screen speeds
let vCam = 0;
let fCam = 0;
let vZoom = 0;
const worst: { v: number; f: number; g: string; st: number }[] = [];
const a = [0, 0, 1];
const b = [0, 0, 1];
const perFrame: number[] = [];
for (let f = 1; f < DURATION; f++) {
  const c0 = cameraAt(f - 1);
  const c1 = cameraAt(f);
  const v = Math.hypot(c1.cx - c0.cx, c1.cy - c0.cy) * c1.k;
  if (v > vCam) {
    vCam = v;
    fCam = f;
  }
  vZoom = Math.max(vZoom, Math.abs(Math.log(c1.k / c0.k)));
  let m = 0;
  for (let i = 0; i < DOTS.length; i++) {
    const s0s = placeDot(i, f - 1, a);
    const s1s = placeDot(i, f, b);
    if (s0s < 0 || s1s < 0) continue;
    const s0 = toScreen(a, c0);
    const s1 = toScreen(b, c1);
    if (!inFrame(s0, 0) || !inFrame(s1, 0)) continue;
    const d = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]);
    if (d > m) m = d;
    worst.push({ v: d, f, g: DOTS[i].group, st: s1s });
  }
  perFrame.push(m);
}
worst.sort((p, q) => q.v - p.v);
console.log(`max on-screen step: frame centre ${vCam.toFixed(1)} px/frame (f${fCam}); zoom ${(100 * vZoom).toFixed(1)} %/frame (frame edge ${(540 * vZoom).toFixed(1)}, corner ${(1101 * vZoom).toFixed(1)} px/frame)`);
console.log(`fastest dot in frame: ${worst[0].v.toFixed(1)} px/frame (f${worst[0].f}, ${worst[0].g}, state ${worst[0].st}); 99.9th pct ${worst[Math.floor(worst.length * 0.001)].v.toFixed(1)}, 99th ${worst[Math.floor(worst.length * 0.01)].v.toFixed(1)}`);
console.log("fastest dot per frame (every 6th):", perFrame.map((v, i) => (i % 6 === 5 ? `f${i + 1}:${v.toFixed(0)}` : "")).filter(Boolean).join(" "));
const cream = DOTS.filter((d) => !d.orange && d.group !== "mex");
console.log(`Oceania: first landing f${Math.min(...cream.map((d) => d.tLand)).toFixed(1)}; last regular dot stands f${Math.max(...cream.filter((d) => d.tLand < 214).map((d) => d.tSettle)).toFixed(1)}; last of all f${Math.max(...cream.map((d) => d.tSettle)).toFixed(1)}`);
const mex = DOTS.filter((d) => d.group === "mex");
console.log(`Mexico (illustrative): ${mex.length} dots, first lands f${Math.min(...mex.map((d) => d.tLand)).toFixed(1)}, last stands f${Math.max(...mex.map((d) => d.tSettle)).toFixed(1)}`);
{
  // nobody stands in Oceania before the ribbon gets there
  const c = countAt(150);
  if (c.aus.cream || c.nz.cream) throw new Error("newcomers stand in Oceania before the stream arrives");
}
const end = countAt(DURATION - 1);
const share = (o: number, c: number) => ((100 * o) / (o + c)).toFixed(1);
console.log(`FINAL: Australia ${end.aus.orange}/${end.aus.orange + end.aus.cream} = ${share(end.aus.orange, end.aus.cream)} %, New Zealand ${end.nz.orange}/${end.nz.orange + end.nz.cream} = ${share(end.nz.orange, end.nz.cream)} %`);
if (end.aus.orange !== 19 || end.aus.cream !== 481 || end.nz.orange !== 18 || end.nz.cream !== 83) throw new Error("final counts are off");
