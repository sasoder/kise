// TooDumbToUseIt (rsi-since-writing, cut 29) per-frame checks, in screen px (sway included):
// the camera (log k: one push, no reversal; its speed as a sparkline), the robot's head (inside the keep-in box
// x 65-1015, y 290-1070, never in the caption bands y 1080-1250 / 1360-1460), the sheets and balls against his head
// (no paper over the face on any frame), the stream's screen speed, the bin and the heap (count, where they sit), the
// sheet -> ball hand-over (the WorkSheet's projected corners vs the ball's flat rectangle on the hand-over frame), and a
// pop audit of every ball (largest per-frame jump and change of velocity, by phase).
// Run: bun scripts/clips/rsi-since-writing/check-too-dumb.ts
import { airWorldOf } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";
import {
  BIN,
  D_AIR,
  DEPTH,
  DURATION,
  N_FLY,
  PREFILL,
  RB,
  SUN_T,
  ballsAt,
  camOf,
  contactOf,
  botAt,
  BOT,
  launchOf,
  restOf,
  restingAt,
  sheetEdge,
  sheetPoseAt,
  slotOf,
  uprightOf,
  wadOutline,
} from "../../../generated/components/rsi-since-writing/TooDumbToUseIt";
import { SHEET, officeScene } from "../../../generated/components/rsi-since-writing/sinceWritingWorld";
import { botAnchors } from "../../../generated/components/rsi-ten-earths/tenEarthsBot";

type P2 = [number, number];
const issues: string[] = [];
const log: string[] = [];
const inBand = (y: number) => (y >= 1080 && y <= 1250) || (y >= 1360 && y <= 1460);
const scr = (cam: { k: number; cx: number; cy: number }, p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];

// ---- the camera ----
const cams = Array.from({ length: DURATION }, (_, f) => camOf(f));
const lk = cams.map((c) => Math.log(c.k));
const dk = lk.slice(1).map((v, i) => v - lk[i]);
let rev = 0;
for (let i = 1; i < dk.length; i++) if (dk[i] * dk[i - 1] < -1e-10) rev++;
if (rev) issues.push(`zoom reverses ${rev} times`);
let lobes = 0;
for (let i = 1; i < dk.length - 1; i++) if (dk[i] > dk[i - 1] && dk[i] > dk[i + 1]) lobes++;
log.push(`k ${cams[0].k.toFixed(3)} -> ${cams[DURATION - 1].k.toFixed(3)}; zoom %/f by 6: ${dk.filter((_, i) => i % 6 === 0).map((v) => (v * 100).toFixed(2)).join(" ")}; speed peaks ${lobes}`);

