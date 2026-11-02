// ---------------------------------------------------------------------------
// FourOrFiveHours (wip-victorians, cut 13). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 97 frames.
//
// CHECK LINE: "A 996 worker's whole day against these men's four or five hours, on one watch face."
//
// THE LINE: "996, most of these guys put in only four or five hours of work every day"
// WORD -> FRAME: 996 3 · most 17 · of 25 · these 30 · guys 33 · put 38 · in 43 · only 47 · four 51 · or 57 · five 62 · hours 64 ·
// of 74 · work 77 · every 81 · day 88
// DURATION: the slot 13.708 -> 17.750 s = 4.042 s x 24 = 97 frames (f0..f96).
//
// THE MOTION: one real pocket watch, square-on; the camera pushes in slowly all the way. The whole dial starts flooded with red
// (9 to 9, a 996 day), then the ink winds back round the dial on the watch's own minute hand, opening between the two hands, f17-51, to a wedge of exactly four
// hours from IX to I on "four", and eases out one more hour, f57-64, to exactly five on "hours". From f64 it holds on the push
// and the ticking seconds hand. The last frame is the join to cut 17: camera exactly {540, 960, 1}.
// Contact frames: the "996" mark touches the ink on f3 (its word). It is printed on the red, so the edge wipes it away (gone by f35).
// SPOT INK: red = the empire's men's time, multiplied into the white enamel so the numerals show through. No indigo.
//
// SOURCES: watch by Francois Czapek, Metropolitan Museum DP338176, CC0 (commons File:Watch_MET_DP338176.jpg);
// scripts/clips/wip-victorians/bake-watch.py lifts its hands and grades it. The seconds hand is drawn: this watch has none.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, InkPrint, MONO, PaperGround, WipCam, WipFilmLife, inkPress } from "../kits/works-in-progress/wipShared";
import { PocketWatch, WATCH_X, WATCH_Y } from "./watchShared";

export const FPS = 24;
export const DURATION = 97;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// The push: one speed from f0, landing exactly on cut 17's opening camera on f96. No tracker here: a damped follower only
// nears its key, and the join needs the exact number.
const K0 = 0.9;
const LAST = DURATION - 1;
const camAt = (frame: number): WipCam => ({ x: 540, y: 960, k: K0 ** (1 - frame / LAST), x0: 540, y0: 960 });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const WIND = Easing.bezier(0.42, 0, 0.5, 1);
// The long wind leaves with a little speed: an ease from dead slow spends f18-20 as a hairline of white beside the hand.
const WIND_BACK = Easing.bezier(0.3, 0.08, 0.5, 1);
const hoursAt = (frame: number) =>
  frame < 57
    ? interpolate(frame, [17, 51], [12, 4], { ...clamp, easing: WIND_BACK })
    : interpolate(frame, [57, 64], [4, 5], { ...clamp, easing: WIND });

// The mark sits below the pivot, clear of the final wedge, and across the red.
const MARK = "#470410";
const MARK_D = 316;
const MARK_X = WATCH_X + 6;
const MARK_Y = WATCH_Y + 170;

const NineNineSix: React.FC<{ press: number }> = ({ press }) => (
  <InkPrint x={MARK_X - MARK_D / 2} y={MARK_Y - MARK_D / 2} w={MARK_D} h={MARK_D} ink={MARK} seed="mark-996" rotate={-9} rough={2.2} wear={0.5} misregister={1.4} press={press}>
    {(ink) => (
      <svg width={MARK_D} height={MARK_D} viewBox={`0 0 ${MARK_D} ${MARK_D}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={MARK_D / 2} cy={MARK_D / 2} r={MARK_D / 2 - 7} fill="none" stroke={ink} strokeWidth={10} />
        <circle cx={MARK_D / 2} cy={MARK_D / 2} r={MARK_D / 2 - 24} fill="none" stroke={ink} strokeWidth={4} />
        <text x={MARK_D / 2} y={MARK_D / 2} textAnchor="middle" dominantBaseline="central" fontFamily={MONO} fontWeight={500} fontSize={118} letterSpacing={-3} fill={ink} stroke={ink} strokeWidth={2.5}>
          996
        </text>
      </svg>
    )}
  </InkPrint>
);

const FourOrFiveHours: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <PocketWatch frame={frame} cam={cam} hours={hoursAt(frame)} onInk={<NineNineSix press={inkPress(frame, 3)} />} />
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default FourOrFiveHours;
