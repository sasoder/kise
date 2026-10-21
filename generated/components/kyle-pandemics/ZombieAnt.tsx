// ---------------------------------------------------------------------------
// ZombieAnt (kyle-pandemics, cut 58). Dwarkesh map style (styles/dwarkesh-map.md) in the 3D depth manner of the Kyle
// London clip (DEPTH.md). Opaque 1080x1920, 29.97 fps, 145 frames.
// V3: inside the clip's medium (pandemicAir.tsx AirStage, palette A, mood day; notes/AIR_READY.md): a forest-floor
// understory re-lit soft (the floor one continuous ground tone by distance, litter and twigs fogged by depth, the far
// grass stems dissolving into the teal with distance and height, the stem a softly lit cylinder with a cream rim, leaves
// with darker-local margins), shafts, motes, the grade; the ant a real Camponotus (zombieAntFigure.tsx V3); the
// mycelium after death fine threads at the joints and plate edges (the stalk the orange hero).
// World, camera, timeline and the ant's motion: zombieAntWorld.ts; the ant: zombieAntFigure.tsx; the fungus (shared
// with cut 74): cordyceps.tsx.
//
// CHECK LINE: "zombies are real in nature: a fungus takes over an ant, walks it up a stem, makes it bite down, and
// then bursts out of its head."
//
// THE LINE: "Like, if you want to go to zombies, like, I'll— I'll— I'll go there. You don't have to twist my arm too
// hard. But, like, prion…"
// WORD -> FRAME (from the composition start, f0 = 58.692 s): you 1 · want 4 · to 8 · go 12 · to 15 · ZOMBIES 19 ·
//   like 31 · I'll 43 · I'll 55 · I'll 80 · go 91 · THERE 92 · you 98 · don't 101 · just 104 · TWIST 105 · my 111 ·
//   ARM 116 · too 120 · HARD 125 · but 131 · like 137 · (prion 142) · slot ends 145.
// DURATION: the slot 58.692 -> 63.530 s = 4.838 s x 29.97 = 145 frames (f0..f144).
//
// THE MOTION: one continuous climb, then the stalk. f0 a carpenter ant (dark glossy chestnut, orange threads of mycelium
// already showing through its joints) walks over the leaf litter of a forest floor to a plant stem and turns up onto
// it (head up ~f8, the gaster leaves the floor ~f30); it climbs at constant speed in an alternating-tripod gait, a
// little mechanical, while the camera cranes up with it (one pinhole, the eye rising: the floor drops away below and
// compresses, the far grass slides slower than the stem, the stem's leaves pass) and pushes in, one eased move riding
// on the crane (k 1.13 at f24 -> 1.5 at the grip: the ant ~650 px long on screen), the eye rising to the leaf's height
// so the leaf at the top is seen near edge-on, a lit margin and its midrib. From f79 it slows under a leaf
// near the top, turns its head under the leaf and its jaws open (f83-89) and snap shut on the main vein: CONTACT f91
// (THERE 92; first reaction f91: the leaf twitches): two toothed blades, the near one over the vein, the far one behind.
// Its legs let go of the stem one by one and hang limp, away from the stem (f93-104); it hangs by its locked jaws,
// swinging out from the stem to rest. On "twist" the orange stalk pushes out of the back of its neck
// (first orange ~f102 from behind the head: the dark split opens with the tip, no fade) and grows long and thin, drawn by its moving tip, curving
// up past the leaf's edge (ARM 116: ~half; HARD 125: ~90 %), the fruiting body swelling partway up (f113-134).
// V2 (after the real photos): the stalk is one long, thin, slightly wavy stroma from the dorsal pronotum with a round
// knobby fruiting cushion a quarter of the way along; orange mycelium tufts sprout from the joints (f100-140); the dead
// ant hangs angled down from its jaws, its fore legs hooked onto the leaf, the others splayed wide.
// f131-144: settled and alive: the leaf sways a hair with the hanging ant, the threads keep creeping over its joints
// and onto the vein, the camera creeps in.
// Orange = the disease (the clip rule): only the fungus (the threads and the stalk). Everything else cream / umber.
//
// DEPTH (DEPTH.md): FOCAL 1100, D = FOCAL / k, eye X = cam.cx (VP on the centre line), eye Y = cam.cy - H / k with H
// 150 -> 520 px over f35-92 (eye ~190 above the floor at f0; at the grip a hair below the leaf's midrib).
// Depths: the stem, the ant and the leaf's midrib on the front plane (Z 0); legs +-30..50; the litter -850..5000;
// the grass behind 600..3200. One light from the upper left (and a little in front): (0.5, 1, 0.8), as London.
//
// SOURCES: Ophiocordyceps unilateralis s.l. on Camponotus carpenter ants: the infected ant leaves the trail, climbs
//   low vegetation, bites the underside of a leaf at its main vein (the "death grip") and dies there; the stroma
//   grows from the dorsal neck (between head and thorax), long and thin, with a lateral fruiting body (ascoma)
//   partway up. Hughes et al. 2011, BMC Ecology 11:13; Andersen et al. 2009, Am. Nat. 174:424. Ant anatomy after
//   Camponotus worker profiles (shapes only). No figures or text on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldSvg } from "../kits/maps/texcocoShared";
import { swayCam } from "../kits/maps/incaShared";
import { AIR, AirHorizonHaze, AirStage, fogHex, makeAirView, type AirScene, type AirView } from "./pandemicAir";
import { CordycepsStalk, MyceliumThreads } from "./cordyceps";
import { AntBody, AntLeg, Antenna, DARK, Jaw, JointTufts, antLook, headOutline, jawOutline, legGeometry, mixHex, type AntLook, type LegGeo } from "./zombieAntFigure";
import { AIRS } from "./creatureAir";
import {
  ANT_S,
  BITE,
  BITE_LEAF,
  BITE_U,
  DURATION,
  FOCAL,
  FPS,
  LAMBDA,
  LEAF,
  LEGS,
  NODE,
  RELEASE,
  RELEASE_LEN,
  SPLAY,
  STEM,
  T,
  XS,
  add2,
  bodyPoseAt,
  camAt,
  eyeOf,
  gaitToe,
  lerp,
  lerp2,
  lin,
  makeLeaf,
  mul2,
  proj,
  rOf,
  rot2,
  sAt,
  segDorsal,
  segPoint,
  sstep,
  sub2,
  type BodyPose,
  type Cam,
  type Eye,
  type Leaf3,
  type P2,
} from "./zombieAntWorld";

