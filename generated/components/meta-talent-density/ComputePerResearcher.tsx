import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  GEO,
  LightSweep,
  StoutStage,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  smoothstep,
  type Silhouette,
} from "../kits/cheeky-pint/stoutShared";
import { Label, PersonPeg } from "../kits/cheeky-pint/talentShared";

// ===========================================================================
// ComputePerResearcher — cut 4 of the Cheeky Pint S4E03 (Meta / MSL) clip "Talent density beat team
// size", in the stout system (stoutShared.tsx, palette B1) with the clip's vocabulary (talentShared.tsx).
// 1080x1920, 23.976 fps, opaque.
//
// CHECK LINE: Meta doesn't smear its compute thinly over lots of teams; it piles the same compute onto
// a few key researchers, so each one gets a huge amount.
//
// THE MOTION (two things only: a row of people, and ONE amber mass in the stout bar material): the mass
// stands as a chunky block behind the middle of the row; it goes down and spreads into a long thin
// slab under the feet of the whole row (everyone lifted by a sliver) while the camera travels along
// the row with its edge; it draws back to under the three amber people, splits cleanly into three
// sections and rises as three columns that lift those three high above everyone else (the one
// LightSweep on the top-out).
// The block and the three columns have exactly the same area; the slab is drawn thinner than that area
// would make it (15 people cannot stand on "almost nothing" and three of them on full-height columns
// of the same amber: see the note at SLAB).
//
// DURATION: slot = round(10.844 s x 23.976) = 260 frames, + a 12-frame living tail = 272.
//
// FRAMES: 0-56 the block, a steady push · 58-80 it flattens, 78-88 it comes forward under the feet ·
// 58-112 it spreads to the row's ends (the camera travels right with the edge, 64-110) · 116-150 it
// draws back to the three (the camera returns 114-156; each kraft person settles and loses the light as
// the edge leaves) · 154-170 it splits into three sections · 156-243 the three rise (slow, then the
// main climb from ~198) · 243-255 the LightSweep · tail: slow drift.
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 260;
export const DURATION = SLOT_FRAMES + 12;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world (WORLD px, the 8-px grid) --------------------------------------------------------------
const G = GEO.FLOOR; // the ground line the row stands on
const N = 15;
const MID = 7; // people 6, 7, 8 are the amber three
const PEG = 96;
const PITCH = 176;
const pegX = (i: number) => (i - MID) * PITCH;
const isKey = (i: number) => Math.abs(i - MID) <= 1;
/** The three columns: a peg's shoulders plus 16 px each side (a clear step under the feet), 48 px apart. */
const COL = { w: 128, h: 1040 } as const;
const AREA = 3 * COL.w * COL.h; // the amount: block = three columns
/** The block: 5:3, the same area. It stands BEHIND the row: its foot is higher up the board. */
const BLOCK_H = Math.sqrt((AREA * 3) / 5);
const BLOCK_A = AREA / BLOCK_H / 2; // its half width
const BEHIND = PEG + 16;
/** The slab: a sliver under every foot. (At the true area it would be ~135 px thick, taller than a
 *  person; it is drawn at 28 so that "this much for each one" is what the picture says.) */
const SLAB = { h: 28, gathered: 56 } as const;
const ROW_A = MID * PITCH + PEG / 2 + 16; // the slab's half length under the whole row
const TRIO_A = PITCH + COL.w / 2; // its half width under the three
const THIRD = (2 * TRIO_A) / 6; // half of one third of the gathered slab

// --- the clock --------------------------------------------------------------------------------------
const T = {
  flatten: [58, 80],
  forward: [78, 88],
  spread: [58, 112],
  back: [116, 150],
  gather: [132, 152],
  split: [154, 170],
  creep: [156, 200],
  climb: [196, 243],
  sweep: [243, 255],
} as const;
const span = (t: number, [a, b]: readonly [number, number]) => (t - a) / (b - a);
/** Rest to rest with a long soft landing. */
const restToRest = (v: number, p = 3) => {
  const u = clamp01(v);
  return 1 - Math.pow(1 - u, p) * (1 + p * u);
};

