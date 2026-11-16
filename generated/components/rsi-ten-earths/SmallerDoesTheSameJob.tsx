// ---------------------------------------------------------------------------
// SmallerDoesTheSameJob (rsi-ten-earths, cut 57), revision 1. Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 152 frames. The AIs are THE ROBOT (./tenEarthsBot, read-only; BOT_READY.md): Meta's
// big model a robot 2.7x the standard one (the same parts scaled), Meta's small model the standard robot. Air, floor
// and stage values of the clip's hall (./computeBlockState AIR_SCENE / FLOOR / STAGE, read-only).
//
// CHECK LINE: "Last year it took Meta's big 70-billion-parameter model to lift this; a year later their small 8-billion
//   one lifts the same thing."
//
// THE LINE: "AI industry figures out how to train smaller and cheaper models that can do what it took a bigger model
//   to do the year before. And"
// WORD -> FRAME (from the composition start; Whisper may run ~0.2-0.4 s early): AI 0 · industry 6 · figures 16 ·
//   out 25 · how 30 · to 34 · train 37 · smaller 46 · and 58 · cheaper 65 · models 69 · that 79 · can 86 · do 89 ·
//   what 94 · it 101 · took 103 · a 106 · bigger 108 · model 114 · to 121 · do 128 · the 132 · year 134 ·
//   before. 139 · (And 150)
// DURATION: the slot 57.5575 -> 63.8972 s = 6.340 s x 23.976 = 152 frames (f0..f151).
//
// THE MOTION (rev 1 after review): one camera on a crane (a real eye and focal length; log zoom). f0 is close on the
//   BIG robot's mittens gripping a barbell at its hips, its chest plate with the blue Meta mark above them. It dips
//   (f8-f20) and presses the bar up slowly (f18-f44), locking out on "smaller" (46), as the camera pulls back and pans
//   right to a wide (f48): the whole big robot on its plinth (150 units high) with the bar held high, proud, and beside
//   it on a second, wider plinth the SAME barbell lies with the small robot behind it. The stencils ("Llama 2 · 70B /
//   2023", "Llama 3 · 8B / 2024"; line 1 em 58, the year em 88) fade up on the plinth faces from f38, once the face row
//   is pinned above the caption bands (y 1060). The small robot glances up at the big one (f28-f66), then down at its
//   own bar. From f48 the camera trucks right and pushes in moderately on the small plinth (s 0.91 -> 1.66 by f86).
//   The small robot reaches and grips (f80-f88), strains and lifts off (f92), heaves the same bar up (f96-f110) and the
//   bar locks; it wobbles (f110-f121) and beams (f109-f117, a happy bounce dying away to f140). On "bigger" (108) the
//   camera starts back left and up, landing the two-shot by f135 (the f48 wide's framing): the big robot and the small
//   robot side by side, each holding the identical barbell high; living hold to f151 (breathing, blinks, a slow creep).
// THE PLATES: black iron with a cream stripe round each rim and a cream ring on each face, three a side, steel collars,
//   no numbers; the same barbell on both plinths.
// CAUSE: every bar move is the mittens' (the bar is keyed, the mittens are solved onto it each frame with botGripTo;
//   the audit checks mitten-to-bar error every frame). The bar leaves the plinth on the small robot's lift-off frame
//   (SMALL_LIFT.off) with both mittens already on it (from SMALL_LIFT.grip).
// THE BAR AND THE HEAD: the robot's arms reach only to eye height (~206 of its 240 units), so the bar held "high" sits
//   BEHIND its head at eye level, its plates standing out beside the head; the middle of the bar, drawn in front of the
//   body while the bar is low, crossfades behind as it passes the neck.
// Orange = the AIs only (COMMON.md): the two robots. The barbell is black iron banded cream, the plinths umber timber, the stencils
//   cream. Brand: Meta's real mark (kits/dwarkesh/brandGlyphs META, public/logos/meta.svg) in Meta's blue on a cream
//   chest plate; no Llama logo exists, so "Llama 2" / "Llama 3" are type.
//
// SOURCES: Meta Llama 2, 70B parameters, released July 2023; Meta Llama 3, 8B parameters, released April 2024 (Meta's
//   model cards). Mark Zuckerberg on the Dwarkesh Podcast (April 2024): "the smallest Llama-3 is basically as powerful
//   as the biggest Llama-2". No capability number on screen (MMLU 5-shot base 69.7 vs 66.6 is not "the same score").
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, lineOf, mixHex, pchip, swayCam, type AirWorld, type Cam, type DepthOpts, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { META } from "../kits/dwarkesh/brandGlyphs";
import { BOT_JOINT, BOT_POSES, BOT_SCREEN, BOT_SHADOW, BotLayer, BotPaint, botGripTo, botRig, buildBot, type BotPose, type FolkFog } from "./tenEarthsBot";
import { FU } from "./tenEarthsBotBody";
import { CREAM, PLATE_FONT } from "./tenEarthsHall";
import { AIR_FOG_BY, AIR_SCENE, FLOOR, STAGE } from "./computeBlockState";

