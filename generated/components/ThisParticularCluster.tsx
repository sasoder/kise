import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DOT_RADIUS,
  GridBackground,
  OP_READ,
  OP_RECEDE,
  OP_UNREAD,
  Vignette,
  breath,
  clamp,
  hash,
  idleThreads,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Ajeya, the interviewer coming back on it:
//   "[they] gained administrator access to this particular research cluster."
// SRT `Ajeya_The_Hack_c10_p0.5.srt`. "they" is the tail of the previous chunk
// and has no separate timing, so the composition starts on the onset of
// "gained", t = 40.460s; speech ends at t = 43.299s.
//   round((43.299 - 40.460) * 24) = round(2.839 * 24) = round(68.1) = 68
// frames of speech, + 16 frame tail so the resolved state holds = 84.
export const DURATION = 84;

// THIS CUT REPRISES `AdminAccessToTheCluster.tsx`. It is the same clip, the
// same field, the same crowd, the same mesh, the same breached node and the
// same cluster box — every constant below is copied from that file rather than
// re-derived, because the two are cut into one edit and the geometry has to be
// identical. It opens on that piece's WIDE HOLD (k 0.93, cy 1821) with the
// world already in the state that piece left it in: the mesh possessed and
// accent, the line of access held from the crowd to the breached node, the
// crowd relaxed at the unread rung with its short traffic still running. The
// box does not exist yet — the line names it again, so it is drawn again.
//
// Word onsets, at 24fps, measured from composition start: f = round((t-40.460)*24)
//     f0   "gained"          f50  "research"
//     f11  "administrator"   f59  "cluster"
//     f25  "access to this"  f68  speech ends
//     f42  "particular"
//
// Under three seconds: three gestures and one camera move, nothing else.
//   G1 the ring closes on the breached node, f2-f15, with the one overshoot in
//      the piece, its bounce landing on the word
//                                          — "gained administrator access" f0-25
//   G2 singling out: everything except the ringed node and the held line of
//      access recedes — the mesh's nodes and edges OP_READ -> OP_RECEDE and the
//      crowd OP_UNREAD -> OP_RECEDE, f26-f44 — while the one camera move pushes
//      in on the node                             — "to this particular" f25-50
//   G3 the breached node opens into the cluster box on its leader, head-led,
//      the three edges it holds eaten back to the walls it crosses, the click
//      on close landing on the word, and the machines filling it f56-68; the
//      node ends up as one of the machines     — "research cluster" f50-68
//   Resolve f68-84: box drawn, machines lit, ring on the node, the line of
//      access still running to the wall, the mesh receded around it, the mark
//      behind. Still, so the next cut can open on this frame.
//
//   The camera: ONE move. Keys f22-f34 push in from the wide hold to the box,
//   k 0.93 -> 1.55, cy 1821 -> 1366. The keys are 4 frames earlier than the
//   brief's f26-f38 because the shared damper lags its keys by ~10 frames
//   (measured: the source cut's f184-196 keys land at f206). At f22-f34 the
//   push is at 98.9% of its travel by "particular" at f42 and dead still after;
//   at f26-f38 it was still visibly moving through the word.
//   The OpenAI mark sits in world space behind everything, static, never
//   animated, exactly as in the source cut.

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  vignette: z.number(),
  dotRadius: z.number(),
  markSrc: z.string(), // the OpenAI mark, white on alpha
  markSize: z.number(), // world px, square
  markOpacity: z.number(), // how far the mark sits back
  markBlur: z.number(), // world px of blur, so it reads as depth not as a layer
  threads: z.number(), // the crowd's idle traffic, already relaxed
  beats: z.object({
    gained: z.number(), // "gained"
    administrator: z.number(), // "administrator"
    accessToThis: z.number(), // "access to this"
    particular: z.number(), // "particular"
    research: z.number(), // "research"
    cluster: z.number(), // "cluster"
    speechEnds: z.number(), // speech ends
  }),
});

