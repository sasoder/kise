import React from "react";
import { ACCENT, clamp01, iconShadow, makeTone } from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI } from "../kits/dwarkesh/alignShared";
import { Feet, Foot, figureHeight, figurePose } from "../rsi-another-jump/timelineWorld";
import { HUMAN_FAR } from "../rsi-another-jump/jumpWorld";

// ---------------------------------------------------------------------------
// gapShared — cut 37's (`StepsOverTheGap`) additions to the series timeline
// world (rsi-another-jump/timelineWorld.tsx + jumpWorld.tsx, imported
// read-only, never edited).
//
// - `makeStepWalk`: a walk from an explicit list of footfalls, so one step can
//   be longer than the others (the stride over the gap). Like timelineWorld's
//   `makeWalk`, the feet are tied to the hip's POSITION, not to a timer: a foot
//   lands when the hip reaches `x - land` and lifts when it reaches `x + lift`,
//   so a planted foot never slips, whatever the hip's speed.
// - `ResearcherFigure`: jumpWorld's `HumanFigure` (the intern's own build at
//   age 1, standing, arms at its sides) with a `tone` 0..1 that takes it from
//   white (a person) to ACCENT (the AI has taken over its work), the far limbs
//   one flat shade under the near ones at every tone.
// ---------------------------------------------------------------------------

type P = { x: number; y: number };
const line = (pts: P[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;
const poly = (pts: P[]) => `${line(pts)} Z`;

// --- the walk ------------------------------------------------------------------
/** One footfall: the foot stands at `x` while the hip is in [x - land, x + lift).
 *  `liftK` scales the swing INTO this footfall's lift (1 = the normal step). */
export type Plant = { x: number; land: number; lift: number; liftK?: number };

/**
 * Feet from two lists of footfalls (near and far), each in order along x. Between
 * a lift and the next landing the foot swings (cosine ease along x, a sine lift
 * scaled by the gait weight `gaitW`), with its progress measured in HIP x, so it
 * stays in step at any speed and stops dead when the hip does.
 */
export const makeStepWalk = ({
  near,
  far,
  liftH,
}: {
  near: Plant[];
  far: Plant[];
  /** foot lift at mid-swing, world px, at full walking speed */
  liftH: number;
}) => {
  const footAt = (plants: Plant[], h: number, w: number): Foot => {
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      const landAt = p.x - p.land;
      const liftAt = p.x + p.lift;
      if (h < landAt) {
        if (i === 0) return { x: p.x, lift: 0 };
        const q = plants[i - 1];
        const from = q.x + q.lift;
        const s = clamp01((h - from) / (landAt - from));
        const e = 0.5 - 0.5 * Math.cos(Math.PI * s);
        return { x: q.x + (p.x - q.x) * e, lift: Math.sin(Math.PI * s) * liftH * (p.liftK ?? 1) * w };
      }
      if (h < liftAt) return { x: p.x, lift: 0 };
    }
    return { x: plants[plants.length - 1].x, lift: 0 };
  };
  return (h: number, w: number): Feet => ({ near: footAt(near, h, w), far: footAt(far, h, w) });
};

// --- the researchers --------------------------------------------------------------
/** white (a person) -> ACCENT (taken over by the AI); the far limbs one flat shade down */
export const RESEARCHER_TONE = makeTone(INK, ACCENT);
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
const FAR_RATIO = parseInt(HUMAN_FAR.slice(1, 3), 16) / 255; // the human's far shade (0.84)
export const RESEARCHER_TONE_FAR = makeTone(HUMAN_FAR, shade(ACCENT, FAR_RATIO));

/**
 * A standing adult researcher on the rule: jumpWorld's HumanFigure geometry
 * (figurePose at age 1, standing, both arms hanging), filled by `tone`. SVG,
 * world px. `facing` -1 turns it to face left.
 */
export const ResearcherFigure: React.FC<{
  k: number;
  x: number;
  breathT: number;
  tone: number;
  facing?: 1 | -1;
  opacity?: number;
}> = ({ k, x, breathT, tone, facing = 1, opacity = INK_HI }) => {
  const g = figurePose({ x, age: 1, breathT, identity: { badge: 0, tie: 0, child: 0, bun: 1, drink: 1 } });
  const { p } = g;
  const nearC = RESEARCHER_TONE(clamp01(tone));
  const farC = RESEARCHER_TONE_FAR(clamp01(tone));
  const [fs, fe, fh] = g.farArm;
  const sh = g.nearArm[0];
  const dx = sh.x - fs.x + p.torsoW * 0.05;
  const nearArm = [sh, { x: fe.x + dx, y: fe.y }, { x: fh.x + dx - p.torsoW * 0.04, y: fh.y }];
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const limb = (pts: P[], w: number, c: string) => (
    <path d={line(pts)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <g transform={facing === -1 ? `translate(${(2 * x).toFixed(3)} 0) scale(-1 1)` : undefined}>
        {limb(g.farArm, p.armT, farC)}
        {limb(legPts("far"), p.legT, farC)}
        <ellipse cx={g.footFar.cx} cy={g.footFar.cy} rx={g.footFar.rx} ry={g.footFar.ry} fill={farC} />
        {limb(g.neck, p.neckW, nearC)}
        <path d={poly(g.torso)} fill={nearC} />
        <circle cx={g.head.x} cy={g.top + p.headD / 2} r={p.headD / 2} fill={nearC} />
        {limb(legPts("near"), p.legT, nearC)}
        <ellipse cx={g.footNear.cx} cy={g.footNear.cy} rx={g.footNear.rx} ry={g.footNear.ry} fill={nearC} />
        {limb(nearArm, p.armT, nearC)}
      </g>
    </g>
  );
};

/** The researcher's head centre and radius (world px), for a thread to land on. */
export const researcherHead = (x: number, breathT: number, facing: 1 | -1 = 1) => {
  const g = figurePose({ x, age: 1, breathT, identity: { badge: 0, tie: 0, child: 0, bun: 1, drink: 1 } });
  const hx = g.head.x;
  return { x: facing === -1 ? 2 * x - hx : hx, y: g.top + g.p.headD / 2, r: g.p.headD / 2 };
};

/** the adult's height (for framing) */
export const H_ADULT = figureHeight(1);
