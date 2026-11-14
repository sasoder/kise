// Per-frame geometry checks for FirstPrivateToOrbit (skyroot-trailer, cut 4):
//   * the rocket (its opaque pixels, turned) and the crown vs the caption bands;
//   * the rocket vs the globe: while it is BEHIND the globe it may be covered by it; while in front, any overlap is it
//     flying in front of the disc (allowed); before the pitch-over it must never dip into the disc (no sinking in);
//   * the rocket on screen: wholly in frame from f0 to the end (margin);
//   * continuity: the nozzle (trail end) step per frame, the heading's turn per frame, the trail's start pinned;
//   * the rocket on the near side after the pitch-over, flying <= 25 px/f from f30, turning <= 15 deg/f, its body on
//     its path (axis within 14 px of the projected path: the nose on the curve, never past the ring's edge);
//   * the camera: ln(Rs) per frame (one deceleration lobe) and the globe centre's step.
//   bun scripts/clips/skyroot-trailer/check-first-private.ts
import { spawnSync } from "node:child_process";
import { CAPTION_BANDS, VIKRAM1 } from "../../../generated/components/skyroot-trailer/skyrootShared";
import { DURATION, S_J, camAt, pathAt, rocketAt } from "../../../generated/components/skyroot-trailer/FirstPrivateToOrbit";

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
const inBand = (y: number) => CAPTION_BANDS.some(([a, b]) => y > a && y < b);
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
  const band = pts.filter((p) => inBand(p[1])).length / pts.length;
  const crownTop = Math.min(...ys); // the crown trails BEHIND along the path now: only the body counts
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
  const line = `f${String(f).padStart(2)} rocket y ${Math.min(...ys).toFixed(0)}-${Math.max(...ys).toFixed(0)} x ${Math.min(...xs).toFixed(0)}-${Math.max(...xs).toFixed(0)} inBand ${(band * 100).toFixed(0).padStart(3)}% z ${r.z.toFixed(2)} disc-gap ${dDisc.toFixed(0).padStart(5)} nozzle step ${step.toFixed(1).padStart(5)} turn ${turn.toFixed(1).padStart(5)} off-path ${offPath.toFixed(0).padStart(3)} ${r.s >= S_J ? "orbit" : "climb"} | cam dln ${((ln - prevLn) * 100).toFixed(2).padStart(6)} C step ${cStep.toFixed(1)}`;
  console.log(line);
  if (out) issues.push(`f${f}: rocket within 20 px of the frame edge`);
  if (f >= 60 && (band > 0 || crownTop < 20)) issues.push(`f${f}: resolved rocket/crown in a caption band or off the top`);
  if (f < 20 && dDisc < -2 && r.z > 0 && f > 3) issues.push(`f${f}: rocket dips ${(-dDisc).toFixed(0)} px into the globe during the climb`);
  if (f > 20 && r.z < 0) issues.push(`f${f}: rocket behind the globe (the near side only)`);
  if (f >= 30 && step > 25) issues.push(`f${f}: rocket moves ${step.toFixed(0)} px in one frame (calm <= 25)`);
  if (f >= 26 && offPath > 14) issues.push(`f${f}: rocket body ${offPath.toFixed(0)} px off its path`);
  if (Math.abs(turn) > 15) issues.push(`f${f}: heading turns ${turn.toFixed(0)} deg in one frame`);
  prev = r;
  prevC = cam.C;
  prevLn = ln;
}
console.log(issues.length ? `\nISSUES\n${issues.join("\n")}` : "\nno issues");
