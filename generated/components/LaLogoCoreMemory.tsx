import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
export const DURATION = 90;

export const schema = z.object({
  logo: z.string(),
  logoWidth: z.number().min(240).max(1040),
  logoAspect: z.number().min(0.2).max(12),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
});

export type LaLogoCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: LaLogoCoreMemoryProps = schema.parse({
  logo: 'la.png',
  logoWidth: 620,
  logoAspect: 475 / 640,
  // Chunky solid sticker silhouette, so the hard shadow sits at the ~1.8% of
  // size used for solid glyphs rather than the reduced value thin marks need.
  shadowOffset: 11,
  rise: 130,
  staggerFrames: 2,
});

// Every layer does exactly the same thing — slide up into place, no fade — just
// later than the one before it. Orange leads, the logo itself arrives last and
// lands on top, hiding the colours behind it. Colours are the CORE MEMORY chain
// sampled from public/core.png and used raw: no blend mode, no bloom, no
// saturation.
const TRAIL_COLORS = [
  '#FFB765', // orange, first to arrive
  '#BC37FF', // purple
  '#0046FF', // blue, last of the colours
];
const TRAVEL_FRAMES = 22;

// The trail layers are the logo's own alpha used as a mask over a flat colour.
// The core is the untouched bitmap — this mark carries its own colours, so it
// is drawn as-is rather than flattened to white.
const maskStyle = (logo: string): React.CSSProperties => ({
  WebkitMaskImage: `url(${staticFile(logo)})`,
  maskImage: `url(${staticFile(logo)})`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
});

const LaLogoCoreMemory: React.FC<LaLogoCoreMemoryProps> = ({
  logo,
  logoWidth,
  logoAspect,
  shadowOffset,
  rise,
  staggerFrames,
}) => {
  const frame = useCurrentFrame();

  const logoHeight = logoWidth / logoAspect;

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

  // The logo goes last, so it is still low while the colours are landing.
  const coreDelay = TRAIL_COLORS.length * staggerFrames;
  const coreOffset = offsetAt(coreDelay);

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: logoWidth, height: logoHeight}}>
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
                ...maskStyle(logo),
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
                ...maskStyle(logo),
              }}
            />

            {/* Core: the artwork itself, colours untouched, on top of all. */}
            <Img
              src={staticFile(logo)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: TRAIL_COLORS.length + 1,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                translate: `0px ${coreOffset}px`,
              }}
            />
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default LaLogoCoreMemory;
