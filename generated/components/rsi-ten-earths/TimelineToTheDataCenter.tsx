// ---------------------------------------------------------------------------
// TimelineToTheDataCenter (rsi-ten-earths, cut 17). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 173 frames.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d; the world is the clip's shared modules: tenEarthsHall (the compact data-center
// building, its cutaway, racks, desks, the year plates) and tenEarthsGenius (the orange Geniuses). Read-only imports.
//
// CHECK LINE: "Forget WHEN we get there: look at what is at the end of that road, a building full of AI geniuses at
//   work."
//
// THE LINE: "the crazier thing to contemplate here is not the timeline, but what happens once we do get to a country
//   of geniuses in a data center. Because"
// WORD -> FRAME: the 9 · crazier 14 · thing 27 · to 32 · contemplate 35 · here 48 · is 51 · not 57 · the 61 ·
//   timeline 64 · but 79 · what 83 · happens 88 · once 98 · we 104 · do 108 · get 111 · to 127 · a 131 ·
//   country 133 · of 139 · geniuses 143 · in 156 · a 158 · data 160 · center 164 · Because 165
//   ("However" f-6 is said on the speaker before the slot.)
// DURATION: the slot 17.5175 -> 24.7330 s (sequence frames 420-593) = 173 frames at 24000/1001 (f0..f172).
//
// THE MOTION: one forward dolly from f0 down a straight road (the timeline) toward the data-center building at the
// road's end (its base on the vanishing line at y ~760 from f0). Cream year plates on slate posts stand beside the road:
// 2026 near on the left (figures ~100 px at f0), 2027 further on the right (short post), 2028 further on the left (tall
// post); the dolly glides past 2026 (it grows and sweeps out of the frame's left edge, ~f30-46), and on "not the
// timeline" the other two sink into the ground ahead of us one after the other (2027 from f57, 2028 from f62, 13 frames
// each, gone by f75): the years stop mattering, the road stays. The dolly speeds up on "but what happens once we do
// get to" (peak ~f90) and eases as the building grows out of the haze. On "a country of geniuses" the building's front
// wall hinges down toward us like a dollhouse front (f123 -> f143, eased by DataCenter, flat on the road's end on
// "geniuses"), and the hall inside is at work: four Geniuses typing at profile desks across the front (the inner-left
// one is THE Genius, v0), one at the left rack run's end, two at the rack ends in the side strips, a pair at the back
// of the centre aisle (one talking, the other nodding), one walking aisle 1 right to left out from behind the right
// run: the clip's first orange. The camera arrives ~f150, settles on "data center" and creeps in (D -2 %) to the last
// frame while they type, walk, talk and nod and the rack lights twinkle.
// CAUSE: the wall's fall is the reveal (it lies on the road's end from f143, its inner face up); the Geniuses are
//   already at work when it opens (nothing appears from nothing; the walker is mid-stride behind the rack run).
// Orange = the AIs only (the Geniuses). Racks slate with cream lights; walls oatmeal; road stone; posts slate; type cream.
// The hall's inner walls are repainted warm oatmeal plaster with darker back corners (HallWarmth, ours; the module's
// are a cool grey), and a soft cream glow from the ceiling's light rows lifts the open interior (HallGlow, ours).
//
// DEPTH: a pure dolly (londonDepth dolly 1): the camera's distance to the front plane D(f) = F / k with the focal
//   F = 1586 screen px; the eye 3.2 m (570 units, under the 4.2 m ceiling so its light rows show); the horizon held at
//   screen y 680 (HALL_READY's cut-1 framing: k 0.61 at rest). D: ~11400 (f0) -> 2600 (f152) -> 2552 (f172). The
//   building is HALL_COMPACT (front wall at Z -53, interior Z 0..1780), its racks GRID_COMPACT at Z 360; the road
//   X +-250 to Z -60; the plates' posts at X +-380, eye distances 2550 / 5600 / 6000 at f0. Fog by the eye's
//   distance (fogBy "eye", fogNear 1500, fogVis 7500), the people by stage depth (figFog). The near ground is drawn
//   clamp-free (projOf): the depth kit's -0.92 Dc clamp would leave the bottom of the frame bare early in the dolly.
//
// SOURCES: the years 2026-2028 = Dario Amodei's "one to three years" (said Nov 2026, earlier in the clip). No other
//   figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirHorizonHazeW, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, c01, lerp, lineOf, mixHex, pchip, smoothstep, swayCam, type AirWorld, type Cam, type DepthOpts, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { COMPACT_RACKS_Z, DataCenter, Desk, GRID_COMPACT, HALL_COMPACT, MAT_OATMEAL, U, YearPlate, deskAnchors, shiftRacks, type DeskSeat } from "./tenEarthsHall";
import { GENIUS_POSES as G, Genius, geniusWalkAdvance, type GeniusPose } from "./tenEarthsGenius";

