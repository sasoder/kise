import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
// Dwarkesh, 0:47.219 -> 0:51.799, plus half a second of resolved hold so the
// editor has room on the out. round(4.58 * 24) + 12.
export const DURATION = 122;

const PAIRS = 14;

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Each pair is a contest: two agents, one axis, and one thing going back and
// forth between them.
const CX = 540;
const CY = 835;
// Everything stays gathered on the centre: the field is sampled inside this
// ellipse, and the widest an agent can sit is RX + len + its grown radius,
// which keeps the whole cast clear of the frame edge at every zoom.
const RX = 290;
const RY = 232;
const MIN_GAP = 130;

// Pair centres, scattered organically but never on top of each other.
const pairs = (() => {
  const out: {cx: number; cy: number; ang: number; len: number}[] = [];
  let k = 0;
  while (out.length < PAIRS && k < PAIRS * 900) {
    const a = hash(k, 1) * Math.PI * 2;
    const r = Math.sqrt(hash(k, 2));
    const cx = CX + Math.cos(a) * r * RX;
    const cy = CY + Math.sin(a) * r * RY;
    k += 1;
    if (out.some((o) => Math.hypot(o.cx - cx, o.cy - cy) < MIN_GAP)) {
      continue;
    }
    out.push({cx, cy, ang: hash(k, 3) * Math.PI, len: 46 + hash(k, 4) * 12});
  }
  return out;
})();
// However many actually fit, rather than however many were asked for.
const N = pairs.length * 2;

// Where the two of them were before they were matched: near their own patch,
// so squaring up reads as turning to face each other.
const loose = Array.from({length: N}, (_, i) => {
  const pr = pairs[Math.floor(i / 2)];
  return {
    x: pr.cx + (hash(i, 5) - 0.5) * 150,
    y: pr.cy + (hash(i, 6) - 0.5) * 124,
  };
});

export const schema = z.object({
  accent: z.string(),
  shadow: z.string(),
  axisWidth: z.number().min(1).max(10),
  base: z.number().min(4).max(24),
  // What one exchange is worth. Growth is counted off the volleys themselves,
  // so "smart" can never run ahead of the games that produced it.
  perVolley: z.number().min(0).max(2),
  maxVolleys: z.number().min(1).max(80),
  // Exchanges per frame, at the start and at the end.
  rateFrom: z.number().min(0.01).max(0.4),
  rateTo: z.number().min(0.01).max(0.6),
  grid: z.string(),
  gridBlur: z.number().min(0).max(40),
  gridBrightness: z.number().min(0).max(1),
  gridBase: z.string(),
  baseZoom: z.number().min(0.5).max(2),
  endZoom: z.number().min(0.5).max(3),
  // Beat frames from the SRT at 24fps, relative to 00:00:47.219:
  //   0 "trained to" · 18 "play games" · 31 "against" · 36 "each other"
  //   50 "and that's" · 68 "how they" · 75 "get to be" · 89 "really smart"
  beats: z.object({
    trained: z.number().int(),
    playGames: z.number().int(),
    against: z.number().int(),
    eachOther: z.number().int(),
    andThats: z.number().int(),
    howThey: z.number().int(),
    getToBe: z.number().int(),
    reallySmart: z.number().int(),
  }),
});

export type TrainedAgainstEachOtherGridEnhancedProps = z.infer<typeof schema>;

export const defaultProps: TrainedAgainstEachOtherGridEnhancedProps = schema.parse({
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.22)',
  axisWidth: 3.5,
  base: 11,
  perVolley: 0.55,
  maxVolleys: 24,
  rateFrom: 0.05,
  rateTo: 0.17,
  grid: 'grid-background.jpg',
  gridBlur: 13,
  gridBrightness: 0.32,
  gridBase: '#232323',
  baseZoom: 1.0,
  endZoom: 1.22,
  beats: {
    trained: 0,
    playGames: 18,
    against: 31,
    eachOther: 36,
    andThats: 50,
    howThey: 68,
    getToBe: 75,
    reallySmart: 89,
  },
});

