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

export const FPS = 30;
// 00:00:02.060 -> 00:00:06.679 of the source cut: round(4.619 * 30).
export const DURATION = 139;

// Where the fragments resolve: central Europe, and the optical centre of the
// composition. Depth means understanding, so here the deep thing is inward.
const CX = 540;
const CY = 920;

// The supplied silhouette is 512x512; everything below is authored in that
// space and mapped once, so the marks stay on land if the map is resized.
const MAP_SIZE = 900;
const MAP_LEFT = 90;
const MAP_TOP = 430;
const MAP_SCALE = MAP_SIZE / 512;
const mx = (u: number) => MAP_LEFT + u * MAP_SCALE;
const my = (v: number) => MAP_TOP + v * MAP_SCALE;

// One agent per market, spread evenly over the landmass: Lloyd relaxation on
// the alpha channel of europe.png, so every mark sits on land and no two are
// closer than ~115px. North Africa, Svalbard and the far east are excluded.
// wave 0 lands on "agentic", wave 1 on "commerce".
const MARKS: {u: number; v: number; wave: 0 | 1}[] = [
  {u: 274, v: 175, wave: 1},
  {u: 377, v: 176, wave: 1},
  {u: 207, v: 233, wave: 0},
  {u: 300, v: 253, wave: 0},
  {u: 390, v: 254, wave: 1},
  {u: 80, v: 275, wave: 0},
  {u: 341, v: 310, wave: 1},
  {u: 208, v: 337, wave: 0},
  {u: 288, v: 351, wave: 0},
  {u: 392, v: 351, wave: 1},
  {u: 137, v: 364, wave: 0},
  {u: 63, v: 405, wave: 0},
  {u: 250, v: 418, wave: 1},
];

// Stable per-mark scatter: organic, but identical on every frame.
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  const n =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  // The continent is context, not subject: one fixed value, never animated.
  mapOpacity: z.number().min(0).max(1),
  markOpacity: z.number().min(0).max(1),
  // All three live in public/. Black glyphs, recoloured by filter.
  map: z.string(),
  markIcon: z.string(),
  solutionIcon: z.string(),
  markSize: z.number().min(30).max(200),
  solutionSize: z.number().min(80).max(600),
  // Beat frames from the SRT at 30fps, relative to 00:00:02.060:
  //   0 "i'm excited to" · 18 "share that" · 29 "we're bringing" · 42 "agentic"
  //   59 "commerce" · 95 "in one single" · 120 "solution"
  beats: z.object({
    map: z.number().int(),
    agentic: z.number().int(),
    commerce: z.number().int(),
    converge: z.number().int(),
    solution: z.number().int(),
  }),
});

export type AgenticCommerceEuropeProps = z.infer<typeof schema>;

export const defaultProps: AgenticCommerceEuropeProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#635BFF',
  mapOpacity: 0.2,
  markOpacity: 0.92,
  map: 'europe.png',
  markIcon: 'ai-sparkles.png',
  solutionIcon: 'solution.png',
  markSize: 92,
  solutionSize: 340,
  beats: {map: 0, agentic: 42, commerce: 59, converge: 95, solution: 120},
});

