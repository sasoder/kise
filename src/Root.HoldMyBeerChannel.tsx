import {Composition} from 'remotion';
import HoldMyBeerChannel, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-hold-my-beer/HoldMyBeerChannel';
import {PROBE_DURATION, SlackProbe} from '../generated/components/sam-hold-my-beer/slackProbe';

// Private render entry for HoldMyBeerChannel (sam-hold-my-beer; Cheeky Pint style (stout)): a real Slack window on the
// board, one push-in onto the redacted channel, a click, and the name un-blurs to #astra-hold-my-beer.
// Opaque 1080x1920, 23.976 fps, 85 frames. SlackProbe: a still of the shared Slack world (slackShared.tsx).
export const RemotionRoot = () => (
  <>
    <Composition
      id="HoldMyBeerChannel"
      component={HoldMyBeerChannel}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition id="SlackProbe" component={SlackProbe} durationInFrames={PROBE_DURATION} fps={FPS} width={1080} height={1920} />
  </>
);
