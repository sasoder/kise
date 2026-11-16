// ---------------------------------------------------------------------------
// EonsInEightyEightHours (rsi-since-writing, cut 7; final 56_EonsInEightyEightHours.mov), REVISION 1 (a new
// concept after the user's notes). Dwarkesh 3D style (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 143
// frames. One stage inside the misty teal air (AirStage) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d (its header is the API). THE ROBOT is the sister clip's tenEarthsBot (v0, read only;
// BOT_READY.md); the desk, the paper sheets, the plate and the office's sun colours are this clip's world module
// (sinceWritingWorld, read only). The tower of paper, the wall with its window and the clock are cut-local.
//
// CHECK LINE: "In just 88 hours the AIs packed in thinking that would take one person thousands of years."
//
// THE LINE: "And they did it, in part, by compacting, within 88 hours, eons of cognitive work to"
// WORD -> FRAME: days. -12 · And -1 · they 3 · did 6 · it, 12 · in 20 · part, 27 · by 36 · compacting, 43 · within 62
// · 88 71 · hours, 84 · eons 98 · of 113 · cognitive 121 · work 130 · to 138 (· match 144, after the cut)
// DURATION: the slot 56.3062 -> 62.2705 s = 5.964 s x 23.976 = 143 frames (f0..f142).
//
// THE MOTION: one orange robot (THE AI) types at an office desk on the top of a pillar of paper strata, in front of a
// short free-standing office wall with a window and a wall clock; the pillar (2,800 wide) falls away below into the
// haze, its foot never seen. Time runs fast: the window's sky goes day -> night four times across the slot (88 hours
// from 08:00 on day one to midnight after day four; dawns and dusks four frames each, nights deep petrol with stars and
// a moon; the whole stage only dims a little on a slow sine, never flickering) and the clock's hands race (the hour
// hand turns 7.3 times; the minute hand is a blur). Under the clock a plate "88 HOURS" (world space, on the wall) fades
// in f58-71 (legible on "88"). From f0 the top's front edge is in view under the desk: every finished sheet (drawn
// 1.8x a real sheet, to read) lifts off the desk, sails down in front of it, lands on the top near the edge and spreads
// flat into a new LAYER, the edge growing one band at a time (f0-60: 11 sheets), lifting the desk; on "compacting"
// (f43-60) those layers press down to 40 % of their thickness (the desk dips, the bands squeeze), and from there the
// sheets come faster and faster and the layers pile up as strata. The strata read as deep time from top to bottom: the
// newest bands under the desk cream and crisp, the deeper ones thinner (more compressed), greyer and hazier, dissolving
// into the air far below. By "eons" (f98) the desk has risen ~1,500 units (8 m). From "eons" the camera pulls back and
// the frame slides down the pillar in one move (a dolly-zoom-out, the lens lengthening as it goes) until the tiny desk
// and robot sit centred on the pillar's top (x ~450-630, y ~335-450) with the strata falling away past the bottom edge
// (~6,900 units, 39 m, of the robot's paper in view); settled by ~f134, a living hold: the robot still typing, a sheet
// or two still settling, the clock small and still racing, the window still turning day to night.
// Orange = the robot only (COMMON.md). Paper cream, the desk and wall the world module's office; no other text.
//
// DEPTH: one pinhole camera; per frame its eye X (cx = 60, the room's middle), its eye height above the pillar's top
// (HR 200 -> 300 units), its distance D in front of the front plane (Z = 0, the robot's hips), its zoom k = F / D (the
// front plane's screen scale) and the horizon's screen row (tracks K_AT, D_AT, YH_AT, HR_AT below). The eye rides the
// top (H = lift + HR), lagging a little through f0-70 (tau 5 frames) so each new layer visibly lifts the desk and the
// compaction visibly presses it down. f0: k 1.25, D 900, horizon y 700 (the robot ~335 px, the edge at y ~1030) ->
// f98: k 0.85, D 1200 -> f142: k 0.19, D 8000, horizon y 390 (the robot ~51 px). Mapped onto londonDepth as eyeY = -H,
// dRef = D, kRef = k, dolly 0. Everything ON the top (desk, robot, wall, clock, plate, sheets) is drawn in the top's
// own frame with a lifted camera (eyeY + lift, cy + lift: exact, the same projection as Y - lift). Fog by depth;
// the strata's fall into the haze is a screen-row ramp from the top edge down (greyer, then the air itself). World
// units = the cast's (178 a metre; the robot 240 = 1.35 m). The pillar: X -1400..1400, Z -220..2600; heights are
// above the paper the robot started on (older paper below it, already compressed to 60 %). The office wall: X
// -480..500 at Z 300, 600 tall, the window X -400..80 (sill -200, head -520), the clock at (300, -470) R 60, the plate
// at (300, -345) size 56.
//
// SOURCES: 88 hours = the speaker's own figure (OpenAI's internal model, the speaker's account); "eons" = the
// speaker's next line (a human would have had to start when writing was invented): no years on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AIR,
  AIR_SCENE_DEPTH,
  AirStage,
  WorldSvg,
  airWorldOf,
  c01,
  lerp,
  makeAirView,
  mixHex,
  pchip,
  rgbHex,
  swayCam,
  type AirScene,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { BOT_POSES, Bot } from "../rsi-ten-earths/tenEarthsBot";
import {
  MAT_FRAME,
  MAT_PLASTER,
  MAT_SKIRT,
  OfficeDesk,
  Plate,
  WorkSheet,
  officeSun,
  plateT,
  sheetFlight,
  type SheetPose,
} from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 143;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;

