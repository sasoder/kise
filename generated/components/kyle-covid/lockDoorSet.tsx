// ---------------------------------------------------------------------------
// lockDoorSet: the set of cut 56 (LockThatDoor, kyle-covid). The front of a small house at night, seen square on
// from outside (one-point perspective on londonDepth, inside the clip's medium: AirStage palette A, mood night):
// a plain wooden front door with four recessed panels in a timber casing, a plaster wall, a tall narrow window beside
// the door glowing cream from inside, a porch lantern on a bracket at the upper left, a timber threshold, a stone
// step and the path running to the frame's bottom edge. The hall inside is lit cream (#F3EBDD): "you", the home.
// Nothing here is orange or brass: the handle, keyhole plate and bolt are iron (slate).
//
// UNITS: the cast's (U = 178 per metre). X across (the door's centre X = 0), Y height (the path is Y = 0, up is -Y),
// Z depth behind the wall's face (Z = 0; toward the camera is -Z).
//   the porch floor (stone flags, deep, running past the camera) is Y = 0; the threshold (inside floor) FL = -6, a
//   timber sill 6 above the flags; the door leaf 164 x 350, its bottom edge GAP = 7 above the threshold
//   (the lit slit under the door), hinged on the left (X -82), opening inward; outer face at Z = DZ (8) when shut,
//   DT = 8 thick. leaf3(th, u, v, w): a point on the leaf (u from the hinge edge, v up from its bottom edge, w into
//   its thickness from the outer face) with the door swung in by th (radians).
//   the opening X -84..84 (a 2-unit seam each side), its head at FL - 360; the wall WALL_T = 30 thick.
//   the keyhole at leaf (u 150, v 158), the lever above it at v 188, the bolt at the keyhole's height.
//
// EXPORTS: the geometry constants, leaf3 / leafP, and the draw pieces in painter's order:
//   <Interior/>      the lit hall seen through the doorway (clip it to the opening: openingD)
//   <Jambs/>         the reveals (the latch side's back part lit while the crack lets light in)
//   <DoorLeaf/>      the leaf at angle th: panels, the iron lever and keyhole plate, the glowing keyhole
//   <Bolt/>          the bolt's end crossing the latch-side sliver
//   <SeamLights/>    the hinge seam and the slit under the door, glowing
//   <HouseFront/>    the wall with the openings cut out, the casings, the window
//   <Steps/>         threshold (outside part), step, path
//   <CrackSpill/>    the band of cream light from the crack across the threshold, step and path
//   <SlitSpill/>     the glow from the slit on the threshold and step, and its veil in the air
//   <Lantern/>       the porch lantern (glass glowing cream, iron frame and bracket)
// ---------------------------------------------------------------------------
import React from "react";
import { AirBox, AirFloor, c01, lerp, lineOf, mixHex, smoothstep, type AirWorld, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";

export type V3 = [number, number, number];
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
export const polyD = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ---- geometry -------------------------------------------------------------------------------------------------------
export const FL = -6;
export const GAP = 7;
export const DW = 164;
export const DH = 350;
export const HX = -82;
export const DZ = 8;
export const DT = 8;
export const OPEN = { x0: -84, x1: 84, top: FL - 360 };
export const WALL_T = 30;
export const CAS = 13;
export const CAS_P = 4;
/** the porch floor: stone flags from the wall out past where the camera stands at the end (a ramp from the low eye) */
export const PORCH = { x0: -900, x1: 900, z0: -1300, z1: 0 };
export const SILL = { x0: -97, x1: 97, z0: -14 };
export const KEY = { u: 149, v: 158 };
export const HANDLE = { u: 149, v: 190 };
export const BOLT_V = 158;
/** the lantern's glass centre */
export const LAMP: V3 = [-140, FL - 292, -26];
export const WIN = { x0: 118, x1: 156, top: FL - 338, bot: FL - 74, cas: 8, z: 9 };
/** the hall light inside (the crack's light comes from it) */
export const IN_LIGHT: V3 = [72, FL - 330, 420];
export const CREAM = "#F3EBDD";
export const CREAM_LO = "#D9CDB4";

// local materials (before fog and light)
// night versions of the style's materials (the lantern's pool lifts them near it; far from it they sink to ~L* 12-18)
export const PLASTER: Mat = { lit: "#7A6F5E", mid: "#433E36", dark: "#22201C" };
export const DOOR_T: Mat = { lit: "#684F38", mid: "#423325", dark: "#211912" };
export const TRIM: Mat = { lit: "#6E6454", mid: "#433D34", dark: "#211E1A" };
export const IRON: Mat = { lit: "#6F777A", mid: "#464D50", dark: "#24292B" };
export const STONE: Mat = { lit: "#655A4C", mid: "#40392F", dark: "#201C18" };
export const GROUND: Mat = { lit: "#4E4537", mid: "#3A3229", dark: "#1D1914" };

/** a point on the leaf: u from the hinge edge (0..DW), v up from its bottom edge (0..DH), w into its thickness */
export const leaf3 = (th: number, u: number, v: number, w = 0): V3 => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const a = w - DT;
  return [HX + u * c - a * s, FL - GAP - v, DZ + DT + u * s + a * c];
};
export const leafP = (A: AirWorld, th: number, u: number, v: number, w = 0): P2 => {
  const q = leaf3(th, u, v, w);
  return A.P.p(q[0], q[1], q[2]);
};
const P3 = (A: AirWorld, q: V3) => A.P.p(q[0], q[1], q[2]);
/** the opening's outline on the wall face (Z = 0) */
export const openingD = polyD([
  [OPEN.x0, FL],
  [OPEN.x1, FL],
  [OPEN.x1, OPEN.top],
  [OPEN.x0, OPEN.top],
]);

