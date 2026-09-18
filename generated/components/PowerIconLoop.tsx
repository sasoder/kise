import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

// Nuclear cooling towers icon loop — steam.
//
// The artwork does the masking: both towers are SOLID filled silhouettes in a
// dark grey (#424242, measured off the PNG's own pixels — this icon is not
// black), so anything drawn BEHIND the PNG inside a tower is invisible. Each
// puff of steam is therefore born a few units *below* the tower's rim and
// becomes visible only as it clears the drawn top edge. Nothing is ever drawn
// in front of the artwork.
//
// V2: one plume model, two sizes. The first pass gave the towers two different
// mechanisms — a thin worm of equal balls with detached satellites on the left,
// a static cap parked on the rim on the right. Both plumes now come out of the
// same four rules, and the only difference between them is scale.
//
// Motion, and why:
//  1. A shared spine per tower. The plume axis is a curve from the mouth centre
//     rising and leaning right, the lean growing quadratically with height
//     (0 at the rim, ~36 units at the top). A puff's centre is a point on that
//     spine plus an offset on a hashed, slowly rotating angle whose magnitude
//     is capped at LATERAL_CAP (0.45) of that puff's own radius. The cap is what
//     guarantees the plume is one body: consecutive puffs are close enough
//     along the spine that even with opposite lateral offsets their circles
//     still intersect, so there are no detached balls, ever. (Verified by
//     labelling the steam pixels of all 96 rendered frames: exactly two
//     components, one plume per tower, and no crumb of any size.)
//  2. A column that widens. The radius is a function of HEIGHT, not of age:
//     12 units at the rim growing to 32 at the top for the left tower, x1.2
//     for the right. So each plume is a leaning, billowing cone — narrow at the
//     mouth, broad and soft at the top — rather than a string of equal pearls.
//     Both towers now travel a similar height (left 130, right 118); the right
//     tower's rim is 64 units higher, so its plume runs off the top of the
//     icon's own 512 box, which is why the flair SVG is `overflow: visible`.
//     There is still >= 60px of clear canvas margin on every frame.
//  3. Dissipation without specks. Puffs never shrink to nothing — that is what
//     produced the crumbs at the top. They shrink only to TAIL_SHRINK (65%)
//     over the last 30% of life, and the top of the plume is dissolved instead
//     by an SVG <mask> on the plume group: a smoothstep gradient along the
//     rise, fully opaque from the rim up to MASK_HOLD (78%) of the travel and
//     gone shortly after it. The fade is deliberately kept to the top third of
//     the visible plume: a longer ramp (the first attempt held to 55%) grades
//     the whole body and the plume stops reading as flat ink. This is the one
//     gradient in the piece and it is on the mask, never on a fill — every
//     circle is still a flat disc and the body still carries one opacity.
//  4. Billow, not conveyor. The rise is lazy (1.89 units/frame at its fastest,
//     2.32 including the wander and the boil) and
//     decelerating. On top of that each puff's radius pulses +-BOIL (8%) at an
//     integer number of cycles per loop with a hashed phase, so the outline
//     boils gently in place, and sizes are staggered +-20% by hash so the edge
//     is cloud-like. Rise, boil and emission are all seamless across the loop
//     point.
//  5. Trefoil breath. The two radiation trefoils are genuine transparent holes
//     in the artwork (confirmed by flood-filling the alpha channel: eight
//     enclosed transparent regions, four per trefoil), so a disc of ink behind
//     each one can dim it. It breathes between 0 and TREFOIL_MAX * liveliness,
//     one slow cycle per loop, the two towers half a cycle apart, and never
//     gets near closing the hole.
//  6. Whole-icon motion: concrete does not sway, so there is no rotation and
//     no translation — only a volume-preserving breath (<= 0.6% * liveliness,
//     x up / y down) anchored at the baseline centre, one cycle per loop.
//
// Everything is driven off one normalised `cycle`, so changing fps or duration
// resamples the motion instead of retiming it.

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  /** Puffs alive per tower: [left, right]. */
  puffCounts: z.array(z.number().int().min(0).max(40)).length(2),
  /** Whole emission cycles per loop (integer, or the seam opens). */
  emitCycles: z.number().int().min(1).max(4),
  /** Tone of a plume at liveliness 1 — one flat value for the whole body. */
  plumeOpacity: z.number().min(0).max(1),
  /** Lean of the spine at the top of its travel, in icon units. */
  lean: z.number().min(0).max(90),
  /** Radius pulsation, as a fraction: the plume's outline boiling. */
  boil: z.number().min(0).max(0.3),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(2),
});

