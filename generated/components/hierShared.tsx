// ---------------------------------------------------------------------------
// hierShared: THE HIERARCHY TREE of the clip "Sheppard: centralized empires
// fell fast" (Dwarkesh map style, page cuts). Owned by G1 (HierarchicalNature);
// imported read-only by G2. Once HIER_READY.md exists the exports below are
// FROZEN (additions only).
//
// CLIP RULE: orange (ACCENT / ACCENT_DEEP) = THE ONE AT THE TOP. The Ruler is
// the only orange thing. Everything else is cream INK at INK_FULL / INK_CONTEXT.
//
// THE TREE (local units = px at tree scale 1; x right, y DOWN, like the
// screen). Origin (0, 0) = the tree's centre line at the base crowd's feet.
//   bounds   x -220 ... +220 (440 wide), y -630 (the Ruler's plume tips) ... 0
//            (+ ~4 of foot jitter)
//   tier 0   1 Ruler      feet (0, -538), 92 tall (plume tips at -630)
//   tier 1   4 Lords      feet y ~ -375, x = -144, -48, 48, 144; 54 tall
//   tier 2   12 Officials feet y ~ -205, x = (j - 5.5) * 36.6; 34 tall
//   tier 3   96 commoners ("the many") in three loose hash-jittered rows, feet
//            y ~ -38 / -19 / 0, ~15 tall; 8 under each official (by x order)
//   ids      0 = Ruler; 1..4 Lords; 5..16 Officials; 17..112 commoners
// Every person stands upright with the feet at the node point (x, y). A link
// joins a child's TOP anchor (just above its head) to its parent's BOTTOM
// anchor (the parent's feet): the many gather at the feet of the one above.
// A link is identified by its CHILD node (every node but the Ruler has one).
//
// PLACING IT. <Tree x y scale /> draws inside an <svg> / <WorldSvg cam>: local
// (0, 0) lands on (x, y), 1 local unit = `scale` units. For a tree 440 px wide
// with the crowd's feet on screen y 1060 centred on x 290 at camera k 1:
// <Tree x={290} y={1060} scale={1} />. Its plume tips are then at y 430.
//
// API
//   tokens     INK ACCENT ACCENT_DEEP DARK LAND INK_FULL INK_CONTEXT FPS
//              FRAME_W FRAME_H fell fellSC + camera helpers (re-exported from
//              incaShared)
//   LINK_W     the ONE link stroke weight (3.2 at tree scale 1); LINK_CASING
//              the DARK casing's extra width; LINK_TAPER the per-tier width
//              factor the Tree uses by default (tier-3 links run thinner: they
//              end on 15 px people)
//   SIZE       { ruler, lord, official, commoner } heights at tree scale 1
//   TREE       { nodes: TreeNode[], byTier: number[][], bounds, ruler, chainOf(id) }
//   TreeNode   { id, tier, parent (-1 for the Ruler), children, x, y, size }
//   topOf(node) / bottomOf(node)        the rest anchors (local units)
//   linkPath(child, sag = 0)            the link's SVG path, PARENT -> CHILD
//   linkLength(child, sag = 0)          its length (local units)
//   linkPathBetween(parentBottom, childTop, sag = 0, bow = 1) / linkLengthBetween
//                                       the same curve between any two points
//                                       (sag 0 taut ... 1 slack, bowing to the
//                                       side `bow` = +1 right / -1 left)
//   nodeAnchors(node, state?)           { top, bottom } with a NodeState applied
//   commonerSway(id, frame, seed?)      the tiny individual sway (deg)
//   figures    <Ruler size armL armR headTilt legSwing look? /> <Lord size />
//              <Official size /> <Commoner size flip? /> : svg <g>, feet at
//              (0, 0), `size` = full height in px
//   <Tree x y scale frame? seed? node? link? />   the renderer (see TreeProps)
//   <HierPage cam vignette?>   the dark land page (PlanPage)
//   <HierLabel text x y cam frame f0 />  IM Fell English SC caps, 58 px, the
//              house slide-up entrance (starts f0)
// ---------------------------------------------------------------------------
import React from "react";
import {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  INK,
  INK_CONTEXT,
  INK_FULL,
  MapLabel,
  PlanPage,
  hash,
  type Cam,
} from "./incaShared";

