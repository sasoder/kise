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
    '“Our mission is to ensure that',
    'artificial general intelligence',
    'benefits all of humanity.”',
  ],
  previewBackground: null,
});

// Layout, in 1080x1920 px. One row: quote on the left, mark at its right end,
// both centred on the same y.
const ROW_CY = 835;

const MARK_SIZE = 160;
const MARK_HALF = MARK_SIZE / 2;
const MARK_X_START = 540;
const MARK_X_END = 900; // box right edge 980

const FONT_SIZE = 50;
const LINE_HEIGHT = 1.2;
const TEXT_BLOCK_WIDTH = 900;

// Distance from the text container's box left to the first glyph's ink, at
// FONT_SIZE. Measured off a render: the opening quote mark carries no left side
// bearing at this size, so the box left is the ink left.
const INK_OFFSET = 0;

// Measured at FONT_SIZE = 50: the widest line inks 643px, so the block spans
// x = 100..743 — clear of the 690px budget and of the mark's left edge.

// The ink left edge travels from the mark's starting left edge to x = 100:
// the mark slides right, the quote slides left, both off one progress value.
const TEXT_INK_LEFT_START = MARK_X_START - MARK_HALF; // 460
const TEXT_INK_LEFT_END = 100;

// Beats, at 24fps: hold, one eased move, hold.
const MOVE_START = 18;
const MOVE_END = 60;

// The reveal edge sits 8px inside the mark's left edge; the feather lies to the
// left of it, so no text ever paints right of the mark.
const EDGE_INSET = 8;
const FEATHER = 40;

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
  const markLeft = markCx - MARK_HALF;

  const inkLeft =
    TEXT_INK_LEFT_START + (TEXT_INK_LEFT_END - TEXT_INK_LEFT_START) * t;
  const boxLeft = inkLeft - INK_OFFSET;

  const blockHeight = quote.length * FONT_SIZE * LINE_HEIGHT;

  // Wipe edge in text-block local coordinates.
  const edge = markLeft - EDGE_INSET - boxLeft;
  const mask = `linear-gradient(to right, #000 ${edge - FEATHER}px, rgba(0,0,0,0) ${edge}px)`;

  return (
    <AbsoluteFill
      style={previewBackground ? {backgroundColor: previewBackground} : undefined}
    >
      <div
        style={{
          position: 'absolute',
          left: boxLeft,
          top: ROW_CY - blockHeight / 2,
          width: TEXT_BLOCK_WIDTH,
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

      <div
        style={{
          position: 'absolute',
          left: markLeft,
          top: ROW_CY - MARK_HALF,
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
    </AbsoluteFill>
  );
};

export default OpenAIMission;
