// ---------------------------------------------------------------------------
// TwelvePosts (caro-firing-moses, cut 17.75). NEW graphic in the show's own hydra look (parts in firingShared.tsx),
// continuing HydraDozenHeads. Opaque 1080x1920, 24 fps, 159 frames.
//
// CHECK LINE: "Each head is a separate government post he held at the same time — three of them named."
//
// THE LINE: "...at the same time. City construction coordinator, chairman of the state council of parks, chairman
// of the state power authority, and so on."
// WORD -> FRAME: at 4 · the 14 · same 17 · time 22 · City 30 · construction 32 · coordinator 39 · chairman 60 ·
// of 70 · the 75 · state 76 · council 80 · of 86 · parks 90 · chairman 101 · of 108 · the 113 · state 114 ·
// power 118 · authority 126 · and 139 · so 150 · on 152.
// DURATION: the slot 17.750 -> 24.375 s = 6.625 s x 24 = 159 frames (f0..f158).
//
// THE MOTION: one head at a time becomes a post. The hydra stays where HydraDozenHeads left it (same global clock,
// G = 62 + f). On "same time" all twelve heads dip together (f15-29). On "City" a head on the LEFT lights (its eye
// flares, the head dips and comes back, f28-38) and its title types on letter by letter in the white italic serif
// above the left of the fan ("City Construction / Coordinator", f30-36) with a thin white leader drawn from the
// label down to the head (f33-41). When the next title arrives the label flies down its leader into the head,
// shrinking (f56-66); it ends hidden under the head and the head's small blank tag swings out from behind it
// (f62). The same for "Chairman, State / Council of Parks" on a RIGHT head (lit f58, types f62-72, flies f94-104,
// tag f100) and "Chairman, State / Power Authority" on another right head (lit f99, types f103-113, flies
// f136-147). On "and so on" (f139-152) the remaining heads' tags swing out in a quick left-to-right ripple (1.2 f
// apart), so the cut ends on the hydra with twelve tagged heads and a clean upper frame; living hold to f158.
// Left = the city post, right = the state posts: in HydraHands the Mayor holds the left heads, the Governor the right.
//
// TEXT (rev 1): Tinos Italic 400 at 78.8 px (cap 52), two lines, baselines y 300 / 394, the left label from x 100,
// the right labels ending at x 920, in the open space above the fan (the top heads' tips are below y ~490). The first
// title types in 6 f (f30-36) so it reads whole f36-56.
// JOINS: f0 = HydraDozenHeads f62 (HydraOpening at G 62, nothing else drawn); f158 = HydraHands f0 (HydraHands
// draws the same tpHeads(G) state, every tag settled).
// SOURCES: the three titles are Caro's (The Power Broker), as spoken; no figures.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FIRING_GLOW,
  FiringGlowDefs,
  FiringGround,
  HeadState,
  Hydra,
  NECK_COUNT,
  SERIF_CAP,
  STRING_W,
  SerifLabel,
  TP_DURATION,
  TP_G0,
  HEAD_LEN,
  growAt,
  neckPose,
} from "./firingShared";

export const FPS = 24;
export const DURATION = TP_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (f: number, a: number, b: number, ease: (t: number) => number = (t) => t) =>
  ease(clamp01((f - a) / (b - a)));
const inOut = Easing.inOut(Easing.cubic);
const out3 = Easing.out(Easing.cubic);
// a 0 -> 1 -> 0 bump over [a, b]
const bump = (f: number, a: number, b: number) => (f <= a || f >= b ? 0 : Math.sin(Math.PI * ((f - a) / (b - a))));

// ---- the three named posts (local frames) -----------------------------------------------------------------------
export const LABEL_SIZE = 52 / SERIF_CAP; // cap 52 px
const BASE1 = 300;
const BASE2 = 394;
type Post = {
  head: number;
  lines: [string, string];
  anchor: "start" | "end";
  x: number;
  litAt: number;
  typeAt: number;
  typeEnd: number;
  leaderAt: number;
  flyAt: number;
  flyEnd: number;
  leaderFrom: [number, number]; // where the leader leaves the label (also the label's fly pivot)
};
export const POSTS: Post[] = [
  {
    head: 2,
    lines: ["City Construction", "Coordinator"],
    anchor: "start",
    x: 100,
    litAt: 28,
    typeAt: 30,
    typeEnd: 36,
    leaderAt: 33,
    flyAt: 56,
    flyEnd: 66,
    leaderFrom: [190, 412],
  },
  {
    head: 7,
    lines: ["Chairman, State", "Council of Parks"],
    anchor: "end",
    x: 920,
    litAt: 58,
    typeAt: 62,
    typeEnd: 72,
    leaderAt: 67,
    flyAt: 94,
    flyEnd: 104,
    leaderFrom: [716, 412],
  },
  {
    head: 9,
    lines: ["Chairman, State", "Power Authority"],
    anchor: "end",
    x: 920,
    litAt: 99,
    typeAt: 103,
    typeEnd: 113,
    leaderAt: 108,
    flyAt: 136,
    flyEnd: 147,
    leaderFrom: [880, 412],
  },
];

