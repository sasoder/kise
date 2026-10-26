// ---------------------------------------------------------------------------
// ModernYieldsMissing (kyle-rome-industrial, cut 20). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 274 frames.
// One stage inside the misty teal air (AirStage, palette A, mood day) on the clip's shared ROMAN FARM (./farmPlan +
// ./farmWorld, built with cut 13 MostlyFarmers; imported, never edited). Camera, stations and ghost outlines:
// ./modernYieldsPlan.ts.
//
// CHECK LINE: "everything that later made farming enormously productive — the tractor, synthetic fertiliser, the
// high-yield wheat of the green revolution — was missing from the Roman field; next to its ghost, the Roman harvest
// is tiny."
//
// THE LINE: "[They don't have] modern mechanized traction. They don't have modern synthetic fertilizers. They don't
// have the modern green revolution yields, all the things that have made agriculture stupendously productive. [And,]"
// WORD -> FRAME (Whisper, heard ~6 frames later): (modern) MECHANIZED -17-39 · TRACTION 39-57 · They don't have modern
// 66-85 · SYNTHETIC 85-96 · FERTILIZERS 96-118 · They don't have the modern 122-143 · GREEN REVOLUTION 143-163 ·
// YIELDS 163-178 · all the things that have made 183-213 · agriculture 213-227 · STUPENDOUSLY 244-257 · PRODUCTIVE
// 257-268
// DURATION: the slot 20.387 -> 29.529 s in the sequence (frames 611 -> 885) = 274 frames at 30000/1001.
//
// THE MOTION (Rev 1, after the director's review): a lateral dolly to screen right that MOVES -> HOLDS -> MOVES ->
// HOLDS: it holds still (~0.3 unit/frame) on each Roman thing, arriving just before its word (holds f0-39, f82-98,
// f142-164, f210-274), with three eased moves between (f39-82, f98-142, f164-210; level-topped speed, peaks 38-44
// px/frame at the stations) during which the eye backs out ~15 % and settles back in on arrival. Past four
// Roman things standing on one line along the near edge of row B (their bases near y 1050, ~1.75 px/unit). Beside
// each a DASHED ORANGE ghost of the modern thing Rome never had (the clip's dashed orange = technology Rome never had):
// a bold dashed line (~8.5 px, round caps, dash 3x / gap 2x the stroke, a soft glow, bloom 0.24) drawn by ONE moving
// pen tip that glides in along a lead-in from off the frame edge and dims into the finished line.
//   f0-57 "mechanized traction": the world's ox team ploughing B2 (walking left); over it a dashed tractor (big rear
//     wheel, small front wheel, bonnet, cab, exhaust; 0.72x life so it stands about as tall as the oxen, ~555 px)
//     travels with the oxen, its wheels rolling; pen in from the left, drawn f0-36, front wheel first.
//   f57-122 "synthetic fertilizers": a farmer on the fresh furrows flings manure from the basket at his belly (cause: his
//     near hand opens at u 0.58 of each 40-frame cycle; effect: the clumps leave it that frame and land as dark spots 13
//     frames later); beside him a dashed fat fertiliser sack (tied neck, two blank stencil bars) and a spinner, one pen
//     in from the right f74-106; the spinner's fan of granules opens f103-114 and keeps streaming.
//   f122-213 "green revolution yields": B3's sparse Roman wheat with its reapers at the left edge; over it a dashed patch
//     of modern wheat rises plant by plant under a sweeping pen f138-172. ACCURACY: the Green Revolution wheats were
//     semi-dwarfs, so the ghost stands ~0.9x the Roman wheat's height; the yield reads from density (~3x the stalks,
//     tight even rows) and big heavy ears (one fat
//     forward-nodding stroke each).
//   f213-274 "stupendously productive": the dolly lands at a clearing in B3 (the world's B3 wheat redrawn here without
//     it; standing wheat in front fills the foot of the frame, its near ears drawn as real wheat: slim segmented ears,
//     fine awns, a little sparser in the nearest rows): a reaper cutting its edge (wholly in frame), the Roman day's
//     harvest beside him (a small grain heap on its cloth, ~130 px) and the dashed modern heap: a low broad grain mound
//     in the same profile (base ~2.35x its height), ~3x higher (~390 px), with a few dashed grain strokes on its face;
//     pen in from the right f210, the outline and marks done by f254. Then the creep: sickles, oxen, granules and
//     motes keep moving.
// Below the stations: the ploughed ridges with clods (B2) and the near standing wheat (B3) fill y 1050-1440; plain
// ground only below that.
// Orange = only the dashed ghosts; the farm itself has no orange; people never orange.
// World clock: farm frame = ours + 158 (the ox team stands under the opening). Hidden world farmers: B3r0, B3r1, B3g
// (would stand in the caption bands), B2b's team and binder (clutter behind the ghost tractor).
//
// DEPTH: farmPlan's eye: H 300 (1.7 m), Z 2160 (constant), F 1300, horizon row 523; X 0 -> 3385. Fog by world depth
// (FARM_SCENE). The stations at Z 2870-3030; every face, hand and ghost above y 1080.
//
// SOURCES: illustrative, nothing on screen. Roman ox-drawn ard and manuring by hand (Varro, Res Rusticae I.29, I.38;
// Columella II.14-15 on dung); reaping with the sickle (Varro I.50). Modern: the tractor, granular fertiliser and the
// spinner (broadcast) spreader; the Green Revolution's high-yield semi-dwarf wheats (Borlaug, CIMMYT, 1950s-60s:
// shorter, stiffer straw carrying heavier ears, with fertiliser).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, AirShadow, AirStage, RomeFolk, WorldSvg, swayCam, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { closedD, loadArt } from "../kyle-rome-slavery/romeFolkBody";
import type { FigPose } from "../kyle-rome-slavery/romeFolk";
import { FIG_SCALE, FPS as PLAN_FPS, PLOUGH, TUFTS, windAt, type FarmEye, type Tuft } from "./farmPlan";
import { FARM_MAT, FarmPaint, FarmWorld, FarmerFig, GrainHeap, WheatTufts, farmAirOf, type FarmItem } from "./farmWorld";
import {
  BIG_HEAP,
  FAN,
  FLING,
  HIDE,
  LAST_REAPER,
  MANURE_MAN,
  MODERN_WHEAT,
  REAPED,
  ROMAN_HEAP,
  SACK,
  SPINNER,
  STROKE_PX,
  TRACTOR,
  bigHeapMound,
  dashFor,
  eyeAt,
  sackStrokes,
  scaleAtZ,
  smooth,
  tractorStrokes,
  tractorX,
  worldFrame,
  type P2,
} from "./modernYieldsPlan";

