// ---------------------------------------------------------------------------
// farOutCity — Austin, late 1970s, for FarOutOfAustin (cut 6, take 2), in the clip's air-lit volumes (light from the
// upper left, cream rims on the lit edges, thin outlines in a darker local colour, fogged as one far place):
//   <Capitol>   the Texas Capitol facing the camera (-Z): the long wings with four rows of windows, end pavilions and a
//               projecting central portico with columns and a pediment, the drum (a plain base, a ring of columns, an
//               entablature, an attic with small windows), the tall dome with its ribs, the lantern and the statue
//               (the Goddess of Liberty with her star). Pink granite muted toward oatmeal.
//   <Tower>     a downtown tower: punched-window grid, ribbon windows, vertical piers or a dark glass curtain wall;
//               setback tiers; a flat parapet with a rooftop penthouse, or an antenna mast.
//   <LowBlock>  a 2-5 storey commercial block: cornice, a dark storefront band, upper windows, maybe an awning.
//   <AustinCity> the whole skyline from one origin (the Capitol's front centre), every piece sorted far to near, fogged
//               by `fog` (the clip's air) toward `haze`; a few small cars on its streets.
// Units: kit space (X, H up +, Z), U = 178 per metre. Real sizes (Capitol ~94 m to the statue's star; towers 45-120 m);
// the city is a picture-book compact downtown.
// ---------------------------------------------------------------------------
import React from "react";
import { mixHex, type AirWorld, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CAR_MAT, Sedan } from "./farOutCar";
import { PAL, add, c01, face3, hash, line3, n2, poly3, polyD, proj, Pt, sstep, type P2, type Toner, type V3 } from "./farOutFaces";
/** fine facade detail fades in with its size on screen (never a hard switch, never a sub-pixel grid that shimmers):
 *  the elements pushed since `i0` go into one group at opacity `op` */
/** a facade pattern of period `per` px that moves `mv` px a frame (the skyline shrinking) strobes once it moves more
 *  than ~a third of its period: it fades out over that range (a still or slowly shrinking city keeps its detail) */
const strobeFade = (mv: number, per: number) => 1 - sstep(0.3, 0.55, mv / Math.max(0.5, per));
const fadeTail = (els: React.ReactNode[], i0: number, op: number, key: string) => {
  if (op >= 0.999 || els.length <= i0) return;
  const part = els.splice(i0);
  els.push(
    <g key={key} opacity={n2(op)}>
      {part}
    </g>,
  );
};

export const U = 178;
export const CITY_MAT = {
  granite: { lit: "#DCC6B2", mid: "#B89F8B", dark: "#715E53" },
  concrete: { lit: "#D3C8B2", mid: "#AFA48E", dark: "#6F6756" },
  glass: { lit: "#8E9B9D", mid: "#68767B", dark: "#3C474A" },
  brick: { lit: "#AA8670", mid: "#866552", dark: "#4E3A2F" },
  stone: { lit: "#DDD5C4", mid: "#BAB09D", dark: "#777064" },
  sage: { lit: "#A3AB9A", mid: "#7F8879", dark: "#4E554B" },
  stucco: { lit: "#D6C7A9", mid: "#B4A487", dark: "#72674F" },
  roof: { lit: "#9C9A92", mid: "#7A7972", dark: "#4A4945" },
} satisfies Record<string, Mat>;
const WIN = "#3F4446";
const WIN_LIGHT = "#59625F";

/** a toner for the far city: the clip's air by distance (A.tone) plus an extra mix toward the haze */
export const cityToner = (A: AirWorld, extra: number, haze: string): Toner => (hex, Z, h) => mixHex(A.tone(hex, Z, h), haze, c01(extra));

// ===================================================================================================================
// HELPERS
// ===================================================================================================================
/** the visible faces of an axis-aligned box (H0 < H1), each an air-lit face (top only when seen from above) */
const boxFaces = (A: AirWorld, X0: number, X1: number, H0: number, H1: number, Z0: number, Z1: number, mat: Mat, key: string, tn: Toner, lw: number) => {
  const ins: V3 = [(X0 + X1) / 2, (H0 + H1) / 2, (Z0 + Z1) / 2];
  const F: [string, V3[]][] = [
    ["l", [[X0, H0, Z1], [X0, H0, Z0], [X0, H1, Z0], [X0, H1, Z1]]],
    ["r", [[X1, H0, Z0], [X1, H0, Z1], [X1, H1, Z1], [X1, H1, Z0]]],
    ["t", [[X0, H1, Z0], [X1, H1, Z0], [X1, H1, Z1], [X0, H1, Z1]]],
    ["f", [[X0, H0, Z0], [X1, H0, Z0], [X1, H1, Z0], [X0, H1, Z0]]],
  ];
  return F.map(([k, q]) => face3(A, q, ins, mat, `${key}${k}`, { tone: tn, lw, foot: k === "f" || k === "l" || k === "r" ? 0.16 : undefined, uid: key }));
};
/** the cream rim along a box's lit edges: the front's top edge and its left vertical edge */
const boxRim = (A: AirWorld, X0: number, X1: number, H0: number, H1: number, Z0: number, key: string, op: number, lw: number) => (
  <path key={key} d={line3(A, [[X0, H0, Z0], [X0, H1, Z0], [X1, H1, Z0]])} fill="none" stroke={PAL.cream} strokeWidth={lw * 1.2} strokeOpacity={op} strokeLinecap="round" strokeLinejoin="round" />
);
/** a pattern of quads on a planar face spanned by origin o, width vector eu and height vector ev (each quad given in
 *  face fractions u0 u1 v0 v1) as one path */
