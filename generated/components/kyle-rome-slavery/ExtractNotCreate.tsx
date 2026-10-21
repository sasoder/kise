// ---------------------------------------------------------------------------
// ExtractNotCreate (kyle-rome-slavery, cut 48). Dwarkesh map style (styles/dwarkesh-map.md), in the clip's 3D depth
// manner (London's DEPTH.md, the depth kit ../kyle-london/londonDepth, read only). Opaque 1080x1920, 29.97 fps, 186
// frames. People and props from ./romeCast (read only). World, camera and timelines: ./extractNotCreatePlan.ts.
//
// CHECK LINE: "The Roman master got rich fast by squeezing more out of his slaves — but the bigger, shared wealth a
// productive estate could have made for everyone was never built."
//
// THE LINE: "(The way the argument is usually made is just that, you know,) the Romans got rich without really
// thinking about productivity. They just wanted to extract labor, extract wealth (rather than create wealth)"
// WORD -> FRAME: know 1 · the 3 · Romans 5 · got 12 · rich 26 · without 36 · really 45 · thinking 53 · about 63 ·
// productivity 74 · They 100 · just 111 · wanted 116 · to 120 · extract 125 · labor 137 · extract 180 · (cut at 186)
// DURATION: the slot 48.982 -> 55.188 s = 6.206 s x 29.97 = 186 frames (f0..f185).
//
// THE MOTION: one camera in one-point perspective (a raised eye over a villa estate, one light from the upper left).
// f0-30 close on a rich Roman reclining with his wine cup beside his heap of coins as a line of slaves files past it,
// each tipping a sack: the first sacks pour torrents and the heap swells (f26 visibly bigger). From f24 one slow
// pull-back drifts right over the terrace and the field: the line comes in across the field, pours, and goes round
// behind the heap into the villa; an overseer with a vine rod keeps it moving. From f44 ("without really thinking
// about productivity") a fine dashed orange tip draws what the estate could have built: a water mill on the stream,
// its wheel whole and turning by "productivity" (f74); from f80 a village of houses and stalls with their goods is
// drawn round it, nearest first, at an exponential rate. From f100 the line is driven harder: the rod comes down
// on "extract" (contact f124, the line speeds up from f124, first reaction f125) and again on the second "extract"
// (f178); the slaves sink toward DEAD; every sack pours less (late pours are a trickle of coins), so the heap rises
// fast and then levels off, while the dashed estate keeps compounding past it. The last frame holds both: the solid
// cream heap and its master at the left, the larger dashed shared wealth at the right, the line between.
// CAUSE BEFORE EFFECT: every coin leaves a sack's mouth and lands on the heap 6 frames later; the heap's size is the
// coins that have landed. The village's houses are drawn by their own moving tips (nothing fades in).
// Orange = productive machinery and the wealth it would have created; DASHED orange = never built. The people, the
// master's heap (extracted wealth) and the estate are cream; the driven slaves sink toward DEAD #8A7B62.
//
// SOURCES: the argument as Harper paraphrases it (Roman elites extracted wealth through slave labour rather than
// investing in productivity), e.g. the "slavery blocked technology" thesis (M. I. Finley, The Ancient Economy,
// 1973); Harper himself does not buy it (the next cuts). The water mill after the Roman vertical undershot wheel
// (Vitruvius, De architectura X.5). Illustrative; no figures or text on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { Box, ContactShadow, DARK, GroundPlane, depthTint, perspective, tintInk, type Persp, type VolInk } from "../kyle-london/londonDepth";
import {
  CREAM,
  Couch,
  Dominus,
  Overseer,
  POSES,
  Slave,
  gripTo,
  headTurn,
  idle,
  lerpFig,
  mixInk,
  reclineAt,
  romeAnchors,
  walkPose,
  type FigPose,
  type Ink,
} from "./romeCast";
import {
  COIN_FLIGHT,
  COIN_LEAVE,
  COIN_N,
  COIN_POUR,
  COUCH_X,
  COUCH_Z,
  DEPTH,
  DURATION as PLAN_DURATION,
  HEAP_C,
  HEAVE,
  HILL_Z0,
  HILL_Z1,
  hillH,
  HOUSES,
  MILL,
  MILL_DUR,
  MILL_T0,
  OVERSEER,
  PATH_LEN,
  PODIUM_H,
  PODIUM_Z,
  POUR,
  SLAVE_J0,
  SLAVE_J1,
  STREAM_Z,
  S_DOOR,
  S_POUR,
  TERRACE_EDGE,
  VILLA,
  camAt,
  hash,
  heapAmount,
  heapH,
  heapW,
  pathAt,
  rodAt,
  sinkAt,
  slaveS,
  wheelAngle,
  type Cam,
  type House,
  type P2,
  type P3,
} from "./extractNotCreatePlan";

export const FPS = 30000 / 1001;
export const DURATION = 186;
if (PLAN_DURATION !== DURATION) throw new Error("plan / component DURATION mismatch");
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ORANGE_HEX = "#FFB000";
const DEAD_INK: Ink = { main: "#8A7B62", deep: "#76684F", hair: "#54493A" };
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const fx = (v: number) => v.toFixed(2);
const pt = (v: P2) => `${fx(v[0])},${fx(v[1])}`;
const lerp2 = (a: P2, b: P2, t: number): P2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];

