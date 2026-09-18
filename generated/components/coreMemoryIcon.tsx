import React from 'react';
import {Easing, interpolate, staticFile} from 'remotion';

// Shared "core memory podcast style" layer stack for the icon loops.
//
// The style, exactly as the user defined it (2026-08-12, canonical reference
// generated/components/VastLogoChannelSplit.tsx):
//
//  - The artwork's own silhouette, repeated in the CORE MEMORY chain colours,
//    each copy sliding UP into place one after the other and ending perfectly
//    stacked so only the white core and its hard shadow remain.
//  - Colours are used RAW: no bloom, no blend mode, no filter. NOTHING FADES —
//    a layer either exists or is not rendered at all.
//  - Stack back to front: hard black shadow -> orange -> purple -> blue ->
//    white core.
//  - Arrival order orange (f0), purple (f2), blue (f4), core (f6); every layer
//    travels the same 130px over 22 frames on Easing.bezier(0.16, 1, 0.3, 1).
//
// Technique, copied from VastLogoChannelSplit: the supplied PNG is NEVER
// recoloured. Each layer is one node whose background is a flat colour and
// whose `mask-image` is the PNG's own alpha. So the icon becomes white by
// construction, and the transparent holes in the artwork (server LEDs and
// slots, the radiation trefoils) stay holes in every layer.
//
// Rest state — the one deliberate departure from VastLogoChannelSplit, and
// why: that component leaves the three colour layers rendered forever, sitting
// exactly under the core. Because every layer shares the same antialiased mask,
// an edge pixel of alpha a composites as white*a over colour*a*(1-a), which
// leaves a coloured fringe all round the mark. On a logo sting that never
// matters (the piece ends), but these are looping overlay assets that sit at
// rest for 96 frames and breathe, so the fringe would be the thing you notice.
// The colour layers are therefore not rendered once the last of them has landed
// (frame > LAST_COLOR_LAND): by then the core is 0.26px off its mark, so
// nothing visible changes, and the rest state is provably neutral.

/** The CORE MEMORY chain, sampled from public/core.png and used raw. */
export const CHAIN_COLORS = ['#FFB765', '#BC37FF', '#0046FF'] as const;
export const CORE_COLOR = '#FFFFFF';

/** Every layer slides up this far, in canvas px. */
export const RISE = 130;
export const TRAVEL_FRAMES = 22;
export const STAGGER_FRAMES = 2;
/** The core goes last, after all three colours have set off. */
export const CORE_DELAY = CHAIN_COLORS.length * STAGGER_FRAMES; // 6
export const CORE_LAND = CORE_DELAY + TRAVEL_FRAMES; // 28
/** Blue, the last colour, is home here. */
export const LAST_COLOR_LAND =
  (CHAIN_COLORS.length - 1) * STAGGER_FRAMES + TRAVEL_FRAMES; // 26

/** Hard readability shadow: pure black, zero blur, down-right, at the back. */
export const SHADOW_OFFSET = 6;

/** One loop of the approved subtle motion. */
export const LOOP_FRAMES = 96;
/** The In clip is the entrance plus enough of the loop to hand over cleanly. */
export const SERVER_IN_FRAMES = 48;
/** The plume needs a full puff lifetime to build, so: landing + one loop. */
export const POWER_IN_FRAMES = CORE_LAND + LOOP_FRAMES; // 124
/** The clock's hands are already spinning on the way in, so: same as the rack. */
export const CLOCK_IN_FRAMES = 48;

const TAU = Math.PI * 2;
export {TAU};

export type IconMode = 'in' | 'loop';

/** The PNG's alpha as a mask over a flat colour — never a recoloured bitmap. */
export const maskStyle = (icon: string): React.CSSProperties => ({
  WebkitMaskImage: `url(${staticFile(icon)})`,
  maskImage: `url(${staticFile(icon)})`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
});

