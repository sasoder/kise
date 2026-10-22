// ---------------------------------------------------------------------------
// greekFolkBody — the DRAWN Greek cast (kyle-greek-math) as flat gouache shapes on the texcoco rig, in romeFolk's hand.
// Pure geometry: buildGreekFolk(kind, variant, pose, opts) -> { shapes, ... } in FOLK units (FU per rig unit, the
// pandemics Worker's 513), painted by greekFolk.tsx's painter (romeFolk's Paint, the same pandemicFolkPaint filter).
// greekFolk.tsx is the API.
//
// The skeleton is the texcoco rig (figureRig) on Greek builds (Spec); feet, hips, hands, grips and IK are the rig's, as
// in romeFolk. The drawing reuses romeFolkBody's exported helpers (closedD, tubeD, ellD, lineD, regionPoly, FU, HEAD_R,
// HEAD_UP); the helpers romeFolkBody keeps private (the lathe, the sphere projection, the hull) are COPIED here and
// extended (romeFolkBody is read-only for this clip).
//
// What is new against romeFolk:
//   - the torso lathe is addressed by ANGLE round the body (phi 0 = the front, +pi/2 = his left = screen right when he
//     faces us, pi = the back), so the himation, which wraps the whole body, is drawn from any yaw including the back:
//     each cloth region is clipped to the visible half [term - pi, term] and grows from the silhouette as it turns in;
//   - the himation: one cloth over the left shoulder, its upper edge a smooth diagonal round the body (shoulder top on
//     the left, under the right arm), a rolled lighter edge, an optional coloured border, the front end hanging from
//     the left shoulder, the back end down the back, the lower drape to mid-calf (its hem higher on his right), a few
//     big soft folds; the chiton under it shows at the right shoulder, the right arm's sleeve and the ankles;
//   - beards as DESIGNED shapes: the cheek/jaw region on the head sphere + a small lathe hanging under the chin with a
//     LOBED (scalloped) lower edge, inner lighter lobes and a moustache, in a lifted mid tone: never a solid dark block;
//   - hair in a lifted tone with curl lobes on its outline and lighter curl clumps on the sphere, so a three-quarter or
//     back view of the head is a designed shape, not a large dark area;
//   - held things built from the hands every frame (tablet, open / hanging / closed scroll, dividers, reed pen, stick):
//     the orange line art on them is `glow` shapes (crisp, outside the texture filter, half the fog).
// ---------------------------------------------------------------------------
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { figureRig, type FigPose, type Spec } from "../kits/maps/texcocoFigures";
import { mixC, type Shape } from "../kyle-pandemics/pandemicFolkPaint";
import { smoothClosed } from "../kyle-pandemics/pandemicFolkWorker";
import { FU, HEAD_R, HEAD_UP, closedD, ellD, ellPts, lineD, qD, regionPoly, tubeD } from "../kyle-rome-slavery/romeFolkBody";

type P2 = [number, number];
export { FU, HEAD_R, HEAD_UP };
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => v * v * (3 - 2 * v);
const PI = Math.PI;
const wrapPi = (a: number) => {
  let v = a;
  while (v > PI) v -= 2 * PI;
  while (v < -PI) v += 2 * PI;
  return v;
};

/** a shape of the Greek cast: the paint's Shape, plus `glow` = an ORANGE LINE (d is a stroke path in folk units, glow
 *  its width in folk units): drawn crisp outside the gouache texture with a faint halo; `gfill` = an orange area (a
 *  lune) drawn the same way at its opacity */
export type GShape = Shape & { glow?: number; gfill?: boolean; /** the part's name (the glitch audit matches shapes by it; the paint ignores it) */ id?: string };

// ===================================================================================================================
// COLOURS (the style's palette: muted earth tones in palette A's teal air; never orange on people)
// ===================================================================================================================
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const SKIN = { fair: "#E8C4A0", warm: "#DDB28E", olive: "#D2A57F", tan: "#C9976F", pale: "#EDCFB0", deep: "#BC8B66" };
/** hair tones are LIFTED (no near-black): a three-quarter head must not read as a dark hole */
export const HAIR = { darkBrown: "#5F4636", brown: "#6E5241", chestnut: "#7C5A42", black: "#4A3C33", grey: "#B7B0A4", white: "#E6E0D4", greyBrown: "#8E8174", silver: "#CCC5B8" };
export const CLOTH = {
  cream: "#EFE6D3",
  ivory: "#F2ECDE",
  oatmeal: "#CDBF9F",
  sand: "#D9CCAE",
  linen: "#E7E0CE",
  khaki: "#9A9070",
  teal: "#6F8E88",
  tealLt: "#7D9790",
  slate: "#68737A",
  redBrown: "#8C5A4A",
  umber: "#7A5C45",
};
export const WOOD = { lit: "#9C7A56", mid: "#7A5E42", dark: "#584334" };
/** muted bronze (dividers, the armillary stand): desaturated so it never reads as the accent */
export const BRONZE = { lit: "#ABA387", mid: "#857E66", dark: "#5A5545" };
export const PAPYRUS = { lit: "#E9DEC4", mid: "#D8C9A6", dark: "#AE9C78" };
/** the wax tablet: a warm dark-brown wax face (orange never sits on near-black: L* ~30) in a wooden frame */
export const WAX = "#5A4334";

export type GreekInks = {
  skin: string;
  hair: string;
  beard: string;
  /** the chiton / peplos (under-garment) */
  chiton: string;
  /** the himation (mantle, veil, shawl) */
  himation: string;
  /** the himation's border (or the chiton's stripe) */
  border: string;
  belt: string;
  leather: string;
  /** the fillet (headband) */
  fillet: string;
};
export type GHair = "bald" | "long" | "curly" | "wavy" | "receding" | "close" | "bun";
export type GBeard = "none" | "stubble" | "neat" | "short" | "full" | "long" | "curly";
/** himation = chiton + himation over the left shoulder (men); exomis = a short chiton pinned on the left shoulder, the
 *  right shoulder and arm bare (a young citizen); peplos = a woman's long peplos with its overfold, belted; shawl = a
 *  woman's chiton + a himation round both shoulders; veil = a woman's peplos + the himation drawn over her head */
export type GDress = "himation" | "exomis" | "peplos" | "shawl" | "veil";
export type GreekKind = "scholar" | "euclid" | "diophantus" | "citizen";
export type GLook = {
  spec: Spec;
  inks: GreekInks;
  hair: GHair;
  beard: GBeard;
  dress: GDress;
  female: boolean;
  plump: number;
  head: number;
  /** resting brows (-1 lifted .. 1 knit) and lids (0 open .. 1 shut) */
  brow: number;
  lids: number;
  /** a coloured border on the himation */
  border: boolean;
  fillet: boolean;
  /** linen pleats on the chiton (the Alexandrian) */
  pleats: boolean;
  label: string;
};

// ---- builds (texcoco Spec; romeCast's MAN / WOMAN) -------------------------------------------------------------------
const HEADK = 1.06;
export const MAN: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08 * HEADK, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [70, 68] };
export const WOMAN: Spec = { ...MAN, a: 47, hw: 39, H: 89, hipY: -147, limb: 0.9, headScale: 1.03 * HEADK, arm: [55, 52], leg: [68, 66] };
const BASE_INKS: GreekInks = {
  skin: SKIN.warm,
  hair: HAIR.darkBrown,
  beard: HAIR.darkBrown,
  chiton: CLOTH.sand,
  himation: CLOTH.oatmeal,
  border: CLOTH.teal,
  belt: "#7C6A52",
  leather: "#6A4C37",
  fillet: "#EDE6D6",
};
const GL = (
  label: string,
  spec: Spec,
  inks: Partial<GreekInks>,
  hair: GHair,
  beard: GBeard,
  dress: GDress,
  o: { plump?: number; head?: number; brow?: number; lids?: number; border?: boolean; fillet?: boolean; pleats?: boolean; female?: boolean } = {},
): GLook => ({
  label,
  spec,
  inks: { ...BASE_INKS, ...inks },
  hair,
  beard,
  dress,
  female: o.female ?? false,
  plump: o.plump ?? 0,
  head: o.head ?? 1,
  brow: o.brow ?? 0,
  lids: o.lids ?? 0,
  border: o.border ?? false,
  fillet: o.fillet ?? false,
  pleats: o.pleats ?? false,
});
const LOOKS: Record<GreekKind, GLook[]> = {
  scholar: [
    GL("0 old, bald, white beard (Thales)", { ...MAN, a: 53, hipY: -150, aged: true }, { skin: SKIN.warm, hair: HAIR.white, beard: HAIR.white, chiton: CLOTH.linen, himation: CLOTH.oatmeal }, "bald", "long", "himation", { lids: 0.2, plump: 0.15 }),
    GL("1 long hair, white robe (Pythagoras)", { ...MAN, a: 52, hw: 44, H: 95 }, { skin: SKIN.fair, hair: HAIR.greyBrown, beard: HAIR.greyBrown, chiton: CLOTH.ivory, himation: CLOTH.ivory, border: CLOTH.oatmeal }, "long", "full", "himation", { border: true, fillet: true }),
    GL("2 curly dark beard", { ...MAN, a: 56, hw: 46 }, { skin: SKIN.olive, hair: HAIR.black, beard: HAIR.black, chiton: CLOTH.sand, himation: CLOTH.teal }, "curly", "curly", "himation", {}),
    GL("3 young, beardless (Theaetetus)", { ...MAN, a: 50, hw: 43, H: 95, hipY: -154, limb: 0.96 }, { skin: SKIN.fair, hair: HAIR.chestnut, chiton: CLOTH.cream, himation: CLOTH.redBrown }, "curly", "none", "himation", { head: 0.98 }),
    GL("4 short grey beard", { ...MAN, a: 55, hw: 45, aged: true }, { skin: SKIN.warm, hair: HAIR.grey, beard: HAIR.grey, chiton: CLOTH.cream, himation: CLOTH.khaki }, "receding", "short", "himation", { lids: 0.15 }),
    GL("5 broad, middle-aged", { ...MAN, a: 62, hw: 50, limb: 1.06 }, { skin: SKIN.tan, hair: HAIR.brown, beard: HAIR.brown, chiton: CLOTH.oatmeal, himation: CLOTH.slate }, "wavy", "short", "himation", { plump: 0.75, head: 1.03 }),
    GL("6 Alexandrian (later era)", { ...MAN, a: 53, hw: 44, H: 95 }, { skin: SKIN.deep, hair: HAIR.black, beard: HAIR.black, chiton: CLOTH.linen, himation: CLOTH.sand, border: CLOTH.redBrown, fillet: "#E9E2D2" }, "close", "neat", "himation", { border: true, fillet: true, pleats: true }),
  ],
  euclid: [
    GL("Euclid", { ...MAN, a: 55, hw: 46, H: 95, hipY: -153 }, { skin: SKIN.warm, hair: "#5C4434", beard: "#634A39", chiton: "#D9CDB3", himation: CLOTH.cream, border: CLOTH.teal }, "wavy", "neat", "himation", { border: true, brow: -0.18, lids: 0.12 }),
  ],
  diophantus: [
    GL("Diophantus", { ...MAN, a: 54, hw: 45, hipY: -150, aged: true }, { skin: SKIN.olive, hair: HAIR.grey, beard: "#C2BBAF", chiton: CLOTH.oatmeal, himation: CLOTH.slate, border: CLOTH.oatmeal }, "receding", "full", "himation", { lids: 0.22, border: true }),
  ],
  citizen: [
    GL("0 man, himation", { ...MAN, a: 55, hw: 46 }, { skin: SKIN.warm, hair: HAIR.darkBrown, beard: HAIR.darkBrown, chiton: CLOTH.oatmeal, himation: CLOTH.khaki }, "close", "short", "himation", {}),
    GL("1 young man, bare-armed (exomis)", { ...MAN, a: 52, hw: 45, limb: 1.02 }, { skin: SKIN.tan, hair: HAIR.chestnut, chiton: CLOTH.tealLt, belt: "#6B5442" }, "curly", "none", "exomis", {}),
    GL("2 older man", { ...MAN, a: 57, hw: 46, hipY: -150, aged: true }, { skin: SKIN.olive, hair: HAIR.grey, beard: HAIR.silver, chiton: CLOTH.sand, himation: CLOTH.redBrown }, "receding", "full", "himation", { plump: 0.3 }),
    GL("3 woman, himation over the head", WOMAN, { skin: SKIN.fair, hair: HAIR.brown, chiton: CLOTH.tealLt, himation: CLOTH.oatmeal, belt: "#6B5442" }, "bun", "none", "veil", { female: true, head: 0.97 }),
    GL("4 woman, himation on the shoulders", { ...WOMAN, a: 48 }, { skin: SKIN.pale, hair: HAIR.chestnut, chiton: CLOTH.cream, himation: CLOTH.redBrown, fillet: "#C9B48E" }, "bun", "none", "himation", { female: true, head: 0.97, fillet: true }),
    GL("5 young woman, peplos", { ...WOMAN, a: 46, hw: 38 }, { skin: SKIN.warm, hair: HAIR.darkBrown, chiton: "#B9AE8C", belt: "#7C6A52", fillet: CLOTH.tealLt }, "bun", "none", "peplos", { female: true, head: 0.96, fillet: true }),
  ],
};
export const GREEK_VARIANTS: Record<GreekKind, number> = { scholar: LOOKS.scholar.length, euclid: 1, diophantus: 1, citizen: LOOKS.citizen.length };
export const greekLookOf = (kind: GreekKind, variant = 0): GLook => {
  const a = LOOKS[kind];
  return a[((Math.round(variant) % a.length) + a.length) % a.length];
};
export const greekSpec = (kind: GreekKind, variant = 0) => greekLookOf(kind, variant).spec;

