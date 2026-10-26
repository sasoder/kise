// ---------------------------------------------------------------------------
// PropertyAndContracts (kyle-rome-industrial, cut 86). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 259 frames.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d. World, camera and timelines: ./propertyContractsPlan.ts.
//
// CHECK LINE: "Rome had working institutions: land surveyed and marked so you knew what was yours, and deals written
// down, sealed by witnesses and enforced."
//
// THE LINE: "[where you] take trade really far. They have good institutions. In terms of, you know, there's the strong
// property rights. There's relatively reliable contract enforcement. [They have…]"
// WORD -> FRAME (Whisper, heard ~6 f later): take 5 · trade 10 · really 23 · far 32 · They 47 · have 53 · good 56 ·
// institutions 61 · In 78 · terms 94 · of 102 · you 112 · know 117 · there's 121 · the 132 · strong 135 ·
// property 142 · rights 152 · There's 163 · relatively 173 · reliable 187 · contract 214 · enforcement 229 (to 246)
// DURATION: the slot 86.720 -> 95.362 s = 8.642 s x 29.97 = 259 frames (f0..f258).
//
// THE MOTION: one continuous crane DOWN. f0 high over a Roman countryside surveyed into a square grid (roads, low
// dry-stone walls, stubble / wheat / furrows / olive groves in different plots, a boundary stone at every plot
// corner); in the middle, at one plot's corner by the crossroads, the surveyor stands at his groma beside a boundary
// stone lying by its hole, two men with it; the owner's farmhouse and table close by, the magistrate's tribunal (two
// lictors) beyond. The camera sinks and pushes in on that corner: the men raise the stone (one lifts the top end, one
// hauls on a rope) upright by f138; it drops into its hole, settled at f150 ("property rights"). On "There's
// relatively reliable" the crane keeps sinking and slides left (one bell, f118-234) to the owner's table: the owner
// (Dominus) and the buyer (Freeman) behind a pair of wax tablets, a witness between them. The buyer turns the written
// far leaf over toward us (upright, writing to camera f197; lands f204); the owner, the witness and the buyer press
// their seals into the wax along the cord (contacts f211 / f219 / f227, "contract"); the magistrate on his tribunal in
// the haze behind lifts his open hand ("enforcement", f228-240); the two men shake hands over the sealed tablets
// (meet f247) and the picture lives to the last frame.
// CAUSE BEFORE EFFECT: the stone's top end rides the lifter's hands and the taut rope from f104; it touches the
// hole's floor at f150 (the lifter lets go f151; the hauler drops the rope f146, its end falling to his feet). The far
// leaf rises in the buyer's hand (grip f187), falls on its own after upright (f197) and lands f204. Each seal disc
// appears on the frame its owner's knuckle touches the wax (f211, f219, f227).
// Orange = technology and ideas (the clip's rule): none here (institutions are not technology). People, stone,
// wax and wood in muted earthy local colours.
//
// DEPTH: a real eye on the depth kit (propertyContractsPlan: kitCamOf): 16 m up and 31 m from the stone at f0, 5 m up
// and 7 m away at f145, 2.3 m up and 3.5 m from the table group at the end; F 1250 -> 1350 px. Fog by the eye's
// distance with fogNear / fogVis scaled to the eye's height (the subject stays clear, the far land takes the air).
//
// SOURCES (illustrative; nothing on screen): Roman centuriation, the agrimensores and the groma (Hyginus Gromaticus,
// Constitutio limitum; the Orange cadastre, Arausio, AD 77), squares of 20 actus (~710 m) bounded by roads and
// boundary stones (termini, carved on top with the decussis); written contracts on wax tablets, tied and sealed along
// the binding by witnesses (the Murecine archive of the Sulpicii, Puteoli, AD 26-61; the receipts of L. Caecilius
// Iucundus, Pompeii); the praetor's tribunal and curule chair for hearing disputes.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AIR,
  AIR_SCENE_EYE,
  AirBox,
  AirShadow,
  AirStage,
  MAT,
  RomeFolk,
  WorldSvg,
  c01,
  lerp,
  lineOf,
  makeAirView,
  mixHex,
  perspective,
  rgbHex,
  swayCam,
  type AirWorld,
  type Cam,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  CART,
  COINS,
  COIN_FLIGHT,
  FARMER,
  MERCHANT,
  PORTER,
  ROAD_GOODS,
  DOM,
  DURATION as PLAN_DURATION,
  FOLD_GRIP,
  FOLD_LAND,
  FOLD_UP,
  FPS as PLAN_FPS,
  FRE,
  GRIP_F,
  GROMA,
  HOLE,
  HOUSE,
  MAG_A,
  MAG_B,
  PIVOT,
  PITCH,
  RAISE_A,
  RAISE_B,
  ROAD_HW,
  SEALS,
  SET_F,
  SHAKE_A,
  SHAKE_MEET,
  STONE,
  STYLUS_DOWN,
  SURVEYOR,
  TAB,
  TABLE,
  TRIBUNAL,
  U,
  WALL_H,
  WALL_HW,
  WIT,
  witZ,
  WRITE_END,
  XB,
  YARD_X1,
  ZB,
  eyeAt,
  keptAt,
  foldAngle,
  hashIJ,
  kitCamOf,
  m,
  plotKind,
  plotOf,
  pressAt,
  rowsAlongZ,
  span,
  stoneSink,
  stoneTheta,
  xIsRoad,
  zIsRoad,
  type Eye,
  type PlotKind,
} from "./propertyContractsPlan";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
type V3 = [number, number, number];
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** toward the light: upper left, a little toward the camera */
const LIGHT: V3 = norm3([-0.55, -1, -0.5]);

// ---- local materials (before fog) ----------------------------------------------------------------------------------
const STONE_CREAM: Mat = { lit: "#E6DCC4", mid: "#C4B694", dark: "#857A63" };
const WALLSTONE: Mat = { lit: "#A99A82", mid: "#7F7261", dark: "#4E4539" };
const PLASTER: Mat = { lit: "#E4D9C2", mid: "#C3B596", dark: "#857963" };
const TILE: Mat = { lit: "#A2664C", mid: "#86503A", dark: "#55301F" };
const TIMBER: Mat = MAT.timber;
const WAX = "#3F3127";
const WAX_LINE = "#B9A783";
const PODIUM: Mat = { lit: "#C9BDA4", mid: "#A09379", dark: "#6B6150" };
const SEAL_WAX: Mat = { lit: "#B07258", mid: "#8E4F36", dark: "#5C2E1E" };
const OLIVE_LEAF: Mat = { lit: "#8C9670", mid: "#6C7656", dark: "#46503A" };
const GROUND_BASE = "#8B7C5E";
const ROAD = "#B2A283";
const ROAD_RUT = "#968568";
const PLOT_COL: Record<PlotKind, { base: string; row: string; rowW: number; rowGap: number }> = {
  wheat: { base: "#A9995F", row: "#8F8049", rowW: 0.06, rowGap: 0.42 },
  stubble: { base: "#B7A87F", row: "#97875F", rowW: 0.05, rowGap: 0.36 },
  plough: { base: "#7D624A", row: "#5A4535", rowW: 0.14, rowGap: 0.42 },
  olive: { base: "#958568", row: "#7F7055", rowW: 0.05, rowGap: 2.2 },
  vines: { base: "#8F7F62", row: "#5F6646", rowW: 0.16, rowGap: 1.5 },
  meadow: { base: "#858A64", row: "#6F7553", rowW: 0.07, rowGap: 0.9 },
  yard: { base: "#9A8968", row: "#8A7A5C", rowW: 0.04, rowGap: 1.3 },
  court: { base: "#A49680", row: "#857864", rowW: 0.04, rowGap: 0.9 },
};

// ===================================================================================================================
// THE AIR ON THIS CAMERA (the kit's airWorldOf, with the eye's own rest point and the fog scaled to its height)
// ===================================================================================================================
type World = AirWorld & { e: Eye; eye: V3; dist: (Z: number) => number; sc: (X: number, Y: number, Z: number) => P2 };
// the motes and shafts parallax against the APPROVED cut's f0 camera, so the kept part (from JOIN) stays pixel-identical
const EYE0 = keptAt(0);
const sceneFor = (e: Eye) => {
  const ds = (1.9 * e.eh) / U; // metres: the subject's distance scale
  return { ...AIR_SCENE_EYE, fogNear: m(0.8 * ds), fogVis: m(3.3 * ds), fogMax: 0.9, hLow: 0, hHigh: m(7), moteUnit: U * 3 };
};
const worldOf = (e: Eye, frame: number, sway: boolean): World => {
  const kc = kitCamOf(e);
  const camEye: Cam = sway ? swayCam(kc.cam, frame) : kc.cam;
  const depth = { eyeY: kc.eyeY, dRef: kc.Dc, kRef: 1, dolly: 0 };
  const P = perspective(camEye, depth);
  // the drawing camera carries the horizontal lens shift (Rev 1 opening): the VP sits xs px off the frame's centre
  const cam: Cam = { ...camEye, cx: camEye.cx - e.xs / camEye.k };
  const v = makeAirView({
    scene: { ...sceneFor(e), F: e.F },
    frame,
    horizon: 960 + (kc.eyeY - cam.cy) * cam.k,
    cam: { x: e.ex, y: e.eh, z: e.ez },
    rest: { x: EYE0.ex, y: EYE0.eh, z: EYE0.ez },
  });
  const dist = (Z: number) => Math.max(1, Z - e.ez);
  const fog = (Z: number) => c01(v.fogAt(dist(Z)));
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(dist(Z), h));
  const tone = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), fog(Z));
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.5 * fog(Z));
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const figFog = (Z: number) => 0.85 * fog(Z);
  return {
    v,
    P,
    cam,
    Dc: kc.Dc,
    k: cam.k,
    fog,
    airHex,
    tone,
    toneO,
    screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))),
    figFog,
    folkFog: (Z: number, feetH = 0) => ({ rgb: airHex(Z, feetH + 150), amount: figFog(Z) }),
    workerInks: () => {
      throw new Error("not used");
    },
    lw: (b = 1.1) => b / Math.pow(cam.k, 0.6),
    e,
    eye: [e.ex, -e.eh, e.ez],
    dist,
    sc: (X, Y, Z) => P.p(X, Y, Z),
  };
};

// ===================================================================================================================
// PRIMITIVES
// ===================================================================================================================
const shadeOf = (mat: Mat, n: V3) => {
  const ndl = dot3(n, LIGHT);
  const t = c01((ndl + 0.3) / 1.15);
  return t < 0.5 ? mixHex(mat.dark, mat.mid, t * 2) : mixHex(mat.mid, mat.lit, (t - 0.5) * 2);
};
/** an oriented box: centre c, unit axes [a, b, n] and half sizes; optional low pyramid cap on the +a end. Draws the
 *  faces that face the eye (convex: no sorting needed), shaded by their normal, fogged by the box's depth. */
