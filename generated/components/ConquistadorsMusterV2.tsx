import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { INK_FULL } from "./incaShared";
import { C2, C2_TO_TAU, COMPANY2, c2Cam2, musterAt2 } from "./pageMotionV2";
import { PageSceneV2, defaultProps as a2Defaults, type CoItem } from "./AgainstAlmostHundredThousandV2";

export const DURATION = C2.DURATION;
export const FPS = 24;

// ---------------------------------------------------------------------------
// ConquistadorsMusterV2 (C2, V2). Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cajamarca_infinite_KD": Pizarro at Cajamarca, 16 Nov 1532.
//   "...he has some 160, 190 conquistadors."
// V2 of ConquistadorsMuster (V1 untouched): no ground rule, plot or ticks;
// every man an engraved figure (pageFigures.tsx; see
// AgainstAlmostHundredThousandV2 for the world and the figures). Opaque
// 1080x1920, 24 fps. Motion: pageMotionV2.ts (MUSTER2, musterAt2, c2Cam2);
// every layer is AgainstAlmostHundredThousandV2's PageSceneV2, so C2's last
// frame is A2 V2's opening state one frame early (page time tau = f - 91).
//
// TIMELINE (V1's). In-point 3.74 s on the edit timeline; f = round((t - 3.74) * 24):
//   he f0 · has f2 · some f7 · 160 f12 (ends f26) · 190 f36 · CONQUISTADORS f55
//   (ends f76) · "So," f83 · A2's in-point = f91.
// DURATION = 91 frames (f0..f90): C2's frame 91 would be A2's frame 0.
//
// THE GESTURES:
//   1. The muster f0-f58: close (k 2.45 -> 2.42) on the company's place.
//      Pizarro's 168 march in from the right edge as figures, in a loose
//      column at the heights of the rows they are bound for: the 62 HORSEMEN
//      first, at a walk (two walk poses, each horse on his own gait, a small
//      bob), lances upright, facing their way (left); then the 106 FOOT with
//      a two-pose step, pikes up. Each decelerates into his place (C1) and
//      settles, file by file, front first: one man every ~0.33 f (it reads as
//      counting; first in f3.5, last ~f57.4, on "conquistadors"). They form
//      the company (R1: deeper, a band of armed men): four ranks of horse
//      facing the host's side (left), six ranks of foot with their pikes up,
//      each rank 10 px higher and 4.5 % smaller, ~78 px tall at k 1.
//      The camera starts 80 world px right, on the column, and glides left
//      with it onto the company (f-24..f60).
//   2. "168" ~f62: slides up under the company (f48-f62), A2's exact label.
//   3. f60-f90: the camera is A2 V2's opening creep (asserted from f62); the
//      last frame is A2 V2's opening state at tau = -1 (join test: SP/V2/join).
// No other text, no counters, no "160" / "190".
//
// COUNTS AND SOURCES: 168 = 62 horse + 106 foot (Hemming; Lockhart, The Men of
//   Cajamarca); the speaker says "160, 190"; Pedro Pizarro's spy counted ~190.
// ---------------------------------------------------------------------------

export const schema = z.object({ vignette: z.number(), timing: z.boolean() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, timing: false });

const LABEL_F0 = 48; // "168" slides up f48-f62

const ConquistadorsMusterV2: React.FC<Props> = ({ vignette, timing }) => {
  const frame = useCurrentFrame();
  const tau = frame + C2_TO_TAU;
  const company: CoItem[] = musterAt2(frame).map((st, i) => ({ st, horse: COMPANY2[i].horse }));
  return (
    <PageSceneV2
      tau={tau}
      cam={c2Cam2(frame)}
      company={company}
      label168={{ op: INK_FULL, frame, f0: LABEL_F0 }}
      vignette={vignette}
      opts={{ lodLo: a2Defaults.lodLo, lodHi: a2Defaults.lodHi }}
      timing={timing}
    />
  );
};

export default ConquistadorsMusterV2;
