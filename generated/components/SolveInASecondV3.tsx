import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  MODEL_EM_FULL,
  ModelMark,
  Person,
  PERSON_TOP,
  QRing,
  Stage,
  cameraTrack,
  camJerk,
  floatTilt,
  letGo,
  solveAt,
  solveEnd,
  sendLift,
  isEasy,
  lerp,
  markR,
  smoothstep,
  toScreen,
  workFrames,
} from "./outgrowShared";

// ---------------------------------------------------------------------------
// SolveInASecondV3 — Noam_Challenge_The_Model, cut 4 (V3), in-point 0:27.000.
// "out there right now, you give the model a problem and you ask it to solve
//  it. And if the problem is so easy that you can just solve it in a second,
//  it's not really learning anything"
// 188 f of speech (round((34.840 - 27.000) * 24)) + 16 f tail = 204 f.
//
// WORD -> FRAME (onset, frame = round((t - 27.000) * 24)):
//   there 0 · right 3 · now 7 · you 12 · give 17 · the 23 · model 26 · a 31 ·
//   problem 41 · and 49 · you 55 · ask 57 · it 61 · to 63 · solve 65 · it 70 ·
//   and 77 · if 84 · the 94 · problem 97 · is 105 · so 117 · easy 126 ·
//   that 133 · you 136 · can 138 · just 139 · solve 142 · it 146 · in 147 ·
//   a 149 · second 151 · it's 158 · not 159 · really 162 · learning 166 ·
//   anything 171 · (so 181 · if 188)
//
// THE PICTURE: human scale first. One person holds up one problem. It floats up
// out of their hands ("give the model a problem"), and the camera, rising with
// it, pulls back and back until the model is in frame: the full-size OpenAI
// mark from cut 1, enormous. Then the camera pushes in on the touch: a wall of
// orange, a speck of a question. The arc goes round in workFrames(44, R) = 7
// frames, the tick lands on "second" — and the model lets it go. It peels off
// the rim white and dim and falls away; the model is exactly the size it was
// (the law: 44 is under EASY_RATIO of R, so nothing pours in). Below, the
// person already has the next one.
//
// GESTURES (each with the word it serves):
//   f0-17    close on the person holding the problem up ........... "out there right now, you"
//   f18-132  the problem floats up out of their hands, its `?` swaying
//            and settling upright as it arrives ................... "give the model a problem"
//   f14-84   ONE pull-back rising with it finds the giant model .... "the model … ask it to solve it"
//   f88-134  push in on the meeting point; the question is a speck
//            against a wall of orange ............................. "if the problem is so easy"
//   f132-151 touch; arc snaps round (7 f, eased); `?` crossfades to the
//            tick, which lands on ............................... "solve it in a second"
//   f151-191 let go: white, dim, peels off and falls; the mark does
//            not change; camera eases back out with the fall ...... "not really learning anything"
//   f160-204 the next problem appears in the person's hands and starts up
//            (ends mid-motion)
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 204;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const M = { x: 540, y: 600 };
const EM = MODEL_EM_FULL;
const R = markR(EM);
const P = { x: 540, y: 1900 };
const r = 44;
const HELD_Y = P.y + PERSON_TOP() - r - 10;
const RISE0 = 18;
const TOUCH = 132;
// The touch sits just OUTSIDE the knot's lowest lobe (its ink reaches 0.48 em
// below centre), so the accent arc is always seen against the grid, never lost
// on the orange.
const RIM_Y = M.y + 0.485 * EM + r + 4;
const W = workFrames(r, R);
const SIDE = 1;

