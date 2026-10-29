// ---------------------------------------------------------------------------
// SeventyBillionAGigawatt (sam-gigawatt-cost, cut 38). Cheeky Pint style, the Scott "air" look (styles/cheeky-pint.md;
// COMMON.md; the medium scott-aircraft-order/aircraftShared.tsx AirStage, read-only; the campus world
// campusWorld.tsx, cut 5's, read-only; the cost column gigawattCost.tsx, this cut's own).
// Opaque 1080x1920, 23.976 fps, 132 frames.
//
// CHECK LINE: "one gigawatt of AI data center costs about $70 billion — to build it and run it for five years."
//
// THE LINE (Sam, then John, then Sam): "...but let's pick $70 billion as a number. I think if that number were—"
// (John) "That's the cost to install—" (Sam) "And run it for five years."
// WORD -> FRAME (from f0, whisper, may run ~5 f early): let's -2 · pick 4 · $70 7 · billion 15 · as 19 · a 28 ·
// number 30 · I 37 · think 41 · if 47 · that 49 · number 53 · were 58 · (John) That's 64 · the 64 · cost 64 · to 69 ·
// install 72 · (Sam) And 91 · run 99 · it 104 · for 106 · five 109 · years 111 · (on camera) Yep 119 · okay 124.
// DURATION: the slot 38.038 -> 43.544 s (sequence frames 912-1044) = 132 frames (f0..f131).
//
// THE MOTION: one slow push across all 132 frames (damped start, still easing at the end) toward a column of cash and
// the one-gigawatt campus behind it at golden hour. From f0 a stack of fourteen $5B layers of banknote bundles (sage notes, amber paper straps) rises out of its slot in
// the concrete apron in front of the campus and lands on "billion" (f15) under a big cream "$70B" and "PER
// GIGAWATT". On "the cost to install" the campus's eight halls light up from inside: amber in every louvre band,
// pooling on the pad between the halls (f61-72). The year rule surfaces out of the bare near apron (f78-88, a soft
// front left to right: its groove and five dark tiles). On "and run it for five years" a lit front runs along the rule
// inlaid at the apron's near edge and five year tiles light amber in turn, 1 to 5 (f91-111), while the warmth of the
// running campus gathers over its roofs. Settled living frame from ~f112: column, $70B, lit campus, five lit years.
// Cause before effect: the slot is open at f0 and the cash's first pixel clears its lip on f1; each year tile lights
// when the run front reaches it.
// AMBER = the dollars: the cash's paper straps, the money at work in the halls, each year it pays for. Cream = the halls,
// the type. The $70B is never split into parts (no source for a breakdown).
//
// SOURCES: "$70 billion" per gigawatt, the five-year total cost of ownership (install + run it for five years), is the
// speaker's own pick on the episode (Sam Altman, Cheeky Pint S4E07), shown as he says it; no other figure on screen.
// The campus is cut 5's Stargate-style model (campusWorld.tsx header: OpenAI / Oracle Stargate, Abilene TX).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { airProject, AirStage } from "../scott-aircraft-order/aircraftShared";
import { CampusWarmth, DesertGround, GigawattCampus } from "./campusWorld";
import { COST_70, CUT6_END_CAM, CostApron, CashColumn, CostReadout, HallsAlight, YearMarks, costTopFar, cut6CamAt, yearAt } from "./gigawattCost";

export const FPS = 24000 / 1001;
export const DURATION = 132;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => {
  const t = c01(u);
  return t * t * (3 - 2 * t);
};
/** a weighty rise: quick out of the slot, a long damped landing (no overshoot) */
const riseCurve = (u: number) => {
  const t = c01(u);
  return 1 - Math.pow(1 - t, 2.6);
};

// --- beats (frames) ---------------------------------------------------------------------------------------------
const BEAT = {
  rise: { f0: -1.2, f1: 14.6 },
  num: { f0: 5, f1: 15 },
  sub: { f0: 8, f1: 18 },
  install: { f0: 61, f1: 72 },
  rule: { f0: 78, f1: 88 },
  years: { f0: 91, f1: 111 },
  warm: { f0: 88, f1: 120 },
} as const;
const riseAt = (f: number) => riseCurve((f - BEAT.rise.f0) / (BEAT.rise.f1 - BEAT.rise.f0));
/** the run front: tile i lights between f91 + 5i and f96 + 5i (years 0..5 over f91-116, the 5th lit by f111) */
const yearsAt = (f: number) => c01((f - BEAT.years.f0) / (BEAT.years.f1 - BEAT.years.f0)) * 5;
const ruleAt = (f: number) => smooth((f - BEAT.rule.f0) / (BEAT.rule.f1 - BEAT.rule.f0));
const glowAt = (f: number) => smooth((f - BEAT.install.f0) / (BEAT.install.f1 - BEAT.install.f0));
const fillAt = (f: number) => c01((f - BEAT.install.f0) / (BEAT.install.f1 - BEAT.install.f0));
const warmthAt = (f: number) => 0.6 * glowAt(f) + 0.4 * smooth((f - BEAT.warm.f0) / (BEAT.warm.f1 - BEAT.warm.f0));

// world-space type scales with the camera: sizes are the tokens at the resolved camera
const REF_TOP = airProject(CUT6_END_CAM, costTopFar(COST_70)).s;
const REF_YEARS = airProject(CUT6_END_CAM, yearAt(2)).s;
const REST = cut6CamAt(0);

const SeventyBillionAGigawatt: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = cut6CamAt(f);
  const rise = riseAt(f);
  const years = yearsAt(f);
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={REST}
      ground={null}
      world={
        <>
          <DesertGround S={f} roads={null} />
          <CostApron billions={COST_70} rise={rise} years={years} rule={ruleAt(f)} />
          <GigawattCampus at={[0, 0]} glow={glowAt(f)} />
          <HallsAlight fill={fillAt(f)} />
          <CampusWarmth at={[0, 0]} glow={warmthAt(f)} />
          <CashColumn billions={COST_70} rise={rise} />
        </>
      }
      overlay={
        <>
          <CostReadout
            cam={cam}
            billions={COST_70}
            rise={rise}
            text="$70B"
            sub="PER GIGAWATT"
            enter={(f - BEAT.num.f0) / (BEAT.num.f1 - BEAT.num.f0)}
            subEnter={(f - BEAT.sub.f0) / (BEAT.sub.f1 - BEAT.sub.f0)}
            refScale={REF_TOP}
          />
          <YearMarks cam={cam} years={years} refScale={REF_YEARS} />
        </>
      }
    />
  );
};

export default SeventyBillionAGigawatt;
