// ---------------------------------------------------------------------------
// PotentialInTheKart (toto-champion-eight, cut 11). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 139 frames. Palette B1 (the stoutShared default). World: champShared.tsx.
//
// CHECK LINE: "In a kid sitting in a kart you can already see the F1 driver they could become": the little kart sits
// exactly where an F1 driver sits, and the F1 car around it lights up as the potential.
//
// THE LINE: "...you can judge pretty early on in | a kid's karting performance whether that kid has the potential to
// be a professional racing driver." (the cut returns to Toto at 17.16, "Even with the tiny ones...")
// WORD -> FRAME (from the composition start, words_cutA.md): a 1 · kid's 4 · karting 16 · performance 34 · whether 41 ·
// that 64 · kid 68 · has 71 · the 75 · potential 79 · to 88 · be 102 · a 105 · professional 108 · racing 118 ·
// driver 124 (ends 132) · Even 138.
// DURATION: the slot 11.600 -> 17.160 s = 5.56 s x 25 = 139 frames (f0..f138).
//
// THE MOTION: one kid in a cream kart drives in from the left along the lane and brakes to a damped stop centre-frame
// (f0-f32, the light pool following him; the hubs spin down with the distance rolled; he rocks forward on the stop and
// back, f16-f44). A living idle, the camera pulling back from the close kart (k 0.9) from f30. On "potential" (f80) an
// amber line drawing of a modern F1 car draws itself round him from the cockpit outward (nose forward, engine cover and
// rear wing back; f80-f106), the halo over his helmet, while the pull-back makes the whole car fit (k 0.43 by ~f100,
// then a slow creep in). On "professional" (f109-f122) the amber band fills the outline from the floor up; the one
// LightSweep crosses it on "driver" (f124-f135). Settled, living frame to the end.
// Cause before effect: the strands start at the cockpit (behind his helmet) and the halo's pillar first (f80); the fill
// rises from the floor line (f109). Contact: the kart's tyres touch the lane from f0 (contact shadows).
// AMBER = the talent / potential you can see in a kid: only the F1 outline and fill glow; the kid and kart stay cream card.
//
// SOURCES: none on screen (no text, no numbers, no logo). F1 proportions: 2022+ rules (5.6 m class length, 3.6 m
// wheelbase, 18-inch wheels ~0.72 m tyres, 0.95 m height), drawn from memory of the Mercedes W15/W16 side view.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor, clamp01, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack } from "../kits/cheeky-pint/museShared";
import { CAM_KART, F1Outline, KART, KartWithKid, M, TrackStrip } from "./champShared";

export const FPS = 25;
export const DURATION = 139;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- beats ---------------------------------------------------------------------------------------------
export const BEAT = {
  arriveEnd: 32, // the kart at rest (kid's karting f4-f16 .. performance f34)
  pullFrom: 30,
  drawFrom: 80, // potential f79
  drawTo: 106,
  fillFrom: 109, // professional f108
  fillTo: 122,
  sweepFrom: 124, // driver f124
  sweepTo: 135,
} as const;

// --- the kart's arrival: in at a cruise from just off-frame left, then a smooth brake to rest at x = 0 ----------------
// cruise f0-f12 at V, brake f12-f32 with the speed falling as (1 - t)^2 (zero deceleration at the stop): the kid's
// forward rock is that deceleration, read off the same curve.
const CRUISE_TO = 12;
const BRAKE_F = BEAT.arriveEnd - CRUISE_TO;
// --- the camera (look = the frame's middle): close on the kart, the pull-back, a slow creep in ----------------------
const K0 = CAM_KART.k;
const K_WIDE = 0.436;
const K_END = 0.49;
/** ground line on screen: 1050 at the close, ~1016 wide (the F1 ~1040 px at the end) */
const LOOK0 = { x: 128 - 300, y: -(1050 - 960) / K0, k: K0 };
const LOOK_Y_WIDE = -(1016 - 960) / 0.462;
export const CAM = makeClockCam(
  LOOK0,
  [
    { f0: -8, f1: 36, dx: 300 }, // follow the kart in
    { f0: BEAT.pullFrom, f1: 102, k: K_WIDE, dx: 32, dy: LOOK_Y_WIDE - LOOK0.y }, // the pull-back to the whole car
    { f0: 98, f1: 170, k: K_END }, // the creep in on the payoff (still moving at f138)
  ],
  DURATION,
);
// the light pool: on the arriving kart, then on the car
const POOL = makePoolTrack(
  { x: -420, y: -0.4 * M, strength: 1.5 },
  [
    { f0: -4, f1: 30, x: 0.32 * M, y: -0.4 * M },
    { f0: 76, f1: 112, x: 0.4 * M, y: -0.45 * M, strength: 1.7 },
  ],
  DURATION,
);

