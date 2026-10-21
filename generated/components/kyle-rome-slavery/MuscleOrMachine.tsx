// ---------------------------------------------------------------------------
// MuscleOrMachine (kyle-rome-slavery, cut 5). Dwarkesh map style (styles/dwarkesh-map.md), in the London clip's 3D
// depth manner (one camera in one-point perspective, a flagstone ground plane, volumes lit from the upper left,
// contact and form shadows, parallax on the pan: ../kyle-london/londonDepth.tsx, read only).
// Opaque 1080x1920, 29.97 fps, 147 frames. Layout, timeline and camera: ./muscleOrMachinePlan.ts.
//
// CHECK LINE: "Rome ground its flour with slaves pushing the mills round; industrial Britain ground it with a steam
// engine — the machine Rome had no reason to build."
//
// THE LINE: "(I don't know if it's a plausible explanation that) cheap slave labor reduced the incentives for
// mechanization and engineering and other crafts."
// WORD -> FRAME: cheap (speaking at f0) · slave 5 · labor 14 · reduced 25 · the 39 · incentives 47 · for 56 ·
// mechanization 70 · and 86 · engineering 96 · and 106 · other 121 · crafts 127 · (he carries on at 144; cut at 147)
// DURATION: the slot 5.439 -> 10.344 s = 4.905 s x 29.97 = 147 frames (f0..f146).
//
// THE MOTION: one continuous pan along one flagstone floor, from muscle to machine (cut 10's approach). f0-28: close on
// a Roman bakery-mill (romeCast Slaves: exomis, bare feet, the near pair in fetters) leaning into the chest-high
// push-bars of an hourglass lava mill and walking it round, the grain turning in its hopper, flour dropping into the
// base trough; a second mill and its pair turn behind; a brick wall runs back along the right, hiding the next room;
// the camera already drifting right. Right after "reduced" one zoom lobe (f16-86) and the sideways lobe a few frames
// behind it (f20-94, peak 32 px/frame at f55) truck right and pull back a little past the wall's end (the pier: the
// change of world; the far Roman mill is glimpsed past it mid-pan) into the steam flour mill, landed by ~f90, before
// "engineering". Pass 2 landing: a row of four millstone pairs runs back from the front (stone 1 large, runner ~350 px,
// at y ~870-1060), each runner (orange iron hoop) turned by its orange crown wheel and stone nut on a square line
// shaft; the shaft runs back to the pinion meshing the geared rim of a Boulton & Watt rotative engine that heads the
// row (cut 10's sun-and-planet flywheel, settled, axle at y ~420, cropping right), so the engine overlaps only the
// row's far end. Worker 1 (cream, ~460 px) at stone 1: near hand on the meal spout, far hand on the neck of the sack
// that hangs from the spout's hook and fills (he shakes it at f112); worker 2, further down the row, heaves a filled
// sack up (f100-114) and sets it on a stack (released f128). It holds alive to the cut under a 1 px/frame creep.
// CAUSE BEFORE EFFECT: the slaves' fists are on the bar on every frame (their walk IS the bar's angle: body radius x
// angle = the push stride); the stones turn only through the gears (flywheel 3 : 1 pinion = the line shaft, crown wheel
// 2 : 3 stone nut); flour leaves the spout's lip and falls into the sack's mouth, the sack's fill follows it.
// Orange = the machine: the flywheel's sun-and-planet gears and geared rim, the pinion, the crown wheels and stone nuts,
// the runner stones' iron hoops. People, flour, grain and sacks are cream; the Roman mills are lava stone.
// DEPTH: one camera (eye 1.5 men up, CAM_D 720, dolly 0 as cut 10; VP on the centre line), the kit's flagstone ground
// plane, every object a volume (mills as lathed bodies, bars / wall / A-frame / hursts / hoppers / shaft as lit
// hexahedra, the flywheel's rim and gears with receding bands), contact shadows, depth-sunk inks for the far mill and
// the far stones, parallax on the truck; the wall's far-side contents are drawn before it.
// SOURCES (illustrative, no figures on screen): Pompeii's bakery mills (e.g. the Bakery of Modestus, VII.1.36) are
// hourglass lava mills, a conical meta under an hourglass catillus turned by bars through its waist lugs, pushed by
// donkeys or slaves; Apuleius, Metamorphoses 9.12 describes slaves at such a mill. Albion Mills, Southwark (opened 1786,
// burned 1791): Boulton & Watt rotative engines drove 20 pairs of millstones through gearing (Wikipedia "Albion Mills,
// Southwark"; Grace's Guide). Watt's sun-and-planet gear (Murdoch's design, patented 1781).
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage } from "../kits/maps/texcocoShared";
import { FRAME_H, FRAME_W, camTransform, mixColor, type Cam, type P2 } from "../kits/maps/incaShared";
import { ACCENT, ACCENT_DEEP, DARK, HUB_RING_R, INK, RIM_R, SUN, SunAndPlanetMachine } from "../kyle-london/orbitWorld";
import { ContactShadow, GroundPlane, perspective, tintInk, type Persp, type VolInk } from "../kyle-london/londonDepth";
import { CREAM, POSES, Worker, castAnchors, headTurn, idle, lerpFig, type FigPose } from "../kyle-london/londonCastV2";
import { Basket, POSES as RPOSES, PUSH, Sack, Slave, mirrorPose } from "./romeCast";
import {
  BAR_R,
  BAR_Y,
  BED_H,
  CAM_D,
  CROWN_DZ,
  CROWN_R,
  DEPTH,
  DURATION as PLAN_DURATION,
  AXLE_Y,
  EX,
  EYE_Y,
  FLY_PITCH,
  HURST,
  MILL,
  MILLS,
  MILL_OMEGA,
  N_FLY,
  N_PIN,
  PIN_ANGLE,
  NUT_R,
  PIER,
  PIN_PITCH,
  RUNNER_H,
  RUNNER_TOP,
  SACK,
  SCALE,
  SHAFT_HW,
  SHAFT_X,
  SHAFT_Y,
  SHAFT_Z0,
  SHAFT_Z1,
  STACK,
  LIFT,
  WORKER2,
  STAND as ASTAND,
  STONES_Z,
  STONE_R,
  WORKER,
  Z_WHEEL,
  camAt,
  engineCamAt,
  engineFrameAt,
  flyAngle,
  millAngle,
  pinAngle,
  rOf,
  sackFill,
  stoneAngle,
  type Mill,
} from "./muscleOrMachinePlan";

export const FPS = 30000 / 1001;
export const DURATION = 147;
if (PLAN_DURATION !== DURATION) throw new Error("plan / component DURATION mismatch");
export const schema = z.object({});
export const defaultProps = schema.parse({});

const fx = (v: number) => v.toFixed(2);
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const PT = (v: P2) => `${fx(v[0])},${fx(v[1])}`;
type V3 = [number, number, number];
const PAGE = "#3F3428";

/** ONE INK WEIGHT (cut 10's recipe): figure strokes are in world units, so above INK_K0 every stroke inside .u4ink is
 *  scaled by (INK_K0 / k)^0.75 */
const INK_K0 = 1.38;
const inkFactor = (k: number) => Math.min(1, Math.pow(INK_K0 / k, 0.75));
const INK_CSS = ".u4ink [stroke-width]{stroke-width:calc(attr(stroke-width type(<number>)) * var(--inkf))}";

// ---------------------------------------------------------------------------
// MATERIALS (three tones each, lit from the upper left) and atmospheric depth
// ---------------------------------------------------------------------------
/** rough grey-umber lava (Pompeii's mills are Vesuvian / Orvieto basalt lava), pitted */
const LAVA: VolInk = { lit: "#857A68", mid: "#524A3F", dark: "#221D17" };
const BRICK: VolInk = { lit: "#6E5A42", mid: "#46382A", dark: "#221A13" };
const TIMBER: VolInk = { lit: "#7A6446", mid: "#4E3E2B", dark: "#271E15" };
const IRON: VolInk = { lit: "#5E4D38", mid: "#2F261C", dark: "#18130E" };
const BURR: VolInk = { lit: "#857867", mid: "#4D4438", dark: "#231E18" };
const HOOP: VolInk = { lit: "#857867", mid: ACCENT, dark: ACCENT_DEEP };
/** sink a material toward the page with depth (t = 1 near, lower farther) */
const sinkVol = (v: VolInk, t: number): VolInk => ({ lit: mixColor(PAGE, v.lit, t), mid: mixColor(PAGE, v.mid, t), dark: mixColor(PAGE, v.dark, t) });
const depthT = (Z: number, far = 2400, min = 0.42) => 1 - (1 - min) * c01(Z / far);

// ---------------------------------------------------------------------------
// GENERIC VOLUMES in the one perspective
// ---------------------------------------------------------------------------
/** a horizontal ring of radius R at height Y round (X, Z): its centre, half-width and half-height on the 2D world */
const ringOf = (P: Persp, X: number, Z: number, R: number, Y: number) => {
  const c = P.p(X, Y, Z);
  return { c, rx: R * P.r(Z), ry: Math.abs(P.p(X, Y, Z - R)[1] - P.p(X, Y, Z + R)[1]) / 2 };
};
/** hatching lines across a polygon's box (clip them to the polygon) */
const hatchD = (x0: number, y0: number, x1: number, y1: number, gap: number, slope = 0.55) => {
  let d = "";
  const h = y1 - y0;
  for (let x = x0 - h * slope; x < x1; x += gap) d += `M${fx(x)} ${fx(y1)}L${fx(x + h * slope)} ${fx(y0)}`;
  return d;
};
/** a body of revolution (vertical axis at X, Z) from a profile [R, Y] top -> bottom, seen from above the eye-line:
 *  each frustum's outline is its top ellipse + the tangent sides + its bottom's front arc; the right side shaded */
