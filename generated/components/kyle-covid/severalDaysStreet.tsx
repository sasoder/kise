// ---------------------------------------------------------------------------
// severalDaysStreet — the set of SeveralDaysBeforeIllness (kyle-covid, cut 21): a modern city street seen square on
// from the road (one-point perspective on the depth kit; the VP is the camera's centre column, so a truck slides the
// whole set in parallax): the road and the kerb in front, a wide paved pavement, the lampposts at its front edge, a
// row of single-storey shop fronts along the back (a launderette, a cafe, a bakery, an alley into the deep air, a
// bookshop, a florist: simple air-lit boxes in muted local colours, windows, recessed doors, two awnings), the upper
// city far behind in the haze, and a backless bench. Nothing orange. Every colour goes through the cycle world's
// tone (fog by distance, then the night), so the set lives through the time-lapse: at night the shop windows and the
// far city's windows glow cream, the lamps' cones and pools come on.
// ---------------------------------------------------------------------------
import React from "react";
import { AirBox, AirCyl, AirFloor, AirShadow, MAT, lineOf, mixHex, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import type { CycleWorld } from "./severalDaysAir";
import { ALLEY, BACK_LAMPS, BENCH, BOLLARDS, LAMPS, ROAD_Y, SHOPS, Z_BACK_LAMP, Z_KERB, Z_LAMP, Z_SHOP, c01, hash1, lightsOn, lerp, type Shop, type ShopKind } from "./severalDaysPlan";

const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
export const CREAM = "#F3EBDD";
const LIT_GLASS = "#DCCBA6";

// ---- materials (local colours before fog and night) ----------------------------------------------------------------
export const M = {
  pave: { lit: "#968C7B", mid: "#7C7363", dark: "#4B453B" } as Mat,
  granite: { lit: "#A39C90", mid: "#827B70", dark: "#4A463F" } as Mat,
  asphalt: { lit: "#5E5A52", mid: "#4F4B44", dark: "#35322D" } as Mat,
  teal: { lit: "#7F9C95", mid: "#5F7E78", dark: "#3A524E" } as Mat,
  brick: { lit: "#946452", mid: "#744C3D", dark: "#432C23" } as Mat,
  slate: { lit: "#727D88", mid: "#535E6A", dark: "#30373F" } as Mat,
  oatmeal: { lit: "#CBBB9C", mid: "#AC9C7D", dark: "#6F634F" } as Mat,
  khaki: { lit: "#9C9679", mid: "#7C775F", dark: "#4B4737" } as Mat,
  plaster: { lit: "#BDB09A", mid: "#9E927D", dark: "#655C4E" } as Mat,
  timber: MAT.timber,
  iron: { lit: "#6F7A7D", mid: "#4D5659", dark: "#2B3032" } as Mat,
  canvasOat: { lit: "#D4C7AB", mid: "#B6A88C", dark: "#776C57" } as Mat,
  canvasSlate: { lit: "#6C807C", mid: "#52645F", dark: "#33403C" } as Mat,
  frame: { lit: "#E3D9C6", mid: "#C9BEA9", dark: "#8C8370" } as Mat,
  far: { lit: "#8F8E83", mid: "#77786F", dark: "#4E504A" } as Mat,
};
const DAY_GLASS = "#3B4947";

// ===================================================================================================================
// THE FAR CITY: taller buildings far behind the shop row (Z 1700-2600), deep in the haze; their windows light at night
// ===================================================================================================================
type FarB = { x0: number; x1: number; z: number; top: number; mat: Mat; seed: number };
const FAR: FarB[] = (() => {
  const out: FarB[] = [];
  let x = -2200;
  for (let i = 0; i < 18; i++) {
    const w = 260 + hash1(i + 3.1) * 260;
    const z = 1700 + hash1(i + 7.7) * 900;
    const top = -(1150 + hash1(i + 11.3) * 900);
    const mats = [M.far, M.plaster, M.brick, M.slate];
    out.push({ x0: x, x1: x + w, z, top, mat: mats[Math.floor(hash1(i + 5.5) * 4)], seed: i });
    x += w + 20 + hash1(i + 9.9) * 90;
  }
  return out.sort((a, b) => b.z - a.z);
})();
export const FarCity: React.FC<{ A: CycleWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  FAR.forEach((b) => {
    els.push(<AirBox key={`fb${b.seed}`} A={A} X0={b.x0} X1={b.x1} Y0={b.top} Y1={0} Z0={b.z} Z1={b.z + 300} mat={b.mat} uid={`fb${b.seed}`} rim={0.5} />);
    // the windows: a grid on the front face, dark glass by day, some lit cream at night (each its own threshold)
    let dDay = "";
    const lit: { d: string; a: number }[] = [];
    const cols = Math.floor((b.x1 - b.x0 - 50) / 78);
    const rows = Math.floor((-b.top - 260) / 110);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const X = b.x0 + 40 + c * 78;
        const Y = b.top + 70 + r * 110;
        const q = poly([P.p(X, Y, b.z), P.p(X + 32, Y, b.z), P.p(X + 32, Y + 52, b.z), P.p(X, Y + 52, b.z)]);
        dDay += q;
        const h = hash1(b.seed * 31 + r * 7.3 + c * 1.9);
        if (h < 0.55) lit.push({ d: q, a: lightsOn(f, 0.3 + 0.4 * hash1(h * 91 + 2)) });
      }
    }
    els.push(<path key={`fw${b.seed}`} d={dDay} fill={A.tone(mixHex(b.mat.dark, "#22180F", 0.3), b.z, 700)} opacity={0.75} />);
    const bins = new Map<number, string>();
    lit.forEach((w) => {
      const k = Math.round(w.a * 8);
      if (k > 0) bins.set(k, (bins.get(k) ?? "") + w.d);
    });
    bins.forEach((d, k) => els.push(<path key={`fl${b.seed}-${k}`} d={d} fill={mixHex(A.airHex(b.z, 700), LIT_GLASS, 0.62)} opacity={k / 8} />));
  });
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE ALLEY between the bakery and the bookshop: its floor and walls receding into the deep air
// ===================================================================================================================
const ALLEY_Z1 = 2300;
const ALLEY_TOP = -720;
export const Alley: React.FC<{ A: CycleWorld }> = ({ A }) => {
  const P = A.P;
  const p = P.p;
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  // the floor (the pavement's own stone), in depth bands
  const N = 18;
  for (let i = 0; i < N; i++) {
    const za = lerp(Z_SHOP, ALLEY_Z1, Math.pow(i / N, 1.4));
    const zb = lerp(Z_SHOP, ALLEY_Z1, Math.pow((i + 1) / N, 1.4));
    els.push(<path key={`af${i}`} d={poly([p(ALLEY.x0, 0, za), p(ALLEY.x1, 0, za), p(ALLEY.x1, 0, zb + 4), p(ALLEY.x0, 0, zb + 4)])} fill={A.tone(mixHex(M.pave.mid, M.pave.dark, 0.35), (za + zb) / 2, 0)} />);
  }
  // the walls: the bookshop's side (faces -X, seen while the VP is left of it) and the bakery's (faces +X)
  const wall = (X: number, mat: Mat, key: string) => {
    for (let i = 0; i < N; i++) {
      const za = lerp(Z_SHOP, ALLEY_Z1, Math.pow(i / N, 1.4));
      const zb = lerp(Z_SHOP, ALLEY_Z1, Math.pow((i + 1) / N, 1.4));
      const Zm = (za + zb) / 2;
      els.push(<path key={`${key}${i}`} d={poly([p(X, 0, za), p(X, 0, zb + 4), p(X, ALLEY_TOP, zb + 4), p(X, ALLEY_TOP, za)])} fill={A.tone(mixHex(mat.mid, mat.dark, 0.45), Zm, 360)} />);
    }
    // a soft occlusion along its foot
    els.push(<path key={`${key}o`} d={`M${Pt(p(X, 0, Z_SHOP))}L${Pt(p(X, 0, ALLEY_Z1))}`} stroke={A.tone("#22180F", 1200, 0)} strokeWidth={6 * P.r(1200)} strokeOpacity={0.35} />);
  };
  if (vx < ALLEY.x1) wall(ALLEY.x1, M.slate, "aw1");
  if (vx > ALLEY.x0) wall(ALLEY.x0, M.brick, "aw0");
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE SHOP ROW (the front plane at Z_SHOP): each shop a wall with its window(s) and door recessed, pilasters, a fascia,
// a cornice, the upper wall to its coping; awnings over the cafe and the bakery
// ===================================================================================================================
type Opening = { x0: number; x1: number; y0: number; y1: number; depth: number; kind: "window" | "door" };
type Layout = { mat: Mat; openings: Opening[]; awning?: Mat; upper: Mat };
const layoutOf = (s: Shop): Layout => {
  const W = (x0: number, x1: number): Opening => ({ x0, x1, y0: -440, y1: -92, depth: 16, kind: "window" });
  const D = (x0: number, x1: number): Opening => ({ x0, x1, y0: -440, y1: 0, depth: 46, kind: "door" });
  const k: ShopKind = s.kind;
  const a = s.x0;
  const b = s.x1;
  if (k === "cafe") return { mat: M.teal, openings: [W(a + 44, b - 150), D(b - 128, b - 40)], awning: M.canvasOat, upper: M.plaster };
  if (k === "bakery") return { mat: M.brick, openings: [W(a + 34, a + 150), D(a + 176, a + 262), W(a + 288, b - 30)], awning: M.canvasSlate, upper: M.brick };
  if (k === "books") return { mat: M.slate, openings: [D(a + 40, a + 128), W(a + 156, b - 44)], upper: M.oatmeal };
  if (k === "florist") return { mat: M.khaki, openings: [W(a + 40, b - 150), D(b - 128, b - 40)], upper: M.plaster };
  return { mat: M.oatmeal, openings: [W(a + 40, b - 40)], upper: M.plaster };
};
const FASCIA = { y0: -560, y1: -470 };
const CORNICE = { y0: -600, y1: -560 };
const UPPER_TOP = -720;
/** the windows' glass (and the doors' upper panes), for the night glow pass */
export const glassOf = (s: Shop) =>
  layoutOf(s)
    .openings.map((o) => (o.kind === "window" ? { ...o } : { ...o, x0: o.x0 + 14, x1: o.x1 - 14, y0: o.y0 + 16, y1: -230 }))
    .map((o) => ({ ...o, z: Z_SHOP + (o.kind === "window" ? o.depth : o.depth - 2) }));

/** what a shop shows inside a window (people), drawn over the room and under the glass's sheen, the frames and the wall */
export type Inside = (s: Shop, o: { x0: number; x1: number; y0: number; y1: number }, i: number, lit: number) => React.ReactNode;
const ShopFront: React.FC<{ A: CycleWorld; s: Shop; f: number; idx: number; inside?: Inside }> = ({ A, s, f, idx, inside }) => {
  const P = A.P;
  const p = P.p;
  const L = layoutOf(s);
  const Z = Z_SHOP;
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  const T = (hex: string, z = Z, h = 300) => A.tone(hex, z, h);
  const on = lightsOn(f, 0.36 + 0.08 * hash1(idx + 4));
  const k = s.kind;
  // the recesses: back pane (glass / door) and the reveals seen into (left reveal when the hole is right of the VP's
  // column is hidden, its right reveal shows; the soffit shows above the eye, the sill below it)
  L.openings.forEach((o, i) => {
    const zb = Z + o.depth;
    const back = poly([p(o.x0, o.y0, zb), p(o.x1, o.y0, zb), p(o.x1, o.y1, zb), p(o.x0, o.y1, zb)]);
    const reveal = mixHex(L.mat.mid, L.mat.dark, 0.5);
    if (o.kind === "door") {
      // the door: timber panel, its upper pane glass
      els.push(<path key={`db${i}`} d={back} fill={T(mixHex(M.timber.mid, L.mat.dark, 0.3), zb)} />);
      const g = glassOf(s)[i];
      const gq = poly([p(g.x0, g.y0, g.z), p(g.x1, g.y0, g.z), p(g.x1, g.y1, g.z), p(g.x0, g.y1, g.z)]);
      els.push(<path key={`dg${i}`} d={gq} fill={mixHex(T(DAY_GLASS, zb), mixHex(T(LIT_GLASS, zb, 200), LIT_GLASS, 0.5), on)} />);
      // the handle
      const hp = p(o.x1 - 20, -220, zb - 1);
      els.push(<circle key={`dh${i}`} cx={hp[0]} cy={hp[1]} r={4 * P.r(zb)} fill={T(M.frame.mid, zb)} />);
    } else {
      els.push(<path key={`wb${i}`} d={back} fill={mixHex(T(DAY_GLASS, zb), mixHex(T(LIT_GLASS, zb, 200), LIT_GLASS, 0.5), on)} />);
      // the room behind the glass: a few shapes by the shop's kind (dim by day, dark against the lit room at night)
      els.push(<path key={`wi${i}`} d={interiorOf(k, o, (X, Y) => p(X, Y, zb + 1))} fill={mixHex(T(mixHex(L.mat.dark, DAY_GLASS, 0.3), zb), T(mixHex(L.mat.dark, "#3A2C20", 0.5), zb, 200), on)} opacity={0.55 + 0.35 * on} />);
      const ins = inside?.(s, o, i, on);
      if (ins) els.push(<g key={`wp${i}`}>{ins}</g>);
      // the daylight's soft sheen across the glass (a diagonal band), fading at night
      const sh = poly([p(o.x0 + (o.x1 - o.x0) * 0.12, o.y0, zb), p(o.x0 + (o.x1 - o.x0) * 0.34, o.y0, zb), p(o.x0 + (o.x1 - o.x0) * 0.2, o.y1, zb), p(o.x0 - (o.x1 - o.x0) * 0.02, o.y1, zb)]);
      els.push(<path key={`ws${i}`} d={sh} fill={CREAM} opacity={0.07 * (1 - on) * (1 - A.fog(zb) * 0.5)} />);
      // the mullion and the transom (cream-painted frames)
      const xm = (o.x0 + o.x1) / 2;
      const fr = poly([p(xm - 5, o.y0, zb - 2), p(xm + 5, o.y0, zb - 2), p(xm + 5, o.y1, zb - 2), p(xm - 5, o.y1, zb - 2)]) + poly([p(o.x0, -350, zb - 2), p(o.x1, -350, zb - 2), p(o.x1, -340, zb - 2), p(o.x0, -340, zb - 2)]);
      els.push(<path key={`wf${i}`} d={fr} fill={T(M.frame.mid, zb)} />);
    }
    if (o.x1 < vx) els.push(<path key={`rr${i}`} d={poly([p(o.x1, o.y0, Z), p(o.x1, o.y0, zb), p(o.x1, o.y1, zb), p(o.x1, o.y1, Z)])} fill={T(reveal)} />);
    if (o.x0 > vx) els.push(<path key={`rl${i}`} d={poly([p(o.x0, o.y0, Z), p(o.x0, o.y0, zb), p(o.x0, o.y1, zb), p(o.x0, o.y1, Z)])} fill={T(mixHex(L.mat.lit, L.mat.mid, 0.4))} />);
    els.push(<path key={`rs${i}`} d={poly([p(o.x0, o.y0, Z), p(o.x1, o.y0, Z), p(o.x1, o.y0, zb), p(o.x0, o.y0, zb)])} fill={T(mixHex(L.mat.dark, "#22180F", 0.25))} />);
    if (o.kind === "window") els.push(<path key={`rb${i}`} d={poly([p(o.x0, o.y1, Z), p(o.x1, o.y1, Z), p(o.x1, o.y1, zb), p(o.x0, o.y1, zb)])} fill={T(L.mat.lit)} />);
  });
  // the wall with its holes (one plane: one tone), the stall riser's soft darkening to its foot
  const wall = poly([p(s.x0, 0, Z), p(s.x1, 0, Z), p(s.x1, FASCIA.y1, Z), p(s.x0, FASCIA.y1, Z)]);
  const holes = L.openings.map((o) => poly([p(o.x0, o.y1, Z), p(o.x0, o.y0, Z), p(o.x1, o.y0, Z), p(o.x1, o.y1, Z)])).join("");
  els.push(<path key="wall" d={wall + holes} fillRule="evenodd" fill={T(L.mat.mid)} />);
  const ya = p(0, FASCIA.y1, Z)[1];
  const yb = p(0, 0, Z)[1];
  els.push(
    <g key="wg">
      <defs>
        <linearGradient id={`sd-wg${idx}`} gradientUnits="userSpaceOnUse" x1="0" y1={ya.toFixed(2)} x2="0" y2={yb.toFixed(2)}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.06 * (1 - A.fog(Z))} />
          <stop offset="0.5" stopColor="#22180F" stopOpacity={0} />
          <stop offset="1" stopColor="#22180F" stopOpacity={0.22 * (1 - A.fog(Z))} />
        </linearGradient>
      </defs>
      <path d={wall + holes} fillRule="evenodd" fill={`url(#sd-wg${idx})`} />
    </g>,
  );
  // the openings' lit edges (a cream arris on the left jamb and the head)
  const arris = L.openings.map((o) => `M${Pt(p(o.x0, o.y1, Z))}L${Pt(p(o.x0, o.y0, Z))}L${Pt(p(o.x1, o.y0, Z))}`).join("");
  els.push(<path key="ar" d={arris} fill="none" stroke={CREAM} strokeWidth={A.lw(1.3)} strokeOpacity={0.4 * (1 - A.fog(Z))} strokeLinejoin="round" />);
  // the upper wall (to the coping), the fascia and the cornice, the pilasters
  els.push(<AirBox key="up" A={A} X0={s.x0} X1={s.x1} Y0={UPPER_TOP} Y1={CORNICE.y0} Z0={Z + 6} Z1={Z + 60} mat={L.upper} uid={`sd-up${idx}`} rim={0.8} />);
  els.push(<AirBox key="co" A={A} X0={s.x0 - 8} X1={s.x1 + 8} Y0={CORNICE.y0} Y1={CORNICE.y1} Z0={Z - 22} Z1={Z} mat={M.frame} uid={`sd-co${idx}`} />);
  els.push(<AirBox key="fa" A={A} X0={s.x0} X1={s.x1} Y0={FASCIA.y0} Y1={FASCIA.y1} Z0={Z - 12} Z1={Z} mat={L.mat} uid={`sd-fa${idx}`} />);
  for (const [X0, X1] of [
    [s.x0, s.x0 + 22],
    [s.x1 - 22, s.x1],
  ]) {
    els.push(<AirBox key={`pi${X0}`} A={A} X0={X0} X1={X1} Y0={FASCIA.y1} Y1={0} Z0={Z - 10} Z1={Z} mat={mixMat(L.mat, M.frame, 0.25)} uid={`sd-pi${idx}${X0}`} rim={0.7} />);
  }
  // the awning (seen from below): the canvas underside sloping out from under the fascia, its valance
  if (L.awning) {
    const aw = L.awning;
    const zf = Z - 128;
    const y0 = FASCIA.y1 + 6;
    const y1 = -404;
    const xa = s.x0 + 14;
    const xb = s.x1 - 14;
    els.push(<path key="awu" d={poly([p(xa, y0, Z - 2), p(xb, y0, Z - 2), p(xb, y1, zf), p(xa, y1, zf)])} fill={T(mixHex(aw.mid, aw.dark, 0.55), Z - 60, 450)} />);
    if (xa > vx) els.push(<path key="awl" d={poly([p(xa, y0, Z - 2), p(xa, y1, zf), p(xa, y1 + 26, zf)])} fill={T(aw.mid, Z - 60, 450)} />);
    if (xb < vx) els.push(<path key="awr" d={poly([p(xb, y0, Z - 2), p(xb, y1, zf), p(xb, y1 + 26, zf)])} fill={T(mixHex(aw.mid, aw.dark, 0.4), Z - 60, 450)} />);
    els.push(<path key="awv" d={poly([p(xa, y1, zf), p(xb, y1, zf), p(xb, y1 + 26, zf), p(xa, y1 + 26, zf)])} fill={T(aw.lit, zf, 420)} stroke={T(lineOf(aw), zf, 420)} strokeWidth={A.lw(0.9)} />);
    els.push(<path key="awe" d={`M${Pt(p(xa, y1, zf))}L${Pt(p(xb, y1, zf))}`} stroke={CREAM} strokeWidth={A.lw(1.2)} strokeOpacity={0.45 * (1 - A.fog(zf))} />);
  }
  return <g>{els}</g>;
};
const mixMat = (a: Mat, b: Mat, t: number): Mat => ({ lit: mixHex(a.lit, b.lit, t), mid: mixHex(a.mid, b.mid, t), dark: mixHex(a.dark, b.dark, t) });

