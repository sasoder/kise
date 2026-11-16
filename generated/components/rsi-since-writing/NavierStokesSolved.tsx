// ---------------------------------------------------------------------------
// NavierStokesSolved (rsi-since-writing, cut 42). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 114 frames.
// One stage inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective, from the
// kit kits/dwarkesh-3d/dwarkesh3d. The vortex is cut-local (below), drawn as depth-sorted SVG tube pieces.
//
// CHECK LINE: "OpenAI's own model solved Navier-Stokes: broken, disordered flow joins into one clean vortex."
//
// THE LINE: "OpenAI reported two months ago that an internal model solved the Navier-Stokes problem,"
// WORD -> FRAME (f0 = sequence 42.3757 s): OpenAI 1 · reported 11 · two 19 · months 26 · ago 31 · that 36 · an 46 ·
// internal 48 · model 56 · SOLVED 66 · the 83 · NAVIER-STOKES 86 · PROBLEM 102 · (slot ends; "one" 113)
// DURATION: the slot 42.3757 -> 47.1304 s = 4.7547 s x 23.976 = 114 frames (f0..f113).
//
// REVISION (user's notes): no formula, no text. The internal model = the OpenAI mark; the flow = the swirl (the
// vertical vortex of many lit cream streamline tubes after the user's reference assets-src/sam-navier-stokes/
// user_vortex.png). sam-navier-stokes/vortexSky's <Vortex> needs its own WebGL cruise sky and camera (VCtx), so it
// cannot stand in this air world: this is a lighter SVG look-alike, its tube recipe COPIED from vortexSky buildTubes
// ("hi": a rope of tight core helices, a sheath of middle helices, outer arms flaring wide on a tilted waist disc,
// needle tips), one sense of rotation, the core turning faster than the rim.
//
// THE MOTION: the OpenAI mark stands in the air at the left (a solid orange glyph with a perspective extrusion, a soft
// glow, a contact shadow and a light pool on the floor). Beside it, the flow unsolved: a loose round cloud of short
// broken cream streamline pieces (each tube of the vortex cut into 30-point pieces, ~38 % of them shown), each kinked,
// pointing its own way, drifting and turning: no common axis, no helix. On "internal model" (f46-58) the mark
// brightens and five orange filaments reach from it into the cloud's foot (f50 -> ~f66). On "solved" the pieces fly
// to their places on the vortex, join up and wrap round the axis, from the foot (f59-70) to the crown (f83-94): order
// appears bottom to top, the hidden pieces growing in as they join; the clean, symmetric vortex of the reference by f94.
// Right behind the order, an orange front climbs the core and the inner helices (f65 -> f99, visible from ~f68); the
// outer sheath and the waist arms stay lit cream, the orange only touching the arms' roots (two-tone, like the user's
// reference: an orange core inside the cooler outer tubes). Settled (f94-113): the vortex turning (core faster than
// rim), a slow glint climbing the orange core; the filaments settle to half strength.
// THE GLIMMER (round 2): one clear specular sweep across the finished swirl, foot-left to crown-right, f86 -> ~f97
// (lands on "Navier-Stokes"): a narrow white glint along the tubes where their sides face the light, in a soft sheen.
// THE CAMERA (round 2, three moves): f0-8 tight on the mark (~520 px wide, lit on "OpenAI"); one eased pull-back
// f8 -> f50 to the whole stage (k 0.9 -> 0.45); a brief settle to f66; on "solved" a push-in on the vortex
// (f66 -> f100, ease-in-out, k 0.45 -> ~0.57: the finished swirl ~815 px tall) carried into a slow creep to f113.
// Orange = the AI only (COMMON.md): the mark, its filaments, the front on the tubes. The unsolved flow is cream.
//
// DEPTH: eye at Y -1150, dRef 3200 at kRef 0.5, dolly 0.35; fog "depth" (the vortex fogs from 420 behind its axis's
// front, a cheat so its near tubes stay as crisp as the mark). The vortex's foot X 0, Z 700, height 1750 (waist arms
// up to ~0.44 H from the axis, ARM 1.2 x vortexSky's); the mark X -877, Z 260, 640 tall, extrusion 110, hovering 150
// above the floor. The mark's glow is stacked flat circles (an SVG blur or radial gradient on it drew a stray copy at
// the horizon under the AirStage bloom). The waist arms come in opposite pairs (same reach, half a turn apart) on a
// waist disc tilted toward the camera (half vortexSky's tilt), so the settled vortex is symmetric about its axis.
//
// CHECKS (round 2 preview, every frame, scripts in the builder's scratch): the mark's box stays inside y 506-1062
// on every frame (x 36-802; at f0 it is the subject, centre 540, 770); the vortex points reach y <= 1067 on every
// frame (the cloud runs off the top and right while the camera is tight on the mark), at the end x 377-945,
// y 240-1066 (its needle tip ~50 px into the dead top zone); no stroke joins two
// broken pieces (max step between path points < 60 px); nothing in the caption bands but
// floor and shadows. Frame-to-frame luma change smooth (no pops; the odd/even ripple is the stage's grain on twos).
//
// SOURCES / HONEST CHEATS: a picture of the flow, not a simulation: the tubes turn rigidly per family (core faster
// than rim) where a steady flow's streamlines would stand still; the broken pieces are the same tubes cut up and
// scattered (analytic, seek-safe). The OpenAI report is the speaker's account: nothing about it on screen. The mark: kits/dwarkesh/brandGlyphs
// OPENAI (Simple Icons, verbatim path).
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, ACCENT, ACCENT_DEEP, AirFloor, AirShadow, AirStage, MAT, ORANGE_LINE, WorldSvg, airWorldOf, c01, mixHex, swayCam, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";

