import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { Audio } from "@remotion/media";
import { z } from "zod";

const { fontFamily } = loadFont("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export const schema = z.object({
  chalkColor: z.string(),
  // Ball outline dims and turns dashed while the energy is extracted.
  dissolveBall: z.boolean(),
});

type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  chalkColor: "#F4F2EA",
  dissolveBall: true,
});

// Beats follow the speech: ball while "a mass object of m" (0–2.16s),
// arrow + 100% while "extract essentially 100%" (2.16–4.16s),
// equation while "rest mass energy" (4.16–5.46s), then hold.
const BEATS = {
  circle: [4, 40],
  mLabel: [48, 64],
  arrow: [66, 88],
  arrowHead: [88, 96],
  pct: [100, 118],
  eq: [128, 162],
  dissolve: [84, 150],
} as const;

const useDraw = (beat: readonly [number, number], easeOut = true) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [beat[0], beat[1]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut ? Easing.out(Easing.cubic) : Easing.linear,
  });
};

type Seg = { char: string; sub?: boolean; sup?: boolean };

const ChalkWrite: React.FC<{
  segs: Seg[];
  beat: readonly [number, number];
  seed: string;
}> = ({ segs, beat, seed }) => {
  const frame = useCurrentFrame();
  const [start, end] = beat;
  const perChar = (end - start) / segs.length;
  return (
    <span style={{ whiteSpace: "pre" }}>
      {segs.map((seg, i) => {
        const charStart = start + i * perChar;
        const progress = interpolate(
          frame,
          [charStart, charStart + Math.min(perChar, 3)],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const tilt = (random(`${seed}-${i}-r`) * 2 - 1) * 2.5;
        const lift = (random(`${seed}-${i}-y`) * 2 - 1) * 3;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: progress,
              clipPath:
                progress < 1
                  ? `inset(-60% ${(1 - progress) * 110 - 10}% -60% -20%)`
                  : undefined,
              fontSize: seg.sub || seg.sup ? "0.55em" : undefined,
              transform: `translateY(${
                lift + (seg.sub ? 18 : 0) + (seg.sup ? -38 : 0)
              }px) rotate(${tilt}deg)`,
            }}
          >
            {seg.char}
          </span>
        );
      })}
    </span>
  );
};

const toSegs = (text: string): Seg[] => [...text].map((char) => ({ char }));

// Hand-wobbled circle around (300, 420), r ≈ 140.
const BALL_PATH =
  "M 300 278 C 380 274, 446 344, 442 424 C 438 502, 372 564, 296 560 " +
  "C 220 556, 158 494, 162 416 C 166 340, 228 284, 304 282";

const ARROW_PATH = "M 468 486 C 530 516, 578 552, 636 600";
const ARROW_HEAD = "M 640 604 L 588 592 M 640 604 L 626 552";

const DrawnPath: React.FC<{
  d: string;
  progress: number;
  color: string;
  width: number;
  dashed?: boolean;
  opacity?: number;
}> = ({ d, progress, color, width, dashed, opacity = 1 }) => (
  <path
    d={d}
    pathLength={1}
    stroke={color}
    strokeWidth={width}
    strokeLinecap="round"
    fill="none"
    strokeDasharray={dashed ? "0.045 0.035" : 1}
    strokeDashoffset={dashed ? 0 : 1 - progress}
    opacity={progress > 0 ? opacity : 0}
  />
);

const ChalkMassEnergy: React.FC<Props> = (props) => {
  const { chalkColor, dissolveBall } = schema.parse(props);
  const frame = useCurrentFrame();

  const circleDraw = useDraw(BEATS.circle);
  const arrowDraw = useDraw(BEATS.arrow);
  const headDraw = useDraw(BEATS.arrowHead);

  const dissolve = dissolveBall
    ? interpolate(frame, [BEATS.dissolve[0], BEATS.dissolve[1]], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      })
    : 0;
  const ballOpacity = 1 - dissolve * 0.62;
  const solidVsDashed = dissolve; // crossfade solid outline into a dashed one

  return (
    <AbsoluteFill
      style={{ fontFamily, fontWeight: 600, color: chalkColor }}
    >
      <Audio src={staticFile("chalk-writing.wav")} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="chalk-rough">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.35"
              numOctaves="2"
              seed="11"
              result="warp"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="warp"
              scale="4"
              result="displaced"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.5"
              numOctaves="3"
              seed="7"
              result="grain"
            />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.8 -0.15"
              result="grainMask"
            />
            <feComposite in="displaced" in2="grainMask" operator="in" />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: "url(#chalk-rough)",
        }}
      >
        <svg
          viewBox="0 0 1080 1080"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <g opacity={ballOpacity}>
            <DrawnPath
              d={BALL_PATH}
              progress={circleDraw}
              color={chalkColor}
              width={10}
              opacity={1 - solidVsDashed}
            />
            {dissolveBall ? (
              <DrawnPath
                d={BALL_PATH}
                progress={circleDraw}
                color={chalkColor}
                width={9}
                dashed
                opacity={solidVsDashed}
              />
            ) : null}
          </g>
          <DrawnPath
            d={ARROW_PATH}
            progress={arrowDraw}
            color={chalkColor}
            width={11}
          />
          <DrawnPath
            d={ARROW_HEAD}
            progress={headDraw}
            color={chalkColor}
            width={11}
          />
        </svg>

        {/* m label inside the ball */}
        <div
          style={{
            position: "absolute",
            left: 240,
            top: 330,
            width: 130,
            textAlign: "center",
            fontSize: 130,
            transform: "skewX(-8deg)",
            opacity: ballOpacity,
          }}
        >
          <ChalkWrite segs={toSegs("m")} beat={BEATS.mLabel} seed="m" />
        </div>

        {/* 100% above the arrow */}
        <div
          style={{
            position: "absolute",
            left: 490,
            top: 380,
            width: 220,
            textAlign: "center",
            fontSize: 96,
          }}
        >
          <ChalkWrite segs={toSegs("100%")} beat={BEATS.pct} seed="pct" />
        </div>

        {/* rest mass energy equation at the arrow tip */}
        <div
          style={{
            position: "absolute",
            left: 600,
            top: 620,
            fontSize: 118,
          }}
        >
          <ChalkWrite
            segs={[
              { char: "E" },
              { char: "0", sub: true },
              { char: " " },
              { char: "=" },
              { char: " " },
              { char: "m" },
              { char: "c" },
              { char: "2", sup: true },
            ]}
            beat={BEATS.eq}
            seed="eq"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ChalkMassEnergy;
