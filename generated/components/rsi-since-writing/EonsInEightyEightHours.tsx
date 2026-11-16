// ---------------------------------------------------------------------------
// EonsInEightyEightHours (rsi-since-writing, cut 7; final 56_EonsInEightyEightHours.mov), REVISION 2 (after the
// user's notes on rev 1: no room; time in the air and light itself; a hand-made, living pillar). Dwarkesh 3D style
// (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 143 frames. One stage inside the misty teal air (AirStage) on
// a londonDepth one-point perspective, from the kit kits/dwarkesh-3d/dwarkesh3d (its header is the API). THE ROBOT is
// the sister clip's tenEarthsBot (v0, read only; BOT_READY.md); the desk and monitor, the paper sheets and the plate
// are this clip's world module (sinceWritingWorld, read only). The pillar, the sky, the desk clock and the clutter are
// cut-local.
//
// CHECK LINE: "In just 88 hours the AIs packed in thinking that would take one person thousands of years."
//
// THE LINE: "And they did it, in part, by compacting, within 88 hours, eons of cognitive work to"
// WORD -> FRAME: days. -12 · And -1 · they 3 · did 6 · it, 12 · in 20 · part, 27 · by 36 · compacting, 43 · within 62
// · 88 71 · hours, 84 · eons 98 · of 113 · cognitive 121 · work 130 · to 138 (· match 144, after the cut)
// DURATION: the slot 56.3062 -> 62.2705 s = 5.964 s x 23.976 = 143 frames (f0..f142).
//
// THE MOTION: one orange robot (THE AI) types at its desk and computer on the top of a pillar of paper strata, out in
// the open teal air (no room). Time runs fast in the air and light itself: 88 hours from 02:00 on day one to 18:00
// on day four (it ends in the evening light); the whole sky and air cycle day -> night four times (warm day light, a rose dusk, a short deep petrol
// night with a few stars, a rose dawn; never black), a soft sun glow and a pale moon arc across the sky behind, and
// at night the monitor's glow is the light on the robot and the desk. The 88 hours are counted by a small desk clock
// standing on a stack of reams beside the desk, its hands racing (the hour hand turns 7.3 times; the minute hand a
// blur), a plate "88 HOURS" on the stack's front (world space; fades in f58-71, legible on "88"). The top round the
// desk is lived in: stacks of reams, a crumpled sheet, loose sheets. From f0 the top's front edge is in view: every
// finished sheet (drawn 1.8x a real sheet, to read) lifts off the desk, sails down in front of it, lands near the edge
// and spreads flat into a new LAYER, the edge growing one band at a time (f0-60: 11 sheets), lifting the desk; on
// "compacting" (f43-60) those layers press down to 40 % (the desk dips, the bands squeeze), then the sheets stream and
// the layers pile up as strata. The pillar is hand-made, like a cliff built of reams: sediment bands (cream / oatmeal /
// pale grey / warm white / sand, a light umber now and then, irregular thicknesses) whose boundaries bulge and dip,
// each band leaning a little off the one under it (the offsets and bulges grow as a band is buried, so the top stays
// clean), soft gouache mottling, a lit left side and a shadowed right, darker sheet-edge seams and lines, a lit top
// edge per band, sheets sticking out of the face here and there, and a few sheets drifting down past it. The deeper
// layers read older (greyer, hazier) and dissolve into the haze far below; the foot is never seen. By "eons" (f98) the
// desk has risen ~1,500 units (8 m). From "eons" the camera pulls back and the frame slides down the pillar in one
// move (a dolly-zoom-out) until the tiny desk and robot sit centred on the top (x ~450-630, y ~370-450) with the
// strata falling away past the bottom edge (~6,900 units, 39 m, of the robot's paper in view); settled by ~f134, a
// living hold: the robot typing, sheets drifting down, the clock racing, the sky still turning.
// Orange = the robot only (COMMON.md). No text but "88 HOURS".
//
// DEPTH: one pinhole camera; per frame its eye X (cx, CX_AT), its eye height above the pillar's top (HR 250 -> 300),
// its distance D in front of the front plane (Z = 0, the robot's hips), its zoom k = F / D (the front plane's screen
// scale) and the horizon's screen row (tracks K_AT, D_AT, CX_AT, YH_AT, HR_AT below). The eye rides the top (H = lift
// + HR), lagging a little through f0-70 (tau 5 frames) so each new layer visibly lifts the desk and the compaction
// visibly presses it down. f0: k 1.25, D 900, horizon y 650 (the robot ~330 px, the edge at y ~1060) -> f98: k 0.85,
// D 1200 -> f142: k 0.19, D 8000, horizon y 392 (the robot ~51 px). Mapped onto londonDepth as eyeY = -H, dRef = D,
// kRef = k, dolly 0. Everything ON the top is drawn in the top's own frame with a lifted camera (eyeY + lift, cy +
// lift: exact). Fog by depth; the strata's fall into the haze is a screen-row ramp from the top edge down. World units
// = the cast's (178 a metre; the robot 240 = 1.35 m). The pillar: X -1400..1400, Z -220..2600; heights are above the
// paper the robot started on (older paper below it, already compressed to 60 %). The clock stack: X 230..470, Z
// 30..110, the clock at (350, -132, 70) R 62, the plate at (350, -36) size 40 on the stack's front.
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
import { MAT_FRAME, OfficeDesk, Plate, WorkSheet, plateT, sheetFlight, type SheetPose } from "./sinceWritingWorld";

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
// TIME: 88 hours across the slot, from 02:00 on the first day (so it ends in the evening light, at 18:00)
// ---------------------------------------------------------------------------
export const HOUR0 = 2;
export const hoursAt = (f: number) => HOUR0 + (88 * f) / DURATION;
/** the sun's height in the sky, -1 (midnight) .. 1 (noon) */
export const sunSinAt = (f: number) => Math.sin((2 * Math.PI * (hoursAt(f) - 6)) / 24);
/** daylight 0..1: the nights kept short (under half light ~7.6 hours, ~12 frames; full night only ~4 frames), the
 *  turns soft (~7 frames each, so the whole stage never flashes) */
