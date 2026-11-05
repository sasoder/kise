/**
 * Check: identify the guest as Sam Gerstenzang, Cofounder of Boulton & Watt.
 * Source: original Platform Summit Fireside Chat introduction; title spelling
 * verified against https://www.linkedin.com/in/samgerstenzang and the guest's
 * own https://samgerstenzang.substack.com/about profile.
 * Spoken line: "Our broad approach is like we go looking for risk."
 * Timing: appears on the first Sam frame (0); leaves at the reaction cut (279).
 * DURATION = 4.65465 s * (60000 / 1001) = 279 frames.
 * Canonical Stripe L3 reused unchanged, translated for 1080-square: left80,
 * name/job/company baselines820/892/964. No panel, camera, captions or exit.
 * Freeze remaps the 30fps kit clock continuously to preserve the 0.9s entrance.
 */
import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import NameTagStripe, {schema} from '../kits/name-tags/NameTagStripe';

export {schema};
export const FPS = 60000 / 1001;
export const DURATION = 279;
export const defaultProps = schema.parse({
  name: 'Sam Gerstenzang',
  job: 'Cofounder',
  company: 'Boulton & Watt',
  align: 'left',
});

const SamStripeSquare: React.FC<z.infer<typeof schema>> = (props) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{width: 1080, height: 1920, transform: 'translate(-47px, -395px)'}}>
        <Freeze frame={frame * 30 / FPS}>
          <NameTagStripe {...props} />
        </Freeze>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SamStripeSquare;
