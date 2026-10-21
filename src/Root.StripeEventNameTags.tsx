import {Composition} from 'remotion';
import StripeEventNameTags, {DURATION, FPS, schema} from '../generated/components/stripe-money2020-henri-hillary/StripeEventNameTags';

export const RemotionRoot = () => (
  <>
    {(['henri', 'hillary', 'both'] as const).map((person) => (
      <Composition
        key={person}
        id={`StripeEventNameTags-${person}`}
        component={StripeEventNameTags}
        schema={schema}
        defaultProps={{person}}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    ))}
  </>
);