/** the lantern's light on a point: a soft falloff (1 at the lantern) */
export const lampLight = (q: V3) => {
  const d = Math.hypot(q[0] - LAMP[0], (q[1] - LAMP[1]) * 0.9, q[2] - LAMP[2]);
  return 1 / (1 + Math.pow(d / 230, 2));
};

// ===================================================================================================================
// INSIDE THE DOORWAY
// ===================================================================================================================
/** the lit hall: a cream far wall (brightest up toward the hall light) and a lit floor running in */
export const Interior: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const P = A.P;
  const zf = 430;
  const fl = [P.p(-260, FL, 30), P.p(260, FL, 30), P.p(260, FL, zf), P.p(-260, FL, zf)];
  const lp = P3(A, IN_LIGHT);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-iw`} gradientUnits="userSpaceOnUse" cx={f2(lp[0])} cy={f2(lp[1])} r={f2(320 * P.r(zf))}>
          <stop offset="0" stopColor="#FBF5EA" />
          <stop offset="0.5" stopColor={CREAM} />
          <stop offset="1" stopColor="#E3D6BE" />
        </radialGradient>
        <linearGradient id={`${uid}-if`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(fl[3][1])} x2="0" y2={f2(fl[0][1])}>
          <stop offset="0" stopColor="#E3D5BB" />
          <stop offset="0.6" stopColor="#EADFC8" />
          <stop offset="1" stopColor="#DCCBAB" />
        </linearGradient>
      </defs>
      <rect x={OPEN.x0 - 40} y={OPEN.top - 40} width={OPEN.x1 - OPEN.x0 + 80} height={-OPEN.top + FL + 80} fill={`url(#${uid}-iw)`} />
      <path d={polyD(fl)} fill={`url(#${uid}-if)`} />
      {/* the hall's floorboards running in (they give the slot under the door its depth from a low eye) */}
      <path
        d={Array.from({ length: 23 }, (_, i) => -242 + i * 22)
          .map((x) => `M${Pt(P.p(x, FL, 30))}L${Pt(P.p(x, FL, zf))}`)
          .join("")}
        stroke="#B9A381"
        strokeWidth={f2(0.9 * P.r(60))}
        strokeOpacity={0.55}
      />
      <path d={[96, 190, 300].map((z) => `M${Pt(P.p(-260, FL, z))}L${Pt(P.p(260, FL, z))}`).join("")} stroke="#B9A381" strokeWidth={f2(0.7 * P.r(60))} strokeOpacity={0.35} />
      {/* the inner part of the threshold, lit from inside */}
      <path d={polyD([P.p(OPEN.x0, FL, 0), P.p(OPEN.x1, FL, 0), P.p(OPEN.x1, FL, WALL_T), P.p(OPEN.x0, FL, WALL_T)])} fill="#D2BF9C" />
      <path d={`M${Pt(P.p(OPEN.x0, FL, WALL_T))}L${Pt(P.p(OPEN.x1, FL, WALL_T))}`} stroke="#A8916E" strokeWidth={f2(0.8 * P.r(30))} strokeOpacity={0.6} />
    </g>
  );
};

/** the reveals: left, right and head faces of the opening (Z 0..WALL_T). latchLit: how much interior light reaches
 *  the latch side's back part (1 while the crack is open, 0 once the door is pulled tight) */
export const Jambs: React.FC<{ A: AirWorld; latchLit: number; part: "back" | "front" }> = ({ A, latchLit, part }) => {
  const P = A.P;
  const out = A.tone(mixHex(PLASTER.mid, PLASTER.dark, 0.45), 0, 120);
  const backDark = A.tone(mixHex(PLASTER.dark, "#1E1A16", 0.4), 10, 120);
  const lit = mixHex("#CDBB9C", CREAM, 0.3);
  const face = (X: number, z0: number, z1: number) => polyD([P.p(X, FL, z0), P.p(X, FL, z1), P.p(X, OPEN.top, z1), P.p(X, OPEN.top, z0)]);
  if (part === "front")
    return (
      <g>
        <path d={face(OPEN.x0, 0, DZ)} fill={out} />
        <path d={face(OPEN.x1, 0, DZ)} fill={out} />
      </g>
    );
  return (
    <g>
      {/* the head (soffit), seen from below */}
      <path d={polyD([P.p(OPEN.x0, OPEN.top, 0), P.p(OPEN.x1, OPEN.top, 0), P.p(OPEN.x1, OPEN.top, WALL_T), P.p(OPEN.x0, OPEN.top, WALL_T)])} fill={mixHex(backDark, lit, 0.35 * latchLit)} />
      {/* left (hinge side): behind the leaf the hinge gap lets the hall light onto it */}
      <path d={face(OPEN.x0, DZ, WALL_T)} fill={mixHex(backDark, lit, 0.55)} />
      {/* right (latch side) */}
      <path d={face(OPEN.x1, DZ, WALL_T)} fill={mixHex(backDark, lit, latchLit)} />
    </g>
  );
};

