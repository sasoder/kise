// ---------------------------------------------------------------------------
// officeCast — the people of the office (nik-managers-underperformers, cut 14 BiasedAgainstExiting). Picture-book
// card figures in profile on the cabinCast look (scott-free-wifi): a big round head with a nose bump, one dot eye, a
// tiny mouth, a blush dot, simple hair shapes, a bean torso; flat matte fills with a soft top-lit ramp per part, NO
// outlines (the only lines: mouth, closed eye). Tones from cabinCast's SKIN / HAIR / CLOTH tables (nothing amber).
// NEVER realistic.
//
// Every rig is drawn hip-local in cabinCast units (head R 60 = 1), facing LEFT; the caller places and scales it
// (`x`, `y` world px of the hip, `s` the scale; `flip` mirrors it to face right).
//   Sleeper   seated, slumped forward over his desk, head on his folded arm, asleep (breath 0..1 drives the torso).
//   Typist    seated upright, both hands on the keyboard, typing (taps per hand), eyes on the screen.
//   Manager   standing, a clipboard (review sheet + clip) in his hands, a pen in the near hand. Arms are 2-bone IK
//             (cabinCast's solveArm) with ONE elbow rule each: the elbows always hang below the shoulder-hand line
//             (bend -1), so nothing flips. Layer order is fixed: far arm, legs, torso, head, clipboard, near arm, pen.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";
import { CLOTH, HAIR, SKIN, solveArm } from "../scott-free-wifi/cabinCast";
import { OfficeChair } from "./officeRoom";

