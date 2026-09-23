import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ChessBoard,
  DashedPath,
  DeepMindMark,
  FeedRing,
  GoBoard,
  Label,
  MODEL_EM_FULL,
  ModelMark,
  QRing,
  Stage,
  cameraTrack,
  camJerk,
  clamp01,
  goHalf,
  markR,
  runFeed,
  smoothstep,
  toScreen,
} from "./outgrowShared";

// ---------------------------------------------------------------------------
// SamePathV3 — Noam_Challenge_The_Model, cut 2 (V3), in-point 0:11.160.
// "why you might not see LLMs go the same path as AlphaGo and AlphaZero and
//  all these kinds of game-playing AIs"
// 139 f of speech (round((16.960 - 11.160) * 24)) + 16 f tail = 155 f.
//
// WORD -> FRAME (onset, frame = round((t - 11.160) * 24)):
//   why 0 · you 12 · might 17 · not 21 · see 25 · LLMs 35 · go 48 · the 53 ·
//   same 57 · path 61 · as 70 · AlphaGo 75 · and 86 · AlphaZero 91 · and 104 ·
//   all 108 · these 110 · kinds 114 · of 117 · game 120 · playing 126 ·
//   AIs 130 · (where 139)
//
// THE PICTURE: the LLM is the giant orange model from cut 1, still shrugging
// off questions that are too easy for it. A dashed would-be path leaves it and
// the camera rides the path down to a REAL game: AlphaGo v Lee Sedol, game 2
// (black's move 37, the famous shoulder hit, lands on "AlphaGo"). The camera
// keeps pulling back and finds AlphaZero's real chess game below it
// (AlphaZero v Stockfish 2017, game 10), then a whole hall of games, all
// playing themselves — with the LLM hanging alone above them.
//
// GESTURES (each with the word it serves):
//   f0-35   on the model; two last questions snap solved and peel off; slow
//           creep in ............................................ "why you might not see LLMs"
//   f36-66  the dashed path draws down out of the model, head-led . "go the same path"
//   f28-80  ONE descent along the path (zoom dips mid-travel) onto the board;
//           the board rules in and its game is already running .. "…path as AlphaGo"
//   f75     move 37 lands .......................................... "AlphaGo"
//   f82-112 pull-back finds the chess board below, its lockup rises "and AlphaZero"
//   f104-150 the pull-back keeps going: a hall of twelve more games,
//           every one of them playing; the LLM re-enters at the top "all these kinds
//           of game-playing AIs"
//   f140-155 slow drift out continues; every board still playing (ends mid-motion)
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 155;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const M = { x: 540, y: 0 };
const EM = MODEL_EM_FULL;
const R = markR(EM);
const PATH_Y0 = 540;
const PATH_Y1 = 950;
const GO = { x: 540, y: 1500, cell: 46 };
const GO_LOCK_Y = 1010;
const CH = { x: 540, y: 2570, cell: 100 };
const CH_LOCK_Y = 2075;

// AlphaGo's board: move 37 (index 36) lands on "AlphaGo" (f75), one stone every
// 3 frames; the moves before it are already on the board when it rules in.
const goMovesF = (f: number) => Math.max(0, 36 + (f - 75) / 3 + 1);
// AlphaZero's board: ply 12 when it is found, one ply every 5 frames.
const chPlyF = (f: number) => Math.max(0, 12 + (f - 92) / 5);

