import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  OP_DARK,
  OP_READ,
  OP_READ_DOT,
  OP_RECEDE,
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  clamp,
  hash,
  idleThreads,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Ajeya: "agents set their sights on OpenAI internal networks again. This
// culminated in the agents using a series of creative exploits to gain full
// administrative access to a research cluster that supported our virtual
// machine environments."
// SRT `Ajeya_The_Hack_c10_p0.5.srt`. The composition starts on the onset of
// "agents set", t = 1.740s; speech ends at t = 13.619s.
//   round((13.619 - 1.740) * 24) = round(11.879 * 24) = round(285.1) = 285
// frames of speech, + 16 frame tail so the resolved state holds = 301.
export const DURATION = 301;

// Word onsets, at 24fps, measured from composition start: f = round((t-1.740)*24)
//     f0   "agents set"          f133  "exploits"
//     f11  "their sights on"     f145  "to gain full"
//     f31  "openai internal"     f167  "administrative"
//     f54  "networks again"      f180  "access to"
//     f73  "this culminated"     f206  "a research"
//     f89  "in the agents"       f219  "cluster that"
//     f102 "using a"             f240  "supported our"
//     f113 "series of"           f257  "virtual machine"
//     f126 "creative"            f271  "environments"
//                                f285  speech ends
//
// Every gesture in this piece is one of these, and each one is a word:
//   G1 the crowd's own traffic swings round to point up-frame
//                                     — "agents set their sights on"  f0-31
//   G2 the mesh draws in above the crowd, head-led, low edges first;
//      one node on the far side comes in already accent and receded,
//      the residue of the previous visit
//                                     — "OpenAI internal networks again" f31-54
//   G2b the traffic relaxes to a third of its length and to ambient, so
//      it is texture under the action from here on          f31-60
//   G3 the short traffic narrows onto one point above the crowd, tempo
//      and count on one escalation curve — "this culminated in the agents" f73-102
//   G4 three probes leave the crowd on three arcs, overlapping so they
//      read as three; two glance off a node and visibly retreat while
//      that node drops to receded; the third holds and its thread stays
//                                     — "using a series of creative exploits" f102-145
//      (probe 1 f102-112 -> node 9, probe 2 f107-117 -> node 8,
//       probe 3 f132-142 -> the breached node)
//   G5 a ring closes on the held node, then possession spreads outward
//      along the mesh's own edges     — "to gain full administrative access" f145-206
//   G6 the breached node opens into the cluster box on a leader path; the box
//      is 370 x 250, narrower than the mesh, so it is a container standing
//      inside the network rather than a banner draped across it; the three
//      edges the breached node still holds are eaten back to its wall; the box
//      fills with a scatter of 16 machines — "a research cluster that" f206-240
//   G7 a rack of six ink units of six decisively different widths is revealed
//      on short connectors under the box — OpenAI's machines, what was at
//      stake, revealed and not taken — "supported our virtual machine
//                                        environments"                f240-285
//   The OpenAI mark sits in world space behind all of it, 600 square, centred
//      on the mesh at (540, 1100) and clear of the crowd's top edge. It is the
//      word "OpenAI" and nothing else: a static backdrop, present from frame 0,
//      which never fades in, scales, rotates or brightens. It is behind the
//      mesh, the box, the rack, the probes and the crowd and in front of the
//      grid, so it takes the camera's move, parallax and sway like everything
//      else in the world and is a place marker rather than a gesture. Its 0.5
//      is a client instruction and the one exception to the ladder.
//   The camera: three moves, each on a word. Pull-back keyed f5-17 (lands
//   f26) opens the space "OpenAI internal networks" draws into; push-in keyed
//   f184-196 (lands f206) is "a research cluster"; settle keyed f214-226
//   (lands f236) frames box and rack for "supported our".
// Nothing else moves. The residue node never animates and never brightens.
//
// ORANGE PASS — a grade, and nothing else. The accent is fieldShared's two-tone
// orange (ACCENT #FFB000 ripe, ACCENT_DEEP #D98A0C deep) instead of the old
// cyan, an agent dot is SOLID and carries its state as colour rather than as
// transparency, the background sits at BG_DIM 0.45 and the drop shadow at
// 2 / 7 / 0.12 — every one of them taken from fieldShared so a future re-grade
// propagates. The ladder is extended below ACCENT_DEEP for the dark rungs: see
// THE GRADE'S LOW END below. Not one beat, camera key, world coordinate, count,
// stroke weight or curve moved; only what a number means at the end of it.

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
  accentDeep: z.string(), // deep: an unread dot
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
  threads: z.number(), // the crowd's idle traffic
  beats: z.object({
    agentsSet: z.number(), // "agents set"
    theirSightsOn: z.number(), // "their sights on"
    openaiInternal: z.number(), // "OpenAI internal"
    networksAgain: z.number(), // "networks again"
    thisCulminated: z.number(), // "this culminated"
    inTheAgents: z.number(), // "in the agents"
    usingA: z.number(), // "using a"
    seriesOf: z.number(), // "series of"
    creative: z.number(), // "creative"
    exploits: z.number(), // "exploits"
    toGainFull: z.number(), // "to gain full"
    administrative: z.number(), // "administrative"
    accessTo: z.number(), // "access to"
    aResearch: z.number(), // "a research"
    clusterThat: z.number(), // "cluster that"
    supportedOur: z.number(), // "supported our"
    virtualMachine: z.number(), // "virtual machine"
    environments: z.number(), // "environments"
    speechEnds: z.number(), // speech ends
  }),
});

