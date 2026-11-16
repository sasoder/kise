// MorningToEvening (rsi-since-writing, cut 109) per-frame checks, in screen px (sway included):
// the camera (one push: log k never falls, the pan never reverses), the faces (both heads inside the keep-in box
// x 65-1015, y 290-1070, never in the caption bands), the spine labels (every shelved and flying binder's label inside
// the box, x <= 955 below y 900; none over the robot's head or antenna), you (feet planted: toes and heels still; the figure at x >= 65), the hand-over (the
// sheet rides your hand to RELEASE; the robot's near mitten touches the sheet on LANDED), the robot at work (its mittens
// move on every frame: no still stretch over 4 frames), the joints' frame-to-frame jumps (pops), the binders (each
// hidden behind the pedestal on its launch frame; no binder box intersects another binder, the case's uprights and
// boards, or the pedestal on any frame).
// Run: bun scripts/clips/rsi-since-writing/check-morning-to-evening.ts
import { airWorldOf } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";
import { BOT, BIN, CASE, DEPTH, DURATION, LAND, LANDED, PED, RELEASE, ROWS, SHEET_DESK, YOU, binderAt, botAt, camOf, flightOf, sheetAt, sunAt, youAt } from "../../../generated/components/rsi-since-writing/MorningToEvening";
import { botAnchors } from "../../../generated/components/rsi-ten-earths/tenEarthsBot";
import { humanAnchors } from "../../../generated/components/rsi-since-writing/sinceWritingFolk";
import { officeScene } from "../../../generated/components/rsi-since-writing/sinceWritingWorld";

type P2 = [number, number];
const issues: string[] = [];
const log: string[] = [];
const inBand = (y: number) => (y >= 1080 && y <= 1250) || (y >= 1360 && y <= 1460);
const inBox = (p: P2) => p[0] >= 65 && p[0] <= 1015 && p[1] >= 290 && p[1] <= 1070;

// ---- the camera ----
const cams = Array.from({ length: DURATION }, (_, f) => camOf(f));
const lk = cams.map((c) => Math.log(c.k));
const dk = lk.slice(1).map((v, i) => v - lk[i]);
if (dk.some((v) => v < -1e-6)) issues.push("the push reverses (k falls)");
const dx = cams.slice(1).map((c, i) => c.cx - cams[i].cx);
log.push(`k ${cams[0].k.toFixed(3)} -> ${cams[DURATION - 1].k.toFixed(3)}; zoom %/f by 6: ${dk.filter((_, i) => i % 6 === 0).map((v) => (v * 100).toFixed(2)).join(" ")}`);
log.push(`pan px/f by 6 (incl. sway): ${dx.filter((_, i) => i % 6 === 0).map((v, i) => (v * cams[i * 6].k).toFixed(1)).join(" ")}`);

const worldsOf = (f: number) => {
  const cam = cams[f];
  const A = airWorldOf({ cam, rest: cams[0], depth: DEPTH, frame: f, scene: officeScene(sunAt(f)) });
  const scr = (p: P2): P2 => [(p[0] - cam.cx) * cam.k + 540, (p[1] - cam.cy) * cam.k + 960];
  return { A, scr };
};

