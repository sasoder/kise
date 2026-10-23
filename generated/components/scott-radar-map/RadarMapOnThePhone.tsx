// ---------------------------------------------------------------------------------------------------------------
// RadarMapOnThePhone (scott-radar-map, cut 1 "1_RadarMapOnThePhone"). Cheeky Pint style, the realistic "at sea"
// variant carried into the air as in the episode's sister clips (styles/cheeky-pint.md § Realistic ocean variant;
// notes/COMMON.md). Opaque 1080x1920, 23.976 fps, 53 frames.
//
// CHECK LINE: "instead of just 'your flight is delayed', United's text to a waiting customer comes with a picture of
// the weather radar map."
//
// THE LINE: "(If you're going to have a delay, like) sending customers weather radar maps."
// WORD -> FRAME: delay -12 · like -3 · sending 0 · customers 6 · weather 23 · radar 32 · maps 40 (ends ~f50) ·
//                (on camera after the cut: "like in Chicago" f46-61)
// DURATION: the slot 1.043 -> 3.253 s = 2.211 s x 23.976 = 53 frames (f0..f52).
//
// THE MOTION: inside the terminal by the gate-side glass wall (the world of WeatherDelaysCut: tent roof, warm haze,
// low sun bands; outside, denverWorld's AirStage with the storm boiling on the horizon, all soft behind the focus),
// a customer's phone (the shared radarPhone prop) is already rising into frame at f0 and tilting up toward the
// camera; it settles by ~f15 at ~63 % of the frame width (top leaning back 18 deg, the holder's view; its bottom runs off
// frame), so the soft glass and the thunderstorm outside (anvil, slate base, rain; on the open left side) frame it. The United thread is
// on screen as it rises; the plain delay bubble slides up into place f3 -> f12 ("customers" f6). On "weather" (f23)
// the image bubble arrives below it (f22 -> f31) holding the map, dimmed while it loads; a radar sweep turns
// clockwise about O'Hare from due south at a constant rate f27 -> f43, so the squall line WEST of the airport is
// painted f28 -> f34 ("radar" f32), its cores hot in amber and brick red, and the sweep closes before "maps" (f40).
// Then a living hold to f52: the returns creep east and their cells ride north, the phone creeps closer, the sun
// bands drift across the glass, the storm keeps boiling outside. One job: the radar map arriving on the phone.
// AMBER = the radar picture (its hot cores) — nothing else in the frame is amber.
// Text: only the phone's own (the thread header "United", the delay message, "ORD" on the map).
// CAUSE BEFORE EFFECT: each bubble is a received message (slides up into the thread); the returns appear only where
// the sweep beam has passed (state derived from the beam's angle, radarPhone.drawReturns).
//
// SOURCES: the radar map's geography (Lake Michigan shoreline, O'Hare 41.978 N 87.904 W, interstates) from public
// maps, simplified; the squall line is illustrative (the speaker's line of storms west of the airport), not a real
// day's NEXRAD scan. United globe: scott-aircraft-order/airlineMarks.ts (Simple Icons, CC0). Flight UA 1453 and the
// message wording are illustrative (COMMON.md's bubble text). The hall is WeatherDelaysCut's tent-roof terminal.
// ---------------------------------------------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { GRAIN, GROUND } from "../kits/cheeky-pint/stoutShared";
import { GRADE, OCEAN } from "../kits/cheeky-pint/oceanShared";
import { AirStage, CELL_DRIFT, cellPos, hash01, makeView, projectPoly, type DenCam, type DenView, type StormState } from "../scott-weather-fired/denverWorld";
import { PHONE_W, Phone, SCREEN, THREAD } from "./radarPhone";

export const FPS = 24000 / 1001;
export const DURATION = 53;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const u = clamp01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