export type PowerIconLoopProps = z.infer<typeof schema>;

export const defaultProps: PowerIconLoopProps = schema.parse({
  icon: 'power.png',
  iconSize: 760,
  puffCounts: [22, 24],
  emitCycles: 1,
  plumeOpacity: 0.3,
  lean: 36,
  boil: 0.08,
  liveliness: 1,
});

// Geometry measured off the source PNG's own pixels, in its 512x512 space.
// Ink is a uniform (66,66,66) = #424242 at 92,499 opaque pixels; artwork bbox
// x 64..448, y 87..424.
const VIEW = 512;
const INK = '#424242';

// Left (shorter) tower: rim top y=152, mouth x 104..239 (centre 171.5).
// Right (taller) tower: rim top y=88, mouth x 243..396 (centre 319.5).
type Tower = {
  /** Mouth centre: the foot of the spine. */
  cx: number;
  rimY: number;
  /** How far the spine climbs over a puff's life. */
  travel: number;
  /** Lean multiplier, so the bigger tower's plume leans a touch further. */
  leanScale: number;
  /** Puff radius at the rim and at the top of the travel. */
  rBase: number;
  rTop: number;
  /** Hash key, so the two towers never share a rhythm. */
  key: number;
  /** Extra phase, so they do not emit on the same beat. */
  phase: number;
};

// The right tower is the same plume at 1.2x: same rules, same shape, bigger.
const RIGHT_SCALE = 1.2;

