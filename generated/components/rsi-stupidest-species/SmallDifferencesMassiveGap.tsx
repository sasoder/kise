// ---------------------------------------------------------------------------
// SmallDifferencesMassiveGap (rsi-stupidest-species, cut 25). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 159 frames.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d; the two brains are the clip's shared W3 brain (./brainShared).
//
// CHECK LINE: "Two brains that are almost exactly the same can have wildly different abilities: a hair's difference at
//   the bottom, a tower's difference at the top."
//
// THE LINE: "The first is that even small differences between human brains can produce massive differences in
//   capability. For example, the"
// WORD -> FRAME: The 1 · first 3 · is 10 · that 19 · even 24 · small 31 · differences 39 · between 49 · human 56 ·
//   brains 66 · can 74 · produce 85 · massive 92 · differences 108 · in 120 · capability 128 · For 143 · example 150 ·
//   the 156
// DURATION: the slot 25.192 -> 31.823 s = 6.631 s x 24000/1001 = 159 frames (f0..f158).
//
// THE MOTION: two near-identical brains (W3 variants: v0 left = the speaker's, v1 right = Einstein's, as cut E) stand
// on two low stone plinths, large (~320 px, spanning the keep-in box); a slim cream calliper floats between them and
// closes its jaws (f2-f30), backs off to a hair's gap on "differences" (f40) and holds it (settled f48) while the camera
// creeps in (the calliper: ~300 px, its beam spanning brain to brain behind their inner edges, a matching lower and
// upper pair of jaws so the same hair's gap shows twice). On "can" (f74) both brains light from inside (glow 0 -> 0.55 by f86, identical); from f76 a wide orange
// column (~85 % of a brain's width) is pushed up out of the back of each plinth, BEHIND its brain, as a stack of
// glowing courses (the courses ride up with the top: the stack grows from the plinth, never scales). The left brakes
// to a stub (settled f104, ~165 px above its brain); the right keeps climbing and leaves the top of the frame (~f100),
// its courses still streaming up until it comes to rest at f124. One eased camera move (f72-f128) cranes UP a little
// with a slight pull-back (k 1.05 -> 0.95), so the resolved frame keeps the brains big (~290 px) and low (tops
// ~y 850), the stub clear above the left brain, the right column towering out past the top edge. Hold f128-f158: a
// slow creep, the orange breathing faintly, motes. The floor below the plinths sinks into the dense low air.
// CAUSE BEFORE EFFECT: the brains' glow starts f72; the columns break out of the plinth tops at f76 (the brains light,
//   then reach). The calliper's jaws: contact f30 (closed), back off to the gap f40.
// Orange = intelligence / capability (COMMON.md): the two columns and the brains' inner glow only. Brains pink-oatmeal,
// plinths stone, calliper cream. No text.
//
// DEPTH: floor Y = 0; eye from Y -300 (a little above the plinth tops) to -440 (rising with the crane); dRef 1800 at
// kRef 1.05, dolly 0.5; fog by depth. Plinths Z -130..300; brains Z -20 (the front of the plinth top); columns Z 150,
// R 128 (behind the brains); calliper Z -20.
//
// SOURCES: none on screen (an illustration of the speaker's claim; no numbers).
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AIR,
  AirBox,
  AirFloor,
  AirHorizonHazeW,
  AirShadow,
  AirStage,
  MAT,
  ORANGE_LINE,
  WorldSvg,
  airWorldOf,
  mixHex,
  pchip,
  perspective,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { BRAIN_ASPECT, Brain } from "./brainShared";

export const FPS = 24000 / 1001;
export const DURATION = 159;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const n2 = (v: number) => v.toFixed(2);
const pts = (q: P2[]) => q.map((p) => `${n2(p[0])},${n2(p[1])}`).join(" ");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- the world ----------------------------------------------------------------------------------------------------
export const BRAIN_W = 300;
export const BRAIN_X: [number, number] = [-290, 290];
export const BRAIN_Z = -20;
export const PLINTH_H = 150;
const PLINTH = { hw: 178, z0: -130, z1: 300 };
const BRAIN_H = BRAIN_ASPECT * BRAIN_W;
const BRAIN_MID = -PLINTH_H - BRAIN_H * 0.5;
/** the columns: radius (~85 % of a brain's width), depth (behind the brain), base on the plinth top */
export const COL_R = 128;
export const COL_Z = 150;
const COL_BASE = -PLINTH_H;
/** the stub stands ~170 units above its brain's top; the tower goes far past the frame's top */
export const LEFT_TOP = -PLINTH_H - BRAIN_H - 170;
export const RIGHT_TOP = -1480;
/** the courses: the stack's block height (world units) */
const COURSE = 150;

