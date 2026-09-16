import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {z} from 'zod';
import {OPENAI} from './brandGlyphs';

export const FPS = 24;
export const DURATION = 144;

const fontFamily = 'Sohne';
loadFont({
  family: fontFamily,
  url: staticFile('Sohne-Kraftig.otf'),
  weight: '500',
});

export const schema = z.object({
  quote: z.array(z.string()).min(1),
  previewBackground: z.string().nullable(),
});

export type OpenAIMissionProps = z.infer<typeof schema>;

export const defaultProps: OpenAIMissionProps = schema.parse({
  quote: [
    'Our mission is to ensure that',
    'artificial general intelligence',
    'benefits all of humanity.',
  ],
  previewBackground: null,
});

// Layout, in 1080x1920 px.
const TEXT_LEFT = 90;
const TEXT_RIGHT = 990;
const TEXT_WIDTH = TEXT_RIGHT - TEXT_LEFT; // 900
const TEXT_TOP = 1000;
const FONT_SIZE = 64;
const LINE_HEIGHT = 1.22;

// Measured ink right edge of the longest rendered line at 64px.
const INK_RIGHT = 888;

const MARK_SIZE = 200;
const MARK_CY = 835;
const MARK_X_START = 540;
const MARK_X_END = INK_RIGHT - MARK_SIZE / 2; // 788 — right edge on the text ink

// Beats, at 24fps: hold, one eased move, hold.
const MOVE_START = 18;
const MOVE_END = 60;

const FEATHER = 140;

// One curve drives the slide and the wipe, so they read as a single motion.
const EASE = Easing.bezier(0.55, 0, 0.1, 1);

const OpenAIMission: React.FC<OpenAIMissionProps> = ({
  quote,
  previewBackground,
}) => {
  const frame = useCurrentFrame();

  const t = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const markCx = MARK_X_START + (MARK_X_END - MARK_X_START) * t;

  // Wipe edge in text-block local coordinates: 0 (nothing revealed) to
  // the ink right edge + FEATHER (fully revealed, no dimmed tail on the right).
  const edge = (INK_RIGHT - TEXT_LEFT + FEATHER) * t;
  const mask = `linear-gradient(to right, #000 ${edge - FEATHER}px, rgba(0,0,0,0) ${edge}px)`;

  return (
    <AbsoluteFill
      style={previewBackground ? {backgroundColor: previewBackground} : undefined}
    >
      <div
        style={{
          position: 'absolute',
          left: markCx - MARK_SIZE / 2,
          top: MARK_CY - MARK_SIZE / 2,
          width: MARK_SIZE,
          height: MARK_SIZE,
        }}
      >
        <svg
          width={MARK_SIZE}
          height={MARK_SIZE}
          viewBox={OPENAI.viewBox}
          style={{display: 'block'}}
        >
          {OPENAI.paths.map((d) => (
            <path key={d} d={d} fill="#FFFFFF" fillRule="evenodd" />
          ))}
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          left: TEXT_LEFT,
          top: TEXT_TOP,
          width: TEXT_WIDTH,
          fontFamily,
          fontWeight: 500,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          letterSpacing: '-0.005em',
          color: '#FFFFFF',
          textAlign: 'left',
          whiteSpace: 'pre',
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {quote.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default OpenAIMission;
