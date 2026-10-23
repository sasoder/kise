// ---------------------------------------------------------------------------
// covidAura — THE LIGHT THE VIRUS THROWS of the Kyle Harper clip "Why COVID was impossible to contain" (kyle-covid):
// one look for every orange thing (user revision 2, Oct 23: "the aura around him needs to be slightly more
// pronounced ... a nice balance, but you should still understand that that man is sick and now he's making others
// sick"; cut 48 "can we give the orange things the same kind of glow?"). The virus throws a soft warm LIGHT round
// itself: a screen-blended radial falloff with no edge, lifted from cut 39's ChestHalo / canvas halo
// (PushTheLimitsOnLatency.tsx: stops 0: a, 0.45: 0.45 a, 1: 0; colours #FFBE3C -> #FFAA14 -> #FFA000), made bigger
// and stronger. Contract: <notes>/AURA_READY.md. Later fixes add, never rename.
//
// TARGETS (AURA):
//   a person at full infection   centred on the chest anchor, radius 0.40 x the figure's standing height (it wraps the
//                                head, shoulders and torso to the hips), centre alpha 0.65, scaled by `infected`
//                                (alpha x infected, radius x (0.85 + 0.15 infected));
//   an orange virion / microbe   radius 2.4 x its body radius, centre alpha 0.7;
//   a cell filling with virions  a warm light from inside: radius 1.15 x the cell radius, alpha 0.35 x fill.
// Never a solid blob, never a flat disc (the falloff has no edge and no plateau), never a flicker (pure functions of
// the inputs: drive them with smooth values).
//
// API
//   type Aura = { c: P2; r: number; a: number }   centre and radius in the drawing's units (world px inside WorldSvg,
//                                                 or screen px on a canvas), a = centre alpha (0..1)
//   <AuraGlow aura={Aura | Aura[]} uid fog? fadeBelow? />   SVG: one screen-blended group of radial gradients (one per
//                                                 aura; draw it AFTER the thing it lights, so it spills onto the thing
//                                                 and the air round it). fog = a FolkFog (A.folkFog(Z)): the colour
//                                                 sinks halfway into the air and the alpha drops by half the fog.
//                                                 fadeBelow = [y0, y1] world-px rows: the light fades out from y0 to y1
//                                                 (keep it out of the caption bands)
//   drawAura(ctx, c, r, a, fog?)                  canvas (screen px): the same light, ctx.globalCompositeOperation
//                                                 "screen", restored after; fog = { rgb, amount } as FolkFog
//   auraFor(kind, pose, at, scale, infected, o?)  -> Aura for a covidFolk figure (world px: `at` / `scale` as for the
//                                                 figure); o: { variant?, grip?, heightPx?, rK?, aK? } (heightPx
//                                                 overrides the standing height, rK / aK multiply radius / alpha)
//   virionAura(c, bodyR, a = 1, o?)               -> Aura for an orange virion / microbe of body radius bodyR
//                                                 (a = how lit it is 0..1; o: { rK?, aK? })
//   cellAura(c, cellR, fill, o?)                  -> Aura for a cell filling with virions (fill 0..1)
//   standingHeight(kind, variant = 0)             rig units from the feet to the top of the head, standing (memoised)
//   AURA                                          the look values below; AURA_STOPS, AURA_COLORS
// ---------------------------------------------------------------------------
import React from "react";
import { mixHex, rgbHex } from "../kits/dwarkesh-3d/dwarkesh3d";
import { POSES, covidAnchors, type CovidKind, type CovidPose, type P2 } from "./covidFolk";

type FogLike = { rgb: [number, number, number] | string; amount: number };

/** the look values (settled on cut 3, see AURA_READY.md) */
export const AURA = {
  /** a person: radius as a share of the standing height, centre alpha at full infection */
  personR: 0.4,
  personA: 0.65,
  /** how the radius grows with infection: r x (personR0 + (1 - personR0) x infected) */
  personR0: 0.85,
  /** a virion / microbe: radius as a multiple of its body radius, centre alpha */
  virionR: 2.4,
  virionA: 0.7,
  /** a cell lit from inside by its virions: radius x cell radius, alpha at full */
  cellR: 1.15,
  cellA: 0.35,
};
/** the falloff (cut 39's): [offset, share of the centre alpha] */
export const AURA_STOPS: [number, number][] = [
  [0, 1],
  [0.45, 0.45],
  [1, 0],
];
/** the colours along the falloff (cut 39's) */
export const AURA_COLORS = ["#FFBE3C", "#FFAA14", "#FFA000"];

