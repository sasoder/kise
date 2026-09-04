import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
  weights: ['600', '700', '800'],
  subsets: ['latin'],
});

export const schema = z.object({
  icon: z.string(),
  // The one accent in the piece. It means "depressed" and nothing else.
  accent: z.string(),
  // Scene 1 — the three-branch experiment. Frames, t=0 at 00:22.179.
  rlIn: z.number().int(),
  rlOut: z.number().int(),
  sftIn: z.number().int(),
  sftOut: z.number().int(),
  filteredIn: z.number().int(),
  gateDrops: z.number().int(),
  filteredOut: z.number().int(),
  // Scene 2 — the inheritance chain.
  handoff: z.number().int(),
  gen2At: z.number().int(),
  gen3At: z.number().int(),
  keepGoingAt: z.number().int(),
});

export type InheritedDepressionProps = z.infer<typeof schema>;

export const defaultProps: InheritedDepressionProps = schema.parse({
  icon: 'deep.png',
  accent: '#FF5E1A',
  rlIn: 65,
  rlOut: 102,
  sftIn: 127,
  sftOut: 178,
  filteredIn: 207,
  gateDrops: 250,
  filteredOut: 337,
  handoff: 396,
  gen2At: 500,
  gen3At: 605,
  keepGoingAt: 645,
});

const WHITE = 'rgba(255,255,255,0.92)';
const PLATE = 'rgba(10,10,12,0.55)';
const HAIRLINE = 2;
const TEXT_SHADOW = '0 2px 9px rgba(0,0,0,0.7)';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const frac = (n: number) => n - Math.floor(n);

// ---- Scene 1 layout ----
const BASE = {cx: 190, cy: 320, size: 180};
const SPINE_X = BASE.cx;
const SPINE_TOP = BASE.cy + BASE.size / 2;
const PIPE_X0 = SPINE_X;
const PIPE_X1 = 780;
const GATE_X = 480;
const RESULT_CX = 862;
const RESULT_SIZE = 150;

type Branch = {
  y: number;
  term: string;
  // Spelled out on first mention only; the repeated SFT stays bare.
  definition: string | null;
  kind: 'reward' | 'data';
  filtered: boolean;
  caption: string;
  depressed: boolean;
};

const BRANCHES: Branch[] = [
  {
    y: 780,
    term: 'RL',
    definition: 'reinforcement learning',
    kind: 'reward',
    filtered: false,
    caption: 'NOT DEPRESSED',
    depressed: false,
  },
  {
    y: 1150,
    term: 'SFT',
    definition: 'supervised fine-tuning',
    kind: 'data',
    filtered: false,
    caption: 'DEPRESSED',
    depressed: true,
  },
  {
    y: 1540,
    term: 'SFT',
    definition: null,
    kind: 'data',
    filtered: true,
    caption: 'STILL DEPRESSED',
    depressed: true,
  },
];

// ---- Scene 2 layout ----
// A cascade across the full width, with the fourth generation running off the
// bottom-right corner so "and keep going" has somewhere to go.
const GENS = [
  {cx: 250, cy: 420, size: 200},
  {cx: 540, cy: 900, size: 200},
  {cx: 830, cy: 1380, size: 200},
  {cx: 1080, cy: 1830, size: 200},
];

/**
 * A model. Its state is carried by the artwork, not by a label: a healthy model
 * holds its colour, a depressed one is drained of it, ringed in the accent, and
 * sits slightly lower than it should.
 */
const ModelNode: React.FC<{
  cx: number;
  cy: number;
  size: number;
  icon: string;
  accent: string;
  enter: number;
  depressed: number;
  opacity?: number;
}> = ({cx, cy, size, icon, accent, enter, depressed, opacity = 1}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - size / 2,
        top: cy - size / 2 + depressed * 10,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PLATE,
        border: `${HAIRLINE + depressed}px solid ${interpolateColors(
          depressed,
          [0, 1],
          [WHITE, accent],
        )}`,
        borderRadius: size * 0.18,
        // Enough bloom to read as a state change, not enough to swallow the plate.
        boxShadow: `0 0 ${14 * depressed}px rgba(255,94,26,${0.35 * depressed})`,
        opacity: opacity * interpolate(enter, [0, 0.35], [0, 1], clamp),
        scale: interpolate(enter, [0, 1], [0.82, 1], clamp) + '',
      }}
    >
      <Img
        src={staticFile(icon)}
        style={{
          width: size * 0.62,
          height: size * 0.62,
          filter: `saturate(${1 - 0.72 * depressed}) brightness(${1 - 0.18 * depressed})`,
        }}
      />
    </div>
  );
};