export const FPS = 24000 / 1001;
export const DURATION = 114;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
type P2 = [number, number];
type V3 = [number, number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sst = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const f2 = (v: number) => v.toFixed(2);

// ===================================================================================================================
// THE WORLD
// ===================================================================================================================
export const DEPTH: DepthOpts = { eyeY: -1150, dRef: 3200, kRef: 0.5, dolly: 0.35 };
/** the vortex: foot on the floor at (VX, 0, VZ), height VH */
export const VX = 0;
export const VZ = 700;
export const VH = 1750;
/** the vortex fogs from its own front (a cheat: its nearest tubes as crisp as the mark) */
const VFOG = 420;
/** the mark: centre (MX, MY, MZ), size MS (its 24-unit box), extrusion depth MT */
export const MX = -877;
export const MZ = 260;
export const MS = 640;
const MT = 110;
const MHOVER = 150;
export const MY = -(MHOVER + MS / 2);

// ===================================================================================================================
// THE CAMERA: three moves. (1) f0-8 tight on the mark (~520 px wide, centre y 770); (2) one eased pull-back f8 -> f50
// to the whole stage (k 0.45: the mark and the cloud it works on), a brief settle to f66; (3) on "solved" a push-in on
// the vortex (f66 -> ~f100, ease-in-out: the finished swirl ~810 px tall, its axis at the frame's middle), carried
// into a slow living creep (in and a little left) to the end, so it never stops dead.
// Each key is solved for its subject's screen place (the eye follows cx, and the dolly changes Dc with k).
// ===================================================================================================================
const persp = (k: number) => DEPTH.dRef * Math.pow(DEPTH.kRef / k, DEPTH.dolly);
/** the camera that puts world point (X, Y, Z) at screen (sx, sy) at zoom k */
const camOn = (k: number, X: number, Y: number, Z: number, sx: number, sy: number): Cam => {
  const Dc = persp(k);
  const r = Dc / (Dc + Z);
  return { k, cx: X - (sx - 540) / (r * k), cy: DEPTH.eyeY + (Y - DEPTH.eyeY) * r - (sy - 960) / k };
};
/** the zoom at which the vortex stands `px` tall on screen */
const kForVortex = (px: number) => {
  let k = 0.5;
  for (let i = 0; i < 30; i++) {
    const Dc = persp(k);
    k = px / (VH * (Dc / (Dc + VZ)));
  }
  return k;
};
const KEY0 = camOn(0.9, MX, MY, MZ, 540, 770);
const KEY1 = camOn(0.45, VX, 0, VZ, 655, 1045);
const K_END = kForVortex(815);
const KEY3 = camOn(K_END, VX, 0, VZ, 650, 1066);
const smoother = (u: number) => {
  const v = c01(u);
  return v * v * v * (v * (6 * v - 15) + 10);
};
const camLerp = (A: Cam, B: Cam, p: number): Cam => ({ k: A.k * Math.pow(B.k / A.k, p), cx: lerp(A.cx, B.cx, p), cy: lerp(A.cy, B.cy, p) });
export const PULL = [8, 50] as const;
export const PUSH = [66, 100] as const;
export const camAt = (f: number): Cam => {
  if (f < PUSH[0]) return camLerp(KEY0, KEY1, smoother((f - PULL[0]) / (PULL[1] - PULL[0])));
  // the push arrives at 95 % by f100 and creeps on (the last 5 %, linear from f88) to the end
  const p = 0.95 * smoother((f - PUSH[0]) / (PUSH[1] - PUSH[0])) + 0.05 * c01((f - 88) / (DURATION - 1 - 88));
  return camLerp(KEY1, KEY3, p);
};
const REST = swayCam(camAt(0), 0);

// ===================================================================================================================
// THE BEATS
// ===================================================================================================================
/** the mark brightens on "internal model" */
export const markGlow = (f: number) => sst(46, 58, f);
/** the mark lights on "OpenAI" (f1) */
export const markLit = (f: number) => sst(0, 5, f);
/** THE GLIMMER: one specular sweep across the finished swirl, foot-left to crown-right, f85 -> f102 (lands on
 *  "Navier-Stokes"): its front on the sweep coordinate (height fraction + 0.45 x across), a narrow hot core (the
 *  specular glint, strongest where a tube's side faces the light) inside a softer sheen */
export const GLIM = [85, 102] as const;
export const glimFront = (f: number) => {
  const u = c01((f - GLIM[0]) / (GLIM[1] - GLIM[0]));
  return lerp(-0.06, 1.38, 0.7 * u + 0.3 * u * u * (3 - 2 * u));
};
const GLIM_CORE = 0.05;
const GLIM_SHEEN = 0.16;
const GLIM_WHITE = "#FFFDF6";
/** the filaments reach from the mark into the cloud's foot */
const FIL_F0 = 50;
const FIL_DUR = 12;
/** the organising front (height fraction) climbs from the base on "solved" */
/** ORDER APPEARS: each point of the flow flies from its broken piece into its place on the vortex over ORG_DUR frames,
 *  starting at ORG_F0 + ORG_SPAN * (its height): the foot from f59, the crown done by f94 */
const ORG_F0 = 59;
const ORG_SPAN = 24;
const ORG_DUR = 11;
export const orgAt = (f: number, h: number) => sst(0, 1, (f - ORG_F0 - ORG_SPAN * c01(h)) / ORG_DUR);
/** the orange front (height fraction), right behind the organising front; complete by f100 */
export const fillLevel = (f: number) => lerp(-0.06, 1.08, 1 - Math.pow(1 - c01((f - 65) / 34), 1.4));

// ===================================================================================================================
// THE VORTEX GEOMETRY (local units: height 1, the axis on local Y up, the foot at the origin). Copied from
// sam-navier-stokes/vortexSky buildTubes "hi" (seed 1), with fatter tubes (TK) for a 720 px tall vortex.
// ===================================================================================================================
type Seg = { c0: V3; v: V3; d: V3; n1: V3; n2: V3; L: number; kink: number; ku: number; wob: number; w: number; vis: number };
type Tube = { c: V3[]; rad: number[]; h: number[]; s: number[]; lead: number; fam: number; root: number; ph: number; inner: boolean; segs: Seg[] };
const TK = 2.1;
/** the waist arms reach a little wider than vortexSky's (they fill the frame's width) */
const ARM = 1.2;
const SEED = 1;
/** the inner share of the middle helices that the orange front takes (with the core); the outer sheath stays cream */
const INNER_MID = 0.5;
/** the broken pieces: SEG points each (a multiple of PIECE), the cloud's radius (local), the share shown in the chaos */
const SEG = 30;
const CLOUD_R = 0.4;
const CHAOS_SHOW = 0.38;
const unit = (v: V3): V3 => {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const buildTubes = (): Tube[] => {
  const R0 = (k: string) => random(`vortex-${SEED}-${k}`);
  const ch = {
    width: lerp(0.92, 1.08, R0("w")),
    turns: lerp(0.9, 1.12, R0("t")),
    count: lerp(0.85, 1.15, R0("n")),
    waist: lerp(0.47, 0.55, R0("waist")),
    tilt: lerp(0.3, 0.45, R0("tilt")) * 0.5,
    tiltDir: Math.PI / 2, // the waist disc dips toward / away from the camera: symmetric left and right
  };
  const R = (k: string) => random(`vortex-${SEED}-h-${k}`);
  const D = { core: 18, mid: 18, outer: 34, segH: 300, segO: 160 };
  const tubes: Tube[] = [];
  const nCore = Math.max(4, Math.round(D.core * ch.count));
  const nMid = Math.max(4, Math.round(D.mid * ch.count));
  const nOut = Math.max(6, Math.round(D.outer * ch.count));
  const W = ch.width;
  const waist = ch.waist;
  const spindle = (h: number) => {
    if (h < waist) {
      const d = c01((waist - h) / waist);
      return lerp(1, 0.42, Math.pow(d, 2.2)) * (1 + 0.2 * (1 - sst(0, 0.12, h)));
    }
    const u = c01((h - waist) / (1 - waist));
    return lerp(1, 0.42, Math.pow(u, 2.2));
  };
  const tilt = (r: number, th: number) => ch.tilt * r * Math.cos(th - ch.tiltDir);
  const push = (t: Tube, r: number, th: number, h: number, rad: number, s: number) => {
    t.c.push([r * Math.cos(th), h, r * Math.sin(th)]);
    t.rad.push(rad);
    t.h.push(h);
    t.s.push(s);
  };
  const coreTurns = lerp(6.5, 7.5, R("ct")) * ch.turns;
  for (let i = 0; i < nCore; i++) {
    const k = `c${i}`;
    const layer = (i % 3) / 2;
    const r0 = lerp(0.008, 0.03, layer) * W * lerp(0.95, 1.05, R(k + "r"));
    const h0 = 0.01 + 0.03 * R(k + "a");
    const h1 = 0.98 + 0.04 * R(k + "b");
    const th0 = ((i + 0.15 * R(k + "p")) / nCore) * Math.PI * 2;
    const tr = lerp(0.0028, 0.0034, R(k + "w")) * TK;
    const lead = 0.016 + lerp(-0.012, 0.012, R(k + "l"));
    const N = D.segH;
    const t: Tube = { c: [], rad: [], h: [], s: [], lead, fam: 0, root: 0, ph: R(k + "ph") * 6.283, inner: true, segs: [] };
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      const h = lerp(h0, h1, u);
      const r = r0 * (0.3 + 0.7 * spindle(h)) * (1 + 0.8 * sst(0.92, 1.03, h));
      push(t, r, th0 + coreTurns * Math.PI * 2 * (h - h0), h, tr * Math.pow(sst(0, 0.08, u), 0.8) * Math.pow(1 - sst(0.86, 1, u), 0.6), u);
    }
    tubes.push(t);
  }
  const midTurns = lerp(2.9, 3.3, R("mt")) * ch.turns;
  for (let i = 0; i < nMid; i++) {
    const k = `m${i}`;
    const r0 = lerp(0.055, 0.15, (i + 0.4 * R(k + "r")) / nMid) * W;
    const h0 = lerp(0.0, 0.07, R(k + "a"));
    const h1 = lerp(0.86, 0.99, R(k + "b"));
    const th0 = ((i * 0.618034) % 1) * Math.PI * 2;
    const tr = lerp(0.0026, 0.0034, R(k + "w")) * TK;
    const lead = lerp(-0.015, 0.015, R(k + "l"));
    const N = Math.round(D.segH * 0.8);
    const t: Tube = { c: [], rad: [], h: [], s: [], lead, fam: 1, root: 0, ph: R(k + "ph") * 6.283, inner: i < nMid * INNER_MID, segs: [] };
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      const hb = lerp(h0, h1, u);
      const r = r0 * (0.12 + 0.88 * Math.pow(spindle(hb), 1.1));
      const th = th0 + midTurns * Math.PI * 2 * (hb - h0);
      const h = hb + tilt(r, th) * Math.exp(-Math.pow((hb - waist) / 0.2, 2));
      push(t, r, th, h, tr * Math.pow(sst(0, 0.12, u), 0.8) * Math.pow(1 - sst(0.84, 1, u), 0.6), u);
    }
    tubes.push(t);
  }
  const outTurns = lerp(1.05, 1.2, R("ot")) * ch.turns;
  for (let i = 0; i < nOut; i++) {
    const k = `o${i}`;
    const up = i % 2 === 0;
    const hA = waist + (up ? 1 : -1) * lerp(0.1, 0.3, R(k + "a"));
    const hW = waist + lerp(-0.035, 0.035, R(k + "hw"));
    const rA = lerp(0.05, 0.09, R(k + "ra")) * W;
    // arms in opposite pairs (same reach, half a turn apart, one rooted above the waist, one below): symmetric
    const pr = Math.floor(i / 2);
    const nPr = Math.ceil(nOut / 2);
    const rM = lerp(0.19, 0.34, Math.pow((pr + 0.5 * R(`o${2 * pr}rm`)) / nPr, 0.9)) * W * ARM;
    const th0 = ((pr * 0.381966) % 1) * Math.PI * 2 + (i % 2) * Math.PI;
    const tr = lerp(0.0022, 0.003, R(k + "w")) * TK;
    const lead = lerp(-0.03, 0.01, R(k + "l"));
    const N = D.segO;
    const t: Tube = { c: [], rad: [], h: [], s: [], lead, fam: 2, root: hA, ph: R(k + "ph") * 6.283, inner: false, segs: [] };
    for (let j = 0; j <= N; j++) {
      const u = j / N;
      const r = lerp(rA, rM, Math.pow(u, 0.85));
      const th = th0 + outTurns * Math.PI * 2 * u;
      const toW = 1 - Math.pow(1 - u, 2.2);
      const h = lerp(hA, hW, toW) + tilt(r, th) * toW;
      push(t, r, th, h, tr * Math.pow(sst(0, 0.1, u), 0.8) * Math.pow(1 - u, 1.1) * 2.0, u);
    }
    tubes.push(t);
  }
  // THE BROKEN PIECES: every tube cut into SEG-point pieces, each with its own place in a loose cloud, drift,
  // direction (all directions, no common axis), length and kink
  tubes.forEach((t, ti) => {
    for (let g = 0; g * SEG < t.c.length; g++) {
      const Q = (k: string) => random(`ns-seg-${ti}-${g}-${k}`);
      const y = lerp(0.08, 0.92, Q("y"));
      const phi = Q("phi") * Math.PI * 2;
      const rho = CLOUD_R * Math.sqrt(Q("rho")) * (0.3 + 0.7 * Math.sqrt(Math.max(0, 1 - Math.pow(2 * y - 1, 2)))); // a loose round cloud
      const dir = unit([Q("dx") - 0.5, Q("dy") - 0.5, Q("dz") - 0.5]);
      const n1 = unit(cross(dir, Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
      const n2 = cross(dir, n1);
      const vd = unit([Q("vx") - 0.5, Q("vy") - 0.5, Q("vz") - 0.5]);
      const vs = lerp(0.0012, 0.003, Q("vs"));
      t.segs.push({
        c0: [rho * Math.cos(phi), y, rho * Math.sin(phi)],
        v: [vd[0] * vs, vd[1] * vs * 0.7, vd[2] * vs],
        d: dir,
        n1,
        n2,
        L: lerp(0.07, 0.14, Q("L")),
        kink: lerp(-0.45, 0.45, Q("k")),
        ku: lerp(0.3, 0.7, Q("ku")),
        wob: lerp(0.04, 0.1, Q("wb")),
        w: lerp(-0.05, 0.05, Q("w")),
        vis: Q("vis") < CHAOS_SHOW ? 1 : 0,
      });
    }
  });
  return tubes;
};
let TUBES_CACHE: Tube[] | null = null;
const tubes = () => (TUBES_CACHE ??= buildTubes());


/** the turn of each family (radians at frame f): the core faster than the rim */
const SPIN = [0.026, 0.019, 0.014];
const SPIN0 = 0.4;

// ===================================================================================================================
// THE PIECES: every tube cut into short pieces, each with its depth, colour and width; drawn far -> near
// ===================================================================================================================
const PIECE = 5;
const LIGHT: V3 = (() => {
  const v: V3 = [-0.55, 0.65, -0.5];
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})();
const CREAM_LIT = "#F4E8CE";
const CREAM_SHD = "#8E8774";
const OR_LIT = ACCENT;
/** how far along a waist arm the orange reaches (its root) */
const ARM_ROOT = 0.14;
const OR_SHD = "#B9660B";
const HOT = "#FFE6A8";
type Piece = { Z: number; d: string; w: number; fill: string; casing: string; op: number; glow?: number; gc?: string };

/** a broken piece's point u (0..1 along it) at frame f: a short kinked stroke drifting and turning in the cloud */
const chaosAt = (sg: Seg, u: number, f: number): V3 => {
  const t = f - 40;
  const c: V3 = [sg.c0[0] + sg.v[0] * t, sg.c0[1] + sg.v[1] * t, sg.c0[2] + sg.v[2] * t];
  // the direction turns slowly about n2
  const a = sg.w * t;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const d: V3 = [sg.d[0] * ca + sg.n1[0] * sa, sg.d[1] * ca + sg.n1[1] * sa, sg.d[2] * ca + sg.n1[2] * sa];
  const n1: V3 = [sg.n1[0] * ca - sg.d[0] * sa, sg.n1[1] * ca - sg.d[1] * sa, sg.n1[2] * ca - sg.d[2] * sa];
  const x = (u - 0.5) * sg.L;
  // one sharp kink (a V) and a small wobble across
  const kv = sg.kink * sg.L * (Math.abs(u - sg.ku) - 0.5 * Math.abs(sg.ku - 0.5) - 0.25);
  const wb = sg.wob * sg.L * Math.sin(Math.PI * 2.2 * u + f * 0.08 + sg.kink * 9);
  return [c[0] + d[0] * x + n1[0] * kv + sg.n2[0] * wb, Math.max(0.02, c[1] + d[1] * x + n1[1] * kv + sg.n2[1] * wb), c[2] + d[2] * x + n1[2] * kv + sg.n2[2] * wb];
};
/** one tube's world points at frame f and each point's order (0 = its broken piece in the cloud, 1 = on the vortex) */
const tubeWorld = (t: Tube, f: number): { W: V3[]; o: number[] } => {
  const sp = SPIN0 + SPIN[t.fam] * f;
  const cs = Math.cos(sp);
  const sn = Math.sin(sp);
  const o: number[] = [];
  const W = t.c.map((c, j) => {
    const q: V3 = [c[0] * cs - c[2] * sn, c[1], c[0] * sn + c[2] * cs];
    const hc = t.fam === 2 ? Math.max(t.root, t.h[j]) : t.h[j];
    const oj = orgAt(f, hc);
    o.push(oj);
    if (oj < 1) {
      const g = Math.floor(j / SEG);
      const u = (j - g * SEG) / (SEG - 1);
      const x = chaosAt(t.segs[g], Math.min(1, u), f);
      q[0] = lerp(x[0], q[0], oj);
      q[1] = lerp(x[1], q[1], oj);
      q[2] = lerp(x[2], q[2], oj);
    }
    return [VX + q[0] * VH, -q[1] * VH, VZ + q[2] * VH] as V3;
  });
  return { W, o };
};
/** CHECKS: every vortex point and the mark's box on screen at frame f (no sway) */
export const screenExtents = (f: number, P: { p: (X: number, Y: number, Z: number) => P2; r: (Z: number) => number }, cam: Cam) => {
  const sc = (w: P2): P2 => [540 + (w[0] - cam.cx) * cam.k, 960 + (w[1] - cam.cy) * cam.k];
  const box = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
  for (const t of tubes()) {
    const { W, o } = tubeWorld(t, f);
    W.forEach((w, j) => {
      if (t.rad[j] < 1e-4) return;
      if (o[j] < 0.3 && !t.segs[Math.floor(j / SEG)].vis) return;
      const s2 = sc(P.p(w[0], w[1], w[2]));
      box.x0 = Math.min(box.x0, s2[0]);
      box.x1 = Math.max(box.x1, s2[0]);
      box.y0 = Math.min(box.y0, s2[1]);
      box.y1 = Math.max(box.y1, s2[1]);
    });
  }
  const mc = sc(P.p(MX, MY, MZ));
  const mh = (MS / 2) * P.r(MZ) * cam.k;
  return { vortex: box, mark: { x0: mc[0] - mh, x1: mc[0] + mh, y0: mc[1] - mh, y1: mc[1] + mh } };
};

const vortexPieces = (A: AirWorld, f: number): Piece[] => {
  const P = A.P;
  const out: Piece[] = [];
  const Lf = fillLevel(f);
  const ts = tubes();
  for (const t of ts) {
    const { W, o } = tubeWorld(t, f);
    const n = W.length;
    const S: P2[] = W.map((w) => P.p(w[0], w[1], w[2]));
    for (let a = 0; a < n - 1; a += PIECE) {
      const b = Math.min(n - 1, a + PIECE);
      const m = Math.floor((a + b) / 2);
      // the broken pieces: a piece's ends are not joined until both sides are in place; half the pieces are hidden in
      // the chaos and grow in as they join; each piece tapers to its ends while broken
      const g = Math.floor(a / SEG);
      const sg = t.segs[g];
      const om = o[m];
      const uIn = (m - g * SEG + 0.5) / SEG;
      const show = lerp(sg.vis, 1, sst(0.3, 1, om)) * lerp(Math.pow(Math.sin(Math.PI * c01(uIn)), 0.6), 1, om);
      const rad = t.rad[m] * show;
      if (rad <= 1e-5) continue;
      const wa = W[a];
      const wb = W[b];
      const T: V3 = [wb[0] - wa[0], wb[1] - wa[1], wb[2] - wa[2]];
      const tl = Math.hypot(...T) || 1;
      const td = (T[0] * LIGHT[0] - T[1] * LIGHT[1] + T[2] * LIGHT[2]) / tl;
      const kd = Math.sqrt(Math.max(0, 1 - td * td));
      const Zm = W[m][2];
      const Zf = Math.max(0, Zm - VFOG);
      const hUp = -W[m][1];
      // the orange front: by height on the core and the sheath; along the arm (from its root) on the waist arms
      const hc = t.h[m];
      let orange = false;
      let hot = 0;
      if (t.fam === 2) {
        // the waist arms stay cream: the orange only touches their roots
        const reach = ARM_ROOT * c01((Lf + t.lead - t.root) / 0.06);
        orange = Lf + t.lead > t.root && t.s[m] < reach;
        hot = orange && reach < ARM_ROOT ? sst(reach - 0.05, reach, t.s[m]) : 0;
      } else if (!t.inner) {
        orange = false;
      } else {
        const lv = Lf + t.lead;
        orange = hc < lv;
        hot = orange ? sst(lv - 0.035, lv, hc) * c01((1.0 - lv) / 0.05 + 1) : 0;
      }
      // the settled glint: a slow bright band climbing the tubes
      const glint = orange ? 0.5 + 0.5 * Math.sin(6.283 * (hc * 2.2 - f / 30) + t.ph) : 0;
      const sheen = Math.pow(kd, 3);
      let col: string;
      if (orange) {
        col = mixHex(OR_SHD, OR_LIT, 0.25 + 0.75 * kd);
        col = mixHex(col, CREAM_LIT, 0.22 * sheen + 0.1 * glint * sst(96, 104, f));
        col = mixHex(col, HOT, hot);
        col = A.toneO(col, Zf, hUp);
      } else {
        col = mixHex(CREAM_SHD, CREAM_LIT, 0.2 + 0.8 * kd);
        col = A.tone(col, Zf, hUp);
      }
      // THE GLIMMER: a specular band sweeping across the swirl, strongest where a tube faces the light
      const sig = hUp / VH + 0.45 * (W[m][0] - VX) / VH;
      let spec = 0;
      if (f > GLIM[0] - 1 && f < GLIM[1] + 2) {
        const dsg = sig - glimFront(f);
        const core = Math.exp(-Math.pow(dsg / GLIM_CORE, 2));
        const sheenB = 0.2 * Math.exp(-Math.pow(dsg / GLIM_SHEEN, 2));
        spec = om * Math.min(1, core * (0.2 + 0.8 * Math.pow(kd, 5)) * 1.3 + sheenB * kd * kd);
      }
      if (spec > 0.01) col = mixHex(col, GLIM_WHITE, spec);
      const r = P.r(Zm);
      const wpx = 2 * rad * VH * r * (1 + 0.35 * spec);
      const casing = orange ? A.toneO(mixHex(ORANGE_LINE, PAL.shadow, 0.35), Zf, hUp) : A.tone(mixHex(PAL.shadow, "#3E4A46", 0.3), Zf, hUp);
      const linked = (j: number) => o[j] > 0.97 && o[j + 1] > 0.97;
      const a0 = a > 0 && (a % SEG !== 0 || linked(a - 1)) ? a - 1 : a;
      const b1 = b % SEG === 0 && !linked(b - 1) ? b - 1 : b;
      let d = "";
      for (let j = a0; j <= b1; j++) d += `${j === a0 ? "M" : "L"}${f2(S[j][0])},${f2(S[j][1])}`;
      const glow = Math.max(hot > 0.3 ? hot : 0, spec > 0.6 ? spec : 0);
      out.push({ Z: Zm, d, w: wpx, fill: col, casing, op: 1, glow: glow > 0 ? glow : undefined, gc: spec > hot ? GLIM_WHITE : undefined });
    }
  }
  return out;
};

// THE FILAMENTS: from the mark's right side into the cloud's foot (world 3D quadratic curves)
const FILS = Array.from({ length: 5 }, (_, i) => {
  const R = (k: string) => random(`ns-fil-${i}-${k}`);
  const a = (i / 4 - 0.5) * 1.1;
  const start: V3 = [MX + 0.36 * MS * Math.cos(a), MY + 0.36 * MS * Math.sin(a), MZ];
  const hh = lerp(0.05, 0.3, (i + 0.5 * R("h")) / 5);
  const ang = lerp(2.4, 3.6, R("a")); // the side facing the mark (-X)
  const rr = lerp(0.03, 0.08, R("r"));
  const end: V3 = [VX + rr * VH * Math.cos(ang), -hh * VH, VZ + rr * VH * Math.sin(ang)];
  const mid: V3 = [lerp(start[0], end[0], 0.5), Math.min(start[1], end[1]) - lerp(120, 320, R("m")), lerp(start[2], end[2], 0.5) - lerp(60, 200, R("z"))];
  return { start, mid, end, delay: i * 1.6 + 2 * R("d"), w: lerp(8, 11, R("w")) };
});
const bez = (a: V3, b: V3, c: V3, t: number): V3 => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], u * u * a[2] + 2 * u * t * b[2] + t * t * c[2]];
};
const filamentPieces = (A: AirWorld, f: number): Piece[] => {
  const P = A.P;
  const out: Piece[] = [];
  for (const F of FILS) {
    const tt = c01((f - FIL_F0 - F.delay) / FIL_DUR);
    if (tt <= 0) continue;
    const head = 1 - Math.pow(1 - tt, 1.8);
    const N = 36;
    const n = Math.max(2, Math.ceil(N * head));
    const pts: V3[] = Array.from({ length: n + 1 }, (_, j) => bez(F.start, F.mid, F.end, (head * j) / n));
    for (let a = 0; a < n; a += 3) {
      const b = Math.min(n, a + 3);
      const m = pts[Math.floor((a + b) / 2)];
      const r = P.r(m[2]);
      const u = (a + b) / 2 / n;
      // a pulse runs along the filament toward the flow
      const pulse = 0.5 + 0.5 * Math.sin(6.283 * (u * 1.6 - f / 14));
      const tipHot = sst(0.75, 1, u) * (1 - sst(0.98, 1, tt));
      const col = A.toneO(mixHex(mixHex(OR_SHD, OR_LIT, 0.55 + 0.45 * pulse), HOT, tipHot), m[2], -m[1]);
      let d = "";
      const a0 = Math.max(0, a - 1);
      for (let j = a0; j <= b; j++) {
        const s = P.p(pts[j][0], pts[j][1], pts[j][2]);
        d += `${j === a0 ? "M" : "L"}${f2(s[0])},${f2(s[1])}`;
      }
      const taper = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, u * 1.1));
      out.push({ Z: m[2], d, w: F.w * r * taper, fill: col, casing: A.toneO(mixHex(ORANGE_LINE, PAL.shadow, 0.3), m[2], -m[1]), op: 1 - 0.5 * sst(98, 112, f), glow: tipHot > 0.3 ? tipHot : undefined });
    }
  }
  return out;
};

