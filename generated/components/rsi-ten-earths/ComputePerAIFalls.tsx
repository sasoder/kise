// ---------------------------------------------------------------------------
// ComputePerAIFalls (rsi-ten-earths, cut 64). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 142 frames. World: the shared modules ./tenEarthsHall (Rack / RackField, BLOCK_27,
// BLOCK_27_DARK_ORDER, powerWave, YearPlate; HALL_READY.md) and ./tenEarthsGenius (the Genius, stand; GENIUS_READY.md),
// both read-only. The hand-over to cut 7 lives in ./computeBlockState.ts (layout, lit rack, Genius, END camera, air).
// The rack look is cut 3's (ComputeTriples, approved): interior air, fog by depth, the sand floor one step lighter,
// no walls (the floor melts into the haze), rack tops veiled to the rack's dark tone, crisp cream glints.
//
// CHECK LINE: "Every year the same AI needs a third of the computers it needed the year before: 27 racks, then 9,
//   then 3, then 1."
//
// THE LINE: "compute that it takes, takes to run an AI at a given level of capability has fallen by more than 3x
//   every single year. You"
// WORD -> FRAME (from the composition start; Whisper may run ~0.2-0.4 s early): the -3 · compute 0 · that 7 · it 12 ·
//   takes, 14 · takes 17 · to 22 · run 24 · an 32 · AI 36 · at 41 · a 49 · given 52 · level 56 · of 61 ·
//   capability 64 · has 69 · fallen 82 · by 91 · more 95 · than 99 · 3x 102 · every 114 · single 125 · year. 132 ·
//   (You 137)
// DURATION: the slot 64.6479 -> 70.5705 s = 5.923 s x 23.976 = 142 frames (f0..f141).
//
// THE MOTION: one orange Genius stands at work in front of a block of 27 lit racks (BLOCK_27, 9 x 3), a little left of
//   the block's centre rack; on "compute that it takes, takes to run" (f0-f22) a line of cream light runs over the
//   floor from the foot of every lit rack into a soft cream pool on the floor at his feet (floor-plane strips: a core
//   and a soft glow edge; the racks near him curve out and in so no line leans on his legs), and small pulses keep
//   running along them toward him: these racks are what it takes to run him. The pool's strength follows the number
//   of lit threads. The year plate on the floor at his right steps the years, and each step CAUSES a drop: the plate
//   turns over first, then the racks' lights run off top to bottom (the module's power wave: the body sinks a step
//   into the air, its halo and wash go with its power) and their threads retract into the racks:
//     2023 -> 2024  plate f70-f80, "has fallen": the two back rows go dark (18 racks, a wave f72-f89, back row first,
//                   outside in): 27 -> 9, the whole front row left lit;
//     2024 -> 2025  plate f94-f104, "by more than 3x": the front row's outer six (wave f96-f109): 9 -> 3;
//     2025 -> 2026  plate f116-f126, "every single year": the two beside the centre (wave f118-f128): 3 -> 1.
//   The Genius never changes (same size, same breath). The camera is a slow straight dolly in (front row 6 % larger),
//   growing about the floor between the block and the Genius. Living hold f128-f141: the one lit rack twinkles, its
//   one thread pulses, 26 dark racks stay in shot around it (freed; cut 7 lights them again).
// CAUSE: each drop's plate swap starts 2 frames before its first rack's wave (the new year arrives, then the racks go
//   dark); a thread's retraction starts on its rack's wave frame.
// Orange = the AIs only (COMMON.md): the Genius is the one orange thing; racks slate, lights, threads and type cream.
//
// DEPTH: computeBlockState.ts: a physical camera, lens F 640, eye 5.6 m up (EYE_H 1000) so the three rows read as
//   three rows, the VP on the block's axis; a pure dolly Dc 1325 -> 1250 (linear), the floor point (0, 0, -150) held at
//   screen y 892. Block front row Z 0 (x ~101-979 at f0, ~75-1005 at f141; feet y ~826), rows at Z 463 / 926. The
//   Genius at (X -167, Z -397): feet ~(425, 1037) -> (415, 1060), 215 -> 234 px tall; the lit rack (4, front centre,
//   x 513-567) stands whole beside him. The plate at (399, -35, -355), type ~80-84 px, centre ~(803, 984) -> (825, 1000), under the
//   threads' fan. Interior mood (eyeT 0.17), fog by depth (fogVis 6000), shafts 0.3, bloom 0.22.
//   SCALE CHEAT: none (true perspective: he stands 2.2 m in front of the racks, so he draws larger than a 2 m rack).
//
// CHECKS: scripts/clips/rsi-ten-earths/check-compute-per-ai-falls.ts (every frame: keep-in box, Genius head / feet,
//   plate box, thread-to-plate clearance >= 9 px outside a 6 px padded glyph box).
//
// SOURCES: Epoch AI, algorithmic progress in language models (Ho et al. 2024): the compute needed to reach a given
//   performance halves ~every 8 months (~3x per year), and Epoch's inference price per capability trend; the speaker:
//   "fallen by more than 3x every single year". On screen only the years 2023-2026 (three drops to Nov 2026); the rack
//   counts (27, 9, 3, 1) are a picture of a third per year, not a census.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirFloor, AirHorizonHazeW, AirShadow, AirStage, WorldSvg, airWorldOf, mixHex, swayCam, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Genius, GENIUS_POSES as G } from "./tenEarthsGenius";
import { BLOCK_27_DARK_ORDER, CREAM, MAT_RACK, RACK, RackField, YearPlate, powerWave, type RackSpec } from "./tenEarthsHall";
import {
  AIR_FOG_BY,
  AIR_SCENE,
  BLOCK_RACKS,
  FLOOR,
  GENIUS,
  GENIUS_SHADOW,
  PLATE,
  PLATE_YEARS,
  STAGE,
  POOL,
  THREAD_STRIP,
  camState,
  geniusPoseFrame,
  poolStrength,
  threadPathPool,
  threadPointPool,
} from "./computeBlockState";