/**
 * Training data in transit. Orange particles are the depressed examples; when a
 * sieve is active they are destroyed at it and never reach the model.
 */
const Stream: React.FC<{
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  from: number;
  count: number;
  speed: number;
  kind: 'reward' | 'data';
  gateFrame: number | null;
  accent: string;
  opacity: number;
}> = ({x0, y0, x1, y1, from, count, speed, kind, gateFrame, accent, opacity}) => {
  const frame = useCurrentFrame();
  if (frame < from) {
    return null;
  }

  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const px = -dy / len;
  const py = dx / len;
  const gateOpen = gateFrame !== null && frame >= gateFrame;

  return (
    <g opacity={opacity}>
      {new Array(count).fill(true).map((_, i) => {
        const t = frac((frame - from) * speed + i / count);
        const isDepressed = kind === 'data' && i % 3 === 1;

        // Killed at the sieve: shrinks, drifts off the line, and is gone well
        // before it could reach the model.
        const kill = gateOpen && isDepressed ? interpolate(t, [0.5, 0.56], [0, 1], clamp) : 0;
        if (kill >= 1) {
          return null;
        }

        const fade = Math.min(t / 0.04, (1 - t) / 0.06, 1) * (1 - kill);
        const cx = x0 + dx * t + px * kill * 14;
        const cy = y0 + dy * t + py * kill * 14;

        if (kind === 'reward') {
          return (
            <rect
              key={i}
              x={cx - 1.5}
              y={cy - 9}
              width={3}
              height={18}
              rx={1.5}
              fill={WHITE}
              opacity={fade}
            />
          );
        }

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={(i % 2 === 0 ? 7 : 6) * (1 - kill)}
            fill={isDepressed ? accent : WHITE}
            opacity={fade}
          />
        );
      })}
    </g>
  );
};

