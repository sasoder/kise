// EvolutionBarelyPushed (rsi-stupidest-species, cut 51) per-frame checks, in screen px (sway included): the camera
// (moving from f0), the lift's plan (crank monotone and stopped after the stop, lift-off at LIFT with the chain's slack
// gone on the same frame, the deck monotone while winding, flush with the sill at rest, and the deck's rise = the chain
// wound less the slack = -crank x crank radius less the slack on every frame), the mast and its sprocket never above the
// arriving human's crown, the human on the deck (feet, face and crown inside the keep-in box x 65-1015, y 290-1070), the
// chimp's face (never in a caption band y 1080-1250 / 1360-1460; what covers it on each frame: the human, the deck, the
// knee braces), the EVOLUTION plate (inside the box, its cap height) and a table of the key numbers.
// Run: bun scripts/clips/rsi-stupidest-species/check-evolution-barely-pushed.ts [--table]
import { swayCam, type Cam } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";
import { CHIMP_SPOT_F, DURATION, LIFT, PLAN, PLATE, RIDER_U, RISE, SLACK0, bounce, camTrack, chimpPoseAt, crankAt, deckTopAt, slackAt, wound } from "../../../generated/components/rsi-stupidest-species/EvolutionBarelyPushed";
import { TOWER, U, hy, m, platZ, towerPersp } from "../../../generated/components/rsi-stupidest-species/speciesTowerGeom";
import { chimpAnchors } from "../../../generated/components/rsi-stupidest-species/stupidestFolk";

type P2 = [number, number];
const issues: string[] = [];
const notes: string[] = [];
const inBand = (y: number) => (y >= 1080 && y <= 1250) || (y >= 1360 && y <= 1460);
const inBox = (p: P2) => p[0] >= 65 && p[0] <= 1015 && p[1] >= 290 && p[1] <= 1070;
const cams: Cam[] = Array.from({ length: DURATION }, (_, f) => swayCam(camTrack(f), f));
const scr = (c: Cam, w: P2): P2 => [540 + (w[0] - c.cx) * c.k, 960 + (w[1] - c.cy) * c.k];
const S = (c: Cam, X: number, Y: number, Z: number): P2 => scr(c, towerPersp(c).p(X, Y, Z) as P2);
const segDist = (p: P2, a: P2, b: P2) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};

// ---- the camera: moving from f0
const d01 = Math.hypot(cams[1].cx - cams[0].cx, cams[1].cy - cams[0].cy) * cams[0].k + Math.abs(Math.log(cams[1].k / cams[0].k)) * 1000;
if (d01 < 0.05) issues.push("camera not moving at f0");

// ---- the lift's plan: cause before effect
for (let f = 1; f < DURATION; f++) {
  if (crankAt(f) > crankAt(f - 1) + 1e-9) issues.push(`f${f}: the crank turns back`);
  if (f > PLAN.stopB + 1 && Math.abs(crankAt(f) - crankAt(f - 1)) > 1e-4) issues.push(`f${f}: the crank still turns after the stop`);
  if (f <= PLAN.stopB - 3 && deckTopAt(f) < deckTopAt(f - 1) - 1e-9) issues.push(`f${f}: the deck drops while winding`);
}
for (let f = 0; f < DURATION; f++) {
  const fromCrank = Math.max(0, -crankAt(f) * LIFT.crank.R - SLACK0) + bounce(f);
  if (Math.abs(LIFT.deck0Top + fromCrank - deckTopAt(f)) > 1e-9) issues.push(`f${f}: the deck and the crank disagree`);
  if (Math.abs(-crankAt(f) * LIFT.crank.R - wound(f)) > 1e-9) issues.push(`f${f}: the chain and the crank disagree`);
}
const lift = Array.from({ length: DURATION }, (_, f) => f).find((f) => deckTopAt(f) > LIFT.deck0Top + 1e-6) ?? -1;
const taut = Array.from({ length: DURATION }, (_, f) => f).find((f) => slackAt(f) <= 1e-9) ?? -1;
if (Math.abs(lift - taut) > 1) issues.push(`lift-off f${lift} but the chain taut f${taut}`);
if (Math.abs(deckTopAt(DURATION - 1) - TOWER.cornY) > 0.015) issues.push(`at rest the deck at ${deckTopAt(DURATION - 1).toFixed(3)} m (want the sill ${TOWER.cornY})`);
const crownEnd = TOWER.cornY + 1.75;
if (LIFT.mastTop > crownEnd || LIFT.topSpr.h + LIFT.topSpr.R > crownEnd) issues.push("the mast or its sprocket rises above the arriving human's crown");
if (TOWER.cornY + LIFT.collarUp > LIFT.topSpr.h - LIFT.topSpr.R) issues.push("the collar reaches the top sprocket");
notes.push(`slack ${SLACK0.toFixed(2)} m, rise ${RISE.toFixed(2)} m, lift-off f${lift}, chain taut f${taut}, crank ${(crankAt(DURATION - 1) / (2 * Math.PI)).toFixed(2)} turns; mast top ${LIFT.mastTop} m vs his crown ${crownEnd} m`);