export const FPS = 24000 / 1001;
export const DURATION = 142;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const easeOut2 = (t: number) => 1 - Math.pow(1 - c01(t), 2);
const easeOut3 = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const f2 = (v: number) => v.toFixed(2);

// ---- the drops ------------------------------------------------------------------------------------------------------
/** each drop: the racks (from BLOCK_27_DARK_ORDER), the first wave frame, the stagger between racks, and the plate swap */
export const DROPS = [
  { ids: BLOCK_27_DARK_ORDER.slice(0, 18), f0: 72, lag: 9.6 / 17, swap: 70 },
  { ids: BLOCK_27_DARK_ORDER.slice(18, 24), f0: 96, lag: 1, swap: 94 },
  { ids: BLOCK_27_DARK_ORDER.slice(24, 26), f0: 118, lag: 1.5, swap: 116 },
];
const WAVE_DUR = 8;
/** id -> the frame its power wave starts */
export const OFF_AT: Map<number, number> = (() => {
  const m = new Map<number, number>();
  DROPS.forEach((d) => d.ids.forEach((id, i) => m.set(id, d.f0 + i * d.lag)));
  return m;
})();
const powerOf = (id: number, f: number) => {
  const at = OFF_AT.get(id);
  return at === undefined ? 1 : powerWave(f, at, "off", WAVE_DUR).power;
};

// ---- the glints (cut 3's): crisp cream lights that survive at small sizes, cut off by the power wave --------------
const R_TOP = 14;
const R_BOT = 12;
const R_UH = (RACK.h - R_TOP - R_BOT) / 42;
type Glint = { x: number; y: number; per: number; ph: number };
const GLINTS = new Map<number, Glint[]>();
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
/** the glint layer of one depth row (after its RackField). A light is on while it sits in the lit (lower) part of a
 *  rack going dark: the module's own rule (lit = the bottom `power` of the front), so glints and lights cut together. */
