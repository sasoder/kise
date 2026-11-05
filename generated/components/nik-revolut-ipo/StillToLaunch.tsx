// ---------------------------------------------------------------------------
// StillToLaunch (nik-revolut-ipo, cut 4). Cheeky Pint style (stout) in real 3D (scott-nolan-uranium/nuclearWorld.tsx's
// NuclearStage; the slab map and floor are the clip-local copy revolutWorld.tsx with a second tone channel).
// Opaque 1080x1920, 23.976 fps, 118 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "Revolut is big in Europe and a few other places, but the US and a whole set of new countries are still
// to launch — that's the work in progress before an IPO."
//
// THE LINE (Nik Storonsky, Revolut CEO, on what needs to be true before the IPO): "I mean, it's still a work in
// progress, right? We need to launch US, we need to launch a lot of our new expansion markets."
// WORD -> FRAME (words.json, f = round((t - 4.963) x 24000/1001)): mean 2 · it's 8 · work 17 · progress 21 · right 31 ·
//   We 34 · need 40 · launch 46 · US 51 · we 63 · launch 69 · a 74 · lot 78 · our 86 · new 91 · expansion 93 ·
//   markets 100 · (slot ends 118, cut back to the speaker)
// DURATION: the slot 4.963 -> 9.885 s = 4.922 s x 23.976 = 118 frames (f0..f117).
//
// THE MOTION: one camera flight over the stout slab world (stillToLaunchCam.ts). f0 is already gliding, close on
// Europe lit cream (Revolut's home), the Atlantic open on the left; the camera crosses the Atlantic west and settles on
// the US by "launch" (f46), which warms from cream to amber west -> east and lifts out of the slab on "US" (f50-60).
// Without a stop the camera then cranes up and back east to a near-overhead hold (pitch 61), the band of land from the
// Americas to India filling the width and sitting low in the frame (~y 480-1180; Argentina's tip runs into the first
// caption band), while an amber wave lights the expansion markets one after another on "launch" (f69): Colombia, Peru,
// Argentina, South Africa, the UAE, India, the last settled on f98 before "markets" (f100). The crane's slow tail and
// the grain keep the hold alive to the cut. (An oblique pitch-45 hold and a yawed diagonal hold were tried and dropped:
// at full US-India width the first squashes the band, the second turns the continents sideways.)
// AMBER = still to launch (the roadmap); CREAM = where Revolut operates today; BOARD = the rest of the world.
// UAE is small at the hold, so it lifts higher (raise 2.6) and the stage's fixed amber bloom carries it; no pins.
//
// SOURCES (verified by the director, brief_StillToLaunch.md):
//  - current markets (cream): Revolut 2025 annual results, 24 Mar 2026 ("operating as a licensed bank in over 30 of our
//    40 markets"): EEA (EU 27 + Iceland, Liechtenstein, Norway), UK, Switzerland, Australia, New Zealand, Japan,
//    Singapore, Brazil, Mexico (full bank since Jan 2026), United States (partner banks today).
//    https://www.revolut.com/en-AT/news/revolut_reports_record_profit_of_2_3bn_for_2025_as_revenue_surges_to_6bn/
//  - US (cream -> amber): national bank charter filed Mar 2026, OCC conditional approval Sep 2026, launch targeted 2027.
//  - expansion (board -> amber): Revolut "Global HQ" release, 23 Sep 2025 (Colombia, Argentina; India "preparing to
//    launch"; South Africa "first push into Africa"; UAE in-principle licence), Peru bank licence application Jan 2026.
//    https://www.revolut.com/en-AU/news/revolut_unveils_global_hq_setting_out_global_vision_and_ambitious_timeline_for_100_million_customers/
//  - land: world-atlas countries-50m (Natural Earth), the tall Miller map of nuclearWorld. The slab drops land under
//    islandMin 1.2 sq units: Malta, Liechtenstein and Singapore are not drawn (too small to read at any frame here).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { NuclearStage } from "../scott-nolan-uranium/nuclearWorld";
import { CURRENT_MARKETS, EXPANSION } from "./revolutGeo";
import { RevolutWorld, US_OUTSIDE_LOWER48, useRevolutBoard, type CountryTone } from "./revolutWorld";
import { DURATION as CAM_DURATION, US_LEN, US_ON, WAVE, WAVE_LEN, camAt } from "./stillToLaunchCam";

export const FPS = 24000 / 1001;
export const DURATION = 118;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (CAM_DURATION !== DURATION) throw new Error("StillToLaunch: camera track length differs from DURATION");

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const FOG: [number, number] = [1.9, 7];
const BOARD_UNITS = 560;
const ISLAND_MIN = 1.2;
const RAISE: Record<string, number> = { US: 1, AE: 2.6 };

const tonesAt = (f: number): Record<string, CountryTone> => {
  const t: Record<string, CountryTone> = {};
  for (const c of CURRENT_MARKETS) t[c] = { cream: 1 };
  t.US = { cream: 1, amber: smooth(US_ON, US_ON + US_LEN, f), raise: RAISE.US };
  // Alaska, Hawaii and the Aleutians stay cream: the amber is the lower 48 only (a clipped Alaska read as a stray sliver)
  t[US_OUTSIDE_LOWER48] = { cream: 1 };
  for (const c of EXPANSION) t[c] = { cream: 0, amber: smooth(WAVE[c], WAVE[c] + WAVE_LEN, f), raise: RAISE[c] ?? 1 };
  return t;
};

const StillToLaunch: React.FC<z.infer<typeof schema>> = () => {
  useRevolutBoard();
  const f = useCurrentFrame();
  const cam = camAt(f);
  // the cream light pool rides with the subject: Europe, then the US, then the middle of the world
  const pa = smooth(-10, 46, f);
  const pb = smooth(52, 100, f);
  const pool = { x: lerp(lerp(600, 520, pa), 520, pb), y: lerp(lerp(760, 840, pa), 800, pb), strength: 1 };
  return (
    <NuclearStage
      cam={cam}
      S={f + 300}
      fog={FOG}
      boardUnits={BOARD_UNITS}
      floor={false}
      pool={pool}
      world={<RevolutWorld cam={cam} tones={tonesAt(f)} boardUnits={BOARD_UNITS} fog={FOG} islandMin={ISLAND_MIN} />}
    />
  );
};

export default StillToLaunch;
