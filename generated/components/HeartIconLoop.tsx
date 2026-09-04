import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
export const DURATION = 96;

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  beats: z.number().int().min(1).max(8),
  ringCount: z.number().int().min(0).max(3),
  liveliness: z.number().min(0).max(2),
});

export type HeartIconLoopProps = z.infer<typeof schema>;

export const defaultProps: HeartIconLoopProps = schema.parse({
  icon: 'heart.png',
  iconSize: 700,
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
    peak: 0.5,
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
    peak: 0.5,
  },
  {
    // Great vein running the other way: filling, during diastole.
    key: 'inflow',
    d: 'M 191 140 C 195 158, 202 180, 212 200 C 219 214, 224 222, 228 231 C 220 242, 210 252, 201 261',
    width: 18,
    dash: 30,
    start: 0.42,
    span: 0.5,
    easing: Easing.inOut(Easing.quad),
    peak: 0.42,
  },
  {
    // Coronary artery in the interventricular groove: slow, base to apex.
    key: 'coronary',
    d: 'M 353 326 C 348 350, 336 374, 318 394 C 308 406, 299 417, 292 428',
    width: 13,
    dash: 22,
    start: 0.1,
    span: 0.85,
    easing: Easing.linear,
    peak: 0.4,
  },
] as const;

// Shortest signed distance on a wrapped 0-1 phase, so bumps never seam.
const wrap = (d: number) => d - Math.round(d);

const bump = (b: number, centre: number, width: number) =>
  Math.exp(-Math.pow(wrap(b - centre) / width, 2));

// Lub-dub: a hard first sound, a softer second a quarter-beat later.
const heartbeat = (b: number) => bump(b, 0.05, 0.055) + 0.5 * bump(b, 0.26, 0.07);

const HeartIconLoop: React.FC<HeartIconLoopProps> = ({
  icon,
  iconSize,
  beats,
  ringCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;
  const beatPhase = (cycle * beats) % 1;
  const beat = heartbeat(beatPhase);

  const flows = VESSELS.map((vessel) => {
    const raw = (beatPhase - vessel.start) / vessel.span;
    if (raw < 0 || raw > 1) {
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
  for (let i = 0; i < ringCount; i++) {
    const p = (((cycle * beats + i * 0.22) % 1) - 0.05) / 0.4;
    if (p < 0 || p > 1) {
      continue;
    }

    const grow = Easing.out(Easing.quad)(p);
    rings.push({
      key: i,
      rx: interpolate(grow, [0, 1], [170, 234]),
      ry: interpolate(grow, [0, 1], [188, 256]),
      strokeWidth: interpolate(grow, [0, 1], [5, 1.6]),
      opacity: interpolate(p, [0, 0.18, 1], [0, 0.09, 0]) * liveliness,
    });
  }

  const svgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
  };

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          // Slow sway across the whole loop, independent of the beat.
          rotate: `${Math.sin(cycle * Math.PI * 2) * 1.2 * liveliness}deg`,
          // Volume-preserving squeeze: the ventricles widen as they shorten.
          scale: `${1 + beat * 0.024 * liveliness} ${
            1 - beat * 0.018 * liveliness
          }`,
          translate: `0px ${beat * 3 * liveliness}px`,
        }}
      >
        {/* Behind the artwork, so flow only shows inside the vessel cut-outs. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          {rings.map((ring) => (
            <ellipse
              key={`ring-${ring.key}`}
              cx={CX}
              cy={CY}
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke="#000000"
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
              stroke="#000000"
              strokeWidth={flow.width}
              strokeLinecap="round"
              strokeDasharray={`${flow.dash} 200`}
              strokeDashoffset={flow.offset}
              opacity={flow.opacity}
            />
          ))}
        </svg>

        <Img
          src={staticFile(icon)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default HeartIconLoop;
