// CoffeeHundredWorkdays (rsi-since-writing, cut 2) per-frame checks, in screen px (sway included):
// the camera (log k and cx: one move, no reversal), the count (100 landings, the 100th on f68 "done", none after), the
// faces (you and the robot: inside the keep-in box x 65-1015, y 290-1070, never in the caption bands y 1080-1250 /
// 1360-1460), the tag (the card's four corners inside the box and above y 1070, clear of both faces), the landing point
// (x in the box, y 290-1440: the stack is context and may sit in the bands), you (the figure and the chair at x >= 65
// on every frame), the flyers against both faces and the robot's mittens, and the pop audit: the robot's mittens on its
// keys (units), the mug riding the hand (the grip on the handle while held), the mug's speed (units / frame), the mug on
// the desk from "coffee" (f105) on.
// Run: bun scripts/clips/rsi-since-writing/check-coffee-hundred.ts
import { airWorldOf } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";
import { AI, DEPTH, DURATION, flightOf, LAND, MUG_DOWN, PAD, SIP, STACK, SUN_T, TAG, TOTAL, YOU, camOf, countAt, flightAt, tagAt, tagPin, youAt } from "../../../generated/components/rsi-since-writing/CoffeeHundredWorkdays";
import { BOT_DESK, BOT_POSES, botAnchors } from "../../../generated/components/rsi-ten-earths/tenEarthsBot";
import { HUMAN_DESK, buildHuman, humanAnchors } from "../../../generated/components/rsi-since-writing/sinceWritingFolk";
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
let rev = 0;
for (let i = 1; i < dk.length; i++) if (dk[i] * dk[i - 1] < -1e-10 && Math.abs(dk[i]) > 1e-5 && Math.abs(dk[i - 1]) > 1e-5) rev++;
if (rev) issues.push(`zoom reverses ${rev} times`);
log.push(`k ${cams[0].k.toFixed(3)} -> ${cams[DURATION - 1].k.toFixed(3)}; zoom %/f by 8: ${dk.filter((_, i) => i % 8 === 0).map((v) => (v * 100).toFixed(2)).join(" ")}`);

// ---- the count ----
if (LAND.length !== TOTAL) issues.push(`LAND has ${LAND.length}`);
if (countAt(67.999) !== 99 || countAt(68) !== 100 || countAt(DURATION) !== 100) issues.push(`count at f67.999 ${countAt(67.999)}, f68 ${countAt(68)}, end ${countAt(DURATION)}`);
for (let i = 1; i < LAND.length; i++) if (LAND[i] < LAND[i - 1]) issues.push(`landing ${i + 1} before ${i}`);
const perFrame = Array.from({ length: DURATION }, (_, f) => countAt(f) - (f ? countAt(f - 1) : 0));
log.push(`landings per frame by 3: ${perFrame.filter((_, i) => i % 3 === 0).join(" ")}; count f46 ${countAt(46)}, f53 ${countAt(53)}, f60 ${countAt(60)}`);
log.push(`last landings ${LAND.slice(-6).map((v) => v.toFixed(1)).join(", ")}`);

