// Per-frame geometry checks for OrbitOnEightyMillion (shruti-trailer, cut 13):
//   * the rocket wholly in frame (margin) every frame; its nozzle step and heading turn per frame (continuity);
//   * the rocket vs the tower: the minimum distance from the rocket's body (nozzle-nose segment, half-width) to the
//     tower's rectangle, every frame (must stay clear);
//   * the 12.5 : 1 ratio at the last frame (tower rise / small stack height) and the tower top vs the orbit;
//   * the camera: k, dk per frame (one deceleration lobe), the focus step;
//   * the orbit fully off-frame at f0; the settled frame's balance (bounding box of the content).
//   bun scripts/clips/shruti-trailer/check-orbit-eighty.ts [--table]
import {
  DURATION, RO, R_E, ROCKET_HALF_W_PER_L, SMALL_H, STACK_W, TOWER_H, TOWER_SPRITE_H, X_S, X_T, camAt, limbY, orbitY, rocketAt, towerBottomY, towerRise, TH_J, S_J, F_JOIN, EX, EY, PAD_ELEV, sAt,
} from "../../../generated/components/shruti-trailer/OrbitOnEightyMillion";
import { depthTransform } from "../../../generated/components/neal-stephenson-trailer/nealShared";

const table = process.argv.includes("--table");
const segRectDist = (a: { x: number; y: number }, b: { x: number; y: number }, f: number) => {
  // the upright tower's rectangle (only what is above the limb matters; the rocket never goes below the orbit)
  const x0 = X_T - STACK_W / 2, x1 = X_T + STACK_W / 2;
  const y1 = towerBottomY(f), y0 = y1 - TOWER_SPRITE_H;
  let best = Infinity;
  for (let i = 0; i <= 60; i++) {
    const p = { x: a.x + ((b.x - a.x) * i) / 60, y: a.y + ((b.y - a.y) * i) / 60 };
    const dx = Math.max(x0 - p.x, 0, p.x - x1);
    const dy = Math.max(y0 - p.y, 0, p.y - y1);
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best - ROCKET_HALF_W_PER_L * Math.hypot(b.x - a.x, b.y - a.y);
};
console.log(`TH_J ${(TH_J * 180 / Math.PI).toFixed(2)} deg, S_J ${S_J.toFixed(0)}, F_JOIN ${F_JOIN}, pad elev ${PAD_ELEV.toFixed(1)} deg`);
let prev: ReturnType<typeof rocketAt> | null = null;
let prevK = camAt(0).k;
let minClear = Infinity;
let minClearF = -1;
const issues: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const cam = camAt(f);
  const t = depthTransform(cam);
  const r = rocketAt(f);
  const b = t.toScreen(r.base.x, r.base.y);
  const n = t.toScreen(r.nose.x, r.nose.y);
  const clear = segRectDist(r.base, r.nose, f);
  if (clear < minClear) { minClear = clear; minClearF = f; }
  const m = 30;
  if (Math.min(b.x, n.x) < m || Math.max(b.x, n.x) > 1920 - m || Math.min(b.y, n.y) < m || Math.max(b.y, n.y) > 1080 - m) issues.push(`f${f} rocket near/out of frame: nozzle (${b.x.toFixed(0)}, ${b.y.toFixed(0)}) nose (${n.x.toFixed(0)}, ${n.y.toFixed(0)})`);
  const step = prev ? Math.hypot(r.base.x - prev.base.x, r.base.y - prev.base.y) * cam.k : 0;
  const turn = prev ? r.rot - prev.rot : 0;
  const dk = Math.log(cam.k) - Math.log(prevK);
  if (table) console.log(`f${String(f).padStart(3)} k ${cam.k.toFixed(3)} dlnk ${(dk * 1000).toFixed(2)} cam (${cam.x.toFixed(0)}, ${cam.y.toFixed(0)}) nozzle (${b.x.toFixed(0)}, ${b.y.toFixed(0)}) nose (${n.x.toFixed(0)}, ${n.y.toFixed(0)}) L ${(r.L * cam.k).toFixed(0)} step ${step.toFixed(1)}px turn ${turn.toFixed(2)} rot ${r.rot.toFixed(1)} tower ${towerRise(f).toFixed(0)} clear ${clear.toFixed(0)}`);
  prev = r;
  prevK = cam.k;
}
// orbit off-frame at f0
const t0 = depthTransform(camAt(0));
const crest0 = t0.toScreen(EX, EY - RO);
console.log(`f0 orbit crest screen y ${crest0.y.toFixed(0)} (must be < 0 with margin)`);
const tl = DURATION - 1;
console.log(`last frame: tower ${towerRise(tl).toFixed(2)} / small ${SMALL_H.toFixed(2)} = ${(towerRise(tl) / SMALL_H).toFixed(4)}; tower top y ${(limbY(X_T) - towerRise(tl)).toFixed(2)} vs orbit y ${orbitY(X_T).toFixed(2)} at its centre line`);
console.log(`tower at f176: ${towerRise(176).toFixed(2)} of ${TOWER_H.toFixed(2)}; f170 ${towerRise(170).toFixed(1)}; f150 ${towerRise(150).toFixed(1)}; f92 ${towerRise(92).toFixed(1)}; f100 ${towerRise(100).toFixed(1)}`);
const tE = depthTransform(camAt(tl));
const top = tE.toScreen(X_T, orbitY(X_T));
const smallScr = tE.toScreen(X_S, limbY(X_S));
const crest = tE.toScreen(EX, EY - RO);
const limb = tE.toScreen(EX, EY - R_E);
console.log(`final: tower top (${top.x.toFixed(0)}, ${top.y.toFixed(0)}), small stack base (${smallScr.x.toFixed(0)}, ${smallScr.y.toFixed(0)}), orbit crest y ${crest.y.toFixed(0)}, limb crest y ${limb.y.toFixed(0)}, k ${tE.k.toFixed(3)}`);
const rE = rocketAt(tl);
const sc = (p: { x: number; y: number }) => tE.toScreen(p.x, p.y);
const jx = rocketAt(0); void jx;
console.log(`final rocket: nozzle (${sc(rE.base).x.toFixed(0)}, ${sc(rE.base).y.toFixed(0)}) nose (${sc(rE.nose).x.toFixed(0)}, ${sc(rE.nose).y.toFixed(0)}), centre x ${((sc(rE.base).x + sc(rE.nose).x) / 2).toFixed(0)}, length ${(rE.L * tE.k).toFixed(0)} px`);
// join x in the final frame
let fj = 0; while (sAt(fj) < S_J && fj < DURATION) fj++;
console.log(`join: f${fj}, final-frame x ${sc(rocketAt(fj).base).x.toFixed(0)}`);
// on-screen speed of the rocket centre
const spd: string[] = [];
for (let f = 40; f < DURATION; f += 10) {
  const a = rocketAt(f - 1), b = rocketAt(f);
  const ta = depthTransform(camAt(f - 1)), tb = depthTransform(camAt(f));
  const ca = ta.toScreen((a.base.x + a.nose.x) / 2, (a.base.y + a.nose.y) / 2), cb = tb.toScreen((b.base.x + b.nose.x) / 2, (b.base.y + b.nose.y) / 2);
  spd.push(`f${f} ${Math.hypot(cb.x - ca.x, cb.y - ca.y).toFixed(2)}`);
}
console.log(`rocket centre screen speed px/f: ${spd.join(" ")}`);
console.log(`min rocket-tower clearance ${minClear.toFixed(1)} world px at f${minClearF}`);
console.log(issues.length ? issues.join("\n") : "rocket in frame every frame");
