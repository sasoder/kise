import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActAStout, DUR_1 } from "./stoutActA";

// ---------------------------------------------------------------------------
// BillionInRevenueStout — cut 1 of the Toto Wolff "Mercedes F1 financials" clip
// in the STOUT system (stoutShared.tsx; brief out/wolff/briefs/STOUT_MOTION.md).
// 1080x1920, 24 fps, opaque. The delivered BillionInRevenue stays as it was.
//
// THE LINE: "Well, we're generating around a billion dollars in revenue and 30%
// profit margin."
// WINDOW: edit 0:03.560 -> 8.099. DURATION = round((8.099 - 3.560) * 24) = 109,
// + 16-frame tail = 125. Act A story clock S_A = this cut's frame (0-124); cut 2
// `BackInTheDayStout` opens on S_A 124 (this cut's last frame), pixel for pixel.
//
// ONSETS (f): well 0 · we're 7 · generating 12 · around 21 · a 26 · billion 29 ·
// dollars 34 · in 41 · revenue 46 · and 56 · "30" ~68 · profit 84 · margin 96 ·
// speech ends 109.
//
// ONE SENTENCE OF MOTION: one rise and one pour — the revenue bar rises out of
// the Mercedes tile's slot, and the top of it turns to profit.
//
// GESTURES (gesture -> word -> frames):
//   the Mercedes tile slides up 24 px, fades and blurs in LIFTED (its shadow
//     grown) and settles onto its contact shadow -> "well, we're" -> f0-10
//   the camera, close (k 3.48) with the tile low and the room above it, is
//     already creeping on f0; the light pool sits on the tile -> f0-
//   the cream bar rises out of the tile's slot to 160 px on one ease, landing
//     2 f before "billion" (+ a 2.5 px zero-sloped settle, f27-35) -> "generating
//     around a billion" -> f10-27
//   the readout rides the bar's top: HERO numerals blurring in at the first
//     $100M (f13.3), an odometer rolling $100M ... $900M (tabular figures, a
//     vertical motion blur in proportion to the roll), the last step rolling
//     "$900M" out and "$1B" in, landing with the bar (proportional "$1B") ->
//     "around a billion" -> f13-27
//   the camera rides the top up and eases back (k 3.48 -> 3.12), then creeps
//     toward the bar's top third into c1_end's framing (k 3.25) -> "generating
//     ... billion ... dollars in revenue" -> f6-124; the light pool follows the
//     bar's middle with the camera's lag
//   REVENUE (caps, creamLo) blurs in under "$1B" -> "revenue" (f46) -> f34-46
//   the pour: the amber fills the bar's top down to the 70 % line, the cream's
//     lit edge riding the boundary down (the line's descent IS the pour) ->
//     "and 30" -> f56-66; the edge fades into the slice's lower edge f66-78
//   "30%" (SECONDARY, amber, its bloom) blurs in right of the slice and lands
//     f70 — THE ONE CLICK: a light sweep crosses the amber slice f70-80 -> "30"
//   PROFIT (caps, creamLo) blurs in under it -> "profit" (f84) -> f72-84
//   the hold: the camera's creep decays into c1_end; sway, grain on twos ->
//     "margin" + tail -> f84-124
// Nothing else.
//
// DATA (data.md): Toto's own figures, $1B revenue and a 30 % margin = $300M
// profit; act A's MONEY 160 px / $1B -> bar 160 px, slice 48 px.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = DUR_1;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BillionInRevenueStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActAStout S={frame} />
    </AbsoluteFill>
  );
};

export default BillionInRevenueStout;
