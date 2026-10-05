import {
  DOT_R,
  camFromTrack,
  clamp01,
  cumLen,
  glideTargetAt,
  hash01,
  runFollower,
  smoothstep,
  sz,
} from "./chinatalkShared";
import type { Cam, Glide, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// shadowBankingGeom — the static world of ShadowBanking (Logan credit V2, cut 5):
// the official channel, its five openings, the seep network below, the growth
// clock that drives the network's front, and the camera track. Pure numbers, no
// React, so the measuring script can import it.
// ---------------------------------------------------------------------------

export const FPS = 24;
/** first word "you" on the edit timeline (24 fps) */
export const IN = 1056;
/** "system" ends at S 1211 -> 155 local + 16 tail */
export const DURATION = 171;

// --- the channel ----------------------------------------------------------------
export const CH_Y = 600;
/** the broad credit flow: a red band FLOW_H tall (~80 screen px at the opening framing) */
export const FLOW_H = 44;
export const BANK_U = 568;
export const BANK_L = 632;
export const CH_X0 = -900;
export const CH_X1 = 1980;

// --- the travelling highlight: one pulse at a time running left -> right --------
// Its speed eases up as the camera pulls back so it keeps ~18-14 screen px/f.
export const HX0 = 308; // world x of pulse 0 at f 0
export const HSP = 1100; // world px between pulses (one in frame at a time, mostly)
export const HL = 100; // half length of the pulse
const hvAt = (f: number) => 8 + 7 * smoothstep((f - 70) / 60);
const HX_STEP = 0.25;
const HX_TAB: number[] = (() => {
  const t = [0];
  for (let i = 1; i <= 260 / HX_STEP; i++) t.push(t[i - 1] + ((hvAt((i - 1) * HX_STEP) + hvAt(i * HX_STEP)) / 2) * HX_STEP);
  return t;
})();
/** distance pulse 0 has run since f 0 */
const hxRun = (f: number) => {
  const x = Math.max(0, Math.min(HX_TAB.length - 2, f / HX_STEP));
  const i = Math.floor(x);
  return HX_TAB[i] + (HX_TAB[i + 1] - HX_TAB[i]) * (x - i);
};
/** the frame pulse 0 passes world x */
const hxTime = (x: number) => {
  let f = 0;
  while (HX0 + hxRun(f) < x && f < 260) f += 0.05;
  return f;
};
export const pulseXs = (f: number) => [-2, -1, 0].map((n) => HX0 + hxRun(f) - n * HSP);

// --- the openings ------------------------------------------------------------------
/** s1 = final seal side (world px): five DIFFERENT sizes ("different"); the
 *  bank parts right after the pulse passes (LAG frames behind it). */
const LAG = 6;
const OPEN_DEF = [
  { x: 380, s1: 28 },
  { x: 462, s1: 42 },
  { x: 540, s1: 23 },
  { x: 613, s1: 50 },
  { x: 700, s1: 34 },
];
export const OPENS = OPEN_DEF.map((o, i) => {
  const s0 = 0.74 * o.s1;
  /** hanging bead radius (world, fixed: geometry, not the size law) */
  const R = DOT_R * (0.66 + 0.44 * (o.s1 / 50)) * sz(1.85);
  return {
    ...o,
    i,
    s0,
    R,
    t: hxTime(o.x) + LAG,
    /** widen stagger: 2 f, in a scattered order so it reads as many, not a wipe */
    tw: 57 + [2, 0, 3, 1, 4][i] * 2,
    /** bead swell stagger */
    tb: 62 + [1, 3, 0, 4, 2][i] * 1.5,
  };
});
export type Open = (typeof OPENS)[number];
export const STRETCH = 11;
/** the opening's seal side at frame f */
export const sealSide = (o: Open, f: number) => {
  const a = 1 - Math.pow(1 - clamp01((f - o.t) / 9), 3);
  const w = smoothstep((f - o.tw) / 16);
  return o.s0 * a + (o.s1 - o.s0) * w;
};
export const beadGrow = (o: Open, f: number) => 1 - Math.pow(1 - clamp01((f - o.tb) / 16), 3);
export const stretchAt = (f: number) => STRETCH * smoothstep((f - 72) / 14);
/** the hang: how far below the bank centre the bead's centre sits, before the seep */
export const hangAt = (o: Open, f: number) => sealSide(o, f) / 2 + o.R * beadGrow(o, f) + stretchAt(f);
/** the hang once complete (f >= 86) */
export const hangK = (o: Open) => o.s1 / 2 + o.R + STRETCH;

// --- the growth clock: the seep / network front, world px of arc --------------------
const vAt = (f: number) => {
  if (f < 82) return 0;
  if (f < 95) return 7 * smoothstep((f - 82) / 13);
  if (f < 106) return 7;
  if (f < 118) return 7 + 10 * smoothstep((f - 106) / 12);
  if (f < 138) return 17;
  if (f < 156) return 17 - 14.6 * smoothstep((f - 138) / 18);
  return 2.4;
};
const G_STEP = 0.1;
const G_MAX = 260;
const G_TAB: number[] = (() => {
  const t = [0];
  for (let i = 1; i <= G_MAX / G_STEP; i++) {
    const f0 = (i - 1) * G_STEP;
    const f1 = i * G_STEP;
    t.push(t[i - 1] + ((vAt(f0) + vAt(f1)) / 2) * G_STEP);
  }
  return t;
})();
export const gAt = (f: number) => {
  if (f <= 0) return 0;
  const x = Math.min(G_MAX / G_STEP - 1, f / G_STEP);
  const i = Math.floor(x);
  return G_TAB[i] + (G_TAB[i + 1] - G_TAB[i]) * (x - i);
};
export const growthSpeed = vAt;
/** the frame at which the front reached arc distance d (extrapolated back at 7/f below 0) */
export const tAtG = (d: number) => {
  if (d <= 0) return 82 + d / 7;
  let lo = 0;
  let hi = G_TAB.length - 1;
  if (G_TAB[hi] < d) return G_MAX;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (G_TAB[m] < d) lo = m;
    else hi = m;
  }
  const u = (d - G_TAB[lo]) / Math.max(1e-6, G_TAB[hi] - G_TAB[lo]);
  return (lo + u) * G_STEP;
};
export const G_END = gAt(DURATION);

