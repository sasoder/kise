import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {
  bootRamp,
  CoreMemoryIconStack,
  coreMemoryTiming,
  LOOP_FRAMES,
  POWER_IN_FRAMES,
  SHADOW_OFFSET,
  TAU,
} from './coreMemoryIcon';

// Nuclear cooling towers icon — CORE MEMORY PODCAST STYLE.
//
// The approved PowerIconLoop, restated in the user's core memory style: the
// towers are WHITE with a hard black shadow, they arrive on the staggered
// chain slide-up (orange -> purple -> blue -> white core), and then the
// approved steam carries on as a seamless loop. Transparent overlay asset for
// dark footage. PowerIconLoop itself is untouched; its plume model, measured
// geometry and hash are copied here verbatim, and only the ink has changed.
//
// Motion, and why:
//  1. Entrance (In clip only, f0-f28). The shared core memory stack — see
//     coreMemoryIcon.tsx. The white core silhouette is what occludes the steam
//     inside a tower, exactly as the opaque PNG did in the approved loop, so
//     the flair sits directly under the core in the stack.
//  2. The plume, unchanged in shape and now WHITE at a flat 0.34 (it has to
//     hold against dark footage where the old dark grey would vanish). Same
//     four rules: a leaning shared spine per tower; a radius that grows with
//     HEIGHT so the plume is a widening cone; lateral wander capped at 0.45 of
//     the puff's own radius so the plume is always ONE connected body; and a
//     top dissolved by a smoothstep <mask> on the group rather than by
//     shrinking puffs to specks. Rise, boil (+-8%, 2 cycles per loop) and
//     emission are all seamless across the loop point. The steam carries no
//     shadow — it is vapour, not part of the mark.
//  3. Plume build-up (In clip only). A puff is rendered only once its birth
//     frame is at or after the core's landing frame, so nothing is hanging in
//     the air when the towers arrive: the steam grows out of the mouths and
//     fills to steady state over exactly one puff lifetime (96 frames). That
//     is why the In clip is 28 + 96 = 124 frames.
//  4. Trefoil breath. The two radiation trefoils are true alpha holes, so a
//     disc behind each one dims it: WHITE here, breathing 0 -> 0.30 once per
//     loop, the two towers half a cycle apart, never near closing the hole. In
//     the In clip it is held at 0 at landing and ramps in over 14 frames, so
//     the icon does not arrive already mid-breath.
//  5. Whole-icon breath, unchanged: concrete does not sway, so no rotation and
//     no translation — only a volume-preserving breath (x +0.4% / y -0.6%)
//     anchored at the baseline centre, one cycle per loop, applied to ONE
//     wrapper holding the shadow, the chain, the flair and the core.
//
// In the In clip the loop maths runs off `frame - 124`, so In f123 is loop
// frame 95 and Loop f0 is loop frame 0 — an ordinary adjacent-frame step. It
// also means the loop phase is exactly 0 on the landing frame.

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  /** 'in' plays the entrance once; 'loop' is the seamless rest state. */
  mode: z.enum(['in', 'loop']),
  /** Hard shadow offset in canvas px, down and right. */
  shadowOffset: z.number().min(0).max(48),
  /** Puffs alive per tower: [left, right]. */
  puffCounts: z.array(z.number().int().min(0).max(40)).length(2),
  /** Whole emission cycles per loop (integer, or the seam opens). */
  emitCycles: z.number().int().min(1).max(4),
  /** Tone of a plume — one flat value for the whole body. */
  plumeOpacity: z.number().min(0).max(1),
  /** Lean of the spine at the top of its travel, in icon units. */
  lean: z.number().min(0).max(90),
  /** Radius pulsation, as a fraction: the plume's outline boiling. */
  boil: z.number().min(0).max(0.3),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(2),
});

