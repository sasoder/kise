// ---------------------------------------------------------------------------
// cabinCast — the passengers of TryUsStayForTech (scott-free-wifi, cut 13). Stylised, cute, drawn card figures in
// profile facing LEFT (the jet's nose): a big round head with a nose bump, one dot eye, a tiny mouth, a blush dot,
// simple hair shapes, a bean torso, one near arm, short legs. Flat matte card fills in stout tones, top-lit (a soft
// top-to-foot tone ramp per part), no outlines (the only lines: mouth, closed eye, glasses). NEVER realistic.
//
// THE RIG (hip-local px, y down; the hip = where the seat's cushion meets its back): the legs stay put; the upper body
// (torso, head, near arm's shoulder) rotates about the hip by `lean` (deg, + = back into the seat); the head tilts
// about the neck by `tilt`. The near arm is a 2-bone IK from the shoulder to `hand` (hip frame), elbow always below the
// shoulder-hand line (one rule: it never flips). Props: a phone held in the hand (or resting where it was put down),
// a laptop on a tray table (lid angle), headphones (around the neck .. on the ears, carried by the hand).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";

type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const D2R = Math.PI / 180;
const uidOf = (raw: string) => `cc${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ---------------------------------------------------------------------------
// TONES — skin in cream..board, clothes in a few warm muted tones (no amber: amber is United's tech)
// ---------------------------------------------------------------------------
export const SKIN = { cream: "#F0DEC6", light: "#E2C3A0", tan: "#C99C74", board: "#AD8562", deep: "#8C6448", deeper: "#6E4C36" } as const;
export const HAIR = { ink: "#3A271B", chestnut: "#6B4630", sandy: "#C2A27A", grey: "#A99C8C", auburn: "#8A5236" } as const;
export const CLOTH = {
  sage: "#949A6A",
  terracotta: "#C47B5A",
  oat: "#E2CFAA",
  slate: "#857065",
  plum: "#9A6878",
  cream: "#F2E7D3",
  denim: "#737D8A",
  moss: "#7D8250",
  rust: "#B06646",
  brown: "#5E4535",
  cans: "#5A4537",
  cansLight: "#B49A80",
} as const;
const LIGHT_TINT = "#FFF4E2";
const topOf = (c: string) => mixHex(c, LIGHT_TINT, 0.12);
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.14);

export type HairStyle = "crop" | "bob" | "bun" | "curly" | "cap" | "pony" | "bald";
export type CastSpec = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  pants: string;
  shoe?: string;
  cap?: string;
  /** forearm bare (a t-shirt) */
  shortSleeve?: boolean;
  glasses?: boolean;
  mustache?: boolean;
  /** headphone colour: they start round the neck */
  headphones?: string;
  /** 1 = adult; a child has a bigger head on a smaller body */
  child?: boolean;
};

// ---------------------------------------------------------------------------
// GEOMETRY (hip-local, adult)
// ---------------------------------------------------------------------------
export const RIG = {
  R: 60,
  head: [-40, -270] as P2,
  neck: [-30, -200] as P2,
  shoulder: [-40, -178] as P2,
  upper: 92,
  fore: 90,
  armW: 38,
  hand: 15,
  /** the floor below the hip */
  floor: 192,
} as const;
/** the bean torso (hip-local) */
const TORSO_D = "M14 6C22 -56 22 -132 6 -176C-4 -204 -50 -212 -74 -196C-98 -178 -100 -126 -94 -76C-90 -34 -80 -2 -58 6Z";
const THIGH_D = "M8 4L-158 4C-180 4 -186 -18 -186 -28C-186 -46 -176 -60 -158 -60L-30 -60C-6 -60 12 -44 12 -22Z";
const shinD = (child: boolean) => {
  const fl = child ? 150 : RIG.floor;
  return `M-176 -30L-128 -30L-136 ${fl - 28}L-178 ${fl - 28}Z`;
};
const shoeD = (child: boolean) => {
  const fl = child ? 150 : RIG.floor;
  return `M-210 ${fl}C-212 ${fl - 22} -196 ${fl - 34} -176 ${fl - 34}L-132 ${fl - 34}C-124 ${fl - 34} -122 ${fl - 26} -122 ${fl - 16}L-122 ${fl}Z`;
};

const rot = (p: P2, deg: number, o: P2 = [0, 0]): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const sc = (p: P2, k: number): P2 => [p[0] * k, p[1] * k];

/** a point given in HEAD-local coords (centre 0,0, before tilt) -> hip frame, through the lean and the tilt */
export const headToHip = (p: P2, lean: number, tilt: number, child = false): P2 => {
  const hk = child ? 1.12 : 1;
  const bk = child ? 0.8 : 1;
  const headC: P2 = [RIG.head[0] * bk, RIG.head[1] * bk + (child ? -8 : 0)];
  const neck: P2 = sc(RIG.neck, bk);
  const q = add(headC, sc(p, hk));
  return rot(rot(q, tilt, neck), lean);
};
export const shoulderAt = (lean: number, child = false): P2 => rot(sc(RIG.shoulder, child ? 0.8 : 1), lean);

/** 2-bone IK: the elbow always on one side of the shoulder-hand line (bend -1: below / in front, the near arm;
 *  +1: behind, the far arm) — it never flips */
export const solveArm = (S: P2, T: P2, a: number, b: number, bend = -1) => {
  const dx = T[0] - S[0];
  const dy = T[1] - S[1];
  const d0 = Math.hypot(dx, dy);
  const d = Math.max(Math.abs(a - b) + 2, Math.min(a + b - 0.5, d0));
  const phi = Math.atan2(dy, dx);
  const al = Math.acos(c01((a * a + d * d - b * b) / (2 * a * d)));
  const E: P2 = [S[0] + a * Math.cos(phi + bend * al), S[1] + a * Math.sin(phi + bend * al)];
  const W: P2 = [S[0] + (dx / Math.max(1e-6, d0)) * d, S[1] + (dy / Math.max(1e-6, d0)) * d];
  return { E, W };
};

// ---------------------------------------------------------------------------
// HAIR (head-local, R = 60)
// ---------------------------------------------------------------------------
const polar = (r: number, deg: number): P2 => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
const arcPts = (r: number, a0: number, a1: number, n = 24) => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) out.push(polar(r, lerp(a0, a1, i / n)));
  return out;
};
const ptsD = (pts: P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${f3(p[0])} ${f3(p[1])}`).join("");
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;

