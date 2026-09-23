import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FeedRing,
  MODEL_EM_FULL,
  ModelMark,
  Person,
  PERSON_TOP,
  QRing,
  Stage,
  cameraTrack,
  camJerk,
  contactDist,
  emOfR,
  hash,
  markR,
  runFeed,
  toScreen,
} from "./outgrowShared";

// ---------------------------------------------------------------------------
// TooEasyV3 — Noam_Challenge_The_Model, cut 1 (V3), in-point 0:01.340.
// "that as the models become smarter and smarter, the kinds of questions we
//  can ask them, a lot of them are too easy"
// 140 f of speech (round((7.160 - 1.340) * 24)) + 16 f tail = 156 f.
//
// WORD -> FRAME (onset, from graphics/words.srt, frame = round((t - 1.340) * 24)):
//   that 0 · as 14 · the 23 · models 27 · become 35 · smarter 43 · and 49 ·
//   smarter 53 · the 64 · kinds 68 · of 74 · questions 78 · we 86 · can 90 ·
//   ask 92 · them 98 · a 106 · lot 108 · of 110 · them 112 · are 114 ·
//   too 118 · easy 131 · (and 140)
//
// THE PICTURE: one continuous feed. People's questions rise to the model; the
// model works each one (orange arc) and, while a question is big against it,
// pours it in and GROWS. It grows ten-fold, the camera pulls back to keep it,
// and by "too easy" every question people can write is a speck against it:
// ticked on contact and let go. Nothing is timed: R(f) is the law run over the
// schedule of touches (outgrowShared.runFeed).
//
// GESTURES (each with the word it serves):
//   f0     tight (k 2.3) on a SMALL model already working three questions bigger
//          than it ............................................... "that" (mid-motion)
//   f14-60 the first pours land, the mark swells step by step ..... "models become
//          smarter and smarter" (swells land ~f26, ~f45, ~f55)
//   f4-112 ONE long pull-back (k 2.3 -> 0.74), two overlapping glides, keeping
//          the growing mark framed ................................ "smarter and smarter"
//   f60-98 the pull-back finds the people the questions come from . "the kinds of
//          questions we can ask them"
//   f100+  every question now snaps solved in 7-10 f and is let go: white, dim,
//          peeling off the rim ................................... "a lot of them are too easy"
//   f110-156 slow continuing drift of the camera; the feed keeps coming (ends
//          mid-motion: two questions on the way, one peeling off)
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 156;

export const schema = z.object({});
export const defaultProps = schema.parse({});

export const M = { x: 540, y: 760 };
const EM0 = 90;
const R0 = markR(EM0);

// The people: one organic double row, centred.
export const PEOPLE = [
  { x: 190, y: 1590 },
  { x: 290, y: 1545 },
  { x: 380, y: 1600 },
  { x: 470, y: 1550 },
  { x: 560, y: 1605 },
  { x: 650, y: 1548 },
  { x: 740, y: 1598 },
  { x: 830, y: 1552 },
  { x: 915, y: 1595 },
].map((p, i) => ({ x: p.x + (hash(i, 3) - 0.5) * 18, y: p.y + (hash(i, 5) - 0.5) * 12 }));

// The schedule: [touch frame, r, contact angle (deg; 90 = straight below), person index, bow].
// Touch frames and sizes are authored (BASE); angle, sender and bow were chosen by a
// clearance search (scratch _plan1.ts) so no two live questions ever overlap.
// Early questions are BIG against the mark and take the full 40-frame sweep;
// as it grows they go faster, and from ~f100 they are all too easy.
export const BASE: [number, number][] = [
  [-34, 56], [-12, 52], [6, 60], [22, 48], [32, 58], [42, 54], [52, 60], [61, 50], [70, 56], [80, 52], [89, 56],
  [99, 48], [104, 56], [109, 44], [114, 52], [119, 60], [124, 46], [129, 54], [134, 50], [139, 58], [144, 44],
  [149, 52], [154, 56],
];
const SCHEDULE: [number, number, number, number, number][] = [
  [-34, 56, 90, 1, -90],
  [-12, 52, -36, 4, -90],
  [6, 60, 207, 0, -90],
  [22, 48, 27, 5, 90],
  [32, 58, 117, 1, 0],
  [42, 54, 72, 3, 45],
  [52, 60, 162, 0, -90],
  [61, 50, -27, 8, 90],
  [70, 56, 45, 5, 90],
  [80, 52, 90, 5, -90],
  [89, 56, 126, 0, 0],
  [99, 48, 9, 8, 90],
  [104, 56, 63, 8, -45],
  [109, 44, 99, 2, -90],
  [114, 52, 81, 4, 45],
  [119, 60, 144, 0, -90],
  [124, 46, 36, 8, 0],
  [129, 54, 126, 0, 0],
  [134, 50, 207, 0, -90],
  [139, 58, 90, 5, -90],
  [144, 44, 63, 6, 0],
  [149, 52, -9, 5, -90],
  [154, 56, 45, 8, 90],
];