export type PowerIconCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: PowerIconCoreMemoryProps = schema.parse({
  icon: 'power.png',
  iconSize: 760,
  mode: 'loop',
  shadowOffset: SHADOW_OFFSET,
  puffCounts: [22, 24],
  emitCycles: 1,
  // White steam on dark footage needs a touch more body than the dark grey
  // plume did on white — 0.30 -> 0.34.
  plumeOpacity: 0.34,
  lean: 36,
  boil: 0.08,
  liveliness: 1,
});

// Geometry measured off the source PNG's own pixels, in its 512x512 space.
const VIEW = 512;
/** The steam is white now; the artwork's own #424242 never appears. */
const STEAM = '#FFFFFF';

type Tower = {
  cx: number;
  rimY: number;
  travel: number;
  leanScale: number;
  rBase: number;
  rTop: number;
  key: number;
  phase: number;
};

const RIGHT_SCALE = 1.2;

const TOWERS: Tower[] = [
  {cx: 171.5, rimY: 152, travel: 130, leanScale: 1, rBase: 12, rTop: 32, key: 17, phase: 0},
  {
    cx: 319.5,
    rimY: 88,
    travel: 118,
    leanScale: 1.08,
    rBase: 12 * RIGHT_SCALE,
    rTop: 32 * RIGHT_SCALE,
    key: 53,
    phase: 0.37,
  },
];

const BIRTH_DEPTH = 9;
const LATERAL_CAP = 0.45;
const PHASE_JITTER = 0.5;
const TAIL_SHRINK = 0.65;
const BOIL_CYCLES = 2;
const MASK_HOLD = 0.78;

const TREFOILS = [
  {cx: 170.5, cy: 326, r: 40, phase: 0},
  {cx: 323.5, cy: 271.5, r: 62, phase: 0.5},
];
const TREFOIL_MAX = 0.3;
const TREFOIL_BOOT_FRAMES = 14;

const BASE_X = 256;
const BASE_Y = 423;

/** Stable hash: the same value every loop, so nothing flickers. */
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const climbCurve = (t: number) => 1 - Math.pow(1 - t, 1.4);

type Lobe = {dx: number; dy: number; rk: number};
type Puff = {key: string; x: number; y: number; r: number; lobes: Lobe[]};
type Plume = {t: number; puffs: Puff[]; yHold: number; yGone: number};

