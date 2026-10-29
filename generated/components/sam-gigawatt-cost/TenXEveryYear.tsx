// ---------------------------------------------------------------------------
// TenXEveryYear (sam-gigawatt-cost, cut 47). Cheeky Pint style, the Scott "air" look (styles/cheeky-pint.md;
// COMMON.md; the medium scott-aircraft-order/aircraftShared.tsx AirStage, read-only; the campus world
// campusWorld.tsx, cut 5's, read-only; the cost column gigawattCost.tsx, cut 6's, read-only; this cut's own
// tenXPlan.ts and tenXWorld.tsx). Opaque 1080x1920, 23.976 fps, 99 frames. The clip's LAST graphic.
//
// CHECK LINE: "even when a gigawatt costs $20 billion, it should still do ten times more every year."
//
// THE LINE (Sam): (on camera, 43.5-47.4 s: "I think if that number were like 20 instead of 70, we should be much
// happier.") then this slot: "And we should still demand to get 10x better performance out of it with smarter models
// every year."
// WORD -> FRAME (from f0, whisper, may run ~5 f early): happier -11 · And -1 · we 1 · should 4 · still 9 · demand 15 ·
// to 24 · get 30 · 10x 34 · better 45 · performance 49 · out 57 · of 63 · it 66 · with 69 · smarter 75 · models 81 ·
// every 87 · year 92.
// DURATION: the slot 47.422 -> 51.551 s (sequence frames 1137-1236) = 99 frames (f0..f98).
//
// THE MOTION: one continuous damped pull-back from cut 6's resolved camera (CUT6_END_CAM; f0 is that world, now at the
// speaker's $20B: the same gold column, four slabs, its readout "$20B / PER GIGAWATT", the one constant of the cut):
// back, up and tipping down over the apron, drifting right, the lens lengthening, still easing at f98. f0: ONE cream
// work unit stands on the apron beside the column. f6-33: nine more slide up out of the mouth (an open ramp trench
// along the campus's front edge) and across the apron to it, a row of ten beside the column, landing on "10x" (f34),
// where "10×" enters over the yard's back right corner. f39-87: rows 2-10 come up out of the mouth as one train behind
// the ten, take them along to the front of the yard and land as a 10x10 block, the first ten its front row; "10×"
// turns to "100×" (f78-89), landing on "every year". The block outgrows the campus and the column, which keep their
// world size and read smaller and smaller; last frame: campus, small $20B column, the hundred, the camera still drifting.
// Cause before effect: each unit is drawn only above the apron, so it visibly comes up out of the mouth; the ten move
// off only as the train closes to one pitch behind them (a smooth minimum, no jolt).
// CHOICES: the halls stay lit (the campus is running: it is what makes the output; switching it off would have no
// cause). The year rule is gone (4 s of on-camera sit between the cuts): its five amber tiles would read as more
// dollars beside the cream output, its numerals would cross the caption bands on the pull-back, and its strip of apron
// is where the yard grows. AMBER = the dollars only (the $20B column, and the halls it paid for); cream = the campus,
// the output and the type.
//
// SOURCES: "$20 instead of $70" (he means $20B per gigawatt, the five-year total cost of ownership) and "10x better
// performance ... every year" are Sam Altman's own words on the episode (Cheeky Pint S4E07), shown as he says them;
// no other figure on screen. The campus is cut 5's Stargate-style model (campusWorld.tsx header).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_NUM, TRACK as TYPE_TRACK } from "../kits/cheeky-pint/stoutShared";
import { airCamAt, airProject, AirStage, type AirCam, type SideCam } from "../scott-aircraft-order/aircraftShared";
import { CampusWarmth, DesertGround, GigawattCampus } from "./campusWorld";
import { CUT6_END_CAM, CostApron, CostReadout, GoldColumn, HallsAlight, costTopFar } from "./gigawattCost";
import { BEAT, FRAMES, TAG_AT, TRACK, unitsAt } from "./tenXPlan";
import { ApronReach, WorkUnits, YardGround } from "./tenXWorld";

