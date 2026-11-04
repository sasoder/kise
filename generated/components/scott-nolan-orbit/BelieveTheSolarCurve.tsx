// ---------------------------------------------------------------------------
// BelieveTheSolarCurve (scott-nolan-orbit, cut 11). Cheeky Pint style (stout) in real 3D (nuclearWorld stage, energyWorld
// clay, costCurveWorld chart). RENDER --gl=angle. Opaque 1080x1920, 23.976 fps, 113 frames.
//
// CHECK LINE: "solar's price curve has fifty years of data behind it and he trusts it; the battery curve only starts in 2010."
//
// THE LINE (Scott): "I believe the solar cost curve. I haven't seen data that's as compelling on the battery cost curve.
// [That could be coming.]"
// WORD -> FRAME: I -4 · believe 2 · the 8 · solar 12 · cost 19 · curve 26 · I 32 · haven't 42 · seen 47 · data 53 ·
// that's 61 · as 67 · compelling 69 · on 78 · the 84 · battery 86 · cost 94 · curve 100 · that 107
// DURATION: the slot 11.428 -> 16.141 s (sequence f274 -> f387) = 113 frames at 24000/1001 (f0..f112).
//
// THE MOTION: B opens on cut A's last frame (f60, the 3/4 view: cream solar and board-tone battery curves 2010 -> 2025,
// the panel and the cell on their tips, the COST axis at 2010) and continues it. The solar curve grows BACK in time from
// its 2010 point, up and to the left, drawn by its beaded tip through every yearly row to 1975 (f1-27, believeState
// DRAW), while one camera move eases back, up and left until the whole 51-year line fits (~f30). On "believe" amber, the
// sun's power, spreads along the solar line (f1-30): the new growth is drawn amber and the front runs right over
// 2010 -> 2025 to the panel; it stays. The COST axis and the rail's corner slide out with the tip (one eased slide, the
// tip's clock) so the axis stays the chart's left edge, and 1975 rises out of the board under the new start (f25-37).
// The camera glides on (a slow swing round and settle in) and on "...on the battery cost curve" the short battery line
// and its cell step from board tone toward the ground (f72-86): the dim side of the comparison, nothing before 2010.
// Resolved from ~f90: the long amber line beside the short dim one, years 1975 / 2010 / 2025, the camera still drifting.
// Year labels and COST hold their screen size through the pull-back (cap and gap eased with the camera).
// AMBER = the sun's power (solar energy): only the solar curve, from f1.
//
// SOURCES (costData.ts; the director's FACT_CHECK.md and data/, retrieved 2026-11-04). No prices on screen; each series is
// an index of its own 2010 value on one unlabelled log scale (costCurveWorld), only the data rows, straight between them.
// Solar: Our World in Data "Solar photovoltaic panel prices" (Nemet 1975-2003 / Farmer & Lafond 2004-2009 / IRENA from
// 2010), constant 2025 US$/W, 1975 $132.38 -> 2010 $2.51 -> 2025 $0.12: 51 yearly rows. Batteries: BloombergNEF Li-ion pack
// price survey, real 2025 US$/kWh, 2010 $1,474 -> 2025 $108 (2011-2023 digitized off BNEF's Figure-17, +/- ~10 $/kWh;
// 2024 implied): 16 rows, no BNEF data before 2010. Over 2010-2025 both fall about equally (-95 % / -93 %): drawn as is.
// Years on screen: 1975, 2010, 2025 (the data's own first and last years).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { NuclearStage } from "../scott-nolan-uranium/nuclearWorld";
import { CostChart } from "./costCurveWorld";
import { CUT_A_BOARD_UNITS, CUT_A_POOL } from "./cutAState";
import { CUT_B_DURATION, CUT_B_S0, cutBCamAt, cutBChartAt } from "./believeState";

export const FPS = 24000 / 1001;
export const DURATION = 113;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (CUT_B_DURATION !== DURATION) throw new Error("believeState's duration must match BelieveTheSolarCurve");

const BelieveTheSolarCurve: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = CUT_B_S0 + f;
  const cam = cutBCamAt(f);
  return <NuclearStage cam={cam} S={S} boardUnits={CUT_A_BOARD_UNITS} pool={CUT_A_POOL} world={<CostChart S={S} {...cutBChartAt(f)} />} />;
};

export default BelieveTheSolarCurve;