const riseL = (f: number) => interpolate(f, [76, 104], [COL_BASE, LEFT_TOP], { ...clamp, easing: Easing.bezier(0.3, 0.45, 0.35, 1) });
const climbR = (f: number) => interpolate(f, [82, 124], [0, RIGHT_TOP - LEFT_TOP], { ...clamp, easing: Easing.bezier(0.4, 0, 0.4, 1) });
/** the columns' tops (world Y): the same rise to ~f86, then the left brakes and the right climbs on */
export const colTop = (side: 0 | 1, f: number) => (side === 0 ? riseL(f) : riseL(f) + climbR(f));

/** the brains' inner glow: identical for both */
export const glowAt = (f: number) => interpolate(f, [72, 86], [0, 0.55], { ...clamp, easing: Easing.inOut(Easing.sin) }) * (1 + 0.06 * Math.sin((f - 86) / 7) * interpolate(f, [86, 100], [0, 1], clamp));

/** the calliper's opening between its jaws' inner faces (local units): it closes from wide (f2-f30, contact f30),
 *  backs off to a hair's gap on "differences" (f40) and holds it (settled f48) */
export const GAP_FINAL = 8;
export const sliderAt = (f: number) => {
  const close = interpolate(f, [2, 30], [92, 0], { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) });
  const back = interpolate(f, [30, 40, 48], [0, GAP_FINAL * 1.25, GAP_FINAL], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return close + back;
};

// ---- the camera -----------------------------------------------------------------------------------------------------
// Keyed in screen terms: the zoom k (log) and the screen row B of the plinth tops under the brains; the camera's
// centre is solved from them every frame. A creep in (f0-f70), then ONE eased move (f72-f128): a crane up (the brains
// sink ~120 px) with a slight pull-back; a slow creep in the hold. The eye rises with the crane.
const DEPTH0 = { dRef: 1800, kRef: 1.05, dolly: 0.5 };
const EYE0 = -300;
const EYE1 = -440;
const LOGK = pchip(
  [
    [0, Math.log(1.03)],
    [70, Math.log(1.055)],
    [128, Math.log(0.955)],
    [DURATION, Math.log(0.945)],
  ],
  true,
);
const ROWB = pchip(
  [
    [0, 935],
    [70, 948],
    [128, 1064],
    [DURATION, 1068],
  ],
  true,
);
const CX = (f: number) => interpolate(f, [72, 128], [0, 14], { ...clamp, easing: Easing.inOut(Easing.sin) });
const eyeAt = (f: number) => interpolate(f, [72, 128], [EYE0, EYE1], { ...clamp, easing: Easing.inOut(Easing.sin) });
const camBase = (f: number) => {
  const k = Math.exp(LOGK(f));
  const depth: DepthOpts = { eyeY: eyeAt(f), ...DEPTH0 };
  const P = perspective({ cx: 0, cy: 0, k }, depth);
  const rowY = P.p(0, -PLINTH_H, BRAIN_Z)[1];
  const cam: Cam = { k, cx: CX(f), cy: rowY - (ROWB(f) - 960) / k };
  return { cam, depth };
};
export const camOf = (f: number) => {
  const b = camBase(f);
  return { cam: swayCam(b.cam, f), depth: b.depth };
};
const REST = camOf(0);