export { DURATION, FPS };
export const schema = z.object({
  /** V3: the air the ant is lit in (creatureAir.ts): "A" the chosen sage-teal air, "B" the old umber page */
  air: z.enum(["A", "B"]).default("A"),
});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// PALETTE: V3, the clip's medium (pandemicAir.tsx, palette A; notes/AIR_READY.md). Local colours of a forest
// understory (warm sand-umber floor, brown litter, an olive-umber stem and leaves), which survive near; the air takes
// them only with distance (fx.c). Shadows in the medium's shadow colour, outlines a darker local colour.
// ---------------------------------------------------------------------------
const PAL = AIR.A;
const LITTER = ["#7A6446", "#6B5639", "#836C4C", "#5F4C33", "#735E41"];
const STEM_C = { rim: "#C9BC97", lit: "#8E7C58", mid: "#685A3F", core: "#3A3123", back: "#4F4635", line: "#2E271C" };
const LEAF_LIT = "#7E6E4C";
const LEAF_DARK = "#43392A";
const VEIN = "#9A8A66";
const GRASS = "#66583D";
const GRASS_DARK = "#433A29";
/** toward the light (3D, normalised): from the upper left and a little in front, as London's LIGHT (0.5, 1, 0.8) */
const TO_LIGHT = (() => {
  const v = [-0.5, -1, -0.8];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((x) => x / l);
})();

const f2 = (v: number) => v.toFixed(2);
const pt = (p: P2) => `${f2(p[0])},${f2(p[1])}`;
const poly = (pts: P2[]) => `M${pts.map(pt).join("L")}Z`;
const open = (pts: P2[]) => `M${pts.map(pt).join("L")}`;
const rnd = (i: number, k: number) => random(`za-${i}-${k}`);
const c01 = (v: number) => Math.max(0, Math.min(1, v));

/** the medium for this frame: colours by depth Z behind the front plane (distance = D + Z) and height (-Y) */
type Fx = { v: AirView; D: number; c: (hex: string, Z: number, Y?: number) => string; a: (Z: number) => number };
/** the scene in the cut's world px (the ant ~430 long): the subject plane (D 730..980) stays clear, the grass behind
 *  (Z 600..3200) cools into the teal, the far litter dissolves */
const AIR_SCENE: AirScene = { look: "A", mood: "day", F: FOCAL, fogNear: 1050, fogVis: 2400, fogMax: 0.95, hLow: 0, hHigh: 2200, moteUnit: 2600 };
const camOf = (e: Eye) => ({ x: e.X, y: -e.Y, z: -e.D });
const makeFx = (v: AirView, e: Eye): Fx => ({
  v,
  D: e.D,
  c: (hex, Z, Y = 0) => fogHex(v, hex, e.D + Z, -Y),
  a: (Z) => v.fogAt(e.D + Z),
});

// ---------------------------------------------------------------------------
// THE FOREST FLOOR: one continuous ground tone by distance (darker near), soft mottle, leaf litter, twigs
// ---------------------------------------------------------------------------
type LitterLeaf = { X: number; Z: number; h: number; L: number; W: number; curl: number; tone: string; broken: number };
const LITTER_LEAVES: LitterLeaf[] = (() => {
  const out: LitterLeaf[] = [];
  let tries = 0;
  while (out.length < 64 && tries < 1200) {
    tries++;
    const u = rnd(tries, 1);
    const Z = -850 + Math.pow(u, 1.35) * 8200;
    const X = -2200 + rnd(tries, 2) * 5800;
    // the ant's lane and the stem's foot stay bare soil
    if (Math.abs(Z) < 120 && X > -260 && X < 820) continue;
    if (Z > -170 && Z < 170 && X > 560 && X < 860) continue;
    const L = (260 + rnd(tries, 3) * 260) * (Z > 3000 ? 1.4 : 1);
    out.push({ X, Z, h: rnd(tries, 4) * Math.PI * 2, L, W: L * (0.2 + 0.1 * rnd(tries, 5)), curl: 8 + 16 * rnd(tries, 6), tone: LITTER[Math.floor(rnd(tries, 7) * LITTER.length)], broken: rnd(tries, 8) });
  }
  return out.sort((a, b) => b.Z - a.Z);
})();
type Twig = { a: [number, number]; b: [number, number]; R: number };
const TWIGS: Twig[] = [
  { a: [-420, 260], b: [380, 520], R: 9 },
  { a: [820, -380], b: [1420, -90], R: 11 },
  { a: [-900, 1500], b: [-180, 1250], R: 10 },
  { a: [1150, 2100], b: [1850, 2500], R: 12 },
  { a: [80, -560], b: [-420, -760], R: 13 },
];
const SPECKS = Array.from({ length: 420 }, (_, i) => ({
  X: -1700 + rnd(i, 21) * 4600,
  Z: -900 + Math.pow(rnd(i, 22), 1.4) * 5200,
  r: 2.5 + rnd(i, 23) * 4,
  light: rnd(i, 24) > 0.6,
}));

const LitterLeafShape: React.FC<{ e: Eye; q: LitterLeaf; idx: number; fx: Fx }> = ({ e, q, idx, fx }) => {
  const ch = Math.cos(q.h);
  const sh = Math.sin(q.h);
  const at = (a: number, b: number, lift: number): P2 => proj(e, q.X + ch * a - sh * b, -lift, q.Z + sh * a + ch * b);
  const N = 14;
  const edgeA: P2[] = [];
  const edgeB: P2[] = [];
  const mid: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const u = -1 + (2 * i) / N;
    const a = (u * q.L) / 2;
    const w = q.W * Math.pow(Math.max(0, 1 - u * u), 0.75) * (u < 0 ? 1 : 1 - 0.25 * u) * (q.broken > 0.7 && u > 0.4 ? 0.7 : 1);
    edgeA.push(at(a, w, q.curl + 2));
    edgeB.push(at(a, -w, q.curl * 0.6 + 2));
    mid.push(at(a, 0, 2));
  }
  const tone = fx.c(q.tone, q.Z);
  const shade = fx.c(mixHex(q.tone, PAL.shadow, 0.4), q.Z);
  const line = fx.c(mixHex(q.tone, PAL.shadow, 0.7), q.Z);
  const r = rOf(e, q.Z);
  const ca = edgeA[N / 2];
  const cb = edgeB[N / 2];
  const aDark = ca[0] + ca[1] > cb[0] + cb[1];
  const halfA = poly([...edgeA, ...mid.slice().reverse()]);
  const halfB = poly([...edgeB, ...mid.slice().reverse()]);
  let veins = "";
  for (let i = 2; i < N - 1; i += 2) {
    const u = -1 + (2 * i) / N;
    const a = (u * q.L) / 2;
    const w = q.W * Math.pow(Math.max(0, 1 - u * u), 0.75) * 0.8;
    veins += `M${pt(at(a, 0, 2))}L${pt(at(a + w * 0.7, w, q.curl * 0.7 + 2))}M${pt(at(a, 0, 2))}L${pt(at(a + w * 0.7, -w, q.curl * 0.4 + 2))}`;
  }
  const stalk = [at(-q.L / 2, 0, 2), at(-q.L / 2 - 40, 6, 3)];
  const keep = 1 - fx.a(q.Z) * 0.8;
  return (
    <g key={idx} strokeLinejoin="round">
      <path d={aDark ? halfB : halfA} fill={tone} />
      <path d={aDark ? halfA : halfB} fill={shade} />
      <path d={veins} stroke={line} strokeWidth={0.9 * r} strokeOpacity={0.3 * keep} fill="none" />
      <path d={open(mid) + open(stalk)} stroke={line} strokeWidth={1.4 * r} strokeOpacity={0.5 * keep} fill="none" />
      <path d={poly([...edgeA, ...edgeB.slice().reverse()])} fill="none" stroke={line} strokeWidth={1.1 * r} strokeOpacity={0.6 * keep} />
    </g>
  );
};

