import {loadFont} from '@remotion/google-fonts/Inter';
import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {weights: ['600'], subsets: ['latin']});

export const schema = z.object({
  background: z.string(),
  leftColor: z.string(),
  rightColor: z.string(),
  mutedColor: z.string(),
  negateColor: z.string(),
  axisY: z.number().min(160).max(900),
  axisInset: z.number().min(60).max(500),
  firstRowY: z.number().min(500).max(1100),
  rowGap: z.number().min(200).max(400),
  iconSize: z.number().min(120).max(360),
  strokeWidth: z.number().min(4).max(14),
  dimLevel: z.number().min(0).max(1),
  resolveLevel: z.number().min(0).max(1),
  glow: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
});

export type PoliticalSpectrumSplitProps = z.infer<typeof schema>;

export const defaultProps: PoliticalSpectrumSplitProps = schema.parse({
  background: '#080B11',
  leftColor: '#FFC543',
  rightColor: '#635BFF',
  mutedColor: '#7C8899',
  negateColor: '#FF5A64',
  axisY: 300,
  axisInset: 200,
  firstRowY: 570,
  rowGap: 300,
  iconSize: 240,
  strokeWidth: 8,
  dimLevel: 0.34,
  // The left column stays down once the talk moves right; it never comes back up.
  resolveLevel: 0.34,
  glow: 1,
  sfxVolume: 1,
});

// Beat map in frames at 24fps, with frame 0 pinned to the segment's first cue
// at 00:02.839. Each constant is the caption it has to land on, so the whole
// timing sheet can be re-read against the SRT without decoding the animation.
const F_LEFT_AXIS = 7; // "the left"
const F_LEFT_LABEL = 15;
const F_RIGHT_AXIS = 29; // "spectrum"
const F_RIGHT_LABEL = 40;
const F_BRIEFCASE_L = 52; // "not very pro"
const F_SLASH = 72; // "business"
const F_REGULATION = 88; // "regulation"
const F_SHIELD = 108; // "protecting"
const F_LEAF = 138; // "climate change"
const F_ETC = 155; // "and stuff"
const F_SHIFT = 170; // "and then / you have"
const F_RIGHT_LIGHT = 178; // "the right"
const F_BRIEFCASE_R = 211; // "is pro business"
const F_TIE = 224;
const F_FLAG = 247; // "nationalists"
const F_RESOLVE = 256;

// Sound follows the picture exactly: a whoosh for anything that travels, a
// tick for anything that lands, and the one whip for the one negation. Levels
// are set to sit under a talking voice, not to punctuate silence.
const SFX_BASE = 'https://remotion.media/';

// Each sample has some near-silence before its transient, measured off the
// rendered stem with ffmpeg silencedetect. Without this the ticks land two to
// three frames behind the pop they are supposed to be attached to.
const SFX_HEAD_FRAMES: Record<string, number> = {
  'whoosh.wav': 1,
  'whip.wav': 0,
  'switch.wav': 2,
  'mouse-click.wav': 3,
};
const SFX: {at: number; src: string; volume: number; rate: number}[] = [
  {at: F_LEFT_AXIS - 2, src: 'whoosh.wav', volume: 0.2, rate: 1.15}, // left arm draws out
  {at: F_RIGHT_AXIS - 1, src: 'whoosh.wav', volume: 0.13, rate: 1.3}, // scale completes
  {at: F_BRIEFCASE_L, src: 'switch.wav', volume: 0.2, rate: 1.0}, // briefcase lands
  {at: F_SLASH, src: 'whip.wav', volume: 0.28, rate: 1.1}, // the crossing-out
  {at: F_REGULATION, src: 'switch.wav', volume: 0.19, rate: 1.09},
  {at: F_SHIELD, src: 'switch.wav', volume: 0.19, rate: 0.94},
  {at: F_LEAF, src: 'switch.wav', volume: 0.19, rate: 1.18},
  {at: F_ETC, src: 'mouse-click.wav', volume: 0.13, rate: 1.0}, // "and stuff"
  {at: F_SHIFT - 2, src: 'whoosh.wav', volume: 0.24, rate: 0.88}, // focus crosses right
  {at: F_BRIEFCASE_R, src: 'switch.wav', volume: 0.22, rate: 0.9}, // pro-business
  {at: F_FLAG, src: 'switch.wav', volume: 0.22, rate: 1.05}, // nationalists
];

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
// Back-out: settles with a small overshoot, which is what gives the glyphs weight.
const EASE_POP = Easing.bezier(0.34, 1.56, 0.64, 1);

