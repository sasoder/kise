import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  // Every flag is drawn into the same box, so "consistent size" is guaranteed
  // by construction: only the box changes between the trio and the grid.
  flagAspect: z.number().min(1).max(2),
  bigFlagWidth: z.number().min(160).max(340),
  bigGap: z.number().min(10).max(120),
  smallFlagWidth: z.number().min(90).max(260),
  smallGap: z.number().min(10).max(120),
  gridFlagWidth: z.number().min(120).max(260),
  gridGapX: z.number().min(8).max(90),
  gridGapY: z.number().min(8).max(90),
  blockGap: z.number().min(40).max(300),
  cornerRatio: z.number().min(0).max(0.25),
  // Cue times lifted straight from the SRT, in seconds.
  sixteenAtSec: z.number().min(0).max(30),
  twelveAtSec: z.number().min(0).max(30),
  trioStagger: z.number().min(0).max(20),
  gridStagger: z.number().min(0).max(20),
  dimOpacity: z.number().min(0).max(1),
  emphasisScale: z.number().min(1).max(1.3),
  liveliness: z.number().min(0).max(2),
});

export type SpaceFlagsProps = z.infer<typeof schema>;

export const defaultProps: SpaceFlagsProps = schema.parse({
  flagAspect: 1.5,
  bigFlagWidth: 290,
  bigGap: 48,
  smallFlagWidth: 156,
  smallGap: 40,
  gridFlagWidth: 210,
  gridGapX: 38,
  gridGapY: 44,
  blockGap: 140,
  cornerRatio: 0.06,
  sixteenAtSec: 3.339,
  twelveAtSec: 7.32,
  trioStagger: 7,
  gridStagger: 3.4,
  dimOpacity: 0.25,
  emphasisScale: 1.06,
  liveliness: 1,
});

// Shared authoring box for every flag. Real ratios differ (US is 1.9:1, the
// Union Flag 2:1), but the brief asks for one consistent size, so each flag is
// composed for this box and stretched to fill it.
const VB_W = 90;
const VB_H = 60;

const INNER_RATIO = Math.sin(Math.PI / 10) / Math.sin((7 * Math.PI) / 18);