export const FPS = 24000 / 1001;
export const DURATION = 152;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => sst(0, 1, v);
const easeIO5 = (v: number) => {
  const u = c01(v);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ===================================================================================================================
// THE WORLD (units: the cast's, U = 178 per metre; floor Y 0, up -Y; Z depth, + away; the robots' plane is Z 0)
// ===================================================================================================================
/** the plinths: same height and depth; the big one narrow (its bar is never set down), the small one as wide as the
 *  bar that lies on it */
export const PLINTH = { h: 150, d: 240 };
export const BIG = { X: -262, k: 2.7, variant: 1, w: 420 };
export const SMALL = { X: 282, k: 1, variant: 0, w: 560 };
/** the barbell (world units, identical for both): plates R, three per side from c0 out, collar, sleeve end */
export const BAR = { R: 58, c0: 218, plateT: 13, plateGap: 2, n: 3, collarX: 214, collarR: 11, collarT: 6, sleeveEnd: 275, shaftR: 4.2, sleeveR: 7.5 };
/** the bar's grip (robot-local units from its centre line) for both robots: the hip hold and the high hold */
export const GRIP = { hip: [58, -66] as P2, high: [66.5, -191] as P2, floor: [58, -BAR.R] as P2 };

// ---- the stencils -------------------------------------------------------------------------------------------------
export const LABELS = [
  { X: BIG.X, w: BIG.w, l1: "Llama 2 · 70B", l2: "2023" },
  { X: SMALL.X, w: SMALL.w, l1: "Llama 3 · 8B", l2: "2024" },
];
/** line 1 (the model) is as wide as the big plinth allows; line 2 (the year) is the big one (~56 px cap at the end) */
const LABEL = { em1: 58, em2: 88, l1y: -100, l2y: -18, op: 0.92, fade: 8, rise: 10 };
/** the paint shows only once its plinth face is above the caption bands for good (it fades up and settles LABEL.rise
 *  units, never crossing y 1068): the first frame from which the face's bottom stays at or above y 1066 */
const SAFE_Y = 1066;

// ===================================================================================================================
// THE CAMERA: a crane eye (shift lens) mapped onto a londonDepth perspective: px per unit at Z 0 = s, eye distance
// Dc = F / s, eye X ex, eye height He, the plinths' face bottom edge (Y 0, Z -d/2) on screen row faceY (pinned at y
// 1060 from the pull-back's end on, so the stencils above it never touch the caption bands)
// ===================================================================================================================
const F = 2600;
type Key = { f: number; s: number; ex: number; faceY: number; He: number };
/** the two-shot: the small bar's right sleeve end at screen x 1010; the big bar's outer left plates at the left edge */
const S_END = 0.91;
const MID_X = SMALL.X + BAR.sleeveEnd - 470 / S_END;
export const KEYS: Key[] = [
  { f: 0, s: 2.8, ex: BIG.X, faceY: 1860, He: 430 },
  { f: 48, s: S_END, ex: MID_X, faceY: 1060, He: 570 },
  { f: 86, s: 1.66, ex: SMALL.X, faceY: 1060, He: 480 },
  { f: 106, s: 1.7, ex: SMALL.X + 4, faceY: 1060, He: 476 },
  { f: 135, s: S_END, ex: MID_X, faceY: 1060, He: 570 },
  { f: 151, s: S_END * 0.986, ex: MID_X + 5, faceY: 1061, He: 574 },
];
const LS = pchip(KEYS.map((q) => [q.f, Math.log(q.s)] as [number, number]));
const EX = pchip(KEYS.map((q) => [q.f, q.ex] as [number, number]));
/** the face row has its own track: up from below the frame to y 1060 by f36, then pinned (a slow creep at the end) */
const FY = pchip([[0, KEYS[0].faceY], [38, 1060], [135, 1060], [151, 1061]]);
const HE = pchip(KEYS.map((q) => [q.f, q.He] as [number, number]));
export type CutCam = { cam: Cam; depth: DepthOpts; s: number; He: number };
export const camState = (f: number): CutCam => {
  const s = Math.exp(LS(f));
  const ex = EX(f);
  const faceY = FY(f);
  const He = HE(f);
  const Dc = F / s;
  const r = Dc / (Dc - PLINTH.d / 2);
  const cy = -He + He * r - (faceY - 960) / s;
  return { cam: { k: s, cx: ex, cy }, depth: { eyeY: -He, dRef: Dc, kRef: s, dolly: 1 }, s, He };
};

/** the screen y of a plinth face's bottom edge (no sway; sway is +-5 px and the margin covers it) */
export const faceBottomY = (f: number) => {
  const c = camState(f);
  const Dc = c.depth.dRef;
  const r = Dc / (Dc - PLINTH.d / 2);
  const eyeY = c.depth.eyeY;
  const wy = eyeY + (0 - eyeY) * r;
  return 960 + (wy - c.cam.cy) * c.cam.k;
};
export const LABEL_F0 = (() => {
  let f0 = DURATION;
  for (let f = DURATION - 1; f >= 0; f--) {
    if (faceBottomY(f) > SAFE_Y) break;
    f0 = f;
  }
  // and not before the pan has brought the small plinth's face wholly into frame (f38)
  return Math.max(f0, 38);
})();
/** rev 1b (user, Nov 16): the stencils are painted on the plinths from the first frame; they never fade in.
 *  (LABEL_F0 is kept for the check script: the frame from which the faces stay above the caption bands.) */
export const labelT = (_f: number) => 1;

// ===================================================================================================================
// THE LIFTS (robot-local units; the bar's centre (y) and tilt (deg), the crouch, the face)
// ===================================================================================================================
type LiftState = { barY: number; tilt: number; crouch: number; grip: P2; reach: number; lids: number; laugh: number; open: number; roll: number; bounce: number };
/** the big robot: the hip hold, a dip, one smooth heave to the high hold, a settle, pride */
export const BIG_LIFT = { dip: [8, 20], heave: [18, 44], settle: [44, 53], proud: [44, 56] };
export const bigLift = (f: number): LiftState => {
  const dip = Math.sin(Math.PI * c01((f - BIG_LIFT.dip[0]) / (BIG_LIFT.heave[0] + 6 - BIG_LIFT.dip[0]))) ** 2;
  const h = easeIO5((f - BIG_LIFT.heave[0]) / (BIG_LIFT.heave[1] - BIG_LIFT.heave[0]));
  const st = c01((f - BIG_LIFT.settle[0]) / (BIG_LIFT.settle[1] - BIG_LIFT.settle[0]));
  const settle = st > 0 && st < 1 ? -3 * Math.sin(Math.PI * st) * (1 - st) : 0;
  const grip: P2 = [lerp(GRIP.hip[0], GRIP.high[0], h), lerp(GRIP.hip[1], GRIP.high[1], h)];
  const barY = grip[1] + 8 * dip * (1 - h) + settle;
  const proud = ease((f - BIG_LIFT.proud[0]) / (BIG_LIFT.proud[1] - BIG_LIFT.proud[0]));
  return { barY, tilt: 0, crouch: 22 * dip, grip: [grip[0], barY], reach: 1, lids: 0, laugh: 0.75 * proud, open: 0, roll: 0, bounce: 0 };
};
/** the small robot: idle behind the bar, crouch and grip, strain, the heave, a wobble, joy */
export const SMALL_LIFT = { reach: [80, 88], grip: 88, off: 92, heave: [96, 110], wobble: [110, 121], joy: [109, 117], bounce: [112, 140] };
const CROUCH_FLOOR = 46;
export const smallLift = (f: number): LiftState => {
  const L = SMALL_LIFT;
  const reach = ease((f - L.reach[0]) / (L.reach[1] - L.reach[0]));
  const off = c01((f - L.off) / (L.heave[0] - L.off));
  const h = easeIO5((f - L.heave[0]) / (L.heave[1] - L.heave[0]));
  // the strain before the heave: a small lift-off (the plates leave the plinth) with a tremble
  const strain = c01((f - L.grip) / 3) * (1 - h);
  const tremble = strain * 1.2 * Math.sin(f * 2.3);
  const barY0 = GRIP.floor[1] - 6 * ease(off) + tremble * ease(off) * (1 - h);
  const barY = lerp(barY0, GRIP.high[1], h);
  const gx = lerp(GRIP.floor[0], GRIP.high[0], h);
  const wt = (f - L.wobble[0]) / (L.wobble[1] - L.wobble[0]);
  const tilt = wt > 0 && wt < 1 ? 5.5 * Math.sin(wt * Math.PI * 2.5) * (1 - wt) ** 1.6 : 0;
  const crouch = CROUCH_FLOOR * reach * (1 - h) + 6 * Math.sin(Math.PI * c01((f - L.heave[1] + 2) / 8)) ** 2;
  const joy = ease((f - L.joy[0]) / (L.joy[1] - L.joy[0]));
  const bt = (f - L.bounce[0]) / (L.bounce[1] - L.bounce[0]);
  const bounce = bt > 0 && bt < 1 ? Math.abs(Math.sin(bt * Math.PI * 3)) * (1 - bt) ** 1.3 : 0;
  return { barY, tilt, crouch: crouch + 7 * bounce, grip: [gx, barY], reach, lids: 0.55 * strain * (1 - joy), laugh: joy, open: 0.25 * strain * (1 - joy), roll: tremble * 1.2, bounce };
};

/** the robot's pose for a lift state (idle arms blended to the bar by `reach`, mittens solved onto the bar) */
/** the small robot's gaze before its lift: up and left at the big one as it comes into view (f30-f64), then down at its
 *  own bar (f74-f96), then at us */
export const smallLook = (f: number): { look: P2; yaw: number; pitch: number } => {
  const up = sst(28, 38, f) * (1 - sst(56, 66, f));
  const down = sst(66, 74, f) * (1 - sst(86, 94, f));
  return { look: [-0.75 * up, -0.45 * up + 0.55 * down], yaw: -0.22 * up, pitch: -4 * up + 7 * down };
};
const liftPose = (st: LiftState, f: number, seed: number, gaze?: { look: P2; yaw: number; pitch: number }): { pose: BotPose; target: { L: P2; R: P2 } } => {
  const b0 = BOT_POSES.front(f, seed);
  const base0: BotPose = gaze ? { ...b0, look: gaze.look, headYaw: b0.headYaw + gaze.yaw, pitch: b0.pitch + gaze.pitch } : b0;
  const base: BotPose = { ...base0, crouch: base0.crouch + st.crouch, roll: base0.roll + st.roll, laugh: st.laugh, open: st.open, lids: Math.max(base0.lids * (1 - st.laugh), st.lids) };
  const th = (st.tilt * Math.PI) / 180;
  const onBar = (sx: number): P2 => [sx * st.grip[0] * Math.cos(th) - 0, st.barY + sx * st.grip[0] * Math.sin(th)];
  const idle = botRig(base);
  const tL = onBar(-1);
  const tR = onBar(1);
  const L: P2 = st.reach >= 1 ? tL : [lerp(idle.armL.grip[0], tL[0], st.reach), lerp(idle.armL.grip[1], tL[1], st.reach)];
  const R: P2 = st.reach >= 1 ? tR : [lerp(idle.armR.grip[0], tR[0], st.reach), lerp(idle.armR.grip[1], tR[1], st.reach)];
  const q = st.reach > 0.001 ? botGripTo(base, { L, R }) : base;
  const fist = 0.85 * st.reach;
  return { pose: { ...q, armL: { ...q.armL, fist: Math.max(q.armL.fist, fist) }, armR: { ...q.armR, fist: Math.max(q.armR.fist, fist) } }, target: { L, R } };
};

// ===================================================================================================================
// THE BARBELL (3D, world units; centre C, tilt th in the X-Y plane; the axis along X)
// ===================================================================================================================
const IRON = { lit: "#5C6468", mid: "#353B3E", dark: "#1E2224" };
const BAND = { lit: "#F3EBDD", mid: "#D9CDB4", dark: "#9C9078" };
const STEEL = { lit: "#C9CDCB", mid: "#9AA09E", dark: "#5E6462" };
type V3 = [number, number, number];
const ax = (C: V3, th: number, x: number, y = 0, z = 0): V3 => [C[0] + x * Math.cos(th) - y * Math.sin(th), C[1] + x * Math.sin(th) + y * Math.cos(th), C[2] + z];
/** a convex hull (monotone chain) of screen points */
const hull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
/** a cylinder along the bar's axis from x0 to x1, radius r: its silhouette, a lit top band and the visible end face */
const Cyl: React.FC<{ A: AirWorld; C: V3; th: number; x0: number; x1: number; r: number; mat: { lit: string; mid: string; dark: string }; uid: string; face?: boolean; hub?: number; band?: { lit: string; mid: string; dark: string } }> = ({ A, C, th, x0, x1, r, mat, uid, face = true, hub = 0, band }) => {
  const P = A.P;
  const N = 28;
  const ring = (x: number, rr = r) => Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const q = ax(C, th, x, rr * Math.cos(a), rr * Math.sin(a));
    return P.p(q[0], q[1], q[2]);
  });
  const ra = ring(x0);
  const rb = ring(x1);
  const sil = hull([...ra, ...rb]);
  const Zc = C[2];
  const h = -C[1];
  const t = (hex: string) => A.tone(hex, Zc, h);
  // the end face whose outward normal looks at the eye (the eye: X cam.cx, height eyeY, Z -Dc)
  const eye: V3 = [A.cam.cx, P.opts.eyeY, -P.Dc];
  const endFaces = (xe: number, xo: number) => {
    const c = ax(C, th, xe);
    const o = ax(C, th, xo);
    const n = [c[0] - o[0], c[1] - o[1], c[2] - o[2]];
    return n[0] * (eye[0] - c[0]) + n[1] * (eye[1] - c[1]) + n[2] * (eye[2] - c[2]) > 0;
  };
  const towardEye = endFaces(x1, x0) ? x1 : x0;
  const fr = ring(towardEye);
  const top = ax(C, th, (x0 + x1) / 2, -r);
  const bot = ax(C, th, (x0 + x1) / 2, r);
  const pt = P.p(top[0], top[1], top[2]);
  const pb = P.p(bot[0], bot[1], bot[2]);
  const ln = t(lineOf(mat));
  const lw = A.lw(0.9);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1={f2(pt[0])} y1={f2(pt[1])} x2={f2(pb[0])} y2={f2(pb[1])}>
          <stop offset="0" stopColor={t(mat.lit)} />
          <stop offset="0.3" stopColor={t(mixHex(mat.lit, mat.mid, 0.5))} />
          <stop offset="0.75" stopColor={t(mat.mid)} />
          <stop offset="1" stopColor={t(mat.dark)} />
        </linearGradient>
      </defs>
      <path d={poly(sil)} fill={`url(#${uid}g)`} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />
      {band ? (() => {
        // a cream stripe round the rim (the middle fifth of the plate's thickness); the end face is painted over it
        const xa = x0 + (x1 - x0) * 0.41;
        const xb = x0 + (x1 - x0) * 0.59;
        return <path d={poly(hull([...ring(xa, r + 0.3), ...ring(xb, r + 0.3)]))} fill={t(band.mid)} />;
      })() : null}
      {face ? <path d={poly(fr)} fill={t(mixHex(mat.mid, mat.dark, 0.25))} stroke={ln} strokeWidth={lw * 0.8} /> : null}
      {face && band ? (
        // the same cream ring painted on the face of every plate
        <path d={`${poly(ring(towardEye, r * 0.86))} ${poly([...ring(towardEye, r * 0.74)].reverse())}`} fill={t(band.lit)} fillRule="evenodd" />
      ) : null}
      {face && hub > 0 ? <path d={poly(ring(towardEye, hub).map((q) => q))} fill={t(mat.dark)} /> : null}
    </g>
  );
};
/** the whole barbell (part "all"), or only the shaft between two axis positions (part "inner") */
const Barbell: React.FC<{ A: AirWorld; C: V3; th: number; uid: string; inner?: [number, number]; op?: number }> = ({ A, C, th, uid, inner, op = 1 }) => {
  if (inner) {
    if (op <= 0.003 || inner[1] - inner[0] < 1) return null;
    return (
      <g opacity={op}>
        <Cyl A={A} C={C} th={th} x0={inner[0]} x1={inner[1]} r={BAR.shaftR} mat={STEEL} uid={`${uid}i`} face={false} />
      </g>
    );
  }
  const els: React.ReactNode[] = [];
  els.push(<Cyl key="sh" A={A} C={C} th={th} x0={-BAR.collarX} x1={BAR.collarX} r={BAR.shaftR} mat={STEEL} uid={`${uid}sh`} face={false} />);
  for (const sg of [-1, 1]) {
    els.push(<Cyl key={`sl${sg}`} A={A} C={C} th={th} x0={sg * BAR.collarX} x1={sg * BAR.sleeveEnd} r={BAR.sleeveR} mat={STEEL} uid={`${uid}sl${sg}`} />);
    // plates from the outside in (the inner plate is nearer the lens's axis and covers the outer one's face)
    for (let i = BAR.n - 1; i >= 0; i--) {
      const a = BAR.c0 + i * (BAR.plateT + BAR.plateGap);
      els.push(<Cyl key={`p${sg}${i}`} A={A} C={C} th={th} x0={sg * a} x1={sg * (a + BAR.plateT)} r={BAR.R} mat={IRON} uid={`${uid}p${sg}${i}`} hub={BAR.R * 0.22} band={BAND} />);
    }
    els.push(<Cyl key={`c${sg}`} A={A} C={C} th={th} x0={sg * (BAR.collarX - BAR.collarT)} x1={sg * BAR.collarX} r={BAR.collarR} mat={STEEL} uid={`${uid}c${sg}`} />);
  }
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE ROBOT WITH META'S MARK ON ITS CHEST PLATE (the module's panel shapes replaced by a cream plate + the blue mark,
// painted between the torso and the neck, so the arms and head stay in front of it; one gouache filter over all)
// ===================================================================================================================
const META_BLUE = "#0081FB";
const PANEL_FILLS = new Set(["#F6EAD0", BOT_SCREEN, "#C77A0A"]);
const MetaBot: React.FC<{ A: AirWorld; variant: number; pose: BotPose; at: P2; scale: number; uid: string; frame: number; fog: FolkFog; unitPx: number }> = ({ A, variant, pose, at, scale, uid, frame, fog, unitPx }) => {
  const b = buildBot(variant, pose, { frame });
  const sh = b.shapes;
  const iT = sh.findIndex((s) => s.sh === 0.75);
  let iN = iT + 1;
  while (iN < sh.length && !(sh[iN].fill === BOT_JOINT && sh[iN].sh === 0.4)) iN++;
  const pre = [...sh.slice(0, iT + 1), ...sh.slice(iT + 1, iN).filter((s) => !PANEL_FILLS.has(s.fill))];
  const post = sh.slice(iN);
  // the plate on the barrel's front (as the module's panel: centre [TOR.d * s * 0.92, -50] torso-local, foreshortened)
  const R = botRig(pose);
  const fk = Math.max(0.05, Math.abs(R.c));
  const vis = sst(0.02, 0.3, R.c);
  const pc = R.toFig([34 * R.s * 0.92, -51]);
  const lean = R.q.lean;
  const hw = 19;
  const hh = 13.5;
  const W: P2 = [at[0] + pc[0] * scale, at[1] + pc[1] * scale];
  const fogTo = typeof fog.rgb === "string" ? fog.rgb : "#466C66";
  const plateC = mixHex("#F3EBDD", fogTo, c01(fog.amount));
  const blue = mixHex(META_BLUE, fogTo, c01(fog.amount));
  const pxf = ((scale / FU) * unitPx * 512) / 860;
  const markW = 30;
  void A;
  return (
    <BotLayer uid={`${uid}L`} px={pxf} unitPx={unitPx}>
      <BotPaint shapes={pre} at={at} scale={scale} uid={`${uid}a`} fog={fog} unitPx={unitPx} texture={false} />
      {vis > 0.01 ? (
        <g opacity={vis} transform={`translate(${f2(W[0])} ${f2(W[1])}) rotate(${lean.toFixed(3)}) scale(${(scale * fk).toFixed(5)} ${scale.toFixed(5)})`}>
          <rect x={-hw} y={-hh} width={2 * hw} height={2 * hh} rx={6} fill={plateC} />
          <rect x={-hw} y={hh - 4} width={2 * hw} height={4} rx={2} fill="#C9B793" opacity={0.35} />
          <g transform={`scale(${(markW / 24).toFixed(4)}) translate(-12 -12.4)`}>
            <path d={META.paths[0]} fill={blue} fillRule="evenodd" />
          </g>
        </g>
      ) : null}
      <BotPaint shapes={post} at={at} scale={scale} uid={`${uid}b`} fog={fog} unitPx={unitPx} texture={false} />
    </BotLayer>
  );
};

// ===================================================================================================================
// A LIFTER: shadow, the barbell behind, the robot, the bar's middle in front while it is below the neck
// ===================================================================================================================
/** how much of the bar's middle is in front of the body: 1 below the shoulders, 0 once past the chin (robot units) */
const frontOf = (barY: number) => 1 - sst(-136, -160, barY);
export const lifterGeom = (A: AirWorld, X: number, k: number, st: LiftState, f: number, seed: number, gazeOn = false) => {
  const at2 = A.P.p(X, -PLINTH.h, 0);
  const sc = A.P.r(0) * k;
  const lp = liftPose(st, f, seed, gazeOn ? smallLook(f) : undefined);
  const C: V3 = [X, -PLINTH.h + st.barY * k, 0];
  return { at: at2, sc, pose: lp.pose, target: lp.target, C, th: (st.tilt * Math.PI) / 180 };
};
const Lifter: React.FC<{ A: AirWorld; X: number; k: number; variant: number; st: LiftState; f: number; seed: number; uid: string; gaze?: boolean }> = ({ A, X, k, variant, st, f, seed, uid, gaze }) => {
  const g = lifterGeom(A, X, k, st, f, seed, gaze);
  const fog: FolkFog = A.folkFog(0, PLINTH.h);
  const mitR = 11.5;
  const inner: [number, number] = [-(st.grip[0] - mitR) * k, (st.grip[0] - mitR) * k];
  // the plates' shadows on the plinth while they are near it (the small robot's bar only: the big plinth is narrow)
  const restOnPlinth = k === 1 ? c01(1 - (-st.barY - BAR.R) / 30) : 0;
  return (
    <g>
      <AirShadow A={A} X={X} Z={0} Y={-PLINTH.h} w={BOT_SHADOW.w * k} d={BOT_SHADOW.d * k} amt={BOT_SHADOW.amt} uid={`${uid}s`} />
      {[-1, 1].map((sg) => (
        <AirShadow key={sg} A={A} X={X + sg * (BAR.c0 + 22)} Z={0} Y={-PLINTH.h} w={40} d={BAR.R * 0.9} amt={0.7 * restOnPlinth} uid={`${uid}ps${sg}`} />
      ))}
      <Barbell A={A} C={g.C} th={g.th} uid={`${uid}bb`} />
      <MetaBot A={A} variant={variant} pose={g.pose} at={g.at} scale={g.sc} uid={`${uid}r`} frame={f} fog={fog} unitPx={A.k} />
      <Barbell A={A} C={g.C} th={g.th} uid={`${uid}bf`} inner={inner} op={frontOf(st.barY)} />
    </g>
  );
};

// ===================================================================================================================
// THE PLINTHS AND THEIR STENCILS
// ===================================================================================================================
const PLINTH_MAT = MAT.timber;
const Plinth: React.FC<{ A: AirWorld; X: number; w: number; uid: string; l1: string; l2: string; t: number }> = ({ A, X, w, uid, l1, l2, t }) => {
  const Z0 = -PLINTH.d / 2;
  const P = A.P;
  const r = P.r(Z0);
  const fz = A.fog(Z0);
  const paint = mixHex(CREAM, A.airHex(Z0, PLINTH.h / 2), 0.5 * fz);
  const at = (Y: number) => P.p(X, Y, Z0);
  const txt = (s: string, Y: number, key: string, em: number) => {
    if (t <= 0.002) return null;
    const p = at(Y + LABEL.rise * (1 - t));
    return (
      <text key={key} x={0} y={0} transform={`translate(${f2(p[0])} ${f2(p[1])}) scale(${r.toFixed(5)})`} textAnchor="middle" fill={paint} fillOpacity={LABEL.op * t} style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: em, fontVariantNumeric: "lining-nums" }}>
        {s}
      </text>
    );
  };
  return (
    <g>
      <AirShadow A={A} X={X} Z={0} w={w * 0.62} d={PLINTH.d * 0.7} amt={0.55} uid={`${uid}fs`} />
      <AirBox A={A} X0={X - w / 2} X1={X + w / 2} Y0={-PLINTH.h} Y1={0} Z0={Z0} Z1={PLINTH.d / 2} mat={PLINTH_MAT} uid={uid} />
      {txt(l1, LABEL.l1y, "a", LABEL.em1)}
      {txt(l2, LABEL.l2y, "b", LABEL.em2)}
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const SmallerDoesTheSameJob: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const C = camState(frame);
  const cam = swayCam(C.cam, frame);
  const rest = swayCam(camState(0).cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame, scene: AIR_SCENE, fogBy: AIR_FOG_BY });
  const bigSt = bigLift(frame);
  const smSt = smallLift(frame);
  return (
    <AirStage v={A.v} bloom={STAGE.bloom} shafts={STAGE.shafts}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={FLOOR.x0} x1={FLOOR.x1} z0={FLOOR.z0} z1={FLOOR.z1} mat={FLOOR.mat} course={FLOOR.tile} plank={FLOOR.tile} jointAmt={FLOOR.jointAmt} melt={FLOOR.melt} />
        <AirHorizonHazeW A={A} id="sdj-haze" />
        {LABELS.map((l, i) => (
          <Plinth key={i} A={A} X={l.X} w={l.w} uid={`sdj-pl${i}`} l1={l.l1} l2={l.l2} t={labelT(frame)} />
        ))}
        <Lifter A={A} X={BIG.X} k={BIG.k} variant={BIG.variant} st={bigSt} f={frame} seed={3} uid="sdj-big" />
        <Lifter A={A} X={SMALL.X} k={SMALL.k} variant={SMALL.variant} st={smSt} f={frame} seed={11} uid="sdj-sm" gaze />
      </WorldSvg>
    </AirStage>
  );
};

export default SmallerDoesTheSameJob;
