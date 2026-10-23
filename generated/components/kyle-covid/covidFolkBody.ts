// ---------------------------------------------------------------------------
// covidFolkBody — the DRAWN present-day city cast of the Kyle Harper clip "Why COVID was impossible to contain"
// (kyle-covid) as flat gouache shapes on the texcoco rig (the romeFolk skeleton). Pure geometry:
// buildCovidFolk(kind, variant, pose, opts) -> { shapes, anchors } in FOLK units (the pandemics' units: FU folk units
// per rig unit), painted by covidFolk.tsx (pandemicFolkPaint's gouache filter and crescent shadow, the same hand).
// covidFolk.tsx is the API; this file is its geometry.
//
// COPIED (not imported) from kyle-rome-slavery/romeFolkBody.ts, read-only for this clip: the torso LATHE (makeBody,
// sampleRow), the head SPHERE (hProj, hInv, regionPoly), the tapered arm with the soft elbow rule (elbowOf), the
// mitten, the foot, the leg-hull garment (skirtOutline), the path helpers. Imported: the texcoco rig (figureRig), the
// paint's Shape type and mixC, the Worker's tube / smoothClosed curves.
// New here: modern clothes (puffer, parka, suit, coat, hoodie, cardigan; trousers with two legs; sneakers, shoes,
// boots), hats (beanie, flat cap, bobble), hair with a LIT SIDE (no flat dark masses), worried / neutral brows, an
// open mouth, droopy lids, glance; carried things (backpack, shoulder bag, handbag, phone, paper cup, earbuds,
// glasses, scarf); the INFECTION CONVENTION (lung glows, specks), SICK (pale grey-green skin, feverish flush, droopy
// lids, sweat); seated poses (any build), hands that go to the mouth / chest / lap / knee (handTo).
// ---------------------------------------------------------------------------
import { hash } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { STAND, figureRig, lerpFig, type ArmPose, type FigPose, type Spec } from "../kits/maps/texcocoFigures";
import { mixC, type Shape } from "../kyle-pandemics/pandemicFolkPaint";
import { smoothClosed, tube } from "../kyle-pandemics/pandemicFolkWorker";

export type P2 = [number, number];
/** folk units per rig unit (a rig man ~312 tall = the pandemics Worker's 513) */
export const FU = 513 / 312;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const D2R = Math.PI / 180;

/** a paint shape (pandemicFolkPaint's Shape) plus a soft blur (rig units) for the glows */
/** a radial gradient fill over the shape's own box (objectBoundingBox): stops [offset, #hex, opacity] */
export type RadialFill = { stops: [number, string, number][]; cx?: number; cy?: number; r?: number };
export type CShape = Shape & { blur?: number; glow?: boolean; blend?: "screen" | "normal"; grad?: RadialFill; litFrom?: boolean };

// ---- path helpers (rig units in, folk units out) -------------------------------------------------------------------
const f = (p: P2): P2 => [p[0] * FU, p[1] * FU];
export const closedD = (pts: P2[], tension = 1) => smoothClosed(pts.map(f), tension);
export const tubeD = (pts: P2[], ws: number[]) => tube(pts.map(f), ws.map((w) => w * FU));
export const ellPts = (c: P2, rx: number, ry: number, rotDeg = 0, n = 14): P2[] => {
  const cr = Math.cos(rotDeg * D2R);
  const sr = Math.sin(rotDeg * D2R);
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    return [c[0] + x * cr - y * sr, c[1] + x * sr + y * cr] as P2;
  });
};
export const ellD = (c: P2, rx: number, ry: number, rotDeg = 0) => closedD(ellPts(c, rx, ry, rotDeg));
export const lineD = (pts: P2[]) => `M ${pts.map((p) => `${n2(p[0] * FU)} ${n2(p[1] * FU)}`).join(" L ")}`;
export const qD = (a: P2, c: P2, b: P2) => `M ${n2(a[0] * FU)} ${n2(a[1] * FU)} Q ${n2(c[0] * FU)} ${n2(c[1] * FU)} ${n2(b[0] * FU)} ${n2(b[1] * FU)}`;
const area = (pts: P2[]) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
const cw = (pts: P2[]) => (area(pts) < 0 ? [...pts].reverse() : pts);
const centroid = (pts: P2[]): P2 => {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return [x / pts.length, y / pts.length];
};
const scaleAbout = (pts: P2[], c: P2, s: number): P2[] => pts.map((p) => add(c, mul(sub(p, c), s)));

// ===================================================================================================================
// THE BUILDS (texcoco Spec; rig units, a man ~312 to the top of the skull)
// ===================================================================================================================
const HEADK = 1.06;
export const MAN: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08 * HEADK, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [69, 66] };
const WOMAN: Spec = { ...MAN, a: 47, hw: 39, H: 89, hipY: -147, limb: 0.9, headScale: 1.03 * HEADK, arm: [55, 52], leg: [66, 64] };
const YOUTH: Spec = { ...MAN, a: 49, hw: 42, H: 92, hipY: -152, limb: 0.94, arm: [58, 55], leg: [69, 66] };
const ELDER: Spec = { ...MAN, a: 57, hw: 44, H: 90, hipY: -146, limb: 1, aged: true, arm: [56, 53], leg: [66, 63] };
const ELDER_W: Spec = { ...WOMAN, a: 50, hw: 39, H: 86, hipY: -142, arm: [53, 50], leg: [64, 61] };
const CHILD: Spec = { ...MAN, a: 33, hw: 28, H: 60, hipY: -92, limb: 0.66, headScale: 0.98, arm: [36, 34], leg: [39, 37] };

// ===================================================================================================================
// THE LOOKS (muted earthy local colours that sit in palette A's teal / espresso air; never near orange)
// ===================================================================================================================
export type CovidKind = "carrier" | "officer" | "commuter" | "elder" | "youth" | "parent" | "child" | "medic";
export const COVID_KINDS: CovidKind[] = ["carrier", "officer", "commuter", "elder", "youth", "parent", "child", "medic"];
export type HairKind = "crop" | "side" | "buzz" | "curly" | "receding" | "bob" | "long" | "bun" | "pony";
export type Top = "puffer" | "parka" | "suit" | "coat" | "hoodie" | "cardigan" | "coverall";
export type Lower = "trousers" | "skirt";
export type ShoeKind = "sneaker" | "dress" | "boot";
export type Hat = "none" | "beanie" | "flatcap" | "bobble" | "hood";
export type Carry = "none" | "backpack" | "shoulderBag";
export type HandProp = "none" | "phone" | "cup" | "handbag";
export type CovidInks = {
  skin: string;
  hair: string;
  /** the top garment (jacket / coat / hoodie) and its trim (collar, cuffs, lapels, pockets) */
  top: string;
  top2: string;
  /** the shirt under a suit / cardigan / coat, the tie */
  shirt: string;
  tie: string;
  /** trousers / skirt, tights under a skirt */
  lower: string;
  tights: string;
  shoe: string;
  sole: string;
  hat: string;
  hat2: string;
  /** bag body and its straps; the scarf */
  bag: string;
  strap: string;
  scarf: string;
  /** gloves ("none" = bare mitten hands) and a face mask ("none" = no mask) */
  glove: string;
  mask: string;
};
type Look = {
  spec: Spec;
  female: boolean;
  child: boolean;
  hair: HairKind;
  beard: "none" | "stubble";
  top: Top;
  /** how far the top hangs down the legs (0 = the hip, 1 = the knee) */
  topLen: number;
  lower: Lower;
  shoe: ShoeKind;
  hat: Hat;
  carry: Carry;
  /** what the hands hold by default (L = screen left when facing us) */
  hold: { L: HandProp; R: HandProp };
  tie: boolean;
  scarf: boolean;
  earbuds: boolean;
  glasses: boolean;
  plump: number;
  head: number;
  inks: CovidInks;
};
export const SKIN = { fair: "#E8C4A0", warm: "#DDB28E", olive: "#D2A57F", tan: "#C9976F", pale: "#EDCFB0", deep: "#A67A5E" };
export const HAIR = { darkBrown: "#4A3629", brown: "#5E4332", chestnut: "#6B4A36", blackBrown: "#3A2D25", dkBlonde: "#9A8466", grey: "#B9B2A6", white: "#D8D2C6", greyBrown: "#857868" };
const BASE: CovidInks = {
  skin: SKIN.warm,
  hair: HAIR.darkBrown,
  top: "#C9B994",
  top2: "#B5A57F",
  shirt: "#EEEAE0",
  tie: "#2F5552",
  lower: "#4E5961",
  tights: "#3E3C3C",
  shoe: "#3E3029",
  sole: "#2E2620",
  hat: "#8C4E42",
  hat2: "#7A4238",
  bag: "#5C4838",
  strap: "#4A3A2E",
  scarf: "#8C5A4C",
  glove: "none",
  mask: "none",
};
type LookOpts = Partial<Omit<Look, "inks" | "hold">> & { hold?: Partial<Look["hold"]>; spec: Spec };
const LK = (inks: Partial<CovidInks>, o: LookOpts): Look => ({
  female: false,
  child: false,
  hair: "crop",
  beard: "none",
  top: "puffer",
  topLen: 0.15,
  lower: "trousers",
  shoe: "sneaker",
  hat: "none",
  carry: "none",
  tie: false,
  scarf: false,
  earbuds: false,
  glasses: false,
  plump: 0,
  head: 1,
  ...o,
  hold: { L: "none", R: "none", ...(o.hold ?? {}) },
  inks: { ...BASE, ...inks },
});
// the Carrier's outfit (one silhouette, kept across variants: the viewer must know him again)
const CARRIER_FIT: Partial<CovidInks> = { top: "#D9CCAE", top2: "#C3B48F", lower: "#4E5961", shoe: "#ECE6DA", sole: "#8C9296", hat: "#8E4E42", hat2: "#7B4238", bag: "#5B4636", strap: "#47372B" };
// the Officer's suit (SARS-1, 2003)
const SUIT: Partial<CovidInks> = { top: "#7D7F7C", top2: "#6D6F6C", shirt: "#EEEAE0", tie: "#2F5552", lower: "#747673", shoe: "#3B2D25", sole: "#2A211B" };
const LOOKS: Record<CovidKind, Look[]> = {
  carrier: [
    LK({ ...CARRIER_FIT, skin: SKIN.warm, hair: HAIR.chestnut }, { spec: YOUTH, hair: "crop", hat: "beanie", top: "puffer", topLen: 0.18, carry: "backpack" }),
    LK({ ...CARRIER_FIT, skin: SKIN.olive, hair: HAIR.blackBrown }, { spec: YOUTH, hair: "crop", hat: "beanie", top: "puffer", topLen: 0.18, carry: "backpack" }),
    LK({ ...CARRIER_FIT, skin: SKIN.deep, hair: HAIR.blackBrown }, { spec: YOUTH, hair: "buzz", hat: "beanie", top: "puffer", topLen: 0.18, carry: "backpack" }),
  ],
  officer: [
    LK({ ...SUIT, skin: SKIN.fair, hair: HAIR.darkBrown }, { spec: MAN, hair: "side", top: "suit", topLen: 0.42, shoe: "dress", tie: true }),
    LK({ ...SUIT, top: "#6B6D6E", top2: "#5D5F60", lower: "#646668", skin: SKIN.olive, hair: HAIR.greyBrown }, { spec: MAN, hair: "side", top: "suit", topLen: 0.42, shoe: "dress", tie: true, plump: 0.3 }),
    LK({ ...SUIT, skin: SKIN.tan, hair: HAIR.blackBrown }, { spec: MAN, hair: "side", top: "suit", topLen: 0.42, shoe: "dress", tie: true }),
  ],
  commuter: [
    LK({ skin: SKIN.warm, hair: HAIR.brown, top: "#8E8668", top2: "#7A7358", lower: "#56626B", shoe: "#E4DED2", sole: "#7F858A", bag: "#5E4A3A", strap: "#4C3C30" }, { spec: MAN, hair: "crop", beard: "stubble", top: "parka", topLen: 0.5, carry: "shoulderBag" }),
    LK({ skin: SKIN.fair, hair: HAIR.greyBrown, top: "#4F4D4C", top2: "#444241", shirt: "#E6E1D6", lower: "#3F4144", shoe: "#3B2D25", scarf: "#8C5A4C" }, { spec: MAN, hair: "side", top: "coat", topLen: 1.05, shoe: "dress", scarf: true, hold: { R: "phone" } }),
    LK({ skin: SKIN.pale, hair: HAIR.chestnut, top: "#C6B596", top2: "#B3A281", lower: "#4A4746", shoe: "#5E4836", sole: "#3E3026", bag: "#7E4A3E", strap: "#6A3E34" }, { spec: WOMAN, female: true, hair: "long", top: "coat", topLen: 1.0, shoe: "boot", carry: "shoulderBag" }),
    LK({ skin: SKIN.tan, hair: HAIR.darkBrown, top: "#6F8E88", top2: "#5F7D77", lower: "#56626B", shoe: "#E4DED2", sole: "#7F858A" }, { spec: WOMAN, female: true, hair: "bob", top: "puffer", topLen: 0.15, hold: { R: "cup" } }),
  ],
  elder: [
    LK({ skin: SKIN.fair, hair: HAIR.white, top: "#9C9480", top2: "#8A826E", shirt: "#E6E0D2", lower: "#5E5040", shoe: "#3B2D25", hat: "#6E6450", hat2: "#5E5544" }, { spec: ELDER, hair: "crop", top: "cardigan", topLen: 0.25, shoe: "dress", hat: "flatcap", glasses: true, plump: 0.4 }),
    LK({ skin: SKIN.warm, hair: HAIR.white, top: "#7E4E44", top2: "#6C433A", lower: "#4E5961", shoe: "#3B2D25", bag: "#5E4A3A", strap: "#4C3C30" }, { spec: ELDER_W, female: true, hair: "curly", top: "coat", topLen: 0.95, shoe: "dress", glasses: true, hold: { L: "handbag" }, head: 0.97 }),
    LK({ skin: SKIN.olive, hair: HAIR.grey, top: "#5E6A70", top2: "#525D63", shirt: "#E6E0D2", lower: "#4A4440", shoe: "#3B2D25", scarf: "#C9B994" }, { spec: ELDER, hair: "crop", top: "coat", topLen: 1.0, shoe: "dress", scarf: true, plump: 0.25 }),
  ],
  youth: [
    LK({ skin: SKIN.tan, hair: HAIR.blackBrown, top: "#5F7F7A", top2: "#52706B", lower: "#56626B", shoe: "#E4DED2", sole: "#7F858A" }, { spec: YOUTH, hair: "crop", top: "hoodie", topLen: 0.14, earbuds: true, hold: { R: "phone" } }),
    LK({ skin: SKIN.deep, hair: HAIR.blackBrown, top: "#BFAF8E", top2: "#AB9B7A", lower: "#3F4144", shoe: "#E4DED2", sole: "#7F858A" }, { spec: YOUTH, hair: "curly", top: "hoodie", topLen: 0.14, earbuds: true }),
    LK({ skin: SKIN.fair, hair: HAIR.dkBlonde, top: "#9A9070", top2: "#87805F", lower: "#56626B", shoe: "#E4DED2", sole: "#7F858A" }, { spec: WOMAN, female: true, hair: "pony", top: "hoodie", topLen: 0.14, earbuds: true, hold: { R: "phone" } }),
  ],
  parent: [
    LK({ skin: SKIN.warm, hair: HAIR.brown, top: "#9A9070", top2: "#87805F", lower: "#56626B", shoe: "#5E4836", sole: "#3E3026" }, { spec: WOMAN, female: true, hair: "pony", top: "puffer", topLen: 0.2, shoe: "boot" }),
    LK({ skin: SKIN.olive, hair: HAIR.darkBrown, top: "#5E6A70", top2: "#525D63", lower: "#4A4746", shoe: "#3B2D25" }, { spec: MAN, hair: "side", beard: "stubble", top: "parka", topLen: 0.5, shoe: "boot" }),
  ],
  medic: [
    LK({ skin: SKIN.warm, hair: HAIR.darkBrown, top: "#E7E3D8", top2: "#D3CEC0", lower: "#E7E3D8", shoe: "#CFCABB", sole: "#9E998C", hat: "#E7E3D8", hat2: "#D3CEC0", glove: "#7E9A99", mask: "#F2EFE7" }, { spec: MAN, hair: "crop", top: "coverall", topLen: 0.0, shoe: "boot", hat: "hood" }),
    LK({ skin: SKIN.tan, hair: HAIR.blackBrown, top: "#E7E3D8", top2: "#D3CEC0", lower: "#E7E3D8", shoe: "#CFCABB", sole: "#9E998C", hat: "#E7E3D8", hat2: "#D3CEC0", glove: "#7E9A99", mask: "#F2EFE7" }, { spec: WOMAN, female: true, hair: "bun", top: "coverall", topLen: 0.0, shoe: "boot", hat: "hood" }),
  ],
  child: [
    LK({ skin: SKIN.pale, hair: HAIR.chestnut, top: "#6F8E88", top2: "#5F7D77", lower: "#4E5961", shoe: "#5E4836", sole: "#3E3026", hat: "#E2D8C2", hat2: "#C9BEA5" }, { spec: CHILD, child: true, hair: "crop", top: "puffer", topLen: 0.18, shoe: "boot", hat: "bobble", head: 0.88 }),
    LK({ skin: SKIN.tan, hair: HAIR.blackBrown, top: "#8C5A4C", top2: "#7A4E42", lower: "#4E5961", shoe: "#E4DED2", sole: "#7F858A" }, { spec: CHILD, child: true, female: true, hair: "bob", top: "puffer", topLen: 0.18, head: 0.88 }),
  ],
};
/** how many variants each kind has */
export const COVID_VARIANTS: Record<CovidKind, number> = Object.fromEntries(COVID_KINDS.map((k) => [k, LOOKS[k].length])) as Record<CovidKind, number>;
export const lookOf = (kind: CovidKind, variant = 0): Look => {
  const a = LOOKS[kind];
  return a[((Math.round(variant) % a.length) + a.length) % a.length];
};
export const isFemale = (kind: CovidKind, variant = 0) => lookOf(kind, variant).female;
export const covidSpec = (kind: CovidKind, variant = 0) => lookOf(kind, variant).spec;

