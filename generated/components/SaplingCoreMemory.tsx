import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  coreColor: z.string(),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
  breezeCount: z.number().int().min(0).max(6),
  sporeCount: z.number().int().min(0).max(10),
  liveliness: z.number().min(0).max(2),
});

export type SaplingCoreMemoryProps = z.infer<typeof schema>;

export const defaultProps: SaplingCoreMemoryProps = schema.parse({
  icon: 'sapling.png',
  iconSize: 700,
  coreColor: '#FFFFFF',
  // Chunky solid glyph, so the hard shadow sits at ~1.8% of the artwork.
  shadowOffset: 12,
  rise: 130,
  staggerFrames: 2,
  breezeCount: 3,
  sporeCount: 3,
  liveliness: 1,
});

export const FPS = 24;
export const DURATION = 192; // 8s
const SWAY_LOOP = 96; // the approved 4s sway, run twice

// The CORE MEMORY chain colours sampled from public/core.png and used raw —
// no blend mode, no bloom, no saturation filter.
const TRAIL_COLORS = [
  '#FFB765', // orange, first to arrive
  '#BC37FF', // purple
  '#0046FF', // blue, last of the colours
];
const TRAVEL_FRAMES = 22;
const SETTLE_FRAMES = 24; // the plant eases into its breeze after landing

// Geometry read off the source icon, in its own 512x512 space. The stem is a
// clean 17px column between y=180 and y=220; the soil mound starts at y=221.
const STEM_X = 266;
const PIVOT_Y = 234; // just inside the mound, where the stem enters the soil
const PLANT_CUT = 222; // plant layer keeps rows above this
const SOIL_CUT = 220; // soil + pot layer starts here, covering the plant's cut edge

const pct = (v: number) => `${(v / 512) * 100}%`;

const PLANT_CLIP = `inset(0 0 ${pct(512 - PLANT_CUT)} 0)`;
const SOIL_CLIP = `inset(${pct(SOIL_CUT)} 0 0 0)`;
const PIVOT = `${pct(STEM_X)} ${pct(PIVOT_Y)}`;

// Stable per-element scatter: organic spread, identical every frame.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// The artwork is a flat mark on alpha, so every layer is the icon's own alpha
// used as a mask over a flat colour rather than a recoloured bitmap.
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