export const ShopRow: React.FC<{ A: CycleWorld; f: number; inside?: Inside }> = ({ A, f, inside }) => (
  <g>
    {SHOPS.map((s, i) => (
      <ShopFront key={s.kind} A={A} s={s} f={f} idx={i} inside={inside} />
    ))}
  </g>
);

/** the night pass of the shop row: a soft cream glow round each lit window and its light spilt on the pavement */
export const ShopGlow: React.FC<{ A: CycleWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const p = P.p;
  const els: React.ReactNode[] = [];
  SHOPS.forEach((s, idx) => {
    const on = lightsOn(f, 0.36 + 0.08 * hash1(idx + 4));
    if (on < 0.01) return;
    glassOf(s).forEach((g, i) => {
      const q = poly([p(g.x0, g.y0, g.z), p(g.x1, g.y0, g.z), p(g.x1, g.y1, g.z), p(g.x0, g.y1, g.z)]);
      els.push(<path key={`gh${idx}-${i}`} d={q} fill={CREAM} opacity={0.32 * on} filter="url(#sd-glowblur)" />);
      // the spill on the pavement: from the window's foot toward the street, widening and fading
      const za = Z_SHOP - 2;
      const zb = Z_SHOP - 420;
      const sp = poly([p(g.x0 + 10, 0, za), p(g.x1 - 10, 0, za), p(g.x1 + 120, 0, zb), p(g.x0 - 120, 0, zb)]);
      const y0 = p(0, 0, za)[1];
      const y1 = p(0, 0, zb)[1];
      els.push(
        <g key={`gs${idx}-${i}`}>
          <defs>
            <linearGradient id={`sd-sp${idx}-${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={y1.toFixed(2)}>
              <stop offset="0" stopColor={CREAM} stopOpacity={0.3} />
              <stop offset="1" stopColor={CREAM} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={sp} fill={`url(#sd-sp${idx}-${i})`} opacity={on} filter="url(#sd-softblur)" />
        </g>,
      );
    });
  });
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <filter id="sd-glowblur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={14 / A.k} />
        </filter>
        <filter id="sd-softblur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={10 / A.k} />
        </filter>
      </defs>
      {els}
    </g>
  );
};

/** the silhouettes in a window (shelves and what is on them), world points via pt(X, Y) */
const interiorOf = (k: ShopKind, o: Opening, pt: (X: number, Y: number) => P2) => {
  const R = (x0: number, x1: number, y0: number, y1: number) => poly([pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1)]);
  const w = o.x1 - o.x0;
  let d = "";
  if (k === "cafe") {
    // two pendant lamps, cups on a shelf (the guests at their table are drawn by the cut)
    for (const u of [0.3, 0.7]) {
      const X = o.x0 + w * u;
      d += R(X - 1.5, X + 1.5, o.y0, -380) + R(X - 18, X + 18, -380, -362);
    }
    for (let i = 0; i < 6; i++) d += R(o.x0 + w * (0.15 + i * 0.12), o.x0 + w * (0.15 + i * 0.12) + 14, -296, -280);
    d += R(o.x0 + w * 0.1, o.x1 - w * 0.1, -280, -276);
  } else if (k === "bakery") {
    for (const y of [-300, -205]) {
      d += R(o.x0 + 8, o.x1 - 8, y, y + 5);
      for (let i = 0; i < Math.floor((w - 20) / 34); i++) d += R(o.x0 + 14 + i * 34, o.x0 + 40 + i * 34, y - 20, y);
    }
  } else if (k === "books") {
    for (const y of [-330, -230, -130]) {
      d += R(o.x0 + 6, o.x1 - 6, y, y + 5);
      let X = o.x0 + 10;
      let i = 0;
      while (X < o.x1 - 18) {
        const bw = 7 + 7 * hash1(i * 3.7 + y);
        const bh = 48 + 26 * hash1(i * 1.3 + y);
        d += R(X, X + bw, y - bh, y);
        X += bw + 2.5;
        i++;
      }
    }
  } else if (k === "laundry") {
    // the machines' round doors
    for (let i = 0; i < Math.floor(w / 92); i++) {
      const cx = o.x0 + 50 + i * 92;
      d += R(cx - 40, cx + 40, -250, o.y1);
      const pts: P2[] = Array.from({ length: 16 }, (_, j) => pt(cx + 24 * Math.cos((j / 16) * 6.283), -185 + 24 * Math.sin((j / 16) * 6.283)));
      d += poly(pts);
    }
  } else {
    // the florist: buckets and foliage
    for (let i = 0; i < Math.floor((w - 20) / 46); i++) {
      const X = o.x0 + 18 + i * 46;
      d += R(X, X + 30, -150, o.y1);
      const pts: P2[] = Array.from({ length: 10 }, (_, j) => pt(X + 15 + 22 * Math.cos((j / 10) * 6.283), -185 + 30 * Math.sin((j / 10) * 6.283) * (j < 5 ? 1.3 : 0.6)));
      d += poly(pts);
    }
  }
  return d;
};

