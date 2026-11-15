// StupidestPossibleSpecies (rsi-stupidest-species, cut 7) per-frame checks, in screen px (sway included):
// the camera (ln k: one push-in, no reversal; the sill's screen y), the human's head and the chimp's head (inside the
// keep-in box x 65-1015, y 290-1070 when on screen; never in the caption bands y 1080-1250 / 1360-1460, the head's disc
// included), the two plates (inside the box), the cornice light's head (crossing the frame f183-200) and the
// CIVILIZATION plate's cue; the mote audit (no front mote over a face for more than 5 frames running).
// `--search` tries mote offsets and prints the best ones.
// Run: bun scripts/clips/rsi-stupidest-species/check-stupidest-possible.ts
import { covidAnchors } from "../../../generated/components/kyle-covid/covidFolk";
import { MOTE_LAYERS, MOODS, hash01, type AirView } from "../../../generated/components/kyle-pandemics/pandemicAir";
import { CHIMP_SPOT, HUMAN_SPOT, TOWER, U, hy, m, nicheOf, nichePt, sillAnchor, towerAirOf, towerPersp, towerPt, zFrontAt } from "../../../generated/components/rsi-stupidest-species/speciesTower";
import { chimpAnchors } from "../../../generated/components/rsi-stupidest-species/stupidestFolk";
import { CIV_PLATE, DURATION, MOTE_OFFSET, PLATE_CUE, STUPID_PLATE, camOf, chimpPoseAt, civPlateAt, corniceLightAt, humanPoseAt, lightHeadX, moveS, plateBox, stupidPlateAt } from "../../../generated/components/rsi-stupidest-species/StupidestPossibleSpecies";

type P2 = [number, number];
const issues: string[] = [];
const log: string[] = [];
const bandHit = (y0: number, y1: number) => (y1 >= 1080 && y0 <= 1250) || (y1 >= 1360 && y0 <= 1460);
const onScreen = (p: P2) => p[0] > -40 && p[0] < 1120 && p[1] > -40 && p[1] < 1960;

const cams = Array.from({ length: DURATION }, (_, f) => camOf(f));
const lk = cams.map((c) => Math.log(c.k));
const dk = lk.slice(1).map((v, i) => v - lk[i]);
let rev = 0;
for (let i = 1; i < dk.length; i++) if (dk[i] < -1e-6) rev++;
if (rev) issues.push(`zoom goes out on ${rev} frames`);
log.push(`k ${cams[0].k.toFixed(4)} -> ${cams[DURATION - 1].k.toFixed(4)}`);
log.push(`zoom %/f by 6: ${dk.filter((_, i) => i % 6 === 0).map((v) => (v * 100).toFixed(2)).join(" ")}`);
log.push(`s by 10: ${Array.from({ length: 22 }, (_, i) => moveS(i * 10).toFixed(3)).join(" ")}`);

