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
// THE MOTION (rev 1, "slightly more dynamic"): B opens on cut A's last frame (f60 of A rev 3, the lower, padded 3/4 view:
// cream solar and board-tone battery curves 2010 -> 2025, the panel and the cell on their tips, the COST axis at 2010) and
// continues it. The solar curve grows BACK in time from its 2010 point, up and left, drawn amber by its beaded tip to 1975
// (f0-16, believeState DRAW) while the camera pulls back so the whole 51-year line is in shot; the COST axis and the rail's
// corner slide out with the tip and 1975 rises out of the board (f12-23). "I believe the solar cost curve": a white-hot
// amber pulse (head and short tail) runs the whole curve 1975 -> 2025 (f15-26, PULSE), kicking each bead it passes (bigger
// and hotter, settling, no overshoot) and turning 2010-2025 amber behind it; it lands on the panel on "curve" (f26): the
// panel lifts and settles, and a glint sweeps its cells. Then, without a stop, the camera orbits round (~18 deg) and
// rises a little while it pushes back in on 2010-2025 (f24-92), the lanes and objects showing their depth, then drifts.
// "...haven't seen data that's as compelling on the battery cost curve": the battery curve loses conviction in steps landing
// on "battery" (86) to "curve" (100): beads thin (from f54), the tube breaks into a sparser dotted line (f66-98), its tone
// steps down 0.45 toward the ground (f80-96), the cell sags and tips slightly (f84-102). Still a falling, readable line.
// End (f100-112): the amber line beside the dim dotted one, years 2010 / 2025, the camera drifting, a soft glint on the panel.
// Year labels, COST and the two objects hold their screen size through the pull-back (A's rev 3 sizes, eased with the camera).
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
import { BelieveMarks, SolarPulse } from "./believePulse";
import { CUT_B_DURATION, CUT_B_S0, cutBCamAt, cutBChartAt, cutBMarksAt, popsAt, pulseHeadAt } from "./believeState";

export const FPS = 24000 / 1001;
export const DURATION = 113;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (CUT_B_DURATION !== DURATION) throw new Error("believeState's duration must match BelieveTheSolarCurve");

const BelieveTheSolarCurve: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = CUT_B_S0 + f;
  const cam = cutBCamAt(f);
  const world = (
    <>
      <CostChart S={S} {...cutBChartAt(f)} />
      <BelieveMarks {...cutBMarksAt(f)} />
      <SolarPulse head={pulseHeadAt(f)} pops={popsAt(f)} />
    </>
  );
  return <NuclearStage cam={cam} S={S} boardUnits={CUT_A_BOARD_UNITS} pool={CUT_A_POOL} world={world} />;
};

export default BelieveTheSolarCurve;
