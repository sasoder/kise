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
// DURATION: the slot 38.038 -> 47.422 s (sequence frames 912-1137) = 225 frames (f0..f224). Rev 2 extended it from
// 132 (the user disabled more footage; cut 7 is dropped, so this is the last graphic before Sam returns).
//
// THE MOTION: one slow push across all 132 frames (damped start, still easing at the end) toward a column of cash and
// the one-gigawatt campus behind it at golden hour. From f0 a stack of fourteen $5B layers of banknote bundles (sage notes, amber paper straps) rises out of its slot in
// the concrete apron in front of the campus and lands on "billion" (f15) under a big cream "$70B" and "PER
// GIGAWATT". On "the cost to install" the campus's eight halls light up from inside: amber in every louvre band,
// pooling on the pad between the halls (f61-72). The year rule surfaces out of the bare near apron (f78-88, a soft
// front left to right: its groove and five dark tiles). On "and run it for five years" a lit front runs along the rule
// inlaid at the apron's near edge and five year tiles light amber in turn, 1 to 5 (f91-111), while the warmth of the
// running campus gathers over its roofs. Settled living frame from ~f112: column, $70B, lit campus, five lit years.
// REV 2 (f132-224, "if that number were like 20 instead of 70, we should be much happier"): f0-131 are frame for
// frame the approved ones (a second camera glide starts at rest on f131). On "20" (f158-172) the column sinks back
// into its slot to 4 layers ($20B, 112 m) with weight and a damped landing; the $70B sinks out (the house entrance
// reversed, f155-162) as $20B rises in on the same top (f161-171), PER GIGAWATT stays. From f150 new campuses (cream:
// amber is only the money) rise out of the desert behind and beside the first one, rippling outward to the horizon,
// the outer ring still coming up at the end; the camera rises and tips down a little so the field fills the upper
// frame. The year rule stays (the $20B is still the five-year cost); readout and year labels clear the caption bands at
// every frame. No ghost of the old height (a translucent box would be the one non-physical thing on screen).
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
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { airProject, AirStage } from "../scott-aircraft-order/aircraftShared";
import { CAMPUS, CampusField, CampusWarmth, DesertGround, GigawattCampus, type CampusItem } from "./campusWorld";
import { COST_70, CUT6_END_CAM, CUT6_FRAMES_LONG, CostApron, CashColumn, CostReadout, HallsAlight, YearMarks, costHeight as costHeightOf, costTopFar, cut6LongCamAt, yearAt } from "./gigawattCost";

export const FPS = 24000 / 1001;
export const DURATION = CUT6_FRAMES_LONG;
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
  // rev 2: "if that number were like 20 (f160) instead of 70 (f181)"
  out70: { f0: 155, f1: 162 },
  sink: { f0: 158, f1: 172 },
  in20: { f0: 161, f1: 171 },
  field: { f0: 150, f1: 212 },
} as const;
/** $20B = 4 of the 14 layers above the apron (the visible height is rise * (fullH + 1) - 1 = 112 m) */
const RISE_20 = (costHeightOf(20) + 1) / (costHeightOf(70) + 1);
/** a heavy sink: it gets going slowly, then a long damped landing in the slot's lip (no bounce) */
const sinkCurve = (u: number) => {
  const t = Math.pow(c01(u), 1.4);
  return 1 - Math.pow(1 - t, 2.2);
};
const riseAt = (f: number) => {
  const up = riseCurve((f - BEAT.rise.f0) / (BEAT.rise.f1 - BEAT.rise.f0));
  return up - (1 - RISE_20) * sinkCurve((f - BEAT.sink.f0) / (BEAT.sink.f1 - BEAT.sink.f0));
};
/** the run front: tile i lights between f91 + 5i and f96 + 5i (years 0..5 over f91-116, the 5th lit by f111) */
const yearsAt = (f: number) => c01((f - BEAT.years.f0) / (BEAT.years.f1 - BEAT.years.f0)) * 5;
const ruleAt = (f: number) => smooth((f - BEAT.rule.f0) / (BEAT.rule.f1 - BEAT.rule.f0));
const glowAt = (f: number) => smooth((f - BEAT.install.f0) / (BEAT.install.f1 - BEAT.install.f0));
const fillAt = (f: number) => c01((f - BEAT.install.f0) / (BEAT.install.f1 - BEAT.install.f0));
const warmthAt = (f: number) => 0.6 * glowAt(f) + 0.4 * smooth((f - BEAT.warm.f0) / (BEAT.warm.f1 - BEAT.warm.f0));

