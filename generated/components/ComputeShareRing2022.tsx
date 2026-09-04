import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:03.680 -> 00:00:12.580 of the source cut. round(8.900 * 30) = 267.
export const DURATION = 267;

// The same claim as the bar version, bent into a ring. A flag is a hoist and a
// fly: here the hoist is the band's thickness and the fly is the arc, so each
// flag is genuinely wrapped rather than cropped. The band thickness is the bar
// version's height to the pixel, which is what makes them the same object.

const CX = 540;
const CY = 970;
const BAND = 150;
const R_OUT = 330;
const R_IN = R_OUT - BAND;
const R_MID = (R_IN + R_OUT) / 2;

// One percentage point is 3.6 degrees and one frame, exactly as one point was
// nine pixels and one frame on the bar. A share is still the same number twice.
const DEG = 3.6;

const RANGE_FRAMES = 10;
const REACH_W = 3;
const REACH_INSET = 12;

// The measure sits clear of the ring; at 14 out it read as a rim on the band.
const SCALE_R = R_OUT + 30;
const SCALE_W = 3;
const TICK_W = 5;
const TICK_IN = 13;
const TICK_OUT = 15;

const REST_PARTS = 5;
const REST_GAP = 1.6;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const EASE = Easing.inOut(Easing.sin);
const EXPO = Easing.bezier(0.16, 1, 0.3, 1);

const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (r: number, deg: number) =>
  [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))] as const;

// Twelve o'clock is zero and the sweep runs clockwise, so fifty percent lands
// at the bottom of the circle. America stopping exactly there is the point.
const at = (points: number) => -90 + points * DEG;