export {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  FPS,
  FRAME_H,
  FRAME_W,
  INK,
  INK_CONTEXT,
  INK_FULL,
  LAND,
  WorldSvg,
  camFor,
  camScan,
  clamp01,
  fell,
  fellSC,
  hash,
  labelSlide,
  makeCamera,
  pchip,
  screenOf,
  smootherstep,
  smoothstep,
  swayCam,
} from "./incaShared";
export type { Cam } from "./incaShared";

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
/** the ONE stroke weight of a link (tree scale 1), cream over a DARK casing */
export const LINK_W = 3.2;
/** the DARK casing's extra width under a link (both sides together) */
export const LINK_CASING = 2.6;
/** the Tree's default width factor per CHILD tier (index = the child's tier):
 *  the links down to the 15 px commoners run thinner, or the fan is one slab */
export const LINK_TAPER = [1, 1, 0.82, 0.5];
/** figure heights at tree scale 1 (the Ruler's includes his plumes) */
export const SIZE = { ruler: 92, lord: 54, official: 34, commoner: 15 };

type P2 = [number, number];

// ---------------------------------------------------------------------------
// THE TREE (deterministic layout)
// ---------------------------------------------------------------------------
export type TreeNode = {
  id: number;
  tier: 0 | 1 | 2 | 3;
  /** the parent's id (-1 for the Ruler) */
  parent: number;
  children: number[];
  /** the feet, local units */
  x: number;
  y: number;
  /** the figure's full height */
  size: number;
};
const TOP_GAP = [0, 2.5, 2, 1.2];
const buildTree = () => {
  const nodes: TreeNode[] = [];
  const add = (tier: 0 | 1 | 2 | 3, parent: number, x: number, y: number, size: number) => {
    const id = nodes.length;
    nodes.push({ id, tier, parent, children: [], x, y, size });
    if (parent >= 0) nodes[parent].children.push(id);
    return id;
  };
  add(0, -1, 0, -538, SIZE.ruler);
  for (let g = 0; g < 4; g++) add(1, 0, (g - 1.5) * 96 + (hash(g, 11) - 0.5) * 5, -375 + (hash(g, 12) - 0.5) * 7, SIZE.lord * (0.97 + 0.06 * hash(g, 13)));
  for (let j = 0; j < 12; j++)
    add(2, 1 + Math.floor(j / 3), (j - 5.5) * 36.6 + (hash(j, 21) - 0.5) * 5, -205 + (hash(j, 22) - 0.5) * 9, SIZE.official * (0.95 + 0.1 * hash(j, 23)));
  // the many: three loose rows of 32, hash-jittered; then 8 to each official by x
  const crowd: { x: number; y: number; s: number }[] = [];
  const OFF = [0, 0.47, 0.16];
  const ROW_Y = [-38, -19, 0];
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 32; i++) {
      const q = r * 32 + i;
      crowd.push({
        x: -213 + ((i + OFF[r]) * 426) / 31.5 + (hash(q, 31) - 0.5) * 6.6,
        y: ROW_Y[r] + (hash(q, 32) - 0.5) * 9,
        s: SIZE.commoner * (0.9 + 0.2 * hash(q, 33)),
      });
    }
  crowd.sort((a, b) => a.x - b.x);
  crowd.forEach((c, q) => add(3, 5 + Math.floor(q / 8), c.x, c.y, c.s));
  return nodes;
};
const NODES = buildTree();
const BY_TIER = [0, 1, 2, 3].map((t) => NODES.filter((n) => n.tier === t).map((n) => n.id));
/** the rest anchors: a link leaves a child above its head and lands at its parent's feet */
export const topOf = (n: TreeNode): P2 => [n.x, n.y - n.size - TOP_GAP[n.tier]];
export const bottomOf = (n: TreeNode): P2 => [n.x, n.y];

/** the link curve PARENT (p0, above) -> CHILD (p1, below): a gentle engraved S
 *  (vertical tangents) when taut (sag 0); slack (sag 1) it bows to the side
 *  `bow` (+1 right, -1 left) and droops */