export const FPS = PLAN_FPS;
export const DURATION = 274;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const frac = (v: number) => v - Math.floor(v);
const n2 = (v: number) => v.toFixed(2);
const hash = (s: number) => frac(Math.sin(s * 127.1 + 311.7) * 43758.5453);

// ===================================================================================================================
// THE GHOSTS: bold dashed orange outlines drawn by one moving pen. Strokes are 3D polylines (X, h up +, Z); the dash
// pattern is laid in world units along each stroke (it never crawls). The pen first glides in along a lead-in line
// from off the frame (pen up), then runs stroke after stroke (pen up between them at 3x speed); after the last
// stroke it dims into the line's end.
// ===================================================================================================================
type V3 = [number, number, number];
type Ghost3 = V3[][];
const TRAVEL_K = 0.33;
const segLen = (a: V3, b: V3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
/** pen distance (world units) -> the dash path (2D world) and the tip */
const ghostDraw = (A: AirWorld, strokes: Ghost3, pen: number, dash: [number, number], lead: V3 | null) => {
  const P = A.P;
  const pr = (v: V3): P2 => P.p(v[0], -v[1], v[2]) as P2;
  let d = "";
  let left = pen;
  let tip: P2 | null = null;
  let prevEnd: V3 | null = lead;
  const per = dash[0] + dash[1];
  for (const st of strokes) {
    if (st.length < 2) continue;
    if (prevEnd) {
      const T = segLen(prevEnd, st[0]) * TRAVEL_K;
      if (left < T) {
        const t = T > 0 ? left / T : 1;
        const a = prevEnd;
        tip = pr([mix(a[0], st[0][0], t), mix(a[1], st[0][1], t), mix(a[2], st[0][2], t)]);
        return { d, tip };
      }
      left -= T;
    }
    const cum = [0];
    for (let i = 1; i < st.length; i++) cum.push(cum[i - 1] + segLen(st[i - 1], st[i]));
    const L = cum[cum.length - 1];
    const upto = Math.min(L, left);
    const at = (s: number): V3 => {
      let i = 1;
      while (i < cum.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      return [mix(st[i - 1][0], st[i][0], t), mix(st[i - 1][1], st[i][1], t), mix(st[i - 1][2], st[i][2], t)];
    };
    for (let s0 = 0; s0 < upto; s0 += per) {
      const s1 = Math.min(upto, s0 + dash[0]);
      const pts: P2[] = [pr(at(s0))];
      for (let i = 1; i < cum.length - 1; i++) if (cum[i] > s0 && cum[i] < s1) pts.push(pr(st[i]));
      pts.push(pr(at(s1)));
      d += `M${pts.map((q) => `${n2(q[0])},${n2(q[1])}`).join("L")}`;
    }
    if (left <= L) return { d, tip: pr(at(Math.max(0, left))) };
    left -= L;
    prevEnd = st[st.length - 1];
  }
  return { d, tip: prevEnd ? pr(prevEnd) : null };
};
const penLength = (strokes: Ghost3, lead: V3 | null) => {
  let tot = 0;
  let prev: V3 | null = lead;
  for (const st of strokes) {
    if (prev) tot += segLen(prev, st[0]) * TRAVEL_K;
    for (let i = 1; i < st.length; i++) tot += segLen(st[i - 1], st[i]);
    prev = st[st.length - 1];
  }
  return tot;
};
/** the pen's progress through a draw window: a quick ease in, constant speed, a soft ease out */
const penT = (f: number, w: [number, number]) => {
  const t = c01((f - w[0]) / (w[1] - w[0]));
  const a = 0.1;
  const v = 1 / (1 - a);
  if (t < a) return (v * t * t) / (2 * a);
  if (t > 1 - a) return 1 - (v * (1 - t) * (1 - t)) / (2 * a);
  return v * (t - a / 2);
};
/** the stroke width (screen px) of a ghost at depth Z: bold near, thinner as it recedes */
const strokePx = (A: AirWorld, Z: number, base = STROKE_PX) => base * Math.min(1, Math.max(0.45, (A.P.r(Z) * A.cam.k) / scaleAtZ(2900)));
const GhostPath: React.FC<{ A: AirWorld; d: string; Z: number; h?: number; px?: number; glow?: number }> = ({ A, d, Z, h = 150, px, glow = 0.16 }) => {
  if (!d) return null;
  const k = A.cam.k;
  const w = px ?? strokePx(A, Z);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={ACCENT} strokeOpacity={glow} strokeWidth={n2((w * 2.6) / k)} />
      <path d={d} stroke={A.toneO(ACCENT, Z, h)} strokeWidth={n2(w / k)} />
    </g>
  );
};
/** the pen tip: a warm light at the head of the line; `op` dims it into the line after the last stroke */
const Tip: React.FC<{ A: AirWorld; at: P2 | null; op?: number }> = ({ A, at, op = 1 }) => {
  if (!at || op <= 0.01) return null;
  const k = A.cam.k;
  return (
    <g opacity={op}>
      <circle cx={n2(at[0])} cy={n2(at[1])} r={n2(22 / k)} fill={ACCENT} opacity={0.2} />
      <circle cx={n2(at[0])} cy={n2(at[1])} r={n2(10 / k)} fill={ACCENT} opacity={0.55} />
      <circle cx={n2(at[0])} cy={n2(at[1])} r={n2(5 / k)} fill="#FFF1C9" />
    </g>
  );
};
/** the tip's presence for a draw window: from its start, dimming over 7 frames after the line is done */
const tipOp = (f: number, w: [number, number]) => (f < w[0] ? 0 : f <= w[1] ? 1 : 1 - c01((f - w[1]) / 7));
/** local (x forward, y up -) strokes into world 3D at (X, Z) facing dir */
const toWorld = (strokes: P2[][], X: number, Z: number, dir: 1 | -1, s = 1): Ghost3 => strokes.map((st) => st.map(([x, y]): V3 => [X + dir * x * s, -y * s, Z]));

// ---- station 1: the tractor ---------------------------------------------------------------------------------------
const tractorGhost = (A: AirWorld, f: number): FarmItem[] => {
  const X = tractorX(f);
  // rolling: the tractor drives toward -X with the oxen; the wheels turn by distance / radius
  const roll = (tractorX(0) - X) / (TRACTOR.R * TRACTOR.s);
  const g = toWorld(tractorStrokes(roll), X, TRACTOR.Z, -1, TRACTOR.s);
  const s0 = g[0][0];
  const lead: V3 = [s0[0] - 700, s0[1] + 60, s0[2]];
  const L = penLength(g, lead);
  const { d, tip } = ghostDraw(A, g, L * penT(f, TRACTOR.draw), dashFor(TRACTOR.Z), lead);
  return [{ z: 2840, el: <g key="trg"><GhostPath A={A} d={d} Z={TRACTOR.Z} h={200} /><Tip A={A} at={tip} op={tipOp(f, TRACTOR.draw)} /></g> }];
};

// ---- station 2: the manure man, the sack, the spinner and its fan ------------------------------------------------
const WORLD_OFFSET = worldFrame(0);
/** a periodic Catmull-Rom through keyed points (u 0..1; the last key repeats the first) */
const loopCR = (keys: [number, P2][], u0: number): P2 => {
  const u = frac(u0);
  const K = keys.slice(0, -1);
  const n = K.length;
  let i = 0;
  while (i < n - 1 && u >= K[i + 1][0]) i++;
  const ua = K[i][0];
  const ub = i + 1 < n ? K[i + 1][0] : 1;
  const t = (u - ua) / (ub - ua);
  const p0 = K[(i - 1 + n) % n][1];
  const p1 = K[i][1];
  const p2 = K[(i + 1) % n][1];
  const p3 = K[(i + 2) % n][1];
  const t2 = t * t;
  const t3 = t2 * t;
  const cr = (a: number, b: number, c: number, e: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - e) * t2 + (-a + 3 * b - 3 * c + e) * t3);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
};
const FLING_NEAR: [number, P2][] = [
  [0, [38, -150]],
  [0.2, [34, -156]],
  [0.38, [8, -196]],
  [0.5, [60, -214]],
  [0.6, [126, -176]],
  [0.74, [104, -150]],
  [0.88, [66, -146]],
  [1, [38, -150]],
];
const BASKET_AT: P2 = [28, -98];
const flingPose = (u0: number): FigPose => {
  const u = frac(u0);
  const near = loopCR(FLING_NEAR, u);
  const grip = 0.25 + 0.75 * (smooth((u - 0.06) / 0.12) - smooth((u - (FLING.release - 0.02)) / 0.06));
  const lean = 10 + 9 * Math.exp(-(((u - 0.6) / 0.1) ** 2)) - 3 * Math.exp(-(((u - 0.38) / 0.08) ** 2));
  return {
    ...(RomeFolk.STAND as FigPose),
    yaw: 0.92,
    headYaw: 0.88,
    lean,
    crouch: 10,
    pitch: 8,
    footL: [30, 0],
    footR: [-24, 0],
    armL: { w: near, elbow: [-0.35, 1], fist: grip, hand: -6 },
    armR: { w: [BASKET_AT[0] + 6, BASKET_AT[1] - 36], elbow: [0.35, 1], fist: 0.8, hand: 8 },
    brow: 0.25,
    lids: 0.3,
    mouth: 0,
  };
};
const manureU = (wf: number) => wf / FLING.cyc + MANURE_MAN.ph;
/** the clumps of one fling n (released at u = n + release): their 3D flight and landing */
const clumpsOf = (n: number) => {
  const m = MANURE_MAN;
  const out: { X0: number; h0: number; X1: number; Z1: number; r: number; seed: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const s = n * 13.7 + i * 3.1;
    out.push({ X0: m.X + 128 * FIG_SCALE, h0: 176 * FIG_SCALE, X1: m.X + (170 + 260 * hash(s)) * m.dir, Z1: m.Z - 120 + 260 * hash(s + 1.3), r: 5 + 3 * hash(s + 2.2), seed: s });
  }
  return out;
};
const MANURE = { wet: "#4A3A2B", spot: "#3E3127" };
const manureItems = (A: AirWorld, f: number): FarmItem[] => {
  const m = MANURE_MAN;
  const wf = worldFrame(f);
  const u = manureU(wf);
  const pose = flingPose(u);
  const pa = A.P.at(m.X, m.Z);
  const scale = pa.scale * FIG_SCALE;
  const at = pa.at as P2;
  const fog = A.folkFog(m.Z);
  const tex = 312 * scale * A.k > 46;
  const items: FarmItem[] = [];
  // the basket in front of his belly (held by the far hand), manure heaped in it
  const T = (v: P2): P2 => [v[0], v[1] - 26];
  const basket = [{ d: closedD([T([-27, -26]), T([-14, -38]), T([0, -42]), T([14, -37]), T([27, -26])], 0.9), fill: MANURE.wet }, ...loadArt("basket", T, false)];
  const bAt: P2 = [at[0] + BASKET_AT[0] * scale, at[1] + BASKET_AT[1] * scale];
  const figFog = { to: typeof fog.rgb === "string" ? fog.rgb : "#000", amount: fog.amount };
  const fp = { kind: m.kind, variant: m.variant, pose, at, scale, fog, unitPx: A.k, texture: tex, inks: { tunic: m.tunic as string }, apron: false };
  items.push({
    z: m.Z,
    el: (
      <g key="man">
        <AirShadow A={A} X={m.X + 20} Z={m.Z} w={80} d={34} uid="c20mans" amt={0.7} />
        <RomeFolk.RomeFigure {...fp} uid="c20manA" hideArm="L" />
        <FarmPaint shapes={basket} at={bAt} scale={scale} uid="c20bsk" fog={figFog} unitPx={A.k} />
        <RomeFolk.RomeFigure {...fp} uid="c20manB" onlyArm="L" />
      </g>
    ),
  });
  // the clumps: in flight and landed (every fling since well before the cut, so the furrows ahead are already dotted)
  const nNow = Math.floor(u - FLING.release);
  const P = A.P;
  let dSpots = "";
  const flying: React.ReactNode[] = [];
  for (let n = nNow - 9; n <= nNow; n++) {
    const fRel = (n + FLING.release - MANURE_MAN.ph) * FLING.cyc - WORLD_OFFSET; // our frame of release
    const t = (f - fRel) / FLING.flight;
    if (t < 0) continue;
    for (const c of clumpsOf(n)) {
      if (t < 1) {
        const X = mix(c.X0, c.X1, t);
        const Zc = mix(m.Z, c.Z1, t);
        const h = mix(c.h0, 0, t) + 90 * 4 * t * (1 - t);
        const p = P.p(X, -h, Zc);
        const r = c.r * P.r(Zc);
        flying.push(<ellipse key={`c${c.seed}`} cx={n2(p[0])} cy={n2(p[1])} rx={n2(r * 1.15)} ry={n2(r * 0.9)} fill={A.tone(MANURE.wet, Zc, h)} />);
      } else {
        const p = P.p(c.X1, 0, c.Z1);
        const r = c.r * P.r(c.Z1);
        dSpots += `M${n2(p[0] - r * 1.4)},${n2(p[1])}a${n2(r * 1.4)},${n2(r * 0.4)} 0 1 0 ${n2(r * 2.8)},0a${n2(r * 1.4)},${n2(r * 0.4)} 0 1 0 ${n2(-r * 2.8)},0Z`;
      }
    }
  }
  items.push({ z: m.Z + 300, el: <path key="spots" d={dSpots} fill={A.tone(MANURE.spot, m.Z + 150, 0)} opacity={0.6} /> });
  // in flight behind the ghost sack's plane, so the ghost's line stays whole over them
  items.push({ z: SACK.Z + 20, el: <g key="fly">{flying}</g> });
  return items;
};