// ===================================================================================================================
// THE MARK: the OpenAI glyph as a solid object (a perspective extrusion: back layers in deep orange, the face lit)
// ===================================================================================================================
const Mark: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  // the face: lit on "OpenAI" (f1), brighter again on "internal model"
  const g = 0.5 * markLit(f) + 0.5 * markGlow(f);
  const bob = 8 * Math.sin((f / 40) * 6.283);
  const layers = 14;
  const at = (Z: number) => {
    const c = P.p(MX, MY + bob, Z);
    const s = (MS / 24) * P.r(Z);
    return `translate(${f2(c[0])} ${f2(c[1])}) scale(${s.toFixed(4)}) translate(-12 -12)`;
  };
  const faceLit = mixHex(mixHex(ACCENT_DEEP, "#9A6A2A", 0.35), ACCENT, g);
  const faceHi = mixHex(mixHex(ACCENT, ACCENT_DEEP, 0.55), "#FFD36A", g);
  const sideA = mixHex(ORANGE_LINE, ACCENT_DEEP, 0.25 + 0.3 * g);
  const sideB = mixHex(ORANGE_LINE, PAL.shadow, 0.35);
  const c = P.p(MX, MY + bob, MZ);
  const rG = MS * P.r(MZ);
  const gl = 0.16 + 0.34 * g;
  return (
    <g>
      <defs>
        <linearGradient id="ns-mface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={A.toneO(faceHi, MZ, -MY)} />
          <stop offset="0.55" stopColor={A.toneO(faceLit, MZ, -MY)} />
          <stop offset="1" stopColor={A.toneO(mixHex(faceLit, ACCENT_DEEP, 0.6), MZ, -MY)} />
        </linearGradient>
      </defs>
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={f2(c[0])} cy={f2(c[1])} r={f2(rG * (0.46 + 0.05 * i))} fill={ACCENT} opacity={f2(0.075 * gl)} />
      ))}
      {Array.from({ length: layers }, (_, i) => {
        const t = 1 - i / (layers - 1);
        const Z = MZ + t * MT;
        return (
          <g key={i} transform={at(Z)}>
            <path d={OPENAI.paths[0]} fill={A.toneO(mixHex(sideA, sideB, t), Z, -MY)} fillRule="evenodd" />
          </g>
        );
      })}
      <g transform={at(MZ)}>
        <path d={OPENAI.paths[0]} fill="url(#ns-mface)" fillRule="evenodd" stroke={A.toneO(mixHex(ACCENT, "#FFE6A8", 0.5 * g), MZ, -MY)} strokeWidth={0.12} strokeOpacity={0.35 + 0.4 * g} />
      </g>
    </g>
  );
};

