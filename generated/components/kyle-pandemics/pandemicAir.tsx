// ---------------------------------------------------------------------------
// pandemicAir — THE CLIP'S MEDIUM (kyle-pandemics, V3): the "underwater" vibe of the Will ocean cuts
// (kits/cheeky-pint/oceanShared.tsx: WATER, OceanStage, GodRays, MarineSnow, fogAt, InFog) carried onto land as AIR:
// a damp, misty, disease-laden air. Every object sits INSIDE one tinted, graded medium; colour changes continuously
// with distance and height; far things dissolve into it; soft shafts of light come from the upper left; motes drift at
// three depths; a soft-light film grade (cream highs, espresso lows), grain on twos, a brown vignette. Nothing black.
// Orange stays THE DISEASE and is the one warm glowing material (an optional faint bloom picks out orange only).
//
// API (header = contract; units are the CUT's own: cm in 47, micro-units in 23, the cast's units in London-depth cuts)
//   AIR[look]                 the palettes: ramp (t 0 = high, lit air .. 1 = low, dense air; continuous, never black),
//                             cream / creamLo (rims, shafts, motes), shadow (contact and cast shadows), line (the darkest
//                             outline allowed: a deep local tone), grade, vignette, orange*, and suggested materials
//                             re-lit for the medium: ground, stone, body (cream organisms / pale cloth) {lit, mid, dark}
//                             look "A": the Will water ramp carried to air (sage-teal near the light, espresso deep)
//                             — THE CLIP'S CHOSEN PALETTE (director's pick, Oct 21; notes/AIR_READY.md)
//                             look "B": the clip's umber page made into a medium (#3F3428 family, warmer; reference)
//   MOODS[mood]               day | interior | night | micro: shifts the ramp, the light source and the motes within the
//                             one family (night: dim, one lamp's cone; micro: particles in a fluid, a microscope's light)
//   airRamp(look, t)          the ramp colour (RGB) at t
//   makeAirView({scene, frame, horizon, cam, rest})  the medium for one frame (pure; also usable outside React):
//       scene: AirScene       { look, mood, F (focal px), fogNear/fogVis/fogMax (distance units), hLow/hHigh (heights,
//                             up +, of the dense low air and the light high air), moteUnit (cut units per mote metre),
//                             eyeT? (ramp t of the air at the horizon) }
//       horizon               screen y of the vanishing point's row
//       cam / rest            the camera position now and at the cut's start, {x, y (up +), z (forward +)}, cut units:
//                             motes and shafts parallax against it (a dolly forward flies motes past the lens)
//     -> AirView: .airAtScreen(sy) the air behind a screen row; .airAt(dist, height) the medium seen through dist at a
//        height (converging to the horizon's air far away); .fogAt(dist) the fog amount (0..fogMax)
//   fogAt(v, dist) / airAt(v, dist, height) / fogHex(v, hex, dist, height?) / fogMix(hex, rgb, amount) / fogRgb(..)
//   <AirStage v shafts motes grade grain vignette bloom shaftsBehind lamp window front overlay>{world}</AirStage>
//                             the backdrop (graded air by screen row + the light's glow), shafts (screen blend, in front
//                             of the world by default: volumetric), far + mid motes, the world (children; optional orange
//                             bloom), front, near out-of-focus motes, overlay, the soft-light grade, vignette, grain.
//                             Strength props are 0..1+ multipliers (0 turns a layer off). The light's glow sits in front
//                             of the world (veiling light), so sky and far ground share it and no horizon step appears.
//   <AirHorizonHaze v below id> / paintHorizonHaze(ctx, v, below)  the horizon as a soft zone: paint it over the GROUND
//                             only (before standing objects, which fog by their own distance)
//   <AirGradient id v y0 y1>  an SVG userSpace linearGradient of the air along screen rows y0..y1: paint any shape with
//                             fill={`url(#id)`} opacity={fog} to veil it into the medium (the cheap InAir)
//   <InAir v amount blur>     pull an SVG group (screen px) toward the air behind it (mask trick, like InFog); amount a
//                             number or a function of screen y; blur (px) softens distant things
//   <AirContactShadow ...>    a soft contact shadow in the medium's shadow colour (SVG ellipse, radial falloff)
//   <AirRim d body w>         a cream rim along the TOP edges of a shape (ocean RimLit): use as the shape's own paint
//   formTone(mat, ndl, shadowRgb)  soft form light: mid -> lit with a smooth terminator; the shade side sinks toward
//                             the medium's shadow colour (never a hard step)
//   airThree(v, dist, height) {rgb (0..1), amount} for three.js shaders (a uniform fog colour + amount per object);
//   fogExp2(v, dist)          {color, density} for a THREE.FogExp2 that matches fogAt at dist (MeshStandard / Basic
//                             materials with fog: true). Render the ThreeCanvas `flat linear` INSIDE <AirStage> so the
//                             grade, vignette, grain and bloom reach it exactly as they reach the SVG world.
//
// HOW A CUT WRAPS ITSELF: build its scene once (AirScene), per frame makeAirView(...) from its own camera (horizon =
// its VP row, cam = its eye), render <AirStage v={v}> around its world instead of the paper page (no mottle, no paper
// vignette), paint the ground opaque with fogHex by distance, fog every object (fogHex per face, or AirGradient veils /
// InAir), use pal.shadow for contact and cast shadows, pal.line (or a darker local colour) for thin outlines, AirRim /
// a cream edge on top edges, and keep hatching only as a light texture inside shadows.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;

