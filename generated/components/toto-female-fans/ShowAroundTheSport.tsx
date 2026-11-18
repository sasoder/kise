// ---------------------------------------------------------------------------
// ShowAroundTheSport (toto-female-fans, cut 34). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 60 frames. World: paddockWorld.tsx (the season street of cut 10, on trackWorld's circuit).
//
// CHECK LINE: "The race is the core; the reality show is built around it and fits it."
//
// THE LINE: "...this is why the | reality show around fits well. | This without that..."
// WORD -> FRAME: reality 4 · show 11 · around 20 · fits 28 · well 43 (ends ~48) · This 50.
// DURATION: the slot 34.360 -> 36.760 s = 2.40 s x 25 = 60 frames (f0..f59).
//
// THE MOTION (round 2). f0: close on the race from a crane over the track: three cream card F1 cars (champShared's
// F1 proportions: halo hoop, front and rear wings, a coloured livery stripe and helmet each) on three lanes far enough
// apart that no car ever overlaps another, the camera trucking with them, asphalt and the far kerb streaming (the lead
// ~800 px long at y ~1000, the far kerb at the top of the race). The rival on the middle lane draws alongside the lead
// and edges ahead by the end; the third trails. On "around" (f18-f46) one eased move: the crane comes down and pulls
// back a little (k 0.338 -> 0.26 on the track, eye 22 m -> 10.5 m), so the show closes round the race like a frame:
// from the top the paddock street of cut 10 (its units, pennants with their months, dramas and tripod crews with amber
// tallies), from the bottom over-the-shoulder TV crews at a low wall (a nearer layer, cut by the bottom), each panning
// its camera, head and arms to follow the cars as they pass (never a card flip). By "fits well" (f28-f48) the race is
// the big central band (the lead ~615 px long), the paddock hugging it above, the crews below. Alive to f59: the cars
// racing, the paddock streaming past behind, the crews panning, a slow creep in.
// AMBER = F1's fans, the audience: only the TV cameras' tally lights glow; cream = the race (the subject).
//
// SOURCES: none (no figures, no logos; the only text is the months on the paddock's pennants, as in cut 10).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { OnLane, TrackStage, laneGroundY, laneK, type TrackCam } from "../toto-champion-eight/trackWorld";
import { M } from "../toto-champion-eight/champShared";
import { BackOp, CAST, CLOTH, F1Card, MW, MonthStreet, MonthUnit, PaddockFloor, SeasonBunting, hash, type FigSpec } from "./paddockWorld";

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
  /** the paddock street of cut 10, behind the far kerb; its units 1.2 m behind its dramas */
  street: 7.4 * M,
  homes: 8.6 * M,
  farKerb: 5.6 * M,
  /** the low wall on the near verge (the crews stand in front of it, on their own nearer layer) */
  wall: -4.7 * M,
  /** the cars: three lanes 2.4 m apart (at the resolved camera a car's height: they never overlap) */
  lead: -1.4 * M,
  rival: 1.0 * M,
  third: 3.4 * M,
} as const;

// --- the race: constant speed; the rival (middle lane) draws alongside the lead and edges ahead; the third trails ------------
const VC = 120;
const leadX = (f: number) => VC * (f - 30);
const rivalX = (f: number) => leadX(f) - lerp(1.9, -0.5, ss5(4, 56, f)) * M + 0.12 * M * Math.sin(f / 7);
const thirdX = (f: number) => leadX(f) - 2.6 * M + 0.35 * M * Math.sin(f / 11 + 1);

// --- the camera: trucking with the battle; on "around" one eased crane down + small pull-back -------------------------------
const D = 24 * M;
const K = [0.338, 0.26] as const;
const EYE = [22 * M, 12.5 * M] as const;
/** the middle lane's ground line on screen (after the clip's 190 px shift) */
const YC = [760, 790] as const;
const MOVE = [18, 46] as const;
const logLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
export const camAt = (f: number): TrackCam => {
  const p = ss5(MOVE[0], MOVE[1], f);
  const k = logLerp(K[0], K[1], p) * (1 + 0.018 * smoothstep((f - 44) / 15));
  const eye = lerp(EYE[0], EYE[1], p);
  const kc = (k * D) / (D + Z.rival);
  const yc = lerp(YC[0], YC[1], p);
  return { x: leadX(f) - 0.3 * M, k, D, eye, groundY: yc + eye * (k - kc) };
};

// --- the over-the-shoulder crews: a nearer layer of their own (feet below the frame's useful area), static on the ground,
// streaming past as the camera trucks with the race; each pans to follow the cars --------------------------------------------
const FG_K = [0.76, 0.68] as const;
const FG_Y = [2650, 1640] as const;
const CREW_GAP = 430;
const CREW_SPECS: FigSpec[] = [CAST.camA, CAST.camB, CAST.camC, { ...CAST.camB, hairStyle: "crop", top: CLOTH.sage }];