// ===================================================================================================================
// THE DOOR LEAF
// ===================================================================================================================
/** the panels: [u0, u1, v0, v1] */
const PANELS: [number, number, number, number][] = [
  [24, 74, 44, 138],
  [90, 140, 44, 138],
  [24, 74, 178, 326],
  [90, 140, 178, 326],
];
export const DoorLeaf: React.FC<{ A: AirWorld; th: number; uid: string; keyLight: number }> = ({ A, th, uid, keyLight }) => {
  const L = (u: number, v: number, w = 0) => leafP(A, th, u, v, w);
  const Zm = leaf3(th, DW / 2, DH / 2)[2];
  const t = (hex: string) => A.tone(hex, Zm, 180);
  // the lantern's light across the leaf: a radial pool from the upper left, the lower right in deep shade
  const lp = P3(A, [LAMP[0] + 30, LAMP[1] + 20, 0]);
  const face = polyD([L(0, 0), L(DW, 0), L(DW, DH), L(0, DH)]);
  const sw = A.lw(0.9);
  const ln = t(lineOf(DOOR_T));
  // the face's lit level drops as it turns away from the lamp (it turns toward the hall as it opens)
  const turn = 1 - 0.25 * Math.sin(th) * 2;
  const gid = `${uid}-lf`;
  const els: React.ReactNode[] = [];
  PANELS.forEach(([u0, u1, v0, v1], i) => {
    const b = 6;
    const o = [L(u0, v0), L(u1, v0), L(u1, v1), L(u0, v1)];
    const n = [L(u0 + b, v0 + b, 2), L(u1 - b, v0 + b, 2), L(u1 - b, v1 - b, 2), L(u0 + b, v1 - b, 2)];
    // bevels: the top and left ones face away from the upper-left light (shade), bottom and right catch it
    els.push(
      <g key={`p${i}`}>
        <path d={polyD([o[3], o[2], n[2], n[3]])} fill="#1C150F" opacity={0.42} />
        <path d={polyD([o[0], o[3], n[3], n[0]])} fill="#1C150F" opacity={0.3} />
        <path d={polyD([o[0], o[1], n[1], n[0]])} fill={CREAM} opacity={0.13} />
        <path d={polyD([o[1], o[2], n[2], n[1]])} fill={CREAM} opacity={0.07} />
        <path d={polyD(n)} fill="#1C150F" opacity={0.1} />
        <path d={polyD(o)} fill="none" stroke={ln} strokeWidth={sw * 0.7} strokeOpacity={0.6} />
      </g>,
    );
  });
  // faint grain along the stiles and rails
  let grain = "";
  for (let i = 0; i < 9; i++) {
    const u = 6 + i * 19 + (i % 3) * 3;
    grain += `M${Pt(L(u, 8))}L${Pt(L(u + 1.5, DH - 8))}`;
  }
  // the iron hardware: a long backplate, the lever (pointing to the hinge side), the keyhole
  const plate = [L(HANDLE.u - 6, KEY.v - 16, -1), L(HANDLE.u + 6, KEY.v - 16, -1), L(HANDLE.u + 6, HANDLE.v + 12, -1), L(HANDLE.u - 6, HANDLE.v + 12, -1)];
  const ironT = (hex: string) => t(hex);
  const kc = L(KEY.u, KEY.v + 2, -1);
  const ks = (u: number, v: number) => L(KEY.u + u, KEY.v + v, -1);
  const rk = A.P.r(Zm);
  const keyD = `M${Pt(ks(-1.1, 1))}L${Pt(ks(-1.8, -5))}L${Pt(ks(1.8, -5))}L${Pt(ks(1.1, 1))}Z`;
  return (
    <g>
      <defs>
        <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={f2(lp[0])} cy={f2(lp[1])} r={f2(520)}>
          <stop offset="0" stopColor={t(mixHex(DOOR_T.lit, DOOR_T.mid, 1 - turn))} />
          <stop offset="0.45" stopColor={t(DOOR_T.mid)} />
          <stop offset="1" stopColor={t(mixHex(DOOR_T.mid, DOOR_T.dark, 0.75))} />
        </radialGradient>
      </defs>
      <path d={face} fill={`url(#${gid})`} stroke={ln} strokeWidth={sw} strokeLinejoin="round" />
      <path d={grain} fill="none" stroke={t(DOOR_T.dark)} strokeWidth={sw * 0.6} strokeOpacity={0.18} />
      {els}
      {/* the cream rim on the leaf's top and hinge edges */}
      <path d={`M${Pt(L(0, 0))}L${Pt(L(0, DH))}L${Pt(L(DW, DH))}`} fill="none" stroke={CREAM} strokeWidth={sw} strokeOpacity={0.12} />
      <path d={polyD(plate)} fill={ironT(IRON.mid)} stroke={ironT(lineOf(IRON))} strokeWidth={sw * 0.8} />
      <path d={`M${Pt(plate[3])}L${Pt(plate[0])}L${Pt(plate[1])}`} fill="none" stroke={CREAM} strokeWidth={sw * 0.8} strokeOpacity={0.25} />
      {/* the keyhole: the hall's light through it */}
      <circle cx={f2(kc[0])} cy={f2(kc[1])} r={f2(2.3 * rk)} fill={mixHex("#1A1612", CREAM, keyLight)} />
      <path d={keyD} fill={mixHex("#1A1612", CREAM, keyLight)} />
    </g>
  );
};

/** the lever on its rose, standing proud of the leaf (drawn above the microbes resting on the door's face);
 *  lever: degrees, - = lifted */
