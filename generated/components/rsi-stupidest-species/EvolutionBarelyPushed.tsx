// ---------------------------------------------------------------------------
// EvolutionBarelyPushed (rsi-stupidest-species, cut 51), REVISION 2: THE MARCH, LEFT AS A LINEUP, INTO A CITY. Dwarkesh 3D style
// (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 113 frames. The march of progress, trucked like the COVID
// walking man (kyle-covid SeveralDaysBeforeIllness: a truck with the walker, planted feet, parallax). No text.
//
// CHECK LINE: "Evolution walked us all the way from ape to modern human, but the glow of intelligence in our heads
//   barely grew on the way."
//
// THE LINE: "The second reason is that human evolution just didn't optimize us that strongly for intelligence."
// WORD -> FRAME: The -1 · second 3 · reason 8 · is 15 · that 25 · human 28 · evolution 34 · just 42 · didn't 56 ·
//   optimize 61 · us 70 · that 78 · strongly 84 · for 92 · intelligence 98
// DURATION: the slot 51.093 -> 55.806 s = 113 frames (f0..f112).
//
// THE MOTION: one continuous camera, low (the eye at shin height, the walkers against the sky). A walker in profile
// strides left to right and the camera trucks with him (his feet at x ~530, y 1045; the modern man ~430 px tall, the
// chimp ~230). THE MARCH: THE CHIMP (stupidestFolk Chimp v0, the knuckle-walk) -> an EARLY HOMININ (this cut's furred,
// stooped recolour of forager v4) -> a FORAGER (v0) -> a MODERN man (covidFolk Commuter v1). Each swap is hidden behind
// a slim, sharp object standing on the ground close to the lens, only a little wider than the figure: a termite mound
// (SWAPS[0]), a boulder (SWAPS[1]) and a cast-iron bollard (SWAPS[2], the modern man out by ~f74). AT EACH SWAP the
// outgoing stage leaves an AFTERIMAGE where it went behind the object: a soft, cream-tinted, slightly transparent copy
// frozen mid-stride, its head glow still faintly lit (a stroboscopic trail). The truck carries on, so the afterimages
// slide off left behind him. The ground changes under him by world position (savannah -> stone paving from just
// past the forager's afterimage to the right and into the depth: no slab). REV 2: the right side of that split is a
// modern city: his paving is a sidewalk with a kerb, a road beyond (a lane line, a zebra crossing behind him), a far
// sidewalk with trees in planters, a street wall of mid-rise blocks with window grids and flat roofs receding into the
// haze, towers behind; a streetlamp at the kerb beside him. The city grows out of the haze with the split (f60-96,
// nearer first); the savannah's side keeps its acacias and hills (the contrast is the point).
// INTELLIGENCE: every stage carries a soft ORANGE spot inside the head (~20 % of the head's width) that grows only a
// little (the chimp's 65 % of the modern one's: GLOW_R).
// f78-98 "that strongly": he slows to a stop while the truck decelerates and turns into one decelerating PULL-BACK and
// RISE (the eye from shin height to head height, the camera drifting back) that reveals THE LINEUP in one frame:
// chimp -> hominin -> forager -> modern man, left to right, each with its small orange glow (the famous image). The
// rise also sinks the near objects out of the bottom of the frame. f91-102 "for intelligence": the four glows pulse
// once together. f100-112 the living hold (his breath, the glows' shimmer, a slow creep).
// Orange = intelligence (the clip's rule): only the head glows. People and animals never orange; the set in the
// style's earthy materials (dry grass khaki-olive, termite clay, grey stone, slate iron).
//
// DEPTH: eye 45 units up through the walk (shin height), rising to 330 (head height) in the pull-back; dRef 800 at
// kRef 1.3, dolly 0.35; fog by the eye's distance. Z: the walkers and the afterimages 0, the near objects at
// r ~4.5-5.6 (Z ~ -640), near tufts -560..-300, the paving from the lens to the horizon, mid tufts and rocks
// 240-1700, acacias 1300-2700, hills 6000 / 12000. The city: the lamp Z 150, the zebra 250-520, the street trees
// 1900-5600, the street wall 1250-13000 (facades X 1660+), the towers 5200-13500.
//
// SOURCES: none on screen (the march-of-progress image is the user's reference).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  AirBox,
  AirFloor,
  AirHorizonHazeW,
  AirShadow,
  AirStage,
  MAT,
  WorldSvg,
  airWorldOf,
  c01,
  lerp,
  lineOf,
  mixHex,
  smoothstep,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { CovidPaint, FU, POSES, buildCovidFolk, covidAnchors, lerpPose, walkPose, type CShape, type CovidPose } from "../kyle-covid/covidFolk";
import { ellD } from "../kyle-covid/covidFolkBody";
import { CHIMP_POSES, buildChimp, buildPerson, foragerLookOf, type ChimpPose, type PersonPose } from "./stupidestFolkBody";

export const FPS = 24000 / 1001;
export const DURATION = 113;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- helpers ------------------------------------------------------------------------------------------------------
const sst = smoothstep;
/** a C2 smoother step */
const sst5 = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const frac = (v: number) => v - Math.floor(v);
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const polyD = (q: P2[], close = true) => `M${q.map(Pt).join("L")}${close ? "Z" : ""}`;
/** a smooth closed path through points (Catmull-Rom as cubic Beziers) */
const smoothD = (q: P2[]) => {
  const n = q.length;
  let d = `M${Pt(q[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n];
    const p1 = q[i];
    const p2 = q[(i + 1) % n];
    const p3 = q[(i + 2) % n];
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${Pt(c1)} ${Pt(c2)} ${Pt(p2)}`;
  }
  return `${d}Z`;
};

// ===================================================================================================================
// THE WALK: four stages, three swaps; the speed is each stage's own gait (planted feet), blended across each swap
// while the near object covers him, then a raised-cosine stop (WALK_DEC)
// ===================================================================================================================
export type StageKind = "chimp" | "hominin" | "forager" | "modern";
type Stage = { kind: StageKind; stride: number; cycle: number; scale: number };
/** the chimp's stride is its knuckle-walk's (58 units a cycle at scale 1); the people's is covidFolk's step (2 per
 *  cycle). The people stride out (the march's long steps): the spacing of the lineup is the distance between swaps */
export const STAGES: Stage[] = [
  { kind: "chimp", stride: 58, cycle: 13, scale: 1.1 },
  { kind: "hominin", stride: 58, cycle: 20, scale: 0.92 },
  { kind: "forager", stride: 62, cycle: 21, scale: 1 },
  { kind: "modern", stride: 64, cycle: 21, scale: 1 },
];
const speedOf = (s: Stage) => (s.kind === "chimp" ? (s.stride * s.scale) / s.cycle : (2 * s.stride * s.scale) / s.cycle);
/** the swap frames: the new stage is drawn from this frame on (and the old one's afterimage) */
export const SWAPS = [15, 42, 68];
const SWAP_BLEND = 4;
/** the stop: the speed falls in one raised-cosine lobe */
export const WALK_DEC = [78, 95] as const;
const decel = (f: number) => (f <= WALK_DEC[0] ? 1 : f >= WALK_DEC[1] ? 0 : 0.5 * (1 + Math.cos((Math.PI * (f - WALK_DEC[0])) / (WALK_DEC[1] - WALK_DEC[0]))));
const speedAt = (f: number) => {
  let v = speedOf(STAGES[0]);
  SWAPS.forEach((s, i) => {
    v += (speedOf(STAGES[i + 1]) - speedOf(STAGES[i])) * sst(s - SWAP_BLEND, s + SWAP_BLEND, f);
  });
  return v * decel(f);
};
/** the modern man's stride shortens into the stop */
const strideAmt = (f: number) => lerp(1, 0.55, sst(WALK_DEC[0], WALK_DEC[1] - 2, f));
const DT = 0.125;
const NT = Math.ceil((DURATION + 4) / DT) + 2;
/** X walked and the modern man's raw gait phase, tabulated (seek-safe: pure functions of f) */
const TAB = (() => {
  const X = [0];
  const ph = [0];
  for (let i = 0; i < NT; i++) {
    const fm = (i + 0.5) * DT;
    const v = speedAt(fm);
    X.push(X[i] + v * DT);
    const m = STAGES[3];
    ph.push(ph[i] + (v * DT) / (2 * m.stride * m.scale * strideAmt(fm)));
  }
  return { X, ph };
})();
const tab = (arr: number[], f: number) => {
  const x = Math.max(0, f) / DT;
  const i = Math.min(arr.length - 2, Math.floor(x));
  return lerp(arr[i], arr[i + 1], c01(x - i));
};
/** the walker's feet (world X; Z 0) */
export const walkX = (f: number) => tab(TAB.X, f);
export const stageAt = (f: number) => SWAPS.filter((s) => f >= s).length;
/** the modern man comes to rest at mid-stance of his near foot (frac 0.25), the far foot mid-swing comes down */
const MOD_PH0 = (() => {
  const end = tab(TAB.ph, WALK_DEC[1]);
  return 0.25 - frac(end) + 3;
})();

