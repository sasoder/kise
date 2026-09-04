import {loadFont} from '@remotion/google-fonts/Roboto';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
  weights: ['400', '700'],
  subsets: ['latin'],
});

export const schema = z.object({
  variant: z.enum(['loop', 'no-time', 'outward-force']),
});

export type CentrifugalForceVisualsProps = z.infer<typeof schema>;

export const defaultProps = schema.parse({
  variant: 'loop',
});

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

type BucketProps = {
  x: number;
  y: number;
  rotation: number;
  scale?: number;
  opacity?: number;
  waterShift?: number;
  person?: boolean;
};

const Bucket = ({
  x,
  y,
  rotation,
  scale = 1,
  opacity = 1,
  waterShift = 0,
  person = false,
}: BucketProps) => {
  return (
    <g
      opacity={opacity}
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
    >
      <path
        d="M-88 -58 L-66 82 Q0 112 66 82 L88 -58"
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={12}
      />
      <path
        d="M-58 52 Q0 72 58 52 L63 82 Q0 107 -63 82 Z"
        fill="white"
        opacity={person ? 0.22 : 1}
        transform={`translate(0 ${waterShift})`}
      />
      <path
        d="M-83 -55 Q0 -142 83 -55"
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeWidth={7}
        opacity={0.55}
      />
      {person ? (
        <g transform="translate(0 45)">
          <circle cx={0} cy={-13} r={18} fill="white" />
          <path
            d="M0 7 L0 49 M-31 24 L0 12 L31 24 M-22 75 L0 49 L22 75"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={10}
          />
        </g>
      ) : null}
    </g>
  );
};

const Arrow = ({
  x1,
  y1,
  x2,
  y2,
  opacity = 1,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity?: number;
  dashed?: boolean;
}) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 28;
  const wing = 15;
  const hx1 = x2 - head * Math.cos(angle) + wing * Math.sin(angle);
  const hy1 = y2 - head * Math.sin(angle) - wing * Math.cos(angle);
  const hx2 = x2 - head * Math.cos(angle) - wing * Math.sin(angle);
  const hy2 = y2 - head * Math.sin(angle) + wing * Math.cos(angle);

  return (
    <g opacity={opacity}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="white"
        strokeDasharray={dashed ? '18 18' : undefined}
        strokeLinecap="round"
        strokeWidth={9}
      />
      <path
        d={`M${hx1} ${hy1} L${x2} ${y2} L${hx2} ${hy2}`}
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={9}
      />
    </g>
  );
};

const Label = ({children, opacity}: {children: string; opacity: number}) => (
  <div
    style={{
      position: 'absolute',
      bottom: 150,
      left: 0,
      right: 0,
      textAlign: 'center',
      color: 'white',
      fontFamily,
      fontSize: 48,
      fontWeight: 700,
      letterSpacing: 16,
      opacity,
    }}
  >
    {children}
  </div>
);

const LoopGraphic = () => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 126, 220], [90, 450, 630], {
    ...clamp,
    easing: easeInOut,
  });
  const radians = (angle * Math.PI) / 180;
  const x = 540 + Math.cos(radians) * 330;
  const y = 900 + Math.sin(radians) * 330;
  const orbitDraw = interpolate(frame, [0, 36], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const bucketIn = interpolate(frame, [0, 24], [0.7, 1], {
    ...clamp,
    easing: easeOut,
  });
  const emphasis = interpolate(frame, [232, 260, 330, 370], [0, 1, 1, 0], {
    ...clamp,
  });
  const labelOpacity = interpolate(frame, [14, 38, 350, 390], [0, 0.72, 0.72, 0], {
    ...clamp,
  });

  return (
    <>
      <svg viewBox="0 0 1080 1920" style={{width: '100%', height: '100%'}}>
        <circle
          cx={540}
          cy={900}
          r={330}
          fill="none"
          pathLength={1}
          stroke="white"
          strokeDasharray={1}
          strokeDashoffset={1 - orbitDraw}
          strokeWidth={6}
          opacity={0.3}
        />
        <circle cx={540} cy={900} r={11} fill="white" opacity={0.45} />
        <Bucket
          x={x}
          y={y}
          rotation={angle - 90}
          scale={bucketIn}
        />
        <g opacity={emphasis}>
          <path
            d="M452 475 L426 434 M478 455 L468 407 M628 475 L654 434 M602 455 L612 407"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeWidth={8}
          />
        </g>
      </svg>
      <Label opacity={labelOpacity}>LOOP</Label>
    </>
  );
};

