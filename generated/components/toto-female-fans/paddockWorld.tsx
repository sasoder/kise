// ===========================================================================
// paddockWorld — THE PADDOCK of the Cheeky Pint S4E01 clip "toto - 42 percent of f1 fans are women" (cut 10
// TwelveMonthShow, cut 34 ShowAroundTheSport). Picture-book world on the circuit of trackWorld.tsx (imported: the
// golden-hour sky, trees, grandstand, fences, tyre wall, kerbs and asphalt, its side-view projection and camera):
// a paddock "street" of team units (2-storey motorhomes and garage backs, cream/oat card, team-neutral, no logos),
// a bunting rope with one cream pennant per month (JAN..DEC, Kräftig caps in ink), and in front of every month one
// small off-track drama played by picture-book card people (cabinCast's grammar: big round head with a nose bump,
// dot eye, blush, flat matte fills, top-lit) and filmed by a TV crew whose camera's tally light is AMBER (the
// audience watching: the only amber in the world). The F1 car is a filled cream card on champShared's approved
// side-profile proportions (F1Outline).
//
//   PADDOCK / SLOT_X / slotX(s)     the street's layout (depths in world px, the 12 month slots along x)
//   paddockCam(...)                 a camera framed on the street lane -> trackWorld's TrackCam
//   PaddockFloor, PaddockFence, PaddockUnits, Bunting    the set (each in its own lane, drawn in depth order)
//   Vignette (MONTH_DRAMAS)         month i's drama and its crew, on the street lane (world coords, slot-centred)
//   Person, ShoulderCam, BoomPole   the card people and the crew's kit (Person faces left by default, face 1 = right)
//   F1Card                          the filled card F1 car (x = the cockpit's ground point, like F1Outline)
//   SnowFall                        flakes falling in front of the winter units
//
// UNITS. World px, M = 400 px / m (champShared), x along the street (and the track), y down (0 = the ground),
// depth z from the track's subject lane (trackWorld: + = farther). A person is drawn in figure units (u) and
// scaled by FS so a standing adult is ~1.8 m (720 world px); props attached to a person are in its hip frame.
// Geometry restated from cabinCast (not exported there): the torso bean and the hair shapes.
// ===========================================================================
import React, { useId } from "react";
import { COLOR, FONT_LABEL, bloomFilter, clamp01, labelWidth, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { CLOTH, HAIR, RIG, SKIN, solveArm, type HairStyle } from "../scott-free-wifi/cabinCast";
import { M } from "../toto-champion-eight/champShared";
import { OnLane, TRACK_COLOR, laneK, type TrackCam } from "../toto-champion-eight/trackWorld";

export type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const D2R = Math.PI / 180;
const uidOf = (raw: string) => `pd${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const rot = (p: P2, deg: number, o: P2 = [0, 0]): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
const LIGHT_TINT = "#FFF4E2";
export const topOf = (c: string) => mixHex(c, LIGHT_TINT, 0.12);
export const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.14);
const farOf = (c: string) => mixHex(c, COLOR.shadow, 0.2);
export { CLOTH, HAIR, SKIN };

// ---------------------------------------------------------------------------
// LAYOUT
// ---------------------------------------------------------------------------
export const PADDOCK = {
  /** the actors' lane (the street) */
  street: -19.0 * M,
  /** the walking crew's lane, nearer the camera (the foreground) */
  crew: -20.3 * M,
  /** the units' faces */
  homes: -17.5 * M,
  /** the mesh fence between the paddock and the track (seen only down the alleys) */
  fence: -8.2 * M,
  /** the street curves gently into depth: its ends lie this much farther than its middle (a parabola) */
  curve: 1.2 * M,
  /** the bunting rope's height on the units' faces, its sag between hooks */
  rope: 4.0 * M,
  sag: 0.22 * M,
} as const;
/** one month's stretch of street (world px); MAR (the opening's close) is wider so its neighbours sit off the close */
export const W = 760;
export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;
/** each month's width (x W): just its drama and its crew */
export const SLOT_F = [0.82, 0.66, 1.05, 0.6, 0.62, 0.5, 0.8, 0.66, 0.68, 0.66, 0.7, 0.52] as const;
const SLOT_W = SLOT_F.map((f) => f * W);
/** slot centres (world x), the whole year centred on x = 0 */
export const SLOT_X: number[] = (() => {
  const total = SLOT_W.reduce((a, b) => a + b, 0);
  const out: number[] = [];
  let x = -total / 2;
  for (const w of SLOT_W) {
    out.push(x + w / 2);
    x += w;
  }
  return out;
})();
export const STREET_X0 = SLOT_X[0] - SLOT_W[0] / 2;
export const STREET_X1 = SLOT_X[11] + SLOT_W[11] / 2;
const CURVE_X = Math.max(-STREET_X0, STREET_X1);
/** how much farther than the middle the street lies at x (the gentle curve into depth) */
export const curveDz = (x: number, curve: number = PADDOCK.curve) => curve * Math.pow(x / CURVE_X, 2);
/** continuous slot coordinate -> world x (s = i is slot i's centre, i +- 0.5 its edges) */
export const slotX = (s: number) => {
  const i = Math.max(0, Math.min(11, Math.round(s)));
  return SLOT_X[i] + (s - i) * SLOT_W[i];
};

// ---------------------------------------------------------------------------
// THE CAMERA, framed on the street: scale ks on the street lane, distance Ds to it, the eye's height, and the
// street's ground line on screen (gy). trackWorld's TrackCam is defined on its subject lane z = 0 (the track).
// ---------------------------------------------------------------------------
export type StreetCam = { x: number; ks: number; Ds: number; eye: number; gy: number; dx?: number; dy?: number; lane?: number };
export const paddockCam = (c: StreetCam): TrackCam => {
  const zs = c.lane ?? PADDOCK.street;
  const D = c.Ds - zs;
  const k = (c.ks * c.Ds) / D;
  const hor = c.gy - c.eye * c.ks;
  return { x: c.x, k, D, eye: c.eye, groundY: hor + c.eye * k, dx: c.dx, dy: c.dy };
};

// ---------------------------------------------------------------------------
// PEOPLE — cabinCast's card figure, standing / walking. Hip frame: cabinCast's (the hip at the back of the bean,
// y down, the figure facing LEFT: forward = -x). The feet stand HIP_H below the hip.
// ---------------------------------------------------------------------------
export const FS = 1.42;
const HIP_H = 175;
/** the feet's centre in the hip frame */
const FEET_X = -40;
const R = RIG.R;
const TORSO_D = "M14 6C22 -56 22 -132 6 -176C-4 -204 -50 -212 -74 -196C-98 -178 -100 -126 -94 -76C-90 -34 -80 -2 -58 6Z";
const polar = (r: number, deg: number): P2 => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
const arcPts = (r: number, a0: number, a1: number, n = 24) => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) out.push(polar(r, lerp(a0, a1, i / n)));
  return out;
};
const ptsD = (pts: P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${f3(p[0])} ${f3(p[1])}`).join("");
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;
const cropD = () =>
  ptsD(arcPts(R * 1.07, 212, 402)) +
  `C${f3(0.62 * R)} ${f3(0.42 * R)} ${f3(0.3 * R)} ${f3(0.3 * R)} ${f3(0.22 * R)} ${f3(0.05 * R)}` +
  `C${f3(0.12 * R)} ${f3(-0.28 * R)} ${f3(-0.3 * R)} ${f3(-0.42 * R)} ${f3(-0.66 * R)} ${f3(-0.5 * R)}Z`;
const bobD = () =>
  ptsD(arcPts(R * 1.12, 196, 432)) +
  `C${f3(0.9 * R)} ${f3(1.06 * R)} ${f3(0.5 * R)} ${f3(1.04 * R)} ${f3(0.22 * R)} ${f3(0.86 * R)}` +
  `C${f3(0.08 * R)} ${f3(0.5 * R)} ${f3(0.06 * R)} ${f3(0.0 * R)} ${f3(-0.12 * R)} ${f3(-0.34 * R)}` +
  `C${f3(-0.4 * R)} ${f3(-0.46 * R)} ${f3(-0.7 * R)} ${f3(-0.4 * R)} ${f3(-0.98 * R)} ${f3(-0.3 * R)}Z`;
const ponyTailD = () =>
  `M${f3(0.78 * R)} ${f3(-0.62 * R)}C${f3(1.5 * R)} ${f3(-0.5 * R)} ${f3(1.62 * R)} ${f3(0.25 * R)} ${f3(1.32 * R)} ${f3(0.86 * R)}` +
  `C${f3(1.26 * R)} ${f3(0.4 * R)} ${f3(1.12 * R)} ${f3(-0.1 * R)} ${f3(0.86 * R)} ${f3(-0.2 * R)}Z`;
const HAIR_FRONT: Record<HairStyle, () => string[]> = {
  crop: () => [cropD()],
  bob: () => [bobD()],
  bun: () => [cropD(), circleD(0.6 * R, -0.86 * R, 0.36 * R)],
  curly: () => [cropD(), ...[214, 238, 262, 286, 310, 334, 358, 382].map((a) => circleD(...polar(1.0 * R, a), 0.27 * R))],
  pony: () => [cropD()],
  cap: () => [ptsD(arcPts(R * 1.05, 300, 400)) + `C${f3(0.6 * R)} ${f3(0.3 * R)} ${f3(0.4 * R)} ${f3(0.1 * R)} ${f3(0.42 * R)} ${f3(-0.3 * R)}Z`],
  bald: () => [],
};
const capD = () => [
  ptsD(arcPts(R * 1.09, 196, 352)) + `C${f3(0.4 * R)} ${f3(-0.22 * R)} ${f3(-0.5 * R)} ${f3(-0.36 * R)} ${f3(-1.05 * R)} ${f3(-0.3 * R)}Z`,
  `M${f3(-0.7 * R)} ${f3(-0.42 * R)}L${f3(-1.62 * R)} ${f3(-0.36 * R)}C${f3(-1.72 * R)} ${f3(-0.35 * R)} ${f3(-1.72 * R)} ${f3(-0.2 * R)} ${f3(-1.6 * R)} ${f3(-0.2 * R)}L${f3(-0.7 * R)} ${f3(-0.22 * R)}Z`,
];

export type FigSpec = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  pants: string;
  shoe?: string;
  cap?: string;
  /** a race suit: top = pants, a cream side stripe */
  suit?: boolean;
  stripe?: string;
  /** a team boss's headset (colour) */
  headset?: string;
  glasses?: boolean;
  mustache?: boolean;
  /** a winter scarf (colour) */
  scarf?: string;
};
export type Fingers = "point" | "cross" | "fist" | "open";
export type PersonPose = {
  /** +1 faces right (the drawing is mirrored), -1 faces left */
  face: 1 | -1;
  /** deg, + = back (cabinCast) */
  lean?: number;
  tilt?: number;
  /** the near hand / far hand in the hip frame (forward = -x); undefined = hanging (or swinging when walking) */
  hand?: P2;
  farHand?: P2;
  fold?: boolean;
  /** walking: the gait phase (rad) and the stride (0 standing .. 1 a full stride) */
  walk?: number;
  stride?: number;
  shout?: number;
  brow?: number;
  blink?: number;
  smile?: number;
  fingers?: Fingers;
  farFingers?: Fingers;
  /** drawn at the near / far hand (hand frame: origin at the hand, hip-frame axes), in front of / behind the arm */
  hold?: (W: P2) => React.ReactNode;
  holdBehind?: (W: P2) => React.ReactNode;
  holdFar?: (W: P2) => React.ReactNode;
  /** drawn over the head (hip frame, leaned), under the near arm: the shoulder camera */
  front?: React.ReactNode;
  /** a squash of the drawing's width (1 = none) for a card turning round: never 0 */
  turn?: number;
  /** hide the legs (behind a table) */
  noLegs?: boolean;
};

const fingerD = (W: P2, E: P2, kind: Fingers, scale = 1) => {
  const dx = W[0] - E[0];
  const dy = W[1] - E[1];
  const d = Math.hypot(dx, dy) || 1;
  const u: P2 = [dx / d, dy / d];
  if (kind === "point") return [[W, [W[0] + u[0] * 30 * scale, W[1] + u[1] * 30 * scale]] as [P2, P2]];
  if (kind === "cross") {
    const a: P2 = [W[0] - 6, W[1] - 4];
    return [
      [a, [a[0] + 12 * scale, a[1] - 30 * scale]] as [P2, P2],
      [[a[0] + 12, a[1]] as P2, [a[0] - 2 * scale, a[1] - 30 * scale]] as [P2, P2],
    ];
  }
  return [];
};

