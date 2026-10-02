import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DUR_2 } from "./wolffActA";
import { ActA2 } from "./wolffActA2";
import type { ChartData } from "./wolffActA2";
import { FPS } from "./wolffShared";

// ---------------------------------------------------------------------------
// BackInTheDayV3 — cut 2, version 3, of the Toto Wolff "Mercedes F1
// financials" clip (Cheeky Pint S4E01): the user's accuracy pass on V2 —
// "every on-screen figure the real filed number". NUMBERS ONLY: V2's world
// (wolffActA2: camera, timing, layout, reveal, the one click) with V3's table;
// nothing else differs. V2 stays reproducible (ActA2 defaults to V2's table).
//
// THE LINE: "Back in the day it wasn't a billion and it wasn't 300 million. It
// was considerably less, because we're growing very strong, and the sport is
// still growing strong."
// WINDOW: edit 0:12.759 -> 20.480. DURATION = round((20.480 - 12.759) * 24) =
// 185, + 16-frame tail = 201 (as V1/V2). S_A = 124 + f: f0 IS cut 1's last
// frame (BillionInRevenue f124) pixel for pixel.
//
// GESTURES: exactly V2's (see BackInTheDayV2.tsx) — the axis draws leftward
// from the Mercedes tile (f1-~75); the camera eases back to k 1.6 and glides
// left (f0-~96); each year's bar rises with its slice as the camera's look
// reaches it (2025 f15 ... 2020 f49, 2019 f54 ... 2015 f75), its figure
// sliding up 3 f behind; years 2015 / 2020 / 2025 under the axis; the camera
// creeps in on 2015 (k 1.8), still ~f102-108; "$326M" lands f90, THE ONE CLICK
// (half-step f90-92, "considerably"); the camera turns right and pulls back to
// k 1.0 (f106-~176) onto the whole growth, then drifts.
//
// DATA (out/wolff/briefs/data.md "Cut 2 V3", read by the director from the
// Mercedes-Benz Grand Prix Ltd filings, Companies House 00787446; for each year
// the LATEST filing's figure; USD = GBP x the Federal Reserve G.5A annual
// average rate; px = USD $B x 160; slice = filed OPERATING PROFIT, 2015 an
// operating loss so no slice; 2024 restated FRS 102 -> UK-adopted IFRS in the
// FY2025 accounts):
//   year  rev GBPk  op GBPk   rate    rev $M  label  bar px  slice px
//   2015  213,264  (33,913)  1.5284  325.95  $326M   52.15   0
//   2016  289,421   14,334   1.3555  392.31   392     62.77   3.11
//   2017  337,162   16,653   1.2890  434.60   435     69.54   3.43
//   2018  338,380   16,705   1.3363  452.18   452     72.35   3.57
//   2019  363,627   18,114   1.2768  464.28   464     74.28   3.70
//   2020  355,301   17,495   1.2829  455.82   456     72.93   3.59
//   2021  383,302   71,938   1.3764  527.58   528     84.41  15.84
//   2022  474,558  113,600   1.2371  587.08   587     93.93  22.49
//   2023  546,450  113,786   1.2440  679.78   680    108.77  22.65
//   2024  632,117  156,152   1.2781  807.91   808    129.27  31.93
//   2025  633,378  166,707   1.3192  835.55   836    133.69  35.19
//   now   Toto's $1B / $300M (160 / 48 px), NowColumn exactly as cut 1.
// Changed labels vs V2: 2017 434 -> 435, 2021 527 -> 528, 2022 585 -> 587,
// 2024 812 -> 808, 2025 835 -> 836.
// ---------------------------------------------------------------------------

export const V3_DATA: ChartData = {
  bar: [52.15, 62.77, 69.54, 72.35, 74.28, 72.93, 84.41, 93.93, 108.77, 129.27, 133.69],
  slice: [0, 3.11, 3.43, 3.57, 3.7, 3.59, 15.84, 22.49, 22.65, 31.93, 35.19],
  value: ["$326M", "392", "435", "452", "464", "456", "528", "587", "680", "808", "836"],
};

export { FPS };
export const DURATION = DUR_2;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BackInTheDayV3: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActA2 f={frame} data={V3_DATA} />
    </AbsoluteFill>
  );
};

export default BackInTheDayV3;
