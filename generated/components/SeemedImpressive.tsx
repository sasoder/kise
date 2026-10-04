import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CREAM_BORDERS_D,
  DURATIONS,
  EMPIRE_REST_D,
  EMPIRE_T_POLYS,
  ENCLAVES,
  EmpireBorder,
  EmpireHatch,
  EmpireLayer,
  EnemyBorder,
  EnemyHatch,
  FPS as WORLD_FPS,
  G,
  INK_FULL,
  LABEL_FRAMES,
  MapLabel,
  MapStack,
  PaperTop,
  SEA,
  TENOCH,
  TlaxcalaClaims,
  WorldSvg,
  camFor,
  clamp01,
  makeTrack,
  pchip,
  smoothstep,
  swayCam,
  type Bump,
  type Cam,
  type P2,
} from "./tlaxShared";
import { A_END, LABEL, camAt as camAtA } from "./CarvedOutOfTheAztecs";

// ---------------------------------------------------------------------------
// SeemedImpressive: cut B of Si Sheppard on Dwarkesh,
// "Sheppard_Tlaxcalans_thought_they_used_Cortes", on THE TLAXCALA WORLD
// (tlaxShared.tsx). Clip clock G = 131 + f (CLIP_G0.B). f0 IS cut A's last
// frame (A_END, imported and asserted below; the join is 0 px).
// "the Aztec Empire, from a distance, if you look at a map, seemed impressive."
//
// TIMELINE. In-point 24.94 s = f0; f = round((t - 24.94) * 24) (SP/frames.txt):
//   the f0 · Aztec f2 · empire f11 · from a f21 · distance f34 · if you f47 ·
//   look f48 · at a f51 · map f56 · seemed f68 · impressive f72.
// DURATION: the last word ends 28.379 s: round((28.379 - 24.940) * 24) =
//   round(82.5) = 83, + the 16-frame house tail = 99 frames (f0..f98).
//
// DWARKESH MAP STYLE; PALETTE RULE: orange = the Aztecs' enemies only
// (Tlaxcala, its claim, its tie, its fortress); the empire is cream. The one
// label (TENOCHTITLAN, from cut A) leaves.
//
// THE GESTURES, each with its word and frames:
//   1. "the Aztec Empire from a distance ... if you look at a map" f0-58. One
//      long log-zoom pull-back about a fixed point near the fortress (the point
//      that holds its screen place between cut A's framing and the whole
//      empire), k 9.27 -> 2.60, fast out of the start and decelerating to land
//      on "map" (f56; its velocity ends f58), the empire's main body centred on
//      (540, 835), Gulf to Pacific in frame. It continues cut A's creep at f0
//      (the same velocity, decaying over 10 f). TENOCHTITLAN leaves early, the
//      reverse of its entrance (f4-18). The orange stays and is small now.
//   2. "seemed impressive" f61-90. A cream wave out of Tenochtitlan firms the
//      empire into one solid power, spreading like ink: behind a CRISP radial
//      front (feather ~9 screen px; out of rest at f61, its middle on the main
//      body's far border on "impressive" f80, all of the main body solid by f83;
//      from f84 it finishes off frame over Soconusco) a flat
//      cream wash rises under the hatch (0 -> 0.17), the hatch rises to the full
//      rung and the dashed border becomes a solid 3 px engraved line, together
//      (revised 2026-10-04 after the director's review: without the wash the
//      solid empire read as a pale lace at phone size; the crisp front replaced
//      a soft 60-world-px one that read as a glow).
//   3. f56-98 the creep: ~2 % in on the solid empire about its centre
//      (k 2.60 -> 2.65 by f98, still moving: cut C continues it). Nothing else.
//
// SOURCES (and SP/FACTS.md): the empire of the georeferenced Commons "Aztec
// Empire 1519 map-fr.svg" (after Atlas del Mexico prehispanico, Arqueologia
// Mexicana 2000; scripts/cortes-geo.json), smoothed and clipped to Natural
// Earth 10m land (scripts/build-tlax-map.mjs). The wave is a map gesture.
// ---------------------------------------------------------------------------

export const DURATION = DURATIONS.B; // 99
export const FPS = WORLD_FPS;
export const LAST = DURATION - 1;

