// ---------------------------------------------------------------------------
// driveProps: everything that stands on the land of DriveOutOfAustin (robert-johnson-ranch, cut 6), as SVG projected
// through the cut's one camera (driveCamera.ts): Austin's pale blocks, the 1970s sedan, the cattle guard with its
// fence, the farm at the road's end (house with the orange roof and windows, live oak, windmill), the car's dust, the
// place plates. Volumes are small polyhedra lit by the same sun as the ground (form light, a soft core, darker local
// outlines, a cream rim on the top edges), fogged by distance into the same air, the people's gouache texture over
// the car. Far objects are clipped behind the ridges in front of them (a CPU ray along the same heights), so nothing
// shows through a hill.
// ---------------------------------------------------------------------------
import React from "react";
import { interpolate, Easing } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { Paint } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CAR_G, CAR_PL, DIRT_PL, FARM_SCALE, GUARD, H, HWY_PL, U_TURN, W, at, carLen, carU, clamp01, dirtOfU, farmGeo, farmPoint, headingAt, speedAt, sstep, toScreen, type Cam, type V3 } from "./driveCamera";
export { FARM_SCALE, farmPoint };
import { heightOf, SUN, type Heights } from "./driveGround";
import { CITY, CITY_ANGLE, LEG_M } from "./driveRouteData";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400"], subsets: ["latin"] });

export type Mat = { lit: string; mid: string; dark: string };
export const SHADOW = "#22180F";
export const CREAM = "#F3EBDD";
const M = {
  body: { lit: "#8E9B9C", mid: "#68767A", dark: "#363F42" },
  roof: { lit: "#E6DBC3", mid: "#C2B497", dark: "#857A63" },
  glass: { lit: "#86A09B", mid: "#4F6664", dark: "#2B3837" },
  tyre: { lit: "#4A4038", mid: "#332C26", dark: "#211C17" },
  chrome: { lit: "#F3EBDD", mid: "#D9CDB4", dark: "#8E8470" },
  tail: { lit: "#9A5A4C", mid: "#7A463A", dark: "#4A2A22" },
  city: { lit: "#E4DAC6", mid: "#BDB29C", dark: "#7E7564" },
  cityRoof: { lit: "#D7CDB8", mid: "#B4A993", dark: "#7A715F" },
  iron: { lit: "#9AA3A4", mid: "#636B6E", dark: "#30363A" },
  timber: { lit: "#A38059", mid: "#73583B", dark: "#3A2B1D" },
  wall: { lit: "#E8DEC8", mid: "#C9BBA0", dark: "#857965" },
  stone: { lit: "#A39280", mid: "#6F6252", dark: "#3A3128" },
  orange: { lit: "#FFB000", mid: "#D98A0C", dark: "#9A5C07" },
  oak: { lit: "#7C8256", mid: "#565C3B", dark: "#2F3322" },
} satisfies Record<string, Mat>;

// ---- colour ------------------------------------------------------------------------------------------------------
const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c: number[]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
export const mix = (a: string, b: string, t: number) => {
  const A = hx(a);
  const B = hx(b);
  const u = clamp01(t);
  return toHex(A.map((v, i) => v + (B[i] - v) * u));
};
/** the air and the haze of the ground shader, for the overlays */
export type Look = { cam: Cam; airNear: string; airFar: string };
export const hazeOf = (r: number) => {
  const h0 = 0.62 * sstep(1.4, 4.6, r);
  return h0 + (1 - h0) * sstep(4, 13, r);
};
const distOf = (cam: Cam, p: V3) => Math.hypot(p[0] - cam.C[0], p[1] - cam.C[1], p[2] - cam.C[2]);
export const fogC = (L: Look, hex: string, dist: number, orange = false) => {
  const r = dist / L.cam.D;
  const air = mix(L.airNear, L.airFar, sstep(1.4, 5, r));
  return mix(hex, air, (orange ? 0.5 : 1) * hazeOf(r));
};
type Layer = "shadow" | "body";
/** the hazed land around the farm as rendered while it comes out of the air (mean of f258-263) */
const LAND_AT_FARM = "#82795C";
const toneOf = (m: Mat, ndl: number) => (ndl < 0.3 ? mix(m.dark, m.mid, sstep(-0.45, 0.3, ndl)) : mix(m.mid, m.lit, sstep(0.3, 0.92, ndl)));