const OBox: React.FC<{ W: World; c: V3; ax: [V3, V3, V3]; hs: V3; mat: Mat; cap?: number; lw?: number; rim?: boolean; decussis?: boolean }> = ({ W, c, ax, hs, mat, cap = 0, lw, rim = true, decussis }) => {
  const [a, b, n] = ax;
  const corner = (sa: number, sb: number, sn: number): V3 => add3(add3(add3(c, mul3(a, sa * hs[0])), mul3(b, sb * hs[1])), mul3(n, sn * hs[2]));
  const Zc = c[2];
  const h = -c[1];
  const t = (hex: string) => W.tone(hex, Zc, h);
  const w = lw ?? W.lw(1.0);
  const ln = t(lineOf(mat));
  const faces: { pts: V3[]; nrm: V3 }[] = [];
  const axes: V3[] = [a, b, n];
  for (let k = 0; k < 3; k++) {
    for (const s of [-1, 1]) {
      const nrm = mul3(axes[k], s);
      const o1 = axes[(k + 1) % 3];
      const o2 = axes[(k + 2) % 3];
      const h1 = hs[(k + 1) % 3];
      const h2 = hs[(k + 2) % 3];
      const fc = add3(c, mul3(nrm, hs[k]));
      if (k === 0 && s === 1 && cap > 0) continue; // the capped end is drawn as the cap
      faces.push({ pts: [add3(add3(fc, mul3(o1, -h1)), mul3(o2, -h2)), add3(add3(fc, mul3(o1, h1)), mul3(o2, -h2)), add3(add3(fc, mul3(o1, h1)), mul3(o2, h2)), add3(add3(fc, mul3(o1, -h1)), mul3(o2, h2))], nrm });
    }
  }
  if (cap > 0) {
    const apex = add3(c, mul3(a, hs[0] + cap));
    const q = [corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)];
    for (let i = 0; i < 4; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % 4];
      const mid = mul3(add3(add3(p0, p1), apex), 1 / 3);
      const out = norm3(sub3(mid, c));
      faces.push({ pts: [p0, p1, apex], nrm: out });
    }
  }
  const els: React.ReactNode[] = [];
  faces.forEach((fc, i) => {
    const ctr = mul3(fc.pts.reduce((s, p) => add3(s, p), [0, 0, 0] as V3), 1 / fc.pts.length);
    if (dot3(fc.nrm, sub3(W.eye, ctr)) <= 0) return;
    const q = fc.pts.map((p) => W.sc(p[0], p[1], p[2]));
    els.push(<path key={i} d={poly(q)} fill={t(shadeOf(mat, fc.nrm))} stroke={ln} strokeWidth={w} strokeLinejoin="round" />);
    if (rim && dot3(fc.nrm, LIGHT) > 0.55) els.push(<path key={`r${i}`} d={poly(q)} fill="none" stroke={PAL.cream} strokeWidth={w * 0.9} strokeOpacity={0.35 * (1 - W.fog(Zc))} strokeLinejoin="round" />);
  });
  if (decussis && cap > 0) {
    // the carved cross on the cap
    const apex = add3(c, mul3(a, hs[0] + cap));
    const q = [corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)];
    const d = q.map((p) => `M${Pt(W.sc(...(add3(mul3(p, 0.25), mul3(apex, 0.75)) as V3)))}L${Pt(W.sc(...(add3(mul3(p, 0.75), mul3(apex, 0.25)) as V3)))}`).join("");
    els.push(<path key="dx" d={d} stroke={t(mat.dark)} strokeWidth={w * 0.9} strokeOpacity={0.7} fill="none" />);
  }
  return <g>{els}</g>;
};
const X3: V3 = [1, 0, 0];
const Y3: V3 = [0, -1, 0]; // up
const Z3: V3 = [0, 0, 1];

/** a boundary stone (terminus) standing at (x, z) metres: 0.24 m square, 0.85 m above ground, a low pyramid cap with
 *  the carved decussis */
const Terminus: React.FC<{ W: World; x: number; z: number; above?: number; uid: string }> = ({ W, x, z, above = 1.0, uid }) => {
  const T = m(0.3);
  const hgt = m(above);
  const dM = W.dist(m(z)) / U;
  if (dM > 32) {
    // far: a lit front and a cap, no shadow (cheap)
    const Z = m(z);
    const X = m(x);
    const q = [W.sc(X - T / 2, -hgt, Z - T / 2), W.sc(X + T / 2, -hgt, Z - T / 2), W.sc(X + T / 2, 0, Z - T / 2), W.sc(X - T / 2, 0, Z - T / 2)];
    const cap = W.sc(X, -hgt - m(0.1), Z);
    return (
      <g>
        <path d={poly(q)} fill={W.tone(STONE_CREAM.mid, Z, hgt / 2)} />
        <path d={poly([q[0], q[1], cap])} fill={W.tone(STONE_CREAM.lit, Z, hgt)} />
      </g>
    );
  }
  return (
    <g>
      <AirShadow A={W} X={m(x)} Z={m(z)} w={m(0.3)} d={m(0.2)} uid={`${uid}s`} amt={0.7} />
      <OBox W={W} c={[m(x), -hgt / 2, m(z)]} ax={[Y3, X3, Z3]} hs={[hgt / 2, T / 2, T / 2]} mat={STONE_CREAM} cap={m(0.08)} decussis />
    </g>
  );
};

// ===================================================================================================================
// THE GROUND (local colours; fogged afterwards by one screen-row veil, exact for a flat ground)
// ===================================================================================================================
type Quad = { x0: number; x1: number; z0: number; z1: number };
const GroundLayer: React.FC<{ W: World; frame: number }> = ({ W }) => {
  const e = W.e;
  const zNear = e.ez + Math.max(m(0.4), (0.7 * e.eh * e.F) / Math.max(200, 1920 - e.yh));
  const zFar = e.ez + m(900);
  const halfAt = (Z: number) => ((620 + 80 + Math.abs(e.xs)) * (Z - e.ez)) / e.F; // half the view's width at depth Z (+ margin, + the lens shift)
  const q = (r: Quad) => {
    const z0 = Math.max(r.z0, zNear);
    const z1 = Math.min(r.z1, zFar);
    if (z1 <= z0) return null;
    return poly([W.sc(r.x0, 0, z0), W.sc(r.x1, 0, z0), W.sc(r.x1, 0, z1), W.sc(r.x0, 0, z1)]);
  };
  const visible = (r: Quad) => {
    const z0 = Math.max(r.z0, zNear);
    const z1 = Math.min(r.z1, zFar);
    if (z1 <= z0) return false;
    const hw = halfAt(z1);
    return r.x1 > e.ex - hw && r.x0 < e.ex + hw;
  };
  const els: React.ReactNode[] = [];
  // the base
  els.push(<path key="base" d={q({ x0: e.ex - m(3000), x1: e.ex + m(3000), z0: zNear, z1: e.ez + m(4000) }) ?? ""} fill={GROUND_BASE} />);
  // the range of cells in view
  const iMin = Math.floor((e.ex / U - (halfAt(zFar) / U) - XB(0)) / PITCH) - 1;
  const iMax = Math.ceil((e.ex / U + (halfAt(zFar) / U) - XB(0)) / PITCH) + 1;
  const jMin = Math.floor((zNear / U - ZB(0)) / PITCH) - 1;
  const jMax = Math.ceil((zFar / U - ZB(0)) / PITCH) + 1;
  // roads (pale strips with two ruts), along Z (even i) and along X (even j)
  const roadD: string[] = [];
  const rutD: string[] = [];
  const vergeD: string[] = [];
  for (let i = iMin; i <= iMax; i++) {
    if (!xIsRoad(i)) continue;
    const r = { x0: m(XB(i) - ROAD_HW), x1: m(XB(i) + ROAD_HW), z0: zNear, z1: zFar };
    const d = q(r);
    if (d && visible(r)) roadD.push(d);
    const rv = { x0: m(XB(i) - ROAD_HW - 0.35), x1: m(XB(i) + ROAD_HW + 0.35), z0: zNear, z1: zFar };
    const dv = q(rv);
    if (dv && visible(rv)) vergeD.push(dv);
    for (const s of [-0.45, 0.45]) {
      const rr = { x0: m(XB(i) + s - 0.06), x1: m(XB(i) + s + 0.06), z0: zNear, z1: e.ez + m(160) };
      const dd = q(rr);
      if (dd && visible(rr)) rutD.push(dd);
    }
  }
  for (let j = jMin; j <= jMax; j++) {
    if (!zIsRoad(j)) continue;
    const r = { x0: e.ex - m(3000), x1: e.ex + m(3000), z0: m(ZB(j) - ROAD_HW), z1: m(ZB(j) + ROAD_HW) };
    const d = q(r);
    if (d) roadD.push(d);
    const dv = q({ ...r, z0: m(ZB(j) - ROAD_HW - 0.35), z1: m(ZB(j) + ROAD_HW + 0.35) });
    if (dv) vergeD.push(dv);
    for (const s of [-0.45, 0.45]) {
      const rr = { x0: e.ex - m(3000), x1: e.ex + m(3000), z0: m(ZB(j) + s - 0.06), z1: m(ZB(j) + s + 0.06) };
      if (m(ZB(j)) - e.ez > m(160)) continue;
      const dd = q(rr);
      if (dd) rutD.push(dd);
    }
  }
  els.push(<path key="verge" d={vergeD.join("")} fill={mixHex(ROAD, GROUND_BASE, 0.5)} opacity={0.6} />);
  els.push(<path key="roads" d={roadD.join("")} fill={ROAD} />);
  els.push(<path key="ruts" d={rutD.join("")} fill={ROAD_RUT} opacity={0.6} />);
  // the balks: grass strips between plots across (the even Z boundaries), no wall
  const balkD: string[] = [];
  for (let j = jMin; j <= jMax; j++) {
    if (zIsRoad(j) || j === -1) continue; // (Rev 1: no strip across the opening's foreground)
    const d = q({ x0: e.ex - m(3000), x1: e.ex + m(3000), z0: m(ZB(j) - 0.22), z1: m(ZB(j) + 0.22) });
    if (d) balkD.push(d);
  }
  els.push(<path key="balks" d={balkD.join("")} fill="#8C8A68" opacity={0.5} />);
  // the plots and their rows
  for (let j = jMin; j <= jMax; j++) {
    for (let i = iMin; i <= iMax; i++) {
      const pl0 = plotOf(i, j);
      const kind0 = plotKind(i, j);
      // the yard cell: the yard on the left, a vineyard on the right
      const subs: { pl: typeof pl0; kind: PlotKind; key: string }[] =
        kind0 === "yard"
          ? [
              { pl: { ...pl0, x1: YARD_X1 }, kind: "yard", key: "a" },
              { pl: { ...pl0, x0: YARD_X1 + 0.5 }, kind: "wheat", key: "b" },
            ]
          : [{ pl: pl0, kind: kind0, key: "" }];
      for (const sub of subs) {
      const pl = sub.pl;
      const kind = sub.kind;
      const r = { x0: m(pl.x0), x1: m(pl.x1), z0: m(pl.z0), z1: m(pl.z1) };
      if (!visible(r)) continue;
      const col = PLOT_COL[kind];
      const tint = (hashIJ(i * 3 + 1, j * 5 - 2) - 0.5) * 0.12;
      const base = tint > 0 ? mixHex(col.base, "#C9BC9A", tint) : mixHex(col.base, "#5E5240", -tint);
      const d = q(r);
      if (!d) continue;
      els.push(<path key={`p${i}_${j}${sub.key}`} d={d} fill={base} />);
      // rows: stripes in perspective; their opacity fades as they crowd on screen (no popping)
      const zMid = Math.max(zNear, (r.z0 + r.z1) / 2);
      const dMid = zMid - e.ez;
      const along = kind === "court" ? false : sub.key === "b" ? true : rowsAlongZ(i, j);
      const gap = m(col.rowGap);
      const scrGap = along ? (gap * e.F) / dMid : (gap * e.eh * e.F) / (dMid * dMid);
      const alpha = c01((scrGap - 1.6) / 4.5) * (kind === "wheat" ? 1 - 0.75 * c01((scrGap - 30) / 60) : 1);
      if (kind === "yard") {
        // packed earth: soft darker and lighter patches, no rows
        const pd: string[] = [];
        const pl2: string[] = [];
        for (let k = 0; k < 26; k++) {
          const px = lerp(r.x0, r.x1, hashIJ(k * 3.1, 7.7));
          const pz = lerp(r.z0, r.z1, hashIJ(k * 1.7, 2.3));
          const rr = m(0.25 + 0.9 * hashIJ(k, 9.1));
          if (pz - rr < zNear) continue;
          const ring: P2[] = [];
          for (let a = 0; a < 10; a++) {
            const an = (a / 10) * Math.PI * 2;
            const wob = 1 + 0.25 * Math.sin(an * 3 + k);
            ring.push(W.sc(px + rr * wob * Math.cos(an), 0, pz + rr * 0.8 * wob * Math.sin(an)));
          }
          (k % 3 === 0 ? pl2 : pd).push(poly(ring));
        }
        els.push(<path key={`yd${i}_${j}`} d={pd.join("")} fill="#857555" opacity={0.45} />);
        els.push(<path key={`yl${i}_${j}`} d={pl2.join("")} fill="#AE9E7C" opacity={0.4} />);
        // grass tufts near the table (upright strokes), only near the eye
        let td = "";
        for (let k = 0; k < 70; k++) {
          const px = lerp(r.x0 + m(0.2), r.x1 - m(0.2), hashIJ(k * 2.3, 4.4));
          const pz = lerp(Math.max(r.z0, zNear) + m(0.1), r.z1 - m(0.1), hashIJ(k * 5.9, 1.2));
          if (pz - e.ez > m(14) || Math.abs(px) < m(0.7) && pz > m(0.25) && pz < m(1.3)) continue;
          const hh = m(0.1 + 0.1 * hashIJ(k, 3.3));
          for (let b = -2; b <= 2; b++) {
            const ox = m(0.035) * b;
            const a = W.sc(px + ox, 0, pz);
            const t = W.sc(px + ox * 2.2 + m(0.02) * Math.sin(k + b), -hh * (1 - 0.15 * Math.abs(b)), pz);
            td += `M${Pt(a)}L${Pt(t)}`;
          }
        }
        if (td) els.push(<path key={`yt${i}_${j}`} d={td} stroke="#727556" strokeWidth={W.lw(1.4) * 1.1} strokeLinecap="round" fill="none" opacity={0.6} />);
        continue;
      }
      if (alpha <= 0.02) continue;
      const rw = m(col.rowW);
      const parts: string[] = [];
      if (along) {
        for (let X = r.x0 + gap / 2; X < r.x1; X += gap) {
          const dd = q({ x0: X - rw / 2, x1: X + rw / 2, z0: r.z0 + gap * 0.3, z1: r.z1 - gap * 0.3 });
          if (dd) parts.push(dd);
        }
      } else {
        for (let Z = r.z0 + gap / 2; Z < r.z1; Z += gap) {
          const dd = q({ x0: r.x0 + gap * 0.3, x1: r.x1 - gap * 0.3, z0: Z - rw / 2, z1: Z + rw / 2 });
          if (dd) parts.push(dd);
        }
      }
      if (kind === "court") {
        // flagstones: the cross joints too
        for (let X = r.x0 + gap; X < r.x1; X += gap) {
          const dd = q({ x0: X - rw / 2, x1: X + rw / 2, z0: r.z0, z1: r.z1 });
          if (dd) parts.push(dd);
        }
      }
      els.push(<path key={`r${i}_${j}${sub.key}`} d={parts.join("")} fill={col.row} opacity={(kind === "stubble" ? 0.7 : 0.85) * alpha} />);
      if (kind === "wheat") {
        // standing wheat near the eye: stalks with ears on a jittered grid (the farm cut's wheat), fading in by distance
        const near = m(10);
        const za = Math.max(r.z0, zNear);
        const zb = Math.min(r.z1, e.ez + near);
        if (zb > za) {
          let st = "";
          let ear = "";
          const step = m(0.11);
          for (let Z = Math.ceil(za / step) * step; Z < zb; Z += step) {
            for (let X = r.x0 + step * 0.5; X < r.x1 - step * 0.3; X += step) {
              const hx = hashIJ(X / step + 0.37, Z / step - 0.11);
              const hz = hashIJ(Z / step + 1.7, X / step + 0.5);
              const px = X + (hx - 0.5) * step * 0.8;
              const pz = Z + (hz - 0.5) * step * 0.8;
              if (pz < za || pz > zb) continue;
              const hh = m(0.55 + 0.2 * hz);
              const lean = m(0.05) * Math.sin(px * 0.013 + pz * 0.007);
              const b0 = W.sc(px, 0, pz);
              const t0 = W.sc(px + lean, -hh, pz);
              const e0 = W.sc(px + lean * 1.2, -hh - m(0.1), pz);
              st += `M${Pt(b0)}L${Pt(t0)}`;
              ear += `M${Pt(t0)}L${Pt(e0)}`;
            }
          }
          const lwS = W.lw(1.0);
          els.push(<path key={`ws${i}_${j}${sub.key}`} d={st} stroke="#8E8152" strokeWidth={lwS * 1.1} fill="none" opacity={0.9} />);
          els.push(<path key={`we${i}_${j}${sub.key}`} d={ear} stroke="#C2B07A" strokeWidth={lwS * 4.2} strokeLinecap="round" fill="none" />);
        }
      }
      }
    }
  }
  return <g>{els}</g>;
};