const TrainedAgainstEachOtherGridEnhanced: React.FC<TrainedAgainstEachOtherGridEnhancedProps> = ({
  accent,
  shadow,
  axisWidth,
  base,
  perVolley,
  maxVolleys,
  rateFrom,
  rateTo,
  grid,
  gridBlur,
  gridBrightness,
  gridBase,
  baseZoom,
  endZoom,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // They are matched up, one pair at a time.
  const matched = (p: number) =>
    (
        interpolate(frame, [p * 0.9, 15 + p * 0.9], [0, 1], {
          easing: Easing.bezier(0.3, 1.16, 0.4, 1),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
    );
  const startOf = (p: number) => beats.against - 3 + p * 1.0;

  // The rate climbs the whole way, so the exchanges are visibly faster at the
  // end than at the start: the same quantity twice, as speed and as size.
  const span = 105 - beats.against;
  const phaseOf = (p: number) => {
    const t = frame - startOf(p);
    if (t <= 0) {
      return 0;
    }
    if (t <= span) {
      return rateFrom * t + ((rateTo - rateFrom) * t * t) / (2 * span);
    }
    // Top speed reached: it holds there rather than climbing off the end.
    return rateFrom * span + ((rateTo - rateFrom) * span) / 2 + rateTo * (t - span);
  };

  // Camera: one move, matched to the thing the line describes. It closes in
  // through the whole piece as the exchanges speed up and the agents grow, so
  // "really smart" is the tightest frame.
  const k = interpolate(frame, [0, beats.against, 106], [baseZoom, baseZoom + 0.04, endZoom], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tx = 540 - 540 * k;
  const ty = 835 - 835 * k;

  return (
    <AbsoluteFill style={{backgroundColor: gridBase}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img
          src={staticFile(grid)}
          style={{
            position: 'absolute',
            left: '-40%',
            top: '-40%',
            width: '180%',
            height: '180%',
            objectFit: 'cover',
            filter: `blur(${gridBlur}px) brightness(${gridBrightness})`,
            transform: `translate(${(tx * 0.15 + frame * 0.11).toFixed(2)}px, ${(
              ty * 0.15 +
              frame * 0.06
            ).toFixed(2)}px) scale(${(1 + (k - 1) * 0.3).toFixed(4)})`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${k.toFixed(4)})`,
          transformOrigin: '0 0',
        }}
      >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 9px ${shadow})`}}>
          {pairs.map((pr, p) => {
            const mRaw = matched(p);
            const m = clamp01(mRaw);
            const phase = phaseOf(p);
            // Growth is continuous in the volleys rather than stepped, so it
            // never jumps.
            const volleys = Math.min(phase * 2, maxVolleys);
            const u = ((phase % 1) + 1) % 1;
            // Each leg is a shot: slow off the hand, fast into the opponent.
            const legP = u < 0.5 ? u * 2 : (u - 0.5) * 2;
            const shot = Math.pow(legP, 2.2);
            const s = u < 0.5 ? shot : 1 - shot;
            // Whoever it just reached takes the hit, right after it lands.
            const hit = phase > 0 ? Math.max(0, 1 - legP * 4) : 0;
            const grown = base + perVolley * volleys;

            const started = clamp01((frame - startOf(p)) / 8);
            const circling = 0.34 * (1 - started) * Math.sin(frame * 0.055 + p * 1.7);
            const dxa = Math.cos(pr.ang + circling);
            const dya = Math.sin(pr.ang + circling);
            const lean = pr.len * (1 - 0.11 * hit);
            const ax = pr.cx - dxa * lean;
            const ay = pr.cy - dya * lean;
            const bx = pr.cx + dxa * lean;
            const by = pr.cy + dya * lean;

            // Loose agents are hunting for an opponent: big, quick movement
            // from frame one that calms as each pair squares up.
            const restless = 1 - m;
            const drift = (i: number, k: number) =>
              (5 + 14 * restless) *
              Math.sin(
                frame * (0.03 + hash(i, k) * 0.022) * (1 + 1.5 * restless) +
                  hash(i, k + 1) * 6.3,
              );

            // Recoil: the one being played against gives ground.
            const recoil = 7 * hit;
            const near = s < 0.5;
            const A = {
              x: loose[p * 2].x + (ax - dxa * (near ? recoil : 0) - loose[p * 2].x) * mRaw + drift(p * 2, 7),
              y: loose[p * 2].y + (ay - dya * (near ? recoil : 0) - loose[p * 2].y) * mRaw + drift(p * 2, 9),
            };
            const B = {
              x:
                loose[p * 2 + 1].x +
                (bx + dxa * (near ? 0 : recoil) - loose[p * 2 + 1].x) * mRaw +
                drift(p * 2 + 1, 7),
              y:
                loose[p * 2 + 1].y +
                (by + dya * (near ? 0 : recoil) - loose[p * 2 + 1].y) * mRaw +
                drift(p * 2 + 1, 9),
            };
            // A ring leaves the agent that was just hit.
            const hitX = near ? A.x : B.x;
            const hitY = near ? A.y : B.y;
            const px = A.x + (B.x - A.x) * s;
            const py = A.y + (B.y - A.y) * s;
            const lit =
              0.64 +
              0.4 * clamp01(volleys / maxVolleys) +
              0.05 *
                interpolate(frame, [beats.reallySmart, beats.reallySmart + 10], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });

            return (
              <g key={`p${p}`}>
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={A.x + (B.x - A.x) * m}
                  y2={A.y + (B.y - A.y) * m}
                  stroke={accent}
                  strokeWidth={axisWidth + 1.6 * clamp01(volleys / maxVolleys)}
                  strokeLinecap="round"
                  opacity={0.5 * m}
                />
                <circle
                  cx={A.x}
                  cy={A.y}
                  r={grown * (1 + 0.16 * (near ? hit : 0))}
                  fill={accent}
                  opacity={lit}
                />
                <circle
                  cx={B.x}
                  cy={B.y}
                  r={grown * (1 + 0.16 * (near ? 0 : hit))}
                  fill={accent}
                  opacity={lit}
                />
                {hit > 0 ? (
                  <circle
                    cx={hitX}
                    cy={hitY}
                    r={grown + 30 * (1 - hit)}
                    fill="none"
                    stroke={accent}
                    strokeWidth={3}
                    opacity={0.55 * hit}
                  />
                ) : null}
                {phase > 0 ? (
                  <circle cx={px} cy={py} r={7.5 + 2.5 * hit} fill={accent} opacity={0.95 * m} />
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default TrainedAgainstEachOtherGridEnhanced;