/** where the kart starts: its nose 10 px off the frame's left edge at f0 */
export const X_START = CAM.at(0).x + (-10 - 540) / K0 - KART.nose * M;
const V = -X_START / (CRUISE_TO + BRAKE_F / 3);
export const kartX = (f: number) => {
  if (f <= CRUISE_TO) return X_START + V * f;
  const t = clamp01((f - CRUISE_TO) / BRAKE_F);
  return X_START + V * CRUISE_TO + V * BRAKE_F * (1 - Math.pow(1 - t, 3)) / 3;
};
/** the brake's deceleration 0..1 (1 at the brake's first frame) */
const decel = (f: number) => (f < CRUISE_TO || f > BEAT.arriveEnd ? 0 : 1 - (f - CRUISE_TO) / BRAKE_F);

// --- life ------------------------------------------------------------------------------------------------
const bump = (f: number, a: number, b: number, c: number) => smoothstep((f - a) / (b - a)) * (1 - smoothstep((f - b) / (c - b)));
const idleIn = (f: number) => smoothstep((f - 28) / 16);
// the forward rock follows the deceleration (eased in over 4 f, so the lean never snaps), then one settle back into the seat
const rock = (f: number) => decel(f) * smoothstep((f - CRUISE_TO + 1) / 4);
export const kidLean = (f: number) => -5 * rock(f) + 1.4 * bump(f, 28, 35, 50) + 0.9 * Math.sin(((f - 30) / 58) * 2 * Math.PI) * idleIn(f);
export const kartBob = (f: number) => -2 * rock(f) + 2.2 * Math.sin(((f - 30) / 27) * 2 * Math.PI) * idleIn(f);
const blinkAt = (f: number) => {
  for (const b of [57, 116]) {
    const u = f - b;
    if (u >= 0 && u < 5) return [0.5, 1, 1, 0.6, 0.2][Math.floor(u)];
  }
  return 0;
};
// a smoothstep with a quarter of it linear, so the first strand shows on f80 itself (not 3 frames later)
export const drawAt = (f: number) => {
  const u = clamp01((f - BEAT.drawFrom + 1) / (BEAT.drawTo - BEAT.drawFrom + 1));
  return 0.25 * u + 0.75 * smoothstep(u);
};
export const fillAt = (f: number) => clamp01((f - BEAT.fillFrom) / (BEAT.fillTo - BEAT.fillFrom));
export const sweepAt = (f: number) => clamp01((f - BEAT.sweepFrom) / (BEAT.sweepTo - BEAT.sweepFrom));

const PotentialInTheKart: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const x = kartX(S);
  const speed = kartX(S + 0.5) - kartX(S - 0.5);
  const draw = drawAt(S);
  const fill = fillAt(S);
  const sweep = sweepAt(S);
  const kart = { x, y: 0, k, wheelSpin: x - X_START, wheelSpeed: speed, lean: kidLean(S), bob: kartBob(S), blink: blinkAt(S) };
  const showF1 = draw > 0;
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <TrackStrip x0={-6000} x1={6000} top={-0.16 * M} bottom={0.3 * M} k={k} />
      {showF1 ? <F1Outline x={0} y={0} k={k} draw={draw} fill={fill} sweep={sweep} amberBand={band} /> : null}
      <KartWithKid {...kart} />
      {showF1 ? <F1Outline x={0} y={0} k={k} draw={draw} fill={fill} amberBand={band} layer="halo" /> : null}
    </StoutStage>
  );
};

export default PotentialInTheKart;
