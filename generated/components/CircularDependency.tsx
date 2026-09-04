import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';
import {
  ActorNode,
  GridBackdrop,
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
// Dylan_Elon_Arbitrage (recut) 0:26.579 -> 0:34.899, plus half a second of
// resolved hold, with the capital still flowing through it. round(8.320 * 24) + 24.
export const DURATION = 224;

export const schema = z.object({
  ...stageSchema,
  creditDots: z.number().int().min(20).max(160),
  // Beat frames from the SRT at 24fps, relative to 00:00:26.579:
  //   0 "if i want" · 13 "customer i" · 31 "find the" · 37 "capital"
  //   50 "who's going to" · 63 "capital and the" · 76 "customer the"
  //   88 "customer has to" · 97 "sign a deal" · 123 "customer's"
  //   133 "commitment" · 141 "to the credit" · 160 "markets and i"
  //   176 "raise the" · 184 "capital"
  beats: z.object({
    wantCustomer: z.number().int(),
    customer: z.number().int(),
    findThe: z.number().int(),
    capital: z.number().int(),
    whosGoing: z.number().int(),
    capitalAnd: z.number().int(),
    andCustomer: z.number().int(),
    theCustomer: z.number().int(),
    deal: z.number().int(),
    commitment: z.number().int(),
    creditMarkets: z.number().int(),
    raise: z.number().int(),
    raisedCapital: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ...stageDefaults,
  creditDots: 72,
  beats: {
    wantCustomer: 0,
    customer: 13,
    findThe: 31,
    capital: 37,
    whosGoing: 50,
    capitalAnd: 63,
    andCustomer: 76,
    theCustomer: 88,
    deal: 97,
    commitment: 133,
    creditMarkets: 141,
    raise: 160,
    raisedCapital: 184,
  },
});

// A random cloud, unbranded — it is nobody in particular, which is the point.
const BUILDER = {x: 540, y: 1180};
const CUSTOMER = {x: 180, y: 690};
const CAPITAL = {x: 900, y: 690};
const R_BUILDER = 78;
const R_ROLE = 68;
const GROUND_Y = 1430;
const CREDIT_Y0 = 1530;
const CREDIT_Y1 = 1760;
const CREDIT_MID = (CREDIT_Y0 + CREDIT_Y1) / 2;
const IMPACT = {x: 540, y: CREDIT_MID};

// Fixed centre with a slow drift, so the frame is never frozen even on a hold.
const CAM = makeCamera({
  f: [0, 60, 110, 150, 178, 198, DURATION],
  cx: [536, 542, 540, 540, 540, 540, 540],
  cy: [1064, 1054, 1070, 1160, 1290, 1331, 1336],
  k: [1.04, 1.06, 1.04, 1.0, 0.94, 0.9, 0.9],
});

// A gentle arc between two nodes, bowed away from the middle of the triangle.
const arc = (a: {x: number; y: number}, b: {x: number; y: number}, bow: number) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const c = {x: mx + (-dy / len) * bow, y: my + (dx / len) * bow};
  return {
    d: `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`,
    at: (t: number) => {
      const u = 1 - t;
      return {
        x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
        y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
      };
    },
  };
};

const CircularDependency: React.FC<Props> = ({
  ink,
  accent,
  grid,
  gridBlur,
  gridBrightness,
  gridBase,
  shadow,
  creditDots,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = CAM(frame);
  const k = cam.k;

  const legA = arc(BUILDER, CUSTOMER, 92); // I need a customer
  const legB = arc(CUSTOMER, CAPITAL, 112); // who needs to see capital
  const legC = arc(CAPITAL, BUILDER, 92); // which needs to see a customer
  const LEGS = [legA, legB, legC];
  const drawAt = [beats.wantCustomer, beats.findThe, beats.whosGoing];
  const draw = drawAt.map((a) => easeOut((frame - a) / 26));

  // The loop closes and starts chasing itself: no way in, which is the whole
  // complaint. It stops the moment the customer actually signs.
  const looping = clamp01((frame - beats.andCustomer) / 10);
  const signed = easeOut((frame - beats.deal) / 20);
  const carried = clamp01((frame - beats.commitment) / (beats.raise - beats.commitment));
  const landed = frame >= beats.raise;
  const raised = clamp01((frame - beats.raise) / (beats.raisedCapital + 18 - beats.raise));
  const capitalLit = interpolate(frame, [beats.raisedCapital, beats.raisedCapital + 16], [0, 1], clamp);

  // Where the commitment leaves the signed arc from, and its path to the market.
  const carryFrom = legA.at(0.5);
  const carryPath = (t: number) => ({
    x: carryFrom.x + (IMPACT.x - carryFrom.x) * t,
    y: carryFrom.y + (IMPACT.y - carryFrom.y) * t,
  });
  const raisePath = (t: number) => ({
    x: IMPACT.x + (CAPITAL.x - IMPACT.x) * t,
    y: IMPACT.y + (CAPITAL.y + R_ROLE - IMPACT.y) * t,
  });

  // The three parties, each in the shared ring with an icon that says which
  // role it is. Ink until the moment it is resolved, accent after — crossfaded
  // rather than swapped.
  const roleNode = (
    p: {x: number; y: number},
    d: number,
    actor: 'cloud' | 'customer' | 'capital',
    lit: number,
    at: number,
    key: string,
  ) => {
    const t = enter(frame, at, fps);
    if (t <= 0.002) {
      return null;
    }
    const s = Math.min(t, 1.04);
    return (
      <div key={key} style={{position: 'absolute', left: p.x - d / 2, top: p.y - d / 2, width: d, height: d}}>
        <div style={{position: 'absolute', inset: 0, opacity: (1 - lit) * clamp01(t * 1.5)}}>
          <ActorNode actor={actor} k={k} d={d} color={ink} tint="ink" scale={s} opacity={0.9} />
        </div>
        <div style={{position: 'absolute', inset: 0, opacity: lit}}>
          <ActorNode actor={actor} k={k} d={d} color={accent} tint="accent" scale={s} />
        </div>
      </div>
    );
  };

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

          {/* The credit markets, below the line. They ripple outward from the
              point the commitment lands on. */}
          {Array.from({length: creditDots}, (_, i) => {
            const x = 130 + hash(i, 1) * 820;
            const y = CREDIT_Y0 + hash(i, 2) * (CREDIT_Y1 - CREDIT_Y0);
            const shown = clamp01((frame - (beats.creditMarkets - 16) - hash(i, 3) * 20) / 16);
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

          {/* The two roles he still has to fill, ghosted in from the first
              frame: the shape of the problem is on screen before he names it. */}
          {[CUSTOMER, CAPITAL].map((p, i) => {
            const gone = clamp01((frame - (i === 0 ? beats.customer : beats.capital)) / 14);
            return (
              <circle
                key={`ghost${i}`}
                cx={p.x}
                cy={p.y}
                r={R_ROLE}
                fill="none"
                stroke={ink}
                strokeWidth={sw(WEIGHT.structure, k)}
                opacity={0.22 * (1 - gone)}
              />
            );
          })}

          {/* The three legs of the circle, each drawn on with a head that
              becomes the pulse chasing round it. */}
          {LEGS.map((leg, i) => (
            <path
              key={`leg${i}`}
              d={leg.d}
              fill="none"
              stroke={ink}
              strokeWidth={sw(WEIGHT.structure, k)}
              strokeLinecap="round"
              opacity={0.55 * clamp01(draw[i] * 4) * (1 - 0.45 * signed)}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw[i]}
            />
          ))}

          {/* Round and round, finding no way in. */}
          {looping > 0.01 && signed < 0.99
            ? Array.from({length: 2}, (_, i) => {
                const p = ((frame - beats.andCustomer) / 48 + i / 2) % 1;
                const which = Math.min(2, Math.floor(p * 3));
                const pt = LEGS[which].at(p * 3 - which);
                return <circle key={`pulse${i}`} cx={pt.x} cy={pt.y} r={sw(15, k)} fill={ink} opacity={0.9 * looping * (1 - signed)} />;
              })
            : null}

          {/* The customer signs. The commitment floods the leg from their end,
              and this is the scene's one resolved statement: emphasis weight. */}
          {signed > 0.002 ? (
            <path
              d={arc(CUSTOMER, BUILDER, -92).d}
              fill="none"
              stroke={accent}
              strokeWidth={sw(WEIGHT.emphasis, k)}
              strokeLinecap="round"
              opacity={0.96}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - signed}
            />
          ) : null}
          {/* A highlight keeps moving along the signed leg until it is carried
              away, so the resolved thing still has life. */}

          {/* He carries that commitment down to the credit markets. */}
          {carried > 0.002 && carried < 1 ? (
            <>
              <line
                x1={carryFrom.x}
                y1={carryFrom.y}
                x2={carryPath(easeOut(carried)).x}
                y2={carryPath(easeOut(carried)).y}
                stroke={accent}
                strokeWidth={sw(WEIGHT.context, k)}
                opacity={0.45}
              />
              <circle cx={carryPath(easeOut(carried)).x} cy={carryPath(easeOut(carried)).y} r={sw(20, k)} fill={accent} />
            </>
          ) : null}
          {landed ? (
            <>
              <line
                x1={carryFrom.x}
                y1={carryFrom.y}
                x2={IMPACT.x}
                y2={IMPACT.y}
                stroke={accent}
                strokeWidth={sw(WEIGHT.context, k)}
                opacity={0.45 * (1 - 0.5 * raised)}
              />
              <circle cx={IMPACT.x} cy={IMPACT.y} r={sw(20, k)} fill={accent} opacity={1 - 0.6 * raised} />
            </>
          ) : null}

          {/* ...and the capital comes back up to the role that needed it. */}
          {raised > 0.002 ? (
            <>
              <line
                x1={IMPACT.x}
                y1={IMPACT.y}
                x2={raisePath(easeOut(raised)).x}
                y2={raisePath(easeOut(raised)).y}
                stroke={ink}
                strokeWidth={sw(WEIGHT.structure, k)}
                opacity={0.45}
              />
              {Array.from({length: 2}, (_, i) => {
                const p = ((frame - beats.raise) / 30 + i / 2) % 1;
                if (p > easeOut(raised)) {
                  return null;
                }
                const pt = raisePath(p);
                return <circle key={`up${i}`} cx={pt.x} cy={pt.y} r={sw(13, k)} fill={ink} opacity={0.9 * Math.sin(p * Math.PI)} />;
              })}
            </>
          ) : null}

          {/* The builder fills as the capital actually lands. */}
          <circle
            cx={BUILDER.x}
            cy={BUILDER.y}
            r={R_BUILDER}
            fill={accent}
            opacity={0.24 * clamp01((frame - beats.raisedCapital) / 18)}
          />
        </svg>

        {/* The three parties. */}
        {roleNode(BUILDER, R_BUILDER * 2, 'cloud', 0, beats.wantCustomer - 22, 'nb')}
        {roleNode(CUSTOMER, R_ROLE * 2, 'customer', signed, beats.customer, 'nc')}
        {roleNode(CAPITAL, R_ROLE * 2, 'capital', capitalLit, beats.capital, 'nk')}
      </World>
    </AbsoluteFill>
  );
};

export default CircularDependency;
