import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam, Glide } from "./outgrowShared";
import { COLOR, FONT_NUM, LightSweep, Label, METRIC, Numeral, TRACK, bloomFilter, clamp01, easeOutCubic, lerp, mixHex, numeralWidth, smoothstep } from "./stoutShared";
import { trackCentred } from "./droneShipShared";
import { OCEAN } from "./oceanShared";
import { CUT1_SEA_DURATION, ResearchShip, SEA_BAND, SEA_STATION, SHIP_GEO, SeaStage, shipToWorld, waterlineScreenY } from "./droneSeaShared";

// ===========================================================================
// ShipDayRateV2 — the cold-review improvement loop on ShipDayRate (the delivered cut stays in ShipDayRate.tsx).
// Cut 2 of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will O'Brien, Ulysses), in the
// realistic ocean look (droneSeaShared.tsx: the sea, the sky and the ship, imported, never redrawn). 1080x1920,
// 23.976 fps, opaque. Amber = money.
//
// CHECK LINE: "Once you have the ship, every single day it's out at sea runs up a bill of hundreds of
// thousands of dollars."
//
// THE LINE: "[Once you even get the ship,] you're chartering it at an order of maybe a few hundred thousand
// dollars a day." Sequence 14.973-18.518 s: slot 85 f + a 16-f living tail = 101.
// ONSETS (f): chartering 1 · it 16 · at 17 · an 24 · order 33 · of 37 · maybe 41 · a 44 · few 48 · hundred 51 ·
// thousand 56 · dollars 62 · a 71 · day 77. Slot ends f85.
//
// ROUND 3 + FINISH PASS (cold reviews r2/r3): the sun RISES out of the sea horizon at the far left and SETS into it
// right of the stern on "day" (open horizon both sides: the ship framed a little smaller, then a slow push-in from
// f36 toward the stack that also brings the stern clear of the sunset lane); dawn -> day -> warm dusk on the sky and
// the water only; the bundles DROP in under gravity in a lane right of the readout and land with weight (the hull
// dips ~6 px and bobs back, a ring of foam, a squash); the counter STEPS with the cash.
//
//   f 0..6    the sun comes up out of the sea at the far left (dawn)
//   f 4..22   bundle 1 falls; on impact "$100,000" punches into the sky (the counter's first frame)
//   f 26..42  bundle 2 falls; one clean drum turn to "$200,000" (f40-46)
//   f 46..62  bundle 3 falls (lands on "dollars"); one drum turn to "$300,000" (f60-66)
//   f 3..77   the sun's one arc at one speed; it touches the sea right of the stern ~f75, its centre on it on f77
//   f 71..77  "~" and "PER DAY" slide up and settle (on "a day"); settled from f78 through the cut and the hold
//   f 77..89  the one light sweep across the three bundles
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 85;
export const TAIL = 16;
export const DURATION = SLOT_FRAMES + TAIL; // 101

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `sdr2${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
type P2 = { x: number; y: number };

/** The story clock: cut 1's float continues. */
const clockOf = (f: number) => f + CUT1_SEA_DURATION;
const SX = SEA_STATION.x;
const DECK = SHIP_GEO.AFT_DECK;

// ===========================================================================
// THE LANDINGS and THE COUNTER: three crisp settles locked to them
// ===========================================================================
const LAND = [22, 42, 62] as const;
/** The counter (in $100,000 steps) steps with the cash: hidden until the first bundle lands; "$100,000" punches in on
 *  impact 1; ONE clean drum turn (TURN frames, from TURN_LEAD before the impact) to "$200,000" on impact 2 and to
 *  "$300,000" on impact 3. No $10,000 steps, no flicker. */
const TURN = 6;
const TURN_LEAD = 2;
export const countAt = (f: number) => {
  if (f < LAND[0]) return 0;
  let v = 1;
  for (let i = 1; i < 3; i++) v += clamp01((f - (LAND[i] - TURN_LEAD)) / TURN);
  return v;
};
const shown = (f: number) => f >= LAND[0];
const digits = (n: number) => `${Math.max(0, Math.round(n)).toString()}00,000`;
const COUNT_PX = 100;
const tabW = (t: string) => [...t].reduce((a, c) => a + numeralWidth(c, COUNT_PX, true) + TRACK.numeral * COUNT_PX, 0) - TRACK.numeral * COUNT_PX;
const DOLLAR_W = numeralWidth("$", COUNT_PX);
const TILDE_W = numeralWidth("~", COUNT_PX);
const GAP = 4;
const FIG_W = tabW(digits(3)); // every value has the same figures' width (tabular)
const LABEL_PX = Math.round((0.6 * COUNT_PX * METRIC.fig) / METRIC.cap);
/** The readout (SCREEN px): its figure at y ~350-420, the full "~$300,000" centred on READ_CX (>= 80 px from the
 *  edge); "PER DAY" under it. The bundles fall in a lane to its right: they never cross it. */
const READ_CX = 400;
const FULL_W = TILDE_W + GAP + DOLLAR_W + GAP + FIG_W;
const READ = { right: READ_CX + FULL_W / 2, base: 450 } as const;
const LABEL_AT = { x: READ.right - (FIG_W + GAP + DOLLAR_W) / 2, base: READ.base + 34 + Math.round(LABEL_PX * METRIC.cap) } as const;
const BEAT_IN: [number, number] = [71, 77]; // "~" + "PER DAY" on "a day"
const PUNCH = 4; // the first value settles 8 px into place over PUNCH frames on impact 1

// ===========================================================================
// THE BUNDLES: $100,000 each, pallet-sized bricks of notes, dropped onto the aft deck
// ===========================================================================
const BUNDLE = { w: 176, h: 96, cx: 724, strap: 0.4, r: 4, edge: 15 } as const;
/** Each fall: from rest just above the frame, under gravity, to its landing (frames). */
const FALL0 = [4, 26, 46] as const;
const SQUASH = { f: 6, y: 0.12, x: 0.05 } as const;
const NOTE = { hi: "#E2E5CD", mid: "#C6CDAF", lo: "#9BA388", edgeHi: "#F1EEDE", strapLo: "#CC8A00", strapInk: "#4A2E08", print: "#4F6250" } as const;
const BAND_PX = 24;

/** The weight landing: the hull dips 4-6 px and bobs back with a little slosh (world px, + = deeper). */
const DIP = { amp: 10, decay: 6, half: 6 } as const;
const shipDy = (f: number) =>
  LAND.reduce((a, t) => {
    if (f < t) return a;
    const u = f - t;
    return a + DIP.amp * Math.exp(-u / DIP.decay) * Math.sin((Math.PI * u) / DIP.half);
  }, 0);

const BundleBody: React.FC<{ x0: number; y: number; k: number; uid: string }> = ({ x0, y, k, uid }) => {
  const fh = BUNDLE.h - BUNDLE.edge;
  const bx = x0 + 6;
  const bw = BUNDLE.w - 12;
  const sw = BUNDLE.w * BUNDLE.strap;
  const cx = x0 + BUNDLE.w / 2;
  return (
    <g>
      <rect x={f3(x0)} y={f3(y)} width={BUNDLE.w} height={BUNDLE.h} rx={BUNDLE.r} fill={NOTE.lo} />
      <rect x={f3(x0)} y={f3(y)} width={BUNDLE.w} height={fh} rx={BUNDLE.r} fill={`url(#${uid}n)`} />
      <rect x={f3(bx)} y={f3(y + 5)} width={f3(bw)} height={f3(fh - 10)} rx={2} fill="none" stroke={NOTE.print} strokeWidth={2} opacity={0.75} />
      <rect x={f3(bx + 4)} y={f3(y + 9)} width={f3(bw - 8)} height={f3(fh - 18)} rx={1.5} fill="none" stroke={NOTE.print} strokeWidth={1} opacity={0.45} />
      <ellipse cx={f3(x0 + BUNDLE.w * 0.15)} cy={f3(y + fh / 2)} rx={13} ry={f3(fh * 0.3)} fill={NOTE.print} opacity={0.3} />
      <ellipse cx={f3(x0 + BUNDLE.w * 0.15)} cy={f3(y + fh / 2)} rx={13} ry={f3(fh * 0.3)} fill="none" stroke={NOTE.print} strokeWidth={1.4} opacity={0.7} />
      <circle cx={f3(x0 + BUNDLE.w * 0.86)} cy={f3(y + fh / 2)} r={f3(fh * 0.18)} fill="none" stroke={NOTE.print} strokeWidth={1.3} opacity={0.6} />
      {[
        [bx + 7, y + 11],
        [bx + bw - 19, y + 11],
        [bx + 7, y + fh - 18],
        [bx + bw - 19, y + fh - 18],
      ].map(([px, py], j) => (
        <rect key={j} x={f3(px)} y={f3(py)} width={12} height={7} rx={1} fill={NOTE.print} opacity={0.55} />
      ))}
      <g stroke={NOTE.edgeHi} strokeWidth={1} opacity={0.7}>
        {[2, 4.8, 7.6, 10.4, 13.2].map((ly) => (
          <line key={ly} x1={f3(x0 + 2)} x2={f3(x0 + BUNDLE.w - 2)} y1={f3(y + fh + ly)} y2={f3(y + fh + ly)} />
        ))}
      </g>
      <rect x={f3(x0)} y={f3(y)} width={BUNDLE.w} height={BUNDLE.h} rx={BUNDLE.r} fill={`url(#${uid}side)`} />
      <g style={{ filter: bloomFilter(k * 2.4) }}>
        <rect x={f3(cx - sw / 2)} y={f3(y - 0.8)} width={f3(sw)} height={BUNDLE.h + 1.6} fill={`url(#${uid}s)`} />
      </g>
      <rect x={f3(cx - sw / 2)} y={f3(y - 0.8)} width={f3(sw)} height={2} fill={COLOR.amberHot} opacity={0.9} />
      <text
        x={f3(cx)}
        y={f3(y + fh / 2 + (BAND_PX * METRIC.fig) / 2)}
        fontFamily={FONT_NUM}
        fontWeight={700}
        fontSize={BAND_PX}
        letterSpacing="-0.02em"
        textAnchor="middle"
        fill={NOTE.strapInk}
        style={{ fontFeatureSettings: '"lnum" 1' }}
      >
        $100K
      </text>
      <rect x={f3(x0 + 2)} y={f3(y)} width={BUNDLE.w - 4} height={1.6} fill="#FFFBEE" opacity={0.85} />
      <rect x={f3(x0)} y={f3(y + BUNDLE.h - 2)} width={BUNDLE.w} height={2} fill="#3A2A1C" opacity={0.4} />
    </g>
  );
};
const BundleDefs: React.FC<{ uid: string }> = ({ uid }) => (
  <defs>
    <linearGradient id={`${uid}n`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={NOTE.hi} />
      <stop offset="0.5" stopColor={NOTE.mid} />
      <stop offset="1" stopColor={NOTE.lo} />
    </linearGradient>
    <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={COLOR.amberTop} />
      <stop offset="1" stopColor={NOTE.strapLo} />
    </linearGradient>
    <linearGradient id={`${uid}side`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.14" />
      <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
      <stop offset="1" stopColor="#3A2A1C" stopOpacity="0.22" />
    </linearGradient>
  </defs>
);

const restAt = (i: number) => ({ x: BUNDLE.cx - BUNDLE.w / 2, y: DECK - (i + 1) * BUNDLE.h });
const shipPt = (S: number, f: number, lx: number, ly: number) => {
  const p = shipToWorld(SX, S, lx, ly);
  return { x: p.x, y: p.y + shipDy(f) };
};
/** The landed stack (SHIP-LOCAL): the newest bundle squashes a touch as it lands; the click. */
const Stack: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const uid = uidOf(useId());
  const n = LAND.filter((t) => f >= t).length;
  if (n === 0) return null;
  const top = restAt(n - 1).y;
  const x0 = restAt(0).x;
  const sweep = (f - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0]);
  return (
    <g>
      <BundleDefs uid={uid} />
      <rect x={f3(x0 + 8)} y={f3(top + 8)} width={BUNDLE.w} height={f3(DECK - top)} rx={BUNDLE.r} fill="#3A2A1C" opacity={0.26} style={{ filter: "blur(6px)" }} />
      {Array.from({ length: n }, (_, i) => {
        const u = f - LAND[i];
        const q = u < SQUASH.f ? Math.sin((Math.PI * u) / SQUASH.f) : 0;
        const sy = 1 - SQUASH.y * q;
        const sx = 1 + SQUASH.x * q;
        const foot = restAt(i).y + BUNDLE.h;
        return (
          <g key={i} transform={q > 0 ? `translate(${f3(BUNDLE.cx)} ${f3(foot)}) scale(${f3(sx)} ${f3(sy)}) translate(${f3(-BUNDLE.cx)} ${f3(-foot)})` : undefined}>
            <BundleBody x0={x0} y={restAt(i).y} k={k} uid={uid} />
          </g>
        );
      })}
      {sweep > 0 && sweep < 1 ? <LightSweep x={x0} y={top} w={BUNDLE.w} h={DECK - top} k={k} t={sweep} on="cream" r={BUNDLE.r} /> : null}
    </g>
  );
};

