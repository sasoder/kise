import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
// Ajeya ant-colony cut, 0:25.140 -> 0:31.460. round(6.32 * 24).
export const DURATION = 152;

const CX = 540;
// Captions run along the bottom: the pool tops out at y ~324 and the colony
// bottoms out at y ~1290, so the whole column sits inside the safe band.
const QUEEN_Y = 740;
const COL_TOP = 576;

// One particle of the pool per ant: the whole thing goes through, and every
// ant ends up with exactly one. That is the equality, made physical.
const N = 36;
// Metering: a particle is released every SPACING frames, holds at the mouth
// for HOLD, then falls. The stop-start is what makes it read as titration
// rather than as pouring.
const SPACING = 1.8;
const HOLD = 3;
const FALL = 9;
const PASS = HOLD + FALL;
// The first particle reaches her on frame 62, which is the word "the queen".
const FIRST = 50;
const QUEUE_GAP = 34;
const FAN = 13;
// How long a drop is held inside her before she releases it.
const INSIDE = 5;

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

const descAt = (i: number) => FIRST + i * SPACING;
const queenAt = (i: number) => descAt(i) + PASS;
const outAt = (i: number) => queenAt(i) + INSIDE;
// She releases from her underside, not from her centre.
const MOUTH = 30;

// The pool: all of it, above her.
const pool = Array.from({length: N}, (_, i) => {
  const a = hash(i, 1) * Math.PI * 2;
  const r = Math.sqrt(hash(i, 2));
  return {
    x: CX + Math.cos(a) * r * 244,
    y: 358 + Math.sin(a) * r * 112,
    size: 10 + hash(i, 3) * 5,
    jx: (hash(i, 4) - 0.5) * 54,
  };
});

// The colony: a crowd, scattered off its cells so it never reads as a lattice.
const ants = Array.from({length: N}, (_, j) => {
  const col = j % 9;
  const row = Math.floor(j / 9);
  return {
    x: 236 + col * 76 + (hash(j, 5) - 0.5) * 68,
    y: 952 + row * 62 + (hash(j, 6) - 0.5) * 56,
    // Unequal before she distributes it.
    size: 8 + hash(j, 7) * 7,
  };
});
// Which ant each drop goes to. Shuffled, so the colony fills all over rather
// than sweeping left to right.
const feeds = ants.map((_, j) => j).sort((a, b) => hash(a, 8) - hash(b, 8));
const fedBy = new Array<number>(N);
feeds.forEach((antIndex, i) => {
  fedBy[antIndex] = i;
});

const threads = (() => {
  const out: {a: number; b: number}[] = [];
  for (let a = 0; a < N; a += 1) {
    for (let b = a + 1; b < N; b += 1) {
      if (Math.hypot(ants[a].x - ants[b].x, ants[a].y - ants[b].y) < 132) {
        out.push({a, b});
      }
    }
  }
  return out;
})();

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  threadWidth: z.number().min(1).max(10),
  queenR: z.number().min(20).max(120),
  // Her body. She has to be the largest single body in the frame or she reads
  // as an aperture instead of an individual.
  queenCore: z.number().min(8).max(60),
  // The path each drop took from her, kept.
  lineageOpacity: z.number().min(0).max(1),
  // What every ant ends up with, once it has been through her.
  share: z.number().min(6).max(26),
  poolOpacity: z.number().min(0).max(1),
  idleOpacity: z.number().min(0).max(1),
  // Beat frames from the SRT at 24fps, relative to 00:00:25.140:
  //   0 "whole gene" · 21 "pool has to be" · 44 "titrated" · 58 "through"
  //   63 "the queen" · 72 "and so you" · 80 "just see" · 87 "much more like"
  //   111 "socialist" · 125 "in the ant" · 139 "colony"
  beats: z.object({
    pool: z.number().int(),
    hasToBe: z.number().int(),
    titrated: z.number().int(),
    through: z.number().int(),
    queen: z.number().int(),
    andSo: z.number().int(),
    justSee: z.number().int(),
    muchMore: z.number().int(),
    socialist: z.number().int(),
    inTheAnt: z.number().int(),
    colony: z.number().int(),
  }),
});

export type QueenTitrationEnhancedProps = z.infer<typeof schema>;

export const defaultProps: QueenTitrationEnhancedProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  threadWidth: 4.5,
  queenR: 66,
  queenCore: 30,
  lineageOpacity: 0.22,
  share: 15,
  poolOpacity: 0.88,
  idleOpacity: 0.42,
  beats: {
    pool: 0,
    hasToBe: 21,
    titrated: 44,
    through: 58,
    queen: 63,
    andSo: 72,
    justSee: 80,
    muchMore: 87,
    socialist: 111,
    inTheAnt: 125,
    colony: 139,
  },
});