// ---- tags: the named heads' tags swing out as their label arrives; the rest ripple on "and so on" -----------------
const RIPPLE_F = 139;
const RIPPLE_STEP = 1.2;
const rippleOrder = [0, 1, 3, 4, 5, 6, 8, 9, 10, 11];
/** local frame (TwelvePosts) at which head i's tag begins to swing out */
export const TAG_START: number[] = Array.from({ length: NECK_COUNT }, (_, i) => {
  const p = POSTS.find((q) => q.head === i);
  if (p && p.head !== 9) return p.flyEnd - 4;
  return RIPPLE_F + rippleOrder.indexOf(i) * RIPPLE_STEP;
});

/** The hydra's head states at global frame G for TwelvePosts and everything after it (HydraHands). */
export const tpHeads = (G: number): HeadState[] => {
  const f = G - TP_G0;
  return Array.from({ length: NECK_COUNT }, (_, i) => {
    const out = i < 6 ? -1 : 1; // a dip turns the head outward/down
    let nod = out * 5 * bump(f, 15, 29); // "same time": all twelve together
    let lit = 0;
    const p = POSTS.find((q) => q.head === i);
    if (p) {
      lit = prog(f, p.litAt, p.litAt + 5, out3) * (1 - prog(f, p.flyEnd - 4, p.flyEnd + 2, inOut));
      nod += out * 11 * bump(f, p.litAt, p.litAt + 11) + out * 6 * bump(f, p.flyEnd - 3, p.flyEnd + 7);
    }
    const t = f - TAG_START[i];
    return { grow: growAt(i, G), lit, nod, tag: t >= 0 ? t : undefined };
  });
};

// ---- a label, its leader, and its flight into the head ----------------------------------------------------------
const PostLabel: React.FC<{ p: Post; f: number; G: number; heads: HeadState[] }> = ({ p, f, G, heads }) => {
  if (f < p.typeAt || f >= p.flyEnd) return null;
  const total = p.lines[0].length + p.lines[1].length;
  const typed = prog(f, p.typeAt, p.typeEnd) * total;
  const pose = neckPose(p.head, G, heads[p.head].grow, heads[p.head].nod ?? 0);
  // where the leader lands: 72 % of the way from the head's join to its tip
  const a = (pose.ang * Math.PI) / 180;
  const tip: [number, number] = [pose.head[0] + Math.sin(a) * 0.72 * HEAD_LEN, pose.head[1] - Math.cos(a) * 0.72 * HEAD_LEN];
  // flight: the label's pivot (leaderFrom) travels to the head join, scale 1 -> 0.03 (log), eased
  const e = prog(f, p.flyAt, p.flyEnd, Easing.inOut(Easing.quad));
  const s = Math.exp(Math.log(0.03) * e);
  const [hx, hy] = p.leaderFrom;
  const px = hx + (pose.head[0] - hx) * e;
  const py = hy + (pose.head[1] - hy) * e;
  // the leader: drawn by a moving tip from the label to the head, then shortened from the label's end as it flies
  const lg = prog(f, p.leaderAt, p.leaderAt + 8, out3);
  const lx2 = px + (tip[0] - px) * lg;
  const ly2 = py + (tip[1] - py) * lg;
  const showLeader = lg > 0 && e < 0.9;
  return (
    <g>
      {showLeader && (
        <line
          x1={px}
          y1={py}
          x2={lx2}
          y2={ly2}
          stroke="rgb(242,242,242)"
          strokeWidth={STRING_W * 0.8}
          strokeLinecap="round"
        />
      )}
      <g transform={`translate(${px} ${py}) scale(${s}) translate(${-hx} ${-hy})`}>
        <SerifLabel text={p.lines[0]} x={p.x} y={BASE1} size={LABEL_SIZE} anchor={p.anchor} shown={typed} />
        <SerifLabel
          text={p.lines[1]}
          x={p.x}
          y={BASE2}
          size={LABEL_SIZE}
          anchor={p.anchor}
          shown={typed - p.lines[0].length}
        />
      </g>
    </g>
  );
};

/** The whole picture at global frame G (TwelvePosts and HydraHands share it). */
export const TwelvePostsWorld: React.FC<{
  G: number;
  heads?: HeadState[];
  children?: React.ReactNode;
  overHeads?: React.ReactNode;
}> = ({ G, heads: headsIn, children, overHeads }) => {
  const f = G - TP_G0;
  const heads = headsIn ?? tpHeads(G);
  const labels = POSTS.map((p) => <PostLabel key={p.head} p={p} f={f} G={G} heads={heads} />);
  return (
    <AbsoluteFill>
      <FiringGround G={G} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <FiringGlowDefs />
        <g filter={`url(#${FIRING_GLOW})`}>
          <Hydra G={G} heads={heads} underTags={<g>{labels}</g>} overHeads={overHeads} />
          {children}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const TwelvePosts: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return <TwelvePostsWorld G={TP_G0 + frame} />;
};

export default TwelvePosts;