/** a standing / walking card person; x, y = the feet (world), k = the lane's screen scale (for the bloom) */
export const Person: React.FC<{ x: number; y: number; spec: FigSpec; pose: PersonPose; k: number; scale?: number }> = ({ x, y, spec, pose, k, scale = 1 }) => {
  const uid = uidOf(useId());
  const lean = pose.lean ?? 0;
  const tilt = pose.tilt ?? 0;
  const stride = clamp01(pose.stride ?? 0);
  const ph = pose.walk ?? 0;
  const walking = stride > 0.001;
  // the gait: straight legs swinging +-A; the stance foot planted (the body drops), the swing foot lifted
  const A = 0.4 * stride;
  const LEG = 160;
  const th = A * Math.sin(ph);
  const drop = walking ? LEG * (1 - Math.cos(th)) : 0;
  const bob = drop;
  const jN: P2 = [-30, -2];
  const jF: P2 = [-50, -2];
  const liftN = 18 * stride * Math.max(0, Math.cos(ph));
  const liftF = 18 * stride * Math.max(0, -Math.cos(ph));
  const ankle = (j: P2, a: number, lift: number): P2 => [j[0] - (LEG - lift) * Math.sin(a), j[1] + bob + (LEG - lift) * Math.cos(a)];
  const aN = ankle(jN, th, liftN);
  const aF = ankle(jF, -th, liftF);
  const S = rot(RIG.shoulder, lean);
  const FSH = rot([-22, -186], lean);
  // hands: given, or hanging / swinging with the gait (opposite to the legs)
  const swing = walking ? 0.5 * Math.sin(ph) * stride : 0;
  const hangN: P2 = [S[0] - 150 * Math.sin(-0.08 + swing), S[1] + 150 * Math.cos(swing) + 20];
  const hangF: P2 = [FSH[0] - 150 * Math.sin(-0.02 - swing), FSH[1] + 150 * Math.cos(swing) + 20];
  const handN = pose.hand ?? hangN;
  const handF = pose.farHand ?? hangF;
  const armN = solveArm(S, handN, RIG.upper, RIG.fore, -1);
  const armF = solveArm(FSH, handF, RIG.upper, RIG.fore, -1);
  const pants = spec.pants;
  const shoe = spec.shoe ?? "#4A3326";
  const sleeve = spec.top;
  const headC0: P2 = [RIG.head[0], RIG.head[1]];
  const headTf = `rotate(${f3(lean)}) rotate(${f3(tilt)} ${f3(RIG.neck[0])} ${f3(RIG.neck[1])}) translate(${f3(headC0[0])} ${f3(headC0[1])})`;
  const eye: P2 = [-0.5 * R, -0.08 * R];
  const blinkK = 1 - 0.85 * clamp01(pose.blink ?? 0);
  const smile = clamp01(pose.smile ?? 0);
  const shout = clamp01(pose.shout ?? 0);
  const brow = clamp01(pose.brow ?? 0);
  const mouth = `M${f3(-0.88 * R)} ${f3(0.44 * R - 1)}Q${f3(-0.75 * R)} ${f3(0.44 * R + 1 + 7 * smile - 6 * brow * (1 - smile))} ${f3(-0.6 * R)} ${f3(0.44 * R - 2 - 3 * smile)}`;
  const sx = (pose.face === 1 ? -1 : 1) * FS * scale * (pose.turn ?? 1);
  const leg = (j: P2, a: P2, col: string, key: string) => (
    <g key={key}>
      <path d={`M${f3(j[0])} ${f3(j[1] + bob)}L${f3(a[0])} ${f3(a[1])}`} stroke={col} strokeWidth={40} strokeLinecap="round" fill="none" />
      {spec.suit ? <path d={`M${f3(j[0] + 12)} ${f3(j[1] + bob)}L${f3(a[0] + 12)} ${f3(a[1] - 4)}`} stroke={spec.stripe ?? COLOR.cream} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.9} /> : null}
      <path
        d={`M${f3(a[0] + 16)} ${f3(a[1] + 17)}L${f3(a[0] - 34)} ${f3(a[1] + 17)}C${f3(a[0] - 44)} ${f3(a[1] + 17)} ${f3(a[0] - 44)} ${f3(a[1] + 2)} ${f3(a[0] - 30)} ${f3(a[1] - 2)}L${f3(a[0] - 10)} ${f3(a[1] - 6)}C${f3(a[0] + 4)} ${f3(a[1] - 8)} ${f3(a[0] + 16)} ${f3(a[1] - 6)} ${f3(a[0] + 16)} ${f3(a[1] + 4)}Z`}
        fill={key === "lf" ? farOf(shoe) : shoe}
      />
    </g>
  );
  const fingers = (W: P2, E: P2, kind: Fingers | undefined, skin: string) =>
    kind && kind !== "fist" && kind !== "open"
      ? fingerD(W, E, kind).map(([a, b], i) => <path key={i} d={`M${f3(a[0])} ${f3(a[1])}L${f3(b[0])} ${f3(b[1])}`} stroke={skin} strokeWidth={11} strokeLinecap="round" fill="none" />)
      : null;
  const skinHand = mixHex(spec.skin, COLOR.shadow, 0.08);
  const farSleeve = farOf(sleeve);
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(sx)} ${fx(FS * scale)}) translate(${-FEET_X} ${-HIP_H})`}>
      <defs>
        <linearGradient id={`${uid}sk`} gradientUnits="userSpaceOnUse" x1="0" y1={-60} x2="0" y2={60}>
          <stop offset="0" stopColor={topOf(spec.skin)} />
          <stop offset="1" stopColor={footOf(spec.skin)} />
        </linearGradient>
        <linearGradient id={`${uid}hr`} gradientUnits="userSpaceOnUse" x1="0" y1={-70} x2="0" y2={70}>
          <stop offset="0" stopColor={topOf(spec.hair)} />
          <stop offset="1" stopColor={footOf(spec.hair)} />
        </linearGradient>
        <linearGradient id={`${uid}tp`} gradientUnits="userSpaceOnUse" x1="0" y1={-210} x2="0" y2={10}>
          <stop offset="0" stopColor={topOf(spec.top)} />
          <stop offset="1" stopColor={footOf(spec.top)} />
        </linearGradient>
      </defs>
      {/* the contact shadow (the key light is up-left: it falls a little right) */}
      {pose.noLegs ? null : <ellipse cx={FEET_X + 14} cy={HIP_H + 2} rx={78} ry={11} fill={COLOR.shadow} opacity={0.22} />}
      {/* the far arm and what it holds (behind the body) */}
      {pose.fold ? null : (
        <g>
          <path d={`M${f3(FSH[0])} ${f3(FSH[1] + bob)}L${f3(armF.E[0])} ${f3(armF.E[1] + bob)}L${f3(armF.W[0])} ${f3(armF.W[1] + bob)}`} stroke={farSleeve} strokeWidth={RIG.armW - 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {pose.holdFar ? <g transform={`translate(0 ${f3(bob)})`}>{pose.holdFar(armF.W)}</g> : null}
          <g transform={`translate(0 ${f3(bob)})`}>{fingers(armF.W, armF.E, pose.farFingers, farOf(spec.skin))}</g>
          <circle cx={armF.W[0]} cy={armF.W[1] + bob} r={RIG.hand} fill={farOf(spec.skin)} />
        </g>
      )}
      {/* legs */}
      {pose.noLegs ? null : leg(jF, aF, farOf(pants), "lf")}
      {pose.noLegs ? null : leg(jN, aN, pants, "ln")}
      <g transform={`translate(0 ${f3(bob)})`}>
        {/* torso */}
        <g transform={`rotate(${f3(lean)})`}>
          <path d={TORSO_D} fill={`url(#${uid}tp)`} />
          {spec.suit ? <path d="M10 2C16 -60 16 -130 2 -172" stroke={spec.stripe ?? COLOR.cream} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.9} /> : null}
          <path d="M-70 -196C-52 -186 -30 -186 -12 -198" stroke={footOf(spec.top)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
          {spec.scarf ? <path d="M-78 -192C-56 -176 -20 -176 0 -196L0 -176C-20 -160 -56 -160 -78 -172Z M-60 -178L-66 -120L-48 -120L-44 -176Z" fill={spec.scarf} /> : null}
        </g>
        {/* the head */}
        <g transform={headTf}>
          {spec.hairStyle === "pony" ? <path d={ponyTailD()} fill={`url(#${uid}hr)`} /> : null}
          <path d={circleD(0, 0, R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R)} fill={`url(#${uid}sk)`} />
          <circle cx={0.16 * R} cy={0.1 * R} r={0.15 * R} fill={mixHex(spec.skin, COLOR.shadow, 0.08)} />
          <circle cx={-0.42 * R} cy={0.3 * R} r={0.14 * R} fill="#D9846E" opacity={0.3} />
          <ellipse cx={eye[0]} cy={eye[1]} rx={0.1 * R} ry={0.1 * R * blinkK} fill={COLOR.inkDark} />
          {brow > 0.01 ? (
            <path
              d={`M${f3(eye[0] - 0.2 * R)} ${f3(eye[1] - 0.17 * R)}L${f3(eye[0] + 0.17 * R)} ${f3(eye[1] - 0.17 * R - 0.16 * R * brow)}`}
              stroke={COLOR.inkDark}
              strokeWidth={4.5}
              strokeLinecap="round"
            />
          ) : null}
          {shout > 0.02 ? (
            <ellipse cx={-0.76 * R} cy={0.47 * R} rx={0.13 * R} ry={0.05 * R + 0.1 * R * shout} fill={mixHex(COLOR.inkDark, "#8A4A3A", 0.35)} />
          ) : (
            <path d={mouth} stroke={mixHex(COLOR.inkDark, spec.skin, 0.25)} strokeWidth={3.4} strokeLinecap="round" fill="none" />
          )}
          {spec.mustache ? (
            <path
              d={`M${f3(-0.98 * R)} ${f3(0.32 * R)}C${f3(-0.92 * R)} ${f3(0.2 * R)} ${f3(-0.62 * R)} ${f3(0.2 * R)} ${f3(-0.56 * R)} ${f3(0.34 * R)}C${f3(-0.7 * R)} ${f3(0.3 * R)} ${f3(-0.86 * R)} ${f3(0.4 * R)} ${f3(-0.98 * R)} ${f3(0.32 * R)}Z`}
              fill={`url(#${uid}hr)`}
            />
          ) : null}
          {HAIR_FRONT[spec.hairStyle]().map((d, i) => (
            <path key={`h${i}`} d={d} fill={`url(#${uid}hr)`} />
          ))}
          {spec.hairStyle === "cap" ? capD().map((d, i) => <path key={`c${i}`} d={d} fill={spec.cap ?? spec.top} />) : null}
          {spec.glasses ? (
            <g stroke={COLOR.inkDark} strokeWidth={3.4} fill="none" strokeLinecap="round">
              <circle cx={eye[0] - 0.03 * R} cy={eye[1] + 0.02 * R} r={0.24 * R} />
              <path d={`M${f3(eye[0] + 0.21 * R)} ${f3(eye[1] - 0.02 * R)}L${f3(0.02 * R)} ${f3(-0.02 * R)}`} />
            </g>
          ) : null}
          {spec.headset ? (
            <g>
              <path d={`M${f3(0.14 * R)} ${f3(-0.1 * R)}Q${f3(0.3 * R)} ${f3(-0.75 * R)} ${f3(0.0 * R)} ${f3(-1.1 * R)}`} stroke={spec.headset} strokeWidth={0.15 * R} fill="none" strokeLinecap="round" />
              <path d={`M${f3(0.02 * R)} ${f3(0.32 * R)}Q${f3(-0.4 * R)} ${f3(0.72 * R)} ${f3(-0.82 * R)} ${f3(0.56 * R)}`} stroke={spec.headset} strokeWidth={0.07 * R} fill="none" strokeLinecap="round" />
              <circle cx={-0.84 * R} cy={0.55 * R} r={0.08 * R} fill={spec.headset} />
              <rect x={-0.08 * R} y={-0.22 * R} width={0.46 * R} height={0.62 * R} rx={0.2 * R} fill={spec.headset} />
              <rect x={0.02 * R} y={-0.12 * R} width={0.2 * R} height={0.4 * R} rx={0.09 * R} fill={mixHex(spec.headset, LIGHT_TINT, 0.18)} />
            </g>
          ) : null}
        </g>
        {/* the shoulder camera (over the face) */}
        {pose.front ? <g transform={`rotate(${f3(lean)})`}>{pose.front}</g> : null}
        {/* the near arm: folded across the chest, or reaching for its hand target */}
        {pose.fold ? (
          <g transform={`rotate(${f3(lean)})`}>
            <path d="M-86 -122L-2 -104" stroke={farSleeve} strokeWidth={RIG.armW - 2} strokeLinecap="round" fill="none" />
            <circle cx={-2} cy={-104} r={RIG.hand} fill={farOf(spec.skin)} />
            <path d="M-40 -178L-74 -98L8 -124" stroke={sleeve} strokeWidth={RIG.armW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx={10} cy={-125} r={RIG.hand} fill={skinHand} />
          </g>
        ) : (
          <g>
            {pose.holdBehind ? pose.holdBehind(armN.W) : null}
            <path d={`M${f3(S[0])} ${f3(S[1])}L${f3(armN.E[0])} ${f3(armN.E[1])}L${f3(armN.W[0])} ${f3(armN.W[1])}`} stroke={sleeve} strokeWidth={RIG.armW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {fingers(armN.W, armN.E, pose.fingers, skinHand)}
            {pose.hold ? pose.hold(armN.W) : null}
            <circle cx={armN.W[0]} cy={armN.W[1]} r={RIG.hand + (pose.fingers === "fist" ? 3 : 0)} fill={skinHand} />
          </g>
        )}
      </g>
      {/* keep k referenced for props that bloom */}
      <g data-k={f3(k)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CREW'S KIT
// ---------------------------------------------------------------------------
const CAM_BODY = "#5E4535";
const CAM_DARK = "#4A3326";
const CAM_RING = mixHex(COLOR.board, COLOR.cream, 0.4);
/** the amber tally: always on (the audience watching). r_screen: its minimum radius in screen px */
export const Tally: React.FC<{ cx: number; cy: number; r: number; kScreen: number; minScreen?: number }> = ({ cx, cy, r, kScreen, minScreen = 4.2 }) => {
  const uid = uidOf(useId());
  const rr = Math.max(r, minScreen / kScreen);
  return (
    <g style={{ filter: bloomFilter(kScreen) }}>
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(cy - rr)} x2="0" y2={f3(cy + rr)}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
      </defs>
      <circle cx={f3(cx)} cy={f3(cy)} r={f3(rr)} fill={`url(#${uid}a)`} />
      <path d={`M${f3(cx - rr * 0.55)} ${f3(cy - rr * 0.55)}A${f3(rr * 0.78)} ${f3(rr * 0.78)} 0 0 1 ${f3(cx + rr * 0.55)} ${f3(cy - rr * 0.55)}`} stroke={COLOR.amberHot} strokeWidth={f3(Math.max(rr * 0.22, 1.2 / kScreen))} fill="none" strokeLinecap="round" />
    </g>
  );
};
/** the shoulder camera in the hip frame (facing left): body on the shoulder, the eyepiece at the eye, the lens
 *  forward, the tally on the front top. kScreen = screen px per figure unit */
export const ShoulderCam: React.FC<{ kScreen: number; aim?: number; size?: number }> = ({ kScreen, aim = 0, size = 1 }) => (
  <g transform={`rotate(${f3(aim)} -70 -230) translate(-70 -230) scale(${fx(size)}) translate(70 230)`}>
    <rect x={-92} y={-300} width={34} height={30} rx={8} fill={CAM_DARK} />
    <rect x={-182} y={-272} width={150} height={78} rx={14} fill={CAM_BODY} />
    <rect x={-182} y={-272} width={150} height={12} rx={6} fill={mixHex(CAM_BODY, LIGHT_TINT, 0.22)} />
    <rect x={-160} y={-290} width={70} height={10} rx={5} fill={CAM_DARK} />
    <rect x={-150} y={-284} width={8} height={14} fill={CAM_DARK} />
    <rect x={-104} y={-284} width={8} height={14} fill={CAM_DARK} />
    <rect x={-246} y={-258} width={66} height={52} rx={8} fill={CAM_DARK} />
    <rect x={-262} y={-266} width={18} height={68} rx={6} fill={CAM_BODY} />
    <rect x={-236} y={-258} width={8} height={52} fill={CAM_RING} opacity={0.75} />
    <rect x={-214} y={-302} width={64} height={18} rx={9} fill={mixHex(HAIR.grey, COLOR.board, 0.3)} />
    <Tally cx={-170} cy={-254} r={14} kScreen={kScreen * size} />
  </g>
);
/** a point of the shoulder camera's drawing scaled by `size` about the shoulder pivot (-70, -230) */
const camPt = (p: P2, size: number): P2 => [-70 + (p[0] + 70) * size, -230 + (p[1] + 230) * size];
/** a boom pole from (bx, by) toward angle `ang` (deg below the forward horizontal, negative = up), length L; the
 *  furry mic hangs at the tip (hip frame, facing left) */
export const BoomPole: React.FC<{ b: P2; ang: number; L: number }> = ({ b, ang, L }) => {
  const d: P2 = [-Math.cos(ang * D2R), Math.sin(ang * D2R)];
  const tip: P2 = [b[0] + d[0] * L, b[1] + d[1] * L];
  const fur = mixHex(HAIR.grey, COLOR.board, 0.2);
  return (
    <g>
      <path d={`M${f3(b[0])} ${f3(b[1])}L${f3(tip[0])} ${f3(tip[1])}`} stroke={mixHex(COLOR.board, COLOR.inkDark, 0.35)} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${f3(tip[0])} ${f3(tip[1])}L${f3(tip[0])} ${f3(tip[1] + 26)}`} stroke={CAM_DARK} strokeWidth={8} />
      <rect x={f3(tip[0] - 62)} y={f3(tip[1] + 22)} width={124} height={44} rx={22} fill={fur} />
      {[-44, -22, 0, 22, 44].map((u, i) => (
        <circle key={i} cx={f3(tip[0] + u)} cy={f3(tip[1] + 22)} r={9} fill={fur} />
      ))}
    </g>
  );
};
/** the pole's point at fraction t from its butt (to place the hands) */
export const boomAt = (b: P2, ang: number, L: number, t: number): P2 => [b[0] - Math.cos(ang * D2R) * L * t, b[1] + Math.sin(ang * D2R) * L * t];

/** a TV camera on a tripod (world px, feet centre x, y 0 = the ground), its lens toward `face` (+1 right, -1 left);
 *  the shoulder camera's drawing on a fluid head and three legs. k = the lane's screen scale */
export const TripodCam: React.FC<{ x: number; face: 1 | -1; k: number; pan?: number; h?: number }> = ({ x, face, k, pan = 0, h = 1.42 * M }) => {
  const leg = mixHex(COLOR.board, COLOR.inkDark, 0.45);
  const spread = 0.42 * M;
  return (
    <g>
      <ellipse cx={x + 20} cy={2} rx={spread * 1.2} ry={12} fill={COLOR.shadow} opacity={0.2} />
      <path d={`M${f3(x)} ${f3(-h)}L${f3(x - spread)} 0M${f3(x)} ${f3(-h)}L${f3(x + spread)} 0`} stroke={leg} strokeWidth={22} strokeLinecap="round" />
      <path d={`M${f3(x)} ${f3(-h)}L${f3(x + spread * 0.25)} 0`} stroke={mixHex(leg, COLOR.shadow, 0.25)} strokeWidth={18} strokeLinecap="round" />
      <rect x={x - 46} y={-h - 40} width={92} height={50} rx={14} fill={CAM_DARK} />
      <g transform={`translate(${fx(x)} ${fx(-h - 40)}) scale(${fx(-face * FS)} ${fx(FS)}) rotate(${f3(pan)} 0 0) translate(100 194)`}>
        <ShoulderCam kScreen={k * FS} />
        <path d="M-20 -200L70 -170" stroke={CAM_DARK} strokeWidth={12} strokeLinecap="round" />
      </g>
    </g>
  );
};
/** a flight case a crew stands on to film over the actors' heads (world px, feet centre x, top at -h) */
export const FlightCase: React.FC<{ x: number; w?: number; h?: number }> = ({ x, w = 300, h = 0.45 * M }) => (
  <g>
    <ellipse cx={x + 16} cy={2} rx={w * 0.6} ry={12} fill={COLOR.shadow} opacity={0.2} />
    <rect x={x - w / 2} y={-h} width={w} height={h} rx={12} fill="#6E5A4B" />
    <rect x={x - w / 2} y={-h} width={w} height={16} rx={8} fill="#8C7666" />
    {[-0.36, 0.36].map((u, i) => (
      <rect key={i} x={x + u * w - 14} y={-h} width={28} height={h} fill={mixHex("#6E5A4B", COLOR.cream, 0.35)} />
    ))}
  </g>
);
/** a camera operator (hip frame facing left; face 1 turns them right) */
export const CameraOp: React.FC<{ x: number; y: number; spec: FigSpec; face: 1 | -1; k: number; walk?: number; stride?: number; aim?: number; blink?: number; scale?: number; turn?: number; camSize?: number; lean?: number }> = ({
  x,
  y,
  spec,
  face,
  k,
  walk,
  stride,
  aim = 0,
  blink,
  scale = 1,
  turn,
  camSize = 1,
  lean,
}) => {
  const kScreen = k * FS * scale;
  const grip = rot(camPt([-206, -200], camSize), aim, [-70, -230]);
  return (
    <Person
      x={x}
      y={y}
      spec={spec}
      k={k}
      scale={scale}
      pose={{
        face,
        walk,
        stride,
        turn,
        lean,
        hand: rot(grip, lean ?? 0),
        farHand: rot(rot(camPt([-120, -196], camSize), aim, [-70, -230]), lean ?? 0),
        blink,
        front: <ShoulderCam kScreen={kScreen} aim={aim} size={camSize} />,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// HAND PROPS (hand frame: origin at the hand, hip-frame axes, facing left)
// ---------------------------------------------------------------------------
export const PhoneAtEar = (W: P2) => <rect x={W[0] - 8} y={W[1] - 36} width={20} height={64} rx={6} fill="#4B392D" transform={`rotate(-12 ${f3(W[0])} ${f3(W[1])})`} />;
export const HandMic = (W: P2) => (
  <g transform={`translate(${f3(W[0])} ${f3(W[1])}) rotate(-62)`}>
    <rect x={-6} y={-8} width={12} height={74} rx={5} fill="#4B392D" transform="rotate(180)" />
    <rect x={-17} y={-104} width={34} height={22} rx={4} fill={COLOR.cream} />
    <circle cx={0} cy={-80} r={0} fill="none" />
    <circle cx={0} cy={-76} r={17} fill={mixHex(HAIR.grey, COLOR.inkDark, 0.35)} />
  </g>
);
export const BigPen = (W: P2) => (
  <g transform={`translate(${f3(W[0])} ${f3(W[1])}) rotate(-28)`}>
    <rect x={-9} y={-70} width={18} height={104} rx={9} fill={CLOTH.denim} />
    <rect x={-9} y={-70} width={18} height={24} rx={9} fill={mixHex(CLOTH.denim, LIGHT_TINT, 0.3)} />
    <path d="M-9 34L9 34L0 54Z" fill={COLOR.inkDark} />
  </g>
);
export const PaperHeld = (W: P2, wave = 0) => (
  <g transform={`translate(${f3(W[0])} ${f3(W[1])}) rotate(${f3(-8 + wave)})`}>
    <rect x={-38} y={-118} width={76} height={100} rx={4} fill={COLOR.cream} />
    {[-96, -80, -64, -48].map((yy, i) => (
      <rect key={i} x={-26} y={yy} width={i === 3 ? 30 : 52} height={6} rx={3} fill={mixHex(COLOR.board, COLOR.cream, 0.35)} />
    ))}
  </g>
);
export const Clipboard = (W: P2) => (
  <g transform={`translate(${f3(W[0])} ${f3(W[1])}) rotate(10)`}>
    <rect x={-40} y={-70} width={68} height={92} rx={6} fill={mixHex(COLOR.board, COLOR.inkDark, 0.15)} />
    <rect x={-34} y={-62} width={56} height={78} rx={3} fill={COLOR.cream} />
    <rect x={-20} y={-76} width={28} height={14} rx={4} fill={CAM_DARK} />
  </g>
);
/** a cardboard box held in front at the waist, a little plant sticking out (leaving the team) */
export const BoxWithPlant = (W: P2) => (
  <g transform={`translate(${f3(W[0] + 30)} ${f3(W[1] - 10)})`}>
    <path d="M-30 -72C-40 -110 -20 -130 -6 -124C-10 -104 -16 -88 -18 -72Z M-12 -72C0 -112 26 -118 34 -106C20 -96 6 -86 0 -72Z" fill={CLOTH.moss} />
    <rect x={-92} y={-74} width={150} height={104} rx={6} fill="#C8A57A" />
    <rect x={-92} y={-74} width={150} height={14} rx={5} fill="#D8BA92" />
    <rect x={-30} y={-74} width={26} height={104} fill="#B8946A" opacity={0.6} />
  </g>
);

// ---------------------------------------------------------------------------
// FURNITURE (world px, on the street lane, y 0 = the ground)
// ---------------------------------------------------------------------------
const WOOD = "#B39274";
export const HighDesk: React.FC<{ x: number; w?: number }> = ({ x, w = 300 }) => (
  <g>
    <ellipse cx={x + 20} cy={2} rx={w * 0.55} ry={12} fill={COLOR.shadow} opacity={0.2} />
    <rect x={x - 12} y={-430} width={24} height={430} fill={footOf(WOOD)} />
    <rect x={x - 80} y={-12} width={160} height={12} rx={6} fill={footOf(WOOD)} />
    <rect x={x - w / 2} y={-450} width={w} height={28} rx={8} fill={WOOD} />
    <rect x={x - w / 2} y={-450} width={w} height={8} rx={4} fill={topOf(WOOD)} />
    <path d={`M${x - 70} -450L${x + 60} -450L${x + 50} -462L${x - 76} -462Z`} fill={COLOR.cream} />
  </g>
);
/** a press-conference table: a cream cloth to the floor, mics on stems (the seated figures go before it) */
export const PressTable: React.FC<{ x: number; w?: number; mics?: number[] }> = ({ x, w = 640, mics = [-190, -150, 130, 170] }) => (
  <g>
    <ellipse cx={x + 30} cy={2} rx={w * 0.55} ry={14} fill={COLOR.shadow} opacity={0.2} />
    {mics.map((m, i) => (
      <g key={i}>
        <path d={`M${x + m} -380L${x + m - 26} -470`} stroke={CAM_DARK} strokeWidth={8} strokeLinecap="round" />
        <circle cx={x + m - 28} cy={-478} r={14} fill={mixHex(HAIR.grey, COLOR.inkDark, 0.3)} />
      </g>
    ))}
    <rect x={x - w / 2} y={-390} width={w} height={390} rx={10} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.4)} />
    <rect x={x - w / 2} y={-390} width={w} height={22} rx={8} fill={COLOR.cream} />
    {[-0.3, 0, 0.3].map((u, i) => (
      <path key={i} d={`M${x + u * w} -368L${x + u * w - 6} 0`} stroke={COLOR.creamFoot} strokeWidth={6} opacity={0.7} />
    ))}
  </g>
);
/** a small low table (a protest letter is slapped on it) */
export const SmallTable: React.FC<{ x: number; w?: number }> = ({ x, w = 220 }) => (
  <g>
    <ellipse cx={x + 16} cy={2} rx={w * 0.6} ry={10} fill={COLOR.shadow} opacity={0.18} />
    <rect x={x - w / 2 + 16} y={-300} width={16} height={300} fill={footOf(WOOD)} />
    <rect x={x + w / 2 - 32} y={-300} width={16} height={300} fill={footOf(WOOD)} />
    <rect x={x - w / 2} y={-318} width={w} height={24} rx={7} fill={WOOD} />
  </g>
);

// ---------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------
export const PAD_COLOR = {
  floor: "#CFC4B2",
  floorFoot: "#B9AC98",
  floorLine: "#E9E0CF",
  unit: mixHex(COLOR.board, COLOR.cream, 0.55),
  unitOat: mixHex("#D9C7A6", COLOR.cream, 0.25),
  unitFoot: mixHex(COLOR.board, COLOR.cream, 0.25),
  glass: "#6E5A4B",
  glassLit: "#8C7666",
  door: mixHex(COLOR.board, COLOR.inkDark, 0.25),
  doorway: mixHex(COLOR.inkDark, COLOR.board, 0.18),
  slat: mixHex(COLOR.board, COLOR.cream, 0.3),
  snow: "#FBF6EC",
  snowShade: "#E7DFD1",
  rope: mixHex(COLOR.board, COLOR.inkDark, 0.4),
  pole: mixHex(COLOR.board, COLOR.inkDark, 0.3),
} as const;

/** the paddock floor from the fence line toward the camera (screen space: a horizontal band) */
export const PaddockFloor: React.FC<{ cam: TrackCam; from: number; lines?: number[]; to?: number }> = ({ cam, from, lines = [], to }) => {
  const uid = uidOf(useId());
  const yG = (z: number) => {
    const kz = laneK(cam, z);
    return cam.groundY - cam.eye * cam.k + cam.eye * kz + (cam.dy ?? 0);
  };
  const y0 = yG(from);
  const y1 = to !== undefined ? yG(to) : 2000;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}f`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(Math.max(y0 + 1, Math.min(y1, 1920)))}>
          <stop offset="0" stopColor={mixHex(PAD_COLOR.floor, "#E9DCC2", 0.3)} />
          <stop offset="1" stopColor={PAD_COLOR.floorFoot} />
        </linearGradient>
      </defs>
      <rect x={-300} y={f3(y0)} width={1680} height={f3(Math.max(0, y1 - y0))} fill={`url(#${uid}f)`} />
      {lines.map((z, i) => {
        const a = yG(z);
        const b = yG(z - 0.12 * M);
        return <rect key={i} x={-300} y={f3(a)} width={1680} height={f3(Math.max(0.8, b - a))} fill={PAD_COLOR.floorLine} opacity={0.75} />;
      })}
    </g>
  );
};

/** the mesh fence between the paddock and the track (lane coords) */
export const PaddockFence: React.FC<{ x0: number; x1: number; h?: number }> = ({ x0, x1, h = 2.2 * M }) => {
  const posts: number[] = [];
  for (let x = Math.ceil(x0 / (2.5 * M)) * 2.5 * M; x <= x1; x += 2.5 * M) posts.push(x);
  return (
    <g>
      <rect x={x0} y={-h} width={x1 - x0} height={h} fill={TRACK_COLOR.mesh} opacity={0.32} />
      {[1, 0.5, 0.03].map((u, i) => (
        <rect key={i} x={x0} y={-h * u - 8} width={x1 - x0} height={16} fill={TRACK_COLOR.fence} />
      ))}
      {posts.map((x, i) => (
        <g key={i}>
          <rect x={x - 14} y={-h - 20} width={28} height={h + 20} fill={TRACK_COLOR.fence} />
          <rect x={x - 14} y={-h - 20} width={9} height={h + 20} fill={TRACK_COLOR.fenceLit} />
        </g>
      ))}
    </g>
  );
};

export type UnitSpec = { s0: number; s1: number; kind: "motorhome" | "garage"; tone: string; trim: string; snow?: boolean; openDoor?: number };
/** the paddock's units along the street (slot coords): alleys between them show the fence and the track */
export const UNITS: UnitSpec[] = [
  { s0: -0.62, s1: 0.44, kind: "motorhome", tone: PAD_COLOR.unit, trim: CLOTH.denim, snow: true },
  { s0: 0.52, s1: 2.2, kind: "motorhome", tone: PAD_COLOR.unitOat, trim: CLOTH.terracotta },
  { s0: 2.8, s1: 4.44, kind: "garage", tone: PAD_COLOR.unit, trim: CLOTH.sage },
  { s0: 4.52, s1: 6.44, kind: "garage", tone: PAD_COLOR.unitOat, trim: CLOTH.plum, openDoor: 4.86 },
  { s0: 6.52, s1: 8.44, kind: "motorhome", tone: PAD_COLOR.unit, trim: CLOTH.moss },
  { s0: 8.52, s1: 10.44, kind: "motorhome", tone: PAD_COLOR.unitOat, trim: CLOTH.slate },
  { s0: 10.52, s1: 11.62, kind: "motorhome", tone: PAD_COLOR.unit, trim: CLOTH.rust, snow: true },
];
const roundTop = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f3(x)} ${f3(y + h)}V${f3(y + r)}Q${f3(x)} ${f3(y)} ${f3(x + r)} ${f3(y)}H${f3(x + w - r)}Q${f3(x + w)} ${f3(y)} ${f3(x + w)} ${f3(y + r)}V${f3(y + h)}Z`;
const snowCap = (x0: number, x1: number, y: number, seed: number) => {
  const n = Math.max(3, Math.round((x1 - x0) / 170));
  let d = `M${f3(x0 - 14)} ${f3(y + 4)}Q${f3(x0 - 18)} ${f3(y - 60)} ${f3(x0 + 40)} ${f3(y - 66)}`;
  for (let i = 1; i < n; i++) {
    const xx = lerp(x0 + 40, x1 - 40, i / n);
    d += `Q${f3(xx - 40)} ${f3(y - 84 - 16 * hash(seed + i))} ${f3(xx)} ${f3(y - 70 - 10 * hash(seed + i * 2))}`;
  }
  d += `Q${f3(x1 + 10)} ${f3(y - 70)} ${f3(x1 + 14)} ${f3(y + 4)}`;
  // drips down the face
  for (let i = n; i >= 0; i--) {
    const xx = lerp(x1 - 30, x0 + 30, i / n);
    const dl = 18 + 34 * hash(seed + i * 5.3);
    d += `L${f3(xx + 22)} ${f3(y + 4)}Q${f3(xx + 14)} ${f3(y + dl)} ${f3(xx)} ${f3(y + dl * 0.9)}Q${f3(xx - 12)} ${f3(y + dl * 0.7)} ${f3(xx - 16)} ${f3(y + 4)}`;
  }
  return d + "Z";
};
export const UnitFace: React.FC<{ u: UnitSpec; i: number }> = ({ u, i }) => {
  const uid = uidOf(useId());
  const x0 = slotX(u.s0);
  const x1 = slotX(u.s1);
  const w = x1 - x0;
  const H = u.kind === "motorhome" ? 5.6 * M : 4.6 * M;
  const t = u.tone;
  const glass = PAD_COLOR.glass;
  const win = (y0: number, y1: number, key: string) => {
    const n = Math.max(2, Math.round(w / (1.3 * M)));
    const pad = 0.25 * M;
    const cw = (w - 2 * pad) / n;
    return (
      <g key={key}>
        <rect x={x0 + pad} y={y0} width={w - 2 * pad} height={y1 - y0} rx={10} fill={glass} />
        <rect x={x0 + pad} y={y0} width={w - 2 * pad} height={(y1 - y0) * 0.22} rx={8} fill={PAD_COLOR.glassLit} opacity={0.6} />
        {Array.from({ length: n - 1 }, (_, j) => (
          <rect key={j} x={x0 + pad + cw * (j + 1) - 7} y={y0} width={14} height={y1 - y0} fill={mixHex(t, COLOR.shadow, 0.1)} />
        ))}
        {/* sky reflections: one soft diagonal per pane */}
        {Array.from({ length: n }, (_, j) => (
          <path
            key={`r${j}`}
            d={`M${f3(x0 + pad + cw * j + cw * 0.18)} ${f3(y1)}L${f3(x0 + pad + cw * j + cw * 0.5)} ${f3(y0)}L${f3(x0 + pad + cw * j + cw * 0.62)} ${f3(y0)}L${f3(x0 + pad + cw * j + cw * 0.3)} ${f3(y1)}Z`}
            fill={PAD_COLOR.glassLit}
            opacity={0.35}
          />
        ))}
      </g>
    );
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}w`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-H)} x2="0" y2="0">
          <stop offset="0" stopColor={topOf(t)} />
          <stop offset="1" stopColor={mixHex(t, COLOR.shadow, 0.12)} />
        </linearGradient>
      </defs>
      {/* its shadow on the floor (in front, a little right) */}
      <rect x={x0 + 0.2 * M} y={-6} width={w} height={0.35 * M} fill={COLOR.shadow} opacity={0.12} />
      <path d={roundTop(x0, -H, w, H, 0.3 * M)} fill={`url(#${uid}w)`} />
      <rect x={x0} y={-H} width={w} height={20} rx={10} fill={topOf(topOf(t))} />
      {u.kind === "motorhome" ? (
        <g>
          {win(-5.0 * M, -3.45 * M, "up")}
          <rect x={x0} y={-3.0 * M} width={w} height={0.2 * M} fill={u.trim} />
          <rect x={x0} y={-3.0 * M} width={w} height={0.05 * M} fill={topOf(u.trim)} />
          {win(-2.55 * M, -1.05 * M, "dn")}
          {/* the door with its step, under a short awning in the team's trim */}
          <rect x={x0 + w * 0.68} y={-2.25 * M} width={0.85 * M} height={2.25 * M} rx={8} fill={PAD_COLOR.door} />
          <rect x={x0 + w * 0.68 + 0.15 * M} y={-2.0 * M} width={0.55 * M} height={0.7 * M} rx={6} fill={glass} />
          <rect x={x0 + w * 0.68 - 0.15 * M} y={-0.16 * M} width={1.15 * M} height={0.16 * M} fill={PAD_COLOR.unitFoot} />
          <path d={`M${f3(x0 + w * 0.68 - 0.3 * M)} ${f3(-2.5 * M)}H${f3(x0 + w * 0.68 + 1.15 * M)}L${f3(x0 + w * 0.68 + 1.0 * M)} ${f3(-2.25 * M)}H${f3(x0 + w * 0.68 - 0.15 * M)}Z`} fill={u.trim} />
          <rect x={x0} y={-0.3 * M} width={w} height={0.3 * M} fill={PAD_COLOR.unitFoot} />
        </g>
      ) : (
        <g>
          {win(-4.2 * M, -3.5 * M, "up")}
          <rect x={x0} y={-3.3 * M} width={w} height={0.16 * M} fill={u.trim} />
          {/* the roll-up door (slats) and the person door */}
          {(() => {
            const dw = Math.min(3.2 * M, w * 0.48);
            const dx = x0 + w * 0.42 - dw / 2;
            return (
              <g>
                <rect x={dx} y={-2.9 * M} width={dw} height={2.9 * M} rx={6} fill={PAD_COLOR.slat} />
                {Array.from({ length: 12 }, (_, j) => (
                  <rect key={j} x={dx} y={-2.9 * M + (j + 0.6) * 0.24 * M} width={dw} height={7} fill={mixHex(PAD_COLOR.slat, COLOR.shadow, 0.16)} />
                ))}
                <rect x={dx - 18} y={-3.0 * M} width={dw + 36} height={0.14 * M} rx={6} fill={mixHex(t, COLOR.shadow, 0.16)} />
              </g>
            );
          })()}
          {(() => {
            const px = u.openDoor !== undefined ? slotX(u.openDoor) : x0 + w * 0.82;
            const dw = 0.95 * M;
            const open = u.openDoor !== undefined;
            return (
              <g>
                <rect x={px - dw / 2 - 16} y={-2.4 * M - 16} width={dw + 32} height={2.4 * M + 16} rx={6} fill={mixHex(t, COLOR.shadow, 0.14)} />
                <rect x={px - dw / 2} y={-2.4 * M} width={dw} height={2.4 * M} rx={4} fill={open ? PAD_COLOR.doorway : PAD_COLOR.door} />
                {open ? (
                  <g>
                    {/* the light spilling out of the garage onto the floor, the door leaf swung open toward us */}
                    <path d={`M${f3(px - dw / 2)} 0L${f3(px + dw / 2)} 0L${f3(px + dw * 0.9)} ${f3(0.5 * M)}L${f3(px - dw * 0.7)} ${f3(0.5 * M)}Z`} fill={COLOR.cream} opacity={0.18} />
                    <path d={`M${f3(px + dw / 2)} ${f3(-2.4 * M)}L${f3(px + dw / 2 + 0.42 * M)} ${f3(-2.32 * M)}L${f3(px + dw / 2 + 0.42 * M)} ${f3(0.12 * M)}L${f3(px + dw / 2)} 0Z`} fill={PAD_COLOR.door} />
                  </g>
                ) : null}
              </g>
            );
          })()}
          <rect x={x0} y={-0.24 * M} width={w} height={0.24 * M} fill={PAD_COLOR.unitFoot} />
        </g>
      )}
      {u.snow ? <path d={snowCap(x0, x1, -H, i * 13.7)} fill={PAD_COLOR.snow} /> : null}
      {u.snow ? <path d={`M${f3(x0 - 0.3 * M)} 6Q${f3(x0 + w * 0.3)} ${f3(-0.16 * M)} ${f3(x0 + w * 0.6)} -4Q${f3(x0 + w * 0.9)} ${f3(-0.12 * M)} ${f3(x1 + 0.3 * M)} 6Z`} fill={PAD_COLOR.snow} /> : null}
    </g>
  );
};
export const PaddockUnits: React.FC<{ units?: UnitSpec[] }> = ({ units = UNITS }) => (
  <g>
    {units.map((u, i) => (
      <UnitFace key={i} u={u} i={i} />
    ))}
  </g>
);