const TOWERS: Tower[] = [
  {
    cx: 171.5,
    rimY: 152,
    travel: 130,
    leanScale: 1,
    rBase: 12,
    rTop: 32,
    key: 17,
    phase: 0,
  },
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

/** Born this far below the rim, so the artwork occludes the birth. */
const BIRTH_DEPTH = 9;
/** Lateral offset cap, as a fraction of the puff's own radius. See note 1. */
const LATERAL_CAP = 0.45;
/** Hashed phase spread on the emission; kept under 1 so spacing stays tight. */
const PHASE_JITTER = 0.5;
/** Puffs shrink only this far in the tail — never to a speck. */
const TAIL_SHRINK = 0.65;
/** Radius pulse cycles per loop (integer, so the boil is seamless). */
const BOIL_CYCLES = 2;
/** Mask: fully opaque up to this fraction of the travel, then falls away. */
const MASK_HOLD = 0.78;

// The radiation trefoils are true alpha holes (flood-filled from the alpha
// channel): left blades span x 143..198 / y 302..350, right x 280..367 /
// y 234..309.
const TREFOILS = [
  {cx: 170.5, cy: 326, r: 40, phase: 0},
  {cx: 323.5, cy: 271.5, r: 62, phase: 0.5},
];
const TREFOIL_MAX = 0.3;

// The baseline: the breath is anchored here so the towers breathe off the
// ground rather than floating.
const BASE_X = 256;
const BASE_Y = 423;

const TAU = Math.PI * 2;

/** Stable hash: the same value every loop, so nothing flickers frame to frame. */
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * Decelerating climb. Gentler than a true ease-out quad on purpose: with a
 * hard decel the puffs sprint away from the rim and then pile up at the top,
 * which reads as a gap plus a bunch of grapes rather than a column of steam.
 */
const climbCurve = (t: number) => 1 - Math.pow(1 - t, 1.4);

type Lobe = {dx: number; dy: number; rk: number};

type Puff = {
  key: string;
  x: number;
  y: number;
  r: number;
  lobes: Lobe[];
};

type Plume = {
  t: number;
  puffs: Puff[];
  /** Mask gradient endpoints, in icon units. */
  yHold: number;
  yGone: number;
};

const PowerIconLoop: React.FC<PowerIconLoopProps> = ({
  icon,
  iconSize,
  puffCounts,
  emitCycles,
  plumeOpacity,
  lean,
  boil,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  const plumes: Plume[] = TOWERS.map((tower, t) => {
    const n = puffCounts[t];
    const puffs: Puff[] = [];
    // Liveliness scales the travel, and the mask has to follow it or it would
    // cut the plume off in the wrong place.
    const travel = tower.travel * liveliness;
    const towerLean = lean * tower.leanScale * liveliness;
    const yBirth = tower.rimY + BIRTH_DEPTH;

    for (let i = 0; i < n; i++) {
      // Hashed phase jitter keeps the emission lazy instead of metronomic,
      // while staying a fixed offset so the loop still shuts.
      const jitter = (hash(i, tower.key) - 0.5) * PHASE_JITTER;
      let life = (cycle * emitCycles + (i + jitter) / n + tower.phase) % 1;
      if (life < 0) {
        life += 1;
      }

      // Where this puff sits on the spine: s is its fraction of the climb.
      const s = climbCurve(life);
      const spineX = tower.cx + towerLean * s * s;
      const spineY = yBirth - travel * s;

      // Radius is a function of HEIGHT, so the plume is a widening cone and
      // every puff at a given height matches its neighbours.
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
        (tower.rBase + (tower.rTop - tower.rBase) * s) *
        sizeJitter *
        tail *
        pulse;

      // Wander off the spine, capped against this puff's own radius so it can
      // never leave the body of the plume. The offset is a vector on a slowly
      // rotating hashed angle rather than a pure sideways slide: neighbouring
      // puffs then pack irregularly instead of snaking together in phase,
      // which is what made the first pass read as a scalloped sausage.
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

  // Trefoils: one slow breath each, half a loop apart.
  const trefoils = TREFOILS.map((tf) => ({
    ...tf,
    opacity:
      TREFOIL_MAX *
      liveliness *
      (0.5 - 0.5 * Math.cos(TAU * (cycle + tf.phase))),
  }));

  // Volume-preserving breath off the baseline, one cycle per loop.
  const breath = Math.sin(TAU * cycle) * liveliness;
  const sx = 1 + breath * 0.004;
  const sy = 1 - breath * 0.006;

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          transformOrigin: `${(BASE_X / VIEW) * 100}% ${(BASE_Y / VIEW) * 100}%`,
          transform: `scale(${sx}, ${sy})`,
        }}
      >
        {/* Behind the artwork: steam above the rims, trefoil discs in the
            holes. Inside a tower's silhouette none of this is visible. */}
        <svg
          style={{...layerStyle, overflow: 'visible'}}
          viewBox={`0 0 ${VIEW} ${VIEW}`}
        >
          <defs>
            {plumes.map(({t, yHold, yGone}) => (
              <mask
                key={`mask-${t}`}
                id={`plume-mask-${t}`}
                maskUnits="userSpaceOnUse"
                x={-VIEW}
                y={-VIEW}
                width={VIEW * 3}
                height={VIEW * 3}
              >
                <linearGradient
                  id={`plume-grad-${t}`}
                  gradientUnits="userSpaceOnUse"
                  x1={0}
                  y1={yGone}
                  x2={0}
                  y2={yHold}
                >
                  {/* A smoothstep ramp, so the plume's top has no hard edge
                      and no linear banding. */}
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
                  fill={`url(#plume-grad-${t})`}
                />
              </mask>
            ))}
          </defs>

          {plumes.map(({puffs, t}) => (
            <g
              key={`plume-${t}`}
              opacity={plumeOpacity * liveliness}
              mask={`url(#plume-mask-${t})`}
            >
              {puffs.map((p) =>
                p.lobes.map((lobe, l) => (
                  <circle
                    key={`${p.key}-${l}`}
                    cx={p.x + lobe.dx * p.r}
                    cy={p.y + lobe.dy * p.r}
                    r={p.r * lobe.rk}
                    fill={INK}
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
              fill={INK}
              opacity={tf.opacity}
            />
          ))}
        </svg>

        {/* The supplied artwork, never redrawn. */}
        <Img src={staticFile(icon)} style={layerStyle} />
      </div>
    </AbsoluteFill>
  );
};

export default PowerIconLoop;