/** A falling bundle at frame f: which one, its top's height above its rest (world px), its speed (world px / f). */
const fallAt = (f: number, startTop: (i: number) => number, restTop: (i: number) => number) => {
  for (let i = 0; i < 3; i++) {
    const t0 = FALL0[i];
    const t1 = LAND[i];
    if (f >= t0 && f < t1) {
      const T = t1 - t0;
      const t = f - t0;
      const d = restTop(i) - startTop(i);
      return { i, lift: d * (1 - (t / T) * (t / T)), v: (2 * d * t) / (T * T) };
    }
  }
  return null;
};

// ===========================================================================
// THE CAMERA: the ship framed a little smaller (open horizon both sides), a slow creep in
// ===========================================================================
/** f0: the ship framed a little smaller and right (open horizon left of the bow for the sunrise); from ~f40 a slow
 *  push-in toward the stack that also moves the ship left (open horizon right of the stern for the sunset). */
const CAM0: Cam = { x: 518, y: -56, k: 0.88 };
const CAM_END = { x: 600, y: -55, k: 0.93 } as const;
const GLIDES: Glide[] = [
  { f0: 36, f1: 64, dx: CAM_END.x - CAM0.x, dy: CAM_END.y - CAM0.y, k: CAM_END.k, warp: 1 },
  { f0: 64, f1: 150, k: CAM_END.k * 1.02, warp: 1 },
];
export const CAM: Cam[] = trackCentred(CAM0, GLIDES, DURATION, 30);
export const camAt = (f: number): Cam => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];
const SWEEP_F: [number, number] = [77, 89];
const toWorld = (cam: Cam, sx: number, sy: number) => ({ x: cam.x + (sx - 540) / cam.k, y: cam.y + (sy - 960) / cam.k });
const toScreen = (cam: Cam, x: number, y: number) => ({ x: 540 + (x - cam.x) * cam.k, y: 960 + (y - cam.y) * cam.k });
const horizonOf = (cam: Cam) => waterlineScreenY(cam) - SEA_BAND * Math.sqrt(cam.k);

