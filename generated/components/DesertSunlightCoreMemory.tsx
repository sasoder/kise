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
  showPin: z.boolean(),
  fontSize: z.number().min(40).max(400),
  letterSpacing: z.number().min(-20).max(40),
  coreColor: z.string(),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
});

export type DesertSunlightCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: DesertSunlightCoreMemoryProps = schema.parse({
  text: 'DESERT SUNLIGHT SOLAR FARM',
  showPin: true,
  fontSize: 104,
  letterSpacing: -2,
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

// The pin is drawn, not typed: a colour emoji ignores `color`, so it could
// never join the orange/purple/blue chain. Glyph box is cropped to the mark
// itself so its height is exactly the cap height it is set against.
const PIN_HEIGHT_EM = 0.78;
const PIN_ASPECT = 14 / 20;
const PIN_GAP_EM = 0.18;
// Nudges the pin down from the flex centre onto the cap band of the line.
const PIN_SHIFT_EM = 0.034;

const Pin: React.FC<{fontSize: number}> = ({fontSize}) => (
  <svg
    viewBox="5 2 14 20"
    width={fontSize * PIN_HEIGHT_EM * PIN_ASPECT}
    height={fontSize * PIN_HEIGHT_EM}
    style={{
      display: 'block',
      marginRight: fontSize * PIN_GAP_EM,
      translate: `0px ${fontSize * PIN_SHIFT_EM}px`,
      flexShrink: 0,
    }}
  >
    <path
      fill="currentColor"
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
    />
  </svg>
);

const DesertSunlightCoreMemory: React.FC<DesertSunlightCoreMemoryProps> = ({
  text,
  showPin,
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

  // The line is long, so it is set on two lines; both live inside one layer
  // node so the stagger stays one slide per colour, not one per line.
  const words = text.split(' ');
  const line1 = words.slice(0, 2).join(' ');
  const line2 = words.slice(2).join(' ');

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
    lineHeight: 0.95,
    whiteSpace: 'pre',
  };

  // The same node tree in every layer — only `color` differs — so the pin
  // slides and stacks exactly like the letters.
  const lockup = (
    <>
      <div style={{display: 'inline-flex', alignItems: 'center'}}>
        {showPin ? <Pin fontSize={fontSize} /> : null}
        <span>{line1}</span>
      </div>
      {line2 ? <div>{line2}</div> : null}
    </>
  );

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      {/* Sized to the type itself so every copy lands on the same box. */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: fontSize * 2.6,
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
              {lockup}
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
              {lockup}
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
              {lockup}
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default DesertSunlightCoreMemory;