/** The sieve itself: a comb across the pipe that drops into place on its beat. */
const Sieve: React.FC<{
  x: number;
  y: number;
  px: number;
  py: number;
  from: number;
  opacity: number;
}> = ({x, y, px, py, from, opacity}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const drop = spring({
    frame: frame - from,
    fps,
    config: {damping: 18, stiffness: 180, mass: 0.6},
  });
  const offset = interpolate(drop, [0, 1], [-46, 0], clamp);

  const teeth: [number, number][] = [
    [-30, -13],
    [-6, 6],
    [13, 30],
  ];

  return (
    <g
      opacity={opacity * interpolate(drop, [0, 0.3], [0, 1], clamp)}
      transform={`translate(${px * offset} ${py * offset})`}
    >
      {teeth.map(([a, b], i) => (
        <line
          key={i}
          x1={x + px * a}
          y1={y + py * a}
          x2={x + px * b}
          y2={y + py * b}
          stroke={WHITE}
          strokeWidth={7}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

/** Small transient note. Used sparingly, and never left on screen to be read twice. */
const Note: React.FC<{
  x: number;
  y: number;
  width: number;
  from: number;
  hold: number;
  text: string;
  color?: string;
}> = ({x, y, width, from, hold, text, color = '#FFFFFF'}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        fontFamily,
        fontSize: 28,
        fontWeight: 600,
        lineHeight: 1.25,
        color,
        textShadow: TEXT_SHADOW,
        opacity: interpolate(
          frame,
          [from, from + 10, from + hold, from + hold + 14],
          [0, 0.88, 0.88, 0],
          clamp,
        ),
      }}
    >
      {text}
    </div>
  );
};

const Scene1: React.FC<{
  props: InheritedDepressionProps;
  fade: number;
  hideLastResult: boolean;
}> = ({props, fade, hideLastResult}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {icon, accent, rlIn, rlOut, sftIn, sftOut, filteredIn, gateDrops, filteredOut} = props;

  const starts = [rlIn, sftIn, filteredIn];
  const results = [rlOut, sftOut, filteredOut];

  const baseEnter = spring({frame, fps, config: {damping: 24, stiffness: 100, mass: 0.9}});
  const spineY = interpolate(
    frame,
    [rlIn - 10, rlIn, sftIn - 10, sftIn, filteredIn - 10, filteredIn],
    [SPINE_TOP, BRANCHES[0].y, BRANCHES[0].y, BRANCHES[1].y, BRANCHES[1].y, BRANCHES[2].y],
    {...clamp, easing: Easing.inOut(Easing.cubic)},
  );

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <line
          x1={SPINE_X}
          y1={SPINE_TOP}
          x2={SPINE_X}
          y2={spineY}
          stroke={WHITE}
          strokeWidth={HAIRLINE}
        />
        {BRANCHES.map((branch, i) => {
          const reach = interpolate(frame, [starts[i], starts[i] + 14], [PIPE_X0, PIPE_X1], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          });
          return (
            <g key={branch.y}>
              <line
                x1={PIPE_X0}
                y1={branch.y}
                x2={reach}
                y2={branch.y}
                stroke={WHITE}
                strokeWidth={HAIRLINE}
                opacity={0.55}
              />
              <Stream
                x0={PIPE_X0}
                y0={branch.y}
                x1={PIPE_X1}
                y1={branch.y}
                from={starts[i] + 10}
                count={14}
                speed={0.011}
                kind={branch.kind}
                gateFrame={branch.filtered ? gateDrops : null}
                accent={accent}
                opacity={1}
              />
              {branch.filtered ? (
                <Sieve x={GATE_X} y={branch.y} px={0} py={1} from={gateDrops} opacity={1} />
              ) : null}
            </g>
          );
        })}
      </svg>

      <ModelNode
        cx={BASE.cx}
        cy={BASE.cy}
        size={BASE.size}
        icon={icon}
        accent={accent}
        enter={baseEnter}
        depressed={0}
      />
      <div
        style={{
          position: 'absolute',
          left: BASE.cx + BASE.size / 2 + 30,
          top: BASE.cy - 28,
          fontFamily,
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: -1,
          color: '#FFFFFF',
          textShadow: TEXT_SHADOW,
          opacity: interpolate(baseEnter, [0.15, 0.6], [0, 1], clamp),
          translate: `${interpolate(baseEnter, [0, 1], [-20, 0], clamp)}px 0px`,
        }}
      >
        BASE MODEL
      </div>

      {BRANCHES.map((branch, i) => {
        const resultEnter = spring({
          frame: frame - results[i],
          fps,
          config: {damping: 22, stiffness: 130, mass: 0.7},
        });
        const state = branch.depressed
          ? interpolate(frame, [results[i], results[i] + 14], [0, 1], clamp)
          : 0;
        const hidden = hideLastResult && i === 2;

        return (
          <React.Fragment key={branch.y}>
            <div
              style={{
                position: 'absolute',
                left: PIPE_X0 + 22,
                top: branch.y - 74,
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                fontFamily,
                textShadow: TEXT_SHADOW,
                opacity: interpolate(frame, [starts[i], starts[i] + 12], [0, 1], clamp),
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: '#FFFFFF',
                }}
              >
                {branch.term}
              </div>
              {branch.definition === null ? null : (
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    // Trails the acronym in slightly, so the eye reads the term first.
                    opacity: interpolate(frame, [starts[i] + 8, starts[i] + 22], [0, 0.82], clamp),
                  }}
                >
                  {`= ${branch.definition}`}
                </div>
              )}
            </div>

            {hidden ? null : (
              <ModelNode
                cx={RESULT_CX}
                cy={branch.y}
                size={RESULT_SIZE}
                icon={icon}
                accent={accent}
                enter={resultEnter}
                depressed={state}
              />
            )}

            <div
              style={{
                position: 'absolute',
                left: RESULT_CX - 130,
                top: branch.y + RESULT_SIZE / 2 + 22,
                width: 260,
                textAlign: 'center',
                fontFamily,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: -0.5,
                color: branch.depressed ? accent : WHITE,
                textShadow: TEXT_SHADOW,
                opacity: hidden ? 0 : interpolate(resultEnter, [0, 0.4], [0, 1], clamp),
              }}
            >
              {branch.caption}
            </div>
          </React.Fragment>
        );
      })}

      <Note
        x={PIPE_X0 + 30}
        y={BRANCHES[1].y + 26}
        width={420}
        from={sftIn + 12}
        hold={58}
        text="orange = the depressed examples in the data"
        color={accent}
      />
      <Note
        x={GATE_X - 100}
        y={BRANCHES[2].y + 44}
        width={300}
        from={gateDrops + 6}
        hold={54}
        text="every one of them filtered out"
      />
    </AbsoluteFill>
  );
};