export type Props = z.infer<typeof schema>;

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2600;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clampi = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const len = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y);
const lerpP = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// ---------------------------------------------------------------------------
// The crowd — copied from AdminAccessToTheCluster, seat for seat: the field's
// own step, 58 x 96 of them, the same jitter off the same hash salts, so the
// two cuts are the same population and not two draws of one idea.
//
// It is 58 x 96 rather than 42 x 60 because the field has to FILL THE FRAME to
// the sides and underneath on every frame of all three cuts. At the k 0.93 wide
// hold the 42 x 60 slab ended on a ruled line left, right and below, with bare
// grid beyond it. Same step, same salts, same jitter law, same cx and the same
// top — only the count changes, so it is still one population across the cuts.
//
// The count is DERIVED. Each piece's camera was run frame by frame with the
// shared damper AND `sway` included and the union of every visible world
// rectangle taken:
//   AdminAccessToTheCluster  f0..300  x -43.6..1123.8  y 610.0..2858.3
//   ThisParticularCluster    f0..83   x -40.6..1123.1  y 741.9..2857.8
//   QuicklyShutDown          f0..209  x -43.6..1127.8  y 746.6..2867.6
// The widest frames are the damped k 0.93 holds — admin's minimum k is 0.9297
// at f34, shutdown's 0.9234 at f39, particular's 0.93 at f0.
//
// 58 x 96 seats on the same step, on the same cx 540 and the same top 1555,
// give a nominal lattice of x -146.9..1226.9 and y 1555..2996.4. Even with every
// seat jittered the full 45% of a step INWARD the field still reaches
// x -136.1..1216.1 and down to y 2989.6, so the overrun past the visible
// rectangle is, per piece (left / right / bottom):
//   admin       92.4 / 92.2 / 131.2
//   particular  95.4 / 93.0 / 131.7
//   shutdown    92.4 / 88.3 / 121.9
// — never under the 80 world px rule, so there is no crowd edge on the left,
// the right, the bottom or in any corner on any frame of any of the three cuts.
// The TOP edge is the one deliberate boundary and does not move: the cluster box
// is framed against it.
//
// Identical in AdminAccessToTheCluster, ThisParticularCluster and
// QuicklyShutDown, seat for seat — the three cut into each other.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39; // 24.10 — the field's step, identical across cuts
const STEP_Y = 440 / 29; // 15.17
const COLS = 58;
const ROWS = 96;
const N = COLS * ROWS;
const CROWD = { cx: 540, top: 1555, w: (COLS - 1) * STEP_X, h: (ROWS - 1) * STEP_Y };
const CROWD_POS = Array.from({ length: N }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    x: CROWD.cx + (c - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9,
    y: CROWD.top + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9,
    r: 0.75 + 0.5 * hash(i, 13),
  };
});

// Where the relaxed traffic still aims: the band between the crowd and the mesh.
const BUNDLE: P = { x: 540, y: 1489 };

// ---------------------------------------------------------------------------
// OpenAI's internal network, exactly as the source cut left it: eleven nodes,
// eighteen edges, node 10 the breached one hanging down toward the crowd. Here
// the whole mesh is already possessed at frame 0 — this cut comes after the
// events it restates — so nothing draws in and nothing spreads.
// ---------------------------------------------------------------------------
const BREACHED = 10;
const NODES: P[] = [
  { x: 196, y: 998 }, // 0
  { x: 352, y: 930 }, // 1
  { x: 516, y: 958 }, // 2
  { x: 676, y: 926 }, // 3
  { x: 900, y: 992 }, // 4
  { x: 232, y: 1086 }, // 5
  { x: 452, y: 1030 }, // 6
  { x: 668, y: 1018 }, // 7
  { x: 866, y: 1112 }, // 8
  { x: 212, y: 1140 }, // 9
  { x: 540, y: 1310 }, // 10 — the breached node
];
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 5],
  [5, 9],
  [5, 6],
  [9, 6],
  [10, 6],
  [10, 7],
  [10, 8],
  [6, 1],
  [6, 2],
  [6, 7],
  [7, 3],
  [7, 4],
  [7, 8],
  [8, 4],
  [8, 3],
];
const NODE_R = 9;

