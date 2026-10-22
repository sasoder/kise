// ---------------------------------------------------------------------------
// creaturesProbeMarmot: V3 look probes of the marmot of RodentFromCentralAsia (kyle-pandemics, cut 1), not a cut:
// MarmotProbe (the cut's camera at the frame, the marmot alone in the medium) and MarmotMask (the marmot alone on
// black, to measure where its head sits on screen). Compositions: src/Root.MarmotV3.tsx (render with --gl=angle).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { AIRS } from "./creatureAir";
import { AirBackdrop } from "./creaturesProbe";
import { camAt as rodentCam } from "./rodentCamera";
import { Steppe3D } from "./rodentSteppe3D";

export const MarmotProbe: React.FC<{ air: "A" | "B" }> = ({ air }) => {
  const frame = useCurrentFrame();
  const A = AIRS[air];
  return (
    <AirBackdrop air={A} frame={frame}>
      <Steppe3D cam={rodentCam(frame)} frame={frame} air={A} probe />
    </AirBackdrop>
  );
};

/** the marmot alone on black at the cut's camera (to measure where its head sits on screen) */
export const MarmotMask: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      <Steppe3D cam={rodentCam(frame)} frame={frame} probe />
    </div>
  );
};
