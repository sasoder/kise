// ---------------------------------------------------------------------------
// romeFolkBody — the DRAWN Roman folk (kyle-rome-slavery V3) as flat gouache shapes on romeCast's skeleton.
// Pure geometry: buildRomeFolk(kind, variant, pose, opts) -> { shapes, head } in FOLK units (the pandemics' units:
// the Worker is 513 tall; FU = folk units per rig unit), painted by pandemicFolkPaint's FolkPaint (the same gouache
// filter, crescent shadows and wobble as the pandemics cast). romeFolk.tsx is the API.
//
// The skeleton is the texcoco rig exactly as romeCast builds it (romeSpec, figureRig, gripTo), so feet, hips, hands,
// grips, contacts and walk phases are romeCast's. The drawing on it is new: a small round head on a pear torso,
// tapered tubes for limbs, mitten hands, small feet; clothes as flat shapes.
// Turning without flips:
//   - the torso is a LATHE (elliptical rows a / b / c by height); its outline at a yaw is exact, and clothing is drawn
//     in front-view coordinates and carried round the body (points past the terminator slide onto the silhouette);
//   - the head is a sphere: hair, beard, cap are regions on it (scanned column by column on screen), eyes, nose,
//     blush, ears, curls are points on it, all turned by the head's yaw and nod (continuous);
//   - an arm that goes behind the body is drawn behind AND in front, the front copy fading over yaw 0.22..0.37
//     (a crossfade, never a layer pop); legs swap order only at yaw 0 where they are apart;
//   - the hem is one continuous function of the pose (the hull of the legs, draped and resampled: Revision 1).
// ---------------------------------------------------------------------------
import { hash } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { figureRig, type FigPose } from "../kits/maps/texcocoFigures";
import { mixC, type Shape } from "../kyle-pandemics/pandemicFolkPaint";
import { smoothClosed, tube } from "../kyle-pandemics/pandemicFolkWorker";
import { TOOL_LEN, isFemale, romeSpec, type Garb, type RomeKind, type RomeLoad, type RomeTool } from "./romeCast";

type P2 = [number, number];
/** folk units per rig unit (a rig man ~312 tall = the pandemics Worker's 513) */
export const FU = 513 / 312;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => v * v * (3 - 2 * v);
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const D2R = Math.PI / 180;

// ---- path helpers (rig units in, folk units out) -------------------------------------------------------------------
const f = (p: P2): P2 => [p[0] * FU, p[1] * FU];
export const closedD = (pts: P2[], tension = 1) => smoothClosed(pts.map(f), tension);
export const polyD = (pts: P2[]) => `M ${pts.map((p) => `${n2(p[0] * FU)} ${n2(p[1] * FU)}`).join(" L ")} Z`;
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
/** signed area (screen y down): > 0 = clockwise on screen */
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

// ===================================================================================================================
// THE LOOKS (folk palette: muted earthy colours that sit in palette A's teal / espresso air; never orange)
// ===================================================================================================================
export type FolkInks = {
  skin: string;
  hair: string;
  /** the main garment (tunic / long tunic) */
  tunic: string;
  /** belt (rope or leather) */
  belt: string;
  /** apron (freeman), palla (freewoman), toga (dominus), cloak (overseer) */
  over: string;
  /** a second accent: the toga's border stripe, the overseer's brooch, the woman's headband */
  trim: string;
  /** sandals, shoes, straps */
  leather: string;
  /** the felt cap */
  cap: string;
  /** fetters, collar, tool heads */
  iron: string;
  wood: string;
};
export type HairKind = "crop" | "close" | "curly" | "bun" | "receding";
export type BeardKind = "none" | "stubble" | "short" | "full";
type FolkLook = { inks: FolkInks; hair: HairKind; beard: BeardKind; plump: number; brow: number; head: number };

const DEAD_C = "#8A7B62";
const SKIN = { fair: "#E8C4A0", warm: "#DDB28E", olive: "#D2A57F", tan: "#C9976F", pale: "#EDCFB0" };
const HAIR = { dark: "#3E2D24", black: "#2F2620", brown: "#5E4332", chestnut: "#6E4A34", grey: "#B9B2A6", greyBrown: "#8D8072" };
const BASE: FolkInks = {
  skin: SKIN.warm,
  hair: HAIR.dark,
  tunic: "#B8A98C",
  belt: "#7C6A52",
  over: "#B8A98C",
  trim: "#8C4E42",
  leather: "#6A4C37",
  cap: "#C5B28C",
  iron: "#5A6266",
  wood: "#6E5440",
};
const L = (inks: Partial<FolkInks>, hair: HairKind, beard: BeardKind, o: { plump?: number; brow?: number; head?: number } = {}): FolkLook => ({
  inks: { ...BASE, ...inks },
  hair,
  beard,
  plump: o.plump ?? 0,
  brow: o.brow ?? 0,
  head: o.head ?? 1,
});
// slaves: undyed oatmeal / grey-brown coarse wool, a rope belt, bare feet
const OAT = "#BCAD90";
const GREYBROWN = "#9E907A";
const LOOKS: Record<RomeKind, FolkLook[]> = {
  slave: [
    L({ skin: SKIN.warm, hair: HAIR.dark, tunic: OAT, belt: "#8A785C" }, "crop", "stubble"),
    L({ skin: SKIN.tan, hair: HAIR.black, tunic: GREYBROWN, belt: "#76664E" }, "close", "short", { head: 1.02 }),
    L({ skin: SKIN.olive, hair: HAIR.brown, tunic: "#B3A385", belt: "#83725A" }, "crop", "none"),
    L({ skin: SKIN.fair, hair: HAIR.dark, tunic: "#A99C84", belt: "#7E6D55", trim: "#8F8470" }, "bun", "none", { head: 0.97 }),
    L({ skin: SKIN.warm, hair: HAIR.grey, tunic: GREYBROWN, belt: "#76664E" }, "receding", "full"),
  ],
  freeman: [
    L({ skin: SKIN.warm, hair: HAIR.chestnut, tunic: "#6F8E88", belt: "#5F4634", over: "#7E5B40", cap: "#C6B28A" }, "crop", "short"),
    L({ skin: SKIN.olive, hair: HAIR.brown, tunic: "#B39A63", belt: "#5F4634", over: "#765640", cap: "#BFAE8E" }, "crop", "none"),
    L({ skin: SKIN.tan, hair: HAIR.greyBrown, tunic: "#8E5E4C", belt: "#55402F", over: "#6F5440", cap: "#C9B996" }, "receding", "stubble", { plump: 0.4 }),
    L({ skin: SKIN.fair, hair: HAIR.chestnut, tunic: "#7D9790", belt: "#6B5442", over: "#B7A279", trim: "#8C4E42" }, "bun", "none", { head: 0.97 }),
  ],
  dominus: [
    L({ skin: SKIN.pale, hair: HAIR.dark, tunic: "#E4DAC3", over: "#F0E8D6", trim: "#8C4E42", leather: "#5A4131", belt: "#E4DAC3" }, "curly", "none", { plump: 0.7 }),
    L({ skin: SKIN.fair, hair: HAIR.grey, tunic: "#E4DAC3", over: "#F0E8D6", trim: "#8C4E42", leather: "#5A4131", belt: "#E4DAC3" }, "receding", "none", { plump: 1, head: 1.03 }),
    L({ skin: SKIN.pale, hair: HAIR.black, tunic: "#E4DAC3", over: "#F0E8D6", trim: "#8C4E42", leather: "#5A4131", belt: "#E4DAC3" }, "curly", "none", { plump: 0.35 }),
  ],
  overseer: [
    L({ skin: SKIN.tan, hair: "#3A2C24", tunic: "#7A5C45", belt: "#4E3A2C", over: "#405659", trim: "#B4A27C", leather: "#5B4332" }, "close", "full", { brow: 0.55 }),
    L({ skin: SKIN.olive, hair: HAIR.brown, tunic: "#7F604A", belt: "#4E3A2C", over: "#3D5155", trim: "#B4A27C", leather: "#5B4332" }, "crop", "stubble", { brow: 0.6 }),
    L({ skin: SKIN.warm, hair: HAIR.greyBrown, tunic: "#76594A", belt: "#4E3A2C", over: "#44585A", trim: "#B4A27C", leather: "#5B4332" }, "receding", "short", { brow: 0.35, plump: 0.3 }),
  ],
};
export const folkLookOf = (kind: RomeKind, variant = 0): FolkLook => {
  const a = LOOKS[kind];
  return a[((Math.round(variant) % a.length) + a.length) % a.length];
};

