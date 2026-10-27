// ---------------------------------------------------------------------------------------------------------------
// WeatherDelaysCut (scott-weather-fired, suggested cut 7 "48_WeatherDelaysCut"). Cheeky Pint style, the realistic
// "at sea" variant carried into the air (styles/cheeky-pint.md § Realistic ocean variant; the shared world
// denverWorld.tsx, read-only, for the storm outside the windows). Opaque 1080x1920, 23.976 fps, 165 frames.
// A new close scene in the world's look (not the area / ring cameras): inside DEN's Jeppesen Terminal.
//
// CHECK LINE: "on Denver's departure board, most of the flights delayed by the storms flip back to on time — half of
// them, then three quarters."
//
// THE LINE: "We could probably reduce 50 to 75 percent of the weather-impacted delays in Denver in the summer by using
// this kind of technology." (then on camera: "I mean, it's just transformational.")
// WORD -> FRAME: We 0 · could 4 · probably 6 · reduce 16 · 50 29 · to 37 · 75 40 · percent 49 · of 59 · the 66 ·
//                weather 69 · -impacted 75 · delays 87 · in 92 · Denver 97 · in 102 · the 106 · summer 109 · by 115 ·
//                using 127 · this 135 · kind 146 · of 154 · technology 156
// DURATION: slot 48.799 -> 55.681 s = 6.882 s x 23.976 = 165 frames (f0..f164).
//
// THE MOTION: a split-flap DEPARTURES board (warm dark-brown housing, cream flaps, 8 United rows from DEN: TIME /
// FLIGHT / DESTINATION / STATUS, a small flap clock in its title band) hangs on two cables in the Great Hall, seen from
// the floor at an angle so the STATUS column is nearest and sits at the frame's middle (rows y ~600-1070); the
// tent-fabric peaks of the roof glow soft in the haze above it, the low west sun lays warm bands across the board and
// floor, and through the far glass wall a mature thunderstorm tower boils north of the field (the world's cells and
// storm life, `boil`; its dark base and rain under the board, a towering cumulus to the left). One move f0 -> end: a
// slow push in with a slight glide right along the board (pre-rolled: moving at f0, still creeping at f164). All 8
// statuses start DELAYED in amber. On "reduce 50" the STATUS flaps cascade row by row (each character flips through
// 2-3 flaps, 3 frames a flap, 0.8 f stagger along the row): rows 1-4 start f14 / f17 / f20 / f23 and are ON TIME in
// cream by f37 ("to") = half; on "75 percent" rows 5-6 start f39 / f42 and land by f56 = three quarters; rows 7-8
// stay DELAYED, amber. Then a settled, living frame: the camera creeps, the board clock ticks 3:58 -> 3:59 (f100;
// the TIME column is off frame by then, so the brief's "a flap of the time column" ticks here), the sun bands and
// floor patches drift, the storm keeps boiling. Nothing new after f56.
// OUTSIDE: denverWorld's AirStage (read-only) from a raised eye (0.22 mi, out of the dense ground haze) looking along
// the interior camera's heading; its picture is mapped into the interior lens by an exact pitch homography (CSS
// matrix3d), so horizon and storms sit right behind the glass. ctx.filter is not used (headless drops it); blurs are
// CSS on DOM layers.
// AMBER = the weather's reach (the clip's meaning): here the weather-delayed statuses; nothing else is amber.
// Text: only the board's own text (title, column heads, flight rows); no labels, no figure on screen.
// FLAP CONVENTION (cause before effect): a flap falls from the hinge at the cell's middle; the next character's top
// shows behind it from its first frame, its back (the next character's bottom) lands over the old bottom at 180 deg.
//
// SOURCES: United (UA) departures from DEN to its real nonstop destinations (Chicago O'Hare, San Francisco, Houston,
// Newark, Los Angeles, Seattle, Washington Dulles, Aspen); flight numbers and times are plausible, not a real day's
// schedule. "50 to 75 percent" is the speaker's estimate (not on screen; the board shows 4/8 then 6/8 back on time).
// The Jeppesen Terminal's tent-fabric roof (rows of white peaks) and glass end walls from its published design.
// ---------------------------------------------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, FONT_NUM, GRAIN, GROUND, bloomFilter, labelWidth } from "../kits/cheeky-pint/stoutShared";
import { GRADE, OCEAN } from "../kits/cheeky-pint/oceanShared";
import { AirStage, CELL_DRIFT, hash01, makeView, type DenCam, type StormSpec, type StormState } from "./denverWorld";

export const FPS = 24000 / 1001;
export const DURATION = 165;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const u = clamp01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ===================================================================================================================
// THE INTERIOR CAMERA (metres; X right, Y up, Z ahead = north). One lens shared with the outside world (same F).
// ===================================================================================================================
type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
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

