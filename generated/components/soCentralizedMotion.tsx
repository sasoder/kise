// ---------------------------------------------------------------------------
// soCentralizedMotion: the geometry and the clocks of SoCentralized (the first
// graphic of the Sheppard "Centralized empires fell fast" set). Pure functions
// of the frame, in WORLD px (world px == screen px at camera k 1). The tree is
// hierShared's at TakingThatIndividual's scale and tier spacing (S 1.9, the
// Ruler's feet y 505, the crowd's feet y 1110, centred on x 540); the dispersed
// bands stand ~1055 px to its right on the same page.
// ---------------------------------------------------------------------------
import { makeRng, makeTrack } from "./incaShared";
import {
  INK_CONTEXT,
  INK_FULL,
  TREE,
  clamp01,
  commonerSway,
  hash,
  linkLengthBetween,
  nodeAnchors,
  pchip,
  smootherstep,
  smoothstep,
  type Cam,
  type LinkState,
  type NodeState,
  type Pulse,
  type TreeNode,
} from "./hierShared";
import { S, SEAT, TREE_X, TREE_Y, toWorld, type Cubic, type P2 } from "./takingMotion";

export const FPS = 24;
/** the slot is 166 frames of the sequence (9.593 -> 16.517 s); no tail */
export const DURATION = 166;
export const LAST = DURATION - 1;

const N = TREE.nodes;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// ---- the tree's rest layout (TakingThatIndividual's tier spacing) ----
const TIER_DY = [(505 - TREE_Y) / S + 538, (721 - TREE_Y) / S + 375, (898 - TREE_Y) / S + 205, 0];
const REST = N.map((n) => nodeAnchors(n, { dy: TIER_DY[n.tier] }));
const Y = {
  seat: REST[0].bottom[1],
  lordTop: Math.min(...TREE.byTier[1].map((i) => REST[i].top[1])),
  lordFeet: (721 - TREE_Y) / S,
  offTop: Math.min(...TREE.byTier[2].map((i) => REST[i].top[1])),
  offFeet: (898 - TREE_Y) / S,
  crowdTop: Math.min(...TREE.byTier[3].map((i) => REST[i].top[1])),
  crowdFeet: 4,
};

export const T = {
  rulerInk: [46, 54] as const,
  pulses: [54, 71] as const,
  sweep: [62, 71] as const, // the stroke enters / lands on him
  knock: [71, 89] as const,
  drain: [72, 84] as const,
  sink: [90, 117] as const, // the fallen Ruler goes down with the rest
  glide: [112, 156] as const,
};

// ---------------------------------------------------------------------------
// THE CAMERA: a creep-in on the tree, then ONE glide right to the bands
// ---------------------------------------------------------------------------
const GLIDE = 1040;
const BAND_SEED = 151;
const camX = makeTrack(
  [
    [T.glide[0], T.glide[1], GLIDE, 0.62],
    [148, 198, 62, 1], // the creep that carries the hand-off (never at rest)
  ],
  TREE_X,
);
const camLnK = pchip(
  [
    [0, Math.log(1.0)],
    [112, Math.log(1.035)],
    [156, Math.log(0.975)],
    [LAST, Math.log(0.984)],
  ],
  false,
);
export const camAt = (f: number): Cam => {
  const k = Math.exp(camLnK(f));
  return { k, cx: camX(f), cy: 815 - (812 - 960) / k };
};

// ---------------------------------------------------------------------------
// GESTURE 0: the build. ONE front (a local height) rising through the tree
// ---------------------------------------------------------------------------
const Y0 = lerp(Y.crowdTop, Y.offFeet, 0.25);
/** the front's local height at frame f: the lowest links a quarter risen at f0,
 *  the officials' feet f18, the lords' feet f30.5, his feet f46.5 */
