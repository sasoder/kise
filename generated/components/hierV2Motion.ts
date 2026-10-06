// ---------------------------------------------------------------------------
// hierV2Motion: the camera, the two trees and the clocks of HierarchicalNatureV2
// (pure: no React / Remotion imports, so scripts can audit it with bun).
// World px == screen px at the wide (americasMapData).
// ---------------------------------------------------------------------------
import { AZTEC_TREE, CUZCO, EMPIRE_BOX, INCA_TREE, TENOCHTITLAN, type P2, type TreeNode } from "./americasMapData";

export const FPS = 24;
export const DURATION = 120;

export type Cam = { k: number; cx: number; cy: number };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const camFor = (p: P2, k: number, sx: number, sy: number): Cam => ({ k, cx: p[0] - (sx - 540) / k, cy: p[1] - (sy - 960) / k });

// ---- timing ----
export const T = {
  aztec: 23, // label + hatch rise start ("Aztec" f31)
  inca: 41, // ("Inca" f49)
  settle: 67, // the one move lands in the wide
  front: [66, 91] as [number, number], // the links draw inward
  ruler: [88, 97] as [number, number],
  pulses: [97, 104] as [number, number], // the pulses' fade-in
};

// ---- the camera: ONE eased move (already under way at f0) from the close on
// Mesoamerica to the wide holding both empires, then a 3 % creep; C1, never at rest
export const EMPIRE_C: P2 = [(EMPIRE_BOX.x0 + EMPIRE_BOX.x1) / 2, (EMPIRE_BOX.y0 + EMPIRE_BOX.y1) / 2];
/** the opening zoom: the Aztec territory 475 px wide (560 would push the pull-back past 30 px/f) */
export const K_OPEN = 475 / (EMPIRE_BOX.x1 - EMPIRE_BOX.x0);
const camOpen = (f: number): Cam => camFor(EMPIRE_C, K_OPEN * Math.exp(-0.0006 * f), 540, 800);
const CREEP = Math.log(1.03) / (DURATION - 1 - T.settle);
const WIDE_ANCHOR: P2 = [540, 760];
const camWide = (f: number): Cam => camFor(WIDE_ANCHOR, Math.exp(CREEP * (f - T.settle)), WIDE_ANCHOR[0], WIDE_ANCHOR[1]);
const mixCam = (a: Cam, b: Cam, g: number): Cam => {
  const k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * g);
  // the centre rides 1 / k, so a point of the page crosses the screen evenly through the zoom
  const w = Math.abs(a.k - b.k) < 1e-6 ? g : (1 / k - 1 / a.k) / (1 / b.k - 1 / a.k);
  return { k, cx: a.cx + (b.cx - a.cx) * w, cy: a.cy + (b.cy - a.cy) * w };
};
export const OPEN_LEAD = 14; // frames: how far into its ease the move already is at f0
export const cameraAt = (f: number): Cam => {
  const u0 = smoothstep(OPEN_LEAD / (T.settle + OPEN_LEAD));
  const h = (smoothstep((f + OPEN_LEAD) / (T.settle + OPEN_LEAD)) - u0) / (1 - u0);
  return h >= 1 ? camWide(f) : mixCam(camOpen(f), camWide(f), h);
};