/** a smooth closed path through points (Catmull-Rom as cubic Beziers) */
const smoothClosed = (q: P2[]) => {
  const n = q.length;
  let d = `M${pt(q[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n];
    const p1 = q[i];
    const p2 = q[(i + 1) % n];
    const p3 = q[(i + 2) % n];
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return `${d}Z`;
};
/** parallel hatch lines over a box (clip them yourself) */
const hatchBox = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number) => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = "";
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.4;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    d += `M${pt([px - dx * R, py - dy * R])}L${pt([px + dx * R, py + dy * R])}`;
  }
  return d;
};
const poly = (P: Persp, q: P3[]) => `M${q.map((v) => pt(P.p(v[0], v[1], v[2]))).join("L")}Z`;

// ---------------------------------------------------------------------------
// THE GROUND: the terrace (flags), the field (furrows to the VP), the stream, the meadow beyond
// ---------------------------------------------------------------------------
/** the hill: its slope faces us (lighter umber), vineyard terraces in faint cream along it, the ridge against the page;
 *  the mill's leat runs along it (real water) */
const HILL_FILL = "#524433";
const Hill: React.FC<{ P: Persp; f: number }> = ({ P, f }) => {
  const X0 = -4200;
  const X1 = 4600;
  const NX = 64;
  const hp = (X: number, Z: number) => P.p(X, -hillH(X, Z), Z);
  const xs = Array.from({ length: NX + 1 }, (_, i) => mix(X0, X1, i / NX));
  const ridge = xs.map((X) => hp(X, HILL_Z1));
  const foot = xs.map((X) => P.p(X, 0, HILL_Z0));
  const body = `M${foot.map(pt).join("L")}L${[...ridge].reverse().map(pt).join("L")}Z`;
  let ter = "";
  const NT = 12;
  for (let i = 1; i < NT; i++) {
    const Z = mix(HILL_Z0, HILL_Z1, Math.pow(i / NT, 0.9));
    ter += `M${xs.map((X) => pt(hp(X, Z))).join("L")}`;
  }
  let fall = "";
  for (let X = -4000; X <= 4400; X += 260) {
    const q: string[] = [];
    for (let i = 0; i <= 10; i++) q.push(pt(hp(X, mix(HILL_Z0, HILL_Z1, i / 10))));
    fall += `M${q.join("L")}`;
  }
  // the leat along the hill
  const z0 = STREAM_Z - 22;
  const z1 = STREAM_Z + 22;
  const bankA = xs.map((X) => hp(X, z0));
  const bankB = xs.map((X) => hp(X, z1));
  const water = `M${bankA.map(pt).join("L")}L${[...bankB].reverse().map(pt).join("L")}Z`;
  let rip = "";
  for (let i = 0; i < 60; i++) {
    const X = X0 + (((i * 151 + hash(i, 61) * 80 - f * 2.2) % (X1 - X0)) + (X1 - X0)) % (X1 - X0);
    const Z = mix(z0 + 8, z1 - 8, hash(i, 63));
    rip += `M${pt(hp(X, Z))}L${pt(hp(X + 46 + 30 * hash(i, 65), Z))}`;
  }
  const rr = P.r(HILL_Z1);
  const rs = P.r(STREAM_Z);
  return (
    <g>
      <path d={body} fill={HILL_FILL} />
      <path d={fall} fill="none" stroke={DARK} strokeWidth={1.8 * P.r(2200)} strokeOpacity={0.4} />
      <path d={ter} fill="none" stroke="#E9DDBF" strokeWidth={1.5 * P.r(2200)} strokeOpacity={0.17} />
      <path d={`M${ridge.map(pt).join("L")}`} fill="none" stroke="#E9DDBF" strokeWidth={2.6 * rr} strokeOpacity={0.42} />
      <path d={water} fill="#1B2226" opacity={0.92} />
      <path d={rip} fill="none" stroke="#E9DDBF" strokeWidth={1.4 * rs} strokeOpacity={0.35} strokeLinecap="round" />
      <path d={`M${bankA.map(pt).join("L")}M${bankB.map(pt).join("L")}`} fill="none" stroke={DARK} strokeWidth={2.4 * rs} />
    </g>
  );
};
const Ground: React.FC<{ P: Persp; f: number }> = ({ P, f }) => {
  const terrace = poly(P, [
    [-3000, 0, PODIUM_Z],
    [3600, 0, PODIUM_Z],
    [3600, 0, TERRACE_EDGE],
    [0, 0, TERRACE_EDGE],
    [0, 0, VILLA.z0],
    [-3000, 0, VILLA.z0],
  ]);
  // the field: beyond the terrace, up to the hill's foot
  const fieldD = poly(P, [
    [-3000, 0, VILLA.z0],
    [0, 0, VILLA.z0],
    [0, 0, TERRACE_EDGE],
    [4200, 0, TERRACE_EDGE],
    [4200, 0, HILL_Z0],
    [-3000, 0, HILL_Z0],
  ]);
  const fade = (Z: number) => 1 - 0.5 * c01((Z - 600) / 1000);
  // furrows: lines along Z (to the VP), in depth pieces that fade and thin; every other strip a lighter soil
  const pieces = 16;
  const zAt = (i: number) => mix(TERRACE_EDGE, HILL_Z0, Math.pow(i / pieces, 1.3));
  const furrows: React.ReactNode[] = [];
  const strips: React.ReactNode[] = [];
  const STEP = 46;
  for (let i = 0; i < pieces; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const a = fade((za + zb) / 2);
    let d = "";
    let ds = "";
    let n = 0;
    for (let X = -3000; X <= 4200; X += STEP, n++) {
      d += `M${pt(P.p(X, 0, za))}L${pt(P.p(X, 0, zb))}`;
      if (n % 2 === 0) ds += `M${[P.p(X, 0, za), P.p(X + STEP, 0, za), P.p(X + STEP, 0, zb), P.p(X, 0, zb)].map(pt).join("L")}Z`;
    }
    strips.push(<path key={`s${i}`} d={ds} fill="#6A5838" opacity={0.36 * a} />);
    furrows.push(<path key={`f${i}`} d={d} fill="none" stroke={DARK} strokeWidth={2.4 * P.r((za + zb) / 2)} strokeOpacity={0.6 * a} />);
  }
  // the lower ground in front of the podium (PODIUM_H below the terrace)
  const low: Persp = { ...P, p: (X, Y, Z) => P.p(X, Y + PODIUM_H, Z) };
  return (
    <g>
      <defs>
        <clipPath id="eg-ter">
          <path d={terrace} />
        </clipPath>
        <clipPath id="eg-fld">
          <path d={fieldD} />
        </clipPath>
      </defs>
      <Hill P={P} f={f} />
      <g clipPath="url(#eg-fld)">
        {strips}
        {furrows}
      </g>
      <g clipPath="url(#eg-ter)">
        <GroundPlane P={P} kind="flags" x0={-3000} x1={3600} z0={PODIUM_Z} zFar={2600} course={150} uid="eg-tergp" />
      </g>
      <GroundPlane P={low} kind="flags" x0={-3000} x1={3600} z0={-1400} zFar={PODIUM_Z + 400} course={190} uid="eg-lowgp" tone={0.7} />
    </g>
  );
};
/** the podium's front wall (dark umber ashlar in cream line), its cornice, a few barred vents of the cells under it */
const Podium: React.FC<{ P: Persp }> = ({ P }) => {
  const z = PODIUM_Z;
  const r = P.r(z);
  const cream = "#E9DDBF";
  const X0 = -3000;
  const X1 = 3600;
  let courses = "";
  const CH = 58;
  for (let Y = 14 + CH, row = 0; Y < PODIUM_H; Y += CH, row++) {
    courses += `M${pt(P.p(X0, Y, z - 1))}L${pt(P.p(X1, Y, z - 1))}`;
    for (let X = X0 + (row % 2) * 70; X < X1; X += 140) courses += `M${pt(P.p(X, Y - CH, z - 1))}L${pt(P.p(X, Y, z - 1))}`;
  }
  const vents: React.ReactNode[] = [];
  for (let X = -1500; X < 3000; X += 760) {
    const q: P3[] = [[X, 250, z - 1], [X + 90, 250, z - 1], [X + 90, 320, z - 1], [X, 320, z - 1]];
    let bars = "";
    for (let b = 1; b < 4; b++) bars += `M${pt(P.p(X + b * 22.5, 250, z - 1.5))}L${pt(P.p(X + b * 22.5, 320, z - 1.5))}`;
    vents.push(
      <g key={X}>
        <path d={poly(P, q)} fill="#100C08" stroke={DARK} strokeWidth={2.4 * r} />
        <path d={bars} stroke={cream} strokeOpacity={0.45} strokeWidth={3 * r} />
      </g>,
    );
  }
  return (
    <g>
      <Box P={P} X0={X0} X1={X1} Y0={0} Y1={PODIUM_H} Z0={z} Z1={z + 60} ink={WALL} uid="epo-w" />
      <path d={courses} fill="none" stroke={cream} strokeOpacity={0.16} strokeWidth={1.6 * r} />
      {vents}
      {/* the cornice: a lit moulding along the terrace's edge */}
      <Box P={P} X0={X0} X1={X1} Y0={-10} Y1={16} Z0={z - 16} Z1={z + 4} ink={STONE} uid="epo-c" hatch={false} />
      <path d={`M${pt(P.p(X0, 18, z - 1))}L${pt(P.p(X1, 18, z - 1))}`} stroke={cream} strokeOpacity={0.35} strokeWidth={1.8 * r} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE VILLA (dark umber planes in cream line), its door; the terrace kerb
// ---------------------------------------------------------------------------
const WALL: VolInk = { lit: "#5E4D38", mid: "#3A2F23", dark: "#1E1813" };
const STONE: VolInk = { lit: "#7A6A50", mid: "#56483A", dark: "#2E251B" };
const ROOF_FILL = "#2B231A";
const doorQuad = (P: Persp): P3[] => [
  [VILLA.door.x0, 0, VILLA.z0],
  [VILLA.door.x1, 0, VILLA.z0],
  [VILLA.door.x1, -VILLA.door.h, VILLA.z0],
  [VILLA.door.x0, -VILLA.door.h, VILLA.z0],
];
const Villa: React.FC<{ P: Persp }> = ({ P }) => {
  const V = VILLA;
  const zm = (V.z0 + V.z1) / 2;
  const eaveF = V.z0 - 34;
  const eaveB = V.z1 + 34;
  const ov = 30;
  const roofF: P3[] = [
    [V.x0 - ov, -V.h, eaveF],
    [V.x1 + ov, -V.h, eaveF],
    [V.x1 + ov, -V.ridge, zm],
    [V.x0 - ov, -V.ridge, zm],
  ];
  const roofB: P3[] = [
    [V.x0 - ov, -V.ridge, zm],
    [V.x1 + ov, -V.ridge, zm],
    [V.x1 + ov, -V.h, eaveB],
    [V.x0 - ov, -V.h, eaveB],
  ];
  const gable: P3[] = [
    [V.x1 + ov, -V.h, eaveF],
    [V.x1 + ov, -V.ridge, zm],
    [V.x1 + ov, -V.h, eaveB],
  ];
  // tile courses (along the slope) and the rows (across)
  let tiles = "";
  for (let X = V.x0; X <= V.x1 + ov; X += 34) tiles += `M${pt(P.p(X, -V.h, eaveF))}L${pt(P.p(X, -V.ridge, zm))}`;
  for (let i = 1; i < 6; i++) {
    const u = i / 6;
    tiles += `M${pt(P.p(V.x0 - ov, mix(-V.h, -V.ridge, u), mix(eaveF, zm, u)))}L${pt(P.p(V.x1 + ov, mix(-V.h, -V.ridge, u), mix(eaveF, zm, u)))}`;
  }
  const r = P.r(V.z0);
  const cream = "#E9DDBF";
  const d = V.door;
  // the cornice, the door's frame, a band of small high windows
  const line = (a: P3, b: P3) => `M${pt(P.p(a[0], a[1], a[2]))}L${pt(P.p(b[0], b[1], b[2]))}`;
  let trim = line([V.x0, -V.h + 18, V.z0], [V.x1, -V.h + 18, V.z0]) + line([V.x0, -22, V.z0], [V.x1, -22, V.z0]);
  trim += line([d.x0 - 14, 0, V.z0], [d.x0 - 14, -d.h - 14, V.z0]) + line([d.x0 - 14, -d.h - 14, V.z0], [d.x1 + 14, -d.h - 14, V.z0]) + line([d.x1 + 14, -d.h - 14, V.z0], [d.x1 + 14, 0, V.z0]);
  const wins: React.ReactNode[] = [];
  for (let X = V.x0 + 120; X < V.x1 - 60; X += 190) {
    if (X > d.x0 - 120 && X < d.x1 + 40) continue;
    wins.push(<path key={X} d={poly(P, [[X, -300, V.z0], [X + 46, -300, V.z0], [X + 46, -232, V.z0], [X, -232, V.z0]])} fill={DARK} stroke={cream} strokeOpacity={0.45} strokeWidth={1.6 * r} />);
  }
  return (
    <g>
      <Box P={P} X0={V.x0} X1={V.x1} Y0={-V.h} Y1={0} Z0={V.z0} Z1={V.z1} ink={WALL} uid="ev-box" />
      <path d={poly(P, roofB)} fill={ROOF_FILL} stroke={DARK} strokeWidth={2.4 * r} />
      {P.vp[0] > V.x1 + ov ? <path d={poly(P, gable)} fill={WALL.mid} stroke={DARK} strokeWidth={2.4 * r} /> : null}
      <path d={poly(P, roofF)} fill={ROOF_FILL} stroke={DARK} strokeWidth={2.4 * r} />
      <path d={tiles} fill="none" stroke={cream} strokeOpacity={0.22} strokeWidth={1.3 * r} />
      <path d={line(roofF[0], roofF[1]) + line(roofF[3], roofF[2])} fill="none" stroke={cream} strokeOpacity={0.5} strokeWidth={1.8 * r} />
      <path d={trim} fill="none" stroke={cream} strokeOpacity={0.45} strokeWidth={1.8 * r} />
      {wins}
      {/* the door: the dark interior */}
      <path d={poly(P, doorQuad(P))} fill="#100C08" stroke={DARK} strokeWidth={2.4 * r} />
    </g>
  );
};
const Kerb: React.FC<{ P: Persp }> = ({ P }) => (
  <g>
    <Box P={P} X0={0} X1={170} Y0={-24} Y1={0} Z0={TERRACE_EDGE - 16} Z1={TERRACE_EDGE + 6} ink={STONE} uid="ek-a" hatch={false} />
    <Box P={P} X0={440} X1={4200} Y0={-24} Y1={0} Z0={TERRACE_EDGE - 16} Z1={TERRACE_EDGE + 6} ink={STONE} uid="ek-b" hatch={false} />
  </g>
);

// ---------------------------------------------------------------------------
// THE HEAP: a dome of coins (cream: extracted wealth) that grows only by the coins that land on it
// ---------------------------------------------------------------------------
type CoinSpot = { u: number; t: number; H: number; W: number; tilt: number };
/** the heap's silhouette top at u (-1..1 across): a rounded cone */
const heapTopY = (H: number, u: number) => -H * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 1.6)), 1.25) - 2;
/** coin i's place on the heap's face, fixed as the heap was when it landed: u across (-1..1), t down the face from
 *  the silhouette top (0) to the front of the base (1). It lands near the top (T_LAND) and slides down to t. */
const COIN_SPOT: CoinSpot[] = Array.from({ length: COIN_N }, (_, i) => {
  const v = (i + 0.5) / COIN_N;
  const H = heapH(v);
  const W = heapW(H);
  const u = (2 * hash(i, 701) - 1) * 0.94;
  const t = Math.sqrt(hash(i, 705)) * 0.96;
  return { u, t, H, W, tilt: (hash(i, 707) - 0.5) * 34 + u * 12 };
});
const T_LAND = 0.12;
const COIN_SLIDE = 6;
/** a face point (heap-local) at (u, t) of a heap H, W seen with base openness o */
const facePt = (H: number, W: number, o: number, u: number, t: number): P2 => {
  const top = heapTopY(H, u);
  const front = W * o * Math.sqrt(Math.max(0, 1 - u * u)) - 5;
  return [u * W, mix(top + 4, front, t)];
};
const heapXform = (P: Persp) => {
  const at = P.p(HEAP_C[0], 0, HEAP_C[1]);
  const r = P.r(HEAP_C[1]);
  return { at, r };
};
/** the base ellipse's openness (ry / rx) of a disc on the floor at the heap */
const heapOpen = (P: Persp, W: number) => {
  const a = P.p(HEAP_C[0], 0, HEAP_C[1] - W)[1];
  const b = P.p(HEAP_C[0], 0, HEAP_C[1] + W)[1];
  return (a - b) / 2 / (W * P.r(HEAP_C[1]));
};
/** coin i's heap-local place g frames after it landed (sliding from near the top to its rest) */
const coinLocal = (i: number, o: number, g = 99): P2 => {
  const c = COIN_SPOT[i];
  const e = c01(g / COIN_SLIDE);
  return facePt(c.H, c.W, o, c.u, mix(Math.min(c.t, T_LAND), c.t, e * e));
};
const Coin: React.FC<{ x: number; y: number; tilt: number; ink: Ink; lit: boolean; k?: number }> = ({ x, y, tilt, ink, lit, k = 1 }) => (
  <g transform={`translate(${fx(x)} ${fx(y)}) rotate(${tilt.toFixed(1)}) scale(${k.toFixed(3)})`}>
    <ellipse cx={0} cy={2.2} rx={9.5} ry={3.6} fill={ink.hair} stroke={DARK} strokeWidth={1.6} />
    <ellipse cx={0} cy={0} rx={9.5} ry={3.6} fill={lit ? ink.main : ink.deep} stroke={DARK} strokeWidth={1.6} />
  </g>
);
const Heap: React.FC<{ P: Persp; f: number; ink: Ink }> = ({ P, f, ink }) => {
  const amt = heapAmount(f);
  const H = heapH(amt);
  const W = heapW(H);
  const o = heapOpen(P, W);
  const { at, r } = heapXform(P);
  const dome: P2[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = -1 + (2 * i) / 24;
    dome.push([u * W, heapTopY(H, u)]);
  }
  for (let i = 1; i < 12; i++) {
    const u = 1 - (2 * i) / 12;
    dome.push([u * W, W * o * Math.sqrt(Math.max(0, 1 - u * u)) - 2]);
  }
  const domeD = smoothClosed(dome);
  const landed: { i: number; x: number; y: number }[] = [];
  for (let i = 0; i < COIN_N; i++) {
    const land = COIN_LEAVE[i] + COIN_FLIGHT;
    if (land > f) break;
    const [x, y] = coinLocal(i, o, f - land);
    landed.push({ i, x, y });
  }
  // nearer (lower on the face) coins over farther ones
  landed.sort((a, b) => a.y - b.y);
  // the form shadow: the right of the heap, away from the light
  const shadeD = `M${fx(W * 0.18)},${fx(-H - 10)}C${fx(W * 0.5)},${fx(-H * 0.4)} ${fx(W * 0.42)},${fx(W * o * 0.4)} ${fx(W * 0.3)},${fx(W * o + 10)}L${fx(W + 12)},${fx(W * o + 10)}L${fx(W + 12)},${fx(-H - 10)}Z`;
  return (
    <g transform={`translate(${pt(at)}) scale(${r.toFixed(5)})`}>
      <clipPath id="eh-dome">
        <path d={domeD} />
      </clipPath>
      <path d={domeD} fill={DARK} stroke={DARK} strokeWidth={7} strokeOpacity={0.55} />
      <path d={domeD} fill={ink.deep} stroke={DARK} strokeWidth={2.2} />
      {landed.map((c) => (
        <Coin key={c.i} x={c.x} y={c.y} tilt={COIN_SPOT[c.i].tilt} ink={ink} lit={hash(c.i, 709) > 0.35} />
      ))}
      <g clipPath="url(#eh-dome)">
        <path d={shadeD} fill={DARK} opacity={0.3} />
        <path d={hatchBox(W * 0.2, -H - 6, W + 6, W * o + 6, 112, 3.4, 905)} fill="none" stroke={DARK} strokeWidth={1} strokeOpacity={0.4} clipPath="url(#eh-shd)" />
      </g>
      <clipPath id="eh-shd">
        <path d={shadeD} />
      </clipPath>
      <path d={domeD} fill="none" stroke={DARK} strokeWidth={2.2} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BAG (drawn here so it can come off the shoulder and pour): a coarse sack with a gathered, tied neck and a
// sagging bottom, carried over the shoulder by its neck. Local units: the neck (the tie) at (0, 0), the bag hanging
// along + y to its bottom at y = BAG_L. `ang` = the direction (deg, screen) from the neck to the bottom.
// ---------------------------------------------------------------------------
const BAG_L = 84;
/** the bag's half-width down its length (t = 0 the tie .. 1 the bottom), full and emptied */
const BAG_W: [number, number][] = [[0, 5], [0.1, 6], [0.22, 15], [0.4, 26], [0.62, 31], [0.8, 30], [0.92, 23], [1, 10]];
type BagX = { A: P2; ang: number; sc: number; empty: number; open: number };
const bagRot = (x: BagX) => ((x.ang - 90) * Math.PI) / 180;
/** a bag-local point in the world */
const bagPt = (x: BagX, p: P2): P2 => {
  const a = bagRot(x);
  const lx = p[0] * x.sc;
  const ly = p[1] * x.sc;
  return [x.A[0] + lx * Math.cos(a) - ly * Math.sin(a), x.A[1] + lx * Math.sin(a) + ly * Math.cos(a)];
};
const bagOutline = (empty: number): P2[] => {
  const L = BAG_L * (1 + 0.1 * empty);
  const right: P2[] = [];
  const left: P2[] = [];
  BAG_W.forEach(([t, w], i) => {
    const ww = w * (1 - 0.55 * empty) + (empty > 0 ? empty * 3 * Math.sin(i * 2.1) : 0);
    // the full bag sags: its lower half bulges a little to the side it hangs from
    right.push([ww + 3 * t * (1 - empty), t * L]);
    left.push([-ww + 3 * t * (1 - empty), t * L]);
  });
  // the sagging bottom
  const bottom: P2 = [2, L + 6 * (1 - empty)];
  return [...right, bottom, ...left.reverse()];
};
const BagArt: React.FC<{ x: BagX; ink: Ink; uid: string }> = ({ x, ink, uid }) => {
  const D = smoothClosed(bagOutline(x.empty));
  const burlap = mixInk({ main: ink.deep, deep: ink.deep, hair: ink.deep }, { main: ink.hair, deep: ink.hair, hair: ink.hair }, 0.42).main;
  const lit = mixInk({ main: ink.deep, deep: ink.deep, hair: ink.deep }, ink, 0.5).main;
  const L = BAG_L * (1 + 0.1 * x.empty);
  return (
    <g transform={`translate(${pt(x.A)}) rotate(${(x.ang - 90).toFixed(2)}) scale(${x.sc.toFixed(4)})`}>
      <clipPath id={`${uid}-k`}>
        <path d={D} />
      </clipPath>
      <path d={D} fill="none" stroke={DARK} strokeWidth={6} strokeOpacity={0.5} />
      <path d={D} fill={burlap} stroke={DARK} strokeWidth={2.4} strokeLinejoin="round" />
      <g clipPath={`url(#${uid}-k)`}>
        {/* the lit flank, the weave, the folds gathered toward the neck */}
        <ellipse cx={-10} cy={L * 0.55} rx={12 * (1 - 0.5 * x.empty)} ry={L * 0.3} fill={lit} opacity={0.75} />
        <path d={hatchBox(-40, 0, 40, L + 10, 22, 4, 781)} fill="none" stroke={DARK} strokeWidth={0.9} strokeOpacity={0.35} />
        <path d={hatchBox(4, L * 0.15, 40, L + 10, 112, 2.6, 783)} fill="none" stroke={DARK} strokeWidth={0.9} strokeOpacity={0.5} />
        <path d={`M-3,${fx(L * 0.12)}Q-12,${fx(L * 0.4)} -14,${fx(L * 0.7)}M2,${fx(L * 0.12)}Q6,${fx(L * 0.45)} 12,${fx(L * 0.75)}`} fill="none" stroke={DARK} strokeWidth={1.3} strokeOpacity={0.55} />
      </g>
      {x.open > 0.02 ? (
        // untied: the neck flares open (its mouth is the lowest point when it pours)
        <g>
          <path d={`M-6,4L${fx(-6 - 5 * x.open)},-7L${fx(6 + 5 * x.open)},-7L6,4Z`} fill={burlap} stroke={DARK} strokeWidth={2} strokeLinejoin="round" />
          <ellipse cx={0} cy={-7} rx={6 + 5 * x.open} ry={3 * x.open} fill="#100C08" stroke={DARK} strokeWidth={1.6} />
        </g>
      ) : (
        <g>
          {/* the gathered tuft above the tie, and the cord */}
          <path d="M-7,-12L-3,-5L0,-13L3,-5L8,-11L5,2L-5,2Z" fill={burlap} stroke={DARK} strokeWidth={1.8} strokeLinejoin="round" />
          <path d="M-7,2L7,2L6,7L-6,7Z" fill="#2B231A" stroke={DARK} strokeWidth={1.4} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CARRYING LINE: slave j walks the path at slaveS(j, f); loaded (the bag over the near shoulder, held by its neck),
// the heave (swung forward, the neck down), the pour, then empty (hanging limp from the far hand)
// ---------------------------------------------------------------------------
const STRIDE = 62;
const LOADED_BASE = POSES.carry(-1, 0, 0);
const EMPTY_BASE = POSES.walk(-1, 0, 0);
/** where the bag's neck is while pouring (figure-local units; he faces left, so his front is - x) */
const POUR_A: P2 = [-90, -168];
const POUR_ANG = -62;
/** over the shoulder: the bag hangs down his back, its tied neck over the near shoulder in the near fist; CARRY_A is
 *  the neck relative to the near shoulder (units, facing left: + x is behind him) */
const CARRY_ANG = 74;
const CARRY_A: P2 = [24, -30];
/** the grips while pouring (bag-local): the near hand at the neck, the far hand under the bottom */
const GRIP_NECK: P2 = [0, 9];
const GRIP_BOTTOM: P2 = [6, BAG_L * 0.86];
const MOUTH: P2 = [0, -9];
/** men only on this line (romeCast slave variants 0, 1, 2, 4) */
const slaveLook = (j: number) => {
  const m = ((j % 8) + 8) % 8;
  const variant = [0, 1, 2, 4, 1, 0, 4, 2][m];
  return { variant, garb: (m % 3 === 1 ? "exomis" : "tunic") as "exomis" | "tunic", fetters: m % 2 === 0, collar: m % 4 === 3 };
};
type SlaveState = {
  j: number;
  s: number;
  X: number;
  Z: number;
  at: P2;
  scale: number;
  pose: FigPose;
  bag: BagX;
  bagFront: boolean;
  look: ReturnType<typeof slaveLook>;
};
const walkFrom = (base: FigPose, s: number, yaw: number, keepNear: boolean): FigPose => {
  const w = walkPose(base, s / (2 * STRIDE), 1, STRIDE);
  const q: FigPose = keepNear ? { ...w, armR: base.armR } : w;
  return { ...q, yaw: -yaw, headYaw: -yaw * 0.94 };
};
/** the bag's transform while pouring (feet at `at`, scale sc, w = 0..1 through the pour) */
const pourBag = (at: P2, sc: number, w: number): BagX => ({
  A: [at[0] + POUR_A[0] * sc, at[1] + (POUR_A[1] + 4 * Math.sin(w * Math.PI * 4)) * sc],
  ang: POUR_ANG - 8 * Math.sin(Math.PI * c01(w)),
  sc,
  empty: smooth(w * 1.15),
  open: 1,
});
const slaveState = (j: number, f: number, P: Persp): SlaveState | null => {
  const s = slaveS(j, f);
  if (s < 0 || s > PATH_LEN - 2) return null;
  const p = pathAt(s);
  const { at, scale } = P.at(p.X, p.Z);
  const look = slaveLook(j);
  const yaw = mix(0.86, 1.28, smooth((s - (S_POUR + POUR)) / 230));
  const sink = sinkAt(f);
  const h0 = S_POUR - HEAVE;
  const p1 = S_POUR + POUR;
  const anchorsOf = (q: FigPose, grip?: { L?: P2; R?: P2 }) => romeAnchors("slave", q, at, scale, { variant: look.variant, grip });
  // bent under the load: always a little bowed, more as they are driven
  const bow = (q: FigPose) => lerpFig(q, POSES.bowed(q), 0.45 + 0.55 * c01(sink / 0.5));
  const base = { j, s, X: p.X, Z: p.Z, at, scale, look };
  /** the bag on his back: the neck just over the near shoulder, the near fist on it */
  const carryBag = (q: FigPose): BagX => {
    const a = anchorsOf(q);
    const sh = a.shoulderR;
    return { A: [sh[0] + CARRY_A[0] * scale, sh[1] + CARRY_A[1] * scale + 3 * scale * Math.sin((s / (2 * STRIDE)) * 4 * Math.PI)], ang: CARRY_ANG, sc: scale, empty: 0, open: 0 };
  };
  if (s < h0) {
    const q0 = bow(walkFrom(LOADED_BASE, s, yaw, true));
    const bag = carryBag(q0);
    const q = gripTo("slave", look.variant, q0, { R: bagPt(bag, GRIP_NECK) }, at, scale);
    return { ...base, pose: q, bag, bagFront: false };
  }
  if (s < p1) {
    const qLegs = bow(walkFrom(LOADED_BASE, s, yaw, true));
    if (s < S_POUR) {
      // the heave: the near fist brings the neck forward and down, the bottom swings up behind, the far hand takes the neck
      // the near fist brings the neck forward and down over the shoulder, the bottom swings up behind and the far
      // hand comes up under it
      const u = (s - h0) / HEAVE;
      const e = smooth(u);
      const c = carryBag(qLegs);
      const Ap: P2 = [at[0] + POUR_A[0] * scale, at[1] + POUR_A[1] * scale];
      const A = lerp2(c.A, Ap, e);
      A[1] -= 26 * scale * Math.sin(Math.PI * e);
      const bag: BagX = { A, ang: mix(CARRY_ANG, POUR_ANG, e), sc: scale, empty: 0, open: smooth((u - 0.6) / 0.4) };
      const neck = bagPt(bag, GRIP_NECK);
      const bottom = bagPt(bag, GRIP_BOTTOM);
      const qg = gripTo("slave", look.variant, qLegs, { R: neck, L: bottom }, at, scale);
      const free = gripTo("slave", look.variant, qLegs, { R: neck }, at, scale);
      return { ...base, pose: lerpFig(free, qg, smooth((u - 0.2) / 0.5)), bag, bagFront: e > 0.35 };
    }
    const bag = pourBag(at, scale, (s - S_POUR) / POUR);
    const pose = gripTo("slave", look.variant, qLegs, { R: bagPt(bag, GRIP_NECK), L: bagPt(bag, GRIP_BOTTOM) }, at, scale);
    return { ...base, pose, bag, bagFront: true };
  }
  // empty: the near fist keeps the neck and lets the limp bag swing down at his side; the far hand lets go
  const e = smooth((s - p1) / 34);
  const qFree = bow(walkFrom(EMPTY_BASE, s, yaw, false));
  const aFree = anchorsOf(qFree);
  const bp = pourBag(at, scale, 1);
  const nearT = lerp2(bagPt(bp, GRIP_NECK), aFree.handR, e);
  const farT = lerp2(bagPt(bp, GRIP_BOTTOM), aFree.handL, e);
  const pose = e < 1 ? gripTo("slave", look.variant, qFree, { L: farT, R: nearT }, at, scale) : qFree;
  const hand = e < 1 ? nearT : aFree.handR;
  const swing = 8 * Math.sin((s / (2 * STRIDE)) * 2 * Math.PI);
  const bag: BagX = { A: hand, ang: mix(POUR_ANG, 90 + swing, e), sc: scale, empty: 1, open: 0.5 };
  return { ...base, pose, bag, bagFront: false };
};
const slaveInk = (Z: number, f: number) => tintInk(mixInk(CREAM, DEAD_INK, sinkAt(f)), depthTint(Z, { far: 1500, min: 0.58 }));
const SlaveFig: React.FC<{ st: SlaveState; f: number; withBag: boolean }> = ({ st, f, withBag }) => {
  const ink = slaveInk(st.Z, f);
  // on his back the bag is behind his body (the near fist over its neck); emptied, it hangs from the near fist in front
  const after = st.s > S_POUR + POUR;
  const bag = withBag ? <BagArt x={st.bag} ink={ink} uid={`esk${st.j}`} /> : null;
  return (
    <g>
      {after ? null : bag}
      <Slave pose={st.pose} at={st.at} scale={st.scale} uid={`esl${st.j}`} variant={st.look.variant} garb={st.look.garb} fetters={st.look.fetters} collar={st.look.collar} ink={ink} cloth={ink} shade={1} />
      {after ? bag : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE COINS IN FLIGHT: from the bag's mouth (where it was when the coin left) to its place on the heap
// ---------------------------------------------------------------------------
const mouthAt = (j: number, t: number, P: Persp): P2 => {
  const s = slaveS(j, t);
  const p = pathAt(s);
  const { at, scale } = P.at(p.X, p.Z);
  return bagPt(pourBag(at, scale, (s - S_POUR) / POUR), MOUTH);
};
const FlyingCoins: React.FC<{ P: Persp; f: number; ink: Ink }> = ({ P, f, ink }) => {
  const amt = heapAmount(f);
  const W = heapW(heapH(amt));
  const o = heapOpen(P, W);
  const { at, r } = heapXform(P);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < COIN_N; i++) {
    const t = COIN_LEAVE[i];
    if (!(t <= f && f < t + COIN_FLIGHT)) continue;
    const j = COIN_POUR[i];
    if (j === null) continue;
    const u = (f - t) / COIN_FLIGHT;
    const a = mouthAt(j, t, P);
    const [lx, ly] = coinLocal(i, o, 0);
    const b: P2 = [at[0] + lx * r, at[1] + ly * r];
    const x = mix(a[0], b[0], u) + (hash(i, 811) - 0.5) * 10 * r * Math.sin(Math.PI * u);
    const y = mix(a[1], b[1], u * u);
    out.push(<Coin key={i} x={x} y={y} tilt={(hash(i, 813) - 0.5) * 140 + 200 * u} ink={ink} lit={hash(i, 815) > 0.4} k={r} />);
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// THE ALTERNATIVE: fine dashed orange outlines drawn by moving tips (perspective-correct dashes in 3D)
// ---------------------------------------------------------------------------
type Line3 = P3[];
/** the faces' fills, in the order houseLines gives them (side wall, far roof slope, near roof slope, front): the
 *  hill's tone, lit from the upper left */
const FACE_FILL = ["#463A2B", "#3E3326", "#5A4B38", "#4F4231"];
const DASH = 24;
const GAP = 15;
const lenOf = (l: Line3) => {
  let s = 0;
  for (let i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1], l[i][2] - l[i - 1][2]);
  return s;
};
const at3 = (l: Line3, s: number): P3 => {
  let acc = 0;
  for (let i = 1; i < l.length; i++) {
    const L = Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1], l[i][2] - l[i - 1][2]);
    if (acc + L >= s || i === l.length - 1) {
      const u = L > 0 ? c01((s - acc) / L) : 0;
      return [mix(l[i - 1][0], l[i][0], u), mix(l[i - 1][1], l[i][1], u), mix(l[i - 1][2], l[i][2], u)];
    }
    acc += L;
  }
  return l[l.length - 1];
};
/** the dashes of a 3D polyline drawn up to length upTo, projected */
const dashes = (P: Persp, l: Line3, upTo: number, dash = DASH, gap = GAP) => {
  const L = Math.min(upTo, lenOf(l));
  let d = "";
  // the vertices' arc lengths, so a dash keeps its corners
  const cum: number[] = [0];
  for (let i = 1; i < l.length; i++) cum.push(cum[i - 1] + Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1], l[i][2] - l[i - 1][2]));
  for (let a = 0; a < L; a += dash + gap) {
    const b = Math.min(L, a + dash);
    const q: P3[] = [at3(l, a)];
    for (let i = 1; i < l.length - 1; i++) if (cum[i] > a && cum[i] < b) q.push(l[i]);
    q.push(at3(l, b));
    d += `M${q.map((v) => pt(P.p(v[0], v[1], v[2]))).join("L")}`;
  }
  return d;
};
/** a structure: its lines in drawing order, drawn by one tip over [t0, t0 + dur]; washes once whole */
type Structure = { key: string; Z: number; t0: number; dur: number; lines: Line3[]; washes: P3[][]; dash?: [number, number] };
const drawStructure = (P: Persp, st: Structure, f: number, cam: Cam): { body: React.ReactNode; tip: React.ReactNode } => {
  const prog = c01((f - st.t0) / st.dur);
  if (prog <= 0) return { body: null, tip: null };
  const lens = st.lines.map(lenOf);
  const total = lens.reduce((a, b) => a + b, 0);
  let left = total * prog;
  let d = "";
  let tipP: P3 | null = null;
  for (let i = 0; i < st.lines.length; i++) {
    if (left <= 0) break;
    const take = Math.min(left, lens[i]);
    d += dashes(P, st.lines[i], take, st.dash?.[0], st.dash?.[1]);
    if (take < lens[i]) tipP = at3(st.lines[i], take);
    left -= take;
  }
  const r = P.r(st.Z);
  const sw = (2.5 * (0.55 + 0.45 * Math.min(1, r))) / cam.k;
  const wash = smooth((f - st.t0 - st.dur) / 14);
  // the faces soak in as the outline is drawn (the ground's own tone: a nearer outline hides a farther one), then a
  // faint orange wash once it is whole
  const solid = smooth(prog * 1.3);
  const body = (
    <g key={st.key}>
      {solid > 0 ? st.washes.map((q, i) => <path key={`s${i}`} d={poly(P, q)} fill={FACE_FILL[i % FACE_FILL.length]} opacity={solid} />) : null}
      {wash > 0 ? st.washes.map((q, i) => <path key={i} d={poly(P, q)} fill={ORANGE_HEX} opacity={0.06 * wash} />) : null}
      <path d={d} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={sw + 2.2 / cam.k} strokeLinecap="butt" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={ORANGE_HEX} strokeWidth={sw} strokeLinecap="butt" strokeLinejoin="round" />
    </g>
  );
  let tip: React.ReactNode = null;
  if (tipP && prog < 1) {
    const q = P.p(tipP[0], tipP[1], tipP[2]);
    tip = <circle key={`${st.key}-tip`} cx={q[0]} cy={q[1]} r={4.2 / cam.k} fill={ORANGE_HEX} stroke={DARK} strokeWidth={1.4 / cam.k} />;
  }
  return { body, tip };
};
const circle3 = (c: P3, R: number, a0: number, n = 56, plane: "xy" = "xy"): Line3 => {
  const out: Line3 = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (2 * Math.PI * i) / n;
    out.push(plane === "xy" ? [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a), c[2]] : c);
  }
  return out;
};
/** a gabled house (ridge along Z, the gable to the front) on a floor at height y0 (< 0 up a slope); the side
 *  toward the VP is seen (`left`: it stands right of the VP, so its left wall shows) */
const houseLines = (x0: number, x1: number, z0: number, z1: number, y0: number, h: number, ridge: number, door: [number, number, number] | null, left: boolean): { lines: Line3[]; washes: P3[][] } => {
  const xm = (x0 + x1) / 2;
  const xs = left ? x0 : x1;
  const xo = left ? x1 : x0;
  const t = y0 - h;
  const rg = y0 - ridge;
  const front: Line3 = [[xs, y0, z0], [xo, y0, z0], [xo, t, z0], [xm, rg, z0], [xs, t, z0], [xs, y0, z0]];
  const lines: Line3[] = [front];
  lines.push([[xs, y0, z0], [xs, y0, z1], [xs, t, z1], [xs, t, z0]]);
  lines.push([[xm, rg, z0], [xm, rg, z1], [xs, t, z1]]);
  lines.push([[xo, t, z0], [xo, t, z1], [xm, rg, z1]]);
  if (door) lines.push([[door[0], y0, z0], [door[0], y0 - door[2], z0], [door[1], y0 - door[2], z0], [door[1], y0, z0]]);
  // the faces we see (painted in the ground's tone so a nearer outline hides a farther one): the side wall, the two
  // roof slopes, the front
  const washes: P3[][] = [
    [[xs, y0, z0], [xs, y0, z1], [xs, t, z1], [xs, t, z0]],
    [[xo, t, z0], [xm, rg, z0], [xm, rg, z1], [xo, t, z1]],
    [[xs, t, z0], [xm, rg, z0], [xm, rg, z1], [xs, t, z1]],
    [[x0, y0, z0], [x1, y0, z0], [x1, t, z0], [xm, rg, z0], [x0, t, z0]],
  ];
  return { lines, washes };
};
const AMPHORA: P2[] = [[0, 0], [-10, -18], [-20, -52], [-17, -82], [-8, -92], [-7, -104], [7, -104], [8, -92], [17, -82], [20, -52], [10, -18], [0, 0]];
const MILL_STRUCT = (f: number): Structure[] => {
  const M = MILL;
  const wh = M.wheel;
  const rot = wheelAngle(f);
  const zf = wh.Z - wh.w / 2;
  const zb = wh.Z + wh.w / 2;
  const c: P3 = [wh.X, wh.Y, zf];
  const rimF = circle3(c, wh.R, -Math.PI / 2 + rot);
  const rimB = circle3([wh.X, wh.Y, zb], wh.R, -Math.PI / 2 + rot);
  const hub = circle3(c, 26, rot, 20);
  const spokes: Line3[] = [];
  const paddles: Line3[] = [];
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4;
    spokes.push([[wh.X + 26 * Math.cos(a), wh.Y + 26 * Math.sin(a), zf], [wh.X + wh.R * Math.cos(a), wh.Y + wh.R * Math.sin(a), zf]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = rot + (i * Math.PI) / 8;
    const r0 = wh.R;
    const r1 = wh.R + 26;
    paddles.push([[wh.X + r0 * Math.cos(a), wh.Y + r0 * Math.sin(a), zf], [wh.X + r1 * Math.cos(a), wh.Y + r1 * Math.sin(a), zf], [wh.X + r1 * Math.cos(a), wh.Y + r1 * Math.sin(a), zb]]);
  }
  const axle: Line3 = [[wh.X, wh.Y, zb], [wh.X, wh.Y, M.z0]];
  const house = houseLines(M.x0, M.x1, M.z0, M.z1, M.y0, M.h, M.ridge, [M.door.x0, M.door.x1, M.door.h], true);
  // the wheel first (the machine), then the mill house round it
  const wheel: Structure = { key: "mill-w", Z: wh.Z, t0: MILL_T0, dur: MILL_DUR * 0.45, lines: [rimF, ...spokes, hub, rimB, ...paddles], washes: [] };
  const mh: Structure = { key: "mill-h", Z: M.z0, t0: MILL_T0 + MILL_DUR * 0.4, dur: MILL_DUR * 0.6, lines: [axle, ...house.lines], washes: house.washes };
  return [mh, wheel];
};
const houseStruct = (h: House): Structure[] => {
  const x0 = h.X - h.w / 2;
  const x1 = h.X + h.w / 2;
  const z0 = h.Z - h.d / 2;
  const z1 = h.Z + h.d / 2;
  const dw = 54;
  const dx = h.X + (hash(h.seed, 21) - 0.5) * (h.w - dw - 30);
  const hl = houseLines(x0, x1, z0, z1, h.Y0, h.h, h.ridge, [dx - dw / 2, dx + dw / 2, Math.min(h.h - 30, 140)], h.X > 0);
  const out: Structure[] = [{ key: `h${h.seed}`, Z: z0, t0: h.t0, dur: h.dur, lines: hl.lines, washes: hl.washes }];
  if (h.goods) {
    // the stall's goods in front of the house: amphorae and a sack, drawn once the house is up
    const n = 2 + Math.floor(hash(h.seed, 23) * 2);
    const gl: Line3[] = [];
    for (let i = 0; i < n; i++) {
      const gx = x0 + 34 + i * 52;
      const gz = z0 - 46 - (i % 2) * 14;
      gl.push(AMPHORA.map(([ax, ay]) => [gx + ax * 1.25, h.Y0 + ay * 1.25, gz] as P3));
    }
    // a plank counter
    gl.push([[x1 - 90, h.Y0 - 64, z0 - 52], [x1 - 6, h.Y0 - 64, z0 - 52], [x1 - 6, h.Y0, z0 - 52]]);
    gl.push([[x1 - 90, h.Y0, z0 - 52], [x1 - 90, h.Y0 - 64, z0 - 52]]);
    out.push({ key: `g${h.seed}`, Z: z0 - 50, t0: h.t0 + h.dur * 0.85, dur: 10, lines: gl, washes: [], dash: [13, 7] });
  }
  return out;
};
const VILLAGE: Structure[] = HOUSES.flatMap(houseStruct);

// ---------------------------------------------------------------------------
// THE MASTER (reclining, his cup) and THE OVERSEER
// ---------------------------------------------------------------------------
const masterPose = (f: number): FigPose => {
  const q = POSES.recline(1);
  const look = 0.06 * Math.sin(f / 31);
  return idle({ ...q, headYaw: q.headYaw + 0.08 + look, pitch: q.pitch + 4 }, f, 3, 0.6);
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
type Item = { Z: number; key: string; el: React.ReactNode };
const ExtractNotCreate: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const P = perspective(cam, DEPTH);
  const items: Item[] = [];
  const shadows: React.ReactNode[] = [];
  const tips: React.ReactNode[] = [];

  // the alternative (all of it stands beyond the stream, behind everything solid)
  const alt: { Z: number; body: React.ReactNode }[] = [];
  for (const st of [...MILL_STRUCT(f), ...VILLAGE]) {
    const r = drawStructure(P, st, f, cam);
    if (r.body) alt.push({ Z: st.Z, body: r.body });
    if (r.tip) tips.push(r.tip);
  }
  alt.sort((a, b) => b.Z - a.Z);

  // the villa, the kerb
  items.push({ Z: VILLA.z0, key: "villa", el: <Villa key="villa" P={P} /> });
  items.push({ Z: TERRACE_EDGE + 6, key: "kerb", el: <Kerb key="kerb" P={P} /> });
  items.push({ Z: PODIUM_Z, key: "podium", el: <Podium key="podium" P={P} /> });

  // the line
  const doorClip = poly(P, doorQuad(P));
  for (let j = SLAVE_J0; j <= SLAVE_J1; j++) {
    const st = slaveState(j, f, P);
    if (!st) continue;
    const sx = 540 + (st.at[0] - cam.cx) * cam.k;
    if (sx < -260 || sx > 1340) continue;
    const inside = st.s > S_DOOR - 30 && st.Z > VILLA.z0 - 30;
    if (st.s > S_DOOR + 70) continue;
    if (inside) {
      items.push({
        Z: VILLA.z0 - 0.5,
        key: `in${j}`,
        el: (
          <g key={`in${j}`} clipPath="url(#ec-door)">
            <SlaveFig st={st} f={f} withBag />
          </g>
        ),
      });
      continue;
    }
    shadows.push(<ContactShadow key={`cs${j}`} P={P} X={st.X} Z={st.Z} w={50} d={26} uid={`ecs${j}`} amt={0.8} />);
    items.push({ Z: st.Z, key: `sl${j}`, el: <SlaveFig key={`sl${j}`} st={st} f={f} withBag={!st.bagFront} /> });
    if (st.bagFront) {
      // the bag swung out over the heap is drawn in front of the heap
      items.push({ Z: HEAP_C[1] - 2, key: `sk${j}`, el: <BagArt key={`sk${j}`} x={st.bag} ink={slaveInk(st.Z, f)} uid={`esf${j}`} /> });
    }
  }

  // the heap and the coins in flight
  const heapInk = tintInk(CREAM, 1);
  const Wnow = heapW(heapH(heapAmount(f)));
  shadows.push(<ContactShadow key="csh" P={P} X={HEAP_C[0]} Z={HEAP_C[1]} w={Wnow * 1.08} d={Wnow * 0.9} uid="ecsh" amt={0.85} />);
  items.push({ Z: HEAP_C[1], key: "heap", el: <Heap key="heap" P={P} f={f} ink={heapInk} /> });
  items.push({ Z: HEAP_C[1] - 3, key: "fly", el: <FlyingCoins key="fly" P={P} f={f} ink={heapInk} /> });

  // the master on his couch
  const cAt = P.at(COUCH_X, COUCH_Z);
  shadows.push(<ContactShadow key="csc" P={P} X={COUCH_X} Z={COUCH_Z} w={190} d={46} uid="ecsc" amt={0.9} />);
  items.push({
    Z: COUCH_Z,
    key: "master",
    el: (
      <g key="master">
        <Couch at={cAt.at} scale={cAt.scale} uid="ecouch" dir={1} />
        <Dominus pose={masterPose(f)} at={reclineAt(cAt.at, cAt.scale, 1)} scale={cAt.scale} uid="edom" variant={1} stripe held="cup" shade={1} />
      </g>
    ),
  });

  // the overseer, behind the line, facing it, his rod
  const oAt = P.at(OVERSEER[0], OVERSEER[1]);
  const oInk = CREAM;
  shadows.push(<ContactShadow key="cso" P={P} X={OVERSEER[0]} Z={OVERSEER[1]} w={60} d={30} uid="ecso" />);
  items.push({
    Z: OVERSEER[1],
    key: "ovs",
    el: <Overseer key="ovs" pose={idle(headTurn(POSES.raiseRod(1, rodAt(f)), 0.75, 6), f, 7, 0.8)} at={oAt.at} scale={oAt.scale} uid="eovs" variant={0} ink={oInk} cloth={oInk} shade={1} />,
  });

  items.sort((a, b) => b.Z - a.Z);
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <defs>
          <clipPath id="ec-door">
            <path d={doorClip} />
          </clipPath>
        </defs>
        <Ground P={P} f={f} />
        {alt.map((a) => a.body)}
        {shadows}
        {items.map((it) => it.el)}
        {tips}
      </WorldSvg>
    </TexcocoPage>
  );
};

export default ExtractNotCreate;