// ---- a tiny polyhedron painter --------------------------------------------------------------------------------------
type Face = { p: V3[]; m: Mat; orange?: boolean; rim?: boolean; noCull?: boolean; flat?: number; inside?: V3 };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const crs = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dt = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const nrm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const P2 = (q: { x: number; y: number }) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
/** faces painted in the given order (back faces culled); vertex order counter-clockwise seen from outside */
const paintFaces = (L: Look, faces: Face[], key: string, lw = 1) => {
  const cam = L.cam;
  const out: React.ReactNode[] = [];
  faces.forEach((F0, i) => {
    const c: V3 = [0, 0, 0];
    F0.p.forEach((q) => {
      c[0] += q[0] / F0.p.length;
      c[1] += q[1] / F0.p.length;
      c[2] += q[2] / F0.p.length;
    });
    let n = nrm(crs(sub(F0.p[1], F0.p[0]), sub(F0.p[2], F0.p[0])));
    if (F0.inside && dt(n, sub(c, F0.inside)) < 0) n = [-n[0], -n[1], -n[2]];
    if (!F0.noCull && dt(n, sub(c, cam.C)) >= 0) return;
    const sp = F0.p.map((q) => toScreen(cam, q[0], q[1], q[2]));
    if (sp.some((q) => q.z < 1)) return;
    const d = distOf(cam, c);
    const ndl = F0.flat ?? dt(n, SUN);
    const fill = fogC(L, toneOf(F0.m, ndl), d, F0.orange);
    const line = fogC(L, mix(F0.m.dark, SHADOW, 0.35), d, F0.orange);
    const path = `M${sp.map(P2).join("L")}Z`;
    out.push(<path key={`${key}${i}`} d={path} fill={fill} stroke={line} strokeWidth={lw} strokeLinejoin="round" />);
    if (F0.rim && n[1] > 0.5) {
      out.push(<path key={`${key}${i}r`} d={path} fill="none" stroke={CREAM} strokeOpacity={0.5 * (1 - hazeOf(d / cam.D))} strokeWidth={lw * 0.9} strokeLinejoin="round" />);
    }
  });
  return out;
};
/** a box in a local frame: origin o, axes ea (along), eb (left), up; ranges in local units x scale s */
type Frame = { o: V3; ea: V3; eb: V3; up: V3; s: number };
const lp = (F0: Frame, a: number, b: number, y: number): V3 => [
  F0.o[0] + (F0.ea[0] * a + F0.eb[0] * b + F0.up[0] * y) * F0.s,
  F0.o[1] + (F0.ea[1] * a + F0.eb[1] * b + F0.up[1] * y) * F0.s,
  F0.o[2] + (F0.ea[2] * a + F0.eb[2] * b + F0.up[2] * y) * F0.s,
];
/** a (possibly tapered) box: bottom a0..a1 x b0..b1 at y0, top ta0..ta1 x tb0..tb1 at y1 */
const box = (F0: Frame, a0: number, a1: number, b0: number, b1: number, y0: number, y1: number, m: Mat, top?: [number, number, number, number], mats?: Partial<Record<"top" | "front" | "back" | "left" | "right", Mat>>, rim = true): Face[] => {
  const [ta0, ta1, tb0, tb1] = top ?? [a0, a1, b0, b1];
  const B = [lp(F0, a0, b0, y0), lp(F0, a1, b0, y0), lp(F0, a1, b1, y0), lp(F0, a0, b1, y0)];
  const T = [lp(F0, ta0, tb0, y1), lp(F0, ta1, tb0, y1), lp(F0, ta1, tb1, y1), lp(F0, ta0, tb1, y1)];
  // the normals are turned outward by the box's inside point
  const inside = lp(F0, (a0 + a1 + ta0 + ta1) / 4, (b0 + b1 + tb0 + tb1) / 4, (y0 + y1) / 2);
  return [
    { p: [T[0], T[1], T[2], T[3]], m: mats?.top ?? m, rim, inside },
    { p: [B[1], T[1], T[2], B[2]], m: mats?.front ?? m, inside },
    { p: [B[0], B[3], T[3], T[0]], m: mats?.back ?? m, inside },
    { p: [B[3], B[2], T[2], T[3]], m: mats?.left ?? m, inside },
    { p: [B[0], T[0], T[1], B[1]], m: mats?.right ?? m, inside },
  ];
};
/** a ring of points (a disc) in the plane spanned by u, v round c */
const disc = (c: V3, u: V3, v: V3, r: number, n = 12): V3[] =>
  Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return [c[0] + (u[0] * Math.cos(t) + v[0] * Math.sin(t)) * r, c[1] + (u[1] * Math.cos(t) + v[1] * Math.sin(t)) * r, c[2] + (u[2] * Math.cos(t) + v[2] * Math.sin(t)) * r];
  });

// ---- occlusion by the ridges in front ---------------------------------------------------------------------------------
/** the screen y above which a point (X, Y, Z) is seen past the land between it and the camera (H if nothing hides it) */
export const ridgeY = (cam: Cam, H0: Heights | null, X: number, Z: number) => {
  if (!H0) return H;
  let y = H + 100;
  const n = 90;
  for (let i = 1; i < n; i++) {
    const t = 0.03 + (0.95 * i) / n;
    const x = cam.C[0] + (X - cam.C[0]) * t;
    const z = cam.C[2] + (Z - cam.C[2]) * t;
    const s = toScreen(cam, x, heightOf(H0, x, z), z);
    if (s.z > 1) y = Math.min(y, s.y);
  }
  return y;
};
export const Clip: React.FC<{ id: string; y: number; children: React.ReactNode }> = ({ id, y, children }) =>
  y >= H ? (
    <g>{children}</g>
  ) : (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={-200} y={-4000} width={W + 400} height={y + 4000} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );

