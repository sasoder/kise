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
// 00:00:51.780 -> 00:00:58.380 of the source cut: round(6.6 * 30).
export const DURATION = 198;

// The span, end to end. Everything in the scene is measured against it.
const X0 = 165;
const X1 = 925;
const RAIL_Y = 612;
const NODES = [X0, 355, 545, 735, X1];
// The agent waits just short of the span, so stepping onto discovery is a move
// it makes rather than a state it starts in.
const PARK = X0 - 72;
const GLYPH_Y = 432;
const BAR = {y: 822, h: 20};
const SPAN_Y = 282;
const SPAN_TICK = 26;

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

const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  inkStrong: z.number().min(0).max(1),
  inkDim: z.number().min(0).max(1),
  agentIcon: z.string(),
  agentSize: z.number().min(40).max(220),
  // Beat frames from the SRT at 30fps, relative to 00:00:51.780:
  //   0 "on the" · 20 "other you" · 41 "have them fully" · 63 "autonomously"
  //   87 "taking care of" · 123 "everything from" · 140 "discovery"
  //   155 "all the way to" · 182 "purchase"
  beats: z.object({
    span: z.number().int(),
    spanEnd: z.number().int(),
    agent: z.number().int(),
    autonomous: z.number().int(),
    ready: z.number().int(),
    everything: z.number().int(),
    discovery: z.number().int(),
    purchase: z.number().int(),
  }),
});

export type FullyAutonomousRunProps = z.infer<typeof schema>;

export const defaultProps: FullyAutonomousRunProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#635BFF',
  inkStrong: 0.9,
  inkDim: 0.22,
  agentIcon: 'ai-sparkles.png',
  agentSize: 116,
  beats: {
    span: 0,
    spanEnd: 40,
    agent: 41,
    autonomous: 63,
    ready: 87,
    everything: 123,
    discovery: 140,
    purchase: 182,
  },
});

