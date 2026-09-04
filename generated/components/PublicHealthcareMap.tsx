import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { contextLand, europeCountries } from "./europeMapData";

// Universal coverage, but delivered through mandatory private insurance rather
// than a state-run, publicly funded system — so these hold the first colour
// while the rest turn over on "and funded".
const NOT_STATE_FUNDED = new Set([
  "Switzerland",
  "Netherlands",
  "Liechtenstein",
  "Vatican",
]);

export const schema = z.object({
  background: zColor(),
  glowWarm: zColor(),
  glowCool: zColor(),
  contextFill: zColor(),
  countryIdle: zColor(),
  /** First pass: every country the line is talking about. */
  countryWarm: zColor(),
  countryWarmFlash: zColor(),
  /** Second pass: the ones that really are state-run and publicly funded. */
  countryCool: zColor(),
  countryCoolFlash: zColor(),
  borderColor: zColor(),
  /** Frame the west-to-east warm sweep begins. */
  sweepStart: z.number().int().min(0),
  /** Frames between the first country lighting up and the last one starting. */
  sweepSpan: z.number().int().min(1),
  /** Frames a single country takes to fill on the warm pass. */
  fillDuration: z.number().int().min(1),
  /** Frame the turn to the funded colour begins — lands on "and funded". */
  fundedStart: z.number().int().min(0),
  /** The funded pass moves faster, so it reads as one wave. */
  fundedSpan: z.number().int().min(1),
  fundedDuration: z.number().int().min(1),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  background: "#151A24",
  glowWarm: "#4E3B12",
  glowCool: "#123D2A",
  contextFill: "#28303D",
  countryIdle: "#3D4657",
  countryWarm: "#FFC543",
  countryWarmFlash: "#FFE7B0",
  countryCool: "#4ADE80",
  countryCoolFlash: "#C6F6D5",
  borderColor: "#151A24",
  sweepStart: 28,
  sweepSpan: 66,
  fillDuration: 15,
  fundedStart: 124,
  fundedSpan: 26,
  fundedDuration: 15,
});

/** Swap the alpha on an `rgba(...)` string, which is what interpolateColors returns. */
const withAlpha = (color: string, alpha: number) =>
  color.replace(/rgba?\(([^)]+)\)/, (_match, inner: string) => {
    const [r, g, b] = inner.split(",");
    return `rgba(${r},${g},${b},${alpha})`;
  });

const PublicHealthcareMap: React.FC<Props> = ({
  background,
  glowWarm,
  glowCool,
  contextFill,
  countryIdle,
  countryWarm,
  countryWarmFlash,
  countryCool,
  countryCoolFlash,
  borderColor,
  sweepStart,
  sweepSpan,
  fillDuration,
  fundedStart,
  fundedSpan,
  fundedDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // The map settles into place once, then keeps drifting forward almost
  // imperceptibly so the held final beat never looks like a freeze frame.
  const entry = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 28 });
  const scale =
    interpolate(entry, [0, 1], [0.94, 1]) *
    interpolate(frame, [0, durationInFrames], [1, 1.035]);
  const mapOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });

  const lastIndex = Math.max(europeCountries.length - 1, 1);
  const ramp = (index: number, start: number, span: number, duration: number) => {
    const begin = start + (index / lastIndex) * span;
    return interpolate(frame, [begin, begin + duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  };

  const warmFor = (index: number) => ramp(index, sweepStart, sweepSpan, fillDuration);
  const coolFor = (index: number) =>
    NOT_STATE_FUNDED.has(europeCountries[index].name)
      ? 0
      : ramp(index, fundedStart, fundedSpan, fundedDuration);

  // Average fill drives the halo, so the glow grows with each sweep instead of
  // being keyframed separately.
  const total = europeCountries.length;
  const warmFilled = europeCountries.reduce((sum, _, i) => sum + warmFor(i), 0) / total;
  const coolFilled = europeCountries.reduce((sum, _, i) => sum + coolFor(i), 0) / total;

  const ambient = interpolateColors(coolFilled, [0, 1], [glowWarm, glowCool]);
  const halo = interpolateColors(coolFilled, [0, 1], [countryWarm, countryCool]);

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 34% at 50% 50%, ${ambient} 0%, transparent 70%)`,
          opacity: 0.12 + warmFilled * 0.42,
        }}
      />

      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          opacity: mapOpacity,
        }}
      >
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          {/* Stroked in its own fill colour: no internal borders to pull the eye
              off Europe, and no antialiased seams between neighbours. */}
          <g fill={contextFill} stroke={contextFill} strokeWidth={1}>
            {contextLand.map((shape) => (
              <path key={shape.name} d={shape.d} />
            ))}
          </g>

          <g
            stroke={borderColor}
            strokeWidth={1.4}
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 ${12 + warmFilled * 16}px ${withAlpha(
                halo,
                warmFilled * 0.3,
              )})`,
            }}
          >
            {europeCountries.map((shape, index) => {
              const warm = warmFor(index);
              const cool = coolFor(index);
              return (
                <path
                  key={shape.name}
                  d={shape.d}
                  fill={
                    cool > 0
                      ? interpolateColors(
                          cool,
                          [0, 0.45, 1],
                          [countryWarm, countryCoolFlash, countryCool],
                        )
                      : interpolateColors(
                          warm,
                          [0, 0.45, 1],
                          [countryIdle, countryWarmFlash, countryWarm],
                        )
                  }
                />
              );
            })}
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default PublicHealthcareMap;