// The hall: "all these kinds of game-playing AIs". Real records again (AlphaGo
// v Lee Sedol, AlphaGo Zero self-play, AlphaZero v Stockfish) at other moments
// and other paces, so no two boards are ever in step.
type Hall = { kind: "go" | "chess"; x: number; y: number; cell: number; rec: number; at: number; pace: number };
const HALL: Hall[] = [
  { kind: "go", x: -470, y: 1160, cell: 32, rec: 1, at: 60, pace: 4 },
  { kind: "chess", x: -470, y: 2070, cell: 68, rec: 0, at: 30, pace: 7 },
  { kind: "go", x: -470, y: 2980, cell: 30, rec: 0, at: 84, pace: 5 },
  { kind: "chess", x: 1550, y: 1110, cell: 68, rec: 0, at: 46, pace: 6 },
  { kind: "go", x: 1550, y: 2020, cell: 32, rec: 0, at: 50, pace: 4 },
  { kind: "chess", x: 1550, y: 2940, cell: 64, rec: 0, at: 20, pace: 8 },
  { kind: "go", x: -1060, y: 1620, cell: 22, rec: 0, at: 96, pace: 6 },
  { kind: "chess", x: -1060, y: 2520, cell: 48, rec: 0, at: 60, pace: 9 },
  { kind: "go", x: -1060, y: 3330, cell: 21, rec: 1, at: 104, pace: 5 },
  { kind: "chess", x: 2140, y: 1640, cell: 48, rec: 0, at: 38, pace: 7 },
  { kind: "go", x: 2140, y: 2500, cell: 22, rec: 1, at: 40, pace: 6 },
  { kind: "go", x: 2140, y: 3320, cell: 21, rec: 0, at: 70, pace: 4 },
];
const hallHalf = (h: Hall) => (h.kind === "go" ? goHalf(h.cell) : h.cell * 4);
// The hall rules in from the centre outward as the pull-back reaches it
// ("all these kinds…"): nearest board first, one every 3 frames, 18 frames each.
const HALL_IN = (() => {
  const d = HALL.map((h, i) => ({ i, d: Math.hypot(h.x - 540, (h.y - 2000) * 0.8) }));
  d.sort((a, b) => a.d - b.d);
  const at: number[] = [];
  d.forEach((e, rank) => {
    at[e.i] = 100 + rank * 3;
  });
  return at;
})();

// The last too-easy questions at the model, arriving from below out of frame.
const RINGS: FeedRing[] = [
  { r: 50, bx: 380, by: 1420, bornF: -70, touchF: 2, angle: 112, bow: -40 },
  { r: 46, bx: 720, by: 1440, bornF: -58, touchF: 14, angle: 64, bow: 40 },
  { r: 54, bx: 560, by: 1460, bornF: -52, touchF: 24, angle: 94, bow: 0 },
];
const FEED = runFeed(M, R, RINGS, -80, DURATION + 2);

const CAM = cameraTrack(
  { x: 540, y: 90, k: 0.84 },
  [
    { f0: 0, f1: 34, k: 0.9, dy: 10 },
    { f0: 26, f1: 84, dy: 1405, warp: 0.95 },
    { f0: 26, f1: 56, k: 0.66 },
    { f0: 50, f1: 84, k: 1.0 },
    { f0: 82, f1: 116, k: 0.5, dy: 500 },
    { f0: 104, f1: 152, k: 0.27, dy: -330, warp: 0.85 },
    { f0: 138, f1: 200, k: 0.25, dy: -20 },
  ],
  DURATION,
);

