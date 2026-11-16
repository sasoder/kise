// ===========================================================================
// harbourWorld — THE HARBOUR of the Cheeky Pint S4E06 clip "nik - my job is detecting bullshit" (cut 20 RisingTide).
// A cute picture-book harbour at golden hour in the stout material: a stone harbour wall seen face-on, a row of small
// boats moored along it, cottages on the quay behind, hills, the golden-hour SKY of droneSeaShared, warm sage water,
// the kit's brown vignette and grain. Nothing black. The ONE amber thing is the painted target mark on the wall
// (a dashed level line + a bullseye): dull ochre paint until it is lit (lit 0..1 per x, from the cut).
//
//   HarbourStage   the whole frame: sky, clouds, hills, cottages, the wall (coping, stone courses, the wet band with
//                  its weed fringe), the boats' shadows on the wall, the painted mark (paint + the lit amber layer with
//                  its bloom and 2 px hot top edge), the ladder and rings, the water (surface gradient, the wall
//                  contact glint), the boats' reflections, ripples, the boats (clipped at the water), vignette, grain.
//   HarbourCam     { x, k, D, eye, hy }: a level pinhole camera (see below).
//   BOATS          the row (x = centre along the wall, metres); index 0 = ours (cream, with the sleeping crew).
//   waterAt(f)     the tide: the water's world y (metres, y down, 0 = the painted line) at frame f.
//   gunwaleLow(b)  a boat's lowest gunwale point above its waterline (its amidships freeboard), metres.
//
// UNITS. World metres. x runs along the wall (+ = right), y is DOWN with 0 = the painted line's centre, z is the depth
// from the boats' plane (0) toward the wall (+). THE CAMERA: eye at world height `eye`, distance D (m) in front of
// z = 0, looking straight at the wall; `k` = screen px per metre on z = 0; a plane at depth z scales by
// kz = k * D / (D + z); `x` = the world x on the frame's centre column; `hy` = the screen y of the eye level.
// Every boat floats on the same water: its waterline sits at waterAt(f) (+ its own small heave / roll).
// ===========================================================================
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ALPHA, COLOR, GRAIN, GROUND, VIGNETTE, bloomFilter, clamp01, lerp, mixHex } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { CLOTH, HAIR, SKIN } from "../nik-managers-underperformers/officeCast";
import { solveArm } from "../scott-free-wifi/cabinCast";

