// Per-frame geometry checks for OrbitOnEightyMillion (shruti-trailer, cut 13, review 3: the raised-before-orbit row):
//   * the rocket: wholly in frame through the opening (it may leave frame during the pan); its world speed every frame
//     (never stops, never jumps) and its on-screen centre (table);
//   * the row: each stack's height vs Skyroot's (ratios to the value), its top vs the dashed orbit (clearly below);
//   * the labels: their boxes (Barlow 900 advance widths, cap height) never overlap each other, the orbit line, the
//     rocket or the trail at rest, and are inside the final frame; the header too;
//   * the camera: k, dk per frame; the final frame's content box vs (960, 540).
//   bun scripts/clips/shruti-trailer/check-orbit-eighty.ts [--table]
import {
  DURATION, EX, EY, F_JOIN, HEADER_X, HEADER_Y, LABEL, PAN0, PAN1, RO, ROW, S_J, SKYROOT_LABEL, SKYROOT_USD, SMALL_H, STACK_W, TH_J, X_S,
  camAt, cmpH, cmpLabel, cmpRise, cmpTopY, limbY, orbitY, pathAt, rocketAt, sAt, type Cmp,
} from "../../../generated/components/shruti-trailer/OrbitOnEightyMillion";
import { depthTransform } from "../../../generated/components/neal-stephenson-trailer/nealShared";

const table = process.argv.includes("--table");
const ADV: Record<string, number> = { " ": 0.2, $: 0.58, "+": 0.476, ".": 0.264, "0": 0.573, "1": 0.356, "3": 0.556, "5": 0.555, "6": 0.552, A: 0.714, B: 0.615, C: 0.609, D: 0.618, E: 0.57, F: 0.554, H: 0.611, I: 0.266, K: 0.636, L: 0.574, M: 0.714, N: 0.658, O: 0.621, R: 0.615, S: 0.602, T: 0.595, V: 0.645, Y: 0.651, "~": 0.557 };
const textW = (t: string, size: number) => [...t].reduce((a, c) => a + (ADV[c] ?? 0.65), 0) * size;
type Box = { name: string; x0: number; y0: number; x1: number; y1: number };
const CAP = 0.7;
const labelBox = (name: string, x: number, bottomY: number, anchor: "middle" | "end" | "start", lines: [string, number][]): Box => {
  // lines bottom-up: [text, size]; baselines stacked like the component's Label
  let y = bottomY;
  let top = bottomY;
  let w = 0;
  lines.forEach(([t, size], i) => {
    w = Math.max(w, textW(t, size));
    top = y - CAP * size;
    if (i < lines.length - 1) y -= CAP * size + LABEL.gap;
  });
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return { name, x0, y0: top - 2, x1: x0 + w, y1: bottomY + 0.22 * lines[0][1] + 4 }; // + descender-ish and the 4 px shadow
};
const lab = (c: Cmp) => {
  const l = cmpLabel(c);
  const lines: [string, number][] = [];
  if (c.note) lines.push([c.note, LABEL.note]);
  lines.push([c.amount, LABEL.amount], [c.name, LABEL.name]);
  return labelBox(c.name, l.x, l.bottomY, "middle", lines);
};
const boxes: Box[] = [labelBox("SKYROOT", SKYROOT_LABEL.x, SKYROOT_LABEL.bottomY, "end", [["1ST TRY", LABEL.note], ["$160M", LABEL.amount], ["SKYROOT", LABEL.name]]), ...ROW.map(lab)];
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const issues: string[] = [];