const NoTimeGraphic = () => {
  const frame = useCurrentFrame();
  const move = interpolate(frame, [82, 184], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const angle = interpolate(move, [0, 1], [270, 360], clamp);
  const radians = (angle * Math.PI) / 180;
  const x = 540 + Math.cos(radians) * 300;
  const y = 850 + Math.sin(radians) * 300;
  const clockIn = interpolate(frame, [18, 50], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const clockOut = interpolate(frame, [138, 174], [1, 0], clamp);
  const handAngle = interpolate(frame, [38, 150], [-90, 540], clamp);
  const handRadians = (handAngle * Math.PI) / 180;
  const arrowOpacity = interpolate(frame, [8, 35, 92, 128], [0, 0.7, 0.7, 0], clamp);
  const waterShift = interpolate(frame, [10, 78, 118], [0, -24, -6], {
    ...clamp,
    easing: easeInOut,
  });
  const labelOpacity = interpolate(frame, [12, 36, 170, 205], [0, 0.72, 0.72, 0], clamp);

  return (
    <>
      <svg viewBox="0 0 1080 1920" style={{width: '100%', height: '100%'}}>
        <path
          d="M540 550 A300 300 0 0 1 840 850"
          fill="none"
          stroke="white"
          strokeDasharray="16 24"
          strokeLinecap="round"
          strokeWidth={6}
          opacity={0.24}
        />
        <Arrow
          x1={540}
          y1={655}
          x2={540}
          y2={1010}
          dashed
          opacity={arrowOpacity}
        />
        <g opacity={clockIn * clockOut}>
          <circle cx={540} cy={1170} r={132} fill="black" stroke="white" strokeWidth={10} />
          <path
            d="M498 1016 H582 M540 1016 V1038"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeWidth={10}
          />
          <line
            x1={540}
            y1={1170}
            x2={540 + Math.cos(handRadians) * 82}
            y2={1170 + Math.sin(handRadians) * 82}
            stroke="white"
            strokeLinecap="round"
            strokeWidth={10}
          />
          <circle cx={540} cy={1170} r={12} fill="white" />
        </g>
        <Bucket
          x={x}
          y={y}
          rotation={angle - 90}
          waterShift={waterShift}
        />
      </svg>
      <Label opacity={labelOpacity}>TIME</Label>
    </>
  );
};

const Car = ({x, y, rotation, personShift}: {x: number; y: number; rotation: number; personShift: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
    <rect x={-92} y={-155} width={184} height={310} rx={62} fill="black" stroke="white" strokeWidth={11} />
    <path d="M-70 -55 H70 M-70 78 H70" stroke="white" strokeWidth={7} opacity={0.55} />
    <circle cx={personShift} cy={10} r={24} fill="white" />
    <rect x={-114} y={-105} width={24} height={64} rx={10} fill="white" />
    <rect x={90} y={-105} width={24} height={64} rx={10} fill="white" />
    <rect x={-114} y={48} width={24} height={64} rx={10} fill="white" />
    <rect x={90} y={48} width={24} height={64} rx={10} fill="white" />
  </g>
);

const OutwardForceGraphic = () => {
  const frame = useCurrentFrame();
  const diagramIn = interpolate(frame, [0, 28], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const diagramOut = interpolate(frame, [86, 118], [1, 0], clamp);
  const arrowProgress = interpolate(frame, [20, 62], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const carIn = interpolate(frame, [96, 128], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const carProgress = interpolate(frame, [112, 214], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });
  const carAngle = interpolate(carProgress, [0, 1], [90, 20], clamp);
  const carRadians = (carAngle * Math.PI) / 180;
  const carX = 305 + Math.cos(carRadians) * 520;
  const carY = 1030 + Math.sin(carRadians) * 520;
  const personShift = interpolate(carProgress, [0, 0.35, 1], [0, 34, 46], clamp);
  const outwardDistance = interpolate(carProgress, [0, 0.4, 1], [0, 130, 150], clamp);
  const outwardX = Math.cos(carRadians);
  const outwardY = Math.sin(carRadians);
  const labelOpacity = interpolate(frame, [12, 36, 182, 216], [0, 0.72, 0.72, 0], clamp);

  return (
    <>
      <svg viewBox="0 0 1080 1920" style={{width: '100%', height: '100%'}}>
        <g opacity={diagramIn * diagramOut}>
          <circle cx={420} cy={760} r={250} fill="none" stroke="white" strokeWidth={6} opacity={0.28} />
          <circle cx={420} cy={760} r={12} fill="white" opacity={0.6} />
          <Arrow
            x1={438}
            y1={760}
            x2={438 + 188 * arrowProgress}
            y2={760}
            opacity={arrowProgress}
          />
          <Bucket x={735} y={760} rotation={-90} scale={0.92} person />
        </g>

        <g opacity={carIn}>
          <path
            d="M172 1570 A520 520 0 0 1 810 510"
            fill="none"
            stroke="white"
            strokeWidth={10}
            opacity={0.22}
          />
          <path
            d="M298 1598 A650 650 0 0 1 965 406"
            fill="none"
            stroke="white"
            strokeWidth={10}
            opacity={0.22}
          />
          <path
            d="M232 1584 A585 585 0 0 1 888 458"
            fill="none"
            stroke="white"
            strokeDasharray="26 28"
            strokeWidth={6}
            opacity={0.32}
          />
          <Car
            x={carX}
            y={carY}
            rotation={carAngle}
            personShift={personShift}
          />
          <Arrow
            x1={carX + outwardX * 38}
            y1={carY + outwardY * 38}
            x2={carX + outwardX * (38 + outwardDistance)}
            y2={carY + outwardY * (38 + outwardDistance)}
            opacity={interpolate(carProgress, [0.08, 0.4], [0, 0.9], clamp)}
          />
        </g>
      </svg>
      <Label opacity={labelOpacity}>OUTWARD</Label>
    </>
  );
};

const CentrifugalForceVisuals = ({variant}: CentrifugalForceVisualsProps) => {
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      {variant === 'loop' ? <LoopGraphic /> : null}
      {variant === 'no-time' ? <NoTimeGraphic /> : null}
      {variant === 'outward-force' ? <OutwardForceGraphic /> : null}
    </AbsoluteFill>
  );
};

export default CentrifugalForceVisuals;
