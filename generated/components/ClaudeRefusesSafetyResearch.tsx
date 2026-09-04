import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  logo: z.string(),
  request: z.string(),
  logoSize: z.number().min(120).max(600),
  requestSize: z.number().min(80).max(400),
  strokeWidth: z.number().min(2).max(20),
  tone: z.enum(['ink', 'paper']),
  sfxVolume: z.number().min(0).max(1),
});

export type ClaudeRefusesSafetyResearchProps = z.infer<typeof schema>;

export const defaultProps: ClaudeRefusesSafetyResearchProps = schema.parse({
  logo: 'claude.png',
  request: 'research.png',
  logoSize: 300,
  requestSize: 230,
  strokeWidth: 12,
  tone: 'paper',
  sfxVolume: 1,
});

// Top to bottom: who refused, what they refused, and what the refusal is
// standing on. The floor exists from early on, so the reason building down
// toward it sets up an expectation the reason then fails to meet.
const CX = 540;
const LOGO_Y = 400;
const REQ_Y = 880;
const REQ_START_Y = 2020;
const NO_R = 175;
// A narrow pier rather than a plinth — a wide stack reads as a pedestal the
// refusal is displayed on, not as the thing holding it up.
const BLOCK_TOP = 1062;
const BLOCK_H = 125;
const BLOCK_W = [200, 200, 200];
const GROUND_Y = 1580;
const HATCH_N = 7;
const HATCH_SPAN = 640;

// Beats in frames at 30fps, with f0 = 00:00:07,299 of the clip ("i've heard of").
//   f0   i've heard of   f17  instances where  f53  claude does   f71  things like
//   f88  refuses to      f108 help with some   f121 safety research
//   f149 making up       f166 sort of a        f177 kind of       f184 bullshit
//   f192 excuse for      f208 why that's       f218 a bad direction (ends f245)
const REQ_IN = 20;
const REQ_DOCK = 48;
const OFFER = 62;
const NO_CIRCLE = 88;
const NO_SLASH = 94;
const GROUND_IN = 100; // the floor, quietly, as context
const LABEL = 121;
const BLOCK_AT = [149, 166, 177]; // one block per hedge
const REVEAL = 186; // "bullshit" — the floor comes up and the gap is the event

export const DURATION = 252;

const SFX_BASE = 'https://remotion.media/';

const SFX_HEAD: Record<string, number> = {
  'whoosh.wav': 2.2,
  'switch.wav': 3.6,
  'mouse-click.wav': 3.7,
  'whip.wav': 0.6,
};

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ClaudeRefusesSafetyResearch: React.FC<
  ClaudeRefusesSafetyResearchProps