// ---- the poses ----------------------------------------------------------------------------------------------------
/** the people's walk base: profile (the march), the modern man a touch toward us */
const humanBase = (yaw: number): CovidPose => ({ ...POSES.walk(1, 0, 0), yaw, headYaw: yaw + 0.04, mouth: 0.2 });
const HOM_BASE: CovidPose = { ...humanBase(0.9), lean: 9, crouch: 14, pitch: 7, look: [0.5, -0.05] };
const FOR_BASE: CovidPose = { ...humanBase(0.88), look: [0.45, -0.05] };
const MOD_BASE: CovidPose = { ...humanBase(0.8), look: [0.42, -0.05] };
const humanPhase = (i: number, f: number) => (walkX(f) - walkX(SWAPS[i - 1])) / (2 * STAGES[i].stride * STAGES[i].scale) + 0.13 * i;
const modWalk = (f: number) => walkPose(MOD_BASE, MOD_PH0 + tab(TAB.ph, f), strideAmt(f), STAGES[3].stride);
/** standing after the stop: the stance foot stays, the swinging foot comes down beside it */
const MOD_STOP: CovidPose = (() => {
  const w = modWalk(WALK_DEC[1]);
  return { ...w, footL: [w.footL[0], 0], footR: [w.footL[0] - 10, -1], liftL: 0, liftR: 0, crouch: 1, lean: 1 };
})();
/** the head's small turn toward us in the hold (he stays a marcher in profile) */
const HEAD_TURN = [94, 108] as const;
export type WalkerPose =
  | { kind: "chimp"; pose: ChimpPose }
  | { kind: "hominin" | "forager"; pose: PersonPose }
  | { kind: "modern"; pose: CovidPose };
export const walkerPose = (f: number): WalkerPose => {
  const i = stageAt(f);
  if (i === 0) {
    // the knuckle-walk's own clock runs on the distance walked (planted knuckles and feet at any cadence)
    const arg = (walkX(f) / (STAGES[0].stride * STAGES[0].scale)) * 32 + 9;
    return { kind: "chimp", pose: CHIMP_POSES.knuckleWalk(1, arg, 1, { headYaw: 1.05, look: [0.55, -0.1] }) };
  }
  if (i === 1) return { kind: "hominin", pose: walkPose(HOM_BASE, humanPhase(1, f), 1, STAGES[1].stride) };
  if (i === 2) return { kind: "forager", pose: walkPose(FOR_BASE, humanPhase(2, f), 1, STAGES[2].stride) };
  let q = modWalk(f);
  q = lerpPose(q, MOD_STOP, sst(WALK_DEC[1] - 11, WALK_DEC[1] - 2, f));
  // the living hold: a breath and the head's small turn toward us
  const t = f / FPS;
  const b = Math.sin((t / 3.6) * 2 * Math.PI) * sst(WALK_DEC[1] - 2, WALK_DEC[1] + 6, f);
  const ht = sst(HEAD_TURN[0], HEAD_TURN[1], f);
  q = {
    ...q,
    crouch: q.crouch - 1.1 * b,
    headYaw: lerp(q.headYaw, 0.6, ht),
    look: [lerp(0.42, 0.2, ht), -0.05],
    mouth: 0.2,
  };
  return { kind: "modern", pose: q };
};

// ===================================================================================================================
// THE CAST: the chimp (W2), the early hominin (forager v4 recoloured here: furred, stooped, a brow ridge, a mane),
// the forager (W2 v0) and the modern man (covidFolk Commuter v1)
// ===================================================================================================================
const HOM_VARIANT = 4;
const FOR_VARIANT = 0;
const MOD_KIND = "commuter" as const;
const MOD_VARIANT = 1;
const FUR = "#5E4837";
const FUR_DK = "#3F3026";
const hexDist = (a: string, b: string) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
};
/** a shape's control-point box (folk units) */
const shapeBox = (d: string) => {
  const n = (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]);
    x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]);
    y1 = Math.max(y1, n[i + 1]);
  }
  return { x0, x1, y0, y1 };
};
/** THE EARLY HOMININ: forager v4's build, the hide recoloured to fur (no belt), the limbs furred brown, the hair a fur
 *  mane down the back of the head and neck, a heavy brow ridge; the face keeps its skin */
export const buildHominin = (pose: PersonPose, frame: number) => {
  const b = buildPerson("forager", pose, { variant: HOM_VARIANT, frame });
  const a = b.anchors;
  const look = foragerLookOf(HOM_VARIANT);
  const hc = a.headC;
  const R = a.headR;
  const neckY = (hc[1] + R * 0.95) * FU;
  const hideSet = new Set([look.hide.toLowerCase(), "#685745"]);
  const cordSet = new Set([look.cord.toLowerCase(), "#5e4f41"]);
  const shapes: CShape[] = b.shapes.map((s) => {
    const fl = s.fill.toLowerCase();
    if (s.grad || s.glow) return s;
    if (hideSet.has(fl)) return { ...s, fill: fl === "#685745" ? mixHex(FUR, FUR_DK, 0.5) : FUR };
    if (cordSet.has(fl)) return { ...s, fill: FUR };
    if (fl === look.hair.toLowerCase()) return { ...s, fill: FUR_DK };
    if (hexDist(fl, look.skin.toLowerCase()) < 42) {
      const bx = shapeBox(s.d);
      // the limbs furred (the hands and feet a little lighter), the face a darker weathered tan
      if ((bx.y0 + bx.y1) / 2 > neckY) return { ...s, fill: mixHex(s.fill, FUR, bx.y0 > -40 * FU ? 0.62 : 0.84) };
      return { ...s, fill: mixHex(s.fill, "#7E5E46", 0.38) };
    }
    return s;
  });
  const eyes = a.eyes;
  const em: P2 = eyes.length ? [eyes.reduce((q, e) => q + e[0], 0) / eyes.length, eyes.reduce((q, e) => q + e[1], 0) / eyes.length] : [hc[0] + 18, hc[1]];
  // the mane: fur down the back of the head and the neck onto the shoulders
  const mane: CShape = { d: ellD([hc[0] - R * 0.45, hc[1] + R * 0.5], R * 0.95, R * 1.3, 14), fill: FUR_DK };
  // the brow ridge: a short dark crescent over the eyes
  const brow: CShape = { d: ellD([em[0] + 1, em[1] - R * 0.2], R * 0.34, R * 0.1, -8), fill: mixHex(FUR_DK, "#7E5E46", 0.2) };
  // a ragged fur edge: tufts down the back, at the back of the shoulder and on the outer arm
  const tuft = (c: P2, dir: P2, len: number, seed: number): CShape[] =>
    [-0.5, 0, 0.5].map((o, k) => {
      const ang = Math.atan2(dir[1], dir[0]) + o * 0.7 + (hash(seed * 7 + k) - 0.5) * 0.3;
      const l = len * (0.7 + 0.5 * hash(seed * 3 + k));
      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);
      const w = len * 0.28;
      const tip: P2 = [c[0] + Math.cos(ang) * l, c[1] + Math.sin(ang) * l];
      const pts: P2[] = [[c[0] + nx * w, c[1] + ny * w], tip, [c[0] - nx * w, c[1] - ny * w]];
      return { d: `M${pts.map((q) => `${(q[0] * FU).toFixed(2)} ${(q[1] * FU).toFixed(2)}`).join(" L ")} Z`, fill: k === 1 ? FUR_DK : FUR };
    });
  const neckB: P2 = [a.chest[0] - 24, hc[1] + R * 1.25];
  const hipB: P2 = [a.hip[0] - 30, a.hip[1] - 14];
  const back: CShape[] = [];
  for (let k = 0; k < 4; k++) {
    const t = (k + 0.5) / 4;
    back.push(...tuft([lerp(neckB[0], hipB[0], t), lerp(neckB[1], hipB[1], t)], [-1, 0.35], 11, k + 1));
  }
  const elbowL: P2 = [(a.shoulderL[0] + a.wristL[0]) / 2 - 8, (a.shoulderL[1] + a.wristL[1]) / 2];
  const arms: CShape[] = [...tuft([a.shoulderL[0] - 12, a.shoulderL[1] + 4], [-1, 0.6], 10, 11), ...tuft(elbowL, [-1, 0.8], 9, 12)];
  return { shapes: [mane, ...shapes, ...back, ...arms, brow], anchors: a };
};