// ===================================================================================================================
// THE POSE: the texcoco FigPose plus this cast's expression and acting fields
// ===================================================================================================================
export type HandTarget = "mouth" | "chest" | "lap" | "knee" | "elbowMouth" | "forehead";
export type HandTo = { to: HandTarget; amt: number };
export type CovidPose = FigPose & {
  /** the pupils' direction, head-local (-1..1 each; x + = screen right, y + = down) */
  look?: P2;
  /** mouth open 0..1 (talk, cough, gasp); FigPose.mouth >= 0.15 still draws a small smile */
  open?: number;
  /** worried brows 0..1 (the inner ends raised); never a frown */
  worry?: number;
  /** sitting 0..1 (blends the hips down onto a seat of seatH units, feet forward, for any build) */
  sit?: number;
  seatH?: number;
  /** a hand brought to a point of the figure's own body (amt 0..1 blends from the pose's own wrist target) */
  handTo?: { L?: HandTo; R?: HandTo };
  /** shoulders up and the head sunk a little (coughing, cold, sick) 0..1 */
  hunch?: number;
  /** a real LAUGH 0..1: a wide open smile (a crescent, corners up, a tongue), the eyes squeezed into happy arcs, the
   *  cheeks lifted. Overrides `open` and the lids while it is on. */
  laugh?: number;
};
/** the seat (units): a bench seat's top above the floor; the hip joint sits hipAbove over it */
export const SEAT = { h: 82, hipAbove: 16 };
const MAN_HIP = 152;
const lerpN = (a: number | undefined, b: number | undefined, t: number, d = 0) => mix(a ?? d, b ?? d, t);
const lerpHT = (a: HandTo | undefined, b: HandTo | undefined, t: number): HandTo | undefined => {
  if (!a && !b) return undefined;
  const aOn = !!a && a.amt > 0.001;
  const bOn = !!b && b.amt > 0.001;
  // the target is the one that is on (blend between two different targets only through zero: keep poses that way)
  const to = aOn && bOn ? (t < 0.5 ? a!.to : b!.to) : aOn ? a!.to : bOn ? b!.to : (a ?? b)!.to;
  return { to, amt: mix(a?.amt ?? 0, b?.amt ?? 0, t) };
};
/** lerp two cast poses (every FigPose channel and the cast's own fields) */
export const lerpPose = (a: CovidPose, b: CovidPose, t: number): CovidPose => ({
  ...lerpFig(a, b, t),
  look: [lerpN(a.look?.[0], b.look?.[0], t), lerpN(a.look?.[1], b.look?.[1], t)],
  open: lerpN(a.open, b.open, t),
  worry: lerpN(a.worry, b.worry, t),
  sit: lerpN(a.sit, b.sit, t),
  seatH: lerpN(a.seatH, b.seatH, t, SEAT.h),
  handTo: { L: lerpHT(a.handTo?.L, b.handTo?.L, t), R: lerpHT(a.handTo?.R, b.handTo?.R, t) },
  hunch: lerpN(a.hunch, b.hunch, t),
  laugh: lerpN(a.laugh, b.laugh, t),
});
const mArm = (a: ArmPose): ArmPose => ({ w: [-a.w[0], a.w[1]], elbow: [-a.elbow[0], a.elbow[1]], fist: a.fist, hand: -a.hand });
/** the pose facing the other way (L and R swap) */
export const mirrorPose = (q: CovidPose): CovidPose => ({
  ...q,
  yaw: -q.yaw,
  headYaw: -q.headYaw,
  roll: -q.roll,
  lean: -q.lean,
  armL: mArm(q.armR),
  armR: mArm(q.armL),
  footL: [-q.footR[0], q.footR[1]],
  footR: [-q.footL[0], q.footL[1]],
  liftL: -q.liftR,
  liftR: -q.liftL,
  hem: -q.hem,
  look: q.look ? [-q.look[0], q.look[1]] : undefined,
  handTo: q.handTo ? { L: q.handTo.R, R: q.handTo.L } : undefined,
});

// ===================================================================================================================
// THE TORSO LATHE (copied from romeFolkBody; torso-local rig units: the hips at (0, 0), up -y)
// ===================================================================================================================
type Row = { y: number; a: number; b: number; c: number };
const sampleRow = (R: Row[], y: number): Row => {
  if (y <= R[0].y) return R[0];
  for (let i = 1; i < R.length; i++) {
    if (y <= R[i].y) {
      const t = (y - R[i - 1].y) / (R[i].y - R[i - 1].y);
      const tt = ease(t);
      return { y, a: mix(R[i - 1].a, R[i].a, tt), b: mix(R[i - 1].b, R[i].b, tt), c: mix(R[i - 1].c, R[i].c, tt) };
    }
  }
  return R[R.length - 1];
};
type Body = {
  s: number;
  cY: number;
  on: (p: P2, out?: number) => { p: P2; d: number };
  edge: (y: number) => [number, number];
  /** a torso-local 3D point (x across, y, z toward the viewer at yaw 0) -> screen x (torso-local) and depth */
  pt3: (x: number, y: number, z: number) => { p: P2; d: number };
  row: (y: number) => Row;
};
const makeBody = (rows: Row[], yaw: number): Body => {
  const s = Math.sin(yaw);
  const cY = Math.cos(yaw);
  const on = (p: P2, out = 0): { p: P2; d: number } => {
    const r = sampleRow(rows, p[1]);
    const A = r.a + out;
    const B = r.b + out;
    const term = Math.atan2(A * cY, B * s);
    const xc = Math.max(-A, Math.min(A, p[0]));
    const ph = Math.max(term - Math.PI, Math.min(Math.asin(xc / A), term));
    const wf = Math.hypot(A * cY, B * s) / A;
    const X = A * Math.sin(ph) * cY + B * Math.cos(ph) * s + (p[0] - xc) * wf + r.c * s;
    const dz = (-Math.sin(ph) * s) / A + (Math.cos(ph) * cY) / B;
    const nl = Math.hypot(Math.sin(ph) / A, Math.cos(ph) / B) || 1;
    return { p: [X, p[1]], d: dz / nl };
  };
  const edge = (y: number): [number, number] => {
    const r = sampleRow(rows, y);
    const w = Math.hypot(r.a * cY, r.b * s);
    return [r.c * s - w, r.c * s + w];
  };
  const pt3 = (x: number, y: number, z: number) => ({ p: [x * cY + z * s, y] as P2, d: z * cY - x * s });
  return { s, cY, on, edge, pt3, row: (y) => sampleRow(rows, y) };
};
const torsoRows = (L: Look, shY: number, hunch: number): Row[] => {
  const sp = L.spec;
  const hw = sp.hw;
  const A = sp.a;
  const pl = L.plump;
  const belly = A * (1.0 + 0.08 * pl);
  const hu = 6 * hunch;
  const rows: Row[] = [
    { y: shY - 9 - hu, a: 12, b: 10, c: 0 },
    { y: shY - 4 - hu, a: hw * 0.62, b: hw * 0.42, c: 0 },
    { y: shY + 4 - hu * 0.7, a: hw * 0.9, b: hw * 0.54, c: 1 },
    { y: shY + 22, a: hw * 0.95, b: hw * 0.58, c: 2 },
    { y: shY + 50, a: Math.max(hw * 0.95, A * 0.9 + 4 * pl), b: A * 0.58 + 6 * pl, c: 3 + 6 * pl },
    { y: -30, a: belly, b: A * (0.6 + 0.14 * pl), c: 4 + 10 * pl },
    { y: -10, a: A * (0.99 + 0.05 * pl), b: A * (0.62 + 0.1 * pl), c: 3 + 6 * pl },
    { y: 8, a: A * 0.95, b: A * 0.58, c: 1 },
  ];
  if (L.female && !L.child) {
    rows[4] = { ...rows[4], a: hw * 0.98, b: A * 0.6, c: 4 };
    rows[5] = { ...rows[5], a: A * 0.92 };
  }
  return rows;
};

// ===================================================================================================================
// THE HEAD (copied from romeFolkBody: a sphere, features and regions turned by yaw and nod)
// ===================================================================================================================
type Head = { C: P2; R: number; roll: number; yaw: number; pitch: number };
const hToFig = (h: Head, u: P2): P2 => add(h.C, rot([u[0] * h.R, u[1] * h.R], h.roll));
const hProj = (h: Head, beta: number, phi: number, rr = 1): { p: P2; d: number } => {
  const x0 = rr * Math.cos(phi) * Math.sin(beta + h.yaw);
  const y0 = -rr * Math.sin(phi);
  const d0 = Math.cos(phi) * Math.cos(beta + h.yaw);
  const cp = Math.cos(h.pitch);
  const spc = Math.sin(h.pitch);
  const y1 = y0 * cp + d0 * rr * spc;
  const d1 = d0 * cp - (y0 / rr) * spc;
  return { p: hToFig(h, [x0, y1]), d: d1 };
};
const wrapPi = (a: number) => {
  let v = a;
  while (v > Math.PI) v -= 2 * Math.PI;
  while (v < -Math.PI) v += 2 * Math.PI;
  return v;
};
const hInv = (h: Head, x: number, y: number): [number, number] => {
  const d = Math.sqrt(Math.max(0, 1 - x * x - y * y));
  const cp = Math.cos(h.pitch);
  const spc = Math.sin(h.pitch);
  const y0 = y * cp - d * spc;
  const d0 = d * cp + y * spc;
  const phi = Math.asin(Math.max(-1, Math.min(1, -y0)));
  const beta = wrapPi(Math.atan2(x, d0) - h.yaw);
  return [beta, phi];
};
/** a region on the sphere as a screen polygon (head-local unit coords), scanned column by column (romeFolkBody) */
const regionPoly = (h: Head, inside: (beta: number, phi: number) => boolean, mode: "top" | "bottom", vol = 1.0, N = 36): P2[] => {
  const M = 40;
  const column = (x: number): [number, number] | null => {
    const yr = Math.sqrt(Math.max(0, 1 - x * x)) * 0.9995;
    const y0 = mode === "top" ? -yr : yr;
    const y1 = -y0;
    const ins = (y: number) => {
      const [b, p] = hInv(h, x, y);
      return inside(b, p);
    };
    const bis = (a0: number, b0: number, wantIn: boolean) => {
      let a = a0;
      let b = b0;
      for (let k = 0; k < 10; k++) {
        const m = (a + b) / 2;
        if (ins(m) === wantIn) b = m;
        else a = m;
      }
      return (a + b) / 2;
    };
    let start = NaN;
    let prev = y0;
    if (ins(y0)) start = y0;
    else {
      for (let j = 1; j <= M; j++) {
        const y = mix(y0, y1, j / M);
        if (ins(y)) {
          start = bis(prev, y, true);
          break;
        }
        prev = y;
      }
    }
    if (Number.isNaN(start)) return null;
    let last = start;
    const j0 = Math.ceil(((start - y0) / (y1 - y0)) * M + 1e-9);
    for (let j = Math.max(1, j0); j <= M; j++) {
      const y = mix(y0, y1, j / M);
      if (!ins(y)) return [start, bis(y, last, true)];
      last = y;
    }
    return [start, y1];
  };
  const xs: number[] = [];
  for (let i = 0; i <= N; i++) xs.push((-1 + (2 * i) / N) * 0.999);
  const cols = xs.map(column);
  let best: [number, number] = [-1, -1];
  let st = -1;
  for (let i = 0; i <= N + 1; i++) {
    const ok = i <= N && cols[i] !== null;
    if (ok && st < 0) st = i;
    if (!ok && st >= 0) {
      if (i - 1 - st > best[1] - best[0]) best = [st, i - 1];
      st = -1;
    }
  }
  if (best[0] < 0) return [];
  const refine = (xIn: number, xOut: number) => {
    let a = xIn;
    let b = xOut;
    for (let k = 0; k < 10; k++) {
      const m = (a + b) / 2;
      if (column(m)) a = m;
      else b = m;
    }
    return a;
  };
  const xsR: number[] = [];
  const cR: [number, number][] = [];
  const endPt = (xe: number) => {
    const cc = column(xe);
    const ym = cc ? (cc[0] + cc[1]) / 2 : 0;
    xsR.push(xe);
    cR.push([ym, ym]);
  };
  if (best[0] > 0) endPt(refine(xs[best[0]], xs[best[0] - 1]));
  for (let i = best[0]; i <= best[1]; i++) {
    xsR.push(xs[i]);
    cR.push(cols[i] as [number, number]);
  }
  if (best[1] < N) endPt(refine(xs[best[1]], xs[best[1] + 1]));
  const volP = (p: P2): P2 => {
    const rr = Math.hypot(p[0], p[1]);
    const kk = 1 + (vol - 1) * sst(0.9, 0.999, rr);
    return [p[0] * kk, p[1] * kk];
  };
  const rimSide: P2[] = xsR.map((x, i) => volP([x, cR[i][0]]));
  const inner: P2[] = xsR.map((x, i): P2 => volP([x, cR[i][1]])).reverse();
  return [...rimSide, ...inner];
};
/** the head radius (rig units) and its lift over the rig's head centre */
export const HEAD_R = 38;
export const HEAD_UP = 3;

// ===================================================================================================================
// THE RIG POSE (any build): retarget a man's pose to the build, sit, hunch, hands to the body
// ===================================================================================================================
type Rig = ReturnType<typeof figureRig>;
type ArmRig = Rig["armL"];
type LegRig = Rig["legL"];
const headOf = (L: Look, r: Rig, q: FigPose, hunch: number): Head => {
  const HR = HEAD_R * L.head * (L.female ? 0.96 : 1);
  const C0 = add(r.headC, rot([0, -HEAD_UP + 7 * hunch], r.headAngle));
  return { C: C0, R: HR, roll: r.headAngle, yaw: q.headYaw, pitch: Math.max(-0.25, Math.min(0.55, ((q.pitch * Math.PI) / 180) * 0.8)) * Math.cos(q.headYaw) };
};
/** the mouth, the chest (between the lungs), a knee and the lap of a rigged pose (figure-local rig units) */
const bodyPoints = (L: Look, r: Rig, q: FigPose, hunch: number) => {
  const h = headOf(L, r, q, hunch);
  const mouth = hProj(h, 0, -0.42, 1.0).p;
  const shY = r.shY;
  const chest = r.toFig([Math.sin(q.yaw) * 6, shY + 36]);
  const G = r.s >= 0 ? 1 : -1;
  const kneeN = G > 0 ? r.legL.K : r.legR.K;
  const lap = mix2(r.hip, kneeN, 0.62);
  return { mouth, chest, knee: kneeN, lap, head: h };
};
/** the FigPose the rig is solved with, for this build: a man's pose retargeted (scaled to the build's hip height),
 *  the seat (sit, seatH) and the hands brought to the body (handTo) */