export const lightAt = (f: number) => sstep((sunSinAt(f) + 1.05) / 1.0);
/** the rose of dawn and dusk 0..1 */
export const roseAt = (f: number) => Math.exp(-Math.pow((sunSinAt(f) + 0.12) / 0.28, 2));



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

/** the hand-made look of each band, seeded: its lean (an X offset off the band under it), a little width wobble,
 *  the bulge of its lower boundary, a sheet sticking out of the face, a gouache mottle */
type Org = {
  dx: number;
  wl: number;
  wr: number;
  /** the top corners' lean off the bottom ones, and each side's bow (+ out, - pinched in) */
  lean: number;
  bl: number;
  br: number;
  ph1: number;
  ph2: number;
  L1: number;
  L2: number;
  amp: number;
  stick: { X: number; w: number; s: number; yaw: number } | null;
  blot: { u: number; rx: number; light: boolean } | null;
};
const ORG: Org[] = BANDS.map((_, i) => {
  const r = (k: string) => random(`org${i}${k}`);
  return {
    dx: (r("dx") * 2 - 1) * 62,
    wl: (r("wl") * 2 - 1) * 30,
    wr: (r("wr") * 2 - 1) * 30,
    lean: (r("ln") * 2 - 1) * 26,
    bl: -12 + r("bl2") * 52,
    br: -12 + r("br2") * 52,
    ph1: r("p1") * 6.283,
    ph2: r("p2") * 6.283,
    L1: 330 + r("l1") * 420,
    L2: 120 + r("l2") * 140,
    amp: 0.6 + r("am") * 0.6,
    stick: r("st") < 0.85 ? { X: lerp(-1300, 1250, r("sx")), w: 30 + r("sw") * 70, s: 6 + r("ss") * 16, yaw: (r("sy") * 2 - 1) * 16 } : null,
    blot: r("bl") < 0.6 ? { u: 0.1 + r("bu") * 0.8, rx: 0.12 + r("br") * 0.2, light: r("bk") < 0.55 } : null,
  };
});