// Flight time from distance, so no question outruns the speed cap even in the
// k 2.3 close-up: the contact point is estimated from where the model will be.
const R_EST = (t: number) => R0 + 390 * Math.min(1, Math.max(0, (t + 20) / 120));
export const mkRing = (t: number, r: number, a: number, pi: number, bow: number): FeedRing => {
  const p = PEOPLE[pi];
  const bx = p.x;
  const by = p.y + PERSON_TOP() - r - 12;
  const th = (a * Math.PI) / 180;
  const D = contactDist(R_EST(t), r);
  const dist = Math.hypot(M.x + Math.cos(th) * D - bx, M.y + Math.sin(th) * D - by) + Math.abs(bow);
  const fly = Math.max(46, Math.ceil(dist / 8.5));
  return { r, bx, by, bornF: t - fly, touchF: t, angle: a, bow };
};

export const RINGS: FeedRing[] = SCHEDULE.map(([t, r, a, pi, bow]) => mkRing(t, r, a, pi, bow));

const FEED = runFeed(M, R0, RINGS, -120, DURATION + 2);

// ---------------------------------------------------------------------------
// Camera: open tight, one long pull-back made of two overlapping glides, then
// a slow drift that is still moving on the last frame.
// ---------------------------------------------------------------------------
const CAM = cameraTrack(
  { x: 540, y: 790, k: 2.3 },
  [
    { f0: 2, f1: 72, k: 1.15, dy: 70, warp: 0.85 },
    { f0: 42, f1: 114, k: 0.74, dy: 150 },
    { f0: 100, f1: 190, k: 0.68, dy: 30 },
  ],
  DURATION,
);

// ---------------------------------------------------------------------------
// ASSERTIONS — the file cannot build wrong.
// ---------------------------------------------------------------------------
export const PROBLEMS: string[] = [];
const fail = (m: string) => {
  PROBLEMS.push(m);
};
(() => {
  // the model reaches the film's full size and stops there
  const Rend = FEED.R(DURATION - 1);
  const emEnd = emOfR(Rend);
  if (Math.abs(emEnd - MODEL_EM_FULL) > 70)
    fail(`TooEasyV3: model ends at em ${emEnd.toFixed(0)}, want ~${MODEL_EM_FULL}`);
  // every touch from f100 on is too easy; everything before it learned
  FEED.verdict.forEach((v, i) => {
    const t = RINGS[i].touchF;
    if (t < 98 && v.easy) fail(`TooEasyV3: ring ${i} (touch f${t}) was too easy before "too easy"`);
    if (t >= 100 && !v.easy) fail(`TooEasyV3: ring ${i} (touch f${t}) still learned after f100`);
  });
  // camera smoothness
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`TooEasyV3: camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  // no two live rings overlap on screen (flights and work), and none leaves the
  // sides of the frame while it matters; speed cap on flights
  for (let f = 0; f < DURATION; f++) {
    const st = FEED.at(f);
    const c = CAM[f];
    const live = st
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => (s.phase === 0 || s.phase === 1) && s.op > 0.4);
    for (let a = 0; a < live.length; a++)
      for (let b = a + 1; b < live.length; b++) {
        const A = live[a].s;
        const B = live[b].s;
        const d = Math.hypot(A.x - B.x, A.y - B.y);
        if (d < A.r + B.r + 2)
          fail(`TooEasyV3: rings ${live[a].i} and ${live[b].i} overlap at f${f} (d ${d.toFixed(0)})`);
      }
    if (f > 0) {
      const prev = FEED.at(f - 1);
      st.forEach((s, i) => {
        if (s.phase !== 0 || prev[i].phase !== 0) return;
        const a = toScreen(c, s.x, s.y);
        const b = toScreen(CAM[f - 1], prev[i].x, prev[i].y);
        const v = Math.hypot(a.x - b.x, a.y - b.y);
        if (v > 45) fail(`TooEasyV3: ring ${i} moves ${v.toFixed(0)} px at f${f}`);
      });
    }
  }
  // final framing: the whole mark and the people inside the caption-safe band
  const cEnd = CAM[DURATION - 1];
  const top = toScreen(cEnd, M.x, M.y - 0.5 * emEnd).y;
  const feet = toScreen(cEnd, 540, 1605 + 59).y;
  if (top < 150 || feet > 1360)
    fail(`TooEasyV3: end frame spans ${top.toFixed(0)}..${feet.toFixed(0)}`);
  void contactDist;
})();
const PROBE = typeof process !== "undefined" && !!process.env?.OUTGROW_PROBE;
if (PROBLEMS.length && !PROBE) throw new Error(PROBLEMS.slice(0, 6).join("\n"));
export { FEED, CAM };

export const TooEasyV3: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = CAM[frame];
  const k = cam.k;
  const R = FEED.R(frame);
  const em = emOfR(R);
  const st = FEED.at(frame);
  const idx = st.map((s, i) => ({ s, i }));
  const under = idx.filter(({ s }) => s.phase === 0 || s.phase === 2);
  const over = idx.filter(({ s }) => s.phase === 1 || s.phase === 3);
  const ring = ({ s, i }: { s: (typeof st)[number]; i: number }) => (
    <QRing key={i} x={s.x} y={s.y} r={s.r} k={k} work={s.work} done={s.done} tone={s.tone} opacity={s.op} />
  );
  return (
    <Stage frame={frame} cam={cam} rest={CAM[0]}>
      {PEOPLE.map((p, i) => (
        <Person key={i} k={k} x={p.x} y={p.y} />
      ))}
      {under.map(ring)}
      <ModelMark k={k} x={M.x} y={M.y} em={em} />
      {over.map(ring)}
    </Stage>
  );
};

export default TooEasyV3;