/** pits: a lava stone's pitted surface (dark pores, a few pale flecks), on the front half, turning with `th` */
type Pits = { th: number; per: number; seed: string; tone: number };
const Lathe: React.FC<{ P: Persp; X: number; Z: number; prof: [number, number][]; ink: VolInk; uid: string; top?: "solid" | "none"; litBand?: boolean; pits?: Pits }> = ({
  P,
  X,
  Z,
  prof,
  ink,
  uid,
  top = "solid",
  litBand = false,
  pits,
}) => {
  const r = P.r(Z);
  const sw = 2.3 * r;
  const rings = prof.map(([R, Y]) => ringOf(P, X, Z, R, Y));
  const segs: React.ReactNode[] = [];
  for (let i = prof.length - 2; i >= 0; i--) {
    const a = rings[i];
    const b = rings[i + 1];
    const d = `M${fx(a.c[0] - a.rx)} ${fx(a.c[1])}L${fx(b.c[0] - b.rx)} ${fx(b.c[1])}A${fx(b.rx)} ${fx(Math.max(0.01, b.ry))} 0 0 0 ${fx(b.c[0] + b.rx)} ${fx(b.c[1])}L${fx(a.c[0] + a.rx)} ${fx(a.c[1])}A${fx(a.rx)} ${fx(Math.max(0.01, a.ry))} 0 0 0 ${fx(a.c[0] - a.rx)} ${fx(a.c[1])}Z`;
    const id = `${uid}-s${i}`;
    const sh: P2[] = [
      [a.c[0] + a.rx * 0.3, a.c[1] - a.ry - 2],
      [a.c[0] + a.rx + 4, a.c[1] - a.ry - 2],
      [b.c[0] + b.rx + 4, b.c[1] + b.ry + 2],
      [b.c[0] + b.rx * 0.3, b.c[1] + b.ry + 2],
    ];
    segs.push(
      <g key={i}>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
        <path d={d} fill={ink.mid} />
        <g clipPath={`url(#${id})`}>
          <path d={`M${sh.map(PT).join("L")}Z`} fill={ink.dark} opacity={0.8} />
          <path d={hatchD(Math.min(a.c[0], b.c[0]) + Math.min(a.rx, b.rx) * 0.2, Math.min(a.c[1] - a.ry, b.c[1] - b.ry), Math.max(a.c[0] + a.rx, b.c[0] + b.rx), Math.max(a.c[1] + a.ry, b.c[1] + b.ry), 3.2 * r + 0.6)} stroke={DARK} strokeWidth={0.85 * r} strokeOpacity={0.5} fill="none" />
          {litBand ? (
            <path
              d={`M${fx(a.c[0] - a.rx * 0.97)} ${fx(a.c[1])}L${fx(a.c[0] - a.rx * 0.3)} ${fx(a.c[1])}L${fx(b.c[0] - b.rx * 0.3)} ${fx(b.c[1] + b.ry)}L${fx(b.c[0] - b.rx * 0.97)} ${fx(b.c[1])}Z`}
              fill={ink.lit}
              opacity={0.55}
            />
          ) : null}
          <path d={`M${fx(a.c[0] - a.rx * 0.58)} ${fx(a.c[1])}L${fx(b.c[0] - b.rx * 0.58)} ${fx(b.c[1])}`} stroke={ink.lit} strokeWidth={Math.min(a.rx, b.rx) * 0.22 + 1} strokeOpacity={0.75} />
          {pits ? <PitsOn P={P} X={X} Z={Z} a={prof[i]} b={prof[i + 1]} pits={pits} k={i} /> : null}
        </g>
        <path d={d} fill="none" stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />
      </g>,
    );
  }
  const t = rings[0];
  return (
    <g>
      {segs}
      {top === "solid" ? <ellipse cx={t.c[0]} cy={t.c[1]} rx={t.rx} ry={t.ry} fill={ink.lit} stroke={DARK} strokeWidth={sw} /> : null}
    </g>
  );
};

/** the pores of one frustum (profile points a -> b), scattered by its area, turning with the stone */
const PitsOn: React.FC<{ P: Persp; X: number; Z: number; a: [number, number]; b: [number, number]; pits: Pits; k: number }> = ({ P, X, Z, a, b, pits, k }) => {
  const r = P.r(Z);
  const slant = Math.hypot(a[0] - b[0], a[1] - b[1]);
  const n = Math.round((pits.per * slant * (a[0] + b[0])) / 2 / 400);
  const dark = mixColor(PAGE, "#120E0A", pits.tone);
  const pale = mixColor(PAGE, "#9C907B", pits.tone);
  const els: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const u = random(`${pits.seed}${k}u${i}`);
    const phi = 2 * Math.PI * random(`${pits.seed}${k}p${i}`);
    const ang = phi + pits.th;
    const c = Math.cos(ang);
    if (c < 0.06) continue;
    const R = a[0] + (b[0] - a[0]) * u;
    const Y = a[1] + (b[1] - a[1]) * u;
    const q = P.p(X + R * Math.sin(ang), Y, Z - R * Math.cos(ang));
    const sz = (0.9 + 1.5 * random(`${pits.seed}${k}s${i}`)) * r;
    const isPale = random(`${pits.seed}${k}c${i}`) < 0.15;
    els.push(<ellipse key={i} cx={q[0]} cy={q[1]} rx={sz * (0.35 + 0.65 * c)} ry={sz * 0.7} fill={isPale ? pale : dark} opacity={isPale ? 0.35 : 0.45} />);
  }
  return <g>{els}</g>;
};

/** the eye in 3D (dolly 0: CAM_D in front of the front plane, on the centre line) */
const eyeOf = (P: Persp): V3 => [P.cam.cx, EYE_Y, -CAM_D];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** the light comes from the upper left (and a little from the front) */
const TO_LIGHT = norm3([-0.62, -0.72, -0.32]);
const faceTone = (ink: VolInk, n: V3) => {
  const s = dot(n, TO_LIGHT);
  if (s > 0.42) return { fill: ink.lit, hatch: 0 };
  if (s > 0.05) return { fill: ink.mid, hatch: 0.25 };
  return { fill: ink.dark, hatch: 0.5 };
};
/** a convex hexahedron from its 8 corners (front 0-3 = top-left, top-right, bottom-right, bottom-left; back 4-7 the
 *  same), each visible face flat-toned by its normal against the one light, hatched in shade */
const Hexa: React.FC<{ P: Persp; v: V3[]; ink: VolInk; uid: string; line?: number }> = ({ P, v, ink, uid, line = 1 }) => {
  const faces = [
    [0, 1, 2, 3],
    [5, 4, 7, 6],
    [4, 0, 3, 7],
    [1, 5, 6, 2],
    [4, 5, 1, 0],
    [3, 2, 6, 7],
  ];
  const cen: V3 = v.reduce((s, p) => [s[0] + p[0] / 8, s[1] + p[1] / 8, s[2] + p[2] / 8], [0, 0, 0] as V3);
  const eye = eyeOf(P);
  const zm = cen[2];
  const r = P.r(zm);
  const els: React.ReactNode[] = [];
  faces.forEach((f, i) => {
    const q = f.map((j) => v[j]);
    const fc: V3 = q.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4, s[2] + p[2] / 4], [0, 0, 0] as V3);
    let n = norm3(cross(sub3(q[1], q[0]), sub3(q[3], q[0])));
    if (dot(n, sub3(fc, cen)) < 0) n = [-n[0], -n[1], -n[2]];
    if (dot(n, sub3(eye, fc)) <= 0) return;
    const pts = q.map((p) => P.p(p[0], p[1], p[2]));
    const d = `M${pts.map(PT).join("L")}Z`;
    const tone = faceTone(ink, n);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    els.push(
      <g key={i}>
        <clipPath id={`${uid}-f${i}`}>
          <path d={d} />
        </clipPath>
        <path d={d} fill={tone.fill} stroke={DARK} strokeWidth={2.1 * r * line} strokeLinejoin="round" />
        {tone.hatch > 0 ? <path d={hatchD(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), 3 * r + 0.6, 0.3)} clipPath={`url(#${uid}-f${i})`} stroke={DARK} strokeWidth={0.8 * r} strokeOpacity={tone.hatch} fill="none" /> : null}
      </g>,
    );
  });
  return <g>{els}</g>;
};
/** an axis-aligned box as a Hexa */
const boxV = (X0: number, X1: number, Y0: number, Y1: number, Z0: number, Z1: number): V3[] => [
  [X0, Y0, Z0],
  [X1, Y0, Z0],
  [X1, Y1, Z0],
  [X0, Y1, Z0],
  [X0, Y0, Z1],
  [X1, Y0, Z1],
  [X1, Y1, Z1],
  [X0, Y1, Z1],
];
/** a square-section bar from A to B (horizontal, in the X-Z plane), half-width hw, half-height hh */
const barV = (A: V3, B: V3, hw: number, hh: number): V3[] => {
  const dx = B[0] - A[0];
  const dz = B[2] - A[2];
  const l = Math.hypot(dx, dz) || 1;
  const nx = (-dz / l) * hw;
  const nz = (dx / l) * hw;
  // "front" = the A end
  return [
    [A[0] - nx, A[1] - hh, A[2] - nz],
    [A[0] + nx, A[1] - hh, A[2] + nz],
    [A[0] + nx, A[1] + hh, A[2] + nz],
    [A[0] - nx, A[1] + hh, A[2] - nz],
    [B[0] - nx, B[1] - hh, B[2] - nz],
    [B[0] + nx, B[1] - hh, B[2] + nz],
    [B[0] + nx, B[1] + hh, B[2] + nz],
    [B[0] - nx, B[1] + hh, B[2] - nz],
  ];
};

// ---------------------------------------------------------------------------
// THE ROMAN MILL
// ---------------------------------------------------------------------------
const millProfile = (): { base: [number, number][]; cat: [number, number][] } => ({
  base: [
    [MILL.baseR, -MILL.lipH],
    [MILL.baseR + 4, 0],
  ],
  cat: [
    [MILL.catTopR, MILL.catTopY],
    [MILL.catTopR - 6, MILL.catTopY + 16],
    [MILL.waistR + 4, MILL.waistY - 8],
    [MILL.waistR, MILL.waistY],
    [MILL.waistR + 4, MILL.waistY + 8],
    [MILL.catBotR - 6, MILL.catBotY - 12],
    [MILL.catBotR, MILL.catBotY],
  ],
});
/** the base platform (the round tray) with the flour spilling out on it as a growing pale ring with heaps */
const MillBase: React.FC<{ P: Persp; m: Mill; f: number; uid: string; tone: number }> = ({ P, m, f, uid, tone }) => {
  const ink = sinkVol(LAVA, tone);
  const pr = millProfile();
  const r = P.r(m.Z);
  const lip = ringOf(P, m.X, m.Z, MILL.baseR - 12, -MILL.lipH);
  const trough = ringOf(P, m.X, m.Z, MILL.baseR - 14, -MILL.baseH);
  const grow = f / DURATION;
  // the flour ring: an annulus in the tray, rising and spreading over the cut
  const heapY = -MILL.baseH - 6 - 8 * grow;
  const heap = ringOf(P, m.X, m.Z, MILL.baseR - 24 + 8 * grow, heapY);
  const flour = mixColor(PAGE, INK, 0.95 * tone);
  const flourDk = mixColor(PAGE, "#BCAE8C", 0.92 * tone);
  // heaps of flour on the ring (the front half), growing
  const heaps: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const a = -1.45 + (2.9 * (i + 0.5)) / 9 + 0.15 * (random(`${uid}fh${i}`) - 0.5);
    const R = MILL.baseR - 34 + 10 * random(`${uid}fr${i}`);
    const hh = (7 + 9 * random(`${uid}fz${i}`)) * (0.6 + 0.6 * grow);
    const c = P.p(m.X + R * Math.sin(a), heapY, m.Z - R * Math.cos(a));
    const w = (16 + 8 * random(`${uid}fw${i}`)) * r;
    heaps.push(
      <g key={i}>
        <path d={`M${fx(c[0] - w)} ${fx(c[1] + 2 * r)}Q${fx(c[0] - w * 0.2)} ${fx(c[1] - hh * r * 1.6)} ${fx(c[0] + w)} ${fx(c[1] + 2 * r)}Z`} fill={flour} />
        <path d={`M${fx(c[0] + w * 0.15)} ${fx(c[1] - hh * r * 0.55)}Q${fx(c[0] + w * 0.6)} ${fx(c[1] - hh * r * 0.2)} ${fx(c[0] + w)} ${fx(c[1] + 2 * r)}`} stroke={flourDk} strokeWidth={2.6 * r} fill="none" />
      </g>,
    );
  }
  return (
    <g>
      <Lathe P={P} X={m.X} Z={m.Z} prof={pr.base} ink={ink} uid={`${uid}b`} litBand pits={{ th: 0, per: 24, seed: `${uid}bp`, tone }} />
      <ellipse cx={lip.c[0]} cy={lip.c[1]} rx={lip.rx} ry={lip.ry} fill={ink.dark} stroke={DARK} strokeWidth={1.6 * r} />
      <ellipse cx={trough.c[0]} cy={trough.c[1]} rx={trough.rx} ry={trough.ry} fill={flourDk} />
      <ellipse cx={heap.c[0]} cy={heap.c[1]} rx={heap.rx} ry={heap.ry} fill={flour} />
      <path d={`M${fx(heap.c[0] + heap.rx * 0.2)} ${fx(heap.c[1] + heap.ry * 0.98)}A${fx(heap.rx)} ${fx(heap.ry)} 0 0 0 ${fx(heap.c[0] + heap.rx)} ${fx(heap.c[1])}`} fill="none" stroke={flourDk} strokeWidth={4 * r} />
      {heaps}
    </g>
  );
};
/** the meta's cone between the base and the catillus, the catillus (hourglass, rough pitted lava, turning: its pores
 *  and dressing grooves turn with the bar), the grain heaped in its cup sinking into the throat, the flour falling from
 *  under it */
