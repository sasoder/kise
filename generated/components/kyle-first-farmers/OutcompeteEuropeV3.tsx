// ---------------------------------------------------------------------------
// OutcompeteEuropeV3 (kyle-first-farmers, cut 58, V3). Dwarkesh map style (styles/dwarkesh-map.md).
// V3 = the delivered V1 (OutcompeteEurope.tsx) with the EUROPE label removed (user verdict, Oct 20: "the europe text
// is unnecessary"); camera, front, dots and timing are V1's, unchanged. Not built on OutcompeteEuropeV2.
// Opaque 1080x1920, 29.97 fps, 166 frames.
// The Neolithic Europe world of firstFarmersMap.tsx (tiles: scripts/maps/configs/firstfarmers.mjs) and its front
// model (neolithicFront.ts, baked by scripts/clips/kyle-first-farmers/bake-neolithic-front.mjs).
//
// CHECK LINE: "the farming population spread out of Anatolia across Europe and, by sheer numbers, squeezed the
// hunter-gatherers to the edges — most of the map turns orange, a few cream groups survive."
//
// THE LINE (sequence 58.16-63.70 s): "...They're growing faster, that they, you know, quote unquote, outcompete the
// hunter-gatherer populations, say, of Europe" (the cut then returns to Kyle: "that are largely but not completely
// displaced").
// WORD -> FRAME: they 2 · you know 16-28 · quote 32 · unquote 37 · outcompete 44 · the 64 · hunter 71 · -gatherer 87 ·
// populations 97 · say 112 · of 125 · Europe 128 · (that 156, Kyle continues)
// DURATION: the slot 58.1581 -> 63.6970 s = 5.539 s x 29.97 = 166 frames (f0..f165).
//
// THE MOTION: one continuous pull-back from the Aegean (k 3, western Anatolia already orange, the front stepping
// into Greece) to the whole of Europe (k 1 by ~f116), the camera trailing the front north-west, while the front of
// farming sweeps monotonically across the Balkans, the Danube, central Europe, the Mediterranean coasts to Iberia and
// finally Britain and southern Scandinavia (front date 6600 BC at f0, ~6040 BC at "outcompete" f44, 3800 BC at f140,
// ~3600 BC at f165; the date-of-frame curve is solved from the farmed land area weighted by 1 / k^1.5, so the
// visible change is even and the 5000-4100 BC stall on the North European Plain passes in a few frames). Behind the
// front the orange farmer dots multiply (each born out of an earlier one, pioneers at once, the rest over ~24
// frames); ahead of it the cream forager dots are absorbed (turn orange where the front line touches them) or give
// way (slide ahead into a neighbour the front reaches later): fewer, pushed back, absorbed; nobody dies. No EUROPE
// label in V3 (V1 slid one up f112-126 on its word, f128; the user found it unnecessary). Resolved frame:
// Europe orange from Anatolia to Britain and Denmark; cream groups along the Baltic, in Finland, northern
// Scandinavia and the east, and three cream pockets inside the orange (the Alpine arc, the eastern Carpathians, the
// Atlantic fringe of Brittany: schematic refugia). Last frames: the front
// still creeps into Sweden and Scotland, dots drift and Britain fills, the camera creeps in (k 1 -> 1.02).
// Orange = the farmers (hatch + dots); cream = the foragers. No arrows, ships, years, figures or labels.
//
// SOURCES: arrival dates (cal BC) of first farming at 21 dated anchors from Pinhasi, Fort & Ammerman 2005, PLoS
// Biology 3(12): e410, and Shennan 2018, The First Farmers of Europe (CUP) — the table, with lon/lat, is in
// scripts/maps/configs/firstfarmers.mjs (ANCHORS); approximate model constraints (the Levant/Mesopotamian source,
// Cyprus, the Caucasus, Moldova, central Sweden and Oslofjord, and the zones that stay forager: Finland, northern
// Scandinavia, the forest zone, the Pontic steppe) and the three pockets (terrain-favoured forager refugia; foragers
// lived beside farmers into the 4th millennium BC, e.g. Blatterhohle, Bollongino et al. 2013, Science 342: 479) are
// in the bake script.
// Dot counts are schematic (density, not a census). No year on screen. Modern Natural Earth coasts.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FarmedLand, MapPage, PopulationDots, WorldSvg, runCamera } from "./firstFarmersMap";
import { SPREAD_CAM, SPREAD_DURATION, SPREAD_POP, SPREAD_TIMELINE } from "./firstFarmersOpening";

export const FPS = 30000 / 1001;
export const DURATION = 166;
if (SPREAD_DURATION !== DURATION) throw new Error("firstFarmersOpening is cut F's clock: keep the lengths equal");
export const schema = z.object({ vignette: z.number().min(0).max(1) });
export const defaultProps = schema.parse({ vignette: 0.55 });

// The camera, the front's date of frame and the dot sets live in firstFarmersOpening.ts (cut I opens on this
// cut's Aegean opening): the Aegean at k 3 with the front's leading edge near y 800-850, held there through the
// pull-back, the Europe wide by ~f116 with the land's centre near y 740 (North Cape y ~180, the Mediterranean north
// coast y ~980-1150; only fully orange land, coast and sea in the caption band).
export const CAM = SPREAD_CAM;
export const TIMELINE = SPREAD_TIMELINE;
const POP = SPREAD_POP;

const OutcompeteEuropeV3: React.FC<z.infer<typeof schema>> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);
  const T = TIMELINE.dateAt(frame);
  return (
    <MapPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <FarmedLand T={T} cam={cam} id="oe" wash={0.3} hatch={0.45} />
        <PopulationDots pop={POP} f={frame} cam={cam} />
      </WorldSvg>
    </MapPage>
  );
};

export default OutcompeteEuropeV3;
