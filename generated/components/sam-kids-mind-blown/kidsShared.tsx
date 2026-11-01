// ---------------------------------------------------------------------------
// kidsShared — the shared world of "sam - kids will never be mind-blown" (cuts 1, 16, 29, 49). Picture-book card
// figures in the cabinCast language (big round head, nose bump, one dot eye, tiny mouth, blush dot, simple hair shapes,
// flat matte fills, a top-lit ramp per part, no outlines) plus the laptop with the real OpenAI blossom and the furniture.
//
// EXPORTS
//   Kid        the recurring character: about nine, messy hair, terracotta hoodie, shorts, socks, sneakers
//   Friend     the same child rig, `variant` 0..3 (FRIEND_SPECS): the show-it-to-my-friends kids
//   Adult      the same rig at adult proportions, `variant` 0..5 (ADULT_SPECS), or pass `spec`
//   Person     the base of all three: `build` (CHILD | ADULT) + `spec` (a PersonSpec)
//   personSil  a figure's silhouette as SilItems, for one UnionShadow over a touching group (then pass shadow={false})
//   Laptop     cream card laptop, one orthographic projection: `yaw` 0 = screen square to us, 30 = three-quarter (screen
//              toward the left), 90 = side-on, 130 = three-quarter from behind (the lid with the blossom stamp);
//              negative yaw mirrors. `screen` draws inside the display in cells (screenCols x screenRows).
//   laptopFrame  the same projection as numbers: P(X, Y, Z), deck(u, v) for a hand target, screenMatrix, sil
//   Desk, Stool  the furniture in board tone; deskSil, stoolSil for the union shadow
//   worldToLocal  a world point -> a figure's local frame (for `hand`, `farHand`)
//   blinkAt, swingAt  deterministic life on the frame clock
//   amberGlowFilter, AMBER  the one glow
//
// THE RIG (figure-local, y down, x = FORWARD whichever way `facing` looks; origin = the hip on the seat, or on the hip
// for a standing figure; a `scale` scales all of it): the legs hang from the hip; the upper body rotates about the hip by
// `lean` (deg, + = forward); the head tilts about the neck by `headTilt` (deg, + = forward, chin down). The near arm is a
// 2-bone IK from the shoulder to `hand`, elbow ALWAYS below the shoulder-hand line (cabinCast's one rule, it never flips);
// the far arm the same, in a darker tone, drawn behind the torso. All props are pure: drive them from the frame.
//
// `facing` +1 looks right, -1 looks left (the whole figure mirrors; hand targets stay figure-local, x forward).
// NEVER realistic, never 3D-shaded. Amber = what gets made: the only amber here is `amberLight` on a face and the laptop's
// `glow`. The blossom: ChatGPTGlyph (sam-macintosh-moment/macintoshShared.tsx), Commons "OpenAI logo 2025 (symbol)".
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR, bloomFilter, clamp01, lerp, mixHex } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, type SilItem } from "../kits/cheeky-pint/museShared";
import { CLOTH, HAIR, SKIN, solveArm } from "../scott-free-wifi/cabinCast";
import { ChatGPTGlyph } from "../sam-macintosh-moment/macintoshShared";

export type P2 = [number, number];
export { SKIN, HAIR, CLOTH };

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const D2R = Math.PI / 180;
const uidOf = (raw: string) => `kd${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const LIGHT_TINT = "#FFF4E2";
const topOf = (c: string) => mixHex(c, LIGHT_TINT, 0.14);
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.16);
const farOf = (c: string) => mixHex(c, COLOR.shadow, 0.26);
const rot = (p: P2, deg: number, o: P2 = [0, 0]): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
const polar = (r: number, deg: number): P2 => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
/** a closed, soft shape through points: quadratics through the midpoints (spikes come out rounded, like cut card) */
const softClosed = (pts: P2[]) => {
  const n = pts.length;
  const mid = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f3(m0[0])} ${f3(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${f3(pts[i][0])} ${f3(pts[i][1])} ${f3(m[0])} ${f3(m[1])}`;
  }
  return `${d}Z`;
};
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;

// ---------------------------------------------------------------------------
// LIFE ON THE CLOCK
// ---------------------------------------------------------------------------
/** a blink 0..1: every `period` frames, 5 frames long, offset by `seed` */
export const blinkAt = (f: number, seed = 0, period = 67) => {
  const u = ((f + seed * 29) % period + period) % period;
  return u < 5 ? [0.5, 1, 1, 0.6, 0.2][Math.floor(u)] : 0;
};
/** the dangling shin's angle (deg, + = forward): an easy pendulum, `phase` in frames */
export const swingAt = (f: number, amp = 15, period = 30, phase = 0) => 4 + amp * Math.sin(((f + phase) / period) * 2 * Math.PI);

