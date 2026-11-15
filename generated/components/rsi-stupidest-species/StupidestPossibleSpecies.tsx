// ---------------------------------------------------------------------------
// StupidestPossibleSpecies (rsi-stupidest-species, cut 7). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 220 frames. Built on the shared world W1 THE SPECIES TOWER (speciesTower.tsx, read-only;
// TOWER_READY.md is its API) and W2's Chimp (stupidestFolk.tsx, read-only; FOLK_READY.md): this cut adds its camera
// track, the human's and the chimp's gestures, the chimp niche's soft light and the stone-occluded dashes.
//
// CHECK LINE: "Humans are not near the top of what a mind can be: we sit just over the line for building a
//   civilization, the lowest species to make it."
//
// THE LINE: "Far from being the smartest possible biological species, we are probably better thought of as the
//   stupidest possible biological species capable of starting a technological civilization,"
// WORD -> FRAME: Far -4 · from 3 · being 6 · the 11 · smartest 15 · possible 25 · biological 31 · species 44 · we 65 ·
//   are 70 · probably 71 · better 77 · thought 84 · of 90 · as 95 · the 102 · stupidest 107 · possible 124 ·
//   biological 130 · species 142 · capable 154 · of 172 · starting 179 · a 186 · technological 190 · civilization 197
//   (Whisper onsets from the composition start; may run ~0.2-0.4 s early)
// DURATION: the slot 7.716 -> 16.892 s (sequence frames 185-405) = 9.176 s x 23.976 = 220 frames (f0..f219).
//
// THE MOTION: one continuous camera. f0 opens on the whole stone drum at 46 px/m with the CAPITAL high in frame (the top
// of biology), the SMARTEST POSSIBLE plate sliding up onto its block on "smartest" (f1-15), the empty grand niche
// cream-lit under it, open bright air above; a slow drift in. From
// "we" the camera pushes in and descends in ONE eased lobe (peak ~f80, the human's niche arriving on "stupidest"
// f107-124, settled ~f150): the capital and the upper niches leave over the top, and it lands on the human (~225 px)
// standing in his lit niche right on the CORNICE (the civilization line), the chimp sitting in its softly lit niche just
// below it. On "stupidest" a two-line STUPIDEST POSSIBLE plate slides up left of the human's niche at his chest height
// (f108-120; cap ~40 px at rest; two lines because one would not fit between the keep-in edge and the arch). On
// "technological civilization" (f183-200) a line of cream light travels along the cornice's top edge from the left,
// and the CIVILIZATION plate (cap ~40 px, on the cornice band's face below the light line) slides up as the light
// reaches its left edge (f192-202: cause, then the plate). Both plates are this cut's (WorldPlate, the shared
// SoftPlate's look); the tower's own civPlate stays off. Living
// hold: a 2 % creep, the chimp looks out (f148-170), the human glances up the tower (f201-215), motes drift.
// Orange = intelligence (the clip's rule): none in this cut (no dashed part, see NO DASHES). The cornice light is cream;
// the human and the chimp are never orange.
//
// CAMERA: one designed lobe (camTrack): the progress s(f) integrates a skewed bump t^A (1 - t)^B over [F0, F1] (F0 < 0,
// so f0 already drifts), renormalised so s(0) = 0 and s(F1) = 1; ln k runs linearly in s from OPEN.k to RES.k and the
// human's sill point (HUMAN_SPOT) runs on a straight screen path from OPEN.sill to RES.sill, so no face is carried
// through a caption band; then a 2 % creep in on the same anchor to the end, plus the house swayCam.
// The open is set HIGHER than TOWER_CAM.B_open (the capital's top at y ~450, not 620): at B_open the human's feet sat in
// caption band 1 (y ~1130) and the chimp's face at y ~1224; here the human's face starts ~y 890 and the chimp's ~y 1056
// and both only rise from there. Checked per frame by scripts/clips/rsi-stupidest-species/check-stupidest-possible.ts.
// NO DASHES: B shows no dashed continuation (director, after review: off the top of the frame the two dashed edges read
// as cables hanging the tower, and B never reaches the ceiling; the line is about the biological range only). The tower
// is drawn with show.dashed 0; the capital with SMARTEST POSSIBLE is the top of the picture, open bright air above it.
// THE CHIMP'S NICHE: the tower leaves it unlit; the chimp's occupant function lays a soft cool-cream light on the back
// wall and the floor of the niche behind the chimp (inside the niche's clip), far weaker and cooler than the human's.
// DEPTH: the tower's own depth camera (towerPersp: eye at 0.85 x the frame centre's height + 0.6 m, dRef 30000,
// kRef 0.058, dolly 0.6), fog by world depth (towerAirOf); the human on HUMAN_SPOT, the chimp on its niche's sill
// (sillAnchor("chimp"), inset 0.5 m).
//
// SOURCES: Bostrom, Superintelligence (Oxford UP, 2014), ch. 2 (the quote as spoken). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirStage, WorldSvg, mixHex, swayCam, type AirView, type AirWorld, type Cam, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as Covid from "../kyle-covid/covidFolk";
import { HUMAN_SPOT, PLATE_FONT, Rm, TOWER, TowerScene, frameAt, kForScale, m, nicheOf, nichePt, towerAirOf, towerPersp, towerPt, type OccupantFn } from "./speciesTower";
import { CHIMP_POSES, Chimp, type ChimpPose } from "./stupidestFolk";