let prevY: Record<string, P2> | null = null;
let prevG: Record<string, P2> | null = null;
const popY: Record<string, number> = {};
const popG: Record<string, number> = {};
let still = 0;
let stillMax = 0;
let feetMax = 0;
let gripMax = 0;
let youMinX = 9999;
let labMaxX = 0;
let botGap = 1e9;
const binPrev = new Map<number, P2>();
const binPeak: number[] = [];
let binFast = 0;
let binFastAt = "";
const KEYS = ["headC", "handL", "handR", "toeL", "toeR", "heelL", "heelR", "kneeL", "kneeR"];
for (let f = 0; f < DURATION; f++) {
  const { A, scr } = worldsOf(f);
  // you
  const ya = A.P.at(YOU.X, YOU.Z);
  const yp = youAt(f).pose;
  const ay = humanAnchors(0, yp, ya.at, ya.scale) as unknown as Record<string, P2 | number>;
  const yu = humanAnchors(0, yp, [0, 0], 1) as unknown as Record<string, P2>;
  const yHead = scr(ay.headC as P2);
  const yR = (ay.headR as number) * cams[f].k;
  if (!inBox([yHead[0], yHead[1] - yR]) || !inBox([yHead[0], yHead[1] + yR]) || inBand(yHead[1] + yR)) issues.push(`f${f} your face out of the box/band: ${yHead.map((v) => v.toFixed(0))}`);
  for (const k of ["handL", "handR", "heelL", "toeL", "headC"]) youMinX = Math.min(youMinX, scr(ay[k] as P2)[0] - (k === "headC" ? yR : 0));
  // the robot
  const ga = A.P.at(BOT.X, BOT.Z);
  const gp = botAt(f);
  const ag = botAnchors(0, gp, ga.at, ga.scale) as unknown as Record<string, P2 | number>;
  const gu = botAnchors(0, gp, [0, 0], 1) as unknown as Record<string, P2>;
  const gHead = scr(ag.headC as P2);
  const gR = (ag.headR as number) * cams[f].k;
  if (!inBox([gHead[0], gHead[1] - gR]) || !inBox([gHead[0], gHead[1] + gR]) || inBand(gHead[1] + gR)) issues.push(`f${f} the robot's face out of the box/band`);
  const ant = scr(ag.antennaTip as P2);
  if (!inBox(ant)) issues.push(`f${f} the robot's antenna out of the box`);
  // pops (units / frame)
  const cy: Record<string, P2> = {};
  const cg: Record<string, P2> = {};
  for (const k of KEYS) {
    cy[k] = yu[k];
    cg[k] = gu[k];
    if (prevY) popY[k] = Math.max(popY[k] ?? 0, Math.hypot(cy[k][0] - prevY[k][0], cy[k][1] - prevY[k][1]));
    if (prevG) popG[k] = Math.max(popG[k] ?? 0, Math.hypot(cg[k][0] - prevG[k][0], cg[k][1] - prevG[k][1]));
  }
  if (prevY) for (const k of ["toeL", "toeR", "heelL", "heelR"]) feetMax = Math.max(feetMax, Math.hypot(cy[k][0] - prevY[k][0], cy[k][1] - prevY[k][1]));
  if (prevG) {
    const mv = Math.max(Math.hypot(cg.handL[0] - prevG.handL[0], cg.handL[1] - prevG.handL[1]), Math.hypot(cg.handR[0] - prevG.handR[0], cg.handR[1] - prevG.handR[1]));
    still = mv < 0.15 ? still + 1 : 0;
    stillMax = Math.max(stillMax, still);
  }
  prevY = cy;
  prevG = cg;
  // the sheet in your hand (its top-left corner at the grip)
  const sh = sheetAt(f);
  if (sh.held) {
    const grip: P2 = [YOU.X + yu.handL[0], yu.handL[1]];
    gripMax = Math.max(gripMax, Math.hypot(sh.pose.X - 15 - grip[0], sh.pose.Y - 24 - grip[1]));
  }
  if (f === LANDED) {
    // (mirrorPose swaps the arms: his near, reaching hand is handR in the mirrored pose)
    const touch: P2 = [BOT.X + gu.handR[0], gu.handR[1]];
    log.push(`f${LANDED} (landing): the robot's near mitten at X ${touch[0].toFixed(1)}, Y ${touch[1].toFixed(1)}; the sheet X ${sh.pose.X.toFixed(1)} +- 19, Y ${sh.pose.Y.toFixed(1)}`);
    if (Math.abs(touch[0] - sh.pose.X) > 19 || Math.abs(touch[1] - sh.pose.Y) > 8) issues.push(`f${LANDED} the robot's mitten is not on the sheet`);
  }
  if (f === LANDED - 1) {
    const g = [BOT.X + gu.handR[0], gu.handR[1]];
    if (Math.abs(g[0] - SHEET_DESK.X) < 19 && Math.abs(g[1] - SHEET_DESK.Y) < 4) issues.push(`f${f}: the hand is already on the sheet's place before it lands`);
  }
  // the binders: labels in the box; boxes never intersect
  const boxes: { i: number; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }[] = [];
  for (let i = 0; i < LAND.length; i++) {
    const b = binderAt(i, f);
    if (b.state === "wait") continue;
    const lab = [scr(A.P.p(b.X - BIN.w / 2 + 3, b.Y - BIN.h + 6, b.Z)), scr(A.P.p(b.X + BIN.w / 2 - 3, b.Y - BIN.h + 40, b.Z))];
    // behind the pedestal: only the part above its top (the back edge's silhouette) shows
    if (b.Z >= PED.Z1) lab[1][1] = Math.min(lab[1][1], scr(A.P.p(b.X, -PED.H, PED.Z1))[1]);
    if (lab[1][1] <= lab[0][1]) continue;
    labMaxX = Math.max(labMaxX, lab[1][0]);
    const ok = inBox(lab[0]) && inBox([lab[1][0], lab[1][1] - 1]) && !(lab[1][1] > 900 && lab[1][0] > 955);
    if (!ok) issues.push(`f${f} year ${i + 1} label out of the box: ${lab.map((p) => p.map((v) => v.toFixed(0)).join(",")).join(" ")}`);
    const cen = scr(A.P.p(b.X, b.Y - BIN.h / 2, b.Z));
    const pv = binPrev.get(i);
    if (pv && b.state === "fly") {
      const v = Math.hypot(cen[0] - pv[0], cen[1] - pv[1]);
      binPeak[i] = Math.max(binPeak[i] ?? 0, v);
      if (v > binFast) {
        binFast = v;
        binFastAt = `f${f} year ${i + 1}`;
      }
    }
    binPrev.set(i, cen);
    {
      const r0 = scr(A.P.p(b.X - BIN.w / 2, b.Y - BIN.h, b.Z));
      const r1 = scr(A.P.p(b.X + BIN.w / 2, b.Y, b.Z));
      const hc = scr(ag.headC as P2);
      const hr = (ag.headR as number) * cams[f].k * 1.25;
      const dxh = Math.max(r0[0] - hc[0], 0, hc[0] - r1[0]);
      const dyh = Math.max(r0[1] - hc[1], 0, hc[1] - r1[1]);
      const at = scr(ag.antennaTip as P2);
      const inAnt = at[0] > r0[0] - 8 && at[0] < r1[0] + 8 && at[1] > r0[1] - 8 && at[1] < r1[1] + 8;
      botGap = Math.min(botGap, r0[0] - Math.max(hc[0] + hr, at[0]));
      if (Math.hypot(dxh, dyh) < hr || inAnt) issues.push(`f${f} year ${i + 1} crosses the robot's head or antenna`);
    }
    boxes.push({ i, x0: b.X - BIN.w / 2, x1: b.X + BIN.w / 2, y0: b.Y - BIN.h, y1: b.Y, z0: b.Z, z1: b.Z + BIN.d });
    // hidden at launch: inside the pedestal's silhouette
    const launch = LAND[i] - flightOf(i);
    if (f === Math.ceil(launch)) {
      const w0 = binderAt(i, launch - 0.01);
      const q = [A.P.p(w0.X - BIN.w / 2, w0.Y - BIN.h, w0.Z), A.P.p(w0.X + BIN.w / 2, w0.Y, w0.Z)];
      const pq = [A.P.p(PED.X0, -PED.H, PED.Z1), A.P.p(PED.X1, 0, PED.Z0)];
      if (q[0][0] < pq[0][0] || q[1][0] > pq[1][0] || q[0][1] < pq[0][1]) issues.push(`f${f} year ${i + 1} not hidden by the pedestal at launch`);
    }
  }
  const solids = [
    { n: "upright L", x0: CASE.X0, x1: CASE.X0 + CASE.side, y0: CASE.top, y1: 0, z0: CASE.Z, z1: CASE.Z + CASE.D },
    { n: "upright R", x0: CASE.X1 - CASE.side, x1: CASE.X1, y0: CASE.top, y1: 0, z0: CASE.Z, z1: CASE.Z + CASE.D },
    ...ROWS.slice(0, 3).map((y, k) => ({ n: `board ${k}`, x0: CASE.X0, x1: CASE.X1, y0: y, y1: y + CASE.board, z0: CASE.Z, z1: CASE.Z + CASE.D })),
    { n: "top", x0: CASE.X0, x1: CASE.X1, y0: CASE.top, y1: CASE.top + CASE.board, z0: CASE.Z, z1: CASE.Z + CASE.D },
    { n: "base", x0: CASE.X0, x1: CASE.X1, y0: ROWS[3], y1: 0, z0: CASE.Z, z1: CASE.Z + CASE.D },
    { n: "pedestal", x0: PED.X0, x1: PED.X1, y0: -PED.H, y1: 0, z0: PED.Z0, z1: PED.Z1 },
  ];
  const hit = (a: (typeof boxes)[number] | (typeof solids)[number], b: (typeof boxes)[number] | (typeof solids)[number]) =>
    a.x0 < b.x1 - 0.01 && b.x0 < a.x1 - 0.01 && a.y0 < b.y1 - 0.01 && b.y0 < a.y1 - 0.01 && a.z0 < b.z1 - 0.01 && b.z0 < a.z1 - 0.01;
  for (let a = 0; a < boxes.length; a++) {
    for (let b = a + 1; b < boxes.length; b++) if (hit(boxes[a], boxes[b])) issues.push(`f${f} years ${boxes[a].i + 1} and ${boxes[b].i + 1} intersect`);
    for (const s of solids) if (hit(boxes[a], s)) issues.push(`f${f} year ${boxes[a].i + 1} intersects the ${s.n}`);
  }
}
log.push(`your feet: max move ${feetMax.toFixed(2)} units/f; you at x >= ${youMinX.toFixed(0)}; the sheet off the grip by <= ${gripMax.toFixed(2)} units while held (to f${RELEASE})`);
log.push(`labels: rightmost x ${labMaxX.toFixed(0)}; binders: fastest ${binFast.toFixed(0)} px/f (${binFastAt}); launches ${LAND.map((l, i) => (l - flightOf(i)).toFixed(1)).join(" ")}; landings ${LAND.map((l) => l.toFixed(1)).join(" ")}; peak px/f by year ${binPeak.map((v) => v.toFixed(0)).join(" ")}`);
log.push(`the robot's mittens: longest still stretch ${stillMax} frames; nearest binder to its head/antenna: ${botGap.toFixed(0)} px`);
log.push(`pops (units/f) you: ${Object.entries(popY).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(", ")}`);
log.push(`pops (units/f) robot: ${Object.entries(popG).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(", ")}`);
if (feetMax > 0.3) issues.push(`your feet slide (${feetMax.toFixed(2)} units/f)`);
if (youMinX < 65) issues.push(`you leave the box on the left (x ${youMinX.toFixed(0)})`);
if (stillMax > 4) issues.push(`the robot's mittens rest ${stillMax} frames`);
if (gripMax > 1) issues.push(`the held sheet drifts off the grip (${gripMax.toFixed(2)})`);
console.log(log.join("\n"));
console.log(issues.length ? `\n${issues.length} ISSUES\n${issues.slice(0, 60).join("\n")}` : "\nOK: no issues");