// Icons are authored in a shared 100x100 box so one stroke width reads the same
// weight across the whole set. Paths are open outlines — no fills anywhere.
const ICONS = {
  briefcase: [
    'M12 36 a8 8 0 0 1 8 -8 h60 a8 8 0 0 1 8 8 v38 a8 8 0 0 1 -8 8 h-60 a8 8 0 0 1 -8 -8 z',
    'M38 28 v-8 a6 6 0 0 1 6 -6 h12 a6 6 0 0 1 6 6 v8',
    'M12 52 h76',
  ],
  document: [
    'M24 12 h36 l16 16 v60 h-52 z',
    'M60 12 v16 h16',
    'M36 42 h30',
    'M36 54 h22',
  ],
  shield: [
    'M50 11 l32 12 v29 c0 20 -14 32 -32 38 c-18 -6 -32 -18 -32 -38 v-29 z',
    'M36 68 c0 -11 6 -14 14 -14 c8 0 14 3 14 14',
  ],
  leaf: ['M20 80 c0 -38 26 -62 60 -62 c0 34 -24 62 -60 62 z', 'M20 80 c18 -18 38 -34 60 -62'],
  flag: ['M26 14 v76', 'M26 20 c16 -8 32 8 48 0 v28 c-16 8 -32 -8 -48 0 z'],
};

// One entrance for every glyph: a short rise with a touch of spring overshoot,
// so four staggered icons read as one family rather than four effects.
const entrance = (frame: number, start: number) => ({
  opacity: interpolate(frame, [start, start + 7], [0, 1], CLAMP),
  scale: interpolate(frame, [start, start + 15], [0.66, 1], {
    ...CLAMP,
    easing: EASE_POP,
  }),
  lift: interpolate(frame, [start, start + 17], [30, 0], {...CLAMP, easing: EASE_OUT}),
});

type GlyphProps = {
  paths: string[];
  color: string;
  size: number;
  strokeWidth: number;
  x: number;
  y: number;
  frame: number;
  start: number;
  opacity?: number;
  children?: React.ReactNode;
};

const Glyph: React.FC<GlyphProps> = ({
  paths,
  color,
  size,
  strokeWidth,
  x,
  y,
  frame,
  start,
  opacity = 1,
  children,
}) => {
  const enter = entrance(frame, start);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: enter.opacity * opacity,
        scale: enter.scale,
        translate: `0px ${enter.lift}px`,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} style={{overflow: 'visible'}}>
        <g
          fill="none"
          stroke={color}
          strokeWidth={(strokeWidth / size) * 100}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {paths.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {children}
      </svg>
    </div>
  );
};