// ---- the trees ----
export type Link = {
  /** the child's index in its tree's nodes */
  child: number;
  /** child end, control point, parent end (world px): a gentle quadratic */
  a: P2;
  c: P2;
  b: P2;
  d: string;
  len: number;
  /** path distance from the capital of its parent end / child end */
  pd0: number;
  pd1: number;
};
export type MapTree = { capital: P2; nodes: TreeNode[]; links: Link[]; pd: number[]; maxPd: number; leaves: number[] };
const buildTree = (capital: P2, nodes: TreeNode[], bow: number): MapTree => {
  const pos = (i: number): P2 => (i < 0 ? capital : [nodes[i].x, nodes[i].y]);
  const geom = nodes.map((n, i) => {
    const a = pos(i);
    const b = pos(n.parent);
    const s = (i % 2 ? 1 : -1) * bow;
    const c: P2 = [(a[0] + b[0]) / 2 - (b[1] - a[1]) * s, (a[1] + b[1]) / 2 + (b[0] - a[0]) * s];
    let len = 0;
    let p = a;
    for (let q = 1; q <= 16; q++) {
      const t = q / 16;
      const x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0];
      const y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1];
      len += Math.hypot(x - p[0], y - p[1]);
      p = [x, y];
    }
    return { a, b, c, len };
  });
  const pd: number[] = nodes.map(() => -1);
  const pdOf = (i: number): number => (i < 0 ? 0 : pd[i] >= 0 ? pd[i] : (pd[i] = pdOf(nodes[i].parent) + geom[i].len));
  nodes.forEach((_, i) => pdOf(i));
  const f2 = (v: number) => v.toFixed(2);
  const links = nodes.map((n, i) => ({
    child: i,
    ...geom[i],
    d: `M${f2(geom[i].a[0])},${f2(geom[i].a[1])} Q${f2(geom[i].c[0])},${f2(geom[i].c[1])} ${f2(geom[i].b[0])},${f2(geom[i].b[1])}`,
    pd0: pdOf(n.parent),
    pd1: pd[i],
  }));
  const hasKid = new Set(nodes.map((n) => n.parent));
  return { capital, nodes, links, pd, maxPd: Math.max(...pd), leaves: nodes.map((_, i) => i).filter((i) => !hasKid.has(i)) };
};
export const AZTEC = buildTree(TENOCHTITLAN, AZTEC_TREE, 0.07);
export const INCA = buildTree(CUZCO, INCA_TREE, 0.045);

// ---- the front: a path distance from the capital, shrinking from the outermost town to 0 ----
export const frontU = (f: number) => {
  const t = clamp01((f - T.front[0]) / (T.front[1] - T.front[0]));
  return 0.6 * t + 0.4 * smoothstep(t);
};
/** the front's path distance from the capital (world px); a hair beyond the last town before it starts */
export const frontD = (tree: MapTree, f: number) => (tree.maxPd + 0.01) * (1 - frontU(f));
/** how much of a link is drawn, from its child end */
export const linkDraw = (l: Link, D: number) => clamp01((l.pd1 - D) / (l.pd1 - l.pd0));

// ---- the pulses: dashes travelling inward on every leaf's chain ----
export type PulseSpec = { v: number; period: number; len: number };
export const PULSE_AZTEC: PulseSpec = { v: 3.4, period: 22, len: 9 };
export const PULSE_INCA: PulseSpec = { v: 7.5, period: 34, len: 15 };
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** per link: the dashes on it this frame as [from, to] arclengths from its CHILD end */
export const pulsesAt = (tree: MapTree, spec: PulseSpec, f: number, seed: number): P2[][] => {
  const out: P2[][] = tree.links.map(() => []);
  const gap = spec.v * spec.period;
  for (const leaf of tree.leaves) {
    const first = ((((f - hash(leaf + seed, 7) * spec.period) % spec.period) + spec.period) % spec.period) * spec.v;
    for (let t = first; t < tree.pd[leaf] + spec.len; t += gap) {
      // the dash covers path distances [q - len, q] from the capital... measured inward from the leaf: head at t
      const head = tree.pd[leaf] - t; // path distance of its head from the capital
      const tail = head + spec.len;
      for (let i = leaf; i >= 0; i = tree.nodes[i].parent) {
        const l = tree.links[i];
        const lo = Math.max(head, l.pd0);
        const hi = Math.min(tail, l.pd1);
        if (hi - lo > 0.4) out[i].push([l.pd1 - hi, l.pd1 - lo]);
      }
    }
  }
  return out;
};
