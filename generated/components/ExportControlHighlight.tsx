import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadSerif} from '@remotion/google-fonts/Newsreader';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';
import {z} from 'zod';

const serif = loadSerif('normal', {
  weights: ['400', '700'],
  subsets: ['latin'],
});

const sans = loadSans('normal', {
  weights: ['400', '600', '700'],
  subsets: ['latin'],
});

export const FPS = 30;
export const DURATION = 175;

// The page is authored at the screenshot's native CSS size and scaled up to the
// frame, so every measurement below matches the source 1:1.
const PAGE_W = 1042;
const PAGE_H = 1100;
const GUTTER = 52;

const HEAD_SIZE = 66;
const HEAD_LEADING = 64;
const BODY_SIZE = 35;
const BODY_LEADING = 48;

export const schema = z.object({
  // Page palette, lifted from the screenshot.
  pageBg: z.string(),
  ink: z.string(),
  // Highlighter. `body` is the settled ink, `edge` the wetter leading edge.
  markerBody: z.string(),
  markerEdge: z.string(),
  // Marker band geometry in page px: how tall, and how low it rides inside the
  // headline's inline box. Set in px rather than fractions because the headline
  // is set solid and a percentage band would bleed into the line above.
  markerHeight: z.number(),
  markerDrop: z.number(),
  // Pacing, in seconds. The pen touches down at `penStart`, crosses each phrase
  // at `charsPerSecond`, and rests `phraseGap` between phrases.
  penStart: z.number(),
  charsPerSecond: z.number(),
  phraseGap: z.number(),
});

export type ExportControlHighlightProps = z.infer<typeof schema>;

type Token = {text: string; phrase?: number};

// The headline is broken exactly as the page breaks it, so each highlighted
// phrase sits as one unbroken band.
const HEADLINE: Token[][] = [
  [{text: 'Statement'}, {text: 'on'}, {text: 'the'}, {text: 'US'}],
  [
    {text: 'government', phrase: 0},
    {text: 'directive', phrase: 0},
  ],
  [{text: 'to'}, {text: 'suspend', phrase: 1}, {text: 'access'}, {text: 'to'}],
  [
    {text: 'Fable', phrase: 2},
    {text: '5', phrase: 2},
    {text: 'and', phrase: 2},
    {text: 'Mythos', phrase: 2},
    {text: '5', phrase: 2},
  ],
];

// Flatten to document order once, so the schedule can walk the phrases in the
// order the eye reads them.
const FLAT = HEADLINE.flatMap((line, lineIndex) =>
  line.map((token, wordIndex) => ({...token, lineIndex, wordIndex})),
);

type Span = {start: number; end: number};

// One entry per headline word, keyed `line-word`. Each phrase gets a duration
// proportional to its length, then shares it across its words by character
// count, so the pen travels at an even speed instead of jumping between long
// and short words.
const buildSchedule = (
  penStart: number,
  charsPerSecond: number,
  phraseGap: number,
): Map<string, Span> => {
  const schedule = new Map<string, Span>();
  let cursor = penStart;

  for (let phrase = 0; phrase < 3; phrase++) {
    const words = FLAT.filter((token) => token.phrase === phrase);
    for (const word of words) {
      const start = cursor;
      const end = start + word.text.length / charsPerSecond;
      schedule.set(`${word.lineIndex}-${word.wordIndex}`, {start, end});
      cursor = end;
    }
    cursor += phraseGap;
  }

  return schedule;
};

const BODY_A =
  'The US government, citing national security authorities, has issued an export control directive to suspend all access to Fable 5 and Mythos 5 by any foreign national, whether inside or outside the United States, including foreign national Anthropic employees. The net effect of this order is that we must abruptly disable Fable 5 and Mythos 5 for ';
const BODY_B = ' our customers to ensure compliance. ';
const BODY_C =
  'Access to all other Anthropic models will not be affected.';

const AnthropicMark: React.FC<{color: string}> = ({color}) => (
  <svg width={62} height={40} viewBox="0 0 106 68" fill={color}>
    <path d="M30 0 L46 0 L18 68 L2 68 Z" />
    <path d="M30 0 L46 0 L74 68 L58 68 Z" />
    <path d="M62 0 L78 0 L106 68 L90 68 Z" />
  </svg>
);

const MenuMark: React.FC<{color: string}> = ({color}) => (
  <svg width={38} height={24} viewBox="0 0 38 24">
    <rect x={0} y={0} width={38} height={3} rx={1.5} fill={color} />
    <rect x={0} y={10.5} width={25} height={3} rx={1.5} fill={color} />
    <rect x={0} y={21} width={33} height={3} rx={1.5} fill={color} />
  </svg>
);

