// Per-frame checks for WorkOfBillions (rsi-ten-earths, cut 45).   bun scripts/clips/rsi-ten-earths/check-work-of-billions.ts
//  * the camera: ln D speed (one acceleration lobe, one settle lobe, then the creep), eye height and lens shift peaks
//  * faces vs the caption bands (y 1080-1250, 1360-1460) for every workstation on every frame, 5 px sway margin
//  * both plates inside the keep-in box (x 65-1015, y 290-1070) and out of the bands on every frame
//  * the pair: 2030's glide path never drops below the horizon (over the figures); its gap above "2.5 billion"
import {
  camState,
  colX,
  rowZ,
  NROWS,
  XV,
  F_LENS as F,
  PLATE_2030,
  PLATE_BN,
  plate2030At,
  DURATION,
  S_END,
} from "../../../generated/components/rsi-ten-earths/WorkOfBillions";
const bands = [
  [1080, 1250],
  [1360, 1460],
];
const inBand = (a: number, b: number) => bands.some(([u, v]) => b > u && a < v);
// camera
const lnD: number[] = [],
  H: number[] = [],
  SH: number[] = [];
for (let f = 0; f < DURATION; f++) {
  const c = camState(f);
  lnD.push(Math.log(c.D));
  H.push(c.h);
  SH.push(c.shift);
}
const d1 = (a: number[]) => a.slice(1).map((v, i) => v - a[i]);
const lobes = (a: number[]) => {
  const s = d1(a);
  let n = 0;
  for (let i = 1; i < s.length; i++) if (Math.sign(s[i]) !== Math.sign(s[i - 1]) && Math.abs(s[i]) > 1e-7) n++;
  return n;
};
const v = d1(lnD);
const acc = d1(v);
console.log(
  "lnD speed peak f",
  v.indexOf(Math.max(...v)),
  "max",
  Math.max(...v).toFixed(4),
  "accel sign changes",
  lobes(v),
  "| h speed peak f",
  d1(H).indexOf(Math.max(...d1(H))),
  "| shift speed peak f",
  d1(SH)
    .map(Math.abs)
    .indexOf(Math.max(...d1(SH).map(Math.abs))),
);
console.log(
  "speed lnD per frame:",
  v
    .filter((_, i) => i % 6 === 0)
    .map((x) => (x * 1000).toFixed(1))
    .join(" "),
);
// faces
let bad = 0;
let worstHero = 0;
const hits: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const c = camState(f);
  for (let r = 0; r < NROWS; r++)
    for (let col = -40; col <= 40; col++) {
      const Z = rowZ(r);
      const d = c.D + Z;
      const x = 540 + c.shift + (F * (colX(col) + 20 - XV)) / d;
      if (x < -30 || x > 1110) continue;
      const y0 = c.HY + (F * (c.h - 269)) / d,
        y1 = c.HY + (F * (c.h - 193)) / d;
      if (r === 0 && col === 0) worstHero = Math.max(worstHero, y1);
      if (inBand(y0 - 5, y1 + 5)) {
        bad++;
        if (hits.length < 8) hits.push(`f${f} r${r} c${col} y ${y0.toFixed(0)}-${y1.toFixed(0)} x ${x.toFixed(0)}`);
      }
    }
}
console.log("faces in bands (incl. 5 px sway):", bad, hits.join("; "), "| hero chin max y", worstHero.toFixed(0));
// plates
const W = (t: string) =>
  [...t].reduce((a, ch) => a + (ch === " " ? 0.27 : /[0-9]/.test(ch) ? 0.62 : /[.,]/.test(ch) ? 0.28 : 0.52), 0);
for (const [name, p0, txt] of [
  ["2030", PLATE_2030, "2030"],
  ["2.5 billion", PLATE_BN, "2.5 billion"],
] as const) {
  const p = p0;
  let out = 0;
  let minS = 1e9,
    maxS = 0;
  const ex: string[] = [];
  for (let f = p.f0; f < DURATION; f++) {
    const q = txt === "2030" ? plate2030At(f) : p;
    const c = camState(f);
    const d = c.D + q.Z;
    const s = (q.size * F) / d;
    const cx = 540 + c.shift + (F * (q.X - XV)) / d;
    const cy = c.HY + (F * (c.h + q.Y)) / d;
    const w = W(txt) * s;
    const x0 = cx - w / 2,
      x1 = cx + w / 2,
      y0 = cy - 0.42 * s,
      y1 = cy + 0.42 * s;
    minS = Math.min(minS, s);
    maxS = Math.max(maxS, s);
    if (x0 < 65 || x1 > 1015 || y0 < 290 || y1 > 1070 || inBand(y0, y1)) {
      out++;
      if (ex.length < 3) ex.push(`f${f} [${x0.toFixed(0)},${x1.toFixed(0)}]x[${y0.toFixed(0)},${y1.toFixed(0)}]`);
    }
    if (f === p.f0 || f === S_END || f === DURATION - 1)
      console.log(`  ${name} f${f}: centre (${cx.toFixed(0)}, ${cy.toFixed(0)}) type ${s.toFixed(0)} px`);
  }
  console.log(
    `plate ${name}: frames outside keep-in / in bands: ${out} ${ex.join(" ")} size ${minS.toFixed(0)}-${maxS.toFixed(0)} px`,
  );
}
// the pair: 2030's bottom vs the horizon on every frame, and the gap to "2.5 billion" once both are up
{
  const scr = (f: number, p: { X: number; Y: number; Z: number; size: number }) => {
    const c = camState(f);
    const d = c.D + p.Z;
    return { x: 540 + c.shift + (F * (p.X - XV)) / d, y: c.HY + (F * (c.h + p.Y)) / d, s: (p.size * F) / d, HY: c.HY };
  };
  let worst = 1e9,
    wf = -1,
    minGap = 1e9;
  for (let f = 0; f < DURATION; f++) {
    const a = scr(f, plate2030At(f));
    const clr = a.HY - (a.y + 0.42 * a.s);
    if (clr < worst) {
      worst = clr;
      wf = f;
    }
    if (f >= PLATE_BN.f0 + PLATE_BN.dur) {
      const b = scr(f, PLATE_BN);
      minGap = Math.min(minGap, b.y - 0.36 * b.s - (a.y + 0.34 * a.s));
    }
  }
  console.log(
    `pair: 2030 bottom above the horizon by >= ${worst.toFixed(0)} px (f${wf}); gap above 2.5 billion >= ${minGap.toFixed(0)} px once landed`,
  );
}