// ---- per frame ----
const botPrev = new Map<string, P2>();
let botJump = { v: 0, at: "" };
let worstHeadTop = 1e9;
let worstHeadBot = 0;
let headX: [number, number] = [1e9, -1e9];
let paperOnFace = 0;
let maxSpeed = 0;
let maxSpeedAt = "";
let heapBottom = 0;
let heapX: [number, number] = [1e9, -1e9];
let domeTop = 1e9;
const prev = new Map<string, P2>();
const prevV = new Map<string, P2>();
let maxJump = { v: 0, at: "" };
let maxAcc = { v: 0, at: "" };
for (let f = 0; f < DURATION; f++) {
  const cam = cams[f];
  const A = airWorldOf({ cam, rest: cams[0], depth: DEPTH, frame: f, scene: officeScene(SUN_T) });
  const ga = A.P.at(BOT.X, BOT.Z);
  const an = botAnchors(0, botAt(f), ga.at, ga.scale);
  const hc = scr(cam, an.headC as P2);
  const hr = (an.headR as number) * cam.k;
  const top = scr(cam, an.headTop as P2);
  worstHeadTop = Math.min(worstHeadTop, top[1]);
  // the robot's pop audit: its head, screen and mittens, per-frame screen jump (camera motion included)
  for (const nm of ["headC", "screen", "handL", "handR", "hip"] as const) {
    const v = (an as unknown as Record<string, P2>)[nm];
    if (!v) continue;
    const pt = scr(cam, v);
    const k0 = `bot-${nm}`;
    const q0 = botPrev.get(k0);
    if (q0) {
      const j = Math.hypot(pt[0] - q0[0], pt[1] - q0[1]);
      if (j > botJump.v) botJump = { v: j, at: `f${f} ${nm}` };
    }
    botPrev.set(k0, pt);
  }
  worstHeadBot = Math.max(worstHeadBot, hc[1] + hr);
  headX = [Math.min(headX[0], hc[0] - hr), Math.max(headX[1], hc[0] + hr)];
  if (top[1] < 290 || hc[1] + hr > 1070 || hc[0] - hr < 65 || hc[0] + hr > 1015) issues.push(`f${f} head outside the keep-in box (${hc.map((v) => v.toFixed(0))}, r ${hr.toFixed(0)})`);
  if (inBand(hc[1] - hr) || inBand(hc[1] + hr)) issues.push(`f${f} head in a caption band`);
  for (const b of ballsAt(f)) {
    const c = scr(cam, A.P.p(b.X, b.Y, b.Z));
    const r = A.P.r(b.Z) * cam.k * (b.sheet || b.crumple < 0.5 ? Math.hypot(SHEET.w, SHEET.l) / 2 : RB * 1.25);
    if (Math.hypot(c[0] - hc[0], c[1] - hc[1]) < hr + r) paperOnFace++;
    const p0 = prev.get(b.key);
    if (p0) {
      const v: P2 = [c[0] - p0[0], c[1] - p0[1]];
      const sp = Math.hypot(v[0], v[1]);
      if (sp > maxSpeed && !b.sheet) {
        maxSpeed = sp;
        maxSpeedAt = `f${f} ${b.key}`;
      }
      const v0 = prevV.get(b.key);
      // the camera moves everything a little: judge jumps against the camera's own motion at that point
      if (sp > maxJump.v) maxJump = { v: sp, at: `f${f} ${b.key}` };
      if (v0) {
        const acc = Math.hypot(v[0] - v0[0], v[1] - v0[1]);
        if (acc > maxAcc.v) maxAcc = { v: acc, at: `f${f} ${b.key}` };
      }
      prevV.set(b.key, v);
    }
    prev.set(b.key, c);
    // the heap at rest
    if (!b.inside && b.phase === "rest" && b.Y > -RB - 60) {
      heapBottom = Math.max(heapBottom, c[1] + RB * A.P.r(b.Z) * cam.k);
      heapX = [Math.min(heapX[0], c[0]), Math.max(heapX[1], c[0])];
    }
    if (b.inside) domeTop = Math.min(domeTop, c[1] - RB * A.P.r(b.Z) * cam.k);
  }
}
if (paperOnFace) issues.push(`paper over the robot's face on ${paperOnFace} ball-frames`);
log.push(`robot pop audit: largest per-frame jump of head/screen/mittens/hip ${botJump.v.toFixed(1)} px (${botJump.at})`);
if (botJump.v > 25) issues.push(`robot jump ${botJump.v.toFixed(1)} px at ${botJump.at}`);
log.push(`head: top >= ${worstHeadTop.toFixed(0)}, bottom <= ${worstHeadBot.toFixed(0)}, x ${headX.map((v) => v.toFixed(0)).join("..")}`);
log.push(`paper screen speed max ${maxSpeed.toFixed(1)} px/f (${maxSpeedAt}); largest jump ${maxJump.v.toFixed(1)} (${maxJump.at}); largest change of velocity ${maxAcc.v.toFixed(1)} px/f (${maxAcc.at})`);
log.push(`heap: balls x ${heapX.map((v) => v.toFixed(0)).join("..")}, foot y <= ${heapBottom.toFixed(0)}; the bin's contents top y >= ${domeTop.toFixed(0)}`);
if (heapX[0] < 65 || heapX[1] > 1015) issues.push(`heap outside x 65-1015`);

// ---- the count ----
const counts = [0, 20, 31, 50, 70, 82].map((f) => `f${f} ${restingAt(f) - PREFILL}`);
log.push(`heap balls (on the floor) at ${counts.join(", ")}; flyers ${N_FLY}; launches every ${(launchOf(1) - launchOf(0)).toFixed(1)} f`);
for (let i = 0; i < N_FLY; i++) if (restOf(i) < contactOf(i) || contactOf(i) - launchOf(i) !== D_AIR) issues.push(`ball ${i} timing`);
const inBinCount = Array.from({ length: N_FLY }, (_, i) => slotOf(i).inBin).filter(Boolean).length;
log.push(`flyers into the bin (the dome) ${inBinCount}; the first heap ball rests on f${restOf(inBinCount).toFixed(1)}`);

// ---- the hand-over: the last sheet pose vs the ball's crumple-0 outline (and the pose's continuity into it) ----
{
  const f = 40;
  const cam = cams[f];
  const A = airWorldOf({ cam, rest: cams[0], depth: DEPTH, frame: f, scene: officeScene(SUN_T) });
  let worst = 0;
  let poseJump = 0;
  for (let i = 0; i < N_FLY; i++) {
    const UP = uprightOf(i);
    const q = sheetPoseAt(i, UP);
    const b = ballsAt(launchOf(i) + UP * D_AIR).find((x) => x.key === `f${i}`)!;
    const w = wadOutline(A.P, { ...b, crumple: 0 });
    const se = sheetEdge(q).map((p) => A.P.p(p[0], p[1], p[2]));
    se.forEach((p, k) => (worst = Math.max(worst, Math.hypot(p[0] - w.pts[k][0], p[1] - w.pts[k][1]) * cam.k)));
    // the sheet's pose one sub-frame before the hand-over: no jump in its turn
    const q0 = sheetPoseAt(i, UP - 0.2 / D_AIR);
    poseJump = Math.max(poseJump, Math.abs(q.pitch - q0.pitch), Math.abs(q.roll - q0.roll), Math.abs(q.yaw - q0.yaw));
  }
  log.push(`hand-over: sheet outline vs the ball's crumple-0 outline, worst ${worst.toFixed(3)} px; pose change over 0.2 f before it ${poseJump.toFixed(1)} deg`);
  if (worst > 0.5) issues.push(`hand-over mismatch ${worst.toFixed(2)} px`);
}
log.push(`bin at X ${BIN.X}, Z ${BIN.Z}`);

console.log(log.join("\n"));
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 40).join("\n")}` : "OK: no issues");
