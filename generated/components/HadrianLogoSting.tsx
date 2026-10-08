import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

// ---------------------------------------------------------------------------
// "HADRIAN LOGO STING" — a TRANSPARENT logo overlay on factory b-roll.
//
// CHECK LINE (what the viewer can say after this cut): "The company she is
// talking about is Hadrian."
//
// TIMING, 24 fps, 71 frames, placed at sequence 00:00:32:08. Spoken: "Hadrian
// (f0) is trying to do this in just a few (f33) weeks (f39), so (f48) we (f57)
// put this claim to the test." The footage underneath cuts at f59.
//   IN      f0-28   orange f0, purple f2, blue f4, white core + shadow f6
//   GLIMMER f32-46  one sweep of light, left to right, inside the letters only
//   HOLD    f46-59  settled
//   OUT     f59-69  core + shadow f59, blue f61, purple f63, orange f65; f70 empty
//
// THE MOTION. The real Hadrian wordmark slides up into place as three stacked
// copies in the core-memory chain colours with the white core landing last and
// hiding them (the VastLogoChannelSplit entrance, same easing and stagger), and
// one glint of light runs across the settled letters. On the cut the layers
// drop away in reverse order behind an invisible edge just under the wordmark.
//
// RULES. Raw colours, no bloom, no blend modes, nothing fades: a layer exists or
// it does not. Every layer is the wordmark's own path with a flat fill. The
// glint is the one soft gradient, and it is a fill on the same path, so it can
// never spill outside the glyphs or onto the shadow.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 71;
export const FRAME_W = 1080;
export const FRAME_H = 1920;

// The wordmark from hadrian.co (public/machina06/hadrian-wordmark.svg), one
// path, viewBox 0 0 174 29 (the ink is 28.2 tall), inlined untouched.
const VB_W = 174;
const INK_H = 28.2; // the path's own height inside the viewBox
const WORDMARK =
  'M18.2633 4.20833e-07H24.0369V28.2001H18.2633V16.2209H5.77359V28.2001H3.78244e-05V4.20833e-07H5.77359V11.2329H18.2633V4.20833e-07ZM37.3624 4.20833e-07H43.9608L54.526 28.2001H48.6739L46.4352 22.1516H34.8095L32.5708 28.2001H26.8365L37.3624 4.20833e-07ZM40.5831 6.40197L36.6162 17.2421H44.5892L40.5831 6.40197ZM57.3029 28.2001V4.20833e-07H67.0041C69.9628 4.20833e-07 72.5027 0.576047 74.6236 1.72814C76.7707 2.88023 78.4203 4.51673 79.5723 6.63762C80.7244 8.73234 81.3005 11.2198 81.3005 14.1C81.3005 16.9541 80.7244 19.4416 79.5723 21.5625C78.4203 23.6834 76.7707 25.3198 74.6236 26.4719C72.5027 27.624 69.9628 28.2001 67.0041 28.2001H57.3029ZM62.9587 23.2513H67.0041C68.8369 23.2513 70.3818 22.8717 71.6386 22.1123C72.9216 21.353 73.9035 20.2925 74.5843 18.931C75.2651 17.5432 75.6055 15.9329 75.6055 14.1C75.6055 12.241 75.2651 10.6307 74.5843 9.26911C73.9035 7.88136 72.9216 6.82091 71.6386 6.08776C70.3556 5.32843 68.7977 4.94876 66.9648 4.94876H62.9587V23.2513ZM90.654 17.7134V28.2001H84.8804V4.20833e-07H96.4275C99.6743 4.20833e-07 102.24 0.759334 104.126 2.278C106.011 3.77049 106.953 5.96993 106.953 8.87635C106.953 11.0234 106.404 12.8039 105.304 14.2179C104.204 15.6056 102.659 16.5875 100.669 17.1636L107.7 28.2001H101.101L94.5816 17.7134H90.654ZM90.654 12.8825H96.1133C97.8153 12.8825 99.0852 12.5421 99.9231 11.8613C100.787 11.1544 101.219 10.1725 101.219 8.91563C101.219 7.63261 100.787 6.65072 99.9231 5.96993C99.0852 5.26297 97.8153 4.90948 96.1133 4.90948H90.654V12.8825ZM116.582 4.20833e-07V28.2001H110.809V4.20833e-07H116.582ZM129.876 4.20833e-07H136.474L147.039 28.2001H141.187L138.948 22.1516H127.323L125.084 28.2001H119.35L129.876 4.20833e-07ZM133.096 6.40197L129.129 17.2421H137.102L133.096 6.40197ZM173.578 4.20833e-07V28.2001H168.551L155.354 8.75852V28.2001H149.816V4.20833e-07H155.668L168.04 18.4989V4.20833e-07H173.578Z';

const TRAIL_COLORS = [
  '#FFB765', // orange, first to arrive, last to leave
  '#BC37FF', // purple
  '#0046FF', // blue
];
const BLACK = '#000000';

const IN_TRAVEL = 22;
const GLINT_START = 32;
const GLINT_END = 46;
const OUT_START = 59;
const OUT_TRAVEL = 5;