// ---- per frame ----
const scr = (cam: { k: number; cx: number; cy: number }, p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
const boxHitsCircle = (b: { x0: number; x1: number; y0: number; y1: number }, c: P2, r: number) => {
  const dx = Math.max(b.x0 - c[0], 0, c[0] - b.x1);
  const dy = Math.max(b.y0 - c[1], 0, c[1] - b.y1);
  return Math.hypot(dx, dy) < r;
};
const rotP = (p: P2, deg: number): P2 => {
  const a = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};
let worstFaceY = 0;
let flyHits = 0;
let maxFly = 0;
let maxAt = "";
let lastC = new Map<number, P2>();
let minLeft = 1e9;
let keyGap = 0;
let gripGap = 0;
let gripMin = 1e9;
let mugV = 0;
let mugVAt = "";
let prevMug: P2 | null = null;
let tagLog = "";
const keys = BOT_DESK.keys.map((k) => [-k[0], k[1]] as P2); // facing left: the near mitten (keys[0]) is handR
for (let f = 0; f < DURATION; f++) {
  const nextC = new Map<number, P2>();
  const cam = cams[f];
  const A = airWorldOf({ cam, rest: cams[0], depth: DEPTH, frame: f, scene: officeScene(SUN_T) });
  const ya = A.P.at(YOU.X, YOU.Z);
  const you = youAt(f);
  const yan = humanAnchors(0, you.pose, ya.at, ya.scale);
  const ga = A.P.at(AI.X, AI.Z);
  const bPose = BOT_POSES.typeAtDesk(-1, f);
  const gan = botAnchors(0, bPose, ga.at, ga.scale);
  const ganU = botAnchors(0, bPose, [0, 0], 1);
  keyGap = Math.max(keyGap, Math.hypot(ganU.handR[0] - keys[0][0], ganU.handR[1] - keys[0][1]), Math.hypot(ganU.handL[0] - keys[1][0], ganU.handL[1] - keys[1][1]));
  // the mug: rides the hand while held, its speed, on the desk from MUG_DOWN
  const yu = humanAnchors(0, you.pose, [0, 0], 1);
  const m = you.mug;
  if (SIP.hold(f) > 0.999) {
    // the handle grip (as youAt places it) vs the solved hand
    const a = (m.tilt * Math.PI) / 180;
    const hx = -(9.5 * 1.45 + 7 * 1.45 * 0.75);
    const hy = -21 * 1.45 * 0.55;
    const h: P2 = [m.base[0] + hx * Math.cos(a) - hy * Math.sin(a), m.base[1] + hx * Math.sin(a) + hy * Math.cos(a)];
    const g = Math.hypot(yu.handL[0] - h[0], yu.handL[1] - h[1]);
    gripGap = Math.max(gripGap, g);
    gripMin = Math.min(gripMin, g);
  }
  if (prevMug) {
    const v = Math.hypot(m.base[0] - prevMug[0], m.base[1] - prevMug[1]);
    if (v > mugV) {
      mugV = v;
      mugVAt = `f${f}`;
    }
  }
  prevMug = m.base;
  if (f >= MUG_DOWN && (Math.abs(m.base[1] - HUMAN_DESK.mug[1]) > 0.3 || Math.abs(m.tilt) > 0.3)) issues.push(`f${f} the mug is not down on the desk (${m.base.map((v) => v.toFixed(1))}, tilt ${m.tilt.toFixed(1)})`);
  if (f === MUG_DOWN - 1 && Math.abs(m.base[1] - HUMAN_DESK.mug[1]) < 0.3) issues.push(`the mug is down before f${MUG_DOWN}`);
  if (f >= 96 && m.level > 0.001) issues.push(`f${f} coffee left (${m.level.toFixed(3)})`);
  const faces: { who: string; c: P2; r: number }[] = [
    { who: "you", c: scr(cam, yan.headC), r: (yan.headR as unknown as number) * cam.k },
    { who: "robot", c: scr(cam, gan.headC), r: (gan.headR as unknown as number) * cam.k },
  ];
  for (const fc of faces) {
    if (!onScreen(fc.c)) issues.push(`f${f} ${fc.who}'s face off screen`);
    const yb = fc.c[1] + fc.r;
    worstFaceY = Math.max(worstFaceY, yb);
    if (inBand(fc.c[1] - fc.r) || inBand(yb)) issues.push(`f${f} ${fc.who}'s face in a caption band`);
    if (fc.c[0] - fc.r < 65 || fc.c[0] + fc.r > 1015 || fc.c[1] - fc.r < 290 || yb > 1070) issues.push(`f${f} ${fc.who}'s face out of the box`);
  }
  // your leftmost point: the figure's paths (every coordinate, control points too) and the chair (caster, base bar, back)
  const nums = buildHuman(0, you.pose, { frame: f }).shapes.flatMap((sh) => (sh.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number));
  let fx = 1e9;
  for (let j = 0; j + 1 < nums.length; j += 2) fx = Math.min(fx, nums[j]);
  const figL = scr(cam, [ya.at[0] + (fx / FU) * ya.scale, ya.at[1]])[0];
  const sxc = YOU.X - 2;
  const chairL = Math.min(scr(cam, A.P.p(sxc - 54, -5, YOU.Z))[0], scr(cam, A.P.p(sxc - 50, -12, YOU.Z - 4))[0], scr(cam, A.P.p(YOU.X - 38, -170, YOU.Z - 30))[0]);
  const left = Math.min(figL, chairL);
  minLeft = Math.min(minLeft, left);
  if (left < 65) issues.push(`f${f} you cut at the left (x ${left.toFixed(0)})`);
  // the robot's right side (its chair back) inside the frame
  const botR = scr(cam, A.P.p(AI.X + 38, -170, AI.Z - 30))[0];
  if (botR > 1015) issues.push(`f${f} the robot's chair past x 1015 (${botR.toFixed(0)})`);
  // the tag (when on): the card's corners, rotated about the clip, in screen px
  const st = tagAt(f);
  if (st.on > 0) {
    const pin = tagPin();
    const pc = scr(cam, A.P.p(pin.X, pin.Y, TAG.Z));
    const s = A.P.r(TAG.Z) * cam.k;
    const y0 = TAG.drop - st.lift;
    const cs = [
      [-TAG.W / 2, y0],
      [TAG.W / 2, y0],
      [TAG.W / 2, y0 + TAG.H],
      [-TAG.W / 2, y0 + TAG.H],
    ].map((p) => rotP(p as P2, st.ang)).map((p) => [pc[0] + p[0] * s, pc[1] + p[1] * s] as P2);
    const b = { x0: Math.min(...cs.map((c) => c[0])), x1: Math.max(...cs.map((c) => c[0])), y0: Math.min(...cs.map((c) => c[1])), y1: Math.max(...cs.map((c) => c[1])) };
    if (b.x0 < 65 || b.x1 > 1015 || b.y0 < 290 || b.y1 > 1070) issues.push(`f${f} tag out of the box (${b.x0.toFixed(0)}-${b.x1.toFixed(0)}, ${b.y0.toFixed(0)}-${b.y1.toFixed(0)})`);
    for (const fc of faces) if (boxHitsCircle({ x0: b.x0 - 10, x1: b.x1 + 10, y0: b.y0 - 10, y1: b.y1 + 10 }, fc.c, fc.r)) issues.push(`f${f} tag over ${fc.who}'s face`);
    if (f === DURATION - 1) tagLog = `tag at f116: x ${b.x0.toFixed(0)}-${b.x1.toFixed(0)}, y ${b.y0.toFixed(0)}-${b.y1.toFixed(0)}; "100" cap ${(0.66 * TAG.numSize * s).toFixed(0)} px, WORKDAYS cap ${(0.66 * TAG.labSize * s).toFixed(0)} px`;
  }
  // the landing point while sheets are landing
  const landing = LAND.some((l, i) => l > f && l - flightOf(i) <= f);
  if (landing) {
    const top = stackTop(STACK.X, STACK.Z, countAt(f) + 1, 0, STACK.yaw, STACK.seed);
    const p = scr(cam, A.P.p(top.X, top.Y, top.Z));
    if (p[1] > 1440 || p[1] < 290 || p[0] < 65 || p[0] > 1015) issues.push(`f${f} landing point out of the box (${p[0].toFixed(0)}, ${p[1].toFixed(0)})`);
  }
  // the flyers against the faces and the mittens (a sheet's projected centre within its half-size of the part)
  const padTop = stackTop(PAD.X, PAD.Z, PAD.n + 1, PAD.Y, PAD.yaw, PAD.seed);
  const hands = [scr(cam, gan.handL), scr(cam, gan.handR)];
  for (let i = 0; i < TOTAL; i++) {
    const land = LAND[i];
    const D = flightOf(i);
    if (f < land - D || f >= land) continue;
    const q = flightAt(padTop, stackTop(STACK.X, STACK.Z, i + 1, 0, STACK.yaw, STACK.seed), (f - (land - D)) / D, i + 1);
    const c = scr(cam, A.P.p(q.X, q.Y, q.Z));
    const prevC = lastC.get(i);
    if (prevC) {
      const v = Math.hypot(c[0] - prevC[0], c[1] - prevC[1]);
      if (v > maxFly) {
        maxFly = v;
        maxAt = `f${f} sheet ${i + 1}`;
      }
    }
    nextC.set(i, c);
    const half = (SHEET.l / 2) * A.P.r(q.Z) * cam.k;
    for (const fc of faces)
      if (Math.hypot(c[0] - fc.c[0], c[1] - fc.c[1]) < fc.r + half * 0.8) {
        flyHits++;
        issues.push(`f${f} sheet ${i + 1} over ${fc.who}'s face`);
      }
    for (const h of hands)
      if (Math.hypot(c[0] - h[0], c[1] - h[1]) < half * 0.9) {
        flyHits++;
        issues.push(`f${f} sheet ${i + 1} over the robot's mitten`);
      }
  }
  lastC = nextC;
}
log.push(`fastest sheet in flight ${maxFly.toFixed(1)} px/frame (${maxAt}); flyer hits ${flyHits}`);
log.push(`lowest face edge y ${worstFaceY.toFixed(0)}; your leftmost x ${minLeft.toFixed(0)}`);
log.push(`robot mittens off the keys max ${keyGap.toFixed(1)} units; your hand to the handle grip (held) ${gripMin.toFixed(1)}-${gripGap.toFixed(1)} units (the anchor's fixed offset; the spread is the slip); mug fastest ${mugV.toFixed(1)} units/f (${mugVAt})`);
if (tagLog) log.push(tagLog);
if (keyGap > 5.5) issues.push(`robot mittens ${keyGap.toFixed(1)} units off the keys`);
if (gripGap - gripMin > 1) issues.push(`your hand slips ${(gripGap - gripMin).toFixed(1)} units on the mug's handle`);
if (mugV > 18) issues.push(`mug moves ${mugV.toFixed(1)} units in one frame`);
console.log(log.join("\n"));
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 60).join("\n")}` : "OK: no issues");
