// CoffeeHundredWorkdays (rsi-since-writing, cut 2) per-frame checks, in screen px (sway included):
// the camera (log k and cx: one move, no reversal, no stall inside the move), the count (100 landings, the 100th on
// f100, none after), the faces (both heads: inside the keep-in box x 65-1015, y 290-1070 when on screen, never in the
// caption bands y 1080-1250 / 1360-1460), the plate (its type inside the box and above y 1070; type and soft plate
// clear of both faces and above the stack's top), the landing point (x in the box, y 290-1440: the stack is context and
// may sit in the bands), you (the figure and the chair at x >= 65 on every frame from the first frame he is fully in),
// the flyers against both heads, the Genius's hands and the plate (no sheet over a face, the typing hands or the plate's
// type on any frame).
// Run: bun scripts/clips/rsi-since-writing/check-coffee-hundred.ts
import { airWorldOf } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";
import { AI, DEPTH, DURATION, flightOf, LAND, PAD, PLATE, STACK, SUN_T, TOTAL, YOU, camOf, countAt, flightAt, youAt } from "../../../generated/components/rsi-since-writing/CoffeeHundredWorkdays";
import { GENIUS_POSES, geniusAnchors } from "../../../generated/components/rsi-ten-earths/tenEarthsGenius";
import { buildHuman, humanAnchors } from "../../../generated/components/rsi-since-writing/sinceWritingFolk";
import { FU } from "../../../generated/components/kyle-covid/covidFolkBody";
import { SHEET, officeScene, stackTop } from "../../../generated/components/rsi-since-writing/sinceWritingWorld";

type P2 = [number, number];
const issues: string[] = [];
const log: string[] = [];
const inBand = (y: number) => (y >= 1080 && y <= 1250) || (y >= 1360 && y <= 1460);
const onScreen = (p: P2) => p[0] > -40 && p[0] < 1120 && p[1] > -40 && p[1] < 1960;

// ---- the camera ----
const cams = Array.from({ length: DURATION }, (_, f) => camOf(f));
const lk = cams.map((c) => Math.log(c.k));
const dk = lk.slice(1).map((v, i) => v - lk[i]);
const dx = cams.slice(1).map((c, i) => c.cx - cams[i].cx);
let rev = 0;
for (let i = 1; i < dk.length; i++) if (dk[i] > 1e-5 && dk[i - 1] < -1e-5) rev++;
if (rev) issues.push(`zoom reverses ${rev} times`);
log.push(`k ${cams[0].k.toFixed(3)} -> ${cams[DURATION - 1].k.toFixed(3)}; dlnk/f min ${Math.min(...dk).toFixed(4)} max ${Math.max(...dk).toFixed(4)}`);
// the pan's speed (screen px / frame, without the sway) as a sparkline
const pan = dx.map((v, i) => Math.abs(v) * cams[i].k);
log.push(`pan px/f by 4: ${pan.filter((_, i) => i % 4 === 0).map((v) => v.toFixed(1)).join(" ")}`);
const zoomPct = dk.map((v) => -v * 100);
log.push(`zoom-out %/f by 4: ${zoomPct.filter((_, i) => i % 4 === 0).map((v) => v.toFixed(2)).join(" ")}`);

// ---- the count ----
if (LAND.length !== TOTAL) issues.push(`LAND has ${LAND.length}`);
if (countAt(99.999) !== 99 || countAt(100) !== 100 || countAt(DURATION) !== 100) issues.push(`count at f99 ${countAt(99)}, f100 ${countAt(100)}, end ${countAt(DURATION)}`);
for (let i = 1; i < LAND.length; i++) if (LAND[i] < LAND[i - 1]) issues.push(`landing ${i + 1} before ${i}`);
const perFrame = Array.from({ length: DURATION }, (_, f) => countAt(f) - (f ? countAt(f - 1) : 0));
log.push(`landings per frame by 4: ${perFrame.filter((_, i) => i % 4 === 0).join(" ")}; count f46 ${countAt(46)}, f68 ${countAt(68)}, f80 ${countAt(80)}`);
log.push(`last landings ${LAND.slice(-6).map((v) => v.toFixed(1)).join(", ")}`);

