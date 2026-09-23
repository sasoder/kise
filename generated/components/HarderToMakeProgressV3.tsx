import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  MODEL_EM_FULL,
  ModelMark,
  POUR_F,
  Person,
  PERSON_TOP,
  QRing,
  Stage,
  easeOut,
  floatTilt,
  solveAt,
  solveEnd,
  sendLift,
  cameraTrack,
  camJerk,
  clamp01,
  emOfR,
  grow,
  hash,
  isEasy,
  lerp,
  markR,
  smoothstep,
  toScreen,
  workFrames,
} from "./outgrowShared";

// ---------------------------------------------------------------------------
// HarderToMakeProgressV3 — Noam_Challenge_The_Model, cut 5 (V3), in-point 0:37.460.
// "then that is a plausible scenario where actually, like, okay, it becomes
//  much harder to make progress"
// 107 f of speech (round((41.899 - 37.460) * 24)) + 16 f tail = 123 f.
//
// WORD -> FRAME (onset, frame = round((t - 37.460) * 24)):
//   then 0 · that 4 · is 13 · a 17 · plausible 20 · scenario 26 · where 34 ·
//   actually 38 · like 45 · okay 55 · it 61 · becomes 63 · much 70 ·
//   harder 77 · to 81 · make 83 · progress 85 · (now 107)
//
// THE PICTURE: once the model has outgrown every question one person can
// write, the only way to challenge it is EVERYONE. A crowd of people send
// their questions up in a bloom and they merge, by area, into ONE question that
// dwarfs every one of them. The camera follows it up to the full-size model,
// and for the first time since cut 1 something is worth the model's time: the
// arc CRAWLS round — workFrames(r, R) = 33 f, the slowest sweep in the film —
// and the cut ends on it, still going. It took everyone for one question.
//
// GESTURES (each with the word it serves):
//   f0-40   inside the crowd: every person's question blooms up ... "then that is a
//           plausible scenario"
//   f8-60   they converge onto the pool's rim and melt in; it swells
//           past the size of the crowd ................................. "where actually,
//           like, okay" (pull-back shows the whole crowd pouring into it)
//   f58-90  the pooled question rises; the camera follows it up and finds
//           the giant model entering from above .................. "it becomes much harder"
//   f90     touch ................................................. "…make progress"
//   f90-122 the arc crawls round — the model finally has to work; the
//           camera creeps in and holds its breath (ends mid-sweep)
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 123;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const M = { x: 540, y: 0 };
const EM = MODEL_EM_FULL;
const R = markR(EM);
const Q = { x: 540, y: 1250 };
const R_ONE = 42;

// The crowd: three staggered rows, feathered at the ends.
const CROWD = (() => {
  const out: { x: number; y: number }[] = [];
  const rows = [
    { y: 1660, n: 8, w: 700 },
    { y: 1752, n: 9, w: 820 },
    { y: 1844, n: 10, w: 920 },
  ];
  rows.forEach((row, ri) => {
    for (let i = 0; i < row.n; i++) {
      const u = i / (row.n - 1);
      out.push({
        x: 540 - row.w / 2 + u * row.w + (hash(i + ri * 20, 9) - 0.5) * 34 + (ri % 2 ? 20 : 0),
        y: row.y + (hash(i + ri * 20, 11) - 0.5) * 26,
      });
    }
  });
  return out;
})();

// Each person's question: born above their head (grow-in), rises and bows in to
// the merge point. Nearest first, so the bloom spreads outward through the crowd.
type Q1 = { px: number; py: number; r: number; born: number; arrive: number; bow: number };
const QS: Q1[] = (() => {
  const order = CROWD.map((p, i) => ({ i, d: Math.hypot(p.x - Q.x, p.y - Q.y) })).sort((a, b) => a.d - b.d);
  const out: Q1[] = [];
  order.forEach(({ i, d }, rank) => {
    const p = CROWD[i];
    const born = -24 + rank * 1.3;
    out[i] = {
      px: p.x,
      py: p.y + PERSON_TOP() - R_ONE - 8,
      r: R_ONE * (0.9 + 0.2 * hash(i, 4)),
      born,
      arrive: born + 18 + d / 32,
      bow: (p.x < Q.x ? -1 : 1) * (40 + 40 * hash(i, 7)),
    };
  });
  return out;
})();
const N = QS.length;
// how many have merged by frame f (each eases in over 8 f from its arrival)
const merged = (f: number) => QS.reduce((s, q) => s + smoothstep((f - q.arrive) / 8), 0);
// Questions pool by AREA (the same law the model grows by, without its gain):
// r_pool = sqrt(sum r_i^2).
const poolR = (f: number) => Math.sqrt(QS.reduce((s, q) => s + q.r * q.r * smoothstep((f - q.arrive) / 8), 0));
const R_POOL = Math.sqrt(QS.reduce((s, q) => s + q.r * q.r, 0));

const RISE0 = 60;
const TOUCH = 90;
const RIM_Y = M.y + 0.485 * EM + R_POOL + 4;
const W = workFrames(R_POOL, R);
const pourStart = TOUCH + solveEnd(W);
const modelR = (f: number) => {
  const e = smoothstep((f - pourStart) / POUR_F);
  return Math.sqrt(R * R + (grow(R, R_POOL) ** 2 - R * R) * e);
};