const AgenticCommerceEurope: React.FC<AgenticCommerceEuropeProps> = ({
  ink,
  accent,
  mapOpacity,
  markOpacity,
  map,
  markIcon,
  solutionIcon,
  markSize,
  solutionSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const [ir, ig, ib] = rgbOf(ink);

  const mapIn = interpolate(frame, [beats.map, beats.map + 20], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Per-mark geometry, resolved once so the solution can be derived from how
  // many marks have actually arrived rather than from a parallel timer.
  const marks = MARKS.map((m, i) => {
    const x0 = mx(m.u);
    const y0 = my(m.v);
    const dx = CX - x0;
    const dy = CY - y0;
    const dist = Math.hypot(dx, dy);
    const scale = 0.88 + hash(i, 1) * 0.26;
    const rot = (hash(i, 2) - 0.5) * 22;
    const side = hash(i, 3) > 0.5 ? 1 : -1;

    const born =
      (m.wave === 0 ? beats.agentic : beats.commerce) - 3 + Math.round(hash(i, 4) * 9);
    const enter = interpolate(frame, [born, born + 15], [0, 1], {
      easing: Easing.bezier(0.22, 1.12, 0.36, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    // Far marks leave first and everything lands inside a four-frame window,
    // so the arrival reads as one event instead of a queue.
    const leave = beats.converge + Math.round((1 - dist / 470) * 7);
    const land = beats.solution + Math.round(hash(i, 5) * 4);
    const t = interpolate(frame, [leave, land], [0, 1], {
      easing: Easing.bezier(0.5, 0, 0.16, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    // Curved travel: a straight snap to the middle reads mechanical, a shallow
    // arc reads as flow into one place.
    const px = -dy / (dist || 1);
    const py = dx / (dist || 1);
    const bend = dist * 0.17 * side;
    const bx = x0 + dx / 2 + px * bend;
    const by = y0 + dy / 2 + py * bend;
    const k = 1 - t;
    const x = k * k * x0 + 2 * k * t * bx + t * t * CX;
    const y = k * k * y0 + 2 * k * t * by + t * t * CY;

    // Subordinate idle drift so the held state before the collapse breathes.
    const drift = 1.6 * (1 - t) * Math.sin((frame / 34) * Math.PI * 2 + hash(i, 6) * 6.28);

    const absorb = interpolate(t, [0.72, 1], [1, 0], {extrapolateLeft: 'clamp'});
    return {
      x: x + drift * side,
      y: y + drift + 16 * (1 - enter) * (1 - t),
      s: scale * (0.62 + 0.38 * enter) * (1 - 0.72 * t),
      rot: rot * (1 - t),
      opacity: markOpacity * enter * absorb,
      t,
    };
  });

  // One single solution: it exists exactly as much as the agents have been
  // given up, so it can never drift out of sync with them.
  const arrived =
    marks.reduce(
      (n, m) =>
        n +
        interpolate(m.t, [0.68, 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      0,
    ) / marks.length;

  const solved = interpolate(arrived, [0, 1], [0.62, 1], {
    easing: Easing.out(Easing.cubic),
  });
  // Resolves three frames before the end: the last frame is held, not moving.
  const pulse = interpolate(
    frame,
    [beats.solution - 2, beats.solution + 7, beats.solution + 16],
    [0, 1, 0],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const solutionScale = solved + 0.028 * pulse;

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          {/* Force the black glyphs to ink while keeping their alpha. */}
          <filter id="eu-ink" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${ir} 0 0 0 0 ${ig} 0 0 0 0 ${ib} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      {/* Fades up once at the head, then holds: it is the stage, not an event. */}
      <Img
        src={staticFile(map)}
        style={{
          position: 'absolute',
          left: MAP_LEFT,
          top: MAP_TOP,
          width: MAP_SIZE,
          height: MAP_SIZE,
          opacity: mapIn * mapOpacity,
          filter: 'url(#eu-ink)',
        }}
      />

      {marks.map((m, i) =>
        m.opacity <= 0.001 ? null : (
          <Img
            key={i}
            src={staticFile(markIcon)}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: markSize,
              height: markSize,
              opacity: m.opacity,
              transform: `translate(${(m.x - markSize / 2).toFixed(2)}px, ${(
                m.y -
                markSize / 2
              ).toFixed(2)}px) rotate(${m.rot.toFixed(2)}deg) scale(${m.s.toFixed(4)})`,
              transformOrigin: 'center center',
              filter: 'url(#eu-ink)',
            }}
          />
        ),
      )}

      {arrived > 0.001 ? (
        <Img
          src={staticFile(solutionIcon)}
          style={{
            position: 'absolute',
            left: CX - solutionSize / 2,
            top: CY - solutionSize / 2,
            width: solutionSize,
            height: solutionSize,
            opacity: interpolate(arrived, [0, 0.25], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `scale(${solutionScale.toFixed(4)})`,
            transformOrigin: 'center center',
            filter: 'url(#eu-ink)',
          }}
        />
      ) : null}

      {pulse > 0.001 ? (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <circle
            cx={CX}
            cy={CY}
            r={solutionSize * 0.54 + 40 * pulse}
            fill="none"
            stroke={accent}
            strokeWidth={4}
            opacity={0.5 * pulse}
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

export default AgenticCommerceEurope;
