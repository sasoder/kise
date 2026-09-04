import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { zColor } from "@remotion/zod-types";
import { z } from "zod";

const CX = 540;

// Both flags are drawn in a local 300x200 box and scaled into place, so the
// pair shares one silhouette instead of the US flag's true 19:10.
const FLAG_W = 300;
const FLAG_H = 200;
const FLAG_DISPLAY_W = 420;
const FLAG_GAP = 60;
const CORNER = 14;

const US_RED = "#B22234";
const US_BLUE = "#3C3B6E";
const US_WHITE = "#FFFFFF";
const CN_RED = "#EE1C25";
const CN_YELLOW = "#FFDE00";

export const schema = z.object({
  background: zColor(),
  glow: zColor(),
  /** The filled share. */
  wedge: zColor(),
  /** The remainder — same hue, dropped in value just enough to separate. */
  track: zColor(),
  /** Hairline between the two shares, matching the map's country separators. */
  borderColor: zColor(),
  radius: z.number().min(1),
  share: z.number().min(0).max(1),
  /** Frame the second flag lands — cue it to "and China". */
  chinaEntry: z.number().int().min(0),
  /** Frame the flags lift and the chart arrives — cue it to "70%". */
  chartEntry: z.number().int().min(0),
  /** Frames the wedge takes to sweep out. */
  sweepDuration: z.number().int().min(1),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  background: "#151A24",
  glow: "#4E3B12",
  wedge: "#FFC543",
  track: "#7E6122",
  borderColor: "#151A24",
  radius: 285,
  share: 0.7,
  chinaEntry: 16,
  chartEntry: 60,
  sweepDuration: 40,
});

/** Regular five-pointed star, one point up before rotation. */
const starPath = (cx: number, cy: number, r: number, rotationDeg = 0) => {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.382;
    const angle = (Math.PI / 5) * i - Math.PI / 2 + (rotationDeg * Math.PI) / 180;
    points.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(
        cy +
        radius * Math.sin(angle)
      ).toFixed(2)}`,
    );
  }
  return `M${points.join("L")}Z`;
};

const UnitedStatesFlag: React.FC = () => {
  const stripe = FLAG_H / 13;
  const cantonW = FLAG_W * 0.4;
  const cantonH = stripe * 7;
  const stars: string[] = [];
  // Official 11x9 alternating grid: 6 stars on odd rows, 5 on even.
  for (let row = 1; row <= 9; row++) {
    const startCol = row % 2 === 1 ? 1 : 2;
    for (let col = startCol; col <= 11; col += 2) {
      stars.push(starPath((cantonW * col) / 12, (cantonH * row) / 10, stripe * 0.4));
    }
  }
  return (
    <>
      <rect width={FLAG_W} height={FLAG_H} fill={US_RED} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={i}
          y={stripe * (i * 2 + 1)}
          width={FLAG_W}
          height={stripe}
          fill={US_WHITE}
        />
      ))}
      <rect width={cantonW} height={cantonH} fill={US_BLUE} />
      <path d={stars.join(" ")} fill={US_WHITE} />
    </>
  );
};

const ChinaFlag: React.FC = () => {
  // Spec grid is 30x20; scaled by 10 to fill the local 300x200 box.
  const big = { x: 50, y: 50, r: 30 };
  const small = [
    { x: 100, y: 20 },
    { x: 120, y: 40 },
    { x: 120, y: 70 },
    { x: 100, y: 90 },
  ];
  return (
    <>
      <rect width={FLAG_W} height={FLAG_H} fill={CN_RED} />
      <path d={starPath(big.x, big.y, big.r)} fill={CN_YELLOW} />
      {small.map((s) => {
        // Each small star turns one point toward the large one.
        const aim =
          (Math.atan2(big.y - s.y, big.x - s.x) * 180) / Math.PI + 90;
        return (
          <path key={`${s.x}-${s.y}`} d={starPath(s.x, s.y, 10, aim)} fill={CN_YELLOW} />
        );
      })}
    </>
  );
};

const Flag: React.FC<{
  id: string;
  centerX: number;
  centerY: number;
  width: number;
  entry: number;
  children: React.ReactNode;
}> = ({ id, centerX, centerY, width, entry, children }) => {
  const height = (width / FLAG_W) * FLAG_H;
  const pop = interpolate(entry, [0, 1], [0.86, 1]);
  return (
    <g opacity={entry} style={{ filter: "drop-shadow(0 10px 26px rgba(0,0,0,0.5))" }}>
      <g
        transform={`translate(${centerX},${centerY}) scale(${pop}) translate(${
          -width / 2
        },${-height / 2}) scale(${width / FLAG_W})`}
      >
        <clipPath id={id}>
          <rect width={FLAG_W} height={FLAG_H} rx={CORNER} ry={CORNER} />
        </clipPath>
        <g clipPath={`url(#${id})`}>{children}</g>
        <rect
          width={FLAG_W}
          height={FLAG_H}
          rx={CORNER}
          ry={CORNER}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={2}
        />
      </g>
    </g>
  );
};