// ===================================================================================================================
// OPTIONS
// ===================================================================================================================
export type BuildOpts = {
  garb?: Garb;
  fetters?: boolean;
  chainLen?: number;
  collar?: boolean;
  chalk?: boolean;
  titulus?: boolean;
  apron?: boolean;
  pilleus?: boolean;
  stripe?: boolean;
  ring?: boolean;
  tool?: RomeTool;
  toolIn?: "near" | "far";
  toolSway?: number;
  held?: "none" | "cup";
  load?: RomeLoad;
  onlyArm?: "L" | "R";
  hideArm?: "L" | "R";
  /** colour overrides for this figure */
  inks?: Partial<FolkInks>;
  /** 0..1: drain the figure toward DEAD (#8A7B62): cloth and hair sink to it, the skin greys */
  drain?: number;
};

// ===================================================================================================================
// small rig helpers (copied from romeCast, which does not export them)
// ===================================================================================================================
type Rig = ReturnType<typeof figureRig>;
type ArmRig = Rig["armL"];
type LegRig = Rig["legL"];
/** the tool's geometry (figure-local rig units), as romeCast's toolGeom (the same grips) */
export const toolGeomOf = (r: Rig, tool: RomeTool, G: number, toolIn: "near" | "far", limb: number, q?: FigPose) => {
  if (tool === "none") return null;
  const near = G > 0 ? r.armL : r.armR;
  const far = G > 0 ? r.armR : r.armL;
  const thumbDir = (a: ArmRig): P2 => {
    const d = a.dir;
    const n: P2 = [-d[1], d[0]];
    const hint = q ? (a.sgn < 0 ? q.armL.elbow : q.armR.elbow) : null;
    if (!hint) return mul(n, Math.abs(n[0]) > 0.25 ? (n[0] * -a.sgn >= 0 ? 1 : -1) : n[1] < 0 ? 1 : -1);
    // continuous: the held stick turns through the fist's front (along the forearm) when the thumb's side changes,
    // instead of flipping 180 deg in a frame (romeCast's rule)
    const c = sub(a.W, a.S);
    const crs = (-c[1] * hint[0] + c[0] * hint[1]) / ((vlen(c) || 1) * (vlen(hint) || 1));
    const tsC = -Math.max(-1, Math.min(1, crs * 5));
    return rot(d, 90 * tsC);
  };
  if (tool === "rod" || tool === "whip") {
    const a = toolIn === "far" ? far : near;
    const base = add(a.W, mul(a.dir, 9.5 * limb));
    const u = thumbDir(a);
    return { base, u, head: add(base, mul(u, TOOL_LEN[tool])), two: false, arm: a };
  }
  const gEnd = add(far.W, mul(far.dir, 9.5 * limb));
  const gUp = add(near.W, mul(near.dir, 9.5 * limb));
  // (continuous: romeCast fell back to the thumb's side when the grips came within 8 units, flipping the shaft; here
  // the shaft blends to the wrists' line, which stays ~22 units long through the swing)
  const v1 = sub(gUp, gEnd);
  // the pose's own wrist targets (strike: 22 units apart along the shaft it means): the solved wrists can bunch up
  // mid-swing (grips 4 units apart) and their line then spins the shaft through 100 deg in a frame
  const tv: P2 | null = q ? (G > 0 ? sub(q.armL.w as P2, q.armR.w as P2) : sub(q.armR.w as P2, q.armL.w as P2)) : null;
  const wv = tv && vlen(tv) > 6 ? tv : sub(near.W, far.W);
  const wd = vlen(wv) > 1e-3 ? norm(wv) : thumbDir(near);
  const L1 = vlen(v1);
  // the fists' line while they are apart (both fists stay on the shaft), the pose's meaning while they bunch up
  const u = L1 > 1e-3 ? norm(mix2(wd, norm(v1), sst(5, 12, L1))) : wd;
  return { base: gEnd, u, head: add(gEnd, mul(u, TOOL_LEN[tool] + 2)), two: true, arm: near };
};
export const loadGeomOf = (r: Rig, G: number) => {
  const near = G > 0 ? r.armL : r.armR;
  return { c: add(near.S, [-G * 30, -26]) as P2, ang: G * 22 };
};

// ---- cloth helpers (the hull of the legs, resampled: the hem is a continuous function of the pose; no drape: its edge
// subdivision stepped the front of the skirt by up to 8 units on single frames with the folk's fuller legs) -------------
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
const chainPts = (a: P2, b: P2, len: number, ground: number): P2[] => {
  const d = vlen(sub(b, a));
  // (continuous: romeCast's extra sag for feet closer than 4 switched on in one frame; here the parabola's sag blends
  // smoothly into a hanging U as the feet close)
  const h = d >= len ? 0 : Math.sqrt((3 * d * Math.max(0, len - d)) / 8 + ((len - d) / 2) ** 2 * Math.exp(-d / 8));
  const n = Math.max(6, Math.ceil(len / 3));
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = mix2(a, b, u);
    out.push([p[0], Math.min(ground, p[1] + 4 * h * u * (1 - u))]);
  }
  return out;
};
/** links along a polyline (fixed count): small slate ovals, alternate ones edge-on (rig units) */
export const chainLinks = (pts: P2[], count: number, link: number): Shape[] => {
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + vlen(sub(pts[i], pts[i - 1])));
  const total = cum[cum.length - 1];
  const at = (sv: number): { p: P2; u: P2 } => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < sv) i++;
    const fr = (sv - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return { p: mix2(pts[i - 1], pts[i], c01(fr)), u: norm(sub(pts[i], pts[i - 1])) };
  };
  const out: Shape[] = [];
  for (let j = 0; j <= count; j++) {
    const { p, u } = at((j / Math.max(1, count)) * total);
    const ang = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
    out.push({ d: ellD(p, link * 0.72, j % 2 === 0 ? link * 0.42 : link * 0.2, ang), fill: "IRON", sh: 0 });
  }
  return out;
};

// ===================================================================================================================
// THE TORSO LATHE (torso-local rig units: the hips at (0, 0), up -y; x = screen right when he faces us)
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
  rows: Row[];
  s: number;
  cY: number;
  /** a front-view point (torso-local) carried onto the turned body -> torso-local screen point, its depth 0..1 */
  on: (p: P2, out?: number) => { p: P2; d: number };
  /** the silhouette at height y: [left, right] torso-local x */
  edge: (y: number) => [number, number];
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
  return { rows, s, cY, on, edge };
};


/** the torso lathe's rows for a cast member (torso-local rig units) */
const torsoRows = (kind: RomeKind, variant: number, shY: number): Row[] => {
  const look = folkLookOf(kind, variant);
  const sp = romeSpec(kind, variant);
  const female = isFemale(kind, variant);
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
  if (female) {
    rows[4] = { ...rows[4], a: hw * 0.98, b: A * 0.6, c: 4 };
    rows[5] = { ...rows[5], a: A * 0.94 };
  }
  return rows;
};
const legPtOf = (l: LegRig, fr: number): P2 => (fr <= 1 ? mix2(l.H, l.K, fr) : mix2(l.K, l.A, Math.min(1, fr - 1)));
const legRadOf = (fr: number) => (fr <= 1 ? mix(31, 25, fr) : mix(25, 18, Math.min(1, fr - 1)));
/** the lower garment's outline (tunic skirt, long tunic, toga, loincloth) in figure-local RIG units: one continuous
 *  function of the pose (the hull of the legs from the belt to the hem, resampled to 180 points, smoothed);
 *  the slave's soft ragged hem is fixed on the cloth. Exported for the pop probes (romeCast's name). */