/** the screen-row veil that fogs the flat ground (distance by row: eh * F / (y - yh)) and the horizon zone */
const GroundFog: React.FC<{ W: World; uid: string }> = ({ W, uid }) => {
  const e = W.e;
  const yh = W.v.horizon;
  const stops: React.ReactNode[] = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const s = Math.pow(i / N, 2.2);
    const y = yh + 1 + s * (1925 - yh);
    const d = (e.eh * e.F) / Math.max(0.5, y - yh);
    const a = c01(W.v.fogAt(d));
    stops.push(<stop key={i} offset={s.toFixed(4)} stopColor={rgbHex(W.v.airAt(d, 0))} stopOpacity={a.toFixed(3)} />);
  }
  // the horizon zone: soft, over the ground only
  const hz: React.ReactNode[] = [0, 0.2, 0.45, 0.7, 1].map((s) => <stop key={s} offset={s} stopColor={rgbHex(W.v.airAtScreen(yh + 6))} stopOpacity={(0.95 * Math.pow(1 - s, 1.8)).toFixed(3)} />);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id={`${uid}gf`} gradientUnits="userSpaceOnUse" x1="0" y1={yh} x2="0" y2={1925}>
          {stops}
        </linearGradient>
        <linearGradient id={`${uid}hz`} gradientUnits="userSpaceOnUse" x1="0" y1={yh - 2} x2="0" y2={yh + 210}>
          {hz}
        </linearGradient>
      </defs>
      <rect x={0} y={yh} width={1080} height={Math.max(0, 1925 - yh)} fill={`url(#${uid}gf)`} />
      <rect x={0} y={yh - 2} width={1080} height={212} fill={`url(#${uid}hz)`} />
    </svg>
  );
};

/** far hills on the horizon (two ridges far in the air) */
const Hills: React.FC<{ W: World }> = ({ W }) => {
  const e = W.e;
  const ridge = (dM: number, h0: number, h1: number, seed: number, key: string) => {
    const Z = e.ez + m(dM);
    const pts: P2[] = [];
    const halfW = ((700 + Math.abs(e.xs)) * m(dM)) / e.F;
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const X = e.ex - halfW + (2 * halfW * i) / N;
      const xm = X / U;
      const hh = h0 + (h1 - h0) * (0.5 + 0.28 * Math.sin(xm / 170 + seed) + 0.17 * Math.sin(xm / 61 + seed * 2.3) + 0.06 * Math.sin(xm / 23 + seed * 5.1));
      pts.push(W.sc(X, -m(hh), Z));
    }
    pts.push(W.sc(e.ex + halfW, 0, Z), W.sc(e.ex - halfW, 0, Z));
    const fill = mixHex("#5E6B5C", W.airHex(Z, m(h1 * 0.7)), 0.86);
    return <path key={key} d={poly(pts)} fill={fill} />;
  };
  return <g>{[ridge(1700, 90, 260, 1.3, "h2"), ridge(1000, 30, 120, 4.1, "h1")]}</g>;
};

// ---- walls (low dry-stone, along the odd boundaries), drawn with the ground ---------------------------------------
const Walls: React.FC<{ W: World }> = ({ W }) => {
  const e = W.e;
  const zNear = e.ez + m(0.6);
  const zFar = e.ez + m(260);
  const halfAt = (Z: number) => ((700 + Math.abs(e.xs)) * (Z - e.ez)) / e.F;
  const top: string[] = [];
  const side: string[] = [];
  const front: string[] = [];
  const hgt = m(WALL_H);
  const hw = m(WALL_HW * 0.8);
  const pushBox = (x0: number, x1: number, z0: number, z1: number) => {
    const za = Math.max(z0, zNear);
    const zb = Math.min(z1, zFar);
    if (zb <= za) return;
    const hwz = halfAt(zb);
    if (x1 < e.ex - hwz || x0 > e.ex + hwz) return;
    top.push(poly([W.sc(x0, -hgt, za), W.sc(x1, -hgt, za), W.sc(x1, -hgt, zb), W.sc(x0, -hgt, zb)]));
    if (e.ex > x1) side.push(poly([W.sc(x1, -hgt, za), W.sc(x1, -hgt, zb), W.sc(x1, 0, zb), W.sc(x1, 0, za)]));
    else if (e.ex < x0) side.push(poly([W.sc(x0, -hgt, za), W.sc(x0, -hgt, zb), W.sc(x0, 0, zb), W.sc(x0, 0, za)]));
    if (za === z0) front.push(poly([W.sc(x0, -hgt, za), W.sc(x1, -hgt, za), W.sc(x1, 0, za), W.sc(x0, 0, za)]));
  };
  const iMin = Math.floor((e.ex / U - 400 - XB(0)) / PITCH);
  const iMax = Math.ceil((e.ex / U + 400 - XB(0)) / PITCH);
  const jMin = Math.floor(((e.ez + m(0.6)) / U - ZB(0)) / PITCH) - 1;
  const jMax = Math.ceil(((e.ez + m(260)) / U - ZB(0)) / PITCH) + 1;
  for (let i = iMin; i <= iMax; i++) {
    if (xIsRoad(i)) continue;
    for (let j = jMin; j <= jMax; j++) {
      // a wall along Z between the roads / walls across it, stopping short of the corners (the termini stand there)
      const za = m(ZB(j) + (zIsRoad(j) ? ROAD_HW : WALL_HW) + 0.45);
      const zb = m(ZB(j + 1) - (zIsRoad(j + 1) ? ROAD_HW : WALL_HW) - 0.45);
      pushBox(m(XB(i)) - hw, m(XB(i)) + hw, za, zb);
    }
  }
  const w = W.lw(0.8);
  return (
    <g>
      <path d={side.join("")} fill={mixHex(WALLSTONE.mid, WALLSTONE.dark, 0.45)} stroke={lineOf(WALLSTONE)} strokeWidth={w} strokeOpacity={0.5} />
      <path d={front.join("")} fill={WALLSTONE.mid} stroke={lineOf(WALLSTONE)} strokeWidth={w} strokeOpacity={0.5} />
      <path d={top.join("")} fill={WALLSTONE.lit} stroke={lineOf(WALLSTONE)} strokeWidth={w} strokeOpacity={0.5} />
    </g>
  );
};

// ===================================================================================================================
// STANDING THINGS
// ===================================================================================================================
const OliveTree: React.FC<{ W: World; x: number; z: number; s: number; uid: string }> = ({ W, x, z, s, uid }) => {
  const Z = m(z);
  const X = m(x);
  const r = W.P.r(Z);
  const base = W.sc(X, 0, Z);
  const R = m(1.1 * s) * r;
  const trunkH = m(1.1 * s) * r;
  const t = (h: string) => W.tone(h, Z, m(2));
  const cy = base[1] - trunkH - R * 0.55;
  const blob = (dx: number, dy: number, rr: number, c: string, k: string) => <ellipse key={k} cx={base[0] + dx * R} cy={cy + dy * R} rx={rr * R} ry={rr * R * 0.82} fill={c} />;
  return (
    <g>
      {W.dist(Z) < m(45) ? <AirShadow A={W} X={X + m(0.5)} Z={Z} w={m(1.2 * s)} d={m(0.7 * s)} uid={uid} amt={0.55} /> : null}
      <path d={`M${base[0] - R * 0.1},${base[1]}L${base[0] - R * 0.05},${base[1] - trunkH - R * 0.2}L${base[0] + R * 0.07},${base[1] - trunkH - R * 0.2}L${base[0] + R * 0.12},${base[1]}Z`} fill={t("#5E4B3A")} />
      {blob(0.05, 0.12, 0.95, t(OLIVE_LEAF.dark), "d")}
      {blob(-0.32, -0.05, 0.62, t(OLIVE_LEAF.mid), "a")}
      {blob(0.36, 0.02, 0.6, t(OLIVE_LEAF.mid), "b")}
      {blob(-0.12, -0.32, 0.5, t(OLIVE_LEAF.lit), "c")}
    </g>
  );
};

