import React from 'react';
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

export const FPS = 30;
// 00:00:48.740 -> 00:00:57.299 of the source cut. round(8.559 * 30).
export const DURATION = 257;

// ---------------------------------------------------------------------------
// The AI at the centre, with everything it reaches out to. The principle
// clamps on at the one thing it was aimed at, then opens symmetrically until
// it has closed all the way around, and the reach is pulled back out of every
// single spoke. The last one to go is the one at the top: ordinary work.
//
// Fitted to an ellipse rather than a circle so a 9:16 frame is actually used.
// ---------------------------------------------------------------------------
const CX = 540;
const CY = 960;
// 12 spokes: the crime straight down, ordinary work straight up, five
// symmetric pairs between them. The ban's reach is therefore a half-angle in
// clean 30 degree steps, and it closes exactly on the top spoke.
const N = 12;
const STEP = 30;
// Circular, not fitted to the frame: an ellipse makes the horizontal spokes
// stubby next to the vertical ones, and a length difference that means nothing
// still reads as if it meant something.
const RX = 420;
const RY = 420;
// The rule sits just outside everything it governs, on the 80px safe margin.
const ARC_RX = 460;
const ARC_RY = 460;
// The logo is a radial starburst itself, so the spokes have to start well
// clear of it or the two forms merge and it stops reading as a mark at all.
const R_IN = 215;
const SPOKE_W = 16;
// The AI's reach into each task, measured from its own end of the connection.
const SEG_LEN = 84;
const LOGO_SIZE = 320;

const rad = (deg: number) => (deg * Math.PI) / 180;

// j is the offset from the crime spoke, so |j| * STEP is exactly the reach the
// rule needs for this spoke to fall inside it.
const SPOKES = Array.from({length: N}, (_, i) => {
  const j = i <= N / 2 ? i : i - N;
  const a = rad(90 + j * STEP);
  const p0 = {x: CX + R_IN * Math.cos(a), y: CY + R_IN * Math.sin(a)};
  const p1 = {x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a)};
  const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  return {j, mag: Math.abs(j), a, p0, p1, dx: (p1.x - p0.x) / len, dy: (p1.y - p0.y) / len};
});

const CRIME = SPOKES[0];

const ease = {
  out: Easing.out(Easing.cubic),
  slam: Easing.bezier(0.12, 0.62, 0.2, 1),
  pop: Easing.bezier(0.2, 1.5, 0.4, 1),
};

const ramp = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing: (n: number) => number = ease.out,
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// Forces the artwork to the accent colour while keeping its alpha, so the logo
// lands as exactly the accent rather than an approximation of it.
const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  const n =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};

const onArc = (deg: number, k: number) => ({
  x: CX + ARC_RX * k * Math.cos(rad(deg)),
  y: CY + ARC_RY * k * Math.sin(rad(deg)),
});

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  logo: z.string(),
  logoSize: z.number().min(80).max(480),
  unknownOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  deadOpacity: z.number().min(0).max(1),
  // Beat frames from the SRT at 30fps, relative to 00:00:48.740:
  //   0 "but if we" · 11 "want to" · 27 "lock in a" · 43 "principle"
  //   53 "that says" · 82 "that we" · 88 "can never" · 101 "allow it"
  //   122 "such that an ai" · 145 "could help" · 157 "you at least"
  //   180 "partially with" · 212 "something" · 223 "like a"
  //   234 "cybercrime" (ends 257)
  beats: z.object({
    enter: z.number().int(),
    rule: z.number().int(),
    lock: z.number().int(),
    brackets: z.number().int(),
    enforce: z.number().int(),
    help: z.number().int(),
    rise: z.number().int(),
    riseEnd: z.number().int(),
    target: z.number().int(),
  }),
});

export type PrincipleBanRadialProps = z.infer<typeof schema>;

export const defaultProps: PrincipleBanRadialProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#C15F3C',
  shadow: 'rgba(0, 0, 0, 0.28)',
  logo: 'claude.png',
  logoSize: LOGO_SIZE,
  unknownOpacity: 0.1,
  readOpacity: 0.85,
  deadOpacity: 0.32,
  beats: {
    enter: 2,
    rule: 27,
    lock: 44,
    brackets: 53,
    enforce: 84,
    help: 145,
    rise: 180,
    riseEnd: 238,
    target: 234,
  },
});

