import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;

// CORE MEMORY chain colours sampled from public/core.png, used raw: no blend
// mode, no bloom, no saturation. Orange leads, blue is the last colour in.
const TRAIL_COLORS = ['#FFB765', '#BC37FF', '#0046FF'];
const TRAVEL_FRAMES = 22;
const STAGGER_FRAMES = 2;

// The core is last in, so the mark lands here — and the heart loop starts from
// exactly this frame.
const LAND = TRAIL_COLORS.length * STAGGER_FRAMES + TRAVEL_FRAMES;
// One full 4s heart loop after the landing, so the tail is the approved loop
// verbatim and cuts back to its own head cleanly.
const LOOP = 96;
export const DURATION = LAND + LOOP;

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  coreColor: z.string(),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  beats: z.number().int().min(1).max(8),
  ringCount: z.number().int().min(0).max(3),
  liveliness: z.number().min(0).max(2),
});

export type HeartCoreMemoryEntranceProps = z.infer<typeof schema>;

export const defaultProps: HeartCoreMemoryEntranceProps = schema.parse({
  icon: 'heart.png',
  iconSize: 700,
  coreColor: '#FFFFFF',
  // Chunky glyph, but cut through by narrow vessel channels — so under the
  // ~1.8% used for solid marks, or the shadow closes the channels up.
  shadowOffset: 10,
  rise: 130,
  beats: 4,
  ringCount: 1,
  liveliness: 1,
});

// Ventricular mass centre, measured off the source icon in its own 512x512 space.
const CX = 260;
const CY = 312;

// Vessel centrelines traced from the transparent channels cut into the artwork,
// so a pulse travelling one of these paths is clipped to the vessel it belongs to.
const VESSELS = [
  {
    // Aorta: ejection out of the left ventricle and up over the arch.
    key: 'aorta',
    d: 'M 233 252 C 233 238, 234 216, 240 196 C 246 176, 256 160, 272 148 C 292 134, 318 128, 348 128',
    width: 18,
    dash: 26,
    start: 0.04,
    span: 0.5,
    easing: Easing.out(Easing.cubic),
    peak: 0.9,
  },
  {
    // Pulmonary trunk: the same systolic push, a beat-hair later.
    key: 'pulmonary',
    d: 'M 306 258 C 306 236, 308 216, 322 204 C 338 190, 364 184, 396 184',
    width: 17,
    dash: 26,
    start: 0.07,
    span: 0.5,
    easing: Easing.out(Easing.cubic),
    peak: 0.9,
  },
  {
    // Great vein running the other way: filling, during diastole.
    key: 'inflow',
    d: 'M 191 140 C 195 158, 202 180, 212 200 C 219 214, 224 222, 228 231 C 220 242, 210 252, 201 261',
    width: 18,
    dash: 30,
    start: 0.36,
    span: 0.4,
    easing: Easing.inOut(Easing.quad),
    peak: 0.8,
  },
  {
    // Coronary artery in the interventricular groove: slow, base to apex.
    key: 'coronary',
    d: 'M 353 326 C 348 350, 336 374, 318 394 C 308 406, 299 417, 292 428',
    width: 13,
    dash: 22,
    start: 0.1,
    span: 0.68,
    easing: Easing.linear,
    peak: 0.8,
  },
] as const;

// Park the landing frame in the quiet part of the beat, so the mark arrives
// still and the first thump follows five frames later instead of popping.
const BEAT_ANCHOR = 0.85;

// Shortest signed distance on a wrapped 0-1 phase, so bumps never seam.
const wrap = (d: number) => d - Math.round(d);

const bump = (b: number, centre: number, width: number) =>
  Math.exp(-Math.pow(wrap(b - centre) / width, 2));

// Lub-dub: a hard first sound, a softer second a quarter-beat later.
const heartbeat = (b: number) => bump(b, 0.05, 0.055) + 0.5 * bump(b, 0.26, 0.07);

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

