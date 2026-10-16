import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CHAIN_LEN,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_FULL,
  LABEL_TRAVEL,
  MapPage,
  PlaybookChain,
  WorldSvg,
  fellSC,
  makeCamera,
  project,
  screenOf,
  swayCam,
  type Cam,
  type CamKey,
  type P2,
} from "./vikAmericasShared";

// ---------------------------------------------------------------------------
// LearnedFromHispaniola — a quick cut between two portraits in the clip
// "Sheppard_Vikings" (Dwarkesh Patel with Si Sheppard), Dwarkesh map style, on
// the shared Americas world (vikAmericasShared.tsx, read-only here). It is cut
// A's picture (LearningFromEachOther) seen again at its opening: same world,
// same node, same chain weight and casing; the label is cut B's label style.
//
// THE LINE (sequence 9.968 s -> 11.637 s): on the portrait before the cut "So
// Cortes learned", then inside it "from the conquest of Hispaniola." Straight
// after it the edit shows Pizarro's portrait ("And then Pizarro...").
// DURATION = 40 interval frames + 2 tail frames that carry the motion on = 42,
// 24 fps, 1080 x 1920, opaque.
//
// MECHANISM. The lesson leaves Hispaniola for Mexico: one camera move, one
// label, one line. The cut hands off mid-flight (the line never arrives).
// ACCENT: orange = what is passed on (here, what Cortes took from Hispaniola).
// Everything else is cream. No realms, no numbers, no other label.
//
// GESTURES (local frames; nothing else moves)
//   f0        opening state = cut A's opening: close on Hispaniola (k 2.1, the
//             island centred near x 540 / y 835), the orange Santo Domingo node
//             alight; the camera is already easing.               ["from" f-4]
//   f0-42     THE CAMERA, one eased move: a slow push-out drifting west that
//             gathers as the line sets out and follows it gently to k ~1.72
//             (Hispaniola right of centre, the head left of centre); still
//             moving on the last frame.                         [the whole line]
//   f8-42     the orange bow (cut A's leg 1, the same curve) leaves the node
//             heading west-north-west over Cuba toward Mexico; on f40 its head
//             is over western Cuba and still travelling.
//                                        ["conquest" f6, "of" f12 -> the handoff]
//   f10-18    label HISPANIOLA slides up 24 px while fading in over the sea
//             north of the island, landing on f18.        ["Hispaniola." f18-36]
//
// SOURCES (CLIP_SPEC verified facts): Hispaniola was the Spanish base from
// 1493-96; Santo Domingo 18.47 N 69.90 W, founded 1496; Cortes arrived on
// Hispaniola in 1504, went on to Cuba in 1511 and sailed for Mexico in 1519
// (Tenochtitlan 19.43 N 99.13 W fell in 1521). Natural Earth 10m coastlines.
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 42;

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// -- the camera: one keyed, eased track (pchip, open ends: moving at f0 and f41)
const HISPANIOLA = project(-71.0, 18.85); // cut A's opening anchor
export const CAM_KEYS: CamKey[] = [
  { f: 0, k: 2.1, wx: HISPANIOLA[0], wy: HISPANIOLA[1], sx: 540, sy: 835 },
  { f: 12, k: 2.04, wx: HISPANIOLA[0], wy: HISPANIOLA[1], sx: 556, sy: 838 },
  { f: 42, k: 1.72, wx: HISPANIOLA[0], wy: HISPANIOLA[1], sx: 648, sy: 872 },
];
export const camAt = makeCamera(CAM_KEYS);

// -- the chain's head (arclength, world px): leaves Santo Domingo on f8, gathers
// over 8 f to a steady 10.2 world px / frame and keeps going (never arrives)
const HEAD_F0 = 8;
const HEAD_RAMP = 8;
const HEAD_V = 10.2;
export const headS = (f: number) => {
  const u = Math.max(0, f - HEAD_F0);
  return u < HEAD_RAMP ? (HEAD_V * u * u) / (2 * HEAD_RAMP) : HEAD_V * (u - HEAD_RAMP / 2);
};

// -- the label (cut B's label: IM Fell English SC spaced caps on a dark halo,
// anchored to a world point, screen-sized) -------------------------------------
export const LABEL_SIZE = 62;
const LABEL_SPACING = 0.3;
/** over the sea north of the island, set east so the bow passes clear under its west end */
export const LABEL_AT: P2 = [868, 380];
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const Label: React.FC<{ text: string; at: P2; cam: Cam; frame: number; f0: number; f1: number }> = ({ text, at, cam, frame, f0, f1 }) => {
  const op = interpolate(frame, [f0, f0 + (f1 - f0) * 0.75], [0, 1], CLAMP) * INK_FULL;
  if (op <= 0.002) return null;
  const dy = interpolate(frame, [f0, f1], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...CLAMP });
  const [sx, sy] = screenOf(at, cam);
  const trail = LABEL_SIZE * LABEL_SPACING; // letter-spacing trails the last glyph
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + trail / 2}
        y={sy + dy}
        textAnchor="middle"
        opacity={op}
        fill={INK}
        stroke={DARK}
        strokeOpacity={0.78}
        strokeWidth={LABEL_SIZE * 0.2}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: LABEL_SIZE, letterSpacing: trail }}
      >
        {text}
      </text>
    </svg>
  );
};

const LearnedFromHispaniola: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam: Cam = swayCam(camAt(frame), frame);
  return (
    <MapPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <PlaybookChain cam={cam} progress={headS(frame) / CHAIN_LEN} frame={frame} beads={0} />
      </WorldSvg>
      <Label text="HISPANIOLA" at={LABEL_AT} cam={cam} frame={frame} f0={10} f1={18} />
    </MapPage>
  );
};

export default LearnedFromHispaniola;
