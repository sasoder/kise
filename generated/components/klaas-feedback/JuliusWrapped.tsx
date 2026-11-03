// Check: Julius's exact role stays readable beside Cancan without changing Tom's native Motion.
// Spoken introduction: Julius Danek. Role supplied by Tom: Global Head of Expansion, Stripe.
// Timing: name f1, role (both wrapped lines) f4, company f6; settled by f27.
// Duration: 150 frames / 24 fps = 6.25 seconds; the native edit trims the static hold.
// Reuse the original Stripe name layer, font, baseline, and entrance unchanged.
// Only the role wraps; the company follows at the next 72px line pitch.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import NameTagStripe from '../kits/name-tags/NameTagStripe';

export const FPS = 24;
export const DURATION = 150;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const lines = [
  {text: 'Global Head of', line: 1, start: 4},
  {text: 'Expansion', line: 2, start: 4},
  {text: 'Stripe', line: 3, start: 6},
];

const JuliusWrapped: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <NameTagStripe name="Julius Danek" job="" company="" align="left" />
      {lines.map(({text, line, start}) => (
        <div
          key={line}
          style={{
            position: 'absolute',
            left: 127,
            top: 1215 + line * 72 - 60 * 0.98,
            fontFamily: 'StripeTagSohneBuch',
            fontSize: 60,
            lineHeight: 1,
            paddingBottom: 60 * 0.3,
            whiteSpace: 'nowrap',
            color: '#FFFFFF',
            opacity: 0.72 * interpolate(frame, [start, start + 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            transform: `translateY(${interpolate(frame, [start, start + 20], [22, 0], {
              easing: EASE,
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}px)`,
          }}
        >
          {text}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export default JuliusWrapped;
