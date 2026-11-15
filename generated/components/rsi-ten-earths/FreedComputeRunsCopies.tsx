// ---------------------------------------------------------------------------
// FreedComputeRunsCopies (rsi-ten-earths, cut 71). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 262 frames. World: the shared modules ./tenEarthsHall (RackField, BLOCK_27, powerWave;
// HALL_READY.md) and ./tenEarthsGenius (the Genius; GENIUS_READY.md), read-only; the hand-over from cut 6 is
// ./computeBlockState.ts (layout, lit rack, Genius, END camera, air, pool; BLOCK_READY.md + SHARED_CHANGES.md) and the
// rack-look helpers exported from ./ComputePerAIFalls.tsx (RackPools, RackHalo, BlockTopShade, Threads, FeetPool), all
// imported read-only.
//
// CHECK LINE: "The computers freed up by cheaper AI don't sit idle: they run new copies, so the number of AIs triples
//   every year."
//
// THE LINE: "effectively tripling the population of AIs every single year thanks to software efficiency gains, because
//   the compute that gets freed up thanks to this algorithmic progress can then be used to run more copies. So"
// WORD -> FRAME (from the composition start; Whisper may run ~0.2-0.4 s early): (as -6) · effectively 3 · tripling 17 ·
//   the 33 · population 37 · of 45 · AIs 52 · every 59 · single 66 · year 71 · thanks 78 · to 91 · software 98 ·
//   efficiency 116 · gains, 124 · because 130 · the 139 · compute 143 · that 149 · gets 154 · freed 158 · up 164 ·
//   thanks 169 · to 177 · this 182 · algorithmic 186 · progress 195 · can 200 · then 210 · be 216 · used 219 · to 227 ·
//   run 234 · more 239 · copies. 246 · So 256 · (if 262)
// DURATION: the slot 71.5715 -> 82.4991 s = 10.928 s x 23.976 = 262 frames (f0..f261).
//
// THE MOTION: f0 is cut 6's last frame exactly (f141: one orange Genius before BLOCK_27, the centre rack lit and its
//   thread of light running into the pool at his feet, 26 dark racks around; the world clock runs on from 141, so the
//   breath, the twinkle, the pulses and the grain continue). The 2026 plate slides up and out (f1-f13, rising 54 px from rest while it fades). Each freed rack
//   that powers up (the module's top-to-bottom light wave, its halo, wash and glints coming back with it) runs a NEW
//   COPY: a Genius steps out of it sideways (four steps from behind the rack's front edge, then the turn to us) into
//   the slot beside it, his own line of light running over the floor from the rack's foot into a small pool at his
//   feet. "tripling the population" (racks f14, steps f17-f65): the two racks beside the lit one, 1 -> 3. "software
//   efficiency gains" (racks f90-f96, steps f93-f147): the rest of the front row, 3 -> 9. "because the compute that
//   gets freed up" (f135-f175): the camera drifts up and along the block over the 18 still-dark racks of the back
//   rows while a faint cream glint runs across them (free capacity waiting). "can then be used to run more copies"
//   (racks f192-f200, steps f195-f251): the 18 back racks light in one wave and 18 copies step out together, all
//   the same way, 9 -> 27; the camera eases back and up to show the whole block lit and full. Living hold to the end
//   (breathing, twinkling, pulses). No text after the plate leaves.
// CAUSE: every copy starts stepping 3 frames after its rack's light wave starts (the wave passes his height at ~+4);
//   its thread grows from the rack's foot with his feet, so it never runs ahead of him.
// ENTRANCES: no figure fades or scales in. A copy starts wholly hidden behind its rack's front (inside the rack's
//   footprint, at the front plane) and is clipped to the slot between his rack's front edge and the next rack's
//   front edge on every frame, so he appears from behind the edge at full size and full opacity; at rest his leading
//   hand tucks behind the next rack's edge (the 0.6 m slot is narrower than a man with his arms down).
// Orange = the AIs only (COMMON.md): the Geniuses are the only orange things; racks slate, lights, threads cream.
//
// DEPTH: computeBlockState.ts's physical camera (lens F 640, VP on the camera's X) generalised: camera state
//   { Dc (distance to the front plane), H (eye height), cx (eye X), yH (the horizon's screen y) } -> cam + depth.
//   f0 = camAtDc(DC1) exactly (Dc 1250, H 1000, cx 0, yH ~310). Creep in at cut 6's dolly speed easing out by f120;
//   one continuous arc f120-f252 (the drift up and along, then the ease back up and out), every parameter on a
//   Hermite track; the original Genius's feet held at y ~1060 (yH derived), so the payoff frame fills the keep-in box.
//   Interior mood (eyeT 0.17), fog by depth (fogVis 6000), shafts 0.3, bloom 0.22 (cut 6's). Rows Z 0 / 463 / 926; the
//   copies' feet on their row's front plane; the original at (X -167, Z -397).
//
// CHECKS: scripts/clips/rsi-ten-earths/check-freed-compute.ts (every frame: keep-in box and caption bands for every
//   visible face, copy-to-copy overlap, slot clip).
//
// SOURCES: Epoch AI, algorithmic progress in language models (Ho et al. 2024): compute to reach a given performance
//   halves ~every 8 months (~3x per year): the freed compute runs ~3x the copies each year (the speaker's mechanism).
//   No figures on screen; 1 -> 3 -> 9 -> 27 is a picture of tripling, not a census.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirFloor, AirHorizonHazeW, AirShadow, AirStage, WorldSvg, airWorldOf, mixHex, swayCam, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { POSES, breathe, covidRig, lerpPose } from "../kyle-covid/covidFolkBody";
import { Genius, GENIUS_POSES as G, type GeniusPose } from "./tenEarthsGenius";
import { CREAM, RACK, RackField, YearPlate, powerWave, type RackSpec } from "./tenEarthsHall";
import { AIR_FOG_BY, AIR_SCENE, BLOCK_RACKS, DC1, DC_SPEED, EYE_H, END_CAM, END_FRAME, F_LENS, FLOOR, GENIUS, GENIUS_SHADOW, LIT_RACK, PLATE, STAGE, camState, geniusPoseFrame } from "./computeBlockState";
import { BlockTopShade, FeetPool, RackHalo, RackPools, Threads } from "./ComputePerAIFalls";