/** a vine: a short stake and a low leafy bush */
const VineBush: React.FC<{ W: World; x: number; z: number; s: number }> = ({ W, x, z, s }) => {
  const Z = m(z);
  const r = W.P.r(Z);
  const base = W.sc(m(x), 0, Z);
  const R = m(0.38 * s) * r;
  const t = (h: string) => W.tone(h, Z, m(0.8));
  const stakeTop = W.sc(m(x), -m(1.05), Z);
  const cy = base[1] - m(0.55) * r;
  return (
    <g>
      <path d={`M${Pt(base)}L${Pt(stakeTop)}`} stroke={t("#5E4B3A")} strokeWidth={m(0.04) * r} />
      <ellipse cx={base[0] + R * 0.1} cy={cy + R * 0.25} rx={R * 1.05} ry={R * 0.8} fill={t(OLIVE_LEAF.dark)} />
      <ellipse cx={base[0] - R * 0.35} cy={cy} rx={R * 0.62} ry={R * 0.55} fill={t("#6F7A52")} />
      <ellipse cx={base[0] + R * 0.38} cy={cy + R * 0.05} rx={R * 0.6} ry={R * 0.52} fill={t("#6F7A52")} />
      <ellipse cx={base[0] - R * 0.08} cy={cy - R * 0.3} rx={R * 0.48} ry={R * 0.4} fill={t("#8E9A6C")} />
    </g>
  );
};

/** the groma: a staff with a bracket carrying the cross, four plumb lines with bobs */
const Groma: React.FC<{ W: World; x: number; z: number; frame: number }> = ({ W, x, z, frame }) => {
  const X = m(x);
  const Z = m(z);
  const H = m(2.05);
  const arm = m(0.5);
  const bx = X + m(0.22);
  const t = (h: string) => W.tone(h, Z, H);
  const w = W.lw(1.4) * 1.6;
  const top = W.sc(X, -H, Z);
  const foot = W.sc(X, 0, Z);
  const ctr = W.sc(bx, -H, Z);
  const ends: V3[] = [
    [bx - arm, -H, Z],
    [bx + arm, -H, Z],
    [bx, -H, Z - arm],
    [bx, -H, Z + arm],
  ];
  const sw = 0.012 * Math.sin(frame / 9);
  const lines = ends.map((p, i) => {
    const a = W.sc(p[0], p[1], p[2]);
    const b = W.sc(p[0] + m(sw * (i % 2 ? 1 : -1)), p[1] + m(0.62), p[2]);
    return { a, b };
  });
  return (
    <g>
      <AirShadow A={W} X={X} Z={Z} w={m(0.25)} d={m(0.15)} uid="gromaS" amt={0.6} />
      <path d={`M${Pt(foot)}L${Pt(top)}L${Pt(ctr)}`} stroke={t("#5C4633")} strokeWidth={w * 1.3} fill="none" strokeLinecap="round" />
      <path d={`M${Pt(W.sc(ends[0][0], ends[0][1], ends[0][2]))}L${Pt(W.sc(ends[1][0], ends[1][1], ends[1][2]))}M${Pt(W.sc(ends[2][0], ends[2][1], ends[2][2]))}L${Pt(W.sc(ends[3][0], ends[3][1], ends[3][2]))}`} stroke={t("#6E553D")} strokeWidth={w} fill="none" strokeLinecap="round" />
      {lines.map((l, i) => (
        <g key={i}>
          <path d={`M${Pt(l.a)}L${Pt(l.b)}`} stroke={t("#D9CDB4")} strokeWidth={w * 0.45} />
          <circle cx={l.b[0]} cy={l.b[1]} r={w * 1.3} fill={t("#4F575A")} />
        </g>
      ))}
    </g>
  );
};

/** the farmhouse: plaster walls, a tiled gable roof (ridge along X), a door */
const Farmhouse: React.FC<{ W: World; uid: string }> = ({ W, uid }) => {
  const H = HOUSE;
  const x0 = m(H.x0);
  const x1 = m(H.x1);
  const z0 = m(H.z0);
  const z1 = m(H.z1);
  const zm = (z0 + z1) / 2;
  const eave = -m(H.h);
  const ridge = -m(H.ridge);
  const ov = m(0.3);
  const t = (hex: string, Z = zm) => W.tone(hex, Z, m(2));
  const w = W.lw(1.0);
  const roofF = [W.sc(x0 - ov, eave + m(0.12), z0 - ov), W.sc(x1 + ov, eave + m(0.12), z0 - ov), W.sc(x1 + ov, ridge, zm), W.sc(x0 - ov, ridge, zm)];
  const roofB = [W.sc(x0 - ov, ridge, zm), W.sc(x1 + ov, ridge, zm), W.sc(x1 + ov, eave + m(0.12), z1 + ov), W.sc(x0 - ov, eave + m(0.12), z1 + ov)];
  const gableSide = W.e.ex > x1 ? x1 : W.e.ex < x0 ? x0 : null;
  const door = [W.sc(x0 + m(1.0), -m(1.85), z0), W.sc(x0 + m(1.85), -m(1.85), z0), W.sc(x0 + m(1.85), 0, z0), W.sc(x0 + m(1.0), 0, z0)];
  const win = [W.sc(x1 - m(0.95), -m(2.1), z0), W.sc(x1 - m(0.55), -m(2.1), z0), W.sc(x1 - m(0.55), -m(1.6), z0), W.sc(x1 - m(0.95), -m(1.6), z0)];
  return (
    <g>
      <AirShadow A={W} X={(x0 + x1) / 2 + m(0.6)} Z={zm} w={(x1 - x0) * 0.7} d={(z1 - z0) * 0.7} uid={`${uid}s`} amt={0.6} />
      <AirBox A={W} X0={x0} X1={x1} Y0={eave} Y1={0} Z0={z0} Z1={z1} mat={PLASTER} uid={`${uid}b`} />
      {gableSide !== null ? <path d={poly([W.sc(gableSide, eave, z0), W.sc(gableSide, ridge, zm), W.sc(gableSide, eave, z1)])} fill={t(gableSide === x1 ? PLASTER.dark : PLASTER.lit)} stroke={t(lineOf(PLASTER))} strokeWidth={w} /> : null}
      <path d={poly(door)} fill={t("#4A3A2E", z0)} />
      <path d={poly(win)} fill={t("#3E342C", z0)} />
      {W.e.eh > m(H.ridge) ? <path d={poly(roofB)} fill={t(TILE.lit)} stroke={t(lineOf(TILE))} strokeWidth={w} /> : null}
      <path d={poly(roofF)} fill={t(TILE.mid)} stroke={t(lineOf(TILE))} strokeWidth={w} />
      <path d={`M${Pt(roofF[3])}L${Pt(roofF[2])}`} stroke={PAL.cream} strokeOpacity={0.4 * (1 - W.fog(zm))} strokeWidth={w * 1.2} />
    </g>
  );
};

/** the tribunal: a stone platform with two steps, the curule chair, the magistrate seated on it */
const Tribunal: React.FC<{ W: World; frame: number }> = ({ W, frame }) => {
  const T = TRIBUNAL;
  const X0 = m(T.x - T.w / 2);
  const X1 = m(T.x + T.w / 2);
  const Z0 = m(T.z);
  const Z1 = m(T.z + T.d);
  const Hh = m(T.h);
  const step = (k: number) => (
    <AirBox key={k} A={W} X0={X0 + m(0.5)} X1={X1 - m(0.5)} Y0={-Hh * (k / 3)} Y1={0} Z0={Z0 - m(0.32 * (3 - k))} Z1={Z0} mat={PODIUM} uid={`trs${k}`} />
  );
  // the curule chair (X legs) and the seated magistrate
  const seatZ = Z0 + m(0.85);
  const seatX = m(T.x);
  const seatY = -Hh;
  const sc = W.P.r(seatZ);
  const at = W.sc(seatX, seatY, seatZ);
  // Rev 1: he also lifts his hand on "good institutions" (f61) as the camera passes, and lowers it again
  const early = Math.sin(Math.PI * c01((frame - 46) / 40));
  const g = Math.max(span(frame, MAG_A, MAG_B), 0.85 * early);
  const base: RomeFolk.FigPose = {
    ...RomeFolk.STAND,
    yaw: 0.12,
    headYaw: 0.1,
    crouch: 70,
    lean: -2,
    pitch: 2,
    footL: [-10, 0],
    footR: [16, 0],
    liftL: 0,
    liftR: 0,
    armL: { w: [-46, -120], elbow: [-0.5, 1], fist: 0.4, hand: 0 },
    armR: { w: [48, -118], elbow: [0.5, 1], fist: 0.4, hand: 0 },
  };
  const raised: RomeFolk.FigPose = { ...base, armR: { w: [70, -228], elbow: [0.3, 1], fist: 0, hand: -14 }, headYaw: 0.0, pitch: -2 };
  const pose = RomeFolk.lerpFig(base, raised, g);
  const legT = (h: string) => W.tone(h, seatZ, Hh);
  const w = W.lw(1.6) * 1.4;
  const cl = W.sc(seatX - m(0.26), seatY - m(0.45), seatZ);
  const cr = W.sc(seatX + m(0.26), seatY - m(0.45), seatZ);
  const fl = W.sc(seatX - m(0.26), seatY, seatZ);
  const fr = W.sc(seatX + m(0.26), seatY, seatZ);
  return (
    <g>
      <path d={poly([W.sc(X0 - m(0.9), 0, Z0 - m(1.4)), W.sc(X1 + m(0.9), 0, Z0 - m(1.4)), W.sc(X1 + m(0.9), 0, Z1 + m(0.5)), W.sc(X0 - m(0.9), 0, Z1 + m(0.5))])} fill={W.tone("#A69882", Z0, 0)} />
      <AirShadow A={W} X={m(T.x)} Z={(Z0 + Z1) / 2} w={m(T.w * 0.6)} d={m(T.d * 0.7)} uid="trS" amt={0.6} />
      <AirBox A={W} X0={X0} X1={X1} Y0={-Hh} Y1={0} Z0={Z0} Z1={Z1} mat={PODIUM} uid="trB" />
      {[1, 2].map(step)}
      <path d={`M${Pt(cl)}L${Pt(fr)}M${Pt(cr)}L${Pt(fl)}`} stroke={legT("#5C4633")} strokeWidth={w} strokeLinecap="round" />
      <RomeFolk.Dominus variant={1} stripe pose={RomeFolk.idle(pose, frame, 2)} at={at} scale={sc} uid="mag" fog={W.folkFog(seatZ, Hh)} unitPx={W.k} />
      <path d={`M${Pt(cl)}L${Pt(cr)}`} stroke={legT("#6E553D")} strokeWidth={w * 1.6} strokeLinecap="round" />
      {/* two lictors with their rods on the paving before the platform */}
      {[-1, 1].map((sd) => {
        const LZ = Z0 - m(0.9);
        const LX = m(T.x + sd * (T.w / 2 + 0.65));
        const lsc = W.P.r(LZ);
        return (
          <g key={sd}>
            <AirShadow A={W} X={LX} Z={LZ} w={62} d={30} uid={`lic${sd}s`} amt={0.6} />
            <RomeFolk.Overseer variant={sd > 0 ? 1 : 0} pose={RomeFolk.idle({ ...RomeFolk.POSES.stand(sd > 0 ? -1 : 1), headYaw: sd * -0.2 }, frame, sd + 7)} at={W.sc(LX, 0, LZ)} scale={lsc} uid={`lic${sd}`} fog={W.folkFog(LZ)} unitPx={W.k} />
          </g>
        );
      })}
    </g>
  );
};