// ===========================================================================
// THE DAY: the sun (SCREEN px) rises out of the sea at the far left and sets into it right of the stern
// ===========================================================================
/** One arch at ONE speed (a superellipse: steep sides, so it comes up out of the sea left of the bow and goes down
 *  into it right of the stern; a high top over the readout). Its centre is on the horizon on f RISE and on f SET. */
const SUN = { r: 42, rayIn: 1.3, rayOut: 1.76, rayW: 0.22, rise: 3, set: 77, x0: 80, x1: 1000, apex: 120, p: 0.28, q: 0.62 } as const;
const SUN_REACH = SUN.r * SUN.rayOut;
const ARC = (() => {
  const base = horizonOf(CAM_END);
  const cx = (SUN.x0 + SUN.x1) / 2;
  const rx = (SUN.x1 - SUN.x0) / 2;
  const ry = base - SUN.apex;
  const n = 3000;
  const pts: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (Math.PI * i) / n;
    const c = Math.cos(th);
    const p = { x: cx - rx * Math.sign(c) * Math.pow(Math.abs(c), SUN.p), y: base - ry * Math.pow(Math.sin(th), SUN.q) };
    const prev = pts[i - 1];
    pts.push({ ...p, s: prev ? prev.s + Math.hypot(p.x - prev.x, p.y - prev.y) : 0 });
  }
  return { pts, len: pts[pts.length - 1].s, base };
})();
const SUN_V = ARC.len / (SUN.set - SUN.rise);
export const sunAt = (f: number): P2 => {
  const d = (f - SUN.rise) * SUN_V;
  if (d <= 0) return { x: SUN.x0, y: ARC.base - d };
  if (d >= ARC.len) return { x: SUN.x1, y: ARC.base + (d - ARC.len) };
  let lo = 0;
  let hi = ARC.pts.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ARC.pts[m].s < d) lo = m;
    else hi = m;
  }
  const A = ARC.pts[lo];
  const B = ARC.pts[hi];
  const t = (d - A.s) / Math.max(1e-9, B.s - A.s);
  return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t) };
};
/** The hour: dawn -> a bright day -> dusk, on the sky and the water only. */
const dawnAt = (f: number) => 1 - smoothstep(f / 26);
const duskAt = (f: number) => smoothstep((f - 40) / 46);
const middayAt = (f: number) => Math.sin(Math.PI * clamp01((f - 8) / 52));
const DAWN = { top: "#7E7480", mid: "#D7B7A6", low: "#F1C29E" } as const;
const DUSK = { top: "#8C5E46", mid: "#CF8C5E", low: "#F4B274" } as const;
const NOON = { color: "#FFF6E2", a: 0.22 } as const;

