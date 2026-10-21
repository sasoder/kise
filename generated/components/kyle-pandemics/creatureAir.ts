// ---------------------------------------------------------------------------
// creatureAir: the clip's medium as the creatures of kyle-pandemics take it: the zombie ant (zombieAntFigure.tsx,
// cut 58) and the marmot (marmot3D.ts / rodentSteppe3D.tsx, cut 1). The director picked palette A (pandemicAir.tsx
// AIR.A, the Will water ramp carried to air). The rule: the animal's local colour survives near (warm natural browns,
// a cream rim on the top edges); only distance cools it toward the teal (`fog`, from the cut's AirView.fogAt once the
// cuts are wrapped in AirStage); its shadow side sinks toward the medium's shadow (AIR.A.shadow), never black.
// B (the umber page) is kept only so the delivered V2 look can still be drawn for comparison.
// ---------------------------------------------------------------------------
import { AIR, airRamp, rgbHex } from "./pandemicAir";

export type Air = {
  id: "A" | "B";
  /** the medium at the subject's distance: what fog mixes toward */
  body: string;
  /** what the shadow side sinks toward */
  shade: string;
  /** the light of the medium (rims, the bounce from below) */
  light: string;
  /** the thinnest darkest outline allowed */
  line: string;
};
/** A: the air at about the subject's distance in a day scene (ramp t ~ the horizon's) */
export const AIR_A: Air = { id: "A", body: rgbHex(airRamp("A", AIR.A.eyeT + 0.02)), shade: AIR.A.shadow, light: AIR.A.cream, line: AIR.A.line };
export const AIR_B: Air = { id: "B", body: "#3F3428", shade: "#17120D", light: "#6A5838", line: "#17120D" };
export const AIRS = { A: AIR_A, B: AIR_B } as const;

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = Math.max(0, Math.min(1, t));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};
/** a local colour in the air: fogged toward the medium by `fog` */
export const inAir = (air: Air, c: string, fog: number) => mixHex(c, air.body, fog);
/** a shadow-side colour in the air: sunk toward the air's shade by `sink`, then fogged */
export const shadeInAir = (air: Air, c: string, sink: number, fog: number) => mixHex(mixHex(c, air.shade, sink), air.body, fog);
/** as 0..1 floats (for three.js uniforms) */
export const rgb01 = (h: string): [number, number, number] => hexRgb(h).map((v) => v / 255) as [number, number, number];