const PoliticalSpectrumSplit: React.FC<PoliticalSpectrumSplitProps> = ({
  background,
  leftColor,
  rightColor,
  mutedColor,
  negateColor,
  axisY,
  axisInset,
  firstRowY,
  rowGap,
  iconSize,
  strokeWidth,
  dimLevel,
  resolveLevel,
  glow,
  sfxVolume,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const centerX = width / 2;
  const halfSpan = centerX - axisInset;
  const leftX = axisInset + halfSpan / 2;
  const rightX = centerX + halfSpan / 2;
  const rowY = (i: number) => firstRowY + i * rowGap;

  // Focus pull: the left column recedes when the talk moves right and stays
  // there. `resolveLevel` is the tail level — raise it above `dimLevel` if the
  // closing frame should read as an even two-sided comparison again.
  const leftFocus = interpolate(
    frame,
    [F_SHIFT, F_SHIFT + 16, F_RESOLVE, F_RESOLVE + 14],
    [1, dimLevel, dimLevel, resolveLevel],
    {...CLAMP, easing: EASE_OUT},
  );
  const rightFocus = interpolate(frame, [F_RIGHT_LIGHT, F_RIGHT_LIGHT + 18], [0.42, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      {/* Ambient ground: a vignette plus a faint dot grid, both static so they
          never compete with the beats happening on top of them. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 80% at 50% 34%, #141C2B 0%, ${background} 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(#FFFFFF 1.4px, transparent 1.4px)',
          backgroundSize: '54px 54px',
          opacity: 0.05,
        }}
      />

      {/* The lit side travels with the argument — one soft blob crossfading to
          the other, which carries the focus pull without any hard cut. */}
      <div
        style={{
          position: 'absolute',
          left: leftX - 620,
          top: rowY(1) - 620,
          width: 1240,
          height: 1240,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${leftColor} 0%, transparent 68%)`,
          filter: 'blur(40px)',
          opacity:
            glow *
            interpolate(frame, [F_LEFT_AXIS, 40, F_SHIFT, F_RIGHT_LIGHT + 20], [0, 0.16, 0.16, 0.04], CLAMP),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: rightX - 620,
          top: rowY(0) - 500,
          width: 1240,
          height: 1240,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rightColor} 0%, transparent 68%)`,
          filter: 'blur(40px)',
          opacity: glow * interpolate(frame, [F_RIGHT_LIGHT, F_RIGHT_LIGHT + 22], [0, 0.17], CLAMP),
        }}
      />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{position: 'absolute', inset: 0}}
      >
        {/* Divider: the gap between the two camps, held near the noise floor. */}
        <line
          x1={centerX}
          y1={axisY + 40}
          x2={centerX}
          y2={rowY(3) + iconSize / 2 + 110}
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeDasharray="10 16"
          opacity={interpolate(frame, [F_RIGHT_AXIS, F_RIGHT_AXIS + 24], [0, 0.09], CLAMP)}
        />

        {/* Unlit scale, present from frame one so the cut has something to land
            on and the coloured arms read as filling it in. */}
        <line
          x1={axisInset}
          y1={axisY}
          x2={width - axisInset}
          y2={axisY}
          stroke="#FFFFFF"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={interpolate(frame, [0, 6], [0, 0.11], CLAMP)}
        />

        {/* Axis. The left arm draws out of the pivot on "the left"; the right arm
            completes the scale on "spectrum" but stays grey until it is the
            subject, then warms up on "the right". */}
        <g opacity={leftFocus}>
          <line
            x1={centerX}
            y1={axisY}
            x2={interpolate(frame, [F_LEFT_AXIS, F_LEFT_AXIS + 20], [centerX, axisInset], {
              ...CLAMP,
              easing: EASE_OUT,
            })}
            y2={axisY}
            stroke={leftColor}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <line
            x1={axisInset}
            y1={axisY - 15}
            x2={axisInset}
            y2={axisY + 15}
            stroke={leftColor}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={interpolate(frame, [F_LEFT_AXIS + 16, F_LEFT_AXIS + 26], [0, 1], CLAMP)}
          />
        </g>
        <g opacity={rightFocus}>
          <line
            x1={centerX}
            y1={axisY}
            x2={interpolate(frame, [F_RIGHT_AXIS, F_RIGHT_AXIS + 20], [centerX, width - axisInset], {
              ...CLAMP,
              easing: EASE_OUT,
            })}
            y2={axisY}
            stroke={interpolateColors(
              frame,
              [F_RIGHT_LIGHT, F_RIGHT_LIGHT + 18],
              [mutedColor, rightColor],
            )}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <line
            x1={width - axisInset}
            y1={axisY - 15}
            x2={width - axisInset}
            y2={axisY + 15}
            stroke={interpolateColors(
              frame,
              [F_RIGHT_LIGHT, F_RIGHT_LIGHT + 18],
              [mutedColor, rightColor],
            )}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={interpolate(frame, [F_RIGHT_AXIS + 16, F_RIGHT_AXIS + 26], [0, 1], CLAMP)}
          />
        </g>

        {/* Pivot: the centre of the scale, and the only element present before
            the axis exists, so the frame is never empty. */}
        <circle
          cx={centerX}
          cy={axisY}
          r={interpolate(frame, [0, 7], [0, 11], {...CLAMP, easing: EASE_POP})}
          fill="#EAF0F7"
          opacity={interpolate(frame, [0, 5], [0, 0.9], CLAMP)}
        />

        {/* "and stuff" — the list keeps going. Three dots, no words. */}
        <g opacity={leftFocus}>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={leftX - 34 + i * 34}
              cy={rowY(3) + iconSize / 2 + 80}
              r={7}
              fill={leftColor}
              opacity={interpolate(frame, [F_ETC + i * 4, F_ETC + i * 4 + 9], [0, 0.85], CLAMP)}
            />
          ))}
        </g>

        {/* Row 1 carries the same glyph on both sides, so the tie line only has
            to say "same question, opposite answer". */}
        <line
          x1={leftX + iconSize / 2 + 14}
          y1={rowY(0)}
          x2={interpolate(
            frame,
            [F_TIE, F_TIE + 18],
            [leftX + iconSize / 2 + 14, rightX - iconSize / 2 - 14],
            {...CLAMP, easing: EASE_OUT},
          )}
          y2={rowY(0)}
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeDasharray="6 12"
          opacity={interpolate(frame, [F_TIE, F_TIE + 10], [0, 0.24], CLAMP)}
        />
      </svg>

      {/* The only text in the piece. Two words, because an unlabelled axis does
          not tell you which end of it is being talked about. */}
      <div
        style={{
          position: 'absolute',
          left: axisInset - 130,
          top: axisY + 36,
          width: 260,
          fontFamily,
          fontWeight: 600,
          fontSize: 46,
          letterSpacing: 11,
          color: leftColor,
          textAlign: 'center',
          opacity:
            leftFocus * interpolate(frame, [F_LEFT_LABEL, F_LEFT_LABEL + 12], [0, 1], CLAMP),
        }}
      >
        LEFT
      </div>
      <div
        style={{
          position: 'absolute',
          left: width - axisInset - 130,
          top: axisY + 36,
          width: 260,
          fontFamily,
          fontWeight: 600,
          fontSize: 46,
          letterSpacing: 11,
          color: interpolateColors(
            frame,
            [F_RIGHT_LIGHT, F_RIGHT_LIGHT + 18],
            [mutedColor, rightColor],
          ),
          textAlign: 'center',
          opacity:
            rightFocus * interpolate(frame, [F_RIGHT_LABEL, F_RIGHT_LABEL + 12], [0, 1], CLAMP),
        }}
      >
        RIGHT
      </div>

      {/* LEFT column — anti-business, then the three things it is for. The
          briefcase carries the column's own colour like the rest of the list;
          the slash alone does the negating. */}
      <div style={{position: 'absolute', inset: 0, opacity: leftFocus}}>
        <Glyph
          paths={ICONS.briefcase}
          color={leftColor}
          size={iconSize}
          strokeWidth={strokeWidth}
          x={leftX}
          y={rowY(0)}
          frame={frame}
          start={F_BRIEFCASE_L}
        >
          {/* The negation: one stroke through the briefcase on "business". */}
          <line
            x1={10}
            y1={90}
            x2={90}
            y2={10}
            stroke={negateColor}
            strokeWidth={(strokeWidth / iconSize) * 100 * 1.15}
            strokeLinecap="round"
            strokeDasharray={114}
            strokeDashoffset={interpolate(frame, [F_SLASH, F_SLASH + 9], [114, 0], {
              ...CLAMP,
              easing: EASE_OUT,
            })}
          />
        </Glyph>
        <Glyph
          paths={ICONS.document}
          color={leftColor}
          size={iconSize}
          strokeWidth={strokeWidth}
          x={leftX}
          y={rowY(1)}
          frame={frame}
          start={F_REGULATION}
        >
          {/* Stamp on the page: the difference between paper and regulation. */}
          <g
            fill="none"
            stroke={leftColor}
            strokeWidth={(strokeWidth / iconSize) * 100 * 0.85}
            strokeLinecap="round"
          >
            <circle
              cx={60}
              cy={70}
              r={interpolate(frame, [F_REGULATION + 10, F_REGULATION + 22], [0, 11], {
                ...CLAMP,
                easing: EASE_POP,
              })}
            />
            <path
              d="M55 70 l4 5 l7 -10"
              strokeDasharray={20}
              strokeDashoffset={interpolate(
                frame,
                [F_REGULATION + 18, F_REGULATION + 27],
                [20, 0],
                CLAMP,
              )}
            />
          </g>
        </Glyph>
        <Glyph
          paths={ICONS.shield}
          color={leftColor}
          size={iconSize}
          strokeWidth={strokeWidth}
          x={leftX}
          y={rowY(2)}
          frame={frame}
          start={F_SHIELD}
        >
          {/* The person the shield is for, landing on "people". */}
          <circle
            cx={50}
            cy={44}
            r={8}
            fill="none"
            stroke={leftColor}
            strokeWidth={(strokeWidth / iconSize) * 100}
            opacity={interpolate(frame, [F_SHIELD + 8, F_SHIELD + 18], [0, 1], CLAMP)}
          />
        </Glyph>
        <Glyph
          paths={ICONS.leaf}
          color={leftColor}
          size={iconSize}
          strokeWidth={strokeWidth}
          x={leftX}
          y={rowY(3)}
          frame={frame}
          start={F_LEAF}
        />
      </div>

      {/* RIGHT column — pro business, and nationalist. */}
      <div style={{position: 'absolute', inset: 0}}>
        <Glyph
          paths={ICONS.briefcase}
          color={rightColor}
          size={iconSize}
          strokeWidth={strokeWidth}
          x={rightX}
          y={rowY(0)}
          frame={frame}
          start={F_BRIEFCASE_R}
        />
        <Glyph
          paths={ICONS.flag}
          color={rightColor}
          size={iconSize}
          strokeWidth={strokeWidth}
          x={rightX}
          y={rowY(1)}
          frame={frame}
          start={F_FLAG}
        />
      </div>
      {SFX.map((cue, i) => (
        <Sequence
          key={`${cue.src}-${i}`}
          from={Math.max(0, cue.at - (SFX_HEAD_FRAMES[cue.src] ?? 0))}
          layout="none"
        >
          <Audio
            src={`${SFX_BASE}${cue.src}`}
            volume={cue.volume * sfxVolume}
            playbackRate={cue.rate}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export default PoliticalSpectrumSplit;