export const BlockGlints: React.FC<{ A: AirWorld; racks: RackSpec[]; frame: number }> = ({ A, racks, frame }) => {
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
    const lit = (y: number) => y / RACK.h >= 1 - pw;
    const tl = P.p(rk.X - RACK.w / 2, -RACK.h, Z);
    const loc = (x: number, y: number, ww: number, h: number) => rectD(tl[0] + x * r, tl[1] + y * r, ww * r, h * r);
    if (lit(6.5)) bars += loc(13, 6.5 - barH / 2, RACK.w - 26, barH);
    for (const g of glintsOf(rk.seed)) {
      if (!lit(g.y)) continue;
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

// ---- the top shade (cut 3's): the rack tops veiled toward the rack's dark tone, the cream rim on the top's front ----
const TOP_SHADE = 0.55;
export const BlockTopShade: React.FC<{ A: AirWorld; racks: RackSpec[] }> = ({ A, racks }) => {
  if (!racks.length) return null;
  const P = A.P;
  if (!(-RACK.h > P.horizonY)) return null;
  const Z = racks[0].Z;
  const Z1 = Z + RACK.d;
  let tops = "";
  let rims = "";
  let rimsDark = "";
  const pt = (v: [number, number]) => `${f2(v[0])},${f2(v[1])}`;
  for (const rk of racks) {
    const x0 = rk.X - RACK.w / 2;
    const x1 = rk.X + RACK.w / 2;
    tops += `M${pt(P.p(x0, -RACK.h, Z))}L${pt(P.p(x1, -RACK.h, Z))}L${pt(P.p(x1, -RACK.h, Z1))}L${pt(P.p(x0, -RACK.h, Z1))}Z`;
    const rim = `M${pt(P.p(x0, -RACK.h, Z))}L${pt(P.p(x1, -RACK.h, Z))}`;
    if ((rk.power ?? 1) > 0.5) rims += rim;
    else rimsDark += rim;
  }
  const fz = A.fog(Z);
  return (
    <g>
      <path d={tops} fill={A.tone(MAT_RACK.dark, Z, RACK.h)} fillOpacity={TOP_SHADE} />
      <path d={rims} fill="none" stroke={CREAM} strokeWidth={A.lw(1.3)} strokeOpacity={0.55 * (1 - fz)} strokeLinecap="round" />
      {rimsDark ? <path d={rimsDark} fill="none" stroke={CREAM} strokeWidth={A.lw(1.3)} strokeOpacity={0.3 * (1 - fz)} strokeLinecap="round" /> : null}
    </g>
  );
};

// ---- the light pools: each lit rack's own faint cream light on the floor in front of it, dimming with its power ----
export const RackPools: React.FC<{ A: AirWorld; racks: RackSpec[]; uid: string }> = ({ A, racks, uid }) => {
  const P = A.P;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-pool`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.15} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={0.06} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      {racks.map((rk) => {
        const pw = rk.power ?? 1;
        if (pw <= 0.002) return null;
        const a = P.p(rk.X - 150, 0, rk.Z - 260);
        const b = P.p(rk.X + 150, 0, rk.Z + 40);
        return <ellipse key={rk.id} cx={f2((a[0] + b[0]) / 2)} cy={f2((a[1] + b[1]) / 2)} rx={f2(Math.abs(b[0] - a[0]) / 2)} ry={f2(Math.abs(a[1] - b[1]) / 2)} fill={`url(#${uid}-pool)`} opacity={pw} />;
      })}
    </g>
  );
};

