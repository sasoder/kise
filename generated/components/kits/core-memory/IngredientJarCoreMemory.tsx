import React from 'react';
import {
  AbsoluteFill,
  Easing,
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
  entranceFrames: z.number().int().min(8).max(60),
  loopFrames: z.number().int().min(24).max(240),
  splitAmount: z.number().min(0).max(120),
  shadowOffset: z.number().min(0).max(48),
  slideUp: z.number().min(0).max(300),
  wispCount: z.number().int().min(0).max(8),
  sway: z.number().min(0).max(2),
  liveliness: z.number().min(0).max(2),
});

export type IngredientJarCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: IngredientJarCoreMemoryProps = schema.parse({
  icon: 'ingredient.png',
  // Sized so the split keeps the reference's ratio (64px on a 300px icon) and
  // the orange copy still has room to fall inside the 1080 canvas.
  iconSize: 460,
  entranceFrames: 36,
  loopFrames: 96,
  splitAmount: 100,
  shadowOffset: 15,
  slideUp: 90,
  wispCount: 3,
  sway: 0.4,
  liveliness: 1,
});

// "core memory podcast style" — boosted chromatic split, bottom-to-up. These are
// the ICON multipliers (wider spread than the text variant): on a large solid
// silhouette the copies overlap almost entirely, and a narrow spread just
// screens together into one pink halo instead of reading as separate channels.
const SPLIT_LAYERS = [
  {color: '#FF5E1A', mult: 2.4}, // orange, trails lowest
  {color: '#D6189E', mult: 1.6}, // magenta
  {color: '#3A1FE0', mult: 1.0}, // indigo
  {color: '#6A5BFF', mult: 0.55}, // periwinkle, closest to core
];

const CORE_COLOR = '#FFFFFF';
const SHADOW_COLOR = '#000000';

// Geometry read off the source icon, in its own 512x512 space.
const CAP_LEFT = 180;
const CAP_RIGHT = 332;
// Wisps are born behind the cap so the artwork occludes them until they clear
// the lid — they read as coming out of the jar rather than appearing above it.
const WISP_BIRTH_Y = 60;
const WISP_DEATH_Y = -110;
const WISP_POINTS = 14;

// Stable per-element scatter: organic spread that never flickers frame to frame.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

type Wisp = {key: number; d: string; width: number; opacity: number};