const PowerIconCoreMemory: React.FC<PowerIconCoreMemoryProps> = ({
  icon,
  iconSize,
  mode,
  shadowOffset,
  puffCounts,
  emitCycles,
  plumeOpacity,
  lean,
  boil,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const timing = coreMemoryTiming(mode, frame, POWER_IN_FRAMES);
  const {cycle, sinceLand} = timing;

  /** Oldest puff the plume is allowed to contain yet, in frames. */
  const maxAge = mode === 'loop' ? LOOP_FRAMES : Math.max(0, sinceLand);

  const plumes: Plume[] = TOWERS.map((tower, t) => {
    const n = puffCounts[t];
    const puffs: Puff[] = [];
    const travel = tower.travel * liveliness;
    const towerLean = lean * tower.leanScale * liveliness;
    const yBirth = tower.rimY + BIRTH_DEPTH;

    for (let i = 0; i < n; i++) {
      const jitter = (hash(i, tower.key) - 0.5) * PHASE_JITTER;
      let life = (cycle * emitCycles + (i + jitter) / n + tower.phase) % 1;
      if (life < 0) {
        life += 1;
      }

      // Build-up: this puff was born `life` of a loop ago. If that is before
      // the towers landed, it never existed.
      if ((life / emitCycles) * LOOP_FRAMES > maxAge) {
        continue;
      }

      const s = climbCurve(life);
      const spineX = tower.cx + towerLean * s * s;
      const spineY = yBirth - travel * s;

      const sizeJitter = 0.8 + 0.4 * hash(i, tower.key + 5);
      const tail = interpolate(life, [0.7, 1], [1, TAIL_SHRINK], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      const pulse =
        1 +
        boil *
          liveliness *
          Math.sin(TAU * (BOIL_CYCLES * cycle + hash(i, tower.key + 13)));
      const r =
        (tower.rBase + (tower.rTop - tower.rBase) * s) * sizeJitter * tail * pulse;

      const offAmp = 0.4 + 0.6 * hash(i, tower.key + 9);
      const offMag =
        LATERAL_CAP *
        r *
        offAmp *
        (0.5 +
          0.5 *
            Math.sin(
              TAU * (1.25 + 1.05 * hash(i, tower.key + 19)) * life +
                TAU * hash(i, tower.key + 23),
            ));
      const offAng = TAU * (hash(i, tower.key + 29) + 0.35 * life);

      const lobes: Lobe[] = [0, 1, 2].map((l) => ({
        dx: (hash(i * 3 + l, tower.key + 31) - 0.5) * 0.8,
        dy: (hash(i * 3 + l, tower.key + 37) - 0.5) * 0.66,
        rk: 0.62 + 0.44 * hash(i * 3 + l, tower.key + 41),
      }));

      puffs.push({
        key: `p-${t}-${i}`,
        x: spineX + offMag * Math.cos(offAng),
        y: spineY + offMag * Math.sin(offAng),
        r,
        lobes,
      });
    }

    return {
      t,
      puffs,
      yHold: yBirth - MASK_HOLD * travel,
      yGone: yBirth - travel - tower.rTop * 0.2,
    };
  });

  // Trefoils: one slow breath each, half a loop apart, built in after landing.
  const trefoilRamp =
    mode === 'loop' ? 1 : bootRamp(sinceLand, TREFOIL_BOOT_FRAMES);
  const trefoils = TREFOILS.map((tf) => ({
    ...tf,
    opacity:
      TREFOIL_MAX *
      liveliness *
      trefoilRamp *
      (0.5 - 0.5 * Math.cos(TAU * (cycle + tf.phase))),
  }));

  // Volume-preserving breath off the baseline, one cycle per loop.
  const breath = Math.sin(TAU * cycle) * liveliness;
  const sx = 1 + breath * 0.004;
  const sy = 1 - breath * 0.006;

  const flair = (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
    >
      <defs>
        {plumes.map(({t, yHold, yGone}) => (
          <mask
            key={`mask-${t}`}
            id={`cm-plume-mask-${t}`}
            maskUnits="userSpaceOnUse"
            x={-VIEW}
            y={-VIEW}
            width={VIEW * 3}
            height={VIEW * 3}
          >
            <linearGradient
              id={`cm-plume-grad-${t}`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={yGone}
              x2={0}
              y2={yHold}
            >
              <stop offset="0" stopColor="#000000" />
              <stop offset="0.25" stopColor="#1a1a1a" />
              <stop offset="0.5" stopColor="#808080" />
              <stop offset="0.75" stopColor="#e5e5e5" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
            <rect
              x={-VIEW}
              y={-VIEW}
              width={VIEW * 3}
              height={VIEW * 3}
              fill={`url(#cm-plume-grad-${t})`}
            />
          </mask>
        ))}
      </defs>

      {plumes.map(({puffs, t}) => (
        <g
          key={`plume-${t}`}
          opacity={plumeOpacity * liveliness}
          mask={`url(#cm-plume-mask-${t})`}
        >
          {puffs.map((p) =>
            p.lobes.map((lobe, l) => (
              <circle
                key={`${p.key}-${l}`}
                cx={p.x + lobe.dx * p.r}
                cy={p.y + lobe.dy * p.r}
                r={p.r * lobe.rk}
                fill={STEAM}
              />
            )),
          )}
        </g>
      ))}

      {trefoils.map((tf) => (
        <circle
          key={`tf-${tf.cx}`}
          cx={tf.cx}
          cy={tf.cy}
          r={tf.r}
          fill={STEAM}
          opacity={tf.opacity}
        />
      ))}
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
        transformOrigin={`${(BASE_X / VIEW) * 100}% ${(BASE_Y / VIEW) * 100}%`}
        transform={`scale(${sx}, ${sy})`}
        flair={flair}
      />
    </div>
  );
};

export default PowerIconCoreMemory;
