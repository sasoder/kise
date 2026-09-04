import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:09.400 -> 00:00:16.219 of the source cut. round(6.819 * 30) = 205.
// Picks up on the frame TwoLabsGridCapture ends, so the scaffold can already be
// assembling while he says "at the beginning of this year".
export const DURATION = 205;

// One rung is one gigawatt. The rungs are separated rather than continuous so
// the quantity is counted, not measured — 2 and 5 are small numbers and the
// viewer should never have to read an axis to get the ratio.
const SLOTS = 6;
const RUNG_H = 110;
const RUNG_GAP = 14;
const U = RUNG_H + RUNG_GAP;

const COL_W = 280;
const COL_GAP = 200;
const COL_X = [160, 160 + COL_W + COL_GAP];
const MID_X = COL_X[0] + COL_W + COL_GAP / 2;

// The same floor the grid in the previous scene stood on, so the two shots sit
// in the same place on the frame.
const BASE_Y = 1414;
const RADIUS = 10;

const RULE_OVERHANG = 46;
const RULE_X0 = COL_X[0] - RULE_OVERHANG;
const RULE_X1 = COL_X[1] + COL_W + RULE_OVERHANG;
const TICK_H = 15;

// January is marked by two short stubs flanking each column rather than a rule
// across it: white annotation laid over the bright accent field would have to be
// dimmed until it disappeared. Outside the column it can stay legible.
const STUB_IN = 12;
const STUB_OUT = 46;
const RULE_W = 5;

const LABEL_SIZE = 58;
const LABEL_Y = BASE_Y + 46;
const TAG_SIZE = 44;

// Half-pixel snap with an odd stroke width: identical horizontals otherwise
// antialias anywhere from 4% to 13% alpha and the field shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Top edge of a stack standing at v gigawatts.
const levelY = (v: number) => {
  const i = Math.max(0, Math.ceil(v) - 1);
  const f = v - i;
  return BASE_Y - i * U - f * RUNG_H;
};

const rungTop = (i: number) => BASE_Y - i * U - RUNG_H;

const typeStyle = (size: number, ink: string): React.CSSProperties => ({
  fontFamily: roboto.fontFamily,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: '0.11em',
  marginRight: '-0.11em',
  whiteSpace: 'nowrap',
  color: ink,
});

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  slotOpacity: z.number().min(0).max(1),
  fillOpacity: z.number().min(0).max(1),
  stubOpacity: z.number().min(0).max(1),
  // The unfilled remainder of the rung currently being filled. Same "about to
  // be taken" language as the grid in the previous scene, and it is what makes
  // "less than 2" read as less than 2 rather than as a slightly short bar.
  pressureOpacity: z.number().min(0).max(1),
  // Where the rule sits, in gigawatts. Also the number on the tag.
  gate: z.number(),
  gateLabel: z.string(),
  // Index 0 is the left column. He names OpenAI's number first, so OpenAI is
  // left and the two fills run in reading order.
  columns: z
    .array(
      z.object({
        label: z.string(),
        start: z.number(),
        end: z.number(),
      }),
    )
    .length(2),
  // Beat frames from the SRT at 30fps, relative to 00:00:09.400:
  //    0 "you know at the" ·  15 "beginning" ·  19 "of this year"
  //   40 "anthropic"       ·  50 "openai"    ·  58 "started at"
  //   73 "2 for"           ·  94 "openai and less"
  //  119 "than 2 for"      · 137 "anthropic"
  //  158 "end of"          · 164 "this year" · 176 "both above 5"
  beats: z.object({
    nameRight: z.number().int(),
    nameLeft: z.number().int(),
    fillLeftIn: z.number().int(),
    fillLeftOut: z.number().int(),
    fillRightIn: z.number().int(),
    fillRightOut: z.number().int(),
    gateIn: z.number().int(),
    gateOut: z.number().int(),
    climbLeft: z.number().int(),
    climbRight: z.number().int(),
    climbEnd: z.number().int(),
  }),
});

export type TwoLabsGigawattClimbProps = z.infer<typeof schema>;

export const defaultProps: TwoLabsGigawattClimbProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  slotOpacity: 0.1,
  fillOpacity: 0.92,
  stubOpacity: 0.55,
  pressureOpacity: 0.15,
  gate: 5,
  gateLabel: '5 GW',
  columns: [
    {label: 'OPENAI', start: 2, end: 5.4},
    // "less than 2" is drawn as a four-fifths rung, not asserted. Both land on
    // the same number: he says "they're both above 5", so they converge.
    {label: 'ANTHROPIC', start: 1.8, end: 5.4},
  ],
  beats: {
    nameRight: 40,
    nameLeft: 50,
    fillLeftIn: 70,
    fillLeftOut: 90,
    fillRightIn: 116,
    fillRightOut: 134,
    gateIn: 156,
    gateOut: 172,
    climbLeft: 174,
    climbRight: 177,
    climbEnd: 198,
  },
});

// The cut arrives on a full frame from the previous scene, so the scaffold is
// already part-way up at frame 0 rather than starting from nothing.
const SCAFFOLD_LEAD = -16;

// Fast departure, long settle. No overshoot — a bar that overshoots is a bar
// that misreports its own quantity, however briefly.
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

const TwoLabsGigawattClimb: React.FC<TwoLabsGigawattClimbProps> = ({
  ink,
  accent,
  shadow,
  slotOpacity,
  fillOpacity,
  stubOpacity,
  pressureOpacity,
  gate,
  gateLabel,
  columns,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Centred in the seam between the fifth and sixth rung rather than flush on
  // the fifth's top edge: the boundary the eye reads is the middle of the gap,
  // and sitting on the edge put the whole 14px on one side.
  const gateY = snap(levelY(gate) - RUNG_GAP / 2);

  // The one scalar per column that everything downstream reads. Both the
  // opening fill and the year's climb are the same number moving, so a rung can
  // never disagree with the stack it belongs to.
  const valueOf = (i: number) => {
    const c = columns[i];
    const fillIn = i === 0 ? beats.fillLeftIn : beats.fillRightIn;
    const fillOut = i === 0 ? beats.fillLeftOut : beats.fillRightOut;
    const climbIn = i === 0 ? beats.climbLeft : beats.climbRight;
    return (
      interpolate(frame, [fillIn, fillOut], [0, c.start], {easing: EXPO, ...clamp}) +
      interpolate(frame, [climbIn, beats.climbEnd], [0, c.end - c.start], {
        easing: EXPO,
        ...clamp,
      })
    );
  };

  const values = [valueOf(0), valueOf(1)];
  const peak = Math.max(values[0], values[1]);

  // Column scaffold assembles from the floor up. It is on screen before either
  // lab is named, so the frame is never empty on the cut.
  const slotIn = (col: number, i: number) => {
    const t = SCAFFOLD_LEAD + col * 3 + i * 7;
    return interpolate(frame, [t, t + 12], [0, 1], {easing: Easing.out(Easing.cubic), ...clamp});
  };

  const labelIn = (col: number) => {
    const t = col === 0 ? beats.nameLeft : beats.nameRight;
    return interpolate(frame, [t, t + 14], [0, 1], {easing: Easing.out(Easing.cubic), ...clamp});
  };

  // The rule is drawn a beat and a half before anything moves toward it: the
  // whole scene is the two stacks racing a mark the viewer already knows about.
  const gateDraw = interpolate(frame, [beats.gateIn, beats.gateOut], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const ruleX0 = MID_X - (MID_X - RULE_X0) * gateDraw;
  const ruleX1 = MID_X + (RULE_X1 - MID_X) * gateDraw;
  const tickIn = interpolate(gateDraw, [0.82, 1], [0, 1], clamp);

  // Derived from the stacks, not from a timer: rises as they come up on the
  // mark, falls once they are settled above it, and cannot drift if retimed.
  const crossed = interpolate(peak, [gate - 0.9, gate + 0.3], [0, 1], clamp);
  const pulse = 4 * crossed * (1 - crossed);
  const ruleOpacity = gateDraw * (0.85 + 0.15 * pulse);

  const tagIn = interpolate(frame, [beats.gateIn + 6, beats.gateIn + 22], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The scale itself: six gigawatts of headroom, standing empty. */}
          {COL_X.map((x, col) =>
            Array.from({length: SLOTS}, (_, i) => (
              <rect
                key={`s${col}-${i}`}
                x={x}
                y={rungTop(i)}
                width={COL_W}
                height={RUNG_H}
                rx={RADIUS}
                fill={ink}
                opacity={slotOpacity * slotIn(col, i)}
              />
            )),
          )}

          {/* Five gigawatts. */}
          <g opacity={ruleOpacity}>
            <line
              x1={ruleX0}
              y1={gateY}
              x2={ruleX1}
              y2={gateY}
              stroke={ink}
              strokeWidth={RULE_W}
              strokeLinecap="round"
            />
            {[RULE_X0, RULE_X1].map((x) => (
              <line
                key={`t${x}`}
                x1={snap(x)}
                y1={gateY - TICK_H}
                x2={snap(x)}
                y2={gateY + TICK_H}
                stroke={ink}
                strokeWidth={RULE_W}
                strokeLinecap="round"
                opacity={tickIn}
              />
            ))}
          </g>

          {/* Where each lab stood in January. Set down as the opening fill
              lands, so the viewer sees the mark made before the stack leaves
              it — the climb then reads as a departure from a known level. */}
          {COL_X.map((x, col) => {
            const c = columns[col];
            const on = interpolate(values[col], [c.start - 0.28, c.start - 0.02], [0, 1], clamp);
            if (on <= 0.002) return null;
            const y = snap(levelY(c.start));
            return (
              <g key={`j${col}`} opacity={stubOpacity * on}>
                <line
                  x1={x - STUB_OUT}
                  y1={y}
                  x2={x - STUB_IN}
                  y2={y}
                  stroke={ink}
                  strokeWidth={RULE_W}
                  strokeLinecap="round"
                />
                <line
                  x1={x + COL_W + STUB_IN}
                  y1={y}
                  x2={x + COL_W + STUB_OUT}
                  y2={y}
                  stroke={ink}
                  strokeWidth={RULE_W}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* The rung being filled, above the fill line: what is about to be
              taken. At rest it is the headroom the next sentence uses. */}
          {COL_X.map((x, col) =>
            Array.from({length: SLOTS}, (_, i) => {
              const f = values[col] - i;
              if (f <= 0.02 || f >= 0.995) return null;
              const h = (1 - f) * RUNG_H;
              return (
                <rect
                  key={`p${col}-${i}`}
                  x={x}
                  y={rungTop(i)}
                  width={COL_W}
                  height={h}
                  rx={Math.min(RADIUS, h / 2)}
                  fill={ink}
                  opacity={pressureOpacity}
                />
              );
            }),
          )}

          {/* What each lab holds. */}
          {COL_X.map((x, col) =>
            Array.from({length: SLOTS}, (_, i) => {
              const f = Math.min(1, Math.max(0, values[col] - i));
              if (f <= 0.004) return null;
              const h = f * RUNG_H;
              const y = rungTop(i) + (RUNG_H - h);
              return (
                <rect
                  key={`f${col}-${i}`}
                  x={x}
                  y={y}
                  width={COL_W}
                  height={h}
                  rx={Math.min(RADIUS, h / 2)}
                  fill={accent}
                  opacity={fillOpacity * interpolate(f, [0, 0.1], [0, 1], clamp)}
                />
              );
            }),
          )}
        </g>
      </svg>

      <AbsoluteFill style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        {COL_X.map((x, col) => {
          const on = labelIn(col);
          return (
            <div
              key={`l${col}`}
              style={{
                position: 'absolute',
                left: x + COL_W / 2 - 300,
                top: LABEL_Y,
                width: 600,
                display: 'flex',
                justifyContent: 'center',
                opacity: on,
                transform: `translateY(${(1 - on) * 14}px)`,
              }}
            >
              <span style={typeStyle(LABEL_SIZE, ink)}>{columns[col].label}</span>
            </div>
          );
        })}

        {/* Anchors the scale once, in the one strip of the frame that stays
            empty for the whole shot. */}
        <div
          style={{
            position: 'absolute',
            left: MID_X - 150,
            top: gateY + 14,
            width: 300,
            display: 'flex',
            justifyContent: 'center',
            opacity: tagIn * 0.9,
          }}
        >
          <span style={typeStyle(TAG_SIZE, ink)}>{gateLabel}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default TwoLabsGigawattClimb;