// ===================================================================================================================
// HELD THINGS: the options and their sizes (rig units)
// ===================================================================================================================
export type Diagram = "thales" | "pythagoras" | "lunes" | "exhaustion" | "solids" | "elements" | "arithmetica" | "none";
/** a diagram: one of the named ones, or polylines in the face's unit square (-1..1, y down) */
export type DiagramSpec = Diagram | { lines: P2[][]; fills?: P2[][] };
export type Held = {
  /** a two-hand thing held between the hands: the wax tablet or the open scroll (rollers in the fists) */
  two?: "tablet" | "scroll";
  diagram?: DiagramSpec;
  /** foreshorten the two-hand thing's face (0 = full face .. 0.7) */
  tilt?: number;
  /** a one-hand thing per hand (L = the rig's armL, his right) */
  L?: OneHeld;
  R?: OneHeld;
};
export type OneHeld = "dividers" | "pen" | "stick" | "scrollClosed" | "scrollHang";
export const TABLET = { w: 72, h: 54, frame: 5.5 };
export const SCROLL = { w: 96, h: 54, roll: 6.5, hangW: 50, hangL: 74 };
/** the stick (rig units); in crouchDraw the tip reaches the ground between reach[0] and reach[1] units in front of
 *  his feet (stickTo targets outside it are clamped there) */
export const STICK = { len: 170, reach: [140, 206] as [number, number] };
export const DIVIDERS = { len: 52, open: 24 };
export const PEN = { len: 40 };

// ===================================================================================================================
// small rig helpers
// ===================================================================================================================
type Rig = ReturnType<typeof figureRig>;
type ArmRig = Rig["armL"];
type LegRig = Rig["legL"];
const circ = (c: P2, r: number, n = 12): P2[] => Array.from({ length: n }, (_, i): P2 => [c[0] + r * Math.cos((i * 2 * PI) / n), c[1] + r * Math.sin((i * 2 * PI) / n)]);
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
const area = (pts: P2[]) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
/** one winding for every sub-path of a union shape (nonzero fill = the union) */
const cw = (pts: P2[]) => (area(pts) < 0 ? [...pts].reverse() : pts);
/** folk-unit closed path from already-folk points */
const closedF = (pts: P2[], tension = 1) => smoothClosed(pts, tension);
const fF = (p: P2): P2 => [p[0] * FU, p[1] * FU];
/** an open Catmull-Rom curve through folk-unit points */
const smoothOpen = (pts: P2[]) => {
  const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
  let d = `M ${n2(pts[0][0])} ${n2(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${n2(p1[0] + (p2[0] - p0[0]) / 6)} ${n2(p1[1] + (p2[1] - p0[1]) / 6)} ${n2(p2[0] - (p3[0] - p1[0]) / 6)} ${n2(p2[1] - (p3[1] - p1[1]) / 6)} ${n2(p2[0])} ${n2(p2[1])}`;
  }
  return d;
};

// ===================================================================================================================
// THE TORSO LATHE, BY ANGLE (torso-local rig units: hips at (0, 0), up -y)
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
type Lathe = {
  s: number;
  cY: number;
  /** angle phi (0 front, + = his left) at height y, `out` units off the surface -> torso-local point, its depth
   *  (> 0 facing us), and whether phi was inside the visible half */
  at: (phi: number, y: number, out?: number) => { p: P2; d: number };
  /** the visible half of the row at y: [term - pi, term] */
  vis: (y: number, out?: number) => [number, number];
  edge: (y: number, out?: number) => [number, number];
  /** a front-view x (as romeFolk's lathe) -> angle */
  phiOfX: (x: number, y: number) => number;
};
const makeLathe = (rows: Row[], yaw: number): Lathe => {
  const s = Math.sin(yaw);
  const cY = Math.cos(yaw);
  const term = (A: number, B: number) => Math.atan2(A * cY, B * s);
  const vis = (y: number, out = 0): [number, number] => {
    const r = sampleRow(rows, y);
    const t = term(r.a + out, r.b + out);
    return [t - PI, t];
  };
  const at = (phi: number, y: number, out = 0) => {
    const r = sampleRow(rows, y);
    const A = r.a + out;
    const B = r.b + out;
    const t = term(A, B);
    const cen = t - PI / 2;
    let ph = cen + wrapPi(phi - cen);
    ph = Math.max(t - PI, Math.min(t, ph));
    const X = A * Math.sin(ph) * cY + B * Math.cos(ph) * s + r.c * s;
    const dz = (-Math.sin(phi) * s) / A + (Math.cos(phi) * cY) / B;
    const nl = Math.hypot(Math.sin(phi) / A, Math.cos(phi) / B) || 1;
    return { p: [X, y] as P2, d: dz / nl };
  };
  const edge = (y: number, out = 0): [number, number] => {
    const r = sampleRow(rows, y);
    const w = Math.hypot((r.a + out) * cY, (r.b + out) * s);
    return [r.c * s - w, r.c * s + w];
  };
  const phiOfX = (x: number, y: number) => {
    const r = sampleRow(rows, y);
    return Math.asin(Math.max(-1, Math.min(1, x / r.a)));
  };
  return { s, cY, at, vis, edge, phiOfX };
};
/** the visible parts of an angle range [a, b] (b - a < 2 pi) within the visible half [v0, v1]: [lo, hi, shift][]
 *  (shift = the multiple of 2 pi added to a, b); every overlapping piece, so nothing switches sides */
const visParts = (a: number, b: number, v: [number, number]): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (let k = -2; k <= 2; k++) {
    const lo = Math.max(a + 2 * PI * k, v[0]);
    const hi = Math.min(b + 2 * PI * k, v[1]);
    if (hi - lo > 1e-4) out.push([lo, hi, 2 * PI * k]);
  }
  return out;
};

const greekRows = (look: GLook, shY: number): Row[] => {
  const sp = look.spec;
  const hw = sp.hw;
  const A = sp.a;
  const pl = look.plump;
  const belly = A * (1.0 + 0.08 * pl);
  const rows: Row[] = [
    { y: shY - 9, a: 12, b: 10, c: 0 },
    { y: shY - 4, a: hw * 0.62, b: hw * 0.42, c: 0 },
    { y: shY + 4, a: hw * 0.82, b: hw * 0.52, c: 1 },
    { y: shY + 22, a: hw * 0.9, b: hw * 0.58, c: 2 },
    { y: shY + 50, a: Math.max(hw * 0.95, A * 0.9 + 4 * pl), b: A * 0.58 + 6 * pl, c: 3 + 6 * pl },
    { y: -30, a: belly, b: A * (0.6 + 0.14 * pl), c: 4 + 10 * pl },
    { y: -10, a: A * (0.99 + 0.05 * pl), b: A * (0.62 + 0.1 * pl), c: 3 + 6 * pl },
    { y: 8, a: A * 0.95, b: A * 0.58, c: 1 },
  ];
  if (look.female) {
    rows[4] = { ...rows[4], a: hw * 0.98, b: A * 0.6, c: 4 };
    rows[5] = { ...rows[5], a: A * 0.94 };
  }
  return rows;
};
const legPtOf = (l: LegRig, fr: number): P2 => (fr <= 1 ? mix2(l.H, l.K, fr) : mix2(l.K, l.A, Math.min(1, fr - 1)));
const legRadOf = (fr: number) => (fr <= 1 ? mix(31, 25, fr) : mix(25, 18, Math.min(1, fr - 1)));
/** a long garment's outline (figure-local rig units): the hull of the legs from the belt to the hem, per-leg length
 *  (lenL for the rig's legL = his right), flare at the hem; resampled to 180 points: continuous in the pose */
export const robeOutline = (r: Rig, L: Lathe, q: FigPose, k: number, lenL: number, lenR: number, flare: number): P2[] => {
  const hdx = q.hem - Math.tan((q.lean * PI) / 180) * 20;
  const [el, er] = L.edge(-12);
  const waist = [r.toFig([el + 1, -12]), r.toFig([er - 1, -12])];
  const pts: P2[] = [...waist];
  for (const l of [r.legL, r.legR]) {
    const skLen = l === r.legL ? lenL : lenR;
    const n = Math.max(2, Math.ceil(skLen / 0.25));
    for (let i = 0; i <= n; i++) {
      const fr = (i / n) * skLen;
      pts.push(...circ(add(legPtOf(l, fr), [hdx * 0.3 * (fr / skLen), 0]), (legRadOf(fr) + flare * (fr / skLen)) * k, 16));
    }
    const hm = legPtOf(l, skLen);
    const rr = (legRadOf(skLen) + flare) * k;
    pts.push(add(hm, [-rr - 3 + hdx, 6]), add(hm, [rr + 3 + hdx, 6]), add(hm, [hdx, 8]));
  }
  return resampleClosed(hull(pts.map((p): P2 => [p[0], Math.min(p[1], -1.5)])), 180, waist[0], 4);
};

// ===================================================================================================================
// THE HEAD (a sphere, as romeFolk's): features and regions turned by yaw and nod
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
/** a small lathe hanging under / behind the head (head-local units of R, y down from the head centre), turned by the
 *  head's yaw: the beard's drop and the long hair's fall. Returns the visible outline for the angle range [a, b]
 *  (null when hidden) and a surface point mapper */
const headLathe = (h: Head, rows: Row[]) => {
  const L = makeLathe(rows, h.yaw);
  const toF = (p: P2) => hToFig(h, p);
  return {
    L,
    /** the outlines of the visible parts of the lathe between angles [a, b], heights yTop(phi)..yBot(phi) */
    region: (a: number, b: number, yTop: (phi: number) => number, yBot: (phi: number) => number, n = 22): P2[][] => {
      const ym = (rows[0].y + rows[rows.length - 1].y) / 2;
      return visParts(a, b, L.vis(ym)).map(([lo, hi, sh]) => {
        const m = Math.max(3, Math.round((n * (hi - lo)) / Math.max(1e-3, b - a)));
        const top: P2[] = [];
        const bot: P2[] = [];
        for (let i = 0; i <= m; i++) {
          const ph = mix(lo, hi, i / m);
          top.push(toF(L.at(ph, yTop(ph - sh)).p));
          bot.push(toF(L.at(ph, yBot(ph - sh)).p));
        }
        return [...top, ...bot.reverse()];
      });
    },
    pt: (phi: number, y: number, out = 0) => {
      const a = L.at(phi, y, out);
      return { p: toF(a.p), d: a.d };
    },
  };
};

// ===================================================================================================================
// OPTIONS
// ===================================================================================================================
export type GreekBuildOpts = {
  held?: Held;
  inks?: Partial<GreekInks>;
  /** 0..1 toward the dead tone (cloth and hair) */
  drain?: number;
  /** override the look's dress / hair / beard */
  dress?: GDress;
  hair?: GHair;
  beard?: GBeard;
  /** stick tip on the ground (figure-local y of the ground, default 0) */
  groundY?: number;
  /** dividers' opening, deg */
  dividersOpen?: number;
  /** the hanging scroll's direction (deg from straight down, + toward the way he faces) */
  hangAng?: number;
  hideArm?: "L" | "R";
};
export type GreekBuild = {
  shapes: GShape[];
  headC: P2;
  headR: number;
  headTop: P2;
  /** figure-local anchors of held things (rig units) */
  items: {
    tablet?: { c: P2; corners: P2[] };
    scroll?: { c: P2; corners: P2[] };
    stickTip?: P2;
    stickGrip?: P2;
    penTip?: P2;
    dividersTips?: [P2, P2];
  };
};

