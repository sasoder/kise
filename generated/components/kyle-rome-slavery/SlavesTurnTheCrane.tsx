// ---------------------------------------------------------------------------
// SlavesTurnTheCrane (kyle-rome-slavery, cut 14; replaces MineDrainageWheels). Dwarkesh map style
// (styles/dwarkesh-map.md) in the clip's 3D depth manner (COMMON.md; londonDepth read-only). Opaque 1080x1920,
// 29.97 fps, 129 frames. World, camera and kinematics in slavesTurnTheCranePlan.ts.
//
// CHECK LINE: "Rome's most advanced machine — the great treadwheel crane — was powered by slaves walking inside it."
//
// THE LINE: "(But the good version of that argument would just be that) the Roman Empire is using, in fact, slaves
//   in many of the most forward elements of the economy."
// WORD -> FRAME: the 1 · Roman 3 · Empire 8 · is 16 · using 27 · in 39 · fact 44 · slaves 48 · and 58 · many 64 ·
//   of 71 · the 74 · most 76 · forward 81 · elements 91 · of 101 · the 108 · economy 110 (cut at 129)
// DURATION: the slot 14.815 -> 19.119 s = 4.304 s x 29.97 = 129 frames (f0..f128).
//
// THE MOTION: one crane, one column, one load. f0 the camera is close on two fettered slaves walking inside the great
// treadwheel (the lead ~560 px, face ~y 760), the rim and spokes framing them, the rope paying off the drum on the axle;
// it holds on them through "slaves" (f48), already drifting up, then (f50-f92) rises and pulls back along the rope up
// the jib to the sheave and the marble column drum hanging over the column, so by "forward elements" (f91) the whole
// crane reads: the wheel with its walkers at the bottom left, the jib to the top right, the drum over the column (no
// foreman: standing at the crane's foot his face and hands fall in the caption bands in the wide). f95-f122 the
// walkers ease to a stop, the wheel with them, and the drum settles onto the column
// (contact f122, at rest); a slow creep to f128.
// CAUSE BEFORE EFFECT: the wheel's turn is the integral of the walkers' stride (plan: arcAt / phaseAt; a planted foot
// rides its slat, never sliding); the rope paid out is the wheel's turn x the rope drum's radius, so the drum's descent
// IS the walking: it slows as they slow and stops when they stop (the walkers lower the load; contact f122, first
// reaction the same frame: the drum is at rest on the column, the worker's hands steady on it).
// Orange = the machine (the clip rule): the treadwheel, its rope drum, the sheave, the hook block and the iron tongs.
// Timber umber, marble and people cream, the rope a pale hemp. No text.
//
// DEPTH: londonDepth's model with the eye on the camera's centre line (a crane-up: the VP at the frame centre),
// dRef 2800 at kRef 0.6, dolly 0.4; a flagstone ground plane. Depths: the jib's near leg -40 ->
// 190, the axle bearing -14..18, the rope drum 24..72, the near rim 80, the walkers 150 / 238, the far rim 300, the
// load and the column 190, the scaffold 110..390, the jib's far leg 420 -> 190.
//
// SOURCES (illustrative; nothing on screen): the treadwheel crane of the Tomb of the Haterii relief (Rome, c. AD
//   100-120, Vatican Museums), men walking inside the wheel; Vitruvius, De architectura X.2 (hoisting machines, the
//   polyspastos, the treadwheel); Roman building sites used slave and hired labour.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { ACCENT, ACCENT_DEEP, INK, swayCam, type P2 } from "../kits/maps/incaShared";
import { Box, ContactShadow, Cylinder, DARK, GroundPlane, perspective, type Persp, type VolInk } from "../kyle-london/londonDepth";
import { POSES as RomePoses, Slave, idle, type FigPose } from "./romeCast";
import {
  AXLE_H,
  BEAR_Z0,
  BEAR_Z1,
  COL_R,
  COL_TOP,
  COL_X,
  COL_Z,
  DEPTH,
  DROP,
  DRUM_R,
  DRUM_Z0,
  DRUM_Z1,
  DURATION as PLAN_DURATION,
  FIG,
  FPS as PLAN_FPS,
  HEAD,
  JIB_FOOT_X,
  JIB_ZA,
  JIB_ZB,
  JIB_ZH,
  LOAD_H,
  LOAD_R,
  N_SLATS,
  N_SPOKES,
  PLATFORM_Y,
  RIM_T,
  RT,
  R_OUT,
  SHEAVE_C,
  SHEAVE_R,
  SLAT0,
  SLAT_DA,
  SPOKE0,
  STOP_F,
  STYLO_H,
  U,
  WALKERS,
  WORKER_X,
  WORKER_Z,
  XW,
  YW,
  ZF,
  ZN,
  camAt,
  eyeAt,
  footAt,
  loadBottom,
  phaseAt,
  treadPoint,
  wheelAngle,
} from "./slavesTurnTheCranePlan";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// TONES
// ---------------------------------------------------------------------------
const TIMBER: VolInk = { lit: "#9C8664", mid: "#776448", dark: "#4A3E2F" };
const STONE: VolInk = { lit: "#8E7F64", mid: "#6E604A", dark: "#4A3F31" };
const MARBLE: VolInk = { lit: INK, mid: "#D3C5A2", dark: "#9C8F70" };
const WHEEL: VolInk = { lit: ACCENT, mid: ACCENT_DEEP, dark: "#9A5C07" };
const ROPE = "#CDBB92";
const IRON_O = "#B87108";
const LIGHT: P2 = [-0.55, -0.83];

