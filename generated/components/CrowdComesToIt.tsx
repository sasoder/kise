import React from "react";
import {
  AbsoluteFill,
  Img,
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
// SRT 21.219s -> 28.780s at 24fps; runs to 230 for a tail.
export const DURATION = 230;

// ---------------------------------------------------------------------------
// They come to the one that works
//
// "Catch on" is adoption, so the only thing that matters is whether anybody
// moves. People are people — a head and shoulders, not a dot, because a field
// of dots is a diagram and this needs to be a crowd. Products are the same
// tile the rest of the edit uses.
//
// You try things. Each attempt appears where you tried it and the people
// nearest it lean toward it — a step, a look — and then it goes nowhere and
// they settle back. Six times. The sixth pulls a dozen of them most of the way
// out of their places before it dies, which is the one you would have bet on.
//
// Then the model arrives. It is the only amber in the piece, and the product
// that becomes possible is built directly on top of it. That one they come to:
// nearest first, then further and further out, until everybody has left where
// they were standing and the field they came from is empty paper.
// ---------------------------------------------------------------------------
const G = 22;
const RX = 11;

const WORLD_W = 2400;
const WORLD_H = 2600;
const X0 = 1200;
const Y0 = 1300;

const COLS = 13;
const ROWS = 15;
const STEP_X = 118;
const STEP_Y = 112;
const HALF_X = ((COLS - 1) / 2) * STEP_X;
const HALF_Y = ((ROWS - 1) / 2) * STEP_Y;
const SCATTER = 0.8;

// Where they end up: keep each person's bearing so they walk straight in, and
// compress the radius by rank so the crowd packs from the middle outward. The
// disc is taller than it is wide because the frame is.
const RX_MIN = 110;
const RX_PACK = 380;
const RY_MIN = 150;
const RY_PACK = 530;

type Person = { hx: number; hy: number; tx: number; ty: number; s: number; ph: number };

const PEOPLE: Person[] = (() => {
  const raw: { hx: number; hy: number; i: number }[] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const ox =
      (((i % COLS) - (COLS - 1) / 2) * STEP_X) +
      (hash(i * 3 + 1) - 0.5) * STEP_X * SCATTER;
    const oy =
      ((Math.floor(i / COLS) - (ROWS - 1) / 2) * STEP_Y) +
      (hash(i * 7 + 5) - 0.5) * STEP_Y * SCATTER;
    // A ragged elliptical edge — a crowd has no boundary you could draw.
    if (Math.hypot(ox / HALF_X, oy / HALF_Y) > 1.02 + (hash(i * 17 + 3) - 0.5) * 0.26)
      continue;
    raw.push({ hx: ox, hy: oy, i });
  }
  const order = raw
    .map((p, n) => ({ n, d: Math.hypot(p.hx, p.hy) }))
    .sort((a, b) => a.d - b.d);
  const out: Person[] = new Array(raw.length);
  order.forEach((o, rank) => {
    const p = raw[o.n];
    const th = Math.atan2(p.hy, p.hx) + (hash(p.i * 23 + 7) - 0.5) * 0.26;
    const rr = Math.sqrt((rank + 0.5) / raw.length);
    out[o.n] = {
      hx: p.hx,
      hy: p.hy,
      tx: Math.cos(th) * (RX_MIN + rr * (RX_PACK - RX_MIN)),
      ty: Math.sin(th) * (RY_MIN + rr * (RY_PACK - RY_MIN)),
      s: 0.85 + hash(p.i * 11 + 3) * 0.3,
      ph: hash(p.i * 13 + 9) * 6.283,
    };
  });
  return out;
})();

// Six attempts, authored against the words. One is already fading at frame 0
// so the shot opens mid-try.
type Attempt = { x: number; y: number; at: number; reach: number; w: number };
const ATTEMPTS: Attempt[] = [
  { x: -150, y: -130, at: -8, reach: 265, w: 5 * G },
  { x: 120, y: 110, at: 8, reach: 280, w: 4 * G },
  { x: -95, y: 250, at: 20, reach: 258, w: 5 * G },
  { x: 130, y: -230, at: 32, reach: 292, w: 6 * G },
  { x: -140, y: 70, at: 44, reach: 276, w: 4 * G },
  // "catch on" — the near miss. It pulls people most of the way out of their
  // places and still comes to nothing.
  { x: 0, y: -190, at: 55, reach: 520, w: 5 * G },
];
const A_R0 = 70;
const A_GROW = 16;
const A_H = 2 * G;
const LEAN = 62;

const MODEL_AT = 103;
const MODEL_FLARE = 116;
const MODEL_W = 4 * G;
const MODEL_W2 = 5 * G;
const PROD_AT = 124;
const PROD_T = 16;
const PROD_CLICK = 145;
const PROD_W = 6 * G;

const COME_AT = 144;
const COME_T = 38;
const COME_STAGGER = 0.034; // frames per world unit out — near ones go first

const ez = (e: (t: number) => number, x: number) => e(clamp01(x));

