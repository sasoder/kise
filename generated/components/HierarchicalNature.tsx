import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  HierLabel,
  HierPage,
  INK_CONTEXT,
  INK_FULL,
  LINK_TAPER,
  TREE,
  Tree,
  WorldSvg,
  bottomOf,
  camFor,
  clamp01,
  hash,
  linkLength,
  pchip,
  smoothstep,
  swayCam,
  topOf,
  type Cam,
  type LinkState,
  type NodeState,
  type Pulse,
  type TreeNode,
} from "./hierShared";

// ---------------------------------------------------------------------------
// HierarchicalNature (G1 of 3), R1. Dwarkesh Patel with Si Sheppard, clip
// "Centralized empires fell fast". Dwarkesh map style, a PAGE cut (the dark
// land page, no map). Opaque 1080x1920, 24 fps.
//
// THE LINE (sequence 19.311-24.316 s; f = round((t - 19.311) * 24)):
//   "The vulnerability of the Aztec, the Inca, was that hierarchical nature of
//    their society. (And...)"
//   The f3 · vulnerability f14 · of f28 · the f31 · AZTEC f31-46 · the f46 ·
//   INCA f49-60 · was f67 · that f70 · HIERARCHICAL f70-81 · NATURE f81 ·
//   of f87 · their f90 · SOCIETY f92-101 · (And f111) · end f120.
// DURATION = round(5.005 * 24) = 120 frames (f0..f119), no tail: the interval
// is fixed by the edit.
//
// THE PICTURE. Two identical trees (hierShared TREE) side by side at scale
// 1.08 (475 px wide): the left centred on x 285, the right on x 795; the base
// crowds' feet at y 1125, the apex plume tips at y 445, the names' baselines
// at y 322 (62 px). CLIP RULE: orange = THE ONE AT THE TOP (the Ruler);
// everything else cream at INK_FULL / INK_CONTEXT.
//
// GESTURES (the only ones):
//   0. f0-f119   THE RISE, one continuous motion through the whole cut: a
//                front (a height in the tree; FRONT_KEYS through a monotone
//                C1 spline, never at rest) climbs from the crowd to the top.
//                Every link draws along its own length from its lower end as
//                the front crosses it, each on its own small lag; a figure
//                inks in (8 f, rising 10 px) when the first of its links
//                arrives. On f0 both crowds stand there (every one with his
//                own sway) and their links are already ~25 % risen; the links
//                reach the officials' feet f46-f54; the officials ink in
//                f46-f62. The camera creeps in 3 % (constant rate in ln k,
//                never at rest) with the house hand drift.
//   1. "Aztec" f31    AZTEC slides up over the left tree from f23; the left
//                crowd and its rising links go INK_CONTEXT -> INK_FULL f23-f31.
//   2. "Inca" f49     INCA from f41; the right crowd and links f41-f49.
//   3. "hierarchical nature" f70-f92   the rise goes on, faster: officials ->
//                lords links ~f52-f70, the 4 lords inked by f80 (before
//                "nature" f81), then the four top links ~f76-f90.
//   4. "society" f92  the four links converge on ONE point; the Ruler inks in
//                ORANGE there f88-f97 (10 px rise): the only orange in the cut.
//   5. f97-f119  hand-off: bright dashes (INK_FULL, 26 px, 1.25 x the link's
//                weight) travel UP every tier from the many to the orange
//                head, each chain on its own clock; the cut ends mid-flow.
// Nothing else: no tier labels, no map, no numbers, no boxes, no ground lines.
// Two rungs only: the crowd and its fan at INK_FULL once named; the links of
// the two upper tiers at INK_CONTEXT (the pulses are the INK_FULL on them).
//
// FACTS DRAWN: none beyond the line. The tree is SCHEMATIC (1 -> 4 -> 12 ->
// the many is the set's shared vocabulary, not a count of any polity), and
// the figures are deliberately culture-neutral.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 120;

export const schema = z.object({
  vignette: z.number(),
  /** the camera's total creep (1.03 = 3 %) */
  creep: z.number(),
  /** the share of commoners whose chain carries a loyalty pulse */
  pulseShare: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, creep: 1.03, pulseShare: 0.34 });

// ---- layout (world px == screen px at k 1, the middle of the creep) ----
export const TREE_SCALE = 1.08;
export const TREES = [
  { name: "AZTEC", x: 285, y: 1125, f0: 23 },
  { name: "INCA", x: 795, y: 1125, f0: 41 },
];
const LABEL_Y = 322;
const LABEL_PX = 62;
const ANCHOR: [number, number] = [540, 760];
/** k runs creep^-1/2 -> creep^1/2 at a constant rate in ln k */
export const camAt = (f: number, creep: number): Cam => camFor(ANCHOR, Math.exp(Math.log(creep) * (f / (DURATION - 1) - 0.5)), ANCHOR[0], ANCHOR[1]);