/** a figure built: shapes (folk units, feet at the origin), the head (units), the scale */
export type Built = { shapes: CShape[]; headC: P2; headR: number; scale: number; kind: StageKind };
export const buildWalker = (wp: WalkerPose, f: number): Built => {
  if (wp.kind === "chimp") {
    const b = buildChimp(0, wp.pose);
    return { shapes: b.shapes, headC: b.anchors.headC, headR: b.anchors.headR, scale: STAGES[0].scale, kind: "chimp" };
  }
  if (wp.kind === "hominin") {
    const b = buildHominin(wp.pose, f);
    return { shapes: b.shapes, headC: b.anchors.headC, headR: b.anchors.headR, scale: STAGES[1].scale, kind: "hominin" };
  }
  if (wp.kind === "forager") {
    const b = buildPerson("forager", wp.pose, { variant: FOR_VARIANT, frame: f });
    return { shapes: b.shapes, headC: b.anchors.headC, headR: b.anchors.headR, scale: STAGES[2].scale, kind: "forager" };
  }
  const b = buildCovidFolk(MOD_KIND, MOD_VARIANT, wp.pose, { hold: { L: "none", R: "none" }, carry: "none", frame: f });
  const a = covidAnchors(MOD_KIND, wp.pose, [0, 0], 1, { variant: MOD_VARIANT });
  return { shapes: b.shapes, headC: a.headC, headR: a.headR, scale: STAGES[3].scale, kind: "modern" };
};

// ---- the glow of intelligence --------------------------------------------------------------------------------------
/** the head glow's spot radius (world units): ~20 % of each head's width across, growing only a little across the
 *  march (the chimp's 65 % of the modern man's) */
export const GLOW_R = { chimp: 5.5, hominin: 6.6, forager: 7.5, modern: 8.4 } as const;
/** the glow's faint halo reaches this many radii (the coverage checks use it) */
export const GLOW_REACH = 2.7;
/** the glow's centre: in the brain, a little up and back from the head's centre (world px) */
export const glowOf = (b: Built, at: P2) => {
  const c: P2 = [at[0] + (b.headC[0] - 0.24 * b.headR) * b.scale, at[1] + (b.headC[1] - 0.32 * b.headR) * b.scale];
  const head: P2 = [at[0] + b.headC[0] * b.scale, at[1] + b.headC[1] * b.scale];
  return { c, R: GLOW_R[b.kind], head, headR: b.headR * b.scale };
};
/** "for intelligence": the four glows pulse once together (peak ~f96) */
export const PULSE = [90, 102] as const;
export const pulseAt = (f: number) => Math.pow(Math.sin(Math.PI * c01((f - PULSE[0]) / (PULSE[1] - PULSE[0]))), 1.4);

/** a built figure's screen box on a camera: its shapes, its glow's halo and its contact shadow */
const SHADOW: Record<StageKind, { w: number; d: number }> = { chimp: { w: 77, d: 32 }, hominin: { w: 58, d: 28 }, forager: { w: 60, d: 30 }, modern: { w: 62, d: 30 } };
export const boxOf = (b: Built, at: P2, cam: Cam, withShadow = true) => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  const add = (p: P2) => {
    const s = toScreen(cam, p);
    x0 = Math.min(x0, s[0]);
    x1 = Math.max(x1, s[0]);
    y0 = Math.min(y0, s[1]);
    y1 = Math.max(y1, s[1]);
  };
  for (const s of b.shapes) {
    const bx = shapeBox(s.d);
    if (!Number.isFinite(bx.x0)) continue;
    add([at[0] + (bx.x0 / FU) * b.scale, at[1] + (bx.y0 / FU) * b.scale]);
    add([at[0] + (bx.x1 / FU) * b.scale, at[1] + (bx.y1 / FU) * b.scale]);
  }
  const g = glowOf(b, at);
  add([g.c[0] - g.R * GLOW_REACH, g.c[1] - g.R * GLOW_REACH]);
  add([g.c[0] + g.R * GLOW_REACH, g.c[1] + g.R * GLOW_REACH]);
  const sw = SHADOW[b.kind];
  if (withShadow) {
    add([at[0] + 0.18 * sw.w - sw.w * 1.05, -8]);
    add([at[0] + 0.18 * sw.w + sw.w * 1.05, 8]);
  }
  return { x0, x1, y0, y1 };
};
/** the world X extent of a built figure (its shapes) */
const worldSpan = (b: Built, X: number) => {
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const s of b.shapes) {
    const bx = shapeBox(s.d);
    if (!Number.isFinite(bx.x0)) continue;
    x0 = Math.min(x0, X + (bx.x0 / FU) * b.scale);
    x1 = Math.max(x1, X + (bx.x1 / FU) * b.scale);
  }
  return { x0, x1 };
};

// ===================================================================================================================
// THE AFTERIMAGES: at each swap the outgoing stage is left behind, frozen mid-stride where it went behind the near
// object (its pose and place on the frame before the swap, when it is fully covered), cream-tinted and soft
// ===================================================================================================================
const CREAM = "#F1E7CF";
export type After = { from: number; X: number; b: Built; shapes: CShape[] };
export const AFTER: After[] = SWAPS.map((s) => {
  const f = s - 1;
  const b = buildWalker(walkerPose(f), f);
  const shapes = b.shapes.map((sh) => (sh.glow || sh.grad ? sh : { ...sh, fill: mixHex(sh.fill, CREAM, 0.45) }));
  return { from: s, X: walkX(f), b, shapes };
});
const AFTER_OP = 0.68;
/** the modern man where he stands at the end */
const END_F = DURATION - 1;
export const MOD_END = { X: walkX(END_F), b: buildWalker(walkerPose(END_F), END_F) };
/** the lineup's world X extent at the end (the afterimages and the modern man) */
export const LINEUP = (() => {
  const spans = [...AFTER.map((a) => worldSpan(a.b, a.X)), worldSpan(MOD_END.b, MOD_END.X)];
  return { x0: Math.min(...spans.map((q) => q.x0)), x1: Math.max(...spans.map((q) => q.x1)) };
})();

// ===================================================================================================================
// THE CAMERA: low (shin height), a truck locked to his pace (his feet at x 575, y 1045: the trail behind him in
// shot); from f78 it decelerates into one PULL-BACK and RISE (u: one C2 lobe) onto the lineup; then a slow creep
// ===================================================================================================================
export const K_WALK = 1.3;
export const K_END = 1.27;
export const EYE_W = -45;
export const EYE_END = -330;
const DREF = 800;
const DOLLY = 0.35;
const FEET_SX = 575;
const FEET_SY = 1045;
/** the lineup settles a little lower in the frame as the camera rises (the series sits low) */
const FEET_SY_END = 1150;
export const PULL = [78, 99] as const;
export const RISE = [67, 83] as const;
const followCx = (f: number) => walkX(f) - (FEET_SX - 540) / K_WALK;
/** the end frame: the lineup's left end at x LINEUP_LEFT, the march's lead room ahead of the modern man on the right
 *  (the camera barely has to come back: the trail is already on screen behind him) */