const life = (age: number) => {
  if (age < 0) return 0;
  if (age < 5) return ez(GLIDE, age / 5);
  if (age < 11) return 1;
  return 1 - ez(GLIDE, (age - 11) / 15);
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
  restOpacity: z.number(),
  keenOpacity: z.number(),
  spentOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "it's very" · 18 "hard to tell" · 40 "what's going to" · 55 "catch on"
  //   69 "because a" · 103 "new model may" · 116 "suddenly" · 124 "be good at"
  //   138 "something" · 145 "that makes" · 157 "a product" · 167 "possible"
  //   181 line ends · 230 end of tail
  beats: z.object({
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
  restOpacity: 0.44,
  keenOpacity: 0.95,
  spentOpacity: 0.2,
  beats: {
    catchOn: 55,
    because: 69,
    newModel: 103,
    suddenly: 116,
    possible: 167,
  },
});

const CrowdComesToIt: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  restOpacity,
  keenOpacity,
  spentOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // Three movements, each tapered at both ends so the damped follower never
  // has to stop dead. A slow drift while nothing works; one push in to 1.40 on
  // the model; then wide enough to watch them all coming, and back in to
  // settle on what they formed.
  const CAM_F = [0, 95, 112, 134, 150, 158, 170, 186, 202, 216, DURATION];
  const CAM_K = [1.18, 1.1, 1.2, 1.38, 1.4, 1.36, 1.1, 0.74, 0.7, 0.86, 0.92];
  const CAM_CY = [1372, 1420, 1404, 1391, 1389, 1392, 1414, 1469, 1479, 1445, 1436];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );

  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;

  const modelIn = ez(LAND, (frame - MODEL_AT) / 9);
  const modelGrow = ez(LAND, (frame - MODEL_FLARE) / 10);
  const modelW = MODEL_W + (MODEL_W2 - MODEL_W) * modelGrow;
  const flareAge = frame - MODEL_FLARE;
  const modelFill =
    flareAge >= 0 && flareAge < FLASH_DENSE + 1 ? FLASH_DENSE_INK : accent;

  const prodOpen = ez(RISE, (frame - PROD_AT) / PROD_T);
  const prodFilled = frame >= PROD_CLICK;
  const prodClick = clamp01(1 - (frame - PROD_CLICK) / FLASH);

  const live = ATTEMPTS.map((a) => {
    const age = frame - a.at;
    return { a, l: life(age), r: A_R0 + a.reach * ez(GLIDE, age / A_GROW) };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(frame, cy, k, CAM_CY[0], backgroundBlur, backgroundDim)}
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
            {ATTEMPTS.map((a, i) => {
              const age = frame - a.at;
              if (age < 0) return null;
              const open = ez(LAND, age / 5);
              const l = life(age);
              const w = a.w * (0.3 + 0.7 * open);
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

            {PEOPLE.map((p, i) => {
              // Who is pulling on them right now, and how hard.
              let pull = 0;
              let pdx = 0;
              let pdy = 0;
              for (const { a, l, r } of live) {
                if (l <= 0) continue;
                const dx = a.x - p.hx;
                const dy = a.y - p.hy;
                const d = Math.hypot(dx, dy);
                if (d >= r || d < 1) continue;
                const w = l * ez(GLIDE, ((1 - d / r) * 1.8) as number);
                if (w > pull) {
                  pull = w;
                  pdx = dx / d;
                  pdy = dy / d;
                }
              }

              // And whether they have left for good yet. The delay is their
              // distance from the product, so it reads as word of mouth
              // travelling outward rather than everyone starting at once.
              const delay = Math.hypot(p.hx, p.hy) * COME_STAGGER;
              const come = ez(GLIDE, (frame - COME_AT - delay) / COME_T);

              const idleX = Math.cos(frame / 47 + p.ph) * 5;
              const idleY = Math.sin(frame / 39 + p.ph) * 6;
              const x =
                X0 +
                p.hx +
                (p.tx - p.hx) * come +
                (pdx * LEAN * pull + idleX) * (1 - come);
              const y =
                Y0 +
                p.hy +
                (p.ty - p.hy) * come +
                (pdy * LEAN * pull + idleY) * (1 - come);

              const s = Math.max(pull, come);
              const sc = p.s * (1 + 0.08 * s);
              return (
                <g
                  key={`p-${i}`}
                  transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)})`}
                  fill={ink}
                  opacity={restOpacity + (keenOpacity - restOpacity) * s}
                >
                  <circle cx={0} cy={-15} r={9} />
                  <path d="M-15 21 L-15 8 A15 15 0 0 1 15 8 L15 21 Z" />
                </g>
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
                y={Y0 - modelW / 2 - A_H - G / 2}
                width={PROD_W * prodOpen}
                height={A_H}
                rx={RX}
                fill={ink}
                fillOpacity={prodFilled ? 0.96 : 0}
                stroke={ink}
                strokeWidth={3}
                strokeOpacity={prodFilled ? 0.96 * prodClick : 0.5}
              />
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default CrowdComesToIt;
