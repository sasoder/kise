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
  clamp01,
  hash,
  idleThreads,
  makeTone,
  runCamera,
  smoothstep as smooth,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Ajeya: "[they] did a lot of activity and made a lot of noise and were pretty
// quickly shut down by OpenAI after first gaining this administrator
// privilege."
// SRT `Ajeya_The_Hack_c10_p0.5.srt`. The composition starts on the onset of
// "did", t = 48.380s; speech ends at t = 56.460s.
//   round((56.460 - 48.380) * 24) = round(8.080 * 24) = round(193.9) = 194
// frames of speech, + 16 frame tail so the resolved state holds = 210.
export const DURATION = 210;

// Word onsets, at 24fps, measured from composition start: f = round((t-48.380)*24)
//     f0   "did a lot of"      f70  "shut down"
//     f19  "activity"          f88  "by openai after"
//     f26  "and made a"        f117 "first gaining"
//     f36  "lot of noise"      f144 "this"
//     f47  "and were pretty"   f152 "administrator"
//     f62  "quickly"           f175 "privilege"
//                              f194 speech ends
//
// THIS OPENS ON `AdminAccessToTheCluster`'s PUSH-IN FRAME. Same clip, same
// field, same world: the crowd, the mesh, the breached node, the cluster box,
// its machines, the ring, the held line of access and the OpenAI mark are all
// copied from that file's geometry without a number changed, and the camera
// starts at its push-in state — k 1.55, cy 1366 — so the cut is a continuation
// and not a new scene. There is no VM rack: it belongs to the end of the
// previous cut, not to this one. No text.
//
// Four gestures, one camera move, and each one is a word:
//   G1  the machines inside the cluster start posting to each other, rate
//       climbing from f0, every thread contained by the box's own walls
//                                — "did a lot of activity"            f0-36
//   G2  the activity LEAKS: threads cross the box wall to the mesh, then run
//       mesh node to mesh node, then down from the lowest nodes into the crowd.
//       Everything a thread touches goes from receded to read FROM THE THREAD —
//       the mesh lights node by node, the crowd lights where a thread lands.
//       Noise is the whole field being able to see it.
//                                — "and made a lot of noise"          f26-62
//       THE ONE CAMERA MOVE, on the same words: pull back from the push-in to
//       the previous cut's wide hold, k 1.55 -> 0.93, cy 1366 -> 1821, so the
//       reach of the leak is what the move reveals. Keys f20-f28 and back by
//       f36; they are SOLVED against the shared damper, not set — a key placed
//       at the framing you want is a framing the damper is still crawling
//       toward when the word lands. The key overshoots to k 0.875 / cy 1851 and
//       the DAMPED camera equals k 0.929 / cy 1822 on f36, "lot of noise",
//       dead still from there.
//   G3  an INK FRONT shuts it down: one flat horizontal ink line spanning the
//       mesh's width, starting just above the mesh's top and sweeping straight
//       down through the mesh, the box, the machines, the ring and the held
//       line of access. Everything it passes drops to OP_DARK on contact and
//       every thread it touches dies. It crosses the breached node and the box
//       on "shut down" (f70) and reaches the crowd's top edge at f74. Ink is
//       the human's colour and it comes down from where the mark is: this is
//       OpenAI acting.
//                                — "quickly shut down"                f62-74
//   G3b the front DOES NOT STOP at the crowd. It broadens from the mesh's width
//       to the crowd's own — wider than the frame, both sides — and keeps going
//       at the same 52 world px per frame, every agent dropping to OP_DARK as it
//       is reached, row by row, exactly the way the mesh's nodes did. It leaves
//       the bottom of the frame on f102. "They were shut down" is the agents
//       too, not just the cluster.
//                                — "by openai after"                  f74-102
//   HOLD f102-117. Fifteen frames, and that is the whole hold in this piece.
//       Structure and crowd both dark; the crowd's own traffic still runs
//       underneath at half its opacity, so the field is never fully still.
//   G4  the ring RE-FORMS on the breached node — head-led, full accent, and the
//       node under it comes back to the receded rung FROM THE RING'S OWN DRAW
//       rather than from a timer. No overshoot: it re-forms, it does not land.
//                                — "first gaining"                    f117-142
//   G5  the reach of the privilege, played back dim. Possession spreads out of
//       the breached node along the mesh's OWN EDGES — the identical mechanism
//       as `AdminAccessToTheCluster`'s spread: one travelling front radius, each
//       node claimed at its graph distance, each edge closed by two fronts, one
//       from each end, meeting at (dA + dB + L) / 2, every arrival derived from
//       that radius and never from a cue. It covers the mesh, then walks the
//       cluster's perimeter as two arms out of the point nearest the node, then
//       fills the machines inside-out. All of it in the GHOST register: accent
//       at OP_RECEDE over the dead OP_DARK structure, with a smaller, dimmer
//       white head on each front. It is the memory of how much of this they
//       owned, not a revival — nothing underneath comes back up, and the CROWD
//       IS NEVER RELIT. The privilege was over the cluster; the shutdown was
//       over everything.
//                                — "this administrator privilege"     f144-188
//   RESOLVE f190-210: the dark crowd and its residual traffic below; above it
//       the dead structure under a ghost claim on every node, every edge, the
//       box and all eighteen machines; the full-accent ring on the breached node
//       the one bright thing; the mark behind. Held, dead still but for the
//       traffic. The held line of access does NOT come back.
//
// The two travels are opposite and that is the point: the shutdown sweeps DOWN
// across the whole field, and the memory of the privilege spreads OUTWARD from
// the node along the structure's own edges — recognisably the same gesture as
// the original breach, played back dim.
//
// Every dark state is derived from the front's y against the element's OWN y —
// per segment where a line spans the sweep — and every ghost state from the
// spread front's own radius against that element's own distance, so nothing can
// drift out of step with what is on screen. No springs, no flashes, no ripples,
// no rims, no pulsing, no stretching; there is no bounce anywhere in this piece,
// the re-formed ring included. One stroke weight, 3, and 3.5 on the ring.
// `fieldShared`'s ladder only.
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
  postRate: z.number(), // the activity's posts per frame at its peak
  beats: z.object({
    didALotOf: z.number(), // "did a lot of"
    activity: z.number(), // "activity"
    andMadeA: z.number(), // "and made a"
    lotOfNoise: z.number(), // "lot of noise"
    andWerePretty: z.number(), // "and were pretty"
    quickly: z.number(), // "quickly"
    shutDown: z.number(), // "shut down"
    byOpenaiAfter: z.number(), // "by openai after"
    firstGaining: z.number(), // "first gaining"
    thisWord: z.number(), // "this"
    administrator: z.number(), // "administrator"
    privilege: z.number(), // "privilege"
    speechEnds: z.number(), // speech ends
  }),
});