export const FPS = 24000 / 1001;
export const DURATION = 262;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const sst = (a: number, b: number, v: number) => ss((v - a) / (b - a));
const frac = (v: number) => v - Math.floor(v);
const f2 = (v: number) => v.toFixed(2);

/** the world clock: cut 6's frame numbering continued (breath, twinkle, glints, pulses, motes, grain, sway) */
export const W0 = END_FRAME;
const wclock = (f: number) => f + W0;

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export type CamS = { Dc: number; H: number; cx: number; yH: number };
export type Cam7 = { cam: Cam; depth: DepthOpts; s: CamS; k: number };
export const camOfS = (s: CamS): Cam7 => {
  const k = F_LENS / s.Dc;
  const eyeY = -s.H;
  return { cam: { k, cx: s.cx, cy: eyeY - (s.yH - 960) / k }, depth: { eyeY, dRef: s.Dc, kRef: k, dolly: 0 }, s, k };
};
/** screen point of a world point under a camera state (no sway) */
export const screenOf = (s: CamS, X: number, Y: number, Z: number): [number, number] => {
  const q = F_LENS / (s.Dc + Z);
  return [540 + (X - s.cx) * q, s.yH + (Y + s.H) * q];
};
/** a cubic Hermite track through keys [frame, value, slope per frame]; held outside the keys at the end slopes */
const hermite = (keys: [number, number, number][]) => (f: number) => {
  if (f <= keys[0][0]) return keys[0][1] + keys[0][2] * (f - keys[0][0]);
  const n = keys.length;
  if (f >= keys[n - 1][0]) return keys[n - 1][1] + keys[n - 1][2] * (f - keys[n - 1][0]);
  let i = 0;
  while (f > keys[i + 1][0]) i++;
  const [x0, y0, m0] = keys[i];
  const [x1, y1, m1] = keys[i + 1];
  const h = x1 - x0;
  const t = (f - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
};
/** the dolly: cut 6's creep (DC_SPEED) runs on and eases out; the drift pushes in a little, the ease back pulls out */
const DC_T = hermite([
  [0, DC1, DC_SPEED],
  [100, 1231, -0.08],
  [165, 1262, 1.0],
  [200, 1285, 0.7],
  [232, 1310, 0.9],
  [252, 1322, 0.2],
  [261, 1323, 0.08],
]);
/** the eye's height: held, then one rise from f78 (it takes over from the dolly's creep as that eases out, so the
 *  camera never stalls) through the drift and the ease back */
const H_T = hermite([
  [0, EYE_H, 0],
  [78, EYE_H, 0],
  [165, 1130, 3.4],
  [200, 1240, 3.0],
  [232, 1350, 2.6],
  [252, 1400, 0.6],
  [261, 1403, 0.2],
]);
/** the eye's X: the drift along the block (a little to the right) and back to the block's axis on the ease back */
const CX_T = hermite([
  [0, 0, 0],
  [120, 0, 0],
  [165, 22, 0.6],
  [195, 26, -0.15],
  [232, 8, -0.6],
  [252, 0, -0.1],
  [261, 0, 0],
]);
/** the original Genius's feet held at this screen y (cut 6's ~1060.5 at f0): yH follows from it */
const ORIG_FEET_Y0 = END_CAM.yH + (EYE_H * F_LENS) / (DC1 + GENIUS.Z);
const FEET_T = hermite([
  [0, ORIG_FEET_Y0, 0],
  [130, ORIG_FEET_Y0, 0],
  [252, 1052, 0],
  [261, 1052, 0],
]);
export const camS7 = (f: number): CamS => {
  if (f <= 0) return { Dc: END_CAM.Dc, H: EYE_H, cx: 0, yH: END_CAM.yH };
  const Dc = DC_T(f);
  const H = H_T(f);
  const cx = CX_T(f);
  const yH = FEET_T(f) - (H * F_LENS) / (Dc + GENIUS.Z);
  return { Dc, H, cx, yH };
};

// ===================================================================================================================
// THE RACKS: power by frame
// ===================================================================================================================
const WAVE = 8;
/** the frame each freed rack powers up (its light wave starts): id -> frame */
export const ON_AT: Map<number, number> = (() => {
  const m = new Map<number, number>();
  for (const rk of BLOCK_RACKS) {
    const id = rk.id ?? 0;
    if (id === LIT_RACK) continue;
    const row = rk.row ?? 0;
    const col = rk.col ?? 0;
    const d = Math.abs(col - 4);
    if (row === 0) m.set(id, d === 1 ? 14 : d === 2 ? 90 : d === 3 ? 93 : 96);
    else m.set(id, 192 + (row - 1) * 4 + d * 0.9);
  }
  return m;
})();
const powerOf = (id: number, f: number): { power: number; relight: boolean } => {
  const at = ON_AT.get(id);
  if (at === undefined) return { power: 1, relight: false };
  return powerWave(f, at, "on", WAVE);
};
export const racks7 = (f: number): RackSpec[] => BLOCK_RACKS.map((rk) => ({ ...rk, ...powerOf(rk.id ?? 0, f) }));

// ===================================================================================================================
// THE COPIES: a long step-out (the module's stepOut with four steps instead of three), positions, slots
// ===================================================================================================================
const SMILE = 0.22;
/** walk cycles in the step (1.5 = the module's three steps; 1.95 ~ four, ending with the feet together) */
const STEP_CYC = 1.95;
/** frames for the whole step (t 0..1): walking 0..0.8, the turn to us 0.68..1 */
export const STEP_N = 48;
const stepCurve = (u: number) => {
  const w = c01(u / 0.8);
  return { phase: 0.05 + STEP_CYC * w, amt: sst(0, 0.22, w) * (1 - sst(0.72, 1, w)) };
};
/** the long step-out pose (GENIUS_POSES.stepOut's recipe, read from the module, with STEP_CYC cycles) */
export const stepLong = (dir: 1 | -1, t: number): GeniusPose => {
  const u = c01(t);
  const { phase, amt } = stepCurve(u);
  const w = POSES.walk(dir, phase, amt) as GeniusPose;
  const end: GeniusPose = { ...(POSES.turnTo(dir * 0.42) as GeniusPose), mouth: SMILE, footL: [-8 * dir, 0], footR: [7 * dir, -1] };
  const q = lerpPose(w, end, sst(0.68, 1, u)) as GeniusPose;
  const lift = 13 * Math.sin(Math.PI * sst(0.7, 0.97, u));
  const headYaw = q.headYaw - dir * 0.18 * sst(0.55, 0.95, u);
  if (dir === 1) return { ...q, mouth: SMILE, headYaw, footL: [q.footL[0], q.footL[1] - lift] };
  return { ...q, mouth: SMILE, headYaw, footR: [q.footR[0], q.footR[1] - lift] };
};
/** the planted-foot shift of the long step (units, dir +1; mirrored for -1), tabulated once */
const SHIFT_SAMPLES = 240;
const SHIFT_TAB: number[] = (() => {
  const ank = (u: number): [number, number] => {
    const { r } = covidRig("officer", 3, stepLong(1, u));
    return [r.legL.A[0], r.legR.A[0]];
  };
  const out = [0];
  let s = 0;
  let prev = ank(0);
  for (let i = 0; i < SHIFT_SAMPLES; i++) {
    const a = i / SHIFT_SAMPLES;
    const b = (i + 1) / SHIFT_SAMPLES;
    const cur = ank(b);
    const lA = frac(stepCurve(a).phase) < 0.5;
    const lB = frac(stepCurve(b).phase) < 0.5;
    if (lA === lB) s -= lA ? cur[0] - prev[0] : cur[1] - prev[1];
    prev = cur;
    out.push(s);
  }
  return out;
})();
export const stepShift = (t: number) => {
  const x = c01(t) * SHIFT_SAMPLES;
  const i = Math.min(SHIFT_SAMPLES - 1, Math.floor(x));
  return SHIFT_TAB[i] + (SHIFT_TAB[i + 1] - SHIFT_TAB[i]) * (x - i);
};
export const STEP_TRAVEL = SHIFT_TAB[SHIFT_SAMPLES];
/** start offset from the rack's centre (against dir): the copy starts wholly behind the rack's 107-unit front */
const START_BACK = 11;
const PITCH = 1.2 * 178;

export type Copy = { id: number; row: number; col: number; Xr: number; Z: number; dir: 1 | -1; Xs: number; Xe: number; t0: number; variant: number; seed: number; xL: number | null; xR: number | null };
const ROW0_VARIANT: Record<number, number> = { 0: 2, 1: 4, 2: 1, 3: 3, 5: 2, 6: 4, 7: 0, 8: 1 };
export const COPIES: Copy[] = BLOCK_RACKS.filter((rk) => rk.id !== LIT_RACK).map((rk) => {
  const id = rk.id ?? 0;
  const row = rk.row ?? 0;
  const col = rk.col ?? 0;
  const dir: 1 | -1 = row === 0 ? (col < 4 ? 1 : -1) : 1;
  const Xs = rk.X - dir * START_BACK;
  const Xe = Xs + dir * STEP_TRAVEL;
  // the slot: between the rack's front edge on his side and the next rack's front edge (null = open)
  const own = dir === 1 ? rk.X + RACK.w / 2 : rk.X - RACK.w / 2;
  const nextCol = col + dir;
  const next = nextCol >= 0 && nextCol <= 8 ? rk.X + dir * PITCH - dir * (RACK.w / 2) : null;
  const xL = dir === 1 ? own : next;
  const xR = dir === 1 ? next : own;
  const variant = row === 0 ? ROW0_VARIANT[col] : (col * 3 + row * 2 + 1) % 5;
  return { id, row, col, Xr: rk.X, Z: rk.Z, dir, Xs, Xe, t0: (ON_AT.get(id) ?? 0) + 3, variant, seed: id * 0.37, xL, xR };
});
const covidClock = (frame: number) => (frame * (30000 / 1001)) / FPS;
export type CopyState = { X: number; t: number; pose: GeniusPose } | null;
export const copyAt = (c: Copy, f: number): CopyState => {
  const t = (f - c.t0) / STEP_N;
  if (t <= 0) return null;
  const X = c.Xs + c.dir * stepShift(t);
  let pose = stepLong(c.dir, t);
  if (t >= 1) {
    // at rest: the step's end pose, breathing in over a second
    const after = (f - c.t0 - STEP_N) / 24;
    pose = breathe(pose, covidClock(wclock(f)), 0.9 * ss(after), c.seed) as GeniusPose;
  }
  return { X, t, pose };
};

// ===================================================================================================================
// DRAWING HELPERS (cut 6's rack look, with the light-up wave: lit = the TOP `power` while relighting)
// ===================================================================================================================
const R_TOP = 14;
const R_BOT = 12;
const R_UH = (RACK.h - R_TOP - R_BOT) / 42;
type Glint = { x: number; y: number; per: number; ph: number };
const GLINTS = new Map<number, Glint[]>();
/** cut 6's glints (same seeds, so the f0 frame matches) */
const glintsOf = (seed: number): Glint[] => {
  const hit = GLINTS.get(seed);
  if (hit) return hit;
  const out: Glint[] = [];
  const rnd = (s: string) => random(`ctGlint-${seed}-${s}`);
  for (let i = 0; i < 6; i++) {
    const u = Math.min(41, Math.floor(1 + i * 6.8 + rnd(`l${i}`) * 4));
    out.push({ x: 12.5, y: R_TOP + (u + 0.5) * R_UH, per: 60 + Math.floor(rnd(`p${i}`) * 140), ph: Math.floor(rnd(`h${i}`) * 200) });
  }
  for (let i = 0; i < 3; i++) {
    const u = Math.min(41, Math.floor(4 + i * 13 + rnd(`r${i}`) * 6));
    out.push({ x: RACK.w - 12.5, y: R_TOP + (u + 0.5) * R_UH, per: 70 + Math.floor(rnd(`q${i}`) * 120), ph: Math.floor(rnd(`g${i}`) * 200) });
  }
  GLINTS.set(seed, out);
  return out;
};
const rectD = (x: number, y: number, w: number, h: number) => `M${f2(x)},${f2(y)}h${f2(w)}v${f2(h)}h${f2(-w)}Z`;
const litAt = (rk: RackSpec, y: number) => {
  const pw = rk.power ?? 1;
  return rk.relight ? y / RACK.h < pw : y / RACK.h >= 1 - pw;
};
const Glints7: React.FC<{ A: AirWorld; racks: RackSpec[]; frame: number }> = ({ A, racks, frame }) => {
  if (!racks.length) return null;
  const Z = racks[0].Z;
  const P = A.P;
  const r = P.r(Z);
  const px = r * A.k;
  const hp = RACK.h * px;
  const alpha = c01((230 - hp) / 80);
  if (alpha <= 0) return null;
  const on = 1 / px;
  const w = Math.max(3.4, 2.5 * on);
  const hh = Math.max(2.4, 2.1 * on);
  const barH = Math.max(1.8, 1.5 * on);
  let bright = "";
  let dim = "";
  let bars = "";
  for (const rk of racks) {
    const pw = rk.power ?? 1;
    if (pw <= 0) continue;
    const tl = P.p(rk.X - RACK.w / 2, -RACK.h, Z);
    const loc = (x: number, y: number, ww: number, h: number) => rectD(tl[0] + x * r, tl[1] + y * r, ww * r, h * r);
    if (litAt(rk, 6.5)) bars += loc(13, 6.5 - barH / 2, RACK.w - 26, barH);
    for (const g of glintsOf(rk.seed)) {
      if (!litAt(rk, g.y)) continue;
      const off = (((Math.floor(frame) + g.ph) % g.per) + g.per) % g.per < 3;
      const d = loc(g.x - w / 2, g.y - hh / 2, w, hh);
      if (off) dim += d;
      else bright += d;
    }
  }
  const col = mixHex(CREAM, A.airHex(Z, RACK.h / 2), 0.45 * A.fog(Z));
  return (
    <g opacity={alpha}>
      {bars ? <path d={bars} fill={col} fillOpacity={0.9} /> : null}
      {bright ? <path d={bright} fill={col} /> : null}
      {dim ? <path d={dim} fill={col} fillOpacity={0.3} /> : null}
    </g>
  );
};
const WASH = 0.16;
const Wash7: React.FC<{ A: AirWorld; racks: RackSpec[] }> = ({ A, racks }) => {
  if (!racks.length) return null;
  const P = A.P;
  const Z = racks[0].Z;
  let d = "";
  for (const rk of racks) {
    const pw = rk.power ?? 1;
    if (pw <= 0.002) continue;
    const yTop = rk.relight ? -RACK.h : -RACK.h * pw;
    const yBot = rk.relight ? -RACK.h * (1 - pw) : 0;
    const a = P.p(rk.X - RACK.w / 2, yTop, Z);
    const b = P.p(rk.X + RACK.w / 2, yBot, Z);
    d += rectD(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  }
  if (!d) return null;
  return <path d={d} fill={CREAM} fillOpacity={WASH * (1 - A.fog(Z))} />;
};

/** THE GLINT OF FREE CAPACITY (f140-f176): a faint cream sheen runs left to right across the still-dark racks of the
 *  back rows: their top rims catch it and a soft band of light passes down their fronts */
export const GLINT_SWEEP = { f0: 136, f1: 178, width: 0.26 };
const sweepAt = (X: number, f: number) => {
  const p = (f - GLINT_SWEEP.f0) / (GLINT_SWEEP.f1 - GLINT_SWEEP.f0);
  const x = (X + 1000) / 2000;
  const d = (p * (1 + 2 * GLINT_SWEEP.width) - GLINT_SWEEP.width - x) / GLINT_SWEEP.width;
  return Math.abs(d) >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d);
};
const FreeGlint: React.FC<{ A: AirWorld; racks: RackSpec[]; frame: number }> = ({ A, racks, frame }) => {
  if (!racks.length || frame < GLINT_SWEEP.f0 || frame > GLINT_SWEEP.f1) return null;
  const P = A.P;
  const Z = racks[0].Z;
  const fz = A.fog(Z);
  const out: React.ReactNode[] = [];
  for (const rk of racks) {
    if ((rk.power ?? 1) > 0.02) continue;
    const g = sweepAt(rk.X, frame);
    if (g <= 0.01) continue;
    const a = P.p(rk.X - RACK.w / 2, -RACK.h, Z);
    const b = P.p(rk.X + RACK.w / 2, 0, Z);
    const t1 = P.p(rk.X - RACK.w / 2, -RACK.h, Z + RACK.d);
    const t2 = P.p(rk.X + RACK.w / 2, -RACK.h, Z + RACK.d);
    out.push(
      <g key={rk.id}>
        <path d={`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(a[1])}L${f2(t2[0])},${f2(t2[1])}L${f2(t1[0])},${f2(t1[1])}Z`} fill={CREAM} fillOpacity={0.34 * g * (1 - 0.4 * fz)} />
        <path d={rectD(a[0], a[1], b[0] - a[0], (b[1] - a[1]) * 0.55)} fill={CREAM} fillOpacity={0.15 * g * (1 - 0.4 * fz)} />
        <path d={`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(a[1])}`} stroke={CREAM} strokeWidth={A.lw(2.2)} strokeOpacity={0.95 * g * (1 - 0.4 * fz)} strokeLinecap="round" fill="none" />
      </g>,
    );
  }
  return <g>{out}</g>;
};

// ---- the copies' threads and pools -----------------------------------------------------------------------------------
const COPY_POOL = { rx: 54, rz: 34 };
const THREAD = { core: 3.0, glow: 8.5, coreOpacity: 0.7, glowOpacity: 0.16, pulse: 4.2 };
type Path3 = { a: [number, number]; c: [number, number]; b: [number, number] };
const qPt = (p: Path3, u: number): [number, number] => {
  const v = 1 - u;
  return [v * v * p.a[0] + 2 * v * u * p.c[0] + u * u * p.b[0], v * v * p.a[1] + 2 * v * u * p.c[1] + u * u * p.b[1]];
};
const floorStrip = (A: AirWorld, path: Path3, u0: number, u1: number, w: number) => {
  const n = Math.max(2, Math.ceil((u1 - u0) * 20));
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const p = qPt(path, u);
    const q = qPt(path, Math.min(1, u + 0.01));
    const o = qPt(path, Math.max(0, u - 0.01));
    const dx = q[0] - o[0];
    const dz = q[1] - o[1];
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * w;
    const nz = (dx / len) * w;
    const l = A.P.p(p[0] + nx, 0, p[1] + nz);
    const r = A.P.p(p[0] - nx, 0, p[1] - nz);
    L.push(`${f2(l[0])},${f2(l[1])}`);
    R.push(`${f2(r[0])},${f2(r[1])}`);
  }
  return `M${L.join("L")}L${R.reverse().join("L")}Z`;
};
/** a copy's thread: from his rack's foot (the corner on his side) out in front and round into the pool at his feet;
 *  its far end is his feet now (held at the rack's edge while he is still behind it), so it grows as he steps out */