const sackGhost = (A: AirWorld, f: number): FarmItem[] => {
  const S = SPINNER;
  const sack = toWorld(sackStrokes(), SACK.X, SACK.Z, 1);
  // the spinner: a post and a flat disc (a circle in the ground plane at its height), drawn by the same pen
  const disc: V3[] = Array.from({ length: 29 }, (_, i) => {
    const a = (i / 28) * 2 * Math.PI + Math.PI;
    return [S.X + S.r * Math.cos(a), S.h, S.Z + S.r * Math.sin(a)];
  });
  const g: Ghost3 = [...sack, [[S.X, 0, S.Z], [S.X, S.h, S.Z]], disc];
  const s0 = g[0][0];
  const lead: V3 = [s0[0] + 760, s0[1] + 80, s0[2]];
  const L = penLength(g, lead);
  const { d, tip } = ghostDraw(A, g, L * penT(f, SACK.draw), dashFor(SACK.Z), lead);
  // the fan: granules streaming out along each ray once the sweep has opened it
  const P = A.P;
  let dg = "";
  for (let r = 0; r < FAN.rays; r++) {
    const s = r / (FAN.rays - 1);
    const open = S.open[0] + s * (S.open[1] - S.open[0]);
    if (f < open) continue;
    const phi = ((FAN.phi0 + s * (FAN.phi1 - FAN.phi0)) * Math.PI) / 180;
    const dx = Math.cos(phi);
    const dz = Math.sin(phi);
    const R = FAN.R * (0.88 + 0.24 * hash(r * 7.7));
    const pos = (t: number): V3 => [S.X + dx * (S.r + R * t), S.h * (1 - t) + FAN.apex * 4 * t * (1 - t), S.Z + dz * (S.r + R * t)];
    const age = (f - open) * FAN.speed;
    for (let k = 0; k < FAN.perRay; k++) {
      const t = frac(k / FAN.perRay + age + hash(r * 3.3) * 0.13);
      // the spray's front bursts out to the landing within 6 frames of the ray opening, then the granules stream
      if (t > c01((f - open) / 6)) continue;
      const a = pos(t);
      const b = pos(Math.min(1, t + 0.022));
      const pa = P.p(a[0], -a[1], a[2]);
      const pb = P.p(b[0], -b[1], b[2]);
      dg += `M${n2(pa[0])},${n2(pa[1])}L${n2(pb[0])},${n2(pb[1])}`;
    }
  }
  return [
    {
      z: SACK.Z - 1,
      el: (
        <g key="sack">
          <GhostPath A={A} d={dg} Z={S.Z + 250} h={60} px={6.5} />
          <GhostPath A={A} d={d} Z={SACK.Z} h={100} />
          <Tip A={A} at={tip} op={tipOp(f, SACK.draw)} />
        </g>
      ),
    },
  ];
};