export type Props = z.infer<typeof schema>;

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2600;

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
// THE WORLD. Every number from here to the mark is copied out of
// `AdminAccessToTheCluster` unchanged — same step, same jitter, same salts,
// same nodes, same edges, same box, same machine rows, same probe. It is the
// same crowd and the same network seen a second later.
//
// The crowd is 58 x 96 rather than 42 x 60 because the field has to FILL THE
// FRAME to the sides and underneath on every frame of all three cuts. At the
// k 0.93 wide hold the 42 x 60 slab ended on a ruled line left, right and below,
// with bare grid beyond it. Same step, same salts, same jitter law, same cx and
// the same top — only the count changes, so it is still one population.
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
// is framed against it, and the ink front lands on it.
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

// Where the crowd's own traffic still aims: the band between it and the mesh.
// The previous cut left the traffic pointing here and it never stops pointing
// here, so the field carries over frame for frame.
const BUNDLE: P = { x: 540, y: 1489 };

const BREACHED = 10;
const NODES: P[] = [
  { x: 196, y: 998 }, // 0
  { x: 352, y: 930 }, // 1
  { x: 516, y: 958 }, // 2
  { x: 676, y: 926 }, // 3 — the residue of the earlier visit
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
// The mesh's own adjacency — the leak spreads along it and nowhere else.
const ADJ: number[][] = NODES.map(() => []);
EDGES.forEach(([a, b]) => {
  ADJ[a].push(b);
  ADJ[b].push(a);
});

// Whose network it is. Static, behind everything, no entrance, never animated.
const MARK: P = { x: 540, y: 1070 };

// The cluster the breached node opened into, and the machines it holds.
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
// The breached node is sitting in the seat the nineteenth machine would have
// had, so it is one of the machines and posts like one.
const MACH_PTS: P[] = [...MACHINES.map((m) => ({ x: m.x, y: m.y })), NODES[BREACHED]];

// ---------------------------------------------------------------------------
// THE GHOST SPREAD'S METRIC — G5. Lifted whole from `AdminAccessToTheCluster`'s
// possession: ONE travelling front radius, and every element's arrival read off
// its OWN distance rather than off a timer. Dijkstra from the breached node
// along the mesh's own edges gives each node its distance; an edge is closed by
// two fronts, one from each end, meeting at (dA + dB + L) / 2.
//
// What is new is only what comes after the mesh, because in this cut the box
// and its machines already exist. The cluster is walked as TWO ARMS out of the
// point on its perimeter nearest the node — (540, 1410), the middle of its
// bottom wall — round the two sides and back together at the middle of its top
// wall, which is the same "a front travelling the structure's own path" and not
// a second device. The machines follow, by their own distance from the node, so
// they fill inside-out. The mesh's total is the box's zero and the box's total
// is the machines': the order — mesh, box, machines — is geometry, one radius
// against one set of distances, rather than three cues.
// ---------------------------------------------------------------------------
const EDGE_LEN = EDGES.map(([a, b]) => len(NODES[a], NODES[b]));
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
const NODE_SOFT = 26; // world px a node takes to be claimed
// The radius at which the last node is claimed AND the last edge has closed.
const MESH_MAX =
  Math.max(
    ...NODE_DIST,
    ...EDGES.map(([a, b], i) => (NODE_DIST[a] + NODE_DIST[b] + EDGE_LEN[i]) / 2),
  ) + NODE_SOFT;

const armOf = (pts: P[]) => {
  const cum = [0];
  pts.slice(1).forEach((p, i) => cum.push(cum[i] + len(pts[i], p)));
  return { pts, cum, total: cum[cum.length - 1] };
};
// The two arms are the box: their union is exactly the rectangle it always was.
// The right arm starts and ends one stroke width in from x 540, so the two
// arms' round caps ABUT at the middle of the top and bottom walls instead of
// stacking — two stacked caps at OP_DARK read as 0.29, which is a pip of light
// on a wall that is supposed to be dead.
const JOIN = 3; // one stroke width
const AL = NODES[BREACHED].x;
const AR = NODES[BREACHED].x + JOIN;
const BOX_ARMS = [
  armOf([
    { x: AL, y: BOX.y1 },
    { x: BOX.x0, y: BOX.y1 },
    { x: BOX.x0, y: BOX.y0 },
    { x: AL, y: BOX.y0 },
  ]),
  armOf([
    { x: AR, y: BOX.y1 },
    { x: BOX.x1, y: BOX.y1 },
    { x: BOX.x1, y: BOX.y0 },
    { x: AR, y: BOX.y0 },
  ]),
];
const BOX_D0 = MESH_MAX;
const BOX_ARM_LEN = BOX_ARMS[0].total;
// The machines last, inside-out. The 1.6 is a stretch of their own span so
// eighteen of them get a beat rather than the last frame of the box's travel.
const MACH_D0 = BOX_D0 + BOX_ARM_LEN;
const MACH_SOFT = 20;
const MACH_DIST = MACH_PTS.map((m) => MACH_D0 + len(m, NODES[BREACHED]) * 1.6);
const SPREAD_MAX = Math.max(...MACH_DIST) + MACH_SOFT;

const armPt = (a: { pts: P[]; cum: number[] }, d: number): P => {
  for (let i = 0; i < a.pts.length - 1; i++) {
    if (d <= a.cum[i + 1]) {
      const l = a.cum[i + 1] - a.cum[i];
      return lerpP(a.pts[i], a.pts[i + 1], l === 0 ? 0 : (d - a.cum[i]) / l);
    }
  }
  return a.pts[a.pts.length - 1];
};
const inSpans = (spans: [number, number][], t: number) => spans.some(([s, e]) => t >= s && t <= e);
// The ghost carries the same travelling white tip the original possession did,
// smaller and dimmer, because this is the memory of that gesture and not it.
const GHOST_HEAD_R = 3.5;
const GHOST_HEAD_OP = 0.4;

// Liang-Barsky: where a mesh edge lies INSIDE the cluster. The box already
// exists at f0, so the three edges the breached node holds are already eaten
// back to the wall they cross and stay that way — the trim is a constant here,
// not an animation.
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
const EDGE_SPANS: [number, number][][] = EDGES.map(([a, b]) => {
  const h = boxHit(NODES[a], NODES[b]);
  if (!h) return [[0, 1]];
  const out: [number, number][] = [];
  if (h[0] > 0.002) out.push([0, h[0]]);
  if (h[1] < 0.998) out.push([h[1], 1]);
  return out;
});
// Where the ghost first has something to show. The three edges the breached
// node holds are eaten back to the cluster's wall, so the first 157 world px of
// the spread happen INSIDE the box, where nothing is drawn. The front starts at
// that radius rather than at zero, so the ghost comes out of the wall on the
// frame "this" lands instead of after twelve frames of nothing — and it is the
// geometry that says 157, not a nudge.
const SPREAD_MIN = Math.min(
  ...EDGES.map((e, i) => (e.includes(BREACHED) ? EDGE_SPANS[i][0][0] * EDGE_LEN[i] : Infinity)),
);

// The held line of access: the third probe of the previous cut, on its own
// control points, ending on the cluster's left wall. It is here from f0 and it
// never comes back after the front takes it.
const PROBE_FROM: P = { x: BUNDLE.x, y: CROWD.top + 16 };
const PROBE_C1: P = { x: 260, y: 1550 };
const PROBE_C2: P = { x: 238, y: 1330 };
const bez = (p0: P, c1: P, c2: P, p1: P, t: number): P => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  };
};
const PROBE_PTS: P[] = Array.from({ length: 41 }, (_, i) =>
  bez(PROBE_FROM, PROBE_C1, PROBE_C2, NODES[BREACHED], i / 40),
);
const inBox = (p: P) => p.x >= BOX.x0 && p.x <= BOX.x1 && p.y >= BOX.y0 && p.y <= BOX.y1;
const ACCESS_PTS: P[] = (() => {
  const out: P[] = [];
  for (const p of PROBE_PTS) {
    out.push(p);
    if (inBox(p)) break;
  }
  return out;
})();

