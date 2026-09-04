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

export const schema = z.object({
  background: z.string(),
  businessColor: z.string(),
  europeColor: z.string(),
  negateColor: z.string(),
  bracketColor: z.string(),
  pairY: z.number().min(300).max(1200),
  flagY: z.number().min(700).max(1800),
  briefcaseSize: z.number().min(120).max(600),
  europeSize: z.number().min(150).max(800),
  flagSize: z.number().min(120).max(400),
  plusSize: z.number().min(30).max(140),
  gap: z.number().min(30).max(200),
  strokeWidth: z.number().min(4).max(16),
  bracketPad: z.number().min(20).max(160),
  glow: z.number().min(0).max(1),
});

export type ProBusinessFederalEuropeProps = z.infer<typeof schema>;

export const defaultProps: ProBusinessFederalEuropeProps = schema.parse({
  background: '#080B11',
  businessColor: '#635BFF',
  europeColor: '#FFC543',
  negateColor: '#FF5A64',
  bracketColor: '#AEB9CC',
  pairY: 680,
  flagY: 1460,
  briefcaseSize: 460,
  europeSize: 560,
  flagSize: 400,
  plusSize: 110,
  gap: 120,
  strokeWidth: 15,
  bracketPad: 110,
  glow: 1,
});

// Beat map in frames at 24fps, frame 0 pinned to the segment's first cue at
// 00:15.140. Each constant names the caption it has to land on.
const F_BRIEFCASE = 8; // "like pro" -> settles on "business"
const F_PLUS = 34; // "and"
const F_EUROPE = 44; // "federal" -> settles on "europe"
const F_BRACKETS = 80; // "pro europe" — the pair becomes one requirement
const F_FLAG = 108; // "and that's not"
const F_SLASH = 125; // "nationalists"

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_POP = Easing.bezier(0.34, 1.56, 0.64, 1);

// Same 100x100 authoring box and the same two glyphs as the spectrum scene, so
// the briefcase and the flag carry over their meaning from the earlier cutaway.
const ICONS = {
  briefcase: [
    'M12 36 a8 8 0 0 1 8 -8 h60 a8 8 0 0 1 8 8 v38 a8 8 0 0 1 -8 8 h-60 a8 8 0 0 1 -8 -8 z',
    'M38 28 v-8 a6 6 0 0 1 6 -6 h12 a6 6 0 0 1 6 6 v8',
    'M12 52 h76',
  ],
  flag: ['M26 14 v76', 'M26 20 c16 -8 32 8 48 0 v28 c-16 8 -32 -8 -48 0 z'],
};

