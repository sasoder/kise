// ---------------------------------------------------------------------------
// ReadingLess (wip-ya-boom, cut 46). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx).
// Opaque 1080x1920, 24 fps, 117 frames.
//
// CHECK LINE: "the share of Americans who read for pleasure fell from 28% in 2004 to 16% in 2023, about 40% fewer". With
// the sound off: a photocopied woman absorbed in a book is taped to the page, and over her a red felt-tip draws one falling line from
// "28% / 2004" down to "16% / 2023", with "-40%" scrawled along the drop.
//
// THE LINE: "The percentage of Americans reading for pleasure has dropped 40% over the last 20 years."
// WORD -> FRAME: The -2 · percentage 1 · of 11 · Americans 17 · reading 23 · for 34 · pleasure 39 · has 46 · dropped 53 ·
// 40 62 · % 73 · over 81 · the 89 · last 92 · 20 97 · years 103 · (Today's 115, the next cut)
// DURATION: the slot 46.875 -> 51.750 s = 4.875 s x 24 = 117 frames (f0..f116).
//
// THE MOTION: one slow push (k 0.94 -> 1.0) over the page. A big photocopied reader, ~1000 px tall, is taped on at f0 and
// never animated: her face just above the true middle (y ~830-1000), her body and book running down through the caption
// bands (no readable thing there). Above her the felt-tip draws the slope as the frame's big diagonal, upper left (2004,
// y 420) falling past over her head to the right (2023, y 860). It presses the 2004 dot and writes "28%" over it as
// "Americans reading" is said, the mono "2004" rising under the dot; from "has" it draws the line falling by its tip to the
// 2023 point, reaching it on "40"; it scrawls "-40%" along the drop (on the free paper above it) by "%", then writes "16%"
// under the 2023 dot while "2023" rises beside it. From f84 the picture is settled; only the push and the grain live.
// Pen frames: dot 2004 9-13 · "28%" 13-22 · line 42-62 (even pen speed, peak ~62 px/frame) · dot 2023 62-65 · "-40%" 64-73 ·
// "16%" 75-83. Labels: "2004" rises from 15, "2023" from 77.
// SPOT INK: red = the editor's felt-tip: the two figures, the falling line and the drop. No other colour.
// HONEST SLOPE: the two points sit on one vertical scale with an unseen zero (the drop is 12/28 of the 28 point's height
// above that zero); only the two sourced points, joined by one straight-ish stroke; no axes, gridlines or title.
//
// SOURCES: share of Americans who read for pleasure on a given day: 28% in 2004, 16% in 2023, about -40% (UF/UCL, iScience,
// Aug 2025, American Time Use Survey; https://news.ufl.edu/2025/08/reading-for-pleasure-study/), verified by the director.
// Reader: Missouri State Archives, "Historic Fashion - 1910s" glass plate (Flickr 49233107183, no known copyright
// restrictions), assets_raw/photos/reader_Woman1910sSeatedReading.jpg, person matte (neal-matte.swift), cropped head to
// skirt (--crop 430,1080,1720,2900), baked by scripts/clips/wip-ya-boom/bake-ReadingLess.py to public/wip-ya-boom/rl_reader.png.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, PaperGround, WipFilmLife, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { MarkerPath, MarkerText, MonoLabel, THEME, Tape, XeroxCutOut } from "./yaShared";

export const FPS = 24;
export const DURATION = 117;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the reader: a big photocopy taped to the page under the drop, her face just above the true middle -----------------------
const READER_SRC = "wip-ya-boom/rl_reader.png";
const READER_ASPECT = 0.7086;
const READER_H = 1000;
const READER_X = 438;
const READER_Y = 1180;
const READER_ROT = -2;
// the hair's top edge at the middle of the cut-out, world px: (0, -0.453 H) from the centre, turned by READER_ROT
const HAIR_UP = READER_H * (0.5 - 0.047) + 6; // + the scissor margin, half of it
const HAIR_TAPE_X = READER_X + HAIR_UP * Math.sin((READER_ROT * Math.PI) / 180);
const HAIR_TAPE_Y = READER_Y - HAIR_UP * Math.cos((READER_ROT * Math.PI) / 180);

