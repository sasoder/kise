// ---------------------------------------------------------------------------
// AthensNotMassive (kyle-greek-math, cut 61). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 133 frames. The world, its camera and the crowds: ./athensRomeWorld.tsx (+ its data
// ./athensRomePlan.ts), shared with cut F (RomansHadThePeople), which opens on this cut's last frame.
//
// CHECK LINE: "classical Athens was small: its whole people make a modest crowd below the Acropolis, with empty land
// all around."
//
// THE LINE: "[I mean, we think of] Athens as being like a couple hundred thousand people. Like not massive. So [I
// wonder if…]"
// WORD -> FRAME: Athens -3..7 · as being like a 7..34 · couple 34 · hundred 40 · thousand 45 · people 56..71 · Like 73 ·
// NOT 84 · MASSIVE 93..112 · So 120 (Whisper onsets, ~0.2 s early)
// DURATION: the slot 61.695 -> 66.133 s = 4.438 s x 29.97 = 1982 - 1849 = 133 frames (f0..f132).
//
// THE MOTION: one continuous pull-back. f0 ("Athens"): the Parthenon on its rock, close (the temple front ~59 % of the
// frame width, its middle at y ~700, just left of centre) in the light shafts, the eye a little above its cornice; the
// camera is already moving. f0-71 ("as being like a couple hundred thousand people"): it pulls back over the plain (a
// pure dolly, 34 m), drops 2.6 m and tilts down (the horizon from y ~531 to ~370), trucking right early: the plateau's
// edge, the cliff and its talus rise into frame and below the rock the Athenians gathered on the plain come up from the
// bottom edge in the middle (revealed by the move: back rows from f16, all 223 in by f44, the scholars' orange glints
// with them), filling the lower middle. f73-112 ("Like not massive"): the same lobe decelerates on until the crowd is a
// modest oval in front of the rock with wide empty plain around it, most of all to the right, where a dirt track leads
// off toward the haze (cut F goes there); settled ~f110 (front figures 57-58 px, feet y ~1045-1065, back rows' heads y
// ~820-832; the temple ~295 px wide at x ~450, y ~306-503). f112-132: a living hold: a slow drift right and back (it
// carries on into F), the crowd swaying, a few heads turning (f114, f122, f128), motes, shafts.
// No Romans in any frame (their nearest box stays >= 200 px past the right edge on every frame). No text.
// Orange = Greek mathematical knowledge: only the eight scholars' small tablets in the crowd (they glint); the people,
// the temple, the rock and the plain are muted earthy local colours.
//
// DEPTH (athensRomePlan.ts): a pinhole Cam3 per frame (F 1100 px, no pitch) mapped onto the kit's londonDepth camera
// (dolly 0, dRef = the eye's distance to Z = 0); fog by DEPTH behind the front line Z = -4200 (none for the first
// 4200: the crowd and the Acropolis keep their local colour). Depths: the crowd Z -3723..-1394 (an oval, X -1451..1027),
// the rock's talus foot Z ~ -300, the cliff 14 m tall above a talus shoulder at 30 %, the Parthenon's front Z 1100 (axis
// X -900) on a 0.8 m terrace, the Romans from Z -4200 at X >= 6600 + 0.62 (Z + 4200), the Colosseum Z 47000. The eye:
// Z -3990 -> -9998, height 24.2 -> 21.6 m, x -659 -> 27.
//
// SOURCES: Athens' population c. 431 BC roughly 250,000-300,000 including women, children, metics and slaves
// (M. H. Hansen, "Three Studies in Athenian Demography", 1988; A. W. Gomme, "The Population of Athens in the Fifth and
// Fourth Centuries B.C.", 1933, ~315,000): the speaker's "a couple hundred thousand" is in range; no number on screen,
// the crowd is a token (223 figures). The Parthenon (447-432 BC): a Doric peripteral temple, 8 x 17 columns, stylobate
// 30.9 x 69.5 m, columns 10.4 m (drawn at ~0.55 of the cast's scale, a picture-book temple). The Colosseum (AD 80):
// an elliptical amphitheatre of four storeys (three arcades and the attic).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AthensRomeScene, athensSpriteReqs, cameraE, type Cam3 } from "./athensRomeWorld";

export const FPS = 30000 / 1001;
export const DURATION = 133;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
  /** probe only: "world" = the whole world (Athens and Rome) from a high wide framing; "pan" = E's last frame panned
   *  right at the same lens, height and distance until the Romans fill the frame (a likely end for cut F) */
  probe: z.enum(["none", "world", "pan"]).default("none"),
});
export const defaultProps = schema.parse({});

/** every crowd sprite the cut's camera path shows, baked once per render tab */
const E_REQS = athensSpriteReqs(Array.from({ length: DURATION }, (_, f) => ({ cam: cameraE(f), life: f })));

/** the whole-world probes: "world" = Athens small at the left, the empty plain and the track, the Romans filling the
 *  right back into the haze, the Colosseum in the haze; "pan" = E's end camera trucked right at the same lens */
export const PROBES: Record<"world" | "pan", Cam3> = {
  world: { x: 9000, h: 11000, z: -26000, F: 1100, hy: 330 },
  pan: { ...cameraE(132), x: 15000 },
};
const PROBE_REQS = new Map<string, ReturnType<typeof athensSpriteReqs>>();

const AthensNotMassive: React.FC<z.infer<typeof schema>> = ({ camFrame, probe }) => {
  const frame = useCurrentFrame();
  if (probe !== "none") {
    const cam = PROBES[probe];
    const reqs = PROBE_REQS.get(probe) ?? athensSpriteReqs([{ cam, life: 132 }]);
    PROBE_REQS.set(probe, reqs);
    return <AthensRomeScene cam={cam} life={132} reqs={reqs} />;
  }
  const cf = camFrame >= 0 ? camFrame : frame;
  return <AthensRomeScene cam={cameraE(cf)} life={frame} reqs={E_REQS} />;
};

export default AthensNotMassive;