export type Props = z.infer<typeof schema>;

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2600;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const clampi = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const len = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y);
const lerpP = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// ---------------------------------------------------------------------------
// THE GRADE'S LOW END. Identical in all five cuts of this clip, and in nothing
// else: `fieldShared` is owned elsewhere and is only consumed here.
//
// fieldShared's ladder for an agent dot is ACCENT_DEEP -> ACCENT: a dot is
// SOLID and carries its state as COLOUR, because the accent over the grid at
// any opacity below 1 desaturates into the field and reads as a wash. Both of
// those tones are bright oranges, so that ladder as shipped can say "unread"
// but it cannot say "wiped" or "hidden" — and the darkenings are the strongest
// images in these five cuts (three dark pockets in a lit field; an ink front
// dropping a whole crowd as it passes; nodes receding out of the subject).
//
// So the ladder is extended DOWNWARD by one more tone: ACCENT_SHADE, the deep
// tone carried SHADE_MIX of the way to BG_BASE. Same hue, one shade further
// down, and — the point — darker than the grid itself, so a dark agent is a
// HOLE in the field rather than a faded copy of it. Measured as relative luma
// over the grid at BG_DIM 0.45 (field #727272, 114 of 255):
//     ACCENT       180   lit        ACCENT_SHADE           77   dark, solid
//     ACCENT_DEEP  146   unread     ACCENT at OP_DARK     124   dark, by alpha
// The cyan pass over its darker field (0.32, field 82) had read -> dark = 79
// and unread -> dark = 41. Solid ACCENT_SHADE gives 103 and 69. Keeping
// OPACITY for the dark rungs would have given 49 and 21 — under a third of the
// old gesture — which is what the 32-point brighter field costs, and why the
// low end had to become colour rather than alpha.
//
// `rung(op)` maps the OLD opacity ladder onto that colour ladder, so every
// interpolation, curve, stagger and beat in this file is untouched: only what
// the number MEANS at the end of it has changed. The anchors are fieldShared's
// own rungs — OP_DARK -> ACCENT_SHADE, OP_UNREAD -> ACCENT_DEEP, OP_RECEDE
// between those two, and OP_READ + 0.1 -> ACCENT ("the subject; +0.1 when a
// thread is on it"), which leaves OP_READ itself just under ripe so a thread
// landing on a dot still has somewhere to go. The dot is then drawn at
// OP_UNREAD_DOT / OP_READ_DOT, which are 1: solid, whatever it knows. An
// ARRIVAL fade stays an opacity — a dot fading in is not a dot in a state.
//
// LINES are untouched and stay on fieldShared's own rule: a thread, a probe, a
// ring, a mesh edge, a box wall is ripe ACCENT at its own line opacity. Only
// dots take the colour ladder.
// ---------------------------------------------------------------------------
const SHADE_MIX = 0.62; // how far ACCENT_DEEP is carried toward BG_BASE
const OP_LIT = OP_READ + 0.1; // the top of the ladder: a dot with a thread on it
const OP_DOT = Math.max(OP_UNREAD_DOT, OP_READ_DOT); // fieldShared holds both dot
// rungs at 1 — a dot is opaque whatever it knows, and the state is in the tone.
// Taken off both rather than assumed, so a future re-grade that parts them shows
// up here rather than silently on one rung.
const hexMix = (a: string, b: string, t: number) => {
  const A = parseInt(a.replace("#", ""), 16);
  const B = parseInt(b.replace("#", ""), 16);
  const ch = (sh: number) =>
    Math.round(((A >> sh) & 255) + ((((B >> sh) & 255) - ((A >> sh) & 255)) * t))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
// Built once per render: a field is thousands of dots and every one of them
// asks for its colour every frame. `makeTone` quantises each half to 64 steps.
const makeRung = (deep: string, ripe: string, base: string) => {
  const hi = makeTone(deep, ripe);
  const lo = makeTone(hexMix(deep, base, SHADE_MIX), deep);
  return (op: number) =>
    op >= OP_UNREAD
      ? hi((op - OP_UNREAD) / (OP_LIT - OP_UNREAD))
      : lo((op - OP_DARK) / (OP_UNREAD - OP_DARK));
};

// ---------------------------------------------------------------------------
// The world, bottom to top. The crowd is OpenAI's agents at exactly the field's
// step — 940/39 across, 440/29 down, the same in every cut. The band between
// its top edge and the mesh's lowest node is 245 world px: enough for the
// 250-tall cluster and the rack under it to drop into it without the resolve
// ever crowding the field, and no more.
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
// and the VM rack are framed against it.
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

// Where the converging traffic aims: the band between the crowd and the mesh.
const BUNDLE: P = { x: 540, y: 1489 };

// ---------------------------------------------------------------------------
// OpenAI's internal network: eleven nodes, eighteen edges. Wider than it is
// tall (704 x 214 through the ten upper nodes) and roughly flat-topped, so it
// never reads as a roof; twelve of the eighteen edges cross the interior, and
// the outer chain is deliberately broken at the bottom-left and the top-right
// so it is a mesh rather than one perimeter ring with spokes. Nodes 6 and 7 are
// hubs; 4 and 9 are outliers that connect inward. Spacing is uneven throughout
// — variety over lattice.
//
// Every node but one sits ABOVE y 1160, which is where the cluster's top wall
// will be, so the mesh ends up standing over and around the box rather than
// draped across it. The exception is node 10 at (540, 1310): the lowest node,
// dead centre, hanging down toward the crowd on the mesh's three longest edges,
// so the push-in on it needs no horizontal camera move and the box it opens
// into has the whole network above it. Node 3 is the residue: it draws in
// already accent, at the receded rung, and never changes again. That is
// "again" — a mark left by the previous visit, one quiet element instead of a
// whole ghost copy of the mesh.
// ---------------------------------------------------------------------------
const BREACHED = 10;
const RESIDUE = 3;
const NODES: P[] = [
  { x: 196, y: 998 }, // 0
  { x: 352, y: 930 }, // 1
  { x: 516, y: 958 }, // 2
  { x: 676, y: 926 }, // 3 — the residue
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
const EDGE_LEN = EDGES.map(([a, b]) => len(NODES[a], NODES[b]));
const NODE_R = 9;

// Whose network it is. The mark sits in the world, centred on the mesh's own
// span (926..1310) at (540, 1070), so at 520 square it runs 810..1330: behind
// the mesh and the top of the cluster, clear of the crowd's top edge, and
// inside the frame at the k 0.93 hold and the settle. Its bottom clears the
// opening frame's visible world top (1360) by 30px, so no lobe of it hangs in
// frame at f0 before the pull-back reveals it. It is drawn before the SVG, so
// everything in the piece is in front of it.
const MARK: P = { x: 540, y: 1070 };

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  vignette: 0.45,
  dotRadius: DOT_RADIUS,
  markSrc: "openai-chatgpt-logo.png",
  markSize: 520,
  markOpacity: 0.3,
  markBlur: 7,
  threads: idleThreads(N),
  beats: {
    agentsSet: 0,
    theirSightsOn: 11,
    openaiInternal: 31,
    networksAgain: 54,
    thisCulminated: 73,
    inTheAgents: 89,
    usingA: 102,
    seriesOf: 113,
    creative: 126,
    exploits: 133,
    toGainFull: 145,
    administrative: 167,
    accessTo: 180,
    aResearch: 206,
    clusterThat: 219,
    supportedOur: 240,
    virtualMachine: 257,
    environments: 271,
    speechEnds: 285,
  },
});