// ---- the glow: a lit rack's light in the air around it (halo behind the row, seen in the gaps and over its top) and
// a faint cream wash on the lit part of its front; both follow the power, so a dark rack keeps neither -------------
export const GLOW = { halo: 1, wash: 0.16 };
export const RackHalo: React.FC<{ A: AirWorld; racks: RackSpec[]; uid: string }> = ({ A, racks, uid }) => {
  if (!racks.length) return null;
  const P = A.P;
  const Z = racks[0].Z;
  const r = P.r(Z);
  const fz = A.fog(Z);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-halo`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={CREAM} stopOpacity={0.22} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      {racks.map((rk) => {
        const pw = rk.power ?? 1;
        if (pw <= 0.002) return null;
        const c = P.p(rk.X, -RACK.h * 0.55, Z + RACK.d * 0.4);
        return <ellipse key={rk.id} cx={f2(c[0])} cy={f2(c[1])} rx={f2(RACK.w * 1.6 * r)} ry={f2(RACK.h * 0.85 * r)} fill={`url(#${uid}-halo)`} opacity={GLOW.halo * pw * (1 - 0.5 * fz)} />;
      })}
    </g>
  );
};
export const RackWash: React.FC<{ A: AirWorld; racks: RackSpec[] }> = ({ A, racks }) => {
  if (!racks.length) return null;
  const P = A.P;
  const Z = racks[0].Z;
  let d = "";
  for (const rk of racks) {
    const pw = rk.power ?? 1;
    if (pw <= 0.002) continue;
    const a = P.p(rk.X - RACK.w / 2, -RACK.h * pw, Z);
    const b = P.p(rk.X + RACK.w / 2, 0, Z);
    d += rectD(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  }
  if (!d) return null;
  return <path d={d} fill={CREAM} fillOpacity={GLOW.wash * (1 - A.fog(Z))} />;
};

// ---- the threads: cream lines on the floor from each lit rack's foot to the Genius's feet --------------------------
/** the draw-on (f0-f22, "compute that it takes, takes to run"): front row first, centre out; 0..1 of the length */
export const threadDraw = (rk: RackSpec, f: number) => {
  const row = rk.row ?? 0;
  const col = rk.col ?? 0;
  const u = (f + 7 - row * 2.2 - Math.abs(col - 4) * 0.6) / 20;
  return easeOut2(u);
};
/** the retraction: the head runs back into the rack over 12 frames from its wave */
const RETRACT = 12;
export const threadHead = (rk: RackSpec, f: number) => {
  const at = OFF_AT.get(rk.id ?? 0);
  const back = at === undefined ? 0 : ss((f - at) / RETRACT);
  return threadDraw(rk, f) * (1 - back);
};
const PULSE_T = 34;
const PULSE_LEN = 0.09;
/** a strip on the floor plane along the thread's curved path from u0 to u1, half width w (world units): offsets in
 *  the floor plane, so it narrows with depth like a painted line on the floor */
const floorStrip = (A: AirWorld, path: ReturnType<typeof threadPathPool>, u0: number, u1: number, w: number) => {
  const n = Math.max(2, Math.ceil((u1 - u0) * 28));
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const p = threadPointPool(path, u);
    const q = threadPointPool(path, Math.min(1, u + 0.01));
    const o = threadPointPool(path, Math.max(0, u - 0.01));
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
/** the threads: lines of light ON THE FLOOR (floor-plane strips: a soft glow edge and a core) from each lit rack's
 *  foot, curving into the pool at his feet, pulses running toward him */
export const Threads: React.FC<{ A: AirWorld; racks: RackSpec[]; frame: number }> = ({ A, racks, frame }) => {
  let glow = "";
  let core = "";
  let pulses = "";
  for (const rk of racks) {
    const head = threadHead(rk, frame);
    if (head <= 0.004) continue;
    const path = threadPathPool(rk);
    glow += floorStrip(A, path, 0, head, THREAD_STRIP.glow);
    core += floorStrip(A, path, 0, head, THREAD_STRIP.core);
    const ph = random(`cpf-pulse-${rk.id}`) * PULSE_T;
    for (let j = 0; j < 2; j++) {
      const u1 = ((((frame + ph + (j * PULSE_T) / 2) % PULSE_T) + PULSE_T) % PULSE_T) / PULSE_T;
      const ua = Math.max(0, u1 - PULSE_LEN);
      const ub = Math.min(head, u1);
      if (ub - ua <= 0.005) continue;
      pulses += floorStrip(A, path, ua, ub, THREAD_STRIP.pulse);
    }
  }
  if (!core) return null;
  return (
    <g>
      <path d={glow} fill={CREAM} fillOpacity={THREAD_STRIP.glowOpacity} />
      <path d={core} fill={CREAM} fillOpacity={THREAD_STRIP.coreOpacity} />
      {pulses ? <path d={pulses} fill={CREAM} fillOpacity={0.9} /> : null}
    </g>
  );
};
/** how many threads are lit now (the summed heads of the threads that have reached the pool: a thread counts in full
 *  once its head is in, and drains out as it retracts) */
export const litThreads = (racks: RackSpec[], f: number) => racks.reduce((n, rk) => n + threadHead(rk, f), 0);
/** the pool: a soft cream glow on the floor plane at his feet, its strength following the number of lit threads */
export const FeetPool: React.FC<{ A: AirWorld; racks: RackSpec[]; frame: number }> = ({ A, racks, frame }) => {
  const st = poolStrength(litThreads(racks, frame));
  if (st <= 0.002) return null;
  const P = A.P;
  const a = P.p(POOL.X - POOL.rx, 0, POOL.Z - POOL.rz);
  const b = P.p(POOL.X + POOL.rx, 0, POOL.Z + POOL.rz);
  const c = P.p(POOL.X, 0, POOL.Z);
  const rx = Math.abs(b[0] - a[0]) / 2;
  const ry = Math.abs(a[1] - b[1]) / 2;
  return (
    <g>
      <defs>
        <radialGradient id="cpf-feetpool">
          <stop offset="0" stopColor={CREAM} stopOpacity={0.78} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={0.42} />
          <stop offset="0.82" stopColor={CREAM} stopOpacity={0.12} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(rx)} ry={f2(ry)} fill="url(#cpf-feetpool)" opacity={st} />
    </g>
  );
};

// ---- the year plate: one constant floor shadow, the years handed over by a continuous slide-up (cut 3's) ----------
/** the swap over SWAP_W frames from each drop's `swap` frame: the old year slides up and out while the new one slides
 *  up into place, overlapping, so max(old, new) opacity stays >= ~0.8; the plate under them never changes */
export const SWAP_W = 10;
export const swapOpacity = (t: number) => ({ old: 1 - ss((t - 0.3) / 0.7), nu: ss(t / 0.7) });
const YearPlates: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const s2 = PLATE.size * P.r(PLATE.Z);
  const c = P.p(PLATE.X, PLATE.Y, PLATE.Z);
  const tw = 4 * 0.62 * s2;
  const out: React.ReactNode[] = [
    <g key="pl">
      <defs>
        <radialGradient id="cpf-plate-g">
          <stop offset="0" stopColor={AIR.A.shadow} stopOpacity={0.34} />
          <stop offset="0.6" stopColor={AIR.A.shadow} stopOpacity={0.23} />
          <stop offset="1" stopColor={AIR.A.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={tw * 0.72 + s2 * 0.75} ry={s2 * 0.92} fill="url(#cpf-plate-g)" />
    </g>,
  ];
  PLATE_YEARS.forEach((yr, i) => {
    const tin = i === 0 ? 1 : (frame - DROPS[i - 1].swap) / SWAP_W;
    const tout = i === PLATE_YEARS.length - 1 ? 0 : (frame - DROPS[i].swap) / SWAP_W;
    if (tin <= 0 || tout >= 1) return;
    const op = Math.min(swapOpacity(c01(tin)).nu, swapOpacity(c01(tout)).old);
    if (op <= 0.001) return;
    const lift = 0.16 * s2 * (1 - easeOut3(tin)) - 0.18 * s2 * ss(tout);
    out.push(
      <g key={yr} opacity={op} transform={`translate(0 ${lift.toFixed(3)})`}>
        <YearPlate A={A} X={PLATE.X} Y={PLATE.Y} Z={PLATE.Z} text={yr} t={1} uid={`cpf-yp${i}`} size={PLATE.size} plate={0} />
      </g>,
    );
  });
  return <g>{out}</g>;
};

/** the racks at frame f, with their power now */
export const racksAt = (f: number): RackSpec[] => BLOCK_RACKS.map((rk) => ({ ...rk, power: powerOf(rk.id ?? 0, f) }));

const ComputePerAIFalls: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const C = camState(frame);
  const cam = swayCam(C.cam, frame);
  const rest = swayCam(camState(0).cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame, scene: AIR_SCENE, fogBy: AIR_FOG_BY });
  const racks = racksAt(frame);
  const rowMap = new Map<number, RackSpec[]>();
  for (const rk of racks) {
    const key = Math.round(rk.Z * 100);
    const a = rowMap.get(key);
    if (a) a.push(rk);
    else rowMap.set(key, [rk]);
  }
  const rows = [...rowMap.entries()].sort((a, b) => b[0] - a[0]);
  const g = A.P.at(GENIUS.X, GENIUS.Z);
  return (
    <AirStage v={A.v} bloom={STAGE.bloom} shafts={STAGE.shafts}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={FLOOR.x0} x1={FLOOR.x1} z0={FLOOR.z0} z1={FLOOR.z1} mat={FLOOR.mat} course={FLOOR.tile} plank={FLOOR.tile} jointAmt={FLOOR.jointAmt} melt={FLOOR.melt} />
        <AirHorizonHazeW A={A} id="cpf-haze" />
        <RackPools A={A} racks={racks} uid="cpf" />
        <Threads A={A} racks={racks} frame={frame} />
        {rows.map(([key, rr]) => (
          <React.Fragment key={key}>
            <RackHalo A={A} racks={rr} uid={`cpfh${key}`} />
            <RackField A={A} racks={rr} frame={frame} uid={`cpf${key}`} lod="hero" cull={false} />
            <RackWash A={A} racks={rr} />
            <BlockTopShade A={A} racks={rr} />
            <BlockGlints A={A} racks={rr} frame={frame} />
          </React.Fragment>
        ))}
        <YearPlates A={A} frame={frame} />
        <AirShadow A={A} X={GENIUS.X} Z={GENIUS.Z} w={GENIUS_SHADOW.w} d={GENIUS_SHADOW.d} uid="cpf-gs" amt={GENIUS_SHADOW.amt} />
        <FeetPool A={A} racks={racks} frame={frame} />
        <Genius variant={GENIUS.variant} pose={G.stand(GENIUS.dir, geniusPoseFrame(frame))} at={g.at} scale={g.scale} uid="cpf-g" frame={frame} fog={A.folkFog(GENIUS.Z)} unitPx={cam.k} />
      </WorldSvg>
    </AirStage>
  );
};

export default ComputePerAIFalls;