export { CLOTH, HAIR, SKIN };
export type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const D2R = Math.PI / 180;
const uidOf = (raw: string) => `oc${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const LIGHT = "#FFF4E2";
const topOf = (c: string) => mixHex(c, LIGHT, 0.12);
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.14);
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

// ---------------------------------------------------------------------------
// LOOKS
// ---------------------------------------------------------------------------
export type HairStyle = "crop" | "bun" | "curly" | "part";
/** `top` = the shirt / jumper (and its sleeves); `vest` = a waistcoat over it (the torso only); `rolled` = shirt sleeves
 *  rolled to the elbow (bare forearms) */
export type Look = { skin: string; hair: string; hairStyle: HairStyle; top: string; pants: string; shoe?: string; mustache?: boolean; tie?: string; vest?: string; rolled?: boolean };

/** cabinCast's geometry (hip-local, adult, R 60) */
export const RIG = { R: 60, head: [-40, -270] as P2, neck: [-30, -200] as P2, shoulder: [-40, -178] as P2, farShoulder: [-22, -186] as P2, upper: 92, fore: 90, armW: 38, hand: 15, floor: 192 } as const;
const TORSO_D = "M14 6C22 -56 22 -132 6 -176C-4 -204 -50 -212 -74 -196C-98 -178 -100 -126 -94 -76C-90 -34 -80 -2 -58 6Z";
const THIGH_D = "M8 4L-158 4C-180 4 -186 -18 -186 -28C-186 -46 -176 -60 -158 -60L-30 -60C-6 -60 12 -44 12 -22Z";
const SHIN_D = `M-176 -30L-128 -30L-136 ${RIG.floor - 28}L-178 ${RIG.floor - 28}Z`;
const SHOE_D = `M-210 ${RIG.floor}C-212 ${RIG.floor - 22} -196 ${RIG.floor - 34} -176 ${RIG.floor - 34}L-132 ${RIG.floor - 34}C-124 ${RIG.floor - 34} -122 ${RIG.floor - 26} -122 ${RIG.floor - 16}L-122 ${RIG.floor}Z`;

// --- hair (head-local, R) ------------------------------------------------------------------------------------------
const cropD = (R: number) =>
  ptsD(arcPts(R * 1.07, 212, 402)) +
  `C${f3(0.62 * R)} ${f3(0.42 * R)} ${f3(0.3 * R)} ${f3(0.3 * R)} ${f3(0.22 * R)} ${f3(0.05 * R)}` +
  `C${f3(0.12 * R)} ${f3(-0.28 * R)} ${f3(-0.3 * R)} ${f3(-0.42 * R)} ${f3(-0.66 * R)} ${f3(-0.5 * R)}Z`;
const hairPaths = (style: HairStyle, R: number): string[] => {
  if (style === "crop") return [cropD(R)];
  if (style === "bun") return [cropD(R), circleD(0.74 * R, -0.74 * R, 0.38 * R)];
  if (style === "curly") return [cropD(R), ...[214, 238, 262, 286, 310, 334, 358, 382].map((a) => circleD(...polar(1.0 * R, a), 0.27 * R))];
  // "part": the crop with a neat swoop over the brow (a manager's comb-over)
  return [
    cropD(R),
    `M${f3(-0.98 * R)} ${f3(-0.36 * R)}C${f3(-0.9 * R)} ${f3(-0.9 * R)} ${f3(-0.2 * R)} ${f3(-1.22 * R)} ${f3(0.36 * R)} ${f3(-1.0 * R)}` +
      `C${f3(-0.1 * R)} ${f3(-0.86 * R)} ${f3(-0.5 * R)} ${f3(-0.62 * R)} ${f3(-0.98 * R)} ${f3(-0.36 * R)}Z`,
  ];
};

// ---------------------------------------------------------------------------
// THE HEAD (head-local, centre 0,0)
// ---------------------------------------------------------------------------
export type FaceState = {
  /** 0 open dot .. 1 a closed sleeping arc (crossfaded) */
  closed: number;
  /** the dot eye's offset (head-local px): where he looks */
  look?: P2;
  blink?: number;
  mouth: "smile" | "flat" | "o" | "wobble" | "pucker";
  smile?: number;
};
const Head: React.FC<{ R: number; look: Look; face: FaceState; uid: string }> = ({ R, look, face, uid }) => {
  const eye: P2 = [-0.5 * R + (face.look?.[0] ?? 0), -0.08 * R + (face.look?.[1] ?? 0)];
  const closed = c01(face.closed);
  const blinkK = 1 - 0.85 * c01(face.blink ?? 0);
  const ink = mixHex(COLOR.inkDark, look.skin, 0.25);
  // smile -0.3 (a tight down-turned line) .. 1 (a full smile)
  const sm = Math.max(-0.3, Math.min(1, face.smile ?? 0));
  let mouth: React.ReactNode;
  if (face.mouth === "pucker")
    // a small closed pucker ("shh")
    mouth = <ellipse cx={f3(-0.78 * R)} cy={f3(0.45 * R)} rx={f3(0.045 * R)} ry={f3(0.055 * R)} fill={mixHex(ink, look.skin, 0.3)} />;
  else if (face.mouth === "o")
    mouth = <ellipse cx={f3(-0.74 * R)} cy={f3(0.48 * R)} rx={f3(0.075 * R)} ry={f3(0.1 * R)} fill={mixHex(COLOR.inkDark, look.skin, 0.2)} />;
  else if (face.mouth === "wobble")
    mouth = (
      <path
        d={`M${f3(-0.9 * R)} ${f3(0.46 * R)}Q${f3(-0.84 * R)} ${f3(0.4 * R)} ${f3(-0.78 * R)} ${f3(0.46 * R)}Q${f3(-0.72 * R)} ${f3(0.52 * R)} ${f3(-0.64 * R)} ${f3(0.45 * R)}`}
        stroke={ink}
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
      />
    );
  else {
    const s = face.mouth === "flat" ? -0.2 : sm;
    mouth = (
      <path
        d={`M${f3(-0.88 * R)} ${f3(0.44 * R - 1)}Q${f3(-0.75 * R)} ${f3(0.44 * R + 1 + 7 * s)} ${f3(-0.6 * R)} ${f3(0.44 * R - 2 - 3 * s)}`}
        stroke={ink}
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  return (
    <g>
      <path d={circleD(0, 0, R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R)} fill={`url(#${uid}sk)`} />
      <circle cx={f3(0.16 * R)} cy={f3(0.1 * R)} r={f3(0.15 * R)} fill={mixHex(look.skin, COLOR.shadow, 0.08)} />
      <circle cx={f3(-0.42 * R)} cy={f3(0.3 * R)} r={f3(0.14 * R)} fill="#D9846E" opacity={0.3} />
      {closed < 0.999 ? <ellipse cx={f3(eye[0])} cy={f3(eye[1])} rx={f3(0.095 * R)} ry={f3(0.095 * R * blinkK)} fill={COLOR.inkDark} opacity={f3(1 - closed)} /> : null}
      {closed > 0.001 ? (
        <path
          d={`M${f3(eye[0] - 0.15 * R)} ${f3(eye[1] - 0.01 * R)}Q${f3(eye[0])} ${f3(eye[1] + 0.13 * R)} ${f3(eye[0] + 0.15 * R)} ${f3(eye[1] - 0.01 * R)}`}
          stroke={COLOR.inkDark}
          strokeWidth={3.8}
          strokeLinecap="round"
          fill="none"
          opacity={f3(closed)}
        />
      ) : null}
      {mouth}
      {look.mustache ? (
        <path
          d={`M${f3(-1.0 * R)} ${f3(0.33 * R)}C${f3(-0.94 * R)} ${f3(0.18 * R)} ${f3(-0.62 * R)} ${f3(0.18 * R)} ${f3(-0.54 * R)} ${f3(0.34 * R)}C${f3(-0.7 * R)} ${f3(0.3 * R)} ${f3(-0.86 * R)} ${f3(0.42 * R)} ${f3(-1.0 * R)} ${f3(0.33 * R)}Z`}
          fill={`url(#${uid}hr)`}
        />
      ) : null}
      {hairPaths(look.hairStyle, R).map((d, i) => (
        <path key={i} d={d} fill={`url(#${uid}hr)`} />
      ))}
    </g>
  );
};

