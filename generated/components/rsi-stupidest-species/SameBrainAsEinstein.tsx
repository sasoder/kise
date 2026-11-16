// ---------------------------------------------------------------------------
// SameBrainAsEinstein (rsi-stupidest-species, cut 35). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 178 frames.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d; the pair is the clip's cast W2 (./stupidestFolk: ME and EINSTEIN), the brains the
// clip's W3 brain (./brainShared: v0 above ME, v1 above EINSTEIN, as cut D's left / right).
//
// CHECK LINE: "The speaker and Einstein have the same kind of brain, the same neurons; yet only Einstein fused
//   separate parts of physics into one idea."
//
// THE LINE: "We're the same species with the same basic brain design and roughly the same number of neurons. Yet I
//   don't have the genius to unify whole branches of physics."
// WORD -> FRAME: We're -2 · the 3 · same 4 · species 9 · with 17 · the 24 · same 27 · basic 32 · brain 41 · design 47 ·
//   and 53 · roughly 64 · the 72 · same 76 · number 82 · of 88 · neurons 91 · Yet 102 · I 106 · don't 111 · have 116 ·
//   the 119 · genius 121 · to 127 · unify 138 · whole 148 · branches 154 · of 164 · physics 168
// DURATION: the slot 35.369 -> 42.793 s = 7.424 s x 24000/1001 = 178 frames (f0..f177).
//
// THE MOTION (rev 1): ME (left; the speaker's look: beard, cream sweater) and EINSTEIN (right) stand side by side on
// the sandy floor, the same height. ONE camera move runs the whole cut: a slow lateral drift from Me toward Einstein
// across "same species ... same basic brain design" (wx -60 -> -8, k 1.64 -> 1.675, f0-f50), a creep, a gentle push-in
// onto Einstein from "Yet I don't have the genius" (f100-f124, k -> 1.755, wx -> 40) and a tilt up with the orange as it
// joins and rises on "unify whole branches of physics" (wy -184 -> -205, f124-f177, k -> 1.79). They glance at each
// other as ONE cream "=" is drawn between their bodies by a moving tip ("species", f7-f16); the two brains (v0 / v1, the
// same size) rise from behind their head tops to float above the hair (f24-f45, never scaled in) while that same "=" is
// carried up in one smooth move to sit between them (f28-f48, "design"); on "number" / "neurons" one soft plate 86
// BILLION NEURONS slides up under both brains (f78-f91). On "Yet" two cream branches grow in from the frame edges
// (f100-f118): the left one from the left edge above Me's brain, the right one lower from the right edge, both sloping up
// toward a point above Einstein's brain, their tips still apart. Me glances over (f100-f116) and gives a small resigned
// shrug on "I don't have" (f106-f118), held. On "to unify" Einstein's hands rise together on ONE eased arc (f123-f150:
// up from the hang, then in, the elbows low and outside the whole way) and meet in front of his chest, palms in; the
// branch tips are read off his hands every frame (bendAt: the hands' separation) and meet at the joint as the hands
// meet (f150, "whole"), then a small settle of the hands (f150-f169). From the joint ONE orange stem grows straight up
// and out of the top of the frame (f150-f163, the orange running up it and a little way back along each branch): two
// branches become one. The E = mc² plate (cap ~53 px) settles beside the joint, right of the stem (f153-f165); Einstein's
// brain glows faintly orange from inside (f144-f164); he lifts his eyes to it, and Me looks up at it (f150-f164). Hold
// f165-f177 on the pair, the brains, the plate and the orange stem; the camera still tilting up.
// CAUSE BEFORE EFFECT: the branch tips' bend is driven by Einstein's hands (the hands' separation, f131-f150): contact
// (tips meet) f150, first orange f150 (the joint), the brain's glow from f144.
// Orange = intelligence (COMMON.md): the joint, the one stem, the E = mc² type and Einstein's brain glow only. People
// in their own colours, brains pink-oatmeal, the "=" mark and the two separate branches cream.
// DEPTH: floor Y = 0, the figures, brains, marks, plates and bough on the front plane Z = 0 (1 world px = 1 cast unit
// at Z 0; a man 312 = 1.75 m). Eye at Y -220 (~1.2 m: the horizon behind the bodies, heads and brains against the air),
// dRef 1800 at kRef 1.7, dolly 0.5, fog by the eye. ME at X -135, EINSTEIN at X +135, PAIR_YAW (0.2 / -0.2).
//
// SOURCES: ~86 billion neurons in an adult human brain: Azevedo et al. 2009, J Comp Neurol 513:532-541 (86.1 ± 8.1
//   billion neurons), the figure in COMMON.md; the speaker says "roughly the same number". E = mc²: Einstein 1905
//   (mass-energy equivalence). No other figures.
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  AIR,
  AirFloor,
  AirHorizonHazeW,
  AirShadow,
  AirStage,
  MAT,
  WorldSvg,
  airWorldOf,
  c01,
  makeCamera,
  mixHex,
  swayCam,
  type AirWorld,
  type DepthOpts,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { BRAIN_ASPECT, Brain } from "./brainShared";