// ---- station 3: the modern wheat ----------------------------------------------------------------------------------
const WHEAT_STALK_PX = 2.1;
const WHEAT_EAR_PX = 3.6;
/** a dashed polyline (3D) drawn up to `upto` (0..1) of its length; dashes in world units */
const dashPolyline = (P: AirWorld["P"], pts: V3[], dash: [number, number], upto = 1) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + segLen(pts[i - 1], pts[i]));
  const L = cum[cum.length - 1] * upto;
  const at = (s: number): V3 => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const t = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return [mix(pts[i - 1][0], pts[i][0], t), mix(pts[i - 1][1], pts[i][1], t), mix(pts[i - 1][2], pts[i][2], t)];
  };
  const pr = (v: V3) => P.p(v[0], -v[1], v[2]);
  let d = "";
  for (let s0 = 0; s0 < L; s0 += dash[0] + dash[1]) {
    const s1 = Math.min(L, s0 + dash[0]);
    const q: [number, number][] = [pr(at(s0)) as [number, number]];
    for (let i = 1; i < cum.length - 1; i++) if (cum[i] > s0 && cum[i] < s1) q.push(pr(pts[i]) as [number, number]);
    q.push(pr(at(s1)) as [number, number]);
    d += `M${q.map((v) => `${n2(v[0])},${n2(v[1])}`).join("L")}`;
  }
  return d;
};
const wheatGhost = (A: AirWorld, f: number): FarmItem[] => {
  const W = MODERN_WHEAT;
  const P = A.P;
  const pr = (X: number, h: number, Z: number) => P.p(X, -h, Z);
  const items: FarmItem[] = [];
  const [s0, s1] = W.sweep;
  // the pen: glides in from off the left (lead) along the canopy, reaches x0 at s0 + 6, sweeps to x1 by s1 - grow
  const tA = s0 + 6;
  const tB = s1 - W.grow;
  const tipX = f < tA ? mix(W.x0 - W.lead, W.x0, c01((f - s0) / 6)) : mix(W.x0, W.x1, c01((f - tA) / (tB - tA)));
  W.rows.forEach((Z, ri) => {
    const sDash = dashFor(Z, WHEAT_STALK_PX);
    const eDash: [number, number] = [dashFor(Z, WHEAT_EAR_PX)[0] * 0.8, dashFor(Z, WHEAT_EAR_PX)[1] * 1.1];
    let d = "";
    let dEar = "";
    for (let X0 = W.x0 + (ri % 2) * W.step * 0.5; X0 <= W.x1; X0 += W.step) {
      const ta = tA + ((X0 - W.x0) / (W.x1 - W.x0)) * (tB - tA);
      const g = c01((f - ta) / W.grow);
      if (g <= 0) continue;
      for (const pair of [-4, 5]) {
        const x = X0 + pair;
        const H = W.h * (1 + 0.04 * (pair > 0 ? 1 : -1));
        const lean = 6;
        // the stalk, grown bottom-up, dashed from the ground
        const top = H * smooth(Math.min(1, g / 0.7));
        for (let s = 0; s < top; s += sDash[0] + sDash[1]) {
          const e = Math.min(top, s + sDash[0]);
          const a = pr(x + (lean * s) / H, s, Z);
          const b = pr(x + (lean * e) / H, e, Z);
          d += `M${n2(a[0])},${n2(a[1])}L${n2(b[0])},${n2(b[1])}`;
        }
        // the heavy ear: a plump spindle OUTLINE (dashed, no fill) leaning forward and nodding, drawn round from its foot
        const eg = c01((g - 0.65) / 0.35);
        if (eg > 0) {
          const bx = x + lean;
          const axis = (t: number): [number, number] => [bx + W.ear * (0.5 * t + 0.12 * t * t), H + W.ear * (0.86 * t - 0.2 * t * t)];
          const ring: V3[] = [];
          const N = 14;
          for (let i = 0; i <= N; i++) {
            // up one side and back down the other: t 0 -> 1 -> 0, offset +w then -w
            const side = i <= N / 2 ? 1 : -1;
            const t = side > 0 ? (2 * i) / N : 2 - (2 * i) / N;
            const [ax, ah] = axis(t);
            const ww = W.earW * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.75) * side;
            // the outline's width lies across the ear's axis (the axis leans ~30 deg forward)
            ring.push([ax - ww * 0.86, ah + ww * 0.5, Z]);
          }
          dEar += dashPolyline(P, ring, eDash, eg);
        }
      }
    }
    items.push({
      z: Z - 1,
      el: (
        <g key={`mw${ri}`}>
          <GhostPath A={A} d={d} Z={Z} h={60} px={strokePx(A, Z, WHEAT_STALK_PX)} glow={0.03} />
          <GhostPath A={A} d={dEar} Z={Z} h={110} px={strokePx(A, Z, WHEAT_EAR_PX)} glow={0.05} />
        </g>
      ),
    });
  });
  const op = tipOp(f, [s0, s1]);
  if (op > 0) {
    const p = pr(tipX + 20, W.h + W.ear * 0.4, W.rows[0]);
    items.push({ z: W.rows[0] - 2, el: <Tip key="mwtip" A={A} at={p as P2} op={op} /> });
  }
  return items;
};