export type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `hb${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const D2R = Math.PI / 180;
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const LIGHT = "#FFF4E2";
const topOf = (c: string) => mixHex(c, LIGHT, 0.12);
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.14);

// --- the camera ------------------------------------------------------------------------------------------------
export type HarbourCam = { x: number; k: number; D: number; eye: number; hy: number };
export const kAt = (c: HarbourCam, z: number) => (c.k * c.D) / (c.D + z);
export const project = (c: HarbourCam, x: number, y: number, z: number): P2 => {
  const kz = kAt(c, z);
  return [540 + (x - c.x) * kz, c.hy + (y - c.eye) * kz];
};
/** SVG transform mapping plane z's world metres to the screen */
export const planeTf = (c: HarbourCam, z: number) => {
  const kz = kAt(c, z);
  return `matrix(${f3(kz)} 0 0 ${f3(kz)} ${f3(540 - c.x * kz)} ${f3(c.hy - c.eye * kz)})`;
};
/** hy for a camera whose painted line (y 0 on the wall) should sit at screen y `lineY` */
export const hyForLine = (k: number, D: number, eye: number, lineY: number) => lineY + eye * ((k * D) / (D + HARBOUR.wallZ));

// --- the harbour's layout ----------------------------------------------------------------------------------------
export const HARBOUR = {
  /** the wall face's depth behind the boats' plane */
  wallZ: 1.3,
  /** the quay's top (the coping's top edge) and the coping's height */
  quayY: -2.0,
  copingH: 0.22,
  /** stone courses: joints at courseY0 + n * courseH (the painted line sits mid-course) */
  courseY0: -0.22,
  courseH: 0.44,
  /** the top of the wet band (the usual high water): just under the painted line */
  wetTop: 0.2,
  /** the painted level line: thickness, dash, gap (metres) */
  line: { th: 0.12, dash: 0.72, gap: 0.34 },
  /** the painted bullseye on the line, beside our boat's stern */
  target: { x: 3.05, r: 0.27, ring: 0.075, dot: 0.1 },
  /** the iron ladder down the wall, beside our boat's bow */
  ladder: { x: -2.98, half: 0.19, rung: 0.3 },
  /** mooring rings on the wall */
  rings: [-6.2, -1.35, 1.6, 6.0, 10.6, -10.9, 15.2, -15.6],
  ringY: -1.2,
  /** the cottages stand this far behind the wall face; the hills far off */
  cottageZ: 5.8,
  hillZ: [90, 170] as const,
} as const;

/**
 * THE TIDE (director's option 3): a fast early rise that brings our gunwale up from `gap` below the painted line to
 * the line on `fCross`, blending (smoothstep over `blend`) into a slower STEADY rise that never stops, so that on the
 * last frame (`fEnd`) our gunwale is `clear` above the line. The water's speed: v(f) = v1 + (v0 - v1) * fall(f),
 * fall = 1 before the blend, 0 after it. v0 and v1 are solved from those two conditions (below), not hand-set.
 * Our freeboard OUR_F is chosen so the lit line stays OUR_F - clear (0.35 m) above the water on the last frame.
 */
export const OUR_F = 1.35;
export const TIDE = { gap: 0.65, clear: 1.0, fCross: 12.5, fEnd: 89, blend: [11, 20] as const } as const;
/** the integral of fall(f) from 0 to f (the smoothstep's closed-form integral inside the blend) */
const fallInt = (f: number) => {
  const [b0, b1] = TIDE.blend;
  if (f <= b0) return f;
  const L = b1 - b0;
  const u = Math.min(1, (f - b0) / L);
  return b0 + L * (u - u * u * u + (u * u * u * u) / 2);
};
const solveTide = () => {
  const { gap, clear, fCross, fEnd } = TIDE;
  // v1 * f + d * fallInt(f) = rise(f), d = v0 - v1: rise(fCross) = gap, rise(fEnd) = gap + clear
  const a1 = fCross, b1 = fallInt(fCross), a2 = fEnd, b2 = fallInt(fEnd);
  const det = a1 * b2 - a2 * b1;
  const v1 = (gap * b2 - (gap + clear) * b1) / det;
  const d = (a1 * (gap + clear) - a2 * gap) / det;
  return { v0: v1 + d, v1 };
};
export const TIDE_V = solveTide();
/** metres the water has risen by frame f */
export const riseAt = (f: number) => TIDE_V.v1 * f + (TIDE_V.v0 - TIDE_V.v1) * fallInt(f);
/** the water's world y at frame f (y down, 0 = the painted line); W0 = our freeboard + the opening gap */
export const waterAt = (f: number) => OUR_F + TIDE.gap - riseAt(f);

// --- the boats ---------------------------------------------------------------------------------------------------
export type BoatKind = "ours" | "row" | "cabin" | "sail";
export type BoatSpec = {
  kind: BoatKind;
  /** centre x along the wall (m) */
  x: number;
  /** length (m), amidships freeboard F (m), bow and stern rise above it (m) */
  L: number;
  F: number;
  bow: number;
  stern: number;
  /** bob phase */
  ph: number;
  /** hull card tone (board boats) */
  tone?: string;
};
/** index 0 is ours. Gaps: our boat has clear wall on both sides (the ladder left, the bullseye right). */
export const BOATS: BoatSpec[] = [
  { kind: "ours", x: 0, L: 5.0, F: OUR_F, bow: 0.3, stern: 0.14, ph: 0 },
  { kind: "cabin", x: -5.7, L: 3.6, F: 1.3, bow: 0.36, stern: 0.12, ph: 2.1 },
  { kind: "row", x: -9.2, L: 2.8, F: 1.25, bow: 0.3, stern: 0.14, ph: 4.0, tone: "#B39472" },
  { kind: "sail", x: -12.75, L: 3.6, F: 1.25, bow: 0.3, stern: 0.12, ph: 5.3 },
  { kind: "sail", x: 6.35, L: 3.5, F: 1.25, bow: 0.3, stern: 0.12, ph: 1.2 },
  { kind: "row", x: 9.9, L: 2.8, F: 1.25, bow: 0.3, stern: 0.14, ph: 3.3, tone: "#A88A69" },
  { kind: "cabin", x: 13.6, L: 4.0, F: 1.3, bow: 0.36, stern: 0.12, ph: 0.7 },
  { kind: "row", x: -18.3, L: 3.0, F: 1.25, bow: 0.26, stern: 0.14, ph: 2.8 },
  { kind: "row", x: 18.6, L: 3.0, F: 1.25, bow: 0.28, stern: 0.14, ph: 5.9 },
];
/** the x where the sheer is lowest (a little aft of the middle), boat-local */
const xmOf = (b: BoatSpec) => 0.04 * b.L;
/** the gunwale's height (boat-local y, up negative) at boat-local x */
export const sheerY = (b: BoatSpec, x: number) => {
  const h = b.L / 2;
  const xm = xmOf(b);
  const ub = Math.max(0, (xm - x) / (xm + h));
  const us = Math.max(0, (x - xm) / (h - xm));
  return -(b.F + b.bow * ub * ub + b.stern * us * us);
};
export const gunwaleLow = (b: BoatSpec) => b.F;
/** a boat's bob: heave (m, + = down) and roll (deg) */
export const bobAt = (b: BoatSpec, f: number) => ({
  heave: 0.02 * Math.sin((f * 2 * Math.PI) / 54 + b.ph) + 0.008 * Math.sin((f * 2 * Math.PI) / 29 + 2 * b.ph),
  roll: 0.5 * Math.sin((f * 2 * Math.PI) / 63 + 1.3 * b.ph),
});

const hullD = (b: BoatSpec) => {
  const h = b.L / 2;
  const rake = 0.5 * b.F;
  const keel = 0.14;
  const pts: P2[] = [];
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const x = lerp(h, -h, i / N);
    pts.push([x, sheerY(b, x)]);
  }
  const bowTop = pts[pts.length - 1];
  const stemFoot: P2 = [-h + rake, keel];
  const sternFoot: P2 = [h - 0.12, keel];
  return (
    `M${pts.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}` +
    `C${f3(bowTop[0] + 0.02)} ${f3(bowTop[1] * 0.35)} ${f3(-h + rake * 0.35)} ${f3(keel)} ${f3(stemFoot[0])} ${f3(stemFoot[1])}` +
    `L${f3(sternFoot[0])} ${f3(sternFoot[1])}Z`
  );
};
/** a line following the sheer, offset down by `off` (m), across the hull's whole length (clip it to the hull) */
const sheerLineD = (b: BoatSpec, off: number, up = 0) => {
  const h = b.L / 2;
  const pts: string[] = [];
  const N = 30;
  for (let i = 0; i <= N; i++) {
    const x = lerp(-h - 0.3, h + 0.3, i / N);
    const u = clamp01((x + h) / b.L);
    pts.push(`${f3(x)} ${f3(sheerY(b, Math.max(-h, Math.min(h, x))) + off - up * Math.sin(Math.PI * u))}`);
  }
  return `M${pts.join("L")}`;
};
/** the far side's inner face seen over the near gunwale (the eye is a little above the boats) */
const interiorD = (b: BoatSpec, lift: number) => {
  const h = b.L / 2;
  const N = 30;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = lerp(-h, h, i / N);
    const u = i / N;
    const y = sheerY(b, x);
    top.push(`${f3(x)} ${f3(y - lift * Math.pow(Math.sin(Math.PI * u), 0.7))}`);
    bot.push(`${f3(x)} ${f3(y + 0.02)}`);
  }
  return `M${top.join("L")}L${bot.reverse().join("L")}Z`;
};

// ---------------------------------------------------------------------------
// THE CREW — picture-book card figures on the officeCast / cabinCast look (big round head with a nose bump, one
// eye — closed: they are asleep — a tiny mouth, a blush dot, simple hair, a bean torso), flat matte fills with a soft
// top-lit ramp per part, NO outlines. Rig units as cabinCast (head R 60), facing LEFT; drawn at U metres per unit.
// ---------------------------------------------------------------------------
const U = 0.005;
const R = 60;
const RIG = { head: [-40, -270] as P2, neck: [-30, -200] as P2, shoulder: [-40, -178] as P2, armW: 38, hand: 15 } as const;
const TORSO_D = "M14 6C22 -56 22 -132 6 -176C-4 -204 -50 -212 -74 -196C-98 -178 -100 -126 -94 -76C-90 -34 -80 -2 -58 6Z";
const rot = (p: P2, deg: number, o: P2 = [0, 0]): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
const polar = (r: number, deg: number): P2 => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
const arcPts = (r: number, a0: number, a1: number, n = 24) => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) out.push(polar(r, lerp(a0, a1, i / n)));
  return out;
};
const ptsD = (pts: P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${f3(p[0])} ${f3(p[1])}`).join("");
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;
const cropD = (r: number) =>
  ptsD(arcPts(r * 1.07, 212, 402)) +
  `C${f3(0.62 * r)} ${f3(0.42 * r)} ${f3(0.3 * r)} ${f3(0.3 * r)} ${f3(0.22 * r)} ${f3(0.05 * r)}` +
  `C${f3(0.12 * r)} ${f3(-0.28 * r)} ${f3(-0.3 * r)} ${f3(-0.42 * r)} ${f3(-0.66 * r)} ${f3(-0.5 * r)}Z`;
const curlyD = (r: number) => [cropD(r), ...[214, 238, 262, 286, 310, 334, 358, 382].map((a) => circleD(...polar(1.0 * r, a), 0.27 * r))];
/** a knitted fisherman's beanie: a dome over the crown and a turned-up band */
const beanieD = (r: number) => ({
  dome: ptsD(arcPts(r * 1.1, 188, 352, 28)) + "Z",
  band: `M${f3(-1.16 * r)} ${f3(-0.36 * r)}L${f3(1.16 * r)} ${f3(-0.36 * r)}L${f3(1.12 * r)} ${f3(-0.08 * r)}L${f3(-1.12 * r)} ${f3(-0.08 * r)}Z`,
});

type Look = { skin: string; hair: string; top: string; pants: string; shoe: string; hat?: string; curly?: boolean };
export const CREW_LOOKS: { a: Look; b: Look } = {
  a: { skin: SKIN.light, hair: HAIR.chestnut, top: CLOTH.sage, pants: CLOTH.denim, shoe: "#7A5640", curly: true },
  b: { skin: SKIN.tan, hair: HAIR.ink, top: CLOTH.slate, pants: CLOTH.brown, shoe: "#5A3F2E", hat: CLOTH.rust },
};