const ExportControlHighlight: React.FC<ExportControlHighlightProps> = ({
  pageBg,
  ink,
  markerBody,
  markerEdge,
  markerHeight,
  markerDrop,
  penStart,
  charsPerSecond,
  phraseGap,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const seconds = frame / fps;

  const schedule = React.useMemo(
    () => buildSchedule(penStart, charsPerSecond, phraseGap),
    [penStart, charsPerSecond, phraseGap],
  );

  // A highlighted run is painted as one band: the word, and the space after it
  // when the next word belongs to the same phrase.
  const marker = (progress: number): React.CSSProperties => {
    // The wetter leading edge belongs only to the word the pen is crossing right
    // now — painting it on finished words leaves a dark stripe at every word
    // boundary.
    const wiping = progress > 0 && progress < 1;
    return {
      backgroundImage: wiping
        ? `linear-gradient(90deg, ${markerBody} 0%, ${markerBody} 74%, ${markerEdge} 100%)`
        : `linear-gradient(90deg, ${markerBody}, ${markerBody})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `left ${markerDrop * 100}%`,
      backgroundSize: `${progress * 100}% ${markerHeight}px`,
    };
  };

  const progressOf = (lineIndex: number, wordIndex: number) => {
    const span = schedule.get(`${lineIndex}-${wordIndex}`);
    if (!span) {
      return 0;
    }
    return interpolate(seconds, [span.start, span.end], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  return (
    <AbsoluteFill style={{backgroundColor: pageBg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          width: PAGE_W,
          height: PAGE_H,
          transform: `scale(${width / PAGE_W})`,
          transformOrigin: 'top left',
          color: ink,
        }}
      >
        {/* Chrome. */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: GUTTER,
            right: GUTTER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <AnthropicMark color={ink} />
          <MenuMark color={ink} />
        </div>

        {/* Eyebrow. */}
        <div
          style={{
            position: 'absolute',
            top: 200,
            left: 0,
            width: PAGE_W,
            textAlign: 'center',
            fontFamily: sans.fontFamily,
            fontSize: 27,
            fontWeight: 700,
            letterSpacing: '-0.005em',
          }}
        >
          Announcements
        </div>

        {/* Headline. */}
        <div
          style={{
            position: 'absolute',
            top: 278,
            left: 0,
            width: PAGE_W,
            textAlign: 'center',
            fontFamily: sans.fontFamily,
            fontSize: HEAD_SIZE,
            lineHeight: `${HEAD_LEADING}px`,
            fontWeight: 700,
            letterSpacing: '-0.022em',
          }}
        >
          {HEADLINE.map((line, lineIndex) => (
            <div key={lineIndex}>
              {line.map((token, wordIndex) => {
                const next = line[wordIndex + 1];
                const progress = progressOf(lineIndex, wordIndex);
                const runsOn =
                  token.phrase !== undefined && next?.phrase === token.phrase;
                return (
                  <React.Fragment key={wordIndex}>
                    <span
                      style={
                        token.phrase === undefined ? undefined : marker(progress)
                      }
                    >
                      {token.text}
                      {runsOn ? ' ' : ''}
                    </span>
                    {next && !runsOn ? ' ' : ''}
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>

        {/* Date. */}
        <div
          style={{
            position: 'absolute',
            top: 590,
            left: 0,
            width: PAGE_W,
            textAlign: 'center',
            fontFamily: serif.fontFamily,
            fontSize: 31,
            fontWeight: 400,
          }}
        >
          Jun 12, 2026
        </div>

        {/* Body. */}
        <div
          style={{
            position: 'absolute',
            top: 702,
            left: GUTTER,
            width: PAGE_W - GUTTER * 2,
            fontFamily: serif.fontFamily,
            fontSize: BODY_SIZE,
            lineHeight: `${BODY_LEADING}px`,
            fontWeight: 400,
            letterSpacing: '-0.002em',
          }}
        >
          {BODY_A}
          <span style={{textDecoration: 'underline'}}>all</span>
          {BODY_B}
          <span style={{fontWeight: 700}}>{BODY_C}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const defaultProps = schema.parse({
  pageBg: '#FAF9F5',
  ink: '#191817',
  markerBody: 'rgba(217, 119, 87, 0.34)',
  markerEdge: 'rgba(217, 119, 87, 0.52)',
  markerHeight: 52,
  markerDrop: 0.72,
  penStart: 1,
  charsPerSecond: 19,
  phraseGap: 0.6,
});

export default ExportControlHighlight;
