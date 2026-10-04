import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DUR, FPS, IcebergWorld, S_4 } from "./icebergShared";

// ---------------------------------------------------------------------------
// TwoHubsStout — cut 4 of Toto Wolff's "no dickheads rule" (Cheeky Pint S4E01), on the iceberg world
// (icebergShared.tsx; brief out/dickheads/briefs/BRIEF.md). 1080x1920, 24 fps, opaque.
//
// THE LINE: "here in the UK we have two hubs, one that does the engine, the other one what we call the
// chassis"
// WINDOW: edit in 0:21.219. DURATION = round(span x 24) = 135, + 16 = 151.
// STORY CLOCK: S = S_4 + f = 295 .. 445; f0 = cut 3's last frame (0 px); cut 5 opens on S 445.
// ONSETS (f): here 0 · in the 3 · uk we 8 · have 21 · two 24 · hubs 28 · one 44 · that 50 · does 55 ·
// (pause) · the 80 · engine 84 · the 94 · other 95 · one 99 · what 105 · we 113 · call 116 · the 120 ·
// chassis 123 · ends 135.
//
// ONE MOTION: down through the waterline to the two hubs, and the light finds each in turn.
// GESTURES (gesture -> word -> frames)
//   one long DIVE down through the waterline into the body, k 2.35 -> 2.05 (f-6 -> f44): the waterline
//     and the tip rise up through the frame and dissolve into the headline's clear band (PASS 3B: the
//     hubs sit 96 px deeper, so from f48 the waterline is above y 248 and the cut happens wholly below
//     it); the two hub tiles (126 px, ~250-290 screen px here; in the DARK with the crowd until now)
//     come into view, centred, the crowd flowing round them; the readout exits as the glide begins (its entrance reversed, f0 -> f12: PASS 3, so it never
//     rises behind the Mercedes headline); the amber helmets are in frame on f0 -> "here in the UK"
//   the light pool follows the look down (leaning left), and as its outer edge reaches each tile the
//     tile rises DARK -> board (13 f): the left on f26.5, the right on f30.5 -> "two hubs" (f24-40)
//   the held breath: the camera creeps toward the left tile, k -> 2.30 (f44 -> f80); the pool travels
//     onto it (f44-66) and reaches it on f68: the tile lifts board -> cream (12 f tone ease) with its
//     knocked-out engine block -> "one that does - (pause) - the engine" (f84)
//   the camera glides right to the second tile (f94 -> f121); the pool reaches it on f114: it lifts to
//     cream with its knocked-out chassis (the F1 car) -> "what we call the chassis" (f123)
//   PASS 3: no ENGINE / CHASSIS labels (the icons carry it); the crowd closes evenly round each tile
//   the camera eases to the pair's centre for the rest, the pair on y 835, k 2.05 (f119 -> f151)
// Tiles never click and never flash. Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR.TwoHubs;
export const S0 = S_4;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const TwoHubsStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <IcebergWorld S={S0 + frame} />
    </AbsoluteFill>
  );
};

export default TwoHubsStout;