// ---------------------------------------------------------------------------
// SMALL HELPERS
// ---------------------------------------------------------------------------
const sstep = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const track = (keys: [number, number][], log = false) => {
  const fn = pchip(
    keys.map(([f, v]) => [f, log ? Math.log(v) : v] as [number, number]),
    false,
  );
  return (f: number) => (log ? Math.exp(fn(f)) : fn(f));
};
const screenOf = (p: P2, cam: Cam): P2 => [
  540 + (p[0] - cam.cx) * cam.k,
  960 + (p[1] - cam.cy) * cam.k,
];

// ---------------------------------------------------------------------------
// TIME: 88 hours across the slot, from 08:00 on the first day
// ---------------------------------------------------------------------------
export const HOUR0 = 8;
export const hoursAt = (f: number) => HOUR0 + (88 * f) / DURATION;
const hourOfDay = (f: number) => ((hoursAt(f) % 24) + 24) % 24;
/** 1 by day, 0 by night (dawn 4.6-7 h, dusk 18.4-20.8 h: four frames each) */
export const dayAt = (f: number) => {
  const h = hourOfDay(f);
  return sstep((h - 4.6) / 2.4) * (1 - sstep((h - 18.4) / 2.4));
};
/** the office's sunT through the daylight hours (0 morning .. 1 dusk) */
const sunTAt = (f: number) => c01((hourOfDay(f) - 5.5) / 14);
/** the warm light of dawn and dusk (0..1) */
const glowAt = (f: number) => {
  const h = hourOfDay(f);
  const b = (c: number, w: number) => Math.max(0, 1 - Math.abs(h - c) / w);
  return Math.max(b(19.4, 1.6), 0.6 * b(5.6, 1.2));
};


// ---------------------------------------------------------------------------
// THE PAPER: sheets -> layers -> strata. Mass in uncompacted units (one early layer = one sheet = 36 units); the
// robot's paper stands compaction x mass high above the paper it started on (mass 0); the older paper below that is
// already pressed to 60 %
// ---------------------------------------------------------------------------
export const LAYER = 36;
/** the landing frames of the eleven single sheets (each spreads into one layer over the next 6 frames) */
export const LAND = [6, 13, 20, 27, 34, 41, 46, 50, 53, 56, 59];
const FLIGHT = 11;
/** after f58 the sheets come in a stream: extra mass by frame (pchip) */
const MCONT = track([
  [58, 0],
  [64, 70],
  [70, 280],
  [78, 800],
  [86, 1650],
  [92, 2420],
  [98, 3320],
  [106, 5600],
  [114, 9200],
  [122, 13200],
  [128, 15400],
  [133, 16400],
  [138, 16750],
  [142, 16820],
]);
export const massAt = (f: number) => {
  let m = LAYER;
  for (const l of LAND) m += LAYER * sstep((f - l) / 6);
  return m + (f <= 58 ? 0 : Math.max(0, MCONT(Math.min(f, 142))));
};
/** compaction: on "compacting" (f43-60) the robot's layers press down to 40 % */
export const PACK0 = 43;
export const PACK1 = 60;
export const compAt = (f: number) => 1 - 0.6 * sstep((f - PACK0) / (PACK1 - PACK0));
const OLD_K = 0.6;
/** the height of a mass level above the starting paper at a frame */
const heightOf = (m: number, f: number) => (m >= 0 ? compAt(f) * m : OLD_K * m);
/** the top's height (units up) */
export const liftAt = (f: number) => compAt(f) * massAt(f);
/** the camera's lift: lags the top a little through f0-70 (each layer lifts the desk, the compaction presses it
 *  down), then rides it exactly */
const LCAM: number[] = (() => {
  const out: number[] = [liftAt(0)];
  let lc = liftAt(0);
  for (let f = 1; f <= DURATION; f++) {
    for (let s = 1; s <= 8; s++) {
      const ff = f - 1 + s / 8;
      const tau = lerp(5, 0.05, c01((ff - 62) / 10));
      lc += (liftAt(ff) - lc) * Math.min(1, 0.125 / tau);
    }
    out.push(lc);
  }
  return out;
})();
export const camLiftAt = (f: number) => {
  const i = Math.max(0, Math.min(DURATION - 1, Math.floor(f)));
  const lc = lerp(LCAM[i], LCAM[i + 1], c01(f - i));
  return lerp(lc, liftAt(f), c01((f - 66) / 8));
};

/** the strata: bands of mass. Below 0 the older paper (thin bands); the twelve single sheets' layers; then the
 *  stream's bands, thicker the newer they are (the deeper, the more compressed) */