const LINEUP_LEFT = 105;
export const CX_END = LINEUP.x0 + (540 - LINEUP_LEFT) / K_END;
export const rigAt = (f: number) => {
  const u = sst5(PULL[0], PULL[1], f);
  // the living hold: a slow creep (the pull carries on, a drift along the lineup)
  const creep = sst(95, 118, f);
  const k = K_WALK * Math.pow(K_END / K_WALK, u) * (1 - 0.03 * creep);
  const cx = lerp(followCx(f), CX_END, u) + 9 * creep;
  const cam: Cam = { k, cx, cy: (960 - lerp(FEET_SY, FEET_SY_END, u)) / k };
  const depth: DepthOpts = { eyeY: lerp(EYE_W, EYE_END, sst5(RISE[0], RISE[1], f)), dRef: DREF, kRef: K_WALK, dolly: DOLLY };
  return { cam, depth, u };
};
export const camAt = (f: number): Cam => swayCam(rigAt(f).cam, f);
const REST = camAt(0);
/** screen <-> world (2D, the Z 0 plane) on a camera */
export const toScreen = (cam: Cam, p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
/** a depth's r on a frame's rig */
export const rOf = (f: number, Z: number) => {
  const { cam, depth } = rigAt(f);
  const Dc = depth.dRef * Math.pow(depth.kRef / cam.k, depth.dolly);
  return Dc / (Dc + Z);
};

// ===================================================================================================================
// THE NEAR OBJECTS: three slim, sharp things standing on the ground close to the lens, each only a little wider than
// the figures. Each is placed (X) and sized (half-width, the height its full width must reach) from the figures: it
// covers the old figure on the frame before the swap, and the new one and the old one's afterimage on the swap frame
// ===================================================================================================================
export type OccKind = "mound" | "boulder" | "bollard";
export type Occ = { kind: OccKind; swap: number; r: number; Z: number; X: number; hw: number; topY: number };
const OCC_SPEC: { kind: OccKind; r: number }[] = [
  { kind: "mound", r: 5.6 },
  { kind: "boulder", r: 5.2 },
  { kind: "bollard", r: 5.2 },
];
/** the coverage margin (screen px: the camera's sway and the painted edge) */
export const OCC_MARGIN = 9;
export const walkerBox = (f: number, cam: Cam = camAt(f), wp: WalkerPose = walkerPose(f)) => boxOf(buildWalker(wp, f), [walkX(f), 0], cam);
/** an occluder's screen centre x on a frame */
export const occCentre = (o: Occ, f: number, cam: Cam = camAt(f)) => 540 + (o.X - cam.cx) * rOf(f, o.Z) * cam.k;
export const OCCS: Occ[] = OCC_SPEC.map((sp, i) => {
  const s = SWAPS[i];
  const camA = camAt(s - 1);
  const camB = camAt(s);
  const Bo = walkerBox(s - 1, camA);
  const Bn = walkerBox(s, camB);
  const Ba = boxOf(AFTER[i].b, [AFTER[i].X, 0], camB);
  const Z = DREF * (1 / sp.r - 1);
  // its screen centre per X: 540 + (X - cx) r k; one frame earlier it stood further right by d
  const d = (camB.cx - camA.cx) * sp.r * camB.k;
  const lo = Math.min(Bo.x0 - d, Bn.x0, Ba.x0);
  const hi = Math.max(Bo.x1 - d, Bn.x1, Ba.x1);
  const c = (lo + hi) / 2;
  const hwS = (hi - lo) / 2 + OCC_MARGIN;
  const X = camB.cx + (c - 540) / (sp.r * camB.k);
  const hw = hwS / (sp.r * camB.k);
  // the height its full width must reach: above the figures' tops (screen) with the margin
  const topS = Math.min(Bo.y0, Bn.y0, Ba.y0) - OCC_MARGIN - 6;
  const eyeY = rigAt(s).depth.eyeY;
  // screen y = 960 + (eyeY + (Y - eyeY) r - cy) k  ->  Y
  const topY = eyeY + (camB.cy + (topS - 960) / camB.k - eyeY) / sp.r;
  return { kind: sp.kind, swap: s, r: sp.r, Z, X, hw, topY };
});
/** the near objects' outlines (x across in units of hw, y up in world units): full width from the ground to topY */
export const occOutline = (o: Occ): P2[] => {
  const h = o.hw;
  const t = o.topY;
  if (o.kind === "mound") {
    // a termite mound: a fluted clay spire, a lumpy two-lobed crown
    return [
      [-1.5 * h, 4],
      [-1.32 * h, -22],
      [-1.14 * h, -46],
      [-1.07 * h, t * 0.62],
      [-1.03 * h, t],
      [-0.86 * h, t - 0.3 * h],
      [-0.52 * h, t - 0.62 * h],
      [-0.14 * h, t - 0.86 * h],
      [0.06 * h, t - 0.92 * h],
      [0.3 * h, t - 0.74 * h],
      [0.52 * h, t - 0.62 * h],
      [0.7 * h, t - 0.54 * h],
      [0.9 * h, t - 0.3 * h],
      [1.05 * h, t],
      [1.08 * h, t * 0.6],
      [1.16 * h, -42],
      [1.36 * h, -20],
      [1.55 * h, 4],
    ];
  }
  if (o.kind === "boulder") {
    // a tall weathered boulder: a domed crown, a flat-ish facet on the right, a wide foot
    return [
      [-1.55 * h, 4],
      [-1.36 * h, -16],
      [-1.17 * h, -44],
      [-1.1 * h, t * 0.7],
      [-1.06 * h, t],
      [-0.9 * h, t - 0.3 * h],
      [-0.55 * h, t - 0.52 * h],
      [-0.1 * h, t - 0.62 * h],
      [0.36 * h, t - 0.58 * h],
      [0.78 * h, t - 0.4 * h],
      [1.04 * h, t - 0.1 * h],
      [1.1 * h, t * 0.72],
      [1.2 * h, -40],
      [1.42 * h, -14],
      [1.62 * h, 4],
    ];
  }
  // a cast-iron bollard: a plinth, the body, a collar and a domed cap with a finial
  return [
    [-1.24 * h, 4],
    [-1.24 * h, -14],
    [-1.04 * h, -18],
    [-1.02 * h, t],
    [-0.96 * h, t - 0.34 * h],
    [-0.7 * h, t - 0.66 * h],
    [-0.3 * h, t - 0.84 * h],
    [0.3 * h, t - 0.84 * h],
    [0.7 * h, t - 0.66 * h],
    [0.96 * h, t - 0.34 * h],
    [1.02 * h, t],
    [1.04 * h, -18],
    [1.24 * h, -14],
    [1.24 * h, 4],
  ];
};

// ===================================================================================================================
// THE SET
// ===================================================================================================================
const GROUND: Mat = { lit: "#8C805D", mid: "#706549", dark: "#3A3226" };
const GRASS = { lit: "#A39A6E", mid: "#8A8460", dark: "#5F5C40", deep: "#4A4732" };
const BARK = { lit: "#8C7258", mid: "#65503C", dark: "#3A2D22" };
const CLAY = { lit: "#B39373", mid: "#8F7358", dark: "#5C4836" };
const STONE_B = { lit: "#A39E92", mid: "#7F7A6F", dark: "#55514A" };
const IRON = MAT.iron;
const STONE_P = { lit: "#9C968A", mid: "#858073", dark: "#5C574D" };
/** the eras by world position: the pavement starts past the forager's afterimage (the modern man steps onto it) */
export const X_PAVE = AFTER[2].X + 62;

/** the savannah's tufts (deterministic): near (in front of him, the bottom of the frame) and behind */
type Tuft = { X: number; Z: number; h: number; w: number; n: number; seed: number; lean: number };
const TUFTS: Tuft[] = (() => {
  const out: Tuft[] = [];
  for (let i = 0; i < 70; i++) {
    const X = -700 + hash(i * 3.1 + 1) * 2400;
    const Z = -560 + hash(i * 5.7 + 2) * 260;
    // low (under the eye): they stay below his feet's line in the low walk
    out.push({ X, Z, h: 18 + 18 * hash(i * 1.9 + 3), w: 22 + 18 * hash(i * 2.3), n: 7 + Math.floor(5 * hash(i * 7.7)), seed: i, lean: (hash(i * 4.4) - 0.5) * 0.5 });
  }
  for (let i = 0; i < 90; i++) {
    const X = -1500 + hash(i * 3.7 + 11) * 3600;
    const Z = 240 + Math.pow(hash(i * 6.1 + 12), 1.4) * 1500;
    out.push({ X, Z, h: 30 + 34 * hash(i * 1.3 + 13), w: 18 + 16 * hash(i * 2.9), n: 6 + Math.floor(4 * hash(i * 8.3)), seed: 100 + i, lean: (hash(i * 4.9) - 0.5) * 0.5 });
  }
  return out;
})();
const TuftG: React.FC<{ A: AirWorld; t: Tuft }> = ({ A, t }) => {
  const P = A.P;
  const r = P.r(t.Z);
  const base = P.p(t.X, 0, t.Z);
  const blades: React.ReactNode[] = [];
  for (let j = 0; j < t.n; j++) {
    const u = (j + 0.5) / t.n - 0.5;
    const hj = t.h * (0.55 + 0.45 * hash(t.seed * 13 + j));
    const tipX = (u * 1.7 + t.lean + (hash(t.seed * 7 + j) - 0.5) * 0.5) * t.w * 1.3;
    const bx = u * t.w * 0.55;
    const ww = 2.4 + 1.6 * hash(t.seed * 5 + j);
    const q: P2[] = [
      [base[0] + (bx - ww) * r, base[1]],
      [base[0] + (bx + tipX * 0.45) * r, base[1] - hj * 0.55 * r],
      [base[0] + tipX * r, base[1] - hj * r],
      [base[0] + (bx + tipX * 0.45 + ww * 0.6) * r, base[1] - hj * 0.5 * r],
      [base[0] + (bx + ww) * r, base[1]],
    ];
    const lit = hash(t.seed * 3 + j) > 0.55;
    const col = lit ? mixHex(GRASS.lit, GRASS.mid, 0.3) : j % 2 ? GRASS.mid : GRASS.dark;
    blades.push(<path key={j} d={`M${Pt(q[0])}Q${Pt(q[1])} ${Pt(q[2])}Q${Pt(q[3])} ${Pt(q[4])}Z`} fill={A.tone(col, t.Z, hj * 0.5)} />);
  }
  return <g>{blades}</g>;
};

/** low boulders behind him */
const ROCKS = [
  { X: -420, Z: 520, w: 70, h: 44, s: 1 },
  { X: 260, Z: 880, w: 110, h: 60, s: 2 },
  { X: 610, Z: 430, w: 52, h: 34, s: 3 },
  { X: 1080, Z: 700, w: 90, h: 52, s: 4 },
  { X: -980, Z: 1100, w: 120, h: 70, s: 5 },
];
const Rock: React.FC<{ A: AirWorld; X: number; Z: number; w: number; h: number; s: number }> = ({ A, X, Z, w, h, s }) => {
  const P = A.P;
  const N = 14;
  const pts: P2[] = Array.from({ length: N }, (_, i) => {
    const a = Math.PI + (Math.PI * i) / (N - 1);
    const rr = 1 + 0.12 * (hash(s * 11 + i) - 0.5);
    return P.p(X + Math.cos(a) * w * rr, Math.min(0, Math.sin(a) * h * rr), Z);
  });
  const lit: P2[] = pts.slice(0, 8).map((p, i) => [p[0] + 3 * P.r(Z), p[1] + (i === 0 ? 0 : 4 * P.r(Z))]);
  return (
    <g>
      <AirShadow A={A} X={X} Z={Z} w={w * 1.1} d={w * 0.5} uid={`rk${s}s`} amt={0.6} />
      <path d={polyD(pts)} fill={A.tone(MAT.stone.mid, Z, h * 0.5)} />
      <path d={polyD([...lit, P.p(X - w * 0.1, -h * 0.55, Z)])} fill={A.tone(MAT.stone.lit, Z, h * 0.7)} opacity={0.7} />
    </g>
  );
};

/** the acacias: a forked trunk, a wide flat crown in layers */
const ACACIAS = [
  { X: -1500, Z: 2300, h: 900, s: 1 },
  { X: -420, Z: 1500, h: 760, s: 2 },
  { X: 900, Z: 2700, h: 980, s: 3 },
  { X: 1700, Z: 1300, h: 720, s: 4 },
  { X: 2600, Z: 2200, h: 900, s: 5 },
];
const Acacia: React.FC<{ A: AirWorld; X: number; Z: number; h: number; s: number }> = ({ A, X, Z, h, s }) => {
  const P = A.P;
  const p = (x: number, y: number) => P.p(X + x, y, Z);
  const tw = h * 0.028;
  const trunk = `M${Pt(p(-tw, 0))}L${Pt(p(-tw * 0.7, -h * 0.45))}L${Pt(p(-h * 0.2, -h * 0.82))}L${Pt(p(-h * 0.17, -h * 0.84))}L${Pt(p(0, -h * 0.52))}L${Pt(p(h * 0.18, -h * 0.83))}L${Pt(p(h * 0.21, -h * 0.81))}L${Pt(p(tw * 0.7, -h * 0.45))}L${Pt(p(tw, 0))}Z`;
  const crown = (cx: number, cy: number, rx: number, ry: number, col: string, k: number) => {
    const N = 22;
    const pts: P2[] = Array.from({ length: N }, (_, i) => {
      const a = (2 * Math.PI * i) / N;
      const wob = 1 + 0.08 * Math.sin(a * 5 + s * 2 + k) + 0.05 * Math.sin(a * 9 + s);
      return p(cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob * (Math.sin(a) > 0 ? 0.55 : 1));
    });
    return <path key={k} d={polyD(pts)} fill={A.tone(col, Z, -cy)} />;
  };
  return (
    <g>
      <AirShadow A={A} X={X} Z={Z} w={h * 0.5} d={h * 0.12} uid={`ac${s}s`} amt={0.35} />
      <path d={trunk} fill={A.tone(BARK.mid, Z, h * 0.4)} />
      {crown(0, -h * 0.86, h * 0.62, h * 0.12, "#4C5236", 0)}
      {crown(-h * 0.08, -h * 0.93, h * 0.48, h * 0.08, "#5E6442", 1)}
      {crown(-h * 0.14, -h * 0.97, h * 0.3, h * 0.05, "#727650", 2)}
    </g>
  );
};

/** the far hills: two soft ridges sinking into the air */
const Hills: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const ridge = (Z: number, H: number, seed: number, col: string) => {
    const pts: P2[] = [];
    const X0 = A.cam.cx - 30000;
    for (let i = 0; i <= 120; i++) {
      const X = X0 + i * 500;
      const y = -H * (0.45 + 0.3 * Math.sin(X / 2600 + seed) + 0.18 * Math.sin(X / 900 + seed * 2.3) + 0.07 * Math.sin(X / 330 + seed));
      pts.push(P.p(X, y, Z));
    }
    pts.push(P.p(X0 + 60000, 0, Z), P.p(X0, 0, Z));
    return <path d={polyD(pts)} fill={A.tone(col, Z, H * 0.4)} />;
  };
  return (
    <g>
      {ridge(12000, 3000, 1.3, "#56604E")}
      {ridge(6000, 1500, 4.1, "#5D6450")}
    </g>
  );
};

