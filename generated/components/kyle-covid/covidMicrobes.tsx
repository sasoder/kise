// ---------------------------------------------------------------------------
// covidMicrobes — THE CLIP'S MICROBES (kyle-covid, cuts 48 and 56). Dwarkesh 3D style (styles/dwarkesh-3d.md): soft
// lit volumes in the medium (the HugeWorldOfBacteria V3 "tubeAir / sphereAir" rendering carried to a parametric
// organism): lit from the upper left, a cream highlight on the lit edge, the mid tone, a soft core shadow, a little
// reflected air at the shade edge, a thin outline in a darker local tone, slightly translucent, fogged by distance.
// Harmless microbes are cream / ivory / oatmeal; `drain` sinks one to DEAD #8A7B62; THE VIRUS (the clip's one orange
// thing) is the crowned virion in ACCENT #FFB000 / ACCENT_DEEP #D98A0C with a cream rim (AirStage's bloom picks it out).
// Canvas 2D only (fast enough for ~100 drawn organisms a frame; hundreds more as baked sprites).
//
// UNITS: "u" (genome units): the default rod is 2.4 u long, 1 u thick; a virion ~1.2 u across + spikes. Draw at `px`
// screen px per unit (span(g) gives an organism's largest extent in u, so px = wantedPx / span(g)). Screen axes: x right,
// y down, z toward the viewer. The light comes from the upper left (and a little from the front).
//
// API (header = contract)
//   Genome   { len, girth, bend, taper, bulb, twist, coil, turns, spikes, spikeLen, club, tail, pili, dots, tone, seed }
//            len   axis length between the cap centres (0 = sphere; rod 1.4)        girth  radius (rod 0.5)
//            bend  total bend of the axis, rad (bean ~0.9, comma ~1.6)             taper  0..1 the rear end thins (comma)
//            bulb  0..1 a bulb at the front end                                    twist  an S-kink (rad)
//            coil  helix radius, u (corkscrew ~0.3); turns  helix turns along the axis
//            spikes  count, CONTINUOUS 0..40 (spike j grows in as spikes passes j; they never move when one is added)
//            spikeLen u; club 0..1 (0 thorns, 1 club tips: the crown)            tail  flagellum length, u (0 none)
//            pili  0..1 a fringe of fine hairs                                    dots  0..1 small bumps on the envelope
//            tone  -1 oatmeal .. 0 cream .. +1 ivory (the harmless microbes' small local variations)
//            seed  the organism's own phase (waves, spike lengths)
//   GENOMES  .sphere .rod .bean .comma .corkscrew .virion (+ .tailedRod .hairyRod .bulbRod .spikySphere .twisty)
//   mixGenome(a, b, t)          every field interpolates (spikes too): a daughter morphs smoothly from its parent
//   mutate(g, seed, amount, kind?)  a drifted copy: a spike sprouts, a tail grows, a body bends, a coil, a bulb,
//                               longer / plumper, hairier (kind picks one: "spikes" | "tail" | "bend" | "coil" | "bulb"
//                               | "len" | "girth" | "pili" | "twist" | "taper"); deterministic in seed
//   span(g)                     the largest extent, u (spikes and a straight tail included)
//
//   Rot      { yaw (in-plane, rad), pitch (tilt toward/away from the viewer), roll (about the body's own axis) }
//   wobble(frame, seed, amt=1) -> Rot & { wave }   alive: a slow tumble (yaw / pitch sway, a steady roll), wave = the
//                               phase that waves the pili and the flagellum (pass it to shapeOf)
//   swim(frame, seed, speed)  -> { along, lateral, yaw }  a swimmer's travel (u along its heading), its body wiggle (u)
//                               and heading wiggle (rad); constant speed, no easing
//
//   shapeOf(g, rot, wave)     -> Shape   the organism's geometry (u, centred on the origin, rotated): a chain of NS
//                               sphere-swept samples, spikes, pili, flagellum. Fixed-length arrays, so ...
//   lerpShape(a, b, t)          ... any two shapes interpolate (positions, radii, spikes, hairs, tail)
//   divide(t)                 -> { pinch, elong, gap, round, split }   the division timeline (t 0..1): 0..0.45 the body
//                               lengthens and a waist pinches to nothing (one body); 0.45 the split (no visible change);
//                               then the halves part (gap 0..1, eased out: they arrive at rest) and round off (round)
//   divisionShapes(g, gA, gB, rot, rotA, rotB, wave, t, gapU=0.8) -> { a, b, oa, ob }   the two halves at division time
//                               t (shapes centred on themselves) and their centres from the parent's centre (u, screen
//                               axes). Each half morphs into its daughter's own shapeOf(gA / gB) by t = 1; draw both
//                               halves in ONE drawMicrobe call with opts.whole = the returned `whole` (one outline
//                               pass and one body light while joined: no seam, no pop at the waist).
//
//   Look     { tone?, orange? 0..1, drain? 0..1, fog? 0..1, air? (#hex | RGB) }   orange takes half the fog (the one
//            glowing material); `air` is the medium the fog pulls toward (default the micro mid-water teal)
//   inkOf(look) -> Ink          the organism's colours
//   drawMicrobe(ctx, parts, px, ink, opts?)   parts: { s: Shape, x, y }[] (screen px centres); opts: { alpha?,
//                               orangeSpread?: { x, y, r, ink? } (screen px: the orange version shown inside a soft disk
//                               of radius r round the contact point: "it turns orange from where it touched") }
//                               Painter's order inside one organism: flagellum, back spikes and hairs, outline, body
//                               (per-segment soft form light), envelope dots, front spikes (club heads on the face).
//   <MicrobeCanvas draw />      a full-frame canvas layer whose draw(ctx) runs every frame (put it in <AirStage>)
//
// SWARM (hundreds of 8–40 px microbes that still read by silhouette: a sprite bake, the light baked at every angle)
//   SWARM_KINDS                 16 cream genomes (spheres, pairs-length rods, beans, commas, corkscrews, spiky, hairy)
//   bakeSwarm({ key, kinds?, span? = 56 (px the sprite's largest extent is baked at), angles? = 16, look?, pitch? })
//                            -> Swarm   synchronous canvas bake (call it at render time, inside draw); cached by key.
//                               Bodies only: the flagellum is drawn live by blitSwarm (it waves)
//   blitSwarm(ctx, sw, kind, x, y, spanPx, { yaw, wave?, alpha?, fog?, air? })   draw kind at (x, y) with its largest
//                               extent spanPx: the two nearest baked angles crossfaded (no pop as it turns), a fog veil
//                               in `air` by `fog`, the flagellum live
//
// SIZES THAT READ (probe sheet, MICROBES_READY.md): 200 px every detail (club heads, hairs, dots, the flagellum's
// wave); 60 px body shape, spikes and tail read clearly, hairs as a soft fringe; 20 px the silhouette (rod / sphere /
// comma / corkscrew / spiky) still reads, details merge. Below ~10 px use the swarm (or leave them out).
// DON'T: rotate a sprite through big angles by ctx.rotate (the light turns with it); draw daughters as two separate
// drawMicrobe calls before they have parted (a seam at the waist); switch genomes without mixGenome / lerpShape
// (pops); put anything but THE pathogen in orange.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";

export type V3 = [number, number, number];
export type RGB = [number, number, number];

