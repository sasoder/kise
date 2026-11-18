// ---------------------------------------------------------------------------
// TwelveMonthShow (toto-female-fans, cut 10). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 140 frames. World: paddockWorld.tsx (the season street, on trackWorld's circuit and camera).
//
// CHECK LINE: "F1's off-track drama runs all year round, and the cameras film every bit of it."
//
// THE LINE: "...younger drivers. The | politics outside of the sport. You know, that is basically a 12-month live
// reality show. | But..."
// WORD -> FRAME: politics 2 · outside 12 · of 23 · the 34 · sport 36 · You 51 · know 54 · that 58 · is 61 ·
// basically 65 · a 73 · 12 78 · month 84 · live 92 · reality 109 · show 120 (ends ~130) · But 137.
// DURATION: the slot 10.400 -> 16.000 s = 5.60 s x 25 = 140 frames (f0..f139).
//
// THE MOTION (round 2: no pull-out to a wide). f0 ("politics outside of the sport"): close on JANUARY (its pennant
// overhead, snow on the roof): two team bosses in headsets nose to nose, centred and unblocked (~450 px tall), the left one
// jabbing a finger and shouting, the right one leaning back with arms folded; a camera op and a boom op film them from the
// left, a camera op from the right (amber tallies), a walking crew passes in the foreground. A slow creep. From f22 the
// camera eases into one constant truck to the right (full speed by f46) while settling from the close (k 0.63) to the
// street scale (k 0.50, figures ~360 px), and the YEAR PASSES at a readable size, ~8.5 frames a month: each month one
// unit front, one big pennant (cap ~44 px), one drama in one pose, one crew filming it; walking TV crews in the
// foreground (nearer, larger, cut by the bottom) slide past faster (parallax). FEB contract signing, MAR press
// conference, APR "no comment", MAY boss on the phone, JUN driver storming out of the garage, JUL handshake with
// crossed fingers, AUG protest letter, SEP whisper, OCT sulking driver, NOV driver leaving with a box, DEC a boss on the
// phone in the snow beside a snowman. The truck eases out f104-f130 with DECEMBER centred, still filmed, and next
// JANUARY's pennant and crew entering at the right edge: the year starts over. Settled and alive to f139 (snow falls,
// gestures, a slow creep on).
// AMBER = F1's fans, the audience: only the TV cameras' tally lights glow; cream = the subject, board = context.
//
// SOURCES: none (no figures, no logos; team-neutral units).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { OnLane, TrackStage, laneK, truck, type TrackCam } from "../toto-champion-eight/trackWorld";
import { M } from "../toto-champion-eight/champShared";
import {
  BoomOp,
  CAST,
  CameraOp,
  MW,
  MonthStreet,
  MonthUnit,
  PADDOCK,
  PaddockFence,
  PaddockFloor,
  SeasonBunting,
  SeasonSnow,
  dramaX,
  mi,
  paddockCam,
  type FigSpec,
} from "./paddockWorld";

export const FPS = 25;
export const DURATION = 140;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ss = (a: number, b: number, f: number) => smoothstep((f - a) / (b - a));
const ss5 = (a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};

// --- the camera: one truck along the street (ease in, constant, ease out), the close settling to the street scale --------
const STREET = PADDOCK.street;
const HOMES = PADDOCK.street + 0.9 * M;
const KS = [0.63, 0.5] as const;
const ZOOM = [20, 54] as const;
const DS = 8 * M;
const EYE = 1.6 * M;
/** the street's ground line on screen (the feet), after the clip's 190 px shift */
const GY = 1070;
const X0 = dramaX(0);
/** the end: December's drama a touch left of centre (its snowman and boss centred), next January entering at the right */
const X1 = dramaX(11) - 70;
const T_END = 130;
const prof = (f: number) => 0.015 + 0.985 * ss(22, 46, f) - 0.965 * ss(104, T_END, f);
const V = (X1 - X0) / truck(T_END, prof);
export const camX = (f: number) => X0 + V * truck(f, prof);
const zoomP = (f: number) => ss5(ZOOM[0], ZOOM[1], f);
const ksAt = (f: number) => Math.exp(lerp(Math.log(KS[0]), Math.log(KS[1]), zoomP(f))) * (1 + 0.012 * ss(0, 22, f)) * (1 + 0.02 * ss(124, 139, f));
export const camAt = (f: number): TrackCam => paddockCam({ x: camX(f), ks: ksAt(f), Ds: DS, eye: EYE, gy: GY });