const quadsOn = (A: AirWorld, o: V3, eu: V3, ev: V3, quads: [number, number, number, number][]) => {
  let d = "";
  for (const [u0, u1, v0, v1] of quads) {
    const p = (u: number, v: number): P2 => proj(A, [o[0] + eu[0] * u + ev[0] * v, o[1] + eu[1] * u + ev[1] * v, o[2] + eu[2] * u + ev[2] * v]);
    d += polyD([p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)]);
  }
  return d;
};
/** screen px of one world unit at depth Z */
const pxAt = (A: AirWorld, Z: number) => A.P.r(Z) * A.k;

// ===================================================================================================================
// TOWERS AND LOW BLOCKS
// ===================================================================================================================
export type TowerSpec = {
  X: number;
  Z: number;
  w: number;
  d: number;
  h: number;
  style: "grid" | "ribbon" | "piers" | "glass";
  mat: keyof typeof CITY_MAT;
  /** setback tiers: [height fraction where the tier starts, inset per side] */
  tiers?: [number, number][];
  crown?: "penthouse" | "antenna" | "flat";
  floor?: number;
  seed?: number;
};
/** a tower's window pattern on one face (width W, height Hh in units) as quads in face fractions */
const towerPattern = (style: TowerSpec["style"], W: number, Hh: number, floor: number, h0: number, seed: number): [number, number, number, number][] => {
  const q: [number, number, number, number][] = [];
  const nf = Math.floor((Hh - 120) / floor);
  if (style === "ribbon") {
    for (let j = 0; j < nf; j++) {
      const v0 = (h0 + j * floor + floor * 0.38) / Hh;
      q.push([0.03, 0.97, v0, v0 + (floor * 0.42) / Hh]);
    }
  } else if (style === "grid") {
    const col = 520;
    const nc = Math.max(2, Math.floor(W / col));
    for (let j = 0; j < nf; j++) {
      const v0 = (h0 + j * floor + floor * 0.3) / Hh;
      for (let i = 0; i < nc; i++) {
        const u0 = (i + 0.3) / nc;
        if (hash(seed * 7 + i * 3.1 + j * 1.7) < 0.04) continue;
        q.push([u0, u0 + 0.4 / nc, v0, v0 + (floor * 0.48) / Hh]);
      }
    }
  } else if (style === "piers") {
    // recessed dark bays between pale vertical piers (each bay's windows a column of dark slots)
    const bay = 640;
    const nb = Math.max(2, Math.floor(W / bay));
    for (let i = 0; i < nb; i++) {
      const u0 = (i + 0.24) / nb;
      q.push([u0, u0 + 0.52 / nb, (h0 + 300) / Hh, (Hh - 260) / Hh]);
    }
  } else {
    // glass curtain: the whole face is glass (drawn by the caller), here the pale mullions as thin quads
    const col = 420;
    const nc = Math.max(3, Math.floor(W / col));
    for (let i = 1; i < nc; i++) {
      const u = i / nc;
      q.push([u - 0.006, u + 0.006, (h0 + 40) / Hh, 1 - 60 / Hh]);
    }
    for (let j = 1; j < nf; j++) {
      const v = (h0 + j * floor) / Hh;
      q.push([0.01, 0.99, v - 10 / Hh, v + 10 / Hh]);
    }
  }
  return q;
};
export const Tower: React.FC<{ A: AirWorld; s: TowerSpec; o: V3; tone: Toner; uid: string; rel?: number }> = ({ A, s, o, tone: tn, uid, rel = 0 }) => {
  const X = o[0] + s.X;
  const Z = o[2] + s.Z;
  const H = o[1];
  const mat = CITY_MAT[s.mat];
  const els: React.ReactNode[] = [];
  const floor = s.floor ?? 640;
  const px = pxAt(A, Z);
  const lw = Math.min(A.lw(0.7), 0.7 / A.k);
  const rimOp = 0.5;
  // the tiers: [start fraction, inset] -> boxes stacked
  const tiers: [number, number][] = [[0, 0], ...(s.tiers ?? [])];
  tiers.forEach(([f0, inset], ti) => {
    const f1 = ti + 1 < tiers.length ? tiers[ti + 1][0] : 1;
    const x0 = X - s.w / 2 + inset;
    const x1 = X + s.w / 2 - inset;
    const z0 = Z + inset;
    const z1 = Z + s.d - inset;
    const h0 = H + s.h * f0;
    const h1 = H + s.h * f1;
    const key = `${uid}t${ti}`;
    els.push(...boxFaces(A, x0, x1, h0, h1, z0, z1, mat, key, tn, lw));
    // the facade pattern on the front and the visible side (when a floor is big enough on screen)
    // the pattern's periods across (bays, columns) and up (floors), and how far it moves a frame as the city shrinks
    const perX = (s.style === "piers" ? 640 : s.style === "glass" ? 420 : s.style === "grid" ? 520 : 1e9) * px;
    const perY = (s.style === "piers" ? 1e9 : floor) * px;
    const strobe = Math.min(strobeFade(rel * (Math.abs(s.X) + s.w) * px, perX), strobeFade(rel * s.h * px, perY));
    const towerWin = sstep(3.5, 9, floor * px) * strobe;
    const towerWinI = els.length;
    if (towerWin > 0.005) {
      const Hh = h1 - h0;
      const winC = tn(s.style === "glass" ? mixHex(mat.lit, "#E8E2D2", 0.3) : WIN, Z, (h0 + h1) / 2);
      const faceW = x1 - x0;
      const pat = towerPattern(s.style, faceW, Hh, floor, ti === 0 ? floor * 0.6 : 60, (s.seed ?? 1) + ti);
      // a glass face's mullions and floor lines are ~20 units: they go before they are thinner than a pixel
      const lineFade = s.style === "glass" ? sstep(0.7, 2, 20 * px) : 1;
      els.push(<path key={`${key}wf`} d={quadsOn(A, [x0, h0, z0 - 2], [faceW, 0, 0], [0, Hh, 0], pat)} fill={winC} opacity={(s.style === "glass" ? 0.55 : 0.85) * lineFade} />);
      const camX = A.cam.cx;
      const sideX = camX < x0 ? x0 : camX > x1 ? x1 : null;
      if (sideX !== null) {
        const sd = z1 - z0;
        const patS = towerPattern(s.style, sd, Hh, floor, ti === 0 ? floor * 0.6 : 60, (s.seed ?? 1) + ti + 50);
        const sgn = sideX === x0 ? -2 : 2;
        els.push(<path key={`${key}ws`} d={quadsOn(A, [sideX + sgn, h0, z0], [0, 0, sd], [0, Hh, 0], patS)} fill={winC} opacity={(s.style === "glass" ? 0.5 : 0.8) * (sideX === x0 ? 1 : 0.75) * lineFade} />);
      }
      // a sky glint on a glass tower's lit side
      if (s.style === "glass") {
        els.push(<path key={`${key}gl`} d={poly3(A, [[x0, h0 + Hh * 0.55, z0 - 3], [x0 + faceW * 0.35, h0 + Hh * 0.95, z0 - 3], [x0 + faceW * 0.55, h0 + Hh * 0.95, z0 - 3], [x0, h0 + Hh * 0.3, z0 - 3]])} fill={tn("#B8C6BF", Z, h1)} opacity={0.18} />);
      }
    }
    fadeTail(els, towerWinI, towerWin, `${key}wfd`);
    // the cornice / parapet band and the rim
    els.push(<path key={`${key}cn`} d={line3(A, [[x0, h1 - 60, z0 - 2], [x1, h1 - 60, z0 - 2]])} stroke={tn(mat.dark, Z, h1)} strokeWidth={Math.max(lw, 40 * A.P.r(Z))} opacity={0.35} />);
    els.push(boxRim(A, x0, x1, h0, h1, z0, `${key}rm`, rimOp * (1 - A.fog(Z)), lw));
  });
  // the crown
  const last = tiers[tiers.length - 1][1];
  const top = H + s.h;
  if (s.crown === "penthouse" || s.crown === "antenna") {
    const pw = (s.w - 2 * last) * 0.42;
    const pd = (s.d - 2 * last) * 0.45;
    els.push(...boxFaces(A, X - pw / 2, X + pw / 2, top, top + floor * 1.3, Z + s.d / 2 - pd / 2, Z + s.d / 2 + pd / 2, CITY_MAT.roof, `${uid}ph`, tn, lw));
  }
  if (s.crown === "antenna") {
    const a = proj(A, [X, top + floor * 1.3, Z + s.d / 2]);
    const b = proj(A, [X, top + floor * 1.3 + s.h * 0.22, Z + s.d / 2]);
    els.push(<path key={`${uid}an`} d={`M${Pt(a)}L${Pt(b)}`} stroke={tn(CITY_MAT.roof.dark, Z, top)} strokeWidth={Math.max(lw, 60 * A.P.r(Z))} strokeLinecap="round" />);
  }
  return <g>{els}</g>;
};

