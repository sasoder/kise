// ---------------------------------------------------------------------------
// TenEarths (rsi-ten-earths, cut 9 at 99.18 s). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 268 frames. The shared world: tenEarthsGlobe (EarthGlobe / OrangeEarth on one
// GlobeLayer canvas) and tenEarthsHall (YearPlate), both read-only.
//
// CHECK LINE: "By 2030 the AIs outnumber China; a year later, everyone on Earth; the year after, ten Earths' worth,
//   and it keeps going."
//
// THE LINE: "effective population of AIs might be larger than the number of people in China, just one year after
//   that, it'd be larger than the number of people on Earth, and the year after that, around 10 Earths, and so on. If"
// WORD -> FRAME: the -3 · effective 1 · population 8 · of 17 · AIs 27 · might 34 · be 38 · larger 41 · than 49 ·
//   the 58 · number 60 · of 67 · people 71 · in 76 · China, 79 · just 83 · one 96 · year 102 · after 109 · that, 114 ·
//   it'd 123 · be 131 · larger 134 · than 141 · the 150 · number 153 · of 157 · people 161 · on 165 · Earth, 172 ·
//   and 184 · the 189 · year 191 · after 194 · that, 200 · around 210 · 10 221 · Earths, 236 · and 250 · so 256 ·
//   on. 259 · If 259 (cut at 268)
// DURATION: the slot 99.1824 -> 110.3602 s (sequence frames 2378-2646) = 11.178 s x 23.976 = 268 frames (f0..f267).
//
// THE MOTION: one Earth in the air, turned to Asia and turning slowly (lon 104 -> 96), China lit cream, the plate
// 2030 sliding up above it (f0-f12). The orange tide of AIs wells up at China's centroid (f8), fills China exactly to
// its border at f70 (cover 0.12), the label China slides up beside it (f64-f76), and the tide spills just past the
// border on "China" (f79, cover ~0.15) and creeps there while the year plate hands over 2030 -> 2031 (2030 slides
// up and out f94-f104, 2031 slides up and in f99-f111). From "it'd be larger" (f122) the tide runs over all the land
// (the visible face by f150), then the seas close from the coasts (sea 0 -> 1 f146-f180; the visible face is closed at
// sea ~0.6, f166): the whole globe orange by "Earth" (f166-f172; the China outline and label drain f146-f166). The
// camera, a very slow push-in until f150, makes one pull-back (f172-f226, k 0.97 -> 0.224) and stops at the size the
// ten need. As soon as it starts, the nine more orange Earths come out from behind the first, so the first becomes
// one of ten while the camera pulls back (never a lone small globe): the bottom row's stack drops out below it
// (f182-f212), then both rows fan open sideways like a dealt deck (f192-f228), landing as the camera lands in a 5-over-5
// formation of 170 px Earths (16 px gaps, x 83-997, y 622-978), the first at the top middle; all ten in place by
// "Earths" (f236). The plate rides the top of the group (72-84 px above the first Earth's top edge, ~76-80 px type: it
// keeps its size through the pull-back) and hands over 2031 -> 2032 the same way (out f184-f194, in f189-f201).
// "and so on" (f236-f267): more orange Earths, a hazy far rank high above the ten (y ~515, Z 4500, ~80 px), sail in
// from beyond both frame edges, clear of the plate and the top row.
// Orange = THE AIs only (COMMON.md): the tide and the orange Earths (one Earth's worth of AIs each). The Earth, the
// labels and the air in the style's muted colours.
//
// DEPTH: londonDepth perspective with the eye's row held at screen y 1250 on every frame (eyeY = cam.cy + 290 / k: a
// true dolly-back keeps the horizon still, so the air's light band does not sweep up through the globes; the hero's
// centre is world 0,0, the formation's centre 0,475), dRef 1800 / kRef 1 / dolly 0.5, fog by DEPTH (fogBy "depth": the pull-back does not fog the payoff). The ten sit on
// the front plane Z 0 (fogged as Z_FRONT 350, the probe's hero tone); the nine emerging come forward from Z 900;
// "and so on": the far rank at Z 4500 (high above the top row).
//
// SOURCES (header only; on screen only China, 2030, 2031, 2032): China ~1.41 billion people (National Bureau of
//   Statistics of China, 2024); Earth ~8.2 billion (UN World Population Prospects 2024); 10 Earths ~82 billion. The
//   chain 2030 > China, 2031 > Earth, 2032 ~ 10 Earths is the speaker's own projection (~10x a year), drawn as said.
//   Land and China outline: Natural Earth 1:110m via world-atlas (tenEarthsGlobe).
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airWorldOf, c01, lerp, pchip, perspective, smoothstep, swayCam, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CHINA_FACE, GlobeLayer, globeFog, globeFromWorld, globePoint, type GlobeSpec } from "./tenEarthsGlobe";
import { YearPlate, yearPlateT } from "./tenEarthsHall";