const Sun: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const uid = uidOf(useId());
  const sc = sunAt(f);
  const hz = horizonOf(cam);
  if (sc.y - SUN_REACH >= hz) return null;
  const k = cam.k;
  const s = toWorld(cam, sc.x, sc.y);
  const hzW = toWorld(cam, 0, hz).y;
  const r = SUN.r / k;
  const reach = SUN_REACH / k;
  const low = Math.max(dawnAt(f), duskAt(f));
  const fill = mixHex("#FFFBEF", "#FFE0AE", low); // the brightest thing in the sky at dawn and at dusk too
  const R = reach * 3.4;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}h`}>
          <rect x={f3(s.x - 3000)} y={f3(hzW - 6000)} width={6000} height={6000} />
        </clipPath>
        <radialGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" cx={f3(s.x)} cy={f3(s.y)} r={f3(R)}>
          <stop offset={f3(r / R)} stopColor={fill} stopOpacity="0.7" />
          <stop offset="0.45" stopColor={fill} stopOpacity="0.2" />
          <stop offset="1" stopColor={fill} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${uid}h)`}>
        <circle cx={f3(s.x)} cy={f3(s.y)} r={f3(R)} fill={`url(#${uid}g)`} style={{ mixBlendMode: "screen" }} />
        <circle cx={f3(s.x)} cy={f3(s.y)} r={f3(r)} fill={fill} />
        <g stroke={fill} strokeWidth={f3(r * SUN.rayW)} strokeLinecap="round">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            const r0 = r * SUN.rayIn + (r * SUN.rayW) / 2;
            const r1 = reach - (r * SUN.rayW) / 2;
            return <line key={i} x1={f3(s.x + Math.cos(a) * r0)} y1={f3(s.y + Math.sin(a) * r0)} x2={f3(s.x + Math.cos(a) * r1)} y2={f3(s.y + Math.sin(a) * r1)} />;
          })}
        </g>
      </g>
    </g>
  );
};