// The first problem, frame by frame: held, rising, worked, ticked, let go —
// the shared SOLVE timeline and let-go, the same as every question in the film.
const first = (f: number) => {
  if (f < RISE0) {
    const bob = 3 * Math.sin(f / 7);
    return { x: P.x, y: HELD_Y + bob, work: 0, done: 0, tone: 0, op: 1, tilt: 0 };
  }
  if (f < TOUCH) {
    const u = (f - RISE0) / (TOUCH - RISE0);
    const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
    const sx = 26 * Math.sin(Math.PI * 2 * u) * (1 - u);
    return {
      x: P.x + sx,
      y: lerp(HELD_Y + 3 * Math.sin(RISE0 / 7), RIM_Y, e),
      work: 0,
      done: 0,
      tone: 0,
      op: 1,
      tilt: floatTilt(u, 3),
    };
  }
  const tw = f - TOUCH;
  if (tw < solveEnd(W)) return { x: P.x, y: RIM_Y, ...solveAt(tw, W), op: 1, tilt: 0 };
  const lg = letGo(tw - solveEnd(W), SIDE, { x: 0, y: 1 });
  return { x: P.x + lg.dx, y: RIM_Y + lg.dy, work: 1, done: 1, tone: lg.tone, op: lg.gone ? 0 : lg.op, tilt: 0 };
};
// The next one: grows into the person's hands, then starts up.
const NEXT_IN = 160;
const NEXT_UP = 184;
const next = (f: number) => {
  const a = smoothstep((f - NEXT_IN) / 12);
  const u = Math.max(0, (f - NEXT_UP) / (TOUCH - RISE0));
  const e = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, u));
  return { x: P.x, y: lerp(HELD_Y, RIM_Y, e) + 3 * Math.sin(f / 7) * (1 - Math.min(1, u * 4)), r: r * (0.7 + 0.3 * a), op: a };
};

const CAM = cameraTrack(
  { x: 540, y: 1800, k: 1.8 },
  [
    { f0: 12, f1: 84, dy: -650, k: 0.55, warp: 0.85 },
    { f0: 84, f1: 138, dy: -90, k: 1.5 },
    { f0: 146, f1: 204, dy: 170, k: 1.05 },
    { f0: 190, f1: 240, dy: 20, k: 1.0 },
  ],
  DURATION,
);

export const PROBLEMS: string[] = [];
const fail = (m: string) => PROBLEMS.push(m);
(() => {
  if (!isEasy(r, R)) fail(`SolveInASecondV3: a ${r} question is not too easy for R ${R.toFixed(0)}`);
  const tickEnd = TOUCH + solveEnd(W);
  if (Math.abs(tickEnd - 151) > 2) fail(`SolveInASecondV3: tick ends f${tickEnd}, want ~f151 ("second")`);
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`SolveInASecondV3: camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  for (let f = 1; f < DURATION; f++) {
    const a = toScreen(CAM[f], first(f).x, first(f).y);
    const b = toScreen(CAM[f - 1], first(f - 1).x, first(f - 1).y);
    const v = Math.hypot(a.x - b.x, a.y - b.y);
    if (v > 45) fail(`SolveInASecondV3: the problem moves ${v.toFixed(0)} px at f${f}`);
  }
  // the reveal frame holds the whole model and the person above the captions
  const c = CAM[84];
  const top = toScreen(c, M.x, M.y - EM / 2).y;
  const feet = toScreen(c, P.x, P.y + 59).y;
  if (top < 100 || feet > 1380) fail(`SolveInASecondV3: reveal spans ${top.toFixed(0)}..${feet.toFixed(0)}`);
  // at the touch the problem sits in the content band
  const t = toScreen(CAM[TOUCH], P.x, RIM_Y);
  if (t.y < 500 || t.y > 1250) fail(`SolveInASecondV3: touch at screen y ${t.y.toFixed(0)}`);
})();
const PROBE = typeof process !== "undefined" && !!process.env?.OUTGROW_PROBE;
if (PROBLEMS.length && !PROBE) throw new Error(PROBLEMS.slice(0, 6).join("\n"));
export { CAM };

export const SolveInASecondV3: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = CAM[frame];
  const k = cam.k;
  const q = first(frame);
  const n = next(frame);
  const touching = frame >= TOUCH;
  return (
    <Stage frame={frame} cam={cam} rest={CAM[0]}>
      <Person k={k} x={P.x} y={P.y} lift={sendLift(frame - RISE0 + 2) + sendLift(frame - NEXT_UP + 2)} />
      {n.op > 0 ? <QRing x={n.x} y={n.y} r={n.r} k={k} opacity={n.op} tilt={floatTilt(Math.max(0, (frame - NEXT_UP) / (TOUCH - RISE0)), 5)} /> : null}
      {!touching ? <QRing x={q.x} y={q.y} r={r} k={k} opacity={q.op} tilt={q.tilt} /> : null}
      <ModelMark k={k} x={M.x} y={M.y} em={EM} />
      {touching ? (
        <QRing x={q.x} y={q.y} r={r} k={k} work={q.work} done={q.done} tone={q.tone} opacity={q.op} tilt={q.tilt} />
      ) : null}
    </Stage>
  );
};

export default SolveInASecondV3;