// ===================================================================================================================
// REV 2: THE MODERN CITY, the right side of the split. The man's paving becomes a city sidewalk with a kerb; beyond it
// a road (a lane line, a zebra crossing behind him), a far sidewalk with trees in planters, and a street wall of
// mid-rise blocks receding into the depth, towers behind in the haze. A streetlamp at the kerb beside him. All right
// of the split (X > X_PAVE): the savannah's side keeps its acacias. The buildings and the lamp grow out of the haze
// with the split (CITY_IN), nearest first; the ground is there with the paving
// ===================================================================================================================
export const X_KERB = 640;
const X_ROAD1 = 1440;
const X_FRONT = 1660;
const ASPHALT: Mat = { lit: "#6F736D", mid: "#5F635E", dark: "#3E423F" };
const KERB: Mat = { lit: "#D3CBB7", mid: "#BDB5A1", dark: "#7D7768" };
const PAINT = "#E6DDC8";
const CONC: Mat = { lit: "#DCD2BC", mid: "#C2B79F", dark: "#7E7665" };
const TEALG: Mat = { lit: "#A3B0AB", mid: "#84928D", dark: "#4E5B58" };
const SANDB: Mat = { lit: "#CDB892", mid: "#AF9A76", dark: "#6E604A" };
const GLASS = "#4D5B5A";
const WARM = "#F0E2BC";
/** the city's growing out of the haze: a building at depth Z appears over [t0, t0 + CITY_IN.dur], nearer first */
export const CITY_IN = { t0: 60, t1: 80, dur: 16 } as const;
export const cityIn = (f: number, Z: number) => {
  const t0 = lerp(CITY_IN.t0, CITY_IN.t1, c01((Z - 1000) / 9000));
  return sst(t0, t0 + CITY_IN.dur, f);
};

type Bld = { X0: number; X1: number; Z0: number; Z1: number; H: number; mat: Mat; bay: number; floor: number; seed: number; ribbon?: boolean; roof?: boolean };
export const BUILDINGS: Bld[] = (() => {
  const out: Bld[] = [];
  // the street wall: facades on X_FRONT (setbacks), receding along the road, cross streets between
  const wall: [number, number, number, Mat, boolean?][] = [
    [1250, 2350, 2150, TEALG],
    [2550, 3550, 1650, CONC],
    [3550, 4250, 2700, SANDB, true],
    [4500, 5500, 1900, CONC],
    [5500, 6700, 3500, TEALG, true],
    [7000, 8400, 2300, SANDB],
    [8400, 10400, 4200, CONC, true],
    [10700, 13000, 3000, TEALG],
  ];
  wall.forEach(([z0, z1, H, mat, ribbon], i) => {
    const set = 60 * hash(i * 4.3 + 70);
    out.push({ X0: X_FRONT + set, X1: X_FRONT + set + 1300, Z0: z0, Z1: z1, H, mat, bay: 230, floor: 300, seed: i, ribbon, roof: i % 2 === 1 });
  });
  // the towers behind and across the end of the street, in the haze
  const towers: [number, number, number, number, Mat, boolean?][] = [
    [2700, 3500, 5200, 4600, TEALG, true],
    [3900, 4700, 7600, 6200, CONC],
    [900, 1500, 7800, 3800, SANDB],
    [5200, 6300, 4000, 5400, CONC, true],
    [1500, 2300, 9800, 6800, TEALG, true],
    [2900, 3900, 11500, 8200, CONC],
    [600, 1200, 12500, 5200, TEALG],
    [6800, 8000, 8600, 7200, SANDB, true],
    [4600, 5600, 13500, 9000, TEALG, true],
  ];
  towers.forEach(([x0, x1, z0, H, mat, ribbon], i) => {
    out.push({ X0: x0, X1: x1, Z0: z0, Z1: z0 + (x1 - x0) * 0.9, H, mat, bay: 230, floor: 300, seed: 20 + i, ribbon, roof: true });
  });
  return out.sort((a, b) => b.Z0 - a.Z0);
})();