const P = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(P).join("L")}Z`;
const sw = (k: number, base: number) => base / Math.pow(k, 0.6);
const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, "0")).join("")}`;
};
const PAGE = "#3F3428";
const tintVol = (v: VolInk, t: number): VolInk => ({ lit: mixHex(PAGE, v.lit, t), mid: mixHex(PAGE, v.mid, t), dark: mixHex(PAGE, v.dark, t) });
const tone3 = (v: number, ink: VolInk) => (v > 0.3 ? ink.lit : v > -0.35 ? ink.mid : ink.dark);

/** a beam between two 3D points, square section w (units), drawn as a band with a lit and a dark edge */
const Beam3: React.FC<{ pp: Persp; k: number; a: [number, number, number]; b: [number, number, number]; w: number; ink: VolInk }> = ({ pp, k, a, b, w, ink }) => {
  const A = pp.p(a[0], a[1], a[2]);
  const B = pp.p(b[0], b[1], b[2]);
  const wa = (w * pp.r(a[2])) / 2;
  const wb = (w * pp.r(b[2])) / 2;
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  // which side faces the light (upper left)
  const litSide = nx * LIGHT[0] + ny * LIGHT[1] > 0 ? 1 : -1;
  const q: P2[] = [
    [A[0] + nx * wa, A[1] + ny * wa],
    [B[0] + nx * wb, B[1] + ny * wb],
    [B[0] - nx * wb, B[1] - ny * wb],
    [A[0] - nx * wa, A[1] - ny * wa],
  ];
  const dark: P2[] = [
    [A[0] - litSide * nx * wa * 0.15, A[1] - litSide * ny * wa * 0.15],
    [B[0] - litSide * nx * wb * 0.15, B[1] - litSide * ny * wb * 0.15],
    [B[0] - litSide * nx * wb, B[1] - litSide * ny * wb],
    [A[0] - litSide * nx * wa, A[1] - litSide * ny * wa],
  ];
  return (
    <g>
      <path d={poly(q)} fill={ink.mid} stroke={DARK} strokeWidth={sw(k, 1.8)} strokeLinejoin="round" />
      <path d={poly(dark)} fill={ink.dark} opacity={0.85} />
      <path d={`M${P([A[0] + litSide * nx * wa * 0.7, A[1] + litSide * ny * wa * 0.7])}L${P([B[0] + litSide * nx * wb * 0.7, B[1] + litSide * ny * wb * 0.7])}`} stroke={ink.lit} strokeWidth={sw(k, 1.4)} strokeOpacity={0.9} />
    </g>
  );
};

