// CHAMP_READY
// ---------------------------------------------------------------------------
// champShared — the shared world of "toto - you can spot a champion at eight" (cut 11 PotentialInTheKart, cut 23
// EightBeatsTen). Cheeky Pint stout (styles/cheeky-pint.md, palette B1): every colour, shadow recipe and bloom is
// stoutShared's / museShared's, imported, never restated.
//
// EXPORTS
//   KartWithKid   a picture-book kid in a go-kart, SIDE VIEW facing right, cream card on the stout light (no outlines,
//                 flat matte fills with a top-lit ramp per part). The kid sits upright, knees forward, hands on the
//                 wheel, in a full-face helmet with the visor up showing the cabinCast face (dot eye, blush).
//   kartSil       the union silhouette of a KartWithKid (one UnionShadow for kart + kid; KartWithKid draws it itself
//                 unless shadow={false})
//   helmetCentre  where a KartWithKid's helmet centre lands (world px), for framing and the F1 cockpit
//   TrackStrip    the asphalt lane: a darker tone on the board with a faint kerb line, one lane or several stacked
//   FinishLine    a chequered strip in cream and ink across a lane
//   F1Outline     a modern (2022+) F1 car side profile facing right at true scale to the kart: `draw` 0..1 strokes it
//                 on from the cockpit outward, `fill` 0..1 fills it with the amber band (rising from the floor),
//                 `sweep` 0..1 the one LightSweep on it. `layer="body"` under the kart, `layer="halo"` over it.
//   M, KART, KID, F1, KART_IN_F1, CAM_KART, CAM_F1, kartScaleFor   the geometry and camera constants
//
// UNITS. World px, y down. M = 400 world px per metre. A KartWithKid's (x, y) is the GROUND point straight below the
// helmet centre of a 10-year-old (scale 1) kart; F1Outline's (x, y) is the ground point straight below its cockpit
// (the driver's helmet centre). So a KartWithKid at the F1Outline's own (x, y) (KART_IN_F1 = {dx: 0, dy: 0}) puts the
// kid's helmet exactly in the cockpit, under the halo.
// Geometry inside is in METRES, y up, origin on that ground point (kart: x forward from the helmet; F1: x forward from
// the cockpit), converted by `toW`. Screen-px strokes (the F1 line, the hot edge, the kerb line) are px / k.
//
// KART (scale 1 = a 10-year-old's cadet kart, metres): length 1.80 (rear bumper -0.58 .. nose +1.22), rear tyre
// r 0.14 at x -0.22, front tyre r 0.11 at x +0.74 (wheelbase 0.96), side pod top 0.215, helmet centre (0, 0.67), helmet
// r 0.16, helmet top 0.83. An 8-year-old is scale 0.82 and sits in a kart of kartScaleFor(0.82) = 0.91.
// F1 (metres, x from the cockpit): rear wing trailing edge -2.41, front wing tip +3.21 (5.62 long), rear axle -1.45,
// front axle +2.15 (wheelbase 3.60), tyres r 0.36 (18-inch wheels, covers), airbox top 0.955, halo bar 0.89 over the
// helmet top 0.83, floor 0.03 above the ground (Mercedes W15/W16 proportions; drawn from memory of the side view).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR, ELEVATION, EDGE, SWEEP, AmberGradient, bloomFilter, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, type SilItem } from "../kits/cheeky-pint/museShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";