/** a building's windows on its front (the Z0 plane) and its left face (the X0 plane): one dark path, one lit path */
const Windows: React.FC<{ A: AirWorld; b: Bld; H: number }> = ({ A, b, H }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  const rows = Math.floor((H - 40) / b.floor);
  // the front: columns across X
  const face = (key: string, Zof: (c: number) => number, Xof: (c: number) => number, ncol: number, span: number, plane: "front" | "left") => {
    let dark = "";
    let lit = "";
    let shop = "";
    for (let c = 0; c < ncol; c++) {
      const Zc = Zof(c + 0.5);
      const px = b.floor * P.r(Zc) * A.k;
      if (px < 5) continue;
      for (let rr = 0; rr < rows; rr++) {
        const y0 = -(rr * b.floor + (rr === 0 ? 40 : 0.3 * b.floor));
        const y1 = -(rr * b.floor + 0.78 * b.floor);
        const u0 = c + (rr === 0 ? 0.06 : 0.2);
        const u1 = c + (rr === 0 ? 0.94 : b.ribbon ? 1.0 : 0.78);
        const q: P2[] =
          plane === "front"
            ? [P.p(Xof(u0), y0, b.Z0), P.p(Xof(u1), y0, b.Z0), P.p(Xof(u1), y1, b.Z0), P.p(Xof(u0), y1, b.Z0)]
            : [P.p(b.X0, y0, Zof(u0)), P.p(b.X0, y0, Zof(u1)), P.p(b.X0, y1, Zof(u1)), P.p(b.X0, y1, Zof(u0))];
        const d = polyD(q);
        if (rr === 0) shop += d;
        else if (hash(b.seed * 97 + c * 13.1 + rr * 7.7) > 0.82) lit += d;
        else dark += d;
      }
    }
    const Zm = Zof(ncol / 2);
    els.push(<path key={`${key}d`} d={dark} fill={A.tone(GLASS, Zm, H * 0.5)} opacity={0.8} />);
    els.push(<path key={`${key}s`} d={shop} fill={A.tone(mixHex(GLASS, "#2E3836", 0.4), Zm, 40)} opacity={0.85} />);
    els.push(<path key={`${key}l`} d={lit} fill={A.tone(WARM, Zm, H * 0.5)} opacity={0.7} />);
    void span;
  };
  const nf = Math.max(1, Math.floor((b.X1 - b.X0) / b.bay));
  const mf = (b.X1 - b.X0 - nf * b.bay) / 2;
  face("f", () => b.Z0, (u) => b.X0 + mf + u * b.bay, nf, b.X1 - b.X0, "front");
  if (b.X0 > P.vp[0]) {
    const nl = Math.max(1, Math.floor((b.Z1 - b.Z0) / b.bay));
    const ml = (b.Z1 - b.Z0 - nl * b.bay) / 2;
    face("l", (u) => b.Z0 + ml + u * b.bay, () => b.X0, nl, b.Z1 - b.Z0, "left");
  }
  return <g>{els}</g>;
};

const Building: React.FC<{ A: AirWorld; b: Bld; frame: number }> = ({ A, b, frame }) => {
  const amt = cityIn(frame, b.Z0);
  if (amt < 0.002) return null;
  const H = b.H;
  return (
    <g opacity={amt}>
      <AirBox A={A} X0={b.X0} X1={b.X1} Y0={-H} Y1={0} Z0={b.Z0} Z1={b.Z1} mat={b.mat} uid={`ebpB${b.seed}`} rim={0.8} />
      <Windows A={A} b={b} H={H} />
      {b.roof ? (
        <AirBox A={A} X0={lerp(b.X0, b.X1, 0.25)} X1={lerp(b.X0, b.X1, 0.6)} Y0={-H - 130} Y1={-H} Z0={lerp(b.Z0, b.Z1, 0.3)} Z1={lerp(b.Z0, b.Z1, 0.7)} mat={b.mat} uid={`ebpR${b.seed}`} rim={0.6} />
      ) : null}
    </g>
  );
};

/** THE CITY ERA: the ground is paved from X_PAVE on: a sidewalk that runs into the depth to the horizon (melting into
 *  the air with the ground), its near part past the lens (no edge, no corner in frame), a kerb, the road, the far
 *  sidewalk: the change of era is the change of ground under his feet */
const Pavement: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  if (A.cam.cx + 9000 <= X_PAVE) return null;
  // the kit's floor stops at its near plane; let the paving run on toward the lens
  const zn = -0.97 * A.P.Dc;
  const Ap: AirWorld = { ...A, P: { ...A.P, zNear: zn } };
  // the road's lane line and the zebra crossing behind him
  const XM = (X_KERB + X_ROAD1) / 2;
  const marks: React.ReactNode[] = [];
  for (let Z = -400; Z < 9000; Z += 300) {
    const z0 = Math.max(Z, -0.9 * A.P.Dc);
    const z1 = Z + 160;
    if (z1 <= z0) continue;
    if (Z > 120 && Z < 760) continue;
    const a = 1 - A.fog((z0 + z1) / 2);
    marks.push(<path key={`ln${Z}`} d={polyD([P.p(XM - 9, 0, z0), P.p(XM + 9, 0, z0), P.p(XM + 9, 0, z1), P.p(XM - 9, 0, z1)])} fill={A.tone(PAINT, (z0 + z1) / 2, 0)} opacity={0.75 * a} />);
  }
  for (let X = X_KERB + 50; X + 50 < X_ROAD1; X += 105) {
    marks.push(<path key={`zb${X}`} d={polyD([P.p(X, 0, 250), P.p(X + 58, 0, 250), P.p(X + 58, 0, 520), P.p(X, 0, 520)])} fill={A.tone(PAINT, 380, 0)} opacity={0.88} />);
  }
  // the kerb's drop: a dark line on the road side of the kerbstones (the step's shadow)
  const drop: React.ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const za = lerp(-0.9 * A.P.Dc, 9000, Math.pow(i / 16, 1.6));
    const zb = lerp(-0.9 * A.P.Dc, 9000, Math.pow((i + 1) / 16, 1.6));
    const a = 1 - A.fog((za + zb) / 2);
    drop.push(<path key={`kd${i}`} d={polyD([P.p(X_KERB, 0, za), P.p(X_KERB + 10, 0, za), P.p(X_KERB + 10, 0, zb), P.p(X_KERB, 0, zb)])} fill={A.tone(ASPHALT.dark, (za + zb) / 2, 0)} opacity={0.8 * a} />);
  }
  return (
    <g>
      <AirFloor A={Ap} x0={X_PAVE} x1={X_KERB - 26} z0={zn} z1={14000} mat={STONE_P} course={124} plank={106.5} lw={1.3} jointAmt={1.4} melt={0.5} />
      <AirFloor A={Ap} x0={X_KERB - 26} x1={X_KERB} z0={zn} z1={14000} mat={KERB} course={150} plank={26} lw={1.1} jointAmt={1.1} melt={0.5} />
      <AirFloor A={Ap} x0={X_KERB} x1={X_ROAD1} z0={zn} z1={14000} mat={ASPHALT} jointAmt={0} melt={0.5} />
      <AirFloor A={Ap} x0={X_ROAD1} x1={X_ROAD1 + 22} z0={zn} z1={14000} mat={KERB} course={150} plank={22} lw={1.1} jointAmt={1.1} melt={0.5} />
      <AirFloor A={Ap} x0={X_ROAD1 + 22} x1={A.cam.cx + 9000} z0={zn} z1={14000} mat={STONE_P} course={124} plank={112} lw={1.3} jointAmt={1.2} melt={0.5} />
      {drop}
      {marks}
    </g>
  );
};