/** the wall lanterns beside the shop doors (a small iron box, its cream glass lit at night) */
export const Lanterns: React.FC<{ A: CycleWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  SHOPS.forEach((s, idx) => {
    const X = s.x0 + 11;
    const on = lightsOn(f, 0.33 + 0.1 * hash1(idx + 9));
    els.push(<AirBox key={`lt${idx}`} A={A} X0={X - 10} X1={X + 10} Y0={-500} Y1={-452} Z0={Z_SHOP - 34} Z1={Z_SHOP - 12} mat={M.iron} uid={`sd-lt${idx}`} rim={0.4} />);
    const g = poly([P.p(X - 7, -494, Z_SHOP - 35), P.p(X + 7, -494, Z_SHOP - 35), P.p(X + 7, -458, Z_SHOP - 35), P.p(X - 7, -458, Z_SHOP - 35)]);
    els.push(<path key={`lg${idx}`} d={g} fill={mixHex(A.tone(M.frame.mid, Z_SHOP, 480), "#F6EBD0", on)} />);
  });
  return <g>{els}</g>;
};
/** the lanterns' glow at night (screen) */
export const LanternGlow: React.FC<{ A: CycleWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  SHOPS.forEach((s, idx) => {
    const on = lightsOn(f, 0.33 + 0.1 * hash1(idx + 9));
    if (on < 0.01) return;
    const X = s.x0 + 11;
    const c = P.p(X, -476, Z_SHOP - 36);
    const r = P.r(Z_SHOP);
    const pool = P.p(X + 30, 0, Z_SHOP - 120);
    const ry = Math.abs(P.p(X, 0, Z_SHOP - 300)[1] - P.p(X, 0, Z_SHOP + 60)[1]) / 2;
    els.push(<ellipse key={`lh${idx}`} cx={c[0]} cy={c[1]} rx={110 * r} ry={110 * r} fill="url(#sd-lant)" opacity={on} />);
    els.push(<ellipse key={`lp${idx}`} cx={pool[0]} cy={pool[1]} rx={230 * r} ry={ry} fill="url(#sd-lant)" opacity={0.45 * on} />);
  });
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id="sd-lant">
          <stop offset="0" stopColor={CREAM} stopOpacity={0.7} />
          <stop offset="0.25" stopColor={CREAM} stopOpacity={0.22} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
    </g>
  );
};

