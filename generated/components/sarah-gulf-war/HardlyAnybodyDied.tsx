// ---------------------------------------------------------------------------
// HardlyAnybodyDied (sarah-gulf-war, cut 6). Dwarkesh 3D style (styles/dwarkesh-3d.md) as a FLAT 2D chart in the air
// (the user, for this cut: "more of a 2d motion graphic ... a bar chart"). Opaque 1080x1920, 24 fps, 42 frames.
// The chart language is the clip's shared module gulfChart.tsx (cuts 6, 90, 107), owned by this cut.
//
// CHECK LINE: "America lost a few hundred people in the Gulf War, a sliver next to the tens of thousands it lost in
// Korea and Vietnam, and far fewer even than in the later Iraq War."
//
// THE LINE: "Hardly anybody died." (before it, on the speaker: "in this war, the United States didn't even pay for it.")
// WORD -> FRAME (Whisper, ~5-9 f early): Hardly -2 · anybody 9 · died 16 · (slot ends 42; "Saddam Hussein was broke"
// starts on the speaker).
// DURATION: the slot 6.208333 -> 7.958333 s (sequence 00:00:06:05 - 00:00:07:23) = 1.750 s x 24 = 42 frames (f0..f41).
//
// THE MOTION (rev 2, director's review Oct 29): "US military deaths", four flat bars in date order, each on its own short
// foot (no continuous rule), linear at ONE px per death for all four (Vietnam 600 px -> the Gulf War 3.95 px world,
// 5.3 px on screen at the end). At f0 the bars are already 10-17 % up and growing in a fast stagger (Gulf settles ~f13,
// Korea ~f14, Vietnam ~f18, Iraq ~f19), their numbers counting up on their tops; the orange Gulf bar, the same width as
// the others and haloed in a soft orange glow, lifts only to its true few pixels while its 383 slides up in, settled by
// ~f13 ("died" ~f16-22). The stacked title and the war names slide up with a fade over f0-8. Camera: ONE eased push
// f0 -> f41 from the centred chart (k 1) to k 1.35 on the Gulf bar's foot, which lands at (638, 945) with its 383 at
// y ~880; it decelerates into a creep (end slope 0.35 of the mean speed), so the frame is still moving at f41, with the
// kit's sway and the air's motes. Everything stays in shot to the last frame (both giants with their numbers).
// Orange = America's dead in this war (the subject); the other three wars in cream / creamLo.
//
// FRAMING: f0: the chart 630 px wide, exactly centred (margins 224 / 226), baseline y 980. f41: k 1.35, baseline y 945,
// Korea's label ~70 px from the left edge, Iraq's ~130 from the right (the push centres the Gulf bar, the third of
// four, so the margins can only nearly match), Vietnam's 58,220 ~60 px under the top edge, the title in the open air
// at the upper right. Type at the settled frame (screen px): names 49 (Caslon, title case), years 41, numbers 62, title
// 59 (TYPE_PHONE in gulfChart). Lowest text on any frame y 1052 (measured); nothing in either caption band.
//
// SOURCES: CRS RL32492, "American War and Military Operations Casualties: Lists and Statistics" (Jul 29 2020), Tables
// 1 / 7 / 6 / 12: Korean War 36,574 (in theater), Vietnam Conflict 58,220, Persian Gulf War (1990-91) 383, Operation
// Iraqi Freedom (2003-10) 4,418 (gulfChart FIG.us). Years: Korea 1950-53, Vietnam 1955-75 (the CRS table's span),
// Gulf War 1990-91, Iraq 2003-10 (OIF).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldSvg, swayCam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Bar, COL, CategoryLabel, ChartDefs, ChartStage, ChartTitle, FIG, NumberLabel, barCentres, chartAirOf, countUp, enter, grow, pushCam } from "./gulfChart";

export const FPS = 24;
export const DURATION = 42;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** rev 2 geometry (world px = screen px at f0, k 1). Pitch and bar width are solved from the settled frame (k 1.35):
 *  the names at ~50 screen px (Caslon "Vietnam" 3.96 em, "Gulf War" 4.15 em) need a ~239 px screen pitch to keep a
 *  ~37 px gap, and Korea's label must keep a ~70 px margin with the Gulf bar near the middle (x 638: the margins nearly match, ~70 / ~130 px). */