/** The falling bundle (WORLD coords, over the ship), a vertical motion blur in proportion to its speed. */
const Falling: React.FC<{ f: number; cam: Cam; S: number }> = ({ f, cam, S }) => {
  const uid = uidOf(useId());
  const frameTop = toWorld(cam, 0, 0).y;
  const restTop = (i: number) => shipPt(S, f, BUNDLE.cx, restAt(i).y).y;
  const st = fallAt(f, () => frameTop - BUNDLE.h - 6, restTop);
  if (!st) return null;
  const rest = shipPt(S, f, BUNDLE.cx, restAt(st.i).y);
  const k = cam.k;
  const blur = Math.min(10, st.v * k * 0.22);
  return (
    <g>
      <BundleDefs uid={uid} />
      {blur > 0.3 ? (
        <defs>
          <filter id={`${uid}mb`} x="-5%" y="-40%" width="110%" height="180%">
            <feGaussianBlur stdDeviation={`0 ${f3(blur / k)}`} />
          </filter>
        </defs>
      ) : null}
      <g filter={blur > 0.3 ? `url(#${uid}mb)` : undefined}>
        <BundleBody x0={rest.x - BUNDLE.w / 2} y={rest.y - st.lift} k={k} uid={uid} />
      </g>
    </g>
  );
};

/** The landing's splash (WORLD, above the water): foam thrown along the hull's waterline aft and a few drops past
 *  the transom, gone in ~12 f. */