type Band = { m0: number; m1: number; tone: string; lam: number[] };
const PAPER_TONES = [
  "#EEE5D0",
  "#E3D7BE",
  "#D9CCB1",
  "#F1E9D8",
  "#DDD2BC",
  "#E8DCC4",
  "#D3C6AB",
  "#EAE2D3",
  "#E0D5C0",
];
/** the strata's tones: cream, oatmeal, pale grey, warm white, sand, and a light umber now and then */
const STRATA_TONES = [
  "#F0E6D0",
  "#D6C6A4",
  "#C8C5BA",
  "#F6F0E2",
  "#E3D2B0",
  "#EDE3CC",
  "#CFC0A0",
  "#D3D0C6",
  "#B39878",
  "#F2EAD8",
  "#DDCBA8",
  "#C2BEB2",
];
const lamsOf = (i: number, n: number) => {
  const lam: number[] = [];
  for (let k = 0; k < n; k++) lam.push((k + 0.3 + random(`bl${i}-${k}`) * 0.5) / n);
  return lam;
};
export const BANDS: Band[] = (() => {
  const out: Band[] = [];
  let i = 0;
  // the older paper, from -7000 up to 0
  const old: Band[] = [];
  let m = 0;
  while (m > -7000) {
    const th = 55 + random(`bo${i}`) * 110;
    old.push({
      m0: m - th,
      m1: m,
      tone: mixHex(PAPER_TONES[Math.floor(random(`bt${i}`) * PAPER_TONES.length)], "#B9B2A2", 0.25),
      lam: lamsOf(i, 1 + Math.floor(random(`bn${i}`) * 2)),
    });
    m -= th;
    i++;
  }
  out.push(...old.reverse());
  m = 0;
  for (let j = 0; j < 1 + LAND.length; j++, i++) {
    out.push({ m0: m, m1: m + LAYER, tone: PAPER_TONES[Math.floor(random(`bt${i}`) * PAPER_TONES.length)], lam: [] });
    m += LAYER;
  }
  // the stream's strata, like sediment: distinct tones (never the same twice running), irregular thicknesses
  let prevTone = "";
  while (m < 24000) {
    const th = (190 + 0.05 * m) * (0.3 + 1.5 * Math.pow(random(`bm${i}`), 1.6));
    let tone = STRATA_TONES[Math.floor(random(`bt${i}`) * STRATA_TONES.length)];
    if (tone === prevTone) tone = STRATA_TONES[(STRATA_TONES.indexOf(tone) + 3) % STRATA_TONES.length];
    prevTone = tone;
    out.push({ m0: m, m1: m + th, tone, lam: lamsOf(i, th > 500 ? 2 + Math.floor(random(`bn${i}`) * 3) : 1) });
    m += th;
    i++;
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE WORLD (cast units, 178 a metre; Y up is -; Z depth, toward the camera -)
// ---------------------------------------------------------------------------
/** the pillar of paper under the office */
export const TOWER = { x0: -1400, x1: 1400, zF: -220, zB: 2600 };
/** the office wall standing on the top behind the desk (in the top's frame: Y = 0 is the paper's top) */
export const WALL = {
  x0: -480,
  x1: 500,
  z: 300,
  t: 36,
  h: 600,
  win: { x0: -400, x1: 80, sill: -200, head: -520 },
};
export const CLOCK = { X: 300, Y: -470, R: 60 };
export const PLATE88 = { X: 300, Y: -345, size: 56 };

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
const K_AT = track(
  [
    [0, 1.25],
    [20, 1.18],
    [40, 1.1],
    [60, 1.03],
    [71, 0.98],
    [85, 0.92],
    [98, 0.85],
    [104, 0.68],
    [110, 0.48],
    [116, 0.34],
    [122, 0.26],
    [128, 0.22],
    [134, 0.2],
    [142, 0.19],
  ],
  true,
);
const D_AT = track(
  [
    [0, 900],
    [50, 980],
    [98, 1200],
    [106, 1700],
    [114, 3000],
    [122, 5000],
    [130, 6800],
    [136, 7600],
    [142, 8000],
  ],
  true,
);
const CX = 60;
const YH_AT = track([
  [0, 650],
  [60, 660],
  [98, 680],
  [106, 630],
  [114, 535],
  [122, 460],
  [130, 415],
  [136, 398],
  [142, 392],
]);
const HR_AT = track([
  [0, 250],
  [60, 250],
  [98, 260],
  [142, 300],
]);
export type Eye = {
  H: number;
  D: number;
  F: number;
  k: number;
  cx: number;
  yh: number;
  lift: number;
};
export const eyeAt = (f: number): Eye => {
  const k = K_AT(f);
  const D = D_AT(f);
  return {
    H: camLiftAt(f) + HR_AT(f),
    D,
    F: k * D,
    k,
    cx: CX,
    yh: YH_AT(f),
    lift: liftAt(f),
  };
};
export const camOf = (e: Eye): { cam: Cam; depth: DepthOpts } => ({
  cam: { k: e.k, cx: e.cx, cy: -e.H - (e.yh - 960) / e.k },
  depth: { eyeY: -e.H, dRef: e.D, kRef: e.k, dolly: 0 },
});
const SCENE: Partial<AirScene> = {
  fogNear: 1500,
  fogVis: 26000,
  fogMax: 0.86,
  hLow: 0,
  hHigh: 9000,
  moteUnit: 260,
};
const REST = camOf(eyeAt(0));
export const frameState = (frame: number) => {
  const e = eyeAt(frame);
  const { cam: cam0, depth } = camOf(e);
  const cam = swayCam(cam0, frame);
  const A = airWorldOf({
    cam,
    rest: REST.cam,
    depth,
    frame,
    fogBy: "depth",
    scene: SCENE,
  });
  // the top's own frame: the same projection with the eye lowered by the lift (exact)
  const camL: Cam = { ...cam, cy: cam.cy + e.lift };
  const depthL: DepthOpts = { ...depth, eyeY: depth.eyeY + e.lift };
  const AL = airWorldOf({
    cam: camL,
    rest: REST.cam,
    depth: depthL,
    frame,
    fogBy: "depth",
    scene: SCENE,
  });
  return { e, cam, camL, A, AL };
};

// ---------------------------------------------------------------------------
// THE PILLAR OF PAPER: the top (lit paper, by depth) and the front face of strata (seeded cream tones, thin
// laminations, a fine screen-constant hatch of sheet edges); from the top edge down a screen-row ramp turns the bands
// greyer, then into the air itself, so the pillar dissolves into the haze far below and its foot is never seen
// ---------------------------------------------------------------------------
const TOP_PAPER = "#E6DCC5";
const SHADE = "#8F846F";
const DEEP_GREY = "#A4A196";
/** the haze far below: a pale sea of the medium under the horizon (the air at the horizon, a little deeper toward
 *  the frame's bottom), never the stage's dark low air */
const hazeBelow = (A: AirWorld, sy: number) => {
  const yh = 960 + (A.P.opts.eyeY - A.cam.cy) * A.cam.k;
  const top = rgbHex(A.v.airAtScreen(yh - 40));
  if (sy <= yh) return rgbHex(A.v.airAtScreen(sy));
  return mixHex(top, rgbHex(A.v.airAtScreen(sy)), 0.38 * sstep((sy - yh) / 1400));
};
const HazeSea: React.FC<{ A: AirWorld }> = ({ A }) => {
  const yh = 960 + (A.P.opts.eyeY - A.cam.cy) * A.cam.k;
  const y0 = Math.max(0, yh - 120);
  const n = 16;
  const stops = Array.from({ length: n + 1 }, (_, i) => {
    const sy = y0 + ((1920 - y0) * i) / n;
    return <stop key={i} offset={i / n} stopColor={hazeBelow(A, sy)} />;
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="haze-sea" x1="0" y1={f2(y0)} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          {stops}
        </linearGradient>
      </defs>
      <rect x={0} y={f2(y0)} width={1080} height={f2(1920 - y0)} fill="url(#haze-sea)" />
    </svg>
  );
};
/** the deep-time ramp at a depth (screen px) below the top edge: [mix toward the air, opacity] */
const deepAt = (d: number): [number, number] => [
  sstep((d - 450) / 900),
  Math.min(0.94, 0.22 * sstep(d / 900) + 0.72 * sstep((d - 700) / 900)),
];
const Pillar: React.FC<{ A: AirWorld; frame: number; L: number }> = ({ A, frame, L }) => {
  const P = A.P;
  const cam = A.cam;
  const { x0, x1, zF, zB } = TOWER;
  const lw = A.lw(1.1) * 1.6;
  const toS = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const toW = (sy: number) => cam.cy + (sy - 960) / cam.k;
  const yTopS = toS(P.p(0, -L, zF)[1]);
  // the strata keep half their colour through the air in front of them (they are the subject)
  const t = (hex: string, h: number) => mixHex(hex, A.tone(hex, zF, h), 0.5);
  const px = 1 / cam.k;
  const c = compAt(frame);
  const M = massAt(frame);
  // ---- the top ----
  const NZ = 10;
  const zs: number[] = [];
  for (let i = 0; i <= NZ; i++) zs.push(zF + ((zB - zF) * i) / NZ);
  const ya = P.p(0, -L, zF)[1];
  const yb = P.p(0, -L, zB)[1];
  const span = yb - ya;
  // ---- the front face ----
  const front: React.ReactNode[] = [];
  let lowest = "";
  for (let i = 0; i < BANDS.length; i++) {
    const b = BANDS[i];
    if (b.m0 >= M) break;
    const m1 = Math.min(b.m1, M);
    const h0 = heightOf(b.m0, frame);
    const h1 = heightOf(m1, frame);
    const a = P.p(x0, -h1, zF);
    const q = P.p(x1, -h0, zF);
    const sa = toS(a[1]);
    const sq = toS(q[1]);
    if (sa > 1925) continue;
    if (sq < -5) continue;
    lowest = lowest || b.tone;
    // the single sheets' layers darken a little as they are pressed
    // (the newest strata, just under the desk, are still fresh cream; their own tones come up as they are buried)
    const fresh = b.m0 >= LAYER * (LAND.length + 1) ? 0.65 * (1 - sstep((M - m1) / 1800)) : 0;
    const tone = b.m0 >= 0 && b.m0 < LAYER * (LAND.length + 1) ? mixHex(b.tone, "#C9BDA3", (0.35 * (1 - c)) / 0.6) : mixHex(b.tone, "#F3ECDC", fresh);
    front.push(<rect key={`f${i}`} x={a[0].toFixed(2)} y={a[1].toFixed(2)} width={(q[0] - a[0]).toFixed(2)} height={(q[1] - a[1] + 0.6).toFixed(2)} fill={t(tone, h0)} />);
    // a single sheet's new layer glows fresh as it forms at the edge, then settles to its tone
    const j = Math.round(b.m0 / LAYER) - 1;
    if (b.m0 > 0 && j < LAND.length && j >= 0) {
      const g = sstep((frame - LAND[j]) / 3) * (1 - sstep((frame - LAND[j] - 5) / 9));
      if (g > 0.01)
        front.push(<rect key={`fg${i}`} x={a[0].toFixed(2)} y={a[1].toFixed(2)} width={(q[0] - a[0]).toFixed(2)} height={(q[1] - a[1]).toFixed(2)} fill="#FFFAF0" fillOpacity={0.75 * g} />);
    }
    const bandPx = sq - sa;
    // a slightly lit top edge on each band
    if (bandPx > 5)
      front.push(<path key={`ft${i}`} d={`M${f2(a[0])},${f2(a[1] + 1.4 * px)}L${f2(q[0])},${f2(a[1] + 1.4 * px)}`} stroke="#FFF8EA" strokeOpacity={0.6} strokeWidth={f2(1.3 * px)} />);
    // the darker sheet-edge seam under it, and fine sheet-edge lines within it
    front.push(<path key={`fb${i}`} d={`M${Pt(P.p(x0, -h0, zF))}L${Pt(P.p(x1, -h0, zF))}`} stroke={t(mixHex(tone, "#6A5E4C", 0.6), h0)} strokeWidth={f2(Math.max(lw, 1.7 * px))} />);
    for (let k = 0; bandPx > 9 && k < b.lam.length; k++) {
      const mm = b.m0 + b.lam[k] * (b.m1 - b.m0);
      if (mm >= m1) continue;
      const h = heightOf(mm, frame);
      front.push(<path key={`fl${i}-${k}`} d={`M${Pt(P.p(x0, -h, zF))}L${Pt(P.p(x1, -h, zF))}`} stroke={t(mixHex(tone, "#7A6E5A", 0.42), h)} strokeWidth={f2(Math.max(lw * 0.6, 0.9 * px))} />);
    }
  }
  // below the oldest band drawn: the same paper on down, out of the frame
  const fa = P.p(x0, -L, zF);
  const bottomW = toW(1925);
  const fb: P2 = [P.p(x1, 0, zF)[0], Math.max(bottomW, fa[1] + 1)];
  // the deep-time ramp, in screen rows from the top edge to the frame's bottom
  const NS = 24;
  const rampStops: React.ReactNode[] = [];
  for (let i = 0; i <= NS; i++) {
    const sy = yTopS + ((1925 - yTopS) * i) / NS;
    const [toAir, o] = deepAt(sy - yTopS);
    rampStops.push(<stop key={i} offset={i / NS} stopColor={mixHex(DEEP_GREY, hazeBelow(A, sy), toAir)} stopOpacity={o} />);
  }
  const hk = 1 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id="pl-top" gradientUnits="userSpaceOnUse" x1="0" y1={f2(ya)} x2="0" y2={f2(yb)}>
          {zs.map((Z, i) => (
            <stop key={i} offset={c01(Math.abs(span) < 1e-3 ? 0 : (P.p(0, -L, Z)[1] - ya) / span)} stopColor={A.tone(TOP_PAPER, Z, L)} />
          ))}
        </linearGradient>
        <linearGradient id="pl-deep" gradientUnits="userSpaceOnUse" x1="0" y1={f2(fa[1])} x2="0" y2={f2(fb[1])}>
          {rampStops}
        </linearGradient>
        <pattern id="pl-hatch" patternUnits="userSpaceOnUse" width={f2(6 * hk)} height={f2(3 * hk)}>
          <rect x="0" y="0" width={f2(6 * hk)} height={f2(0.7 * hk)} fill={PAL.shadow} fillOpacity={0.09} />
        </pattern>
      </defs>
      <path d={poly([P.p(x0, -L, zF), P.p(x1, -L, zF), P.p(x1, -L, zB), P.p(x0, -L, zB)])} fill="url(#pl-top)" />
      <path d={`M${Pt(P.p(x0, -L, zB))}L${Pt(P.p(x1, -L, zB))}`} stroke={A.tone(SHADE, zB, L)} strokeOpacity={0.5} strokeWidth={lw} />
      <rect x={f2(fa[0])} y={f2(fa[1])} width={f2(fb[0] - fa[0])} height={f2(fb[1] - fa[1])} fill={t(lowest ? mixHex(lowest, "#B9B2A2", 0.3) : TOP_PAPER, 0)} />
      {front}
      <rect x={f2(fa[0])} y={f2(fa[1])} width={f2(fb[0] - fa[0])} height={f2(fb[1] - fa[1])} fill="url(#pl-hatch)" />
      <rect x={f2(fa[0])} y={f2(fa[1])} width={f2(fb[0] - fa[0])} height={f2(fb[1] - fa[1])} fill="url(#pl-deep)" />
      <path d={`M${Pt(P.p(x0, -L, zF))}L${Pt(P.p(x1, -L, zF))}`} stroke={PAL.cream} strokeOpacity={0.75} strokeWidth={lw * 1.3} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE OFFICE WALL (in the top's frame): oatmeal plaster with a skirting, one window whose sky runs the 88 hours (the
// office's sun colours by day, deep petrol with stars and a pale moon by night), a slate frame
// ---------------------------------------------------------------------------
const NIGHT_TOP = "#1C303C";
const NIGHT_LOW = "#2E4656";
const STARS = Array.from({ length: 14 }, (_, i) => ({
  u: random(`stx${i}`),
  v: random(`sty${i}`) * 0.7,
  s: 0.6 + random(`sts${i}`) * 0.8,
}));
const OfficeWall: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const { x0, x1, z: Zb, t: WT, h: WH, win: w } = WALL;
  const day = dayAt(frame);
  const sun = officeSun(sunTAt(frame));
  const glow = glowAt(frame);
  const tone = (hex: string, h: number) => A.tone(hex, Zb, h);
  const wq = poly([P.p(x0, 0, Zb), P.p(x1, 0, Zb), P.p(x1, -WH, Zb), P.p(x0, -WH, Zb)]);
  const hole = poly([P.p(w.x0, w.sill, Zb), P.p(w.x0, w.head, Zb), P.p(w.x1, w.head, Zb), P.p(w.x1, w.sill, Zb)]);
  const wy0 = P.p(0, 0, Zb)[1];
  const wy1 = P.p(0, -WH, Zb)[1];
  const plaster = (s: number) => tone(mixHex(MAT_PLASTER.mid, MAT_PLASTER.lit, 0.15 + 0.5 * s), s * WH);
  // the window's sky
  const skyTop = mixHex(NIGHT_TOP, mixHex(sun.skyTop, "#C9A39A", 0.4 * glow), day);
  const skyLow = mixHex(NIGHT_LOW, mixHex(sun.skyLow, "#E2BFAE", 0.5 * glow), day);
  const ya = P.p(0, w.head, Zb)[1];
  const yb = P.p(0, w.sill, Zb)[1];
  const h = hourOfDay(frame);
  const su = c01((h - 6) / 13);
  const sunUp = sstep((h - 5.6) / 0.8) * (1 - sstep((h - 18.8) / 0.8));
  const sunP = P.p(lerp(w.x0 + 60, w.x1 - 60, su), lerp(w.sill - 20, w.head + 70, Math.sin(Math.PI * su)), Zb + 40);
  const r = P.r(Zb);
  const night = 1 - day;
  const mu = c01(((h + 24 - 19) % 24) / 11);
  const moonP = P.p(lerp(w.x0 + 80, w.x1 - 90, mu), lerp(w.sill - 60, w.head + 90, Math.sin(Math.PI * mu)), Zb + 40);
  const fr = tone(MAT_FRAME.mid, 360);
  const fw = 9;
  const xm = (w.x0 + w.x1) / 2;
  const ymid = (w.sill + w.head) / 2;
  const bar = (q: P2[], key: string) => <path key={key} d={poly(q)} fill={fr} />;
  const Zi = Zb + WT;
  return (
    <g>
      <defs>
        <linearGradient id="ow-wall" gradientUnits="userSpaceOnUse" x1="0" y1={f2(wy0)} x2="0" y2={f2(wy1)}>
          {[0, 0.3, 0.6, 1].map((s) => (
            <stop key={s} offset={s} stopColor={plaster(s)} />
          ))}
        </linearGradient>
        <linearGradient id="ow-sky" gradientUnits="userSpaceOnUse" x1="0" y1={f2(ya)} x2="0" y2={f2(yb)}>
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyLow} />
        </linearGradient>
        <clipPath id="ow-pane">
          <path d={hole} />
        </clipPath>
        <radialGradient id="ow-sun">
          <stop offset="0" stopColor={sun.disc} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={sun.disc} stopOpacity={0.9} />
          <stop offset="0.6" stopColor={sun.disc} stopOpacity={0.25} />
          <stop offset="1" stopColor={sun.disc} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the sky beyond the glass */}
      <path d={hole} fill="url(#ow-sky)" />
      <g clipPath="url(#ow-pane)">
        {sunUp > 0.01 && <circle cx={f2(sunP[0])} cy={f2(sunP[1])} r={f2(46 * r)} fill="url(#ow-sun)" opacity={sunUp} />}
        {night > 0.02 &&
          STARS.map((s, i) => {
            const p = P.p(lerp(w.x0 + 10, w.x1 - 10, s.u), lerp(w.head + 10, w.sill - 10, s.v), Zb + 40);
            return <circle key={i} cx={f2(p[0])} cy={f2(p[1])} r={f2(s.s * 3.2 * r)} fill={PAL.cream} opacity={0.85 * night} />;
          })}
        {night > 0.02 && (
          <g opacity={night}>
            <circle cx={f2(moonP[0])} cy={f2(moonP[1])} r={f2(26 * r)} fill="#EFE8D8" />
            <circle cx={f2(moonP[0] + 11 * r)} cy={f2(moonP[1] - 6 * r)} r={f2(23 * r)} fill={skyTop} />
          </g>
        )}
      </g>
      {/* the reveals (the wall's thickness round the hole) */}
      {w.x1 > P.vp[0] && <path d={poly([P.p(w.x1, w.sill, Zb), P.p(w.x1, w.head, Zb), P.p(w.x1, w.head, Zi), P.p(w.x1, w.sill, Zi)])} fill={tone(MAT_PLASTER.mid, 360)} />}
      {w.x0 < P.vp[0] && <path d={poly([P.p(w.x0, w.sill, Zb), P.p(w.x0, w.head, Zb), P.p(w.x0, w.head, Zi), P.p(w.x0, w.sill, Zi)])} fill={tone(MAT_PLASTER.lit, 360)} />}
      <path d={poly([P.p(w.x0, w.head, Zb), P.p(w.x1, w.head, Zb), P.p(w.x1, w.head, Zi), P.p(w.x0, w.head, Zi)])} fill={tone(mixHex(MAT_PLASTER.mid, MAT_PLASTER.dark, 0.3), 520)} />
      {/* the frame: border, mullion, transom */}
      {bar([P.p(w.x0, w.head, Zi - 6), P.p(w.x1, w.head, Zi - 6), P.p(w.x1, w.head + fw, Zi - 6), P.p(w.x0, w.head + fw, Zi - 6)], "bt")}
      {bar([P.p(w.x0, w.sill - fw, Zi - 6), P.p(w.x1, w.sill - fw, Zi - 6), P.p(w.x1, w.sill, Zi - 6), P.p(w.x0, w.sill, Zi - 6)], "bb")}
      {bar([P.p(w.x0, w.head, Zi - 6), P.p(w.x0 + fw, w.head, Zi - 6), P.p(w.x0 + fw, w.sill, Zi - 6), P.p(w.x0, w.sill, Zi - 6)], "bl")}
      {bar([P.p(w.x1 - fw, w.head, Zi - 6), P.p(w.x1, w.head, Zi - 6), P.p(w.x1, w.sill, Zi - 6), P.p(w.x1 - fw, w.sill, Zi - 6)], "br")}
      {bar([P.p(xm - fw / 2, w.head, Zi - 6), P.p(xm + fw / 2, w.head, Zi - 6), P.p(xm + fw / 2, w.sill, Zi - 6), P.p(xm - fw / 2, w.sill, Zi - 6)], "bm")}
      {bar([P.p(w.x0, ymid - fw / 2, Zi - 6), P.p(w.x1, ymid - fw / 2, Zi - 6), P.p(w.x1, ymid + fw / 2, Zi - 6), P.p(w.x0, ymid + fw / 2, Zi - 6)], "bx")}
      {/* the wall face (with the hole), its right end, the skirting, the sill */}
      <path d={`${wq}${hole}`} fill="url(#ow-wall)" fillRule="evenodd" />
      {P.vp[0] > x1 && <path d={poly([P.p(x1, 0, Zb), P.p(x1, -WH, Zb), P.p(x1, -WH, Zi), P.p(x1, 0, Zi)])} fill={tone(MAT_PLASTER.dark, 300)} />}
      <path d={poly([P.p(x0, 0, Zb - 3), P.p(x1, 0, Zb - 3), P.p(x1, -26, Zb - 3), P.p(x0, -26, Zb - 3)])} fill={tone(MAT_SKIRT.mid, 13)} />
      <path d={poly([P.p(w.x0 - 14, w.sill, Zb - 14), P.p(w.x1 + 14, w.sill, Zb - 14), P.p(w.x1 + 14, w.sill + 10, Zb - 14), P.p(w.x0 - 14, w.sill + 10, Zb - 14)])} fill={tone(MAT_PLASTER.lit, -w.sill)} />
      <path d={`M${Pt(P.p(x0, -WH, Zb))}L${Pt(P.p(x1, -WH, Zb))}`} stroke={PAL.cream} strokeOpacity={0.55} strokeWidth={A.lw(1.1) * 1.4} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CLOCK (in the top's frame, on the wall): the world module's wall-clock look (slate rim, cream face, 12 marks),
// its hands racing: the hour hand turns once per 12 hours (18 degrees a frame), the minute hand is a motion blur
// ---------------------------------------------------------------------------
const RaceClock: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const Z = WALL.z - 4;
  const c = P.p(CLOCK.X, CLOCK.Y, Z);
  const r = CLOCK.R * P.r(Z);
  const t = (hex: string) => A.tone(hex, Z, -CLOCK.Y);
  const hrs = hoursAt(frame);
  const aH = (hrs / 12) * 360;
  const aM = hrs * 360;
  const ink = t("#2E2A27");
  const at = (deg: number, rr: number): P2 => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [c[0] + Math.cos(a) * rr * r, c[1] + Math.sin(a) * rr * r];
  };
  const marks: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a0 = at(i * 30, i % 3 === 0 ? 0.7 : 0.77);
    const a1 = at(i * 30, 0.86);
    marks.push(<line key={i} x1={f2(a0[0])} y1={f2(a0[1])} x2={f2(a1[0])} y2={f2(a1[1])} stroke={t("#3A3430")} strokeWidth={f2((i % 3 === 0 ? 0.075 : 0.045) * r)} strokeLinecap="round" />);
  }
  // the minute hand's blur: a soft wedge trailing ~110 degrees behind it (it turns ~220 degrees a frame)
  const wedge: P2[] = [c];
  for (let i = 0; i <= 12; i++) wedge.push(at(aM - 110 + (110 * i) / 12, 0.66));
  const hEnd = at(aH, 0.46);
  const hBack = at(aH + 180, 0.08);
  const mEnd = at(aM, 0.68);
  return (
    <g>
      <defs>
        <radialGradient id="rc-sh">
          <stop offset="0.7" stopColor={PAL.shadow} stopOpacity={0.35} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={f2(c[0] + 0.12 * r)} cy={f2(c[1] + 0.14 * r)} r={f2(r * 1.12)} fill="url(#rc-sh)" />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r)} fill={t(MAT_FRAME.mid)} />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r * 0.9)} fill={t("#EFE7D6")} />
      <path d={`M${f2(c[0] - 0.97 * r)},${f2(c[1] - 0.15 * r)}A${f2(0.97 * r)},${f2(0.97 * r)} 0 0 1 ${f2(c[0] + 0.15 * r)},${f2(c[1] - 0.97 * r)}`} fill="none" stroke={PAL.cream} strokeOpacity={0.5} strokeWidth={f2(0.05 * r)} strokeLinecap="round" />
      {marks}
      <path d={poly(wedge)} fill={ink} fillOpacity={0.16} />
      <line x1={f2(c[0])} y1={f2(c[1])} x2={f2(mEnd[0])} y2={f2(mEnd[1])} stroke={ink} strokeOpacity={0.55} strokeWidth={f2(0.05 * r)} strokeLinecap="round" />
      <line x1={f2(hBack[0])} y1={f2(hBack[1])} x2={f2(hEnd[0])} y2={f2(hEnd[1])} stroke={ink} strokeWidth={f2(0.08 * r)} strokeLinecap="round" />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(0.06 * r)} fill={ink} />
    </g>
  );
};


