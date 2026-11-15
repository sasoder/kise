// ---------------------------------------------------------------------------
// EonsInEightyEightHours (rsi-since-writing, cut 7; final 56_EonsInEightyEightHours.mov). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 143 frames.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d (its header is the API). The Geniuses are the sister clip's crowd sprites
// (rsi-ten-earths/tenEarthsGenius, read only); the plate font and entrance timing are the world module's (PLATE_FONT,
// plateT from sinceWritingWorld, read only). The sand floor, the road, the milestones, the block, the "88 HOURS" plate,
// the tablet and the orange line are cut-local.
//
// CHECK LINE: "In just 88 hours the AIs packed in thinking that would take one person thousands of years."
//
// THE LINE: "And they did it, in part, by compacting, within 88 hours, eons of cognitive work to"
// WORD -> FRAME: days. -12 · And -1 · they 3 · did 6 · it, 12 · in 20 · part, 27 · by 36 · compacting, 43 · within 62
// · 88 71 · hours, 84 · eons 98 · of 113 · cognitive 121 · work 130 · to 138 (· match 144, after the cut)
// DURATION: the slot 56.3062 -> 62.2705 s = 5.964 s x 23.976 = 143 frames (f0..f142).
//
// THE MOTION: a long straight road of time runs back from the front of the stage up the frame into the haze, short
// flat-topped cream milestone posts (old kilometre stones, the year carved on the face toward us) at its edge,
// alternating sides, spaced honestly in proportion to the years: 2026 (beside the block), 1500, 1000, 1 AD, 1000 BC,
// 2000 BC, 3200 BC; there a clay tablet stands on the road, unlabelled, and past it the road runs on, unmarked, into
// the haze. At the front, on the road, a short glowing orange block packed with a dense swarm of Geniuses (the AIs),
// "88 HOURS" on a plaque on its own front face (the block = 88 hours). f0: the camera very close on the swarm's heads
// and the block's top edge (the block wider than the frame), the road behind lost in the dense low air. On
// "compacting" (f43-60) the swarm closes ranks toward the block's centre (rows 18 % closer, columns 6 %) and the
// block's glow steps up. The plaque fades in f58-71 (legible on "88"). One camera move: it pulls back from the first
// frame in one slow lobe through "compacting / 88 hours", easing but never stopping, and hands over on "eons" into a
// crane up and tilt down (the horizon runs up the frame from y ~640 to ~335) so the road unrolls ahead; settled by
// f132, creeping to the end. The low
// mist thins f76-128, so the stones come out of the haze nearest first (2026 rises out from behind the swarm by
// parallax f88-101). On "eons" (f98) the orange (their thinking) pours out from behind the block onto the road and
// races up it as one glowing line (passes 2026 f103, 1500 f106, 1000 f109, 1 AD f114, 1000 BC f119, 2000 BC f125),
// at a constant pace in years after a short pour-in (so its tip slows on screen as it recedes), and touches the tablet
// at f132 (CAUSE: the line's tip is the contact; it stops at the tablet's foot and a soft cream glow wakes round the
// tablet, f129-138). Settled f132-142: the high view, the orange line from 88 HOURS all the way up to 3200 BC, the
// near stones' years big, the far ones small; soft pulses of light keep flowing back along the line, the swarm keeps
// working and the camera creeps.
// Orange = the AIs only (COMMON.md): the Geniuses, their block and their thinking (the line). Stones cream, road
// slate-umber, sand floor, the tablet clay (its glow cream); no word "writing" on screen.
//
// DEPTH: one pinhole camera on the road's axis; per frame its eye height H, its distance D in front of the block's
// front face (Z = 0), its focal F and the horizon's screen row (tracks: YH_AT, K_AT, FOOT_AT, MIST_AT below). The lens
// widens to start: f0 F 437 / H 764 / D 832 (k 0.525) / horizon y 702 -> settled F 1824 / H 5600 / D 14031 (k 0.13) /
// horizon y 334 (the road's VP). D follows k (D_OF_K) so the 2026 stone holds its screen place through the crane, and
// H follows from the block foot's row (y 1103 -> 1004 by f80 as the block shrinks toward the horizon, then -> 1062)
// and the horizon row, so the horizon only ever rises. Mapped
// onto londonDepth as eyeY = -H, dRef = D, kRef = k, dolly 0. Fog by depth (fogBy "depth"); fogNear / fogVis /
// fogMax ease with the mist track (dense low air at f0 hides everything past the block; the fog's ceiling holds until
// the crane is under way so the far stones never show bunched at a low horizon). Stones and the tablet fade in with
// their own fog (no ghost through the mist). World units = the cast's (178 a metre): block X +-1230, Z 0..900, 420
// tall (a Genius 312); road X +-1500 with 140 kerbs (front width ~390 px settled); stones just outside the kerb, 2026
// at Z 3000 and the years spaced linearly to 3200 BC at Z 46670 (8.36 units a year); the carved numerals 900 units
// (settled: 2026 96 px, 1500 77, 1000 64, 1 AD 48, 1000 BC 39, 2000 BC 32, 3200 BC 27); the tablet 1700 x 2130
// (settled ~51 x 64 px). Settled screen: block foot y ~1057 (plaque y 1008-1052), the line from y ~1013 to the
// tablet's foot at y ~495, the road on past it to the VP. The floor is drawn in screen rows from the same camera.
//
// SOURCES: writing = Sumerian cuneiform at Uruk, c. 3400-3100 BC (COMMON.md; 3200 BC used). 88 hours = the
// speaker's own figure (OpenAI's internal model, the speaker's account). The milestone years are calendar marks only.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  AIR,
  AIR_SCENE_DEPTH,
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
  makeAirView,
  mixHex,
  pchip,
  rgbHex,
  swayCam,
  type AirScene,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  FolkCanvas,
  blitGenius,
  geniusCrowdReqs,
  useGeniusSprites,
  type GeniusView,
} from "../rsi-ten-earths/tenEarthsGenius";
import { PLATE_FONT, plateT } from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 143;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const CREAM = PAL.cream;