// --- the walking crews in the foreground: a nearer layer (k x 1.32 of the street, feet low in the frame, cut by the bottom),
// walking right along the street, slower than the camera trucks, so they slide past faster than the street (parallax) -----
const FG_K = 1.32;
const FG_GAP = 1500;
const FG_WALK = 20;
const FG0 = -600;
/** January's right-hand camera op at the opening: nearer (the foreground lane), bottom right, filming the bosses */
const FG_RIGHT_X = dramaX(0) + 330 / (KS[0] * FG_K);
const fgK = (f: number) => ksAt(f) * FG_K;
const fgGround = (f: number) => lerp(1690, 1585, zoomP(f));
const FG_SPECS: FigSpec[] = [CAST.camB, CAST.camA, CAST.camC];
const STEP = 354;

const FgCrew: React.FC<{ j: number; f: number }> = ({ j, f }) => {
  const x = FG0 + j * FG_GAP + FG_WALK * f;
  const ph = (x / STEP) * Math.PI * 2;
  const k = fgK(f);
  const spec = FG_SPECS[((j % 3) + 3) % 3];
  const withBoom = ((j % 2) + 2) % 2 === 0;
  return (
    <g>
      {withBoom ? (
        <BoomOp x={x - 260} over={x + 380} face={1} k={k} S={f} spec={{ ...CAST.boom, top: CAST.boom.top }} seed={j * 3 + 1} walk={ph + 1.9} stride={0.75} ang={-3} />
      ) : null}
      <CameraOp x={x} y={0} spec={spec} face={1} k={k} walk={ph} stride={0.75} aim={-10 + 1.5 * Math.sin(f * 0.07 + j)} camSize={0.9} />
    </g>
  );
};

const TwelveMonthShow: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const vCam = camX(S + 0.5) - camX(S - 0.5);
  const kS = laneK(cam, STREET);
  const kH = laneK(cam, HOMES);
  const half = (540 + 520) / kS;
  const m0 = Math.floor((cam.x - half) / MW) - 1;
  const m1 = Math.ceil((cam.x + half) / MW) + 1;
  const months = Array.from({ length: m1 - m0 + 1 }, (_, i) => m0 + i);
  // the foreground layer's own transform (a nearer lane: x parallax at k, its ground low in the frame)
  const kF = fgK(S);
  const gF = fgGround(S);
  const fgScreenV = (FG_WALK - vCam) * kF;
  const blurF = Math.min(14, 0.11 * Math.abs(fgScreenV));
  const jA = Math.floor((cam.x - 900 / kF - FG0 - FG_WALK * S) / FG_GAP) - 1;
  const jB = Math.ceil((cam.x + 900 / kF - FG0 - FG_WALK * S) / FG_GAP) + 1;
  const fg: React.ReactNode[] = [];
  for (let j = Math.max(1, jA); j <= jB; j++) fg.push(<FgCrew key={j} j={j} f={S} />);
  const rightOnScreen = 540 + (FG_RIGHT_X - cam.x) * kF > -300;
  return (
    <TrackStage S={S} cam={cam} v={vCam}>
      <PaddockFloor cam={cam} from={PADDOCK.fence} />
      <OnLane cam={cam} z={PADDOCK.fence}>
        <PaddockFence x0={cam.x - 6000} x1={cam.x + 6000} />
      </OnLane>
      <OnLane cam={cam} z={HOMES}>
        {months.map((m) => (
          <MonthUnit key={m} m={m} />
        ))}
        {months.filter((m) => mi(m) === 11).map((m) => (
          <SeasonSnow key={`s${m}`} m={m} S={S} kz={kH} />
        ))}
      </OnLane>
      <OnLane cam={cam} z={HOMES - 0.1 * M}>
        <SeasonBunting m0={m0} m1={m1} S={S} fontW={136} />
      </OnLane>
      <OnLane cam={cam} z={STREET}>
        {months.map((m) => (
          <MonthStreet key={m} m={m} S={S} k={kS} />
        ))}
        {months.filter((m) => mi(m) === 11).map((m) => (
          <SeasonSnow key={`s${m}`} m={m} S={S + 9} kz={kS} />
        ))}
      </OnLane>
      <defs>
        <filter id="tmsFg" filterUnits="userSpaceOnUse" x={-600} y={-200} width={2280} height={2400} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${blurF.toFixed(3)} 0`} />
        </filter>
      </defs>
      <g filter={blurF > 0.3 ? "url(#tmsFg)" : undefined}>
        <g transform={`matrix(${kF.toFixed(6)} 0 0 ${kF.toFixed(6)} ${(540 - cam.x * kF).toFixed(4)} ${gF.toFixed(4)})`}>
          {rightOnScreen ? <CameraOp x={FG_RIGHT_X} y={0} spec={CAST.camA} face={-1} k={kF} aim={-13 + 1.5 * Math.sin(S * 0.06)} camSize={0.9} blink={0} /> : null}
          {fg}
        </g>
      </g>
    </TrackStage>
  );
};

export default TwelveMonthShow;
