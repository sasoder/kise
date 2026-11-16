// Per-frame geometry checks for FirstPrivateToOrbit (skyroot-trailer, cut 4):
//   * no caption bands (COMMON.md, 16 Nov): the settled frame's balance instead: the rocket near the middle, the Earth's
//     cap in the lower part of the frame (its top between y 560 and 760), nothing within 60 px of the top;
//   * the follow: the camera locked on the rocket (its middle within 70 px of where it sits), the limb falling away to the
//     frame's bottom by ~f30;
//   * the rocket vs the globe: while it is BEHIND the globe it may be covered by it; while in front, any overlap is it
//     flying in front of the disc (allowed); before the pitch-over it must never dip into the disc (no sinking in);
//   * the rocket on screen: wholly in frame from f0 to the end (margin);
//   * continuity: the nozzle (trail end) step per frame, the heading's turn per frame, the trail's start pinned;
//   * the rocket on the near side after the pitch-over, flying <= 25 px/f from f30, turning <= 15 deg/f, its body on
//     its path from f42 (axis within 20 px of the projected path: the nose on the curve, never past the ring's edge);
//   * the camera: ln(Rs) per frame (one deceleration lobe) and the globe centre's step.
//   bun scripts/clips/skyroot-trailer/check-first-private.ts
import { spawnSync } from "node:child_process";
import { VIKRAM1 } from "../../../generated/components/skyroot-trailer/skyrootShared";
import { DURATION, S_J, pathAt, rocketAt } from "../../../generated/components/skyroot-trailer/FirstPrivateToOrbit";

const raw = spawnSync("ffmpeg", ["-v", "error", "-i", "public/skyroot-trailer/vikram1.png", "-f", "rawvideo", "-pix_fmt", "rgba", "-"], { maxBuffer: 1e8 }).stdout as Buffer;
const PTS: [number, number][] = []; // (across, along from the base up) in fractions of the nose-base length
const span = (VIKRAM1.baseY - VIKRAM1.noseY) * VIKRAM1.h;
for (let y = 0; y < VIKRAM1.h; y += 6)
  for (let x = 0; x < VIKRAM1.w; x += 3)
    if (raw[(y * VIKRAM1.w + x) * 4 + 3] > 128) PTS.push([(x - VIKRAM1.axisX * VIKRAM1.w) / span, (VIKRAM1.baseY * VIKRAM1.h - y) / span]);
