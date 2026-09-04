import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:12.519 -> 00:00:17.260 of the source cut: "so basically the effective
// ai population size at the frontier lab is increasing 10x year over year".
export const DURATION = 142;

const W = 1080;
const H = 1920;
const CX = 540;
// Same holder height the previous clip resolved to, so the disc lands on the
// shape the cut hands over.
const CY = 1000;

// The lab is the fixed thing. The composition never grows, never moves and
// never leaves frame — only the population inside it decuples. Every frame is
// equally full, which is what the previous pass got wrong.
const R = 430;
// The population stops short of its own boundary, so the field never crowds
// the line that contains it.
const RF = R - 18;

// Four decades. Ten thousand is the deepest the disc is ever asked to hold.
const MAX_N = 10000;

// Concentric shells, not a scatter. Ring 1 is exactly nine, so the state the
// viewer is asked to count — one at the centre, nine around it — is a
// symmetric figure rather than ten dots that happen to have landed apart.
// Every ring after that takes round(6.4k), which is 2*pi*k to within a
// percent, so along-ring spacing and ring-to-ring spacing stay equal and the
// disc reads as evenly packed at any count.
const ringCount = (k: number) => (k === 0 ? 1 : k === 1 ? 9 : Math.max(1, Math.round(6.4 * k)));

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const RING = new Int32Array(MAX_N);
const COS = new Float64Array(MAX_N);
const SIN = new Float64Array(MAX_N);
// Mid-ring cumulative rank: where a ring's mass sits, which is the radius that
// keeps density uniform. r = RF * sqrt(RANK / N), so every dot contracts by
// exactly sqrt(10) per decade and nothing is ever reassigned to a new ring.
const RANK = new Float64Array(MAX_N);
// The population count at which a dot arrives. Keyed to its ring rather than
// to its raw index, so rings arrive one at a time — a cohort materialises at
// the boundary and is drawn inward — instead of several rings part-arriving at
// once at different radii, which is what made the growth look scrambled.
const BIRTH = new Float64Array(MAX_N);
{
  let i = 0;
  for (let k = 0; i < MAX_N; k++) {
    const n = ringCount(k);
    const first = i;
    // Fill each ring in a scattered order so a decade arrives all around it
    // at once instead of sweeping round like a clock hand.
    let step = Math.max(1, Math.round(n * 0.618));
    while (gcd(step, n) !== 1) step++;
    // Golden phase per ring, so rings never line up into spokes.
    const phase = (k * 0.6180339887) % 1;
    const mid = k === 0 ? 0 : first + n / 2;
    for (let j = 0; j < n && i < MAX_N; j++, i++) {
      const theta = (2 * Math.PI * (((j * step) % n) + phase)) / n;
      RING[i] = k;
      COS[i] = Math.cos(theta);
      SIN[i] = Math.sin(theta);
      RANK[i] = mid;
      // Spread across the second half of the ring's own width: a ring starts
      // arriving exactly as its radius comes inside the disc, so it enters at
      // the rim and is drawn in, and the last of it lands on the round count.
      BIRTH[i] = k === 0 ? 0 : mid + (j + 0.5) * 0.5;
    }
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// The population is carried as log10, so a year is one unit whatever the
// count, the ramps are equal-feeling, and the disc fines down at a constant
// rate inside each step instead of lurching.
const logNAt = (f: number, keys: [number, number][]) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let k = 0; k < keys.length - 1; k++) {
    const [f0, v0] = keys[k];
    const [f1, v1] = keys[k + 1];
    if (f <= f1) {
      if (v0 === v1 || f1 === f0) return v1;
      return v0 + (v1 - v0) * easeInOutCubic((f - f0) / (f1 - f0));
    }
  }
  return keys[keys.length - 1][1];
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // Dot radius = dotScale * R * N^-0.4. The exponent is deliberately shallower
  // than the -0.5 that would hold density constant: at -0.5 the disc looks
  // identical at every count and the growth is invisible. At -0.4 the fill
  // climbs from ~4% to ~42% across the four years, so the field visibly
  // thickens as well as fines.
  dotScale: z.number().min(0.1).max(0.5),
  dotOpacity: z.number().min(0).max(1),
  // The boundary is ink: unlit capacity. The years elapsed ride outside it in
  // accent, as a separate ring, so the two are never read as one thickening
  // line the way they were when they shared a radius.
  ringWidth: z.number().min(1).max(9),
  ringOpacity: z.number().min(0).max(1),
  arcGap: z.number().min(0).max(60),
  arcWidth: z.number().min(1).max(14),
  arcOpacity: z.number().min(0).max(1),
  // Frames a cohort takes to swell in at the rim.
  birthFrames: z.number().min(1).max(20),
  // Degrees of drift across the whole clip, and the amplitude of the idle
  // breath. Both tiny — they exist so the long hold before the rattle is not
  // a freeze frame.
  spin: z.number().min(-20).max(20),
  breath: z.number().min(0).max(0.02),
  // Beat frames from the SRT at 30fps, relative to 00:00:12.519:
  //   0 "so basically" · 17 "the effective" · 32 "ai population"
  //   53 "size at the" · 80 "frontier lab is" · 101 "increasing"
  //   112 "10x year" · 128 "over year"
  beats: z.object({
    rim: z.number().int(), // the empty lab is already there, and settles
    seed: z.number().int(), // one mind lands in it
    pop: z.number().int(), // x10 begins — the slow, countable one
    popEnd: z.number().int(), // ...and settles at ten, through "size at the"
    lab: z.number().int(), // the boundary asserts itself, once
    y2: z.number().int(), // x10 -> 100
    y3: z.number().int(), // x10 -> 1000
    y4: z.number().int(), // x10 -> 10000
    end: z.number().int(), // resolved, with frames of stillness to spare
  }),
});

