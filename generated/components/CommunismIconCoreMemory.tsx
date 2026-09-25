import React from 'react';
import {useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  COMMUNISM_IN_FRAMES,
  CoreMemoryIconStack,
  coreMemoryTiming,
  SHADOW_OFFSET,
  TAU,
} from './coreMemoryIcon';

// Hammer and sickle icon — CORE MEMORY PODCAST STYLE.
//
// A sister to ServerIconCoreMemory, on the same PNG alpha-mask route: the
// artwork is public/communism-icon.png, white on alpha, and every layer of the
// shared stack (shadow, orange, purple, blue, white core) is a flat colour
// wearing that PNG's alpha. Nothing inside the glyph moves, so there is no
// renderLayer and no flair. Transparent overlay asset, white ink.
//
// Artwork: Wikimedia Commons "Hammer and sickle.svg" (public domain), fetched
// from Special:FilePath. Its red background square was dropped and its two
// paths (hammer, sickle) filled plain white; nothing else was changed. The
// glyph's bounds are a 512x512 square in the file's own units, rendered to a
// 1024x1024 PNG at 896 px with 64 px of even padding all round.
//
// The motion, complete — nothing else happens:
//  1. Entrance (In clip only, f0-f28). The shared core memory slide-up: orange
//     at f0, purple f2, blue f4, white core f6, each rising 130px over 22
//     frames on bezier(0.16, 1, 0.3, 1), nothing fading. The hard black shadow
//     (zero blur, down-right) sits at the very back on the core's timing. The
//     colour layers are not rendered after blue lands (f26), so the rest state
//     has no fringe. See coreMemoryIcon.tsx.
//  2. Whole-icon breath, the siblings' restrained one: a volume-preserving
//     squash (x +0.6% / y -0.9%), one cycle per loop, scaled by `liveliness`,
//     anchored at the foot of the glyph so it breathes off the ground. No
//     rotation, no sway, no flair: the emblem does not wave or sparkle.
//
// Placement: the glyph's ink sits low and to the right of its bounding box
// (the sickle's bowl and the hammer's handle carry the weight), so the whole
// stack is moved up and left by half of that centroid offset — optical, not
// geometric, centring. See OPTICAL_*.
//
// Everything is driven off one normalised `cycle`. In the In clip that cycle
// runs off `frame - 48`, so In f47 is loop frame 95 and Loop f0 is loop frame
// 0: cutting from the In clip into the looping clip is an ordinary
// adjacent-frame step.

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  /** 'in' plays the entrance once; 'loop' is the seamless rest state. */
  mode: z.enum(['in', 'loop']),
  /** Hard shadow offset in canvas px, down and right. */
  shadowOffset: z.number().min(0).max(48),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(2),
});

export type CommunismIconCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: CommunismIconCoreMemoryProps = schema.parse({
  icon: 'communism-icon.png',
  iconSize: 760,
  mode: 'loop',
  shadowOffset: SHADOW_OFFSET,
  liveliness: 1,
});

// Measured from public/communism-icon.png's alpha, as fractions of the PNG.
// Ink bounds 64..959 on both axes (centre 0.5); alpha centroid (546.6, 585.3)
// of 1024, i.e. +0.0343 / +0.0721 off centre. Half of it is taken back.
const OPTICAL_X = -0.0171;
const OPTICAL_Y = -0.036;
/** Foot of the glyph (bottom of its ink), the breath's anchor. */
const FOOT_X = 0.5;
const FOOT_Y = 960 / 1024;

const CommunismIconCoreMemory: React.FC<CommunismIconCoreMemoryProps> = ({
  icon,
  iconSize,
  mode,
  shadowOffset,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const timing = coreMemoryTiming(mode, frame, COMMUNISM_IN_FRAMES);
  const {cycle} = timing;

  // Volume-preserving breathing squash off the foot, one cycle per loop.
  const breath = Math.sin(TAU * cycle) * liveliness;
  const sx = 1 + breath * 0.006;
  const sy = 1 - breath * 0.009;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          translate: `${OPTICAL_X * iconSize}px ${OPTICAL_Y * iconSize}px`,
        }}
      >
        <CoreMemoryIconStack
          icon={icon}
          iconSize={iconSize}
          frame={frame}
          timing={timing}
          shadowOffset={shadowOffset}
          transformOrigin={`${FOOT_X * 100}% ${FOOT_Y * 100}%`}
          transform={`scale(${sx}, ${sy})`}
          flair={null}
        />
      </div>
    </div>
  );
};

export default CommunismIconCoreMemory;