// A question flies to the pool's RIM (as big as the pool is when it gets
// there), on the side it comes from, then melts in toward the centre.
const qAt = (q: Q1, f: number) => {
  const u = clamp01((f - q.born) / (q.arrive - q.born));
  const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
  const dx = Q.x - q.px;
  const dy = Q.y - q.py;
  const L = Math.hypot(dx, dy) || 1;
  const rim = poolR(q.arrive);
  const tx = Q.x - (dx / L) * rim;
  const ty = Q.y - (dy / L) * rim;
  const b = q.bow * Math.sin(Math.PI * e);
  return { x: lerp(q.px, tx, e) + (-dy / L) * b, y: lerp(q.py, ty, e) + (dx / L) * b };
};
const poolAt = (f: number) => {
  const u = clamp01((f - RISE0) / (TOUCH - RISE0));
  const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
  return { x: Q.x, y: lerp(Q.y, RIM_Y, e) };
};

const CAM = cameraTrack(
  { x: 540, y: 1560, k: 1.25 },
  [
    { f0: 4, f1: 54, dy: -110, k: 0.8 },
    { f0: 50, f1: 96, dy: -750, k: 0.62 },
    { f0: 90, f1: 160, dy: -90, k: 0.8 },
  ],
  DURATION,
);

export const PROBLEMS: string[] = [];
const fail = (m: string) => PROBLEMS.push(m);
(() => {
  if (isEasy(R_POOL, R)) fail(`HarderToMakeProgressV3: pooled ${R_POOL.toFixed(0)} is too easy for R ${R.toFixed(0)}`);
  if (!isEasy(R_ONE * 1.1, R)) fail(`HarderToMakeProgressV3: one person's question is not too easy`);
  if (merged(RISE0) < N - 0.5) fail(`HarderToMakeProgressV3: only ${merged(RISE0).toFixed(1)} of ${N} merged before the rise`);
  if (W < 30) fail(`HarderToMakeProgressV3: the pooled question only takes ${W} f — it must be the slowest in the film`);
  if (TOUCH + W < DURATION - 6) fail(`HarderToMakeProgressV3: the sweep ends at f${TOUCH + W}; the cut should end on it`);
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`HarderToMakeProgressV3: camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  for (let f = 1; f < DURATION; f++) {
    const a = toScreen(CAM[f], poolAt(f).x, poolAt(f).y);
    const b = toScreen(CAM[f - 1], poolAt(f - 1).x, poolAt(f - 1).y);
    if (Math.hypot(a.x - b.x, a.y - b.y) > 45) fail(`HarderToMakeProgressV3: pooled question too fast at f${f}`);
    QS.forEach((q, i) => {
      if (f < q.born || f > q.arrive) return;
      const c = toScreen(CAM[f], qAt(q, f).x, qAt(q, f).y);
      const d = toScreen(CAM[f - 1], qAt(q, f - 1).x, qAt(q, f - 1).y);
      if (Math.hypot(c.x - d.x, c.y - d.y) > 45) fail(`HarderToMakeProgressV3: question ${i} too fast at f${f}`);
    });
  }
  // the touch lands in the content band, with the model's lower half in frame
  const t = toScreen(CAM[TOUCH], Q.x, RIM_Y);
  if (t.y < 700 || t.y > 1300) fail(`HarderToMakeProgressV3: touch at screen y ${t.y.toFixed(0)}`);
})();
const PROBE = typeof process !== "undefined" && !!process.env?.OUTGROW_PROBE;
if (PROBLEMS.length && !PROBE) throw new Error(PROBLEMS.slice(0, 6).join("\n"));
export { CAM };

export const HarderToMakeProgressV3: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = CAM[frame];
  const k = cam.k;
  const pr = poolR(frame);
  const pp = poolAt(frame);
  const tw = frame - TOUCH;
  const { work, done, tone } = solveAt(tw, W);
  const ta = frame - pourStart;
  const pourE = Math.pow(clamp01(ta / POUR_F), 1.6);
  const Rm = modelR(frame);
  const poolDraw = {
    x: lerp(pp.x, M.x, pourE * 0.85),
    y: lerp(pp.y, M.y, pourE * 0.85),
    r: pr * (1 - 0.65 * pourE),
    op: 1 - smoothstep((ta - POUR_F * 0.35) / (POUR_F * 0.65)),
  };
  const touching = frame >= TOUCH;
  return (
    <Stage frame={frame} cam={cam} rest={CAM[0]}>
      {CROWD.map((p, i) => (
        <Person key={i} k={k} x={p.x} y={p.y} lift={sendLift(frame - QS[i].born - 2)} />
      ))}
      {QS.map((q, i) => {
        if (frame < q.born) return null;
        const p = qAt(q, frame);
        const into = smoothstep((frame - q.arrive) / 5);
        if (into >= 1) return null;
        const bornA = easeOut((frame - q.born) / 10);
        const u = clamp01((frame - q.born) / (q.arrive - q.born));
        return (
          <QRing
            key={i}
            x={lerp(p.x, Q.x, into * 0.5)}
            y={lerp(p.y, Q.y, into * 0.5)}
            r={q.r * (0.7 + 0.3 * bornA) * (1 - 0.5 * into)}
            k={k}
            opacity={bornA * (1 - into)}
            tilt={floatTilt(u, i)}
          />
        );
      })}
      {!touching && pr > 0 ? (
        <QRing x={pp.x} y={pp.y} r={pr} k={k} tilt={frame < RISE0 ? 0 : floatTilt((frame - RISE0) / (TOUCH - RISE0), 2)} />
      ) : null}
      <ModelMark k={k} x={M.x} y={M.y} em={emOfR(Rm)} />
      {touching && poolDraw.op > 0 ? (
        <QRing x={poolDraw.x} y={poolDraw.y} r={poolDraw.r} k={k} work={work} done={done} tone={tone} opacity={poolDraw.op} />
      ) : null}
    </Stage>
  );
};

export default HarderToMakeProgressV3;
