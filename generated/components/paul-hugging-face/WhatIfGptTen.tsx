// ---------------------------------------------------------------------------
// WhatIfGptTen (paul-hugging-face, cut 0): the title card. Look C "Graphite air" on the shared world
// (hfWorld.tsx + hfProps.tsx, read-only). Opaque 1080x1920, 23.976 fps, 59 frames.
// The approved hero still heroC/T.png in motion (its code: heroC/heroCShotT.tsx).
//
// CHECK LINE: "This part asks what the Hugging Face hack would look like if a far stronger AI (GPT-10) did it."
//
// THE LINE: "Take the Hugging Face incident and scale it up to GPT-10 and ask"
// WORD -> FRAME: Hugging 7 · Face 11 · incident 12 · and 20 · scale 25 · it 31 · up 34 · to 37 · GPT 38 · -10 47 ·
//   and 52 · ask 59 (out)
// DURATION: the slot 0.000 -> 2.461 s x 23.976 = 59 frames (f0..f58).
//
// THE MOTION: the dark title plate stands on the grid floor in the graphite air, the title readable from f0 to the
// end ("GPT-10" in orange, the HF mark after "hack?"). One camera lobe the whole cut: a slow eased push-in with a slight
// orbit to the right (keys at f-14 and f72, so it is already moving at f0 and still drifting at f58). The orange toy
// robot stands a little in front of the plate's right end, looking up at it: it starts at 0.6 of the hero size and on
// "scale it up" grows smoothly on its planted feet (f25 -> f46) to 1.3x, landing on "-10" (f47), overlapping the
// plate's corner but never the type; "GPT-10" brightens over f38-47. From f47 a living frame: the robot's idle bob and
// blink, the camera drift. Phone legibility (director, Nov 17): the type is 0.52 m (hero 0.46) on a 3.55 m plate and
// the plate fills the keep-in box from f0 (plate x ~96-870, the "W" cap ~93 px at f0 -> ~97 px at f58; the robot's
// right edge <= 1015, ~30 px clear of "Hugging").
// Orange = the AI (the robot and "GPT-10"); the plate is graphite, the type cream, the HF mark its real yellow.
//
// SOURCES: the title is the user's ("What if GPT-10 did the Hugging Face hack?"); the HF mark from brandGlyphs.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BOT_POSES } from "../rsi-ten-earths/tenEarthsBot";
import { ACCENT, Decal, FONT, FloorShadow, GRAPHITE, HFMark, HfStage, MATS, Prism, RobotAt, Svg, add, mixHex, mul, ramp, robotFoot, rrect, slabFrame, worldAt, type CamKey, type V3 } from "./hfWorld";

export const FPS = 24000 / 1001;
export const DURATION = 59;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- beats (frames) ----
const GROW_A = 25; // "scale"
const GROW_B = 46; // landed a frame before "-10" (f47)
const LIT_A = 38; // "GPT"
const LIT_B = 47; // "-10"

// ---- the camera: one lobe, pre-roll and post-roll keys so it moves at f0 and still drifts at f58 ----
export const KEYS: CamKey[] = [
  { f: -14, target: [0.37, 1.0, 0.45], dist: 8.05, yaw: 0.44, pitch: 0.2, F: 1700, sy: 700, sun: 0.3 },
  { f: 72, target: [0.49, 1.02, 0.45], dist: 7.95, yaw: 0.51, pitch: 0.19 },
];

// ---- the plate (hero T) ----
const PW = 3.55;
const PH = 2.3;
const PT = 0.62;
const SLAB = slabFrame([0, 0, 0], -0.06);
const FACE_C: V3 = add(SLAB.o, [0, PH / 2, 0]);
const FOOT: V3[] = rrect(PW, PT, 0.12, 4).map(([x, z]) => add(SLAB.o, add(mul(SLAB.u, x), mul(SLAB.n, z + PT / 2))));
const TL: V3 = add(FACE_C, add(mul(SLAB.u, -PW / 2), [0, PH / 2, 0]));
const RES = 300;
// the type larger than the hero's (0.46 m) for a phone: 0.52 m on a slightly narrower plate (3.55 m), left pad 0.14 m, the block centred vertically
const FS = 0.52 * RES;
const PAD = 0.14 * RES;
const LH = FS * 1.2;
const Y0 = ((PH - 3.33 * 0.52) / 2 + 0.72 * 0.52) * RES;

// ---- the robot: beside the plate's right end, a little in front of its face ----
const BP: V3 = [1.82, 0, -0.75];
const S0 = 0.6;
const S1 = 1.3;
export const botSize = (f: number) => S0 + (S1 - S0) * ramp(f, GROW_A, GROW_B);

const WhatIfGptTen: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const W = worldAt(KEYS, frame);
  const size = botSize(frame);
  const g = ramp(frame, GROW_A, GROW_B);
  const lit = ramp(frame, LIT_A, LIT_B);
  // looking up at the title; as it grows it looks up a little less
  const base = BOT_POSES.turnTo(-0.75, frame, 3);
  const pose = { ...base, pitch: base.pitch - 14 + 5 * g, headYaw: base.headYaw - 0.25, look: [-0.55, -0.75 + 0.25 * g] as [number, number] };
  const cream = W.tone(GRAPHITE.cream, FACE_C);
  const orange = W.toneO(mixHex(ACCENT, "#FFD27A", 0.45 * lit), FACE_C);
  return (
    <HfStage
      W={W}
      shafts={1.15}
      floor={{ pool: [0.6, 0, 0.3], poolR: 4.5, oz: 0 }}
      shadows={
        <>
          <FloorShadow W={W} pts={FOOT} uid="slabS" amt={1} soft={0.3} reach={0.55} />
          <FloorShadow W={W} pts={robotFoot(BP, 0.24 * size)} uid="botS" amt={0.9} soft={0.12 * size} reach={0.2 * size} />
        </>
      }
    >
      <Svg id="slab">
        <Prism W={W} outline={rrect(PW, PH, 0.24, 8)} o={FACE_C} u={SLAB.u} v={SLAB.v} n={SLAB.n} depth={PT} mat={MATS.graphite} uid="slab" ao={0.9} />
      </Svg>
      <Decal W={W} o={TL} u={SLAB.u} v={[0, -1, 0]} w={PW} h={PH} res={RES}>
        <defs>
          <filter id="tglow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
        </defs>
        <g fontFamily={FONT} fontWeight={700} fontSize={FS}>
          <text x={PAD} y={Y0} fill="none" filter="url(#tglow)" opacity={0.65 + 0.35 * lit}>
            What if <tspan fill={orange}>GPT-10</tspan>
          </text>
          <text x={PAD} y={Y0} fill={cream}>
            What if <tspan fill={orange}>GPT-10</tspan>
          </text>
          <text x={PAD} y={Y0 + LH} fill={cream}>
            did the Hugging
          </text>
          <text x={PAD} y={Y0 + 2 * LH} fill={cream}>
            Face hack?
          </text>
        </g>
        <HFMark x={PAD + FS * 5.05} y={Y0 + 2 * LH - FS * 0.34} size={FS * 0.95} />
      </Decal>
      <Svg id="bot" glow={0.6}>
        <RobotAt W={W} p={BP} pose={pose} uid="bot0" size={size} />
      </Svg>
    </HfStage>
  );
};

export default WhatIfGptTen;