// Whose network it is. Same point, same size, same 0.3 — static, behind
// everything, present from frame 0, never a gesture.
const MARK: P = { x: 540, y: 1070 };

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  vignette: 0.45,
  dotRadius: DOT_RADIUS,
  markSrc: "openai-chatgpt-logo.png",
  markSize: 520,
  markOpacity: 0.3,
  markBlur: 7,
  threads: idleThreads(N),
  beats: {
    gained: 0,
    administrator: 11,
    accessToThis: 25,
    particular: 42,
    research: 50,
    cluster: 59,
    speechEnds: 68,
  },
});

// ---------------------------------------------------------------------------
// The cluster the breached node opens into: 370 x 250, the node inside it 100
// above the bottom edge. Same box, same machines, same seat dropped for the
// node — copied, not re-derived.
// ---------------------------------------------------------------------------
const BOX = { x0: 355, x1: 725, y0: 1160, y1: 1410 };

const MACHINE_ROWS = [
  { y: 1226, n: 7, x0: 398, x1: 682, salt: 17 },
  { y: 1284, n: 7, x0: 392, x1: 688, salt: 41 },
  { y: 1342, n: 6, x0: 416, x1: 664, salt: 63 },
];
const MACHINES: { x: number; y: number; r: number }[] = (() => {
  const all: P[] = [];
  MACHINE_ROWS.forEach((row, ri) => {
    const step = (row.x1 - row.x0) / (row.n - 1);
    for (let i = 0; i < row.n; i++) {
      const s = ri * 31 + i;
      all.push({
        x: row.x0 + i * step + (hash(s, row.salt) - 0.5) * step * 0.8,
        y: row.y + (hash(s, row.salt + 1) - 0.5) * 36,
      });
    }
  });
  let seat = 0;
  all.forEach((p, i) => {
    if (len(p, NODES[BREACHED]) < len(all[seat], NODES[BREACHED])) seat = i;
  });
  return all
    .filter((_, i) => i !== seat)
    .map((p, i) => ({ ...p, r: 0.75 + 0.5 * hash(i, 77) }))
    .sort((a, b) => len(a, NODES[BREACHED]) - len(b, NODES[BREACHED]));
})();

// The box's own path: it starts AT the breached node, runs down to the box's
// bottom edge and then round, so the box is seen issuing from the node rather
// than appearing beside it. The leader is spent once the box closes and goes.
const BOX_PATH: P[] = [
  { x: NODES[BREACHED].x, y: NODES[BREACHED].y },
  { x: NODES[BREACHED].x, y: BOX.y1 },
  { x: BOX.x1, y: BOX.y1 },
  { x: BOX.x1, y: BOX.y0 },
  { x: BOX.x0, y: BOX.y0 },
  { x: BOX.x0, y: BOX.y1 },
  { x: NODES[BREACHED].x, y: BOX.y1 },
];
const BOX_SEG = BOX_PATH.slice(1).map((p, i) => len(BOX_PATH[i], p));
const BOX_TOTAL = BOX_SEG.reduce((a, b) => a + b, 0);
const BOX_LEADER = BOX_SEG[0];

// ---------------------------------------------------------------------------
// The line of access. In the source cut this was the third probe — the one that
// held — and it has been held ever since, so here it is simply present from
// frame 0: same launch point just inside the crowd's top edge, same two control
// points, same landing on the breached node, same route round the left of where
// the rack was. It never animates. When the box opens it ends on the wall.
// ---------------------------------------------------------------------------
const PROBE_FROM: P = { x: BUNDLE.x, y: CROWD.top + 16 };
const HELD = { c1: { x: 260, y: 1550 }, c2: { x: 238, y: 1330 } };
const bez = (p0: P, c1: P, c2: P, p1: P, t: number): P => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  };
};
const HELD_PTS = Array.from({ length: 41 }, (_, i) =>
  bez(PROBE_FROM, HELD.c1, HELD.c2, NODES[BREACHED], i / 40),
);