export const FPS = 24000 / 1001;
export const DURATION = 268;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ===================================================================================================================
// THE WORLD (world px of the front plane; the hero Earth's centre is 0,0)
// ===================================================================================================================
/** the hero's world radius: 760 px wide at k 1 */
export const R = 380;
/** the camera's landed zoom: globes 170 px (r 85) on a 186 px pitch (16 px gaps); the pull-back stops there */
export const K_SET = 85 / R;
/** the formation: 5 over 5, the hero at the top middle (j 0, row 0); its pitch on screen once landed, and in world */
export const PITCH_PX = 186;
export const PITCH_X = PITCH_PX / K_SET;
export const PITCH_Y = PITCH_PX / K_SET;
/** the formation's centre (world) and where it sits on screen once the camera has landed: x 83-997, y 622-978 */
export const FORM_CY = PITCH_Y / 2;
export const FORM_SY = 800;
/** the front plane's fog depth (the probe's hero tone) and the air height the globes fog toward */
const Z_FRONT = 350;
const H_AIR = 600;

/** the horizon's screen row (the probe's): held still through the pull-back */
const HORIZON_SY = 1250;
const depthOf = (cam: Cam): DepthOpts => ({ eyeY: cam.cy + (HORIZON_SY - 960) / cam.k, dRef: 1800, kRef: 1, dolly: 0.5 });

// ===================================================================================================================
// THE CAMERA: a keyed target (ln k and the hero centre's screen row) through the house damped follow
// (CAM_STIFF 0.09 / CAM_DAMP 0.468, LEAD 5; SlavesTurnTheCrane's camAt). cx stays on the hero / formation's centre.
// ===================================================================================================================
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;
type Key = { f: number; k: number; sy: number };
export const CAM_KEYS: Key[] = [
  { f: 0, k: 1.0, sy: 805 },
  { f: 150, k: 1.045, sy: 812 },
  { f: 172, k: 0.97, sy: 800 },
  { f: 200, k: 0.36, sy: 740 },
  { f: 226, k: K_SET, sy: FORM_SY - FORM_CY * K_SET },
  { f: 267, k: K_SET, sy: FORM_SY - FORM_CY * K_SET },
];
const CAM_PATH: Cam[] = (() => {
  const pk = pchip(CAM_KEYS.map((q) => [q.f, Math.log(q.k)] as [number, number]));
  const py = pchip(CAM_KEYS.map((q) => [q.f, q.sy] as [number, number]));
  const target = (f: number) => [pk(f), py(f)];
  const PRE = 60;
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = [0, 0];
  const out: Cam[] = [];
  for (let f = -PRE + 1; f <= DURATION + 2; f++) {
    const t = target(f + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) {
      const k = Math.exp(s[0]);
      out.push({ k, cx: 0, cy: -(s[1] - 960) / k });
    }
  }
  return out;
})();
export const camAt = (frame: number): Cam => CAM_PATH[Math.max(0, Math.min(CAM_PATH.length - 1, Math.round(frame)))];
export const camOf = (frame: number): Cam => swayCam(camAt(frame), frame);
const REST = camOf(0);
export const airOf = (frame: number) => {
  const cam = camOf(frame);
  return airWorldOf({ cam, rest: REST, depth: depthOf(cam), frame, fogBy: "depth" });
};

