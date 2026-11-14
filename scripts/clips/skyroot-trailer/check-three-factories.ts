// Per-frame checks for ThreeFactoriesEveryMonth (skyroot-trailer, cut 38).   bun scripts/clips/skyroot-trailer/check-three-factories.ts
//  * cadence: the frame each rocket's centre crosses the third hall's outer wall (EXIT_X), and the intervals
//  * collisions: every pair of rockets on screen (turned boxes incl. the hard shadow) never overlap, every frame
//  * the camera: k, dk, d2k and the pan speed per frame; the lead rocket's and the labels' screen positions
//  * the caption bands: labels (incl. their rise and shadow, whenever visible), rocket bases and the factories' floor
//    above y 607 on every frame; labels at rest (incl. shadow) at or above y 600
//  * roof clearance: the roof tips >= 24 px below the frame top on every frame
import { depthTransform, textRise } from "../../../generated/components/skyroot-trailer/skyrootShared";
import {
  DURATION,
  JAMB_X,
  LABEL_Y,
  GROUND,
  HALLS,
  LABEL_START,
  LABEL_RISE_PX,
  LABEL_SHADOW,
  ROOF_Y,
  MONTHS,
  ROCKET_H,
  SLOT_X,
  camAt,
  leadX,
  leanAt,
  rocketX,
} from "../../../generated/components/skyroot-trailer/ThreeFactoriesEveryMonth";

const BODY_W = (ROCKET_H / 0.995) * (221 / 2412) * 0.936; // world px (VIKRAM1 bodyW x box width)
const SHADOW = 5;

// cadence
const exits: number[] = [];
for (let i = 0; i < MONTHS.length + 1; i++) {
  let f = 0;
  while (f < DURATION && rocketX(i, f) < JAMB_X) f += 0.01;
  exits.push(+f.toFixed(2));
}
console.log("exit frames (centre passes the jamb):", exits.join(" "));
console.log("intervals:", exits.slice(1).map((e, i) => (e - exits[i]).toFixed(2)).join(" "));
console.log("label starts:", MONTHS.map((m, i) => `${m}${LABEL_START[i]}`).join(" "));
const L = MONTHS.length;
console.log("final x vs slots:", Array.from({ length: L }, (_, i) => (rocketX(i, DURATION - 1) - SLOT_X[L - 1 - i]).toFixed(2)).join(" "), "| next at f81/f96 vs jamb:", (rocketX(L, 81) - JAMB_X).toFixed(1), (rocketX(L, 96) - JAMB_X).toFixed(1));

// collisions: each rocket as a thin turned box about its base, grown by its shadow; separating-axis test
type P = [number, number];
const box = (x: number, rot: number): P[] => {
  const a = (rot * Math.PI) / 180;
  const hw = BODY_W / 2 + SHADOW;
  const corners: P[] = [
    [-hw, 0],
    [hw, 0],
    [hw, -ROCKET_H],
    [-hw, -ROCKET_H],
  ];
  return corners.map(([u, v]) => [x + u * Math.cos(a) - v * Math.sin(a), GROUND + u * Math.sin(a) + v * Math.cos(a)]);
};
const sepAxis = (A: P[], B: P[]) => {
  for (const poly of [A, B]) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      const nx = y2 - y1;
      const ny = x1 - x2;
      const pa = A.map(([x, y]) => x * nx + y * ny);
      const pb = B.map(([x, y]) => x * nx + y * ny);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return true;
    }
  }
  return false;
};
let hits = 0;
let minGap = Infinity;
for (let f = 0; f < DURATION; f++) {
  const xs = Array.from({ length: MONTHS.length + 1 }, (_, i) => rocketX(i, f));
  for (let i = 0; i < xs.length; i++)
    for (let j = i + 1; j < xs.length; j++) {
      minGap = Math.min(minGap, Math.abs(xs[i] - xs[j]) - (BODY_W + SHADOW));
      if (!sepAxis(box(xs[i], leanAt(i, f)), box(xs[j], leanAt(j, f)))) hits++;
    }
}
console.log(`collisions: ${hits} pair-frames; min clear gap between neighbours ${minGap.toFixed(1)} world px (lean max ${Math.max(...Array.from({ length: DURATION }, (_, f) => Math.abs(leanAt(0, f)))).toFixed(2)} deg)`);

// camera + bands
const rows: string[] = [];
let prevK = camAt(-1).k;
let prevDk = 0;
let bad = 0;
let badRoof = 0;
let minRoof = Infinity;
let restLabel = -Infinity;
for (let f = 0; f < DURATION; f++) {
  const c = camAt(f);
  const t = depthTransform(c, 1);
  const dk = c.k - prevK;
  const d2k = dk - prevDk;
  prevK = c.k;
  prevDk = dk;
  const vx = (camAt(f).x - camAt(f - 1).x) * c.k;
  const lead = t.toScreen(leadX(f), GROUND - ROCKET_H);
  const floor = t.toScreen(0, GROUND + 6 + 4).y;
  const label = t.toScreen(0, LABEL_Y + 4).y;
  const anyLabel = LABEL_START.some((s) => f >= s);
  const left = t.toScreen(HALLS[0], 0).x;
  const roof = t.toScreen(0, ROOF_Y).y;
  minRoof = Math.min(minRoof, roof);
  if (roof < 24) badRoof++;
  // every visible label's lowest ink (baseline + rise + shadow) clear of the band; at rest, at or above 600
  let lowLabel = -Infinity;
  for (let m = 0; m < MONTHS.length; m++) {
    const r = textRise(f, LABEL_START[m], c.k, { px: LABEL_RISE_PX });
    if (r.opacity <= 0) continue;
    const y = t.toScreen(0, LABEL_Y + r.dy + LABEL_SHADOW).y;
    lowLabel = Math.max(lowLabel, y);
    if (y > 607) bad++;
    if (r.dy < 1e-6) restLabel = Math.max(restLabel, y);
  }
  if (floor > 607) bad++;
  rows.push(
    `f${String(f).padStart(2)} k ${c.k.toFixed(4)} dk ${(dk * 1e4).toFixed(1).padStart(6)} d2k ${(d2k * 1e5).toFixed(1).padStart(6)} panX ${vx.toFixed(1).padStart(5)} floor ${floor.toFixed(0)} labelBase ${anyLabel ? label.toFixed(0) : "  - "} roof ${roof.toFixed(1)} lowLabel ${lowLabel > -Infinity ? lowLabel.toFixed(1) : "  - "} factL ${left.toFixed(0)} leadNose ${lead.x.toFixed(0)},${lead.y.toFixed(0)}`,
  );
}
console.log(rows.join("\n"));
console.log(`band violations: ${bad}`);
console.log(`roof: min ${minRoof.toFixed(2)} px below the top, frames under 24: ${badRoof}; f0 roof ${depthTransform(camAt(0), 1).toScreen(0, ROOF_Y).y.toFixed(2)}`);
console.log(`labels at rest, lowest ink (shadow): ${restLabel.toFixed(2)} (must be <= 600)`);
