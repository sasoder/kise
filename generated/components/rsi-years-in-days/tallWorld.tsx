import React from "react";
import { ACCENT, iconShadow, squirclePath } from "../kits/dwarkesh/fieldShared";
import { INK } from "../kits/dwarkesh/alignShared";
import {
  EYE_TONE,
  FACE_UNITS,
  FIGURE_TONE,
  FIGURE_TONE_FAR,
  FIGURE_TONE_TIE,
  GROUND_Y,
  HEAD_MARK,
  Feet,
  eyePath,
  figurePose,
} from "../rsi-another-jump/timelineWorld";
import { HEAD_OUTER, OUTLINE_DASH, OUTLINE_GAP, OUTLINE_SPACE, OUTLINE_SW } from "../rsi-another-jump/jumpWorld";

// ---------------------------------------------------------------------------
// tallWorld — ThisTallToRunIt's additions to the series timeline world
// (rsi-another-jump/timelineWorld.tsx + jumpWorld.tsx, imported read-only).
//
// The series figure (`AiFigure`) draws its feet as level ellipses and has no
// tiptoe. This cut needs the intern to rise on its toes with the toes planted,
// so the pose gets a `rise`: the heels lift, each foot pivots about its toe tip,
// the ankles (and so the whole body, through figurePose's leg IK) go up by
// `rise`, and the body shifts forward over the toes by the ankles' own shift.
// `TallFigure` and `TallOutline` are AiFigure's solid drawing and jumpWorld's
// ForecastOutline, copied with one change each: the feet are rotated ellipses
// (`rot`, degrees), and the eyes can glance up (`look`, mark units).
// ---------------------------------------------------------------------------