const IngredientJarCoreMemory: React.FC<IngredientJarCoreMemoryProps> = ({
  icon,
  iconSize,
  entranceFrames,
  loopFrames,
  splitAmount,
  shadowOffset,
  slideUp,
  wispCount,
  sway,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const src = staticFile(icon);

  // --- Entrance -----------------------------------------------------------
  // Pinned to exactly 1 once the entrance is over. An overdamped spring only
  // approaches its resting value, so without this the first loop frame sits a
  // fraction of a pixel off the last one and the loop point pops.
  const enter =
    frame >= entranceFrames
      ? 1
      : spring({
          frame,
          fps,
          durationInFrames: entranceFrames,
          config: {damping: 30, stiffness: 90, mass: 0.95},
        });

  // The chromatic phase runs on its own ramp rather than the spring. On the
  // spring alone it is spent inside the first third of the entrance while the
  // slide is still travelling, so the split barely registers; inOut spreads it
  // across the whole window.
  const chroma = Easing.inOut(Easing.quad)(
    interpolate(frame, [0, entranceFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  const split = interpolate(chroma, [0, 1], [splitAmount, 0], {
    extrapolateRight: 'clamp',
  });
  const bloom = interpolate(chroma, [0, 1], [22, 0], {
    extrapolateRight: 'clamp',
  });
  const fringeOpacity = interpolate(chroma, [0, 0.4, 0.9], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The whole group rises into place, fading and settling out of a slight
  // undersize — the copies converging is only half the entrance.
  const groupOpacity = interpolate(enter, [0, 0.35], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(enter, [0, 1], [slideUp, 0], {
    extrapolateRight: 'clamp',
  });
  const settleScale = interpolate(enter, [0, 1], [0.92, 1], {
    extrapolateRight: 'clamp',
  });

  // --- Idle ---------------------------------------------------------------
  // One normalised cycle, phased so it hits 0 exactly at the end of the
  // entrance. Frames [entranceFrames, entranceFrames + loopFrames) are then a
  // seamless loop, and the entrance plays over the cycle's pre-roll so the idle
  // is already in flight when the split converges.
  const t = (((frame - entranceFrames) % loopFrames) + loopFrames) % loopFrames;
  const cycle = t / loopFrames;

  // Overlapped handoff: idle amplitude ramps up underneath the converging
  // split, so the jar lands already breathing instead of starting from rest.
  const idle = interpolate(enter, [0.15, 0.85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const swayWave = Math.sin(cycle * Math.PI * 2);
  const breath = Math.sin(cycle * Math.PI * 4);
  const amp = idle * liveliness;

  const wisps: Wisp[] = [];
  for (let i = 0; i < wispCount; i++) {
    const phase = i / wispCount;
    const p = (cycle + phase) % 1;

    // Rises off the lid quickly, then slows as it dissipates.
    const travel = Easing.out(Easing.quad)(p);
    const headY = WISP_BIRTH_Y + travel * (WISP_DEATH_Y - WISP_BIRTH_Y);
    const ribbon = 46 + hash(i, 1) * 26;
    const cx = interpolate(hash(i, 2), [0, 1], [CAP_LEFT + 18, CAP_RIGHT - 18]);
    const twist = hash(i, 3) * Math.PI * 2;

    const points: string[] = [];
    for (let j = 0; j <= WISP_POINTS; j++) {
      const along = j / WISP_POINTS; // 0 = tail (lower), 1 = head (upper)
      const y = headY + ribbon * (1 - along);
      // How far up its path this point sits (0 at the lid, 1 where it dies).
      const up = Math.min(
        1,
        Math.max(0, (y - WISP_BIRTH_Y) / (WISP_DEATH_Y - WISP_BIRTH_Y)),
      );
      // The curl widens as the wisp climbs, like heat losing its column.
      const curl = (5 + 17 * up) * amp;
      const x = cx + curl * Math.sin(up * Math.PI * 2.2 + twist);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    wisps.push({
      key: i,
      d: `M${points.join(' L')}`,
      width: interpolate(p, [0, 1], [8, 3]),
      // Fully dead before the end of its life, not merely at it: at p = 1 the
      // ribbon teleports from the top of its path back to the lid, so it has
      // to be invisible for the last stretch or that jump shows at the loop.
      opacity:
        interpolate(p, [0, 0.14, 0.62, 0.94], [0, 0.85, 0.55, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * amp,
    });
  }

  // The icon's own alpha is the mask for every copy: a PNG cannot inherit a
  // colour the way the text variant of this style does.
  const maskStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    WebkitMaskImage: `url("${src}")`,
    maskImage: `url("${src}")`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  };

  const svgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
  };

  const renderWisps = (color: string) => (
    <svg style={svgStyle} viewBox="0 0 512 512">
      {wisps.map((wisp) => (
        <path
          key={`wisp-${wisp.key}`}
          d={wisp.d}
          fill="none"
          stroke={color}
          strokeWidth={wisp.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={wisp.opacity}
        />
      ))}
    </svg>
  );

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          opacity: groupOpacity,
          transform: `translateY(${rise}px) scale(${settleScale})`,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: iconSize,
            height: iconSize,
            rotate: `${swayWave * 1.1 * sway * amp}deg`,
            scale: `${1 - breath * 0.006 * sway * amp} ${
              1 + breath * 0.012 * sway * amp
            }`,
            translate: `0px ${swayWave * 3 * sway * amp}px`,
          }}
        >
          {/* Wisps sit behind the artwork, each with the same hard offset
              shadow as the jar so they read over any background. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${shadowOffset}px, ${shadowOffset}px)`,
            }}
          >
            {renderWisps(SHADOW_COLOR)}
          </div>
          {renderWisps(CORE_COLOR)}

          {SPLIT_LAYERS.map((layer) => (
            <div
              key={layer.color}
              style={{
                ...maskStyle,
                backgroundColor: layer.color,
                mixBlendMode: 'screen',
                filter: `saturate(1.6) drop-shadow(0 0 ${bloom}px ${layer.color})`,
                opacity: fringeOpacity,
                transform: `translateY(${split * layer.mult}px)`,
              }}
            />
          ))}

          {/* Hard offset duplicate: zero blur, pure black — readability, not
              a soft drop shadow. */}
          <div
            style={{
              ...maskStyle,
              backgroundColor: SHADOW_COLOR,
              transform: `translate(${shadowOffset}px, ${shadowOffset}px)`,
            }}
          />
          <div style={{...maskStyle, backgroundColor: CORE_COLOR}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default IngredientJarCoreMemory;