const R = RIG.R;
const cropD = () =>
  ptsD(arcPts(R * 1.07, 212, 402)) +
  `C${f3(0.62 * R)} ${f3(0.42 * R)} ${f3(0.3 * R)} ${f3(0.3 * R)} ${f3(0.22 * R)} ${f3(0.05 * R)}` +
  `C${f3(0.12 * R)} ${f3(-0.28 * R)} ${f3(-0.3 * R)} ${f3(-0.42 * R)} ${f3(-0.66 * R)} ${f3(-0.5 * R)}Z`;
const bobD = () =>
  ptsD(arcPts(R * 1.12, 196, 432)) +
  `C${f3(0.9 * R)} ${f3(1.06 * R)} ${f3(0.5 * R)} ${f3(1.04 * R)} ${f3(0.22 * R)} ${f3(0.86 * R)}` +
  `C${f3(0.08 * R)} ${f3(0.5 * R)} ${f3(0.06 * R)} ${f3(0.0 * R)} ${f3(-0.12 * R)} ${f3(-0.34 * R)}` +
  `C${f3(-0.4 * R)} ${f3(-0.46 * R)} ${f3(-0.7 * R)} ${f3(-0.4 * R)} ${f3(-0.98 * R)} ${f3(-0.3 * R)}Z`;