// ===================================================================================================================
// THE INTERIOR CAMERA (metres; X right, Y up, Z ahead = north) — copied from WeatherDelaysCut (one lens with the
// outside world)
// ===================================================================================================================
type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const FOV = 55;
const F = 960 / Math.tan((FOV * Math.PI) / 360);
type P2 = { x: number; y: number; d: number };
type ICam = { eye: V3; f: V3; r: V3; u: V3 };
const makeICam = (eye: V3, tgt: V3): ICam => {
  const f = norm(sub(tgt, eye));
  const r = norm(cross([0, 1, 0], f));
  const u = cross(f, r);
  return { eye, f, r, u };
};
const proj = (c: ICam, p: V3): P2 | null => {
  const q = sub(p, c.eye);
  const d = dot(q, c.f);
  if (d < 0.25) return null;
  return { x: 540 + (F * dot(q, c.r)) / d, y: 960 - (F * dot(q, c.u)) / d, d };
};

// the camera: standing ~11 m from the north glass, gate side; one slow pre-rolled drift (moving at f0, creeping at f52)
const EYE0: V3 = [3.4, 1.65, 36.6];
const EYE1: V3 = [4.3, 1.62, 37.4];
const TGT0: V3 = [1.6, 3.0, 48];
const TGT1: V3 = [2.6, 2.95, 48];
const camAt = (f: number) => {
  const t = clamp01((f + 40) / (DURATION + 80));
  const u = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return makeICam(lerp3(EYE0, EYE1, u), lerp3(TGT0, TGT1, u));
};

// ===================================================================================================================
// THE STORM OUTSIDE (the world's cells and storm life) — the recipe of WeatherDelaysCut
// ===================================================================================================================
const S0 = 420; // the outside's story clock at f0
const OUT_EYE = { x: 0, y: 0.2, z: 0.22 };
const FOV_AIR = 72;
const F_AIR = 960 / Math.tan((FOV_AIR * Math.PI) / 360);
const OUT_SPECS: StormState[] = [
  // the thunderstorm, west-north-west of the view's axis (the side the phone leaves open): anvil streaming east over
  // the frame top, a heavy slate base, rain in streaks, boiling (the world's storm life)
  { id: "N", x: -12.2 - CELL_DRIFT.vx * S0, y: 31.7 - CELL_DRIFT.vy * S0, seed: 61, size: 1.6, ...CELL_DRIFT, anvilDir: 80, growth: 0.9, storminess: 1, boil: 1.4, rain: 1, rainStrength: 1.35 },
  // a far towering cumulus on the open right side (calm)
  { id: "cuE", x: 9.5 - CELL_DRIFT.vx * S0, y: 30 - CELL_DRIFT.vy * S0, seed: 79, size: 0.9, ...CELL_DRIFT, growth: 0.6 },
];
/** The thunderstorm's anvil as ONE smooth, soft, wind-sheared shelf drawn over the world's own anvil puffs (which read
 *  as a string of separate little clouds through the glass): a feathered sheet in the vertical plane of the anvil's
 *  axis, thick and lit at its root over the column, thinning downwind, its underside a warm slate, its leading edge
 *  dissolving. World miles, projected through the outside camera (AirStage's `over` layer, under the homography). */
