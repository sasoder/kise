import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

/**
 * OpenAI mark, upgraded.
 *
 * One event, built from two things only: the mark's own ink, and one band of
 * light travelling outward inside it. Nothing is drawn outside the ink — no
 * glow, no rim, no halo, no particles.
 *
 * Timeline (24fps, 96 frames):
 *   f0-20   rest    thin mark, perfectly still. Nothing moves.
 *   f20-40  charge  band sits on the ring of ink around the centre hexagon
 *                   (radius 2.9 -> 3.7) and comes up 0 -> 0.75 opacity with
 *                   Easing.in(Easing.quad). Light gathers in the core.
 *   f40-64  surge   band radius 3.7 -> 15.5, Easing.out(Easing.quad). The
 *                   leading edge crosses from the hexagon ring to the arm
 *                   tips (radius 12.2) in 11 frames, reaching them at f51.31;
 *                   the band's bright 0.45 midpoint clears the tips at f53.70
 *                   and its full 2.5 tail clears them at f57.75. The light
 *                   therefore travels all the way off the mark instead of
 *                   dimming in place. The thick-ink reveal rides 1.1 units
 *                   behind the leading edge (ending at 14.4, well past the
 *                   tips), so the mark is heavier only where the light has
 *                   already been.
 *   f58-63  fade    band opacity -> 0. By f58 the tail has essentially left
 *                   the ink, so the fade is only a safety, not the thing that
 *                   removes the light. The light leaves; the weight stays.
 *   f58-70  settle  whole svg 1 -> 1.02 -> 1, Easing.inOut(Easing.quad), peak
 *                   at f63. The only whole-mark motion in the piece.
 *   f70-96  hold    the heavier mark, still. Last frame is the after-state.
 */

export const FPS = 24;
export const DURATION = 96;

// The OpenAI mark from the Simple Icons set (`public/si-openai.svg`): one
// compound path in a 24x24 viewBox, centred on (12,12). Pasted rather than
// fetched so the reveal mask and the light mask can share the exact shape.
const D =
  'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

// All geometry in the mark's own 24-unit space.
const CX = 12;
const CY = 12;
// Measured off the rendered mark: there is no ink at all inside r = 2.55 — the
// centre hexagon is a hole — the ring around it inks r 2.6-3.9, and the outer
// tips end at r 12.2. So the charge lives on that ring rather than at radius 0,
// where it would have nothing to light up.
const CORE_R0 = 2.9; // charge starts just inside the hexagon ring
const CORE_R1 = 3.7; // and ends just outside it
// Where the leading edge ends at f64. Solved, not guessed: with
// Easing.out(Easing.quad) over f40-64, radius(f) = 3.7 + (EXIT_R - 3.7)*(1-(1-t)^2)
// for t = (f-40)/24, so the frame at which a given radius r clears the arm tips
// (12.2) is f = 40 + 24*(1 - sqrt(1 - (r - 3.7)/(EXIT_R - 3.7))).
// EXIT_R must clear the band's *whole* 2.5 tail past the tips, not just its
// leading edge: at 13.4 the tail was still lying across the outer lobes while
// the opacity fade took it down in place, which read as grey shading rather
// than as light leaving. At 15.5 over a 24-frame window the edge reaches the
// tips at f51.31, the bright 0.45 midpoint clears them at f53.70 and the full
// tail clears them at f57.75 — so the light is gone from the ink before the
// fade starts. The reveal still trails by REVEAL_LAG (1.1) and ends at 14.4,
// comfortably past 12.2, so the arm tips take the weight.
const EXIT_R = 15.5;
const BAND_TAIL = 2.5; // band width: long soft tail behind a crisp leading edge
const BAND_EDGE = 0.35; // how soft the leading edge is, in units
const REVEAL_SOFT = 0.15; // soft edge on the heavier-ink reveal
// How far behind the band's leading edge the heavier ink arrives. Trailing the
// band by its full tail (2.5) put the new weight in ink the light had already
// left, so it read as a soft shadow creeping round the lobes; at 1.1 the ink
// thickens under the bright part of the band, where the light hides the seam.
const REVEAL_LAG = 1.1;

const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

export const schema = z.object({
  ink: z.string(),
  surge: z.string(),
  markSize: z.number().min(120).max(1080),
  weightGain: z.number().min(0).max(2),
  liveliness: z.number().min(0).max(2),
  backdrop: z.string(),
});

export type OpenAiUpgradeSurgeProps = z.infer<typeof schema>;

export const defaultProps: OpenAiUpgradeSurgeProps = schema.parse({
  ink: '#000000',
  surge: '#FFFFFF',
  markSize: 720,
  // Extra stroke on the filled compound path, so the ink dilates evenly on both
  // sides. The mark's own ring is about 2 units thick, so 0.32 is roughly +15%.
  weightGain: 0.32,
  liveliness: 1,
  backdrop: 'transparent',
});

