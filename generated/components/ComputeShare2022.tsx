import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:03.680 -> 00:00:12.580 of the source cut. round(8.900 * 30) = 267.
export const DURATION = 267;

// One track is the compute the world added in 2022, cut into countable blocks of
// five percent each. Every number he says lands on a whole block, so the shares
// are read rather than estimated: 45 is nine blocks, 30 is six. A range is one
// further block at half strength — the part of the claim he is not making.

const BLOCK_W = 30;
const GAP = 12;
// Wide enough that a boundary between blocs never reads as one more gap.
const GUTTER = 54;
const BLOCK_H = 108;
const BAR_TOP = 900;

// The rest of the world is not one actor, so its blocks are split into three.
// 8 + 3 + 8 + 3 + 8 is exactly one block, so the texture changes and the
// measure does not.
const SLIVER_W = 8;
const SLIVER_GAP = 3;

const RULE_DY = 20;
const RULE_W = 7;

const CREST_H = 30;
// Asymmetric: the crest trails the front further than it leads it, so the wave
// reads as something being laid down rather than something arriving.
const CREST_BEHIND = 52;
const CREST_AHEAD = 22;

// The extent bracket: the denominator, drawn on the words that name it.
const CAP_H = 12;
const CAP_W = 5;

const TICK_TOP = 40;
const TICK_BOTTOM = 12;
const TICK_W = 5;

// A front that stops dead misreports the count it has just laid down, so every
// push eases in and out of rest. It also means the crest can be derived from
// the front's own speed instead of a second timer that could drift off it.
const EASE = Easing.inOut(Easing.sin);
// Well under the average fill speed: the crest is at full strength through a
// run and tapers only where the front is actually settling on a word.
const REF_SPEED = 5;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Half-pixel snap with an odd stroke width, or the rules antialias to anywhere
// between 4% and 13% alpha and the baseline shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

type Kind = 'solid' | 'range' | 'rest';
type Cell = {x: number; w: number; kind: Kind; group: number};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // Three states: unknown, read, structural. The empty track carries the first
  // one so the whole exists before any share is taken out of it.
  dimOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  // The reach of a range, held at roughly half the read state: stated, but not
  // stated as firmly as the floor underneath it.
  rangeOpacity: z.number().min(0).max(1),
  restOpacity: z.number().min(0).max(1),
  ruleOpacity: z.number().min(0).max(1),
  // Percentages of the world's new compute. Every value must divide by unit, or
  // a number he says would land mid-block.
  split: z.object({
    usLow: z.number().int(),
    usHigh: z.number().int(),
    cnLow: z.number().int(),
    cnHigh: z.number().int(),
    unit: z.number().int().min(1),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:03.680:
  //     0 "the us was"       ·  16 "adding about 45" ·  61 "to 50 of the"
  //    85 "world's compute"  · 107 "china was"       · 118 "adding about 30"
  //   157 "to 35 of the"     · 191 "world's compute" · 208 "and the"
  //   215 "rest being"       · 228 "taken up by the" · 246 "rest of"
  //   254 "the world"
  beats: z.object({
    track: z.number().int(),
    adding45: z.number().int(),
    to50: z.number().int(),
    world1: z.number().int(),
    chinaWas: z.number().int(),
    adding30: z.number().int(),
    to35: z.number().int(),
    andThe: z.number().int(),
    restBeing: z.number().int(),
    restOf: z.number().int(),
    theWorld: z.number().int(),
  }),
});

export type ComputeShare2022Props = z.infer<typeof schema>;

export const defaultProps: ComputeShare2022Props = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.18,
  readOpacity: 0.88,
  rangeOpacity: 0.42,
  restOpacity: 0.55,
  ruleOpacity: 0.85,
  split: {usLow: 45, usHigh: 50, cnLow: 30, cnHigh: 35, unit: 5},
  beats: {
    track: 0,
    adding45: 16,
    to50: 61,
    world1: 85,
    chinaWas: 107,
    adding30: 118,
    to35: 157,
    andThe: 208,
    restBeing: 215,
    restOf: 246,
    theWorld: 254,
  },
});