const Splash: React.FC<{ f: number }> = ({ f }) => {
  const parts: React.ReactNode[] = [];
  LAND.forEach((t, li) => {
    const u = f - t;
    if (u < 0 || u > 16) return;
    const a = Math.exp(-u / 5);
    // the ring of foam the hull pushes out as it dips: along its waterline and spreading out past bow and stern
    const spread = 14 + u * 9;
    const xb = SX + SHIP_GEO.STEM_WL - spread;
    const xs = SX + SHIP_GEO.STERN_WL + spread;
    parts.push(
      <path key={`r${li}`} d={`M${f3(xb)} ${f3(-2)}L${f3(xs)} ${f3(-2)}`} stroke={OCEAN.cream} strokeWidth={f3(2.5 + 6 * a)} strokeLinecap="round" opacity={f3(0.85 * a)} />,
      <path key={`b${li}`} d={`M${f3(xb - 30)} ${f3(-1)}L${f3(xb + 40)} ${f3(-1)}`} stroke="#FFFFFF" strokeWidth={f3(1.5 + 3 * a)} strokeLinecap="round" opacity={f3(0.7 * a)} />,
      <path key={`s${li}`} d={`M${f3(xs - 40)} ${f3(-1)}L${f3(xs + 30)} ${f3(-1)}`} stroke="#FFFFFF" strokeWidth={f3(1.5 + 3 * a)} strokeLinecap="round" opacity={f3(0.7 * a)} />,
    );
    for (let j = 0; j < 10; j++) {
      const h = Math.sin((j + 1) * 12.9898 + li * 78.233) * 43758.5453;
      const r1 = h - Math.floor(h);
      const side = j % 2 === 0 ? 1 : -1;
      const vx = (1.4 + 3.4 * r1) * side;
      const vy = 3.8 + 3 * ((j * 0.37) % 1);
      const x = (side > 0 ? SX + SHIP_GEO.STERN_WL + 6 : SX + SHIP_GEO.STEM_WL - 6) + vx * u;
      const y = -vy * u + 0.45 * u * u;
      if (y > 0) continue;
      parts.push(<circle key={`d${li}-${j}`} cx={f3(x)} cy={f3(y)} r={f3(2.4 + 1.6 * r1)} fill={OCEAN.cream} opacity={f3(0.9 * a)} />);
    }
  });
  return <g>{parts}</g>;
};

// ===========================================================================
// THE CUT
// ===========================================================================
const ShipDayRateV2: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const S = clockOf(f);
  const uid = uidOf(useId());
  const dawn = dawnAt(f);
  const dusk = duskAt(f);
  const noon = middayAt(f);
  const dy = shipDy(f);
  const v = countAt(f);
  const vv = Number.isInteger(v) ? v - 1e-6 : v; // always drawn as an odometer: tabular, nothing jumps
  const roll = countAt(f + 0.5) - countAt(f - 0.5);
  const inB = easeOutCubic(clamp01((f - BEAT_IN[0]) / (BEAT_IN[1] - BEAT_IN[0])));
  const fw = FIG_W;
  const rise = (t: number, px: number) => (1 - t) * px * 0.95;
  const punch = 8 * (1 - easeOutCubic(clamp01((f - LAND[0]) / PUNCH))); // set into place by the impact
  const r = toWorld(cam, READ.right, READ.base - punch);
  const dl = toWorld(cam, READ.right - fw - GAP, READ.base - punch);
  const tl = toWorld(cam, READ.right - fw - GAP - DOLLAR_W - GAP, READ.base + rise(inB, COUNT_PX));
  const lab = toWorld(cam, LABEL_AT.x, LABEL_AT.base + rise(inB, LABEL_PX * 1.1));
  const m0 = toWorld(cam, -40, -100);
  const mCount = toWorld(cam, 1120, READ.base + COUNT_PX * 0.2);
  const mLab0 = toWorld(cam, -40, READ.base + COUNT_PX * 0.2 + 2);
  const mLab = toWorld(cam, 1120, LABEL_AT.base + LABEL_PX * 0.08);
  const tlW = toWorld(cam, -60, -80);
  const brW = toWorld(cam, 1140, waterlineScreenY(cam) + 20);
  const lightRect = { x: tlW.x, y: tlW.y, w: brW.x - tlW.x, h: Math.max(0, -tlW.y + 20) };
  const water = toWorld(cam, -60, waterlineScreenY(cam));
  const waterBot = toWorld(cam, 1140, 2000);
  const shipLoad = `translate(0 ${f3(dy)})`;
  const tone = (key: "top" | "mid" | "low") => mixHex(mixHex("#FFFFFF", DAWN[key], dawn), DUSK[key], dusk);
  return (
    <AbsoluteFill>
      <SeaStage
        S={S}
        cam={cam}
        rest={CAM[0]}
        below={
          <g transform={shipLoad}>
            <ResearchShip x={SX} S={S} part="below" k={k} />
          </g>
        }
        above={
          <>
            <defs>
              <linearGradient id={`${uid}hour`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(lightRect.y)} x2="0" y2={f3(lightRect.y + lightRect.h)}>
                <stop offset="0" stopColor={tone("top")} />
                <stop offset="0.55" stopColor={tone("mid")} />
                <stop offset="1" stopColor={tone("low")} />
              </linearGradient>
            </defs>
            {dawn + dusk > 0.002 ? <rect x={f3(lightRect.x)} y={f3(lightRect.y)} width={f3(lightRect.w)} height={f3(lightRect.h)} fill={`url(#${uid}hour)`} style={{ mixBlendMode: "multiply" }} /> : null}
            {noon > 0.002 ? (
              <rect x={f3(lightRect.x)} y={f3(lightRect.y)} width={f3(lightRect.w)} height={f3(lightRect.h)} fill={NOON.color} opacity={f3(NOON.a * noon)} style={{ mixBlendMode: "screen" }} />
            ) : null}
            <Sun f={f} cam={cam} />
            <g transform={shipLoad}>
              <ResearchShip x={SX} S={S} part="above" k={k} front={<Stack f={f} k={k} />} />
            </g>
            <Splash f={f} />
            <Falling f={f} cam={cam} S={S} />
          </>
        }
        top={
          <>
            {dusk > 0.002 ? <rect x={f3(water.x)} y={f3(Math.max(0, water.y))} width={f3(waterBot.x - water.x)} height={f3(waterBot.y)} fill="#1E140C" opacity={f3(0.26 * dusk)} /> : null}
            <defs>
              <clipPath id={`${uid}mc`}>
                <rect x={f3(m0.x)} y={f3(m0.y)} width={f3(mCount.x - m0.x)} height={f3(mCount.y - m0.y)} />
              </clipPath>
              <clipPath id={`${uid}ml`}>
                <rect x={f3(mLab0.x)} y={f3(mLab0.y)} width={f3(mLab.x - mLab0.x)} height={f3(mLab.y - mLab0.y)} />
              </clipPath>
            </defs>
            <g style={{ filter: "drop-shadow(0 2px 7px rgba(40,26,16,0.55))" }}>
              {shown(f) ? (
                <>
                  <Numeral x={r.x} y={r.y} k={k} px={COUNT_PX} value={vv} format={digits} rollBlur={Math.min(2.5, Math.abs(roll) * 9)} tone="amber" anchor="end" glow />
                  <Numeral x={dl.x} y={dl.y} k={k} px={COUNT_PX} text="$" tone="amber" anchor="end" glow />
                </>
              ) : null}
              <g clipPath={`url(#${uid}mc)`}>{inB > 0 ? <Numeral x={tl.x} y={tl.y} k={k} px={COUNT_PX} text="~" tone="amber" anchor="end" glow /> : null}</g>
              <g clipPath={`url(#${uid}ml)`}>{inB > 0 ? <Label x={lab.x} y={lab.y} k={k} px={LABEL_PX} text="PER DAY" tone="cream" anchor="middle" /> : null}</g>
            </g>
          </>
        }
      />
    </AbsoluteFill>
  );
};