const copyThread = (c: Copy, X: number): { path: Path3; len: number } => {
  const a: [number, number] = [c.Xr + c.dir * 12, c.Z - 3];
  const edge = c.Xr + c.dir * (RACK.w / 2 + 8);
  const bx = c.dir === 1 ? Math.max(edge, X) : Math.min(edge, X);
  const b: [number, number] = [bx - c.dir * 24, c.Z - 14];
  const len = Math.abs(bx - edge);
  const cpt: [number, number] = [a[0] + (b[0] - a[0]) * 0.45, c.Z - 3 - 16 * c01(len / 40)];
  return { path: { a, c: cpt, b }, len };
};
const PULSE_T = 30;
const PULSE_LEN = 0.22;
const CopyThreads: React.FC<{ A: AirWorld; states: { c: Copy; s: NonNullable<CopyState> }[]; frame: number; fade: number }> = ({ A, states, frame, fade }) => {
  let glow = "";
  let core = "";
  let pulses = "";
  for (const { c, s } of states) {
    const { path, len } = copyThread(c, s.X);
    if (len < 2) continue;
    glow += floorStrip(A, path, 0, 1, THREAD.glow);
    core += floorStrip(A, path, 0, 1, THREAD.core);
    if (s.t >= 1) {
      const ph = random(`fcr-pulse-${c.id}`) * PULSE_T;
      const u1 = (((wclock(frame) + ph) % PULSE_T) + PULSE_T) % PULSE_T / PULSE_T;
      const ua = Math.max(0, u1 - PULSE_LEN);
      if (u1 - ua > 0.01) pulses += floorStrip(A, path, ua, u1, THREAD.pulse);
    }
  }
  if (!core) return null;
  return (
    <g opacity={fade}>
      <path d={glow} fill={CREAM} fillOpacity={THREAD.glowOpacity} />
      <path d={core} fill={CREAM} fillOpacity={THREAD.coreOpacity} />
      {pulses ? <path d={pulses} fill={CREAM} fillOpacity={0.8} /> : null}
    </g>
  );
};
const CopyPools: React.FC<{ A: AirWorld; states: { c: Copy; s: NonNullable<CopyState> }[] }> = ({ A, states }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  for (const { c, s } of states) {
    const st = c01((s.t - 0.25) / 0.5);
    if (st <= 0.002) continue;
    const Zp = c.Z - 10;
    const a = P.p(s.X - COPY_POOL.rx, 0, Zp - COPY_POOL.rz);
    const b = P.p(s.X + COPY_POOL.rx, 0, Zp + COPY_POOL.rz);
    const m = P.p(s.X, 0, Zp);
    els.push(<ellipse key={c.id} cx={f2(m[0])} cy={f2(m[1])} rx={f2(Math.abs(b[0] - a[0]) / 2)} ry={f2(Math.abs(a[1] - b[1]) / 2)} fill="url(#fcr-copypool)" opacity={st * (1 - 0.6 * A.fog(c.Z))} />);
  }
  if (!els.length) return null;
  return (
    <g>
      <defs>
        <radialGradient id="fcr-copypool">
          <stop offset="0" stopColor={CREAM} stopOpacity={0.78} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={0.4} />
          <stop offset="0.85" stopColor={CREAM} stopOpacity={0.07} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
    </g>
  );
};

