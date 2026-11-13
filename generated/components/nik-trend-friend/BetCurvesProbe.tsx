// ---------------------------------------------------------------------------
// BetCurvesProbe (nik-trend-friend): three stills of the shared chart world betCurves.tsx, so cuts B and C can check
// their framing. Not a cut. f0 = origin close-up at month 2 (k 1.26, RaceOnTheCurve's opening), f1 = month 3
// tracking the tips (k 1.1), f2 = month 12 wide (k 0.32, the whole history; a sample product in amber on top).
// The sample product is RaceOnTheCurve's hero (keyedRev on its HERO_KEYS, copied here so the probe stands alone).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { Axis, BetLine, PackFan, camOn, packMedian, keyedRev } from "./betCurves";

export const FPS = 24000 / 1001;
export const DURATION = 3;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const HERO = keyedRev([
  [0.8, 262],
  [2, 325],
  [3.583, 442],
  [4.0, 469],
  [4.417, 496.5],
  [4.833, 524.5],
  [5.25, 556],
  [5.9, 568],
  [6.8, 574],
]);
const STATES = [
  { month: 2, cam: { x: 329.9, y: -418.5, k: 1.264 }, amber: 0 },
  { month: 3, cam: camOn(3, packMedian(3) + 330, 1.1, 560, 960), amber: 0 },
  { month: 12, cam: camOn(6.2, 2150, 0.32, 540, 960), amber: 1 },
];

const BetCurvesProbe: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const st = STATES[Math.min(2, Math.max(0, f))];
  const cam = st.cam;
  const hero = HERO(st.month);
  return (
    <StoutStage S={0} cam={cam} rest={cam} pool={{ x: cam.x + 60, y: -hero }} sway={false}>
      <Axis k={cam.k} />
      <PackFan month={st.month} k={cam.k} />
      <BetLine rev={HERO} month={st.month} k={cam.k} band={amberBandFor(cam)} amber={st.amber} />
    </StoutStage>
  );
};

export default BetCurvesProbe;