// The ring: the same 40 the previous cut's ring closed to, at the same 3.5.
const RING_R = 40;
const RING_SEGS = 72;
const RING_PTS: P[] = Array.from({ length: RING_SEGS + 1 }, (_, i) => {
  const a = -Math.PI / 2 + (i / RING_SEGS) * Math.PI * 2;
  return { x: NODES[BREACHED].x + RING_R * Math.cos(a), y: NODES[BREACHED].y + RING_R * Math.sin(a) };
});

// ---------------------------------------------------------------------------
// The ink front. One flat line, ink, stroke 3, spanning the mesh's width with a
// little air either side so it reads as an object crossing the field and not as
// a wipe of the frame. It starts at 895 — above node 3 at 926, the highest
// thing in the world — and sweeps to the crowd's top edge in twelve frames, at
// 55 world px a frame. Everything's darkness is read off this y against the
// element's own y, so the sweep and the damage cannot come apart.
//
// It does not stop there. The crowd is 1,374 world px wide against the mesh's
// 764, so from the crowd's top edge the line BROADENS over 140 px of its own
// travel to -190..1270 — off both sides of the frame at the k 0.93 hold — and
// carries on at 52 px a frame until it is past the bottom of the crowd on f102.
// The widening is not a flourish: an agent at x 1100 has to be reached by
// something before it is allowed to go dark, and the same y-against-y law is
// what darkens it. THE SHUTDOWN REACHES EVERYTHING.
// ---------------------------------------------------------------------------
const FRONT_X0 = 166;
const FRONT_X1 = 930;
const FRONT_X0_WIDE = -190;
const FRONT_X1_WIDE = 1270;
const FRONT_WIDEN = 140; // world px of travel the broadening takes
const FRONT_Y0 = 895;
// Past the lowest jittered seat (2,996 + 7) and 150 below the lowest world y any
// frame of this camera can see (2,868), so nothing is left lit behind it.
const FRONT_Y_END = 3020;
const DARK_BAND = 14; // world px the contact takes to complete

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
  postRate: 1,
  beats: {
    didALotOf: 0,
    activity: 19,
    andMadeA: 26,
    lotOfNoise: 36,
    andWerePretty: 47,
    quickly: 62,
    shutDown: 70,
    byOpenaiAfter: 88,
    firstGaining: 117,
    thisWord: 144,
    administrator: 152,
    privilege: 175,
    speechEnds: 194,
  },
});