export const FPS = 24000 / 1001;
export const DURATION = 173;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;

// ===================================================================================================================
// THE CAMERA: a pure dolly along Z
// ===================================================================================================================
/** the focal length (screen px per unit at distance 1) */
export const F = 1586;
/** the eye's height (units) and the horizon's screen row */
export const EYE = 570;
export const HY = 680;
/** the settle frame and the camera's distance to the front plane there (f0's distance follows from the speeds) */
const F_SET = 152;
const D_SET = 2600;
const DEPTH: DepthOpts = { eyeY: -EYE, dRef: D_SET, kRef: F / D_SET, dolly: 1 };
/** the dolly's speed (units / frame): a brisk glide past the year plates (~44-50), the push on "but what happens"
 *  (one lobe, peak ~102 at f90), easing into the settle at f152, then a creep. The keys from f70 on are v5's (the
 *  approach, the cutaway and the end are unchanged); D is integrated BACKWARD from the settle, so f >= 90 is v5's. */
const VM = pchip(
  [
    [0, 44],
    [30, 46],
    [52, 50],
    [70, 63.6074],
    [90, 101.7719],
    [110, 93.2909],
    [128, 44.1012],
    [142, 11.0253],
    [152, 0],
    [180, 0],
  ],
  true,
);
const VC = (f: number) => 2.4 * smoothstep(116, 152, f);
const SUB = 4;
const vel = (f: number) => Math.max(0, VM(f)) + VC(f);
const integ = (a: number, b: number) => {
  let s = 0;
  const n = Math.max(1, Math.round(Math.abs(b - a) * SUB));
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) s += 0.5 * h * (vel(a + i * h) + vel(a + (i + 1) * h));
  return s;
};
/** D at every integer frame (tabulated once; frames are integers) */
const D_TAB: number[] = Array.from({ length: DURATION + 2 }, (_, f) => (f <= F_SET ? D_SET + integ(f, F_SET) : D_SET - integ(F_SET, f)));
/** the camera's distance at f0 (~11400) */
const D0 = D_TAB[0];
export const dollyD = (f: number) => {
  const i = Math.max(0, Math.min(D_TAB.length - 2, Math.floor(f)));
  return lerp(D_TAB[i], D_TAB[i + 1], f - i);
};
/** the 2D camera whose depth-kit perspective is the dolly at distance D (horizon at screen row HY) */
const camOfD = (D: number): Cam => {
  const k = F / D;
  return { k, cx: 0, cy: -EYE - (HY - 960) / k };
};
export const camAtFrame = (f: number) => swayCam(camOfD(dollyD(f)), f);
const REST = camAtFrame(0);

