import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DashedPath,
  FlagWorld,
  INK_HI,
  INK_LO,
  Label,
  Stage,
  WetLine,
  enterFrom,
  pointAtLen,
  smoothstep,
} from "./chinatalkShared";
import { REFERENCE_PCT, SCALE_PCT } from "./youthUnemploymentData";
import {
  CUM,
  DATE_ENTER_F,
  DURATION,
  END_M,
  FPS,
  F_CROSS,
  F_LAND,
  LAST,
  PTS,
  REST_CAM,
  TAG_M,
  TITLE_ENTER_F,
  TITLE_LINE,
  TITLE_SUB,
  X,
  Y,
  YEARS,
  camAt,
  fAtLen,
  monthLabel,
  readoutLayout,
  tagY,
  tipLen,
  titleLayout,
  valueAtLen,
  yearLabelX,
  yearLabelY,
} from "./youthUnemploymentGeom";
import { Baseline, BlockEntrance, Hairlines, ReadoutNumber, RedWash, Scaled, TipMark, WASH_LEAD, WASH_REST } from "./youthUnemploymentParts";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// YouthUnemploymentTwentyPlus -- Jordan Schneider, "Hu Jintao's 25 million jobs"
// (ChinaTalk), graphic A, to be delivered as 17_YouthUnemploymentTwentyPlus.mov.
// ChinaTalk style, 1080x1920, 24 fps, opaque.
//
// CHECK LINE (what the viewer can say after this cut that they could not
// before): "China's youth unemployment climbed summer after summer, from about
// 10 % in 2018 to past 20 %: a record 21.3 % in June 2023."
//
// LINE: "(you recount this story of) the youth unemployment statistics getting
// up to 20 plus percent."
// IN = edit frame 422 (17.583 s), OUT = 563 -> DURATION = 563 - 422 = 141 f
// (the slot exactly; out/jordan-hu/words.tsv). Local word frames: the 11 ·
// youth 18 · unemployment 24-43 · statistics 43-65 · getting 65 · up 79 ·
// to 88 · 20 97-115 · plus 115 · percent 126-138 · cut back 141.
//
// DATA: NBS National Data portal (data.stats.gov.cn), monthly urban surveyed
// unemployment rate, ages 16-24, old methodology incl. students, Jan 2018 -
// Jun 2023 (youthUnemploymentData.ts; verified 2026-10-09). Straight segments
// between the 66 monthly points, round joins, an honest linear axis from 0 %.
// RED = young people without the job (the line, its glow, the bead); nothing
// else is red except the flag itself. Everything is derived from the array.
//
// MOTION (one continuous move): the red line is already being written at f0
// (mid-stroke on 2019's summer rise) and its tip writes on WITHOUT STOPPING at
// a smooth pen speed: 2020's two-month top on "statistics" (f41.5), 2021's peak
// on "getting" (f63.5), it KISSES the dashed 20 % line at 19.9 on "to" (f85.5),
// falls back to the trough (f94), breaks through the line on "20" (f102.75) and
// eases to rest on June 2023 on "plus" (f113), where the round bead simply
// stops and its bloom breathes. The camera is one long pull-back about the
// chart's left edge (close on the tip, ~2.3x -> the whole chart, soft landing
// ~f116, then a slow push): its right edge runs ahead of the tip, the dashed
// line comes down into frame from the top (f4) and the baseline with its years
// comes up from the bottom; the left edge stays put. The title lockup (flag |
// YOUTH UNEMPLOYMENT / AGES 16-24, hanging just under the dashed line) enters
// f4-16 as one block; the readout enters on the frame the tip crosses 20 % and
// rolls with the tip's own height to 21.3 (landed f115); JUNE 2023 slides up
// under it (f114-126).
// ELEMENTS (nothing else): the red line + its quiet glow + bead; baseline, year
// ticks and labels, the 10 % hairline and tag, faint year hairlines; the dashed
// 20 % line and tag; the title lockup; the end readout.
//
// SIZES: every word label is the kit's word class; the world is authored so
// that the END frame sits at k = 1.38, where the size law gives a 12 px red
// line, 4.7 px ink lines and 40 px words (heavier in the close opening). Sizes
// the kit does not have, each from kit tokens: the payoff number is the value
// class at 3 x VALUE_PX = 150 screen px (a kit Odometer in a scale group, as
// creditAct1's year) and its date the word class at VALUE_PX = 50 px; the title
// lockup's words stop growing at VALUE_PX on screen while the camera is close
// (the one line must fit the frame) and its title line is as large as the END
// frame allows (>= the word class). Geometry, clocks and the camera live in
// youthUnemploymentGeom.ts; the glow, hairlines, tip and readout number in
// youthUnemploymentParts.tsx.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const REF_PTS = [
  { x: X(0), y: Y(REFERENCE_PCT) },
  { x: X(END_M), y: Y(REFERENCE_PCT) },
];

