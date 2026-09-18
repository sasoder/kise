import React from 'react';
import {useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  CLOCK_IN_FRAMES,
  CoreMemoryIconStack,
  coreMemoryTiming,
  SHADOW_OFFSET,
  TAU,
} from './coreMemoryIcon';

// Clock icon — CORE MEMORY PODCAST STYLE.
//
// A sister to ServerIconCoreMemory and PowerIconCoreMemory, but with no source
// PNG: the clock is DRAWN, because its hands move and a static alpha mask
// cannot. So each layer of the shared stack (shadow, orange, purple, blue,
// white core) is the clock's silhouette AT THE CURRENT FRAME, rendered as
// inline SVG in one flat colour through the stack's `renderLayer` slot. Every
// layer gets the same hand angles on a given frame, so the copies are identical
// shapes, they stack perfectly, and the chain vanishes behind the core exactly
// as it does for the masked icons. Transparent overlay asset, white ink.
//
// The motion, complete — nothing else happens:
//  1. Entrance (In clip only, f0-f28). The shared core memory slide-up: four
//     copies of the silhouette rising 130px over 22 frames, two frames apart,
//     nothing fading, hard black shadow at the back on the core's timing. The
//     hands are ALREADY SPINNING while it slides in — the clock never sits with
//     frozen hands.
//  2. Fast-forward (both clips). The one subtle loop gesture: the hands run
//     clockwise at constant speed, linear, driven off the single normalised
//     `cycle`. Minute hand = 4 full revolutions per 96-frame loop (15deg per
//     frame), hour hand = exactly 1 (3.75deg per frame).
//     Why 4:1 and not a real clock's 12:1 — deliberate, on two counts. Both
//     hands must complete an INTEGER number of revolutions per loop or the
//     loop is not seamless, which rules out 12:1 unless the minute hand runs
//     12 revs to the hour hand's 1; and 12 revs over 96 frames is 45deg per
//     frame, which at 24fps strobes and reads as a hand jittering backwards.
//     15deg per frame is fast enough to read as fast-forward and slow enough
//     to read as one direction. Phase: at cycle 0 the hour hand points at 10
//     and the minute hand at 2 — the classic 10:10 pose — so the Loop clip's
//     first frame is a good poster frame.
//  3. Motion smear on the minute hand, CORE LAYER ONLY. It rides in the stack's
//     flair slot, above the chain colours and below the white core, so it never
//     appears in a chain colour or in the shadow. A trailing sector behind the
//     hand, hub radius to hand length, 26deg wide, built as three stepped
//     sectors (0.30 / 0.18 / 0.08 white) rotating rigidly with the hand.
//  4. Whole-icon breath, the same restrained one the rack uses: a
//     volume-preserving squash (x +0.6% / y -0.9%), one cycle per loop, scaled
//     by `liveliness`, anchored at the clock's centre. No sway and no rotation
//     of the whole icon — the hands are the rotation.
//
// Everything is driven off one normalised `cycle`. In the In clip that cycle
// runs off `frame - 48`, so In f47 is loop frame 95 and Loop f0 is loop frame
// 0: cutting from the In clip into the looping clip is an ordinary
// adjacent-frame step, and the hands simply take their next 15deg / 3.75deg.

export const schema = z.object({
  iconSize: z.number().min(240).max(1040),
  /** 'in' plays the entrance once; 'loop' is the seamless rest state. */
  mode: z.enum(['in', 'loop']),
  /** Hard shadow offset in canvas px, down and right. */
  shadowOffset: z.number().min(0).max(48),
  /** Whole clockwise revolutions of the minute hand per loop. Integer = seam-free. */
  minuteRevs: z.number().int().min(1).max(12),
  /** Whole clockwise revolutions of the hour hand per loop. */
  hourRevs: z.number().int().min(1).max(12),
  /** Multiplies the smear's opacity. 0 removes it. */
  smear: z.number().min(0).max(1),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(2),
});

export type ClockIconCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: ClockIconCoreMemoryProps = schema.parse({
  iconSize: 760,
  mode: 'loop',
  shadowOffset: SHADOW_OFFSET,
  minuteRevs: 4,
  hourRevs: 1,
  smear: 1,
  liveliness: 1,
});