const SleepHead: React.FC<{ look: Look; uid: string; mouth: "o" | "flat" }> = ({ look, uid, mouth }) => {
  const eye: P2 = [-0.5 * R, -0.08 * R];
  const ink = mixHex(COLOR.inkDark, look.skin, 0.25);
  const hat = look.hat ? beanieD(R) : null;
  return (
    <g>
      <path d={circleD(0, 0, R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R)} fill={`url(#${uid}sk)`} />
      <circle cx={f3(0.16 * R)} cy={f3(0.1 * R)} r={f3(0.15 * R)} fill={mixHex(look.skin, COLOR.shadow, 0.08)} />
      <circle cx={f3(-0.42 * R)} cy={f3(0.3 * R)} r={f3(0.14 * R)} fill="#D9846E" opacity={0.3} />
      {/* the closed eye: a sleeping arc */}
      <path
        d={`M${f3(eye[0] - 0.15 * R)} ${f3(eye[1] - 0.01 * R)}Q${f3(eye[0])} ${f3(eye[1] + 0.13 * R)} ${f3(eye[0] + 0.15 * R)} ${f3(eye[1] - 0.01 * R)}`}
        stroke={COLOR.inkDark}
        strokeWidth={4.2}
        strokeLinecap="round"
        fill="none"
      />
      {mouth === "o" ? (
        <ellipse cx={f3(-0.74 * R)} cy={f3(0.48 * R)} rx={f3(0.075 * R)} ry={f3(0.1 * R)} fill={mixHex(COLOR.inkDark, look.skin, 0.2)} />
      ) : (
        <path d={`M${f3(-0.88 * R)} ${f3(0.45 * R)}Q${f3(-0.76 * R)} ${f3(0.49 * R)} ${f3(-0.62 * R)} ${f3(0.44 * R)}`} stroke={ink} strokeWidth={3.6} strokeLinecap="round" fill="none" />
      )}
      {hat ? (
        <g>
          <path d={cropD(R)} fill={`url(#${uid}hr)`} />
          <path d={hat.dome} fill={`url(#${uid}ht)`} />
          <path d={hat.band} fill={mixHex(look.hat!, COLOR.shadow, 0.12)} />
          <path d={`M${f3(-1.1 * R)} ${f3(-0.33 * R)}L${f3(1.1 * R)} ${f3(-0.33 * R)}`} stroke={topOf(look.hat!)} strokeWidth={3} opacity={0.6} />
        </g>
      ) : (
        (look.curly ? curlyD(R) : [cropD(R)]).map((d, i) => <path key={i} d={d} fill={`url(#${uid}hr)`} />)
      )}
    </g>
  );
};