const SaplingCoreMemory: React.FC<SaplingCoreMemoryProps> = ({
  icon,
  iconSize,
  coreColor,
  shadowOffset,
  rise,
  staggerFrames,
  breezeCount,
  sporeCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const tau = Math.PI * 2;

  // ---- Entrance: every layer does the same slide, just later ----------------

  // Quick off the mark, then a long ease into place.
  const offsetAt = (delay: number) => {
    const t = interpolate(frame, [delay, delay + TRAVEL_FRAMES], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (1 - t) * rise;
  };

  // Nothing fades, so a layer simply does not exist until its turn — they cut
  // in one at a time rather than all sitting there at frame 0.
  const hasStarted = (delay: number) => frame >= delay;

  // The core goes last, so it is still low while the colours are landing.
  const coreDelay = TRAIL_COLORS.length * staggerFrames;
  const coreOffset = offsetAt(coreDelay);
  const coreLanded = coreDelay + TRAVEL_FRAMES;

  // ---- Sway: the approved 4s loop, held straight through the entrance ------

  // Left on the loop clock rather than offset to the landing, so the last 96
  // frames of the piece are themselves a clean seamless cycle.
  const cycle = (frame % SWAY_LOOP) / SWAY_LOOP;

  // Dead straight while the layers are landing, then eases into the breeze.
  const settle = interpolate(
    frame,
    [coreLanded, coreLanded + SETTLE_FRAMES],
    [0, 1],
    {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const amount = settle * liveliness;

  // One slow breath plus a lighter second harmonic, so the sway wanders a
  // little instead of metronoming. Both are whole cycles, so the loop is
  // seamless. Negated so the deeper lean runs downwind, with the breeze.
  const lean = -(
    Math.sin(cycle * tau) +
    0.28 * Math.sin(cycle * tau * 2 + 1.1)
  );
  const swayDeg = lean * 2.2 * amount;

  // A bent stem is a shorter stem: derive the squash from the lean itself so
  // the two cannot drift apart if the timing changes.
  const bend = Math.abs(lean);
  const plantScaleY = 1 - bend * 0.008 * amount;
  const plantScaleX = 1 + bend * 0.005 * amount;

  // The pot stays planted; only a whisper of breath on the whole icon.
  const breath = Math.sin(cycle * tau * 2);
  const breathScale = `${1 + breath * 0.005 * amount} ${
    1 - breath * 0.004 * amount
  }`;

  // ---- Breeze and spores, in the core colour so they read over footage -----

  const gusts = [];
  for (let i = 0; i < breezeCount; i++) {
    const p = (cycle + i / breezeCount) % 1;
    // Spread the streaks evenly down the band and jitter them, so they never
    // stack into one continuous rule across the frame.
    const y = 46 + ((i + 0.5) / breezeCount) * 168 + (hash(i, 3) - 0.5) * 34;
    const len = 150 + hash(i, 5) * 90;
    // Long enough to be fully off-canvas at both ends, so a streak always
    // reads as passing behind the plant rather than sprouting from a leaf.
    const x = interpolate(p, [0, 1], [-len - 30, 542]);
    const dip = 8 + hash(i, 7) * 9;
    gusts.push({
      key: i,
      d: `M ${x} ${y} q ${len / 2} ${dip} ${len} ${dip * 0.5}`,
      width: 3.5 + hash(i, 9) * 2,
      opacity:
        interpolate(p, [0, 0.2, 0.8, 1], [0, 0.11, 0.11, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * amount,
    });
  }

  const spores = [];
  for (let i = 0; i < sporeCount; i++) {
    const p = (cycle + i / sporeCount) % 1;
    const x0 = 150 + hash(i, 11) * 220;
    const y0 = 140 + hash(i, 13) * 55;
    const drift = 70 + hash(i, 17) * 80;
    spores.push({
      key: i,
      cx: x0 + drift * p + Math.sin(p * tau + i) * 10,
      cy: y0 - 130 * p,
      r: interpolate(p, [0, 1], [5, 2.6]),
      opacity:
        interpolate(p, [0, 0.22, 0.7, 1], [0, 0.28, 0.2, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }) * amount,
    });
  }

  const fill: React.CSSProperties = {position: 'absolute', inset: 0};

  // One layer of the stack: the glyph in a flat colour, split so the plant
  // bends about the stem base while the pot stays planted.
  const Layer: React.FC<{color: string; offset: number; dx?: number}> = ({
    color,
    offset,
    dx = 0,
  }) => (
    <div style={{...fill, translate: `${dx}px ${offset}px`}}>
      <div style={{...fill, scale: breathScale}}>
        <div
          style={{
            ...fill,
            backgroundColor: color,
            ...maskStyle(icon),
            clipPath: PLANT_CLIP,
            transformOrigin: PIVOT,
            rotate: `${swayDeg}deg`,
            scale: `${plantScaleX} ${plantScaleY}`,
          }}
        />
        <div
          style={{
            ...fill,
            backgroundColor: color,
            ...maskStyle(icon),
            clipPath: SOIL_CLIP,
          }}
        />
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: iconSize, height: iconSize}}>
        {hasStarted(coreDelay) ? (
          /* Hard readability shadow, at the very back so it never darkens the
             colours it crosses. Zero blur, rides with the core. */
          <div style={{...fill, zIndex: 0}}>
            <Layer
              color="#000000"
              offset={coreOffset + shadowOffset}
              dx={shadowOffset}
            />
          </div>
        ) : null}

        {/* Listed in arrival order, and stacked the same way: orange at the
            back, then purple, then blue, with the core on top of all of them. */}
        {TRAIL_COLORS.map((color, i) =>
          hasStarted(i * staggerFrames) ? (
            <div key={color} style={{...fill, zIndex: i + 1}}>
              <Layer color={color} offset={offsetAt(i * staggerFrames)} />
            </div>
          ) : null,
        )}

        {hasStarted(coreDelay) ? (
          <>
            {/* Breeze and spores sit under the core, so the mark occludes them
                the way the plant did in the black-on-light loop. */}
            <svg
              style={{
                ...fill,
                zIndex: TRAIL_COLORS.length + 1,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                translate: `0px ${coreOffset}px`,
              }}
              viewBox="0 0 512 512"
            >
              <defs>
                {/* Tapered ends, so a streak has no hard start or stop. */}
                <linearGradient id="sapling-cm-gust" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor={coreColor} stopOpacity={0} />
                  <stop offset="0.3" stopColor={coreColor} stopOpacity={1} />
                  <stop offset="0.7" stopColor={coreColor} stopOpacity={1} />
                  <stop offset="1" stopColor={coreColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              {gusts.map((gust) => (
                <path
                  key={`gust-${gust.key}`}
                  d={gust.d}
                  fill="none"
                  stroke="url(#sapling-cm-gust)"
                  strokeWidth={gust.width}
                  strokeLinecap="round"
                  opacity={gust.opacity}
                />
              ))}
              {spores.map((spore) => (
                <circle
                  key={`spore-${spore.key}`}
                  cx={spore.cx}
                  cy={spore.cy}
                  r={spore.r}
                  fill={coreColor}
                  opacity={spore.opacity}
                />
              ))}
            </svg>

            {/* Core: the icon's own alpha over flat white, on top of all. */}
            <div style={{...fill, zIndex: TRAIL_COLORS.length + 2}}>
              <Layer color={coreColor} offset={coreOffset} />
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default SaplingCoreMemory;