// ===================================================================================================================
// THE ROAD AND THE YEAR PLATES
// ===================================================================================================================
const ROAD_W2 = 250;
const ROAD_Z1 = -60;
const MAT_ROAD: Mat = { lit: "#8E8576", mid: "#6F675A", dark: "#3E3A33" };
const ROAD_HEX = mixHex(MAT_ROAD.lit, MAT_ROAD.mid, 0.45);
/** the year plates: road signs on slate posts beside the road (posts at X +-380, just off the kerb), each plate's
 *  type 190 units. year, side, its eye distance at f0, its centre's height, the frame it starts to sink (2026 is not
 *  sunk: the dolly passes it, out of the frame's left edge ~f30-46). At f0 2026's figures are ~100 px tall (centre
 *  x ~300, y ~767); 2027 (right, on a short post, y ~788, below the building's base) and 2028 (left, on a tall post,
 *  y ~623, above its roof line and clear of 2026) leave the building at the road's end clear; they grow as we come
 *  on, then sink into the ground ahead of us on "not" (f57) and "the timeline" (f62), each in 13 frames, ~85 px
 *  when they go (far enough that their ground line stays above the caption bands). tools/plates3.py in the scratch checks sizes, keep-in and overlaps per frame. */
export const PLATE_X = 380;
export const PLATE_SIZE = 190;
const PLATE_DISC = 0.6;
export const SINK_DUR = 13;
export const PLATES = [
  { year: "2026", side: -1, d0: 2550, h: 430, f: 9999 },
  { year: "2027", side: 1, d0: 5600, h: 230, f: 57 },
  { year: "2028", side: -1, d0: 6000, h: 760, f: 62 },
].map((p) => ({ ...p, Z: p.d0 - D0, X: p.side * PLATE_X, Y: -p.h }));
export const PLATE_Z = PLATES.map((p) => p.Z);

/** the nearest ground drawn: the depth kit's perspective clamps at -0.92 Dc, so the long dolly's near ground (the
 *  bottom of the frame early on) is projected here without the clamp (d >= NEAR_D is below the frame's bottom row) */
const NEAR_D = 250;
const projOf = (A: AirWorld) => {
  const Dc = A.Dc;
  const cx = A.cam.cx;
  const eyeY = A.P.opts.eyeY;
  return (X: number, Y: number, Z: number): [number, number] => {
    const r = Dc / (Dc + Z);
    return [cx + (X - cx) * r, eyeY + (Y - eyeY) * r];
  };
};
const ptsOf = (q: [number, number][]) => `M${q.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`;

/** the outdoor ground (AirFloor's look, clamp-free): bands of one continuous tone by distance, a little darker near,
 *  the far end melting into the air; big flagstone joints in a darker local colour that fade with the fog */