/** the mark's light pool on the floor */
const MarkPool: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const g = markGlow(f);
  const c = P.p(MX + 60, 0, MZ + 40);
  const rx = 520 * P.r(MZ);
  const ry = Math.abs(P.p(MX, 0, MZ - 260)[1] - P.p(MX, 0, MZ + 260)[1]) / 2;
  return (
    <g>
      <defs>
        <radialGradient id="ns-pool">
          <stop offset="0" stopColor={ACCENT} stopOpacity={0.5} />
          <stop offset="0.5" stopColor={ACCENT} stopOpacity={0.16} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(rx)} ry={f2(ry)} fill="url(#ns-pool)" opacity={0.12 + 0.3 * g} />
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const NavierStokesSolved: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, fogBy: "depth" });
  const pieces = [...vortexPieces(A, frame), ...filamentPieces(A, frame)];
  pieces.sort((p, q) => q.Z - p.Z);
  const lw = 1.3 / cam.k;
  const markZ = MZ;
  const back = pieces.filter((p) => p.Z >= markZ);
  const front = pieces.filter((p) => p.Z < markZ);
  const draw = (ps: Piece[], key: string) => (
    <g key={key}>
      {ps.map((p, i) => (
        <g key={i} opacity={p.op < 1 ? f2(p.op) : undefined}>
          {p.glow ? <path d={p.d} fill="none" stroke={p.gc ?? HOT} strokeOpacity={(p.gc ? 0.3 : 0.35) * p.glow} strokeWidth={f2(p.w * 3.2 + 2 * lw)} strokeLinecap="round" filter="url(#ns-soft)" /> : null}
          <path d={p.d} fill="none" stroke={p.casing} strokeOpacity={0.75} strokeWidth={f2(p.w + 1.6 * lw)} strokeLinecap="butt" strokeLinejoin="round" />
          <path d={p.d} fill="none" stroke={p.fill} strokeWidth={f2(p.w)} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
  return (
    <AirStage v={A.v} bloom={0.24}>
      <WorldSvg cam={cam}>
        <defs>
          <filter id="ns-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={f2(3 / cam.k)} />
          </filter>
        </defs>
        <AirFloor A={A} x0={-9000} x1={9000} z0={-2600} z1={22000} mat={MAT.ground} course={340} jointAmt={0.3} />
        <AirShadow A={A} X={VX} Z={VZ} w={560} d={320} uid="vS" amt={0.75} />
        <MarkPool A={A} f={frame} />
        <AirShadow A={A} X={MX} Z={MZ} w={300} d={150} uid="mS" amt={0.7} />
        {draw(back, "back")}
        <Mark A={A} f={frame} />
        {draw(front, "front")}
      </WorldSvg>
    </AirStage>
  );
};

export default NavierStokesSolved;