export type AiPopulationDecuplesProps = z.infer<typeof schema>;

export const defaultProps: AiPopulationDecuplesProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dotScale: 0.26,
  dotOpacity: 0.94,
  ringWidth: 3,
  ringOpacity: 0.22,
  arcGap: 26,
  arcWidth: 7,
  arcOpacity: 0.92,
  birthFrames: 3,
  spin: 2.5,
  breath: 0.003,
  beats: {
    rim: 0,
    seed: 17,
    pop: 32,
    popEnd: 66,
    lab: 80,
    y2: 101,
    y3: 112,
    y4: 128,
    end: 138,
  },
});

const AiPopulationDecuples: React.FC<AiPopulationDecuplesProps> = ({
  ink,
  accent,
  shadow,
  dotScale,
  dotOpacity,
  ringWidth,
  ringOpacity,
  arcGap,
  arcWidth,
  arcOpacity,
  birthFrames,
  spin,
  breath,
  beats,
}) => {
  const frame = useCurrentFrame();

  const keys: [number, number][] = [
    [beats.seed, 0],
    [beats.pop, 0],
    [beats.popEnd, 1],
    [beats.y2, 1],
    [beats.y3, 2],
    [beats.y4, 3],
    [beats.end, 4],
  ];

  const logN = logNAt(frame, keys);
  const N = Math.pow(10, logN);
  // Same curve a few frames back: a cohort's swell is measured against how far
  // the population actually travelled, so it settles during the hold instead
  // of leaving the outer ring permanently half-arrived.
  const NPrev = Math.pow(10, logNAt(frame - birthFrames, keys));

  // A breath in before each year, so the jump has somewhere to come from.
  let pre = 1;
  for (const s of [beats.pop, beats.y2, beats.y3, beats.y4]) {
    pre *= interpolate(frame, [s - 6, s - 1, s + 5], [1, 0.986, 1], {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }
  const idle = 1 + breath * Math.sin(frame * 0.055);

  // The first mind arrives before it has anything to multiply into.
  const seedIn = interpolate(frame, [beats.seed, beats.seed + 14], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Present on frame one — the editor cuts in on an empty lab, not on nothing.
  const rimIn = interpolate(frame, [beats.rim, beats.rim + 12], [0.5, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rimSettle = interpolate(frame, [beats.rim, beats.rim + 16], [0.986, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "frontier lab is": the boundary asserts itself once, then recedes to being
  // context again so the population can stay the subject.
  const labPulse = interpolate(frame, [beats.lab, beats.lab + 8, beats.lab + 30], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rho = dotScale * R * Math.pow(N, -0.4);
  // Tied to the dot, not to the frame: legibility over footage when the dots
  // are large, and no accumulated grime once ten thousand of them are 6px.
  const blur = Math.max(1.6, Math.min(6, rho * 0.75));
  // Floored small, not at 1: a floor of one leaves the last dot of a settled
  // year stuck at a quarter size for the whole hold, because it is always
  // within one head of the count. Small enough and a held year is fully grown.
  const cohort = Math.max(0.02, N - NPrev);

  // One path for the whole field. Ten thousand separate <circle> nodes is the
  // difference between a render that takes a minute and one that takes an
  // hour, and every dot shares a fill, so there is nothing to gain from them.
  const d: string[] = [];
  for (let i = 0; i < MAX_N; i++) {
    if (BIRTH[i] > N) break;
    const born = clamp01((N - BIRTH[i]) / cohort);
    let r = rho * (1 - Math.pow(1 - born, 3));
    if (i === 0) r *= seedIn;
    if (r < 0.35) continue;
    // Every ring enters at the rim and is drawn inward as the count grows —
    // by construction, never outside it, so no cohort stacks against the line.
    const rr = RING[i] === 0 ? 0 : RF * Math.sqrt(RANK[i] / N);
    const x = CX + rr * COS[i];
    const y = CY + rr * SIN[i];
    d.push(
      `M${x.toFixed(1)} ${(y - r).toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 0.01 0Z`,
    );
  }

  const AR = R + arcGap;
  const C = 2 * Math.PI * AR;
  // Years elapsed. It closes exactly as the population tops out — the quantity
  // encoded a second time, and the frame the clip resolves on.
  const prog = clamp01(logN / 4);

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g
          transform={`translate(${CX} ${CY}) scale(${pre * idle * rimSettle}) translate(${-CX} ${-CY})`}
        >
          <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={ink}
              strokeWidth={ringWidth + labPulse * 1.2}
              opacity={rimIn * (ringOpacity + labPulse * 0.34)}
            />
          </g>

          <g
            transform={`rotate(${(spin * frame) / DURATION} ${CX} ${CY})`}
            style={{
              filter: `drop-shadow(0 ${(0.35 * blur).toFixed(2)}px ${blur.toFixed(2)}px ${shadow})`,
            }}
          >
            <path d={d.join('')} fill={accent} opacity={dotOpacity} />
          </g>

          {prog < 0.004 ? null : (
            <circle
              cx={CX}
              cy={CY}
              r={AR}
              fill="none"
              stroke={accent}
              strokeWidth={arcWidth}
              strokeLinecap="round"
              strokeDasharray={`${C * prog} ${C}`}
              opacity={arcOpacity}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
            />
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default AiPopulationDecuples;