// ---- small maths ------------------------------------------------------------------------------------------------
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const TAU = Math.PI * 2;
const v3 = (x: number, y: number, z: number): V3 => [x, y, z];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ---- colour ------------------------------------------------------------------------------------------------------
const hexRgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixR = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const css = (c: RGB) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
const cssA = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c01(a).toFixed(3)})`;

export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DEAD = "#8A7B62";
export const ORANGE_LINE = "#8A4A0E";
const CREAM = "#F3EBDD";
const SHADOW = "#22180F";
type MatR = { lit: RGB; mid: RGB; dark: RGB };
const matOf = (lit: string, mid: string, dark: string): MatR => ({ lit: hexRgb(lit), mid: hexRgb(mid), dark: hexRgb(dark) });
const mixMat = (a: MatR, b: MatR, t: number): MatR => ({ lit: mixR(a.lit, b.lit, t), mid: mixR(a.mid, b.mid, t), dark: mixR(a.dark, b.dark, t) });
/** the local colours before fog: the medium's cream organisms (pandemicAir AIR.A.body) and their variations */
export const MICROBE_MATS = {
  cream: matOf("#F3EBDD", "#D6CAAE", "#8E8470"),
  ivory: matOf("#F8F3E8", "#E0D8C5", "#999180"),
  oatmeal: matOf("#E8DABF", "#C8B793", "#867655"),
  dead: matOf("#A69A80", DEAD, "#4C4335"),
  orange: matOf(ACCENT, ACCENT_DEEP, "#9A5C07"),
};
/** the micro medium's middle water (the default fog target) */
export const MICRO_AIR = "#466C66";

export type Look = { tone?: number; orange?: number; drain?: number; fog?: number; air?: string | RGB };
export type Ink = {
  out: RGB;
  shade: RGB;
  deep: RGB;
  main: RGB;
  spec: RGB;
  refl: RGB;
  /** the strength of the highlight (falls with fog and death) */
  specA: number;
  /** the orange share (for the bloom and for callers) */
  orange: number;
};
export const inkOf = (look: Look = {}): Ink => {
  const tone = look.tone ?? 0;
  const o = c01(look.orange ?? 0);
  const dr = c01(look.drain ?? 0);
  const air: RGB = typeof look.air === "string" ? hexRgb(look.air) : (look.air ?? hexRgb(MICRO_AIR));
  const M = MICROBE_MATS;
  let m = tone >= 0 ? mixMat(M.cream, M.ivory, c01(tone)) : mixMat(M.cream, M.oatmeal, c01(-tone));
  m = mixMat(m, M.dead, dr);
  const sh = hexRgb(SHADOW);
  let out = mixR(m.dark, sh, 0.5);
  let shade = mixR(m.dark, sh, 0.15);
  let spec = mixR(hexRgb(CREAM), M.dead.lit, dr * 0.75);
  if (o > 0) {
    m = mixMat(m, M.orange, o);
    out = mixR(out, hexRgb(ORANGE_LINE), o);
    shade = mixR(shade, mixR(M.orange.dark, sh, 0.12), o);
    // the cream rim on the orange: a warm cream highlight on the lit edge
    spec = mixR(spec, mixR(hexRgb("#FFE7A8"), hexRgb(CREAM), 0.45), o);
  }
  const f = c01(look.fog ?? 0) * (1 - 0.5 * o);
  const fg = (c: RGB, k = 1) => mixR(c, air, f * k);
  return {
    out: fg(out),
    shade: fg(shade),
    deep: fg(m.mid),
    main: fg(m.lit),
    spec: fg(spec, 0.9),
    refl: fg(mixR(shade, air, 0.45)),
    specA: (1 - f) * (1 - 0.65 * dr),
    orange: o,
  };
};
const mixInk = (a: Ink, b: Ink, t: number): Ink => ({
  out: mixR(a.out, b.out, t),
  shade: mixR(a.shade, b.shade, t),
  deep: mixR(a.deep, b.deep, t),
  main: mixR(a.main, b.main, t),
  spec: mixR(a.spec, b.spec, t),
  refl: mixR(a.refl, b.refl, t),
  specA: lerp(a.specA, b.specA, t),
  orange: lerp(a.orange, b.orange, t),
});
export { mixInk };

// ===================================================================================================================
// THE GENOME
// ===================================================================================================================
export type Genome = {
  len: number;
  girth: number;
  bend: number;
  taper: number;
  bulb: number;
  twist: number;
  coil: number;
  turns: number;
  spikes: number;
  spikeLen: number;
  club: number;
  tail: number;
  pili: number;
  dots: number;
  tone: number;
  seed: number;
};
const G0: Genome = { len: 1.4, girth: 0.5, bend: 0, taper: 0, bulb: 0, twist: 0, coil: 0, turns: 3, spikes: 0, spikeLen: 0.3, club: 0, tail: 0, pili: 0, dots: 0, tone: 0, seed: 1 };
const G = (p: Partial<Genome>): Genome => ({ ...G0, ...p });
export const GENOMES = {
  sphere: G({ len: 0, girth: 0.6 }),
  rod: G({}),
  bean: G({ len: 1.25, girth: 0.56, bend: 0.95 }),
  comma: G({ len: 1.7, girth: 0.33, bend: 1.7, taper: 0.2, tail: 1.1 }),
  corkscrew: G({ len: 4.4, girth: 0.15, coil: 0.3, turns: 4 }),
  virion: G({ len: 0, girth: 0.6, spikes: 36, spikeLen: 0.25, club: 1, dots: 1 }),
  tailedRod: G({ len: 1.5, girth: 0.42, tail: 2.2 }),
  hairyRod: G({ len: 1.2, girth: 0.52, pili: 1 }),
  bulbRod: G({ len: 1.6, girth: 0.36, bulb: 0.8 }),
  spikySphere: G({ len: 0, girth: 0.55, spikes: 22, spikeLen: 0.3, club: 0 }),
  twisty: G({ len: 2.4, girth: 0.3, twist: 1.5, bend: 0.2 }),
};
export type GenomeName = keyof typeof GENOMES;
const KEYS = Object.keys(G0) as (keyof Genome)[];
export const mixGenome = (a: Genome, b: Genome, t: number): Genome => {
  const out = { ...a };
  for (const k of KEYS) out[k] = lerp(a[k], b[k], t);
  return out;
};
export type MutationKind = "spikes" | "tail" | "bend" | "coil" | "bulb" | "len" | "girth" | "pili" | "twist" | "taper";
const MUTATIONS: MutationKind[] = ["spikes", "tail", "bend", "coil", "bulb", "len", "girth", "pili", "twist", "taper"];
/** a drifted copy of g (deterministic in seed): one trait moves by `amount` (0..1, 1 = a big jump), tone drifts a bit */
export const mutate = (g: Genome, seed: number, amount = 0.5, kind?: MutationKind): Genome => {
  const r = (k: number) => hash01(seed * 13.17 + k * 7.31);
  const kd = kind ?? MUTATIONS[Math.floor(r(1) * MUTATIONS.length) % MUTATIONS.length];
  const a = amount;
  const n = { ...g, seed: g.seed + 0.37 + r(2), tone: Math.max(-1, Math.min(1, g.tone + (r(3) - 0.5) * 0.5 * a)) };
  const sgn = r(4) < 0.5 ? -1 : 1;
  switch (kd) {
    case "spikes":
      n.spikes = Math.min(40, g.spikes + 4 + 14 * a * r(5));
      n.spikeLen = Math.min(0.5, Math.max(0.2, g.spikeLen + (r(6) - 0.3) * 0.12 * a));
      n.club = c01(g.club + (r(7) - 0.4) * 0.8 * a);
      break;
    case "tail":
      n.tail = g.tail + (g.tail > 1.8 ? -0.6 : 0.6 + 1.4 * a * r(5));
      break;
    case "bend":
      n.bend = g.bend + sgn * (0.4 + 0.9 * a * r(5));
      n.len = Math.max(g.len, 0.6);
      break;
    case "coil":
      n.coil = Math.min(0.36, g.coil + 0.12 + 0.2 * a * r(5));
      n.girth = Math.max(0.12, Math.min(0.17, g.girth * (0.45 - 0.15 * a)));
      n.spikes = Math.min(g.spikes, 6);
      n.bulb = 0;
      n.len = Math.min(3.6, g.len + 0.4 + 0.9 * a);
      n.turns = 3 + Math.round(r(6) * 2);
      break;
    case "bulb":
      n.bulb = Math.min(0.62, g.bulb + 0.35 + 0.3 * a * r(5));
      n.len = Math.max(g.len, 0.9);
      break;
    case "len":
      n.len = Math.max(0, Math.min(3.2, g.len + sgn * (0.4 + 0.9 * a * r(5))));
      break;
    case "girth":
      n.girth = Math.max(0.22, Math.min(0.72, g.girth + sgn * (0.06 + 0.16 * a * r(5))));
      break;
    case "pili":
      n.pili = c01(g.pili + (g.pili > 0.6 ? -0.5 : 0.5 + 0.4 * a));
      break;
    case "twist":
      n.twist = g.twist + sgn * (0.4 + 0.7 * a * r(5));
      n.len = Math.max(g.len, 1.2);
      break;
    case "taper":
      n.taper = c01(g.taper + 0.3 + 0.5 * a * r(5));
      n.len = Math.max(g.len, 1);
      break;
  }
  return n;
};
/** the largest extent (u): body, spikes, a straight tail */
export const span = (g: Genome) => {
  const bodyL = g.len * (1 - 0.08 * Math.min(1, Math.abs(g.bend))) + 2 * g.girth * (1 + 0.6 * g.bulb) + 2 * g.coil;
  const sp = c01(g.spikes) * 2 * (g.spikeLen + 0.09 * g.club);
  return Math.max(bodyL + sp, 2 * g.girth + sp) + 0.85 * g.tail;
};

// ===================================================================================================================
// POSE AND MOTION
// ===================================================================================================================
export type Rot = { yaw: number; pitch: number; roll: number };
type M3 = [number, number, number, number, number, number, number, number, number];
const rotM = (r: Rot): M3 => {
  const cy = Math.cos(r.yaw);
  const sy = Math.sin(r.yaw);
  const cp = Math.cos(r.pitch);
  const sp = Math.sin(r.pitch);
  const cr = Math.cos(r.roll);
  const sr = Math.sin(r.roll);
  // Rz(yaw) * Ry(pitch) * Rx(roll); x = the body's axis
  const a: M3 = [cp, sp * sr, sp * cr, 0, cr, -sr, -sp, cp * sr, cp * cr];
  return [cy * a[0] - sy * a[3], cy * a[1] - sy * a[4], cy * a[2] - sy * a[5], sy * a[0] + cy * a[3], sy * a[1] + cy * a[4], sy * a[2] + cy * a[5], a[6], a[7], a[8]];
};
const ap = (m: M3, p: V3): V3 => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2], m[3] * p[0] + m[4] * p[1] + m[5] * p[2], m[6] * p[0] + m[7] * p[1] + m[8] * p[2]];

/** alive: a slow tumble and a steady roll; `wave` waves the hairs and the flagellum */
export const wobble = (frame: number, seed: number, amt = 1): Rot & { wave: number } => {
  const s = seed * 3.7;
  return {
    yaw: amt * (0.13 * Math.sin(frame * 0.041 + s) + 0.05 * Math.sin(frame * 0.093 + s * 1.9)),
    pitch: amt * (0.32 * Math.sin(frame * 0.033 + s * 1.3) + 0.08 * Math.sin(frame * 0.071 + s * 0.7)),
    roll: amt * (frame * 0.022 * (hash01(seed) < 0.5 ? -1 : 1) + s),
    wave: frame * 0.21 + s,
  };
};
/** a swimmer: travel along its heading at constant speed (u per frame), a lateral body wiggle and a heading wiggle */
export const swim = (frame: number, seed: number, speed: number) => ({
  along: speed * frame,
  lateral: 0.06 * Math.sin(frame * 0.17 + seed * 5.1),
  yaw: 0.07 * Math.sin(frame * 0.17 + seed * 5.1 + 1.2),
});

// ===================================================================================================================
// THE SHAPE
// ===================================================================================================================
/** samples along the axis (fixed, so any two shapes interpolate) */
export const NS = 49;
const MAXS = 40;
const MAXP = 64;
const NT = 18;
const MAXD = 36;
export type Spike = { u: number; b: V3; d: V3; len: number; club: number; g: number };
export type Hair = { u: number; b: V3; d: V3; len: number; c: V3; g: number };
export type Shape = {
  pts: V3[];
  rad: number[];
  spikes: Spike[];
  hairs: Hair[];
  tail: V3[];
  tailG: number;
  dots: { u: number; b: V3; n: V3; g: number }[];
};
/** directions spread over the sphere, ordered so that the first k are always well spread (greedy farthest point) */
const spreadDirs = (n: number, seed: number): V3[] => {
  const raw: V3[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963 + seed;
    raw.push([y, Math.cos(th) * r, Math.sin(th) * r]);
  }
  const out: V3[] = [];
  const used = new Array(n).fill(false);
  // start near the "top" of the body (screen up when unrotated) so the first spikes of a sprouting form are visible
  let best = 0;
  let bv = Infinity;
  raw.forEach((p, i) => {
    const v = p[1] + Math.abs(p[0]) * 0.3;
    if (v < bv) {
      bv = v;
      best = i;
    }
  });
  for (let k = 0; k < n; k++) {
    used[best] = true;
    out.push(raw[best]);
    let far = -1;
    let fd = -1;
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      let dmin = Infinity;
      for (const q of out) dmin = Math.min(dmin, (q[0] - raw[i][0]) ** 2 + (q[1] - raw[i][1]) ** 2 + (q[2] - raw[i][2]) ** 2);
      if (dmin > fd) {
        fd = dmin;
        far = i;
      }
    }
    best = far;
  }
  return out;
};
const SPIKE_DIRS = spreadDirs(MAXS, 0.3);
const HAIR_DIRS = spreadDirs(MAXP, 1.7);
const DOT_DIRS = spreadDirs(MAXD, 2.9);

type Frame0 = { c: V3[]; T: V3[]; N: V3[]; r: number[] };
const chainOf = (g: Genome): Frame0 => {
  const n = NS;
  const phi = (u: number) => g.bend * (u - 0.5) + g.twist * 0.9 * Math.sin(TAU * (u - 0.5));
  const xs: number[] = [0];
  const ys: number[] = [0];
  const step = g.len / (n - 1);
  for (let i = 1; i < n; i++) {
    const um = (i - 0.5) / (n - 1);
    const a = phi(um);
    xs.push(xs[i - 1] + Math.cos(a) * step);
    ys.push(ys[i - 1] + Math.sin(a) * step);
  }
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += xs[i];
    my += ys[i];
  }
  mx /= n;
  my /= n;
  const c: V3[] = [];
  const T: V3[] = [];
  const N: V3[] = [];
  const r: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const a = phi(u);
    const t: V3 = [Math.cos(a), Math.sin(a), 0];
    const nn: V3 = [-Math.sin(a), Math.cos(a), 0];
    const ps = TAU * g.turns * u + g.seed;
    const co = g.coil;
    c.push([xs[i] - mx + co * nn[0] * Math.cos(ps), ys[i] - my + co * nn[1] * Math.cos(ps), co * Math.sin(ps)]);
    T.push(t);
    N.push(nn);
    const rr = g.girth * (1 - 0.7 * g.taper * (1 - u) * (1 - u)) * (1 + 0.85 * g.bulb * Math.exp(-(((u - 1) / 0.2) ** 2)));
    r.push(rr);
  }
  return { c, T, N, r };
};
const at = <T,>(arr: T[], u: number, f: (a: T, b: T, t: number) => T) => {
  const x = c01(u) * (arr.length - 1);
  const i = Math.min(arr.length - 2, Math.floor(x));
  return f(arr[i], arr[i + 1], x - i);
};
/** a point on the body's surface for a direction d of the unit sphere (x = along the axis): the base and the normal */
const surfaceAt = (F: Frame0, d: V3) => {
  const u = (d[0] + 1) / 2;
  const c = at(F.c, u, lerp3);
  const T = at(F.T, u, lerp3);
  const Nn = at(F.N, u, lerp3);
  const r = at(F.r, u, lerp);
  const n = norm(add(add(mul(T, d[0]), mul(Nn, d[1])), v3(0, 0, d[2])));
  return { u, b: add(c, mul(n, r * 0.94)), n, T };
};
/** the flagellum: from the rear cap, trailing back along the axis with a travelling helical wave */
const tailPts = (F: Frame0, g: Genome, R: M3, wave: number) => {
  const T0 = F.T[0];
  const N0 = F.N[0];
  const base = sub(F.c[0], mul(T0, F.r[0] * 0.9));
  const tail: V3[] = [];
  const amp = 0.09 + 0.05 * Math.min(2, g.tail);
  for (let k = 0; k < NT; k++) {
    const t = k / (NT - 1);
    const ph = 7.5 * t - wave * 1.6 + g.seed;
    const a = amp * Math.min(1, t * 3.2) * c01(g.tail / 0.4);
    const p = add(add(sub(base, mul(T0, g.tail * t)), mul(N0, a * Math.sin(ph))), v3(0, 0, a * 0.7 * Math.cos(ph)));
    tail.push(ap(R, p));
  }
  return tail;
};
/** only the flagellum (the swarm draws it live) */
export const tailOf = (g: Genome, rot: Rot, wave = 0) => tailPts(chainOf(g), g, rotM(rot), wave);
export const shapeOf = (g: Genome, rot: Rot, wave = 0): Shape => {
  const F = chainOf(g);
  const R = rotM(rot);
  const pts = F.c.map((p) => ap(R, p));
  const spikes: Spike[] = SPIKE_DIRS.map((d, j) => {
    const gr = c01(g.spikes - j);
    const s = surfaceAt(F, d);
    const lj = g.spikeLen * (0.88 + 0.24 * hash01(j * 3.1 + Math.floor(g.seed)));
    return { u: s.u, b: ap(R, s.b), d: ap(R, s.n), len: lj * gr, club: 0.095 * g.club * Math.sqrt(gr), g: gr };
  });
  const hairs: Hair[] = HAIR_DIRS.map((d, j) => {
    const gr = c01(g.pili * MAXP - j);
    const s = surfaceAt(F, d);
    const side = norm(cross(s.n, s.T));
    const curl = mul(side, 0.05 * Math.sin(wave * 0.8 + j * 1.9));
    return { u: s.u, b: ap(R, s.b), d: ap(R, s.n), len: (0.17 + 0.1 * hash01(j + 7.7)) * gr, c: ap(R, curl), g: gr };
  });
  const dots = DOT_DIRS.map((d, j) => {
    const s = surfaceAt(F, d);
    return { u: s.u, b: ap(R, add(s.b, mul(s.n, 0.03))), n: ap(R, s.n), g: c01(g.dots * MAXD - j) };
  });
  const tail = tailPts(F, g, R, wave);
  return { pts, rad: F.r, spikes, hairs, tail, tailG: c01(g.tail / 0.25), dots };
};
export const lerpShape = (a: Shape, b: Shape, t: number): Shape => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    pts: a.pts.map((p, i) => lerp3(p, b.pts[i], t)),
    rad: a.rad.map((r, i) => lerp(r, b.rad[i], t)),
    spikes: a.spikes.map((s, i) => {
      const q = b.spikes[i];
      return { u: lerp(s.u, q.u, t), b: lerp3(s.b, q.b, t), d: norm(lerp3(s.d, q.d, t)), len: lerp(s.len, q.len, t), club: lerp(s.club, q.club, t), g: lerp(s.g, q.g, t) };
    }),
    hairs: a.hairs.map((s, i) => {
      const q = b.hairs[i];
      return { u: lerp(s.u, q.u, t), b: lerp3(s.b, q.b, t), d: norm(lerp3(s.d, q.d, t)), len: lerp(s.len, q.len, t), c: lerp3(s.c, q.c, t), g: lerp(s.g, q.g, t) };
    }),
    tail: a.tail.map((p, i) => lerp3(p, b.tail[i], t)),
    tailG: lerp(a.tailG, b.tailG, t),
    dots: a.dots.map((d, i) => ({ u: lerp(d.u, b.dots[i].u, t), b: lerp3(d.b, b.dots[i].b, t), n: norm(lerp3(d.n, b.dots[i].n, t)), g: lerp(d.g, b.dots[i].g, t) })),
  };
};
const moveShape = (s: Shape, o: V3): Shape => ({
  pts: s.pts.map((p) => add(p, o)),
  rad: s.rad,
  spikes: s.spikes.map((q) => ({ ...q, b: add(q.b, o) })),
  hairs: s.hairs.map((q) => ({ ...q, b: add(q.b, o) })),
  tail: s.tail.map((p) => add(p, o)),
  tailG: s.tailG,
  dots: s.dots.map((q) => ({ ...q, b: add(q.b, o) })),
});

// ===================================================================================================================
// DIVISION
// ===================================================================================================================
const PINCH_END = 0.45;
export const divide = (t: number) => {
  const tp = c01(t / PINCH_END);
  const ts = c01((t - PINCH_END) / (1 - PINCH_END));
  const e = tp * tp * (3 - 2 * tp);
  return {
    pinch: e,
    elong: e,
    // the halves part and arrive at rest (ease out)
    gap: 1 - (1 - ts) * (1 - ts) * (1 - ts),
    round: sstep(0, 0.85, ts),
    split: t >= PINCH_END,
  };
};
/** a sub-chain [ua, ub] of a shape, resampled to NS samples, with the spikes / hairs / dots / tail on that half; what
 *  sits at the waist retracts with the pinch (nothing hangs in the air, nothing pops: at pinch 0 the two halves are the
 *  whole organism exactly) */
const halfOf = (s: Shape, side: 0 | 1, ua: number, ub: number, pinch: number): Shape => {
  const pts: V3[] = [];
  const rad: number[] = [];
  for (let k = 0; k < NS; k++) {
    const u = ua + ((ub - ua) * k) / (NS - 1);
    pts.push(at(s.pts, u, lerp3));
    rad.push(at(s.rad, u, lerp));
  }
  const mine = (u: number) => (side === 0 ? u < 0.5 : u >= 0.5);
  const waist = (u: number) => 1 - pinch * Math.exp(-(((u - 0.5) / 0.16) ** 2));
  return {
    pts,
    rad,
    spikes: s.spikes.map((q) => (mine(q.u) ? { ...q, len: q.len * waist(q.u), club: q.club * waist(q.u) } : { ...q, g: 0, len: 0, club: 0 })),
    hairs: s.hairs.map((q) => (mine(q.u) ? { ...q, g: q.g * waist(q.u) } : { ...q, g: 0 })),
    tail: side === 0 ? s.tail : s.tail.map(() => pts[0]),
    tailG: side === 0 ? s.tailG : 0,
    dots: s.dots.map((q) => (mine(q.u) ? { ...q, g: q.g * waist(q.u) } : { ...q, g: 0 })),
  };
};
const centroid = (s: Shape): V3 => {
  let c: V3 = [0, 0, 0];
  s.pts.forEach((p) => (c = add(c, p)));
  return mul(c, 1 / s.pts.length);
};
/** the division at t (0..1) of g into gA (the rear half) and gB (the front half) */
export const divisionShapes = (g: Genome, gA: Genome, gB: Genome, rot: Rot, rotA: Rot, rotB: Rot, wave: number, t: number, gapU = 0.8) => {
  const d = divide(t);
  // the parent lengthens (a sphere becomes a peanut, its length reaching 2 r) and pinches: each half is the parent's
  // chain up to a round end of the full radius whose centre lies r * pinch from the waist, so the two ends overlap
  // (one body) and just touch at pinch 1: a clean waist, no pointed ends at the split
  const gP = { ...g, len: g.len * (1 + 0.45 * d.elong) + 2 * g.girth * d.elong };
  const P = shapeOf(gP, rot, wave);
  const rw = at(P.rad, 0.5, lerp);
  const cu = gP.len > 1e-6 ? Math.min(0.5, (rw * d.pinch) / gP.len) : 0;
  const hA = halfOf(P, 0, 0, 0.5 - cu, d.pinch);
  const hB = halfOf(P, 1, 0.5 + cu, 1, d.pinch);
  const cA = centroid(hA);
  const cB = centroid(hB);
  // the parting direction: along the axis at the waist
  const ax = norm(sub(at(P.pts, 0.53, lerp3), at(P.pts, 0.47, lerp3)));
  const sep = (gapU * d.gap) / 2;
  const sA = moveShape(hA, mul(cA, -1));
  const sB = moveShape(hB, mul(cB, -1));
  const w = d.round;
  return {
    a: lerpShape(sA, shapeOf(gA, rotA, wave), w),
    b: lerpShape(sB, shapeOf(gB, rotB, wave), w),
    oa: add(cA, mul(ax, -sep)),
    ob: add(cB, mul(ax, sep)),
    /** pass as drawMicrobe opts.whole: the halves light as one body until they part */
    whole: 1 - w,
  };
};

// ===================================================================================================================
// DRAWING
// ===================================================================================================================
const LX = -0.55;
const LY = -0.835;
const L3 = norm([-0.5, -0.72, 0.48]);
export type Part = { s: Shape; x: number; y: number };
type SP = { x: number; y: number; r: number; z: number };

/** the convex hull of two circles, oriented the same way for every pair (so a union of them fills by nonzero) */
const capsule = (path: Path2D, ax: number, ay: number, ar: number, bx: number, by: number, br: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.hypot(dx, dy);
  if (d <= Math.abs(ar - br) + 1e-4) {
    const big = ar >= br;
    const cx = big ? ax : bx;
    const cy = big ? ay : by;
    const r = Math.max(0.01, big ? ar : br);
    path.moveTo(cx + r, cy);
    path.arc(cx, cy, r, 0, TAU, false);
    path.closePath();
    return;
  }
  const th = Math.atan2(dy, dx);
  const al = Math.acos(Math.max(-1, Math.min(1, (ar - br) / d)));
  path.moveTo(ax + ar * Math.cos(th + al), ay + ar * Math.sin(th + al));
  path.arc(ax, ay, Math.max(0.01, ar), th + al, th - al + TAU, false);
  path.arc(bx, by, Math.max(0.01, br), th - al, th + al, false);
  path.closePath();
};
const chainPath = (sp: SP[], grow: number) => {
  const p = new Path2D();
  for (let i = 0; i < sp.length - 1; i++) capsule(p, sp[i].x, sp[i].y, sp[i].r + grow, sp[i + 1].x, sp[i + 1].y, sp[i + 1].r + grow);
  if (sp.length === 1) capsule(p, sp[0].x, sp[0].y, sp[0].r + grow, sp[0].x, sp[0].y, sp[0].r + grow);
  return p;
};
/** a small lit club head: an ellipse r across, r * squash along the spike (angle ang), lit like a small sphere */
const ball = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ink: Ink, ow: number, a: number, ang = 0, squash = 1) => {
  if (r < 0.6) {
    ctx.globalAlpha = a * Math.min(1, r + 0.4);
    ctx.fillStyle = css(ink.deep);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.45, r), 0, TAU);
    ctx.fill();
    return;
  }
  const ra = r * squash;
  ctx.globalAlpha = a * 0.9;
  ctx.fillStyle = css(ink.out);
  ctx.beginPath();
  ctx.ellipse(x, y, ra + ow, r + ow, ang, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(x + LX * r * 0.42, y + LY * r * 0.42, 0, x + LX * r * 0.1, y + LY * r * 0.1, r * 1.1);
  g.addColorStop(0, cssA(mixR(ink.main, ink.spec, ink.specA), 1));
  g.addColorStop(0.3, css(ink.main));
  g.addColorStop(0.68, css(ink.deep));
  g.addColorStop(1, css(ink.shade));
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, ra, r, ang, 0, TAU);
  ctx.fill();
};
type SpikeS = { bx: number; by: number; tx: number; ty: number; w: number; cr: number; z: number; dz: number; g: number };
const spikeScreen = (q: Spike, x: number, y: number, px: number): SpikeS => {
  const tip = add(q.b, mul(q.d, q.len));
  return { bx: x + q.b[0] * px, by: y + q.b[1] * px, tx: x + tip[0] * px, ty: y + tip[1] * px, w: Math.max(0.6, 0.075 * px * Math.sqrt(q.g)), cr: q.club * px, z: q.b[2], dz: q.d[2], g: q.g };
};
/** a spike: a club (a short stalk, a lit ball) or a thorn (a cone to a point). front: the pass over the body (spikes
 *  facing the viewer: the stalk fades as it foreshortens, the club head stays; thorns facing the viewer stay behind) */
const drawSpike = (ctx: CanvasRenderingContext2D, s: SpikeS, ink: Ink, ow: number, a0: number, front: boolean) => {
  if (s.g < 0.01) return;
  const club = c01(s.cr / Math.max(0.5, s.w * 0.9));
  let a = a0;
  if (front) a *= sstep(0.02, 0.34, s.dz) * (club > 0.4 ? 1 : 1 - sstep(0.2, 0.5, s.dz));
  if (a < 0.01) return;
  const sl = Math.hypot(s.tx - s.bx, s.ty - s.by);
  const stalkA = front ? c01((sl - 0.6 * s.w) / (1.6 * s.w)) : 1;
  ctx.lineCap = "round";
  if (sl > 0.4 && stalkA > 0.01) {
    // the stalk: outline, then the body (a club's stalk narrows a little under its head; a thorn tapers to a point)
    const wB = club > 0.4 ? s.w * 0.62 : s.w * 1.15;
    const wTip = club > 0.4 ? s.w * 0.5 : Math.max(0.35, s.w * 0.12);
    const nx = (-(s.ty - s.by) / sl) * 0.5;
    const ny = ((s.tx - s.bx) / sl) * 0.5;
    const quad = (k: number) => {
      ctx.beginPath();
      ctx.moveTo(s.bx + nx * (wB + k), s.by + ny * (wB + k));
      ctx.lineTo(s.tx + nx * (wTip + k), s.ty + ny * (wTip + k));
      ctx.lineTo(s.tx - nx * (wTip + k), s.ty - ny * (wTip + k));
      ctx.lineTo(s.bx - nx * (wB + k), s.by - ny * (wB + k));
      ctx.closePath();
    };
    ctx.globalAlpha = a * stalkA * 0.9;
    ctx.fillStyle = css(ink.out);
    quad(ow * 2);
    ctx.fill();
    ctx.globalAlpha = a * stalkA;
    // lit on the side toward the light
    const lit = nx * LX + ny * LY > 0 ? 1 : -1;
    const gs = ctx.createLinearGradient(s.bx + nx * wB * lit, s.by + ny * wB * lit, s.bx - nx * wB * lit, s.by - ny * wB * lit);
    gs.addColorStop(0, css(ink.main));
    gs.addColorStop(0.55, css(ink.deep));
    gs.addColorStop(1, css(ink.shade));
    ctx.fillStyle = gs;
    quad(0);
    ctx.fill();
  }
  if (s.cr > 0.3) {
    // the club sits a little past the stalk's end, flattened along the spike as the spike lies across the view
    const ang = Math.atan2(s.ty - s.by, s.tx - s.bx);
    const side = c01(sl / Math.max(0.5, s.cr * 2.4));
    ball(ctx, s.tx, s.ty, s.cr, ink, ow, a, ang, lerp(1, 0.72, side));
  }
};

export type DrawOpts = { alpha?: number; whole?: number; orangeSpread?: { x: number; y: number; r: number; ink?: Ink } };
/** one organism (one or more parts sharing one outline pass) at px screen px per unit */
export const drawMicrobe = (ctx: CanvasRenderingContext2D, parts: Part[], px: number, ink: Ink, opts: DrawOpts = {}) => {
  const os = opts.orangeSpread;
  if (os && os.r > 0.5) {
    drawMicrobeInner(ctx, parts, px, ink, opts.alpha ?? 1, opts.whole ?? 0);
    // the orange version on a layer, kept inside a soft disk round the contact point, laid over the cream one
    const L = layerCanvas(ctx.canvas.width, ctx.canvas.height);
    const lc = L.getContext("2d") as CanvasRenderingContext2D;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.globalCompositeOperation = "source-over";
    lc.globalAlpha = 1;
    lc.clearRect(0, 0, L.width, L.height);
    drawMicrobeInner(lc, parts, px, os.ink ?? inkOf({ orange: 1 }), opts.alpha ?? 1, opts.whole ?? 0);
    lc.globalCompositeOperation = "destination-in";
    lc.globalAlpha = 1;
    const g = lc.createRadialGradient(os.x, os.y, 0, os.x, os.y, os.r);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.62, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    lc.fillStyle = g;
    lc.fillRect(0, 0, L.width, L.height);
    lc.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(L, 0, 0);
    ctx.restore();
    return;
  }
  drawMicrobeInner(ctx, parts, px, ink, opts.alpha ?? 1, opts.whole ?? 0);
};
let LAYER: HTMLCanvasElement | null = null;
const layerCanvas = (w: number, h: number) => {
  if (!LAYER) LAYER = document.createElement("canvas");
  if (LAYER.width !== w || LAYER.height !== h) {
    LAYER.width = w;
    LAYER.height = h;
  }
  return LAYER;
};
const drawMicrobeInner = (ctx: CanvasRenderingContext2D, parts: Part[], px: number, ink: Ink, alpha: number, whole: number) => {
  ctx.save();
  const chains = parts.map(({ s, x, y }) => s.pts.map((p, i): SP => ({ x: x + p[0] * px, y: y + p[1] * px, r: Math.max(0.35, s.rad[i] * px), z: p[2] * px })));
  let rmax = 0;
  chains.forEach((c) => c.forEach((q) => (rmax = Math.max(rmax, q.r))));
  const big = rmax * 2;
  const ow = Math.max(0.55, Math.min(1.7, 0.035 * big + 0.4));
  const spikes: SpikeS[] = [];
  parts.forEach(({ s, x, y }) => s.spikes.forEach((q) => q.g > 0.01 && spikes.push(spikeScreen(q, x, y, px))));
  const outsideBody = new Path2D();
  outsideBody.rect(-1e4, -1e4, 2e4, 2e4);
  chains.forEach((c) => outsideBody.addPath(chainPath(c, 0)));
  ctx.save();
  ctx.clip(outsideBody, "evenodd");
  // 1. behind the body: the flagellum, the hairs, the spikes (those facing the viewer are drawn again in front)
  parts.forEach(({ s, x, y }) => {
    if (s.tailG < 0.01) return;
    const pts = s.tail.map((p) => [x + p[0] * px, y + p[1] * px]);
    const w = Math.max(0.6, 0.05 * px);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const stroke = (wd: number, col: RGB, a: number) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.lineWidth = wd;
      ctx.strokeStyle = css(col);
      ctx.globalAlpha = a;
      ctx.stroke();
    };
    stroke(w + 2 * ow * 0.8, ink.out, 0.75 * alpha * s.tailG);
    stroke(w, ink.deep, alpha * s.tailG);
  });
  parts.forEach(({ s, x, y }) => {
    let hairA = 0;
    s.hairs.forEach((h) => (hairA = Math.max(hairA, h.g)));
    if (hairA < 0.01) return;
    // hairs read as a soft fringe: thin, faint, fading in with the screen size (no noise at small sizes)
    const sz = c01((px * 0.2 - 1.2) / 2.5);
    if (sz < 0.01) return;
    ctx.beginPath();
    s.hairs.forEach((h) => {
      if (h.g < 0.02) return;
      const b = [x + h.b[0] * px, y + h.b[1] * px];
      const m = add(add(h.b, mul(h.d, h.len * 0.55)), h.c);
      const e = add(add(h.b, mul(h.d, h.len)), mul(h.c, 1.8));
      ctx.moveTo(b[0], b[1]);
      ctx.quadraticCurveTo(x + m[0] * px, y + m[1] * px, x + e[0] * px, y + e[1] * px);
    });
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(0.55, Math.min(1.5, 0.024 * px));
    ctx.strokeStyle = css(mixR(ink.deep, ink.shade, 0.55));
    ctx.globalAlpha = 0.8 * alpha * sz;
    ctx.stroke();
  });
  spikes.sort((a, b) => a.z - b.z);
  spikes.forEach((s) => drawSpike(ctx, s, ink, ow, alpha, false));
  ctx.restore();
  // 2. the outline: the union silhouette, dilated
  const outline = new Path2D();
  const sils = chains.map((c) => chainPath(c, 0));
  const silAll = new Path2D();
  chains.forEach((c, i) => {
    outline.addPath(chainPath(c, ow));
    silAll.addPath(sils[i]);
  });
  ctx.globalAlpha = 0.88 * alpha;
  ctx.fillStyle = css(ink.out);
  ctx.fill(outline, "nonzero");
  // 3. the body, each part clipped to its own silhouette: a mid base, soft form light across each piece of the axis
  //    (far to near), then a sphere's radial light at the near end where the body points at the viewer or is short
  const stops = (k: number): [number, RGB][] => {
    // k 0..1: how clearly the light falls across this piece (0: along it or end on: an even mid)
    const ev = (c: RGB) => mixR(ink.deep, c, k);
    return [
      [0, ev(mixR(ink.main, ink.spec, ink.specA))],
      [0.12, ev(ink.main)],
      [0.44, ink.deep],
      [0.8, ev(ink.shade)],
      [1, ev(ink.refl)],
    ];
  };
  const order = chains.map((c, i) => ({ i, z: c.reduce((a, q) => a + q.z, 0) / c.length })).sort((a, b) => a.z - b.z);
  // the radial light of a chain (its near end, or its middle when short); `w` its strength
  const discOf = (c: SP[]) => {
    let L3 = 0;
    let Lp = 0;
    let rr = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < c.length; i++) {
      rr = Math.max(rr, c[i].r);
      cx += c[i].x;
      cy += c[i].y;
      if (i > 0) {
        L3 += Math.hypot(c[i].x - c[i - 1].x, c[i].y - c[i - 1].y, c[i].z - c[i - 1].z);
        Lp += Math.hypot(c[i].x - c[i - 1].x, c[i].y - c[i - 1].y);
      }
    }
    cx /= c.length;
    cy /= c.length;
    const a = c[0];
    const b = c[c.length - 1];
    const tilt = L3 > 0.5 ? c01(Math.abs(b.z - a.z) / L3) : 1;
    const short = c01(1.25 - L3 / (2 * rr * 0.9));
    const ne = b.z >= a.z ? b : a;
    const ex = lerp(ne.x, cx, short);
    const ey = lerp(ne.y, cy, short);
    const R = lerp(ne.r, rr + Lp / 2, short);
    return { x: ex, y: ey, R, w: Math.max(tilt * tilt, short), short };
  };
  const disc = (d: { x: number; y: number; R: number; w: number; short: number }, a: number) => {
    if (d.w * a < 0.005) return;
    // a whole sphere keeps its rim to the edge; a capsule's end cap fades out where the body continues
    const g = ctx.createRadialGradient(d.x + LX * d.R * 0.42, d.y + LY * d.R * 0.42, 0, d.x + LX * d.R * 0.12, d.y + LY * d.R * 0.12, d.R * 1.12);
    // (a capsule's end cap seen end on is a soft light that melts into the body: no ring)
    g.addColorStop(0, cssA(mixR(ink.main, ink.spec, ink.specA), 1));
    g.addColorStop(0.16, cssA(ink.main, lerp(0.8, 1, d.short)));
    g.addColorStop(0.5, cssA(ink.deep, lerp(0.35, 1, d.short)));
    g.addColorStop(0.84, cssA(ink.shade, lerp(0.05, 1, d.short)));
    g.addColorStop(1, cssA(ink.refl, d.short));
    ctx.globalAlpha = 0.94 * alpha * d.w * a;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.R * 1.25, 0, TAU);
    ctx.fill();
  };
  type Seg = { c: SP[]; i0: number; i1: number; z: number };
  const segsOf = (c: SP[]) => {
    const out: Seg[] = [];
    if (c.length < 2) return out;
    let L = 0;
    for (let i = 0; i < c.length - 1; i++) L += Math.hypot(c[i + 1].x - c[i].x, c[i + 1].y - c[i].y);
    // a short chain (on screen) gets few strokes: the form light changes slowly along it
    const stride = Math.max(1, Math.min(8, Math.floor(c.length / Math.max(2, L / 3))));
    for (let i = 0; i < c.length - 1; i += stride) {
      const i1 = Math.min(c.length - 1, i + stride);
      out.push({ c, i0: i, i1, z: (c[i].z + c[i1].z) / 2 });
    }
    return out;
  };
  const strokeSeg = (sg: Seg) => {
    const { c, i0, i1 } = sg;
    const a = c[i0];
    const b = c[i1];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const tl = Math.hypot(tx, ty);
    if (tl < 0.05) return;
    tx /= tl;
    ty /= tl;
    // the light's component across this piece
    const dot = LX * tx + LY * ty;
    let gx = LX - dot * tx;
    let gy = LY - dot * ty;
    const gl = Math.hypot(gx, gy);
    const k = sstep(0.06, 0.42, gl);
    if (gl > 1e-4) {
      gx /= gl;
      gy /= gl;
    } else {
      gx = -ty;
      gy = tx;
    }
    const r = Math.max(a.r, b.r);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const g = ctx.createLinearGradient(mx + gx * r, my + gy * r, mx - gx * r, my - gy * r);
    stops(k).forEach(([o, col]) => g.addColorStop(o, css(col)));
    ctx.globalAlpha = 0.94 * alpha;
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 * r + 2;
    ctx.lineCap = i0 === 0 || i1 === c.length - 1 ? "round" : "butt";
    ctx.beginPath();
    ctx.moveTo(a.x - tx * 0.7, a.y - ty * 0.7);
    ctx.lineTo(b.x + tx * 0.7, b.y + ty * 0.7);
    ctx.stroke();
  };
  const joinedNow = chains.length > 1 && whole > 0.001;
  if (joinedNow) {
    // the parts of a division before they part: one body (one clip, one depth order of every piece)
    ctx.save();
    ctx.clip(silAll, "nonzero");
    ctx.globalAlpha = 0.94 * alpha;
    ctx.fillStyle = css(ink.deep);
    ctx.fill(silAll);
    const all: Seg[] = [];
    chains.forEach((c) => segsOf(c).forEach((q) => all.push(q)));
    all.sort((a, b) => a.z - b.z);
    all.forEach(strokeSeg);
    order.forEach(({ i: ci }) => disc(discOf(chains[ci]), 1 - whole));
    const joined: SP[] = [];
    chains.forEach((c) => c.forEach((q) => joined.push(q)));
    disc(discOf(joined), whole);
    ctx.restore();
  } else {
    order.forEach(({ i: ci }) => {
      const c = chains[ci];
      ctx.save();
      ctx.clip(sils[ci], "nonzero");
      ctx.globalAlpha = 0.94 * alpha;
      ctx.fillStyle = css(ink.deep);
      ctx.fill(sils[ci]);
      const sg = segsOf(c).sort((a, b) => a.z - b.z);
      sg.forEach(strokeSeg);
      disc(discOf(c), 1);
      ctx.restore();
    });
  }
  ctx.save();
  ctx.clip(silAll, "nonzero");
  ctx.globalAlpha = 0.94 * alpha;
  // the envelope's small bumps (the virion), on the face only, fading toward the rim
  parts.forEach(({ s, x, y }) => {
    const rd = Math.max(0.5, 0.045 * px);
    if (rd < 0.9) return;
    s.dots.forEach((d) => {
      if (d.g < 0.02 || d.n[2] < 0.05) return;
      const a = d.g * sstep(0.05, 0.5, d.n[2]) * 0.3 * alpha;
      ctx.globalAlpha = a;
      ctx.fillStyle = css(ink.shade);
      ctx.beginPath();
      ctx.ellipse(x + d.b[0] * px, y + d.b[1] * px, rd * Math.max(0.35, d.n[2]), rd, Math.atan2(d.n[1], d.n[0]), 0, TAU);
      ctx.fill();
    });
  });
  // a soft sheen along the lit side of a big body (the cream highlight)
  if (big > 26) {
    chains.forEach((c) => {
      if (c.length < 2) return;
      const sh = c01((big - 26) / 30) * 0.12 * ink.specA * alpha;
      ctx.globalAlpha = sh;
      ctx.strokeStyle = css(ink.spec);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(1, rmax * 0.3);
      ctx.beginPath();
      c.forEach((q, i) => {
        const X = q.x + LX * q.r * 0.5;
        const Y = q.y + LY * q.r * 0.5;
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      });
      ctx.stroke();
    });
  }
  ctx.restore();
  // 4. the spikes on the face (club heads seen nearly end-on), over the body
  spikes.forEach((s) => drawSpike(ctx, s, ink, ow, alpha, true));
  ctx.restore();
  ctx.globalAlpha = 1;
};
/** the 3D light (for callers that shade their own volumes the same way) */
export const MICROBE_LIGHT = { screen: [LX, LY] as [number, number], three: L3 };

/** a full-frame canvas whose draw(ctx) runs every frame (put it inside <AirStage>) */
export const MicrobeCanvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; width?: number; height?: number }> = ({ draw, width = 1080, height = 1920 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, width, height);
    draw(ctx);
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={width} height={height} style={{ position: "absolute", left: 0, top: 0, width, height }} />;
};

// ===================================================================================================================
// THE SWARM: sprites baked with the light at every angle
// ===================================================================================================================
export const SWARM_KINDS: Genome[] = [
  GENOMES.sphere,
  { ...GENOMES.sphere, girth: 0.5, tone: 0.6 },
  GENOMES.rod,
  { ...GENOMES.rod, len: 2.1, girth: 0.4, tone: -0.5 },
  GENOMES.bean,
  { ...GENOMES.comma, tail: 0 },
  GENOMES.comma,
  GENOMES.corkscrew,
  { ...GENOMES.corkscrew, len: 3.2, turns: 3, coil: 0.26, tone: 0.5 },
  GENOMES.hairyRod,
  { ...GENOMES.tailedRod, tail: 1.6 },
  GENOMES.bulbRod,
  { ...GENOMES.spikySphere, tone: -0.4 },
  { ...GENOMES.sphere, girth: 0.45, pili: 0.8, tone: 0.3 },
  GENOMES.twisty,
  { ...GENOMES.bean, bend: 1.4, len: 1.6, girth: 0.42, tone: -0.7 },
];
export type Swarm = {
  key: string;
  span: number;
  angles: number;
  size: number;
  /** [kind][angle] -> [full, half, quarter] */
  sprites: HTMLCanvasElement[][][];
  masks: HTMLCanvasElement[][];
  kinds: Genome[];
  /** each kind's flagellum (unrotated, u) and its px per unit at the bake */
  pxOf: number[];
  look: Look;
  pitch: number[];
};
const SWARMS = new Map<string, Swarm>();
const mkCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
const halve = (src: HTMLCanvasElement) => {
  const c = mkCanvas(Math.max(1, Math.ceil(src.width / 2)), Math.max(1, Math.ceil(src.height / 2)));
  const x = c.getContext("2d") as CanvasRenderingContext2D;
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high";
  x.drawImage(src, 0, 0, c.width, c.height);
  return c;
};
/** bake the swarm's sprites (bodies, spikes, hairs; no flagellum) at every angle; cached by key */
export const bakeSwarm = (o: { key: string; kinds?: Genome[]; span?: number; angles?: number; look?: Look; pitch?: number[] }): Swarm => {
  const hit = SWARMS.get(o.key);
  if (hit) return hit;
  const kinds = o.kinds ?? SWARM_KINDS;
  const spanPx = o.span ?? 56;
  const angles = o.angles ?? 16;
  const look = o.look ?? {};
  const size = Math.ceil(spanPx * 1.18 + 8);
  const pitch = o.pitch ?? kinds.map((_, i) => 0.25 * Math.sin(i * 2.1));
  const sprites: HTMLCanvasElement[][][] = [];
  const masks: HTMLCanvasElement[][] = [];
  const pxOf: number[] = [];
  kinds.forEach((g0, ki) => {
    const g = { ...g0, tail: 0 };
    const px = spanPx / Math.max(0.5, span(g));
    pxOf.push(px);
    const ink = inkOf({ ...look, tone: (look.tone ?? 0) + g0.tone });
    const row: HTMLCanvasElement[][] = [];
    const mrow: HTMLCanvasElement[] = [];
    for (let ai = 0; ai < angles; ai++) {
      const yaw = (ai / angles) * TAU;
      const s = shapeOf(g, { yaw, pitch: pitch[ki], roll: g0.seed * 2 + ki }, ki);
      const c = mkCanvas(size, size);
      const x = c.getContext("2d") as CanvasRenderingContext2D;
      drawMicrobe(x, [{ s, x: size / 2, y: size / 2 }], px, ink);
      const m = mkCanvas(size, size);
      const mx = m.getContext("2d") as CanvasRenderingContext2D;
      mx.drawImage(c, 0, 0);
      mx.globalCompositeOperation = "source-in";
      mx.fillStyle = "#ffffff";
      mx.fillRect(0, 0, size, size);
      const h1 = halve(c);
      row.push([c, h1, halve(h1)]);
      mrow.push(m);
    }
    sprites.push(row);
    masks.push(mrow);
  });
  const sw: Swarm = { key: o.key, span: spanPx, angles, size, sprites, masks, kinds, pxOf, look, pitch };
  SWARMS.set(o.key, sw);
  return sw;
};
let TINT: HTMLCanvasElement | null = null;
/** draw swarm kind `kind` centred at (x, y) with its largest extent spanPx */
export const blitSwarm = (
  ctx: CanvasRenderingContext2D,
  sw: Swarm,
  kind: number,
  x: number,
  y: number,
  spanPx: number,
  o: { yaw: number; wave?: number; alpha?: number; fog?: number; air?: string | RGB } = { yaw: 0 },
) => {
  const ki = ((kind % sw.kinds.length) + sw.kinds.length) % sw.kinds.length;
  const alpha = o.alpha ?? 1;
  if (alpha < 0.004 || spanPx < 0.5) return;
  const sc = spanPx / sw.span;
  const lvl = sc < 0.3 ? 2 : sc < 0.6 ? 1 : 0;
  const fa = ((o.yaw / TAU) * sw.angles) % sw.angles;
  const af = fa < 0 ? fa + sw.angles : fa;
  const i0 = Math.floor(af) % sw.angles;
  const i1 = (i0 + 1) % sw.angles;
  const w = af - Math.floor(af);
  const fog = c01(o.fog ?? 0);
  const g0 = sw.kinds[ki];
  // the flagellum, live (it waves), behind the body, in the body's own baked rotation
  if (g0.tail > 0.05) {
    const tail = tailOf(g0, { yaw: o.yaw, pitch: sw.pitch[ki], roll: g0.seed * 2 + ki }, o.wave ?? 0);
    const ink = inkOf({ ...sw.look, tone: (sw.look.tone ?? 0) + g0.tone, fog, air: o.air });
    const px = sw.pxOf[ki] * sc;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    tail.forEach((p, i) => (i === 0 ? ctx.moveTo(x + p[0] * px, y + p[1] * px) : ctx.lineTo(x + p[0] * px, y + p[1] * px)));
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineWidth = Math.max(0.5, 0.05 * px) + 1;
    ctx.strokeStyle = css(ink.out);
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(0.5, 0.05 * px);
    ctx.strokeStyle = css(ink.deep);
    ctx.stroke();
    ctx.restore();
  }
  const draw = (ai: number, a: number) => {
    if (a < 0.004) return;
    const res = (o.yaw - (ai / sw.angles) * TAU) % TAU;
    const im = sw.sprites[ki][ai][lvl];
    const d = sw.size * sc;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.rotate(res);
    ctx.drawImage(im, -d / 2, -d / 2, d, d);
    ctx.restore();
  };
  // the two nearest angles crossfaded (each turned the small rest of the way)
  draw(i0, alpha);
  draw(i1, alpha * w);
  if (fog > 0.003) {
    const ai = w < 0.5 ? i0 : i1;
    const m = sw.masks[ki][ai];
    if (!TINT) TINT = mkCanvas(m.width, m.height);
    if (TINT.width !== m.width || TINT.height !== m.height) {
      TINT.width = m.width;
      TINT.height = m.height;
    }
    const tc = TINT.getContext("2d") as CanvasRenderingContext2D;
    tc.globalCompositeOperation = "source-over";
    tc.clearRect(0, 0, m.width, m.height);
    tc.drawImage(m, 0, 0);
    tc.globalCompositeOperation = "source-in";
    const air: RGB = typeof o.air === "string" ? hexRgb(o.air) : (o.air ?? hexRgb(MICRO_AIR));
    tc.fillStyle = css(air);
    tc.fillRect(0, 0, m.width, m.height);
    const res = (o.yaw - (ai / sw.angles) * TAU) % TAU;
    const d = sw.size * sc;
    ctx.save();
    ctx.globalAlpha = alpha * fog;
    ctx.translate(x, y);
    ctx.rotate(res);
    ctx.drawImage(TINT, -d / 2, -d / 2, d, d);
    ctx.restore();
  }
};