// ---------------------------------------------------------------------------
// THE WORLD (cast units, 178 a metre)
// ---------------------------------------------------------------------------
/** the block (the AIs' 88 hours): on the road at the front; a dense swarm of Geniuses packed on its top, the
 *  "88 HOURS" plaque on its front face */
export const BLOCK = { x: 1230, h: 420, z0: 0, z1: 900 };
/** the road of time (it runs on past 3200 BC, unmarked, into the haze to the vanishing point) */
export const ROAD = { hw: 1500, z0: -300, kerb: 140 };
/** the carved numerals' size (world units, the font size) */
export const T = 900;
/** the milestones: 2026 just behind the block at Z_NOW, then linear in years to 3200 BC at Z_END (8.36 units a year):
 *  honest spacing, so perspective alone makes the far past small */
export const Z_NOW = 3000;
export const Z_END = 46670;
export const YEAR_SPAN = 2026 + 3200;
export const zOfYear = (y: number) =>
  Z_NOW + ((2026 - y) / YEAR_SPAN) * (Z_END - Z_NOW);
type Stone = { year: number; text: string; side: -1 | 1 };
export const STONES: Stone[] = [
  { year: 2026, text: "2026", side: -1 },
  { year: 1500, text: "1500", side: 1 },
  { year: 1000, text: "1000", side: -1 },
  { year: 1, text: "1 AD", side: 1 },
  { year: -1000, text: "1000 BC", side: -1 },
  { year: -2000, text: "2000 BC", side: 1 },
  { year: -3200, text: "3200 BC", side: -1 },
];
/** the carved text's width in units of T (Caslon bold lining figures ~0.62 em, caps ~0.74 em) */
const textW = (s: string) =>
  [...s].reduce(
    (a, ch) => a + (ch === " " ? 0.3 : /[0-9]/.test(ch) ? 0.62 : 0.74),
    0,
  );
/** a milestone: a short squarish roadside post (an old kilometre stone): a flat top with a bevel all round, the year
 *  carved on the face toward us; just outside the kerb, alternating sides. Units of T. */
export const stoneGeom = (s: Stone) => {
  const w = (textW(s.text) + 0.42) * T;
  const h = 1.05 * T;
  const bev = 0.1 * T;
  const d = 0.45 * T;
  const Z = zOfYear(s.year);
  const X = s.side * (ROAD.hw + ROAD.kerb + 80 + w / 2);
  const numY = -(h - bev) / 2;
  return { w, h, bev, d, Z, X, numY };
};
/** the 88 HOURS plaque on the block's front face (Z = 0): a soft dark plate, cream type on one line */
export const PLATE88 = { Y: -BLOCK.h / 2, size: 270, w: 1660, h: 340 };
/** the clay tablet standing on the road where the line ends, beside the 3200 BC stone (upright, facing us) */
export const TABLET = { w: 1700, h: 2130, d: 380, z: Z_END - 190 };
/** the line: a glowing strip down the road's middle, from behind the block to the tablet's foot */
const LINE_HW = 170;
const LINE_Z0 = BLOCK.z1 - 60;
const LINE_Z1 = TABLET.z - 20;
/** the stage's materials (before fog) */
const ROAD_MAT: Mat = { lit: "#776C5F", mid: "#61584D", dark: "#3E3730" };
const KERB_MAT: Mat = { lit: "#9C907C", mid: "#7F7462", dark: "#4F473C" };
const STONE_MAT: Mat = MAT.marble;
const CARVE = "#4A3D30";
const CLAY: Mat = { lit: "#B98E6A", mid: "#9A7253", dark: "#5A4030" };

// ---------------------------------------------------------------------------
// THE CAMERA: a pinhole of focal F on the road's axis; one crane up and back
// ---------------------------------------------------------------------------
/** THE CAMERA TRACKS (pchip by frame, log for the zoom). One move: very close on the swarm's heads and the block's
 *  top edge at f0 (the eye just over the heads, D ~840, the road lost in the mist), pulling back from the first frame
 *  in one slow lobe (fastest ~f15-35, easing through "88 hours" but never stopping), which hands over into the crane
 *  up and tilt down on "eons" (the horizon runs up the frame to y ~335) so the road unrolls ahead as the line races up
 *  it; settled by f132, creeping to the end. The lens is wide and close at the start and lengthens as it goes
 *  (k = F / D, the block's own screen scale); the block's foot rises as it shrinks toward the horizon (y 1103 -> 1004
 *  by f80), then is held low as the camera tilts down (-> 1062, lens shift). */
