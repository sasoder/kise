import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  logo: z.string(),
  logoWidth: z.number().min(240).max(1040),
  logoAspect: z.number().min(0.2).max(12),
  coreColor: z.string(),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
});

export type CoreMemoryEntranceProps = z.infer<typeof schema>;

// Per-artwork props. Only the file, its size and the shadow offset change: the
// shadow is ~1.8% of the artwork for solid glyphs, but has to drop well under
// that for thin strokes or it swallows them.
export const makeProps = (
  overrides: Partial<CoreMemoryEntranceProps> &
    Pick<CoreMemoryEntranceProps, 'logo' | 'logoWidth' | 'logoAspect'>,
): CoreMemoryEntranceProps =>
  schema.parse({
    coreColor: '#FFFFFF',
    shadowOffset: 10,
    rise: 130,
    staggerFrames: 2,
    ...overrides,
  });

export const defaultProps = makeProps({
  logo: 'nyt.png',
  logoWidth: 960,
  logoAspect: 3777 / 535,
  // Blackletter masthead: hairlines and tight counters, so the hard shadow sits
  // far under the 1.8% used for chunky glyphs or it fills the letterforms in.
  shadowOffset: 4,
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

// The artwork is a flat mark on alpha, so every layer is the artwork's own alpha
// used as a mask over a flat colour rather than a recoloured bitmap.
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

const CoreMemoryEntrance: React.FC<CoreMemoryEntranceProps> = ({
  logo,
  logoWidth,
  logoAspect,
  coreColor,
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

  // The white mark goes last, so it is still low while the colours are landing.
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

            {/* Core: the artwork's own alpha over flat white, on top of all. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: TRAIL_COLORS.length + 1,
                translate: `0px ${coreOffset}px`,
                backgroundColor: coreColor,
                ...maskStyle(logo),
              }}
            />
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default CoreMemoryEntrance;
