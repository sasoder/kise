// NotOptimallyAdapted (rsi-stupidest-species, cut 19, revision 3: the clumsy step-up, the fall polished) per-frame checks, in screen px
// (sway included): the camera (one push: ln px/m never reverses, a single speed lobe, moving at f0); his head (the disc
// inside the keep-in box x 65-1015, y 290-1070 and out of the caption bands y 1080-1250 / 1360-1460 on every frame);
// the contacts (the feet still on the floor f0-4, the hands on their ledge points while gripping, the knee on its point
// while kneeling, the kneeling shin's ankle never below the tread, the hips on the edge at the end); the dashed species
// wholly out of frame from f20; the lamps either side of him at the end; the largest frame-to-frame jump of the head,
// hands and feet (no snapping).
// Run: bun scripts/clips/rsi-stupidest-species/check-not-optimally-adapted.ts
import { U, speciesOf, stairPersp, stepAnchor } from "../../../generated/components/rsi-stupidest-species/stupidestStairs";
import { CATCH, DURATION, FOOT, KNEE, LETGO, KNEE_AT, LAMP_BACK, LAMP_XS2, LEDGE_Y, SEAT_AT, SWIVEL, camOf, feetAt, gripW, humanAnchorsAt, specAt } from "../../../generated/components/rsi-stupidest-species/NotOptimallyAdapted";
import type { AirWorld } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";

type P2 = [number, number];
const issues: string[] = [];
const bandHit = (y0: number, y1: number) => (y1 >= 1080 && y0 <= 1250) || (y1 >= 1360 && y0 <= 1460);
const outBox = (c: P2, r = 0) => c[0] - r < 65 || c[0] + r > 1015 || c[1] - r < 290 || c[1] + r > 1070;
const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const m = (v: number) => v * U;

const lp = Array.from({ length: DURATION }, (_, f) => Math.log(specAt(f).pxm));
const d = lp.slice(1).map((v, i) => v - lp[i]);
d.forEach((v, i) => v < -1e-7 && issues.push(`f${i + 1}: the zoom reverses`));
let peaks = 0;
for (let i = 1; i < d.length - 1; i++) if (d[i] > d[i - 1] + 1e-9 && d[i] >= d[i + 1]) peaks++;
if (peaks > 1) issues.push(`${peaks} speed peaks in the push (want one)`);
if (d[0] < 1e-4) issues.push("the push is not moving at f0");