// ===================================================================================================================
// THE BOARD (board-local metres: bu right along the face, bv down from the face's top edge, bn toward the viewer)
// ===================================================================================================================
const PX = 0.3; // cell pitch
const FW = 0.272; // flap width
const FH = 0.37; // flap height
const PY = 0.45; // row pitch
const GAP = 0.2; // extra housing between column blocks
const MARGIN = 0.48;
const TITLE_CAP = 0.3;
const HEAD_CAP = 0.115;
const ROWS_TOP = 1.02;
const BOTTOM = 0.34;
const DEPTH = 0.42; // housing depth behind the face
const RECESS = 0.035; // the flaps sit this far behind the face
const COLS = [
  { key: "time", n: 5, head: "TIME" },
  { key: "flight", n: 7, head: "FLIGHT" },
  { key: "dest", n: 11, head: "DESTINATION" },
  { key: "status", n: 7, head: "STATUS" },
] as const;
type ColKey = (typeof COLS)[number]["key"];
const COL_X: Record<ColKey, number> = (() => {
  const o = {} as Record<ColKey, number>;
  let x = MARGIN;
  for (const c of COLS) {
    o[c.key] = x;
    x += c.n * PX + GAP;
  }
  return o;
})();
const WB = COL_X.status + 6 * PX + FW + MARGIN;
const HB = ROWS_TOP + 7 * PY + FH + BOTTOM;
const BU_S = COL_X.status + (6 * PX + FW) / 2; // the STATUS column's centre
const BV_C = ROWS_TOP + (7 * PY + FH) / 2; // the rows' middle
/** the world point of (BU_S, BV_C): the subject */
const A: V3 = [0, 5.6, 14];
const BETA = (29 * Math.PI) / 180; // the board's yaw: its left end recedes
const UB: V3 = [Math.cos(BETA), 0, -Math.sin(BETA)];
const NB: V3 = [-Math.sin(BETA), 0, -Math.cos(BETA)];
const bp = (bu: number, bv: number, bn = 0): V3 => add(add(add(A, mul(UB, bu - BU_S)), [0, BV_C - bv, 0]), mul(NB, bn));

type Row = { time: string; flight: string; dest: string };
const ROWS: Row[] = [
  { time: "4:05P", flight: "UA 1453", dest: "CHICAGO" },
  { time: "4:12P", flight: "UA 2210", dest: "SAN DIEGO" },
  { time: "4:20P", flight: "UA 388", dest: "HOUSTON" },
  { time: "4:26P", flight: "UA 1719", dest: "NEWARK" },
  { time: "4:33P", flight: "UA 652", dest: "LOS ANGELES" },
  { time: "4:40P", flight: "UA 2047", dest: "SEATTLE" },
  { time: "4:48P", flight: "UA 1136", dest: "WASHINGTON" },
  { time: "4:55P", flight: "UA 5671", dest: "ASPEN" },
];
const DELAYED = "DELAYED";
const ONTIME = "ON TIME";
/** status rows that flip back to ON TIME and when their cascade starts (f): half by "to" f37, 3/4 by f56 */
const ROW_FLIP: (number | null)[] = [14, 17, 20, 23, 39, 42, null, null];
const FLIP = 3; // frames per flap
const STAGGER = 0.8; // frames between neighbouring characters of a row
const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.";
const drumPrev = (ch: string, k: number) => {
  const i = DRUM.indexOf(ch);
  return DRUM[(((i < 0 ? 0 : i) - k) % DRUM.length + DRUM.length) % DRUM.length];
};

/** One cell's flap programme: seq[0] shown until t0, then one flap every FLIP frames to seq[n]. */
type Prog = { t0: number; seq: string[]; amber0: boolean };
const progFor = (row: number, col: ColKey, i: number): Prog => {
  const r = ROWS[row];
  if (col === "status") {
    const t = ROW_FLIP[row];
    if (t === null) return { t0: 1e9, seq: [DELAYED[i]], amber0: true };
    const to = ONTIME[i];
    const n = 2 + (hash01(row * 13.1 + i * 3.7) < 0.5 ? 1 : 0);
    const seq = [DELAYED[i]];
    for (let k = n - 1; k >= 1; k--) seq.push(drumPrev(to, k));
    seq.push(to);
    return { t0: t + i * STAGGER, seq, amber0: true };
  }
  const text = col === "time" ? r.time : col === "flight" ? r.flight : r.dest;
  const ch = text[i] ?? " ";
  return { t0: 1e9, seq: [ch], amber0: false };
};
type CellNow = { cur: string; next: string | null; theta: number; curAmber: boolean };
/** the board's own clock, flaps in the title band right-aligned over the STATUS column: ambient life, 3:58 -> 3:59 */
const CLOCK = "3:58";
const CLOCK_I0 = 7 - CLOCK.length; // status-column cell index of its first character
const CLOCK_BV = ROWS_TOP - 0.57; // its row's centre (level with the title)
const CLOCK_TICK = 100;
const clockProg = (j: number): Prog => (j === 3 ? { t0: CLOCK_TICK, seq: ["8", "9"], amber0: false } : { t0: 1e9, seq: [CLOCK[j]], amber0: false });
const cellNow = (p: Prog, f: number): CellNow => {
  const n = p.seq.length - 1;
  if (f < p.t0 || n === 0) return { cur: p.seq[0], next: null, theta: 0, curAmber: p.amber0 };
  const e = (f - p.t0) / FLIP;
  const k = Math.floor(e);
  if (k >= n) return { cur: p.seq[n], next: null, theta: 0, curAmber: false };
  const ph = e - k;
  return { cur: p.seq[k], next: p.seq[k + 1], theta: 180 * Math.pow(ph, 1.2), curAmber: p.amber0 && k === 0 };
};