/** one copy: his contact shadow and figure, clipped to his slot (between the two racks' front edges) */
const CopyFigure: React.FC<{ A: AirWorld; c: Copy; s: NonNullable<CopyState>; frame: number }> = ({ A, c, s, frame }) => {
  const P = A.P;
  const xa = c.xL === null ? -1e5 : P.p(c.xL, 0, c.Z)[0];
  const xb = c.xR === null ? 1e5 : P.p(c.xR, 0, c.Z)[0];
  const g = P.at(s.X, c.Z);
  const uid = `fcr-c${c.id}`;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-clip`}>
          <rect x={f2(xa)} y={-100000} width={f2(xb - xa)} height={200000} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}-clip)`}>
        <AirShadow A={A} X={s.X} Z={c.Z - 2} w={GENIUS_SHADOW.w} d={GENIUS_SHADOW.d} uid={`${uid}-sh`} amt={GENIUS_SHADOW.amt} />
        <Genius variant={c.variant} pose={s.pose} at={g.at} scale={g.scale} uid={uid} frame={wclock(frame)} fog={A.folkFog(c.Z)} unitPx={A.k} />
      </g>
    </g>
  );
};

// ---- the 2026 plate leaves: the type slides up and out while it fades (cut 6's hand-over), its shadow drains ------
const PLATE_OUT = { f0: 1, dur: 12 };
const PlateLeaving: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const t = (frame - PLATE_OUT.f0) / PLATE_OUT.dur;
  if (t >= 1) return null;
  const P = A.P;
  const s2 = PLATE.size * P.r(PLATE.Z);
  const c = P.p(PLATE.X, PLATE.Y, PLATE.Z);
  const tw = 4 * 0.62 * s2;
  const tt = c01(t);
  // a real slide up and out: 54 screen px from rest (world px = screen px / k), most of it seen before the fade takes it
  const op = 1 - ss((tt - 0.35) / 0.65);
  const lift = -(54 / A.k) * ss(tt);
  return (
    <g>
      <g opacity={1 - ss(tt)}>
        <defs>
          <radialGradient id="cpf-plate-g">
            <stop offset="0" stopColor={AIR.A.shadow} stopOpacity={0.34} />
            <stop offset="0.6" stopColor={AIR.A.shadow} stopOpacity={0.23} />
            <stop offset="1" stopColor={AIR.A.shadow} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={c[0]} cy={c[1]} rx={tw * 0.72 + s2 * 0.75} ry={s2 * 0.92} fill="url(#cpf-plate-g)" />
      </g>
      {op > 0.001 ? (
        <g opacity={op} transform={`translate(0 ${lift.toFixed(3)})`}>
          <YearPlate A={A} X={PLATE.X} Y={PLATE.Y} Z={PLATE.Z} text="2026" t={1} uid="cpf-yp3" size={PLATE.size} plate={0} />
        </g>
      ) : null}
    </g>
  );
};