const HAIR_D: Record<HairStyle, () => string[]> = {
  crop: () => [cropD()],
  bob: () => [bobD()],
  bun: () => [cropD(), circleD(0.6 * R, -0.86 * R, 0.36 * R)],
  curly: () => [cropD(), ...[214, 238, 262, 286, 310, 334, 358, 382].map((a) => circleD(...polar(1.0 * R, a), 0.27 * R))],
  pony: () => [
    cropD(),
    `M${f3(0.78 * R)} ${f3(-0.62 * R)}C${f3(1.5 * R)} ${f3(-0.5 * R)} ${f3(1.62 * R)} ${f3(0.25 * R)} ${f3(1.32 * R)} ${f3(0.86 * R)}` +
      `C${f3(1.26 * R)} ${f3(0.4 * R)} ${f3(1.12 * R)} ${f3(-0.1 * R)} ${f3(0.86 * R)} ${f3(-0.2 * R)}Z`,
  ],
  cap: () => [
    // the tuft at the back under the cap
    ptsD(arcPts(R * 1.05, 300, 400)) + `C${f3(0.6 * R)} ${f3(0.3 * R)} ${f3(0.4 * R)} ${f3(0.1 * R)} ${f3(0.42 * R)} ${f3(-0.3 * R)}Z`,
  ],
  bald: () => [],
};
const capD = () => {
  const crown = ptsD(arcPts(R * 1.09, 196, 352)) + `C${f3(0.4 * R)} ${f3(-0.22 * R)} ${f3(-0.5 * R)} ${f3(-0.36 * R)} ${f3(-1.05 * R)} ${f3(-0.3 * R)}Z`;
  const brim =
    `M${f3(-0.7 * R)} ${f3(-0.42 * R)}L${f3(-1.62 * R)} ${f3(-0.36 * R)}C${f3(-1.72 * R)} ${f3(-0.35 * R)} ${f3(-1.72 * R)} ${f3(-0.2 * R)} ${f3(-1.6 * R)} ${f3(-0.2 * R)}` +
    `L${f3(-0.7 * R)} ${f3(-0.22 * R)}Z`;
  return [crown, brim];
};

// ---------------------------------------------------------------------------
// POSE
// ---------------------------------------------------------------------------
export type Laptop = { hinge: P2; len: number; lid: number /* deg open, 0 = shut */; glow: number };
export type PassengerPose = {
  lean: number;
  tilt: number;
  hand: P2;
  /** the FAR hand (hip frame), drawn behind the torso and head: only seen when it rises behind the head */
  farHand?: P2;
  /** the phone: in the hand (angle deg) or resting (at, angle) */
  phone?: { at?: P2; angle: number; glow: number };
  laptop?: Laptop;
  /** a tray table from the seat ahead (hip-local x0..x1 at y) */
  tray?: { x0: number; x1: number; y: number };
  /** headphones: 0 round the neck .. 1 on the ears */
  cans?: number;
  smile: number;
  /** 0 open dot .. 1 a content closed arc */
  content: number;
  blink: number;
  /** cream device light on the face, amber screen light on the face (0..1) */
  creamLight: number;
  /** how much of the device's light is left as they settle (1 .. 0), independent of when it lit */
  keep?: number;
  amberLight: number;
};

/** the headphone cup's centre in HEAD-local coords: round the neck (0) .. on the ear (1), along a short arc */
export const cupLocal = (u: number): P2 => {
  const t = c01(u);
  const neck: P2 = [0.32 * R, 1.42 * R];
  const ear: P2 = [0.1 * R, 0.08 * R];
  // the arc bulges back (right), as a hand lifting it would carry it
  const mid: P2 = [0.62 * R, 0.78 * R];
  const a = lerp(neck[0], mid[0], t);
  const b = lerp(mid[0], ear[0], t);
  const c = lerp(neck[1], mid[1], t);
  const d = lerp(mid[1], ear[1], t);
  return [lerp(a, b, t), lerp(c, d, t)];
};

/** where the headband's crown end is (HEAD-local): behind the neck (0) .. over the top of the head (1), bulging back */
export const bandGrip = (u: number): P2 => {
  const t = c01(u);
  const a: P2 = [0.86 * R, 0.72 * R];
  const m: P2 = [1.42 * R, -0.5 * R];
  const b: P2 = [0.1 * R, -1.2 * R];
  return [lerp(lerp(a[0], m[0], t), lerp(m[0], b[0], t), t), lerp(lerp(a[1], m[1], t), lerp(m[1], b[1], t), t)];
};
export const FAR_SHOULDER: P2 = [-22, -186];
/** the far hand at rest: hanging straight down, hidden behind the torso */
export const FAR_REST: P2 = [-30, -12];

