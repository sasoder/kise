import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldScene } from "./worldShared";
import { CUT3_G0, CUT3_DURATION, FPS } from "./worldCamera";

// ---------------------------------------------------------------------------
// CivilRegionalGlobal: Sarah Paine, cut 3 of the world pair (delivered as
// 16_CivilRegionalGlobal.mov):
//   "Then what was a civil war becomes a regional war, with potential to become
//    a global war, and you're off to a completely different race, much higher
//    cost."
// IN-POINT 16.820 s = f0 = global G149 = round((16.820 - 10.599) x 24). Speech
// 8.660 s -> round(8.660 x 24) = 208, + the 16-frame house tail: DURATION =
// 224 frames, 24 fps.
// Word onsets (local frames; + 149 = global): then 0 · what 10 · was a 21 ·
// civil 28 · war 34 · becomes 41 · a 52 · regional 58 · war 66 · with 75 ·
// potential 81 · to 91 · become 96 · a 101 · global 105 · war 112 · and 121 ·
// you're 131 · off 135 · to a 140 · completely 145 · different 157 · race 166 ·
// much 183 · higher 191 · cost 197.
// ONE GLOBAL CLOCK with ThirdPartyIntervention (worldShared.tsx,
// worldCamera.ts): f0-15 here are that cut's last 16 frames, pixel-identical.
//
// ONE RING, one continuous motion. THE GESTURES, each with its word:
//   1. "then what was a civil war" f0-30: from cut 2's world wide the camera
//      pushes back in to Korea in one long move (it gathers from G140; k 1.1
//      at f0 -> 5.6 at f24, then a 4 % creep to f37). The partners, arcs and
//      packets drop to the low rung (x0.5, f0-27) and stay; the packets slow
//      (1/40 -> 1/72 of an arc per frame) but keep flowing. UNITED STATES fades
//      f0-14. An engraved cream ring (a small circle on the sphere, 6 deg round
//      the middle of the peninsula, INK_HI, 2.4 px) draws clockwise from the
//      north f3-26; CIVIL slides up on its top from f20 (landed on "civil").
//   2. "becomes a regional war" f36-66: the ring GROWS to 28 deg (f36-60) and
//      the camera pulls back with it (k 5.82 -> 4.0) so it stays in frame. From
//      "becomes" the ring carries the war: the PRC and the USSR light in cream
//      (wash + hatch + outline, the partners' treatment) where they are inside the ring (country ∩ ring interior), so the
//      colour spreads with the edge (the Philippines, inside 28 deg, comes back
//      up the same way). CIVIL fades as REGIONAL slides up from f50.
//   3. "with potential to become a global war" f72-115: on "potential" the
//      ring turns DASHED (f77-87, potential = not yet) and grows 28.8 -> 75 deg
//      by "global" (f105: the 48 states) -> 92 deg (f119), the camera pulling
//      to the whole-world wide (k 1.297, every lit polity inside with 44 px
//      margins; landed f101, 4 f before "global"). The lit
//      partners come back up to the high rung as the dashed edge passes over
//      them (partner ∩ ring interior at full). REGIONAL slides round the ring
//      toward the Pacific as the ring passes the pole and fades as GLOBAL
//      slides up from f97, riding the ring in the open Pacific.
//   4. "and you're off to a completely different race, much higher cost"
//      f101-223: after a short creep on the wide (x1.012 by f115), ONE slow
//      push from the world back INTO Korea, the bookend to cut 2's pull-back:
//      ln k's velocity a trapezoid with smoothstep shoulders (f115-133 up,
//      held, f171-199 down to a creep), k 1.31 -> 7.4 at f189 -> 8.8 on the
//      last frame, Korea eased to x 540, y ~830. The atlas plate's top edge
//      leaves the frame at f189, so "much higher cost" (f183-197) lands on a
//      full frame; still creeping on the last frame. The dashed ring
//      (breathing out to 103 deg) and GLOBAL leave frame naturally; the arcs
//      keep entering from every frame edge. The packets pouring into Korea
//      speed up and thicken on "completely different race" (f145-166: 1/34 of
//      an arc per frame, emitted every 3.5 f, back to the high rung, larger)
//      and again on "much higher cost" (f183-197: 1/22, every 2 f). Through
//      the push, packets and strokes keep a constant SCREEN size, and the
//      packets a near-constant SCREEN speed (phase rate / zoom gained^0.7,
//      <= ~42 px/f in the close), so the surge's packets reach Pusan inside
//      the close frame: many small packets streaming in from every arc.
//      Still flowing on the last frame.
// The ring words are the only text: one at a time, small, riding the ring.
// Colombia (132 deg from Korea) and South Africa (113 deg) lie beyond the
// ring's last 103 deg and stay on the low rung: the war is still only
// "potential" there.
//
// SOURCES: as ThirdPartyIntervention (korea1950Fronts.ts, Appleman ch. XIII,
// UN Command). Distances are great-circle degrees from the peninsula's middle
// (127.7 E, 38.3 N).
// ---------------------------------------------------------------------------

export const DURATION = CUT3_DURATION;
export { FPS };

export const schema = z.object({
  grainSrc: z.string(),
  mottleSrc: z.string(),
  vignette: z.number(),
  usLabel: z.string(),
  words: z.object({ civil: z.string(), regional: z.string(), global: z.string() }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  grainSrc: "manchuria/grain.png",
  mottleSrc: "manchuria/mottle.png",
  vignette: 0.55,
  usLabel: "UNITED STATES",
  words: { civil: "CIVIL", regional: "REGIONAL", global: "GLOBAL" },
});

const CivilRegionalGlobal: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  return <WorldScene g={CUT3_G0 + frame} {...props} />;
};

export default CivilRegionalGlobal;
