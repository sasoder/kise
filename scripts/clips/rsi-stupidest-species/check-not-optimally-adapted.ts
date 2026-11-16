// NotOptimallyAdapted (rsi-stupidest-species, cut 19, revision 1: the clumsy fire-keeper) per-frame checks, in screen px
// (sway included): the camera (one push-in: ln px/m never reverses, a single speed lobe, moving at f0), the human's
// head (the head disc inside the keep-in box x 65-1015, y 290-1070 and out of the caption bands y 1080-1250 /
// 1360-1460 on every frame), the fire and the smoke puffs' centres (inside the box), the lamps either side of the fire
// (in the box at the end), the dashed species on the step above (wholly out of frame from f20: no half-cut figure in
// the corner) and his crouched height at the end (the medium close: ~450-550 px).
// Run: bun scripts/clips/rsi-stupidest-species/check-not-optimally-adapted.ts
import { covidAnchors } from "../../../generated/components/kyle-covid/covidFolk";
import { FIRE_AT, HUMAN_AT, LAMP_XS } from "../../../generated/components/rsi-stupidest-species/StupidestPossibleSpecies";
import { DURATION, PUFFS, camOf, fireAt, humanPoseAt, humanX, lampBright, specAt } from "../../../generated/components/rsi-stupidest-species/NotOptimallyAdapted";
import { LAMPS, U, speciesOf, stairPersp, stepAnchor, stepOf } from "../../../generated/components/rsi-stupidest-species/stupidestStairs";

type P2 = [number, number];
const issues: string[] = [];
const bandHit = (y0: number, y1: number) => (y1 >= 1080 && y0 <= 1250) || (y1 >= 1360 && y0 <= 1460);
const outBox = (c: P2, r = 0) => c[0] - r < 65 || c[0] + r > 1015 || c[1] - r < 290 || c[1] + r > 1070;

const lp = Array.from({ length: DURATION }, (_, f) => Math.log(specAt(f).pxm));
const d = lp.slice(1).map((v, i) => v - lp[i]);
d.forEach((v, i) => v < -1e-7 && issues.push(`f${i + 1}: the zoom reverses`));
let peaks = 0;
for (let i = 1; i < d.length - 1; i++) if (d[i] > d[i - 1] + 1e-9 && d[i] >= d[i + 1]) peaks++;
if (peaks > 1) issues.push(`${peaks} speed peaks in the push (want one)`);
if (d[0] < 1e-4) issues.push("the push is not moving at f0");

const rows: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const cam = camOf(f);
  const P = stairPersp(cam);
  const S = (p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
  const ha = covidAnchors("commuter", humanPoseAt(f), P.p(humanX(f), HUMAN_AT.Y, HUMAN_AT.Z), P.r(HUMAN_AT.Z));
  const hc = S(ha.headC);
  const hr = ha.headR * cam.k;
  for (const [who, c, r] of [["human", hc, hr]] as [string, P2, number][]) {
    if (bandHit(c[1] - r, c[1] + r)) issues.push(`f${f}: ${who} head in a caption band (y ${(c[1] - r).toFixed(0)}-${(c[1] + r).toFixed(0)})`);
    if (outBox(c, r)) issues.push(`f${f}: ${who} head outside the keep-in box (${c[0].toFixed(0)},${c[1].toFixed(0)} r ${r.toFixed(0)})`);
  }
  const fire = S(P.p(FIRE_AT.X, FIRE_AT.Y, FIRE_AT.Z));
  if (outBox(fire)) issues.push(`f${f}: the fire's base outside the box (${fire.map((v) => v.toFixed(0))})`);
  // the dashed species on step 1: its whole box (generous: body half-width + head) off frame from f20
  {
    const sa = stepAnchor(1);
    const sp = speciesOf(1);
    const hw = (0.6 * sp.shape.wide + sp.headR / U) * U;
    const a = S(P.p(sa.X - hw, sa.Y - (sp.H + sp.headR / U) * U, sa.Z));
    const b = S(P.p(sa.X + hw, sa.Y, sa.Z));
    const onScreen = b[0] > 0 && a[0] < 1080 && b[1] > 0 && a[1] < 1920;
    if (f >= 20 && onScreen) issues.push(`f${f}: the dashed species is still (partly) in frame (${a.map((v) => v.toFixed(0))} - ${b.map((v) => v.toFixed(0))})`);
  }
  // the smoke puffs' centres (as Smoke draws them)
  for (const p of PUFFS) {
    const t = (f - p.f0) / p.life;
    if (t <= 0 || t >= 0.6) continue;
    const e = 1 - Math.pow(1 - t, 1.6);
    const c = S(P.p(FIRE_AT.X + (p.u0 + p.drift * e) * U, FIRE_AT.Y - (0.3 + p.rise * e) * U, FIRE_AT.Z));
    if (outBox(c)) issues.push(`f${f}: a smoke puff centre leaves the box (${c.map((v) => v.toFixed(0))})`);
  }
  const s0 = stepOf(0);
  const lampsIn = LAMP_XS.map((x) => S(P.p(x, s0.Y, s0.Z0 + LAMPS.back * U))).filter((c) => !outBox(c));
  const ankle = Math.max(S(ha.ankleL)[1], S(ha.ankleR)[1]);
  const tall = ankle - (hc[1] - hr) + 0.12 * specAt(f).pxm;
  if (f === DURATION - 1) {
    const left = lampsIn.filter((c) => c[0] < fire[0]).length;
    const right = lampsIn.filter((c) => c[0] > fire[0]).length;
    if (left < 1 || right < 1) issues.push(`f${f}: want lamps on both sides of the fire in the box (left ${left}, right ${right})`);
    if (tall < 440 || tall > 560) issues.push(`f${f}: his height ${tall.toFixed(0)} px is outside the medium close (~450-550)`);
  }
  if (f % 6 === 0 || f === DURATION - 1) {
    const near = LAMP_XS.map((x, k) => ({ k, dx: Math.abs(x - FIRE_AT.X) })).sort((a, b) => a.dx - b.dx)[0].k;
    rows.push(`f${String(f).padStart(2)} pxm ${specAt(f).pxm.toFixed(0)} head (${hc[0].toFixed(0)},${hc[1].toFixed(0)}) r ${hr.toFixed(0)} tall ${tall.toFixed(0)} fire (${fire[0].toFixed(0)},${fire[1].toFixed(0)}) t ${fireAt(f).toFixed(2)} lamps in box ${lampsIn.length} (y ${lampsIn.length ? lampsIn[0][1].toFixed(0) : "-"}) nearest lamp ${lampBright(near, f).toFixed(2)}`);
  }
}
const spark = d.map((v) => " .:-=+*#%@"[Math.max(0, Math.min(9, Math.round((v / Math.max(...d)) * 9)))]).join("");
console.log(rows.join("\n"));
console.log(`dln(px/m) per frame: ${spark}`);
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 40).join("\n")}` : "OK: no issues");