// ===================================================================================================================
// DIAGRAMS (polylines in the unit square -1..1, y down)
// ===================================================================================================================
const arcPts = (c: P2, r: number, a0: number, a1: number, n = 24): P2[] => Array.from({ length: n + 1 }, (_, i): P2 => {
  const a = mix(a0, a1, i / n);
  return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
});
const fitBox = (lines: P2[][], fills: P2[][], m = 0.82) => {
  const all = [...lines.flat(), ...fills.flat()];
  const x0 = Math.min(...all.map((p) => p[0]));
  const x1 = Math.max(...all.map((p) => p[0]));
  const y0 = Math.min(...all.map((p) => p[1]));
  const y1 = Math.max(...all.map((p) => p[1]));
  const s = (2 * m) / Math.max(x1 - x0, y1 - y0);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const T = (p: P2): P2 => [(p[0] - cx) * s, (p[1] - cy) * s];
  return { lines: lines.map((l) => l.map(T)), fills: fills.map((l) => l.map(T)) };
};
/** the diagram's line art: { lines (bright), thin (fainter, thinner), fills (orange areas at low opacity) } */
export const diagramArt = (dg: DiagramSpec): { lines: P2[][]; thin: P2[][]; fills: P2[][] } => {
  if (typeof dg !== "string") return { lines: dg.lines, thin: [], fills: dg.fills ?? [] };
  switch (dg) {
    case "thales": {
      // the angle in a semicircle is a right angle
      const c: P2 = [0, 0.18];
      const r = 0.8;
      const A: P2 = [-r, c[1]];
      const B: P2 = [r, c[1]];
      const ang = -PI + 0.95;
      const C: P2 = [c[0] + r * Math.cos(ang), c[1] + r * Math.sin(ang)];
      const ua = norm(sub(A, C));
      const ub = norm(sub(B, C));
      const m = 0.16;
      const sq: P2[] = [add(C, mul(ua, m)), add(add(C, mul(ua, m)), mul(ub, m)), add(C, mul(ub, m))];
      return { ...fitBox([arcPts(c, r, PI, 2 * PI, 32), [A, B], [A, C, B], sq], []), thin: [] };
    }
    case "pythagoras": {
      // the right triangle with the squares on its three sides
      const A: P2 = [-0.22, 0.2];
      const B: P2 = [0.26, 0.2];
      const C: P2 = [-0.22, -0.16];
      const sqOn = (p: P2, q: P2, out: 1 | -1): P2[] => {
        const d = sub(q, p);
        const n: P2 = [d[1] * out, -d[0] * out];
        return [p, q, add(q, n), add(p, n), p];
      };
      return { ...fitBox([[A, B, C, A], sqOn(A, B, -1), sqOn(C, A, -1), sqOn(B, C, -1)], []), thin: [] };
    }
    case "lunes": {
      // Hippocrates' lunes: the right isosceles triangle in a semicircle, semicircles on its two legs
      const A: P2 = [-0.62, 0.3];
      const B: P2 = [0.62, 0.3];
      const C: P2 = [0, -0.32];
      const big = arcPts([0, 0.3], 0.62, PI, 2 * PI, 32);
      const m1 = mix2(A, C, 0.5);
      const m2 = mix2(C, B, 0.5);
      const r2 = vlen(sub(C, A)) / 2;
      const a1 = Math.atan2(A[1] - m1[1], A[0] - m1[0]);
      const a2 = Math.atan2(C[1] - m2[1], C[0] - m2[0]);
      const s1 = arcPts(m1, r2, a1, a1 + PI, 24);
      const s2 = arcPts(m2, r2, a2, a2 + PI, 24);
      // the lunes as areas: the small arc out, the big arc back
      const bigL = arcPts([0, 0.3], 0.62, PI, 1.5 * PI, 16).reverse();
      const bigR = arcPts([0, 0.3], 0.62, 1.5 * PI, 2 * PI, 16).reverse();
      const f1 = [...s1, ...bigL];
      const f2 = [...s2, ...bigR];
      return { ...fitBox([big, [A, B], [A, C, B], s1, s2], [f1, f2]), thin: [] };
    }
    case "exhaustion": {
      // Eudoxus' exhaustion: polygons doubling inside the circle
      const r = 0.82;
      const circle = arcPts([0, 0], r, 0, 2 * PI, 48);
      const poly = (n: number, a0: number) => Array.from({ length: n + 1 }, (_, i): P2 => [r * Math.cos(a0 + (i * 2 * PI) / n), r * Math.sin(a0 + (i * 2 * PI) / n)]);
      return { lines: [circle, poly(8, -PI / 2)], thin: [poly(16, -PI / 2)], fills: [] };
    }
    case "solids": {
      // a regular solid (Theaetetus): the octahedron in a slight turn, its hidden edges thin
      const T: P2 = [0, -0.85];
      const Bt: P2 = [0, 0.85];
      const Lq: P2 = [-0.72, 0.04];
      const Rq: P2 = [0.72, -0.04];
      const F: P2 = [0.18, 0.24];
      const K: P2 = [-0.18, -0.22];
      const front = [[T, Lq], [T, F], [T, Rq], [Bt, Lq], [Bt, F], [Bt, Rq], [Lq, F, Rq]] as P2[][];
      const back = [[T, K], [Bt, K], [Lq, K, Rq]] as P2[][];
      return { lines: front, thin: back, fills: [] };
    }
    case "elements": {
      // Euclid I.1: the equilateral triangle on a line, from two circles (+ notation lines beside it)
      const A: P2 = [-0.3, 0.2];
      const B: P2 = [0.3, 0.2];
      const C: P2 = [0, 0.2 - 0.6 * Math.sin(PI / 3)];
      const c1 = arcPts(A, 0.6, 0, 2 * PI, 40);
      const c2 = arcPts(B, 0.6, 0, 2 * PI, 40);
      return { ...fitBox([c1, c2, [A, B], [A, C, B]], [], 0.9), thin: [] };
    }
    case "arithmetica":
      return { lines: [], thin: [], fills: [] };
    default:
      return { lines: [], thin: [], fills: [] };
  }
};
/** rows of algebra-like marks (Diophantus' Arithmetica: a hook like his unknown, a delta-upsilon square, a bar):
 *  polylines in a unit box 0..1 x 0..1 */
const glyphRows = (rows: number, seed: number): P2[][] => {
  const out: P2[][] = [];
  const hsh = (i: number) => {
    const s = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let r = 0; r < rows; r++) {
    const y = (r + 0.5) / rows;
    const h = 0.42 / rows;
    let x = 0.04 + 0.04 * hsh(r);
    let g = 0;
    while (x < 0.92) {
      const kind = Math.floor(hsh(r * 31 + g * 7) * 5);
      const w = h * (kind === 3 ? 0.4 : 0.85);
      if (kind === 0) out.push([[x, y - h * 0.5], [x + w * 0.9, y - h * 0.5], [x + w * 0.2, y + h * 0.1], [x + w * 0.6, y + h * 0.5]]); // a hook (the unknown)
      else if (kind === 1) out.push([[x, y + h * 0.5], [x + w * 0.5, y - h * 0.5], [x + w, y + h * 0.5], [x, y + h * 0.5]]); // delta
      else if (kind === 2) out.push([[x, y - h * 0.5], [x + w * 0.5, y], [x + w, y - h * 0.5]], [[x + w * 0.5, y], [x + w * 0.5, y + h * 0.5]]); // upsilon
      else if (kind === 3) out.push([[x + w * 0.5, y - h * 0.5], [x + w * 0.5, y + h * 0.5]]); // a bar (unit)
      else out.push([[x, y + h * 0.4], [x + w * 0.3, y - h * 0.4], [x + w * 0.6, y + h * 0.4], [x + w, y - h * 0.4]]); // M
      x += w + h * 0.35;
      g++;
      if (hsh(r * 13 + g) > 0.72) x += h * 0.9;
    }
  }
  return out;
};
/** short notation lines (text) in a unit box */
const textRows = (rows: number, seed: number, x0 = 0.05, x1 = 0.95): P2[][] => {
  const out: P2[][] = [];
  const hsh = (i: number) => {
    const s = Math.sin(i * 7.137 + seed * 41.17) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let r = 0; r < rows; r++) {
    const y = (r + 0.5) / rows;
    let x = x0;
    let g = 0;
    while (x < x1 - 0.06) {
      const w = 0.08 + 0.2 * hsh(r * 17 + g);
      out.push([[x, y], [Math.min(x1, x + w), y]]);
      x += w + 0.05;
      g++;
    }
  }
  return out;
};

// ===================================================================================================================
// THE ARMS IN 3D: a pose may carry each hand's camera-space depth (dz: + toward the camera); the elbow is solved in 3D
// and projected, so a forearm coming toward us foreshortens instead of folding sideways (the 2D rig's "chicken wing")
// ===================================================================================================================
/** a FigPose with each hand's camera-space depth (rig units, + toward the camera): [armL (his right), armR (his left)].
 *  Without dz the hands sit at their shoulder's depth (the RomeFolk poses: arms in the body's plane). */
export type GPose = FigPose & { dz?: [number, number] };
export const defaultDz = (q: FigPose, hw = 45): [number, number] => {
  const s = Math.sin(q.yaw);
  return [hw * s, -hw * s];
};
export type GArm = { S: P2; E: P2; W: P2; dir: P2; grip: P2; sgn: number; z: number; fist: number; Zs: number; Zw: number; Ze: number; Zreq: number };
export const greekArms = (spec: Spec, q: GPose, rig?: Rig): { L: GArm; R: GArm; rig: Rig } => {
  const r = rig ?? figureRig(spec, q);
  const s = r.s;
  const c = r.c;
  const dz = q.dz ?? defaultDz(q, spec.hw);
  const L1 = spec.arm[0];
  const L2 = spec.arm[1];
  const arm = (ar: ArmRig, ap: FigPose["armL"], zw0: number): GArm => {
    const Zs = ar.z * spec.hw;
    const d2 = sub(ar.W, ar.S);
    const D2 = vlen(d2);
    const reach = L1 + L2 - 0.3;
    const maxDz = Math.sqrt(Math.max(0, reach * reach - D2 * D2));
    const Zw = Zs + Math.max(-maxDz, Math.min(maxDz, zw0 - Zs));
    const d3 = [d2[0], d2[1], Zw - Zs];
    const D = Math.max(1e-3, Math.hypot(d3[0], d3[1], d3[2]));
    const u = d3.map((v) => v / D);
    const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    // the elbow's side: the pose's screen hint, and back (behind the body's plane) and out
    const hint = [ap.elbow[0], ap.elbow[1], -ar.sgn * 0.5 * s - 0.45 * c];
    const hu = hint[0] * u[0] + hint[1] * u[1] + hint[2] * u[2];
    let n = hint.map((v, i) => v - u[i] * hu);
    let nl = Math.hypot(n[0], n[1], n[2]);
    if (nl < 1e-3) {
      n = [0 - u[0] * u[1], 1 - u[1] * u[1], 0 - u[2] * u[1]];
      nl = Math.hypot(n[0], n[1], n[2]) || 1;
    }
    n = n.map((v) => v / nl);
    const E: P2 = [ar.S[0] + u[0] * a + n[0] * h, ar.S[1] + u[1] * a + n[1] * h];
    const Ze = Zs + u[2] * a + n[2] * h;
    // the hand's direction: along the drawn forearm where it is long enough on screen, else the rig's
    const fa = sub(ar.W, E);
    const fl = vlen(fa);
    const rigBase = rot(ar.dir, -ap.hand);
    const wB = sst(0.22 * L2, 0.55 * L2, fl);
    const mixed: P2 = fl > 1e-3 ? mix2(rigBase, norm(fa), wB) : rigBase;
    const base = vlen(mixed) > 1e-3 ? norm(mixed) : rigBase;
    const dir = rot(base, ap.hand);
    return { S: ar.S, E, W: ar.W, dir, grip: add(ar.W, mul(dir, 11 * spec.limb)), sgn: ar.sgn, z: ar.z, fist: ar.fist, Zs, Zw, Ze, Zreq: zw0 };
  };
  return { L: arm(r.armL, q.armL, dz[0]), R: arm(r.armR, q.armR, dz[1]), rig: r };
};

