import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActA, DUR_1 } from "./wolffActA";
import { FPS } from "./wolffShared";

// ---------------------------------------------------------------------------
// BillionInRevenue — cut 1 of the Toto Wolff "Mercedes F1 financials" clip
// (Cheeky Pint S4E01). Cheeky Pint style: kraft, opaque, 1080x1920, 24 fps.
//
// THE LINE: "Well, we're generating around a billion dollars in revenue and
// 30% profit margin."
// WINDOW: edit 0:03.560 -> 8.099. DURATION = round((8.099 - 3.560) * 24) =
// round(108.94) = 109, + 16-frame tail = 125. Act A story clock S_A = this
// cut's frame (0-124); cut 2 `BackInTheDay` opens on S_A 124 (this cut's
// last frame) pixel for pixel — both render `ActA` from wolffActA.tsx.
//
// ONSETS (f): well 0 · we're 7 · generating 12 · around 21 · a 26 · billion 29 ·
// dollars 34 · in 41 · revenue 46 · and 56 · "30" ~68 (loudness envelope) ·
// profit 84 · margin 96 · speech ends 109.
//
// ONE SENTENCE OF MOTION: one rise and one pour — the revenue bar rises out of
// the Mercedes tile, and the top of it turns to profit.
//
// GESTURES (gesture -> word -> frames):
//   the Mercedes tile slides up 24 px + fades in -> "well, we're" -> f0-10
//   the camera, close (k 2.27) with the tile low and the room above it, is
//     already creeping on f0 -> "well, we're" -> f0-
//   the white bar rises out of the tile's top edge to 160 px on one ease,
//     landing 2 f before its word -> "generating around a billion" -> f12-27
//   the readout rides the bar's top, ticking $100M ... $900M (hard ticks), and
//     lands on "$1B" with the bar; it slides up + fades in from the first
//     $100M (f14.9) -> "around a billion" -> f15-27
//   the camera rides the top up and eases back (k 2.27 -> 2.0) -> "generating
//     ... billion" -> f8-38
//   the bar's zero-sloped settle (2.5 px) -> "billion dollars" -> f27-35
//   "revenue" slides up under "$1B" (INK_LO) -> "revenue" (f46) -> f34-46
//   the camera creeps toward the bar's top third -> "dollars in revenue ...
//     30%" -> f32-92
//   a white hairline descends from the bar's top edge to the 70 % line with
//     the amber filling behind it — the descent IS the pour -> "and 30" ->
//     f56-66 (lands 2 f before "30" ~f68)
//   the hairline fades into the slice's lower edge -> (follow-through of the
//     pour) -> f66-78
//   "30%" (ACCENT) slides up right of the slice, landing f70 — THE ONE CLICK,
//     half-step #FFD98A f70-72 -> "30" -> f58-72
//   "profit" (INK_LO) slides up under it -> "profit" (f84) -> f72-84
//   the hold: the camera creep carries on and decays (it runs on into cut 2;
//     resolved k 2.14, CAM_NOW_END) -> "margin" + tail -> f84-124
// Nothing else.
//
// DATA (data.md): Toto's own run-rate figures, $1B revenue and 30 % margin =
// $300M profit; PX_PER_B 160 -> bar 160 px, slice 48 px. (The filed 2025
// accounts are lower; cut 2 shows the filed history.)
//
// MEASURED (off wolffActA's own tracks + the half-res preview): camJerk max
// |dv| 0.39 screen px/f^2 (f14), camera edge speed <= 4.2 px/f; bar top <= 32.2
// px/f (f20), hairline 14.6; lowest subject ink y 1208 (f124, tile foot +
// contact shadow); resolved labels x 411-740 / y 505-755, inside 120-960 /
// 300-1350, content centre ~y 860; motion-energy 12-f blocks >= 0.18 mean (the
// tail's creep keeps running); join to cut 2: 0 px; NowColumn at CAM_NOW_END
// = this cut's f124, 0 px.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR_1;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BillionInRevenue: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActA S={frame} />
    </AbsoluteFill>
  );
};

export default BillionInRevenue;
