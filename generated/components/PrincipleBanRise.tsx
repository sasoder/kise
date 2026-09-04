import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:48.740 -> 00:00:57.299 of the source cut. round(8.559 * 30).
export const DURATION = 257;

// ---------------------------------------------------------------------------
// A wedge of things a person might ask for. Deep at the bottom, narrow: the
// handful of asks that really are the crime. At the top, wide: everyday work,
// where you and I are. A rule locks in above the deep end and then rises,
// taking the AI's help out of everything it passes.
//
// The rate never changes. The area it takes per frame does, because the wedge
// widens — so "at least partially" costs more the further it travels without
// the line ever speeding up.
// ---------------------------------------------------------------------------
const CX = 540;
const N = 11;
const TOP_Y = 396;
const SPACING = 112;
const BAR_H = 18;
const W_TOP = 720;
const W_BOT = 120;
// The AI's contribution, drawn as the same welded-in segment as the patch in
// the mirror-scan scene. Same shape, same meaning, extinguished instead.
const SEG_W = 56;
const RULE_HALF = 420;
// Clear of the bar it sits above, close enough to read as bearing on it.
const RULE_OFFSET = 56;

const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const BARS = Array.from({length: N}, (_, i) => {
  // 1 at the surface, 0 at the deep end.
  const t = (N - 1 - i) / (N - 1);
  const base = W_BOT + (W_TOP - W_BOT) * Math.pow(t, 1.3);
  const w = base * (0.94 + hash(i, 1) * 0.12);
  const cy = TOP_Y + i * SPACING;
  const room = SEG_W / 2 + 22;
  const segCx = CX - w / 2 + room + hash(i, 2) * Math.max(w - 2 * room, 0);
  return {w, cy, segCx};
});

const RULE_LOCK_Y = BARS[N - 1].cy - RULE_OFFSET;
const RULE_END_Y = BARS[0].cy - RULE_OFFSET;

const ease = {
  out: Easing.out(Easing.cubic),
  slam: Easing.bezier(0.12, 0.62, 0.2, 1),
  pop: Easing.bezier(0.2, 1.5, 0.4, 1),
};

const ramp = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing: (n: number) => number = ease.out,
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // Three states: unknown -> read -> the AI's help present. Dead is what is
  // left after the rule has passed: still there, no longer reachable.
  unknownOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  deadOpacity: z.number().min(0).max(1),
  // Beat frames from the SRT at 30fps, relative to 00:00:48.740:
  //   0 "but if we" · 11 "want to" · 27 "lock in a" · 43 "principle"
  //   53 "that says" · 82 "that we" · 88 "can never" · 101 "allow it"
  //   122 "such that an ai" · 145 "could help" · 157 "you at least"
  //   180 "partially with" · 212 "something" · 223 "like a"
  //   234 "cybercrime" (ends 257)
  beats: z.object({
    enter: z.number().int(),
    rule: z.number().int(),
    lock: z.number().int(),
    brackets: z.number().int(),
    enforce: z.number().int(),
    help: z.number().int(),
    rise: z.number().int(),
    riseEnd: z.number().int(),
    target: z.number().int(),
  }),
});

export type PrincipleBanRiseProps = z.infer<typeof schema>;

export const defaultProps: PrincipleBanRiseProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#C15F3C',
  shadow: 'rgba(0, 0, 0, 0.28)',
  unknownOpacity: 0.1,
  readOpacity: 0.85,
  deadOpacity: 0.32,
  beats: {
    enter: 2,
    rule: 27,
    lock: 44,
    brackets: 53,
    enforce: 84,
    help: 145,
    rise: 180,
    riseEnd: 238,
    target: 234,
  },
});

const PrincipleBanRise: React.FC<PrincipleBanRiseProps> = ({
  ink,
  accent,
  shadow,
  unknownOpacity,
  readOpacity,
  deadOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // The rule slams down to its locked position, holds, then leaves at a
  // constant rate. Nothing about the rise accelerates.
  const ruleY =
    frame < beats.rise
      ? ramp(frame, [beats.rule, beats.lock], [-60, RULE_LOCK_Y], ease.slam)
      : interpolate(frame, [beats.rise, beats.riseEnd], [RULE_LOCK_Y, RULE_END_Y], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // The rule exists from the moment it locks; enforcement is a separate beat,
  // so the one thing already beneath it dies on "can never allow it" rather
  // than on the line's arrival.
  const enforce = ramp(frame, [beats.enforce, beats.enforce + 16], [0, 1]);
  const bracket = ramp(frame, [beats.brackets, beats.brackets + 9], [0, 1], ease.pop);
  const thicken = ramp(frame, [beats.enforce, beats.enforce + 12], [0, 1]);
  const target = ramp(frame, [beats.target, beats.target + 11], [0, 1], ease.pop);

  const ruleSnapped = Math.round(ruleY) + 0.5;

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {BARS.map((bar, i) => {
            const t0 = beats.enter + i * 1.8;
            const enter = ramp(frame, [t0, t0 + 10], [0, 1]);
            if (enter <= 0) return null;

            // Taken is read off the rule's own position, so the boundary and
            // the bars behind it can never drift apart if the beats move.
            const passed = interpolate(bar.cy - ruleY, [-14, 14], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const gone = passed * enforce;

            // The help arrives on the words that name it, deepest first.
            const h0 = beats.help + (N - 2 - i) * 2.4;
            const lit = i === N - 1 ? 0 : ramp(frame, [h0, h0 + 10], [0, 1]);
            const segW = SEG_W * lit * (1 - gone);

            const alive = ramp(frame, [t0 + 6, t0 + 18], [unknownOpacity, readOpacity]);
            const barOpacity = enter * interpolate(gone, [0, 1], [alive, deadOpacity]);

            const w = bar.w * enter;
            return (
              <g key={i}>
                <rect
                  x={CX - w / 2}
                  y={bar.cy - BAR_H / 2}
                  width={w}
                  height={BAR_H}
                  rx={BAR_H / 2}
                  fill={ink}
                  opacity={barOpacity}
                />
                {segW > 0.5 ? (
                  <rect
                    x={bar.segCx - segW / 2}
                    y={bar.cy - BAR_H / 2}
                    width={segW}
                    height={BAR_H}
                    rx={BAR_H / 2}
                    fill={accent}
                  />
                ) : null}
              </g>
            );
          })}

          {/* The one thing the principle was actually aimed at, named last.
              The field is already receded by now, so ink annotation can sit on
              top of it without fighting. */}
          {target > 0 ? (
            <rect
              x={CX - (BARS[N - 1].w + 30) / 2}
              y={BARS[N - 1].cy - (BAR_H + 26) / 2}
              width={(BARS[N - 1].w + 30) * target}
              height={BAR_H + 26}
              rx={6}
              fill="none"
              stroke={ink}
              strokeWidth={3}
              opacity={0.9 * target}
            />
          ) : null}

          {frame >= beats.rule ? (
            <g>
              <line
                x1={CX - RULE_HALF}
                x2={CX + RULE_HALF}
                y1={ruleSnapped}
                y2={ruleSnapped}
                stroke={ink}
                strokeWidth={5 + 2 * thicken}
                opacity={0.95}
              />
              {[-1, 1].map((s) => (
                <line
                  key={s}
                  x1={CX + s * RULE_HALF}
                  x2={CX + s * RULE_HALF}
                  y1={ruleSnapped - 14 * bracket}
                  y2={ruleSnapped + 14 * bracket}
                  stroke={ink}
                  strokeWidth={5}
                  opacity={0.95 * bracket}
                />
              ))}
            </g>
          ) : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default PrincipleBanRise;
