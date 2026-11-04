// ---------------------------------------------------------------------------
// BothComingDown (scott-nolan-orbit, cut 4). Cheeky Pint style (stout) in real 3D (nuclearWorld stage, energyWorld clay,
// costCurveWorld chart). RENDER --gl=angle. Opaque 1080x1920, 23.976 fps, 61 frames.
//
// CHECK LINE: "solar panels and batteries have both got dramatically cheaper over the same years: two price curves
// plunging side by side."
//
// THE LINE (John): "...because both are coming down a very aggressive cost curve, [and so you could...]"
// WORD -> FRAME: both -9 · are 4 · coming 12 · down 16 · a 22 · very 24 · aggressive 28 · cost 37 · curve 47 · and 54
// DURATION: the slot 4.379 -> 6.924 s (sequence f105 -> f166) = 61 frames at 24000/1001 (f0..f60).
//
// THE MOTION (rev 2, 3/4 view): one continuous plunge on a graph. On f0 the camera (elevated 20 deg, yawed 24 deg round to
// the right, settling to 14) holds the shared 2010 start high in frame with the rail's 2010 end below it; the battery sits
// on the battery tip and the solar panel (a tilted panel on legs) on the solar tip, both tips already drawing. f2-13 a thin
// cost axis draws up from the rail's 2010 end to just above the start (an L with the rail), 2010 rises out of the board
// f6-16 and COST comes in at the axis top f9-19. Solar is bright cream clay (the lit subject), batteries exactly the board
// tone; each object wears its line's tone. The tubes draw down-right together to 2025 (cutAYearAt: tips reach 2025 on
// f44), crossing and re-crossing over a soft contact darkening on the board, while the camera pans and orbits right,
// bringing the 2025 end in; 2025 rises f31-41. f44-60: settled and alive (slow drift, the panel's glint, grain). Cut B
// opens on f60 (cutAState.ts).
// AMBER = the sun's power: none in this cut, deliberately (cut B gives it to the solar curve). Cream = solar and its
// panel (the subject), board tone = batteries and their cell, inkCreamLo = COST, the espresso board the ground.
//
// SOURCES (costData.ts; the director's FACT_CHECK.md and data/, retrieved 2026-11-04). No prices on screen; each series is
// plotted as an index of its own 2010 value on one unlabelled log scale, only the rows in the data, straight between them.
// Solar: Our World in Data "Solar photovoltaic panel prices" (Nemet / Farmer & Lafond / IRENA), constant 2025 US$/W,
// 2010 $2.51 -> 2025 $0.12 (-95.2 %). Batteries: BloombergNEF Li-ion pack price survey, real 2025 US$/kWh, 2010 $1,474 ->
// 2025 $108 (-92.7 %); 2011-2023 digitized off BNEF's Figure-17 (+/- ~10 $/kWh), 2024 implied by the stated 8 % drop.
// Years on screen: 2010, 2025 (the data's own first shared and last year).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { NuclearStage } from "../scott-nolan-uranium/nuclearWorld";
import { CostChart } from "./costCurveWorld";
import { CUT_A_BOARD_UNITS, CUT_A_DURATION, CUT_A_POOL, CUT_A_S0, cutACamAt, cutAChartAt } from "./cutAState";

export const FPS = 24000 / 1001;
export const DURATION = 61;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (CUT_A_DURATION !== DURATION) throw new Error("cutAState's duration must match BothComingDown");

const BothComingDown: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = CUT_A_S0 + f;
  const cam = cutACamAt(f);
  return <NuclearStage cam={cam} S={S} boardUnits={CUT_A_BOARD_UNITS} pool={CUT_A_POOL} world={<CostChart S={S} {...cutAChartAt(f)} />} />;
};

export default BothComingDown;