const starPoints = (cx: number, cy: number, r: number, rotationDeg = 0) => {
  const rot = (rotationDeg * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * INNER_RATIO;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5 + rot;
    pts.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(
        cy +
        radius * Math.sin(angle)
      ).toFixed(2)}`,
    );
  }
  return pts.join(' ');
};

/* ---------------------------------------------------------------- flag art */

const UsFlag: React.FC = () => {
  const stripeH = VB_H / 13;
  const unionW = VB_W * 0.4;
  const unionH = stripeH * 7;
  const starR = VB_H * 0.031;

  const stars: string[] = [];
  for (let row = 0; row < 9; row++) {
    const count = row % 2 === 0 ? 6 : 5;
    const y = (unionH * (2 * row + 1)) / 18;
    for (let col = 0; col < count; col++) {
      const x =
        row % 2 === 0
          ? (unionW * (2 * col + 1)) / 12
          : (unionW * (2 * col + 2)) / 12;
      stars.push(starPoints(x, y, starR));
    }
  }

  return (
    <>
      <rect width={VB_W} height={VB_H} fill="#FFFFFF" />
      {Array.from({length: 7}, (_, i) => (
        <rect
          key={i}
          y={i * 2 * stripeH}
          width={VB_W}
          height={stripeH}
          fill="#B22234"
        />
      ))}
      <rect width={unionW} height={unionH} fill="#3C3B6E" />
      {stars.map((points, i) => (
        <polygon key={i} points={points} fill="#FFFFFF" />
      ))}
    </>
  );
};

const CnFlag: React.FC = () => {
  const big = {x: 15, y: 15, r: 9};
  const small = [
    {x: 30, y: 6},
    {x: 36, y: 12},
    {x: 36, y: 21},
    {x: 30, y: 27},
  ];

  return (
    <>
      <rect width={VB_W} height={VB_H} fill="#DE2910" />
      <polygon points={starPoints(big.x, big.y, big.r)} fill="#FFDE00" />
      {small.map((s, i) => {
        // Each small star's top point aims at the large star.
        const aim =
          (Math.atan2(big.y - s.y, big.x - s.x) * 180) / Math.PI + 90;
        return (
          <polygon
            key={i}
            points={starPoints(s.x, s.y, 3, aim)}
            fill="#FFDE00"
          />
        );
      })}
    </>
  );
};

const RuFlag: React.FC = () => (
  <>
    <rect width={VB_W} height={VB_H / 3} fill="#FFFFFF" />
    <rect y={VB_H / 3} width={VB_W} height={VB_H / 3} fill="#0039A6" />
    <rect y={(VB_H * 2) / 3} width={VB_W} height={VB_H / 3} fill="#D52B1E" />
  </>
);

// Crescent band swept as an explicit polygon so the arc geometry is exact; the
// inner radius eases out to the outer one at the start angle to point the tip.
const crescent = (
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  a0: number,
  a1: number,
  steps = 48,
) => {
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const rad = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
    const ri = rOuter + (rInner - rOuter) * Math.min(1, t / 0.18);
    outer.push(`${(cx + rOuter * Math.cos(rad)).toFixed(2)},${(cy + rOuter * Math.sin(rad)).toFixed(2)}`);
    inner.push(`${(cx + ri * Math.cos(rad)).toFixed(2)},${(cy + ri * Math.sin(rad)).toFixed(2)}`);
  }
  return `M${outer.join('L')}L${inner.reverse().join('L')}Z`;
};

// Hammer and sickle authored in a 100x100 local box, then scaled into the
// hoist. Bold shapes only — fine detail disappears at grid size.
const SuFlag: React.FC = () => (
  <>
    <rect width={VB_W} height={VB_H} fill="#CC0000" />
    <polygon points={starPoints(16, 10, 6.5)} fill="#FFD700" />
    <g transform="translate(18 31) scale(0.24) translate(-50 -50)" fill="#FFD700">
      <path d={crescent(50, 50, 45, 33, 200, 20)} />
      <path d="M81,61.3 L92.3,65.4 L86,84 L74.7,79.9 Z" />
      <g transform="rotate(42 50 58)">
        <rect x={45} y={26} width={11} height={68} rx={2} />
        <rect x={27} y={14} width={46} height={17} rx={3} />
      </g>
    </g>
  </>
);

const FrFlag: React.FC = () => (
  <>
    <rect width={VB_W / 3} height={VB_H} fill="#002395" />
    <rect x={VB_W / 3} width={VB_W / 3} height={VB_H} fill="#FFFFFF" />
    <rect x={(VB_W * 2) / 3} width={VB_W / 3} height={VB_H} fill="#ED2939" />
  </>
);

const ItFlag: React.FC = () => (
  <>
    <rect width={VB_W / 3} height={VB_H} fill="#008C45" />
    <rect x={VB_W / 3} width={VB_W / 3} height={VB_H} fill="#F4F5F0" />
    <rect x={(VB_W * 2) / 3} width={VB_W / 3} height={VB_H} fill="#CD212A" />
  </>
);

const JpFlag: React.FC = () => (
  <>
    <rect width={VB_W} height={VB_H} fill="#FFFFFF" />
    <circle cx={VB_W / 2} cy={VB_H / 2} r={VB_H * 0.3} fill="#BC002D" />
  </>
);

const UaFlag: React.FC = () => (
  <>
    <rect width={VB_W} height={VB_H / 2} fill="#0057B7" />
    <rect y={VB_H / 2} width={VB_W} height={VB_H / 2} fill="#FFD700" />
  </>
);

const EuFlag: React.FC = () => {
  const ring = VB_H / 3;
  return (
    <>
      <rect width={VB_W} height={VB_H} fill="#003399" />
      {Array.from({length: 12}, (_, i) => {
        const angle = -Math.PI / 2 + (i * Math.PI) / 6;
        return (
          <polygon
            key={i}
            points={starPoints(
              VB_W / 2 + ring * Math.cos(angle),
              VB_H / 2 + ring * Math.sin(angle),
              VB_H / 18,
            )}
            fill="#FFCC00"
          />
        );
      })}
    </>
  );
};

const InFlag: React.FC = () => (
  <>
    <rect width={VB_W} height={VB_H / 3} fill="#FF9933" />
    <rect y={VB_H / 3} width={VB_W} height={VB_H / 3} fill="#FFFFFF" />
    <rect y={(VB_H * 2) / 3} width={VB_W} height={VB_H / 3} fill="#138808" />
    <g stroke="#000080" fill="none">
      <circle cx={45} cy={30} r={8.6} strokeWidth={1.1} />
      {Array.from({length: 24}, (_, i) => {
        const a = (i * Math.PI) / 12;
        return (
          <line
            key={i}
            x1={45 + 2 * Math.cos(a)}
            y1={30 + 2 * Math.sin(a)}
            x2={45 + 8.6 * Math.cos(a)}
            y2={30 + 8.6 * Math.sin(a)}
            strokeWidth={0.55}
          />
        );
      })}
    </g>
    <circle cx={45} cy={30} r={1.8} fill="#000080" />
  </>
);

const IlFlag: React.FC = () => {
  const r = 11;
  const tri = (flip: boolean) =>
    Array.from({length: 3}, (_, i) => {
      const a = (-Math.PI / 2 + (i * 2 * Math.PI) / 3) * (flip ? -1 : 1);
      return `${(45 + r * Math.cos(a)).toFixed(2)},${(
        30 +
        r * Math.sin(a)
      ).toFixed(2)}`;
    }).join(' ');

  return (
    <>
      <rect width={VB_W} height={VB_H} fill="#FFFFFF" />
      <rect x={0} y={8} width={VB_W} height={6.5} fill="#0038B8" />
      <rect x={0} y={45.5} width={VB_W} height={6.5} fill="#0038B8" />
      <polygon
        points={tri(false)}
        fill="none"
        stroke="#0038B8"
        strokeWidth={2.6}
      />
      <polygon
        points={tri(true)}
        fill="none"
        stroke="#0038B8"
        strokeWidth={2.6}
      />
    </>
  );
};

// Simplified national emblem plus the 22 takbir marks along the band edges —
// both read as texture at grid size, which is what sells the flag.
const IrFlag: React.FC = () => {
  const ticks = Array.from({length: 11}, (_, i) => 8 + i * 7.4);
  return (
    <>
      <rect width={VB_W} height={VB_H / 3} fill="#239F40" />
      <rect y={VB_H / 3} width={VB_W} height={VB_H / 3} fill="#FFFFFF" />
      <rect y={(VB_H * 2) / 3} width={VB_W} height={VB_H / 3} fill="#DA0000" />
      <g fill="#FFFFFF">
        {ticks.map((cx, i) => (
          <g key={`t${i}`}>
            <rect x={cx - 1.6} y={18.2} width={3.2} height={0.75} />
            <rect x={cx - 1.4} y={16.2} width={0.8} height={2} />
            <rect x={cx + 0.6} y={16.2} width={0.8} height={2} />
          </g>
        ))}
        {ticks.map((cx, i) => (
          <g key={`b${i}`}>
            <rect x={cx - 1.6} y={41.05} width={3.2} height={0.75} />
            <rect x={cx - 1.4} y={41.8} width={0.8} height={2} />
            <rect x={cx + 0.6} y={41.8} width={0.8} height={2} />
          </g>
        ))}
      </g>
      <g transform="translate(45 30) scale(0.19) translate(-50 -50)" fill="#DA0000">
        <path d="M50,8 L56,24 L56,78 L44,78 L44,24 Z" />
        <rect x={34} y={30} width={32} height={8} rx={2} />
        <path d="M44,78 C28,70 22,48 31,30 C35,48 37,62 44,71 Z" />
        <path d="M56,78 C72,70 78,48 69,30 C65,48 63,62 56,71 Z" />
        <path d="M20,88 C4,72 3,44 17,26 C11,48 15,70 28,84 Z" />
        <path d="M80,88 C96,72 97,44 83,26 C89,48 85,70 72,84 Z" />
      </g>
    </>
  );
};

const KpFlag: React.FC = () => (
  <>
    <rect width={VB_W} height={VB_H} fill="#024FA2" />
    <rect y={10} width={VB_W} height={40} fill="#FFFFFF" />
    <rect y={13} width={VB_W} height={34} fill="#ED1C27" />
    <circle cx={27} cy={30} r={11} fill="#FFFFFF" />
    <polygon points={starPoints(27, 30, 8.6)} fill="#ED1C27" />
  </>
);

const KrFlag: React.FC = () => {
  const R = 12;
  const r = R / 2;
  const bar = (solid: boolean, y: number) =>
    solid ? (
      <rect x={-6} y={y} width={12} height={2} />
    ) : (
      <>
        <rect x={-6} y={y} width={5} height={2} />
        <rect x={1} y={y} width={5} height={2} />
      </>
    );
  const trigram = (
    key: string,
    cx: number,
    cy: number,
    rot: number,
    pattern: [boolean, boolean, boolean],
  ) => (
    <g key={key} transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      {pattern.map((solid, i) => (
        <g key={i}>{bar(solid, -4.6 + i * 3.2)}</g>
      ))}
    </g>
  );

  return (
    <>
      <rect width={VB_W} height={VB_H} fill="#FFFFFF" />
      <g transform="translate(45 30) rotate(56.31)">
        <circle r={R} fill="#CD2E3A" />
        <path
          d={`M0,-${R} A${R},${R} 0 0 1 0,${R} A${r},${r} 0 0 1 0,0 A${r},${r} 0 0 0 0,-${R} Z`}
          fill="#0047A0"
        />
      </g>
      <g fill="#000000">
        {trigram('tl', 24, 16, -56.31, [true, true, true])}
        {trigram('tr', 66, 16, 56.31, [false, true, false])}
        {trigram('bl', 24, 44, 56.31, [true, false, true])}
        {trigram('br', 66, 44, -56.31, [false, false, false])}
      </g>
    </>
  );
};

// Canonical Union Flag construction, authored 60x30 and stretched to fit.
// The clip quadrants are what counterchange the red saltire.
const UnionJack: React.FC<{
  uid: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}> = ({uid, x = 0, y = 0, w = VB_W, h = VB_H}) => (
  <svg
    x={x}
    y={y}
    width={w}
    height={h}
    viewBox="0 0 60 30"
    preserveAspectRatio="none"
  >
    <defs>
      <clipPath id={`uj-${uid}`}>
        <path d="M30,15 h30 v15 z M30,15 v15 h-30 z M30,15 h-30 v-15 z M30,15 v-15 h30 z" />
      </clipPath>
    </defs>
    <rect width={60} height={30} fill="#012169" />
    <path
      d="M0,0 L60,30 M60,0 L0,30"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={6}
    />
    <path
      d="M0,0 L60,30 M60,0 L0,30"
      fill="none"
      stroke="#C8102E"
      strokeWidth={4}
      clipPath={`url(#uj-${uid})`}
    />
    <path
      d="M30,0 V30 M0,15 H60"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={10}
    />
    <path
      d="M30,0 V30 M0,15 H60"
      fill="none"
      stroke="#C8102E"
      strokeWidth={6}
    />
  </svg>
);

const GbFlag: React.FC<{uid: string}> = ({uid}) => <UnionJack uid={uid} />;

const NzFlag: React.FC<{uid: string}> = ({uid}) => {
  const stars: {x: number; y: number; r: number}[] = [
    {x: 67.5, y: 14.5, r: 3.6}, // Gamma
    {x: 76.5, y: 24.5, r: 3.0}, // Delta
    {x: 57.5, y: 31.0, r: 3.6}, // Beta
    {x: 67.5, y: 48.5, r: 4.0}, // Alpha
  ];
  return (
    <>
      <rect width={VB_W} height={VB_H} fill="#00247D" />
      <UnionJack uid={uid} w={VB_W / 2} h={VB_H / 2} />
      {stars.map((s, i) => (
        <g key={i}>
          <polygon points={starPoints(s.x, s.y, s.r + 1)} fill="#FFFFFF" />
          <polygon points={starPoints(s.x, s.y, s.r)} fill="#CC142B" />
        </g>
      ))}
    </>
  );
};

/* ------------------------------------------------------------------ registry */

type FlagId =
  | 'us'
  | 'cn'
  | 'ru'
  | 'su'
  | 'fr'
  | 'jp'
  | 'gb'
  | 'eu'
  | 'in'
  | 'il'
  | 'ua'
  | 'ir'
  | 'it'
  | 'kp'
  | 'kr'
  | 'nz';

const ART: Record<FlagId, React.FC<{uid: string}>> = {
  us: UsFlag,
  cn: CnFlag,
  ru: RuFlag,
  su: SuFlag,
  fr: FrFlag,
  jp: JpFlag,
  gb: GbFlag,
  eu: EuFlag,
  in: InFlag,
  il: IlFlag,
  ua: UaFlag,
  ir: IrFlag,
  it: ItFlag,
  kp: KpFlag,
  kr: KrFlag,
  nz: NzFlag,
};

// "Only three countries can send people into space."
const TRIO: FlagId[] = ['us', 'cn', 'ru'];

// "and 16 others have launched satellites or uncrewed vehicles" — in the order
// the user listed them, read left to right, top to bottom.
const SIXTEEN: FlagId[] = [
  'su',
  'us',
  'fr',
  'jp',
  'cn',
  'gb',
  'eu',
  'in',
  'il',
  'ua',
  'ru',
  'ir',
  'it',
  'kp',
  'kr',
  'nz',
];

// "but only 12 can do so on their own" — the four that are not on that list.
const DEPENDENT = new Set([0, 5, 6, 9]); // su, gb, eu, ua

/* --------------------------------------------------------------------- box */

const FlagBox: React.FC<{
  id: FlagId;
  uid: string;
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
  opacity: number;
  scale: number;
  rotate: number;
}> = ({id, uid, left, top, width, height, radius, opacity, scale, rotate}) => {
  const Art = ART[id];
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        opacity,
        scale,
        rotate: `${rotate.toFixed(3)}deg`,
        borderRadius: radius,
        overflow: 'hidden',
        clipPath: `inset(0 round ${radius.toFixed(2)}px)`,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Art uid={uid} />
      </svg>
    </div>
  );
};