const K_END = 1.35;
const BASE = 980;
const BAR_W = 114;
const PITCH = 173.2;
const XS = barCentres(4, 540, BAR_W, PITCH - BAR_W);
const MAX_H = 600;
const PX_PER = MAX_H / FIG.us.vietnam;
const T = { title: 44, name: 36, sub: 30, num: 46 };
const NAME_DY = 40;
const SUB_DY = 76;
const NUM_GAP = 16;

type War = { key: keyof typeof FIG.us; name: string; years: string; kind: "cream" | "accent"; f0: number; dur: number };
/** date order; f0 / dur = the bar's growth: all four already ~10-17 % up at f0, settling Gulf f13, Korea f14,
 *  Vietnam f18, Iraq f19 */
const WARS: War[] = [
  { key: "korea", name: "Korea", years: "1950–53", kind: "cream", f0: -3.0, dur: 17 },
  { key: "vietnam", name: "Vietnam", years: "1955–75", kind: "cream", f0: -3.2, dur: 21.3 },
  { key: "gulf", name: "Gulf War", years: "1990–91", kind: "accent", f0: -2.4, dur: 15.6 },
  { key: "iraq", name: "Iraq", years: "2003–10", kind: "cream", f0: -2.6, dur: 21.6 },
];
const GULF_X = XS[2];
/** the title (stacked, two lines) sits in the open air at the upper right, beside Vietnam and centred over the two
 *  short bars, so at k 1.35
 *  everything (both giants with their numbers, the title, the Gulf bar, Iraq) stays in shot to the last frame */
const TITLE_X = (XS[2] + XS[3]) / 2;
const TITLE_Y = 476;

/** ONE eased push f0 -> f41: from the centred chart (k 1) to k 1.35 on the Gulf bar's foot, which lands at (638, 945)
 *  so its 383 sits at y ~890; end slope 0.35 of the mean speed: it decelerates into a creep, never a hold */
const camAt = (f: number) => pushCam(f, DURATION, { k: 1, w: [540, 960], s: [540, 960] }, { k: K_END, w: [GULF_X, BASE], s: [638, 945] }, 0.35);
const REST = swayCam(camAt(0), 0);

const HardlyAnybodyDied: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const A = chartAirOf(cam, REST, frame);
  const title = enter(frame, -3, 10);
  return (
    <ChartStage A={A}>
      <WorldSvg cam={cam}>
        <ChartDefs uid="had" />
        <ChartTitle uid="had" x={TITLE_X} y={TITLE_Y} text={"US military\ndeaths"} o={title.o} lift={title.lift} size={T.title} />
        {WARS.map((w, i) => (
          <Bar key={w.key} uid="had" x={XS[i]} w={BAR_W} base={BASE} h={FIG.us[w.key] * PX_PER * grow(frame, w.f0, w.dur)} kind={w.kind} glow={w.kind === "accent" ? grow(frame, w.f0, w.dur) : 0} />
        ))}
        {WARS.map((w, i) => {
          const value = FIG.us[w.key];
          const p = grow(frame, w.f0, w.dur);
          const h = value * PX_PER * p;
          const x = XS[i];
          const isGulf = w.kind === "accent";
          // the number rides the bar's top; the Gulf's 383 has no room to ride, so it slides up on its own
          const num = isGulf ? enter(frame, w.f0, w.dur) : enter(frame, w.f0 + 0.5, 6);
          const lab = enter(frame, w.f0 - 0.5, 10);
          return (
            <g key={w.key}>
              <CategoryLabel uid="had" x={x} base={BASE} name={w.name} sub={w.years} o={lab.o} lift={lab.lift} nameSize={T.name} subSize={T.sub} nameDy={NAME_DY} subDy={SUB_DY} />
              <NumberLabel
                uid="had"
                x={x}
                y={BASE - h - (isGulf ? NUM_GAP + 8 : NUM_GAP)}
                text={countUp(value, p)}
                fill={isGulf ? COL.accent : COL.cream}
                size={T.num}
                o={num.o}
                lift={isGulf ? num.lift : 0.25 * num.lift}
              />
            </g>
          );
        })}
      </WorldSvg>
    </ChartStage>
  );
};

export default HardlyAnybodyDied;
