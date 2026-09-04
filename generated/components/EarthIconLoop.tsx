import {
  AbsoluteFill,
  Img,
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
  orbitCount: z.number().int().min(0).max(2),
  trailCount: z.number().int().min(0).max(6),
  liveliness: z.number().min(0).max(2),
});

export type EarthIconLoopProps = z.infer<typeof schema>;

export const defaultProps: EarthIconLoopProps = schema.parse({
  icon: 'earth.png',
  iconSize: 640,
  orbitCount: 2,
  trailCount: 5,
  liveliness: 1,
});

// Geometry measured off the source icon, in its own 512x512 space.
const CX = 255.5;
const CY = 255.5;
const HIDE_R = 232; // the solid disk, pulled in so orbits tuck under the limb

const TAU = Math.PI * 2;

// Projected circular orbits: rx/ry set the inclination, so each one is hidden
// behind the globe for the part of its path that falls inside HIDE_R.
const ORBITS = [
  {rx: 312, ry: 200, tilt: -19, dir: 1, phase: 0.21, dot: 19},
  {rx: 280, ry: 150, tilt: 27, dir: -1, phase: 0.46, dot: 13},
];

const orbitPoint = (
  orbit: (typeof ORBITS)[number],
  t: number,
  radiusScale = 1,
) => {
  const x = orbit.rx * radiusScale * Math.cos(t);
  const y = orbit.ry * radiusScale * Math.sin(t);
  const a = (orbit.tilt * Math.PI) / 180;
  return {
    x: CX + x * Math.cos(a) - y * Math.sin(a),
    y: CY + x * Math.sin(a) + y * Math.cos(a),
    // Positive is the near half of the orbit, swinging toward the viewer.
    depth: Math.sin(t),
  };
};

const EarthIconLoop: React.FC<EarthIconLoopProps> = ({
  icon,
  iconSize,
  orbitCount,
  trailCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  const orbits = ORBITS.slice(0, orbitCount);

  // One revolution per loop, so the motion is seamless by construction.
  const satellites = orbits.map((orbit, i) => {
    const t = orbit.dir * TAU * (cycle + orbit.phase);
    const trail = [];
    for (let k = 1; k <= trailCount; k++) {
      const p = orbitPoint(orbit, t - orbit.dir * 0.085 * k);
      trail.push({
        key: k,
        x: p.x,
        y: p.y,
        // Near half reads bigger and darker; far half thins out before it
        // slips behind the globe.
        r:
          (orbit.dot / 2) *
          (1 + p.depth * 0.25) *
          Math.pow(1 - k / (trailCount + 1), 0.9),
        opacity:
          0.4 * Math.pow(1 - k / (trailCount + 1), 1.4) * (0.7 + p.depth * 0.2),
      });
    }
    const head = orbitPoint(orbit, t);
    return {
      key: i,
      head,
      r: (orbit.dot / 2) * (1 + head.depth * 0.28),
      opacity: 0.82 + head.depth * 0.12,
      trail,
    };
  });

  const sway = Math.sin(cycle * TAU);
  const breathe = Math.cos(cycle * TAU);

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
          rotate: `${sway * 1.6 * liveliness}deg`,
          // Volume-preserving squash, so the globe reads as settling rather
          // than pumping.
          scale: `${1 + breathe * 0.012 * liveliness} ${
            1 - breathe * 0.008 * liveliness
          }`,
          translate: `0px ${sway * 3 * liveliness}px`,
        }}
      >
        {/* Behind the icon, and masked out over the disk: the artwork has
            transparent continents, so occlusion has to come from the mask
            rather than from the PNG's own coverage. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          <defs>
            <mask id="earth-outside-globe" maskUnits="userSpaceOnUse" x={-96} y={-96} width={704} height={704}>
              <rect x={-96} y={-96} width={704} height={704} fill="#ffffff" />
              <circle cx={CX} cy={CY} r={HIDE_R} fill="#000000" />
            </mask>
          </defs>

          <g mask="url(#earth-outside-globe)">
            {satellites.map((sat) => (
              <g key={`sat-${sat.key}`}>
                {sat.trail.map((dot) => (
                  <circle
                    key={`trail-${sat.key}-${dot.key}`}
                    cx={dot.x}
                    cy={dot.y}
                    r={Math.max(dot.r, 0)}
                    fill="#000000"
                    opacity={Math.max(dot.opacity, 0)}
                  />
                ))}
                <circle
                  cx={sat.head.x}
                  cy={sat.head.y}
                  r={sat.r}
                  fill="#000000"
                  opacity={sat.opacity}
                />
              </g>
            ))}
          </g>
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

export default EarthIconLoop;