/** the streetlamp at the kerb beside him: a slim pole, an arm out over the road, a flat modern head */
export const LAMP = { X: 612, Z: 150, H: 700, arm: 140 } as const;
const Lamp: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const amt = cityIn(frame, 0) * 1;
  if (amt < 0.002) return null;
  const P = A.P;
  const { X, Z, H, arm } = LAMP;
  const r = P.r(Z);
  const p = (x: number, y: number) => P.p(X + x, y, Z);
  const w = 8;
  const pole = polyD([p(-w, 0), p(-w * 0.7, -H), p(w * 0.7, -H), p(w, 0)]);
  const base = polyD([p(-17, 0), p(-15, -46), p(15, -46), p(17, 0)]);
  const a0 = p(0, -H + 6);
  const a1 = p(arm * 0.55, -H - 34);
  const a2 = p(arm, -H - 30);
  const head = polyD([p(arm - 52, -H - 38), p(arm + 26, -H - 34), p(arm + 24, -H - 20), p(arm - 50, -H - 24)]);
  const lens = polyD([p(arm - 44, -H - 23), p(arm + 20, -H - 20), p(arm + 18, -H - 17), p(arm - 42, -H - 20)]);
  const col = (h: string) => A.tone(h, Z, H * 0.5);
  return (
    <g opacity={amt}>
      <AirShadow A={A} X={X} Z={Z} w={34} d={18} uid="ebpLs" amt={0.6} />
      <path d={pole} fill={col(IRON.mid)} stroke={col(lineOf(IRON))} strokeWidth={0.9} />
      <path d={polyD([p(-w * 0.15, -6), p(-w * 0.1, -H + 4), p(w * 0.55, -H + 4), p(w * 0.85, -6)])} fill={col(IRON.dark)} opacity={0.55} />
      <path d={base} fill={col(IRON.dark)} />
      <path d={`M${Pt(a0)}Q${Pt(a1)} ${Pt(a2)}`} fill="none" stroke={col(IRON.mid)} strokeWidth={9 * r} strokeLinecap="round" />
      <path d={head} fill={col(IRON.dark)} />
      <path d={lens} fill={col(WARM)} opacity={0.85} />
    </g>
  );
};

/** street trees in concrete planters on the far sidewalk */
export const STREET_TREES = [
  { X: 1555, Z: 1900, s: 1 },
  { X: 1555, Z: 3050, s: 2 },
  { X: 1555, Z: 4250, s: 3 },
  { X: 1555, Z: 5600, s: 4 },
];
const StreetTree: React.FC<{ A: AirWorld; X: number; Z: number; s: number; frame: number }> = ({ A, X, Z, s, frame }) => {
  const amt = cityIn(frame, Z);
  if (amt < 0.002) return null;
  const P = A.P;
  const p = (x: number, y: number) => P.p(X + x, y, Z);
  const h = 640 + 80 * hash(s * 3.3);
  const crown = (cx: number, cy: number, R: number, col: string, k: number) => {
    const N = 20;
    const pts: P2[] = Array.from({ length: N }, (_, i) => {
      const a = (2 * Math.PI * i) / N;
      const wob = 1 + 0.06 * Math.sin(a * 5 + s * 2 + k) + 0.04 * Math.sin(a * 8 + s);
      return p(cx + Math.cos(a) * R * wob, cy + Math.sin(a) * R * wob * 0.92);
    });
    return <path key={k} d={polyD(pts)} fill={A.tone(col, Z, -cy)} />;
  };
  return (
    <g opacity={amt}>
      <AirBox A={A} X0={X - 70} X1={X + 70} Y0={-80} Y1={0} Z0={Z - 70} Z1={Z + 70} mat={CONC} uid={`ebpPl${s}`} rim={0.7} />
      <path d={polyD([p(-9, -80), p(-6, -h * 0.62), p(6, -h * 0.62), p(9, -80)])} fill={A.tone(BARK.mid, Z, h * 0.3)} />
      {crown(0, -h * 0.72, h * 0.27, "#55603F", 0)}
      {crown(-h * 0.05, -h * 0.77, h * 0.19, "#67714B", 1)}
      {crown(-h * 0.09, -h * 0.82, h * 0.1, "#7A815A", 2)}
    </g>
  );
};

// ---- the near objects, drawn (sharp, in the set's paint) -----------------------------------------------------------
const OccluderG: React.FC<{ A: AirWorld; o: Occ }> = ({ A, o }) => {
  const P = A.P;
  const r = P.r(o.Z);
  const p = (x: number, y: number) => P.p(o.X + x, y, o.Z);
  const cxS = 540 + (p(0, 0)[0] - A.cam.cx) * A.cam.k;
  const hwS = o.hw * r * A.cam.k;
  if (cxS + hwS * 1.8 < -20 || cxS - hwS * 1.8 > 1100) return null;
  const out = occOutline(o);
  const body = smoothD(out.map(([x, y]) => p(x, y)));
  const h = o.hw;
  const t = o.topY;
  const id = `ebpOcc${o.swap}`;
  // the light: from the left, a lit band on the left, a core shadow on the right (both clipped to the outline)
  const band = (u0: number, u1: number) => polyD([p(u0 * h, 20), p(u0 * h, t - 1.4 * h), p(u1 * h, t - 1.4 * h), p(u1 * h, 20)]);
  const mat = o.kind === "mound" ? CLAY : o.kind === "boulder" ? STONE_B : IRON;
  const detail: React.ReactNode[] = [];
  if (o.kind === "mound") {
    // the flutes: long vertical ridges of clay, a few pits
    for (let i = 0; i < 9; i++) {
      const u = -0.95 + (1.9 * (i + 0.5)) / 9 + (hash(i * 3.3) - 0.5) * 0.12;
      const y0 = -6 - 20 * hash(i * 1.3);
      const y1 = t - (0.2 + 0.7 * hash(i * 2.9)) * h * (1 - Math.abs(u));
      const q = [0, 0.33, 0.66, 1].map((k): P2 => {
        const y = lerp(y0, y1, k);
        return p((u + 0.04 * Math.sin(k * 4 + i)) * h, y);
      });
      detail.push(<path key={`f${i}`} d={`M${Pt(q[0])}C${Pt(q[1])} ${Pt(q[2])} ${Pt(q[3])}`} fill="none" stroke={CLAY.dark} strokeWidth={(0.07 + 0.04 * hash(i)) * h * r} strokeOpacity={0.4} strokeLinecap="round" />);
      detail.push(<path key={`g${i}`} d={`M${Pt(q[0])}C${Pt(q[1])} ${Pt(q[2])} ${Pt(q[3])}`} fill="none" stroke={CLAY.lit} strokeWidth={0.035 * h * r} strokeOpacity={0.4} strokeLinecap="round" transform={`translate(${(-0.06 * h * r).toFixed(2)} 0)`} />);
    }
    for (let i = 0; i < 6; i++) {
      const c = p((hash(i * 7.1) - 0.5) * 1.4 * h, lerp(-30, t, hash(i * 5.3)));
      detail.push(<ellipse key={`p${i}`} cx={c[0]} cy={c[1]} rx={0.07 * h * r} ry={0.1 * h * r} fill={CLAY.dark} opacity={0.55} />);
    }
  } else if (o.kind === "boulder") {
    // a crack, a chipped facet, lichen
    const crack = [p(0.2 * h, t - 0.6 * h), p(0.05 * h, t * 0.8), p(0.28 * h, t * 0.55), p(0.12 * h, t * 0.3)];
    detail.push(<path key="c" d={`M${crack.map(Pt).join("L")}`} fill="none" stroke={STONE_B.dark} strokeWidth={0.05 * h * r} strokeOpacity={0.55} strokeLinejoin="round" strokeLinecap="round" />);
    detail.push(<path key="fa" d={polyD([p(0.45 * h, t - 0.55 * h), p(1.0 * h, t - 0.1 * h), p(1.05 * h, t * 0.6), p(0.6 * h, t * 0.7)])} fill={STONE_B.dark} opacity={0.25} />);
    for (let i = 0; i < 7; i++) {
      const c = p((hash(i * 4.1) - 0.6) * 1.3 * h, lerp(t * 0.3, t - 0.5 * h, hash(i * 2.2)));
      detail.push(<ellipse key={`l${i}`} cx={c[0]} cy={c[1]} rx={(0.08 + 0.08 * hash(i)) * h * r} ry={(0.05 + 0.05 * hash(i * 3)) * h * r} fill="#8E916C" opacity={0.5} />);
    }
  } else {
    // the collar ring, the cap's seam, the finial
    const ring = (y: number, w: number, key: string) => (
      <path key={key} d={polyD([p(-w * h, y), p(w * h, y), p(w * h, y - 0.12 * h), p(-w * h, y - 0.12 * h)])} fill={IRON.dark} opacity={0.75} />
    );
    detail.push(ring(t + 0.05 * h, 1.08, "r1"));
    detail.push(ring(-18, 1.06, "r2"));
    const fin = p(0, t - 0.86 * h);
    detail.push(<ellipse key="fin" cx={fin[0]} cy={fin[1]} rx={0.2 * h * r} ry={0.16 * h * r} fill={IRON.mid} />);
    detail.push(<path key="sp" d={polyD([p(-0.62 * h, -20), p(-0.62 * h, t - 0.2 * h), p(-0.52 * h, t - 0.3 * h), p(-0.52 * h, -20)])} fill={IRON.lit} opacity={0.45} />);
  }
  const sh = p(0, 0);
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`} clipPathUnits="userSpaceOnUse">
          <path d={body} />
        </clipPath>
      </defs>
      <ellipse cx={sh[0] + 0.1 * h * r} cy={sh[1] + 2 * r} rx={1.9 * h * r} ry={0.32 * h * r} fill="#2A241C" opacity={0.35} />
      <path d={body} fill={mat.mid} />
      <g clipPath={`url(#${id}c)`}>
        <path d={band(-1.8, -0.5)} fill={mat.lit} opacity={0.55} />
        <path d={band(0.42, 1.8)} fill={mat.dark} opacity={0.55} />
        {detail}
      </g>
    </g>
  );
};

