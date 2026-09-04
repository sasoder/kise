import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
export const DURATION = 60;

export const schema = z.object({
  artwork: z.string(),
  artworkWidth: z.number().min(240).max(1040),
  artworkAspect: z.number().min(0.2).max(20),
  coreColor: z.string(),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
});

export type CraigVenterTextChannelSplitProps = z.infer<typeof schema>;

export const defaultProps: CraigVenterTextChannelSplitProps = schema.parse({
  artwork: 'craig-venter-text.png',
  artworkWidth: 900,
  artworkAspect: 979 / 65,
  coreColor: '#FFFFFF',
  // Thin letterforms, so the hard shadow stays far under the ~1.8% used for
  // chunky glyphs or it closes up the counters.
  shadowOffset: 4,
  rise: 130,
  staggerFrames: 2,
});

// Every layer does exactly the same thing — slide up into place, no fade — just
// later than the one before it. Orange leads, the white mark arrives last and
// lands on top, hiding the colours behind it. Colours are the CORE MEMORY chain
// sampled from public/core.png and used raw: no blend mode, no bloom, no
// saturation.
const TRAIL_COLORS = [
  '#FFB765', // orange, first to arrive
  '#BC37FF', // purple
  '#0046FF', // blue, last of the colours
];
const TRAVEL_FRAMES = 22;

// The supplied PNG is white type on black with no alpha, so it was rebuilt at
// public/craig-venter-text.png with its luminance as alpha and cropped to the
// type. Each layer is that alpha masking a flat colour — the bitmap itself is
// never recoloured.
const maskStyle = (artwork: string): React.CSSProperties => ({
  WebkitMaskImage: `url(${staticFile(artwork)})`,
  maskImage: `url(${staticFile(artwork)})`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
});

const CraigVenterTextChannelSplit: React.FC<CraigVenterTextChannelSplitProps> = ({
  artwork,
  artworkWidth,
  artworkAspect,
  coreColor,
  shadowOffset,
  rise,
  staggerFrames,
}) => {
  const frame = useCurrentFrame();

  const artworkHeight = artworkWidth / artworkAspect;

  // One shared slide, sampled at a different start frame per layer: quick off
  // the mark, then a long ease into place.
  const offsetAt = (delay: number) => {
    const t = interpolate(frame, [delay, delay + TRAVEL_FRAMES], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (1 - t) * rise;
  };

  // Nothing fades, so a layer simply does not exist until its turn — they cut
  // in one at a time rather than all sitting there at frame 0.
  const hasStarted = (delay: number) => frame >= delay;

  // The white type goes last, so it is still low while the colours are landing.
  const coreDelay = TRAIL_COLORS.length * staggerFrames;
  const coreOffset = offsetAt(coreDelay);

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{position: 'relative', width: artworkWidth, height: artworkHeight}}
      >
        {/* Listed in arrival order, and stacked the same way: orange at the
            back, then purple, then blue, with the core on top of all of them. */}
        {TRAIL_COLORS.map((color, i) =>
          hasStarted(i * staggerFrames) ? (
            <div
              key={color}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: i + 1,
                translate: `0px ${offsetAt(i * staggerFrames)}px`,
                backgroundColor: color,
                ...maskStyle(artwork),
              }}
            />
          ) : null,
        )}

        {hasStarted(coreDelay) ? (
          <>
            {/* Hard readability shadow, behind the core and behind the colours
                so it never darkens them. Zero blur, rides with the core. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                translate: `${shadowOffset}px ${coreOffset + shadowOffset}px`,
                backgroundColor: '#000000',
                ...maskStyle(artwork),
              }}
            />

            {/* Core: the type's own alpha over flat white, on top of all. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: TRAIL_COLORS.length + 1,
                translate: `0px ${coreOffset}px`,
                backgroundColor: coreColor,
                ...maskStyle(artwork),
              }}
            />
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default CraigVenterTextChannelSplit;
