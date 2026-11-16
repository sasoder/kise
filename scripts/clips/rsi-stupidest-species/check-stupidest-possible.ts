// StupidestPossibleSpecies (rsi-stupidest-species, cut 7, revision 1: the stairs) per-frame checks, in screen px (sway
// included): the camera (both lobes' progress monotonic; the anchor's screen speed), the human's head and the chimp's
// head (inside the keep-in box x 65-1015, y 290-1070 when on screen; never in the caption bands y 1080-1250 /
// 1360-1460, the head's disc included), the dashed species (no two outlines overlap; none in a band in the resolved
// frame), the fire and the line in the box at the end, the line's light timing; the mote audit (no front mote over a
// face for more than 5 frames running). `--search` tries mote offsets and prints the best ones.
// Run: bun scripts/clips/rsi-stupidest-species/check-stupidest-possible.ts
import { covidAnchors } from "../../../generated/components/kyle-covid/covidFolk";
import { MOTE_LAYERS, MOODS, hash01, type AirView } from "../../../generated/components/kyle-pandemics/pandemicAir";
import { CHIMP_AT, CHIMP_SCALE, DURATION, FIRE_AT, HUMAN_AT, KINDLE, LAMP_XS, MOTE_OFFSET, camOf, chimpPoseAt, humanAtShift, humanPoseAt, lampLitAt, lampStartAt, s1, s2 } from "../../../generated/components/rsi-stupidest-species/StupidestPossibleSpecies";
import { LAMPS, STAIRS, U, speciesOf, stepOf, speciesUV, stairPersp, stairsAirOf, stepAnchor } from "../../../generated/components/rsi-stupidest-species/stupidestStairs";
import { chimpAnchors } from "../../../generated/components/rsi-stupidest-species/stupidestFolk";

type P2 = [number, number];
const issues: string[] = [];
const transit: string[] = [];
const log: string[] = [];
const bandHit = (y0: number, y1: number) => (y1 >= 1080 && y0 <= 1250) || (y1 >= 1360 && y0 <= 1460);
const onScreen = (p: P2) => p[0] > -40 && p[0] < 1120 && p[1] > -40 && p[1] < 1960;
const inPoly = (p: P2, q: P2[]) => {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    if (q[i][1] > p[1] !== q[j][1] > p[1] && p[0] < ((q[j][0] - q[i][0]) * (p[1] - q[i][1])) / (q[j][1] - q[i][1]) + q[i][0]) c = !c;
  }
  return c;
};

const cams = Array.from({ length: DURATION }, (_, f) => camOf(f));
let rev = 0;
for (let f = 1; f < DURATION; f++) if (s1(f) < s1(f - 1) - 1e-9 || s2(f) < s2(f - 1) - 1e-9) rev++;
if (rev) issues.push(`a camera lobe reverses on ${rev} frames`);
log.push(`s1 by 10: ${Array.from({ length: 14 }, (_, i) => s1(i * 10).toFixed(3)).join(" ")}`);
log.push(`s2 by 6 from 150: ${Array.from({ length: 11 }, (_, i) => s2(150 + i * 6).toFixed(3)).join(" ")}`);