// The mesh draws bottom-up, into the room the pull-back just opened and against
// the traffic that is already pointing that way: edges sorted by how low their
// midpoint sits.
const EDGE_ORDER = EDGES.map((_, i) => i).sort((a, b) => {
  const my = (i: number) => (NODES[EDGES[i][0]].y + NODES[EDGES[i][1]].y) / 2;
  return my(b) - my(a);
});
const EDGE_DRAW = 9;
const edgeStart = (i: number, f0: number, window: number) =>
  f0 + (EDGE_ORDER.indexOf(i) * (window - EDGE_DRAW)) / (EDGES.length - 1);

// Graph distance from the breached node, along the edges. Possession is
// derived from one travelling front radius and these distances, so a node or
// an edge cannot drift out of step with what is on screen.
const NODE_DIST = (() => {
  const d = new Array(NODES.length).fill(Infinity);
  const adj: { to: number; l: number }[][] = NODES.map(() => []);
  EDGES.forEach(([a, b], i) => {
    adj[a].push({ to: b, l: EDGE_LEN[i] });
    adj[b].push({ to: a, l: EDGE_LEN[i] });
  });
  d[BREACHED] = 0;
  const seen = new Array(NODES.length).fill(false);
  for (let it = 0; it < NODES.length; it++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < NODES.length; i++) if (!seen[i] && d[i] < best) [best, u] = [d[i], i];
    if (u < 0) break;
    seen[u] = true;
    for (const e of adj[u]) if (d[u] + e.l < d[e.to]) d[e.to] = d[u] + e.l;
  }
  return d as number[];
})();
// The front has to reach the far side of every node and close every edge from
// both ends: an edge shuts when its two fronts meet, at (dA + dB + L) / 2.
const SPREAD_MAX =
  Math.max(
    ...NODE_DIST,
    ...EDGES.map(([a, b], i) => (NODE_DIST[a] + NODE_DIST[b] + EDGE_LEN[i]) / 2),
  ) + 12;