/** the bollards along the kerb: short iron posts with a pale band (in front of everyone: they slide fastest, low) */
export const Bollards: React.FC<{ A: CycleWorld }> = ({ A }) => {
  const P = A.P;
  const Zb = Z_KERB + 26;
  const half = 540 / (A.k * P.r(Zb)) + 40;
  return (
    <g>
      {BOLLARDS.filter((X) => Math.abs(X - A.cam.cx) < half).map((X) => (
        <g key={X}>
          <AirShadow A={A} X={X} Z={Zb} w={26} d={18} uid={`sd-bos${X}`} amt={0.7} />
          <AirCyl A={A} X={X} Z={Zb} R={9} Y0={-112} Y1={0} mat={M.iron} uid={`sd-bo${X}`} joints={[-18]} />
          <AirCyl A={A} X={X} Z={Zb} R={9.4} Y0={-96} Y1={-86} mat={M.frame} uid={`sd-bob${X}`} />
          <ellipse cx={P.p(X, -112, Zb)[0]} cy={P.p(X, -112, Zb)[1]} rx={9 * P.r(Zb)} ry={3.5 * P.r(Zb)} fill={A.tone(M.iron.lit, Zb, 112)} />
        </g>
      ))}
    </g>
  );
};

// ===================================================================================================================
// THE GROUND: the pavement (paving slabs), the kerb, the road below it
// ===================================================================================================================
export const Ground: React.FC<{ A: CycleWorld }> = ({ A }) => {
  const P = A.P;
  const cx = A.cam.cx;
  const x0 = cx - 1800;
  const x1 = cx + 1800;
  // the road: one tone by distance at the road's level (ROAD_Y below the pavement), from the kerb toward the lens; at
  // night lifted a little toward a warm dark brown (the frame's darkest corner stays above L* 12: CRAFT)
  const bands: React.ReactNode[] = [];
  const zA = P.zNear + 20;
  const N = 10;
  for (let i = 0; i < N; i++) {
    const za = lerp(Z_KERB, zA, i / N);
    const zb = lerp(Z_KERB, zA, (i + 1) / N);
    const zm = (za + zb) / 2;
    const near = c01((Z_KERB - zm) / 300);
    bands.push(<path key={`rd${i}`} d={poly([P.p(x0, ROAD_Y, za), P.p(x1, ROAD_Y, za), P.p(x1, ROAD_Y, zb - 3), P.p(x0, ROAD_Y, zb - 3)])} fill={mixHex(A.tone(mixHex(M.asphalt.mid, M.asphalt.dark, 0.15 + 0.35 * near), zm, 0), "#4E463A", 0.3 * A.night)} />);
  }
  return (
    <g>
      {bands}
      <AirFloor A={A} x0={x0} x1={x1} z0={Z_KERB} z1={Z_SHOP + 40} mat={M.pave} course={108} plank={112} melt={0} jointAmt={0.85} lw={1.1} />
      {/* the shop row's foot on the pavement: a soft occlusion line */}
      <path d={`M${Pt(P.p(x0, 0, Z_SHOP - 2))}L${Pt(P.p(x1, 0, Z_SHOP - 2))}`} stroke={A.tone("#22180F", Z_SHOP, 0)} strokeWidth={10 * P.r(Z_SHOP)} strokeOpacity={0.3} />
      <AirBox A={A} X0={x0} X1={x1} Y0={-3} Y1={ROAD_Y} Z0={Z_KERB - 16} Z1={Z_KERB} mat={M.granite} uid="sd-kerb" />
      {/* the near ground sinks into the dense low air toward the frame's foot (the people stay the subject) */}
      <defs>
        <linearGradient id="sd-near" gradientUnits="userSpaceOnUse" x1="0" y1={(A.cam.cy + (1380 - 960) / A.k).toFixed(2)} x2="0" y2={(A.cam.cy + 960 / A.k).toFixed(2)}>
          <stop offset="0" stopColor="#22180F" stopOpacity={0} />
          <stop offset="1" stopColor="#22180F" stopOpacity={0.3 * (1 - 0.7 * A.night)} />
        </linearGradient>
      </defs>
      <rect x={cx - 1000} y={A.cam.cy + (1380 - 960) / A.k} width={2000} height={600 / A.k} fill="url(#sd-near)" />
    </g>
  );
};