// ===================================================================================================================
// THE STONE BEING SET, ITS TWO MEN, THE SURVEYOR
// ===================================================================================================================
/** the stone's frame at f: centre (units), axis up the stone, the side normal in X-Y, and the top end's grip points */
const stoneFrame = (f: number) => {
  const th = stoneTheta(f);
  const a: V3 = [-Math.cos(th), -Math.sin(th), 0];
  const p: V3 = [Math.sin(th), -Math.cos(th), 0];
  const L = m(STONE.L);
  const T = m(STONE.T);
  const pivot: V3 = [m(PIVOT.x), m(stoneSink(f)), m(PIVOT.z)];
  const c = add3(add3(pivot, mul3(a, L / 2)), mul3(p, T / 2));
  const topEnd = add3(c, mul3(a, L / 2));
  return { th, a, p, c, L, T, topEnd };
};
const StoneGroup: React.FC<{ W: World; frame: number }> = ({ W, frame }) => {
  const f = frame;
  const sf = stoneFrame(f);
  const Zs = m(PIVOT.z);
  const scS = W.P.r(Zs);
  // the lifter (behind the stone) holds the top end; the hauler (in front, right of the hole) pulls a rope tied to it
  const ZA = Zs + m(0.32);
  const ZB_ = Zs - m(0.34);
  // grips on the top end (world 3D), both on its upper face near the end
  const gripNear = add3(add3(sf.topEnd, mul3(sf.a, -m(0.1))), mul3(sf.p, m(0.02)));
  const gripFar = add3(add3(sf.topEnd, mul3(sf.a, -m(0.26))), mul3(sf.p, m(0.02)));
  const lift = span(f, GRIP_F, RAISE_A);
  const released = span(f, SET_F + 1, SET_F + 9);
  // the lifter's feet: a step to the right as the top end comes over him
  const topX = sf.topEnd[0] / U;
  const ax = Math.min(topX - 0.38, PIVOT.x - 0.5) - 0.08 * released;
  const scA = W.P.r(ZA);
  const atA = W.sc(m(ax), 0, ZA);
  const thN = sf.th / (Math.PI / 2);
  const baseA: RomeFolk.FigPose = {
    ...RomeFolk.POSES.stand(1),
    crouch: lerp(8, 62, lift * (1 - c01(thN / 0.45))),
    lean: lerp(4, 22, lift * (1 - c01(thN / 0.7))) + 8 * lift * thN * (1 - released),
    pitch: lerp(2, 14, lift) * (1 - 0.6 * thN),
    brow: 0.6 * lift * (1 - released),
    mouth: -0.3 * lift * (1 - released),
  };
  const poseA: RomeFolk.FigPose = baseA;
  const toW = (v: V3): P2 => W.sc(v[0], v[1], v[2]);
  const gripA = lift > 0.02 && released < 0.98 ? { L: toW(gripNear), R: toW(gripFar) } : undefined;
  const poseAg = gripA ? RomeFolk.lerpFig(poseA, RomeFolk.gripTo("slave", 1, poseA, gripA, atA, scA), Math.min(lift, 1 - released)) : poseA;
  // the hauler: stands right of the hole, facing left, leaning back on the rope while it rises; steps back
  const haul = span(f, RAISE_A - 4, RAISE_A + 6) * (1 - span(f, RAISE_B - 2, RAISE_B + 8));
  const back = span(f, RAISE_A, RAISE_B);
  const bx = PIVOT.x + 1.15 + 0.4 * back;
  const scB = W.P.r(ZB_);
  const atB = W.sc(m(bx), 0, ZB_);
  const ropeHand: P2 = [atB[0] - 62 * scB, atB[1] - 150 * scB];
  const baseB: RomeFolk.FigPose = {
    ...RomeFolk.POSES.stand(-1),
    lean: -lerp(0, 16, haul),
    crouch: lerp(4, 22, haul),
    pitch: -6 * haul,
    footL: [-30 * haul, 0],
    footR: [24 * haul, 0],
    brow: 0.7 * haul,
    mouth: -0.35 * haul,
  };
  // he holds the rope until the stone stands, then lets it drop: the free end falls to the ground at his feet
  const DROP_F = RAISE_B + 8;
  const ropeOn = f < DROP_F;
  const poseB = ropeOn ? RomeFolk.gripTo("slave", 0, baseB, { R: ropeHand, L: [ropeHand[0] - 14 * scB, ropeHand[1] + 4 * scB] }, atB, scB) : baseB;
  const ropeEnd = toW(add3(sf.topEnd, mul3(sf.a, -m(0.04))));
  const fall = span(f, DROP_F, DROP_F + 7);
  const groundEnd = W.sc(m(bx - 0.45), 0, ZB_ + m(0.05));
  const freeEnd: P2 = [lerp(ropeHand[0], groundEnd[0], fall), lerp(ropeHand[1], groundEnd[1], fall * fall)];
  const slack = Math.max(1 - span(f, RAISE_A - 6, RAISE_A + 2), fall);
  const mid: P2 = [(freeEnd[0] + ropeEnd[0]) / 2, Math.max(freeEnd[1], ropeEnd[1]) + 30 * scB * slack];
  const ropeAlpha = 1;
  // painter's order: the lifter (behind), the hole, the stone, the rope, the hauler (in front)
  const holeC = W.sc(m(HOLE.x), 0, m(HOLE.z));
  const holeR = m(0.23) * scS;
  const holeRy = Math.max(1, Math.abs(W.sc(m(HOLE.x), 0, m(HOLE.z) - m(0.23))[1] - W.sc(m(HOLE.x), 0, m(HOLE.z) + m(0.23))[1]) / 2);
  const mound = W.sc(m(HOLE.x + 0.55), 0, m(HOLE.z + 0.15));
  const tA = (h: string) => W.tone(h, Zs, 0);
  const frontRow = W.sc(m(HOLE.x), 0, Zs - m(STONE.T / 2))[1];
  return (
    <g>
      <AirShadow A={W} X={m(ax)} Z={ZA} w={62} d={30} uid="liftS" amt={0.8} />
      <RomeFolk.Slave variant={1} garb="tunic" pose={RomeFolk.idle(poseAg, f, 1)} at={atA} scale={scA} uid="lifter" fog={W.folkFog(ZA)} unitPx={W.k} />
      <path d={`M${mound[0] - holeR * 1.3},${mound[1]}Q${mound[0] - holeR * 0.5},${mound[1] - holeR * 0.9} ${mound[0] + holeR * 0.1},${mound[1] - holeR * 0.75}Q${mound[0] + holeR * 0.9},${mound[1] - holeR * 0.5} ${mound[0] + holeR * 1.3},${mound[1]}Z`} fill={tA("#9A8664")} stroke={tA("#77664C")} strokeWidth={W.lw(1)} />
      <ellipse cx={holeC[0]} cy={holeC[1]} rx={holeR} ry={holeRy} fill={tA("#3B2F25")} />
      <AirShadow A={W} X={sf.c[0]} Z={Zs} w={m(0.7) * Math.cos(sf.th) + m(0.2)} d={m(0.2)} uid="stoneS" amt={0.75} />
      <defs>
        <clipPath id="stoneClip">
          <path d={`M${Pt([holeC[0] - 4000, frontRow - 8000])}L${Pt([holeC[0] + 4000, frontRow - 8000])}L${Pt([holeC[0] + 4000, frontRow])}L${Pt([holeC[0] - 4000, frontRow])}Z`} />
          <ellipse cx={holeC[0]} cy={holeC[1]} rx={holeR} ry={holeRy} />
        </clipPath>
      </defs>
      <g clipPath={f >= RAISE_B - 1 ? "url(#stoneClip)" : undefined}>
        <OBox W={W} c={sf.c} ax={[sf.a, sf.p, Z3]} hs={[sf.L / 2, sf.T / 2, sf.T / 2]} mat={STONE_CREAM} cap={m(0.07)} decussis />
      </g>
      {/* the earth closing round its foot as it settles */}

      {ropeAlpha > 0 ? <path d={`M${Pt(freeEnd)}Q${Pt(mid)} ${Pt(ropeEnd)}`} stroke={tA("#BCA97E")} strokeWidth={4.5 * scB} fill="none" strokeLinecap="round" /> : null}
      <AirShadow A={W} X={m(bx)} Z={ZB_} w={62} d={30} uid="haulS" amt={0.8} />
      <RomeFolk.Slave variant={0} garb="tunic" pose={RomeFolk.idle(poseB, f, 2)} at={atB} scale={scB} uid="hauler" fog={W.folkFog(ZB_)} unitPx={W.k} />
    </g>
  );
};

const SurveyorGroup: React.FC<{ W: World; frame: number }> = ({ W, frame }) => {
  const f = frame;
  const Zp = m(SURVEYOR.z);
  const sc = W.P.r(Zp);
  const at = W.sc(m(SURVEYOR.x), 0, Zp);
  // sighting down the boundary toward the stone (toward the camera, a little left), pointing while it rises
  const pt = span(f, RAISE_A - 10, RAISE_A + 8) * (1 - span(f, SET_F + 4, SET_F + 22));
  const pose = RomeFolk.lerpFig({ ...RomeFolk.POSES.stand(-1), headYaw: -0.3, pitch: 6 }, RomeFolk.POSES.point(-1, 1, [190, -250]), pt);
  return (
    <g>
      <Groma W={W} x={GROMA.x} z={GROMA.z} frame={f} />
      <AirShadow A={W} X={m(SURVEYOR.x)} Z={Zp} w={62} d={30} uid="survS" amt={0.8} />
      <RomeFolk.Freeman variant={1} pilleus={false} pose={RomeFolk.idle(pose, f, 3)} at={at} scale={sc} uid="surv" fog={W.folkFog(Zp)} unitPx={W.k} apron={false} />
    </g>
  );
};

// ===================================================================================================================
// THE TABLE: the owner, the buyer, the witness, the tablets
// ===================================================================================================================
/** a tablet leaf: the hinge along X at Z = zc; side -1 = the near leaf (lying toward the camera), 1 = the far leaf,
 *  turned by phi about the hinge (0 flat, pi/2 upright facing the camera, pi lying on the near leaf) */