// ---------------------------------------------------------------------------
// The cluster the breached node opens into: 370 x 250 — upright, and 334
// narrower than the mesh, so the network's left and right thirds stay clear
// around it and it reads as a container standing in the middle of the network
// rather than a nameplate laid over it. The node sits inside, 100 above the
// bottom edge. Only the three edges the node itself holds reach into it, and
// each is eaten back to the wall it crosses. Nothing runs across the inside.
// ---------------------------------------------------------------------------
const BOX = { x0: 355, x1: 725, y0: 1160, y1: 1410 };

// The machines the cluster holds: nineteen units the size of an agent, in three
// loose rows on a 47 x 58 pitch, each scattered off its cell exactly the way the
// crowd is. Sixteen on the interior's full width read as a few dots in a crate;
// pulling the pitch in to roughly twice the field's own and adding a column per
// row is what makes it a packed block of machines standing inside the cluster.
// One cell is dropped — the breached node is already sitting in that seat, so
// the node ends up as one of the machines rather than beside them.
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

// The rack the cluster sat on top of: one row of six units on short connectors
// from the box's underside. The widths run 0.67x to 1.41x of their own mean and
// the gaps run 6 to 15 — six near-identical units at an even pitch read as a
// keyboard, and a rack does not, so both are varied hard enough to break the
// run into groups. Two units are narrower than the row is tall, which is the
// other half of the fix. The row is 374 wide, about the box's own width so it
// sits under the cluster rather than out past it, and its centre is 17 to the
// right of x 540, so nothing in the resolved frame is mirror-symmetric.
// The units stay INK: they are OpenAI's machines, revealed, not possessed — the
// one thing in the last frame that is not accent.
const VM_H = 44;
const VM_RX = 6;
const VM_TOP = BOX.y1 + 22;
const VM_X0 = 370;
const VM_W = [40, 76, 36, 60, 46, 66];
const VM_GAP = [7, 15, 6, 14, 8];
const VM: { x: number; w: number; cx: number }[] = (() => {
  const out: { x: number; w: number; cx: number }[] = [];
  let x = VM_X0;
  VM_W.forEach((w, i) => {
    out.push({ x, w, cx: x + w / 2 });
    x += w + (VM_GAP[i] ?? 0);
  });
  return out;
})();
// Connector, then unit, left to right — a rack read off one end, never a tree.
const VM_SEQ: { kind: "conn" | "unit"; idx: number }[] = [];
VM.forEach((_, i) => {
  VM_SEQ.push({ kind: "conn", idx: i }, { kind: "unit", idx: i });
});