// ---- the front: a height (tree-local y) rising through the tree, C1 ----
export const FRONT_KEYS: [number, number][] = [
  [0, -60],
  [46, -203],
  [68, -378],
  [88.5, TREE.ruler.y],
];
const FRONT = pchip(FRONT_KEYS);
export const frontY = (f: number) => Math.max(TREE.ruler.y, FRONT(f));
/** the frame the front reaches local height y */
const frontFrameAt = (y: number) => {
  let lo = -60;
  let hi = 140;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (FRONT(mid) > y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
const INK_IN = 8; // frames a figure takes to ink in
const RISE = 10; // px it rises while it does
const RULER_INK: [number, number] = [88, 97];

// ---- the pulses ----
const PULSE_V = 11; // local px per frame
const PULSE_T = 46; // frames between two pulses of one chain
const PULSE_LEN = 26;
const PULSE_W = 1.25;
const PULSE_IN: [number, number] = [97, 104];

type TreeClock = {
  lag: number[]; // per link (by child id): frames behind the front
  inkAt: number[]; // per node: the frame it starts to ink in
  chains: { segs: { id: number; s0: number; len: number }[]; phase: number }[];
};
const buildClock = (ti: number, pulseShare: number): TreeClock => {
  const N = TREE.nodes;
  const h = (id: number, k: number) => hash(id + ti * 131, k);
  // each official gathers his own people a little sooner or later (0-7 f)
  const own = N.map((n) => (n.tier === 2 ? 7 * h(n.id, 52) : 0));
  const lag = N.map((n) => (n.tier === 3 ? own[n.parent] + 1.5 * h(n.id, 51) : n.tier === 2 ? 0.5 * own[n.id] + 1.5 * h(n.id, 51) : 2 * h(n.id, 51)));
  const inkAt = N.map((n) => {
    if (n.tier === 3) return -1e9;
    return frontFrameAt(bottomOf(n)[1]) + Math.min(...n.children.map((c) => lag[c])) - 0.5;
  });
  const chains: TreeClock["chains"] = [];
  for (const id of TREE.byTier[3]) {
    if (h(id, 61) > pulseShare) continue;
    const segs: { id: number; s0: number; len: number }[] = [];
    let s = 0;
    for (const n of TREE.chainOf(id)) {
      if (n.parent < 0) break;
      const len = linkLength(n);
      segs.push({ id: n.id, s0: s, len });
      // the gap: the figure the link lands on (the pulse passes behind him)
      s += len + bottomOf(N[n.parent])[1] - topOf(N[n.parent])[1];
    }
    chains.push({ segs, phase: h(id, 62) * PULSE_T });
  }
  return { lag, inkAt, chains };
};

const HierarchicalNature: React.FC<Props> = ({ vignette, creep, pulseShare }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame, creep), frame);
  const clocks = React.useMemo(() => TREES.map((_, ti) => buildClock(ti, pulseShare)), [pulseShare]);

  return (
    <HierPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        {TREES.map((tr, ti) => {
          const ck = clocks[ti];
          const crowd = INK_CONTEXT + (INK_FULL - INK_CONTEXT) * smoothstep((frame - tr.f0) / 8);
          const node = (n: TreeNode): NodeState => {
            if (n.tier === 3) return { op: crowd };
            if (n.tier === 0) {
              const u = smoothstep((frame - RULER_INK[0]) / (RULER_INK[1] - RULER_INK[0]));
              return { op: u, dy: RISE * (1 - u) };
            }
            const u = smoothstep((frame - ck.inkAt[n.id]) / INK_IN);
            return { op: INK_FULL * u, dy: RISE * (1 - u) };
          };
          const link = (c: TreeNode): LinkState => {
            const y1 = topOf(c)[1];
            const y0 = bottomOf(TREE.nodes[c.parent])[1];
            const draw = clamp01((y1 - frontY(frame - ck.lag[c.id])) / (y1 - y0));
            return { op: c.tier === 3 ? crowd : INK_CONTEXT, draw, from: "child" };
          };
          // the pulses: a second pass of the same tree that draws nothing but
          // the bright dashes (figures and links at 0), 1.25 x the link's weight
          const pulses = new Map<number, Pulse[]>();
          const amp = smoothstep((frame - PULSE_IN[0]) / (PULSE_IN[1] - PULSE_IN[0]));
          if (amp > 0.003)
            for (const ch of ck.chains) {
              const s = ((((frame - ch.phase) % PULSE_T) + PULSE_T) % PULSE_T) * PULSE_V;
              for (const sg of ch.segs) {
                const at = s - sg.s0;
                if (at + PULSE_LEN <= 0 || at >= sg.len) continue;
                const arr = pulses.get(sg.id) ?? [];
                arr.push({ at, len: PULSE_LEN, op: INK_FULL * amp });
                pulses.set(sg.id, arr);
              }
            }
          return (
            <React.Fragment key={tr.name}>
              <Tree x={tr.x} y={tr.y} scale={TREE_SCALE} frame={frame} seed={ti + 1} node={node} link={link} />
              {pulses.size > 0 ? (
                <Tree
                  x={tr.x}
                  y={tr.y}
                  scale={TREE_SCALE}
                  frame={frame}
                  seed={ti + 1}
                  node={(n) => ({ ...node(n), op: 0 })}
                  link={(c) => ({ op: 0, width: LINK_TAPER[c.tier] * PULSE_W, pulses: pulses.get(c.id) })}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </WorldSvg>
      {TREES.map((tr) => (
        <HierLabel key={tr.name} text={tr.name} x={tr.x} y={LABEL_Y} cam={cam} frame={frame} f0={tr.f0} size={LABEL_PX} />
      ))}
    </HierPage>
  );
};

export default HierarchicalNature;
