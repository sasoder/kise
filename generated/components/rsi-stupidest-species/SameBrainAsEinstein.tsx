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
// THE MOTION: ME (left) and EINSTEIN (right) stand side by side on the sandy floor, the same height, while one slow
// push-in runs the whole cut (k 1.66 -> 1.765) and, from "Yet", drifts toward Einstein. They glance at each other as ONE
// cream "=" is drawn between their bodies by a moving tip ("species", f7-f16); the two brains (v0 / v1, the same size)
// rise from behind their head tops to float above the hair (f24-f45, never scaled in) while that same "=" is carried up
// in one smooth move to sit between them (f28-f48, "design"); on "number" / "neurons" one soft plate 86 BILLION
// NEURONS slides up under both brains (f78-f91). On "Yet" two cream branches grow in from the frame edges (f100-f118):
// the left one from the left edge above Me's brain, the right one lower from the right edge, both sloping up toward a
// point above Einstein's brain, their tips still apart. Einstein raises his hands (unify pose, up f102-f114, a short
// hold) and gathers them (f118-f138); the branch tips bend in with his hands and meet at "unify" (f138), and from the
// joint ONE orange stem grows straight up and out of the top of the frame (f138-f151, the orange running up it and a
// little way back along each branch): two branches become one. The E = mc² plate (cap ~53 px) settles beside the joint, right of the stem (f141-f153)
// and Einstein's brain glows faintly orange from inside (f132-f152). ME glances over at him (f100-f116) and, once the
// idea has fused, gives a small shrug (f142-f175). Hold f152-f177: the pair, the brains, the plate, the orange stem;
// the camera creeps.
// CAUSE BEFORE EFFECT: the branch tips' bend is driven by Einstein's hands (the unify pose's "together" phase, t 0.45
// -> 0.82 = f118 -> f138): contact (tips meet) f138, first orange f138 (the joint), the brain's glow from f132.
// Orange = intelligence (COMMON.md): the joint, the one stem, the E = mc² type and Einstein's brain glow only. People
// in their own colours, brains pink-oatmeal, the "=" mark and the two separate branches cream.
//
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
import { Easing, interpolate, useCurrentFrame } from "remotion";
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
import { Einstein, Me, PAIR_YAW, PERSON_POSES, lerpPose, type PersonPose } from "./stupidestFolk";

export const FPS = 24000 / 1001;
export const DURATION = 178;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: barlow } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });
const PAL = AIR.A;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
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
export const EMC = { X: 245, Y: -542, cap: 30, padK: 0.22, track: 0, slide: 0.15 };

// ---- timing ---------------------------------------------------------------------------------------------------------
const T = {
  eq1: [7, 12] as const, // the top bar of the "=" between the bodies (species 9)
  eq2: [11, 16] as const,
  rise: [24, 45] as const, // the brains rise from behind the heads (the 24 · brain 41)
  eqMove: [28, 48] as const, // the same "=" carried up between the brains as they arrive (design 47)
  neurons: [78, 91] as const, // number 82 · neurons 91
  grow: [100, 118] as const, // Yet 102: the branches grow in
  fuse: [138, 148] as const, // unify 138: the orange starts at the joint, a little way back along each branch
  stem: [138, 151] as const, // ... and runs UP the one stem as it grows out of the joint
  emc: [141, 153] as const,
  glow: [132, 152] as const,
};
/** Einstein's unify t (UNIFY_T: up 0..0.3, apart 0.3..0.45, together 0.45..0.82, press 0.82..1) by frame */
export const unifyT = (f: number) => interpolate(f, [102, 114, 118, 138, 150], [0, 0.3, 0.45, 0.82, 1], clamp);
/** the branch tips' bend toward the joint follows the hands' "together" phase */
export const bendAt = (f: number) => ease((unifyT(f) - 0.45) / (0.82 - 0.45));

// ---- camera: one slow push-in, the drift toward Einstein from "Yet" -----------------------------------------------------
const DEPTH: DepthOpts = { eyeY: -220, dRef: 1800, kRef: 1.7, dolly: 0.5 };
const camAt = makeCamera(
  [
    { f: 0, k: 1.66, wx: 0, wy: -178 },
    { f: 64, k: 1.715, wx: 0, wy: -178 },
    { f: 146, k: 1.755, wx: 50, wy: -186 },
    { f: DURATION - 1, k: 1.765, wx: 54, wy: -186 },
  ].map((q) => ({ ...q, sy: 960 })),
  true,
);
export const camOf = (f: number) => swayCam(camAt(f), f);
const REST = swayCam(camAt(0), 0);

// ---- poses ----------------------------------------------------------------------------------------------------------
/** they glance at each other on "same species", then face out as the brains rise */
const pairGlance = (f: number) => ease(ramp(f, 2, 18)) * (1 - ease(ramp(f, 30, 46)));
export const mePose = (f: number): PersonPose => {
  // he watches Einstein from "Yet" and, once the idea has fused, gives a small resigned shrug ("whole branches")
  const up = ease(ramp(f, 142, 153)) * (1 - ease(ramp(f, 163, 175)));
  const stand = PERSON_POSES.stand(PAIR_YAW.me, f);
  const base = up > 0 ? (lerpPose(stand, PERSON_POSES.shrug("me", PAIR_YAW.me, 0.5, f), 0.7 * up) as PersonPose) : stand;
  const g = Math.max(pairGlance(f), ease(ramp(f, 100, 116)));
  return PERSON_POSES.glance(base, 1, g);
};
export const einPose = (f: number): PersonPose => {
  const base = PERSON_POSES.unify(PAIR_YAW.einstein, unifyT(f), f);
  return PERSON_POSES.glance(base, -1, pairGlance(f));
};

// ---- geometry helpers -------------------------------------------------------------------------------------------------
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const quad = (p0: P2, c: P2, p1: P2, s: number): P2 => {
  const u = 1 - s;
  return [u * u * p0[0] + 2 * u * s * c[0] + s * s * p1[0], u * u * p0[1] + 2 * u * s * c[1] + s * s * p1[1]];
};
const quadD = (p0: P2, c: P2, p1: P2, s: number): P2 => {
  const u = 1 - s;
  return [2 * u * (c[0] - p0[0]) + 2 * s * (p1[0] - c[0]), 2 * u * (c[1] - p0[1]) + 2 * s * (p1[1] - c[1])];
};
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