export const FPS = 24000 / 1001;
export const DURATION = 99;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (FRAMES !== DURATION) throw new Error("tenXPlan FRAMES must equal DURATION");

/** the speaker's $20B: the same column as cut 6, four slabs, the one constant of the cut */
const BILLIONS = 20;
/** the readout is HERO 184 px at f0 (cut 6's resolved camera) and keeps its world size after */
const REF_TOP = airProject(CUT6_END_CAM, costTopFar(BILLIONS)).s;
const camAt = (f: number) => airCamAt(TRACK, f) as SideCam;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut3 = (v: number) => 1 - Math.pow(1 - c01(v), 3);
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
/** the multiple is SECONDARY 136 px where it lands on "10x" (f34) and keeps its world size after */
const REF_TAG = airProject(camAt(34), [...TAG_AT]).s;

/** cream numerals with one soft cast shadow down-right (as CostReadout: cream alone washes out in the haze) */
const CastNum: React.FC<{ x: number; y: number; px: number; text: string; a: number; blur: number }> = ({ x, y, px, text, a, blur }) => {
  if (a <= 0.002) return null;
  const t = (fill: string) => (
    <text x={f3(x)} y={f3(y)} fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(px)} letterSpacing={`${TYPE_TRACK.numeral}em`} textAnchor="middle" fill={fill} style={{ fontFeatureSettings: '"lnum" 1' }}>
      {text}
    </text>
  );
  return (
    <g opacity={f3(a)} style={{ filter: blur > 0.05 ? `blur(${f3(blur)}px)` : undefined }}>
      <g transform={`translate(${f3(px * 0.022)} ${f3(px * 0.038)})`} style={{ filter: `blur(${f3(px * 0.05)}px)` }} opacity={0.78}>
        {t(COLOR.shadow)}
      </g>
      {t(COLOR.inkCream)}
    </g>
  );
};
/** OutputMultiple — "10×" (the stout entrance on "10x"), then a drum turn to "100×" that lands on "year" */
const OutputMultiple: React.FC<{ cam: AirCam; f: number }> = ({ cam, f }) => {
  const P = airProject(cam, [...TAG_AT]);
  const px = 136 * (P.s / REF_TAG);
  const enter = easeOut3((f - BEAT.tag.f0) / (BEAT.tag.f1 - BEAT.tag.f0));
  const u = c01((f - BEAT.swap.f0) / (BEAT.swap.f1 - BEAT.swap.f0));
  // the drum: the old string turns up and out, the new one comes up from below; they never overlap in opacity
  const sw = u * u * (3 - 2 * u);
  const outA = c01(1 - sw / 0.55);
  const inA = c01((sw - 0.45) / 0.55);
  const drum = 0.42 * px;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <CastNum x={P.x} y={P.y + (1 - enter) * 24 - drum * sw} px={px} text="10×" a={enter * outA} blur={6 * (1 - enter) + 5 * (1 - outA) * (u > 0 ? 1 : 0)} />
      <CastNum x={P.x} y={P.y + drum * (1 - sw)} px={px} text="100×" a={inA} blur={5 * (1 - inA)} />
    </svg>
  );
};
const REST = camAt(0);

const TenXEveryYear: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const units = unitsAt(f);
  return (
    <AirStage
      cam={cam}
      S={132 + f}
      rest={REST}
      ground={null}
      world={
        <>
          <DesertGround S={132 + f} roads={null} />
          <CostApron billions={BILLIONS} rise={1} years={0} rule={0} />
          <ApronReach />
          <YardGround units={units} />
          <GigawattCampus at={[0, 0]} glow={1} />
          <HallsAlight fill={1} />
          <CampusWarmth at={[0, 0]} glow={1} />
          <GoldColumn billions={BILLIONS} rise={1} />
          <WorkUnits units={units} />
        </>
      }
      overlay={
        <>
          <CostReadout cam={cam} billions={BILLIONS} text="$20B" sub="PER GIGAWATT" enter={1} refScale={REF_TOP} />
          <OutputMultiple cam={cam} f={f} />
        </>
      }
    />
  );
};

export default TenXEveryYear;