const PrincipleBanRadial: React.FC<PrincipleBanRadialProps> = ({
  ink,
  accent,
  shadow,
  logo,
  logoSize,
  unknownOpacity,
  readOpacity,
  deadOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Half-angle of the ban. It clamps on at just over one spoke's slot, holds,
  // then opens at a constant rate until it meets itself at the top.
  const reach =
    frame < beats.rise
      ? STEP / 2 + 1
      : // Overshoots 180 so the last spoke clears the boundary completely
        // rather than stopping half-severed exactly on it.
        interpolate(frame, [beats.rise, beats.riseEnd], [STEP / 2 + 1, 188], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // The rule drops in from outside and clamps down onto the one thing it was
  // written for.
  const clamp = ramp(frame, [beats.rule, beats.lock], [0, 1], ease.slam);
  const arcK = interpolate(clamp, [0, 1], [1.55, 1]);
  const enforce = ramp(frame, [beats.enforce, beats.enforce + 16], [0, 1]);
  const bracket = ramp(frame, [beats.brackets, beats.brackets + 9], [0, 1], ease.pop);
  const thicken = ramp(frame, [beats.enforce, beats.enforce + 12], [0, 1]);
  const target = ramp(frame, [beats.target, beats.target + 11], [0, 1], ease.pop);
  const logoIn = ramp(frame, [beats.enter, beats.enter + 16], [0, 1], ease.pop);

  const closed = reach >= 179.5;
  const a1 = 90 - reach;
  const a2 = 90 + reach;
  const p1 = onArc(a1, arcK);
  const p2 = onArc(a2, arcK);
  const arcPath = `M ${p1.x} ${p1.y} A ${ARC_RX * arcK} ${ARC_RY * arcK} 0 ${
    reach > 90 ? 1 : 0
  } 1 ${p2.x} ${p2.y}`;

  const [tr, tg, tb] = rgbOf(accent);

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="logo-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {SPOKES.map((s, i) => {
            const t0 = beats.enter + s.mag * 2.6;
            const enter = ramp(frame, [t0, t0 + 12], [0, 1]);
            if (enter <= 0) return null;

            // Taken is read off the rule's own reach, so the boundary and the
            // spokes behind it cannot drift apart if the beats move.
            const covered = interpolate(reach - s.mag * STEP, [-6, 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const gone = covered * enforce;

            // The reach arrives on the words that name it, working outward from
            // the crime — the same path the ban will later take back.
            const h0 = beats.help + (s.mag - 1) * 5;
            const lit = s.mag === 0 ? 0 : ramp(frame, [h0, h0 + 10], [0, 1]);
            const seg = SEG_LEN * lit * (1 - gone);

            const alive = ramp(frame, [t0 + 6, t0 + 20], [unknownOpacity, readOpacity]);
            const op = interpolate(gone, [0, 1], [alive, deadOpacity]);

            return (
              <g key={i}>
                <line
                  x1={s.p0.x}
                  y1={s.p0.y}
                  x2={s.p0.x + (s.p1.x - s.p0.x) * enter}
                  y2={s.p0.y + (s.p1.y - s.p0.y) * enter}
                  stroke={ink}
                  strokeWidth={SPOKE_W}
                  strokeLinecap="round"
                  opacity={op}
                />
                {seg > 1 ? (
                  <line
                    x1={s.p0.x}
                    y1={s.p0.y}
                    x2={s.p0.x + s.dx * seg}
                    y2={s.p0.y + s.dy * seg}
                    stroke={accent}
                    strokeWidth={SPOKE_W}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            );
          })}

          {/* The one thing the principle was actually written for, named last.
              The field is already receded by now, so ink annotation can sit on
              top of it without fighting. */}
          {target > 0 ? (
            <rect
              x={CX - 30}
              y={CRIME.p0.y - 18}
              width={60}
              height={(CRIME.p1.y - CRIME.p0.y + 36) * target}
              rx={30}
              fill="none"
              stroke={ink}
              strokeWidth={3}
              opacity={0.9 * target}
            />
          ) : null}

          {frame >= beats.rule ? (
            <g opacity={clamp}>
              {closed ? (
                <ellipse
                  cx={CX}
                  cy={CY}
                  rx={ARC_RX}
                  ry={ARC_RY}
                  fill="none"
                  stroke={ink}
                  strokeWidth={5 + 2 * thicken}
                  opacity={0.95}
                />
              ) : (
                <path
                  d={arcPath}
                  fill="none"
                  stroke={ink}
                  strokeWidth={5 + 2 * thicken}
                  strokeLinecap="butt"
                  opacity={0.95}
                />
              )}
              {closed
                ? null
                : [a1, a2].map((a) => {
                    const i0 = onArc(a, arcK * 0.965);
                    const i1 = onArc(a, arcK * 1.035);
                    return (
                      <line
                        key={a}
                        x1={i0.x + (i1.x - i0.x) * (0.5 - bracket / 2)}
                        y1={i0.y + (i1.y - i0.y) * (0.5 - bracket / 2)}
                        x2={i0.x + (i1.x - i0.x) * (0.5 + bracket / 2)}
                        y2={i0.y + (i1.y - i0.y) * (0.5 + bracket / 2)}
                        stroke={ink}
                        strokeWidth={5}
                        opacity={0.95 * bracket}
                      />
                    );
                  })}
            </g>
          ) : null}
        </g>
      </svg>

      <Img
        src={staticFile(logo)}
        style={{
          position: 'absolute',
          left: CX - logoSize / 2,
          top: CY - logoSize / 2,
          width: logoSize,
          height: logoSize,
          opacity: logoIn,
          scale: interpolate(logoIn, [0, 1], [0.82, 1]),
          filter: `url(#logo-tint) drop-shadow(0 2px 6px ${shadow})`,
        }}
      />
    </AbsoluteFill>
  );
};

export default PrincipleBanRadial;