// ---------------------------------------------------------------------------
// BUILDS AND SPECS
// ---------------------------------------------------------------------------
export type Build = {
  R: number;
  head: P2;
  neck: P2;
  shoulder: P2;
  farShoulder: P2;
  upper: number;
  fore: number;
  armW: number;
  hand: number;
  hip: P2;
  thigh: number;
  shin: number;
  thighW: number;
  shinW: number;
  foot: number;
  torsoD: string;
  hoodR: number;
  hood: P2;
};
export const CHILD: Build = {
  R: 66,
  head: [12, -166],
  neck: [4, -112],
  shoulder: [-2, -94],
  farShoulder: [8, -96],
  upper: 54,
  fore: 50,
  armW: 25,
  hand: 12.5,
  hip: [0, -15],
  thigh: 66,
  shin: 56,
  thighW: 32,
  shinW: 18,
  foot: 1,
  torsoD: "M-36 2C-46 -44 -44 -92 -26 -110C-12 -122 16 -122 28 -108C40 -88 42 -36 34 2Z",
  hoodR: 31,
  hood: [-24, -106],
};
export const ADULT: Build = {
  R: 58,
  head: [10, -244],
  neck: [2, -196],
  shoulder: [-4, -172],
  farShoulder: [8, -176],
  upper: 84,
  fore: 80,
  armW: 32,
  hand: 14,
  hip: [0, -18],
  thigh: 86,
  shin: 86,
  thighW: 42,
  shinW: 34,
  foot: 1.35,
  torsoD: "M-44 2C-56 -70 -58 -160 -38 -186C-20 -206 22 -206 36 -188C52 -160 52 -60 42 2Z",
  hoodR: 0,
  hood: [0, 0],
};
export type HairStyle = "messy" | "crop" | "bob" | "curly" | "pony" | "bun" | "cap" | "bald" | "buzz";
export type PersonSpec = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  /** the far-side details: a hood behind the neck, a kangaroo pocket, drawstrings */
  hoodie?: boolean;
  /** bare forearms */
  tee?: boolean;
  pants: string;
  /** shorts: bare shin, a sock */
  shorts?: boolean;
  sock?: string;
  shoe?: string;
  sole?: string;
  cap?: string;
  glasses?: boolean;
  beard?: boolean;
};
/** THE KID. Same spec in every cut. */
export const KID_SPEC: PersonSpec = {
  skin: SKIN.light,
  hair: HAIR.chestnut,
  hairStyle: "messy",
  top: "#D2693F",
  hoodie: true,
  pants: "#5F6A73",
  shorts: true,
  sock: "#F2E7D3",
  shoe: "#7C5A45",
  sole: "#F2E7D3",
};
export const FRIEND_SPECS: PersonSpec[] = [
  { skin: SKIN.deep, hair: HAIR.ink, hairStyle: "curly", top: CLOTH.sage, tee: true, pants: "#6B5343", shorts: true, sock: "#F2E7D3", shoe: "#5A4537", sole: "#F2E7D3" },
  { skin: SKIN.cream, hair: HAIR.auburn, hairStyle: "pony", top: CLOTH.oat, pants: CLOTH.denim, shoe: "#7C5A45", sole: "#F2E7D3" },
  { skin: SKIN.tan, hair: HAIR.ink, hairStyle: "bob", top: CLOTH.plum, tee: true, pants: "#6B5343", shoe: "#5A4537", sole: "#F2E7D3" },
  { skin: SKIN.board, hair: HAIR.sandy, hairStyle: "cap", cap: CLOTH.denim, top: CLOTH.cream, tee: true, pants: "#5F6A73", shorts: true, sock: "#F2E7D3", shoe: "#7C5A45", sole: "#F2E7D3" },
];
export const ADULT_SPECS: PersonSpec[] = [
  { skin: SKIN.light, hair: HAIR.grey, hairStyle: "crop", top: CLOTH.slate, pants: "#8A6F5C", glasses: true },
  { skin: SKIN.deep, hair: HAIR.ink, hairStyle: "bun", top: CLOTH.sage, pants: "#8A6F5C" },
  { skin: SKIN.tan, hair: HAIR.ink, hairStyle: "buzz", top: CLOTH.oat, pants: CLOTH.denim, beard: true },
  { skin: SKIN.cream, hair: HAIR.sandy, hairStyle: "bob", top: CLOTH.plum, pants: "#8A6F5C" },
  { skin: SKIN.board, hair: HAIR.ink, hairStyle: "curly", top: CLOTH.denim, pants: "#8A6F5C" },
  { skin: SKIN.light, hair: HAIR.grey, hairStyle: "bald", top: CLOTH.moss, pants: CLOTH.denim, glasses: true },
];

// ---------------------------------------------------------------------------
// HAIR (head-local, centre 0,0; forward is +x; angles y-down, -90 = the crown, 180 = the back)
// ---------------------------------------------------------------------------
const hairShapes = (style: HairStyle, R: number): { back: string[]; front: string[] } => {
  const p = (r: number, a: number) => polar(r * R, a);
  const xy = (x: number, y: number): P2 => [x * R, y * R];
  if (style === "messy") {
    // a few real tufts (a doubled point keeps a tuft's tip), the forehead and the ear left clear
    const tip = (x: number, y: number): P2[] => [xy(x, y), xy(x, y)];
    return {
      back: [],
      front: [
        softClosed([
          xy(0.84, -0.54),
          xy(0.76, -0.9),
          xy(1.02, -1.26),
          xy(0.5, -1.02),
          xy(0.48, -1.56),
          xy(0.12, -1.06),
          xy(-0.24, -1.66),
          xy(-0.46, -1.04),
          xy(-0.88, -0.96),
          xy(-1.16, -0.6),
          xy(-1.18, -0.16),
          xy(-1.1, 0.22),
          xy(-1.14, 0.66),
          xy(-0.62, 0.52),
          xy(-0.36, 0.26),
          xy(-0.34, -0.12),
          xy(-0.04, -0.2),
          xy(0.1, -0.36),
          ...tip(0.2, -0.14),
          xy(0.36, -0.44),
          ...tip(0.5, -0.22),
          xy(0.62, -0.5),
        ]),
      ],
    };
  }
  const cap: P2[] = [p(1.04, -30), p(1.1, -60), p(1.1, -90), p(1.1, -120), p(1.1, -150), p(1.08, -180), p(1.0, -212), xy(-0.5, 0.62), xy(-0.36, 0.3), xy(-0.12, 0.28), xy(-0.08, -0.2), xy(0.3, -0.44)];
  if (style === "crop") return { back: [], front: [softClosed(cap)] };
  if (style === "buzz") return { back: [], front: [softClosed([p(1.06, -36), p(1.12, -70), p(1.12, -110), p(1.12, -150), p(1.1, -190), p(1.04, -214), xy(-0.5, 0.56), xy(-0.26, 0.24), xy(-0.26, -0.24), xy(0.34, -0.58)])] };
  if (style === "bald") return { back: [], front: [softClosed([p(1.08, -160), p(1.1, -190), p(1.06, -216), xy(-0.5, 0.56), xy(-0.28, 0.3), xy(-0.3, -0.12), xy(-0.7, -0.3)])] };
  if (style === "bob")
    return {
      back: [softClosed([p(1.08, -70), p(1.16, -120), p(1.2, -170), xy(-1.26, 0.5), xy(-1.1, 1.08), xy(-0.5, 1.16), xy(-0.1, 1.06), xy(0, 0.2), xy(0.2, -0.6)])],
      front: [softClosed([p(1.06, -24), p(1.12, -60), p(1.12, -100), p(1.12, -150), p(1.12, -190), xy(-1.06, 0.76), xy(-0.5, 1.06), xy(-0.2, 0.7), xy(-0.12, 0.2), xy(-0.08, -0.14), xy(0.3, -0.36), xy(0.66, -0.3)])],
    };
  if (style === "curly") {
    const blobs = [-40, -62, -84, -106, -128, -150, -172, -196].map((a) => circleD(...p(1.0, a), 0.34 * R));
    return { back: [], front: [softClosed(cap), ...blobs] };
  }
  if (style === "pony")
    return {
      back: [softClosed([xy(-0.86, -0.72), xy(-1.5, -0.74), xy(-1.86, -0.1), xy(-1.74, 0.72), xy(-1.46, 0.5), xy(-1.32, 0.02), xy(-0.96, -0.2)])],
      front: [softClosed(cap)],
    };
  if (style === "bun") return { back: [circleD(-0.72 * R, -0.98 * R, 0.4 * R)], front: [softClosed(cap)] };
  // cap: the tuft at the nape, the crown and brim drawn by capShapes
  return { back: [], front: [softClosed([p(1.02, -160), p(1.04, -190), p(0.98, -214), xy(-0.5, 0.62), xy(-0.36, 0.3), xy(-0.2, 0.2), xy(-0.5, -0.1)])] };
};
const capShapes = (R: number) => {
  const crown = softClosed([polar(1.12 * R, -14), polar(1.2 * R, -50), polar(1.2 * R, -90), polar(1.2 * R, -130), polar(1.16 * R, -170), [-1.08 * R, -0.08 * R], [0.2 * R, -0.3 * R], [1.04 * R, -0.22 * R]]);
  const brim = `M${f3(0.5 * R)} ${f3(-0.38 * R)}L${f3(1.66 * R)} ${f3(-0.26 * R)}C${f3(1.76 * R)} ${f3(-0.24 * R)} ${f3(1.74 * R)} ${f3(-0.08 * R)} ${f3(1.62 * R)} ${f3(-0.1 * R)}L${f3(0.5 * R)} ${f3(-0.16 * R)}Z`;
  return [crown, brim];
};