// Camera: ONE move. The keys are solved against the shared damper so the
// framing lands on the word rather than ten frames after it — see the header.
//   f0-20   k 1.55  cy 1366   the previous cut's push-in, dead still
//   f20-28  ->      k 0.875 cy 1851   the overshoot the damper travels through
//   f28-36  ->      k 0.93  cy 1821   the previous cut's wide hold
//   damped: f26 k 1.342 cy 1521, f30 k 1.080 cy 1709, f36 k 0.929 cy 1822.
// cy 1821 = the content block (mesh top 917 .. crowd bottom 2457) centred on
// screen y 835, clear of the burned-in captions. cx never changes: everything
// this camera cares about is on world x 540.
const CAM_F = [0, 20, 28, 36, DURATION];
const CAM_CY = [1366, 1366, 1851, 1821, 1821];
const CAM_K = [1.55, 1.55, 0.875, 0.93, 0.93];

// ---------------------------------------------------------------------------
// The activity. One post is the approved message-board thread: a line one agent
// draws to another with a white head at the tip, held, then faded, and both
// endpoints brightening FROM THE THREAD rather than from a timer. Four
// channels, each opening on the word that lets it open, each one's count the
// running integral of its own rate so retiming a beat retimes the traffic with
// it, and each one gated shut by the FRONT'S OWN Y rather than by a clock.
//   IN    machine -> machine   from f0, contained by the box
//   OUT1  machine -> mesh node the leak: the first threads across the wall
//   OUT2  node -> node         it spreads along the mesh's own edges
//   DOWN  low node -> crowd    and drops into the field, which is the noise
// ---------------------------------------------------------------------------
type Kind = "in" | "out1" | "out2" | "down";
const DRAW: Record<Kind, number> = { in: 5, out1: 6, out2: 6, down: 7 };
const HOLD = 5;
const DECAY = 9;
// The three nodes the breached node holds: the only way out of the box.
const EXITS = ADJ[BREACHED];
// The low side of the mesh — the only nodes that can reach down into the crowd.
const LOW_NODES = NODES.map((p, i) => ({ p, i }))
  .filter((n) => n.p.y >= 1080)
  .map((n) => n.i);
// The crowd's top twelve rows: what is near enough to the cluster to be lit by
// something falling out of it.
const NEAR_ROWS = 12;