/** the per-figure ramps (top-lit, one per part) */
const Ramps: React.FC<{ uid: string; look: Look; R: number; torso: [number, number]; legs: [number, number] }> = ({ uid, look, R, torso, legs }) => {
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
      {g("tp", look.top, torso[0], torso[1])}
      {g("vs", look.vest ?? look.top, torso[0], torso[1])}
      {g("pt", look.pants, legs[0], legs[1])}
    </defs>
  );
};

/** a sleeve from the shoulder through the elbow to the wrist, and the hand */
const Arm: React.FC<{ S: P2; E: P2; W: P2; sleeve: string; skin: string; far?: boolean; rolled?: boolean; noHand?: boolean }> = ({ S, E, W, sleeve, skin, far, rolled, noHand }) => {
  // the far limb: solid card, a clear step darker than the near one (never toward the wall tone, never see-through)
  const sl = far ? footOf(sleeve) : sleeve;
  const sk = far ? footOf(skin) : mixHex(skin, COLOR.shadow, 0.06);
  // rolled sleeves: the bare forearm, then the rolled cuff over the elbow (a fold a shade darker than the sleeve)
  const cuff: P2 = [E[0] + (W[0] - E[0]) * 0.16, E[1] + (W[1] - E[1]) * 0.16];
  return (
    <g>
      <path d={`M${f3(S[0])} ${f3(S[1])}L${f3(E[0])} ${f3(E[1])}`} stroke={sl} strokeWidth={RIG.armW - (far ? 2 : 0)} strokeLinecap="round" fill="none" />
      <path d={`M${f3(E[0])} ${f3(E[1])}L${f3(W[0])} ${f3(W[1])}`} stroke={rolled ? sk : sl} strokeWidth={rolled ? 27 : RIG.armW - (far ? 4 : 2)} strokeLinecap="round" fill="none" />
      {rolled ? <path d={`M${f3(E[0])} ${f3(E[1])}L${f3(cuff[0])} ${f3(cuff[1])}`} stroke={mixHex(sl, COLOR.shadow, 0.1)} strokeWidth={RIG.armW + 2} strokeLinecap="round" fill="none" /> : null}
      {rolled ? null : (
        // the long sleeve's cuff at the wrist, a shade darker
        <path d={`M${f3(W[0] + (E[0] - W[0]) * 0.14)} ${f3(W[1] + (E[1] - W[1]) * 0.14)}L${f3(W[0])} ${f3(W[1])}`} stroke={mixHex(sl, COLOR.shadow, 0.1)} strokeWidth={RIG.armW - (far ? 3 : 1)} strokeLinecap="round" fill="none" />
      )}
      {noHand ? null : <circle cx={f3(W[0])} cy={f3(W[1])} r={RIG.hand} fill={sk} />}
    </g>
  );
};