export const rigPose = (kind: CovidKind, variant: number, q0: CovidPose): FigPose => {
  const L = lookOf(kind, variant);
  const sp = L.spec;
  const sg = -sp.hipY / MAN_HIP;
  let q: FigPose =
    Math.abs(sg - 1) < 1e-6
      ? q0
      : { ...q0, crouch: q0.crouch * sg, footL: mul(q0.footL, sg), footR: mul(q0.footR, sg), armL: { ...q0.armL, w: mul(q0.armL.w, sg) }, armR: { ...q0.armR, w: mul(q0.armR.w, sg) } };
  const sit = c01(q0.sit ?? 0);
  if (sit > 0.0001) {
    const seatH = q0.seatH ?? SEAT.h;
    const hipH = seatH + SEAT.hipAbove * sg;
    const crouchS = -hipH - sp.hipY;
    const asn = Math.abs(Math.sin(q.yaw));
    const dir = Math.sin(q.yaw) >= 0 ? 1 : -1;
    // the thigh seen toward the camera is foreshortened (handled in specFor); the feet go forward by the thigh's
    // screen length, on the floor when the shin reaches it, dangling below the knee when it does not
    const thighS = sp.leg[0] * mix(0.32, 1, asn);
    const fx = dir * thighS * 0.93;
    const Hy = -hipH + 2;
    const ankleY = Math.min(-15, Hy + 0.12 * sp.leg[0] + 0.94 * sp.leg[1]);
    const oy = ankleY + 15;
    const seatFoot = (o: P2, sgn: number): P2 => [mix(o[0], fx + o[0] * 0.3 + sgn * 4 * (1 - asn), sit), mix(o[1], oy + o[1] * 0.3, sit)];
    q = { ...q, crouch: mix(q.crouch, crouchS, sit), footL: seatFoot(q.footL, -1), footR: seatFoot(q.footR, 1) };
  }
  const ht = q0.handTo;
  if (ht && ((ht.L?.amt ?? 0) > 0.0005 || (ht.R?.amt ?? 0) > 0.0005)) {
    const hunch = c01(q0.hunch ?? 0);
    const r = figureRig(specFor(L, q0), q);
    const bp = bodyPoints(L, r, q, hunch);
    const G = r.s >= 0 ? 1 : -1;
    const fwd = G;
    const target = (t: HandTarget, side: number): { w: P2; elbow: P2; fist: number; hand: number } => {
      // side: +1 = this arm is the near arm (when facing right: armL)
      switch (t) {
        case "mouth":
          return { w: add(bp.mouth, [fwd * (7 + 3 * side), 15]), elbow: [fwd * 0.3, 1], fist: 1, hand: -fwd * 10 };
        case "elbowMouth":
          return { w: add(bp.mouth, [-fwd * 30, 2]), elbow: [fwd * 1, 0.15], fist: 0.9, hand: 0 };
        case "chest":
          return { w: add(bp.chest, [fwd * (10 + 6 * side), 14]), elbow: [fwd * 0.2, 1], fist: 0.3, hand: -fwd * 30 };
        case "forehead":
          return { w: add(hProj(bp.head, 0, 0.42, 1).p, [fwd * 22, 12]), elbow: [fwd * 0.6, 0.8], fist: 0.1, hand: -fwd * 70 };
        case "knee":
          return { w: add(bp.knee, [-fwd * 6, -14]), elbow: [fwd * 0.4, 1], fist: 0.2, hand: fwd * 20 };
        default:
          return { w: add(bp.lap, [fwd * (4 + 8 * side), -12]), elbow: [fwd * 0.3, 1], fist: 0.25, hand: fwd * 30 };
      }
    };
    const apply = (ap: ArmPose, h: HandTo | undefined, side: number): ArmPose => {
      if (!h || h.amt <= 0.0005) return ap;
      const T = target(h.to, side);
      const a = c01(h.amt);
      return { w: mix2(ap.w, T.w, a), elbow: mix2(ap.elbow, T.elbow, a), fist: mix(ap.fist, T.fist, a), hand: mix(ap.hand, T.hand, a) };
    };
    q = { ...q, armL: apply(q.armL, ht.L, G > 0 ? 1 : -1), armR: apply(q.armR, ht.R, G > 0 ? -1 : 1) };
  }
  return q;
};
/** the spec the rig is solved with: a seated figure's thighs foreshortened toward the camera */
const specFor = (L: Look, q: CovidPose): Spec => {
  const sit = c01(q.sit ?? 0);
  if (sit <= 0.0001) return L.spec;
  const asn = Math.abs(Math.sin(q.yaw));
  const k = mix(1, mix(0.32, 1, asn), sit);
  return { ...L.spec, leg: [L.spec.leg[0] * k, L.spec.leg[1]] };
};
/** the rig of a cast member in a pose (texcoco figureRig on the build, the pose retargeted) */
export const covidRig = (kind: CovidKind, variant: number, q0: CovidPose) => {
  const L = lookOf(kind, variant);
  const q = rigPose(kind, variant, q0);
  return { L, q, r: figureRig(specFor(L, q0), q) };
};
/** the pose with its arms solved so the hand grips land on world points (gripTo of romeCast on this build) */
export const covidGripTo = (kind: CovidKind, variant: number, pose: CovidPose, grip: { L?: P2; R?: P2 }, at: P2, scale: number): CovidPose => {
  const L = lookOf(kind, variant);
  const sp = specFor(L, pose);
  let q: CovidPose = pose;
  const sg = -L.spec.hipY / MAN_HIP;
  for (let it = 0; it < 6; it++) {
    const r = figureRig(sp, rigPose(kind, variant, q));
    const solve = (T: P2 | undefined, ar: ArmRig, ap: ArmPose): ArmPose => {
      if (!T) return ap;
      const t: P2 = [(T[0] - at[0]) / scale, (T[1] - at[1]) / scale];
      // the pose's wrist targets are a man's (rigPose scales them by sg): undo it
      return { ...ap, w: mul(sub(t, mul(ar.dir, 11 * sp.limb)), 1 / sg) };
    };
    q = { ...q, armL: solve(grip.L, r.armL, q.armL), armR: solve(grip.R, r.armR, q.armR), handTo: { L: grip.L ? undefined : q.handTo?.L, R: grip.R ? undefined : q.handTo?.R } };
  }
  return q;
};

// ---- garment hulls (the hem is a continuous function of the pose; copied from romeFolkBody's skirtOutline) --------
const circ = (c: P2, r: number, n = 12): P2[] => Array.from({ length: n }, (_, i): P2 => [c[0] + r * Math.cos((i * 2 * Math.PI) / n), c[1] + r * Math.sin((i * 2 * Math.PI) / n)]);
const hull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
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
const dot = (a: P2, b: P2) => a[0] * b[0] + a[1] * b[1];
const closestOnSeg = (p: P2, a: P2, b: P2): P2 => {
  const d = sub(b, a);
  const L2 = dot(d, d) || 1e-9;
  return add(a, mul(d, c01(dot(sub(p, a), d) / L2)));
};
const resampleClosed = (poly: P2[], n: number, start: P2, passes = 3): P2[] => {
  const m = poly.length;
  let bi = 0;
  let bt = 0;
  let bd = Infinity;
  for (let i = 0; i < m; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % m];
    const qq = closestOnSeg(start, a, b);
    const dd = vlen(sub(start, qq));
    if (dd < bd) {
      bd = dd;
      bi = i;
      const Ln = vlen(sub(b, a));
      bt = Ln > 1e-9 ? vlen(sub(qq, a)) / Ln : 0;
    }
  }
  const ring: P2[] = [mix2(poly[bi], poly[(bi + 1) % m], bt)];
  for (let i = 1; i <= m; i++) ring.push(poly[(bi + i) % m]);
  ring.push(ring[0]);
  const cum: number[] = [0];
  for (let i = 1; i < ring.length; i++) cum.push(cum[i - 1] + vlen(sub(ring[i], ring[i - 1])));
  const tot = cum[cum.length - 1] || 1;
  const out: P2[] = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const sv = (i / n) * tot;
    while (j < ring.length - 1 && cum[j] < sv) j++;
    const fr = (sv - cum[j - 1]) / Math.max(1e-9, cum[j] - cum[j - 1]);
    out.push(mix2(ring[j - 1], ring[j], c01(fr)));
  }
  let sm = out;
  for (let pass = 0; pass < passes; pass++) sm = sm.map((p, i) => mix2(mix2(sm[(i - 1 + n) % n], sm[(i + 1) % n], 0.5), p, 0.5));
  return sm;
};
const legPtOf = (l: LegRig, fr: number): P2 => (fr <= 1 ? mix2(l.H, l.K, fr) : mix2(l.K, l.A, Math.min(1, fr - 1)));
const legRadOf = (fr: number) => (fr <= 1 ? mix(31, 25, fr) : mix(25, 18, Math.min(1, fr - 1)));
/** a garment hanging from the waist (wy, torso-local) down the legs to `len` (0 hip .. 1 knee .. 2 ankle), `flare`
 *  units wider at its hem: the hull of the legs (radius x `narrow`), its bottom cut flat along the hem line through
 *  the two legs' hem points (slope limited: the hem hangs), resampled and smoothed (figure-local rig units) */
const hangHull = (r: Rig, B: Body, k: number, wy: number, len: number, flare: number, hdx: number, out = 0, narrow = 1): P2[] => {
  const [el, er] = B.edge(wy);
  const waist = [r.toFig([el - out + 1, wy]), r.toFig([er + out - 1, wy])];
  const pts: P2[] = [...waist];
  const rad = (fr: number) => (legRadOf(fr) * narrow + out + flare * (fr / Math.max(0.01, len))) * k;
  for (const l of [r.legL, r.legR]) {
    const n = Math.max(2, Math.ceil(len / 0.2));
    for (let i = 0; i <= n; i++) {
      const fr = (i / n) * len;
      pts.push(...circ(add(legPtOf(l, fr), [hdx * 0.3 * (fr / Math.max(0.01, len)), 0]), rad(fr), 16));
    }
  }
  // the hem line: through the legs' hem points, a little below them, nearly level
  const hl = add(legPtOf(r.legL, len), [hdx * 0.3, 0]);
  const hr = add(legPtOf(r.legR, len), [hdx * 0.3, 0]);
  const drop = rad(len) * 0.42;
  const mx = (hl[0] + hr[0]) / 2;
  const my = (hl[1] + hr[1]) / 2 + drop;
  const dxh = hr[0] - hl[0];
  const slope = Math.max(-0.12, Math.min(0.12, Math.abs(dxh) > 1 ? (hr[1] - hl[1]) / dxh : 0));
  const yLine = (x: number) => my + slope * (x - mx);
  const H0 = hull(pts.map((p): P2 => [p[0], Math.min(p[1], -1.5)]));
  // resample densely first so the cut makes a straight run, then cut, then smooth (rounded corners)
  const dense = resampleClosed(H0, 220, waist[0], 0).map((p): P2 => [p[0], Math.min(p[1], yLine(p[0]))]);
  return resampleClosed(dense, 160, waist[0], 3);
};

// ===================================================================================================================
// BUILD
// ===================================================================================================================
export type BuildOpts = {
  /** colour overrides for this figure */
  inks?: Partial<CovidInks>;
  /** what the hands hold (overrides the look's default) */
  hold?: { L?: HandProp; R?: HandProp };
  /** the backpack / shoulder bag (overrides the look's) */
  carry?: Carry;
  /** 0..1 the virus in the lungs: two soft lung-shaped orange glows behind the clothes, specks drifting inside */
  infected?: number;
  /** 0..1 visibly ill: skin pales toward grey-green, a feverish flush, droopy lids, worried brows, a sweat drop */
  sick?: number;
  /** 0..1 toward DEAD #8A7B62 (cloth and hair), the skin greying (romeFolk's drain) */
  drain?: number;
  /** frames: drives the specks drifting inside the lungs (pass the cut's frame) */
  frame?: number;
  /** "v3" (default): LIGHT, not paint: two lung lobes (the classic silhouette, the inner edge concave toward the
   *  heart) each a bright core falling off softly to a transparent edge, a soft halo into the cloth, a faint luminous
   *  windpipe and bronchi (the Y) rising into the neck; "v2" (round 2: flat lobes) and "v1" (the first version) are
   *  kept for comparison sheets only */
  glowStyle?: "v1" | "v2" | "v3";
};
export type CovidAnchors = {
  headC: P2;
  headR: number;
  headTop: P2;
  /** the mouth, and the way the breath leaves it (a unit vector: the face's direction, a little down) */
  mouth: P2;
  mouthDir: P2;
  eyes: [P2, P2];
  /** the lungs' centres (L = screen left when facing us) and the point between them */
  lungL: P2;
  lungR: P2;
  chest: P2;
  shoulderL: P2;
  shoulderR: P2;
  wristL: P2;
  wristR: P2;
  /** the hand grips (texcoco: 11 units past the wrist) and the mittens' centres */
  handL: P2;
  handR: P2;
  mittenL: P2;
  mittenR: P2;
  hip: P2;
  kneeL: P2;
  kneeR: P2;
  ankleL: P2;
  ankleR: P2;
  /** the toes and heels of the feet (for contact checks) */
  toeL: P2;
  toeR: P2;
  heelL: P2;
  heelR: P2;
  /** the lowest corners of the hanging garment's hem (or the hip line) */
  hemL: P2;
  hemR: P2;
};
export type CovidBuild = { shapes: CShape[]; anchors: CovidAnchors; heightUnits: number };

const ACC = "#FFB000";
const ACC_HOT = "#FFC94D";
const ACC_SPECK = "#FFE7A8";
const DEAD_C = "#8A7B62";
const SICK_SKIN = "#BFC4A3";
const FLUSH = "#CC6F6C";
const SHADE_TO = "#2C3433";

/** the two lungs in front-view torso-local units (x in shoulder half-widths, y below the shoulder line) */
const LUNG_R: P2[] = [[-0.16, 7], [-0.4, 9], [-0.63, 19], [-0.78, 35], [-0.84, 52], [-0.74, 61], [-0.48, 60], [-0.24, 58], [-0.12, 44], [-0.1, 25]];
const LUNG_L: P2[] = [[0.16, 7], [0.4, 9], [0.63, 19], [0.78, 35], [0.84, 52], [0.74, 61], [0.52, 60], [0.36, 54], [0.24, 46], [0.13, 36], [0.11, 22]];
/** v2 (the director's fix, cut 3): two clearly rounded LOBES either side of the sternum at the lungs' real height (from
 *  just under the collarbones to the lower ribs), a wide dark gap between them; the left lung (screen right) with the
 *  heart's notch. x in shoulder half-widths, y below the shoulder line. */
/** v3: the classic lung silhouette: a rounded apex under the collarbone, a convex outer edge, the diaphragm's curve
 *  at the base, the inner (medial) edge concave toward the heart, deeper on the left lung (screen right) */
const LUNG3_R: P2[] = [[-0.36, 10], [-0.5, 11.5], [-0.65, 17], [-0.78, 27], [-0.87, 40], [-0.91, 53], [-0.88, 62], [-0.76, 68], [-0.6, 64], [-0.44, 61], [-0.3, 63], [-0.23, 58], [-0.25, 50], [-0.3, 42], [-0.28, 32], [-0.24, 22], [-0.27, 13]];
const LUNG3_L: P2[] = [[0.36, 10], [0.5, 11.5], [0.65, 17], [0.78, 27], [0.87, 40], [0.91, 53], [0.88, 62], [0.76, 68], [0.6, 65], [0.48, 62], [0.4, 58], [0.37, 52], [0.35, 45], [0.31, 37], [0.26, 28], [0.24, 20], [0.27, 13]];
const LOBE_R: P2[] = [[-0.24, 16], [-0.33, 11], [-0.47, 9.5], [-0.63, 13], [-0.78, 22], [-0.88, 35], [-0.92, 49], [-0.88, 60], [-0.74, 67], [-0.56, 64], [-0.4, 62], [-0.27, 65], [-0.22, 58], [-0.21, 42], [-0.21, 26]];
const LOBE_L: P2[] = [[0.24, 16], [0.33, 11], [0.47, 9.5], [0.63, 13], [0.78, 22], [0.88, 35], [0.92, 49], [0.88, 60], [0.74, 67], [0.57, 64], [0.46, 60], [0.38, 53], [0.31, 46], [0.25, 37], [0.22, 26]];