// ---------------------------------------------------------------------------
// THE SHEETS (in the top's frame), drawn 1.8x a real sheet so they read: each lifts off the desk beside the keyboard,
// sails down in front of the desk (sheetFlight: lands exactly flat) onto the top near its front edge, then spreads
// flat across the top as a pale wash while the new band swells at the edge under it
// ---------------------------------------------------------------------------
const SHEET_SCALE = 1.8;
const FROM = { X: 118, Y: -137, Z: 70, yaw: 8 };
type Flight = { t0: number; dur: number; X: number; Z: number; yaw: number; seed: number; spread: number };
const targetOf = (seed: string, wide: boolean) => {
  const X = wide ? lerp(-1100, 1100, random(`${seed}x`)) : lerp(-290, 400, random(`${seed}x`));
  // in the pull-back they land all over the top, not in a fringe along its edge
  const Z = wide ? lerp(-168, 2300, Math.pow(random(`${seed}z`), 1.4)) : lerp(-168, -128, random(`${seed}z`));
  return { X, Z, yaw: lerp(-35, 35, random(`${seed}y`)) };
};
export const FLIGHTS: Flight[] = (() => {
  const out: Flight[] = [];
  // the eleven single sheets: alternately left and right of the desk's middle, all in view
  LAND.forEach((l, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const X = 55 + side * lerp(150, 300, random(`ln${i}x`));
    out.push({ t0: l - FLIGHT, dur: FLIGHT, X, Z: lerp(-166, -132, random(`ln${i}z`)), yaw: lerp(-30, 30, random(`ln${i}y`)), seed: i, spread: 1 });
  });
  // the stream: launches at a rate following the deposit (about one per 140 mass units), seeded
  let acc = 0;
  let n = 0;
  for (let f = 58; f < 142; f += 0.25) {
    const rate = Math.max(0, MCONT(f + 0.25) - MCONT(f)) / 140;
    acc += Math.min(rate, 0.75);
    while (acc >= 1) {
      acc -= 1;
      out.push({ t0: f - 9, dur: 9, ...targetOf(`st${n}`, f > 100), seed: 100 + n, spread: 0.45 });
      n++;
    }
  }
  // the hold: a last sheet or two settling
  out.push({ t0: 127, dur: 11, ...targetOf("hold0", false), seed: 900, spread: 0.6 });
  out.push({ t0: 133, dur: 11, ...targetOf("hold1", false), seed: 901, spread: 0.6 });
  return out;
})();
const SPREAD = 8;
const Sheets: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const { x0, x1, zF } = TOWER;
  const washes: React.ReactNode[] = [];
  const els: React.ReactNode[] = [];
  FLIGHTS.forEach((fl, i) => {
    const u = (frame - fl.t0) / fl.dur;
    if (u <= 0) return;
    const after = frame - (fl.t0 + fl.dur);
    if (after > SPREAD) return;
    // the spread: a pale wash of paper running out from the sheet across the top and fading as the band forms
    if (after > 0) {
      const s = 1 - Math.pow(1 - c01(after / SPREAD), 2.2);
      const hw = 34 * SHEET_SCALE * 0.5;
      const hl = 53 * SHEET_SCALE * 0.5;
      const wx0 = lerp(fl.X - hw, lerp(fl.X - hw, x0, fl.spread), s);
      const wx1 = lerp(fl.X + hw, lerp(fl.X + hw, x1, fl.spread), s);
      const wz0 = lerp(fl.Z - hl, zF, s);
      const wz1 = lerp(fl.Z + hl, fl.Z + hl + 260 * fl.spread, s);
      const op = 0.8 * fl.spread * (1 - sstep(after / SPREAD)) * sstep(after / 1.5);
      washes.push(
        <path key={`w${i}`} d={poly([P.p(wx0, -0.4, wz0), P.p(wx1, -0.4, wz0), P.p(wx1, -0.4, wz1), P.p(wx0, -0.4, wz1)])} fill="#FFF9EC" fillOpacity={op} />,
      );
    }
    const to: SheetPose = { X: fl.X, Y: -0.6, Z: fl.Z, yaw: fl.yaw, pitch: 0, roll: 0, curl: 0 };
    const pose = sheetFlight(FROM, to, Math.min(1, u), fl.seed);
    // landed: it lies a beat, then melts into the wash
    const op = after <= 1 ? 1 : 1 - sstep((after - 1) / 4);
    if (op <= 0.01) return;
    const lift = Math.max(0, -pose.Y);
    const sa = (fl.spread >= 1 ? 0.3 : 0.12) * (1 - c01(lift / 80));
    const sc = P.p(pose.X + 4 + lift * 0.1, 0, pose.Z + 4);
    const rr = P.r(pose.Z + 4);
    const cc = P.p(pose.X, pose.Y, pose.Z);
    els.push(
      <g key={i} opacity={op}>
        {sa > 0.01 && <ellipse cx={f2(sc[0])} cy={f2(sc[1])} rx={f2(30 * SHEET_SCALE * rr)} ry={f2(16 * SHEET_SCALE * rr)} fill="url(#eons-shadow)" opacity={sa} />}
        <g transform={`translate(${f2(cc[0])} ${f2(cc[1])}) scale(${SHEET_SCALE}) translate(${f2(-cc[0])} ${f2(-cc[1])})`}>
          <WorkSheet A={A} pose={pose} uid={`sh${i}`} />
        </g>
      </g>,
    );
  });
  return (
    <g>
      <defs>
        <radialGradient id="eons-shadow">
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={1} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {washes}
      {els}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE NIGHTS: the stage dims a little and cools by night, warms at dawn and dusk (AirStage overlay)
// ---------------------------------------------------------------------------
// (a slow sine over the day, not the window's quick dawns and dusks: the whole stage must never flicker)
const DayVeil: React.FC<{ frame: number }> = ({ frame }) => {
  const night = 0.5 - 0.5 * Math.cos((2 * Math.PI * (hoursAt(frame) - 13)) / 24);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ mixBlendMode: "multiply", background: `rgba(84,108,124,${(0.16 * night).toFixed(3)})` }} />
    </AbsoluteFill>
  );
};


// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const EonsInEightyEightHours: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { e, cam, camL, A, AL } = frameState(frame);
  // the medium's motes parallax against the eye's true travel (up and back)
  const v = makeAirView({
    scene: { ...AIR_SCENE_DEPTH, ...SCENE, F: A.P.Dc * cam.k },
    frame,
    horizon: 960 + (A.P.opts.eyeY - cam.cy) * cam.k,
    cam: { x: cam.cx, y: e.H, z: -e.D },
    rest: { x: REST.cam.cx, y: eyeAt(0).H, z: -eyeAt(0).D },
  });
  const sit = AL.P.at(0, 0);
  return (
    <AirStage v={v} bloom={0.22} shafts={0.6} overlay={<DayVeil frame={frame} />}>
      <HazeSea A={A} />
      <WorldSvg cam={cam}>
        <Pillar A={A} frame={frame} L={e.lift} />
      </WorldSvg>
      <WorldSvg cam={camL}>
        <OfficeWall A={AL} frame={frame} />
        <RaceClock A={AL} frame={frame} />
        <Plate A={AL} X={PLATE88.X} Y={PLATE88.Y} Z={WALL.z - 4} text="88 HOURS" t={plateT(frame, 58, 13)} uid="pl88" size={PLATE88.size} />
        <OfficeDesk A={AL} X={0} Z={0} dir={1} uid="dk" layer="back" screen={1} />
        <Bot variant={0} pose={BOT_POSES.typeAtDesk(1, frame)} at={sit.at} scale={sit.scale} uid="bot" frame={frame} fog={AL.folkFog(0)} unitPx={camL.k} />
        <OfficeDesk A={AL} X={0} Z={0} dir={1} uid="dkf" layer="front" screen={1} />
        <Sheets A={AL} frame={frame} />
      </WorldSvg>
    </AirStage>
  );
};

export { screenOf };
export default EonsInEightyEightHours;
