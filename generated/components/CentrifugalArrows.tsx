import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  background: z.string().default('#101420'),
  holeColor: z.string().default('#07090E'),
  accent: z.string().default('#D9A66C'),
  slate: z.string().default('#5C6B85'),
});

export type CentrifugalArrowsProps = z.infer<typeof schema>;

export const defaultProps: CentrifugalArrowsProps = schema.parse({});

// Same stage geometry as the other black hole scenes, for continuity
const CX = 540;
const CY = 960;
const RX = 370;
const RY = 145;
const TILT = -16; // degrees
const ORBIT_PERIOD = 78; // frames per revolution

// One second of animation-free padding at each end for edit freedom
const PAD = 30;
const ARROWS_IN = PAD + 4;

// "...another effect which drags you towards the black hole"
const FLIP = PAD + 112;
const ZOOM_START = FLIP;
const ZOOM_END = FLIP + 60;
const ZOOM_SCALE = 1.5;

const STARS: Array<{x: number; y: number; r: number; o: number}> = [
  {x: 180, y: 380, r: 2.2, o: 0.22},
  {x: 860, y: 300, r: 1.8, o: 0.18},
  {x: 940, y: 1240, r: 2.4, o: 0.2},
  {x: 130, y: 1180, r: 1.6, o: 0.16},
  {x: 700, y: 1500, r: 2.0, o: 0.18},
  {x: 330, y: 220, r: 1.5, o: 0.15},
];

// Screen-space directions, offset so no arrow sits on the orbit's tight
// top/bottom where the ellipse passes closest to the ring
const ARROW_ANGLES = [-16, 29, 119, 164, 209, 299].map((d) => (d * Math.PI) / 180);
const ARROW_R1 = 144;
const ARROW_R2 = 202;

const TILT_RAD = (TILT * Math.PI) / 180;

const orbitPoint = (t: number) => {
  const ex = RX * Math.cos(t);
  const ey = RY * Math.sin(t);
  return {
    x: CX + ex * Math.cos(TILT_RAD) - ey * Math.sin(TILT_RAD),
    y: CY + ex * Math.sin(TILT_RAD) + ey * Math.cos(TILT_RAD),
    farSide: Math.sin(t) < 0,
  };
};

const CentrifugalArrows: React.FC<CentrifugalArrowsProps> = ({
  background,
  holeColor,
  accent,
  slate,
}) => {
  const frame = useCurrentFrame();

  const angle = -Math.PI * 0.35 + (frame / ORBIT_PERIOD) * Math.PI * 2;
  const sat = orbitPoint(angle);

  const trail = [1, 2, 3, 4, 5].map((i) => {
    const p = orbitPoint(angle - i * 0.13);
    return {...p, opacity: (1 - i / 6) * 0.35};
  });

  const satellite = (visibleWhenFar: boolean) =>
    sat.farSide === visibleWhenFar ? (
      <g>
        {trail.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={5.5 - i * 0.7}
            fill={accent}
            opacity={p.opacity}
          />
        ))}
        <circle cx={sat.x} cy={sat.y} r={9} fill={accent} />
      </g>
    ) : null;

  // A slow, steady breath shared by all arrows
  const pulse = Math.sin(((frame - ARROWS_IN) / 52) * Math.PI * 2);
  const pulseOffset = Math.max(0, pulse) * 7;
  const pulseOpacity = 0.55 + Math.max(0, pulse) * 0.2;

  // Smooth push-in as the second effect takes over
  const zoom = interpolate(frame, [ZOOM_START, ZOOM_END], [1, ZOOM_SCALE], {
    easing: Easing.bezier(0.55, 0, 0.15, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 900px 700px at 50% 50%, rgba(92,107,133,0.14), rgba(92,107,133,0) 70%)`,
        }}
      />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={slate} opacity={s.o} />
        ))}

        <ellipse
          cx={CX}
          cy={CY}
          rx={RX}
          ry={RY}
          transform={`rotate(${TILT} ${CX} ${CY})`}
          fill="none"
          stroke={slate}
          strokeWidth={1.5}
          opacity={0.45}
          strokeLinecap="round"
        />

        {satellite(true)}

        <g>
          <circle
            cx={CX}
            cy={CY}
            r={122}
            fill="none"
            stroke={accent}
            strokeWidth={10}
            opacity={0.16}
            style={{filter: 'blur(14px)'}}
          />
          <circle cx={CX} cy={CY} r={122} fill="none" stroke={accent} strokeWidth={2} opacity={0.9} />
          <circle cx={CX} cy={CY} r={112} fill={holeColor} />
        </g>

        {/* force arrows: radial pushes away, then flipping to drags inward */}
        {ARROW_ANGLES.map((a, i) => {
          const growOut = interpolate(
            frame,
            [ARROWS_IN + i * 3, ARROWS_IN + 14 + i * 3],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            },
          );
          const retract = interpolate(frame, [FLIP + i * 3, FLIP + 14 + i * 3], [1, 0], {
            easing: Easing.in(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const growIn = interpolate(
            frame,
            [FLIP + 12 + i * 3, FLIP + 30 + i * 3],
            [0, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            },
          );
          const ux = Math.cos(a);
          const uy = Math.sin(a);
          const head = 13;
          const px = -uy;
          const py = ux;

          const arrow = (rTail: number, rTip: number, visible: number) => {
            if (visible <= 0.001) {
              return null;
            }
            const x1 = CX + ux * rTail;
            const y1 = CY + uy * rTail;
            const x2 = CX + ux * rTip;
            const y2 = CY + uy * rTip;
            const dir = Math.sign(rTip - rTail);
            const hx1 = x2 - dir * ux * head + px * head * 0.66;
            const hy1 = y2 - dir * uy * head + py * head * 0.66;
            const hx2 = x2 - dir * ux * head - px * head * 0.66;
            const hy2 = y2 - dir * uy * head - py * head * 0.66;
            return (
              <g
                stroke={slate}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={visible * pulseOpacity}
                fill="none"
              >
                <path d={`M ${x1} ${y1} L ${x2} ${y2}`} />
                <path d={`M ${hx1} ${hy1} L ${x2} ${y2} L ${hx2} ${hy2}`} opacity={visible} />
              </g>
            );
          };

          const outLen = growOut * retract;
          return (
            <g key={i}>
              {arrow(
                ARROW_R1 + pulseOffset,
                ARROW_R1 + (ARROW_R2 - ARROW_R1) * outLen + pulseOffset,
                outLen,
              )}
              {arrow(
                ARROW_R2 - pulseOffset,
                ARROW_R2 - (ARROW_R2 - ARROW_R1) * growIn - pulseOffset,
                growIn,
              )}
            </g>
          );
        })}

        {satellite(false)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default CentrifugalArrows;
