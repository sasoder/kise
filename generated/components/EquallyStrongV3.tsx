import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { GO_RECORDS, goIsBlack } from "./challengeShared";
import {
  DeepMindMark,
  iconShadow,
  GoBoard,
  INK,
  INK_HI,
  Stage,
  cameraTrack,
  camJerk,
  goHalf,
  goPoint,
  smoothstep,
  threadW,
  toScreen,
} from "./outgrowShared";

// ---------------------------------------------------------------------------
// EquallyStrongV3 — Noam_Challenge_The_Model, cut 3 (V3), in-point 0:19.300.
// "you're always playing against an AI that's equally strong"
// 61 f of speech (round((21.859 - 19.300) * 24)) + 16 f tail = 77 f.
//
// WORD -> FRAME (onset, frame = round((t - 19.300) * 24)):
//   you're 0 · always 1 · playing 7 · against 13 · an 21 · AI 34 · that's 37 ·
//   equally 43 · strong 50 · (whereas 61)
//
// THE PICTURE: self-play, literally. One REAL AlphaGo Zero self-play game (the
// 40-block net playing itself, Nature 2017, game 02 — GO_RECORDS[1]). Black is
// the DeepMind mark at the top of the board, white is the SAME mark sat
// opposite (rotated 180). Every stone lands with a thread back to the player
// who played it — a rally — and when it lands, that player grows (size is strength,
// the clip's one rule); one move later the other has grown by exactly the same
// step. So the opponent is ALWAYS its own size, and both keep growing.
//
// GESTURES (each with the word it serves):
//   f0-12   close on the top player; its moves land with a thread back to it
//           ....................................................... "you're always playing"
//   f4-42   the camera crosses the board along the rally and finds the
//           opponent: the same mark, same size, threads from below  "against an AI"
//   f30-77  pull-back to hold both; each landing grows its player, and the
//           other matches it the next move ........................ "that's equally strong"
//   (ends mid-rally, both still growing)
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 77;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const B = { x: 540, y: 960, cell: 42 };
const HALF = goHalf(B.cell);
const REC = 1;
const MOVES = GO_RECORDS[REC].moves;
const GAP = 44;
const EM0 = 130;
const STEP = 1.1; // one landing = one step of strength
const I0 = 58; // the first move of the rally
const F0 = -6; // ...lands on this frame
const PACE = 5; // frames between moves
const landF = (i: number) => F0 + (i - I0) * PACE;

// A player's size: EM0 x STEP^(its landings so far), each step eased over 8 f
// from the frame its stone lands. Black = even move index = TOP.
const emOf = (top: boolean, f: number) => {
  let lg = 0;
  for (let i = I0; i < MOVES.length; i++) {
    if (goIsBlack(i) !== top) continue;
    const t = landF(i);
    if (t > f) break;
    lg += Math.log(STEP) * smoothstep((f - t) / 8);
  }
  return EM0 * Math.exp(lg);
};
const topY = (em: number) => B.y - HALF - GAP - em / 2;
const botY = (em: number) => B.y + HALF + GAP + em / 2;

const CAM = cameraTrack(
  { x: 540, y: 610, k: 1.4 },
  [
    { f0: 3, f1: 44, dy: 550, k: 1.05 },
    { f0: 30, f1: 72, dy: -120, k: 0.82 },
    { f0: 60, f1: 120, k: 0.76, dy: -10 },
  ],
  DURATION,
);

export const PROBLEMS: string[] = [];
const fail = (m: string) => PROBLEMS.push(m);
(() => {
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`EquallyStrongV3: camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  // the two players are never more than one step apart
  for (let f = 0; f < DURATION; f++) {
    const r = emOf(true, f) / emOf(false, f);
    if (r > STEP * 1.001 || r < 1 / (STEP * 1.001)) fail(`EquallyStrongV3: players ${r.toFixed(3)} apart at f${f}`);
  }
  // end frame: both marks and the board inside the band above the captions
  const cE = CAM[DURATION - 1];
  const emE = emOf(true, DURATION - 1);
  const top = toScreen(cE, 540, topY(emE) - emE / 2).y;
  const bot = toScreen(cE, 540, botY(emOf(false, DURATION - 1)) + emE / 2).y;
  if (top < 120 || bot > 1380) fail(`EquallyStrongV3: end frame spans ${top.toFixed(0)}..${bot.toFixed(0)}`);
})();

// The move thread: when move i lands, a straight white thread joins the player
// who played it to the stone — in over 3 f, out over 10 — so the rally reads
// as two players taking turns without anything crossing the board fast.
function threadOf(i: number, f: number) {
  const t = landF(i);
  const op = smoothstep((f - t + 3) / 4) * (1 - smoothstep((f - t - 3) / 10));
  if (op <= 0.003) return null;
  const top = goIsBlack(i);
  const em = emOf(top, f);
  const my = top ? topY(em) : botY(em);
  const [c, r] = MOVES[i];
  const p = goPoint(B.x, B.y, B.cell, c, r);
  const dx = p.x - 540;
  const dy = p.y - my;
  const L = Math.hypot(dx, dy) || 1;
  const s0 = em * 0.5;
  const s1 = L - B.cell * 0.55;
  return { x0: 540 + (dx / L) * s0, y0: my + (dy / L) * s0, x1: 540 + (dx / L) * s1, y1: my + (dy / L) * s1, op };
}
const PROBE = typeof process !== "undefined" && !!process.env?.OUTGROW_PROBE;
if (PROBLEMS.length && !PROBE) throw new Error(PROBLEMS.slice(0, 6).join("\n"));
export { CAM };

export const EquallyStrongV3: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = CAM[frame];
  const k = cam.k;
  const emT = emOf(true, frame);
  const emB = emOf(false, frame);
  // the board shows every move that has landed (the ones before the rally were
  // already played)
  let movesF = I0;
  for (let i = I0; i < MOVES.length; i++) {
    const t = landF(i);
    if (t > frame) break;
    movesF = i + Math.min(1, (frame - t) / (PACE * 0.75) + 0.001);
  }
  const threads: React.ReactNode[] = [];
  for (let i = I0; i < MOVES.length; i++) {
    const t = threadOf(i, frame);
    if (!t) continue;
    threads.push(
      <line
        key={i}
        x1={t.x0}
        y1={t.y0}
        x2={t.x1}
        y2={t.y1}
        stroke={INK}
        strokeOpacity={INK_HI * t.op}
        strokeWidth={threadW(k) * 1.3}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <Stage frame={frame} cam={cam} rest={CAM[0]}>
      <GoBoard x={B.x} y={B.y} cell={B.cell} k={k} record={REC} movesF={movesF} />
      <DeepMindMark k={k} x={540} y={topY(emT)} em={emT} />
      <DeepMindMark k={k} x={540} y={botY(emB)} em={emB} rot={180} />
      <g style={{ filter: iconShadow(k) }}>{threads}</g>
    </Stage>
  );
};

export default EquallyStrongV3;