import { Einstein, Me, PAIR_YAW, PERSON_POSES, lerpPose, personAnchors, type PersonPose } from "./stupidestFolk";

export const FPS = 24000 / 1001;
export const DURATION = 178;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: barlow } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });
const PAL = AIR.A;
const ease = (t: number) => Easing.inOut(Easing.cubic)(c01(t));
const easeOut = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const ramp = (f: number, a: number, b: number) => c01((f - a) / (b - a));
const n2 = (v: number) => v.toFixed(2);

// ---- the world (units at Z 0, up = -Y) ------------------------------------------------------------------------------
export const ME_X = -135;
export const EIN_X = 135;
/** the brains: width, anchor (bottom centre) at rest */
export const BRAIN_W = 100;
export const BRAIN_H = BRAIN_W * BRAIN_ASPECT;
export const BRAIN_Y = -398;
/** the line the brains rise out of: the top of the hair (Me's quiff -327, Einstein's cloud -338); the brains are drawn
 *  behind the figures and masked below this row with a short soft edge (BRAIN_FEATHER above it), so they come up out
 *  from behind the head top and never show beside the head */
const BRAIN_CLIP_Y = -324;
const BRAIN_FEATHER = 16;
/** the "=" marks: centre, bar length, gap, thickness */
export const EQ_BODY: P2 = [0, -190];
export const EQ_BRAIN: P2 = [0, -436];
export const EQ = { len: 40, gap: 14, th: 6 };
/** the neurons plate: centre row and cap height (units) */
export const NEURON_PLATE = { X: 0, Y: -368, cap: 25.5, padK: 0.3, track: 0.05 };
/** THE Y: two branches from the frame edges (roots off frame) meet at the JOINT above Einstein's brain and go on as one
 *  STEM rising out of the top of the frame. Left: from the left edge above Me's brain, sloping up; right: from the right
 *  edge, lower, sloping up steeply into the joint. Tips apart (pointing at the joint) until the hands bring them in. */
export const JOINT: P2 = [EIN_X, -538];
/** cubic branches: root, c1 (fixed), c2 and tip (apart -> fused, driven by Einstein's hands) */
const BR = {
  L: { root: [-420, -500] as P2, c1: [-150, -514] as P2, c2Apart: [50, -494] as P2, tApart: [88, -518] as P2, c2Fused: [82, -497] as P2 },
  R: { root: [520, -432] as P2, c1: [300, -450] as P2, c2Apart: [206, -466] as P2, tApart: [184, -510] as P2, c2Fused: [178, -486] as P2 },
};
const BR_W = { root: 18, tip: 6, fused: 12 };
/** the stem: from the joint straight up and out of the frame */
export const STEM = { ctrl: [138, -660] as P2, top: [150, -800] as P2, w0: 14, w1: 9 };
/** the E = mc² plate, beside the joint: right of the stem, above the right branch (cap ~55 px on screen at the hold) */
export const EMC = { X: 238, Y: -548, cap: 30, padK: 0.22, track: 0, slide: 0.15 };

// ---- curve helpers -------------------------------------------------------------------------------------------------
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const quad = (p0: P2, c: P2, p1: P2, s: number): P2 => {
  const u = 1 - s;
  return [u * u * p0[0] + 2 * u * s * c[0] + s * s * p1[0], u * u * p0[1] + 2 * u * s * c[1] + s * s * p1[1]];
};
const quadD = (p0: P2, c: P2, p1: P2, s: number): P2 => {
  const u = 1 - s;
  return [2 * u * (c[0] - p0[0]) + 2 * s * (p1[0] - c[0]), 2 * u * (c[1] - p0[1]) + 2 * s * (p1[1] - c[1])];
};