// ---- the column: an air-lit orange stack pushed up out of the plinth -------------------------------------------------
const OR = { lit: "#FFB000", mid: "#E8960A", dark: "#A8640A", hot: "#FFE7A8" };
const Column: React.FC<{ A: AirWorld; X: number; Z: number; R: number; Yb: number; Yt: number; uid: string; breathe: number }> = ({ A, X, Z, R, Yb, Yt, uid, breathe }) => {
  if (Yt > Yb - 0.5) return null;
  const P = A.P;
  const N = 28;
  const arc = (Y: number, a0: number, a1: number) => Array.from({ length: N + 1 }, (_, i) => P.p(X + R * Math.cos(a0 + ((a1 - a0) * i) / N), Y, Z - R * Math.sin(a0 + ((a1 - a0) * i) / N)));
  const topNear = arc(Yt, 0, Math.PI); // right -> left over the near side
  const botNear = arc(Yb, Math.PI, 0); // left -> right
  const h = -(Yt + Yb) / 2;
  const t = (hex: string) => A.toneO(mixHex(hex, OR.hot, breathe), Z, h);
  const x0 = P.p(X - R, Yt, Z)[0];
  const x1 = P.p(X + R, Yt, Z)[0];
  const topSeen = Yt > P.horizonY;
  const ell = Array.from({ length: 2 * N }, (_, i) => P.p(X + R * Math.cos((Math.PI * i) / N), Yt, Z - R * Math.sin((Math.PI * i) / N)));
  const lw = A.lw(1.0);
  const ln = A.toneO(ORANGE_LINE, Z, h);
  // the courses: joints every COURSE below the top (they ride up with it: the stack is pushed out of the plinth)
  let joints = "";
  for (let Y = Yt + COURSE; Y < Yb - 6; Y += COURSE) {
    const q = arc(Y, 0, Math.PI).reverse();
    joints += `M${q.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}`;
  }
  const edge = (a: number) => {
    const p0 = P.p(X + R * Math.cos(a), Yt, Z - R * Math.sin(a));
    const p1 = P.p(X + R * Math.cos(a), Yb, Z - R * Math.sin(a));
    return `M${n2(p0[0])},${n2(p0[1])}L${n2(p1[0])},${n2(p1[1])}`;
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1={n2(x0)} y1="0" x2={n2(x1)} y2="0">
          <stop offset="0" stopColor={t(OR.mid)} />
          <stop offset="0.22" stopColor={t(OR.lit)} />
          <stop offset="0.55" stopColor={t(mixHex(OR.lit, OR.mid, 0.55))} />
          <stop offset="0.86" stopColor={t(OR.dark)} />
          <stop offset="1" stopColor={t(mixHex(OR.mid, A.airHex(Z, h), 0.35))} />
        </linearGradient>
      </defs>
      <polygon points={pts([...topNear, ...botNear])} fill={`url(#${uid}g)`} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />
      {joints ? <path d={joints} fill="none" stroke={ln} strokeWidth={lw * 0.9} strokeOpacity={0.42} /> : null}
      {joints ? <path d={joints} fill="none" stroke={OR.hot} strokeWidth={lw * 0.8} strokeOpacity={0.22} transform={`translate(0 ${n2(lw * 1.4)})`} /> : null}
      {topSeen ? <polygon points={pts(ell)} fill={t(mixHex(OR.lit, OR.hot, 0.45))} stroke={ln} strokeWidth={lw} /> : null}
      {/* the cream rim down the lit edge, and the top's near rim */}
      <path d={edge(Math.PI * 0.9)} stroke={PAL.cream} strokeWidth={lw * 1.6} strokeOpacity={0.45} strokeLinecap="round" />
      <polyline points={pts(topNear)} fill="none" stroke={OR.hot} strokeWidth={lw * 1.5} strokeOpacity={0.6} strokeLinecap="round" />
    </g>
  );
};