const OpenAiUpgradeSurge: React.FC<OpenAiUpgradeSurgeProps> = ({
  ink,
  surge,
  markSize,
  weightGain,
  liveliness,
  backdrop,
}) => {
  const frame = useCurrentFrame();

  // One radius drives everything: the light's leading edge. The charge eases
  // in (gathering), the release eases out (thrown, then decelerating).
  const bandOuter =
    frame < 40
      ? interpolate(frame, [20, 40], [CORE_R0, CORE_R1], {
          easing: Easing.in(Easing.quad),
          ...clamp,
        })
      : interpolate(frame, [40, 64], [CORE_R1, EXIT_R], {
          easing: Easing.out(Easing.quad),
          ...clamp,
        });

  const rise = interpolate(frame, [20, 40], [0, 0.75], {
    easing: Easing.in(Easing.quad),
    ...clamp,
  });
  const peak = interpolate(frame, [40, 48], [0.75, 0.9], clamp);
  const fade = interpolate(frame, [58, 63], [1, 0], clamp);
  const bandOpacity =
    Math.min(1, (frame < 40 ? rise : peak) * liveliness) * fade;

  // Gradient stops are placed in absolute units and converted, so the band
  // keeps its real width and edge softness at every radius.
  const gr = Math.max(bandOuter, 0.01);
  const sTail = Math.max(0, (gr - BAND_TAIL) / gr);
  const sMid = Math.max(sTail, (gr - BAND_TAIL * 0.45) / gr);
  const sEdge = Math.max(sMid, (gr - BAND_EDGE) / gr);

  // The heavier ink is revealed behind the band's trailing edge.
  const revealR = Math.max(0, bandOuter - REVEAL_LAG);
  const revealFrac = revealR / (revealR + REVEAL_SOFT);
  const revealOpacity = interpolate(revealR, [0, 0.4], [0, 1], clamp);

  // The settle: the mark takes the weight, once. Nothing else moves.
  const settle =
    frame < 63
      ? interpolate(frame, [58, 63], [0, 1], {
          easing: Easing.inOut(Easing.quad),
          ...clamp,
        })
      : interpolate(frame, [63, 70], [1, 0], {
          easing: Easing.inOut(Easing.quad),
          ...clamp,
        });
  const scale = 1 + settle * 0.02 * liveliness;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backdrop,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{width: markSize, height: markSize, scale: `${scale}`}}>
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <defs>
            {/* Soft-edged disc that follows the band's trailing edge. */}
            <radialGradient
              id="upgrade-reveal"
              gradientUnits="userSpaceOnUse"
              cx={CX}
              cy={CY}
              r={revealR + REVEAL_SOFT}
            >
              <stop offset={0} stopColor="#ffffff" />
              <stop offset={revealFrac} stopColor="#ffffff" />
              <stop offset={1} stopColor="#000000" />
            </radialGradient>
            <mask
              id="upgrade-reveal-mask"
              maskUnits="userSpaceOnUse"
              x={-2}
              y={-2}
              width={28}
              height={28}
            >
              <rect
                x={-2}
                y={-2}
                width={28}
                height={28}
                fill="url(#upgrade-reveal)"
                opacity={revealOpacity}
              />
            </mask>

            {/* The band itself: crisp leading edge, long tail inward. */}
            <radialGradient
              id="upgrade-band"
              gradientUnits="userSpaceOnUse"
              cx={CX}
              cy={CY}
              r={gr}
            >
              <stop offset={sTail} stopColor={surge} stopOpacity={0} />
              <stop offset={sMid} stopColor={surge} stopOpacity={0.45} />
              <stop offset={sEdge} stopColor={surge} stopOpacity={1} />
              <stop offset={1} stopColor={surge} stopOpacity={0} />
            </radialGradient>
            {/*
              The light lives in the *thin* mark, not the dilated one. Masking
              it with the dilated shape put light in the ring of ink the reveal
              had not reached yet, so it showed up as a bright outline sitting
              on bare backdrop — a halo. Clipped to the thin mark, the light is
              always over ink.
            */}
            <mask
              id="upgrade-ink-mask"
              maskUnits="userSpaceOnUse"
              x={-2}
              y={-2}
              width={28}
              height={28}
            >
              <path d={D} fill="#ffffff" />
            </mask>
          </defs>

          {/* 1. Before state: the thin mark, always present. */}
          <path d={D} fill={ink} />

          {/* 2. After state: the same mark dilated, revealed as the band passes. */}
          <g mask="url(#upgrade-reveal-mask)">
            <path
              d={D}
              fill={ink}
              stroke={ink}
              strokeWidth={weightGain}
              strokeLinejoin="round"
            />
          </g>

          {/* 3. The light, travelling through the ink like a tube. */}
          <g mask="url(#upgrade-ink-mask)" opacity={bandOpacity}>
            <circle cx={CX} cy={CY} r={20} fill="url(#upgrade-band)" />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default OpenAiUpgradeSurge;