// --- the mass ---------------------------------------------------------------------------------------
type Mass = {
  /** half width, height, foot line (world) */
  a: number;
  h: number;
  foot: number;
  /** 0 = one body .. 1 = three columns */
  split: number;
  /** how far the three have risen, 0..1 */
  rise: number;
};
const massAt = (t: number): Mass => {
  const a =
    t < T.back[0]
      ? lerp(BLOCK_A, ROW_A, Math.pow(smoothstep(span(t, T.spread)), 1.3))
      : lerp(ROW_A, TRIO_A, smoothstep(span(t, T.back)));
  const rise = 0.14 * smoothstep(span(t, T.creep)) + 0.86 * restToRest(span(t, T.climb), 3);
  const low = t < T.back[0] ? lerp(BLOCK_H, SLAB.h, smoothstep(span(t, T.flatten))) : lerp(SLAB.h, SLAB.gathered, smoothstep(span(t, T.gather)));
  const h = lerp(low, COL.h, rise);
  const foot = lerp(G - BEHIND, G, smoothstep(span(t, T.forward)));
  return { a, h, foot, split: smoothstep(span(t, T.split)), rise };
};
/** How far person i is lifted by the mass under their feet. */
const liftAt = (i: number, m: Mass) => {
  const landed = smoothstep((m.foot - (G - SLAB.h)) / SLAB.h);
  const cover = clamp01((m.a - (Math.abs(pegX(i)) - PEG * 0.46)) / (PEG * 0.92));
  return m.h * cover * landed;
};
/** The frame the retreating edge leaves person i (kraft people lose the light from then). */
const LEAVE: number[] = Array.from({ length: N }, (_, i) => {
  if (isKey(i)) return Infinity;
  for (let f = T.back[0]; f <= T.back[1]; f++) if (massAt(f).a < Math.abs(pegX(i))) return f;
  return T.back[1];
});