/** the bunting: a rope along the units' faces from JAN to DEC, sagging between hooks at the month edges, one cream
 *  pennant per month at the low point. textPx: the month's cap height on screen (a partial counter-scale);
 *  kz: the lane's screen scale; label: false draws blank pennants */
export const Bunting: React.FC<{ S: number; kz: number; textPx: number; label?: boolean; only?: number }> = ({ S, kz, textPx, label = true, only }) => {
  const y = -PADDOCK.rope;
  const sag = PADDOCK.sag;
  const edges = Array.from({ length: 13 }, (_, i) => slotX(i - 0.5));
  let rope = "";
  const months = only === undefined ? MONTHS.map((_, i) => i) : [only];
  for (const i of months) {
    const a = edges[i];
    const b = edges[i + 1];
    rope += `${i !== months[0] ? "" : `M${f3(a)} ${f3(y)}`}Q${f3((a + b) / 2)} ${f3(y + 2 * sag)} ${f3(b)} ${f3(y)}`;
  }
  const px = textPx / kz;
  return (
    <g>
      <path d={rope} stroke={PAD_COLOR.rope} strokeWidth={Math.max(10, 1.6 / kz)} fill="none" />
      {edges.filter((_, i) => only === undefined || i === only || i === only + 1).map((x, i) => (
        <circle key={`h${i}`} cx={f3(x)} cy={f3(y)} r={Math.max(14, 2.4 / kz)} fill={PAD_COLOR.pole} />
      ))}
      {MONTHS.map((m, i) => {
        if (only !== undefined && i !== only) return null;
        const cx = SLOT_X[i];
        const top = y + sag;
        const tw = labelWidth(m, px);
        const pw = tw + px * 0.62;
        const ph = px * 2.1;
        const notch = px * 0.45;
        const sway = 2.2 * Math.sin(S * 0.13 + i * 1.7) + 1.1 * Math.sin(S * 0.29 + i * 0.6);
        return (
          <g key={m} transform={`rotate(${f3(sway)} ${f3(cx)} ${f3(top)})`}>
            <path
              d={`M${f3(cx - pw / 2 + px * 0.12)} ${f3(top + px * 0.12 + 6)}L${f3(cx + pw / 2 + px * 0.12)} ${f3(top + px * 0.12 + 6)}L${f3(cx + pw / 2 + px * 0.12)} ${f3(top + ph + px * 0.12)}L${f3(cx + px * 0.12)} ${f3(top + ph - notch + px * 0.12)}L${f3(cx - pw / 2 + px * 0.12)} ${f3(top + ph + px * 0.12)}Z`}
              fill={COLOR.shadow}
              opacity={0.16}
            />
            <path d={`M${f3(cx - pw / 2)} ${f3(top)}L${f3(cx + pw / 2)} ${f3(top)}L${f3(cx + pw / 2)} ${f3(top + ph)}L${f3(cx)} ${f3(top + ph - notch)}L${f3(cx - pw / 2)} ${f3(top + ph)}Z`} fill={COLOR.cream} />
            <rect x={f3(cx - pw / 2)} y={f3(top)} width={f3(pw)} height={f3(px * 0.22)} fill={COLOR.creamFoot} />
            {label ? (
              <text x={f3(cx)} y={f3(top + px * 0.42 + px * 0.718)} fontFamily={FONT_LABEL} fontSize={f3(px)} letterSpacing={f3(px * 0.06)} textAnchor="middle" fill={COLOR.inkDark}>
                {m}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/** snow falling in front of a stretch of street (lane coords): flakes drift down and sideways, wrapping in height */
export const SnowFall: React.FC<{ x0: number; x1: number; S: number; kz: number; seed: number; n?: number }> = ({ x0, x1, S, kz, seed, n = 26 }) => {
  const H = 5.6 * M;
  const r = Math.max(9, 2.2 / kz);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const h1 = hash(seed + i * 3.1);
        const h2 = hash(seed + i * 7.7);
        const v = 6 + 6 * h2;
        const yy = -H + (((h1 * H + S * v) % H) + H) % H;
        const xx = lerp(x0, x1, hash(seed + i * 5.3)) + 30 * Math.sin(S * 0.07 + i);
        return <circle key={i} cx={f3(xx)} cy={f3(yy)} r={f3(r * (0.7 + 0.6 * h2))} fill={PAD_COLOR.snow} opacity={0.9} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE F1 CARD CAR — champShared's approved F1 side profile (F1_FWD / F1_BACK / F1_HALO, restated: not exported),
// filled as a top-lit card. x, y = the ground point under the cockpit (world), facing right.
// ---------------------------------------------------------------------------
const F1_FWD =
  "M0 0.6 L0.3 0.61 C0.42 0.615 0.5 0.63 0.56 0.64 C0.9 0.64 1.4 0.6 1.9 0.535 C2.35 0.48 2.72 0.36 2.98 0.265 C3.03 0.245 3.05 0.22 3.03 0.2 " +
  "L3.04 0.125 C3.1 0.118 3.17 0.105 3.195 0.085 C3.215 0.06 3.2 0.035 3.15 0.035 L2.7 0.04 C2.65 0.045 2.63 0.08 2.64 0.11 C2.65 0.135 2.68 0.14 2.72 0.138 L2.96 0.128 " +
  "L2.95 0.19 C2.7 0.26 2.4 0.32 2.05 0.37 C1.75 0.38 1.5 0.33 1.36 0.24 C1.3 0.2 1.27 0.13 1.26 0.09 C1.25 0.05 1.22 0.03 1.16 0.03 L0 0.03";
const F1_BACK =
  "M0 0.6 L-0.2 0.6 C-0.26 0.6 -0.28 0.64 -0.29 0.7 C-0.31 0.82 -0.33 0.925 -0.41 0.948 C-0.47 0.962 -0.57 0.958 -0.67 0.932 " +
  "C-0.95 0.85 -1.2 0.7 -1.45 0.58 C-1.65 0.5 -1.85 0.46 -1.98 0.45 " +
  "C-2.0 0.5 -2.0 0.58 -1.99 0.64 C-1.95 0.65 -1.93 0.67 -1.93 0.71 C-1.94 0.81 -2.01 0.905 -2.12 0.925 L-2.36 0.93 C-2.4 0.93 -2.41 0.91 -2.41 0.88 " +
  "L-2.41 0.665 C-2.41 0.64 -2.39 0.632 -2.35 0.632 L-2.09 0.636 " +
  "C-2.09 0.57 -2.08 0.5 -2.06 0.462 L-2.22 0.455 C-2.26 0.452 -2.26 0.413 -2.22 0.41 L-2.04 0.405 C-2.01 0.38 -2.01 0.34 -2.03 0.315 " +
  "L-2.12 0.305 C-2.16 0.3 -2.17 0.27 -2.14 0.255 C-1.95 0.17 -1.78 0.08 -1.55 0.045 L-1.0 0.03 L0 0.03";
const F1_HALO = "M0.56 0.64 C0.53 0.74 0.47 0.84 0.36 0.872 C0.2 0.905 -0.05 0.905 -0.2 0.87 C-0.27 0.85 -0.3 0.8 -0.295 0.72";
const F1_LINES = [
  "M0.24 0.59 C0.24 0.5 0.27 0.38 0.31 0.31",
  "M0.24 0.59 C-0.1 0.56 -0.6 0.45 -1.06 0.34",
  "M0.31 0.31 C0.1 0.22 -0.3 0.15 -0.75 0.12",
  "M1.25 0.095 L-1.07 0.095",
  "M3.13 0.1 C3.0 0.105 2.86 0.1 2.72 0.1",
  "M-1.99 0.86 C-2.12 0.79 -2.26 0.75 -2.41 0.75",
];
/** map every (x, y) metre pair of an absolute M/L/C path through T */
const mapD = (d: string, T: (x: number, y: number) => P2) => {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  let out = "";
  let nums: number[] = [];
  const flush = () => {
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const p = T(nums[i], nums[i + 1]);
      out += `${f3(p[0])} ${f3(p[1])} `;
    }
    nums = [];
  };
  for (const t of tok) {
    if (/[MLCZ]/.test(t)) {
      flush();
      out += t;
    } else nums.push(parseFloat(t));
  }
  flush();
  return out;
};
export const F1_DIM = { rear: -2.41, front: 3.21, frontAxle: 2.15, rearAxle: -1.45, tyreR: 0.36, rimR: 0.23, top: 0.955 } as const;
export const F1Card: React.FC<{ x: number; y: number; tone: string; accent: string; helmet: string; spin: number; blur?: number; bob?: number }> = ({
  x,
  y,
  tone,
  accent,
  helmet,
  spin,
  blur = 0,
  bob = 0,
}) => {
  const uid = uidOf(useId());
  const yy = y - bob;
  const T = (mx: number, my: number): P2 => [x + mx * M, yy - my * M];
  const fwd = mapD(F1_FWD + " L-0.02 0.03 L-0.02 0.6 Z", T);
  const back = mapD(F1_BACK + " L0.02 0.03 L0.02 0.6 Z", T);
  const Rt = F1_DIM.tyreR * M;
  const tyreC = [F1_DIM.frontAxle, F1_DIM.rearAxle].map((ax) => [x + ax * M, y - F1_DIM.tyreR * M] as P2);
  const tyre = mixHex(COLOR.inkDark, COLOR.board, 0.12);
  const rim = mixHex(COLOR.board, COLOR.cream, 0.4);
  const hc = T(0, 0.67);
  const style = blur > 0.3 ? { filter: `blur(${f3(blur)}px)` } : undefined;
  return (
    <g style={style}>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yy - 0.96 * M)} x2="0" y2={f3(yy)}>
          <stop offset="0" stopColor={topOf(tone)} />
          <stop offset="1" stopColor={mixHex(tone, COLOR.shadow, 0.16)} />
        </linearGradient>
      </defs>
      <ellipse cx={x + 0.5 * M} cy={y + 4} rx={2.9 * M} ry={0.09 * M} fill={COLOR.shadow} opacity={0.3} />
      {/* the driver's helmet in the cockpit, under the halo: big enough to read, its visor dark */}
      <circle cx={f3(hc[0])} cy={f3(hc[1] - 0.05 * M)} r={0.2 * M} fill={helmet} />
      <circle cx={f3(hc[0] - 0.05 * M)} cy={f3(hc[1] - 0.11 * M)} r={0.09 * M} fill={mixHex(helmet, "#FFF4E2", 0.3)} opacity={0.6} />
      <path d={`M${f3(hc[0] + 0.03 * M)} ${f3(hc[1] - 0.1 * M)}h${f3(0.17 * M)}v${f3(0.09 * M)}h${f3(-0.17 * M)}Z`} fill={mixHex(COLOR.inkDark, COLOR.board, 0.25)} />
      <path d={fwd} fill={`url(#${uid}c)`} />
      <path d={back} fill={`url(#${uid}c)`} />
      {/* the livery: a bold accent stripe along the nose and the engine cover, the wings' endplates in the same colour */}
      <path d={mapD("M0.6 0.57 C1.2 0.55 1.9 0.48 2.62 0.31 L2.6 0.2 C1.9 0.37 1.2 0.44 0.6 0.46 Z", T)} fill={accent} />
      <path d={mapD("M-0.4 0.9 C-0.9 0.77 -1.3 0.62 -1.95 0.52 L-1.95 0.42 C-1.3 0.51 -0.9 0.63 -0.42 0.76 Z", T)} fill={accent} />
      {F1_LINES.map((d, i) => (
        <path key={i} d={mapD(d, T)} stroke={mixHex(tone, COLOR.shadow, 0.3)} strokeWidth={0.022 * M} fill="none" strokeLinecap="round" />
      ))}
      {/* the rear wing: its endplate and two dark elements; the front wing: an endplate and its blade */}
      <path d={mapD("M-2.43 0.62 L-2.02 0.62 L-2.0 1.02 L-2.43 1.02 Z", T)} fill={accent} />
      <path d={mapD("M-2.47 1.0 L-1.94 1.0 L-1.94 0.93 L-2.47 0.93 Z", T)} fill={mixHex(tone, COLOR.inkDark, 0.55)} />
      <path d={mapD("M-2.45 0.86 L-1.98 0.86 L-1.98 0.81 L-2.45 0.81 Z", T)} fill={mixHex(tone, COLOR.inkDark, 0.45)} />
      <path d={mapD("M2.7 0.03 L3.22 0.03 L3.22 0.2 L2.82 0.2 Z", T)} fill={accent} />
      <path d={mapD("M2.6 0.06 L3.25 0.06 L3.25 0.02 L2.6 0.02 Z", T)} fill={mixHex(tone, COLOR.inkDark, 0.5)} />
      <path d={mapD(F1_HALO, T)} stroke={mixHex(tone, COLOR.inkDark, 0.62)} strokeWidth={0.075 * M} fill="none" strokeLinecap="round" />
      {tyreC.map((c, i) => (
        <g key={i}>
          <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(Rt)} fill={tyre} />
          <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(Rt * 0.9)} fill={mixHex(tyre, COLOR.board, 0.12)} />
          <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(F1_DIM.rimR * M)} fill={rim} />
          {[0, 72, 144, 216, 288].map((a) => {
            const p = rot([F1_DIM.rimR * M * 0.86, 0], a + spin);
            return <path key={a} d={`M${f3(c[0])} ${f3(c[1])}l${f3(p[0])} ${f3(p[1])}`} stroke={mixHex(rim, COLOR.shadow, 0.3)} strokeWidth={0.03 * M} strokeLinecap="round" />;
          })}
          <circle cx={f3(c[0])} cy={f3(c[1])} r={0.05 * M} fill={mixHex(rim, COLOR.shadow, 0.35)} />
        </g>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CAST and the 12 MONTH DRAMAS (street-lane world coords, x relative to the slot's centre, y 0 = the ground)
// ---------------------------------------------------------------------------
export const CAST = {
  bossA: { skin: SKIN.light, hair: HAIR.grey, hairStyle: "crop", top: CLOTH.denim, pants: CLOTH.brown, headset: CLOTH.cans } as FigSpec,
  bossB: { skin: SKIN.tan, hair: HAIR.ink, hairStyle: "crop", top: CLOTH.terracotta, pants: CLOTH.slate, headset: CLOTH.cans, glasses: true } as FigSpec,
  bossC: { skin: SKIN.cream, hair: HAIR.sandy, hairStyle: "bald", top: CLOTH.sage, pants: CLOTH.brown, mustache: true } as FigSpec,
  bossD: { skin: SKIN.deep, hair: HAIR.ink, hairStyle: "crop", top: CLOTH.plum, pants: CLOTH.slate } as FigSpec,
  bossE: { skin: SKIN.light, hair: HAIR.chestnut, hairStyle: "bob", top: CLOTH.moss, pants: CLOTH.brown } as FigSpec,
  driverA: { skin: SKIN.light, hair: HAIR.chestnut, hairStyle: "cap", cap: CLOTH.cream, top: CLOTH.rust, pants: CLOTH.rust, suit: true, stripe: COLOR.cream } as FigSpec,
  driverB: { skin: SKIN.deep, hair: HAIR.ink, hairStyle: "crop", top: CLOTH.denim, pants: CLOTH.denim, suit: true, stripe: COLOR.cream } as FigSpec,
  driverC: { skin: SKIN.cream, hair: HAIR.sandy, hairStyle: "crop", top: CLOTH.sage, pants: CLOTH.sage, suit: true, stripe: COLOR.cream } as FigSpec,
  reporter: { skin: SKIN.tan, hair: HAIR.auburn, hairStyle: "bob", top: CLOTH.oat, pants: CLOTH.slate } as FigSpec,
  whisper: { skin: SKIN.light, hair: HAIR.ink, hairStyle: "bun", top: CLOTH.plum, pants: CLOTH.brown } as FigSpec,
  official: { skin: SKIN.board, hair: HAIR.grey, hairStyle: "cap", cap: CLOTH.oat, top: CLOTH.oat, pants: CLOTH.brown } as FigSpec,
  camA: { skin: SKIN.tan, hair: HAIR.chestnut, hairStyle: "pony", top: CLOTH.slate, pants: CLOTH.brown } as FigSpec,
  camB: { skin: SKIN.light, hair: HAIR.ink, hairStyle: "cap", cap: CLOTH.moss, top: CLOTH.brown, pants: CLOTH.slate } as FigSpec,
  camC: { skin: SKIN.deep, hair: HAIR.ink, hairStyle: "curly", top: CLOTH.moss, pants: CLOTH.brown } as FigSpec,
  boom: { skin: SKIN.cream, hair: HAIR.auburn, hairStyle: "pony", top: CLOTH.sage, pants: CLOTH.brown } as FigSpec,
} as const;
const CAMS = [CAST.camA, CAST.camB, CAST.camC];
const winter = (s: FigSpec): FigSpec => ({ ...s, scarf: CLOTH.terracotta });

/** an easy loop 0..1..0 */
const wave = (S: number, period: number, phase = 0) => 0.5 - 0.5 * Math.cos(((S + phase) / period) * Math.PI * 2);
const blinkAt = (S: number, seed: number) => {
  const p = 61 + Math.floor(hash(seed) * 40);
  const u = (((S + seed * 17) % p) + p) % p;
  return u < 5 ? [0.5, 1, 1, 0.6, 0.2][Math.floor(u)] : 0;
};

/** each month's crew: which side of its drama the camera op stands (-1 left, facing right; +1 right, facing left),
 *  and how far out from the slot's centre (x W of the slot's half width) */
export const CREW_SIDE: (1 | -1)[] = [1, -1, 1, 1, -1, -1, 1, -1, 1, 1, -1, 1];
export const CREW_SPEC = (i: number) => CAMS[i % 3];
export const crewBlink = (S: number, i: number) => blinkAt(S, i + 40);
export type DramaCtx = { S: number; k: number };
/** month i's drama (and its crew), centred on its slot */
export const MONTH_DRAMAS: ((c: DramaCtx) => React.ReactNode)[] = [
  // JAN (snow): a driver signs a contract with a big pen at a high desk; the boss, delighted, holds the page down
  ({ S, k }) => {
    const w = wave(S, 22);
    return (
      <g>
        <HighDesk x={10} />
        <Person x={-200} y={0} spec={winter(CAST.driverA)} k={k} pose={{ face: 1, lean: -8, hand: [-200 - 14 * w, -140 + 10 * w], hold: BigPen, blink: blinkAt(S, 1) }} />
        <Person x={210} y={0} spec={winter(CAST.bossC)} k={k} pose={{ face: -1, lean: -4, hand: [-170, -150], smile: 1, blink: blinkAt(S, 2), tilt: -4 + 3 * Math.sin(S * 0.08) }} />
      </g>
    );
  },
  // FEB: a doorstep interview: a reporter pushes a mic at a driver, who holds up a palm (no comment)
  ({ S, k }) => {
    const w = wave(S, 30);
    return (
      <g>
        <Person x={-100} y={0} spec={CAST.reporter} k={k} pose={{ face: 1, lean: -10, hand: [-190 - 18 * w, -210], hold: HandMic, blink: blinkAt(S, 3) }} />
        <Person x={110} y={0} spec={CAST.driverB} k={k} pose={{ face: -1, lean: 6, tilt: 6, hand: [-150, -300 + 10 * w], fingers: "open", blink: blinkAt(S, 4) }} />
      </g>
    );
  },
  // MAR: the opening: two team bosses nose to nose, one jabbing a finger and shouting, the other arms folded
  ({ S, k }) => {
    const jab = wave(S, 14);
    const sh = 0.55 + 0.45 * wave(S, 9, 3);
    return (
      <g>
        <Person
          x={-120}
          y={0}
          spec={CAST.bossA}
          k={k}
          pose={{ face: 1, lean: -9 - 4 * jab, hand: [-190 - 34 * jab, -236 + 12 * jab], fingers: "point", shout: sh, brow: 1, farHand: [20, -60], blink: blinkAt(S, 5) }}
        />
        <Person x={128} y={0} spec={CAST.bossB} k={k} pose={{ face: -1, lean: 7 + 2 * jab, tilt: 5, fold: true, brow: 0.9, blink: blinkAt(S, 6) }} />
      </g>
    );
  },
  // APR: a boss on the phone, pacing (a card turning at each end)
  ({ S, k }) => {
    const P = 120;
    const u = (((S + 30) % P) + P) % P / P;
    const goR = u < 0.5;
    const v = goR ? u / 0.5 : (1 - u) / 0.5;
    const xx = lerp(-110, 110, smoothstep(v));
    const edge = Math.min(Math.abs(u - 0.5), Math.min(u, 1 - u));
    const turn = 0.25 + 0.75 * smoothstep(edge / 0.05);
    return (
      <g>
        <Person
          x={xx}
          y={0}
          spec={CAST.bossD}
          k={k}
          pose={{ face: goR ? 1 : -1, turn, walk: xx / 40, stride: 0.55 * turn, hand: [-30, -262], hold: PhoneAtEar, farHand: [-150, -160 + 30 * Math.sin(S * 0.2)], tilt: 8, blink: blinkAt(S, 7) }}
        />
      </g>
    );
  },
  // MAY: a whisper: one leans in with a hand cupped at the mouth, the other leans to listen, eyes wide
  ({ S, k }) => {
    const w = wave(S, 40);
    return (
      <g>
        <Person x={-80} y={0} spec={CAST.whisper} k={k} pose={{ face: 1, lean: -14 - 3 * w, hand: [-150, -290], tilt: -6, blink: blinkAt(S, 8) }} />
        <Person x={80} y={0} spec={CAST.bossA} k={k} pose={{ face: -1, lean: -8, tilt: -14 - 3 * w, hand: [-60, -40], blink: 0, smile: 0 }} />
      </g>
    );
  },
  // JUN: a driver storms out of the garage, fists clenched (filmed by the walking crew in cut 10)
  ({ S, k }) => {
    const ph = S * 0.32;
    return (
      <g>
        <Person x={2 * Math.sin(ph)} y={0} spec={CAST.driverC} k={k} pose={{ face: 1, lean: -12, walk: ph, stride: 0.9, brow: 1, fingers: "fist", farFingers: "fist", blink: blinkAt(S, 9) }} />
      </g>
    );
  },
  // JUL: a press conference: a boss and a driver behind a cloth-covered table bristling with mics
  ({ S, k }) => {
    const w = wave(S, 26);
    return (
      <g>
        <Person x={-130} y={140} spec={CAST.bossE} k={k} pose={{ face: 1, noLegs: true, lean: -4, hand: [-170, -150 - 30 * w], blink: blinkAt(S, 10) }} />
        <Person x={130} y={140} spec={CAST.driverA} k={k} pose={{ face: -1, noLegs: true, fold: true, lean: 6, brow: 0.6, blink: blinkAt(S, 11) }} />
        <PressTable x={0} w={560} mics={[-160, -120, 120, 160]} />
      </g>
    );
  },
  // AUG: two bosses shake hands, smiling, fingers crossed behind their backs
  ({ S, k }) => {
    const sh = 8 * Math.sin(S * 0.5);
    return (
      <g>
        <Person x={-120} y={0} spec={CAST.bossC} k={k} pose={{ face: 1, hand: [-170, -120 + sh], smile: 1, farHand: [90, -70], farFingers: "cross", blink: blinkAt(S, 12) }} />
        <Person x={120} y={0} spec={CAST.bossB} k={k} pose={{ face: -1, hand: [-170, -120 + sh], smile: 1, farHand: [90, -70], farFingers: "cross", blink: blinkAt(S, 13) }} />
      </g>
    );
  },
  // SEP: a protest: a boss waves a letter at an unmoved official (cap, clipboard)
  ({ S, k }) => {
    const w = wave(S, 12);
    return (
      <g>
        <Person x={-120} y={0} spec={CAST.bossD} k={k} pose={{ face: 1, lean: -6, hand: [-150, -300 - 20 * w], hold: (W) => PaperHeld(W, -10 * w), shout: 0.6 + 0.3 * w, brow: 1, blink: blinkAt(S, 14) }} />
        <Person x={120} y={0} spec={CAST.official} k={k} pose={{ face: -1, lean: 4, hand: [-120, -150], hold: Clipboard, blink: blinkAt(S, 15) }} />
      </g>
    );
  },
  // OCT: a driver sulks, turned away with arms folded; the boss behind him pleads
  ({ S, k }) => {
    const w = wave(S, 34);
    return (
      <g>
        <Person x={-110} y={0} spec={CAST.bossE} k={k} pose={{ face: 1, lean: -12 - 3 * w, hand: [-160, -170], farHand: [-140, -180], tilt: 8, blink: blinkAt(S, 16) }} />
        <Person x={100} y={0} spec={CAST.driverB} k={k} pose={{ face: 1, lean: 4, fold: true, tilt: -10, brow: 0.8, blink: blinkAt(S, 17) }} />
      </g>
    );
  },
  // NOV: a driver leaves the team with a box (a plant sticking out); a boss waves goodbye
  ({ S, k }) => {
    const ph = S * 0.2;
    return (
      <g>
        <Person x={-90 - 1.2 * Math.sin(ph)} y={0} spec={CAST.driverC} k={k} pose={{ face: -1, walk: ph, stride: 0.45, hand: [-120, -110], farHand: [-120, -120], hold: BoxWithPlant, tilt: 6, blink: blinkAt(S, 18) }} />
        <Person x={150} y={0} spec={CAST.bossA} k={k} pose={{ face: -1, hand: [-60 - 30 * Math.sin(S * 0.35), -360], fingers: "open", smile: 0.6, blink: blinkAt(S, 19) }} />
      </g>
    );
  },
  // DEC (snow): off-season deals: a boss in a scarf on the phone, the other arm waving
  ({ S, k }) => {
    const w = wave(S, 18);
    return (
      <g>
        <Person x={0} y={0} spec={winter(CAST.bossB)} k={k} pose={{ face: 1, lean: -6, hand: [-30, -262], hold: PhoneAtEar, farHand: [-180 - 20 * w, -300 + 60 * w], farFingers: "open", shout: 0.4 * w, tilt: 6, blink: blinkAt(S, 20) }} />
      </g>
    );
  },
];

/** the back of the set on the curved street: the units (farthest first), the bunting with its pennants, the snow.
 *  homes: the units' lane at the street's middle; textPx(kz): a pennant's cap height on screen */
export const PaddockBack: React.FC<{ cam: TrackCam; S: number; homes?: number; curve?: number; textPx: (kz: number) => number; label?: boolean }> = ({
  cam,
  S,
  homes = PADDOCK.homes,
  curve = PADDOCK.curve,
  textPx,
  label = true,
}) => {
  const units = UNITS.map((u, i) => ({ u, i, z: homes + curveDz((slotX(u.s0) + slotX(u.s1)) / 2, curve) })).sort((a, b) => b.z - a.z);
  const months = MONTHS.map((_, i) => ({ i, z: homes + curveDz(SLOT_X[i], curve) - 0.15 * M })).sort((a, b) => b.z - a.z);
  return (
    <g>
      {units.map(({ u, i, z }) => (
        <OnLane key={`u${i}`} cam={cam} z={z}>
          <UnitFace u={u} i={i} />
          {u.snow ? <SnowFall x0={slotX(u.s0)} x1={slotX(u.s1)} S={S} kz={laneK(cam, z)} seed={i * 3 + 3} /> : null}
        </OnLane>
      ))}
      {months.map(({ i, z }) => {
        const kz = laneK(cam, z);
        return (
          <OnLane key={`b${i}`} cam={cam} z={z}>
            <Bunting S={S} kz={kz} textPx={textPx(kz)} label={label} only={i} />
          </OnLane>
        );
      })}
    </g>
  );
};
/** a month's tripod camera: at its slot's edge, lens turned to its drama (offset from the slot's centre) */
export const tripodOffset = (i: number) => CREW_SIDE[i] * 0.5 * SLOT_F[i] * W * 0.96;
/** the dramas on the curved street (farthest first), each with its tripod camera unless skipped */
export const CurvedStreet: React.FC<{ cam: TrackCam; S: number; street?: number; curve?: number; noTripod?: number[] }> = ({
  cam,
  S,
  street = PADDOCK.street,
  curve = PADDOCK.curve,
  noTripod = [],
}) => {
  const months = MONTHS.map((_, i) => ({ i, z: street + curveDz(SLOT_X[i], curve) })).sort((a, b) => b.z - a.z);
  return (
    <g>
      {months.map(({ i, z }) => {
        const k = laneK(cam, z);
        return (
          <OnLane key={i} cam={cam} z={z}>
            <g transform={`translate(${f3(SLOT_X[i])} 0)`}>
              {noTripod.includes(i) ? null : <TripodCam x={tripodOffset(i)} face={CREW_SIDE[i] === 1 ? -1 : 1} k={k} pan={1.2 * Math.sin(S * 0.05 + i)} />}
              {MONTH_DRAMAS[i]({ S, k })}
            </g>
          </OnLane>
        );
      })}
    </g>
  );
};
/** the whole street of dramas on lane z (each month at its slot), skipping any in `skip` */
export const Street: React.FC<{ cam: TrackCam; z: number; S: number; only?: number[] }> = ({ cam, z, S, only }) => {
  const k = laneK(cam, z);
  return (
    <OnLane cam={cam} z={z}>
      {MONTHS.map((_, i) =>
        only && !only.includes(i) ? null : (
          <g key={i} transform={`translate(${f3(SLOT_X[i])} 0)`}>
            {MONTH_DRAMAS[i]({ S, k })}
          </g>
        ),
      )}
    </OnLane>
  );
};

// ===========================================================================
// THE SEASON STREET (round 2, cuts 10 and 34): the street as a periodic calendar. Month m (any integer; m mod 12 names
// it) owns MW world px of street centred on m * MW: ONE unit front (motorhome or garage), ONE pennant with its month,
// ONE drama (a single readable pose) and ONE crew filming it with an amber tally, the crew on the drama's left, facing
// it. December is followed by next January: the year never stops. The layout (each drama's offset in its month, each
// crew's place) is solved at module load so no two months' people overlap; it throws if they cannot fit.
// ===========================================================================
export const MW = 1000;
export const mi = (m: number) => ((m % 12) + 12) % 12;
/** the units' height and the bunting rope's height on their faces (world px) */
export const UNIT_H = 4.3 * M;
export const ROPE_H = 3.2 * M;
const ROPE_SAG = 0.12 * M;

/** a world point (lane coords, relative to the person's feet x, y) in that person's hip frame (for hand targets) */
export const toHip = (px: number, py: number, face: 1 | -1, scale: number, w: P2): P2 => {
  const sx = (face === 1 ? -1 : 1) * FS * scale;
  return [(w[0] - px) / sx + FEET_X, (w[1] - py) / (FS * scale) + HIP_H];
};

// --- the crews (street lane). Each faces right (+1) unless told otherwise; extents are world px from its x ---------------
export type CrewKind = "shoulder" | "boom" | "tripod";
const STREET_CAM = 0.75;
/** world reach of a crew facing right: [back, front] from its x (the shoulder op's x; the tripod's centre) */
const CREW_EXT: Record<CrewKind, [number, number]> = {
  shoulder: [-88, 1.42 * (30 + 192 * STREET_CAM)],
  boom: [-88 - 150, 1.42 * (30 + 192 * STREET_CAM)],
  tripod: [-200, 232],
};
/** a tripod camera with its operator behind it: eye at the viewfinder, near hand on the zoom grip under the lens,
 *  far hand on the pan bar */
export const TripodCrew: React.FC<{ x: number; face: 1 | -1; k: number; S: number; spec: FigSpec; seed: number; h?: number }> = ({ x, face, k, S, spec, seed, h = 1.18 * M }) => {
  const px = x - face * 104;
  const grip: P2 = [x + face * 150, -h - 26];
  const bar: P2 = [x - face * 199, -h + 22];
  const look = 0.6 * Math.sin(S * 0.05 + seed);
  return (
    <g>
      <TripodCam x={x} face={face} k={k} pan={look} h={h} />
      <Person x={px} y={0} spec={spec} k={k} pose={{ face, lean: -3, tilt: 4, hand: toHip(px, 0, face, 1, grip), farHand: toHip(px, 0, face, 1, bar), blink: blinkAt(S, seed) }} />
    </g>
  );
};
/** a boom operator at x (facing `face`) holding the pole so its mic hangs over world x `over` (lane coords) */
export const BoomOp: React.FC<{ x: number; over: number; face: 1 | -1; k: number; S: number; spec: FigSpec; seed: number; walk?: number; stride?: number; ang?: number; scale?: number }> = ({
  x,
  over,
  face,
  k,
  S,
  spec,
  seed,
  walk,
  stride,
  ang = -12,
  scale = 1,
}) => {
  const b: P2 = [60, -300];
  const d = Math.abs(over - x);
  const L = (d / (1.42 * scale) + 100) / Math.cos(ang * D2R);
  const sway = 1.5 * Math.sin(S * 0.07 + seed);
  return (
    <Person
      x={x}
      y={0}
      spec={spec}
      k={k}
      scale={scale}
      pose={{
        face,
        walk,
        stride,
        lean: -2,
        tilt: -6,
        hand: boomAt(b, ang + sway, L, 0.42),
        farHand: boomAt(b, ang + sway, L, 0.2),
        holdBehind: () => <BoomPole b={b} ang={ang + sway} L={L} />,
        blink: blinkAt(S, seed),
      }}
    />
  );
};
const CREW_SPECS: FigSpec[] = [CAST.camA, CAST.camB, CAST.camC];
const BOOM_SPECS: FigSpec[] = [{ ...CAST.boom, top: CLOTH.oat }, { ...CAST.boom, skin: SKIN.deep, hair: HAIR.ink, hairStyle: "bun", top: CLOTH.slate }];
/** a month's crew at x facing right toward its drama centred at `over` */
export const Crew: React.FC<{ kind: CrewKind; x: number; over: number; k: number; S: number; seed: number; winter?: boolean }> = ({ kind, x, over, k, S, seed, winter: w }) => {
  const spec0 = CREW_SPECS[seed % 3];
  const spec = w ? { ...spec0, scarf: CLOTH.rust } : spec0;
  if (kind === "tripod") return <TripodCrew x={x} face={1} k={k} S={S} spec={spec} seed={seed} />;
  return (
    <g>
      {kind === "boom" ? <BoomOp x={x - 150} over={over} face={1} k={k} S={S} spec={BOOM_SPECS[seed % 2]} seed={seed + 50} /> : null}
      <CameraOp x={x} y={0} spec={spec} face={1} k={k} camSize={STREET_CAM} aim={-3 + 1.2 * Math.sin(S * 0.06 + seed)} blink={blinkAt(S, seed + 30)} />
    </g>
  );
};

// --- props for the round-2 dramas -----------------------------------------------------------------------------------
/** the press backdrop: a cream board on two legs behind the table, a quiet grid of board-tone tiles (no logos, no text) */
export const PressBackdrop: React.FC<{ x: number; w?: number; h?: number }> = ({ x, w = 560, h = 2.45 * M }) => {
  const cols = 6;
  const rows = 4;
  const pad = 46;
  const cw = (w - 2 * pad) / cols;
  const top = -h;
  const ch = (h - 0.95 * M - pad) / rows;
  return (
    <g>
      {[-0.42, 0.42].map((u, i) => (
        <rect key={i} x={x + u * w - 12} y={-0.95 * M} width={24} height={0.95 * M} fill={footOf(PAD_COLOR.pole)} />
      ))}
      <rect x={x - w / 2 + 18} y={top + 18} width={w} height={h - 0.95 * M} rx={12} fill={COLOR.shadow} opacity={0.14} />
      <rect x={x - w / 2} y={top} width={w} height={h - 0.95 * M} rx={12} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.3)} />
      <rect x={x - w / 2} y={top} width={w} height={22} rx={10} fill={COLOR.cream} />
      {Array.from({ length: cols * rows }, (_, j) => {
        const c = j % cols;
        const r = Math.floor(j / cols);
        return <rect key={`t${j}`} x={x - w / 2 + pad + c * cw + cw * 0.22} y={top + pad + r * ch + ch * 0.25} width={cw * 0.56} height={ch * 0.5} rx={8} fill={mixHex(COLOR.creamFoot, PAD_COLOR.slat, 0.35)} opacity={0.75} />;
      })}
    </g>
  );
};
/** a small snowman with a rust scarf (December) */
export const Snowman: React.FC<{ x: number; S: number; size?: number }> = ({ x, S, size = 1 }) => {
  const r1 = 0.42 * M * size;
  const r2 = 0.3 * M * size;
  const r3 = 0.21 * M * size;
  const y1 = -r1;
  const y2 = -2 * r1 - r2 + 30 * size;
  const y3 = y2 - r2 - r3 + 24 * size;
  const tw = 2 * Math.sin(S * 0.09);
  return (
    <g>
      <ellipse cx={x + 26} cy={2} rx={r1 * 1.2} ry={14} fill={COLOR.shadow} opacity={0.16} />
      <circle cx={x} cy={y1} r={r1} fill={PAD_COLOR.snow} />
      <circle cx={x} cy={y2} r={r2} fill={PAD_COLOR.snow} />
      <path d={`M${f3(x - r1)} ${f3(y1)}A${f3(r1)} ${f3(r1)} 0 0 0 ${f3(x + r1)} ${f3(y1)}Z`} fill={PAD_COLOR.snowShade} opacity={0.6} />
      <path d={`M${f3(x - r2)} ${f3(y2)}A${f3(r2)} ${f3(r2)} 0 0 0 ${f3(x + r2)} ${f3(y2)}Z`} fill={PAD_COLOR.snowShade} opacity={0.5} />
      <path d={`M${f3(x - r2 * 0.9)} ${f3(y2 - r2 * 0.55)}Q${f3(x)} ${f3(y2 - r2 * 0.3)} ${f3(x + r2 * 0.9)} ${f3(y2 - r2 * 0.55)}L${f3(x + r2 * 0.8)} ${f3(y2 - r2 * 0.3)}Q${f3(x)} ${f3(y2 - r2 * 0.05)} ${f3(x - r2 * 0.8)} ${f3(y2 - r2 * 0.3)}Z`} fill={CLOTH.rust} />
      <path d={`M${f3(x + r2 * 0.5)} ${f3(y2 - r2 * 0.4)}L${f3(x + r2 * 0.75 + tw)} ${f3(y2 + r2 * 0.5)}L${f3(x + r2 * 0.4 + tw)} ${f3(y2 + r2 * 0.55)}Z`} fill={CLOTH.rust} />
      <circle cx={x} cy={y3} r={r3} fill={PAD_COLOR.snow} />
      <circle cx={x - r3 * 0.38} cy={y3 - r3 * 0.12} r={r3 * 0.11} fill={COLOR.inkDark} />
      <path d={`M${f3(x - r3 * 0.75)} ${f3(y3 + r3 * 0.1)}L${f3(x - r3 * 1.75)} ${f3(y3 + r3 * 0.25)}L${f3(x - r3 * 0.75)} ${f3(y3 + r3 * 0.38)}Z`} fill={CLOTH.terracotta} />
      {[0.15, 0.55].map((u, i) => (
        <circle key={i} cx={x - r2 * 0.05} cy={y2 + r2 * u} r={r2 * 0.09} fill={COLOR.inkDark} />
      ))}
    </g>
  );
};

// --- the twelve dramas (world px, relative to the drama's centre; y 0 = the ground) ----------------------------------------
type SeasonDef = {
  unit: "motorhome" | "garage";
  tone: string;
  trim: string;
  snow?: boolean;
  /** the drama's extent [left, right] (world px from its centre) */
  ext: [number, number];
  crew: CrewKind;
  /** the unit's door: world x from the month's centre (garage: an open doorway when `open`) */
  door?: number;
  open?: boolean;
  drama: (c: DramaCtx) => React.ReactNode;
};
export const SEASON: SeasonDef[] = [
  // JAN (snow on the roof): the opening, two team bosses nose to nose: a finger jab and a shout against folded arms
  {
    unit: "motorhome",
    tone: PAD_COLOR.unit,
    trim: CLOTH.denim,
    snow: true,
    ext: [-215, 215],
    crew: "shoulder",
    drama: ({ S, k }) => {
      const jab = wave(S, 14);
      const sh = 0.55 + 0.45 * wave(S, 9, 3);
      return (
        <g>
          <Person
            x={-132}
            y={0}
            spec={CAST.bossA}
            k={k}
            pose={{ face: 1, lean: -11 - 3 * jab, hand: [-206 - 14 * jab, -206 + 4 * jab], fingers: "point", shout: sh, brow: 1, farHand: [30, -60], blink: blinkAt(S, 5) }}
          />
          <Person x={132} y={0} spec={CAST.bossB} k={k} pose={{ face: -1, lean: 8 + 2 * jab, tilt: 7, fold: true, brow: 0.9, blink: blinkAt(S, 6) }} />
        </g>
      );
    },
  },
  // FEB: a driver signs a contract with a big pen at a high desk; the boss, delighted, holds the page down
  {
    unit: "motorhome",
    tone: PAD_COLOR.unitOat,
    trim: CLOTH.terracotta,
    ext: [-280, 290],
    crew: "shoulder",
    drama: ({ S, k }) => {
      const w = wave(S, 22);
      return (
        <g>
          <HighDesk x={10} />
          <Person x={-190} y={0} spec={CAST.driverA} k={k} pose={{ face: 1, lean: -8, hand: [-200 - 14 * w, -140 + 10 * w], hold: BigPen, blink: blinkAt(S, 1) }} />
          <Person x={200} y={0} spec={CAST.bossC} k={k} pose={{ face: -1, lean: -4, hand: [-170, -150], smile: 1, blink: blinkAt(S, 2), tilt: -4 + 3 * Math.sin(S * 0.08) }} />
        </g>
      );
    },
  },
  // MAR: a press conference: a boss and a driver behind a cloth-covered table bristling with mics, the backdrop behind
  {
    unit: "motorhome",
    tone: PAD_COLOR.unit,
    trim: CLOTH.sage,
    ext: [-280, 280],
    crew: "shoulder",
    drama: ({ S, k }) => {
      const w = wave(S, 26);
      return (
        <g>
          <PressBackdrop x={0} w={560} />
          <Person x={-120} y={150} spec={CAST.bossE} k={k} pose={{ face: 1, noLegs: true, lean: -4, hand: [-170, -150 - 34 * w], fingers: "open", blink: blinkAt(S, 10) }} />
          <Person x={130} y={150} spec={CAST.driverA} k={k} pose={{ face: -1, noLegs: true, fold: true, lean: 6, brow: 0.6, blink: blinkAt(S, 11) }} />
          <PressTable x={0} w={500} mics={[-150, -110, 110, 150]} />
        </g>
      );
    },
  },
  // APR: a doorstep interview: a reporter pushes a mic at a driver, who holds up a palm (no comment)
  {
    unit: "garage",
    tone: PAD_COLOR.unitOat,
    trim: CLOTH.plum,
    ext: [-190, 200],
    crew: "boom",
    drama: ({ S, k }) => {
      const w = wave(S, 30);
      return (
        <g>
          <Person x={-100} y={0} spec={CAST.reporter} k={k} pose={{ face: 1, lean: -10, hand: [-190 - 18 * w, -210], hold: HandMic, blink: blinkAt(S, 3) }} />
          <Person x={110} y={0} spec={CAST.driverB} k={k} pose={{ face: -1, lean: 6, tilt: 6, hand: [-150, -300 + 10 * w], fingers: "open", blink: blinkAt(S, 4) }} />
        </g>
      );
    },
  },
  // MAY: a boss on the phone, the free hand thrown out wide
  {
    unit: "motorhome",
    tone: PAD_COLOR.unit,
    trim: CLOTH.moss,
    ext: [-110, 130],
    crew: "tripod",
    drama: ({ S, k }) => {
      const w = wave(S, 20);
      return (
        <g>
          <Person
            x={0}
            y={0}
            spec={CAST.bossD}
            k={k}
            pose={{ face: -1, lean: 4, hand: [-30, -262], hold: PhoneAtEar, farHand: [60 + 30 * w, -330 + 50 * w], farFingers: "open", tilt: 10, shout: 0.5 * w, brow: 0.7, blink: blinkAt(S, 7) }}
          />
        </g>
      );
    },
  },
  // JUN: a driver storms out of the garage, fists clenched, straight at the camera
  {
    unit: "garage",
    tone: PAD_COLOR.unit,
    trim: CLOTH.rust,
    ext: [-175, 110],
    crew: "shoulder",
    door: 40,
    open: true,
    drama: ({ S, k }) => {
      const ph = S * 0.32;
      return (
        <g>
          <Person x={-10 + 2 * Math.sin(ph)} y={0} spec={CAST.driverC} k={k} pose={{ face: -1, lean: -12, walk: ph, stride: 0.9, brow: 1, fingers: "fist", farFingers: "fist", blink: blinkAt(S, 9) }} />
        </g>
      );
    },
  },
  // JUL: two bosses shake hands, smiling, fingers crossed behind their backs
  {
    unit: "motorhome",
    tone: PAD_COLOR.unitOat,
    trim: CLOTH.slate,
    ext: [-210, 210],
    crew: "tripod",
    drama: ({ S, k }) => {
      const sh = 8 * Math.sin(S * 0.5);
      return (
        <g>
          <Person x={-120} y={0} spec={CAST.bossC} k={k} pose={{ face: 1, hand: [-170, -120 + sh], smile: 1, farHand: [92, -70], farFingers: "cross", blink: blinkAt(S, 12) }} />
          <Person x={120} y={0} spec={CAST.bossB} k={k} pose={{ face: -1, hand: [-170, -120 + sh], smile: 1, farHand: [92, -70], farFingers: "cross", blink: blinkAt(S, 13) }} />
        </g>
      );
    },
  },
  // AUG: a protest: a boss waves a letter at an unmoved official (cap, clipboard)
  {
    unit: "garage",
    tone: PAD_COLOR.unitOat,
    trim: CLOTH.sage,
    ext: [-210, 210],
    crew: "boom",
    drama: ({ S, k }) => {
      const w = wave(S, 12);
      return (
        <g>
          <Person x={-120} y={0} spec={CAST.bossD} k={k} pose={{ face: 1, lean: -6, hand: [-150, -300 - 20 * w], hold: (Wp) => PaperHeld(Wp, -10 * w), shout: 0.6 + 0.3 * w, brow: 1, blink: blinkAt(S, 14) }} />
          <Person x={120} y={0} spec={CAST.official} k={k} pose={{ face: -1, lean: 4, hand: [-120, -150], hold: Clipboard, blink: blinkAt(S, 15) }} />
        </g>
      );
    },
  },
  // SEP: a whisper: one leans in with a hand at the mouth, the other leans to listen
  {
    unit: "motorhome",
    tone: PAD_COLOR.unit,
    trim: CLOTH.terracotta,
    ext: [-175, 175],
    crew: "shoulder",
    drama: ({ S, k }) => {
      const w = wave(S, 40);
      return (
        <g>
          <Person x={-80} y={0} spec={CAST.whisper} k={k} pose={{ face: 1, lean: -14 - 3 * w, hand: [-150, -290], tilt: -6, blink: blinkAt(S, 8) }} />
          <Person x={80} y={0} spec={CAST.bossA} k={k} pose={{ face: -1, lean: -8, tilt: -14 - 3 * w, hand: [-60, -40], blink: 0, smile: 0 }} />
        </g>
      );
    },
  },
  // OCT: a driver sulks, turned away with arms folded; the boss behind pleads
  {
    unit: "garage",
    tone: PAD_COLOR.unit,
    trim: CLOTH.denim,
    ext: [-200, 190],
    crew: "tripod",
    drama: ({ S, k }) => {
      const w = wave(S, 34);
      return (
        <g>
          <Person x={-110} y={0} spec={CAST.bossE} k={k} pose={{ face: 1, lean: -12 - 3 * w, hand: [-160, -170], farHand: [-140, -180], tilt: 8, blink: blinkAt(S, 16) }} />
          <Person x={100} y={0} spec={CAST.driverB} k={k} pose={{ face: 1, lean: 4, fold: true, tilt: -10, brow: 0.8, blink: blinkAt(S, 17) }} />
        </g>
      );
    },
  },
  // NOV: a driver leaves the team with a box (a plant sticking out); a boss waves goodbye
  {
    unit: "motorhome",
    tone: PAD_COLOR.unitOat,
    trim: CLOTH.plum,
    ext: [-300, 240],
    crew: "shoulder",
    drama: ({ S, k }) => {
      const ph = S * 0.2;
      return (
        <g>
          <Person x={-90 - 1.2 * Math.sin(ph)} y={0} spec={CAST.driverC} k={k} pose={{ face: -1, walk: ph, stride: 0.45, hand: [-120, -110], farHand: [-120, -120], hold: BoxWithPlant, tilt: 6, blink: blinkAt(S, 18) }} />
          <Person x={150} y={0} spec={CAST.bossA} k={k} pose={{ face: -1, hand: [-60 - 30 * Math.sin(S * 0.35), -360], fingers: "open", smile: 0.6, blink: blinkAt(S, 19) }} />
        </g>
      );
    },
  },
  // DEC (snow): the off-season never stops: a boss in a scarf on the phone in the snow, the free arm waving; a snowman
  {
    unit: "motorhome",
    tone: PAD_COLOR.unit,
    trim: CLOTH.rust,
    snow: true,
    ext: [-270, 110],
    crew: "tripod",
    drama: ({ S, k }) => {
      const w = wave(S, 18);
      return (
        <g>
          <Snowman x={-190} S={S} size={0.68} />
          <Person
            x={0}
            y={0}
            spec={winter(CAST.bossB)}
            k={k}
            pose={{ face: -1, lean: 4, hand: [-30, -262], hold: PhoneAtEar, farHand: [40 + 30 * w, -330 + 60 * w], farFingers: "open", shout: 0.5 * w, tilt: 8, blink: blinkAt(S, 20) }}
          />
        </g>
      );
    },
  },
];

// --- the layout: each drama's centre in its month (off) and its crew's x (both world px from the month's centre) -----------
const GAP_IN = 40;
/** January keeps the street on the bosses' right clear (the opening frames them alone on that side) */
const SEASON_EXT_JAN_R = 420;
const SEASON_OFF = 200;
const GAP_OUT = 50;
/** JAN, the opening: a boom op and a camera op on the street at the left (cut 10 adds a camera op on the right, nearer) */
export const JAN_CREW = { boom: -690, left: -515 } as const;
const JAN_EXT: [number, number] = [JAN_CREW.boom - 100, SEASON_EXT_JAN_R];
export const SEASON_LAYOUT: { off: number; crewX: number }[] = (() => {
  const span = (i: number): [number, number] => {
    if (i === 0) return JAN_EXT;
    const d = SEASON[i];
    const [b, f] = CREW_EXT[d.crew];
    return [d.ext[0] - GAP_IN - f + b, d.ext[1]];
  };
  const sp = SEASON.map((_, i) => span(i));
  // every drama at the same offset in its month (the pennants keep one rhythm), moved only where a neighbour needs room
  const off = sp.map(() => SEASON_OFF);
  // forward from JAN, then back from the next JAN (wrapping), each month just clear of its neighbours
  for (let i = 1; i < 12; i++) off[i] = Math.max(off[i], off[i - 1] + sp[i - 1][1] - MW + GAP_OUT - sp[i][0]);
  // (JAN keeps its offset: the opening is framed on it)
  for (let i = 11; i >= 1; i--) {
    const nOff = i === 11 ? off[0] : off[i + 1];
    off[i] = Math.min(off[i], nOff + sp[(i + 1) % 12][0] + MW - GAP_OUT - sp[i][1]);
  }
  for (let i = 0; i < 12; i++) {
    const j = (i + 1) % 12;
    if (off[i] + sp[i][1] + GAP_OUT > off[j] + sp[j][0] + MW + 0.5) throw new Error(`paddockWorld: months ${i} and ${j} overlap`);
  }
  return SEASON.map((d, i) => ({ off: off[i], crewX: i === 0 ? off[0] + JAN_CREW.left : off[i] + d.ext[0] - GAP_IN - CREW_EXT[d.crew][1] }));
})();
/** month m's drama centre (world x) */
export const dramaX = (m: number) => m * MW + SEASON_LAYOUT[mi(m)].off;

// --- the set, month by month ------------------------------------------------------------------------------------------------
/** month m's unit front (homes lane coords) */
export const MonthUnit: React.FC<{ m: number }> = ({ m }) => {
  const d = SEASON[mi(m)];
  const x0 = m * MW - MW / 2 + 55;
  const x1 = m * MW + MW / 2 - 55;
  const door = d.door !== undefined ? m * MW + d.door : undefined;
  return <UnitFaceX x0={x0} x1={x1} H={UNIT_H} kind={d.unit} tone={d.tone} trim={d.trim} snow={d.snow} door={door} open={d.open} seed={mi(m) * 13.7} />;
};
/** a unit front between world x0 and x1, H tall: a motorhome (two window bands, a trim stripe, a door under an awning)
 *  or a garage back (a window band, a roll-up door, a person door) */
export const UnitFaceX: React.FC<{ x0: number; x1: number; H: number; kind: "motorhome" | "garage"; tone: string; trim: string; snow?: boolean; door?: number; open?: boolean; seed: number }> = ({
  x0,
  x1,
  H,
  kind,
  tone: t,
  trim,
  snow,
  door,
  open,
  seed,
}) => {
  const uid = uidOf(useId());
  const w = x1 - x0;
  const glass = PAD_COLOR.glass;
  const win = (y0: number, y1: number, key: string) => {
    const n = Math.max(2, Math.round(w / (1.1 * M)));
    const pad = 0.22 * M;
    const cw = (w - 2 * pad) / n;
    return (
      <g key={key}>
        <rect x={x0 + pad} y={y0} width={w - 2 * pad} height={y1 - y0} rx={10} fill={glass} />
        <rect x={x0 + pad} y={y0} width={w - 2 * pad} height={(y1 - y0) * 0.2} rx={8} fill={PAD_COLOR.glassLit} opacity={0.6} />
        {Array.from({ length: n - 1 }, (_, j) => (
          <rect key={j} x={x0 + pad + cw * (j + 1) - 7} y={y0} width={14} height={y1 - y0} fill={mixHex(t, COLOR.shadow, 0.1)} />
        ))}
        {Array.from({ length: n }, (_, j) => (
          <path
            key={`r${j}`}
            d={`M${f3(x0 + pad + cw * j + cw * 0.18)} ${f3(y1)}L${f3(x0 + pad + cw * j + cw * 0.5)} ${f3(y0)}L${f3(x0 + pad + cw * j + cw * 0.62)} ${f3(y0)}L${f3(x0 + pad + cw * j + cw * 0.3)} ${f3(y1)}Z`}
            fill={PAD_COLOR.glassLit}
            opacity={0.32}
          />
        ))}
      </g>
    );
  };
  const dx = door ?? x1 - 1.0 * M;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}w`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-H)} x2="0" y2="0">
          <stop offset="0" stopColor={topOf(t)} />
          <stop offset="1" stopColor={mixHex(t, COLOR.shadow, 0.12)} />
        </linearGradient>
      </defs>
      <rect x={x0 + 0.2 * M} y={-6} width={w} height={0.3 * M} fill={COLOR.shadow} opacity={0.12} />
      <path d={roundTop(x0, -H, w, H, 0.3 * M)} fill={`url(#${uid}w)`} />
      <rect x={x0} y={-H} width={w} height={20} rx={10} fill={topOf(topOf(t))} />
      {kind === "motorhome" ? (
        <g>
          {win(-H + 0.42 * M, -2.95 * M, "up")}
          <rect x={x0} y={-2.72 * M} width={w} height={0.2 * M} fill={trim} />
          <rect x={x0} y={-2.72 * M} width={w} height={0.05 * M} fill={topOf(trim)} />
          {win(-2.3 * M, -1.0 * M, "dn")}
          <rect x={dx - 0.42 * M} y={-2.2 * M} width={0.84 * M} height={2.2 * M} rx={8} fill={PAD_COLOR.door} />
          <rect x={dx - 0.27 * M} y={-1.95 * M} width={0.54 * M} height={0.68 * M} rx={6} fill={glass} />
          <rect x={dx - 0.57 * M} y={-0.16 * M} width={1.14 * M} height={0.16 * M} fill={PAD_COLOR.unitFoot} />
          <path d={`M${f3(dx - 0.72 * M)} ${f3(-2.45 * M)}H${f3(dx + 0.72 * M)}L${f3(dx + 0.57 * M)} ${f3(-2.2 * M)}H${f3(dx - 0.57 * M)}Z`} fill={trim} />
          <rect x={x0} y={-0.3 * M} width={w} height={0.3 * M} fill={PAD_COLOR.unitFoot} />
        </g>
      ) : (
        <g>
          {win(-H + 0.42 * M, -3.15 * M, "up")}
          <rect x={x0} y={-2.98 * M} width={w} height={0.16 * M} fill={trim} />
          {(() => {
            const dw = Math.min(3.0 * M, w * 0.5);
            const rx = open ? x0 + w * 0.12 : x0 + w * 0.08;
            return (
              <g>
                <rect x={rx} y={-2.6 * M} width={dw} height={2.6 * M} rx={6} fill={PAD_COLOR.slat} />
                {Array.from({ length: 10 }, (_, j) => (
                  <rect key={j} x={rx} y={-2.6 * M + (j + 0.6) * 0.25 * M} width={dw} height={7} fill={mixHex(PAD_COLOR.slat, COLOR.shadow, 0.16)} />
                ))}
                <rect x={rx - 18} y={-2.7 * M} width={dw + 36} height={0.14 * M} rx={6} fill={mixHex(t, COLOR.shadow, 0.16)} />
              </g>
            );
          })()}
          {(() => {
            const dw = open ? 1.3 * M : 0.95 * M;
            const px = door ?? x1 - 0.9 * M;
            return (
              <g>
                <rect x={px - dw / 2 - 16} y={-2.4 * M - 16} width={dw + 32} height={2.4 * M + 16} rx={6} fill={mixHex(t, COLOR.shadow, 0.14)} />
                <rect x={px - dw / 2} y={-2.4 * M} width={dw} height={2.4 * M} rx={4} fill={open ? PAD_COLOR.doorway : PAD_COLOR.door} />
                {open ? (
                  <g>
                    <path d={`M${f3(px - dw / 2)} 0L${f3(px + dw / 2)} 0L${f3(px + dw * 0.9)} ${f3(0.5 * M)}L${f3(px - dw * 0.7)} ${f3(0.5 * M)}Z`} fill={COLOR.cream} opacity={0.18} />
                    <path d={`M${f3(px + dw / 2)} ${f3(-2.4 * M)}L${f3(px + dw / 2 + 0.42 * M)} ${f3(-2.32 * M)}L${f3(px + dw / 2 + 0.42 * M)} ${f3(0.12 * M)}L${f3(px + dw / 2)} 0Z`} fill={PAD_COLOR.door} />
                  </g>
                ) : null}
              </g>
            );
          })()}
          <rect x={x0} y={-0.24 * M} width={w} height={0.24 * M} fill={PAD_COLOR.unitFoot} />
        </g>
      )}
      {snow ? <path d={snowCap(x0, x1, -H, seed)} fill={PAD_COLOR.snow} /> : null}
      {snow ? <path d={`M${f3(x0 - 0.3 * M)} 6Q${f3(x0 + w * 0.3)} ${f3(-0.16 * M)} ${f3(x0 + w * 0.6)} -4Q${f3(x0 + w * 0.9)} ${f3(-0.12 * M)} ${f3(x1 + 0.3 * M)} 6Z`} fill={PAD_COLOR.snow} /> : null}
    </g>
  );
};

/** the bunting across months m0..m1 (homes lane coords): the rope hooked at the month edges, one cream pennant per month
 *  hanging over its drama. fontW: the month's font size (world px) */
export const SeasonBunting: React.FC<{ m0: number; m1: number; S: number; fontW: number; ropeH?: number }> = ({ m0, m1, S, fontW, ropeH = ROPE_H }) => {
  const y = -ropeH;
  const ropeY = (x: number) => {
    const m = Math.floor(x / MW + 0.5);
    const a = (m - 0.5) * MW;
    const t = (x - a) / MW;
    return y + 4 * ROPE_SAG * t * (1 - t);
  };
  let rope = "";
  for (let m = m0; m <= m1; m++) {
    const a = (m - 0.5) * MW;
    const b = (m + 0.5) * MW;
    rope += `${m === m0 ? `M${f3(a)} ${f3(y)}` : ""}Q${f3((a + b) / 2)} ${f3(y + 2 * ROPE_SAG)} ${f3(b)} ${f3(y)}`;
  }
  const px = fontW;
  return (
    <g>
      <path d={rope} stroke={PAD_COLOR.rope} strokeWidth={12} fill="none" />
      {Array.from({ length: m1 - m0 + 2 }, (_, j) => (
        <circle key={`h${j}`} cx={f3((m0 + j - 0.5) * MW)} cy={f3(y)} r={18} fill={PAD_COLOR.pole} />
      ))}
      {Array.from({ length: m1 - m0 + 1 }, (_, j) => {
        const m = m0 + j;
        const name = MONTHS[mi(m)];
        const cx = dramaX(m);
        const top = ropeY(cx);
        const tw = labelWidth(name, px);
        const pw = tw + px * 0.7;
        const ph = px * 1.95;
        const notch = px * 0.42;
        const sway = 1.6 * Math.sin(S * 0.13 + m * 1.7) + 0.8 * Math.sin(S * 0.29 + m * 0.6);
        const sh = px * 0.1;
        return (
          <g key={m} transform={`rotate(${f3(sway)} ${f3(cx)} ${f3(top)})`}>
            <path d={`M${f3(cx - pw / 2 + sh)} ${f3(top + sh + 6)}L${f3(cx + pw / 2 + sh)} ${f3(top + sh + 6)}L${f3(cx + pw / 2 + sh)} ${f3(top + ph + sh)}L${f3(cx + sh)} ${f3(top + ph - notch + sh)}L${f3(cx - pw / 2 + sh)} ${f3(top + ph + sh)}Z`} fill={COLOR.shadow} opacity={0.16} />
            <path d={`M${f3(cx - pw / 2)} ${f3(top)}L${f3(cx + pw / 2)} ${f3(top)}L${f3(cx + pw / 2)} ${f3(top + ph)}L${f3(cx)} ${f3(top + ph - notch)}L${f3(cx - pw / 2)} ${f3(top + ph)}Z`} fill={COLOR.cream} />
            <rect x={f3(cx - pw / 2)} y={f3(top)} width={f3(pw)} height={f3(px * 0.2)} fill={COLOR.creamFoot} />
            <circle cx={f3(cx)} cy={f3(top)} r={f3(px * 0.09)} fill={PAD_COLOR.pole} />
            <text x={f3(cx)} y={f3(top + px * 0.36 + px * 0.718)} fontFamily={FONT_LABEL} fontSize={f3(px)} letterSpacing={f3(px * 0.06)} textAnchor="middle" fill={COLOR.inkDark}>
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** month m's drama and its crew(s) (street lane coords) */
export const MonthStreet: React.FC<{ m: number; S: number; k: number }> = ({ m, S, k }) => {
  const i = mi(m);
  const d = SEASON[i];
  const L = SEASON_LAYOUT[i];
  const cx = m * MW;
  const over = cx + L.off;
  const Sm = S + i * 7;
  if (i === 0) {
    return (
      <g>
        <BoomOp x={over + JAN_CREW.boom} over={over + 20} face={1} k={k} S={Sm} spec={BOOM_SPECS[0]} seed={60} />
        <CameraOp x={cx + L.crewX} y={0} spec={CAST.camC} face={1} k={k} camSize={STREET_CAM} aim={-2 + 1.2 * Math.sin(S * 0.06)} blink={blinkAt(S, 31)} />
        <g transform={`translate(${fx(over)} 0)`}>{d.drama({ S: Sm, k })}</g>
      </g>
    );
  }
  return (
    <g>
      <Crew kind={d.crew} x={cx + L.crewX} over={over} k={k} S={Sm} seed={i} winter={!!d.snow} />
      <g transform={`translate(${fx(over)} 0)`}>{d.drama({ S: Sm, k })}</g>
    </g>
  );
};
/** snow over December (and the start of January): flakes falling in front of the units, a drift at their feet */
export const SeasonSnow: React.FC<{ m: number; S: number; kz: number }> = ({ m, S, kz }) => {
  const x0 = m * MW - MW / 2;
  const x1 = m * MW + MW / 2 + 120;
  return (
    <g>
      <SnowFall x0={x0} x1={x1} S={S} kz={kz} seed={m * 7 + 3} n={34} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE OVER-THE-SHOULDER CAMERA OPERATOR (seen from behind, cut 34): the operator's back to us, the camera on the right
// shoulder pointing into the scene; `pan` (deg, - = left, + = right) swings the camera, the head and the arms round to
// follow the action: never a card flip. x, y = the feet (lane coords), scale on top of FS. The rear tally (amber) sits on
// the camera's back above the battery.
// ---------------------------------------------------------------------------
export const BackOp: React.FC<{ x: number; y: number; spec: FigSpec; k: number; pan: number; scale?: number; S: number; seed: number }> = ({ x, y, spec, k, pan, scale = 1, S, seed }) => {
  const uid = uidOf(useId());
  const s = FS * scale;
  const pr = pan * D2R;
  const hx = 9 * Math.sin(pr);
  const hy = -455 + 2 * Math.sin(S * 0.11 + seed);
  // the camera: a box on the right shoulder, projected obliquely (into the scene = up the screen)
  const P3 = (X: number, Yu: number, Z: number): P2 => [X, -Yu - 0.42 * Z];
  const fwd = [Math.sin(pr), Math.cos(pr)] as const; // (x, z)
  const rgt = [Math.cos(pr), -Math.sin(pr)] as const;
  const base = { x: 66, y: 452, z: -10 };
  const L = 210;
  const Wd = 72;
  const Hh = 78;
  const corner = (u: number, v: number, w: number): P2 =>
    P3(base.x + rgt[0] * u * Wd * 0.5 + fwd[0] * w * L, base.y + v * Hh * 0.5, base.z + rgt[1] * u * Wd * 0.5 + fwd[1] * w * L);
  const face = (pts: P2[]) => `M${pts.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}Z`;
  const back = [corner(-1, 1, 0), corner(1, 1, 0), corner(1, -1, 0), corner(-1, -1, 0)];
  const top = [corner(-1, 1, 0), corner(1, 1, 0), corner(1, 1, 1), corner(-1, 1, 1)];
  const side = pan >= 0 ? [corner(1, 1, 0), corner(1, 1, 1), corner(1, -1, 1), corner(1, -1, 0)] : [corner(-1, 1, 0), corner(-1, 1, 1), corner(-1, -1, 1), corner(-1, -1, 0)];
  const lens0 = P3(base.x + fwd[0] * L * 0.95, base.y - 4, base.z + fwd[1] * L * 0.95);
  const lens1 = P3(base.x + fwd[0] * (L + 70), base.y - 4, base.z + fwd[1] * (L + 70));
  const grip = P3(base.x + rgt[0] * Wd * 0.62 + fwd[0] * L * 0.62, base.y - Hh * 0.55, base.z + rgt[1] * Wd * 0.62 + fwd[1] * L * 0.62);
  const ring = P3(base.x + fwd[0] * (L + 10) - rgt[0] * 30, base.y - 26, base.z + fwd[1] * (L + 10) - rgt[1] * 30);
  const shR: P2 = [62, -372];
  const shL: P2 = [-62, -372];
  const armR = solveArm(shR, grip, RIG.upper, RIG.fore, 1);
  const armL = solveArm(shL, ring, RIG.upper, RIG.fore, -1);
  const sleeve = spec.top;
  const skin = mixHex(spec.skin, COLOR.shadow, 0.08);
  const tallyP = P3(base.x - rgt[0] * Wd * 0.3, base.y + Hh * 0.28, base.z - rgt[1] * Wd * 0.3 - 2);
  const R0 = R;
  const hairD = (() => {
    const a = 22 * D2R;
    const l: P2 = [hx - R0 * 1.04 * Math.cos(a), hy + R0 * 1.04 * Math.sin(a)];
    const r: P2 = [hx + R0 * 1.04 * Math.cos(a), hy + R0 * 1.04 * Math.sin(a)];
    return `M${f3(l[0])} ${f3(l[1])}A${f3(R0 * 1.04)} ${f3(R0 * 1.04)} 0 1 1 ${f3(r[0])} ${f3(r[1])}Q${f3(hx)} ${f3(hy + R0 * 0.62)} ${f3(l[0])} ${f3(l[1])}Z`;
  })();
  const kS = k * s;
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(s)})`}>
      <defs>
        <linearGradient id={`${uid}tp`} gradientUnits="userSpaceOnUse" x1="0" y1={-400} x2="0" y2={-160}>
          <stop offset="0" stopColor={topOf(spec.top)} />
          <stop offset="1" stopColor={footOf(spec.top)} />
        </linearGradient>
      </defs>
      <ellipse cx={14} cy={4} rx={90} ry={12} fill={COLOR.shadow} opacity={0.22} />
      {/* legs and shoes (their heels toward us) */}
      {[-1, 1].map((u) => (
        <g key={u}>
          <path d={`M${u * 30} -175L${u * 36} -14`} stroke={u < 0 ? farOf(spec.pants) : spec.pants} strokeWidth={42} strokeLinecap="round" fill="none" />
          <ellipse cx={u * 37} cy={-6} rx={27} ry={15} fill={spec.shoe ?? "#4A3326"} />
        </g>
      ))}
      {/* the arms reach forward into the scene: behind the back, showing past it */}
      <path d={`M${f3(shL[0])} ${f3(shL[1])}L${f3(armL.E[0])} ${f3(armL.E[1])}L${f3(armL.W[0])} ${f3(armL.W[1])}`} stroke={farOf(sleeve)} strokeWidth={RIG.armW - 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${f3(shR[0])} ${f3(shR[1])}L${f3(armR.E[0])} ${f3(armR.E[1])}L${f3(armR.W[0])} ${f3(armR.W[1])}`} stroke={farOf(sleeve)} strokeWidth={RIG.armW - 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* the lens hood (beyond the body) and the camera */}
      <path d={`M${f3(lens0[0])} ${f3(lens0[1])}L${f3(lens1[0])} ${f3(lens1[1])}`} stroke={CAM_DARK} strokeWidth={46} strokeLinecap="round" />
      <path d={face(side)} fill={mixHex(CAM_BODY, COLOR.shadow, 0.12)} />
      <path d={face(top)} fill={mixHex(CAM_BODY, LIGHT_TINT, 0.2)} />
      <circle cx={f3(armL.W[0])} cy={f3(armL.W[1])} r={RIG.hand} fill={farOf(spec.skin)} />
      {/* the torso (a bean seen from behind) and the neck */}
      <path d="M-62 -160C-74 -230 -86 -300 -82 -346C-78 -382 -42 -398 0 -398C42 -398 78 -382 82 -346C86 -300 74 -230 62 -160C40 -150 -40 -150 -62 -160Z" fill={`url(#${uid}tp)`} />
      <path d="M-30 -394C-14 -386 14 -386 30 -394" stroke={footOf(spec.top)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
      <rect x={hx - 20} y={hy + 30} width={40} height={44} rx={14} fill={footOf(spec.skin)} />
      {/* the head from behind: ears, the back of the hair, the headphones */}
      <circle cx={f3(hx)} cy={f3(hy)} r={R0} fill={spec.skin} />
      {[-1, 1].map((u) => (
        <circle key={u} cx={f3(hx + u * R0 * 0.98)} cy={f3(hy + 0.12 * R0)} r={0.2 * R0} fill={mixHex(spec.skin, COLOR.shadow, 0.06)} />
      ))}
      {spec.hairStyle === "pony" ? <path d={`M${f3(hx - 16)} ${f3(hy - 10)}C${f3(hx - 30)} ${f3(hy + 60)} ${f3(hx - 8)} ${f3(hy + 120)} ${f3(hx + 6)} ${f3(hy + 130)}C${f3(hx + 22)} ${f3(hy + 100)} ${f3(hx + 26)} ${f3(hy + 40)} ${f3(hx + 16)} ${f3(hy - 10)}Z`} fill={spec.hair} /> : null}
      <path d={hairD} fill={spec.hairStyle === "cap" ? spec.cap ?? spec.top : spec.hair} />
      {spec.hairStyle === "curly"
        ? [200, 230, 260, 290, 320, 350].map((a) => <circle key={a} cx={f3(hx + R0 * Math.cos(a * D2R))} cy={f3(hy + R0 * Math.sin(a * D2R))} r={0.3 * R0} fill={spec.hair} />)
        : null}
      {spec.hairStyle === "cap" ? <rect x={hx - 18} y={hy + 8} width={36} height={12} rx={6} fill={mixHex(spec.cap ?? spec.top, COLOR.shadow, 0.2)} /> : null}
      <path d={`M${f3(hx - R0 * 0.98)} ${f3(hy + 4)}A${f3(R0 * 1.02)} ${f3(R0 * 1.02)} 0 0 1 ${f3(hx + R0 * 0.98)} ${f3(hy + 4)}`} stroke={CAM_DARK} strokeWidth={12} fill="none" />
      {[-1, 1].map((u) => (
        <rect key={`c${u}`} x={f3(hx + u * R0 * 0.98 - 15)} y={f3(hy - 14)} width={30} height={46} rx={13} fill={CAM_DARK} />
      ))}
      {/* the camera's back (battery, the rear tally): nearest of the camera */}
      <path d={face(back)} fill={CAM_DARK} />
      <rect x={f3(back[3][0] + 12)} y={f3(back[0][1] + 30)} width={f3(Math.max(10, Math.abs(back[1][0] - back[0][0]) - 24))} height={30} rx={6} fill={mixHex(CAM_BODY, LIGHT_TINT, 0.12)} />
      <Tally cx={tallyP[0]} cy={tallyP[1]} r={12} kScreen={kS} minScreen={4.5} />
      {/* the shoulder pad under the camera, the near hand on the grip */}
      <path d={`M${f3(shR[0] - 24)} ${f3(shR[1] - 2)}Q${f3(shR[0])} ${f3(shR[1] - 24)} ${f3(shR[0] + 24)} ${f3(shR[1])}`} stroke={sleeve} strokeWidth={30} strokeLinecap="round" fill="none" />
      <circle cx={f3(armR.W[0])} cy={f3(armR.W[1])} r={RIG.hand} fill={skin} />
    </g>
  );
};
export { smoothstep };