export const schema = z.object({
  vignette: z.number(),
  label: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, label: "TENOCHTITLAN" });

export const T = {
  labelOut: 4, // the exit starts (the reverse entrance, LABEL_FRAMES long)
  pull: [2, 58] as [number, number],
  wave: [60, 90] as [number, number],
  ink: [61, 84] as [number, number], // the crisp front's span (see waveFront)
  waveFarMain: 80, // the front's middle reaches the main body's far border
  creep: [50, 200] as [number, number],
};

// -- the camera ----------------------------------------------------------------------
// the main body's area centroid (holes out), the subject of the wide
const mainPoly = EMPIRE_T_POLYS.reduce((a, p) => (Math.abs(area(p[0])) > Math.abs(area(a[0])) ? p : a));
function area(r: P2[]) {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}
export const EMPIRE_MAIN_CENTROID: P2 = (() => {
  let sx = 0;
  let sy = 0;
  let sa = 0;
  mainPoly.forEach((r, ri) => {
    let cx = 0;
    let cy = 0;
    let A = 0;
    for (let i = 0; i < r.length; i++) {
      const a = r[i];
      const b = r[(i + 1) % r.length];
      const c = a[0] * b[1] - b[0] * a[1];
      A += c;
      cx += (a[0] + b[0]) * c;
      cy += (a[1] + b[1]) * c;
    }
    A /= 2;
    const s = ri === 0 ? 1 : -1;
    sx += (cx / (6 * A)) * Math.abs(A) * s;
    sy += (cy / (6 * A)) * Math.abs(A) * s;
    sa += Math.abs(A) * s;
  });
  return [sx / sa, sy / sa];
})();
export const K_WIDE = 2.6;
const CAM0: Cam = A_END.cam;
const CAM1: Cam = camFor(EMPIRE_MAIN_CENTROID, K_WIDE, 540, 835);
// the pull-back zooms about the point that holds its screen place between the two framings
const fixAxis = (c0: number, k0: number, c1: number, k1: number, mid: number) => {
  const F = (c0 * k0 - c1 * k1) / (k0 - k1);
  return { F, S: mid + (F - c0) * k0 };
};
const FX = fixAxis(CAM0.cx, CAM0.k, CAM1.cx, CAM1.k, 540);
const FY = fixAxis(CAM0.cy, CAM0.k, CAM1.cy, CAM1.k, 960);
/** the fixed point of the pull-back (world) and where it sits on screen */
export const PULL_FIX = { world: [FX.F, FY.F] as P2, screen: [FX.S, FY.S] as P2 };
// the pull-back's progress 0..1: two overlapping velocity bumps (a quick start, a long landing)
const PULL_BUMPS: Bump[] = [
  [T.pull[0], 38, 0.45, 0.8],
  [6, T.pull[1], 0.55, 1],
];
const PULL = makeTrack(PULL_BUMPS, 0, -80, 480);
// the creep: ~2 % in by f98 about the empire's centre, still moving at the cut
const CREEP_UNIT = makeTrack([[T.creep[0], T.creep[1], 1, 0.5]], 0, -80, 480);
const CREEP_LN = Math.log(1.02) / CREEP_UNIT(LAST);
// cut A's camera velocity at its last frame, carried into f0 and decaying over 10 f
const CARRY_N = 10;
const carry = (v: number) => makeTrack([[-CARRY_N, CARRY_N, v * CARRY_N, 1]], 0, -80, 480);
const CARRY = { lnk: carry(A_END.camVel.lnk), cx: carry(A_END.camVel.cx), cy: carry(A_END.camVel.cy) };
const LNK0 = Math.log(CAM0.k);
const LNK1 = Math.log(CAM1.k);
/** the authored camera at frame f (no sway) */
export const camAt = (f: number): Cam => {
  // the pull-back about the fixed point
  const kb = Math.exp(LNK0 + (LNK1 - LNK0) * PULL(f));
  const bx = FX.F - (FX.S - 540) / kb;
  const by = FY.F - (FY.S - 960) / kb;
  // the creep: an extra zoom about screen (540, 835)
  const c = Math.exp(CREEP_LN * CREEP_UNIT(f));
  const wy = by + (835 - 960) / kb; // the world point at screen (540, 835)
  const k = kb * c;
  return {
    k: k * Math.exp(CARRY.lnk(f)),
    cx: bx + CARRY.cx(f),
    cy: wy - (835 - 960) / k + CARRY.cy(f),
  };
};
export const camShown = (f: number): Cam => swayCam(camAt(f), G("B", f));