// ===================================================================================================================
// THE CAMERA TRACK: one pre-rolled push + glide (moving at f0, still creeping at f164)
// ===================================================================================================================
const EYE0: V3 = [-2.1, 1.7, -1.6];
const EYE1: V3 = [0.5, 1.7, 1.0];
const TGT0: V3 = [-1.7, 4.65, 14];
const TGT1: V3 = [0.25, 4.45, 14];
const camAt = (f: number) => {
  const t = clamp01((f + 60) / (DURATION + 120));
  const u = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return makeICam(lerp3(EYE0, EYE1, u), lerp3(TGT0, TGT1, u));
};

// ===================================================================================================================
// THE STORM OUTSIDE (the world's cells and storm life; looking north from the terminal's north glass)
// ===================================================================================================================
const S0 = 300; // the outside's story clock at f0 (any S: the cells boil on it)
const OUT_EYE = { x: 0, y: 0.2, z: 0.22 }; // raised out of the densest ground haze so the cells keep their modelling
const FOV_AIR = 72; // wide enough to fill the glass up to the roof once pitched up (see outsideCam)
const F_AIR = 960 / Math.tan((FOV_AIR * Math.PI) / 360);
const OUT_SPECS: (StormSpec & { growth: number; storminess?: number })[] = [
  { id: "N", x: 2.7 - CELL_DRIFT.vx * S0, y: 14 - CELL_DRIFT.vy * S0, seed: 61, size: 1.15, ...CELL_DRIFT, growth: 1, storminess: 1 },
  { id: "cuW", x: -3.6 - CELL_DRIFT.vx * S0, y: 17 - CELL_DRIFT.vy * S0, seed: 67, size: 0.8, ...CELL_DRIFT, growth: 0.42 },
  { id: "NW", x: -10 - CELL_DRIFT.vx * S0, y: 21 - CELL_DRIFT.vy * S0, seed: 73, size: 0.9, ...CELL_DRIFT, growth: 0.85 },
];
/** The outside camera (pitch ~0, the interior's heading) and the homography that turns its picture into the
 *  interior camera's view (pitched up, longer lens): CSS matrix3d about the frame's top-left. Exact for a rotation. */
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
  const ph = Math.asin(c.f[1]) + p; // rotate the outside view up by the interior pitch (+ its own tiny down-tilt)
  const k = F / F_AIR;
  const cs = Math.cos(ph);
  const sn = Math.sin(ph);
  const a = -sn / F_AIR;
  const b = cs + (960 * sn) / F_AIR;
  const m = [k, 0, 0, 0, 540 * a, 960 * a + k * cs, 0, a, 0, 0, 1, 0, 540 * b - 540 * k, 960 * b - 960 * k * cs + k * F_AIR * sn, 0, b];
  return { cam, m3d: `matrix3d(${m.map((v) => v.toFixed(8)).join(",")})` };
};