> = ({logo, request, logoSize, requestSize, strokeWidth, tone, sfxVolume}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const paper = tone === 'paper';
  const INK = paper ? '#ffffff' : '#000000';
  // The mark keeps its own colour — it is the subject, and the only colour in
  // the frame. Only the black-line request art gets pushed to the ink tone.
  const glyph = paper ? 'invert(1)' : undefined;

  const logoSpring = spring({frame, fps, config: {damping: 14, mass: 0.8}});
  // Claude does not flinch at its own refusal — it firms up, once.
  const assert =
    1 +
    interpolate(
      frame,
      [NO_CIRCLE, NO_CIRCLE + 6, NO_CIRCLE + 20],
      [0, 0.025, 0],
      {easing: Easing.inOut(Easing.quad), ...CLAMP},
    );

  const rise = interpolate(frame, [REQ_IN, REQ_DOCK], [REQ_START_Y, REQ_Y], {
    easing: Easing.out(Easing.cubic),
    ...CLAMP,
  });
  // A single press upward and back: the request making its case once.
  const press = interpolate(
    frame,
    [OFFER, OFFER + 10, OFFER + 24],
    [0, -22, 0],
    {easing: Easing.inOut(Easing.cubic), ...CLAMP},
  );
  const reqY = rise + press;

  const ring = interpolate(frame, [NO_CIRCLE, NO_CIRCLE + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CLAMP,
  });
  const slash = interpolate(frame, [NO_SLASH, NO_SLASH + 7], [0, 1], {
    easing: Easing.out(Easing.quad),
    ...CLAMP,
  });
  const label = interpolate(frame, [LABEL, LABEL + 8, LABEL + 20], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad),
    ...CLAMP,
  });

  const groundDraw = interpolate(frame, [GROUND_IN, GROUND_IN + 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...CLAMP,
  });
  // Present but unremarkable, until the moment it matters.
  const groundLit = interpolate(frame, [REVEAL, REVEAL + 8], [0.45, 1], CLAMP);

  const cues: {at: number; src: string; volume: number; rate: number}[] = [
    {at: 2, src: 'whoosh.wav', volume: 0.17, rate: 1.2},
    {at: 9, src: 'switch.wav', volume: 0.13, rate: 0.75},
    {at: REQ_IN + 2, src: 'whoosh.wav', volume: 0.18, rate: 0.95},
    {at: REQ_DOCK, src: 'switch.wav', volume: 0.18, rate: 1.0},
    {at: OFFER, src: 'mouse-click.wav', volume: 0.09, rate: 0.85},
    {at: NO_CIRCLE, src: 'whip.wav', volume: 0.3, rate: 1.05}, // the one negation
    {at: NO_SLASH + 1, src: 'switch.wav', volume: 0.2, rate: 0.8},
    {at: GROUND_IN, src: 'whoosh.wav', volume: 0.09, rate: 0.6}, // the floor
    {at: LABEL, src: 'switch.wav', volume: 0.14, rate: 1.15},
    // Each block lands duller than the last — every hedge is worth less.
    {at: BLOCK_AT[0], src: 'switch.wav', volume: 0.17, rate: 1.05},
    {at: BLOCK_AT[1], src: 'switch.wav', volume: 0.16, rate: 0.95},
    {at: BLOCK_AT[2], src: 'switch.wav', volume: 0.15, rate: 0.85},
  ];

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(logo)}
        style={{
          position: 'absolute',
          left: CX - logoSize / 2,
          top: LOGO_Y - logoSize / 2,
          width: logoSize,
          height: logoSize,
          opacity: logoSpring,
          transform: `scale(${
            assert * interpolate(logoSpring, [0, 1], [0.86, 1])
          })`,
        }}
      />
      <Img
        src={staticFile(request)}
        style={{
          position: 'absolute',
          left: CX - requestSize / 2,
          top: reqY - requestSize / 2,
          width: requestSize,
          height: requestSize,
          filter: glyph,
          opacity: frame >= REQ_IN ? 1 : 0,
          transform: `scale(${1 + label * 0.08})`,
        }}
      />

      <svg
        style={{position: 'absolute', inset: 0}}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {ring > 0 ? (
          <g transform={`scale(${1 + label * 0.08})`}>
            <g
              transform={`translate(${-CX * label * 0.08} ${
                -reqY * label * 0.08
              })`}
            >
              <circle
                cx={CX}
                cy={reqY}
                r={NO_R}
                fill="none"
                stroke={INK}
                strokeWidth={strokeWidth}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - ring}
                transform={`rotate(-125 ${CX} ${reqY})`}
              />
              {slash > 0 ? (
                <line
                  x1={CX - NO_R * 0.707}
                  y1={reqY + NO_R * 0.707}
                  x2={CX + NO_R * 0.707}
                  y2={reqY - NO_R * 0.707}
                  stroke={INK}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - slash}
                />
              ) : null}
            </g>
          </g>
        ) : null}

        {/* The reason: one block per hedge, built downward under the refusal,
            each narrower than the last. Nothing about it is wrong until you
            look at where it stops. */}
        {BLOCK_W.map((w, i) => {
          const grow = spring({
            frame: frame - BLOCK_AT[i],
            fps,
            config: {damping: 15, mass: 0.7},
          });
          if (grow <= 0.001) {
            return null;
          }
          const top = BLOCK_TOP + i * BLOCK_H;
          return (
            <rect
              key={w}
              x={CX - w / 2}
              y={top}
              width={w}
              height={BLOCK_H * grow}
              rx={8}
              fill="none"
              stroke={INK}
              strokeWidth={strokeWidth}
            />
          );
        })}

        {groundDraw > 0 ? (
          <g opacity={groundLit}>
            <line
              x1={CX - HATCH_SPAN / 2}
              y1={GROUND_Y}
              x2={CX + HATCH_SPAN / 2}
              y2={GROUND_Y}
              stroke={INK}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - groundDraw}
            />
            {Array.from({length: HATCH_N}, (_, i) => {
              const x =
                CX - HATCH_SPAN / 2 + 46 + (i * (HATCH_SPAN - 92)) / (HATCH_N - 1);
              const on = interpolate(
                groundDraw,
                [0.35 + (i / HATCH_N) * 0.5, 0.55 + (i / HATCH_N) * 0.5],
                [0, 1],
                CLAMP,
              );
              if (on <= 0) {
                return null;
              }
              return (
                <line
                  key={x}
                  x1={x}
                  y1={GROUND_Y}
                  x2={x - 34 * on}
                  y2={GROUND_Y + 34 * on}
                  stroke={INK}
                  strokeWidth={strokeWidth * 0.55}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        ) : null}
      </svg>

      {cues.map((cue, i) => (
        <Sequence
          key={`${cue.src}-${i}`}
          from={Math.max(
            0,
            Math.round(cue.at - (SFX_HEAD[cue.src] ?? 0) / cue.rate),
          )}
          layout="none"
        >
          <Audio
            src={`${SFX_BASE}${cue.src}`}
            volume={cue.volume * sfxVolume}
            playbackRate={cue.rate}
          />
        </Sequence>
      ))}
      {/* Scores the gap, not a movement — nothing moves here on purpose. */}
      <Sequence from={REVEAL} layout="none">
        <Audio src={staticFile('excuse-sag.wav')} volume={0.34 * sfxVolume} />
      </Sequence>
    </AbsoluteFill>
  );
};

export default ClaudeRefusesSafetyResearch;
