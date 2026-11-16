// Per-frame checks for ThreeFactoriesEveryMonth v4 (skyroot-trailer, cut 38).   bun scripts/clips/skyroot-trailer/check-three-factories.ts
//  * pulse cadence: every move starts and ends on the beat, peak speed constant, and the row arrivals (JAN..JUN)
//  * nothing passes: rockets keep their order and a full pitch apart while still (never closer than PITCH on any frame)
//  * the seating: each part's ease window sits inside the dwell of its hall (the shuttle stopped), gap open -> closed
//  * clearance: the full exploded column always hangs under the crane rail (the eave truss)
//  * labels: each month's label starts rising when its rocket lands, and rides with it
//  * the camera: k, dk, pan per frame; composition (screen box of roofs, rail, labels, row and halls) at f15, f81, f96
import { depthTransform } from "../../../generated/components/skyroot-trailer/skyrootShared";
import {
  DURATION,
  GAP,
  HALL_EAVES,
  K1,
  LABEL_START,
  LABEL_Y,
  MONTHS,
  MOVE,
  N_LAST,
  OVH,
  PITCH,
  PULSE,
  RAIL_Y,
  ROCKET_H,
  SEAT,
  SHUTTLE_H,
  V,
  arriveAt,
  camAt,
  gapUnder,
  liftOf,
  movesAt,
  rocketX,
  seatAt,
  stationOf,
  stationX,
} from "../../../generated/components/skyroot-trailer/ThreeFactoriesEveryMonth";

const fx = (v: number, d = 1) => v.toFixed(d);
let fail = 0;
const bad = (msg: string) => {
  fail++;
  console.log("  FAIL " + msg);
};

console.log(`ThreeFactoriesEveryMonth v4: ${DURATION} frames, PULSE ${PULSE}, MOVE ${MOVE}, PITCH ${PITCH}, V ${fx(V)} px/f`);

// -- cadence --------------------------------------------------------------------------------------------------------------
console.log("\nCADENCE (movesAt, speed per frame, quarter-frame sampling)");
const runs: string[] = [];
let moving = false;
let start = 0;
let peak = 0;
for (let q = -40; q <= DURATION * 4; q++) {
  const f = q / 4;
  const v = (movesAt(f + 0.25) - movesAt(f)) * 4 * PITCH;
  peak = Math.max(peak, v);
  if (!moving && v > 0.01) {
    moving = true;
    start = f;
  } else if (moving && v <= 0.01) {
    moving = false;
    runs.push(`${fx(start, 2)}-${fx(f, 2)}`);
  }
}
if (moving) runs.push(`${fx(start, 2)}-...`);
console.log("  moves: " + runs.join("  "));
console.log(`  peak ${fx(peak)} px/f (V ${fx(V)})`);
if (Math.abs(peak - V) > 0.5) bad("peak speed differs from V");
console.log("  row arrivals (lands in the first slot):");
MONTHS.forEach((m, n) => {
  const a = arriveAt(n);
  console.log(`    ${m}  f${a}  label from f${LABEL_START[n]}`);
  if (LABEL_START[n] !== a) bad(`${m} label not on its landing`);
  if (Math.abs(stationOf(n, a) - 4) > 1e-6) bad(`${m} not at station 4 on f${a}`);
});
console.log(`  at f96: moves done ${fx(movesAt(96), 3)} (the pulse ${Math.floor(movesAt(96))}->${Math.ceil(movesAt(96))} under way: ${movesAt(96) % 1 > 0.01 ? "yes" : "NO"})`);
if (movesAt(96) % 1 <= 0.01) bad("end frame is not mid-pulse");

// -- nothing passes ----------------------------------------------------------------------------------------------------------
let minSep = Infinity;
for (let q = 0; q <= DURATION * 4; q++) {
  const f = q / 4;
  for (let n = 0; n < N_LAST; n++) minSep = Math.min(minSep, rocketX(n + 1, f) - rocketX(n, f)); // DIR -1: n (earlier) is left of n+1
}
console.log(`\nORDER: min spacing rocket n -> n+1 over all frames ${fx(minSep)} px (PITCH ${PITCH})`);
if (minSep < PITCH - 1e-6) bad("rockets closer than a pitch");

