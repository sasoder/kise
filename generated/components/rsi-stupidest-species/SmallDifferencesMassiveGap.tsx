// ---------------------------------------------------------------------------
// SmallDifferencesMassiveGap (rsi-stupidest-species, cut 25). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 159 frames.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d; the two brains are the clip's shared W3 brain (./brainShared).
//
// CHECK LINE: "Look at one brain, then another that looks just the same: yet one reaches a little and the other towers."
//
// THE LINE: "The first is that even small differences between human brains can produce massive differences in
//   capability. For example, the"
// WORD -> FRAME: The 1 · first 3 · is 10 · that 19 · even 24 · small 31 · differences 39 · between 49 · human 56 ·
//   brains 66 · can 74 · produce 85 · massive 92 · differences 108 · in 120 · capability 128 · For 143 · example 150 ·
//   the 156
// DURATION: the slot 25.192 -> 31.823 s = 6.631 s x 24000/1001 = 159 frames (f0..f158).
//
// THE MOTION (rev 1: the calliper is gone; one continuous camera, pan -> pull-back -> crane): two near-identical
// brains (W3 variants: v0 left = the speaker's, v1 right = Einstein's, as cut E) on two low stone plinths. f0: CLOSE
// on the left brain (~670 px wide, ~70 % of the keep-in width), the camera drifting right and pushing in a touch; it
// trucks right (f18-f70, most of the travel over "small differences between human brains", peak ~41 px/f, parallax
// on the plinths) and settles on the right brain at the same closeness (~720 px) on "brains": it looks the same. On
// "can" (f72) both brains light from inside (glow 0 -> 0.55 by f86, identical) and the camera pulls back fast
// (f70-f94, k 2.37 -> 1.06) to show both brains on their plinths, carrying on into v1's crane up (to f128). From f80
// a wide orange column (~85 % of a brain's width) shoots up out of the back of each plinth, BEHIND its brain, as a
// stack of glowing courses (the stack grows from the plinth, never scales); the left one is seen rising as it comes
// into frame. The left brakes to a stub (settled f106, ~165 px above its brain); the right climbs on, leaves the top
// of the frame (~f107) and comes to rest at f124. Resolved (as v1): brains ~290 px, low (tops ~y 845), the stub clear
// above the left brain, the right column towering out past the top edge. Hold f128-f158: a slow creep, the orange
// breathing faintly, motes. The floor below the plinths sinks into the dense low air.
// CAUSE BEFORE EFFECT: the brains' glow starts f72; the columns break out of the plinth tops at f80 (the brains light,
//   then reach).
// Orange = intelligence / capability (COMMON.md): the two columns and the brains' inner glow only. Brains pink-oatmeal,
// plinths stone. No text.
//
// DEPTH: floor Y = 0; eye from Y -300 (a little above the plinth tops) to -440 (rising with the crane); dRef 1800 at
// kRef 1.05, dolly 0.5 (the camera is closer in the close-ups); the vanishing point travels with the camera centre, so
// the pan is a truck. Fog by depth. Plinths Z -130..300; brains Z -20 (the front of the plinth top); columns Z 150,
// R 128 (behind the brains).
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
/** the columns: radius (~85 % of a brain's width), depth (behind the brain), base on the plinth top */
export const COL_R = 128;
export const COL_Z = 150;
const COL_BASE = -PLINTH_H;
/** the stub stands ~170 units above its brain's top; the tower goes far past the frame's top */
export const LEFT_TOP = -PLINTH_H - BRAIN_H - 170;
export const RIGHT_TOP = -1480;
/** the courses: the stack's block height (world units) */
const COURSE = 150;

const riseL = (f: number) => interpolate(f, [80, 106], [COL_BASE, LEFT_TOP], { ...clamp, easing: Easing.bezier(0.3, 0.45, 0.35, 1) });
const climbR = (f: number) => interpolate(f, [86, 124], [0, RIGHT_TOP - LEFT_TOP], { ...clamp, easing: Easing.bezier(0.4, 0, 0.4, 1) });
/** the columns' tops (world Y): the same rise to ~f86, then the left brakes and the right climbs on */
export const colTop = (side: 0 | 1, f: number) => (side === 0 ? riseL(f) : riseL(f) + climbR(f));

/** the brains' inner glow: identical for both */
export const glowAt = (f: number) => interpolate(f, [72, 86], [0, 0.55], { ...clamp, easing: Easing.inOut(Easing.sin) }) * (1 + 0.06 * Math.sin((f - 86) / 7) * interpolate(f, [86, 100], [0, 1], clamp));

// ---- the camera -----------------------------------------------------------------------------------------------------
// Keyed in screen terms: the zoom k (log), the screen row B of the plinth tops under the brains, and the world X the
// camera is centred on (cx; the vanishing point travels with it, so the pan is a truck with parallax). ONE continuous
// move: close on the left brain (a slow creep right), a truck right to the right brain at the same closeness (f18-f70,
// most of it over "small differences between human brains"), settled at f70; then on "can produce" a fast pull-back
// (f70-f100) that lands on v1's framing and carries on into v1's crane up (to f128); a slow creep in the hold.
const DEPTH0 = { dRef: 1800, kRef: 1.05, dolly: 0.5 };
const EYE0 = -300;
const EYE1 = -440;
/** the close-up zoom: a brain ~700 px wide (~74 % of the keep-in width) */
export const KC = 2.3;
const LOGK = pchip(
  [
    [0, Math.log(KC * 0.95)],
    [70, Math.log(KC * 1.03)],
    [94, Math.log(1.06)],
    [128, Math.log(0.955)],
    [DURATION, Math.log(0.945)],
  ],
  true,
);
const ROWB = pchip(
  [
    [0, 1000],
    [70, 1008],
    [94, 1026],
    [128, 1064],
    [DURATION, 1068],
  ],
  true,
);
const CX = pchip(
  [
    [0, BRAIN_X[0] - 32],
    [18, BRAIN_X[0] - 6],
    [66, BRAIN_X[1] - 6],
    [70, BRAIN_X[1]],
    [98, 30],
    [128, 14],
    [DURATION, 14],
  ],
  true,
);
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
