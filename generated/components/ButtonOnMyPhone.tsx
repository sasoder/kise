import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
// 00:00:08.800 -> 00:00:12.919 of the source cut, plus a hold on the resolve.
export const DURATION = 120;

const CANVAS_W = 1080;
const CANVAS_H = 1920;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

// Outline length of a rounded rect, so the draw-on can be dashed exactly.
const roundedPerimeter = (w: number, h: number, r: number) =>
  2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  phoneX: z.number(),
  phoneY: z.number(),
  phoneW: z.number().min(200).max(700),
  phoneH: z.number().min(400).max(1400),
  phoneRadius: z.number().min(8).max(120),
  strokeWidth: z.number().min(1).max(12),
  screenInset: z.number().min(8).max(80),
  contentInset: z.number().min(8).max(120),
  readOpacity: z.number().min(0).max(1),
  knownOpacity: z.number().min(0).max(1),
  buttonW: z.number().min(4).max(40),
  buttonH: z.number().min(20).max(240),
  buttonTop: z.number(),
  pressDepth: z.number().min(0).max(40),
  ringRadius: z.number().min(40).max(600),
  // How far the scan travels past a row before that row is fully converted.
  scanFalloff: z.number().min(10).max(200),
  scanWidth: z.number().min(1).max(16),
  answerW: z.number().min(60).max(500),
  answerH: z.number().min(10).max(90),
  answerGap: z.number().min(20).max(300),
  // Rows are absolute canvas coords so the layout is inspectable in Studio.
  rows: z
    .array(z.object({top: z.number(), w: z.number(), h: z.number()}))
    .min(1)
    .max(16),
  // Beat frames lifted from the SRT at 24fps, frame 0 = 00:00:08.800:
  //   0 "versus the" · 27 "button on" · 35 "my phone" · 45 "that just"
  //   55 "says hey" · 65 "chatgpt what do" · 81 "you think about" · 89 "this?"
  beats: z.object({
    draw: z.number().int(),
    drawEnd: z.number().int(),
    content: z.number().int(),
    button: z.number().int(),
    press: z.number().int(),
    scan: z.number().int(),
    scanEnd: z.number().int(),
    answer: z.number().int(),
  }),
});

export type ButtonOnMyPhoneProps = z.infer<typeof schema>;

export const defaultProps: ButtonOnMyPhoneProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#FFC543',
  shadow: 'rgba(0, 0, 0, 0.28)',
  phoneX: 305,
  phoneY: 405,
  phoneW: 470,
  phoneH: 966,
  phoneRadius: 64,
  strokeWidth: 6,
  screenInset: 27,
  contentInset: 54,
  readOpacity: 0.85,
  knownOpacity: 0.97,
  buttonW: 15,
  buttonH: 114,
  buttonTop: 675,
  pressDepth: 9,
  ringRadius: 250,
  scanFalloff: 34,
  scanWidth: 6,
  answerW: 180,
  answerH: 34,
  answerGap: 96,
  rows: [
    {top: 499, w: 362, h: 22},
    {top: 541, w: 258, h: 22},
    {top: 610, w: 362, h: 243},
    {top: 895, w: 362, h: 22},
    {top: 938, w: 293, h: 22},
    {top: 1007, w: 362, h: 183},
    {top: 1232, w: 218, h: 22},
  ],
  beats: {
    draw: -5,
    drawEnd: 12,
    content: 10,
    button: 27,
    press: 55,
    scan: 63,
    scanEnd: 92,
    answer: 92,
  },
});