const leafBox = (side: 1 | -1, phi: number) => {
  const top = -m(TABLE.top + TABLE.th / 2 + TAB.t);
  const w = m(TAB.w);
  const d = m(TAB.d);
  const t = m(TAB.t);
  // direction from the hinge to the free edge (in the Y-Z plane), and the leaf's face normal (wax side)
  const dir: V3 = side === 1 ? [0, -Math.sin(phi), Math.cos(phi)] : [0, 0, -1];
  const nrm: V3 = side === 1 ? [0, -Math.cos(phi), -Math.sin(phi)] : [0, -1, 0];
  const hinge: V3 = [0, top, m(TAB.zc)];
  // its lower face on the table; turned over, it lies one leaf higher, on the near leaf
  const c = add3(add3(hinge, mul3(dir, d / 2)), mul3(nrm, -t / 2));
  return { c, ax: [dir, nrm, X3] as [V3, V3, V3], hs: [d / 2, t / 2, w / 2] as V3, dir, nrm, hinge, w, d, t };
};
const Leaf: React.FC<{ W: World; side: 1 | -1; phi: number; writing: number; cord: boolean }> = ({ W, side, phi, writing, cord }) => {
  const L = leafBox(side, phi);
  const els: React.ReactNode[] = [<OBox key="b" W={W} c={L.c} ax={L.ax} hs={L.hs} mat={TIMBER} rim={false} lw={W.lw(0.9)} />];
  const faceC = add3(L.c, mul3(L.nrm, L.t / 2 + 0.3));
  const faceSeen = dot3(L.nrm, sub3(W.eye, faceC)) > 0;
  const Z = m(TAB.zc);
  // u across (X), v along the leaf (from the hinge side -1 to the free edge 1)
  const corner = (u: number, v: number, off: V3): V3 => add3(add3(add3(L.c, mul3(X3, u * L.w * 0.5)), mul3(L.dir, v * L.d * 0.5)), off);
  if (faceSeen) {
    // the wax recess and the scratched lines
    const off = mul3(L.nrm, L.t / 2 + 0.4);
    const q = [corner(-0.86, -0.8, off), corner(0.86, -0.8, off), corner(0.86, 0.8, off), corner(-0.86, 0.8, off)].map((p) => W.sc(p[0], p[1], p[2]));
    els.push(<path key="wax" d={poly(q)} fill={W.tone(WAX, Z, m(0.8))} />);
    const rows = 5;
    let d = "";
    for (let r = 0; r < rows; r++) {
      // the first row is the one at the free edge (top of the page when it stands)
      const v = 0.6 - (1.2 * r) / (rows - 1);
      const len = Math.min(1, writing * rows - r);
      if (len <= 0) continue;
      const segs = 7;
      for (let k = 0; k < segs; k++) {
        const u0 = -0.74 + (1.48 * k) / segs;
        const u1 = u0 + (1.48 / segs) * 0.78;
        if ((k + 0.5) / segs > len) break;
        const wob = 0.07 * Math.sin(r * 3.1 + k * 1.7);
        const a = corner(u0, v + wob, off);
        const b = corner(u1, v - wob, off);
        d += `M${Pt(W.sc(a[0], a[1], a[2]))}L${Pt(W.sc(b[0], b[1], b[2]))}`;
      }
    }
    if (d) els.push(<path key="txt" d={d} stroke={W.tone(WAX_LINE, Z, m(0.8))} strokeWidth={W.lw(1.1) * 1.3} fill="none" strokeLinecap="round" />);
  } else if (cord) {
    // the outer face: the binding cord across it (along X)
    const off = mul3(L.nrm, -(L.t / 2 + 0.4));
    const a = corner(-1.03, 0, off);
    const b = corner(1.03, 0, off);
    els.push(<path key="cord" d={`M${Pt(W.sc(a[0], a[1], a[2]))}L${Pt(W.sc(b[0], b[1], b[2]))}`} stroke={W.tone("#CDBB92", Z, m(0.8))} strokeWidth={W.lw(1.2) * 2.6} strokeLinecap="round" />);
  }
  return <g>{els}</g>;
};

/** the buyer's fingers wrapped over the back of the owner's hand (drawn over both hands once they meet) */
const ClaspFingers: React.FC<{ at: P2; sc: number; fill: string; shade: string; a: number }> = ({ at, sc, fill, shade, a }) => (
  <g opacity={a}>
    {[-1, 0, 1, 2].map((k) => (
      <ellipse key={k} cx={at[0] - 1 * sc + k * 3.6 * sc} cy={at[1] - 5.5 * sc + Math.abs(k - 0.5) * 0.9 * sc} rx={2.3 * sc} ry={3.4 * sc} fill={fill} stroke={shade} strokeWidth={0.6 * sc} />
    ))}
  </g>
);

const TableGroup: React.FC<{ W: World; frame: number }> = ({ W, frame }) => {
  const f = frame;
  const toW = (v: V3): P2 => W.sc(v[0], v[1], v[2]);
  const topY = -m(TABLE.top);
  const tabTop = -m(TABLE.top + TABLE.th / 2 + TAB.t);
  const phi = foldAngle(f);
  const closed = f >= FOLD_LAND;
  // ---- the figures --------------------------------------------------------------------------------------------
  const ZD = m(DOM.z);
  const ZF = m(FRE.z);
  const ZW = m(witZ(f));
  const scD = W.P.r(ZD);
  const scF = W.P.r(ZF);
  const scW = W.P.r(ZW);
  const atD = W.sc(m(DOM.x), 0, ZD);
  const atF = W.sc(m(FRE.x), 0, ZF);
  const atW = W.sc(m(WIT.x), 0, ZW);
  const sealPt = (x: number): V3 => [m(x), -m(TABLE.top + TABLE.th / 2 + 2 * TAB.t) - 1, m(TAB.zc - TAB.d / 2)];
  // the handshake: both near hands to a point above the tablets, then a gentle shake
  const reach = span(f, SHAKE_A, SHAKE_MEET);
  // Rev 1: the right hands clasp (dextrarum iunctio): the owner's right (his near arm) and the buyer's right (his
  // far arm: he faces left) meet palm to palm at one point and HOLD, with one small press down and up together
  const shakeY = f > SHAKE_MEET ? 4 * Math.sin(Math.PI * c01((f - SHAKE_MEET - 1) / 9)) : 0;
  const shakeP: V3 = [m(-0.02), -m(1.08) + shakeY, m(0.97)];
  // the near hands rest on the table's back edge; every reach blends from there (so the near arms are always drawn
  // over the table and never change layer)
  const tableTopY = -m(TABLE.top + TABLE.th / 2);
  const restD = toW([m(-0.36), tableTopY - m(0.02), m(0.84)]);
  const restF = toW([m(0.36), tableTopY - m(0.02), m(0.84)]);
  const mixP = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const shake = toW(shakeP);
  // the Dominus: facing right, watching; seals at SEALS[0]; shakes
  const pD = pressAt(f, SEALS[0].f);
  const sealD = toW(sealPt(SEALS[0].x));
  let handD = mixP(restD, [sealD[0], sealD[1] - 3 * scD], pD);
  handD = mixP(handD, [shake[0] + 5 * scD, shake[1]], reach);
  const poseD0 = RomeFolk.gripTo("dominus", 0, { ...RomeFolk.POSES.stand(1), headYaw: 0.75, crouch: 8 + 26 * pD, lean: 6 + 14 * pD + 11 * reach, pitch: 6 + 8 * pD }, { L: handD }, atD, scD);
  const poseD: RomeFolk.FigPose = reach > 0 ? { ...poseD0, armL: { ...poseD0.armL, fist: lerp(poseD0.armL.fist, 0.55, reach) } } : poseD0;
  // the Freeman: facing left; writes (stylus), folds the right leaf, seals SEALS[2], shakes
  const pF = pressAt(f, SEALS[2].f);
  const writing = c01(f / WRITE_END);
  let handF = restF;
  let bendF = 0;
  if (f < STYLUS_DOWN) {
    // writing on the right leaf: small strokes, the hand travelling along the rows; then back to the rest point,
    // where he leaves the stylus
    const u = (f % 22) / 22;
    const row = Math.floor(f / 22) % 5;
    const wx = -0.15 + 0.28 * u + 0.012 * Math.sin(f * 1.9);
    const wz = TAB.zc + TAB.d * 0.8 - 0.045 * row;
    const wr = toW([m(wx), tabTop - m(0.012) - m(0.018) * Math.abs(Math.sin(f * 1.3)), m(wz)]);
    const k0 = span(f, WRITE_END - 6, STYLUS_DOWN);
    handF = mixP([wr[0] + 4 * scF, wr[1] - 10 * scF], restF, k0);
    bendF = 1 - k0;
  } else if (f >= FOLD_GRIP - 9 && f < FOLD_UP + 8) {
    // to the right leaf's free edge, lifting it to upright, then back
    const Lf = leafBox(1, Math.min(phi, Math.PI / 2));
    const edge = add3(add3(Lf.hinge, mul3(Lf.dir, Lf.d * 0.98)), [m(0.13), 0, 0]);
    const ep = toW(add3(edge, mul3(Lf.nrm, -m(0.02))));
    const k0 = span(f, FOLD_GRIP - 9, FOLD_GRIP);
    const k1 = span(f, FOLD_UP, FOLD_UP + 8);
    handF = mixP(mixP(restF, ep, k0), restF, k1);
    bendF = 0.6 * k0 * (1 - k1);
  } else if (pF > 0) {
    const s = toW(sealPt(SEALS[2].x));
    handF = mixP(restF, [s[0], s[1] - 3 * scF], pF);
    bendF = pF;
  }
  const baseF: RomeFolk.FigPose = { ...RomeFolk.POSES.stand(-1), headYaw: -0.72, crouch: 8 + 26 * bendF, lean: -6 - 14 * bendF - 11 * reach, pitch: 8 + 8 * bendF };
  // his near (left) hand stays on the table; his right (far) hand comes from his side to the clasp
  const farRest = RomeFolk.romeAnchors("freeman", baseF, atF, scF, { variant: 0 }).handFar;
  const clasp = reach > 0 ? { L: mixP(farRest, [shake[0] - 6 * scF, shake[1] - 1 * scF], reach) } : {};
  const poseF0 = RomeFolk.gripTo("freeman", 0, baseF, { R: handF, ...clasp }, atF, scF);
  const poseF: RomeFolk.FigPose = reach > 0 ? { ...poseF0, armL: { ...poseF0.armL, fist: lerp(poseF0.armL.fist, 0.55, reach) } } : poseF0;
  // the witness: facing us, watching; bends over to seal SEALS[1]
  const pW = pressAt(f, SEALS[1].f);
  const lookW = c01((f - 150) / 40);
  const sW = toW(sealPt(SEALS[1].x));
  const baseW: RomeFolk.FigPose = { ...RomeFolk.POSES.front(), headYaw: 0.25 * Math.sin(f / 37) * (1 - lookW), pitch: 6 + 14 * pW + 6 * span(f, 202, 213) * (1 - span(f, 224, 239)), crouch: 50 * pW };
  const restW = RomeFolk.romeAnchors("freeman", baseW, atW, scW, { variant: 2 }).handL;
  const poseW = pW > 0 ? RomeFolk.gripTo("freeman", 2, baseW, { L: mixP(restW, [sW[0], sW[1] - 3 * scW], pW) }, atW, scW) : baseW;
  const idD = RomeFolk.idle(poseD, f, 4);
  const idF = RomeFolk.idle(poseF, f, 5);
  const idW = RomeFolk.idle(poseW, f, 6);
  // the stylus in the Freeman's hand while he writes; left lying under his hand at the rest point after
  const ancF = RomeFolk.romeAnchors("freeman", idF, atF, scF, { variant: 0 });
  const styl = f < STYLUS_DOWN ? { a: ancF.handNear, b: [ancF.handNear[0] - 14 * scF, ancF.handNear[1] + 20 * scF] as P2 } : { a: toW([m(0.36), tableTopY - m(0.012), m(0.84)]), b: toW([m(0.27), tableTopY - m(0.012), m(0.75)]) };
  // ---- the table ---------------------------------------------------------------------------------------------
  const T = TABLE;
  const leg = (x: number, zz: number, k: string) => <AirBox key={k} A={W} X0={m(x - 0.035)} X1={m(x + 0.035)} Y0={topY} Y1={0} Z0={m(zz - 0.035)} Z1={m(zz + 0.035)} mat={TIMBER} uid={`tl${k}`} />;
  const tableNode = (
    <g>
      <AirShadow A={W} X={m(0.08)} Z={m((T.z0 + T.z1) / 2)} w={m(0.62)} d={m(0.36)} uid="tabS" amt={0.45} />
      {leg(T.x0 + 0.06, T.z1 - 0.06, "bl")}
      {leg(T.x1 - 0.06, T.z1 - 0.06, "br")}
      {leg(T.x0 + 0.06, T.z0 + 0.06, "fl")}
      {leg(T.x1 - 0.06, T.z0 + 0.06, "fr")}
      <AirBox A={W} X0={m(T.x0)} X1={m(T.x1)} Y0={-m(T.top + T.th / 2)} Y1={-m(T.top - T.th / 2)} Z0={m(T.z0)} Z1={m(T.z1)} mat={TIMBER} uid="ttop" />
    </g>
  );
  // ---- the tablets and seals ---------------------------------------------------------------------------------
  const seals = SEALS.filter((s) => f >= s.f).map((s, i) => {
    const c = sealPt(s.x);
    const r = m(0.042);
    const pts: P2[] = [];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      pts.push(toW([c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a) * 1.15]));
    }
    const hl: P2[] = pts.slice(8, 13);
    return (
      <g key={i}>
        <path d={poly(pts)} fill={W.tone(SEAL_WAX.mid, c[2], m(0.8))} stroke={W.tone(SEAL_WAX.dark, c[2], m(0.8))} strokeWidth={W.lw(0.9)} />
        <path d={`M${hl.map(Pt).join("L")}`} stroke={W.tone("#D9AE92", c[2], m(0.8))} strokeWidth={W.lw(1.0) * 1.2} fill="none" strokeOpacity={0.8} />
      </g>
    );
  });
  const tablets = (
    <g>
      <Leaf W={W} side={-1} phi={0} writing={1} cord={false} />
      {phi < Math.PI / 2 ? <Leaf W={W} side={1} phi={phi} writing={writing} cord /> : null}
    </g>
  );
  const leafOver = phi >= Math.PI / 2 ? <Leaf W={W} side={1} phi={phi} writing={writing} cord={closed || phi > Math.PI * 0.8} /> : null;
  const stylus = <path d={`M${Pt(styl.a)}L${Pt(styl.b)}`} stroke={W.tone("#4E3D2E", m(0.4), m(0.8))} strokeWidth={4 * scF} strokeLinecap="round" />;
  // ---- painter's order: the witness, the two men (without their near arms), the table, the tablets, the near arms
  return (
    <g>
      <AirShadow A={W} X={m(WIT.x)} Z={ZW} w={62} d={30} uid="witS" amt={0.8} />
      <RomeFolk.Freeman variant={2} pilleus={false} pose={idW} at={atW} scale={scW} uid="wit" fog={W.folkFog(ZW)} unitPx={W.k} apron={false} hideArm={pW > 0 ? "L" : undefined} />
      <AirShadow A={W} X={m(DOM.x)} Z={ZD} w={62} d={30} uid="domS" amt={0.8} />
      <RomeFolk.Dominus variant={0} ring pose={idD} at={atD} scale={scD} uid="dom" fog={W.folkFog(ZD)} unitPx={W.k} hideArm="L" />
      <AirShadow A={W} X={m(FRE.x)} Z={ZF} w={62} d={30} uid="freS" amt={0.8} />
      <RomeFolk.Freeman variant={0} pilleus={false} pose={idF} at={atF} scale={scF} uid="fre" fog={W.folkFog(ZF)} unitPx={W.k} apron={false} hideArm="R" />
      {tableNode}
      {tablets}
      {f >= STYLUS_DOWN ? stylus : null}
      {leafOver}
      {seals}
      {pW > 0 ? <RomeFolk.Freeman variant={2} pilleus={false} pose={idW} at={atW} scale={scW} uid="witA" fog={W.folkFog(ZW)} unitPx={W.k} apron={false} onlyArm="L" /> : null}
      <RomeFolk.Dominus variant={0} ring pose={idD} at={atD} scale={scD} uid="domA" fog={W.folkFog(ZD)} unitPx={W.k} onlyArm="L" />
      <RomeFolk.Freeman variant={0} pilleus={false} pose={idF} at={atF} scale={scF} uid="freA" fog={W.folkFog(ZF)} unitPx={W.k} apron={false} onlyArm="R" />
      {reach > 0.92 ? <ClaspFingers at={RomeFolk.romeAnchors("dominus", idD, atD, scD, { variant: 0 }).handNear} sc={scD} fill={W.tone("#DDB28E", ZF, m(1))} shade={W.tone("#B98E6C", ZF, m(1))} a={span(f, SHAKE_MEET - 3, SHAKE_MEET)} /> : null}
      {f < STYLUS_DOWN ? stylus : null}
    </g>
  );
};

