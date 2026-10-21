/**
 * Check: identify the two speakers and their roles at a glance, side by side.
 * Spoken line: "Thank you so much for being here, Hillary."
 * Word -> frame: opening introduction f0; names f1; roles f4; companies f6.
 * Duration: first edited shot is 109 frames at 254016000000 / 10164856666 fps;
 * render 110 frames for one static end handle. Both overlays occupy f0..108.
 * The existing Stripe L3 lines rise/fade with the original colour sweep, then
 * hold still. The two tags share a baseline; Henri aligns left, Hillary right.
 * The template is scaled only to fit the requested two-person row.
 * Name/role source: Money20/20, One Stack, Two Rails, 20 October 2026:
 * https://us.money2020.com/agenda/agenda/one-stack-two-rails-how-fintechs-are-building-for-scale-with-stablecoins-e103-76978
 * Henri: Head of Stripe Crypto. Hillary: staff product manager, Robinhood.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {z} from 'zod';
import NameTagStripe from '../kits/name-tags/NameTagStripe';

export const FPS = 254016000000 / 10164856666;
export const DURATION = 110;
export const schema = z.object({person: z.enum(['henri', 'hillary', 'both'])});
export const defaultProps = schema.parse({person: 'both'});

const SCALE = 0.72;
const BASELINE = 1240;
const PEOPLE = [
  {key: 'henri', name: 'Henri Stern', job: 'Head of crypto', company: 'Stripe', align: 'left' as const, fromX: 127, toX: 90},
  {key: 'hillary', name: 'Hillary Skeffington', job: 'Staff product manager', company: 'Robinhood', align: 'right' as const, fromX: 953, toX: 990},
];

const StripeEventNameTags: React.FC<z.infer<typeof schema>> = ({person}) => (
  <AbsoluteFill>
    {PEOPLE.filter((p) => person === 'both' || p.key === person).map((p) => (
      <AbsoluteFill
        key={p.key}
        style={{
          transformOrigin: '0 0',
          transform: `translate(${p.toX - SCALE * p.fromX}px, ${BASELINE - SCALE * 1215}px) scale(${SCALE})`,
        }}
      >
        <NameTagStripe name={p.name} job={p.job} company={p.company} align={p.align}/>
      </AbsoluteFill>
    ))}
  </AbsoluteFill>
);

export default StripeEventNameTags;