export const Lever: React.FC<{ A: AirWorld; th: number; lever: number }> = ({ A, th, lever }) => {
  const L = (u: number, v: number, w = 0) => leafP(A, th, u, v, w);
  const Zm = leaf3(th, DW / 2, DH / 2)[2];
  const t = (hex: string) => A.tone(hex, Zm, 180);
  const sw = A.lw(0.9);
  const rk = A.P.r(Zm);
  const la = (lever * Math.PI) / 180;
  const lev = (s: number, h: number) => L(HANDLE.u - Math.cos(la) * s + Math.sin(la) * h, HANDLE.v - Math.sin(la) * s - Math.cos(la) * h, -8);
  const lever3 = [lev(0, 2.6), lev(27, 2.4), lev(30, 0), lev(27, -2.4), lev(0, -2.6)];
  const rose = L(HANDLE.u, HANDLE.v, -2);
  return (
    <g>
      <circle cx={f2(rose[0])} cy={f2(rose[1])} r={f2(5 * rk)} fill={t(IRON.mid)} stroke={t(lineOf(IRON))} strokeWidth={sw * 0.8} />
      <path d={`M${Pt(rose)}L${Pt(lev(2, 0))}`} stroke={t(IRON.dark)} strokeWidth={f2(4.6 * rk)} strokeLinecap="round" />
      <path d={polyD(lever3)} fill={t(IRON.lit)} stroke={t(lineOf(IRON))} strokeWidth={sw * 0.8} strokeLinejoin="round" />
      <path d={`M${Pt(lever3[0])}L${Pt(lever3[1])}`} stroke={CREAM} strokeWidth={sw * 0.8} strokeOpacity={0.3} />
    </g>
  );
};

/** the light of the keyhole as a soft halo (drawn over the leaf) */
export const KeyGlow: React.FC<{ A: AirWorld; th: number; a: number; uid: string }> = ({ A, th, a, uid }) => {
  if (a < 0.01) return null;
  const c = leafP(A, th, KEY.u, KEY.v, -1);
  const r = 16 * A.P.r(DZ);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-kg`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.55 * a} />
          <stop offset="0.35" stopColor={CREAM} stopOpacity={0.16 * a} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r)} fill={`url(#${uid}-kg)`} />
    </g>
  );
};

/** the bolt's end (iron, square, at the keyhole's height) coming out of the leaf's free edge by `e` (0..1): only the
 *  part crossing the sliver between the leaf's edge and the jamb is drawn (the rest is inside the door or the jamb) */
export const Bolt: React.FC<{ A: AirWorld; th: number; e: number; lit?: number }> = ({ A, th, e, lit = 1 }) => {
  if (e <= 0.001) return null;
  const P = A.P;
  const ex = leaf3(th, DW, BOLT_V, DT / 2);
  const x0 = ex[0];
  const x1 = Math.min(OPEN.x1, ex[0] + 14 * e);
  if (x1 <= x0) return null;
  const y0 = ex[1] - 5;
  const y1 = ex[1] + 5;
  const z = ex[2];
  const q = [P.p(x0, y0, z), P.p(x1, y0, z), P.p(x1, y1, z), P.p(x0, y1, z)];
  return (
    <g>
      {/* once the sliver's light is gone it is a dark thing in a dark gap */}
      <path d={polyD(q)} fill={mixHex(A.tone(PLASTER.dark, z, 200), A.tone(IRON.dark, z, 200), lit)} />
      <path d={`M${Pt(q[0])}L${Pt(q[1])}`} stroke={A.tone(IRON.lit, z, 200)} strokeWidth={A.lw(1.2)} strokeOpacity={lit} />
    </g>
  );
};

/** the latch-side sliver's light as a soft line (while the door stands just short of shut), over the leaf's edge */
export const SliverGlow: React.FC<{ A: AirWorld; th: number; a: number; uid: string }> = ({ A, th, a, uid }) => {
  if (a < 0.01) return null;
  const P = A.P;
  const e0 = leafP(A, th, DW, 0);
  const e1 = leafP(A, th, DW, DH);
  const j0 = P.p(OPEN.x1, FL, DZ);
  const x = (e0[0] + j0[0]) / 2;
  const w = A.lw(1.6);
  return (
    <g>
      <defs>
        <filter id={`${uid}-sv`} x="-200%" y="-5%" width="500%" height="110%">
          <feGaussianBlur stdDeviation={f2(5 / A.k)} />
        </filter>
      </defs>
      <path d={`M${f2(x)},${f2(e0[1])}L${f2(x)},${f2(e1[1])}`} stroke={CREAM} strokeWidth={f2(w * 5)} strokeOpacity={0.45 * a} filter={`url(#${uid}-sv)`} />
      <path d={`M${f2(x)},${f2(e0[1])}L${f2(x)},${f2(e1[1])}`} stroke="#FBF6EC" strokeWidth={f2(w * 1.4)} strokeOpacity={0.9 * a} />
    </g>
  );
};

/** the hinge-side seam and the top seam as thin lines of light (the hall's light leaking round the shut door) */
export const SeamLights: React.FC<{ A: AirWorld; th: number; a: number; uid: string }> = ({ A, th, a, uid }) => {
  if (a < 0.01) return null;
  const P = A.P;
  const b = leafP(A, th, 0, 2);
  const tp = leafP(A, th, 0, DH - 1);
  const x = (b[0] + P.p(OPEN.x0, FL, DZ)[0]) / 2;
  const w = A.lw(1.6);
  return (
    <g>
      <defs>
        <filter id={`${uid}-sb`} x="-50%" y="-5%" width="200%" height="110%">
          <feGaussianBlur stdDeviation={f2(3 / A.k)} />
        </filter>
      </defs>
      <path d={`M${f2(x)},${f2(b[1])}L${f2(x)},${f2(tp[1])}`} stroke={CREAM} strokeWidth={f2(w * 3)} strokeOpacity={0.35 * a} filter={`url(#${uid}-sb)`} />
      <path d={`M${f2(x)},${f2(b[1])}L${f2(x)},${f2(tp[1])}`} stroke={CREAM} strokeWidth={f2(w)} strokeOpacity={0.8 * a} />
    </g>
  );
};