// ---- small helpers -----------------------------------------------------------------------------------------------
export type RGB = [number, number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const mod = (a: number, m: number) => ((a % m) + m) % m;
export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const hexRgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const rgbHex = (c: RGB) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${f3(c01(a))})`;
/** mix two hex colours (t 0 = a) */
export const mixHex = (a: string, b: string, t: number) => rgbHex(mixRgb(hexRgb(a), hexRgb(b), c01(t)));
const uidOf = (raw: string) => `air${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ===================================================================================================================
// THE PALETTES
// ===================================================================================================================
export type AirLook = "A" | "B";
export type AirMood = "day" | "interior" | "night" | "micro";
export type Mat = { lit: string; mid: string; dark: string };
export type AirPalette = {
  label: string;
  /** the medium by t: 0 = high, lit air (near the light) .. 1 = low, dense air (the deep, the shadows) */
  ramp: readonly [number, string][];
  /** the ramp t of the air at the horizon in a day scene (other moods shift it) */
  eyeT: number;
  cream: string;
  creamLo: string;
  /** contact and cast shadows, ambient occlusion (deep, warm, never black) */
  shadow: string;
  /** the darkest outline allowed (thin; prefer a darker version of the object's own colour) */
  line: string;
  vignette: string;
  grade: { top: string; mid: string; bottom: string };
  orange: string;
  orangeDeep: string;
  orangeHot: string;
  /** materials re-lit for this medium (local colours before fog) */
  ground: Mat;
  stone: Mat;
  body: Mat;
};
/** A — the Will water ramp carried to air: sage-teal near the light, petrol in the middle distance, warming to
 *  espresso in the deep and the shadows; cream objects; orange the disease. (Ramp = oceanShared WATER by depth.) */
const PAL_A: AirPalette = {
  label: "A water-air",
  ramp: [
    [0, "#A9C7B4"],
    [0.03, "#86AB9B"],
    [0.077, "#5F877D"],
    [0.138, "#466C66"],
    [0.215, "#375957"],
    [0.308, "#30494A"],
    [0.423, "#313E3A"],
    [0.554, "#363731"],
    [0.708, "#3D342B"],
    [1, "#3F3226"],
  ],
  eyeT: 0.11,
  cream: "#F3EBDD",
  creamLo: "#D9CDB4",
  shadow: "#22180F",
  line: "#2B241D",
  vignette: "34,21,11",
  grade: { top: "rgba(243,226,196,0.55)", mid: "rgba(150,120,90,0.18)", bottom: "rgba(74,44,24,0.5)" },
  orange: "#FFB000",
  orangeDeep: "#D98A0C",
  orangeHot: "#FFE7A8",
  ground: { lit: "#857659", mid: "#6B5E49", dark: "#3A3128" },
  stone: { lit: "#938270", mid: "#5F5447", dark: "#2F2721" },
  body: { lit: "#F3EBDD", mid: "#D6CAAE", dark: "#8E8470" },
};
/** B — the clip's umber page made into a medium: the #3F3428 family, warmer, a lit warm haze near the light; cream
 *  shafts and motes. */
const PAL_B: AirPalette = {
  label: "B umber-air",
  ramp: [
    [0, "#C4AE86"],
    [0.1, "#AA9471"],
    [0.22, "#8D7A5D"],
    [0.36, "#72624B"],
    [0.5, "#5E503E"],
    [0.64, "#4E4233"],
    [0.8, "#42372A"],
    [1, "#352B20"],
  ],
  eyeT: 0.4,
  cream: "#F1E6CC",
  creamLo: "#D3C5A2",
  shadow: "#1E160F",
  line: "#2A2017",
  vignette: "30,20,11",
  grade: { top: "rgba(243,226,196,0.5)", mid: "rgba(150,120,90,0.16)", bottom: "rgba(60,36,18,0.5)" },
  orange: "#FFB000",
  orangeDeep: "#D98A0C",
  orangeHot: "#FFE7A8",
  ground: { lit: "#6F5D44", mid: "#584936", dark: "#30261C" },
  stone: { lit: "#88745A", mid: "#574837", dark: "#2B221A" },
  body: { lit: "#F1E6CC", mid: "#D3C5A2", dark: "#8F8064" },
};
export const AIR: Record<AirLook, AirPalette> = { A: PAL_A, B: PAL_B };

export type ShaftKind = "rays" | "window" | "lamp" | "condenser";
export type MoteKind = "dust" | "particles";
export type MoodSpec = {
  /** added to the palette's eyeT (+ = denser, darker air) */
  tBias: number;
  /** ramp change per unit tan of the viewing angle (looking up = lighter) */
  gain: number;
  /** 1 = full light; night < 1 mixes the air toward its own dense end (never black) */
  dim: number;
  fogScale: number;
  /** the light source's soft glow (screen px; a = strength) */
  sun: { x: number; y: number; r: number; a: number };
  shafts: ShaftKind;
  /** shafts' horizontal run per px of drop (+ = to the right: light from the upper left) */
  slant: number;
  motes: MoteKind;
  /** motes: size and count multipliers, drift per frame in mote metres [x, y (up +), z] */
  moteSize: number;
  moteCount: number;
  drift: [number, number, number];
};
export const MOODS: Record<AirMood, MoodSpec> = {
  day: { tBias: 0, gain: 0.42, dim: 1, fogScale: 1, sun: { x: 170, y: -260, r: 1250, a: 0.42 }, shafts: "rays", slant: 0.36, motes: "dust", moteSize: 1, moteCount: 1, drift: [0.0035, 0.0006, 0] },
  interior: { tBias: 0.12, gain: 0.3, dim: 0.9, fogScale: 0.8, sun: { x: 60, y: 260, r: 900, a: 0.3 }, shafts: "window", slant: 0.62, motes: "dust", moteSize: 0.9, moteCount: 0.8, drift: [0.002, 0.0008, 0] },
  night: { tBias: 0.34, gain: 0.25, dim: 0.62, fogScale: 0.9, sun: { x: 540, y: 300, r: 700, a: 0.32 }, shafts: "lamp", slant: 0, motes: "dust", moteSize: 0.9, moteCount: 0.8, drift: [0.0025, -0.0004, 0] },
  micro: { tBias: -0.04, gain: 0.3, dim: 1, fogScale: 1, sun: { x: 300, y: -300, r: 1400, a: 0.48 }, shafts: "rays", slant: 0.3, motes: "particles", moteSize: 0.75, moteCount: 1.5, drift: [0.0018, 0.0012, 0.001] },
};

/** the ramp colour at t (clamped) */
export const airRamp = (look: AirLook, t: number): RGB => {
  const R = AIR[look].ramp;
  if (t <= R[0][0]) return hexRgb(R[0][1]);
  for (let i = 1; i < R.length; i++) {
    if (t <= R[i][0]) return mixRgb(hexRgb(R[i - 1][1]), hexRgb(R[i][1]), (t - R[i - 1][0]) / (R[i][0] - R[i - 1][0]));
  }
  return hexRgb(R[R.length - 1][1]);
};

// ===================================================================================================================
// THE VIEW
// ===================================================================================================================
export type AirScene = {
  look: AirLook;
  mood: AirMood;
  /** the cut's focal length, px */
  F: number;
  /** fog: none nearer than fogNear, then fogMax * (1 - exp(-(d - fogNear) / fogVis)) (the cut's distance units) */
  fogNear: number;
  fogVis: number;
  fogMax: number;
  /** heights (the cut's units, up +) of the dense low air and the light high air */
  hLow: number;
  hHigh: number;
  /** cut units per mote metre (motes and shafts are laid out in metres) */
  moteUnit: number;
  /** override the ramp t at the horizon */
  eyeT?: number;
};
export type Cam3 = { x: number; y: number; z: number };
export type AirView = {
  scene: AirScene;
  pal: AirPalette;
  mood: MoodSpec;
  frame: number;
  horizon: number;
  /** ramp t of the air at the horizon */
  eyeT: number;
  /** the camera's travel since the cut's start, in mote metres */
  travel: Cam3;
  airAtScreen: (sy: number) => RGB;
  airAt: (dist: number, height?: number) => RGB;
  fogAt: (dist: number) => number;
};
const dimRgb = (look: AirLook, c: RGB, dim: number): RGB => (dim >= 0.999 ? c : mixRgb(airRamp(look, 1), c, dim).map((v) => v * (0.55 + 0.45 * dim)) as RGB);
export const makeAirView = (p: { scene: AirScene; frame: number; horizon: number; cam?: Cam3; rest?: Cam3 }): AirView => {
  const { scene, frame, horizon } = p;
  const pal = AIR[scene.look];
  const mood = MOODS[scene.mood];
  const eyeT = (scene.eyeT ?? pal.eyeT) + mood.tBias;
  const cam = p.cam ?? { x: 0, y: 0, z: 0 };
  const rest = p.rest ?? cam;
  const u = scene.moteUnit;
  const travel = { x: (cam.x - rest.x) / u, y: (cam.y - rest.y) / u, z: (cam.z - rest.z) / u };
  const tAt = (t: number) => dimRgb(scene.look, airRamp(scene.look, t), mood.dim);
  const airAtScreen = (sy: number) => tAt(eyeT + (mood.gain * (sy - horizon)) / 1250);
  const fogAtD = (dist: number) => mood.fogScale * scene.fogMax * (1 - Math.exp(-Math.max(0, dist - scene.fogNear) / scene.fogVis));
  const airAtD = (dist: number, height = 0) => {
    const hn = c01((height - scene.hLow) / Math.max(1e-6, scene.hHigh - scene.hLow));
    const tH = lerp(eyeT + 0.22, eyeT - 0.18, hn);
    const w = 1 - Math.exp(-Math.max(0, dist) / (2.5 * scene.fogVis + scene.fogNear));
    return tAt(lerp(tH, eyeT, w));
  };
  return { scene, pal, mood, frame, horizon, eyeT, travel, airAtScreen, airAt: airAtD, fogAt: fogAtD };
};
export const fogAt = (v: AirView, dist: number) => v.fogAt(dist);
export const airAt = (v: AirView, dist: number, height = 0) => v.airAt(dist, height);
/** a colour fogged into the medium: mix hex toward the air at that distance and height by the fog at that distance */
export const fogRgb = (v: AirView, hex: string, dist: number, height = 0): RGB => mixRgb(hexRgb(hex), v.airAt(dist, height), c01(v.fogAt(dist)));
export const fogHex = (v: AirView, hex: string, dist: number, height = 0) => rgbHex(fogRgb(v, hex, dist, height));
/** mix a colour toward a given air colour by an amount */
export const fogMix = (hex: string, air: RGB, amount: number) => rgbHex(mixRgb(hexRgb(hex), air, c01(amount)));
/** soft form light on a material: ndl (-1..1, the surface normal against the light) -> colour; a smooth terminator and
 *  the shade side sinking toward the medium's shadow colour (hatching, if any, is only a light texture on top) */
export const formTone = (m: Mat, ndl: number, shadow: string, sink = 0.28) => {
  const t = smoothstep(-0.45, 0.85, ndl);
  const shade = mixHex(m.dark, shadow, sink);
  return t < 0.5 ? mixHex(shade, m.mid, t * 2) : mixHex(m.mid, m.lit, (t - 0.5) * 2);
};

// three.js
/** fog for a three.js object at a distance and height: rgb 0..1 (linear = sRGB in a `flat linear` canvas) + amount */
export const airThree = (v: AirView, dist: number, height = 0) => {
  const c = v.airAt(dist, height);
  return { rgb: [c[0] / 255, c[1] / 255, c[2] / 255] as [number, number, number], amount: c01(v.fogAt(dist)) };
};
/** a THREE.FogExp2 (color, density) that matches fogAt at `dist` (FogExp2 has no near offset: match it where the
 *  subject stands). For ShaderMaterials, feed airThree into a uniform instead. */
export const fogExp2 = (v: AirView, dist: number) => {
  const a = Math.min(0.995, Math.max(1e-4, v.fogAt(dist)));
  return { color: rgbHex(v.airAt(dist, 0)), density: Math.sqrt(-Math.log(1 - a)) / Math.max(1e-6, dist) };
};

// ===================================================================================================================
// SHAFTS
// ===================================================================================================================
type Ray = { x: number; w0: number; w1: number; a: number; ph: number; len: number; sl: number; sw: number; fq: number };
/** the shafts: irregular spacing (cumulative random gaps), irregular widths and strengths, each its own slant,
 *  sway and breath (GodRays in HuntingMines) */
/** the wrap window is wide enough that a shaft re-enters only where it is wholly off frame */
const RAY_SPAN = 2800;
const RAYS: Ray[] = (() => {
  const out: Ray[] = [];
  let x = -700;
  for (let i = 0; i < 12; i++) {
    x += 60 + Math.pow(hash01(i + 61), 1.7) * 330;
    out.push({
      x,
      w0: 16 + Math.pow(hash01(i + 11), 1.5) * 120,
      w1: 80 + Math.pow(hash01(i + 21), 1.2) * 380,
      a: 0.25 + Math.pow(hash01(i + 31), 0.8) * 0.75,
      ph: hash01(i + 41) * 6.283,
      len: 1350 + hash01(i + 51) * 1100,
      sl: (hash01(i + 71) - 0.5) * 0.1,
      sw: 14 + hash01(i + 81) * 26,
      fq: 0.011 + hash01(i + 91) * 0.014,
    });
  }
  return out;
})();
export type Lamp = { x: number; y: number; angle?: number; spread?: number; reach?: number };
export type WindowLight = { x: number; y0: number; y1: number; beams?: number };
const Shafts: React.FC<{ v: AirView; strength: number; lamp?: Lamp; win?: WindowLight }> = ({ v, strength, lamp, win }) => {
  const uid = uidOf(useId());
  const kind = v.mood.shafts;
  const t = v.frame;
  const cream = v.pal.cream;
  // shafts stand ~25 m away: a sideways camera move slides them a little (parallax), a dolly hardly at all
  const shift = (-v.travel.x * v.scene.F) / 25;
  const paths: React.ReactNode[] = [];
  let blur = 22;
  if (kind === "rays" || kind === "condenser") {
    const slant = v.mood.slant;
    const y0 = -200;
    RAYS.forEach((r, i) => {
      const cx = mod(r.x + shift + 1400, RAY_SPAN) - 1400;
      const breath = 1 + 0.22 * Math.sin(t * 0.029 + r.ph);
      // the foot sways, the top barely moves
      const sway = r.sw * Math.sin(t * r.fq + r.ph * 1.3);
      const al = r.a * (0.7 + 0.3 * Math.sin(t * 0.021 + r.ph * 1.7)) * strength;
      const w0 = r.w0 * breath;
      const w1 = r.w1 * (2 - breath);
      const x1 = cx + r.len * (slant + r.sl) + sway;
      const y1 = y0 + r.len;
      paths.push(<path key={i} d={`M${f3(cx - w0 / 2)} ${y0}L${f3(cx + w0 / 2)} ${y0}L${f3(x1 + w1 / 2)} ${f3(y1)}L${f3(x1 - w1 / 2)} ${f3(y1)}Z`} fill={`url(#${uid}r)`} opacity={f3(al)} />);
    });
  } else if (kind === "window") {
    const w = win ?? { x: -40, y0: 260, y1: 760, beams: 3 };
    const n = w.beams ?? 3;
    const slant = v.mood.slant;
    blur = 14;
    for (let i = 0; i < n; i++) {
      const ya = lerp(w.y0, w.y1, i / n) + 6;
      const yb = lerp(w.y0, w.y1, (i + 1) / n) - 6;
      const len = 1500;
      const al = (0.75 + 0.25 * Math.sin(t * 0.02 + i * 2.1)) * strength;
      const dx = len;
      const dy = len * (1 / Math.max(0.2, slant)) * 0.55;
      paths.push(<path key={i} d={`M${f3(w.x)} ${f3(ya)}L${f3(w.x)} ${f3(yb)}L${f3(w.x + dx)} ${f3(yb + dy * 1.12)}L${f3(w.x + dx)} ${f3(ya + dy * 0.92)}Z`} fill={`url(#${uid}w)`} opacity={f3(al)} />);
    }
  } else if (kind === "lamp") {
    const L = lamp ?? { x: 540, y: 330 };
    const ang = L.angle ?? Math.PI / 2;
    const spread = L.spread ?? 0.42;
    const reach = L.reach ?? 1700;
    blur = 18;
    const flick = 0.92 + 0.08 * Math.sin(t * 0.21) * Math.sin(t * 0.077);
    const a0 = ang - spread;
    const a1 = ang + spread;
    paths.push(
      <path
        key="cone"
        d={`M${f3(L.x - 14)} ${f3(L.y)}L${f3(L.x + 14)} ${f3(L.y)}L${f3(L.x + Math.cos(a0) * reach)} ${f3(L.y + Math.sin(a0) * reach)}L${f3(L.x + Math.cos(a1) * reach)} ${f3(L.y + Math.sin(a1) * reach)}Z`}
        fill={`url(#${uid}l)`}
        opacity={f3(strength * flick)}
      />,
    );
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cream} stopOpacity="0.36" />
          <stop offset="0.45" stopColor={cream} stopOpacity="0.15" />
          <stop offset="1" stopColor={cream} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}w`} x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0" stopColor={cream} stopOpacity="0.42" />
          <stop offset="0.6" stopColor={cream} stopOpacity="0.14" />
          <stop offset="1" stopColor={cream} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}l`} cx={f3((lamp?.x ?? 540) / W)} cy={f3((lamp?.y ?? 330) / H)} r="0.9" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor={cream} stopOpacity="0.5" />
          <stop offset="0.5" stopColor={cream} stopOpacity="0.16" />
          <stop offset="1" stopColor={cream} stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}b`} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>
      <g filter={`url(#${uid}b)`}>{paths}</g>
    </svg>
  );
};

