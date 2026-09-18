import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  bootRamp,
  CHAIN_COLORS,
  CoreMemoryIconStack,
  coreMemoryTiming,
  LOOP_FRAMES,
  SERVER_IN_FRAMES,
  SHADOW_OFFSET,
  TAU,
} from './coreMemoryIcon';

// Server rack icon — CORE MEMORY PODCAST STYLE.
//
// The approved ServerIconLoop, restated in the user's core memory style: the
// rack is WHITE with a hard black shadow, it arrives on the staggered chain
// slide-up (orange -> purple -> blue -> white core), and then the approved
// subtle motion carries on as a seamless loop. Transparent overlay asset for
// dark footage. ServerIconLoop itself is untouched; its measured geometry,
// hash, rhythms and placement are copied here verbatim.
//
// Motion, and why:
//  1. Entrance (In clip only, f0-f28). The shared core memory stack: four
//     copies of the artwork's own silhouette sliding up 130px over 22 frames,
//     two frames apart, nothing fading. See coreMemoryIcon.tsx.
//  2. Status LEDs, now the chain itself. The three LEDs are genuine
//     transparent holes in the artwork, so a flat disc of raw chain colour
//     behind each hole IS the lit LED: orange top, purple middle, blue bottom.
//     The chain that flew in becomes the thing that lives in the machine.
//     Nothing fades in this style, so a LED is a hard cut: the disc is
//     rendered (lit) or it is not (off). They are LIT almost all the time and
//     blink off for short dips, which keeps each unit's approved rhythm
//     character while inverting its polarity:
//       - top: a lub-dub heartbeat, two pairs of dips per loop (3f then 2f);
//       - middle: four hashed activity dips per loop (2-4f), same hash and the
//         same positions as the approved loop;
//       - bottom: one long slow standby dip per loop (8f), phase-offset.
//     Every window is an integer frame count inside the 96-frame loop, so the
//     loop is seamless, and the windows are disjoint enough that the three are
//     never off on the same frame (verified frame by frame).
//  3. Boot-up (In clip only). The LEDs are dark while the rack is in the air;
//     they come up one after another after the core lands — orange at +3,
//     purple at +5, blue at +7 — and then simply follow the loop rhythm.
//  4. Slot meters. The same mechanism and the same hashed levels as the
//     approved loop, drawn as flat WHITE at a constant 0.40 behind the slot
//     holes: a drive meter whose right edge travels between eased, hashed
//     targets, an integer number of steps per loop, clamped inside
//     [MIN, MAX] so a slot never closes. In the In clip they start empty and
//     rise to their running level over 14 frames after landing (ease out), so
//     the rack boots rather than appearing already busy.
//  5. Whole-icon breath, unchanged: no rotation (a rack does not sway), only a
//     volume-preserving squash (x +0.6% / y -0.9%) anchored at the feet, one
//     cycle per loop. It is applied to ONE wrapper holding the shadow, the
//     chain, the flair and the core, so nothing can shear apart.
//
// Everything subtle is driven off one normalised `cycle`. In the In clip that
// cycle runs off `frame - 48`, so In f47 is loop frame 95 and Loop f0 is loop
// frame 0: cutting from the In clip into the looping clip is an ordinary
// adjacent-frame step.

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  /** 'in' plays the entrance once; 'loop' is the seamless rest state. */
  mode: z.enum(['in', 'loop']),
  /** Hard shadow offset in canvas px, down and right. */
  shadowOffset: z.number().min(0).max(48),
  /** LEDs in the raw chain colours; false = white discs at 0.55. */
  ledColors: z.boolean(),
  /** Meter level changes per loop, one per rack unit (integers shut the loop). */
  meterSteps: z.array(z.number().int().min(1).max(12)).length(3),
  /** Short LED dips per loop for the middle (activity) unit. */
  activityBlinks: z.number().int().min(1).max(8),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(2),
});

export type ServerIconCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: ServerIconCoreMemoryProps = schema.parse({
  icon: 'server.png',
  iconSize: 760,
  mode: 'loop',
  shadowOffset: SHADOW_OFFSET,
  ledColors: true,
  meterSteps: [3, 6, 2],
  activityBlinks: 4,
  liveliness: 1,
});

// Geometry measured from the source PNG's alpha channel, in its own 512x512
// space — copied from the approved ServerIconLoop unchanged.
const VIEW = 512;
const LED_CX = 112;
const LED_R = 16;
const LED_CY = [96, 240, 384];
const SLOT_X0 = 304;
const SLOT_X1 = 432;
const SLOT_Y0 = 80;
const SLOT_Y1 = 112;
const SLOT_TOP = [80, 224, 368];
const SLOT_W = SLOT_X1 - SLOT_X0;
const SLOT_H = SLOT_Y1 - SLOT_Y0;

// The feet: the squash is anchored here so the rack breathes off the ground.
const FOOT_X = 256;
const FOOT_Y = 480;