/** Pie slice from 12 o'clock, sweeping clockwise. */
const wedgePath = (cy: number, radius: number, turns: number) => {
  const start = -Math.PI / 2;
  const end = start + turns * Math.PI * 2;
  const x0 = CX + radius * Math.cos(start);
  const y0 = cy + radius * Math.sin(start);
  const x1 = CX + radius * Math.cos(end);
  const y1 = cy + radius * Math.sin(end);
  return `M${CX},${cy} L${x0},${y0} A${radius},${radius} 0 ${
    turns > 0.5 ? 1 : 0
  } 1 ${x1},${y1} Z`;
};

const DiagnosticShareChart: React.FC<Props> = ({
  background,
  glow,
  wedge,
  track,
  borderColor,
  radius,
  share,
  chinaEntry,
  chartEntry,
  sweepDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const settle = (delay: number, duration: number) =>
    spring({
      frame: frame - delay,
      fps,
      config: { damping: 200 },
      durationInFrames: duration,
    });

  const drift = interpolate(frame, [0, durationInFrames], [1, 1.03]);

  // The flags own the frame alone, then lift to make room for the chart.
  const handover = settle(chartEntry, 26);
  const flagCenterY = interpolate(handover, [0, 1], [960, 600]);
  const flagScale = interpolate(handover, [0, 1], [1, 0.88]);
  const flagWidth = FLAG_DISPLAY_W * flagScale;
  // The US flag holds the centre alone, then clears the right-hand slot before
  // China lands in it — sliding and fading together would overlap the two.
  const halfSpan = (FLAG_GAP / 2 + FLAG_DISPLAY_W / 2) * flagScale;
  const usCenterX = CX - halfSpan * settle(chinaEntry, 16);

  const chartCenterY = 1200;
  const chartEntryP = settle(chartEntry + 4, 24);
  const sweepFrom = chartEntry + 6;
  const turns = interpolate(frame, [sweepFrom, sweepFrom + sweepDuration], [0, share], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const filled = share > 0 ? turns / share : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(46% 26% at 50% 63%, ${glow} 0%, transparent 70%)`,
          opacity: 0.1 + filled * 0.42,
        }}
      />

      <AbsoluteFill
        style={{ transform: `scale(${drift})`, transformOrigin: "center center" }}
      >
        <svg viewBox="0 0 1080 1920" width="1080" height="1920">
          <Flag
            id="flag-us"
            centerX={usCenterX}
            centerY={flagCenterY}
            width={flagWidth}
            entry={settle(0, 22)}
          >
            <UnitedStatesFlag />
          </Flag>
          <Flag
            id="flag-cn"
            centerX={CX + halfSpan}
            centerY={flagCenterY}
            width={flagWidth}
            entry={settle(chinaEntry + 8, 18)}
          >
            <ChinaFlag />
          </Flag>

          <g
            opacity={chartEntryP}
            transform={`translate(${CX},${chartCenterY}) scale(${interpolate(
              chartEntryP,
              [0, 1],
              [0.88, 1],
            )}) translate(${-CX},${-chartCenterY})`}
          >
            <circle
              cx={CX}
              cy={chartCenterY}
              r={radius}
              fill={track}
              stroke={borderColor}
              strokeWidth={5}
            />
            {turns > 0.001 ? (
              <path
                d={wedgePath(chartCenterY, radius, turns)}
                fill={wedge}
                stroke={borderColor}
                strokeWidth={5}
                strokeLinejoin="round"
                style={{
                  filter: `drop-shadow(0 0 ${12 + filled * 18}px rgba(255,197,67,${
                    filled * 0.3
                  }))`,
                }}
              />
            ) : null}
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default DiagnosticShareChart;