/** One shared slide, sampled at a different start frame per layer. */
export const slideOffset = (frame: number, delay: number) => {
  const t = interpolate(frame, [delay, delay + TRAVEL_FRAMES], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (1 - t) * RISE;
};

const mod = (a: number, n: number) => ((a % n) + n) % n;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Ease-out ramp used by the boot-up builds (meters, trefoils). */
export const bootRamp = (sinceLand: number, frames: number) =>
  1 - Math.pow(1 - clamp01(sinceLand / frames), 3);

export type CoreMemoryTiming = {
  /** Normalised position in the 96-frame loop; drives ALL subtle motion. */
  cycle: number;
  /** Slide offset of the core (and of the flair riding with it), in px. */
  coreOffset: number;
  coreStarted: boolean;
  /** Frames since the core landed. Infinity in loop mode (always at rest). */
  sinceLand: number;
  mode: IconMode;
};

/**
 * In the In clip the loop maths runs off `frame - inFrames`, so the clip's last
 * frame is loop frame 95 and the Loop clip's frame 0 is loop frame 0 — an
 * ordinary adjacent-frame step when the editor cuts from one to the other.
 */
export const coreMemoryTiming = (
  mode: IconMode,
  frame: number,
  inFrames: number,
): CoreMemoryTiming => {
  if (mode === 'loop') {
    return {
      cycle: mod(frame, LOOP_FRAMES) / LOOP_FRAMES,
      coreOffset: 0,
      coreStarted: true,
      sinceLand: Number.POSITIVE_INFINITY,
      mode,
    };
  }
  return {
    cycle: mod(frame - inFrames, LOOP_FRAMES) / LOOP_FRAMES,
    coreOffset: slideOffset(frame, CORE_DELAY),
    coreStarted: frame >= CORE_DELAY,
    sinceLand: frame - CORE_LAND,
    mode,
  };
};

export type CoreMemoryIconStackProps = {
  /** The PNG whose alpha masks every layer. Omitted only when `renderLayer` is. */
  icon?: string;
  iconSize: number;
  frame: number;
  timing: CoreMemoryTiming;
  shadowOffset: number;
  /** transform-origin of the breath, as a CSS string. */
  transformOrigin: string;
  /** The breath transform for the whole stack. */
  transform: string;
  /**
   * Flair drawn BELOW the white core, so the core's own silhouette masks it
   * exactly the way the opaque PNG did in the approved loops.
   */
  flair: React.ReactNode;
  /**
   * Drawn-from-scratch icons (the clock, whose HANDS move) cannot be a static
   * PNG alpha mask, so they supply their silhouette AT THE CURRENT FRAME as
   * inline SVG in one flat colour instead. Every layer calls this with its own
   * colour on the same frame, so the copies are identical shapes and the chain
   * still vanishes behind the core exactly as the masked version does.
   */
  renderLayer?: (color: string) => React.ReactNode;
};

/**
 * The whole stack — shadow, chain colours, flair, core — inside ONE wrapper
 * carrying the breath, so nothing can shear apart.
 */
export const CoreMemoryIconStack: React.FC<CoreMemoryIconStackProps> = ({
  icon,
  iconSize,
  frame,
  timing,
  shadowOffset,
  transformOrigin,
  transform,
  flair,
  renderLayer,
}) => {
  const {coreOffset, coreStarted, mode} = timing;
  const mask = icon ? maskStyle(icon) : undefined;
  const showColors = mode === 'in' && frame <= LAST_COLOR_LAND;
  /**
   * One layer's ink. The masked path is untouched: a flat colour wearing the
   * PNG's alpha. The drawn path leaves the node transparent and puts the
   * silhouette inside it instead.
   */
  const ink = (color: string): React.CSSProperties =>
    renderLayer ? {} : {backgroundColor: color, ...mask};

  return (
    <div
      style={{
        position: 'relative',
        width: iconSize,
        height: iconSize,
        transformOrigin,
        transform,
      }}
    >
      {/* Hard shadow: a pure black copy of the core silhouette, zero blur, at
          the very back so it never darkens the colours, and riding on the
          core's own timing. */}
      {coreStarted ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            translate: `${shadowOffset}px ${coreOffset + shadowOffset}px`,
            ...ink('#000000'),
          }}
        >
          {renderLayer ? renderLayer('#000000') : null}
        </div>
      ) : null}

      {/* The chain, in arrival order and stacked the same way. Nothing fades,
          so a layer simply is not rendered before its start frame. */}
      {showColors
        ? CHAIN_COLORS.map((color, i) =>
            frame >= i * STAGGER_FRAMES ? (
              <div
                key={color}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: i + 1,
                  translate: `0px ${slideOffset(frame, i * STAGGER_FRAMES)}px`,
                  ...ink(color),
                }}
              >
                {renderLayer ? renderLayer(color) : null}
              </div>
            ) : null,
          )
        : null}

      {/* Flair, riding inside the core's slide so it never separates from it. */}
      {coreStarted ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: CHAIN_COLORS.length + 1,
            translate: `0px ${coreOffset}px`,
          }}
        >
          {flair}
        </div>
      ) : null}

      {/* Core: the artwork's own alpha over flat white, on top of all of it. */}
      {coreStarted ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: CHAIN_COLORS.length + 2,
            translate: `0px ${coreOffset}px`,
            ...ink(CORE_COLOR),
          }}
        >
          {renderLayer ? renderLayer(CORE_COLOR) : null}
        </div>
      ) : null}
    </div>
  );
};