const ShowAroundTheSport: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const p = ss5(MOVE[0], MOVE[1], f);
  const v = VC;
  const kW = laneK(cam, Z.wall);
  const kSt = laneK(cam, Z.street);
  // the paddock: the months in view
  const half = (540 + 500) / kSt;
  const m0 = Math.floor((cam.x - half) / MW) - 1;
  const m1 = Math.ceil((cam.x + half) / MW) + 1;
  const months = Array.from({ length: m1 - m0 + 1 }, (_, i) => m0 + i);
  // the crews' layer
  const kF = lerp(FG_K[0], FG_K[1], p);
  const yF = lerp(FG_Y[0], FG_Y[1], p);
  const nA = Math.floor((cam.x - 800 / kF) / CREW_GAP) - 1;
  const nB = Math.ceil((cam.x + 800 / kF) / CREW_GAP) + 1;
  const raceX = leadX(f) + 0.6 * M;
  const crews: React.ReactNode[] = [];
  for (let n = nA; n <= nB; n++) {
    const x = n * CREW_GAP + 160 * (hash(n * 3.7) - 0.5);
    const sx = (x - cam.x) * kF;
    // pan toward the race (on screen it sits ~520 px up from the crew's camera)
    const pan = (Math.atan2((raceX - cam.x) * laneK(cam, Z.rival) - sx, 520) * 180) / Math.PI;
    const scale = 0.92 + 0.12 * hash(n * 5.1);
    crews.push(<BackOp key={n} x={x} y={0} spec={CREW_SPECS[((n % 4) + 4) % 4]} k={kF} pan={Math.max(-62, Math.min(62, pan))} scale={scale} S={f} seed={n} />);
  }
  const crewBlur = Math.min(8, 0.07 * VC * kF);
  // the spokes turn a steady 21 deg a frame (forward under the 72 deg spoke symmetry: no wagon-wheel reversal)
  const spin = (_x: number, seed: number) => (f * 21 + seed * 40) % 360;
  const wall = mixHex(COLOR.board, COLOR.cream, 0.5);
  const yWallBase = laneGroundY(cam, Z.wall);
  return (
    <TrackStage S={f} cam={cam} v={v}>
      {/* behind the track: the paddock street of cut 10 (its floor, units, bunting with the months, dramas, crews) */}
      <PaddockFloor cam={cam} from={Z.homes + 0.5 * M} to={Z.farKerb} />
      <OnLane cam={cam} z={Z.homes}>
        {months.map((m) => (
          <MonthUnit key={m} m={m} />
        ))}
      </OnLane>
      <OnLane cam={cam} z={Z.homes - 0.1 * M}>
        <SeasonBunting m0={m0} m1={m1} S={f + 40} fontW={190} />
      </OnLane>
      <OnLane cam={cam} z={Z.street}>
        {months.map((m) => (
          <MonthStreet key={m} m={m} S={f + 40} k={kSt} />
        ))}
      </OnLane>
      {/* the race: far lane first, so a nearer car always covers a farther one */}
      <OnLane cam={cam} z={Z.third}>
        <F1Card x={thirdX(f)} y={0} tone={mixHex(COLOR.cream, COLOR.board, 0.22)} accent="#949A6A" helmet="#9A6878" spin={spin(thirdX(f), 2)} bob={1.4 * Math.sin(f * 2.6 + 1)} />
      </OnLane>
      <OnLane cam={cam} z={Z.rival}>
        <F1Card x={rivalX(f)} y={0} tone={mixHex(COLOR.cream, COLOR.board, 0.12)} accent="#737D8A" helmet="#C47B5A" spin={spin(rivalX(f), 1)} bob={1.4 * Math.sin(f * 2.1)} />
      </OnLane>
      <OnLane cam={cam} z={Z.lead}>
        <F1Card x={leadX(f)} y={0} tone={COLOR.cream} accent="#C47B5A" helmet="#737D8A" spin={spin(leadX(f), 0)} bob={1.4 * Math.sin(f * 2.3 + 2)} />
      </OnLane>
      {/* the near verge: a low cream wall, and the crews in front of it filming the race */}
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
      {/* the media pen: the crews stand on a paved strip in front of the wall (no bare grass under the show) */}
      <rect x={-300} y={yWallBase.toFixed(3)} width={1680} height={Math.max(0, 2000 - yWallBase).toFixed(3)} fill={`url(#satsPen)`} />
      <g filter="url(#satsFg)">
        <g transform={`matrix(${kF.toFixed(6)} 0 0 ${kF.toFixed(6)} ${(540 - cam.x * kF).toFixed(4)} ${yF.toFixed(4)})`}>{crews}</g>
      </g>
    </TrackStage>
  );
};

export default ShowAroundTheSport;