export type BlockSpec = { X: number; Z: number; w: number; d: number; floors: number; mat: keyof typeof CITY_MAT; awning?: boolean; seed?: number };
export const LowBlock: React.FC<{ A: AirWorld; s: BlockSpec; o: V3; tone: Toner; uid: string; rel?: number }> = ({ A, s, o, tone: tn, uid, rel = 0 }) => {
  const X0 = o[0] + s.X - s.w / 2;
  const X1 = X0 + s.w;
  const Z0 = o[2] + s.Z;
  const Z1 = Z0 + s.d;
  const H = o[1];
  const fh = 640;
  const H1 = H + 180 + s.floors * fh;
  const mat = CITY_MAT[s.mat];
  const lw = Math.min(A.lw(0.7), 0.7 / A.k);
  const els: React.ReactNode[] = [];
  els.push(...boxFaces(A, X0, X1, H, H1, Z0, Z1, mat, uid, tn, lw));
  const px = pxAt(A, Z0);
  const blockWin = sstep(3.5, 9, fh * px) * Math.min(strobeFade(rel * (Math.abs(s.X) + s.w) * px, 560 * px), strobeFade(rel * s.floors * fh * px, fh * px));
  const blockWinI = els.length;
  if (blockWin > 0.005) {
    // the storefront band (dark glass) and the upper windows
    const q: [number, number, number, number][] = [];
    const Hh = H1 - H;
    const nc = Math.max(2, Math.floor(s.w / 560));
    q.push([0.06, 0.94, 90 / Hh, (fh * 0.82) / Hh]);
    for (let j = 1; j < s.floors; j++) {
      for (let i = 0; i < nc; i++) {
        const u0 = (i + 0.28) / nc;
        q.push([u0, u0 + 0.44 / nc, (j * fh + fh * 0.3) / Hh, (j * fh + fh * 0.78) / Hh]);
      }
    }
    els.push(<path key={`${uid}w`} d={quadsOn(A, [X0, H, Z0 - 2], [s.w, 0, 0], [0, Hh, 0], q)} fill={tn(WIN, Z0, 300)} opacity={0.82} />);
    // a light in a couple of the storefronts
    els.push(<path key={`${uid}wl`} d={quadsOn(A, [X0, H, Z0 - 3], [s.w, 0, 0], [0, Hh, 0], [[0.12, 0.3, 120 / Hh, (fh * 0.7) / Hh]])} fill={tn(WIN_LIGHT, Z0, 300)} opacity={0.7} />);
  }
  fadeTail(els, blockWinI, blockWin, `${uid}wfd`);
  // the cornice: a slightly projecting band at the top
  const cz = Z0 - 50;
  els.push(...boxFaces(A, X0 - 50, X1 + 50, H1 - 110, H1 + 20, cz, Z1, mat, `${uid}c`, tn, lw));
  const awningFade = sstep(2, 5, fh * px);
  const awningFadeI = els.length;
  if (s.awning && awningFade > 0.005) {
    // a muted canvas awning over the storefront: a sloping quad and its front valance
    const aw = CITY_MAT.sage;
    els.push(face3(A, [[X0 + s.w * 0.08, H + fh * 0.98, Z0 - 2], [X1 - s.w * 0.08, H + fh * 0.98, Z0 - 2], [X1 - s.w * 0.08, H + fh * 0.72, Z0 - 260], [X0 + s.w * 0.08, H + fh * 0.72, Z0 - 260]], [(X0 + X1) / 2, H + 200, Z0 + 200], aw, `${uid}aw`, { tone: tn, lw }));
  }
  fadeTail(els, awningFadeI, awningFade, `${uid}awd`);
  els.push(boxRim(A, X0 - 50, X1 + 50, H1 - 110, H1 + 20, cz, `${uid}rm`, 0.5 * (1 - A.fog(Z0)), lw));
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE CAPITOL
// ===================================================================================================================
/** a vertical drum (cylinder) air-lit like the kit's AirCyl, with an optional ring of columns and dark slots */
const Drum: React.FC<{ A: AirWorld; X: number; Z: number; R: number; h0: number; h1: number; mat: Mat; tone: Toner; uid: string; cols?: number; slots?: number; slotH?: [number, number] }> = ({ A, X, Z, R, h0, h1, mat, tone: tn, uid, cols = 0, slots = 0, slotH }) => {
  const P = A.P;
  const ell = (h: number) => {
    const c = proj(A, [X, h, Z]);
    return { c, rx: R * P.r(Z), ry: Math.abs(proj(A, [X, h, Z - R])[1] - proj(A, [X, h, Z + R])[1]) / 2 };
  };
  const tp = ell(h1);
  // the silhouette: the front half of the bottom ring (left -> right), then the front half of the top ring back; exact
  // from above or below the eye (a ring above the eye bulges up on screen, one below it bulges down)
  const half = (h: number) =>
    Array.from({ length: 25 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 24) * Math.PI;
      return proj(A, [X + R * Math.sin(a), h, Z - R * Math.cos(a)]);
    });
  const body = polyD([...half(h0), ...half(h1).reverse()]);
  const bt = ell(h0);
  const below = (h: number) => h < -P.opts.eyeY;
  const hm = (h0 + h1) / 2;
  const t = (hex: string) => tn(hex, Z, hm);
  const gid = `${uid}-g`;
  const lw = Math.min(A.lw(0.7), 0.7 / A.k);
  const els: React.ReactNode[] = [];
  els.push(
    <defs key="d">
      <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={n2(tp.c[0] - tp.rx)} y1="0" x2={n2(tp.c[0] + tp.rx)} y2="0">
        <stop offset="0" stopColor={t(mat.mid)} />
        <stop offset="0.24" stopColor={t(mat.lit)} />
        <stop offset="0.55" stopColor={t(mixHex(mat.lit, mat.mid, 0.6))} />
        <stop offset="0.86" stopColor={t(mixHex(mat.dark, PAL.shadow, 0.1))} />
        <stop offset="1" stopColor={t(mixHex(mat.mid, mat.dark, 0.4))} />
      </linearGradient>
    </defs>,
  );
  els.push(<path key="b" d={body} fill={`url(#${gid})`} stroke={t(mat.dark)} strokeWidth={lw} strokeOpacity={0.6} />);
  if (cols > 0) {
    // a colonnade: dark recesses between columns across the front half (x = R sin(a))
    let d = "";
    for (let i = 0; i < cols; i++) {
      const a = -Math.PI / 2 + ((i + 0.5) / cols) * Math.PI;
      const a2 = a + (0.42 * Math.PI) / cols;
      const x0 = X + R * Math.sin(a);
      const x1 = X + R * Math.sin(a2);
      const zf = Z - R * Math.cos(a);
      d += polyD([proj(A, [x0, h0 + 60, zf]), proj(A, [x1, h0 + 60, zf]), proj(A, [x1, h1 - 60, zf]), proj(A, [x0, h1 - 60, zf])]);
    }
    els.push(<path key="c" d={d} fill={t(mixHex(mat.dark, PAL.shadow, 0.25))} opacity={0.8} />);
  }
  if (slots > 0 && slotH) {
    let d = "";
    for (let i = 0; i < slots; i++) {
      const a = -Math.PI / 2 + ((i + 0.5) / slots) * Math.PI;
      const xw = (0.18 * Math.PI * R) / slots;
      const x = X + R * Math.sin(a);
      const zf = Z - R * Math.cos(a);
      const sq = Math.cos(a);
      d += polyD([proj(A, [x - xw * sq, slotH[0], zf]), proj(A, [x + xw * sq, slotH[0], zf]), proj(A, [x + xw * sq, slotH[1], zf]), proj(A, [x - xw * sq, slotH[1], zf])]);
    }
    els.push(<path key="s" d={d} fill={t(WIN)} opacity={0.75} />);
  }
  if (below(h1)) els.push(<ellipse key="t" cx={tp.c[0]} cy={tp.c[1]} rx={tp.rx} ry={tp.ry} fill={t(mat.lit)} stroke={t(mat.dark)} strokeWidth={lw} strokeOpacity={0.5} />);
  els.push(<path key="r" d={`M${n2(tp.c[0] - tp.rx * 0.92)},${n2(tp.c[1])}L${n2(bt.c[0] - bt.rx * 0.92)},${n2(bt.c[1])}`} stroke={PAL.cream} strokeWidth={lw * 1.3} strokeOpacity={0.45 * (1 - A.fog(Z))} />);
  return <g>{els}</g>;
};