const OutdoorGround: React.FC<{ A: AirWorld; x0: number; x1: number; z1: number; mat: Mat; course: number; melt: number }> = ({ A, x0, x1, z1, mat, course, melt }) => {
  const p = projOf(A);
  const za = -A.Dc + NEAR_D;
  const mf = melt * (z1 - za);
  const meltAt = (Z: number) => Math.pow(c01((Z - (z1 - mf)) / mf), 1.3);
  const colAt = (Z: number) => {
    const near = c01(1 - (Z + 400) / 900);
    const local = mixHex(mixHex(mat.lit, mat.mid, 0.3), mat.dark, 0.2 * near);
    return mixHex(A.tone(local, Z, 0), A.screenAir(p(0, 0, Z)[1]), meltAt(Z));
  };
  const N = 34;
  const zAt = (i: number) => lerp(za, z1, Math.pow(i / N, 1.8));
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const a = zAt(i);
    const b = zAt(i + 1);
    const b2 = i < N - 1 ? b + (b - a) * 0.15 : b;
    bands.push(<path key={i} d={ptsOf([p(x0, 0, a), p(x1, 0, a), p(x1, 0, b2), p(x0, 0, b2)])} fill={colAt((a + b) / 2)} />);
  }
  const lines: React.ReactNode[] = [];
  const pieces = 20;
  const zJ = (i: number) => lerp(za, z1, Math.pow(i / pieces, 1.6));
  const step = course * 0.7;
  for (let i = 0; i < pieces; i++) {
    const a = zJ(i);
    const b = zJ(i + 1);
    const zm = (a + b) / 2;
    const amt = (1 - A.fog(zm)) * (1 - meltAt(zm));
    if (amt < 0.03) continue;
    let d = "";
    for (let X = Math.ceil(x0 / step) * step; X <= x1; X += step) if (Math.abs(X) > ROAD_W2 + 40) d += `M${p(X, 0, a).map((v) => v.toFixed(2)).join(",")}L${p(X, 0, b).map((v) => v.toFixed(2)).join(",")}`;
    for (let X = Math.floor(x0 / step) * step; X < x1; X += step) {
      const off = (((Math.round(X / step) % 2) + 2) % 2) * course * 0.5;
      for (let Z = Math.floor((a - off) / course) * course + off; Z < b; Z += course) {
        if (Z < a) continue;
        const xa = Math.max(x0, X);
        const xb = Math.min(x1, X + step);
        // the joints stop at the road's kerbs
        const segs: [number, number][] = xb <= -ROAD_W2 - 14 || xa >= ROAD_W2 + 14 ? [[xa, xb]] : [[xa, Math.min(xb, -ROAD_W2 - 14)], [Math.max(xa, ROAD_W2 + 14), xb]];
        for (const [u, v] of segs) if (v > u) d += `M${p(u, 0, Z).map((w) => w.toFixed(2)).join(",")}L${p(v, 0, Z).map((w) => w.toFixed(2)).join(",")}`;
      }
    }
    const r = A.Dc / (A.Dc + zm);
    lines.push(<path key={`j${i}`} d={d} fill="none" stroke={A.tone(lineOf(mat), zm, 0)} strokeWidth={1.2 * r} strokeOpacity={0.45 * amt} />);
  }
  return (
    <g>
      {bands}
      {lines}
    </g>
  );
};

/** a flat strip on the ground X0..X1 from the near ground to z1, in depth pieces, each fogged by its own distance
 *  (solid fills: overlapping pieces never show seams) */
const GroundStrip: React.FC<{ A: AirWorld; X0: number; X1: number; z1: number; hex: string; n?: number }> = ({ A, X0, X1, z1, hex, n = 26 }) => {
  const p = projOf(A);
  const za = -A.Dc + NEAR_D;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = lerp(za, z1, Math.pow(i / n, 1.8));
    const b = lerp(za, z1, Math.pow((i + 1) / n, 1.8));
    const b2 = i < n - 1 ? b + (b - a) * 0.12 : b;
    out.push(<path key={i} d={ptsOf([p(X0, 0, a), p(X1, 0, a), p(X1, 0, b2), p(X0, 0, b2)])} fill={A.tone(hex, (a + b) / 2, 0)} />);
  }
  return <g>{out}</g>;
};

/** faint expansion joints across the road every `course` (they carry the dolly's speed on the plain road) */
const RoadJoints: React.FC<{ A: AirWorld; course: number; z1: number }> = ({ A, course, z1 }) => {
  const p = projOf(A);
  const za = -A.Dc + NEAR_D;
  const segs: React.ReactNode[] = [];
  for (let Z = Math.ceil(za / course) * course; Z < z1; Z += course) {
    const amt = 1 - A.fog(Z);
    if (amt < 0.05) continue;
    const r = A.Dc / (A.Dc + Z);
    const a = p(-ROAD_W2, 0, Z);
    const b = p(ROAD_W2, 0, Z);
    segs.push(<path key={Z} d={`M${a[0].toFixed(2)},${a[1].toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`} stroke={A.tone(MAT_ROAD.dark, Z, 0)} strokeWidth={1.6 * r} strokeOpacity={0.28 * amt} />);
  }
  return <g>{segs}</g>;
};

