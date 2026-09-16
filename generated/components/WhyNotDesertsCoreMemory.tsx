import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
  weights: ['900'],
  subsets: ['latin'],
});

export const FPS = 24;
export const DURATION = 72;

export const schema = z.object({
  text: z.string(),
  fontSize: z.number().min(40).max(400),
  letterSpacing: z.number().min(-20).max(40),
  coreColor: z.string(),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
  plateColor: z.string(),
  platePadding: z.number().min(0).max(2),
  plateRadius: z.number().min(0).max(200),
});

export type WhyNotDesertsCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: WhyNotDesertsCoreMemoryProps = schema.parse({
  text: "WHY AREN'T ALL DESERTS COVERED IN SOLAR PANELS?",
  fontSize: 106,
  letterSpacing: -2,
  coreColor: '#FFFFFF',
  // Barlow 900 is a chunky glyph, so the hard shadow sits near the ~1.8% of
  // size used for solid marks rather than the thin-stroke value.
  shadowOffset: 4,
  rise: 130,
  staggerFrames: 2,
  plateColor: 'rgba(0,0,0,0.6)',
  platePadding: 0.42,
  plateRadius: 28,
});

// The CORE MEMORY chain colours sampled from public/core.png, used raw: no
// blend mode, no bloom, no saturation. Orange arrives first, blue last, so the
// band sitting directly under the core is blue.
const TRAIL_COLORS = ['#FFB765', '#BC37FF', '#0046FF'];
const TRAVEL_FRAMES = 22;

const LINE_HEIGHT = 0.95;
const LINES = ["WHY AREN'T ALL", 'DESERTS COVERED', 'IN SOLAR PANELS?'];

// Barlow's line box is taller than its ink: with all-caps copy the gap above
// the cap line is larger than the one under the last baseline. These are
// measured off a render, in em, and trimmed from the plate padding so the
// plate reads as evenly padded around the ink rather than around the boxes.
const INK_TOP_TRIM_EM = 0.175;
const INK_BOTTOM_TRIM_EM = 0.075;
// Barlow's side bearings plus the trailing negative letter-spacing: the layout
// box is a touch wider than the ink, trimmed off both sides.
const INK_SIDE_TRIM_EM = 0.025;

const WhyNotDesertsCoreMemory: React.FC<WhyNotDesertsCoreMemoryProps> = ({
  text,
  fontSize,
  letterSpacing,
  coreColor,
  shadowOffset,
  rise,
  staggerFrames,
  plateColor,
  platePadding,
  plateRadius,
}) => {
  const frame = useCurrentFrame();

  // One shared slide, sampled at a different start frame per layer: quick off
  // the mark, then a long ease into place. Nothing fades.
  const offsetAt = (delay: number) => {
    const t = interpolate(frame, [delay, delay + TRAVEL_FRAMES], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (1 - t) * rise;
  };

  // A layer simply does not exist until its turn — they cut in one at a time
  // rather than all sitting there at frame 0.
  const hasStarted = (delay: number) => frame >= delay;

  const coreDelay = TRAIL_COLORS.length * staggerFrames;
  const coreOffset = offsetAt(coreDelay);

  // The question is long, so it is set on three balanced ragged lines; all
  // three live inside one layer node so the stagger stays one slide per
  // colour, not one per line. `text` drives nothing but the schema record of
  // the copy — the break points are authored, not computed.
  const lines = text === defaultProps.text ? LINES : text.split('\n');

  const typeStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily,
    fontWeight: 900,
    fontSize,
    letterSpacing,
    lineHeight: LINE_HEIGHT,
    whiteSpace: 'pre',
  };

  // The same node tree in every layer — only `color` differs — so every copy
  // lands on the same box.
  const lockup = (
    <>
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </>
  );

  const padTop = fontSize * (platePadding - INK_TOP_TRIM_EM);
  const padBottom = fontSize * (platePadding - INK_BOTTOM_TRIM_EM);
  const padSide = fontSize * (platePadding - INK_SIDE_TRIM_EM);
  // The plate box is padded asymmetrically, so centring the box would push the
  // type off centre; this puts the type back on the canvas centre instead.
  const plateShift = (padBottom - padTop) / 2;

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: '100%', height: '100%'}}>
        {/* The plate: one node at the very back, shrink-wrapped to the copy and
            riding the first colour layer exactly — same rise, same easing, same
            start frame. It never fades, scales or blurs. */}
        {hasStarted(0) ? (
          <div
            style={{
              ...typeStyle,
              zIndex: 0,
              translate: `0px ${offsetAt(0) + plateShift}px`,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: padTop,
                paddingBottom: padBottom,
                paddingLeft: padSide,
                paddingRight: padSide,
                borderRadius: plateRadius,
                background: plateColor,
                color: 'transparent',
              }}
            >
              {lockup}
            </div>
          </div>
        ) : null}

        {/* Arrival order and stacking order are the same: orange at the back,
            then purple, then blue, with the core on top of all of them. */}
        {TRAIL_COLORS.map((color, i) =>
          hasStarted(i * staggerFrames) ? (
            <div
              key={color}
              style={{
                ...typeStyle,
                zIndex: i + 2,
                translate: `0px ${offsetAt(i * staggerFrames)}px`,
                color,
              }}
            >
              {lockup}
            </div>
          ) : null,
        )}

        {hasStarted(coreDelay) ? (
          <>
            {/* Hard readability shadow, behind the colours so it never darkens
                the ones it crosses. Zero blur, rides with the core. */}
            <div
              style={{
                ...typeStyle,
                zIndex: 1,
                translate: `${shadowOffset}px ${coreOffset + shadowOffset}px`,
                color: '#000000',
              }}
            >
              {lockup}
            </div>

            {/* Core: the white mark, last to arrive and on top of all. */}
            <div
              style={{
                ...typeStyle,
                zIndex: TRAIL_COLORS.length + 2,
                translate: `0px ${coreOffset}px`,
                color: coreColor,
              }}
            >
              {lockup}
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default WhyNotDesertsCoreMemory;