// --- the network ---------------------------------------------------------------------
export type NodeKind = "src" | "a" | "b" | "c" | "tip";
export type Node = { id: string; p: Pt; kind: NodeKind; D: number };
export type Edge = { id: string; u: string; v: string; pts: Pt[]; cum: number[]; L: number; w: number; seep?: number; midY: number };

const NODE_DEF: Record<string, [number, number, NodeKind]> = {
  // first junctions, just under the openings
  a1: [368, 786, "a"],
  a2: [452, 820, "a"],
  a3: [550, 772, "a"],
  a4: [626, 812, "a"],
  a5: [712, 790, "a"],
  // the spread: heavier and deeper to the left, a long reach out to the right
  b1: [176, 904, "b"],
  b2: [318, 972, "b"],
  b3: [486, 928, "b"],
  b4: [598, 1006, "b"],
  b5: [792, 938, "b"],
  b6: [918, 868, "b"],
  c1: [74, 1066, "c"],
  c2: [204, 1132, "c"],
  c3: [376, 1112, "c"],
  c4: [516, 1178, "c"],
  c5: [700, 1128, "c"],
  c6: [858, 1074, "c"],
  c7: [992, 1000, "c"],
  d1: [128, 1262, "c"],
  d2: [302, 1300, "c"],
  d3: [452, 1338, "c"],
  d4: [652, 1302, "c"],
  d5: [902, 1218, "c"],
};
/** tendrils: leaves that keep creeping outward through the tail */
const TENDRIL_DIR: Record<string, [number, number]> = {
  d1: [-0.5, 0.86],
  d2: [-0.86, 0.5],
  d4: [0.9, 0.44],
  d5: [0.32, 0.95],
  c7: [0.2, 0.98],
};
const EDGE_DEF: [string, string, number][] = [
  ["a1", "b1", 7],
  ["a1", "b2", 7],
  ["a2", "b2", 7],
  ["a2", "b3", 6.4],
  ["a3", "b3", 7],
  ["a4", "b4", 7],
  ["a4", "b5", 6.4],
  ["a5", "b5", 7],
  ["a5", "b6", 6.4],
  ["b3", "b4", 5.6],
  ["b1", "c1", 6.2],
  ["b1", "c2", 6.2],
  ["b2", "c2", 6.2],
  ["b2", "c3", 6.2],
  ["b3", "c3", 5.8],
  ["b4", "c4", 6.2],
  ["b4", "c5", 6.2],
  ["b5", "c5", 5.8],
  ["b5", "c6", 6.2],
  ["b6", "c6", 5.8],
  ["b6", "c7", 6.2],
  ["c2", "c3", 5.4],
  ["c5", "c6", 5.4],
  ["c1", "d1", 5.6],
  ["c2", "d1", 5.6],
  ["c3", "d2", 5.6],
  ["c4", "d2", 5.4],
  ["c4", "d3", 5.6],
  ["c5", "d4", 5.6],
  ["c6", "d5", 5.6],
];

/** a capillary between two points: one gentle bow + a little S, seeded */
const capillary = (u: Pt, v: Pt, seed: number, amp: number): Pt[] => {
  const n = 20;
  const dx = v.x - u.x;
  const dy = v.y - u.y;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const A = amp * L * (hash01(seed, 3) > 0.5 ? 1 : -1) * (0.6 + 0.4 * hash01(seed, 1));
  const B = amp * 0.45 * L * (hash01(seed, 2) - 0.5) * 2;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off = A * Math.sin(Math.PI * t) + B * Math.sin(2 * Math.PI * t);
    out.push({ x: u.x + dx * t + nx * off, y: u.y + dy * t + ny * off });
  }
  return out;
};