export const skirtOutlineOf = (kind: RomeKind, variant: number, q: FigPose, garbProp?: Garb): P2[] => {
  const sp = romeSpec(kind, variant);
  const female = isFemale(kind, variant);
  const slave = kind === "slave";
  const garb: Garb = slave && !female ? (garbProp ?? "tunic") : "tunic";
  const r = figureRig(sp, q);
  const k = sp.limb;
  const B = makeBody(torsoRows(kind, variant, r.shY), q.yaw);
  const dominus = kind === "dominus";
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * 20;
  const skLen = dominus ? 1.8 : female ? 1.86 : garb === "loincloth" ? 0.3 : kind === "overseer" ? 0.92 : kind === "freeman" ? 1.0 : 0.74;
  const skFlare = dominus ? 11 : female ? 9 : garb === "loincloth" ? 0 : 8;
  const [el, er] = B.edge(-12);
  const waist = [r.toFig([el + 1, -12]), r.toFig([er - 1, -12])];
  const pts: P2[] = [...waist];
  for (const l of [r.legL, r.legR]) {
    const n = Math.max(2, Math.ceil(skLen / 0.25));
    for (let i = 0; i <= n; i++) {
      const fr = (i / n) * skLen;
      pts.push(...circ(add(legPtOf(l, fr), [hdx * 0.3 * (fr / skLen), 0]), (legRadOf(fr) + skFlare * (fr / skLen)) * k, 16));
    }
    const hm = legPtOf(l, skLen);
    const rr = (legRadOf(skLen) + skFlare) * k;
    pts.push(add(hm, [-rr - 3 + hdx, 6]), add(hm, [rr + 3 + hdx, 6]), add(hm, [hdx, 8]));
  }
  let hl = resampleClosed(hull(pts.map((p): P2 => [p[0], Math.min(p[1], -1.5)])), 180, waist[0], 4);
  if (slave) {
    const yMax = Math.max(...hl.map((p) => p[1]));
    hl = hl.map((p): P2 => {
      const u = (p[0] - r.hip[0]) / 15 + variant * 0.37;
      const cell = Math.floor(u);
      const fr = u - cell;
      const tooth = 0.5 - 0.5 * Math.cos(2 * Math.PI * fr);
      return [p[0], p[1] + tooth * (2.5 + 3.5 * hash(cell + 999, 811)) * c01((p[1] - yMax + 16) / 9)];
    });
  }
  return hl;
};

// ===================================================================================================================
// THE HEAD (a sphere: features and regions turned by yaw and nod)
// ===================================================================================================================
type Head = { C: P2; R: number; roll: number; yaw: number; pitch: number };
/** sphere point (beta: azimuth from the face, + = toward screen right when facing us; phi: elevation, + up) */
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
/** head-local unit coords (before roll) -> figure-local rig units */
const hToFig = (h: Head, u: P2): P2 => add(h.C, rot([u[0] * h.R, u[1] * h.R], h.roll));
const wrapPi = (a: number) => {
  let v = a;
  while (v > Math.PI) v -= 2 * Math.PI;
  while (v < -Math.PI) v += 2 * Math.PI;
  return v;
};
/** front surface point at head-local unit screen (x, y) -> (beta, phi) */
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
/** a region on the sphere as a screen polygon (head-local unit coords), scanned column by column:
 *  "top" = the region holds the top of each column down to a crossing (hair, caps); "bottom" = from the bottom up
 *  (beards). The run's ends are refined by bisection so the shape grows / shrinks continuously. */
