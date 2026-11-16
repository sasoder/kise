// ---------------------------------------------------------------------------
// computePerAIFallsTake1Parts — the rack-look helpers of cut 6's FIRST TAKE (ComputePerAIFalls take 1), kept verbatim
// because other files import them through ./ComputePerAIFalls: SmallerDoesTheSameJob.tsx (cut 5: BlockTopShade,
// RackHalo, RackPools) and scripts/clips/rsi-ten-earths/check-compute-per-ai-falls.ts (threadHead). Revision 1 of
// cut 6 no longer draws them (its world is computeBlockRev1Parts.tsx); ComputePerAIFalls.tsx re-exports these names.
// ---------------------------------------------------------------------------
import React from "react";
import { random } from "remotion";
import { mixHex, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BLOCK_27_DARK_ORDER, CREAM, MAT_RACK, RACK, powerWave, type RackSpec } from "./tenEarthsHall";
import { BLOCK_RACKS, POOL, THREAD_STRIP, poolStrength, threadPathPool, threadPointPool } from "./computeBlockState";

// ---- the drops of take 1 (27 -> 9 -> 3 -> 1) -------------------------------------------------------------------------
export const DROPS = [
  { ids: BLOCK_27_DARK_ORDER.slice(0, 18), f0: 72, lag: 9.6 / 17, swap: 70 },
  { ids: BLOCK_27_DARK_ORDER.slice(18, 24), f0: 96, lag: 1, swap: 94 },
  { ids: BLOCK_27_DARK_ORDER.slice(24, 26), f0: 118, lag: 1.5, swap: 116 },
];
const WAVE_DUR = 8;
export const OFF_AT: Map<number, number> = (() => {
  const m = new Map<number, number>();
  DROPS.forEach((d) => d.ids.forEach((id, i) => m.set(id, d.f0 + i * d.lag)));
  return m;
})();
const powerOf = (id: number, f: number) => {
  const at = OFF_AT.get(id);
  return at === undefined ? 1 : powerWave(f, at, "off", WAVE_DUR).power;
};

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const easeOut2 = (t: number) => 1 - Math.pow(1 - c01(t), 2);

const f2 = (v: number) => v.toFixed(2);

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
export const racksAt = (f: number): RackSpec[] => BLOCK_RACKS.map((rk) => ({ ...rk, power: powerOf(rk.id ?? 0, f) }));