/** the Capitol's dimensions (units; origin = the main block's front centre at the ground) */
export const CAP = { half: 14500, depth: 8000, wallH: 4300, parapet: 300, pavHalf: 4300, pavOut: 750, pavH: 5000, pedH: 1350, endIn: 11300, endOut: 400, endH: 4750, domeZ: 4300, domeR: 2750, domeBase: 9400, domeTop: 13300, statueTop: 16700 };
export const Capitol: React.FC<{ A: AirWorld; o: V3; tone: Toner; uid: string; rel?: number }> = ({ A, o, tone: tn, uid, rel = 0 }) => {
  const C = CAP;
  const M = CITY_MAT.granite;
  const [X, H, Z] = o;
  const els: React.ReactNode[] = [];
  const lw = Math.min(A.lw(0.7), 0.7 / A.k);
  const px = pxAt(A, Z);
  const fogZ = A.fog(Z);
  // ---- the wings (one long block), its parapet, then the end pavilions and the central pavilion
  els.push(...boxFaces(A, X - C.half + 1200, X + C.half - 1200, H, H + C.wallH, Z, Z + C.depth, M, `${uid}w`, tn, lw));
  // windows on the wings: four floors, a rusticated base line
  const capStrobe = strobeFade(rel * C.half * px, 620 * px);
  const wingWin = sstep(2.5, 6, 300 * px) * capStrobe;
  const wingWinI = els.length;
  if (wingWin > 0.005) {
    const q: [number, number, number, number][] = [];
    const W = 2 * (C.half - 1200);
    const n = Math.floor(W / 620);
    const rows: [number, number][] = [
      [550, 1150],
      [1500, 2250],
      [2600, 3300],
      [3550, 3950],
    ];
    for (let i = 0; i < n; i++) {
      const u0 = (i + 0.3) / n;
      const xm = -W / 2 + ((i + 0.5) / n) * W;
      if (Math.abs(xm) < C.pavHalf + 200) continue;
      if (Math.abs(xm) > C.endIn - 1500) continue;
      for (const [a, b] of rows) q.push([u0, u0 + 0.38 / n, a / C.wallH, b / C.wallH]);
    }
    els.push(<path key="ww" d={quadsOn(A, [X - W / 2, H, Z - 3], [W, 0, 0], [0, C.wallH, 0], q)} fill={tn(WIN, Z, 2000)} opacity={0.75} />);
    els.push(<path key="wb" d={line3(A, [[X - W / 2, H + 1300, Z - 3], [X + W / 2, H + 1300, Z - 3]]) + line3(A, [[X - W / 2, H + C.wallH - 220, Z - 3], [X + W / 2, H + C.wallH - 220, Z - 3]])} stroke={tn(M.dark, Z, 2000)} strokeWidth={Math.max(lw, 60 * A.P.r(Z))} opacity={0.35} />);
  }
  fadeTail(els, wingWinI, wingWin, "wwfd");
  els.push(...boxFaces(A, X - C.half + 1200, X + C.half - 1200, H + C.wallH, H + C.wallH + C.parapet, Z + 80, Z + C.depth - 80, M, `${uid}pp`, tn, lw));
  // the end pavilions, each with a small pediment
  const pediment = (x0: number, x1: number, h0: number, ph: number, z: number, key: string) => {
    const tri: V3[] = [
      [x0, h0, z],
      [x1, h0, z],
      [(x0 + x1) / 2, h0 + ph, z],
    ];
    els.push(face3(A, tri, [(x0 + x1) / 2, h0, z + 500], M, key, { tone: tn, lw, noCull: true }));
    els.push(<path key={`${key}r`} d={line3(A, [tri[0], tri[2], tri[1]])} fill="none" stroke={PAL.cream} strokeWidth={lw * 1.2} strokeOpacity={0.5 * (1 - fogZ)} />);
    // the tympanum's inner shade
    const k = 0.7;
    const cx = (x0 + x1) / 2;
    els.push(<path key={`${key}t`} d={poly3(A, [[cx - ((x1 - x0) / 2) * k, h0 + 80, z - 2], [cx + ((x1 - x0) / 2) * k, h0 + 80, z - 2], [cx, h0 + 80 + ph * k * 0.85, z - 2]])} fill={tn(M.mid, z, h0 + ph / 2)} opacity={0.8} />);
  };
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? X - C.half : X + C.endIn;
    const x1 = s < 0 ? X - C.endIn : X + C.half;
    els.push(...boxFaces(A, x0, x1, H, H + C.endH, Z - C.endOut, Z + C.depth - 600, M, `${uid}e${s}`, tn, lw));
    const pavWin = sstep(2.5, 6, 300 * px) * capStrobe;
    const pavWinI = els.length;
    if (pavWin > 0.005) {
      const q: [number, number, number, number][] = [];
      const W = x1 - x0;
      for (let i = 0; i < 4; i++) {
        const u0 = (i + 0.3) / 4;
        for (const [a, b] of [
          [600, 1200],
          [1600, 2350],
          [2700, 3400],
        ] as [number, number][])
          q.push([u0, u0 + 0.36 / 4, a / C.endH, b / C.endH]);
      }
      els.push(<path key={`ew${s}`} d={quadsOn(A, [x0, H, Z - C.endOut - 3], [W, 0, 0], [0, C.endH, 0], q)} fill={tn(WIN, Z, 2000)} opacity={0.75} />);
    }
    fadeTail(els, pavWinI, pavWin, `epfd${s}`);
    pediment(x0 - 100, x1 + 100, H + C.endH, 800, Z - C.endOut - 4, `${uid}ep${s}`);
    els.push(boxRim(A, x0, x1, H, H + C.endH, Z - C.endOut, `${uid}er${s}`, 0.5 * (1 - fogZ), lw));
  }
  // ---- the dome group (behind the central pavilion's front): drum base, colonnade, entablature, attic, dome, lantern
  const dz = Z + C.domeZ;
  const R = C.domeR;
  els.push(<Drum key="d0" A={A} X={X} Z={dz} R={R * 1.2} h0={H + C.wallH} h1={H + 5800} mat={M} tone={tn} uid={`${uid}d0`} />);
  els.push(<Drum key="d1" A={A} X={X} Z={dz} R={R * 1.08} h0={H + 5800} h1={H + 8200} mat={M} tone={tn} uid={`${uid}d1`} cols={16} />);
  els.push(<Drum key="d2" A={A} X={X} Z={dz} R={R * 1.17} h0={H + 8200} h1={H + 8650} mat={M} tone={tn} uid={`${uid}d2`} />);
  els.push(<Drum key="d3" A={A} X={X} Z={dz} R={R} h0={H + 8650} h1={H + C.domeBase} mat={M} tone={tn} uid={`${uid}d3`} slots={14} slotH={[H + 8800, H + 9250]} />);
  // the dome: a tall profile r(t) (wider shoulders, then rising to a point under the lantern), lit from the left
  {
    const N = 40;
    const prof = (t: number) => R * Math.pow(1 - Math.pow(t, 2.1), 0.58);
    const hAt = (t: number) => H + C.domeBase + t * (C.domeTop - C.domeBase);
    const left: P2[] = [];
    const right: P2[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const r0 = Math.max(prof(t), 0);
      left.push(proj(A, [X - r0, hAt(t), dz]));
      right.push(proj(A, [X + r0, hAt(t), dz]));
    }
    const d = polyD([...left, ...right.reverse()]);
    const gid = `${uid}dm`;
    const xa = proj(A, [X - R, 0, dz])[0];
    const xb = proj(A, [X + R, 0, dz])[0];
    const hm = (C.domeBase + C.domeTop) / 2;
    els.push(
      <g key="dome">
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={n2(xa)} y1="0" x2={n2(xb)} y2="0">
            <stop offset="0" stopColor={tn(M.mid, dz, hm)} />
            <stop offset="0.25" stopColor={tn(M.lit, dz, hm)} />
            <stop offset="0.55" stopColor={tn(mixHex(M.lit, M.mid, 0.6), dz, hm)} />
            <stop offset="0.88" stopColor={tn(mixHex(M.dark, PAL.shadow, 0.1), dz, hm)} />
            <stop offset="1" stopColor={tn(mixHex(M.mid, M.dark, 0.4), dz, hm)} />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#${gid})`} stroke={tn(M.dark, dz, hm)} strokeWidth={lw} strokeOpacity={0.6} />
      </g>,
    );
    // the ribs (meridians) and two rings of small windows
    const domeDetail = sstep(6, 14, R * px);
    const domeDetailI = els.length;
    if (domeDetail > 0.005) {
      let ribs = "";
      for (let k = -3; k <= 3; k++) {
        const a = (k / 3.5) * (Math.PI / 2);
        const pts: P2[] = [];
        for (let i = 0; i <= N * 0.92; i++) {
          const t = i / N;
          pts.push(proj(A, [X + prof(t) * Math.sin(a), hAt(t), dz - prof(t) * Math.cos(a)]));
        }
        ribs += `M${pts.map(Pt).join("L")}`;
      }
      els.push(<path key="ribs" d={ribs} fill="none" stroke={tn(M.dark, dz, hm)} strokeWidth={lw * 0.9} strokeOpacity={0.4} />);
      let wins = "";
      for (const t of [0.18, 0.5]) {
        for (let k = -3; k <= 3; k++) {
          const a = ((k + 0.5) / 3.5) * (Math.PI / 2);
          if (Math.abs(a) > 1.35) continue;
          const rr = prof(t);
          const x = X + rr * Math.sin(a);
          const ww = (R * 0.08 * Math.cos(a)) / (1 + t);
          const hh = 260 / (1 + t);
          wins += polyD([proj(A, [x - ww, hAt(t), dz - rr]), proj(A, [x + ww, hAt(t), dz - rr]), proj(A, [x + ww, hAt(t) + hh, dz - rr]), proj(A, [x - ww, hAt(t) + hh, dz - rr])]);
        }
      }
      els.push(<path key="dw" d={wins} fill={tn(WIN, dz, hm)} opacity={0.6} />);
    }
    fadeTail(els, domeDetailI, domeDetail, "domefd");
    // the cream rim on the dome's lit (left) edge
    els.push(<path key="drim" d={`M${left.slice(2, N - 2).map(Pt).join("L")}`} fill="none" stroke={PAL.cream} strokeWidth={lw * 1.4} strokeOpacity={0.55 * (1 - fogZ)} />);
  }
  // the lantern: a little columned drum with its own cap, then the statue on a ball
  els.push(<Drum key="l0" A={A} X={X} Z={dz} R={560} h0={H + C.domeTop - 150} h1={H + C.domeTop + 1100} mat={M} tone={tn} uid={`${uid}l0`} cols={6} />);
  {
    const b = H + C.domeTop + 1100;
    const cap: P2[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      cap.push(proj(A, [X - 620 * Math.cos(a), b + 620 * Math.sin(a) * 0.9, dz]));
    }
    els.push(<path key="lc" d={polyD(cap)} fill={tn(M.lit, dz, b)} stroke={tn(M.dark, dz, b)} strokeWidth={lw} strokeOpacity={0.6} />);
    // the statue: a robed figure on a small ball, the right arm raised holding up a star
    const s0 = b + 560;
    const sc = 1;
    const fig = (x: number, h: number): P2 => proj(A, [X + x * sc, s0 + h * sc, dz]);
    const statue = polyD([fig(-150, 0), fig(150, 0), fig(110, 700), fig(170, 900), fig(120, 1150), fig(60, 1250), fig(-60, 1250), fig(-120, 1120), fig(-130, 950), fig(-90, 700)]);
    const head = proj(A, [X, s0 + 1360, dz]);
    const arm = `M${Pt(fig(80, 1150))}L${Pt(fig(240, 1650))}`;
    const star = proj(A, [X + 250, s0 + 1760, dz]);
    const r = A.P.r(dz);
    const scol = tn(mixHex(M.mid, M.dark, 0.35), dz, s0);
    els.push(
      <g key="st">
        <ellipse cx={proj(A, [X, b + 300, dz])[0]} cy={proj(A, [X, b + 300, dz])[1]} rx={260 * r} ry={260 * r} fill={tn(M.mid, dz, b)} />
        <path d={statue} fill={scol} />
        <circle cx={head[0]} cy={head[1]} r={110 * r} fill={scol} />
        <path d={arm} stroke={scol} strokeWidth={90 * r} strokeLinecap="round" />
        <circle cx={star[0]} cy={star[1]} r={120 * r} fill={tn(M.lit, dz, s0)} />
      </g>,
    );
  }
  // ---- the central pavilion and its portico (in front of the dome group)
  const px0 = X - C.pavHalf;
  const px1 = X + C.pavHalf;
  const pz = Z - C.pavOut;
  els.push(...boxFaces(A, px0, px1, H, H + C.pavH, pz, Z + 3000, M, `${uid}cp`, tn, lw));
  // the portico: a dark recess with four columns, steps below, the pediment above
  const recess: V3[] = [
    [X - 3100, H + 1100, pz - 2],
    [X + 3100, H + 1100, pz - 2],
    [X + 3100, H + 4200, pz - 2],
    [X - 3100, H + 4200, pz - 2],
  ];
  els.push(<path key="rc" d={poly3(A, recess)} fill={tn(mixHex(M.dark, PAL.shadow, 0.2), pz, 2500)} opacity={0.9} />);
  const colFade = sstep(1.2, 3, 300 * px);
  const colFadeI = els.length;
  if (colFade > 0.005) {
    let cols = "";
    let colLit = "";
    for (const cx of [-2700, -900, 900, 2700]) {
      const w = 260;
      cols += polyD([proj(A, [X + cx - w, H + 1100, pz - 6]), proj(A, [X + cx + w, H + 1100, pz - 6]), proj(A, [X + cx + w, H + 4250, pz - 6]), proj(A, [X + cx - w, H + 4250, pz - 6])]);
      colLit += polyD([proj(A, [X + cx - w, H + 1100, pz - 7]), proj(A, [X + cx - w * 0.2, H + 1100, pz - 7]), proj(A, [X + cx - w * 0.2, H + 4250, pz - 7]), proj(A, [X + cx - w, H + 4250, pz - 7])]);
    }
    els.push(<path key="co" d={cols} fill={tn(M.mid, pz, 2500)} />);
    els.push(<path key="cl" d={colLit} fill={tn(M.lit, pz, 2500)} />);
    // the entablature over the columns and the steps
    els.push(<path key="en" d={poly3(A, [[X - 3300, H + 4250, pz - 8], [X + 3300, H + 4250, pz - 8], [X + 3300, H + C.pavH, pz - 8], [X - 3300, H + C.pavH, pz - 8]])} fill={tn(M.lit, pz, 4600)} />);
    let steps = "";
    for (let i = 0; i < 4; i++) steps += line3(A, [[X - 3400 + i * 60, H + 250 * (i + 1), pz - 400 + i * 100], [X + 3400 - i * 60, H + 250 * (i + 1), pz - 400 + i * 100]]);
    els.push(<path key="sp" d={poly3(A, [[X - 3500, H, pz - 500], [X + 3500, H, pz - 500], [X + 3300, H + 1100, pz - 6], [X - 3300, H + 1100, pz - 6]])} fill={tn(M.mid, pz, 500)} />);
    els.push(<path key="spl" d={steps} stroke={tn(M.dark, pz, 500)} strokeWidth={lw} opacity={0.5} />);
  }
  fadeTail(els, colFadeI, colFade, "colfd");
  pediment(px0 - 150, px1 + 150, H + C.pavH, C.pedH, pz - 10, `${uid}cped`);
  els.push(boxRim(A, px0, px1, H, H + C.pavH, pz, `${uid}cprm`, 0.5 * (1 - fogZ), lw));
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE WHOLE CITY
// ===================================================================================================================
/** downtown, around the Capitol (o = the Capitol's front centre): towers mostly to its right and behind, a few to its
 *  left, low blocks in front along the avenue; the dome kept clear against the sky */