export const buildCovidFolk = (kind: CovidKind, variant: number, q0: CovidPose, o: BuildOpts = {}): CovidBuild => {
  const L = lookOf(kind, variant);
  const sickA = c01(o.sick ?? 0);
  const inf = c01(o.infected ?? 0);
  const ink0: CovidInks = { ...L.inks, ...(o.inks ?? {}) };
  const dr = c01(o.drain ?? 0);
  const ink: CovidInks = dr <= 0 ? ink0 : (Object.fromEntries(Object.entries(ink0).map(([kk, v]) => [kk, v === "none" ? v : mixC(v, kk === "skin" ? "#B8A890" : DEAD_C, kk === "skin" ? 0.45 * dr : 0.85 * dr)])) as CovidInks);
  const hunch = c01(Math.max(q0.hunch ?? 0, 0.35 * sickA));
  const { q, r } = covidRig(kind, variant, q0);
  const sp = specFor(L, q0);
  const k = sp.limb;
  const hw = sp.hw;
  const A = sp.a;
  const shY = r.shY;
  const G = r.s >= 0 ? 1 : -1;
  const toFig = r.toFig;
  const frame = o.frame ?? 0;
  const carry: Carry = o.carry ?? L.carry;
  const hold = { L: o.hold?.L ?? L.hold.L, R: o.hold?.R ?? L.hold.R };
  const worry = c01(Math.max(q0.worry ?? 0, 0.85 * sickA));
  const lids = c01(Math.max(q.lids, 0.55 * sst(0.1, 0.9, sickA)));
  const open = c01(q0.open ?? 0);
  const look: P2 = q0.look ?? [0, 0];
  const laugh = c01(q0.laugh ?? 0);
  const lArc = sst(0.25, 0.6, laugh);

  // ---- colours ------------------------------------------------------------------------------------------------------
  const skin = mixC(ink.skin, SICK_SKIN, 0.55 * sickA);
  const skinSh = mixC(skin, "#8A5A44", 0.22);
  const blush = mixC("#D98A80", FLUSH, sickA);
  const eyeC = "#2A201A";
  const top = ink.top;
  const shadeOf = (c: string, t = 0.12) => mixC(c, SHADE_TO, t);

  // ---- the torso lathe -------------------------------------------------------------------------------------------
  const rows = torsoRows(L, shY, hunch);
  const B = makeBody(rows, q.yaw);
  const tor = (p: P2, out = 0) => toFig(B.on(p, out).p);
  const torD = (p: P2, out = 0) => B.on(p, out).d;
  const torsoOutline = (yTop: number, yBot: number, out = 0): P2[] => {
    const n = 14;
    const right: P2[] = [];
    const left: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const y = mix(yTop, yBot, i / n);
      const [l, rr] = B.edge(y);
      right.push(toFig([rr + out, y]));
      left.push(toFig([l - out, y]));
    }
    return [...right, ...left.reverse()];
  };
  /** a front-view polygon carried onto the body; its mean depth (to fade front details on a back view) */
  const regionOn = (pts: P2[], out = 0.6, sub0 = 4): { pts: P2[]; d: number } => {
    const dense: P2[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const m = Math.max(1, Math.ceil(vlen(sub(b, a)) / sub0));
      for (let j = 0; j < m; j++) dense.push(mix2(a, b, j / m));
    }
    let dd = 0;
    const outp = dense.map((p) => {
      const v = B.on(p, out);
      dd += v.d;
      return toFig(v.p);
    });
    return { pts: outp, d: dd / dense.length };
  };
  const frontW = (d: number) => sst(-0.05, 0.3, d);
  const bandOn = (x0: number, x1: number, yA: (x: number) => number, yB: (x: number) => number, out = 0.6, n = 14): P2[] => {
    const tp: P2[] = [];
    const bt: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const x = mix(x0, x1, i / n);
      tp.push(tor([x, yA(x)], out));
      bt.push(tor([x, yB(x)], out));
    }
    return [...tp, ...bt.reverse()];
  };
  const lineOn = (pts: P2[], out = 1, n = 6): P2[] => {
    const res: P2[] = [];
    for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < n; j++) res.push(tor(mix2(pts[i], pts[i + 1], j / n), out));
    res.push(tor(pts[pts.length - 1], out));
    return res;
  };

  // ---- the head --------------------------------------------------------------------------------------------------
  const head = headOf(L, r, q, hunch);
  const HR = head.R;
  const fs = HR / 31.5;

  // ---- garment facts ---------------------------------------------------------------------------------------------
  const puff = L.top === "puffer" ? 3.2 : L.top === "parka" ? 2.2 : L.top === "coat" ? 1.4 : L.top === "hoodie" ? 1.6 : L.top === "coverall" ? 2.6 : 1.0;
  const sleeveK = L.top === "puffer" ? 1.24 : L.top === "parka" ? 1.17 : L.top === "hoodie" ? 1.14 : L.top === "coverall" ? 1.2 : 1.08;
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * 20;

  // ---- the arms ----------------------------------------------------------------------------------------------------
  const elbowOf = (ar: ArmRig): P2 => {
    const hint = (ar.sgn < 0 ? q.armL.elbow : q.armR.elbow) as P2;
    const d = sub(ar.W, ar.S);
    const Ld = vlen(d);
    const L1 = sp.arm[0];
    const L2 = sp.arm[1];
    if (Ld < 1) return ar.E;
    const u = mul(d, 1 / Ld);
    const a = (L1 * L1 - L2 * L2 + Ld * Ld) / (2 * Ld);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const n: P2 = [-u[1], u[0]];
    const v = Math.max(-1, Math.min(1, (n[0] * hint[0] + n[1] * hint[1]) / 0.55));
    const b = Math.sign(v) * (1 - (1 - Math.abs(v)) ** 2);
    return add(ar.S, add(mul(u, a), mul(n, h * b)));
  };
  /** the drawn arm: the soft elbow, and the hand's direction from THAT elbow (the rig's own elbow can flip sides) */
  const drawnArm = (ar0: ArmRig): ArmRig => {
    const E = elbowOf(ar0);
    const fw = sub(ar0.W, E);
    const hand = ar0.sgn < 0 ? q.armL.hand : q.armR.hand;
    const dir = vlen(fw) > 2 ? rot(norm(fw), hand) : ar0.dir;
    return { ...ar0, E, dir };
  };
  const mittenGeom = (ar: ArmRig) => {
    const d = ar.dir;
    const n: P2 = [-d[1], d[0]];
    const hint = ar.sgn < 0 ? q.armL.elbow : q.armR.elbow;
    const cS = sub(ar.W, ar.S);
    const crs = (-cS[1] * hint[0] + cS[0] * hint[1]) / ((vlen(cS) || 1) * (vlen(hint) || 1));
    const ts = -Math.max(-1, Math.min(1, crs * 5));
    const fist = c01(ar.fist);
    const len = mix(21, 18, fist) * k;
    const wid = mix(16.5, 17.5, fist) * k;
    const c = add(ar.W, mul(d, len * 0.5 + 1.5 * k));
    return { d, n, ts, fist, len, wid, c, ang: (Math.atan2(d[1], d[0]) * 180) / Math.PI };
  };
  const handC = ink.glove !== "none" ? ink.glove : skin;
  const mitten = (ar: ArmRig): CShape[] => {
    const m = mittenGeom(ar);
    const out: CShape[] = [];
    const tb = add(add(ar.W, mul(m.d, 6 * k)), mul(m.n, m.ts * 7 * k));
    out.push({ d: ellD(add(tb, mul(rot(m.d, -m.ts * mix(28, 70, m.fist)), 4 * k)), 5.4 * k, 4.2 * k, m.ang - m.ts * mix(28, 70, m.fist)), fill: handC, sh: 0.5 });
    out.push({ d: ellD(m.c, m.len * 0.56, m.wid * 0.5, m.ang), fill: handC });
    return out;
  };
  const handProp = (ar: ArmRig, prop: HandProp): { back: CShape[]; front: CShape[] } => {
    if (prop === "none") return { back: [], front: [] };
    const m = mittenGeom(ar);
    if (prop === "phone") {
      // a dark slab held in the fist, upright-ish along the hand, the screen side toward the face
      const c = add(m.c, mul(m.n, -m.ts * 3 * k));
      const ang = m.ang + 90 * 0.0;
      const pts: P2[] = [[-5.5, -9], [5.5, -9], [5.5, 9], [-5.5, 9]].map(([x, y]) => add(c, rot([x * k + 0, y * k - 6 * k], ang - 90)));
      return { back: [], front: [{ d: closedD(pts, 0.28), fill: "#383D42", sh: 0.6 }, { d: closedD(scaleAbout(pts, centroid(pts), 0.78), 0.28), fill: "#5A6670", sh: 0, op: 0.55 }] };
    }
    if (prop === "cup") {
      // a paper coffee cup, always upright, in the fist
      const c = add(m.c, [0, -7 * k]);
      const T = (x: number, y: number): P2 => add(c, [x * k, y * k]);
      return {
        back: [],
        front: [
          { d: closedD([T(-7.5, -12), T(7.5, -12), T(6, 11), T(-6, 11)], 0.25), fill: "#EAE2CF" },
          { d: closedD([T(-7.2, -4), T(7.2, -4), T(6.6, 5), T(-6.6, 5)], 0.25), fill: "#8A6E52", sh: 0 },
          { d: closedD([T(-8.6, -15), T(8.6, -15), T(8.4, -11.5), T(-8.4, -11.5)], 0.3), fill: "#D3C9B5", sh: 0.4 },
        ],
      };
    }
    // a handbag hanging from the fist: handle loop and a soft trapezoid body (always hanging straight down)
    const g = add(m.c, [0, 2 * k]);
    const T = (x: number, y: number): P2 => add(g, [x * k, y * k]);
    return {
      back: [{ d: tubeD([T(-9, 16), T(-8, 2), T(0, -4), T(8, 2), T(9, 16)], [3, 3, 3, 3, 3].map((w) => w * k)), fill: ink.strap, sh: 0 }],
      front: [{ d: closedD([T(-17, 14), T(17, 14), T(21, 44), T(-21, 44)], 0.45), fill: ink.bag }, { d: lineD([T(-15, 21), T(15, 21)]), fill: ink.strap, det: 1.6, op: 0.5 }],
    };
  };
  const armShapes = (ar0: ArmRig): CShape[] => {
    const ar: ArmRig = drawnArm(ar0);
    const out: CShape[] = [];
    const prop = ar0.sgn < 0 ? hold.L : hold.R;
    const hp = handProp(ar, prop);
    out.push(...hp.back);
    const uu = norm(sub(ar.E, ar.S));
    const sh0 = add(ar.S, mul(uu, 8));
    // the sleeve: the whole arm in the top's cloth (a tapered tube, fuller for padded jackets), rooted inside the
    // shoulder below its line (one sloping silhouette with the body, never a shoulder pad), a cuff at the wrist
    const base = [23, 25, 22, 22, 19, 16.5];
    const sl = base.map((w, i) => w * k * (i < 2 ? mix(1, sleeveK, 0.85) : sleeveK));
    const pts = [sh0, mix2(ar.S, ar.E, 0.5), ar.E, mix2(ar.E, ar.W, 0.3), mix2(ar.E, ar.W, 0.72), ar.W];
    out.push({ d: tubeD(pts, sl), fill: top });
    if (L.top === "puffer") {
      // the quilting: soft bands across the sleeve
      const segs = [0.3, 0.62].map((t) => mix2(ar.S, ar.E, t)).concat([0.4, 0.78].map((t) => mix2(ar.E, ar.W, t)));
      out.push({ d: segs.map((c, i) => { const dirA = i < 2 ? uu : norm(sub(ar.W, ar.E)); const nn: P2 = [-dirA[1], dirA[0]]; const w = (i < 2 ? 12 : 10.5) * k * sleeveK; return qD(add(c, mul(nn, -w)), add(c, mul(dirA, 2.5 * k)), add(c, mul(nn, w))); }).join(" "), fill: shadeOf(top, 0.25), det: 1.5, keep: true, op: 0.55 });
    }
    // the cuff
    const cu = norm(sub(ar.W, ar.E));
    const cuffC = add(ar.W, mul(cu, -3.5 * k));
    out.push({ d: tubeD([add(cuffC, mul(cu, -4 * k)), add(cuffC, mul(cu, 3 * k))], [17.8 * k * sleeveK, 17.2 * k * sleeveK]), fill: L.top === "suit" || L.top === "coat" ? top : ink.top2, sh: 0.4 });
    if (L.top === "suit" || L.top === "cardigan") out.push({ d: tubeD([add(ar.W, mul(cu, -1 * k)), add(ar.W, mul(cu, 2.2 * k))], [15.5 * k, 15 * k]), fill: ink.shirt, sh: 0 });
    out.push(...mitten(ar));
    out.push(...hp.front);
    return out;
  };

  // ---- the legs and feet ---------------------------------------------------------------------------------------------
  const absS = Math.abs(r.s);
  const footPts = (shoe: ShoeKind): P2[] => {
    const front: P2[] = [[-9.5, -11], [0, -13.5], [9.5, -11], [13, -4], [10.5, 1.5], [0, 2.5], [-10.5, 1.5], [-13, -4]];
    const side: P2[] = shoe === "dress" ? [[-9, -12], [3, -13], [15, -9], [27, -3], [28, 1], [13, 2.5], [-8, 2.5], [-12, -4]] : [[-10, -12], [2, -13.5], [15, -9.5], [25, -5], [27, 0.5], [13, 2.5], [-8, 2.5], [-12, -4]];
    const t = sst(0, 0.55, absS);
    return front.map((p, i) => mix2(p, side[i], t));
  };
  const trouW = [33, 30, 25, 25, 21, 19.5];
  const legShapes = (l: LegRig): CShape[] => {
    const out: CShape[] = [];
    const dark = 0.14 * sst(0.05, 0.45, -l.z);
    const ank = l.A;
    const fp = footPts(L.shoe).map((p): P2 => add(ank, rot([p[0] * G * k, (p[1] + 13) * k], G * l.lift)));
    const shoeC = mixC(ink.shoe, SHADE_TO, dark);
    const legPts = [add(l.H, [0, -6]), mix2(l.H, l.K, 0.5), l.K, mix2(l.K, ank, 0.32), mix2(l.K, ank, 0.72), ank];
    const shoeShapes: CShape[] = [];
    if (L.shoe === "sneaker") {
      shoeShapes.push({ d: closedD(fp.map((p) => add(p, rot([0, 2.6 * k], G * l.lift))), 0.9), fill: mixC(ink.sole, SHADE_TO, dark), sh: 0 });
      shoeShapes.push({ d: closedD(fp.map((p) => add(p, rot([0, -0.6 * k], G * l.lift))), 0.9), fill: shoeC });
    } else shoeShapes.push({ d: closedD(fp, 0.9), fill: shoeC });
    if (L.lower === "skirt") {
      // tights under a skirt
      out.push({ d: tubeD(legPts, [31, 28, 22, 23, 18, 15].map((w) => w * k)), fill: mixC(ink.tights, SHADE_TO, dark) });
      out.push(...shoeShapes);
    } else {
      out.push(...shoeShapes);
      out.push({ d: tubeD(legPts, trouW.map((w) => w * k)), fill: mixC(ink.lower, SHADE_TO, dark) });
      // a soft crease down the trouser front
      out.push({ d: lineD([mix2(l.H, l.K, 0.35), l.K, mix2(l.K, ank, 0.8)]), fill: mixC(ink.lower, SHADE_TO, dark + 0.1), det: 1.4, op: 0.35 });
    }
    if (L.shoe === "boot") {
      const u = norm(sub(ank, l.K));
      out.push({ d: tubeD([add(ank, mul(u, -15 * k)), add(ank, mul(u, 3 * k))], [21 * k, 22 * k]), fill: shoeC, sh: 0.6 });
    }
    return out;
  };
  const legsSorted = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);

  // ---- the seat of the trousers (the pelvis between the legs) ---------------------------------------------------------
  const seatShapes: CShape[] = [];
  if (!(L.lower === "skirt")) {
    const pts: P2[] = [r.toFig([B.edge(-6)[0] + 2, -6]), r.toFig([B.edge(-6)[1] - 2, -6])];
    for (const l of [r.legL, r.legR]) for (const fr of [0, 0.12, 0.25, 0.36]) pts.push(...circ(legPtOf(l, fr), (trouW[0] / 2) * k * mix(1, 0.92, fr / 0.36), 12));
    seatShapes.push({ d: closedD(resampleClosed(hull(pts), 80, pts[0], 2), 0.8), fill: ink.lower });
  }

  // ---- the lower garment hanging from the waist (skirt) and the top's skirt (jacket / coat below the hips) ----------
  const hangShapes: CShape[] = [];
  let hemPts: P2[] = [];
  if (L.lower === "skirt") {
    const sk = hangHull(r, B, k, -14, 1.2, 9, hdx);
    hangShapes.push({ d: closedD(sk, 0.8), fill: ink.lower });
    hemPts = sk;
  }
  const topHull = hangHull(r, B, k, -16, L.topLen, L.top === "coat" ? 5 : L.top === "suit" ? 1 : 0, hdx, puff, L.top === "coat" ? 0.9 : 0.8);
  const topHullD = closedD(topHull, 0.8);
  if (L.topLen > 0.3 || !hemPts.length) hemPts = topHull;
  if (L.top !== "coverall") hangShapes.push({ d: topHullD, fill: top });
  // the top's front edge (coat, suit, parka, cardigan: an opening; puffer: the zip) down the hanging part
  const frontEdge = (x: number) => {
    const a = tor([x, -16], puff + 0.4);
    const legMid = mix2(legPtOf(r.legL, L.topLen), legPtOf(r.legR, L.topLen), 0.5);
    const b = add(legMid, [hdx * 0.4 + x * 0.6 * B.cY, 4]);
    return { a, b, w: frontW(torD([x, -16], puff)) };
  };
  if (L.top !== "hoodie") {
    const fe = frontEdge(L.top === "suit" ? 0 : -1);
    if (fe.w > 0.02 && L.topLen > 0.12) hangShapes.push({ d: lineD([fe.a, mix2(fe.a, fe.b, 0.5), fe.b]), fill: shadeOf(top, 0.2), det: 1.5, keep: true, op: 0.6 * fe.w, clip: topHullD });
  }
  // folds down the long coat
  if (L.top === "coat") {
    const skX0 = Math.min(...topHull.map((p) => p[0]));
    const skX1 = Math.max(...topHull.map((p) => p[0]));
    const skY0 = Math.min(...topHull.map((p) => p[1]));
    const skY1 = Math.max(...topHull.map((p) => p[1]));
    for (let i = 0; i < 2; i++) {
      const t = (i + 0.7) / 2.4;
      const tp: P2 = [mix(skX0 + 10, skX1 - 10, mix(0.3, 0.75, t)), skY0 + 28];
      const bt: P2 = [mix(skX0 + 6, skX1 - 6, t) + hdx * 0.3, skY1 - 2];
      hangShapes.push({ d: tubeD([tp, mix2(tp, bt, 0.5), bt], [2.5, 6, 9]), fill: top, cast: true, op: 0.36, clip: topHullD });
    }
  }

  // ---- the torso and what is worn on it -----------------------------------------------------------------------------
  const TORSO = torsoOutline(shY - 9 - 6 * hunch, 8, puff);
  const torsoD = closedD(TORSO, 0.9);
  const torsoShapes: CShape[] = [];
  torsoShapes.push({ d: torsoD, fill: top });
  const reg = (pts: P2[], fill: string, out = 1, extra: Partial<CShape> = {}, tension = 0.6) => {
    const R = regionOn(pts, out + puff);
    const w = frontW(R.d);
    if (w > 0.01) torsoShapes.push({ d: closedD(R.pts, tension), fill, ...extra, op: (extra.op ?? 1) * w });
  };
  const det = (pts: P2[], fill: string, width: number, op: number, out = 1.2) => {
    const R = lineOn(pts, out + puff);
    const dd = pts.reduce((s, p) => s + torD(p, out + puff), 0) / pts.length;
    const w = frontW(dd);
    if (w > 0.01) torsoShapes.push({ d: lineD(R), fill, det: width, keep: true, op: op * w, clip: torsoD });
  };
  const hu = 6 * hunch;
  const neckTop = shY - 8 - hu;
  // the V of the shirt (suit, cardigan, coat over a shirt)
  if (L.top === "suit" || L.top === "cardigan" || (L.top === "coat" && !L.female)) {
    const vb = L.top === "suit" ? shY + 44 : L.top === "cardigan" ? shY + 50 : shY + 30;
    const vw = L.top === "coat" ? 15 : 14;
    reg([[-vw, neckTop], [vw, neckTop], [3, vb], [0, vb + 3], [-3, vb]], ink.shirt, 0.8, { sh: 0.3 });
    if (L.tie) {
      reg([[-3.4, shY - 1 - hu], [3.4, shY - 1 - hu], [2.6, shY + 5 - hu * 0.5], [-2.6, shY + 5 - hu * 0.5]], shadeOf(ink.tie, 0.1), 1.1, { sh: 0 });
      reg([[-2.6, shY + 5], [2.6, shY + 5], [4.6, shY + 38], [0, shY + 45], [-4.6, shY + 38]], ink.tie, 1.1, { sh: 0.5 }, 0.4);
    }
    // the shirt collar points
    reg([[-9, neckTop + 1], [-1, shY - 1 - hu], [-8, shY + 7 - hu * 0.5], [-13, shY + 1 - hu]], ink.shirt, 1.4, { sh: 0.6 }, 0.4);
    reg([[9, neckTop + 1], [1, shY - 1 - hu], [8, shY + 7 - hu * 0.5], [13, shY + 1 - hu]], ink.shirt, 1.4, { sh: 0.6 }, 0.4);
    // the lapels (suit, coat) / the cardigan's open edges
    const lap = L.top === "cardigan" ? 5 : L.top === "coat" ? 13 : 10;
    for (const sgn of [-1, 1]) {
      reg(
        [
          [sgn * (vw + 1), neckTop - 1],
          [sgn * (vw + lap), shY - 2 - hu],
          [sgn * (vw + lap - 2), shY + 16],
          [sgn * 5, vb - 2],
          [sgn * 3, vb + 1],
        ],
        L.top === "cardigan" ? top : ink.top2,
        1.6,
        { sh: 0.7 },
        0.4,
      );
    }
    // buttons
    const bts = L.top === "suit" ? [-24] : L.top === "cardigan" ? [vb + 6, -32, -18] : [shY + 46, -36];
    for (const by of bts) reg(ellPts([L.top === "cardigan" ? 5 : 1.5, by], 2.3, 2.3, 0, 8), shadeOf(top, 0.35), 1.6, { sh: 0 }, 0.9);
    if (L.top === "suit") det([[0, vb], [0, -16]], shadeOf(top, 0.25), 1.4, 0.55);
    if (L.top === "cardigan") det([[3, vb], [3, -16]], shadeOf(top, 0.25), 1.4, 0.5);
    if (L.top === "coat") det([[-1, vb], [-1, -16]], shadeOf(top, 0.25), 1.4, 0.55);
    if (L.top === "suit" || L.top === "cardigan") {
      // hip pockets
      for (const sgn of [-1, 1]) det([[sgn * A * 0.32, -30], [sgn * A * 0.78, -31]], shadeOf(top, 0.28), 1.4, 0.5);
      if (L.top === "suit") det([[-A * 0.72, shY + 30], [-A * 0.34, shY + 29]], shadeOf(top, 0.28), 1.3, 0.45);
    }
  } else if (L.top === "hoodie") {
    // the neck opening, the kangaroo pocket, the drawstrings, the rib band
    reg([[-11, neckTop + 2], [11, neckTop + 2], [8, shY + 5], [0, shY + 8], [-8, shY + 5]], skin, 0.6, { sh: 0 });
    reg([[-A * 0.52, -52], [A * 0.52, -52], [A * 0.66, -14], [-A * 0.66, -14]], ink.top2, 1.4, { sh: 0.5 }, 0.5);
    for (const sgn of [-1, 1]) det([[sgn * 7, shY - 1], [sgn * 8, shY + 18], [sgn * 9.5, shY + 32]], "#E2DACA", 1.7, 0.85, 1.8);
  } else {
    // puffer / parka / woman's coat: the stand collar round the neck, the zip
    reg([[-17, neckTop - 3], [17, neckTop - 3], [18, shY + 5 - hu * 0.5], [0, shY + 8], [-18, shY + 5 - hu * 0.5]], ink.top2, 1.8, { sh: 0.5 }, 0.5);
    det([[-1, shY + 6], [-1, -16]], shadeOf(top, 0.3), 1.5, 0.6);
    if (L.top === "puffer") {
      // the quilting bands across the body
      for (const y of [shY + 24, shY + 50, -30]) {
        const R = bandOn(-A * 1.05, A * 1.05, (x) => y - 1.5 + 0.0 * x, (x) => y + 1.5 + 0.0 * x, 1.3 + puff);
        const w = frontW(torD([0, y], puff));
        if (w > 0.01) torsoShapes.push({ d: closedD(R, 0.6), fill: shadeOf(top, 0.18), sh: 0, op: 0.55 * w, clip: torsoD });
      }
    } else if (L.top !== "coverall") {
      // two flap pockets at the waist
      for (const sgn of [-1, 1]) reg([[sgn * A * 0.3, -22], [sgn * A * 0.74, -22], [sgn * A * 0.74, -14], [sgn * A * 0.3, -14]], ink.top2, 1.6, { sh: 0.4 }, 0.3);
    } else {
      // the coverall's soft folds at the waist (a loose suit)
      for (const sgn of [-1, 1]) det([[sgn * A * 0.2, -26], [sgn * A * 0.55, -18], [sgn * A * 0.85, -22]], shadeOf(top, 0.22), 1.4, 0.5);
    }
  }
  // the scarf: a band round the neck and one end down the front
  if (L.scarf) {
    reg([[-24, neckTop - 5], [24, neckTop - 5], [27, shY + 10], [0, shY + 17], [-27, shY + 10]], ink.scarf, 3.2, { sh: 0.6 }, 0.55);
    reg([[3, shY + 8], [19, shY + 6], [21, shY + 46], [5, shY + 48]], ink.scarf, 3.6, { sh: 0.7, litFrom: true }, 0.45);
    det([[5, shY + 43], [20, shY + 41]], shadeOf(ink.scarf, 0.25), 1.4, 0.5, 3.8);
  }
  // the carried things' straps on the front
  if (carry === "backpack") {
    // over the shoulders and down the sides of the chest toward the armpits (they frame the lungs, never split them)
    for (const sgn of [-1, 1]) reg([[sgn * hw * 0.5, shY - 6 - hu], [sgn * hw * 0.68, shY - 4 - hu], [sgn * hw * 0.98, shY + 44], [sgn * hw * 0.84, shY + 47]], ink.strap, 2.4, { sh: 0.5, litFrom: true }, 0.4);
  } else if (carry === "shoulderBag") {
    reg([[hw * 0.42, shY - 7 - hu], [hw * 0.62, shY - 5 - hu], [-A * 0.82, -14], [-A * 0.94, -22]], ink.strap, 2.4, { sh: 0.4, litFrom: true }, 0.3);
  }

  // ---- THE INFECTION: two lung-shaped orange glows behind the clothes, specks drifting inside -------------------------
  const glowShapes: CShape[] = [];
  const gStyle = o.glowStyle ?? "v3";
  const v1 = gStyle === "v1";
  const v3 = gStyle === "v3";
  const lungs = (v1 ? [LUNG_R, LUNG_L] : v3 ? [LUNG3_R, LUNG3_L] : [LOBE_R, LOBE_L]).map((lp) => {
    const front = lp.map(([x, y]): P2 => [x * hw, shY + y]);
    const R = regionOn(front, puff + 0.5, 3);
    // how much of the lung faces us (projected area / its front-view area): a lung turned edge-on fades out (v2 keeps
    // the far lobe longer, as a narrower lobe toward the far side of the chest, so two lobes read up to near profile)
    const ratio = Math.abs(area(R.pts)) / Math.max(1, Math.abs(area(front)));
    const vis = v1 ? sst(-0.2, 0.2, R.d) * sst(0.18, 0.55, ratio) : sst(-0.45, -0.05, R.d) * sst(0.05, 0.28, ratio);
    return { pts: R.pts, d: R.d, c: centroid(R.pts), vis, ratio };
  });
  if (inf > 0.002 && v3) {
    // v3: LIGHT, not paint. Per lobe: a soft halo bleeding into the cloth, the lobe as a bright core falling off to a
    // nearly transparent edge, a screen-blended "light through" layer (it lifts straps and lapels toward the glow),
    // everything worn over the chest relit from behind with the same falloff; the windpipe and bronchi as a faint Y.
    for (const lg of lungs) {
      const a = inf * lg.vis;
      if (a < 0.01) continue;
      const pts = lg.pts;
      glowShapes.push({ d: closedD(scaleAbout(pts, lg.c, 1.2), 0.9), fill: ACC, glow: true, blur: 6, op: a, clip: torsoD, sh: 0, grad: { stops: [[0, ACC, 0.4], [0.6, ACC, 0.17], [1, ACC, 0]], cy: 0.45 } });
      glowShapes.push({ d: closedD(pts, 0.9), fill: ACC, glow: true, blur: 1.8, op: a, clip: torsoD, sh: 0, grad: { stops: [[0, ACC_SPECK, 0.95], [0.3, ACC_HOT, 0.84], [0.62, ACC, 0.56], [0.86, ACC, 0.24], [1, ACC, 0.06]], cy: 0.47, r: 0.6 } });
      glowShapes.push({ d: closedD(scaleAbout(pts, lg.c, 0.9), 0.9), fill: ACC, glow: true, blur: 3, op: a, clip: torsoD, sh: 0, blend: "screen", grad: { stops: [[0, ACC, 0.55], [0.65, ACC, 0.2], [1, ACC, 0]], cy: 0.42 } });
    }
    const details = torsoShapes.slice(1).filter((d) => d.litFrom);
    for (const lg of lungs) {
      const a = inf * lg.vis;
      if (a < 0.01) continue;
      for (const [sc, k2] of [
        [0.98, 0.28],
        [0.7, 0.42],
      ] as [number, number][]) {
        const clipD = closedD(scaleAbout(lg.pts, lg.c, sc), 0.9);
        for (const dsh of details) {
          if ((dsh.op ?? 1) < 0.05) continue;
          glowShapes.push({ ...dsh, fill: mixC(ACC, dsh.fill, 0.32), op: (dsh.op ?? 1) * a * k2, clip: clipD, sh: 0, keep: dsh.det !== undefined ? true : dsh.keep });
        }
      }
    }
    // the windpipe rising from between the lobes into the neck under the chin, splitting into the two bronchi that run
    // into the tops of the lobes: a thin luminous Y, softer than the lobes (the head covers its top end)
    const Y: P2[][] = [
      [[0, shY - 16], [0, shY - 6], [0, shY + 4]],
      [[0, shY + 2], [0, shY + 10], [0, shY + 16]],
      [[0, shY + 15], [-0.13 * hw, shY + 20], [-0.27 * hw, shY + 26]],
      [[0, shY + 15], [0.15 * hw, shY + 21], [0.31 * hw, shY + 28]],
    ];
    const W: number[][] = [
      [3.6, 4.2, 4.8],
      [4.8, 5, 4.6],
      [4, 3.4, 2.6],
      [4, 3.4, 2.6],
    ];
    const yd = [0, shY + 8].reduce((m, yy) => m + torD([0, yy], puff), 0) / 2;
    const yv = inf * sst(-0.05, 0.3, yd);
    if (yv > 0.01)
      Y.forEach((seg, j) => {
        const pts = seg.map((p) => tor(p, puff + 0.8));
        const base = j === 0 ? 0.24 : 0.4;
        glowShapes.push({ d: tubeD(pts, W[j].map((w) => w * 1.8)), fill: ACC, glow: true, blur: 3, op: base * 0.55 * yv, sh: 0 });
        glowShapes.push({ d: tubeD(pts, W[j]), fill: ACC, glow: true, blur: 1.2, op: base * yv, sh: 0 });
        glowShapes.push({ d: tubeD(pts, W[j].map((w) => w * 0.4)), fill: ACC_HOT, glow: true, blur: 0.6, op: base * 0.9 * yv, sh: 0 });
      });
  }
  if (inf > 0.002 && !v1 && !v3) {
    // v2: a light from INSIDE the chest. Per lobe: a soft halo, the lobe's body, a screen-blended "light through" layer
    // that lifts everything drawn over the chest (straps, lapels, the bag strap) toward the glow so they cannot cut it
    // into bands, a warm core; the gap at the sternum stays darker.
    for (const lg of lungs) {
      const vis = lg.vis;
      if (vis < 0.01) continue;
      const a = inf * vis;
      const pts = lg.pts;
      glowShapes.push({ d: closedD(scaleAbout(pts, lg.c, 1.04), 0.9), fill: ACC, glow: true, blur: 5, op: 0.26 * a, clip: torsoD, sh: 0 });
      glowShapes.push({ d: closedD(pts, 0.9), fill: ACC, glow: true, blur: 2.6, op: 0.6 * a, clip: torsoD, sh: 0 });
      glowShapes.push({ d: closedD(scaleAbout(pts, lg.c, 0.92), 0.9), fill: ACC, glow: true, blur: 3.2, op: 0.55 * a, clip: torsoD, sh: 0, blend: "screen" });
      glowShapes.push({ d: closedD(scaleAbout(pts, add(lg.c, [0, -2]), 0.52), 0.9), fill: ACC_HOT, glow: true, blur: 3.2, op: 0.4 * a, clip: torsoD, sh: 0 });
    }
    // everything worn over the chest (straps, quilting, lapels, the zip, a scarf) is lit from behind inside each lobe:
    // copies tinted toward the glow, clipped to the lobe in two soft steps, so nothing cuts the light into bands
    const details = torsoShapes.slice(1);
    for (const lg of lungs) {
      const a = inf * lg.vis;
      if (a < 0.01) continue;
      for (const [sc, k2] of [
        [1.04, 0.5],
        [0.8, 0.6],
      ] as [number, number][]) {
        const clipD = closedD(scaleAbout(lg.pts, lg.c, sc), 0.9);
        for (const dsh of details) {
          if ((dsh.op ?? 1) < 0.05) continue;
          glowShapes.push({ ...dsh, fill: mixC(ACC, dsh.fill, 0.3), op: (dsh.op ?? 1) * a * k2, clip: clipD, sh: 0, keep: dsh.det !== undefined ? true : dsh.keep });
        }
      }
    }
  }
  if (inf > 0.002 && v1) {
    for (const lg of lungs) {
      const vis = lg.vis;
      if (vis < 0.01) continue;
      const a = inf * vis;
      const pts = scaleAbout(lg.pts, lg.c, 0.94);
      glowShapes.push({ d: closedD(scaleAbout(pts, lg.c, 1.15), 0.9), fill: ACC, glow: true, blur: 7, op: 0.34 * a, clip: torsoD, sh: 0 });
      glowShapes.push({ d: closedD(pts, 0.9), fill: ACC, glow: true, blur: 3.4, op: 0.55 * a, clip: torsoD, sh: 0 });
      glowShapes.push({ d: closedD(scaleAbout(pts, lg.c, 0.55), 0.9), fill: ACC_HOT, glow: true, blur: 3, op: 0.38 * a, clip: torsoD, sh: 0 });
    }
  }
  if (inf > 0.002) {
    // the specks: a few tiny brighter points drifting slowly inside each lung (a pure function of the frame)
    lungs.forEach((lg, li) => {
      const vis = lg.vis;
      if (vis < 0.01) return;
      for (let i = 0; i < 5; i++) {
        const hs = li * 31 + i * 7.3;
        const pa = lg.pts[Math.floor(hash(hs, 3) * lg.pts.length)];
        const pb = lg.pts[Math.floor(hash(hs, 5) * lg.pts.length)];
        const base = mix2(lg.c, mix2(pa, pb, 0.5), 0.15 + 0.55 * hash(hs, 7));
        const t = frame / 30;
        const p = add(base, [3.2 * Math.sin(t * (0.5 + 0.4 * hash(hs, 9)) + hash(hs, 11) * 6.28), 3.2 * Math.cos(t * (0.4 + 0.4 * hash(hs, 13)) + hash(hs, 15) * 6.28) - 1.2 * Math.sin(t * 0.3 + i)]);
        const rr = (1.3 + 0.9 * hash(hs, 17)) * mix(1, 0.7, Math.abs(r.s));
        glowShapes.push({ d: ellD(p, rr, rr), fill: ACC_SPECK, glow: true, blur: 0.5, op: 0.95 * inf * vis * (0.55 + 0.45 * Math.sin(frame * 0.07 + hs)), clip: torsoD, sh: 0 });
      }
    });
  }

  // ---- the backpack (a box on the back: behind him facing us, over his back facing away) ----------------------------
  const packBack: CShape[] = [];
  const packFront: CShape[] = [];
  if (carry === "backpack") {
    const y0 = shY + 4;
    const y1 = -22;
    const rb = B.row(mix(y0, y1, 0.5));
    const zb = -(rb.b + puff + 1);
    const zf = zb - 30;
    const xw = hw * 0.66;
    const corners: { p: P2; d: number }[] = [];
    for (const x of [-xw, xw]) for (const y of [y0, y1]) for (const z of [zb, zf]) corners.push(B.pt3(x, y, z));
    const pts = hull(corners.map((c) => toFig(c.p)));
    const back = B.cY < 0;
    const d = closedD(pts, 0.55);
    const bagC = ink.bag;
    const shapes: CShape[] = [{ d, fill: bagC }];
    // the visible side face, a little darker (the one turned away from the light)
    const sideX = B.s >= 0 ? -xw : xw;
    const sidePts = [B.pt3(sideX, y0 + 3, zb), B.pt3(sideX, y0 + 3, zf), B.pt3(sideX, y1 - 2, zf), B.pt3(sideX, y1 - 2, zb)].map((c) => toFig(c.p));
    if (Math.abs(B.s) > 0.05) shapes.push({ d: closedD(sidePts, 0.4), fill: shadeOf(bagC, 0.14), sh: 0, op: sst(0.05, 0.4, Math.abs(B.s)), clip: d });
    // the flap (on the back face when we see it)
    if (back) {
      const fl = [B.pt3(-xw * 0.85, y0 + 2, zf), B.pt3(xw * 0.85, y0 + 2, zf), B.pt3(xw * 0.8, y0 + 26, zf), B.pt3(-xw * 0.8, y0 + 26, zf)].map((c) => toFig(c.p));
      shapes.push({ d: closedD(fl, 0.5), fill: shadeOf(bagC, 0.08), sh: 0.6, op: sst(0, 0.4, -B.cY) });
    }
    // the top handle loop
    const hA = toFig(B.pt3(-8, y0, (zb + zf) / 2).p);
    const hB = toFig(B.pt3(8, y0, (zb + zf) / 2).p);
    shapes.unshift({ d: tubeD([hA, add(mix2(hA, hB, 0.5), [0, -9]), hB], [3, 3, 3]), fill: ink.strap, sh: 0 });
    (back ? packFront : packBack).push(...shapes);
  }
  // the shoulder bag at his right hip (screen left facing us): behind or in front of the body by its depth
  const bagBack: CShape[] = [];
  const bagFront: CShape[] = [];
  if (carry === "shoulderBag") {
    const xb = -(A + 6 + puff);
    const c3 = B.pt3(xb, -12, 4);
    const c = toFig(c3.p);
    const w = mix(9, 22, Math.abs(B.s)) * 0.5 + 6;
    const pts: P2[] = [add(c, [-w, -15]), add(c, [w, -15]), add(c, [w + 1, 15]), add(c, [-w - 1, 15])];
    const sh: CShape[] = [{ d: closedD(pts, 0.4), fill: ink.bag }, { d: closedD([add(c, [-w, -15]), add(c, [w, -15]), add(c, [w, -3]), add(c, [-w, -3])], 0.4), fill: shadeOf(ink.bag, 0.1), sh: 0.5 }];
    (c3.d > 0 ? bagFront : bagBack).push(...sh);
  }

  // ---- the head ---------------------------------------------------------------------------------------------------
  const headShapes: CShape[] = [];
  const headBehind: CShape[] = [];
  const hy = head.yaw;
  const earAt = (sgn: number) => hProj(head, sgn * 1.62, 0.0, 1.0);
  const hairCoversEars = L.hair === "bob" || L.hair === "long";
  if (!hairCoversEars)
    for (const sgn of [-1, 1]) {
      const e = earAt(sgn);
      headBehind.push({ d: ellD(e.p, 6.2 * fs, 8.4 * fs, head.roll), fill: skin, sh: 0.5 });
    }
  // hair behind the head: the bun, the ponytail, long hair falling behind the shoulders
  const hairC = ink.hair;
  const backHair: CShape[] = [];
  const backHairFront: CShape[] = [];
  if (L.hair === "bun") {
    const bn = hProj(head, Math.PI, -0.18, 1.12);
    headBehind.push({ d: ellD(bn.p, 12 * fs, 11 * fs, head.roll), fill: hairC });
  }
  if (L.hair === "pony") {
    const p0 = hProj(head, Math.PI, 0.05, 1.02);
    const side = -Math.sin(hy);
    const swing = 3 * Math.sin(frame * 0.09);
    const p1 = add(p0.p, [side * 9 * fs + swing * 0.3, 18 * fs]);
    const p2 = add(p0.p, [side * 14 * fs + swing, 44 * fs]);
    const d = tubeD([p0.p, p1, p2], [15 * fs, 16 * fs, 7 * fs]);
    (p0.d > 0.15 ? backHairFront : headBehind).push({ d, fill: hairC });
    headBehind.push({ d: ellD(p0.p, 7 * fs, 6 * fs, head.roll), fill: shadeOf(hairC, 0.1), sh: 0 });
  }
  if (L.hair === "long") {
    const cY = Math.cos(hy);
    const sY = Math.sin(hy);
    const back = sub(head.C, [sY * HR * 0.35, 0]);
    const wTop = HR * (0.92 * Math.abs(cY) + 0.7 * Math.abs(sY));
    const yb = r.toFig([0, shY + 34])[1];
    const pts: P2[] = [add(back, [-wTop, -HR * 0.2]), add(back, [wTop, -HR * 0.2]), [back[0] + wTop * 1.08, yb - 6], [back[0] + wTop * 0.6, yb + 4], [back[0] - wTop * 0.6, yb + 4], [back[0] - wTop * 1.08, yb - 6]];
    const d = closedD(pts, 0.7);
    backHair.push({ d, fill: shadeOf(hairC, 0.06) });
    const wFront = sst(-0.05, -0.35, B.cY);
    if (wFront > 0.002) backHairFront.push({ d, fill: hairC, op: wFront });
  }
  const headD = ellD(head.C, HR * 0.985, HR * 1.03, head.roll);
  headShapes.push({ d: headD, fill: skin });
  if (!hairCoversEars)
    for (const sgn of [-1, 1]) {
      const e = earAt(sgn);
      const w = sst(-0.08, 0.2, e.d);
      if (w > 0.002) headShapes.push({ d: ellD(e.p, 6.2 * fs, 8.4 * fs, head.roll), fill: skin, sh: 0.5, op: w });
    }
  // the face: eyes (look, droopy lids), blush (flush), brows (worried), nose, mouth (open, smile)
  const eyes: P2[] = [];
  for (const sgn of [-1, 1]) {
    const e = hProj(head, sgn * 0.36 + look[0] * 0.11, 0.02 - 0.05 * lids - look[1] * 0.07);
    eyes.push(e.p);
    const v = sst(0.12, 0.38, e.d);
    if (v > 0.003) {
      const rx = 2.65 * fs * mix(0.55, 1, e.d);
      const ry = 3.25 * fs;
      const lid = sst(0.04, 1, lids) * (1 - lArc);
      // a drooping lid flattens the dot's top (a half-closed eye) and lays a small lid line over it
      const pts = ellPts([0, 0], rx, ry, 0, 16).map((p): P2 => [p[0], Math.max(p[1], -ry + 2 * ry * 0.62 * lid)]);
      if (lArc < 0.999) headShapes.push({ d: closedD(pts.map((p) => add(e.p, rot(p, head.roll))), 0.9), fill: eyeC, sh: 0, op: v * (1 - lArc) });
      if (lArc > 0.001) {
        // laughing: the eye squeezed into a happy arc (an upturned crescent stroke)
        const arc: P2[] = [];
        for (let i = -3; i <= 3; i++) arc.push(hProj(head, sgn * 0.36 + look[0] * 0.11 + i * 0.055, 0.0 + 0.055 * (1 - (i / 3) ** 2)).p);
        headShapes.push({ d: lineD(arc), fill: eyeC, det: 2.8, keep: true, op: v * lArc });
      }
      if (lid > 0.08) {
        const yl = -ry + 2 * ry * 0.62 * lid - 0.6 * fs;
        headShapes.push({ d: lineD([add(e.p, rot([-rx * 1.45, yl + 0.8 * fs], head.roll)), add(e.p, rot([0, yl - 0.2 * fs], head.roll)), add(e.p, rot([rx * 1.45, yl + 0.8 * fs], head.roll))]), fill: mixC(skinSh, "#5A3A2E", 0.35), det: 1.7, keep: true, op: 0.7 * v * sst(0.08, 0.3, lid) });
      }
    }
    const b = hProj(head, sgn * 0.7, -0.3 + 0.08 * laugh);
    const vb = sst(0.15, 0.4, b.d);
    if (vb > 0.003) headShapes.push({ d: ellD(b.p, 4.8 * fs * mix(0.6, 1, b.d) * (1 + 0.55 * sickA + 0.18 * laugh), 3 * fs * (1 + 0.45 * sickA + 0.15 * laugh), head.roll), fill: blush, sh: 0, op: (0.5 + 0.3 * sickA + 0.12 * laugh) * vb });
    if (worry > 0.06) {
      const inner = hProj(head, sgn * 0.2, 0.27 + 0.09 * worry);
      const outer = hProj(head, sgn * 0.55, 0.26 - 0.03 * worry);
      const vv = sst(0.15, 0.4, Math.min(inner.d, outer.d)) * sst(0.06, 0.3, worry);
      if (vv > 0.003) headShapes.push({ d: lineD([inner.p, outer.p]), fill: mixC(hairC, "#2A201A", 0.2), det: 2.5, keep: true, op: 0.85 * vv });
    }
  }
  // hair (a region on the sphere above the hairline) with a lit side
  const hairH = (beta: number) => {
    const u = (1 - Math.cos(beta)) / 2;
    const temple = 0.14 * Math.sin(Math.PI * u) ** 2;
    const ab = Math.abs(beta);
    switch (L.hair) {
      case "side":
        return mix(0.52, -0.22, ease(u)) + temple + 0.05 * Math.sin(beta);
      case "buzz":
        return mix(0.62, -0.12, ease(u)) + temple * 0.8;
      case "curly":
        return mix(0.5, -0.2, ease(u)) + temple;
      case "receding":
        return mix(0.95, -0.18, ease(u)) + 0.05 * Math.sin(Math.PI * u);
      case "bob":
        return mix(0.42, -0.62, sst(0.95, 1.4, ab)) - 0.22 * sst(1.6, 2.6, ab);
      case "long":
        return mix(0.42, -0.6, sst(0.95, 1.4, ab)) - 0.6 * sst(1.6, 2.6, ab);
      case "bun":
      case "pony":
        return mix(0.42, -0.3, ease(u)) + temple;
      default:
        return mix(0.55, -0.2, ease(u)) + temple;
    }
  };
  const hatOn = L.hat !== "none";
  const hairVol = L.hair === "bob" || L.hair === "long" ? 1.09 : L.hair === "curly" ? 1.06 : 1.045;
  const subs: P2[][] = [];
  if (L.hair === "receding") {
    // a bald crown: the hair is a band round the sides and the back (two halves, so a front view keeps both sides)
    const lower = (b: number) => mix(0.14, -0.52, ease((Math.abs(b) - 1.0) / (Math.PI - 1.0)));
    const upper = (b: number) => mix(lower(b) + 0.05, mix(0.42, 0.78, sst(1.4, 2.8, Math.abs(b))), sst(1.0, 1.55, Math.abs(b)));
    for (const side of [-1, 1]) {
      const pp = regionPoly(head, (b, p) => b * side >= 0 && Math.abs(b) > 1.0 && p > lower(b) && p < upper(b), "top", 1.02);
      if (pp.length > 2) subs.push(cw(pp.map((u) => hToFig(head, u))));
    }
  } else {
    const hairPoly = regionPoly(head, (b, p) => p > hairH(b), "top", hairVol);
    if (hairPoly.length > 2) subs.push(cw(hairPoly.map((u) => hToFig(head, u))));
  }
  if (L.hair === "curly") {
    const curls: [number, number, number][] = [];
    if (L.hair === "curly") {
      for (let i = -6; i <= 6; i++) {
        const beta = (i / 6) * 2.6;
        curls.push([beta, hairH(beta) + 0.02, 0.15]);
      }
      for (let i = 0; i < 9; i++) curls.push([-2.4 + i * 0.6, 0.95, 0.17]);
    }
    for (const [beta, phi, rad] of curls) {
      const c = hProj(head, beta, phi, 1.02);
      if (c.d < -0.25) continue;
      subs.push(cw(ellPts(c.p, rad * HR, rad * HR * 0.92, head.roll, 10)));
    }
  }
  const hairD = subs.map((sp2) => closedD(sp2, 0.9)).join(" ");
  const hairShapes: CShape[] = [];
  if (hairD && !(hatOn && (L.hair === "crop" || L.hair === "buzz" || L.hair === "side"))) {
    hairShapes.push({ d: hairD, fill: hairC });
    // the lit side: a lighter tone of the hair toward the upper-left light (no flat dark mass)
    hairShapes.push({ d: ellD(hToFig(head, [-0.45, -0.66]), HR * 0.7, HR * 0.52, head.roll - 20), fill: mixC(hairC, "#F3EBDD", 0.22), sh: 0, op: 0.8, blur: 5, clip: hairD });
    if (L.hair === "side") {
      // the side parting: a fine darker line over the crown on his right
      const pp: P2[] = [];
      for (let i = 0; i <= 8; i++) {
        const v = hProj(head, -0.52 - 0.25 * (i / 8), 0.6 + 0.75 * (i / 8), hairVol);
        if (v.d > 0.05) pp.push(v.p);
      }
      if (pp.length > 1) hairShapes.push({ d: lineD(pp), fill: shadeOf(hairC, 0.35), det: 1.6, keep: true, op: 0.7, clip: hairD });
    }
  } else if (hairD && hatOn) {
    // under a hat only the fringe and the sideburns show (the hat covers the rest)
    hairShapes.push({ d: hairD, fill: hairC });
  }
  const beardShapes: CShape[] = [];
  if (L.beard === "stubble") {
    const g = (beta: number) => {
      const a = Math.abs(beta);
      if (a <= 1.45) return mix(-0.52, -0.34, ease(a / 1.45));
      return mix(-0.34, -1.45, ease(Math.min(1, (a - 1.45) / 0.5)));
    };
    const bp = regionPoly(head, (b, p) => p < g(b), "bottom", 1.03);
    if (bp.length > 2) beardShapes.push({ d: closedD(cw(bp.map((u) => hToFig(head, u))), 0.9), fill: mixC(skin, hairC, 0.3), sh: 0, op: 0.2, clip: headD });
  }
  const nz = hProj(head, 0, -0.16, 1.05);
  const nv = sst(-0.1, 0.25, nz.d);
  const noseShapes: CShape[] = nv > 0.003 ? [{ d: ellD(nz.p, fs * (3.4 + 1.2 * Math.abs(Math.sin(hy))), 3.9 * fs, head.roll), fill: skinSh, sh: 0, op: nv }] : [];
  const mouthShapes: CShape[] = [];
  const mo = hProj(head, 0, -0.42, 1.0);
  const mv = sst(0.2, 0.45, mo.d);
  // the mouth crossfades continuously between the smile line, the open "o" and the laugh (no pop when one ramps in)
  const lm = sst(0.04, 0.3, laugh);
  if (laugh > 0.04 && mv > 0.003) {
    // the laugh: a wide crescent, the corners up, the upper lip line nearly straight, a round lower edge, a tongue
    const l = sst(0.04, 1, laugh);
    const w = 0.2 + 0.1 * l;
    const top: P2[] = [];
    const bot: P2[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = -1 + (2 * i) / 8;
      top.push(hProj(head, u * w, -0.33 - 0.035 * (1 - u * u)).p);
      bot.push(hProj(head, u * w * 0.94, -0.33 - (0.05 + 0.19 * l) * Math.sqrt(Math.max(0, 1 - u * u)) - 0.02).p);
    }
    const md = closedD([...top, ...bot.reverse()], 0.6);
    mouthShapes.push({ d: md, fill: "#4A2A24", sh: 0, op: mv * lm });
    const tg = hProj(head, 0.02, -0.33 - 0.17 * l, 1.0);
    mouthShapes.push({ d: ellD(tg.p, w * HR * 0.48, 0.07 * l * HR + 0.5, head.roll), fill: "#C2675F", sh: 0, op: mv * lm * sst(0.2, 0.6, l), clip: md });
  }
  if (open > 0.04 && mv > 0.003 && lm < 0.999) {
    const amt = sst(0.04, 1, open);
    mouthShapes.push({ d: ellD(mo.p, (1.6 + 1.6 * amt) * fs * mix(0.6, 1, mo.d), (1.2 + 3.4 * amt) * fs, head.roll), fill: "#4A2A24", sh: 0, op: mv * (1 - lm) });
  } else if (open <= 0.04 && q.mouth >= 0.15 && mv > 0.003 && lm < 0.999) {
    const a = hProj(head, -0.2, -0.38);
    const b = hProj(head, 0.2, -0.38);
    mouthShapes.push({ d: qD(a.p, add(mo.p, rot([0, 2.4], head.roll)), b.p), fill: "#7A4A3E", det: 1.8, keep: true, op: 0.8 * mv * sst(0.15, 0.25, q.mouth) * (1 - lm) });
  }
  // sweat: one small drop at the temple
  const sweatShapes: CShape[] = [];
  if (sickA > 0.35) {
    const tp = hProj(head, 0.92, 0.28, 1.0);
    const sv = sst(0.35, 0.8, sickA) * sst(0.0, 0.3, tp.d);
    if (sv > 0.01) {
      const c = add(tp.p, rot([0, 2], head.roll));
      sweatShapes.push({ d: closedD([add(c, [0, -5.5 * fs]), add(c, [2.6 * fs, 0.5 * fs]), add(c, [0, 3 * fs]), add(c, [-2.6 * fs, 0.5 * fs])], 0.9), fill: "#DCE6E2", sh: 0, op: 0.9 * sv });
    }
  }
  // the glasses: thin round frames round the eyes and a bridge
  const glassShapes: CShape[] = [];
  if (L.glasses) {
    const ge: { p: P2; d: number }[] = [-1, 1].map((sgn) => hProj(head, sgn * 0.36, 0.0, 1.06));
    const gv = sst(0.1, 0.35, Math.max(ge[0].d, ge[1].d));
    if (gv > 0.01) {
      const ring = (e: { p: P2; d: number }) => (e.d > 0.08 ? closedD(ellPts(e.p, 6.4 * fs * mix(0.5, 1, e.d), 5.6 * fs, head.roll, 14), 0.9) + " " : "");
      const br = hProj(head, 0, 0.04, 1.08);
      glassShapes.push({ d: ring(ge[0]) + ring(ge[1]) + lineD([hProj(head, -0.2, 0.02, 1.07).p, br.p, hProj(head, 0.2, 0.02, 1.07).p]), fill: "#5A5650", det: 1.5, keep: true, op: 0.85 * gv });
    }
  }
  // the face mask over the nose and mouth
  const maskShapes: CShape[] = [];
  if (ink.mask !== "none") {
    const pts: { p: P2; d: number }[] = [];
    for (let i = 0; i <= 8; i++) pts.push(hProj(head, -0.66 + (1.32 * i) / 8, -0.06 - 0.04 * Math.sin((Math.PI * i) / 8), 1.05));
    for (let i = 0; i <= 8; i++) pts.push(hProj(head, 0.6 - (1.2 * i) / 8, -0.66 + 0.06 * Math.sin((Math.PI * i) / 8), 1.04));
    const vis = pts.filter((v) => v.d > 0.0);
    if (vis.length > 4) {
      maskShapes.push({ d: closedD(vis.map((v) => v.p), 0.7), fill: ink.mask, sh: 0.6 });
      const pl = [hProj(head, -0.5, -0.3, 1.06), hProj(head, 0.5, -0.3, 1.06)];
      if (Math.min(pl[0].d, pl[1].d) > 0.05) maskShapes.push({ d: lineD([pl[0].p, hProj(head, 0, -0.28, 1.07).p, pl[1].p]), fill: shadeOf(ink.mask, 0.3), det: 1.2, keep: true, op: 0.5 });
    }
  }
  // the hats
  const hatShapes: CShape[] = [];
  let headTopY = -1.07;
  if (L.hat === "beanie" || L.hat === "bobble") {
    const brimPhi = (b: number) => mix(0.44, 0.02, ease((1 - Math.cos(b)) / 2));
    const regB = regionPoly(head, (b, p) => p > brimPhi(b), "top", 1.075);
    const tilt = -10 * Math.sin(hy);
    const dome: P2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * Math.PI;
      dome.push([-Math.cos(t) * 0.9, -0.42 - Math.sin(t) * 0.82 * (1 - 0.1 * Math.cos(t))]);
    }
    const domeF = dome.map((u) => add(head.C, rot(rot([u[0] * HR, u[1] * HR], tilt), head.roll)));
    const hsubs = [cw(domeF)];
    if (regB.length > 2) hsubs.push(cw(regB.map((u) => hToFig(head, u))));
    const hatD = hsubs.map((s2) => closedD(s2, 0.9)).join(" ");
    hatShapes.push({ d: hatD, fill: ink.hat });
    // the turned-up cuff: a band above the brim line
    const cuff = regionPoly(head, (b, p) => p > brimPhi(b) && p < brimPhi(b) + 0.26, "top", 1.09);
    if (cuff.length > 2) hatShapes.push({ d: closedD(cw(cuff.map((u) => hToFig(head, u))), 0.9), fill: ink.hat2, sh: 0.5 });
    // a few knit ribs on the cuff
    const ribs: string[] = [];
    for (let i = -5; i <= 5; i++) {
      const b0 = i * 0.26;
      const a = hProj(head, b0, brimPhi(b0) + 0.03, 1.09);
      const b = hProj(head, b0, brimPhi(b0) + 0.22, 1.09);
      if (Math.min(a.d, b.d) > 0.1) ribs.push(lineD([a.p, b.p]));
    }
    if (ribs.length) hatShapes.push({ d: ribs.join(" "), fill: shadeOf(ink.hat2, 0.3), det: 1.2, keep: true, op: 0.35 });
    headTopY = -1.32;
    if (L.hat === "bobble") {
      const pp = add(head.C, rot(rot([0, -1.3 * HR], tilt), head.roll));
      hatShapes.push({ d: ellD(pp, 0.3 * HR, 0.27 * HR, head.roll), fill: ink.hat2 });
      headTopY = -1.55;
    }
  } else if (L.hat === "hood") {
    // the protective suit's hood: everything but an oval opening round the face, a puffy volume behind the head
    const inFace = (b: number, p: number) => Math.abs(b) < 0.95 && p < 0.42 && p > -0.75 && (b / 0.95) ** 2 + ((p + 0.16) / 0.6) ** 2 < 1;
    const regH = regionPoly(head, (b, p) => !inFace(b, p), "top", 1.13);
    const hv = add(head.C, rot([-Math.sin(hy) * 0.25 * HR, 0.08 * HR], head.roll));
    headBehind.push({ d: ellD(hv, HR * 1.16, HR * 1.18, head.roll), fill: shadeOf(ink.hat, 0.04) });
    if (regH.length > 2) hatShapes.push({ d: closedD(cw(regH.map((u) => hToFig(head, u))), 0.9), fill: ink.hat });
    // the elastic rim round the face opening
    const rim: { p: P2; d: number }[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * Math.PI * 2;
      rim.push(hProj(head, Math.cos(t) * 0.93, -0.16 + Math.sin(t) * 0.58, 1.02));
    }
    const vis = rim.filter((v) => v.d > 0.02).map((v) => v.p);
    if (vis.length > 3) hatShapes.push({ d: lineD(vis), fill: ink.hat2, det: 2.2, keep: true, op: 0.8 });
    headTopY = -1.2;
  } else if (L.hat === "flatcap") {
    const capPhi = (b: number) => mix(0.5, 0.06, ease((1 - Math.cos(b)) / 2));
    const regC = regionPoly(head, (b, p) => p > capPhi(b), "top", 1.06);
    const tilt = -8 * Math.sin(hy);
    const top2: P2[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = (i / 14) * Math.PI;
      top2.push([-Math.cos(t) * 0.96, -0.45 - Math.sin(t) * 0.62]);
    }
    const tF = top2.map((u) => add(head.C, rot(rot([u[0] * HR + Math.sin(hy) * 4, u[1] * HR], tilt), head.roll)));
    const csubs = [cw(tF)];
    if (regC.length > 2) csubs.push(cw(regC.map((u) => hToFig(head, u))));
    hatShapes.push({ d: csubs.map((s2) => closedD(s2, 0.9)).join(" "), fill: ink.hat });
    // the peak, pointing where the face points (it fades as the face turns away)
    const pk: { p: P2; d: number }[] = [];
    for (let i = 0; i <= 8; i++) pk.push(hProj(head, -0.9 + (1.8 * i) / 8, 0.52, 1.07));
    const pkO = pk.map((v, i) => hProj(head, -0.75 + (1.5 * i) / 8, 0.42, 1.36));
    const pv = sst(-0.2, 0.2, hProj(head, 0, 0.5, 1).d);
    if (pv > 0.01) hatShapes.push({ d: closedD([...pk.map((v) => v.p), ...pkO.reverse().map((v) => v.p)], 0.7), fill: ink.hat2, sh: 0.6, op: pv });
    headTopY = -1.2;
  }
  // the earbuds: small cream buds in the visible ears
  const budShapes: CShape[] = [];
  if (L.earbuds) {
    for (const sgn of [-1, 1]) {
      const e = hProj(head, sgn * 1.5, -0.08, 1.04);
      const w = sst(-0.05, 0.2, e.d);
      if (w > 0.01) budShapes.push({ d: ellD(e.p, 2.6 * fs, 2.6 * fs), fill: "#EEE9DE", sh: 0.4, op: w });
    }
  }
  // the hood lying round the back of the neck (hoodie), the parka's hood
  const hoodShapes: CShape[] = [];
  if (L.top === "hoodie" || L.top === "parka") {
    const c = tor([0, shY - 6 - 6 * hunch], puff + 2);
    const wv = hw * (L.top === "hoodie" ? 0.62 : 0.58);
    hoodShapes.push({ d: closedD([add(c, [-wv, 6]), add(c, [-wv * 0.8, -12]), add(c, [0, -19]), add(c, [wv * 0.8, -12]), add(c, [wv, 6]), add(c, [0, 10])], 0.8), fill: ink.top2 });
  }
  const headTop = add(head.C, rot([0, headTopY * HR], head.roll));

  // ---- ASSEMBLY ---------------------------------------------------------------------------------------------------
  const arms = [r.armL, r.armR];
  const frontWArm = (ar: ArmRig) => sst(-0.35, -0.22, ar.z);
  const out: CShape[] = [];
  out.push(...packBack);
  out.push(...bagBack);
  out.push(...backHair);
  for (const ar of arms) if (frontWArm(ar) < 0.999) out.push(...armShapes(ar));
  out.push(...legShapes(legsSorted[0]));
  out.push(...seatShapes);
  out.push(...legShapes(legsSorted[1]));
  out.push({ d: tubeD([toFig([0, shY + 4]), mix2(toFig([0, shY]), head.C, 0.6)], [24 * k, 20 * k]), fill: skinSh, sh: 0 });
  out.push(...hoodShapes);
  // the torso's fill, then the top's hanging part over its foot (no seam at the waist), then the torso's details
  out.push(torsoShapes[0]);
  out.push(...hangShapes);
  out.push(...torsoShapes.slice(1));
  out.push(...glowShapes);
  out.push(...packFront);
  out.push(...bagFront);
  out.push(...headBehind);
  out.push(...headShapes);
  out.push(...beardShapes);
  out.push(...noseShapes);
  out.push(...mouthShapes);
  out.push(...hairShapes);
  out.push(...maskShapes);
  out.push(...backHairFront);
  out.push(...sweatShapes);
  out.push(...glassShapes);
  out.push(...hatShapes);
  out.push(...budShapes);
  const front = [...arms].sort((a, b) => a.z - b.z);
  for (const ar of front) {
    const w = frontWArm(ar);
    if (w <= 0.001) continue;
    const sh = armShapes(ar);
    out.push(...(w >= 0.999 ? sh : sh.map((s) => ({ ...s, op: (s.op ?? 1) * w }))));
  }

  // ---- anchors (figure-local rig units) ---------------------------------------------------------------------------
  const footTip = (l: LegRig, which: "toe" | "heel"): P2 => {
    const fp = footPts(L.shoe).map((p): P2 => add(l.A, rot([p[0] * G * k, (p[1] + 13) * k], G * l.lift)));
    return which === "toe" ? fp[4] : fp[6];
  };
  // the hem's bottom corners: the garment's extreme points toward the lower left / lower right (continuous)
  const ext = (dx: number) => hemPts.reduce((m, p) => (p[0] * dx + p[1] * 1.6 > m[0] * dx + m[1] * 1.6 ? p : m), hemPts[0] ?? r.hip);
  const hemL = ext(-1);
  const hemR = ext(1);
  const faceDir = Math.sin(hy);
  const mouthDir = norm([faceDir * 1.0, 0.18 + 0.25 * (1 - Math.abs(faceDir))]);
  const anchors: CovidAnchors = {
    headC: head.C,
    headR: HR,
    headTop,
    mouth: mo.p,
    mouthDir,
    eyes: [eyes[0], eyes[1]],
    lungL: lungs[0].c,
    lungR: lungs[1].c,
    chest: mix2(lungs[0].c, lungs[1].c, 0.5),
    shoulderL: r.armL.S,
    shoulderR: r.armR.S,
    wristL: r.armL.W,
    wristR: r.armR.W,
    handL: r.armL.grip,
    handR: r.armR.grip,
    mittenL: mittenGeom(drawnArm(r.armL)).c,
    mittenR: mittenGeom(drawnArm(r.armR)).c,
    hip: r.hip,
    kneeL: r.legL.K,
    kneeR: r.legR.K,
    ankleL: r.legL.A,
    ankleR: r.legR.A,
    toeL: footTip(r.legL, "toe"),
    toeR: footTip(r.legR, "toe"),
    heelL: footTip(r.legL, "heel"),
    heelR: footTip(r.legR, "heel"),
    hemL,
    hemR,
  };
  return { shapes: out, anchors, heightUnits: -headTop[1] };
};