// A polyline drawn head-first, by fraction of its own length.
const partial = (pts: P[], t: number) => {
  const segs = pts.slice(1).map((p, i) => len(pts[i], p));
  const total = segs.reduce((a, b) => a + b, 0);
  let want = clamp01(t) * total;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let head = pts[0];
  for (let i = 0; i < segs.length; i++) {
    if (want >= segs[i]) {
      want -= segs[i];
      head = pts[i + 1];
      d += ` L ${head.x.toFixed(1)} ${head.y.toFixed(1)}`;
    } else {
      head = lerpP(pts[i], pts[i + 1], segs[i] === 0 ? 0 : want / segs[i]);
      d += ` L ${head.x.toFixed(1)} ${head.y.toFixed(1)}`;
      break;
    }
  }
  return { d, head };
};

// Where the held line meets the cluster wall, as a fraction of its own length.
const inBox = (p: P) => p.x >= BOX.x0 && p.x <= BOX.x1 && p.y >= BOX.y0 && p.y <= BOX.y1;
const HOLD_T = (() => {
  const segs = HELD_PTS.slice(1).map((p, i) => len(HELD_PTS[i], p));
  const total = segs.reduce((a, b) => a + b, 0);
  let run = 0;
  for (let i = 0; i < HELD_PTS.length; i++) {
    if (inBox(HELD_PTS[i])) return run / total;
    if (i < segs.length) run += segs[i];
  }
  return 1;
})();

// Liang-Barsky: where a mesh edge lies INSIDE the cluster, as a t-interval.
const boxHit = (A: P, B: P): [number, number] | null => {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  let t0 = 0;
  let t1 = 1;
  const slab = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!slab(-dx, A.x - BOX.x0)) return null;
  if (!slab(dx, BOX.x1 - A.x)) return null;
  if (!slab(-dy, A.y - BOX.y0)) return null;
  if (!slab(dy, BOX.y1 - A.y)) return null;
  return t1 <= t0 ? null : [t0, t1];
};
const EDGE_IN_BOX = EDGES.map(([a, b]) => boxHit(NODES[a], NODES[b]));
// What is still drawn of an edge as the box opens: the two ends part from the
// middle of the crossing and end up on the two walls.
const visibleSpans = (i: number, g: number): [number, number][] => {
  const h = EDGE_IN_BOX[i];
  if (!h || g <= 0.001) return [[0, 1]];
  const m = (h[0] + h[1]) / 2;
  const out: [number, number][] = [];
  const e0 = m + (h[0] - m) * g;
  const s1 = m + (h[1] - m) * g;
  if (e0 > 0.002) out.push([0, e0]);
  if (s1 < 0.998) out.push([s1, 1]);
  return out;
};

// Camera: ONE move. Opens on the source cut's wide hold and pushes in on the
// box, exactly the state that cut pushed to.
//   mesh top 917 .. crowd bottom 2457 -> 1687 + 134 = 1821 at k 0.93
//   box 1160 .. 1410                  -> 1285 +  81 = 1366 at k 1.55
// so the content block sits on screen y 835 at both ends, above the captions.
const CAM_F = [0, 22, 34, DURATION];
const CAM_CY = [1821, 1821, 1366, 1366];
const CAM_K = [0.93, 0.93, 1.55, 1.55];