export const buildY = pchip(
  [
    [0, Y0],
    [18, Y.offFeet],
    [24, Y.offTop],
    [30.5, Y.lordFeet],
    [37, Y.lordTop],
    [46.5, Y.seat],
  ],
  false,
);
const buildFrameAt = (y: number) => {
  let lo = -30;
  let hi = 47;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (buildY(mid) > y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
const LAG = N.map((n) => 2 * hash(n.id + 262, 51));
const INK_AT = N.map((n) => (n.tier === 3 || n.tier === 0 ? -1e9 : buildFrameAt(REST[n.id].bottom[1]) + Math.min(...n.children.map((c) => LAG[c])) - 0.5));
const drawOf = (c: TreeNode, f: number) => {
  const y1 = REST[c.id].top[1];
  const y0 = REST[c.parent].bottom[1];
  return clamp01((y1 - buildY(f - LAG[c.id])) / (y1 - y0));
};

// ---------------------------------------------------------------------------
// GESTURE 2: the fall. ONE front runs down; each figure topples and sinks
// ---------------------------------------------------------------------------
/** the frame the fall reaches local rest height y */
const fallFrame = pchip(
  [
    [Y.seat, 90],
    [Y.lordTop, 93],
    [Y.lordFeet, 97],
    [Y.offTop, 100.5],
    [Y.offFeet, 104],
    [Y.crowdTop, 106],
    [Y.crowdFeet, 112],
  ],
  true,
);
const FALL_DUR = [0, 20, 15, 9.5];
/** how far a node has fallen (0 standing .. 1 down) */
export const fallenAt = (n: TreeNode, f: number) => {
  if (n.tier === 0) return 0;
  const t0 = fallFrame(REST[n.id].top[1]) + 2.2 * hash(n.id, 171);
  return smoothstep((f - t0) / FALL_DUR[n.tier]);
};
const linkFallAt = (c: TreeNode, f: number) => smoothstep((f - fallFrame(REST[c.parent].bottom[1]) - 1.5 * hash(c.id, 172)) / 9);

export const nodeStateAt = (n: TreeNode, f: number): NodeState => {
  // the Ruler is drawn by the component (he leaves the tree); his node only anchors the top links
  if (n.tier === 0) return { op: 0, dy: TIER_DY[0], sway: false };
  const id = n.id;
  const h = (k: number) => hash(id, k);
  const inked = n.tier === 3 ? 1 : smoothstep((f - INK_AT[id]) / 8);
  const c = fallenAt(n, f);
  const sgn = h(173) > 0.5 ? 1 : -1;
  let dx = 0;
  let dy = TIER_DY[n.tier] + (6 / S) * (1 - inked);
  let lie = 0;
  if (n.tier === 1) {
    lie = sgn * (76 + 14 * h(174));
    dy += (c * (150 + 24 * (h(175) - 0.5))) / S;
    dx += (c * sgn * 14) / S;
  } else if (n.tier === 2) {
    lie = sgn * (68 + 26 * h(174));
    dy += (c * (90 + 20 * (h(175) - 0.5))) / S;
    dx += (c * sgn * 10) / S;
  } else {
    lie = sgn * (22 + 68 * h(174));
    dy += (c * (3 + 9 * h(175))) / S;
    dx += (c * ((n.x / 220) * 12 + (h(176) - 0.5) * 14)) / S;
  }
  return {
    op: lerp(INK_FULL * inked, INK_CONTEXT, c),
    dx,
    dy,
    tilt: commonerSway(id, f, 3) * (1 - c) + lie * c,
    sway: false,
  };
};
export const anchorsAt = (n: TreeNode, f: number) => {
  const a = nodeAnchors(n, nodeStateAt(n, f));
  return { top: toWorld(a.top as P2), bottom: toWorld(a.bottom as P2) };
};

// ---- the loyalty pulses (f54-f71): cream dashes travelling up to him ----
const PULSE_V = 11;
const PULSE_T = 46;
export const PULSE_LEN = 15;
const CHAINS = (() => {
  const out: { segs: { id: number; s0: number; len: number }[]; phase: number }[] = [];
  for (const id of TREE.byTier[3]) {
    if (hash(id + 393, 61) > 0.36) continue;
    const segs: { id: number; s0: number; len: number }[] = [];
    let s = 0;
    for (const n of TREE.chainOf(id)) {
      if (n.parent < 0) break;
      const len = linkLengthBetween(REST[n.parent].bottom as P2, REST[n.id].top as P2, 0, 1);
      segs.push({ id: n.id, s0: s, len });
      s += len + (REST[n.parent].bottom[1] - REST[n.parent].top[1]);
    }
    out.push({ segs, phase: hash(id + 393, 62) * PULSE_T });
  }
  return out;
})();
export const loyaltyAt = (f: number) => {
  const m = new Map<number, Pulse[]>();
  const amp = smoothstep((f - T.pulses[0]) / 6) * (1 - smoothstep((f - T.pulses[1]) / 5));
  if (amp <= 0.003) return m;
  for (const ch of CHAINS) {
    const s = ((((f - ch.phase) % PULSE_T) + PULSE_T) % PULSE_T) * PULSE_V;
    for (const sg of ch.segs) {
      const at = s - sg.s0;
      if (at + PULSE_LEN <= 0 || at >= sg.len) continue;
      const arr = m.get(sg.id) ?? [];
      arr.push({ at, len: PULSE_LEN, op: INK_FULL * amp });
      m.set(sg.id, arr);
    }
  }
  return m;
};

/** a Tree link's state (the four top links are drawn by topLinkAt) */
export const linkStateAt = (c: TreeNode, f: number, loyalty: Map<number, Pulse[]>): LinkState => {
  if (c.tier === 1) return { op: 0 };
  const sl = linkFallAt(c, f);
  return { draw: drawOf(c, f), from: "child", sag: sl * (c.tier === 3 ? 0.55 + 0.3 * hash(c.id, 72) : 0.8 + 0.2 * hash(c.id, 72)), pulses: loyalty.get(c.id) };
};

// ---- the four top links: they grow to his feet, and drop first when it falls ----
const taut = (F: P2, Tp: P2): Cubic => {
  const dy = Tp[1] - F[1];
  return [F, [F[0], F[1] + 0.42 * dy], [Tp[0], Tp[1] - 0.42 * dy], Tp];
};
export const topLinkAt = (i: number, f: number): { c: Cubic; draw: number } => {
  const n = N[i];
  const Tp = anchorsAt(n, f).top;
  const rest = taut(SEAT, Tp);
  const u = smoothstep((f - 90 - 1.3 * hash(i, 181) * 2) / 10);
  if (u <= 0) return { c: rest, draw: drawOf(n, f) };
  const L = Math.hypot(SEAT[0] - Tp[0], SEAT[1] - Tp[1]);
  const side = REST[i].top[0] < 0 ? 1 : -1; // it drops toward the empty middle
  const E: P2 = [Tp[0] + side * 0.44 * L, Tp[1] + 0.05 * L + 16];
  const down: Cubic = [E, [E[0] - side * 0.14 * L, E[1] - 0.05 * L], [Tp[0] + side * 0.14 * L, Tp[1] - 0.07 * L], Tp];
  return { c: [lerp2(rest[0], down[0], u), lerp2(rest[1], down[1], u), lerp2(rest[2], down[2], u), lerp2(rest[3], down[3], u)], draw: 1 };
};

// ---------------------------------------------------------------------------
// GESTURE 1: the stroke, and the Ruler knocked from his place
// ---------------------------------------------------------------------------
const SW_A: P2 = [1200, 140];
const SW_C: P2 = [760, 150];
const SW_B: P2 = [430, 560];
export const sweepPoint = (u: number): P2 => {
  const v = 1 - u;
  return [v * v * SW_A[0] + 2 * v * u * SW_C[0] + u * u * SW_B[0], v * v * SW_A[1] + 2 * v * u * SW_C[1] + u * u * SW_B[1]];
};
const SW_HIT = 0.83; // the stroke's parameter on his chest
/** the stroke's head parameter and its opacity */
export const sweepAt = (f: number) => ({
  head: (SW_HIT * (f - T.sweep[0])) / (T.sweep[1] - T.sweep[0]),
  op: f < T.sweep[0] ? 0 : 1 - smoothstep((f - 72) / 7),
});
export const RULER_PX = N[0].size * S;
/** the Ruler: his CENTRE (world px), his turn (deg), how inked he is, how far his orange has drained */
export const rulerAt = (f: number) => {
  const ink = smoothstep((f - T.rulerInk[0]) / (T.rulerInk[1] - T.rulerInk[0]));
  const a = smootherstep((f - T.knock[0]) / (T.knock[1] - T.knock[0]));
  const b = smoothstep((f - T.sink[0]) / (T.sink[1] - T.sink[0]));
  const standing = 1 - smoothstep((f - T.knock[0]) / 2);
  return {
    x: SEAT[0] - 158 * a - 16 * b,
    y: SEAT[1] - RULER_PX / 2 + 10 * (1 - ink) + 186 * Math.pow(a, 1.5) + 258 * b,
    rot: -80 * a - 9 * b + standing * commonerSway(0, f, 3),
    ink,
    drain: smoothstep((f - T.drain[0]) / (T.drain[1] - T.drain[0])),
  };
};
export const seatOpAt = (f: number) => INK_CONTEXT * smoothstep((f - 72) / 6) * (1 - smoothstep((f - 93) / 8));

// ---------------------------------------------------------------------------
// THE DISPERSED: independent bands, each its own headman and his few people
// ---------------------------------------------------------------------------
export const BANDS_CX = TREE_X + GLIDE + 14;
/** the band field in world px: in the settled framing it fills screen x ~80-1000, y ~300-1120 */
export const BAND_AREA = { x0: BANDS_CX - 468, x1: BANDS_CX + 468, y0: 296, y1: 1128 };
/** R1: the whole field 1.35x (headmen ~82 px, followers 42-48 px) */
const BAND_SCALE = 1.35;
/** the field's centre of mass in world y (screen y ~760 in the settled framing) */
const BAND_COM_Y = 742;
export type Band = {
  x: number;
  y: number; // the headman's feet
  size: number; // his height (px)
  lean: number;
  followers: { x: number; y: number; size: number; kind: "official" | "commoner"; seed: number }[];
};
export const BANDS: Band[] = (() => {
  const rand = makeRng(BAND_SEED);
  // each band's own shape first (relative to its headman's feet) ...
  const shapes = Array.from({ length: 9 }, (_, bi) => {
    const n = 3 + Math.floor(rand() * 4); // 3..6 followers
    const size = (58 + 6 * rand()) * BAND_SCALE;
    const followers: Band["followers"] = [];
    for (let j = 0; j < n; j++) {
      let fx = 0;
      let fy = 0;
      for (let tries = 0; tries < 80; tries++) {
        fx = (rand() - 0.5) * 2 * (26 + 8 * n) * BAND_SCALE;
        fy = (54 + rand() * 30) * BAND_SCALE;
        if (followers.every((q) => Math.hypot(q.x - fx, (q.y - fy) * 0.8) > 29 * BAND_SCALE)) break;
      }
      const kind = rand() < 0.55 ? "official" : "commoner";
      followers.push({ x: fx, y: fy, size: kind === "official" ? 44 + 4 * rand() : 42 + 4 * rand(), kind, seed: bi * 17 + j });
    }
    followers.sort((a, b) => a.y - b.y);
    const bx0 = Math.min(-24, ...followers.map((q) => q.x - 14));
    const bx1 = Math.max(24, ...followers.map((q) => q.x + 14));
    return { size, lean: (rand() - 0.5) * 5, followers, box: [bx0, bx1, -size, Math.max(...followers.map((q) => q.y))] };
  });
  // ... then its place. Nine boxes this size cannot be thrown at random into
  // the field with daylight between them (dart-throwing huddles; maximising
  // daylight makes a 3 x 3 grid), so: three loose files whose bands stand at
  // staggered heights (no two neighbours level: never a row), each band then
  // pushed off its file and height by its own hashed amount
  const W = BAND_AREA.x1 - BAND_AREA.x0;
  const H = BAND_AREA.y1 - BAND_AREA.y0;
  const FILE_X = [0.15, 0.52, 0.85];
  const FILE_Y = [0.0, 0.17, 0.06]; // each file's own drop
  const STEP = [0.292, 0.288, 0.308];
  const OFF_X = [
    [-26, -58, 34],
    [62, 26, -52],
    [-12, 70, 44],
  ];
  const placed = shapes.map((sh, bi) => {
    const col = [0, 1, 2, 1, 2, 0, 2, 0, 1][bi];
    const row = Math.floor(bi / 3);
    // each band leaves its file by its own amount (up to ~70 px), so no file reads as a column
    const x = BAND_AREA.x0 + W * FILE_X[col] + (rand() - 0.5) * 50 + OFF_X[row][col];
    const top = BAND_AREA.y0 + H * (FILE_Y[col] + STEP[col] * row) + (rand() - 0.5) * 46;
    const y = top - sh.box[2];
    return { x, y, b: [x + sh.box[0], x + sh.box[1], y + sh.box[2], y + sh.box[3]] };
  });
  // centre the field's mass on (BANDS_CX, BAND_COM_Y)
  const mx = placed.reduce((a, q) => a + (q.b[0] + q.b[1]) / 2, 0) / placed.length - BANDS_CX;
  const my = placed.reduce((a, q) => a + (q.b[2] + q.b[3]) / 2, 0) / placed.length - BAND_COM_Y;
  return shapes.map((sh, bi) => {
    const x = placed[bi].x - mx;
    const y = placed[bi].y - my;
    return { x, y, size: sh.size, lean: sh.lean, followers: sh.followers.map((q) => ({ ...q, x: q.x + x, y: q.y + y })) };
  });
})();
export const bandSway = (seed: number, f: number, amp: number) =>
  amp * (0.7 * Math.sin(f / (5 + 4.4 * hash(seed, 141)) + 6.283 * hash(seed, 142)) + 0.3 * Math.sin(f / (2.4 + 1.6 * hash(seed, 143)) + 6.283 * hash(seed, 144)));
