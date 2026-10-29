// VORTEX_READY
// ===================================================================================================================
// vortexSky — THE VORTEX SKY of sam-navier-stokes (Cheeky Pint S4E07, Sam Altman, "we could redo Navier-Stokes at a
// hundredth of the cost"). Cuts 10 and 19 share it. The Scott clips' cruise sky (scott-free-wifi/wifiSky: the golden
// cumulus deck far below, the sky deepening upward to espresso, the warm haze; built on scott-aircraft-order/
// aircraftShared), imported read-only, with no jets, satellites or contrails. In it stands the Navier-Stokes flow
// after the user's reference picture (assets-src/sam-navier-stokes/user_vortex.png): a giant vertical vortex of many
// lit cream streamline tubes rising out of the deck, an inner core of tight helices, wider middle helices, and outer
// streamlines flaring wide at the waist and sweeping round to fine tips. AMBER = COMPUTE MONEY SPENT on the math: an
// amber front climbs the tubes from the base (`fill`); CREAM = the math, the proof (the flow).
// RENDER EVERY CUT WITH --gl=angle (WebGL).
//
// WORLD UNITS: aircraftShared's. Metres. X right, Y up (sea level 0), Z AWAY from the camera. The deck's floor is
// DECK.base (0), its tops' ceiling DECK.top (3700 m); its heads reach ~3250 m at most (deckTopAt gives the surface).
//
// THE HONEST CHEATS (say so if asked): the vortex is a picture of the proof, not weather: a 6.3 km tall flow standing
// in the sky. It turns rigidly per tube (the core faster than the rim: differential rotation), where a steady flow's
// streamlines would stand still and the fluid would run along them. The deck's clouds do not cast onto it.
//
// API
//   <VortexStage cam S rest? world overlay? air? deck? ...CruiseStageProps>   the frame: wifiSky's <CruiseStage> (its
//                          deck, sky, haze, grade, bloom, amber-keep, grain) with a slow air drift (VORTEX_AIR) and the
//                          vortexSky context that <Vortex> (in `world`) and <CostTick> (in `overlay`) read.
//   <Vortex at height fill? spin? detail? seed? dim? occlude? tube? rate?>   one vortex in `world`.
//                          at [X, Y, Z]: the foot of its axis (sink it below the local deck surface: deckTopAt).
//                          height (m): foot to top. fill 0..1: the amber front's level as a fraction of the height
//                          (0 = all cream). spin (deg): override the turn (default S * VORTEX_SPIN * rate + the seed's
//                          own phase). detail "hi" (~70 tubes, the hero) | "lo" (~26 tubes, cheap, for many small ones).
//                          seed: each vortex a little different (tube counts, radii, turns, lean, phase).
//                          dim 0..1: toned toward the haze and board (spent / context; never opacity).
//                          occlude (default true): the deck's heads hide its foot (ray-marched; off saves time far away).
//                          tube: tube thickness factor (1; raise it on small far vortices so tubes stay > 1 px).
//                          rate: spin speed factor (1).
//                          ADDED (cut 19): detail "field" (the squat eddy of cut 19's field: waist arms ~0.75 of the
//                          height, a skirt flaring into the deck, a blunt rounded crown); lift 0..1 (unfilled cream
//                          toward lit cream); haze 0..1 (extra aerial haze, on the amber at only 20 %). Defaults leave
//                          every existing vortex pixel-identical (cut 10 f109 still diff = 0).
//   vortexAxis(v, h) -> [X, Y, Z]   the axis point at height fraction h (with the lean) of v = { at, height, seed }
//   vortexReach(v, h) -> m          the widest tube centreline's distance from the axis at height fraction h
//   vortexFront(fill, lead) etc.: the front on each tube sits at fill + lead_i (lead_i ~ +-0.03, the core ahead), with
//                          a 2 px hot top edge (amberHot) and a short warm glow above it; below it the tube is amber
//                          (amberFoot at the foot -> amberTop at the front), fixed bloom from the stage.
//   <CostTick at length text size? enter? sub? subEnter? subSize? inset?>   in `overlay`: a thin cream rule from
//                          `at` (world, its inner end) `length` m along +X, the label above it (Söhne FONT_NUM, cream
//                          inkCream, font size `size` m in the world), an optional small caps line below it (FONT_LABEL,
//                          inkCream), over a soft brown shade of the sky + halo (the golden sky there is lighter than
//                          the stout ground; measured ~6.7:1). enter / subEnter 0..1 (drive linearly over ~12 f): the
//                          stout entrance (slide up 24 px + fade + blur).
//   <CostRing v h draw? gap? width?>   in `world`: a thin cream level line round vortex v at height fraction h (radius =
//                          vortexReach + gap, half-thickness `width` m, depth-tested against the tubes), drawn out both
//                          ways from the +X side (where a CostTick's rule touches it) by two tips as draw goes 0 -> 1.
//   deckTopAt([X, Z], S, air?) -> m   the deck's cloud surface height there at story frame S (the deck shader's own
//                          heaps, ported; good to ~10 m)
//   CUT 10 (TenMillionForOneProof): cut10Cam(f) (its camera track, sampled at any f in -20..140), cut10Fill(f),
//   CUT10_TICK_ENTER(f), CUT10_SUB_ENTER(f), CUT10_RING_DRAW(f), CUT10_END { f, S, cam, fill } (f109): cut 19 opens on exactly that.
//   Constants: NS_VORTEX (the Navier-Stokes vortex: at, height, seed), NS_TICK (the ~$10M tick: h, at, length, size,
//   text, sub, subSize, inset), VORTEX_SPIN (deg / frame), VORTEX_AIR (m / frame), VORTEX_FOG.
//
// PERFORMANCE: see VORTEX_READY.md (ms per frame). Geometry is built once per (seed, detail) and cached; the spin,
// lean, fill and fog are uniforms. Everything renders twice (AirStage's amber-keep copy), so keep `world` pure.
// ===================================================================================================================
import React, { useMemo } from "react";
import { random } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR, FONT_LABEL, FONT_NUM, TRACK, easeOutCubic } from "../kits/cheeky-pint/stoutShared";
import { LIGHT, airCamAt, airProject, airTrack, horizonRow, type AirCam, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { CruiseStage, DECK, type CruiseStageProps, type DeckSpec } from "../scott-free-wifi/wifiSky";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));
const f2 = (v: number) => (Math.round(v * 100) / 100).toString();

// ===================================================================================================================
// CONSTANTS
// ===================================================================================================================
/** the vortex's turn at its core (deg per frame; the rim turns ~0.55x): one turn in ~19 s */
export const VORTEX_SPIN = 0.78;
/** the air's slow drift (m per frame, world): the deck slides gently to the right */
export const VORTEX_AIR: V3 = [1.4, 0, 0];
/** the vortex's distance fog (m): none nearer than `near`, then max * (1 - exp(-(d - near) / vis)), toward the sky
 *  colour behind each fragment */
export const VORTEX_FOG = { near: 1500, vis: 9000, max: 0.3 } as const;
/** THE Navier-Stokes vortex of cuts 10 and 19: its foot sits in a big cumulus heap (the deck is >= 2.4 km within
 *  500 m of the axis through S 0..220) */
export const NS_VORTEX = { at: [-2550, 2300, 2550] as V3, height: 6300, seed: 1 } as const;
export type VortexSpec = { at: V3; height: number; seed: number };
/** ADDED (real look): the vortex's tube colours after OpenAI's own picture (assets-src/sam-navier-stokes/
 *  openai_vortex_hires.png), per family. lit = the key-lit side, shd = the shade side. The core is a dark, matte burnt
 *  orange (with a few mauve-tan ribbons), so the luminous amber fill always reads as something else. */
export const VORTEX_REAL = {
  coreLit: "#A65C20",
  coreShd: "#3A1D0B",
  mauveLit: "#968089",
  mauveShd: "#3A2F37",
  blueLit: "#1A6FE4",
  blueShd: "#0A2C5E",
  deepLit: "#0E58AE",
  deepShd: "#081F44",
  tealLit: "#0C7C98",
  tealShd: "#06303E",
  cyanLit: "#10D2E2",
  cyanTip: "#0CF4FC",
  cyanShd: "#05707E",
} as const;
export type VortexLook = "cream" | "real";
/** ADDED (fill parts): which tubes the amber fill takes. "all" = every tube (the default); "inner" = only the core and
 *  middle helices, so the outer arms keep their colour (the real look's cyan flare) above and below the front */