const linkCtrl = (p0: P2, p1: P2, sag: number, bow: number) => {
  const dy = p1[1] - p0[1];
  const L = Math.hypot(p1[0] - p0[0], dy);
  const c1: P2 = [p0[0] + sag * bow * 0.28 * L, p0[1] + 0.42 * dy + sag * 0.1 * L];
  const c2: P2 = [p1[0] + sag * bow * 0.34 * L, p1[1] - 0.42 * dy + sag * 0.3 * L];
  return [c1, c2];
};
const n2 = (v: number) => v.toFixed(2);
export const linkPathBetween = (parentBottom: P2, childTop: P2, sag = 0, bow = 1) => {
  const [c1, c2] = linkCtrl(parentBottom, childTop, sag, bow);
  return `M${n2(parentBottom[0])},${n2(parentBottom[1])} C${n2(c1[0])},${n2(c1[1])} ${n2(c2[0])},${n2(c2[1])} ${n2(childTop[0])},${n2(childTop[1])}`;
};
export const linkLengthBetween = (parentBottom: P2, childTop: P2, sag = 0, bow = 1) => {
  const [c1, c2] = linkCtrl(parentBottom, childTop, sag, bow);
  let len = 0;
  let px = parentBottom[0];
  let py = parentBottom[1];
  for (let i = 1; i <= 28; i++) {
    const t = i / 28;
    const u = 1 - t;
    const x = u * u * u * parentBottom[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * childTop[0];
    const y = u * u * u * parentBottom[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * childTop[1];
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
};
/** which side a slack link bows to by default: away from its parent's axis */
const bowOf = (child: TreeNode) => (child.x >= NODES[Math.max(0, child.parent)].x ? 1 : -1);
/** the link of `child` (to its parent) at rest: SVG path, PARENT -> CHILD */
export const linkPath = (child: TreeNode, sag = 0) => (child.parent < 0 ? "" : linkPathBetween(bottomOf(NODES[child.parent]), topOf(child), sag, bowOf(child)));
/** its length (local units) */
export const linkLength = (child: TreeNode, sag = 0) => (child.parent < 0 ? 0 : linkLengthBetween(bottomOf(NODES[child.parent]), topOf(child), sag, bowOf(child)));

export const TREE = {
  nodes: NODES,
  /** node ids per tier: [[0], lords, officials, commoners] */
  byTier: BY_TIER,
  /** local bounds (the Ruler's plume tips to the crowd's feet) */
  bounds: { x0: -220, x1: 220, y0: -630, y1: 4, width: 440, height: 634 },
  ruler: NODES[0],
  /** the chain of nodes from `id` up to the Ruler: [node, parent, ..., ruler] */
  chainOf: (id: number) => {
    const out: TreeNode[] = [];
    for (let n: TreeNode | undefined = NODES[id]; n; n = n.parent >= 0 ? NODES[n.parent] : undefined) out.push(n);
    return out;
  },
};

// ---------------------------------------------------------------------------
// FIGURES (the pageFigures manner in SVG: a DARK casing under everything, the
// fill, a thin dark contour, a hatch line or two). Glyph units: a figure is
// 100 units tall, feet at (0, 0), up negative. Culture-neutral: they serve the
// Aztec and the Inca tree alike.
// ---------------------------------------------------------------------------
type Tone = "main" | "deep" | "shade" | "dark";
type Part = { d: string; fill?: Tone; stroke?: Tone; w?: number; detail?: boolean; dw?: number; da?: number; noCase?: boolean };
type Piece = { parts: Part[]; t?: string };
export type Look = "cream" | "orange";
const COLORS: Record<Look, Record<Exclude<Tone, "dark">, string>> = {
  cream: { main: INK, deep: "#CDBF9C", shade: "#B9AA86" },
  orange: { main: ACCENT, deep: ACCENT_DEEP, shade: "#B87108" },
};
const P = (d: string, o: Omit<Part, "d"> = {}): Part => ({ d, ...o });
const circle = (cx: number, cy: number, r: number) => `M${cx - r},${cy} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0 Z`;
const rect = (x0: number, y0: number, x1: number, y1: number) => `M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`;
const limb = (a: P2, b: P2, wa: number, wb: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const f = (p: P2, n: number, s: number) => `${n2(p[0] + nx * n * s)},${n2(p[1] + ny * n * s)}`;
  return `M${f(a, wa / 2, 1)} L${f(b, wb / 2, 1)} L${f(b, wb / 2, -1)} L${f(a, wa / 2, -1)} Z`;
};
/** a feather: a leaf of length L and half-width w from (cx, cy), leaning `deg` from upright */
const leaf = (cx: number, cy: number, deg: number, L: number, w: number) => {
  const a = (deg * Math.PI) / 180;
  const q = (x: number, y: number) => `${n2(cx + x * Math.cos(a) - y * Math.sin(a))},${n2(cy + x * Math.sin(a) + y * Math.cos(a))}`;
  return `M${q(0, 0)} C${q(-w, -0.3 * L)} ${q(-w * 0.95, -0.78 * L)} ${q(0, -L)} C${q(w * 0.95, -0.78 * L)} ${q(w, -0.3 * L)} ${q(0, 0)} Z`;
};
const spine = (cx: number, cy: number, deg: number, L: number) => {
  const a = (deg * Math.PI) / 180;
  return `M${n2(cx + 0.22 * L * Math.sin(a))},${n2(cy - 0.22 * L * Math.cos(a))} L${n2(cx + 0.86 * L * Math.sin(a))},${n2(cy - 0.86 * L * Math.cos(a))}`;
};

/** the hand of the engraver at a figure's size (px): small figures take a
 *  lighter hand, or a crowd of casings reads as a dark smudge */
type Ink = { casing: number; casingPx: number; contour: number; contourPx: number; detail: number };
const inkFor = (px: number): Ink =>
  px <= 22
    ? { casing: 0.36, casingPx: 0.6, contour: 0.2, contourPx: 0.35, detail: 0 }
    : px <= 42
      ? { casing: 0.6, casingPx: 1.0, contour: 0.36, contourPx: 0.5, detail: 0.75 }
      : px <= 72
        ? { casing: 0.72, casingPx: 1.5, contour: 0.46, contourPx: 0.7, detail: 0.9 }
        : { casing: 0.8, casingPx: 2.1, contour: 0.55, contourPx: 0.9, detail: 1 };

const Glyph: React.FC<{ pieces: Piece[]; size: number; look?: Look }> = ({ pieces, size, look = "cream" }) => {
  const s = size / 100;
  const upp = 1 / s;
  const ink = inkFor(size);
  const col = COLORS[look];
  const pick = (c: Tone | undefined) => (c === "dark" ? DARK : col[c ?? "main"]);
  return (
    <g transform={`scale(${s.toFixed(4)})`} strokeLinejoin="round" strokeLinecap="round">
      <g opacity={ink.casing}>
        {pieces.map((pc, i) => (
          <g key={i} transform={pc.t}>
            {pc.parts.map((p, j) =>
              p.noCase || p.detail ? null : p.fill ? (
                <path key={j} d={p.d} fill={DARK} stroke={DARK} strokeWidth={2 * ink.casingPx * upp} />
              ) : (
                <path key={j} d={p.d} fill="none" stroke={DARK} strokeWidth={(p.w ?? 2) + 2 * ink.casingPx * upp} />
              ),
            )}
          </g>
        ))}
      </g>
      {pieces.map((pc, i) => (
        <g key={i} transform={pc.t}>
          {pc.parts.map((p, j) =>
            p.detail ? (
              ink.detail > 0 ? (
                <path key={j} d={p.d} fill="none" stroke={DARK} strokeOpacity={(p.da ?? 0.5) * ink.detail} strokeWidth={Math.max(p.dw ?? 0.9, 0.55 * upp)} />
              ) : null
            ) : p.fill === "dark" ? (
              <path key={j} d={p.d} fill={DARK} fillOpacity={p.da ?? 0.62} />
            ) : p.fill ? (
              <path key={j} d={p.d} fill={pick(p.fill)} stroke={DARK} strokeOpacity={ink.contour} strokeWidth={ink.contourPx * upp} />
            ) : (
              <path key={j} d={p.d} fill="none" stroke={pick(p.stroke)} strokeOpacity={p.da ?? 1} strokeWidth={p.w ?? 2} />
            ),
          )}
        </g>
      ))}
    </g>
  );
};

// ---- THE RULER: standing, a long cloak, a tall fan of plumes -----------------
const RULER_LEGS: Part[] = [
  P(limb([-4.6, -31], [-6.4, -1.5], 6.6, 4.8), { fill: "main" }),
  P(limb([4.6, -31], [6.4, -1.5], 6.6, 4.8), { fill: "main" }),
  P("M-9.8,-0.6 L-3.8,-0.6 M3.8,-0.6 L9.8,-0.6", { stroke: "dark", w: 2.2, noCase: true, da: 0.85 }),
];
const RULER_BODY: Part[] = [
  P("M-9,-61 L9,-61 L11.5,-27 L-11.5,-27 Z", { fill: "deep" }),
  P("M-6,-45 L6,-45", { detail: true, da: 0.6 }),
  P("M-12.5,-62.5 C-9.5,-64 -6,-64 -3.6,-63 L-5.4,-19.5 L-18,-16.5 Z", { fill: "main" }),
  P("M12.5,-62.5 C9.5,-64 6,-64 3.6,-63 L5.4,-19.5 L18,-16.5 Z", { fill: "main" }),
  P("M-9.8,-55 L-12.8,-21 M-7,-40 L-8,-21.5 M9.8,-55 L12.8,-21 M7,-40 L8,-21.5", { detail: true, da: 0.45 }),
  P("M-17,-19.6 L-5.6,-22.4 M17,-19.6 L5.6,-22.4", { detail: true, da: 0.5 }),
];
const RULER_ARM: Part[] = [P(limb([0, 0], [0, 24], 5.8, 4.4), { fill: "main" }), P(circle(0, 25.6, 2.9), { fill: "main" })];
const PLUME_AT: P2 = [0, -76.5];
const RULER_HEAD: Part[] = [
  P(rect(-3, -66.5, 3, -61.5), { fill: "main" }),
  P(leaf(PLUME_AT[0], PLUME_AT[1], -43, 18.5, 3.5), { fill: "deep" }),
  P(leaf(PLUME_AT[0], PLUME_AT[1], 43, 18.5, 3.5), { fill: "deep" }),
  P(leaf(PLUME_AT[0], PLUME_AT[1], -21, 22, 3.7), { fill: "main" }),
  P(leaf(PLUME_AT[0], PLUME_AT[1], 21, 22, 3.7), { fill: "main" }),
  P(leaf(PLUME_AT[0], PLUME_AT[1], 0, 23.5, 3.9), { fill: "main" }),
  P([-43, -21, 0, 21, 43].map((a, i) => spine(PLUME_AT[0], PLUME_AT[1], a, [18.5, 22, 23.5, 22, 18.5][i])).join(" "), { detail: true, da: 0.5, dw: 0.7 }),
  P(circle(0, -71, 7.2), { fill: "main" }),
  P("M-7.5,-76.6 C-3,-74.6 3,-74.6 7.5,-76.6 L7.2,-73.2 C3,-71.4 -3,-71.4 -7.2,-73.2 Z", { fill: "deep" }),
  P("M-7.2,-73.2 C-3,-71.4 3,-71.4 7.2,-73.2", { detail: true, da: 0.7 }),
];
/** the Ruler's shoulder joints and hip / neck pivots (glyph units, 100 = his height) */
const SHOULDER_L: P2 = [-12, -59.5];
const SHOULDER_R: P2 = [12, -59.5];
const ARM_REST = 8;
export type RulerPose = {
  /** each arm raised by this angle (deg): 0 hangs at his side, 90 straight out, 180 straight up */
  armL?: number;
  armR?: number;
  /** the head (and plumes) tipped on the neck (deg, + = clockwise) */
  headTilt?: number;
  /** both legs swung about the hips (deg, + = clockwise): a hanging body's legs trail */
  legSwing?: number;
};
/** THE RULER (the apex): standing, cloak, tall plumed headdress; the only
 *  orange thing. An svg <g>, feet at (0, 0); `size` = his full height in px
 *  (plume tips at -size). Arms, head and legs are articulated (RulerPose) */
export const Ruler: React.FC<{ size: number; look?: Look } & RulerPose> = ({ size, look = "orange", armL = 0, armR = 0, headTilt = 0, legSwing = 0 }) => (
  <Glyph
    size={size}
    look={look}
    pieces={[
      { parts: RULER_LEGS, t: legSwing ? `rotate(${n2(legSwing)} 0 -31)` : undefined },
      { parts: RULER_BODY },
      { parts: RULER_ARM, t: `translate(${SHOULDER_L[0]} ${SHOULDER_L[1]}) rotate(${n2(armL + ARM_REST)})` },
      { parts: RULER_ARM, t: `translate(${SHOULDER_R[0]} ${SHOULDER_R[1]}) rotate(${n2(-(armR + ARM_REST))})` },
      { parts: RULER_HEAD, t: headTilt ? `rotate(${n2(headTilt)} 0 -64)` : undefined },
    ]}
  />
);
/** where the Ruler's hands are (px, relative to his feet) for a pose: for strings tied to them */
export const rulerHand = (size: number, side: "L" | "R", raise = 0): P2 => {
  const s = size / 100;
  const sh = side === "L" ? SHOULDER_L : SHOULDER_R;
  const a = ((raise + ARM_REST) * Math.PI) / 180;
  const dir = side === "L" ? -1 : 1;
  return [(sh[0] + dir * Math.sin(a) * 25.6) * s, (sh[1] + Math.cos(a) * 25.6) * s];
};

// ---- THE LORD: a cloak and a headband ------------------------------------------
const LORD: Piece[] = [
  {
    parts: [
      P(limb([-5, -30], [-7, -1.5], 7.6, 5.6), { fill: "main" }),
      P(limb([5, -30], [7, -1.5], 7.6, 5.6), { fill: "main" }),
      P("M-10.8,-0.7 L-4,-0.7 M4,-0.7 L10.8,-0.7", { stroke: "dark", w: 2.6, noCase: true, da: 0.85 }),
      P("M-10,-75 L10,-75 L12.5,-27 L-12.5,-27 Z", { fill: "deep" }),
      P("M-14.5,-76 C-11,-78 -7,-78 -4.2,-77 L-6.2,-20.5 L-21,-17.5 Z", { fill: "main" }),
      P("M14.5,-76 C11,-78 7,-78 4.2,-77 L6.2,-20.5 L21,-17.5 Z", { fill: "main" }),
      P("M-11.4,-68 L-14.6,-22 M11.4,-68 L14.6,-22", { detail: true, da: 0.45, dw: 1.1 }),
      P(rect(-3.6, -81, 3.6, -75.5), { fill: "main" }),
      P(circle(0, -89.4, 10.4), { fill: "main" }),
      P("M-10,-92.6 C-5,-90 5,-90 10,-92.6", { stroke: "dark", w: 3, noCase: true, da: 0.72 }),
    ],
  },
];
/** A LORD: cloak + headband, cream. Feet at (0, 0), `size` px tall */
export const Lord: React.FC<{ size: number; look?: Look }> = ({ size, look = "cream" }) => <Glyph size={size} look={look} pieces={LORD} />;

// ---- THE OFFICIAL: a plain tunic ------------------------------------------------
const OFFICIAL: Piece[] = [
  {
    parts: [
      P(limb([-5.6, -36], [-7.8, -1.5], 8.4, 6.2), { fill: "main" }),
      P(limb([5.6, -36], [7.8, -1.5], 8.4, 6.2), { fill: "main" }),
      P(limb([-12.6, -71], [-17.4, -45], 6.4, 5), { fill: "main" }),
      P(limb([12.6, -71], [17.4, -45], 6.4, 5), { fill: "main" }),
      P("M-12,-75 C-6,-77 6,-77 12,-75 L15,-34 L-15,-34 Z", { fill: "main" }),
      P("M-13.4,-54 L13.4,-54", { detail: true, da: 0.5, dw: 1.6 }),
      P(rect(-3.8, -80, 3.8, -75), { fill: "main" }),
      P(circle(0, -88.5, 11.5), { fill: "main" }),
    ],
  },
];
/** AN OFFICIAL: a simpler cream figure. Feet at (0, 0), `size` px tall */
export const Official: React.FC<{ size: number; look?: Look }> = ({ size, look = "cream" }) => <Glyph size={size} look={look} pieces={OFFICIAL} />;

// ---- THE COMMONER: one silhouette, a lighter hand -------------------------------
const COMMONER_D = `${circle(0, -86, 13)} M-13,-71 L13,-71 L16.5,-33 L9.5,-33 L8.4,0 L1.6,0 L0,-27 L-1.6,0 L-8.4,0 L-9.5,-33 L-16.5,-33 Z`;
/** A COMMONER: a tiny cream figure (two paths), for the base crowd. Feet at (0, 0) */
export const Commoner: React.FC<{ size: number; look?: Look }> = ({ size, look = "cream" }) => {
  const s = size / 100;
  const ink = inkFor(size);
  return (
    <g transform={`scale(${s.toFixed(4)})`} strokeLinejoin="round">
      <path d={COMMONER_D} fill={DARK} stroke={DARK} strokeWidth={(2 * ink.casingPx) / s} opacity={ink.casing} />
      <path d={COMMONER_D} fill={COLORS[look].main} stroke={DARK} strokeOpacity={ink.contour} strokeWidth={ink.contourPx / s} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
export type NodeState = {
  /** the figure's opacity (0 hides it). Default INK_FULL */
  op?: number;
  /** an offset of the whole figure (local units); its links follow */
  dx?: number;
  dy?: number;
  /** a tilt (deg, + = clockwise) about `pivot`: "feet" (default; he leans) or
   *  "top" (he hangs from his top anchor and swings) */
  tilt?: number;
  pivot?: "feet" | "top";
  /** a size factor about the pivot (default 1) */
  scale?: number;
  /** false = this node takes no ambient sway (default true) */
  sway?: boolean;
  /** the Ruler only */
  look?: Look;
} & RulerPose;
export type Pulse = {
  /** where the pulse's TAIL is along the link, in local units from the CHILD end (it travels up as `at` grows); may run off either end (clipped) */
  at: number;
  /** its length in local units (default 14) */
  len?: number;
  /** its opacity (default INK_FULL) */
  op?: number;
};
export type LinkState = {
  /** the link's opacity (0 hides it). Default INK_CONTEXT */
  op?: number;
  /** how much of its length is drawn (0..1, default 1), growing from the end `from` ("child" default, or "parent") */
  draw?: number;
  from?: "child" | "parent";
  /** 0 taut (default) ... 1 slack */
  sag?: number;
  /** which side a slack link bows to (+1 right, -1 left; default away from the parent's axis) */
  bow?: number;
  /** stroke colour (default INK) and width factor on LINK_W (default LINK_TAPER[child.tier]) */
  color?: string;
  width?: number;
  /** brighter dashes travelling on the link */
  pulses?: Pulse[];
};

/** the tiny individual sway of a person (deg): two incommensurate sines per
 *  node, never unison. Amplitude by tier: commoners 6, officials 1.6, lords
 *  1.2, the Ruler 0.8 */
const SWAY_AMP = [0.8, 1.2, 1.6, 6];
export const commonerSway = (id: number, frame: number, seed = 0) => {
  const k = id + seed * 977;
  const tier = NODES[id]?.tier ?? 3;
  const a = SWAY_AMP[tier];
  return (
    a * 0.7 * Math.sin(frame / (4.6 + 4.2 * hash(k, 41)) + 6.283 * hash(k, 42)) +
    a * 0.3 * Math.sin(frame / (2.3 + 1.6 * hash(k, 43)) + 6.283 * hash(k, 44))
  );
};

type Resolved = { op: number; tilt: number; top: P2; bottom: P2; scale: number; st: NodeState };
const resolve = (n: TreeNode, st: NodeState, swayDeg: number): Resolved => {
  const scale = st.scale ?? 1;
  const tilt = (st.tilt ?? 0) + (st.sway === false ? 0 : swayDeg);
  const a = (tilt * Math.PI) / 180;
  const H = (n.size + TOP_GAP[n.tier]) * scale;
  const dx = st.dx ?? 0;
  const dy = st.dy ?? 0;
  let top: P2;
  let bottom: P2;
  if (st.pivot === "top") {
    top = [n.x + dx, n.y + dy - n.size - TOP_GAP[n.tier]];
    bottom = [top[0] - H * Math.sin(a), top[1] + H * Math.cos(a)];
  } else {
    bottom = [n.x + dx, n.y + dy];
    top = [bottom[0] + H * Math.sin(a), bottom[1] - H * Math.cos(a)];
  }
  return { op: st.op ?? INK_FULL, tilt, top, bottom, scale, st };
};
/** a node's anchors (local units) with a state applied: `top` (where its link
 *  to its parent leaves) and `bottom` (its feet: where its children's links land) */
export const nodeAnchors = (n: TreeNode, st: NodeState = {}) => {
  const r = resolve(n, st, 0);
  return { top: r.top, bottom: r.bottom };
};

// ---------------------------------------------------------------------------
// THE RENDERER
// ---------------------------------------------------------------------------
export type TreeProps = {
  /** where local (0, 0) (centre line, the crowd's feet) lands, and the units per local unit */
  x: number;
  y: number;
  scale?: number;
  /** the frame: when given, every person takes the tiny individual sway (commonerSway) */
  frame?: number;
  /** de-correlates the sway of two trees on one page */
  seed?: number;
  /** per-node state (default: every figure at INK_FULL) */
  node?: (n: TreeNode) => NodeState | undefined;
  /** per-link state, the link named by its CHILD node (default: every link whole, taut, at INK_CONTEXT) */
  link?: (child: TreeNode) => LinkState | undefined;
};
const EMPTY: NodeState = {};
/** ONE tree: the links (all DARK casings, then all inks, then the pulses),
 *  then the figures back to front. An svg <g>: put it inside <WorldSvg cam> */
export const Tree: React.FC<TreeProps> = ({ x, y, scale = 1, frame, seed = 0, node, link }) => {
  const R = NODES.map((n) => resolve(n, node?.(n) ?? EMPTY, frame === undefined ? 0 : commonerSway(n.id, frame, seed)));
  const casings: React.ReactNode[] = [];
  const inks: React.ReactNode[] = [];
  const pulses: React.ReactNode[] = [];
  for (const n of NODES) {
    if (n.parent < 0) continue;
    const ls = link?.(n) ?? {};
    const op = ls.op ?? INK_CONTEXT;
    const draw = ls.draw ?? 1;
    const hasPulse = !!ls.pulses && ls.pulses.length > 0;
    if ((op <= 0.003 || draw <= 0.002) && !hasPulse) continue;
    const p0 = R[n.parent].bottom;
    const p1 = R[n.id].top;
    const sag = ls.sag ?? 0;
    const bow = ls.bow ?? bowOf(n);
    const d = linkPathBetween(p0, p1, sag, bow);
    const L = linkLengthBetween(p0, p1, sag, bow);
    const w = LINK_W * (ls.width ?? LINK_TAPER[n.tier]);
    if (op > 0.003 && draw > 0.002) {
      const part = draw < 0.999;
      const da = part ? `${n2(draw * L)} ${n2(L * 2 + 10)}` : undefined;
      const off = part && (ls.from ?? "child") === "child" ? -(1 - draw) * L : undefined;
      casings.push(<path key={n.id} d={d} stroke={DARK} strokeOpacity={0.6 * op} strokeWidth={w + LINK_CASING * Math.min(1, w / LINK_W + 0.2)} strokeDasharray={da} strokeDashoffset={off} />);
      inks.push(<path key={n.id} d={d} stroke={ls.color ?? INK} strokeOpacity={op} strokeWidth={w} strokeDasharray={da} strokeDashoffset={off} />);
    }
    if (hasPulse)
      (ls.pulses as Pulse[]).forEach((pu, i) => {
        const len = pu.len ?? 14;
        const a0 = Math.max(0, pu.at);
        const a1 = Math.min(L, pu.at + len);
        const pop = pu.op ?? INK_FULL;
        if (a1 - a0 < 0.6 || pop <= 0.003) return;
        pulses.push(
          <path key={`${n.id}-${i}`} d={d} stroke={ls.color ?? INK} strokeOpacity={pop} strokeWidth={w} strokeDasharray={`${n2(a1 - a0)} ${n2(L * 2 + 10)}`} strokeDashoffset={-(L - a1)} />,
        );
      });
  }
  const order = NODES.slice().sort((a, b) => a.y - b.y);
  return (
    <g transform={`translate(${n2(x)} ${n2(y)}) scale(${scale.toFixed(5)})`}>
      <g fill="none" strokeLinecap="round">
        {casings}
        {inks}
      </g>
      <g fill="none" strokeLinecap="butt">
        {pulses}
      </g>
      {order.map((n) => {
        const r = R[n.id];
        if (r.op <= 0.003) return null;
        const sz = n.size * r.scale;
        return (
          <g key={n.id} opacity={r.op} transform={`translate(${n2(r.bottom[0])} ${n2(r.bottom[1])})${Math.abs(r.tilt) > 0.005 ? ` rotate(${n2(r.tilt)})` : ""}`}>
            {n.tier === 0 ? (
              <Ruler size={sz} look={r.st.look ?? "orange"} armL={r.st.armL} armR={r.st.armR} headTilt={r.st.headTilt} legSwing={r.st.legSwing} />
            ) : n.tier === 1 ? (
              <Lord size={sz} />
            ) : n.tier === 2 ? (
              <Official size={sz} />
            ) : (
              <Commoner size={sz} />
            )}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PAGE AND THE LABEL
// ---------------------------------------------------------------------------
/** the dark land page (LAND + world-space mottle, children, grain + vignette): no map */
export const HierPage: React.FC<{ cam: Cam; vignette?: number; children?: React.ReactNode }> = ({ cam, vignette = 0.55, children }) => (
  <PlanPage cam={cam} vignette={vignette}>
    {children}
  </PlanPage>
);
/** a spoken name over a tree: IM Fell English SC spaced caps, 58 px, anchored
 *  (middle) to world point (x, y) = its baseline; slides up 24 px while fading
 *  in from f0 (start it ~8 f before the word) */
export const HierLabel: React.FC<{ text: string; x: number; y: number; cam: Cam; frame: number; f0: number; size?: number; opacity?: number }> = ({
  text,
  x,
  y,
  cam,
  frame,
  f0,
  size = 58,
  opacity = INK_FULL,
}) => <MapLabel text={text} x={x} y={y} cam={cam} frame={frame} f0={f0} size={size} spacing={0.3} opacity={opacity} />;