/** the hall's own light: a soft cream glow from the ceiling's light rows over the open interior (drawn last inside it) */
const HallGlow: React.FC<{ A: AirWorld; amt: number }> = ({ A, amt }) => {
  const P = A.P;
  const { x0, x1, Hc } = HALL;
  const c = P.p(0, -Hc * 0.9, 700);
  const tl = P.p(x0, -Hc, 0);
  const br = P.p(x1, 0, 0);
  const R = (br[0] - tl[0]) * 0.62;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id="tdc-hglow" gradientUnits="userSpaceOnUse" cx={c[0]} cy={c[1]} r={R}>
          <stop offset="0" stopColor={PAL.cream} stopOpacity={0.2 * amt} />
          <stop offset="0.45" stopColor={PAL.cream} stopOpacity={0.08 * amt} />
          <stop offset="1" stopColor={PAL.cream} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={tl[0]} y={tl[1]} width={br[0] - tl[0]} height={br[1] - tl[1]} fill="url(#tdc-hglow)" />
    </g>
  );
};

/** the hall's inner walls in warm oatmeal plaster (the module paints them a cool grey): drawn over HallInterior's
 *  walls as the first extra inside the hall (behind every rack row and figure). The back wall and both side walls
 *  sink a step darker into the two back corners, the left wall catching a little more light than the right, so the
 *  orange figures and the racks' cream lights carry the room. Only the wall faces are repainted (not the ceiling with
 *  its light rows, not the floor). */
const HallWarmth: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const P = A.P;
  const { x0, x1, z0, z1, Hc } = HALL;
  const vx = P.vp[0];
  const zm = (z0 + z1) / 2;
  const t = (hex: string, Z: number) => A.tone(hex, Z, Hc / 2);
  const back = t(mixHex(MAT_OATMEAL.mid, MAT_OATMEAL.dark, 0.3), z1);
  const corner = t(mixHex(MAT_OATMEAL.dark, MAT_OATMEAL.mid, 0.3), z1);
  const leftFront = t(mixHex(MAT_OATMEAL.lit, MAT_OATMEAL.mid, 0.55), z0);
  const rightFront = t(mixHex(MAT_OATMEAL.mid, MAT_OATMEAL.dark, 0.6), z0);
  const pts = (q: [number, number][]) => `M${q.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`;
  const bl = P.p(x0, -Hc / 2, z1);
  const br = P.p(x1, -Hc / 2, z1);
  const lf = P.p(x0, -Hc / 2, z0);
  const rf = P.p(x1, -Hc / 2, z0);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-bk`} gradientUnits="userSpaceOnUse" x1={bl[0]} y1={bl[1]} x2={br[0]} y2={br[1]}>
          <stop offset="0" stopColor={corner} />
          <stop offset="0.2" stopColor={back} />
          <stop offset="0.8" stopColor={back} />
          <stop offset="1" stopColor={corner} />
        </linearGradient>
        <linearGradient id={`${uid}-lw`} gradientUnits="userSpaceOnUse" x1={lf[0]} y1={lf[1]} x2={bl[0]} y2={bl[1]}>
          <stop offset="0" stopColor={leftFront} />
          <stop offset="0.55" stopColor={t(mixHex(MAT_OATMEAL.mid, MAT_OATMEAL.dark, 0.2), zm)} />
          <stop offset="1" stopColor={corner} />
        </linearGradient>
        <linearGradient id={`${uid}-rw`} gradientUnits="userSpaceOnUse" x1={rf[0]} y1={rf[1]} x2={br[0]} y2={br[1]}>
          <stop offset="0" stopColor={rightFront} />
          <stop offset="1" stopColor={t(mixHex(MAT_OATMEAL.dark, PAL.shadow, 0.35), z1)} />
        </linearGradient>
      </defs>
      <path d={pts([P.p(x0, -Hc, z1), P.p(x1, -Hc, z1), P.p(x1, 0, z1), P.p(x0, 0, z1)])} fill={`url(#${uid}-bk)`} />
      {x0 < vx ? <path d={pts([P.p(x0, -Hc, z0), P.p(x0, -Hc, z1), P.p(x0, 0, z1), P.p(x0, 0, z0)])} fill={`url(#${uid}-lw)`} /> : null}
      {x1 > vx ? <path d={pts([P.p(x1, -Hc, z0), P.p(x1, -Hc, z1), P.p(x1, 0, z1), P.p(x1, 0, z0)])} fill={`url(#${uid}-rw)`} /> : null}
    </g>
  );
};