// ===================================================================================================================
// MOTES: three depth layers in a 3D box round the eye (mote metres): a dolly flies them past the lens, a sideways move
// slides near ones faster than far ones; deterministic (hash), recycled through the box with soft fades at its ends.
// ===================================================================================================================
type MoteLayer = { n: number; d0: number; d1: number; r: [number, number]; a: [number, number]; soft: number; seed: number };
export const MOTE_LAYERS: readonly MoteLayer[] = [
  { n: 260, d0: 9, d1: 30, r: [0.012, 0.024], a: [0.28, 0.6], soft: 0.32, seed: 100 },
  { n: 150, d0: 3, d1: 9, r: [0.01, 0.02], a: [0.38, 0.72], soft: 0.5, seed: 300 },
  { n: 26, d0: 0.8, d1: 3, r: [0.022, 0.05], a: [0.1, 0.22], soft: 0.9, seed: 500 },
];
const lampLight = (lamp: Lamp | undefined, x: number, y: number) => {
  const L = lamp ?? { x: 540, y: 330 };
  const ang = L.angle ?? Math.PI / 2;
  const spread = L.spread ?? 0.42;
  const a = Math.atan2(y - L.y, x - L.x);
  let d = Math.abs(a - ang);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return c01(1 - d / (spread * 1.25)) * c01(1 - Math.hypot(x - L.x, y - L.y) / (L.reach ?? 1700));
};
const Motes: React.FC<{ v: AirView; layer: 0 | 1 | 2; density: number; half?: 0 | 1; lamp?: Lamp }> = ({ v, layer, density, half, lamp }) => {
  const uid = uidOf(useId());
  const L = MOTE_LAYERS[layer];
  const F = v.scene.F;
  const t = v.frame;
  const md = v.mood;
  const span = L.d1 - L.d0;
  const Wb = (1.3 * W * L.d1) / F;
  const Hb = (2.3 * Math.max(v.horizon, H - v.horizon) * L.d1) / F;
  const n = Math.round(L.n * density * md.moteCount);
  const micro = md.motes === "particles";
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    if (half !== undefined && i % 2 !== half) continue;
    const h = L.seed + i * 7.13;
    const sp = 0.7 + 0.6 * hash01(h + 3.1);
    const wob = (micro ? 0.035 : 0.06) * Math.sin(t * (0.03 + 0.03 * hash01(h + 4.4)) + hash01(h + 5.5) * 6.28);
    const jit = micro ? 0.012 * Math.sin(t * 0.37 + hash01(h + 9.1) * 40) : 0;
    const X = mod(hash01(h) * Wb + md.drift[0] * sp * t + wob - v.travel.x, Wb) - Wb / 2 + jit;
    const Y = mod(hash01(h + 1.7) * Hb + md.drift[1] * sp * t - v.travel.y, Hb) - Hb / 2;
    const Z = L.d0 + mod(hash01(h + 2.9) * span - md.drift[2] * t - v.travel.z, span);
    const sx = 540 + (F * X) / Z;
    const sy = v.horizon - (F * Y) / Z;
    const r = (lerp(L.r[0], L.r[1], hash01(h + 6.6)) * md.moteSize * F) / Z;
    if (sx < -r * 2 || sx > W + r * 2 || sy < -r * 2 || sy > H + r * 2) continue;
    const ends = smoothstep(0, 0.14, (Z - L.d0) / span) * smoothstep(0, 0.2, (L.d1 - Z) / span);
    let lit = 0.6 + 0.4 * (1 - c01(sy / H));
    if (md.shafts === "lamp") lit = 0.18 + 1.1 * lampLight(lamp, sx, sy);
    const a = lerp(L.a[0], L.a[1], hash01(h + 8.8)) * lit * ends;
    if (a < 0.01) continue;
    dots.push(<circle key={i} cx={f3(sx)} cy={f3(sy)} r={f3(Math.max(0.5, Math.min(layer === 2 ? 70 : 9, r)))} fill={`url(#${uid}g)`} opacity={f3(a)} />);
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor={v.pal.cream} stopOpacity="1" />
          <stop offset={f3(1 - L.soft)} stopColor={v.pal.cream} stopOpacity={layer === 2 ? "0.8" : "0.9"} />
          <stop offset="1" stopColor={v.pal.cream} stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots}
    </svg>
  );
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
const GRAIN_SRC = "cheekypint2/grain.png";
const GRAIN_W = 1296;
const GRAIN_H = 2304;
export type AirStageProps = {
  v: AirView;
  shafts?: number;
  motes?: number;
  grade?: number;
  grain?: number;
  vignette?: number;
  /** a faint bloom on orange (only orange: an SVG filter that isolates it) */
  bloom?: number;
  /** shafts behind the world instead of in front of it */
  shaftsBehind?: boolean;
  lamp?: Lamp;
  window?: WindowLight;
  children?: React.ReactNode;
  /** a layer between the mid and the near motes (things very close to the lens) */
  front?: React.ReactNode;
  /** above everything but the grade, vignette and grain */
  overlay?: React.ReactNode;
};
export const AirStage: React.FC<AirStageProps> = ({ v, shafts = 1, motes = 1, grade = 1, grain = 1, vignette = 1, bloom = 0, shaftsBehind = false, lamp, window: win, children, front, overlay }) => {
  const uid = uidOf(useId());
  const stops = Array.from({ length: 21 }, (_, i) => `${rgbHex(v.airAtScreen((H * i) / 20))} ${f3((100 * i) / 20)}%`).join(", ");
  const sun = v.mood.sun;
  const g2 = Math.floor(v.frame / 2);
  const grx = (hash01(g2 + 1) * 2 - 1) * 96;
  const gry = (hash01(g2 + 7) * 2 - 1) * 96;
  const cream = hexRgb(v.pal.cream);
  const shaftLayer = shafts > 0 ? <Shafts v={v} strength={shafts} lamp={lamp} win={win} /> : null;
  return (
    <AbsoluteFill style={{ backgroundColor: rgbHex(v.airAtScreen(H / 2)), overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${stops})` }} />
      {shaftsBehind ? shaftLayer : null}
      {motes > 0 ? <Motes v={v} layer={0} density={motes} lamp={lamp} /> : null}
      {motes > 0 ? <Motes v={v} layer={1} density={motes} half={0} lamp={lamp} /> : null}
      {bloom > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id={`${uid}bl`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              {/* alpha = how orange a pixel is (red high, blue low): cream, umber and teal fall below zero */}
              <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0.8 0 0 0  0 0 0.3 0 0  1.25 0 -1.7 0 -0.3" result="o" />
              <feGaussianBlur in="o" stdDeviation="9" result="b1" />
              <feGaussianBlur in="o" stdDeviation="34" result="b2" />
              <feComponentTransfer in="b1" result="b1a">
                <feFuncA type="linear" slope={f3(0.75 * bloom)} />
              </feComponentTransfer>
              <feComponentTransfer in="b2" result="b2a">
                <feFuncA type="linear" slope={f3(0.45 * bloom)} />
              </feComponentTransfer>
              <feBlend in="b1a" in2="SourceGraphic" mode="screen" result="s1" />
              <feBlend in="b2a" in2="s1" mode="screen" />
            </filter>
          </defs>
        </svg>
      ) : null}
      <AbsoluteFill style={bloom > 0 ? { filter: `url(#${uid}bl)` } : undefined}>{children}</AbsoluteFill>
      {/* the light's glow: veiling light IN the air, in front of the world, so sky and far ground share it (no step) */}
      {sun.a > 0 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse ${sun.r}px ${f3(sun.r * 1.15)}px at ${sun.x}px ${sun.y}px, ${rgba(cream, sun.a)} 0%, ${rgba(cream, sun.a * 0.32)} 42%, ${rgba(cream, 0)} 100%)`,
          }}
        />
      ) : null}
      {shaftsBehind ? null : shaftLayer}
      {motes > 0 ? <Motes v={v} layer={1} density={motes} half={1} lamp={lamp} /> : null}
      {front}
      {motes > 0 ? <Motes v={v} layer={2} density={motes} lamp={lamp} /> : null}
      {overlay}
      {grade > 0 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "soft-light",
            opacity: grade,
            background: `linear-gradient(to bottom, ${v.pal.grade.top} 0%, ${v.pal.grade.mid} 45%, ${v.pal.grade.bottom} 100%)`,
          }}
        />
      ) : null}
      {vignette > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 104% 100% at 50% 46%, rgba(${v.pal.vignette},0) 45%, rgba(${v.pal.vignette},${f3(0.15 * vignette)}) 72%, rgba(${v.pal.vignette},${f3(0.32 * vignette)}) 100%)`,
          }}
        />
      ) : null}
      {grain > 0 ? (
        <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.3 * grain }}>
          <Img src={staticFile(GRAIN_SRC)} style={{ position: "absolute", left: (W - GRAIN_W) / 2 + grx, top: (H - GRAIN_H) / 2 + gry, width: GRAIN_W, height: GRAIN_H }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ===================================================================================================================
// DEPTH HELPERS (SVG, screen px)
// ===================================================================================================================
/** the air along screen rows y0..y1 as an SVG userSpace gradient (paint a shape with it at the fog amount) */
export const AirGradient: React.FC<{ id: string; v: AirView; y0?: number; y1?: number; n?: number }> = ({ id, v, y0 = 0, y1 = H, n = 8 }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
    {Array.from({ length: n + 1 }, (_, i) => (
      <stop key={i} offset={f3(i / n)} stopColor={rgbHex(v.airAtScreen(lerp(y0, y1, i / n)))} />
    ))}
  </linearGradient>
);
/**
 * InAir — pull an SVG group (drawn in screen px) toward the air behind it. `amount`: a number or a function of screen
 * y (a tall object fogs into lighter air at its top). The colour follows the stage's air by screen row. `blur` (px)
 * softens distant things. The children render twice (the body and the fog's alpha mask).
 */
export const InAir: React.FC<{ v: AirView; amount: number | ((sy: number) => number); blur?: number; children?: React.ReactNode }> = ({ v, amount, blur = 0, children }) => {
  const uid = uidOf(useId());
  const N = 12;
  const stops = Array.from({ length: N + 1 }, (_, i) => {
    const sy = -200 + ((H + 400) * i) / N;
    return { off: i / N, c: rgbHex(v.airAtScreen(sy)), a: c01(typeof amount === "number" ? amount : amount(sy)) };
  });
  const style = blur > 0.05 ? { filter: `blur(${f3(blur)}px)` } : undefined;
  if (Math.max(...stops.map((s) => s.a)) < 0.003) return <g style={style}>{children}</g>;
  return (
    <g style={style}>
      <defs>
        <filter id={`${uid}w`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
        </filter>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
          <g filter={`url(#${uid}w)`}>{children}</g>
        </mask>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={-200} x2="0" y2={H + 200}>
          {stops.map((s, i) => (
            <stop key={i} offset={f3(s.off)} stopColor={s.c} stopOpacity={f3(s.a)} />
          ))}
        </linearGradient>
      </defs>
      {children}
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={`url(#${uid}g)`} mask={`url(#${uid}m)`} />
    </g>
  );
};
/** the horizon as a soft zone, not a line: the ground's far band melts into the air. Paint it OVER THE GROUND ONLY
 *  (before any standing object, which fogs by its own distance). `below` px under the horizon row it is gone. */
export const AirHorizonHaze: React.FC<{ v: AirView; below?: number; strength?: number; id: string }> = ({ v, below = 170, strength = 1, id }) => {
  const c = rgbHex(v.airAt(1e9, 0));
  const y0 = v.horizon - 2;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + below)}>
          {[0, 0.2, 0.45, 0.7, 1].map((o) => (
            <stop key={o} offset={o} stopColor={c} stopOpacity={f3(strength * Math.pow(1 - o, 1.8))} />
          ))}
        </linearGradient>
      </defs>
      <rect x={-20} y={f3(y0)} width={W + 40} height={f3(below)} fill={`url(#${id})`} />
    </g>
  );
};
/** the same for a canvas cut */
export const paintHorizonHaze = (ctx: CanvasRenderingContext2D, v: AirView, below = 170, strength = 1) => {
  const c = v.airAt(1e9, 0);
  const y0 = v.horizon - 2;
  const g = ctx.createLinearGradient(0, y0, 0, y0 + below);
  [0, 0.2, 0.45, 0.7, 1].forEach((o) => g.addColorStop(o, rgba(c, strength * Math.pow(1 - o, 1.8))));
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, below);
};
/** a soft contact shadow in the medium's shadow colour (screen px; amount 0..1) */
export const AirContactShadow: React.FC<{ v: AirView; cx: number; cy: number; rx: number; ry: number; amount?: number; id: string }> = ({ v, cx, cy, rx, ry, amount = 1, id }) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={v.pal.shadow} stopOpacity={f3(0.75 * amount)} />
        <stop offset="0.55" stopColor={v.pal.shadow} stopOpacity={f3(0.42 * amount)} />
        <stop offset="1" stopColor={v.pal.shadow} stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx={f3(cx)} cy={f3(cy)} rx={f3(Math.max(0.5, rx))} ry={f3(Math.max(0.5, ry))} fill={`url(#${id})`} />
  </g>
);
/** a cream rim of light along the TOP edges of a shape: the shape in the rim colour, covered by the body shifted down
 *  by w (px) and softened (oceanShared RimLit). Use as the shape's own paint. */
export const AirRim: React.FC<{ d: string; body: string; rim: string; rimOpacity?: number; w: number; soft?: number; id: string }> = ({ d, body, rim, rimOpacity = 0.7, w, soft = 0.5, id }) => (
  <g>
    <defs>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>
      <path d={d} fill={rim} fillOpacity={rimOpacity} />
      <path d={d} fill={body} transform={`translate(0 ${f3(w)})`} style={{ filter: soft > 0 ? `blur(${f3(w * soft)}px)` : undefined }} />
      <path d={d} fill={body} transform={`translate(0 ${f3(w * 1.6)})`} />
    </g>
  </g>
);