// ===================================================================================================================
// THE LAMPPOSTS (in front, at the pavement's edge: they slide fastest) and their light at night (a cone from the lamp
// head above the frame, a pool on the pavement)
// ===================================================================================================================
export const Lampposts: React.FC<{ A: CycleWorld }> = ({ A }) => {
  const P = A.P;
  const half = 540 / (A.k * P.r(Z_LAMP)) + 60;
  return (
    <g>
      {LAMPS.filter((X) => Math.abs(X - A.cam.cx) < half).map((X) => (
        <g key={X}>
          <AirShadow A={A} X={X} Z={Z_LAMP} w={34} d={22} uid={`sd-lps${X}`} amt={0.75} />
          <AirCyl A={A} X={X} Z={Z_LAMP} R={7.5} Y0={-1400} Y1={-70} mat={M.iron} uid={`sd-lp${X}`} joints={[-260]} />
          <AirCyl A={A} X={X} Z={Z_LAMP} R={13} Y0={-70} Y1={0} mat={M.iron} uid={`sd-lb${X}`} joints={[-14]} />
        </g>
      ))}
    </g>
  );
};
/** the street lamps that light at night: the front lampposts (Z_LAMP) and the back ones (Z_BACK_LAMP); a lamp's light
 *  is drawn only while its lamp is in view (review 2: no halo without its lamp) */