// ---------------------------------------------------------------------------
// THE PASSENGER
// ---------------------------------------------------------------------------
export const Passenger: React.FC<{ x: number; y: number; spec: CastSpec; pose: PassengerPose; between?: React.ReactNode }> = ({ x, y, spec, pose, between }) => {
  const uid = uidOf(useId());
  const child = !!spec.child;
  const bk = child ? 0.8 : 1;
  const hk = child ? 1.12 : 1;
  const { lean, tilt } = pose;
  const S = shoulderAt(lean, child);
  const { E, W } = solveArm(S, pose.hand, RIG.upper * bk, RIG.fore * bk);
  const headC = headToHip([0, 0], lean, tilt, child);
  const neck = rot(sc(RIG.neck, bk), lean);
  const sleeve = spec.top;
  const grad = (id: string, c: string, y0: number, y1: number) => (
    <linearGradient id={`${uid}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
      <stop offset="0" stopColor={topOf(c)} />
      <stop offset="1" stopColor={footOf(c)} />
    </linearGradient>
  );
  const shoe = spec.shoe ?? "#4A3326";
  // the head group transform: lean about the hip, tilt about the neck, then to the head centre (scaled)
  const headC0: P2 = [RIG.head[0] * bk, RIG.head[1] * bk + (child ? -8 : 0)];
  const headTf = `rotate(${f3(lean)}) rotate(${f3(tilt)} ${f3(sc(RIG.neck, bk)[0])} ${f3(sc(RIG.neck, bk)[1])}) translate(${f3(headC0[0])} ${f3(headC0[1])}) scale(${f3(hk)})`;
  const cans = pose.cans ?? 0;
  const cup = cupLocal(cans);
  // the headband: on the head an arc hugging the crown; round the neck an arc round the back of the neck
  // the headband: one curve from the cup's top to its crown end, round the back of the neck (0) .. over the head (1)
  const grip = bandGrip(cans);
  const cupTop: P2 = [cup[0], cup[1] - 0.3 * R];
  const bc: P2 = [lerp(0.8 * R, 0.3 * R, c01(cans)), lerp(1.2 * R, -0.85 * R, c01(cans))];
  const band = `M${f3(cupTop[0])} ${f3(cupTop[1])}Q${f3(bc[0])} ${f3(bc[1])} ${f3(grip[0])} ${f3(grip[1])}`;
  const smile = c01(pose.smile);
  const mouth = `M${f3(-0.88 * R)} ${f3(0.44 * R - 1)}Q${f3(-0.75 * R)} ${f3(0.44 * R + 1 + 7 * smile)} ${f3(-0.6 * R)} ${f3(0.44 * R - 2 - 3 * smile)}`;
  const eye: P2 = [-0.5 * R, -0.08 * R];
  const blinkK = 1 - 0.85 * c01(pose.blink);
  const phone = pose.phone;
  const phoneAt: P2 = phone?.at ?? W;
  const phoneRot = phone?.angle ?? 0;
  const cream = c01(pose.creamLight);
  const amberL = c01(pose.amberLight);
  const lap = pose.laptop;
  const tray = pose.tray;
  return (
    <g transform={`translate(${f3(x)} ${f3(y)})`}>
      <defs>
        {grad("sk", spec.skin, -60, 60)}
        {grad("hr", spec.hair, -70, 70)}
        {grad("tp", spec.top, -200, 10)}
        {grad("pt", spec.pants, -60, RIG.floor)}
        {grad("cp", spec.cap ?? spec.hair, -70, -10)}
        <radialGradient id={`${uid}cl`}>
          <stop offset="0" stopColor="#FFFBF3" stopOpacity="1" />
          <stop offset="0.3" stopColor="#FFF6E6" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFF4DF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}fl`} gradientUnits="userSpaceOnUse" cx={f3(-1.3 * R)} cy={f3(0.3 * R)} r={f3(2.0 * R)}>
          <stop offset="0" stopColor="#FFF8EA" stopOpacity={f3(0.42 * cream)} />
          <stop offset="1" stopColor="#FFF6E4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}fa`} gradientUnits="userSpaceOnUse" cx={f3(-1.5 * R)} cy={f3(0.4 * R)} r={f3(1.9 * R)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.34 * amberL)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}hc`}>
          <path d={circleD(0, 0, R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R)} />
        </clipPath>
      </defs>
      {/* the tray table (the seat ahead's) */}
      {tray ? (
        <g>
          <rect x={f3(tray.x0)} y={f3(tray.y)} width={f3(tray.x1 - tray.x0)} height={9} rx={4} fill="#6E5140" />
          <rect x={f3(tray.x0)} y={f3(tray.y)} width={f3(tray.x1 - tray.x0)} height={2.5} rx={1.2} fill="#8C6B55" />
        </g>
      ) : null}
      {/* legs */}
      <path d={shinD(child)} transform={child ? "translate(0 0)" : undefined} fill={`url(#${uid}pt)`} />
      <path d={shoeD(child)} fill={shoe} />
      <path d={THIGH_D} transform={child ? "scale(0.82 0.9)" : undefined} fill={`url(#${uid}pt)`} />
      {/* the far arm (behind the torso and the head) */}
      {pose.farHand
        ? (() => {
            const FS = rot(sc(FAR_SHOULDER, bk), lean);
            const A = solveArm(FS, pose.farHand, RIG.upper * bk, RIG.fore * bk, 1);
            const far = mixHex(sleeve, COLOR.shadow, 0.16);
            return (
              <g>
                <path d={`M${f3(FS[0])} ${f3(FS[1])}L${f3(A.E[0])} ${f3(A.E[1])}L${f3(A.W[0])} ${f3(A.W[1])}`} stroke={far} strokeWidth={(RIG.armW - 2) * bk} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx={A.W[0]} cy={A.W[1]} r={RIG.hand * bk} fill={mixHex(spec.skin, COLOR.shadow, 0.1)} />
              </g>
            );
          })()
        : null}
      {/* torso */}
      <g transform={`rotate(${f3(lean)})${child ? " scale(0.8)" : ""}`}>
        <path d={TORSO_D} fill={`url(#${uid}tp)`} />
        {/* the collar shadow under the chin */}
        <path d="M-70 -196C-52 -186 -30 -186 -12 -198" stroke={footOf(spec.top)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
      </g>
      {/* headphones round the neck sit behind the head when off: drawn in the head group below */}
      {/* the head */}
      <g transform={headTf}>

        {/* the ponytail hangs behind the head */}
        {spec.hairStyle === "pony" ? HAIR_D.pony().slice(1).map((d, i) => <path key={`hb${i}`} d={d} fill={`url(#${uid}hr)`} />) : null}
        <path d={circleD(0, 0, R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R)} fill={`url(#${uid}sk)`} fillRule="nonzero" />
        {/* light on the face: the cream device glow, then the amber screen glow */}
        <g clipPath={`url(#${uid}hc)`}>
          {cream > 0.002 ? <rect x={-R * 1.3} y={-R * 1.2} width={R * 2.6} height={R * 2.4} fill={`url(#${uid}fl)`} /> : null}
          {amberL > 0.002 ? <rect x={-R * 1.3} y={-R * 1.2} width={R * 2.6} height={R * 2.4} fill={`url(#${uid}fa)`} /> : null}
        </g>
        {/* ear */}
        <circle cx={0.16 * R} cy={0.1 * R} r={0.15 * R} fill={mixHex(spec.skin, COLOR.shadow, 0.08)} />
        {/* blush */}
        <circle cx={-0.42 * R} cy={0.3 * R} r={0.14 * R} fill="#D9846E" opacity={0.3} />
        {/* the eye: a dot, a blink squash, or a content arc */}
        <g opacity={1 - c01(pose.content)}>
          <ellipse cx={eye[0]} cy={eye[1]} rx={0.095 * R} ry={0.095 * R * blinkK} fill={COLOR.inkDark} />
        </g>
        {pose.content > 0.001 ? (
          <path
            d={`M${f3(eye[0] - 0.13 * R)} ${f3(eye[1] + 0.02 * R)}Q${f3(eye[0])} ${f3(eye[1] - 0.13 * R)} ${f3(eye[0] + 0.13 * R)} ${f3(eye[1] + 0.02 * R)}`}
            stroke={COLOR.inkDark}
            strokeWidth={3.6}
            strokeLinecap="round"
            fill="none"
            opacity={c01(pose.content)}
          />
        ) : null}
        {/* mouth */}
        <path d={mouth} stroke={mixHex(COLOR.inkDark, spec.skin, 0.25)} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        {spec.mustache ? (
          <path
            d={`M${f3(-0.98 * R)} ${f3(0.32 * R)}C${f3(-0.92 * R)} ${f3(0.2 * R)} ${f3(-0.62 * R)} ${f3(0.2 * R)} ${f3(-0.56 * R)} ${f3(0.34 * R)}C${f3(-0.7 * R)} ${f3(0.3 * R)} ${f3(-0.86 * R)} ${f3(0.4 * R)} ${f3(-0.98 * R)} ${f3(0.32 * R)}Z`}
            fill={`url(#${uid}hr)`}
          />
        ) : null}
        {/* hair over the head */}
        {spec.hairStyle !== "pony" ? HAIR_D[spec.hairStyle]().map((d, i) => <path key={`h${i}`} d={d} fill={`url(#${uid}hr)`} />) : null}
        {spec.hairStyle === "pony" ? <path d={cropD()} fill={`url(#${uid}hr)`} /> : null}
        {spec.hairStyle === "cap" ? capD().map((d, i) => <path key={`c${i}`} d={d} fill={`url(#${uid}cp)`} />) : null}
        {spec.glasses ? (
          <g stroke={COLOR.inkDark} strokeWidth={3.4} fill="none" strokeLinecap="round">
            <circle cx={eye[0] - 0.03 * R} cy={eye[1] + 0.02 * R} r={0.24 * R} />
            <path d={`M${f3(eye[0] + 0.21 * R)} ${f3(eye[1] - 0.02 * R)}L${f3(0.02 * R)} ${f3(-0.02 * R)}`} />
          </g>
        ) : null}
        {/* headphones: cup + band */}
        {spec.headphones ? (
          <g>
            {/* a clear cream band and ear cup, each with a thin warm rim so they read over hair and skin */}
            <path d={band} stroke={mixHex(spec.headphones, COLOR.shadow, 0.45)} strokeWidth={17} fill="none" strokeLinecap="round" />
            <path d={band} stroke={spec.headphones} strokeWidth={11} fill="none" strokeLinecap="round" />
            <rect
              x={f3(cup[0] - 0.29 * R)}
              y={f3(cup[1] - 0.38 * R)}
              width={f3(0.58 * R)}
              height={f3(0.76 * R)}
              rx={f3(0.24 * R)}
              fill={spec.headphones}
              stroke={mixHex(spec.headphones, COLOR.shadow, 0.45)}
              strokeWidth={3}
            />
            <rect x={f3(cup[0] - 0.12 * R)} y={f3(cup[1] - 0.2 * R)} width={f3(0.24 * R)} height={f3(0.4 * R)} rx={f3(0.1 * R)} fill={mixHex(spec.headphones, COLOR.shadow, 0.2)} />
          </g>
        ) : null}
      </g>
      {/* the laptop on its tray */}
      {lap ? <LaptopProp lap={lap} /> : null}
      {/* the armrest (world coords) sits over the body, under the near arm */}
      {between ? <g transform={`translate(${f3(-x)} ${f3(-y)})`}>{between}</g> : null}
      {/* the near arm: sleeve (upper .. forearm), hand */}
      <path
        d={`M${f3(S[0])} ${f3(S[1])}L${f3(E[0])} ${f3(E[1])}`}
        stroke={sleeve}
        strokeWidth={RIG.armW * bk}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${f3(E[0])} ${f3(E[1])}L${f3(W[0])} ${f3(W[1])}`}
        stroke={spec.shortSleeve ? spec.skin : sleeve}
        strokeWidth={(spec.shortSleeve ? 26 : RIG.armW - 2) * bk}
        strokeLinecap="round"
        fill="none"
      />
      {spec.shortSleeve ? <circle cx={E[0]} cy={E[1]} r={(RIG.armW / 2) * bk} fill={sleeve} /> : null}
      {/* the phone (held or resting) */}
      {phone ? <PhoneProp at={phoneAt} angle={phoneRot} glow={phone.glow} uid={uid} /> : null}
      <circle cx={W[0]} cy={W[1]} r={RIG.hand * bk} fill={mixHex(mixHex(spec.skin, COLOR.shadow, 0.08), "#FFF4DF", 0.2 * cream)} />
      {/* the device's cream light: a soft pool over the face, the hands and the device (light, not an object) */}
      {cream > 0.002 ? (
        <ellipse
          cx={f3(lap ? lap.hinge[0] + 70 : (phoneAt[0] + headC[0]) / 2 - 6)}
          cy={f3(lap ? lap.hinge[1] - 70 : (phoneAt[1] + headC[1]) / 2 + 6)}
          rx={lap ? 140 : 128}
          ry={lap ? 118 : 122}
          fill={`url(#${uid}cl)`}
          opacity={f3(0.4 * cream)}
          style={{ mixBlendMode: "screen" }}
        />
      ) : null}
      {/* keep `neck` and `headC` referenced for callers that pin props to them */}
      <g data-neck={`${f3(neck[0])},${f3(neck[1])}`} data-head={`${f3(headC[0])},${f3(headC[1])}`} />
    </g>
  );
};