const ANVIL = { along0: -0.6, along1: 10.4, top0: 8.55, top1: 8.7, bot0: 6.2, bot1: 8.6, spread0: 1.5, spread1: 3.8 } as const;
const AnvilSheet: React.FC<{ v: DenView; S: number; cell: StormState }> = ({ v, S, cell }) => {
  const sz = cell.size ?? 1;
  const p0 = cellPos(cell, S);
  const ad = ((cell.anvilDir ?? 80) * Math.PI) / 180;
  const ax = Math.sin(ad);
  const ay = Math.cos(ad);
  const N = 28;
  const top: { x: number; y: number }[] = [];
  const bot: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const along = lerp(ANVIL.along0, ANVIL.along1, u);
    const sheer = 0.12 * Math.sin(u * 3.1 + S * 0.01); // a slow ripple along the shelf (wind shear), not a pulse
    // a flat, slightly rising top; the underside slopes up from the column to the thin leading edge (a wedge)
    const zt = lerp(ANVIL.top0, ANVIL.top1, u) + sheer;
    const zb = lerp(ANVIL.bot0, ANVIL.bot1, Math.pow(u, 1.7)) + sheer * 0.6;
    const half = lerp(ANVIL.spread0, ANVIL.spread1, u);
    let yt = Infinity;
    let yb = -Infinity;
    let xs = 0;
    let n = 0;
    for (const va of [-1, 0, 1]) {
      const wx = p0.x + (ax * along - ay * va * half) * sz;
      const wy = p0.y + (ay * along + ax * va * half) * sz;
      const a = projectPoly(v, [[wx, wy, zt * sz]])[0];
      const b = projectPoly(v, [[wx, wy, zb * sz]])[0];
      if (!a || !b) continue;
      yt = Math.min(yt, a.y);
      yb = Math.max(yb, b.y);
      xs += (a.x + b.x) / 2;
      n++;
    }
    if (!n) continue;
    top.push({ x: xs / n, y: yt });
    bot.push({ x: xs / n, y: yb });
  }
  if (top.length < 3) return null;
  const d = `M${top.map((q) => `${f3(q.x)} ${f3(q.y)}`).join(" L")} L${bot
    .slice()
    .reverse()
    .map((q) => `${f3(q.x)} ${f3(q.y)}`)
    .join(" L")} Z`;
  const x0 = top[0].x;
  const x1 = top[top.length - 1].x;
  const yMin = Math.min(...top.map((q) => q.y));
  const yMax = Math.max(...bot.map((q) => q.y));
  return (
    <g>
      <defs>
        <linearGradient id="anvShade" gradientUnits="userSpaceOnUse" x1="0" y1={f3(yMin)} x2="0" y2={f3(yMax)}>
          <stop offset="0" stopColor="#F1E5CD" />
          <stop offset="0.45" stopColor="#D9C8AC" />
          <stop offset="1" stopColor="#9C8A76" />
        </linearGradient>
        <linearGradient id="anvFeather" gradientUnits="userSpaceOnUse" x1={f3(x0)} y1="0" x2={f3(x1)} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.12" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="anvMask" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
          <rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#anvFeather)" />
        </mask>
      </defs>
      <g mask="url(#anvMask)" style={{ filter: "blur(10px)" }}>
        <path d={d} fill="url(#anvShade)" />
      </g>
    </g>
  );
};

const outsideCam = (c: ICam): { cam: DenCam; m3d: string } => {
  const yaw = Math.atan2(c.f[0], c.f[2]);
  const dist = 20;
  const p = Math.asin(OUT_EYE.z / dist);
  const cam: DenCam = {
    tx: OUT_EYE.x + Math.sin(yaw) * dist * Math.cos(p),
    ty: OUT_EYE.y + Math.cos(yaw) * dist * Math.cos(p),
    dist,
    pitch: (p * 180) / Math.PI,
    heading: (yaw * 180) / Math.PI,
    fov: FOV_AIR,
  };
  const ph = Math.asin(c.f[1]) + p;
  const k = F / F_AIR;
  const cs = Math.cos(ph);
  const sn = Math.sin(ph);
  const a = -sn / F_AIR;
  const b = cs + (960 * sn) / F_AIR;
  const m = [k, 0, 0, 0, 540 * a, 960 * a + k * cs, 0, a, 0, 0, 1, 0, 540 * b - 540 * k, 960 * b - 960 * k * cs + k * F_AIR * sn, 0, b];
  return { cam, m3d: `matrix3d(${m.map((v) => v.toFixed(8)).join(",")})` };
};