/* -------------------------------------------------------------------- scene */

const POP_IN = Easing.bezier(0.34, 1.56, 0.64, 1);
const SETTLE = Easing.bezier(0.5, 0, 0.15, 1);

const SpaceFlags: React.FC<SpaceFlagsProps> = ({
  flagAspect,
  bigFlagWidth,
  bigGap,
  smallFlagWidth,
  smallGap,
  gridFlagWidth,
  gridGapX,
  gridGapY,
  blockGap,
  cornerRatio,
  sixteenAtSec,
  twelveAtSec,
  trioStagger,
  gridStagger,
  dimOpacity,
  emphasisScale,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const f16 = sixteenAtSec * fps;
  const f12 = twelveAtSec * fps;

  const smallH = smallFlagWidth / flagAspect;
  const gridH = gridFlagWidth / flagAspect;

  const gridW = 4 * gridFlagWidth + 3 * gridGapX;
  const gridBlockH = 4 * gridH + 3 * gridGapY;

  // The trio's parked row and the grid are centred as one assembly, so the
  // frame stays balanced once everything has arrived.
  const assemblyH = smallH + blockGap + gridBlockH;
  const assemblyTop = (height - assemblyH) / 2;
  const gridTop = assemblyTop + smallH + blockGap;
  const gridLeft = (width - gridW) / 2;

  // Trio: big and centred, then shrinks and rises into its parked row.
  const settle = interpolate(frame, [f16, f16 + 26], [0, 1], {
    easing: SETTLE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const trioW = interpolate(settle, [0, 1], [bigFlagWidth, smallFlagWidth]);
  const trioH = trioW / flagAspect;
  const trioGap = interpolate(settle, [0, 1], [bigGap, smallGap]);
  const trioRowW = 3 * trioW + 2 * trioGap;
  const trioCy = interpolate(
    settle,
    [0, 1],
    [height / 2, assemblyTop + smallH / 2],
  );

  const idle = (seed: number, from: number, amount: number) => {
    const on = interpolate(frame, [from + 10, from + 36], [0, 1], {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const phase = (frame / (fps * 3.6)) * Math.PI * 2 + seed * 2.1;
    return {
      dy: Math.sin(phase) * amount * liveliness * on,
      tilt: Math.sin(phase + 0.9) * amount * 0.09 * liveliness * on,
    };
  };

  return (
    <AbsoluteFill>
      {TRIO.map((id, i) => {
        const delay = i * trioStagger;
        const pop = interpolate(frame - delay, [0, 22], [0, 1], {
          easing: POP_IN,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(frame - delay, [0, 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const {dy, tilt} = idle(i, delay, 4);
        const cx = (width - trioRowW) / 2 + i * (trioW + trioGap) + trioW / 2;

        return (
          <FlagBox
            key={`trio-${id}`}
            id={id}
            uid={`trio-${id}`}
            left={cx - trioW / 2}
            top={trioCy - trioH / 2 + dy + interpolate(pop, [0, 1], [26, 0])}
            width={trioW}
            height={trioH}
            radius={trioW * cornerRatio}
            opacity={opacity}
            scale={interpolate(pop, [0, 1], [0.55, 1])}
            rotate={tilt}
          />
        );
      })}

      {SIXTEEN.map((id, j) => {
        const col = j % 4;
        const row = Math.floor(j / 4);
        const start = f16 + 10 + j * gridStagger;

        const pop = interpolate(frame - start, [0, 20], [0, 1], {
          easing: POP_IN,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(frame - start, [0, 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        // The 12 that launch on their own step forward; the other four recede.
        const ripple = f12 + j * 0.7;
        const dependent = DEPENDENT.has(j);
        const shift = interpolate(frame, [ripple, ripple + 18], [0, 1], {
          easing: dependent ? Easing.inOut(Easing.quad) : POP_IN,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const stateOpacity = dependent
          ? interpolate(shift, [0, 1], [1, dimOpacity])
          : 1;
        const stateScale = interpolate(
          shift,
          [0, 1],
          [1, dependent ? 0.9 : emphasisScale],
        );

        const {dy, tilt} = idle(j + 3, start, 2.4);

        return (
          <FlagBox
            key={`grid-${id}-${j}`}
            id={id}
            uid={`grid-${id}-${j}`}
            left={gridLeft + col * (gridFlagWidth + gridGapX)}
            top={
              gridTop +
              row * (gridH + gridGapY) +
              dy +
              interpolate(pop, [0, 1], [20, 0])
            }
            width={gridFlagWidth}
            height={gridH}
            radius={gridFlagWidth * cornerRatio}
            opacity={opacity * stateOpacity}
            scale={interpolate(pop, [0, 1], [0.55, 1]) * stateScale}
            rotate={tilt}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export default SpaceFlags;
