import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  FLASH,
  FLASH_DENSE,
  FLASH_DENSE_INK,
  GLIDE,
  LAND,
  RISE,
  backdropStyle,
  clamp01,
  hash,
  runCamera,
} from "./cheekyPintSystem";

export const FPS = 24;
// "it's very hard to tell what's going to catch on, because a new model may
// suddenly be good at something that makes a product possible."
// SRT 21.219s -> 28.780s at 24fps.
export const DURATION = 181;

// ---------------------------------------------------------------------------
// Catching on
//
// The vivid word in the line is "catch on", and it does not mean choosing —
// it means spreading. So the scene is a population, and the whole piece is
// about whether anything travels through it.
//
// You try things. Each attempt appears where you tried it, lights the handful
// of people nearest it, pushes out a little way, and goes out. Six of them,
// the last one further than the rest and still not far enough. Then the field
// is dead for a second and a half while he says "because a", and the six
// spent attempts sit there as outlines.
//
// The model is the only amber in the piece. It arrives once, at the centre,
// and the product that becomes possible is built directly on top of it. That
// one catches: the front leaves it and crosses everybody.
//
// Third geometry for this edit — the floor cutaway is vertical and pulls back
// throughout, the models one falls from above and pushes in, this one is a
// populated field with a front crossing it, and its camera is locked off for
// 150 frames and then makes a single fast reveal, so you do not find out how
// many people there are until something reaches them.
// ---------------------------------------------------------------------------
const G = 22;
const RX = 11;

const WORLD_W = 2400;
const WORLD_H = 2600;
const X0 = 1200;
const Y0 = 1200;

const COLS = 13;
const ROWS = 17;
const STEP_X = 108;
const STEP_Y = 104;
const N = COLS * ROWS;
const HALF_X = ((COLS - 1) / 2) * STEP_X;
const HALF_Y = ((ROWS - 1) / 2) * STEP_Y;
const DOT_R = 13;
const SCATTER = 0.84; // off-cell, so it reads as a crowd and not a lattice

// A rectangle of people reads as a swatch, and the hard vertical sides are the
// first thing you see once the whole field is lit. So the corners are cut on a
// soft ellipse whose edge is ragged per person — a population with an edge you
// cannot draw, rather than a grid with a boundary.
const inCrowd = (i: number, nx: number, ny: number) =>
  Math.hypot(nx, ny) < 1.04 + (hash(i * 17 + 3) - 0.5) * 0.24;

// Six attempts. Times are authored against the words, not spaced evenly: one
// is already fading at frame 0 so the shot opens mid-try.
type Attempt = { x: number; y: number; at: number; reach: number; w: number };
const ATTEMPTS: Attempt[] = [
  { x: -150, y: -130, at: -8, reach: 180, w: 5 * G },
  { x: 120, y: 110, at: 8, reach: 195, w: 4 * G },
  { x: -95, y: 250, at: 20, reach: 175, w: 5 * G },
  { x: 130, y: -230, at: 32, reach: 205, w: 6 * G },
  { x: -140, y: 70, at: 44, reach: 190, w: 4 * G },
  // "catch on" — the near miss. It goes more than twice as far as any of the
  // others and still stops.
  // It happens right where the one that works will later appear, and it is
  // the only attempt allowed to fill the frame — that is what makes it the
  // one you would have bet on.
  { x: 0, y: -190, at: 55, reach: 400, w: 5 * G },
];
const A_R0 = 60;
const A_GROW = 16;
const A_H = 2 * G;

// The model, and the product built on it.
const MODEL_AT = 103;
const MODEL_FLARE = 116;
const MODEL_W = 4 * G;
const MODEL_W2 = 5 * G;
const PROD_AT = 124;
const PROD_T = 16;
const PROD_CLICK = 145;
const PROD_W = 6 * G;

const IGNITE = 150;
const FRONT_T = 26;
const FRONT_MAX = 1160;
const FRONT_EDGE = 90;

const ez = (e: (t: number) => number, x: number) => e(clamp01(x));