const annulus = (a0: number, a1: number, rIn: number, rOut: number) => {
  const [x0, y0] = pt(rOut, a0);
  const [x1, y1] = pt(rOut, a1);
  const [x2, y2] = pt(rIn, a1);
  const [x3, y3] = pt(rIn, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3} Z`;
};

const INNER_RATIO = Math.sin(Math.PI / 10) / Math.sin((7 * Math.PI) / 18);

const starPoints = (cx: number, cy: number, r: number, rotationDeg = 0) => {
  const rot = rad(rotationDeg);
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

// Flag-local coordinates: x runs along the arc from the flag's hoist, measured
// at the outer edge; y runs inward from the outer edge, which is the flag's
// top. Fields bend with the ring; stars are placed by this map and then drawn
// at true size, pointing outward, so they never smear.
const flagDeg = (a0: number, x: number) => a0 + (x / R_OUT) * (180 / Math.PI);
const flagPt = (a0: number, x: number, y: number) => pt(R_OUT - y, flagDeg(a0, x));

/* ---------------------------------------------------------------- flag art */

const UsField: React.FC<{a0: number; a1: number}> = ({a0, a1}) => {
  const stripe = BAND / 13;
  // Both taken off the hoist, exactly as on the bar: 0.76 of the band wide and
  // seven stripes deep, whatever the arc turns out to be.
  const cantonX = BAND * 0.76;
  const cantonY = stripe * 7;
  const cantonA1 = Math.min(a1, flagDeg(a0, cantonX));
  const starR = BAND * 0.0308;

  const stars: {x: number; y: number; deg: number}[] = [];
  for (let row = 0; row < 9; row++) {
    const count = row % 2 === 0 ? 6 : 5;
    const y = (cantonY * (2 * row + 1)) / 18;
    for (let col = 0; col < count; col++) {
      const x =
        row % 2 === 0 ? (cantonX * (2 * col + 1)) / 12 : (cantonX * (2 * col + 2)) / 12;
      const [px, py] = flagPt(a0, x, y);
      stars.push({x: px, y: py, deg: flagDeg(a0, x)});
    }
  }

  return (
    <>
      <path d={annulus(a0, a1, R_IN, R_OUT)} fill="#FFFFFF" />
      {Array.from({length: 7}, (_, i) => (
        <path
          key={i}
          d={annulus(a0, a1, R_OUT - (2 * i + 1) * stripe, R_OUT - 2 * i * stripe)}
          fill="#B22234"
        />
      ))}
      <path d={annulus(a0, cantonA1, R_OUT - cantonY, R_OUT)} fill="#3C3B6E" />
      {stars.map((s, i) => (
        <polygon key={i} points={starPoints(s.x, s.y, starR, s.deg + 90)} fill="#FFFFFF" />
      ))}
    </>
  );
};

const CnField: React.FC<{a0: number; a1: number}> = ({a0, a1}) => {
  // The cluster is the 90x60 construction the other scenes use, scaled off the
  // band so it sits where it belongs however far the red runs.
  const s = BAND / 60;
  const big = flagPt(a0, 15 * s, 15 * s);
  const bigDeg = flagDeg(a0, 15 * s);
  const small = [
    {x: 30 * s, y: 6 * s},
    {x: 36 * s, y: 12 * s},
    {x: 36 * s, y: 21 * s},
    {x: 30 * s, y: 27 * s},
  ];

  return (
    <>
      <path d={annulus(a0, a1, R_IN, R_OUT)} fill="#DE2910" />
      <polygon points={starPoints(big[0], big[1], 9 * s, bigDeg + 90)} fill="#FFDE00" />
      {small.map((p, i) => {
        const [px, py] = flagPt(a0, p.x, p.y);
        // Aimed in the bent frame, so each small star still points at the big
        // one after the wrap instead of at where it used to be.
        const aim = (Math.atan2(big[1] - py, big[0] - px) * 180) / Math.PI + 90;
        return <polygon key={i} points={starPoints(px, py, 3 * s, aim)} fill="#FFDE00" />;
      })}
    </>
  );
};

/* ------------------------------------------------------------------ schema */

export const schema = z.object({
  ink: z.string(),
  shadow: z.string(),
  trackOpacity: z.number().min(0).max(1),
  restOpacity: z.number().min(0).max(1),
  reachOpacity: z.number().min(0).max(1),
  scaleOpacity: z.number().min(0).max(1),
  recede: z.number().min(0).max(1),
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

export type ComputeShareRing2022Props = z.infer<typeof schema>;

export const defaultProps: ComputeShareRing2022Props = schema.parse({
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

const ComputeShareRing2022: React.FC<ComputeShareRing2022Props> = ({
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

  const restPct = 100 - split.usHigh - split.cnHigh;

  const ramp = (a: number, b: number, easing = EXPO) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});
  const grow = (a: number, b: number, d: number) =>
    interpolate(frame, [a, b], [0, d], {easing: EASE, ...clamp});

  // Each fill is started from the word it has to land on, at one point per
  // frame. China's thirty therefore take two thirds of America's forty-five.
  const usFill = beats.to50 - split.usLow;
  const cnFill = beats.to35 - split.cnLow;

  const usPts = grow(usFill, beats.to50, split.usLow);
  const usReach = grow(beats.to50, beats.to50 + RANGE_FRAMES, split.usHigh - split.usLow);
  const cnPts = grow(cnFill, beats.to35, split.cnLow);
  const cnReach = grow(beats.to35, beats.to35 + RANGE_FRAMES, split.cnHigh - split.cnLow);
  const restNow = grow(beats.restBeing, beats.restBeing + restPct, restPct);

  const restore = ramp(beats.theWorld, beats.theWorld + 12);
  const usDim =
    recede * ramp(beats.chinaWas, beats.chinaWas + 12) +
    0.06 * ramp(beats.andThe, beats.andThe + 14);
  const cnDim = recede * ramp(beats.andThe, beats.andThe + 14);
  const usOpacity = 1 - usDim * (1 - restore);
  const cnOpacity = 1 - cnDim * (1 - restore);

  const trackIn = ramp(beats.track, beats.track + 14, Easing.out(Easing.cubic));
  // He names the denominator on "world's compute": the measure opens from the
  // halfway mark at the bottom and meets itself at the top, which is the seam
  // between the last share and the first.
  const bracket = ramp(beats.world1, beats.world1 + 16);
  const capIn = clamp01((bracket - 0.82) / 0.18);
  // Read off the flag's own edge: the mark cannot brighten before the thing it
  // measures has arrived on it.
  const halfHit = clamp01((usReach - (split.usHigh - split.usLow - 0.7)) / 0.7) * trackIn;
  const restHint = ramp(beats.world2, beats.world2 + 14, Easing.inOut(Easing.cubic));
  const restCut = ramp(beats.restOf, beats.theWorld, Easing.inOut(Easing.cubic));

  const scaleInk = scaleOpacity + (0.72 - scaleOpacity) * restore;
  const restA0 = at(split.usHigh + split.cnHigh);

  const sector = (a0: number, a1: number, node: React.ReactNode) =>
    a1 - a0 < 0.15 ? null : node;

  const tick = (points: number, opacity: number, grow01 = 1) => {
    const [x0, y0] = pt(SCALE_R - TICK_IN * grow01, at(points));
    const [x1, y1] = pt(SCALE_R + TICK_OUT * grow01, at(points));
    return (
      <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={ink} strokeWidth={TICK_W} opacity={opacity} />
    );
  };

  // Room he has left, not ground he has taken — an empty outline, inset inside
  // the band so it annotates the flag rather than standing beside it.
  const reach = (start: number, points: number, opacity: number) =>
    sector(
      at(start),
      at(start + points),
      <path
        d={annulus(at(start), at(start + points), R_IN + REACH_INSET, R_OUT - REACH_INSET)}
        fill="none"
        stroke={ink}
        strokeWidth={REACH_W}
        strokeLinejoin="round"
        opacity={reachOpacity * opacity}
      />,
    );

  const restSpan = restNow;
  const restSeg = (restSpan - REST_GAP * (REST_PARTS - 1) * restCut) / REST_PARTS;

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* The whole, before any of it is claimed. */}
          <circle
            cx={CX}
            cy={CY}
            r={R_MID}
            fill="none"
            stroke={ink}
            strokeWidth={BAND}
            opacity={trackOpacity}
            pathLength={100}
            strokeDasharray={`${100 * trackIn} 100`}
            transform={`rotate(-90 ${CX} ${CY})`}
          />

          {/* What is left, one beat before he gets to it. */}
          {sector(
            restA0,
            at(100),
            <path
              d={annulus(restA0, at(100), R_IN, R_OUT)}
              fill={ink}
              opacity={0.16 * restHint}
            />,
          )}

          <g opacity={usOpacity}>
            {sector(at(0), at(usPts), <UsField a0={at(0)} a1={at(usPts)} />)}
          </g>
          <g opacity={cnOpacity}>
            {sector(
              at(split.usHigh),
              at(split.usHigh + cnPts),
              <CnField a0={at(split.usHigh)} a1={at(split.usHigh + cnPts)} />,
            )}
          </g>

          {reach(split.usLow, usReach, usOpacity)}
          {reach(split.usHigh + split.cnLow, cnReach, cnOpacity)}

          {/* The rest of the world arrives whole, then comes apart into the
              many it actually is. */}
          {restSeg > 0.15
            ? Array.from({length: REST_PARTS}, (_, i) => {
                const a0 = restA0 + i * (restSeg + REST_GAP * restCut) * DEG;
                return (
                  <path
                    key={i}
                    d={annulus(a0, a0 + restSeg * DEG, R_IN, R_OUT)}
                    fill={ink}
                    opacity={restOpacity}
                  />
                );
              })
            : null}

          {/* The measure. */}
          <circle
            cx={CX}
            cy={CY}
            r={SCALE_R}
            fill="none"
            stroke={ink}
            strokeWidth={SCALE_W}
            opacity={scaleInk * bracket}
            pathLength={100}
            strokeDasharray={`${100 * bracket} 100`}
            strokeDashoffset={-(50 - 50 * bracket)}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
          {tick(50, scaleOpacity * trackIn + 0.34 * halfHit)}
          {tick(0, scaleInk * capIn, capIn)}
          {tick(split.usHigh + split.cnHigh, scaleInk * restore, restore)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default ComputeShareRing2022;