// ===================================================================================================================
// THE HOUSE FRONT
// ===================================================================================================================
export const HouseFront: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const P = A.P;
  const t = (hex: string, Z = 0) => A.tone(hex, Z, 200);
  const lp = P3(A, [LAMP[0], LAMP[1], 0]);
  // the wall face with the door opening and the window's opening cut out (evenodd)
  const big = `M-1600,${FL - 1400}L1600,${FL - 1400}L1600,0L-1600,0Z`;
  const cut = (x0: number, x1: number, y0: number, y1: number) => `M${x0},${y1}L${x1},${y1}L${x1},${y0}L${x0},${y0}Z`;
  const wallD = big + cut(OPEN.x0 - CAS, OPEN.x1 + CAS, OPEN.top - CAS, FL) + cut(WIN.x0 - WIN.cas, WIN.x1 + WIN.cas, WIN.top - WIN.cas, WIN.bot + WIN.cas);
  const sw = A.lw(0.9);
  // the window: the hall's light through a tall narrow window with three glazing bars; a sheer curtain's soft folds
  const wq = (x0: number, x1: number, y0: number, y1: number, Z: number) => polyD([P.p(x0, y1, Z), P.p(x1, y1, Z), P.p(x1, y0, Z), P.p(x0, y0, Z)]);
  const bars = [0.25, 0.5, 0.75].map((s) => lerp(WIN.top, WIN.bot, s));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-wl`} gradientUnits="userSpaceOnUse" cx={f2(lp[0] + 20)} cy={f2(lp[1] + 40)} r={f2(640)}>
          <stop offset="0" stopColor={t(PLASTER.lit)} />
          <stop offset="0.22" stopColor={t(mixHex(PLASTER.lit, PLASTER.mid, 0.6))} />
          <stop offset="0.55" stopColor={t(mixHex(PLASTER.mid, PLASTER.dark, 0.55))} />
          <stop offset="1" stopColor={t(PLASTER.dark)} />
        </radialGradient>
        <linearGradient id={`${uid}-wg`} gradientUnits="userSpaceOnUse" x1={WIN.x0} y1="0" x2={WIN.x1} y2="0">
          <stop offset="0" stopColor="#EADFC9" />
          <stop offset="0.3" stopColor={CREAM} />
          <stop offset="0.55" stopColor="#FBF6EC" />
          <stop offset="0.8" stopColor={CREAM} />
          <stop offset="1" stopColor="#E4D7BF" />
        </linearGradient>
        <radialGradient id={`${uid}-wh`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.22} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}-pl`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={f2(0.035 * 1)} numOctaves={3} seed={7} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.13  0 0 0 0 0.1  0 0 0 0 0.07  0 0 0 0.9 -0.38" result="m" />
          <feComposite in="m" in2="SourceGraphic" operator="in" result="mm" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="mm" />
          </feMerge>
        </filter>
      </defs>
      {/* the window's inside: glass glowing, the sheer's folds, the glazing bars, the reveal */}
      <path d={wq(WIN.x0, WIN.x1, WIN.top, WIN.bot, WIN.z)} fill={`url(#${uid}-wg)`} />
      {[0.2, 0.45, 0.72].map((s, i) => {
        const x = lerp(WIN.x0, WIN.x1, s);
        return <path key={i} d={`M${Pt(P.p(x, WIN.top, WIN.z))}L${Pt(P.p(x + 1.5, WIN.bot, WIN.z))}`} stroke="#D9C9AA" strokeWidth={f2(2.4 * P.r(WIN.z))} strokeOpacity={0.45} />;
      })}
      {bars.map((y, i) => (
        <path key={i} d={wq(WIN.x0, WIN.x1, y - 1.6, y + 1.6, WIN.z - 1)} fill={t(TRIM.mid, WIN.z)} />
      ))}
      <path d={wq(lerp(WIN.x0, WIN.x1, 0.5) - 1.4, lerp(WIN.x0, WIN.x1, 0.5) + 1.4, WIN.top, WIN.bot, WIN.z - 1)} fill={t(TRIM.mid, WIN.z)} />
      {/* the window's reveal (left side face, top face) */}
      <path d={polyD([P.p(WIN.x0, WIN.top, 0), P.p(WIN.x0, WIN.top, WIN.z), P.p(WIN.x0, WIN.bot, WIN.z), P.p(WIN.x0, WIN.bot, 0)])} fill={t(mixHex(TRIM.mid, CREAM, 0.25))} />
      <path d={polyD([P.p(WIN.x0, WIN.top, 0), P.p(WIN.x1, WIN.top, 0), P.p(WIN.x1, WIN.top, WIN.z), P.p(WIN.x0, WIN.top, WIN.z)])} fill={t(TRIM.dark)} />
      {/* the wall */}
      <g filter={`url(#${uid}-pl)`}>
        <path d={wallD} fill={`url(#${uid}-wl)`} fillRule="evenodd" />
      </g>
      {/* the window's light on the wall round it */}
      <ellipse cx={(WIN.x0 + WIN.x1) / 2} cy={(WIN.top + WIN.bot) / 2} rx={110} ry={230} fill={`url(#${uid}-wh)`} />
      {/* a stone plinth course along the wall's foot */}
      {/* a stone plinth course along the wall's foot, stopping at the door's casing */}
      <AirBox A={A} X0={-1600} X1={OPEN.x0 - CAS} Y0={-22} Y1={0} Z0={-3} Z1={0} mat={STONE} uid={`${uid}-pn`} rim={0.4} lw={sw} />
      <AirBox A={A} X0={OPEN.x1 + CAS} X1={1600} Y0={-22} Y1={0} Z0={-3} Z1={0} mat={STONE} uid={`${uid}-pn2`} rim={0.4} lw={sw} />
      {/* the window's casing */}
      <AirBox A={A} X0={WIN.x0 - WIN.cas} X1={WIN.x0} Y0={WIN.top - WIN.cas} Y1={WIN.bot + WIN.cas} Z0={-3} Z1={0} mat={TRIM} uid={`${uid}-wc1`} lw={sw} />
      <AirBox A={A} X0={WIN.x1} X1={WIN.x1 + WIN.cas} Y0={WIN.top - WIN.cas} Y1={WIN.bot + WIN.cas} Z0={-3} Z1={0} mat={TRIM} uid={`${uid}-wc2`} lw={sw} />
      <AirBox A={A} X0={WIN.x0} X1={WIN.x1} Y0={WIN.top - WIN.cas} Y1={WIN.top} Z0={-3} Z1={0} mat={TRIM} uid={`${uid}-wc3`} lw={sw} />
      <AirBox A={A} X0={WIN.x0 - WIN.cas - 4} X1={WIN.x1 + WIN.cas + 4} Y0={WIN.bot} Y1={WIN.bot + WIN.cas + 2} Z0={-9} Z1={0} mat={TRIM} uid={`${uid}-wc4`} lw={sw} />
      {/* the door's casing (proud of the wall) */}
      <AirBox A={A} X0={OPEN.x0 - CAS} X1={OPEN.x0} Y0={OPEN.top - CAS} Y1={FL} Z0={-CAS_P} Z1={0} mat={TRIM} uid={`${uid}-dc1`} lw={sw} />
      <AirBox A={A} X0={OPEN.x1} X1={OPEN.x1 + CAS} Y0={OPEN.top - CAS} Y1={FL} Z0={-CAS_P} Z1={0} mat={TRIM} uid={`${uid}-dc2`} lw={sw} />
      <AirBox A={A} X0={OPEN.x0} X1={OPEN.x1} Y0={OPEN.top - CAS} Y1={OPEN.top} Z0={-CAS_P} Z1={0} mat={TRIM} uid={`${uid}-dc3`} lw={sw} />
    </g>
  );
};