const TwigShape: React.FC<{ e: Eye; t: Twig; idx: number; fx: Fx }> = ({ e, t, idx, fx }) => {
  const Zm = (t.a[1] + t.b[1]) / 2;
  const A = proj(e, t.a[0], -t.R, t.a[1]);
  const B = proj(e, t.b[0], -t.R, t.b[1]);
  const ra = rOf(e, t.a[1]);
  const rb = rOf(e, t.b[1]);
  const d = sub2(B, A);
  const L = Math.hypot(d[0], d[1]) || 1;
  let n: P2 = [-d[1] / L, d[0] / L];
  if (n[1] > 0) n = mul2(n, -1); // n points up (to the lit side)
  const q = [add2(A, mul2(n, t.R * ra)), add2(B, mul2(n, t.R * rb)), sub2(B, mul2(n, t.R * rb)), sub2(A, mul2(n, t.R * ra))];
  const lit = [add2(A, mul2(n, t.R * ra * 0.45)), add2(B, mul2(n, t.R * rb * 0.45))];
  return (
    <g key={idx}>
      <path d={poly(q)} fill={fx.c("#54432F", Zm)} stroke={fx.c("#2E2519", Zm)} strokeWidth={1.1 * (ra + rb) * 0.5} strokeOpacity={0.7} strokeLinejoin="round" />
      <path d={open(lit)} stroke={fx.c("#9A8761", Zm)} strokeWidth={t.R * (ra + rb) * 0.28} strokeLinecap="round" />
    </g>
  );
};

/** soft mottle on the floor: darker and lighter patches lying on it, fading into the air with distance */
const MOTTLE = Array.from({ length: 140 }, (_, i) => ({ X: -2400 + rnd(i, 71) * 6400, Z: -700 + Math.pow(rnd(i, 72), 1.3) * 8000, s: 160 + 360 * rnd(i, 73), t: rnd(i, 74) * 2 - 1 }));