// --- the camera -------------------------------------------------------------------------------------
const K = { open: 0.86, pushed: 0.96, travel: 1.3, end: 1.28 } as const;
const TRAVEL_X = 940;
const HEADS_Y = 1252; // the open: the people stand just under the caption strip, the block across the middle
const GROUND_TRAVEL = 1078; // the travel: slab and feet just above the strip
const GROUND_END = 1723; // the end: columns, people and label centred
const camAt = (f: number): Cam => {
  const g = (a: number, b: number) => smoothstep((f - a) / (b - a));
  const push = 1 - Math.pow(1 - clamp01(f / 56), 1.6); // moving on frame 0, at rest as the block lets go
  const k = Math.exp(
    Math.log(K.open) +
      Math.log(K.pushed / K.open) * push +
      Math.log(K.travel / K.pushed) * g(56, 84) +
      Math.log(K.end / K.travel) * g(150, 200) +
      Math.log(1.3 / K.end) * g(238, 320),
  );
  const x = TRAVEL_X * g(64, 110) - TRAVEL_X * g(114, 156);
  // where the ground line stands on screen: it follows the action down, then drops away under the rise
  const groundY = lerp(lerp(HEADS_Y + PEG * k, GROUND_TRAVEL, g(56, 84)), GROUND_END, massAt(f).rise);
  return { x, y: G - (groundY - 960) / k, k };
};
const REST = camAt(0);

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `cr${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

/** A bar standing on its foot: the two top corners rounded (each its own radius), the foot square. */
const barPath = (x0: number, x1: number, top: number, foot: number, rl: number, rr: number) => {
  const m = Math.min((x1 - x0) / 2, foot - top);
  const a = Math.max(0, Math.min(rl, m));
  const b = Math.max(0, Math.min(rr, m));
  return (
    `M${f2(x0)} ${f2(foot)}V${f2(top + a)}` +
    (a ? `A${f2(a)} ${f2(a)} 0 0 1 ${f2(x0 + a)} ${f2(top)}` : "") +
    `H${f2(x1 - b)}` +
    (b ? `A${f2(b)} ${f2(b)} 0 0 1 ${f2(x1)} ${f2(top + b)}` : "") +
    `V${f2(foot)}Z`
  );
};
type Bar = { x0: number; x1: number; rl: number; rr: number };
/** The mass as bars: one body, or (while and after the split) three sections with their outer edges fixed. */
const barsOf = (m: Mass): Bar[] => {
  const r = GEO.RADIUS;
  if (m.split <= 0) return [{ x0: -m.a, x1: m.a, rl: r, rr: r }];
  const inner = lerp(THIRD, PITCH - COL.w / 2, m.split); // the outer sections' inner edge
  const mid = lerp(THIRD, COL.w / 2, m.split); // the middle section's half width
  const ri = Math.min(r, (inner - mid) / 2); // the corners of a gap grow with the gap
  return [
    { x0: -TRIO_A, x1: -inner, rl: r, rr: ri },
    { x0: -mid, x1: mid, rl: ri, rr: ri },
    { x0: inner, x1: TRIO_A, rl: ri, rr: r },
  ];
};

// ===========================================================================
// THE AMBER MASS: the stout bar material — the band gradient, the fixed bloom, the hot top edge, ONE shadow
// ===========================================================================
const AmberMass: React.FC<{ m: Mass; k: number; band: [number, number] }> = ({ m, k, band }) => {
  const uid = uidOf(useId());
  const top = m.foot - m.h;
  const bars = barsOf(m);
  const paths = bars.map((b) => barPath(b.x0, b.x1, top, m.foot, b.rl, b.rr));
  const sil: Silhouette = paths.map((d) => ({ d }));
  const fall = Math.min(EDGE.HOT_FALL / k, m.h);
  const x0 = bars[0].x0;
  const x1 = bars[bars.length - 1].x1;
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}hf`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(top + fall)}>
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}ao`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(m.foot - Math.min(m.h, EDGE.FOOT_AO / k))} x2="0" y2={f2(m.foot)}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={sil} elevation="rest" contact={{ x: (x0 + x1) / 2, y: m.foot, w: (x1 - x0) * 0.86 }} />
      <g style={{ filter: bloomFilter(k) }}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill={`url(#${uid}a)`} />
        ))}
      </g>
      {bars.map((b, i) => (
        <g key={i}>
          <path d={barPath(b.x0, b.x1, top, top + fall, b.rl, b.rr)} fill={`url(#${uid}hf)`} />
          <path d={`M${f2(b.x0 + b.rl)} ${f2(top + EDGE.HOT / k / 2)}H${f2(b.x1 - b.rr)}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
          <rect x={f2(b.x0)} y={f2(m.foot - Math.min(m.h, EDGE.FOOT_AO / k))} width={f2(b.x1 - b.x0)} height={f2(Math.min(m.h, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
        </g>
      ))}
    </g>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const LABEL_PX = 60; // the one label, twice the house LABEL: it has to read at 270 px wide
const ComputePerResearcher: React.FC<Props> = () => {
  const t = useCurrentFrame();
  const uid = uidOf(useId());
  const cam = camAt(t);
  const k = cam.k;
  const band = amberBandFor(cam);
  const m = massAt(t);
  const lag = camAt(Math.max(0, t - 6));
  const sweep = span(t, T.sweep);
  const top = m.foot - m.h;
  const people = Array.from({ length: N }, (_, i) => i);
  // the label rides on the mass, and clears the heads of the three once they stand on it
  const labelY = Math.min(top, G - liftAt(MID, m) - PEG) - 24 / k;
  const bars = barsOf(m);
  return (
    <AbsoluteFill>
      <StoutStage S={t} cam={cam} rest={REST} pool={{ x: lag.x, y: lag.y - 20 }}>
        <AmberMass m={m} k={k} band={band} />
        {people.map((i) => (
          <PersonPeg
            key={i}
            x={pegX(i)}
            y={G - liftAt(i, m)}
            size={PEG}
            k={k}
            tone={isKey(i) ? "amber" : "kraft"}
            shade={isKey(i) ? 0 : 0.36 * smoothstep((t - LEAVE[i]) / 12)}
            slot="cream"
            amberBand={band}
          />
        ))}
        <Label x={0} y={labelY} k={k} text="Compute" px={LABEL_PX} tone="cream" />
        {sweep > 0 && sweep < 1 ? (
          <g>
            <defs>
              <clipPath id={`${uid}s`}>
                {bars.map((b, i) => (
                  <path key={i} d={barPath(b.x0, b.x1, top, m.foot, b.rl, b.rr)} />
                ))}
              </clipPath>
            </defs>
            <g clipPath={`url(#${uid}s)`}>
              <LightSweep x={-TRIO_A} y={top} w={2 * TRIO_A} h={m.h} k={k} t={sweep} on="amber" r={0} />
            </g>
          </g>
        ) : null}
      </StoutStage>
    </AbsoluteFill>
  );
};

export default ComputePerResearcher;