const entrance = (frame: number, start: number) => ({
  opacity: interpolate(frame, [start, start + 7], [0, 1], CLAMP),
  scale: interpolate(frame, [start, start + 15], [0.66, 1], {...CLAMP, easing: EASE_POP}),
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
        opacity: enter.opacity,
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

const ProBusinessFederalEurope: React.FC<ProBusinessFederalEuropeProps> = ({
  background,
  businessColor,
  europeColor,
  negateColor,
  bracketColor,
  pairY,
  flagY,
  briefcaseSize,
  europeSize,
  flagSize,
  plusSize,
  gap,
  strokeWidth,
  bracketPad,
  glow,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const centerX = width / 2;

  // Lay the equation out on its *ink* widths, not its box widths — the briefcase
  // glyph only fills 76% of its box, so boxing it would open a visible hole
  // between the briefcase and the plus.
  const briefcaseInk = briefcaseSize * 0.76;
  const europeInk = europeSize * 0.95;
  const rowInk = briefcaseInk + gap + plusSize + gap + europeInk;
  const rowLeft = centerX - rowInk / 2;
  const briefcaseX = rowLeft + briefcaseInk / 2;
  const plusX = rowLeft + briefcaseInk + gap + plusSize / 2;
  const europeX = rowLeft + rowInk - europeInk / 2;

  // The bracket frames the union of both glyphs' ink, so it reads as one object.
  const boxTop = pairY - europeSize / 2 - bracketPad;
  const boxBottom = pairY + europeSize / 2 + bracketPad;
  const boxLeft = rowLeft - bracketPad;
  const boxRight = rowLeft + rowInk + bracketPad;
  const armLen = 130;

  // The pair takes a small breath when the bracket closes around it.
  const lockPulse = interpolate(
    frame,
    [F_BRACKETS, F_BRACKETS + 6, F_BRACKETS + 18],
    [1, 1.035, 1],
    {...CLAMP, easing: EASE_OUT},
  );

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      {/* Same ground as the spectrum cutaway: vignette, faint dot grid, and one
          soft blob under each half of the equation. */}
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
      <div
        style={{
          position: 'absolute',
          left: briefcaseX - 620,
          top: pairY - 620,
          width: 1240,
          height: 1240,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${businessColor} 0%, transparent 68%)`,
          filter: 'blur(40px)',
          opacity: glow * interpolate(frame, [0, 18], [0, 0.15], CLAMP),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: europeX - 620,
          top: pairY - 620,
          width: 1240,
          height: 1240,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${europeColor} 0%, transparent 68%)`,
          filter: 'blur(40px)',
          opacity: glow * interpolate(frame, [F_EUROPE, F_EUROPE + 20], [0, 0.15], CLAMP),
        }}
      />

      {/* Recolours the supplied artwork to a flat palette colour while keeping
          its alpha exactly — the PNG is never traced or redrawn. sRGB is
          explicit because the linearRGB default washes the hue out. */}
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="europe-tint" colorInterpolationFilters="sRGB">
            <feFlood floodColor={europeColor} result="tint" />
            <feComposite in="tint" in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      </svg>

      <div style={{position: 'absolute', inset: 0, scale: lockPulse}}>
        {/* pro business */}
        <Glyph
          paths={ICONS.briefcase}
          color={businessColor}
          size={briefcaseSize}
          strokeWidth={strokeWidth}
          x={briefcaseX}
          y={pairY}
          frame={frame}
          start={F_BRIEFCASE}
        />

        {/* the "and" — an operator, deliberately subordinate to both terms */}
        <svg
          width={plusSize}
          height={plusSize}
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            left: plusX - plusSize / 2,
            top: pairY - plusSize / 2,
            opacity: interpolate(frame, [F_PLUS, F_PLUS + 10], [0, 0.55], CLAMP),
            scale: interpolate(frame, [F_PLUS, F_PLUS + 12], [0.5, 1], {
              ...CLAMP,
              easing: EASE_POP,
            }),
          }}
        >
          <g
            stroke={bracketColor}
            strokeWidth={(strokeWidth / plusSize) * 100}
            strokeLinecap="round"
          >
            <line x1={16} y1={50} x2={84} y2={50} />
            <line x1={50} y1={16} x2={50} y2={84} />
          </g>
        </svg>

        {/* federal europe */}
        <div
          style={{
            position: 'absolute',
            left: europeX - europeSize / 2,
            top: pairY - europeSize / 2,
            width: europeSize,
            height: europeSize,
            opacity: interpolate(frame, [F_EUROPE, F_EUROPE + 7], [0, 1], CLAMP),
            scale: interpolate(frame, [F_EUROPE, F_EUROPE + 15], [0.66, 1], {
              ...CLAMP,
              easing: EASE_POP,
            }),
            translate: `0px ${interpolate(frame, [F_EUROPE, F_EUROPE + 17], [30, 0], {
              ...CLAMP,
              easing: EASE_OUT,
            })}px`,
          }}
        >
          <Img
            src={staticFile('europe.png')}
            style={{width: europeSize, height: europeSize, filter: 'url(#europe-tint)'}}
          />
        </div>

        {/* Corner marks rather than a full box: they say "this pair, as one
            thing" without drawing a container the eye has to read around. */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{position: 'absolute', inset: 0}}
        >
          <g
            fill="none"
            stroke={bracketColor}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={interpolate(
              frame,
              [0, 10, F_BRACKETS, F_BRACKETS + 12],
              [0, 0.13, 0.13, 0.5],
              CLAMP,
            )}
          >
            {[
              [`M${boxLeft} ${boxTop + armLen} V${boxTop} H${boxLeft + armLen}`, 0],
              [`M${boxRight - armLen} ${boxTop} H${boxRight} V${boxTop + armLen}`, 2],
              [`M${boxRight} ${boxBottom - armLen} V${boxBottom} H${boxRight - armLen}`, 4],
              [`M${boxLeft + armLen} ${boxBottom} H${boxLeft} V${boxBottom - armLen}`, 6],
            ].map(([d, delay]) => (
              <path
                key={d as string}
                d={d as string}
                style={{
                  scale: interpolate(
                    frame,
                    [F_BRACKETS + (delay as number), F_BRACKETS + (delay as number) + 14],
                    [0.9, 1],
                    {...CLAMP, easing: EASE_POP},
                  ),
                  transformOrigin: `${centerX}px ${pairY}px`,
                }}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* "and that's not nationalists" — the same flag and the same red stroke
          as the spectrum scene, so the negation needs no explaining. */}
      <Glyph
        paths={ICONS.flag}
        color={businessColor}
        size={flagSize}
        strokeWidth={strokeWidth}
        x={centerX}
        y={flagY}
        frame={frame}
        start={F_FLAG}
      >
        <line
          x1={18}
          y1={86}
          x2={82}
          y2={22}
          stroke={negateColor}
          strokeWidth={(strokeWidth / flagSize) * 100 * 1.15}
          strokeLinecap="round"
          strokeDasharray={91}
          strokeDashoffset={interpolate(frame, [F_SLASH, F_SLASH + 9], [91, 0], {
            ...CLAMP,
            easing: EASE_OUT,
          })}
        />
      </Glyph>
    </AbsoluteFill>
  );
};

export default ProBusinessFederalEurope;