// ===================================================================================================================
// THE HALL (roof, far glass wall, floor): one canvas, soft in the haze
// ===================================================================================================================
const HALL = { zWall: 48, halfW: 42, peak: 35, valley: 29.5, edge: 17, mastXs: [-5, 17], mastDZ: 18, R: 12.5 } as const;
const MASTS: { x: number; z: number }[] = (() => {
  const m: { x: number; z: number }[] = [];
  for (let k = 0; k < 4; k++) for (const x of HALL.mastXs) m.push({ x: x + (k % 2) * 0, z: HALL.zWall - 6 - k * HALL.mastDZ });
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
const HZ: [number, number, number] = [236, 221, 194]; // the hall's warm haze
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
  // ---- the floor (polished warm stone), its window reflection and sun patches ----
  {
    const pts = projAll(c, [
      [-HALL.halfW, 0, c.eye[2] + 2.5],
      [HALL.halfW, 0, c.eye[2] + 2.5],
      [HALL.halfW, 0, zW],
      [-HALL.halfW, 0, zW],
    ]);
    if (pts) {
      const far = proj(c, [0, 0, zW]);
      const near = proj(c, [0, 0, 6]);
      const g = ctx.createLinearGradient(0, far ? far.y : 1000, 0, near ? near.y : 1920);
      g.addColorStop(0, mixC(hex3("#C2A684"), HZ, 0.45));
      g.addColorStop(0.3, "#AE9172");
      g.addColorStop(1, "#86684F");
      ctx.fillStyle = g;
      fillPoly(ctx, pts);
      // the far glass wall mirrored in the polish: a soft bright band under its foot
      if (far) {
        const rg = ctx.createLinearGradient(0, far.y, 0, far.y + 260);
        rg.addColorStop(0, "rgba(246,232,206,0.55)");
        rg.addColorStop(1, "rgba(246,232,206,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(0, far.y, 1080, 260);
      }
      // the far wall's mullions mirrored in the polish (soft, fading down)
      for (let x = -HALL.halfW + 1; x <= HALL.halfW; x += 4.5) {
        const a = proj(c, [x, 0, zW]);
        const b = proj(c, [x, -7, zW]);
        if (!a || !b) continue;
        const lg = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        lg.addColorStop(0, "rgba(94,72,54,0.32)");
        lg.addColorStop(1, "rgba(94,72,54,0)");
        ctx.strokeStyle = lg;
        ctx.lineWidth = Math.max(1, (F * 0.22) / a.d);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      // low sun through the west glass: long warm patches on the floor (slowly sliding)
      const drift = f * 0.012;
      for (let k = 0; k < 6; k++) {
        const z0 = 6 + k * 7.5 + drift;
        const q = projAll(c, [
          [-HALL.halfW, 0, z0],
          [HALL.halfW, 0, z0 + 3.2],
          [HALL.halfW, 0, z0 + 7.4],
          [-HALL.halfW, 0, z0 + 4.2],
        ]);
        if (!q) continue;
        ctx.fillStyle = `rgba(250,232,196,${f3(0.16 * (1 - k * 0.1))})`;
        fillPoly(ctx, q);
      }
    }
  }
  // ---- the far glass wall: base band, mullions and transoms, the glass sheen ----
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
      // the glass: a faint warm sheen (reflection) over the view
      ctx.fillStyle = "rgba(246,234,212,0.07)";
      fillPoly(ctx, [...top, bl, br]);
      const fogW = hazeAt(zW - c.eye[2]);
      const mull = mixC(hex3("#5E4836"), HZ, fogW * 0.85);
      ctx.strokeStyle = mull;
      // verticals every 3 m
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
      // transoms every 4.5 m (clipped under the roof line)
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
      // the base: doors and the kerb under the glass (warm, hazy)
      const base = projAll(c, [
        [-HALL.halfW, 0, zW],
        [HALL.halfW, 0, zW],
        [HALL.halfW, 0.9, zW],
        [-HALL.halfW, 0.9, zW],
      ]);
      if (base) {
        ctx.fillStyle = mixC(hex3("#7A624C"), HZ, fogW * 0.8);
        fillPoly(ctx, base);
      }
    }
  }
  // ---- the tent-fabric roof seen from below: a height field of peaks, lit from the west glass, veiled by the haze ----
  {
    const NX = 46;
    const NZ = 44;
    const z0 = c.eye[2] + 4;
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
        // the fabric glows where it is thin and high (the sky through it), the folds toward the valleys go grey
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
    // the fabric's radial seams and cables converging on each peak, and the steel ring at the apex
    for (const m of MASTS) {
      const ap = proj(c, [m.x, HALL.peak, m.z]);
      if (!ap || ap.y < -300 || ap.x < -300 || ap.x > 1380) continue;
      const fogM = hazeAt(ap.d, 0.9);
      for (let a = 0; a < 18; a++) {
        const ang = (a / 18) * Math.PI * 2 + 0.1;
        ctx.beginPath();
        let on = false;
        for (let t = 0; t <= 12; t++) {
          const r = 0.5 + (HALL.R * 0.92 - 0.5) * (t / 12);
          const x = m.x + r * Math.cos(ang);
          const z = m.z + (r * Math.sin(ang)) / 0.92;
          if (z > zW) break;
          const q = proj(c, [x, roofH(x, z) - 0.05, z]);
          if (!q) continue;
          if (!on) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
          on = true;
        }
        ctx.strokeStyle = mixC([120, 100, 80], HZ, fogM);
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const rr = (F * 0.7) / ap.d;
      ctx.fillStyle = mixC([110, 90, 70], HZ, fogM);
      ctx.beginPath();
      ctx.ellipse(ap.x, ap.y, rr, rr * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // the edge beam along the top of the glass wall
    {
      ctx.beginPath();
      let on = false;
      for (let i = 0; i <= 80; i++) {
        const x = -HALL.halfW + (2 * HALL.halfW * i) / 80;
        const q = proj(c, [x, roofH(x, zW) - 0.2, zW]);
        if (!q) continue;
        if (!on) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
        on = true;
      }
      ctx.strokeStyle = mixC([96, 74, 56], HZ, hazeAt(zW - c.eye[2]));
      ctx.lineWidth = (F * 0.5) / (zW - c.eye[2]);
      ctx.stroke();
    }
  }
};

const HallCanvas: React.FC<{ c: ICam; f: number }> = ({ c, f }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = 1080;
    cv.height = 1920;
    drawHall(cv.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D, c, f);
  }, [c, f]);
  return <canvas ref={ref} width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, filter: "blur(2.2px)" }} />;
};