const Ramps: React.FC<{ uid: string; look: Look }> = ({ uid, look }) => {
  const g = (id: string, c: string, y0: number, y1: number) => (
    <linearGradient id={`${uid}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
      <stop offset="0" stopColor={topOf(c)} />
      <stop offset="1" stopColor={footOf(c)} />
    </linearGradient>
  );
  return (
    <defs>
      {g("sk", look.skin, -R, R)}
      {g("hr", look.hair, -1.2 * R, 1.2 * R)}
      {g("ht", look.hat ?? look.hair, -1.2 * R, 0)}
      {g("tp", look.top, -210, 10)}
      {g("pt", look.pants, -60, 60)}
    </defs>
  );
};

/** the shoe: heel at (0,0), sole along -x (rig units, facing left), toe turned up */
const SHOE_D = "M8 4C10 -16 -6 -30 -30 -30L-62 -30C-80 -30 -92 -22 -92 -8C-92 4 -82 10 -66 10L0 10C6 10 8 8 8 4Z";

/**
 * Sleeper A — reclined against the stern, face to the sky, mouth open; his near arm laid along the gunwale with the
 * hand hanging over the side; his feet up on the gunwale amidships, ankles crossed. Placed in boat-local metres:
 * `hip` (inside the hull), `heel` (the near heel's contact on the gunwale top), `elbow` (on the gunwale top),
 * `hand` (hanging outside). `layer`: "back" draws legs + torso + head (behind the near hull side), "front" the arm and
 * the shoes (over the gunwale).
 */
export const SleeperA: React.FC<{ hip: P2; heel: P2; elbow: P2; hand: P2; breath: number; layer: "back" | "front"; look?: Look }> = ({
  hip,
  heel,
  elbow,
  hand,
  breath,
  layer,
  look = CREW_LOOKS.a,
}) => {
  const uid = uidOf(useId());
  const lean = 47 + 1.4 * breath;
  const tilt = -6 + 0.6 * breath;
  const toRig = (p: P2): P2 => [(p[0] - hip[0]) / U, (p[1] - hip[1]) / U];
  const S = rot(RIG.shoulder, lean);
  const neck = rot(RIG.neck, lean);
  const headC = rot(rot(RIG.head, lean), tilt, neck);
  const hl = toRig(heel);
  const E = toRig(elbow);
  const W = toRig(hand);
  // the legs: hip joint to the near ankle (just above the heel), knee bent up a little (hidden by the hull)
  const ankN: P2 = [hl[0] + 6, hl[1] - 16];
  const ankF: P2 = [hl[0] + 22, hl[1] - 24];
  const LN = solveArm([-6, -14], ankN, 150, 150, 1);
  const LF = solveArm([-2, -22], ankF, 150, 150, 1);
  const pant = look.pants;
  const tf = `translate(${f3(hip[0])} ${f3(hip[1])}) scale(${U})`;
  if (layer === "back")
    return (
      <g transform={tf}>
        <Ramps uid={uid} look={look} />
        <path d={`M-2 -22L${f3(LF.E[0])} ${f3(LF.E[1])}L${f3(LF.W[0])} ${f3(LF.W[1])}`} stroke={footOf(pant)} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={`M-6 -14L${f3(LN.E[0])} ${f3(LN.E[1])}L${f3(LN.W[0])} ${f3(LN.W[1])}`} stroke={pant} strokeWidth={54} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <g transform={`rotate(${f3(lean)})`}>
          <path d={TORSO_D} fill={`url(#${uid}tp)`} />
        </g>
        <path d={`M${f3(S[0])} ${f3(S[1])}L${f3(neck[0])} ${f3(neck[1])}`} stroke={mixHex(look.skin, COLOR.shadow, 0.1)} strokeWidth={30} strokeLinecap="round" />
        <g transform={`translate(${f3(headC[0])} ${f3(headC[1])}) rotate(${f3(lean + tilt)})`}>
          <SleepHead look={look} uid={uid} mouth="o" />
        </g>
      </g>
    );
  // front: the far shoe (darker) behind the near one, both resting heel-down on the gunwale, toes up and forward
  const shoe = look.shoe;
  return (
    <g transform={tf}>
      <g transform={`translate(${f3(hl[0] + 20)} ${f3(hl[1] - 10)}) rotate(-58)`}>
        <path d={SHOE_D} fill={mixHex(shoe, COLOR.shadow, 0.22)} />
        <path d="M6 4L6 10L-66 10C-82 10 -92 4 -92 -8L-84 -6C-82 0 -76 3 -66 3Z" fill={mixHex("#E8D9BF", COLOR.shadow, 0.22)} />
      </g>
      <g transform={`translate(${f3(hl[0])} ${f3(hl[1])}) rotate(-38)`}>
        <path d={SHOE_D} fill={shoe} />
        <path d="M6 4L6 10L-66 10C-82 10 -92 4 -92 -8L-84 -6C-82 0 -76 3 -66 3Z" fill="#E8D9BF" />
        <path d="M-62 -30L-30 -30" stroke={topOf(shoe)} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      </g>
      {/* the near arm: shoulder -> elbow on the gunwale -> forearm hanging over the side */}
      <path d={`M${f3(S[0])} ${f3(S[1])}L${f3(E[0])} ${f3(E[1])}`} stroke={look.top} strokeWidth={RIG.armW} strokeLinecap="round" fill="none" />
      <path d={`M${f3(E[0])} ${f3(E[1])}L${f3(W[0])} ${f3(W[1])}`} stroke={mixHex(look.top, COLOR.shadow, 0.04)} strokeWidth={RIG.armW - 2} strokeLinecap="round" fill="none" />
      <path
        d={`M${f3(W[0] + (E[0] - W[0]) * 0.16)} ${f3(W[1] + (E[1] - W[1]) * 0.16)}L${f3(W[0])} ${f3(W[1])}`}
        stroke={mixHex(look.top, COLOR.shadow, 0.12)}
        strokeWidth={RIG.armW - 1}
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx={f3(W[0])} cy={f3(W[1] + 10)} rx={14} ry={18} fill={mixHex(look.skin, COLOR.shadow, 0.05)} />
    </g>
  );
};

/** Sleeper B — sitting at the bow, slumped, chin on his chest, arms folded (below the gunwale); faces RIGHT. */
export const SleeperB: React.FC<{ hip: P2; breath: number; look?: Look }> = ({ hip, breath, look = CREW_LOOKS.b }) => {
  const uid = uidOf(useId());
  const lean = -9 - 1.2 * breath;
  const tilt = -22 + 0.8 * breath;
  const S = rot(RIG.shoulder, lean);
  const neck = rot(RIG.neck, lean);
  const headC = rot(rot(RIG.head, lean), tilt, neck);
  return (
    <g transform={`translate(${f3(hip[0])} ${f3(hip[1])}) scale(${-U} ${U})`}>
      <Ramps uid={uid} look={look} />
      <g transform={`rotate(${f3(lean)})`}>
        <path d={TORSO_D} fill={`url(#${uid}tp)`} />
        <path d="M-70 -196C-52 -186 -30 -186 -12 -198" stroke={footOf(look.top)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
      </g>
      <path d={`M${f3(S[0] + 20)} ${f3(S[1])}L${f3(neck[0])} ${f3(neck[1])}`} stroke={mixHex(look.skin, COLOR.shadow, 0.1)} strokeWidth={28} strokeLinecap="round" />
      <g transform={`translate(${f3(headC[0])} ${f3(headC[1])}) rotate(${f3(lean + tilt)})`}>
        <SleepHead look={look} uid={uid} mouth="flat" />
      </g>
    </g>
  );
};

/** our crew's placement in our boat (boat-local metres), derived from the hull so the contacts sit on the gunwale */
export const crewPlacement = (b: BoatSpec) => {
  const heelX = -0.12;
  const elbowX = 1.28;
  const elbowY = sheerY(b, elbowX) - 0.085;
  return {
    hipA: [1.42, -0.77] as P2,
    heel: [heelX, sheerY(b, heelX) - 0.035] as P2,
    elbow: [elbowX, elbowY] as P2,
    hand: [elbowX - 0.06, elbowY + 0.4] as P2,
    hipB: [-1.62, -0.71] as P2,
  };
};

// ---------------------------------------------------------------------------
// A BOAT (boat-local metres, waterline y 0, bow LEFT). Ours is cream (the subject), the rest board (context).
// ---------------------------------------------------------------------------
export const Boat: React.FC<{ b: BoatSpec; breath?: number }> = ({ b, breath = 0 }) => {
  const uid = uidOf(useId());
  const ours = b.kind === "ours";
  const base = ours ? COLOR.cream : b.tone ?? COLOR.board;
  const foot = ours ? COLOR.creamFoot : mixHex(b.tone ?? COLOR.boardFoot, COLOR.shadow, 0.06);
  const rail = ours ? mixHex(COLOR.board, COLOR.inkDark, 0.28) : mixHex(base, COLOR.shadow, 0.3);
  const inner = ours ? mixHex(COLOR.creamFoot, COLOR.shadow, 0.2) : mixHex(foot, COLOR.shadow, 0.26);
  const strake = ours ? mixHex(COLOR.creamFoot, COLOR.shadow, 0.22) : mixHex(foot, COLOR.shadow, 0.16);
  const h = b.L / 2;
  const top = -(b.F + b.bow);
  const hull = hullD(b);
  const crew = ours ? crewPlacement(b) : null;
  // the far side's inner face: lift grows with the beam (a little more for the bigger boats)
  const lift = 0.06 + 0.012 * b.L;
  const rig: React.ReactNode[] = [];
  if (b.kind === "cabin") {
    // a little wheelhouse aft of the middle, a short mast on its roof
    const x0 = -0.05 * b.L;
    const x1 = x0 + 0.34 * b.L;
    const yb = sheerY(b, (x0 + x1) / 2) + 0.05;
    const hh = 0.95;
    const wall = mixHex(base, COLOR.cream, 0.18);
    rig.push(
      <g key="wh">
        <rect x={f3(x0 + 0.1)} y={f3(yb - hh - 1.0)} width={0.05} height={1.05} fill={rail} />
        <rect x={f3(x0)} y={f3(yb - hh)} width={f3(x1 - x0)} height={f3(hh)} fill={wall} />
        <rect x={f3(x0)} y={f3(yb - hh)} width={f3(x1 - x0)} height={f3(hh * 0.18)} fill={topOf(wall)} opacity={0.6} />
        <rect x={f3(x0 + 0.14)} y={f3(yb - hh + 0.2)} width={f3((x1 - x0) * 0.32)} height={0.32} rx={0.04} fill={mixHex(base, COLOR.shadow, 0.42)} />
        <rect x={f3(x0 + 0.24 + (x1 - x0) * 0.32)} y={f3(yb - hh + 0.2)} width={f3((x1 - x0) * 0.32)} height={0.32} rx={0.04} fill={mixHex(base, COLOR.shadow, 0.42)} />
        <rect x={f3(x0 - 0.1)} y={f3(yb - hh - 0.1)} width={f3(x1 - x0 + 0.2)} height={0.12} rx={0.03} fill={rail} />
      </g>,
    );
  }
  if (b.kind === "sail") {
    // a mast, the boom with the sail furled along it, a forestay to the bow
    const mx = -0.14 * b.L;
    const mTop = -(b.F + 4.1);
    const boomY = -(b.F + 0.62);
    const bx1 = mx + 0.62 * b.L;
    const mastC = mixHex(base, COLOR.shadow, 0.34);
    rig.push(
      <g key="sl">
        <path d={`M${f3(mx)} ${f3(mTop + 0.1)}L${f3(-h + 0.02)} ${f3(top + 0.02)}`} stroke={mastC} strokeWidth={0.022} opacity={0.85} />
        <rect x={f3(mx - 0.035)} y={f3(mTop)} width={0.07} height={f3(-mTop - 0.3)} fill={mastC} />
        <rect x={f3(mx)} y={f3(boomY - 0.03)} width={f3(bx1 - mx)} height={0.06} fill={mastC} />
        <rect x={f3(mx + 0.04)} y={f3(boomY - 0.2)} width={f3(bx1 - mx - 0.12)} height={0.2} rx={0.1} fill={mixHex(COLOR.board, COLOR.cream, 0.32)} />
        <rect x={f3(mx + 0.04)} y={f3(boomY - 0.2)} width={f3(bx1 - mx - 0.12)} height={0.05} rx={0.025} fill={LIGHT} opacity={0.3} />
      </g>,
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2="0">
          <stop offset="0" stopColor={topOf(base)} />
          <stop offset="1" stopColor={footOf(foot)} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <path d={hull} />
        </clipPath>
      </defs>
      {rig}
      {/* the far side's inner face over the near gunwale */}
      <path d={interiorD(b, lift)} fill={inner} />
      <path d={sheerLineD(b, 0, lift)} stroke={rail} strokeWidth={0.05} fill="none" clipPath={undefined} opacity={0.9} />
      {crew ? <SleeperB hip={crew.hipB} breath={breath} /> : null}
      {crew ? <SleeperA hip={crew.hipA} heel={crew.heel} elbow={crew.elbow} hand={crew.hand} breath={breath} layer="back" /> : null}
      {/* the near hull side */}
      <path d={hull} fill={`url(#${uid}h)`} />
      <g clipPath={`url(#${uid}c)`}>
        {[0.3, 0.6, 0.9].map((o, i) => (
          <g key={i}>
            <path d={sheerLineD(b, o)} stroke={strake} strokeWidth={0.028} fill="none" opacity={0.75} />
            <path d={sheerLineD(b, o + 0.03)} stroke={LIGHT} strokeWidth={0.02} fill="none" opacity={ours ? 0.35 : 0.18} />
          </g>
        ))}
      </g>
      {/* the cap rail along the gunwale, its lit top */}
      <path d={sheerLineD(b, 0.02)} stroke={rail} strokeWidth={0.075} fill="none" strokeLinecap="round" clipPath={`url(#${uid}c)`} />
      <path d={sheerLineD(b, -0.005)} stroke={LIGHT} strokeWidth={0.02} fill="none" opacity={ours ? 0.55 : 0.3} clipPath={`url(#${uid}c)`} />
      {crew ? <SleeperA hip={crew.hipA} heel={crew.heel} elbow={crew.elbow} hand={crew.hand} breath={breath} layer="front" /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STAGE
// ---------------------------------------------------------------------------
export const WATER = {
  far: mixHex("#A9C7B4", SKY.glow, 0.34),
  mid: mixHex("#7FA295", SKY.low, 0.12),
  near: mixHex("#5F877D", COLOR.shadow, 0.12),
  glint: "#F6EAD2",
} as const;
export const STONE = {
  face: "#806B58",
  faceLit: "#8D7864",
  joint: "#66554A",
  wet: "#5E4F43",
  wetJoint: "#4C4038",
  weed: "#686A41",
  weedLit: "#7E7F4C",
  coping: "#B5A28A",
  copingFace: "#9A8671",
  iron: "#56402F",
  ironLit: "#7C6250",
  paint: "#B0915E",
} as const;
const COTTAGE = {
  walls: ["#C9876A", "#E0CDAA", "#A3A57B", "#9C8778", "#A97E86", "#DAC7A4", "#B89272"],
  roofs: ["#7C5543", "#8D5B45", "#6E5A4B", "#7A6152"],
  window: "#5E4535",
  door: "#6B4A37",
} as const;
const CLOUDS = [
  { x: 120, h: 640, w: 440, t: 26, a: 0.3, v: 0.16 },
  { x: 860, h: 560, w: 520, t: 22, a: 0.26, v: 0.12 },
  { x: 480, h: 460, w: 620, t: 18, a: 0.26, v: 0.1 },
  { x: 1240, h: 760, w: 480, t: 16, a: 0.24, v: 0.08 },
];

export type HarbourStageProps = {
  S: number;
  cam: HarbourCam;
  /** the water's world y (m) */
  water: number;
  /** how lit the painted mark is at world x (0 paint .. 1 amber) */
  litAt: (x: number) => number;
  /** the boats with their bob already applied: spec + heave + roll; breath for ours */
  boats: { b: BoatSpec; heave: number; roll: number; breath?: number }[];
};

export const HarbourStage: React.FC<HarbourStageProps> = ({ S, cam: c, water, litAt, boats }) => {
  const uid = uidOf(useId());
  const H = HARBOUR;
  const kw = kAt(c, H.wallZ);
  const P = (x: number, y: number, z: number) => project(c, x, y, z);
  /** the world x range visible on plane z (+ margin in screen px) */
  const xr = (z: number, margin = 120): [number, number] => {
    const s = kAt(c, z);
    return [c.x - (540 + margin) / s, c.x + (540 + margin) / s];
  };
  const [wx0, wx1] = xr(H.wallZ, 160);
  const yQuay = P(0, H.quayY, H.wallZ)[1];
  const yCopeB = P(0, H.quayY + H.copingH, H.wallZ)[1];
  const yWall = P(0, water, H.wallZ)[1]; // the water against the wall
  const yWet = P(0, H.wetTop, H.wallZ)[1];
  const yWater0 = P(0, water, 0)[1]; // the water at the boats
  const hor = c.hy;

  // --- sky -------------------------------------------------------------------------------------------------------
  const sky = (
    <g key="sky">
      <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, yQuay + 120))} fill={`url(#${uid}sky)`} />
      <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, yQuay + 120))} fill={`url(#${uid}sun)`} />
      <g style={{ filter: "blur(16px)" }}>
        {CLOUDS.map((q, i) => {
          const cx = ((q.x + S * q.v - c.x * 4) % 1700 + 1700) % 1700 - 300;
          return <ellipse key={i} cx={f3(cx)} cy={f3(hor - q.h * Math.sqrt(c.k / 60))} rx={q.w} ry={q.t} fill={q.h > 520 ? SKY.cloudHi : SKY.cloudLo} opacity={q.a} />;
        })}
      </g>
    </g>
  );

  // --- hills (two hazed ridges far behind the town) ---------------------------------------------------------------
  const ridge = (z: number, seed: number, hBase: number, hVar: number, col: string, key: string) => {
    const s = kAt(c, z);
    const [a, b] = xr(z, 200);
    const step = 6;
    const pts: string[] = [];
    for (let x = Math.floor(a / step) * step; x <= b + step; x += step) {
      const n = x / step;
      const hh = hBase + hVar * (0.5 * Math.sin(n * 0.21 + seed) + 0.3 * Math.sin(n * 0.53 + seed * 2.1) + 0.2 * Math.sin(n * 1.31 + seed * 0.7));
      const [sx, sy] = P(x, -hh, z);
      pts.push(`${f3(sx)} ${f3(sy)}`);
    }
    const yb = P(0, 2, z)[1] + 40;
    return (
      <path key={key} d={`M${f3(P(a, 0, z)[0] - 60)} ${f3(yb)}L${pts.join("L")}L${f3(P(b + step, 0, z)[0] + 60)} ${f3(yb)}Z`} fill={col} style={{ filter: `blur(${f3(Math.max(0.5, 0.8 * s * 0.1))}px)` }} />
    );
  };
  const hills = (
    <g key="hills">
      {ridge(H.hillZ[1], 1.7, 34, 12, mixHex("#9C8E68", SKY.haze, 0.62), "h2")}
      {ridge(H.hillZ[0], 4.2, 17, 7, mixHex("#878559", SKY.haze, 0.45), "h1")}
    </g>
  );

  // --- the cottages on the quay -----------------------------------------------------------------------------------
  const cz = H.cottageZ;
  const ck = kAt(c, cz);
  const HOUSES = [
    { x: 0, w: 4.2, h: 3.4, roof: 1.9, gable: true },
    { x: 4.5, w: 3.4, h: 4.3, roof: 1.3, gable: false },
    { x: 8.2, w: 5.0, h: 3.1, roof: 2.0, gable: true },
    { x: 13.5, w: 3.6, h: 3.9, roof: 1.6, gable: false },
    { x: 17.4, w: 4.4, h: 3.3, roof: 2.1, gable: true },
    { x: 22.1, w: 3.3, h: 4.5, roof: 1.3, gable: false },
  ];
  const TL = 26;
  const haze = (col: string) => mixHex(mixHex(col, "#C3A383", 0.22), SKY.haze, 0.2);
  const cottages: React.ReactNode[] = [];
  {
    const [a, b] = xr(cz, 300);
    for (let n = Math.floor(a / TL) - 1; n <= Math.floor(b / TL) + 1; n++)
      HOUSES.forEach((hs, i) => {
        const x0 = n * TL + hs.x - 13;
        if (x0 + hs.w < a || x0 > b) return;
        const id = Math.abs(n * 7 + i);
        const wallC = haze(COTTAGE.walls[id % COTTAGE.walls.length]);
        const roofC = haze(COTTAGE.roofs[(id * 3) % COTTAGE.roofs.length]);
        const yb = H.quayY + 0.4;
        const ye = H.quayY - hs.h;
        const [X0, Y0] = P(x0, yb, cz);
        const [X1, Ye] = P(x0 + hs.w, ye, cz);
        const Yr = P(0, ye - hs.roof, cz)[1];
        const ov = 0.25 * ck;
        const roof = hs.gable
          ? `M${f3(X0 - ov)} ${f3(Ye + ov * 0.4)}L${f3((X0 + X1) / 2)} ${f3(Yr)}L${f3(X1 + ov)} ${f3(Ye + ov * 0.4)}Z`
          : `M${f3(X0 - ov)} ${f3(Ye + ov * 0.3)}L${f3(X0 + ov * 1.6)} ${f3(Yr)}L${f3(X1 - ov * 1.6)} ${f3(Yr)}L${f3(X1 + ov)} ${f3(Ye + ov * 0.3)}Z`;
        const win = haze(COTTAGE.window);
        const wins: React.ReactNode[] = [];
        const floors = hs.h > 3.6 ? [1.0, 2.6] : [1.1, 2.4];
        floors.forEach((fy, j) => {
          const cols = hs.w > 4 ? [0.22, 0.5, 0.78] : [0.3, 0.7];
          cols.forEach((u, q) => {
            if (j === 0 && q === Math.floor(cols.length / 2) && cols.length === 3) return; // the door's place
            const [wx, wy] = P(x0 + u * hs.w - 0.3, H.quayY - fy - 0.35, cz);
            wins.push(<rect key={`w${j}_${q}`} x={f3(wx)} y={f3(wy)} width={f3(0.6 * ck)} height={f3(0.7 * ck)} fill={win} />);
            wins.push(<rect key={`s${j}_${q}`} x={f3(wx - 0.06 * ck)} y={f3(wy + 0.7 * ck)} width={f3(0.72 * ck)} height={f3(0.08 * ck)} fill={haze("#EADCC3")} />);
          });
        });
        const [dx, dy] = P(x0 + hs.w * 0.5 - 0.42, H.quayY - 1.9, cz);
        const chim = hs.gable ? null : <rect x={f3(X1 - ov * 3.2)} y={f3(Yr - 0.6 * ck)} width={f3(0.4 * ck)} height={f3(0.7 * ck)} fill={roofC} />;
        cottages.push(
          <g key={`${n}_${i}`}>
            {chim}
            <rect x={f3(X0)} y={f3(Ye)} width={f3(X1 - X0)} height={f3(Y0 - Ye)} fill={wallC} />
            <rect x={f3(X0)} y={f3(Ye)} width={f3(Math.max(1, 0.18 * ck))} height={f3(Y0 - Ye)} fill={LIGHT} opacity={0.18} />
            <path d={roof} fill={roofC} />
            {wins}
            {hs.w > 4 ? <rect x={f3(dx)} y={f3(dy)} width={f3(0.84 * ck)} height={f3(1.9 * ck)} fill={haze(COTTAGE.door)} /> : null}
          </g>,
        );
      });
  }

  // --- the wall ------------------------------------------------------------------------------------------------------
  const X = (x: number) => P(x, 0, H.wallZ)[0];
  const Y = (y: number) => P(0, y, H.wallZ)[1];
  const blocks: React.ReactNode[] = [];
  const BL = 9.6;
  for (let ci = -4; ci <= 6; ci++) {
    const y0 = Math.max(H.quayY + H.copingH, H.courseY0 + ci * H.courseH);
    const y1 = H.courseY0 + (ci + 1) * H.courseH;
    if (y1 <= y0) continue;
    if (Y(y0) > yWall + 2) continue;
    // staggered blocks: lengths from a hash, per course, tiled every BL
    const lens: number[] = [];
    let acc = 0;
    let q = 0;
    while (acc < BL - 0.5) {
      const l = 0.75 + 0.6 * hash(ci * 31 + q * 7.3);
      lens.push(Math.min(l, BL - acc));
      acc += l;
      q++;
    }
    lens[lens.length - 1] += BL - acc;
    const off = (ci % 2) * 0.47;
    for (let n = Math.floor((wx0 - off) / BL) - 1; n <= Math.floor((wx1 - off) / BL) + 1; n++) {
      let bx = n * BL + off;
      lens.forEach((l, j) => {
        const a = bx;
        bx += l;
        if (bx < wx0 || a > wx1) return;
        const wet = y0 >= H.wetTop - 0.01 ? 1 : y1 > H.wetTop ? 0.5 : 0;
        const t = hash(n * 13.1 + j * 3.7 + ci * 1.9) - 0.5;
        const fill = mixHex(wet ? STONE.wet : STONE.face, t > 0 ? LIGHT : COLOR.shadow, Math.abs(t) * 0.16);
        const ya = Y(y0);
        const yb = Y(y1);
        blocks.push(<rect key={`${ci}_${n}_${j}`} x={f3(X(a) + 0.6)} y={f3(ya + 0.6)} width={f3(Math.max(0, X(bx) - X(a) - 1.2))} height={f3(Math.max(0, yb - ya - 1.2))} rx={f3(0.03 * kw)} fill={fill} />);
      });
    }
  }
  const wallBack = (
    <g key="wall">
      <rect x={-60} y={f3(yCopeB)} width={1200} height={f3(Math.max(0, yWall + 40 - yCopeB))} fill={STONE.joint} />
      {/* the wet band behind the blocks' joints */}
      <rect x={-60} y={f3(yWet)} width={1200} height={f3(Math.max(0, yWall + 40 - yWet))} fill={STONE.wetJoint} />
      {blocks}
      {/* the wet band: darker toward the water, its top a weed fringe */}
      <rect x={-60} y={f3(yWet)} width={1200} height={f3(Math.max(0, yWall + 40 - yWet))} fill={`url(#${uid}wet)`} />
      {(() => {
        const items: string[] = [];
        const step = 0.16;
        for (let x = Math.floor(wx0 / step) * step; x <= wx1 + step; x += step) {
          const n = Math.round(x / step);
          const hh = 0.04 + 0.11 * hash(n * 1.37);
          items.push(`${f3(X(x))} ${f3(Y(H.wetTop + hh))}`);
          items.push(`${f3(X(x + step * 0.5))} ${f3(Y(H.wetTop + 0.02))}`);
        }
        return <path d={`M${f3(X(wx0) - 20)} ${f3(Y(H.wetTop - 0.01))}L${items.join("L")}L${f3(X(wx1 + 0.4) + 20)} ${f3(Y(H.wetTop - 0.01))}Z`} fill={STONE.weed} opacity={0.9} />;
      })()}
      {/* the coping: a lit top edge and its face */}
      <rect x={-60} y={f3(yQuay)} width={1200} height={f3(yCopeB - yQuay)} fill={STONE.copingFace} />
      <rect x={-60} y={f3(yQuay)} width={1200} height={f3(Math.max(1.2, 0.05 * kw))} fill={STONE.coping} />
      <rect x={-60} y={f3(yCopeB - Math.max(1, 0.03 * kw))} width={1200} height={f3(Math.max(1, 0.03 * kw))} fill={COLOR.shadow} opacity={0.25} />
      {/* golden-hour light raking the wall from the upper left */}
      <rect x={-60} y={f3(yCopeB)} width={1200} height={f3(Math.max(0, yWall - yCopeB))} fill={`url(#${uid}rake)`} />
    </g>
  );

  // --- the boats' (and the ladder's) shadows on the wall: key light from the upper left ---------------------------
  const SH = { dx: 0.32, dy: 0.2 };
  const boatGroup = (key: string, bo: { b: BoatSpec; heave: number; roll: number; breath?: number }) => (
    <g key={key} transform={`translate(${f3(bo.b.x)} ${f3(water + bo.heave)}) rotate(${f3(bo.roll)})`}>
      <Boat b={bo.b} breath={bo.breath ?? 0} />
    </g>
  );
  const visibleBoats = boats.filter((bo) => {
    const [a, b] = xr(0, 120);
    return bo.b.x + bo.b.L / 2 + 0.6 > a && bo.b.x - bo.b.L / 2 - 0.6 < b;
  });
  const shadows = (
    <g key="shadows" clipPath={`url(#${uid}wallclip)`} filter={`url(#${uid}shf)`}>
      <g transform={`translate(${f3(SH.dx * kw)} ${f3(SH.dy * kw)})`}>
        <g transform={planeTf(c, H.wallZ)}>{visibleBoats.map((bo, i) => boatGroup(`s${i}`, bo))}</g>
      </g>
    </g>
  );

  // --- the painted mark: dashes along y 0 and the bullseye; paint, then the lit amber over it ------------------------
  const L = H.line;
  const per = L.dash + L.gap;
  const tg = H.target;
  const yA = Y(-L.th / 2);
  const yB = Y(L.th / 2);
  const dashes: { a: number; b: number; lit: number }[] = [];
  for (let n = Math.floor(wx0 / per) - 1; n <= Math.floor(wx1 / per) + 1; n++) {
    const a = n * per + 0.11;
    const b = a + L.dash;
    if (b > tg.x - tg.r - 0.12 && a < tg.x + tg.r + 0.12) continue; // the bullseye's place
    dashes.push({ a, b, lit: litAt((a + b) / 2) });
  }
  const [tx, ty] = P(tg.x, 0, H.wallZ);
  const tLit = litAt(tg.x);
  const bull = (fill: string, opacity: number, key: string) => (
    <g key={key} opacity={opacity}>
      <path d={circleD(tx, ty, tg.r * kw) + circleD(tx, ty, (tg.r - tg.ring) * kw)} fillRule="evenodd" fill={fill} />
      <circle cx={f3(tx)} cy={f3(ty)} r={f3(tg.dot * kw)} fill={fill} />
      {/* the line's two stubs that meet the ring */}
      <rect x={f3(X(tg.x - tg.r - 0.12))} y={f3(yA)} width={f3(0.12 * kw)} height={f3(yB - yA)} fill={fill} />
      <rect x={f3(X(tg.x + tg.r))} y={f3(yA)} width={f3(0.12 * kw)} height={f3(yB - yA)} fill={fill} />
    </g>
  );
  const hotH = Math.min(EDGE_FALL, 0.7 * (yB - yA));
  const paint = (
    <g key="paint">
      {dashes.map((d, i) => (
        <rect key={i} x={f3(X(d.a))} y={f3(yA)} width={f3(X(d.b) - X(d.a))} height={f3(yB - yA)} fill={STONE.paint} />
      ))}
      {bull(STONE.paint, 1, "bp")}
    </g>
  );
  const lit = (
    <g key="lit">
      <g style={{ filter: bloomFilter(1) }}>
        {dashes.map((d, i) =>
          d.lit > 0.001 ? <rect key={i} x={f3(X(d.a))} y={f3(yA)} width={f3(X(d.b) - X(d.a))} height={f3(yB - yA)} fill={`url(#${uid}amb)`} opacity={f3(d.lit)} /> : null,
        )}
        {tLit > 0.001 ? bull(`url(#${uid}amb)`, tLit, "bl") : null}
      </g>
      {/* the hot top edge: 2 px + its falloff */}
      {dashes.map((d, i) =>
        d.lit > 0.001 ? (
          <g key={`h${i}`} opacity={f3(d.lit)}>
            <rect x={f3(X(d.a))} y={f3(yA)} width={f3(X(d.b) - X(d.a))} height={f3(hotH)} fill={`url(#${uid}hot)`} />
            <rect x={f3(X(d.a))} y={f3(yA)} width={f3(X(d.b) - X(d.a))} height={2} fill={COLOR.amberHot} />
          </g>
        ) : null,
      )}
      {tLit > 0.001 ? (
        <path
          d={`M${f3(tx - tg.r * kw * 0.8)} ${f3(ty - tg.r * kw * 0.6)}A${f3(tg.r * kw - 1)} ${f3(tg.r * kw - 1)} 0 0 1 ${f3(tx + tg.r * kw * 0.8)} ${f3(ty - tg.r * kw * 0.6)}`}
          stroke={COLOR.amberHot}
          strokeWidth={2}
          fill="none"
          opacity={f3(tLit)}
        />
      ) : null}
    </g>
  );

  // --- the ladder and the mooring rings ------------------------------------------------------------------------------
  const ld = H.ladder;
  const lz = H.wallZ - 0.12;
  const lk = kAt(c, lz);
  const LX = (x: number) => P(x, 0, lz)[0];
  const LY = (y: number) => P(0, y, lz)[1];
  const ladderTop = H.quayY - 0.42;
  const ladderParts = (fill: string, lit: string | null) => {
    const out: React.ReactNode[] = [];
    for (const sx of [-1, 1]) {
      const x = ld.x + sx * ld.half;
      out.push(<rect key={`r${sx}`} x={f3(LX(x) - 0.03 * lk)} y={f3(LY(ladderTop))} width={f3(0.06 * lk)} height={f3(LY(2.8) - LY(ladderTop))} rx={f3(0.03 * lk)} fill={fill} />);
      if (lit) out.push(<rect key={`rl${sx}`} x={f3(LX(x) - 0.03 * lk)} y={f3(LY(ladderTop))} width={f3(0.02 * lk)} height={f3(LY(2.8) - LY(ladderTop))} fill={lit} opacity={0.7} />);
    }
    // the hoop over the quay edge
    out.push(
      <path
        key="hoop"
        d={`M${f3(LX(ld.x - ld.half))} ${f3(LY(ladderTop + 0.05))}C${f3(LX(ld.x - ld.half))} ${f3(LY(ladderTop - 0.32))} ${f3(LX(ld.x + ld.half))} ${f3(LY(ladderTop - 0.32))} ${f3(LX(ld.x + ld.half))} ${f3(LY(ladderTop + 0.05))}`}
        stroke={fill}
        strokeWidth={f3(0.06 * lk)}
        fill="none"
      />,
    );
    for (let y = ladderTop + 0.36; y < 2.8; y += ld.rung)
      out.push(<rect key={`g${f3(y)}`} x={f3(LX(ld.x - ld.half))} y={f3(LY(y) - 0.022 * lk)} width={f3(2 * ld.half * lk)} height={f3(0.045 * lk)} fill={fill} />);
    return out;
  };
  const ladder = (
    <g key="ladder">
      <g transform={`translate(${f3(SH.dx * 0.35 * kw)} ${f3(SH.dy * 0.35 * kw)})`} opacity={0.22} clipPath={`url(#${uid}wallclip)`}>
        {ladderParts(COLOR.shadow, null)}
      </g>
      {ladderParts(STONE.iron, STONE.ironLit)}
    </g>
  );
  const rings = (
    <g key="rings">
      {H.rings.map((rx, i) => {
        const [x, y] = P(rx, H.ringY, H.wallZ);
        if (x < -60 || x > 1140) return null;
        return (
          <g key={i}>
            <rect x={f3(x - 0.07 * kw)} y={f3(y - 0.07 * kw)} width={f3(0.14 * kw)} height={f3(0.1 * kw)} rx={f3(0.02 * kw)} fill={STONE.iron} />
            <circle cx={f3(x)} cy={f3(y + 0.1 * kw)} r={f3(0.085 * kw)} stroke={STONE.iron} strokeWidth={f3(Math.max(1, 0.026 * kw))} fill="none" />
          </g>
        );
      })}
    </g>
  );

  // --- the water -------------------------------------------------------------------------------------------------
  const waterSurf = (
    <g key="water">
      <rect x={-60} y={f3(yWall)} width={1200} height={f3(Math.max(0, 2000 - yWall))} fill={`url(#${uid}wat)`} />
      {/* the wall's dark reflection hugging the far water, and the wet contact glint */}
      <rect x={-60} y={f3(yWall)} width={1200} height={f3(Math.max(0, (yWater0 - yWall) + 0.5 * kw))} fill={STONE.wet} opacity={0.18} />
      <rect x={-60} y={f3(yWall - 0.6)} width={1200} height={f3(Math.max(1.2, 0.022 * kw))} fill={WATER.glint} opacity={0.45} />
    </g>
  );
  // the town, the wall and the ladder mirrored in the water (never the painted mark: the water is not amber), faded
  // with distance and broken by the ripples drawn over it
  const townRefl = (
    <g key="trefl" clipPath={`url(#${uid}belowWall)`} mask={`url(#${uid}fade)`} opacity={0.26} style={{ filter: "blur(2.2px)" }}>
      <g transform={`translate(0 ${f3(2 * yWall)}) scale(1 -1)`}>
        {hills}
        {cottages}
        {wallBack}
        {ladder}
      </g>
    </g>
  );
  // ripple streaks on the surface plane (y = water), from just in front of the wall to near the camera
  const ripples: React.ReactNode[] = [];
  {
    const RL = 14;
    const NB = 7;
    for (let bkt = 0; bkt < NB; bkt++) {
      const z0 = lerp(H.wallZ - 0.1, -c.D * 0.62, Math.pow(bkt / NB, 1.6));
      const z1 = lerp(H.wallZ - 0.1, -c.D * 0.62, Math.pow((bkt + 1) / NB, 1.6));
      const items = Array.from({ length: 34 }, (_, i) => {
        const q = i + bkt * 100;
        return { x: hash(q * 1.9) * RL, z: lerp(z0, z1, hash(q * 4.1)), len: 0.5 + 2.2 * hash(q * 2.7), a: 0.1 + 0.22 * hash(q * 3.9), lit: hash(q * 8.9) > 0.4, sp: 0.004 + 0.01 * hash(q * 6.1) };
      });
      const [a, b] = xr(z1, 200);
      for (let n = Math.floor(a / RL) - 1; n <= Math.floor(b / RL) + 1; n++)
        items.forEach((t, i) => {
          const wxp = n * RL + t.x + S * t.sp + 0.02 * Math.sin(S * 0.11 + i);
          if (wxp < a - 3 || wxp > b) return;
          const kz = kAt(c, t.z);
          const [sx, sy] = P(wxp, water, t.z);
          if (sy > 1960 || sy < yWall + 1) return;
          const ry = Math.max(0.8, ((water - c.eye) * kz * kz * 0.12) / (c.k * c.D));
          ripples.push(<ellipse key={`${bkt}_${n}_${i}`} cx={f3(sx)} cy={f3(sy)} rx={f3((t.len * kz) / 2)} ry={f3(Math.min(ry, 9))} fill={t.lit ? WATER.glint : WATER.near} opacity={f3(t.lit ? t.a : t.a * 0.8)} />);
        });
    }
  }
  // reflections: the boats mirrored in the water line at the boats, faded, broken by the ripples drawn over them
  const reflections = (
    <g key="refl" clipPath={`url(#${uid}below)`} opacity={0.3} style={{ filter: "blur(1.4px)" }}>
      <g transform={`translate(0 ${f3(2 * yWater0)}) scale(1 -1)`}>
        <g clipPath={`url(#${uid}above)`}>
          <g transform={planeTf(c, 0)}>{visibleBoats.map((bo, i) => boatGroup(`r${i}`, bo))}</g>
        </g>
      </g>
    </g>
  );
  // each boat's soft contact shade on the water and a wet glint along its waterline
  const contacts = visibleBoats.map((bo, i) => {
    const h = bo.b.L / 2;
    const [x0, y0] = P(bo.b.x - h + 0.3, water, 0);
    const [x1] = P(bo.b.x + h - 0.1, water, 0);
    return (
      <g key={`ct${i}`}>
        <ellipse cx={f3((x0 + x1) / 2)} cy={f3(y0 + 0.05 * c.k)} rx={f3((x1 - x0) / 2 + 0.2 * c.k)} ry={f3(0.07 * c.k)} fill={COLOR.shadow} opacity={0.16} style={{ filter: "blur(3px)" }} />
      </g>
    );
  });
  const boatsFront = (
    <g key="boats" clipPath={`url(#${uid}above)`}>
      <g transform={planeTf(c, 0)}>{visibleBoats.map((bo, i) => boatGroup(`b${i}`, bo))}</g>
    </g>
  );
  const glints = visibleBoats.map((bo, i) => {
    const h = bo.b.L / 2;
    const [x0, y0] = P(bo.b.x - h + 0.36, water, 0);
    const [x1] = P(bo.b.x + h - 0.1, water, 0);
    return <rect key={`gl${i}`} x={f3(x0 - 0.15 * c.k)} y={f3(y0 - 0.6)} width={f3(x1 - x0 + 0.3 * c.k)} height={f3(Math.max(1.2, 0.025 * c.k))} rx={1} fill={WATER.glint} opacity={0.5} />;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: SKY.haze, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${uid}sky`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor - 1250)} x2="0" y2={f3(hor)}>
            <stop offset="0" stopColor={SKY.top} />
            <stop offset="0.24" stopColor={SKY.upper} />
            <stop offset="0.46" stopColor={SKY.amber} />
            <stop offset="0.66" stopColor={SKY.mid} />
            <stop offset="0.83" stopColor={SKY.low} />
            <stop offset="0.93" stopColor={SKY.glow} />
            <stop offset="1" stopColor={SKY.haze} />
          </linearGradient>
          <radialGradient id={`${uid}sun`} gradientUnits="userSpaceOnUse" cx={220} cy={f3(hor - 420)} r={760}>
            <stop offset="0" stopColor={SKY.sun} stopOpacity="0.7" />
            <stop offset="0.35" stopColor={SKY.sun} stopOpacity="0.24" />
            <stop offset="1" stopColor={SKY.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}wet`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yWet)} x2="0" y2={f3(Math.max(yWet + 1, yWall))}>
            <stop offset="0" stopColor={STONE.wet} stopOpacity="0.15" />
            <stop offset="1" stopColor={STONE.wetJoint} stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id={`${uid}rake`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yCopeB - 200)} x2="400" y2={f3(yCopeB + 900)}>
            <stop offset="0" stopColor={SKY.sun} stopOpacity="0.16" />
            <stop offset="1" stopColor={SKY.sun} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}wat`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yWall)} x2="0" y2="1920">
            <stop offset="0" stopColor={WATER.far} />
            <stop offset="0.35" stopColor={WATER.mid} />
            <stop offset="1" stopColor={WATER.near} />
          </linearGradient>
          <linearGradient id={`${uid}amb`} gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="1368">
            <stop offset="0" stopColor={COLOR.amberTop} />
            <stop offset="1" stopColor={COLOR.amberFoot} />
          </linearGradient>
          <linearGradient id={`${uid}hot`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
            <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}wallclip`}>
            <rect x={-60} y={f3(yCopeB)} width={1200} height={f3(Math.max(0, yWall - yCopeB))} />
          </clipPath>
          <clipPath id={`${uid}belowWall`}>
            <rect x={-60} y={f3(yWall)} width={1200} height={f3(Math.max(0, 2100 - yWall))} />
          </clipPath>
          <linearGradient id={`${uid}fadeG`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yWall)} x2="0" y2={f3(yWall + 900)}>
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#000000" />
          </linearGradient>
          <mask id={`${uid}fade`} maskUnits="userSpaceOnUse" x={-60} y={-200} width={1200} height={2400}>
            <rect x={-60} y={f3(yWall)} width={1200} height={f3(Math.max(0, 2100 - yWall))} fill={`url(#${uid}fadeG)`} />
          </mask>
          <clipPath id={`${uid}above`}>
            <rect x={-200} y={-200} width={1480} height={f3(yWater0 + 200)} />
          </clipPath>
          <clipPath id={`${uid}below`}>
            <rect x={-200} y={f3(yWater0)} width={1480} height={f3(Math.max(0, 2200 - yWater0))} />
          </clipPath>
          <filter id={`${uid}shf`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2400} colorInterpolationFilters="sRGB">
            <feFlood floodColor={COLOR.shadow} floodOpacity={0.32} />
            <feComposite in2="SourceAlpha" operator="in" />
            <feGaussianBlur stdDeviation={f3(Math.max(1.5, 0.05 * kw))} />
          </filter>
        </defs>
        {sky}
        {hills}
        {cottages}
        {wallBack}
        {shadows}
        {rings}
        {paint}
        {lit}
        {ladder}
        {waterSurf}
        {townRefl}
        {reflections}
        {ripples}
        {contacts}
        {boatsFront}
        {glints}
      </svg>
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <HarbourGrain S={S} />
    </AbsoluteFill>
  );
};
const EDGE_FALL = 12;

/** the kit's grain on twos (as StoutStage) */
const HarbourGrain: React.FC<{ S: number }> = ({ S }) => {
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2 + 7) * 2 - 1) * GRAIN.travel;
  return (
    <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
      <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
    </AbsoluteFill>
  );
};
