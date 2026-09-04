import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  orbitSpeed: z.number().min(0.1).max(3).default(1),
  holeRadius: z.number().min(60).max(260).default(140),
  starOpacity: z.number().min(0).max(1).default(0.4),
  starBlur: z.number().min(0).max(40).default(14),
  discColor: z.string().default('#FF8A22'),
  hotColor: z.string().default('#FFE7B0'),
  haloColor: z.string().default('#7A1A06'),
});

export type GalacticCenterStarOrbitsProps = z.infer<typeof schema>;

export const defaultProps: GalacticCenterStarOrbitsProps = schema.parse({});

// Stage: the hole sits at frame centre, where the orbits converge.
const CX = 540;
const CY = 960;
// Reference-frame pixels -> frame pixels
const SCALE = 1.32;
const STAR_R = 46;

// Kepler timing: an orbit of semi-major axis AREF takes TREF frames, everything
// else follows T ~ a^1.5, so inner stars whip through periapsis on their own.
// Measured on reference-frame axes, so SCALE never retimes the motion.
const AREF = 300;
const TREF = 280;

// The star field plays clean, then goes soft as the hole resolves behind it.
const SOFT_START = 72;
const SOFT_END = 140;
const HALO_IN = 78;
const HOLE_IN = 90;
const HOLE_FULL = 146;

// Each star is seeded from its position in the reference still: theta is the
// screen angle from the centre, r0 the distance (reference px). Feeding those
// plus a shape (e, a, inbound/outbound, direction) into the two-body solution
// reproduces the still on frame 0 and then plays it forward.
type OrbitSpec = {
  color: string;
  theta: number; // degrees, screen space (+x right, +y down)
  r0: number; // reference px from centre
  a: number; // semi-major axis, reference px
  e: number;
  phase: 1 | -1; // 1 = past periapsis (outbound), -1 = falling inward
  dir: 1 | -1; // travel direction around the ellipse
  full?: boolean; // draw the whole projected ellipse, not just an arc
  dashed?: boolean; // the stretch that runs behind the hole
  hot?: boolean; // brighter star, red-hot core
};

const SPECS: OrbitSpec[] = [
  {color: '#FF3BB0', theta: -90.0, r0: 363, a: 270, e: 0.86, phase: 1, dir: 1, full: true},
  {color: '#A557FF', theta: -145.5, r0: 306, a: 190, e: 0.88, phase: 1, dir: 1},
  {color: '#35D9EE', theta: -135.0, r0: 193, a: 225, e: 0.45, phase: 1, dir: -1},
  {color: '#FFE04D', theta: -83.5, r0: 159, a: 140, e: 0.45, phase: 1, dir: 1, full: true, hot: true},
  {color: '#2BD46B', theta: -1.6, r0: 210, a: 255, e: 0.5, phase: -1, dir: -1},
  {color: '#FF5555', theta: 16.4, r0: 333, a: 215, e: 0.7, phase: 1, dir: 1, dashed: true},
  {color: '#A8DCFF', theta: 76.5, r0: 107, a: 150, e: 0.8, phase: 1, dir: -1, full: true},
  {color: '#4FE8C8', theta: 110.9, r0: 300, a: 190, e: 0.78, phase: -1, dir: -1},
  {color: '#C9E04D', theta: 114.7, r0: 376, a: 270, e: 0.45, phase: 1, dir: 1, dashed: true},
  {color: '#FF6FC8', theta: 161.6, r0: 32, a: 180, e: 0.9, phase: 1, dir: 1, full: true},
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const ORBITS = SPECS.map((sp) => {
  const r0 = sp.r0 * SCALE;
  const a = sp.a * SCALE;
  const {e} = sp;
  const b = a * Math.sqrt(1 - e * e);
  // Distance fixes the true anomaly: r = a(1-e^2)/(1+e cos v)
  const nu0 = sp.phase * Math.acos(clamp((a * (1 - e * e)) / r0 - 1, -e, e) / e);
  const periRad = (sp.theta * Math.PI) / 180 - sp.dir * nu0;
  const E0 =
    2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu0 / 2), Math.sqrt(1 + e) * Math.cos(nu0 / 2));
  return {
    ...sp,
    a,
    b,
    periRad,
    cosPeri: Math.cos(periRad),
    sinPeri: Math.sin(periRad),
    M0: E0 - e * Math.sin(E0),
    period: TREF * Math.pow(sp.a / AREF, 1.5),
  };
});