// ---- the calliper: a slim cream vernier calliper lying horizontally between the brains, a little below their
// midlines, drawn BEHIND them so the beam's two ends tuck behind the brains' inner edges (it spans brain to brain).
// Local units (x right, y down, the beam's centre line y = 0): the beam -150..175; the fixed head at the left with a
// big lower jaw and a small upper (inside) jaw; the sliding head carries the matching pair, so the opening shows twice,
// the same gap below and above the beam; vernier ticks along the beam, a window and a thumbwheel on the head.
const CR = { lit: PAL.cream, mid: PAL.creamLo, dark: "#A89C82", line: "#6E6350" };
const XF = -86; // the fixed jaws' inner face
const Calliper: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; s: number; gap: number }> = ({ A, X, Y, Z, s, gap }) => {
  const P = A.P;
  const r = P.r(Z);
  const o = P.p(X, Y, Z);
  const L = (x: number, y: number): P2 => [o[0] + x * s * r, o[1] + y * 1.3 * s * r];
  const tn = (hex: string) => A.tone(hex, Z, -Y);
  const lw = A.lw(1.0);
  const xs = XF + gap; // the sliding jaws' inner face
  const ln = tn(CR.line);
  const poly = (q: P2[], fill: string, key: string) => <polygon key={key} points={pts(q)} fill={fill} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />;
  const seg = (a: P2, b: P2) => `M${n2(a[0])},${n2(a[1])}L${n2(b[0])},${n2(b[1])}`;
  // the beam and its scale
  const beam: P2[] = [L(-150, -8), L(175, -8), L(175, 8), L(-150, 8)];
  let ticks = "";
  for (let i = 0; i <= 32; i++) {
    const x = -66 + i * 7.5;
    if (x > 175 - 4) break;
    if (x > xs - 4 && x < xs + 50) continue; // under the sliding head
    ticks += seg(L(x, 8), L(x, i % 5 === 0 ? -1 : 3));
  }
  // the fixed head: lower jaw (tapering to a point at its inner face) and the small upper knife
  const fixLow: P2[] = [L(XF - 34, 8), L(XF, 8), L(XF, 56), L(XF - 6, 60), L(XF - 22, 32)];
  const fixUp: P2[] = [L(XF - 14, -8), L(XF, -8), L(XF, -36), L(XF - 3, -38), L(XF - 12, -20)];
  const fixHead: P2[] = [L(XF - 40, -13), L(XF, -13), L(XF, 13), L(XF - 40, 13)];
  // the sliding head and its pair of jaws, mirrored
  const slLow: P2[] = [L(xs, 8), L(xs + 34, 8), L(xs + 22, 32), L(xs + 6, 60), L(xs, 56)];
  const slUp: P2[] = [L(xs, -8), L(xs + 14, -8), L(xs + 12, -20), L(xs + 3, -38), L(xs, -36)];
  const slHead: P2[] = [L(xs, -14), L(xs + 50, -14), L(xs + 50, 15), L(xs, 15)];
  const win: P2[] = [L(xs + 7, 1), L(xs + 43, 1), L(xs + 43, 10), L(xs + 7, 10)];
  let vt = "";
  for (let i = 0; i <= 6; i++) vt += seg(L(xs + 9 + i * 5.5, 10), L(xs + 9 + i * 5.5, i % 3 === 0 ? 4 : 7));
  const wheel = L(xs + 25, 22);
  return (
    <g>
      {poly(beam, tn(CR.mid), "beam")}
      <path d={ticks} stroke={ln} strokeWidth={lw * 0.8} strokeOpacity={0.75} />
      <path d={seg(L(-149, -6.5), L(174, -6.5))} stroke={tn(CR.lit)} strokeWidth={lw * 1.3} strokeOpacity={0.9} strokeLinecap="round" />
      {poly(fixLow, tn(CR.lit), "fl")}
      {poly(fixUp, tn(CR.lit), "fu")}
      {poly(fixHead, tn(mixHex(CR.mid, CR.lit, 0.4)), "fh")}
      {poly(slLow, tn(CR.mid), "sl")}
      {poly(slUp, tn(CR.mid), "su")}
      <circle cx={n2(wheel[0])} cy={n2(wheel[1])} r={n2(8.5 * s * r)} fill={tn(mixHex(CR.mid, CR.dark, 0.6))} stroke={ln} strokeWidth={lw} />
      {poly(slHead, tn(mixHex(CR.mid, CR.dark, 0.3)), "sh")}
      {poly(win, tn(mixHex(CR.lit, CR.mid, 0.3)), "win")}
      <path d={vt} stroke={ln} strokeWidth={lw * 0.7} strokeOpacity={0.8} />
      <path d={seg(L(xs + 1, -12.5), L(xs + 49, -12.5))} stroke={tn(CR.lit)} strokeWidth={lw * 1.2} strokeOpacity={0.85} strokeLinecap="round" />
      <path d={seg(L(XF - 39, -11.5), L(XF - 1, -11.5))} stroke={tn(CR.lit)} strokeWidth={lw * 1.2} strokeOpacity={0.85} strokeLinecap="round" />
    </g>
  );
};
/** the calliper's place: the beam a little below the brains' midlines, spanning brain to brain; local unit scale */
export const CAL = { X: -14, Y: BRAIN_MID - 8, Z: BRAIN_Z + 4, s: 0.95 };

