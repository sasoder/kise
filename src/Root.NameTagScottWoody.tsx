import {Composition} from 'remotion';
import NameTagStripe, {schema} from '../generated/components/kits/name-tags/NameTagStripe';

// Confirmed by Tom: Scott Woody / CEO and Founder / Metronome.
// 5 seconds at the source sequence's 25 fps; the existing Stripe L3 entrance and hold.
export const RemotionRoot = () => (
  <Composition
    id="NameTagStripe-ScottWoody"
    component={NameTagStripe}
    schema={schema}
    defaultProps={{name: 'Scott Woody', job: 'CEO and Founder', company: 'Metronome', align: 'left'}}
    durationInFrames={125}
    fps={25}
    width={1080}
    height={1920}
  />
);
