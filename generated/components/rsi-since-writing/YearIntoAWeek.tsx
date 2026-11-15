// ---------------------------------------------------------------------------
// YearIntoAWeek (rsi-since-writing, cut 23). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 129 frames.
// One stage inside the misty teal air (AirStage, palette A) on a one-point pinhole crane mapped onto the kit's
// londonDepth perspective every frame, from the kit kits/dwarkesh-3d/dwarkesh3d; the calendar board and its compress
// motion are the clip's shared module sinceWritingCalendar.tsx (built with this cut; cut 9 reuses it).
//
// CHECK LINE: "Every single calendar week, an AI fits in a whole year of full-time work, weekends included."
//
// THE LINE: "and today's models can already cram in about one year of full-time work into every calendar week. Of"
// WORD -> FRAME: weekends -17 · and -3 · today's 3 · models 10 · can 17 · already 23 · cram 30 · in 41 · about 44 ·
// one 49 · year 57 · of 64 · full-time 73 · work 82 · into 89 · every 100 · calendar 109 · week. 120 · Of 126
// (Whisper; may run ~0.2-0.4 s early).
// DURATION: the slot 23.1898 -> 28.5702 s = 5.380 s x 23.976 = 129 frames (f0..f128).
//
// THE MOTION: a slate calendar board lies on the sand floor of the air: 52 week rows of 7 day cells (MON..SUN on its
// front face), a full-time human year on it (one cream WorkSheet = one workday on every weekday cell, 260 in all; the
// weekend cells empty), so the far rows read as a striped field running back into the haze; the Genius (v0, THE AI)
// stands on the floor beside the board's weekend side from f0, and HE does the cramming: from "can" (f18) he turns to
// the board; on "cram" he winds up toward the far weeks (f19-26) and makes ONE broad sweep down toward the front week
// (f26-33, straight out at ~f29.5: the first hops follow his hand at f30), then keeps the hand out over the stream,
// conducting in a slow small drift, and lowers it as the last sheets land (f104-113). On "cram" (f30)
// the year starts to move: a release wave runs from the front week back, accelerating, and every week's sheets slide
// forward along their columns, bunching up like a fanned deck as they near the front, then hop onto stacks on the
// FRONT week's cells, dealt so all seven stacks rise evenly (SAT and SUN too: the first row already throws two sheets
// into the weekend); row hops ~2.5 frames apart at first, a stream of ~0.75 frames at the end; the emptied weeks dim
// behind. Through it ONE crane (log distance and height on bell speed profiles, the board's front face pinned at
// y ~1062) cranes down and pushes in from a high three-quarter view down the board to a low view of the front week.
// The last sheet lands at f111 (7 stacks: 38 + 6 x 37), the plate "1 YEAR OF WORK" slides up over them from f106
// (settled f118, "calendar week"), and the camera creeps to the cut while the Genius stands looking at the stacks, breathing.
// Orange = the AIs only (COMMON.md): the Genius; the sheets are cream, the board slate, the floor sand.
// Cause before effect: a week's sheets start to slide on the frame its release reaches it; each sheet leaves its cell
// at rest and lands exactly on its stack's top (stackTop), the stack's count switching on that frame.
//
// DEPTH: fog by world depth (fogBy "depth"); the pinhole has F = 1000 px and no pitch; f0 the eye 2.5 m up (h 450) at
// 3.1 m (d 560) in front of the front plane; settled (~f118) 1.4 m up (h 250) at 2.4 m (d ~427). The board: 7 x 48
// across (X -174..174), 52 rows 64 deep (Z -46..3310), 20 thick. The Genius at X 320, Z 510 (beside week 8, off the
// board), ~304 px tall at f0, ~349 px settled (head top y >= 296 on every frame, the raised hand >= 296; feet y
// 606-666, above the stack tops); the plate
// (Caslon, ~57 px) at X -34 over the stacks, y ~604.
//
// SOURCES: a full-time year ~ 52 weeks x 5 days = 260 workdays (~2,000 hours) (COMMON.md); the speaker: "about one
// year of full-time work into every calendar week". On screen: MON..SUN, 1 YEAR OF WORK.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { GENIUS_POSES as G, Genius, lerpPose, type GeniusPose } from "../rsi-ten-earths/tenEarthsGenius";
import { geniusAnchorsLocal } from "../rsi-ten-earths/tenEarthsGeniusBody";
import { CalendarBoard, CalendarSheets, calGeom, compressAt, compressPlan } from "./sinceWritingCalendar";
import { Plate, plateT } from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 129;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
/** the medium's espresso low air (palette A, the low end of the ramp) */
const LOW_AIR = "#3D342B";