export type VortexFillParts = "all" | "inner";
const glv = (h: string) => `vec3(${hex3(h).map((c) => c.toFixed(4)).join(", ")})`;

// ===================================================================================================================
// THE STAGE + CONTEXT
// ===================================================================================================================
type VCtxT = { cam: AirCam; S: number; air: V3; deck: DeckSpec | null };
const VCtx = React.createContext<VCtxT | null>(null);
const useV = () => {
  const c = React.useContext(VCtx);
  if (!c) throw new Error("vortexSky: a vortex component was used outside <VortexStage world/overlay>");
  return c;
};
export type VortexStageProps = CruiseStageProps;
/** The vortex sky: wifiSky's CruiseStage with a slow air drift and the vortexSky context for `world` and `overlay`. */
export const VortexStage: React.FC<VortexStageProps> = ({ cam, S, world, overlay, deck = true, air = VORTEX_AIR, ...rest }) => {
  const spec = deck === true ? DECK : deck === false ? null : deck;
  const ctx: VCtxT = { cam, S, air, deck: spec };
  return (
    <CruiseStage
      {...rest}
      cam={cam}
      S={S}
      deck={deck}
      air={air}
      world={<VCtx.Provider value={ctx}>{world}</VCtx.Provider>}
      overlay={overlay ? <VCtx.Provider value={ctx}>{overlay}</VCtx.Provider> : undefined}
    />
  );
};

// ===================================================================================================================
// THE DECK'S SURFACE (wifiSky's DECK_FRAG cloudH, ported: GLSL for the foot's occlusion, TS for placing things)
// ===================================================================================================================
const CLOUD_GLSL = /* glsl */ `
uniform float uTime;
float h21(vec2 p) {
  p = mod(p, 4096.0);
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 h22(vec2 p) {
  p = mod(p, 4096.0);
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float smax(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * k * 0.25;
}
float heaps(vec2 x, float empty, float k) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float acc = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 id = n + g;
      vec2 o = h22(id);
      float keep = step(empty, h21(id + 3.17));
      vec2 c = g + 0.2 + 0.6 * o;
      float r = (0.72 + 0.28 * h21(id + 7.31)) * (1.0 + 0.03 * sin(uTime * 0.045 + 6.283 * o.x));
      vec2 d = f - c;
      float q = 1.0 - dot(d, d) / (r * r);
      float hh = q > 0.0 ? sqrt(q) * r * (0.55 + 0.45 * o.y) * keep : 0.0;
      acc = smax(acc, hh, k);
    }
  }
  return acc;
}
float cloudH(vec2 p) {
  float big = heaps(p / 3600.0, 0.22, 0.22);
  float on = smoothstep(0.05, 0.35, big);
  float mid = heaps(p / 1400.0 + 3.7, 0.1, 0.2) * on;
  float sm = heaps(p / 550.0 + 9.1, 0.0, 0.18) * on;
  return 0.62 * (3600.0 * big + 1400.0 * mid + 240.0 * sm);
}
`;
const fract = (v: number) => v - Math.floor(v);
const modp = (v: number, m: number) => v - m * Math.floor(v / m);
const h21 = (px: number, py: number) => {
  px = modp(px, 4096);
  py = modp(py, 4096);
  let a = fract(px * 0.1031);
  let b = fract(py * 0.1031);
  let c = fract(px * 0.1031);
  const d = a * b + b * c + c * a; // dot(p3, p3.yzx)
  const dd = d + 33.33 * (a + b + c);
  a += dd;
  b += dd;
  c += dd;
  return fract((a + b) * c);
};
const h22 = (px: number, py: number): [number, number] => {
  px = modp(px, 4096);
  py = modp(py, 4096);
  let a = fract(px * 0.1031);
  let b = fract(py * 0.103);
  let c = fract(px * 0.0973);
  const dd = a * b + b * c + c * a + 33.33 * (a + b + c);
  a += dd;
  b += dd;
  c += dd;
  return [fract((a + b) * c), fract((a + c) * b)];
};
const smaxJ = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
};
const heapsJ = (x: number, y: number, empty: number, k: number, T: number) => {
  const nx = Math.floor(x);
  const ny = Math.floor(y);
  const fx = x - nx;
  const fy = y - ny;
  let acc = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const ix = nx + i;
      const iy = ny + j;
      const o = h22(ix, iy);
      const keep = h21(ix + 3.17, iy + 3.17) >= empty ? 1 : 0;
      const cx = i + 0.2 + 0.6 * o[0];
      const cy = j + 0.2 + 0.6 * o[1];
      const r = (0.72 + 0.28 * h21(ix + 7.31, iy + 7.31)) * (1 + 0.03 * Math.sin(T * 0.045 + 6.283 * o[0]));
      const dx = fx - cx;
      const dy = fy - cy;
      const q = 1 - (dx * dx + dy * dy) / (r * r);
      const hh = q > 0 ? Math.sqrt(q) * r * (0.55 + 0.45 * o[1]) * keep : 0;
      acc = smaxJ(acc, hh, k);
    }
  }
  return acc;
};
/** The deck's cloud surface (m above sea level) at world [X, Z] at story frame S, drifting with `air`. */
export const deckTopAt = (xz: [number, number], S: number, air: V3 = VORTEX_AIR, spec: DeckSpec = DECK) => {
  // the deck shader works in three.js coords (z = -Z) and slides by uDrift = (air.x S, -air.z S)
  const px = xz[0] - air[0] * S;
  const pz = -xz[1] + air[2] * S;
  const big = heapsJ(px / 3600, pz / 3600, 0.22, 0.22, S);
  const on = sstep(0.05, 0.35, big);
  const mid = heapsJ(px / 1400 + 3.7, pz / 1400 + 3.7, 0.1, 0.2, S) * on;
  const sm = heapsJ(px / 550 + 9.1, pz / 550 + 9.1, 0, 0.18, S) * on;
  return spec.base + 0.62 * (3600 * big + 1400 * mid + 240 * sm);
};