console.log(`TH_J ${((TH_J * 180) / Math.PI).toFixed(2)} deg, S_J ${S_J.toFixed(0)}, F_JOIN ${F_JOIN}; pan f${PAN0}-f${PAN1}`);
// -- per frame: rocket + camera
let prevS = sAt(0);
let prevK = camAt(0).k;
let minV = Infinity;
let maxDv = 0;
let prevV = 0;
for (let f = 0; f < DURATION; f++) {
  const cam = camAt(f);
  const t = depthTransform(cam);
  const r = rocketAt(f);
  const b = t.toScreen(r.base.x, r.base.y);
  const n = t.toScreen(r.nose.x, r.nose.y);
  const v = r.s - prevS;
  if (f > 8) {
    minV = Math.min(minV, v);
    maxDv = Math.max(maxDv, Math.abs(v - prevV));
  }
  const m = 30;
  const out = Math.min(b.x, n.x) < m || Math.max(b.x, n.x) > 1920 - m || Math.min(b.y, n.y) < m || Math.max(b.y, n.y) > 1080 - m;
  if (out && f < PAN0) issues.push(`f${f} rocket near/out of frame before the pan: nozzle (${b.x.toFixed(0)}, ${b.y.toFixed(0)}) nose (${n.x.toFixed(0)}, ${n.y.toFixed(0)})`);
  const dk = Math.log(cam.k) - Math.log(prevK);
  if (table) console.log(`f${String(f).padStart(3)} k ${cam.k.toFixed(3)} dlnk ${(dk * 1000).toFixed(2)} cam (${cam.x.toFixed(0)}, ${cam.y.toFixed(0)}) rocket ctr (${((b.x + n.x) / 2).toFixed(0)}, ${((b.y + n.y) / 2).toFixed(0)}) v ${v.toFixed(2)} ${ROW.map((c) => `${c.key.slice(0, 3)} ${cmpRise(c, f).toFixed(0)}`).join(" ")}`);
  prevS = r.s;
  prevV = v;
  prevK = cam.k;
}
console.log(`rocket world speed after lift-off: min ${minV.toFixed(2)} px/f (never stops), max change ${maxDv.toFixed(2)} px/f per frame (no jumps)`);
// -- heights at the last frame
const tl = DURATION - 1;
const sky = SMALL_H;
console.log(`heights at f${tl} (centre line, limb to top, world px; Skyroot ${sky.toFixed(2)} = $${SKYROOT_USD}M):`);
for (const c of ROW) {
  const h = cmpRise(c, tl);
  const want = (sky * c.usd) / SKYROOT_USD;
  const top = cmpTopY(c, tl);
  console.log(`  ${c.name.padEnd(11)} ${h.toFixed(2)} (target ${want.toFixed(2)}, ratio ${(h / sky).toFixed(4)} vs ${(c.usd / SKYROOT_USD).toFixed(4)}) top y ${top.toFixed(1)}, orbit y there ${orbitY(c.x).toFixed(1)}, clearance ${(top - orbitY(c.x)).toFixed(0)}; lands f${c.t1}, starts f${c.t0.toFixed(1)}`);
}
// -- labels
for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) if (overlap(boxes[i], boxes[j])) issues.push(`labels overlap: ${boxes[i].name} / ${boxes[j].name}`);
  const bx = boxes[i];
  // the orbit line (+ its width and shadow) over the box span
  let minGap = Infinity;
  for (let x = bx.x0; x <= bx.x1; x += 4) minGap = Math.min(minGap, bx.y0 - (orbitY(x) + 6.5));
  if (minGap < 10) issues.push(`label ${bx.name} within ${minGap.toFixed(0)} px of the orbit line`);
  // the stacks' bodies (rest) and the small stack
  for (const c of ROW) {
    const sb: Box = { name: c.name, x0: c.x - STACK_W / 2, x1: c.x + STACK_W / 2 + 4, y0: limbY(c.x) - cmpH(c), y1: limbY(c.x) };
    if (overlap(bx, sb)) issues.push(`label ${bx.name} overlaps the ${c.name} stack`);
  }
  // the trail at rest: the climb + orbit up to the last frame's nozzle
  const sEnd = sAt(tl);
  for (let s = 0; s <= sEnd; s += 3) {
    const p = pathAt(s);
    if (p.x > bx.x0 - 9 && p.x < bx.x1 + 9 && p.y > bx.y0 - 9 && p.y < bx.y1 + 9) {
      issues.push(`label ${bx.name} touches the trail at (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
      break;
    }
  }
  // the rocket body over the labels' lifetimes (frames from its rise)
  for (let f = 96; f < DURATION; f++) {
    const r = rocketAt(f);
    for (let q = 0; q <= 1; q += 0.1) {
      const x = r.base.x + (r.nose.x - r.base.x) * q;
      const y = r.base.y + (r.nose.y - r.base.y) * q;
      if (x > bx.x0 - 12 && x < bx.x1 + 12 && y > bx.y0 - 12 && y < bx.y1 + 12) issues.push(`f${f} rocket over label ${bx.name}`);
    }
  }
}
// -- the final frame
const tE = depthTransform(camAt(tl));
const sc = (x: number, y: number) => tE.toScreen(x, y);
let cx0 = Infinity, cx1 = -Infinity, cy0 = Infinity, cy1 = -Infinity;
for (const bx of boxes) {
  const a = sc(bx.x0, bx.y0), b = sc(bx.x1, bx.y1);
  cx0 = Math.min(cx0, a.x); cx1 = Math.max(cx1, b.x); cy0 = Math.min(cy0, a.y);
  if (a.x < 24 || b.x > 1896 || a.y < 24 || b.y > 1056) issues.push(`final frame: label ${bx.name} near/out of frame (${a.x.toFixed(0)}..${b.x.toFixed(0)}, ${a.y.toFixed(0)}..${b.y.toFixed(0)})`);
}
for (const c of [{ x: X_S, h: SMALL_H }, ...ROW.map((c) => ({ x: c.x, h: cmpH(c) }))]) {
  const a = sc(c.x - STACK_W / 2, limbY(c.x) - c.h), b = sc(c.x + STACK_W / 2, limbY(c.x));
  cx0 = Math.min(cx0, a.x); cx1 = Math.max(cx1, b.x); cy1 = Math.max(cy1, b.y);
  if (a.x < 24 || b.x > 1896 || b.y > 1060) issues.push(`final frame: stack at x ${c.x} near/out of frame`);
}
const crest = sc(EX, EY - RO);
const rE = rocketAt(tl);
const rc = sc((rE.base.x + rE.nose.x) / 2, (rE.base.y + rE.nose.y) / 2);
console.log(`final: k ${tE.k.toFixed(3)}; content box x ${cx0.toFixed(0)}..${cx1.toFixed(0)} (centre ${((cx0 + cx1) / 2).toFixed(0)}), labels top ${cy0.toFixed(0)} .. bases ${cy1.toFixed(0)} (centre ${((cy0 + cy1) / 2).toFixed(0)}); orbit crest screen y ${crest.y.toFixed(0)}; rocket centre (${rc.x.toFixed(0)}, ${rc.y.toFixed(0)})`);
console.log(`header: baseline y ${HEADER_Y}, x ${HEADER_X}..${(HEADER_X + textW("RAISED BEFORE FIRST ORBIT", LABEL.header)).toFixed(0)}`);
// the header vs the orbit line / trail / rocket on screen, every frame from its rise
const hb = { x0: HEADER_X, x1: HEADER_X + textW("RAISED BEFORE FIRST ORBIT", LABEL.header), y0: HEADER_Y - CAP * LABEL.header - 2, y1: HEADER_Y + 10 };
for (let f = 100; f < DURATION; f++) {
  const t = depthTransform(camAt(f));
  for (let sx = hb.x0; sx <= hb.x1; sx += 6) {
    const wx = (sx - 960) / t.k + camAt(f).x; // approximate inverse (focus plane)
    const oy = t.toScreen(wx, orbitY(wx)).y;
    if (oy - 12 * t.k < hb.y1 && oy + 12 * t.k > hb.y0) { issues.push(`f${f} header meets the orbit line at screen x ${sx.toFixed(0)}`); break; }
  }
  const r = rocketAt(f);
  for (let q = 0; q <= 1; q += 0.1) {
    const p = t.toScreen(r.base.x + (r.nose.x - r.base.x) * q, r.base.y + (r.nose.y - r.base.y) * q);
    if (p.x > hb.x0 - 12 && p.x < hb.x1 + 12 && p.y > hb.y0 - 12 && p.y < hb.y1 + 12) { issues.push(`f${f} rocket over the header`); break; }
  }
}
console.log(issues.length ? issues.join("\n") : "all checks clear");
