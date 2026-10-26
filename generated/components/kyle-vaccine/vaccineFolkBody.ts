// ---------------------------------------------------------------------------
// vaccineFolkBody — the DRAWN Georgian / 1880s cast of the Kyle Harper clip "Why the first vaccine took so long to
// discover" (kyle-vaccine) as flat gouache shapes on the texcoco rig (the romeFolk skeleton). Pure geometry:
// buildVaccineFolk(kind, variant, pose, opts) -> { shapes, anchors } in FOLK units (FU folk units per rig unit),
// painted by vaccineFolk.tsx (pandemicFolkPaint's gouache filter and crescent shadow, the same hand). vaccineFolk.tsx
// is the API; this file is its geometry.
//
// COPIED (not imported) from kyle-covid/covidFolkBody.ts (read-only for this clip), which copied them from romeFolkBody:
// the torso LATHE (makeBody, sampleRow), the head SPHERE (hProj, hInv, regionPoly), the soft-elbow arm (elbowOf), the
// mitten, the foot, the leg-hull garment (hangHull), the retargeting of a man's pose to any build (rigPose), seats and
// hands to the body (handTo), the grips (gripTo), the expression fields, walkPose / breathe / standAt.
// New here: Georgian clothes (tailcoat with tails behind the legs, waistcoat, stock and jabot, knee breeches over
// stockings, buckled shoes, smock, bodice with a fichu, long skirt, apron, shawl, cape; Pasteur's frock coat and
// trousers), hats (mob cap, bonnet, tricorne, head-wrap, round hat), hair (powdered with a queue and a ribbon, side
// rolls, tousled, plait), Pasteur's short beard and moustache as a lighter textured shape, neutral brows on the heroes,
// squeezed eyes (flinch); SMALLPOX (`pox`: seeded plum domes on face, neck, hands and bare arms, the skin paling),
// `glowArm` (the vaccinated arm's small orange glow), sleeves pushed up (`bare`); held props built from the hand every
// frame (lancet in a pinch grip, flask, octavo book, candle, leather case) with a REACH solve (a prop's key point
// landing on a world point: the lancet's tip, the flask's base, the book's foot) and a RELEASE (the prop stays where it
// was set down, the hand withdraws).
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
export type RadialFill = { stops: [number, string, number][]; cx?: number; cy?: number; r?: number };
export type CShape = Shape & { blur?: number; glow?: boolean; blend?: "screen" | "normal"; grad?: RadialFill };

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

// ===================================================================================================================
// THE BUILDS (texcoco Spec; rig units, a man ~312 to the top of the skull)
// ===================================================================================================================
const HEADK = 1.06;
export const MAN: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08 * HEADK, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [69, 66] };
const WOMAN: Spec = { ...MAN, a: 47, hw: 39, H: 89, hipY: -147, limb: 0.9, headScale: 1.03 * HEADK, arm: [55, 52], leg: [66, 64] };
const ELDER_W: Spec = { ...WOMAN, a: 50, hw: 40, H: 86, hipY: -142, arm: [53, 50], leg: [64, 61] };
/** a child of ~8-10 (~0.7 of a man) and a younger one of ~5-6 (~0.63) */
const CHILD: Spec = { ...MAN, a: 33, hw: 28, H: 60, hipY: -92, limb: 0.66, headScale: 0.98, arm: [36, 34], leg: [39, 37] };
const CHILD_Y: Spec = { ...MAN, a: 31, hw: 26, H: 55, hipY: -82, limb: 0.62, headScale: 0.96, arm: [33, 31], leg: [35, 33] };

// ===================================================================================================================
// THE LOOKS (muted earthy local colours that sit in palette A's teal / espresso air; never near orange)
// ===================================================================================================================
export type VaccineKind = "jenner" | "child" | "inoculator" | "parent" | "pasteur";
export const VACCINE_KINDS: VaccineKind[] = ["jenner", "child", "inoculator", "parent", "pasteur"];
export type HairKind = "crop" | "queue" | "receding" | "curly" | "tousled" | "bob" | "long" | "bun" | "plait" | "short";
/** tailcoat: an open 18th-c. coat (the waistcoat between its fronts, the tails hanging BEHIND the legs);
 *  frock: Pasteur's knee-length frock coat over the legs; waistcoat: shirt sleeves and a waistcoat; jacket: a short
 *  closed jacket; smock: a loose linen over-shirt to mid-thigh; bodice: a woman's or girl's bodice (a fichu at the neck) */
export type Top = "tailcoat" | "frock" | "waistcoat" | "jacket" | "smock" | "bodice";
export type Lower = "breeches" | "trousers" | "skirt";
export type ShoeKind = "buckle" | "dress" | "boot";
export type Hat = "none" | "mobcap" | "bonnet" | "tricorne" | "wrap" | "roundhat";
/** what a hand holds (L = screen left when facing us = the rig's armL = his own right hand) */
export type HandProp = "none" | "lancet" | "flask" | "book" | "candle" | "case";
export type VaccineInks = {
  skin: string;
  hair: string;
  /** the coat / top garment and its trim (collar, cuffs, lapels) */
  top: string;
  top2: string;
  /** the sleeves when they differ from the top (shirt sleeves under a waistcoat); "same" = the top's */
  sleeve: string;
  /** the waistcoat under a coat */
  waist: string;
  /** shirt, stock, fichu, frills */
  shirt: string;
  /** a dark cravat (Pasteur) */
  cravat: string;
  /** breeches / trousers / skirt */
  lower: string;
  stocking: string;
  shoe: string;
  buckle: string;
  hat: string;
  hat2: string;
  shawl: string;
  apron: string;
  /** the queue's ribbon */
  ribbon: string;
  /** the beard / moustache (a lighter textured shape) and the brows */
  beard: string;
  brow: string;
  /** props: the book's binding, the case's leather */
  book: string;
  leather: string;
};
type Look = {
  spec: Spec;
  female: boolean;
  child: boolean;
  hair: HairKind;
  /** side rolls of hair over the ears (an 18th-c. gentleman's) */
  rolls: boolean;
  beard: "none" | "stubble" | "short";
  /** neutral brows always drawn (the heroes) */
  brows: boolean;
  top: Top;
  /** how far the top hangs down the legs (0 = the hip, 1 = the knee) */
  topLen: number;
  /** a long skirt's length (1 knee .. 2 ankle) */
  skirtLen: number;
  /** the coat skirts' flare (tailcoat / frock) */
  flare: number;
  sleeveLen: "full" | "elbow";
  lower: Lower;
  shoe: ShoeKind;
  hat: Hat;
  /** 0 none, 1 a shawl over the shoulders, 2 a short cape */
  shawl: 0 | 1 | 2;
  apron: boolean;
  /** an apron bib on the bodice */
  bib: boolean;
  neck: "stock" | "open" | "cravat" | "fichu" | "collar";
  hold: { L: HandProp; R: HandProp };
  plump: number;
  head: number;
  inks: VaccineInks;
};
export const SKIN = { fair: "#E8C4A0", warm: "#DDB28E", olive: "#D2A57F", tan: "#C9976F", pale: "#EDCFB0", ruddy: "#E2B394", deep: "#A67A5E" };
export const HAIR = {
  darkBrown: "#4A3629",
  brown: "#5E4332",
  chestnut: "#6B4A36",
  blackBrown: "#3A2D25",
  dkBlonde: "#9A8466",
  flaxen: "#B7A27E",
  auburn: "#7A4E3A",
  grey: "#B9B2A6",
  powder: "#E3DED4",
  greyBrown: "#8E8174",
};
const BASE: VaccineInks = {
  skin: SKIN.warm,
  hair: HAIR.darkBrown,
  top: "#6B5A48",
  top2: "#5E4F40",
  sleeve: "same",
  waist: "#D9CDB4",
  shirt: "#EEEAE0",
  cravat: "#2F2A28",
  lower: "#5A4E42",
  stocking: "#DCD5C6",
  shoe: "#3B2D25",
  buckle: "#C4C1B8",
  hat: "#E9E3D6",
  hat2: "#D6CDBB",
  shawl: "#8C5A4C",
  apron: "#E6E0D2",
  ribbon: "#2E2A2A",
  beard: "#9C8E7E",
  brow: "#6A5A4C",
  book: "#6A5040",
  leather: "#5C4434",
};
type LookOpts = Partial<Omit<Look, "inks" | "hold">> & { hold?: Partial<Look["hold"]>; spec: Spec };
const LK = (inks: Partial<VaccineInks>, o: LookOpts): Look => ({
  female: false,
  child: false,
  hair: "crop",
  rolls: false,
  beard: "none",
  brows: false,
  top: "waistcoat",
  topLen: 0.05,
  skirtLen: 1.9,
  flare: 6,
  sleeveLen: "full",
  lower: "breeches",
  shoe: "buckle",
  hat: "none",
  shawl: 0,
  apron: false,
  bib: false,
  neck: "open",
  plump: 0,
  head: 1,
  ...o,
  hold: { L: "none", R: "none", ...(o.hold ?? {}) },
  inks: { ...BASE, ...inks },
});
// THE JENNER (1796): a dark slate-blue tailcoat, cream waistcoat, white stock, buff knee breeches, pale stockings,
// buckled shoes; his own hair powdered grey-white, side rolls, a short queue with a dark ribbon; clean-shaven, kind
const JENNER_FIT: Partial<VaccineInks> = {
  skin: SKIN.ruddy,
  hair: HAIR.powder,
  top: "#4A5C6C",
  top2: "#3F4F5E",
  waist: "#E3D8BF",
  shirt: "#F1EDE4",
  lower: "#AFA284",
  stocking: "#E6E0D3",
  shoe: "#3A2C24",
  buckle: "#CFCCC3",
  ribbon: "#2B2827",
  brow: "#A69C8E",
};
// PASTEUR (1880s): a deep brown-charcoal frock coat with a lit side, a darker waistcoat, white shirt collar, a dark
// cravat, grey-brown trousers; receding grey-brown hair, a short grey-brown beard and moustache (lighter, textured)
const PASTEUR_FIT: Partial<VaccineInks> = {
  skin: SKIN.fair,
  hair: "#8A7D70",
  top: "#4F4741",
  top2: "#443D38",
  waist: "#3E3833",
  shirt: "#F0ECE3",
  cravat: "#2C2724",
  lower: "#5E5852",
  shoe: "#2F2620",
  beard: "#97866F",
  brow: "#7E7164",
};
const LOOKS: Record<VaccineKind, Look[]> = {
  jenner: [LK(JENNER_FIT, { spec: MAN, hair: "queue", rolls: true, brows: true, top: "tailcoat", topLen: 0.95, flare: 5, neck: "stock", plump: 0.25 })],
  child: [
    // v0 a boy (James Phipps type): cream shirt, umber waistcoat, breeches, stockings
    LK({ skin: SKIN.pale, hair: HAIR.chestnut, top: "#6E5240", top2: "#5E4535", sleeve: "#E9E1CF", shirt: "#ECE5D4", lower: "#5A5148", stocking: "#D9D1C1", shoe: "#4A3A2E" }, { spec: CHILD, child: true, hair: "tousled", top: "waistcoat", neck: "open", head: 0.9 }),
    // v1 a girl: mob cap, oatmeal dress, apron
    LK({ skin: SKIN.fair, hair: HAIR.brown, top: "#CBBC9C", top2: "#B8A988", lower: "#C6B796", shirt: "#EEE8DC", apron: "#ECE6DA", stocking: "#CFC7B6", shoe: "#4A3A2E", hat: "#ECE6DA", hat2: "#D9D0BE" }, { spec: CHILD_Y, child: true, female: true, hair: "bob", top: "bodice", lower: "skirt", skirtLen: 1.7, neck: "fichu", apron: true, bib: true, hat: "mobcap", head: 0.92 }),
    // v2 a boy in a smock
    LK({ skin: SKIN.warm, hair: HAIR.dkBlonde, top: "#A7A58C", top2: "#959379", lower: "#5E5244", stocking: "#8E877A", shoe: "#4A3A2E" }, { spec: CHILD, child: true, hair: "tousled", top: "smock", topLen: 0.55, neck: "collar", shoe: "boot", head: 0.9 }),
    // v3 a girl: bonnet, dusty-teal dress
    LK({ skin: SKIN.pale, hair: HAIR.auburn, top: "#6F8E88", top2: "#5F7D77", lower: "#6F8E88", shirt: "#EEE8DC", stocking: "#CFC7B6", shoe: "#4A3A2E", hat: "#E2D8C2", hat2: "#8C5A4C" }, { spec: CHILD, child: true, female: true, hair: "long", top: "bodice", lower: "skirt", skirtLen: 1.75, neck: "fichu", hat: "bonnet", head: 0.9 }),
    // v4 a boy: shirt and a red-brown waistcoat, olive skin, dark curls
    LK({ skin: SKIN.olive, hair: HAIR.blackBrown, top: "#7E4E44", top2: "#6C433A", sleeve: "#E6DECC", shirt: "#E9E2D0", lower: "#4E5961", stocking: "#CFC7B6", shoe: "#3B2D25" }, { spec: CHILD_Y, child: true, hair: "curly", top: "waistcoat", neck: "open", head: 0.92 }),
    // v5 a girl: a muted red-brown dress, a plait, a cream apron
    LK({ skin: SKIN.tan, hair: HAIR.darkBrown, top: "#8C5A4C", top2: "#7A4E42", lower: "#8C5A4C", shirt: "#EEE8DC", apron: "#E6DFD0", stocking: "#9C968A", shoe: "#3B2D25", ribbon: "#E6DFD0" }, { spec: CHILD, child: true, female: true, hair: "plait", top: "bodice", lower: "skirt", skirtLen: 1.75, neck: "fichu", apron: true, head: 0.9 }),
    // v6 a boy: a short slate jacket, flaxen hair
    LK({ skin: SKIN.fair, hair: HAIR.flaxen, top: "#5E6A70", top2: "#525D63", shirt: "#EEE8DC", lower: "#6B5E4E", stocking: "#D9D1C1", shoe: "#3B2D25" }, { spec: CHILD, child: true, hair: "crop", top: "jacket", topLen: 0.12, neck: "collar", head: 0.9 }),
    // v7 a girl: oatmeal dress, a khaki shawl, a mob cap
    LK({ skin: SKIN.warm, hair: HAIR.chestnut, top: "#C2B391", top2: "#AE9F7E", lower: "#B6A787", shirt: "#EEE8DC", shawl: "#8E8668", stocking: "#CFC7B6", shoe: "#4A3A2E", hat: "#ECE6DA", hat2: "#D9D0BE" }, { spec: CHILD_Y, child: true, female: true, hair: "bob", top: "bodice", lower: "skirt", skirtLen: 1.7, neck: "fichu", shawl: 1, hat: "mobcap", head: 0.92 }),
    // v8 a boy: a khaki smock, deep skin, close curls
    LK({ skin: SKIN.deep, hair: HAIR.blackBrown, top: "#9A9070", top2: "#87805F", lower: "#4A4440", stocking: "#8E877A", shoe: "#3B2D25" }, { spec: CHILD_Y, child: true, hair: "curly", top: "smock", topLen: 0.55, neck: "collar", shoe: "boot", head: 0.92 }),
    // v9 a girl: a dusty slate-blue dress, an umber bonnet, fair hair
    LK({ skin: SKIN.fair, hair: HAIR.dkBlonde, top: "#6A7A86", top2: "#5C6B76", lower: "#6A7A86", shirt: "#EEE8DC", apron: "#E6DFD0", stocking: "#CFC7B6", shoe: "#3B2D25", hat: "#8A7056", hat2: "#E6DFD0" }, { spec: CHILD, child: true, female: true, hair: "long", top: "bodice", lower: "skirt", skirtLen: 1.75, neck: "fichu", hat: "bonnet", apron: true, head: 0.9 }),
  ],
  inoculator: [
    // v0 an older woman, the folk practitioner: head-wrap over a cap, a red-brown shawl, umber-grey dress, cream apron
    LK({ skin: SKIN.tan, hair: HAIR.grey, top: "#6B5E52", top2: "#5E5247", lower: "#6B5E52", shirt: "#EAE4D6", shawl: "#8C5A4C", apron: "#E2DACA", stocking: "#8E877A", shoe: "#3B2D25", hat: "#D9CDB4", hat2: "#B9AC90", brow: "#8E8478" }, { spec: ELDER_W, female: true, hair: "bun", top: "bodice", lower: "skirt", skirtLen: 1.95, sleeveLen: "elbow", neck: "fichu", shawl: 1, apron: true, hat: "wrap", head: 0.97, hold: { L: "lancet" } }),
    // v1 a Georgian surgeon-inoculator: brown coat, oatmeal waistcoat, white stock, his own brown hair tied back, a
    // leather case in the other hand
    LK({ skin: SKIN.fair, hair: HAIR.brown, top: "#6B5040", top2: "#5C4536", waist: "#C9BA98", shirt: "#EEEAE0", lower: "#4E443B", stocking: "#B9B3A6", shoe: "#3B2D25", ribbon: "#2B2827", brow: "#5A4536" }, { spec: MAN, hair: "queue", top: "tailcoat", topLen: 0.98, flare: 9, neck: "stock", hold: { L: "lancet", R: "case" } }),
  ],
  parent: [
    // v0 mother: mob cap, khaki-olive shawl, slate-blue long skirt, cream apron
    LK({ skin: SKIN.warm, hair: HAIR.brown, top: "#7A6E5E", top2: "#6A5F51", lower: "#5E6A70", shirt: "#EEE8DC", shawl: "#8E8668", apron: "#E6E0D2", stocking: "#9C968A", shoe: "#3B2D25", hat: "#ECE6DA", hat2: "#D9D0BE" }, { spec: WOMAN, female: true, hair: "bun", top: "bodice", lower: "skirt", skirtLen: 1.92, sleeveLen: "elbow", neck: "fichu", shawl: 1, apron: true, hat: "mobcap" }),
    // v1 father / labourer: a smock, breeches, grey stockings, boots, cropped hair, light stubble
    LK({ skin: SKIN.tan, hair: HAIR.darkBrown, top: "#B3A98C", top2: "#A09679", lower: "#5A4E42", stocking: "#8E877A", shoe: "#3E3029" }, { spec: MAN, hair: "crop", beard: "stubble", top: "smock", topLen: 0.6, neck: "collar", shoe: "boot" }),
    // v2 townswoman: bonnet, a dusty-teal cape, a muted brown dress
    LK({ skin: SKIN.fair, hair: HAIR.chestnut, top: "#8C7A66", top2: "#7A6A58", lower: "#8C7A66", shirt: "#EEE8DC", shawl: "#5F7D77", stocking: "#9C968A", shoe: "#3B2D25", hat: "#E2D8C2", hat2: "#6F5A4A" }, { spec: WOMAN, female: true, hair: "bun", top: "bodice", lower: "skirt", skirtLen: 1.92, sleeveLen: "elbow", neck: "fichu", shawl: 2, hat: "bonnet" }),
    // v3 townsman: a brown coat, buff waistcoat, a dark tricorne, buff breeches
    LK({ skin: SKIN.olive, hair: HAIR.darkBrown, top: "#6E5A48", top2: "#5E4C3C", waist: "#BDB08E", shirt: "#EEEAE0", lower: "#A39678", stocking: "#E2DCCE", shoe: "#3B2D25", hat: "#3F3A36", hat2: "#34302D", ribbon: "#2B2827" }, { spec: MAN, hair: "queue", top: "tailcoat", topLen: 0.95, flare: 8, neck: "stock", hat: "tricorne", plump: 0.2 }),
  ],
  pasteur: [LK(PASTEUR_FIT, { spec: MAN, hair: "receding", beard: "short", brows: true, top: "frock", topLen: 1.0, flare: 4, lower: "trousers", shoe: "dress", neck: "cravat", plump: 0.15 })],
};
/** how many variants each kind has */
export const VACCINE_VARIANTS: Record<VaccineKind, number> = Object.fromEntries(VACCINE_KINDS.map((k) => [k, LOOKS[k].length])) as Record<VaccineKind, number>;
export const lookOf = (kind: VaccineKind, variant = 0): Look => {
  const a = LOOKS[kind];
  return a[((Math.round(variant) % a.length) + a.length) % a.length];
};
export const isFemale = (kind: VaccineKind, variant = 0) => lookOf(kind, variant).female;
export const vaccineSpec = (kind: VaccineKind, variant = 0) => lookOf(kind, variant).spec;