// ---------------------------------------------------------------------------
// POSE AND GEOMETRY
// ---------------------------------------------------------------------------
export type LegMode = "seat" | "stand" | "none";
export type PersonPose = {
  /** near hand, far hand: figure-local (x forward). The defaults hang at the side */
  hand?: P2;
  farHand?: P2;
  /** multiplies the NEAR arm's length only (default 1): for a shot where the shoulder is already off frame */
  nearReach?: number;
  lean?: number;
  headTilt?: number;
  /** "seat": thighs forward, shins hanging, `swing` / `swingFar` (deg, + = forward). "stand": straight legs, `stride` (deg)
   *  splits them; floorAt(build) below the hip. "none": no legs at all (a figure cropped by a table or the frame) */
  legs?: LegMode;
  swing?: number;
  swingFar?: number;
  stride?: number;
  blink?: number;
  /** 0 flat .. 1 a real smile */
  smile?: number;
  /** 0 shut .. 1 open: delight, awe */
  mouth?: number;
  /** concentration: the tip of the tongue out at the corner of the mouth, 0..1 */
  tongue?: number;
  /** 0 dot eye .. 1 a happy closed arc */
  happy?: number;
  /** a screen's light on the face and hands, 0..1: amber = the made thing; cream = a plain device */
  amberLight?: number;
  creamLight?: number;
};
export type PersonProps = PersonPose & {
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  build?: Build;
  spec?: PersonSpec;
  /** draw this figure's own one shadow (off when a group shares one: use personSil) */
  shadow?: boolean;
  shadowLift?: number;
};

const legGeom = (b: Build, mode: LegMode, a: number, stride = 0) => {
  const H: P2 = b.hip;
  if (mode === "stand") {
    const th = stride * D2R;
    const K: P2 = [H[0] + Math.sin(th) * b.thigh, H[1] + Math.cos(th) * b.thigh];
    const A: P2 = [K[0] + Math.sin(th) * b.shin, K[1] + Math.cos(th) * b.shin];
    return { H, K, A, footRot: -stride * 0.2 };
  }
  // seated: the thigh runs forward, a hair downhill; the shin hangs from the knee at the swing angle
  const K: P2 = [H[0] + b.thigh * Math.cos(5 * D2R), H[1] + b.thigh * Math.sin(5 * D2R)];
  const th = a * D2R;
  const A: P2 = [K[0] + Math.sin(th) * b.shin, K[1] + Math.cos(th) * b.shin];
  // the foot dangles toe-down and lags the shin a little
  return { H, K, A, footRot: 24 - a * 0.7 };
};
/** the standing floor below the hip origin, figure-local */
export const floorAt = (b: Build = CHILD) => b.hip[1] + b.thigh + b.shin + 18.5 * b.foot;

const shoeD = (k: number) => {
  // ankle at 0,0; toe forward; a chunky little sneaker with a high round toe
  const s = (v: number) => f3(v * k);
  return `M${s(-11)} ${s(-9)}L${s(11)} ${s(-9)}C${s(13)} ${s(-3)} ${s(20)} ${s(-3)} ${s(26)} ${s(1)}C${s(32)} ${s(5)} ${s(33)} ${s(11)} ${s(32)} ${s(16)}L${s(-13)} ${s(16)}C${s(-15)} ${s(8)} ${s(-14)} ${s(-2)} ${s(-11)} ${s(-9)}Z`;
};
const soleD = (k: number) => {
  const s = (v: number) => f3(v * k);
  return `M${s(-13.6)} ${s(11)}L${s(32.4)} ${s(11)}L${s(32)} ${s(17)}C${s(32)} ${s(18)} ${s(31)} ${s(18.5)} ${s(30)} ${s(18.5)}L${s(-11)} ${s(18.5)}C${s(-12.5)} ${s(18.5)} ${s(-13)} ${s(18)} ${s(-13)} ${s(17)}Z`;
};
const restHand = (b: Build, lean: number): P2 => {
  const S = rot(b.shoulder, lean);
  return [S[0] + 8, S[1] + (b.upper + b.fore) * 0.92];
};

