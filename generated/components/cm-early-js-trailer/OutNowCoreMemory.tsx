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
});

export type OutNowCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: OutNowCoreMemoryProps = schema.parse({
  text: 'OUT NOW!',
  fontSize: 178,
  letterSpacing: -4,
  coreColor: '#FFFFFF',
  // Barlow 900 is a chunky glyph, so the hard shadow sits near the ~1.8% of
  // size used for solid marks rather than the thin-stroke value.
  shadowOffset: 4,
  rise: 130,
  staggerFrames: 2,
});

// The CORE MEMORY chain colours sampled from public/core.png, used raw: no
// blend mode, no bloom, no saturation. Orange arrives first, blue last, so the
// band sitting directly under the core is blue.
const TRAIL_COLORS = ['#FFB765', '#BC37FF', '#0046FF'];
const TRAVEL_FRAMES = 22;

const OutNowCoreMemory: React.FC<OutNowCoreMemoryProps> = ({
  text,
  fontSize,
  letterSpacing,
  coreColor,
  shadowOffset,
  rise,
  staggerFrames,
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

  const typeStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily,
    fontWeight: 900,
    fontSize,
    letterSpacing,
    lineHeight: 1,
    whiteSpace: 'pre',
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      {/* Sized to the type itself so every copy lands on the same box. */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: fontSize * 1.4,
        }}
      >
        {/* Arrival order and stacking order are the same: orange at the back,
            then purple, then blue, with the core on top of all of them. */}
        {TRAIL_COLORS.map((color, i) =>
          hasStarted(i * staggerFrames) ? (
            <div
              key={color}
              style={{
                ...typeStyle,
                zIndex: i + 1,
                translate: `0px ${offsetAt(i * staggerFrames)}px`,
                color,
              }}
            >
              {text}
            </div>
          ) : null,
        )}

        {hasStarted(coreDelay) ? (
          <>
            {/* Hard readability shadow, at the very back so it never darkens
                the colours it crosses. Zero blur, rides with the core. */}
            <div
              style={{
                ...typeStyle,
                zIndex: 0,
                translate: `${shadowOffset}px ${coreOffset + shadowOffset}px`,
                color: '#000000',
              }}
            >
              {text}
            </div>

            {/* Core: the white mark, last to arrive and on top of all. */}
            <div
              style={{
                ...typeStyle,
                zIndex: TRAIL_COLORS.length + 1,
                translate: `0px ${coreOffset}px`,
                color: coreColor,
              }}
            >
              {text}
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default OutNowCoreMemory;