export const NETWORK = (() => {
  const nodes: Record<string, Node> = {};
  for (const [id, [x, y, kind]] of Object.entries(NODE_DEF)) nodes[id] = { id, p: { x, y }, kind, D: Infinity };
  const edges: Edge[] = [];
  const mk = (id: string, u: string, v: string, pts: Pt[], w: number, seep?: number) => {
    const cum = cumLen(pts);
    edges.push({ id, u, v, pts, cum, L: cum[cum.length - 1], w, seep, midY: (pts[0].y + pts[pts.length - 1].y) / 2 });
  };
  // seeps: from the bank centre under each opening straight down to its first junction
  OPENS.forEach((o, i) => {
    const sid = `s${i + 1}`;
    nodes[sid] = { id: sid, p: { x: o.x, y: BANK_L }, kind: "src", D: -hangK(o) };
    const a = nodes[`a${i + 1}`];
    // a drip falls straight first, then wanders to its junction
    const neck: Pt = { x: o.x, y: BANK_L + 48 };
    const pts = [{ x: o.x, y: BANK_L }, ...capillary(neck, a.p, 11 + i, 0.05)];
    mk(`e-${sid}`, sid, a.id, pts, 7.4 + 2.2 * (o.s1 / 35), i);
  });
  EDGE_DEF.forEach(([u, v, w], j) => mk(`e-${u}-${v}`, u, v, capillary(nodes[u].p, nodes[v].p, 31 + j * 7, 0.09), w));
  // shortest arc distance from the openings (Bellman-Ford on a tiny graph)
  for (let it = 0; it < 40; it++) {
    let changed = false;
    for (const e of edges) {
      const a = nodes[e.u];
      const b = nodes[e.v];
      if (a.D + e.L < b.D - 1e-6) {
        b.D = a.D + e.L;
        changed = true;
      }
      if (b.D + e.L < a.D - 1e-6) {
        a.D = b.D + e.L;
        changed = true;
      }
    }
    if (!changed) break;
  }
  // tendrils: sized so each tip is still creeping at the last frame (ends ~45 px past the front)
  for (const [cid, [dx, dy]] of Object.entries(TENDRIL_DIR)) {
    const c = nodes[cid];
    const len = G_END + 45 - c.D;
    const n = Math.hypot(dx, dy);
    const tip: Pt = { x: c.p.x + (dx / n) * len, y: c.p.y + (dy / n) * len };
    const tid = `t-${cid}`;
    nodes[tid] = { id: tid, p: tip, kind: "tip", D: Infinity };
    const pts = capillary(c.p, tip, 97 + cid.charCodeAt(1) * 3 + cid.charCodeAt(0), 0.08);
    mk(`e-${tid}`, cid, tid, pts, 5.6);
    nodes[tid].D = c.D + edges[edges.length - 1].L;
  }
  return { nodes, edges };
})();

/** where the edge is drawn at front g: [0, a] from u and [L - b, L] from v */
export const edgeFronts = (e: Edge, g: number, f: number) => {
  const nu = NETWORK.nodes[e.u];
  const nv = NETWORK.nodes[e.v];
  let a: number;
  if (e.seep !== undefined) {
    const o = OPENS[e.seep];
    a = f < 86 ? Math.min(hangAt(o, f) + g, e.L) : Math.min(hangK(o) + g, e.L);
  } else a = Math.max(0, Math.min(e.L, g - nu.D));
  const b = Math.max(0, Math.min(e.L, g - nv.D));
  return { a, b, full: a + b >= e.L - 0.01 };
};
/** frames since arc length s (measured from u, or from v when fromV) was reached */
export const ageOn = (e: Edge, s: number, f: number, fromV = false) => {
  const n = NETWORK.nodes[fromV ? e.v : e.u];
  return f - tAtG(n.D + s);
};

// --- the camera ------------------------------------------------------------------------
// LOOK = content centre (lands at screen y 835). Four long C1 glides, superposed,
// through the shared damped follower (warmed up from F_PRE so f 0 is already moving).
export const CAM_START: Cam = { x: 512, y: 700, k: 1.85 };
export const GLIDES: Glide[] = [
  // 1. ride along the bank as the openings spring left -> right, easing in a touch
  { f0: -18, f1: 60, dx: 44, k: 1.9 },
  // 2. tilt down with the drips and seeps ("took place" -> "facilitated"), loosening
  { f0: 62, f1: 104, dx: -16, dy: 110, k: 1.42 },
  // 3. pull back: the shadow and its network take the column under a thin channel
  { f0: 80, f1: 134, dy: 250, k: 0.84 },
  // 4. the tail: a slow even drift outward with the creeping tips and the spreading cloud
  { f0: 128, f1: 240, dy: 12, k: 0.81, even: 0.35 },
];
export const F_PRE = -40;
const RUN = runFollower((f) => glideTargetAt(CAM_START, GLIDES, f), F_PRE, DURATION + 4);
export const CAM_TRACK: Cam[] = RUN.cams;
export const camAt = camFromTrack(CAM_TRACK, F_PRE);
export const CAM_REST: Cam = camAt(0);

// --- the label --------------------------------------------------------------------------
export const LABEL_Y = 1488;
export const LABEL_WORD_F = 124; // "banking"
/** paper left between a bank's cut end and the seal in its gap */
export const BANK_GAP = 3;
