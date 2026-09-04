import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:03.680 -> 00:00:12.580 of the source cut. round(8.900 * 30) = 267.
export const DURATION = 267;

// The track is the compute the world added in 2022 and the flag is the bar: each
// bloc's share is the length of its own flag, laid end to end into one whole.
// Every field is revealed by a mask and never scaled, so the canton and the star
// cluster hold their true proportions at any length.

const TRACK_W = 900;
const BAR_H = 150;
const BAR_TOP = 885;
const RADIUS = 16;
// Nine pixels is one percentage point, and one frame is one percentage point.
// A share is therefore the same number twice: how far it reaches and how long
// it takes to get there.
const PCT = TRACK_W / 100;

// Half speed through a range, and drawn as an empty outline rather than more
// flag. A translucent field read as a dirty smear on the end of the flag; a
// line is a different register altogether, which is what "up to" deserves.
const RANGE_FRAMES = 10;
const REACH_W = 3;
// Inset top and bottom so the reach sits inside the band as an annotation on
// the flag rather than reading as a bloc of its own.
const REACH_INSET = 12;
const REACH_RADIUS = 10;

const SCALE_DY = 34;
const SCALE_W = 3;
const TICK_W = 5;
const TICK_UP = 13;
const TICK_DOWN = 9;

const REST_PARTS = 5;
const REST_GAP = 5;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Half-pixel snap with an odd stroke width, or identical rules antialias to
// anywhere between 4% and 13% alpha and the scale shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

const EASE = Easing.inOut(Easing.sin);
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

const INNER_RATIO = Math.sin(Math.PI / 10) / Math.sin((7 * Math.PI) / 18);