// ===================================================================================================================
// THE BOARD, drawn in SVG through the camera: each flap cell gets the affine of its own projected frame
// ===================================================================================================================
const MM = 1000; // cell-local units: millimetres
const HW = (FW * MM) / 2;
const HH = (FH * MM) / 2;
const GLYPH_PX = (0.66 * FH * MM) / 0.718; // cap height 66 % of the flap
const GLYPH_SX = 0.8; // split-flap condensed
const FLAP = { top: "#45311F", bot: "#3B2A1C", line: "#22150B", edge: "#533B28" } as const;
const HOUSING = { face: "#4D3626", faceLo: "#432E20", rim: "#6A4C35", side: "#35251A", recess: COLOR.inkDark } as const;

type Mat = [number, number, number, number, number, number];
const matStr = (m: Mat) => `matrix(${m.map(f3).join(",")})`;
/** the affine of the board plane at (bu, bv, bn): local mm (x right, y down) -> screen */
const cellMat = (c: ICam, bu: number, bv: number, bn: number): Mat | null => {
  const o = proj(c, bp(bu, bv, bn));
  const xa = proj(c, bp(bu - FW / 2, bv, bn));
  const xb = proj(c, bp(bu + FW / 2, bv, bn));
  const ya = proj(c, bp(bu, bv - FH / 2, bn));
  const yb = proj(c, bp(bu, bv + FH / 2, bn));
  if (!o || !xa || !xb || !ya || !yb) return null;
  return [(xb.x - xa.x) / (FW * MM), (xb.y - xa.y) / (FW * MM), (yb.x - ya.x) / (FH * MM), (yb.y - ya.y) / (FH * MM), o.x, o.y];
};
/** the falling flap's affine at angle theta (deg): local (x mm, s 0..1 from the hinge to the free edge) -> screen */
const flapMat = (c: ICam, bu: number, bv: number, bn: number, theta: number): { ex: [number, number]; es: [number, number]; o: P2 } | null => {
  const th = (theta * Math.PI) / 180;
  const o = proj(c, bp(bu, bv, bn));
  const xa = proj(c, bp(bu - FW / 2, bv, bn));
  const xb = proj(c, bp(bu + FW / 2, bv, bn));
  const e = proj(c, bp(bu, bv - (FH / 2) * Math.cos(th), bn + (FH / 2) * Math.sin(th)));
  if (!o || !xa || !xb || !e) return null;
  return { ex: [(xb.x - xa.x) / (FW * MM), (xb.y - xa.y) / (FW * MM)], es: [e.x - o.x, e.y - o.y], o };
};

const Glyph: React.FC<{ ch: string; fill: string }> = ({ ch, fill }) =>
  ch === " " ? null : (
    <text
      x={0}
      y={f3(0.718 * GLYPH_PX * 0.5)}
      transform={`scale(${GLYPH_SX},1)`}
      textAnchor="middle"
      fontFamily={FONT_NUM}
      fontWeight={700}
      fontSize={f3(GLYPH_PX)}
      fill={fill}
    >
      {ch}
    </text>
  );
const AMBER_GLYPH = COLOR.amberTop;
const CREAM_GLYPH = COLOR.inkCream;

/** A flap face (one half): rect from the hinge. half "top" spans y -HH..0, "bot" 0..HH (cell-local mm). */
const HalfFace: React.FC<{ half: "top" | "bot"; shade?: number }> = ({ half, shade = 0 }) => (
  <>
    <rect x={-HW} y={half === "top" ? -HH : 0} width={2 * HW} height={HH} rx={10} fill={half === "top" ? FLAP.top : FLAP.bot} />
    {shade > 0 ? <rect x={-HW} y={half === "top" ? -HH : 0} width={2 * HW} height={HH} rx={10} fill={COLOR.shadow} opacity={f3(shade)} /> : null}
  </>
);