const ThisParticularCluster: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  vignette,
  dotRadius,
  markSrc,
  markSize,
  markOpacity,
  markBlur,
  threads,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- G1: the ring closes on the breached node ------------------------------
  // The one overshoot in the piece. Keyed f2-f15 so that the bounce — which
  // peaks at ~66% of an Easing.out(back(1.6)) — lands on "administrator" at
  // f11, and the ring settles four frames later. It stays for the rest of the
  // piece: the resolve is the ringed node inside the drawn cluster.
  const ringF0 = beats.gained + 2;
  const ringT = interpolate(frame, [ringF0, ringF0 + 13], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });
  const ringR = 110 + (40 - 110) * ringT;

  // -- G2: singling out ------------------------------------------------------
  // Everything but the ringed node and the line of access drops a rung.
  const recede = interpolate(frame, [beats.accessToThis + 1, beats.particular + 2], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const meshOp = OP_READ + (OP_RECEDE - OP_READ) * recede;
  // The crowd is one layer, dots and traffic together, and it moves from the
  // unread rung to the receded one as a layer. Its traffic keeps running: it is
  // texture under the action, and it is the only thing still moving during the
  // camera's push.
  const crowdScale = 1 - (1 - OP_RECEDE / OP_UNREAD) * recede;

  // -- G3: the node opens into the cluster -----------------------------------
  const boxDraw = interpolate(frame, [beats.research, beats.cluster], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const boxClick = interpolate(
    frame,
    [beats.cluster - 1, beats.cluster + 1, beats.cluster + 5],
    [0, 1, 0],
    clamp,
  );
  const leaderOp =
    1 -
    interpolate(frame, [beats.cluster, beats.cluster + 8], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
  // Nineteen machines fill the box from the node outward across f56-f68.
  const machStagger = 6 / (MACHINES.length - 1);
  const machineIn = MACHINES.map((_, i) =>
    interpolate(
      frame,
      [beats.cluster - 3 + i * machStagger, beats.cluster + 3 + i * machStagger],
      [0, 1],
      { ...clamp, easing: Easing.out(Easing.cubic) },
    ),
  );

  // -- the crowd's traffic ---------------------------------------------------
  // The relaxed state the source cut ends on and never leaves: a third of the
  // idle reach, ambient opacity, aim still narrowed onto the bundle point, no
  // escalation, so the clock is just the frame.
  const RELAXED_REACH = 1 - 0.66;
  const RELAXED_OP = 0.5 - 0.3;
  const lit = new Float32Array(N);
  const threadEls: {
    key: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    op: number;
    drawn: number;
  }[] = [];
  for (let j = 0; j < threads; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;

    const a0 = Math.floor(hash(seed, 6) * N);
    let ac = a0 % COLS;
    let ar = Math.floor(a0 / COLS);
    const src = CROWD_POS[a0];
    const th = Math.atan2(BUNDLE.y - src.y, BUNDLE.x - src.x);
    const reach = (46 + 62 * hash(seed, 8)) * RELAXED_REACH;
    let bc = ac + Math.round((reach * Math.cos(th)) / STEP_X);
    let br = ar + Math.round((reach * Math.sin(th)) / STEP_Y);
    // If the far end runs off the field, slide the whole thread back inside
    // rather than clamping one end: the aim stays exactly what it was.
    const sc = bc < 0 ? -bc : bc > COLS - 1 ? COLS - 1 - bc : 0;
    const sr = br < 0 ? -br : br > ROWS - 1 ? ROWS - 1 - br : 0;
    ac += sc;
    ar += sr;
    bc += sc;
    br += sr;
    if (ac < 0 || ac > COLS - 1 || ar < 0 || ar > ROWS - 1) continue;
    const a = ar * COLS + ac;
    const b = clampi(br, 0, ROWS - 1) * COLS + clampi(bc, 0, COLS - 1);
    if (a === b) continue;

    const drawn = interpolate(phase, [0, 0.3], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    const A = CROWD_POS[a];
    const B = CROWD_POS[b];
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], drawn * fade);
    threadEls.push({
      key: j,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * drawn,
      y2: A.y + (B.y - A.y) * drawn,
      op: RELAXED_OP * fade * crowdScale,
      drawn,
    });
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = 540 + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const boxHead = partial(BOX_PATH, boxDraw);
  const boxDrawn = BOX_TOTAL * boxDraw;
  const accessEnd = 1 - (1 - HOLD_T) * boxDraw;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          {/* whose network it is. Static, behind everything, never animated. */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: MARK.y - markSize / 2,
              width: markSize,
              height: markSize,
              filter: `brightness(0) invert(1) blur(${markBlur}px)`,
              opacity: markOpacity,
            }}
          />

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the mesh's edges: already possessed, so accent end to end from
                frame 0. They recede with G2 and are eaten back to the
                cluster's wall wherever they cross it as it opens. */}
            {EDGES.map((e, i) => {
              const A = NODES[e[0]];
              const B = NODES[e[1]];
              return (
                <g key={`e${i}`}>
                  {visibleSpans(i, boxDraw).map((sp, s) => {
                    const S = lerpP(A, B, sp[0]);
                    const E = lerpP(A, B, sp[1]);
                    if (sp[1] - sp[0] <= 0.003) return null;
                    return (
                      <line
                        key={`s${s}`}
                        x1={S.x}
                        y1={S.y}
                        x2={E.x}
                        y2={E.y}
                        stroke={accent}
                        strokeWidth={3}
                        strokeLinecap="round"
                        opacity={meshOp}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* the crowd's traffic, relaxed */}
            {threadEls.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.drawn < 1 ? (
                  <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} />
                ) : null}
              </g>
            ))}

            {/* the agents */}
            {CROWD_POS.map((p, i) => {
              const l = lit[i];
              const bre = breath(frame, hash(i, 9));
              const r = dotRadius * p.r * bre * (1 + 0.35 * l);
              const op = (OP_UNREAD + (OP_READ + 0.1 - OP_UNREAD) * l) * crowdScale;
              return <circle key={i} cx={p.x} cy={p.y} r={r} fill={accent} opacity={op} />;
            })}

            {/* the line of access: held since the breach, ending on the
                cluster's wall once the cluster exists. It does not recede. */}
            <path
              d={partial(HELD_PTS, accessEnd).d}
              fill="none"
              stroke={accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={OP_READ}
            />

            {/* the mesh's nodes. All accent, all possessed; all recede with G2
                except the one the ring is on. */}
            {NODES.map((p, i) => (
              <circle
                key={`n${i}`}
                cx={p.x}
                cy={p.y}
                r={NODE_R}
                fill={accent}
                opacity={i === BREACHED ? OP_READ : meshOp}
              />
            ))}

            {/* G1: "gained administrator access" — the ring closes on the
                breached node with the one overshoot in the piece, and stays. */}
            {frame >= ringF0 ? (
              <circle
                cx={NODES[BREACHED].x}
                cy={NODES[BREACHED].y}
                r={ringR}
                fill="none"
                stroke={accent}
                strokeWidth={3.5}
                opacity={OP_READ}
              />
            ) : null}

            {/* G3: "research cluster" — the node opens into the box. The path
                starts AT the node, runs out to the box's bottom edge and then
                round it. That first leg is spent once the box closes, and goes. */}
            {boxDraw > 0 ? (
              <g>
                {leaderOp > 0.01 ? (
                  <line
                    x1={BOX_PATH[0].x}
                    y1={BOX_PATH[0].y}
                    x2={lerpP(BOX_PATH[0], BOX_PATH[1], clamp01(boxDrawn / BOX_LEADER)).x}
                    y2={lerpP(BOX_PATH[0], BOX_PATH[1], clamp01(boxDrawn / BOX_LEADER)).y}
                    stroke={accent}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={OP_READ * leaderOp}
                  />
                ) : null}
                {boxDrawn > BOX_LEADER ? (
                  <path
                    d={
                      partial(
                        BOX_PATH.slice(1),
                        clamp01((boxDrawn - BOX_LEADER) / (BOX_TOTAL - BOX_LEADER)),
                      ).d
                    }
                    fill="none"
                    stroke={accent}
                    strokeWidth={3 + 1.5 * boxClick}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={OP_READ}
                  />
                ) : null}
                {boxDraw < 1 ? (
                  <circle cx={boxHead.head.x} cy={boxHead.head.y} r={5.5} fill={ink} />
                ) : null}
              </g>
            ) : null}

            {/* the machines the cluster holds. The breached node is already
                sitting in one of the seats, so it is one of them. */}
            {MACHINES.map((m, i) =>
              machineIn[i] > 0 ? (
                <circle
                  key={`m${i}`}
                  cx={m.x}
                  cy={m.y}
                  r={dotRadius * m.r * breath(frame, hash(i, 19))}
                  fill={accent}
                  opacity={OP_READ * machineIn[i]}
                />
              ) : null,
            )}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export default ThisParticularCluster;
