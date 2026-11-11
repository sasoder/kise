// ---------------------------------------------------------------------------
// AlsoSpiky (rsi-years-in-days, cut 55). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 157 frames.
//
// CHECK LINE: "The 2028 AI's skills are a row of spikes: some stick out above the best humans, others don't even
// reach the average person."
//
// THE LINE (after "Similar to how today's AIs are spiky,"): "the AIs of 2028 will also be spiky. Better than the
// best humans at some things, and worse than the average humans at others."
// WORD -> FRAME: the -4 · AIs 1 · of 8 · 2028 12 · will 22 · also 31 · be 39 · spiky 43 · Better 54 · than 66 ·
// the 68 · best 71 · humans 75 · at 82 · some 86 · things 89 · and 99 · worse 109 · than 116 · the 119 ·
// average 123 · humans 129 · at 135 · others 141 (· next line 154).
// DURATION: the slot 55.847 -> 62.396 s = 6.549 s x 23.976 = 157 frames (f0..f156).
//
// THE MOTION: one row of 22 orange needles (one per skill, unlabelled, each a sharp thorn) stands on a white
// baseline under two white human lines, AVERAGE HUMAN and BEST HUMANS (spikyShared). At f0 it is today's row: short,
// already jagged, deep tone, "TODAY" in the chart's top-left corner. From f0 every needle grows on its own eased
// curve (staggered starts 0-8, all landed by f44) to its 2028 height, ripening in tone as it rises, while TODAY
// slides up and out (f8-17) and 2028 slides into its place (f13-23). Six tips pass the best-humans line (f19-28) and
// the part of each above it turns HIGHLIGHT, derived from the tip's own position; those six are drawn wider (28 px)
// so that part has ~20-25 px of body. Six stay under the average line and barely move. The camera makes one travel:
// it rises and pushes in with the growth to the tips (k 1.07 -> 1.30, best line just above mid-frame by ~f55, BEST
// HUMANS sliding in f50-60), keeps pushing slowly (k 1.38 at f90) while drifting down, then sinks to the stragglers
// (f92-120, AVERAGE HUMAN sliding in f104-114; the average line at screen ~650 and the short tips below it by f118,
// "2028" fully out above the frame f112-127) and opens out to the whole chart (k 1.0 by ~f152), where the needles
// sway a hair in height, the camera creeps and the grid drifts to f156. No fade.
// Orange = the AI's skills, nothing else; white = the human levels, the baseline, the labels.
//
// SOURCES: none. The heights are a hand-made schematic, not data; nothing on screen carries a number.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  hash,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { Label, labelIn } from "../kits/dwarkesh/alignShared";
import {
  AboveBestClip,
  ChartLines,
  LevelLabel,
  Needle,
  ROW_L,
  ROW_R,
  YEAR_LABEL_SIZE,
  YEAR_X,
  YEAR_Y,
  chartCamera,
} from "./spikyShared";

export const FPS = 24000 / 1001;
export const DURATION = 157;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE NEEDLES. Hand-made heights in levels (v: 0 baseline, 1 average human, 2 best humans). Today's row (V_TODAY) is
// short and jagged; 2028's (V_2028) is taller and MORE jagged: six end above the best line (2.18-2.55), six stay
// under the average line (0.33-0.70), the rest in between, tall and short interleaved with no slope or bell to it.
// ---------------------------------------------------------------------------
export const V_TODAY = [
  0.75, 1.05, 0.4, 0.85, 0.7, 1.2, 0.22, 0.55, 1.3, 0.6, 0.8, 0.95, 0.3, 1.1, 0.65, 0.45, 1.15, 0.9, 0.15, 0.75, 1.0,
  0.85,
];
export const V_2028 = [
  1.45, 2.42, 0.55, 1.1, 2.2, 1.75, 0.38, 0.7, 2.55, 1.3, 0.95, 2.3, 0.48, 1.62, 1.88, 0.62, 2.48, 1.2, 0.33, 2.18,
  1.52, 1.95,
];
export const N_NEEDLES = V_2028.length;
const W_MAX = 26;
// The six that end above the best line are a step wider (28), so their part above it has body to carry the
// HIGHLIGHT; the rest are 22-24. Positions keep the original 26 px layout (W_MAX), so the row's x-range is unchanged.
const W_CROSS = 28;
const NEEDLE_W = V_2028.map((v, i) => (v > 2 ? W_CROSS : 22 + 2 * hash(i, 3)));
const PITCH = (ROW_R - ROW_L - W_MAX) / (N_NEEDLES - 1);
export const NEEDLE_X = V_2028.map((_, i) => ROW_L + W_MAX / 2 + i * PITCH);