export type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const D2R = Math.PI / 180;
const uidOf = (raw: string) => `ch${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
/** world px per metre */
export const M = 400;
/** the camera the cuts frame the kart with: k so a scale-1 kart (1.80 m) is ~650 px wide; and the F1 wide (~980 px) */
export const CAM_KART = { k: 0.9 } as const;
export const CAM_F1 = { k: 0.43 } as const;

export const KART = {
  length: 1.8,
  rear: -0.58,
  nose: 1.22,
  rearAxle: -0.22,
  rearR: 0.14,
  frontAxle: 0.74,
  frontR: 0.11,
  podTop: 0.215,
  /** where the kid's hip sits on the seat; the wheel grip; the pedal (kart metres) */
  hip: [-0.17, 0.13] as P2,
  wheelC: [0.21, 0.36] as P2,
  wheelDir: [0.59, 0.81] as P2,
  wheelHalf: 0.12,
  pedal: [0.31, 0.17] as P2,
} as const;
export const KID = {
  /** helmet centre relative to the hip (kid metres, y up), radius */
  helmet: [0.17, 0.54] as P2,
  helmetR: 0.16,
  shoulder: [0.03, 0.33] as P2,
  farShoulder: [0.07, 0.34] as P2,
  upper: 0.2,
  fore: 0.2,
  armW: 0.07,
  thigh: 0.3,
  shin: 0.28,
  thighW: 0.1,
  shinW: 0.08,
  hand: 0.04,
  /** an 8-year-old against a 10-year-old (scale 1) */
  eight: 0.82,
  /** helmet centre / top above the ground at scale 1 (m) */
  helmetY: 0.67,
  helmetTop: 0.83,
} as const;
/** an 8-year-old (scale 0.82) sits in a slightly smaller kart */
export const kartScaleFor = (kidScale: number) => 1 - (1 - kidScale) * 0.5;

export const F1 = {
  length: 5.62,
  rearWing: -2.41,
  frontWing: 3.21,
  rearAxle: -1.45,
  frontAxle: 2.15,
  tyreR: 0.36,
  rimR: 0.23,
  airboxTop: 0.955,
  haloTop: 0.912,
  /** the cockpit: the driver's helmet centre (= a scale-1 KartWithKid's helmet) */
  cockpit: [0, 0.67] as P2,
} as const;
/** where a scale-1 KartWithKid goes relative to an F1Outline's (x, y): the same ground point */
export const KART_IN_F1 = { dx: 0, dy: 0 } as const;

// ---------------------------------------------------------------------------
// TONES (cabinCast's warm muted card tones; never amber: amber is the potential)
// ---------------------------------------------------------------------------
export const SKIN = { cream: "#F0DEC6", light: "#E2C3A0", tan: "#C99C74", board: "#AD8562", deep: "#8C6448" } as const;
export const HELMET = {
  cream: "#F2E7D3",
  terracotta: "#C47B5A",
  sage: "#949A6A",
  denim: "#737D8A",
  plum: "#9A6878",
  oat: "#E2CFAA",
  rust: "#B06646",
} as const;
export type HelmetTone = keyof typeof HELMET;
const LIGHT_TINT = "#FFF4E2";
const topOf = (c: string) => mixHex(c, LIGHT_TINT, 0.14);
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.16);
const farOf = (c: string) => mixHex(c, COLOR.shadow, 0.28);
const TYRE = COLOR.inkDark;
const TYRE_WALL = mixHex(COLOR.inkDark, COLOR.board, 0.16);
const RIM = mixHex(COLOR.board, COLOR.cream, 0.45);
const RIM_SLOT = mixHex(COLOR.inkDark, COLOR.board, 0.3);
const RAIL = mixHex(COLOR.boardFoot, COLOR.ground, 0.4);
const SEAT = mixHex(COLOR.boardFoot, COLOR.ground, 0.32);
const STEER = mixHex(COLOR.inkDark, COLOR.board, 0.22);
const VISOR = mixHex(COLOR.inkDark, COLOR.board, 0.35);
/** the visor opening's dark band (the helmet's padding round the face) */
const OPENING = mixHex(COLOR.inkDark, COLOR.board, 0.2);

// ---------------------------------------------------------------------------
// PATH HELPERS
// ---------------------------------------------------------------------------
const rotP = (p: P2, deg: number, o: P2): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
/** a closed soft shape through points: quadratics through the midpoints (corners come out rounded, like cut card) */
const polyD = (pts: P2[]) => `${pts.map((q, i) => `${i ? "L" : "M"}${f3(q[0])} ${f3(q[1])}`).join("")}Z`;
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
/** a rounded rect from its top-left corner (world px) */
const roundRect = (tl: P2, w: number, h: number, r: number) =>
  `M${f3(tl[0] + r)} ${f3(tl[1])}H${f3(tl[0] + w - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(tl[0] + w)} ${f3(tl[1] + r)}V${f3(tl[1] + h - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(tl[0] + w - r)} ${f3(tl[1] + h)}H${f3(tl[0] + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(tl[0])} ${f3(tl[1] + h - r)}V${f3(tl[1] + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(tl[0] + r)} ${f3(tl[1])}Z`;
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;
/** maps every coordinate PAIR of an absolute M/L/C/Q/Z path written in metres (y up) through `T` */
const mapPath = (d: string, T: (x: number, y: number) => P2) => {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let out = "";
  let nums: number[] = [];
  const flush = () => {
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const p = T(nums[i], nums[i + 1]);
      out += `${i ? " " : ""}${f3(p[0])} ${f3(p[1])}`;
    }
    nums = [];
  };
  for (const t of tokens) {
    if (/[MLCQZ]/.test(t)) {
      flush();
      out += t;
    } else nums.push(parseFloat(t));
  }
  flush();
  return out;
};
/** 2-bone IK (world, y down): the joint on one side of the root-target line (`bend` +1: below a rightward limb) */
const solve2 = (S: P2, T: P2, a: number, b: number, bend: 1 | -1) => {
  const dx = T[0] - S[0];
  const dy = T[1] - S[1];
  const d0 = Math.hypot(dx, dy);
  const d = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-3, d0));
  const phi = Math.atan2(dy, dx);
  const al = Math.acos(clamp01((a * a + d * d - b * b) / (2 * a * d)));
  const E: P2 = [S[0] + a * Math.cos(phi + bend * al), S[1] + a * Math.sin(phi + bend * al)];
  const W: P2 = [S[0] + (dx / Math.max(1e-6, d0)) * d, S[1] + (dy / Math.max(1e-6, d0)) * d];
  return { E, W };
};

// ---------------------------------------------------------------------------
// THE KART WITH THE KID
// ---------------------------------------------------------------------------
export type KartProps = {
  /** the ground point below a scale-1 kart's helmet centre (world px) */
  x: number;
  y: number;
  /** the kid's size: 1 = a 10-year-old, KID.eight (0.82) = an 8-year-old */
  scale?: number;
  /** the kart's size (default kartScaleFor(scale)) */
  kartScale?: number;
  /** 'cream' = the subject (lit card), 'board' = context; `dim` 0..1 overrides it for a tone tween (never opacity) */
  tone?: "cream" | "board";
  dim?: number;
  helmet?: HelmetTone;
  /** the helmet's stripe and the gloves */
  stripe?: HelmetTone;
  suit?: HelmetTone;
  skin?: string;
  /** distance rolled (world px): the hubs turn by it (frame-driven); `wheelSpeed` (world px / frame) blurs the spokes */
  wheelSpin?: number;
  wheelSpeed?: number;
  /** the kid's upper body about the hip (deg, + = back into the seat) */
  lean?: number;
  /** the body on its tyres (world px, + = up): chassis, bodywork and kid; the tyres stay on the ground */
  bob?: number;
  blink?: number;
  /** the talent highlight 0..1: the helmet stripe turns amber (with its bloom) */
  amber?: number;
  /** camera k (for the amber bloom only) */
  k?: number;
  shadow?: boolean;
};

const kartGeom = (p: KartProps) => {
  const kk = p.scale ?? 1;
  const ks = p.kartScale ?? kartScaleFor(kk);
  const bob = p.bob ?? 0;
  const lean = p.lean ?? 0;
  // kart metres -> world (body parts ride the bob; the tyres do not)
  const K = (mx: number, my: number, ride = true): P2 => [p.x + mx * M * ks, p.y - my * M * ks - (ride ? bob : 0)];
  const H = K(KART.hip[0], KART.hip[1]);
  const U = M * kk;
  // kid-local metres (y up, hip origin) -> world, through the lean about the hip
  const Kd = (lx: number, ly: number): P2 => rotP([H[0] + lx * U, H[1] - ly * U], -lean, H);
  const wheelC = K(KART.wheelC[0], KART.wheelC[1]);
  const wd: P2 = [KART.wheelDir[0], -KART.wheelDir[1]];
  const wh = KART.wheelHalf * M * ks;
  const wheelA: P2 = [wheelC[0] - wd[0] * wh, wheelC[1] - wd[1] * wh];
  const wheelB: P2 = [wheelC[0] + wd[0] * wh, wheelC[1] + wd[1] * wh];
  const grip: P2 = [wheelC[0] + wd[0] * wh * 0.5, wheelC[1] + wd[1] * wh * 0.5];
  const farGrip: P2 = [wheelC[0] + wd[0] * wh * 0.78 + 0.01 * M * ks, wheelC[1] + wd[1] * wh * 0.78];
  const S = Kd(KID.shoulder[0], KID.shoulder[1]);
  const FS = Kd(KID.farShoulder[0], KID.farShoulder[1]);
  const arm = solve2(S, grip, KID.upper * U, KID.fore * U, 1);
  const farArm = solve2(FS, farGrip, KID.upper * U, KID.fore * U, 1);
  const hipJ = Kd(0, 0.02);
  const pedal = K(KART.pedal[0], KART.pedal[1]);
  const leg = solve2(hipJ, pedal, KID.thigh * U, KID.shin * U, -1);
  const farHip = Kd(0.03, 0.03);
  const farLeg = solve2(farHip, [pedal[0] + 0.02 * M * ks, pedal[1] - 0.01 * M * ks], KID.thigh * U, KID.shin * U, -1);
  const helmet = Kd(KID.helmet[0], KID.helmet[1]);
  const torso = softClosed(
    (
      [
        [-0.09, 0.02],
        [-0.115, 0.14],
        [-0.105, 0.27],
        [-0.06, 0.36],
        [0.0, 0.395],
        [0.07, 0.375],
        [0.115, 0.28],
        [0.125, 0.15],
        [0.1, 0.03],
        [0.0, -0.025],
      ] as P2[]
    ).map(([a, b]) => Kd(a, b)),
  );
  const parts = {
    pod: softClosed(
      (
        [
          [-0.04, 0.075],
          [-0.045, 0.17],
          [0.05, 0.205],
          [0.48, KART.podTop],
          [0.6, 0.19],
          [0.615, 0.085],
          [0.5, 0.06],
          [0.05, 0.06],
        ] as P2[]
      ).map(([a, b]) => K(a, b)),
    ),
    nose: softClosed(
      (
        [
          [0.8, 0.06],
          [0.81, 0.19],
          [0.94, 0.235],
          [1.1, 0.205],
          [1.225, 0.135],
          [1.215, 0.055],
          [1.1, 0.035],
          [0.86, 0.035],
        ] as P2[]
      ).map(([a, b]) => K(a, b)),
    ),
    plate: roundRect(K(0.93, 0.185), 0.15 * M * ks, 0.1 * M * ks, 0.022 * M * ks),
    plateIn: roundRect(K(0.942, 0.173), 0.126 * M * ks, 0.076 * M * ks, 0.014 * M * ks),
    bumper: softClosed(
      (
        [
          [-0.58, 0.06],
          [-0.585, 0.18],
          [-0.52, 0.215],
          [-0.37, 0.205],
          [-0.34, 0.07],
        ] as P2[]
      ).map(([a, b]) => K(a, b)),
    ),
    rail: softClosed(
      (
        [
          [-0.52, 0.03],
          [-0.52, 0.062],
          [1.0, 0.062],
          [1.0, 0.03],
        ] as P2[]
      ).map(([a, b]) => K(a, b)),
    ),
    panel: softClosed(
      (
        [
          [0.97, 0.2],
          [0.84, 0.25],
          [0.64, 0.315],
          [0.545, 0.335],
          [0.535, 0.295],
          [0.64, 0.225],
          [0.8, 0.17],
        ] as P2[]
      ).map(([a, b]) => K(a, b)),
    ),
    seat: softClosed(
      (
        [
          [-0.33, 0.07],
          [-0.37, 0.43],
          [-0.31, 0.445],
          [-0.27, 0.12],
          [-0.05, 0.1],
          [-0.05, 0.07],
        ] as P2[]
      ).map(([a, b]) => K(a, b)),
    ),
    column: [K(0.58, 0.14), wheelC] as [P2, P2],
  };
  const rearC = K(KART.rearAxle, KART.rearR, false);
  const frontC = K(KART.frontAxle, KART.frontR, false);
  return { kk, ks, U, H, S, FS, arm, farArm, hipJ, leg, farHip, farLeg, helmet, torso, parts, wheelA, wheelB, wheelC, rearC, frontC, rearR: KART.rearR * M * ks, frontR: KART.frontR * M * ks, lean };
};

/** the kart helmet's shell (helmet-local, unit radius, x forward, y down): a full-face shell inside the helmet's
 *  circle box (same bounding box as KID.helmetR): rounded crown, the back down to the nape, the chin bar forward-low */
const SHELL: P2[] = [
  [-0.2, -1.0],
  [0.45, -0.99],
  [0.9, -0.72],
  [1.0, -0.2],
  [1.0, 0.45],
  [0.93, 0.86],
  [0.55, 1.0],
  [-0.3, 0.98],
  [-0.82, 0.8],
  [-1.0, 0.3],
  [-1.0, -0.35],
  [-0.76, -0.88],
];
const helmetFrame = (c: P2, hr: number, lean: number) => (lx: number, ly: number): P2 => rotP([c[0] + lx * hr, c[1] + ly * hr], -lean, c);
const helmetShellD = (c: P2, hr: number, lean: number) => {
  const HL = helmetFrame(c, hr, lean);
  return softClosed(SHELL.map(([a, b]) => HL(a, b)));
};

/** where a KartWithKid's helmet centre lands (world px) */
export const helmetCentre = (p: KartProps): P2 => kartGeom(p).helmet;

/** the union silhouette of kart + kid (world px), for ONE UnionShadow */
export const kartSil = (p: KartProps): SilItem[] => {
  const g = kartGeom(p);
  const hr = KID.helmetR * g.U;
  return [
    { d: g.parts.pod },
    { d: g.parts.nose },
    { d: g.parts.bumper },
    { d: g.parts.rail },
    { d: g.parts.panel },
    { d: g.parts.seat },
    { d: g.torso },
    { d: helmetShellD(g.helmet, hr, g.lean) },
    { d: `M${f3(g.S[0])} ${f3(g.S[1])}L${f3(g.arm.E[0])} ${f3(g.arm.E[1])}L${f3(g.arm.W[0])} ${f3(g.arm.W[1])}`, stroke: KID.armW * g.U },
    { d: `M${f3(g.hipJ[0])} ${f3(g.hipJ[1])}L${f3(g.leg.E[0])} ${f3(g.leg.E[1])}L${f3(g.leg.W[0])} ${f3(g.leg.W[1])}`, stroke: KID.thighW * g.U },
    { d: `M${f3(g.wheelA[0])} ${f3(g.wheelA[1])}L${f3(g.wheelB[0])} ${f3(g.wheelB[1])}`, stroke: 0.03 * M * g.ks },
    { d: circleD(g.rearC[0], g.rearC[1], g.rearR) },
    { d: circleD(g.frontC[0], g.frontC[1], g.frontR) },
  ];
};

/** a hub: rim disc with three spokes turned by `ang` (deg); `blur` 0..1 fades the spokes into a spun disc */
const Wheel: React.FC<{ c: P2; r: number; ang: number; blur: number; dim: number }> = ({ c, r, ang, blur, dim }) => {
  const rim = r * 0.52;
  const tone = (col: string) => mixHex(col, COLOR.boardFoot, dim * 0.25);
  const spokes = [0, 120, 240].map((a) => {
    const t = (ang + a) * D2R;
    return `M${f3(c[0])} ${f3(c[1])}L${f3(c[0] + Math.cos(t) * rim * 0.86)} ${f3(c[1] + Math.sin(t) * rim * 0.86)}`;
  });
  return (
    <g>
      <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(r)} fill={TYRE} />
      <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(r * 0.8)} fill={TYRE_WALL} />
      <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(rim)} fill={tone(RIM)} />
      <g opacity={f3(1 - 0.85 * clamp01(blur))}>
        {spokes.map((d, i) => (
          <path key={i} d={d} stroke={tone(RIM_SLOT)} strokeWidth={f3(rim * 0.26)} strokeLinecap="round" />
        ))}
      </g>
      {blur > 0.01 ? <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(rim * 0.8)} fill="none" stroke={tone(RIM_SLOT)} strokeOpacity={f3(0.28 * clamp01(blur))} strokeWidth={f3(rim * 0.5)} /> : null}
      <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(rim * 0.22)} fill={tone(mixHex(RIM, COLOR.cream, 0.4))} />
    </g>
  );
};

/** THE KID IN THE KART. Side view, facing right. */
export const KartWithKid: React.FC<KartProps> = (p) => {
  const uid = uidOf(useId());
  const g = kartGeom(p);
  const dim = clamp01(p.dim ?? (p.tone === "board" ? 1 : 0));
  // card tones: cream -> board for the bodywork; coloured parts lean toward board by 55 %
  const body = mixHex(COLOR.cream, COLOR.board, dim);
  const bodyFoot = mixHex(COLOR.creamFoot, COLOR.boardFoot, dim);
  const col = (c: string) => mixHex(c, COLOR.board, dim * 0.55);
  const helmetC = col(HELMET[p.helmet ?? "cream"]);
  const stripeBase = col(HELMET[p.stripe ?? "terracotta"]);
  // the helmet's stripe: a straight band in a stout tone (the stripe token pulled toward board; board by default)
  const stripeTone = p.stripe ? mixHex(HELMET[p.stripe], COLOR.board, 0.35) : COLOR.board;
  const suit = col(HELMET[p.suit ?? "denim"]);
  const glove = mixHex(stripeBase, COLOR.shadow, 0.08);
  const skin = col(p.skin ?? SKIN.light);
  const amber = clamp01(p.amber ?? 0);
  const stripe = mixHex(col(stripeTone), COLOR.amberTop, amber);
  const k = p.k ?? 1;
  const U = g.U;
  const hr = KID.helmetR * U;
  const hy = g.helmet[1];
  // the helmet's local frame: x forward, y down, rotated with the lean
  const HL = helmetFrame(g.helmet, hr, g.lean);
  const blinkK = 1 - 0.88 * clamp01(p.blink ?? 0);
  const spinDeg = (r: number) => (((p.wheelSpin ?? 0) / r) * 180) / Math.PI;
  const blurOf = (r: number) => clamp01((Math.abs(p.wheelSpeed ?? 0) / r / D2R - 24) / 24);
  const kidTop = hy - hr;
  const kidFoot = g.H[1] + 0.05 * U;
  const grad = (id: string, c: string, y0: number, y1: number) => (
    <linearGradient id={`${uid}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
      <stop offset="0" stopColor={topOf(c)} />
      <stop offset="1" stopColor={footOf(c)} />
    </linearGradient>
  );
  const kartTop = p.y - 0.45 * M * g.ks;
  const limb = (a: P2, b: P2, c: P2, w1: number, w2: number, stroke: string, stroke2?: string) => (
    <g fill="none" strokeLinecap="round">
      <path d={`M${f3(a[0])} ${f3(a[1])}L${f3(b[0])} ${f3(b[1])}`} stroke={stroke} strokeWidth={f3(w1)} />
      <path d={`M${f3(b[0])} ${f3(b[1])}L${f3(c[0])} ${f3(c[1])}`} stroke={stroke2 ?? stroke} strokeWidth={f3(w2)} />
    </g>
  );
  const boot = (A: P2, kneeE: P2, far: boolean) => {
    const a = Math.atan2(A[1] - kneeE[1], A[0] - kneeE[0]) / D2R - 70;
    const s = U;
    const fill = far ? farOf(mixHex(COLOR.inkDark, COLOR.board, 0.35)) : mixHex(COLOR.inkDark, COLOR.board, 0.35);
    return (
      <g transform={`translate(${f3(A[0])} ${f3(A[1])}) rotate(${f3(a)})`}>
        <path d={softClosed([[-0.035 * s, -0.03 * s], [0.03 * s, -0.035 * s], [0.12 * s, 0.0], [0.12 * s, 0.04 * s], [-0.04 * s, 0.045 * s]])} fill={fill} />
      </g>
    );
  };
  // THE KART HELMET (helmet-local, unit radius): the shell; the chin bar a tone step at the front-low; the visor
  // opening a dark window band with the face recessed in it; the visor lifted onto the crown on its pivot; one
  // straight stripe along the side below the opening.
  const shellD = helmetShellD(g.helmet, hr, g.lean);
  const chinD = polyD([HL(0.3, 0.26), HL(1.2, 0.26), HL(1.2, 1.2), HL(0.3, 1.2)]);
  const openD = softClosed([HL(0.1, -0.46), HL(1.12, -0.5), HL(1.12, 0.28), HL(0.22, 0.24), HL(0.02, -0.1)]);
  const faceD = softClosed([HL(0.22, -0.34), HL(1.12, -0.38), HL(1.12, 0.16), HL(0.3, 0.13), HL(0.15, -0.1)]);
  const visorD = softClosed([HL(0.0, -0.6), HL(0.5, -0.86), HL(0.9, -0.74), HL(0.97, -0.6), HL(0.5, -0.64), HL(0.06, -0.48)]);
  const stripeD = polyD([HL(-1.2, 0.34), HL(0.3, 0.34), HL(0.3, 0.47), HL(-1.2, 0.47)]);
  return (
    <g>
      <defs>
        {grad("bd", body, kartTop, p.y)}
        <linearGradient id={`${uid}bk`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(kartTop)} x2="0" y2={f3(p.y)}>
          <stop offset="0" stopColor={body} />
          <stop offset="1" stopColor={bodyFoot} />
        </linearGradient>
        {grad("su", suit, kidTop, kidFoot)}
        {grad("hm", helmetC, hy - hr, hy + hr)}
        {grad("sk", skin, hy - hr * 0.5, hy + hr * 0.3)}
        <clipPath id={`${uid}hc`}>
          <path d={shellD} />
        </clipPath>
      </defs>
      {p.shadow === false ? null : (
        <g>
          {/* one union shadow for kart + kid, and the contact under each tyre */}
          <UnionShadow sil={kartSil(p)} s={2.2 * g.ks} elevation="rest" />
          {[
            [g.rearC, g.rearR],
            [g.frontC, g.frontR],
          ].map(([c, r], i) => {
            const cc = c as P2;
            const rr = r as number;
            const ct = ELEVATION.rest.contact;
            return ct ? (
              <ellipse
                key={i}
                cx={f3(cc[0] + ct.dx * 2)}
                cy={f3(p.y)}
                rx={f3(rr * 0.95)}
                ry={f3(0.016 * M * g.ks)}
                fill={COLOR.shadow}
                opacity={f3(ct.a)}
                style={{ filter: `blur(${f3(ct.blur * 2.2)}px)` }}
              />
            ) : null;
          })}
        </g>
      )}
      {/* far leg, far arm (behind the torso) */}
      {limb(g.farHip, g.farLeg.E, g.farLeg.W, KID.thighW * U, KID.shinW * U, farOf(suit))}
      {boot(g.farLeg.W, g.farLeg.E, true)}
      {limb(g.FS, g.farArm.E, g.farArm.W, KID.armW * U * 0.94, KID.armW * U * 0.9, farOf(suit))}
      <circle cx={f3(g.farArm.W[0])} cy={f3(g.farArm.W[1])} r={f3(KID.hand * U)} fill={farOf(glove)} />
      {/* the seat back */}
      <path d={g.parts.seat} fill={SEAT} />
      {/* torso */}
      <path d={g.torso} fill={`url(#${uid}su)`} />
      {/* the helmet */}
      <g>
        <path d={shellD} fill={`url(#${uid}hm)`} />
        <g clipPath={`url(#${uid}hc)`}>
          <path d={chinD} fill={mixHex(helmetC, COLOR.board, 0.2)} />
          <path d={stripeD} fill={stripe} style={amber > 0.01 ? { filter: bloomFilter(k) } : undefined} />
          <path d={openD} fill={OPENING} />
          <path d={faceD} fill={`url(#${uid}sk)`} />
          {/* the face in the opening: one dot eye and a blush dot (cabinCast) */}
          <ellipse cx={f3(HL(0.66, -0.1)[0])} cy={f3(HL(0.66, -0.1)[1])} rx={f3(0.1 * hr)} ry={f3(0.1 * hr * blinkK)} fill={COLOR.inkDark} />
          {(p.blink ?? 0) < 0.3 ? <circle cx={f3(HL(0.695, -0.135)[0])} cy={f3(HL(0.695, -0.135)[1])} r={f3(0.03 * hr)} fill="#FFF8EA" /> : null}
          <circle cx={f3(HL(0.5, 0.03)[0])} cy={f3(HL(0.5, 0.03)[1])} r={f3(0.1 * hr)} fill="#D9846E" opacity={0.42} />
          {/* the visor, lifted onto the crown, and its pivot on the side */}
          <path d={visorD} fill={VISOR} />
        </g>
        <circle cx={f3(HL(0.02, -0.5)[0])} cy={f3(HL(0.02, -0.5)[1])} r={f3(0.1 * hr)} fill={mixHex(VISOR, COLOR.board, 0.35)} />
      </g>
      {/* near leg */}
      {limb(g.hipJ, g.leg.E, g.leg.W, KID.thighW * U, KID.shinW * U, `url(#${uid}su)`, suit)}
      {boot(g.leg.W, g.leg.E, false)}
      {/* the kart: rail, side pod, bumper, nose with its blank number panel */}
      <path d={g.parts.rail} fill={RAIL} />
      <path d={g.parts.pod} fill={`url(#${uid}bk)`} />
      <path d={g.parts.bumper} fill={`url(#${uid}bk)`} />
      <path d={g.parts.nose} fill={`url(#${uid}bk)`} />
      <path d={g.parts.plate} fill={mixHex(body, COLOR.board, 0.3)} />
      <path d={g.parts.plateIn} fill={mixHex(body, LIGHT_TINT, 0.5)} />
      {/* steering column, front panel, wheel */}
      <path d={`M${f3(g.parts.column[0][0])} ${f3(g.parts.column[0][1])}L${f3(g.parts.column[1][0])} ${f3(g.parts.column[1][1])}`} stroke={STEER} strokeWidth={f3(0.022 * M * g.ks)} strokeLinecap="round" />
      <path d={g.parts.panel} fill={`url(#${uid}bk)`} />
      <path d={`M${f3(g.wheelA[0])} ${f3(g.wheelA[1])}L${f3(g.wheelB[0])} ${f3(g.wheelB[1])}`} stroke={STEER} strokeWidth={f3(0.034 * M * g.ks)} strokeLinecap="round" />
      {/* near arm: sleeve, glove on the wheel */}
      {limb(g.S, g.arm.E, g.arm.W, KID.armW * U, KID.armW * U * 0.94, topOf(suit))}
      <circle cx={f3(g.arm.W[0])} cy={f3(g.arm.W[1])} r={f3(KID.hand * U)} fill={glove} />
      {/* the tyres (outermost) */}
      <Wheel c={g.rearC} r={g.rearR} ang={spinDeg(g.rearR)} blur={blurOf(g.rearR)} dim={dim} />
      <Wheel c={g.frontC} r={g.frontR} ang={spinDeg(g.frontR)} blur={blurOf(g.frontR)} dim={dim} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TRACK
// ---------------------------------------------------------------------------
/** the asphalt tone (the board's ground mixed darker) */
export const ASPHALT = { color: COLOR.shadow, alpha: 0.26, kerb: mixHex(COLOR.ground, COLOR.board, 0.32) } as const;
/**
 * TrackStrip — one lane, side view: a darker band from `top` (the far edge, with a faint kerb line) to `bottom`
 * (the near edge, feathered into the board when `soft`), across x0..x1 (world px). Stack several for lanes (each one's
 * kerb line divides it from the one above). `k` = the camera k (the kerb line is 2 screen px).
 */
export const TrackStrip: React.FC<{ x0: number; x1: number; top: number; bottom: number; k: number; soft?: boolean; kerb?: boolean }> = ({ x0, x1, top, bottom, k, soft = true, kerb = true }) => {
  const uid = uidOf(useId());
  const h = bottom - top;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(bottom)}>
          <stop offset="0" stopColor={ASPHALT.color} stopOpacity={f3(ASPHALT.alpha)} />
          <stop offset={soft ? "0.55" : "1"} stopColor={ASPHALT.color} stopOpacity={f3(ASPHALT.alpha)} />
          <stop offset="1" stopColor={ASPHALT.color} stopOpacity={soft ? "0" : f3(ASPHALT.alpha)} />
        </linearGradient>
      </defs>
      <rect x={f3(x0)} y={f3(top)} width={f3(x1 - x0)} height={f3(h)} fill={`url(#${uid}a)`} />
      {kerb ? <rect x={f3(x0)} y={f3(top - 1 / k)} width={f3(x1 - x0)} height={f3(2 / k)} fill={ASPHALT.kerb} opacity={0.7} /> : null}
    </g>
  );
};
/** FinishLine — a chequered strip across a lane at x (world px), from top to bottom, `cols` x `rows` cells of cream and ink */
export const FinishLine: React.FC<{ x: number; top: number; bottom: number; w?: number; cols?: number; rows?: number; dim?: number }> = ({ x, top, bottom, w = 0.24 * M, cols = 2, rows = 4, dim = 0 }) => {
  const cw = w / cols;
  const ch = (bottom - top) / rows;
  const light = mixHex(COLOR.cream, COLOR.board, dim);
  const dark = mixHex(COLOR.inkDark, COLOR.boardFoot, dim * 0.4);
  const cells: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++)
      cells.push(<rect key={`${i}-${j}`} x={f3(x - w / 2 + i * cw)} y={f3(top + j * ch)} width={f3(cw + 0.3)} height={f3(ch + 0.3)} fill={(i + j) % 2 === 0 ? light : dark} />);
  return <g>{cells}</g>;
};

// ---------------------------------------------------------------------------
// THE F1 CAR — a 2022+ side profile facing right (metres, x from the cockpit, y up)
// ---------------------------------------------------------------------------
/** the outline's FORWARD strand: cockpit rim -> chassis -> nose -> down the nose pylon -> the front wing (low, under the
 *  nose tip, its own element with a gap to the nose) -> up the pylon -> under the nose -> chassis -> floor -> meeting point */
const F1_FWD =
  "M0 0.6 L0.3 0.61 C0.42 0.615 0.5 0.63 0.56 0.64 C0.9 0.64 1.4 0.6 1.9 0.535 C2.35 0.48 2.72 0.36 2.98 0.265 C3.03 0.245 3.05 0.22 3.03 0.2 " +
  "L3.04 0.125 C3.1 0.118 3.17 0.105 3.195 0.085 C3.215 0.06 3.2 0.035 3.15 0.035 L2.7 0.04 C2.65 0.045 2.63 0.08 2.64 0.11 C2.65 0.135 2.68 0.14 2.72 0.138 L2.96 0.128 " +
  "L2.95 0.19 C2.7 0.26 2.4 0.32 2.05 0.37 C1.75 0.38 1.5 0.33 1.36 0.24 C1.3 0.2 1.27 0.13 1.26 0.09 C1.25 0.05 1.22 0.03 1.16 0.03 L0 0.03";
/** the outline's BACKWARD strand: cockpit rim -> roll hoop / airbox -> engine cover down past the rear tyre -> gearbox ->
 *  up the pylon -> the rear wing (its own element, a gap over the gearbox) -> down the pylon -> beam wing -> diffuser -> floor */
const F1_BACK =
  "M0 0.6 L-0.2 0.6 C-0.26 0.6 -0.28 0.64 -0.29 0.7 C-0.31 0.82 -0.33 0.925 -0.41 0.948 C-0.47 0.962 -0.57 0.958 -0.67 0.932 " +
  "C-0.95 0.85 -1.2 0.7 -1.45 0.58 C-1.65 0.5 -1.85 0.46 -1.98 0.45 " +
  "C-2.0 0.5 -2.0 0.58 -1.99 0.64 C-1.95 0.65 -1.93 0.67 -1.93 0.71 C-1.94 0.81 -2.01 0.905 -2.12 0.925 L-2.36 0.93 C-2.4 0.93 -2.41 0.91 -2.41 0.88 " +
  "L-2.41 0.665 C-2.41 0.64 -2.39 0.632 -2.35 0.632 L-2.09 0.636 " +
  "C-2.09 0.57 -2.08 0.5 -2.06 0.462 L-2.22 0.455 C-2.26 0.452 -2.26 0.413 -2.22 0.41 L-2.04 0.405 C-2.01 0.38 -2.01 0.34 -2.03 0.315 " +
  "L-2.12 0.305 C-2.16 0.3 -2.17 0.27 -2.14 0.255 C-1.95 0.17 -1.78 0.08 -1.55 0.045 L-1.0 0.03 L0 0.03";
/** the halo: front pillar up from the chassis, the bar back over the helmet, the rear legs down into the roll hoop */
const F1_HALO = "M0.56 0.64 C0.53 0.74 0.47 0.84 0.36 0.872 C0.2 0.905 -0.05 0.905 -0.2 0.87 C-0.27 0.85 -0.3 0.8 -0.295 0.72";
/** details (metres). `rev`: drawn from the far end (a wishbone grows out of its wheel). Each one's draw window is
 *  COMPUTED below from where its start point sits on a line already drawn (see F1_CLOCK) */
const F1_DETAILS: { d: string; rev?: boolean }[] = [
  // the sidepod: inlet lip and the downwash ramp to the rear tyre
  { d: "M0.24 0.59 C0.24 0.5 0.27 0.38 0.31 0.31" },
  { d: "M0.24 0.59 C-0.1 0.56 -0.6 0.45 -1.06 0.34" },
  // sidepod undercut to the floor
  { d: "M0.31 0.31 C0.1 0.22 -0.3 0.15 -0.75 0.12" },
  // the floor's edge
  { d: "M1.25 0.095 L-1.07 0.095" },
  // the airbox mouth
  { d: "M-0.3 0.83 C-0.33 0.88 -0.37 0.905 -0.44 0.91" },
  // front wing elements (each starts on the endplate)
  { d: "M3.13 0.1 C3.0 0.105 2.86 0.1 2.72 0.1" },
  { d: "M3.2 0.065 C3.0 0.068 2.82 0.068 2.7 0.072" },
  // front suspension: the wishbones, out of the wheel into the chassis
  { d: "M1.4 0.48 L1.86 0.47", rev: true },
  { d: "M1.38 0.34 L1.86 0.33", rev: true },
  // rear wing: the flap's split, and the endplate's slot
  { d: "M-1.99 0.86 C-2.12 0.79 -2.26 0.75 -2.41 0.75" },
  // rear suspension, out of the rear wheel
  { d: "M-0.92 0.42 L-1.1 0.43", rev: true },
];
/** tyre axles (cockpit-relative x) */
const F1_TYRES = [F1.frontAxle, F1.rearAxle];

// ---- the draw-on clock: nothing floats. The two body strands run out from the cockpit at the same pace (draw = the
// fraction of each strand); a tyre ring starts where a strand meets it and runs round in step with the strand's
// hidden chord, so the strand comes back out of the ring's tip; every detail and the halo start when a drawn line
// reaches their first point. Computed once, in metres. ----
type Poly = { pts: P2[]; cum: number[]; len: number };
const polyOf = (d: string): Poly => {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const pts: P2[] = [];
  let cmd = "";
  let nums: number[] = [];
  let cur: P2 = [0, 0];
  const run = () => {
    if (cmd === "M" || cmd === "L")
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const nx: P2 = [nums[i], nums[i + 1]];
        // lines are subdivided (~1 cm) so the first point outside a tyre is found precisely
        const n = cmd === "L" || i > 0 ? Math.max(1, Math.ceil(Math.hypot(nx[0] - cur[0], nx[1] - cur[1]) / 0.01)) : 1;
        for (let s = 1; s < n; s++) pts.push([cur[0] + ((nx[0] - cur[0]) * s) / n, cur[1] + ((nx[1] - cur[1]) * s) / n]);
        cur = nx;
        pts.push(cur);
      }
    else if (cmd === "C")
      for (let i = 0; i + 5 < nums.length; i += 6) {
        const p0 = cur;
        const c1: P2 = [nums[i], nums[i + 1]];
        const c2: P2 = [nums[i + 2], nums[i + 3]];
        const p3: P2 = [nums[i + 4], nums[i + 5]];
        for (let s = 1; s <= 32; s++) {
          const t = s / 32;
          const u = 1 - t;
          const b = (q: 0 | 1) => u * u * u * p0[q] + 3 * u * u * t * c1[q] + 3 * u * t * t * c2[q] + t * t * t * p3[q];
          pts.push([b(0), b(1)]);
        }
        cur = p3;
      }
    nums = [];
  };
  for (const t of tokens) {
    if (/[MLCQZ]/.test(t)) {
      run();
      cmd = t;
    } else nums.push(parseFloat(t));
  }
  run();
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
/** the nearest point of a polyline to p: its length fraction and distance */
const nearestOn = (pl: Poly, p: P2) => {
  let best = { f: 0, dist: Infinity };
  for (let i = 1; i < pl.pts.length; i++) {
    const a = pl.pts[i - 1];
    const b = pl.pts[i];
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const L2 = vx * vx + vy * vy || 1e-9;
    const t = clamp01(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2);
    const dist = Math.hypot(a[0] + vx * t - p[0], a[1] + vy * t - p[1]);
    if (dist < best.dist) best = { f: (pl.cum[i - 1] + t * Math.sqrt(L2)) / pl.len, dist };
  }
  return best;
};
/** where a polyline crosses the circle (c, r): length fraction and angle (metres, y up) */
const crossingsOf = (pl: Poly, c: P2, r: number) => {
  const out: { f: number; ang: number }[] = [];
  for (let i = 1; i < pl.pts.length; i++) {
    const a = pl.pts[i - 1];
    const b = pl.pts[i];
    const d0 = Math.hypot(a[0] - c[0], a[1] - c[1]) - r;
    const d1 = Math.hypot(b[0] - c[0], b[1] - c[1]) - r;
    if ((d0 > 0) === (d1 > 0)) continue;
    const t = d0 / (d0 - d1);
    const q: P2 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    out.push({ f: (pl.cum[i - 1] + t * (pl.cum[i] - pl.cum[i - 1])) / pl.len, ang: Math.atan2(q[1] - c[1], q[0] - c[0]) });
  }
  return out;
};
const TAU = Math.PI * 2;
const modTau = (a: number) => ((a % TAU) + TAU) % TAU;
type RingClock = { c: P2; a0: number; dir: 1 | -1; m: number; fIn: number; fOut: number; te: number };
const ringProgress = (r: RingClock, t: number) =>
  t <= r.fIn ? 0 : t <= r.fOut ? (r.m * (t - r.fIn)) / (r.fOut - r.fIn) : r.m + (1 - r.m) * clamp01((t - r.fOut) / (r.te - r.fOut));
const ringTimeAt = (r: RingClock, ang: number) => {
  const g = modTau(r.dir * (ang - r.a0)) / TAU;
  return g <= r.m ? r.fIn + (g / r.m) * (r.fOut - r.fIn) : r.fOut + ((g - r.m) / (1 - r.m)) * (r.te - r.fOut);
};
const F1_CLOCK = (() => {
  const strands = [polyOf(F1_FWD), polyOf(F1_BACK)];
  const Lm = (strands[0].len + strands[1].len) / 2;
  const R = F1.tyreR;
  const rings: RingClock[] = F1_TYRES.map((ax) => {
    const c: P2 = [ax, R];
    const xs = strands.map((s, si) => crossingsOf(s, c, R).map((q) => ({ ...q, si })));
    const first = xs.flat().sort((a, b) => a.f - b.f)[0];
    const own = xs[first.si];
    const out = own[own.indexOf(own.find((q) => q.f === first.f)!) + 1];
    const delta = Math.atan2(Math.sin(out.ang - first.ang), Math.cos(out.ang - first.ang));
    const dir: 1 | -1 = delta >= 0 ? 1 : -1;
    const m = Math.abs(delta) / TAU;
    let te = Math.min(1, out.f + ((1 - m) * TAU * R) / strands[first.si].len);
    const ring = { c, a0: first.ang, dir, m, fIn: first.f, fOut: out.f, te };
    // every later strand crossing must find the ring already drawn there
    for (const q of xs.flat()) {
      if (q.f <= out.f + 1e-6) continue;
      const g = modTau(dir * (q.ang - first.ang)) / TAU;
      if (g > m) te = Math.min(te, out.f + ((q.f - out.f) * (1 - m)) / (g - m));
    }
    return { ...ring, te: Math.max(te, out.f + 0.02) };
  });
  const timed: { pl: Poly; t0: number; t1: number }[] = [];
  /** when is the metre point p first covered by a line already drawn */
  const coveredAt = (p: P2) => {
    let t = Infinity;
    for (const s of strands) {
      const n = nearestOn(s, p);
      if (n.dist < 0.035) t = Math.min(t, n.f);
    }
    for (const r of rings) {
      const dc = Math.hypot(p[0] - r.c[0], p[1] - r.c[1]);
      if (Math.abs(dc - R) < 0.05) t = Math.min(t, ringTimeAt(r, Math.atan2(p[1] - r.c[1], p[0] - r.c[0])));
    }
    for (const q of timed) {
      const n = nearestOn(q.pl, p);
      if (n.dist < 0.02) t = Math.min(t, q.t0 + n.f * (q.t1 - q.t0));
    }
    if (!Number.isFinite(t)) t = Math.min(...strands.map((s) => nearestOn(s, p).f));
    return Math.min(t, 0.96);
  };
  /** a stroke starting at its first point OUTSIDE the tyres (the part inside is masked) */
  const windowOf = (d: string) => {
    const pl = polyOf(d);
    let iv = 0;
    while (iv < pl.pts.length - 1 && rings.some((r) => Math.hypot(pl.pts[iv][0] - r.c[0], pl.pts[iv][1] - r.c[1]) < R)) iv++;
    const fv = pl.cum[iv] / pl.len;
    const tv = coveredAt(pl.pts[iv]);
    const dur = pl.len / Lm;
    const t0 = tv - fv * dur;
    const t1 = Math.min(1, t0 + dur);
    const w = { pl, t0, t1: Math.max(t1, tv + 0.02) };
    timed.push(w);
    return w;
  };
  const revD = (d: string) => {
    const pl = polyOf(d);
    return pl.pts
      .slice()
      .reverse()
      .map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`)
      .join(" ");
  };
  const details = F1_DETAILS.map((q) => {
    const d = q.rev ? revD(q.d) : q.d;
    const w = windowOf(d);
    return { d, a: w.t0, b: w.t1 };
  });
  const halo = windowOf(F1_HALO);
  return { rings, details, halo: { a: halo.t0, b: halo.t1 } };
})();
/** a tyre ring (world) as ONE stroke from angle a0 (metres, y up) round in `dir`, for draw-on */
const ringD = (r: RingClock, T: (x: number, y: number) => P2) => {
  const P = (a: number) => T(r.c[0] + F1.tyreR * Math.cos(a), r.c[1] + F1.tyreR * Math.sin(a));
  const rad = F1.tyreR * M;
  const sweepFlag = r.dir === 1 ? 0 : 1;
  const p0 = P(r.a0);
  let d = `M${f3(p0[0])} ${f3(p0[1])}`;
  for (let i = 1; i <= 3; i++) {
    const p = P(r.a0 + (r.dir * TAU * i) / 3);
    d += `A${f3(rad)} ${f3(rad)} 0 0 ${sweepFlag} ${f3(p[0])} ${f3(p[1])}`;
  }
  return d;
};

export type F1Props = {
  /** the ground point below the cockpit (world px) */
  x: number;
  y: number;
  /** camera k: strokes, edges and bloom are SCREEN px */
  k: number;
  /** 0..1 the line drawing on, from the cockpit outward */
  draw?: number;
  /** 0..1 the amber band filling the outline (a level rising from the floor) */
  fill?: number;
  /** 0..1 the one light sweep across the filled car (0 or 1 = none) */
  sweep?: number;
  /** "body" = everything under the kart; "halo" = the halo alone, drawn OVER the kart and the kid */
  layer?: "body" | "halo";
  /** the amber band (world y0, y1): amberBandFor(cam) */
  amberBand: [number, number];
  /** the line's width (screen px) */
  line?: number;
};

const F1_INK = mixHex(COLOR.amberFoot, COLOR.inkDark, 0.62);
/** the clear gap (m) between each tyre and the bodywork behind it: board shows through it */
const F1_TYRE_GAP = 0.055;
/** draw-window progress */
const win = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** an F1 metre point -> world */
export const f1ToWorld = (x: number, y: number, mx: number, my: number): P2 => [x + mx * M, y - my * M];

export const F1Outline: React.FC<F1Props> = ({ x, y, k, draw = 1, fill = 0, sweep = 0, layer = "body", amberBand, line = 6 }) => {
  const uid = uidOf(useId());
  const T = (mx: number, my: number): P2 => [x + mx * M, y - my * M];
  const lw = line / k;
  const dr = clamp01(draw);
  const fl = clamp01(fill);
  const top = y - F1.airboxTop * M - 0.02 * M;
  const level = lerp(y + 0.01 * M, top - 0.02 * M, smoothstep(fl));
  const amberLine = COLOR.amberTop;
  const dash = (t: number) => (t <= 0.0005 ? null : { strokeDasharray: `${f3(t)} 2`, pathLength: 1 });
  const stroke = (d: string, t: number, key: string, color = amberLine, w = lw) => {
    const ds = dash(t);
    return ds ? (
      <path key={key} d={d} fill="none" stroke={color} strokeWidth={f3(w)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ds.strokeDasharray} pathLength={1} />
    ) : null;
  };
  if (layer === "halo") {
    const haloD = mapPath(F1_HALO, T);
    const td = win(dr, F1_CLOCK.halo.a, F1_CLOCK.halo.b);
    const bar = 0.045 * M;
    return (
      <g style={{ filter: bloomFilter(k) }}>
        <defs>
          <AmberGradient id={`${uid}g`} y0={amberBand[0]} y1={amberBand[1]} />
          <clipPath id={`${uid}lv`}>
            <rect x={f3(x - 3 * M)} y={f3(level)} width={f3(6.5 * M)} height={f3(y + 0.2 * M - level)} />
          </clipPath>
        </defs>
        {stroke(haloD, td, "l")}
        {fl > 0 ? (
          <g clipPath={`url(#${uid}lv)`}>
            <path d={haloD} fill="none" stroke={`url(#${uid}g)`} strokeWidth={f3(bar)} strokeLinecap="round" strokeLinejoin="round" />
            <path d={haloD} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} strokeLinecap="round" transform={`translate(0 ${f3(-bar / 2 + EDGE.HOT / k)})`} />
          </g>
        ) : null}
      </g>
    );
  }
  const fwd = mapPath(F1_FWD, T);
  const back = mapPath(F1_BACK, T);
  const tyres = F1_CLOCK.rings.map((r) => ({ r, c: T(r.c[0], r.c[1]) }));
  const R = F1.tyreR * M;
  // while the line draws, the strands run INTO the tyre rings (joined); as the fill comes the clear gap opens
  const RG = lerp(R + lw * 0.4, R + Math.max(F1_TYRE_GAP * M, lw * 1.5), smoothstep(clamp01(fl / 0.25)));
  // the fill's two closed halves (painted separately: they overlap at the seam, so no hairline)
  const fwdClosed = mapPath(F1_FWD + " L-0.02 0.03 L-0.02 0.6 Z", T);
  const backClosed = mapPath(F1_BACK + " L0.02 0.03 L0.02 0.6 Z", T);
  const sw = clamp01(sweep);
  const band = SWEEP.band / k;
  const skewH = 1.0 * M;
  const skew = Math.tan((SWEEP.angle * Math.PI) / 180) * skewH;
  const sx = lerp(x + F1.rearWing * M - band - skew, x + F1.frontWing * M + band + skew, sw);
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}g`} y0={amberBand[0]} y1={amberBand[1]} />
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(x - 3 * M)} y={f3(y - 1.5 * M)} width={f3(6.5 * M)} height={f3(2 * M)}>
          <rect x={f3(x - 3 * M)} y={f3(y - 1.5 * M)} width={f3(6.5 * M)} height={f3(2 * M)} fill="#fff" />
          {tyres.map((t, i) => (
            <circle key={i} cx={f3(t.c[0])} cy={f3(t.c[1])} r={f3(RG)} fill="#000" />
          ))}
        </mask>
        <clipPath id={`${uid}lv`}>
          <rect x={f3(x - 3 * M)} y={f3(level)} width={f3(6.5 * M)} height={f3(y + 0.2 * M - level)} />
        </clipPath>
        <clipPath id={`${uid}sil`}>
          <path d={fwdClosed} />
          <path d={backClosed} />
        </clipPath>
      </defs>
      <g style={{ filter: bloomFilter(k) }}>
        {/* the line drawing: two strands from the cockpit; rings and details grow out of lines already drawn */}
        <g mask={`url(#${uid}m)`}>
          {stroke(fwd, dr, "f")}
          {stroke(back, dr, "b")}
          {F1_CLOCK.details.map((q, i) => stroke(mapPath(q.d, T), win(dr, q.a, q.b), `d${i}`))}
        </g>
        {tyres.map((t, i) => stroke(ringD(t.r, T), ringProgress(t.r, dr), `tr${i}`))}
        {/* the fill: the amber band rising from the floor; the tyres are separate objects in front of the bodywork
            (inkDark, an amber wheel cover), with a clear gap of board between each tyre and the body; the hot outline
            and the ink details stay drawn on top so the contour survives */}
        {fl > 0 ? (
          <g clipPath={`url(#${uid}lv)`}>
            <g mask={`url(#${uid}m)`}>
              <path d={fwdClosed} fill={`url(#${uid}g)`} />
              <path d={backClosed} fill={`url(#${uid}g)`} />
              <path d={fwd} fill="none" stroke={`url(#${uid}g)`} strokeWidth={f3(lw)} strokeLinejoin="round" />
              <path d={back} fill="none" stroke={`url(#${uid}g)`} strokeWidth={f3(lw)} strokeLinejoin="round" />
              {F1_DETAILS.map((q, i) => (
                <path key={i} d={mapPath(q.d, T)} fill="none" stroke={F1_INK} strokeWidth={f3(lw * 0.55)} strokeLinecap="round" />
              ))}
              <path d={fwd} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(lw * 0.42)} strokeLinejoin="round" strokeLinecap="round" />
              <path d={back} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(lw * 0.42)} strokeLinejoin="round" strokeLinecap="round" />
            </g>
            {tyres.map((t, i) => (
              <g key={i}>
                <circle cx={f3(t.c[0])} cy={f3(t.c[1])} r={f3(R)} fill={TYRE} />
                <circle cx={f3(t.c[0])} cy={f3(t.c[1])} r={f3(R * 0.86)} fill={TYRE_WALL} />
                <circle cx={f3(t.c[0])} cy={f3(t.c[1])} r={f3(F1.rimR * M)} fill={`url(#${uid}g)`} />
                <circle cx={f3(t.c[0])} cy={f3(t.c[1])} r={f3(F1.rimR * M)} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(lw * 0.42)} />
                <circle cx={f3(t.c[0])} cy={f3(t.c[1])} r={f3(F1.rimR * M * 0.22)} fill={F1_INK} />
                <circle cx={f3(t.c[0])} cy={f3(t.c[1])} r={f3(R)} fill="none" stroke={amberLine} strokeWidth={f3(lw)} />
              </g>
            ))}
          </g>
        ) : null}
        {/* the rising level's hot edge (inside the body), gone once the car is full */}
        {fl > 0 && fl < 1 ? (
          <g mask={`url(#${uid}m)`}>
            <g clipPath={`url(#${uid}sil)`}>
              <rect x={f3(x - 3 * M)} y={f3(level)} width={f3(6.5 * M)} height={f3(EDGE.HOT / k)} fill={COLOR.amberHot} />
            </g>
          </g>
        ) : null}
      </g>
      {/* the one light sweep (the payoff's click), clipped to the filled car */}
      {sw > 0 && sw < 1 ? (
        <g mask={`url(#${uid}m)`}>
        <g clipPath={`url(#${uid}sil)`}>
          <path
            d={`M${f3(sx - band / 2)} ${f3(y + 0.1 * M)}L${f3(sx - band / 2 + skew)} ${f3(y - 0.9 * M)}L${f3(sx + band / 2 + skew)} ${f3(y - 0.9 * M)}L${f3(sx + band / 2)} ${f3(y + 0.1 * M)}Z`}
            fill={COLOR.amberHot}
            fillOpacity={SWEEP.alpha}
            style={{ filter: `blur(${f3(SWEEP.soft / k)}px)` }}
          />
        </g>
        </g>
      ) : null}
    </g>
  );
};

/** the camera helper the cuts share: a world point (wx, wy) on screen point (sx, sy) at k */
export const camAt = (wx: number, wy: number, sx: number, sy: number, k: number): Cam => ({ x: wx - (sx - 540) / k, y: wy - (sy - 960) / k, k });
export { lerp, clamp01, smoothstep };