/** the ground: the porch's stone flags (joints running to the vanishing point) and the timber sill (its outside part);
 *  the nearest flags sink into the dense low air (lowAir: the screen row below which, and how much) */
export const Steps: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const sw = A.lw(0.9);
  return (
    <g>
      <AirFloor A={A} x0={PORCH.x0} x1={PORCH.x1} z0={PORCH.z0} z1={PORCH.z1} mat={GROUND} course={78} plank={58} melt={0} jointAmt={0.85} />
      <AirBox A={A} X0={SILL.x0} X1={SILL.x1} Y0={FL} Y1={0} Z0={SILL.z0} Z1={0} mat={TRIM} uid={`${uid}-sl`} lw={sw} />
    </g>
  );
};
/** the dense low air over the nearest flags: from screen row y0 it thickens into the air's own colour (the stage's
 *  backdrop at the frame's foot), opaque by yEnd, where the floor stops just in front of the lens */
export const LowAir: React.FC<{ A: AirWorld; uid: string; y0: number; yEnd: number; color: string; a: number }> = ({ A, uid, y0, yEnd, color, a }) => {
  const cam = A.cam;
  const top = Math.min(y0, yEnd - 120);
  const wy0 = cam.cy + (top - 960) / cam.k;
  const wyE = cam.cy + (Math.min(1920, yEnd) - 960) / cam.k;
  const wy1 = cam.cy + 980 / cam.k;
  const span = Math.max(1, wyE - wy0);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-la`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(wy0)} x2="0" y2={f2(wyE)}>
          <stop offset="0" stopColor={color} stopOpacity={0} />
          <stop offset="0.5" stopColor={color} stopOpacity={0.3 * a} />
          <stop offset="0.85" stopColor={color} stopOpacity={0.75} />
          <stop offset="1" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect x={f2(cam.cx - 600 / cam.k)} y={f2(wy0)} width={f2(1200 / cam.k)} height={f2(span)} fill={`url(#${uid}-la)`} />
      {yEnd < 1920 ? <rect x={f2(cam.cx - 600 / cam.k)} y={f2(wyE - 0.5 / cam.k)} width={f2(1200 / cam.k)} height={f2(wy1 - wyE + 1)} fill={color} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE LIGHT FROM INSIDE
// ===================================================================================================================
/** project a 3D point from the hall light onto the horizontal plane Y = y (or the vertical plane Z = z) */
const fromLight = (q: V3, plane: { y?: number; z?: number }): V3 | null => {
  const S = IN_LIGHT;
  const d: V3 = [q[0] - S[0], q[1] - S[1], q[2] - S[2]];
  let tt: number;
  if (plane.y !== undefined) {
    if (d[1] <= 1e-6) return null;
    tt = (plane.y - S[1]) / d[1];
  } else {
    tt = ((plane.z as number) - S[2]) / d[2];
  }
  if (tt <= 0) return null;
  return [S[0] + d[0] * tt, S[1] + d[1] * tt, S[2] + d[2] * tt];
};
/** the band of light through the crack (between the leaf's free edge and the latch jamb) on the threshold, the step's
 *  top, the step's face and the path; `a` its strength (the crack's openness) */
export const CrackSpill: React.FC<{ A: AirWorld; th: number; a: number; uid: string }> = ({ A, th, a, uid }) => {
  if (a < 0.01) return null;
  const P = A.P;
  const fe = leaf3(th, DW, 0, 0);
  // the crack's two vertical edges, sampled low and high (the high end lands far out on the ground)
  const yHi = FL - 250;
  const edges: [V3, V3][] = [
    [
      [fe[0], FL, fe[2]],
      [fe[0], yHi, fe[2]],
    ],
    [
      [OPEN.x1, FL, 0],
      [OPEN.x1, yHi, 0],
    ],
  ];
  // the surfaces: [plane, clip rect in the plane]
  type Surf = { y?: number; z?: number; x0: number; x1: number; a0: number; a1: number };
  const surfs: Surf[] = [
    { y: FL, x0: SILL.x0, x1: SILL.x1, a0: SILL.z0, a1: 0 },
    { z: SILL.z0, x0: SILL.x0, x1: SILL.x1, a0: FL, a1: 0 },
    { y: 0, x0: PORCH.x0, x1: PORCH.x1, a0: PORCH.z0, a1: SILL.z0 },
  ];
  const near = P3(A, [OPEN.x1, FL, 0]);
  const far = P3(A, [OPEN.x1 + 30, 0, -700]);
  const out: React.ReactNode[] = [];
  surfs.forEach((s, i) => {
    const pts: P2[] = [];
    const corners: V3[] = [];
    for (const [lo, hi] of [edges[0], edges[1]]) {
      const a1 = fromLight(lo, s);
      const a2 = fromLight(hi, s);
      if (!a1 || !a2) return;
      corners.push(a1, a2);
    }
    // quad: edge0 lo -> edge0 hi -> edge1 hi -> edge1 lo
    [corners[0], corners[1], corners[3], corners[2]].forEach((q) => pts.push(P3(A, q)));
    const clip = s.y !== undefined ? [P.p(s.x0, s.y, s.a0), P.p(s.x1, s.y, s.a0), P.p(s.x1, s.y, s.a1), P.p(s.x0, s.y, s.a1)] : [P.p(s.x0, s.a0, s.z as number), P.p(s.x1, s.a0, s.z as number), P.p(s.x1, s.a1, s.z as number), P.p(s.x0, s.a1, s.z as number)];
    out.push(
      <g key={i}>
        <clipPath id={`${uid}-cc${i}`}>
          <path d={polyD(clip)} />
        </clipPath>
        <path d={polyD(pts)} fill={`url(#${uid}-cg)`} clipPath={`url(#${uid}-cc${i})`} filter={`url(#${uid}-cb)`} />
      </g>,
    );
  });
  return (
    <g opacity={a} style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}-cg`} gradientUnits="userSpaceOnUse" x1={f2(near[0])} y1={f2(near[1])} x2={f2(far[0])} y2={f2(far[1])}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.62} />
          <stop offset="0.3" stopColor={CREAM} stopOpacity={0.3} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </linearGradient>
        <filter id={`${uid}-cb`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={f2(1.6 / Math.pow(A.k, 0.5))} />
        </filter>
      </defs>
      {out}
    </g>
  );
};

/** the slit under the shut door: its light on the threshold and the step's top, and a low veil in the air */
export const SlitSpill: React.FC<{ A: AirWorld; a: number; uid: string }> = ({ A, a, uid }) => {
  if (a < 0.01) return null;
  const P = A.P;
  const sl = [P.p(HX + 2, FL, SILL.z0), P.p(HX + DW - 2, FL, SILL.z0), P.p(HX + DW - 2, FL, DZ), P.p(HX + 2, FL, DZ)];
  const st = [P.p(HX - 20, 0, -70), P.p(HX + DW + 20, 0, -70), P.p(HX + DW, 0, SILL.z0), P.p(HX, 0, SILL.z0)];
  const y0 = P.p(0, FL, DZ)[1];
  const y1 = P.p(0, 0, -70)[1];
  const c = P.p(0, FL - 3, 0);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}-sg`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y1)}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.7 * a} />
          <stop offset="0.3" stopColor={CREAM} stopOpacity={0.32 * a} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${uid}-sv`} gradientUnits="userSpaceOnUse" cx={f2(c[0])} cy={f2(c[1])} r={f2(DW * 0.62)} gradientTransform={`translate(${f2(c[0])} ${f2(c[1])}) scale(1 0.16) translate(${f2(-c[0])} ${f2(-c[1])})`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.34 * a} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}-sbl`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={f2(2 / Math.pow(A.k, 0.5))} />
        </filter>
      </defs>
      <g filter={`url(#${uid}-sbl)`}>
        <path d={polyD(sl)} fill={`url(#${uid}-sg)`} />
        <path d={polyD(st)} fill={`url(#${uid}-sg)`} />
      </g>
      <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(DW * 0.62)} ry={f2(DW * 0.1)} fill={`url(#${uid}-sv)`} />
    </g>
  );
};