// ---- timing ---------------------------------------------------------------------------------------------------------
const T = {
  eq1: [7, 12] as const, // the top bar of the "=" between the bodies (species 9)
  eq2: [11, 16] as const,
  rise: [24, 45] as const, // the brains rise from behind the heads (the 24 · brain 41)
  eqMove: [28, 48] as const, // the same "=" carried up between the brains as they arrive (design 47)
  neurons: [78, 91] as const, // number 82 · neurons 91
  grow: [100, 118] as const, // Yet 102: the branches grow in
  meShrug: [106, 118] as const, // I 106 · don't 111 · have 116: Me's small shrug, held
  gesture: [123, 150] as const, // to 127 · unify 138 · whole 148: Einstein's hands, one eased arc, meet at f150
  fuse: [150, 160] as const, // the hands meet: the tips join, the orange starts at the joint, a little way back
  stem: [150, 163] as const, // ... and runs UP the one stem as it grows out of the joint (branches 154 · of 164)
  emc: [153, 165] as const,
  glow: [144, 164] as const,
  meLook: [150, 164] as const, // Me looks up at the orange
};

// ---- camera: one move. A slow lateral drift from Me to Einstein (species .. design), a creep, a gentle push-in onto
// Einstein from "Yet" (f102-f124), and a tilt up with the orange as it joins and rises (f138-f170) -------------------------
const DEPTH: DepthOpts = { eyeY: -220, dRef: 1800, kRef: 1.7, dolly: 0.5 };
const camAt = makeCamera(
  [
    { f: 0, k: 1.64, wx: -60, wy: -178 },
    { f: 50, k: 1.675, wx: -8, wy: -178 },
    { f: 100, k: 1.7, wx: 4, wy: -180 },
    { f: 124, k: 1.755, wx: 40, wy: -184 },
    { f: 150, k: 1.78, wx: 53, wy: -195 },
    { f: 170, k: 1.79, wx: 56, wy: -204 },
    { f: DURATION - 1, k: 1.792, wx: 56.5, wy: -205 },
  ].map((q) => ({ ...q, sy: 960 })),
  true,
);
export const camOf = (f: number) => swayCam(camAt(f), f);
const REST = swayCam(camAt(0), 0);

// ---- poses ----------------------------------------------------------------------------------------------------------
/** they glance at each other on "same species", then face out as the brains rise */
const pairGlance = (f: number) => ease(ramp(f, 2, 18)) * (1 - ease(ramp(f, 30, 46)));
/** Me's shrug: how far into the cast's small shrug he goes (kept small: his hand stays inside the frame) */
const ME_SHRUG = 0.6;
export const mePose = (f: number): PersonPose => {
  // he watches Einstein from "Yet", gives a small resigned shrug on "I don't have" and holds it, then looks up at the
  // orange as it joins and rises
  const up = ease(ramp(f, T.meShrug[0], T.meShrug[1]));
  const stand = PERSON_POSES.stand(PAIR_YAW.me, f);
  const base = up > 0 ? (lerpPose(stand, PERSON_POSES.shrug("me", PAIR_YAW.me, 0.5, f), ME_SHRUG * up) as PersonPose) : stand;
  const lu = ease(ramp(f, T.meLook[0], T.meLook[1]));
  const g = Math.max(pairGlance(f), ease(ramp(f, 100, 116))) * (1 - 0.45 * lu);
  const gl = PERSON_POSES.glance(base, 1, g);
  return lu > 0 ? PERSON_POSES.lookUp(gl, 1, 0.75 * lu) : gl;
};

/** EINSTEIN'S GESTURE (the cut's own arms over the cast's stand; the cast's unify lifts the wrists out to shoulder
 *  height and its soft elbows swing out and back as the hint crosses the arm line): both hands rise together on ONE
 *  eased arc, a quadratic from the hang that first lifts (control straight above the hang) and then curves in, to meet
 *  in front of his chest, palms in, fingers up, the mittens just touching. The elbow hint is set every frame on the
 *  arm's own normal, always to the outside, with the soft-elbow bend b easing 0.45 (the stand's) -> 0.85: the elbows
 *  stay low and to the outside the whole way (a forearm raised toward us reads foreshortened, never a wing) and never
 *  flip; the thumbs stay on the same side. Then a small settle (a soft dip and return) and the hold.
 *  Yaw-0 units for his right arm (armL, screen left; armR mirrored), the cast's yaw shift applied as its unify does. */