const ComputeShare2022: React.FC<ComputeShare2022Props> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  readOpacity,
  rangeOpacity,
  restOpacity,
  ruleOpacity,
  split,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // --- The track -----------------------------------------------------------
  // Counts are derived from the numbers he says, so retiming the claim retimes
  // the geometry with it.
  const counts = [
    split.usHigh / split.unit,
    split.cnHigh / split.unit,
    (100 - split.usHigh - split.cnHigh) / split.unit,
  ];
  const firstRange = [split.usLow / split.unit, split.cnLow / split.unit, Infinity];

  const cells: Cell[] = [];
  const groups: {x0: number; x1: number}[] = [];
  let cursor = 0;
  counts.forEach((n, g) => {
    if (g > 0) cursor += GUTTER;
    const gx0 = cursor;
    for (let i = 0; i < n; i++) {
      if (i > 0) cursor += GAP;
      if (g === 2) {
        for (let s = 0; s < 3; s++) {
          cells.push({
            x: cursor + s * (SLIVER_W + SLIVER_GAP),
            w: SLIVER_W,
            kind: 'rest',
            group: g,
          });
        }
      } else {
        cells.push({
          x: cursor,
          w: BLOCK_W,
          kind: i >= firstRange[g] ? 'range' : 'solid',
          group: g,
        });
      }
      cursor += BLOCK_W;
    }
    groups.push({x0: gx0, x1: cursor});
  });

  const trackW = cursor;
  const X0 = Math.round((width - trackW) / 2);
  const RULE_Y = snap(BAR_TOP + BLOCK_H + RULE_DY);

  const solidEnd = (g: number) =>
    X0 +
    cells.reduce(
      (m, c) => (c.group === g && c.kind === 'solid' ? Math.max(m, c.x + c.w) : m),
      0,
    );

  const usStart = X0 + groups[0].x0;
  const usSolidEnd = solidEnd(0);
  const usEnd = X0 + groups[0].x1;
  const cnStart = X0 + groups[1].x0;
  const cnSolidEnd = solidEnd(1);
  const cnEnd = X0 + groups[1].x1;
  const restStart = X0 + groups[2].x0;
  const restEnd = X0 + groups[2].x1;

  // --- The front -----------------------------------------------------------
  // The one scalar the scene reads: how far along the world's compute the claim
  // has been laid. Seven pushes, one per phrase, standing still in between. The
  // floors run at a constant count per frame; the two ranges are a separate,
  // shorter push each, so "to 50" is its own event and not a longer 45.
  const frontAt = (f: number) => {
    const seg = (a: number, b: number, dx: number) =>
      interpolate(f, [a, b], [0, dx], {easing: EASE, ...clamp});
    return (
      usStart +
      seg(beats.adding45, beats.to50, usSolidEnd - usStart) +
      seg(beats.to50, beats.to50 + 10, usEnd - usSolidEnd) +
      seg(beats.chinaWas, beats.chinaWas + 12, cnStart - usEnd) +
      seg(beats.adding30 + 9, beats.to35, cnSolidEnd - cnStart) +
      seg(beats.to35, beats.to35 + 10, cnEnd - cnSolidEnd) +
      seg(beats.andThe, beats.restBeing, restStart - cnEnd) +
      seg(beats.restBeing, beats.restOf, restEnd - restStart)
    );
  };

  const frontX = frontAt(frame);
  // Smoothed off the front itself over six frames, so the crest cannot exist
  // where the front is not moving and cannot snap off when it stops.
  const motion = clamp01((frontAt(frame + 2) - frontAt(frame - 4)) / 6 / REF_SPEED);

  const trackIn = interpolate(frame, [beats.track, beats.track + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  // The gutters close on "the world": three claimed spans become one whole.
  const merge = interpolate(frame, [beats.theWorld, beats.theWorld + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const ruleInk = ruleOpacity + (1 - ruleOpacity) * merge;
  // He names the denominator on "world's compute". The bracket is what all
  // three shares are shares of, so it arrives on those words and not before.
  const capIn = interpolate(frame, [beats.world1, beats.world1 + 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

  const target = (k: Kind) =>
    k === 'range' ? rangeOpacity : k === 'rest' ? restOpacity : readOpacity;

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The whole, before anything is taken out of it. */}
          <line
            x1={X0}
            y1={RULE_Y}
            x2={X0 + trackW * trackIn}
            y2={RULE_Y}
            stroke={ink}
            strokeWidth={RULE_W}
            opacity={dimOpacity}
          />

          {cells.map((c, i) => {
            const left = X0 + c.x;
            const appear = interpolate(
              frame,
              [beats.track + i * 0.4, beats.track + i * 0.4 + 8],
              [0, 1],
              {easing: Easing.out(Easing.cubic), ...clamp},
            );
            if (appear <= 0.002) return null;

            // Lit from where the front actually is, so a retimed beat moves the
            // block and its crest together.
            const lit = clamp01((frontX - left) / (c.w * 0.55));
            const d = frontX - (left + c.w / 2);
            const bell =
              d >= 0 ? clamp01(1 - d / CREST_BEHIND) : clamp01(1 + d / CREST_AHEAD);
            const crest = bell * motion;

            const h = BLOCK_H + CREST_H * crest;
            const op = (dimOpacity + (target(c.kind) - dimOpacity) * lit) * appear;

            return (
              <rect
                key={i}
                x={left}
                y={BAR_TOP + BLOCK_H - h}
                width={c.w}
                height={h}
                fill={interpolateColors(crest, [0, 1], [ink, accent])}
                opacity={op}
              />
            );
          })}

          {/* What the front has laid down: one accent span per bloc. */}
          {groups.map((g, i) => {
            const gx0 = X0 + g.x0;
            const gx1 = X0 + g.x1;
            const x2 = Math.min(Math.max(frontX, gx0), gx1);
            if (x2 - gx0 < 0.5) return null;
            return (
              <line
                key={`g${i}`}
                x1={gx0}
                y1={RULE_Y}
                x2={x2}
                y2={RULE_Y}
                stroke={accent}
                strokeWidth={RULE_W}
                opacity={ruleInk}
              />
            );
          })}

          {merge > 0
            ? [0, 1].map((i) => {
                const bx0 = X0 + groups[i].x1;
                const bx1 = X0 + groups[i + 1].x0;
                return (
                  <line
                    key={`b${i}`}
                    x1={bx0}
                    y1={RULE_Y}
                    x2={bx0 + (bx1 - bx0) * merge}
                    y2={RULE_Y}
                    stroke={accent}
                    strokeWidth={RULE_W}
                    opacity={ruleInk}
                  />
                );
              })
            : null}

          {/* The extent being divided, closed off at both ends. It takes the
              accent only once the spans inside it have joined up. */}
          {capIn > 0.002
            ? [X0, X0 + trackW].map((x, i) => (
                <line
                  key={`c${i}`}
                  x1={snap(x)}
                  y1={RULE_Y - CAP_H * capIn}
                  x2={snap(x)}
                  y2={RULE_Y + CAP_H * capIn}
                  stroke={interpolateColors(merge, [0, 1], [ink, accent])}
                  strokeWidth={CAP_W}
                  opacity={0.55 + 0.45 * merge}
                />
              ))
            : null}

          {/* Where the count is being taken, and only while it is moving. */}
          <line
            x1={snap(frontX)}
            y1={BAR_TOP - TICK_TOP}
            x2={snap(frontX)}
            y2={BAR_TOP - TICK_BOTTOM}
            stroke={accent}
            strokeWidth={TICK_W}
            opacity={0.85 * motion}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ComputeShare2022;