const chimpSpot = sillAnchor("chimp");
const rows: string[] = [];
const faces: { h: P2; hr: number; c: P2; cr: number }[] = [];
for (let f = 0; f < DURATION; f++) {
  const cam = cams[f];
  const P = towerPersp(cam);
  const S = (p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
  // the human
  const hAt = P.p(HUMAN_SPOT.X, HUMAN_SPOT.Y, HUMAN_SPOT.Z);
  const ha = covidAnchors("commuter", humanPoseAt(f), hAt, P.r(HUMAN_SPOT.Z));
  const hc = S(ha.headC);
  const hr = ha.headR * cam.k;
  const feet = S(hAt);
  // the chimp
  const cAt = P.p(chimpSpot.X, chimpSpot.Y, chimpSpot.Z);
  const ca = chimpAnchors(0, chimpPoseAt(f), cAt, P.r(chimpSpot.Z));
  const cc = S(ca.headC);
  const cr = ca.headR * cam.k;
  faces.push({ h: hc, hr, c: cc, cr });
  for (const [who, c, r] of [["human", hc, hr], ["chimp", cc, cr]] as [string, P2, number][]) {
    if (!onScreen(c)) continue;
    if (bandHit(c[1] - r, c[1] + r)) issues.push(`f${f} ${who} head in a caption band (y ${(c[1] - r).toFixed(0)}-${(c[1] + r).toFixed(0)})`);
    if (c[1] - r < 290 || c[1] + r > 1070 || c[0] - r < 65 || c[0] + r > 1015) issues.push(`f${f} ${who} head outside the keep-in box (${c[0].toFixed(0)},${c[1].toFixed(0)} r ${r.toFixed(0)})`);
  }
  // the SMARTEST POSSIBLE plate (on the capital block's front) while on screen, the CIVILIZATION plate once in
  const cb = TOWER.capital.block;
  const capPlate = S(P.p(0, hy((cb.h0 + cb.h1) / 2), zFrontAt((cb.h0 + cb.h1) / 2) - m(cb.out)));
  if (f <= 44 && (capPlate[1] < 290 || capPlate[1] > 1070)) issues.push(`f${f} SMARTEST POSSIBLE plate at y ${capPlate[1].toFixed(0)}`);
  // STUPIDEST POSSIBLE (once it is in): inside the box, clear of the arch (the niche's front outline, + 8 px) and the human
  const sb = plateBox(cam, STUPID_PLATE);
  const hn = nicheOf("human");
  const archL = S(P.p(...nichePt(hn, -hn.w / 2, 0, 0)))[0];
  if (stupidPlateAt(f) > 0) {
    if (sb.x0 < 65 || sb.x1 > 1015 || sb.y0 < 290 || sb.y1 > 1070) issues.push(`f${f} STUPIDEST plate outside the box (${sb.x0.toFixed(0)}-${sb.x1.toFixed(0)}, ${sb.y0.toFixed(0)}-${sb.y1.toFixed(0)})`);
    if (sb.x1 > archL - 8) issues.push(`f${f} STUPIDEST plate reaches the arch (right ${sb.x1.toFixed(0)}, arch ${archL.toFixed(0)})`);
  }
  // CIVILIZATION (once it is in): inside the box, its top below the light line, its bottom above the chimp's niche
  const cbx = plateBox(cam, CIV_PLATE);
  const lineY = S(P.p(...(towerPt(Math.PI / 2, TOWER.cornice.band.h1, TOWER.cornice.band.out) as [number, number, number])))[1];
  const chimpTop = S(P.p(...nichePt(nicheOf("chimp"), 0, nicheOf("chimp").h, 0)))[1];
  if (civPlateAt(f) > 0) {
    if (cbx.x0 < 65 || cbx.x1 > 1015 || cbx.y0 < 290 || cbx.y1 > 1070) issues.push(`f${f} CIVILIZATION plate outside the box (${cbx.x0.toFixed(0)}-${cbx.x1.toFixed(0)}, ${cbx.y0.toFixed(0)}-${cbx.y1.toFixed(0)})`);
    if (cbx.y0 < lineY + 6) issues.push(`f${f} CIVILIZATION plate over the light line (top ${cbx.y0.toFixed(0)}, line ${lineY.toFixed(0)})`);
    if (cbx.y1 > chimpTop - 6) issues.push(`f${f} CIVILIZATION plate over the chimp's niche`);
  }
  const civS = [(cbx.x0 + cbx.x1) / 2, (cbx.y0 + cbx.y1) / 2];
  if (f === 124 || f === 200 || f === DURATION - 1)
    log.push(`f${f} plates: STUPIDEST x ${sb.x0.toFixed(0)}-${sb.x1.toFixed(0)} y ${sb.y0.toFixed(0)}-${sb.y1.toFixed(0)} cap ${sb.cap.toFixed(1)} px (arch ${archL.toFixed(0)}); CIVILIZATION x ${cbx.x0.toFixed(0)}-${cbx.x1.toFixed(0)} y ${cbx.y0.toFixed(0)}-${cbx.y1.toFixed(0)} cap ${cbx.cap.toFixed(1)} px (line ${lineY.toFixed(0)}, chimp niche top ${chimpTop.toFixed(0)})`);
  if (f % 10 === 0 || f === 15 || f === 107 || f === 124 || f === 197 || f === DURATION - 1)
    rows.push(
      `f${String(f).padStart(3)} pxm ${(cam.k * P.r(HUMAN_SPOT.Z) * U).toFixed(1).padStart(6)} feet y ${feet[1].toFixed(0)} humanHead ${hc[1].toFixed(0)} (r ${hr.toFixed(0)}) chimpHead ${cc[1].toFixed(0)} (r ${cr.toFixed(0)}) capPlate y ${capPlate[1].toFixed(0)} civ ${civS.map((v) => v.toFixed(0))} light ${corniceLightAt(f).toFixed(3)}`,
    );
}
log.push(...rows);
log.push(`cornice light head x: ${[181, 183, 186, 190, 193, 197, 200, 202].map((f) => `f${f} ${lightHeadX(f).toFixed(0)}`).join(" ")}; CIVILIZATION cue f${PLATE_CUE.toFixed(2)}`);
void CHIMP_SPOT;

// ---- the mote audit: the motes drawn IN FRONT of the world (layer 1 odd, layer 2), as pandemicAir's Motes ----
const mod = (a: number, n: number) => ((a % n) + n) % n;
const views: AirView[] = cams.map((cam, f) => towerAirOf({ cam, rest: cams[0], frame: f }).v);
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
      const hit = frontMotes(views[f], off).some((q) => Math.hypot(q.x - c[0], q.y - c[1]) < r + q.r);
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
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 60).join("\n")}` : "OK: no issues");