const track = (keys: [number, number][], log = false) => {
  const fn = pchip(
    keys.map(([f, v]) => [f, log ? Math.log(v) : v] as [number, number]),
    false,
  );
  return (f: number) => (log ? Math.exp(fn(f)) : fn(f));
};
/** the horizon's screen row (the lens shift, i.e. the tilt): it creeps up through the hold, then runs up the frame */
const YH_AT = track([
  [0, 702],
  [25, 699],
  [50, 694],
  [71, 686],
  [80, 676],
  [92, 660],
  [98, 640],
  [104, 590],
  [110, 505],
  [116, 430],
  [122, 378],
  [127, 350],
  [132, 338],
  [137, 335],
  [142, 334],
]);
const K_AT = track(
  [
    [0, 0.525],
    [12, 0.49],
    [30, 0.425],
    [50, 0.375],
    [71, 0.338],
    [90, 0.322],
    [98, 0.3],
    [104, 0.262],
    [110, 0.212],
    [116, 0.172],
    [122, 0.149],
    [127, 0.137],
    [132, 0.132],
    [137, 0.1305],
    [142, 0.13],
  ],
  true,
);
const FOOT_AT = track([
  [0, 1103],
  [20, 1075],
  [45, 1035],
  [71, 1006],
  [80, 1004],
  [98, 1012],
  [115, 1045],
  [132, 1060],
  [142, 1062],
]);
/** the distance follows the zoom so the 2026 stone holds its place on screen through the move (the block shrinks
 *  under it, the far road comes up out of the mist): D = Z_NOW / (k / g - 1), g = the 2026 stone's scale, easing from
 *  0.112 (at k 0.35) to 0.1071 (settled) with the zoom, extrapolating smoothly through the close opening */
const K0 = 0.35;
const K1 = K_AT(142);
const D_OF_K = (k: number) => {
  const g = lerp(0.1071, 0.112, Math.log(k / K1) / Math.log(K0 / K1));
  return Z_NOW / (k / g - 1);
};
/** the mist: dense low air through the hold, thinning f76-128 as the camera rises */
const MIST_AT = track([
  [0, 0],
  [76, 0],
  [90, 0.15],
  [104, 0.45],
  [116, 0.8],
  [128, 0.97],
  [142, 1],
]);
/** the eye's height follows from the horizon row, the zoom and the block's foot: H = (foot - horizon) / k */
const H_AT = (f: number) => (FOOT_AT(f) - YH_AT(f)) / K_AT(f);
export const H0 = H_AT(0);
export type Eye = { H: number; D: number; F: number; yh: number; c: number };
export const eyeAt = (f: number): Eye => {
  const k = K_AT(f);
  const D = D_OF_K(k);
  // c: the mist's thinning 0..1
  return { H: H_AT(f), D, F: k * D, yh: YH_AT(f), c: c01(MIST_AT(f)) };
};
/** the 2D camera and the depth options that put the eye there (dolly 0: Dc = dRef = D) */
export const camOf = (e: Eye): { cam: Cam; depth: DepthOpts } => {
  const k = e.F / e.D;
  return {
    cam: { k, cx: 0, cy: -e.H - (e.yh - 960) / k },
    depth: { eyeY: -e.H, dRef: e.D, kRef: k, dolly: 0 },
  };
};
/** the air: dense low mist at f0 (the road lost in it), thinning as the camera rises (fog by depth) */
const sceneAt = (c: number): Partial<AirScene> => {
  const cf = c01(c);
  return {
    fogNear: lerp(1000, 4000, cf),
    fogVis: Math.exp(lerp(Math.log(520), Math.log(56000), cf)),
    // the ceiling holds until the crane is under way, so the far stones stay hidden while they bunch at a low horizon
    fogMax: lerp(0.995, 0.8, Math.pow(cf, 2.5)),
    hLow: 0,
    hHigh: 4000,
    moteUnit: 1100,
  };
};

// ---------------------------------------------------------------------------
// THE LINE: the tip's depth by frame (a short pour-in, then a constant pace in years, a short stop on the tablet)
// ---------------------------------------------------------------------------
export const POUR0 = 98;
export const POUR1 = 132;
export const lineTipZ = (f: number) => {
  const t = c01((f - POUR0) / (POUR1 - POUR0));
  // velocity: ramps up over the first 18 %, constant, eases over the last 8 % (integrated, normalised)
  const a = 0.18;
  const b = 0.08;
  const vel = (u: number) =>
    u < a
      ? 0.5 - 0.5 * Math.cos((Math.PI * u) / a)
      : u > 1 - b
        ? 0.5 + 0.5 * Math.cos((Math.PI * (u - (1 - b))) / b)
        : 1;
  const N = 120;
  let s = 0;
  let tot = 0;
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const w = vel(u) / N;
    tot += w;
    if (u < t) s += w * Math.min(1, (t - i / N) * N);
  }
  return LINE_Z0 + (LINE_Z1 - LINE_Z0) * (s / tot);
};

// ---------------------------------------------------------------------------
// SMALL HELPERS
// ---------------------------------------------------------------------------
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const hull = (points: P2[]): P2[] => {
  const pts = points
    .slice()
    .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  const cross = (o: P2, a: P2, b: P2) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    )
      lower.pop();
    lower.push(p);
  }
  const upper: P2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    )
      upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
};
const screenOf = (p: P2, cam: Cam): P2 => [
  540 + (p[0] - cam.cx) * cam.k,
  960 + (p[1] - cam.cy) * cam.k,
];