// Rise, hold, decay. Everything an attempt does happens inside this.
const life = (age: number) => {
  if (age < 0) return 0;
  if (age < 4) return age / 4;
  if (age < 10) return 1;
  return clamp01(1 - (age - 10) / 14);
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  dotDim: z.number(),
  dotLit: z.number(),
  spentOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "it's very" · 18 "hard to tell" · 40 "what's going to" · 55 "catch on"
  //   69 "because a" · 103 "new model may" · 116 "suddenly" · 124 "be good at"
  //   138 "something" · 145 "that makes" · 157 "a product" · 167 "possible"
  //   181 end
  beats: z.object({
    hardToTell: z.number().int(),
    catchOn: z.number().int(),
    because: z.number().int(),
    newModel: z.number().int(),
    suddenly: z.number().int(),
    possible: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  backgroundBase: "#2B2118",
  backgroundSrc: "brown-paper-backdrop.jpg",
  backgroundBlur: 16,
  backgroundDim: 0.68,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotDim: 0.42,
  dotLit: 0.95,
  spentOpacity: 0.2,
  beats: {
    hardToTell: 18,
    catchOn: 55,
    because: 69,
    newModel: 103,
    suddenly: 116,
    possible: 167,
  },
});

const CatchesOn: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  dotDim,
  dotLit,
  spentOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // Locked off while nothing is spreading, then one fast widening driven by
  // the front. The crowd's real size is the payoff, so it is withheld.
  const CAM_F = [0, 40, 69, 103, 135, 152, 164, DURATION];
  const CAM_K = [1.35, 1.33, 1.28, 1.14, 1.08, 1.0, 0.72, 0.66];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, (kk: number) => Y0 + 125 / kk),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );

  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;

  const front = interpolate(frame, [IGNITE, IGNITE + FRONT_T], [0, FRONT_MAX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const modelIn = ez(LAND, (frame - MODEL_AT) / 9);
  const modelGrow = ez(LAND, (frame - MODEL_FLARE) / 10);
  const modelW = MODEL_W + (MODEL_W2 - MODEL_W) * modelGrow;
  const flare = frame - MODEL_FLARE;
  const modelFill =
    flare >= 0 && flare < FLASH_DENSE + 1 ? FLASH_DENSE_INK : accent;
  const modelTop = Y0 - modelW / 2;

  const prodOpen = ez(RISE, (frame - PROD_AT) / PROD_T);
  const prodClick = clamp01(1 - (frame - PROD_CLICK) / FLASH);
  const prodFilled = frame >= PROD_CLICK;

  // Live attempt state, computed once per frame rather than per dot.
  const live = ATTEMPTS.map((a) => {
    const age = frame - a.at;
    const l = life(age);
    return { a, l, r: A_R0 + a.reach * ez(GLIDE, age / A_GROW) };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(frame, cy, k, Y0 + 125 / CAM_K[0], backgroundBlur, backgroundDim)}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {Array.from({ length: N }, (_, i) => {
              const col = i % COLS;
              const row = Math.floor(i / COLS);
              const ox =
                (col - (COLS - 1) / 2) * STEP_X +
                (hash(i * 3 + 1) - 0.5) * STEP_X * SCATTER;
              const oy =
                (row - (ROWS - 1) / 2) * STEP_Y +
                (hash(i * 7 + 5) - 0.5) * STEP_Y * SCATTER;
              if (!inCrowd(i, ox / HALF_X, oy / HALF_Y)) return null;
              const px = X0 + ox;
              const py = Y0 + oy;
              const ph = hash(i * 13 + 9) * 6.283;
              const x = px + Math.cos(frame / 41 + ph) * 3;
              const y = py + Math.sin(frame / 33 + ph) * 4;

              // What any attempt is currently doing to this person.
              let touched = 0;
              for (const { a, l, r } of live) {
                if (l <= 0) continue;
                const d = Math.hypot(px - (X0 + a.x), py - (Y0 + a.y));
                if (d < r) touched = Math.max(touched, l * clamp01((1 - d / r) * 1.9));
              }

              // And whether the one that caught has reached them yet.
              const d0 = Math.hypot(px - X0, py - Y0);
              const adopt = front > 0 ? clamp01((front - d0) / 26) : 0;
              const edge =
                front > 0 && front < FRONT_MAX
                  ? clamp01(1 - Math.abs(front - d0) / FRONT_EDGE)
                  : 0;

              const s = Math.max(adopt, touched);
              const r = DOT_R * (0.75 + hash(i * 11 + 3) * 0.5) * (1 + 0.28 * s + 0.4 * edge);
              return (
                <circle
                  key={`d-${i}`}
                  cx={x}
                  cy={y}
                  r={r}
                  fill={ink}
                  opacity={Math.min(1, dotDim + (dotLit - dotDim) * s + 0.3 * edge)}
                />
              );
            })}

            {ATTEMPTS.map((a, i) => {
              const age = frame - a.at;
              if (age < 0) return null;
              const open = ez(LAND, age / 5);
              const l = life(age);
              const w = a.w * (0.3 + 0.7 * open);
              // Spent attempts stay as outlines. Six of them by the pause,
              // which is the count of what was thrown at this.
              return (
                <rect
                  key={`a-${i}`}
                  x={X0 + a.x - w / 2}
                  y={Y0 + a.y - A_H / 2}
                  width={w}
                  height={A_H}
                  rx={RX}
                  fill={ink}
                  fillOpacity={0.92 * l}
                  stroke={ink}
                  strokeWidth={3}
                  strokeOpacity={spentOpacity * (1 - l)}
                />
              );
            })}

            {modelIn > 0 ? (
              <rect
                x={X0 - (modelW * modelIn) / 2}
                y={Y0 - (modelW * modelIn) / 2}
                width={modelW * modelIn}
                height={modelW * modelIn}
                rx={RX}
                fill={modelFill}
                opacity={0.95}
              />
            ) : null}

            {prodOpen > 0 ? (
              <rect
                x={X0 - (PROD_W * prodOpen) / 2}
                y={modelTop - A_H - G / 2}
                width={PROD_W * prodOpen}
                height={A_H}
                rx={RX}
                fill={ink}
                fillOpacity={prodFilled ? 0.96 : 0}
                stroke={ink}
                strokeWidth={3}
                strokeOpacity={prodFilled ? 0.96 * prodClick : 0.42}
              />
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default CatchesOn;