// ---------------------------------------------------------------------------
// THE WORLD (cast units, 178 a metre; Y up is -; Z depth, toward the camera -)
// ---------------------------------------------------------------------------
/** the pillar of paper under the desk */
export const TOWER = { x0: -1400, x1: 1400, zF: -220, zB: 2600 };
/** the stack of reams the desk clock stands on (in the top's frame: Y = 0 is the paper's top) */
export const CLOCK_STACK = { x0: 230, x1: 470, z0: 30, z1: 110, reams: 3 };
export const CLOCK = { X: 350, Y: -132, Z: 70, R: 62 };
export const PLATE88 = { X: 350, Y: -36, Z: 28, size: 40 };
/** the other stacks of reams on the top (lived in) */
const STACKS = [
  { x0: -380, x1: -240, z0: 130, z1: 230, reams: 5, uid: "s2" },
  { x0: 560, x1: 700, z0: 320, z1: 420, reams: 4, uid: "s3" },
  { x0: -760, x1: -610, z0: -150, z1: -60, reams: 2, uid: "s4" },
  { x0: 820, x1: 950, z0: -40, z1: 60, reams: 3, uid: "s5" },
];
/** loose sheets lying on the top, and one crumpled sheet */
const LOOSE = [
  { X: -300, Z: 30, yaw: 28 },
  { X: 520, Z: -90, yaw: -16 },
  { X: -140, Z: 300, yaw: 52 },
  { X: 300, Z: 230, yaw: 9 },
  { X: -560, Z: 110, yaw: -38 },
];
const CRUMPLE = { X: -220, Z: -70, R: 24 };

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
const CX_AT = track([
  [0, 80],
  [98, 100],
  [116, 170],
  [142, 205],
]);
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
    cx: CX_AT(f),
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
// THE PILLAR OF PAPER, hand-made: the top (lit paper, by depth) and the front face of strata. Each band is a polygon
// whose lower boundary bulges and dips and which leans a little off the one under it (both growing as it is buried, so
// the top edge stays clean); a lit side and a shadowed side, soft gouache mottles, a lit top edge, a darker seam and
// fine sheet-edge lines, a fine screen-constant hatch of sheet edges, sheets sticking out here and there; from the top
// edge down a screen-row ramp turns the bands greyer, then into the air itself, so the pillar dissolves into the haze
// far below and its foot is never seen
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
  const px = 1 / cam.k;
  const rF = P.r(zF);
  const toS = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const toW = (sy: number) => cam.cy + (sy - 960) / cam.k;
  const yTopS = toS(P.p(0, -L, zF)[1]);
  // the strata keep half their colour through the air in front of them (they are the subject)
  const t = (hex: string, h: number) => mixHex(hex, A.tone(hex, zF, h), 0.5);
  const c = compAt(frame);
  const M = massAt(frame);
  const H = (m: number) => heightOf(m, frame);
  const thick = (i: number) => H(Math.min(BANDS[i].m1, M)) - H(BANDS[i].m0);
  /** how buried a height is (0 at the top .. 1 a few hundred units down): the hand-made irregularity grows with it */
  const buried = (h: number) => sstep((L - h) / 420);
  /** the height of band i's lower boundary at X (it bulges and dips) */
  const yAt = (i: number, X: number) => {
    const h = H(BANDS[i].m0);
    if (i <= 0) return h;
    const o = ORG[i];
    const a = Math.min(22, 0.16 * Math.min(thick(i), thick(i - 1))) * o.amp * buried(h);
    return h + a * (0.62 * Math.sin(X / o.L1 + o.ph1) + 0.38 * Math.sin(X / o.L2 + o.ph2));
  };
  const edges = (i: number, h1: number) => {
    const g = buried(h1);
    const o = ORG[i];
    return [x0 + (o.dx + o.wl) * g, x1 + (o.dx + o.wr) * g] as const;
  };
  // ---- which bands are in the frame ----
  type VB = { i: number; h0: number; h1: number; tone: string; top: boolean; xl: number; xr: number };
  const vis: VB[] = [];
  for (let i = 0; i < BANDS.length; i++) {
    const b = BANDS[i];
    if (b.m0 >= M) break;
    const m1 = Math.min(b.m1, M);
    const h0 = H(b.m0);
    const h1 = H(m1);
    if (toS(P.p(0, -h1, zF)[1]) > 1940) continue;
    if (toS(P.p(0, -h0, zF)[1]) < -20) continue;
    const isSingle = b.m0 >= 0 && b.m0 < LAYER * (LAND.length + 1);
    // (the newest strata, just under the desk, are still fresh cream; their own tones come up as they are buried)
    const fresh = !isSingle && b.m0 >= 0 ? 0.65 * (1 - sstep((M - m1) / 1800)) : 0;
    const tone = isSingle ? mixHex(b.tone, "#C9BDA3", (0.35 * (1 - c)) / 0.6) : mixHex(b.tone, "#F3ECDC", fresh);
    const [xl, xr] = edges(i, h1);
    vis.push({ i, h0, h1, tone, top: m1 >= M, xl, xr });
  }
  const NX = 12;
  const topCurve = (v: VB) => {
    const pts: P2[] = [];
    for (let k = 0; k <= NX; k++) {
      const X = lerp(v.xl, v.xr, k / NX);
      pts.push(P.p(X, -(v.top ? L : yAt(v.i + 1, X)), zF));
    }
    return pts;
  };
  const botCurve = (v: VB) => {
    const pts: P2[] = [];
    for (let k = 0; k <= NX; k++) {
      const X = lerp(v.xl, v.xr, k / NX);
      pts.push(P.p(X, -yAt(v.i, X), zF));
    }
    return pts;
  };
  const line = (q: P2[], dy = 0) => `M${q.map((p) => `${f2(p[0])},${f2(p[1] + dy)}`).join("L")}`;
  // ---- the bands ----
  const bands: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];
  const sticks: React.ReactNode[] = [];
  const blots: React.ReactNode[] = [];
  const outlineL: P2[] = [];
  const outlineR: P2[] = [];
  for (let n = vis.length - 1; n >= 0; n--) {
    const v = vis[n];
    const tc = topCurve(v);
    const bc = botCurve(v);
    // the sides lean and bow a little (a hand-squared ream, not a ruled box), growing as the band is buried
    const og = ORG[v.i];
    const gb = buried(v.h1);
    const sideMid = (a: P2, b: P2, bow: number): P2 => [(a[0] + b[0]) / 2 + bow * gb * rF, (a[1] + b[1]) / 2];
    const lean = og.lean * gb * rF;
    tc[0] = [tc[0][0] + lean, tc[0][1]];
    tc[NX] = [tc[NX][0] + lean, tc[NX][1]];
    const cR = sideMid(tc[NX], bc[NX], og.br);
    const cL = sideMid(bc[0], tc[0], -og.bl);
    const d = `M${tc.map(Pt).join("L")}Q${Pt(cR)} ${Pt(bc[NX])}L${[...bc].reverse().map(Pt).join("L")}Q${Pt(cL)} ${Pt(tc[0])}Z`;
    bands.push(<path key={`b${v.i}`} d={d} fill={t(v.tone, v.h0)} />);
    bands.push(<path key={`bs${v.i}`} d={d} fill="url(#pl-shade)" />);
    const qm = (a: P2, c: P2, b: P2): P2 => [0.25 * a[0] + 0.5 * c[0] + 0.25 * b[0], 0.25 * a[1] + 0.5 * c[1] + 0.25 * b[1]];
    outlineL.push(tc[0], qm(tc[0], cL, bc[0]), bc[0]);
    outlineR.push(tc[NX], qm(tc[NX], cR, bc[NX]), bc[NX]);
    const bandPx = (bc[0][1] - tc[0][1]) * cam.k;
    // a single sheet's new layer glows fresh as it forms at the edge, then settles to its tone
    const j = Math.round(BANDS[v.i].m0 / LAYER) - 1;
    if (BANDS[v.i].m0 > 0 && j >= 0 && j < LAND.length) {
      const g = sstep((frame - LAND[j]) / 3) * (1 - sstep((frame - LAND[j] - 5) / 9));
      if (g > 0.01) bands.push(<path key={`bg${v.i}`} d={d} fill="#FFFAF0" fillOpacity={0.5 * g} />);
    }
    // a slightly lit top edge, the darker sheet-edge seam under it, fine sheet-edge lines within it
    if (bandPx > 5) lines.push(<path key={`lt${v.i}`} d={line(tc, 1.4 * px)} stroke="#FFF8EA" strokeOpacity={0.6} strokeWidth={f2(1.3 * px)} fill="none" />);
    lines.push(<path key={`ls${v.i}`} d={line(bc)} stroke={t(mixHex(v.tone, "#6A5E4C", 0.6), v.h0)} strokeWidth={f2(Math.max(lw, 1.7 * px))} fill="none" />);
    const b = BANDS[v.i];
    for (let k = 0; bandPx > 9 && k < b.lam.length; k++) {
      const q = b.lam[k];
      if (b.m0 + q * (b.m1 - b.m0) >= Math.min(b.m1, M)) continue;
      const pts: P2[] = [];
      for (let s = 0; s <= NX; s++) pts.push([tc[s][0], lerp(bc[s][1], tc[s][1], q * (b.m1 - b.m0) / (Math.min(b.m1, M) - b.m0))]);
      lines.push(<path key={`ll${v.i}-${k}`} d={line(pts)} stroke={t(mixHex(v.tone, "#7A6E5A", 0.42), v.h0)} strokeWidth={f2(Math.max(lw * 0.6, 0.9 * px))} fill="none" />);
    }
    const o = ORG[v.i];
    // a gouache mottle
    if (o.blot && bandPx > 14) {
      const X = lerp(v.xl, v.xr, o.blot.u);
      const hc = (v.h0 + v.h1) / 2;
      const cc = P.p(X, -hc, zF);
      blots.push(<ellipse key={`bm${v.i}`} cx={f2(cc[0])} cy={f2(cc[1])} rx={f2(o.blot.rx * (x1 - x0) * rF)} ry={f2(0.42 * (v.h1 - v.h0) * rF)} fill={o.blot.light ? "url(#pl-blot-l)" : "url(#pl-blot-d)"} />);
    }
    // a sheet sticking out of the face at its lower boundary (only once buried a little)
    if (o.stick && !v.top && v.i > 0) {
      const g = buried(v.h1);
      const s = o.stick.s * g;
      if (s > 3) {
        const X = Math.min(v.xr - o.stick.w - 30, Math.max(v.xl + 30, o.stick.X));
        const h = yAt(v.i, X + o.stick.w / 2) + 1.5;
        const sh = s * Math.tan((o.stick.yaw * Math.PI) / 180);
        const q = [P.p(X, -h, zF + 4), P.p(X + o.stick.w, -h, zF + 4), P.p(X + o.stick.w + sh, -h, zF - s), P.p(X + sh, -h, zF - s)];
        const under = [P.p(X + sh, -h + 3, zF - s), P.p(X + o.stick.w + sh, -h + 3, zF - s)];
        sticks.push(
          <g key={`st${v.i}`}>
            <path d={`M${Pt(under[0])}L${Pt(under[1])}`} stroke={PAL.shadow} strokeOpacity={0.3} strokeWidth={f2(1.6 * px)} />
            <path d={poly(q)} fill={t(mixHex(v.tone, "#F7F1E3", 0.55), v.h0)} stroke={t("#B3A68C", v.h0)} strokeWidth={f2(0.8 * px)} strokeOpacity={0.6} />
          </g>,
        );
      }
    }
  }
  // below the oldest band drawn: the same paper on down, out of the frame
  const low = vis.length ? vis[0] : null;
  const bottomW = toW(1940);
  const lowY = low ? P.p(0, -low.h0, zF)[1] : P.p(0, -L, zF)[1];
  const lowXl = low ? P.p(low.xl, 0, zF)[0] : P.p(x0, 0, zF)[0];
  const lowXr = low ? P.p(low.xr, 0, zF)[0] : P.p(x1, 0, zF)[0];
  outlineL.push([lowXl, Math.max(bottomW, lowY + 1)]);
  outlineR.push([lowXr, Math.max(bottomW, lowY + 1)]);
  const outline = `M${[...outlineL, ...outlineR.reverse()].map(Pt).join("L")}Z`;
  // the deep-time ramp, in screen rows from the top edge to the frame's bottom
  const NS = 24;
  const rampStops: React.ReactNode[] = [];
  for (let i = 0; i <= NS; i++) {
    const sy = yTopS + ((1940 - yTopS) * i) / NS;
    const [toAir, o] = deepAt(sy - yTopS);
    rampStops.push(<stop key={i} offset={i / NS} stopColor={mixHex(DEEP_GREY, hazeBelow(A, sy), toAir)} stopOpacity={o} />);
  }
  const fa = P.p(x0, -L, zF);
  const xa = P.p(x0 - 40, 0, zF)[0];
  const xb = P.p(x1 + 40, 0, zF)[0];
  // the top
  const NZ = 10;
  const ya = P.p(0, -L, zF)[1];
  const yb = P.p(0, -L, zB)[1];
  const span = yb - ya;
  return (
    <g>
      <defs>
        <linearGradient id="pl-top" gradientUnits="userSpaceOnUse" x1="0" y1={f2(ya)} x2="0" y2={f2(yb)}>
          {Array.from({ length: NZ + 1 }, (_, i) => {
            const Z = zF + ((zB - zF) * i) / NZ;
            return <stop key={i} offset={c01(Math.abs(span) < 1e-3 ? 0 : (P.p(0, -L, Z)[1] - ya) / span)} stopColor={A.tone(TOP_PAPER, Z, L)} />;
          })}
        </linearGradient>
        <linearGradient id="pl-shade" gradientUnits="userSpaceOnUse" x1={f2(xa)} y1="0" x2={f2(xb)} y2="0">
          <stop offset="0" stopColor="#FFF6E4" stopOpacity={0.3} />
          <stop offset="0.36" stopColor="#FFF6E4" stopOpacity={0} />
          <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.36} />
        </linearGradient>
        <radialGradient id="pl-blot-l">
          <stop offset="0" stopColor="#FFF9EE" stopOpacity={0.16} />
          <stop offset="1" stopColor="#FFF9EE" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pl-blot-d">
          <stop offset="0" stopColor="#7E705A" stopOpacity={0.12} />
          <stop offset="1" stopColor="#7E705A" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="pl-deep" gradientUnits="userSpaceOnUse" x1="0" y1={f2(fa[1])} x2="0" y2={f2(Math.max(bottomW, fa[1] + 1))}>
          {rampStops}
        </linearGradient>
        <pattern id="pl-hatch" patternUnits="userSpaceOnUse" width={f2(6 * px)} height={f2(3 * px)}>
          <rect x="0" y="0" width={f2(6 * px)} height={f2(0.7 * px)} fill={PAL.shadow} fillOpacity={0.08} />
        </pattern>
        <clipPath id="pl-clip">
          <path d={outline} />
        </clipPath>
      </defs>
      <path d={poly([P.p(x0, -L, zF), P.p(x1, -L, zF), P.p(x1, -L, zB), P.p(x0, -L, zB)])} fill="url(#pl-top)" />
      <path d={`M${Pt(P.p(x0, -L, zB))}L${Pt(P.p(x1, -L, zB))}`} stroke={A.tone(SHADE, zB, L)} strokeOpacity={0.5} strokeWidth={lw} />
      {low && <rect x={f2(lowXl)} y={f2(lowY)} width={f2(lowXr - lowXl)} height={f2(Math.max(1, bottomW - lowY))} fill={t(mixHex(BANDS[low.i].tone, "#B9B2A2", 0.3), 0)} />}
      {bands}
      <g clipPath="url(#pl-clip)">
        {blots}
        <rect x={f2(xa)} y={f2(fa[1])} width={f2(xb - xa)} height={f2(Math.max(1, bottomW - fa[1]))} fill="url(#pl-hatch)" />
      </g>
      {lines}
      {sticks}
      <path d={outline} fill="url(#pl-deep)" />
      <path d={`M${Pt(P.p(x0, -L, zF))}L${Pt(P.p(x1, -L, zF))}`} stroke={PAL.cream} strokeOpacity={0.75} strokeWidth={lw * 1.3} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE LIVED-IN TOP (in the top's frame): stacks of reams (each ream a little off the one under it), loose sheets, a
// crumpled sheet
// ---------------------------------------------------------------------------
const ReamStack: React.FC<{ A: AirWorld; x0: number; x1: number; z0: number; z1: number; reams: number; uid: string }> = ({ A, x0, x1, z0, z1, reams, uid }) => {
  const P = A.P;
  const ex = P.vp[0];
  const els: React.ReactNode[] = [];
  let y = 0;
  for (let k = 0; k < reams; k++) {
    const hk = uid === "clk" ? 23 : 18 + random(`${uid}h${k}`) * 9;
    const dx = k === 0 ? 0 : (random(`${uid}x${k}`) * 2 - 1) * 7;
    const dz = k === 0 ? 0 : (random(`${uid}z${k}`) * 2 - 1) * 6;
    const a0 = x0 + dx;
    const a1 = x1 + dx;
    const b0 = z0 + dz;
    const b1 = z1 + dz;
    const yb = -y;
    const yt = -(y + hk);
    const tn = (hex: string) => A.tone(hex, b0, y + hk / 2);
    if (ex > a1) els.push(<path key={`r${k}`} d={poly([P.p(a1, yb, b0), P.p(a1, yb, b1), P.p(a1, yt, b1), P.p(a1, yt, b0)])} fill={tn("#D3C7AD")} />);
    if (ex < a0) els.push(<path key={`l${k}`} d={poly([P.p(a0, yb, b0), P.p(a0, yb, b1), P.p(a0, yt, b1), P.p(a0, yt, b0)])} fill={tn("#E4DAC4")} />);
    els.push(<path key={`f${k}`} d={poly([P.p(a0, yb, b0), P.p(a1, yb, b0), P.p(a1, yt, b0), P.p(a0, yt, b0)])} fill={tn(k % 2 ? "#EDE5D2" : "#F2EBDB")} />);
    for (let q = 1; q < 3; q++) {
      const yy = lerp(yb, yt, q / 3);
      els.push(<path key={`fl${k}-${q}`} d={`M${Pt(P.p(a0, yy, b0))}L${Pt(P.p(a1, yy, b0))}`} stroke={tn("#B9AC92")} strokeOpacity={0.55} strokeWidth={A.lw(0.7)} />);
    }
    els.push(<path key={`fb${k}`} d={`M${Pt(P.p(a0, yb, b0))}L${Pt(P.p(a1, yb, b0))}`} stroke={tn("#8F826A")} strokeOpacity={0.6} strokeWidth={A.lw(0.9)} />);
    els.push(<path key={`t${k}`} d={poly([P.p(a0, yt, b0), P.p(a1, yt, b0), P.p(a1, yt, b1), P.p(a0, yt, b1)])} fill={tn("#F7F2E6")} />);
    y += hk;
  }
  // its soft contact shadow on the paper
  const s0 = P.p(x0 - 10, 0, z0 - 6);
  const s1 = P.p(x1 + 14, 0, z1 + 10);
  return (
    <g>
      <ellipse cx={f2((s0[0] + s1[0]) / 2 + 4 * P.r(z0))} cy={f2((s0[1] + s1[1]) / 2)} rx={f2(Math.abs(s1[0] - s0[0]) * 0.58)} ry={f2(Math.max(2, Math.abs(s1[1] - s0[1]) * 0.7))} fill="url(#eons-shadow)" opacity={0.22} />
      {els}
    </g>
  );
};
const Crumple: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const { X, Z, R } = CRUMPLE;
  const n = 11;
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = R * (0.72 + 0.4 * random(`cr${i}`));
    pts.push(P.p(X + Math.cos(a) * rr, -R * 0.75 - Math.sin(a) * rr * 0.8, Z));
  }
  const c = P.p(X, -R * 0.75, Z);
  const tn = (hex: string) => A.tone(hex, Z, R);
  let creases = "";
  for (let i = 0; i < n; i += 2) creases += `M${Pt(c)}L${Pt([lerp(c[0], pts[i][0], 0.8), lerp(c[1], pts[i][1], 0.8)])}`;
  const sh = P.p(X + 6, 0, Z + 4);
  return (
    <g>
      <ellipse cx={f2(sh[0])} cy={f2(sh[1])} rx={f2(R * 1.3 * P.r(Z))} ry={f2(R * 0.4 * P.r(Z))} fill="url(#eons-shadow)" opacity={0.35} />
      <path d={poly(pts)} fill={tn("#F1EADA")} stroke={tn("#A79A80")} strokeWidth={A.lw(0.8)} strokeLinejoin="round" />
      <path d={`M${Pt(pts[3])}L${Pt(pts[6])}L${Pt(pts[9])}L${Pt(pts[1])}Z`} fill={tn("#DCD2BD")} fillOpacity={0.7} />
      <path d={creases} stroke={tn("#9E9078")} strokeOpacity={0.6} strokeWidth={A.lw(0.6)} fill="none" />
    </g>
  );
};
const LooseSheets: React.FC<{ A: AirWorld; near: boolean }> = ({ A, near }) => (
  <g>
    {LOOSE.filter((s) => s.Z < 0 === near).map((s, i) => {
      const pose: SheetPose = { X: s.X, Y: -0.5, Z: s.Z, yaw: s.yaw, pitch: 0, roll: 0, curl: 0.15 };
      const cc = A.P.p(s.X, -0.5, s.Z);
      return (
        <g key={i} transform={`translate(${f2(cc[0])} ${f2(cc[1])}) scale(1.5) translate(${f2(-cc[0])} ${f2(-cc[1])})`}>
          <WorkSheet A={A} pose={pose} uid={`lo${near ? "n" : "f"}${i}`} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------------------
// THE DESK CLOCK (in the top's frame, standing on its stack of reams): slate rim, cream face, 12 marks, its hands
// racing: the hour hand turns once per 12 hours (18 degrees a frame), the minute hand is a motion blur
// ---------------------------------------------------------------------------
const DeskClock: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const { X, Y, Z, R } = CLOCK;
  const c = P.p(X, Y, Z);
  const r = R * P.r(Z);
  const t = (hex: string) => A.tone(hex, Z, -Y);
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
    const a0 = at(i * 30, i % 3 === 0 ? 0.68 : 0.76);
    const a1 = at(i * 30, 0.85);
    marks.push(<line key={i} x1={f2(a0[0])} y1={f2(a0[1])} x2={f2(a1[0])} y2={f2(a1[1])} stroke={t("#3A3430")} strokeWidth={f2((i % 3 === 0 ? 0.08 : 0.05) * r)} strokeLinecap="round" />);
  }
  const wedge: P2[] = [c];
  for (let i = 0; i <= 12; i++) wedge.push(at(aM - 110 + (110 * i) / 12, 0.66));
  const hEnd = at(aH, 0.46);
  const hBack = at(aH + 180, 0.08);
  const mEnd = at(aM, 0.68);
  const back = P.p(X + 6, Y - 4, Z + 14);
  const footL = P.p(X - R * 0.55, -70, Z);
  const footR = P.p(X + R * 0.55, -70, Z);
  return (
    <g>
      <circle cx={f2(back[0])} cy={f2(back[1])} r={f2(r * 1.02)} fill={t(MAT_FRAME.dark)} />
      <path d={`M${Pt(at(200, 0.8))}L${Pt(footL)}`} stroke={t(MAT_FRAME.dark)} strokeWidth={f2(0.12 * r)} strokeLinecap="round" />
      <path d={`M${Pt(at(160, 0.8))}L${Pt(footR)}`} stroke={t(MAT_FRAME.dark)} strokeWidth={f2(0.12 * r)} strokeLinecap="round" />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r)} fill={t(MAT_FRAME.mid)} />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r * 0.88)} fill={t("#EFE7D6")} />
      <path d={`M${f2(c[0] - 0.95 * r)},${f2(c[1] - 0.15 * r)}A${f2(0.95 * r)},${f2(0.95 * r)} 0 0 1 ${f2(c[0] + 0.15 * r)},${f2(c[1] - 0.95 * r)}`} fill="none" stroke={PAL.cream} strokeOpacity={0.5} strokeWidth={f2(0.05 * r)} strokeLinecap="round" />
      {marks}
      <path d={poly(wedge)} fill={ink} fillOpacity={0.16} />
      <line x1={f2(c[0])} y1={f2(c[1])} x2={f2(mEnd[0])} y2={f2(mEnd[1])} stroke={ink} strokeOpacity={0.55} strokeWidth={f2(0.05 * r)} strokeLinecap="round" />
      <line x1={f2(hBack[0])} y1={f2(hBack[1])} x2={f2(hEnd[0])} y2={f2(hEnd[1])} stroke={ink} strokeWidth={f2(0.09 * r)} strokeLinecap="round" />
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(0.06 * r)} fill={ink} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// SHEETS DRIFTING DOWN past the pillar's face (in the world's frame, falling away from the rising top)
// ---------------------------------------------------------------------------
const DRIFT = [80, 96, 108, 117, 125, 132].map((t0, i) => ({
  t0,
  X: lerp(-1150, 1050, random(`dr${i}x`)),
  ph: random(`dr${i}p`) * 6.283,
  Z: TOWER.zF - 70 - random(`dr${i}z`) * 60,
}));
const Drifters: React.FC<{ A: AirWorld; frame: number; L: number }> = ({ A, frame, L }) => {
  const P = A.P;
  const cam = A.cam;
  const yTopS = 960 + (P.p(0, -L, TOWER.zF)[1] - cam.cy) * cam.k;
  return (
    <g>
      {DRIFT.map((d, i) => {
        const u = frame - d.t0;
        if (u < 0) return null;
        const drop = 30 * u + 0.9 * u * u;
        const Y = -L + 20 + drop;
        const X = d.X + 50 * Math.sin(u * 0.17 + d.ph);
        const pose: SheetPose = {
          X,
          Y,
          Z: d.Z,
          yaw: d.ph * 40 + u * 7,
          pitch: 28 * Math.sin(u * 0.23 + d.ph),
          roll: 34 * Math.sin(u * 0.19 + d.ph * 1.3),
          curl: 0.25,
        };
        const cc = P.p(X, Y, d.Z);
        const sy = 960 + (cc[1] - cam.cy) * cam.k;
        if (sy > 1990) return null;
        const op = (1 - 0.85 * deepAt(sy - yTopS)[1]) * sstep(u / 3);
        return (
          <g key={i} opacity={op} transform={`translate(${f2(cc[0])} ${f2(cc[1])}) scale(1.8) translate(${f2(-cc[0])} ${f2(-cc[1])})`}>
            <WorkSheet A={A} pose={pose} uid={`dr${i}`} />
          </g>
        );
      })}
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
      const op = 0.55 * fl.spread * (1 - sstep(after / SPREAD)) * sstep(after / 1.5);
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
// THE SKY (behind the world, screen space: the sun and moon are at infinity): a soft sun glow and a pale moon arc
// across it, a few stars at night
// ---------------------------------------------------------------------------
const STARS = Array.from({ length: 26 }, (_, i) => ({ x: 30 + random(`sx${i}`) * 1020, v: random(`sv${i}`), s: 1.2 + random(`ss${i}`) * 1.6, ph: random(`sp${i}`) * 6.283 }));
const SkyCycle: React.FC<{ frame: number; yh: number }> = ({ frame, yh }) => {
  const th = (2 * Math.PI * (hoursAt(frame) - 6)) / 24;
  const s = Math.sin(th);
  const cth = Math.cos(th);
  const base = Math.min(yh - 30, 560);
  const night = 1 - lightAt(frame);
  const rose = roseAt(frame);
  const sunA = sstep((s + 0.1) / 0.28);
  const moonA = 0.9 * sstep((-s + 0.1) / 0.28);
  const sx = 540 - 470 * cth;
  const sy = base - 330 * s;
  const mx = 540 + 470 * cth;
  const my = base + 330 * s;
  const sunCol = mixHex("#FFF2D8", "#F4BFA4", rose);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id="sky-sun">
          <stop offset="0" stopColor={sunCol} stopOpacity={0.95} />
          <stop offset="0.16" stopColor={sunCol} stopOpacity={0.85} />
          <stop offset="0.3" stopColor={sunCol} stopOpacity={0.3} />
          <stop offset="1" stopColor={sunCol} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="sky-moon">
          <stop offset="0" stopColor="#EEF0E6" stopOpacity={0.5} />
          <stop offset="1" stopColor="#EEF0E6" stopOpacity={0} />
        </radialGradient>
      </defs>
      {sunA > 0.01 && <circle cx={f2(sx)} cy={f2(sy)} r={170} fill="url(#sky-sun)" opacity={sunA} />}
      {moonA > 0.01 && (
        <g opacity={moonA}>
          <circle cx={f2(mx)} cy={f2(my)} r={80} fill="url(#sky-moon)" />
          <circle cx={f2(mx)} cy={f2(my)} r={17} fill="#F3F1E6" />
          <circle cx={f2(mx + 7)} cy={f2(my - 4)} r={14} fill="#B9C9C6" fillOpacity={0.55} />
        </g>
      )}
      {night > 0.02 &&
        STARS.map((st, i) => {
          const y = 24 + st.v * Math.max(40, yh - 110);
          return <circle key={i} cx={f2(st.x)} cy={f2(y)} r={f2(st.s)} fill="#FBF7EC" opacity={0.95 * night * (0.7 + 0.3 * Math.sin(frame * 0.6 + st.ph))} />;
        })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// THE LIGHT (AirStage overlay): a short deep petrol night over the whole stage (never black), warm day light, rose
// dawns and dusks, and at night the monitor's glow is the light on the robot and the desk
// ---------------------------------------------------------------------------
const DayVeil: React.FC<{ frame: number; glow: { x: number; y: number; r: number } }> = ({ frame, glow }) => {
  const light = lightAt(frame);
  const night = 1 - light;
  const rose = roseAt(frame);
  const warm = light * c01(sunSinAt(frame));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {night > 0.005 && <AbsoluteFill style={{ mixBlendMode: "multiply", background: `rgba(48,74,94,${(0.38 * night).toFixed(3)})` }} />}
      {warm > 0.005 && <AbsoluteFill style={{ mixBlendMode: "soft-light", background: `rgba(255,214,168,${(0.26 * warm).toFixed(3)})` }} />}
      {rose > 0.005 && <AbsoluteFill style={{ mixBlendMode: "soft-light", background: `rgba(232,150,128,${(0.42 * rose).toFixed(3)})` }} />}
      {night > 0.005 && (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse ${f2(glow.r)}px ${f2(glow.r * 0.85)}px at ${f2(glow.x)}px ${f2(glow.y)}px, rgba(240,236,220,${(0.42 * night).toFixed(3)}) 0%, rgba(240,236,220,${(0.14 * night).toFixed(3)}) 45%, rgba(240,236,220,0) 100%)`,
          }}
        />
      )}
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
  const gw = screenOf(AL.P.p(120, -200, 0), camL);
  const glow = { x: gw[0], y: gw[1], r: Math.max(60, 330 * camL.k) };
  const yh = 960 + (A.P.opts.eyeY - cam.cy) * cam.k;
  const behind = STACKS.filter((s) => s.z0 >= 0);
  const front = STACKS.filter((s) => s.z0 < 0);
  return (
    <AirStage v={v} bloom={0.22} shafts={0.5} overlay={<DayVeil frame={frame} glow={glow} />}>
      <HazeSea A={A} />
      <SkyCycle frame={frame} yh={yh} />
      <WorldSvg cam={cam}>
        <Pillar A={A} frame={frame} L={e.lift} />
        <Drifters A={A} frame={frame} L={e.lift} />
      </WorldSvg>
      <WorldSvg cam={camL}>
        <defs>
          <radialGradient id="eons-shadow">
            <stop offset="0" stopColor={PAL.shadow} stopOpacity={1} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
          </radialGradient>
        </defs>
        {behind.map((s) => (
          <ReamStack key={s.uid} A={AL} {...s} />
        ))}
        <LooseSheets A={AL} near={false} />
        <ReamStack A={AL} {...CLOCK_STACK} uid="clk" />
        <DeskClock A={AL} frame={frame} />
        <Plate A={AL} X={PLATE88.X} Y={PLATE88.Y} Z={PLATE88.Z} text="88 HOURS" t={plateT(frame, 58, 13)} uid="pl88" size={PLATE88.size} />
        <OfficeDesk A={AL} X={0} Z={0} dir={1} uid="dk" layer="back" screen={1} />
        <Bot variant={0} pose={BOT_POSES.typeAtDesk(1, frame)} at={sit.at} scale={sit.scale} uid="bot" frame={frame} fog={AL.folkFog(0)} unitPx={camL.k} />
        <OfficeDesk A={AL} X={0} Z={0} dir={1} uid="dkf" layer="front" screen={1} />
        {front.map((s) => (
          <ReamStack key={s.uid} A={AL} {...s} />
        ))}
        <LooseSheets A={AL} near={true} />
        <Crumple A={AL} />
        <Sheets A={AL} frame={frame} />
      </WorldSvg>
    </AirStage>
  );
};

export { screenOf };
export default EonsInEightyEightHours;