// ---- the calendar and its compress motion (p 0..1 over f30..f111) ----
export const BOARD = calGeom(52);
export const COMPRESS_F0 = 30;
export const COMPRESS_SPAN = 81;
export const PLAN = compressPlan({ g: BOARD, dst: [0, 1, 2, 3, 4, 5, 6], span: COMPRESS_SPAN });
export const pAt = (f: number) => c01((f - COMPRESS_F0) / COMPRESS_SPAN);

// ---- the camera: a pinhole (F, distance d to the front plane, eye height h, horizon hy, across cx) ----
export const F = 1000;
export type Cam3 = { d: number; h: number; hy: number; cx: number };
/** a bell-shaped progress 0..1 over f0..f1: the integral of t^a (1-t)^b, normalised */
const bell = (f0: number, f1: number, a: number, b: number) => {
  const N = 400;
  const cum = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) {
    const t = (i - 0.5) / N;
    cum[i] = cum[i - 1] + Math.pow(t, a) * Math.pow(1 - t, b);
  }
  const tot = cum[N];
  return (f: number) => {
    const t = c01((f - f0) / (f1 - f0)) * N;
    const i = Math.min(N - 1, Math.floor(t));
    return (cum[i] + (cum[i + 1] - cum[i]) * (t - i)) / tot;
  };
};
export const CAM = {
  d: [560, 420],
  h: [450, 248],
  /** the board's front face foot (Y 0, Z z0) is pinned at this screen row on every frame */
  face: 1062,
  pD: bell(-14, 150, 1.7, 2.3),
  pH: bell(-10, 146, 1.6, 2.4),
};
export const cam3At = (f: number): Cam3 => {
  const d = Math.exp(Math.log(CAM.d[0]) + (Math.log(CAM.d[1]) - Math.log(CAM.d[0])) * CAM.pD(f));
  const h = CAM.h[0] + (CAM.h[1] - CAM.h[0]) * CAM.pH(f);
  return { d, h, hy: CAM.face - (h * F) / (d + BOARD.z0), cx: 0 };
};
/** the pinhole as a londonDepth perspective (Dc = d, k = F / d, the horizon at hy) */
export const kitCam = (c: Cam3): { cam: Cam; depth: DepthOpts } => {
  const k = F / c.d;
  return { cam: { k, cx: c.cx, cy: (960 - c.hy) / k - c.h }, depth: { eyeY: -c.h, dRef: c.d, kRef: k, dolly: 1 } };
};
const REST = kitCam(cam3At(0)).cam;

/** the floor under the board sinks into the dense low air toward the bottom edge (screen rows, drawn in world px) */
const LowAir: React.FC<{ cam: Cam }> = ({ cam }) => {
  const y0 = cam.cy + (1075 - 960) / cam.k;
  const y1 = cam.cy + (1920 - 960) / cam.k;
  const x0 = cam.cx - 600 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id="yw-low" gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={y1.toFixed(2)}>
          <stop offset="0" stopColor={LOW_AIR} stopOpacity={0} />
          <stop offset="0.45" stopColor={LOW_AIR} stopOpacity={0.28} />
          <stop offset="1" stopColor={LOW_AIR} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={y0.toFixed(2)} width={(1200 / cam.k).toFixed(2)} height={(y1 - y0).toFixed(2)} fill="url(#yw-low)" />
    </g>
  );
};

// ---- the Genius: beside the board's weekend side, a little back; HE crams the year ----
export const GENIUS = { X: 320, Z: 510 };
const sst = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** his arm's keys (the near arm, armL: his right hand, reaching toward the board): [frame, angle about the shoulder
 *  (screen degrees, 90 = hanging, 180 = straight out toward the board, 225 = up toward the far weeks), reach (units;
 *  the arm is ~107 long)]. null = his own hanging arm. Between keys a smoothstep (he eases into and out of each). */
const ARM_KEYS: [number, number | null, number | null][] = [
  [19, null, null], // still hanging; the turn has begun at f18 ("can")
  [26, 216, 96], // the reach back and up toward the far weeks (the wind-up)
  [33, 136, 98], // "cram": ONE broad sweep down toward the front week (passing straight out ~f29.5; the hops start f30)
  [41, 162, 86], // the hand comes up a little and stays out over the stream: conducting
  [104, 162, 86],
  [113, null, null], // lowered as the last sheets land (f111)
];
const deg = Math.PI / 180;
/** his pose at a frame: three-quarter to the left, breathing (f0-18); turns his body and head to the board (f18-30);
 *  the wind-up and the sweep (f19-33); a slow small conducting drift of the raised hand while the stream runs
 *  (ramped in f40-52 and out f98-110, one sine, no loop seam); the hand lowered f104-113; he stands looking down at the
 *  stacks for the hold */