/** a rope (pale hemp) through 3D points */
const Rope: React.FC<{ pp: Persp; k: number; pts: [number, number, number][]; w?: number }> = ({ pp, k, pts, w = 0.045 * U }) => {
  const d = `M${pts.map((q) => P(pp.p(q[0], q[1], q[2]))).join("L")}`;
  const ww = Math.max(w * pp.r(pts[0][2]), 1.4 / k);
  return (
    <g>
      <path d={d} fill="none" stroke={DARK} strokeWidth={ww + sw(k, 1.6)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={ROPE} strokeWidth={ww} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// A RING (a wheel rim / disc) facing the camera: axis along Z at (cx, cy), radii ro..ri, faces Z0 (front)..Z1 (back):
// the back face, the inner surface where it shows, the outer surface on the VP's side, the front face.
// ---------------------------------------------------------------------------
const ring = (pp: Persp, cx: number, cy: number, rad: number, Z: number) => ({ c: pp.p(cx, cy, Z), r: rad * pp.r(Z) });
const annulusD = (pp: Persp, cx: number, cy: number, ro: number, ri: number, Z: number) => {
  const o = ring(pp, cx, cy, ro, Z);
  const i = ring(pp, cx, cy, ri, Z);
  const outer = `M${o.c[0] + o.r},${o.c[1]}a${o.r},${o.r} 0 1 0 ${-2 * o.r},0a${o.r},${o.r} 0 1 0 ${2 * o.r},0Z`;
  if (ri <= 0) return outer;
  return `${outer}M${i.c[0] + i.r},${i.c[1]}a${i.r},${i.r} 0 1 1 ${-2 * i.r},0a${i.r},${i.r} 0 1 1 ${2 * i.r},0Z`;
};
const Ring: React.FC<{ pp: Persp; k: number; cx: number; cy: number; ro: number; ri: number; z0: number; z1: number; ink: VolInk; front?: string }> = ({ pp, k, cx, cy, ro, ri, z0, z1, ink, front }) => {
  const V: P2 = [pp.vp[0] - cx, pp.vp[1] - cy];
  const pt = (rad: number, a: number, Z: number) => pp.p(cx + rad * Math.cos(a), cy + rad * Math.sin(a), Z);
  const NB = 72;
  const outer: React.ReactNode[] = [];
  const inner: React.ReactNode[] = [];
  for (let i = 0; i < NB; i++) {
    const a0 = (i / NB) * 2 * Math.PI;
    const a1 = ((i + 1) / NB) * 2 * Math.PI;
    const am = (a0 + a1) / 2;
    const nx = Math.cos(am);
    const ny = Math.sin(am);
    const dot = V[0] * nx + V[1] * ny;
    if (dot > ro) {
      const f = tone3(nx * LIGHT[0] + ny * LIGHT[1], ink);
      outer.push(<path key={i} d={poly([pt(ro, a0, z0), pt(ro, a1, z0), pt(ro, a1, z1), pt(ro, a0, z1)])} fill={f} stroke={f} strokeWidth={0.5} />);
    }
    if (ri > 0 && dot < ri) {
      const f = tone3(-(nx * LIGHT[0] + ny * LIGHT[1]), ink);
      inner.push(<path key={i} d={poly([pt(ri, a0, z0), pt(ri, a1, z0), pt(ri, a1, z1), pt(ri, a0, z1)])} fill={f} stroke={f} strokeWidth={0.5} />);
    }
  }
  return (
    <g>
      <path d={annulusD(pp, cx, cy, ro, ri, z1)} fill={ink.dark} fillRule="evenodd" stroke={DARK} strokeWidth={sw(k, 1.3)} />
      {inner}
      {outer}
      <path d={annulusD(pp, cx, cy, ro, ri, z0)} fill={front ?? ink.lit} fillRule="evenodd" stroke={DARK} strokeWidth={sw(k, 1.9)} />
    </g>
  );
};

/** spokes of a wheel face at depth Z (a .. b along Z for their thickness) */
const Spokes: React.FC<{ pp: Persp; k: number; th: number; za: number; zb: number; ink: VolInk; hw?: number }> = ({ pp, k, th, za, zb, ink, hw = 0.06 * U }) => {
  const els: React.ReactNode[] = [];
  for (let j = 0; j < N_SPOKES; j++) {
    const a = th + SPOKE0 + (j / N_SPOKES) * 2 * Math.PI;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const px = -uy;
    const py = ux;
    const r0 = 0.24 * U;
    const r1 = RT + 6;
    const c = (rr: number, s: number, Z: number) => pp.p(XW + rr * ux + s * hw * px, YW + rr * uy + s * hw * py, Z);
    const mx = XW + ((r0 + r1) / 2) * ux;
    const my = YW + ((r0 + r1) / 2) * uy;
    const sideS = (pp.vp[0] - mx) * px + (pp.vp[1] - my) * py > 0 ? 1 : -1;
    els.push(
      <g key={j}>
        <path d={poly([c(r0, sideS, za), c(r1, sideS, za), c(r1, sideS, zb), c(r0, sideS, zb)])} fill={ink.dark} stroke={DARK} strokeWidth={sw(k, 0.9)} />
        <path d={poly([c(r0, -1, za), c(r1, -1, za), c(r1, 1, za), c(r0, 1, za)])} fill={ink.mid} stroke={DARK} strokeWidth={sw(k, 1.3)} />
        <path d={`M${P(c(r0 + 8, -0.5, za))}L${P(c(r1 - 8, -0.5, za))}`} stroke={ink.lit} strokeWidth={sw(k, 1.3)} strokeOpacity={0.85} />
      </g>,
    );
  }
  return <g>{els}</g>;
};

/** the treads: slats across the wheel between the rims, at the treads' surface, turning with the wheel */
const Treads: React.FC<{ pp: Persp; k: number; th: number }> = ({ pp, k, th }) => {
  let lit = "";
  let dark = "";
  for (let j = 0; j < N_SLATS; j++) {
    const a = SLAT0 + th + j * SLAT_DA;
    const x = XW + RT * Math.cos(a);
    const y = YW + RT * Math.sin(a);
    const seg = `M${P(pp.p(x, y, ZN + RIM_T))}L${P(pp.p(x, y, ZF))}`;
    // the lower half faces up (lit), the upper half faces down (dark)
    if (Math.sin(a) > 0) lit += seg;
    else dark += seg;
  }
  const w = 0.075 * U;
  return (
    <g>
      <path d={dark} stroke={DARK} strokeWidth={w * pp.r(190) + sw(k, 1.6)} strokeLinecap="butt" />
      <path d={dark} stroke="#8E5506" strokeWidth={w * pp.r(190)} strokeLinecap="butt" />
      <path d={lit} stroke={DARK} strokeWidth={w * pp.r(190) + sw(k, 1.6)} strokeLinecap="butt" />
      <path d={lit} stroke={ACCENT_DEEP} strokeWidth={w * pp.r(190)} strokeLinecap="butt" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WALKERS: romeCast Slaves in POSES.walk, feet replaced by the slats they stand on (the planted foot rides its
// slat back; the swing foot lands on the next slat but one), facing the way they walk (screen right).
// ---------------------------------------------------------------------------
export const walkerPose = (w: number, f: number): { pose: FigPose; at: P2 } => {
  const W = WALKERS[w];
  const at = treadPoint(W.b0);
  const base = RomePoses.walk(1, phaseAt(f, w));
  const foot = (leg: 0 | 1) => {
    const ft = footAt(f, w, leg);
    const b = W.b0 + ft.d / RT;
    const p = treadPoint(b, ft.lift);
    return { p: [(p[0] - at[0]) / FIG, (p[1] - at[1]) / FIG] as P2, slope: (b * 180) / Math.PI };
  };
  const A = foot(0);
  const B = foot(1);
  const still = 1 - Math.min(1, Math.max(0, (f - STOP_F + 4) / 10));
  const q: FigPose = {
    ...base,
    lean: base.lean + 6,
    pitch: base.pitch + 4,
    footL: A.p,
    footR: B.p,
    liftL: base.liftL * still - A.slope,
    liftR: base.liftR * still - B.slope,
  };
  return { pose: idle(q, f, 2 + w, 1 - still), at };
};
const Walker: React.FC<{ pp: Persp; w: number; f: number }> = ({ pp, w, f }) => {
  const W = WALKERS[w];
  const { pose, at } = walkerPose(w, f);
  return (
    <g>
      <ContactShadow P={pp} X={at[0]} Z={W.z} Y={at[1]} w={60} d={26} uid={`wcs${w}`} amt={0.7} />
      <Slave pose={pose} at={pp.p(at[0], at[1], W.z)} scale={pp.r(W.z) * FIG} uid={`walker${w}`} variant={W.variant} garb={W.garb} fetters shade={1} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TEMPLE: the stylobate, the column under construction (drums), a finished column behind, the scaffold
// ---------------------------------------------------------------------------
const Stylobate: React.FC<{ pp: Persp }> = ({ pp }) => {
  const steps = [0, 1, 2];
  return (
    <g>
      {steps.map((i) => (
        <Box key={i} P={pp} X0={COL_X - (1.35 - i * 0.22) * U} X1={COL_X + 9 * U} Y0={-(i + 1) * (STYLO_H / 3)} Y1={-i * (STYLO_H / 3)} Z0={-60 + i * 40} Z1={900} ink={STONE} uid={`sty${i}`} />
      ))}
    </g>
  );
};
const Column: React.FC<{ pp: Persp; k: number; X: number; Z: number; top: number; tint?: number; capital?: boolean; uid: string }> = ({ pp, k, X, Z, top, tint = 1, capital, uid }) => {
  const ink = tintVol(MARBLE, tint);
  const n = Math.max(1, Math.round((-STYLO_H - top) / (1.1 * U)));
  const DR = (-STYLO_H - top) / n;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const y1 = -STYLO_H - i * DR;
    const y0 = y1 - DR;
    els.push(<Cylinder key={i} P={pp} X={X} Z={Z} R={COL_R} Y0={y0} Y1={y1} ink={ink} uid={`${uid}c${i}`} />);
  }
  // flutes on the visible front
  let fl = "";
  for (let a = -70; a <= 70; a += 20) {
    const r = (a * Math.PI) / 180;
    const x = X + COL_R * 0.98 * Math.sin(r);
    const zz = Z - COL_R * 0.98 * Math.cos(r);
    fl += `M${P(pp.p(x, -STYLO_H - 6, zz))}L${P(pp.p(x, top + 4, zz))}`;
  }
  return (
    <g>
      {els}
      <path d={fl} stroke={DARK} strokeWidth={sw(k, 0.9)} strokeOpacity={0.35 * tint} />
      {capital ? <Box P={pp} X0={X - COL_R * 1.25} X1={X + COL_R * 1.25} Y0={top - 0.35 * U} Y1={top} Z0={Z - COL_R * 1.25} Z1={Z + COL_R * 1.25} ink={ink} uid={`${uid}cap`} /> : null}
    </g>
  );
};
const ScaffoldBack: React.FC<{ pp: Persp; k: number }> = ({ pp, k }) => {
  const xs = [COL_X + 0.72 * U, COL_X + 1.7 * U];
  return (
    <g>
      {xs.map((x, i) => (
        <Beam3 key={i} pp={pp} k={k} a={[x, -STYLO_H, COL_Z + 200]} b={[x, PLATFORM_Y - 1.3 * U, COL_Z + 200]} w={0.12 * U} ink={TIMBER} />
      ))}
    </g>
  );
};
const ScaffoldFront: React.FC<{ pp: Persp; k: number }> = ({ pp, k }) => {
  const xs = [COL_X + 0.72 * U, COL_X + 1.7 * U];
  return (
    <g>
      <Box P={pp} X0={COL_X + 0.62 * U} X1={COL_X + 1.82 * U} Y0={PLATFORM_Y} Y1={PLATFORM_Y + 0.09 * U} Z0={COL_Z - 90} Z1={COL_Z + 210} ink={TIMBER} uid="plank" />
      {xs.map((x, i) => (
        <Beam3 key={i} pp={pp} k={k} a={[x, -STYLO_H, COL_Z - 80]} b={[x, PLATFORM_Y - 1.3 * U, COL_Z - 80]} w={0.12 * U} ink={TIMBER} />
      ))}
      <Beam3 pp={pp} k={k} a={[xs[0], -STYLO_H - 0.5 * U, COL_Z - 80]} b={[xs[1], PLATFORM_Y + 0.2 * U, COL_Z - 80]} w={0.08 * U} ink={TIMBER} />
      <Beam3 pp={pp} k={k} a={[xs[0], PLATFORM_Y - 1.0 * U, COL_Z - 80]} b={[xs[1], PLATFORM_Y - 1.0 * U, COL_Z - 80]} w={0.08 * U} ink={TIMBER} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE JIB, THE SHEAVE, THE ROPE AND THE LOAD
// ---------------------------------------------------------------------------
const legAt = (z0: number, t: number): [number, number, number] => [JIB_FOOT_X + (HEAD[0] - JIB_FOOT_X) * t, HEAD[1] * t, z0 + (JIB_ZH - z0) * t];
const JibLeg: React.FC<{ pp: Persp; k: number; z0: number }> = ({ pp, k, z0 }) => <Beam3 pp={pp} k={k} a={legAt(z0, 0)} b={legAt(z0, 0.985)} w={0.26 * U} ink={TIMBER} />;
const Rungs: React.FC<{ pp: Persp; k: number }> = ({ pp, k }) => {
  const els: React.ReactNode[] = [];
  for (let i = 1; i <= 7; i++) {
    const t = i / 8.2;
    els.push(<Beam3 key={i} pp={pp} k={k} a={legAt(JIB_ZA, t)} b={legAt(JIB_ZB, t)} w={0.1 * U} ink={TIMBER} />);
  }
  return <g>{els}</g>;
};
/** the rope's tangent points: off the rope drum (upper left) toward the sheave, and onto the sheave */
const ropeGeom = () => {
  const dz = (DRUM_Z0 + DRUM_Z1) / 2;
  const dx = SHEAVE_C[0] - XW;
  const dy = SHEAVE_C[1] - YW;
  const l = Math.hypot(dx, dy);
  const n: P2 = [dy / l, -dx / l]; // the upper-left normal (both wrap clockwise: the same external tangent)
  const off: [number, number, number] = [XW + DRUM_R * n[0], YW + DRUM_R * n[1], dz];
  const on: [number, number, number] = [SHEAVE_C[0] + SHEAVE_R * n[0], SHEAVE_C[1] + SHEAVE_R * n[1], JIB_ZH];
  return { off, on, a0: Math.atan2(n[1], n[0]) };
};
const Sheave: React.FC<{ pp: Persp; k: number; th: number }> = ({ pp, k, th }) => {
  const za = JIB_ZH - 26;
  const zb = JIB_ZH + 26;
  const c = pp.p(SHEAVE_C[0], SHEAVE_C[1], za);
  const r = SHEAVE_R * pp.r(za);
  const turn = th * (DRUM_R / SHEAVE_R);
  let marks = "";
  for (let j = 0; j < 4; j++) {
    const a = turn + (j * Math.PI) / 2;
    marks += `M${P([c[0] + 0.3 * r * Math.cos(a), c[1] + 0.3 * r * Math.sin(a)])}L${P([c[0] + 0.8 * r * Math.cos(a), c[1] + 0.8 * r * Math.sin(a)])}`;
  }
  return (
    <g>
      {/* the head's cheeks (timber) holding the sheave's pin */}
      <Box P={pp} X0={SHEAVE_C[0] - 0.12 * U} X1={SHEAVE_C[0] + 0.12 * U} Y0={HEAD[1] - 0.25 * U} Y1={SHEAVE_C[1] + 0.05 * U} Z0={zb + 2} Z1={zb + 30} ink={TIMBER} uid="cheekB" />
      <Ring pp={pp} k={k} cx={SHEAVE_C[0]} cy={SHEAVE_C[1]} ro={SHEAVE_R} ri={0} z0={za} z1={zb} ink={WHEEL} />
      <path d={marks} stroke={DARK} strokeWidth={sw(k, 1.4)} />
      <circle cx={c[0]} cy={c[1]} r={r * 0.22} fill={IRON_O} stroke={DARK} strokeWidth={sw(k, 1.2)} />
      <Box P={pp} X0={SHEAVE_C[0] - 0.12 * U} X1={SHEAVE_C[0] + 0.12 * U} Y0={HEAD[1] - 0.25 * U} Y1={SHEAVE_C[1] - 0.05 * U} Z0={za - 30} Z1={za - 2} ink={TIMBER} uid="cheekF" />
    </g>
  );
};
const HoistRope: React.FC<{ pp: Persp; k: number; f: number }> = ({ pp, k, f }) => {
  const g = ropeGeom();
  const lb = loadBottom(f);
  const hookTop = lb - LOAD_H - 0.62 * U;
  // over the sheave: from the arrival angle round the top to the right side (angle 0)
  const arc: [number, number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const a = g.a0 + ((0 - g.a0 + (g.a0 > 0 ? -2 * Math.PI : 0)) * i) / 8;
    arc.push([SHEAVE_C[0] + SHEAVE_R * Math.cos(a), SHEAVE_C[1] + SHEAVE_R * Math.sin(a), JIB_ZH]);
  }
  return <Rope pp={pp} k={k} pts={[g.off, ...arc, [COL_X, hookTop, JIB_ZH]]} />;
};
/** the hook block and the iron tongs on the marble drum (orange), and the drum (marble) */
const Load: React.FC<{ pp: Persp; k: number; f: number }> = ({ pp, k, f }) => {
  const lb = loadBottom(f);
  const top = lb - LOAD_H;
  const blockY0 = top - 0.62 * U;
  const blockY1 = top - 0.36 * U;
  const z = COL_Z;
  const lug = (s: 1 | -1) => [
    [COL_X + s * 0.1 * U, blockY1, z],
    [COL_X + s * 0.42 * U, top - 0.1 * U, z - 20],
    [COL_X + s * (LOAD_R + 0.03 * U), top + 0.22 * U, z - 20],
  ] as [number, number, number][];
  const tong = (s: 1 | -1) => `M${lug(s).map((q) => P(pp.p(q[0], q[1], q[2]))).join("L")}`;
  return (
    <g>
      <path d={tong(-1)} fill="none" stroke={DARK} strokeWidth={0.07 * U * pp.r(z) + sw(k, 1.6)} strokeLinejoin="round" strokeLinecap="round" />
      <path d={tong(-1)} fill="none" stroke={IRON_O} strokeWidth={0.07 * U * pp.r(z)} strokeLinejoin="round" strokeLinecap="round" />
      <Cylinder P={pp} X={COL_X} Z={z} R={LOAD_R} Y0={top} Y1={lb} ink={MARBLE} uid="load" />
      {/* flutes cut in the new drum */}
      <path
        d={[-60, -30, 0, 30, 60]
          .map((a) => {
            const r = (a * Math.PI) / 180;
            const x = COL_X + LOAD_R * 0.98 * Math.sin(r);
            const zz = z - LOAD_R * 0.98 * Math.cos(r);
            return `M${P(pp.p(x, top + 8, zz))}L${P(pp.p(x, lb - 4, zz))}`;
          })
          .join("")}
        stroke={DARK}
        strokeWidth={sw(k, 0.9)}
        strokeOpacity={0.35}
      />
      <path d={tong(1)} fill="none" stroke={DARK} strokeWidth={0.07 * U * pp.r(z) + sw(k, 1.6)} strokeLinejoin="round" strokeLinecap="round" />
      <path d={tong(1)} fill="none" stroke={ACCENT} strokeWidth={0.07 * U * pp.r(z)} strokeLinejoin="round" strokeLinecap="round" />
      <Box P={pp} X0={COL_X - 0.16 * U} X1={COL_X + 0.16 * U} Y0={blockY0} Y1={blockY1} Z0={z - 26} Z1={z + 26} ink={WHEEL} uid="hook" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TREADWHEEL with its axle, rope drum and bearings
// ---------------------------------------------------------------------------
const nearLegAtAxle = () => {
  const t = AXLE_H / -HEAD[1];
  return legAt(JIB_ZA, t);
};
const farLegAtAxle = () => {
  const t = AXLE_H / -HEAD[1];
  return legAt(JIB_ZB, t);
};
/** the rope drum on the axle behind the far rim, the rope wound on it (its face turns with the wheel) */
const RopeDrum: React.FC<{ pp: Persp; k: number; th: number }> = ({ pp, k, th }) => {
  const dc = pp.p(XW, YW, DRUM_Z0);
  const dr = DRUM_R * pp.r(DRUM_Z0);
  let coils = "";
  for (let i = 1; i <= 3; i++) {
    const rr = dr * (1 - i * 0.06);
    coils += `M${dc[0] + rr},${dc[1]}a${rr},${rr} 0 1 0 ${-2 * rr},0a${rr},${rr} 0 1 0 ${2 * rr},0`;
  }
  let marks = "";
  for (let j = 0; j < 3; j++) {
    const a = th + SPOKE0 + (j * 2 * Math.PI) / 3;
    marks += `M${P([dc[0] + 0.25 * dr * Math.cos(a), dc[1] + 0.25 * dr * Math.sin(a)])}L${P([dc[0] + 0.7 * dr * Math.cos(a), dc[1] + 0.7 * dr * Math.sin(a)])}`;
  }
  return (
    <g>
      <Ring pp={pp} k={k} cx={XW} cy={YW} ro={DRUM_R} ri={0} z0={DRUM_Z0} z1={DRUM_Z1} ink={{ lit: ROPE, mid: "#A8956C", dark: "#6E5F44" }} front={TIMBER.mid} />
      <path d={coils} fill="none" stroke={ROPE} strokeWidth={sw(k, 2.2)} />
      <path d={coils} fill="none" stroke={DARK} strokeWidth={sw(k, 0.7)} strokeOpacity={0.6} />
      <path d={marks} stroke={DARK} strokeWidth={sw(k, 1.6)} />
    </g>
  );
};
const WheelBack: React.FC<{ pp: Persp; k: number; th: number; f: number }> = ({ pp, k, th, f }) => (
  <g>
    {/* the far beam carrying the axle's far end to the jib's far leg */}
    <Beam3 pp={pp} k={k} a={[XW - 0.3 * U, YW, DRUM_Z1 + 30]} b={farLegAtAxle()} w={0.24 * U} ink={TIMBER} />
    <RopeDrum pp={pp} k={k} th={th} />
    <HoistRope pp={pp} k={k} f={f} />
    <Ring pp={pp} k={k} cx={XW} cy={YW} ro={0.1 * U} ri={0} z0={ZN} z1={DRUM_Z0} ink={{ lit: "#6B5E50", mid: "#4A3F36", dark: "#2A2420" }} />
    <Ring pp={pp} k={k} cx={XW} cy={YW} ro={R_OUT} ri={RT} z0={ZF} z1={ZF + RIM_T} ink={WHEEL} front={ACCENT_DEEP} />
    <Spokes pp={pp} k={k} th={th + 0.3} za={ZF} zb={ZF + RIM_T} ink={{ lit: ACCENT, mid: ACCENT_DEEP, dark: "#8E5506" }} />
    <Treads pp={pp} k={k} th={th} />
  </g>
);
const WheelFront: React.FC<{ pp: Persp; k: number; th: number }> = ({ pp, k, th }) => (
  <g>
    <Spokes pp={pp} k={k} th={th} za={ZN} zb={ZN + RIM_T} ink={WHEEL} hw={0.045 * U} />
    <Ring pp={pp} k={k} cx={XW} cy={YW} ro={R_OUT} ri={RT} z0={ZN} z1={ZN + RIM_T} ink={WHEEL} />
    {/* the hub, the axle's front end and its bearing on the near beam to the jib's near leg */}
    <Ring pp={pp} k={k} cx={XW} cy={YW} ro={0.21 * U} ri={0} z0={ZN - 12} z1={ZN + RIM_T + 6} ink={WHEEL} front={ACCENT_DEEP} />
    <Ring pp={pp} k={k} cx={XW} cy={YW} ro={0.1 * U} ri={0} z0={BEAR_Z1} z1={ZN - 12} ink={{ lit: "#6B5E50", mid: "#4A3F36", dark: "#2A2420" }} />
    <Beam3 pp={pp} k={k} a={[XW - 0.3 * U, YW, (BEAR_Z0 + BEAR_Z1) / 2]} b={nearLegAtAxle()} w={0.22 * U} ink={TIMBER} />
    <Box P={pp} X0={XW - 0.17 * U} X1={XW + 0.17 * U} Y0={YW - 0.17 * U} Y1={YW + 0.17 * U} Z0={BEAR_Z0} Z1={BEAR_Z1} ink={TIMBER} uid="bearing" />
    <circle cx={pp.p(XW, YW, BEAR_Z0)[0]} cy={pp.p(XW, YW, BEAR_Z0)[1]} r={0.09 * U * pp.r(BEAR_Z0)} fill="#2A2420" stroke={DARK} strokeWidth={sw(k, 1.2)} />
  </g>
);

// ---------------------------------------------------------------------------
// THE WORKER on the scaffold, guiding the drum down with both hands on it
// ---------------------------------------------------------------------------
/** the worker's pose and his two grips on the drum (3D points: x, y, z) */
export const workerPose = (f: number) => {
  const lb = loadBottom(f);
  const desc = (lb - (COL_TOP - DROP)) / DROP; // 0 at f0 .. 1 at contact
  const base = RomePoses.stand(-1);
  const q: FigPose = idle({ ...base, lean: base.lean - 8 - 9 * desc, crouch: base.crouch + 4 + 20 * desc, pitch: base.pitch + 10, headYaw: -0.55 }, f, 7);
  const near: [number, number, number] = [COL_X + LOAD_R + 0.02 * U, lb - 0.8 * U, COL_Z - 30];
  const far: [number, number, number] = [COL_X + LOAD_R - 0.02 * U, lb - 0.95 * U, COL_Z + 30];
  return { q, near, far };
};
const Worker: React.FC<{ pp: Persp; f: number }> = ({ pp, f }) => {
  const { q, near: n3, far: f3 } = workerPose(f);
  const at = pp.p(WORKER_X, PLATFORM_Y, WORKER_Z);
  const near = pp.p(n3[0], n3[1], n3[2]);
  const far = pp.p(f3[0], f3[1], f3[2]);
  return (
    <g>
      <ContactShadow P={pp} X={WORKER_X} Z={WORKER_Z} Y={PLATFORM_Y} w={62} d={30} uid="wkcs" amt={0.8} />
      <Slave pose={q} at={at} scale={pp.r(WORKER_Z) * FIG} uid="worker" variant={4} garb="tunic" shade={1} grip={{ R: near, L: far }} />
    </g>
  );
};
const SlavesTurnTheCrane: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const cam = swayCam(camAt(cf), cf);
  const k = cam.k;
  const pp = perspective(cam, { eyeY: eyeAt(cam.cy), dRef: DEPTH.dRef, kRef: DEPTH.kRef, dolly: DEPTH.dolly });
  const th = wheelAngle(frame);
  const guyAnchor = (z: number): [number, number, number] => [XW - 5.5 * U, 0, z];
  return (
    <TexcocoPage cam={cam} vignette={0.5}>
      <WorldSvg cam={cam}>
        <GroundPlane P={pp} kind="flags" x0={-4200} x1={4200} z0={-2600} zFar={3400} course={300} uid="ground" />
        <Rope pp={pp} k={k} pts={[guyAnchor(JIB_ZB + 200), [HEAD[0], HEAD[1], JIB_ZB - 40]]} w={0.035 * U} />
        <Stylobate pp={pp} />
        <JibLeg pp={pp} k={k} z0={JIB_ZB} />
        <ScaffoldBack pp={pp} k={k} />
        <Column pp={pp} k={k} X={COL_X} Z={COL_Z} top={COL_TOP} uid="col1" />
        <Load pp={pp} k={k} f={frame} />
        <ScaffoldFront pp={pp} k={k} />
        <Worker pp={pp} f={frame} />
        <WheelBack pp={pp} k={k} th={th} f={frame} />
        {[1, 0].map((w) => (
          <Walker key={w} pp={pp} w={w} f={frame} />
        ))}
        <WheelFront pp={pp} k={k} th={th} />
        <Sheave pp={pp} k={k} th={th} />
        <Rungs pp={pp} k={k} />
        <JibLeg pp={pp} k={k} z0={JIB_ZA} />
        <Rope pp={pp} k={k} pts={[guyAnchor(JIB_ZA - 200), [HEAD[0], HEAD[1], JIB_ZA + 40]]} w={0.035 * U} />
      </WorldSvg>
    </TexcocoPage>
  );
};

export default SlavesTurnTheCrane;
