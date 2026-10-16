import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  coreColor: z.string(),
  shadowOffset: z.number().min(0).max(48),
  liveliness: z.number().min(0).max(2),
});

export type MicrobeIconChannelSplitProps = z.infer<typeof schema>;

export const defaultProps: MicrobeIconChannelSplitProps = schema.parse({
  icon: 'microbe.png',
  iconSize: 660,
  coreColor: '#FFFFFF',
  shadowOffset: 12,
  liveliness: 1,
});

// "core memory podcast style" channel split: copies start BELOW the core and
// rise into it, blooming and then fading fully so one clean core remains.
const SPLIT_LAYERS = [
  {color: '#FF5E1A', mult: 1.7}, // orange (furthest below)
  {color: '#D6189E', mult: 0.9}, // magenta
  {color: '#3A1FE0', mult: 1.3}, // indigo
  {color: '#6A5BFF', mult: 0.55}, // periwinkle (closest)
];
// Sized so the furthest copy (1.7x) still clears the bottom of the canvas at
// the widest point of the split.
const MAX_SPLIT = 110;

// The artwork is a black glyph on alpha, so every layer is the icon's own alpha
// used as a mask over a flat color rather than a recolored bitmap.
const maskStyle = (icon: string): React.CSSProperties => ({
  WebkitMaskImage: `url(${staticFile(icon)})`,
  maskImage: `url(${staticFile(icon)})`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
});

const MicrobeIconChannelSplit: React.FC<MicrobeIconChannelSplitProps> = ({
  icon,
  iconSize,
  coreColor,
  shadowOffset,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: {damping: 30, stiffness: 62, mass: 1},
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
  const rise = interpolate(enter, [0, 1], [70, 0], {
    extrapolateRight: 'clamp',
  });
  // The spring overshoots, so the icon lands with a small snap past full size.
  const pop = interpolate(enter, [0, 1], [0.82, 1], {
    extrapolateRight: 'clamp',
  });

  // Idle: something alive under a slide. Slow drifting rotation, a swimming
  // figure-eight, and a membrane pulse — no jitter, this thing is not angry.
  const t = frame / fps;
  const alive = interpolate(frame, [8, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const amp = liveliness * alive;

  const driftX = Math.sin(t * Math.PI * 2 * 0.42) * 9 * amp;
  const driftY = Math.sin(t * Math.PI * 2 * 0.84 + 0.7) * 5 * amp;
  const roll =
    (Math.sin(t * Math.PI * 2 * 0.33) * 1.6 +
      Math.sin(t * Math.PI * 2 * 0.71 + 1.9) * 0.7) *
    amp;
  // Volume-preserving membrane pulse, slightly off-phase in x and y so it
  // reads as a soft body rather than a scaling logo.
  const pulse = Math.sin(t * Math.PI * 2 * 1.15);
  const pulseY = Math.sin(t * Math.PI * 2 * 1.15 + 0.9);
  const membraneX = 1 + pulse * 0.022 * amp;
  const membraneY = 1 - pulseY * 0.016 * amp;

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          opacity,
          translate: `${driftX}px ${rise + driftY}px`,
          rotate: `${roll}deg`,
          scale: `${pop * membraneX} ${pop * membraneY}`,
          filter: 'saturate(1.6)',
        }}
      >
        {/* The house readability shadow: the same artwork turned pure black and
            offset a few px with ZERO blur, sitting behind everything. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#000000',
            translate: `${shadowOffset}px ${shadowOffset}px`,
            ...maskStyle(icon),
          }}
        />

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
                ...maskStyle(icon),
              }}
            />
          </div>
        ))}

        {/* Core: the artwork's own alpha over flat white. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: coreColor,
            ...maskStyle(icon),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default MicrobeIconChannelSplit;