export const FPS = 24000 / 1001;
export const DURATION = 220;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (x: number) => Math.max(0, Math.min(1, x));
const sst = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const smoother = (u: number) => {
  const x = c01(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};

// ---- the camera ---------------------------------------------------------------------------------------------------
/** the open and the resolved framing: the human's sill (his feet) at screen (540, sill) at the human's px per metre */
export const OPEN = { pxm: 46, sill: 958, sx: 532 };
export const RES = { pxm: 225 / 1.75, sill: 776 };
export const CAM = { A: 3.2, B: 2.3, F0: -12, F1: 166, CREEP: 1.02 };
const kOf = (pxm: number) => kForScale(pxm, HUMAN_SPOT.Z);
const LNK_OPEN = Math.log(kOf(OPEN.pxm));
const LNK_RES = Math.log(kOf(RES.pxm));
const N_INT = 1600;
const S_TAB = (() => {
  const tab = [0];
  const v = (i: number) => {
    const t = i / N_INT;
    return Math.pow(t, CAM.A) * Math.pow(1 - t, CAM.B);
  };
  for (let i = 0; i < N_INT; i++) tab.push(tab[i] + (v(i) + v(i + 1)) / 2);
  return tab.map((q) => q / tab[N_INT]);
})();
const sRaw = (f: number) => {
  const x = ((f - CAM.F0) / (CAM.F1 - CAM.F0)) * N_INT;
  if (x <= 0) return 0;
  if (x >= N_INT) return 1;
  const i = Math.floor(x);
  return S_TAB[i] + (S_TAB[i + 1] - S_TAB[i]) * (x - i);
};
const S0 = sRaw(0);
export const moveS = (f: number) => (sRaw(f) - S0) / (1 - S0);
/** the camera before the sway */
export const camTrack = (f: number): Cam => {
  const s = moveS(f);
  const creep = Math.log(CAM.CREEP) * smoother((f - CAM.F1 + 12) / (DURATION - 1 - CAM.F1 + 30));
  const k = Math.exp(LNK_OPEN + (LNK_RES - LNK_OPEN) * s + creep);
  const sy = OPEN.sill + (RES.sill - OPEN.sill) * s;
  return frameAt(k, HUMAN_SPOT.X, HUMAN_SPOT.Y, HUMAN_SPOT.Z, OPEN.sx, sy);
};
export const camOf = (f: number): Cam => swayCam(camTrack(f), f);
const REST = camOf(0);
/** the motes' layout is offset (as ExtractNotCreate's MOTE_OFFSET) so no front mote rides a face for more than a few
 *  frames (y only: an x offset would also slide the shafts as F changes with the zoom); checked by the check script */
export const MOTE_OFFSET = { x: 0, y: 1.275 };
export const moteView = (v: AirView): AirView => ({ ...v, travel: { x: v.travel.x + MOTE_OFFSET.x, y: v.travel.y + MOTE_OFFSET.y, z: v.travel.z } });

// ---- the beats ----------------------------------------------------------------------------------------------------
/** SMARTEST POSSIBLE slides up onto the capital block, landing on "smartest" (f15) */
export const capitalPlateAt = (f: number) => sst(1, 15, f);
/** the cornice's travelling light: its head crosses the frame from the left edge (LIGHT.in) to the right (LIGHT.out),
 *  at a constant speed along the cornice's top edge (the light is the shared Ring's TravelLight, parametrised by its
 *  screen length along the near arc, left to right) */
export const LIGHT = { in: 183, out: 200 };
const ARC_N = 36;
const arcScreen = (cam: Cam): P2[] => {
  const P = towerPersp(cam);
  const h = TOWER.cornice.band.h1;
  const out = TOWER.cornice.band.out;
  return Array.from({ length: ARC_N + 1 }, (_, i) => {
    const phi = Math.PI - (Math.PI * i) / ARC_N;
    const q = towerPt(phi, h, out);
    const p = P.p(q[0], q[1], q[2]);
    return [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k] as P2;
  });
};
/** the fraction of the arc's screen length at which it crosses screen x = sx (under the camera of frame f) */
const arcTAtX = (f: number, sx: number) => {
  const pts = arcScreen(camTrack(f));
  let L = 0;
  const Ls = [0];
  for (let i = 1; i < pts.length; i++) Ls.push((L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])));
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][0] >= sx) {
      const u = (sx - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] || 1);
      return (Ls[i - 1] + u * (Ls[i] - Ls[i - 1])) / L;
    }
  }
  return 1;
};
const T_IN = arcTAtX(LIGHT.in, 0);
const T_OUT = arcTAtX(LIGHT.out, 1080);
export const corniceLightAt = (f: number) => c01(T_IN + ((T_OUT - T_IN) * (f - LIGHT.in)) / (LIGHT.out - LIGHT.in));
/** the light's head on screen at frame f (x), for the plate's cue */
export const lightHeadX = (f: number) => {
  const t = corniceLightAt(f);
  const pts = arcScreen(camTrack(f));
  let L = 0;
  const Ls = [0];
  for (let i = 1; i < pts.length; i++) Ls.push((L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])));
  const upto = t * L;
  for (let i = 1; i < pts.length; i++) if (Ls[i] >= upto) return pts[i - 1][0] + ((upto - Ls[i - 1]) / (Ls[i] - Ls[i - 1] || 1)) * (pts[i][0] - pts[i - 1][0]);
  return pts[pts.length - 1][0];
};
// ---- the plates (cream type on a soft dark plate, as the tower's SoftPlate, in world space on the tower's face) --------
/** a plate on the face: u = metres across from the front centre (+ = screen right), h = its centre's height (m), out =
 *  metres outside the shaft's surface (the cornice band's face: 0.8), capM = the cap height (m), lines of type */