// ===================================================================================================================
// BUILD
// ===================================================================================================================
const DEAD_C = "#8A7B62";
export const buildGreekFolk = (kind: GreekKind, variant: number, q: GPose, o: GreekBuildOpts = {}): GreekBuild => {
  const look0 = greekLookOf(kind, variant);
  const look: GLook = { ...look0, dress: o.dress ?? look0.dress, hair: o.hair ?? look0.hair, beard: o.beard ?? look0.beard };
  const ink0: GreekInks = { ...look.inks, ...(o.inks ?? {}) };
  const dr = c01(o.drain ?? 0);
  const ink: GreekInks = dr <= 0 ? ink0 : (Object.fromEntries(Object.entries(ink0).map(([kk, v]) => [kk, mixC(v, kk === "skin" ? "#B8A890" : DEAD_C, kk === "skin" ? 0.45 * dr : 0.85 * dr)])) as GreekInks);
  const sp = look.spec;
  const female = look.female;
  const dress = look.dress;
  const r = figureRig(sp, q);
  const GA = greekArms(sp, q, r);
  const k = sp.limb;
  const shY = r.shY;
  const G = r.s >= 0 ? 1 : -1;
  const toFig = r.toFig;
  const held = o.held ?? {};
  const items: GreekBuild["items"] = {};
  const frontVis = sst(-0.12, 0.22, Math.cos(q.yaw));

  // ---- colours ----------------------------------------------------------------------------------------------------
  const skin = ink.skin;
  const skinSh = mixC(skin, "#8A5A44", 0.22);
  const blush = "#D98A80";
  const eye = "#2A201A";
  const chiton = ink.chiton;
  const him = ink.himation;
  const himLt = mixC(him, "#FFFFFF", 0.22);
  const shadeOf = (c: string, t = 0.12) => mixC(c, "#2C3433", t);

  // ---- the lathe ----------------------------------------------------------------------------------------------------
  const rows = greekRows(look, shY);
  const B = makeLathe(rows, q.yaw);
  const tor = (phi: number, y: number, out = 0) => toFig(B.at(phi, y, out).p);
  const torX = (x: number, y: number, out = 0) => tor(B.phiOfX(x, y), y, out);
  const torsoOutline = (yTop: number, yBot: number, out = 0): P2[] => {
    const n = 14;
    const right: P2[] = [];
    const left: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const y = mix(yTop, yBot, i / n);
      const [l, rr] = B.edge(y, out);
      right.push(toFig([rr, y]));
      left.push(toFig([l, y]));
    }
    return [...right, ...left.reverse()];
  };
  /** a cloth region on the body between angles [a, b] (null = the whole visible half) and heights yTop(phi)..yBot(phi):
   *  the outlines of its visible parts (each grows from the silhouette as it turns into view) */
  let latheVisW = PI;
  const latheParts = (a: number | null, b: number | null, yTop: (phi: number) => number, yBot: (phi: number) => number, out = 1, n = 26): P2[][] => {
    // the visible half differs a little by row (each row's own terminator): the region is clipped to the widest of
    // them, and each point is clamped to its own row's half, so a region turning out of view shrinks to the silhouette
    // on every row before it is dropped (never a sliver popping off)
    const ys = [yTop(0), mix(yTop(0), yBot(0), 0.33), mix(yTop(0), yBot(0), 0.66), yBot(0), yTop(PI / 2), yBot(PI / 2), yTop(-PI / 2), yBot(-PI / 2)];
    const ts = ys.map((y) => B.vis(y, out)[1]);
    const ym = mix(yTop(0), yBot(0), 0.5);
    const v0 = B.vis(ym, out);
    const v: [number, number] = a !== null && b !== null ? [Math.min(...ts) - PI, Math.max(...ts)] : v0;
    const parts: [number, number, number][] = a !== null && b !== null ? visParts(a, b, v) : [[v[0], v[1], 0]];
    // how much of the range shows at the middle row (radians): a region turning out of view fades with it
    latheVisW = a !== null && b !== null ? Math.max(0, ...visParts(a, b, v0).map(([lo, hi]) => hi - lo)) : PI;
    return parts.map(([lo, hi, shift]) => {
      const m = a !== null && b !== null ? Math.max(4, Math.round((n * (hi - lo)) / Math.max(1e-3, b - a))) : n;
      const top: P2[] = [];
      const bot: P2[] = [];
      for (let i = 0; i <= m; i++) {
        const ph = mix(lo, hi, i / m);
        top.push(tor(ph, yTop(ph - shift), out));
        bot.push(tor(ph, yBot(ph - shift), out));
      }
      return [...top, ...bot.reverse()];
    });
  };
  /** the region as one path d (all its visible parts), or "" */
  const lathe = (a: number | null, b: number | null, yTop: (phi: number) => number, yBot: (phi: number) => number, out = 1, n = 26, tension = 0.7): string =>
    latheParts(a, b, yTop, yBot, out, n)
      .map((pp) => closedD(cw(pp), tension))
      .join(" ");
  /** the depth-visibility of a point on the body (0 hidden .. 1 facing us) */
  const visAt = (phi: number, y: number) => sst(-0.05, 0.25, B.at(phi, y).d);

  // ---- the head ---------------------------------------------------------------------------------------------------
  const HR = HEAD_R * look.head * (female ? 0.96 : 1);
  const fs = HR / 31.5;
  const head: Head = {
    C: add(r.headC, rot([0, -HEAD_UP], r.headAngle)),
    R: HR,
    roll: r.headAngle,
    yaw: q.headYaw,
    pitch: Math.max(-0.42, Math.min(0.5, ((q.pitch * PI) / 180) * 0.8)) * Math.cos(q.headYaw),
  };

  // ---- held things (rig units) --------------------------------------------------------------------------------------
  const grips = { L: GA.L.grip, R: GA.R.grip };
  const twoShapes: GShape[] = [];
  const oneShapes: Record<"L" | "R", GShape[]> = { L: [], R: [] };
  const glowLines = (T: (p: P2) => P2, lines: P2[][], w: number, op = 1, col = ACCENT): GShape[] =>
    lines.length ? [{ d: lines.map((l) => lineD(l.map(T))).join(" "), fill: col, glow: w * FU, op }] : [];
  const glowFills = (T: (p: P2) => P2, fills: P2[][], op = 0.3): GShape[] => fills.map((f) => ({ d: closedD(f.map(T), 0.4), fill: ACCENT, gfill: true, op, sh: 0 }));
  const diagramOn = (dg: DiagramSpec | undefined, T: (p: P2) => P2, size: number, onLight: boolean): GShape[] => {
    if (!dg || dg === "none") return [];
    const art = diagramArt(dg);
    const w = Math.max(1.3, size * 0.034);
    const col = onLight ? ACCENT_DEEP : ACCENT;
    return [...glowFills(T, art.fills, onLight ? 0.35 : 0.28), ...glowLines(T, art.thin, w * 0.55, 0.7, col), ...glowLines(T, art.lines, w, 1, col)];
  };
  if (held.two) {
    // fitted between the two grips: the hands hold its two side edges at mid-height
    const gA = G > 0 ? grips.L : grips.R;
    const gB = G > 0 ? grips.R : grips.L;
    const nearFirst = gA[0] <= gB[0];
    const p0 = nearFirst ? gA : gB;
    const p1 = nearFirst ? gB : gA;
    const u = vlen(sub(p1, p0)) > 1 ? norm(sub(p1, p0)) : ([1, 0] as P2);
    const nUp: P2 = [u[1], -u[0]];
    const c = mix2(p0, p1, 0.5);
    const half = vlen(sub(p1, p0)) / 2 + 3;
    const tilt = c01(held.tilt ?? 0);
    if (held.two === "tablet") {
      const hh = (TABLET.h / 2) * (1 - 0.6 * tilt);
      const M = (p: P2): P2 => add(c, add(mul(u, p[0] * half), mul(nUp, -p[1] * hh)));
      const corners = [M([-1, -1]), M([1, -1]), M([1, 1]), M([-1, 1])];
      // the frame's thickness (the lower edge seen a little from above), the frame, the wax face, the diagram
      twoShapes.push({ d: closedD([M([-1, 1]), M([1, 1]), add(M([1, 1]), mul(nUp, -4)), add(M([-1, 1]), mul(nUp, -4))], 0.3), fill: WOOD.dark, sh: 0 });
      twoShapes.push({ d: closedD(corners, 0.18), fill: WOOD.mid });
      const fx = 1 - TABLET.frame / half;
      const fy = 1 - TABLET.frame / hh;
      const face = [M([-fx, -fy]), M([fx, -fy]), M([fx, fy]), M([-fx, fy])];
      twoShapes.push({ d: closedD(face, 0.12), fill: WAX, sh: 0.5 });
      const Tf = (p: P2): P2 => M([p[0] * fx * 0.86, p[1] * fy * 0.84]);
      twoShapes.push(...diagramOn(held.diagram ?? "thales", Tf, Math.min(half, hh) * 2, false));
      items.tablet = { c, corners };
    } else {
      // the open scroll: a roller in each fist, the sheet between
      const hh = (SCROLL.h / 2) * (1 - 0.6 * tilt);
      const M = (p: P2): P2 => add(c, add(mul(u, p[0] * (half - 2)), mul(nUp, -p[1] * hh)));
      const sheet = [M([-1, -0.92]), M([-0.3, -0.98]), M([0.3, -0.92]), M([1, -0.98]), M([1, 0.94]), M([0.3, 0.98]), M([-0.3, 0.92]), M([-1, 0.98])];
      twoShapes.push({ d: closedD(sheet, 0.35), fill: PAPYRUS.mid });
      for (const sgn of [-1, 1]) {
        const top = M([sgn, -1.22]);
        const bot = M([sgn, 1.22]);
        twoShapes.push({ d: tubeD([top, bot], [SCROLL.roll * 2, SCROLL.roll * 2]), fill: PAPYRUS.lit });
        twoShapes.push({ d: ellD(add(top, mul(nUp, 2)), 3.4, 2.6), fill: WOOD.mid, sh: 0 });
        twoShapes.push({ d: ellD(add(bot, mul(nUp, -2)), 3.4, 2.6), fill: WOOD.mid, sh: 0 });
      }
      const dg = held.diagram ?? "elements";
      if (dg === "arithmetica") {
        const T = (p: P2): P2 => M([mix(-0.82, 0.82, p[0]), mix(-0.78, 0.78, p[1])]);
        twoShapes.push(...glowLines(T, glyphRows(5, 3), Math.max(1.2, hh * 0.075), 1, ACCENT_DEEP));
      } else {
        // a diagram in the left half, notation lines in the right
        const Td = (p: P2): P2 => M([-0.45 + p[0] * 0.42, p[1] * 0.78]);
        twoShapes.push(...diagramOn(dg, Td, hh * 1.6, true));
        const Tt = (p: P2): P2 => M([mix(0.08, 0.86, p[0]), mix(-0.76, 0.76, p[1])]);
        twoShapes.push(...glowLines(Tt, textRows(6, 2), Math.max(1.0, hh * 0.05), 0.85, ACCENT_DEEP));
      }
      items.scroll = { c, corners: [M([-1, -1]), M([1, -1]), M([1, 1]), M([-1, 1])] };
    }
  }
  const oneHeld = (key: "L" | "R") => {
    const what = held[key];
    if (!what) return;
    const ar = GA[key];
    const g = ar.grip;
    const out = oneShapes[key];
    const hd = ar.dir;
    if (what === "dividers") {
      // held by the hinge in the fist, the legs along the hand's direction, opened
      const open = o.dividersOpen ?? DIVIDERS.open;
      // the legs point up and a little out from his body and forward (a body-space direction turned by the yaw:
      // continuous through any turn, where the projected forearm would spin as it points at us)
      const sOut = ar.sgn * 0.42;
      const dvx = sOut * Math.cos(q.yaw) + 0.22 * Math.sin(q.yaw);
      const hd2 = norm([dvx, -1]);
      void hd;
      const hdD = hd2;
      const hinge = add(g, mul(hdD, -4));
      const tips: P2[] = [-1, 1].map((sg) => add(hinge, mul(rot(hdD, (sg * open) / 2), DIVIDERS.len))) as P2[];
      for (const [i, tp] of tips.entries()) {
        const dd = norm(sub(tp, hinge));
        out.push({ d: tubeD([hinge, add(hinge, mul(dd, DIVIDERS.len * 0.55)), tp], [5.2, 4.2, 1.2]), fill: i === 0 ? BRONZE.mid : BRONZE.lit, sh: 0.6 });
      }
      out.push({ d: ellD(add(hinge, mul(hdD, -3)), 5.2, 5.2), fill: BRONZE.lit, sh: 0.5 });
      items.dividersTips = [tips[0], tips[1]];
    } else if (what === "pen") {
      // the reed pen: a thin reed through the fist, pointing down and forward
      const pd = norm([0.42 * G, 0.9]);
      const tip = add(g, mul(pd, PEN.len * 0.62));
      const tail = add(g, mul(pd, -PEN.len * 0.38));
      out.push({ d: tubeD([tail, mix2(tail, tip, 0.8), tip], [4.6, 3.6, 1.6]), fill: "#8C7A5C", sh: 0 });
      items.penTip = tip;
    } else if (what === "stick") {
      // the stick: from the fist down to the ground ahead (its tip ON the ground line every frame)
      const gy = o.groundY ?? 0;
      const dyv = gy - g[1];
      const dx = Math.sqrt(Math.max(0, STICK.len * STICK.len - dyv * dyv));
      const tip: P2 = dyv >= STICK.len ? [g[0], g[1] + STICK.len] : [g[0] + G * dx, gy];
      const u = norm(sub(tip, g));
      const butt = add(g, mul(u, -16));
      out.push({ d: tubeD([butt, add(g, mul(u, STICK.len * 0.5)), tip], [6.6, 5.4, 3.4]), fill: WOOD.mid, sh: 0.5 });
      items.stickTip = tip;
      items.stickGrip = g;
    } else if (what === "scrollClosed") {
      const u = rot(hd, 90);
      out.push({ d: tubeD([add(g, mul(u, -22)), add(g, mul(u, 22))], [12, 12]), fill: PAPYRUS.lit });
      out.push({ d: ellD(add(g, mul(u, 23)), 4, 6, (Math.atan2(u[1], u[0]) * 180) / PI), fill: PAPYRUS.dark, sh: 0 });
    } else if (what === "scrollHang") {
      // the scroll held by its top roller, the sheet unrolled hanging down (a little toward the way he faces), the
      // lower roller hanging at its end; the diagram faces us
      const ang = ((o.hangAng ?? 18) * G * PI) / 180;
      const down: P2 = [Math.sin(-ang) * -1, Math.cos(ang)];
      const across: P2 = [down[1], -down[0]];
      const hw2 = SCROLL.hangW / 2;
      const top = add(g, mul(down, 4));
      const M = (p: P2): P2 => add(top, add(mul(across, p[0] * hw2), mul(down, p[1] * SCROLL.hangL)));
      const sheet = [M([-0.96, 0]), M([0.96, 0]), M([0.92, 0.5]), M([0.96, 1]), M([-0.96, 1]), M([-0.92, 0.5])];
      out.push({ d: closedD(sheet, 0.3), fill: PAPYRUS.mid });
      out.push({ d: tubeD([M([-1.12, 1]), M([1.12, 1])], [SCROLL.roll * 2, SCROLL.roll * 2]), fill: PAPYRUS.lit });
      const dgH = held.diagram ?? "elements";
      if (dgH === "arithmetica") {
        // rows of algebra-like marks down the sheet
        const Tg = (p: P2): P2 => M([mix(-0.8, 0.8, p[0]), mix(0.08, 0.9, p[1])]);
        out.push(...glowLines(Tg, glyphRows(6, 7), 1.5, 1, ACCENT_DEEP));
      } else {
        const T = (p: P2): P2 => M([p[0] * 0.78, 0.5 + p[1] * 0.36]);
        out.push(...diagramOn(dgH, T, SCROLL.hangW * 0.9, true));
        const Tt = (p: P2): P2 => M([mix(-0.78, 0.78, p[0]), mix(0.1, 0.22, p[1])]);
        out.push(...glowLines(Tt, textRows(2, 5), 1.1, 0.85, ACCENT_DEEP));
      }
      out.push({ d: tubeD([M([-1.12, -0.02]), M([1.12, -0.02])], [SCROLL.roll * 2, SCROLL.roll * 2]), fill: PAPYRUS.lit });
      items.scroll = { c: M([0, 0.5]), corners: [M([-1, 0]), M([1, 0]), M([1, 1]), M([-1, 1])] };
    }
  };
  oneHeld("L");
  oneHeld("R");

  // ---- the arms ---------------------------------------------------------------------------------------------------
  type Sleeve = "bare" | "chiton" | "himation" | "long";
  const sleeveOf = (ar: GArm): Sleeve => {
    // his left arm is the rig's armR (sgn > 0)
    const left = ar.sgn > 0;
    if (dress === "exomis") return left ? "chiton" : "bare";
    if (dress === "himation") return left ? "himation" : "chiton";
    if (dress === "shawl" || dress === "veil") return "long";
    return "chiton";
  };
  const mitten = (ar: GArm): GShape[] => {
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
    const ang = (Math.atan2(d[1], d[0]) * 180) / PI;
    const tb = add(add(ar.W, mul(d, 6 * k)), mul(n, ts * 7 * k));
    return [
      { d: ellD(add(tb, mul(rot(d, -ts * mix(28, 70, fist)), 4 * k)), 5.4 * k, 4.2 * k, ang - ts * mix(28, 70, fist)), fill: skin, sh: 0.5 },
      { d: ellD(c, len * 0.56, wid * 0.5, ang), fill: skin },
    ];
  };
  /** the arm: part "all" (one tube, shoulder to wrist, with its sleeve), "upper" (shoulder to elbow with the
   *  sleeve) or "fore" (elbow to wrist) */
  const armTube = (ar: GArm, part: "all" | "upper" | "fore" = "all"): GShape[] => {
    const out: GShape[] = [];
    const sk = sleeveOf(ar);
    const uu = norm(sub(ar.E, ar.S));
    const sh0 = add(ar.S, mul(uu, 4));
    if (part === "all") out.push({ d: tubeD([sh0, mix2(ar.S, ar.E, 0.5), ar.E, mix2(ar.E, ar.W, 0.3), mix2(ar.E, ar.W, 0.72), ar.W], [27 * k, 25 * k, 21 * k, 21.5 * k, 18 * k, 15.5 * k]), fill: skin });
    else if (part === "upper") out.push({ d: tubeD([sh0, mix2(ar.S, ar.E, 0.5), ar.E], [27 * k, 25 * k, 21 * k]), fill: skin });
    else {
      out.push({ d: tubeD([ar.E, mix2(ar.E, ar.W, 0.3), mix2(ar.E, ar.W, 0.72), ar.W], [21 * k, 21.5 * k, 18 * k, 15.5 * k]), fill: skin });
      return out;
    }
    const no = mul([-uu[1], uu[0]] as P2, -ar.sgn);
    if (sk === "chiton" || sk === "long") {
      // a loose sleeve flaring out of the body's silhouette (to above the elbow; a woman's to the elbow)
      const fr = sk === "long" ? 0.92 : 0.52;
      const end = mix2(ar.S, ar.E, fr);
      const flare = (sk === "long" ? 15 : 15.5) * k;
      const col = sk === "long" && (dress === "shawl" || dress === "veil") ? him : chiton;
      out.push({
        d: closedD([add(add(ar.S, mul(uu, -9)), mul(no, -12 * k)), add(add(ar.S, mul(uu, -11)), mul(no, 3 * k)), add(add(ar.S, mul(uu, 2)), mul(no, 14 * k)), add(add(end, mul(uu, -3)), mul(no, flare)), add(add(end, mul(uu, 4)), mul(no, flare * 0.4)), add(add(end, mul(uu, 4)), mul(no, -flare * 0.4)), add(add(end, mul(uu, -3)), mul(no, -flare)), add(add(ar.S, mul(uu, 12)), mul(no, -13 * k))], 1.0),
        fill: col,
      });
      if (look.pleats) out.push({ d: [0.3, 0.55].map((t) => lineD([add(mix2(ar.S, end, 0.2), mul(no, mix(-10, 12, t) * k)), add(end, mul(no, mix(-14, 16, t) * k))])).join(" "), fill: chiton, det: 1.2, op: 0.4 });
    } else if (sk === "himation") {
      // the himation over the left shoulder and upper arm to the elbow, one big soft fold hanging under it
      const tEnd = mix2(ar.E, ar.W, 0.12);
      out.push({ d: tubeD([add(ar.S, mul(uu, -6)), mix2(ar.S, ar.E, 0.5), ar.E, tEnd], [31 * k, 29 * k, 27 * k, 24 * k]), fill: him });
      const hang = add(ar.E, [0, 16 * k]);
      out.push({ d: closedD([add(mix2(ar.S, ar.E, 0.35), mul(no, 12 * k)), add(ar.E, mul(no, 14 * k)), add(hang, [G * 2, 8]), add(ar.E, mul(no, -12 * k)), add(mix2(ar.S, ar.E, 0.35), mul(no, -12 * k))], 0.7), fill: him });
      if (look.border) out.push({ d: tubeD([add(ar.E, mul(no, 14 * k)), add(hang, [G * 2, 7]), add(ar.E, mul(no, -12 * k))], [3.2, 3.2, 3.2]), fill: ink.border, sh: 0 });
      out.push({ d: tubeD([mix2(ar.S, ar.E, 0.25), mix2(ar.S, ar.E, 0.8)], [2, 6]), fill: him, cast: true, op: 0.35 });
    }
    return out;
  };

  // ---- the legs and feet --------------------------------------------------------------------------------------------
  const absS = Math.abs(r.s);
  const footPts = (): P2[] => {
    const front: P2[] = [[-9, -11], [0, -13], [9, -11], [12.5, -4], [10, 1], [0, 2], [-10, 1], [-12.5, -4]];
    const side: P2[] = [[-9, -12], [2, -13], [14, -9], [25, -4], [26, 0], [13, 2], [-7, 2], [-11, -4]];
    const t = sst(0, 0.55, absS);
    return front.map((p, i) => mix2(p, side[i], t));
  };
  const legShapes = (l: LegRig): GShape[] => {
    const out: GShape[] = [];
    const dark = 0.14 * sst(0.05, 0.45, -l.z);
    const legC = mixC(skin, "#5A4436", dark);
    const ank = l.A;
    out.push({ d: tubeD([add(l.H, [0, -6]), mix2(l.H, l.K, 0.5), l.K, mix2(l.K, ank, 0.32), mix2(l.K, ank, 0.72), ank], [31 * k, 28 * k, 22 * k, 23 * k, 18 * k, 15 * k]), fill: legC });
    const fp = footPts().map((p): P2 => add(ank, rot([p[0] * G * k, (p[1] + 13) * k], G * l.lift)));
    // sandals: the sole under the foot, a strap across the instep
    out.push({ d: closedD(fp.map((p) => add(p, rot([0, 1.8 * k], G * l.lift))), 0.9), fill: ink.leather, sh: 0 });
    out.push({ d: closedD(fp.map((p) => add(p, rot([0, -0.8 * k], G * l.lift))), 0.9), fill: legC });
    const u = norm(sub(ank, l.K));
    const nn: P2 = [-u[1], u[0]];
    out.push({ d: lineD([add(ank, mul(nn, -6 * k)), add(ank, add(mul(nn, 6 * k), mul(u, 3 * k)))]), fill: ink.leather, det: 2.2, keep: true, op: 0.9 });
    return out;
  };
  const legsSorted = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);

  // ---- the lower garments -------------------------------------------------------------------------------------------
  const hdx = q.hem - Math.tan((q.lean * PI) / 180) * 20;
  const skirtShapes: GShape[] = [];
  // the himation's lower drape is drawn AFTER the torso (one cloth: its top covers the torso's lower edge, so there is
  // no horizontal box edge at the waist, front or back)
  const drapeShapes: GShape[] = [];
  let himDrapeD = "";
  let himDrapeBorderD = "";
  const foldsOn = (outline: P2[], fill: string, n: number, op = 0.36, into: GShape[] = skirtShapes) => {
    const dd = closedD(outline, 0.8);
    const x0 = Math.min(...outline.map((p) => p[0]));
    const x1 = Math.max(...outline.map((p) => p[0]));
    const y0 = Math.min(...outline.map((p) => p[1]));
    const y1 = Math.max(...outline.map((p) => p[1]));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.7) / (n + 0.4);
      const top: P2 = [mix(x0 + 10, x1 - 10, mix(0.3, 0.75, t)), y0 + 18];
      const bot: P2 = [mix(x0 + 6, x1 - 6, t) + hdx * 0.3, y1 - 2];
      into.push({ d: tubeD([top, mix2(top, bot, 0.5), bot], [2.5, 6, 9]), fill, cast: true, op, clip: dd });
    }
  };
  if (dress === "exomis") {
    const sk = robeOutline(r, B, q, k, 0.98, 0.98, 6);
    skirtShapes.push({ d: closedD(sk, 0.8), fill: chiton });
    foldsOn(sk, chiton, 2);
  } else {
    // the chiton / peplos to the ankle
    const full = robeOutline(r, B, q, k, female ? 1.97 : 1.92, female ? 1.97 : 1.92, female ? 7 : 5.5);
    skirtShapes.push({ d: closedD(full, 0.8), fill: chiton });
    if (look.pleats || female) {
      const dd = closedD(full, 0.8);
      const x0 = Math.min(...full.map((p) => p[0]));
      const x1 = Math.max(...full.map((p) => p[0]));
      const y0 = Math.min(...full.map((p) => p[1]));
      const y1 = Math.max(...full.map((p) => p[1]));
      const np = look.pleats ? 6 : 3;
      skirtShapes.push({ d: Array.from({ length: np }, (_, i) => { const t = (i + 0.5) / np; return lineD([[mix(x0 + 12, x1 - 12, t), y0 + 24], [mix(x0 + 4, x1 - 4, t) + hdx * 0.3, y1 - 3]]); }).join(" "), fill: chiton, det: 1.3, op: 0.45, clip: dd });
    }
    if (!female && !(dress === "himation")) foldsOn(full, chiton, 2);
    if (female && dress !== "shawl") foldsOn(full, chiton, 3, 0.3);
    if (dress === "himation") {
      // the himation's lower drape to mid-calf, the hem higher on his right (the rig's legL); a border at the hem
      const lenR = 1.66;
      const lenL = 1.5;
      const hm = robeOutline(r, B, q, k, lenL, lenR, 7);
      // (the drape and the himation's band on the torso are ONE shape, made in the torso section below)
      if (look.border) {
        himDrapeBorderD = closedD(cw(hm), 0.8);
        himDrapeD = closedD(cw(robeOutline(r, B, q, k, lenL - 0.075, lenR - 0.075, 6.6)), 0.8);
      } else himDrapeD = closedD(cw(hm), 0.8);
      // long soft folds from the waist to the calves
      foldsOn(hm, him, 4, 0.36, drapeShapes);
    }
    if (dress === "shawl" && female) foldsOn(full, chiton, 3, 0.3);
  }

  // ---- the torso ----------------------------------------------------------------------------------------------------
  const TORSO = torsoOutline(shY - 9, 8);
  const torsoD = closedD(TORSO, 0.9);
  const torsoShapes: GShape[] = [];
  const push = (arr: GShape[], s: GShape) => {
    if (s.d) arr.push(s);
  };
  torsoShapes.push({ d: torsoD, fill: chiton });
  // the round neckline (front only: fades as he turns away)
  if (frontVis > 0.01 && dress !== "veil" && dress !== "shawl") torsoShapes.push({ d: closedD([torX(-13, shY - 6, 0.8), torX(13, shY - 6, 0.8), torX(8, shY + 6, 0.8), torX(0, shY + 10, 0.8), torX(-8, shY + 6, 0.8)], 0.8), fill: skin, sh: 0, op: frontVis });
  /** the himation's upper edge round the body: the shoulder top on his left (phi = +pi/2), under the right arm
   *  (phi = -pi/2), a smooth diagonal across the chest and across the back */
  const himTop = (phi: number) => shY + 17 - 27 * Math.sin(phi) + 4 * Math.cos(phi) * Math.cos(phi);
  /** a soft fold (a cast-shadow stroke) along points (phi, y) on the body, fading as it turns away */
  const foldOnBody = (arr: GShape[], pts: [number, number][], ws: number[], fill: string, op: number, out: number, clip?: string) => {
    let vmin = 1;
    const fp = pts.map(([ph, y]) => {
      vmin = Math.min(vmin, visAt(ph, y));
      return tor(ph, y, out);
    });
    if (vmin > 0.02) arr.push({ d: tubeD(fp, ws), fill, cast: true, op: op * vmin, clip });
  };
  if (dress === "exomis") {
    // pinned on the left shoulder: his right shoulder and chest bare above the cloth's diagonal edge, a belt
    torsoShapes[0] = { d: torsoD, fill: skin };
    push(torsoShapes, { d: lathe(null, null, (p) => himTop(p) + 4, () => 8, 1.0, 40), fill: chiton });
    push(torsoShapes, { d: lathe(null, null, () => -19, () => -11, 1.4, 26, 0.6), fill: ink.belt, sh: 0.5 });
    const kn = B.at(PI / 2 - 0.25, shY - 2, 2);
    torsoShapes.push({ d: ellD(toFig(kn.p), 5.5, 5), fill: shadeOf(chiton, 0.25), sh: 0.4, op: sst(-0.3, 0.1, kn.d) });
  } else if (dress === "himation") {
    const band = lathe(null, null, himTop, () => 8, 1.2, 40);
    // one cloth: the band round the torso and the drape to the calves in one path (one outline, one crescent: no
    // box edge at the waist, front or back); the border hem under it
    if (himDrapeBorderD) torsoShapes.push({ d: himDrapeBorderD, fill: ink.border });
    push(torsoShapes, { d: [band, himDrapeD].filter(Boolean).join(" "), fill: him });
    // the rolled upper edge (lighter), the border under it
    push(torsoShapes, { d: lathe(null, null, (p) => himTop(p) - 2, (p) => himTop(p) + 6, 1.8, 40, 0.6), fill: himLt, sh: 0.5 });
    if (look.border) push(torsoShapes, { d: lathe(null, null, (p) => himTop(p) + 6, (p) => himTop(p) + 10.5, 1.8, 40, 0.6), fill: ink.border, sh: 0 });
    // big soft folds from the left shoulder across to the right hip (front and back), fading as they turn away
    for (const base of [0, 1, 2]) {
      for (const side of [0, PI]) {
        const pts: [number, number][] = [];
        for (let j = 0; j <= 6; j++) {
          const t = j / 6;
          const ph = side === 0 ? mix(0.95 - base * 0.1, -0.75 + base * 0.15, t) : mix(PI - 0.95 + base * 0.1, PI + 0.75 - base * 0.15, t);
          pts.push([ph, mix(shY + 26 + base * 18, -12 - base * 4, t) + 10 * Math.sin(PI * t)]);
        }
        foldOnBody(torsoShapes, pts, [2, 5, 7, 7, 6, 4, 2], him, 0.34, 1.6, band || undefined);
      }
    }
  } else if (dress === "peplos" || dress === "veil" || dress === "shawl") {
    if (dress !== "shawl") {
      // the peplos' overfold (apoptygma) over a high belt, its hem a soft curve
      push(torsoShapes, { d: lathe(null, null, () => shY - 9, (p) => -34 + 4 * Math.cos(2 * p), 1.4, 30), fill: mixC(chiton, "#FFFFFF", 0.1) });
      push(torsoShapes, { d: lathe(null, null, () => shY + 34, () => shY + 40, 1.8, 26, 0.6), fill: ink.belt, sh: 0.4 });
      for (const sg of [-1, 1]) {
        const pp = B.at(sg * 0.55, shY - 6, 2);
        torsoShapes.push({ d: ellD(toFig(pp.p), 3, 3), fill: "#BBA06A", sh: 0, op: sst(-0.1, 0.2, pp.d) });
      }
    } else push(torsoShapes, { d: lathe(null, null, () => shY + 30, () => shY + 36, 1.8, 26, 0.6), fill: ink.belt, sh: 0.4 });
    // the himation round both shoulders (shawl and veil): its two ends hang down the front as lapels, open between
    const shawlBot = (p: number) => {
      const front = Math.max(0, Math.cos(p));
      return mix(shY + 58, shY + 92, Math.pow(front, 0.6));
    };
    const vOpen = (p: number) => Math.pow(Math.max(0, 1 - Math.abs(wrapPi(p)) / 0.5), 1.4);
    const shawlTop = (p: number) => mix(shY - 10, shawlBot(p), vOpen(p));
    push(torsoShapes, { d: lathe(null, null, shawlTop, shawlBot, 2.2, 48, 0.6), fill: him });
    for (const sg of [-1, 1]) foldOnBody(torsoShapes, [0, 1, 2, 3, 4].map((j) => [sg * mix(0.8, 1.35, j / 4), mix(shY + 4, shY + 50, j / 4)] as [number, number]), [2, 5, 6, 5, 2], him, 0.32, 2.4);
  }
  // the himation's ends: the front end from the left shoulder down the front, the back end down the back
  const panelShapes: GShape[] = [];
  if (dress === "himation") {
    const yEnd = -12 + (sp.leg[0] + sp.leg[1]) * 0.62;
    const yEndF = yEnd - 6;
    const pf = lathe(0.82, 1.42, (p) => himTop(p) - 4, (p) => yEndF + 8 * Math.sin((p - 0.82) * 5), 2.6, 16, 0.6);
    const pfOp = sst(0, 0.3, latheVisW);
    if (pf) {
      panelShapes.push({ d: pf, fill: him, op: pfOp });
      if (look.border) push(panelShapes, { d: lathe(0.82, 0.92, (p) => himTop(p) - 4, () => yEndF + 2, 3.0, 6, 0.5), fill: ink.border, sh: 0, op: pfOp });
      foldOnBody(panelShapes, [0, 1, 2, 3, 4, 5].map((j) => [1.12, mix(shY + 10, yEndF - 10, j / 5)] as [number, number]), [2, 4, 5, 5, 4, 2], him, 0.36 * pfOp, 3.2, pf);
    }
    const pb = lathe(PI - 1.5, PI - 0.85, (p) => himTop(p) - 4, (p) => yEnd + 6 * Math.sin((p - 1.6) * 4), 2.6, 16, 0.6);
    const pbOp = sst(0, 0.3, latheVisW);
    if (pb) {
      panelShapes.push({ d: pb, fill: mixC(him, "#2C3433", 0.04), op: pbOp });
      if (look.border) push(panelShapes, { d: lathe(PI - 0.95, PI - 0.85, (p) => himTop(p) - 2, () => yEnd + 2, 3.0, 6, 0.5), fill: ink.border, sh: 0, op: pbOp });
    }
  }

  // ---- the head ---------------------------------------------------------------------------------------------------
  const headShapes: GShape[] = [];
  const headBehind: GShape[] = [];
  const hy = head.yaw;
  const earAt = (sgn: number) => hProj(head, sgn * 1.62, 0.0, 1.0);
  const veil = dress === "veil";
  const longHair = look.hair === "long";
  if (!veil) {
    for (const sgn of [-1, 1]) {
      const e = earAt(sgn);
      headBehind.push({ d: ellD(e.p, 6.2 * fs, 8.4 * fs, head.roll), fill: skin, sh: 0.5 });
    }
  }
  // the bun at the back of the head: behind the head from the front, ON it seen from behind (a crossfade by its depth)
  const bunFront: GShape[] = [];
  if (look.hair === "bun" && !veil) {
    const bn = hProj(head, PI, 0.02, 1.1);
    headBehind.push({ d: ellD(bn.p, 13 * fs, 11.5 * fs, head.roll), fill: ink.hair });
    const wb = sst(-0.05, 0.3, bn.d);
    if (wb > 0.003) bunFront.push({ d: ellD(bn.p, 13 * fs, 11.5 * fs, head.roll), fill: ink.hair, op: wb });
  }
  const hairBehindBody: GShape[] = [];
  const hairFallTex: GShape[] = [];
  if (longHair) {
    // the long hair falls behind the neck to the shoulders (drawn behind the body): the hull of a small lathe hung
    // behind the head, turned with it
    const hl = headLathe(head, [
      { y: 0.1, a: 0.98, b: 0.9, c: -0.08 },
      { y: 0.7, a: 0.95, b: 0.75, c: -0.22 },
      { y: 1.35, a: 0.98, b: 0.6, c: -0.3 },
      { y: 1.75, a: 0.9, b: 0.5, c: -0.32 },
    ]);
    const all: P2[] = [];
    for (const yy of [0.1, 0.5, 1.0, 1.4, 1.72]) for (let i = 0; i < 16; i++) all.push(hl.pt(-PI + (2 * PI * i) / 16, yy, 0).p);
    // the fall's lower edge in lobes (they turn with the head), and strands down it (they show from behind)
    const subs2: P2[][] = [cw(hull(all))];
    for (let i = 0; i < 7; i++) {
      const pp = hl.pt(PI + mix(-1.2, 1.2, i / 6), 1.66, 0);
      subs2.push(cw(ellPts(pp.p, 0.2 * HR, 0.17 * HR, head.roll, 10)));
    }
    hairBehindBody.push({ d: subs2.map((s2) => closedF(s2.map(fF), 0.9)).join(" "), fill: mixC(ink.hair, "#2C3433", 0.06) });
    for (const ph of [-0.8, -0.3, 0.2, 0.7]) {
      const pts = [0.35, 0.75, 1.15, 1.5].map((y, j) => hl.pt(PI + ph + 0.07 * Math.sin(j * 2.2 + ph * 3), y, 0.02));
      const v = sst(0.05, 0.3, Math.min(...pts.map((pp) => pp.d)));
      if (v > 0.01) hairFallTex.push({ d: smoothOpen(pts.map((pp) => fF(pp.p))), fill: mixC(ink.hair, "#F3EBDD", 0.35), det: 1.8, keep: true, op: 0.6 * v });
    }
  }
  const headD = ellD(head.C, HR * 0.985, HR * 1.03, head.roll);
  headShapes.push({ d: headD, fill: skin });
  if (!veil && !longHair) {
    for (const sgn of [-1, 1]) {
      const e = earAt(sgn);
      const w = sst(-0.08, 0.2, e.d);
      if (w > 0.002) headShapes.push({ d: ellD(e.p, 6.2 * fs, 8.4 * fs, head.roll), fill: skin, sh: 0.5, op: w });
    }
  }
  // the face: dot eyes, blush, brows as two short arcs (calm: level and gently arched; knit: inner ends down)
  const brow = q.brow + look.brow;
  const lids = Math.max(q.lids, look.lids);
  for (const sgn of [-1, 1]) {
    const e = hProj(head, sgn * 0.36, 0.02 - 0.06 * lids);
    const v = sst(0.12, 0.38, e.d);
    if (v > 0.003) {
      const ry = 3.25 * fs * (1 - 0.42 * c01(lids));
      headShapes.push({ d: ellD(e.p, 2.65 * fs * mix(0.55, 1, e.d), ry, head.roll), fill: eye, sh: 0, op: v });
    }
    if (female && v > 0.003) {
      // a small lash at the eye's outer corner
      const l0 = hProj(head, sgn * 0.44, 0.06 - 0.06 * lids);
      const l1 = hProj(head, sgn * 0.54, 0.12 - 0.04 * lids);
      headShapes.push({ d: lineD([l0.p, l1.p]), fill: eye, det: 1.6, keep: true, op: 0.85 * v * sst(0.15, 0.35, l1.d) });
    }
    const b = hProj(head, sgn * 0.7, -0.3);
    const vb = sst(0.15, 0.4, b.d);
    if (vb > 0.003) headShapes.push({ d: ellD(b.p, 4.8 * fs * mix(0.6, 1, b.d), 3 * fs, head.roll), fill: blush, sh: 0, op: 0.5 * vb });
    const bAmt = Math.abs(brow);
    if (bAmt > 0.08) {
      const knit = Math.max(0, brow);
      const lift = Math.max(0, -brow);
      const inner = hProj(head, sgn * 0.2, 0.25 - 0.08 * knit + 0.05 * lift);
      const mid = hProj(head, sgn * 0.38, 0.29 + 0.04 * lift - 0.02 * knit);
      const outer = hProj(head, sgn * 0.56, 0.26 + 0.03 * lift);
      const ctrl: P2 = sub(mul(mid.p, 2), mul(add(inner.p, outer.p), 0.5));
      const vv = sst(0.15, 0.4, Math.min(inner.d, outer.d)) * sst(0.08, 0.22, bAmt);
      const bc = look.hair === "bald" || look.hair === "receding" ? mixC(ink.beard, "#2A201A", 0.25) : mixC(ink.hair, "#2A201A", 0.25);
      if (vv > 0.003) headShapes.push({ d: qD(inner.p, ctrl, outer.p), fill: bc, det: 2.4, keep: true, op: 0.8 * vv });
    }
  }
  // the hair: a cap on the sphere in a LIFTED tone, its fringe and crown scalloped by big overlapping lobes (a designed,
  // lobed silhouette), wave / curl strokes in a lighter tone fixed on the hair (they turn with the head), so a
  // three-quarter or back view of the head reads as drawn hair, never a flat dark area
  const hairCol = ink.hair;
  const lightHair = [HAIR.white, HAIR.grey, HAIR.silver, HAIR.greyBrown].includes(hairCol);
  const hairLt = mixC(hairCol, "#F3EBDD", lightHair ? 0.42 : 0.3);
  const hairDk = mixC(hairCol, "#2C2420", lightHair ? 0.2 : 0.2);
  /** the hairline at the front and sides (to just behind the ears) */
  const hairFront = (beta: number) => {
    const u = (1 - Math.cos(beta)) / 2;
    const temple = 0.14 * Math.sin(PI * u) ** 2;
    switch (look.hair) {
      case "close":
        return mix(0.52, -0.22, ease(u)) + temple;
      case "curly":
        return mix(0.5, -0.26, ease(u)) + temple;
      case "wavy":
        return mix(0.55, -0.28, ease(u)) + temple * 0.7;
      case "bun":
        // a woman's hair parted and drawn back: it comes low at the temples and covers the ears
        return mix(0.5, -0.32, ease(u)) - 0.3 * Math.sin(PI * u) ** 2;
      case "long":
        return mix(0.52, -0.55, ease(u)) - 0.2 * Math.sin(PI * u) ** 2;
      case "receding":
        return mix(0.95, -0.18, ease(u)) + 0.05 * Math.sin(PI * u);
      case "bald":
        return mix(1.4, -0.12, ease(Math.min(1, u * 1.25)));
      default:
        return mix(0.55, -0.2, ease(u)) + temple;
    }
  };
  /** behind the ears the hair comes down over the back of the skull to the NAPE (from behind: hair down to the neck,
   *  never a bare skull under a cap) */
  const NAPE: Record<GHair, number> = { close: -0.7, curly: -0.8, wavy: -0.8, bun: -0.88, long: -1.45, receding: -0.68, bald: 0 };
  const hairH = (beta: number) => {
    if (look.hair === "bald") return hairFront(beta);
    const ab = Math.abs(beta);
    const B0 = 1.8;
    if (ab <= B0) return hairFront(beta);
    return mix(hairFront(Math.sign(beta) * B0), NAPE[look.hair], ease(Math.min(1, (ab - B0) / 0.7)));
  };
  const hairSubs: P2[][] = [];
  const clumps: GShape[] = [];
  const lobe = (beta: number, phi: number, rad: number, rr = 1.03, shrinkAtEdge = false) => {
    const c = hProj(head, beta, phi, rr);
    if (c.d < -0.3) return;
    // (nape lobes shrink away as they reach the silhouette: no knob of hair sticking out behind the ear)
    const k2 = shrinkAtEdge ? sst(-0.05, 0.35, c.d) : 1;
    if (k2 < 0.02) return;
    hairSubs.push(cw(ellPts(c.p, rad * HR * k2, rad * HR * 0.92 * k2, head.roll, 12)));
  };
  /** a stroke on the hair: points (beta, phi) on the sphere, faded by their depth */
  const strand = (pts: [number, number][], w: number, col: string, op: number) => {
    const ps = pts.map(([b2, p2]) => hProj(head, b2, p2, 1.05));
    const v = sst(0.0, 0.3, Math.min(...ps.map((pp) => pp.d)));
    if (v > 0.01) clumps.push({ d: ps.length > 2 ? smoothOpen(ps.map((pp) => fF(pp.p))) : lineD(ps.map((pp) => pp.p)), fill: col, det: w, keep: true, op: op * v });
  };
  const hairOK = (b2: number, p2: number) => p2 > hairH(b2) + 0.1;
  if (!veil) {
    if (look.hair === "bald") {
      // a fringe round the back from above one ear to the other, the crown bare: puffs of white
      const band = regionPoly(head, (b2, p2) => Math.abs(b2) > 1.25 && p2 > -0.22 && p2 < 0.36 - 0.1 * Math.cos(b2), "top", 1.06);
      if (band.length > 2) hairSubs.push(cw(band.map((u) => hToFig(head, u))));
      for (const sgn of [-1, 1]) for (let i = 0; i < 5; i++) lobe(sgn * (1.3 + i * 0.4), 0.08 + 0.06 * Math.sin(i * 2.1), 0.17, 1.05);
      // the fringe round the back is a cloud of puffs: scalloped above and below, a few waves in it
      for (let bb = -2.9; bb <= 2.91; bb += 0.42) {
        if (Math.abs(bb) < 1.3) continue;
        lobe(bb, -0.2, 0.15, 1.05, true);
        lobe(bb + 0.21, 0.4 - 0.08 * Math.cos(bb), 0.14, 1.05, true);
      }
      lobe(PI, -0.2, 0.15, 1.05, true);
      for (const sgn of [-1, 1]) strand([[sgn * 1.5, 0.12], [sgn * 1.75, 0.2], [sgn * 2.0, 0.14]], 1.6, hairDk, 0.45);
      for (const bb of [2.4, -2.4, 2.85, -2.85]) strand([[bb - 0.12, 0.05], [bb, 0.15], [bb + 0.12, 0.06]], 1.6, hairDk, 0.4);
    } else {
      const hp = regionPoly(head, (b2, p2) => p2 > hairH(b2), "top", 1.05);
      if (hp.length > 2) hairSubs.push(cw(hp.map((u) => hToFig(head, u))));
      const H0 = look.hair;
      if (H0 === "wavy") {
        // a scalloped fringe and a lobed crown; S-waves back over the head
        for (let bb = -1.68; bb <= 1.69; bb += 0.42) lobe(bb, hairH(bb) + 0.07, 0.16);
        for (let bb = -PI; bb < PI; bb += 0.62) lobe(bb, 0.8, 0.2);
        for (let bb = -2.6; bb <= 2.61; bb += 0.65) lobe(bb, 0.36, 0.19);
        for (const bb of [-2.6, -1.9, -1.2, -0.45, 0.35, 1.1, 1.8, 2.5, PI]) {
          const p0 = Math.max(hairH(bb) + 0.16, 0.5);
          strand([[bb - 0.12, p0], [bb + 0.02, p0 + 0.09], [bb - 0.04, p0 + 0.19], [bb + 0.08, p0 + 0.29], [bb + 0.02, p0 + 0.38]], 2.0, hairLt, 0.7);
        }
        // the back of the head: a scalloped lower edge at the nape, S-waves down the back
        for (const sg of [-1, 1]) for (const bb of [2.05, 2.4, 2.75]) lobe(sg * bb, hairH(bb) + 0.06, 0.16, 1.03, true);
        lobe(PI, hairH(PI) + 0.06, 0.16, 1.03, true);
        for (const [bb, p0] of [[2.25, 0.1], [-2.25, 0.1], [2.75, -0.2], [-2.75, -0.2], [PI, 0.05]] as [number, number][])
          strand([[bb - 0.06, p0], [bb + 0.06, p0 - 0.1], [bb - 0.04, p0 - 0.2], [bb + 0.06, p0 - 0.3], [bb, p0 - 0.38]], 2.0, hairLt, 0.65);
      } else if (H0 === "curly") {
        for (let bb = -1.75; bb <= 1.76; bb += 0.35) lobe(bb, hairH(bb) + 0.06, 0.15);
        for (let bb = -PI; bb < PI; bb += 0.5) lobe(bb, 0.84, 0.19);
        for (let bb = -2.9; bb <= 2.91; bb += 0.55) lobe(bb, 0.46, 0.18);
        // little C-curls
        for (const sg of [-1, 1]) for (const bb of [2.1, 2.45, 2.8]) lobe(sg * bb, hairH(bb) + 0.05, 0.15, 1.03, true);
        lobe(PI, hairH(PI) + 0.05, 0.15, 1.03, true);
        for (const [bb, pp] of [[-0.5, 0.8], [0.4, 0.82], [1.3, 0.6], [-1.4, 0.62], [2.2, 0.42], [-2.25, 0.44], [PI, 0.5], [2.8, 0.1], [-2.8, 0.12], [1.9, 0.15], [-1.95, 0.16], [2.5, -0.3], [-2.5, -0.28], [PI, -0.4], [2.9, -0.55], [-2.95, -0.55]] as [number, number][]) {
          if (!hairOK(bb, pp)) continue;
          strand([[bb - 0.1, pp + 0.06], [bb - 0.13, pp - 0.02], [bb - 0.03, pp - 0.08], [bb + 0.08, pp - 0.03]], 1.9, hairLt, 0.75);
        }
      } else if (H0 === "close" || H0 === "receding") {
        for (const sgn of [-1, 1]) for (let i = 0; i < 4; i++) lobe(sgn * (1.25 + i * 0.36), hairH(sgn * (1.25 + i * 0.36)) + 0.07, H0 === "close" ? 0.11 : 0.13, 1.03, 1.25 + i * 0.36 > 1.8);
        if (H0 === "close") for (let bb = -PI; bb < PI; bb += 0.7) lobe(bb, 0.62, 0.17, 1.02);
        for (const bb of [-2.4, -1.6, 1.6, 2.4, PI]) {
          const p0 = Math.max(hairH(bb) + 0.12, 0.25);
          strand([[bb - 0.12, p0], [bb, p0 + 0.08], [bb + 0.12, p0 + 0.02]], 1.7, hairLt, 0.6);
        }
        for (const sg of [-1, 1]) for (const bb of [2.15, 2.6]) lobe(sg * bb, hairH(bb) + 0.05, 0.12, 1.03, true);
        lobe(PI, hairH(PI) + 0.05, 0.12, 1.03, true);
        for (const [bb, p0] of [[2.6, -0.2], [-2.6, -0.2], [PI, -0.3]] as [number, number][]) strand([[bb - 0.1, p0], [bb, p0 - 0.08], [bb + 0.1, p0 - 0.02]], 1.7, hairLt, 0.55);
      } else if (H0 === "long") {
        for (let bb = -1.5; bb <= 1.51; bb += 0.5) lobe(bb, hairH(bb) + 0.05, 0.13);
        for (const bb of [-0.9, -0.3, 0.3, 0.9, 1.8, -1.8, 2.6, -2.6, PI]) {
          const p0 = Math.max(hairH(bb) + 0.14, 0.2);
          strand([[bb, p0 + 0.5], [bb + 0.08, p0 + 0.3], [bb - 0.02, p0 + 0.1], [bb + 0.06, p0 - 0.1]], 1.8, hairLt, 0.6);
        }
      } else if (H0 === "bun") {
        // soft volume over the ears (the hair drawn back over them), the parting and the waves drawn back from it
        for (const sgn of [-1, 1]) for (const [bb, pp, rr] of [[1.35, 0.22, 0.2], [1.65, 0.02, 0.19], [1.95, 0.08, 0.18], [2.3, 0.14, 0.17]] as [number, number, number][]) lobe(sgn * bb, pp, rr, 1.04);
        strand([[0, hairH(0) + 0.02], [0, 0.8], [0, 1.15], [0, 1.45]], 1.6, hairDk, 0.55);
        for (const sgn of [-1, 1])
          for (const k2 of [0, 1]) strand([[sgn * (0.15 + 0.1 * k2), 0.78 - 0.18 * k2], [sgn * (0.75 + 0.2 * k2), 0.6 - 0.18 * k2], [sgn * (1.4 + 0.2 * k2), 0.38 - 0.16 * k2], [sgn * (2.1 + 0.1 * k2), 0.3 - 0.1 * k2]], 1.6, hairLt, 0.6);
      }
    }
  }
  const hairD = hairSubs.map((s2) => closedF(s2.map(fF), 0.9)).join(" ");
  // the fillet (a headband) over the hair
  const filletShapes: GShape[] = [];
  if (look.fillet && !veil) {
    const fb = regionPoly(head, (b, p) => {
      const u = (1 - Math.cos(b)) / 2;
      const yb = mix(0.62, 0.18, ease(u));
      return p > yb && p < yb + 0.13;
    }, "top", 1.06);
    if (fb.length > 2) filletShapes.push({ d: closedD(fb.map((u) => hToFig(head, u)), 0.8), fill: ink.fillet, sh: 0.4 });
  }
  // the veil (the himation over the head): a hood framing the face, falling to the shoulders behind
  const veilShapes: GShape[] = [];
  const veilBehind: GShape[] = [];
  if (veil) {
    const vh: Head = { ...head, R: HR * 1.12 };
    const hood = regionPoly(vh, (b, p) => !(Math.abs(b) < 0.86 && p < 0.52 && p > -1.2), "top", 1.0);
    if (hood.length > 2) veilShapes.push({ d: closedD(hood.map((u) => hToFig(vh, u)), 0.8), fill: him });
    const dl = headLathe(vh, [
      { y: 0.2, a: 1.0, b: 0.92, c: -0.05 },
      { y: 0.9, a: 1.08, b: 0.8, c: -0.15 },
      { y: 1.45, a: 1.08, b: 0.8, c: -0.12 },
    ]);
    const all: P2[] = [];
    for (const yy of [0.2, 0.9, 1.5]) for (let i = 0; i < 16; i++) all.push(dl.pt(-PI + (2 * PI * i) / 16, yy).p);
    veilBehind.push({ d: closedD(hull(all), 0.9), fill: mixC(him, "#2C3433", 0.06) });
    // the hood's soft edge fold round the face
    const ef: P2[] = [];
    for (let j = 0; j <= 8; j++) {
      const bb = mix(-0.95, 0.95, j / 8);
      ef.push(hProj(vh, bb, 0.6 - 0.05 * Math.cos(bb), 1.0).p);
    }
    veilShapes.push({ d: tubeD(ef, ef.map(() => 4.5)), fill: mixC(him, "#FFFFFF", 0.18), sh: 0, op: sst(0.0, 0.3, hProj(vh, 0, 0.6).d) });
  }
  // the beard: a region on its own BEARD SPHERE (an ellipsoid hung lower and a little forward of the head, turning
  // with it: its outline is round from every side, never a block) below a jawline that rises to the sideburns; the
  // lower edge scalloped by lobes, lighter inner lobes, creases / strands, and a moustache on the head sphere in the
  // beard's own tone: a designed shape in a lifted mid tone, never a solid dark block
  const beardShapes: GShape[] = [];
  const bk = look.beard;
  if (bk !== "none") {
    const bc = ink.beard;
    const light = [HAIR.white, HAIR.grey, HAIR.silver, HAIR.greyBrown, "#C2BBAF"].includes(bc);
    const bFill = bk === "stubble" ? mixC(skin, bc, 0.3) : mixC(mixC(bc, skin, light ? 0.04 : 0.2), "#F3EBDD", light ? 0 : 0.06);
    const bLobe = mixC(bFill, "#F3EBDD", light ? 0.5 : 0.3);
    const bDeep = mixC(bFill, "#2C2420", light ? 0.24 : 0.3);
    if (bk === "stubble") {
      const g = (beta: number) => {
        const a = Math.abs(beta);
        if (a <= 1.45) return mix(-0.52, -0.3, ease(a / 1.45));
        return mix(-0.3, -1.45, ease(Math.min(1, (a - 1.45) / 0.5)));
      };
      const bp = regionPoly(head, (b2, p2) => p2 < g(b2), "bottom", 1.03);
      if (bp.length > 2) beardShapes.push({ d: closedD(bp.map((u) => hToFig(head, u)), 0.9), fill: bFill, sh: 0, op: 0.22, clip: headD });
    } else {
      // the beard sphere: radius rb (head units), stretched down by sy, centred lower and forward
      const P = {
        neat: { rb: 0.7, sy: 1.0, cy: 0.46, fw: 0.3, front: -0.1, side: 0.26, nl: 5 },
        short: { rb: 0.74, sy: 0.92, cy: 0.44, fw: 0.28, front: -0.08, side: 0.3, nl: 5 },
        full: { rb: 0.76, sy: 1.22, cy: 0.46, fw: 0.3, front: -0.04, side: 0.42, nl: 5 },
        curly: { rb: 0.76, sy: 1.1, cy: 0.46, fw: 0.3, front: -0.04, side: 0.42, nl: 6 },
        long: { rb: 0.7, sy: 1.75, cy: 0.5, fw: 0.26, front: -0.02, side: 0.36, nl: 5 },
      }[bk as "neat" | "short" | "full" | "curly" | "long"];
      const Rb = P.rb * HR;
      // its centre hangs below and in front of the head's centre, turned and nodded with the head
      const bh: Head = { C: hProj(head, 0, -Math.atan2(P.cy, P.fw), Math.hypot(P.cy, P.fw)).p, R: Rb, roll: head.roll, yaw: hy, pitch: head.pitch };
      const toB = (u: P2): P2 => add(bh.C, rot([u[0] * Rb, u[1] * Rb * P.sy], head.roll));
      const bProj = (beta: number, phi: number, rr = 1) => {
        const pp = hProj({ ...bh, C: [0, 0], R: 1, roll: 0 }, beta, phi, rr);
        return { p: toB(pp.p), d: pp.d };
      };
      // the jawline: just under the lip at the front, rising to the sideburns at the ears
      // (behind the sideburn it curves down under the jaw: a rounded back edge from every side, never a straight cut)
      const jaw = (beta: number) => {
        const ab = Math.abs(beta);
        const a = Math.min(1, ab / 1.45);
        return mix(P.front, P.side, ease(a)) - (ab > 1.2 ? 6 * (ab - 1.2) * (ab - 1.2) : 0);
      };
      const reg = regionPoly({ ...bh, C: [0, 0], R: 1, roll: 0 }, (b2, p2) => p2 < jaw(b2) && Math.abs(b2) < 1.75, "bottom", 1.0);
      // seen from behind the beard is behind the jaw and neck: it fades out past the back three-quarter
      const bVis = sst(-0.72, -0.38, Math.cos(hy));
      const subs: P2[][] = [];
      if (reg.length > 2) subs.push(cw(reg.map(toB)));
      // the scalloped lower edge: lobes round the bottom of the beard sphere
      const nl = P.nl;
      for (let i = 0; i < nl; i++) {
        const beta = mix(-1.15, 1.15, i / (nl - 1));
        const c = bProj(beta, -1.02 + 0.08 * Math.abs(beta), 1.0);
        if (c.d < -0.2) continue;
        subs.push(cw(ellPts(c.p, 0.2 * Rb, 0.19 * Rb * P.sy, head.roll, 12)));
      }
      // the cheek edge scalloped too: lobes along the jawline from the sideburn toward the chin
      for (const sgn of [-1, 1])
        for (const bb of [0.7, 1.02, 1.3]) {
          const c = bProj(sgn * bb, jaw(sgn * bb) - 0.06, 1.0);
          if (c.d < -0.1) continue;
          subs.push(cw(ellPts(c.p, 0.15 * Rb, 0.14 * Rb, head.roll, 12)));
        }
      if (bk === "long") {
        const tip = bProj(0, -1.3, 1.0);
        subs.push(cw(ellPts(add(tip.p, [0, 0.1 * Rb * P.sy]), 0.2 * Rb, 0.24 * Rb * P.sy, head.roll, 12)));
      }
      beardShapes.push({ d: subs.map((s2) => closedF(s2.map(fF), 0.9)).join(" "), fill: bFill, sh: 0.5, op: bVis });
      // the beard's drawn texture: lighter C-curls (curly, full, neat) or wavy strands (long), and two soft creases
      const curls: [number, number][] = bk === "long"
        ? []
        : bk === "neat" || bk === "short"
          ? [[-0.5, -0.42], [0.02, -0.55], [0.52, -0.42], [-0.26, -0.82], [0.28, -0.82]]
          : [[-0.6, -0.3], [-0.05, -0.42], [0.5, -0.3], [-0.35, -0.72], [0.22, -0.74], [-0.05, -1.0]];
      for (const [beta, phi] of curls) {
        const pts = [[beta - 0.12, phi + 0.08], [beta - 0.16, phi - 0.02], [beta - 0.05, phi - 0.1], [beta + 0.08, phi - 0.06]].map(([b2, p2]) => bProj(b2, p2, 1.01));
        const v = sst(0.15, 0.45, Math.min(...pts.map((pp) => pp.d)));
        if (v > 0.01) beardShapes.push({ d: smoothOpen(pts.map((pp) => fF(pp.p))), fill: bLobe, det: 2.4, keep: true, op: 0.9 * v * bVis });
      }
      const strands: [number, number][][] = bk === "long" || bk === "full"
        ? [-0.5, -0.15, 0.2, 0.55].map((b0) => [0, 1, 2, 3, 4].map((j) => [b0 + 0.07 * Math.sin(j * 1.9 + b0 * 3), -0.2 - j * (bk === "long" ? 0.24 : 0.18)] as [number, number]))
        : [[[-0.25, -0.3], [-0.28, -0.6], [-0.24, -0.85]], [[0.25, -0.3], [0.27, -0.6], [0.24, -0.85]]];
      for (const cr of strands) {
        const ps = cr.map(([b2, p2]) => bProj(b2, p2, 1.01));
        const v = sst(0.15, 0.45, Math.min(...ps.map((pp) => pp.d)));
        if (v > 0.01) beardShapes.push({ d: smoothOpen(ps.map((pp) => fF(pp.p))), fill: bk === "long" || bk === "full" ? bLobe : bDeep, det: 1.8, keep: true, op: (bk === "long" || bk === "full" ? 0.75 : 0.45) * v * bVis });
      }
      // the moustache: two soft lobes under the nose in the beard's tone, the lip showing between
      for (const sgn of [-1, 1]) {
        const m0 = hProj(head, sgn * 0.1, -0.32, 1.02);
        const m1 = hProj(head, sgn * 0.36, -0.42, 1.01);
        const v = sst(0.1, 0.35, Math.min(m0.d, m1.d));
        if (v > 0.01) beardShapes.push({ d: tubeD([m0.p, mix2(m0.p, m1.p, 0.5), m1.p], [4.4 * fs, 4.8 * fs, 2.8 * fs]), fill: mixC(bFill, "#2C2420", 0.05), sh: 0, op: v });
      }
    }
  }
  // the nose
  const nz = hProj(head, 0, -0.16, 1.05);
  const nv = sst(-0.1, 0.25, nz.d);
  const noseShapes: GShape[] = nv > 0.003 ? [{ d: ellD(nz.p, fs * (3.4 + 1.2 * Math.abs(Math.sin(hy))), 3.9 * fs, head.roll), fill: skinSh, sh: 0, op: nv }] : [];
  // the mouth only when it acts
  const mouthShapes: GShape[] = [];
  const mo = hProj(head, 0, -0.42, 1.0);
  const mv = sst(0.2, 0.45, mo.d);
  if (q.mouth <= -0.3 && mv > 0.003) {
    const amt = sst(0.3, 0.55, -q.mouth);
    mouthShapes.push({ d: ellD(mo.p, 2.6 * fs * amt * mix(0.6, 1, mo.d), 3.0 * fs * amt, head.roll), fill: "#4A2A24", sh: 0, op: mv });
  } else if (q.mouth >= 0.15 && mv > 0.003) {
    const a = hProj(head, -0.2, -0.38);
    const b = hProj(head, 0.2, -0.38);
    mouthShapes.push({ d: qD(a.p, add(mo.p, rot([0, 2.4], head.roll)), b.p), fill: "#7A4A3E", det: 1.8, keep: true, op: 0.8 * mv * sst(0.15, 0.25, q.mouth) });
  }
  const headTop = add(head.C, rot([0, (veil ? -1.16 : -1.07) * HR], head.roll));

  // ---- ASSEMBLY -------------------------------------------------------------------------------------------------------
  const arms = [GA.L, GA.R];
  const key = (ar: GArm): "L" | "R" => (ar.sgn < 0 ? "L" : "R");
  const shown = arms.filter((ar) => o.hideArm !== key(ar));
  /** how far inside the torso's silhouette a figure-local point is (0 outside .. 1 well inside), and the depth of
   *  the body's centre plane there (camera space, + toward us) */
  const bodyAt = (p: P2) => {
    const y = Math.max(shY - 9, Math.min(40, p[1] - r.hip[1]));
    const row = sampleRow(rows, y);
    const [l, rr] = B.edge(y);
    const cx = (l + rr) / 2 + r.hip[0];
    const hwid = (rr - l) / 2;
    return { zc: row.c * B.cY, inside: sst(-6, 8, hwid - Math.abs(p[0] - cx)) };
  };
  // an arm's front weight, by its hand's depth against the body's centre plane (camera space): in front of it (or
  // level with it, the hanging arms of a front view) the arm is drawn over the body, clearly behind it under the
  // body; a short crossfade between (romeFolk's arm rule, carried to 3D: a hand held in front of him goes behind his
  // body as he turns away), never a pop
  const frontW = (ar: GArm) => {
    const b = bodyAt(ar.W);
    return sst(-6, 6, ar.Zreq - b.zc + 10);
  };
  const wOf = { L: frontW(GA.L), R: frontW(GA.R) };
  // the upper arm by its shoulder's depth, the forearm and hand by the hand's: a far arm reaching in front of him has
  // its upper arm behind the body and its forearm in front
  const wUp = (ar: GArm) => sst(-6, 6, ar.Zs + 9);
  // (always the two parts, so nothing changes when they start to disagree)
  const armParts = (ar: GArm): { sh: GShape[]; w: number; name: string }[] => [
    { sh: armTube(ar, "upper"), w: wUp(ar), name: `arm${key(ar)}.up` },
    { sh: armTube(ar, "fore"), w: wOf[key(ar)], name: `arm${key(ar)}.fore` },
  ];
  // a two-hand thing goes with the nearer of its hands
  const w2 = Math.max(wOf.L, wOf.R);
  const out: GShape[] = [];
  const put = (sh: GShape[], name: string, w = 1) => {
    sh.forEach((s, i) => out.push({ ...s, id: `${name}.${i}`, op: w >= 0.999 ? s.op : (s.op ?? 1) * w }));
  };
  // behind the body: long hair / the veil's fall, the arms (and what they hold) while behind
  put(hairBehindBody, "hairFall");
  put(veilBehind, "veilFall");
  // seen from behind, the long hair's fall and the veil's fall lie over his back: their front copies fade in as he
  // turns away
  const fallW = sst(0.1, -0.35, Math.cos(hy));
  const byZ = [...shown].sort((a, b) => a.z - b.z);
  const parts = byZ.map((ar) => ({ ar, parts: armParts(ar) }));
  for (const p of parts) for (const pt of p.parts) if (pt.w < 0.999) put(pt.sh, `${pt.name}.b`);
  if (held.two && w2 < 0.999) put(twoShapes, "two.b");
  for (const ar of byZ) {
    if (wOf[key(ar)] >= 0.999) continue;
    put(oneShapes[key(ar)], `held${key(ar)}.b`);
    put(mitten(ar), `hand${key(ar)}.b`);
  }
  put(legShapes(legsSorted[0]), `leg${legsSorted[0] === r.legL ? "L" : "R"}`);
  put(legShapes(legsSorted[1]), `leg${legsSorted[1] === r.legL ? "L" : "R"}`);
  put(skirtShapes, "skirt");
  put([{ d: tubeD([toFig([0, shY + 4]), mix2(toFig([0, shY]), head.C, 0.6)], [24 * k, 20 * k]), fill: skinSh, sh: 0 }], "neck");
  put(torsoShapes, "torso");
  put(drapeShapes, "drape");
  put(panelShapes, "panel");
  if (fallW > 0.001) {
    put(hairBehindBody, "hairFall.f", fallW);
    put(hairFallTex, "hairFallTex", fallW);
    put(veilBehind, "veilFall.f", fallW);
  }
  put(headBehind, "headBehind");
  put(headShapes, "head");
  if (hairD) put([{ d: hairD, fill: hairCol, sh: 0.55 }], "hair");
  put(bunFront, "bun");
  put(clumps, "hairTex");
  put(filletShapes, "fillet");
  put(beardShapes, "beard");
  put(noseShapes, "nose");
  put(mouthShapes, "mouth");
  put(veilShapes, "veil");
  // in front: the arms (sorted by depth), the two-hand thing, the hands
  for (const p of parts) for (const pt of p.parts) if (pt.w > 0.001) put(pt.sh, `${pt.name}.f`, pt.w);
  if (held.two && w2 > 0.001) put(twoShapes, "two.f", w2);
  for (const ar of byZ) {
    const w = wOf[key(ar)];
    if (w <= 0.001) continue;
    put(oneShapes[key(ar)], `held${key(ar)}.f`, w);
    put(mitten(ar), `hand${key(ar)}.f`, w);
  }
  return { shapes: out, headC: head.C, headR: HR, headTop, items };
};