const GEST = {
  ctrl: [-55, -182] as P2, // the arc's control point: straight above the hang, so the hands rise first, then come in
  meet: [-14, -194] as P2, // the wrist at the meet
  shoulderX: 44.1, // the rig's shoulders (x +-44.1, y -247 at this yaw)
  shoulderY: -247,
  bend: [0.45, 0.85] as const, // the soft elbow's bend (0 straight .. 1 the full two-bone bend), hang -> meet
  hand: -70, // the mitten's turn at the meet: fingers up, palms in
  settle: 3, // the dip after the meet (units)
};
export const gestureU = (f: number) => ease(ramp(f, T.gesture[0], T.gesture[1]));
export const einPose = (f: number): PersonPose => {
  const base = PERSON_POSES.stand(PAIR_YAW.einstein, f);
  const u = gestureU(f);
  const yaw = PAIR_YAW.einstein;
  const c = Math.cos(yaw);
  const sh = 12 * Math.sin(yaw);
  const fm = T.gesture[1];
  const dip = GEST.settle * (ease(ramp(f, fm, fm + 7)) - 0.7 * ease(ramp(f, fm + 7, fm + 19)));
  const arm = (side: -1 | 1) => {
    const a0 = side < 0 ? base.armL : base.armR;
    // the hang in yaw-0 left-arm units (undo the yaw shift, mirror the right arm)
    const w0: P2 = [(-side * (a0.w[0] - sh)) / c, a0.w[1]];
    const wl = quad(w0, GEST.ctrl, GEST.meet, u);
    const w: P2 = [-side * wl[0] * c + sh, wl[1] + dip];
    // the elbow hint on the arm's own normal, to the outside, sized for the bend b (elbowOf: v = n.hint / 0.55,
    // b = 1 - (1 - v)^2)
    const d: P2 = [w[0] - side * GEST.shoulderX, w[1] - GEST.shoulderY];
    const l = Math.hypot(d[0], d[1]) || 1;
    const n: P2 = [-d[1] / l, d[0] / l];
    const out = n[0] * side > 0 ? 1 : -1; // n, or -n: whichever points to the outside of this arm
    const b = GEST.bend[0] + (GEST.bend[1] - GEST.bend[0]) * u * u;
    const v = 1 - Math.sqrt(1 - b);
    const hint: P2 = [n[0] * out * 0.55 * v, n[1] * out * 0.55 * v];
    return {
      w,
      elbow: hint,
      fist: a0.fist + (0.05 - a0.fist) * u,
      hand: a0.hand + ((side < 0 ? GEST.hand : -GEST.hand) - a0.hand) * u,
    };
  };
  const look = ease(ramp(f, fm + 2, fm + 14));
  const pose: PersonPose = {
    ...base,
    armL: arm(-1),
    armR: arm(1),
    // eyes on the hands as they come together, then up to the idea above him
    pitch: base.pitch + 5 * u - 9 * look,
    look: [0, 0.35 * u * (1 - look) - 0.7 * look],
    mouth: base.mouth + 0.1 * u,
  };
  return PERSON_POSES.glance(pose, -1, pairGlance(f));
};

/** THE LOCK: the branch tips' bend toward the joint is read off Einstein's hands every frame: 0 while the hands are
 *  still widening on the arc, then (peak separation - separation) / (peak - meet), so the tips close exactly as the
 *  hands close and meet at the joint as the hands meet */
