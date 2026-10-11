// ---------------------------------------------------------------------------
// DiesOutLineage (plague clip: Dwarkesh Patel with Kyle Harper, "Why the plague
// is so deadly to humans"; sequence 2.870 s - 7.975 s).
//
// CHECK LINE (what the viewer can say afterwards): "In people, plague is a
// side-branch that flares up and then ends; the main line carries on without
// us, in the rodents."
//
// SPOKEN (the speaker has just said "Plague never sustains itself in human
// populations."):
//   "It can transiently infect human populations, but then it always dies out.
//    It becomes extinct, that lineage."
// Word -> frame, 29.97 fps, f = round((t - 2.870) * 29.97):
//   It f0 · can f3 · transiently f9 · infect f28 · human f35 · populations f45 ·
//   but f59 · then f65 · it f69 · always f73 · dies f80 · out f88 · It f102 ·
//   becomes f104 · extinct f112 · that f133 · lineage f136 · speech ends f153.
// DURATION = 153 + 6 handle frames = 159.
//
// THE MOTION (one continuous move): close on a crowd, an orange twig of the
// bacterium's family tree grows through it at constant speed and turns each
// person it reaches orange (f0-58); from its root outward the twig then drains
// to a fine dead dashed line, the people go back to cream and every tip closes
// with an end-bar (f59-98); the camera's one long pull-back shows the dead twig
// is a small side-branch off a thick living orange trunk that runs on through
// the marmot medallion and out of frame right (f76-135), then a slow creep with
// a highlight travelling the trunk (f135-159).
//
// FACTS SHOWN: none as figures or text. The picture is the speaker's own claim
// (human outbreaks are dead-end side lineages; the bacterium persists in its
// rodent reservoir, here the kit's bobak marmot from Brehms Tierleben). The
// tree is schematic, not a real phylogeny.
// ---------------------------------------------------------------------------
import React from "react";
import { z } from "zod";
import { useCurrentFrame } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  type CamKey,
  DARK,
  DEAD,
  FPS as KIT_FPS,
  INK,
  Medallion,
  Page,
  Person,
  WorldSvg,
  clamp01,
  hash,
  mixColor,
  runCamera,
  smoothstep,
} from "./plagueShared";

export const FPS = KIT_FPS;
export const DURATION = 159;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.32 });

// ---------------------------------------------------------------------------
// WORLD. The final framing is cam (540, 839) k 1.45: the crowd's centre lands
// on screen y 760, the trunk on y ~1400 (20 px bold), a person stands 95 px tall.
// ---------------------------------------------------------------------------
type Pt = { x: number; y: number };
type Line = { pts: Pt[]; s: number[]; len: number };

const PERSON_H = 66;
const ROWS = 7;
const COLS = 8;
const pid = (r: number, c: number) => r * COLS + c;
const PEOPLE: (Pt & { id: number; seed: number })[] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const id = pid(r, c);
    PEOPLE.push({
      id,
      seed: id + 11,
      x: 285 + 68 * c + (r % 2 ? 34 : 0) + (hash(id, 21) - 0.5) * 24,
      y: 500 + 78 * r + (hash(id, 22) - 0.5) * 20,
    });
  }
}
const P = (r: number, c: number): Pt => PEOPLE[pid(r, c)];