export type PlateSpec = { u: number; h: number; out: number; capM: number; lines: string[]; padM: number; track: number };
/** STUPIDEST POSSIBLE: left of the human's niche at his chest height, two lines (one line would not fit between the
 *  keep-in edge and the arch at a ~40 px cap); slides up on "stupidest" */
export const STUPID_PLATE: PlateSpec = { u: -2.5, h: TOWER.cornY + 1.22, out: 0, capM: 0.305, lines: ["STUPIDEST", "POSSIBLE"], padM: 0.1, track: 0.02 };
/** CIVILIZATION: on the cornice band's face right of the human, below the light line (cap ~39 px in the end frame) */
export const CIV_PLATE: PlateSpec = { u: 2.06, h: 4.07, out: TOWER.cornice.band.out, capM: 0.3, lines: ["CIVILIZATION"], padM: 0.17, track: 0.05 };
/** Barlow Condensed 600 cap advances (em), for the plate's width */
const ADV: Record<string, number> = { A: 0.5, B: 0.51, C: 0.48, D: 0.52, E: 0.43, I: 0.23, L: 0.41, N: 0.54, O: 0.53, P: 0.49, S: 0.46, T: 0.42, U: 0.52, V: 0.49, Z: 0.43, " ": 0.2 };
const textW = (s: string, fs: number, track: number) => [...s].reduce((a, ch) => a + (ADV[ch] ?? 0.5) * fs, 0) + track * fs * (s.length - 1);
/** the plate's world centre and its size (world units) under a perspective; t = the entrance (slide-up) */
const plateGeom = (P: ReturnType<typeof towerPersp>, s: PlateSpec, t: number) => {
  const ease = 1 - Math.pow(1 - c01(t), 3);
  const q = towerPt(Math.PI / 2 - s.u / (Rm(s.h) + s.out), s.h, s.out);
  const Z = q[2] - 6;
  const r = P.r(Z);
  const c = P.p(q[0], q[1] + m(0.35) * (1 - ease), Z);
  const fs = (m(s.capM) / 0.7) * r;
  const pad = m(s.padM) * r;
  const gap = fs * 0.3;
  const w = Math.max(...s.lines.map((l) => textW(l, fs, s.track))) + 2 * pad;
  const h = s.lines.length * 0.7 * fs + (s.lines.length - 1) * gap + 1.5 * pad;
  return { c, fs, pad, gap, w, h, ease };
};
/** the plate's screen rectangle at rest (for the checks and the light's cue) */
export const plateBox = (cam: Cam, s: PlateSpec) => {
  const g = plateGeom(towerPersp(cam), s, 1);
  const sx = (x: number) => 540 + (x - cam.cx) * cam.k;
  const sy = (y: number) => 960 + (y - cam.cy) * cam.k;
  return { x0: sx(g.c[0] - g.w / 2), x1: sx(g.c[0] + g.w / 2), y0: sy(g.c[1] - g.h / 2), y1: sy(g.c[1] + g.h / 2), cap: 0.7 * g.fs * cam.k };
};
const WorldPlate: React.FC<{ A: AirWorld; s: PlateSpec; t: number; uid: string }> = ({ A, s, t, uid }) => {
  if (t <= 0) return null;
  const g = plateGeom(A.P, s, t);
  const x0 = g.c[0] - g.w / 2;
  const y0 = g.c[1] - g.h / 2;
  const sh = AIR.A.shadow;
  return (
    <g opacity={g.ease}>
      <defs>
        <filter id={`${uid}f`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation={(g.h * 0.06).toFixed(2)} />
        </filter>
      </defs>
      <rect x={x0} y={y0} width={g.w} height={g.h} rx={0.7 * g.fs * 0.5} fill={sh} fillOpacity={0.5} filter={`url(#${uid}f)`} />
      <rect x={x0} y={y0} width={g.w} height={g.h} rx={0.7 * g.fs * 0.5} fill={mixHex(sh, "#3A3128", 0.5)} fillOpacity={0.55} />
      {s.lines.map((l, i) => (
        <text key={i} x={g.c[0]} y={y0 + 0.75 * g.pad + 0.7 * g.fs * (i + 1) + g.gap * i} textAnchor="middle" fontFamily={PLATE_FONT} fontWeight={600} fontSize={g.fs} letterSpacing={g.fs * s.track} fill={AIR.A.cream}>
          {l}
        </text>
      ))}
    </g>
  );
};
/** STUPIDEST POSSIBLE slides up just after "stupidest" (f107), landing by f119 */
export const stupidPlateAt = (f: number) => sst(108, 120, f);
/** CIVILIZATION slides up as the light's head reaches the plate's left edge (PLATE_CUE, found at module load) */
export const PLATE_CUE = (() => {
  for (let f = LIGHT.in; f <= LIGHT.out + 10; f += 0.25) if (lightHeadX(f) >= plateBox(camTrack(f), CIV_PLATE).x0) return f;
  return LIGHT.out;
})();
export const civPlateAt = (f: number) => sst(PLATE_CUE - 1, PLATE_CUE + 9, f);

// ---- the human: standing in his niche looking up a little; he glances further up the tower in the hold ---------------
export const HUMAN_GLANCE = { a: 201, b: 215 };
export const humanPoseAt = (frame: number): Covid.CovidPose => {
  const q = Covid.POSES.front();
  const up = sst(HUMAN_GLANCE.a, HUMAN_GLANCE.b, frame);
  return Covid.breathe({ ...q, pitch: (q.pitch ?? 0) - 8 - 16 * up, look: [0.05 + 0.03 * up, -0.65 - 0.33 * up] }, frame);
};

// ---- the chimp: W2's Chimp sitting in its niche, looking out (a slow turn of the head toward the open air) ------------
export const CHIMP_LOOK = { a: 148, b: 170 };
export const chimpPoseAt = (frame: number): ChimpPose => {
  const u = sst(CHIMP_LOOK.a, CHIMP_LOOK.b, frame);
  return CHIMP_POSES.sit(1, frame, { headYaw: 0.12 + 0.33 * u, look: [0.08 + 0.5 * u, -0.35 + 0.3 * u], pitch: -4 + 3 * u });
};
/** the chimp niche's soft cool-cream light (weaker and cooler than the human's warm niche) */
export const CHIMP_LIGHT = { core: "#F1ECDC", mid: "#D8D3BF", edge: "#A39F8C", a: 0.62 };
const ChimpNicheLight: React.FC<{ A: AirWorld }> = ({ A }) => {
  const n = nicheOf("chimp");
  const c = A.P.p(...nichePt(n, 0, n.h * 0.46, n.depth));
  const a = A.P.p(...nichePt(n, -n.w / 2, 0, n.depth));
  const b = A.P.p(...nichePt(n, n.w / 2, 0, n.depth));
  const wPx = Math.abs(b[0] - a[0]);
  const fl = A.P.p(...nichePt(n, 0, 0, n.depth * 0.45));
  const g = CHIMP_LIGHT.a;
  return (
    <g>
      <defs>
        <radialGradient id="spsChL" gradientUnits="userSpaceOnUse" cx={c[0].toFixed(2)} cy={c[1].toFixed(2)} r={(wPx * 0.78).toFixed(2)} gradientTransform={`translate(${c[0].toFixed(2)} ${c[1].toFixed(2)}) scale(1 1.35) translate(${(-c[0]).toFixed(2)} ${(-c[1]).toFixed(2)})`}>
          <stop offset="0" stopColor={CHIMP_LIGHT.core} stopOpacity={0.9 * g} />
          <stop offset="0.5" stopColor={CHIMP_LIGHT.mid} stopOpacity={0.55 * g} />
          <stop offset="1" stopColor={CHIMP_LIGHT.edge} stopOpacity={0.12 * g} />
        </radialGradient>
        <radialGradient id="spsChF">
          <stop offset="0" stopColor={CHIMP_LIGHT.core} stopOpacity={0.4 * g} />
          <stop offset="1" stopColor={CHIMP_LIGHT.core} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={c[0] - wPx * 1.2} y={c[1] - wPx * 1.6} width={wPx * 2.4} height={wPx * 3.2} fill="url(#spsChL)" />
      <ellipse cx={fl[0]} cy={fl[1]} rx={wPx * 0.55} ry={wPx * 0.16} fill="url(#spsChF)" />
    </g>
  );
};
const chimpInNiche: OccupantFn = ({ A, anchor, at, scale, frame }) => (
  <g>
    <ChimpNicheLight A={A} />
    <Chimp variant={0} pose={chimpPoseAt(frame)} at={at} scale={scale} uid="spsChimp" fog={A.folkFog(anchor.Z)} unitPx={A.cam.k} />
  </g>
);

const StupidestPossibleSpecies: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = towerAirOf({ cam, rest: REST, frame });
  const show = {
    dashed: 0,
    capitalPlate: capitalPlateAt(frame),
    corniceLight: corniceLightAt(frame),
    civPlate: 0,
  };
  return (
    <AirStage v={moteView(A.v)} bloom={0.22}>
      <WorldSvg cam={cam}>
        <TowerScene A={A} frame={frame} show={show} human={{ pose: humanPoseAt(frame) }} occupants={{ chimp: chimpInNiche }} uid="sps" />
        <WorldPlate A={A} s={STUPID_PLATE} t={stupidPlateAt(frame)} uid="spsStupid" />
        <WorldPlate A={A} s={CIV_PLATE} t={civPlateAt(frame)} uid="spsCiv" />
      </WorldSvg>
    </AirStage>
  );
};

export default StupidestPossibleSpecies;