const rows: string[] = [];
const faces: { h: P2; hr: number; c: P2; cr: number }[] = [];
const speeds: number[] = [];
let prevQ: P2 | null = null;
for (let f = 0; f < DURATION; f++) {
  const cam = cams[f];
  const P = stairPersp(cam);
  const S = (p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
  const front = (Z: number) => Z > -P.Dc + 2 * U;
  // the human
  const hAt = P.p(HUMAN_AT.X + humanAtShift(f), HUMAN_AT.Y, HUMAN_AT.Z);
  const ha = covidAnchors("commuter", humanPoseAt(f), hAt, P.r(HUMAN_AT.Z));
  const hc = S(ha.headC);
  const hr = ha.headR * cam.k;
  // the chimp
  const cAt = P.p(CHIMP_AT.X, CHIMP_AT.Y, CHIMP_AT.Z);
  const ca = chimpAnchors(0, chimpPoseAt(f), cAt, P.r(CHIMP_AT.Z) * CHIMP_SCALE);
  const cc = S(ca.headC);
  const cr = ca.headR * cam.k;
  faces.push({ h: front(HUMAN_AT.Z) ? hc : [-999, -999], hr, c: front(CHIMP_AT.Z) ? cc : [-999, -999], cr });
  for (const [who, c, r, Z] of [["human", hc, hr, HUMAN_AT.Z], ["chimp", cc, cr, CHIMP_AT.Z]] as [string, P2, number, number][]) {
    if (!front(Z) || !onScreen(c)) continue;
    // settled (from f107, the brief's settle beat): an issue; during the descent and its landing the cast rises into frame from below, through the bands (noted)
    if (bandHit(c[1] - r, c[1] + r)) (f >= 107 ? issues : transit).push(`f${f} ${who} head in a caption band (y ${(c[1] - r).toFixed(0)}-${(c[1] + r).toFixed(0)})`);
    if (f >= 107 && (c[1] - r < 290 || c[1] + r > 1070 || c[0] - r < 65 || c[0] + r > 1015)) issues.push(`f${f} ${who} head outside the keep-in box (${c[0].toFixed(0)},${c[1].toFixed(0)} r ${r.toFixed(0)})`);
  }
  // the dashed species: screen outlines; consecutive ones must not overlap (sampled points inside the other)
  const outl: (P2[] | null)[] = [];
  for (let i = 1; i <= STAIRS.TOP; i++) {
    const a = stepAnchor(i);
    if (!front(a.Z)) {
      outl.push(null);
      continue;
    }
    const sp = speciesOf(i);
    outl.push(speciesUV(sp.H, sp.headR, sp.shape).map(([u, v]) => S(P.p(a.X + u * U, a.Y - v * U, a.Z))));
  }
  for (let i = 0; i + 1 < outl.length; i++) {
    const A = outl[i];
    const B = outl[i + 1];
    if (!A || !B || speciesOf(i + 2).a < 0.35) continue;
    const vis = (p: P2) => p[0] > 0 && p[0] < 1080 && p[1] > 0 && p[1] < 1920;
    const hit = A.filter((p, k) => k % 3 === 0 && vis(p) && inPoly(p, B)).length + B.filter((p, k) => k % 3 === 0 && vis(p) && inPoly(p, A)).length;
    if (hit > 0) issues.push(`f${f} species ${i + 1} and ${i + 2} outlines overlap (${hit} pts)`);
  }
  if (f >= 197) {
    for (let i = 0; i < outl.length; i++) {
      const o = outl[i];
      if (!o) continue;
      const top = Math.min(...o.map((p) => p[1]));
      const bot = Math.max(...o.map((p) => p[1]));
      if (bandHit(top, bot) && o.some((p) => p[0] > 0 && p[0] < 1080)) issues.push(`f${f} species ${i + 1} in a caption band`);
    }
  }
  // the fire and the lamp row (the threshold): every on-screen lamp in the keep-in box and out of the bands once
  // settled, and lit by "civilization" (f197); the on-screen spacing
  const fire = S(P.p(FIRE_AT.X, FIRE_AT.Y, FIRE_AT.Z));
  const s0 = stepOf(LAMPS.step);
  const lz = s0.Z0 + LAMPS.back * U;
  const lamps = LAMP_XS.map((x) => ({ base: S(P.p(x, s0.Y, lz)), top: S(P.p(x, s0.Y - (LAMPS.h + 0.22) * U, lz)) }));
  const onScr = lamps.map((l, k) => ({ ...l, k })).filter((l) => l.base[0] > -20 && l.base[0] < 1100 && l.base[1] > -20 && l.base[1] < 1940);
  if (f >= 107)
    for (const l of onScr) {
      if (bandHit(l.top[1], l.base[1])) issues.push(`f${f} lamp ${l.k} in a caption band (y ${l.top[1].toFixed(0)}-${l.base[1].toFixed(0)})`);
      if (l.base[1] > 1070 || l.top[1] < 290) issues.push(`f${f} lamp ${l.k} outside the keep-in box (y)`);
    }
  if (f === 197) for (const l of onScr) if (lampLitAt(l.k, f) < 1) issues.push(`f197 lamp ${l.k} on screen not yet fully lit (${lampLitAt(l.k, f).toFixed(2)})`);
  const gaps = onScr.slice(1).map((l, j) => l.base[0] - onScr[j].base[0]);
  const l0 = onScr.length ? onScr[0].base : [0, 0];
  const l1 = onScr.length ? onScr[onScr.length - 1].base : [0, 0];
  if (f >= 190 && (fire[0] < 65 || fire[0] > 1015 || fire[1] < 290 || fire[1] > 1070)) issues.push(`f${f} the fire outside the box`);
  // the camera's anchor speed (the queue's chest point at screen)
  const q = S(P.p(HUMAN_AT.X, HUMAN_AT.Y - 1.0 * U, HUMAN_AT.Z));
  const qa = S(P.p(stepAnchor(6).X, stepAnchor(6).Y - 1.2 * U, stepAnchor(6).Z));
  if (prevQ) speeds.push(Math.hypot(qa[0] - prevQ[0], qa[1] - prevQ[1]));
  prevQ = qa;
  if (f % 10 === 0 || [44, 65, 102, 107, 142, 154, 172, 186, 197, 219].includes(f))
    rows.push(
      `f${String(f).padStart(3)} pxm ${(cam.k * P.r(HUMAN_AT.Z) * U).toFixed(1).padStart(6)} humanHead ${hc.map((v) => v.toFixed(0))} (r ${hr.toFixed(0)}) chimpHead ${cc.map((v) => v.toFixed(0))} (r ${cr.toFixed(0)}) lamps ${onScr.length} y ${l0[1].toFixed(0)} x ${l0[0].toFixed(0)}-${l1[0].toFixed(0)} gap ${gaps.length ? Math.min(...gaps).toFixed(0) + '-' + Math.max(...gaps).toFixed(0) : '-'} lit ${onScr.filter((l) => lampLitAt(l.k, f) >= 1).length} fire ${fire.map((v) => v.toFixed(0))} chest ${q.map((v) => v.toFixed(0))}`,
    );
}
log.push(...rows);
log.push(`species 6 screen speed px/f by 4: ${speeds.filter((_, i) => i % 4 === 0).map((v) => v.toFixed(0)).join(" ")}`);
log.push(`band transits during the descent (${transit.length}): ${transit.map((t) => t.split(" ").slice(0, 2).join(" ")).join(", ")}`);
log.push(`lamps: ${LAMP_XS.length}, kindling f${KINDLE.first}-${KINDLE.last} (+${KINDLE.dur}); starts ${LAMP_XS.map((_, k) => lampStartAt(k).toFixed(0)).join(" ")}`);

// ---- the mote audit: the motes drawn IN FRONT of the world (layer 1 odd, layer 2), as pandemicAir's Motes ----
const mod = (a: number, n: number) => ((a % n) + n) % n;
const views: AirView[] = cams.map((cam, f) => stairsAirOf({ cam, rest: cams[0], frame: f }).v);
const frontMotes = (v: AirView, off: { x: number; y: number }) => {
  const out: { x: number; y: number; r: number; a: number }[] = [];
  const md = v.mood ?? MOODS.day;
  for (const layer of [1, 2] as const) {
    const L = MOTE_LAYERS[layer];
    const F = v.scene.F;
    const t = v.frame;
    const span = L.d1 - L.d0;
    const Wb = (1.3 * 1080 * L.d1) / F;
    const Hb = (2.3 * Math.max(v.horizon, 1920 - v.horizon) * L.d1) / F;
    const n = Math.round(L.n * md.moteCount);
    for (let i = 0; i < n; i++) {
      if (layer === 1 && i % 2 !== 1) continue;
      const h = L.seed + i * 7.13;
      const sp = 0.7 + 0.6 * hash01(h + 3.1);
      const wob = 0.06 * Math.sin(t * (0.03 + 0.03 * hash01(h + 4.4)) + hash01(h + 5.5) * 6.28);
      const X = mod(hash01(h) * Wb + md.drift[0] * sp * t + wob - (v.travel.x + off.x), Wb) - Wb / 2;
      const Y = mod(hash01(h + 1.7) * Hb + md.drift[1] * sp * t - (v.travel.y + off.y), Hb) - Hb / 2;
      const Z = L.d0 + mod(hash01(h + 2.9) * span - md.drift[2] * t - v.travel.z, span);
      const r = Math.min(layer === 2 ? 70 : 9, (L.r[0] + (L.r[1] - L.r[0]) * hash01(h + 6.6)) * md.moteSize * F / Z);
      out.push({ x: 540 + (F * X) / Z, y: v.horizon - (F * Y) / Z, r, a: L.a[1] });
    }
  }
  return out;
};
const moteRuns = (off: { x: number; y: number }) => {
  // per face: the longest run of frames with any front mote over the head disc (enlarged 1.5x)
  let worst = 0;
  const notes: string[] = [];
  for (const who of ["human", "chimp"] as const) {
    let run = 0;
    let best = 0;
    let at = -1;
    for (let f = 0; f < DURATION; f++) {
      const fc = faces[f];
      const c = who === "human" ? fc.h : fc.c;
      const r = (who === "human" ? fc.hr : fc.cr) * 1.5;
      const hit = c[0] > 0 && c[0] < 1080 && c[1] > 0 && c[1] < 1920 && frontMotes(views[f], off).some((q) => Math.hypot(q.x - c[0], q.y - c[1]) < r + q.r);
      run = hit ? run + 1 : 0;
      if (run > best) {
        best = run;
        at = f;
      }
    }
    worst = Math.max(worst, best);
    notes.push(`${who} longest ${best} (ending f${at})`);
  }
  return { worst, notes };
};
if (process.argv.includes("--search")) {
  const res: { x: number; y: number; worst: number; notes: string[] }[] = [];
  for (let i = 0; i < 160; i++) {
    const off = { x: 0, y: (i * 3) / 160 }; // y only: an x offset also slides the shafts as the zoom changes F
    res.push({ ...off, ...moteRuns(off) });
  }
  res.sort((a, b) => a.worst - b.worst);
  console.log(res.slice(0, 6).map((q) => `offset ${q.x},${q.y}: ${q.notes.join(", ")}`).join("\n"));
} else {
  const mr = moteRuns(MOTE_OFFSET);
  log.push(`motes over faces: ${mr.notes.join(", ")}`);
  if (mr.worst > 5) issues.push(`a front mote rides a face for ${mr.worst} frames`);
}
console.log(log.join("\n"));
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 2000).join("\n")}` : "OK: no issues");