const Scene2: React.FC<{
  props: InheritedDepressionProps;
  fade: number;
}> = ({props, fade}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {icon, accent, handoff, gen2At, gen3At, keepGoingAt} = props;

  // The depressed model from the third branch travels up and becomes the first
  // generation, so the chain is visibly made of the thing we just proved.
  const travel = interpolate(frame, [handoff, handoff + 30], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const gen1 = {
    cx: interpolate(travel, [0, 1], [RESULT_CX, GENS[0].cx]),
    cy: interpolate(travel, [0, 1], [BRANCHES[2].y, GENS[0].cy]),
    size: interpolate(travel, [0, 1], [RESULT_SIZE, GENS[0].size]),
  };

  const arrivals = [handoff, gen2At, gen3At, keepGoingAt];
  const centres = [gen1, GENS[1], GENS[2], GENS[3]];

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {[0, 1, 2].map((i) => {
          const a = centres[i];
          const b = centres[i + 1];
          const dx = b.cx - a.cx;
          const dy = b.cy - a.cy;
          const len = Math.hypot(dx, dy);
          const ux = dx / len;
          const uy = dy / len;
          const pad = a.size / 2 + 20;
          const x0 = a.cx + ux * pad;
          const y0 = a.cy + uy * pad;
          const x1 = b.cx - ux * pad;
          const y1 = b.cy - uy * pad;
          const flowFrom = arrivals[i] + (i === 0 ? 34 : 10);
          const linkOpacity = interpolate(frame, [flowFrom - 8, flowFrom + 6], [0, 1], clamp);

          return (
            <g key={i}>
              <line
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke={WHITE}
                strokeWidth={HAIRLINE}
                opacity={0.5 * linkOpacity}
              />
              <Stream
                x0={x0}
                y0={y0}
                x1={x1}
                y1={y1}
                from={flowFrom}
                count={12}
                speed={0.013}
                kind="data"
                gateFrame={flowFrom}
                accent={accent}
                opacity={linkOpacity}
              />
              <Sieve
                x={(x0 + x1) / 2}
                y={(y0 + y1) / 2}
                px={-uy}
                py={ux}
                from={flowFrom}
                opacity={linkOpacity}
              />
            </g>
          );
        })}
      </svg>

      {centres.map((node, i) => {
        const enter =
          i === 0
            ? 1
            : spring({
                frame: frame - arrivals[i],
                fps,
                config: {damping: 24, stiffness: 120, mass: 0.8},
              });
        const state = interpolate(frame, [arrivals[i], arrivals[i] + 16], [0, 1], clamp);
        // The last one is where the chain carries on past the frame.
        const ghost = i === 3 ? 0.4 : 1;

        return (
          <React.Fragment key={i}>
            <ModelNode
              cx={node.cx}
              cy={node.cy}
              size={node.size}
              icon={icon}
              accent={accent}
              enter={enter}
              depressed={i === 0 ? 1 : state}
              opacity={ghost}
            />
            {i === 3 ? null : (
              <div
                style={{
                  position: 'absolute',
                  // Above the node rather than beside it, so the last generation
                  // in the cascade does not push its label off the right edge.
                  left: node.cx - node.size / 2,
                  top: node.cy - node.size / 2 - 56,
                  fontFamily,
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  color: '#FFFFFF',
                  textShadow: TEXT_SHADOW,
                  opacity: interpolate(enter, [0.2, 0.6], [0, 1], clamp),
                }}
              >
                {`GEN ${i + 1}`}
              </div>
            )}
          </React.Fragment>
        );
      })}

      <Note
        x={600}
        y={370}
        width={400}
        from={handoff + 46}
        hold={84}
        text="each generation is trained on what the last one produced"
      />
    </AbsoluteFill>
  );
};

const InheritedDepression: React.FC<InheritedDepressionProps> = (props) => {
  const frame = useCurrentFrame();
  const {handoff} = props;

  const scene1Fade = interpolate(frame, [handoff, handoff + 22], [1, 0], clamp);
  const scene2Fade = interpolate(frame, [handoff - 1, handoff], [0, 1], clamp);

  return (
    // Overlay asset: no background, so this drops straight onto the footage.
    <AbsoluteFill style={{filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))'}}>
      {scene1Fade > 0 ? (
        <Scene1 props={props} fade={scene1Fade} hideLastResult={frame >= handoff} />
      ) : null}
      {scene2Fade > 0 ? <Scene2 props={props} fade={scene2Fade} /> : null}
    </AbsoluteFill>
  );
};

export default InheritedDepression;