// ===================================================================================================================
// THE POSE: the texcoco FigPose plus this cast's expression and acting fields
// ===================================================================================================================
export type HandTarget = "mouth" | "chest" | "lap" | "knee" | "elbowMouth" | "forehead";
export type HandTo = { to: HandTarget; amt: number };
/** a hand carrying its prop's key point to a world point (the figure's `reachTo`): amt 0..1 blends from where the
 *  pose puts it to the point (+ off, rig units, e.g. the lancet's scratch); release 0..1 = the prop stays where it was
 *  set down and the hand lifts off it; ret 0..1 = the hand goes back to `rest` (the pose's own arm) */
export type Reach = { arm: "L" | "R"; amt: number; off?: P2; release?: number; ret?: number; rest?: ArmPose };
export type VPose = FigPose & {
  /** the pupils' direction, head-local (-1..1 each; x + = screen right, y + = down) */
  look?: P2;
  /** mouth open 0..1; FigPose.mouth >= 0.15 still draws a small smile */
  open?: number;
  /** worried brows 0..1 (the inner ends raised); never a frown */
  worry?: number;
  /** sitting 0..1 (the hips down onto a seat of seatH units, feet forward, any build) */
  sit?: number;
  seatH?: number;
  /** a hand brought to a point of the figure's own body */
  handTo?: { L?: HandTo; R?: HandTo };
  /** shoulders up and the head sunk a little 0..1 */
  hunch?: number;
  /** a real laugh 0..1 (covidFolk's) */
  laugh?: number;
  /** eyes squeezed shut 0..1 (the flinch: two little chevrons) */
  squeeze?: number;
  /** the sleeve pushed up off the upper arm 0..1, per arm (L = the rig's armL) */
  bare?: { L?: number; R?: number };
  /** a book's turn in the hand: 0 the cover to us .. 1 the spine to us (shelving) */
  bookTurn?: number;
  reach?: Reach;
};
/** the seat (units): a bench seat's top above the floor; the hip joint sits hipAbove over it */
export const SEAT = { h: 82, hipAbove: 16 };
const MAN_HIP = 152;
const lerpN = (a: number | undefined, b: number | undefined, t: number, d = 0) => mix(a ?? d, b ?? d, t);
const lerpHT = (a: HandTo | undefined, b: HandTo | undefined, t: number): HandTo | undefined => {
  if (!a && !b) return undefined;
  const aOn = !!a && a.amt > 0.001;
  const bOn = !!b && b.amt > 0.001;
  const to = aOn && bOn ? (t < 0.5 ? a!.to : b!.to) : aOn ? a!.to : bOn ? b!.to : (a ?? b)!.to;
  return { to, amt: mix(a?.amt ?? 0, b?.amt ?? 0, t) };
};
const lerpArmP = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({ w: mix2(a.w, b.w, t), elbow: mix2(a.elbow, b.elbow, t), fist: mix(a.fist, b.fist, t), hand: mix(a.hand, b.hand, t) });
const lerpReach = (a: Reach | undefined, b: Reach | undefined, t: number): Reach | undefined => {
  if (!a && !b) return undefined;
  const A: Reach = a ?? { ...(b as Reach), amt: 0, release: 0, ret: 0 };
  const Bq: Reach = b ?? { ...(a as Reach), amt: 0, release: 0, ret: 0 };
  return {
    arm: t < 0.5 ? A.arm : Bq.arm,
    amt: mix(A.amt, Bq.amt, t),
    off: mix2(A.off ?? [0, 0], Bq.off ?? [0, 0], t),
    release: mix(A.release ?? 0, Bq.release ?? 0, t),
    ret: mix(A.ret ?? 0, Bq.ret ?? 0, t),
    rest: A.rest && Bq.rest ? lerpArmP(A.rest, Bq.rest, t) : (A.rest ?? Bq.rest),
  };
};
/** lerp two cast poses (every FigPose channel and the cast's own fields) */
export const lerpPose = (a: VPose, b: VPose, t: number): VPose => ({
  ...lerpFig(a, b, t),
  look: [lerpN(a.look?.[0], b.look?.[0], t), lerpN(a.look?.[1], b.look?.[1], t)],
  open: lerpN(a.open, b.open, t),
  worry: lerpN(a.worry, b.worry, t),
  sit: lerpN(a.sit, b.sit, t),
  seatH: lerpN(a.seatH, b.seatH, t, SEAT.h),
  handTo: { L: lerpHT(a.handTo?.L, b.handTo?.L, t), R: lerpHT(a.handTo?.R, b.handTo?.R, t) },
  hunch: lerpN(a.hunch, b.hunch, t),
  laugh: lerpN(a.laugh, b.laugh, t),
  squeeze: lerpN(a.squeeze, b.squeeze, t),
  bare: { L: lerpN(a.bare?.L, b.bare?.L, t), R: lerpN(a.bare?.R, b.bare?.R, t) },
  bookTurn: lerpN(a.bookTurn, b.bookTurn, t),
  reach: lerpReach(a.reach, b.reach, t),
});
const mArm = (a: ArmPose): ArmPose => ({ w: [-a.w[0], a.w[1]], elbow: [-a.elbow[0], a.elbow[1]], fist: a.fist, hand: -a.hand });
/** the pose facing the other way (L and R swap) */
export const mirrorPose = (q: VPose): VPose => ({
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
  bare: q.bare ? { L: q.bare.R, R: q.bare.L } : undefined,
  reach: q.reach ? { ...q.reach, arm: q.reach.arm === "L" ? "R" : "L", off: q.reach.off ? [-q.reach.off[0], q.reach.off[1]] : undefined, rest: q.reach.rest ? mArm(q.reach.rest) : undefined } : undefined,
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
export const rigPose = (kind: VaccineKind, variant: number, q0: VPose): FigPose => {
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
const specFor = (L: Look, q: VPose): Spec => {
  const sit = c01(q.sit ?? 0);
  if (sit <= 0.0001) return L.spec;
  const asn = Math.abs(Math.sin(q.yaw));
  const k = mix(1, mix(0.32, 1, asn), sit);
  return { ...L.spec, leg: [L.spec.leg[0] * k, L.spec.leg[1]] };
};
/** the rig of a cast member in a pose (texcoco figureRig on the build, the pose retargeted) */
export const vaccineRig = (kind: VaccineKind, variant: number, q0: VPose) => {
  const L = lookOf(kind, variant);
  const q = rigPose(kind, variant, q0);
  return { L, q, r: figureRig(specFor(L, q0), q) };
};
/** the pose with its arms solved so the hand grips land on world points (gripTo of romeCast on this build) */
export const vaccineGripTo = (kind: VaccineKind, variant: number, pose: VPose, grip: { L?: P2; R?: P2 }, at: P2, scale: number): VPose => {
  const L = lookOf(kind, variant);
  const sp = specFor(L, pose);
  let q: VPose = pose;
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
// THE DRAWN ARM AND THE MITTEN (covidFolkBody's, as module functions so the reach solve can use them)
// ===================================================================================================================
const elbowOfA = (sp: Spec, q: FigPose, ar: ArmRig): P2 => {
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
/** the drawn arm: the soft elbow, and the hand's direction from THAT elbow */
const drawnArmA = (sp: Spec, q: FigPose, ar0: ArmRig): ArmRig => {
  const E = elbowOfA(sp, q, ar0);
  const fw = sub(ar0.W, E);
  const hand = ar0.sgn < 0 ? q.armL.hand : q.armR.hand;
  const dir = vlen(fw) > 2 ? rot(norm(fw), hand) : ar0.dir;
  return { ...ar0, E, dir };
};
type MG = { d: P2; n: P2; ts: number; fist: number; len: number; wid: number; c: P2; ang: number };
const mittenGeomA = (sp: Spec, q: FigPose, ar: ArmRig): MG => {
  const k = sp.limb;
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

// ===================================================================================================================
// THE PROPS (rig units; real sizes, U = 178 per metre; drawn upright where gravity says so)
// ===================================================================================================================
/** the lancet: a cream handle and a small bright steel blade (handle 12, blade 9 units past the fist) */
export const LANCET = { handle: 12, blade: 9, w: 3.1 };
/** a small glass flask: a round bulb (radius), a neck (length, width), a rim */
export const FLASK = { r: 14, neck: 19, neckW: 7, rim: 9.4 };
/** a closed octavo book: cover width x height, thickness */
export const BOOK = { w: 27, h: 40, t: 8.5 };
export const STEEL = { lit: "#E6EAEA", mid: "#C9CFD0", dark: "#9AA2A4" };
export const GLASS = { body: "#EDE6D3", edge: "#B9B09A", hi: "#FBF8F1" };
export const POX = "#8E4552";
export const POX_DEEP = "#6A2E3A";
const POX_HI = "#B07080";
const ACC = "#FFB000";
const ACC_HOT = "#FFC94D";
const DEAD_C = "#8A7B62";
const SHADE_TO = "#2C3433";
const PALE = "#E4DACB";
/** the speck on the lancet's tip: smallpox matter (plum) or the cowpox lymph of a vaccination (orange) */
export type Charge = { kind: "pox" | "vaccine"; amt: number };

/** the flask standing on its base point (rig units) */
export const flaskShapes = (base: P2, fill = 0, fillC = ACC): CShape[] => {
  const R = FLASK.r;
  const cB: P2 = [base[0], base[1] - R * 0.96];
  const nwh = FLASK.neckW / 2;
  const nT: P2 = [base[0], cB[1] - R * 0.8 - FLASK.neck];
  // one silhouette: the neck's right side down into the bulb, round the bulb, up the neck's left side
  const dl = Math.asin(nwh / R);
  const sil: P2[] = [[base[0] + nwh, nT[1] + 1]];
  for (let i = 0; i <= 22; i++) {
    const a = -Math.PI / 2 + dl + (i / 22) * (2 * Math.PI - 2 * dl);
    sil.push([cB[0] + Math.cos(a) * R, cB[1] + Math.sin(a) * R * 0.98]);
  }
  sil.push([base[0] - nwh, nT[1] + 1]);
  const silD = closedD(sil, 0.5);
  const out: CShape[] = [];
  out.push({ d: silD, fill: GLASS.body, op: 0.7, sh: 0.35 });
  if (fill > 0.002) {
    const lvl = base[1] - 2 * R * 0.98 * c01(fill) * 0.92 - 0.6;
    const liq = closedD([[base[0] - R * 1.2, lvl], [base[0] + R * 1.2, lvl], [base[0] + R * 1.2, base[1] + 2], [base[0] - R * 1.2, base[1] + 2]], 0.1);
    const glow = fillC === ACC || fillC === ACC_HOT;
    out.push({ d: liq, fill: fillC, op: 0.88, sh: 0, glow, clip: silD });
    if (glow) out.push({ d: ellD(cB, R * 1.5, R * 1.5), fill: ACC, glow: true, blur: 5, op: 0.32 * c01(fill * 3), sh: 0 });
  }
  // the glass edge, a highlight on the upper left, the rim
  out.push({ d: silD, fill: GLASS.edge, det: 1.3, keep: true, op: 0.6 });
  out.push({ d: qD([cB[0] - R * 0.62, cB[1] + R * 0.1], [cB[0] - R * 0.6, cB[1] - R * 0.62], [cB[0] - R * 0.12, cB[1] - R * 0.74]), fill: GLASS.hi, det: 2.2, keep: true, op: 0.85 });
  out.push({ d: ellD(nT, FLASK.rim / 2, 2.1), fill: GLASS.body, sh: 0.3, op: 0.95 });
  out.push({ d: ellD(nT, FLASK.rim / 2, 2.1), fill: GLASS.edge, det: 1.1, keep: true, op: 0.55 });
  return out;
};
/** the book standing on its foot point (the bottom of its middle), turned 0 (cover to us) .. 1 (spine to us), tilted
 *  (deg, about the foot) */
export const bookShapes = (foot: P2, turn: number, tilt: number, bind: string): CShape[] => {
  const th = c01(turn) * (Math.PI / 2);
  const W = BOOK.w;
  const T = BOOK.t;
  const H = BOOK.h;
  const cx = Math.cos(th);
  const sx = Math.sin(th);
  const T2 = (x: number, y: number): P2 => add(foot, rot([x, y], tilt));
  const cov0 = -W / 2 * cx + (T / 2) * sx;
  const cov1 = (W / 2) * cx + (T / 2) * sx;
  const sp0 = -W / 2 * cx - (T / 2) * sx;
  const out: CShape[] = [];
  const dark = mixC(bind, SHADE_TO, 0.22);
  // the spine face (darker, two raised bands), then the cover face (a lighter inset panel)
  if (sx > 0.02) {
    const sp = [T2(sp0, -H), T2(cov0, -H), T2(cov0, 0), T2(sp0, 0)];
    out.push({ d: closedD(sp, 0.12), fill: dark, sh: 0.3 });
    for (const y of [-H * 0.82, -H * 0.18]) out.push({ d: lineD([T2(sp0 + 0.8, y), T2(cov0 - 0.8, y)]), fill: mixC(bind, "#F3EBDD", 0.25), det: 1.4, keep: true, op: 0.7 * sst(0.05, 0.3, sx) });
  }
  if (cx > 0.02) {
    const cv = [T2(cov0, -H), T2(cov1, -H), T2(cov1, 0), T2(cov0, 0)];
    out.push({ d: closedD(cv, 0.12), fill: bind, sh: 0.6 });
    const ins = 3.2;
    const w = cov1 - cov0;
    if (w > 8) out.push({ d: closedD([T2(cov0 + ins * cx, -H + ins), T2(cov1 - ins * cx, -H + ins), T2(cov1 - ins * cx, -ins), T2(cov0 + ins * cx, -ins)], 0.1), fill: mixC(bind, "#F3EBDD", 0.1), det: 1.1, keep: true, op: 0.55 * sst(0.2, 0.5, cx) });
  }
  // the page block's head (cream) as a thin top edge when the book is turned
  if (sx > 0.05 && cx > 0.05) out.push({ d: lineD([T2(cov0, -H - 0.4), T2(cov1, -H - 0.4)]), fill: "#E9DEC4", det: 1.2, keep: true, op: 0.6 });
  return out;
};
export const candleShapes = (dish: P2): CShape[] => {
  const out: CShape[] = [];
  out.push({ d: ellD(dish, 11, 3.2), fill: "#7E7564", sh: 0.5 });
  out.push({ d: closedD([add(dish, [-2.8, -1]), add(dish, [2.8, -1]), add(dish, [2.6, -24]), add(dish, [-2.6, -24])], 0.2), fill: "#EFE8D8", sh: 0.5 });
  // a pale, cream-white flame (never orange: orange is the vaccine)
  const fl = add(dish, [0, -30]);
  out.push({ d: ellD(fl, 9, 11), fill: "#F7F1E2", glow: true, blur: 4, op: 0.35, sh: 0 });
  out.push({ d: closedD([add(fl, [0, -6.5]), add(fl, [2.4, 1]), add(fl, [0, 3.5]), add(fl, [-2.4, 1])], 0.9), fill: "#FBF6E8", sh: 0, op: 0.95 });
  return out;
};

// ===================================================================================================================
// BUILD
// ===================================================================================================================
export type BuildOpts = {
  /** colour overrides for this figure */
  inks?: Partial<VaccineInks>;
  /** what the hands hold (overrides the look's default) */
  hold?: { L?: HandProp; R?: HandProp };
  /** SMALLPOX 0..1: raised plum domes over face, neck, hands and bare arms (a stable seeded pattern: they never
   *  move or swap; each appears at its own threshold), the skin paling, droopy lids, worried brows */
  pox?: number;
  /** 0..1 visibly ill without spots (covidFolk's sick: pale skin, droopy lids, worried brows, a sweat drop) */
  sick?: number;
  /** 0..1 toward DEAD #8A7B62 (cloth and hair), the skin greying */
  drain?: number;
  /** 0..1 the vaccinated arm's small soft orange glow on the upper arm; glowSide "L" | "R" (default the near arm) */
  glowArm?: number;
  glowSide?: "L" | "R";
  /** the speck on the lancet's tip */
  charge?: Charge;
  /** the flask's fill 0..1 and colour (default the vaccine orange, glowing) */
  flaskFill?: number;
  flaskFillC?: string;
  /** a prop set down (released): drawn at its key point (figure-local units), not in the hand */
  placed?: { prop: HandProp; key: P2; turn?: number };
  frame?: number;
};
export type VaccineAnchors = {
  headC: P2;
  headR: number;
  headTop: P2;
  mouth: P2;
  eyes: [P2, P2];
  chest: P2;
  shoulderL: P2;
  shoulderR: P2;
  elbowL: P2;
  elbowR: P2;
  wristL: P2;
  wristR: P2;
  /** the hand grips (texcoco: 11 units past the wrist) and the mittens' centres */
  handL: P2;
  handR: P2;
  mittenL: P2;
  mittenR: P2;
  /** the upper arm's vaccination spot (the outer upper arm, ~0.36 from shoulder to elbow) */
  armSpotL: P2;
  armSpotR: P2;
  /** each hand's prop key point (lancet tip, flask base, book foot, candle dish), or the mitten centre */
  keyL: P2;
  keyR: P2;
  hip: P2;
  kneeL: P2;
  kneeR: P2;
  ankleL: P2;
  ankleR: P2;
  toeL: P2;
  toeR: P2;
  heelL: P2;
  heelR: P2;
  hemL: P2;
  hemR: P2;
};
export type VaccineBuild = { shapes: CShape[]; anchors: VaccineAnchors; heightUnits: number };

/** a hand prop's key point and shapes from the drawn hand (figure-local) */
const handPropOf = (prop: HandProp, m: MG, k: number, o: { bookTurn: number; charge?: Charge; flaskFill?: number; flaskFillC?: string; book: string; leather: string; rest: number }) => {
  const back: CShape[] = [];
  const front: CShape[] = [];
  let key: P2 = m.c;
  /** the prop hangs in front of the arm: the fist is drawn again over it */
  let over = false;
  if (prop === "lancet") {
    // a pinch grip: the handle out of the mitten's tip along the hand, the blade beyond it
    const d = m.d;
    const h0 = add(m.c, mul(d, -2 * k));
    const h1 = add(m.c, mul(d, m.len * 0.5 + LANCET.handle * 0.55));
    const tip = add(h1, mul(d, LANCET.blade));
    back.push({ d: tubeD([h0, mix2(h0, h1, 0.5), h1], [LANCET.w, LANCET.w * 1.05, LANCET.w * 0.92]), fill: "#E9DFC8", sh: 0.5 });
    back.push({ d: tubeD([add(h1, mul(d, -0.6)), add(h1, mul(d, LANCET.blade * 0.45)), tip], [LANCET.w * 0.95, LANCET.w * 0.82, 0.35]), fill: STEEL.mid, sh: 0 });
    back.push({ d: lineD([add(add(h1, mul(d, 0.6)), mul(m.n, -0.5)), add(tip, mul(m.n, -0.15))]), fill: STEEL.lit, det: 1.3, keep: true, op: 0.95 });
    if (o.charge && o.charge.amt > 0.01) {
      const vac = o.charge.kind === "vaccine";
      const c = add(tip, mul(d, -1.6));
      if (vac) back.push({ d: ellD(c, 4.2, 4.2), fill: ACC, glow: true, blur: 2.4, op: 0.55 * o.charge.amt, sh: 0 });
      back.push({ d: ellD(c, 1.9, 1.9), fill: vac ? ACC : POX, glow: vac, sh: 0, op: c01(o.charge.amt) });
    }
    key = tip;
  } else if (prop === "flask") {
    // held by the NECK (the fist round it), the bulb hanging below the hand in full view; upright always
    const base = add(m.c, [0, FLASK.r * 1.76 + FLASK.neck * 0.78]);
    front.push(...flaskShapes(base, o.flaskFill ?? 0, o.flaskFillC ?? ACC));
    over = true;
    key = base;
  } else if (prop === "book") {
    // held at its foot, the fist over the bottom edge; the book upright
    const foot = add(m.c, [0, 4.5 * k]);
    back.push(...bookShapes(foot, o.bookTurn, 0, o.book));
    key = foot;
  } else if (prop === "candle") {
    const dish = add(m.c, [0, -4 * k]);
    front.push(...candleShapes(dish));
    key = dish;
  } else if (prop === "case") {
    // a surgeon's leather case hanging from the fist: a handle and a box with a clasp (always hanging straight down)
    const g = add(m.c, [0, 2 * k]);
    const T = (x: number, y: number): P2 => add(g, [x, y]);
    back.push({ d: tubeD([T(-7, 12), T(-6, 1), T(0, -4), T(6, 1), T(7, 12)], [3, 3, 3, 3, 3]), fill: mixC(o.leather, SHADE_TO, 0.2), sh: 0 });
    front.push({ d: closedD([T(-19, 10), T(19, 10), T(20, 34), T(-20, 34)], 0.3), fill: o.leather });
    front.push({ d: closedD([T(-19, 10), T(19, 10), T(19, 16), T(-19, 16)], 0.3), fill: mixC(o.leather, SHADE_TO, 0.12), sh: 0.4 });
    front.push({ d: ellD(T(0, 16.5), 2.6, 2), fill: "#B8B4A8", sh: 0 });
    key = T(0, 34);
  }
  return { back, front, key, over };
};

export const buildVaccineFolk = (kind: VaccineKind, variant: number, q0: VPose, o: BuildOpts = {}): VaccineBuild => {
  const L = lookOf(kind, variant);
  const pox = c01(o.pox ?? 0);
  const sickA = c01(o.sick ?? 0);
  const ink0: VaccineInks = { ...L.inks, ...(o.inks ?? {}) };
  const dr = c01(o.drain ?? 0);
  const ink: VaccineInks = dr <= 0 ? ink0 : (Object.fromEntries(Object.entries(ink0).map(([kk, v]) => [kk, v === "same" ? v : mixC(v, kk === "skin" ? "#B8A890" : DEAD_C, kk === "skin" ? 0.45 * dr : 0.85 * dr)])) as VaccineInks);
  const hunch = c01(Math.max(q0.hunch ?? 0, 0.35 * sickA, 0.3 * pox));
  const { q, r } = vaccineRig(kind, variant, q0);
  const sp = specFor(L, q0);
  const k = sp.limb;
  const hw = sp.hw;
  const A = sp.a;
  const shY = r.shY;
  const G = r.s >= 0 ? 1 : -1;
  const toFig = r.toFig;
  void o.frame;
  const hold0 = { L: o.hold?.L ?? L.hold.L, R: o.hold?.R ?? L.hold.R };
  const placed = o.placed;
  const hold = { L: placed && hold0.L === placed.prop && q0.reach?.arm === "L" ? "none" : hold0.L, R: placed && hold0.R === placed.prop && q0.reach?.arm === "R" ? "none" : hold0.R } as { L: HandProp; R: HandProp };
  const worry = c01(Math.max(q0.worry ?? 0, 0.85 * sickA, 0.8 * pox));
  const lids = c01(Math.max(q.lids, 0.55 * sst(0.1, 0.9, sickA), 0.5 * sst(0.15, 0.9, pox)));
  const open = c01(q0.open ?? 0);
  const look: P2 = q0.look ?? [0, 0];
  const laugh = c01(q0.laugh ?? 0);
  const lArc = sst(0.25, 0.6, laugh);
  const squeeze = c01(q0.squeeze ?? 0);
  const bare = { L: c01(q0.bare?.L ?? 0), R: c01(q0.bare?.R ?? 0) };
  const glowArm = c01(o.glowArm ?? 0);

  // ---- colours ------------------------------------------------------------------------------------------------------
  const skin = mixC(mixC(ink.skin, "#BFC4A3", 0.55 * sickA), PALE, 0.42 * pox);
  const skinSh = mixC(skin, "#8A5A44", 0.22);
  const blush = mixC("#D98A80", "#CC6F6C", sickA);
  const blushK = 1 - 0.55 * pox;
  const eyeC = "#2A201A";
  const top = ink.top;
  const sleeveC = ink.sleeve === "same" ? top : ink.sleeve;
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
  const puff = L.top === "smock" ? 2.2 : L.top === "frock" || L.top === "tailcoat" ? 1.4 : L.top === "bodice" ? 0.5 : 0.9;
  const sleeveK = L.top === "smock" ? 1.17 : L.top === "tailcoat" || L.top === "frock" ? 1.08 : L.top === "bodice" ? 1.02 : 1.04;
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * 20;

  // ---- the arms ----------------------------------------------------------------------------------------------------
  const drawnArm = (ar0: ArmRig) => drawnArmA(sp, q, ar0);
  const mittenGeom = (ar: ArmRig) => mittenGeomA(sp, q, ar);
  const mitten = (ar: ArmRig): CShape[] => {
    const m = mittenGeom(ar);
    const out: CShape[] = [];
    const tb = add(add(ar.W, mul(m.d, 6 * k)), mul(m.n, m.ts * 7 * k));
    out.push({ d: ellD(add(tb, mul(rot(m.d, -m.ts * mix(28, 70, m.fist)), 4 * k)), 5.4 * k, 4.2 * k, m.ang - m.ts * mix(28, 70, m.fist)), fill: skin, sh: 0.5 });
    out.push({ d: ellD(m.c, m.len * 0.56, m.wid * 0.5, m.ang), fill: skin });
    return out;
  };
  const propOpts = { bookTurn: q0.bookTurn ?? 0, charge: o.charge, flaskFill: o.flaskFill, flaskFillC: o.flaskFillC, book: ink.book, leather: ink.leather, rest: 0 };
  // the arm as a polyline with params 0 (shoulder) .. 1 (elbow) .. 2 (wrist)
  const ARM_T = [0, 0.5, 1, 1.3, 1.72, 2];
  const armPts = (ar: ArmRig): P2[] => {
    const uu = norm(sub(ar.E, ar.S));
    return [add(ar.S, mul(uu, 8)), mix2(ar.S, ar.E, 0.5), ar.E, mix2(ar.E, ar.W, 0.3), mix2(ar.E, ar.W, 0.72), ar.W];
  };
  const along = (pts: P2[], ws: number[], t: number): { p: P2; w: number } => {
    const tt = Math.max(0, Math.min(2, t));
    for (let i = 1; i < ARM_T.length; i++) {
      if (tt <= ARM_T[i] + 1e-9) {
        const u = (tt - ARM_T[i - 1]) / (ARM_T[i] - ARM_T[i - 1]);
        return { p: mix2(pts[i - 1], pts[i], u), w: mix(ws[i - 1], ws[i], u) };
      }
    }
    return { p: pts[pts.length - 1], w: ws[ws.length - 1] };
  };
  const partTube = (pts: P2[], ws: number[], t0: number, t1: number): string => {
    const P: P2[] = [];
    const W: number[] = [];
    const a = along(pts, ws, t0);
    P.push(a.p);
    W.push(a.w);
    for (let i = 0; i < ARM_T.length; i++)
      if (ARM_T[i] > t0 + 0.02 && ARM_T[i] < t1 - 0.02) {
        P.push(pts[i]);
        W.push(ws[i]);
      }
    const b = along(pts, ws, t1);
    P.push(b.p);
    W.push(b.w);
    return tubeD(P, W);
  };
  const armSpotOf = (ar: ArmRig): P2 => mix2(ar.S, ar.E, 0.4);
  const glowSide = o.glowSide ?? (G > 0 ? "L" : "R");
  /** pox domes (figure-local): a base, a lighter dome, a highlight */
  const poxDot = (c: P2, rr: number, a: number): CShape[] =>
    a <= 0.01
      ? []
      : [
          { d: ellD(c, rr, rr * 0.92), fill: POX_DEEP, sh: 0, op: a },
          { d: ellD(add(c, [-0.12 * rr, -0.14 * rr]), rr * 0.8, rr * 0.74), fill: POX, sh: 0, op: a },
          { d: ellD(add(c, [-0.34 * rr, -0.36 * rr]), rr * 0.3, rr * 0.26), fill: POX_HI, sh: 0, op: a * 0.9 },
        ];
  const poxAmt = (seed: number) => {
    const th = 0.04 + 0.78 * hash(seed, 211);
    return sst(th, th + 0.14, pox);
  };
  const armShapes = (ar0: ArmRig): CShape[] => {
    const side: "L" | "R" = ar0.sgn < 0 ? "L" : "R";
    const ar: ArmRig = drawnArm(ar0);
    const out: CShape[] = [];
    const prop = side === "L" ? hold.L : hold.R;
    const m = mittenGeom(ar);
    const hp = handPropOf(prop, m, k, propOpts);
    out.push(...hp.back);
    const pts = armPts(ar);
    const base = [23, 25, 22, 22, 19, 16.5];
    const sl = base.map((w, i) => w * k * (i < 2 ? mix(1, sleeveK, 0.85) : sleeveK));
    const skW = [19, 20, 16.5, 15.5, 13.5, 12].map((w) => w * k);
    const bareA = ease(side === "L" ? bare.L : bare.R);
    const end0 = L.sleeveLen === "elbow" ? 1.14 : 2;
    const sEnd = mix(end0, 0.3, bareA);
    // the bare skin under the sleeve (always under it: nothing pops when the sleeve slides up)
    if (sEnd < 1.995) out.push({ d: tubeD(pts, skW), fill: skin });
    out.push({ d: partTube(pts, sl, 0, Math.max(0.12, sEnd)), fill: sleeveC });
    if (L.top === "smock") {
      // full smock sleeves gathered: two soft folds
      out.push({ d: [0.45, 1.45].filter((t) => t < sEnd - 0.1).map((t) => { const a0 = along(pts, sl, t); const a1 = along(pts, sl, t + 0.25); return lineD([add(a0.p, [0, 0]), a1.p]); }).join(" ") || "M 0 0", fill: shadeOf(sleeveC, 0.25), det: 1.3, keep: true, op: 0.4 });
    }
    // the cuff at the sleeve's end: a full sleeve's cuff (a coat's big turned-back cuff, a shirt's cuff), an elbow
    // sleeve's frill, a pushed-up sleeve's roll (the colours crossfade as it slides)
    const e = along(pts, sl, sEnd);
    const eB = along(pts, sl, Math.max(0, sEnd - 0.14));
    const cuffU = norm(sub(e.p, eB.p));
    const coat = L.top === "tailcoat" || L.top === "frock";
    const cuffLen = mix(coat ? 9 : 5, 5, bareA) * k;
    const cuffCol0 = coat ? ink.top2 : L.sleeveLen === "elbow" ? mixC(ink.shirt, sleeveC, 0.25) : shadeOf(sleeveC, 0.06);
    const cuffCol = mixC(cuffCol0, shadeOf(sleeveC, 0.08), bareA);
    const cw0 = e.w * (coat ? 1.14 : L.sleeveLen === "elbow" ? 1.04 : 1.05) * mix(1, 1.08, bareA);
    out.push({ d: tubeD([add(e.p, mul(cuffU, -cuffLen)), add(e.p, mul(cuffU, 1.5 * k))], [cw0 * 0.98, cw0]), fill: cuffCol, sh: 0.45 });
    if (coat && sEnd > 1.9) out.push({ d: tubeD([add(ar.W, mul(cuffU, -1 * k)), add(ar.W, mul(cuffU, 3 * k))], [15.5 * k, 16.5 * k]), fill: ink.shirt, sh: 0.2 });
    // the shawl / cape over the shoulder
    if (L.shawl) {
      const t1 = L.shawl === 1 ? 0.48 : 0.92;
      out.push({ d: partTube(pts, sl.map((w) => w * 1.16), 0, t1), fill: ink.shawl, sh: 0.6 });
    }
    // the vaccinated arm's glow (the medium's faint bloom): a small soft orange spot on the upper arm
    if (glowArm > 0.005 && glowSide === side) {
      const s0 = armSpotOf(ar);
      out.push({ d: ellD(s0, 11 * k, 11 * k), fill: ACC, glow: true, blur: 4.5, op: 0.42 * glowArm, sh: 0, grad: { stops: [[0, ACC, 0.9], [0.55, ACC, 0.45], [1, ACC, 0]] } });
      out.push({ d: ellD(s0, 3.4 * k, 3.1 * k), fill: ACC_HOT, glow: true, blur: 1.1, op: 0.85 * glowArm, sh: 0 });
    }
    // smallpox on the bare skin of the arm and on the hand
    if (pox > 0.01) {
      for (let i = 0; i < 6; i++) {
        const sd = (side === "L" ? 400 : 500) + i * 7.1;
        const t = mix(Math.min(2, sEnd + 0.08), 1.96, hash(sd, 3));
        if (t > 1.97 || sEnd > 1.9) continue;
        const a0 = along(pts, skW, t);
        const nrm: P2 = [-cuffU[1], cuffU[0]];
        const c = add(a0.p, mul(nrm, (hash(sd, 5) - 0.5) * a0.w * 0.55));
        out.push(...poxDot(c, (1.5 + 0.9 * hash(sd, 7)) * k * (0.65 + 0.35 * poxAmt(sd)), poxAmt(sd)));
      }
    }
    out.push(...mitten(ar));
    if (pox > 0.01) {
      for (let i = 0; i < 3; i++) {
        const sd = (side === "L" ? 600 : 700) + i * 5.3;
        const c = add(add(m.c, mul(m.d, (hash(sd, 3) - 0.45) * m.len * 0.6)), mul(m.n, (hash(sd, 5) - 0.5) * m.wid * 0.55));
        out.push(...poxDot(c, (1.4 + 0.7 * hash(sd, 7)) * k * (0.65 + 0.35 * poxAmt(sd)), poxAmt(sd)));
      }
    }
    out.push(...hp.front);
    if (hp.over) out.push(...mitten(ar));
    return out;
  };

  // ---- the legs and feet ---------------------------------------------------------------------------------------------
  const absS = Math.abs(r.s);
  const footPts = (shoe: ShoeKind): P2[] => {
    const front: P2[] = [[-9.5, -11], [0, -13.5], [9.5, -11], [13, -4], [10.5, 1.5], [0, 2.5], [-10.5, 1.5], [-13, -4]];
    const side: P2[] = shoe === "boot" ? [[-10, -12], [2, -13.5], [15, -9.5], [25, -5], [27, 0.5], [13, 2.5], [-8, 2.5], [-12, -4]] : [[-9, -12], [3, -13], [15, -9], [27, -3], [28, 1], [13, 2.5], [-8, 2.5], [-12, -4]];
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
    const shoeShapes: CShape[] = [{ d: closedD(fp, 0.9), fill: shoeC }];
    if (L.shoe === "buckle") {
      // the buckle on the instep (a small light square)
      const bc = add(mix2(fp[1], fp[2], 0.35 + 0.25 * sst(0, 0.55, absS)), rot([0, 3.2 * k], G * l.lift));
      shoeShapes.push({ d: closedD(ellPts(bc, 3.4 * k * mix(1, 0.75, absS), 2.4 * k, G * l.lift * 0.5, 8), 0.35), fill: mixC(ink.buckle, SHADE_TO, dark), sh: 0.3 });
    }
    if (L.lower === "trousers") {
      out.push(...shoeShapes);
      out.push({ d: tubeD(legPts, trouW.map((w) => w * k)), fill: mixC(ink.lower, SHADE_TO, dark) });
      out.push({ d: lineD([mix2(l.H, l.K, 0.35), l.K, mix2(l.K, ank, 0.8)]), fill: mixC(ink.lower, SHADE_TO, dark + 0.1), det: 1.4, op: 0.35 });
    } else {
      // stockings (under a skirt, or below the breeches' knee band), then the shoe over the foot
      out.push({ d: tubeD(legPts, [31, 28, 22, 23, 18, 15].map((w) => w * k)), fill: mixC(ink.stocking, SHADE_TO, dark) });
      out.push(...shoeShapes);
      if (L.lower === "breeches") {
        const kneeB = mix2(l.K, ank, 0.12);
        out.push({ d: tubeD([add(l.H, [0, -6]), mix2(l.H, l.K, 0.5), l.K, kneeB], [33, 30, 23.5, 22.5].map((w) => w * k)), fill: mixC(ink.lower, SHADE_TO, dark) });
        out.push({ d: tubeD([mix2(l.K, ank, 0.08), mix2(l.K, ank, 0.14)], [23 * k, 22.5 * k]), fill: mixC(ink.lower, SHADE_TO, dark + 0.12), sh: 0 });
      }
    }
    if (L.shoe === "boot") {
      const u = norm(sub(ank, l.K));
      out.push({ d: tubeD([add(ank, mul(u, -15 * k)), add(ank, mul(u, 3 * k))], [21 * k, 22 * k]), fill: shoeC, sh: 0.6 });
    }
    return out;
  };
  const legsSorted = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);

  // ---- the seat of the breeches / trousers ----------------------------------------------------------------------------
  const seatShapes: CShape[] = [];
  if (L.lower !== "skirt") {
    const pts: P2[] = [r.toFig([B.edge(-6)[0] + 2, -6]), r.toFig([B.edge(-6)[1] - 2, -6])];
    for (const l of [r.legL, r.legR]) for (const fr of [0, 0.12, 0.25, 0.36]) pts.push(...circ(legPtOf(l, fr), (trouW[0] / 2) * k * mix(1, 0.92, fr / 0.36), 12));
    seatShapes.push({ d: closedD(resampleClosed(hull(pts), 80, pts[0], 2), 0.8), fill: ink.lower });
  }

  // ---- what hangs from the waist: the skirt (and its apron), the smock / frock coat over the legs, the tails behind
  const hangShapes: CShape[] = [];
  const tailsBack: CShape[] = [];
  const tailsFront: CShape[] = [];
  let hemPts: P2[] = [];
  const backView = sst(-0.02, -0.22, B.cY);
  if (L.lower === "skirt") {
    const sk = hangHull(r, B, k, -14, L.skirtLen, L.child ? 10 : 15, hdx, 0.5, 1.02);
    const skD = closedD(sk, 0.8);
    hangShapes.push({ d: skD, fill: ink.lower });
    hemPts = sk;
    // two soft folds down the skirt
    const skX0 = Math.min(...sk.map((p) => p[0]));
    const skX1 = Math.max(...sk.map((p) => p[0]));
    const skY0 = Math.min(...sk.map((p) => p[1]));
    const skY1 = Math.max(...sk.map((p) => p[1]));
    for (let i = 0; i < 2; i++) {
      const t = (i + 0.7) / 2.4;
      const tp: P2 = [mix(skX0 + 12, skX1 - 12, mix(0.35, 0.7, t)), skY0 + 26];
      const bt: P2 = [mix(skX0 + 8, skX1 - 8, t) + hdx * 0.3, skY1 - 2];
      hangShapes.push({ d: tubeD([tp, mix2(tp, bt, 0.5), bt], [2.5, 6, 9]), fill: ink.lower, cast: true, op: 0.3, clip: skD });
    }
    if (L.apron) {
      // the apron: a front panel on the skirt (it narrows and slides to the front edge as she turns)
      const wv = frontW(torD([0, -12], 2));
      if (wv > 0.01) {
        const a0 = tor([-A * 0.6, -14], 2.5);
        const a1 = tor([A * 0.6, -14], 2.5);
        const len = L.skirtLen * 0.86;
        const legMid = add(mix2(legPtOf(r.legL, Math.min(2, len)), legPtOf(r.legR, Math.min(2, len)), 0.5), [hdx * 0.3 + G * absS * A * 0.75, 6]);
        const wb = A * 0.92 * Math.abs(B.cY) + 4;
        const ap = [a0, a1, add(legMid, [wb, 0]), add(legMid, [-wb, 0])];
        hangShapes.push({ d: closedD(ap, 0.35), fill: ink.apron, op: wv, clip: skD, sh: 0.7 });
      }
    }
  }
  if (L.top === "smock" || L.top === "frock" || L.top === "jacket") {
    const th = hangHull(r, B, k, -16, L.topLen, L.top === "smock" ? 8 : L.top === "frock" ? L.flare : 0, hdx, puff, L.top === "frock" ? 0.9 : 0.85);
    const thD = closedD(th, 0.8);
    hangShapes.push({ d: thD, fill: top });
    if (L.topLen > 0.3) hemPts = th;
    if (L.top === "frock") {
      // the frock coat's front edge and two soft folds
      const fe0 = tor([-1, -16], puff + 0.4);
      const legMid = mix2(legPtOf(r.legL, L.topLen), legPtOf(r.legR, L.topLen), 0.5);
      const fe1 = add(legMid, [hdx * 0.4 - 0.6 * B.cY, 4]);
      const w = frontW(torD([-1, -16], puff));
      if (w > 0.02) hangShapes.push({ d: lineD([fe0, mix2(fe0, fe1, 0.5), fe1]), fill: shadeOf(top, 0.22), det: 1.5, keep: true, op: 0.6 * w, clip: thD });
      const X0 = Math.min(...th.map((p) => p[0]));
      const X1 = Math.max(...th.map((p) => p[0]));
      const Y0 = Math.min(...th.map((p) => p[1]));
      const Y1 = Math.max(...th.map((p) => p[1]));
      for (let i = 0; i < 2; i++) {
        const t = (i + 0.7) / 2.4;
        const tp: P2 = [mix(X0 + 10, X1 - 10, mix(0.3, 0.75, t)), Y0 + 28];
        const bt: P2 = [mix(X0 + 6, X1 - 6, t) + hdx * 0.3, Y1 - 2];
        hangShapes.push({ d: tubeD([tp, mix2(tp, bt, 0.5), bt], [2.5, 6, 9]), fill: top, cast: true, op: 0.34, clip: thD });
      }
    }
    if (L.top === "smock") {
      const legMid = mix2(legPtOf(r.legL, L.topLen), legPtOf(r.legR, L.topLen), 0.5);
      for (const sx of [-0.35, 0.35]) {
        const a = tor([sx * A, -10], puff + 0.4);
        const b = add(legMid, [sx * A * 1.3 * B.cY + hdx * 0.3, 0]);
        hangShapes.push({ d: tubeD([a, mix2(a, b, 0.5), b], [2.4, 5, 7]), fill: top, cast: true, op: 0.3, clip: thD });
      }
    }
  }
  if (L.top === "tailcoat") {
    // the coat's skirts: hanging BEHIND the legs (they show at the sides and between the legs), pushed back in
    // profile, over the legs from behind (crossfade); a centre vent at the back
    const th0 = hangHull(r, B, k, -16, L.topLen, L.flare, hdx, puff + 1, 0.92);
    const th = th0.map((p): P2 => [p[0] - G * absS * 16 * sst(-16, 40, p[1]), p[1]]);
    const thD = closedD(th, 0.8);
    tailsBack.push({ d: thD, fill: shadeOf(top, 0.05) });
    // turning away, the skirts come over the legs as a WIPE from the back edge forward (no see-through crossfade)
    const wipe = sst(0.12, -0.3, B.cY);
    if (wipe > 0.001) {
      const xs = th.map((p) => p[0]);
      const ys = th.map((p) => p[1]);
      const X0 = Math.min(...xs) - 2;
      const X1 = Math.max(...xs) + 2;
      const Y0 = Math.min(...ys) - 2;
      const Y1 = Math.max(...ys) + 2;
      const cut = G > 0 ? mix(X0, X1, wipe) : mix(X1, X0, wipe);
      const rect: P2[] = G > 0 ? [[X0, Y0], [cut, Y0], [cut, Y1], [X0, Y1]] : [[cut, Y0], [X1, Y0], [X1, Y1], [cut, Y1]];
      const clipD = `M ${rect.map((p) => `${n2(p[0] * FU)} ${n2(p[1] * FU)}`).join(" L ")} Z`;
      tailsFront.push({ d: thD, fill: top, clip: clipD });
      const v0 = toFig([0, -6]);
      const legMid = mix2(legPtOf(r.legL, L.topLen), legPtOf(r.legR, L.topLen), 0.5);
      tailsFront.push({ d: lineD([v0, add(legMid, [hdx * 0.3, 6])]), fill: shadeOf(top, 0.3), det: 1.5, keep: true, op: 0.6 * backView, clip: thD });
    }
    hemPts = th;
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
  const btn = (p: P2, col: string, rr = 2.2) => reg(ellPts(p, rr, rr, 0, 8), col, 1.6, { sh: 0 }, 0.9);
  const hu = 6 * hunch;
  const neckTop = shY - 8 - hu;
  if (L.top === "tailcoat") {
    // the open coat: the waistcoat between its fronts from the stock to below the waist (a shallow point), its
    // buttons, the coat's small lapels along the opening, the turned-down collar behind the neck
    const ww = (y: number) => mix(hw * 0.3, A * 0.5, sst(shY, -10, y));
    reg([[-ww(neckTop + 4), neckTop + 2], [ww(neckTop + 4), neckTop + 2], [ww(shY + 30), shY + 30], [ww(-14), -14], [A * 0.42, 2], [0, 7], [-A * 0.42, 2], [-ww(-14), -14], [-ww(shY + 30), shY + 30]], ink.waist, 1.0, { sh: 0.5 }, 0.45);
    for (const by of [shY + 26, shY + 40, shY + 54, -36, -22]) btn([1.2, by], shadeOf(ink.waist, 0.3), 1.9);
    det([[-A * 0.36, -18], [-A * 0.12, -19]], shadeOf(ink.waist, 0.3), 1.2, 0.45);
    for (const sgn of [-1, 1]) {
      reg([[sgn * (ww(neckTop) + 0.5), neckTop - 1], [sgn * (ww(neckTop) + 9), shY - 1 - hu], [sgn * (ww(shY + 30) + 5), shY + 26], [sgn * (ww(shY + 40) + 0.5), shY + 44], [sgn * ww(shY + 36), shY + 34]], ink.top2, 1.7, { sh: 0.6 }, 0.4);
      // the coat's buttons down its edge (decorative, never fastened)
      for (const by of [shY + 54, -40, -26]) btn([sgn * (ww(by) + 4), by], shadeOf(top, 0.3), 2.1);
    }
  } else if (L.top === "frock") {
    // Pasteur's frock coat: buttoned at the waist, lapels, the dark waistcoat in the V, the white collar, a cravat
    const vb = shY + 40;
    reg([[-15, neckTop], [15, neckTop], [6, vb], [0, vb + 4], [-6, vb]], ink.waist, 0.8, { sh: 0.4 });
    reg([[-11, neckTop], [11, neckTop], [3.5, shY + 16], [-3.5, shY + 16]], ink.shirt, 1.0, { sh: 0.3 });
    for (const by of [shY + 26, shY + 34]) btn([0.8, by], shadeOf(ink.waist, 0.3), 1.5);
    for (const sgn of [-1, 1]) {
      reg([[sgn * 16, neckTop - 1], [sgn * 27, shY - 2 - hu], [sgn * 25, shY + 18], [sgn * 6, vb - 2], [sgn * 4, vb + 1]], ink.top2, 1.6, { sh: 0.7 }, 0.4);
    }
    for (const by of [vb + 8, -26]) btn([2, by], shadeOf(top, 0.35), 2.3);
    det([[1, vb + 4], [1, -16]], shadeOf(top, 0.25), 1.4, 0.55);
  } else if (L.top === "waistcoat") {
    // shirt sleeves and a waistcoat: the open shirt collar at the neck, the waistcoat's V, buttons, two pockets
    reg([[-12, neckTop + 1], [12, neckTop + 1], [5, shY + 16], [0, shY + 20], [-5, shY + 16]], ink.shirt, 0.8, { sh: 0.3 });
    reg([[-11, neckTop + 1], [-1, shY - 1 - hu], [-9, shY + 8 - hu * 0.5], [-16, shY + 2 - hu]], ink.shirt, 1.5, { sh: 0.6 }, 0.4);
    reg([[11, neckTop + 1], [1, shY - 1 - hu], [9, shY + 8 - hu * 0.5], [16, shY + 2 - hu]], ink.shirt, 1.5, { sh: 0.6 }, 0.4);
    for (const by of [shY + 28, shY + 42, -30, -18]) btn([1, by], shadeOf(top, 0.35), 1.8);
    det([[0, shY + 20], [0, -10]], shadeOf(top, 0.25), 1.2, 0.5);
    for (const sgn of [-1, 1]) det([[sgn * A * 0.3, -26], [sgn * A * 0.7, -27]], shadeOf(top, 0.3), 1.2, 0.45);
  } else if (L.top === "jacket") {
    reg([[-14, neckTop - 2], [14, neckTop - 2], [15, shY + 6 - hu * 0.5], [0, shY + 9], [-15, shY + 6 - hu * 0.5]], ink.top2, 1.6, { sh: 0.5 }, 0.5);
    reg([[-6, neckTop + 1], [6, neckTop + 1], [0, shY + 8]], ink.shirt, 1.8, { sh: 0.2 }, 0.5);
    for (const by of [shY + 22, shY + 36, shY + 50, -28]) btn([1, by], shadeOf(top, 0.35), 2.0);
    det([[0, shY + 9], [0, -16]], shadeOf(top, 0.25), 1.3, 0.5);
  } else if (L.top === "smock") {
    // the round collar, the smocking (a band of short gathers across the chest)
    reg([[-17, neckTop - 3], [17, neckTop - 3], [19, shY + 6 - hu * 0.5], [0, shY + 12], [-19, shY + 6 - hu * 0.5]], ink.top2, 1.8, { sh: 0.5 }, 0.55);
    const gath: string[] = [];
    for (let i = -5; i <= 5; i++) {
      const x = i * hw * 0.11;
      const a = tor([x, shY + 18], puff + 1.2);
      const b = tor([x, shY + 32], puff + 1.2);
      if (torD([x, shY + 25], puff) > 0.05) gath.push(lineD([a, b]));
    }
    if (gath.length) torsoShapes.push({ d: gath.join(" "), fill: shadeOf(top, 0.3), det: 1.2, keep: true, op: 0.55 * frontW(torD([0, shY + 25], puff)), clip: torsoD });
    det([[0, shY + 12], [0, shY + 34]], shadeOf(top, 0.3), 1.2, 0.4);
  } else if (L.top === "bodice") {
    // the bodice's waist seam and the fichu: a white kerchief round the neck crossed into the bodice
    reg([[-hw * 0.78, neckTop + 2], [hw * 0.78, neckTop + 2], [hw * 0.62, shY + 14], [0, shY + 40], [-hw * 0.62, shY + 14]], ink.shirt, 1.2, { sh: 0.55 }, 0.5);
    det([[-hw * 0.2, shY + 26], [0, shY + 40], [hw * 0.2, shY + 26]], shadeOf(ink.shirt, 0.25), 1.1, 0.4, 1.6);
    if (L.bib) reg([[-A * 0.42, shY + 34], [A * 0.42, shY + 34], [A * 0.48, -14], [-A * 0.48, -14]], ink.apron, 1.6, { sh: 0.5 }, 0.3);
    if (L.apron || L.bib) torsoShapes.push({ d: closedD(bandOn(-A * 1.04, A * 1.04, () => -18, () => -12, 1.2 + puff), 0.6), fill: ink.apron, sh: 0.3, op: 1 });
  }
  // the shawl / cape over the shoulders, crossed and knotted at the front (the cape longer, open)
  if (L.shawl === 1) {
    reg([[-hw * 1.0, neckTop - 2], [hw * 1.0, neckTop - 2], [hw * 1.02, shY + 20], [hw * 0.36, shY + 34], [0, shY + 54], [-hw * 0.36, shY + 34], [-hw * 1.02, shY + 20]], ink.shawl, 2.8, { sh: 0.65 }, 0.5);
    reg(ellPts([0, shY + 46], 5.5, 4.5, 0, 10), shadeOf(ink.shawl, 0.12), 3.4, { sh: 0.4 }, 0.9);
  } else if (L.shawl === 2) {
    reg([[-hw * 1.02, neckTop - 3], [hw * 1.02, neckTop - 3], [hw * 1.06, shY + 52], [hw * 0.3, shY + 58], [hw * 0.18, shY + 8], [-hw * 0.18, shY + 8], [-hw * 0.3, shY + 58], [-hw * 1.06, shY + 52]], ink.shawl, 3.0, { sh: 0.65 }, 0.45);
    reg([[-14, neckTop - 4], [14, neckTop - 4], [16, shY + 4], [-16, shY + 4]], shadeOf(ink.shawl, 0.1), 3.4, { sh: 0.4 }, 0.6);
  }
  // the turned-down coat collar standing round the back of the neck
  if (L.top === "tailcoat" || L.top === "frock") {
    const cR = tor([0, shY - 6 - 6 * hunch], puff + 2);
    const wv = hw * 0.5;
    const collar = { d: closedD([add(cR, [-wv, 8]), add(cR, [-wv * 0.85, -9]), add(cR, [0, -14]), add(cR, [wv * 0.85, -9]), add(cR, [wv, 8]), add(cR, [0, 6])], 0.8), fill: ink.top2 };
    torsoShapes.splice(1, 0, collar as CShape);
  }

  // ---- the head ---------------------------------------------------------------------------------------------------
  const headShapes: CShape[] = [];
  const headBehind: CShape[] = [];
  const hy = head.yaw;
  const earAt = (sgn: number) => hProj(head, sgn * 1.62, 0.0, 1.0);
  const hatCoversEars = L.hat === "mobcap" || L.hat === "bonnet" || L.hat === "wrap";
  const hairCoversEars = L.hair === "bob" || L.hair === "long" || hatCoversEars;
  if (!hairCoversEars)
    for (const sgn of [-1, 1]) {
      const e = earAt(sgn);
      headBehind.push({ d: ellD(e.p, 6.2 * fs, 8.4 * fs, head.roll), fill: skin, sh: 0.5 });
    }
  const hairC = ink.hair;
  const hairLit = mixC(hairC, "#F3EBDD", L.hair === "queue" && hairC === HAIR.powder ? 0.35 : 0.22);
  const backHair: CShape[] = [];
  const backHairFront: CShape[] = [];
  /** the queue / plait over the back of the head and the collar (seen from behind): drawn after the hair */
  const queueFront: CShape[] = [];
  const hairFrontW = sst(0.1, -0.35, Math.cos(hy));
  if (L.hair === "bun") {
    const bn = hProj(head, Math.PI, -0.18, 1.12);
    headBehind.push({ d: ellD(bn.p, 12 * fs, 11 * fs, head.roll), fill: hairC });
  }
  if (L.hair === "queue") {
    // the queue: a short tail at the nape tied with a dark ribbon bow (behind the body facing us, over the collar
    // from behind: a crossfade by the nape's depth)
    const p0 = hProj(head, Math.PI, -0.3, 1.03);
    const side = -Math.sin(hy);
    const p1 = add(p0.p, [side * 6 * fs, 16 * fs]);
    const p2 = add(p0.p, [side * 8 * fs, 32 * fs]);
    const qd = tubeD([p0.p, p1, p2], [10 * fs, 8.5 * fs, 5 * fs]);
    const bow: CShape[] = [
      { d: ellD(add(p0.p, [-5 * fs, 3 * fs]), 5 * fs, 3.2 * fs, head.roll - 25), fill: ink.ribbon, sh: 0.3 },
      { d: ellD(add(p0.p, [5 * fs, 3 * fs]), 5 * fs, 3.2 * fs, head.roll + 25), fill: ink.ribbon, sh: 0.3 },
      { d: ellD(add(p0.p, [0, 3.5 * fs]), 2.6 * fs, 3 * fs, head.roll), fill: mixC(ink.ribbon, "#F3EBDD", 0.12), sh: 0 },
    ];
    const wF = sst(-0.05, 0.3, p0.d);
    backHair.push({ d: qd, fill: hairC }, ...bow);
    if (wF > 0.001) queueFront.push({ d: qd, fill: hairC, op: wF }, ...bow.map((s) => ({ ...s, op: (s.op ?? 1) * wF })));
  }
  if (L.hair === "plait") {
    // a plait down the back: overlapping lobes and a small ribbon
    const p0 = hProj(head, Math.PI, -0.3, 1.02);
    const side = -Math.sin(hy);
    const lobes: CShape[] = [];
    for (let i = 0; i < 4; i++) {
      const c = add(p0.p, [side * (3 + 2 * i) * fs, (8 + i * 11) * fs]);
      lobes.push({ d: ellD(c, 6.2 * fs * (1 - 0.08 * i), 7 * fs, head.roll + (i % 2 ? 18 : -18)), fill: i % 2 ? hairC : mixC(hairC, "#F3EBDD", 0.1), sh: 0.5 });
    }
    const endC = add(p0.p, [side * 11 * fs, 50 * fs]);
    lobes.push({ d: ellD(endC, 4 * fs, 3 * fs, head.roll), fill: ink.ribbon, sh: 0.3 });
    backHair.push(...lobes);
    if (hairFrontW > 0.001) queueFront.push(...lobes.map((s) => ({ ...s, op: (s.op ?? 1) * hairFrontW })));
  }
  if (L.hair === "long") {
    const cY = Math.cos(hy);
    const sY = Math.sin(hy);
    const back = sub(head.C, [sY * HR * 0.35, 0]);
    const wTop = HR * (0.92 * Math.abs(cY) + 0.7 * Math.abs(sY));
    const yb = r.toFig([0, shY + 26])[1];
    const pts: P2[] = [add(back, [-wTop, -HR * 0.2]), add(back, [wTop, -HR * 0.2]), [back[0] + wTop * 1.05, yb - 6], [back[0] + wTop * 0.6, yb + 4], [back[0] - wTop * 0.6, yb + 4], [back[0] - wTop * 1.05, yb - 6]];
    const d = closedD(pts, 0.7);
    backHair.push({ d, fill: shadeOf(hairC, 0.06) });
    if (hairFrontW > 0.002) backHairFront.push({ d, fill: hairC, op: hairFrontW });
  }
  const headD = ellD(head.C, HR * 0.985, HR * 1.03, head.roll);
  headShapes.push({ d: headD, fill: skin });
  if (!hairCoversEars)
    for (const sgn of [-1, 1]) {
      const e = earAt(sgn);
      const w = sst(-0.08, 0.2, e.d);
      if (w > 0.002) headShapes.push({ d: ellD(e.p, 6.2 * fs, 8.4 * fs, head.roll), fill: skin, sh: 0.5, op: w });
    }
  // the face: eyes (look, lids, squeeze), blush, brows (neutral on the heroes, worried when acting), nose, mouth
  const eyes: P2[] = [];
  for (const sgn of [-1, 1]) {
    const e = hProj(head, sgn * 0.36 + look[0] * 0.11, 0.02 - 0.05 * lids - look[1] * 0.07);
    eyes.push(e.p);
    const v = sst(0.12, 0.38, e.d);
    if (v > 0.003) {
      const rx = 2.65 * fs * mix(0.55, 1, e.d);
      const ry = 3.25 * fs;
      const lid = sst(0.04, 1, lids) * (1 - lArc);
      const dotK = (1 - lArc) * (1 - sst(0.15, 0.55, squeeze));
      const pts = ellPts([0, 0], rx, ry, 0, 16).map((p): P2 => [p[0], Math.max(p[1], -ry + 2 * ry * 0.62 * lid)]);
      if (dotK > 0.001) headShapes.push({ d: closedD(pts.map((p) => add(e.p, rot(p, head.roll))), 0.9), fill: eyeC, sh: 0, op: v * dotK });
      if (lArc > 0.001) {
        const arc: P2[] = [];
        for (let i = -3; i <= 3; i++) arc.push(hProj(head, sgn * 0.36 + look[0] * 0.11 + i * 0.055, 0.0 + 0.055 * (1 - (i / 3) ** 2)).p);
        headShapes.push({ d: lineD(arc), fill: eyeC, det: 2.8, keep: true, op: v * lArc });
      }
      if (squeeze > 0.15) {
        // squeezed shut: a little chevron pointing to the nose
        const ch = [hProj(head, sgn * 0.47, 0.085), hProj(head, sgn * 0.29, 0.02), hProj(head, sgn * 0.47, -0.045)].map((x) => x.p);
        headShapes.push({ d: lineD(ch), fill: eyeC, det: 2.6, keep: true, op: v * sst(0.15, 0.55, squeeze) });
      }
      if (lid > 0.08 && squeeze < 0.5) {
        const yl = -ry + 2 * ry * 0.62 * lid - 0.6 * fs;
        headShapes.push({ d: lineD([add(e.p, rot([-rx * 1.45, yl + 0.8 * fs], head.roll)), add(e.p, rot([0, yl - 0.2 * fs], head.roll)), add(e.p, rot([rx * 1.45, yl + 0.8 * fs], head.roll))]), fill: mixC(skinSh, "#5A3A2E", 0.35), det: 1.7, keep: true, op: 0.7 * v * sst(0.08, 0.3, lid) * (1 - squeeze) });
      }
    }
    const b = hProj(head, sgn * 0.7, -0.3 + 0.08 * laugh);
    const vb = sst(0.15, 0.4, b.d);
    if (vb > 0.003) headShapes.push({ d: ellD(b.p, 4.8 * fs * mix(0.6, 1, b.d) * (1 + 0.55 * sickA + 0.18 * laugh), 3 * fs * (1 + 0.45 * sickA + 0.15 * laugh), head.roll), fill: blush, sh: 0, op: (0.5 + 0.3 * sickA + 0.12 * laugh) * vb * blushK });
    // brows: neutral (level, a soft arch) on the heroes; worry lifts the inner ends (never a frown); a squeeze pulls
    // them down a little toward the eyes
    const wB = sst(0.06, 0.3, worry);
    const browOn = L.brows ? 1 : Math.max(wB, sst(0.1, 0.4, squeeze));
    if (browOn > 0.003) {
      const inner = hProj(head, sgn * 0.2, mix(0.255, 0.27 + 0.09 * worry, wB) - 0.05 * squeeze);
      const mid = hProj(head, sgn * 0.38, mix(0.29, 0.29 + 0.03 * worry, wB) - 0.04 * squeeze);
      const outer = hProj(head, sgn * 0.56, mix(0.255, 0.26 - 0.03 * worry, wB) - 0.02 * squeeze);
      const vv = sst(0.15, 0.4, Math.min(inner.d, outer.d)) * browOn;
      const bc = L.brows ? ink.brow : mixC(hairC, "#2A201A", 0.2);
      if (vv > 0.003) headShapes.push({ d: lineD([inner.p, mid.p, outer.p]), fill: bc, det: L.brows ? 2.3 : 2.5, keep: true, op: 0.85 * vv });
    }
  }
  // smallpox on the face and the neck: a stable seeded scatter (never on the eyes), each dome at its own threshold
  const facePox: CShape[] = [];
  if (pox > 0.01) {
    for (let i = 0; i < 26; i++) {
      const sd = 100 + i * 3.7;
      const beta = (hash(sd, 1) * 2 - 1) * 1.25;
      const phi = mix(-0.66, 0.6, hash(sd, 2));
      if (Math.abs(Math.abs(beta) - 0.36) < 0.15 && Math.abs(phi) < 0.11) continue;
      if (Math.abs(beta) < 0.17 && phi < -0.1 && phi > -0.5) continue;
      if (L.hat !== "none" && phi > 0.32) continue;
      const pp = hProj(head, beta, phi, 1.0);
      const vis = sst(0.08, 0.32, pp.d);
      const a = poxAmt(sd) * vis;
      if (a < 0.01) continue;
      const rr = (1.5 + 0.8 * hash(sd, 4)) * fs * (0.65 + 0.35 * poxAmt(sd));
      facePox.push(...poxDot(pp.p, rr, a).map((s, j) => (j === 0 ? { ...s, d: ellD(pp.p, rr * mix(0.6, 1, pp.d), rr * 0.92, head.roll) } : s)));
    }
  }
  // hair (a region on the sphere above the hairline) with a lit side
  const hairH = (beta: number) => {
    const u = (1 - Math.cos(beta)) / 2;
    const temple = 0.14 * Math.sin(Math.PI * u) ** 2;
    const ab = Math.abs(beta);
    switch (L.hair) {
      case "queue":
        return mix(0.64, -0.26, ease(u)) + temple * 0.6;
      case "curly":
        return mix(0.5, -0.2, ease(u)) + temple;
      case "tousled":
        return mix(0.5, -0.22, ease(u)) + temple;
      case "receding":
        return mix(0.95, -0.18, ease(u)) + 0.05 * Math.sin(Math.PI * u);
      case "bob":
        return mix(0.42, -0.62, sst(0.95, 1.4, ab)) - 0.22 * sst(1.6, 2.6, ab);
      case "long":
        return mix(0.42, -0.6, sst(0.95, 1.4, ab)) - 0.6 * sst(1.6, 2.6, ab);
      case "bun":
      case "plait":
        return mix(0.42, -0.3, ease(u)) + temple;
      default:
        return mix(0.55, -0.2, ease(u)) + temple;
    }
  };
  const hairVol = L.hair === "bob" || L.hair === "long" ? 1.09 : L.hair === "curly" ? 1.06 : L.hair === "queue" ? 1.07 : 1.045;
  const subs: P2[][] = [];
  if (L.hair === "receding") {
    const lower = (b: number) => mix(-0.02, -0.82, ease((Math.abs(b) - 1.12) / (Math.PI - 1.12)));
    const upper = (b: number) => lower(b) + mix(0.02, 1.3, sst(1.12, 2.6, Math.abs(b)) ** 0.8);
    for (const side of [-1, 1]) {
      const pp = regionPoly(head, (b, p) => side * Math.sin(b) > -0.16 && Math.abs(b) > 1.12 && p > lower(b) && p < upper(b), "top", 1.04);
      if (pp.length > 2) subs.push(cw(pp.map((u) => hToFig(head, u))));
    }
  } else {
    const hairPoly = regionPoly(head, (b, p) => p > hairH(b), "top", hairVol);
    if (hairPoly.length > 2) subs.push(cw(hairPoly.map((u) => hToFig(head, u))));
  }
  if (L.hair === "curly" || L.hair === "tousled") {
    const curls: [number, number, number][] = [];
    if (L.hair === "curly") {
      for (let i = -6; i <= 6; i++) {
        const beta = (i / 6) * 2.6;
        curls.push([beta, hairH(beta) + 0.02, 0.15]);
      }
      for (let i = 0; i < 9; i++) curls.push([-2.4 + i * 0.6, 0.95, 0.17]);
    } else {
      // a few tufts along the fringe and the crown (a boy's untidy hair)
      for (const [beta, dp, rad] of [[-0.55, 0.02, 0.17], [-0.15, 0.0, 0.15], [0.3, 0.02, 0.16], [0.75, 0.04, 0.14], [1.3, 0.05, 0.14], [-1.2, 0.05, 0.14]] as [number, number, number][]) curls.push([beta, hairH(beta) + dp, rad]);
      curls.push([-0.2, 1.25, 0.2], [0.5, 1.2, 0.18]);
    }
    for (const [beta, phi, rad] of curls) {
      const c = hProj(head, beta, phi, 1.02);
      if (c.d < -0.25) continue;
      subs.push(cw(ellPts(c.p, rad * HR, rad * HR * 0.92, head.roll, 10)));
    }
  }
  if (L.rolls) {
    // the side rolls over the ears (an 18th-c. gentleman's dressed hair)
    for (const sgn of [-1, 1]) {
      for (const [ph, rr] of [[0.14, 0.2], [-0.12, 0.19]] as [number, number][]) {
        const c = hProj(head, sgn * 1.42, ph, 1.08);
        if (c.d < -0.35) continue;
        subs.push(cw(ellPts(c.p, rr * HR * mix(0.75, 1.1, Math.abs(c.d)), rr * HR * 0.62, head.roll, 12)));
      }
    }
  }
  const hairD = subs.map((sp2) => closedD(sp2, 0.9)).join(" ");
  const hairShapes: CShape[] = [];
  if (hairD) {
    hairShapes.push({ d: hairD, fill: hairC });
    // the lit side: a lighter tone of the hair toward the upper-left light (no flat dark mass)
    hairShapes.push({ d: ellD(hToFig(head, [-0.45, -0.66]), HR * 0.72, HR * 0.55, head.roll - 20), fill: hairLit, sh: 0, op: 0.8, blur: 5, clip: hairD });
    if (L.hair === "queue") {
      // combed back: a few soft lines from the brow to the crown
      const ls: string[] = [];
      for (const b0 of [-0.5, -0.15, 0.2, 0.55]) {
        const pp: P2[] = [];
        for (let i = 0; i <= 6; i++) {
          const v = hProj(head, b0 * (1 - 0.3 * (i / 6)), hairH(b0) + 0.08 + 0.75 * (i / 6), hairVol);
          if (v.d > 0.08) pp.push(v.p);
        }
        if (pp.length > 1) ls.push(lineD(pp));
      }
      if (ls.length) hairShapes.push({ d: ls.join(" "), fill: shadeOf(hairC, 0.2), det: 1.2, keep: true, op: 0.45, clip: hairD });
    }
  }
  // the beard: stubble (a faint tint) or Pasteur's short beard (a LIGHTER textured shape, never a dark blob)
  const beardShapes: CShape[] = [];
  const mustShapes: CShape[] = [];
  if (L.beard === "stubble") {
    const g = (beta: number) => {
      const a = Math.abs(beta);
      if (a <= 1.45) return mix(-0.52, -0.34, ease(a / 1.45));
      return mix(-0.34, -1.45, ease(Math.min(1, (a - 1.45) / 0.5)));
    };
    const bp = regionPoly(head, (b, p) => p < g(b), "bottom", 1.03);
    if (bp.length > 2) beardShapes.push({ d: closedD(cw(bp.map((u) => hToFig(head, u))), 0.9), fill: mixC(skin, hairC, 0.3), sh: 0, op: 0.2, clip: headD });
  } else if (L.beard === "short") {
    const g = (beta: number) => {
      const a = Math.abs(beta);
      if (a <= 1.2) return mix(-0.5, -0.32, ease(a / 1.2));
      if (a <= 1.55) return mix(-0.32, 0.0, ease((a - 1.2) / 0.35));
      return mix(0.0, -1.4, ease(Math.min(1, (a - 1.55) / 0.4)));
    };
    const bp = regionPoly(head, (b, p) => p < g(b), "bottom", 1.045);
    if (bp.length > 2) {
      const bd = closedD(cw(bp.map((u) => hToFig(head, u))), 0.85);
      beardShapes.push({ d: bd, fill: ink.beard, sh: 0.45 });
      beardShapes.push({ d: ellD(hToFig(head, [-0.4, 0.55]), HR * 0.55, HR * 0.4, head.roll), fill: mixC(ink.beard, "#F3EBDD", 0.28), sh: 0, op: 0.75, blur: 4, clip: bd });
      // texture: short soft strokes down the beard
      const st: string[] = [];
      for (let i = 0; i < 14; i++) {
        const sd = 900 + i * 2.3;
        const b0 = (hash(sd, 1) * 2 - 1) * 1.25;
        const p0 = g(b0) - 0.06 - 0.3 * hash(sd, 2);
        const a = hProj(head, b0, p0, 1.11);
        const b = hProj(head, b0 * 0.97, p0 - 0.09, 1.11);
        if (Math.min(a.d, b.d) > 0.12) st.push(lineD([a.p, b.p]));
      }
      if (st.length) beardShapes.push({ d: st.join(" "), fill: mixC(ink.beard, "#3E342C", 0.35), det: 1.2, keep: true, op: 0.4, clip: bd });
    }
    // the moustache: two soft lobes over the upper lip
    const top: { p: P2; d: number }[] = [];
    const bot: { p: P2; d: number }[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = -1 + (2 * i) / 8;
      top.push(hProj(head, u * 0.27, -0.26 + 0.03 * Math.abs(u), 1.06));
      bot.push(hProj(head, u * 0.31, -0.35 - 0.015 * (1 - u * u) + 0.05 * Math.abs(u) ** 3, 1.06));
    }
    const vis = sst(0.0, 0.25, hProj(head, 0, -0.3, 1).d);
    if (vis > 0.01) {
      const md = closedD([...top.map((v) => v.p), ...bot.reverse().map((v) => v.p)], 0.55);
      mustShapes.push({ d: md, fill: mixC(ink.beard, "#F3EBDD", 0.12), sh: 0.5, op: vis });
      mustShapes.push({ d: lineD([hProj(head, 0, -0.26, 1.08).p, hProj(head, 0, -0.33, 1.08).p]), fill: mixC(ink.beard, "#3E342C", 0.3), det: 1.1, keep: true, op: 0.45 * vis });
    }
  }
  const nz = hProj(head, 0, -0.16, 1.05);
  const nv = sst(-0.1, 0.25, nz.d);
  const noseShapes: CShape[] = nv > 0.003 ? [{ d: ellD(nz.p, fs * (3.4 + 1.2 * Math.abs(Math.sin(hy))), 3.9 * fs, head.roll), fill: skinSh, sh: 0, op: nv }] : [];
  const mouthShapes: CShape[] = [];
  const mo = hProj(head, 0, -0.42, 1.0);
  const mv = sst(0.2, 0.45, mo.d);
  const lm = sst(0.04, 0.3, laugh);
  if (laugh > 0.04 && mv > 0.003) {
    const l = sst(0.04, 1, laugh);
    const w = 0.2 + 0.1 * l;
    const tp: P2[] = [];
    const bt: P2[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = -1 + (2 * i) / 8;
      tp.push(hProj(head, u * w, -0.33 - 0.035 * (1 - u * u)).p);
      bt.push(hProj(head, u * w * 0.94, -0.33 - (0.05 + 0.19 * l) * Math.sqrt(Math.max(0, 1 - u * u)) - 0.02).p);
    }
    const md = closedD([...tp, ...bt.reverse()], 0.6);
    mouthShapes.push({ d: md, fill: "#4A2A24", sh: 0, op: mv * lm });
    const tg = hProj(head, 0.02, -0.33 - 0.17 * l, 1.0);
    mouthShapes.push({ d: ellD(tg.p, w * HR * 0.48, 0.07 * l * HR + 0.5, head.roll), fill: "#C2675F", sh: 0, op: mv * lm * sst(0.2, 0.6, l), clip: md });
  }
  if (open > 0.04 && mv > 0.003 && lm < 0.999) {
    const amt = sst(0.04, 1, open);
    mouthShapes.push({ d: ellD(mo.p, (1.6 + 1.6 * amt) * fs * mix(0.6, 1, mo.d), (1.2 + 3.4 * amt) * fs, head.roll), fill: "#4A2A24", sh: 0, op: mv * (1 - lm) });
  } else if (open <= 0.04 && squeeze > 0.2 && mv > 0.003) {
    // a tight little wince line
    const a = hProj(head, -0.15, -0.4);
    const b = hProj(head, 0.15, -0.4);
    mouthShapes.push({ d: lineD([a.p, add(mo.p, rot([0, -0.6], head.roll)), b.p]), fill: "#7A4A3E", det: 1.8, keep: true, op: 0.8 * mv * sst(0.2, 0.5, squeeze) });
  } else if (open <= 0.04 && q.mouth >= 0.15 && mv > 0.003 && lm < 0.999) {
    const a = hProj(head, -0.2, -0.38);
    const b = hProj(head, 0.2, -0.38);
    mouthShapes.push({ d: qD(a.p, add(mo.p, rot([0, 2.4], head.roll)), b.p), fill: "#7A4A3E", det: 1.8, keep: true, op: 0.8 * mv * sst(0.15, 0.25, q.mouth) * (1 - lm) });
  }
  const sweatShapes: CShape[] = [];
  if (sickA > 0.35) {
    const tp = hProj(head, 0.92, 0.28, 1.0);
    const sv = sst(0.35, 0.8, sickA) * sst(0.0, 0.3, tp.d);
    if (sv > 0.01) {
      const c = add(tp.p, rot([0, 2], head.roll));
      sweatShapes.push({ d: closedD([add(c, [0, -5.5 * fs]), add(c, [2.6 * fs, 0.5 * fs]), add(c, [0, 3 * fs]), add(c, [-2.6 * fs, 0.5 * fs])], 0.9), fill: "#DCE6E2", sh: 0, op: 0.9 * sv });
    }
  }
  // the hats
  const hatShapes: CShape[] = [];
  let headTopY = -1.07;
  if (L.hat === "mobcap" || L.hat === "wrap") {
    // a puffy cap over the crown and the back of the head; the mob cap with a frilled band round the face and a
    // ribbon; the head-wrap with a fold and a knot at the back
    const mob = L.hat === "mobcap";
    const brimPhi = (b: number) => mix(mob ? 0.4 : 0.42, mob ? -0.5 : -0.2, ease((1 - Math.cos(b)) / 2));
    const regB = regionPoly(head, (b, p) => p > brimPhi(b), "top", mob ? 1.13 : 1.1);
    const tilt = -10 * Math.sin(hy);
    const dome: P2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * Math.PI;
      dome.push([-Math.cos(t) * (mob ? 1.02 : 0.96), -0.3 - Math.sin(t) * (mob ? 0.92 : 0.84) * (1 - 0.1 * Math.cos(t))]);
    }
    const domeF = dome.map((u) => add(head.C, rot(rot([u[0] * HR, u[1] * HR], tilt), head.roll)));
    const hsubs = [cw(domeF)];
    if (regB.length > 2) hsubs.push(cw(regB.map((u) => hToFig(head, u))));
    const hatD = hsubs.map((s2) => closedD(s2, 0.9)).join(" ");
    hatShapes.push({ d: hatD, fill: ink.hat });
    hatShapes.push({ d: ellD(hToFig(head, [-0.4, -0.85]), HR * 0.7, HR * 0.45, head.roll - 15), fill: mixC(ink.hat, "#FBF8F1", 0.4), sh: 0, op: 0.6, blur: 5, clip: hatD });
    if (mob) {
      // the frill: a scalloped band in front of the brim
      const fr: P2[][] = [];
      const band = regionPoly(head, (b, p) => p > brimPhi(b) - 0.05 && p < brimPhi(b) + 0.15 && Math.abs(b) < 1.9, "top", 1.16);
      if (band.length > 2) fr.push(cw(band.map((u) => hToFig(head, u))));
      for (let i = -9; i <= 9; i++) {
        const b0 = i * 0.2;
        const c = hProj(head, b0, brimPhi(b0) - 0.03, 1.16);
        if (c.d < 0.0) continue;
        fr.push(cw(ellPts(c.p, 0.085 * HR, 0.075 * HR, head.roll, 8)));
      }
      if (fr.length) hatShapes.push({ d: fr.map((s2) => closedD(s2, 0.9)).join(" "), fill: mixC(ink.hat, "#FBF8F1", 0.25), sh: 0.5 });
      const rib = regionPoly(head, (b, p) => p > brimPhi(b) + 0.2 && p < brimPhi(b) + 0.29, "top", 1.15);
      if (rib.length > 2) hatShapes.push({ d: closedD(cw(rib.map((u) => hToFig(head, u))), 0.9), fill: ink.hat2, sh: 0.4 });
      headTopY = -1.3;
    } else {
      const fold = regionPoly(head, (b, p) => p > brimPhi(b) && p < brimPhi(b) + 0.2, "top", 1.12);
      if (fold.length > 2) hatShapes.push({ d: closedD(cw(fold.map((u) => hToFig(head, u))), 0.9), fill: ink.hat2, sh: 0.5 });
      const kn = hProj(head, -2.3, 0.5, 1.15);
      const wk = sst(-0.2, 0.2, kn.d);
      if (wk > 0.01) hatShapes.push({ d: ellD(kn.p, 0.2 * HR, 0.15 * HR, head.roll + 30), fill: ink.hat2, sh: 0.5, op: wk });
      headTopY = -1.2;
    }
  } else if (L.hat === "bonnet") {
    // a poke bonnet: the crown behind the head, the brim framing the face, ribbons tied under the chin
    const inFace = (b: number, p: number, s: number) => Math.abs(b) < 1.45 * s && (b / (1.02 * s)) ** 2 + ((p + 0.14) / (0.66 * s)) ** 2 < 1;
    const hv = add(head.C, rot([Math.sin(hy) * -0.32 * HR, -0.12 * HR], head.roll));
    headBehind.push({ d: ellD(hv, HR * 1.12, HR * 1.1, head.roll), fill: shadeOf(ink.hat, 0.06) });
    const regH = regionPoly(head, (b, p) => !inFace(b, p, 1) && p > -0.4, "top", 1.14);
    if (regH.length > 2) hatShapes.push({ d: closedD(cw(regH.map((u) => hToFig(head, u))), 0.9), fill: ink.hat });
    const rim: P2[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = -Math.PI / 2 - 0.35 + (i / 40) * (Math.PI + 0.7);
      // the opening's edge from below one cheek over the brow to below the other (the bonnet ends at the jaw)
      const bb = Math.cos(t + Math.PI / 2) * 1.08 * -1;
      const pp = -0.14 + Math.sin(t + Math.PI / 2) * 0.7;
      const v = hProj(head, bb, Math.max(-0.42, pp), 1.17);
      if (v.d > 0.08) rim.push(v.p);
    }
    if (rim.length > 2) hatShapes.push({ d: tubeD(rim, rim.map((_, i) => HR * (0.13 + 0.05 * Math.sin((Math.PI * i) / (rim.length - 1))))), fill: mixC(ink.hat, "#FBF8F1", 0.14), sh: 0.6 });
    // a ribbon bow under the chin, its two short ends hanging (never across the face)
    const chin = hProj(head, 0, -1.0, 1.02);
    const cv = sst(-0.25, 0.1, chin.d);
    if (cv > 0.01) {
      const c = add(chin.p, rot([0, 1.5 * fs], head.roll));
      hatShapes.push({ d: tubeD([c, add(c, [-3.5 * fs, 13 * fs])], [3.6 * fs, 3 * fs]), fill: shadeOf(ink.hat2, 0.08), sh: 0.3, op: cv });
      hatShapes.push({ d: tubeD([c, add(c, [4 * fs, 12 * fs])], [3.6 * fs, 3 * fs]), fill: ink.hat2, sh: 0.3, op: cv });
      hatShapes.push({ d: ellD(add(c, [-4.5 * fs, -0.5 * fs]), 4.6 * fs, 2.8 * fs, head.roll - 20), fill: ink.hat2, sh: 0.3, op: cv });
      hatShapes.push({ d: ellD(add(c, [4.5 * fs, -0.5 * fs]), 4.6 * fs, 2.8 * fs, head.roll + 20), fill: ink.hat2, sh: 0.3, op: cv });
      hatShapes.push({ d: ellD(c, 2.4 * fs, 2.4 * fs), fill: mixC(ink.hat2, "#F3EBDD", 0.12), sh: 0, op: cv });
    }
    headTopY = -1.3;
  } else if (L.hat === "tricorne") {
    // a felt tricorne: the brim cocked up into three walls meeting at three corners (one at the front), built on the
    // head sphere: the walls behind the crown first (their inner faces, darker), the crown, then the walls in front
    const N = 30;
    const cornerOf = (b0: number) => Math.max(0, Math.cos(1.5 * (b0 - hy * 0) * 2)) ** 4;
    const bot: { p: P2; d: number }[] = [];
    const topR: { p: P2; d: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const b0 = (i / N) * 2 * Math.PI;
      const cn = cornerOf(b0);
      bot.push(hProj(head, b0, 0.4, 1.05));
      const frontC = Math.max(0, Math.cos(b0)) ** 6;
      topR.push(hProj(head, b0, mix(0.8, mix(0.64, 0.44, frontC), cn), mix(1.08, 1.5, cn)));
    }
    const crown: P2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * Math.PI;
      crown.push([-Math.cos(t) * 0.84, -0.5 - Math.sin(t) * 0.62]);
    }
    const tilt = -6 * Math.sin(hy);
    const crownD = closedD(crown.map((u) => add(head.C, rot(rot([u[0] * HR, u[1] * HR], tilt), head.roll))), 0.9);
    const walls: { d: string; z: number; front: boolean }[] = [];
    for (let i = 0; i < N; i++) {
      const z = (bot[i].d + bot[i + 1].d) / 2;
      const quad = [bot[i].p, bot[i + 1].p, topR[i + 1].p, topR[i].p];
      // widen each quad a touch so neighbours overlap (no seams)
      const c = [(quad[0][0] + quad[2][0]) / 2, (quad[0][1] + quad[2][1]) / 2] as P2;
      walls.push({ d: closedD(quad.map((p) => add(c, mul(sub(p, c), 1.08))), 0.05), z, front: z > 0 });
    }
    walls.sort((a2, b2) => a2.z - b2.z);
    const inner = mixC(ink.hat, SHADE_TO, 0.22);
    for (const w of walls) if (!w.front) hatShapes.push({ d: w.d, fill: inner, sh: 0 });
    hatShapes.push({ d: crownD, fill: ink.hat, sh: 0.6 });
    for (const w of walls) if (w.front) hatShapes.push({ d: w.d, fill: mixC(ink.hat, "#F3EBDD", 0.04 + 0.08 * Math.max(0, w.z)), sh: 0 });
    // the braid along the front walls' top edge
    const edge = topR.filter((v) => v.d > 0.02).map((v) => v.p);
    if (edge.length > 2) hatShapes.push({ d: lineD(edge), fill: mixC(ink.hat, "#F3EBDD", 0.3), det: 1.4, keep: true, op: 0.55 });
    headTopY = -1.5;
  }
  const headTop = add(head.C, rot([0, headTopY * HR], head.roll));
  // the stock / cravat / collar at the neck (over the neck, under the chin)
  const neckWear: CShape[] = [];
  const nb = toFig([0, shY + 2]);
  const nt = mix2(toFig([0, shY]), head.C, 0.38);
  if (L.neck === "stock") {
    neckWear.push({ d: tubeD([nb, nt], [27 * k, 23 * k]), fill: ink.shirt, sh: 0.4 });
    // the jabot: a soft frill falling at the throat
    const jw = frontW(torD([0, shY + 6], puff));
    if (jw > 0.01) {
      const j0 = tor([0, shY + 2], puff + 2.5);
      neckWear.push({ d: closedD([add(j0, [-6, -2]), add(j0, [6, -2]), add(j0, [7.5, 13]), add(j0, [0, 17]), add(j0, [-7.5, 13])], 0.7), fill: ink.shirt, sh: 0.6, op: jw });
      neckWear.push({ d: lineD([add(j0, [-3, 3]), add(j0, [-2, 13])]), fill: shadeOf(ink.shirt, 0.25), det: 1.1, keep: true, op: 0.4 * jw });
    }
  } else if (L.neck === "cravat") {
    neckWear.push({ d: tubeD([nb, mix2(nb, nt, 0.7)], [26 * k, 23 * k]), fill: ink.shirt, sh: 0.3 });
    const jw = frontW(torD([0, shY + 4], puff));
    if (jw > 0.01) {
      const c0 = tor([0, shY + 1], puff + 3);
      neckWear.push({ d: closedD([add(c0, [-11, -5]), add(c0, [-1, -1]), add(c0, [-11, 5])], 0.5), fill: ink.cravat, sh: 0.4, op: jw });
      neckWear.push({ d: closedD([add(c0, [11, -5]), add(c0, [1, -1]), add(c0, [11, 5])], 0.5), fill: ink.cravat, sh: 0.4, op: jw });
      neckWear.push({ d: ellD(c0, 3.4, 3.8), fill: mixC(ink.cravat, "#F3EBDD", 0.08), sh: 0.3, op: jw });
    }
  }
  if (pox > 0.01) {
    for (let i = 0; i < 3; i++) {
      const sd = 300 + i * 4.1;
      const c = mix2(nb, nt, 0.3 + 0.4 * hash(sd, 1));
      const fw = frontW(torD([0, shY], puff));
      if (L.neck !== "open" && L.neck !== "collar") continue;
      neckWear.push(...poxDot(add(c, [(hash(sd, 2) - 0.5) * 12 * k, 0]), 1.6 * k, poxAmt(sd) * fw));
    }
  }

  // ---- ASSEMBLY ---------------------------------------------------------------------------------------------------
  const arms = [r.armL, r.armR];
  const frontWArm = (ar: ArmRig) => sst(-0.35, -0.22, ar.z);
  const out: CShape[] = [];
  out.push(...backHair);
  for (const ar of arms) if (frontWArm(ar) < 0.999) out.push(...armShapes(ar));
  out.push(...tailsBack);
  out.push(...legShapes(legsSorted[0]));
  out.push(...seatShapes);
  out.push(...legShapes(legsSorted[1]));
  out.push(...tailsFront);
  out.push({ d: tubeD([toFig([0, shY + 4]), mix2(toFig([0, shY]), head.C, 0.6)], [24 * k, 20 * k]), fill: skinSh, sh: 0 });
  out.push(torsoShapes[0]);
  out.push(...hangShapes);
  out.push(...torsoShapes.slice(1));
  out.push(...neckWear);
  out.push(...backHairFront);
  out.push(...headBehind);
  out.push(...headShapes);
  out.push(...facePox);
  out.push(...beardShapes);
  out.push(...noseShapes);
  out.push(...mouthShapes);
  out.push(...mustShapes);
  out.push(...hairShapes);
  out.push(...queueFront);
  out.push(...sweatShapes);
  out.push(...hatShapes);
  // a released prop stays where it was set down (drawn before the arms: the hand lifts off in front of it)
  if (placed && placed.prop !== "none") {
    if (placed.prop === "flask") out.push(...flaskShapes(placed.key, o.flaskFill ?? 0, o.flaskFillC ?? ACC));
    else if (placed.prop === "book") out.push(...bookShapes(placed.key, placed.turn ?? 1, 0, ink.book));
    else if (placed.prop === "candle") out.push(...candleShapes(placed.key));
  }
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
  const ext = (dx: number) => hemPts.reduce((m, p) => (p[0] * dx + p[1] * 1.6 > m[0] * dx + m[1] * 1.6 ? p : m), hemPts[0] ?? r.hip);
  const dL = drawnArm(r.armL);
  const dR = drawnArm(r.armR);
  const mL = mittenGeom(dL);
  const mR = mittenGeom(dR);
  const anchors: VaccineAnchors = {
    headC: head.C,
    headR: HR,
    headTop,
    mouth: mo.p,
    eyes: [eyes[0], eyes[1]],
    chest: r.toFig([Math.sin(q.yaw) * 6, shY + 36]),
    shoulderL: r.armL.S,
    shoulderR: r.armR.S,
    elbowL: dL.E,
    elbowR: dR.E,
    wristL: r.armL.W,
    wristR: r.armR.W,
    handL: r.armL.grip,
    handR: r.armR.grip,
    mittenL: mL.c,
    mittenR: mR.c,
    armSpotL: armSpotOf(dL),
    armSpotR: armSpotOf(dR),
    keyL: handPropOf(hold0.L, mL, k, propOpts).key,
    keyR: handPropOf(hold0.R, mR, k, propOpts).key,
    hip: r.hip,
    kneeL: r.legL.K,
    kneeR: r.legR.K,
    ankleL: r.legL.A,
    ankleR: r.legR.A,
    toeL: footTip(r.legL, "toe"),
    toeR: footTip(r.legR, "toe"),
    heelL: footTip(r.legL, "heel"),
    heelR: footTip(r.legR, "heel"),
    hemL: ext(-1),
    hemR: ext(1),
  };
  return { shapes: out, anchors, heightUnits: -headTop[1] };
};

/** the prop key points only (the lancet's tip etc.), figure-local, without building the shapes (the reach solve) */
export const vaccineKeys = (kind: VaccineKind, variant: number, q0: VPose, hold: { L: HandProp; R: HandProp }) => {
  const L = lookOf(kind, variant);
  const { q, r } = vaccineRig(kind, variant, q0);
  const sp = specFor(L, q0);
  const po = { bookTurn: q0.bookTurn ?? 0, book: "#000", leather: "#000", rest: 0 };
  const gL = drawnArmA(sp, q, r.armL);
  const gR = drawnArmA(sp, q, r.armR);
  return { L: handPropOf(hold.L, mittenGeomA(sp, q, gL), sp.limb, po).key, R: handPropOf(hold.R, mittenGeomA(sp, q, gR), sp.limb, po).key, gripL: r.armL.grip, gripR: r.armR.grip };
};
/** what each hand of a kind holds by default */
export const defaultHold = (kind: VaccineKind, variant = 0) => ({ ...lookOf(kind, variant).hold });

// ===================================================================================================================
// POSES (pure functions; dir 1 = facing screen right, -1 = left; written for a man, retargeted to every build)
// When he faces right his armL is the NEAR arm (his own right).
// ===================================================================================================================
const face = (q: VPose, dir: 1 | -1): VPose => (dir === 1 ? q : mirrorPose(q));
const frac = (v: number) => v - Math.floor(v);
const F_STAND: VPose = { ...STAND, armL: { w: [-55, -137], elbow: [-0.2, 1], fist: 0.3, hand: 0 }, armR: { w: [55, -137], elbow: [0.2, 1], fist: 0.3, hand: 0 } };
const R_STAND: VPose = { ...STAND, yaw: 0.62, headYaw: 0.66, armL: { w: [-30, -138], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, armR: { w: [42, -140], elbow: [0.1, 1], fist: 0.3, hand: 0 }, footL: [-6, 0], footR: [8, -2] };
const R_WALK: VPose = { ...STAND, yaw: 0.9, headYaw: 0.86, armL: { w: [-8, -139], elbow: [-0.6, 1], fist: 0.35, hand: 0 }, armR: { w: [16, -141], elbow: [-0.6, 1], fist: 0.35, hand: 0 } };
const R_SIT: VPose = { ...STAND, yaw: 0.95, headYaw: 0.86, sit: 1, seatH: SEAT.h, lean: 3, armL: { w: [36, -114], elbow: [-0.2, 1], fist: 0.2, hand: 26 }, armR: { w: [44, -116], elbow: [0.2, 1], fist: 0.2, hand: 26 } };
const lerpTo = (a: VPose, b: VPose, t: number) => lerpPose(a, b, ease(c01(t)));
const lerpArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({ w: mix2(a.w, b.w, t), elbow: mix2(a.elbow, b.elbow, t), fist: mix(a.fist, b.fist, t), hand: mix(a.hand, b.hand, t) });

/** breathing: a slow rise of the shoulders (~4.2 s) and a small sway, over any pose; frame = the cut's frame */
export const breathe = (q: VPose, frame: number, amount = 1, seed = 0): VPose => {
  const t = frame / 29.97;
  const b = Math.sin((t / 4.2) * 2 * Math.PI + seed * 1.7);
  return { ...q, crouch: q.crouch - 0.9 * amount * b, lean: q.lean + 0.35 * amount * Math.sin((t / 6.3) * 2 * Math.PI + seed), roll: q.roll + 0.5 * amount * Math.sin((t / 7.1) * 2 * Math.PI + seed * 2.3), hem: q.hem + 1.2 * amount * Math.sin(t * 0.6 + seed) };
};
/** one step cycle (texcoco walkPose with planted feet; the cast's fields pass through) */
const WALK_STRIDE = 44;
export const walkPose = (base: VPose, phase: number, amount = 1, stride = WALK_STRIDE): VPose => {
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
/** frames per walk cycle (two steps) at 29.97 fps, and the px per frame the feet advance (planted feet). A child's
 *  stride is its build's: walkAdvance(scale * strideK(kind, v)) */
export const WALK_CYCLE = 30;
export const walkAdvance = (scale: number, cycle = WALK_CYCLE, stride = WALK_STRIDE) => (2 * stride * scale) / cycle;
/** the build's stride factor (its hip height over a man's): a child walks with shorter steps */
export const strideK = (kind: VaccineKind, variant = 0) => -lookOf(kind, variant).spec.hipY / MAN_HIP;

/** standing at any yaw (0 front, +-0.6 three-quarter, +-1.3 profile, +-2.4 back three-quarter, PI back) */
export const standAt = (yaw: number): VPose => {
  const c = Math.cos(yaw);
  const sn = Math.sin(yaw);
  const hang = (sgn: number): ArmPose => ({ w: [sgn * 54 * c + 9 * sn, -138], elbow: [sgn * 0.3 * c - 0.3 * sn, 1], fist: 0.3, hand: 0 });
  const fo = (sgn: number): P2 => [sgn * 4 * c - 5 * sn * sgn, 0];
  return { ...STAND, yaw, headYaw: yaw + 0.04 * sn, armL: hang(-1), armR: hang(1), footL: fo(-1), footR: fo(1) };
};

// ---- the acting poses' arms (facing right: armL = the near hand) ---------------------------------------------------
const INOC_READY: ArmPose = { w: [40, -206], elbow: [-0.3, 1], fist: 1, hand: -28 };
const INOC_REACH: ArmPose = { w: [104, -194], elbow: [-0.2, 1], fist: 1, hand: 18 };
// the flask is held in the FAR hand (the leading arm, his left facing right): raised in front of the face it clears
// the head instead of crossing it, and it reaches further forward onto a bench
const FLASK_READY: ArmPose = { w: [52, -196], elbow: [0.4, 1], fist: 1, hand: -20 };
const FLASK_UP: ArmPose = { w: [98, -266], elbow: [0.35, 1], fist: 1, hand: -10 };
const FLASK_SET: ArmPose = { w: [104, -186], elbow: [0.3, 1], fist: 1, hand: 10 };
const BOOK_READY: ArmPose = { w: [34, -190], elbow: [-0.3, 1], fist: 1, hand: -20 };
const BOOK_SHELF: ArmPose = { w: [92, -272], elbow: [-0.15, 1], fist: 1, hand: -6 };
const REST_NEAR: ArmPose = R_STAND.armL;

export const POSES = {
  /** standing, facing us */
  front: (): VPose => F_STAND,
  /** standing at any yaw (front .. profile .. back): standAt */
  turnTo: (yaw: number): VPose => standAt(yaw),
  /** standing with the back to us (yaw PI) */
  back: (): VPose => standAt(Math.PI),
  /** three-quarter view, standing */
  stand: (dir: 1 | -1 = 1): VPose => face(R_STAND, dir),
  /** the walk: phase = frames / WALK_CYCLE; advance the feet by walkAdvance(scale * strideK(kind, v)) px per frame */
  walk: (dir: 1 | -1 = 1, phase = 0, amount = 1): VPose => face(walkPose(R_WALK, phase, amount), dir),
  /** the head's yaw (absolute, rad) and a nod (deg): a slow head turn never flips */
  turnHead: (q: VPose, yaw: number, nod = 0): VPose => ({ ...q, headYaw: yaw, pitch: q.pitch + nod }),
  /** seated on a bench seat (seatH units, default SEAT.h; a child's feet dangle from a high seat), hands in the lap */
  sit: (dir: 1 | -1 = 1, seatH = SEAT.h): VPose => face({ ...R_SIT, seatH }, dir),
  /** pointing with the near hand at shoulder height, t 0..1 */
  point: (dir: 1 | -1 = 1, t = 1): VPose => {
    const e = ease(c01(t));
    return face({ ...R_STAND, pitch: -2 * e, armL: lerpArm(R_STAND.armL, { w: [112, -246], elbow: [0.05, 1], fist: 0.7, hand: -6 }, e) }, dir);
  },
  /** talking with the near hand (an open palm), the mouth in syllables; frame = the cut's frame (loops by itself) */
  gesture: (dir: 1 | -1 = 1, frame = 0, amount = 1, seed = 0): VPose => {
    const t = frame;
    const syl = 0.5 + 0.5 * Math.sin(t * 0.85 + seed * 3);
    const phrase = sst(0.15, 0.55, 0.5 + 0.5 * Math.sin(t * 0.11 + seed * 1.7));
    const g = amount * (0.55 + 0.45 * Math.sin(t * 0.07 + seed * 2.1));
    const arm = R_STAND.armL;
    return face({ ...R_STAND, open: (0.15 + 0.4 * syl * phrase) * amount, pitch: -2 + 1.6 * Math.sin(t * 0.13 + seed), armL: { ...arm, w: [arm.w[0] + 70 * g, arm.w[1] - 62 * g], elbow: [-0.2, 1], fist: mix(arm.fist, 0.05, g), hand: arm.hand - 30 * g } }, dir);
  },
  /** chatting over any pose (covidFolk's chat): the head toward `toward`, the mouth moving, a small gesture */
  chat: (base: VPose, frame: number, toward: 1 | -1 = 1, gesture = 1, seed = 0): VPose => {
    const t = frame;
    const syl = 0.5 + 0.5 * Math.sin(t * 0.85 + seed * 3);
    const phrase = sst(0.15, 0.55, 0.5 + 0.5 * Math.sin(t * 0.11 + seed * 1.7));
    const open = 0.18 + 0.42 * syl * phrase;
    const g = gesture * (0.5 + 0.5 * Math.sin(t * 0.07 + seed * 2.1));
    const Gs = Math.sin(base.yaw) >= 0 ? 1 : -1;
    const near = Gs > 0 ? "armL" : "armR";
    const arm = base[near];
    return { ...base, headYaw: base.headYaw + toward * 0.22, pitch: base.pitch - 2 + 1.6 * Math.sin(t * 0.13 + seed), roll: base.roll + 1.5 * Math.sin(t * 0.09 + seed), open, [near]: { ...arm, w: [arm.w[0] + Gs * 14 * g, arm.w[1] - 26 * g], fist: mix(arm.fist, 0.05, g), hand: arm.hand - Gs * 24 * g } };
  },
  /** a nod over any pose; t 0..1 (one down-up), amount in degrees */
  nod: (base: VPose, t: number, amount = 10): VPose => ({ ...base, pitch: base.pitch + amount * Math.sin(Math.PI * c01(t)) ** 2 }),
  /** a wave of the near hand; frame loops, amount 0..1 raises the hand */
  wave: (dir: 1 | -1 = 1, frame = 0, amount = 1): VPose => {
    const b = face(R_STAND, dir);
    const near = dir === 1 ? "armL" : "armR";
    const w: P2 = [dir * (44 + 10 * Math.sin(frame * 0.35)), -318];
    return { ...b, [near]: { ...b[near], w: mix2(b[near].w, w, ease(amount)), elbow: [dir * 0.6, 0.8], fist: mix(0.3, 0, amount), hand: -dir * 10 * Math.sin(frame * 0.35) }, mouth: 0.3 * amount };
  },
  /** HOLD HANDS over any standing / walking pose: the arm on screen side `side` (+1 = screen right) reaches out to the
   *  partner's hand; t 0..1. Pass the figure's grip on that hand for the exact clasp (see handMeet). up = true for a
   *  child reaching up to an adult's hand */
  holdHand: (base: VPose, side: 1 | -1, t = 1, up = false): VPose => {
    const e = ease(c01(t));
    const facingUs = Math.cos(base.yaw) >= 0;
    const key = (side > 0) === facingUs ? "armR" : "armL";
    const arm = base[key];
    const T: ArmPose = up ? { w: [side * 50, -222], elbow: [side * 0.5, 1], fist: 0.75, hand: -side * 20 } : { w: [side * 46, -146], elbow: [side * 0.3, 1], fist: 0.8, hand: side * 10 };
    return { ...base, [key]: lerpArm(arm, T, e) };
  },
  /** INOCULATE: the near hand holds the lancet (hold "lancet" in that hand) in a pinch grip; phase 0..1 = the reach
   *  to the point (0.04..0.42: the blade tip lands on the figure's `lancetTo`), a tiny scratch stroke down (0.46..0.64),
   *  the withdraw (0.72..0.98). The far hand hangs (grip it to the child's elbow to steady the arm) */
  inoculate: (dir: 1 | -1 = 1, phase = 0): VPose => {
    const ph = c01(phase);
    const amt = sst(0.04, 0.42, ph) * (1 - sst(0.72, 0.98, ph));
    const scr = sst(0.46, 0.64, ph);
    const q: VPose = {
      ...R_STAND,
      yaw: 0.72,
      headYaw: 0.7,
      lean: 16 * amt,
      pitch: 8 + 14 * amt,
      crouch: 8 * amt,
      footL: [-10, 0],
      footR: [12, -2],
      brow: 0.1,
      armL: lerpArm(INOC_READY, INOC_REACH, amt),
      armR: { w: [40, -146], elbow: [0.15, 1], fist: 0.4, hand: 0 },
      look: [0.5 * amt, 0.5 * amt],
      reach: { arm: "L", amt, off: [0, 7 * scr] },
    };
    return face(q, dir);
  },
  /** EXAMINE A FLASK: the FAR hand (holdFar "flask"; facing right that is hold R) raises the flask from the chest up to the light
   *  (phase 0..0.45), then holds it there, turning it a little, the face up to it (0.45..1) */
  examineFlask: (dir: 1 | -1 = 1, phase = 0): VPose => {
    const ph = c01(phase);
    const up = sst(0, 0.45, ph);
    const sway = sst(0.4, 0.6, ph) * Math.sin((ph - 0.4) * 9);
    const arm = lerpArm(FLASK_READY, FLASK_UP, up);
    const q: VPose = { ...R_STAND, yaw: 0.6, headYaw: 0.66 + 0.06 * up, pitch: 4 - 16 * up, lean: -2 * up, look: [0.3 * up, -0.5 * up], armR: { ...arm, w: [arm.w[0] + 3 * sway, arm.w[1] - 2 * sway], hand: arm.hand + 8 * sway } };
    return face(q, dir);
  },
  /** SET THE FLASK DOWN (the far hand, as examineFlask): from the raised hold down onto a bench point (the flask's base lands on
   *  the figure's `flaskTo`, 0.04..0.55), the hand lets go (0.62..0.76) and comes back to the side (0.72..1) */
  placeFlask: (dir: 1 | -1 = 1, phase = 0): VPose => {
    const ph = c01(phase);
    const amt = sst(0.04, 0.55, ph);
    const release = sst(0.62, 0.76, ph);
    const ret = sst(0.72, 1, ph);
    const q: VPose = { ...R_STAND, yaw: 0.66, headYaw: 0.66, pitch: -12 + 26 * amt - 12 * ret, lean: 5 * amt * (1 - ret), crouch: 3 * amt * (1 - ret), look: [0.3, 0.4 * amt], armR: lerpArm(FLASK_UP, FLASK_SET, amt), reach: { arm: "R", amt, release, ret, rest: R_STAND.armR } };
    return face(q, dir);
  },
  /** a book held at the chest in the near hand, its cover to us (hold "book"); read = the face down to it */
  holdBook: (dir: 1 | -1 = 1, read = 0): VPose => face({ ...R_STAND, pitch: 4 + 12 * read, look: [0.2 * read, 0.6 * read], armL: BOOK_READY, bookTurn: 0 }, dir),
  /** SHELVE A BOOK: lift it from the chest (0.03..0.5, turning it spine-out) to just beside its slot, slide it in
   *  (0.5..0.72: its foot lands on the figure's `bookTo`), let go (0.74..0.84), the hand back to the side (0.8..1) */
  shelveBook: (dir: 1 | -1 = 1, phase = 0): VPose => {
    const ph = c01(phase);
    const amt = sst(0.03, 0.5, ph);
    const slide = sst(0.5, 0.72, ph);
    const release = sst(0.74, 0.84, ph);
    const ret = sst(0.78, 1, ph);
    const q: VPose = {
      ...R_STAND,
      yaw: 0.7,
      headYaw: 0.7,
      pitch: 4 - 14 * amt * (1 - ret),
      lean: -2 * amt,
      look: [0.3 * amt, -0.3 * amt],
      armL: lerpArm(BOOK_READY, BOOK_SHELF, amt),
      bookTurn: sst(0.12, 0.5, ph),
      reach: { arm: "L", amt, off: [-13 * (1 - slide), 2 * (1 - slide)], release, ret, rest: REST_NEAR },
    };
    return face(q, dir);
  },
  /** SLEEVE UP: the arm on screen side `side` (+1 = screen right) offered to someone standing there: the body turned
   *  a little toward them (yaw side * 0.15: keep |yaw| under ~0.2 so the offered arm stays in front of the body), the elbow held out, the hand at the hip, the sleeve pushed up off the upper
   *  arm (t 0..1 slides it up). The arm's anchor armSpotL / armSpotR (L for side -1, R for side +1) is where the
   *  lancet goes (lancetTo) and where glowArm glows (glowSide the same letter) */
  sleeveUp: (side: 1 | -1 = 1, t = 1, yaw = side * 0.15): VPose => {
    const e = ease(c01(t));
    const base = standAt(yaw);
    const key = side > 0 ? "armR" : "armL";
    const T: ArmPose = { w: [side * 44, -170], elbow: [side * 1, 0.15], fist: 0.35, hand: -side * 30 };
    return { ...base, headYaw: yaw * 1.2, [key]: lerpArm(base[key], T, e), bare: side > 0 ? { R: c01(t) } : { L: c01(t) }, look: [side * 0.4 * e, 0.3 * e] };
  },
  /** a child's small FLINCH at the scratch over any pose: t 0..1 (in quickly by 0.25, out slowly): the shoulders up,
   *  the eyes squeezed shut, the head pulled back and away a little; no tears */
  flinch: (base: VPose, t: number, amount = 1): VPose => {
    const u = c01(t);
    const b = amount * (u < 0.25 ? sst(0, 0.25, u) : 1 - sst(0.25, 1, u));
    const Gs = Math.sin(base.yaw) >= 0 ? 1 : -1;
    return { ...base, hunch: Math.max(base.hunch ?? 0, 0.95 * b), squeeze: Math.max(base.squeeze ?? 0, b), worry: Math.max(base.worry ?? 0, 0.7 * b), pitch: base.pitch + 5 * b, roll: base.roll - Gs * 4 * b, lean: base.lean - Gs * 3 * b, crouch: base.crouch + 2 * b };
  },
  /** WILT: a sick person sags (t 0..0.4: the head down, the shoulders round, the knees give), then sits down onto a
   *  seat behind (0.4..1; keep the feet planted: move `at` back wiltBack(t, kind, v) * scale px against dir) */
  wilt: (dir: 1 | -1 = 1, t = 1, seatH = SEAT.h): VPose => {
    const R1: VPose = { ...R_STAND, pitch: 22, hunch: 0.8, lean: 8, crouch: 8, worry: 1, lids: 0.5, armL: { w: [-6, -128], elbow: [-0.2, 1], fist: 0.15, hand: 6 }, armR: { w: [30, -130], elbow: [0.1, 1], fist: 0.15, hand: 6 } };
    const R2: VPose = { ...R_SIT, seatH, lean: 12, pitch: 24, headYaw: 0.78, roll: 3, hunch: 0.8, worry: 0.9, lids: 0.6, armL: { w: [34, -112], elbow: [-0.2, 1], fist: 0.1, hand: 30 }, armR: { w: [42, -110], elbow: [0.2, 1], fist: 0.1, hand: 30 } };
    const u = c01(t);
    const q = u < 0.4 ? lerpTo(R_STAND, R1, sst(0, 0.4, u)) : lerpTo(R1, R2, sst(0.4, 1, u));
    return face(q, dir);
  },
  /** seated, sick: head bowed, arms in the lap, slow breathing (frame = the cut's frame) */
  slump: (dir: 1 | -1 = 1, frame = 0, seatH = SEAT.h): VPose => {
    const t = frame / 29.97;
    const b = Math.sin((t / 3.6) * 2 * Math.PI);
    const q: VPose = { ...R_SIT, seatH, lean: 12 + 1.2 * b, pitch: 24 - 1.5 * b, headYaw: 0.78, roll: 3, hunch: 0.78 - 0.08 * b, worry: 0.9, lids: 0.6, open: 0.1 + 0.05 * b, crouch: -0.6 * b, armL: { w: [34, -112], elbow: [-0.2, 1], fist: 0.1, hand: 30 }, armR: { w: [42, -110], elbow: [0.2, 1], fist: 0.1, hand: 30 } };
    return face(q, dir);
  },
};
/** the seated feet's forward offset (units) for a build at a seated yaw (rigPose's rule) */
export const seatFootX = (kind: VaccineKind = "jenner", variant = 0, yaw = 0.95) => {
  const sp = lookOf(kind, variant).spec;
  return sp.leg[0] * mix(0.32, 1, Math.abs(Math.sin(yaw))) * 0.93;
};
/** units the hips travel back while sitting down in POSES.wilt (the feet stay planted) */
export const wiltBack = (t: number, kind: VaccineKind = "parent", variant = 0) => seatFootX(kind, variant) * ease(sst(0.4, 1, c01(t)));
/** the sit-down from standing (any facing): t 0..1, the feet planted, the hips moving back sitBack(t, kind, variant) */
export const sitDown = (dir: 1 | -1, t: number, seatH = SEAT.h): VPose => lerpTo(face(R_STAND, dir), face({ ...R_SIT, seatH }, dir), t);
export const sitBack = (t: number, kind: VaccineKind = "parent", variant = 0) => seatFootX(kind, variant) * ease(c01(t));
/** a seat height at which a build's feet just dangle (a bench a little higher than its lower leg) */
export const dangleSeat = (kind: VaccineKind, variant = 0) => {
  const sp = lookOf(kind, variant).spec;
  return Math.round(sp.leg[1] + 30);
};