/** the threads go quiet once the block is full (a hint of light; the pools stay) */
export const THREAD_QUIET = { f0: 250, f1: 261, to: 0.35 };

const FreedComputeRunsCopies: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const wf = wclock(frame);
  const C = camOfS(camS7(frame));
  const cam = swayCam(C.cam, wf);
  const rest = swayCam(camState(0).cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame: wf, scene: AIR_SCENE, fogBy: AIR_FOG_BY });
  const racks = racks7(frame);
  const rowMap = new Map<number, RackSpec[]>();
  for (const rk of racks) {
    const key = Math.round(rk.Z * 100);
    const a = rowMap.get(key);
    if (a) a.push(rk);
    else rowMap.set(key, [rk]);
  }
  const rows = [...rowMap.entries()].sort((a, b) => b[0] - a[0]);
  const states = COPIES.map((c) => ({ c, s: copyAt(c, frame) })).filter((q): q is { c: Copy; s: NonNullable<CopyState> } => q.s !== null);
  const g = A.P.at(GENIUS.X, GENIUS.Z);
  const lit = racks.find((rk) => rk.id === LIT_RACK) as RackSpec;
  const quiet = 1 - (1 - THREAD_QUIET.to) * sst(THREAD_QUIET.f0, THREAD_QUIET.f1, frame);
  return (
    <AirStage v={A.v} bloom={STAGE.bloom} shafts={STAGE.shafts}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={FLOOR.x0} x1={FLOOR.x1} z0={FLOOR.z0} z1={FLOOR.z1} mat={FLOOR.mat} course={FLOOR.tile} plank={FLOOR.tile} jointAmt={FLOOR.jointAmt} melt={FLOOR.melt} />
        <AirHorizonHazeW A={A} id="cpf-haze" />
        <RackPools A={A} racks={racks} uid="cpf" />
        <g opacity={quiet}>
          <Threads A={A} racks={[lit]} frame={wf} />
        </g>
        <CopyThreads A={A} states={states} frame={frame} fade={quiet} />
        <CopyPools A={A} states={states} />
        {rows.map(([key, rr]) => (
          <React.Fragment key={key}>
            <RackHalo A={A} racks={rr} uid={`cpfh${key}`} />
            <RackField A={A} racks={rr} frame={wf} uid={`cpf${key}`} lod="hero" cull={false} />
            <Wash7 A={A} racks={rr} />
            <BlockTopShade A={A} racks={rr} />
            <Glints7 A={A} racks={rr} frame={wf} />
            <FreeGlint A={A} racks={rr} frame={frame} />
            {states
              .filter((q) => Math.round(q.c.Z * 100) === key)
              .map((q) => (
                <CopyFigure key={q.c.id} A={A} c={q.c} s={q.s} frame={frame} />
              ))}
          </React.Fragment>
        ))}
        <PlateLeaving A={A} frame={frame} />
        <AirShadow A={A} X={GENIUS.X} Z={GENIUS.Z} w={GENIUS_SHADOW.w} d={GENIUS_SHADOW.d} uid="cpf-gs" amt={GENIUS_SHADOW.amt} />
        <FeetPool A={A} racks={[lit]} frame={wf} />
        <Genius variant={GENIUS.variant} pose={G.stand(GENIUS.dir, geniusPoseFrame(wf))} at={g.at} scale={g.scale} uid="cpf-g" frame={wf} fog={A.folkFog(GENIUS.Z)} unitPx={cam.k} />
      </WorldSvg>
    </AirStage>
  );
};

export default FreedComputeRunsCopies;