// -- the join with cut A: B f0 is A f131, position and velocity -----------------------
{
  const a = A_END.cam;
  const b = camAt(0);
  const e = Math.max(Math.abs(Math.log(a.k / b.k)), Math.abs(a.cx - b.cx), Math.abs(a.cy - b.cy));
  if (e > 1e-9) throw new Error(`cut B f0 camera differs from A_END by ${e}`);
  if (A_END.g !== G("B", 0)) throw new Error("cut B's clock does not start on cut A's last frame");
  const vb = { lnk: Math.log(camAt(0.5).k / camAt(-0.5).k), cx: camAt(0.5).cx - camAt(-0.5).cx, cy: camAt(0.5).cy - camAt(-0.5).cy };
  const va = { lnk: Math.log(camAtA(A_END.f + 0.5).k / camAtA(A_END.f - 0.5).k), cx: camAtA(A_END.f + 0.5).cx - camAtA(A_END.f - 0.5).cx, cy: camAtA(A_END.f + 0.5).cy - camAtA(A_END.f - 0.5).cy };
  const ev = Math.max(Math.abs(vb.lnk - va.lnk) * 100, Math.abs(vb.cx - va.cx), Math.abs(vb.cy - va.cy));
  if (ev > 2e-3) throw new Error(`cut B f0 camera velocity differs from cut A's by ${ev}`);
  if (A_END.penS <= 0 || A_END.sweep !== 1 || A_END.fortress !== 1) throw new Error("cut A must end complete");
}

// -- the wave ------------------------------------------------------------------------
const distMax = (polys: P2[][][]) => {
  let d = 0;
  for (const poly of polys) for (const r of poly) for (const p of r) d = Math.max(d, Math.hypot(p[0] - TENOCH[0], p[1] - TENOCH[1]));
  return d;
};
const D_MAIN = distMax([mainPoly]); // the main body's far border (~184 world px)
const D_ALL = distMax(EMPIRE_T_POLYS); // with Soconusco (~362)
export const WAVE_FW = 60; // world px: the soft front's width (~6 f at its speed)
// the front's middle (R - FW / 2) reaches the main body's far border on f80 (out of rest
// at f60); it runs on past Soconusco (at the frame's right edge) and rests by f90
const WAVE_R = pchip(
  [
    [T.wave[0], 0],
    [T.waveFarMain, D_MAIN + WAVE_FW / 2],
    [T.wave[1], D_ALL + WAVE_FW + 2],
  ],
  true,
);
const waveROld = (f: number) => (f <= T.wave[0] ? 0 : WAVE_R(Math.min(f, T.wave[1])));
// CHANGED 2026-10-04 (director's review: the soft 60-world-px front read as a glow round the
// capital): from f61 to f83 the solid state spreads behind a CRISP front, feather WAVE_FW_INK
// (3.4 world px, ~9 screen px at k 2.6), out of rest at f61, its middle on the main body's far
// border on f80, all of the main body solid by f83. From f84 the wave is the original one
// (already past everything in frame; it finishes off-frame over Soconusco), so f84-98 and the
// end state are unchanged.
export const WAVE_FW_INK = 3.4;
const INK_R = pchip(
  [
    [T.ink[0], 0],
    [T.waveFarMain, D_MAIN + WAVE_FW_INK / 2],
    [T.ink[1], D_MAIN + 26],
  ],
  true,
);
/** the front at frame f: radius R (mask 1 inside R - fw, 0 beyond R) and its feather fw */
export const waveFront = (f: number) =>
  f >= T.ink[0] && f < T.ink[1] ? { R: INK_R(f), fw: WAVE_FW_INK } : { R: waveROld(f), fw: WAVE_FW };
