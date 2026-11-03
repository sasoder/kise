// Check: Cancan's name, role and company stay readable over the bright allO interview.
// Spoken identity: Cancan Liu, CEO & Co-founder, allO. Text unchanged from the approved tag.
// Timing: name/backing f1; role f4; company f6. Name tint settles at f27.
// Duration: 150 frames / 24 fps = 6.25 seconds; the editor trims the static hold.
// Reuse the Stripe L3 name and entry. The role/company use identical type and geometry,
// now fully opaque. A 65% black plate follows the name's entrance without an exit.
// Customer requested added contrast on 2026-10-29; native Premiere Motion stays untouched.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import NameTagStripe from '../kits/name-tags/NameTagStripe';

export const FPS = 24;
export const DURATION = 150;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lines = [
  {text: 'CEO & Co-founder', line: 1, start: 4},
  {text: 'allO', line: 2, start: 6},
];

const CancanLegible: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 439,
          top: 1142,
          width: 538,
          height: 247,
          borderRadius: 10,
          backgroundColor: '#000000',
          opacity: 0.65 * interpolate(frame, [1, 7], [0, 1], CLAMP),
          transform: `translateY(${interpolate(frame, [1, 21], [22, 0], {...CLAMP, easing: EASE})}px)`,
        }}
      />
      <NameTagStripe name="Cancan Liu" job="" company="" align="right" />
      {lines.map(({text, line, start}) => (
        <div
          key={line}
          style={{
            position: 'absolute',
            right: 127,
            textAlign: 'right',
            top: 1215 + line * 72 - 60 * 0.98,
            fontFamily: 'StripeTagSohneBuch',
            fontSize: 60,
            lineHeight: 1,
            paddingBottom: 60 * 0.3,
            whiteSpace: 'nowrap',
            color: '#FFFFFF',
            opacity: interpolate(frame, [start, start + 6], [0, 1], CLAMP),
            transform: `translateY(${interpolate(frame, [start, start + 20], [22, 0], {...CLAMP, easing: EASE})}px)`,
          }}
        >
          {text}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export default CancanLegible;