type P = { x: number; y: number };
const line = (pts: P[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;
const poly = (pts: P[]) => `${line(pts)} Z`;

export type RotFoot = { cx: number; cy: number; rx: number; ry: number; rot: number };

/**
 * figurePose plus a tiptoe. `feet` are the standing feet (from the walk); with
 * `rise` > 0 the toe tips stay where the standing feet put them and the rest
 * of the figure goes up by `rise` world px.
 */
export const tallPose = ({
  x,
  age,
  feet,
  gait = 0,
  breathT = 0,
  rise = 0,
  stretch = 0,
}: {
  x: number;
  age: number;
  feet?: Feet;
  gait?: number;
  breathT?: number;
  rise?: number;
  /** extra height from straining up, world px: the drawing is scaled vertically about the ground line */
  stretch?: number;
}) => {
  const base = tallPoseFeet({ x, age, feet, gait, breathT, rise });
  const sy = 1 + stretch / Math.max(1, GROUND_Y - base.top);
  return { ...base, sy, topVisual: GROUND_Y - (GROUND_Y - base.top) * sy };
};
/** the vertical strain as an SVG transform about the ground line */
export const strainT = (sy: number) =>
  Math.abs(sy - 1) < 1e-6 ? undefined : `translate(0 ${GROUND_Y}) scale(1 ${sy.toFixed(6)}) translate(0 ${-GROUND_Y})`;

const tallPoseFeet = ({
  x,
  age,
  feet,
  gait = 0,
  breathT = 0,
  rise = 0,
}: {
  x: number;
  age: number;
  feet?: Feet;
  gait?: number;
  breathT?: number;
  rise?: number;
}) => {
  if (rise <= 1e-3) {
    const g = figurePose({ x, age, feet, gait, breathT });
    return {
      ...g,
      footNear: { ...g.footNear, rot: 0 } as RotFoot,
      footFar: { ...g.footFar, rot: 0 } as RotFoot,
      rise: 0,
    };
  }
  // the standing pose (gait 0) fixes the toe tips
  const g0 = figurePose({ x, age, feet, gait: 0, breathT });
  const { p } = g0;
  const L = 0.72 * p.footL; // ankle -> toe tip, along the foot
  const s = Math.min(0.97, rise / L); // the foot can stand at most near-vertical
  const th = Math.asin(s);
  const c = Math.cos(th);
  const tipN = { x: g0.footNear.cx + g0.footNear.rx, y: g0.footNear.cy };
  const tipF = { x: g0.footFar.cx + g0.footFar.rx, y: g0.footFar.cy };
  const ankN = tipN.x - L * c;
  const ankF = tipF.x - L * c;
  const split = p.footL * 0.42; // figurePose takes this off the far foot at gait 0
  const shift = L * (1 - c); // the body moves forward with the ankles
  const g = figurePose({
    x: x + shift,
    groundY: GROUND_Y - rise,
    age,
    feet: { near: { x: ankN, lift: 0 }, far: { x: ankF + split, lift: 0 } },
    gait: 0,
    breathT,
  });
  const footAt = (tip: P): RotFoot => {
    const ax = tip.x - L * c;
    const ay = tip.y - L * s;
    return {
      cx: ax + 0.22 * p.footL * c,
      cy: ay + 0.22 * p.footL * s,
      rx: p.footL / 2,
      ry: p.footH / 2,
      rot: (th * 180) / Math.PI,
    };
  };
  return { ...g, footNear: footAt(tipN), footFar: footAt(tipF), rise };
};
export type TallPose = ReturnType<typeof tallPose>;

const Foot: React.FC<{ f: RotFoot; fill?: string; stroke?: string; strokeWidth?: number }> = ({
  f,
  fill,
  stroke,
  strokeWidth,
}) => (
  <ellipse
    cx={f.cx}
    cy={f.cy}
    rx={f.rx}
    ry={f.ry}
    transform={f.rot ? `rotate(${f.rot.toFixed(4)} ${f.cx.toFixed(3)} ${f.cy.toFixed(3)})` : undefined}
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
  />
);

/** AiFigure's solid drawing (age >= 1: no backpack, no straw), on a TallPose. `look` lifts both eyes (mark units). */
export const TallFigure: React.FC<{ k: number; pose: TallPose; toneT: number; look?: number }> = ({
  k,
  pose: g,
  toneT,
  look = 0,
}) => {
  const near = FIGURE_TONE(toneT);
  const far = FIGURE_TONE_FAR(toneT);
  const tieC = FIGURE_TONE_TIE(toneT);
  const { p } = g;
  const limb = (pts: P[], w: number, color: string) => (
    <path d={line(pts)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const ms = g.mark.size / 24;
  const ly = look * ms;
  const rectAt = (r: { x: number; y: number; w: number; h: number }, fill: string) => (
    <path d={squirclePath(r.w, r.h)} transform={`translate(${r.x.toFixed(2)} ${r.y.toFixed(2)})`} fill={fill} />
  );
  return (
    <g style={{ filter: iconShadow(k) }}>
      <g transform={strainT(g.sy)}>
      {limb(g.farArm, p.armT, far)}
      {limb(legPts("far"), p.legT, far)}
      <Foot f={g.footFar} fill={far} />
      {limb(g.neck, p.neckW, near)}
      <path d={poly(g.torso)} fill={near} />
      <g transform={`translate(${g.mark.x.toFixed(3)} ${g.mark.y.toFixed(3)}) scale(${ms.toFixed(5)})`}>
        <circle cx={FACE_UNITS.x} cy={FACE_UNITS.y} r={FACE_UNITS.r} fill={near} />
        {HEAD_MARK.paths.map((d, i) => (
          <path key={i} d={d} fill={near} fillRule="evenodd" />
        ))}
      </g>
      <path d={eyePath(g.eyes.back.x, g.eyes.back.y - ly, g.eyes.r, 0)} fill={EYE_TONE} />
      <path d={eyePath(g.eyes.front.x, g.eyes.front.y - ly, g.eyes.r, 0)} fill={EYE_TONE} />
      {limb(legPts("near"), p.legT, near)}
      <Foot f={g.footNear} fill={near} />
      {g.id.tie > 0.004 ? (
        <g opacity={g.id.tie}>
          <path d={poly(g.collar)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={p.H * 0.004} />
          <path d={poly(g.tie)} fill={tieC} />
        </g>
      ) : null}
      {limb(g.nearArm, p.armT, near)}
      {g.id.badge > 0.004 ? (
        <g opacity={g.id.badge}>
          {g.lanyards.map((l, i) => (
            <path key={i} d={line(l)} fill="none" stroke={INK} strokeWidth={p.H * 0.009} strokeLinecap="round" />
          ))}
          {rectAt(g.badge, INK)}
          {rectAt(g.badgeSlot, far)}
          {rectAt(g.badgePhoto, far)}
        </g>
      ) : null}
      <path d={poly(g.drinkBody)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={p.H * 0.004} />
      {g.lidH > 0.05 ? (
        <path d={poly(g.lid)} fill={INK} stroke={INK} strokeWidth={p.H * 0.004} strokeLinejoin="round" />
      ) : null}
      </g>
    </g>
  );
};

const silhouetteParts = (g: TallPose) => {
  const { p } = g;
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const limbs: { pts: P[]; w: number }[] = [
    { pts: g.farArm, w: p.armT },
    { pts: legPts("far"), w: p.legT },
    { pts: g.neck, w: p.neckW },
    { pts: legPts("near"), w: p.legT },
    { pts: g.nearArm, w: p.armT },
  ];
  const feet = [g.footFar, g.footNear];
  const polys = [g.torso, g.drinkBody, ...(g.lidH > 0.05 ? [g.lid] : [])];
  const ms = g.mark.size / 24;
  const markT = `translate(${g.mark.x.toFixed(3)} ${g.mark.y.toFixed(3)}) scale(${ms.toFixed(5)})`;
  return { limbs, feet, polys, ms, markT };
};

/** jumpWorld's SilhouetteCut on a TallPose (rotated feet). */
export const TallCut: React.FC<{ pose: TallPose; grow: number }> = ({ pose: g, grow }) => {
  const { limbs, feet, polys, ms, markT } = silhouetteParts(g);
  return (
    <g fill="black" stroke="black" strokeLinejoin="round" strokeLinecap="round">
      {polys.map((q, i) => (
        <path key={`p${i}`} d={poly(q)} strokeWidth={2 * grow} />
      ))}
      <g transform={markT} strokeWidth={(2 * grow) / ms}>
        <path d={HEAD_OUTER} />
      </g>
      {limbs.map((l, i) => (
        <path key={`l${i}`} d={line(l.pts)} fill="none" strokeWidth={l.w + 2 * grow} />
      ))}
      {feet.map((f, i) => (
        <Foot key={`f${i}`} f={f} strokeWidth={2 * grow} />
      ))}
    </g>
  );
};

/** jumpWorld's ForecastOutline (the marching dashed contour) on a TallPose. */
export const TallOutline: React.FC<{
  id: string;
  k: number;
  pose: TallPose;
  march: number;
  clipX0?: number;
  gap?: number;
  sw?: number;
}> = ({ id, k, pose: g, march, clipX0 = -1e5, gap = OUTLINE_GAP, sw = OUTLINE_SW }) => {
  const { limbs, feet, polys, ms, markT } = silhouetteParts(g);
  const band = 2 * (gap + sw);
  return (
    <g style={{ filter: iconShadow(k) }}>
      <g transform={strainT(g.sy)}>
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-1e5} y={-1e5} width={2e5} height={2e5}>
          <rect x={-1e5} y={-1e5} width={2e5} height={2e5} fill="white" />
          <TallCut pose={g} grow={gap} />
        </mask>
        <clipPath id={`${id}-c`}>
          <rect x={clipX0} y={-1e5} width={2e5} height={2e5} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <g
          mask={`url(#${id}-m)`}
          fill="none"
          stroke={ACCENT}
          strokeDasharray={`${OUTLINE_DASH} ${OUTLINE_SPACE}`}
          strokeDashoffset={-march}
          strokeLinejoin="round"
          strokeLinecap="butt"
        >
          {polys.map((q, i) => (
            <path key={`p${i}`} d={poly(q)} strokeWidth={band} />
          ))}
          <g
            transform={markT}
            strokeWidth={band / ms}
            strokeDasharray={`${OUTLINE_DASH / ms} ${OUTLINE_SPACE / ms}`}
            strokeDashoffset={-march / ms}
          >
            <path d={HEAD_OUTER} />
          </g>
          {limbs.map((l, i) => (
            <path key={`l${i}`} d={line(l.pts)} strokeWidth={l.w + band} />
          ))}
          {feet.map((f, i) => (
            <Foot key={`f${i}`} f={f} strokeWidth={band} />
          ))}
        </g>
      </g>
      </g>
    </g>
  );
};
