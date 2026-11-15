// ---------------------------------------------------------------------------
// speciesTowerProbe (rsi-stupidest-species): probe stills of the shared world W1 THE SPECIES TOWER (speciesTower.tsx)
// at the four cuts' key frames. Opaque 1080x1920, 23.976 fps. Not a cut: no line, no delivery.
//   shot "A"  A's resolved wide: the human low in his lit niche, the dashed orange ceiling far above
//   shot "A0" A's opening: close on the human in his niche
//   shot "B0" B's opening on the stone capital (SMARTEST POSSIBLE plate), the dashes rising out of the top
//   shot "B"  B's resolved frame on the cornice: the human above (on the line), the chimp's slot below
//   shot "C"  C's close on the alcove with the ideal occupant drawn
//   shot "F"  F's base: the winch, the platform half-way with the human on it
//   chimpProbe: W2's Chimp (stupidestFolk, sitting) in the chimp's niche, as a cut would pass it (occupants.chimp)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { PlatformHuman, TOWER_CAM, TowerScene, towerAirOf, towerCamTrack, type OccupantFn } from "./speciesTower";
import { CHIMP_POSES, Chimp } from "./stupidestFolk";

export const FPS = 24000 / 1001;
export const DURATION = 220;
export const schema = z.object({
  shot: z.enum(["A", "A0", "B0", "B", "C", "F"]).default("A"),
  chimpProbe: z.boolean().default(true),
  /** for F: the platform's height 0..1 */
  t: z.number().default(0.5),
  /** for C: the ideal occupant's progress */
  occ: z.number().default(1),
  /** a motion check instead of a still: the A pull-back, the B descent, C's occupant drawing, F's hoist */
  move: z.enum(["none", "A", "B", "C", "F"]).default("none"),
});
export const defaultProps = schema.parse({});

const camOf = (shot: z.infer<typeof schema>["shot"]): Cam =>
  shot === "A" ? TOWER_CAM.A_resolved : shot === "A0" ? TOWER_CAM.A_open : shot === "B0" ? TOWER_CAM.B_open : shot === "B" ? TOWER_CAM.B_resolved : shot === "C" ? TOWER_CAM.C_resolved : TOWER_CAM.F_half;

/** W2's Chimp (stupidestFolk) sitting in its niche, facing out, looking up a little */
const chimpInNiche: OccupantFn = ({ A, anchor, at, scale, frame }) => (
  <Chimp variant={0} pose={CHIMP_POSES.sit(1, frame, { headYaw: 0.12, look: [0.08, -0.35], pitch: -4 })} at={at} scale={scale} uid="twChimp" fog={A.folkFog(anchor.Z)} unitPx={A.cam.k} />
);

const ease = (a: number, b: number, f: number) => {
  const u = Math.max(0, Math.min(1, (f - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const TRACKS = {
  A: towerCamTrack([{ f: 0, cam: TOWER_CAM.A_open }, { f: 50, cam: TOWER_CAM.A_resolved }, { f: 68, cam: { ...TOWER_CAM.A_resolved, k: TOWER_CAM.A_resolved.k * 1.01 } }], 69),
  B: towerCamTrack([{ f: 0, cam: TOWER_CAM.B_open }, { f: 50, cam: { ...TOWER_CAM.B_open, k: TOWER_CAM.B_open.k * 1.04 } }, { f: 140, cam: TOWER_CAM.B_resolved }, { f: 219, cam: { ...TOWER_CAM.B_resolved, k: TOWER_CAM.B_resolved.k * 1.02 } }], 220),
  C: towerCamTrack([{ f: 0, cam: TOWER_CAM.C_open }, { f: 72, cam: TOWER_CAM.C_resolved }], 73),
  F: towerCamTrack([{ f: 0, cam: TOWER_CAM.F_open }, { f: 28, cam: TOWER_CAM.F_open }, { f: 90, cam: TOWER_CAM.F_half }, { f: 112, cam: TOWER_CAM.F_half }], 113),
};

const SpeciesTowerProbe: React.FC<z.infer<typeof schema>> = ({ shot, chimpProbe, t: tProp, occ: occProp, move }) => {
  const frame = useCurrentFrame();
  const base = move !== "none" ? TRACKS[move](frame) : camOf(shot);
  const rest = move !== "none" ? TRACKS[move](0) : base;
  const cam = swayCam(base, frame);
  const A = towerAirOf({ cam, rest: swayCam(rest, 0), frame });
  const sh = move === "none" ? shot : move === "A" ? "A" : move === "B" ? "B" : move === "C" ? "C" : "F";
  const t = move === "F" ? 0.5 * ease(28, 90, frame) : tProp;
  const occ = move === "C" ? ease(14, 48, frame) : occProp;
  const show = {
    capitalPlate: shot === "B0" || move === "B" ? 1 : 0,
    idealOccupant: sh === "C" ? occ : 0,
    corniceLight: move === "B" ? ease(186, 200, frame) : sh === "B" ? 0.7 : 0,
    civPlate: sh === "B" && move === "none" ? 1 : 0,
  };
  void sh;
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <TowerScene
          A={A}
          frame={frame}
          show={show}
          human={sh !== "F"}
          occupants={chimpProbe ? { chimp: chimpInNiche } : {}}
          hoist={sh === "F" ? { t, plate: 1, rider: <PlatformHuman A={A} t={t} frame={frame} /> } : false}
        />
      </WorldSvg>
    </AirStage>
  );
};

export default SpeciesTowerProbe;