const QueenTitrationEnhanced: React.FC<QueenTitrationEnhancedProps> = ({
  ink,
  accent,
  shadow,
  threadWidth,
  queenR,
  queenCore,
  lineageOpacity,
  share,
  poolOpacity,
  idleOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // The pool sags toward the neck before anything is released — the pull is
  // there before the first drop is.
  const sag = interpolate(frame, [beats.pool + 4, beats.hasToBe + 6], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Once the last of it is through, the colony closes up around her, so the
  // frame does not go empty where the pool used to be.
  const gather = interpolate(frame, [beats.inTheAnt - 6, 149], [0, 85], {
    easing: Easing.bezier(0.3, 1.12, 0.4, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Every drop's whole life is derived from one number: when it is released.
  const drops = pool.map((p, i) => {
    const tDesc = descAt(i);
    const tQueen = tDesc + PASS;
    const tOut = tQueen + INSIDE;
    const tAnt = tOut + FAN;
    const tCall = tDesc - 34;

    // Slots ahead of it in the queue. It creeps down as the front is released,
    // which is what makes the constraint visible: they have to wait.
    // A ratchet, not a conveyor: each advance is its own eased step with a
    // momentary rest between, which is what metering looks like.
    const slotRaw = Math.max(0, (tDesc - frame) / SPACING);
    const slot = Math.floor(slotRaw) + smooth(slotRaw - Math.floor(slotRaw));
    const queueX = CX + p.jx * clamp01(slot / 8) * 0.5;
    const queueY = COL_TOP - QUEUE_GAP * slot;

    let x: number;
    let y: number;
    let held = false;
    let inside = 0;
    let born = 1;
    let stretch = 0;
    if (frame < tCall) {
      const dr = 5 + hash(i, 9) * 7;
      const ph = hash(i, 10) * Math.PI * 2;
      x = p.x + dr * Math.cos(frame * 0.03 + ph) - (p.x - CX) * 0.08 * sag;
      y = p.y + dr * Math.sin(frame * 0.041 + ph) + 26 * sag;
    } else if (frame < tCall + 14) {
      const t = smooth(clamp01((frame - tCall) / 14));
      const fromX = p.x - (p.x - CX) * 0.08 * sag;
      const fromY = p.y + 26 * sag;
      x = fromX + (queueX - fromX) * t;
      y = fromY + (COL_TOP - QUEUE_GAP * 8 - fromY) * t;
    } else if (frame < tDesc) {
      x = queueX;
      y = queueY;
    } else if (frame < tQueen) {
      const u = (frame - tDesc) / PASS;
      // Held at the mouth, then let go: one at a time, on a beat.
      const fall = u < HOLD / PASS ? 0 : (u - HOLD / PASS) / (FALL / PASS);
      x = CX;
      y = COL_TOP + (QUEEN_Y - COL_TOP) * fall;
      held = u < HOLD / PASS;
      stretch = Math.sin(Math.PI * fall);
    } else if (frame < tOut) {
      x = CX;
      y = QUEEN_Y;
    } else if (frame < tAnt) {
      // Out of her fast, easing in at the ant.
      const t = Easing.bezier(0.42, 0, 0.18, 1)(clamp01((frame - tOut) / FAN));
      const a = {...ants[feeds[i]], y: ants[feeds[i]].y - gather};
      const c = {x: CX + (a.x - CX) * 0.32, y: QUEEN_Y + 128};
      const u = 1 - t;
      x = u * u * CX + 2 * u * t * c.x + t * t * a.x;
      y = u * u * QUEEN_Y + 2 * u * t * c.y + t * t * a.y;
    } else {
      x = 0;
      y = 0;
    }

    // Ink until it is through her, accent after: raw material becoming
    // structure, which is the whole claim in the line.
    const through = smooth(clamp01((frame - (tQueen - 2)) / 5));
    return {
      x,
      y,
      i,
      through,
      held,
      inside,
      born,
      stretch,
      gone: frame >= tAnt,
      shown: frame >= tCall - 0.001 || true,
      size: p.size,
      tQueen,
    };
  });

  // She works: one pulse per drop, taken from the drops themselves.
  let pulse = 0;
  let holding = 0;
  for (let i = 0; i < N; i += 1) {
    const d = frame - queenAt(i);
    if (d >= -1 && d < 9) {
      pulse = Math.max(pulse, 1 - Math.max(0, d) / 9);
    }
    if (d >= 0 && frame < outAt(i)) {
      holding = Math.max(holding, Math.sin((Math.PI * d) / INSIDE));
    }
  }
  // She locks to full size on the first drop she takes — frame 62, which is
  // the word "the queen".
  const enthroned = smooth(clamp01((frame - queenAt(0)) / 9));
  const queenIn = interpolate(frame, [beats.pool, beats.hasToBe], [0.82, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // An ant is fed the moment its drop lands — no parallel timer.
  const fedAt = (j: number) => outAt(fedBy[j]) + FAN;
  const fedness = (j: number) => smooth(clamp01((frame - fedAt(j)) / 7));

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {ants.map((a, j) => {
            const i = fedBy[j];
            const grow = smooth(clamp01((frame - outAt(i)) / FAN));
            if (grow <= 0) {
              return null;
            }
            const ay = a.y - gather;
            const c = {x: CX + (a.x - CX) * 0.32, y: QUEEN_Y + 128};
            const ex = CX + (c.x - CX) * grow;
            const ey = QUEEN_Y + MOUTH + (c.y - (QUEEN_Y + MOUTH)) * grow;
            const fx = ex + (a.x - ex) * grow;
            const fy = ey + (ay - ey) * grow;
            return (
              <g key={`p${j}`}>
                <path
                  d={`M ${CX} ${QUEEN_Y + MOUTH} Q ${ex.toFixed(1)} ${ey.toFixed(1)} ${fx.toFixed(
                    1,
                  )} ${fy.toFixed(1)}`}
                  fill="none"
                  stroke={accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={lineageOpacity * grow}
                />
                {grow < 1 ? <circle cx={fx} cy={fy} r={4.5} fill={accent} opacity={0.8} /> : null}
              </g>
            );
          })}

          {threads.map((t, k) => {
            const a = {...ants[t.a], y: ants[t.a].y - gather};
            const b = {...ants[t.b], y: ants[t.b].y - gather};
            // A thread exists only once both ends have their share.
            const grow = smooth(clamp01((frame - Math.max(fedAt(t.a), fedAt(t.b))) / 9));
            if (grow <= 0) {
              return null;
            }
            // ...and then it carries: the share keeps moving between them.
            const s = (((frame / 46 + hash(k, 12)) % 1) + 1) % 1;
            return (
              <g key={`t${k}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={a.x + (b.x - a.x) * grow}
                  y2={a.y + (b.y - a.y) * grow}
                  stroke={accent}
                  strokeWidth={threadWidth}
                  strokeLinecap="round"
                  opacity={0.44 * grow}
                />
                <circle
                  cx={a.x + (b.x - a.x) * s}
                  cy={a.y + (b.y - a.y) * s}
                  r={4.5}
                  fill={accent}
                  opacity={0.75 * grow * Math.sin(Math.PI * s)}
                />
              </g>
            );
          })}

          {ants.map((a, j) => {
            const f = fedness(j);
            const pop = interpolate(f, [0, 0.6, 1], [0, 1.28, 1]);
            const dr = 2 + hash(j, 13) * 3;
            const ph = hash(j, 14) * Math.PI * 2;
            return (
              <circle
                key={`a${j}`}
                cx={a.x + dr * Math.cos(frame * 0.028 + ph)}
                cy={a.y - gather + dr * Math.sin(frame * 0.035 + ph)}
                // Unequal to start with, identical once they have been through
                // her: the equality is in the geometry, not in a label.
                r={a.size + (share - a.size) * pop}
                fill={f > 0 ? accent : ink}
                opacity={idleOpacity + (0.95 - idleOpacity) * f}
              />
            );
          })}

          {/* The queen. */}
          <circle
            cx={CX}
            cy={QUEEN_Y}
            r={(queenR + 11 * pulse + 3 * Math.sin(frame / 16)) * queenIn * (0.88 + 0.12 * enthroned)}
            fill="none"
            stroke={accent}
            strokeWidth={(7 + 4 * pulse) * queenIn}
            opacity={0.92}
          />
          <circle
            cx={CX}
            cy={QUEEN_Y}
            r={(queenCore + 7 * holding + 2 * Math.sin(frame / 16)) * queenIn * (0.8 + 0.2 * enthroned)}
            fill={accent}
            opacity={0.95}
          />

          {drops.map((d) =>
            d.gone ? null : (
              <ellipse
                key={`d${d.i}`}
                cx={d.x}
                cy={d.y}
                rx={
                  d.size *
                  (1 + 0.18 * d.through * (1 - d.through) * 4) *
                  (d.held ? 1.06 : 1) *
                  (1 - d.inside) *
                  d.born *
                  (1 - 0.22 * d.stretch)
                }
                ry={
                  d.size *
                  (1 + 0.18 * d.through * (1 - d.through) * 4) *
                  (d.held ? 1.06 : 1) *
                  (1 - d.inside) *
                  d.born *
                  (1 + 0.38 * d.stretch)
                }
                fill={d.through > 0.5 ? accent : ink}
                opacity={poolOpacity}
              />
            ),
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default QueenTitrationEnhanced;