// ---- per frame
const zp = platZ();
const rows: string[] = [];
let faceCovered = 0;
for (let f = 0; f < DURATION; f++) {
  const c = cams[f];
  const P = towerPersp(c);
  const dk = deckTopAt(f);
  const sp = { X: m(RIDER_U), Y: hy(dk), Z: zp.zM + 20 };
  const feet = S(c, sp.X, sp.Y, sp.Z);
  const face = S(c, sp.X, hy(dk + 1.52), sp.Z);
  const crown = S(c, sp.X, hy(dk + 1.78), sp.Z);
  const pxm = c.k * P.r(zp.zM) * U;
  for (const [nm, p] of [["feet", feet], ["face", face], ["crown", crown]] as [string, P2][]) if (!inBox(p)) issues.push(`f${f}: human ${nm} out of the box ${p.map((v) => v.toFixed(0))}`);
  const at = P.p(CHIMP_SPOT_F.X, CHIMP_SPOT_F.Y, CHIMP_SPOT_F.Z) as P2;
  const ca = chimpAnchors(0, chimpPoseAt(f), at, P.r(CHIMP_SPOT_F.Z));
  const cf = scr(c, ca.headC as P2);
  const cr = ca.headR * c.k;
  if (inBand(cf[1])) issues.push(`f${f}: chimp face in a caption band y ${cf[1].toFixed(0)}`);
  const cover: string[] = [];
  // the human: his head (0.17 m) and his body below it (0.62 m wide)
  const head = S(c, sp.X, hy(dk + 1.6), sp.Z);
  const headR = m(0.17) * P.r(sp.Z) * c.k;
  if (Math.hypot(cf[0] - head[0], cf[1] - head[1]) < cr + headR) cover.push("head");
  const hx0 = S(c, sp.X - m(0.31), sp.Y, sp.Z)[0];
  const hx1 = S(c, sp.X + m(0.31), sp.Y, sp.Z)[0];
  const neck = S(c, sp.X, hy(dk + 1.43), sp.Z)[1];
  if (cf[0] + cr > hx0 && cf[0] - cr < hx1 && cf[1] + cr > neck && cf[1] - cr < feet[1]) cover.push("body");
  const db = dk - LIFT.deckT;
  const dTop = Math.min(S(c, m(LIFT.deckX0), hy(dk), zp.zF)[1], S(c, m(LIFT.deckX0), hy(dk), zp.zB)[1]);
  const dBot = S(c, m(LIFT.deckX0), hy(db), zp.zF)[1];
  const dL = S(c, m(LIFT.deckX0), hy(db), zp.zF)[0];
  if (cf[1] + cr > dTop && cf[1] - cr < dBot && cf[0] + cr > dL) cover.push("deck");
  const bA = S(c, m(LIFT.collarX0), hy(db - LIFT.braceDrop + 0.06), zp.zF + m(0.12));
  const bB = S(c, m(0.45), hy(db), zp.zF + m(0.12));
  if (segDist(cf, bA, bB) < cr + 6) cover.push("brace");
  if (cover.length) faceCovered++;
  const plZ = zp.zM - m(0.45) - 8;
  const pl = S(c, m(PLATE.X), hy(PLATE.h), plZ);
  const cap = PLATE.capM * pxm * (P.r(plZ) / P.r(zp.zM));
  if (!inBox(pl)) issues.push(`f${f}: plate centre out of the box ${pl.map((v) => v.toFixed(0))}`);
  rows.push(
    `f${String(f).padStart(3)} deck ${dk.toFixed(3)} m px/m ${pxm.toFixed(1)} deck y ${feet[1].toFixed(0)} face ${face.map((v) => v.toFixed(0))} chimpFace ${cf.map((v) => v.toFixed(0))} r ${cr.toFixed(1)} plate ${pl.map((v) => v.toFixed(0))} cap ${cap.toFixed(1)} ${cover.length ? "COVER " + cover.join("+") : ""}`,
  );
}
notes.push(`the chimp's face partly covered on ${faceCovered} frames`);
if (process.argv.includes("--table")) console.log(rows.join("\n"));
console.log(notes.join("\n"));
console.log(issues.length ? `ISSUES (${issues.length}):\n` + issues.slice(0, 60).join("\n") : "OK: no issues");
