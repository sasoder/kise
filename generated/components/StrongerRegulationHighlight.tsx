import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';
import {z} from 'zod';

const sans = loadSans('normal', {
  weights: ['700', '800'],
  subsets: ['latin'],
});

export const FPS = 30;
export const DURATION = 90;

// The headline is authored at the supplied crop's native CSS size and scaled up
// to the frame, so every measurement below matches the source 1:1 and the crop
// stays exactly as tight as the screenshot.
const PAGE_W = 690;
const PAGE_H = 160;

const HEAD_SIZE = 44;
const HEAD_LEADING = 52;
const HEAD_LEFT = 20;
const HEAD_TOP = 30;

export const schema = z.object({
  // Page palette, lifted from the screenshot.
  pageBg: z.string(),
  ink: z.string(),
  // Type. Weight and tracking are props because the source face is a licensed
  // grotesque and Inter has to be dialled in to match its colour on the page.
  headWeight: z.number(),
  headTracking: z.number(),
  // Highlighter. `body` is the settled ink, `edge` the wetter leading edge.
  markerBody: z.string(),
  markerEdge: z.string(),
  // Marker band geometry in page px: how tall, and how low it rides inside the
  // headline's inline box. Set in px rather than fractions because the leading
  // is tight and a percentage band would bleed into the line above.
  markerHeight: z.number(),
  markerDrop: z.number(),
  // Pacing, in seconds. The pen touches down at `penStart` and crosses the
  // phrase at `charsPerSecond`.
  penStart: z.number(),
  charsPerSecond: z.number(),
});

export type StrongerRegulationHighlightProps = z.infer<typeof schema>;

type Token = {text: string; marked?: boolean};

// Broken exactly as the page breaks it, so the highlighted phrase sits as one
// unbroken band.
const HEADLINE: Token[][] = [
  [{text: 'Exclusive:'}, {text: 'Anthropic'}, {text: 'CEO'}, {text: 'calls'}],
  [
    {text: 'for'},
    {text: 'stronger', marked: true},
    {text: 'regulation', marked: true},
    {text: 'of', marked: true},
    {text: 'AI', marked: true},
  ],
];

const FLAT = HEADLINE.flatMap((line, lineIndex) =>
  line.map((token, wordIndex) => ({...token, lineIndex, wordIndex})),
);

type Span = {start: number; end: number};

// One entry per marked word, keyed `line-word`. The phrase's duration is shared
// across its words by character count, so the pen travels at an even speed
// instead of jumping between long and short words.
const buildSchedule = (penStart: number, charsPerSecond: number): Map<string, Span> => {
  const schedule = new Map<string, Span>();
  let cursor = penStart;

  for (const word of FLAT) {
    if (!word.marked) {
      continue;
    }
    const start = cursor;
    const end = start + word.text.length / charsPerSecond;
    schedule.set(`${word.lineIndex}-${word.wordIndex}`, {start, end});
    cursor = end;
  }

  return schedule;
};

const StrongerRegulationHighlight: React.FC<StrongerRegulationHighlightProps> = ({
  pageBg,
  ink,
  headWeight,
  headTracking,
  markerBody,
  markerEdge,
  markerHeight,
  markerDrop,
  penStart,
  charsPerSecond,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const seconds = frame / fps;

  const schedule = React.useMemo(
    () => buildSchedule(penStart, charsPerSecond),
    [penStart, charsPerSecond],
  );

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
        <div
          style={{
            position: 'absolute',
            top: HEAD_TOP,
            left: HEAD_LEFT,
            width: PAGE_W - HEAD_LEFT,
            fontFamily: sans.fontFamily,
            fontSize: HEAD_SIZE,
            lineHeight: `${HEAD_LEADING}px`,
            fontWeight: headWeight,
            letterSpacing: `${headTracking}em`,
          }}
        >
          {HEADLINE.map((line, lineIndex) => (
            <div key={lineIndex}>
              {line.map((token, wordIndex) => {
                const next = line[wordIndex + 1];
                const progress = progressOf(lineIndex, wordIndex);
                // A highlighted run is painted as one band: the word, and the
                // space after it when the next word is also highlighted.
                const runsOn = Boolean(token.marked && next?.marked);
                return (
                  <React.Fragment key={wordIndex}>
                    <span style={token.marked ? marker(progress) : undefined}>
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
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const defaultProps = schema.parse({
  pageBg: '#FFFFFF',
  ink: '#141414',
  headWeight: 800,
  headTracking: -0.024,
  markerBody: 'rgba(217, 119, 87, 0.34)',
  markerEdge: 'rgba(217, 119, 87, 0.52)',
  markerHeight: 36,
  markerDrop: 0.7,
  penStart: 0.6,
  charsPerSecond: 19,
});

export default StrongerRegulationHighlight;
