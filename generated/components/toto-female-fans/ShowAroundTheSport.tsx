// ---------------------------------------------------------------------------
// ShowAroundTheSport (toto-female-fans, cut 34). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 60 frames. World: paddockWorld.tsx (THE ONE SHOW of cut 10, its F1 card car), on
// trackWorld's circuit.
//
// CHECK LINE: "The race is the core; the reality show is built around it and fits it."
//
// THE LINE: "...this is why the | reality show around fits well. | This without that..."
// WORD -> FRAME: reality 4 · show 11 · around 20 · fits 28 · well 43 (ends ~48) · This 50.
// DURATION: the slot 34.360 -> 36.760 s = 2.40 s x 25 = 60 frames (f0..f59).
//
// THE MOTION (revision 1: "you can see [cut 10] in the background, adjust accordingly"). f0: close on the race from a
// crane over the track, trucking with three cream card F1 cars on three lanes (as approved: livery stripe, halo, wings,
// helmets; the rival draws alongside the lead). On "around" (f16-f46) one eased move: the crane comes down and pulls back
// (k 0.338 -> 0.28 on the track, eye 22 m -> 12 m) while the truck eases to a slow creep, so the show settles round the
// race: behind the low pit wall, cut 10's ONE scene (the motorhome wall with its flip calendar turning JUN -> JUL, the
// two bosses arguing, their camera op with the amber tally, the summer tree); in front, TWO TV crews over the shoulder
// at the near verge (a nearer layer), panning to follow the cars. The camera no longer keeps pace, so the race runs
// through the frame: the leading three pull away to the right and the next two cars come through the centre band by
// "fits well" (f28-f48). Alive to f59: cars racing through, crews panning, the bosses arguing, a slow creep.
// AMBER = F1's fans, the audience: only the TV cameras' tally lights glow; cream = the race (the subject).
//
// SOURCES: none (no figures, no logos; the only text is the month on cut 10's calendar).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { OnLane, TrackStage, laneGroundY, laneK, truck, type TrackCam } from "../toto-champion-eight/trackWorld";
import { M } from "../toto-champion-eight/champShared";
import { BackOp, CAST, CLOTH, F1Card, OneShowScene, bossAt, pageTheta, type BossKey, type FigSpec } from "./paddockWorld";

export const FPS = 25;
export const DURATION = 60;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ss5 = (a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};

// --- the layout (depth from the track's subject lane, + = farther) --------------------------------------------------------
const Z = {
  /** cut 10's scene: its people lane (the wall 1.2 m behind, the tree 0.6 m) */
  show: 8.0 * M,
  /** the low pit wall behind the far kerb (the paddock floor runs from the motorhome to it) */
  pitWall: 6.0 * M,
  /** the low wall on the near verge (the crews stand in front of it, on their own nearer layer) */
  wall: -4.7 * M,
  /** the cars: three lanes 2.4 m apart (at the resolved camera a car's height: they never overlap) */
  lead: -1.4 * M,
  rival: 1.0 * M,
  third: 3.4 * M,
} as const;

// --- the race: constant speed; the rival draws alongside the lead; the third trails; two more cars follow --------------------
const VC = 120;
const leadX = (f: number) => VC * (f - 30);
const rivalX = (f: number) => leadX(f) - lerp(1.9, -0.5, ss5(4, 56, f)) * M + 0.12 * M * Math.sin(f / 7);
const thirdX = (f: number) => leadX(f) - 2.6 * M + 0.35 * M * Math.sin(f / 11 + 1);
const f4X = (f: number) => leadX(f) - 9.0 * M + 0.2 * M * Math.sin(f / 9 + 2);
const f5X = (f: number) => leadX(f) - 11.0 * M + 0.25 * M * Math.sin(f / 8 + 4);