const Catillus: React.FC<{ P: Persp; m: Mill; th: number; f: number; uid: string; tone: number }> = ({ P, m, th, f, uid, tone }) => {
  const ink = sinkVol(LAVA, tone);
  const pr = millProfile();
  const r = P.r(m.Z);
  const metaTop = ringOf(P, m.X, m.Z, MILL.catBotR - 14, MILL.catBotY + 2);
  const metaBot = ringOf(P, m.X, m.Z, MILL.metaR + 10, -MILL.baseH - 4);
  const top = ringOf(P, m.X, m.Z, MILL.catTopR, MILL.catTopY);
  const inner = ringOf(P, m.X, m.Z, MILL.catTopR - 9, MILL.catTopY + 1);
  // THE GRAIN: heaped above the cup's rim, sinking over the cut as it runs down the throat
  const heapH = 40 - 20 * (f / DURATION);
  const Rh = MILL.catTopR - 10;
  const peak = P.p(m.X, MILL.catTopY - heapH, m.Z);
  const L: P2 = [inner.c[0] - inner.rx, inner.c[1]];
  const Rt: P2 = [inner.c[0] + inner.rx, inner.c[1]];
  const rise = inner.c[1] - peak[1];
  const dome = `M${PT(L)}C${fx(L[0] + inner.rx * 0.3)} ${fx(inner.c[1] - rise * 0.42)} ${fx(peak[0] - inner.rx * 0.32)} ${fx(peak[1] + rise * 0.08)} ${fx(peak[0] - inner.rx * 0.08)} ${fx(peak[1])}L${fx(peak[0] + inner.rx * 0.08)} ${fx(peak[1])}C${fx(peak[0] + inner.rx * 0.32)} ${fx(peak[1] + rise * 0.08)} ${fx(Rt[0] - inner.rx * 0.3)} ${fx(inner.c[1] - rise * 0.42)} ${fx(Rt[0])} ${fx(Rt[1])}A${fx(inner.rx)} ${fx(inner.ry)} 0 0 1 ${fx(L[0])} ${fx(L[1])}Z`;
  const grainC = mixColor(PAGE, "#D6C08C", 0.97 * tone);
  const grainDk = mixColor(PAGE, "#9C8658", tone);
  const grainEdge = mixColor(PAGE, "#5E4E33", tone);
  const grains: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const rho = Rh * Math.sqrt(random(`${uid}gr${i}`));
    const a = th + 2 * Math.PI * random(`${uid}ga${i}`);
    const Y = MILL.catTopY - heapH * (1 - (rho / Rh) ** 2) + 1;
    const q = P.p(m.X + rho * Math.sin(a), Y, m.Z - rho * Math.cos(a));
    grains.push(<ellipse key={i} cx={q[0]} cy={q[1]} rx={2.4 * r} ry={1.4 * r} fill={grainEdge} opacity={0.55} transform={`rotate(${fx((a * 180) / Math.PI)} ${fx(q[0])} ${fx(q[1])})`} />);
  }
  // the throat at the heap's crown: grains trickling down into it (a thin stream, moving)
  const crater = { rx: 13 * r, ry: 5 * r };
  const trickle: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const u = (((f * 0.09 + i / 10) % 1) + 1) % 1;
    const a0 = 2 * Math.PI * random(`${uid}tk${i}`);
    const rr = 1 - u;
    trickle.push(<ellipse key={i} cx={peak[0] + Math.cos(a0) * crater.rx * 1.9 * rr} cy={peak[1] + Math.sin(a0) * crater.ry * 1.9 * rr} rx={1.9 * r} ry={1.2 * r} fill={grainEdge} opacity={0.4 + 0.5 * (1 - u)} />);
  }
  // dressing grooves on the upper cone (front half only), turning with the stone
  const grooves: React.ReactNode[] = [];
  for (let j = 0; j < 8; j++) {
    const a = th + (j * Math.PI) / 4 + Math.PI / 8;
    const front = Math.cos(a);
    if (front < 0.08) continue;
    const p0 = P.p(m.X + (MILL.catTopR - 8) * Math.sin(a), MILL.catTopY + 18, m.Z - (MILL.catTopR - 8) * Math.cos(a));
    const p1 = P.p(m.X + (MILL.waistR + 6) * Math.sin(a), MILL.waistY - 10, m.Z - (MILL.waistR + 6) * Math.cos(a));
    const q0 = P.p(m.X + (MILL.catBotR - 8) * Math.sin(a), MILL.catBotY - 14, m.Z - (MILL.catBotR - 8) * Math.cos(a));
    const q1 = P.p(m.X + (MILL.waistR + 6) * Math.sin(a), MILL.waistY + 10, m.Z - (MILL.waistR + 6) * Math.cos(a));
    grooves.push(<path key={j} d={`M${PT(p0)}L${PT(p1)}M${PT(q0)}L${PT(q1)}`} stroke={DARK} strokeWidth={1.5 * r} strokeOpacity={0.45 * Math.min(1, front * 2.5)} />);
  }
  // flour spilling from under the catillus' front rim onto the tray: a thin pale fringe and a drift of falling flour
  const flourC = mixColor(PAGE, INK, 0.95 * tone);
  const fall = MILL.catBotY - (-MILL.baseH - 8);
  // the flour pouring out under the front rim: a pale curtain from the catillus' lower edge down onto the tray
  const lo = ringOf(P, m.X, m.Z, MILL.catBotR + 2, MILL.catBotY + 2);
  const tr = ringOf(P, m.X, m.Z, MILL.catBotR + 10, -MILL.baseH - 8);
  const k0 = 0.86;
  const curtain = `M${fx(lo.c[0] - lo.rx * k0)} ${fx(lo.c[1] + lo.ry * 0.5)}A${fx(lo.rx)} ${fx(lo.ry)} 0 0 0 ${fx(lo.c[0] + lo.rx * k0)} ${fx(lo.c[1] + lo.ry * 0.5)}L${fx(tr.c[0] + tr.rx * k0)} ${fx(tr.c[1] + tr.ry * 0.5)}A${fx(tr.rx)} ${fx(tr.ry)} 0 0 1 ${fx(tr.c[0] - tr.rx * k0)} ${fx(tr.c[1] + tr.ry * 0.5)}Z`;
  const fringe = <path d={curtain} fill={flourC} opacity={0.62} />;
  const drops: React.ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const a = -1.3 + 2.6 * random(`${uid}d${i}`);
    const u = ((f * 0.07 + random(`${uid}e${i}`)) % 1 + 1) % 1;
    const R = MILL.catBotR + 2 + 8 * u;
    const p = P.p(m.X + R * Math.sin(a), MILL.catBotY + 2 - fall * u, m.Z - R * Math.cos(a));
    drops.push(<circle key={i} cx={p[0]} cy={p[1]} r={(1.4 + 1.2 * random(`${uid}q${i}`)) * r} fill={flourC} opacity={0.9 * (1 - u * 0.4)} />);
  }
  return (
    <g>
      {/* the meta's cone showing between the base and the catillus */}
      <path d={`M${fx(metaBot.c[0] - metaBot.rx)} ${fx(metaBot.c[1])}L${fx(metaTop.c[0] - metaTop.rx)} ${fx(metaTop.c[1])}L${fx(metaTop.c[0] + metaTop.rx)} ${fx(metaTop.c[1])}L${fx(metaBot.c[0] + metaBot.rx)} ${fx(metaBot.c[1])}A${fx(metaBot.rx)} ${fx(metaBot.ry)} 0 0 1 ${fx(metaBot.c[0] - metaBot.rx)} ${fx(metaBot.c[1])}Z`} fill={ink.dark} stroke={DARK} strokeWidth={2 * r} />
      {fringe}
      <Lathe P={P} X={m.X} Z={m.Z} prof={pr.cat} ink={ink} uid={`${uid}c`} top="none" litBand pits={{ th, per: 46, seed: `${uid}cp`, tone }} />
      {grooves}
      {drops}
      {/* the cup's rim, its dark inside, the grain heaped above the rim */}
      <ellipse cx={top.c[0]} cy={top.c[1]} rx={top.rx} ry={top.ry} fill={ink.lit} stroke={DARK} strokeWidth={2.3 * r} />
      <ellipse cx={inner.c[0]} cy={inner.c[1]} rx={inner.rx} ry={inner.ry} fill={ink.dark} stroke={DARK} strokeWidth={1.4 * r} />
      <clipPath id={`${uid}dome`}>
        <path d={dome} />
      </clipPath>
      <path d={dome} fill={grainC} />
      <g clipPath={`url(#${uid}dome)`}>
        <path d={`M${fx(peak[0] + inner.rx * 0.15)} ${fx(peak[1] - 4)}L${fx(Rt[0] + 4)} ${fx(peak[1] - 4)}L${fx(Rt[0] + 4)} ${fx(inner.c[1] + inner.ry + 4)}L${fx(peak[0] + inner.rx * 0.15)} ${fx(inner.c[1] + inner.ry + 4)}Z`} fill={grainDk} opacity={0.55} />
        {grains}
      </g>
      <path d={dome} fill="none" stroke={DARK} strokeWidth={1.8 * r} strokeLinejoin="round" />
      <ellipse cx={peak[0]} cy={peak[1] + 1.5 * r} rx={crater.rx} ry={crater.ry} fill={grainEdge} stroke={DARK} strokeWidth={1.1 * r} />
      {trickle}
    </g>
  );
};
/** the square timber collar round the catillus' waist that carries the push-bars, with iron straps at its corners and
 *  where the bars pass through it: one beam (side 0..3) as its own volume, so the painter's order puts the back beams
 *  behind the stone and the front beams before it */