const handSep = (f: number) => {
  const a = personAnchors("einstein", einPose(f), [0, 0], 1);
  return a.wristR[0] - a.wristL[0];
};
const SEP = (() => {
  let peak = -1;
  let fPeak = T.gesture[0];
  for (let f = T.gesture[0]; f <= T.gesture[1]; f += 0.25) {
    const s = handSep(f);
    if (s > peak) {
      peak = s;
      fPeak = f;
    }
  }
  return { peak, fPeak, meet: handSep(T.gesture[1]) };
})();
const bendCache = new Map<number, number>();
export const bendAt = (f: number) => {
  const hit = bendCache.get(f);
  if (hit !== undefined) return hit;
  const v = f <= SEP.fPeak ? 0 : f >= T.gesture[1] ? 1 : c01((SEP.peak - handSep(f)) / (SEP.peak - SEP.meet));
  bendCache.set(f, v);
  return v;
};

// ---- geometry helpers -------------------------------------------------------------------------------------------------
/** the brain's anchor row by frame: from fully below the clip line (behind the head) up to BRAIN_Y */
export const brainY = (f: number) => {
  const y0 = BRAIN_CLIP_Y + BRAIN_H + 2;
  return y0 + (BRAIN_Y - y0) * ease(ramp(f, T.rise[0], T.rise[1]));
};
/** a branch's control points at frame f */
export const branchOf = (side: "L" | "R", f: number) => {
  const b = BR[side];
  const k = bendAt(f);
  const c2 = lerp2(b.c2Apart, b.c2Fused, k);
  const tip = lerp2(b.tApart, JOINT, k);
  return { root: b.root, c1: b.c1, c2, tip, k };
};
const cubic = (p0: P2, c1: P2, c2: P2, p1: P2, s: number): P2 => {
  const u = 1 - s;
  const a = u * u * u;
  const b = 3 * u * u * s;
  const c = 3 * u * s * s;
  const d = s * s * s;
  return [a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]];
};
/** the branch centreline point at s: the quadratic plus a soft bough-like wave along its normal (0 at the tip) */
export const branchPt = (side: "L" | "R", f: number, s: number): P2 => {
  const { root, c1, c2, tip } = branchOf(side, f);
  const p = cubic(root, c1, c2, tip, s);
  const q = cubic(root, c1, c2, tip, Math.min(1, s + 0.002));
  const r = cubic(root, c1, c2, tip, Math.max(0, s - 0.002));
  const d: P2 = [q[0] - r[0], q[1] - r[1]];
  const l = Math.hypot(d[0], d[1]) || 1;
  const w = (side === "L" ? 1 : -1) * 4 * Math.sin(Math.PI * 1.7 * s) * (1 - s);
  return [p[0] - (d[1] / l) * w, p[1] + (d[0] / l) * w];
};
/** the branch centreline (s 0 root .. 1 tip), grown to `grow` */
export const branchPts = (side: "L" | "R", f: number, n = 64) => {
  const grow = easeOut(ramp(f, T.grow[0], T.grow[1]));
  const out: { p: P2; d: P2; s: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const s = (grow * i) / n;
    const a = branchPt(side, f, Math.max(0, s - 0.004));
    const b = branchPt(side, f, s + 0.004);
    out.push({ p: branchPt(side, f, s), d: [b[0] - a[0], b[1] - a[1]], s });
  }
  return { pts: out, grow };
};
/** the stem's centreline (s 0 joint .. 1 top), grown to `grow` */
export const stemPts = (f: number, n = 40) => {
  const grow = easeOut(ramp(f, T.stem[0], T.stem[1]));
  const out: { p: P2; d: P2; s: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const s = (grow * i) / n;
    out.push({ p: quad(JOINT, STEM.ctrl, STEM.top, s), d: quadD(JOINT, STEM.ctrl, STEM.top, s), s });
  }
  return { pts: out, grow };
};
const branchW = (s: number, f: number) => {
  const tipW = BR_W.tip + (BR_W.fused - BR_W.tip) * bendAt(f);
  return BR_W.root + (tipW - BR_W.root) * Math.pow(s, 0.85);
};
/** a tapered ribbon polygon over samples [i0, i1] (with a round end at i1 and a taper at i0 when `soft0`) */
const ribbonD = (pts: { p: P2; d: P2; s: number }[], wOf: (s: number) => number, i0 = 0, i1 = pts.length - 1, soft0 = 0) => {
  if (i1 - i0 < 1) return "";
  const L: P2[] = [];
  const R: P2[] = [];
  for (let i = i0; i <= i1; i++) {
    const { p, d } = pts[i];
    const l = Math.hypot(d[0], d[1]) || 1;
    const nx = -d[1] / l;
    const ny = d[0] / l;
    const taper = soft0 > 0 ? Math.min(1, (i - i0) / soft0) : 1;
    const w = (wOf(pts[i].s) / 2) * (0.25 + 0.75 * taper);
    L.push([p[0] + nx * w, p[1] + ny * w]);
    R.push([p[0] - nx * w, p[1] - ny * w]);
  }
  const wEnd = wOf(pts[i1].s) / 2;
  const q = (v: P2) => `${n2(v[0])},${n2(v[1])}`;
  return `M${L.map(q).join("L")}A${n2(wEnd)},${n2(wEnd)} 0 0 1 ${q(R[R.length - 1])}L${R.reverse().map(q).join("L")}Z`;
};

