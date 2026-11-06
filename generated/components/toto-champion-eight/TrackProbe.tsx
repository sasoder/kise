// TrackProbe — the shared racetrack world's probe (trackWorld.tsx; measurement only, never delivered).
// Frame 0: the close truck (k 0.95, the camera 6 m off, eye 1.5 m), the subject kart centred, karts on lanes mid and far,
// the finish line and gantry just ahead. Frame 1: the wide (pulled out: k 0.46, dolly 0.4, eye 2.2 m), karts on all
// five lanes, the finish strip and banner.
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { KartWithKid, M } from "./champShared";
import { LANES, OnLane, TRACK_RIG, TrackStage, kartJitter, laneK, pullOut, trackCam, type TrackCam } from "./trackWorld";

export const schema = z.object({});
export const defaultProps = schema.parse({});

const V = 140;
const TrackProbe: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const close = trackCam(0.17 * M, 0.95, 1040);
  const w = pullOut(0.95, TRACK_RIG.D, 0.46, 0.4);
  const wide: TrackCam = { ...trackCam(0.4 * M, w.k, 1000, w.D, 2.2 * M) };
  const cam = f === 0 ? close : wide;
  const karts =
    f === 0
      ? [
          { z: LANES.far, x: -1.6 * M, helmet: "sage" as const, suit: "plum" as const, tone: "board" as const },
          { z: LANES.mid, x: 2.2 * M, helmet: "terracotta" as const, suit: "sage" as const, tone: "board" as const },
          { z: LANES.subject, x: 0, helmet: "cream" as const, suit: "denim" as const, tone: "cream" as const },
        ]
      : [
          { z: LANES.farthest, x: -3.5 * M, helmet: "oat" as const, suit: "rust" as const, tone: "board" as const },
          { z: LANES.far, x: -1.6 * M, helmet: "sage" as const, suit: "plum" as const, tone: "board" as const },
          { z: LANES.mid, x: 2.2 * M, helmet: "terracotta" as const, suit: "sage" as const, tone: "board" as const },
          { z: LANES.subject, x: 0, helmet: "cream" as const, suit: "denim" as const, tone: "cream" as const },
          { z: LANES.near, x: -4.2 * M, helmet: "plum" as const, suit: "oat" as const, tone: "board" as const },
        ];
  return (
    <TrackStage S={f} cam={cam} v={V} finish={{ x: f === 0 ? 4.5 * M : 1.6 * M }}>
      {karts.map((kt, i) => {
        const j = kartJitter(f + i * 7, i);
        return (
          <OnLane key={i} cam={cam} z={kt.z}>
            <KartWithKid x={kt.x} y={0} k={laneK(cam, kt.z)} tone={kt.tone} helmet={kt.helmet} suit={kt.suit} wheelSpin={i * 300} wheelSpeed={V} bob={j.bob} lean={j.lean} />
          </OnLane>
        );
      })}
    </TrackStage>
  );
};
export default TrackProbe;