// --- the camera: trucking with the battle; on "around" one eased crane down + pull-back, the truck easing to a creep -------
const D = 24 * M;
const K = [0.338, 0.28] as const;
const EYE = [22 * M, 12 * M] as const;
/** the middle lane's ground line on screen (after the clip's 190 px shift) */
const YC = [760, 930] as const;
const MOVE = [16, 46] as const;
const CREEP = 0.15;
const vCam = (f: number) => VC * (1 - (1 - CREEP) * ss5(MOVE[0], MOVE[1], f));
const X0 = leadX(0) - 0.3 * M;
export const camX = (f: number) => X0 + truck(f, vCam);
const logLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
export const camAt = (f: number): TrackCam => {
  const p = ss5(MOVE[0], MOVE[1], f);
  const k = logLerp(K[0], K[1], p) * (1 + 0.018 * smoothstep((f - 44) / 15));
  const eye = lerp(EYE[0], EYE[1], p);
  const kc = (k * D) / (D + Z.rival);
  const yc = lerp(YC[0], YC[1], p);
  return { x: camX(f), k, D, eye, groundY: yc + eye * (k - kc) };
};
/** cut 10's scene sits where the camera comes to rest (centred around "fits well") */
const SHOW_X = camX(54);

// --- the show: the calendar turns JUN -> JUL; summer; the bosses keep arguing -------------------------------------------
const turnsAt = (f: number) => [clamp01((f - 22) / 13)];
const calAt = (f: number) => 5.6 + smoothstep(pageTheta(turnsAt(f)[0]) / 180);
const KEYS_A: BossKey[] = [
  { f: 0, pose: "jab", face: 1 },
  { f: 34, pose: "fold", face: 1, dur: 9 },
];
const KEYS_B: BossKey[] = [
  { f: 0, pose: "fold", face: -1 },
  { f: 35, pose: "jabHigh", face: -1, dur: 9 },
];
const NO_SNOW = { roof: 0, tree: 0, people: 0, ground: 0, cal: 0 };

// --- the two over-the-shoulder crews: a nearer layer of their own, static on the ground, panning to follow the cars --------
const FG_K = [0.76, 0.68] as const;
const FG_Y = [2650, 1750] as const;
/** their ground x: at rest they stand left and right of the frame's middle */
const CREWS: { x: number; spec: FigSpec; scale: number }[] = [
  { x: camX(59) + (250 - 540) / FG_K[1], spec: CAST.camA, scale: 1.0 },
  { x: camX(59) + (860 - 540) / FG_K[1], spec: { ...CAST.camB, hairStyle: "crop", top: CLOTH.sage }, scale: 0.96 },
];