const rows: string[] = [];
let prev: Record<string, P2> | null = null;
const jumps: Record<string, { v: number; f: number }> = {};
for (let f = 0; f < DURATION; f++) {
  const cam = camOf(f);
  const P = stairPersp(cam);
  const A = { P, cam, k: cam.k } as unknown as AirWorld;
  const S = (p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
  const { an, grip } = humanAnchorsAt(A, f);
  const hc = S(an.headC);
  const hr = an.headR * cam.k;
  if (bandHit(hc[1] - hr, hc[1] + hr)) issues.push(`f${f}: head in a caption band`);
  if (outBox(hc, hr)) issues.push(`f${f}: head outside the keep-in box (${hc.map((v) => v.toFixed(0))} r ${hr.toFixed(0)})`);
  // contacts (in world px, compared at screen scale)
  // the held feet: the near foot on the floor, then pressed on the low riser point until the knee swing; the far foot on
  // the floor, then on the high riser point until the knee is down
  const ft = feetAt(A, f);
  const between = (w: [number, number]) => f > w[0] && f < w[1];
  const nearOn = ft.wL > 0.999 && !between(FOOT.nearUp);
  const farOn = ft.wR > 0.999 && !between(FOOT.up);
  if (nearOn) {
    const e = dist(an.ankleL, ft.L) * cam.k;
    if (e > 0.8) issues.push(`f${f}: the near foot is ${e.toFixed(1)} px off its ${f <= FOOT.nearUp[0] ? "floor" : "riser"} point`);
  }
  if (farOn) {
    const e = dist(an.ankleR, ft.R) * cam.k;
    if (e > 0.8) issues.push(`f${f}: the far foot is ${e.toFixed(1)} px off its ${f <= FOOT.up[0] ? "floor" : "riser"} point`);
  }
  // every frame before the knee is down: a foot planted on the floor or on the riser
  if (f < KNEE.on && !nearOn && !farOn) issues.push(`f${f}: no foot on the stone before the knee lands`);
  // his head never crosses a lamp's flame (a disc ~0.12 m over the dish)
  for (const x of LAMP_XS2) {
    const fl = S(P.p(x, LEDGE_Y - m(0.4), m(LAMP_BACK)));
    const fr = m(0.12) * P.r(m(LAMP_BACK)) * cam.k;
    if (dist(hc, fl) < hr + fr) issues.push(`f${f}: his head crosses a lamp flame`);
  }
  if (grip && gripW(f) > 0.999) {
    for (const s of ["L", "R"] as const) {
      const e = dist(s === "L" ? an.handL : an.handR, grip[s]) * cam.k;
      if (e > 2) issues.push(`f${f}: hand ${s} is ${e.toFixed(1)} px off its ledge point`);
    }
  }
  if (f >= KNEE.on && f <= SWIVEL.a) {
    const kp = P.p(KNEE_AT.X, LEDGE_Y - KNEE_AT.up, KNEE_AT.Z);
    const e = dist(an.kneeL, kp) * cam.k;
    if (e > 0.6) issues.push(`f${f}: the knee is ${e.toFixed(1)} px off its point`);
    const ledgeAtShin = S(P.p(0, LEDGE_Y, KNEE_AT.Z))[1];
    if (f >= LETGO.b && S(an.ankleL)[1] > ledgeAtShin + 1) issues.push(`f${f}: the kneeling shin dips into the tread (${(S(an.ankleL)[1] - ledgeAtShin).toFixed(1)} px)`);
  }
  if (f >= SWIVEL.b + 9) {
    const sp = P.p(SEAT_AT.X, LEDGE_Y - SEAT_AT.up, SEAT_AT.Z);
    const e = dist(an.hip, sp) * cam.k;
    if (e > 0.6) issues.push(`f${f}: the hips are ${e.toFixed(1)} px off the edge`);
  }
  // the dashed species on steps 1..3: off frame from f20
  for (let i = 1; i <= 3; i++) {
    const sa = stepAnchor(i);
    const sp = speciesOf(i);
    const hw = (0.6 * sp.shape.wide + sp.headR / U) * U;
    const a = S(P.p(sa.X - hw, sa.Y - (sp.H + sp.headR / U) * U, sa.Z));
    const b = S(P.p(sa.X + hw, sa.Y, sa.Z));
    if (f >= 20 && b[0] > 0 && a[0] < 1080 && b[1] > 0 && a[1] < 1920) issues.push(`f${f}: the dashed species on step ${i} is in frame`);
  }
  // the largest per-frame moves (screen px)
  const cur: Record<string, P2> = { head: hc, handL: S(an.wristL), handR: S(an.wristR), footL: S(an.ankleL), footR: S(an.ankleR), hip: S(an.hip) };
  if (prev) for (const k of Object.keys(cur)) {
    const v = dist(cur[k], prev[k]);
    if (!jumps[k] || v > jumps[k].v) jumps[k] = { v, f };
  }
  prev = cur;
  if (f === DURATION - 1) {
    const lamps = LAMP_XS2.map((x) => S(P.p(x, LEDGE_Y, m(LAMP_BACK)))).filter((c) => !outBox(c));
    const hipX = S(an.hip)[0];
    const l = lamps.filter((c) => c[0] < hipX).length;
    const r = lamps.filter((c) => c[0] > hipX).length;
    if (l < 1 || r < 1) issues.push(`f${f}: want a lamp either side of him in the box (left ${l}, right ${r})`);
  }
  const topFront = S(P.p(KNEE_AT.X, LEDGE_Y, 0))[1] - S(P.p(KNEE_AT.X, LEDGE_Y, m(LAMP_BACK)))[1];
  const topAll = S(P.p(KNEE_AT.X, LEDGE_Y, 0))[1] - S(P.p(KNEE_AT.X, LEDGE_Y, m(1.6)))[1];
  if (f % 6 === 0 || f === DURATION - 1 || f === CATCH.on) rows.push(`f${String(f).padStart(2)} top ${topFront.toFixed(0)}/${topAll.toFixed(0)} px pxm ${specAt(f).pxm.toFixed(0)} head (${hc[0].toFixed(0)},${hc[1].toFixed(0)}) r ${hr.toFixed(0)} hip (${cur.hip.map((v) => v.toFixed(0))}) feet y ${cur.footL[1].toFixed(0)}/${cur.footR[1].toFixed(0)} grip ${gripW(f).toFixed(2)}`);
}
const spark = d.map((v) => " .:-=+*#%@"[Math.max(0, Math.min(9, Math.round((v / Math.max(...d)) * 9)))]).join("");
console.log(rows.join("\n"));
console.log(`dln(px/m) per frame: ${spark}`);
console.log(`largest per-frame moves (px): ${Object.entries(jumps).map(([k, j]) => `${k} ${j.v.toFixed(1)}@f${j.f}`).join(" · ")}`);
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 40).join("\n")}` : "OK: no issues");