const SmallDifferencesMassiveGap: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const { cam, depth } = camOf(cf);
  const A = airWorldOf({ cam, rest: REST.cam, depth, frame, fogBy: "depth" });
  const P = A.P;
  const gl = glowAt(frame);
  const lowAir = mixHex(PAL.ramp[PAL.ramp.length - 3][1], PAL.shadow, 0.15);
  const breathe = 0.05 * (0.5 + 0.5 * Math.sin(frame / 8)) * interpolate(frame, [100, 128], [0, 1], clamp);
  const plinth = (i: 0 | 1) => (
    <AirBox key={`pl${i}`} A={A} X0={BRAIN_X[i] - PLINTH.hw} X1={BRAIN_X[i] + PLINTH.hw} Y0={-PLINTH_H} Y1={0} Z0={PLINTH.z0} Z1={PLINTH.z1} mat={MAT.stone} uid={`pl${i}`} />
  );
  const brain = (i: 0 | 1) => {
    const a = P.p(BRAIN_X[i], -PLINTH_H, BRAIN_Z);
    const r = P.r(BRAIN_Z);
    return <Brain key={`br${i}`} x={a[0]} y={a[1]} size={BRAIN_W * r} uid={`br${i}`} unitPx={cam.k * r} glow={gl} variant={i} />;
  };
  const column = (i: 0 | 1) => (
    <g key={`col${i}`}>
      <AirShadow A={A} X={BRAIN_X[i]} Z={COL_Z} Y={-PLINTH_H} w={COL_R * 1.15} d={COL_R * 0.8} uid={`cs${i}`} amt={0.55 * c01((COL_BASE - colTop(i, frame)) / 30)} />
      <Column A={A} X={BRAIN_X[i]} Z={COL_Z} R={COL_R} Yb={COL_BASE} Yt={colTop(i, frame)} uid={`c${i}`} breathe={breathe} />
    </g>
  );
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-6000} x1={6000} z0={-9000} z1={7000} mat={MAT.ground} course={260} jointAmt={0.6} />
        <AirHorizonHazeW A={A} id="haze" />
        <AirShadow A={A} X={BRAIN_X[0]} Z={PLINTH.z0 + 210} w={PLINTH.hw * 1.15} d={240} uid="pls0" amt={0.6} />
        <AirShadow A={A} X={BRAIN_X[1]} Z={PLINTH.z0 + 210} w={PLINTH.hw * 1.15} d={240} uid="pls1" amt={0.6} />
        {plinth(0)}
        {plinth(1)}
        {column(0)}
        {column(1)}
        <Calliper A={A} X={CAL.X} Y={CAL.Y} Z={CAL.Z} s={CAL.s} gap={sliderAt(frame)} />
        <AirShadow A={A} X={BRAIN_X[0] + 10} Z={BRAIN_Z} Y={-PLINTH_H} w={0.42 * BRAIN_W} d={0.16 * BRAIN_W} uid="bs0" amt={0.75} />
        <AirShadow A={A} X={BRAIN_X[1] + 10} Z={BRAIN_Z} Y={-PLINTH_H} w={0.42 * BRAIN_W} d={0.16 * BRAIN_W} uid="bs1" amt={0.75} />
        {brain(0)}
        {brain(1)}
      </WorldSvg>
      {/* the lower frame sinks into the dense low air (no flat floor face under the captions) */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="lowAir" x1="0" y1="1180" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={lowAir} stopOpacity={0} />
            <stop offset="0.55" stopColor={lowAir} stopOpacity={0.5} />
            <stop offset="1" stopColor={lowAir} stopOpacity={0.82} />
          </linearGradient>
        </defs>
        <rect x={0} y={1180} width={1080} height={740} fill="url(#lowAir)" />
      </svg>
    </AirStage>
  );
};

const c01 = (v: number) => Math.max(0, Math.min(1, v));

export default SmallDifferencesMassiveGap;