const rocketPts = (f: number) => {
  const r = rocketAt(f);
  // along = (ux, uy) (nose direction, screen), across = (-uy, ux) (the vehicle's right after the turn)
  return PTS.map(([a, l]) => [r.base.x + r.ux * l * r.L - r.uy * a * r.L, r.base.y + r.uy * l * r.L + r.ux * a * r.L] as [number, number]);
};
let prev: ReturnType<typeof rocketAt> | null = null;
let prevC: { x: number; y: number } | null = null;
let prevLn = 0;
const issues: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const r = rocketAt(f);
  const cam = r.cam;
  const pts = rocketPts(f);
  const ys = pts.map((p) => p[1]);
  const xs = pts.map((p) => p[0]);
  const mid = { x: (r.base.x + r.nose.x) / 2, y: (r.base.y + r.nose.y) / 2 };
  const limb = Math.abs(mid.x - cam.C.x) < cam.Rs ? cam.C.y - Math.sqrt(cam.Rs ** 2 - (mid.x - cam.C.x) ** 2) : Infinity;
  const dDisc = Math.min(...pts.map((p) => Math.hypot(p[0] - cam.C.x, p[1] - cam.C.y))) - cam.Rs;
  const step = prev ? Math.hypot(r.base.x - prev.base.x, r.base.y - prev.base.y) : 0;
  let turn = prev ? r.rot - prev.rot : 0;
  if (turn > 180) turn -= 360;
  if (turn < -180) turn += 360;
  // the rocket on its path: the worst distance of its axis (nozzle -> nose) from the projected path between them
  let offPath = 0;
  for (let k = 1; k < 8; k++) {
    const ax = { x: r.base.x + (r.nose.x - r.base.x) * (k / 8), y: r.base.y + (r.nose.y - r.base.y) * (k / 8) };
    let best = 1e9;
    for (let j = 0; j <= 80; j++) {
      const q = cam.toScreen(pathAt(r.s + (j / 80) * (r.L / cam.Rs) * 2).p);
      best = Math.min(best, Math.hypot(q.x - ax.x, q.y - ax.y));
    }
    offPath = Math.max(offPath, best);
  }
  const cStep = prevC ? Math.hypot(cam.C.x - prevC.x, cam.C.y - prevC.y) : 0;
  const ln = Math.log(cam.Rs);
  const out = Math.min(...xs) < 20 || Math.max(...xs) > 2028 || Math.min(...ys) < 20 || Math.max(...ys) > 1060;
  const line = `f${String(f).padStart(2)} rocket y ${Math.min(...ys).toFixed(0)}-${Math.max(...ys).toFixed(0)} x ${Math.min(...xs).toFixed(0)}-${Math.max(...xs).toFixed(0)} mid (${mid.x.toFixed(0)},${mid.y.toFixed(0)}) limb ${limb.toFixed(0)} z ${r.z.toFixed(2)} disc-gap ${dDisc.toFixed(0).padStart(5)} nozzle step ${step.toFixed(1).padStart(5)} turn ${turn.toFixed(1).padStart(5)} off-path ${offPath.toFixed(0).padStart(3)} ${r.s >= S_J ? "orbit" : "climb"} | cam dln ${((ln - prevLn) * 100).toFixed(2).padStart(6)} C step ${cStep.toFixed(1)}`;
  console.log(line);
  if (out) issues.push(`f${f}: rocket within 20 px of the frame edge`);
  if (f >= 60 && (Math.abs(mid.x - 1024) > 120 || mid.y < 330 || mid.y > 600)) issues.push(`f${f}: settled rocket (${mid.x.toFixed(0)},${mid.y.toFixed(0)}) not near the middle`);
  if (f >= 60 && Math.min(...ys) < 60) issues.push(`f${f}: rocket within 60 px of the top`);
  if (f >= 60 && (cam.C.y - cam.Rs < 560 || cam.C.y - cam.Rs > 760)) issues.push(`f${f}: the cap's top at y ${(cam.C.y - cam.Rs).toFixed(0)} (balance wants 560-760)`);
  if (f >= 12 && f <= 34 && Math.hypot(mid.x - 1000, mid.y - 600) > 70) issues.push(`f${f}: follow: rocket middle (${mid.x.toFixed(0)},${mid.y.toFixed(0)}) drifted off its place`);
  if (f >= 28 && f <= 32 && limb < 1040) issues.push(`f${f}: follow: the limb at ${limb.toFixed(0)}, not at the frame's bottom`);
  // (the rocket stands on the pad, its foot on the limb, until it has lifted clear: it gathers speed slowly from f3)
  if (f < 20 && dDisc < -2 && r.z > 0 && f > 5) issues.push(`f${f}: rocket dips ${(-dDisc).toFixed(0)} px into the globe during the climb`);
  if (f > 20 && r.z < 0) issues.push(`f${f}: rocket behind the globe (the near side only)`);
  if (f >= 30 && step > 25) issues.push(`f${f}: rocket moves ${step.toFixed(0)} px in one frame (calm <= 25)`);
  // through the climb the rocket points along its velocity (the trail flows straight out of the nozzle) and the path
  // curves away ahead of it; from the chord ramp's end (CHORD_F0 + CHORD_RAMP = f42) its nose is on the line, the body
  // within the chord's sag on the orbit's crest (~17 px)
  if (f >= 42 && offPath > 20) issues.push(`f${f}: rocket body ${offPath.toFixed(0)} px off its path`);
  if (Math.abs(turn) > 15) issues.push(`f${f}: heading turns ${turn.toFixed(0)} deg in one frame`);
  prev = r;
  prevC = cam.C;
  prevLn = ln;
}
console.log(issues.length ? `\nISSUES\n${issues.join("\n")}` : "\nno issues");