export const geniusPoseAt = (frame: number): GeniusPose => {
  const turn = sst(18, 30, frame);
  const base0 = lerpPose(G.stand(-1, frame), G.turnTo(-0.86, frame), turn) as GeniusPose;
  const look = 3 * turn + 5 * sst(27, 36, frame) + 2 * sst(106, 118, frame);
  const base: GeniusPose = { ...base0, headYaw: base0.headYaw - 0.1 * turn, pitch: base0.pitch + look };
  if (frame <= ARM_KEYS[0][0] || frame >= ARM_KEYS[ARM_KEYS.length - 1][0]) return base;
  // the near arm about its shoulder (the shoulder of the turned, breathing body at this frame)
  const S = geniusAnchorsLocal(0, base).shoulderL;
  const w0 = base.armL.w;
  const th0 = Math.atan2(w0[1] - S[1], w0[0] - S[0]) / deg;
  const R0 = Math.hypot(w0[0] - S[0], w0[1] - S[1]);
  let k = 0;
  while (k < ARM_KEYS.length - 2 && frame >= ARM_KEYS[k + 1][0]) k++;
  const [fa, ta, ra] = ARM_KEYS[k];
  const [fb, tb, rb] = ARM_KEYS[k + 1];
  const u = sst(fa, fb, frame);
  let th = (ta ?? th0) + ((tb ?? th0) - (ta ?? th0)) * u;
  let R = (ra ?? R0) + ((rb ?? R0) - (ra ?? R0)) * u;
  // conducting: a slow, small drift (period 44 frames) faded in and out, so it never jumps
  const cond = sst(40, 52, frame) * (1 - sst(98, 110, frame));
  th += 7 * Math.sin(((frame - 40) / 44) * 2 * Math.PI) * cond;
  R += 3 * Math.sin(((frame - 40) / 44) * 2 * Math.PI + 1.2) * cond;
  // how far the arm is from his own hanging arm (0 = his own)
  const on = sst(19, 24, frame) * (1 - sst(108, 113, frame));
  const w: [number, number] = [S[0] + R * Math.cos(th * deg), S[1] + R * Math.sin(th * deg)];
  const el = base.armL.elbow;
  return {
    ...base,
    armL: {
      w,
      elbow: [el[0] + (0.35 - el[0]) * on, el[1] + (1 - el[1]) * on],
      fist: base.armL.fist + (0.05 - base.armL.fist) * on,
      hand: base.armL.hand + (-14 * on - base.armL.hand) * on,
    },
    mouth: base.mouth,
  };
};
// ---- the plate over the stacks ----
export const PLATE = { X: -34, Y: BOARD.top - 92.5 - 50, Z: 0, size: 24, f0: 106 };

const YearIntoAWeek: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cam, depth } = kitCam(cam3At(frame));
  const A = airWorldOf({ cam, rest: REST, depth, frame, fogBy: "depth" });
  const p = pAt(frame);
  const st = compressAt(PLAN, p);
  const g = A.P.at(GENIUS.X, GENIUS.Z);
  const genius = (
    <g>
      <AirShadow A={A} X={GENIUS.X} Z={GENIUS.Z} w={62} d={30} uid="gsh" amt={0.8} />
      <Genius variant={0} pose={geniusPoseAt(frame)} at={g.at} scale={g.scale} uid="g0" frame={frame} fog={A.folkFog(GENIUS.Z)} unitPx={cam.k} />
    </g>
  );
  return (
    <AirStage v={A.v} bloom={0.22} shafts={0.8}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-3200} x1={3200} z0={-900} z1={7000} mat={MAT.ground} course={240} jointAmt={0.55} />
        <LowAir cam={cam} />
        <AirHorizonHazeW A={A} id="yw-haze" />
        <CalendarBoard A={A} g={BOARD} uid="cal" dim={st.rowDim} />
        <CalendarSheets A={A} plan={PLAN} p={p} uid="cs" extras={[{ Z: GENIUS.Z, node: genius }]} />
        <Plate A={A} X={PLATE.X} Y={PLATE.Y} Z={PLATE.Z} text="1 YEAR OF WORK" t={plateT(frame, PLATE.f0, 12)} uid="pl" size={PLATE.size} />
      </WorldSvg>
    </AirStage>
  );
};

export default YearIntoAWeek;
