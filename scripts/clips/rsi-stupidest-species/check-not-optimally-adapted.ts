// NotOptimallyAdapted (rsi-stupidest-species, cut 19) per-frame checks, in screen px (sway included): the camera (ln k:
// one push-in, no reversal, already moving at f0, one deceleration lobe), the alcove (crown and both jambs inside the
// keep-in box x 65-1015, y 290-1070), the human (feet, face and crown inside the box, above y 1070), the chimp's face
// (never in the caption bands y 1080-1250 / 1360-1460), the ideal occupant's tip (inside the box while it draws, on the
// outline's path) and its progress (monotone, 0 before f13, 1 from f47).
// Run: bun scripts/clips/rsi-stupidest-species/check-not-optimally-adapted.ts
import { swayCam, type Cam } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";
import { DURATION, OCC, camTrack, occProgress } from "../../../generated/components/rsi-stupidest-species/NotOptimallyAdapted";
import { HUMAN_SPOT, OCCUPANT, OCCUPANT_UV, TOWER, hy, nicheOf, nichePt, screenOf3, sillAnchor } from "../../../generated/components/rsi-stupidest-species/speciesTowerGeom";

type P2 = [number, number];
const issues: string[] = [];
const inBand = (y: number) => (y >= 1080 && y <= 1250) || (y >= 1360 && y <= 1460);
const inBox = (p: P2) => p[0] >= 65 && p[0] <= 1015 && p[1] >= 290 && p[1] <= 1070;
const n = nicheOf("human");
const ch = sillAnchor("chimp");
const cams: Cam[] = Array.from({ length: DURATION }, (_, f) => swayCam(camTrack(f), f));
const lk = cams.map((c) => Math.log(c.k));
const dk = lk.slice(1).map((v, i) => v - lk[i]);
for (let i = 0; i < dk.length; i++) if (dk[i] < -1e-6) issues.push(`f${i + 1}: zoom reverses`);
if (dk[0] < 1e-4) issues.push("not moving at f0");
let lobes = 0;
for (let i = 1; i < dk.length - 1; i++) if (dk[i] > dk[i - 1] && dk[i] > dk[i + 1]) lobes++;
if (lobes > 1) issues.push(`${lobes} speed peaks (want one lobe)`);
const S = (c: Cam, v: [number, number, number]) => screenOf3(c, v[0], v[1], v[2]) as P2;
const rows: string[] = [];
let prevP = 0;
for (let f = 0; f < DURATION; f++) {
  const c = cams[f];
  const crown = S(c, nichePt(n, 0, n.h, 0));
  const jL = S(c, nichePt(n, -n.w / 2, 0, 0));
  const jR = S(c, nichePt(n, n.w / 2, 0, 0));
  const feet = S(c, [HUMAN_SPOT.X, HUMAN_SPOT.Y, HUMAN_SPOT.Z]);
  const face = S(c, [HUMAN_SPOT.X, hy(TOWER.cornY + 1.5), HUMAN_SPOT.Z]);
  const top = S(c, [HUMAN_SPOT.X, hy(TOWER.cornY + 1.75), HUMAN_SPOT.Z]);
  const cf = S(c, [ch.X, hy(2.4), ch.Z]);
  for (const [nm, p] of [["crown", crown], ["jambL", jL], ["jambR", jR], ["feet", feet], ["face", face], ["head", top]] as [string, P2][]) if (!inBox(p)) issues.push(`f${f}: ${nm} out of the box ${p.map((v) => v.toFixed(0))}`);
  if (inBand(cf[1])) issues.push(`f${f}: chimp face in a caption band y ${cf[1].toFixed(0)}`);
  const p = occProgress(f);
  if (p < prevP - 1e-9) issues.push(`f${f}: occupant progress goes back`);
  prevP = p;
  // every outline point inside the box
  if (p > 0) for (const [u, v] of OCCUPANT_UV) { const q = S(c, nichePt(n, u, v, OCCUPANT.inset)); if (!inBox(q)) { issues.push(`f${f}: outline point out of the box`); break; } }
  if (f % 6 === 0 || f === DURATION - 1) rows.push(`f${String(f).padStart(2)} k ${c.k.toFixed(3)} crown y ${crown[1].toFixed(0)} jambs x ${jL[0].toFixed(0)}-${jR[0].toFixed(0)} sill y ${feet[1].toFixed(0)} human ${(feet[1] - top[1]).toFixed(0)} px face y ${face[1].toFixed(0)} chimp face y ${cf[1].toFixed(0)} occ ${p.toFixed(2)}`);
}
if (occProgress(OCC.f0 - 1) !== 0 || Math.abs(occProgress(OCC.f1) - 1) > 1e-9) issues.push("occupant progress ends wrong");
const spark = dk.map((v) => " .:-=+*#%@"[Math.min(9, Math.round((v / Math.max(...dk)) * 9))]).join("");
console.log(rows.join("\n"));
console.log(`dlnk per frame (f1..f${DURATION - 1}): ${spark}`);
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 30).join("\n")}` : "OK: no issues");