// ===================================================================================================================
// THE HALL (floor, the north glass wall, the tent roof) — WeatherDelaysCut's hall, drawn from beside the glass
// ===================================================================================================================
const HALL = { zWall: 48, halfW: 42, peak: 35, valley: 29.5, edge: 17, mastXs: [-5, 17], mastDZ: 18, R: 12.5 } as const;
const MASTS: { x: number; z: number }[] = (() => {
  const m: { x: number; z: number }[] = [];
  for (let k = 0; k < 4; k++) for (const x of HALL.mastXs) m.push({ x, z: HALL.zWall - 6 - k * HALL.mastDZ });
  return m;
})();
const roofH = (x: number, z: number) => {
  const base = lerp(HALL.valley, HALL.edge, smooth(24, HALL.halfW, Math.abs(x - 6)));
  let t = 0;
  for (const m of MASTS) {
    const r = Math.hypot(x - m.x, (z - m.z) * 0.92);
    const k = Math.max(0, 1 - r / HALL.R);
    t = Math.max(t, k * k);
  }
  return base + (HALL.peak - HALL.valley) * t;
};
const HZ: [number, number, number] = [236, 221, 194];
const mixC = (a: number[], b: number[], t: number) => `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
const hazeAt = (d: number, k = 1) => 0.88 * (1 - Math.exp((-d * k) / 105));
const hex3 = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const fillPoly = (ctx: CanvasRenderingContext2D, pts: P2[]) => {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
};
const projAll = (c: ICam, pts: V3[]): P2[] | null => {
  const o: P2[] = [];
  for (const p of pts) {
    const q = proj(c, p);
    if (!q) return null;
    o.push(q);
  }
  return o;
};

const drawHall = (ctx: CanvasRenderingContext2D, c: ICam, f: number) => {
  ctx.clearRect(0, 0, 1080, 1920);
  const zW = HALL.zWall;
  // ---- the floor (polished warm stone), the glass mirrored in it, the low sun's patches sliding slowly ----
  {
    const pts = projAll(c, [
      [-HALL.halfW, 0, c.eye[2] + 0.6],
      [HALL.halfW, 0, c.eye[2] + 0.6],
      [HALL.halfW, 0, zW],
      [-HALL.halfW, 0, zW],
    ]);
    if (pts) {
      const far = proj(c, [c.eye[0], 0, zW]);
      const g = ctx.createLinearGradient(0, far ? far.y : 1300, 0, 1920);
      g.addColorStop(0, mixC(hex3("#C2A684"), HZ, 0.4));
      g.addColorStop(0.35, "#AE9172");
      g.addColorStop(1, "#86684F");
      ctx.fillStyle = g;
      fillPoly(ctx, pts);
      if (far) {
        const rg = ctx.createLinearGradient(0, far.y, 0, far.y + 320);
        rg.addColorStop(0, "rgba(246,232,206,0.6)");
        rg.addColorStop(1, "rgba(246,232,206,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(0, far.y, 1080, 320);
      }
      const drift = f * 0.012;
      for (let k = 0; k < 4; k++) {
        const z0 = c.eye[2] + 1 + k * 2.6 + drift;
        const q = projAll(c, [
          [-HALL.halfW, 0, z0],
          [HALL.halfW, 0, z0 + 1.6],
          [HALL.halfW, 0, z0 + 2.9],
          [-HALL.halfW, 0, z0 + 1.3],
        ]);
        if (!q) continue;
        ctx.fillStyle = `rgba(250,232,196,${f3(0.18 * (1 - k * 0.12))})`;
        fillPoly(ctx, q);
      }
    }
  }
  // ---- the north glass wall: mullions, transoms, the kerb, a faint sheen ----
  {
    const N = 60;
    const top: P2[] = [];
    for (let i = 0; i <= N; i++) {
      const x = -HALL.halfW + (2 * HALL.halfW * i) / N;
      const q = proj(c, [x, roofH(x, zW), zW]);
      if (q) top.push(q);
    }
    const bl = proj(c, [HALL.halfW, 0, zW]);
    const br = proj(c, [-HALL.halfW, 0, zW]);
    if (bl && br && top.length > 2) {
      ctx.fillStyle = "rgba(246,234,212,0.08)";
      fillPoly(ctx, [...top, bl, br]);
      const fogW = hazeAt(zW - c.eye[2]);
      ctx.strokeStyle = mixC(hex3("#5E4836"), HZ, fogW * 0.7);
      for (let x = -HALL.halfW + 1; x <= HALL.halfW; x += 4.5) {
        const a = proj(c, [x, 0, zW]);
        const b = proj(c, [x, roofH(x, zW), zW]);
        if (!a || !b) continue;
        ctx.lineWidth = Math.max(0.8, (F * 0.16) / a.d);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let y = 6; y < HALL.peak; y += 6) {
        ctx.beginPath();
        let on = false;
        for (let i = 0; i <= N; i++) {
          const x = -HALL.halfW + (2 * HALL.halfW * i) / N;
          const q = y < roofH(x, zW) - 0.3 ? proj(c, [x, y, zW]) : null;
          if (!q) {
            on = false;
            continue;
          }
          if (!on) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
          on = true;
        }
        ctx.lineWidth = Math.max(0.7, (F * 0.11) / (zW - c.eye[2]));
        ctx.stroke();
      }
      const base = projAll(c, [
        [-HALL.halfW, 0, zW],
        [HALL.halfW, 0, zW],
        [HALL.halfW, 0.9, zW],
        [-HALL.halfW, 0.9, zW],
      ]);
      if (base) {
        ctx.fillStyle = mixC(hex3("#7A624C"), HZ, fogW * 0.7);
        fillPoly(ctx, base);
      }
    }
  }
  // ---- the tent-fabric roof seen from below (only its near edge shows from here) ----
  {
    const NX = 40;
    const NZ = 16;
    const z0 = c.eye[2] - 6;
    const quads: { d: number; pts: P2[]; col: string }[] = [];
    const L = norm([-0.75, -0.45, 0.35]);
    for (let j = 0; j < NZ; j++) {
      const za = z0 + ((zW - z0) * j) / NZ;
      const zb = z0 + ((zW - z0) * (j + 1)) / NZ;
      for (let i = 0; i < NX; i++) {
        const xa = -HALL.halfW + (2 * HALL.halfW * i) / NX;
        const xb = -HALL.halfW + (2 * HALL.halfW * (i + 1)) / NX;
        const P: V3[] = [
          [xa, roofH(xa, za), za],
          [xb, roofH(xb, za), za],
          [xb, roofH(xb, zb), zb],
          [xa, roofH(xa, zb), zb],
        ];
        const pts = projAll(c, P);
        if (!pts) continue;
        if (pts.every((p) => p.y < -40) || pts.every((p) => p.y > 1960) || pts.every((p) => p.x < -40) || pts.every((p) => p.x > 1120)) continue;
        const xm = (xa + xb) / 2;
        const zm = (za + zb) / 2;
        const hx = (roofH(xm + 0.3, zm) - roofH(xm - 0.3, zm)) / 0.6;
        const hz = (roofH(xm, zm + 0.3) - roofH(xm, zm - 0.3)) / 0.6;
        const n = norm([hx, -1, hz]);
        const hgt = clamp01((roofH(xm, zm) - HALL.valley) / (HALL.peak - HALL.valley));
        const lit = clamp01(0.32 + 0.5 * dot(n, L) + 0.42 * hgt * hgt);
        const d = (pts[0].d + pts[2].d) / 2;
        const base = [lerp(150, 252, lit), lerp(133, 246, lit), lerp(110, 233, lit)];
        quads.push({ d, pts, col: mixC(base, HZ, hazeAt(d, 0.9)) });
      }
    }
    quads.sort((a, b) => b.d - a.d);
    ctx.lineJoin = "round";
    for (const q of quads) {
      ctx.fillStyle = q.col;
      ctx.strokeStyle = q.col;
      ctx.lineWidth = 1.2;
      fillPoly(ctx, q.pts);
      ctx.stroke();
    }
  }
};

/** the hall canvas, soft: the focus is on the phone a forearm's length from the lens */
const HallCanvas: React.FC<{ c: ICam; f: number }> = ({ c, f }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = 1080;
    cv.height = 1920;
    drawHall(cv.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D, c, f);
  }, [c, f]);
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, filter: "blur(7px)" }} />;
};

// ===================================================================================================================
// THE PHONE'S MOVE: one pre-rolled rise + tilt-up (critically damped), then a slow creep closer
// ===================================================================================================================
/** the phone's pivot: the radar image's centre (phone px) */
const PIV = { x: PHONE_W / 2, y: SCREEN.y + THREAD.b2.y + THREAD.b2.h / 2 };
const PERSP = 1250;
const REST = { y: 828, tilt: 18.5, rz: -0.8, k: 0.94 };
const START = { y: 2330, tilt: 38, rz: -5, k: 0.915 };
const RISE_A = 0.31; // the damped rise's rate (per frame); ~97 % home by f15
const RISE_T0 = 1.6; // frames of pre-roll before f0
const riseAt = (f: number) => {
  const t = Math.max(0, f + RISE_T0);
  return 1 - (1 + RISE_A * t) * Math.exp(-RISE_A * t);
};
const phoneAt = (f: number) => {
  const u = riseAt(f);
  const creep = smooth(-10, DURATION + 30, f); // the hold's slow push in (already under way, still moving at f52)
  return {
    y: lerp(START.y, REST.y, u) - 10 * creep,
    tilt: lerp(START.tilt, REST.tilt, u) - 0.5 * creep,
    rz: lerp(START.rz, REST.rz, u) + 0.5 * creep,
    k: lerp(START.k, REST.k, u) + 0.02 * creep,
  };
};

// the thread's beats (frames)
const B1_IN = [3, 12] as const; // the plain delay bubble lands ("customers" f6)
const B2_IN = [22, 31] as const; // the image bubble arrives ("weather" f23)
const SWEEP = [27, 43] as const; // the radar sweep about ORD: constant rate; the line is painted f28-f34 ("radar" f32)
const DRIFT0 = 30; // the radar's story clock at f0

const RadarMapOnThePhone: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const c = camAt(f);
  const out = outsideCam(c);
  const view = makeView(out.cam);
  const S = S0 + f;
  const cells: StormState[] = OUT_SPECS.map((s) => ({ ...s }));
  const g2 = Math.floor(f / 2);
  const grx = (hash01(g2 + 101) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 107) * 2 - 1) * GRAIN.travel;
  const ph = phoneAt(f);
  const b1 = easeOut((f - B1_IN[0]) / (B1_IN[1] - B1_IN[0]));
  const b2 = easeOut((f - B2_IN[0]) / (B2_IN[1] - B2_IN[0]));
  // constant-rate sweep, with a 2-frame ease into its speed
  const sw = (f - SWEEP[0]) / (SWEEP[1] - SWEEP[0]);
  const ramp = 2 / (SWEEP[1] - SWEEP[0]);
  const reveal = sw <= 0 ? 0 : sw >= 1 ? 1 : sw < ramp ? (sw * sw) / (2 * ramp) : (sw - ramp / 2) / (1 - ramp / 2);
  const glow = 0.85 + 0.15 * smooth(0, DURATION, f);
  return (
    <AbsoluteFill style={{ backgroundColor: "#E9D6B4", overflow: "hidden" }}>
      {/* outside the glass: the world (sky, plains, the boiling storm on the horizon), soft behind the focus */}
      <AbsoluteFill style={{ transform: out.m3d, transformOrigin: "0 0", filter: "blur(3.5px)" }}>
        <AirStage S={S} v={view} cells={cells} rampActive={0} terminalScale={1} dust={0} grade={0} highCloud={0.6} over={<AnvilSheet v={view} S={S} cell={cells[0]} />} />
      </AbsoluteFill>
      {/* the hall: the north glass wall, the floor, the roof's edge */}
      <HallCanvas c={c} f={f} />
      {/* the phone */}
      <div
        style={{
          position: "absolute",
          left: 540 - PIV.x,
          top: ph.y - PIV.y,
          width: PHONE_W,
          transformOrigin: `${f3(PIV.x)}px ${f3(PIV.y)}px`,
          transform: `perspective(${PERSP}px) rotateX(${f3(ph.tilt)}deg) rotateZ(${f3(ph.rz)}deg) scale(${f3(ph.k)})`,
        }}
      >
        <Phone variant="radar" reveal={reveal} drift={DRIFT0 + f} b1={b1} b2={b2} glow={glow} shadow={false} sun={-120 + f * 2.2} id="rmp" />
      </div>
      {/* the warm film grade, the brown vignette, stout grain on twos (the world's recipe) */}
      <AbsoluteFill style={{ mixBlendMode: "soft-light", background: `linear-gradient(to bottom, ${GRADE.top} 0%, ${GRADE.mid} 45%, ${GRADE.bottom} 100%)` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 104% 100% at 50% 46%, rgba(${OCEAN.vignette},0) 45%, rgba(${OCEAN.vignette},0.14) 72%, rgba(${OCEAN.vignette},0.3) 100%)`,
        }}
      />
      <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default RadarMapOnThePhone;