const YouthUnemploymentTwentyPlus: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;

  // the line being written
  const L = tipLen(S);
  const tip = pointAtLen(PTS, CUM, L);
  const washLead = WASH_LEAD + (WASH_REST - WASH_LEAD) * smoothstep((S - F_LAND + 6) / 14);

  // the title lockup
  const tl = titleLayout(k);

  // the readout stands above the last month
  const ro = readoutLayout(k);
  const value = valueAtLen(L);
  const speed = Math.abs(valueAtLen(tipLen(S + 0.5)) - valueAtLen(tipLen(S - 0.5))) * 10;

  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      {/* chart furniture, in the world from the first frame */}
      <Hairlines k={k} />
      <RedWash L={L} lead={washLead} />
      <Baseline k={k} />
      {YEARS.map((yr) => (
        <Label key={yr.text} text={yr.text} x={yearLabelX(yr.jan, k)} y={yearLabelY(k)} k={k} size="word" rung={INK_LO} anchor="start" />
      ))}
      <Label text={`${SCALE_PCT}%`} x={X(TAG_M)} y={tagY(Y(SCALE_PCT), k)} k={k} size="word" rung={INK_LO} anchor="start" />

      {/* the dashed reference: a world object from frame 0, revealed by the camera rising */}
      <DashedPath points={REF_PTS} k={k} S={S} rung={INK_HI} />
      <Label text={`${REFERENCE_PCT}%`} x={X(TAG_M)} y={tagY(Y(REFERENCE_PCT), k)} k={k} size="word" rung={INK_HI} anchor="start" />

      {/* the title lockup, one block: flag | YOUTH UNEMPLOYMENT / AGES 16–24 */}
      <BlockEntrance appear={enterFrom(S, TITLE_ENTER_F)} k={k}>
        <FlagWorld id="yu-flag" x0={tl.flag.x0} y0={tl.flag.y0} w={tl.flag.w} k={k} />
        <Label text={TITLE_LINE} x={tl.xText} y={tl.yTitle} k={tl.kTitle} size="word" rung={INK_HI} anchor="start" />
        <Label text={TITLE_SUB} x={tl.xText} y={tl.ySub} k={tl.kSub} size="word" rung={INK_LO} anchor="start" />
      </BlockEntrance>

      {/* the red line, written in wet ink, and its tip */}
      <WetLine id="yu-line" points={PTS} len={L} k={k} ageAt={(s) => S - fAtLen(s)} />
      <TipMark S={S} k={k} tip={tip} />

      {/* the readout: enters on the frame the tip crosses the reference, rolls with the tip's height */}
      <BlockEntrance appear={enterFrom(S, F_CROSS)} k={k}>
        <ReadoutNumber value={value} speed={speed} xRight={ro.xRight} y={ro.yNum} fs={ro.fsN} k={k} />
        <Scaled x={ro.xRight} y={ro.yDate} m={ro.mDate}>
          <Label text={monthLabel(LAST)} x={ro.xRight} y={ro.yDate} k={k} size="word" rung={INK_HI} anchor="end" appear={enterFrom(S, DATE_ENTER_F)} />
        </Scaled>
      </BlockEntrance>
    </Stage>
  );
};

export default YouthUnemploymentTwentyPlus;