// Growth: needle i starts at GROW_F0[i] (hashed 0-8 f) and lands GROW_DUR[i] later (30-36 f); all done by f44.
// The six that will pass the best line start in the later half of the stagger, so their crossings fall while the
// camera is rising toward them rather than in the first frames.
const GROW_F0 = V_2028.map((v, i) => (v > 2 ? 4 + Math.round(4 * hash(i, 11)) : Math.round(7 * hash(i, 11))));
const GROW_DUR = V_2028.map((_, i) => 30 + Math.round(6 * hash(i, 17)));
// a quick start (the growth reads from the first frames) and a long settle
const growEase = Easing.bezier(0.33, 0, 0.22, 1);
// Life: a hashed slow sway of +-1.5 % in height, always on, so nothing ever freezes.
const swayOf = (i: number, f: number) => 1 + 0.015 * Math.sin(f * (0.045 + 0.03 * hash(i, 23)) + hash(i, 29) * 6.28);
export const needleV = (i: number, f: number) => {
  const g = growEase(clamp01((f - GROW_F0[i]) / GROW_DUR[i]));
  return (V_TODAY[i] + (V_2028[i] - V_TODAY[i]) * g) * swayOf(i, f);
};

// ---------------------------------------------------------------------------
// THE CAMERA. One travel on monotone Hermite knots through the kit's damper, pre-rolled from f-24 so f0 is already
// drifting. y = the world point at the frame's centre (world = screen at k 1, cx 540, cy 960).
//   f0    k 1.08  y 1010 : today's short row under the two lines, TODAY in the corner
//   f50   k 1.28  y  600 : risen and pushed in with the growth to the tips, best line just above mid-frame
//   f90   k 1.38  y  660 : the push on the tips keeps going, slowly, drifting down: it joins the phases
//   f112  k 1.30  y 1065 : the average line and the stragglers' gap mid-frame; 2028 (top corner) fully out
//   f146  k 1.00  y  960 : the whole chart (REST_CAM), creeping on to f156
// x leans left (to ~430) while zoomed so the gutter labels stay inside the frame.
// ---------------------------------------------------------------------------
const CAM_PRE = -24;
const KNOTS = [
  { f: -24, k: 1.06, x: 540, y: 1030 },
  { f: 0, k: 1.08, x: 538, y: 1010 },
  { f: 50, k: 1.28, x: 450, y: 600 },
  { f: 90, k: 1.38, x: 428, y: 660 },
  { f: 112, k: 1.3, x: 458, y: 1065 },
  { f: 146, k: 1.0, x: 540, y: 960 },
  { f: 190, k: 0.985, x: 540, y: 955 },
];
export const camAt = chartCamera(KNOTS, CAM_PRE, DURATION + 4);
const CAM0 = camAt(0);

// Labels: the year crossfade, then each human level on its words.
// TODAY -> 2028 in one 15-frame swap on "2028" (f12): TODAY slides up and out f8-17, 2028 slides up into its place
// f13-23, so the two words share only a few low-opacity frames instead of sitting on top of each other.
const TODAY_OUT_F0 = 8;
const TODAY_OUT_F1 = 17;
const YEAR_IN_F0 = 13;
const BEST_IN_F0 = 50; // lands f60, under "Better" (54) .. "best" (71)
const AVG_IN_F0 = 104; // lands f114, ahead of "average" (123)

const AlsoSpiky: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const { k, cx, cy } = cam;
  const s = sway(frame);
  const { tx, ty } = worldTransform(cx, cy, k);

  const xf = Easing.inOut(Easing.sin)(clamp01((frame - TODAY_OUT_F0) / (TODAY_OUT_F1 - TODAY_OUT_F0)));

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM0.cy}
        cx={cx}
        cxRest={CAM0.cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <AboveBestClip />
            <ChartLines />
            {NEEDLE_X.map((x, i) => (
              <Needle key={i} x={x} w={NEEDLE_W[i]} v={needleV(i, frame)} />
            ))}
          </svg>
          <LevelLabel k={k} which="best" inT={labelIn(frame, BEST_IN_F0)} />
          <LevelLabel k={k} which="avg" inT={labelIn(frame, AVG_IN_F0)} />
          {/* the year: TODAY slides up and out as 2028 slides up into its place */}
          {xf < 1 ? (
            <Label
              k={k}
              x={YEAR_X}
              y={YEAR_Y - 28 * xf}
              text="Today"
              inT={1}
              opacity={1 - xf}
              size={YEAR_LABEL_SIZE}
              align="left"
            />
          ) : null}
          <Label
            k={k}
            x={YEAR_X}
            y={YEAR_Y}
            text="2028"
            inT={labelIn(frame, YEAR_IN_F0)}
            size={YEAR_LABEL_SIZE}
            align="left"
          />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default AlsoSpiky;