const HeartCoreMemoryEntrance: React.FC<HeartCoreMemoryEntranceProps> = ({
  icon,
  iconSize,
  coreColor,
  shadowOffset,
  rise,
  beats,
  ringCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();

  // One shared slide, sampled at a different start frame per layer: quick off
  // the mark, then a long ease into place.
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

  const coreDelay = TRAIL_COLORS.length * STAGGER_FRAMES;
  const coreOffset = offsetAt(coreDelay);

  // Everything below is the approved heart loop, clocked from the landing.
  const loopFrame = frame - LAND;
  const alive = loopFrame >= 0;
  const cycle = alive ? (loopFrame % LOOP) / LOOP : 0;
  const beatPhase = (cycle * beats + BEAT_ANCHOR) % 1;
  const beat = alive ? heartbeat(beatPhase) : 0;

  const flows = VESSELS.map((vessel) => {
    const raw = (beatPhase - vessel.start) / vessel.span;
    if (!alive || raw < 0 || raw > 1) {
      return {...vessel, offset: vessel.dash, opacity: 0};
    }

    const travel = vessel.easing(raw);

    return {
      ...vessel,
      // Dash walks from just before the start of the path to just past its end.
      offset: interpolate(travel, [0, 1], [vessel.dash, -100]),
      opacity:
        interpolate(raw, [0, 0.12, 0.72, 1], [0, vessel.peak, vessel.peak, 0]) *
        liveliness,
    };
  });

  // Pressure wave shed on the lub and gone well before the next one, so the
  // ring reads as a flick off the contraction rather than a border.
  const rings = [];
  for (let i = 0; alive && i < ringCount; i++) {
    const p = (((beatPhase + i * 0.22) % 1) - 0.05) / 0.4;
    if (p < 0 || p > 1) {
      continue;
    }

    const grow = Easing.out(Easing.quad)(p);
    rings.push({
      key: i,
      rx: interpolate(grow, [0, 1], [170, 234]),
      ry: interpolate(grow, [0, 1], [188, 256]),
      strokeWidth: interpolate(grow, [0, 1], [5, 1.6]),
      opacity: interpolate(p, [0, 0.18, 1], [0, 0.11, 0]) * liveliness,
    });
  }

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    ...maskStyle(icon),
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      {/* The beat rides the whole stack, so the colour copies stay perfectly
          hidden behind the core instead of fringing out on every contraction. */}
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          rotate: `${Math.sin(cycle * Math.PI * 2) * 1.2 * liveliness}deg`,
          // Volume-preserving squeeze: the ventricles widen as they shorten.
          scale: `${1 + beat * 0.024 * liveliness} ${
            1 - beat * 0.018 * liveliness
          }`,
          translate: `0px ${beat * 3 * liveliness}px`,
        }}
      >
        {/* Listed in arrival order, and stacked the same way: orange at the
            back, then purple, then blue, with the core on top of all of them. */}
        {TRAIL_COLORS.map((color, i) =>
          hasStarted(i * STAGGER_FRAMES) ? (
            <div
              key={color}
              style={{
                ...layerStyle,
                zIndex: i + 1,
                translate: `0px ${offsetAt(i * STAGGER_FRAMES)}px`,
                backgroundColor: color,
              }}
            />
          ) : null,
        )}

        {hasStarted(coreDelay) ? (
          <>
            {/* Hard readability shadow, behind the core and behind the colours
                so it never darkens them. Zero blur, rides with the core. */}
            <div
              style={{
                ...layerStyle,
                zIndex: 0,
                translate: `${shadowOffset}px ${coreOffset + shadowOffset}px`,
                backgroundColor: '#000000',
              }}
            />

            {/* Flair sits under the core but over the colours, so flow shows
                only where the artwork cuts a channel through the mark. */}
            {alive ? (
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: TRAIL_COLORS.length + 1,
                  width: '100%',
                  height: '100%',
                  overflow: 'visible',
                }}
                viewBox="0 0 512 512"
              >
                {rings.map((ring) => (
                  <ellipse
                    key={`ring-${ring.key}`}
                    cx={CX}
                    cy={CY}
                    rx={ring.rx}
                    ry={ring.ry}
                    fill="none"
                    stroke={coreColor}
                    strokeWidth={ring.strokeWidth}
                    opacity={ring.opacity}
                  />
                ))}
                {flows.map((flow) => (
                  <path
                    key={`flow-${flow.key}`}
                    d={flow.d}
                    pathLength={100}
                    fill="none"
                    stroke={coreColor}
                    strokeWidth={flow.width}
                    strokeLinecap="round"
                    strokeDasharray={`${flow.dash} 200`}
                    strokeDashoffset={flow.offset}
                    opacity={flow.opacity}
                  />
                ))}
              </svg>
            ) : null}

            {/* Core: the icon's own alpha over flat white, on top of all. */}
            <div
              style={{
                ...layerStyle,
                zIndex: TRAIL_COLORS.length + 2,
                translate: `0px ${coreOffset}px`,
                backgroundColor: coreColor,
              }}
            />
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default HeartCoreMemoryEntrance;
