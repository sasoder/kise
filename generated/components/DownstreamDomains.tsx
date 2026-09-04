import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  icon: z.string(),
  hubSize: z.number().min(120).max(600),
  nodeSize: z.number().min(40).max(300),
  branches: z.number().int().min(3).max(9),
  radiusX: z.number().min(120).max(520),
  radiusY: z.number().min(120).max(800),
  centerY: z.number().min(0.2).max(0.8),
  strokeWidth: z.number().min(2).max(16),
  tone: z.enum(['ink', 'paper']),
  dataFlow: z.number().min(0).max(1),
  liveliness: z.number().min(0).max(2),
});

export type DownstreamDomainsProps = z.infer<typeof schema>;

export const defaultProps: DownstreamDomainsProps = schema.parse({
  icon: 'ai-sparkle.png',
  hubSize: 360,
  nodeSize: 112,
  branches: 6,
  radiusX: 315,
  radiusY: 455,
  centerY: 0.5,
  strokeWidth: 8,
  tone: 'ink',
  dataFlow: 0.8,
  liveliness: 1,
});

// The artwork is three sparkles in a 512 box and the dominant one sits low-left
// of the box centre. Everything anchors to that star — measured off the file's
// alpha — so a branch meets the mark the eye actually reads as the icon.
const ANCHOR_X = 209 / 512;
const ANCHOR_Y = 256 / 512;

// Radial extent of all the ink around that anchor, sampled off the alpha into
// 72 bins and widened by one bin either side. Lets a branch stop exactly where
// the glyph ends in its own direction: tight against a star's waist, clear of
// the two companion sparkles out to the right. Units are fractions of the
// rendered icon size, bin 0 starting at -180deg.
const EXTENT = [
  0.2706, 0.2706, 0.2304, 0.1954, 0.1713, 0.1576, 0.1499, 0.1424, 0.1385,
  0.1385, 0.1424, 0.1499, 0.1576, 0.1713, 0.1935, 0.2304, 0.2725, 0.2725,
  0.2725, 0.2725, 0.2324, 0.1954, 0.1732, 0.3871, 0.5409, 0.5409, 0.5409,
  0.5356, 0.5452, 0.5452, 0.5452, 0.3819, 0.1954, 0.2324, 0.2725, 0.2725,
  0.2725, 0.2725, 0.2324, 0.1954, 0.3819, 0.5452, 0.5452, 0.5452, 0.5356,
  0.5409, 0.5409, 0.5409, 0.3871, 0.1732, 0.1954, 0.2324, 0.2725, 0.2725,
  0.2725, 0.2725, 0.2304, 0.1935, 0.1713, 0.1576, 0.1499, 0.1424, 0.1385,
  0.1385, 0.1424, 0.1499, 0.1576, 0.1713, 0.1954, 0.2304, 0.2706, 0.2706,
];

// `angle` is in the icon's own frame — subtract any rotation before calling.
const extentAt = (angle: number, size: number) => {
  const turn = (angle / (Math.PI * 2) + 0.5) % 1;
  const bin = Math.floor((turn < 0 ? turn + 1 : turn) * EXTENT.length);
  return EXTENT[bin % EXTENT.length] * size;
};

// Deterministic 0..1 scatter — organic spacing that never flickers between frames.
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// Beat timings in frames at 30fps. The fan is complete by f58 (~1.9s) and the
// returning data lands by f98 (~3.3s), so the whole idea reads inside the
// "developing AIs for new downstream domains" line, with a held tail to trim.
const BRANCH_START = 10;
const BRANCH_STAGGER = 6;
const BRANCH_DRAW = 18;
const RETURN_START = 58;
const RETURN_STAGGER = 4;
const RETURN_TRAVEL = 20;

// Reveal order alternates across the hub instead of sweeping round it like a
// clock hand, which is what made an even fan read as a snowflake.
const revealSlot = (i: number, n: number) =>
  i % 2 === 0 ? i / 2 : Math.ceil(n / 2) + (i - 1) / 2;

// A signal running strictly inside [start, start + length): position plus an
// envelope so it never appears or vanishes on a hard edge.
const travel = (frame: number, start: number, length: number) => {
  const p = (frame - start) / length;
  if (p <= 0 || p >= 1) {
    return null;
  }
  return {
    p,
    fade: Math.min(1, p / 0.18) * Math.min(1, (1 - p) / 0.28),
  };
};

