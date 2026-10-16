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
// GESTURES (gesture -> word -> frames). `billion` "gentle" (the default, Tom's note on the
// arrival at "$1B": "too fast ... more gentle when it reaches 1 billion"):
//   the Mercedes tile slides up 24 px, fades and blurs in LIFTED (its shadow
//     grown) and settles onto its contact shadow -> "well, we're" -> f0-10
//   the camera, close (k 3.48) with the tile low and the room above it, is
//     already creeping on f0; the light pool sits on the tile -> f0-
//   the cream bar rises out of the tile's slot to 160 px on ONE decelerating
//     curve from rest to rest (C1G: velocity ∝ t (1-t)^3.25): top speed f16,
//     90 % at f24, then a long soft landing, zero velocity at f35, no settle ->
//     "generating around a billion" -> f10-35
//   the readout rides the bar's top: HERO numerals blurring in at the first
//     $100M (f12.7), an odometer rolling $100M ... $900M with the bar (tabular
//     figures, a vertical blur in proportion to the digits' own speed, so
//     $700M / $800M read as it slows) -> "generating around" -> f13-24
//   "$900M" holds, sharp and still, as the bar reaches the top of its rise ->
//     "around a" -> f24-27
//   the last step, ONE slow drum turn, triggered as the bar reaches the top of its
//     rise (96.9 %) and then on time: "$900M" rolls up and out while "$1B" rolls
//     up and in, one drum pitch (1.22 em) apart so they never overlap, both at
//     full opacity inside a feathered line (soft 0.25 em edges, the only fades);
//     smootherstep over 14 f, a roll blur in proportion to its speed (peak 2 px,
//     f34, 0 at both ends); "$1B" (proportional) lands sharp, centred and still
//     -> "billion" (f29) ... "dollars" (f34) -> f27-41
//   the camera rides the top up and eases back (k 3.48 -> 3.12), then creeps
//     toward the bar's top third into c1_end's framing (k 3.25) -> "generating
//     ... billion ... dollars in revenue" -> f6-124; the light pool follows the
//     bar's middle with the camera's lag
//   REVENUE (caps, creamLo) blurs in under "$1B" as it lands, clear of the
//     line's bottom edge -> "revenue" (f46) -> f39-51
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
// `billion` "quick" renders the delivered cut (Oct 2 2026) bit for bit: the bar
// on a smoothstep f10-27 + a 2.5 px zero-sloped settle f27-35, the odometer's
// last step "$900M" -> "$1B" rolling 1.3 em through a hard window in ~3.4 f
// (f23.7-27), REVENUE f34-46. From f50 on the two differ by at most 2 levels (the
// light pool's lag behind the bar, decaying); from f74 on they are pixel-identical,
// so f124 = cut 2's f0 under both (out/wolff/brown/c1_gentle/proof.txt).
//
// DATA (data.md): Toto's own figures, $1B revenue and a 30 % margin = $300M
// profit; act A's MONEY 160 px / $1B -> bar 160 px, slice 48 px.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = DUR_1;

export const schema = z.object({
  // the arrival at "$1B": "gentle" (Tom's note) or "quick" (the delivered cut, reproducible)
  billion: z.enum(["gentle", "quick"]).default("gentle"),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BillionInRevenueStout: React.FC<Props> = ({ billion }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActAStout S={frame} billion={billion} />
    </AbsoluteFill>
  );
};

export default BillionInRevenueStout;