// Geometry, in the family's own 512x512 space. Tuned by eye against
// public/server.png and public/power.png: those are chunky solid glyphs with
// generous rounded forms, so the ring and the hands are heavy and the detail
// count is kept to the minimum that still reads as a clock.
const VIEW = 512;
const C = 256;

const RING_R = 196;
const RING_W = 44;

/** Four ticks only, at 12/3/6/9. */
const TICK_R0 = 148;
const TICK_R1 = 112;
const TICK_W = 26;

const HOUR_LEN = 92;
const HOUR_W = 36;
const MINUTE_LEN = 146;
const MINUTE_W = 28;
const HUB_R = 24;

/** The smear: total sweep behind the minute hand, and its three steps. */
const SMEAR_DEG = 26;
const SMEAR_STEPS = [0.3, 0.18, 0.08];

/** Clock angles: degrees clockwise from 12 o'clock. */
const PHASE_MINUTE = 60; // the "2"
const PHASE_HOUR = 300; // the "10"

const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
};

/** An annular sector from r0 to r1 between two clockwise angles. */
const sector = (r0: number, r1: number, a0: number, a1: number) => {
  const [ox0, oy0] = pt(r1, a0);
  const [ox1, oy1] = pt(r1, a1);
  const [ix1, iy1] = pt(r0, a1);
  const [ix0, iy0] = pt(r0, a0);
  return [
    `M ${ox0} ${oy0}`,
    `A ${r1} ${r1} 0 0 1 ${ox1} ${oy1}`,
    `L ${ix1} ${iy1}`,
    `A ${r0} ${r0} 0 0 0 ${ix0} ${iy0}`,
    'Z',
  ].join(' ');
};

const svgBox: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

const ClockIconCoreMemory: React.FC<ClockIconCoreMemoryProps> = ({
  iconSize,
  mode,
  shadowOffset,
  minuteRevs,
  hourRevs,
  smear,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const timing = coreMemoryTiming(mode, frame, CLOCK_IN_FRAMES);
  const {cycle} = timing;

  // Constant speed, linear, integer revolutions per loop.
  const minuteAngle = PHASE_MINUTE + 360 * minuteRevs * cycle;
  const hourAngle = PHASE_HOUR + 360 * hourRevs * cycle;

  /**
   * The silhouette at this frame in one flat colour. Called once per layer with
   * that layer's colour, so all five copies are the same shape.
   */
  const renderLayer = (color: string) => (
    <svg style={svgBox} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <circle
        cx={C}
        cy={C}
        r={RING_R}
        fill="none"
        stroke={color}
        strokeWidth={RING_W}
      />
      {[0, 90, 180, 270].map((deg) => {
        const [x0, y0] = pt(TICK_R0, deg);
        const [x1, y1] = pt(TICK_R1, deg);
        return (
          <line
            key={deg}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke={color}
            strokeWidth={TICK_W}
            strokeLinecap="round"
          />
        );
      })}
      {(
        [
          [hourAngle, HOUR_LEN, HOUR_W],
          [minuteAngle, MINUTE_LEN, MINUTE_W],
        ] as const
      ).map(([deg, len, w], i) => {
        const [x, y] = pt(len, deg);
        return (
          <line
            key={i}
            x1={C}
            y1={C}
            x2={x}
            y2={y}
            stroke={color}
            strokeWidth={w}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={C} cy={C} r={HUB_R} fill={color} />
    </svg>
  );

  // The smear rides with the core only.
  const flair =
    smear > 0 && liveliness > 0 ? (
      <svg style={svgBox} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        {SMEAR_STEPS.map((o, i) => {
          const step = SMEAR_DEG / SMEAR_STEPS.length;
          const a1 = minuteAngle - i * step;
          const a0 = a1 - step;
          return (
            <path
              key={i}
              d={sector(HUB_R, MINUTE_LEN, a0, a1)}
              fill="#FFFFFF"
              opacity={o * smear}
            />
          );
        })}
      </svg>
    ) : null;

  // Volume-preserving breathing squash about the clock's centre.
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
      <CoreMemoryIconStack
        iconSize={iconSize}
        frame={frame}
        timing={timing}
        shadowOffset={shadowOffset}
        transformOrigin="50% 50%"
        transform={`scale(${sx}, ${sy})`}
        flair={flair}
        renderLayer={renderLayer}
      />
    </div>
  );
};

export default ClockIconCoreMemory;