// ---- per frame ----
const scr = (cam: { k: number; cx: number; cy: number }, p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
let worstFaceY = 0;
let worstPlateY = 0;
let flyHits = 0;
let maxFly = 0;
let maxAt = "";
let lastC = new Map<number, P2>();
let fullyIn = -1;
let minLeft = 1e9;
let lastLeft = 0;
const boxHitsCircle = (b: { x0: number; x1: number; y0: number; y1: number }, c: P2, r: number) => {
  const dx = Math.max(b.x0 - c[0], 0, c[0] - b.x1);
  const dy = Math.max(b.y0 - c[1], 0, c[1] - b.y1);
  return Math.hypot(dx, dy) < r;
};
for (let f = 0; f < DURATION; f++) {
  const nextC = new Map<number, P2>();
  const cam = cams[f];
  const A = airWorldOf({ cam, rest: cams[0], depth: DEPTH, frame: f, scene: officeScene(SUN_T) });
  const ya = A.P.at(YOU.X, YOU.Z);
  const you = youAt(f);
  const yan = humanAnchors(0, you.pose, ya.at, ya.scale);
  // your leftmost point: the figure's paths (every coordinate, control points too) and the chair (caster, base bar, back)
  const nums = buildHuman(0, you.pose, { frame: f }).shapes.flatMap((sh) => (sh.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number));
  let fx = 1e9;
  for (let j = 0; j + 1 < nums.length; j += 2) fx = Math.min(fx, nums[j]);
  const figL = scr(cam, [ya.at[0] + (fx / FU) * ya.scale, ya.at[1]])[0];
  const sxc = YOU.X - 2;
  const chairL = Math.min(scr(cam, A.P.p(sxc - 54, -5, YOU.Z))[0], scr(cam, A.P.p(sxc - 50, -12, YOU.Z - 4))[0], scr(cam, A.P.p(YOU.X - 38, -170, YOU.Z - 30))[0]);
  const left = Math.min(figL, chairL);
  if (fullyIn < 0 && left >= 65) fullyIn = f;
  lastLeft = left;
  if (fullyIn >= 0) {
    minLeft = Math.min(minLeft, left);
    if (left < 65) issues.push(`f${f} you cut at the left (x ${left.toFixed(0)}; figure ${figL.toFixed(0)}, chair ${chairL.toFixed(0)})`);
  }
  const ga = A.P.at(AI.X, AI.Z);
  const gan = geniusAnchors(0, GENIUS_POSES.typeAtDesk(-1, f), ga.at, ga.scale);
  const faces: { who: string; c: P2; r: number }[] = [
    { who: "you", c: scr(cam, yan.headC), r: (yan.headR as unknown as number) * cam.k },
    { who: "AI", c: scr(cam, gan.headC), r: (gan.headR as unknown as number) * cam.k },
  ];
  for (const fc of faces) {
    if (!onScreen(fc.c)) continue;
    const yb = fc.c[1] + fc.r;
    worstFaceY = Math.max(worstFaceY, yb);
    if (inBand(fc.c[1] - fc.r) || inBand(yb)) issues.push(`f${f} ${fc.who}'s face in a caption band`);
    if (fc.c[0] > 65 && fc.c[0] < 1015 && (fc.c[1] - fc.r < 290 || yb > 1070)) issues.push(`f${f} ${fc.who}'s face out of the box vertically (${(fc.c[1] - fc.r).toFixed(0)}-${yb.toFixed(0)})`);
  }
  // the plate (when visible): Caslon caps measured on the render (WORKDAYS 6.44 em + the letter spacing, cap 0.66 em),
  // figures 0.62 em; the soft plate's visible core = 0.6 of YearPlate's ellipse
  let plateBox: { x0: number; x1: number; y0: number; y1: number } | null = null;
  if (f > PLATE.f0) {
    const r = A.P.r(PLATE.Z);
    const num = scr(cam, A.P.p(PLATE.X, PLATE.numY, PLATE.Z));
    const lab = scr(cam, A.P.p(PLATE.X, PLATE.labY, PLATE.Z));
    const sN = PLATE.numSize * r * cam.k;
    const sL = PLATE.labSize * r * cam.k;
    const n = countAt(f);
    const wN = String(n).length * 0.62 * sN;
    const wL = (6.44 + 8 * PLATE.labSpacing) * sL;
    const box = { x0: Math.min(num[0] - wN / 2, lab[0] - wL / 2), x1: Math.max(num[0] + wN / 2, lab[0] + wL / 2), y0: num[1] - 0.36 * sN, y1: lab[1] + 0.36 * sL };
    plateBox = box;
    worstPlateY = Math.max(worstPlateY, box.y1);
    if (f === 116) log.push(`plate at f116: type x ${box.x0.toFixed(0)}-${box.x1.toFixed(0)}, y ${box.y0.toFixed(0)}-${box.y1.toFixed(0)}; WORKDAYS cap ${(0.66 * sL).toFixed(0)} px, numeral cap ${(0.66 * sN).toFixed(0)} px`);
    if (box.y1 > 1070 || box.y0 < 290 || box.x0 < 65 || box.x1 > 1015) issues.push(`f${f} plate type out of the box (${box.x0.toFixed(0)}-${box.x1.toFixed(0)}, ${box.y0.toFixed(0)}-${box.y1.toFixed(0)})`);
    const core = { x0: lab[0] - 0.6 * (0.52 * 8 * sL * 0.72 + 0.75 * sL), x1: lab[0] + 0.6 * (0.52 * 8 * sL * 0.72 + 0.75 * sL), y0: box.y0, y1: lab[1] + 0.6 * 0.92 * sL };
    for (const fc of faces) {
      if (!onScreen(fc.c)) continue;
      if (boxHitsCircle({ x0: box.x0 - 12, x1: box.x1 + 12, y0: box.y0 - 12, y1: box.y1 + 12 }, fc.c, fc.r)) issues.push(`f${f} plate type over ${fc.who}'s face`);
      if (boxHitsCircle(core, fc.c, fc.r)) issues.push(`f${f} soft plate over ${fc.who}'s face`);
    }
    const st = stackTop(STACK.X, STACK.Z, Math.max(1, countAt(f)), 0, STACK.yaw, STACK.seed);
    const sy = scr(cam, A.P.p(st.X, st.Y, st.Z))[1];
    if (core.y1 > sy - 4) issues.push(`f${f} plate over the stack (plate bottom ${core.y1.toFixed(0)}, stack top ${sy.toFixed(0)})`);
  }
  // the landing point while sheets are landing
  const landing = LAND.some((l, i) => l > f && l - flightOf(i) <= f);
  if (landing) {
    const top = stackTop(STACK.X, STACK.Z, countAt(f) + 1, 0, STACK.yaw, STACK.seed);
    const p = scr(cam, A.P.p(top.X, top.Y, top.Z));
    if (p[1] > 1440 || p[1] < 290 || p[0] < 65 || p[0] > 1015) issues.push(`f${f} landing point out of the box (${p[0].toFixed(0)}, ${p[1].toFixed(0)})`);
  }
  // the flyers against the faces and the typing hands (a sheet's projected centre within its half-size of the part)
  const padTop = stackTop(PAD.X, PAD.Z, PAD.n + 1, PAD.Y, PAD.yaw, PAD.seed);
  const hands = [scr(cam, gan.handL), scr(cam, gan.handR)];
  for (let i = 0; i < TOTAL; i++) {
    const land = LAND[i];
    const D = flightOf(i);
    if (f < land - D || f >= land) continue;
    const q = flightAt(padTop, stackTop(STACK.X, STACK.Z, i + 1, 0, STACK.yaw, STACK.seed), (f - (land - D)) / D, i + 1);
    const c = scr(cam, A.P.p(q.X, q.Y, q.Z));
    const prevC = lastC.get(i);
    if (prevC) { const v = Math.hypot(c[0] - prevC[0], c[1] - prevC[1]); if (v > maxFly) { maxFly = v; maxAt = `f${f} sheet ${i + 1} tau ${((f - (land - D)) / D).toFixed(2)}`; } }
    nextC.set(i, c);
    const half = (SHEET.l / 2) * A.P.r(q.Z) * cam.k;
    for (const fc of faces) if (Math.hypot(c[0] - fc.c[0], c[1] - fc.c[1]) < fc.r + half * 0.8) {
      flyHits++;
      issues.push(`f${f} sheet ${i + 1} over ${fc.who}'s face`);
    }
    for (const h of hands) if (Math.hypot(c[0] - h[0], c[1] - h[1]) < half * 0.9) {
      flyHits++;
      issues.push(`f${f} sheet ${i + 1} over the Genius's hand`);
    }
    if (plateBox && boxHitsCircle(plateBox, c, half * 0.6)) {
      flyHits++;
      issues.push(`f${f} sheet ${i + 1} over the plate's type`);
    }
  }
  lastC = nextC;
}
log.push(`fastest sheet in flight ${maxFly.toFixed(1)} px/frame (${maxAt})`);
log.push(`lowest face edge on screen y ${worstFaceY.toFixed(0)}; lowest plate type y ${worstPlateY.toFixed(0)}; flyer hits ${flyHits}`);
log.push(`you fully in from f${fullyIn}; leftmost x after that ${minLeft.toFixed(0)}; at f116 ${lastLeft.toFixed(0)}`);
console.log(log.join("\n"));
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 60).join("\n")}` : "OK: no issues");