const QuicklyShutDown: React.FC<Props> = ({
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
  postRate,
  beats,
}) => {
  const frame = useCurrentFrame();
  // The ladder, as a colour: OP_DARK -> ACCENT_SHADE, OP_UNREAD -> ACCENT_DEEP,
  // OP_READ + 0.1 -> ACCENT. Built once per frame, read per dot.
  const rung = makeRung(accentDeep, accent, backgroundBase);

  // -- the front, as a function of any frame ---------------------------------
  // It leaves the bottom of the frame fifteen frames before the ring re-forms,
  // which is the one hold in the piece — f102 to f117.
  const frontExit = beats.firstGaining - 15;
  const frontAt = (f: number) =>
    interpolate(
      f,
      [beats.quickly, beats.quickly + 12, frontExit],
      [FRONT_Y0, CROWD.top, FRONT_Y_END],
      clamp,
    );
  const frontY = frontAt(frame);
  // Everything's darkness, off the front's y against its own y. Monotonic, so
  // it latches: a thing the front has passed stays passed. And, once the ghost
  // spread starts, everything's claim on top of that darkness — one function,
  // so a thing cannot be dark and claimed by two different rules.
  const darkAt = (y: number) => smooth((frontY - y) / DARK_BAND);
  const claimAt = (base: number, d: number, g: number) => {
    const dk = base + (OP_DARK - base) * d;
    return dk + Math.max(0, OP_RECEDE - dk) * g;
  };
  const dim = (base: number, y: number) => claimAt(base, darkAt(y), 0);
  const claimed = (base: number, y: number, g: number) => claimAt(base, darkAt(y), g);
  // No fade-out: the front goes because it has left the frame, not because a
  // curve took it away.
  const frontOp =
    interpolate(frame, [beats.quickly - 2, beats.quickly], [0, 1], clamp) *
    (frame < frontExit ? 1 : 0);
  const frontWide = smooth((frontY - CROWD.top) / FRONT_WIDEN);
  const frontX0 = FRONT_X0 + (FRONT_X0_WIDE - FRONT_X0) * frontWide;
  const frontX1 = FRONT_X1 + (FRONT_X1_WIDE - FRONT_X1) * frontWide;

  // -- the four rates --------------------------------------------------------
  // Each climbs on its own word and each is shut by the front reaching the
  // region it posts in, so "quickly shut down" stops the traffic for a reason
  // you can see rather than on a cue.
  const rateAt = (kind: Kind, f: number) => {
    const y = frontAt(f);
    switch (kind) {
      case "in":
        return (
          1.5 *
          interpolate(
            f,
            [
              beats.didALotOf,
              beats.didALotOf + 8,
              beats.activity,
              beats.lotOfNoise,
              beats.quickly - 2,
            ],
            [0.35, 0.55, 0.9, 1.1, 1.3],
            clamp,
          ) *
          (1 - smooth((y - (BOX.y0 - 40)) / 90))
        );
      case "out1":
        return (
          0.78 *
          interpolate(
            f,
            [beats.andMadeA, beats.andMadeA + 5, beats.andWerePretty - 3, beats.quickly - 2],
            [0, 0.8, 1, 1.3],
            clamp,
          ) *
          (1 - smooth((y - FRONT_Y0) / 55))
        );
      case "out2":
        return (
          0.95 *
          interpolate(
            f,
            [beats.andMadeA + 4, beats.lotOfNoise + 2, beats.andWerePretty + 5, beats.quickly - 2],
            [0, 0.55, 1, 1.4],
            clamp,
          ) *
          (1 - smooth((y - FRONT_Y0) / 55))
        );
      default:
        return (
          0.6 *
          interpolate(
            f,
            [beats.andMadeA + 12, beats.andWerePretty + 3, beats.quickly - 2],
            [0, 0.6, 1.2],
            clamp,
          ) *
          (1 - smooth((y - 1060) / 90))
        );
    }
  };

  // -- the simulation --------------------------------------------------------
  // Run from f1 to now. A post is born on the frame its channel's count crosses
  // the next whole number; its endpoints depend only on the channel and that
  // count, and on which nodes the leak had already reached, so the same history
  // comes out every frame.
  type Post = { key: number; A: P; B: P; kind: Kind; born: number };
  const posts: Post[] = [];
  const lit = new Float32Array(N); // crowd agents
  const machLit = new Float32Array(MACH_PTS.length);
  const nodeTouch = new Float32Array(NODES.length).fill(Infinity);
  const acc: Record<Kind, number> = { in: 0, out1: 0, out2: 0, down: 0 };
  const cnt: Record<Kind, number> = { in: 0, out1: 0, out2: 0, down: 0 };
  const KINDS: Kind[] = ["in", "out1", "out2", "down"];

  const touchNode = (n: number, f: number) => {
    if (f < nodeTouch[n]) nodeTouch[n] = f;
  };
  const nearestMach = (target: P, not: number) => {
    let best = -1;
    let bd = Infinity;
    MACH_PTS.forEach((m, i) => {
      if (i === not) return;
      const d = (m.x - target.x) ** 2 + (m.y - target.y) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };

  for (let f = 1; f <= frame; f++) {
    for (const kind of KINDS) {
      acc[kind] += postRate * rateAt(kind, f);
      while (acc[kind] >= cnt[kind] + 1) {
        cnt[kind] += 1;
        const n = cnt[kind];
        const s = n * 7 + (kind === "in" ? 0 : kind === "out1" ? 911 : kind === "out2" ? 1721 : 2609);
        let A: P | null = null;
        let B: P | null = null;
        let ai = -1;
        let bi = -1;
        let na = -1;
        let nb = -1;
        if (kind === "in") {
          ai = Math.floor(hash(s, 31) * MACH_PTS.length) % MACH_PTS.length;
          const th = hash(s, 32) * Math.PI * 2;
          const d = 110 * (0.45 + 0.55 * hash(s, 33));
          bi = nearestMach(
            { x: MACH_PTS[ai].x + d * Math.cos(th), y: MACH_PTS[ai].y + d * Math.sin(th) },
            ai,
          );
          A = MACH_PTS[ai];
          B = MACH_PTS[bi];
        } else if (kind === "out1") {
          ai = Math.floor(hash(s, 34) * MACH_PTS.length) % MACH_PTS.length;
          nb = EXITS[Math.floor(hash(s, 35) * EXITS.length) % EXITS.length];
          A = MACH_PTS[ai];
          B = NODES[nb];
        } else if (kind === "out2") {
          // From a node the leak has already reached, out along one of its own
          // edges — and preferring the FRONTIER, a reached node that still has
          // an unreached neighbour, to a neighbour that has not been reached.
          // That is what makes the mesh light node by node instead of the
          // traffic milling about in the corner it started in.
          const reached: number[] = [];
          NODES.forEach((_, i) => {
            if (i !== BREACHED && nodeTouch[i] <= f) reached.push(i);
          });
          if (reached.length === 0) continue;
          const unreached = (i: number) => i !== BREACHED && nodeTouch[i] > f;
          const frontier = reached.filter((i) => ADJ[i].some(unreached));
          const from = frontier.length > 0 ? frontier : reached;
          na = from[Math.floor(hash(s, 36) * from.length) % from.length];
          const open = ADJ[na].filter(unreached);
          const nbrs = open.length > 0 ? open : ADJ[na].filter((i) => i !== BREACHED);
          if (nbrs.length === 0) continue;
          nb = nbrs[Math.floor(hash(s, 37) * nbrs.length) % nbrs.length];
          A = NODES[na];
          B = NODES[nb];
        } else {
          const reachedLow = LOW_NODES.filter((i) => nodeTouch[i] <= f);
          if (reachedLow.length === 0) continue;
          // Round-robin over the low nodes that have been reached: a spray of
          // eight lines out of one node reads as a graphic device, and the
          // whole point is that this is coming out of the network at large.
          na = reachedLow[n % reachedLow.length];
          const col = clampi(
            Math.round((NODES[na].x - (CROWD.cx - CROWD.w / 2)) / STEP_X) +
              Math.round((hash(s, 39) - 0.5) * 16),
            0,
            COLS - 1,
          );
          const row = Math.floor(hash(s, 40) * NEAR_ROWS);
          bi = row * COLS + col;
          A = NODES[na];
          B = CROWD_POS[bi];
        }
        if (!A || !B) continue;
        if (na >= 0) touchNode(na, f);
        if (nb >= 0) touchNode(nb, f + DRAW[kind]);

        const age = frame - f;
        if (age > DRAW[kind] + HOLD + DECAY) continue;
        posts.push({ key: KINDS.indexOf(kind) * 100000 + n, A, B, kind, born: f });
        // both ends brighten from the thread: the near end as it is drawn, the
        // far end as the head arrives
        const drawn = clamp01(age / DRAW[kind]);
        const fade = 1 - smooth((age - DRAW[kind] - HOLD) / DECAY);
        if (kind === "in" && ai >= 0) machLit[ai] = Math.max(machLit[ai], fade);
        if (kind === "in" && bi >= 0) machLit[bi] = Math.max(machLit[bi], drawn * fade);
        if (kind === "out1" && ai >= 0) machLit[ai] = Math.max(machLit[ai], fade);
        if (kind === "down" && bi >= 0) lit[bi] = Math.max(lit[bi], drawn * fade);
      }
    }
  }
  // A node's light is latched: once the leak has reached it, it stays lit until
  // the front takes it away.
  const nodeLit = NODES.map((_, i) => smooth((frame - nodeTouch[i]) / 8));

  // -- the crowd's own traffic, exactly as the previous cut left it -----------
  // Relaxed: a third of the reach, ambient opacity, still aimed at the bundle
  // point. It never stops, so the field is never dead — and once the front has
  // been over it, it runs on at half of that: the residual traffic of a
  // population that has been shut down, and the only thing moving in the frame
  // through the hold and the whole of the resolve.
  const reachScale = 1 - 0.66;
  const opScale = 0.5 - 0.3;
  const THREAD_RESIDUAL = 0.5;
  const idleEls: { key: number; x1: number; y1: number; x2: number; y2: number; op: number; drawn: number }[] = [];
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
    const reach = (46 + 62 * hash(seed, 8)) * reachScale;
    let bc = ac + Math.round((reach * Math.cos(th)) / STEP_X);
    let br = ar + Math.round((reach * Math.sin(th)) / STEP_Y);
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
    idleEls.push({
      key: j,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * drawn,
      y2: A.y + (B.y - A.y) * drawn,
      op: opScale * fade * (1 - (1 - THREAD_RESIDUAL) * darkAt((A.y + B.y) / 2)),
      drawn,
    });
  }

  // -- G4: the ring re-forms on the breached node ----------------------------
  // Head-led, full accent, inOut cubic — no overshoot. It re-forms; it does not
  // land. The node under it takes its own return FROM THIS, below.
  const ringTrace = interpolate(frame, [beats.firstGaining, beats.firstGaining + 25], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const ringHead = RING_PTS[Math.min(RING_SEGS, Math.round(ringTrace * RING_SEGS))];
  const RING_HEAD_OP = 0.85;

  // -- G5: the ghost spread --------------------------------------------------
  // ONE radius, from "this" to thirteen frames past "privilege". Every node,
  // every edge, both arms of the box and every machine take their claim from
  // this number against their own distance — see THE GHOST SPREAD'S METRIC.
  const spreadFront =
    frame <= beats.thisWord
      ? 0
      : interpolate(
          frame,
          [beats.thisWord, beats.privilege + 13],
          [SPREAD_MIN, SPREAD_MAX],
          { ...clamp, easing: Easing.inOut(Easing.sin) },
        );
  const nodeGhost = NODE_DIST.map((d) => smooth((spreadFront - d) / NODE_SOFT));
  const machGhost = MACH_DIST.map((d) => smooth((spreadFront - d) / MACH_SOFT));
  const armFront = spreadFront - BOX_D0;

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = 540 + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // A line whose two ends are on different sides of the front is drawn as
  // pieces, each at its own darkness; a line the front is nowhere near is one
  // line. `g` is the ghost's claim on that whole piece — the caller has already
  // cut the line at the spread front, so a piece is claimed or it is not.
  // Nothing here is a timer.
  const sweptLine = (
    key: string,
    A: P,
    B: P,
    base: number,
    color: string,
    width: number,
    g: number = 0,
  ): React.ReactNode => {
    const dA = darkAt(A.y);
    const dB = darkAt(B.y);
    if (Math.abs(dA - dB) < 0.004) {
      const op = claimAt(base, (dA + dB) / 2, g);
      return (
        <line
          key={key}
          x1={A.x}
          y1={A.y}
          x2={B.x}
          y2={B.y}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={op}
        />
      );
    }
    const steps = clampi(Math.ceil(Math.abs(B.y - A.y) / 7), 2, 40);
    const els: React.ReactNode[] = [];
    for (let i = 0; i < steps; i++) {
      const S = lerpP(A, B, i / steps);
      const E = lerpP(A, B, (i + 1) / steps);
      els.push(
        <line
          key={i}
          x1={S.x}
          y1={S.y}
          x2={E.x}
          y2={E.y}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={claimAt(base, darkAt((S.y + E.y) / 2), g)}
        />,
      );
    }
    return <g key={key}>{els}</g>;
  };

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
            {/* the mesh: receded at f0, brought up to read by the leak node by
                node, eaten back to the cluster's wall where it crosses, taken
                by the front — and then claimed back by the ghost, two fronts
                per edge, one out of each end, meeting in the middle */}
            {EDGES.map(([a, b], i) => {
              const A = NODES[a];
              const B = NODES[b];
              const l = Math.min(nodeLit[a], nodeLit[b]);
              const base = OP_RECEDE + (OP_READ - OP_RECEDE) * l;
              const ga = clamp01((spreadFront - NODE_DIST[a]) / EDGE_LEN[i]);
              // the second front only ever takes what is left: two bands that
              // OVERLAP would be drawn twice, and a ghost drawn twice is a
              // ghost at 0.51 instead of at OP_RECEDE
              const gb = Math.min(clamp01((spreadFront - NODE_DIST[b]) / EDGE_LEN[i]), 1 - ga);
              const bands: { s: number; e: number; g: number }[] = [];
              if (ga > 0) bands.push({ s: 0, e: ga, g: 1 });
              if (ga + gb < 1) bands.push({ s: ga, e: 1 - gb, g: 0 });
              if (gb > 0) bands.push({ s: 1 - gb, e: 1, g: 1 });
              const els: React.ReactNode[] = [];
              let key = 0;
              for (const sp of EDGE_SPANS[i]) {
                for (const bd of bands) {
                  const s = Math.max(sp[0], bd.s);
                  const e = Math.min(sp[1], bd.e);
                  if (e - s <= 0.003) continue;
                  els.push(
                    sweptLine(`s${key++}`, lerpP(A, B, s), lerpP(A, B, e), base, accent, 3, bd.g),
                  );
                }
              }
              // the two ghost heads: each carries a tip until the fronts meet,
              // and not after — and only where the edge is actually drawn
              const open = ga + gb < 1;
              if (open && ga > 0 && inSpans(EDGE_SPANS[i], ga)) {
                const h = lerpP(A, B, ga);
                els.push(
                  <circle
                    key="ha"
                    cx={h.x}
                    cy={h.y}
                    r={GHOST_HEAD_R}
                    fill={ink}
                    opacity={GHOST_HEAD_OP}
                  />,
                );
              }
              if (open && gb > 0 && inSpans(EDGE_SPANS[i], 1 - gb)) {
                const h = lerpP(A, B, 1 - gb);
                els.push(
                  <circle
                    key="hb"
                    cx={h.x}
                    cy={h.y}
                    r={GHOST_HEAD_R}
                    fill={ink}
                    opacity={GHOST_HEAD_OP}
                  />,
                );
              }
              return <g key={`e${i}`}>{els}</g>;
            })}

            {/* the crowd's own traffic */}
            {idleEls.map((t) => (
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

            {/* the agents. They go dark under the front on exactly the law the
                mesh's nodes do — their own y against the front's — and they are
                never relit: the privilege was over the cluster, the shutdown was
                over them. */}
            {CROWD_POS.map((p, i) => {
              const l = lit[i];
              const bre = breath(frame, hash(i, 9));
              const r = dotRadius * p.r * bre * (1 + 0.35 * l);
              const base = OP_RECEDE + (OP_LIT - OP_RECEDE) * l;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={rung(dim(base, p.y))}
                  opacity={OP_DOT}
                />
              );
            })}

            {/* the activity. A thread dies the moment the front touches it —
                the front reaches its highest end first, so that is what kills
                it. */}
            {posts.map((t) => {
              const age = frame - t.born;
              const d = DRAW[t.kind];
              const drawn = clamp01(age / d);
              const fade = 1 - smooth((age - d - HOLD) / DECAY);
              const kill = 1 - smooth((frontY - Math.min(t.A.y, t.B.y)) / 10);
              const op = OP_READ * fade * kill;
              if (op <= 0.02) return null;
              const x2 = t.A.x + (t.B.x - t.A.x) * drawn;
              const y2 = t.A.y + (t.B.y - t.A.y) * drawn;
              return (
                <g key={t.key}>
                  <line
                    x1={t.A.x}
                    y1={t.A.y}
                    x2={x2}
                    y2={y2}
                    stroke={accent}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={op}
                  />
                  {drawn < 1 ? <circle cx={x2} cy={y2} r={4} fill={ink} opacity={kill} /> : null}
                </g>
              );
            })}

            {/* the held line of access, from the crowd to the cluster's wall.
                It goes dark under the front and it does not come back. */}
            {ACCESS_PTS.slice(1).map((p, i) =>
              sweptLine(`a${i}`, ACCESS_PTS[i], p, OP_READ, accent, 3),
            )}

            {/* the mesh's nodes. Dark under the front, then claimed by the
                ghost at their own graph distance — the breached node first,
                because it is the zero of that distance, and because the ring
                re-forming around it is what brings it back. */}
            {NODES.map((p, i) => {
              const breached = i === BREACHED;
              const base = breached ? OP_READ : OP_RECEDE + (OP_READ - OP_RECEDE) * nodeLit[i];
              // the breached node's return is read off THE RING'S OWN DRAW, so
              // it cannot arrive on a frame the ring is not on
              const g = breached ? Math.max(nodeGhost[i], ringTrace) : nodeGhost[i];
              return (
                <circle
                  key={`n${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={NODE_R}
                  fill={rung(claimed(base, p.y, g))}
                  opacity={OP_DOT}
                />
              );
            })}

            {/* the cluster, walked by the ghost as two arms out of the middle
                of its bottom wall and closing again at the middle of its top */}
            {BOX_ARMS.map((arm, ai) => (
              <g key={`bx${ai}`}>
                {arm.pts.slice(1).map((p, si) => {
                  const S = arm.pts[si];
                  const cut = clamp01(
                    (armFront - arm.cum[si]) / (arm.cum[si + 1] - arm.cum[si]),
                  );
                  const M = lerpP(S, p, cut);
                  return (
                    <g key={si}>
                      {cut > 0.003 ? sweptLine("g", S, M, OP_READ, accent, 3, 1) : null}
                      {cut < 0.997 ? sweptLine("d", M, p, OP_READ, accent, 3, 0) : null}
                    </g>
                  );
                })}
                {armFront > 0 && armFront < arm.total ? (
                  <circle
                    cx={armPt(arm, armFront).x}
                    cy={armPt(arm, armFront).y}
                    r={GHOST_HEAD_R}
                    fill={ink}
                    opacity={GHOST_HEAD_OP}
                  />
                ) : null}
              </g>
            ))}

            {/* the machines it holds, claimed inside-out */}
            {MACH_PTS.map((m, i) => {
              if (i === MACH_PTS.length - 1) return null; // the breached node draws itself
              const l = machLit[i];
              const base = OP_READ + (OP_LIT - OP_READ) * l;
              return (
                <circle
                  key={`m${i}`}
                  cx={m.x}
                  cy={m.y}
                  r={dotRadius * MACHINES[i].r * breath(frame, hash(i, 19)) * (1 + 0.2 * l)}
                  fill={rung(claimed(base, m.y, machGhost[i]))}
                  opacity={OP_DOT}
                />
              );
            })}

            {/* the ring. Live and at read until the front takes it; re-formed
                from f117 head-first at FULL accent — the one bright thing in
                the resolve, and the only thing the ghost is not. */}
            {RING_PTS.slice(1).map((p, i) => {
              const A = RING_PTS[i];
              const my = (A.y + p.y) / 2;
              const darkened = dim(OP_READ, my);
              const trace = clamp01(ringTrace * RING_SEGS - i);
              const op = darkened + (OP_READ - darkened) * trace;
              return (
                <line
                  key={`r${i}`}
                  x1={A.x}
                  y1={A.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={accent}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  opacity={op}
                />
              );
            })}
            {ringTrace > 0 && ringTrace < 1 ? (
              <circle cx={ringHead.x} cy={ringHead.y} r={4.5} fill={ink} opacity={RING_HEAD_OP} />
            ) : null}

            {/* the front */}
            {frontOp > 0.01 ? (
              <line
                x1={frontX0}
                y1={frontY}
                x2={frontX1}
                y2={frontY}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={OP_READ * frontOp}
              />
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export default QuicklyShutDown;
