import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AztecRealm,
  CHAIN_LEN,
  CHAIN_S,
  DeadTie,
  IncaRealm,
  MapPage,
  PlaybookChain,
  WorldSvg,
  clamp01,
  makeCamera,
  pchip,
  project,
  smootherstep,
  swayCam,
  type Cam,
} from "./vikAmericasShared";

// ---------------------------------------------------------------------------
// LearningFromEachOther — cut A of the clip "Sheppard_Vikings" (Dwarkesh Patel
// with Si Sheppard), Dwarkesh map style, on the shared Americas world
// (vikAmericasShared.tsx, read-only here).
//
// THE LINE (sequence 2.961 s -> 8.842 s): "...that the Europeans are learning
// from each other, but the natives are not learning from each other. So -".
// The speaker then names Hispaniola -> Cortes -> Pizarro on camera, so the cut
// shows that chain BEFORE he names it: NO labels, no numbers.
// DURATION = 141 interval frames (sequence f71 -> f212) + 2 tail frames = 143,
// 24 fps, 1080 x 1920, opaque.
//
// MECHANISM. Knowledge is ONE orange line that hops from one Spanish conquest
// to the next; the native realms get no line between them.
// ACCENT: orange = what is passed on (the playbook). Everything native and all
// context is cream.
//
// GESTURES (local frames; nothing else moves)
//   f0        opening state: close on the Caribbean, Hispaniola centred near
//             y 835, one orange node mark alight on Santo Domingo; bare cream
//             coasts; the camera is already pulling back.
//   f0-80     THE CAMERA, one continuous move: pulls back and drifts south-west
//             after the head until the picture is framed at k 1.24 (Mexico top-left,
//             Hispaniola top-right, Peru lower-right; Cuzco just in the caption band).           [the whole line]
//   f5-30     the orange chain's head leaves Santo Domingo in one bow north over
//             Cuba and the Gulf and reaches Tenochtitlan at f30 (its node
//             lights as the head arrives)   ["the Europeans are learning" f5-31;
//             lands 6 f before "each other" f36]
//   f30-66    the head goes on in a second bow, west out over the open Pacific,
//             to Cajamarca at f66 (third node lights)
//             ["from each other" f31-46, the breath, "but" f51]
//   f60-143   orange beads travel the chain in order, spaced, one direction
//             (Hispaniola -> Mexico -> Peru): the thing being handed on   [hold]
//   f66-90    the two realms rise in cream behind a crisp front spreading from
//             each capital (Aztec f66-86, Inca f66-90)        ["the natives" f73]
//   f95-122   a cream dashed tie sets out from the Aztec realm south-east
//             (f95-118) and one from the Inca realm north-west (f99-122), on the
//             Pacific side, each slowing, thinning and fading to nothing far
//             short of the other            ["not learning from each other" f95-122]
//   f80-143   the hold: the camera creeps in ~3.2 % (k 1.24 -> 1.28, under the 1.30 band), beads flow, nothing new.
//
// SOURCES (CLIP_SPEC verified facts): Santo Domingo 18.47 N 69.90 W (founded
// 1496; Cortes on Hispaniola 1504); Santiago de Cuba 20.02 N 75.83 W (1511);
// Veracruz 19.19 N 96.15 W and Tenochtitlan 19.43 N 99.13 W (1519-21); Panama
// 8.95 N 79.53 W (Pizarro from 1519); Tumbes 3.57 S 80.45 W and Cajamarca
// 7.16 S 78.51 W (1532); Cuzco 13.53 S 71.97 W. Aztec Empire c. 1519 after the
// Commons "Aztec Empire 1519 map-fr.svg" (scripts/cortes-geo.json); Tawantinsuyu
// c. 1532 after the Commons "Inca Expansion.svg" (scripts/inca-geo.json);
// Natural Earth 10m coastlines. No known contact between the two states.
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 143;

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// -- the camera: one keyed, eased track (pchip, open ends: moving at f0) -------
const HISPANIOLA = project(-71.0, 18.85);
export const CAM_KEYS = [
  { f: 0, k: 2.1, wx: HISPANIOLA[0], wy: HISPANIOLA[1], sx: 540, sy: 835 },
  { f: 30, k: 1.3, wx: 550, wy: 440, sx: 540, sy: 640 },
  { f: 80, k: 1.24, wx: 549.5, wy: 813.6, sx: 540, sy: 835 },
  { f: 143, k: 1.28, wx: 549.5, wy: 813.6, sx: 540, sy: 835 },
];
export const camAt = makeCamera(CAM_KEYS);

// -- the chain's head (arclength): Santo Domingo f5 -> Tenochtitlan f30 -> Cajamarca f66
const HEAD = pchip(
  [
    [5, 0],
    [30, CHAIN_S.tenochtitlan],
    [66, CHAIN_LEN],
  ],
  true,
);
export const headAt = (f: number) => HEAD(Math.max(5, Math.min(66, f))) / CHAIN_LEN;
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const span = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

const LearningFromEachOther: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam: Cam = swayCam(camAt(frame), frame);
  return (
    <MapPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <AztecRealm cam={cam} reveal={smootherstep(span(frame, 66, 86))} />
        <IncaRealm cam={cam} reveal={smootherstep(span(frame, 66, 90))} />
        <DeadTie from="aztec" cam={cam} progress={easeOut(span(frame, 95, 118))} />
        <DeadTie from="inca" cam={cam} progress={easeOut(span(frame, 99, 122))} />
        <PlaybookChain cam={cam} progress={headAt(frame)} frame={frame} beads={span(frame, 60, 70)} />
      </WorldSvg>
    </MapPage>
  );
};

export default LearningFromEachOther;
