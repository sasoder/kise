// Per-frame checks for WorkOfBillions (rsi-ten-earths, cut 45, revision 1).
//   bun scripts/clips/rsi-ten-earths/check-work-of-billions.ts
// Reads the pure world (workOfBillionsWorld.ts) and checks, on every frame:
//  * the camera: the log zoom's speed (one rise, one fall: no second surge), the eye's height, the horizon row
//  * faces vs the caption bands (y 1080-1250, 1360-1460): every robot drawn in full detail (the hero's storey, every
//    row and column whose face is inside its window and big enough to read: seated sprite >= 12 px); the other storeys'
//    robots are warm silhouettes behind their glass (no faces), the city's are back views
//  * the "2.5 billion" plate's text inside the keep-in box (x 65-1015, y 290-1070) and out of the bands, clear of the
//    globe once landed
//  * collisions: the eye never inside the hero's building or any city building (its footprint and height), never
//    under the street
//  * the globe: its bottom <= 1060 from the swap on (out of the caption bands); the hold keeps pulling back
import {
  BPITCH,
  COL0,
  COL1,
  DURATION,
  F,
  F_SWAP,
  globeAt,
  plateY,
  PLATE_SIZE,
  NROWS,
  PLATE_DUR,
  PLATE_F0,
  R_END,
  X_B0,
  X_B1,
  X_I0,
  X_I1,
  YS,
  Z_BB,
  Z_FACADE,
  Z_GLASS,
  colX,
  eyeAt,
  globeR,
  glassBottom,
  lambdaAt,
  lotBuilding,
  rowZ,
  storeyCeil,
  H_BLD,
} from "../../../generated/components/rsi-ten-earths/workOfBillionsWorld";

const BANDS = [
  [1080, 1250],
  [1360, 1460],
];
const inBand = (a: number, b: number) => BANDS.some(([u, v]) => b > u && a < v);
let fails = 0;
const fail = (msg: string) => {
  fails++;
  if (fails <= 40) console.log("FAIL", msg);
};

// ---- the camera ------------------------------------------------------------------------------------------------------
const lam: number[] = [];
for (let f = 0; f < DURATION; f++) lam.push(lambdaAt(f));
const v = lam.slice(1).map((x, i) => x - lam[i]);
let turns = 0;
for (let i = 2; i < v.length; i++) if (Math.sign(v[i] - v[i - 1]) !== Math.sign(v[i - 1] - v[i - 2]) && Math.abs(v[i] - v[i - 1]) > 1e-6) turns++;
const vPeak = v.indexOf(Math.max(...v));
console.log(`camera: lambda 0 -> ${lam[DURATION - 1].toFixed(2)} (x${Math.exp(lam[DURATION - 1]).toExponential(2)} in distance), speed peak f${vPeak} (${v[vPeak].toFixed(3)}/f), speed turns ${turns} (1 = one lobe)`);
if (turns > 1) fail(`the zoom speed has ${turns} turns`);
for (const f of [0, 27, 35, 52, 67, 79, 84]) {
  const e = eyeAt(f);
  console.log(`  f${f}: D ${(e.Dr / 178).toFixed(1)} m, eye ${((e.He + YS) / 178).toFixed(1)} m over the street, horizon row ${e.yh.toFixed(0)}`);
}

// ---- faces vs the bands ------------------------------------------------------------------------------------------------
let faceChecks = 0;
let worstFace = { f: -1, y: 0, px: 0 };
for (let f = 0; f <= F_SWAP; f++) {
  const e = eyeAt(f);
  const sGlass = F / (e.Dr + Z_GLASS);
  const oy0 = e.yh + (storeyCeil(0) + e.He) * sGlass;
  const oy1 = e.yh + (glassBottom(0) + e.He) * sGlass;
  const ox0 = 540 + X_I0 * sGlass;
  const ox1 = 540 + X_I1 * sGlass;
  for (let j = 0; j < NROWS; j++) {
    const Z = rowZ(j);
    const s = F / (e.Dr + Z);
    if (275 * s < 12) continue;
    for (let c = COL0; c <= COL1; c++) {
      const X = colX(c, j) + 53;
      const x = 540 + X * s;
      const yA = e.yh + (-250 + e.He) * s;
      const yB = e.yh + (-200 + e.He) * s;
      if (x < 0 || x > 1080 || x < ox0 || x > ox1) continue;
      if (yB < oy0 || yA > oy1 || yB < 0 || yA > 1920) continue;
      faceChecks++;
      if (inBand(yA - 5, yB + 5)) {
        fail(`f${f}: a face in a caption band (row ${j} col ${c}, y ${yA.toFixed(0)}-${yB.toFixed(0)}, ${(275 * s).toFixed(0)} px)`);
        if (275 * s > worstFace.px) worstFace = { f, y: yA, px: 275 * s };
      }
    }
  }
}
console.log(`faces: ${faceChecks} face placements checked over f0-${F_SWAP}${worstFace.f >= 0 ? `, worst f${worstFace.f} at y ${worstFace.y.toFixed(0)} (${worstFace.px.toFixed(0)} px)` : ", none in the bands"}`);