// world-space type scales with the camera: sizes are the tokens at the resolved camera
const REF_TOP = airProject(CUT6_END_CAM, costTopFar(COST_70)).s;
const REF_YEARS = airProject(CUT6_END_CAM, yearAt(2)).s;
const REST = cut6LongCamAt(0);

// --- rev 2: the field of new campuses (cheaper per gigawatt, so many more get built), cream: amber is only the money
type Cell = { at: [number, number]; t0: number; dur: number };
const FIRST: [number, number] = [0, 0];
const REACH = 12000;
const [PX0, PZ0, PX1, PZ1] = CAMPUS.pad;
/** is any part of the cell's pad on screen (in front of the camera) at some frame of the second part? */
const seen = (at: [number, number]) =>
  [150, 172, 195, 210, 224].some((f) => {
    const cam = cut6LongCamAt(f);
    const ps = [
      [PX0, PZ0],
      [PX1, PZ0],
      [PX0, PZ1],
      [PX1, PZ1],
    ].map(([x, z]) => airProject(cam, [at[0] + x, 0, at[1] + z]));
    if (ps.some((p) => p.d < 5)) return false;
    const xs = ps.map((p) => p.x);
    const ys = ps.map((p) => p.y);
    return Math.max(...xs) > -40 && Math.min(...xs) < 1120 && Math.max(...ys) > -40 && Math.min(...ys) < 1960;
  });
/** every cell behind and beside the first campus (none in front: that is the apron), rippling outward from it */
const FIELD: Cell[] = (() => {
  const out: Cell[] = [];
  for (let j = 0; j <= 26; j++) {
    for (let i = -13; i <= 13; i++) {
      if (i === 0 && j === 0) continue;
      const at: [number, number] = [i * CAMPUS.pitch[0], j * CAMPUS.pitch[1]];
      if (!seen(at)) continue;
      const u = Math.pow(Math.min(1, Math.hypot(at[0], at[1]) / REACH), 0.8);
      const t0 = BEAT.field.f0 + (BEAT.field.f1 - BEAT.field.f0) * u + (random(`f6${i}:${j}`) - 0.5) * 1.6;
      // the near ones climb slower (their rise must read); the outer ring is still coming up at the end
      out.push({ at, t0, dur: 22 - 11 * Math.pow(u, 0.7) });
    }
  }
  return out;
})();

const SeventyBillionAGigawatt: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = cut6LongCamAt(f);
  // every cell every frame (a fixed instance count; an unrisen campus draws nothing)
  const field: CampusItem[] = FIELD.map((c) => ({ at: c.at, rise: c01((f - c.t0) / c.dur) }));
  const out70 = 1 - c01((f - BEAT.out70.f0) / (BEAT.out70.f1 - BEAT.out70.f0));
  const in20 = (f - BEAT.in20.f0) / (BEAT.in20.f1 - BEAT.in20.f0);
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
          <CampusField items={field} from={FIRST} />
          <CostApron billions={COST_70} rise={rise} years={years} rule={ruleAt(f)} />
          <GigawattCampus at={[0, 0]} glow={glowAt(f)} />
          <HallsAlight fill={fillAt(f)} />
          <CampusWarmth at={[0, 0]} glow={warmthAt(f)} />
          <CashColumn billions={COST_70} rise={rise} />
        </>
      }
      overlay={
        <>
          {/* the $70B rides the column top until "20", then sinks out (the house entrance reversed) as the $20B
              rises in over it on the same top; PER GIGAWATT stays */}
          <CostReadout
            cam={cam}
            billions={COST_70}
            rise={rise}
            text="$70B"
            sub="PER GIGAWATT"
            enter={Math.min((f - BEAT.num.f0) / (BEAT.num.f1 - BEAT.num.f0), out70)}
            subEnter={(f - BEAT.sub.f0) / (BEAT.sub.f1 - BEAT.sub.f0)}
            refScale={REF_TOP}
          />
          {in20 > 0 ? <CostReadout cam={cam} billions={COST_70} rise={rise} text="$20B" sub=" " enter={in20} subEnter={0} refScale={REF_TOP} /> : null}
          <YearMarks cam={cam} years={years} refScale={REF_YEARS} />
        </>
      }
    />
  );
};

export default SeventyBillionAGigawatt;