type Lamp = { X: number; Z: number; head: number };
const allLamps = (): Lamp[] => [...LAMPS.map((X) => ({ X, Z: Z_LAMP, head: -760 })), ...BACK_LAMPS.map((X) => ({ X, Z: Z_BACK_LAMP, head: -660 }))];
const inView = (A: CycleWorld, L: Lamp, pad = 20) => Math.abs(A.P.p(L.X, 0, L.Z)[0] - A.cam.cx) * A.k < 540 + pad;
/** the lamps' pools on the pavement (drawn with the ground, under the people) */
export const LampPools: React.FC<{ A: CycleWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const on = lightsOn(f, 0.4);
  if (on < 0.01) return null;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id="sd-pool">
          <stop offset="0" stopColor={CREAM} stopOpacity={0.42} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={0.16} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      {allLamps()
        .filter((L) => inView(A, L))
        .map((L) => {
          const back = L.Z > 0;
          const Zc = back ? L.Z - 120 : L.Z + 130;
          const c = P.p(L.X, 0, Zc);
          const rx = (back ? 260 : 330) * P.r(Zc);
          const ry = Math.abs(P.p(L.X, 0, Zc - (back ? 170 : 260))[1] - P.p(L.X, 0, Zc + (back ? 110 : 260))[1]) / 2;
          return <ellipse key={`${L.X}|${L.Z}`} cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill="url(#sd-pool)" opacity={on * (back ? 0.85 : 1)} />;
        })}
    </g>
  );
};
/** the lamps' cones in the air, from the lamp head down to its pool; front lamps after everything (light in front of
 *  the people), back lamps behind the people (pass which) */