// ---------------------------------------------------------------------------
// THE SAND FLOOR: one continuous tone by distance, drawn in thin screen rows (no band steps): each row's depth from
// the pinhole (Z = F H / (y - horizon) - D), the kit's AirFloor colour rule (a little darker near), melting into the
// air behind its row far out
// ---------------------------------------------------------------------------
const SandFloor: React.FC<{ A: AirWorld; e: Eye }> = ({ A, e }) => {
  const { cam, P } = A;
  const yh = 960 + (P.opts.eyeY - cam.cy) * cam.k;
  const m = MAT.ground;
  const rows: React.ReactNode[] = [];
  const step = 5;
  for (let y = Math.floor(yh) - 2; y < 1920; y += step) {
    const yc = Math.max(yh + 0.5, y + step / 2);
    const Z = (e.F * e.H) / (yc - yh) - e.D;
    // near floor darkens by screen row (a depth ramp turns into a hard step once the camera is high)
    const near = c01((yc - 980) / 600);
    const local = mixHex(mixHex(m.lit, m.mid, 0.3), m.dark, 0.2 * near);
    const melt = Math.pow(c01((Z - 50000) / 150000), 1.3);
    const col = mixHex(A.tone(local, Z, 0), rgbHex(A.v.airAtScreen(yc)), melt);
    rows.push(
      <rect key={y} x={0} y={y} width={1080} height={step + 1} fill={col} />,
    );
  }
  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      {rows}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// THE ROAD: slate-umber paving between two pale kerbs, from the block to the far stone, then on into the haze
// ---------------------------------------------------------------------------
const Road: React.FC<{ A: AirWorld }> = ({ A }) => {
  const z1 = Z_END + 500;
  const k = ROAD.kerb;
  return (
    <g>
      {/* past 3200 BC the road runs on, unmarked, into the haze to the vanishing point */}
      <AirFloor
        A={A}
        x0={-ROAD.hw - k}
        x1={ROAD.hw + k}
        z0={z1 - 100}
        z1={400000}
        mat={ROAD_MAT}
        course={1100}
        plank={660}
        lw={8}
        jointAmt={0.4}
        melt={0.3}
      />
      <AirFloor
        A={A}
        x0={-ROAD.hw}
        x1={ROAD.hw}
        z0={ROAD.z0}
        z1={z1}
        mat={ROAD_MAT}
        course={1100}
        plank={660}
        lw={8}
        jointAmt={0.8}
        melt={0}
      />
      <AirFloor
        A={A}
        x0={-ROAD.hw - k}
        x1={-ROAD.hw}
        z0={ROAD.z0}
        z1={z1}
        mat={KERB_MAT}
        course={900}
        plank={k}
        lw={6}
        jointAmt={0.5}
        melt={0}
      />
      <AirFloor
        A={A}
        x0={ROAD.hw}
        x1={ROAD.hw + k}
        z0={ROAD.z0}
        z1={z1}
        mat={KERB_MAT}
        course={900}
        plank={k}
        lw={6}
        jointAmt={0.5}
        melt={0}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ORANGE LINE: a glowing strip on the road, fogged by depth band (orange takes half the fog), a soft glow round
// it, a round tip; once it has landed, light keeps flowing back along it
// ---------------------------------------------------------------------------
const OrangeLine: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const zt = lineTipZ(frame);
  if (zt <= LINE_Z0 + 1) return null;
  const P = A.P;
  // one exact trapezoid per layer (a floor strip projects to a straight-sided quad), coloured along its depth by a
  // vertical gradient with a stop per depth step: no per-segment tone steps, no overlaps to show as a ladder
  const N = 36;
  const zs: number[] = [];
  for (let i = 0; i <= N; i++) zs.push(lerp(LINE_Z0, zt, Math.pow(i / N, 1.7)));
  const y0 = P.p(0, 0, LINE_Z0)[1];
  const y1 = P.p(0, 0, zt)[1];
  const off = (z: number) =>
    c01((P.p(0, 0, z)[1] - y0) / Math.min(-1e-3, y1 - y0));
  const strip = (hw: number, z1: number) =>
    poly([
      P.p(-hw, 0, LINE_Z0),
      P.p(hw, 0, LINE_Z0),
      P.p(hw, 0, z1),
      P.p(-hw, 0, z1),
    ]);
  const roadTone = (z: number) =>
    A.tone(
      mixHex(
        mixHex(ROAD_MAT.lit, ROAD_MAT.mid, 0.3),
        ROAD_MAT.dark,
        0.2 * c01(1 - (z + 400) / 900),
      ),
      z,
      0,
    );
  const coreHex = mixHex(ACCENT, "#FFC94A", 0.25);
  const grad = (id: string, col: (z: number) => string) => (
    <linearGradient
      key={id}
      id={id}
      gradientUnits="userSpaceOnUse"
      x1={0}
      y1={y0}
      x2={0}
      y2={y1}
    >
      {zs.map((z, i) => (
        <stop key={i} offset={off(z)} stopColor={col(z)} />
      ))}
    </linearGradient>
  );
  // the glow lies on the road as the road's own tone warmed, opaque, in four widening steps that fade outwards
  const GLOW = [
    [3.4, 0.07],
    [2.6, 0.13],
    [1.9, 0.19],
    [1.4, 0.25],
  ];
  const defs = [
    ...GLOW.map(([, m], j) =>
      grad(`eons-glow${j}`, (z) => mixHex(roadTone(z), A.toneO(ACCENT, z), m)),
    ),
    grad("eons-core", (z) => A.toneO(coreHex, z)),
    grad("eons-hot", (z) => A.toneO("#FFE6A8", z)),
  ];
  const glow = GLOW.map(([w], j) => (
    <path
      key={`g${j}`}
      d={strip(LINE_HW * w, zt)}
      fill={`url(#eons-glow${j})`}
    />
  ));
  const core = <path d={strip(LINE_HW, zt)} fill="url(#eons-core)" />;
  const hot = (
    <path
      d={strip(LINE_HW * 0.38, zt)}
      fill="url(#eons-hot)"
      fillOpacity={0.55}
    />
  );
  // the flow: soft bright pulses travelling back along the line at a constant pace (world space), each a stack of
  // nested bands so its ends feather
  const flow: React.ReactNode[] = [];
  const settle = c01((frame - POUR1 + 4) / 10);
  if (settle > 0) {
    const period = 4000;
    const speed = 400;
    for (let i = 0; i < 12; i++) {
      const zc =
        LINE_Z0 +
        (((frame - POUR1) * speed + i * period) % (LINE_Z1 - LINE_Z0 + period));
      for (const half of [560, 420, 280, 140]) {
        const za = Math.max(LINE_Z0, zc - half);
        const zb = Math.min(zt, zc + half);
        if (zb <= za) continue;
        flow.push(
          <path
            key={`f${i}-${half}`}
            d={poly([
              P.p(-LINE_HW * 0.7, 0, za),
              P.p(LINE_HW * 0.7, 0, za),
              P.p(LINE_HW * 0.7, 0, zb),
              P.p(-LINE_HW * 0.7, 0, zb),
            ])}
            fill="#FFF1C8"
            fillOpacity={0.1 * settle * (1 - 0.5 * A.fog(zc))}
          />,
        );
      }
    }
  }
  // the tip: a rounded end on the ground (a half ellipse in perspective)
  const tipPts: P2[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = (Math.PI * i) / 12;
    tipPts.push(
      P.p(-LINE_HW * Math.cos(a), 0, zt + LINE_HW * 0.9 * Math.sin(a)),
    );
  }
  const tipC = P.p(0, 0, zt);
  const tr = LINE_HW * 4 * P.r(zt);
  return (
    <g>
      <defs>
        {defs}
        <radialGradient id="eons-tipglow">
          <stop offset="0" stopColor={ACCENT} stopOpacity={0.5} />
          <stop offset="0.5" stopColor={ACCENT} stopOpacity={0.16} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      {glow}
      {core}
      <path d={`M${tipPts.map(Pt).join("L")}Z`} fill={A.toneO(coreHex, zt)} />
      {hot}
      {flow}
      <ellipse
        cx={tipC[0]}
        cy={tipC[1]}
        rx={tr}
        ry={tr * 0.55}
        fill="url(#eons-tipglow)"
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// A MILESTONE: a short squarish roadside post (an old kilometre stone): a flat top bevelled all round, its thickness
// seen from above, the year carved on the face toward us (dark carving with a light lower lip, lit from the upper left)
// ---------------------------------------------------------------------------
const Milestone: React.FC<{ A: AirWorld; s: Stone; uid: string }> = ({
  A,
  s,
  uid,
}) => {
  const P = A.P;
  const { w, h, bev, d, Z, X, numY } = stoneGeom(s);
  const x0 = X - w / 2;
  const x1 = X + w / 2;
  const t = (hex: string) => A.tone(hex, Z, h / 2);
  const lw = A.lw(1.1) * 2.6;
  const ln = t(lineOf(STONE_MAT));
  // the corners: the front face up to the bevel; the bevel rises inward to the flat top
  const corners: P2[] = [];
  for (const z of [Z, Z + d])
    corners.push(
      P.p(x0, 0, z),
      P.p(x1, 0, z),
      P.p(x0, -h + bev, z),
      P.p(x1, -h + bev, z),
    );
  corners.push(
    P.p(x0 + bev, -h, Z + bev),
    P.p(x1 - bev, -h, Z + bev),
    P.p(x0 + bev, -h, Z + d - bev),
    P.p(x1 - bev, -h, Z + d - bev),
  );
  const body = hull(corners);
  const top = [
    P.p(x0 + bev, -h, Z + bev),
    P.p(x1 - bev, -h, Z + bev),
    P.p(x1 - bev, -h, Z + d - bev),
    P.p(x0 + bev, -h, Z + d - bev),
  ];
  const bevF = [
    P.p(x0, -h + bev, Z),
    P.p(x1, -h + bev, Z),
    P.p(x1 - bev, -h, Z + bev),
    P.p(x0 + bev, -h, Z + bev),
  ];
  // the inner side bevel (toward the axis) catches the light on a right stone, sits in shade on a left one
  const bevS =
    X < 0
      ? [
          P.p(x1, -h + bev, Z),
          P.p(x1 - bev, -h, Z + bev),
          P.p(x1 - bev, -h, Z + d - bev),
          P.p(x1, -h + bev, Z + d),
        ]
      : [
          P.p(x0, -h + bev, Z),
          P.p(x0 + bev, -h, Z + bev),
          P.p(x0 + bev, -h, Z + d - bev),
          P.p(x0, -h + bev, Z + d),
        ];
  const front = [
    P.p(x0, 0, Z),
    P.p(x1, 0, Z),
    P.p(x1, -h + bev, Z),
    P.p(x0, -h + bev, Z),
  ];
  // the side toward the axis shows: a left stone's right side (in shade), a right stone's left side (half lit)
  const sideTone =
    X < 0
      ? mixHex(STONE_MAT.mid, STONE_MAT.dark, 0.5)
      : mixHex(STONE_MAT.lit, STONE_MAT.mid, 0.6);
  const fz = A.fog(Z);
  const r = P.r(Z);
  const c = P.p(X, numY, Z);
  const fs = T * r;
  const off = fs * 0.04;
  const style = {
    fontFamily: PLATE_FONT,
    fontWeight: 700,
    fontSize: fs,
    letterSpacing: fs * 0.02,
    fontVariantNumeric: "lining-nums",
  } as const;
  // a stone deep in the dense low air drains into it entirely (its fogged tone and the air behind it differ a little)
  const vis = c01((0.985 - fz) / 0.2);
  if (vis <= 0.001) return null;
  return (
    <g opacity={vis}>
      <AirShadow
        A={A}
        X={X}
        Z={Z + d / 2}
        w={w * 0.62}
        d={d * 1.6}
        uid={`${uid}s`}
        amt={0.8}
      />
      <path
        d={poly(body)}
        fill={t(sideTone)}
        stroke={ln}
        strokeWidth={lw}
        strokeLinejoin="round"
      />
      <path d={poly(bevS)} fill={t(X < 0 ? STONE_MAT.mid : STONE_MAT.lit)} />
      <path
        d={poly(top)}
        fill={t(mixHex(STONE_MAT.lit, "#FFFFFF", 0.1))}
        stroke={ln}
        strokeWidth={lw * 0.7}
        strokeLinejoin="round"
      />
      <path
        d={poly(bevF)}
        fill={t(mixHex(STONE_MAT.lit, STONE_MAT.mid, 0.25))}
        stroke={ln}
        strokeWidth={lw * 0.7}
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id={`${uid}fg`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={front[3][1].toFixed(2)}
          x2="0"
          y2={front[0][1].toFixed(2)}
        >
          <stop offset="0" stopColor={t(STONE_MAT.lit)} />
          <stop
            offset="0.55"
            stopColor={t(mixHex(STONE_MAT.lit, STONE_MAT.mid, 0.5))}
          />
          <stop
            offset="1"
            stopColor={t(mixHex(STONE_MAT.mid, STONE_MAT.dark, 0.3))}
          />
        </linearGradient>
      </defs>
      <path
        d={poly(front)}
        fill={`url(#${uid}fg)`}
        stroke={ln}
        strokeWidth={lw}
        strokeLinejoin="round"
      />
      <path
        d={`M${Pt(bevF[0])}L${Pt(bevF[1])}`}
        fill="none"
        stroke={CREAM}
        strokeWidth={lw * 1.2}
        strokeOpacity={0.55 * (1 - fz)}
        strokeLinecap="round"
      />
      <text
        x={c[0] + off}
        y={c[1] + fs * 0.35 + off}
        textAnchor="middle"
        fill={t(mixHex(STONE_MAT.lit, "#FFFFFF", 0.4))}
        style={style}
      >
        {s.text}
      </text>
      <text
        x={c[0]}
        y={c[1] + fs * 0.35}
        textAnchor="middle"
        fill={t(CARVE)}
        style={style}
      >
        {s.text}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE TABLET: a clay tablet standing on the road where the line ends, beside the 3200 BC stone: ruled rows of wedge
// marks pressed in; a soft cream glow wakes round it when the line touches it (f~132)
// ---------------------------------------------------------------------------
const Tablet: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const P = A.P;
  const { w, h, d, z: Z } = TABLET;
  const t = (hex: string) => A.tone(hex, Z, h / 2);
  // a pillow outline: a rounded rectangle (corner radius 0.16 w)
  const rc = 0.16 * w;
  const pts: { x: number; y: number }[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 5; i++) {
      const a = a0 + (Math.PI / 2) * (i / 5);
      pts.push({ x: cx + rc * Math.cos(a), y: cy + rc * Math.sin(a) });
    }
  };
  corner(w / 2 - rc, -rc, 0);
  corner(-w / 2 + rc, -rc, Math.PI / 2);
  corner(-w / 2 + rc, -h + rc, Math.PI);
  corner(w / 2 - rc, -h + rc, 1.5 * Math.PI);
  const front = pts.map((q) => P.p(q.x, q.y, Z));
  const back = pts.map((q) => P.p(q.x, q.y, Z + d));
  const lw = A.lw(1.1) * 2;
  const ln = t(lineOf(CLAY));
  // ruled rows of wedges (a triangular head and a short tail, the stylus's mark), 7 rows
  const r = P.r(Z);
  const marks: React.ReactNode[] = [];
  const ROWS = 7;
  const rowH = (0.8 * h) / ROWS;
  for (let row = 0; row < ROWS; row++) {
    const yTop = -h + 0.1 * h + row * rowH;
    if (row > 0) {
      const a0 = P.p(-w / 2 + 0.1 * w, yTop, Z);
      const a1 = P.p(w / 2 - 0.1 * w, yTop, Z);
      marks.push(
        <path
          key={`r${row}`}
          d={`M${Pt(a0)}L${Pt(a1)}`}
          stroke={t(CLAY.dark)}
          strokeOpacity={0.5}
          strokeWidth={0.012 * w * r}
        />,
      );
    }
    const n = 4 + Math.floor(random(`tabn${row}`) * 3);
    let x = -w / 2 + 0.14 * w + random(`tabx${row}`) * 0.05 * w;
    for (let i = 0; i < n && x < w / 2 - 0.16 * w; i++) {
      const c = P.p(x, yTop + rowH * 0.42, Z);
      const sz = (0.045 + random(`tabs${row}${i}`) * 0.02) * w * r;
      const tail = random(`tabt${row}${i}`) < 0.6;
      marks.push(
        <g key={`${row}-${i}`} fill={t(CLAY.dark)} fillOpacity={0.88}>
          <path
            d={`M${(c[0] - sz).toFixed(2)},${(c[1] - sz * 0.75).toFixed(2)}L${(c[0] + sz).toFixed(2)},${(c[1] - sz * 0.75).toFixed(2)}L${c[0].toFixed(2)},${(c[1] + sz * 0.55).toFixed(2)}Z`}
          />
          {tail && (
            <rect
              x={c[0] - sz * 0.12}
              y={c[1]}
              width={sz * 0.24}
              height={sz * 1.3}
            />
          )}
        </g>,
      );
      x += (0.1 + random(`tabg${row}${i}`) * 0.07) * w;
    }
  }
  // the touch: the line's tip reaches the tablet's foot at f132; a soft cream glow wakes round it
  const touch = sstep((frame - 129) / 9);
  const gc = P.p(0, -h * 0.5, Z);
  const vis = c01((0.985 - A.fog(Z)) / 0.2);
  if (vis <= 0.001) return null;
  return (
    <g opacity={vis}>
      {touch > 0 && (
        <>
          <defs>
            <radialGradient id="tab-glow">
              <stop offset="0" stopColor="#FFF3D6" stopOpacity={0.75} />
              <stop offset="0.45" stopColor="#FFF3D6" stopOpacity={0.3} />
              <stop offset="1" stopColor="#FFF3D6" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse
            cx={gc[0]}
            cy={gc[1]}
            rx={w * 1.1 * r}
            ry={h * 0.85 * r}
            fill="url(#tab-glow)"
            opacity={touch}
          />
        </>
      )}
      <AirShadow
        A={A}
        X={0}
        Z={Z + d / 2}
        w={w * 0.7}
        d={d * 2}
        uid="tabS"
        amt={0.8}
      />
      <path
        d={poly(hull([...front, ...back]))}
        fill={t(CLAY.dark)}
        stroke={ln}
        strokeWidth={lw}
        strokeLinejoin="round"
      />
      <path
        d={poly(front)}
        fill={mixHex(
          t(mixHex(CLAY.lit, CLAY.mid, 0.4)),
          "#FFF3D6",
          0.18 * touch,
        )}
        stroke={ln}
        strokeWidth={lw}
        strokeLinejoin="round"
      />
      {marks}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE 88 HOURS PLAQUE: on the block's own front face (the block = 88 hours): one soft dark plate with cream Caslon
// type on one line, the world module's plate look and timing (fades in f58-71 while it settles from 0.9 to full size)
// ---------------------------------------------------------------------------
const easeOut = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const sstep = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const HoursPlate: React.FC<{ A: AirWorld; t: number }> = ({ A, t }) => {
  if (t <= 0) return null;
  const P = A.P;
  const { Y, size, w, h } = PLATE88;
  // the face is at Z = 0, parallel to the screen: one scale for the whole plaque
  const c = P.p(0, Y, BLOCK.z0);
  const r = P.r(BLOCK.z0);
  const sc = 0.9 + 0.1 * easeOut(t);
  const pw = w * r;
  const ph = h * r;
  const fs = size * r;
  return (
    <g
      opacity={sstep(t)}
      transform={`translate(${c[0].toFixed(2)} ${c[1].toFixed(2)}) scale(${sc.toFixed(4)})`}
    >
      <rect
        x={-pw / 2}
        y={-ph / 2}
        width={pw}
        height={ph}
        rx={ph * 0.18}
        fill={PAL.shadow}
        fillOpacity={0.78}
      />
      <rect
        x={-pw / 2 + ph * 0.07}
        y={-ph / 2 + ph * 0.07}
        width={pw - ph * 0.14}
        height={ph * 0.86}
        rx={ph * 0.13}
        fill="none"
        stroke={CREAM}
        strokeOpacity={0.35}
        strokeWidth={ph * 0.022}
      />
      <text
        x={0}
        y={fs * 0.34}
        textAnchor="middle"
        fill={CREAM}
        style={{
          fontFamily: PLATE_FONT,
          fontWeight: 700,
          fontSize: fs,
          letterSpacing: fs * 0.04,
          fontVariantNumeric: "lining-nums",
        }}
      >
        88 HOURS
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SWARM: Geniuses packed on the block's top in staggered rows (crowd sprites, fogged by depth); each one busy:
// a small working bob and shuffle on its own phase and period (continuous in the frame, seek-safe)
// ---------------------------------------------------------------------------
type Member = {
  X: number;
  Z: number;
  variant: number;
  view: GeniusView;
  ph: number;
  per: number;
};
export const SWARM: Member[] = (() => {
  const out: Member[] = [];
  const rows = 9;
  const cols = 22;
  for (let i = rows - 1; i >= 0; i--) {
    const Z = 70 + i * 95;
    for (let j = 0; j < cols; j++) {
      const X =
        -BLOCK.x +
        90 +
        (j + (i % 2) * 0.5) * ((2 * BLOCK.x - 180) / (cols - 0.5)) +
        (random(`sx${i}-${j}`) - 0.5) * 18;
      const rv = random(`sv${i}-${j}`);
      const view: GeniusView =
        rv < 0.5 ? "front" : rv < 0.75 ? "left" : "right";
      out.push({
        X,
        Z: Z + (random(`sz${i}-${j}`) - 0.5) * 16,
        variant: Math.floor(random(`sk${i}-${j}`) * 5),
        view,
        ph: random(`sp${i}-${j}`),
        per: 9 + random(`sq${i}-${j}`) * 6,
      });
    }
  }
  return out;
})();
const SPRITE_VIEWS: GeniusView[] = ["front", "left", "right"];
/** "compacting" (f43-60): 0 -> 1, the swarm packs tighter and the block's glow steps up */
export const PACK0 = 43;
export const PACK1 = 60;
export const packAt = (f: number) => sstep((f - PACK0) / (PACK1 - PACK0));
/** the block's glow lifting with the packing: a warm light laid over its top and front faces */
const BlockGlow: React.FC<{ A: AirWorld; amt: number }> = ({ A, amt }) => {
  if (amt <= 0) return null;
  const P = A.P;
  const { x, h, z0, z1 } = BLOCK;
  const top = [
    P.p(-x, -h, z0),
    P.p(x, -h, z0),
    P.p(x, -h, z1),
    P.p(-x, -h, z1),
  ];
  const front = [
    P.p(-x, -h, z0),
    P.p(x, -h, z0),
    P.p(x, 0, z0),
    P.p(-x, 0, z0),
  ];
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={amt}>
      <path d={poly(top)} fill="#FFD27A" fillOpacity={0.3} />
      <path d={poly(front)} fill="#FFD27A" fillOpacity={0.22} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const REST = camOf(eyeAt(0));
export const frameState = (frame: number) => {
  const e = eyeAt(frame);
  const { cam: cam0, depth } = camOf(e);
  const cam = swayCam(cam0, frame);
  const scene = sceneAt(e.c);
  const A = airWorldOf({
    cam,
    rest: REST.cam,
    depth,
    frame,
    fogBy: "depth",
    scene,
  });
  return { e, cam, depth, scene, A };
};

const EonsInEightyEightHours: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { e, cam, scene, A } = frameState(frame);
  // the medium's motes parallax against the eye's true travel (up and back)
  const v = makeAirView({
    scene: { ...AIR_SCENE_DEPTH, ...scene, F: A.P.Dc * cam.k },
    frame,
    horizon: 960 + (A.P.opts.eyeY - cam.cy) * cam.k,
    cam: { x: cam.cx, y: e.H, z: -e.D },
    rest: { x: 0, y: H0, z: -D_OF_K(K0) },
  });
  const reqs = useMemo(() => geniusCrowdReqs(SPRITE_VIEWS), []);
  const get = useGeniusSprites(reqs);
  const P = A.P;
  const pack = packAt(frame);
  const stones = STONES.map((s, i) => ({ s, i, Z: stoneGeom(s).Z })).sort(
    (a, b) => b.Z - a.Z,
  );
  return (
    <AirStage v={v} bloom={0.22}>
      <SandFloor A={A} e={e} />
      <WorldSvg cam={cam}>
        <Road A={A} />
        <AirHorizonHazeW A={A} id="eons-hz" below={170} />
        <OrangeLine A={A} frame={frame} />
        {/* the far end: the tablet on the road where the line stops, the 3200 BC stone beside it */}
        <Tablet A={A} frame={frame} />
        {stones.map((q) => (
          <Milestone key={q.i} A={A} s={q.s} uid={`ms${q.i}`} />
        ))}
        {/* the block */}
        <AirShadow
          A={A}
          X={0}
          Z={BLOCK.z1 / 2}
          w={BLOCK.x * 1.1}
          d={BLOCK.z1 * 0.75}
          uid="blkS"
          amt={0.7}
        />
        <AirBox
          A={A}
          X0={-BLOCK.x}
          X1={BLOCK.x}
          Y0={-BLOCK.h}
          Y1={0}
          Z0={BLOCK.z0}
          Z1={BLOCK.z1}
          mat={MAT.orange}
          uid="blk"
          orange
          lw={A.lw(1.1) * 2.4}
        />
        <BlockGlow A={A} amt={pack} />
      </WorldSvg>
      <FolkCanvas
        draw={(ctx) => {
          for (const m of SWARM) {
            // "compacting": the crowd closes ranks toward the block's centre (rows close up 18 %, columns 6 %)
            const mX = m.X * (1 - 0.06 * pack);
            const mZ = BLOCK.z1 / 2 + (m.Z - BLOCK.z1 / 2) * (1 - 0.18 * pack);
            const [x, y] = screenOf(P.p(mX, -BLOCK.h, mZ), cam);
            const hPx = 312 * P.r(mZ) * cam.k;
            const u = 2 * Math.PI * (frame / m.per + m.ph);
            const bob = 0.035 * hPx * Math.pow(Math.abs(Math.sin(u)), 1.5);
            const shuf = 0.025 * hPx * Math.sin(u * 0.5 + 1.3);
            blitGenius(ctx, get, x + shuf, y - bob, hPx, {
              variant: m.variant,
              view: m.view,
              fog: A.folkFog(mZ, BLOCK.h),
              shadow: true,
            });
          }
        }}
      />
      {/* the near floor sinks into the dense low air toward the frame's bottom (the block stays the subject) */}
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <linearGradient
            id="eons-near"
            x1="0"
            y1="1180"
            x2="0"
            y2="1920"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={PAL.shadow} stopOpacity={0} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.22} />
          </linearGradient>
        </defs>
        <rect x={0} y={1180} width={1080} height={740} fill="url(#eons-near)" />
      </svg>
      <WorldSvg cam={cam}>
        <HoursPlate A={A} t={plateT(frame, 58, 13)} />
      </WorldSvg>
    </AirStage>
  );
};

export default EonsInEightyEightHours;