/** the slit itself: the lit floor inside seen under the door (drawn inside the opening's clip, over the interior) */
export const SlitGlow: React.FC<{ A: AirWorld; th: number; a: number }> = ({ A, th, a }) => {
  if (a < 0.01) return null;
  const P = A.P;
  const b0 = leafP(A, th, 0, 0);
  const b1 = leafP(A, th, DW, 0);
  const s0 = P.p(OPEN.x0, FL, DZ);
  const s1 = P.p(OPEN.x1, FL, DZ);
  // a veil of the hall's light in the slot (the floorboards running in show through it)
  return <path d={polyD([s0, s1, [s1[0], b1[1]], [s0[0], b0[1]]])} fill="#FBF6EC" opacity={0.28 * a} />;
};

// ===================================================================================================================
// THE LANTERN
// ===================================================================================================================
export const Lantern: React.FC<{ A: AirWorld; uid: string; frame: number }> = ({ A, uid, frame }) => {
  const P = A.P;
  const [lx, ly, lz] = LAMP;
  const t = (hex: string) => A.tone(hex, lz, 300);
  const sw = A.lw(0.9);
  const hw = 12;
  const gy0 = ly - 22;
  const gy1 = ly + 20;
  const z0 = lz - hw;
  const z1 = lz + hw;
  const flick = 0.94 + 0.06 * Math.sin(frame * 0.23) * Math.sin(frame * 0.071 + 1);
  // the glass: front and right faces glowing cream
  const front = [P.p(lx - hw, gy0, z0), P.p(lx + hw, gy0, z0), P.p(lx + hw, gy1, z0), P.p(lx - hw, gy1, z0)];
  const right = [P.p(lx + hw, gy0, z0), P.p(lx + hw, gy0, z1), P.p(lx + hw, gy1, z1), P.p(lx + hw, gy1, z0)];
  const under = [P.p(lx - hw - 3, gy1 + 5, z0 - 3), P.p(lx + hw + 3, gy1 + 5, z0 - 3), P.p(lx + hw + 3, gy1 + 5, z1 + 3), P.p(lx - hw - 3, gy1 + 5, z1 + 3)];
  // the cap: a low pyramid over the glass, a finial, the bracket arm curling back to the wall
  const capB = (x: number, z: number) => P.p(x, gy0, z);
  const apex = P.p(lx, gy0 - 16, lz);
  const ctr = P.p(lx, ly, lz);
  const arm = `M${Pt(P.p(lx, gy0 - 16, lz))}C${Pt(P.p(lx, gy0 - 30, lz))} ${Pt(P.p(lx, gy0 - 34, lz + 10))} ${Pt(P.p(lx, gy0 - 34, 0))}`;
  const wallPlate = [P.p(lx - 6, gy0 - 46, 0), P.p(lx + 6, gy0 - 46, 0), P.p(lx + 6, gy0 - 20, 0), P.p(lx - 6, gy0 - 20, 0)];
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-lg`} gradientUnits="userSpaceOnUse" cx={f2(ctr[0])} cy={f2(ctr[1])} r={f2(70 * P.r(lz))}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.75 * flick} />
          <stop offset="0.3" stopColor={CREAM} stopOpacity={0.24 * flick} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={polyD(wallPlate)} fill={t(IRON.mid)} stroke={t(lineOf(IRON))} strokeWidth={sw} />
      <path d={arm} fill="none" stroke={t(IRON.dark)} strokeWidth={f2(3.4 * P.r(lz))} strokeLinecap="round" />
      <path d={polyD(right)} fill={mixHex(CREAM, "#E2D3B6", 0.5)} stroke={t(IRON.dark)} strokeWidth={sw * 1.4} />
      <path d={polyD(front)} fill="#FBF6EC" stroke={t(IRON.dark)} strokeWidth={sw * 1.6} />
      {/* the glass's frame bars */}
      <path d={`M${Pt(P.p(lx, gy0, z0))}L${Pt(P.p(lx, gy1, z0))}`} stroke={t(IRON.dark)} strokeWidth={sw * 1.2} />
      <path d={polyD(under)} fill={t(IRON.mid)} stroke={t(lineOf(IRON))} strokeWidth={sw} />
      <path d={polyD([capB(lx - hw - 4, z0 - 4), capB(lx + hw + 4, z0 - 4), apex])} fill={t(IRON.lit)} stroke={t(lineOf(IRON))} strokeWidth={sw} strokeLinejoin="round" />
      <path d={polyD([capB(lx + hw + 4, z0 - 4), capB(lx + hw + 4, z1 + 4), apex])} fill={t(IRON.dark)} stroke={t(lineOf(IRON))} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx={f2(apex[0])} cy={f2(apex[1] - 2 * P.r(lz))} r={f2(2.6 * P.r(lz))} fill={t(IRON.mid)} />
      <circle cx={f2(ctr[0])} cy={f2(ctr[1])} r={f2(70 * P.r(lz))} fill={`url(#${uid}-lg)`} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

/** the lantern's pool of light on the set: a soft cream veil centred on it (screen blend), over the wall, door,
 *  step and path */
export const LampPool: React.FC<{ A: AirWorld; uid: string; a?: number }> = ({ A, uid, a = 1 }) => {
  const c = P3(A, [LAMP[0] + 40, LAMP[1] + 90, 0]);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`${uid}-lp`} gradientUnits="userSpaceOnUse" cx={f2(c[0])} cy={f2(c[1])} r={f2(380)}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.2 * a} />
          <stop offset="0.4" stopColor={CREAM} stopOpacity={0.08 * a} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={f2(c[0])} cy={f2(c[1])} r={380} fill={`url(#${uid}-lp)`} />
    </g>
  );
};

export { c01, smoothstep };