// ---- station 4: the Roman harvest and the modern heap ------------------------------------------------------------
/** grain marks on the ghost heap's face: [u across (-1..1), v up its local height (0..1), angle deg] */
const GRAIN_MARKS: [number, number, number][] = [
  [0.62, 0.3, 28],
  [0.3, 0.55, 18],
  [0.0, 0.78, 6],
  [-0.32, 0.5, -16],
  [-0.6, 0.28, -26],
  [0.12, 0.3, 12],
  [-0.15, 0.22, -10],
];
const heapItems = (A: AirWorld, f: number): FarmItem[] => {
  const H = BIG_HEAP;
  const mound: V3[] = bigHeapMound().map(([x, y]): V3 => [H.X + x, -y, H.Z]);
  // the near base arc on the ground (right foot -> toward us -> left foot), then the mound back over the top
  const base: V3[] = Array.from({ length: 25 }, (_, i) => {
    const a = (i / 24) * Math.PI;
    return [H.X + H.w * Math.cos(a), 0, H.Z - H.w * 0.28 * Math.sin(a)];
  });
  // a few short grain / ear-tip strokes over its front face (same bold dash), so it reads as a heap of grain
  const prof = (u: number) => H.h * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 1.6)), 1.1);
  const grains: V3[][] = GRAIN_MARKS.map(([u, v, ang]) => {
    const x = H.X + u * H.w;
    const hh = v * prof(u);
    const L = 30;
    const dx = Math.cos((ang * Math.PI) / 180) * L * 0.5;
    const dy = Math.sin((ang * Math.PI) / 180) * L * 0.5;
    return [
      [x - dx, hh - dy, H.Z - 4],
      [x + dx, hh + dy, H.Z - 4],
    ];
  });
  const g: Ghost3 = [base, [...mound].reverse(), ...grains];
  const lead: V3 = [H.X + H.w + 640, 120, H.Z];
  const L = penLength(g, lead);
  const { d, tip } = ghostDraw(A, g, L * penT(f, H.draw), dashFor(H.Z), lead);
  const R = ROMAN_HEAP;
  return [
    { z: H.Z - 1, el: <g key="bigheap"><GhostPath A={A} d={d} Z={H.Z} h={160} /><Tip A={A} at={tip} op={tipOp(f, H.draw)} /></g> },
    {
      z: R.Z,
      el: (
        <g key="rheap">
          <AirShadow A={A} X={R.X + 20} Z={R.Z} w={R.w * 1.5} d={46} uid="c20rhs" amt={0.6} />
          <GrainHeap A={A} X={R.X} Z={R.Z} w={R.w} h={R.h} uid="c20rh" />
        </g>
      ),
    },
    { z: LAST_REAPER.Z, el: <FarmerFig key="lastr" A={A} f={LAST_REAPER} frame={worldFrame(f)} /> },
  ];
};