// ---- the marks and plates ---------------------------------------------------------------------------------------------
/** a cream "=" drawn by a moving tip: two bars, each from left to right */
const EqualsMark: React.FC<{ c: P2; t1: number; t2: number; k: number; uid: string }> = ({ c, t1, t2, k, uid }) => {
  if (t1 <= 0) return null;
  const x0 = c[0] - EQ.len / 2;
  const bars = [
    { y: c[1] - EQ.gap / 2, t: t1 },
    { y: c[1] + EQ.gap / 2, t: t2 },
  ];
  const lw = EQ.th;
  return (
    <g>
      <defs>
        <filter id={`${uid}b`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={(6 / k).toFixed(2)} />
        </filter>
      </defs>
      {bars.map((b, i) => {
        if (b.t <= 0) return null;
        const e = easeOut(b.t);
        const x1 = x0 + EQ.len * e;
        const d = `M${n2(x0)},${n2(b.y)}L${n2(Math.max(x0 + 0.01, x1))},${n2(b.y)}`;
        return (
          <g key={i}>
            <path d={d} stroke={PAL.cream} strokeWidth={lw * 1.8} strokeLinecap="round" strokeOpacity={0.28} filter={`url(#${uid}b)`} />
            <path d={d} stroke={PAL.cream} strokeWidth={lw} strokeLinecap="round" strokeOpacity={0.94} />
            {b.t < 1 ? <circle cx={x1} cy={b.y} r={lw * 0.75} fill="#FFFFFF" fillOpacity={0.9 * (1 - b.t)} /> : null}
          </g>
        );
      })}
    </g>
  );
};

/** a soft plate (cream type on a soft dark plate, the clip's SoftPlate look), sliding up while fading in */
const Plate: React.FC<{ c: P2; cap: number; t: number; uid: string; children: React.ReactNode; w: number; ink?: string; track?: number; padK?: number; slide?: number }> = ({
  c,
  cap,
  t,
  uid,
  children,
  w,
  ink = PAL.cream,
  track = 0.06,
  padK = 0.7,
  slide = 0.9,
}) => {
  if (t <= 0) return null;
  const e = easeOut(t);
  const fs = cap / 0.7;
  const pad = cap * padK;
  const wP = w + pad * 2;
  const hP = fs * 0.7 + pad * 1.5;
  const cy = c[1] + slide * cap * (1 - e);
  return (
    <g opacity={e}>
      <defs>
        <filter id={`${uid}f`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation={(hP * 0.08).toFixed(2)} />
        </filter>
      </defs>
      <rect x={c[0] - wP / 2} y={cy - hP / 2} width={wP} height={hP} rx={hP * 0.22} fill={PAL.shadow} fillOpacity={0.5} filter={`url(#${uid}f)`} />
      <rect x={c[0] - wP / 2} y={cy - hP / 2} width={wP} height={hP} rx={hP * 0.22} fill={mixHex(PAL.shadow, "#3A3128", 0.5)} fillOpacity={0.6} />
      <text x={c[0]} y={cy + fs * 0.35} textAnchor="middle" fontFamily={barlow} fontWeight={600} fontSize={fs} letterSpacing={fs * track} fill={ink}>
        {children}
      </text>
    </g>
  );
};
/** the plates' text widths (Barlow Condensed 600 caps ~0.47 em + tracking), for the plate boxes and the checks */
export const plateBox = (text: string, cap: number, track = 0.06, padK = 0.7) => {
  const fs = cap / 0.7;
  const w = text.length * fs * (0.47 + track);
  const pad = cap * padK;
  return { w, wP: w + pad * 2, hP: fs * 0.7 + pad * 1.5 };
};
export const EMC_TEXT = "E = mc2";

// ---- the bough (the Y) --------------------------------------------------------------------------------------------------
/** how far back along each branch the orange fades into the cream from the joint (world units along the branch:
 *  ~140 screen px at k ~1.75), as one long soft gradient with no end */
const ORANGE_BACK = 80;
const Bough: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const fuse = ramp(f, T.fuse[0], T.fuse[1]);
  const spread = easeOut(fuse);
  const halves = (["L", "R"] as const).map((side) => {
    const { pts, grow } = branchPts(side, f);
    if (grow <= 0.001) return null;
    const wOf = (s: number) => branchW(s, f);
    const n = pts.length - 1;
    const cream = ribbonD(pts, wOf);
    // the stretch within ORANGE_BACK of the joint (by arc length from the tip), painted with a gradient that fades
    // from orange at the joint to nothing; it reaches its full length as the fusion spreads
    let i0 = n;
    let acc = 0;
    while (i0 > 0 && acc < ORANGE_BACK) {
      acc += Math.hypot(pts[i0].p[0] - pts[i0 - 1].p[0], pts[i0].p[1] - pts[i0 - 1].p[1]);
      i0--;
    }
    const orange = spread > 0.001 && n - i0 >= 2 ? ribbonD(pts, (s) => wOf(s) + 0.6, i0, n) : "";
    const back = pts[i0].p;
    const tipP = pts[n].p;
    // the gradient's transparent end slides back from the joint to the full ORANGE_BACK as it spreads
    const g0: P2 = [tipP[0] + (back[0] - tipP[0]) * spread, tipP[1] + (back[1] - tipP[1]) * spread];
    return { side, cream, orange, tipP, grow, g0 };
  });
  const st = stemPts(f);
  const stem = st.grow > 0.01 ? ribbonD(st.pts, (s) => STEM.w0 + (STEM.w1 - STEM.w0) * s) : "";
  const stemTip = st.pts[st.pts.length - 1].p;
  return (
    <g>
      <defs>
        <filter id="bgh" x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation={(9 / k).toFixed(2)} />
        </filter>
      </defs>
      {halves.map((h) =>
        h ? (
          <g key={h.side}>
            <path d={h.cream} fill={PAL.cream} fillOpacity={0.32} filter="url(#bgh)" />
            <path d={h.cream} fill={PAL.cream} fillOpacity={0.93} />
            {h.orange ? (
              <>
                <defs>
                  <linearGradient id={`og${h.side}`} gradientUnits="userSpaceOnUse" x1={n2(h.tipP[0])} y1={n2(h.tipP[1])} x2={n2(h.g0[0])} y2={n2(h.g0[1])}>
                    {[0, 0.25, 0.5, 0.75, 1].map((o) => (
                      <stop key={o} offset={o} stopColor={ACCENT} stopOpacity={Math.pow(1 - o, 1.6) * Math.min(1, spread * 3)} />
                    ))}
                  </linearGradient>
                </defs>
                <path d={h.orange} fill={`url(#og${h.side})`} />
              </>
            ) : null}
            {h.grow < 0.999 ? <circle cx={h.tipP[0]} cy={h.tipP[1]} r={5} fill="#FFFFFF" fillOpacity={0.85 * (1 - h.grow)} /> : null}
          </g>
        ) : null,
      )}
      {stem ? (
        <g>
          <path d={stem} fill={ACCENT} fillOpacity={0.6} filter="url(#bgh)" />
          <path d={stem} fill={ACCENT} />
          {st.grow < 0.999 ? <circle cx={stemTip[0]} cy={stemTip[1]} r={6} fill="#FFF3D6" fillOpacity={0.9 * (1 - st.grow)} /> : null}
        </g>
      ) : null}
      {/* the joint's warm core at the moment of fusion (on the joint, fading into the orange) */}
      {fuse > 0 ? <circle cx={JOINT[0]} cy={JOINT[1]} r={16} fill={ACCENT} fillOpacity={0.5 * (1 - fuse)} filter="url(#bgh)" /> : null}
      {/* the joint itself, solid orange (covers the branch tips' round ends under the stem's base) */}
      {fuse > 0 ? <circle cx={JOINT[0]} cy={JOINT[1]} r={BR_W.fused / 2 + 1.2} fill={ACCENT} fillOpacity={Math.min(1, fuse * 3)} /> : null}
      {/* a small soft orange glow that stays on the joint */}
      {fuse > 0 ? <circle cx={JOINT[0]} cy={JOINT[1]} r={12} fill={ACCENT} fillOpacity={0.42 * easeOut(fuse)} filter="url(#bgh)" /> : null}
    </g>
  );
};

// ---- the cut ------------------------------------------------------------------------------------------------------------
const SameBrainAsEinstein: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A: AirWorld = airWorldOf({ cam, rest: REST, depth: DEPTH, frame });
  const k = cam.k;
  const me = A.P.at(ME_X, 0);
  const ein = A.P.at(EIN_X, 0);
  const mp = mePose(frame);
  const ep = einPose(frame);
  const by = brainY(frame);
  const glow = 0.55 * ease(ramp(frame, T.glow[0], T.glow[1]));
  const eqC: P2 = (() => {
    const u = ease(ramp(frame, T.eqMove[0], T.eqMove[1]));
    return [EQ_BODY[0] + (EQ_BRAIN[0] - EQ_BODY[0]) * u, EQ_BODY[1] + (EQ_BRAIN[1] - EQ_BODY[1]) * u];
  })();
  const nb = plateBox("86 BILLION NEURONS", NEURON_PLATE.cap, NEURON_PLATE.track, NEURON_PLATE.padK);
  const emb = plateBox(EMC_TEXT, EMC.cap, EMC.track, EMC.padK);
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-3200} x1={3200} z0={-1300} z1={5200} mat={MAT.ground} course={170} />
        <AirHorizonHazeW A={A} id="haze" />
        <AirShadow A={A} X={ME_X} Z={0} w={62} d={30} uid="meS" amt={0.8} />
        <AirShadow A={A} X={EIN_X} Z={0} w={66} d={30} uid="einS" amt={0.8} />
        {/* the brains rise out from behind the head tops: masked below the hair-top row, drawn behind the figures */}
        <defs>
          <linearGradient id="brainMaskG" gradientUnits="userSpaceOnUse" x1="0" y1={BRAIN_CLIP_Y - BRAIN_FEATHER} x2="0" y2={BRAIN_CLIP_Y}>
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#000000" />
          </linearGradient>
          <mask id="brainMask" maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
            <rect x={-4000} y={-4000} width={8000} height={8000} fill="url(#brainMaskG)" />
          </mask>
        </defs>
        <g mask="url(#brainMask)">
          <Brain x={ME_X} y={by} size={BRAIN_W} uid="brMe" unitPx={k} variant={0} />
          <Brain x={EIN_X} y={by} size={BRAIN_W} uid="brEin" unitPx={k} variant={1} glow={glow} />
        </g>
        <Me pose={mp} at={me.at} scale={me.scale} frame={frame} unitPx={k} fog={A.folkFog(0)} />
        <Einstein pose={ep} at={ein.at} scale={ein.scale} frame={frame} unitPx={k} fog={A.folkFog(0)} />
        <EqualsMark c={eqC} t1={ramp(frame, T.eq1[0], T.eq1[1])} t2={ramp(frame, T.eq2[0], T.eq2[1])} k={k} uid="eq" />
        <Plate c={[NEURON_PLATE.X, NEURON_PLATE.Y]} cap={NEURON_PLATE.cap} t={ramp(frame, T.neurons[0], T.neurons[0] + 13)} uid="pn" w={nb.w} padK={NEURON_PLATE.padK} track={NEURON_PLATE.track}>
          86 BILLION NEURONS
        </Plate>
        <Bough f={frame} k={k} />
        <Plate c={[EMC.X, EMC.Y]} cap={EMC.cap} t={ramp(frame, T.emc[0], T.emc[1])} uid="pemc" w={emb.w} ink={ACCENT} track={EMC.track} padK={EMC.padK} slide={EMC.slide}>
          E = mc
          <tspan baselineShift="super" fontSize={(EMC.cap / 0.7) * 0.62}>
            2
          </tspan>
        </Plate>
      </WorldSvg>
    </AirStage>
  );
};

export default SameBrainAsEinstein;