// ---- the head glow -------------------------------------------------------------------------------------------------
/** THE GLOW OF INTELLIGENCE: a soft orange spot inside the skull (the cranium, up and back of the face), its warm
 *  light filling the head from within (clipped to the head's disc, as the COVID lungs light the chest) and a faint halo
 *  past the skull. Its size is GLOW_R: it grows only a little across the march. pulse: the shared pulse */
const HeadGlow: React.FC<{ c: P2; R: number; head: P2; headR: number; uid: string; amt?: number; pulse?: number }> = ({ c, R, head, headR, uid, amt = 1, pulse = 0 }) => {
  const Rs = R * (1 + 0.3 * pulse);
  return (
    <g opacity={amt}>
      <defs>
        <radialGradient id={`${uid}h`}>
          <stop offset="0" stopColor={ACCENT} stopOpacity={0.3} />
          <stop offset="0.5" stopColor={ACCENT_DEEP} stopOpacity={0.1} />
          <stop offset="1" stopColor={ACCENT_DEEP} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}w`}>
          <stop offset="0" stopColor={ACCENT} stopOpacity={0.34} />
          <stop offset="0.55" stopColor={ACCENT} stopOpacity={0.12} />
          <stop offset="1" stopColor={ACCENT_DEEP} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}s`}>
          <stop offset="0" stopColor={mixHex(ACCENT, "#FFEBC0", 0.6)} stopOpacity={1} />
          <stop offset="0.38" stopColor={mixHex(ACCENT, "#FFD9A0", 0.25)} stopOpacity={1} />
          <stop offset="0.72" stopColor={ACCENT} stopOpacity={0.92} />
          <stop offset="1" stopColor={ACCENT_DEEP} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${uid}c`} clipPathUnits="userSpaceOnUse">
          <circle cx={head[0]} cy={head[1]} r={headR * 1.02} />
        </clipPath>
      </defs>
      <circle cx={c[0]} cy={c[1]} r={Rs * (GLOW_REACH + 1.4 * pulse)} fill={`url(#${uid}h)`} opacity={0.65 + 0.35 * pulse} />
      <circle cx={c[0]} cy={c[1]} r={Rs * 3.4} fill={`url(#${uid}w)`} clipPath={`url(#${uid}c)`} />
      <circle cx={c[0]} cy={c[1]} r={Rs * 1.3} fill={`url(#${uid}s)`} />
    </g>
  );
};

// ---- an afterimage, drawn ------------------------------------------------------------------------------------------
const AfterG: React.FC<{ A: AirWorld; a: After; i: number; frame: number }> = ({ A, a, i, frame }) => {
  const at: P2 = [a.X, 0];
  const g = glowOf(a.b, at);
  const sh = SHADOW[a.b.kind];
  const shimmer = 1 + 0.03 * Math.sin(frame / 4.3 + i * 2.1) * sst(96, 104, frame);
  const pulse = pulseAt(frame);
  const id = `ebpAf${i}`;
  return (
    <g>
      <defs>
        <filter id={`${id}b`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={(0.8 / A.cam.k).toFixed(3)} />
        </filter>
      </defs>
      <g opacity={AFTER_OP} filter={`url(#${id}b)`}>
        <AirShadow A={A} X={a.X} Z={0} w={sh.w} d={sh.d} uid={`${id}s`} amt={0.45} />
        <CovidPaint shapes={a.shapes} at={at} scale={a.b.scale} uid={id} fog={A.folkFog(0)} unitPx={A.cam.k} />
      </g>
      <HeadGlow c={g.c} R={g.R * shimmer} head={g.head} headR={g.headR} uid={`${id}g`} amt={0.78 + 0.22 * pulse} pulse={pulse} />
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const EvolutionBarelyPushed: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const rig = rigAt(frame);
  const cam = swayCam(rig.cam, frame);
  const A = airWorldOf({ cam, rest: REST, depth: rig.depth, frame });
  const P = A.P;
  const half = 560 / cam.k;
  const onScreen = (X: number, Z: number, pad: number) => Math.abs(P.p(X, 0, Z)[0] - cam.cx) < half + pad * P.r(Z);
  // the walker
  const wp = walkerPose(frame);
  const b = buildWalker(wp, frame);
  const X = walkX(frame);
  const at: P2 = [X, 0];
  const g = glowOf(b, at);
  const sh = SHADOW[b.kind];
  const pulse = pulseAt(frame);
  const shimmer = 1 + 0.03 * Math.sin(frame / 4.3 + 7) * sst(96, 104, frame);
  const behind = TUFTS.filter((t) => t.Z > 0 && t.X < X_PAVE && onScreen(t.X, t.Z, 120)).sort((a, c) => c.Z - a.Z);
  const front = TUFTS.filter((t) => t.Z < 0 && t.X < X_PAVE && onScreen(t.X, t.Z, 120)).sort((a, c) => c.Z - a.Z);
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <Hills A={A} />
        <path d={polyD([P.p(cam.cx - 3000, 0, P.zNear + 20), P.p(cam.cx + 3000, 0, P.zNear + 20), [cam.cx + 3000, cam.cy + 2000], [cam.cx - 3000, cam.cy + 2000]])} fill={A.tone(mixHex(mixHex(GROUND.lit, GROUND.mid, 0.3), GROUND.dark, 0.2), P.zNear, 0)} />
        <AirFloor A={A} x0={cam.cx - 12000} x1={cam.cx + 12000} z0={-900} z1={14000} mat={GROUND} jointAmt={0} melt={0.5} />
        <AirHorizonHazeW A={A} id="ebpHaze" />
        {ACACIAS.map((a) =>
          onScreen(a.X, a.Z, a.h * 0.7) && (a.X < X_PAVE || cityIn(frame, a.Z) < 0.999) ? (
            <g key={a.s} opacity={a.X < X_PAVE ? 1 : 1 - cityIn(frame, a.Z)}>
              <Acacia A={A} {...a} />
            </g>
          ) : null,
        )}
        <Pavement A={A} />
        {BUILDINGS.map((bd) => (
          <Building key={bd.seed} A={A} b={bd} frame={frame} />
        ))}
        {STREET_TREES.map((t) => (onScreen(t.X, t.Z, 300) ? <StreetTree key={t.s} A={A} {...t} frame={frame} /> : null))}
        <Lamp A={A} frame={frame} />
        {ROCKS.map((r) => (r.X + r.w < X_PAVE && onScreen(r.X, r.Z, r.w) ? <Rock key={r.s} A={A} {...r} /> : null))}
        {behind.map((t) => (
          <TuftG key={t.seed} A={A} t={t} />
        ))}
        {AFTER.map((a, i) => (frame >= a.from ? <AfterG key={i} A={A} a={a} i={i} frame={frame} /> : null))}
        <AirShadow A={A} X={X} Z={0} w={sh.w} d={sh.d} uid="ebpWs" amt={0.85} />
        <CovidPaint shapes={b.shapes} at={at} scale={b.scale} uid="ebpW" fog={A.folkFog(0)} unitPx={cam.k} />
        <HeadGlow c={g.c} R={g.R * shimmer} head={g.head} headR={g.headR} uid="ebpHg" pulse={pulse} />
        {front.map((t) => (
          <TuftG key={t.seed} A={A} t={t} />
        ))}
        {OCCS.map((o) => (
          <OccluderG key={o.swap} A={A} o={o} />
        ))}
      </WorldSvg>
    </AirStage>
  );
};

export default EvolutionBarelyPushed;