/** world (front-plane px) -> screen */
const toScreen = (cam: Cam, x: number, y: number) => [540 + (x - cam.cx) * cam.k, 960 + (y - cam.cy) * cam.k] as const;
/** screen -> world (front plane) */
const toWorld = (cam: Cam, sx: number, sy: number) => [cam.cx + (sx - 540) / cam.k, cam.cy + (sy - 960) / cam.k] as const;

// ===================================================================================================================
// THE TIDE (the hero's cover / sea / china), the turn
// ===================================================================================================================
const COVER = pchip(
  [
    [0, 0],
    [8, 0],
    [14, 0.02],
    [27, 0.036],
    [70, 0.12],
    [84, 0.165],
    [122, 0.2],
    [150, 0.62],
    [158, 1],
  ],
  true,
);
export const coverAt = (f: number) => (f <= 8 ? 0 : f >= 158 ? 1 : c01(COVER(f)));
export const seaAt = (f: number) => interpolate(f, [146, 180], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
export const chinaAt = (f: number) => 1 - smoothstep(148, 166, f);
/** the turn: the facing longitude drifts east -> west (the surface moves left to right), one rate for every Earth */
const TURN = 8 / (DURATION - 1);
export const heroLon = (f: number) => 104 - TURN * f;

// ===================================================================================================================
// THE NINE: they come out from behind the first WHILE the camera pulls back, so the first becomes one of ten and no
// frame shows a lone small globe. The bottom row's stack drops out below the first (f182-f212), then both rows fan
// open sideways like a dealt deck (f192-f228). Their offsets are set ON SCREEN as a fraction g of the landed layout
// (j x 186, row x 186 px from the first): every Earth moves outward monotonically on screen while the camera shrinks
// them all (in world they spread faster than the pull-back), and they land exactly as the camera lands. Inner ones
// in front of outer ones, everything behind the first until it is out.
// ===================================================================================================================
const ease = Easing.bezier(0.33, 0, 0.2, 1);
export const DROP = [182, 212] as const;
export const SPREAD = [192, 228] as const;
const dropE = (f: number) => interpolate(f, [...DROP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const spreadE = (f: number) => interpolate(f, [...SPREAD], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
type Slot = { j: number; row: number; lon: number; lat: number };
export const NINE: Slot[] = [
  { j: -2, row: 0, lon: -62, lat: 20 },
  { j: -1, row: 0, lon: 42, lat: 18 },
  { j: 1, row: 0, lon: -20, lat: 24 },
  { j: 2, row: 0, lon: 168, lat: 16 },
  { j: -2, row: 1, lon: 12, lat: 22 },
  { j: -1, row: 1, lon: 140, lat: 15 },
  { j: 0, row: 1, lon: 72, lat: 18 },
  { j: 1, row: 1, lon: -150, lat: 20 },
  { j: 2, row: 1, lon: -108, lat: 14 },
];
/** how far behind the front plane a stacked Earth is (b 1 = fully stacked): fog depth and size */
const Z_BEHIND = 500;
const S_BEHIND = 0.88;
/** an Earth of the nine at frame f: its screen offset from the first (px) and how stacked it still is */
export const nineAt = (s: Slot, f: number) => {
  const gd = s.row === 1 ? dropE(f) : 1;
  const gs = s.j !== 0 ? spreadE(f) : 1;
  const b = 1 - Math.min(gd, gs);
  return { dx: s.j * PITCH_PX * gs, dy: s.row * PITCH_PX * gd, b };
};

/** "and so on": more Earths far back in the haze (Z 4500, ~80 px, hazier), one rank high above the ten (y 515, clear
 *  of the top row and of the 2032 plate), sailing in at constant speed from beyond both frame edges (off frame until
 *  they enter); they stop short of the plate's air by the last frame */
type More = { side: -1 | 1; sy: number; Z: number; f0: number; v: number; lon: number; lat: number };
export const MORE: More[] = [
  { side: -1, sy: 515, Z: 4500, f0: 236, v: 5, lon: 150, lat: 18 },
  { side: 1, sy: 515, Z: 4500, f0: 237, v: 5, lon: -80, lat: 20 },
  { side: -1, sy: 515, Z: 4500, f0: 254, v: 5, lon: -10, lat: 14 },
  { side: 1, sy: 515, Z: 4500, f0: 255, v: 5, lon: 60, lat: 22 },
];
/** their fog (a fraction of their depth): hazy, but still warm rather than olive */
const MORE_FOG = 0.75;

// ===================================================================================================================
// THE PLATES AND THE CHINA LABEL (world space)
// ===================================================================================================================
/** the China label: beside China, over the sea east of it (a point on the globe; it turns with it) */
export const CHINA_LABEL = { lon: 146, lat: 33, size: 56 };
/** THE YEAR PLATE rides the top of the group (the hero, then the formation's top row: no Earth is ever above it),
 *  PLATE_GAP px above its top edge, ~76 -> 80 px type; each new year slides up in (0.5 em) just after the old one slides up and out (0.4 em less 6 px) */
const EXIT_TRIM = 6; // px: the exiting 2030 (big Earth, plate highest) stops its rise 6 px short so its top stays at y >= 290
const PLATE_GAP = [84, 72] as const; // landed, close up (the big Earth leaves less air above it)
type Year = { text: string; in: number; out: number };
export const YEARS: Year[] = [
  { text: "2030", in: 0, out: 94 },
  { text: "2031", in: 99, out: 184 },
  { text: "2032", in: 189, out: 1e9 },
];
const IN_DUR = 12;
const OUT_DUR = 10;
export const plateAt = (frame: number, hero: { cy: number; r: number }, k: number) => {
  const kk = c01((k - K_SET) / (1 - K_SET));
  const sy = hero.cy - hero.r - lerp(PLATE_GAP[0], PLATE_GAP[1], kk);
  const size = lerp(80, 76, kk);
  return YEARS.map((y) => {
    const tIn = yearPlateT(frame, y.in, IN_DUR);
    const u = c01((frame - y.out) / OUT_DUR);
    // the old year rises at once (ease out) and is gone before the new one, coming up from below, is legible
    return { text: y.text, sy, size, tIn, opacity: 1 - smoothstep(0, 0.7, u), lift: (0.4 * size - EXIT_TRIM) * Math.sin((u * Math.PI) / 2), on: tIn > 0 && u < 1 };
  });
};

// ===================================================================================================================
// THE FRAME
// ===================================================================================================================
export type Scene = {
  cam: Cam;
  A: AirWorld;
  globes: GlobeSpec[];
  hero: GlobeSpec;
  china: { x: number; y: number; front: number; t: number; o: number };
};
export const sceneAt = (frame: number): Scene => {
  const cam = camOf(frame);
  const A = airOf(frame);
  const P = A.P;
  const lonT = TURN * frame;
  const front = globeFog(A, Z_FRONT, H_AIR);
  const hero: GlobeSpec = { ...globeFromWorld(cam, 0, 0, R), lon: heroLon(frame), lat: CHINA_FACE.lat, china: chinaAt(frame), cover: coverAt(frame), sea: seaAt(frame), ...front };
  // the nine: stacked behind the hero, dropping and spreading out to their slots as the camera pulls back
  const nine = NINE.map((sl, i) => {
    if (frame < DROP[0]) return null;
    const q = nineAt(sl, frame);
    const g = { cx: hero.cx + q.dx, cy: hero.cy + q.dy, r: R * cam.k * lerp(1, S_BEHIND, q.b) };
    return { b: q.b, row: sl.row, aj: Math.abs(sl.j), i, spec: { ...g, lon: sl.lon - lonT, lat: sl.lat, cover: 1, sea: 1, ...globeFog(A, Z_FRONT + Z_BEHIND * q.b, H_AIR) } as GlobeSpec };
  }).filter((q): q is { b: number; row: number; aj: number; i: number; spec: GlobeSpec } => q !== null);
  // painter's order: the most stacked first; at a tie the bottom row, then the outer ones, go behind (fixed through the move)
  nine.sort((a, b) => b.b - a.b || b.row - a.row || b.aj - a.aj || a.i - b.i);
  // "and so on": world points that start just beyond the frame edge (halo included, at the f0 camera) and sail inward
  const more = MORE.map((m, i) => {
    if (frame < m.f0) return null;
    const c0 = camOf(m.f0);
    const D0 = depthOf(c0);
    const P0 = perspective(c0, D0);
    const r0 = P0.r(m.Z);
    const rs = R * r0 * c0.k;
    const [wx, wy] = toWorld(c0, m.side < 0 ? -1.2 * rs - 2 : 1080 + 1.2 * rs + 2, m.sy);
    const vx = c0.cx;
    const vy = D0.eyeY;
    const X0 = vx + (wx - vx) / r0;
    const Y0 = vy + (wy - vy) / r0;
    // v: screen px per frame at the f0 camera -> world units per frame at this depth
    const X = X0 - m.side * (m.v / (c0.k * r0)) * (frame - m.f0);
    const p = P.p(X, Y0, m.Z);
    const [sx, sy] = toScreen(cam, p[0], p[1]);
    return { Z: m.Z, i, spec: { cx: sx, cy: sy, r: R * P.r(m.Z) * cam.k, lon: m.lon - lonT, lat: m.lat, cover: 1, sea: 1, ...globeFog(A, Z_FRONT + MORE_FOG * m.Z, H_AIR) } as GlobeSpec };
  }).filter((q): q is { Z: number; i: number; spec: GlobeSpec } => q !== null);
  more.sort((a, b) => b.Z - a.Z || a.i - b.i);
  const globes = [...more.map((q) => q.spec), ...nine.map((q) => q.spec), hero];
  // the China label rides its point on the turning globe
  const cp = globePoint(hero, CHINA_LABEL.lon, CHINA_LABEL.lat);
  const china = { ...cp, t: yearPlateT(frame, 64, 12), o: (1 - smoothstep(146, 158, frame)) * c01((cp.front - 0.15) / 0.25) };
  return { cam, A, globes, hero, china };
};

// screen -> world for the label (the plate component draws in world px on the front plane)
const ChinaLabel: React.FC<{ s: Scene }> = ({ s }) => {
  const { china, cam, A } = s;
  if (china.t <= 0 || china.o <= 0.001) return null;
  const [X, Y] = toWorld(cam, china.x, china.y);
  return (
    <g opacity={china.o}>
      <YearPlate A={A} X={X} Y={Y} Z={0} text="China" t={china.t} uid="lblChina" size={CHINA_LABEL.size} weight={700} />
    </g>
  );
};

const TenEarths: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const s = sceneAt(frame);
  const { cam, A } = s;
  const plates = plateAt(frame, s.hero, cam.k);
  return (
    <AirStage v={A.v} bloom={0.22}>
      <GlobeLayer globes={s.globes} />
      <WorldSvg cam={cam}>
        <ChinaLabel s={s} />
        {plates.map((p) => {
          if (!p.on) return null;
          const [X, Y] = toWorld(cam, 540, p.sy);
          return (
            <g key={p.text} opacity={p.opacity} transform={`translate(0 ${(-p.lift / cam.k).toFixed(3)})`}>
              <YearPlate A={A} X={X} Y={Y} Z={0} text={p.text} t={p.tIn} uid={`y${p.text}`} size={p.size / cam.k} />
            </g>
          );
        })}
      </WorldSvg>
    </AirStage>
  );
};

export default TenEarths;
