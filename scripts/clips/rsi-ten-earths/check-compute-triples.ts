// Per-frame checks for ComputeTriples (rsi-ten-earths, cut 37).   bun scripts/clips/rsi-ten-earths/check-compute-triples.ts
//  * framing: the racks' screen bbox per beat frame (keep-in x 65-1015, y 290-1070; front feet at y <= 985)
//  * the camera: log k per frame, its first and second differences (one acceleration lobe, one settle lobe)
//  * collisions: a moving copy may overlap only racks on its own slide line (its anchor and the copies telescoping
//    with it: the same row for an across step, the same column for a back step); the settled f118 layout has none
//  * speed: the fastest rack foot on screen per frame (px/frame, full res)
//  * the year plate: max(old, new) opacity through every swap (the hand-over never drops below 0.7)
import { RACK } from "../../../generated/components/rsi-ten-earths/tenEarthsHall";
import { DURATION, LAND, SWAP_LEAD, SWAP_W, camState, racksAt, swapOpacity, type CamState } from "../../../generated/components/rsi-ten-earths/ComputeTriples";

const proj = (C: CamState, X: number, Y: number, Z: number) => {
  const D = C.Dc + Z;
  const F = C.k * C.Dc;
  const yH = 960 + (C.depth.eyeY - C.cam.cy) * C.k;
  return [540 + ((X - C.cam.cx) * F) / D + C.shift, yH + ((Y + C.h) * F) / D];
};

let fail = 0;
// framing and camera
let prevLk = 0;
let prevD = 0;
const lobes: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const C = camState(f);
  const rs = racksAt(f);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const r of rs) {
    for (const [X, Y, Z] of [[r.X - RACK.w / 2, -RACK.h, r.Z], [r.X + RACK.w / 2, -RACK.h, r.Z], [r.X - RACK.w / 2, 0, r.Z], [r.X + RACK.w / 2, 0, r.Z], [r.X - RACK.w / 2, -RACK.h, r.Z + RACK.d], [r.X + RACK.w / 2, -RACK.h, r.Z + RACK.d]]) {
      const p = proj(C, X, Y, Z);
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
  }
  if (x0 < 65 || x1 > 1015 || y0 < 290 || y1 > 985) { fail++; console.log(`FRAME f${f}: bbox x ${x0.toFixed(0)}..${x1.toFixed(0)} y ${y0.toFixed(0)}..${y1.toFixed(0)}`); }
  if ([0, 15, 34, 54, 74, 94, 104, 118].includes(f)) console.log(`f${f} racks ${rs.length} bbox x ${x0.toFixed(0)}..${x1.toFixed(0)} y ${y0.toFixed(0)}..${y1.toFixed(0)}`);
  const lk = Math.log(C.k);
  const d = lk - prevLk;
  const d2 = d - prevD;
  if (f > 1) lobes.push(d2 > 1e-5 ? "+" : d2 < -1e-5 ? "-" : "0");
  prevD = d; prevLk = lk;
}
console.log(`camera d2(log k) signs f2..: ${lobes.join("")}`);

// collisions
let bad = 0, pairs = 0;
for (let f = 0; f < DURATION; f++) {
  const rs = racksAt(f);
  for (const a of rs) {
    if (a.s >= 1) continue;
    for (const b of rs) {
      if (a === b) continue;
      const sameLine = a.gen % 2 === 1 ? b.row === a.row : b.col === a.col;
      const ox = Math.min(a.X + RACK.w / 2, b.X + RACK.w / 2) - Math.max(a.X - RACK.w / 2, b.X - RACK.w / 2);
      const oz = Math.min(a.Z + RACK.d, b.Z + RACK.d) - Math.max(a.Z, b.Z);
      pairs++;
      if (ox > 0.5 && oz > 0.5 && !sameLine) { bad++; if (bad < 10) console.log(`COLLIDE f${f} gen${a.gen} r${a.row}c${a.col} hits gen${b.gen} r${b.row}c${b.col}`); }
    }
  }
}
const end = racksAt(DURATION - 1);
let ov = 0;
for (const a of end) for (const b of end) if (a !== b && Math.abs(a.X - b.X) < RACK.w - 0.5 && Math.abs(a.Z - b.Z) < RACK.d - 0.5) ov++;
console.log(`collisions: ${bad} in ${pairs} moving pairs; f${DURATION - 1} racks ${end.length}, settled overlaps ${ov}`);
fail += bad + ov;

// speed
const feet = (f: number) => {
  const C = camState(f);
  return new Map(racksAt(f).map((r) => [r.id, proj(C, r.X, 0, r.Z)]));
};
let vmax = 0, vf = 0;
for (let f = 1; f < DURATION; f++) {
  const a = feet(f - 1);
  for (const [id, p] of feet(f)) {
    const q = a.get(id);
    if (!q) continue;
    const v = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (v > vmax) { vmax = v; vf = f; }
  }
}
console.log(`fastest rack foot: ${vmax.toFixed(1)} px/frame at f${vf}`);

// the year plate's hand-over
let vmin = 1, vminAt = "";
for (const L of LAND) {
  for (let f = L - SWAP_LEAD; f <= L - SWAP_LEAD + SWAP_W; f++) {
    const t = Math.max(0, Math.min(1, (f - (L - SWAP_LEAD)) / SWAP_W));
    const o = swapOpacity(t);
    const m = Math.max(o.old, o.nu);
    if (m < vmin) { vmin = m; vminAt = `f${f}`; }
  }
}
console.log(`plate hand-over: min max(old, new) opacity ${vmin.toFixed(2)} at ${vminAt}`);
if (vmin < 0.7) fail++;
console.log(fail ? `FAIL (${fail})` : "OK");
process.exit(fail ? 1 : 0);
