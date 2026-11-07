// ---------------------------------------------------------------------------
// HydraDozenHeads (caro-firing-moses, cut 15.125). The show's own hydra pictogram (not a kise style file: the look
// is the original 16:9 graphic, notes/reference/orig_hydra_seq15.125-17.750.mp4 and hydra_seqf*.png), re-staged
// 9:16. Parts in firingShared.tsx. Opaque 1080x1920, 24 fps, 63 frames.
//
// CHECK LINE: "Moses was one body with a dozen heads."
//
// THE LINE: "...Moses was a hydra with a dozen heads. He held 12 different government posts"
// WORD -> FRAME: (hydra -9) · with -1 · a 9 · dozen 12 · heads 19 · He 27 · held 29 · 12 35 · different 43 ·
// government 50 · posts 57.
// DURATION: the slot 15.125 -> 17.750 s = 2.625 s x 24 = 63 frames (f0..f62).
//
// THE MOTION: no fade, no camera move. f0 is the grey ground, the black dome and the first two necks already
// rising out of it; the necks grow out of the body (rising out of it as they lengthen) one after another in a sweep from left to right (each a spring
// on its own scale about its root, 1.5 f apart, heads riding the tips), all twelve out by f23 ("heads" f19) and
// settled by ~f30. Then a living hold: every neck sways about its root (0.9 deg) and every head tilts a little, on
// its own period, driven by the global clock that TwelvePosts and HydraHands continue.
//
// FRAMING (rev 1, coordinator Nov 7): the hydra sits HYDRA_DY (160) lower than the first pass so the mass is near
// the frame middle: head tips x 150-915, the top heads' tips y ~491-506, the lowest heads at y ~1000. The body is the
// creature's back rising from below the frame: a broad faceted dome from y 1104 (x 390-690 on top) widening to
// x 40-1040 off the bottom edge, as the original's body is cut by its frame (no text on it). While a neck grows it
// also rises 140 px out of the body, so every head starts hidden inside it. The right-most heads stay inside x 920.
//
// JOIN: the last frame (f62, global G 62) is TwelvePosts' f0 (same functions of G; see TwelvePosts).
// SOURCES: none (no figures). Artwork traced from notes/reference/hydra_seqf418.png.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FIRING_GLOW, FiringGlowDefs, FiringGround, HDH_DURATION, Hydra, NECK_COUNT, growAt } from "./firingShared";

export const FPS = 24;
export const DURATION = HDH_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** The whole picture at global frame G (also TwelvePosts' frame 0). */
export const HydraOpening: React.FC<{ G: number }> = ({ G }) => {
  const heads = Array.from({ length: NECK_COUNT }, (_, i) => ({ grow: growAt(i, G) }));
  return (
    <AbsoluteFill>
      <FiringGround G={G} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <FiringGlowDefs />
        <g filter={`url(#${FIRING_GLOW})`}>
          <Hydra G={G} heads={heads} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const HydraDozenHeads: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return <HydraOpening G={frame} />;
};

export default HydraDozenHeads;
