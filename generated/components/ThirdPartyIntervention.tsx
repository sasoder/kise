import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldScene } from "./worldShared";
import { CUT2_G0, CUT2_DURATION, FPS } from "./worldCamera";

// ---------------------------------------------------------------------------
// ThirdPartyIntervention: Sarah Paine, "Both sides overreached in Korea", cut 2
// of the world pair (delivered as 10_ThirdPartyIntervention.mov):
//   "until he triggered the third party intervention from hell, which is when
//    the United States and UN partners got involved."
// IN-POINT 10.599 s = f0 = global G0. Speech 6.221 s -> round(6.221 x 24) =
// 149, + the 16-frame house tail: DURATION = 165 frames, 24 fps.
// Word onsets (frames): until 0 · he 10 · triggered 17 · the 26 · third 31 ·
// party 37 · intervention 45 · from 55 · hell 62 · which 75 · is 79 · when 82 ·
// the 85 · united 88 · states 93 · and 102 · U N 107 · partners 120 · got 128 ·
// involved 134.
// ONE GLOBAL CLOCK with CivilRegionalGlobal: this cut is G 0..164, that one
// G 149..372. The picture is a pure function of G (worldShared.tsx,
// worldCamera.ts), so this cut's last 16 frames and CivilRegionalGlobal's
// first 16 are pixel-identical (asserted by a pixel diff at preview).
//
// DWARKESH MAP STYLE, world scale: Natural Earth on Equal Earth, north-up,
// Pacific-centred (centre meridian 146 E), sea #1B2226, land #3F3428 + rim,
// cream #E9DDBF at two opacities (INK_HI 0.9 / INK_LO 0.5), 4 engraved
// water-lines, graticule, baked mottle, screen grain, vignette; the world's
// edge printed on a dark page. Borders of 1950, only round the polities the
// story lights (see scripts/build-world-map.mjs). ORANGE = the overreach only:
// the North's hatch and its army. Everyone else is cream.
//
// THE GESTURES, each with its word:
//   1. "until he triggered" f0-30: close on Korea (k 22 -> 22.66, a 3 % creep:
//      the held breath). The North's orange hatch covers the peninsula down to
//      the Pusan Perimeter of 4 Aug 1950 (dashed orange edge over land only),
//      the 38th faint under it; 23 orange dots press on the perimeter (each
//      leans toward the line on its own slow beat), 31 cream dots in the pocket.
//   2. "the third party intervention from hell" f30-82: ONE long eased
//      pull-back out over the Pacific (k 22.66 -> 2.2, zoom about Korea while
//      Korea slides left to x ~148); Japan, China, the ocean and its engraved
//      water-lines open up, flowing into move 3 with no plateau.
//   3. "the United States" f80-101: the camera travels on east/out until the
//      USA is in frame (~f80, k 2.2 at f82); UNITED STATES slides up from f80
//      (landed f94); the USA lights from f84 (0.15 cream wash + cream
//      hatch INK_LO + INK_HI outline, the lit treatment everywhere) spreading from San Francisco inland to Maine, Alaska and
//      Hawaii by f101; its thin cream arc draws SF -> Pusan across the North
//      Pacific f92-110.
//   4. "and UN partners got involved" f102-128: the 15 other partners light in
//      a wave ordered by distance from Korea (Philippines f102 ... Colombia
//      f113), each spreading from its port/capital over 10 f, then its arc
//      draws to Pusan over 12 f (3 f after it lights); the last lands f128.
//      The camera settles on the whole-world wide at f128, 6 f before
//      "involved": k 1.297 (K_WIDE, the largest k at which every lit polity
//      sits inside the frame with 44 px margins: France x 44 on the left,
//      Colombia x 1036 on the right; the oval's ends cropped by the frame),
//      band centred on y 835, Korea at x 447. No partner names.
//   5. "got involved" f126-164: small cream packets leave every origin and
//      flow along the arcs into Pusan (the involvement); the camera creeps
//      (k x1.01) and from ~f138 gathers into cut 3's push back to Korea (the
//      shared G149-164 frames). UNITED STATES starts to fade at f149.
// China and the USSR stay unlit (they are cut 3's).
// Arcs: schematic quadratic bows in projected space through a via point over
// sea (the Suez / Indian Ocean route for Europe, Turkey, Ethiopia, South
// Africa; the North Pacific for the Americas); never over Siberia. One stroke
// weight (1.6 px), INK_LO.
//
// SOURCES: Pusan Perimeter of 4 Aug 1950, 38th, Pusan: korea1950Fronts.ts
// (Appleman, "South to the Naktong, North to the Yalu", US Army CMH 1961, map
// III; West Point atlas; ~0.1 deg). Strengths early Aug 1950 (Appleman ch.
// XIII; Wikipedia "Battle of the Pusan Perimeter"): KPA ~70,000 on the
// perimeter -> 23 dots, UN ~92,000 inside it (ROK ~45,000 + US ~47,000) -> 31
// dots, 1 dot = 3,000 men. The 16 UN combat contributors: UN Command /
// Wikipedia "United Nations Command" (USA, UK, Canada, Australia, New Zealand,
// France, Netherlands, Belgium, Luxembourg, Greece, Turkey, Philippines,
// Thailand, Ethiopia, Colombia, South Africa).
// ---------------------------------------------------------------------------

export const DURATION = CUT2_DURATION;
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

const ThirdPartyIntervention: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  return <WorldScene g={CUT2_G0 + frame} {...props} />;
};

export default ThirdPartyIntervention;