export const waveR = (f: number) => waveFront(f).R;
/** 0 before the wave, 1 once it has passed everything (then the plain solid layer) */
export const waveState = (f: number) => {
  const { R, fw } = waveFront(f);
  return R <= 0.01 ? 0 : R - fw > D_ALL + 1 ? 1 : 0.5;
};
if (INK_R(T.ink[1] - 1) - WAVE_FW_INK < D_MAIN + 1 || waveROld(T.ink[1]) - WAVE_FW < D_MAIN + 1)
  throw new Error("the main body must be solid before the wave hands over at f84");
const WAVE_STOPS = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];

/** the state cut C opens on */
export const B_END = {
  f: LAST,
  g: G("B", LAST),
  cam: camAt(LAST),
  camVel: (() => {
    const a = camAt(LAST - 0.5);
    const b = camAt(LAST + 0.5);
    return { lnk: Math.log(b.k / a.k), cx: b.cx - a.cx, cy: b.cy - a.cy };
  })(),
  solidity: waveState(LAST) === 1 ? 1 : 0,
  labelGone: true,
};
if (B_END.solidity !== 1) throw new Error("cut B must end with the empire solid");

const SeemedImpressive: React.FC<Props> = ({ vignette, label }) => {
  const frame = useCurrentFrame();
  const cam = camShown(frame);

  // TENOCHTITLAN leaves: cut A's entrance played backwards (MapLabel at the mirrored time)
  const tau = clamp01((frame - T.labelOut) / LABEL_FRAMES) * LABEL_FRAMES;
  const labelOn = tau < LABEL_FRAMES;

  // the wave
  const ws = waveState(frame);
  const { R, fw: FW } = waveFront(frame);
  const [ox, oy] = TENOCH;
  // m = 1 inside R - FW, 0 beyond R, a smoothstep between (each point eases as the front passes)
  const stops = (solid: boolean) =>
    WAVE_STOPS.map((t, i) => {
      const d = R - FW + FW * t;
      const m = 1 - smoothstep(t);
      const v = Math.round(255 * (solid ? m : 1 - m));
      return <stop key={`ws-${i}`} offset={Math.max(0, d / R)} stopColor={`rgb(${v},${v},${v})`} />;
    });
  const MASK = { x: -200, y: 600, w: 700, h: 600 };

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {ws === 0.5 ? (
          <defs>
            <radialGradient id="bWaveIn" gradientUnits="userSpaceOnUse" cx={ox} cy={oy} r={R}>
              {stops(true)}
            </radialGradient>
            <radialGradient id="bWaveOut" gradientUnits="userSpaceOnUse" cx={ox} cy={oy} r={R}>
              {stops(false)}
            </radialGradient>
            <mask id="bSolidIn" maskUnits="userSpaceOnUse" x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h}>
              <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="url(#bWaveIn)" />
            </mask>
            <mask id="bSolidOut" maskUnits="userSpaceOnUse" x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h}>
              <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="url(#bWaveOut)" />
            </mask>
          </defs>
        ) : null}
        {ws === 0.5 ? (
          <>
            <g mask="url(#bSolidOut)">
              <EmpireHatch d={EMPIRE_REST_D} cam={cam} solidity={0} />
            </g>
            <g mask="url(#bSolidIn)">
              <EmpireHatch d={EMPIRE_REST_D} cam={cam} solidity={1} />
            </g>
            <EnemyHatch d={ENCLAVES.tlaxcala.d} cam={cam} />
            <g mask="url(#bSolidOut)">
              <EmpireBorder d={CREAM_BORDERS_D} cam={cam} solidity={0} />
            </g>
            <g mask="url(#bSolidIn)">
              <EmpireBorder d={CREAM_BORDERS_D} cam={cam} solidity={1} />
            </g>
            <EnemyBorder d={ENCLAVES.tlaxcala.border} cam={cam} />
          </>
        ) : (
          <EmpireLayer cam={cam} solidity={ws} />
        )}
        <TlaxcalaClaims cam={cam} />
      </WorldSvg>
      {labelOn ? (
        <MapLabel
          text={label}
          x={TENOCH[0]}
          y={TENOCH[1]}
          cam={cam}
          frame={LABEL_FRAMES - tau}
          f0={0}
          size={LABEL.size}
          spacing={LABEL.spacing}
          anchor={LABEL.anchor}
          dx={LABEL.dx}
          dy={LABEL.dy}
          opacity={INK_FULL}
        />
      ) : null}
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default SeemedImpressive;