/** The lit disc is a little wider than the hole so it fills it cleanly. */
const LED_PAD = 4;
/** Flat, constant translucency — a tone, not a fade. */
const SLOT_FILL = 0.4;
const METER_MIN = 0.16;
const METER_MAX = 0.78;
const METER_KEYS = [68, 109, 100];

/** Boot-up: LEDs come up one after another, in chain order. */
const LED_BOOT = [3, 5, 7];
const METER_BOOT_FRAMES = 14;

/** Stable hash: same value every loop, so nothing flickers frame to frame. */
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const smoothstep = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** An off window, in whole frames of the 96-frame loop. */
type Off = {at: number; len: number};

const isOff = (loopFrame: number, windows: readonly Off[]) =>
  windows.some((w) => {
    const x = ((loopFrame - w.at) % LOOP_FRAMES + LOOP_FRAMES) % LOOP_FRAMES;
    return x < w.len;
  });

// Top unit: the approved lub-dub, twice per loop, as hard off windows.
const HEARTBEAT_OFF: Off[] = [0, 1].flatMap((b) => [
  {at: b * (LOOP_FRAMES / 2) + 2, len: 3},
  {at: b * (LOOP_FRAMES / 2) + 10, len: 2},
]);
// Bottom unit: one long standby dip per loop, clear of both other units.
const STANDBY_OFF: Off[] = [{at: 21, len: 8}];

const ServerIconCoreMemory: React.FC<ServerIconCoreMemoryProps> = ({
  icon,
  iconSize,
  mode,
  shadowOffset,
  ledColors,
  meterSteps,
  activityBlinks,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const timing = coreMemoryTiming(mode, frame, SERVER_IN_FRAMES);
  const {cycle, sinceLand} = timing;
  const loopFrame = cycle * LOOP_FRAMES;

  // Middle unit: the approved hashed activity positions, quantised to whole
  // frames and turned into 2-4 frame off windows.
  const activityOff: Off[] = [];
  for (let i = 0; i < activityBlinks; i++) {
    activityOff.push({
      at: Math.round(
        ((i + 0.18 + 0.5 * hash(i, 3)) / activityBlinks) * LOOP_FRAMES,
      ),
      len: 2 + Math.round(2 * hash(i, 7)),
    });
  }

  const ledWindows: Off[][] = [HEARTBEAT_OFF, activityOff, STANDBY_OFF];

  const leds = LED_CY.map((cy, u) => {
    // Dark until this unit boots, then hard on/off on its own rhythm.
    const booted = mode === 'loop' || sinceLand >= LED_BOOT[u];
    const lit = booted && !isOff(loopFrame, ledWindows[u]) && liveliness > 0;
    return {
      cy,
      lit,
      fill: ledColors ? CHAIN_COLORS[u] : '#FFFFFF',
      opacity: ledColors ? 1 : 0.55,
    };
  });

  // Meters: identical maths to the approved loop, only the ink is different.
  const meterRamp =
    mode === 'loop' ? 1 : bootRamp(sinceLand, METER_BOOT_FRAMES);

  const slots = SLOT_TOP.map((y0, u) => {
    const steps = meterSteps[u];
    const p = cycle * steps + u * 0.37;
    const i = Math.floor(p);
    const f = smoothstep(
      interpolate(p - i, [0.15, 0.85], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
    const levelAt = (k: number) =>
      METER_MIN +
      (METER_MAX - METER_MIN) *
        hash(((k % steps) + steps) % steps, METER_KEYS[u]);
    const level = levelAt(i) + (levelAt(i + 1) - levelAt(i)) * f;
    return {y0, w: level * SLOT_W * meterRamp};
  });

  // Volume-preserving breathing squash off the feet, one cycle per loop.
  const breath = Math.sin(TAU * cycle) * liveliness;
  const sx = 1 + breath * 0.006;
  const sy = 1 - breath * 0.009;

  const flair = (
    <svg
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
    >
      {leds.map((led) =>
        led.lit ? (
          <circle
            key={`led-${led.cy}`}
            cx={LED_CX}
            cy={led.cy}
            r={LED_R + LED_PAD}
            fill={led.fill}
            opacity={led.opacity}
          />
        ) : null,
      )}
      {slots.map((slot) =>
        slot.w > 0.5 ? (
          <rect
            key={`slot-${slot.y0}`}
            x={SLOT_X0}
            y={slot.y0 - 2}
            width={slot.w}
            height={SLOT_H + 4}
            fill="#FFFFFF"
            opacity={SLOT_FILL}
          />
        ) : null,
      )}
    </svg>
  );

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
      <CoreMemoryIconStack
        icon={icon}
        iconSize={iconSize}
        frame={frame}
        timing={timing}
        shadowOffset={shadowOffset}
        transformOrigin={`${(FOOT_X / VIEW) * 100}% ${(FOOT_Y / VIEW) * 100}%`}
        transform={`scale(${sx}, ${sy})`}
        flair={flair}
      />
    </div>
  );
};

export default ServerIconCoreMemory;
