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

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(1040),
  moteCount: z.number().int().min(0).max(12),
  liveliness: z.number().min(0).max(2),
});

export type TeacherIconLoopProps = z.infer<typeof schema>;

export const defaultProps: TeacherIconLoopProps = schema.parse({
  icon: 'teacher.png',
  iconSize: 680,
  moteCount: 6,
  liveliness: 1,
});

// Measured off the source icon in its own 512x512 space. The two written lines
// on the board run 264-411 (y 71) and 271-336 (y 130); the bands just under
// each of them are empty ink-free board, so an emphasis underline fits there.
const UNDERLINES = [
  {x: 271, len: 133, y: 100, draw: [0.04, 0.28], fade: [0.4, 0.5]},
  {x: 271, len: 65, y: 158, draw: [0.54, 0.7], fade: [0.82, 0.92]},
];

const MOTE_LIFE = 0.16; // last mote is gone by cycle 0.86, so the loop stays clean

// A hand tracking under a line: eases away, eases to a stop.
const sweep = Easing.inOut(Easing.quad);

// Stable per-element scatter: deterministic, so nothing flickers frame to frame.
const hash = (i: number, k: number) => {
  let x = (Math.imul(i + 1, 374761393) + Math.imul(k + 1, 668265263)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

const TeacherIconLoop: React.FC<TeacherIconLoopProps> = ({
  icon,
  iconSize,
  moteCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Single normalised cycle keeps every element seamless across the loop point.
  const cycle = (frame % durationInFrames) / durationInFrames;

  // Each underline is drawn on left to right, held, then faded off the board.
  const marks = UNDERLINES.map((u, i) => {
    const grow = sweep(
      interpolate(cycle, u.draw, [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
    return {
      key: i,
      x1: u.x,
      x2: u.x + u.len * grow,
      y: u.y,
      opacity:
        interpolate(
          cycle,
          [u.draw[0], u.draw[0] + 0.02, u.fade[0], u.fade[1]],
          [0, 1, 1, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        ) * 0.4,
    };
  });

  // Chalk dust shed by the tip while it travels, falling away behind it.
  const motes: {
    key: string;
    x: number;
    y: number;
    r: number;
    opacity: number;
  }[] = [];
  UNDERLINES.forEach((u, k) => {
    // The long top sweep sheds more than the short one below it.
    const n = Math.round(moteCount * (k === 0 ? 0.6 : 0.4));
    for (let j = 0; j < n; j++) {
      const spawn = interpolate((j + 0.5) / n, [0, 1], [u.draw[0], u.draw[1]]);
      const age = cycle - spawn;
      if (age < 0 || age > MOTE_LIFE) {
        continue;
      }
      const a = age / MOTE_LIFE;
      const head = u.x + u.len * sweep(interpolate(spawn, u.draw, [0, 1]));
      const jx = hash(j, k) * 2 - 1;
      const jr = hash(j, k + 9);
      motes.push({
        key: `${k}-${j}`,
        x: head - (6 + jx * 7) * a * liveliness,
        // Gravity: barely moves at first, then drops away.
        y: u.y + 7 + a * a * 44 * liveliness,
        r: (3 + jr * 2.4) * (1 - 0.45 * a),
        opacity: interpolate(a, [0, 0.18, 1], [0, 0.55, 0]),
      });
    }
  });

  const sway = Math.sin(cycle * Math.PI * 2);
  const breath = Math.sin(cycle * Math.PI * 4);

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
          // Pivot at the floor rail, so the feet stay planted and the figure
          // and board lean together as one piece.
          transformOrigin: '50% 96%',
          rotate: `${sway * 0.7 * liveliness}deg`,
          scale: `${1 + breath * 0.005 * liveliness} ${
            1 - breath * 0.0035 * liveliness
          }`,
        }}
      >
        {/* Flair sits behind the artwork, so the figure and pointer occlude it. */}
        <svg style={svgStyle} viewBox="0 0 512 512">
          {marks.map((mark) => (
            <line
              key={`mark-${mark.key}`}
              x1={mark.x1}
              y1={mark.y}
              x2={mark.x2}
              y2={mark.y}
              stroke="#000000"
              strokeWidth={12}
              strokeLinecap="round"
              opacity={mark.opacity}
            />
          ))}
          {motes.map((mote) => (
            <circle
              key={`mote-${mote.key}`}
              cx={mote.x}
              cy={mote.y}
              r={mote.r}
              fill="#000000"
              opacity={mote.opacity}
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

export default TeacherIconLoop;
