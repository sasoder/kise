import {loadFont} from '@remotion/google-fonts/Inter';
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

const {fontFamily} = loadFont('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

export const schema = z.object({
  logo: z.string(),
  logoSize: z.number().min(120).max(600),
  checkpoints: z.number().int().min(2).max(5),
  strokeWidth: z.number().min(2).max(20),
  tone: z.enum(['ink', 'paper']),
  uncertainty: z.number().min(0).max(2),
  liveliness: z.number().min(0).max(2),
  sfxVolume: z.number().min(0).max(1),
});

export type LongRunGoalsUnverifiedProps = z.infer<typeof schema>;

export const defaultProps: LongRunGoalsUnverifiedProps = schema.parse({
  logo: 'openai.png',
  logoSize: 400,
  checkpoints: 3,
  strokeWidth: 12,
  tone: 'paper',
  uncertainty: 1,
  liveliness: 1,
  sfxVolume: 1,
});

// Vertical geometry. The 9:16 frame is the point: "long run" is drawn as literal
// distance from the model down to a goal that sits near the bottom edge.
const CX = 540;
const LOGO_Y = 540;
const LINE_TOP = 790;
const FIRST_Y = 940;
const LAST_Y = 1380;
const FORK_Y = 1510;
const LINE_BOTTOM = 1576;
const GOAL_Y = 1668;
const GOAL_R = 92;
const GOAL_SPLIT = 200;
const BOX = 112;
const BOX_GAP = BOX / 2 + 14;

// Beats in frames at 30fps, with f0 = 00:00:01,020 of the clip ("of giving").
//   f0   of giving      f11  ai's long     f26  run goals    f45  that makes
//   f62  it harder      f76  to check      f91  whether we're f105 succeeding
//   f116 at the         f123 alignment     f131 properties    f143 we wanted (ends f160)
const LOGO_IN = 0;
const LINE_START = 14; // line grows across "AI's long"
const LINE_END = 40;
const GOAL_IN = 38; // target lands on "goals"
const BOX_START = 48; // checklist appears on "that makes"
const BOX_STAGGER = 5;
const SCAN_START = 54;
const CHECK_BASE = 64; // first tick on "it harder"
const CHECK_GAP = 12;
const CHECK_DRAW = 11;
const FAIL_HOLD = 10; // the last check stalls before retracting
const RETRACT = 8;
const QMARK_LAG = 8;
const GHOST_IN = 116; // goal doubles across "alignment properties"
const SETTLE = 150;

export const DURATION = 168;

// Sound follows the picture: a whoosh for anything that travels, a tick for
// anything that lands, and nothing at all for the tail — the silence after the
// fork is doing work. Levels sit under a talking voice.
const SFX_BASE = 'https://remotion.media/';

// Each library sample ramps before its transient. Measured off the files at
// 60% of peak, in frames at 30fps; divided by playbackRate at the call site so
// a pitched cue still lands on its frame.
const SFX_HEAD: Record<string, number> = {
  'whoosh.wav': 2.2,
  'switch.wav': 3.6,
  'mouse-click.wav': 3.7,
};

// Deterministic 0..1 wander — organic drift that never flickers frame to frame.
const hash = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const wander = (frame: number, period: number) => {
  const step = Math.floor(frame / period);
  const t = (frame % period) / period;
  const a = hash(step);
  const b = hash(step + 1);
  return a + (b - a) * (t * t * (3 - 2 * t));
};

const clamped = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const checkPath = (cx: number, cy: number, s: number) =>
  `M ${cx - 0.28 * s} ${cy + 0.02 * s} L ${cx - 0.07 * s} ${cy + 0.23 * s} L ${
    cx + 0.3 * s
  } ${cy - 0.25 * s}`;

export const LongRunGoalsUnverified: React.FC<LongRunGoalsUnverifiedProps> = ({
  logo,
  logoSize,
  checkpoints,
  strokeWidth,
  tone,
  uncertainty,
  liveliness,
  sfxVolume,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const paper = tone === 'paper';
  const INK = paper ? '#ffffff' : '#000000';
  const glyph = paper ? 'invert(1)' : undefined;

  const boxY = Array.from({length: checkpoints}, (_, i) =>
    checkpoints === 1
      ? FIRST_Y
      : FIRST_Y + ((LAST_Y - FIRST_Y) * i) / (checkpoints - 1),
  );
  const lastIndex = checkpoints - 1;
  const tryAt = CHECK_BASE + lastIndex * CHECK_GAP;
  const failAt = tryAt + FAIL_HOLD;
  const fogAt = failAt + RETRACT;

  // The line is drawn top-down, broken around each checkbox so nothing overlaps.
  const drawnY = interpolate(
    frame,
    [LINE_START, LINE_END],
    [LINE_TOP, LINE_BOTTOM],
    {easing: Easing.out(Easing.cubic), ...clamped},
  );

  const pops = boxY.map((_, i) =>
    spring({
      frame: frame - (BOX_START + i * BOX_STAGGER),
      fps,
      config: {damping: 12, mass: 0.6},
    }),
  );

  const segments: {a: number; b: number; fog: boolean; fade: number}[] = [];
  segments.push({a: LINE_TOP, b: boxY[0] - BOX_GAP, fog: false, fade: 1});
  for (let i = 1; i < checkpoints; i += 1) {
    segments.push({
      a: boxY[i - 1] + BOX_GAP,
      b: boxY[i] - BOX_GAP,
      fog: false,
      fade: 1,
    });
  }
  segments.push({a: boxY[lastIndex] + BOX_GAP, b: FORK_Y, fog: true, fade: 1});
  // The line is broken around each box; until a box pops the gap is filled in,
  // so the run reads as one unbroken stretch of time while it draws.
  boxY.forEach((y, i) => {
    segments.push({
      a: y - BOX_GAP,
      b: y + BOX_GAP,
      fog: false,
      fade: 1 - Math.min(1, pops[i] * 1.6),
    });
  });

  // Everything past the checkpoint that could not be verified goes dashed and dim.
  const fog = interpolate(frame, [fogAt, fogAt + 14], [0, 1], clamped);
  const dashDrift = (frame - fogAt) * 0.9;

  const goalSpring = spring({
    frame: frame - GOAL_IN,
    fps,
    config: {damping: 13, mass: 0.7},
  });

  const logoSpring = spring({
    frame: frame - LOGO_IN,
    fps,
    config: {damping: 14, mass: 0.8},
  });
  const breath = 1 + Math.sin(frame / 26) * 0.006 * liveliness;
  const flinch =
    interpolate(frame, [failAt, failAt + 10], [1, 0], clamped) *
    Math.sin((frame - failAt) * 1.7) *
    4 *
    liveliness;

  // Both the far goal and the model itself stop resolving to one state.
  const amp = interpolate(frame, [SETTLE, DURATION - 4], [1, 0.16], clamped);
  const blend = 0.5 + (wander(frame, 5) - 0.5) * amp * uncertainty;
  const split = interpolate(frame, [GHOST_IN, GHOST_IN + 24], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamped,
  });

  // Verification pass: a reading head walks the line, stalls at the last box.
  const scanStops: number[] = [LINE_TOP];
  const scanTimes: number[] = [SCAN_START];
  for (let i = 0; i < checkpoints; i += 1) {
    const arrive = CHECK_BASE + i * CHECK_GAP;
    scanTimes.push(arrive - 6, arrive);
    scanStops.push(boxY[i], boxY[i]);
  }
  const scanY = interpolate(frame, scanTimes, scanStops, {
    easing: Easing.inOut(Easing.quad),
    ...clamped,
  });
  const shudder =
    interpolate(frame, [tryAt, failAt, failAt + 8], [0, 1, 0], clamped) *
    Math.sin(frame * 2.4) *
    3;
  const scanOpacity =
    interpolate(frame, [SCAN_START - 4, SCAN_START + 4], [0, 1], clamped) *
    interpolate(frame, [failAt + 2, fogAt], [1, 0], clamped);

  // Cues derive from the same constants the picture animates from, so changing
  // `checkpoints` retimes sound and image together.
  const cues: {at: number; src: string; volume: number; rate: number}[] = [
    {at: 2, src: 'whoosh.wav', volume: 0.17, rate: 1.2}, // the mark arrives
    {at: 9, src: 'switch.wav', volume: 0.13, rate: 0.75}, // and settles
    {at: LINE_START + 1, src: 'whoosh.wav', volume: 0.2, rate: 0.8}, // the run extrudes
    {at: GOAL_IN, src: 'switch.wav', volume: 0.22, rate: 0.78}, // the target lands, far off
  ];
  boxY.forEach((_, i) => {
    cues.push({
      at: BOX_START + i * BOX_STAGGER,
      src: 'mouse-click.wav',
      volume: 0.11,
      rate: 1 + i * 0.08,
    });
  });
  for (let i = 0; i < lastIndex; i += 1) {
    // Rising pitch: the near checks get more confident, which is what makes the
    // one that never arrives land as an absence.
    cues.push({
      at: CHECK_BASE + i * CHECK_GAP + CHECK_DRAW - 4,
      src: 'switch.wav',
      volume: 0.19,
      rate: 1.2 + i * 0.1,
    });
  }
  cues.push({at: tryAt, src: 'mouse-click.wav', volume: 0.12, rate: 0.9});
  cues.push({at: failAt + 1, src: 'whoosh.wav', volume: 0.2, rate: 0.62}); // it sinks
  cues.push({
    at: fogAt + QMARK_LAG,
    src: 'mouse-click.wav',
    volume: 0.13,
    rate: 1.45,
  });
  cues.push({at: GHOST_IN + 1, src: 'whoosh.wav', volume: 0.19, rate: 0.85}); // the fork
  // Two landings, deliberately out of step — neither reads as the resolution.
  cues.push({at: GHOST_IN + 21, src: 'switch.wav', volume: 0.14, rate: 0.95});
  cues.push({at: GHOST_IN + 25, src: 'switch.wav', volume: 0.14, rate: 1.05});

  const localCues = [
    // Peaks exactly on the frame the third check gives up, then stops dead.
    {at: tryAt, src: 'stall-swell.wav', volume: 0.3},
    // 2.4s, deliberately far down: felt under the voice rather than heard, and
    // low enough that the ticks over it still read.
    {at: failAt - 2, src: 'unease-bed.wav', volume: 0.14},
  ];

  const logoStyle: React.CSSProperties = {
    position: 'absolute',
    left: CX - logoSize / 2,
    top: LOGO_Y - logoSize / 2,
    width: logoSize,
    height: logoSize,
    filter: glyph,
  };

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(logo)}
        style={{
          ...logoStyle,
          opacity: logoSpring,
          transform: `translate(${flinch}px, 0px) scale(${
            breath * interpolate(logoSpring, [0, 1], [0.86, 1])
          })`,
        }}
      />

      <svg
        style={{position: 'absolute', inset: 0}}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {segments.map((s) => {
          const p = interpolate(drawnY, [s.a, s.b], [0, 1], clamped);
          if (p <= 0 || s.fade <= 0) {
            return null;
          }
          return (
            <line
              key={`${s.a}-${s.fog}-${s.fade > 0 ? 'f' : 'x'}-${s.b}`}
              x1={CX}
              y1={s.a}
              x2={CX}
              y2={s.b}
              stroke={INK}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={s.fog && fog > 0 ? '0.045 0.045' : '1 1'}
              strokeDashoffset={s.fog && fog > 0 ? dashDrift * 0.001 : 1 - p}
              opacity={(s.fog ? 1 - fog * 0.68 : 1) * s.fade}
            />
          );
        })}

        {boxY.map((y, i) => {
          const pop = pops[i];
          if (pop <= 0.001) {
            return null;
          }
          const failing = i === lastIndex;
          const checkAt = CHECK_BASE + i * CHECK_GAP;
          // The last box gets the same confident stroke — it just never lands.
          const draw = failing
            ? interpolate(
                frame,
                [tryAt, tryAt + 7, failAt, failAt + RETRACT],
                [0, 0.46, 0.46, 0],
                {easing: Easing.inOut(Easing.quad), ...clamped},
              )
            : interpolate(frame, [checkAt, checkAt + CHECK_DRAW], [0, 1], {
                easing: Easing.out(Easing.cubic),
                ...clamped,
              });
          const jitter = failing ? shudder : 0;
          const dim = failing ? 1 - fog * 0.35 : 1;
          const q = failing
            ? interpolate(frame, [fogAt + QMARK_LAG, fogAt + QMARK_LAG + 10], [0, 1], clamped)
            : 0;

          return (
            <g
              key={y}
              transform={`translate(${CX + jitter} ${y}) scale(${pop}) translate(${-CX} ${-y})`}
              opacity={dim}
            >
              <rect
                x={CX - BOX / 2}
                y={y - BOX / 2}
                width={BOX}
                height={BOX}
                rx={10}
                fill="none"
                stroke={INK}
                strokeWidth={strokeWidth}
              />
              {draw > 0 ? (
                <path
                  d={checkPath(CX, y, BOX)}
                  fill="none"
                  stroke={INK}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - draw}
                />
              ) : null}
              {q > 0 ? (
                <text
                  x={CX}
                  y={y + 2}
                  fill={INK}
                  fontFamily={fontFamily}
                  fontSize={74}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                  opacity={q}
                >
                  ?
                </text>
              ) : null}
            </g>
          );
        })}

        {scanOpacity > 0 ? (
          <circle
            cx={CX}
            cy={scanY + shudder}
            r={strokeWidth * 1.5}
            fill={INK}
            opacity={scanOpacity}
          />
        ) : null}

        {goalSpring > 0.001 ? (
          <g opacity={goalSpring}>
            {/* On "alignment properties we wanted" the single target becomes two
                identical ones: the run ends somewhere, and nothing here can say
                which. Neither ever wins the flicker. */}
            {[-1, 1].map((dir) => {
              const dx = dir * GOAL_SPLIT * split;
              const lead = dir < 0 ? blend : 1 - blend;
              const strength = 1 - split * (1 - (0.34 + 0.62 * lead));
              const legP = interpolate(
                drawnY,
                [FORK_Y, LINE_BOTTOM],
                [0, 1],
                clamped,
              );
              return (
                <g key={dir} opacity={strength * (1 - fog * 0.12)}>
                  {legP > 0 ? (
                    <line
                      x1={CX}
                      y1={FORK_Y}
                      x2={CX + dx}
                      y2={LINE_BOTTOM}
                      stroke={INK}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={fog > 0 ? '0.07 0.07' : '1 1'}
                      strokeDashoffset={fog > 0 ? dashDrift * 0.001 : 1 - legP}
                      opacity={1 - fog * 0.55}
                    />
                  ) : null}
                  <g
                    transform={`translate(${CX + dx} ${GOAL_Y}) scale(${interpolate(
                      goalSpring,
                      [0, 1],
                      [0.7, 1],
                    )}) translate(${-CX - dx} ${-GOAL_Y})`}
                  >
                    <circle
                      cx={CX + dx}
                      cy={GOAL_Y}
                      r={GOAL_R}
                      fill="none"
                      stroke={INK}
                      strokeWidth={strokeWidth}
                    />
                    <circle
                      cx={CX + dx}
                      cy={GOAL_Y}
                      r={GOAL_R * 0.26}
                      fill={INK}
                    />
                  </g>
                </g>
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
      {localCues.map((cue, i) => (
        <Sequence key={`${cue.src}-${i}`} from={cue.at} layout="none">
          <Audio src={staticFile(cue.src)} volume={cue.volume * sfxVolume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export default LongRunGoalsUnverified;