export const schema = z.object({
  logoWidth: z.number().min(240).max(1040),
  centerY: z.number().min(0).max(FRAME_H),
  coreColor: z.string(),
  // hard readability shadow, px, zero blur
  shadowOffset: z.number().min(0).max(48),
  // how far each layer travels on the way in, px
  rise: z.number().min(0).max(400),
  // how far each layer drops on the way out, px (must clear the wordmark height)
  drop: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
  // the glint: a pale cool tint either side of a pure white core
  glintTint: z.string(),
  glintDeep: z.string(),
  glintWidth: z.number().min(20).max(600),
  glintTiltDeg: z.number().min(0).max(60),
});

export type HadrianLogoStingProps = z.infer<typeof schema>;

export const defaultProps: HadrianLogoStingProps = schema.parse({
  logoWidth: 760,
  centerY: 700,
  coreColor: '#FFFFFF',
  shadowOffset: 6,
  rise: 130,
  drop: 140,
  staggerFrames: 2,
  glintTint: '#B9D2F4',
  glintDeep: '#6F9BD8',
  glintWidth: 250,
  glintTiltDeg: 20,
});

const HadrianLogoSting: React.FC<HadrianLogoStingProps> = ({
  logoWidth,
  centerY,
  coreColor,
  shadowOffset,
  rise,
  drop,
  staggerFrames,
  glintTint,
  glintDeep,
  glintWidth,
  glintTiltDeg,
}) => {
  const frame = useCurrentFrame();

  const s = logoWidth / VB_W;
  const left = (FRAME_W - logoWidth) / 2;
  const top = centerY - (INK_H * s) / 2;
  const bottom = top + INK_H * s;

  // order 0 = orange ... 3 = the white core. In: 0 first. Out: 3 first.
  const CORE = TRAIL_COLORS.length;
  const inStart = (order: number) => order * staggerFrames;
  const outStart = (order: number) => OUT_START + (CORE - order) * staggerFrames;

  // Nothing fades: a layer is simply not rendered before its turn or after it
  // has left.
  const exists = (order: number) =>
    frame >= inStart(order) && frame < outStart(order) + OUT_TRAVEL;

  const offsetAt = (order: number) => {
    const tIn = interpolate(frame, [inStart(order), inStart(order) + IN_TRAVEL], [0, 1], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const tOut = interpolate(frame, [outStart(order), outStart(order) + OUT_TRAVEL], [0, 1], {
      easing: Easing.bezier(0.7, 0, 0.84, 0),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (1 - tIn) * rise + tOut * drop;
  };

  const place = (dx: number, dy: number) => `translate(${left + dx} ${top + dy}) scale(${s})`;
  const coreOffset = offsetAt(CORE);

  // The glint, in the path's own units. The band leans like "/", so its normal
  // (the gradient axis) points right and slightly down.
  const glinting = frame >= GLINT_START && frame <= GLINT_END;
  const tilt = (glintTiltDeg * Math.PI) / 180;
  const half = glintWidth / s / 2;
  const reach = half + (Math.tan(tilt) * INK_H) / 2 + 1;
  const gx = interpolate(frame, [GLINT_START, GLINT_END], [-reach, VB_W + reach], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gy = INK_H / 2;
  const nx = Math.cos(tilt);
  const ny = Math.sin(tilt);

  // On the way out the layers disappear behind an invisible edge just under
  // the wordmark (and its shadow) instead of falling down the frame. The way
  // in is unclipped, as in the reference entrance.
  const leaving = frame >= OUT_START;

  return (
    <AbsoluteFill>
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
        <defs>
          <clipPath id="hadrian-sting-edge">
            <rect x={0} y={0} width={FRAME_W} height={bottom + shadowOffset} />
          </clipPath>
          <linearGradient
            id="hadrian-sting-glint"
            gradientUnits="userSpaceOnUse"
            x1={gx - nx * half}
            y1={gy - ny * half}
            x2={gx + nx * half}
            y2={gy + ny * half}
          >
            <stop offset={0} stopColor={glintTint} stopOpacity={0} />
            <stop offset={0.26} stopColor={glintTint} stopOpacity={1} />
            <stop offset={0.4} stopColor={glintDeep} stopOpacity={1} />
            <stop offset={0.45} stopColor="#FFFFFF" stopOpacity={1} />
            <stop offset={0.55} stopColor="#FFFFFF" stopOpacity={1} />
            <stop offset={0.6} stopColor={glintDeep} stopOpacity={1} />
            <stop offset={0.74} stopColor={glintTint} stopOpacity={1} />
            <stop offset={1} stopColor={glintTint} stopOpacity={0} />
          </linearGradient>
        </defs>

        <g clipPath={leaving ? 'url(#hadrian-sting-edge)' : undefined}>
          {exists(CORE) ? (
            <path
              d={WORDMARK}
              fill={BLACK}
              transform={place(shadowOffset, coreOffset + shadowOffset)}
            />
          ) : null}

          {TRAIL_COLORS.map((color, i) =>
            exists(i) ? (
              <path key={color} d={WORDMARK} fill={color} transform={place(0, offsetAt(i))} />
            ) : null,
          )}

          {exists(CORE) ? (
            <path d={WORDMARK} fill={coreColor} transform={place(0, coreOffset)} />
          ) : null}

          {exists(CORE) && glinting ? (
            <path
              d={WORDMARK}
              fill="url(#hadrian-sting-glint)"
              transform={place(0, coreOffset)}
            />
          ) : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default HadrianLogoSting;