type Orbit = (typeof ORBITS)[number];

// Kepler's equation, Newton from the standard starter guess
const solveE = (M: number, e: number) => {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 10; i++) {
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  return E;
};

const posAt = (o: Orbit, E: number) => {
  const xo = o.a * (Math.cos(E) - o.e);
  const yo = o.dir * o.b * Math.sin(E);
  return {
    x: CX + xo * o.cosPeri - yo * o.sinPeri,
    y: CY + xo * o.sinPeri + yo * o.cosPeri,
  };
};

const pathBetween = (o: Orbit, eFrom: number, eTo: number, steps: number, close = false) => {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const p = posAt(o, eFrom + ((eTo - eFrom) * i) / steps);
    d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }
  return close ? `${d}Z` : d;
};

const ease = (frame: number, from: number, to: number, a: number, b: number) =>
  interpolate(frame, [from, to], [a, b], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const linear = (frame: number, from: number, to: number, a: number, b: number) =>
  interpolate(frame, [from, to], [a, b], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const GalacticCenterStarOrbits: React.FC<GalacticCenterStarOrbitsProps> = ({
  orbitSpeed,
  holeRadius,
  starOpacity,
  starBlur,
  discColor,
  hotColor,
  haloColor,
}) => {
  const frame = useCurrentFrame();

  // The field goes soft and translucent: we end up looking through it at what
  // was always sitting behind it.
  const blur = linear(frame, SOFT_START, SOFT_END, 0, starBlur);
  const starFade = linear(frame, SOFT_START + 8, SOFT_END, 1, starOpacity);
  const trackFade = linear(frame, SOFT_START, SOFT_END - 20, 1, 0.18);

  // Reveal in layers — the warm glow bleeds through first, then the disc
  // and shadow resolve.
  const haloIn = ease(frame, HALO_IN, HALO_IN + 46, 0, 1);
  const holeIn = ease(frame, HOLE_IN, HOLE_FULL, 0, 1);
  const holeGrow = ease(frame, HOLE_IN, HOLE_FULL + 24, 0.88, 1);
  // settles in, then breathes very slightly so the last beat is not a still
  const holeScale = holeGrow * (1 + Math.sin(frame / 31) * 0.005);
  const tilt = -13 + Math.sin(frame / 44) * 0.6;

  // hotspots on the ring drift in brightness, like the real image's knots
  const hotA = 0.72 + Math.sin(frame / 23) * 0.2;
  const hotB = 0.64 + Math.sin(frame / 19 + 2.1) * 0.22;

  const R = holeRadius;
  const DX = R * 1.95; // disc reaches this far to each side
  const DY_FAR = R * 1.34; // lensed far side, arcing over the top
  const DY_NEAR = R * 0.4; // near side, crossing in front of the shadow
  const discW = R * 0.17;

  // The disc is banded rather than one flat stroke, so it reads as orbiting
  // material: each band is an arc of its own height, all meeting at the edges.
  const arc = (ry: number, over: boolean) =>
    `M ${-DX} 0 A ${DX} ${ry} 0 0 ${over ? 1 : 0} ${DX} 0`;
  const farBands = [
    {d: arc(DY_FAR * 0.9, true), w: discW * 0.3, o: 0.4},
    {d: arc(DY_FAR, true), w: discW * 0.82, o: 0.92},
    {d: arc(DY_FAR * 1.09, true), w: discW * 0.26, o: 0.32},
  ];
  const nearBands = [
    {d: arc(DY_NEAR * 0.74, false), w: discW * 0.28, o: 0.42},
    {d: arc(DY_NEAR, false), w: discW * 1.15, o: 0.97},
    {d: arc(DY_NEAR * 1.32, false), w: discW * 0.3, o: 0.36},
  ];
  const spike = (side: 1 | -1, len: number, h: number) =>
    `M ${side * DX * len} 0 L ${side * DX * 0.94} ${-h} L ${side * DX * 0.94} ${h} Z`;

  const stars = ORBITS.map((o, i) => {
    const M = o.M0 + (frame * orbitSpeed * Math.PI * 2) / o.period;
    const eNow = solveE(M, o.e);
    const trailSpan = Math.min(2.0, (Math.PI * 2 * 38) / o.period);
    const eTrail = solveE(M - trailSpan, o.e);
    const p = posAt(o, eNow);

    const track = o.full
      ? pathBetween(o, 0, Math.PI * 2, 148, true)
      : pathBetween(o, solveE(M - 2.6, o.e), solveE(M + 1.5, o.e), 96);

    return {
      key: i,
      color: o.color,
      hot: o.hot,
      dashed: o.dashed,
      track,
      trail: pathBetween(o, eTrail, eNow, 40),
      x: p.x,
      y: p.y,
    };
  });

  return (
    <AbsoluteFill>
      {/* the black hole, behind the star field */}
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <defs>
            {/* Doppler brightening across the disc, hot towards the right */}
            <linearGradient id="disc" gradientUnits="userSpaceOnUse" x1={-DX} y1={0} x2={DX} y2={0}>
              <stop offset="0%" stopColor="#B93A08" />
              <stop offset="22%" stopColor={discColor} />
              <stop offset="52%" stopColor="#FFA843" />
              <stop offset="80%" stopColor="#FFD27A" />
              <stop offset="100%" stopColor={hotColor} />
            </linearGradient>
            {/* The plate is transparent, so the glow has to stay genuinely
                translucent and fade to zero alpha without going dark — a dark
                low-alpha edge would read as a grey rim over footage. */}
            <radialGradient id="halo">
              <stop offset="0%" stopColor={haloColor} stopOpacity={0} />
              <stop offset="34%" stopColor={haloColor} stopOpacity={0.26} />
              <stop offset="52%" stopColor="#9E2A08" stopOpacity={0.3} />
              <stop offset="74%" stopColor={haloColor} stopOpacity={0.14} />
              <stop offset="100%" stopColor="#B33A10" stopOpacity={0} />
            </radialGradient>
            {/* the shadow is opaque — it eats whatever is behind the plate */}
            <radialGradient id="shadow">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="66%" stopColor="#000000" />
              <stop offset="90%" stopColor="#140300" />
              <stop offset="100%" stopColor="#43100A" />
            </radialGradient>
          </defs>

          <g transform={`translate(${CX} ${CY}) rotate(${tilt}) scale(${holeScale})`}>
            {/* warm bloom, kept low-alpha so it reads as light over footage */}
            <circle
              cx={0}
              cy={0}
              r={R * 2.5}
              fill="url(#halo)"
              opacity={haloIn}
              style={{filter: `blur(${R * 0.16}px)`}}
            />

            <g opacity={holeIn}>
              {/* soft warmth banked just outside the ring */}
              <circle
                cx={0}
                cy={0}
                r={R * 1.3}
                fill="none"
                stroke={discColor}
                strokeWidth={R * 0.34}
                opacity={0.24}
                style={{filter: `blur(${R * 0.16}px)`}}
              />

              {/* far side of the disc, lensed up over the top */}
              <path
                d={farBands[1].d}
                fill="none"
                stroke="url(#disc)"
                strokeWidth={discW * 1.9}
                strokeLinecap="round"
                opacity={0.4}
                style={{filter: `blur(${R * 0.11}px)`}}
              />
              {farBands.map((band) => (
                <path
                  key={band.d}
                  d={band.d}
                  fill="none"
                  stroke="url(#disc)"
                  strokeWidth={band.w}
                  strokeLinecap="round"
                  opacity={band.o}
                  style={{filter: `blur(${R * 0.028}px)`}}
                />
              ))}

              {/* the disc thins to a flare at each edge */}
              {([-1, 1] as const).map((side) => (
                <g key={side}>
                  <path
                    d={spike(side, 1.34, R * 0.07)}
                    fill={discColor}
                    opacity={0.3}
                    style={{filter: `blur(${R * 0.06}px)`}}
                  />
                  <path
                    d={spike(side, 1.26, R * 0.028)}
                    fill={hotColor}
                    opacity={0.85}
                    style={{filter: `blur(${R * 0.018}px)`}}
                  />
                </g>
              ))}

              {/* photon ring hugging the shadow, with the real image's knots */}
              <circle
                cx={0}
                cy={0}
                r={R * 1.09}
                fill="none"
                stroke={discColor}
                strokeWidth={R * 0.19}
                opacity={0.42}
                style={{filter: `blur(${R * 0.075}px)`}}
              />
              <g style={{filter: `blur(${R * 0.08}px)`}}>
                <path
                  d={`M ${R * 0.3} ${-R * 1.05} A ${R * 1.09} ${R * 1.09} 0 0 1 ${R * 1.05} ${
                    -R * 0.3
                  }`}
                  fill="none"
                  stroke={hotColor}
                  strokeWidth={R * 0.17}
                  strokeLinecap="round"
                  opacity={hotA}
                />
                <path
                  d={`M ${R * 1.03} ${R * 0.36} A ${R * 1.09} ${R * 1.09} 0 0 1 ${R * 0.36} ${
                    R * 1.03
                  }`}
                  fill="none"
                  stroke={hotColor}
                  strokeWidth={R * 0.15}
                  strokeLinecap="round"
                  opacity={hotB}
                />
              </g>
              <circle
                cx={0}
                cy={0}
                r={R * 1.06}
                fill="none"
                stroke="#FFF3D6"
                strokeWidth={R * 0.032}
                opacity={0.8}
                style={{filter: `blur(${R * 0.012}px)`}}
              />

              {/* the shadow itself */}
              <circle cx={0} cy={0} r={R} fill="url(#shadow)" />

              {/* near side of the disc, passing in front of the shadow */}
              <path
                d={nearBands[1].d}
                fill="none"
                stroke="url(#disc)"
                strokeWidth={discW * 2.1}
                strokeLinecap="round"
                opacity={0.38}
                style={{filter: `blur(${R * 0.12}px)`}}
              />
              {nearBands.map((band) => (
                <path
                  key={band.d}
                  d={band.d}
                  fill="none"
                  stroke="url(#disc)"
                  strokeWidth={band.w}
                  strokeLinecap="round"
                  opacity={band.o}
                  style={{filter: `blur(${R * 0.026}px)`}}
                />
              ))}
            </g>
          </g>
        </svg>
      </AbsoluteFill>

      {/* the star field, in front and going translucent */}
      <AbsoluteFill
        style={{
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          opacity: starFade,
        }}
      >
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <defs>
            {/* the reference's intensity colourmap: white core through blue and
                green out to a violet halo */}
            <radialGradient id="blob">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
              <stop offset="15%" stopColor="#E8F5FF" stopOpacity={1} />
              <stop offset="27%" stopColor="#63A8FF" stopOpacity={1} />
              <stop offset="38%" stopColor="#2FD3FF" stopOpacity={0.96} />
              <stop offset="50%" stopColor="#2ADB6E" stopOpacity={0.94} />
              <stop offset="65%" stopColor="#C13BE0" stopOpacity={0.78} />
              <stop offset="79%" stopColor="#7A22A8" stopOpacity={0.44} />
              <stop offset="90%" stopColor="#3A0F5C" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#1E0632" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="blobHot">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
              <stop offset="14%" stopColor="#FFF0BE" stopOpacity={1} />
              <stop offset="25%" stopColor="#FF8A32" stopOpacity={1} />
              <stop offset="36%" stopColor="#FFE04D" stopOpacity={0.95} />
              <stop offset="49%" stopColor="#2ADB6E" stopOpacity={0.9} />
              <stop offset="62%" stopColor="#63A8FF" stopOpacity={0.72} />
              <stop offset="76%" stopColor="#C13BE0" stopOpacity={0.42} />
              <stop offset="89%" stopColor="#3A0F5C" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#1E0632" stopOpacity={0} />
            </radialGradient>
          </defs>

          {stars.map((s) => (
            <g key={s.key}>
              <path
                d={s.track}
                fill="none"
                stroke={s.color}
                strokeWidth={3.2}
                strokeLinecap="round"
                opacity={(s.dashed ? 0.68 : 0.58) * trackFade}
                strokeDasharray={s.dashed ? '17 14' : undefined}
              />
              <path
                d={s.trail}
                fill="none"
                stroke={s.color}
                strokeWidth={12}
                strokeLinecap="round"
                opacity={0.32 * trackFade}
                style={{filter: 'blur(8px)'}}
              />
              <path
                d={s.trail}
                fill="none"
                stroke={s.color}
                strokeWidth={5.4}
                strokeLinecap="round"
                opacity={0.98 * trackFade}
              />
            </g>
          ))}

          {stars.map((s) => (
            <g key={`b${s.key}`}>
              <circle
                cx={s.x}
                cy={s.y}
                r={s.hot ? STAR_R * 1.12 : STAR_R}
                fill={s.hot ? 'url(#blobHot)' : 'url(#blob)'}
              />
              <circle cx={s.x} cy={s.y} r={s.hot ? 8 : 6.5} fill="#FFFFFF" />
            </g>
          ))}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default GalacticCenterStarOrbits;