export const TOWERS: TowerSpec[] = [
  { X: 21500, Z: 2000, w: 5200, d: 4600, h: 21000, style: "piers", mat: "concrete", crown: "penthouse", seed: 1 },
  { X: 29000, Z: 9000, w: 6200, d: 5200, h: 17500, style: "glass", mat: "glass", crown: "flat", seed: 2 },
  { X: 15000, Z: 14000, w: 4600, d: 4600, h: 14800, style: "grid", mat: "stone", tiers: [[0.72, 520]], crown: "antenna", seed: 3 },
  { X: 36000, Z: -1500, w: 5600, d: 5000, h: 13200, style: "ribbon", mat: "sage", crown: "penthouse", seed: 4 },
  { X: 25500, Z: 18000, w: 5000, d: 5000, h: 19500, style: "grid", mat: "brick", tiers: [[0.62, 450], [0.84, 450]], crown: "flat", seed: 5 },
  { X: 41500, Z: 8000, w: 4400, d: 4400, h: 11000, style: "grid", mat: "stucco", crown: "penthouse", seed: 6 },
  { X: 9200, Z: 21000, w: 4200, d: 4200, h: 12500, style: "ribbon", mat: "concrete", crown: "penthouse", seed: 7 },
  { X: -9500, Z: 20000, w: 4600, d: 4600, h: 13800, style: "piers", mat: "stone", crown: "antenna", seed: 8 },
  { X: -21000, Z: 6000, w: 5000, d: 4600, h: 15500, style: "glass", mat: "glass", crown: "penthouse", seed: 9 },
  { X: -29500, Z: 12000, w: 4800, d: 4800, h: 11800, style: "grid", mat: "brick", crown: "flat", seed: 10 },
  { X: -35000, Z: 1500, w: 4400, d: 4200, h: 9200, style: "ribbon", mat: "stucco", crown: "penthouse", seed: 11 },
  { X: 33500, Z: 22000, w: 4600, d: 4600, h: 15000, style: "piers", mat: "concrete", crown: "flat", seed: 12 },
  { X: -16000, Z: 24000, w: 4400, d: 4400, h: 10500, style: "grid", mat: "sage", crown: "penthouse", seed: 13 },
];
/** low blocks in front of downtown, both sides of the avenue (avenue along Z at X = avenueX) */
export const BLOCKS: BlockSpec[] = [
  { X: 13200, Z: -9000, w: 5200, d: 4000, floors: 4, mat: "brick", awning: true, seed: 1 },
  { X: 20000, Z: -10000, w: 6000, d: 4200, floors: 3, mat: "stucco", seed: 2 },
  { X: 27500, Z: -8000, w: 5000, d: 4500, floors: 5, mat: "stone", seed: 3 },
  { X: 34500, Z: -9500, w: 6000, d: 4200, floors: 3, mat: "sage", awning: true, seed: 4 },
  { X: -12000, Z: -9000, w: 5400, d: 4000, floors: 3, mat: "stucco", awning: true, seed: 5 },
  { X: -19500, Z: -8000, w: 5600, d: 4400, floors: 4, mat: "brick", seed: 6 },
  { X: -27000, Z: -10000, w: 5000, d: 4000, floors: 2, mat: "stone", seed: 7 },
  { X: -33500, Z: -6500, w: 5200, d: 4200, floors: 3, mat: "sage", seed: 8 },
  { X: 16500, Z: -17500, w: 4600, d: 3600, floors: 2, mat: "stucco", awning: true, seed: 9 },
  { X: -15500, Z: -18000, w: 4800, d: 3800, floors: 2, mat: "brick", seed: 10 },
  { X: 25500, Z: -19000, w: 5000, d: 3600, floors: 1, mat: "stone", seed: 11 },
  { X: -24500, Z: -18500, w: 4400, d: 3600, floors: 2, mat: "stucco", seed: 12 },
];
/** the city's own paved ground: the avenue to the Capitol, cross streets (decals, drawn first) */
const CityStreets: React.FC<{ A: AirWorld; o: V3; tone: Toner }> = ({ A, o, tone: tn }) => {
  const [X, H, Z] = o;
  const els: React.ReactNode[] = [];
  const zN = Math.max(Z - 26000, A.P.zNear + 100);
  const quad = (x0: number, x1: number, z0: number, z1: number): V3[] => [
    [x0, H + 2, Math.max(z0, zN)],
    [x1, H + 2, Math.max(z0, zN)],
    [x1, H + 2, z1],
    [x0, H + 2, z1],
  ];
  // the plaza / lawn in front of the Capitol and the avenue
  els.push(<path key="lawn" d={poly3(A, quad(X - 9000, X + 9000, Z - 5200, Z - 600))} fill={tn("#7F8862", Z - 3000, 0)} />);
  els.push(<path key="av" d={poly3(A, quad(X - 1100, X + 1100, Z - 26000, Z - 5200))} fill={tn("#6A665E", Z - 15000, 0)} />);
  for (const zc of [-13500, -22000, -4400]) els.push(<path key={`x${zc}`} d={poly3(A, quad(X - 44000, X + 44000, Z + zc - 900, Z + zc + 900))} fill={tn("#6A665E", Z + zc, 0)} />);
  return <g>{els}</g>;
};
/** small cars on the city's streets (they recede with it): [X, Z (from o), heading x, heading z, colour, speed] */
const CITY_CARS: [number, number, number, number, keyof typeof CAR_MAT, number][] = [
  [-500, -21000, 0, 1, "oatmeal", 70],
  [520, -15000, 0, -1, "sage", 60],
  [9000, -13500, 1, 0, "brickBrown", 80],
  [-14000, -13300, -1, 0, "cream", 70],
  [22000, -21800, -1, 0, "slate", 60],
];