// ===================================================================================================================
// REV 1: THE TRADE AT THE ESTATE'S ROAD (the opening)
// ===================================================================================================================
const CART_WOOD: Mat = { lit: "#9C7A55", mid: "#6F5539", dark: "#3F2E1F" };
const SILVER = { face: "#CFCBBE", rim: "#8C887C", glint: "#F1EDE2" };
/** a wheel facing the camera: rim, six spokes, hub (X-Y plane at depth Z) */
const Wheel: React.FC<{ W: World; x: number; y: number; z: number; r: number; turn?: number }> = ({ W, x, y, z, r, turn = 0 }) => {
  const Z = m(z);
  const c = W.sc(m(x), -m(y), Z);
  const R = m(r) * W.P.r(Z);
  const t = (h: string) => W.tone(h, Z, m(0.5));
  let sp = "";
  for (let k = 0; k < 6; k++) {
    const a = turn + (k * Math.PI) / 3;
    sp += `M${(c[0] + Math.cos(a) * R * 0.15).toFixed(2)},${(c[1] + Math.sin(a) * R * 0.15).toFixed(2)}L${(c[0] + Math.cos(a) * R * 0.86).toFixed(2)},${(c[1] + Math.sin(a) * R * 0.86).toFixed(2)}`;
  }
  return (
    <g>
      <circle cx={c[0]} cy={c[1]} r={R * 0.93} fill="none" stroke={t(CART_WOOD.dark)} strokeWidth={R * 0.16} />
      <circle cx={c[0]} cy={c[1]} r={R * 0.93} fill="none" stroke={t(CART_WOOD.mid)} strokeWidth={R * 0.09} />
      <path d={sp} stroke={t(CART_WOOD.mid)} strokeWidth={R * 0.07} strokeLinecap="round" />
      <circle cx={c[0]} cy={c[1]} r={R * 0.17} fill={t(CART_WOOD.dark)} />
      <path d={`M${(c[0] - R * 0.66).toFixed(2)},${(c[1] - R * 0.66).toFixed(2)}A${(R * 0.93).toFixed(2)},${(R * 0.93).toFixed(2)} 0 0 1 ${(c[0] + R * 0.5).toFixed(2)},${(c[1] - R * 0.78).toFixed(2)}`} fill="none" stroke={PAL.cream} strokeOpacity={0.35 * (1 - W.fog(Z))} strokeWidth={R * 0.04} />
    </g>
  );
};
/** the merchant's handcart, its amphorae and the sacks already loaded, the far wheel, the shafts */
const Cart: React.FC<{ W: World }> = ({ W }) => {
  const C = CART;
  const top = -m(C.top);
  const els: React.ReactNode[] = [];
  els.push(<AirShadow key="sh" A={W} X={m((C.x0 + C.x1) / 2 + 0.3)} Z={m((C.z0 + C.z1) / 2)} w={m(1.1)} d={m(0.6)} uid="cartS" amt={0.6} />);
  els.push(<Wheel key="wf" W={W} x={C.wheelX} y={C.wheelR} z={C.z1 + 0.06} r={C.wheelR} />);
  // the shafts, resting on the ground toward the road
  for (const zz of [C.z0 + 0.15, C.z1 - 0.15]) {
    const a = W.sc(m(C.x0 + 0.1), -m(0.78), m(zz));
    const b = W.sc(m(C.x0 - 1.15), -m(0.05), m(zz));
    els.push(<path key={`sf${zz}`} d={`M${Pt(a)}L${Pt(b)}`} stroke={W.tone(CART_WOOD.mid, m(zz), m(0.4))} strokeWidth={m(0.07) * W.P.r(m(zz))} strokeLinecap="round" />);
  }
  els.push(<AirBox key="bed" A={W} X0={m(C.x0)} X1={m(C.x1)} Y0={top} Y1={top + m(0.13)} Z0={m(C.z0)} Z1={m(C.z1)} mat={CART_WOOD} uid="cartB" />);
  // the load: amphorae (two rows) and two sacks of wheat at the right end
  const amph: [number, number][] = [
    [8.05, -3.3], [8.4, -3.3], [8.75, -3.3],
    [7.9, -3.65], [8.25, -3.65], [8.6, -3.65],
  ];
  amph.forEach(([x, z], i) => {
    const Z = m(z);
    els.push(<RomeFolk.Amphora key={`a${i}`} at={W.sc(m(x), top, Z)} scale={W.P.r(Z)} angle={i % 2 ? 4 : -3} uid={`amph${i}`} fog={W.folkFog(Z, m(C.top))} unitPx={W.k} />);
  });
  [[9.15, -3.35], [9.07, -3.7]].forEach(([x, z], i) => {
    const Z = m(z);
    els.push(<RomeFolk.Sack key={`s${i}`} at={W.sc(m(x), top, Z)} scale={W.P.r(Z)} uid={`csack${i}`} fog={W.folkFog(Z, m(C.top))} unitPx={W.k} />);
  });
  // the near rail and the near wheel
  els.push(<AirBox key="rail" A={W} X0={m(C.x0)} X1={m(C.x1)} Y0={top - m(0.2)} Y1={top} Z0={m(C.z0) - m(0.04)} Z1={m(C.z0)} mat={CART_WOOD} uid="cartR" />);
  els.push(<Wheel key="wn" W={W} x={C.wheelX} y={C.wheelR} z={C.z0 - 0.08} r={C.wheelR} turn={0.3} />);
  return <g>{els}</g>;
};
/** the farmer and the merchant in front of the cart: silver poured from the purse into the farmer's palm */
const TradePair: React.FC<{ W: World; frame: number }> = ({ W, frame: f }) => {
  const toW = (v: V3): P2 => W.sc(v[0], v[1], v[2]);
  const ZF = m(FARMER.z);
  const ZM = m(MERCHANT.z);
  const scF = W.P.r(ZF);
  const scM = W.P.r(ZM);
  const atF = W.sc(m(FARMER.x), 0, ZF);
  const atM = W.sc(m(MERCHANT.x), 0, ZM);
  const mid = (FARMER.x + MERCHANT.x) / 2;
  // the farmer's palm (cupped, held out from f4) and the merchant's purse above it
  const out = span(f, 0, 6);
  const close = span(f, COINS[COINS.length - 1] + COIN_FLIGHT + 2, COINS[COINS.length - 1] + COIN_FLIGHT + 9);
  const palm3: V3 = [m(mid - 0.08), -m(0.98), m(FARMER.z + 0.02)];
  const purse3: V3 = [m(mid + 0.1), -m(1.2), m(MERCHANT.z - 0.02)];
  const palm = toW(palm3);
  const purse = toW(purse3);
  const restF: P2 = [atF[0] + 40 * scF, atF[1] - 140 * scF];
  const restM: P2 = [atM[0] - 40 * scM, atM[1] - 145 * scM];
  const pour = Math.sin(Math.PI * c01((f - COINS[0] + 4) / (COINS[COINS.length - 1] - COINS[0] + 12)));
  const handF: P2 = [lerp(restF[0], palm[0], out * (1 - close * 0.6)), lerp(restF[1], palm[1], out) + 6 * scF * close];
  const handM: P2 = [lerp(restM[0], purse[0], out), lerp(restM[1], purse[1], out) + 8 * scM * pour];
  const poseF = RomeFolk.gripTo("slave", 4, { ...RomeFolk.POSES.stand(1), headYaw: 0.75, pitch: 10, armL: { ...RomeFolk.POSES.stand(1).armL, fist: lerp(0.05, 0.85, close) } }, { L: handF }, atF, scF);
  const poseM = RomeFolk.gripTo("overseer", 2, { ...RomeFolk.POSES.stand(-1), headYaw: -0.7, pitch: 8, brow: -0.2, mouth: 0.2, armR: { ...RomeFolk.POSES.stand(-1).armR, fist: 0.7 } }, { R: handM }, atM, scM);
  // the coins: each falls from the purse's mouth to the palm, then lies in it (closed in the fist after)
  const coins: React.ReactNode[] = [];
  const coinR = m(0.075);
  COINS.forEach((c0, i) => {
    if (f < c0) return;
    const u = c01((f - c0) / COIN_FLIGHT);
    const from: P2 = [purse[0] - 8 * scM, purse[1] + 10 * scM];
    const to: P2 = [handF[0] + (i - 2) * 4 * scF, handF[1] - 5 * scF - i * 2.2 * scF];
    if (u >= 1 && close > 0.5) return;
    const x = lerp(from[0], to[0], u);
    const y = lerp(from[1], to[1], u * u);
    const tilt = u < 1 ? Math.abs(Math.cos(u * 5 + i)) : 0.35;
    const r = coinR * scF;
    coins.push(
      <g key={i}>
        <ellipse cx={x} cy={y} rx={r} ry={Math.max(r * 0.25, r * tilt)} fill={W.tone(SILVER.face, ZF, m(1))} stroke={W.tone(SILVER.rim, ZF, m(1))} strokeWidth={r * 0.25} />
        <circle cx={x - r * 0.3} cy={y - r * 0.15 * tilt} r={r * 0.22} fill={SILVER.glint} opacity={0.8 * (1 - W.fog(ZF))} />
      </g>,
    );
  });
  // the purse: a small leather pouch in the merchant's near hand
  const ancM = RomeFolk.romeAnchors("overseer", poseM, atM, scM, { variant: 2, tool: "none" });
  const ph = ancM.handNear;
  const purseNode = <path d={`M${ph[0] - 7 * scM},${ph[1] + 2 * scM}Q${ph[0] - 12 * scM},${ph[1] + 20 * scM} ${ph[0] - 2 * scM},${ph[1] + 22 * scM}Q${ph[0] + 8 * scM},${ph[1] + 18 * scM} ${ph[0] + 4 * scM},${ph[1] + 2 * scM}Z`} fill={W.tone("#A9875E", ZM, m(1))} stroke={W.tone("#5C4330", ZM, m(1))} strokeWidth={W.lw(1)} />;
  return (
    <g>
      <AirShadow A={W} X={m(MERCHANT.x)} Z={ZM} w={62} d={30} uid="merS" amt={0.8} />
      <RomeFolk.Overseer variant={2} tool="none" pose={RomeFolk.idle(poseM, f, 11)} at={atM} scale={scM} uid="merchant" fog={W.folkFog(ZM)} unitPx={W.k} />
      {purseNode}
      <AirShadow A={W} X={m(FARMER.x)} Z={ZF} w={62} d={30} uid="farS" amt={0.8} />
      <RomeFolk.Slave variant={4} garb="tunic" pose={RomeFolk.idle(poseF, f, 12)} at={atF} scale={scF} uid="farmer" fog={W.folkFog(ZF)} unitPx={W.k} />
      {coins}
    </g>
  );
};
/** the porter behind the cart, bringing one more sack of the estate's wheat */
const Porter: React.FC<{ W: World; frame: number }> = ({ W, frame: f }) => {
  const adv = (2 * RomeFolk.WALK.stride) / RomeFolk.WALK_CYCLE; // units per frame, planted feet do not slide
  const Z = m(PORTER.z);
  const X = m(PORTER.x0) + adv * f;
  const sc = W.P.r(Z);
  const pose = RomeFolk.POSES.carry(1, f / RomeFolk.WALK_CYCLE);
  return (
    <g>
      <AirShadow A={W} X={X} Z={Z} w={62} d={30} uid="porS" amt={0.8} />
      <RomeFolk.Slave variant={2} garb="tunic" load="sack" pose={pose} at={W.sc(X, 0, Z)} scale={sc} uid="porter" fog={W.folkFog(Z)} unitPx={W.k} />
    </g>
  );
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
type Item = { z: number; node: React.ReactNode };
/** farm things on the yard in front of the table */
const PROPS = [
  { kind: "basket" as const, x: -0.58, z: 0.06, uid: "pBasket" },
  { kind: "sack" as const, x: 0.64, z: 0.12, uid: "pSack" },
  { kind: "amphora" as const, x: -1.15, z: 1.25, uid: "pAmph" },
];
const Objects: React.FC<{ W: World; frame: number }> = ({ W, frame }) => {
  const e = W.e;
  const items: Item[] = [];
  const inView = (x: number, z: number, r = 2) => {
    const d = m(z) - e.ez;
    if (d < m(0.5)) return false;
    const sx = 540 + e.xs + ((m(x) - e.ex) * e.F) / d;
    const pad = (m(r) * e.F) / d;
    return sx > -pad - 40 && sx < 1080 + pad + 40;
  };
  // termini at every plot corner nearby (not P's near-right corner: that one is being set)
  const dMax = 110;
  const iMin = Math.floor((e.ex / U - 60 - XB(0)) / PITCH) - 1;
  const iMax = Math.ceil((e.ex / U + 60 - XB(0)) / PITCH) + 1;
  const jMin = Math.floor((e.ez / U - ZB(0)) / PITCH);
  const jMax = Math.ceil((e.ez / U + dMax - ZB(0)) / PITCH);
  for (let j = jMin; j <= jMax; j++) {
    for (let i = iMin; i <= iMax; i++) {
      const pl = plotOf(i, j);
      const kind = plotKind(i, j);
      if (kind === "court") continue;
      const corners: [number, number][] = [
        [pl.x0 + 0.15, pl.z0 + 0.15],
        [pl.x1 - 0.15, pl.z0 + 0.15],
        [pl.x0 + 0.15, pl.z1 - 0.15],
        [pl.x1 - 0.15, pl.z1 - 0.15],
      ];
      corners.forEach(([x, zz], k) => {
        if (i === -1 && j === 0 && k === 1) return;
        if (kind === "yard") return;
        // Rev 1: no stones in the opening's foreground (in front of the yard line; behind the camera from JOIN on)
        if (zz < -2.5) return;
        if (m(zz) - e.ez > m(dMax) || !inView(x, zz, 1)) return;
        items.push({ z: m(zz), node: <Terminus key={`t${i}_${j}_${k}`} W={W} x={x} z={zz} uid={`t${i}_${j}_${k}`} /> });
      });
      const vinePart = kind === "vines" ? pl : null;
      if (vinePart) {
        for (let X = vinePart.x0 + 0.75; X < vinePart.x1 - 0.3; X += 1.5) {
          for (let Zm = vinePart.z0 + 0.6; Zm < vinePart.z1 - 0.3; Zm += 1.1) {
            const x = X + (hashIJ(X * 3, Zm * 7) - 0.5) * 0.08;
            if (m(Zm) - e.ez > m(38) || !inView(x, Zm, 0.6)) continue;
            items.push({ z: m(Zm), node: <VineBush key={`v${i}_${j}_${X.toFixed(1)}_${Zm.toFixed(1)}`} W={W} x={x} z={Zm} s={0.85 + 0.3 * hashIJ(Zm * 2, X)} /> });
          }
        }
      }
      if (kind === "olive") {
        for (let a = 0; a < 4; a++) {
          for (let b = 0; b < 4; b++) {
            const x = lerp(pl.x0 + 1.3, pl.x1 - 1.3, a / 3) + (hashIJ(i * 9 + a, j * 7 + b) - 0.5) * 0.4;
            const zz = lerp(pl.z0 + 1.3, pl.z1 - 1.3, b / 3) + (hashIJ(i * 5 + b, j * 3 + a) - 0.5) * 0.4;
            if (m(zz) - e.ez > m(150) || !inView(x, zz, 2)) continue;
            items.push({ z: m(zz), node: <OliveTree key={`o${i}_${j}_${a}_${b}`} W={W} x={x} z={zz} s={0.85 + 0.3 * hashIJ(a + i, b + j)} uid={`o${i}_${j}_${a}_${b}`} /> });
          }
        }
      }
    }
  }
  if (inView((HOUSE.x0 + HOUSE.x1) / 2, HOUSE.z0, 4)) items.push({ z: m((HOUSE.z0 + HOUSE.z1) / 2), node: <Farmhouse key="house" W={W} uid="house" /> });
  if (inView(TRIBUNAL.x, TRIBUNAL.z, 3)) items.push({ z: m(TRIBUNAL.z + 1), node: <Tribunal key="trib" W={W} frame={frame} /> });
  ROAD_GOODS.forEach((g, i) => {
    if (!inView(g.x, g.z, 0.5)) return;
    const Z = m(g.z);
    const at = W.sc(m(g.x), 0, Z);
    const sc = W.P.r(Z);
    items.push({
      z: Z,
      node: (
        <g key={`rg${i}`}>
          <AirShadow A={W} X={m(g.x)} Z={Z} w={m(0.3)} d={m(0.18)} uid={`rg${i}s`} amt={0.7} />
          {g.kind === "sack" ? <RomeFolk.Sack at={at} scale={sc} uid={`rg${i}`} fog={W.folkFog(Z)} unitPx={W.k} /> : <RomeFolk.Amphora at={at} scale={sc} angle={g.angle} uid={`rg${i}`} fog={W.folkFog(Z)} unitPx={W.k} />}
        </g>
      ),
    });
  });
  if (inView((CART.x0 + CART.x1) / 2, CART.z0, 2.2)) items.push({ z: m((CART.z0 + CART.z1) / 2), node: <Cart key="cart" W={W} /> });
  if (inView(PORTER.x0 + 0.3, PORTER.z, 1)) items.push({ z: m(PORTER.z), node: <Porter key="porter" W={W} frame={frame} /> });
  if (inView((FARMER.x + MERCHANT.x) / 2, FARMER.z, 1.4)) items.push({ z: m(FARMER.z), node: <TradePair key="trade" W={W} frame={frame} /> });
  if (inView(SURVEYOR.x, SURVEYOR.z, 2)) items.push({ z: m(SURVEYOR.z), node: <SurveyorGroup key="surv" W={W} frame={frame} /> });
  if (inView(PIVOT.x - 0.4, PIVOT.z, 2.5)) items.push({ z: m(PIVOT.z), node: <StoneGroup key="stone" W={W} frame={frame} /> });
  if (inView(0, TABLE.z1, 1.6)) items.push({ z: m(TABLE.z1), node: <TableGroup key="table" W={W} frame={frame} /> });
  for (const pr of PROPS) {
    if (!inView(pr.x, pr.z, 0.5)) continue;
    const Z = m(pr.z);
    const at = W.sc(m(pr.x), 0, Z);
    const sc = W.P.r(Z);
    const Comp = pr.kind === "basket" ? RomeFolk.Basket : pr.kind === "sack" ? RomeFolk.Sack : RomeFolk.Amphora;
    items.push({
      z: Z,
      node: (
        <g key={pr.uid}>
          <AirShadow A={W} X={m(pr.x)} Z={Z} w={m(0.28)} d={m(0.16)} uid={`${pr.uid}s`} amt={0.7} />
          <Comp at={at} scale={sc} uid={pr.uid} fog={W.folkFog(Z)} unitPx={W.k} />
        </g>
      ),
    });
  }
  items.sort((a, b) => b.z - a.z);
  return <>{items.map((it) => it.node)}</>;
};

const PropertyAndContracts: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const e = eyeAt(camFrame >= 0 ? camFrame : frame);
  const W = worldOf(e, frame, true);
  return (
    <AirStage v={W.v} bloom={0}>
      <WorldSvg cam={W.cam}>
        <GroundLayer W={W} frame={frame} />
        <Walls W={W} />
      </WorldSvg>
      <GroundFog W={W} uid="gf" />
      <WorldSvg cam={W.cam}>
        <Hills W={W} />
        <Objects W={W} frame={frame} />
      </WorldSvg>
    </AirStage>
  );
};

export default PropertyAndContracts;

