import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { PlanPage } from "./incaShared";
import { DURATION, FPS, LAST, LOOK } from "./hundredMotion";
import { HundredLayers, openingCam } from "./hundredOpening";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// HundredAgainstHundredThousand. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cajamarca_infinite_KD" (Pizarro at Cajamarca, 16 Nov 1532), on the
// shared Peru world, read-only (incaShared.tsx: the Cajamarca local plan, the
// camera runners, CanvasDots; vastArmyMotion.ts: the settled 80,000 and its
// road frame; ambushMotion.ts: the 6,000 in the square and the 168 at their
// posts). Everything new is in hundredMotion.ts (all motion, as pure maths;
// the looks), hundredOpening.tsx (the drawing: HundredLayers, shared with the
// cut before this one) and hundredShared.ts (the dead look, shared with
// KdRatioOfInfinity).
//
// f0 IS A JOIN FRAME. A cut plays directly before this one ("he has some 160,
// 190 conquistadors", 3.74-6.92 s): it lands "168" itself and ends on exactly
// this f0 picture, drawing f-91..-1 of this timeline through
// HundredOpeningLayers on openingCam (the opening creep continues backwards:
// camAt is valid from f-100), so the two play as one shot.
// The line: "100 something against almost 100,000. What is astonishing is that
// these 100 conquistadors kill close to 10,000 of the enemy. They suffer zero
// casualties. This is the first encounter."
//
// TIMELINE. In-point 7.54 s on the edit timeline (the SRT); word onsets from
// the word-level re-transcription; f = round((t - 7.54) * 24):
//   100 f0 · something f8 · against f17 · almost f32 · 100,000 f40 (ends f57) ·
//   What f61 · is f65 · astonishing f67 · is f79 · that f93 · these f96 ·
//   100 f101 · conquistadors f105 · KILL f119 · close f128 · to f134 ·
//   10,000 f136 · of f149 · the f154 · ENEMY f156 (ends f161) · They f165 ·
//   suffer f169 · ZERO f174 · casualties f180 (ends f191) · This f191 ·
//   is f196 · the f197 · first f200 · ENCOUNTER f205 (ends 16.54 s).
// DURATION: "100" 7.54 s -> "encounter" ends 16.54 s = 9.00 s;
// round(9.00 * 24) = 216, + the 16-frame house tail = 232 frames (f0..f231).
//
// DWARKESH MAP STYLE on the Cajamarca local plan: the umber page (PlanPage:
// mottle, grain, vignette), the 1532 plaza as an engraved cream plan
// (PlazaPlan), the causeway to the camp at the context rung. Opaque
// 1080x1920, 24 fps. 1 dot = 1 man everywhere.
//
// COLOUR RULE: orange (#FFB000) = PIZARRO'S SIDE only: his 168 men (CrowdDots,
// cased). Everything Inca is cream #E9DDBF. Nothing else is coloured.
// THE TWO STATES OF A CREAM MAN (hundredShared):
//   living  the square's 6,000 at the full rung (0.94) as separate dots with
//           daylight between them at every framing (radius 0.53 px x k = 0.36
//           of their 1.46 m spacing: 1.06 px at k 2), no casing; the plain's
//           80,000 a stipple of six interleaved low-alpha layers (the fields
//           and camp at 0.66, the three divisions at 0.40 in the wide, so the
//           divisions measure ~0.25-0.38 tone, p95 <= 0.54, never a slab)
//   dead    cream at DEAD_OP 0.26, radius DEAD_R_SCALE 0.85 x the living,
//           no casing: a dark tide over the bright square. A man dies when the
//           mechanism reaches him: he eases from living to dead over 6 f and
//           settles 0.6 m (a fall), then never moves again.
// Element types: the plan, cream living men, cream dead men, orange men and
// two numerals. Nothing else: no arrows, rings, glows, flashes, trails, red,
// labels or other numbers; "8,000" / "10,000" are never written.
//
// THE GESTURES (revision 2: one camera track, five moves; each gesture starts
// before its word and lands on it):
//   1. "100 something" f0. Close on the plaza (k 2.0, its box centred on
//      (540, 815)), the camera creeping (the pre-roll's 3.5 % creep in and
//      leftward drift). The square packed with 6,000 separate men; the 168 at
//      full orange at their posts (the 62 horse in the three halls, Pizarro's
//      25 and Candia's 9 on the platform, 72 at the gates). "168" (IM Fell
//      English roman, 160 px, the full rung) already stands under the plaza
//      (the cut before landed it).
//   2. "against almost 100,000" f1-f42. One eased pull-back k 2.0 -> 0.2 (peak
//      8.3 %/f on f20, within 2.5 % by f38), the plaza gliding to (200, 764):
//      the army fills the frame to the right and runs off it (the camp off the
//      edge). "168" drops to the context rung (f14-f24) and fades (f22-f34).
//   3. "What is astonishing" f44-f80. A held breath, a 3 % creep in; the army
//      breathes (0.3 px drift), the last stragglers settle (f67).
//   4. "is that these 100 conquistadors" f70-f118. One push in onto the plaza,
//      k 0.2 -> 2.2 (slow start, peak 7.05 %/f, within 1.6 % on f114, 5 f
//      before "kill"), its box centre to (460, 835): room east for the riders.
//      The 62 horse leave their halls (f103 W, f108 NE / SE) at a walk across
//      the square (11 m/f, <= 26 px/f), the men in their way shoving aside.
//   5. "KILL" f119, "close to 10,000 of the enemy" f128-f161. The camera holds
//      (a 3 % creep in) while the death front leaves the hall fronts, the gate
//      foot and the platform on f117 and crosses the bright square by f140: a
//      dark tide (4,800 fall where they stand). 1,200 press out through the
//      gates; 600 fall at the street mouths (by f151). The foot follow the
//      front in. The horse burst out beside the platform on the open-country
//      side (f115-f121) and ride east in three loose groups. From f126 the
//      camera follows them: one eased pull-back with a pan east, k 2.2 -> 0.62
//      (peak 4.75 %/f), landing on f166 with the plaza at (250, 680) and the
//      riders reaching the front division, which they cut three lanes
//      through (at d -230 / 0 / +240 m round the road), the riders always in
//      frame at <= ~30 px/f.
//   6. "They suffer ZERO casualties" f166-f191. The camera holds, creeping on
//      out (2.5 %): the riders finish their lanes through the front division,
//      the dark plaza with the 106 orange foot standing among the dead (each
//      man apart: >= 9 m, 5.5 px). "0" (the same style and anchor as "168",
//      160 px where it lands) slides up under the plaza from f166, full on
//      "zero" (f174).
//   7. "This is the first encounter" f190-f231. One slow pull-back (k 0.61 ->
//      0.43, at most 1.3 %/f, still moving on the last frame), the plaza
//      gliding to (300, 700): the dark plaza, the lanes, every rider in frame.
//      "0" drops to the context rung (f192-f204).
// The deaths: the square's 5,400 by f151; the fields' 2,600 as the riders
// pass (within 25 m of a rider's path, from the 2,705 there), all begun by
// f190 and eased by f196: 8,000 asserted.
//
// COUNTS AND SOURCES (SP/FACTS.md, the director's fact sheet; never on screen).
//   The 168 = 62 horse + 106 foot (Hemming; Lockhart, The Men of Cajamarca:
//     Xerez's muster of 177 less the 9 who went back); the speaker says
//     "160, 190". Their posts are LetsOffTheAmbush's after the trap opened
//     (horse 21 / 20 / 21 in the three halls: Mena p.240, Trujillo p.53;
//     Pizarro + 24 on the platform, Trujillo p.53; Candia + 8 arquebusiers,
//     Mena p.240; 72 at the gates, Mena p.240, Xerez p.51).
//   "Almost 100,000" = 80,000 + 6,000 = 86,000 dots: Atahualpa's army
//     "nearly 80,000" (Hemming 1987 p.36 / 1993 pp.31-32; Mena's upper
//     figure, p.238; the eyewitnesses mostly say 40,000), settled in
//     VastExpanseOfHisArmy's three divisions and fields back to the camp at
//     the springs; the 6,000 in the square ("five or six thousand", Hernando
//     Pizarro p.117).
//   The dead: 8,000 (Trujillo p.55, an eyewitness and the highest primary
//     figure: "more than two-thirds" smothered in the plaza and the blocked
//     streets). The published range is 2,000 (Xerez pp.57-58) to 10,000 (Titu
//     Cusi via Prescott); Mena gives 6,000-7,000 (p.244). Laid out as 4,800 in
//     the square + 600 at its street mouths (5,400, two-thirds) + 2,600 in the
//     riders' lanes through the front division (0.72-1.1 km out).
//   The pursuit: "more than half a league" (Trujillo p.55) = ~2.8 km east
//     along the road toward the camp; the cut shows its first ~1.3 km (the
//     riders still riding at the end). Three groups of horse under Hernando
//     Pizarro, Soto and Benalcazar (Mena p.240; which captain took which lane
//     is not recorded).
//   Spanish dead: none (FACTS section 4: the only Spanish wound was Pizarro's
//     hand, Hernando Pizarro pp.118-119, Xerez p.55).
//   The plaza is the world's schematic (incaShared PLAZA; FACTS section 3);
//     the way out "towards the open country" beside the fortress (Xerez p.45)
//     and the wall the crowd broke (Xerez p.55) are drawn as the riders'
//     crossing beside the platform, not as a breach.
//
// CAMERA (hundredMotion: ln k and the plaza's screen point, each the integral
// of cosine-tapered velocity bumps on shared windows; the house sway on top):
// see the camScan table in the build report. Zoom reversals only on ~f1, ~f43
// and ~f128.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  crowdOpacity: z.number(), // the square's living rung (cream, in play)
  armyMax: z.number(), // the plain's cream where it is densest (never solid)
  roadOpacity: z.number(), // the causeway's rung (context)
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  crowdOpacity: LOOK.crowdOpacity,
  armyMax: LOOK.armyMax,
  roadOpacity: LOOK.roadOpacity,
});

const HundredAgainstHundredThousand: React.FC<Props> = ({ vignette, crowdOpacity, armyMax, roadOpacity }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const cam = openingCam(fi);
  return (
    <PlanPage cam={cam} vignette={vignette}>
      <HundredLayers cam={cam} frame={fi} crowdOpacity={crowdOpacity} armyMax={armyMax} roadOpacity={roadOpacity} />
    </PlanPage>
  );
};

export default HundredAgainstHundredThousand;