const Floor: React.FC<{ e: Eye; cam: Cam; fx: Fx }> = ({ e, cam, fx }) => {
  const xL = cam.cx - 9000;
  const xR = cam.cx + 9000;
  const zNear = -0.85 * e.D;
  const zFar = 30000;
  const yOf = (Z: number) => proj(e, 0, 0, Z)[1];
  const yTop = yOf(zFar);
  const yBot = yOf(zNear);
  const NS = 40;
  const stops = Array.from({ length: NS + 1 }, (_, i) => {
    const Z = zFar - (zFar - zNear) * Math.pow(i / NS, 0.35);
    const near = c01((fx.D * 0.9 - (fx.D + Z)) / (fx.D * 0.9));
    const col = fx.c(mixHex(PAL.ground.mid, PAL.ground.dark, 0.15 + 0.5 * near), Z);
    return { off: c01((yOf(Z) - yTop) / Math.max(1e-6, yBot - yTop)), col };
  });
  let dk = "";
  let lt = "";
  for (const s of SPECKS) {
    if (s.Z < zNear) continue;
    const c = proj(e, s.X, 0, s.Z);
    const r = rOf(e, s.Z);
    const rx = s.r * r;
    const ry = Math.max(0.4, rx * 0.45 * Math.min(1, (e.Y * -1) / 600 + 0.3));
    const seg = `M${f2(c[0] - rx)},${f2(c[1])}a${f2(rx)},${f2(ry)} 0 1 0 ${f2(2 * rx)},0a${f2(rx)},${f2(ry)} 0 1 0 ${f2(-2 * rx)},0`;
    if (s.light) lt += seg;
    else dk += seg;
  }
  return (
    <g>
      <defs>
        <linearGradient id="za-floor" gradientUnits="userSpaceOnUse" x1={0} y1={yTop} x2={0} y2={yBot}>
          {stops.map((s, i) => (
            <stop key={i} offset={s.off} stopColor={s.col} />
          ))}
        </linearGradient>
        <radialGradient id="za-md">
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.4} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="za-ml">
          <stop offset="0" stopColor={PAL.cream} stopOpacity={0.3} />
          <stop offset="1" stopColor={PAL.cream} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={xL} y={yTop} width={xR - xL} height={Math.max(1, yBot - yTop)} fill="url(#za-floor)" />
      {MOTTLE.map((m, i) => {
        if (m.Z < zNear + 80) return null;
        const c = proj(e, m.X, 0, m.Z);
        const r = rOf(e, m.Z);
        const ry = Math.max(0.5, (yOf(m.Z - m.s * 0.5) - yOf(m.Z + m.s * 0.5)) / 2);
        const k = (1 - fx.a(m.Z)) * Math.abs(m.t);
        return <ellipse key={i} cx={c[0]} cy={c[1]} rx={m.s * r} ry={ry} fill={m.t < 0 ? "url(#za-md)" : "url(#za-ml)"} opacity={k} />;
      })}
      <path d={dk} fill={PAL.shadow} opacity={0.22} />
      <path d={lt} fill={PAL.creamLo} opacity={0.16} />
    </g>
  );
};
const FloorLitter: React.FC<{ e: Eye; fx: Fx }> = ({ e, fx }) => {
  const zNear = -0.85 * e.D;
  return (
    <g>
      {LITTER_LEAVES.filter((q) => q.Z > zNear + 60).map((q, i) => (
        <LitterLeafShape key={i} e={e} q={q} idx={i} fx={fx} />
      ))}
      {TWIGS.map((t, i) => (
        <TwigShape key={i} e={e} t={t} idx={i} fx={fx} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// GRASS BEHIND: blades and herbs at depth (parallax on the crane), cooling into the air with distance and height
// ---------------------------------------------------------------------------
type Blade = { X: number; Z: number; W: number; H: number; bend: number };
const BLADES: Blade[] = [
  { X: -260, Z: 900, W: 30, H: 2500, bend: 260 },
  { X: 1260, Z: 700, W: 26, H: 2200, bend: -300 },
  { X: 330, Z: 2300, W: 36, H: 3200, bend: 200 },
  { X: 980, Z: 1750, W: 24, H: 2700, bend: 340 },
  { X: -760, Z: 2900, W: 40, H: 3600, bend: -260 },
  { X: 1750, Z: 2700, W: 38, H: 3400, bend: -420 },
  { X: 120, Z: 1300, W: 22, H: 2300, bend: -380 },
];
const GrassBlade: React.FC<{ e: Eye; b: Blade; idx: number; fx: Fx }> = ({ e, b, idx, fx }) => {
  const N = 16;
  const L: P2[] = [];
  const R: P2[] = [];
  const mid: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const X = b.X + b.bend * t * t;
    const Y = -b.H * t;
    const w = b.W * (1 - Math.pow(t, 1.6));
    L.push(proj(e, X - w, Y, b.Z));
    R.push(proj(e, X + w, Y, b.Z));
    mid.push(proj(e, X + w * 0.15, Y, b.Z));
  }
  const r = rOf(e, b.Z);
  const half = poly([...mid, ...R.slice().reverse()]);
  const y0 = mid[0][1];
  const y1 = mid[N][1];
  const id = `za-gb${idx}`;
  const grad = (hex: string) =>
    [0, 0.25, 0.5, 0.75, 1].map((t) => <stop key={t} offset={t} stopColor={fx.c(hex, b.Z, -b.H * t)} />);
  return (
    <g key={idx} strokeLinejoin="round">
      <defs>
        <linearGradient id={`${id}l`} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
          {grad(GRASS)}
        </linearGradient>
        <linearGradient id={`${id}d`} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
          {grad(GRASS_DARK)}
        </linearGradient>
        <linearGradient id={`${id}r`} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
          {grad(PAL.creamLo)}
        </linearGradient>
      </defs>
      <path d={poly([...L, ...R.slice().reverse()])} fill={`url(#${id}l)`} />
      <path d={half} fill={`url(#${id}d)`} />
      <path d={open(L)} stroke={`url(#${id}r)`} strokeWidth={1.4 * r} strokeOpacity={0.45 * (1 - fx.a(b.Z))} fill="none" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// A LEAF (3D surface) drawn in perspective: the face we see toned by the light, veins, a fine darker margin and a
// cream rim on the edge that faces the light, fogged by its distance
// ---------------------------------------------------------------------------
const norm3 = (v: number[]) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return v.map((x) => x / l);
};
const sub3 = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
type LeafTones = { lit: string; dark: string; vein: string; edge: string };
const DEFAULT_TONES: LeafTones = { lit: LEAF_LIT, dark: LEAF_DARK, vein: VEIN, edge: "#D9CDB4" };
/** r2: the leaf it bites, lifted: a lit cream-umber blade, a bright margin, a clear midrib */
export const BITE_TONES: LeafTones = { lit: "#B8A57B", dark: "#7C6949", vein: "#DDCFA8", edge: "#F3EBDD" };
type ColFn = (hex: string, Z: number, Y?: number) => string;
const PAGE_OLD = "#3F3428";
const tintOld: ColFn = (c, Z) => mixHex(c, PAGE_OLD, 0.86 * (1 - Math.exp(-Math.max(0, Z) / 2000)));
const faceTone = (e: Eye, leaf: Leaf3, u: number, v: number, Zt: number, tones: LeafTones, col: ColFn) => {
  const p = leaf.point(u, v);
  const pu = leaf.point(Math.min(leaf.spec.len, u + 8), v);
  const pv = leaf.point(u, v + (v < 0 ? -0.05 : 0.05));
  let n = norm3(cross3(sub3(pu, p), sub3(pv, p)));
  const toEye = norm3([e.X - p[0], e.Y - p[1], -e.D - p[2]]);
  if (dot3(n, toEye) < 0) n = n.map((x) => -x);
  const b = dot3(n, TO_LIGHT);
  return col(mixHex(tones.dark, tones.lit, 0.5 + 0.5 * b), Zt, p[1]);
};
export const LeafShape: React.FC<{ e: Eye; leaf: Leaf3; uid: string; detail?: number; Zt?: number; litEdge?: boolean; tones?: LeafTones; fx?: Fx }> = ({ e, leaf, uid, detail = 1, Zt = 0, litEdge = false, tones = DEFAULT_TONES, fx }) => {
  const col: ColFn = fx ? fx.c : tintOld;
  const sp = leaf.spec;
  const N = Math.round(40 * detail);
  const near: P2[] = [];
  const far: P2[] = [];
  const mid: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const u = sp.pet + ((sp.len - sp.pet) * i) / N;
    const a = leaf.point(u, -1);
    const b = leaf.point(u, 1);
    const m = leaf.point(u, 0);
    near.push(proj(e, a[0], a[1], a[2]));
    far.push(proj(e, b[0], b[1], b[2]));
    mid.push(proj(e, m[0], m[1], m[2]));
  }
  const pet: P2[] = [];
  for (let i = 0; i <= 8; i++) {
    const m = leaf.point((sp.pet * i) / 8, 0);
    pet.push(proj(e, m[0], m[1], m[2]));
  }
  const uMid = sp.pet + (sp.len - sp.pet) * 0.4;
  const meanY = (pts: P2[]) => pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const upper = meanY(near) < meanY(far) ? near : far;
  const nearTone = faceTone(e, leaf, uMid, -0.5, Zt, tones, col);
  const farTone = faceTone(e, leaf, uMid, 0.5, Zt, tones, col);
  let veins = "";
  const NV = Math.round(9 * detail);
  for (let k = 1; k <= NV; k++) {
    const u0 = sp.pet + ((sp.len - sp.pet) * k) / (NV + 1);
    for (const sgn of [-1, 1]) {
      const pts: P2[] = [];
      for (let j = 0; j <= 6; j++) {
        const t = j / 6;
        const q = leaf.point(Math.min(sp.len, u0 + t * leaf.halfWidth(u0) * 0.9), sgn * t * 0.92);
        pts.push(proj(e, q[0], q[1], q[2]));
      }
      veins += open(pts);
    }
  }
  const r = rOf(e, Zt);
  const ribW = sp.rib * r;
  const rib = (pts: P2[], w0: number, w1: number) => {
    const L: P2[] = [];
    const R: P2[] = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const d = sub2(b, a);
      const l = Math.hypot(d[0], d[1]) || 1;
      const n: P2 = [-d[1] / l, d[0] / l];
      const w = lerp(w0, w1, i / (pts.length - 1));
      L.push(add2(p, mul2(n, w)));
      R.push(sub2(p, mul2(n, w)));
    });
    return poly([...L, ...R.reverse()]);
  };
  const Y0 = sp.node[1];
  const line = fx ? col(mixHex(tones.dark, PAL.shadow, 0.55), Zt, Y0) : DARK;
  const keep = fx ? 1 - fx.a(Zt) * 0.7 : 1 - 0.6 * 0.86 * (1 - Math.exp(-Math.max(0, Zt) / 2000));
  return (
    <g strokeLinejoin="round">
      <path d={poly([...far, ...mid.slice().reverse()])} fill={farTone} />
      <path d={poly([...near, ...mid.slice().reverse()])} fill={nearTone} />
      <path d={veins} fill="none" stroke={col(tones.vein, Zt, Y0)} strokeWidth={1.2 * r} strokeOpacity={0.55} />
      <path d={poly([...near, ...far.slice().reverse()])} fill="none" stroke={line} strokeWidth={(fx ? 1.3 : 2.2) * r} strokeOpacity={keep} />
      {litEdge || fx ? <path d={open(upper)} fill="none" stroke={col(fx ? (litEdge ? tones.edge : PAL.creamLo) : tones.edge, Zt, Y0)} strokeWidth={(litEdge ? 3 : 1.6) * r} strokeOpacity={litEdge ? 0.9 : 0.5 * keep} strokeLinecap="round" /> : null}
      <path d={rib([...pet, ...mid], ribW, ribW * 0.25)} fill={col(tones.vein, Zt, Y0)} stroke={line} strokeWidth={(fx ? 0.9 : 1.4) * r} strokeOpacity={0.8 * keep} />
      <path d={open([...pet, ...mid].map((p) => add2(p, [-0.35 * ribW, -0.35 * ribW])))} stroke={col(fx ? PAL.creamLo : "#B3A27E", Zt, Y0)} strokeWidth={ribW * 0.35} strokeOpacity={0.7} fill="none" />
      <g id={uid} />
    </g>
  );
};

// the stem's other leaves (they pass during the climb) and its young top
const LEAF_A = makeLeaf({ ...LEAF, node: [STEM.X + STEM.R - 4, -560], side: 1, len: 520, pet: 80, W: 120, rise: 0.75, droop: 1.3, yaw: -0.7, roll: 0.3 });
const LEAF_B = makeLeaf({ ...LEAF, node: [STEM.X + STEM.R - 4, -1000], side: 1, len: 600, pet: 90, W: 140, rise: 0.55, droop: 1.25, yaw: 0.55, roll: 0.45 });
const LEAF_TOP = makeLeaf({ ...LEAF, node: [STEM.X + 10, STEM.top + 40], side: 1, len: 200, pet: 20, W: 46, rise: 1.25, droop: 0.6, yaw: 0.2, roll: 0.2 });
const LEAF_TOP2 = makeLeaf({ ...LEAF, node: [STEM.X - 10, STEM.top + 70], side: -1, len: 170, pet: 20, W: 40, rise: 1.2, droop: 0.5, yaw: 0.3, roll: 0.2 });

// ---------------------------------------------------------------------------
// THE STEM: a softly lit cylinder on the front plane (a cream rim on its lit edge, the lit side, a core shadow, light
// reflected from the air on its far edge), nodes, fine hairs, a taper to the young top; the ant's shadow on it
// ---------------------------------------------------------------------------
const stemR = (Y: number) => (Y > NODE[1] ? STEM.R : lerp(STEM.R, 22, Math.min(1, (NODE[1] - Y) / (NODE[1] - STEM.top))));
const stemX = (Y: number) => STEM.X + (Y < NODE[1] ? -6 * Math.pow((NODE[1] - Y) / (NODE[1] - STEM.top), 2) : 0);
const Stem: React.FC<{ e: Eye; antShadow: { y0: number; y1: number; amt: number }; fx: Fx }> = ({ e, antShadow, fx }) => {
  const N = 40;
  const Ls: P2[] = [];
  const Rs: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const Y = (STEM.top * i) / N + 2;
    const R = stemR(Y);
    const xc = stemX(Y);
    Ls.push([xc - R, Y]);
    Rs.push([xc + R, Y]);
  }
  const body = poly([...Ls, ...Rs.slice().reverse()]);
  // a faint fibrous texture in the shade only
  let tex = "";
  for (let Y = 0; Y > STEM.top + 30; Y -= 9) {
    const R = stemR(Y);
    const xc = stemX(Y);
    tex += `M${f2(xc + R * 0.35)},${f2(Y)}Q${f2(xc + R * 0.7)},${f2(Y + 3)} ${f2(xc + R * 0.95)},${f2(Y + 7)}`;
  }
  let hairs = "";
  for (let i = 0; i < 90; i++) {
    const Y = -8 - i * 20 - 9 * rnd(i, 61);
    if (Y < STEM.top + 40) break;
    const R = stemR(Y);
    const xc = stemX(Y);
    const l = 7 + 6 * rnd(i, 62);
    const side = i % 2 === 0 ? -1 : 1;
    const x0 = xc + side * (R - 1);
    hairs += `M${f2(x0)},${f2(Y)}q${f2(side * l * 0.7)},${f2(-l * 0.3)} ${f2(side * l * 0.9)},${f2(-l)}`;
  }
  const nodes = [-560, -1000, NODE[1]].map((Y, i) => {
    const R = stemR(Y) + 6;
    return <path key={i} d={`M${f2(STEM.X - R)},${f2(Y + 10)}Q${f2(STEM.X)},${f2(Y + 22)} ${f2(STEM.X + R)},${f2(Y + 10)}`} fill="none" stroke={STEM_C.line} strokeWidth={1.4} strokeOpacity={0.6} />;
  });
  const foot = proj(e, STEM.X, 0, 0);
  const footL = proj(e, STEM.X - STEM.R - 10, 0, -STEM.R * 0.6);
  const footR = proj(e, STEM.X + STEM.R + 10, 0, STEM.R * 0.6);
  const c = (h: string) => fx.c(h, 0);
  return (
    <g strokeLinejoin="round">
      <defs>
        <linearGradient id="za-stemg" gradientUnits="userSpaceOnUse" x1={STEM.X - STEM.R} y1={0} x2={STEM.X + STEM.R} y2={0}>
          <stop offset="0" stopColor={c(STEM_C.rim)} />
          <stop offset="0.1" stopColor={c(STEM_C.lit)} />
          <stop offset="0.38" stopColor={c(STEM_C.lit)} />
          <stop offset="0.62" stopColor={c(STEM_C.mid)} />
          <stop offset="0.86" stopColor={c(STEM_C.core)} />
          <stop offset="1" stopColor={c(STEM_C.back)} />
        </linearGradient>
        <clipPath id="za-stem">
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill="url(#za-stemg)" />
      <g clipPath="url(#za-stem)">
        <path d={tex} stroke={STEM_C.core} strokeWidth={1} strokeOpacity={0.35} fill="none" />
        {antShadow.amt > 0 ? (
          <ellipse cx={XS + 8} cy={(antShadow.y0 + antShadow.y1) / 2 + 46} rx={30} ry={Math.abs(antShadow.y1 - antShadow.y0) / 2 + 20} fill="url(#za-antsh)" opacity={antShadow.amt} />
        ) : null}
      </g>
      <path d={hairs} fill="none" stroke={c(STEM_C.rim)} strokeWidth={1.1} strokeOpacity={0.6} strokeLinecap="round" />
      <path d={body} fill="none" stroke={STEM_C.line} strokeWidth={1.3} strokeOpacity={0.85} />
      {nodes}
      <path d={`M${pt(footL)}Q${pt([foot[0], foot[1] + 14])} ${pt(footR)}`} fill="none" stroke={STEM_C.line} strokeWidth={1.4} strokeOpacity={0.5} />
    </g>
  );
};
/** a soft contact shadow on the floor in the medium's shadow colour (londonDepth's ContactShadow, re-coloured) */
const AirCS: React.FC<{ e: Eye; X: number; Z: number; w?: number; d?: number; uid: string; amt?: number; fx: Fx }> = ({ e, X, Z, w = 74, d = 40, uid, amt = 1, fx }) => {
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.25 * d;
  const c = proj(e, Xc, 0, Zc);
  const rx = w * rOf(e, Zc);
  const ry = Math.max(1, (proj(e, Xc, 0, Zc - d)[1] - proj(e, Xc, 0, Zc + d)[1]) / 2);
  const a = amt * (1 - fx.a(Z));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-cs`}>
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.75 * a} />
          <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.45 * a} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-cs)`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ANT: legs, antennae and body for a frame
// ---------------------------------------------------------------------------
export type AntState = { b: BodyPose; legs: LegGeo[]; mandOpen: number; antN: [number, number]; antF: [number, number]; myc: number; mycOp: number; mycW: number };
const tarsusDir = (pair: number, tan: P2, nrm: P2): P2 => {
  const into: P2 = [-nrm[0], -nrm[1]];
  // V2: the tarsi lie ALONG the surface (fore forward, mid and hind back), only slightly into it, so the ankle stays out by
  // the surface and never folds back next to the hip
  const v = pair === 0 ? add2(mul2(tan, 0.92), mul2(into, 0.38)) : pair === 1 ? add2(mul2(tan, -0.8), mul2(into, 0.6)) : add2(mul2(tan, -0.93), mul2(into, 0.36));
  const l = Math.hypot(v[0], v[1]);
  return [v[0] / l, v[1] / l];
};
export const antAt = (e: Eye, f: number): AntState => {
  const b = bodyPoseAt(f);
  const s = sAt(f);
  const legs = LEGS.map((leg) => {
    const walk = gaitToe(leg, Math.min(s, sAt(T.stop)));
    const tdW = tarsusDir(leg.pair, walk.tan, walk.nrm);
    const rel = lin(f, T.release + RELEASE[leg.id], T.release + RELEASE[leg.id] + RELEASE_LEN);
    if (rel <= 0) return legGeometry(e, b.meso, leg.pair, leg.side, walk.p, tdW, leg.id);
    // V2 released: the fore legs reach up and HOOK onto the leaf's underside either side of the jaws; the mid and
    // hind legs splay wide and stiff (as in the photos), their tarsi carrying on outward
    const sp = SPLAY[leg.id];
    let splayToe: [number, number, number];
    let tdS: P2;
    if (leg.pair === 0) {
      const lp = BITE_LEAF.point(BITE_U + (leg.side < 0 ? 44 : -34), leg.side < 0 ? -0.12 : 0.16);
      splayToe = [lp[0], lp[1] + LEAF.rib * 0.6, lp[2]];
      tdS = leg.side < 0 ? [-0.96, -0.28] : [0.96, -0.28];
    } else {
      const toe2 = segPoint(b.meso, sp);
      splayToe = [toe2[0], toe2[1], leg.side * 46];
      const out = rot2(sp, b.meso.a);
      const ol = Math.hypot(out[0], out[1]) || 1;
      const tg = add2([out[0] / ol, out[1] / ol], [0, 0.25]);
      tdS = mul2(tg, 1 / Math.hypot(tg[0], tg[1]));
    }
    const u = sstep(rel);
    const lifted = Math.sin(Math.PI * u) * 26;
    const dorsal = segDorsal(b.meso);
    const p: [number, number, number] = [lerp(walk.p[0], splayToe[0], u) + dorsal[0] * lifted, lerp(walk.p[1], splayToe[1], u) + dorsal[1] * lifted, lerp(walk.p[2], splayToe[2], u)];
    const td = lerp2(tdW, tdS, u);
    const tl = Math.hypot(td[0], td[1]) || 1;
    return legGeometry(e, b.meso, leg.pair, leg.side, p, [td[0] / tl, td[1] / tl], leg.id);
  });
  // the mandibles: idle shut, open as it turns to the vein, snap shut on it
  const mandOpen = f < T.open[0] ? 0.06 : f < T.clamp[0] ? 0.06 + 0.94 * sstep(lin(f, T.open[0], T.open[1])) : 1 - sstep(lin(f, T.clamp[0], T.clamp[1])) * 0.62; // shut on the vein: the two blades' tips sink into it either side, a pincer
  // the antennae (head-local: scape, funiculus): sweeping with the gait, up to the leaf, then drooping still
  const sw = Math.sin((2 * Math.PI * Math.min(s, sAt(T.stop))) / LAMBDA);
  const toLeaf = sstep(lin(f, 72, 86));
  const dead = sstep(lin(f, 95, 112));
  const scN = lerp(lerp(-2.25 + 0.08 * sw, -1.75, toLeaf), -2.55, dead);
  const fuN = lerp(lerp(-0.42 - 0.12 * sw, -1.05, toLeaf), 2.75 - 2 * Math.PI, dead);
  const scF = lerp(lerp(-2.1 - 0.08 * sw, -1.6, toLeaf), -2.35, dead);
  const fuF = lerp(lerp(-0.3 + 0.12 * sw, -0.9, toLeaf), 2.95 - 2 * Math.PI, dead);
  // the fungus inside: faint threads at the joints, spreading after death
  const grown = sstep(lin(f, 96, 136));
  return {
    b,
    legs,
    mandOpen,
    antN: [scN, fuN],
    antF: [scF, fuF],
    // r2: visible from f0 (orange = the disease), creeping further along the joints through the climb
    myc: lerp(0.6, 0.85, sstep(lin(f, 0, 92))) + 0.15 * grown,
    mycOp: 0.95,
    mycW: lerp(2.7, 3.1, sstep(lin(f, 0, 92))) + 0.4 * grown,
  };
};

// ---------------------------------------------------------------------------
// THE STALK: placed on the dorsal neck of the dead ant
// ---------------------------------------------------------------------------
export const stalkSpecAt = (b: BodyPose, f: number) => {
  // V2 (after the photos): one long, thin, slightly wavy stroma from the dorsal pronotum just behind the head, a
  // little longer than the ant, the round knobby fruiting cushion low on it (~quarter of the way along)
  const base = segPoint(b.meso, [56, -42]);
  const d = segDorsal(b.meso);
  const dorsalDeg = (Math.atan2(d[0], -d[1]) * 180) / Math.PI;
  return {
    base,
    angle: dorsalDeg + 7,
    bend: 12,
    wave: 8,
    wiggle: 4,
    length: 425,
    width: 9,
    tipWidth: 0.72,
    bodyShape: "cushion" as const,
    bodyAt: 0.25,
    bodyLen: 0.1,
    bodyWidth: 30,
    bodySide: -1 as const,
    scale: 1,
    frame: f,
    sway: 1.2,
    swayRate: 0.06,
    swayPhase: 0.4,
    seed: 2,
  };
};
/** the growth: a slow push out of the neck, a steady drive, easing as it reaches its length (the tip draws it) */
export const stalkGrow = (f: number) => {
  const u = lin(f, T.stalk[0], T.stalk[1]);
  if (u <= 0) return 0;
  // a soft start (the push), then near-linear, then a long ease to rest
  const a = Math.pow(u, 1.6);
  const b = 1 - Math.pow(1 - u, 2.2);
  return Math.min(1, lerp(a, b, sstep(u * 1.4)));
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const ZombieAnt: React.FC<z.infer<typeof schema>> = ({ air = "A" }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const e = eyeOf(cam, frame);
  // V3: the medium (AIR_READY.md): the horizon row of this pinhole (the eye's height above the frame's centre) and the
  // eye in the air's axes (x, y up, z forward), so the motes fly past on the crane and the push-in
  const e0 = eyeOf(swayCam(camAt(0), 0), 0);
  const v = makeAirView({ scene: AIR_SCENE, frame, horizon: 960 + (e.Y - cam.cy) * cam.k, cam: camOf(e), rest: camOf(e0) });
  const fx = makeFx(v, e);
  const ant = antAt(e, frame);
  const b = ant.b;
  // the leaf: a twitch on the clamp (cause: the jaws shut f91), then a hair of sway with the hanging ant
  const tc = frame - T.clamp[1];
  const jolt = tc > 0 ? 1.1 * Math.exp(-tc / 6) * Math.sin(tc * 0.55) : 0;
  const swayAmt = sstep(lin(frame, 100, 128));
  const sway = jolt + swayAmt * 0.55 * Math.sin((frame - 100) * 0.1);
  const leafRot = `rotate(${f2(sway)} ${f2(NODE[0])} ${f2(NODE[1])})`;
  // contact shadows on the floor while the body is low; the ant's shadow on the stem while it climbs
  const onFloor = (p: P2) => Math.max(0, 1 - (Math.abs(p[1]) - 60) / 90);
  const climbing = sstep(lin(frame, 8, 24)) * (1 - sstep(lin(frame, T.release, T.release + 10)));
  const ys = [b.head.p[1], b.gaster.p[1]];
  const grow = stalkGrow(frame);
  const spec = stalkSpecAt(b, frame);
  const ripen = sstep(lin(frame, 106, 128)); // V2: the cushion low on the stalk swells once the tip has passed it
  const nearLegs = ant.legs.filter((g) => g.side < 0);
  const farLegs = ant.legs.filter((g) => g.side > 0);
  // the threads reaching from the jaws along the vein (the fungus anchoring the dead ant)
  const veinPath = (from: number, to: number, under = 0.8): P2[] => {
    const out: P2[] = [];
    for (let i = 0; i <= 10; i++) {
      const q = BITE_LEAF.point(lerp(from, to, i / 10), 0);
      const p = proj(e, q[0], q[1] + LEAF.rib * under, q[2]);
      out.push(p);
    }
    return out;
  };
  const veinT = sstep(lin(frame, 104, 144));
  const antGroupRot = frame >= T.clamp[1] ? leafRot : undefined;
  // V3: the ant in the air: the near side a hair of fog, the far side (legs, antenna ~60 behind) sunk further
  const look: AntLook = antLook(AIRS[air], 0.06);
  const farLook: AntLook = antLook(AIRS[air], 0.24);
  return (
    <AirStage v={v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <Floor e={e} cam={cam} fx={fx} />
      </WorldSvg>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <AirHorizonHaze v={v} below={220} id="za-hz" />
      </svg>
      <WorldSvg cam={cam}>
        <defs>
          <radialGradient id="za-antsh">
            <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.55} />
            <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.3} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
          </radialGradient>
        </defs>
        <FloorLitter e={e} fx={fx} />
        {/* the stem's shadow across the litter (to the right and back) and its contact shadow */}
        <path
          d={poly([proj(e, STEM.X - 30, 0, 10), proj(e, STEM.X + 40, 0, -10), proj(e, STEM.X + 40 + 500, 0, 800), proj(e, STEM.X - 30 + 500, 0, 820)])}
          fill={PAL.shadow}
          opacity={0.16}
          style={{ filter: "blur(3px)" }}
        />
        <AirCS e={e} X={STEM.X} Z={0} w={86} d={60} uid="za-stem-cs" amt={0.9} fx={fx} />
        {(["gaster", "meso", "head"] as const).map((k) => {
          const a = onFloor(b[k].p);
          return a > 0 ? <AirCS key={k} e={e} X={b[k].p[0]} Z={0} w={k === "gaster" ? 86 : k === "meso" ? 70 : 52} d={36} uid={`za-cs-${k}`} amt={0.7 * a} fx={fx} /> : null;
        })}
        {BLADES.slice()
          .sort((a, c) => c.Z - a.Z)
          .map((bl, i) => (
            <GrassBlade key={i} e={e} b={bl} idx={i} fx={fx} />
          ))}
        {/* the stem's leaf behind it */}
        <LeafShape e={e} leaf={LEAF_A} uid="za-leafA" detail={0.6} Zt={140} fx={fx} />
        {/* the far side of the ant: its legs and antenna stand behind the stem */}
        <g transform={antGroupRot}>
          {farLegs.map((g) => (
            <AntLeg key={g.id} g={g} look={farLook} />
          ))}
          <Antenna head={b.head} scapeA={ant.antF[0]} funA={ant.antF[1]} look={farLook} />
        </g>
        <Stem e={e} antShadow={{ y0: Math.min(...ys), y1: Math.max(...ys), amt: climbing * 0.75 }} fx={fx} />
        <LeafShape e={e} leaf={LEAF_TOP2} uid="za-leafT2" detail={0.4} fx={fx} />
        <LeafShape e={e} leaf={LEAF_TOP} uid="za-leafT" detail={0.4} fx={fx} />
        {/* the leaf it bites */}
        <g transform={leafRot}>
          <LeafShape e={e} leaf={BITE_LEAF} uid="za-leaf" detail={1} litEdge tones={BITE_TONES} fx={fx} />
        </g>
        {/* the ant */}
        <g transform={antGroupRot}>
          <AntBody uid="za-ant" b={b} look={look} mandOpen={ant.mandOpen} myc={ant.myc} mycOpacity={ant.mycOp} mycWidth={ant.mycW} nearJaw={false} />
          <Antenna head={b.head} scapeA={ant.antN[0]} funA={ant.antN[1]} look={look} />
          {nearLegs.map((g) => (
            <AntLeg key={g.id} g={g} look={look} />
          ))}
          {/* V3: fine mycelium threads emerging at the dead ant's joints and plate edges (few; the stalk is the hero) */}
          <JointTufts b={b} t={sstep(lin(frame, 100, 140))} legs={nearLegs} />
          {/* r2: the fungus showing at the near legs' joints (hip and knee) from f0 */}
          {nearLegs.map((g, i) => (
            <g key={`lt${g.id}`}>
              <MyceliumThreads path={[lerp2(g.root, g.hip, 0.2), g.hip, lerp2(g.hip, g.knee, 0.3)]} t={ant.myc} seed={30 + i} width={ant.mycW * 0.8} spread={1.6} every={12} branchLen={8} opacity={ant.mycOp} />
              <MyceliumThreads path={[lerp2(g.knee, g.hip, 0.22), g.knee, lerp2(g.knee, g.ankle, 0.22)]} t={ant.myc} seed={40 + i} width={ant.mycW * 0.7} spread={1.4} every={12} branchLen={7} opacity={ant.mycOp} />
            </g>
          ))}
        </g>
        {/* the jaws sunk in the vein: the vein's underside over the mandible tips once they have shut on it */}
        {frame >= T.clamp[1] - 0.5 ? (
          <g transform={leafRot}>
            <path d={open(veinPath(BITE_U - 34, BITE_U + 34, 0))} stroke={BITE_TONES.vein} strokeWidth={LEAF.rib * 2 * rOf(e, 0)} strokeLinecap="round" fill="none" />
            <path d={open(veinPath(BITE_U - 34, BITE_U + 34, 1))} stroke={mixHex(BITE_TONES.dark, PAL.shadow, 0.5)} strokeWidth={1.3} strokeOpacity={0.8} fill="none" />
          </g>
        ) : null}
        {/* the near jaw blade in front of the vein (the far one behind it): a pincer */}
        <g transform={antGroupRot}>
          <Jaw head={b.head} which="near" open={ant.mandOpen} look={look} />
        </g>
        <LeafShape e={e} leaf={LEAF_B} uid="za-leafB" detail={0.6} Zt={-60} fx={fx} />
        {/* the fungus */}
        <g transform={antGroupRot}>
          <MyceliumThreads path={veinPath(BITE_U, BITE_U + 120)} t={veinT} seed={11} width={1.5} spread={3} every={16} branchLen={14} />
          <MyceliumThreads path={veinPath(BITE_U, BITE_U - 110)} t={veinT * 0.9} seed={13} width={1.5} spread={3} every={16} branchLen={14} />
        </g>
        {/* r2: the stalk drawn LAST, so it stands in front of the leaf, its near edge and the vein on every frame; a mask
            of the head's silhouette (and the near jaw) keeps its base behind the head, where it rises from */}
        {grow > 0 ? (
          <g transform={antGroupRot}>
            <mask id="za-stalk-mask" maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9000} height={9000}>
              <rect x={-4000} y={-4000} width={9000} height={9000} fill="white" />
              <path d={headOutline(b)} fill="black" />
              <path d={jawOutline(b.head, ant.mandOpen)} fill="black" />
            </mask>
            <g mask="url(#za-stalk-mask)">
              <CordycepsStalk uid="za-stalk" {...spec} grow={grow} ripen={ripen} shadow={1} casing={0.6} />
            </g>
          </g>
        ) : null}
      </WorldSvg>
    </AirStage>
  );
};

export default ZombieAnt;

// for the probes and the hand-off checks
export const debugAt = (f: number) => {
  const cam = camAt(f);
  const e = eyeOf(cam, f);
  const b = bodyPoseAt(f);
  return { cam, e, b, bite: BITE, node: NODE, stalk: stalkSpecAt(b, f), grow: stalkGrow(f), antS: ANT_S, rot: rot2, legs: antAt(e, f).legs };
};
