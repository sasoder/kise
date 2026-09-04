import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  logo: z.string(),
  logoWidth: z.number().min(240).max(1040),
  logoAspect: z.number().min(0.2).max(8),
});

export type CoreLogoChannelSplitProps = z.infer<typeof schema>;

export const defaultProps: CoreLogoChannelSplitProps = schema.parse({
  logo: 'core.png',
  logoWidth: 900,
  logoAspect: 572 / 218,
});

// "core memory podcast style" channel split: tinted copies start BELOW the core
// and rise into it, blooming and then fading fully so only the artwork remains.
const SPLIT_LAYERS = [
  {color: '#FF5E1A', mult: 1.7}, // orange (furthest below)
  {color: '#D6189E', mult: 0.9}, // magenta
  {color: '#3A1FE0', mult: 1.3}, // indigo
  {color: '#6A5BFF', mult: 0.55}, // periwinkle (closest)
];
const MAX_SPLIT = 90;

// The copies are the logo's own alpha used as a mask over a flat colour, so the
// supplied artwork itself is never recoloured — it stays the untouched core.
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

const CoreLogoChannelSplit: React.FC<CoreLogoChannelSplitProps> = ({
  logo,
  logoWidth,
  logoAspect,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: {damping: 29, stiffness: 42, mass: 1},
  });

  const split = interpolate(enter, [0, 1], [MAX_SPLIT, 0], {
    extrapolateRight: 'clamp',
  });
  // The core is a solid silhouette, so the copies only read where they sit
  // proud of it: they hold their offset longer and sit slightly oversized.
  const fringeOpacity = interpolate(enter, [0, 0.3, 0.88], [0.75, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fringeScale = interpolate(enter, [0, 1], [1.05, 1], {
    extrapolateRight: 'clamp',
  });
  const bloom = interpolate(enter, [0, 0.4, 0.88], [12, 16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(enter, [0, 0.35], [0.4, 1], {
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(enter, [0, 1], [60, 0], {
    extrapolateRight: 'clamp',
  });
  // The spring overshoots, so the logo lands with a small snap past full size.
  const pop = interpolate(enter, [0, 1], [0.86, 1], {
    extrapolateRight: 'clamp',
  });

  const logoHeight = logoWidth / logoAspect;

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: logoWidth,
          height: logoHeight,
          opacity,
          translate: `0px ${rise}px`,
          scale: `${pop}`,
          filter: 'saturate(1.6)',
        }}
      >
        {SPLIT_LAYERS.map((layer) => (
          <div
            key={layer.color}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: fringeOpacity,
              mixBlendMode: 'screen',
              translate: `0px ${split * layer.mult}px`,
              scale: `${fringeScale}`,
              filter: `drop-shadow(0 0 ${bloom}px ${layer.color})`,
            }}
          >
            {/* Mask sits on an inner node so the bloom is not clipped by it. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: layer.color,
                ...maskStyle(logo),
              }}
            />
          </div>
        ))}

        {/* Core: the supplied artwork, untouched. */}
        <Img
          src={staticFile(logo)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default CoreLogoChannelSplit;