const ShowAroundTheSport: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const p = ss5(MOVE[0], MOVE[1], f);
  const v = vCam(f);
  const kW = laneK(cam, Z.wall);
  const kF = lerp(FG_K[0], FG_K[1], p);
  const yF = lerp(FG_Y[0], FG_Y[1], p);
  // the cars, far lane first (a nearer car always covers a farther one)
  const cars = [
    { z: Z.third, x: thirdX(f), tone: mixHex(COLOR.cream, COLOR.board, 0.22), accent: "#949A6A", helmet: "#9A6878", seed: 2 },
    { z: Z.third, x: f5X(f), tone: mixHex(COLOR.cream, COLOR.board, 0.18), accent: "#9A6878", helmet: "#737D8A", seed: 4 },
    { z: Z.rival, x: rivalX(f), tone: mixHex(COLOR.cream, COLOR.board, 0.12), accent: "#737D8A", helmet: "#C47B5A", seed: 1 },
    { z: Z.lead, x: f4X(f), tone: mixHex(COLOR.cream, COLOR.board, 0.08), accent: "#B65A41", helmet: "#949A6A", seed: 3 },
    { z: Z.lead, x: leadX(f), tone: COLOR.cream, accent: "#C47B5A", helmet: "#737D8A", seed: 0 },
  ];
  // the spokes turn a steady 21 deg a frame (forward under the 72 deg spoke symmetry: no wagon-wheel reversal)
  const spin = (seed: number) => (f * 21 + seed * 40) % 360;
  // each crew pans toward the nearest car on screen (smoothly: a weighted aim, never a jump)
  const raceAim = (sx: number) => {
    let wsum = 0;
    let acc = 0;
    for (const c of cars) {
      const cx = 540 + (c.x + 0.4 * M - cam.x) * laneK(cam, c.z);
      const w = Math.exp(-Math.pow((cx - sx) / 520, 2));
      wsum += w;
      acc += w * cx;
    }
    return wsum > 1e-4 ? acc / wsum : sx;
  };
  const wall = mixHex(COLOR.board, COLOR.cream, 0.5);
  const yWallBase = laneGroundY(cam, Z.wall);
  const kP = laneK(cam, Z.pitWall);
  const crewBlur = Math.min(8, 0.07 * v * kF);
  return (
    <TrackStage S={f} cam={cam} v={v}>
      {/* behind the pit wall: cut 10's one scene */}
      <OneShowScene
        cam={cam}
        z={Z.show}
        x0={SHOW_X}
        S={f + 60}
        s={calAt(f)}
        sAt={calAt}
        first={5}
        turns={turnsAt(f)}
        snow={NO_SNOW}
        bossA={bossAt(KEYS_A, f, 5)}
        bossB={bossAt(KEYS_B, f, 6)}
        opAim={-2 + 1.2 * Math.sin(f * 0.06)}
        floorTo={Z.pitWall}
        wallHalf={9000}
      />
      {/* the pit wall: a low cream wall along the far side of the track */}
      <OnLane cam={cam} z={Z.pitWall}>
        <rect x={cam.x - 1400 / kP} y={-0.95 * M} width={2800 / kP} height={0.95 * M} fill={mixHex(COLOR.cream, COLOR.board, 0.3)} />
        <rect x={cam.x - 1400 / kP} y={-0.95 * M} width={2800 / kP} height={0.08 * M} fill={mixHex(COLOR.cream, "#FFF4E2", 0.4)} />
        <rect x={cam.x - 1400 / kP} y={-0.1 * M} width={2800 / kP} height={0.1 * M} fill={mixHex(COLOR.board, COLOR.shadow, 0.2)} />
      </OnLane>
      {cars.map((c, i) => (
        <OnLane key={i} cam={cam} z={c.z}>
          <F1Card x={c.x} y={0} tone={c.tone} accent={c.accent} helmet={c.helmet} spin={spin(c.seed)} bob={1.4 * Math.sin(f * (2.1 + 0.2 * c.seed) + c.seed)} />
        </OnLane>
      ))}
      {/* the near verge: a low cream wall, and the two crews in front of it filming the race */}
      <OnLane cam={cam} z={Z.wall}>
        <rect x={cam.x - 1300 / kW} y={-0.7 * M} width={2600 / kW} height={0.7 * M} fill={wall} />
        <rect x={cam.x - 1300 / kW} y={-0.7 * M} width={2600 / kW} height={0.07 * M} fill={mixHex(wall, "#FFF4E2", 0.45)} />
        <rect x={cam.x - 1300 / kW} y={-0.08 * M} width={2600 / kW} height={0.08 * M} fill={mixHex(wall, COLOR.shadow, 0.2)} />
      </OnLane>
      <defs>
        <linearGradient id="satsPen" gradientUnits="userSpaceOnUse" x1="0" y1={yWallBase.toFixed(3)} x2="0" y2="1920">
          <stop offset="0" stopColor={mixHex("#CFC4B2", "#E9DCC2", 0.3)} />
          <stop offset="1" stopColor="#B9AC98" />
        </linearGradient>
        <filter id="satsFg" filterUnits="userSpaceOnUse" x={-600} y={-200} width={2280} height={2600} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${crewBlur.toFixed(3)} 0`} />
        </filter>
      </defs>
      <rect x={-300} y={yWallBase.toFixed(3)} width={1680} height={Math.max(0, 2000 - yWallBase).toFixed(3)} fill={`url(#satsPen)`} />
      <g filter={crewBlur > 0.3 ? "url(#satsFg)" : undefined}>
        <g transform={`matrix(${kF.toFixed(6)} 0 0 ${kF.toFixed(6)} ${(540 - cam.x * kF).toFixed(4)} ${yF.toFixed(4)})`}>
          {CREWS.map((c, n) => {
            const sx = 540 + (c.x - cam.x) * kF;
            const pan = (Math.atan2(raceAim(sx) - sx, 520) * 180) / Math.PI;
            return <BackOp key={n} x={c.x} y={0} spec={c.spec} k={kF} pan={Math.max(-62, Math.min(62, pan))} scale={c.scale} S={f} seed={n + 3} />;
          })}
        </g>
      </g>
    </TrackStage>
  );
};

export default ShowAroundTheSport;