// ---- B3 with a reaped clearing at its right (the world's B3 wheat is hidden and redrawn here without it) ---------
/** the clearing's near edge is ragged toward us (a reaper's edge), so the stubble ground's soft edge stays hidden */
const inReaped = (X: number, Z: number) => Z > REAPED.z0 - 110 * hash(Math.round(X / 40)) && Z < REAPED.z1 && X > REAPED.x0 + REAPED.slope * (Z - 2000) && X < REAPED.x1;
const B3_SLICES: { z: number; tufts: Tuft[] }[] = (() => {
  const bins = new Map<number, Tuft[]>();
  for (const t of TUFTS.B3) {
    if (inReaped(t.X, t.Z)) continue;
    // a little less density in the nearest rows, so the near wheat does not wall the foot of the frame
    if (t.Z < 2580 && hash(t.X * 0.7 + t.Z * 0.31) < 0.38) continue;
    // the very nearest tufts (huge, mostly below the frame) would rush past in the moves: left out
    if (t.Z < 2500) continue;
    const b = Math.floor((t.Z - 2000) / 60);
    const arr = bins.get(b) ?? [];
    arr.push(t);
    bins.set(b, arr);
  }
  return [...bins.entries()].map(([b, tufts]) => ({ z: 2000 + (b + 0.5) * 60, tufts }));
})();
/** the stubble left in the clearing: short cut stalks on a jittered grid */
const STUBBLE: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let Z = REAPED.z0 - 110; Z < REAPED.z1; Z += 34)
    for (let X = REAPED.x0; X < REAPED.x1; X += 30) {
      const x = X + 22 * hash(X * 0.37 + Z);
      const zz = Z + 20 * hash(Z * 0.91 + X);
      if (inReaped(x, zz)) out.push([x, zz, 10 + 8 * hash(x + zz)]);
    }
  return out;
})();
/** near wheat drawn as real wheat (the world's WheatTufts draws a near ear as one fat stroke, which reads as a cattail
 *  close up): the same stalks, then a slim segmented ear (alternating spikelets along a nodding spine) with fine
 *  straight awns fanning up from it */