/** the depth kit's perspective without its near clamp (the plates pass within a few hundred units of the eye, where
 *  the kit's -0.92 Dc clamp would freeze them): the same world, P.p / P.r / P.at unclamped */
const freeWorld = (A: AirWorld): AirWorld => {
  const P = A.P;
  const Dc = P.Dc;
  const r = (Z: number) => Dc / Math.max(1, Dc + Z);
  const p = (X: number, Y: number, Z: number): [number, number] => {
    const rr = r(Z);
    return [P.cam.cx + (X - P.cam.cx) * rr, P.opts.eyeY + (Y - P.opts.eyeY) * rr];
  };
  return { ...A, P: { ...P, r, p, at: (X: number, Z: number) => ({ at: p(X, 0, Z), scale: r(Z) }) } };
};

/** one year plate on its post; sink 0..1 takes the whole sign straight down into the ground (eased in; clipped at the
 *  ground line, which for 2027 / 2028 is above y 1070 while they sink), its type fading out late (0.55..0.95); the
 *  post's top tucks behind the figures */
const YearPost: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; year: string; sink: number; uid: string }> = ({ A: A0, X, Y, Z, year, sink, uid }) => {
  if (A0.Dc + Z < 150) return null;
  if (sink >= 1) return null;
  const A = freeWorld(A0);
  const P = A.P;
  const dy = (-Y + 0.45 * PLATE_SIZE) * sink * sink;
  const g = P.p(X, 0, Z);
  const fz = A.fog(Z);
  const postW = 16;
  const post: Mat = MAT.iron;
  const q = (x0: number, x1: number, y0: number, y1: number) => [P.p(x0, y0, Z), P.p(x1, y0, Z), P.p(x1, y1, Z), P.p(x0, y1, Z)].map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L");
  const top = Y + 0.2 * PLATE_SIZE + dy;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-cl`}>
          <rect x={g[0] - 40000} y={g[1] - 40000} width={80000} height={40000} />
        </clipPath>
      </defs>
      <AirShadow A={A} X={X} Z={Z} w={58} d={30} uid={`${uid}-sh`} amt={0.7 * (1 - sink)} />
      <g clipPath={`url(#${uid}-cl)`}>
        {/* the post: a slim square slate post, lit on its left, a cream rim up its lit edge */}
        <path d={`M${q(X - postW, X + postW, top, dy)}Z`} fill={A.tone(post.mid, Z, -top / 2)} />
        <path d={`M${q(X - postW, X - postW * 0.2, top, dy)}Z`} fill={A.tone(post.lit, Z, -top / 2)} />
        <path d={`M${q(X - postW, X - postW + 3, top, dy)}Z`} fill={PAL.cream} fillOpacity={0.35 * (1 - fz)} />
        <g opacity={(1 - 0.55 * fz) * (1 - smoothstep(0.55, 0.95, sink))}>
          <YearPlate A={A} X={X} Y={Y + dy} Z={Z} text={year} t={1} uid={`${uid}-yp`} size={PLATE_SIZE} plate={PLATE_DISC * Math.pow(1 - sink, 2)} />
        </g>
      </g>
    </g>
  );
};

// ===================================================================================================================
// THE HALL'S GENIUSES
// ===================================================================================================================
const HALL = HALL_COMPACT;
const RACKS = shiftRacks(GRID_COMPACT, 0, COMPACT_RACKS_Z);
/** the front wall comes down f123 -> f143 (DataCenter eases it), landing on "geniuses" */
const WALL_F0 = 123;
const WALL_F1 = 143;
const cutawayAt = (f: number) => c01((f - WALL_F0) / (WALL_F1 - WALL_F0));