const placeTf = (x: number, y: number, s: number, flip = false) => `translate(${f3(x)} ${f3(y)}) scale(${f3(flip ? -s : s)} ${f3(s)})`;

// ---------------------------------------------------------------------------
// THE SLEEPER — slumped over his desk, his head on his folded arm. `desk` = the desk top's y, hip-local.
// ---------------------------------------------------------------------------
export const SLEEPER = {
  lean: -30,
  /** the folded forearm lying on the desk (a sleeve lump seen end-on) */
  lump: { x0: -270, x1: -146, h: 44 },
  /** the head resting on it (head-local centre, hip frame) and its tilt (face down toward the desk) */
  head: [-190, -208] as P2,
  tilt: -14,
} as const;
/** where the "z"s leave his head (hip-local): the top of the back of his head */
export const sleeperZSource = (breath: number): P2 => [SLEEPER.head[0] + 22, SLEEPER.head[1] - 40 + 1.2 * breath];

export const Sleeper: React.FC<{ x: number; y: number; s: number; look: Look; desk: number; breath: number }> = ({ x, y, s, look, desk, breath }) => {
  const uid = uidOf(useId());
  const R = RIG.R;
  const lean = SLEEPER.lean + 1.3 * breath;
  const S = rot(RIG.shoulder, lean);
  const L = SLEEPER.lump;
  const ly = desk - L.h;
  const E: P2 = [L.x1 - 4, ly + L.h / 2];
  const headC: P2 = [SLEEPER.head[0], SLEEPER.head[1] + 0.8 * breath];
  return (
    <g transform={placeTf(x, y, s)}>
      <Ramps uid={uid} look={look} R={R} torso={[-210, 10]} legs={[-60, RIG.floor]} />
      <OfficeChair floor={RIG.floor} />
      <path d={SHIN_D} fill={`url(#${uid}pt)`} />
      <path d={SHOE_D} fill={look.shoe ?? "#4A3326"} />
      <path d={THIGH_D} fill={`url(#${uid}pt)`} />
      <g transform={`rotate(${f3(lean)})`}>
        <path d={TORSO_D} fill={`url(#${uid}tp)`} />
      </g>
      {/* the near upper arm, shoulder to the elbow on the desk */}
      <path d={`M${f3(S[0])} ${f3(S[1])}L${f3(E[0])} ${f3(E[1])}`} stroke={look.top} strokeWidth={RIG.armW} strokeLinecap="round" fill="none" />
      {/* the folded forearm (end-on lump) and the hand peeking out at its far end */}
      <circle cx={f3(L.x0 + 4)} cy={f3(ly + L.h * 0.62)} r={RIG.hand} fill={mixHex(look.skin, COLOR.shadow, 0.06)} />
      <rect x={f3(L.x0 + 14)} y={f3(ly)} width={f3(L.x1 - L.x0 - 14)} height={L.h} rx={L.h / 2} fill={`url(#${uid}tp)`} />
      <path d={`M${f3(L.x0 + 30)} ${f3(ly + 4)}L${f3(L.x1 - 20)} ${f3(ly + 4)}`} stroke={topOf(look.top)} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      {/* the head on the arm */}
      <g transform={`translate(${f3(headC[0])} ${f3(headC[1])}) rotate(${f3(SLEEPER.tilt)})`}>
        <Head R={R} look={look} face={{ closed: 1, mouth: "o" }} uid={uid} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TYPIST — upright, typing briskly. `keys` = the keyboard top's y (hip-local); `tap` = per-hand lift 0..1.
// ---------------------------------------------------------------------------
export const Typist: React.FC<{ x: number; y: number; s: number; look: Look; flip?: boolean; keys: number; keyX: number; tapNear: number; tapFar: number; nod: number; blink: number }> = ({
  x,
  y,
  s,
  look,
  flip,
  keys,
  keyX,
  tapNear,
  tapFar,
  nod,
  blink,
}) => {
  const uid = uidOf(useId());
  const R = RIG.R;
  const lean = 3;
  const tilt = -5 + nod;
  const S = rot(RIG.shoulder, lean);
  const FS = rot(RIG.farShoulder, lean);
  const hn: P2 = [keyX, keys - RIG.hand + 2 - 9 * c01(tapNear)];
  const hf: P2 = [keyX + 26, keys - RIG.hand + 2 - 9 * c01(tapFar)];
  const A = solveArm(S, hn, RIG.upper, RIG.fore, -1);
  const B = solveArm(FS, hf, RIG.upper, RIG.fore, -1);
  const neck = rot(RIG.neck, lean);
  const headC = rot(rot(RIG.head, lean), tilt, neck);
  return (
    <g transform={placeTf(x, y, s, flip)}>
      <Ramps uid={uid} look={look} R={R} torso={[-210, 10]} legs={[-60, RIG.floor]} />
      <OfficeChair floor={RIG.floor} />
      <Arm S={FS} E={B.E} W={B.W} sleeve={look.top} skin={look.skin} far />
      <path d={SHIN_D} fill={`url(#${uid}pt)`} />
      <path d={SHOE_D} fill={look.shoe ?? "#4A3326"} />
      <path d={THIGH_D} fill={`url(#${uid}pt)`} />
      <g transform={`rotate(${f3(lean)})`}>
        <path d={TORSO_D} fill={`url(#${uid}tp)`} />
        <path d="M-70 -196C-52 -186 -30 -186 -12 -198" stroke={footOf(look.top)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
      </g>
      <g transform={`translate(${f3(headC[0])} ${f3(headC[1])}) rotate(${f3(lean + tilt)})`}>
        <Head R={R} look={look} face={{ closed: 0, mouth: "smile", smile: 0.5, look: [-3, 4], blink }} uid={uid} />
      </g>
      <Arm S={S} E={A.E} W={A.W} sleeve={look.top} skin={look.skin} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE MANAGER — standing, the clipboard in his hands. All positions hip-local (cabinCast units).
// ---------------------------------------------------------------------------
export const MGR = {
  /** his head is a touch bigger than the staff's */
  headK: 1.1,
  head: [-40, -280] as P2,
  neck: [-32, -204] as P2,
  /** hip to floor, standing */
  legs: 300,
  board: { w: 100, h: 134 },
  /** his arms, a touch longer than the seated rig's, so with the board held up beside his face the elbows hang
   *  forward and low (the near upper arm runs under his chin) */
  upper: 104,
  fore: 104,
  /** the far arm a little longer again, so its elbow tucks in beside the near one (it reads as a darker sleeve just
   *  ahead of the near forearm, not as a band across his jaw) */
  farArm: 116,
} as const;
export type ManagerPose = {
  lean: number;
  tilt: number;
  /** the clipboard (when he holds one): centre (hip frame) and angle (deg, + = clockwise) */
  board?: { x: number; y: number; a: number };
  /** the hands (hip frame): where each sits, its angle, and which side its thumb is on (the thumb points toward what it
   *  holds); the arms end there */
  near: HandAt;
  far: HandAt;
  closed: number;
  look: P2;
  mouth: FaceState["mouth"];
  /** with mouth "smile": -0.3 tight .. 1 full */
  smile?: number;
};
export type HandAt = { at: P2; a: number; thumb: 1 | -1; /** drawn behind his body (a far hand at his side) */ behind?: boolean };
/** a point given in board-local coords (centre 0,0) -> the hip frame */
export const boardToHip = (b: NonNullable<ManagerPose["board"]>, p: P2): P2 => {
  const q = rot(p, b.a);
  return [b.x + q[0], b.y + q[1]];
};
/** the head centre and the eye (hip frame) for a pose */
export const managerEye = (pose: Pick<ManagerPose, "lean" | "tilt" | "look">): { head: P2; eye: P2 } => {
  const R = RIG.R * MGR.headK;
  const neck = rot(MGR.neck, pose.lean);
  const headC = rot(rot(MGR.head, pose.lean), pose.tilt, neck);
  const eL: P2 = [-0.5 * R + pose.look[0], -0.08 * R + pose.look[1]];
  const e = rot(eL, pose.lean + pose.tilt);
  return { head: headC, eye: [headC[0] + e[0], headC[1] + e[1]] };
};

const Clipboard: React.FC<{ uid: string }> = ({ uid }) => {
  const { w, h } = MGR.board;
  const sheet = { x: -w / 2 + 8, y: -h / 2 + 24, w: w - 16, h: h - 32 };
  const ink = mixHex(COLOR.inkDark, COLOR.cream, 0.18);
  const rows = [0, 1, 2, 3];
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}cb`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-h / 2)} x2="0" y2={f3(h / 2)}>
          <stop offset="0" stopColor="#9C7754" />
          <stop offset="1" stopColor="#82603F" />
        </linearGradient>
        <linearGradient id={`${uid}sh`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(sheet.y)} x2="0" y2={f3(sheet.y + sheet.h)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <rect x={f3(-w / 2)} y={f3(-h / 2)} width={w} height={h} rx={9} fill={`url(#${uid}cb)`} />
      <rect x={f3(sheet.x)} y={f3(sheet.y)} width={f3(sheet.w)} height={f3(sheet.h)} rx={3} fill={`url(#${uid}sh)`} />
      {/* the review sheet: a heading rule, then rows of tick boxes and lines */}
      <rect x={f3(sheet.x + 12)} y={f3(sheet.y + 14)} width={f3(sheet.w * 0.5)} height={7} rx={3.5} fill={ink} />
      {rows.map((i) => {
        const yy = sheet.y + 34 + i * 18;
        return (
          <g key={i}>
            <rect x={f3(sheet.x + 12)} y={f3(yy - 6)} width={11} height={11} rx={2} fill="none" stroke={ink} strokeWidth={2.4} />
            <rect x={f3(sheet.x + 30)} y={f3(yy - 2)} width={f3(sheet.w * (i % 2 ? 0.48 : 0.6))} height={4} rx={2} fill={ink} opacity={0.75} />
          </g>
        );
      })}
      {/* the clip */}
      <rect x={-27} y={f3(-h / 2 - 7)} width={54} height={24} rx={7} fill="#B8A48A" />
      <rect x={-27} y={f3(-h / 2 - 7)} width={54} height={5} rx={2.5} fill={LIGHT} opacity={0.55} />
      <rect x={-13} y={f3(-h / 2 + 4)} width={26} height={7} rx={3} fill="#8F7C66" />
    </g>
  );
};

/** `front`: drawn (hip frame) over the clipboard and under his near arm and hands, e.g. a sticker he holds or has stuck */
export const Manager: React.FC<{ x: number; y: number; s: number; look: Look; pose: ManagerPose; front?: React.ReactNode }> = ({ x, y, s, look, pose, front }) => {
  const uid = uidOf(useId());
  const R = RIG.R * MGR.headK;
  const { lean, tilt } = pose;
  const S = rot(RIG.shoulder, lean);
  const FS = rot(RIG.farShoulder, lean);
  const A = solveArm(S, pose.near.at, MGR.upper, MGR.fore, -1);
  const B = solveArm(FS, pose.far.at, MGR.farArm, MGR.farArm, -1);
  const { head: headC } = managerEye(pose);
  const L = MGR.legs;
  const shoe = look.shoe ?? "#4A3326";
  const leg = (x0: number, fill: string, key: string) => (
    <g key={key}>
      <path d={`M${x0} -40L${x0 + 44} -40L${x0 + 42} ${L - 26}L${x0 + 2} ${L - 26}Z`} fill={fill} />
    </g>
  );
  const shoeD = (x0: number) => `M${x0 - 34} ${L}C${x0 - 36} ${L - 20} ${x0 - 22} ${L - 32} ${x0 - 4} ${L - 32}L${x0 + 38} ${L - 32}C${x0 + 46} ${L - 32} ${x0 + 48} ${L - 24} ${x0 + 48} ${L - 14}L${x0 + 48} ${L}Z`;
  const shirt = look.top;
  /** a card hand: the back of the hand, and the thumb on the side of what it holds */
  const hand = (h: HandAt, far: boolean, key: string) => {
    const sk = far ? footOf(look.skin) : mixHex(look.skin, COLOR.shadow, 0.04);
    const t = rot([h.thumb * 11, -4], h.a);
    const th: P2 = [h.at[0] + t[0], h.at[1] + t[1]];
    return (
      <g key={key}>
        <ellipse cx={f3(h.at[0])} cy={f3(h.at[1])} rx={13} ry={17} transform={`rotate(${f3(h.a)} ${f3(h.at[0])} ${f3(h.at[1])})`} fill={sk} />
        <ellipse cx={f3(th[0])} cy={f3(th[1])} rx={6.5} ry={9} transform={`rotate(${f3(h.a + 20 * h.thumb)} ${f3(th[0])} ${f3(th[1])})`} fill={mixHex(sk, COLOR.shadow, 0.08)} />
      </g>
    );
  };
  return (
    <g transform={placeTf(x, y, s)}>
      <Ramps uid={uid} look={look} R={R} torso={[-215, 10]} legs={[-40, L]} />
      {/* the far arm (behind everything of his) */}
      <Arm S={FS} E={B.E} W={B.W} sleeve={look.top} skin={look.skin} far rolled={look.rolled} noHand />
      {pose.far.behind ? hand(pose.far, true, "hfb") : null}
      {/* legs: the far one darker, then the near one; shoes pointing left */}
      {leg(-30, mixHex(look.pants, COLOR.shadow, 0.18), "fl")}
      <path d={shoeD(-30)} fill={mixHex(shoe, COLOR.shadow, 0.2)} />
      {leg(-60, `url(#${uid}pt)`, "nl")}
      <path d={shoeD(-60)} fill={shoe} />
      {/* the torso: jacket, the shirt front and the tie (all one card) */}
      <g transform={`rotate(${f3(lean)})`}>
        <path d={TORSO_D} fill={`url(#${uid}${look.vest ? "vs" : "tp"})`} />
        <path d="M-74 -197C-88 -186 -96 -166 -97 -140L-84 -138C-82 -160 -76 -178 -62 -194Z" fill={shirt} />
        {look.tie ? <path d="M-80 -190L-70 -186L-82 -112L-92 -100L-96 -114Z" fill={look.tie} /> : null}
        <path d="M-70 -197C-52 -187 -30 -187 -12 -199" stroke={footOf(look.top)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
      </g>
      <g transform={`translate(${f3(headC[0])} ${f3(headC[1])}) rotate(${f3(lean + tilt)})`}>
        <Head R={R} look={look} face={{ closed: pose.closed, mouth: pose.mouth, smile: pose.smile, look: pose.look }} uid={uid} />
      </g>
      {/* the clipboard, when he holds one */}
      {pose.board ? (
        <g transform={`translate(${f3(pose.board.x)} ${f3(pose.board.y)}) rotate(${f3(pose.board.a)})`}>
          <Clipboard uid={uid} />
        </g>
      ) : null}
      {front}
      {/* the near arm (in front of the board), then both hands */}
      <Arm S={S} E={A.E} W={A.W} sleeve={look.top} skin={look.skin} rolled={look.rolled} noHand />
      {pose.far.behind ? null : hand(pose.far, true, "hf")}
      {hand(pose.near, false, "hn")}
    </g>
  );
};