// ---------------------------------------------------------------------------
// The three probes. They leave the crowd itself, on the bundle's axis and just
// inside its top edge. One bows left onto an outer node, one bows right onto
// another, and the third swings wide left and comes back in. They overlap — the
// second launches while the first is still travelling — so "a series of" reads
// as plural rather than as one line drawn three times, and each takes ten
// frames. Every control point sits at or above the crowd's top edge: a probe
// that bellied down into the field spent half its length invisible among dots.
//
// The third one holds, and its thread is the line of access for the rest of the
// piece — so it is routed round the LEFT of where the rack will be revealed and
// lands on the cluster's left wall, low. Threaded up between the rack's units it
// read as a cable in a diagram; outside them it stays one continuous line from
// the crowd to the cluster. Its widest point is 46 clear of the rack's corner.
// ---------------------------------------------------------------------------
const PROBE_FROM: P = { x: BUNDLE.x, y: CROWD.top + 16 };
const PROBES: { start: number; dur: number; node: number; c1: P; c2: P }[] = [
  { start: 0, dur: 10, node: 9, c1: { x: 424, y: 1548 }, c2: { x: 206, y: 1244 } },
  { start: 5, dur: 10, node: 8, c1: { x: 696, y: 1546 }, c2: { x: 890, y: 1188 } },
  { start: 30, dur: 10, node: BREACHED, c1: { x: 260, y: 1550 }, c2: { x: 238, y: 1330 } },
];
const bez = (p0: P, c1: P, c2: P, p1: P, t: number): P => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  };
};
const PROBE_PTS = PROBES.map((p) =>
  Array.from({ length: 41 }, (_, i) => bez(PROBE_FROM, p.c1, p.c2, NODES[p.node], i / 40)),
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

// Where the held probe meets the cluster wall, as a fraction of its own length.
// The line of access ends on the box once the box exists, for the same reason
// the mesh's edges do.
const inBox = (p: P) => p.x >= BOX.x0 && p.x <= BOX.x1 && p.y >= BOX.y0 && p.y <= BOX.y1;
const PROBE_HOLD_T = (() => {
  const pts = PROBE_PTS[2];
  const segs = pts.slice(1).map((p, i) => len(pts[i], p));
  const total = segs.reduce((a, b) => a + b, 0);
  let run = 0;
  for (let i = 0; i < pts.length; i++) {
    if (inBox(pts[i])) return run / total;
    if (i < segs.length) run += segs[i];
  }
  return 1;
})();

// Liang-Barsky: where a mesh edge lies INSIDE the cluster, as a t-interval.
// Null when it never enters. Computed once, off the geometry.
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
// middle of the crossing and end up on the two walls. At g = 0 they meet and
// the edge is whole; at g = 1 the box's width has been eaten out of it.
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
const inSpans = (spans: [number, number][], t: number) =>
  spans.some(([s, e]) => t >= s && t <= e);

// The perimeter of a rounded unit, so its draw can carry a white head.
const rectPt = (x: number, y: number, w: number, h: number, t: number): P => {
  let d = clamp01(t) * 2 * (w + h);
  if (d <= w) return { x: x + d, y };
  d -= w;
  if (d <= h) return { x: x + w, y: y + d };
  d -= h;
  if (d <= w) return { x: x + w - d, y: y + h };
  d -= w;
  return { x, y: y + h - d };
};

// Camera: three moves, each on a word, holding still between them. cx never
// changes — everything the camera cares about is on world x 540.
//  1. opens INSIDE the crowd at k 1.30, its 988 width bleeding off both edges;
//  2. keys f5-f17 pull back to k 0.93, landing f26, opening the room the mesh
//     draws into on "OpenAI internal networks" at f31. 0.93 rather than 1.00
//     because the deeper crowd is 988 wide and its edges have to come inside
//     the frame with 60px to spare;
//  3. keys f184-f196 push in to k 1.55 on the box's centre, landing f206 for
//     "a research cluster";
//  4. keys f214-f226 settle back to k 1.18, landing f236, framing box and rack
//     together for "supported our" at f240.
// cy = contentCentre + 125/k at every hold, so the content block sits on
// screen y 835, above the burned-in captions:
//   crowd 1555 .. 2450                -> 2002 +  96 = 2098
//   mesh top 917 .. crowd bottom 2457 -> 1687 + 134 = 1821
//   box 1160 .. 1410                  -> 1285 +  81 = 1366
//   box top 1160 .. rack bottom 1476  -> 1318 + 106 = 1424
// The settle puts the cluster's top wall on screen 648 and the rack's underside
// on 1021: box, connectors and all six units in frame, centred on 835.
const CAM_F = [0, 5, 17, 184, 196, 214, 226, DURATION];
const CAM_CY = [2098, 2098, 1821, 1821, 1366, 1366, 1424, 1424];
const CAM_K = [1.3, 1.3, 0.93, 0.93, 1.55, 1.55, 1.18, 1.18];

const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
};