// -- the chart: two sourced points on one vertical scale with an unseen zero ---------------------------------------------
const V0 = 28;
const V1 = 16;
const AX = 150; // 2004
const BX = 860; // 2023
const AY = 420;
const DROP = 440; // px for 12 points
const ZERO_Y = AY + (DROP * V0) / (V0 - V1); // unseen
const BY = ZERO_Y - ((ZERO_Y - AY) * V1) / V0;
const SLOPE = Math.atan2(BY - AY, BX - AX); // rad
// the hand's line: a straight stroke with a hair of wobble, dot to dot
const LINE: [number, number][] = [0, 0.27, 0.52, 0.78, 1].map((u, i) => [
  AX + (BX - AX) * u + [0, 2, -1, 1, 0][i],
  AY + (BY - AY) * u + [0, -3, 2, -2, 0][i],
]);
// "-40%" over the middle of the drop, along it, on the free paper above the line
const ALONG = 0.5;
const MID_X = AX + (BX - AX) * ALONG;
const MID_Y = AY + (BY - AY) * ALONG;
const OVER = 104;
const DROP_LABEL_X = MID_X + Math.sin(SLOPE) * OVER;
const DROP_LABEL_Y = MID_Y - Math.cos(SLOPE) * OVER;

// -- pen and label frames -------------------------------------------------------------------------------------------------
const DOT_A = 9;
const TXT_A = 13;
const YEAR_A = 15;
const LINE_IN = 42;
const LINE_DUR = 20;
// the long stroke on an even pen speed (peak ~62 world px/frame over its ~830 px), not penEase's quick middle
const LINE_EASE = Easing.bezier(0.3, 0, 0.55, 1);
const lineAt = (f: number) => interpolate(f, [LINE_IN, LINE_IN + LINE_DUR], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: LINE_EASE });
const DOT_B = LINE_IN + LINE_DUR;
const TXT_DROP = 64;
const TXT_B = 75;
const YEAR_B = 77;

const FIG_SIZE = 200;
const DROP_SIZE = 168;

// -- the camera: one slow push in, still easing at the cut --------------------------------------------------
const camAt = runWipCamera(
  [
    { f: -24, x: 548, y: 925, k: 0.94 },
    { f: 150, x: 538, y: 966, k: 1.012 },
  ],
  DURATION,
);

const ReadingLess: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        <WipPlane cam={cam}>
          <XeroxCutOut
            src={READER_SRC}
            kind="person"
            x={READER_X}
            y={READER_Y}
            w={READER_H * READER_ASPECT}
            aspect={READER_ASPECT}
            rotate={READER_ROT}
            tape={[{ at: "b", along: 0.55, angle: -4 }]}
            seed="rl-reader"
          />
          {/* the top strip straddles her hair's cut edge (the matte's top at u 0.5 is v 0.047, rotated about the centre) */}
          <Tape x={HAIR_TAPE_X} y={HAIR_TAPE_Y} len={124} angle={78} seed="rl-tape-top" />
          <MonoLabel text="2004" x={AX - 6} y={AY + 40} frame={frame} start={YEAR_A} size={40} align="center" />
          <MonoLabel text="2023" x={BX + 26} y={BY - 22} frame={frame} start={YEAR_B} size={40} />
        </WipPlane>
        <WipPlane cam={cam} ink>
          <MarkerPath shape={{ kind: "ring", cx: AX, cy: AY, rx: 9, ry: 8, turns: 1.7, tilt: 0 }} nib={25} frame={frame} start={DOT_A} dur={4} seed="rl-dot-a" />
          <MarkerText text="28%" x={AX + 118} y={AY - 112} size={FIG_SIZE} frame={frame} start={TXT_A} dur={9} rotate={-3} seed="rl-28" />
          <MarkerPath shape={{ kind: "line", points: LINE }} nib={15} frame={frame} start={LINE_IN} progress={lineAt(frame)} seed="rl-line" />
          <MarkerPath shape={{ kind: "ring", cx: BX, cy: BY, rx: 9, ry: 8, turns: 1.7, tilt: 0 }} nib={25} frame={frame} start={DOT_B} dur={3} seed="rl-dot-b" />
          <MarkerText
            text="-40%"
            x={DROP_LABEL_X}
            y={DROP_LABEL_Y}
            size={DROP_SIZE}
            frame={frame}
            start={TXT_DROP}
            dur={9}
            rotate={(SLOPE * 180) / Math.PI - 1}
            seed="rl-40"
          />
          <MarkerText text="16%" x={BX - 20} y={BY + 98} size={FIG_SIZE} frame={frame} start={TXT_B} dur={8} rotate={-2} seed="rl-16" />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default ReadingLess;