type CellJob = { key: string; m: Mat; now: CellNow; flap: ReturnType<typeof flapMat>; bv: number };

const Board: React.FC<{ c: ICam; f: number; clipId: string }> = ({ c, f, clipId }) => {
  const P = (bu: number, bv: number, bn = 0) => proj(c, bp(bu, bv, bn));
  const poly = (pts: (P2 | null)[]) => (pts.every(Boolean) ? (pts as P2[]).map((p) => `${f3(p.x)},${f3(p.y)}`).join(" ") : "");
  // housing faces
  const face = poly([P(0, 0), P(WB, 0), P(WB, HB), P(0, HB)]);
  const side = poly([P(WB, 0), P(WB, 0, -DEPTH), P(WB, HB, -DEPTH), P(WB, HB)]);
  const under = poly([P(0, HB), P(WB, HB), P(WB, HB, -DEPTH), P(0, HB, -DEPTH)]);
  const fp0 = P(0, 0);
  const fp1 = P(0, HB);
  // the board hangs from the roof on two steel cables (from its top, up out of the frame)
  const cables = [0.2, 0.8].map((t) => {
    const a = P(WB * t, 0, -DEPTH / 2);
    const top = proj(c, add(bp(WB * t, 0, -DEPTH / 2), [0, 24, 0]));
    const w = a ? Math.max(1.2, (F * 0.03) / a.d) : 1;
    return a && top ? { a, top, w } : null;
  });
  // recess strips behind each column block
  const recesses = COLS.map((col) => {
    const x0 = COL_X[col.key] - 0.03;
    const x1 = COL_X[col.key] + (col.n - 1) * PX + FW + 0.03;
    const y0 = ROWS_TOP - 0.03;
    const y1 = ROWS_TOP + 7 * PY + FH + 0.03;
    return poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)]);
  });
  {
    const x0 = COL_X.status + CLOCK_I0 * PX - 0.03;
    const x1 = COL_X.status + 6 * PX + FW + 0.03;
    recesses.push(poly([P(x0, CLOCK_BV - FH / 2 - 0.03), P(x1, CLOCK_BV - FH / 2 - 0.03), P(x1, CLOCK_BV + FH / 2 + 0.03), P(x0, CLOCK_BV + FH / 2 + 0.03)]));
  }
  // the sun through the west glass: soft vertical bands of light across the face, sliding slowly
  const sunBands = [-0.6, 2.1, 5.4, 8.6].map((u0, i) => {
    const u = u0 + f * 0.006;
    const w = 1.1 + 0.25 * i;
    const sk = 0.55; // the bands lean (transom shadows of a low sun)
    return poly([P(u, 0, 0.002), P(u + w, 0, 0.002), P(u + w + sk, HB, 0.002), P(u + sk, HB, 0.002)]);
  });

  // cells
  const jobs: CellJob[] = [];
  for (let j = 0; j < CLOCK.length; j++) {
    const bu = COL_X.status + (CLOCK_I0 + j) * PX + FW / 2;
    const m = cellMat(c, bu, CLOCK_BV, -RECESS);
    if (!m) continue;
    const now = cellNow(clockProg(j), f);
    const flap = now.next !== null ? flapMat(c, bu, CLOCK_BV, -RECESS + 0.004, now.theta) : null;
    jobs.push({ key: `clk${j}`, m, now, flap, bv: CLOCK_BV });
  }
  for (let r = 0; r < 8; r++) {
    for (const col of COLS) {
      for (let i = 0; i < col.n; i++) {
        const bu = COL_X[col.key] + i * PX + FW / 2;
        const bv = ROWS_TOP + r * PY + FH / 2;
        const m = cellMat(c, bu, bv, -RECESS);
        if (!m) continue;
        const now = cellNow(progFor(r, col.key, i), f);
        const flap = now.next !== null ? flapMat(c, bu, bv, -RECESS + 0.004, now.theta) : null;
        jobs.push({ key: `${r}${col.key}${i}`, m, now, flap, bv });
      }
    }
  }
  const glyphFill = (amber: boolean) => (amber ? "none" : CREAM_GLYPH);

  // header text: one affine per character (perspective-true along the long words)
  const printed = (text: string, bu0: number, bvBase: number, cap: number, fill: string, font: string, track: number) => {
    const px = cap / 0.718;
    const out: React.ReactNode[] = [];
    let u = bu0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const adv = labelWidth(ch, px) + track * px;
      const cu = u + adv / 2;
      const o = P(cu, bvBase);
      const xa = P(cu - 0.05, bvBase);
      const xb = P(cu + 0.05, bvBase);
      const ya = P(cu, bvBase - 0.05);
      const yb = P(cu, bvBase + 0.05);
      if (o && xa && xb && ya && yb && ch !== " ") {
        const m: Mat = [(xb.x - xa.x) / 100, (xb.y - xa.y) / 100, (yb.x - ya.x) / 100, (yb.y - ya.y) / 100, o.x, o.y];
        out.push(
          <text key={`${text}${i}`} transform={matStr(m)} x={0} y={0} textAnchor="middle" fontFamily={font} fontSize={f3(px * MM)} fill={fill}>
            {ch}
          </text>,
        );
      }
      u += adv;
    }
    return out;
  };

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <clipPath id={`${clipId}t`} clipPathUnits="userSpaceOnUse">
          <rect x={-HW * 2} y={-HH * 1.5} width={HW * 4} height={HH * 1.5} />
        </clipPath>
        <clipPath id={`${clipId}b`} clipPathUnits="userSpaceOnUse">
          <rect x={-HW * 2} y={0} width={HW * 4} height={HH * 1.5} />
        </clipPath>
        <linearGradient id={`${clipId}face`} gradientUnits="userSpaceOnUse" x1="0" y1={fp0 ? f3(fp0.y) : "0"} x2="0" y2={fp1 ? f3(fp1.y) : "1920"}>
          <stop offset="0" stopColor={HOUSING.face} />
          <stop offset="1" stopColor={HOUSING.faceLo} />
        </linearGradient>
      </defs>
      {/* the cables (behind the housing) */}
      {cables.map((k, i) =>
        k ? (
          <g key={i}>
            <line x1={f3(k.a.x)} y1={f3(k.a.y)} x2={f3(k.top.x)} y2={f3(k.top.y)} stroke="#6F5A47" strokeWidth={f3(k.w)} />
            <line x1={f3(k.a.x - k.w * 0.25)} y1={f3(k.a.y)} x2={f3(k.top.x - k.w * 0.25)} y2={f3(k.top.y)} stroke="#E6D8C0" strokeWidth={f3(k.w * 0.35)} opacity={0.7} />
          </g>
        ) : null,
      )}
      {/* the housing: its right end, its face, the cream rim on the top edge */}
      <polygon points={under} fill={HOUSING.side} />
      <polygon points={side} fill={HOUSING.side} />
      <polygon points={face} fill={`url(#${clipId}face)`} stroke={HOUSING.rim} strokeWidth={2} strokeLinejoin="round" />
      {(() => {
        const a = P(0, 0.01);
        const b = P(WB, 0.01);
        const s = P(WB, 0.01, -DEPTH);
        return a && b && s ? <polyline points={`${f3(a.x)},${f3(a.y)} ${f3(b.x)},${f3(b.y)} ${f3(s.x)},${f3(s.y)}`} fill="none" stroke={COLOR.creamFoot} strokeWidth={2.4} opacity={0.75} strokeLinejoin="round" /> : null;
      })()}
      {recesses.map((pts, i) => (
        <polygon key={i} points={pts} fill={HOUSING.recess} />
      ))}
      {/* the board's own printed text: title and column heads */}
      {printed("DEPARTURES", COL_X.dest, ROWS_TOP - 0.42, TITLE_CAP, COLOR.inkCream, FONT_LABEL, 0.06)}
      {COLS.map((col) => printed(col.head, COL_X[col.key], ROWS_TOP - 0.1, HEAD_CAP, COLOR.inkCreamLo, FONT_LABEL, 0.08))}
      {/* the flaps */}
      {jobs.map((j) => {
        const { now } = j;
        if (now.next === null) {
          return (
            <g key={j.key} transform={matStr(j.m)}>
              <HalfFace half="top" />
              <HalfFace half="bot" />
              <Glyph ch={now.cur} fill={glyphFill(now.curAmber)} />
              <rect x={-HW} y={-3} width={2 * HW} height={6} fill={FLAP.line} />
            </g>
          );
        }
        const th = now.theta;
        const fm = j.flap;
        const front = th < 90;
        const Hh = HH;
        const flapM: Mat | null = fm
          ? front
            ? [fm.ex[0], fm.ex[1], -fm.es[0] / Hh, -fm.es[1] / Hh, fm.o.x, fm.o.y]
            : [fm.ex[0], fm.ex[1], fm.es[0] / Hh, fm.es[1] / Hh, fm.o.x, fm.o.y]
          : null;
        const flapShade = front ? 0.5 * (th / 90) : 0.5 * (1 - (th - 90) / 90);
        return (
          <g key={j.key}>
            <g transform={matStr(j.m)}>
              {/* behind the falling flap: the next character's top; below: the current character's bottom */}
              <HalfFace half="top" />
              <g clipPath={`url(#${clipId}t)`}>
                <Glyph ch={now.next as string} fill={CREAM_GLYPH} />
              </g>
              <HalfFace half="bot" shade={front ? 0 : 0.18 * (1 - (th - 90) / 90)} />
              <g clipPath={`url(#${clipId}b)`}>
                <Glyph ch={now.cur} fill={glyphFill(now.curAmber)} />
              </g>
              <rect x={-HW} y={-3} width={2 * HW} height={6} fill={FLAP.line} />
            </g>
            {flapM ? (
              <g transform={matStr(flapM)}>
                <HalfFace half={front ? "top" : "bot"} shade={flapShade} />
                <g clipPath={`url(#${clipId}${front ? "t" : "b"})`}>
                  <Glyph ch={front ? now.cur : (now.next as string)} fill={front ? glyphFill(now.curAmber) : CREAM_GLYPH} />
                </g>
              </g>
            ) : null}
          </g>
        );
      })}
      {/* the amber glyphs (DELAYED), one bloom over them all; drawn where they show */}
      <g style={{ filter: bloomFilter(1.6) }}>
        {jobs.map((j) => {
          const { now } = j;
          if (!now.curAmber) return null;
          if (now.next === null) {
            return (
              <g key={j.key} transform={matStr(j.m)}>
                <Glyph ch={now.cur} fill={AMBER_GLYPH} />
                <rect x={-HW} y={-3} width={2 * HW} height={6} fill={FLAP.line} />
              </g>
            );
          }
          const th = now.theta;
          const fm = j.flap;
          const out: React.ReactNode[] = [];
          // the old bottom half, uncovered part only (the flap's back lands over it after 90 deg)
          const cover = th > 90 ? -Math.cos((th * Math.PI) / 180) * HH : 0;
          out.push(
            <g key="b" transform={matStr(j.m)}>
              <clipPath id={`${clipId}u${j.key}`} clipPathUnits="userSpaceOnUse">
                <rect x={-HW * 2} y={3 + cover} width={HW * 4} height={HH} />
              </clipPath>
              <g clipPath={`url(#${clipId}u${j.key})`}>
                <Glyph ch={now.cur} fill={AMBER_GLYPH} />
              </g>
            </g>,
          );
          if (fm && th < 90) {
            const m: Mat = [fm.ex[0], fm.ex[1], -fm.es[0] / HH, -fm.es[1] / HH, fm.o.x, fm.o.y];
            out.push(
              <g key="t" transform={matStr(m)} opacity={f3(1 - 0.45 * (th / 90))}>
                <g clipPath={`url(#${clipId}t)`}>
                  <Glyph ch={now.cur} fill={AMBER_GLYPH} />
                </g>
              </g>,
            );
          }
          return <g key={j.key}>{out}</g>;
        })}
      </g>
      {/* the low sun across the face (warm bands through the west glass) */}
      <g style={{ mixBlendMode: "soft-light" }}>
        {sunBands.map((pts, i) => (
          <polygon key={i} points={pts} fill="#FFF1D6" opacity={0.3} />
        ))}
      </g>
    </svg>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const WeatherDelaysCut: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const c = camAt(f);
  const out = outsideCam(c);
  const S = S0 + f;
  const cells: StormState[] = OUT_SPECS.map((s) => ({ ...s }));
  const g2 = Math.floor(f / 2);
  const grx = (hash01(g2 + 101) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 107) * 2 - 1) * GRAIN.travel;
  return (
    <AbsoluteFill style={{ backgroundColor: "#E9D6B4", overflow: "hidden" }}>
      {/* outside the far glass: the world (sky, plains, the boiling storm), a touch soft through the glass */}
      <AbsoluteFill style={{ transform: out.m3d, transformOrigin: "0 0", filter: "blur(1.1px)" }}>
        <AirStage S={S} v={makeView(out.cam)} cells={cells} rampActive={0} terminalScale={1} dust={0} grade={0} highCloud={0} />
      </AbsoluteFill>
      {/* the hall: roof peaks, the far glass wall, the floor */}
      <HallCanvas c={c} f={f} />
      {/* the board */}
      <Board c={c} f={f} clipId="wdc" />
      {/* the warm film grade, the brown vignette, stout grain on twos (the world's recipe) */}
      <AbsoluteFill
        style={{
          mixBlendMode: "soft-light",
          background: `linear-gradient(to bottom, ${GRADE.top} 0%, ${GRADE.mid} 45%, ${GRADE.bottom} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 104% 100% at 50% 46%, rgba(${OCEAN.vignette},0) 45%, rgba(${OCEAN.vignette},0.14) 72%, rgba(${OCEAN.vignette},0.3) 100%)`,
        }}
      />
      <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <Img
          src={staticFile(GROUND.grain)}
          style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default WeatherDelaysCut;