export const LampCones: React.FC<{ A: CycleWorld; f: number; which: "front" | "back" }> = ({ A, f, which }) => {
  const P = A.P;
  const on = lightsOn(f, 0.4);
  if (on < 0.01) return null;
  const lamps = allLamps().filter((L) => (which === "back" ? L.Z > 0 : L.Z < 0) && inView(A, L));
  if (!lamps.length) return null;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <filter id={`sd-coneblur${which}`} x="-40%" y="-10%" width="180%" height="120%">
          <feGaussianBlur stdDeviation={18 / A.k} />
        </filter>
        <radialGradient id={`sd-lhead${which}`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.9} />
          <stop offset="0.3" stopColor={CREAM} stopOpacity={0.25} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      {lamps.map((L) => {
        const back = L.Z > 0;
        const h = P.p(L.X, L.head + 20, L.Z);
        const zf = back ? L.Z - 120 : L.Z + 160;
        const half = back ? 230 : 320;
        const fl = P.p(L.X - half, 0, zf);
        const fr = P.p(L.X + half, 0, zf);
        const w = 14 * P.r(L.Z);
        const id = `sd-cone${which}${L.X}`;
        return (
          <g key={`${L.X}|${L.Z}`}>
            <defs>
              <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={h[1].toFixed(2)} x2="0" y2={fl[1].toFixed(2)}>
                <stop offset="0" stopColor={CREAM} stopOpacity={0.3} />
                <stop offset="0.55" stopColor={CREAM} stopOpacity={0.12} />
                <stop offset="1" stopColor={CREAM} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <path d={poly([[h[0] - w, h[1]], [h[0] + w, h[1]], fr, fl])} fill={`url(#${id})`} opacity={on} filter={`url(#sd-coneblur${which})`} />
            {back ? <ellipse cx={h[0]} cy={h[1] - 6 * P.r(L.Z)} rx={70 * P.r(L.Z)} ry={70 * P.r(L.Z)} fill={`url(#sd-lhead${which})`} opacity={on} /> : null}
          </g>
        );
      })}
    </g>
  );
};
/** the back lamps' posts and heads (drawn behind the people, after the shop row) */
export const BackLamps: React.FC<{ A: CycleWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const on = lightsOn(f, 0.38);
  return (
    <g>
      {BACK_LAMPS.map((X) => ({ X, Z: Z_BACK_LAMP, head: -660 }))
        .filter((L) => inView(A, L, 60))
        .map((L) => {
          const g = poly([P.p(L.X - 11, L.head + 4, L.Z - 13), P.p(L.X + 11, L.head + 4, L.Z - 13), P.p(L.X + 9, L.head + 38, L.Z - 13), P.p(L.X - 9, L.head + 38, L.Z - 13)]);
          return (
            <g key={L.X}>
              <AirShadow A={A} X={L.X} Z={L.Z} w={22} d={16} uid={`sd-bls${L.X}`} amt={0.6} />
              <AirCyl A={A} X={L.X} Z={L.Z} R={5.5} Y0={L.head + 40} Y1={-40} mat={M.iron} uid={`sd-blp${L.X}`} />
              <AirCyl A={A} X={L.X} Z={L.Z} R={10} Y0={-40} Y1={0} mat={M.iron} uid={`sd-blb${L.X}`} />
              <AirBox A={A} X0={L.X - 14} X1={L.X + 14} Y0={L.head - 8} Y1={L.head + 4} Z0={L.Z - 14} Z1={L.Z + 14} mat={M.iron} uid={`sd-blc${L.X}`} rim={0.5} />
              <path d={g} fill={mixHex(A.tone(M.frame.mid, L.Z, 640), "#F6EBD0", on)} />
              <AirBox A={A} X0={L.X - 10} X1={L.X + 10} Y0={L.head + 38} Y1={L.head + 44} Z0={L.Z - 12} Z1={L.Z + 12} mat={M.iron} uid={`sd-bld${L.X}`} rim={0.3} />
            </g>
          );
        })}
    </g>
  );
};
/** how lit a figure at (X, Z) is by the lamps at night (0..1): the front lamps light the near pavement, the back
 *  lamps the pavement by the shops */
