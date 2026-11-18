import {Composition} from 'remotion';
import RulesSharedProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-write-rules/RulesSharedProbe';

// Private render entry for RulesSharedProbe (toto-write-rules; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 25 fps, 1 frames.
export const RemotionRoot = () => (
  <Composition
    id="RulesSharedProbe"
    component={RulesSharedProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
