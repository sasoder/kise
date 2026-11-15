// check-freed-compute: every-frame checks for FreedComputeRunsCopies (rsi-ten-earths, cut 71): the camera track
// (k, dk, d2k and the eye's rise and drift), the keep-in box (racks, the original Genius, every visible copy's head
// and feet), the caption bands for faces, copy-to-copy overlap of visible boxes, and each copy hidden at its start.
// Run: bun scripts/clips/rsi-ten-earths/check-freed-compute.ts [--cam]
import { BLOCK_RACKS, F_LENS, GENIUS } from "../../../generated/components/rsi-ten-earths/computeBlockState";
import { COPIES, DURATION, camS7, copyAt, screenOf } from "../../../generated/components/rsi-ten-earths/FreedComputeRunsCopies";
import { RACK } from "../../../generated/components/rsi-ten-earths/tenEarthsHall";

const HEAD = 330;
const HALF = { back: 67, front: 63 };
const w = { xL: 1e9, xR: -1e9, top: 1e9, origHead: 1e9, origFeet: 0, copyFaceMin: 1e9, copyFaceMax: 0, copyXL: 1e9, copyXR: -1e9 };
let worstOverlap = 0;
let overlapAt = "";
let startVisible = 0;
const camRows: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const s = camS7(f);
  for (const rk of BLOCK_RACKS) {
    const a = screenOf(s, rk.X - RACK.w / 2, -RACK.h, rk.Z);
    const b = screenOf(s, rk.X + RACK.w / 2, 0, rk.Z);
    const bb = screenOf(s, rk.X + RACK.w / 2, -RACK.h, rk.Z + RACK.d);
    const ba = screenOf(s, rk.X - RACK.w / 2, -RACK.h, rk.Z + RACK.d);
    w.xL = Math.min(w.xL, a[0], ba[0]);
    w.xR = Math.max(w.xR, b[0], bb[0]);
    w.top = Math.min(w.top, a[1], bb[1]);
  }
  const of = screenOf(s, GENIUS.X, 0, GENIUS.Z);
  w.origFeet = Math.max(w.origFeet, of[1]);
  w.origHead = Math.min(w.origHead, of[1] - HEAD * (F_LENS / (s.Dc + GENIUS.Z)));
  const boxes: { id: number; l: number; r: number; t: number; b: number }[] = [];
  for (const c of COPIES) {
    const st = copyAt(c, f);
    if (!st) continue;
    const q = F_LENS / (s.Dc + c.Z);
    const ft = screenOf(s, st.X, 0, c.Z);
    // visible part = the body box clipped to the slot between the racks' front edges
    const xa = c.xL === null ? -1e9 : screenOf(s, c.xL, 0, c.Z)[0];
    const xb = c.xR === null ? 1e9 : screenOf(s, c.xR, 0, c.Z)[0];
    const l = Math.max(xa, ft[0] - HALF.back * q);
    const r = Math.min(xb, ft[0] + HALF.front * q);
    if (st.t < 0.02 && r - l > 0.5) startVisible = Math.max(startVisible, r - l);
    if (r - l <= 0.5) continue;
    const face = ft[1] - 0.8 * HEAD * q;
    w.copyFaceMin = Math.min(w.copyFaceMin, face);
    w.copyFaceMax = Math.max(w.copyFaceMax, face);
    w.copyXL = Math.min(w.copyXL, l);
    w.copyXR = Math.max(w.copyXR, r);
    boxes.push({ id: c.id, l, r, t: ft[1] - HEAD * q, b: ft[1] });
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i];
      const B = boxes[j];
      const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l);
      const oy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
      if (ox > 0 && oy > 0 && ox * oy > worstOverlap) {
        worstOverlap = ox * oy;
        overlapAt = `f${f} copies ${A.id}/${B.id} ${ox.toFixed(0)}x${oy.toFixed(0)} px`;
      }
    }
  const k = F_LENS / s.Dc;
  camRows.push(`${f}\t${s.Dc.toFixed(1)}\t${s.H.toFixed(1)}\t${s.cx.toFixed(1)}\t${s.yH.toFixed(1)}\t${k.toFixed(4)}`);
}
console.log(Object.fromEntries(Object.entries(w).map(([key, v]) => [key, Math.round(v)])));
console.log("worst copy-copy box overlap (body boxes, px^2):", Math.round(worstOverlap), overlapAt);
console.log("copy visible at step start (px, want 0):", startVisible.toFixed(2));
if (process.argv.includes("--cam")) {
  console.log("f\tDc\tH\tcx\tyH\tk");
  console.log(camRows.join("\n"));
}