// ---- a soft shadow on the ground ------------------------------------------------------------------------------------
const groundShadow = (L: Look, pts: V3[], key: string, amt: number, blurPx: number) => {
  const sp = pts.map((q) => toScreen(L.cam, q[0], q[1], q[2]));
  if (sp.some((q) => q.z < 1)) return null;
  const d = distOf(L.cam, pts[0]);
  const a = amt * (1 - hazeOf(d / L.cam.D));
  return (
    <g key={key}>
      <defs>
        <filter id={`${key}b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={blurPx.toFixed(2)} />
        </filter>
      </defs>
      <path d={`M${sp.map(P2).join("L")}Z`} fill={SHADOW} opacity={a} filter={`url(#${key}b)`} />
    </g>
  );
};
/** the shadow's push away from the sun (unit, on the ground) */
const AWAY: V3 = nrm([-SUN[0], 0, -SUN[2]]);

// =====================================================================================================================
// AUSTIN
// =====================================================================================================================
export const City: React.FC<{ L: Look; frame: number }> = ({ L, frame }) => {
  if (frame > 70) return null;
  const cam = L.cam;
  const ang = (CITY_ANGLE * Math.PI) / 180;
  const ea: V3 = [Math.cos(ang), 0, Math.sin(ang)];
  const eb: V3 = [Math.sin(ang), 0, -Math.cos(ang)];
  const items = CITY.map((b, i) => ({ b, i, d: toScreen(cam, b[0], b[5], b[1]).z })).filter((q) => q.d > 1);
  items.sort((p, q) => q.d - p.d);
  const els: React.ReactNode[] = [];
  for (const { b, i } of items) {
    const s = toScreen(cam, b[0], b[5], b[1]);
    if (s.x < -400 || s.x > W + 400 || s.y > H + 500 || s.y < -200) continue;
    const F0: Frame = { o: [b[0], b[5], b[1]], ea, eb, up: [0, 1, 0], s: 1 };
    const w = b[2] / 2;
    const dd = b[3] / 2;
    const bh = 0.55 * b[4];
    els.push(groundShadow(L, [lp(F0, -w, -dd, 0), lp(F0, w, -dd, 0), lp(F0, w, dd, 0), lp(F0, -w, dd, 0)].map((q) => [q[0] + AWAY[0] * bh * 0.6, q[1], q[2] + AWAY[2] * bh * 0.6] as V3), `cs${i}`, 0.3, 5));
    els.push(...paintFaces(L, box(F0, -w, w, -dd, dd, -30, bh, M.city, undefined, { top: M.cityRoof }), `c${i}`, 0.9));
  }
  return <g>{els}</g>;
};

// =====================================================================================================================
// THE CAR: a muted 1970s sedan (slate body, oatmeal vinyl roof, cream chrome), at the symbolic scale
// =====================================================================================================================
export const carState = (frame: number) => {
  const u = carU(frame);
  const L = carLen(frame);
  const p = at(CAR_PL, u);
  const hd = headingAt(CAR_PL, u, 0.3 * L);
  const hF = at(CAR_PL, u + 0.45 * L).h;
  const hB = at(CAR_PL, u - 0.45 * L).h;
  return { u, L, p, hd, slope: (hF - hB) / (0.9 * L) };
};
export const Car: React.FC<{ L: Look; frame: number; uid: string }> = ({ L, frame, uid }) => {
  const cam = L.cam;
  const st = carState(frame);
  const { p, hd } = st;
  const Lc = st.L;
  // the rattle over the cattle guard's pipes (front wheels on f~158-166, rear f~163-171)
  const onPipes = (axle: number) => Math.abs(dirtOfU(st.u + axle * Lc) - GUARD.s) < GUARD.depth / 2;
  const rattle = (onPipes(0.31) || onPipes(-0.31) ? 0.012 * Math.sin(frame * 2.9) : 0) * Lc;
  const ea: V3 = nrm([hd.dx, st.slope, hd.dz]);
  const eb: V3 = [hd.dz, 0, -hd.dx];
  const up = nrm(crs(ea, eb));
  const F0: Frame = { o: [p.x, p.h + rattle, p.z], ea, eb, up, s: Lc };
  const els: React.ReactNode[] = [];
  // the soft shadow, pushed away from the sun
  const sh = 0.09;
  const sp: V3[] = [lp(F0, -0.56, -0.25, 0), lp(F0, 0.56, -0.25, 0), lp(F0, 0.56, 0.25, 0), lp(F0, -0.56, 0.25, 0)].map((q) => [q[0] + AWAY[0] * sh * Lc, q[1], q[2] + AWAY[2] * sh * Lc]);
  const pxPerM = toScreen(cam, p.x, p.h, p.z).s;
  els.push(groundShadow(L, sp, `${uid}sh`, 0.55, Math.max(1.5, 0.05 * Lc * pxPerM)));
  // wheels: discs on both sides; the far ones before the body, the near ones after
  const wheel = (a: number, side: number) => {
    const c = lp(F0, a, side * 0.205, 0.078);
    const u0: V3 = ea;
    const v0: V3 = up;
    const ring = disc(c, u0, v0, 0.078 * Lc, 12);
    const hub = disc(c, u0, v0, 0.034 * Lc, 8);
    const out: Face[] = [
      { p: side > 0 ? ring : [...ring].reverse(), m: M.tyre, noCull: true, flat: 0.1 },
      { p: side > 0 ? hub : [...hub].reverse(), m: M.chrome, noCull: true, flat: 0.5 },
    ];
    return out;
  };
  const leftFacing = dt(eb, sub(cam.C, [p.x, p.h, p.z])) > 0;
  const nearSide = leftFacing ? 1 : -1;
  const farW = [...wheel(0.31, -nearSide), ...wheel(-0.31, -nearSide)];
  const nearW = [...wheel(0.31, nearSide), ...wheel(-0.31, nearSide)];
  const lw = Math.max(0.6, Math.min(1.6, 0.006 * Lc * pxPerM));
  els.push(...paintFaces(L, farW, `${uid}fw`, lw));
  // the body: a long low box, the hood a little lower than the trunk's top
  els.push(...paintFaces(L, box(F0, -0.5, 0.5, -0.2, 0.2, 0.06, 0.2, M.body, [-0.5, 0.5, -0.195, 0.195], undefined), `${uid}b`, lw));
  // bumpers and lights
  els.push(...paintFaces(L, box(F0, 0.5, 0.525, -0.19, 0.19, 0.065, 0.11, M.chrome), `${uid}fb`, lw * 0.7));
  els.push(...paintFaces(L, box(F0, -0.525, -0.5, -0.19, 0.19, 0.065, 0.11, M.chrome), `${uid}rb`, lw * 0.7));
  els.push(...paintFaces(L, box(F0, -0.505, -0.5, 0.12, 0.18, 0.13, 0.17, M.tail), `${uid}tl`, lw * 0.5));
  els.push(...paintFaces(L, box(F0, -0.505, -0.5, -0.18, -0.12, 0.13, 0.17, M.tail), `${uid}tr`, lw * 0.5));
  els.push(...paintFaces(L, box(F0, 0.5, 0.505, 0.11, 0.17, 0.125, 0.165, M.chrome), `${uid}hl`, lw * 0.5));
  els.push(...paintFaces(L, box(F0, 0.5, 0.505, -0.17, -0.11, 0.125, 0.165, M.chrome), `${uid}hr`, lw * 0.5));
  els.push(...paintFaces(L, nearW, `${uid}nw`, lw));
  // the cabin: glass all round, the oatmeal vinyl roof on top
  els.push(...paintFaces(L, box(F0, -0.25, 0.16, -0.185, 0.185, 0.2, 0.335, M.glass, [-0.17, 0.05, -0.16, 0.16], { top: M.roof }), `${uid}c`, lw));
  // a slate belt between the windows (the pillars): a thin band across the cabin's sides at the B-pillar
  els.push(...paintFaces(L, box(F0, -0.06, -0.035, -0.186, 0.186, 0.2, 0.333, M.body, [-0.065, -0.04, -0.161, 0.161]), `${uid}p`, lw * 0.6));
  const uidT = `${uid}tx`;
  const sizePx = Lc * pxPerM;
  return (
    <g>
      <defs>{Paint.folkTexDefs(uidT, Math.max(0.2, sizePx / 600))}</defs>
      <g filter={`url(#${uidT}tx)`}>{els}</g>
    </g>
  );
};

// =====================================================================================================================
// THE CATTLE GUARD: steel pipes across the entrance over a dark pit, two stout posts, barbed wire both ways
// =====================================================================================================================
export const guardGeo = () => {
  const g = at(DIRT_PL, GUARD.s);
  const hd = headingAt(DIRT_PL, GUARD.s, 120);
  const ea: V3 = [hd.dx, 0, hd.dz];
  const eb: V3 = [hd.dz, 0, -hd.dx];
  return { g, ea, eb };
};
type Stick = { a: V3; b: V3; w: number; m: Mat; d: number; rim?: boolean };
export const Guard: React.FC<{ L: Look; H0: Heights | null; frame: number; uid: string; carDepth: number; carFront: React.ReactNode }> = ({ L, H0, uid, carDepth, carFront }) => {
  const cam = L.cam;
  const { g, ea, eb } = guardGeo();
  const S = CAR_G;
  const hAt = (x: number, z: number) => (H0 ? heightOf(H0, x, z) : g.h);
  const P = (a: number, b: number, y: number): V3 => {
    const x = g.x + ea[0] * a + eb[0] * b;
    const z = g.z + ea[2] * a + eb[2] * b;
    return [x, hAt(x, z) + y, z];
  };
  const gs = toScreen(cam, g.x, g.h, g.z);
  if (gs.z < 1) return <g>{carFront}</g>;
  const k = gs.s;
  const els: { d: number; el: React.ReactNode }[] = [];
  const half = GUARD.span / 2;
  const dep = GUARD.depth / 2;
  // the pit
  const pit = [P(-dep, -half, 0), P(dep, -half, 0), P(dep, half, 0), P(-dep, half, 0)].map((q) => toScreen(cam, q[0], q[1], q[2]));
  const dpit = distOf(cam, [g.x, g.h, g.z]);
  els.push({ d: 1e12, el: <path key="pit" d={`M${pit.map(P2).join("L")}Z`} fill={fogC(L, "#2A231B", dpit)} stroke={fogC(L, "#5E554A", dpit)} strokeWidth={0.8} /> });
  // the pipes (7) across the road
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = -dep * 0.86 + (1.72 * dep * i) / (n - 1);
    const A = toScreen(cam, ...P(a, -half * 1.04, 0.012 * S));
    const B = toScreen(cam, ...P(a, half * 1.04, 0.012 * S));
    const w = Math.max(1.1, 0.026 * S * k);
    els.push({
      d: 1e12 - 1,
      el: (
        <g key={`pp${i}`}>
          <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={fogC(L, M.iron.dark, dpit)} strokeWidth={w * 1.25} strokeLinecap="round" />
          <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={fogC(L, M.iron.mid, dpit)} strokeWidth={w} strokeLinecap="round" />
          <line x1={A.x} y1={A.y - w * 0.28} x2={B.x} y2={B.y - w * 0.28} stroke={CREAM} strokeOpacity={0.55 * (1 - hazeOf(dpit / cam.D))} strokeWidth={w * 0.32} strokeLinecap="round" />
        </g>
      ),
    });
  }
  // the fence: posts along a line parallel to the highway on its south side, through the guard's posts
  const sticks: Stick[] = [];
  const post = (x: number, z: number, ht: number, w: number, m: Mat) => {
    const y0 = hAt(x, z);
    sticks.push({ a: [x, y0, z], b: [x, y0 + ht, z], w, m, d: toScreen(cam, x, y0, z).z, rim: true });
  };
  const gp = [P(0, -half - GUARD.post, 0), P(0, half + GUARD.post, 0)];
  gp.forEach((q) => post(q[0], q[2], 0.42 * S, 0.07 * S, M.timber));
  // the fence line follows the highway at the guard's offset; gap round the entrance
  const fenceAt = (s: number) => {
    const h = at(HWY_PL, s);
    const hdd = headingAt(HWY_PL, s, 200);
    const left = [hdd.dz, -hdd.dx];
    return { x: h.x + left[0] * GUARD.fenceOff, z: h.z + left[1] * GUARD.fenceOff };
  };
  const spacing = 0.5 * S;
  const wires: { pts: V3[]; d: number }[] = [];
  for (const dir of [-1, 1]) {
    const pts: V3[][] = [[], [], []];
    const start = half + GUARD.post;
    for (let i = 0; i <= 18; i++) {
      const s = LEG_M + dir * (start + i * spacing);
      const f = fenceAt(s);
      if (i > 0) post(f.x, f.z, 0.3 * S, 0.035 * S, M.timber);
      const y0 = hAt(f.x, f.z);
      [0.1, 0.18, 0.26].forEach((hh, k) => pts[k].push([f.x, y0 + hh * S, f.z]));
    }
    pts.forEach((p) => wires.push({ pts: p, d: toScreen(cam, p[3][0], p[3][1], p[3][2]).z }));
  }
  wires.forEach((wv, i) => {
    const sp = wv.pts.map((q) => toScreen(cam, q[0], q[1], q[2])).filter((q) => q.z > 1);
    if (sp.length < 2) return;
    els.push({
      d: wv.d,
      el: <polyline key={`w${i}`} points={sp.map(P2).join(" ")} fill="none" stroke={fogC(L, "#4E5254", distOf(cam, wv.pts[3]))} strokeWidth={Math.max(0.7, 0.006 * S * k)} strokeOpacity={0.9} />,
    });
  });
  sticks.forEach((s, i) => {
    const A = toScreen(cam, ...s.a);
    const B = toScreen(cam, ...s.b);
    if (A.z < 1) return;
    const w = Math.max(1, s.w * A.s);
    const d = distOf(cam, s.a);
    els.push({
      d: s.d,
      el: (
        <g key={`s${i}`}>
          <line x1={A.x + w * 0.8} y1={A.y + w * 0.3} x2={A.x + w * 0.8 + (B.y - A.y) * -0.35} y2={A.y + w * 0.3 + (A.y - B.y) * -0.12} stroke={SHADOW} strokeOpacity={0.25 * (1 - hazeOf(d / cam.D))} strokeWidth={w} strokeLinecap="round" />
          <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={fogC(L, s.m.mid, d)} strokeWidth={w} strokeLinecap="butt" />
          <line x1={A.x + w * 0.22} y1={A.y} x2={B.x + w * 0.22} y2={B.y} stroke={fogC(L, s.m.dark, d)} strokeWidth={w * 0.45} strokeLinecap="butt" />
          <line x1={A.x - w * 0.3} y1={A.y} x2={B.x - w * 0.3} y2={B.y} stroke={CREAM} strokeOpacity={0.4 * (1 - hazeOf(d / cam.D))} strokeWidth={w * 0.22} />
        </g>
      ),
    });
  });
  els.push({ d: carDepth, el: <g key="car">{carFront}</g> });
  els.sort((a, b) => b.d - a.d);
  return <g>{els.map((e) => e.el)}</g>;
};

// =====================================================================================================================
// THE FARM at the road's end: a one-storey Hill Country farmhouse (whitewashed walls, a gabled roof that is the cut's
// one orange accent with a cream rim on its lit slope, a porch along the front, a stone chimney at one gable, two
// warm windows), a live oak as a dark rounded volume, a windmill (lattice tower, the wheel turning slowly). One frozen
// symbolic scale (FARM_SCALE m per house-unit, driveCamera.ts), so the house dominates the car that parks in its yard.
// =====================================================================================================================
/** the house's long (porch) side faces this compass azimuth: toward the end camera's left, so the high wide sees the
 *  porch side, both roof slopes over the ridge (the far one in the sun) and the east gable with its chimney */
const HOUSE_FRONT_AZ = 340;
const houseFrame = (x: number, y: number, z: number, S: number): Frame => {
  const t = (HOUSE_FRONT_AZ * Math.PI) / 180;
  const nf: V3 = [Math.sin(t), 0, -Math.cos(t)]; // the front's outward normal
  return { o: [x, y, z], ea: [-nf[2], 0, nf[0]], eb: [-nf[0], 0, -nf[2]], up: [0, 1, 0], s: S };
};
const WALL: Mat = { lit: "#F4EDDD", mid: "#E0D5BE", dark: "#BDB29C" };
const GLOW: Mat = { lit: "#FFC233", mid: "#FFB000", dark: "#E39A12" };
export const Farm: React.FC<{ L: Look; H0: Heights | null; frame: number; uid: string }> = ({ L, H0, frame, uid }) => {
  const cam = L.cam;
  const { e } = farmGeo();
  const S = FARM_SCALE;
  const dE = distOf(cam, [e.x, e.h, e.z]);
  // the farm stays in the air until the whole set is inside the frame, then comes out of it (r = 1.25 -> 1.14, f265-271)
  const veil = sstep(1.14, 1.25, dE / cam.D);
  if (veil > 0.995) return null;
  const hAt = (x: number, z: number) => (H0 ? heightOf(H0, x, z) : e.h);
  const hc = farmPoint(1.0, 0.0);
  const hy = hAt(hc.x, hc.z);
  const F0 = houseFrame(hc.x, hy, hc.z, S);
  // local: a along the front (the ridge), b depth (+b to the back), y up
  const wv = 0.5;
  const dv = 0.28;
  const wallH = 0.26;
  const ridge = wallH + 0.24;
  const ov = 0.06;
  const hin = lp(F0, 0, 0, wallH * 0.5);
  const kpx = toScreen(cam, hc.x, hy, hc.z).s;
  const lw = Math.max(0.8, Math.min(1.8, 0.006 * S * kpx));
  const walls = box(F0, -wv, wv, -dv, dv, -0.04, wallH, WALL, undefined, undefined, false).slice(1);
  // the gable triangles (walls) and the two roof slopes with eaves and rake overhangs
  const gab = (a: number): Face => ({ p: [lp(F0, a, -dv, wallH), lp(F0, a, dv, wallH), lp(F0, a, 0, ridge - 0.02)], m: WALL, inside: hin });
  const eaveY = wallH - ov * ((ridge - wallH) / dv);
  const slope = (side: number): Face => ({
    p: [lp(F0, -wv - ov, side * (dv + ov), eaveY), lp(F0, wv + ov, side * (dv + ov), eaveY), lp(F0, wv + ov, 0, ridge), lp(F0, -wv - ov, 0, ridge)],
    m: M.orange,
    orange: true,
    inside: hin,
  });
  const roof = [slope(-1), slope(1)];
  // windows: two on the east gable (+a), two on the front between the porch posts; a dark door
  const winA = (side: number, b0: number, b1: number, y0: number, y1: number): Face => ({
    p: [lp(F0, side * (wv + 0.003), b0, y0), lp(F0, side * (wv + 0.003), b1, y0), lp(F0, side * (wv + 0.003), b1, y1), lp(F0, side * (wv + 0.003), b0, y1)],
    m: GLOW,
    orange: true,
    flat: 0.8,
    inside: hin,
  });
  const winB = (a0: number, a1: number, y0: number, y1: number, m: Mat, glow: boolean): Face => ({
    p: [lp(F0, a0, -dv - 0.003, y0), lp(F0, a1, -dv - 0.003, y0), lp(F0, a1, -dv - 0.003, y1), lp(F0, a0, -dv - 0.003, y1)],
    m,
    orange: glow,
    flat: 0.8,
    inside: hin,
  });
  const openings = [winA(1, -0.17, -0.06, 0.08, 0.19), winA(1, 0.06, 0.17, 0.08, 0.19), winB(-0.36, -0.24, 0.07, 0.18, GLOW, true), winB(0.24, 0.36, 0.07, 0.18, GLOW, true), winB(-0.05, 0.05, -0.02, 0.17, M.timber, false)];
  // the porch: a shallow roof on posts along the middle of the front
  const pa = 0.4;
  const pd = 0.14;
  const porchRoof: Face = { p: [lp(F0, -pa, -dv - pd, wallH * 0.62), lp(F0, pa, -dv - pd, wallH * 0.62), lp(F0, pa, -dv, wallH * 0.86), lp(F0, -pa, -dv, wallH * 0.86)], m: M.roof, rim: true, noCull: true, inside: lp(F0, 0, -dv - pd / 2, 0) };
  // the stone chimney rising through the east gable's slope
  const chim = box(F0, wv - 0.1, wv - 0.02, 0.04, 0.13, 0.0, ridge + 0.06, { lit: "#B8A893", mid: "#8C7D69", dark: "#5A4E40" });
  // contact shadow of the house, pushed away from the sun
  const shp = [lp(F0, -wv - 0.06, -dv - pd - 0.02, 0), lp(F0, wv + 0.06, -dv - pd - 0.02, 0), lp(F0, wv + 0.06, dv + 0.06, 0), lp(F0, -wv - 0.06, dv + 0.06, 0)].map((q) => [q[0] + AWAY[0] * 0.2 * S, q[1], q[2] + AWAY[2] * 0.2 * S] as V3);
  const els: React.ReactNode[] = [];
  const ground: React.ReactNode[] = [];
  // the yard: trodden caliche from the road's end to the porch
  {
    const pts: V3[] = [];
    for (let i = 0; i < 28; i++) {
      const t = (i / 28) * Math.PI * 2;
      const q = farmPoint(0.45 + 0.5 * Math.cos(t), 0.55 * Math.sin(t) * (0.8 + 0.2 * Math.cos(t)));
      pts.push([q.x, hAt(q.x, q.z), q.z]);
    }
    const sp = pts.map((q) => toScreen(cam, q[0], q[1], q[2]));
    if (sp.every((q) => q.z > 1)) {
      ground.push(
        <g key="yard">
          <defs>
            <filter id={`${uid}yb`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={Math.max(1.5, 0.05 * S * kpx).toFixed(2)} />
            </filter>
          </defs>
          <path d={`M${sp.map(P2).join("L")}Z`} fill={fogC(L, "#CDBF9C", dE)} opacity={0.8} filter={`url(#${uid}yb)`} />
        </g>,
      );
    }
  }
  ground.push(groundShadow(L, shp, `${uid}hs`, 0.55, Math.max(2, 0.05 * S * kpx)));
  const oak = farmPoint(1.35, 1.15);
  const mill = farmPoint(0.35, -1.35);
  ground.push(<Oak key="oaks" L={L} x={oak.x} z={oak.z} y={hAt(oak.x, oak.z)} S={S} layer="shadow" />);
  ground.push(<Windmill key="mills" L={L} x={mill.x} z={mill.z} y={hAt(mill.x, mill.z)} S={S} frame={frame} layer="shadow" />);
  // the roof: a darker ridge line, a cream rim along the eave and ridge of the sunlit slope
  const ridgeA = toScreen(cam, ...lp(F0, -wv - ov, 0, ridge));
  const ridgeB = toScreen(cam, ...lp(F0, wv + ov, 0, ridge));
  const vis = 1 - hazeOf(dE / cam.D);
  const rims: React.ReactNode[] = [];
  roof.forEach((fc, i) => {
    const c: V3 = [(fc.p[0][0] + fc.p[2][0]) / 2, (fc.p[0][1] + fc.p[2][1]) / 2, (fc.p[0][2] + fc.p[2][2]) / 2];
    let n = nrm(crs(sub(fc.p[1], fc.p[0]), sub(fc.p[2], fc.p[0])));
    if (dt(n, sub(c, hin)) < 0) n = [-n[0], -n[1], -n[2]];
    if (dt(n, sub(c, cam.C)) >= 0 || dt(n, SUN) < 0.45) return;
    const q = fc.p.map((v) => toScreen(cam, v[0], v[1], v[2]));
    rims.push(<polyline key={`rim${i}`} points={[q[0], q[1], q[2], q[3], q[0]].map(P2).join(" ")} fill="none" stroke={CREAM} strokeOpacity={0.7 * vis} strokeWidth={lw * 1.1} strokeLinejoin="round" />);
  });
  const houseEl = (
    <g key="house">
      {paintFaces(L, walls, `${uid}h`, lw)}
      {paintFaces(L, [gab(-wv), gab(wv)], `${uid}g`, lw)}
      {paintFaces(L, openings, `${uid}w`, lw * 0.6)}
      {[-0.36, -0.12, 0.12, 0.36].map((a, i) => {
        const A = toScreen(cam, ...lp(F0, a, -dv - pd + 0.01, 0));
        const B = toScreen(cam, ...lp(F0, a, -dv - pd + 0.01, wallH * 0.62));
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={fogC(L, M.timber.mid, dE)} strokeWidth={Math.max(1, 0.014 * S * kpx)} />;
      })}
      {paintFaces(L, [porchRoof], `${uid}p`, lw)}
      {paintFaces(L, roof, `${uid}r`, lw)}
      <line x1={ridgeA.x} y1={ridgeA.y} x2={ridgeB.x} y2={ridgeB.y} stroke={fogC(L, M.orange.dark, dE, true)} strokeWidth={lw * 1.2} strokeLinecap="round" />
      {rims}
      {paintFaces(L, chim, `${uid}c`, lw)}
    </g>
  );
  const parts = [
    { d: toScreen(cam, oak.x, 0, oak.z).z, el: <Oak key="oak" L={L} x={oak.x} z={oak.z} y={hAt(oak.x, oak.z)} S={S} layer="body" /> },
    { d: toScreen(cam, mill.x, 0, mill.z).z, el: <Windmill key="mill" L={L} x={mill.x} z={mill.z} y={hAt(mill.x, mill.z)} S={S} frame={frame} layer="body" /> },
    { d: toScreen(cam, hc.x, 0, hc.z).z, el: houseEl },
  ].sort((a, b) => b.d - a.d);
  els.push(...parts.map((p) => p.el));
  // solids never fade by alpha: they stay opaque and the air hides them, their colour mixed by the veil toward the
  // colour the hazed land has around the farm while it comes out (the rendered ground's mean there, f258-263; the
  // shader's air colour itself is the sky's teal and would cut a silhouette); a slight softening while deep in it.
  // Only the ground marks (yard, shadows) fade with the veil.
  const air = hx(LAND_AT_FARM).map((v) => v / 255);
  const k = 1 - veil;
  const cm = `${k} 0 0 0 ${veil * air[0]}  0 ${k} 0 0 ${veil * air[1]}  0 0 ${k} 0 ${veil * air[2]}  0 0 0 1 0`;
  return (
    <g>
      <g opacity={k}>{ground}</g>
      <defs>
        <filter id={`${uid}air`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={cm} result="c" />
          <feGaussianBlur in="c" stdDeviation={(3 * veil * veil).toFixed(2)} />
        </filter>
      </defs>
      <g filter={veil > 0.001 ? `url(#${uid}air)` : undefined}>{els}</g>
    </g>
  );
};
/** a live oak: a broad dark crown as one rounded volume (shade below, a lit cap toward the sun, a cream rim), a short trunk */
const Oak: React.FC<{ L: Look; x: number; z: number; y: number; S: number; layer: Layer; fade?: number }> = ({ L, x, z, y, S, layer, fade = 1 }) => {
  const cam = L.cam;
  const base = toScreen(cam, x, y, z);
  if (base.z < 1) return null;
  const d = distOf(cam, [x, y, z]);
  const vis = 1 - hazeOf(d / cam.D);
  const k = base.s * S;
  const ctr = toScreen(cam, x, y + 0.36 * S, z);
  const rx = 0.42 * k;
  const ry = 0.3 * k;
  const blobs: [number, number, number][] = [
    [-0.55, 0.05, 0.55],
    [0.55, 0.08, 0.55],
    [-0.15, -0.3, 0.6],
    [0.25, -0.25, 0.55],
    [0, 0.1, 0.7],
  ];
  const outline = blobs.map(([bx, by, br], i) => <ellipse key={i} cx={ctr.x + bx * rx} cy={ctr.y + by * ry} rx={br * rx} ry={br * ry * 1.1} />);
  const trunkW = Math.max(1.5, 0.05 * k);
  if (layer === "shadow") return <ellipse cx={base.x + 0.12 * k} cy={base.y + 0.02 * k} rx={0.55 * k} ry={0.2 * k} fill={SHADOW} opacity={0.4 * vis * fade} />;
  return (
    <g>
      <path d={`M${base.x - trunkW},${base.y} L${base.x - trunkW * 0.5},${ctr.y} L${base.x + trunkW * 0.5},${ctr.y} L${base.x + trunkW},${base.y}Z`} fill={fogC(L, "#3A2B1D", d)} />
      <g fill={fogC(L, "#2E3322", d)} stroke={fogC(L, "#1E2216", d)} strokeWidth={Math.max(0.8, 0.01 * k)}>
        {outline}
      </g>
      <g fill={fogC(L, "#2E3322", d)}>{outline}</g>
      <ellipse cx={ctr.x - 0.25 * rx} cy={ctr.y - 0.32 * ry} rx={0.62 * rx} ry={0.45 * ry} fill={fogC(L, "#4C5536", d)} opacity={0.85} />
      <ellipse cx={ctr.x - 0.32 * rx} cy={ctr.y - 0.42 * ry} rx={0.32 * rx} ry={0.22 * ry} fill={fogC(L, "#66704A", d)} opacity={0.8} />
      <ellipse cx={ctr.x + 0.3 * rx} cy={ctr.y + 0.35 * ry} rx={0.55 * rx} ry={0.3 * ry} fill={fogC(L, "#1B1F14", d)} opacity={0.45} />
      <path d={`M${ctr.x - 0.9 * rx},${ctr.y - 0.2 * ry} Q${ctr.x - 0.6 * rx},${ctr.y - 1.05 * ry} ${ctr.x + 0.1 * rx},${ctr.y - 0.98 * ry}`} fill="none" stroke={CREAM} strokeOpacity={0.4 * vis} strokeWidth={Math.max(0.8, 0.012 * k)} strokeLinecap="round" />
    </g>
  );
};
/** the windmill: a tapering four-leg lattice tower, a turning wheel of sheet-iron blades with a cream rim, a tail vane */
const Windmill: React.FC<{ L: Look; x: number; z: number; y: number; S: number; frame: number; layer: Layer; fade?: number }> = ({ L, x, z, y, S, frame, layer, fade = 1 }) => {
  const cam = L.cam;
  const d = distOf(cam, [x, y, z]);
  const vis = 1 - hazeOf(d / cam.D);
  const Ht = 0.95 * S;
  const b0 = 0.1 * S;
  const t0 = 0.02 * S;
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const legs: [V3, V3][] = corners.map(([sx, sz]) => [
    [x + sx * b0, y, z + sz * b0],
    [x + sx * t0, y + Ht, z + sz * t0],
  ]);
  const base = toScreen(cam, x, y, z);
  const k = base.s;
  const w = Math.max(1.6, 0.016 * S * k);
  const col = fogC(L, "#5A6264", d);
  const at3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const lines: React.ReactNode[] = [];
  legs.forEach(([a, b], i) => {
    const A = toScreen(cam, ...a);
    const B = toScreen(cam, ...b);
    lines.push(<line key={`l${i}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col} strokeWidth={w} strokeLinecap="round" />);
  });
  // girts and X braces between the levels
  const lv = [0, 0.28, 0.52, 0.74, 0.9];
  lv.forEach((t, j) => {
    const ring = legs.map(([a, b]) => toScreen(cam, ...at3(a, b, t)));
    lines.push(<path key={`r${j}`} d={`M${ring.map(P2).join("L")}Z`} fill="none" stroke={col} strokeWidth={w * 0.55} />);
    if (j < lv.length - 1) {
      const t2 = lv[j + 1];
      legs.forEach(([a, b], i) => {
        const [a2, b2] = legs[(i + 1) % 4];
        const P = toScreen(cam, ...at3(a, b, t));
        const Q = toScreen(cam, ...at3(a2, b2, t2));
        lines.push(<line key={`x${j}${i}`} x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke={col} strokeWidth={w * 0.4} />);
      });
    }
  });
  // the wheel faces the wind (from the south-east), turning slowly
  const hub: V3 = [x, y + Ht + 0.02 * S, z];
  const wy = (55 * Math.PI) / 180;
  const nW: V3 = [Math.sin(wy), 0, -Math.cos(wy)];
  const u0: V3 = [-nW[2], 0, nW[0]];
  const v0: V3 = [0, 1, 0];
  const R = 0.22 * S;
  const spin = frame * 0.05;
  const H0s = toScreen(cam, ...hub);
  const pt = (tt: number, rr: number) => toScreen(cam, hub[0] + (u0[0] * Math.cos(tt) + v0[0] * Math.sin(tt)) * rr, hub[1] + v0[1] * Math.sin(tt) * rr, hub[2] + (u0[2] * Math.cos(tt) + v0[2] * Math.sin(tt)) * rr);
  const blades: React.ReactNode[] = [];
  const nb = 16;
  for (let i = 0; i < nb; i++) {
    const t = spin + (i / nb) * Math.PI * 2;
    const t2 = t + 0.2;
    const q = [pt(t, R * 0.3), pt(t, R), pt(t2, R), pt(t2, R * 0.3)];
    blades.push(<path key={i} d={`M${q.map(P2).join("L")}Z`} fill={fogC(L, i % 2 ? "#B9BDB4" : "#9AA19C", d)} stroke={fogC(L, "#3B4244", d)} strokeWidth={w * 0.35} />);
  }
  const rimPts = Array.from({ length: 33 }, (_, i) => pt((i / 32) * Math.PI * 2, R));
  const tailA = toScreen(cam, hub[0] - nW[0] * 0.04 * S, hub[1], hub[2] - nW[2] * 0.04 * S);
  const tailB = toScreen(cam, hub[0] - nW[0] * 0.36 * S, hub[1] + 0.02 * S, hub[2] - nW[2] * 0.36 * S);
  const tailC = toScreen(cam, hub[0] - nW[0] * 0.36 * S, hub[1] + 0.1 * S, hub[2] - nW[2] * 0.36 * S);
  const tailD = toScreen(cam, hub[0] - nW[0] * 0.24 * S, hub[1] + 0.02 * S, hub[2] - nW[2] * 0.24 * S);
  if (layer === "shadow") return <ellipse cx={base.x + 0.1 * S * k} cy={base.y} rx={0.2 * S * k} ry={0.07 * S * k} fill={SHADOW} opacity={0.3 * vis * fade} />;
  return (
    <g>
      {lines}
      <line x1={tailA.x} y1={tailA.y} x2={tailB.x} y2={tailB.y} stroke={col} strokeWidth={w * 1.2} />
      <path d={`M${P2(tailD)}L${P2(tailB)}L${P2(tailC)}Z`} fill={fogC(L, "#B9BDB4", d)} stroke={col} strokeWidth={w * 0.4} />
      {blades}
      <polyline points={rimPts.map(P2).join(" ")} fill="none" stroke={CREAM} strokeOpacity={0.75 * vis} strokeWidth={w * 0.7} />
      <circle cx={H0s.x} cy={H0s.y} r={Math.max(1.2, 0.03 * S * k)} fill={fogC(L, "#2B3133", d)} />
    </g>
  );
};

// =====================================================================================================================
// DUST behind the car on the dirt road: puffs left at its tail, growing and thinning; they settle after it stops
// =====================================================================================================================
export const Dust: React.FC<{ L: Look; frame: number }> = ({ L, frame }) => {
  const cam = L.cam;
  const els: React.ReactNode[] = [];
  for (let f0 = 150; f0 <= Math.min(frame, 306); f0 += 2) {
    const age = frame - f0;
    if (age > 46) continue;
    const st = carState(f0);
    if (st.u < U_TURN + 0.6 * CAR_G) continue;
    const v = speedAt(f0) / st.L;
    const stopPuff = f0 >= 300 ? 0.8 : 0;
    const strength = Math.min(1, v * 3.2) + stopPuff;
    if (strength < 0.05) continue;
    const jit = Math.sin(f0 * 12.9898) * 0.12;
    const x = st.p.x - st.hd.dx * 0.55 * st.L + st.hd.dz * jit * st.L;
    const z = st.p.z - st.hd.dz * 0.55 * st.L - st.hd.dx * jit * st.L;
    const y = st.p.h + (0.08 + 0.1 * Math.sqrt(age / 30)) * st.L;
    const s = toScreen(cam, x, y, z);
    if (s.z < 1) continue;
    const r = (0.16 + 0.42 * Math.sqrt(age / 30)) * st.L * s.s;
    const a = 0.32 * strength * Math.exp(-age / 16) * sstep(0, 3, age + 1);
    if (a < 0.01) continue;
    els.push(<circle key={f0} cx={s.x} cy={s.y} r={r} fill={fogC(L, "#D6CBAE", distOf(cam, [x, y, z]))} opacity={a} filter="url(#dustblur)" />);
  }
  return (
    <g>
      <defs>
        <filter id="dustblur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {els}
    </g>
  );
};

// =====================================================================================================================
// PLATES: cream type on a soft plate of the air's shadow, anchored in the world; in by sliding up while fading in,
// out by draining into the air
// =====================================================================================================================
export const Plate: React.FC<{ L: Look; X: number; Y: number; Z: number; text: string; frame: number; land: number; out?: number; outDur?: number; size?: number; dy?: number; uid: string }> = ({ L, X, Y, Z, text, frame, land, out, outDur = 10, size = 72, dy = 0, uid }) => {
  // the fade starts on the heard word (land - 5) and is full on land
  const f0 = land - 5;
  if (frame < f0) return null;
  const s = toScreen(L.cam, X, Y, Z);
  if (s.z < 1) return null;
  const u = interpolate(frame, [f0, land], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const op = interpolate(frame, [f0, land], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (out === undefined ? 1 : interpolate(frame, [out, out + outDur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  if (op <= 0.002) return null;
  const lift = 0.45 * size * (1 - u);
  const runs = text.split(/(\d+)/).filter((q) => q.length);
  const wEst = runs.reduce((acc, r) => acc + (/^\d+$/.test(r) ? 0.62 * size * 0.92 * r.length : 0.72 * size * r.length), 0);
  const y = s.y + dy + lift;
  return (
    <g opacity={op}>
      <defs>
        <radialGradient id={`${uid}pl`}>
          <stop offset="0" stopColor={SHADOW} stopOpacity={0.62} />
          <stop offset="0.55" stopColor={SHADOW} stopOpacity={0.42} />
          <stop offset="1" stopColor={SHADOW} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={s.x} cy={y - size * 0.33} rx={wEst * 0.5 + size * 0.75} ry={size * 0.78} fill={`url(#${uid}pl)`} />
      <text
        x={s.x}
        y={y}
        textAnchor="middle"
        fill={CREAM}
        stroke={SHADOW}
        strokeOpacity={0.85}
        strokeWidth={size * 0.13}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: size, letterSpacing: `${0.08 * size}px` }}
      >
        {runs.map((r, i) =>
          /^\d+$/.test(r) ? (
            <tspan key={i} style={{ fontFamily: caslon, fontVariantNumeric: "lining-nums", letterSpacing: `${0.03 * size}px` }} fontSize={size * 0.92}>
              {r}
            </tspan>
          ) : (
            <tspan key={i}>{r}</tspan>
          ),
        )}
      </text>
    </g>
  );
};