const COLLAR = 66;
const collarBeam = (m: Mill, a: number, side: number) => {
  // bar-local axes: u along the bar (a), v across it
  const U: [number, number] = [Math.sin(a), -Math.cos(a)];
  const V: [number, number] = [Math.cos(a), Math.sin(a)];
  const at = (u: number, v: number): V3 => [m.X + u * U[0] + v * V[0], BAR_Y, m.Z + u * U[1] + v * V[1]];
  const s = COLLAR;
  const ends: [V3, V3] = side === 0 ? [at(s, -s - 10), at(s, s + 10)] : side === 1 ? [at(-s, -s - 10), at(-s, s + 10)] : side === 2 ? [at(-s, s), at(s, s)] : [at(-s, -s), at(s, -s)];
  return { ends, mid: [(ends[0][0] + ends[1][0]) / 2, BAR_Y, (ends[0][2] + ends[1][2]) / 2] as V3, at };
};
const CollarBeam: React.FC<{ P: Persp; m: Mill; a: number; side: number; uid: string; tone: number }> = ({ P, m, a, side, uid, tone }) => {
  const { ends, at } = collarBeam(m, a, side);
  const timber = sinkVol(TIMBER, tone);
  const iron = sinkVol(IRON, Math.max(0.7, tone));
  const s = COLLAR;
  // the straps on this beam: its two ends, and where a bar crosses it (the u = +-s sides)
  const strapAt: V3[] = side < 2 ? [at(side === 0 ? s : -s, -s), at(side === 0 ? s : -s, s), at(side === 0 ? s : -s, 0)] : [];
  const lenDir = norm3(sub3(ends[1], ends[0]));
  return (
    <g>
      <Hexa P={P} v={barV(ends[0], ends[1], 9, 13)} ink={timber} uid={`${uid}t`} />
      {strapAt.map((c, i) => (
        <Hexa key={i} P={P} v={barV([c[0] - lenDir[0] * 6, c[1], c[2] - lenDir[2] * 6], [c[0] + lenDir[0] * 6, c[1], c[2] + lenDir[2] * 6], 11, 15)} ink={iron} uid={`${uid}s${i}`} />
      ))}
    </g>
  );
};
/** one half of the push-bar (axis -> tip) with its waist lug */
const BarHalf: React.FC<{ P: Persp; m: Mill; a: number; uid: string; tone: number }> = ({ P, m, a, uid, tone }) => {
  const ink = sinkVol(TIMBER, tone);
  const pt = (R: number, Y = BAR_Y): V3 => [m.X + R * Math.sin(a), Y, m.Z - R * Math.cos(a)];
  return (
    <g>
      <Hexa P={P} v={barV(pt(BAR_R + 6), pt(MILL.waistR - 4), 8, 8)} ink={ink} uid={`${uid}b`} />
      <Hexa P={P} v={barV(pt(MILL.waistR + 22), pt(MILL.waistR - 6), 15, 15)} ink={sinkVol(LAVA, tone)} uid={`${uid}l`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SLAVES (./romeCast Slave: coarse exomis, bare feet; the near mill's pair in fetters), POSES.push walking the
// bar round, both grips solved onto the drawn bar
// ---------------------------------------------------------------------------
/** where the pusher stands on the bar's circle, and how far behind the bar (along his walk) */
const BODY_R = 268;
const TAN_OFF = 96;
type Pusher = { at: P2; scale: number; pose: FigPose; Z: number; X: number; dir: 1 | -1; grip: { L: P2; R: P2 } };
const pusherAt = (P: Persp, m: Mill, th: number, end: 0 | 1, f: number, seed: number): Pusher => {
  const a = th + end * Math.PI;
  // the walking direction (the bar's tangent) and where he stands: on the bar's circle, behind the bar
  const t: [number, number] = [Math.cos(a), Math.sin(a)];
  const X = m.X + BODY_R * Math.sin(a) - TAN_OFF * t[0];
  const Z = m.Z - BODY_R * Math.cos(a) - TAN_OFF * t[1];
  const dir: 1 | -1 = t[0] >= 0 ? 1 : -1;
  // the rig's yaw from the facing (0 = toward us, 1.57 = across), kept in the three-quarter range it draws
  const facing = Math.atan2(t[0], -t[1]);
  const yaw = Math.max(0.5, Math.min(1.12, Math.abs(facing) * 0.82));
  const pl = P.at(X, Z);
  const scale = SCALE * pl.scale;
  // the walk: the feet advance with the bar (body radius x angle), the push's own stride
  const dist = BODY_R * MILL_OMEGA * f;
  const phase = dist / (2 * PUSH.stride * SCALE) + seed;
  let q = RPOSES.push(1, phase);
  q = { ...q, yaw, headYaw: yaw * 0.95 };
  if (dir < 0) q = mirrorPose(q);
  q = idle(q, f, 7 + seed * 10, 0.3);
  // the grips: the bar runs at his chest height, TAN_OFF ahead of him; his two fists a shoulder-width apart on it
  const barAt = (R: number) => P.p(m.X + R * Math.sin(a), BAR_Y, m.Z - R * Math.cos(a));
  const hp = [BODY_R + 22, BODY_R - 22].map((R) => ({ p: barAt(R), z: m.Z - R * Math.cos(a) }));
  // the near arm (L when he faces right) takes the grip nearer the camera
  const nearGrip = hp[0].z <= hp[1].z ? hp[0].p : hp[1].p;
  const farGrip = hp[0].z <= hp[1].z ? hp[1].p : hp[0].p;
  const grip = dir > 0 ? { L: nearGrip, R: farGrip } : { L: farGrip, R: nearGrip };
  return { at: pl.at, scale, pose: q, Z, X, dir, grip };
};
const SlaveFig: React.FC<{ p: Pusher; uid: string; tone: number; k: number; variant: number; fetters: boolean }> = ({ p, uid, tone, k, variant, fetters }) => {
  const dim = tone < 0.999 ? tintInk(CREAM, tone) : undefined;
  return (
    <g className="u4ink" style={{ ["--inkf" as string]: inkFactor(k * (p.scale / SCALE)).toFixed(4) } as React.CSSProperties}>
      <Slave pose={p.pose} at={p.at} scale={p.scale} uid={uid} variant={variant} garb="exomis" fetters={fetters} grip={p.grip} shade={1} ink={dim} cloth={dim} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PIER (Roman brick-faced concrete, a travertine plinth and impost)
// ---------------------------------------------------------------------------
const STONE_TRIM: VolInk = { lit: "#6F5D47", mid: "#4C3E2F", dark: "#241B14" };
const Pier: React.FC<{ P: Persp }> = ({ P }) => {
  const { X0, X1, Z0, Z1 } = PIER;
  const Ytop = PIER.Ytop;
  const r = P.r(Z0);
  const COURSE = 17;
  // brick courses on the front face, and along the side face the camera sees (receding to the VP)
  const vx = P.vp[0];
  const sideX = vx < X0 ? X0 : vx > X1 ? X1 : null;
  let d = "";
  let ds = "";
  let dv = "";
  let row = 0;
  for (let Y = -70; Y > Ytop; Y -= COURSE, row++) {
    d += `M${PT(P.p(X0, Y, Z0))}L${PT(P.p(X1, Y, Z0))}`;
    if (sideX !== null) ds += `M${PT(P.p(sideX, Y, Z0))}L${PT(P.p(sideX, Y, Z1))}`;
    for (let X = X0 + (row % 2 ? 19 : 0) + 19; X < X1 - 4; X += 38) dv += `M${PT(P.p(X, Y, Z0))}L${PT(P.p(X, Y - COURSE, Z0))}`;
    if (sideX !== null && row % 3 === 0) for (let Z = Z0 + (row % 2 ? 24 : 0) + 30; Z < Math.min(Z1, 1400) - 4; Z += 76) ds += `M${PT(P.p(sideX, Y, Z))}L${PT(P.p(sideX, Y - COURSE, Z))}`;
  }
  return (
    <g>
      <Hexa P={P} v={boxV(X0 - 7, X1 + 7, -52, 0, Z0 - 7, Z1)} ink={STONE_TRIM} uid="pplinth" />
      <Hexa P={P} v={boxV(X0, X1, Ytop, -52, Z0, Z1)} ink={BRICK} uid="pier" />
      <path d={d} stroke={DARK} strokeWidth={1.3 * r} strokeOpacity={0.5} fill="none" />
      <path d={ds} stroke={sideX === X1 ? "#4A3C2D" : DARK} strokeWidth={1.1 * r} strokeOpacity={sideX === X1 ? 0.55 : 0.42} fill="none" />
      <path d={dv} stroke={DARK} strokeWidth={1.0 * r} strokeOpacity={0.28} fill="none" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STEAM MILL: geared rim, pinion, line shaft, crown wheels, stone nuts, spindles, the stone pairs
// ---------------------------------------------------------------------------
/** a spur gear outline (machine or world units): N teeth on pitch radius R, turned by phase */
const gearD = (c: P2, N: number, R: number, depth: number, phase: number) => {
  const pts: string[] = [];
  const pa = (2 * Math.PI) / N;
  for (let i = 0; i < N; i++) {
    const a = phase + i * pa;
    const seq: [number, number][] = [
      [a - pa * 0.5, R - depth * 0.55],
      [a - pa * 0.2, R - depth * 0.55],
      [a - pa * 0.13, R + depth * 0.5],
      [a + pa * 0.13, R + depth * 0.5],
      [a + pa * 0.2, R - depth * 0.55],
    ];
    for (const [ang, rr] of seq) pts.push(`${fx(c[0] + rr * Math.cos(ang))},${fx(c[1] + rr * Math.sin(ang))}`);
  }
  return `M${pts.join("L")}Z`;
};
/** the flywheel's geared ring (machine units round SUN), outside its cream rim; `side` = its receding band */
const RIM_OUT = RIM_R + 27 + 3;
const RimGear: React.FC<{ phi: number; side?: boolean }> = ({ phi, side = false }) => {
  const d = gearD(SUN, N_FLY, FLY_PITCH, 30, phi);
  const ring = `M${SUN[0] - RIM_OUT} ${SUN[1]}a${RIM_OUT} ${RIM_OUT} 0 1 0 ${2 * RIM_OUT} 0a${RIM_OUT} ${RIM_OUT} 0 1 0 ${-2 * RIM_OUT} 0Z`;
  if (side) return <path d={`${d}${ring}`} fillRule="evenodd" fill="#7A4A0C" stroke="#7A4A0C" strokeWidth={4} />;
  return (
    <g>
      <path d={`${d}${ring}`} fillRule="evenodd" fill={ACCENT} stroke={DARK} strokeWidth={3.4} strokeLinejoin="round" />
      <circle cx={SUN[0]} cy={SUN[1]} r={FLY_PITCH - 22} fill="none" stroke={DARK} strokeOpacity={0.35} strokeWidth={2} />
    </g>
  );
};
/** the pinion on the line shaft (machine units, at the flywheel's left) */
const PIN_C: P2 = [SUN[0] - (FLY_PITCH + PIN_PITCH) * Math.cos(PIN_ANGLE), SUN[1] + (FLY_PITCH + PIN_PITCH) * Math.sin(PIN_ANGLE)];
const Pinion: React.FC<{ phi: number; side?: boolean }> = ({ phi, side = false }) => {
  const d = gearD(PIN_C, N_PIN, PIN_PITCH, 30, phi);
  if (side) return <path d={d} fill="#7A4A0C" stroke="#7A4A0C" strokeWidth={4} />;
  const spokes: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = phi + (i * Math.PI) / 2 + Math.PI / 4;
    spokes.push(<path key={i} d={`M${fx(PIN_C[0] + 34 * Math.cos(a))} ${fx(PIN_C[1] + 34 * Math.sin(a))}L${fx(PIN_C[0] + (PIN_PITCH - 34) * Math.cos(a))} ${fx(PIN_C[1] + (PIN_PITCH - 34) * Math.sin(a))}`} stroke={DARK} strokeWidth={20} strokeLinecap="round" />);
  }
  return (
    <g>
      <path d={d} fill={ACCENT} stroke={DARK} strokeWidth={3.4} strokeLinejoin="round" />
      <circle cx={PIN_C[0]} cy={PIN_C[1]} r={PIN_PITCH - 30} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={3} />
      {spokes}
      <circle cx={PIN_C[0]} cy={PIN_C[1]} r={PIN_PITCH - 44} fill="none" stroke={DARK} strokeOpacity={0.4} strokeWidth={2} />
      <rect x={PIN_C[0] - 26} y={PIN_C[1] - 26} width={52} height={52} fill={ACCENT} stroke={DARK} strokeWidth={3} />
      <rect x={PIN_C[0] - 13} y={PIN_C[1] - 13} width={26} height={26} fill="#3A2E20" stroke={DARK} strokeWidth={2} transform={`rotate(${fx((phi * 180) / Math.PI)} ${PIN_C[0]} ${PIN_C[1]})`} />
    </g>
  );
};
/** the crown wheel on the line shaft at depth Zc (face-on, world units), turning with the shaft */
const CrownWheel: React.FC<{ P: Persp; Zc: number; phi: number; tone: number; uid: string }> = ({ P, Zc, phi, tone, uid }) => {
  const c = P.p(SHAFT_X, SHAFT_Y, Zc);
  const r = P.r(Zc);
  const orange = mixColor(PAGE, ACCENT, tone);
  const deep = mixColor(PAGE, ACCENT_DEEP, tone);
  // its receding face (the teeth on its back face toward the stone nut): a thickness band offset toward the VP
  const cb = P.p(SHAFT_X, SHAFT_Y, Zc + 16);
  const rb = P.r(Zc + 16);
  return (
    <g>
      <path d={gearD(cb, 14, CROWN_R * rb, 12 * rb, phi)} fill={mixColor(PAGE, "#7A4A0C", tone)} stroke={DARK} strokeWidth={1.6 * r} />
      <path d={gearD(c, 14, CROWN_R * r, 12 * r, phi)} fill={orange} stroke={DARK} strokeWidth={2.2 * r} strokeLinejoin="round" />
      <circle cx={c[0]} cy={c[1]} r={(CROWN_R - 16) * r} fill={deep} stroke={DARK} strokeWidth={1.6 * r} />
      {[0, 1, 2].map((i) => {
        const a = phi + (i * 2 * Math.PI) / 3;
        return <path key={i} d={`M${fx(c[0] + 12 * r * Math.cos(a))} ${fx(c[1] + 12 * r * Math.sin(a))}L${fx(c[0] + (CROWN_R - 18) * r * Math.cos(a))} ${fx(c[1] + (CROWN_R - 18) * r * Math.sin(a))}`} stroke={DARK} strokeWidth={7 * r} strokeLinecap="round" />;
      })}
      <rect x={c[0] - 14 * r} y={c[1] - 14 * r} width={28 * r} height={28 * r} fill={orange} stroke={DARK} strokeWidth={1.6 * r} />
    </g>
  );
};
/** the stone nut: a lantern pinion on the spindle top, turning (staves sliding round) */
const StoneNut: React.FC<{ P: Persp; Zs: number; ang: number; tone: number; uid: string }> = ({ P, Zs, ang, tone, uid }) => {
  const Y0 = SHAFT_Y + CROWN_R - 6;
  const Y1 = Y0 + 30;
  const t = ringOf(P, SHAFT_X, Zs, NUT_R, Y0);
  const b = ringOf(P, SHAFT_X, Zs, NUT_R, Y1);
  const r = P.r(Zs);
  const orange = mixColor(PAGE, ACCENT, tone);
  const deep = mixColor(PAGE, ACCENT_DEEP, tone);
  const staves: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const a = ang + (i * Math.PI) / 4;
    if (Math.cos(a) < 0.05) continue;
    const x = Math.sin(a);
    staves.push(<path key={i} d={`M${fx(t.c[0] + t.rx * x)} ${fx(t.c[1] + t.ry * Math.cos(a))}L${fx(b.c[0] + b.rx * x)} ${fx(b.c[1] + b.ry * Math.cos(a))}`} stroke={DARK} strokeWidth={2.2 * r} strokeOpacity={0.4 + 0.5 * Math.cos(a)} />);
  }
  return (
    <g>
      <path d={`M${fx(t.c[0] - t.rx)} ${fx(t.c[1])}L${fx(b.c[0] - b.rx)} ${fx(b.c[1])}A${fx(b.rx)} ${fx(b.ry)} 0 0 0 ${fx(b.c[0] + b.rx)} ${fx(b.c[1])}L${fx(t.c[0] + t.rx)} ${fx(t.c[1])}Z`} fill={orange} stroke={DARK} strokeWidth={2 * r} />
      <path d={`M${fx(t.c[0] + t.rx * 0.35)} ${fx(t.c[1])}L${fx(t.c[0] + t.rx)} ${fx(t.c[1])}L${fx(b.c[0] + b.rx)} ${fx(b.c[1])}L${fx(b.c[0] + b.rx * 0.35)} ${fx(b.c[1] + b.ry)}Z`} fill={deep} opacity={0.7} />
      {staves}
      <ellipse cx={t.c[0]} cy={t.c[1]} rx={t.rx} ry={t.ry} fill={orange} stroke={DARK} strokeWidth={2 * r} />
    </g>
  );
};
/** one stone pair at depth Zs: hurst frame, bed stone, the runner (orange iron hoop) turning, the hopper and shoe,
 *  the meal spout */
const StonePair: React.FC<{ P: Persp; Zs: number; ang: number; tone: number; uid: string }> = ({ P, Zs, ang, tone, uid }) => {
  const X = SHAFT_X;
  const r = P.r(Zs);
  const timber = sinkVol(TIMBER, tone);
  const burr = sinkVol(BURR, tone);
  const hoop = sinkVol(HOOP, tone);
  const bedTop = -HURST.h - BED_H;
  const runTop = RUNNER_TOP;
  // the runner's top: the eye, the rynd bar and the burr joints, turning
  const rt = ringOf(P, X, Zs, STONE_R - 2, runTop);
  const marks: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const a = ang + (i * Math.PI) / 3;
    const q0 = P.p(X + 24 * Math.sin(a), runTop, Zs - 24 * Math.cos(a));
    const q1 = P.p(X + (STONE_R - 8) * Math.sin(a), runTop, Zs - (STONE_R - 8) * Math.cos(a));
    marks.push(<path key={i} d={`M${PT(q0)}L${PT(q1)}`} stroke={DARK} strokeWidth={1.3 * r} strokeOpacity={0.45} />);
  }
  // the hoop's bolts on the runner's side (front half), sliding round
  const bolts: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ang * 1 + (i * Math.PI) / 5;
    if (Math.cos(a) < 0.1) continue;
    const p = P.p(X + (STONE_R + 1) * Math.sin(a), runTop + RUNNER_H * 0.5, Zs - (STONE_R + 1) * Math.cos(a));
    bolts.push(<circle key={i} cx={p[0]} cy={p[1]} r={3 * r} fill={mixColor(PAGE, "#5A3708", tone)} opacity={Math.min(1, Math.cos(a) * 3)} />);
  }
  const eye = ringOf(P, X, Zs, 20, runTop);
  // the hopper: an open timber box on a horse, front-left of the spindle, its shoe feeding the eye
  const hX = X - 44;
  const hZ = Zs - 40;
  const hTop = runTop - 104;
  const hBot = runTop - 40;
  const hopV: V3[] = [
    [hX - 46, hTop, hZ - 46],
    [hX + 46, hTop, hZ - 46],
    [hX + 14, hBot, hZ - 14],
    [hX - 14, hBot, hZ - 14],
    [hX - 46, hTop, hZ + 46],
    [hX + 46, hTop, hZ + 46],
    [hX + 14, hBot, hZ + 14],
    [hX - 14, hBot, hZ + 14],
  ];
  const grainTop = [P.p(hX - 40, hTop + 8, hZ - 40), P.p(hX + 40, hTop + 8, hZ - 40), P.p(hX + 40, hTop + 8, hZ + 40), P.p(hX - 40, hTop + 8, hZ + 40)];
  const shoe0 = P.p(hX, hBot + 2, hZ);
  const shoe1 = P.p(X - 6, runTop - 4, Zs - 6);
  // the shoe jiggles (the damsel knocks it) with the stone
  const jig = 2 * Math.sin(ang * 6) * r;
  return (
    <g>
      {/* the hurst: an open timber frame (four posts, a low rail, the deck) */}
      {([[-1, 1], [1, 1], [-1, -1], [1, -1]] as const).map(([sx, sz]) => {
        const px = X + sx * (HURST.hw - 16);
        const pz = Zs + sz * (HURST.hw - 16);
        return <Hexa key={`${sx}${sz}`} P={P} v={boxV(px - 14, px + 14, -HURST.h + 24, 0, pz - 14, pz + 14)} ink={timber} uid={`${uid}p${sx}${sz}`} />;
      })}
      <Hexa P={P} v={boxV(X - HURST.hw + 2, X + HURST.hw - 2, -52, -34, Zs - HURST.hw + 6, Zs - HURST.hw + 22)} ink={timber} uid={`${uid}rl`} />
      <Hexa P={P} v={boxV(X - HURST.hw, X + HURST.hw, -HURST.h, -HURST.h + 26, Zs - HURST.hw, Zs + HURST.hw)} ink={timber} uid={`${uid}h`} />
      <Lathe P={P} X={X} Z={Zs} prof={[[STONE_R + 4, bedTop], [STONE_R + 6, -HURST.h]]} ink={burr} uid={`${uid}b`} />
      <Lathe P={P} X={X} Z={Zs} prof={[[STONE_R, runTop], [STONE_R, runTop + RUNNER_H]]} ink={hoop} uid={`${uid}r`} />
      {bolts}
      <ellipse cx={rt.c[0]} cy={rt.c[1]} rx={rt.rx} ry={rt.ry} fill={burr.lit} stroke={DARK} strokeWidth={1.8 * r} />
      {marks}
      <ellipse cx={eye.c[0]} cy={eye.c[1]} rx={eye.rx} ry={eye.ry} fill={burr.dark} stroke={DARK} strokeWidth={1.4 * r} />
      {/* the hopper and its shoe */}
      <path d={`M${PT(shoe0)}L${fx(shoe1[0])} ${fx(shoe1[1] + jig)}`} stroke={DARK} strokeWidth={9 * r} strokeLinecap="round" />
      <path d={`M${PT(shoe0)}L${fx(shoe1[0])} ${fx(shoe1[1] + jig)}`} stroke={timber.lit} strokeWidth={5.5 * r} strokeLinecap="round" />
      <Hexa P={P} v={hopV} ink={timber} uid={`${uid}hp`} />
      <path d={`M${grainTop.map(PT).join("L")}Z`} fill={mixColor(PAGE, "#D9C79A", tone)} stroke={DARK} strokeWidth={1.2 * r} />
    </g>
  );
};
/** the spindle from the stone nut down to the runner's eye (square iron) */
const Spindle: React.FC<{ P: Persp; Zs: number; tone: number; uid: string }> = ({ P, Zs, tone, uid }) => (
  <Hexa P={P} v={boxV(SHAFT_X - 7, SHAFT_X + 7, SHAFT_Y + CROWN_R + 22, RUNNER_TOP + 2, Zs - 7, Zs + 7)} ink={sinkVol(IRON, Math.max(tone, 0.8))} uid={uid} />
);

/** the meal spout of the nearest pair: a square timber chute from the bed stone's case, out over the hurst's left
 *  side and down to the hook the sack hangs on */
const spoutEnds = (Zs: number) => {
  const A: V3 = [SHAFT_X - STONE_R - 6, -HURST.h - 14, Zs - 34];
  const B: V3 = [SACK.X + 4, -SACK.h - 8, SACK.Z + 2];
  return { A, B };
};
const Spout: React.FC<{ P: Persp; Zs: number }> = ({ P, Zs }) => {
  const { A, B } = spoutEnds(Zs);
  const dir = norm3(sub3(B, A));
  const side = norm3(cross(dir, [0, -1, 0]));
  const up = cross(side, dir);
  const hw = 11;
  const hh = 9;
  const corner = (E: V3, s: number, u: number): V3 => [E[0] + side[0] * hw * s + up[0] * hh * u, E[1] + side[1] * hw * s + up[1] * hh * u, E[2] + side[2] * hw * s + up[2] * hh * u];
  const v: V3[] = [corner(B, -1, 1), corner(B, 1, 1), corner(B, 1, -1), corner(B, -1, -1), corner(A, -1, 1), corner(A, 1, 1), corner(A, 1, -1), corner(A, -1, -1)];
  // the sack hook under the lip
  const r = P.r(B[2]);
  const h0 = P.p(B[0] + 6, B[1] + 6, B[2]);
  return (
    <g>
      <Hexa P={P} v={v} ink={TIMBER} uid="spout" />
      <path d={`M${PT(h0)}q${fx(5 * r)} ${fx(8 * r)} ${fx(-1 * r)} ${fx(13 * r)}`} fill="none" stroke={DARK} strokeWidth={3.2 * r} strokeLinecap="round" />
    </g>
  );
};
/** the sack: a narrow bag hanging by its gathered, tied neck from the spout's hook, its foot on the floor; the flour
 *  inside fills it from the bottom (the full part rounds out, the slack upper part creases), a shake at f112 */
const SACK_SHAKE = 112;
const sackJig = (f: number) => 3.2 * Math.sin((f - SACK_SHAKE) * 1.3) * Math.max(0, 1 - Math.abs(f - SACK_SHAKE - 6) / 7) * (f >= SACK_SHAKE ? 1 : 0);
const HangingSack: React.FC<{ P: Persp; fill: number; jig: number }> = ({ P, fill, jig }) => {
  const base = P.p(SACK.X, 0, SACK.Z);
  const r = P.r(SACK.Z);
  const h = SACK.h;
  const neck = -h + 22;
  const wf = 31 + 9 * fill;
  const Lf = h * (0.3 + 0.42 * fill);
  const body = `M-8 ${neck}C-12 ${neck + 22} ${-wf * 0.78} ${-Lf - 34} ${-wf * 0.93} ${-Lf}C${-wf * 1.06} ${-Lf * 0.62} ${-wf * 1.02} -10 ${-wf * 0.72} -2Q0 5 ${wf * 0.72} -2C${wf * 1.02} -10 ${wf * 1.06} ${-Lf * 0.62} ${wf * 0.93} ${-Lf}C${wf * 0.78} ${-Lf - 34} 12 ${neck + 22} 8 ${neck}Z`;
  const ruff = `M-8 ${neck}L-15 ${neck - 9}L-8 ${neck - 13}L-2 ${-h + 2}L5 ${neck - 13}L13 ${neck - 10}L8 ${neck}Z`;
  return (
    <g transform={`translate(${fx(base[0] + jig * r)} ${fx(base[1])}) scale(${r.toFixed(5)})`}>
      <clipPath id="hsack">
        <path d={body} />
      </clipPath>
      <path d={body} fill={CREAM.main} />
      <g clipPath="url(#hsack)">
        {/* the form shadow on the right, the slack part's creases above the flour */}
        <path d={`M${wf * 0.12} ${neck}L${wf + 10} ${neck}L${wf + 10} 8L${wf * 0.12} 8Z`} fill={CREAM.deep} />
        <path d={hatchD(wf * 0.18, neck, wf + 12, 8, 4.2, 0.35)} stroke={DARK} strokeWidth={0.9} strokeOpacity={0.38} fill="none" />
        <path d={`M-4 ${neck + 8}Q${-wf * 0.5} ${(neck - Lf) / 2} ${-wf * 0.42} ${-Lf - 4}M5 ${neck + 10}Q${wf * 0.15} ${(neck - Lf) / 2} ${wf * 0.3} ${-Lf - 6}M-1 ${neck + 14}L-3 ${-Lf - 14}`} stroke={DARK} strokeOpacity={0.5} strokeWidth={1.6} fill="none" />
        <path d={`M${-wf} ${-Lf}Q0 ${-Lf - 12} ${wf} ${-Lf}`} stroke={DARK} strokeOpacity={0.28} strokeWidth={1.4} fill="none" />
        <path d={`M${-wf * 0.6} ${-Lf * 0.55}Q${-wf * 0.45} ${-Lf * 0.3} ${-wf * 0.55} ${-Lf * 0.08}`} stroke="#FFF6DD" strokeOpacity={0.35} strokeWidth={5} fill="none" />
      </g>
      <path d={body} fill="none" stroke={DARK} strokeWidth={2.4} strokeLinejoin="round" />
      {/* the gathered neck round the spout's lip and its tie */}
      <path d={ruff} fill={CREAM.deep} stroke={DARK} strokeWidth={2} strokeLinejoin="round" />
      <rect x={-12} y={neck - 3} width={24} height={7} rx={3} fill="#5B4A33" stroke={DARK} strokeWidth={1.8} />
    </g>
  );
};
/** worker 1: facing right at the nearest pair, his near hand on the meal spout, his far hand on the sack's neck (he
 *  gives it a shake at f112) */
const workerAt = (P: Persp, f: number) => {
  const pl = P.at(WORKER.X, WORKER.Z);
  const scale = SCALE * pl.scale;
  const base: FigPose = { ...POSES.stand(1), lean: 10, crouch: 6, footL: [-26, 0], footR: [18, 0] };
  // he looks at the spout, then down at the sack as he shakes it, then up the row
  const look = c01((f - 104) / 10) * (1 - c01((f - 126) / 12));
  let q = headTurn(base, 0.7, 6 + 14 * look);
  q = idle(q, f, 23, 0.6);
  const { A, B } = spoutEnds(STONES_Z[0]);
  const u = 0.62;
  const onSpout = P.p(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - 10, A[2] + (B[2] - A[2]) * u);
  const jig = sackJig(f);
  const onNeck = P.p(SACK.X - 2 + jig, -SACK.h + 6, SACK.Z - 6);
  const want = { L: onSpout, R: onNeck };
  let wL: P2 = [(want.L[0] - pl.at[0]) / scale, (want.L[1] - pl.at[1]) / scale];
  let wR: P2 = [(want.R[0] - pl.at[0]) / scale, (want.R[1] - pl.at[1]) / scale];
  const tryArms = (l: P2, r: P2): FigPose => ({ ...q, armL: { w: l, elbow: [0.2, 1], fist: 0.7, hand: 0 }, armR: { w: r, elbow: [0.3, 1], fist: 0.9, hand: 10 } });
  for (let i = 0; i < 4; i++) {
    const an = castAnchors("worker", tryArms(wL, wR), pl.at, scale);
    wL = [wL[0] + (want.L[0] - an.handL[0]) / scale, wL[1] + (want.L[1] - an.handL[1]) / scale];
    wR = [wR[0] + (want.R[0] - an.handR[0]) / scale, wR[1] + (want.R[1] - an.handR[1]) / scale];
  }
  return { at: pl.at, scale, pose: tryArms(wL, wR) };
};

/** a filled sack lying on its side (world units at its depth, centred on c) */
const LyingSack: React.FC<{ P: Persp; c: V3; tone: number; uid: string; tilt?: number }> = ({ P, c, tone, uid, tilt = 0 }) => {
  const p = P.p(c[0], c[1], c[2]);
  const r = P.r(c[2]);
  const L = STACK.sl / 2;
  const H = STACK.sh / 2;
  const main = mixColor(PAGE, CREAM.main, tone);
  const deep = mixColor(PAGE, CREAM.deep, tone);
  const d = `M${-L + 6} ${-H}Q0 ${-H - 5} ${L - 6} ${-H}Q${L + 2} 0 ${L - 6} ${H}Q0 ${H + 4} ${-L + 6} ${H}Q${-L - 2} 0 ${-L + 6} ${-H}Z`;
  return (
    <g transform={`translate(${fx(p[0])} ${fx(p[1])}) rotate(${tilt.toFixed(2)}) scale(${r.toFixed(5)})`}>
      <clipPath id={`${uid}c`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={main} />
      <path d={`M${-L} 2L${L + 4} 2L${L + 4} ${H + 6}L${-L} ${H + 6}Z`} fill={deep} clipPath={`url(#${uid}c)`} />
      <path d={d} fill="none" stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
      {/* the tied ear */}
      <path d={`M${L - 5} -5L${L + 7} -9L${L + 9} 2L${L + 6} 8L${L - 5} 5Z`} fill={deep} stroke={DARK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d={`M${-L + 12} ${-H + 6}Q-4 ${-H + 2} 6 ${-H + 7}`} stroke={DARK} strokeOpacity={0.35} strokeWidth={1.3} fill="none" />
    </g>
  );
};
/** the stack worker 2 builds: the left column one short (his sack goes there), the right column four high */
const stackSlots = () => {
  const out: { c: V3; key: string }[] = [];
  const colX = [STACK.X - STACK.sl / 2 - 1, STACK.X + STACK.sl / 2 + 1];
  colX.forEach((x, ci) => {
    const n = ci === 0 ? 3 : 4;
    for (let i = 0; i < n; i++) out.push({ c: [x + (i % 2 ? 2 : -2), -(i + 0.5) * STACK.sh, STACK.Z + ci * 4], key: `s${ci}${i}` });
  });
  return out;
};
const STACK_TOP: V3 = [STACK.X - STACK.sl / 2 - 1, -3.5 * STACK.sh, STACK.Z - 2];
/** worker 2's sack (its centre) over the cut: held at his waist, heaved up, then set on the stack's top (released) */
const liftSackAt = (f: number): { c: V3; held: boolean } => {
  const hold: V3 = [WORKER2.X + 62, -168 + 3 * Math.sin(f / 8), WORKER2.Z - 10];
  const high: V3 = [WORKER2.X + 70, -232, WORKER2.Z - 10];
  if (f <= LIFT.up0) return { c: hold, held: true };
  if (f <= LIFT.up1) {
    const t = ease((f - LIFT.up0) / (LIFT.up1 - LIFT.up0));
    return { c: [hold[0] + (high[0] - hold[0]) * t, hold[1] + (high[1] - hold[1]) * t, hold[2]], held: true };
  }
  if (f < LIFT.set1) {
    const t = ease((f - LIFT.up1) / (LIFT.set1 - LIFT.up1));
    return { c: [high[0] + (STACK_TOP[0] - high[0]) * t, high[1] + (STACK_TOP[1] - high[1]) * t - 18 * Math.sin(Math.PI * t), high[2] + (STACK_TOP[2] - high[2]) * t], held: true };
  }
  return { c: STACK_TOP, held: false };
};
const worker2At = (P: Persp, f: number) => {
  const pl = P.at(WORKER2.X, WORKER2.Z);
  const scale = SCALE * pl.scale;
  const ls = liftSackAt(f);
  const heave = ease((f - LIFT.up0 + 4) / 14) * (1 - ease((f - LIFT.up1) / 14));
  const set = ease((f - LIFT.up1) / (LIFT.set1 - LIFT.up1)) * (1 - ease((f - LIFT.set1 - 4) / 14));
  const base: FigPose = { ...POSES.stand(1), lean: 8 + 10 * set - 4 * heave, crouch: 10 + 8 * set - 6 * heave, footL: [-24, 0], footR: [20, 0] };
  let q = headTurn(base, 0.7 + 0.2 * set, 10 + 8 * set - 10 * heave);
  q = idle(q, f, 41, 0.5);
  const free: FigPose = { ...q, armL: { w: [-20, -140], elbow: [-0.3, 1], fist: 0.4, hand: 0 }, armR: { w: [34, -142], elbow: [0.1, 1], fist: 0.4, hand: 0 } };
  const grips = { L: P.p(ls.c[0] - STACK.sl / 2 + 8, ls.c[1] - 6, ls.c[2]), R: P.p(ls.c[0] + STACK.sl / 2 - 6, ls.c[1] - 8, ls.c[2]) };
  let wL: P2 = [(grips.L[0] - pl.at[0]) / scale, (grips.L[1] - pl.at[1]) / scale];
  let wR: P2 = [(grips.R[0] - pl.at[0]) / scale, (grips.R[1] - pl.at[1]) / scale];
  const tryArms = (l: P2, r: P2): FigPose => ({ ...q, armL: { w: l, elbow: [0.2, 1], fist: 0.9, hand: 0 }, armR: { w: r, elbow: [0.2, 1], fist: 0.9, hand: 0 } });
  for (let i = 0; i < 4; i++) {
    const an = castAnchors("worker", tryArms(wL, wR), pl.at, scale);
    wL = [wL[0] + (grips.L[0] - an.handL[0]) / scale, wL[1] + (grips.L[1] - an.handL[1]) / scale];
    wR = [wR[0] + (grips.R[0] - an.handR[0]) / scale, wR[1] + (grips.R[1] - an.handR[1]) / scale];
  }
  const holding = tryArms(wL, wR);
  // after the release the hands come off the sack and down
  const rel = ls.held ? 0 : ease((f - LIFT.set1) / 12);
  return { at: pl.at, scale, pose: rel > 0 ? lerpFig(holding, free, rel) : holding, sack: ls };
};

/** the A-frame standard behind the flywheel: two raking legs, a tie, the foot plate and the bearing block */
const AFrame: React.FC<{ P: Persp }> = ({ P }) => {
  const { footHW, topHW, z0, z1 } = ASTAND;
  const yTop = AXLE_Y + 50;
  const leg = (s: number): V3[] => {
    const xo0 = EX + s * footHW;
    const xi0 = EX + s * (footHW - 56);
    const xo1 = EX + s * topHW;
    const xi1 = EX + s * (topHW - 34);
    const [l0, r0] = s < 0 ? [xo0, xi0] : [xi0, xo0];
    const [l1, r1] = s < 0 ? [xo1, xi1] : [xi1, xo1];
    return [
      [l1, yTop, z0],
      [r1, yTop, z0],
      [r0, -24, z0],
      [l0, -24, z0],
      [l1, yTop, z1],
      [r1, yTop, z1],
      [r0, -24, z1],
      [l0, -24, z1],
    ];
  };
  const tieY = -330;
  const u = (tieY - -24) / (yTop - -24);
  const tx = footHW - 56 + (topHW - 34 - (footHW - 56)) * u;
  return (
    <g>
      <Hexa P={P} v={boxV(EX - footHW - 18, EX + footHW + 18, -24, 0, z0 - 14, z1 + 14)} ink={IRON} uid="afoot" />
      <Hexa P={P} v={leg(-1)} ink={IRON} uid="alegL" />
      <Hexa P={P} v={leg(1)} ink={IRON} uid="alegR" />
      <Hexa P={P} v={boxV(EX - tx - 6, EX + tx + 6, tieY - 14, tieY, z0 + 40, z1 - 40)} ink={IRON} uid="atie" />
      <Hexa P={P} v={boxV(EX - 92, EX + 92, AXLE_Y - 40, AXLE_Y + 52, z0 - 4, z1 + 4)} ink={IRON} uid="ablock" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
/** the near mill's props: two full grain sacks leaning on its base (front-right), a basket of flour by the tray */
const MILL_PROPS: { key: string; kind: "sack" | "basket"; a: number; R: number; tilt: number }[] = [
  { key: "sk1", kind: "sack", a: (48 * Math.PI) / 180, R: 176, tilt: -7 },
  { key: "sk2", kind: "sack", a: (70 * Math.PI) / 180, R: 178, tilt: -11 },
  { key: "bk", kind: "basket", a: (10 * Math.PI) / 180, R: 200, tilt: 0 },
];
/** the pushers' faces: the near mill's pair (fettered), the far mill's pair */
const SLAVE_VARIANTS = [
  [1, 0],
  [2, 4],
];
type Item = { Z: number; key: string; g?: React.ReactNode; cam?: Cam; el?: React.ReactNode; X?: number };
const RimSide: React.FC = () => (
  <g fill="none">
    <circle cx={SUN[0]} cy={SUN[1]} r={RIM_R} stroke={IRON.dark} strokeWidth={62} />
    <circle cx={SUN[0]} cy={SUN[1]} r={HUB_RING_R} fill={IRON.dark} />
  </g>
);

const MuscleOrMachine: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const P = perspective(cam, DEPTH);
  const items: Item[] = [];
  // X: which side of the wall the thing stands (default: the steam side)
  const add = (Z: number, key: string, g: React.ReactNode, c?: Cam, X = EX) => items.push({ Z, key, g, cam: c, X });

  // ---- ROME: two mills, their bars, their pushers ----
  MILLS.forEach((m, mi) => {
    const th = millAngle(m, f);
    const tone = m.tone;
    add(m.Z + 1, `mb${mi}`, <MillBase P={P} m={m} f={f} uid={`m${mi}`} tone={tone} />, undefined, m.X);
    add(m.Z, `mc${mi}`, <Catillus P={P} m={m} th={th} f={f} uid={`m${mi}`} tone={tone} />, undefined, m.X);
    ([0, 1] as const).forEach((e) => {
      const a = th + e * Math.PI;
      add(m.Z - (BAR_R / 2) * Math.cos(a), `bar${mi}${e}`, <BarHalf P={P} m={m} a={a} uid={`m${mi}b${e}`} tone={tone} />, undefined, m.X);
      const p = pusherAt(P, m, th, e, f, mi * 0.37 + e * 0.5);
      add(p.Z, `sl${mi}${e}`, <SlaveFig p={p} uid={`m${mi}s${e}`} tone={tone} k={cam.k} variant={SLAVE_VARIANTS[mi][e]} fetters={mi === 0} />, undefined, p.X);
    });
    // the square timber collar at the waist, its beams sorted by depth
    for (let side = 0; side < 4; side++) {
      const cb = collarBeam(m, th, side);
      add(cb.mid[2], `cb${mi}${side}`, <CollarBeam P={P} m={m} a={th} side={side} uid={`m${mi}cb${side}`} tone={tone} />, undefined, m.X);
    }
  });
  // the near mill's grain sacks leaning on its base and a basket of flour by the tray
  MILL_PROPS.forEach((pr) => {
    const m = MILLS[0];
    const X = m.X + pr.R * Math.sin(pr.a);
    const Z = m.Z - pr.R * Math.cos(pr.a);
    const pl = P.at(X, Z);
    const sc = SCALE * pl.scale;
    add(Z, `prop${pr.key}`, (
      <g className="u4ink" style={{ ["--inkf" as string]: inkFactor(cam.k * pl.scale).toFixed(4) } as React.CSSProperties}>
        {pr.kind === "sack" ? (
          <g transform={`rotate(${pr.tilt} ${fx(pl.at[0])} ${fx(pl.at[1])})`}>
            <Sack at={pl.at} scale={sc * 1.15} uid={`mm${pr.key}`} />
          </g>
        ) : (
          <g>
            <Basket at={pl.at} scale={sc} uid={`mm${pr.key}`} full={0} />
            <g transform={`translate(${fx(pl.at[0])} ${fx(pl.at[1])}) scale(${sc.toFixed(5)})`}>
              <path d="M-27,-50Q-14,-80 2,-74Q16,-78 27,-50Z" fill={INK} stroke={DARK} strokeWidth={2} strokeLinejoin="round" />
              <path d="M6,-72Q18,-68 24,-52" stroke="#BCAE8C" strokeWidth={4} fill="none" />
            </g>
          </g>
        )}
      </g>
    ), undefined, X);
  });
  // ---- the pier ----
  const wall: Item = { Z: PIER.Z0, key: "pier", g: <Pier P={P} /> };

  // ---- THE STEAM MILL ----
  const phiF = flyAngle(f);
  const phiP = pinAngle(f);
  add((ASTAND.z0 + ASTAND.z1) / 2, "aframe", <AFrame P={P} />);
  for (let i = 0; i < 6; i++) {
    const Z = Z_WHEEL + 30 - i * 5;
    add(Z, `rs${i}`, <RimSide />, engineCamAt(cam, Z));
    add(Z - 0.1, `gs${i}`, <RimGear phi={phiF} side />, engineCamAt(cam, Z));
    add(Z - 0.2, `ps${i}`, <Pinion phi={phiP} side />, engineCamAt(cam, Z));
  }
  add(Z_WHEEL + 0.2, "rimgear", <RimGear phi={phiF} />, engineCamAt(cam, Z_WHEEL));
  items.push({ Z: Z_WHEEL, key: "wheel", el: <SunAndPlanetMachine key="wheel" frame={engineFrameAt(f)} cam={engineCamAt(cam, Z_WHEEL)} idPrefix="mmE" pedestal={false} /> });
  add(Z_WHEEL - 2, "pinion", <Pinion phi={phiP} />, engineCamAt(cam, Z_WHEEL - 2));
  // the line shaft in pieces between its crown wheels and the pinion (so each wheel sits on it in depth), held up at
  // its ends by iron hangers from the roof
  const crownZ = STONES_Z.map((Zs) => Zs + CROWN_DZ);
  const cuts = [SHAFT_Z0, ...crownZ, Z_WHEEL - 2, SHAFT_Z1].sort((p, q) => p - q);
  for (let i = 0; i < cuts.length - 1; i++) {
    const za = cuts[i];
    const zb = cuts[i + 1];
    add((za + zb) / 2, `sh${i}`, <Hexa P={P} v={boxV(SHAFT_X - SHAFT_HW, SHAFT_X + SHAFT_HW, SHAFT_Y - SHAFT_HW, SHAFT_Y + SHAFT_HW, za, zb)} ink={sinkVol(IRON, Math.max(0.6, depthT(za)))} uid={`sh${i}`} />);
  }
  [200, 1000].forEach((Zh, i) =>
    add(Zh, `hang${i}`, (
      <g>
        <Hexa P={P} v={boxV(SHAFT_X - 9, SHAFT_X + 9, -2200, SHAFT_Y - SHAFT_HW, Zh - 9, Zh + 9)} ink={sinkVol(IRON, Math.max(0.6, depthT(Zh)))} uid={`hg${i}`} />
        <Hexa P={P} v={boxV(SHAFT_X - 26, SHAFT_X + 26, SHAFT_Y - SHAFT_HW - 16, SHAFT_Y + SHAFT_HW + 14, Zh - 16, Zh + 16)} ink={sinkVol(IRON, Math.max(0.6, depthT(Zh)))} uid={`hb${i}`} />
      </g>
    )),
  );
  STONES_Z.forEach((Zs, i) => {
    const tone = depthT(Zs);
    const ang = stoneAngle(f, i);
    add(Zs + CROWN_DZ - 0.5, `cw${i}`, <CrownWheel P={P} Zc={Zs + CROWN_DZ} phi={phiP + i * 0.4} tone={tone} uid={`cw${i}`} />);
    add(Zs - 1, `nut${i}`, <StoneNut P={P} Zs={Zs} ang={ang} tone={tone} uid={`nut${i}`} />);
    add(Zs + 1, `sp${i}`, <Spindle P={P} Zs={Zs} tone={tone} uid={`spd${i}`} />);
    add(Zs + 2, `st${i}`, <StonePair P={P} Zs={Zs} ang={ang} tone={tone} uid={`st${i}`} />);
  });
  const Z1 = STONES_Z[0];
  add(SACK.Z + 20, "spout", <Spout P={P} Zs={Z1} />);
  add(SACK.Z, "sack", <HangingSack P={P} fill={sackFill(f)} jig={sackJig(f)} />);
  const wk = workerAt(P, f);
  add(WORKER.Z, "worker", (
    <g className="u4ink" style={{ ["--inkf" as string]: inkFactor(cam.k * rOf(WORKER.Z)).toFixed(4) } as React.CSSProperties}>
      <Worker pose={wk.pose} at={wk.at} scale={wk.scale} uid="mmwk" shade={1} />
    </g>
  ));
  // worker 2, further down the row, and the stack he builds
  const t2 = depthT(WORKER2.Z);
  const ink2 = tintInk(CREAM, t2);
  stackSlots().forEach((sl) => add(sl.c[2] + 0.1 * sl.c[1], `stk${sl.key}`, <LyingSack P={P} c={sl.c} tone={t2} uid={`stk${sl.key}`} tilt={sl.key.endsWith("1") ? 2 : -1.5} />));
  const w2 = worker2At(P, f);
  add(WORKER2.Z, "worker2", (
    <g className="u4ink" style={{ ["--inkf" as string]: inkFactor(cam.k * rOf(WORKER2.Z)).toFixed(4) } as React.CSSProperties}>
      <Worker pose={w2.pose} at={w2.at} scale={w2.scale} uid="mmwk2" shade={1} ink={ink2} coat={ink2} />
    </g>
  ));
  add(w2.sack.held ? WORKER2.Z - 12 : STACK_TOP[2] - 20, "liftsack", <LyingSack P={P} c={w2.sack.c} tone={t2} uid="lift" tilt={w2.sack.held ? -4 : -1} />);

  // the wall: whatever stands behind its front end on the far side from the camera is drawn before it, the rest after
  const beyond = (it: Item) => {
    const X = it.X ?? EX;
    if (it.Z <= PIER.Z0 + 4) return false;
    if (cam.cx < PIER.X0) return X > PIER.X1;
    if (cam.cx > PIER.X1) return X < PIER.X0;
    return X >= PIER.X0 && X <= PIER.X1;
  };
  const byZ = (p: Item, q: Item) => q.Z - p.Z;
  const ordered = [...items.filter(beyond).sort(byZ), wall, ...items.filter((it) => !beyond(it)).sort(byZ)];
  const layers: React.ReactNode[] = [];
  let run: React.ReactNode[] = [];
  const flush = () => {
    if (run.length)
      layers.push(
        <svg key={`L${layers.length}`} width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {layers.length === 0 ? <style>{INK_CSS}</style> : null}
          {run}
        </svg>,
      );
    run = [];
  };
  for (const it of ordered) {
    if (it.el) {
      flush();
      layers.push(it.el);
      continue;
    }
    run.push(
      <g key={it.key} transform={camTransform(it.cam ?? cam).svg}>
        {it.g}
      </g>,
    );
  }
  flush();

  // contact shadows on the floor, under everything that stands on it
  const shadows: React.ReactNode[] = [];
  MILLS.forEach((m, mi) => {
    shadows.push(<ContactShadow key={`ms${mi}`} P={P} X={m.X} Z={m.Z} w={170} d={160} uid={`mcs${mi}`} amt={0.7 * m.tone} />);
    const th = millAngle(m, f);
    ([0, 1] as const).forEach((e) => {
      const a = th + e * Math.PI;
      const X = m.X + BODY_R * Math.sin(a) - TAN_OFF * Math.cos(a);
      const Z = m.Z - BODY_R * Math.cos(a) - TAN_OFF * Math.sin(a);
      shadows.push(<ContactShadow key={`ss${mi}${e}`} P={P} X={X} Z={Z} w={62} d={30} uid={`scs${mi}${e}`} amt={m.tone} />);
    });
  });
  MILL_PROPS.forEach((pr) => shadows.push(<ContactShadow key={pr.key} P={P} X={MILLS[0].X + pr.R * Math.sin(pr.a)} Z={MILLS[0].Z - pr.R * Math.cos(pr.a)} w={34} d={20} uid={`pcs${pr.key}`} />));
  shadows.push(<ContactShadow key="pier" P={P} X={(PIER.X0 + PIER.X1) / 2} Z={PIER.Z0 + 60} w={90} d={70} uid="pcs" amt={0.8} />);
  shadows.push(<ContactShadow key="afr" P={P} X={EX} Z={(ASTAND.z0 + ASTAND.z1) / 2} w={210} d={80} uid="acs" amt={0.7} />);
  STONES_Z.forEach((Zs, i) => shadows.push(<ContactShadow key={`st${i}`} P={P} X={SHAFT_X} Z={Zs} w={150} d={150} uid={`stcs${i}`} amt={0.7 * depthT(Zs)} />));
  shadows.push(<ContactShadow key="sack" P={P} X={SACK.X} Z={SACK.Z} w={46} d={26} uid="skcs" />);
  shadows.push(<ContactShadow key="wk" P={P} X={WORKER.X} Z={WORKER.Z} w={64} d={30} uid="wkcs" />);
  shadows.push(<ContactShadow key="wk2" P={P} X={WORKER2.X} Z={WORKER2.Z} w={64} d={30} uid="wk2cs" amt={0.85} />);
  shadows.push(<ContactShadow key="stk" P={P} X={STACK.X} Z={STACK.Z} w={70} d={34} uid="stkcs" amt={0.85} />);

  return (
    <TexcocoPage cam={cam}>
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={camTransform(cam).svg}>
          <GroundPlane P={P} kind="flags" x0={-1500} x1={2700} course={130} uid="mmgp" />
          {shadows}
        </g>
      </svg>
      {layers}
    </TexcocoPage>
  );
};
export default MuscleOrMachine;