const NearWheat: React.FC<{ A: AirWorld; frame: number; tufts: Tuft[]; zMid: number; w?: number }> = ({ A, frame, tufts, zMid, w = 1.15 }) => {
  const P = A.P;
  const r = P.r(zMid);
  const k = A.cam.k;
  const cx0 = A.cam.cx - 560 / k;
  const cx1 = A.cam.cx + 560 / k;
  const cy0 = A.cam.cy - 980 / k;
  const cy1 = A.cam.cy + 980 / k;
  let dS = "";
  let dE = "";
  let dA = "";
  const rw = r * w;
  for (const t of tufts) {
    const b = P.p(t.X, 0, t.Z);
    if (b[0] < cx0 - 60 * rw || b[0] > cx1 + 60 * rw || b[1] < cy0 || b[1] - t.h * r > cy1) continue;
    const sway = windAt(t, frame);
    for (let i = 0; i < t.n; i++) {
      const spread = (i - (t.n - 1) / 2) * 9 * w;
      const hh = t.h * (1 - 0.08 * Math.abs(i - (t.n - 1) / 2));
      const top = P.p(t.X + spread * 1.4 + t.lean * hh + sway, -hh, t.Z);
      const mid = P.p(t.X + spread * 0.5 + (t.lean * hh + sway) * 0.3, -hh * 0.55, t.Z);
      dS += `M${n2(b[0] + spread * 0.25 * r)},${n2(b[1])}Q${n2(mid[0])},${n2(mid[1])} ${n2(top[0])},${n2(top[1])}`;
      // the spine continues the stalk's line and nods a little toward its lean
      const ux0 = top[0] - mid[0];
      const uy0 = top[1] - mid[1];
      const L0 = Math.hypot(ux0, uy0) || 1;
      const ux = ux0 / L0;
      const uy = uy0 / L0;
      const px = -uy;
      const py = ux;
      const nod = (t.lean + sway * 0.01 >= 0 ? 1 : -1) * 0.22;
      const Le = 21 * rw;
      const at = (s: number): [number, number] => {
        const q = s / Le;
        return [top[0] + ux * s + px * nod * q * q * Le, top[1] + uy * s + py * nod * q * q * Le];
      };
      const N = 7;
      for (let j = 0; j < N; j++) {
        const s = ((j + 0.5) / N) * Le;
        const side = j % 2 ? 1 : -1;
        const c = at(s);
        const cxp = c[0] + px * side * 1.5 * rw;
        const cyp = c[1] + py * side * 1.5 * rw;
        const ax = 2.5 * rw;
        const ay = 1.45 * rw;
        const rot = (Math.atan2(uy, ux) * 180) / Math.PI;
        dE += `M${n2(cxp - ux * ax)},${n2(cyp - uy * ax)}a${n2(ax)},${n2(ay)} ${n2(rot)} 1 0 ${n2(2 * ux * ax)},${n2(2 * uy * ax)}a${n2(ax)},${n2(ay)} ${n2(rot)} 1 0 ${n2(-2 * ux * ax)},${n2(-2 * uy * ax)}Z`;
        if (j >= 2) {
          // a fine straight awn from the spikelet's tip, fanning out a little to its side
          const tx = cxp + ux * ax;
          const ty = cyp + uy * ax;
          const fan = side * 0.2;
          const al = (15 + 3 * j) * rw;
          dA += `M${n2(tx)},${n2(ty)}l${n2((ux + px * fan) * al)},${n2((uy + py * fan) * al)}`;
        }
      }
    }
  }
  if (!dS) return null;
  const sw = 1.6 * rw;
  return (
    <g>
      <path d={dS} fill="none" stroke={A.tone(FARM_MAT.stalk, zMid, 60)} strokeWidth={n2(sw)} strokeLinecap="round" />
      <path d={dE} fill={A.tone(FARM_MAT.ear, zMid, 110)} />
      <path d={dA} fill="none" stroke={A.tone(FARM_MAT.earLit, zMid, 120)} strokeWidth={n2(Math.max(0.6 / k, sw * 0.28))} strokeLinecap="round" strokeOpacity={0.8} />
    </g>
  );
};
const b3Items = (A: AirWorld, f: number): FarmItem[] => {
  const P = A.P;
  const zMin = P.zNear + 40;
  const items: FarmItem[] = B3_SLICES.filter((s) => s.z > zMin).map((s) => ({
    z: s.z,
    el: s.z < 3300 ? <NearWheat key={`b3${s.z}`} A={A} frame={worldFrame(f)} tufts={s.tufts} zMid={s.z} /> : <WheatTufts key={`b3${s.z}`} A={A} frame={worldFrame(f)} tufts={s.tufts} zMid={s.z} w={1.15} />,
  }));
  // the clearing's ground in the stubble colour (a gradient by depth fading in from its ragged near edge)
  const z0 = Math.max(REAPED.z0 - 110, zMin);
  const q = [P.p(REAPED.x0 + REAPED.slope * (z0 - 2000), 0, z0), P.p(REAPED.x1, 0, z0), P.p(REAPED.x1, 0, REAPED.z1), P.p(REAPED.x0 + REAPED.slope * (REAPED.z1 - 2000), 0, REAPED.z1)];
  const ya = q[0][1];
  const yb = q[2][1];
  let ds = "";
  for (const [X, Z, h] of STUBBLE) {
    if (Z < zMin) continue;
    const a = P.p(X, 0, Z);
    const b = P.p(X + 2, -h, Z);
    ds += `M${n2(a[0])},${n2(a[1])}L${n2(b[0])},${n2(b[1])}`;
  }
  items.push({
    z: REAPED.z1 + 40,
    el: (
      <g key="reaped">
        <defs>
          <linearGradient id="c20rg" gradientUnits="userSpaceOnUse" x1="0" y1={n2(ya)} x2="0" y2={n2(yb)}>
            <stop offset="0" stopColor={A.tone(FARM_MAT.stubble, z0, 0)} stopOpacity={0} />
            <stop offset={n2(c01((P.p(0, 0, REAPED.z0 + 60)[1] - ya) / (yb - ya)))} stopColor={A.tone(FARM_MAT.stubble, REAPED.z0 + 60, 0)} stopOpacity={1} />
            <stop offset="1" stopColor={A.tone(FARM_MAT.stubble, REAPED.z1, 0)} />
          </linearGradient>
        </defs>
        <path d={`M${q.map((v) => `${n2(v[0])},${n2(v[1])}`).join("L")}Z`} fill="url(#c20rg)" />
        <path d={ds} stroke={A.tone(FARM_MAT.strawDark, 2900, 10)} strokeWidth={n2(1.8 / A.k)} strokeOpacity={0.55} fill="none" />
      </g>
    ),
  });
  return items;
};