const starPoints = (cx: number, cy: number, r: number, rotationDeg = 0) => {
  const rot = (rotationDeg * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * INNER_RATIO;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5 + rot;
    pts.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return pts.join(' ');
};

/* ---------------------------------------------------------------- flag art */

// Both fields are drawn to a fixed height and an arbitrary fly, exactly as a
// long flag is made: the hoist sets every proportion and the field simply runs
// on. Nothing here depends on how much of it is currently revealed.

const UsField: React.FC<{w: number; h: number}> = ({w, h}) => {
  const stripeH = h / 13;
  // A canton is 0.76 of the hoist wide and seven stripes deep, whatever the
  // flag's length. Taking it off the height is what keeps it undistorted here.
  const unionW = h * 0.76;
  const unionH = stripeH * 7;
  const starR = h * 0.0308;

  const stars: string[] = [];
  for (let row = 0; row < 9; row++) {
    const count = row % 2 === 0 ? 6 : 5;
    const y = (unionH * (2 * row + 1)) / 18;
    for (let col = 0; col < count; col++) {
      const x =
        row % 2 === 0 ? (unionW * (2 * col + 1)) / 12 : (unionW * (2 * col + 2)) / 12;
      stars.push(starPoints(x, y, starR));
    }
  }

  return (
    <>
      <rect width={w} height={h} fill="#FFFFFF" />
      {Array.from({length: 7}, (_, i) => (
        <rect key={i} y={i * 2 * stripeH} width={w} height={stripeH} fill="#B22234" />
      ))}
      <rect width={unionW} height={unionH} fill="#3C3B6E" />
      {stars.map((points, i) => (
        <polygon key={i} points={points} fill="#FFFFFF" />
      ))}
    </>
  );
};

const CnField: React.FC<{w: number; h: number}> = ({w, h}) => {
  // The cluster is authored in the 90x60 box the other scenes use, scaled off
  // the hoist so it sits where it belongs however far the red runs.
  const s = h / 60;
  const big = {x: 15 * s, y: 15 * s, r: 9 * s};
  const small = [
    {x: 30 * s, y: 6 * s},
    {x: 36 * s, y: 12 * s},
    {x: 36 * s, y: 21 * s},
    {x: 30 * s, y: 27 * s},
  ];

  return (
    <>
      <rect width={w} height={h} fill="#DE2910" />
      <polygon points={starPoints(big.x, big.y, big.r)} fill="#FFDE00" />
      {small.map((p, i) => {
        const aim = (Math.atan2(big.y - p.y, big.x - p.x) * 180) / Math.PI + 90;
        return <polygon key={i} points={starPoints(p.x, p.y, 3 * s, aim)} fill="#FFDE00" />;
      })}
    </>
  );
};

/* ------------------------------------------------------------------ schema */

export const schema = z.object({
  ink: z.string(),
  shadow: z.string(),
  // The flags are the only colour in the frame. Everything measuring them stays
  // mono, or two colour systems end up arguing with each other.
  trackOpacity: z.number().min(0).max(1),
  restOpacity: z.number().min(0).max(1),
  reachOpacity: z.number().min(0).max(1),
  scaleOpacity: z.number().min(0).max(1),
  // How far a finished claim recedes once he moves on to the next one. New
  // material cannot be laid over a live field; the field has to give way first.
  recede: z.number().min(0).max(1),
  // Percentages of the world's new compute. usHigh + cnHigh + the remainder is
  // the whole track, so the bar closes exactly at 100.
  split: z.object({
    usLow: z.number().int(),
    usHigh: z.number().int(),
    cnLow: z.number().int(),
    cnHigh: z.number().int(),
  }),
  // Beat frames from the SRT at 30fps, relative to 00:00:03.680:
  //     0 "the us was"       ·  16 "adding about 45" ·  61 "to 50 of the"
  //    85 "world's compute"  · 107 "china was"       · 118 "adding about 30"
  //   157 "to 35 of the"     · 191 "world's compute" · 208 "and the"
  //   215 "rest being"       · 228 "taken up by the" · 246 "rest of"
  //   254 "the world"
  // Fills are scheduled backwards from the word they land on, so only the
  // closing words are beats. "adding about 45" is not listed because the rate
  // puts the start there on its own: 61 - 45 = 16.
  beats: z.object({
    track: z.number().int(),
    to50: z.number().int(),
    world1: z.number().int(),
    chinaWas: z.number().int(),
    to35: z.number().int(),
    world2: z.number().int(),
    andThe: z.number().int(),
    restBeing: z.number().int(),
    restOf: z.number().int(),
    theWorld: z.number().int(),
  }),
});

export type ComputeShareFlags2022Props = z.infer<typeof schema>;

export const defaultProps: ComputeShareFlags2022Props = schema.parse({
  ink: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  trackOpacity: 0.14,
  restOpacity: 0.3,
  reachOpacity: 0.55,
  scaleOpacity: 0.42,
  recede: 0.12,
  split: {usLow: 45, usHigh: 50, cnLow: 30, cnHigh: 35},
  beats: {
    track: 0,
    to50: 61,
    world1: 85,
    chinaWas: 107,
    to35: 157,
    world2: 191,
    andThe: 208,
    restBeing: 215,
    restOf: 246,
    theWorld: 254,
  },
});

/* ------------------------------------------------------------------- scene */

const ComputeShareFlags2022: React.FC<ComputeShareFlags2022Props> = ({
  ink,
  shadow,
  trackOpacity,
  restOpacity,
  reachOpacity,
  scaleOpacity,
  recede,
  split,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const X0 = Math.round((width - TRACK_W) / 2);
  const restPct = 100 - split.usHigh - split.cnHigh;

  const usLowW = split.usLow * PCT;
  const usHighW = split.usHigh * PCT;
  const cnLowW = split.cnLow * PCT;
  const cnHighW = split.cnHigh * PCT;
  const restFullW = restPct * PCT;

  const usX = X0;
  const cnX = X0 + usHighW;
  const restX = cnX + cnHighW;

  const ramp = (a: number, b: number, easing = EXPO) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});
  const grow = (a: number, b: number, dx: number) =>
    interpolate(frame, [a, b], [0, dx], {easing: EASE, ...clamp});

  // One point per frame, so each fill is started from the word it has to land
  // on. China's thirty points therefore take two thirds of America's forty-five
  // and you can hear the difference as well as see it.
  const usFill = beats.to50 - split.usLow;
  const cnFill = beats.to35 - split.cnLow;

  const usW = grow(usFill, beats.to50, usLowW);
  const cnW = grow(cnFill, beats.to35, cnLowW);
  const usReach = grow(beats.to50, beats.to50 + RANGE_FRAMES, usHighW - usLowW);
  const cnReach = grow(beats.to35, beats.to35 + RANGE_FRAMES, cnHighW - cnLowW);
  const restW = grow(beats.restBeing, beats.restBeing + restPct, restFullW);

  // Everything comes back up together on "the world": the last frame is the
  // whole thing at full strength, not three parts in three states.
  const restore = ramp(beats.theWorld, beats.theWorld + 12);
  const usDim =
    recede * ramp(beats.chinaWas, beats.chinaWas + 12) +
    0.06 * ramp(beats.andThe, beats.andThe + 14);
  const cnDim = recede * ramp(beats.andThe, beats.andThe + 14);
  const usOpacity = 1 - usDim * (1 - restore);
  const cnOpacity = 1 - cnDim * (1 - restore);

  const trackIn = ramp(beats.track, beats.track + 14, Easing.out(Easing.cubic));

  // He names the denominator on "world's compute", so the measure opens from
  // the halfway mark out to both ends on those words and not before.
  const bracket = ramp(beats.world1, beats.world1 + 16);
  const capIn = clamp01((bracket - 0.82) / 0.18);
  // Read off the flag's own edge rather than a timer: the mark cannot brighten
  // before the thing it is measuring has arrived on it.
  const halfHit = clamp01((usReach - (usHighW - usLowW - 6)) / 6) * trackIn;
  const restHint = ramp(beats.world2, beats.world2 + 14, Easing.inOut(Easing.cubic));
  const restCut = ramp(beats.restOf, beats.theWorld, Easing.inOut(Easing.cubic));

  const SCALE_Y = snap(BAR_TOP - SCALE_DY);
  const scaleInk = scaleOpacity + (0.72 - scaleOpacity) * restore;
  const half = X0 + usHighW;

  const tick = (x: number, opacity: number, grow01 = 1) => (
    <line
      x1={snap(x)}
      y1={SCALE_Y - TICK_UP * grow01}
      x2={snap(x)}
      y2={SCALE_Y + TICK_DOWN * grow01}
      stroke={ink}
      strokeWidth={TICK_W}
      opacity={opacity}
    />
  );

  // The field is authored to its full length once and revealed by the clip, so
  // the canton and the cluster never move or scale while the share grows.
  const panel = (
    id: string,
    x: number,
    w: number,
    fullW: number,
    opacity: number,
    Field: React.FC<{w: number; h: number}>,
  ) => {
    if (w < 0.5) return null;
    return (
      <g transform={`translate(${x}, ${BAR_TOP})`} opacity={opacity}>
        <g clipPath={`url(#pan-${id})`}>
          <Field w={fullW} h={BAR_H} />
        </g>
      </g>
    );
  };

  // How much further he allows it to go. An empty box, because that is exactly
  // what the top of a range is: room he has left, not ground he has taken.
  const reach = (x: number, lowW: number, w: number, opacity: number) =>
    w < 1 ? null : (
      <rect
        x={x + lowW}
        y={BAR_TOP + REACH_INSET}
        width={w}
        height={BAR_H - REACH_INSET * 2}
        rx={REACH_RADIUS}
        fill="none"
        stroke={ink}
        strokeWidth={REACH_W}
        opacity={reachOpacity * opacity}
      />
    );

  const restSeg = (restFullW - REST_GAP * (REST_PARTS - 1) * restCut) / REST_PARTS;

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id="pan-us">
            <rect x={0} y={0} width={Math.max(0, usW)} height={BAR_H} rx={RADIUS} />
          </clipPath>
          <clipPath id="pan-cn">
            <rect x={0} y={0} width={Math.max(0, cnW)} height={BAR_H} rx={RADIUS} />
          </clipPath>
          {/* The rest of the world is not one actor. It arrives whole and then
              comes apart into the many it actually is. */}
          <clipPath id="rest-parts">
            {Array.from({length: REST_PARTS}, (_, i) => (
              <rect
                key={i}
                x={i * (restSeg + REST_GAP * restCut)}
                y={0}
                width={restSeg}
                height={BAR_H}
              />
            ))}
          </clipPath>
        </defs>

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The whole, before any of it is claimed. */}
          <rect
            x={X0}
            y={BAR_TOP}
            width={TRACK_W * trackIn}
            height={BAR_H}
            rx={RADIUS}
            fill={ink}
            opacity={trackOpacity}
          />

          {/* What is left, one beat before he gets to it. */}
          <rect
            x={restX}
            y={BAR_TOP}
            width={restFullW}
            height={BAR_H}
            rx={RADIUS}
            fill={ink}
            opacity={0.16 * restHint * (1 - clamp01(restW / restFullW))}
          />

          {panel('us', usX, usW, usLowW, usOpacity, UsField)}
          {panel('cn', cnX, cnW, cnLowW, cnOpacity, CnField)}
          {reach(usX, usLowW, usReach, usOpacity)}
          {reach(cnX, cnLowW, cnReach, cnOpacity)}

          {restW > 0.5 ? (
            <g transform={`translate(${restX}, ${BAR_TOP})`} clipPath="url(#rest-parts)">
              <rect
                x={0}
                y={0}
                width={restW}
                height={BAR_H}
                rx={RADIUS}
                fill={ink}
                opacity={restOpacity}
              />
            </g>
          ) : null}

          {/* The measure. It opens from the halfway mark, which is also where
              America stops — the coincidence is the point. */}
          <line
            x1={half - (TRACK_W / 2) * bracket}
            y1={SCALE_Y}
            x2={half + (TRACK_W / 2) * bracket}
            y2={SCALE_Y}
            stroke={ink}
            strokeWidth={SCALE_W}
            opacity={scaleInk * bracket}
          />
          {tick(half, scaleOpacity * trackIn + 0.34 * halfHit, 1)}
          {tick(X0, scaleInk * capIn, capIn)}
          {tick(X0 + TRACK_W, scaleInk * capIn, capIn)}
          {tick(restX, scaleInk * restore, restore)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ComputeShareFlags2022;