// -- seating inside the dwell -------------------------------------------------------------------------------------------------
console.log("\nSEATING (rocket 6, JUL; all rockets share the same windows relative to their dwell)");
const names = ["", "stage 2", "stage 3", "upper", "fairing"];
const n6 = 6;
for (const p of [1, 2, 3, 4]) {
  const s = SEAT[p];
  const done = seatAt(n6, p);
  const begin = done - (s.b - s.a);
  const st0 = stationOf(n6, begin);
  const st1 = stationOf(n6, done);
  const moveAtBegin = Math.abs(movesAt(begin + 0.25) - movesAt(begin)) > 1e-4;
  console.log(
    `  ${names[p].padEnd(8)} hall ${s.hall}: eases f${begin}-f${done}, station ${fx(st0, 3)} -> ${fx(st1, 3)}, gap ${fx(gapUnder(n6, p, begin))} -> ${fx(gapUnder(n6, p, done))}${moveAtBegin ? " (begins as the shuttle settles)" : ""}`,
  );
  if (Math.abs(st1 - s.hall) > 1e-6) bad(`${names[p]} seats outside hall ${s.hall}`);
  if (Math.abs(st0 - s.hall) > 0.02) bad(`${names[p]} starts seating far from hall ${s.hall}`);
  if (gapUnder(n6, p, done) > 1e-6) bad(`${names[p]} not seated`);
}

// -- clearance ------------------------------------------------------------------------------------------------------------------
const column = ROCKET_H + SHUTTLE_H + liftOf(N_LAST, 4, 0);
console.log(`\nCLEARANCE: full column ${fx(column)} (rocket ${ROCKET_H} + shuttle ${SHUTTLE_H} + 4 x ${GAP}) under the crane rail at ${OVH}: ${fx(OVH - column)} px of line`);
if (column > OVH - 10) bad("column too close to the crane rail");

// -- camera ----------------------------------------------------------------------------------------------------------------------
console.log(`\nCAMERA (K1 at f81 frame ${fx(K1, 3)})   f  k  dk%  pan px/f(screen)`);
let maxPan = 0;
let maxDk = 0;
for (let f = 0; f < DURATION; f++) {
  const a = camAt(f);
  const b = camAt(f + 1);
  const pan = Math.hypot((b.x - a.x) * b.k, (b.y - a.y) * b.k);
  const dk = (100 * (b.k - a.k)) / a.k;
  maxPan = Math.max(maxPan, pan);
  maxDk = Math.max(maxDk, Math.abs(dk));
  if (f % 4 === 0 || f >= 76) console.log(`  ${String(f).padStart(3)}  ${fx(a.k, 3)}  ${fx(dk, 2).padStart(6)}  ${fx(pan).padStart(5)}`);
}
console.log(`  max pan ${fx(maxPan)} px/f, max |dk| ${fx(maxDk, 2)} %/f`);

// -- composition ----------------------------------------------------------------------------------------------------------------
console.log("\nCOMPOSITION (screen px)");
for (const f of [0, 15, 61, 69, 81, 96]) {
  const c = camAt(f);
  const t = depthTransform(c, 1);
  const roof = t.toScreen(0, RAIL_Y - HALL_EAVES - 40).y;
  const rail = t.toScreen(0, RAIL_Y).y;
  const label = t.toScreen(0, LABEL_Y).y;
  const hallL = t.toScreen(stationX(3) - PITCH / 2, 0).x;
  const hallR = t.toScreen(stationX(1) + PITCH / 2, 0).x;
  const onScreen = MONTHS.map((m, n) => ({ m, x: t.toScreen(rocketX(n, f), 0).x })).filter((r) => r.x > -40 && r.x < 2088 && f >= LABEL_START[MONTHS.indexOf(r.m as (typeof MONTHS)[number])]);
  const rocketPx = ROCKET_H * c.k;
  console.log(
    `  f${String(f).padEnd(3)} k ${fx(c.k, 3)}  roof tips y ${fx(roof, 0)}  rail y ${fx(rail, 0)}  labels y ${fx(label, 0)}  halls x ${fx(hallL, 0)}-${fx(hallR, 0)} (${fx((HALL_EAVES + 40) * c.k, 0)} tall)  rockets ${fx(rocketPx, 0)} px  months in shot: ${onScreen.map((r) => `${r.m}@${fx(r.x, 0)}`).join(" ")}`,
  );
  if (roof < 24) bad(`f${f} roof tips ${fx(roof)} px from the top`);
  if (hallR > 2048 && hallL > 2048) bad(`f${f} halls off screen`);
}
const c15 = depthTransform(camAt(15), 1);
const hl = c15.toScreen(stationX(3) - PITCH / 2, 0).x;
const hr = c15.toScreen(stationX(1) + PITCH / 2, 0).x;
console.log(`  f15 all three halls in frame: ${hl >= 0 && hr <= 2048 ? "yes" : "NO"} (${fx(hl, 0)}-${fx(hr, 0)})`);
if (!(hl >= 0 && hr <= 2048)) bad("halls not all in frame at f15");

console.log(fail ? `\n${fail} FAIL` : "\nALL PASS");
process.exit(fail ? 1 : 0);