// ---- B2's near furrows: clods on the ridges (the ploughed foreground below the first two stations) --------------
const CLODS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let Z = PLOUGH.doneZ0 + 65; Z < PLOUGH.doneZ1; Z += PLOUGH.furrow)
    for (let X = -370; X < 1420; X += 34) {
      const s = X * 0.113 + Z * 0.071;
      if (hash(s) < 0.35) continue;
      out.push([X + 30 * hash(s + 1.7), Z + 40 * (hash(s + 2.9) - 0.5), 4 + 7 * hash(s + 4.1) * hash(s + 5.3)]);
    }
  return out;
})();
const clodItems = (A: AirWorld): FarmItem[] => {
  const P = A.P;
  const zMin = P.zNear + 40;
  const k = A.cam.k;
  const x0 = A.cam.cx - 600 / k;
  const x1 = A.cam.cx + 600 / k;
  let dLo = "";
  let dHi = "";
  for (const [X, Z, r] of CLODS) {
    if (Z < zMin) continue;
    const c = P.p(X, -r * 0.35, Z);
    if (c[0] < x0 || c[0] > x1) continue;
    const s = P.r(Z);
    const rx = r * s * (0.8 + 0.5 * hash(X + Z));
    const ry = r * 0.5 * s;
    dLo += `M${n2(c[0] - rx)},${n2(c[1])}a${n2(rx)},${n2(ry)} 0 1 0 ${n2(2 * rx)},0a${n2(rx)},${n2(ry)} 0 1 0 ${n2(-2 * rx)},0Z`;
    const hx = c[0] - rx * 0.2;
    const hy = c[1] - ry * 0.35;
    dHi += `M${n2(hx - rx * 0.6)},${n2(hy)}a${n2(rx * 0.6)},${n2(ry * 0.5)} 0 1 0 ${n2(1.2 * rx)},0a${n2(rx * 0.6)},${n2(ry * 0.5)} 0 1 0 ${n2(-1.2 * rx)},0Z`;
  }
  return [
    {
      z: PLOUGH.doneZ1 + 5,
      el: (
        <g key="clods">
          <path d={dLo} fill={A.tone(FARM_MAT.soilDark, 2600, 0)} opacity={0.55} />
          <path d={dHi} fill={A.tone("#7C6650", 2600, 10)} opacity={0.7} />
        </g>
      ),
    },
  ];
};

// ===================================================================================================================
// THE STAGE: the farm's AirStage with the bloom on (the ghosts are the only orange), the low air at the foot
// ===================================================================================================================
const Stage: React.FC<{ A: AirWorld; children?: React.ReactNode; lowAir?: number }> = ({ A, children, lowAir = 0.45 }) => (
  <AirStage v={A.v} bloom={0.24}>
    <WorldSvg cam={A.cam}>{children}</WorldSvg>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 1440,
        width: 1080,
        height: 480,
        background: `linear-gradient(to bottom, ${A.screenAir(A.cam.cy + 480 / A.cam.k)}00 0%, ${A.screenAir(A.cam.cy + 900 / A.cam.k)}${Math.round(lowAir * 255)
          .toString(16)
          .padStart(2, "0")} 100%)`,
      }}
    />
  </AirStage>
);

const EYE0: FarmEye = eyeAt(0);

const ModernYieldsMissing: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const eye = eyeAt(camFrame >= 0 ? camFrame : frame);
  const { A } = farmAirOf(eye, EYE0, frame, swayCam);
  const items: FarmItem[] = [...clodItems(A), ...tractorGhost(A, frame), ...manureItems(A, frame), ...sackGhost(A, frame), ...wheatGhost(A, frame), ...heapItems(A, frame), ...b3Items(A, frame)];
  return (
    <Stage A={A}>
      <FarmWorld A={A} frame={worldFrame(frame)} items={items} hide={[...HIDE, "wheat:B3"]} uid="myw" />
    </Stage>
  );
};

export default ModernYieldsMissing;
