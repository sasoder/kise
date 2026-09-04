import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';
import {
  ActorNode,
  BLOCK,
  Block,
  GridBackdrop,
  NODE_D,
  TintDefs,
  WEIGHT,
  World,
  clamp,
  clamp01,
  easeOut,
  enter,
  hash,
  makeCamera,
  stageDefaults,
  stageSchema,
  sw,
} from './_stage';

const {fontFamily} = loadFont();

export const FPS = 24;
// Dylan_Elon_Arbitrage (recut) 0:34.899 -> 0:46.039, plus half a second of
// resolved hold, with the trickle still running through it. round(11.140 * 24) + 24.
export const DURATION = 291;

export const schema = z.object({
  ...stageSchema,
  hoardN: z.number().int().min(4).max(16),
  creditDots: z.number().int().min(20).max(160),
  // Beat frames from the SRT at 24fps, relative to 00:00:34.899:
  //   0 "and so there's" · 27 "completely" · 36 "different power"
  //   49 "structure" · 59 "where meta" · 98 "effectively" · 111 "hoarding"
  //   121 "compute they're" · 137 "using their" · 150 "balance sheets"
  //   175 "capabilities" · 185 "to build" · 196 "compute"
  //   205 "without an end" · 223 "customer that's" · 236 "monetizing"
  //   248 "at a huge" · 258 "degree"
  beats: z.object({
    andSo: z.number().int(),
    completely: z.number().int(),
    differentPower: z.number().int(),
    structure: z.number().int(),
    whereMeta: z.number().int(),
    effectively: z.number().int(),
    hoarding: z.number().int(),
    computeTheyre: z.number().int(),
    usingTheir: z.number().int(),
    balanceSheets: z.number().int(),
    toBuild: z.number().int(),
    withoutAnEnd: z.number().int(),
    customer: z.number().int(),
    monetizing: z.number().int(),
    hugeDegree: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ...stageDefaults,
  hoardN: 8,
  creditDots: 68,
  beats: {
    andSo: 0,
    completely: 27,
    differentPower: 36,
    structure: 49,
    whereMeta: 59,
    effectively: 98,
    hoarding: 111,
    computeTheyre: 121,
    usingTheir: 137,
    balanceSheets: 150,
    toBuild: 185,
    withoutAnEnd: 205,
    customer: 223,
    monetizing: 236,
    hugeDegree: 258,
  },
});

// The old structure, carried over from the deadlock scene so that "a completely
// different power structure" has something to be different from.
const LOOP = [
  {x: 318, y: 1100, actor: 'cloud' as const},
  {x: 138, y: 780, actor: 'customer' as const},
  {x: 498, y: 780, actor: 'capital' as const},
];
const LOOP_C = {x: 318, y: 887};
const R_LOOP = 56;

const META_X = 720;
const SLAB_Y = 1370;
const SLAB_W = 430;
const SLAB_H = 58;
const TETHER_X = 545;
const NODE_Y = 1524;
const GROUND_Y = 1624;
const CREDIT_Y0 = 1706;
const CREDIT_Y1 = 1884;
const CREDIT_MID = (CREDIT_Y0 + CREDIT_Y1) / 2;

const CAM = makeCamera({
  f: [0, 40, 62, 100, 145, 190, 240, DURATION],
  cx: [326, 334, 424, 556, 606, 608, 604, 606],
  cy: [1074, 1080, 1150, 1320, 1432, 1471, 1474, 1470],
  k: [0.95, 0.94, 0.92, 0.88, 0.85, 0.82, 0.82, 0.82],
});

const loopArc = (p: {x: number; y: number}, q: {x: number; y: number}) => {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = 0.2 * len;
  const c = {x: (p.x + q.x) / 2 + (-dy / len) * bow, y: (p.y + q.y) / 2 + (dx / len) * bow};
  return {
    d: `M ${p.x} ${p.y} Q ${c.x} ${c.y} ${q.x} ${q.y}`,
    at: (t: number) => {
      const u = 1 - t;
      return {x: u * u * p.x + 2 * u * t * c.x + t * t * q.x, y: u * u * p.y + 2 * u * t * c.y + t * t * q.y};
    },
  };
};

const HoardingPowerStructure: React.FC<Props> = ({
  ink,
  accent,
  grid,
  gridBlur,
  gridBrightness,
  gridBase,
  shadow,
  hoardN,
  creditDots,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = CAM(frame);
  const k = cam.k;
  const step = BLOCK.h + BLOCK.gap;

  // The old way recedes and shrinks once the new one is on screen, but never
  // disappears — the comparison is the point of the line.
  const recede = interpolate(frame, [beats.whereMeta, beats.hoarding], [1, 0.42], clamp);
  const loopScale = interpolate(frame, [beats.whereMeta, beats.hoarding], [1, 0.84], clamp);

  // The hoard: compute that arrives and stays.
  const stackTop = SLAB_Y - hoardN * step;
  const sealed = easeOut((frame - beats.hoarding) / 26);

  // The balance sheet was always under the compute: it is there as an outline
  // before the first block lands, and fills solid on the words. Nothing slides
  // in under an already-standing stack.
  const foundation = easeOut((frame - (beats.whereMeta - 4)) / 16);
  const slab = easeOut((frame - beats.balanceSheets) / 22);
  // The balance sheet is the collateral, so the tether goes straight down to
  // the credit markets — no customer's signature required first. That is the
  // whole difference from the loop on the left.
  const tether = easeOut((frame - beats.balanceSheets) / 28);
  const drawing = clamp01((frame - (beats.balanceSheets + 26)) / 20);

  const tetherPath = (t: number) => ({x: TETHER_X, y: SLAB_Y + SLAB_H + (CREDIT_MID - SLAB_Y - SLAB_H) * t});
  const upPath = (t: number) => tetherPath(1 - t);

  return (
    <AbsoluteFill style={{backgroundColor: gridBase, fontFamily}}>
      <GridBackdrop
        grid={grid}
        gridBlur={gridBlur}
        gridBrightness={gridBrightness}
        gridBase={gridBase}
        cam={cam}
        frame={frame}
      />
      <TintDefs ink={ink} accent={accent} />

      <World cam={cam} shadow={shadow}>
        <svg
          width={1080}
          height={2200}
          viewBox="0 0 1080 2200"
          style={{overflow: 'visible', position: 'absolute', left: 0, top: 0}}
        >
          <line
            x1={-500}
            y1={Math.round(GROUND_Y) + 0.5}
            x2={1580}
            y2={Math.round(GROUND_Y) + 0.5}
            stroke={ink}
            strokeWidth={sw(WEIGHT.context, k)}
            opacity={0.24}
          />

          {/* The credit markets. They ripple when the tether reaches them. */}
          {Array.from({length: creditDots}, (_, i) => {
            const x = 150 + hash(i, 1) * 820;
            const y = CREDIT_Y0 + hash(i, 2) * (CREDIT_Y1 - CREDIT_Y0);
            const shown = clamp01((frame - (beats.balanceSheets - 10) - hash(i, 3) * 22) / 18);
            const bob = 5 * Math.sin(frame * 0.04 + hash(i, 4) * 6.3);
            return (
              <circle
                key={`k${i}`}
                cx={x}
                cy={y + bob}
                r={sw(8 + 5 * hash(i, 6), k)}
                fill={ink}
                opacity={0.4 * shown}
              />
            );
          })}

          {/* The old structure: still going round, still stuck. */}
          <g
            opacity={recede}
            transform={`translate(${LOOP_C.x} ${LOOP_C.y}) scale(${loopScale.toFixed(4)}) translate(${-LOOP_C.x} ${-LOOP_C.y})`}
          >
            {LOOP.map((p, i) => {
              const q = LOOP[(i + 1) % 3];
              const t = easeOut((frame - (beats.andSo - 20 + i * 8)) / 24);
              const a = loopArc(p, q);
              return (
                <g key={`la${i}`}>
                  <path
                    d={a.d}
                    fill="none"
                    stroke={ink}
                    strokeWidth={sw(WEIGHT.structure, k)}
                    strokeLinecap="round"
                    opacity={0.5 * clamp01(t * 4)}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - t}
                  />
                </g>
              );
            })}
            {/* Still circling, still finding no way in. */}
            {frame >= beats.completely
              ? Array.from({length: 1}, (_, i) => {
                  const p = ((frame - beats.completely) / 52 + i) % 1;
                  const which = Math.min(2, Math.floor(p * 3));
                  const pt = loopArc(LOOP[which], LOOP[(which + 1) % 3]).at(p * 3 - which);
                  return <circle key={`lp${i}`} cx={pt.x} cy={pt.y} r={sw(13, k)} fill={ink} opacity={0.85} />;
                })
              : null}
          </g>

          {/* The tether: straight from the slab into the market, with a head. */}
          {tether > 0.002 ? (
            <>
              <line
                x1={TETHER_X}
                y1={SLAB_Y + SLAB_H}
                x2={TETHER_X}
                y2={tetherPath(tether).y}
                stroke={accent}
                strokeWidth={sw(WEIGHT.subject, k)}
                strokeLinecap="round"
                opacity={0.78}
              />
            </>
          ) : null}
          {/* Capital coming back up it, continuously, each arrival flashing
              the slab. */}
          {drawing > 0.01
            ? Array.from({length: 2}, (_, i) => {
                const p = ((frame - beats.balanceSheets - 26) / 34 + i / 2) % 1;
                const pt = upPath(p);
                return <circle key={`u${i}`} cx={pt.x} cy={pt.y} r={sw(13, k)} fill={ink} opacity={0.9 * Math.sin(p * Math.PI)} />;
              })
            : null}

          {/* The balance sheet: the foundation the hoard stands on. */}
          {foundation > 0.002 ? (
            <>
              <rect
                x={META_X - SLAB_W / 2}
                y={SLAB_Y}
                width={SLAB_W}
                height={SLAB_H}
                rx={BLOCK.r}
                fill="none"
                stroke={ink}
                strokeWidth={sw(WEIGHT.structure, k)}
                opacity={0.4 * foundation * (1 - slab)}
              />
              <rect
                x={META_X - SLAB_W / 2}
                y={SLAB_Y}
                width={SLAB_W}
                height={SLAB_H}
                rx={BLOCK.r}
                fill={ink}
                opacity={0.88 * slab}
              />
            </>
          ) : null}

          {/* The hoard, landing with weight. */}
          {Array.from({length: hoardN}, (_, b) => (
            <Block
              key={`h${b}`}
              x={META_X}
              baseY={SLAB_Y - b * step}
              t={enter(frame, beats.whereMeta + 6 + b * 6.5, fps)}
              fill={accent}
              drop={60}
            />
          ))}

          {/* Compute arriving from outside and never leaving: a trickle that
              keeps running the whole scene. */}
          {frame > beats.whereMeta
            ? Array.from({length: 2}, (_, i) => {
                const speed = frame < beats.computeTheyre ? 28 : 56;
                const p = ((frame - beats.whereMeta) / speed + i / 2) % 1;
                const from = {x: 1120, y: 1230 + hash(i, 2) * 110};
                const to = {x: META_X + BLOCK.w / 2 + 14, y: stackTop + 60};
                const pos = (t: number) => ({
                  x: from.x + (to.x - from.x) * easeOut(t),
                  y: from.y + (to.y - from.y) * easeOut(t) - Math.sin(t * Math.PI) * 40,
                });
                const pt = pos(p);
                return <circle key={`in${i}`} cx={pt.x} cy={pt.y} r={sw(12, k)} fill={accent} opacity={0.85 * Math.sin(p * Math.PI)} />;
              })
            : null}

          {/* Nothing leaves: a solid seal draws itself around the hoard. */}
          {sealed > 0.002 ? (
            <rect
              x={META_X - BLOCK.w / 2 - 30}
              y={stackTop - 30}
              width={BLOCK.w + 60}
              height={SLAB_Y - stackTop + 60}
              rx={30}
              fill="none"
              stroke={accent}
              strokeWidth={sw(WEIGHT.structure, k)}
              opacity={0.62}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - sealed}
            />
          ) : null}

        </svg>

        {/* The three parties from the deadlock, in their rings, receded. */}
        {LOOP.map((p, i) => {
          const t = enter(frame, beats.andSo - 20 + i * 8, fps);
          if (t <= 0.002) {
            return null;
          }
          const d = R_LOOP * 2 * loopScale;
          const x = LOOP_C.x + (p.x - LOOP_C.x) * loopScale;
          const y = LOOP_C.y + (p.y - LOOP_C.y) * loopScale;
          return (
            <div key={`lnode${i}`} style={{position: 'absolute', left: x - d / 2, top: y - d / 2, opacity: recede}}>
              <ActorNode actor={p.actor} k={k} d={d} color={ink} scale={Math.min(t, 1.04)} opacity={0.9 * clamp01(t * 1.5)} />
            </div>
          );
        })}

        {/* Whose balance sheet it is. */}
        {(() => {
          const t = enter(frame, beats.whereMeta, fps);
          if (t <= 0.002) {
            return null;
          }
          return (
            <div style={{position: 'absolute', left: META_X - NODE_D / 2, top: NODE_Y - NODE_D / 2}}>
              <ActorNode actor="meta" k={k} color={ink} opacity={0.94 * clamp01(t * 1.5)} scale={t} />
            </div>
          );
        })()}
      </World>
    </AbsoluteFill>
  );
};

export default HoardingPowerStructure;