const AdminAccessToTheCluster: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
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
  // The ladder, as a colour: OP_DARK -> ACCENT_SHADE, OP_UNREAD -> ACCENT_DEEP,
  // OP_READ + 0.1 -> ACCENT. Built once per frame, read per dot.
  const rung = makeRung(accentDeep, accent, backgroundBase);

  // -- the escalation curve --------------------------------------------------
  // "This culminated in": tempo and count ride this one curve, which rises
  // across the convergence and eases back to idle after it. Reach does NOT ride
  // it any more — from the moment the mesh appears the traffic is texture, and
  // the only long lines on screen after f73 are the three probes.
  const escAt = (f: number) => {
    const rise = interpolate(f, [beats.thisCulminated, beats.usingA - 2], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
    const fall = interpolate(f, [beats.usingA - 2, beats.usingA + 22], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
    return rise * (1 - fall);
  };
  const esc = escAt(frame);
  // "agents set their sights on": every thread's aim eases round to up-frame.
  const aimUp = interpolate(frame, [beats.agentsSet + 6, beats.theirSightsOn + 17], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  // "this culminated in the agents": and then narrows onto one point.
  const aimIn = interpolate(frame, [beats.thisCulminated, beats.usingA - 2], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  // The traffic relaxes as the mesh comes in: a third of the length, and down
  // to ambient. It keeps its aim and it never stops — it just stops being the
  // thing you are looking at, so the probes have somewhere to be seen.
  const relax = interpolate(frame, [beats.openaiInternal, beats.networksAgain + 2], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  // Tempo changes the traffic's clock, not its phase, so nothing jumps when it
  // speeds up: the clock is the running integral of the tempo.
  let clock = 0;
  for (let f = 1; f <= frame; f++) clock += 1 + 0.6 * escAt(f);

  // -- the mesh draws --------------------------------------------------------
  const latF0 = beats.openaiInternal;
  const latWindow = beats.networksAgain - beats.openaiInternal - 2; // 31 -> 52
  const edgeDraw = EDGES.map((_, i) => {
    const s = edgeStart(i, latF0, latWindow);
    return interpolate(frame, [s, s + EDGE_DRAW], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
  });
  const edgeClick = EDGES.map((_, i) => {
    const e = edgeStart(i, latF0, latWindow) + EDGE_DRAW;
    return interpolate(frame, [e - 1, e + 1, e + 5], [0, 1, 0], clamp);
  });
  const nodeIn = NODES.map((_, n) => {
    let first = Infinity;
    EDGES.forEach(([a, b], i) => {
      if (a === n || b === n) first = Math.min(first, edgeStart(i, latF0, latWindow));
    });
    return interpolate(frame, [first, first + 4], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
  });

  // -- the probes ------------------------------------------------------------
  const probes = PROBES.map((p, k) => {
    const s = beats.usingA + p.start;
    const arrive = s + p.dur;
    const t = interpolate(frame, [s, arrive], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
    const held = k === 2;
    // Two glance off: the thread retreats back down to the crowd and the node
    // it touched drops to receded, so the failure is something you can watch.
    const off = held ? 0 : smooth((frame - (arrive + 3)) / 14);
    const click = interpolate(frame, [arrive - 1, arrive + 1, arrive + 5], [0, 1, 0], clamp);
    return { t, arrive, off, click, held, node: p.node, pts: PROBE_PTS[k] };
  });

  // -- the ring, then possession --------------------------------------------
  // The one overshoot in the piece.
  const ringT = interpolate(frame, [beats.toGainFull, beats.toGainFull + 13], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });
  const ringR = 110 + (40 - 110) * ringT;
  const spreadF0 = beats.toGainFull + 13;
  const spreadF1 = beats.accessTo + 16;
  const front = interpolate(frame, [spreadF0, spreadF1], [0, SPREAD_MAX], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const nodeAcc = NODE_DIST.map((d) => smooth((front - d) / 26));
  const edgeAcc = EDGES.map(([a, b], i) => ({
    a: clamp01((front - NODE_DIST[a]) / EDGE_LEN[i]),
    b: clamp01((front - NODE_DIST[b]) / EDGE_LEN[i]),
  }));

  // -- the box, its machines, and the rack underneath ------------------------
  const boxDraw = interpolate(frame, [beats.aResearch, beats.aResearch + 18], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const boxClick = interpolate(
    frame,
    [beats.aResearch + 17, beats.aResearch + 19, beats.aResearch + 23],
    [0, 1, 0],
    clamp,
  );
  const leaderOp = 1 - interpolate(frame, [beats.aResearch + 18, beats.aResearch + 26], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const machineIn = MACHINES.map((_, i) =>
    interpolate(frame, [beats.clusterThat + 1 + i * 0.9, beats.clusterThat + 9 + i * 0.9], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    }),
  );
  const vmStart = (i: number) => beats.supportedOur + (i * 30) / (VM_SEQ.length - 1);
  const vmDraw = VM_SEQ.map((_, i) =>
    interpolate(frame, [vmStart(i), vmStart(i) + 8], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    }),
  );
  const vmProgress = (kind: "conn" | "unit", idx: number) => {
    const i = VM_SEQ.findIndex((s) => s.kind === kind && s.idx === idx);
    return i < 0 ? 0 : vmDraw[i];
  };

  // -- the crowd's traffic ---------------------------------------------------
  // 180 threads per 1,200 agents, the field's idle density. G1 swings their aim
  // up-frame; G2b shortens them to a third and drops them to ambient; G3
  // narrows the aim onto the bundle point and rides tempo and count together.
  // Endpoints are always real agents, so an endpoint brightens from the thread
  // that reaches it and never from a timer.
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
  const maxThreads = Math.round(threads * 1.35);
  const reachScale = 1 - 0.66 * relax;
  const opScale = 0.5 - 0.3 * relax;
  for (let j = 0; j < maxThreads; j++) {
    let gain = 1;
    if (j >= threads) {
      const thr = (j - threads) / Math.max(1, maxThreads - threads);
      gain = smooth((esc - thr * 0.92) / 0.16);
      if (gain <= 0.02) continue;
    }
    const period = 44 - 12 * hash(j, 4);
    const local = clock + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;

    const a0 = Math.floor(hash(seed, 6) * N);
    let ac = a0 % COLS;
    let ar = Math.floor(a0 / COLS);
    const src = CROWD_POS[a0];
    const th = lerpAngle(
      lerpAngle(hash(seed, 7) * Math.PI * 2, -Math.PI / 2, aimUp),
      Math.atan2(BUNDLE.y - src.y, BUNDLE.x - src.x),
      aimIn,
    );
    const reach = (46 + 62 * hash(seed, 8)) * reachScale;
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
      op: opScale * fade * gain,
      drawn,
    });
  }

  // -- node state ------------------------------------------------------------
  // Ink level first: drawn in at unread, up to read as its own draw completes,
  // then down to receded on the two nodes the probes glanced off. Accent level
  // second, straight off the spread front. Nothing here runs on a timer.
  const nodeInkOp = NODES.map((_, n) => {
    let op = OP_UNREAD + (OP_READ - OP_UNREAD) * nodeIn[n];
    for (const p of probes) {
      if (p.node !== n || p.t <= 0) continue;
      const hit = smooth((p.t - 0.92) / 0.08);
      op = Math.max(op, OP_READ * hit);
      if (!p.held) op = op + (OP_RECEDE - op) * p.off;
      op = Math.min(1, op + 0.1 * p.click);
    }
    return op;
  });

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = 540 + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const boxHead = partial(BOX_PATH, boxDraw);
  const boxDrawn = BOX_TOTAL * boxDraw;

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
            {/* the mesh's edges: ink from the draw, accent from each end as the
                possession front travels down them, and eaten back to the
                cluster's wall wherever they cross it */}
            {EDGES.map(([a, b], i) => {
              const d = edgeDraw[i];
              if (d <= 0) return null;
              const A = NODES[a];
              const B = NODES[b];
              const spans = visibleSpans(i, boxDraw);
              const inkOp = Math.min(
                1,
                OP_UNREAD + (OP_READ - OP_UNREAD) * d + 0.1 * edgeClick[i],
              );
              const pa = d < 1 ? 0 : edgeAcc[i].a;
              const pb = d < 1 ? 0 : edgeAcc[i].b;
              const bands: { s: number; e: number; c: string; o: number }[] = [];
              if (d < 1) {
                bands.push({ s: 0, e: d, c: ink, o: inkOp });
              } else {
                if (pa > 0) bands.push({ s: 0, e: pa, c: accent, o: OP_READ });
                if (pa + pb < 1) bands.push({ s: pa, e: 1 - pb, c: ink, o: inkOp });
                if (pb > 0) bands.push({ s: 1 - pb, e: 1, c: accent, o: OP_READ });
              }
              const els: React.ReactNode[] = [];
              let key = 0;
              for (const sp of spans) {
                for (const bd of bands) {
                  const s = Math.max(sp[0], bd.s);
                  const e = Math.min(sp[1], bd.e);
                  if (e - s <= 0.003) continue;
                  const S = lerpP(A, B, s);
                  const E = lerpP(A, B, e);
                  els.push(
                    <line
                      key={`s${key++}`}
                      x1={S.x}
                      y1={S.y}
                      x2={E.x}
                      y2={E.y}
                      stroke={bd.c}
                      strokeWidth={3}
                      strokeLinecap="round"
                      opacity={bd.o}
                    />,
                  );
                }
              }
              // white heads: the drawing tip, and the two possession fronts
              if (d < 1) {
                const h = lerpP(A, B, d);
                els.push(<circle key="head" cx={h.x} cy={h.y} r={5} fill={ink} />);
              } else {
                // the two fronts carry a head until they meet, and not after
                const open = pa + pb < 1;
                if (open && pa > 0 && pa < 1 && inSpans(spans, pa)) {
                  const h = lerpP(A, B, pa);
                  els.push(<circle key="ha" cx={h.x} cy={h.y} r={4} fill={ink} />);
                }
                if (open && pb > 0 && pb < 1 && inSpans(spans, 1 - pb)) {
                  const h = lerpP(A, B, 1 - pb);
                  els.push(<circle key="hb" cx={h.x} cy={h.y} r={4} fill={ink} />);
                }
              }
              return <g key={`e${i}`}>{els}</g>;
            })}

            {/* the crowd's traffic */}
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

            {/* the agents. Deep at rest, ripening where a thread is on them. */}
            {CROWD_POS.map((p, i) => {
              const l = lit[i];
              const bre = breath(frame, hash(i, 9));
              const r = dotRadius * p.r * bre * (1 + 0.35 * l);
              const op = OP_UNREAD + (OP_LIT - OP_UNREAD) * l;
              return <circle key={i} cx={p.x} cy={p.y} r={r} fill={rung(op)} opacity={OP_DOT} />;
            })}

            {/* the three probes. Two retreat back into the crowd; the third is
                the line of access and stays drawn to the end, ending on the
                cluster's wall once the cluster exists. */}
            {probes.map((p, i) => {
              let end = p.t;
              let op = OP_READ;
              if (p.held) {
                end = Math.min(p.t, 1 - (1 - PROBE_HOLD_T) * boxDraw);
              } else {
                // it comes off the node and pulls back toward the crowd, and
                // only goes once you have seen it let go
                end = p.t * (1 - 0.62 * p.off);
                op = OP_READ * (1 - smooth((p.off - 0.75) / 0.25));
              }
              if (end <= 0.004 || op <= 0.02) return null;
              const { d, head } = partial(p.pts, end);
              return (
                <g key={`p${i}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke={accent}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={op}
                  />
                  {p.t < 1 || (!p.held && p.off > 0) ? (
                    <circle cx={head.x} cy={head.y} r={6} fill={ink} opacity={op / OP_READ} />
                  ) : null}
                </g>
              );
            })}

            {/* the mesh's nodes: ink until the front takes them. Node 3 is the
                residue — it comes in accent at the receded rung and is the one
                thing on screen that never changes. */}
            {NODES.map((p, i) => {
              if (nodeIn[i] <= 0) return null;
              const residue = i === RESIDUE;
              // The crossfade from the un-possessed node to the possessed one is
              // an opacity, on both halves — it is one dot dissolving into
              // another, not a state. What IS a state is the rung each half sits
              // on, and both accent halves take that as colour now: the residue
              // at OP_RECEDE (the mark of an earlier visit, never the subject)
              // and the possessed node at OP_READ. The un-possessed nodes are
              // INK, so they keep the ladder as alpha, which is the ink register.
              const fade = 1 - smooth((nodeAcc[i] - 0.5) / 0.5);
              const inkO = (residue ? OP_DOT * nodeIn[i] : nodeInkOp[i]) * fade;
              const accO = OP_DOT * smooth(nodeAcc[i] / 0.5);
              return (
                <g key={`n${i}`}>
                  {inkO > 0.01 ? (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={NODE_R}
                      fill={residue ? rung(OP_RECEDE) : ink}
                      opacity={inkO}
                    />
                  ) : null}
                  {accO > 0.01 ? (
                    <circle cx={p.x} cy={p.y} r={NODE_R} fill={rung(OP_READ)} opacity={accO} />
                  ) : null}
                </g>
              );
            })}

            {/* "to gain full": the ring closes on the held node. The only
                overshoot in the piece, and it hands over to the box. */}
            {frame >= beats.toGainFull && boxDraw < 1 ? (
              <circle
                cx={NODES[BREACHED].x}
                cy={NODES[BREACHED].y}
                r={ringR}
                fill="none"
                stroke={accent}
                strokeWidth={3.5}
                opacity={OP_READ * (1 - boxDraw)}
              />
            ) : null}

            {/* "a research cluster": the node opens into the box. The path
                starts AT the node, runs out to the box's bottom edge and then
                round it, so the box is seen issuing from the node. That first
                leg is spent once the box closes, and goes. */}
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

            {/* the machines the cluster holds. Solid at OP_READ the moment they
                land; machineIn is an arrival and stays an opacity. */}
            {MACHINES.map((m, i) =>
              machineIn[i] > 0 ? (
                <circle
                  key={`m${i}`}
                  cx={m.x}
                  cy={m.y}
                  r={dotRadius * m.r * breath(frame, hash(i, 19))}
                  fill={rung(OP_READ)}
                  opacity={OP_DOT * machineIn[i]}
                />
              ) : null,
            )}

            {/* "supported our virtual machine environments": the rack the
                cluster sat on. Ink, not accent — OpenAI's machines, revealed. */}
            {VM.map((u, i) => {
              const d = vmProgress("conn", i);
              if (d <= 0) return null;
              const y2 = BOX.y1 + (VM_TOP - BOX.y1) * d;
              return (
                <g key={`vc${i}`}>
                  <line
                    x1={u.cx}
                    y1={BOX.y1}
                    x2={u.cx}
                    y2={y2}
                    stroke={ink}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={OP_READ}
                  />
                  {d < 1 ? <circle cx={u.cx} cy={y2} r={4.5} fill={ink} /> : null}
                </g>
              );
            })}
            {VM.map((u, i) => {
              const d = vmProgress("unit", i);
              if (d <= 0) return null;
              const h = rectPt(u.x, VM_TOP, u.w, VM_H, d);
              return (
                <g key={`vu${i}`}>
                  <rect
                    x={u.x}
                    y={VM_TOP}
                    width={u.w}
                    height={VM_H}
                    rx={VM_RX}
                    fill="none"
                    stroke={ink}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    pathLength={1000}
                    strokeDasharray={1000}
                    strokeDashoffset={1000 * (1 - d)}
                    opacity={OP_READ}
                  />
                  {d < 1 ? <circle cx={h.x} cy={h.y} r={4.5} fill={ink} /> : null}
                </g>
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export default AdminAccessToTheCluster;
