import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  background: z.string().default('#101420'),
  holeColor: z.string().default('#07090E'),
  accent: z.string().default('#D9A66C'),
  slate: z.string().default('#5C6B85'),
});

export type BlackHoleEvilSwallowProps = z.infer<typeof schema>;

export const defaultProps: BlackHoleEvilSwallowProps = schema.parse({});

// Same stage geometry as the other clips, for continuity
const CX = 540;
const CY = 960;
const RX = 370;
const RY = 145;
const TILT = -16; // degrees
const ORBIT_PERIOD = 78; // frames per revolution

// One second of animation-free padding at each end for edit freedom
const PAD = 30;

const ZOOM_START = PAD + 20;
const ZOOM_END = PAD + 82;
const ZOOM_SCALE = 2.15;

// The laugh sits late so the dive follows it without a dead gap
const LAUGH = PAD + 116;

// The satellite breaks orbit on the near side of its orbit (bottom-right,
// in front of the hole) and dives up into the mouth
const DIVE_START = PAD + 153;
const DIVE_END = PAD + 177;

const STARS: Array<{x: number; y: number; r: number; o: number}> = [
  {x: 180, y: 380, r: 2.2, o: 0.22},
  {x: 860, y: 300, r: 1.8, o: 0.18},
  {x: 940, y: 1240, r: 2.4, o: 0.2},
  {x: 130, y: 1180, r: 1.6, o: 0.16},
  {x: 700, y: 1500, r: 2.0, o: 0.18},
  {x: 330, y: 220, r: 1.5, o: 0.15},
];

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

const drawIn = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const BlackHoleEvilSwallow: React.FC<BlackHoleEvilSwallowProps> = ({
  background,
  holeColor,
  accent,
  slate,
}) => {
  const frame = useCurrentFrame();

  // Smooth, unhurried push-in centered on the black hole
  const zoom = interpolate(frame, [ZOOM_START, ZOOM_END], [1, ZOOM_SCALE], {
    easing: Easing.bezier(0.55, 0, 0.15, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Orbit linework fades as we get close; the satellite stays this time
  const orbitFade = interpolate(frame, [ZOOM_START + 10, ZOOM_END - 10], [1, 0], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Face reveal: carved shapes fade and settle in
  const eyesIn = drawIn(frame, PAD + 66, PAD + 86);
  const mouthIn = drawIn(frame, PAD + 76, PAD + 96);

  // Very subtle laugh: a slow bob and faint rock, easing out before the dive
  const laughEnvelope = interpolate(
    frame,
    [LAUGH, LAUGH + 8, LAUGH + 20, LAUGH + 32],
    [0, 1, 1, 0],
    {
      easing: Easing.bezier(0.45, 0, 0.55, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const laughPhase = ((frame - LAUGH) / 13) * Math.PI * 2;
  const laughBob = Math.sin(laughPhase) * 2.2 * laughEnvelope;
  const laughRock = Math.sin(laughPhase * 0.5) * 0.7 * laughEnvelope;

  // The dive: blend the orbital position toward the mouth while the angle keeps advancing
  const dive = interpolate(frame, [DIVE_START, DIVE_END], [0, 1], {
    easing: Easing.bezier(0.5, 0, 0.6, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Mouth opens to receive, then closes; a small gulp pulse after swallowing
  const mouthOpen = interpolate(
    frame,
    [DIVE_START + 8, DIVE_END, DIVE_END + 12],
    [0, 1, 0],
    {
      easing: Easing.bezier(0.45, 0, 0.55, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const gulp = interpolate(
    frame,
    [DIVE_END, DIVE_END + 6, DIVE_END + 16],
    [0, 1, 0],
    {
      easing: Easing.bezier(0.45, 0, 0.55, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  const mouthStretch =
    1 + Math.max(0, Math.sin(laughPhase)) * 0.07 * laughEnvelope + mouthOpen * 0.28;

  const angle = -Math.PI * 0.35 + (frame / ORBIT_PERIOD) * Math.PI * 2;
  const base = orbitPoint(angle);

  // Mouth center in stage coordinates (inside the zoom group)
  const mouthTarget = {x: CX, y: CY + 44};
  const sat = {
    x: interpolate(dive, [0, 1], [base.x, mouthTarget.x]),
    y: interpolate(dive, [0, 1], [base.y, mouthTarget.y]),
    farSide: base.farSide,
  };
  const satR = interpolate(dive, [0, 0.75, 1], [9, 6.5, 2.5]);
  const satOpacity = interpolate(dive, [0.92, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const trail = [1, 2, 3, 4, 5].map((i) => {
    const p = orbitPoint(angle - i * 0.13);
    const trailFade = 1 - dive;
    return {
      x: interpolate(dive, [0, 1], [p.x, mouthTarget.x]),
      y: interpolate(dive, [0, 1], [p.y, mouthTarget.y]),
      opacity: (1 - i / 6) * 0.35 * trailFade,
    };
  });

  const satellite = (visibleWhenFar: boolean) => {
    // Once diving, always render in front of the face
    const inFront = dive > 0 ? !visibleWhenFar : sat.farSide === visibleWhenFar;
    if (!inFront && dive > 0) return null;
    if (dive === 0 && sat.farSide !== visibleWhenFar) return null;
    return (
      <g opacity={satOpacity}>
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
        <circle cx={sat.x} cy={sat.y} r={satR} fill={accent} />
      </g>
    );
  };

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
            opacity={0.45 * orbitFade}
            strokeLinecap="round"
          />

          {satellite(true)}

          <g
            transform={`translate(${CX} ${CY + laughBob}) rotate(${laughRock}) scale(${1 + gulp * 0.028})`}
          >
            <circle
              cx={0}
              cy={0}
              r={122}
              fill="none"
              stroke={accent}
              strokeWidth={10}
              opacity={0.16}
              style={{filter: 'blur(14px)'}}
            />
            <circle cx={0} cy={0} r={122} fill="none" stroke={accent} strokeWidth={2} opacity={0.9} />
            <circle cx={0} cy={0} r={112} fill={holeColor} />

            {/* the face: carved cutout shapes — slanted wedge eyes, crescent grin */}
            <g fill="#020307">
              <g opacity={eyesIn} transform={`scale(${0.92 + eyesIn * 0.08})`}>
                <path d="M -58 -42 Q -32 -36 -18 -20 Q -44 -16 -56 -28 Q -61 -34 -58 -42 Z" />
                <path d="M 58 -42 Q 32 -36 18 -20 Q 44 -16 56 -28 Q 61 -34 58 -42 Z" />
              </g>
              <g
                opacity={mouthIn}
                transform={`scale(${0.92 + mouthIn * 0.08}) scale(1 ${mouthStretch})`}
              >
                <path d="M -52 20 Q 0 46 52 20 Q 34 66 0 68 Q -34 66 -52 20 Z" />
              </g>
            </g>
          </g>

          {satellite(false)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default BlackHoleEvilSwallow;
