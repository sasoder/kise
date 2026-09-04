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
// Ajeya, 0:31.460 -> 0:39.899. round(8.439 * 24).
export const DURATION = 203;

const CX = 540;
// The field owns the frame until the humans need room, then it drops.
const FIELD_HIGH = 835;
const FIELD_LOW = 1075;

const N = 42;
const EQUAL = 13;
// What each of them gains when the gain is shared out.
const RISE = 6;
// The gain crosses the whole field in this many frames, whatever the graph
// happens to look like.
const FLOOD_SPAN = 30;

// Three humans, each with their own line of descent. Counts differ on purpose:
// inherited individually means some lines get more than others.
const HUMANS = [
  {x: 250, charges: 3},
  {x: 540, charges: 1},
  {x: 830, charges: 2},
];
const HUMAN_Y = 430;
const CHAIN = [545, 615, 685, 755];

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

const agents = Array.from({length: N}, (_, i) => {
  const a = hash(i, 1) * Math.PI * 2;
  const r = Math.sqrt(hash(i, 2));
  return {
    x: CX + Math.cos(a) * r * 330,
    y: Math.sin(a) * r * 208,
    // Unequal to begin with.
    size: 7 + hash(i, 3) * 9,
  };
});

// Threads by proximity, plus each agent's nearest neighbour, so the graph is
// connected and a gain anywhere can reach everyone.
const links = (() => {
  const out: {a: number; b: number}[] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a !== b && !seen.has(key)) {
      seen.add(key);
      out.push({a, b});
    }
  };
  for (let a = 0; a < N; a += 1) {
    let near = -1;
    let nd = Infinity;
    for (let b = 0; b < N; b += 1) {
      if (a === b) {
        continue;
      }
      const d = Math.hypot(agents[a].x - agents[b].x, agents[a].y - agents[b].y);
      if (d < nd) {
        nd = d;
        near = b;
      }
      if (d < 168) {
        add(a, b);
      }
    }
    add(a, near);
  }
  return out;
})();

// Where the gain starts, and how many hops away everyone is from it. The flood
// is read off this, so no agent can light before its neighbour does.
const SOURCE = 0;
const hops = (() => {
  const adj: number[][] = Array.from({length: N}, () => []);
  links.forEach((l) => {
    adj[l.a].push(l.b);
    adj[l.b].push(l.a);
  });
  const d = new Array<number>(N).fill(Infinity);
  d[SOURCE] = 0;
  const queue = [SOURCE];
  while (queue.length > 0) {
    const v = queue.shift() as number;
    adj[v].forEach((w) => {
      if (d[w] === Infinity) {
        d[w] = d[v] + 1;
        queue.push(w);
      }
    });
  }
  return d.map((v) => (v === Infinity ? 0 : v));
})();
const MAX_HOP = Math.max(1, ...hops);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  threadWidth: z.number().min(1).max(10),
  chainWidth: z.number().min(1).max(10),
  humanGlyph: z.string(),
  humanSize: z.number().min(60).max(240),
  dimOpacity: z.number().min(0).max(1),
  grid: z.string(),
  gridBlur: z.number().min(0).max(40),
  gridBrightness: z.number().min(0).max(1),
  gridBase: z.string(),
  // Beat frames from the SRT at 24fps, relative to 00:00:31.460:
  //   0 "you could" · 4 "just have" · 14 "ais that have a" · 40 "similar"
  //   49 "motivation" · 79 "structure" · 92 "because unlike" · 111 "humans
  //   their" · 130 "fitness is not" · 158 "inherited" · 178 "individually"
  beats: z.object({
    youCould: z.number().int(),
    justHave: z.number().int(),
    ais: z.number().int(),
    similar: z.number().int(),
    motivation: z.number().int(),
    structure: z.number().int(),
    unlike: z.number().int(),
    humans: z.number().int(),
    fitness: z.number().int(),
    inherited: z.number().int(),
    individually: z.number().int(),
  }),
});

export type FitnessNotIndividualGridProps = z.infer<typeof schema>;

export const defaultProps: FitnessNotIndividualGridProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.22)',
  threadWidth: 4.5,
  chainWidth: 4,
  humanGlyph: 'person.png',
  humanSize: 104,
  // Against the grid the recede floor has to sit higher or it goes muddy.
  dimOpacity: 0.36,
  grid: 'grid-background.jpg',
  gridBlur: 13,
  gridBrightness: 0.32,
  gridBase: '#232323',
  beats: {
    youCould: 0,
    justHave: 4,
    ais: 14,
    similar: 40,
    motivation: 49,
    structure: 79,
    unlike: 92,
    humans: 111,
    fitness: 130,
    inherited: 158,
    individually: 178,
  },
});

const FitnessNotIndividualGrid: React.FC<FitnessNotIndividualGridProps> = ({
  ink,
  accent,
  shadow,
  threadWidth,
  chainWidth,
  humanGlyph,
  humanSize,
  dimOpacity,
  grid,
  gridBlur,
  gridBrightness,
  gridBase,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // "a similar motivation structure": it knits itself, then levels itself.
  const knit = (j: number) =>
    smooth(
      clamp01(
        interpolate(frame, [beats.ais + j * 0.32, beats.ais + 14 + j * 0.32], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      ),
    );
  const level = interpolate(frame, [beats.similar, beats.motivation + 8], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settled = interpolate(frame, [beats.structure, beats.structure + 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The field makes room for the humans, then comes back for the last claim.
  const fieldY = interpolate(frame, [beats.unlike, beats.unlike + 24], [FIELD_HIGH, FIELD_LOW], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fieldLit = interpolate(
    frame,
    [beats.unlike, beats.unlike + 20, beats.inherited - 8, beats.inherited + 6],
    [1, dimOpacity, dimOpacity, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // "unlike humans": each one with its own line of descent.
  const arrive = (h: number) =>
    smooth(
      clamp01(
        interpolate(frame, [beats.humans - 8 + h * 5, beats.humans + 6 + h * 5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      ),
    );
  const chainDraw = (h: number, d: number) =>
    smooth(
      clamp01(
        interpolate(
          frame,
          [beats.humans + 4 + h * 4 + d * 3, beats.humans + 14 + h * 4 + d * 3],
          [0, 1],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        ),
      ),
    );
  // A gain travels down one line and stops there. That is what inherited
  // individually looks like, so the counts differ between lines.
  const chargeAt = (h: number, k: number) => beats.fitness + h * 5 + k * 9;
  const chargeP = (h: number, k: number) =>
    clamp01((frame - chargeAt(h, k)) / 20);
  const gainOf = (h: number, d: number) => {
    let g = 0;
    for (let k = 0; k < HUMANS[h].charges; k += 1) {
      if (chargeP(h, k) > (d + 1) / (CHAIN.length + 0.4)) {
        g += 1;
      }
    }
    return g;
  };
  const humanFade = interpolate(frame, [beats.inherited + 8, beats.individually + 8], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // "not inherited individually": the gain has nowhere private to go, so it
  // crosses the whole field and everyone ends up with the same.
  // It leaves its origin on "not inherited" and has reached everyone by
  // "individually" — the word and the outcome land together.
  const flood = (i: number) =>
    smooth(
      clamp01(
        (frame - (beats.inherited + 4 + (hops[i] / MAX_HOP) * FLOOD_SPAN)) / 10,
      ),
    );

  const pos = (i: number) => ({x: agents[i].x, y: fieldY + agents[i].y});

  // Camera: its own keyed track, fixed targets, damped. In on the field while
  // it is the only thing on screen; back to reveal the humans arriving above;
  // a slow creep through their beat; then down onto the field for the flood,
  // with the human lines still in the top of the frame so the last image is
  // the comparison.
  const k = interpolate(
    frame,
    [0, beats.unlike, beats.unlike + 32, beats.fitness + 28, 198],
    [1.3, 1.34, 0.97, 1.02, 1.16],
    {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const camY = interpolate(
    frame,
    [0, beats.unlike, beats.unlike + 32, beats.fitness + 28, 198],
    [786, 786, 762, 735, 810],
    {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const tx = CX - CX * k;
  const ty = FIELD_HIGH - camY * k;
  const sizeOf = (i: number) =>
    (agents[i].size + (EQUAL - agents[i].size) * level + RISE * flood(i)) *
    (1 + 0.06 * settled * Math.sin(frame / 15 + i));

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
            // Its own plane: 0.15 of the camera, 0.3 of the zoom, plus a drift
            // so it is never static during a hold.
            transform: `translate(${(tx * 0.15 + frame * 0.09).toFixed(2)}px, ${(
              ty * 0.15 +
              frame * 0.05
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
          {/* Their structure. */}
          {links.map((l, j) => {
            const g = knit(j);
            if (g <= 0) {
              return null;
            }
            const a = pos(l.a);
            const b = pos(l.b);
            const f = Math.min(flood(l.a), flood(l.b));
            const s = (((frame / 40 + hash(j, 5)) % 1) + 1) % 1;
            const cross = Math.max(flood(l.a), flood(l.b)) - f;
            return (
              <g key={`l${j}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={a.x + (b.x - a.x) * g}
                  y2={a.y + (b.y - a.y) * g}
                  stroke={accent}
                  strokeWidth={threadWidth + 1.5 * f}
                  strokeLinecap="round"
                  opacity={(0.42 + 0.32 * f) * g * fieldLit}
                />
                <circle
                  cx={a.x + (b.x - a.x) * s}
                  cy={a.y + (b.y - a.y) * s}
                  r={4.5}
                  fill={accent}
                  opacity={0.7 * g * fieldLit * Math.sin(Math.PI * s) * (0.5 + 0.5 * cross)}
                />
              </g>
            );
          })}

          {agents.map((a, i) => {
            const p = pos(i);
            const dr = 3 + hash(i, 6) * 4;
            const ph = hash(i, 7) * Math.PI * 2;
            return (
              <circle
                key={`a${i}`}
                cx={p.x + dr * Math.cos(frame * 0.03 + ph)}
                cy={p.y + dr * Math.sin(frame * 0.037 + ph)}
                r={sizeOf(i)}
                fill={accent}
                opacity={(0.64 + 0.33 * flood(i)) * fieldLit}
              />
            );
          })}

          {/* Ours: each line its own, and none of them joined. */}
          {HUMANS.map((h, hi) => {
            const a = arrive(hi);
            if (a <= 0) {
              return null;
            }
            return (
              <g key={`h${hi}`} opacity={a * humanFade}>
                {CHAIN.map((y, d) => {
                  const g = chainDraw(hi, d);
                  if (g <= 0) {
                    return null;
                  }
                  const fromY = d === 0 ? HUMAN_Y + 58 : CHAIN[d - 1];
                  const x = h.x + (hash(hi * 7 + d, 8) - 0.5) * 26;
                  const px = d === 0 ? h.x : h.x + (hash(hi * 7 + d - 1, 8) - 0.5) * 26;
                  const gain = gainOf(hi, d);
                  return (
                    <g key={`c${d}`}>
                      <line
                        x1={px}
                        y1={fromY}
                        x2={px + (x - px) * g}
                        y2={fromY + (y - fromY) * g}
                        stroke={ink}
                        strokeWidth={chainWidth}
                        strokeLinecap="round"
                        opacity={0.6 * g}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={(9 + hash(hi * 7 + d, 9) * 3 + 5.6 * gain) * g}
                        fill={ink}
                        opacity={(0.52 + 0.18 * gain) * g}
                      />
                    </g>
                  );
                })}

                {Array.from({length: h.charges}, (_, k) => {
                  const p = chargeP(hi, k);
                  if (p <= 0 || p >= 1) {
                    return null;
                  }
                  const y = HUMAN_Y + 58 + (CHAIN[CHAIN.length - 1] - HUMAN_Y - 58) * p;
                  return <circle key={`g${k}`} cx={h.x} cy={y} r={7.5} fill={ink} opacity={0.95} />;
                })}
              </g>
            );
          })}
        </g>
      </svg>

      {HUMANS.map((h, hi) => (
        <Img
          key={`i${hi}`}
          src={staticFile(humanGlyph)}
          style={{
            position: 'absolute',
            left: h.x - humanSize / 2,
            top: HUMAN_Y - humanSize / 2,
            width: humanSize,
            height: humanSize,
            filter: `brightness(0) invert(1) drop-shadow(0 2px 9px ${shadow})`,
            opacity: 0.92 * arrive(hi) * humanFade,
            transform: `translateY(${(1 - arrive(hi)) * -40}px)`,
          }}
        />
      ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default FitnessNotIndividualGrid;