export default ShipDayRateV2;

// ---------------------------------------------------------------------------
// Load-time checks: the rules the cut rests on.
// ---------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`ShipDayRateV2: ${m}`);
  };
  LAND.forEach((t, i) => {
    if (Math.abs(countAt(t + TURN - TURN_LEAD) - (i + 1)) > 1e-9) fail(`the counter is not on $${i + 1}00,000 after bundle ${i + 1} lands`);
  });
  if (LAND[2] + TURN - TURN_LEAD > 66) fail("$300,000 is not settled by f66");
  if (READ_CX - FULL_W / 2 < 80 || READ_CX + FULL_W / 2 > 1000) fail("the readout is within 80 px of an edge");
  // the hull's dip on a landing: 4-6 px
  {
    let m = 0;
    for (let u = 0; u < 12; u += 0.1) m = Math.max(m, DIP.amp * Math.exp(-u / DIP.decay) * Math.sin((Math.PI * u) / DIP.half));
    if (m < 5.5 || m > 7) fail(`the hull dips ${m.toFixed(1)} px`);
  }
  {
    let touch = -1;
    for (let f = 60; f < 90; f += 0.1) {
      if (sunAt(f).y + SUN.r >= horizonOf(camAt(f))) {
        touch = f;
        break;
      }
    }
    if (touch < 73.5 || touch > 77.5) fail(`the sun touches the horizon on f${touch.toFixed(1)}`);
  }
  // the sun: centre on the horizon on f RISE and on f SET (it rises out of / sets into the sea)
  {
    const a = sunAt(SUN.rise);
    const b = sunAt(SUN.set);
    if (Math.abs(a.y - horizonOf(camAt(SUN.rise))) > 4 || Math.abs(b.y - horizonOf(camAt(SUN.set))) > 4) fail("the sun is not on the horizon at its rise / set");
  }
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const S = clockOf(f);
    const wl = waterlineScreenY(c) + 5;
    if (wl > 1050) fail(`the waterline drops to y ${wl.toFixed(0)} on f${f}`);
    const bow = toScreen(c, SX, 0).x;
    if (bow < 33) fail(`the bow nears the frame's edge on f${f}`);
    const s = sunAt(f);
    const hz = horizonOf(c);
    if (s.y - SUN_REACH < hz) {
      if (s.x - SUN_REACH < 4 || s.x + SUN_REACH > 1076 || s.y - SUN_REACH < 24) fail(`the sun is cut by the frame's edge on f${f}`);
      // never on the readout
      const lw = f >= BEAT_IN[0] ? FULL_W : FIG_W + GAP + DOLLAR_W;
      const box = { x0: READ.right - lw - 10, x1: READ.right + 10, y0: READ.base - COUNT_PX * 0.76 - 20, y1: LABEL_AT.base + 20 };
      const dx = Math.max(box.x0 - s.x, 0, s.x - box.x1);
      const dy = Math.max(box.y0 - s.y, 0, s.y - box.y1);
      if (shown(f) && Math.hypot(dx, dy) < SUN_REACH + 8) fail(`the sun meets the readout on f${f}`);
      // never behind the ship, its stack, or a falling bundle
      const n = LAND.filter((t) => f >= t).length;
      for (const q of [
        { x: 0, y: SHIP_GEO.BOW_DECK },
        { x: 30, y: -110 },
        { x: 50, y: -30 },
        { x: SHIP_GEO.RADOME.x, y: SHIP_GEO.RADOME.y - SHIP_GEO.RADOME.r },
        { x: SHIP_GEO.AFRAME.beam.x0, y: SHIP_GEO.AFRAME.beam.y0 },
        { x: SHIP_GEO.AFRAME.beam.x1, y: SHIP_GEO.AFRAME.beam.y0 },
        { x: SHIP_GEO.AFRAME.beam.x1, y: SHIP_GEO.AFRAME.beam.y1 + 20 },
        { x: SHIP_GEO.AFRAME.feet[1] + SHIP_GEO.AFRAME.lean + 6, y: -150 },
        { x: SHIP_GEO.STERN_WL + 18, y: -40 },
        { x: BUNDLE.cx - BUNDLE.w / 2, y: DECK - n * BUNDLE.h },
        { x: BUNDLE.cx + BUNDLE.w / 2, y: DECK - n * BUNDLE.h },
      ]) {
        const sp = toScreen(c, shipPt(S, f, q.x, q.y).x, shipPt(S, f, q.x, q.y).y);
        if (Math.hypot(sp.x - s.x, sp.y - s.y) < SUN_REACH + 6) fail(`the sun slips behind the ship on f${f}`);
      }
    }
  }
  for (let f = 0; f < DURATION; f += 0.5) {
    const c = camAt(f);
    const S = clockOf(f);
    const frameTop = toWorld(c, 0, 0).y;
    const st = fallAt(f, () => frameTop - BUNDLE.h - 6, (i) => shipPt(S, f, BUNDLE.cx, restAt(i).y).y);
    if (!st) continue;
    const rest = shipPt(S, f, BUNDLE.cx, restAt(st.i).y);
    const a = toScreen(c, rest.x - BUNDLE.w / 2, rest.y - st.lift);
    const b = toScreen(c, rest.x + BUNDLE.w / 2, rest.y - st.lift + BUNDLE.h);
    const s = sunAt(f);
    const dx = Math.max(a.x - s.x, 0, s.x - b.x);
    const dy = Math.max(a.y - s.y, 0, s.y - b.y);
    if (Math.hypot(dx, dy) < SUN_REACH + 4) fail(`the sun passes behind a falling bundle on f${f}`);
    // the falling bundle never crosses the readout (it falls in a lane to its right)
    if (shown(f) && a.x < READ.right + 12 && b.y > READ.base - COUNT_PX * 0.9) fail(`a falling bundle crosses the readout on f${f} (x ${a.x.toFixed(0)})`);
  }
  for (let f = 1; f < DURATION; f++) {
    const a = sunAt(f - 1);
    const b = sunAt(f);
    if (Math.hypot(b.x - a.x, b.y - a.y) > 45) fail(`the sun moves > 45 px on f${f}`);
  }
}