export const lampLit = (X: number, f: number, Z = 0) => {
  const on = lightsOn(f, 0.4);
  if (on < 0.01) return 0;
  const front = Math.max(...LAMPS.map((L) => Math.exp(-Math.pow((X - L) / 220, 2)))) * c01(1 - Z / 350);
  const back = Math.max(...BACK_LAMPS.map((L) => Math.exp(-Math.pow((X - L) / 200, 2)))) * c01((Z - 250) / 300);
  return on * Math.max(front, back);
};

// ===================================================================================================================
// THE TIME-LAPSE SHADOWS (review 2): every standing thing casts a soft shadow on the pavement from the sun of the
// moment (severalDaysPlan sunAt): long to the right in the morning, short toward the shops at noon, long to the left in
// the evening; none at night. One union of shapes (overlapping shadows do not double), clipped to the pavement.
// ===================================================================================================================
export type Caster = { X: number; Z: number; H: number; W: number };
export const CastShadows: React.FC<{ A: CycleWorld; sun: { up: number; len: number; dir: P2 }; casters: Caster[]; bench?: boolean }> = ({ A, sun, casters, bench }) => {
  const P = A.P;
  const a = sun.up * (1 - 0.6 * A.night);
  if (a < 0.01) return null;
  const [dx, dz] = sun.dir;
  const px = -dz;
  const pz = dx;
  let d = "";
  for (const c of casters) {
    const L = c.H * sun.len;
    const w0 = c.W / 2;
    const w1 = c.W * 0.3;
    const q: P2[] = [
      P.p(c.X + px * w0, 0, c.Z + pz * w0),
      P.p(c.X + dx * L + px * w1, 0, c.Z + dz * L + pz * w1),
      P.p(c.X + dx * L * 1.04, 0, c.Z + dz * L * 1.04),
      P.p(c.X + dx * L - px * w1, 0, c.Z + dz * L - pz * w1),
      P.p(c.X - px * w0, 0, c.Z - pz * w0),
      P.p(c.X - dx * w0 * 0.5, 0, c.Z - dz * w0 * 0.5),
    ];
    d += poly(q);
  }
  if (bench) {
    // the bench: its seat's shadow (the seat shifted by its height along the light) and the legs' shadows up to it
    const { x0, x1, z0, z1, h } = BENCH;
    const L = h * sun.len;
    const sh = (X: number, Z: number) => P.p(X + dx * L, 0, Z + dz * L);
    d += poly([sh(x0, z0), sh(x1, z0), sh(x1, z1), sh(x0, z1)]);
    for (const X of [x0 + 26, x1 - 26]) d += poly([P.p(X - 6, 0, (z0 + z1) / 2), P.p(X + 6, 0, (z0 + z1) / 2), sh(X + 6, (z0 + z1) / 2), sh(X - 6, (z0 + z1) / 2)]);
  }
  const cx = A.cam.cx;
  const clip = poly([P.p(cx - 2500, 0, Z_KERB), P.p(cx + 2500, 0, Z_KERB), P.p(cx + 2500, 0, Z_SHOP - 4), P.p(cx - 2500, 0, Z_SHOP - 4)]);
  return (
    <g>
      <defs>
        <clipPath id="sd-shclip">
          <path d={clip} />
        </clipPath>
        <filter id="sd-shblur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={3.2 / A.k} />
        </filter>
      </defs>
      <g clipPath="url(#sd-shclip)">
        <path d={d} fill="#22180F" fillRule="nonzero" opacity={0.3 * a} filter="url(#sd-shblur)" />
      </g>
    </g>
  );
};

// ===================================================================================================================
// THE BENCH: a backless timber seat on two iron frames, facing the street
// ===================================================================================================================
export const Bench: React.FC<{ A: CycleWorld }> = ({ A }) => {
  const { x0, x1, z0, z1, h } = BENCH;
  const legs = [x0 + 26, x1 - 26];
  return (
    <g>
      <AirShadow A={A} X={(x0 + x1) / 2 - 20} Z={(z0 + z1) / 2} w={(x1 - x0) * 0.55} d={60} uid="sd-bns" amt={0.55} />
      {legs.map((X) => (
        <g key={X}>
          <AirBox A={A} X0={X - 5} X1={X + 5} Y0={-h + 6} Y1={0} Z0={z1 - 12} Z1={z1 - 4} mat={M.iron} uid={`sd-bl${X}b`} rim={0.4} />
          <AirBox A={A} X0={X - 5} X1={X + 5} Y0={-h + 6} Y1={-h + 14} Z0={z0 + 4} Z1={z1 - 4} mat={M.iron} uid={`sd-bl${X}t`} rim={0.4} />
          <AirBox A={A} X0={X - 5} X1={X + 5} Y0={-h + 6} Y1={0} Z0={z0 + 4} Z1={z0 + 12} mat={M.iron} uid={`sd-bl${X}f`} rim={0.5} />
        </g>
      ))}
      {[2, 1, 0].map((i) => {
        const za = lerp(z0, z1, i / 3) + 1.5;
        const zb = lerp(z0, z1, (i + 1) / 3) - 1.5;
        return <AirBox key={i} A={A} X0={x0} X1={x1} Y0={-h} Y1={-h + 7} Z0={za} Z1={zb} mat={M.timber} uid={`sd-bs${i}`} />;
      })}
    </g>
  );
};