/** `rel`: how fast the skyline shrinks on screen (its relative width change per frame); fine facade patterns fade out
 *  while it is fast enough to make them strobe */
export const AustinCity: React.FC<{ A: AirWorld; o: V3; tone: Toner; frame: number; uid: string; cars?: boolean; rel?: number }> = ({ A, o, tone, frame, uid, cars = true, rel = 0 }) => {
  const [X, H, Z] = o;
  type It = { z: number; node: React.ReactNode };
  const its: It[] = [];
  TOWERS.forEach((s, i) => its.push({ z: Z + s.Z, node: <Tower key={`t${i}`} A={A} s={s} o={o} tone={tone} uid={`${uid}t${i}`} rel={rel} /> }));
  BLOCKS.forEach((s, i) => its.push({ z: Z + s.Z, node: <LowBlock key={`b${i}`} A={A} s={s} o={o} tone={tone} uid={`${uid}b${i}`} rel={rel} /> }));
  its.push({ z: Z - CAP.pavOut - 500, node: <Capitol key="cap" A={A} o={o} tone={tone} uid={`${uid}cap`} rel={rel} /> });
  if (cars) {
    CITY_CARS.forEach(([cx, cz, hx, hz, m, v], i) => {
      const t = frame * v;
      const p: V3 = [X + cx + hx * t, H, Z + cz + hz * t];
      if (p[2] < A.P.zNear + 2000) return;
      its.push({ z: p[2] - 500, node: <Sedan key={`c${i}`} A={A} o={p} heading={[hx, hz]} roll={t / 66} mat={CAR_MAT[m]} uid={`${uid}c${i}`} tone={tone} shadow={0.7} /> });
    });
  }
  its.sort((a, b) => b.z - a.z);
  return (
    <g>
      <CityStreets A={A} o={o} tone={tone} />
      {its.map((it, i) => (
        <React.Fragment key={i}>{it.node}</React.Fragment>
      ))}
    </g>
  );
};
/** helper for the cut: the screen-space reach of the skyline (for the probes) */
export const cityTopH = (o: V3) => add(o, [0, CAP.statueTop, CAP.domeZ]);