// ===================================================================================================================
// POSES (pure functions; dir 1 = facing screen right, -1 = left; written for a man, retargeted to every build)
// When he faces right his armL is the NEAR arm (his own right).
// ===================================================================================================================
const face = (q: CovidPose, dir: 1 | -1): CovidPose => (dir === 1 ? q : mirrorPose(q));
const frac = (v: number) => v - Math.floor(v);
const F_STAND: CovidPose = { ...STAND, armL: { w: [-55, -137], elbow: [-0.2, 1], fist: 0.3, hand: 0 }, armR: { w: [55, -137], elbow: [0.2, 1], fist: 0.3, hand: 0 } };
const R_STAND: CovidPose = { ...STAND, yaw: 0.62, headYaw: 0.66, armL: { w: [-30, -138], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, armR: { w: [42, -140], elbow: [0.1, 1], fist: 0.3, hand: 0 }, footL: [-6, 0], footR: [8, -2] };
const R_WALK: CovidPose = { ...STAND, yaw: 0.9, headYaw: 0.86, armL: { w: [-8, -139], elbow: [-0.6, 1], fist: 0.35, hand: 0 }, armR: { w: [16, -141], elbow: [-0.6, 1], fist: 0.35, hand: 0 } };
/** the standing hold: the near hand up on a vertical pole (wrist at HOLD.pole) or a hanging strap (HOLD.strap); units
 *  from the feet in the facing direction (a man's; every build scales them). Stand the figure so the pole is HOLD.poleDX
 *  in front of its feet at the same depth, or pass grip={{ L: worldPoint }} for an exact grip. */
export const HOLD = { pole: [58, -222] as P2, strap: [30, -362] as P2, poleDX: 61 };
const R_HOLD_POLE: CovidPose = { ...R_STAND, yaw: 0.78, headYaw: 0.74, armL: { w: HOLD.pole, elbow: [-0.1, 1], fist: 1, hand: -14 }, armR: { w: [30, -142], elbow: [0.1, 1], fist: 0.3, hand: 0 }, footL: [-10, 0], footR: [10, -1] };
const R_HOLD_STRAP: CovidPose = { ...R_STAND, yaw: 0.78, headYaw: 0.74, armL: { w: HOLD.strap, elbow: [-0.9, 0.3], fist: 1, hand: -4 }, armR: { w: [30, -142], elbow: [0.1, 1], fist: 0.3, hand: 0 }, footL: [-10, 0], footR: [10, -1] };
const R_SIT: CovidPose = { ...STAND, yaw: 0.95, headYaw: 0.86, sit: 1, seatH: SEAT.h, lean: 3, armL: { w: [36, -114], elbow: [-0.2, 1], fist: 0.2, hand: 26 }, armR: { w: [44, -116], elbow: [0.2, 1], fist: 0.2, hand: 26 } };

/** breathing: a slow rise of the shoulders (~4.2 s) and a small sway, over any pose; frame = the cut's frame */
export const breathe = (q: CovidPose, frame: number, amount = 1, seed = 0): CovidPose => {
  const t = frame / 29.97;
  const b = Math.sin((t / 4.2) * 2 * Math.PI + seed * 1.7);
  return { ...q, crouch: q.crouch - 0.9 * amount * b, lean: q.lean + 0.35 * amount * Math.sin((t / 6.3) * 2 * Math.PI + seed), roll: q.roll + 0.5 * amount * Math.sin((t / 7.1) * 2 * Math.PI + seed * 2.3), hem: q.hem + 1.2 * amount * Math.sin(t * 0.6 + seed) };
};
/** one step cycle (texcoco walkPose with planted feet; copied so the cast's fields pass through) */
const WALK_STRIDE = 44;
export const walkPose = (base: CovidPose, phase: number, amount = 1, stride = WALK_STRIDE): CovidPose => {
  const dir = Math.sin(base.yaw) >= 0 ? 1 : -1;
  const leg = (u0: number) => {
    const u = frac(u0);
    if (u < 0.5) {
      const v = u / 0.5;
      const peel = Math.max(0, (v - 0.62) / 0.38);
      const land = Math.max(0, 1 - v / 0.14);
      const lift = 30 * ease(peel) - 14 * land;
      return { x: stride * (0.5 - v), y: -Math.max(0, Math.sin((lift * Math.PI) / 180)) * 24, lift };
    }
    const v = (u - 0.5) / 0.5;
    return { x: stride * (-0.5 + ease(v)), y: -15 * Math.sin(Math.PI * v) - 12 * (1 - v) * (1 - v), lift: 30 * (1 - ease(Math.min(1, v * 1.6))) - 14 * ease(Math.max(0, (v - 0.45) / 0.55)) };
  };
  const Lg = leg(phase);
  const Rg = leg(phase + 0.5);
  const sw = Math.sin(2 * Math.PI * (phase + 0.1));
  const a = amount;
  return {
    ...base,
    crouch: base.crouch + a * (2.5 + 2.2 * Math.cos(4 * Math.PI * phase)),
    lean: base.lean + a * 2.5 * dir,
    footL: [base.footL[0] + a * dir * Lg.x, base.footL[1] + a * Lg.y],
    footR: [base.footR[0] + a * dir * Rg.x, base.footR[1] + a * Rg.y],
    liftL: base.liftL + a * dir * Lg.lift,
    liftR: base.liftR + a * dir * Rg.lift,
    armL: { ...base.armL, w: [base.armL.w[0] + a * dir * 13 * sw, base.armL.w[1] - a * 3 * Math.abs(sw)] },
    armR: { ...base.armR, w: [base.armR.w[0] - a * dir * 13 * sw, base.armR.w[1] - a * 3 * Math.abs(sw)] },
    hem: base.hem - a * dir * 3.5 * Math.cos(4 * Math.PI * phase),
  };
};
/** frames per walk cycle (two steps) at 29.97 fps, and the px per frame the feet advance (planted feet) */
export const WALK_CYCLE = 30;
export const walkAdvance = (scale: number, cycle = WALK_CYCLE, stride = WALK_STRIDE) => (2 * stride * scale) / cycle;

const lerpTo = (a: CovidPose, b: CovidPose, t: number) => lerpPose(a, b, ease(c01(t)));
/** cough timing: n coughs over t 0..1 (the hand rises over the first 15 %, falls over the last 15 %) */
const coughJolt = (fr: number) => (fr < 0.28 ? sst(0, 0.28, fr) : 1 - sst(0.28, 1, fr));
const coughCurve = (t: number, n: number) => {
  const up = sst(0, 0.22, t) * (1 - sst(0.8, 1, t));
  const u = c01((t - 0.16) / 0.66) * n;
  const i = Math.floor(u);
  const fr = u - i;
  // each cough: a quick (eased) jolt forward over ~30 % of it, a slower recovery
  const jolt = i < n ? coughJolt(fr) : 0;
  return { up, jolt: jolt * up };
};

/** standing at any yaw (0 front, +-0.6 three-quarter, +-1.3 profile, +-2.4 back three-quarter, PI back), the hanging
 *  arms under their shoulders (the texcoco arms are 2D: their shoulders swap sides past profile) */
export const standAt = (yaw: number): CovidPose => {
  const c = Math.cos(yaw);
  const sn = Math.sin(yaw);
  const hang = (sgn: number): ArmPose => ({ w: [sgn * 54 * c + 9 * sn, -138], elbow: [sgn * 0.3 * c - 0.3 * sn, 1], fist: 0.3, hand: 0 });
  const fo = (sgn: number): P2 => [sgn * 4 * c - 5 * sn * sgn, 0];
  return { ...STAND, yaw, headYaw: yaw + 0.04 * sn, armL: hang(-1), armR: hang(1), footL: fo(-1), footR: fo(1) };
};

export const POSES = {
  /** standing, facing us */
  front: (): CovidPose => F_STAND,
  /** standing at any yaw (front .. profile .. back): standAt */
  turnTo: (yaw: number): CovidPose => standAt(yaw),
  /** standing with his back to us (yaw PI) */
  back: (): CovidPose => standAt(Math.PI),
  /** three-quarter view, standing */
  stand: (dir: 1 | -1 = 1): CovidPose => face(R_STAND, dir),
  /** the walk: phase = frames / WALK_CYCLE; advance the feet by walkAdvance(scale) px per frame */
  walk: (dir: 1 | -1 = 1, phase = 0, amount = 1): CovidPose => face(walkPose(R_WALK, phase, amount), dir),
  /** standing, one hand up on a pole (HOLD.pole) or a strap (HOLD.strap): hand "near" (the arm on the camera side,
   *  across the chest) or "far" (the other arm, behind the body: the chest stays in view, the glow too) */
  standHold: (dir: 1 | -1 = 1, on: "pole" | "strap" = "pole", hand: "near" | "far" = "near"): CovidPose => {
    const q = on === "pole" ? R_HOLD_POLE : R_HOLD_STRAP;
    if (hand === "near") return face(q, dir);
    return face({ ...q, armR: { ...q.armL, w: [q.armL.w[0] + 4, q.armL.w[1]], elbow: [0.1, 1] }, armL: { w: [-20, -140], elbow: [-0.3, 1], fist: 0.3, hand: 0 } }, dir);
  },
  /** seated on a bench seat (seatH units, default SEAT.h), facing dir, hands in the lap */
  sit: (dir: 1 | -1 = 1, seatH = SEAT.h): CovidPose => face({ ...R_SIT, seatH }, dir),
  /** chatting over any pose: the head turned toward `toward` (+1 = screen right), the mouth moving in syllables, a
   *  small hand gesture of the near hand; frame = the cut's frame (loops by itself) */
  chat: (base: CovidPose, frame: number, toward: 1 | -1 = 1, gesture = 1, seed = 0): CovidPose => {
    const t = frame;
    const syl = 0.5 + 0.5 * Math.sin(t * 0.85 + seed * 3);
    const phrase = sst(0.15, 0.55, 0.5 + 0.5 * Math.sin(t * 0.11 + seed * 1.7));
    const open = 0.18 + 0.42 * syl * phrase;
    const g = gesture * (0.5 + 0.5 * Math.sin(t * 0.07 + seed * 2.1));
    const G = Math.sin(base.yaw) >= 0 ? 1 : -1;
    const near = G > 0 ? "armL" : "armR";
    const arm = base[near];
    return {
      ...base,
      headYaw: base.headYaw + toward * 0.22,
      pitch: base.pitch - 2 + 1.6 * Math.sin(t * 0.13 + seed),
      roll: base.roll + 1.5 * Math.sin(t * 0.09 + seed),
      open,
      [near]: { ...arm, w: [arm.w[0] + G * 14 * g, arm.w[1] - 26 * g], fist: mix(arm.fist, 0.05, g), hand: arm.hand - G * 24 * g },
    };
  },
  /** laughing over any pose: the laugh face, the head tipped back a little with a soft bounce (frame = the cut's frame;
   *  amount 0..1 eases it in and out) */
  laugh: (base: CovidPose, frame: number, amount = 1): CovidPose => ({
    ...base,
    laugh: amount,
    pitch: base.pitch - amount * (5 + 2 * Math.sin(frame * 0.55)),
    roll: base.roll + amount * 1.5 * Math.sin(frame * 0.27),
    crouch: base.crouch - amount * 0.8 * Math.sin(frame * 0.55),
  }),
  /** a nod over any pose; t 0..1 (one down-up), amount in degrees */
  nod: (base: CovidPose, t: number, amount = 10): CovidPose => ({ ...base, pitch: base.pitch + amount * Math.sin(Math.PI * c01(t)) ** 2 }),
  /** a wave of the near hand; t = frames (loops), amount 0..1 raises the hand */
  wave: (dir: 1 | -1 = 1, frame = 0, amount = 1): CovidPose => {
    const b = face(R_STAND, dir);
    const near = dir === 1 ? "armL" : "armR";
    const w: P2 = [dir * (44 + 10 * Math.sin(frame * 0.35)), -318];
    return { ...b, [near]: { ...b[near], w: mix2(b[near].w, w, ease(amount)), elbow: [dir * 0.6, 0.8], fist: mix(0.3, 0, amount), hand: -dir * 10 * Math.sin(frame * 0.35) }, mouth: 0.3 * amount };
  },
  /** leaning away from someone over any pose (sitting or standing): t 0..1; away = the screen side to lean toward;
   *  the head turns away (past front), the body turns and leans a little, the hand on the threat's side rises a little
   *  (a small guard: guard "auto" = that hand, "none" = keep both arms, e.g. one holds a pole) */
  leanAway: (base: CovidPose, t: number, away: 1 | -1, guard: "auto" | "none" = "auto"): CovidPose => {
    const e = ease(c01(t));
    const threatArm = away > 0 ? "armL" : "armR";
    const arm = base[threatArm];
    const w: P2 = [arm.w[0] * 0.4 - away * 22, Math.min(arm.w[1], -190)];
    const q: CovidPose = {
      ...base,
      yaw: base.yaw + away * 0.22 * e,
      lean: base.lean + away * 10 * e,
      roll: base.roll + away * 4 * e,
      headYaw: base.headYaw + away * 0.95 * e,
      pitch: base.pitch - 3 * e,
      look: [-away * 0.7 * e, 0],
      worry: Math.max(base.worry ?? 0, 0.6 * e),
    };
    if (guard === "none") return q;
    return { ...q, [threatArm]: { ...arm, w: mix2(arm.w, w, e * 0.85), elbow: mix2(arm.elbow, [-away * 0.6, 1], e), fist: mix(arm.fist, 0.1, e), hand: arm.hand - away * 30 * e } };
  },
  /** coughing over any pose: t 0..1 = the whole fit (n coughs); how = "fist" (the near fist to the mouth) | "elbow"
   *  (into the crook of the near elbow); shoulders hunch, the head and body jolt forward on each cough */
  cough: (base: CovidPose, t: number, n = 3, how: "fist" | "elbow" = "fist"): CovidPose => {
    const { up, jolt } = coughCurve(c01(t), n);
    const G = Math.sin(base.yaw) >= 0 ? 1 : -1;
    const near = G > 0 ? "L" : "R";
    return {
      ...base,
      lean: base.lean + G * (2 * up + 4 * jolt),
      pitch: base.pitch + 6 * up + 7 * jolt,
      crouch: base.crouch + 3 * jolt,
      hunch: Math.max(base.hunch ?? 0, 0.7 * up),
      open: Math.max(base.open ?? 0, 0.25 * up + 0.7 * jolt),
      lids: Math.max(base.lids, 0.45 * jolt),
      worry: Math.max(base.worry ?? 0, 0.4 * up),
      handTo: { ...base.handTo, [near]: { to: how === "fist" ? "mouth" : "elbowMouth", amt: up } },
    };
  },
  /** a loopable cough fit: every `period` frames one cough, the hand staying at the mouth (frame = the cut's frame) */
  coughLoop: (base: CovidPose, frame: number, period = 16, how: "fist" | "elbow" = "fist"): CovidPose => {
    const jolt = coughJolt(frac(frame / period));
    const G = Math.sin(base.yaw) >= 0 ? 1 : -1;
    const near = G > 0 ? "L" : "R";
    return { ...base, lean: base.lean + G * (2 + 4 * jolt), pitch: base.pitch + 6 + 7 * jolt, crouch: base.crouch + 3 * jolt, hunch: 0.7, open: 0.25 + 0.7 * jolt, lids: Math.max(base.lids, 0.45 * jolt), worry: Math.max(base.worry ?? 0, 0.4), handTo: { ...base.handTo, [near]: { to: how === "fist" ? "mouth" : "elbowMouth", amt: 1 } } };
  },
  /** falling ill, t 0..1: from the standing hold (near hand on the pole) to doubled over (0.15..0.45: the far hand to
   *  the chest, the near hand slides down to the knee), then sinking back onto a seat behind him (0.45..1: the feet
   *  stay planted, the hips travel back: move the figure's `at` back by sickenBack(t, kind, variant) * scale) */
  sicken: (dir: 1 | -1 = 1, t = 1, seatH = SEAT.h): CovidPose => {
    const R0: CovidPose = R_HOLD_POLE;
    const R1: CovidPose = {
      ...R_HOLD_POLE,
      lean: 30,
      pitch: 16,
      crouch: 24,
      hunch: 0.8,
      worry: 1,
      lids: 0.45,
      open: 0.3,
      footL: [-14, 0],
      footR: [12, 0],
      armL: { w: [62, -170], elbow: [-0.1, 1], fist: 0.4, hand: 10 },
      armR: { w: [30, -200], elbow: [0.2, 1], fist: 0.3, hand: 0 },
      handTo: { R: { to: "chest", amt: 1 } },
    };
    const R2: CovidPose = { ...R_SIT, seatH, lean: 12, pitch: 20, hunch: 0.7, worry: 1, lids: 0.55, open: 0.15, headYaw: 0.8, handTo: { R: { to: "chest", amt: 0.6 } } };
    const u = c01(t);
    const q = u < 0.45 ? lerpTo(R0, R1, sst(0.12, 0.45, u)) : lerpTo(R1, R2, sst(0.45, 1, u));
    return face(q, dir);
  },
  /** seated sick: head bowed, arms in the lap, slow breathing (frame = the cut's frame) */
  slump: (dir: 1 | -1 = 1, frame = 0, seatH = SEAT.h): CovidPose => {
    const t = frame / 29.97;
    const b = Math.sin((t / 3.6) * 2 * Math.PI);
    const q: CovidPose = { ...R_SIT, seatH, lean: 12 + 1.2 * b, pitch: 22 - 1.5 * b, headYaw: 0.78, roll: 3, hunch: 0.75 - 0.08 * b, worry: 0.9, lids: 0.6, open: 0.12 + 0.05 * b, crouch: -0.6 * b, armL: { w: [34, -112], elbow: [-0.2, 1], fist: 0.1, hand: 30 }, armR: { w: [42, -110], elbow: [0.2, 1], fist: 0.1, hand: 30 } };
    return face(q, dir);
  },
};
/** the seated feet's forward offset (units) for a build at a seated yaw (rigPose's rule) */
export const seatFootX = (kind: CovidKind = "officer", variant = 0, yaw = 0.95) => {
  const sp = lookOf(kind, variant).spec;
  return sp.leg[0] * mix(0.32, 1, Math.abs(Math.sin(yaw))) * 0.93;
};
/** units the hips travel back while sinking onto the seat in POSES.sicken (the feet stay planted: move the figure's
 *  `at` back by sickenBack(t, kind, variant) * scale against its facing direction) */
export const sickenBack = (t: number, kind: CovidKind = "officer", variant = 0) => seatFootX(kind, variant) * ease(sst(0.45, 1, c01(t)));
/** the sit-down from standing (any facing): t 0..1, the feet planted, the hips moving back sitBack(t, kind, variant) */
export const sitDown = (dir: 1 | -1, t: number, seatH = SEAT.h): CovidPose => lerpTo(face(R_STAND, dir), face({ ...R_SIT, seatH }, dir), t);
export const sitBack = (t: number, kind: CovidKind = "commuter", variant = 0) => seatFootX(kind, variant) * ease(c01(t));