export const regionPoly = (h: Head, inside: (beta: number, phi: number) => boolean, mode: "top" | "bottom", vol = 1.0, N = 36): P2[] => {
  const M = 40;
  // per column: the first inside segment met from the rim side ("top": from the top down; "bottom": from the bottom
  // up), its ends refined by bisection (it may start at the rim or inside the face)
  const column = (x: number): [number, number] | null => {
    const yr = Math.sqrt(Math.max(0, 1 - x * x)) * 0.9995;
    const y0 = mode === "top" ? -yr : yr;
    const y1 = -y0;
    const ins = (y: number) => {
      const [b, p] = hInv(h, x, y);
      return inside(b, p);
    };
    const bis = (a0: number, b0: number, wantIn: boolean) => {
      // a0 has !wantIn, b0 has wantIn
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
  // volume: points on the silhouette stand out a little (continuous: by their nearness to the rim)
  const volP = (p: P2): P2 => {
    const rr = Math.hypot(p[0], p[1]);
    const kk = 1 + (vol - 1) * sst(0.9, 0.999, rr);
    return [p[0] * kk, p[1] * kk];
  };
  const rimSide: P2[] = xsR.map((x, i) => volP([x, cR[i][0]]));
  const inner: P2[] = xsR.map((x, i): P2 => volP([x, cR[i][1]])).reverse();
  return [...rimSide, ...inner];
};

// ===================================================================================================================
// BUILD
// ===================================================================================================================
export type FolkBuild = {
  shapes: Shape[];
  /** the head as drawn (rig units): centre, radius */
  headC: P2;
  headR: number;
  /** the cap / hair top (rig units, figure-local) */
  headTop: P2;
};
/** the head radius (rig units) for a look */
export const HEAD_R = 38;
/** the head sits this far above the rig's head centre (rig units, along the head's up) */
export const HEAD_UP = 3;

export const buildRomeFolk = (kind: RomeKind, variant: number, q: FigPose, o: BuildOpts = {}): FolkBuild => {
  const look = folkLookOf(kind, variant);
  const ink0: FolkInks = { ...look.inks, ...(o.inks ?? {}) };
  // drain (0..1): misery / the dead: the cloth and hair sink to DEAD, the skin greys a little
  const dr = c01(o.drain ?? 0);
  const ink: FolkInks = dr <= 0 ? ink0 : (Object.fromEntries(Object.entries(ink0).map(([kk, v]) => [kk, mixC(v, kk === "skin" ? "#B8A890" : DEAD_C, kk === "skin" ? 0.45 * dr : 0.85 * dr)])) as FolkInks);
  const sp = romeSpec(kind, variant);
  const female = isFemale(kind, variant);
  const slave = kind === "slave";
  const freeman = kind === "freeman";
  const dominus = kind === "dominus";
  const overseer = kind === "overseer";
  const garb: Garb = slave && !female ? (o.garb ?? "tunic") : "tunic";
  const tool: RomeTool = o.tool ?? (overseer ? "rod" : "none");
  const load: RomeLoad = o.load ?? "none";
  const apron = freeman && (o.apron ?? !female);
  const pilleus = freeman && !female && (o.pilleus ?? true);
  const fetters = slave && !!o.fetters;
  const collar = slave && !!o.collar;
  const r = figureRig(sp, q);
  const k = sp.limb;
  const hw = sp.hw;
  const A = sp.a;
  const shY = r.shY;
  const G = r.s >= 0 ? 1 : -1;
  const lie = sst(30, 44, Math.abs(q.lean));
  const toFig = r.toFig;

  // ---- colours ----------------------------------------------------------------------------------------------------
  const skin = ink.skin;
  const skinSh = mixC(skin, "#8A5A44", 0.22);
  const blush = "#D98A80";
  const eye = "#2A201A";
  const tunic = ink.tunic;
  const shadeOf = (c: string, t = 0.12) => mixC(c, "#2C3433", t);

  // ---- the torso lathe ----------------------------------------------------------------------------------------------
  const rows = torsoRows(kind, variant, r.shY);
  const B = makeBody(rows, q.yaw);
  const tor = (p: P2, out = 0) => toFig(B.on(p, out).p);
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
  /** a band across the front of the torso at height y0..y1 (front-view x from -w to w), carried round the body */
  const bandOn = (x0: number, x1: number, yA: (x: number) => number, yB: (x: number) => number, out = 0.6, n = 14): P2[] => {
    const top: P2[] = [];
    const bot: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const x = mix(x0, x1, i / n);
      top.push(tor([x, yA(x)], out));
      bot.push(tor([x, yB(x)], out));
    }
    return [...top, ...bot.reverse()];
  };
  const regionOn = (pts: P2[], out = 0.6, sub0 = 4): P2[] => {
    // densify a front-view polygon, then carry each point onto the body
    const dense: P2[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const m = Math.max(1, Math.ceil(vlen(sub(b, a)) / sub0));
      for (let j = 0; j < m; j++) dense.push(mix2(a, b, j / m));
    }
    return dense.map((p) => tor(p, out));
  };

  // ---- the head -------------------------------------------------------------------------------------------------------
  const HR = HEAD_R * look.head * (female ? 0.96 : 1);
  const fs = HR / 31.5;
  const head: Head = { C: add(r.headC, rot([0, -HEAD_UP], r.headAngle)), R: HR, roll: r.headAngle, yaw: q.headYaw, pitch: Math.max(-0.25, Math.min(0.5, (q.pitch * Math.PI) / 180 * 0.8)) * Math.cos(q.headYaw) };

  // ---- the arms ---------------------------------------------------------------------------------------------------
  type SleeveKind = "none" | "short" | "elbow" | "toga";
  const sleeveOf = (ar: ArmRig): SleeveKind => {
    if (garb === "loincloth") return "none";
    if (garb === "exomis" && ar.sgn < 0) return "none";
    if (dominus && ar.sgn > 0) return "toga";
    return female ? "elbow" : "short";
  };
  const tg = toolGeomOf(r, tool, G, o.toolIn ?? "near", k, q);
  const nearArm = G > 0 ? r.armL : r.armR;
  const toolShapes = (): Shape[] => {
    if (!tg) return [];
    const ang = Math.atan2(tg.u[1], tg.u[0]);
    const T = (p: P2): P2 => add(tg.base, rot(p, (ang * 180) / Math.PI));
    const out: Shape[] = [];
    if (tool === "rod") {
      const Ln = TOOL_LEN.rod;
      out.push({ d: tubeD([T([-14, 0]), T([Ln * 0.45, 0]), T([Ln, 0])], [7.2, 6, 4.6]), fill: ink.wood, sh: 0.5 });
      return out;
    }
    if (tool === "whip") {
      const h = TOOL_LEN.whip;
      const sway = o.toolSway ?? 0;
      const angD = (ang * 180) / Math.PI;
      const g = (p: P2): P2 => T(add([h, 0], rot(sub(p, [h, 0]), -angD)));
      const p1 = g([h + 26, 30 + 8 * Math.sin(sway)]);
      const p2 = g([h + 18 + 12 * Math.sin(sway * 1.3 + 1), 82]);
      const p3 = g([h + 34 + 16 * Math.sin(sway + 2), 128]);
      const lash: P2[] = [];
      const p0 = T([h, 0]);
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const a = (1 - t) ** 3;
        const b = 3 * (1 - t) ** 2 * t;
        const c = 3 * (1 - t) * t * t;
        const dd = t ** 3;
        lash.push([a * p0[0] + b * p1[0] + c * p2[0] + dd * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + dd * p3[1]]);
      }
      out.push({ d: tubeD(lash, lash.map((_, i) => mix(3.4, 1.6, i / 16))), fill: mixC(ink.leather, "#2A1E16", 0.25), sh: 0 });
      out.push({ d: tubeD([T([-12, 0]), T([h * 0.6, 0]), T([h, 0])], [8, 7, 5.4]), fill: ink.leather, sh: 0.5 });
      return out;
    }
    const L0 = TOOL_LEN[tool as "hammer" | "pick"];
    out.push({ d: tubeD([T([-10, 0]), T([L0 * 0.5, 0]), T([L0 + 6, 0])], [7.4, 7, 7.6]), fill: ink.wood, sh: 0.5 });
    if (tool === "hammer") out.push({ d: closedD([T([L0 - 12, -23]), T([L0 + 14, -25]), T([L0 + 15, 24]), T([L0 - 12, 23])], 0.35), fill: ink.iron });
    else out.push({ d: closedD([T([L0 - 4, -6]), T([L0 + 6, -30]), T([L0 + 4, -58]), T([L0 + 10, -56]), T([L0 + 16, -30]), T([L0 + 11, -4]), T([L0 + 11, 6]), T([L0 + 17, 28]), T([L0 + 14, 46]), T([L0 + 4, 44]), T([L0 + 7, 26]), T([L0 - 4, 6])], 0.5), fill: ink.iron });
    return out;
  };
  const mitten = (ar: ArmRig): Shape[] => {
    const d = ar.dir;
    const n: P2 = [-d[1], d[0]];
    const hint = ar.sgn < 0 ? q.armL.elbow : q.armR.elbow;
    // the thumb's side, continuous: it slides across behind the mitten instead of jumping sides
    const cS = sub(ar.W, ar.S);
    const crs = (-cS[1] * hint[0] + cS[0] * hint[1]) / ((vlen(cS) || 1) * (vlen(hint) || 1));
    const ts = -Math.max(-1, Math.min(1, crs * 5));
    const fist = c01(ar.fist);
    const len = mix(21, 18, fist) * k;
    const wid = mix(16.5, 17.5, fist) * k;
    const c = add(ar.W, mul(d, len * 0.5 + 1.5 * k));
    const ang = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
    const out: Shape[] = [];
    // the thumb: a small lobe on its side of the hand, behind the mitten's edge
    const tb = add(add(ar.W, mul(d, 6 * k)), mul(n, ts * 7 * k));
    out.push({ d: ellD(add(tb, mul(rot(d, -ts * mix(28, 70, fist)), 4 * k)), 5.4 * k, 4.2 * k, ang - ts * mix(28, 70, fist)), fill: skin, sh: 0.5 });
    out.push({ d: ellD(c, len * 0.56, wid * 0.5, ang), fill: skin });
    if (dominus && (o.ring ?? true) && ar.sgn > 0) out.push({ d: ellD(add(c, add(mul(d, 1.5 * k), mul(n, -ts * 3 * k))), 2.2 * k, 2.2 * k), fill: "#BBA06A", sh: 0 });
    return out;
  };
  /** the drawn elbow: the rig's IK with a softer bend-side rule (the rig's clamp(n.hint x 3) swings a folded elbow
   *  ~28 units in one frame when the hand passes the shoulder, e.g. raiseRod); the hand, its direction and every grip
   *  stay the rig's */
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
  const armShapes = (ar0: ArmRig): Shape[] => {
    const ar: ArmRig = { ...ar0, E: elbowOf(ar0) };
    const out: Shape[] = [];
    const sk = sleeveOf(ar);
    const holds = tg && !tg.two && tg.arm === ar0;
    if (ar0 === nearArm && (o.held ?? "none") === "cup") out.push(...cupShapes(add(nearArm.W, mul(nearArm.dir, 9 * k)), k));
    if (holds) out.push(...toolShapes());
    // the toga's end hanging from the wrapped forearm (straight down, gravity)
    if (sk === "toga" && lie < 0.98) {
      const hA = mix2(ar.E, ar.W, 0.05);
      const hB = mix2(ar.E, ar.W, 0.55);
      const drop = 70 * (1 - lie);
      out.push({ d: closedD([hA, hB, add(hB, [6, drop * 0.55]), add(hB, [4, drop]), add(mix2(hA, hB, 0.5), [0, drop + 9]), add(hA, [-6, drop - 2]), add(hA, [-5, drop * 0.45])], 0.7), fill: ink.over });
      out.push({ d: tubeD([add(mix2(hA, hB, 0.5), [1, 10]), add(mix2(hA, hB, 0.5), [2, drop])], [2, 6]), fill: ink.over, cast: true, op: 0.4 });
    }
    const uu = norm(sub(ar.E, ar.S));
    const sh0 = add(ar.S, mul(uu, 4));
    // a soft tapered arm: full at the shoulder and the forearm's belly, slim at the wrist, the mitten's width there
    out.push({ d: tubeD([sh0, mix2(ar.S, ar.E, 0.5), ar.E, mix2(ar.E, ar.W, 0.3), mix2(ar.E, ar.W, 0.72), ar.W], [27 * k, 25 * k, 21 * k, 21.5 * k, 18 * k, 15.5 * k]), fill: skin });
    if (sk === "short" || sk === "elbow") {
      // the sleeve: a short flared extension of the tunic, rooted inside the shoulder (one silhouette with the body)
      const fr = sk === "elbow" ? 0.95 : 0.55;
      const end = mix2(ar.S, ar.E, fr);
      const n0: P2 = [-uu[1], uu[0]];
      const no = mul(n0, -ar.sgn); // the arm's outer side, fixed per arm (continuous through any swing)
      const flare = (sk === "elbow" ? 15 : 17) * k;
      // built in the arm's own frame (it turns with the arm: never self-crossing when the arm goes up)
      out.push({
        d: closedD(
          [
            add(add(ar.S, mul(uu, -9)), mul(no, -12 * k)),
            add(add(ar.S, mul(uu, -11)), mul(no, 3 * k)),
            add(add(ar.S, mul(uu, 2)), mul(no, 14 * k)),
            add(end, mul(no, flare)),
            add(add(end, mul(uu, 2)), mul(no, flare * 0.1)),
            add(end, mul(no, -flare)),
            add(add(ar.S, mul(uu, 12)), mul(no, -13 * k)),
          ],
          0.8,
        ),
        fill: tunic,
      });
    }
    if (sk === "toga") {
      const tEnd = mix2(ar.E, ar.W, 0.55);
      const tw = [31, 29, 27, 24].map((v, i) => mix(v, [23, 21.5, 19.5, 18][i], lie));
      out.push({ d: tubeD([add(ar.S, mul(uu, 4)), mix2(ar.S, ar.E, 0.5), ar.E, tEnd], tw.map((v) => v * k)), fill: ink.over });
    }
    out.push(...mitten(ar));
    return out;
  };

  // ---- the legs and feet --------------------------------------------------------------------------------------------
  const footKind: "bare" | "sandal" | "caliga" | "shoe" = slave ? "bare" : dominus ? "shoe" : overseer ? "caliga" : "sandal";
  const absS = Math.abs(r.s);
  const footPts = (): P2[] => {
    // front view: a small rounded nub; side view: a small foot with a round toe (toward +x); same point count
    const front: P2[] = [[-9, -11], [0, -13], [9, -11], [12.5, -4], [10, 1], [0, 2], [-10, 1], [-12.5, -4]];
    const side: P2[] = [[-9, -12], [2, -13], [14, -9], [25, -4], [26, 0], [13, 2], [-7, 2], [-11, -4]];
    const t = sst(0, 0.55, absS);
    return front.map((p, i) => mix2(p, side[i], t));
  };
  const legShapes = (l: LegRig): Shape[] => {
    const out: Shape[] = [];
    const far = l.z < 0;
    const dark = 0.14 * sst(0.05, 0.45, -l.z);
    const legC = mixC(skin, "#5A4436", dark);
    const ank = l.A;
    out.push({ d: tubeD([add(l.H, [0, -6]), mix2(l.H, l.K, 0.5), l.K, mix2(l.K, ank, 0.32), mix2(l.K, ank, 0.72), ank], [31 * k, 28 * k, 22 * k, 23 * k, 18 * k, 15 * k]), fill: legC });
    void far;
    // the foot: from the ankle, rotated by its lift (deg, heel up when facing right)
    const fp = footPts().map((p): P2 => add(ank, rot([p[0] * G * k, (p[1] + 13) * k], G * l.lift)));
    const chalk = slave && !!o.chalk;
    const footFill = footKind === "shoe" ? ink.leather : chalk ? mixC(legC, "#F2ECE0", 0.72) : legC;
    out.push({ d: closedD(fp, 0.9), fill: footFill });
    if (footKind === "sandal" || footKind === "caliga") {
      // the sole showing under the foot, a strap across the instep
      out.pop();
      out.push({ d: closedD(fp.map((p) => add(p, rot([0, 1.8 * k], G * l.lift))), 0.9), fill: ink.leather, sh: 0 });
      out.push({ d: closedD(fp.map((p) => add(p, rot([0, -0.8 * k], G * l.lift))), 0.9), fill: footFill });
      const u = norm(sub(ank, l.K));
      const nn: P2 = [-u[1], u[0]];
      out.push({ d: lineD([add(ank, mul(nn, -6 * k)), add(ank, add(mul(nn, 6 * k), mul(u, 3 * k)))]), fill: ink.leather, det: 2.2, keep: true, op: 0.9 });
      if (footKind === "caliga")
        out.push({ d: [0.5, 0.66, 0.82].map((fr) => lineD([add(mix2(l.K, ank, fr), mul(nn, -7 * k)), add(mix2(l.K, ank, fr + 0.07), mul(nn, 7 * k))])).join(" "), fill: ink.leather, det: 2.2, keep: true, op: 0.9 });
    }
    if (chalk) {
      const u = norm(sub(ank, l.K));
      out.push({ d: tubeD([add(ank, mul(u, -12 * k)), add(ank, mul(u, 2 * k))], [12 * k, 15 * k]), fill: mixC(legC, "#F2ECE0", 0.6), sh: 0, op: 0.6 });
    }
    if (fetters) {
      const u = norm(sub(ank, l.K));
      const nn: P2 = [-u[1], u[0]];
      const c = add(ank, mul(u, -6 * k));
      out.push({ d: closedD([add(c, add(mul(nn, -11 * k), mul(u, -3.6))), add(c, add(mul(nn, 11 * k), mul(u, -3.6))), add(c, add(mul(nn, 11 * k), mul(u, 3.6))), add(c, add(mul(nn, -11 * k), mul(u, 3.6)))], 0.5), fill: ink.iron });
    }
    return out;
  };
  const legsSorted = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);
  const chainShapes = (): Shape[] => {
    if (!fetters) return [];
    const ua = norm(sub(r.legL.A, r.legL.K));
    const ub = norm(sub(r.legR.A, r.legR.K));
    const a = add(r.legL.A, mul(ua, -6 * k));
    const b = add(r.legR.A, mul(ub, -6 * k));
    const len = o.chainLen ?? 74;
    return chainLinks(chainPts(a, b, len, 4), Math.round(len / 5.6), 5.6).map((s) => ({ ...s, fill: ink.iron }));
  };

  // ---- the lower garment -----------------------------------------------------------------------------------------
  const legPt = legPtOf;
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * 20;
  const skirt = skirtOutlineOf(kind, variant, q, o.garb);
  const skirtD = closedD(skirt, 0.8);
  const skX0 = Math.min(...skirt.map((p) => p[0]));
  const skX1 = Math.max(...skirt.map((p) => p[0]));
  const skY0 = Math.min(...skirt.map((p) => p[1]));
  const skY1 = Math.max(...skirt.map((p) => p[1]));
  const skirtFill = dominus ? ink.over : tunic;
  const skirtShapes: Shape[] = [{ d: skirtD, fill: skirtFill }];
  // soft fold shapes from the belt toward the hem (positions from the garment's box: continuous)
  const nF = dominus ? 3 : garb === "loincloth" ? 0 : 2;
  for (let i = 0; i < nF; i++) {
    const t = (i + 0.7) / (nF + 0.4);
    const top: P2 = [mix(skX0 + 10, skX1 - 10, mix(0.3, 0.75, t)), skY0 + 18];
    const bot: P2 = [mix(skX0 + 6, skX1 - 6, t) + hdx * 0.3, skY1 - 2];
    skirtShapes.push({ d: tubeD([top, mix2(top, bot, 0.5), bot], [2.5, 6, 9]), fill: skirtFill, cast: true, op: 0.38, clip: skirtD });
  }
  if (garb === "loincloth") {
    const w0 = tor([-12, 4]);
    const w1 = tor([12, 4]);
    const lo = add(mix2(legPt(r.legL, 0.45), legPt(r.legR, 0.45), 0.5), [hdx * 0.2, 4]);
    skirtShapes.push({ d: closedD([w0, w1, add(lo, [8, 0]), add(lo, [0, 3]), add(lo, [-8, 0])], 0.6), fill: tunic });
  }

  // ---- the torso and what is worn on it ----------------------------------------------------------------------------
  const TORSO = torsoOutline(shY - 9, 8);
  const torsoD = closedD(TORSO, 0.9);
  const torsoShapes: Shape[] = [];
  torsoShapes.push({ d: torsoD, fill: garb === "loincloth" ? skin : tunic });
  const beltCol = ink.belt;
  const belt = () => torsoShapes.push({ d: closedD(bandOn(-A * 1.02, A * 1.02, () => -19, () => -11, 1.2), 0.6), fill: beltCol, sh: 0.5 });
  if (garb === "exomis") {
    // pinned on his left shoulder (screen right when he faces us): his right shoulder and chest bare
    // the bare part (his right shoulder and chest, down to the diagonal edge of the cloth); the rest is the tunic
    const BARE: P2[] = [[-A * 1.02, shY - 14], [hw * 0.3, shY - 14], [hw * 0.3, shY - 6], [-14, shY + 30], [-A * 1.02, shY + 62]];
    torsoShapes.push({ d: closedD(regionOn(BARE, 0.4), 0.6), fill: skin, clip: torsoD });
    torsoShapes.push({ d: ellD(tor([hw * 0.62, shY - 1], 1.5), 5.5, 5), fill: shadeOf(tunic, 0.25), sh: 0.4 });
    belt();
  } else if (garb === "loincloth") {
    torsoShapes.push({ d: closedD(bandOn(-A * 1.02, A * 1.02, () => -10, () => 2, 1.2), 0.6), fill: tunic, sh: 0.5 });
  } else {
    // the round neckline showing the throat
    torsoShapes.push({ d: closedD(regionOn([[-13, shY - 6], [13, shY - 6], [8, shY + 6], [0, shY + 10], [-8, shY + 6]], 0.8, 2), 0.8), fill: skin, sh: 0 });
    if (female) torsoShapes.push({ d: closedD(bandOn(-hw * 1.0, hw * 1.0, () => shY + 30, () => shY + 36, 1.2), 0.6), fill: beltCol, sh: 0.4 });
    else if (!dominus) belt();
  }
  if (dominus && o.stripe) {
    // the senator's broad stripes (clavi) down the tunic, under the toga
    for (const x of [-15, 15]) torsoShapes.push({ d: closedD(regionOn([[x - 3.5, shY - 4], [x + 3.5, shY - 4], [x + 3.5, -8], [x - 3.5, -8]], 0.7, 4), 0.5), fill: ink.trim, sh: 0 });
  }
  // the freeman's leather apron: a bib on the chest, the skirt hanging from the belt to the knees
  const apronShapes: Shape[] = [];
  if (apron) {
    const kn = add(mix2(r.legL.K, r.legR.K, 0.5), [hdx * 0.3, 14]);
    const wf = Math.hypot(B.cY, 0.62 * B.s);
    const bl = tor([-24, -14], 1);
    const br = tor([24, -14], 1);
    const mid = mix2(bl, br, 0.5);
    const ax = norm(sub(kn, mid));
    const nn: P2 = [-ax[1], ax[0]];
    const kR = sub(kn, mul(nn, 26 * wf));
    const kL = add(kn, mul(nn, 26 * wf));
    const AP: P2[] = [tor([-15, shY + 26], 1), tor([15, shY + 26], 1), tor([18, -40], 1), br, kR, kL, bl, tor([-18, -40], 1)];
    apronShapes.push({ d: closedD(AP, 0.55), fill: ink.over });
    apronShapes.push({ d: lineD([tor([-15, shY + 27], 1), tor([-11, shY - 6], 1)]) + " " + lineD([tor([15, shY + 27], 1), tor([11, shY - 6], 1)]), fill: ink.over, det: 2.4, keep: true, op: 0.9 });
  }
  // the toga over the torso (over the left shoulder: screen right when he faces us), the balteus across the chest,
  // its border stripe, the sinus swag over the thighs, the end panel down his left side
  if (dominus) {
    const wst = A * 0.86;
    const TOGA_UP: P2[] = [[hw * 1.15, shY - 8], [8, shY - 8], [-6, shY + 30], [-wst - 6, -20], [-wst - 8, -4], [wst + 8, -4], [wst + 10, -40], [hw * 1.2, shY + 26]];
    torsoShapes.push({ d: closedD(regionOn(TOGA_UP, 1.2), 0.6), fill: ink.over });
    // the balteus: the rolled edge from the left shoulder down across the chest to under the right arm
    const balt: P2[] = [];
    const baltB: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = mix(10, -wst - 4, t) + 6 * Math.sin(Math.PI * t);
      const y = mix(shY - 6, -18, t);
      balt.push(tor([x - 4, y - 3], 1.8));
      baltB.push(tor([x + 7, y + 9], 1.8));
    }
    torsoShapes.push({ d: closedD([...balt, ...baltB.reverse()], 0.7), fill: mixC(ink.over, "#FFFFFF", 0.25) });
    // the toga's border along the balteus' lower edge: muted red-brown (broad with `stripe`)
    const bw = o.stripe ? 3.6 : 1.8;
    const sB: P2[] = [];
    const sB2: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = mix(10, -wst - 4, t) + 6 * Math.sin(Math.PI * t) + 7;
      const y = mix(shY - 6, -18, t) + 9;
      sB.push(tor([x - bw * 0.5, y - bw], 2));
      sB2.push(tor([x + bw * 0.5, y + bw * 0.6], 2));
    }
    torsoShapes.push({ d: closedD([...sB, ...sB2.reverse()], 0.7), fill: ink.trim, sh: 0 });
    // two soft folds swagging across the chest
    for (const i of [0, 1]) {
      const a = tor([hw * 0.85 - i * 8, shY + 18 + i * 22], 1.2);
      const b = tor([-wst + 14 + i * 14, -12], 1.2);
      const c = tor([mix(hw * 0.85 - i * 8, -wst + 14 + i * 14, 0.45) + 6, mix(shY + 18 + i * 22, -12, 0.65)], 1.2);
      torsoShapes.push({ d: tubeD([a, c, b], [2, 6, 3]), fill: ink.over, cast: true, op: 0.35, clip: torsoD });
    }
  }
  const sinusShapes: Shape[] = [];
  if (dominus) {
    const wst = A * 0.86;
    if (lie < 0.999) {
      const L0 = tor([-wst - 8, -6], 1);
      const R0 = tor([wst * 0.75, -16], 1);
      const kneeY = (r.legL.K[1] + r.legR.K[1]) / 2;
      const by = Math.max(L0[1], R0[1]) + Math.max(36, (kneeY - Math.max(L0[1], R0[1])) * 0.78);
      const bot: P2 = [mix(L0[0], R0[0], 0.45) + hdx * 0.4, by];
      const inn: P2 = add(bot, [4, -22]);
      const pts: P2[] = [L0, [L0[0] - 6, mix(L0[1], by, 0.6)], bot, [R0[0] + 8, mix(R0[1], by, 0.55)], R0, add(R0, [-6, -2]), inn, add(L0, [8, -2])];
      sinusShapes.push({ d: closedD(pts, 0.7), fill: ink.over, op: 1 - lie });
      sinusShapes.push({ d: tubeD([add(L0, [6, 8]), add(inn, [0, 10]), add(R0, [-4, 6])], [2, 5, 2]), fill: ink.over, cast: true, op: 0.4 * (1 - lie) });
    }
    if (lie > 0.001) {
      const W0 = tor([-wst - 6, -4], 1);
      const W1 = tor([wst * 0.7, -18], 1);
      const T = mix2(legPt(r.legL, 0.55), legPt(r.legR, 0.55), 0.5);
      const M = mix2(W0, W1, 0.5);
      const cOut = add(T, mul(norm(sub(T, M)), 14));
      const cIn = mix2(M, T, 0.5);
      sinusShapes.push({ d: closedD([W0, mix2(W0, cOut, 0.6), cOut, mix2(W1, cOut, 0.6), W1, mix2(W1, M, 0.18), cIn, mix2(W0, M, 0.18)], 0.7), fill: ink.over, op: lie });
    }
    // the end panel falling from his left shoulder to the hem down his left side
    const yB = skY1 - r.hip[1] - 4;
    const te: P2[] = [[hw * 0.45, shY + 4], [hw * 1.0, shY - 2], [hw * 1.08, shY + 60], [hw * 1.12, yB - 6], [hw * 0.92, yB + 2], [hw * 0.7, yB - 6], [hw * 0.5, yB], [hw * 0.42, shY + 70]];
    const teP = te.map((p) => toFig(B.on(p, 2).p));
    sinusShapes.push({ d: closedD(teP, 0.7), fill: ink.over, op: 1 - lie * 0.9 });
    if (o.stripe) sinusShapes.push({ d: closedD([toFig(B.on([hw * 0.44, shY + 8], 2.2).p), toFig(B.on([hw * 0.52, shY + 8], 2.2).p), toFig(B.on([hw * 0.56, yB - 4], 2.2).p), toFig(B.on([hw * 0.48, yB - 4], 2.2).p)], 0.4), fill: ink.trim, sh: 0, op: 1 - lie * 0.9 });
    sinusShapes.push({ d: tubeD([toFig(B.on([hw * 0.75, shY + 20], 2.2).p), toFig(B.on([hw * 0.82, yB - 14], 2.2).p)], [2, 7]), fill: ink.over, cast: true, op: 0.4 * (1 - lie) });
  }
  // the freewoman's palla: a mantle over the shoulders, its end down her left side
  if (female && freeman) {
    const PAL: P2[] = [[-hw * 1.1, shY - 2], [-8, shY - 9], [8, shY - 9], [hw * 1.12, shY - 2], [hw * 1.14, shY + 34], [hw * 0.5, shY + 50], [0, shY + 44], [-hw * 0.6, shY + 52], [-hw * 1.14, shY + 30]];
    torsoShapes.push({ d: closedD(regionOn(PAL, 2), 0.7), fill: ink.over });
    torsoShapes.push({ d: tubeD([tor([hw * 0.6, shY + 14], 2), tor([hw * 0.3, shY + 44], 2)], [2, 6]), fill: ink.over, cast: true, op: 0.35 });
  }
  // the overseer's short cloak: the back panel behind him; the front over his left shoulder, pinned on his right
  const cloakBack: Shape[] = [];
  if (overseer) {
    const back: P2[] = [toFig([B.edge(shY)[0] - 4, shY - 3]), toFig([B.edge(shY)[1] + 6, shY - 4]), toFig([B.edge(shY + 40)[1] + 14, shY + 40]), toFig([B.edge(-30)[1] + 12, 40]), toFig([B.edge(-30)[0] - 6, 34]), toFig([B.edge(shY + 40)[0] - 8, shY + 40])];
    cloakBack.push({ d: closedD(back, 0.6), fill: mixC(ink.over, "#1E2526", 0.25) });
    const CL: P2[] = [[-hw * 0.7, shY - 6], [0, shY - 10], [hw * 1.12, shY - 6], [hw * 1.2, shY + 34], [hw * 1.14, -10], [hw * 0.4, 2], [-hw * 0.2, shY + 54], [-hw * 0.62, shY + 10]];
    torsoShapes.push({ d: closedD(regionOn(CL, 2.2), 0.6), fill: ink.over });
    torsoShapes.push({ d: tubeD([tor([-hw * 0.5, shY + 4], 2.4), tor([hw * 0.1, shY + 40], 2.4), tor([hw * 0.55, -6], 2.4)], [2, 6, 3]), fill: ink.over, cast: true, op: 0.35 });
    torsoShapes.push({ d: ellD(tor([-hw * 0.62, shY + 2], 3), 5.5, 5.5), fill: ink.trim, sh: 0.6 });
  }
  if (collar) {
    const cpts: P2[] = [];
    const cptsB: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const x = mix(-20, 20, i / 12);
      const y = shY + 3 + 5 * (1 - ((x / 20) ** 2));
      cpts.push(tor([x * 1.1, y - 3.5], 2));
      cptsB.push(tor([x * 1.1, y + 3.5], 2));
    }
    torsoShapes.push({ d: closedD([...cpts, ...cptsB.reverse()], 0.5), fill: ink.iron });
    torsoShapes.push({ d: ellD(tor([0, shY + 16], 2), 4.2, 4.8), fill: ink.iron, sh: 0.4 });
  }
  if (o.titulus) {
    const bc = tor([4, shY + 30], 3);
    const bw = 20;
    const bh = 13;
    torsoShapes.push({ d: lineD([add(bc, [-bw * 0.7, -bh + 1]), tor([-9, shY - 4], 2)]) + " " + lineD([add(bc, [bw * 0.7, -bh]), tor([9, shY - 4], 2)]), fill: "#6B5A46", det: 1.6, keep: true, op: 0.9 });
    torsoShapes.push({ d: closedD([add(bc, [-bw, -bh + 1]), add(bc, [bw, -bh - 0.5]), add(bc, [bw, bh - 0.5]), add(bc, [-bw, bh + 1])], 0.25), fill: "#EDE4CF", sh: 0.6 });
  }

  // ---- the head ---------------------------------------------------------------------------------------------------
  const headShapes: Shape[] = [];
  const headBehind: Shape[] = [];
  const hy = head.yaw;
  const earAt = (sgn: number) => hProj(head, sgn * 1.62, 0.0, 1.0);
  for (const sgn of [-1, 1]) {
    const e = earAt(sgn);
    const dd = ellD(e.p, 6.2 * fs, 8.4 * fs, head.roll);
    headBehind.push({ d: dd, fill: skin, sh: 0.5 });
  }
  // the bun (behind the head)
  if (look.hair === "bun") {
    const bn = hProj(head, Math.PI, -0.18, 1.12);
    headBehind.push({ d: ellD(bn.p, 12 * fs, 11 * fs, head.roll), fill: ink.hair });
  }
  const headD = ellD(head.C, HR * 0.985, HR * 1.03, head.roll);
  headShapes.push({ d: headD, fill: skin });
  // the near ear coming round in front of the head (a crossfade by its depth)
  for (const sgn of [-1, 1]) {
    const e = earAt(sgn);
    const w = sst(-0.08, 0.2, e.d);
    if (w > 0.002) headShapes.push({ d: ellD(e.p, 6.2 * fs, 8.4 * fs, head.roll), fill: skin, sh: 0.5, op: w });
  }
  // the face
  const brow = Math.max(q.brow, look.brow);
  const lids = q.lids;
  for (const sgn of [-1, 1]) {
    const e = hProj(head, sgn * 0.36, 0.02 - 0.06 * lids);
    const v = sst(0.12, 0.38, e.d);
    if (v > 0.003) {
      const ry = 3.25 * fs * (1 - 0.42 * c01(lids));
      headShapes.push({ d: ellD(e.p, 2.65 * fs * mix(0.55, 1, e.d), ry, head.roll), fill: eye, sh: 0, op: v });
    }
    const b = hProj(head, sgn * 0.7, -0.3);
    const vb = sst(0.15, 0.4, b.d);
    if (vb > 0.003) headShapes.push({ d: ellD(b.p, 4.8 * fs * mix(0.6, 1, b.d), 3 * fs, head.roll), fill: blush, sh: 0, op: 0.5 * vb });
    if (Math.abs(brow) > 0.12) {
      const inner = hProj(head, sgn * 0.2, 0.24 - (brow > 0 ? 0.07 * brow : 0.05 * brow));
      const outer = hProj(head, sgn * 0.54, 0.27 + (brow < 0 ? -0.06 * brow : 0.02));
      const vv = sst(0.15, 0.4, Math.min(inner.d, outer.d)) * sst(0.12, 0.3, Math.abs(brow));
      if (vv > 0.003) headShapes.push({ d: lineD([inner.p, outer.p]), fill: mixC(ink.hair, "#2A201A", 0.2), det: 2.6, keep: true, op: 0.85 * vv });
    }
  }
  // hair: a region on the sphere above the hairline (+ curls for the curly hair)
  const hairH = (beta: number) => {
    const u = (1 - Math.cos(beta)) / 2; // 0 front .. 1 back
    const temple = 0.14 * Math.sin(Math.PI * u) ** 2;
    switch (look.hair) {
      case "close":
        return mix(0.5, -0.22, ease(u)) + temple;
      case "curly":
        return mix(0.5, -0.2, ease(u)) + temple;
      case "bun":
        return mix(0.42, -0.3, ease(u)) + temple;
      case "receding":
        return mix(0.95, -0.18, ease(u)) + 0.05 * Math.sin(Math.PI * u);
      default:
        return mix(0.55, -0.2, ease(u)) + temple;
    }
  };
  const hairPoly = regionPoly(head, (b, p) => p > hairH(b), "top", 1.045);
  const subs: P2[][] = [];
  if (hairPoly.length > 2) subs.push(cw(hairPoly.map((u) => hToFig(head, u))));
  if (look.hair === "curly" || look.hair === "receding") {
    // curls round the hairline and over the crown (points on the sphere: they turn with the head)
    const curls: [number, number, number][] = [];
    if (look.hair === "curly") {
      for (let i = -6; i <= 6; i++) {
        const beta = (i / 6) * 2.6;
        curls.push([beta, hairH(beta) + 0.02, 0.15]);
      }
      for (let i = 0; i < 9; i++) curls.push([-2.4 + i * 0.6, 0.95, 0.17]);
    } else {
      // receding: tufts over the ears
      for (const sgn of [-1, 1]) for (let i = 0; i < 4; i++) curls.push([sgn * (1.25 + i * 0.32), hairH(sgn * (1.25 + i * 0.32)) + 0.06, 0.12]);
    }
    for (const [beta, phi, rad] of curls) {
      const c = hProj(head, beta, phi, 1.02);
      if (c.d < -0.25) continue;
      subs.push(cw(ellPts(c.p, rad * HR, rad * HR * 0.92, head.roll, 10)));
    }
  }
  const hairD = subs.map((sp2) => closedD(sp2, 0.9)).join(" ");
  // beard
  const beardShapes: Shape[] = [];
  if (look.beard !== "none") {
    const g = (beta: number) => {
      const a = Math.abs(beta);
      // round the jaw to the sideburns, then (behind the ear) down to the underside of the chin: the region closes at
      // the pole under the chin smoothly (no azimuth cut there)
      const side = look.beard === "full" ? -0.16 : look.beard === "short" ? -0.28 : -0.34;
      if (a <= 1.45) return mix(look.beard === "full" ? -0.44 : -0.52, side, ease(a / 1.45));
      return mix(side, -1.45, ease(Math.min(1, (a - 1.45) / 0.5)));
    };
    const bp = regionPoly(head, (b, p) => p < g(b), "bottom", 1.03);
    const bsubs: P2[][] = [];
    if (bp.length > 2) bsubs.push(cw(bp.map((u) => hToFig(head, u))));
    if (look.beard === "full") {
      const ch = hProj(head, 0, -0.9, 1.0);
      if (ch.d > -0.4) bsubs.push(cw(ellPts(add(ch.p, rot([0, 3], head.roll)), 0.3 * HR * mix(0.75, 1, Math.abs(Math.cos(hy))), 0.24 * HR, head.roll, 12)));
    }
    if (look.beard === "short" || look.beard === "full") {
      // the moustache under the nose
      const m0 = hProj(head, -0.3, -0.44, 1.01);
      const m1 = hProj(head, 0, -0.36, 1.02);
      const m2 = hProj(head, 0.3, -0.44, 1.01);
      if (Math.max(m0.d, m2.d) > 0) bsubs.push(cw([add(m0.p, [0, 2]), add(m1.p, [0, -2]), add(m2.p, [0, 2]), add(m1.p, [0, 4])]));
    }
    const bd = bsubs.map((sp2) => closedD(sp2, 0.9)).join(" ");
    beardShapes.push({ d: bd, fill: look.beard === "stubble" ? mixC(skin, ink.hair, 0.3) : mixC(ink.hair, skin, 0.12), sh: look.beard === "stubble" ? 0 : 0.6, op: look.beard === "stubble" ? 0.2 : 1, clip: look.beard === "stubble" ? headD : undefined });
  }
  // the nose (a small soft shape on the face; it reaches the outline in profile)
  const nz = hProj(head, 0, -0.16, 1.05);
  const nv = sst(-0.1, 0.25, nz.d);
  const noseShapes: Shape[] = nv > 0.003 ? [{ d: ellD(nz.p, fs * (3.4 + 1.2 * Math.abs(Math.sin(hy))), 3.9 * fs, head.roll), fill: skinSh, sh: 0, op: nv }] : [];
  // the mouth: only when it acts (effort: a small dark oval; pleased: a small smile)
  const mouthShapes: Shape[] = [];
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
  // the pilleus: a felt cap on the skull with a rounded dome, tilted back
  const capShapes: Shape[] = [];
  if (pilleus) {
    const reg = regionPoly(head, (b, p) => p > mix(0.5, 0.18, ease((1 - Math.cos(b)) / 2)), "top", 1.06);
    const tilt = -16 * Math.sin(hy);
    const dome: P2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * Math.PI;
      const x = -Math.cos(t) * 0.86;
      const y = -0.5 - Math.sin(t) * 0.9 * (1 - 0.12 * Math.cos(t));
      dome.push([x, y]);
    }
    const domeF = dome.map((u) => add(head.C, rot(rot([u[0] * HR, u[1] * HR], tilt), head.roll)));
    const csubs = [cw(domeF)];
    if (reg.length > 2) csubs.push(cw(reg.map((u) => hToFig(head, u))));
    capShapes.push({ d: csubs.map((sp2) => closedD(sp2, 0.9)).join(" "), fill: ink.cap });
  }
  const headTopY = pilleus ? -1.4 : -1.07;
  const headTop = add(head.C, rot([0, headTopY * HR], head.roll));

  // ---- the shoulder load ------------------------------------------------------------------------------------------
  const loadShapes: Shape[] = [];
  if (load !== "none") {
    const lg = loadGeomOf(r, G);
    const T = (p: P2): P2 => add(lg.c, rot([-G * p[0], p[1]], lg.ang));
    loadShapes.push(...loadArt(load, T, true));
  }

  // ---- ASSEMBLY ---------------------------------------------------------------------------------------------------
  const arms = [r.armL, r.armR];
  const armKey = (ar: ArmRig): "L" | "R" => (ar.sgn < 0 ? "L" : "R");
  if (o.onlyArm) {
    const ar = o.onlyArm === "L" ? r.armL : r.armR;
    return { shapes: armShapes(ar).map((s) => ({ ...s, d: s.d })), headC: head.C, headR: HR, headTop };
  }
  const shown = arms.filter((ar) => o.hideArm !== armKey(ar));
  // the front-layer weight of each arm: 1 beside / in front of the body, 0 behind it (crossfade over yaw 0.22..0.36)
  const frontW = (ar: ArmRig) => sst(-0.35, -0.22, ar.z);
  const two = tg && tg.two;
  const profile = Math.abs(r.s) > 0.3;
  const out: Shape[] = [];
  out.push(...cloakBack);
  if (two && profile) out.push(...toolShapes());
  for (const ar of shown) {
    const w = frontW(ar);
    if (w < 0.999) out.push(...armShapes(ar));
  }
  out.push(...legShapes(legsSorted[0]));
  out.push(...chainShapes());
  out.push(...legShapes(legsSorted[1]));
  out.push(...skirtShapes);
  // the neck
  out.push({ d: tubeD([toFig([0, shY + 4]), mix2(toFig([0, shY]), head.C, 0.6)], [24 * k, 20 * k]), fill: skinSh, sh: 0 });
  out.push(...torsoShapes);
  out.push(...apronShapes);
  out.push(...sinusShapes);
  // the shoulder load sits behind the head and under the steadying hand (romeCast's order)
  out.push(...loadShapes);
  out.push(...headBehind);
  out.push(...headShapes);
  if (hairD) out.push({ d: hairD, fill: ink.hair });
  out.push(...beardShapes);
  out.push(...noseShapes);
  out.push(...mouthShapes);
  out.push(...capShapes);
  // the arms in front (sorted by depth), the far one fading in only while it is beside the body
  const front = [...shown].sort((a, b) => a.z - b.z);
  for (const ar of front) {
    const w = frontW(ar);
    if (w <= 0.001) continue;
    const sh = armShapes(ar);
    out.push(...(w >= 0.999 ? sh : sh.map((s) => ({ ...s, op: (s.op ?? 1) * w }))));
  }
  if (two && !profile) out.push(...toolShapes());
  return { shapes: out, headC: head.C, headR: HR, headTop };
};