/** the hand: a soft mitten along the forearm with a thumb nub on top (the elbow-side point E -> the wrist W) */
const Mitten: React.FC<{ E: P2; W: P2; r: number; fill: string }> = ({ E, W, r, fill }) => {
  const a = Math.atan2(W[1] - E[1], W[0] - E[0]) / D2R;
  return (
    <g transform={`translate(${f3(W[0])} ${f3(W[1])}) rotate(${f3(a)})`}>
      <ellipse cx={f3(r * 0.32)} cy={0} rx={f3(r * 1.18)} ry={f3(r * 0.94)} fill={fill} />
      <circle cx={f3(r * 0.5)} cy={f3(-r * 0.74)} r={f3(r * 0.34)} fill={fill} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PERSON
// ---------------------------------------------------------------------------
/** a world point -> figure-local (x forward), for `hand` / `farHand` targets on objects in the world */
export const worldToLocal = (w: P2, p: { x: number; y: number; scale?: number; facing?: 1 | -1 }): P2 => {
  const s = p.scale ?? 1;
  const fc = p.facing ?? 1;
  return [((w[0] - p.x) / s) * fc, (w[1] - p.y) / s];
};
/** figure-local -> world */
export const localToWorld = (l: P2, p: { x: number; y: number; scale?: number; facing?: 1 | -1 }): P2 => {
  const s = p.scale ?? 1;
  const fc = p.facing ?? 1;
  return [p.x + l[0] * s * fc, p.y + l[1] * s];
};
/** the head's centre in figure-local coords under a lean and a tilt (to pin props, or aim light) */
export const headCentre = (b: Build, lean = 0, tilt = 0): P2 => rot(rot(b.head, tilt, b.neck), lean);

export const Person: React.FC<PersonProps> = ({
  x,
  y,
  scale = 1,
  facing = 1,
  build = CHILD,
  spec = KID_SPEC,
  hand,
  farHand,
  nearReach = 1,
  lean = 0,
  headTilt = 0,
  legs = "seat",
  swing = 4,
  swingFar,
  stride = 0,
  blink = 0,
  smile = 0.5,
  mouth = 0,
  tongue = 0,
  happy = 0,
  amberLight = 0,
  creamLight = 0,
  shadow = true,
  shadowLift = 0,
}) => {
  const uid = uidOf(useId());
  const b = build;
  const R = b.R;
  const S = rot(b.shoulder, lean);
  const FS = rot(b.farShoulder, lean);
  const near = solveArm(S, hand ?? restHand(b, lean), b.upper * nearReach, b.fore * nearReach, 1);
  const far = solveArm(FS, farHand ?? restHand(b, lean), b.upper, b.fore, 1);
  const legN = legGeom(b, legs, swing, stride);
  const legF = legGeom(b, legs, swingFar ?? swing, -stride);
  const skin = spec.skin;
  const headTf = `rotate(${f3(lean)}) rotate(${f3(headTilt)} ${f3(b.neck[0])} ${f3(b.neck[1])}) translate(${f3(b.head[0])} ${f3(b.head[1])})`;
  const hair = hairShapes(spec.hairStyle, R);
  const eye: P2 = [0.5 * R, 0.04 * R];
  const eyeR = (b === CHILD ? 0.115 : 0.095) * R;
  const blinkK = 1 - 0.88 * clamp01(blink);
  const sm = clamp01(smile);
  const mo = clamp01(mouth);
  const mx0 = 0.5 * R;
  const mx1 = 0.8 * R;
  const my = 0.46 * R;
  const amber = clamp01(amberLight);
  const cream = clamp01(creamLight);
  const lit = (c: string) => mixHex(mixHex(c, COLOR.amberTop, 0.18 * amber), "#FFF8EA", 0.22 * cream);
  const grad = (id: string, c: string, y0: number, y1: number) => (
    <linearGradient id={`${uid}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
      <stop offset="0" stopColor={topOf(c)} />
      <stop offset="1" stopColor={footOf(c)} />
    </linearGradient>
  );
  const drawLeg = (g: ReturnType<typeof legGeom>, isFar: boolean) => {
    const tone = (c: string) => (isFar ? farOf(c) : c);
    const pants = spec.pants;
    const k = b.foot;
    const shortsEnd: P2 = [lerp(g.H[0], g.K[0], 1), lerp(g.H[1], g.K[1], 1)];
    const sockAt: P2 = [lerp(g.K[0], g.A[0], 0.52), lerp(g.K[1], g.A[1], 0.52)];
    return (
      <g>
        {spec.shorts ? (
          <g>
            <path d={`M${f3(g.K[0])} ${f3(g.K[1])}L${f3(g.A[0])} ${f3(g.A[1])}`} stroke={tone(skin)} strokeWidth={b.shinW} strokeLinecap="round" fill="none" />
            <path d={`M${f3(sockAt[0])} ${f3(sockAt[1])}L${f3(g.A[0])} ${f3(g.A[1])}`} stroke={tone(spec.sock ?? CLOTH.cream)} strokeWidth={b.shinW + 1.5} strokeLinecap="butt" fill="none" />
          </g>
        ) : (
          <path d={`M${f3(g.K[0])} ${f3(g.K[1])}L${f3(g.A[0])} ${f3(g.A[1])}`} stroke={tone(pants)} strokeWidth={b.shinW} strokeLinecap="round" fill="none" />
        )}
        <g transform={`translate(${f3(g.A[0])} ${f3(g.A[1])}) rotate(${f3(g.footRot)})`}>
          <path d={shoeD(k)} fill={tone(spec.shoe ?? "#6B4C3A")} />
          <path d={soleD(k)} fill={isFar ? mixHex(tone(spec.shoe ?? "#6B4C3A"), tone(spec.sole ?? "#D9C8AE"), 0.35) : spec.sole ?? "#D9C8AE"} />
        </g>
        <path d={`M${f3(g.H[0])} ${f3(g.H[1])}L${f3(shortsEnd[0])} ${f3(shortsEnd[1])}`} stroke={isFar ? tone(pants) : `url(#${uid}pt)`} strokeWidth={b.thighW} strokeLinecap="round" fill="none" />
      </g>
    );
  };
  const inner = (
    <g transform={`translate(${f3(x)} ${f3(y)}) scale(${f3(scale * facing)} ${f3(scale)})`}>
      <defs>
        {grad("sk", lit(skin), -R, R)}
        {grad("hr", spec.hair, -R * 1.3, R)}
        {grad("tp", spec.top, b.neck[1] - 20, 8)}
        {grad("pt", spec.pants, b.hip[1] - b.thighW, b.hip[1] + b.thighW)}
        {grad("cp", spec.cap ?? spec.hair, -R * 1.2, -R * 0.1)}
        <radialGradient id={`${uid}fa`} gradientUnits="userSpaceOnUse" cx={f3(1.3 * R)} cy={f3(0.3 * R)} r={f3(1.9 * R)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.4 * amber)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}hc`}>
          <path d={circleD(0, 0, R)} />
        </clipPath>
      </defs>
      {/* far leg, far arm: behind everything */}
      {legs !== "none" ? drawLeg(legF, true) : null}
      <path d={`M${f3(FS[0])} ${f3(FS[1])}L${f3(far.E[0])} ${f3(far.E[1])}L${f3(far.W[0])} ${f3(far.W[1])}`} stroke={farOf(spec.top)} strokeWidth={b.armW - 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Mitten E={far.E} W={far.W} r={b.hand * 0.95} fill={lit(farOf(skin))} />
      {/* near leg, torso */}
      {legs !== "none" ? drawLeg(legN, false) : null}
      <g transform={`rotate(${f3(lean)})`}>
        {spec.hoodie ? <circle cx={b.hood[0]} cy={b.hood[1]} r={b.hoodR} fill={mixHex(spec.top, COLOR.shadow, 0.14)} /> : null}
        <path d={b.torsoD} fill={`url(#${uid}tp)`} />
        {spec.hoodie ? (
          <g fill="none" strokeLinecap="round">
            {/* the kangaroo pocket: one tone step, no line */}
            <path d="M-8 -6L-4 -36C4 -44 22 -44 32 -36L35 -6Z" fill={mixHex(spec.top, COLOR.shadow, 0.1)} />
            {/* the drawstrings */}
            <path d="M18 -104L21 -82" stroke={CLOTH.cream} strokeWidth={3.2} />
            <path d="M28 -100L29 -86" stroke={CLOTH.cream} strokeWidth={3.2} />
          </g>
        ) : null}
      </g>
      {/* the head */}
      <g transform={headTf}>
        {hair.back.map((d, i) => (
          <path key={`hb${i}`} d={d} fill={`url(#${uid}hr)`} />
        ))}
        {/* the neck stub: hides the seam between the head and the collar */}
        <circle cx={0} cy={0} r={R} fill={`url(#${uid}sk)`} />
        <circle cx={0.97 * R} cy={0.14 * R} r={0.17 * R} fill={`url(#${uid}sk)`} />
        {amber > 0.002 ? (
          <g clipPath={`url(#${uid}hc)`}>
            <rect x={-R} y={-R} width={2 * R} height={2 * R} fill={`url(#${uid}fa)`} />
          </g>
        ) : null}
        <circle cx={0.34 * R} cy={0.38 * R} r={0.16 * R} fill="#D9846E" opacity={0.38} />
        {/* the eye */}
        <g opacity={1 - clamp01(happy)}>
          <ellipse cx={f3(eye[0])} cy={f3(eye[1])} rx={f3(eyeR)} ry={f3(eyeR * blinkK)} fill={COLOR.inkDark} />
          {blink < 0.3 ? <circle cx={f3(eye[0] + eyeR * 0.34)} cy={f3(eye[1] - eyeR * 0.36)} r={f3(eyeR * 0.3)} fill="#FFF8EA" /> : null}
        </g>
        {happy > 0.001 ? (
          <path
            d={`M${f3(eye[0] - 0.15 * R)} ${f3(eye[1] + 0.03 * R)}Q${f3(eye[0])} ${f3(eye[1] - 0.16 * R)} ${f3(eye[0] + 0.15 * R)} ${f3(eye[1] + 0.03 * R)}`}
            stroke={COLOR.inkDark}
            strokeWidth={3.8}
            strokeLinecap="round"
            fill="none"
            opacity={clamp01(happy)}
          />
        ) : null}
        {/* the mouth: a line that smiles, opening into a small soft shape */}
        {tongue > 0.01 ? <ellipse cx={f3(mx1 - 0.02 * R)} cy={f3(my + 0.03 * R + 0.06 * R * clamp01(tongue))} rx={f3(0.075 * R)} ry={f3(0.1 * R * clamp01(tongue))} fill="#D9705E" /> : null}
        {mo > 0.01 ? (
          <path
            d={`M${f3(mx0)} ${f3(my - 1 - 2 * sm)}Q${f3((mx0 + mx1) / 2)} ${f3(my + 2)} ${f3(mx1)} ${f3(my - 3 - 2 * sm)}Q${f3((mx0 + mx1) / 2 + 2)} ${f3(my + 3 + 0.3 * R * mo)} ${f3(mx0)} ${f3(my - 1 - 2 * sm)}Z`}
            fill={mixHex(COLOR.inkDark, "#8A3F33", 0.5)}
          />
        ) : (
          <path d={`M${f3(mx0)} ${f3(my - 1 - 2 * sm)}Q${f3((mx0 + mx1) / 2)} ${f3(my + 2 + 8 * sm)} ${f3(mx1)} ${f3(my - 3 - 3 * sm)}`} stroke={mixHex(COLOR.inkDark, skin, 0.2)} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        )}
        {spec.beard ? <path d={softClosed([[-0.16 * R, 0.22 * R], [0.2 * R, 0.5 * R], [0.5 * R, 0.3 * R], [0.98 * R, 0.34 * R], [0.8 * R, 1.0 * R], [0.1 * R, 1.08 * R], [-0.28 * R, 0.66 * R]])} fill={`url(#${uid}hr)`} /> : null}
        {hair.front.map((d, i) => (
          <path key={`hf${i}`} d={d} fill={`url(#${uid}hr)`} />
        ))}
        {spec.hairStyle !== "bob" ? <circle cx={-0.12 * R} cy={0.12 * R} r={0.17 * R} fill={mixHex(lit(skin), COLOR.shadow, 0.16)} /> : null}
        {spec.hairStyle === "cap" ? capShapes(R).map((d, i) => <path key={`c${i}`} d={d} fill={`url(#${uid}cp)`} />) : null}
        {spec.glasses ? (
          <g stroke={COLOR.inkDark} strokeWidth={3.2} fill="none" strokeLinecap="round">
            <circle cx={f3(eye[0])} cy={f3(eye[1])} r={f3(0.25 * R)} />
            <path d={`M${f3(eye[0] - 0.25 * R)} ${f3(eye[1] - 0.03 * R)}L${f3(-0.1 * R)} ${f3(-0.02 * R)}`} />
          </g>
        ) : null}
      </g>
      {/* the near arm: the upper arm one step lighter so it reads on the torso; a soft shadow under it */}
      <path d={`M${f3(S[0])} ${f3(S[1] + 4)}L${f3(near.E[0])} ${f3(near.E[1] + 4)}`} stroke={mixHex(spec.top, COLOR.shadow, 0.3)} strokeWidth={b.armW} strokeLinecap="round" fill="none" opacity={0.45} />
      <path d={`M${f3(S[0])} ${f3(S[1])}L${f3(near.E[0])} ${f3(near.E[1])}`} stroke={topOf(spec.top)} strokeWidth={b.armW} strokeLinecap="round" fill="none" />
      <path d={`M${f3(near.E[0])} ${f3(near.E[1])}L${f3(near.W[0])} ${f3(near.W[1])}`} stroke={spec.tee ? lit(skin) : topOf(spec.top)} strokeWidth={spec.tee ? b.armW * 0.72 : b.armW - 1.5} strokeLinecap="round" fill="none" />
      {spec.tee ? <circle cx={f3(near.E[0])} cy={f3(near.E[1])} r={f3(b.armW / 2)} fill={topOf(spec.top)} /> : null}
      <Mitten E={near.E} W={near.W} r={b.hand} fill={lit(skin)} />
    </g>
  );
  return (
    <g>
      {shadow ? (
        <UnionShadow
          sil={personSil({ x, y, scale, facing, build, spec, hand, farHand, nearReach, lean, headTilt, legs, swing, swingFar, stride })}
          s={scale * (b.R / 66) * 1.2}
          elevation="rest"
          lift={shadowLift}
        />
      ) : null}
      {inner}
    </g>
  );
};

/** the silhouette of a figure, for one UnionShadow (solo, or joined with its stool, desk and laptop) */
export const personSil = (p: PersonProps): SilItem[] => {
  const b = p.build ?? CHILD;
  const lean = p.lean ?? 0;
  const tilt = p.headTilt ?? 0;
  const s = p.scale ?? 1;
  const fc = p.facing ?? 1;
  const tf = `translate(${f3(p.x)} ${f3(p.y)}) scale(${f3(s * fc)} ${f3(s)})`;
  const S = rot(b.shoulder, lean);
  const FS = rot(b.farShoulder, lean);
  const near = solveArm(S, p.hand ?? restHand(b, lean), b.upper * (p.nearReach ?? 1), b.fore * (p.nearReach ?? 1), 1);
  const far = solveArm(FS, p.farHand ?? restHand(b, lean), b.upper, b.fore, 1);
  const legs = p.legs ?? "seat";
  const spec = p.spec ?? KID_SPEC;
  const hair = hairShapes(spec.hairStyle, b.R);
  const hc = rot(rot(b.head, tilt, b.neck), lean);
  const headTf = `${tf} rotate(${f3(lean)}) rotate(${f3(tilt)} ${f3(b.neck[0])} ${f3(b.neck[1])}) translate(${f3(b.head[0])} ${f3(b.head[1])})`;
  const out: SilItem[] = [
    { d: b.torsoD, tf: `${tf} rotate(${f3(lean)})` },
    { d: circleD(hc[0], hc[1], b.R), tf },
    ...[...hair.back, ...hair.front].map((d) => ({ d, tf: headTf })),
    { d: `M${f3(S[0])} ${f3(S[1])}L${f3(near.E[0])} ${f3(near.E[1])}L${f3(near.W[0])} ${f3(near.W[1])}`, stroke: b.armW, tf },
    { d: `M${f3(FS[0])} ${f3(FS[1])}L${f3(far.E[0])} ${f3(far.E[1])}L${f3(far.W[0])} ${f3(far.W[1])}`, stroke: b.armW, tf },
  ];
  if (legs !== "none") {
    for (const a of [p.swing ?? 4, p.swingFar ?? p.swing ?? 4]) {
      const g = legGeom(b, legs, a, p.stride ?? 0);
      out.push({ d: `M${f3(g.H[0])} ${f3(g.H[1])}L${f3(g.K[0])} ${f3(g.K[1])}`, stroke: b.thighW, tf });
      out.push({ d: `M${f3(g.K[0])} ${f3(g.K[1])}L${f3(g.A[0])} ${f3(g.A[1])}`, stroke: b.shinW, tf });
      out.push({ d: shoeD(b.foot), tf: `${tf} translate(${f3(g.A[0])} ${f3(g.A[1])}) rotate(${f3(g.footRot)})` });
    }
  }
  return out;
};

/** THE KID: the one recurring character. Hand targets figure-local (worldToLocal), x forward. */
export const Kid: React.FC<Omit<PersonProps, "build" | "spec">> = (p) => <Person {...p} build={CHILD} spec={KID_SPEC} />;
/** a friend: the child rig, `variant` 0..3 */
export const Friend: React.FC<Omit<PersonProps, "build" | "spec"> & { variant?: number }> = ({ variant = 0, ...p }) => <Person {...p} build={CHILD} spec={FRIEND_SPECS[((variant % FRIEND_SPECS.length) + FRIEND_SPECS.length) % FRIEND_SPECS.length]} />;
/** an adult: the same rig at adult proportions, `variant` 0..5 or your own `spec`. Stands by default. */
export const Adult: React.FC<Omit<PersonProps, "build" | "spec"> & { variant?: number; spec?: PersonSpec }> = ({ variant = 0, spec, legs = "stand", ...p }) => (
  <Person {...p} legs={legs} build={ADULT} spec={spec ?? ADULT_SPECS[((variant % ADULT_SPECS.length) + ADULT_SPECS.length) % ADULT_SPECS.length]} />
);

// ---------------------------------------------------------------------------
// THE LAPTOP — one orthographic projection, so everything on it is an affine map (the screen's pixels stay a true grid)
// local axes: X along the width, Y up, Z toward the user; the hinge line at Y = Z = 0
// ---------------------------------------------------------------------------
export const LAPTOP = { H: 0.645, D: 0.66, T: 0.017, baseT: 0.03, bezel: 0.042, chin: 0.066, shell: 0.012 } as const;
export type LaptopProps = {
  /** the hinge's centre, world */
  x: number;
  y: number;
  /** outer width, world */
  w: number;
  yaw?: number;
  pitch?: number;
  /** the lid's tilt back from upright, deg */
  tilt?: number;
  /** amber light of the made thing: the screen's edge bloom, 0..1 (a tone, never a pulse) */
  glow?: number;
  /** the cream screen's own light, 0 = dark screen, 1 = lit */
  lit?: number;
  /** the view's zoom, for the bloom */
  k?: number;
  dim?: number;
  /** drawn inside the display, in cells (0..cols, 0..rows), clipped */
  screen?: React.ReactNode;
  cols?: number;
  rows?: number;
  shadow?: boolean;
  shadowLift?: number;
  /** key under the deck a key press lands on, drawn pressed (cosmetic) */
  screenColor?: string;
};
const hull = (pts: P2[]) => {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const p of s) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: P2[] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const polyD = (pts: P2[]) => `${pts.map((p, i) => `${i ? "L" : "M"}${f3(p[0])} ${f3(p[1])}`).join("")}Z`;

/** the laptop's projection as numbers: P(X,Y,Z) -> world; deck(u,v) (u 0..1 left to right, v 0..1 hinge to front); the screen */
export const laptopFrame = (l: Pick<LaptopProps, "x" | "y" | "w" | "yaw" | "pitch" | "tilt">) => {
  const th = (l.yaw ?? 30) * D2R;
  const ph = (l.pitch ?? 14) * D2R;
  const a = (l.tilt ?? 14) * D2R;
  const W = l.w;
  const H = W * LAPTOP.H;
  const D = W * LAPTOP.D;
  const T = W * LAPTOP.T;
  const bT = W * LAPTOP.baseT;
  const P = (X: number, Y: number, Z: number): P2 => {
    const xr = X * Math.cos(th) - Z * Math.sin(th);
    const zr = X * Math.sin(th) + Z * Math.cos(th);
    return [l.x + xr, l.y - Y * Math.cos(ph) + zr * Math.sin(ph)];
  };
  const lid = (u: number, v: number, back = 0): P2 => {
    // u -W/2..W/2 across, v 0..H up the lid from the hinge; back > 0 is behind the screen plane
    const Y = v * Math.cos(a) - back * Math.sin(a);
    const Z = -v * Math.sin(a) - back * Math.cos(a);
    return P(u, Y, Z);
  };
  const showsScreen = Math.sin(a) * Math.sin(ph) + Math.cos(a) * Math.cos(th) * Math.cos(ph) > 0;
  const bz = W * LAPTOP.bezel;
  const chin = W * LAPTOP.chin;
  const sw = W - 2 * bz;
  const sh = H - bz - chin;
  const scr = {
    w: sw,
    h: sh,
    o: lid(-sw / 2, H - bz),
    eu: [lid(sw / 2, H - bz)[0] - lid(-sw / 2, H - bz)[0], lid(sw / 2, H - bz)[1] - lid(-sw / 2, H - bz)[1]] as P2,
    ev: [lid(-sw / 2, chin)[0] - lid(-sw / 2, H - bz)[0], lid(-sw / 2, chin)[1] - lid(-sw / 2, H - bz)[1]] as P2,
  };
  const deck = (u: number, v: number): P2 => P(-W / 2 + u * W, 0, v * D);
  const screenPoint = (u: number, v: number): P2 => [scr.o[0] + scr.eu[0] * u + scr.ev[0] * v, scr.o[1] + scr.eu[1] * u + scr.ev[1] * v];
  const screenMatrix = (cols: number, rows: number) =>
    `matrix(${f3(scr.eu[0] / cols)} ${f3(scr.eu[1] / cols)} ${f3(scr.ev[0] / rows)} ${f3(scr.ev[1] / rows)} ${f3(scr.o[0])} ${f3(scr.o[1])})`;
  const lidOuter = [lid(-W / 2, 0), lid(W / 2, 0), lid(W / 2, H), lid(-W / 2, H)];
  const lidHull = hull([...lidOuter, lid(-W / 2, 0, T), lid(W / 2, 0, T), lid(W / 2, H, T), lid(-W / 2, H, T)]);
  const deckTop = [P(-W / 2, 0, 0), P(W / 2, 0, 0), P(W / 2, 0, D), P(-W / 2, 0, D)];
  const deckHull = hull([...deckTop, ...deckTop.map((q): P2 => [q[0], q[1] + bT * Math.cos(ph)])]);
  const unionHull = hull([...lidHull, ...deckHull]);
  return { P, lid, deck, scr, screenPoint, screenMatrix, showsScreen, lidOuter, lidHull, deckTop, deckHull, unionHull, W, H, D, T };
};

export const laptopSil = (l: Pick<LaptopProps, "x" | "y" | "w" | "yaw" | "pitch" | "tilt">): SilItem[] => {
  const F = laptopFrame(l);
  return [{ d: polyD(F.lidHull) }, { d: polyD(F.deckHull) }];
};

export const Laptop: React.FC<LaptopProps> = ({ x, y, w, yaw = 30, pitch = 14, tilt = 14, glow = 0, lit = 1, k = 1, dim = 0, screen, cols = 80, rows = 50, shadow = true, shadowLift = 0, screenColor }) => {
  const uid = uidOf(useId());
  const F = laptopFrame({ x, y, w, yaw, pitch, tilt });
  const creamT = mixHex(COLOR.cream, COLOR.board, clamp01(dim));
  const creamF = mixHex(COLOR.creamFoot, COLOR.boardFoot, clamp01(dim));
  const edge = mixHex(creamF, COLOR.shadow, 0.3);
  const scrC = mixHex(mixHex(COLOR.inkDark, COLOR.ground, 0.6), screenColor ?? COLOR.cream, clamp01(lit));
  const H = F.H;
  const W = F.W;
  const bezelQuad: P2[] = [F.lid(-W / 2 + w * LAPTOP.shell, w * LAPTOP.shell), F.lid(W / 2 - w * LAPTOP.shell, w * LAPTOP.shell), F.lid(W / 2 - w * LAPTOP.shell, H - w * LAPTOP.shell), F.lid(-W / 2 + w * LAPTOP.shell, H - w * LAPTOP.shell)];
  const scrQuad: P2[] = [F.screenPoint(0, 0), F.screenPoint(1, 0), F.screenPoint(1, 1), F.screenPoint(0, 1)];
  // the deck
  const dp = (u: number, v: number) => F.deck(u, v);
  const keysQuad = [dp(0.07, 0.07), dp(0.93, 0.07), dp(0.93, 0.56), dp(0.07, 0.56)];
  const padQuad = [dp(0.33, 0.62), dp(0.67, 0.62), dp(0.67, 0.93), dp(0.33, 0.93)];
  const keys: string[] = [];
  const KX = 13;
  const KY = 4;
  for (let j = 0; j < KY; j++) {
    for (let i = 0; i < KX; i++) {
      const u0 = lerp(0.075, 0.925, (i + 0.05) / KX);
      const u1 = lerp(0.075, 0.925, (i + 0.95) / KX);
      const v0 = lerp(0.08, 0.55, (j + 0.12) / KY);
      const v1 = lerp(0.08, 0.55, (j + 0.88) / KY);
      keys.push(polyD([dp(u0, v0), dp(u1, v0), dp(u1, v1), dp(u0, v1)]));
    }
  }
  // the mark: on the lid's back when we see it, on the chin when we see the screen
  const mid = F.lid(0, H * 0.54, F.T);
  const eu: P2 = [(F.lid(1, H * 0.54, F.T)[0] - F.lid(0, H * 0.54, F.T)[0]), (F.lid(1, H * 0.54, F.T)[1] - F.lid(0, H * 0.54, F.T)[1])];
  const ev: P2 = [(F.lid(0, H * 0.54 - 1, F.T)[0] - mid[0]), (F.lid(0, H * 0.54 - 1, F.T)[1] - mid[1])];
  const chinMid = F.lid(0, w * LAPTOP.chin * 0.5);
  const cu: P2 = [(F.lid(1, 0)[0] - F.lid(0, 0)[0]), (F.lid(1, 0)[1] - F.lid(0, 0)[1])];
  const cv: P2 = [(F.lid(0, 0)[0] - F.lid(0, 1)[0]), (F.lid(0, 0)[1] - F.lid(0, 1)[1])];
  const lidGroup = F.showsScreen ? (
    <g>
      <path d={polyD(F.lidHull)} fill={creamF} />
      <path d={polyD(F.lidOuter)} fill={creamT} />
      <path d={polyD(bezelQuad)} fill={mixHex(COLOR.inkDark, COLOR.ground, 0.25)} />
      <defs>
        <clipPath id={`${uid}s`}>
          <path d={polyD(scrQuad)} />
        </clipPath>
      </defs>
      {glow > 0.002 ? <path d={polyD(scrQuad)} fill={COLOR.amberTop} opacity={f3(clamp01(glow))} style={{ filter: bloomFilter(k) }} /> : null}
      <path d={polyD(scrQuad)} fill={scrC} />
      <g clipPath={`url(#${uid}s)`}>
        <g transform={F.screenMatrix(cols, rows)}>{screen}</g>
      </g>
      {/* the blossom, small on the chin */}
      <g transform={`matrix(${f3(cu[0])} ${f3(cu[1])} ${f3(cv[0])} ${f3(cv[1])} ${f3(chinMid[0])} ${f3(chinMid[1])})`}>
        <ChatGPTGlyph x={0} y={0} size={w * 0.052} color={COLOR.inkCream} />
      </g>
    </g>
  ) : (
    <g>
      <path d={polyD(F.lidHull)} fill={creamF} />
      <path d={polyD([F.lid(-W / 2, 0, F.T), F.lid(W / 2, 0, F.T), F.lid(W / 2, H, F.T), F.lid(-W / 2, H, F.T)])} fill={creamT} />
      <g transform={`matrix(${f3(eu[0])} ${f3(eu[1])} ${f3(ev[0])} ${f3(ev[1])} ${f3(mid[0])} ${f3(mid[1])})`}>
        <ChatGPTGlyph x={0} y={0} size={w * 0.26} color={COLOR.inkDark} />
      </g>
    </g>
  );
  const deckGroup = (
    <g>
      <path d={polyD(F.deckHull)} fill={edge} />
      <path d={polyD(F.deckTop)} fill={creamF} />
      <path d={polyD(keysQuad)} fill={mixHex(creamF, COLOR.board, 0.34)} />
      <path d={keys.join("")} fill={creamT} />
      <path d={polyD(padQuad)} fill={mixHex(creamT, COLOR.board, 0.22)} />
    </g>
  );
  return (
    <g>
      {shadow ? <UnionShadow sil={laptopSil({ x, y, w, yaw, pitch, tilt })} s={w / 200} elevation="rest" lift={shadowLift} /> : null}
      {F.showsScreen ? (
        <>
          {lidGroup}
          {deckGroup}
        </>
      ) : (
        <>
          {deckGroup}
          {lidGroup}
        </>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FURNITURE (board tone: context)
// ---------------------------------------------------------------------------
const WOOD_T = COLOR.board;
const WOOD_F = COLOR.boardFoot;
const WOOD_LEG = mixHex(COLOR.boardFoot, COLOR.ground, 0.38);
const WOOD_FAR = mixHex(COLOR.boardFoot, COLOR.ground, 0.6);
export type StoolProps = { x: number; seatY: number; floorY: number; w?: number; shadow?: boolean };
const stoolParts = ({ x, seatY, floorY, w = 150 }: StoolProps) => {
  const hw = w / 2;
  const legW = 15;
  const splay = 26;
  const legD = (x0: number, x1: number, y0: number, y1: number, lw: number) => `M${f3(x0 - lw / 2)} ${f3(y0)}L${f3(x0 + lw / 2)} ${f3(y0)}L${f3(x1 + lw / 2 - 1)} ${f3(y1)}L${f3(x1 - lw / 2 + 1)} ${f3(y1)}Z`;
  const seat = `M${f3(x - hw + 7)} ${f3(seatY)}L${f3(x + hw - 7)} ${f3(seatY)}Q${f3(x + hw)} ${f3(seatY)} ${f3(x + hw)} ${f3(seatY + 7)}L${f3(x + hw)} ${f3(seatY + 12)}Q${f3(x + hw)} ${f3(seatY + 20)} ${f3(x + hw - 7)} ${f3(seatY + 20)}L${f3(x - hw + 7)} ${f3(seatY + 20)}Q${f3(x - hw)} ${f3(seatY + 20)} ${f3(x - hw)} ${f3(seatY + 12)}L${f3(x - hw)} ${f3(seatY + 7)}Q${f3(x - hw)} ${f3(seatY)} ${f3(x - hw + 7)} ${f3(seatY)}Z`;
  const l0 = legD(x - hw + 26, x - hw + 26 - splay, seatY + 18, floorY, legW);
  const l1 = legD(x + hw - 26, x + hw - 26 + splay, seatY + 18, floorY, legW);
  const farL = legD(x - 14, x - 14 - splay * 0.3, seatY + 18, floorY - 16, legW - 3);
  const farR = legD(x + 14, x + 14 + splay * 0.3, seatY + 18, floorY - 16, legW - 3);
  const ry = lerp(seatY, floorY, 0.62);
  const rEdge = (ry - seatY - 18) / (floorY - seatY - 18);
  const rx0 = x - hw + 26 - splay * rEdge;
  const rx1 = x + hw - 26 + splay * rEdge;
  const rung = `M${f3(rx0)} ${f3(ry - 5)}L${f3(rx1)} ${f3(ry - 5)}L${f3(rx1)} ${f3(ry + 5)}L${f3(rx0)} ${f3(ry + 5)}Z`;
  return { seat, l0, l1, farL, farR, rung };
};
export const stoolSil = (p: StoolProps): SilItem[] => {
  const q = stoolParts(p);
  return [q.seat, q.l0, q.l1, q.rung].map((d) => ({ d }));
};
/** a stool much too tall: seat, two legs, the far pair darker, a rung the kid's feet never reach */
export const Stool: React.FC<StoolProps> = (p) => {
  const q = stoolParts(p);
  return (
    <g>
      {p.shadow ? <UnionShadow sil={stoolSil(p)} s={1.2} contact={{ x: p.x, y: p.floorY, w: p.w ?? 150 }} /> : null}
      <path d={q.farL + q.farR} fill={WOOD_FAR} />
      <path d={q.rung} fill={WOOD_LEG} />
      <path d={q.l0 + q.l1} fill={WOOD_LEG} />
      <path d={q.seat} fill={WOOD_T} />
    </g>
  );
};
export type DeskProps = { x0: number; x1: number; y: number; floorY: number; depth?: number; legInset?: number; shadow?: boolean };
const deskParts = ({ x0, x1, y, floorY, depth = 96, legInset = 40 }: DeskProps) => {
  const inset = depth * 0.28;
  const surface = `M${f3(x0 + inset)} ${f3(y)}L${f3(x1 - inset)} ${f3(y)}L${f3(x1)} ${f3(y + depth)}L${f3(x0)} ${f3(y + depth)}Z`;
  const edge = `M${f3(x0)} ${f3(y + depth)}L${f3(x1)} ${f3(y + depth)}L${f3(x1)} ${f3(y + depth + 18)}L${f3(x0)} ${f3(y + depth + 18)}Z`;
  const leg = (a: number, lw: number, y1: number) => `M${f3(a - lw / 2)} ${f3(y + depth + 16)}L${f3(a + lw / 2)} ${f3(y + depth + 16)}L${f3(a + lw / 2 - 3)} ${f3(y1)}L${f3(a - lw / 2 + 3)} ${f3(y1)}Z`;
  const legs = leg(x0 + legInset, 26, floorY) + leg(x1 - legInset, 26, floorY);
  const farLegs = leg(x0 + inset + legInset + 10, 18, floorY - depth * 0.6) + leg(x1 - inset - legInset - 10, 18, floorY - depth * 0.6);
  return { surface, edge, legs, farLegs };
};
export const deskSil = (p: DeskProps): SilItem[] => {
  const q = deskParts(p);
  return [q.surface, q.edge, q.legs].map((d) => ({ d }));
};
/** a plain table seen slightly from above: the top surface, its front edge, the legs */
export const Desk: React.FC<DeskProps> = (p) => {
  const q = deskParts(p);
  return (
    <g>
      {p.shadow ? <UnionShadow sil={deskSil(p)} s={1.2} contact={{ x: (p.x0 + p.x1) / 2, y: p.floorY, w: p.x1 - p.x0 }} /> : null}
      <path d={q.farLegs} fill={WOOD_FAR} />
      <path d={q.legs} fill={WOOD_LEG} />
      <path d={q.surface} fill={WOOD_T} />
      <path d={q.edge} fill={WOOD_F} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// AMBER
// ---------------------------------------------------------------------------
export const AMBER = { top: COLOR.amberTop, foot: COLOR.amberFoot, hot: COLOR.amberHot } as const;
/** the one glow, fixed, at the view's zoom: style={{ filter: amberGlowFilter(k) }} */
export const amberGlowFilter = (k: number) => bloomFilter(k);
export { circleD, polyD, hull };