type Typist = { X: number; Z: number; seat: DeskSeat; v: number; seed: number };
/** the front row: four profile desks, everyone facing the middle */
const TYPISTS: Typist[] = [
  { X: -560, Z: 56, seat: "left", v: 3, seed: 1 },
  { X: -300, Z: 56, seat: "left", v: 0, seed: 2 },
  { X: 300, Z: 56, seat: "right", v: 4, seed: 3 },
  { X: 560, Z: 56, seat: "right", v: 1, seed: 4 },
];
type Stander = { X: number; Z: number; dir: 1 | -1; v: number; seed: number; act?: "talk" | "nod" };
/** the centre aisle is only ~200 px wide on screen, so it holds three: one at the left run's end (near), a pair
 *  talking at the back, and one walking aisle 1; two more work at the rack ends in the side strips of aisle 1 (the
 *  deeper side strips hide behind the near runs). Checked per frame for overlaps (tools/layout.py in the scratch). */
const STANDERS: Stander[] = [
  { X: -185, Z: 470, dir: -1, v: 1, seed: 5 },
  // the pair at the back: told apart by look (v1 swept tuft + tie / v2 glasses + open collar), a step apart in depth,
  // and by what they do: the left one talks (mouth in bursts), the right one listens and nods twice
  { X: -128, Z: 1420, dir: 1, v: 1, seed: 6, act: "talk" },
  { X: 36, Z: 1740, dir: -1, v: 2, seed: 7, act: "nod" },
  { X: -623, Z: 720, dir: 1, v: 2, seed: 8 },
  { X: 623, Z: 760, dir: -1, v: 1, seed: 9 },
];
type Walker = { X0: number; Z: number; dir: 1 | -1; v: number; f0: number };
/** one walks aisle 1 right to left, out from behind the right rack run as the wall comes down (walkers cross the
 *  frame, never toward or away from us); X0 = his X on frame f0 */
const WALKERS: Walker[] = [{ X0: 300, Z: 700, dir: -1, v: 4, f0: 124 }];
/** a stander's small action on top of his breathing stand: "talk" opens the mouth in syllable bursts, "nod" dips the
 *  chin three times (f145-154, f156-165, f165-172 settling; 34 deg asked, the rig scales it by the head's yaw) */
const actPose = (q: GeniusPose, act: Stander["act"], frame: number): GeniusPose => {
  if (act === "talk") {
    const burst = smoothstep(0.15, 0.6, Math.sin(frame * 0.21 + 0.4)) * smoothstep(-0.2, 0.5, Math.sin(frame * 0.055 + 1.1));
    return { ...q, open: 0.45 * burst * (0.6 + 0.4 * Math.abs(Math.sin(frame * 0.9))) };
  }
  if (act === "nod") {
    const nod = (f0: number, f1: number) => (frame > f0 && frame < f1 ? Math.pow(Math.sin((Math.PI * (frame - f0)) / (f1 - f0)), 2) : 0);
    return { ...q, pitch: q.pitch + 34 * (nod(145, 154) + nod(156, 165)) + 22 * nod(165, 176) };
  }
  return q;
};
/** world units per frame of a walk (the rig's planted stride) */
const WALK_U = geniusWalkAdvance(1);