// ===================================================================================================================
// HELD AND CARRIED THINGS (rig units; T maps the thing's local units to figure-local)
// ===================================================================================================================
export const AMPHORA = "#A3654D";
export const SACK = "#C3B08C";
export const WICKER = "#B0945F";
/** a load's shapes; local units: centred, long axis along +x (lying) */
export const loadArt = (kind: Exclude<RomeLoad, "none">, T: (p: P2) => P2, lying: boolean): Shape[] => {
  const out: Shape[] = [];
  if (kind === "amphora") {
    const body: P2[] = [[-62, 0], [-56, -9], [-36, -21], [-4, -24], [24, -20], [36, -10], [42, -6], [58, -6], [64, -8], [66, 0], [64, 8], [58, 6], [42, 6], [36, 10], [24, 20], [-4, 24], [-36, 21], [-56, 9]];
    for (const sd of [-1, 1]) out.push({ d: tubeD([T([40, sd * 6]), T([32, sd * 20]), T([20, sd * 20])], [5, 5, 5]), fill: mixC(AMPHORA, "#2C3433", 0.15), sh: 0 });
    out.push({ d: closedD(body.map(T), 0.9), fill: AMPHORA });
    out.push({ d: ellD(T([65, 0]), 2.2, 2.2), fill: "#3A2620", sh: 0, op: 0.7 });
    return out;
  }
  if (kind === "basket") {
    const B: P2[] = [[-30, -26], [30, -26], [24, 26], [-24, 26]];
    const rotq = (p: P2): P2 => (lying ? [p[1], -p[0]] : p);
    const bd = closedD(B.map((p) => T(rotq(p))), 0.35);
    out.push({ d: bd, fill: WICKER });
    out.push({ d: [-12, 2, 16].map((y) => lineD([T(rotq([-30, y])), T(rotq([0, y + 3])), T(rotq([30, y]))])).join(" "), fill: WICKER, det: 1.6, op: 0.5, clip: bd });
    out.push({ d: tubeD([T(rotq([-32, -27])), T(rotq([0, -25])), T(rotq([32, -27]))], [7, 7.4, 7]), fill: mixC(WICKER, "#4A3A28", 0.25) });
    return out;
  }
  const S2: P2[] = lying
    ? [[-50, -6], [-40, -20], [-10, -24], [20, -21], [42, -14], [52, -2], [50, 14], [38, 22], [10, 18], [-14, 22], [-40, 20], [-52, 8]]
    : [[-26, 30], [-32, 6], [-28, -18], [-14, -30], [-6, -34], [6, -34], [14, -30], [28, -18], [32, 6], [26, 30], [0, 34]];
  if (!lying) out.push({ d: closedD([T([-7, -32]), T([-10, -44]), T([10, -44]), T([7, -32])], 0.5), fill: SACK });
  out.push({ d: closedD(S2.map(T), 0.9), fill: SACK });
  if (lying) out.push({ d: closedD([T([50, -4]), T([60, -8]), T([62, 4]), T([52, 6])], 0.5), fill: SACK });
  else out.push({ d: tubeD([T([-9, -35]), T([9, -35])], [3.2, 3.2]), fill: "#6E5A42", sh: 0 });
  return out;
};
/** the shallow wine cup (kylix) in a fist: the stem at p, the bowl above; pewter-grey with dark wine (never orange) */
const cupShapes = (p: P2, k: number): Shape[] => {
  const T = (v: P2): P2 => add(p, mul(v, k));
  const metal = "#B9B3A6";
  return [
    { d: tubeD([T([0, -11]), T([0, 9])], [4.5, 4]), fill: metal, sh: 0 },
    { d: ellD(T([0, 10]), 7.5 * k, 2.6 * k), fill: metal, sh: 0 },
    { d: closedD([T([-19, -24]), T([19, -24]), T([14, -14]), T([0, -9]), T([-14, -14])], 0.8), fill: metal },
    { d: ellD(T([0, -23.5]), 15 * k, 3.2 * k), fill: "#5A2E2C", sh: 0 },
  ];
};