export type Aura = { c: P2; r: number; a: number };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const n3 = (v: number) => Math.round(v * 1000) / 1000;
const fogHexOf = (f: FogLike) => (typeof f.rgb === "string" ? f.rgb : rgbHex(f.rgb));
const fogged = (fog: FogLike | null | undefined) => {
  const f = fog ? c01(fog.amount) : 0;
  return {
    col: (hex: string) => (f > 0 ? mixHex(hex, fogHexOf(fog as FogLike), 0.5 * f) : hex),
    aK: 1 - 0.5 * f,
  };
};
const hexRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/** SVG: the light (screen blend), one radial gradient per aura. Draw after the thing it lights. */
export const AuraGlow: React.FC<{ aura: Aura | Aura[]; uid: string; fog?: FogLike | null; fadeBelow?: [number, number] }> = ({ aura, uid, fog, fadeBelow }) => {
  const list = (Array.isArray(aura) ? aura : [aura]).filter((q) => q.a > 0.002 && q.r > 0.01);
  if (!list.length) return null;
  const F = fogged(fog);
  const cols = AURA_COLORS.map(F.col);
  // an optional soft fade toward the bottom (keep the light out of the caption bands): rows fadeBelow[0] -> [1]
  const bx0 = Math.min(...list.map((q) => q.c[0] - q.r));
  const bx1 = Math.max(...list.map((q) => q.c[0] + q.r));
  const by0 = Math.min(...list.map((q) => q.c[1] - q.r));
  const by1 = Math.max(...list.map((q) => q.c[1] + q.r));
  return (
    <g style={{ mixBlendMode: "screen" }} mask={fadeBelow ? `url(#${uid}fm)` : undefined}>
      <defs>
        {fadeBelow ? (
          <>
            <linearGradient id={`${uid}fg`} gradientUnits="userSpaceOnUse" x1={0} y1={n3(fadeBelow[0])} x2={0} y2={n3(fadeBelow[1])}>
              <stop offset="0" stopColor="#fff" stopOpacity={1} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <mask id={`${uid}fm`} maskUnits="userSpaceOnUse" x={n3(bx0)} y={n3(by0)} width={n3(bx1 - bx0)} height={n3(by1 - by0)}>
              <rect x={n3(bx0)} y={n3(by0)} width={n3(bx1 - bx0)} height={n3(by1 - by0)} fill={`url(#${uid}fg)`} />
            </mask>
          </>
        ) : null}
        {list.map((q, i) => (
          <radialGradient key={i} id={`${uid}a${i}`}>
            {AURA_STOPS.map(([o, k], s) => (
              <stop key={s} offset={o} stopColor={cols[s]} stopOpacity={n3(c01(q.a * F.aK) * k)} />
            ))}
          </radialGradient>
        ))}
      </defs>
      {list.map((q, i) => (
        <circle key={i} cx={n3(q.c[0])} cy={n3(q.c[1])} r={n3(q.r)} fill={`url(#${uid}a${i})`} />
      ))}
    </g>
  );
};

/** canvas (screen px): the same light, screen-blended; the context's composite mode is restored */
export const drawAura = (ctx: CanvasRenderingContext2D, c: P2, r: number, a: number, fog?: FogLike | null) => {
  if (a <= 0.002 || r <= 0.5) return;
  const F = fogged(fog);
  const al = c01(a * F.aK);
  const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
  AURA_STOPS.forEach(([o, k], s) => {
    const [R, G, B] = hexRgb(F.col(AURA_COLORS[s]));
    g.addColorStop(o, `rgba(${R},${G},${B},${(al * k).toFixed(4)})`);
  });
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = g;
  ctx.fillRect(c[0] - r, c[1] - r, 2 * r, 2 * r);
  ctx.restore();
};

const HEIGHT_MEMO = new Map<string, number>();
/** rig units from the feet to the top of the head, standing (memoised per kind and variant) */
export const standingHeight = (kind: CovidKind, variant = 0) => {
  const k = `${kind}:${variant}`;
  let h = HEIGHT_MEMO.get(k);
  if (h === undefined) {
    const a = covidAnchors(kind, POSES.stand(1), [0, 0], 1, { variant });
    h = -a.headTop[1];
    HEIGHT_MEMO.set(k, h);
  }
  return h;
};

/** the aura of a covidFolk figure (world px, as the figure's at / scale): on the chest, 0.40 x its standing height */
export const auraFor = (
  kind: CovidKind,
  pose: CovidPose,
  at: P2,
  scale: number,
  infected: number,
  o: { variant?: number; grip?: { L?: P2; R?: P2 }; heightPx?: number; rK?: number; aK?: number } = {},
): Aura => {
  const inf = c01(infected);
  const chest = covidAnchors(kind, pose, at, scale, { variant: o.variant ?? 0, grip: o.grip }).chest;
  const H = o.heightPx ?? standingHeight(kind, o.variant ?? 0) * scale;
  return { c: chest, r: AURA.personR * H * (AURA.personR0 + (1 - AURA.personR0) * inf) * (o.rK ?? 1), a: AURA.personA * inf * (o.aK ?? 1) };
};

/** the aura of an orange virion / microbe of body radius bodyR (a: how lit it is, 0..1) */
export const virionAura = (c: P2, bodyR: number, a = 1, o: { rK?: number; aK?: number } = {}): Aura => ({ c, r: AURA.virionR * bodyR * (o.rK ?? 1), a: AURA.virionA * c01(a) * (o.aK ?? 1) });

/** a cell filling with virions: a warm light from inside (fill 0..1) */
export const cellAura = (c: P2, cellR: number, fill: number, o: { rK?: number; aK?: number } = {}): Aura => ({ c, r: AURA.cellR * cellR * (o.rK ?? 1), a: AURA.cellA * c01(fill) * (o.aK ?? 1) });