const hallExtras = (A: AirWorld, frame: number) => {
  const P = A.P;
  const items: { Z: number; node: React.ReactNode }[] = [];
  const fig = (X: number, Z: number, v: number, pose: GeniusPose, uid: string) => {
    const { at, scale } = P.at(X, Z);
    return <Genius variant={v} pose={pose} at={at} scale={scale} uid={uid} frame={frame} fog={A.folkFog(Z)} unitPx={A.k} />;
  };
  TYPISTS.forEach((d, i) => {
    const an = deskAnchors(d.X, d.Z, d.seat);
    items.push({
      Z: d.Z,
      node: (
        <g key={`ty${i}`}>
          <Desk A={A} X={d.X} Z={d.Z} seat={d.seat} uid={`tyd${i}`} layer="back" frame={frame} />
          {fig(an.at.X, an.at.Z, d.v, G.typeAtDesk(an.dir === 1 ? 1 : -1, frame, d.seed), `tyg${i}`)}
          <Desk A={A} X={d.X} Z={d.Z} seat={d.seat} uid={`tydf${i}`} layer="front" frame={frame} />
        </g>
      ),
    });
  });
  STANDERS.forEach((s, i) =>
    items.push({
      Z: s.Z,
      node: (
        <g key={`st${i}`}>
          <AirShadow A={A} X={s.X} Z={s.Z} w={62} d={30} uid={`sts${i}`} amt={0.8} />
          {fig(s.X, s.Z, s.v, actPose(G.stand(s.dir, frame, s.seed), s.act, frame), `stg${i}`)}
        </g>
      ),
    }),
  );
  WALKERS.forEach((w, i) => {
    const X = w.X0 + w.dir * WALK_U * (frame - w.f0);
    items.push({
      Z: w.Z,
      node: (
        <g key={`wk${i}`}>
          <AirShadow A={A} X={X} Z={w.Z} w={62} d={30} uid={`wks${i}`} amt={0.8} />
          {fig(X, w.Z, w.v, G.walk(w.dir, frame - w.f0), `wkg${i}`)}
        </g>
      ),
    });
  });
  return items.sort((a, b) => b.Z - a.Z);
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
export const TimelineScene: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = camAtFrame(frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, scene: { fogVis: 7500, fogNear: 1500 }, fogBy: "eye" });
  const cw = cutawayAt(frame);
  const extras = cw > 0.02 ? [{ Z: 1e6, node: <HallWarmth key="warm" A={A} uid="tdc-warm" /> }, ...hallExtras(A, frame), { Z: -1, node: <HallGlow key="glow" A={A} amt={1} /> }] : [];
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <OutdoorGround A={A} x0={-16000} x1={16000} z1={26000} mat={MAT.ground} course={420} melt={0.5} />
        <AirHorizonHazeW A={A} id="tdc-haze" />
        {/* the road: stone between a pale kerb (lit side) and a dark one, a cream line down its middle (the timeline) */}
        <GroundStrip A={A} X0={-ROAD_W2} X1={ROAD_W2} z1={ROAD_Z1} hex={ROAD_HEX} />
        <GroundStrip A={A} X0={-ROAD_W2 - 14} X1={-ROAD_W2} z1={ROAD_Z1} hex={mixHex(MAT.stone.lit, ROAD_HEX, 0.15)} />
        <GroundStrip A={A} X0={ROAD_W2} X1={ROAD_W2 + 14} z1={ROAD_Z1} hex={mixHex(MAT_ROAD.dark, ROAD_HEX, 0.4)} />
        <RoadJoints A={A} course={420} z1={ROAD_Z1} />
        <GroundStrip A={A} X0={-8} X1={8} z1={ROAD_Z1} hex={mixHex(PAL.creamLo, ROAD_HEX, 0.2)} />
        <DataCenter A={A} frame={frame} uid="tdc" hall={HALL} cutaway={cw} racks={RACKS} extras={extras} />
        {[...PLATES]
          .sort((a, b) => b.Z - a.Z)
          .map((p) => (
            <YearPost key={p.year} A={A} X={p.X} Y={p.Y} Z={p.Z} year={p.year} sink={c01((frame - p.f) / SINK_DUR)} uid={`yp${p.year}`} />
          ))}
      </WorldSvg>
    </AirStage>
  );
};

const TimelineToTheDataCenter: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return <TimelineScene frame={frame} />;
};

export default TimelineToTheDataCenter;
export { U };