// ===================================================================================================================
// THE VORTEX GEOMETRY (local units: height 1, the axis on local Y, the foot at the origin)
// ===================================================================================================================
export type VortexDetail = "hi" | "lo" | "field";
type Tube = { c: V3[]; rad: number[]; h: number[]; r: number[]; s: number[]; lead: number; fam: number };
const DET = {
  hi: { core: 18, mid: 18, outer: 34, segH: 360, segO: 190, ring: 9 },
  lo: { core: 6, mid: 7, outer: 12, segH: 130, segO: 70, ring: 6 },
  // ADDED for cut 19 (SHARED_CHANGES): the squat "field" eddy, see buildFieldTubes
  field: { core: 5, mid: 9, outer: 16, segH: 120, segO: 80, ring: 6 },
} as const;
/** the per-seed character of a vortex: tube counts, radii, turns, lean, the waist and its tilt, phase */
const character = (seed: number) => {
  const R = (k: string) => random(`vortex-${seed}-${k}`);
  return {
    width: lerp(0.92, 1.08, R("w")),
    turns: lerp(0.9, 1.12, R("t")),
    count: lerp(0.85, 1.15, R("n")),
    lean: [lerp(-0.06, 0.06, R("lx")), lerp(-0.04, 0.04, R("lz"))] as [number, number],
    phase: R("p") * 360,
    waist: lerp(0.47, 0.55, R("waist")),
    /** the waist disc's tilt: height change per unit radius, and the direction it dips toward */
    tilt: lerp(0.3, 0.45, R("tilt")),
    tiltDir: R("tdir") * Math.PI * 2,
  };
};
// ADDED for cut 19 (SHARED_CHANGES): detail "field" — the small vortices of cut 19's field. The same family (a core
// rope, a sheath of helices, long waist arms on a tilted disc, one sense of rotation) in squat proportions closer to
// the user's reference: the waist arms span ~0.7-0.8 of the height (dominant), a wide lower half whose skirt arms flare
// out into the deck, and a blunt rounded crown (the sheath closes as a dome; the core ends inside it: no needle top).
// Fatter tubes, so it reads at 100-600 px tall. hi / lo are untouched.
const buildFieldTubes = (seed: number): Tube[] => {
  const D = DET.field;
  const ch = character(seed);
  const R = (k: string) => random(`vortex-${seed}-f-${k}`);
  const tubes: Tube[] = [];
  const W = ch.width;
  const waist = lerp(0.36, 0.44, R("waist"));
  const tilt = (r: number, th: number) => ch.tilt * 0.7 * r * Math.cos(th - ch.tiltDir);
  // the sheath's envelope (fraction of 0.22): wide below the waist and a little wider again at the foot, a dome above
  const env = (h: number) => {
    if (h < waist) return lerp(1.08, 1, sstep(0, 1, h / waist));
    const u = c01((h - waist) / (1 - waist));
    return Math.pow(Math.max(0, 1 - u * u * u), 0.32);
  };
  const push = (t: Tube, r: number, th: number, h: number, rad: number, sv: number) => {
    t.c.push([r * Math.cos(th), h, r * Math.sin(th)]);
    t.rad.push(rad);
    t.h.push(h);
    t.r.push(r);
    t.s.push(sv);
  };
  const tk = 1.75;
  // --- the core rope: tight helices from the foot to inside the dome (h ~0.82), short tapers
  const coreTurns = lerp(4.6, 5.4, R("ct")) * ch.turns;
  for (let i = 0; i < D.core; i++) {
    const k = `c${i}`;
    const r0 = lerp(0.016, 0.045, (i % 3) / 2) * W;
    const h0 = 0.01 + 0.03 * R(k + "a");
    const h1 = lerp(0.66, 0.74, R(k + "b"));
    const th0 = (i / D.core) * Math.PI * 2;
    const tr = lerp(0.0028, 0.0034, R(k + "w")) * tk;
    const t: Tube = { c: [], rad: [], h: [], r: [], s: [], lead: 0.016 + lerp(-0.012, 0.012, R(k + "l")), fam: 0 };
    for (let j = 0; j <= D.segH; j++) {
      const u = j / D.segH;
      const h = lerp(h0, h1, u);
      push(t, r0 * (0.6 + 0.4 * Math.min(1, env(h))), th0 + coreTurns * Math.PI * 2 * (h - h0), h, tr * Math.pow(sstep(0, 0.06, u), 0.8) * Math.pow(1 - sstep(0.9, 1, u), 0.6), u);
    }
    tubes.push(t);
  }
  // --- the sheath: helices of one pitch, radii stepping out, wide low down, closing over the top as a dome
  const midTurns = lerp(3.4, 3.9, R("mt")) * ch.turns;
  for (let i = 0; i < D.mid; i++) {
    const k = `m${i}`;
    const r0 = lerp(0.09, 0.22, (i + 0.4 * R(k + "r")) / D.mid) * W;
    const h0 = lerp(0.0, 0.05, R(k + "a"));
    const h1 = lerp(0.8, 0.88, R(k + "b"));
    const th0 = ((i * 0.618034) % 1) * Math.PI * 2;
    const tr = lerp(0.0028, 0.0036, R(k + "w")) * tk;
    const N = Math.round(D.segH * 0.9);
    const t: Tube = { c: [], rad: [], h: [], r: [], s: [], lead: lerp(-0.015, 0.015, R(k + "l")), fam: 1 };
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      const hb = lerp(h0, h1, u);
      // the dome: the radius closes toward the crown, but never to a point (the last loops stay ~45 % wide)
      const r = r0 * Math.max(0.45, env(hb));
      const th = th0 + midTurns * Math.PI * 2 * (hb - h0);
      const h = hb + tilt(r, th) * Math.exp(-Math.pow((hb - waist) / 0.18, 2));
      push(t, r, th, h, tr * Math.pow(sstep(0, 0.1, u), 0.8) * Math.pow(1 - sstep(0.9, 1, u), 0.5), u);
    }
    tubes.push(t);
  }
  // --- the waist arms (dominant): out of the sheath just above / below the waist, long shallow arcs on the tilted
  //     disc out to 0.3-0.4 of the height, whip tips
  const outTurns = lerp(1.0, 1.15, R("ot")) * ch.turns;
  for (let i = 0; i < D.outer; i++) {
    const k = `o${i}`;
    const up = i % 2 === 0;
    const hA = waist + (up ? 1 : -1) * lerp(0.06, 0.18, R(k + "a"));
    const hW = waist + lerp(-0.03, 0.03, R(k + "hw"));
    const rA = lerp(0.1, 0.16, R(k + "ra")) * W;
    const rM = lerp(0.27, 0.4, Math.pow((i + 0.5 * R(k + "rm")) / D.outer, 0.8)) * W;
    const th0 = ((i * 0.381966) % 1) * Math.PI * 2;
    const tr = lerp(0.003, 0.004, R(k + "w")) * tk;
    const t: Tube = { c: [], rad: [], h: [], r: [], s: [], lead: lerp(-0.03, 0.01, R(k + "l")), fam: 2 };
    for (let j = 0; j <= D.segO; j++) {
      const u = j / D.segO;
      const r = lerp(rA, rM, Math.pow(u, 0.8));
      const th = th0 + outTurns * Math.PI * 2 * u;
      const toW = 1 - Math.pow(1 - u, 2.2);
      const h = lerp(hA, hW, toW) + tilt(r, th) * toW;
      push(t, r, th, h, tr * Math.pow(sstep(0, 0.08, u), 0.8) * Math.pow(1 - u, 0.9) * 1.5, u);
    }
    tubes.push(t);
  }
  // --- the skirt: arms from the lower sheath sweeping out and down into the deck tops (the foot flares)
  const nSkirt = 7;
  for (let i = 0; i < nSkirt; i++) {
    const k = `s${i}`;
    const hA = lerp(0.16, 0.28, R(k + "a"));
    const rA = lerp(0.12, 0.18, R(k + "ra")) * W;
    const rM = lerp(0.26, 0.34, R(k + "rm")) * W;
    const th0 = ((i + 0.3 * R(k + "p")) / nSkirt) * Math.PI * 2;
    const tr = lerp(0.003, 0.0038, R(k + "w")) * tk;
    const N = Math.round(D.segO * 0.8);
    const t: Tube = { c: [], rad: [], h: [], r: [], s: [], lead: lerp(-0.01, 0.02, R(k + "l")), fam: 2 };
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      const r = lerp(rA, rM, Math.pow(u, 0.9));
      const th = th0 + 0.8 * Math.PI * 2 * u;
      const h = lerp(hA, -0.02, Math.pow(u, 0.8));
      push(t, r, th, h, tr * Math.pow(sstep(0, 0.1, u), 0.8) * Math.pow(1 - u, 0.7) * 1.4, u);
    }
    tubes.push(t);
  }
  return tubes;
};
const buildTubes = (seed: number, det: VortexDetail): Tube[] => {
  if (det === "field") return buildFieldTubes(seed);
  const D = DET[det];
  const ch = character(seed);
  const R = (k: string) => random(`vortex-${seed}-${det === "hi" ? "h" : "l"}-${k}`);
  const tubes: Tube[] = [];
  const nCore = Math.max(4, Math.round(D.core * ch.count));
  const nMid = Math.max(4, Math.round(D.mid * ch.count));
  const nOut = Math.max(6, Math.round(D.outer * ch.count));
  // lo detail is for small far vortices: fewer, fatter tubes (still a flow)
  const tk = det === "hi" ? 1 : 1.6;
  const W = ch.width;
  const waist = ch.waist;
  // the spindle: zero at the foot and the top, fullest at the waist (the foot's tip dips into the deck)
  const spindle = (h: number) => {
    // a spindle mirrored about the waist (never a funnel): the lower half stays wide and the foot widens a little
    // again where it enters the deck tops; the crown stays open (never a spire)
    if (h < waist) {
      const d = c01((waist - h) / waist);
      return lerp(1, 0.42, Math.pow(d, 2.2)) * (1 + 0.2 * (1 - sstep(0, 0.12, h)));
    }
    const u = c01((h - waist) / (1 - waist));
    return lerp(1, 0.42, Math.pow(u, 2.2));
  };
  const tilt = (r: number, th: number) => ch.tilt * r * Math.cos(th - ch.tiltDir);
  const push = (t: Tube, r: number, th: number, h: number, rad: number, s: number) => {
    t.c.push([r * Math.cos(th), h, r * Math.sin(th)]);
    t.rad.push(rad);
    t.h.push(h);
    t.r.push(r);
    t.s.push(s);
  };
  // ORDER (the reference's beauty): every family shares one pitch and one sense of rotation, neighbours run parallel
  // (phases spread evenly, radii stepping gradually from tube to tube), long smooth loops, needle tips at the ends.
  // --- the inner core: a twisted rope of tight helices, the full height, poking out a little at the top
  const coreTurns = lerp(6.5, 7.5, R("ct")) * ch.turns;
  for (let i = 0; i < nCore; i++) {
    const k = `c${i}`;
    const layer = (i % 3) / 2;
    const r0 = lerp(0.008, 0.03, layer) * W * lerp(0.95, 1.05, R(k + "r"));
    const h0 = 0.01 + 0.03 * R(k + "a");
    const h1 = 0.98 + 0.04 * R(k + "b");
    const th0 = ((i + 0.15 * R(k + "p")) / nCore) * Math.PI * 2;
    const tr = lerp(0.0028, 0.0034, R(k + "w")) * tk;
    const lead = 0.016 + lerp(-0.012, 0.012, R(k + "l"));
    const N = D.segH;
    const t: Tube = { c: [], rad: [], h: [], r: [], s: [], lead, fam: 0 };
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      const h = lerp(h0, h1, u);
      const r = r0 * (0.3 + 0.7 * spindle(h)) * (1 + 0.8 * sstep(0.92, 1.03, h));
      push(t, r, th0 + coreTurns * Math.PI * 2 * (h - h0), h, tr * Math.pow(sstep(0, 0.08, u), 0.8) * Math.pow(1 - sstep(0.86, 1, u), 0.6), u);
    }
    tubes.push(t);
  }
  // --- the middle helices: one shared pitch, a sheath around the core, radii stepping out gradually, long
  const midTurns = lerp(2.9, 3.3, R("mt")) * ch.turns; // turns per unit of height
  for (let i = 0; i < nMid; i++) {
    const k = `m${i}`;
    const r0 = lerp(0.055, 0.15, (i + 0.4 * R(k + "r")) / nMid) * W;
    const h0 = lerp(0.0, 0.07, R(k + "a"));
    const h1 = lerp(0.86, 0.99, R(k + "b"));
    const th0 = ((i * 0.618034) % 1) * Math.PI * 2;
    const tr = lerp(0.0026, 0.0034, R(k + "w")) * tk;
    const lead = lerp(-0.015, 0.015, R(k + "l"));
    const N = Math.round(D.segH * 0.8);
    const t: Tube = { c: [], rad: [], h: [], r: [], s: [], lead, fam: 1 };
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      const hb = lerp(h0, h1, u);
      const r = r0 * (0.12 + 0.88 * Math.pow(spindle(hb), 1.1));
      const th = th0 + midTurns * Math.PI * 2 * (hb - h0);
      // near the waist the loops tilt with the waist disc
      const h = hb + tilt(r, th) * Math.exp(-Math.pow((hb - waist) / 0.2, 2));
      push(t, r, th, h, tr * Math.pow(sstep(0, 0.12, u), 0.8) * Math.pow(1 - sstep(0.84, 1, u), 0.6), u);
    }
    tubes.push(t);
  }
  // --- the outer arms: out of the sheath a little above or below the waist, sweeping out in long, shallow, nearly
  //     horizontal arcs on the tilted waist disc (one sense of rotation, one angular rate), tapering to whip tips
  const outTurns = lerp(1.05, 1.2, R("ot")) * ch.turns;
  for (let i = 0; i < nOut; i++) {
    const k = `o${i}`;
    const up = i % 2 === 0;
    const hA = waist + (up ? 1 : -1) * lerp(0.1, 0.3, R(k + "a"));
    const hW = waist + lerp(-0.035, 0.035, R(k + "hw"));
    const rA = lerp(0.05, 0.09, R(k + "ra")) * W;
    const rM = lerp(0.19, 0.34, Math.pow((i + 0.5 * R(k + "rm")) / nOut, 0.9)) * W;
    const th0 = ((i * 0.381966) % 1) * Math.PI * 2;
    const tr = lerp(0.0022, 0.003, R(k + "w")) * tk * (det === "hi" ? 1 : 1.25);
    const lead = lerp(-0.03, 0.01, R(k + "l"));
    const N = D.segO;
    const t: Tube = { c: [], rad: [], h: [], r: [], s: [], lead, fam: 2 };
    for (let j = 0; j <= N; j++) {
      const u = j / N; // 0 at the sheath, 1 at the tip
      const r = lerp(rA, rM, Math.pow(u, 0.85));
      const th = th0 + outTurns * Math.PI * 2 * u;
      // most of the height change happens early: the long outer sweep runs nearly level
      const toW = 1 - Math.pow(1 - u, 2.2);
      const h = lerp(hA, hW, toW) + tilt(r, th) * toW;
      push(t, r, th, h, tr * Math.pow(sstep(0, 0.1, u), 0.8) * Math.pow(1 - u, 1.1) * 1.6, u);
    }
    tubes.push(t);
  }
  return tubes;
};
type VGeo = { geo: Any; reach: number[] };
const geoCache = new Map<string, VGeo>();
const REACH_BINS = 64;
const vortexGeo = (seed: number, det: VortexDetail): VGeo => {
  const key = `${seed}:${det}`;
  const have = geoCache.get(key);
  if (have) return have;
  const tubes = buildTubes(seed, det);
  const M = DET[det].ring;
  let nv = 0;
  let ni = 0;
  for (const t of tubes) {
    nv += t.c.length * (M + 1);
    ni += (t.c.length - 1) * M * 6;
  }
  const pos = new Float32Array(nv * 3);
  const nor = new Float32Array(nv * 3);
  const aH = new Float32Array(nv);
  const aR = new Float32Array(nv);
  const aS = new Float32Array(nv);
  const aLead = new Float32Array(nv);
  const aFam = new Float32Array(nv);
  const aRad = new Float32Array(nv);
  const idx = new Uint32Array(ni);
  const reach = new Array(REACH_BINS + 1).fill(0);
  let vi = 0;
  let ii = 0;
  for (const t of tubes) {
    const n = t.c.length;
    // tangents, then a parallel-transport frame (no twist, no flips)
    const T: V3[] = [];
    for (let j = 0; j < n; j++) {
      const a = t.c[Math.max(0, j - 1)];
      const b = t.c[Math.min(n - 1, j + 1)];
      const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const l = Math.hypot(d[0], d[1], d[2]) || 1;
      T.push([d[0] / l, d[1] / l, d[2] / l]);
    }
    // initial normal: perpendicular to T0, as close to "up" as possible (so the rim light sits on top edges)
    const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]) || 1;
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    let Nn = norm(cross(cross(T[0], [0, 1, 0]), T[0]));
    if (!isFinite(Nn[0]) || Math.hypot(...Nn) < 0.5) Nn = norm(cross(T[0], [1, 0, 0]));
    const base = vi;
    for (let j = 0; j < n; j++) {
      if (j > 0) {
        // transport the normal from T[j-1] to T[j]
        const b = cross(T[j - 1], T[j]);
        const bl = Math.hypot(b[0], b[1], b[2]);
        if (bl > 1e-8) {
          const ax = norm(b);
          const ang = Math.acos(Math.max(-1, Math.min(1, T[j - 1][0] * T[j][0] + T[j - 1][1] * T[j][1] + T[j - 1][2] * T[j][2])));
          // Rodrigues
          const c = Math.cos(ang);
          const s = Math.sin(ang);
          const d = ax[0] * Nn[0] + ax[1] * Nn[1] + ax[2] * Nn[2];
          const cr = cross(ax, Nn);
          Nn = norm([Nn[0] * c + cr[0] * s + ax[0] * d * (1 - c), Nn[1] * c + cr[1] * s + ax[1] * d * (1 - c), Nn[2] * c + cr[2] * s + ax[2] * d * (1 - c)]);
        }
      }
      const B = norm(cross(T[j], Nn));
      const C = t.c[j];
      const rr = t.rad[j];
      for (let m = 0; m <= M; m++) {
        const a = (m / M) * Math.PI * 2;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const dn: V3 = [Nn[0] * ca + B[0] * sa, Nn[1] * ca + B[1] * sa, Nn[2] * ca + B[2] * sa];
        pos[vi * 3] = C[0] + dn[0] * rr;
        pos[vi * 3 + 1] = C[1] + dn[1] * rr;
        pos[vi * 3 + 2] = C[2] + dn[2] * rr;
        nor[vi * 3] = dn[0];
        nor[vi * 3 + 1] = dn[1];
        nor[vi * 3 + 2] = dn[2];
        aH[vi] = t.h[j];
        aR[vi] = t.r[j];
        aS[vi] = t.s[j];
        aLead[vi] = t.lead;
        aFam[vi] = t.fam;
        aRad[vi] = rr;
        vi++;
      }
      const bin = Math.round(c01(t.h[j]) * REACH_BINS);
      if (rr > 0.0004) reach[bin] = Math.max(reach[bin], t.r[j]);
    }
    for (let j = 0; j < n - 1; j++) {
      for (let m = 0; m < M; m++) {
        const a = base + j * (M + 1) + m;
        const b = a + M + 1;
        idx[ii++] = a;
        idx[ii++] = b;
        idx[ii++] = a + 1;
        idx[ii++] = a + 1;
        idx[ii++] = b;
        idx[ii++] = b + 1;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("aH", new THREE.BufferAttribute(aH, 1));
  g.setAttribute("aR", new THREE.BufferAttribute(aR, 1));
  g.setAttribute("aS", new THREE.BufferAttribute(aS, 1));
  g.setAttribute("aLead", new THREE.BufferAttribute(aLead, 1));
  g.setAttribute("aFam", new THREE.BufferAttribute(aFam, 1));
  g.setAttribute("aRad", new THREE.BufferAttribute(aRad, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  // smooth the reach profile a little (bins with no tube inherit their neighbours')
  const sm = reach.map((_, i) => Math.max(reach[Math.max(0, i - 1)], reach[i], reach[Math.min(REACH_BINS, i + 1)]));
  const out = { geo: g, reach: sm };
  geoCache.set(key, out);
  return out;
};

// ===================================================================================================================
// SHADERS
// ===================================================================================================================
const VORTEX_VERT = /* glsl */ `
attribute float aH;
attribute float aR;
attribute float aS;
attribute float aLead;
attribute float aFam;
attribute float aRad;
uniform float uSpin;     // radians at the core
uniform vec2 uLean;      // the top's offset from the foot (fractions of the height; three x, z)
uniform float uHeight;
uniform float uTube;     // tube thickness factor
uniform vec3 uAt;        // the foot (three coords)
varying vec3 vW;
varying vec3 vN;
varying float vH;
varying float vR;
varying float vLead;
varying float vFam;
varying vec2 vScr;
void main() {
  // differential rotation: the core turns fastest, the rim at ~0.55 of it
  float a = uSpin * mix(1.0, 0.55, smoothstep(0.02, 0.2, aR));
  float c = cos(a);
  float s = sin(a);
  // the tube surface about its own centreline (thickness factor), then the turn about the axis
  vec3 n = normal;
  vec3 q = position + n * aRad * (uTube - 1.0);
  vec3 p = vec3(c * q.x + s * q.z, q.y, -s * q.x + c * q.z);
  vec3 nn = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
  p.xz += uLean * aH * aH;
  vec3 w = uAt + p * uHeight;
  vW = w;
  vN = nn;
  vH = aH;
  vR = aR;
  vLead = aLead;
  vFam = aFam;
  vec4 clip = projectionMatrix * viewMatrix * vec4(w, 1.0);
  gl_Position = clip;
  vScr = vec2(540.0 + 540.0 * clip.x / clip.w, 960.0 - 960.0 * clip.y / clip.w);
}`;
const VORTEX_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uCream;
uniform vec3 uCreamFoot;
uniform vec3 uShade;
uniform vec3 uBounce;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform float uFill;
uniform float uDim;
uniform vec3 uDimCol;
uniform vec3 uFogP;       // near, vis, max
uniform float uHor;
uniform vec3 uSky[7];
uniform float uSkyO[7];
uniform vec2 uSunC;
uniform vec3 uSunCol;
uniform float uOcc;
uniform float uDeckBase;
uniform float uDeckTop;
uniform vec2 uDrift;
uniform vec3 uCloud;
uniform vec3 uCloudShade;
uniform float uLift;      // ADDED (cut 19): lifts the cream toward lit cream (0 = unchanged)
uniform float uHaze;      // ADDED (cut 19): extra aerial haze, mostly on the cream (0 = unchanged)
uniform float uGlow;      // ADDED (cut 19): the amber band at the hero's brightness for a small, far body (0 = unchanged)
uniform float uShine;     // ADDED (cut 10 rev 1): the shine band's centre, height fraction (< -0.5 = off, the default)
uniform vec3 uShineCol;   // ADDED (cut 10 rev 1): the shine's hot white
uniform float uInner;     // ADDED (fill parts): 1 = the amber fills only the core and middle helices (the outer arms never)
uniform float uLook;      // ADDED (real look): 1 = the real colours (VORTEX_REAL), 0 = cream (the default)
uniform vec3 uShineGlow;  // ADDED (cut 10 rev 1): the shine's hot amber glow (saturated, so the amber bloom takes it)
varying vec3 vW;
varying vec3 vN;
varying float vH;
varying float vR;
varying float vLead;
varying float vFam;
varying vec2 vScr;
${CLOUD_GLSL}
vec3 skyCol(vec2 sp) {
  float u = (sp.y - (uHor - 1250.0)) / 1250.0;
  vec3 col = uSky[6];
  if (u <= 0.0) col = uSky[0];
  else if (u < 1.0) {
    for (int i = 1; i < 7; i++) {
      if (u <= uSkyO[i]) {
        col = mix(uSky[i - 1], uSky[i], (u - uSkyO[i - 1]) / (uSkyO[i] - uSkyO[i - 1]));
        break;
      }
    }
  }
  float r = length(sp - uSunC) / 780.0;
  float a = r < 0.35 ? mix(0.72, 0.24, r / 0.35) : (r < 1.0 ? mix(0.24, 0.0, (r - 0.35) / 0.65) : 0.0);
  if (sp.y < uHor + 22.0) col = mix(col, uSunCol, a);
  return col;
}
void main() {
  // --- the deck's heads hide the foot: march from here toward the eye while below the deck's ceiling
  float occ = 1.0;
  float inCloud = 0.0;
  if (uOcc > 0.5 && vW.y < uDeckTop + 20.0) {
    vec3 rd = normalize(cameraPosition - vW);
    float m = vW.y - (uDeckBase + cloudH(vW.xz - uDrift));
    float tMax = rd.y > 1e-3 ? min((uDeckTop - vW.y) / rd.y, 5000.0) : 5000.0;
    tMax = min(tMax, length(cameraPosition - vW));
    for (int i = 1; i <= 18; i++) {
      float t = tMax * (float(i) / 18.0) * (float(i) / 18.0);
      vec3 p = vW + rd * t;
      if (p.y > uDeckTop) break;
      m = min(m, p.y - (uDeckBase + cloudH(p.xz - uDrift)));
    }
    occ = smoothstep(-30.0, 170.0, m);
    inCloud = 1.0 - occ;
    if (occ < 0.015) discard;
  }
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.55, 0.7, ndl);
  // inner tubes sit in the vortex's own shade a little (depth inside the flow)
  float ao = mix(0.8, 1.0, smoothstep(0.004, 0.07, vR));
  // cream card: cream lit, creamFoot toward the foot, warm shade side, warm bounce from the deck below, a cream rim on
  // the top edges, a weak broad sheen
  vec3 base = mix(uCreamFoot, uCream, smoothstep(0.05, 0.7, vH));
  vec3 col = mix(base * uShade, base * vec3(1.03, 1.0, 0.94), lit) * mix(vec3(0.86, 0.8, 0.72), vec3(1.0), ao);
  col = mix(col, col * uBounce, 0.3 * max(-n.y, 0.0));
  float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
  col = mix(col, uCream, 0.5 * fres * smoothstep(0.05, 0.7, n.y));
  col += base * 0.08 * pow(max(dot(n, normalize(uL + V)), 0.0), 14.0);
  col = mix(col, base * vec3(1.03, 1.0, 0.95), uLift);
  // --- the real look (off by default): the picture's colours per family, under the same golden key, warm bounce,
  // rim and fog. Core matte; the middle blues and outer cyans glossy, taking a warm-white key highlight.
  if (uLook > 0.5) {
    float hs = fract(vLead * 7919.37 + vFam * 0.371);
    vec3 cLit;
    vec3 cShd;
    float gloss;
    if (vFam < 0.5) {
      float mv = step(0.8, hs);
      cLit = mix(${glv(VORTEX_REAL.coreLit)}, ${glv(VORTEX_REAL.mauveLit)}, mv) * mix(0.88, 1.06, fract(hs * 13.7));
      cShd = mix(${glv(VORTEX_REAL.coreShd)}, ${glv(VORTEX_REAL.mauveShd)}, mv);
      gloss = 0.12;
    } else if (vFam < 1.5) {
      float k = fract(hs * 3.0);
      cLit = hs < 0.34 ? ${glv(VORTEX_REAL.deepLit)} : (hs < 0.8 ? ${glv(VORTEX_REAL.blueLit)} : ${glv(VORTEX_REAL.tealLit)});
      cShd = hs < 0.34 ? ${glv(VORTEX_REAL.deepShd)} : (hs < 0.8 ? ${glv(VORTEX_REAL.blueShd)} : ${glv(VORTEX_REAL.tealShd)});
      cLit *= mix(0.9, 1.1, k);
      gloss = 1.0;
    } else {
      cLit = mix(${glv(VORTEX_REAL.cyanLit)}, ${glv(VORTEX_REAL.cyanTip)}, smoothstep(0.12, 0.34, vR)) * mix(0.9, 1.05, hs);
      cShd = ${glv(VORTEX_REAL.cyanShd)};
      gloss = 0.9;
    }
    // the golden key on the lit side, the warm deck bounce below, the shade side kept in its own hue
    vec3 rc = mix(cShd, cLit * vec3(1.05, 1.0, 0.94), lit) * mix(0.78, 1.0, ao);
    rc = mix(rc, rc * uBounce, 0.3 * max(-n.y, 0.0));
    rc = mix(rc, cLit * 1.25 + vec3(0.06, 0.05, 0.02), 0.32 * gloss * fres * smoothstep(0.05, 0.7, n.y));
    rc += vec3(1.0, 0.91, 0.74) * gloss * 0.32 * pow(max(dot(n, normalize(uL + V)), 0.0), 26.0);
    rc = mix(rc, cLit * 1.03, uLift);
    col = rc;
  }
  float ambK = 0.0;
  // --- the amber front: each tube amber below fill + its lead, a 2 px hot top edge, a short warm glow above
  if (uFill > 0.0005 && (uInner < 0.5 || vFam < 1.5)) {
    // a soft, ragged level while it climbs; it gathers into a near-clean level as it nears the tick
    float F = uFill + vLead * smoothstep(0.0, 0.08, uFill) * (1.0 - 0.6 * smoothstep(0.6, 0.85, uFill));
    float dh = F - vH;
    float px = max(fwidth(vH), 1e-6);
    float amb = smoothstep(-0.7 * px, 0.7 * px, dh);
    float hot = amb * (1.0 - smoothstep(1.2 * px, 2.6 * px, dh));
    vec3 am = mix(uAmberFoot, uAmberTop, smoothstep(F - 0.42, F - 0.02, vH));
    am = mix(uAmberFoot * 0.64, am * 1.03, lit) * mix(0.86, 1.0, ao);
    // glow (cut 19): the band toward amberTop, a lit side toward amberHot, a shade side that stays amber, not ochre
    vec3 amG = mix(mix(uAmberFoot, uAmberTop, 0.55 + 0.45 * smoothstep(F - 0.42, F - 0.02, vH)) * 0.9, mix(uAmberTop, uAmberHot, 0.3), lit);
    am = mix(am, amG, uGlow);
    am = mix(am, uAmberHot, hot * 0.9);
    float warm = (1.0 - amb) * (1.0 - smoothstep(0.0, 0.04, -dh));
    col = mix(col, mix(col, uAmberHot, 0.6), warm * warm);
    col = mix(col, am, amb);
    ambK = amb;
  }
  // --- the shine (off by default): one band of light along the height. A hot amber glow, brighter than the lit amber
  // (it blooms through the stage's amber bloom, and reads as a hot band on the cream crown too), and in its narrow core
  // hot-white glints: specular on each tube's lit side, hottest on the edges facing the key light. Each tube's lead
  // staggers it a touch, so it runs along the flow.
  if (uShine > -0.5) {
    float sd = abs(vH + 1.2 * vLead - uShine) / 0.085;
    float band = 1.0 - smoothstep(0.0, 1.0, sd);
    float core = 1.0 - smoothstep(0.0, 0.22, sd);
    float key = smoothstep(-0.1, 0.8, ndl);
    float spec = pow(max(dot(n, normalize(uL + V)), 0.0), 16.0);
    float edge = fres * key;
    col = mix(col, uShineGlow * mix(1.0, 1.3, key), band * (0.6 + 0.35 * key));
    float hi = clamp(0.5 * key + 2.6 * spec + 2.0 * edge, 0.0, 1.6);
    col += uShineCol * hi * (core + 0.35 * band * spec);
  }
  // --- into the cloud: the foot dissolves into the deck's tone
  col = mix(col, mix(uCloudShade, uCloud, lit * 0.6 + 0.4), inCloud * 0.9);
  // --- dim (spent / context): toned toward the haze and board
  vec3 sky = skyCol(vScr);
  col = mix(col, mix(sky, uDimCol, 0.45), uDim * 0.62);
  // --- distance fog toward the sky behind this fragment
  float d = length(vW - cameraPosition);
  float f = uFogP.z * (1.0 - exp(-max(0.0, d - uFogP.x) / uFogP.y));
  f = f * (1.0 - 0.4 * uLook * (1.0 - ambK));
  f = f + (1.0 - f) * uHaze * (1.0 - 0.8 * ambK);
  f = f * (1.0 - 0.85 * uGlow * ambK);
  gl_FragColor = vec4(mix(col, sky, f), 1.0);
}`;
const SKY_O = [0, 0.24, 0.46, 0.66, 0.83, 0.93, 1];
const SKY_C = [SKY.top, SKY.upper, SKY.amber, SKY.mid, SKY.low, SKY.glow, SKY.haze];
const makeVortexMat = () =>
  new THREE.ShaderMaterial({
    vertexShader: VORTEX_VERT,
    fragmentShader: VORTEX_FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      uSpin: { value: 0 },
      uLean: { value: new THREE.Vector2(0, 0) },
      uHeight: { value: 1 },
      uTube: { value: 1 },
      uAt: { value: new THREE.Vector3() },
      uL: { value: new THREE.Vector3(LIGHT.side[0], LIGHT.side[1], -LIGHT.side[2]) },
      uCream: { value: v3(COLOR.cream) },
      uCreamFoot: { value: v3(COLOR.creamFoot) },
      uShade: { value: v3("#B8946E") },
      uBounce: { value: v3("#E9CFA6") },
      uAmberTop: { value: v3(COLOR.amberTop) },
      uAmberFoot: { value: v3(COLOR.amberFoot) },
      uAmberHot: { value: v3(COLOR.amberHot) },
      uFill: { value: 0 },
      uDim: { value: 0 },
      uDimCol: { value: v3(COLOR.board) },
      uFogP: { value: new THREE.Vector3(VORTEX_FOG.near, VORTEX_FOG.vis, VORTEX_FOG.max) },
      uHor: { value: 960 },
      uSky: { value: SKY_C.map((c) => v3(c)) },
      uSkyO: { value: SKY_O },
      uSunC: { value: new THREE.Vector2(230, 640) },
      uSunCol: { value: v3(SKY.sun) },
      uOcc: { value: 1 },
      uDeckBase: { value: DECK.base },
      uDeckTop: { value: DECK.top },
      uDrift: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uCloud: { value: v3("#F7EEDD") },
      uCloudShade: { value: v3("#C9AE8C") },
      uLift: { value: 0 },
      uHaze: { value: 0 },
      uGlow: { value: 0 },
      uShine: { value: -1 },
      uShineCol: { value: v3("#FFFBF2") },
      uShineGlow: { value: v3("#FFC629") },
      uLook: { value: 0 },
      uInner: { value: 0 },
    },
  });

// ===================================================================================================================
// THE VORTEX
// ===================================================================================================================
export type VortexProps = {
  /** the foot of the axis, world [X, Y, Z] (sink it below the local deck surface) */
  at: V3;
  /** foot to top (m) */
  height: number;
  /** 0..1: the amber front's level (fraction of the height) */
  fill?: number;
  /** deg: overrides the turn (default S * VORTEX_SPIN * rate + the seed's phase) */
  spin?: number;
  detail?: VortexDetail;
  seed?: number;
  /** 0..1: toned toward the haze and board */
  dim?: number;
  /** the deck's heads hide the foot (default true) */
  occlude?: boolean;
  /** tube thickness factor (1) */
  tube?: number;
  /** spin speed factor (1) */
  rate?: number;
  /** ADDED (cut 19) 0..1: lifts the unfilled cream toward lit cream (0 = unchanged) */
  lift?: number;
  /** ADDED (cut 19) 0..1: extra aerial haze toward the sky, on the cream fully and on the amber at 20 % (0 = unchanged) */
  haze?: number;
  /** ADDED (cut 19) 0..1: the amber band at the big one's brightness on a small, far body: band toward amberTop, lit side
   *  toward amberHot, shade side kept amber, and the distance fog / haze mostly off the amber (0 = unchanged) */
  glow?: number;
  /** ADDED (cut 10 rev 1): the shine band's centre as a height fraction (about -0.15..1.15 crosses the whole vortex);
   *  undefined = off (the default, output unchanged). Hot white #FFFBF2 core (sparkleShine's ShineSweep white) with
   *  soft amber edges, a specular glint on every tube. */
  shine?: number;
  /** ADDED (real look): "real" = the picture's colours (VORTEX_REAL: burnt-orange core, blue middle, cyan outer arms);
   *  "cream" = the default, output unchanged. The amber fill is the same in both. */
  look?: VortexLook;
  /** ADDED (fill parts): "inner" = the amber fills only the core and middle helices; "all" = the default, unchanged */
  fillParts?: VortexFillParts;
};
/** the axis point at height fraction h (the lean is a gentle curve: offset x h^2) */
export const vortexAxis = (v: VortexSpec, h: number): V3 => {
  const ch = character(v.seed);
  return [v.at[0] + ch.lean[0] * h * h * v.height, v.at[1] + h * v.height, v.at[2] + ch.lean[1] * h * h * v.height];
};
/** the widest tube centreline's distance from the axis (m) at height fraction h (hi detail) */
export const vortexReach = (v: VortexSpec, h: number, detail: VortexDetail = "hi") => {
  const g = vortexGeo(v.seed, detail);
  const x = c01(h) * REACH_BINS;
  const i = Math.min(REACH_BINS - 1, Math.floor(x));
  return lerp(g.reach[i], g.reach[i + 1], x - i) * v.height;
};
/** the vortex's default turn at story frame S (deg) */
export const vortexSpin = (seed: number, S: number, rate = 1) => S * VORTEX_SPIN * rate + character(seed).phase;

export const Vortex: React.FC<VortexProps> = ({ at, height, fill = 0, spin, detail = "hi", seed = 1, dim = 0, occlude = true, tube = 1, rate = 1, lift = 0, haze = 0, glow = 0, shine, look = "cream", fillParts = "all" }) => {
  const { cam, S, air, deck } = useV();
  const o = useMemo(() => {
    const g = vortexGeo(seed, detail);
    const mat = makeVortexMat();
    const mesh = new THREE.Mesh(g.geo, mat);
    mesh.frustumCulled = false;
    return { mesh, mat };
  }, [seed, detail]);
  const ch = character(seed);
  const u = o.mat.uniforms;
  u.uSpin.value = (spin ?? vortexSpin(seed, S, rate)) * D2R;
  // three coords: z = -Z
  u.uLean.value.set(ch.lean[0], -ch.lean[1]);
  u.uHeight.value = height;
  u.uTube.value = tube;
  u.uAt.value.set(at[0], at[1], -at[2]);
  u.uFill.value = c01(fill);
  u.uDim.value = c01(dim);
  u.uLift.value = c01(lift);
  u.uHaze.value = c01(haze);
  u.uGlow.value = c01(glow);
  u.uLook.value = look === "real" ? 1 : 0;
  u.uInner.value = fillParts === "inner" ? 1 : 0;
  u.uShine.value = shine === undefined ? -1 : Math.max(-0.4, shine);
  u.uOcc.value = occlude && deck ? 1 : 0;
  u.uDeckBase.value = deck ? deck.base : 0;
  u.uDeckTop.value = deck ? deck.top : -1e6;
  u.uDrift.value.set(air[0] * S, -air[2] * S);
  u.uTime.value = S;
  u.uHor.value = horizonRow(cam);
  const yawPx = cam.mode === "side" ? (cam.yaw ?? 0) * D2R * cam.f : 0;
  u.uSunC.value.set(230 - yawPx * 0.9, horizonRow(cam) - 320);
  return <primitive object={o.mesh} />;
};

// ===================================================================================================================
// THE COST RING (world: a thin cream level line round the vortex, depth-tested against its tubes)
// ===================================================================================================================
const RING_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vN;
void main() {
  vUv = uv;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;
const RING_FRAG = /* glsl */ `
uniform vec3 uCol;
uniform vec3 uL;
uniform float uDraw;
varying vec2 vUv;
varying vec3 vN;
void main() {
  // drawn out both ways from the point nearest the tick's rule (+X) by two moving tips
  float a = vUv.x * 6.2831853;
  a = a > 3.14159265 ? a - 6.2831853 : a;
  if (abs(a) > uDraw * 3.14159265 + 1e-4) discard;
  float lit = smoothstep(-0.6, 0.8, dot(normalize(vN), uL));
  gl_FragColor = vec4(uCol * mix(0.86, 1.0, lit), 1.0);
}`;
export type CostRingProps = {
  /** the vortex it rings (its at, height, seed) */
  v: VortexSpec;
  /** the level, a fraction of the height */
  h: number;
  /** 0..1: drawn out round the vortex from the rule's side by two tips (drive over ~12 f) */
  draw?: number;
  /** its radius beyond the widest tube there (m) */
  gap?: number;
  /** the line's half-thickness (m) */
  width?: number;
};
/** A thin cream level line round the vortex at height fraction h (in `world`); the tick's rule leaves it at +X. */
export const CostRing: React.FC<CostRingProps> = ({ v, h, draw = 1, gap = 0, width = 15 }) => {
  useV();
  const o = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
      uniforms: { uCol: { value: v3(COLOR.inkCream) }, uL: { value: new THREE.Vector3(LIGHT.side[0], LIGHT.side[1], -LIGHT.side[2]) }, uDraw: { value: 1 } },
    });
    const mesh = new THREE.Mesh(ringGeoFor(0.01), mat);
    mesh.frustumCulled = false;
    return { mesh, mat };
  }, []);
  const ax = vortexAxis(v, h);
  const R = vortexReach(v, h) + gap;
  // a unit torus with minor radius width / R, scaled by R (cached per proportion)
  o.mesh.geometry = ringGeoFor(width / R);
  o.mesh.scale.set(R, R, R);
  o.mesh.position.set(ax[0], ax[1], -ax[2]);
  o.mat.uniforms.uDraw.value = c01(draw);
  return draw > 0.001 ? <primitive object={o.mesh} /> : null;
};
const ringCache = new Map<string, Any>();
const ringGeoFor = (minor: number) => {
  const key = minor.toFixed(5);
  const have = ringCache.get(key);
  if (have) return have;
  const g = new THREE.TorusGeometry(1, minor, 8, 240);
  g.rotateX(-Math.PI / 2);
  ringCache.set(key, g);
  return g;
};

// ===================================================================================================================
// THE COST TICK (overlay: screen-px SVG pinned to the world)
// ===================================================================================================================
export type CostTickProps = {
  /** the rule's inner end, world [X, Y, Z] */
  at: V3;
  /** the rule's length along +X (m) */
  length: number;
  text: string;
  /** the label's font size in the world (m) */
  size?: number;
  /** 0..1 the entrance (slide up + fade + blur), drive linearly over ~12 f */
  enter?: number;
  /** an optional small caps line under the rule */
  sub?: string;
  subEnter?: number;
  /** its font size (m) */
  subSize?: number;
  /** where the type starts along the rule from `at` (m; 0 = at the rule's inner end) */
  inset?: number;
};
const entranceOf = (enter: number) => {
  const a = easeOutCubic(c01(enter));
  return { lift: (1 - a) * 24, opacity: a, blur: 6 * (1 - a) };
};
/** a soft brown halo under the tick's type: the golden-hour sky at its height is lighter than the stout ground, so
 *  the halo keeps cream type at >= 7:1 against what is right behind it */
const HALO = `drop-shadow(0 0 6px rgba(34,21,11,0.7)) drop-shadow(0 0 18px rgba(34,21,11,0.45))`;
export const CostTick: React.FC<CostTickProps> = ({ at, length, text, size = 330, enter = 1, sub, subEnter = 1, subSize = 120, inset = 0 }) => {
  const { cam } = useV();
  const p0 = airProject(cam, at);
  const p1 = airProject(cam, [at[0] + length, at[1], at[2]]);
  const pl = airProject(cam, [at[0] + inset, at[1], at[2]]);
  const s = p0.s;
  const fs = size * s;
  const e = entranceOf(enter);
  const es = entranceOf(subEnter);
  const ruleW = Math.max(1.5, 0.011 * size * s);
  const gap = 0.16 * fs;
  const subFs = subSize * s;
  // a broad soft shade of the sky behind the type (world-pinned, enters with the label): see HALO
  const sx = pl.x + 1.25 * fs;
  const sy = p0.y - 0.1 * fs;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id="vortexTickShade">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0.56" />
          <stop offset="0.55" stopColor={COLOR.shadow} stopOpacity="0.34" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0" />
        </radialGradient>
      </defs>
      {e.opacity > 0.002 ? <ellipse cx={f2(sx)} cy={f2(sy)} rx={f2(2.4 * fs)} ry={f2(1.5 * fs)} fill="url(#vortexTickShade)" opacity={f2(e.opacity)} /> : null}
      {e.opacity > 0.002 ? (
        <g opacity={f2(e.opacity)} transform={`translate(0 ${f2(e.lift)})`} style={{ filter: `${e.blur > 0.05 ? `blur(${f2(e.blur)}px) ` : ""}${HALO}` }}>
          <line x1={f2(p0.x)} y1={f2(p0.y)} x2={f2(p1.x)} y2={f2(p1.y)} stroke={COLOR.inkCream} strokeWidth={f2(ruleW)} strokeLinecap="butt" />
          <text
            x={f2(pl.x + 0.02 * fs)}
            y={f2(p0.y - gap)}
            fontFamily={FONT_NUM}
            fontWeight={700}
            fontSize={f2(fs)}
            letterSpacing={`${TRACK.numeral}em`}
            textAnchor="start"
            fill={COLOR.inkCream}
            style={{ fontFeatureSettings: '"lnum" 1' }}
          >
            {text}
          </text>
        </g>
      ) : null}
      {sub && es.opacity > 0.002 ? (
        <g opacity={f2(es.opacity)} transform={`translate(0 ${f2(es.lift)})`} style={{ filter: `${es.blur > 0.05 ? `blur(${f2(es.blur)}px) ` : ""}${HALO}` }}>
          <text
            x={f2(pl.x + 0.02 * fs)}
            y={f2(p0.y + gap * 0.9 + subFs * 0.72)}
            fontFamily={FONT_LABEL}
            fontWeight={500}
            fontSize={f2(subFs)}
            letterSpacing={`${TRACK.label}em`}
            textAnchor="start"
            fill={COLOR.inkCream}
            style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
          >
            {sub.toUpperCase()}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

// ===================================================================================================================
// CUT 10 (TenMillionForOneProof): its camera, its fill, its tick, its end state (cut 19 opens on CUT10_END)
// ===================================================================================================================
/** the ~$10M tick: at 78 % of the Navier-Stokes vortex's height, its rule touching the widest tube there */
export const NS_TICK = (() => {
  // the rule at 78 % of the height, touching the vortex's silhouette there (a level ON the flow, a cream crown above).
  // Looking up at the vortex, the near tubes at a level read a little above the axis at that level, so the front held
  // at 75 % sits visually on the rule, and its nudge to ~82 % reads as crossing it by ~7 %
  const h = 0.78;
  const ax = vortexAxis(NS_VORTEX, h);
  const r = vortexReach(NS_VORTEX, h);
  return { h, at: [ax[0] + r, ax[1], ax[2]] as V3, length: 1000, size: 360, text: "~$10M", sub: "Navier–Stokes", subSize: 132, inset: 0 };
})();
const PRE = 20;
// the camera keys, relative to the vortex's axis (X, Z) and in absolute altitude (Y)
const AX = NS_VORTEX.at;
const CUT10_START: SideCam = { mode: "side", x: AX[0] + 150, y: 3880, z: AX[2] - 2300, f: 1500, horizon: 800, pitch: -4 };
const CUT10_TRACK = airTrack(
  CUT10_START,
  [
    // already rising slowly at f0
    { f0: 0, f1: 40, to: { y: 3960 } },
    // on "cost" -> "million": rise with the front and ease back until the whole vortex is in shot
    { f0: PRE - 6, f1: PRE + 30, to: { x: AX[0], y: 4300, z: AX[2] - 5900, pitch: -14 } },
    // then a slow creep in to the end (and on into cut 19)
    { f0: PRE + 30, f1: PRE + 170, to: { z: AX[2] - 5600, y: 4350, pitch: -14.4 } },
  ],
  PRE + 160,
);
/** cut 10's camera at its frame f (fractional fine; -20 <= f <= 140) */
export const cut10Cam = (f: number): SideCam => airCamAt(CUT10_TRACK, f + PRE) as SideCam;
// v1's fill (held under the tick, nudged past on "a little more"): kept only because its f109 value is CUT10_END.fill,
// which cut 19 opens on, and that number must not move by a bit
const cut10FillV1 = (f: number) => {
  const c = 1 - Math.pow(1 - Math.pow(c01((f - 12) / 66), 1.1), 1.6);
  const toTick = lerp(0.07, NS_TICK.h - 0.012, c);
  const nudge = 0.07 * easeOutCubic(c01((f - 95) / 10));
  return f < 12 ? 0 : toTick + nudge;
};
const CUT10_FILL_END = cut10FillV1(109);
/** the front's level in cut 10 (rev 1): climbs from the base on "cost" (f13) straight to its final level just past the
 *  tick, settled by f80 (exactly CUT10_END.fill from f80 on); "a little more" is the shine now, not a nudge */
export const cut10Fill = (f: number) => {
  if (f < 12) return 0;
  if (f >= 80) return CUT10_FILL_END;
  // a near-linear climb with an eased start and a long deceleration into the final level
  const c = 1 - Math.pow(1 - Math.pow(c01((f - 12) / 68), 1.1), 1.6);
  return lerp(0.07, CUT10_FILL_END, c);
};
/** the shine's band (rev 1) on "Maybe a little more": one pass deck line -> crown, f96 -> f106, crossing the tick (0.78) on
 *  "more" (f103); undefined (off) outside it, so f107-f109 are the settled end */
export const cut10Shine = (f: number) => {
  if (f < 96 || f > 106) return undefined;
  // from the deck line (half the band still in the cloud on f96) to the tick on f103, then a touch quicker off the crown
  return f <= 103 ? lerp(0.04, NS_TICK.h, (f - 96) / 7) : NS_TICK.h + 0.12 * (f - 103);
};
/** the ~$10M tick's entrance (f21 -> f31: landed on "million", f31) and the NAVIER-STOKES line's (f39 -> f50: landed on "Navier") */
export const CUT10_TICK_ENTER = (f: number) => c01((f - 21) / 10);
export const CUT10_SUB_ENTER = (f: number) => c01((f - 39) / 11);
/** the level ring round the vortex at the tick's height: drawn out from the rule f21 -> f33 */
export const CUT10_RING_DRAW = (f: number) => sstep(0, 1, (f - 21) / 12);
/** cut 10's last frame (f109): cut 19 opens on exactly this (S continues: cut 19's S = CUT10_END.S + its frame) */
/** ADDED (real look): cut 10's vortex look (and so the look cut 19 opens on) */
export const CUT10_LOOK: VortexLook = "real";
/** ADDED (fill parts): cut 10's amber takes the core and middle helices only; the cyan arms stay cyan (cut 19 passes the same) */
export const CUT10_FILL_PARTS: VortexFillParts = "inner";
export const CUT10_END = { f: 109, S: 109, cam: cut10Cam(109), fill: CUT10_FILL_END } as const;
