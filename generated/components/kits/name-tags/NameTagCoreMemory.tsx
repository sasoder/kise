import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';

/**
 * NameTagCoreMemory — transparent 1080x1920 lower-third name tag in the current
 * "core memory podcast style".
 *
 * Layout is the approved NameTag.tsx layout (bottom-left at left 84 / bottom
 * 300, black bar at 50%, Barlow 800/88 name over Barlow 700/42 job). The
 * entrance is the current core memory type entrance, copied from
 * OutNowCoreMemory.tsx / VastLogoChannelSplit.tsx / coreMemoryIcon.tsx:
 * flat chain colours cutting in one at a time and sliding up into a white
 * core. No blend mode, no bloom, no filter, and no opacity fade on any text
 * layer — the bar is the only thing that fades.
 *
 * NameTag.tsx keeps the OLD entrance (converging fringes, bloom, screen blend,
 * springs) and is deliberately left untouched.
 *
 * Stack per line, back to front:
 *   black hard shadow (rides the core's timing) -> #FFB765 orange ->
 *   #BC37FF purple -> #0046FF blue -> #FFFFFF core
 *
 * Frame table (24fps, 96 frames):
 *   bar        0 -> 16   (slide up 64px + opacity 0 -> 1)
 *   name       orange 2  purple 4  blue 6  core/shadow 8   landing 24/26/28/30
 *   job        orange 9  purple 11 blue 13 core/shadow 15  landing 31/33/35/37
 *   37 -> 95   static hold, no outro, no idle motion
 *
 * The three colour layers stop rendering once that line's core has landed
 * (core start + 22), so the rest state is white + shadow with no antialiasing
 * fringe.
 */

const {fontFamily} = loadFont('normal', {
  weights: ['700', '800'],
  subsets: ['latin'],
});

export const FPS = 24;
export const DURATION = 96;

export const schema = z.object({
  name: z.string(),
  job: z.string(),
});

export type NameTagCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: NameTagCoreMemoryProps = schema.parse({
  name: 'Jeff Dean',
  job: 'Google’s AI godfather',
});

// ---- Layout (identical to NameTag.tsx) ----
const LEFT = 84;
const BOTTOM = 300;

// ---- Core memory entrance constants ----
const CHAIN_COLORS = ['#FFB765', '#BC37FF', '#0046FF'] as const;
const CORE_COLOR = '#FFFFFF';
const SHADOW_COLOR = '#000000';
const RISE = 130;
const TRAVEL_FRAMES = 22;
const STAGGER_FRAMES = 2;
const CORE_STAGGER = CHAIN_COLORS.length * STAGGER_FRAMES; // 6

// ---- Bar ----
const BAR_TRAVEL = 16;
const BAR_RISE = 64;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const Line: React.FC<{
  delay: number;
  fontSize: number;
  fontWeight: number;
  shadowOffset: number;
  text: string;
}> = ({delay, fontSize, fontWeight, shadowOffset, text}) => {
  const frame = useCurrentFrame();

  // One shared slide, sampled at a different start frame per layer: quick off
  // the mark, then a long ease into place. Nothing fades.
  const offsetAt = (start: number) => {
    const t = interpolate(frame, [start, start + TRAVEL_FRAMES], [0, 1], {
      easing: EASE,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (1 - t) * RISE;
  };

  // A layer simply does not exist until its turn — they cut in one at a time.
  const hasStarted = (start: number) => frame >= start;

  const coreStart = delay + CORE_STAGGER;
  const coreOffset = offsetAt(coreStart);
  // Once the core has landed the colours are exactly behind it; dropping them
  // guarantees no coloured fringe at glyph edges in the rest state.
  const showColors = frame <= coreStart + TRAVEL_FRAMES;

  const typeStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight: 1.08,
    letterSpacing: -1,
    whiteSpace: 'nowrap',
  };

  const layerStyle: React.CSSProperties = {
    ...typeStyle,
    position: 'absolute',
    left: 0,
    top: 0,
  };

  return (
    <div style={{position: 'relative'}}>
      {/* In-flow copy that sizes the box (and therefore the bar). It paints
          nothing; every visible layer is absolutely positioned on top of it. */}
      <div style={{...typeStyle, visibility: 'hidden'}}>{text}</div>

      {hasStarted(coreStart) ? (
        // Hard readability shadow at the very back, zero blur, riding the core.
        <div
          style={{
            ...layerStyle,
            zIndex: 0,
            translate: `${shadowOffset}px ${coreOffset + shadowOffset}px`,
            color: SHADOW_COLOR,
          }}
        >
          {text}
        </div>
      ) : null}

      {showColors
        ? CHAIN_COLORS.map((color, i) =>
            hasStarted(delay + i * STAGGER_FRAMES) ? (
              <div
                key={color}
                style={{
                  ...layerStyle,
                  zIndex: i + 1,
                  translate: `0px ${offsetAt(delay + i * STAGGER_FRAMES)}px`,
                  color,
                }}
              >
                {text}
              </div>
            ) : null,
          )
        : null}

      {hasStarted(coreStart) ? (
        // Core: the white mark, last to arrive and on top of all.
        <div
          style={{
            ...layerStyle,
            zIndex: CHAIN_COLORS.length + 1,
            translate: `0px ${coreOffset}px`,
            color: CORE_COLOR,
          }}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
};

const NameTagCoreMemory: React.FC<NameTagCoreMemoryProps> = ({name, job}) => {
  const frame = useCurrentFrame();

  // The bar is the only thing in the piece that fades.
  const barEnter = interpolate(frame, [0, BAR_TRAVEL], [0, 1], {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const barSlide = (1 - barEnter) * BAR_RISE;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: LEFT, bottom: BOTTOM}}>
        <div style={{position: 'relative', display: 'inline-block'}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 10,
              opacity: barEnter,
              transform: `translateY(${barSlide}px)`,
            }}
          />
          <div style={{position: 'relative', padding: '34px 52px 38px 52px'}}>
            <Line
              delay={2}
              fontSize={88}
              fontWeight={800}
              shadowOffset={3}
              text={name}
            />
            <div style={{height: 10}} />
            <Line
              delay={9}
              fontSize={42}
              fontWeight={700}
              shadowOffset={2}
              text={job}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default NameTagCoreMemory;