const DownstreamDomains: React.FC<DownstreamDomainsProps> = ({
  icon,
  hubSize,
  nodeSize,
  branches,
  radiusX,
  radiusY,
  centerY,
  strokeWidth,
  tone,
  dataFlow,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  // The artwork is black, so the light variant inverts it rather than tinting —
  // that keeps the alpha exactly as authored.
  const paper = tone === 'paper';
  const INK = paper ? '#ffffff' : '#000000';
  const glyph = paper ? 'invert(1)' : undefined;

  const cx = width / 2;
  const cy = height * centerY;
  const margin = strokeWidth * 0.7;

  const layout = new Array(branches).fill(0).map((_, i) => {
    // An even fan of straight spokes reads as a snowflake, so neighbours are
    // pulled together in alternating pairs and each branch then kinks *away*
    // from its partner. That also opens two wide gaps at roughly +-45deg, which
    // is exactly where the hub's own companion sparkles sit — otherwise a
    // branch line starts at one of them and it reads as a seventh node.
    const side = i % 2 === 0 ? -1 : 1;
    const base = -90 + (360 / branches) * i + side * 14;
    const a0 = (base + (hash(i, 1) - 0.5) * 8) * (Math.PI / 180);
    const bend = -side * (12 + hash(i, 2) * 26) * (Math.PI / 180);
    const knee = 0.46 + hash(i, 5) * 0.16;
    const reach = 0.9 + hash(i, 6) * 0.26;

    // Built on a unit circle, then squashed onto the ellipse so the fan fills a
    // 9:16 frame without the elbows flattening out.
    const kxN = Math.cos(a0) * knee;
    const kyN = Math.sin(a0) * knee;
    const nxN = kxN + Math.cos(a0 + bend) * (1 - knee) * reach;
    const nyN = kyN + Math.sin(a0 + bend) * (1 - knee) * reach;

    const kx = cx + kxN * radiusX;
    const ky = cy + kyN * radiusY;
    const nx = cx + nxN * radiusX;
    const ny = cy + nyN * radiusY;

    const size = nodeSize * (0.9 + hash(i, 8) * 0.22);
    const tilt = (hash(i, 3) - 0.5) * 40;

    // Leave the hub where its glyph ends in this direction...
    const out = Math.atan2(ky - cy, kx - cx);
    const d0 = Math.hypot(kx - cx, ky - cy);
    const lead = extentAt(out, hubSize) + margin;
    const sx = cx + ((kx - cx) / d0) * lead;
    const sy = cy + ((ky - cy) / d0) * lead;

    // ...and stop where the node's glyph starts, measured in its tilted frame.
    const back = Math.atan2(ky - ny, kx - nx);
    const d1 = Math.hypot(nx - kx, ny - ky);
    const tail = extentAt(back - tilt * (Math.PI / 180), size) + margin;
    const ex = nx - ((nx - kx) / d1) * tail;
    const ey = ny - ((ny - ky) / d1) * tail;

    const drawStart = BRANCH_START + revealSlot(i, branches) * BRANCH_STAGGER;

    // The bead that carries data back rides the same polyline, so it has to be
    // parameterised by arc length rather than by segment.
    const legA = Math.hypot(kx - sx, ky - sy);
    const legB = Math.hypot(ex - kx, ey - ky);
    const split = legA / (legA + legB);
    const pointAt = (t: number) =>
      t <= split
        ? ([sx + ((kx - sx) * t) / split, sy + ((ky - sy) * t) / split] as const)
        : ([
            kx + ((ex - kx) * (t - split)) / (1 - split),
            ky + ((ey - ky) * (t - split)) / (1 - split),
          ] as const);

    return {
      i,
      nx,
      ny,
      size,
      tilt,
      pointAt,
      d: `M ${sx},${sy} L ${kx},${ky} L ${ex},${ey}`,
      drawStart,
      landed: drawStart + BRANCH_DRAW,
      returnAt: RETURN_START + revealSlot(i, branches) * RETURN_STAGGER,
      // Each node keeps its own slow bob so the held tail is never dead still.
      bobPhase: hash(i, 4) * Math.PI * 2,
      bobRate: 0.9 + hash(i, 7) * 0.5,
    };
  });

  const hubSpring = spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.6, stiffness: 170},
  });

  // Charge swelling in the core as the returning data arrives.
  const lastReturn = RETURN_START + (branches - 1) * RETURN_STAGGER;
  const charge = interpolate(
    frame,
    [
      RETURN_START + RETURN_TRAVEL - 6,
      lastReturn + RETURN_TRAVEL,
      lastReturn + RETURN_TRAVEL + 20,
    ],
    [0, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const breath = Math.sin((frame / fps) * 1.6);
  const hubScale =
    hubSpring * (1 + breath * 0.012 * liveliness + charge * 0.05 * liveliness);

  // Opening ring, so the sparkle arrives with a push behind it and frame 0 is
  // never blank.
  const burst = travel(frame, -1, 22);

  const anchored = (size: number): React.CSSProperties => ({
    position: 'absolute',
    width: size,
    height: size,
    filter: glyph,
    transformOrigin: `${ANCHOR_X * 100}% ${ANCHOR_Y * 100}%`,
  });

  return (
    <AbsoluteFill>
      <svg
        style={{position: 'absolute', inset: 0}}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {layout.map((b) => {
          const draw = interpolate(frame, [b.drawStart, b.landed], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (draw <= 0) {
            return null;
          }

          const ping = travel(frame, b.landed + 1, 16);
          const flow = travel(frame, b.returnAt, RETURN_TRAVEL);
          // Runs node -> hub, i.e. backwards along the drawn direction.
          const head = flow ? 1 - flow.p : 0;

          return (
            <g key={b.i}>
              <path
                d={b.d}
                pathLength={1}
                fill="none"
                stroke={INK}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1 1"
                strokeDashoffset={1 - draw}
              />

              {ping ? (
                <circle
                  cx={b.nx}
                  cy={b.ny}
                  r={b.size * 0.3 + ping.p * b.size * 0.42}
                  fill="none"
                  stroke={INK}
                  strokeWidth={strokeWidth * (1 - ping.p * 0.7)}
                  opacity={(1 - ping.p) * 0.4}
                />
              ) : null}

              {/* Everything here is one flat black, so a travelling dash drawn
                  on top of the line is invisible. The returning data has to be
                  a bead wider than the branch instead — it reads as a swelling
                  running back into the core. */}
              {flow
                ? [0, 1, 2].map((t) => {
                    const at = head + t * 0.055;
                    if (at > 1) {
                      return null;
                    }
                    const [px, py] = b.pointAt(at);
                    // Grown out of the branch rather than faded in over it: at
                    // rest the bead is exactly the line's half-width, so it
                    // emerges and retracts instead of turning grey.
                    const swell =
                      strokeWidth * (1.05 - t * 0.42) * flow.fade * dataFlow;
                    return (
                      <circle
                        key={t}
                        cx={px}
                        cy={py}
                        r={strokeWidth * 0.5 + swell}
                        fill={INK}
                      />
                    );
                  })
                : null}
            </g>
          );
        })}

        {burst ? (
          <circle
            cx={cx}
            cy={cy}
            r={hubSize * 0.24 + burst.p * hubSize * 0.5}
            fill="none"
            stroke={INK}
            strokeWidth={strokeWidth * (1 - burst.p * 0.6)}
            opacity={(1 - burst.p) * 0.4}
          />
        ) : null}
      </svg>

      {layout.map((b) => {
        const pop = spring({
          frame: frame - b.landed,
          fps,
          config: {damping: 11, mass: 0.5, stiffness: 160},
        });
        if (pop <= 0) {
          return null;
        }
        const bob =
          Math.sin((frame / fps) * b.bobRate + b.bobPhase) * 5 * liveliness;

        return (
          <Img
            key={b.i}
            src={staticFile(icon)}
            style={{
              ...anchored(b.size),
              left: b.nx - b.size * ANCHOR_X,
              top: b.ny - b.size * ANCHOR_Y + bob,
              transform: `scale(${pop}) rotate(${b.tilt}deg)`,
              opacity: Math.min(1, pop * 1.6),
            }}
          />
        );
      })}

      <Img
        src={staticFile(icon)}
        style={{
          ...anchored(hubSize),
          left: cx - hubSize * ANCHOR_X,
          top: cy - hubSize * ANCHOR_Y,
          transform: `scale(${hubScale}) rotate(${
            (1 - hubSpring) * -16 + breath * 0.8 * liveliness
          }deg)`,
          opacity: Math.min(1, hubSpring * 2.5),
        }}
      />
    </AbsoluteFill>
  );
};

export default DownstreamDomains;
