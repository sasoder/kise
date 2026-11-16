// FrozenToTheAI (rsi-since-writing, cut 102) per-frame checks, in screen px (sway included):
// the camera (k and the pan: one move, no reversal), the two faces (inside the keep-in box x 65-1015, y 290-1070, never
// in the caption bands), the frozen stream and mug (in the box), the plate's type (in the box, cap height, clear of
// both faces and the clock), the robot's planted feet (stance-foot slip per frame in screen px), its hands vs the
// sheets (each hand on its grip of the sheet in flight), the extents of the picture (your back, the desk's right end).
// Run: bun scripts/clips/rsi-since-writing/check-frozen-to-the-ai.ts
import { airWorldOf } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";
import { AI_Z, CLOCK, DEPTH, DESK, DURATION, FROZEN, PLATE, SUN_T, YOU, aiAt, camOf, workAt } from "../../../generated/components/rsi-since-writing/FrozenToTheAI";
import { botAnchors } from "../../../generated/components/rsi-ten-earths/tenEarthsBot";
import { humanAnchors } from "../../../generated/components/rsi-since-writing/sinceWritingFolk";
import { OFFICE, officeScene } from "../../../generated/components/rsi-since-writing/sinceWritingWorld";

type P2 = [number, number];
const issues: string[] = [];
const log: string[] = [];
const inBand = (y: number) => (y >= 1080 && y <= 1250) || (y >= 1360 && y <= 1460);
const scr = (cam: { k: number; cx: number; cy: number }, p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
const cams = Array.from({ length: DURATION }, (_, f) => camOf(f));
const lk = cams.map((c) => Math.log(c.k));
const dk = lk.slice(1).map((v, i) => v - lk[i]);
log.push(`k ${cams[0].k.toFixed(3)} -> ${cams[DURATION - 1].k.toFixed(3)}; zoom-out %/f by 6: ${dk.filter((_, i) => i % 6 === 0).map((v) => (-v * 100).toFixed(2)).join(" ")}`);
log.push(`pan px/f by 6: ${cams.slice(1).map((c, i) => (c.cx - cams[i].cx) * c.k).filter((_, i) => i % 6 === 0).map((v) => v.toFixed(1)).join(" ")}`);

let prevFeet: { L: P2; R: P2 } | null = null;
let prevAn: Record<string, P2> | null = null;
const popMax: Record<string, { v: number; f: number }> = {};
let worstSlip = 0;
let worstSlipAt = "";
const rows: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const cam = cams[f];
  const A = airWorldOf({ cam, rest: cams[0], depth: DEPTH, frame: f, scene: officeScene(SUN_T) });
  const ya = A.P.at(YOU.X, YOU.Z);
  const yan = humanAnchors(0, FROZEN.pose, ya.at, ya.scale);
  const ai = aiAt(f, A.P);
  const ga = A.P.at(ai.X, AI_Z);
  const gan = botAnchors(0, ai.pose, ga.at, ga.scale);
  const faces = [
    { who: "you", c: scr(cam, yan.headC), r: (yan.headR as unknown as number) * cam.k },
    { who: "AI", c: scr(cam, gan.headC), r: (gan.headR as unknown as number) * cam.k },
  ];
  for (const fc of faces) {
    const y0 = fc.c[1] - fc.r;
    const y1 = fc.c[1] + fc.r;
    if (inBand(y0) || inBand(y1)) issues.push(`f${f} ${fc.who}'s face in a caption band`);
    if (y0 < 290 || y1 > 1070 || fc.c[0] - fc.r < 65 || fc.c[0] + fc.r > 1015) issues.push(`f${f} ${fc.who}'s face out of the box (${(fc.c[0] - fc.r).toFixed(0)}-${(fc.c[0] + fc.r).toFixed(0)}, ${y0.toFixed(0)}-${y1.toFixed(0)})`);
  }
  // the stream and the mug
  const toW = (p: P2): P2 => [ya.at[0] + p[0] * ya.scale, ya.at[1] + p[1] * ya.scale];
  const sp = scr(cam, toW(FROZEN.spout));
  const mo = scr(cam, toW(FROZEN.mouth));
  const mugBot = scr(cam, toW(FROZEN.mug.base));
  for (const [nm, p] of [["spout", sp], ["mouth", mo], ["mug base", mugBot]] as [string, P2][]) if (p[0] < 65 || p[0] > 1015 || p[1] < 290 || p[1] > 1070) issues.push(`f${f} ${nm} out of the box (${p[0].toFixed(0)}, ${p[1].toFixed(0)})`);
  // your back and the desk's right end
  const back = scr(cam, A.P.p(YOU.X - 52, -150, YOU.Z))[0];
  const deskR = scr(cam, A.P.p(DESK.x1, DESK.top, DESK.z0))[0];
  // the plate
  let plateTxt = "";
  if (f >= PLATE.f0) {
    const r = A.P.r(PLATE.Z);
    const c = scr(cam, A.P.p(PLATE.X, PLATE.Y, PLATE.Z));
    const s = PLATE.size * r * cam.k;
    const w = (5 * 0.62 + 0.28) * s;
    const box = { x0: c[0] - w / 2, x1: c[0] + w / 2, y0: c[1] - 0.36 * s, y1: c[1] + 0.36 * s };
    const clockC = scr(cam, A.P.p(CLOCK.X, CLOCK.Y, OFFICE.back));
    const clockR = CLOCK.R * A.P.r(OFFICE.back) * cam.k;
    const shadowRx = (w * 0.72 + s * 0.75) * 0.75;
    if (box.x0 < 65 || box.x1 > 1015 || box.y0 < 290 || box.y1 > 1070) issues.push(`f${f} plate out of the box`);
    if (Math.abs(clockC[0] - c[0]) < shadowRx + clockR && Math.abs(clockC[1] - c[1]) < s * 0.9 + clockR) issues.push(`f${f} plate's soft plate over the clock`);
    for (const fc of faces) if (Math.abs(fc.c[0] - c[0]) < w / 2 + fc.r && Math.abs(fc.c[1] - c[1]) < 0.5 * s + fc.r) issues.push(`f${f} plate over ${fc.who}'s face`);
    plateTxt = ` plate x ${box.x0.toFixed(0)}-${box.x1.toFixed(0)} y ${box.y0.toFixed(0)}-${box.y1.toFixed(0)} cap ${(0.66 * s).toFixed(0)}px; clock ${clockC[0].toFixed(0)},${clockC[1].toFixed(0)} r${clockR.toFixed(0)}`;
  }
  // the robot's feet: a planted foot does not slide (screen px against the floor; the camera's move removed by
  // comparing with last frame's floor point under the same world X)
  const feet = { L: scr(cam, gan.ankleL as P2), R: scr(cam, gan.ankleR as P2) };
  if (prevFeet && f <= 62) {
    const pc = cams[f - 1];
    const PA = airWorldOf({ cam: pc, rest: cams[0], depth: DEPTH, frame: f - 1, scene: officeScene(SUN_T) });
    void PA;
    const sl = Math.min(Math.hypot(feet.L[0] - prevFeet.L[0], feet.L[1] - prevFeet.L[1]), Math.hypot(feet.R[0] - prevFeet.R[0], feet.R[1] - prevFeet.R[1]));
    // the camera's own move of a floor point at the foot
    const pf = A.P.p(ai.X, 0, AI_Z);
    const camMove = Math.hypot(scr(cam, pf)[0] - scr(pc, pf)[0], scr(cam, pf)[1] - scr(pc, pf)[1]);
    const slip = Math.max(0, sl - camMove);
    if (slip > worstSlip) {
      worstSlip = slip;
      worstSlipAt = `f${f}`;
    }
  }
  prevFeet = feet;
  // the pop detector: each anchor's jump in screen px against the camera's move of the body (the figure's own motion)
  const keys = ["headC", "handL", "handR", "toeL", "toeR", "heelL", "heelR", "kneeL", "kneeR", "chest"];
  const cur: Record<string, P2> = {};
  for (const key of keys) cur[key] = scr(cam, gan[key as keyof typeof gan] as P2);
  if (prevAn) {
    const pc = cams[f - 1];
    const pf = A.P.p(ai.X, -150, AI_Z);
    const cm: P2 = [scr(cam, pf)[0] - scr(pc, pf)[0], scr(cam, pf)[1] - scr(pc, pf)[1]];
    for (const key of keys) {
      const v = Math.hypot(cur[key][0] - prevAn[key][0] - cm[0], cur[key][1] - prevAn[key][1] - cm[1]);
      if (!popMax[key] || v > popMax[key].v) popMax[key] = { v, f };
    }
  }
  prevAn = cur;
  // both hands vs their grips on the sheets (the left hand on the IN side, the right on the DONE side)
  const wk = workAt(f);
  let handTxt = "";
  if (f >= 44) {
    for (const side of ["L", "R"] as const) {
      const h = wk.hands[side];
      const want = scr(cam, A.P.p(h.X, h.Y, h.Z));
      const got = scr(cam, gan[side === "L" ? "handL" : "handR"] as P2);
      const d = Math.hypot(want[0] - got[0], want[1] - got[1]);
      handTxt += ` hand${side} off ${d.toFixed(1)}px`;
      if (d > 6) issues.push(`f${f} hand${side} ${d.toFixed(1)} px off its grip`);
    }
    handTxt += ` | p ${wk.p.toFixed(2)} in ${wk.nIn} done ${wk.nDone}`;
  }
  if (f % 10 === 0 || f === DURATION - 1)
    rows.push(
      `f${f} k${cam.k.toFixed(2)} you face ${faces[0].c.map((v) => v.toFixed(0)).join(",")} r${faces[0].r.toFixed(0)} | AI face ${faces[1].c.map((v) => v.toFixed(0)).join(",")} X${ai.X.toFixed(0)} | spout ${sp.map((v) => v.toFixed(0)).join(",")} mouth ${mo.map((v) => v.toFixed(0)).join(",")} | back ${back.toFixed(0)} deskR ${deskR.toFixed(0)} | feet y ${feet.L[1].toFixed(0)}${plateTxt}${handTxt}`,
    );
}
log.push(`largest per-frame anchor moves (screen px, camera removed): ${Object.entries(popMax).map(([key, m]) => `${key} ${m.v.toFixed(1)}@f${m.f}`).join(", ")}`);
log.push(`worst stance slip (screen px/f, camera removed) ${worstSlip.toFixed(1)} at ${worstSlipAt}`);
console.log(log.join("\n"));
console.log(rows.join("\n"));
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.slice(0, 60).join("\n")}` : "no issues");