const ButtonOnMyPhone: React.FC<ButtonOnMyPhoneProps> = ({
  ink,
  accent,
  shadow,
  phoneX,
  phoneY,
  phoneW,
  phoneH,
  phoneRadius,
  strokeWidth,
  screenInset,
  contentInset,
  readOpacity,
  knownOpacity,
  buttonW,
  buttonH,
  buttonTop,
  pressDepth,
  ringRadius,
  scanFalloff,
  scanWidth,
  answerW,
  answerH,
  answerGap,
  rows,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const phoneRight = phoneX + phoneW;
  const phoneBottom = phoneY + phoneH;
  const screenX = phoneX + screenInset;
  const screenY = phoneY + screenInset;
  const screenW = phoneW - screenInset * 2;
  const screenH = phoneH - screenInset * 2;
  const contentX = phoneX + contentInset;

  // The handset draws itself on, clockwise from the top edge.
  const perimeter = roundedPerimeter(phoneW, phoneH, phoneRadius);
  const drawn = interpolate(frame, [beats.draw, beats.drawEnd], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const buttonIn = spring({
    frame: frame - beats.button,
    fps,
    config: {damping: 20, mass: 0.7, stiffness: 120},
    durationInFrames: 14,
  });

  // Short and mechanical: in over three frames, back out over eight.
  const press = interpolate(
    frame,
    [beats.press, beats.press + 3, beats.press + 11],
    [0, 1, 0],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const ringPhase = interpolate(frame, [beats.press, beats.press + 24], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringOpacity = 0.5 * (1 - ringPhase) * clamp01((frame - beats.press) / 2);

  // The scan is the only clock for the conversion: every row reads its state off
  // this y, so retiming the beat can never desync a row from the line.
  const scanPhase = interpolate(frame, [beats.scan, beats.scanEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanY = screenY + scanPhase * screenH;
  const scanVisible = clamp01((frame - beats.scan) / 3);

  // The scan line does not vanish and get replaced — it leaves the screen and
  // settles into the answer mark, so the eye never loses the thing it followed.
  const settle = spring({
    frame: frame - beats.answer,
    fps,
    config: {damping: 20, mass: 0.9, stiffness: 105},
    durationInFrames: 20,
  });
  const lerp = (a: number, b: number) => a + (b - a) * settle;
  const markW = lerp(screenW, answerW);
  const markH = lerp(scanWidth, answerH);
  const markCy = lerp(scanY, phoneBottom + answerGap);

  const clipId = 'screen-clip';
  const maskId = 'outside-phone';

  return (
    <AbsoluteFill>
      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={screenX}
              y={screenY}
              width={screenW}
              height={screenH}
              rx={phoneRadius - screenInset}
            />
          </clipPath>
          {/* The ring radiates around the handset, never across the screen. */}
          <mask id={maskId}>
            <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="white" />
            <rect
              x={phoneX}
              y={phoneY}
              width={phoneW}
              height={phoneH}
              rx={phoneRadius}
              fill="black"
            />
          </mask>
        </defs>

        <circle
          cx={phoneRight + buttonW / 2}
          cy={buttonTop + buttonH / 2}
          r={ringPhase * ringRadius}
          fill="none"
          stroke={accent}
          strokeWidth={5}
          opacity={ringOpacity}
          mask={`url(#${maskId})`}
        />

        <rect
          x={phoneX}
          y={phoneY}
          width={phoneW}
          height={phoneH}
          rx={phoneRadius}
          fill="none"
          stroke={ink}
          strokeWidth={strokeWidth}
          opacity={0.9}
          strokeDasharray={perimeter}
          strokeDashoffset={perimeter * (1 - drawn)}
        />

        <g clipPath={`url(#${clipId})`}>
          {rows.map((row, i) => {
            const delay = beats.content + i * 3;
            const enter = interpolate(frame, [delay, delay + 10], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            if (enter <= 0) {
              return null;
            }
            // Converts as the line sweeps through this row, not on a timer.
            const p = smooth(
              clamp01((scanY - row.top) / (row.h + scanFalloff)),
            );
            return (
              <rect
                key={`row${i}`}
                x={contentX}
                y={row.top + (1 - enter) * 18}
                width={row.w}
                height={row.h}
                rx={Math.min(row.h / 2, 14)}
                fill={interpolateColors(p, [0, 1], [ink, accent])}
                opacity={
                  (readOpacity + (knownOpacity - readOpacity) * p) * enter
                }
              />
            );
          })}

        </g>

        <rect
          x={phoneRight - press * pressDepth}
          y={buttonTop + (buttonH / 2) * (1 - buttonIn)}
          width={buttonW}
          height={buttonH * buttonIn}
          rx={buttonW / 2}
          fill={accent}
          opacity={buttonIn}
        />

        <rect
          x={phoneX + phoneW / 2 - markW / 2}
          y={markCy - markH / 2}
          width={markW}
          height={markH}
          rx={markH / 2}
          fill={accent}
          opacity={scanVisible}
        />
      </svg>
    </AbsoluteFill>
  );
};

export default ButtonOnMyPhone;