/** Catmull-Rom through the nodes, sampled to a polyline with arc length */
const smoothLine = (nodes: Pt[], per = 14): Line => {
  const pts: Pt[] = [];
  const n = nodes.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = nodes[Math.max(0, i - 1)];
    const p1 = nodes[i];
    const p2 = nodes[i + 1];
    const p3 = nodes[Math.min(n - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      pts.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  pts.push(nodes[n - 1]);
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, s, len: s[s.length - 1] };
};
const pointAt = (l: Line, at: number): Pt => {
  const a = Math.max(0, Math.min(l.len, at));
  let i = 1;
  while (i < l.s.length - 1 && l.s[i] < a) i++;
  const u = (a - l.s[i - 1]) / Math.max(1e-6, l.s[i] - l.s[i - 1]);
  return { x: l.pts[i - 1].x + (l.pts[i].x - l.pts[i - 1].x) * u, y: l.pts[i - 1].y + (l.pts[i].y - l.pts[i - 1].y) * u };
};
/** path data of the stretch s0..s1 of a line ("" when empty) */
const sub = (l: Line, s0: number, s1: number) => {
  const a = Math.max(0, s0);
  const b = Math.min(l.len, s1);
  if (b - a < 0.05) return "";
  const out: Pt[] = [pointAt(l, a)];
  for (let i = 0; i < l.pts.length; i++) if (l.s[i] > a && l.s[i] < b) out.push(l.pts[i]);
  out.push(pointAt(l, b));
  return out.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("");
};

// THE TRUNK: the living lineage, left to right, gently curved like a root.
const FORK: Pt = { x: 281, y: 1142 };
const MED = { x: 722, y: 1141, r: 86 };
const TRUNK = smoothLine(
  [
    { x: -700, y: 1192 },
    { x: -200, y: 1160 },
    FORK,
    { x: 500, y: 1124 },
    { x: MED.x, y: MED.y },
    { x: 1000, y: 1118 },
    { x: 1400, y: 1132 },
    { x: 1900, y: 1110 },
  ],
  24,
);
const trunkSAtX = (x: number) => {
  let i = 0;
  while (i < TRUNK.pts.length - 1 && TRUNK.pts[i].x < x) i++;
  return TRUNK.s[i];
};
const TRUNK_V = 6.5; // world px per frame, constant
const TRUNK_S_EXIT = trunkSAtX(930); // the tip leaves the final framing on f130
const trunkTip = (f: number) => TRUNK_S_EXIT + TRUNK_V * (f - 130);

// THE TWIG: one side-branch off the trunk, forking through the crowd. Each
// branch is a list of people (row, col) it passes; `from` = [parent, node].
type BranchDef = { nodes: [number, number][]; from?: [number, number]; lead?: Pt[] };
const DEFS: BranchDef[] = [
  { nodes: [[6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1]], lead: [FORK, { x: 305, y: 1074 }] },
  { nodes: [[5, 1], [5, 2], [4, 3], [3, 3], [2, 4], [1, 4], [0, 5]], from: [0, 1] },
  { nodes: [[5, 2], [5, 3], [5, 4], [4, 5], [3, 5]], from: [1, 1] },
  { nodes: [[3, 1], [2, 2], [1, 2]], from: [0, 3] },
  { nodes: [[3, 3], [3, 4], [2, 5], [2, 6]], from: [1, 3] },
];
type Branch = { line: Line; d0: number; end: number; tip: Pt; dir: Pt; nodeD: number[] };
const BRANCHES: Branch[] = [];
const INFECT_D = new Map<number, number>(); // person id -> distance from the fork along the twig
DEFS.forEach((def) => {
  const feet = def.nodes.map(([r, c]) => P(r, c));
  // the tip runs on past its last person into the gap before the next one in
  // that rank, so the end-bar stands clear of every figure
  const last = feet[feet.length - 1];
  const [lr, lc] = def.nodes[def.nodes.length - 1];
  const next = P(lr, lc + 1);
  const tip = { x: (last.x + next.x) / 2 + 2, y: (last.y + next.y) / 2 - 5 };
  const lead = def.lead ?? [];
  const nodes = [...lead, ...feet, tip];
  const line = smoothLine(nodes);
  // arc length at every node: nodes sit at sample index i * per
  const nodeS = nodes.map((_, i) => line.s[i * 14]);
  const d0 = def.from ? BRANCHES[def.from[0]].nodeD[def.from[1]] : 0;
  const nodeD = feet.map((_, i) => d0 + nodeS[lead.length + i]);
  def.nodes.forEach(([r, c], i) => {
    if (!INFECT_D.has(pid(r, c))) INFECT_D.set(pid(r, c), nodeD[i]);
  });
  const e2 = line.pts[line.pts.length - 1];
  const e1 = line.pts[line.pts.length - 4];
  const el = Math.hypot(e2.x - e1.x, e2.y - e1.y);
  BRANCHES.push({ line, d0, end: d0 + line.len, tip, dir: { x: (e2.x - e1.x) / el, y: (e2.y - e1.y) / el }, nodeD });
});
const D_FIRST = BRANCHES[0].nodeD[0];
const D_MAX = Math.max(...BRANCHES.map((b) => b.end));

// TIMING. The tip: constant speed, already past the first person on f0, the
// last tip stops on f57. The drain front: constant speed from the fork, at the
// first person on f58, the last tip dead on f94.
const GROW_END = 57;
const LEAD_F = 4.5; // frames the tip is already past the first person on f0 (that person is fully orange)
const D0 = (D_FIRST + (LEAD_F / GROW_END) * D_MAX) / (1 + LEAD_F / GROW_END);
const GROW_V = (D_MAX - D0) / GROW_END;
const growD = (f: number) => Math.min(D_MAX, D0 + GROW_V * f);
const DRAIN = [58, 94] as const;
const DRAIN_V = (D_MAX - D_FIRST) / (DRAIN[1] - DRAIN[0]);
const drainD = (f: number) => D_FIRST + DRAIN_V * (f - DRAIN[0]);

const CAM: CamKey[] = [
  { f: 0, x: 478, y: 731, k: 2.62 },
  { f: 30, x: 508, y: 722, k: 2.56 },
  { f: 58, x: 534, y: 712, k: 2.5 },
  { f: 77, x: 544, y: 714, k: 2.4 },
  { f: 92, x: 542, y: 719, k: 2.2 },
  { f: 108, x: 540, y: 790, k: 1.72 },
  { f: 122, x: 540, y: 835, k: 1.475 },
  { f: 130, x: 540, y: 839, k: 1.45 },
  { f: 159, x: 540, y: 841, k: 1.43 },
];

const DEAD_LINE = mixColor(DEAD, INK, 0.8);
const DASH = "9 6";
// the crowd is a loose body of people, not a block: a few corner places stay empty
const EMPTY = new Set([pid(0, 0), pid(0, 7), pid(6, 7), pid(1, 7), pid(6, 0)]);
const SORTED = PEOPLE.filter((p) => !EMPTY.has(p.id)).sort((a, b) => a.y - b.y);

const DiesOutLineage: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);
  const g = growD(frame);
  const e = Math.max(0, drainD(frame));

  // the trunk: tip travelling right; a highlight runs along it through the hold
  const tS = trunkTip(frame);
  const trunkD = sub(TRUNK, 0, tS);
  const hlU = clamp01((frame - 122) / (DURATION - 122));
  const hlS = trunkSAtX(150) + (trunkSAtX(960) - trunkSAtX(150)) * hlU;
  const hlOp = Math.sin(Math.PI * hlU) * 0.7;

  return (
    <Page vignette={vignette}>
      <WorldSvg cam={cam}>
        {/* the twig, under the people: dead dashed behind the drain front, orange ahead of it */}
        {BRANCHES.map((b, i) => {
          const dead = sub(b.line, 0, Math.min(e, g) - b.d0);
          const live = sub(b.line, e - b.d0, g - b.d0);
          return (
            <g key={`b${i}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
              {dead ? (
                <>
                  <path d={dead} stroke={DARK} strokeOpacity={0.4} strokeWidth={5} strokeDasharray={DASH} strokeLinecap="butt" />
                  <path d={dead} stroke={DEAD_LINE} strokeWidth={2.9} strokeDasharray={DASH} strokeLinecap="butt" />
                </>
              ) : null}
              {live ? (
                <>
                  <path d={live} stroke={DARK} strokeOpacity={0.55} strokeWidth={6.4} />
                  <path d={live} stroke={ACCENT_DEEP} strokeWidth={4.2} />
                  <path d={live} stroke={ACCENT} strokeWidth={2.6} />
                </>
              ) : null}
            </g>
          );
        })}

        {/* the trunk: the living lineage */}
        {trunkD ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={trunkD} stroke={DARK} strokeOpacity={0.6} strokeWidth={17} />
            <path d={trunkD} stroke={ACCENT_DEEP} strokeWidth={13.8} />
            <path d={trunkD} stroke={ACCENT} strokeWidth={8.6} />
            {hlOp > 0.01
              ? [
                  [130, 0.3],
                  [70, 0.45],
                  [26, 0.7],
                ].map(([len, o]) => {
                  const d = sub(TRUNK, hlS - len / 2, Math.min(tS, hlS + len / 2));
                  return d ? <path key={`h${len}`} d={d} stroke="#FFE3A6" strokeOpacity={o * hlOp} strokeWidth={8.6} /> : null;
                })
              : null}
          </g>
        ) : null}
        {/* the fork: a small dead knot where the twig left the trunk */}
        <circle cx={FORK.x + 3} cy={FORK.y - 9} r={6.2} fill={DEAD_LINE} stroke={DARK} strokeWidth={2} />
        <Medallion kind="marmot" cx={MED.x} cy={MED.y} r={MED.r} />

        {/* the crowd */}
        {SORTED.map((p) => {
          const d = INFECT_D.get(p.id);
          const tone = d === undefined ? 0 : clamp01((g - d) / (GROW_V * 4)) * (1 - clamp01((e - d + DRAIN_V) / (DRAIN_V * 6)));
          return <Person key={p.id} x={p.x} y={p.y} h={PERSON_H} seed={p.seed} tone={tone} />;
        })}

        {/* every dead tip closes with an end-bar, drawn out from the line */}
        {BRANCHES.map((b, i) => {
          const hb = 9.5 * smoothstep(clamp01((e - b.end) / (DRAIN_V * 5)));
          if (hb < 0.2) return null;
          const end = b.tip;
          const q = { x1: end.x + b.dir.y * hb, y1: end.y - b.dir.x * hb, x2: end.x - b.dir.y * hb, y2: end.y + b.dir.x * hb };
          return (
            <g key={`bar${i}`} strokeLinecap="round">
              <line {...q} stroke={DARK} strokeOpacity={0.45} strokeWidth={5.6} />
              <line {...q} stroke={DEAD_LINE} strokeWidth={3.2} />
            </g>
          );
        })}
      </WorldSvg>
    </Page>
  );
};

export default DiesOutLineage;