// ---------------------------------------------------------------------------
// ASSERTIONS
// ---------------------------------------------------------------------------
export const PROBLEMS: string[] = [];
const fail = (m: string) => PROBLEMS.push(m);
(() => {
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`SamePathV3: camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  FEED.verdict.forEach((v, i) => {
    if (!v.easy) fail(`SamePathV3: ring ${i} was not too easy for the full-size model`);
  });
  // hall boards never overlap each other or the centre column (with lockups)
  const boxes = [
    ...HALL.map((h) => ({ x0: h.x - hallHalf(h), x1: h.x + hallHalf(h), y0: h.y - hallHalf(h), y1: h.y + hallHalf(h) })),
    { x0: GO.x - goHalf(GO.cell), x1: GO.x + goHalf(GO.cell), y0: GO_LOCK_Y - 60, y1: GO.y + goHalf(GO.cell) },
    { x0: CH.x - CH.cell * 4, x1: CH.x + CH.cell * 4, y0: CH_LOCK_Y - 60, y1: CH.y + CH.cell * 4 },
  ];
  for (let a = 0; a < boxes.length; a++)
    for (let b = a + 1; b < boxes.length; b++) {
      const A = boxes[a];
      const B = boxes[b];
      if (A.x0 < B.x1 + 60 && B.x0 < A.x1 + 60 && A.y0 < B.y1 + 60 && B.y0 < A.y1 + 60)
        fail(`SamePathV3: boards ${a} and ${b} are closer than 60 px`);
    }
  // key frames: AlphaGo board framed on "AlphaGo"; everything inside the frame
  // and above the captions on the last frame
  const c75 = CAM[75];
  const g0 = toScreen(c75, GO.x - goHalf(GO.cell), GO_LOCK_Y - 60);
  const g1 = toScreen(c75, GO.x + goHalf(GO.cell), GO.y + goHalf(GO.cell));
  if (g0.x < 40 || g1.x > 1040 || g0.y < 60 || g1.y > 1420)
    fail(`SamePathV3: AlphaGo board not framed at f75 (${g0.x.toFixed(0)},${g0.y.toFixed(0)})-(${g1.x.toFixed(0)},${g1.y.toFixed(0)})`);
  const cE = CAM[DURATION - 1];
  const top = toScreen(cE, M.x, M.y - EM * 0.5).y;
  let bottom = 0;
  let left = 1e9;
  let right = -1e9;
  HALL.forEach((h) => {
    const p0 = toScreen(cE, h.x - hallHalf(h), h.y - hallHalf(h));
    const p1 = toScreen(cE, h.x + hallHalf(h), h.y + hallHalf(h));
    bottom = Math.max(bottom, p1.y);
    left = Math.min(left, p0.x);
    right = Math.max(right, p1.x);
  });
  if (top < 120 || bottom > 1380 || left < 30 || right > 1050)
    fail(`SamePathV3: end frame content ${left.toFixed(0)}..${right.toFixed(0)} x ${top.toFixed(0)}..${bottom.toFixed(0)}`);
})();
const PROBE = typeof process !== "undefined" && !!process.env?.OUTGROW_PROBE;
if (PROBLEMS.length && !PROBE) throw new Error(PROBLEMS.slice(0, 6).join("\n"));
export { CAM };

// A DeepMind mark with the product name beside it, centred as one lockup; it
// slides up ~24 screen px and fades in, never pops.
const Lockup: React.FC<{ k: number; x: number; y: number; text: string; appear: number }> = ({
  k,
  x,
  y,
  text,
  appear,
}) => {
  const em = 96;
  const size = 70;
  const tw = text.length * size * 0.47;
  const w = em + 26 + tw;
  const x0 = x - w / 2;
  const a = clamp01(appear);
  if (a <= 0) return null;
  const lift = (1 - (1 - Math.pow(1 - a, 3))) * (24 / k);
  return (
    <>
      <DeepMindMark k={k} x={x0 + em / 2} y={y + lift} em={em} opacity={a} />
      <Label x={x0 + em + 26} y={y + size * 0.04} size={size} k={k} text={text} anchor="start" appear={a} />
    </>
  );
};

export const SamePathV3: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = CAM[frame];
  const k = cam.k;
  const st = FEED.at(frame);
  const pathDraw = smoothstep((frame - 32) / 30);
  const goDraw = smoothstep((frame - 50) / 22);
  const goLock = (frame - 56) / 14;
  const chDraw = smoothstep((frame - 84) / 18);
  const chLock = (frame - 88) / 14;
  return (
    <Stage frame={frame} cam={cam} rest={CAM[0]}>
      {HALL.map((h, i) =>
        h.kind === "go" ? (
          <GoBoard
            key={i}
            x={h.x}
            y={h.y}
            cell={h.cell}
            k={k}
            record={h.rec}
            movesF={h.at + frame / h.pace}
            draw={smoothstep((frame - HALL_IN[i]) / 18)}
            opacity={Math.min(1, 1.6 * smoothstep((frame - HALL_IN[i]) / 18))}
          />
        ) : (
          <ChessBoard
            key={i}
            x={h.x}
            y={h.y}
            cell={h.cell}
            k={k}
            plyF={(h.at + frame / h.pace) % 80}
            opacity={smoothstep((frame - HALL_IN[i]) / 18)}
          />
        ),
      )}
      <DashedPath x0={M.x} y0={PATH_Y0} x1={M.x} y1={PATH_Y1} draw={pathDraw} frame={frame} k={k} />
      <Lockup k={k} x={GO.x} y={GO_LOCK_Y} text="ALPHAGO" appear={goLock} />
      <GoBoard x={GO.x} y={GO.y} cell={GO.cell} k={k} record={0} movesF={goMovesF(frame)} draw={goDraw} opacity={Math.min(1, goDraw * 1.6)} />
      <Lockup k={k} x={CH.x} y={CH_LOCK_Y} text="ALPHAZERO" appear={chLock} />
      <ChessBoard x={CH.x} y={CH.y} cell={CH.cell} k={k} plyF={chPlyF(frame)} opacity={chDraw} />
      <ModelMark k={k} x={M.x} y={M.y} em={EM} />
      {st.map((s, i) => (
        <QRing key={i} x={s.x} y={s.y} r={s.r} k={k} work={s.work} done={s.done} tone={s.tone} opacity={s.op} />
      ))}
    </Stage>
  );
};

export default SamePathV3;