// ---- the plate and the globe ---------------------------------------------------------------------------------------
// the plate's text (Caslon, centred on its row: cap from row - 0.34 size to row + 0.34 size), sliding up from +0.5 size
for (let f = PLATE_F0; f < DURATION; f++) {
  const t = Math.max(0, Math.min(1, (f - PLATE_F0) / PLATE_DUR));
  if (t <= 0) continue;
  const lift = 0.5 * PLATE_SIZE * Math.pow(1 - t, 3);
  const y = plateY(f);
  const y0 = y - 0.34 * PLATE_SIZE + lift;
  const y1 = y + 0.34 * PLATE_SIZE + lift;
  const x0 = 540 - (5.43 * PLATE_SIZE) / 2;
  const x1 = 540 + (5.43 * PLATE_SIZE) / 2;
  if (t > 0.6 && (x0 < 65 || x1 > 1015 || y0 < 290 || y1 > 1070)) fail(`f${f}: the plate's text outside the keep-in (${x0.toFixed(0)}-${x1.toFixed(0)}, ${y0.toFixed(0)}-${y1.toFixed(0)})`);
  if (inBand(y0, y1)) fail(`f${f}: the plate in a caption band`);
  const g = globeAt(f);
  if (t >= 1 && y1 > g.cy - g.r - 8) fail(`f${f}: the landed plate touches the globe (text bottom ${y1.toFixed(0)}, globe top ${(g.cy - g.r).toFixed(0)})`);
}
// the globe out of the caption bands from the swap on (its bottom <= 1060)
for (let f = F_SWAP; f < DURATION; f++) {
  const g = globeAt(f);
  if (g.cy + g.r > 1060) fail(`f${f}: the globe's bottom at ${(g.cy + g.r).toFixed(0)}`);
}
console.log(`plate: "2.5 billion" text x ${(540 - 2.715 * PLATE_SIZE).toFixed(0)}-${(540 + 2.715 * PLATE_SIZE).toFixed(0)}, centre row ${plateY(109).toFixed(0)} (landed f109) -> ${plateY(DURATION - 1).toFixed(0)} (f148), cap ~${(0.68 * PLATE_SIZE).toFixed(0)} px`);

// ---- collisions: the eye --------------------------------------------------------------------------------------------
let near = Infinity;
for (let f = 0; f <= F_SWAP + 4; f += 0.25) {
  const e = eyeAt(f);
  const ex = 0;
  const ez = -e.Dr;
  const ey = -e.He;
  if (ey > YS - 20) fail(`f${f}: the eye at or under the street`);
  // the hero's building (its glass line to the back, the roof)
  if (ez > Z_FACADE - 10 && ez < Z_BB && ex > X_B0 && ex < X_B1 && ey > -H_BLD) fail(`f${f}: the eye inside the hero's building`);
  near = Math.min(near, Z_FACADE - ez);
  // the city: every lot near the eye
  const bz0 = Math.floor((ez - Z_FACADE) / BPITCH);
  for (let bz = bz0 - 1; bz <= bz0 + 1; bz++)
    for (let bx = -1; bx <= 1; bx++)
      for (let lx = 0; lx < 3; lx++)
        for (let lz = 0; lz < 3; lz++) {
          const b = lotBuilding(bx, bz, lx, lz);
          if (!b) continue;
          if (ex > b.x0 - 30 && ex < b.x1 + 30 && ez > b.z0 - 30 && ez < b.z1 + 30 && ey > YS - b.h - 30) fail(`f${f}: the eye inside lot (${bx},${bz},${lx},${lz}) h ${(b.h / 178).toFixed(0)} m, eye ${((YS - ey) / 178).toFixed(0)} m`);
        }
}
console.log(`collisions: the eye's nearest approach to the facade ${(near / 178).toFixed(2)} m (f0)`);

// ---- the globe ---------------------------------------------------------------------------------------------------------
for (const f of [F_SWAP, 86, 88, 90, 95, 100, 106, 120, 148]) {
  const g = globeAt(f);
  console.log(`  globe f${f}: r ${g.r.toFixed(0)} (${(2 * g.r).toFixed(0)} px across), centre y ${g.cy.toFixed(0)}, bottom ${(g.cy + g.r).toFixed(0)}`);
}
// the hold never freezes: the zoom keeps moving and the globe keeps turning
for (let f = 106; f < DURATION - 1; f++) if (lambdaAt(f + 1) - lambdaAt(f) < 0.001) fail(`f${f}: the pull-back stalls`);
void R_END;
console.log(fails ? `${fails} FAIL(s)` : "all checks pass");