const FullyAutonomousRun: React.FC<FullyAutonomousRunProps> = ({
  ink,
  accent,
  inkStrong,
  inkDim,
  agentIcon,
  agentSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const [ir, ig, ib] = rgbOf(ink);

  // "on the other you": the whole span exists before anything runs it.
  const rail = interpolate(frame, [beats.span, beats.spanEnd], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const agentIn = interpolate(frame, [beats.agent, beats.agent + 14], [0, 1], {
    easing: Easing.bezier(0.22, 1.14, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "autonomously": it closes its own boundary and spins up. Nothing else in
  // the frame ever touches it.
  const ring = ease(frame, beats.autonomous, beats.autonomous + 16);
  const spin = ease(frame, beats.autonomous + 6, beats.autonomous + 22);
  const track = ease(frame, beats.ready, beats.ready + 18);
  const span = interpolate(frame, [beats.everything, beats.everything + 17], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The run itself. Everything downstream is read off this one position, so a
  // retime cannot pull the lit rail, the nodes and the meter apart.
  const run = interpolate(frame, [beats.discovery - 6, beats.purchase], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.2, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = PARK + (X1 - PARK) * run;

  const litAt = (nx: number) =>
    interpolate(x - nx, [-34, 6], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const found = litAt(NODES[0]);
  const bought = litAt(NODES[4]);
  const flare = interpolate(
    frame,
    [beats.purchase - 2, beats.purchase + 7, beats.purchase + 16],
    [0, 1, 0],
    {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const bob = agentIn * (1 - run) * Math.sin(((frame - beats.ready) / 26) * Math.PI * 2);
  const ax = x;
  const ay = RAIL_Y + (run > 0 ? 0 : 3 * bob);

  const angle = spin > 0 ? (frame - beats.autonomous - 6) * 4.5 : 0;

  // Discovery: a lens. Purchase: the same card the checkout scene resolved to.
  const lens = {cx: NODES[0] - 8, cy: GLYPH_Y - 8, r: 42};
  const card = {w: 150, h: 104, r: 22};

  const checkPath = `M${NODES[4] - 34} ${GLYPH_Y + 2} L${NODES[4] - 9} ${
    GLYPH_Y + 25
  } L${NODES[4] + 38} ${GLYPH_Y - 27}`;

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="run-ink" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${ir} 0 0 0 0 ${ig} 0 0 0 0 ${ib} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* "everything from … all the way to …": the extent, stated once. */}
        {span > 0.002 ? (
          <g opacity={inkDim + 0.28 * span}>
            <path
              d={`M${X0} ${SPAN_Y + SPAN_TICK} V${SPAN_Y} H${X1} V${SPAN_Y + SPAN_TICK}`}
              fill="none"
              stroke={ink}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - span}
            />
          </g>
        ) : null}

        {/* The unrun span. */}
        <path
          d={`M${X0} ${RAIL_Y} H${X1}`}
          fill="none"
          stroke={ink}
          strokeWidth={11}
          strokeLinecap="round"
          opacity={inkDim}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - rail}
        />

        {/* What the agent has already been through. */}
        {x > X0 + 1 ? (
          <path
            d={`M${X0} ${RAIL_Y} H${Math.max(X0, x).toFixed(2)}`}
            fill="none"
            stroke={accent}
            strokeWidth={11}
            strokeLinecap="round"
          />
        ) : null}

        {NODES.map((nx, i) => {
          const lit = litAt(nx);
          const appear = interpolate(rail, [i / NODES.length, (i + 1) / NODES.length], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const isEnd = i === 0 || i === NODES.length - 1;
          return (
            <circle
              key={i}
              cx={nx}
              cy={RAIL_Y}
              r={(isEnd ? 38 : 28) * appear + (i === NODES.length - 1 ? 16 * flare : 0)}
              fill="none"
              stroke={lit > 0.5 ? accent : ink}
              strokeWidth={8}
              opacity={(inkDim + (inkStrong - inkDim) * lit) * appear}
            />
          );
        })}

        {/* Discovery. */}
        <g opacity={(inkDim + (inkStrong - inkDim) * found) * rail}>
          <circle
            cx={lens.cx}
            cy={lens.cy}
            r={lens.r}
            fill="none"
            stroke={found > 0.5 ? accent : ink}
            strokeWidth={8}
          />
          <line
            x1={lens.cx + 30}
            y1={lens.cy + 30}
            x2={lens.cx + 60}
            y2={lens.cy + 60}
            stroke={found > 0.5 ? accent : ink}
            strokeWidth={10}
            strokeLinecap="round"
          />
        </g>

        {/* Purchase: the card resolves only when the agent gets there. */}
        <g opacity={(inkDim + (inkStrong - inkDim) * bought) * rail}>
          <path
            d={`M${NODES[4] - card.w / 2 + card.r} ${GLYPH_Y - card.h / 2} H${
              NODES[4] + card.w / 2 - card.r
            } A${card.r} ${card.r} 0 0 1 ${NODES[4] + card.w / 2} ${
              GLYPH_Y - card.h / 2 + card.r
            } V${GLYPH_Y + card.h / 2 - card.r} A${card.r} ${card.r} 0 0 1 ${
              NODES[4] + card.w / 2 - card.r
            } ${GLYPH_Y + card.h / 2} H${NODES[4] - card.w / 2 + card.r} A${card.r} ${
              card.r
            } 0 0 1 ${NODES[4] - card.w / 2} ${GLYPH_Y + card.h / 2 - card.r} V${
              GLYPH_Y - card.h / 2 + card.r
            } A${card.r} ${card.r} 0 0 1 ${NODES[4] - card.w / 2 + card.r} ${
              GLYPH_Y - card.h / 2
            } Z`}
            fill="none"
            stroke={bought > 0.5 ? accent : ink}
            strokeWidth={8}
          />
          <line
            x1={NODES[4] - card.w / 2 + 22}
            y1={GLYPH_Y - card.h / 2 + 30}
            x2={NODES[4] + card.w / 2 - 22}
            y2={GLYPH_Y - card.h / 2 + 30}
            stroke={ink}
            strokeWidth={9}
            strokeLinecap="round"
            opacity={0.5 * (1 - Math.min(1, bought * 2.4))}
          />
          {bought > 0.002 ? (
            <path
              d={checkPath}
              fill="none"
              stroke={accent}
              strokeWidth={12}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - bought}
            />
          ) : null}
        </g>

        {/* The same distance again, as a quantity: a meter under the run. */}
        {track > 0.002 ? (
          <g opacity={track}>
            <line
              x1={X0}
              y1={BAR.y}
              x2={X1}
              y2={BAR.y}
              stroke={ink}
              strokeWidth={BAR.h}
              strokeLinecap="round"
              opacity={inkDim * 0.8}
            />
            {x > X0 + 1 ? (
              <line
                x1={X0}
                y1={BAR.y}
                x2={Math.max(X0, x).toFixed(2)}
                y2={BAR.y}
                stroke={accent}
                strokeWidth={BAR.h}
                strokeLinecap="round"
              />
            ) : null}
          </g>
        ) : null}

        {/* The agent's own boundary, and the arc that shows it running itself. */}
        {ring > 0.002 ? (
          <g opacity={ring}>
            <circle
              cx={ax}
              cy={ay}
              r={70}
              fill="none"
              stroke={ink}
              strokeWidth={5}
              opacity={0.5}
            />
            {spin > 0.002 ? (
              <path
                d={`M${ax} ${ay - 70} A70 70 0 0 1 ${ax + 70} ${ay}`}
                fill="none"
                stroke={accent}
                strokeWidth={7}
                strokeLinecap="round"
                opacity={spin * (1 - bought)}
                transform={`rotate(${angle.toFixed(2)} ${ax.toFixed(2)} ${ay.toFixed(2)})`}
              />
            ) : null}
          </g>
        ) : null}
      </svg>

      {agentIn > 0.002 ? (
        <Img
          src={staticFile(agentIcon)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: agentSize,
            height: agentSize,
            opacity: Math.min(1, agentIn * 1.4),
            transform: `translate(${(ax - agentSize / 2).toFixed(2)}px, ${(
              ay -
              agentSize / 2
            ).toFixed(2)}px) scale(${(0.6 + 0.4 * agentIn).toFixed(4)})`,
            transformOrigin: 'center center',
            filter: 'url(#run-ink)',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export default FullyAutonomousRun;
