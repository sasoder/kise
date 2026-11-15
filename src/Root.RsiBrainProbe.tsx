import {Composition} from 'remotion';
import BrainProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/brainProbe';

// Private render entry for the brain probe (rsi-stupidest-species, W3 brainShared): probe sheets, not a cut.
export const RemotionRoot = () => (
  <Composition
    id="RsiBrainProbe"
    component={BrainProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