/** a phone in profile: a slim slab, its screen side (toward the face) lit cream with a soft halo */
const PhoneProp: React.FC<{ at: P2; angle: number; glow: number; uid: string }> = ({ at, angle, glow, uid }) => {
  const g = c01(glow);
  return (
    <g transform={`translate(${f3(at[0])} ${f3(at[1])}) rotate(${f3(angle)})`}>
      {g > 0.002 ? <ellipse cx={16} cy={-4} rx={56} ry={60} fill={`url(#${uid}cl)`} opacity={g} style={{ mixBlendMode: "screen" }} /> : null}
      <rect x={-9} y={-40} width={19} height={70} rx={6} fill="#4B392D" />
      <rect x={2} y={-37} width={8} height={64} rx={4} fill={mixHex("#6A5446", "#FFFBF2", g)} />
    </g>
  );
};

/** a laptop on the tray: base slab from the hinge (left) to the right, the lid opening up-left; its inner face lit */
const LaptopProp: React.FC<{ lap: Laptop }> = ({ lap }) => {
  const [hx, hy] = lap.hinge;
  const th = lap.lid * D2R;
  const dir: P2 = [Math.cos(th), -Math.sin(th)];
  const nrm: P2 = [Math.sin(th), Math.cos(th)]; // the screen side's normal (faces right when open)
  const L = lap.len * 0.86;
  const tip: P2 = [hx + dir[0] * L, hy - 8 + dir[1] * L];
  const g = c01(lap.glow);
  const t = 12;
  const lid = [
    [hx, hy - 8],
    [tip[0], tip[1]],
    [tip[0] - nrm[0] * t, tip[1] - nrm[1] * t],
    [hx - nrm[0] * t, hy - 8 - nrm[1] * t],
  ] as P2[];
  return (
    <g>
      {g > 0.002 ? (
        <ellipse cx={f3(hx + dir[0] * L * 0.5 + 30)} cy={f3(hy - 8 + dir[1] * L * 0.5)} rx={48} ry={50} fill="#FFF6E4" opacity={0.55 * g} style={{ filter: "blur(12px)", mixBlendMode: "screen" }} />
      ) : null}
      <rect x={f3(hx)} y={f3(hy - 9)} width={f3(lap.len)} height={9} rx={3} fill="#9A8574" />
      <path d={ptsD(lid) + "Z"} fill="#8A7464" />
      {/* the screen's lit face (on the side facing the user) */}
      <path
        d={`M${f3(hx + nrm[0] * 1 + dir[0] * 6)} ${f3(hy - 8 + nrm[1] * 1 + dir[1] * 6)}L${f3(tip[0] + nrm[0] * 1 - dir[0] * 4)} ${f3(tip[1] + nrm[1] * 1 - dir[1] * 4)}`}
        stroke={mixHex("#6E5A4B", "#FFFBF2", g)}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </g>
  );
};
