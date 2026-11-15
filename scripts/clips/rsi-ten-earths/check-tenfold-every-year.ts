// Per-frame checks for TenfoldEveryYear (rsi-ten-earths, cut 89).   bun scripts/clips/rsi-ten-earths/check-tenfold-every-year.ts
//  * the camera: ln s speed (one acceleration lobe, one settle lobe, then the creep), eye height, horizon, lens shift
//  * framing: every standing figure that is on screen and above the bands keeps its face out of the caption bands
//    (y 1080-1250, 1360-1460); the front row's faces above y 1070; the formation inside x 65-1015 while it fits
//  * the row of ten and the block of 100 wholly inside the keep-in box on every frame from their landing on
//  * screen speeds of every figure on screen (px per frame, head point) per step; the plate in the keep-in box,
//    above the horizon and clear of every figure on every frame it shows
import {
  BX,
  DURATION,
  FIGS,
  PLATE,
  PLATE_F0,
  S_END,
  camState,
  figsAt,
  screenOf,
} from "../../../generated/components/rsi-ten-earths/TenfoldEveryYear";

const bands = [
  [1080, 1250],
  [1360, 1460],
];
const inBand = (a: number, b: number) => bands.some(([u, v]) => b > u && a < v);
const d1 = (a: number[]) => a.slice(1).map((v, i) => v - a[i]);
const signChanges = (a: number[]) => {
  let n = 0;
  for (let i = 1; i < a.length; i++) if (Math.sign(a[i]) !== Math.sign(a[i - 1]) && Math.abs(a[i]) > 1e-7) n++;
  return n;
};

// ---- the camera ----
const LS: number[] = [];
const H: number[] = [];
const HYs: number[] = [];
const SH: number[] = [];
for (let f = 0; f < DURATION; f++) {
  const c = camState(f);
  LS.push(Math.log(c.s));
  H.push(c.h);
  HYs.push(c.HY);
  SH.push(c.shift);
}
const v = d1(LS);
console.log(`ln s speed peak f${v.indexOf(Math.min(...v))} (${Math.min(...v).toFixed(4)}/f), accel sign changes ${signChanges(d1(v))}`);
console.log(`eye h speed peak f${d1(H).indexOf(Math.max(...d1(H)))}, HY speed peak f${d1(HYs).indexOf(Math.min(...d1(HYs)))}, shift speed peak f${d1(SH).map(Math.abs).indexOf(Math.max(...d1(SH).map(Math.abs)))}`);
for (const f of [0, 12, 20, 30, 45, 60, 68, 80, 94, 104, 114, 122, 132, 142, 155]) {
  const c = camState(f);
  console.log(`f${String(f).padStart(3)}  s ${c.s.toFixed(3)} (Genius ${(312 * c.s).toFixed(0)} px)  eye ${(c.h / 178).toFixed(2)} m  HY ${c.HY.toFixed(0)}  Yf ${c.Yf.toFixed(0)}  shift ${c.shift.toFixed(1)}  D ${c.D.toFixed(0)}`);
}

// ---- figures: faces, framing, speeds ----
const HEAD_TOP = 325;
const FACE_LO = 250; // the chin
let faceHits = 0;
const faceEx: string[] = [];
let worstFront = 0;
const speedMax = new Map<number, { v: number; f: number; hPx: number }>();
let outOfBox = 0;
const boxEx: string[] = [];
let prev = new Map<string, { x: number; y: number }>();
let plateHits = 0;
for (let f = 0; f < DURATION; f++) {
  const c = camState(f);
  const placed = figsAt(f);
  const cur = new Map<string, { x: number; y: number }>();
  let xmin = 1e9;
  let xmax = -1e9;
  let ymin = 1e9;
  const pf = screenOf(c, PLATE.X, PLATE.Y, PLATE.Z);
  const pPx = PLATE.size * pf.s;
  const pBox = { x0: pf.x - 1.1 * pPx, x1: pf.x + 1.1 * pPx, y0: pf.y - 0.55 * pPx, y1: pf.y + 0.45 * pPx };
  for (const g of placed) {
    const p = screenOf(c, g.X, 0, g.Z);
    const hPx = 312 * p.s;
    const yTop = p.y - HEAD_TOP * p.s;
    const yChin = p.y - FACE_LO * p.s;
    const on = p.x > -20 && p.x < 1100 && yTop < 1920;
    const id = `${g.gi}|${g.b}|${g.r}`;
    if (on) {
      cur.set(id, { x: p.x, y: yTop });
      if (hPx > 6 && inBand(yTop, yChin)) {
        faceHits++;
        if (faceEx.length < 6) faceEx.push(`f${f} ${id} face y ${yTop.toFixed(0)}-${yChin.toFixed(0)}`);
      }
      if (g.Z === 0) worstFront = Math.max(worstFront, yChin);
      const q = prev.get(id);
      if (q && hPx >= 20) {
        const sp = Math.hypot(p.x - q.x, yTop - q.y);
        const m = speedMax.get(g.gen);
        if (!m || sp > m.v) speedMax.set(g.gen, { v: sp, f, hPx });
      }
      if (f >= PLATE_F0 && p.x > pBox.x0 && p.x < pBox.x1 && yTop < pBox.y1 && p.y > pBox.y0) plateHits++;
    }
    if (g.c === 0 && g.b === 0) {
      xmin = Math.min(xmin, p.x - 55 * p.s);
      xmax = Math.max(xmax, p.x + 55 * p.s);
      ymin = Math.min(ymin, yTop);
    }
  }
  if (xmin < 65 || xmax > 1015 || ymin < 290) {
    outOfBox++;
    if (boxEx.length < 8) boxEx.push(`f${f} block x ${xmin.toFixed(0)}-${xmax.toFixed(0)} top ${ymin.toFixed(0)}`);
  }
  if (f >= PLATE_F0) {
    if (pBox.x0 < 65 || pBox.x1 > 1015 || pBox.y0 < 290 || pBox.y1 > c.HY - 10) console.log(`plate out f${f}`, pBox, "HY", c.HY.toFixed(0));
  }
  prev = cur;
}
for (const f of [68, 114, 142, 155]) {
  const c = camState(f);
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  for (const g of figsAt(f)) {
    const p = screenOf(c, g.X, 0, g.Z);
    if (312 * p.s < 4) continue;
    x0 = Math.min(x0, p.x - 50 * p.s);
    x1 = Math.max(x1, p.x + 50 * p.s);
    y0 = Math.min(y0, p.y - 325 * p.s);
  }
  console.log(`f${f} formation x ${x0.toFixed(0)}-${x1.toFixed(0)}, top y ${y0.toFixed(0)} (figures >= 4 px)`);
}
console.log(`faces in bands: ${faceHits}`, faceEx.join(" | "));
console.log(`front row chin worst y ${worstFront.toFixed(0)}`);
console.log(`block 0 out of keep-in: ${outOfBox} frames`, boxEx.join(" | "));
console.log(`plate overlaps: ${plateHits}`);
for (const [gen, m] of [...speedMax.entries()].sort((a, b) => a[0] - b[0])) console.log(`gen ${gen}: max ${m.v.toFixed(1)} px/f at f${m.f} (figure ${m.hPx.toFixed(0)} px)`);
console.log(`figures: ${FIGS.length}, BX ${BX}, S_END ${S_END}`);
