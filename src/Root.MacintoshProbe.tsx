import {Composition} from 'remotion';
import MacintoshProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-macintosh-moment/MacintoshProbe';

// Private render entry for the sam-macintosh-moment shared world's probe still (MacintoshProbe). Opaque 1080x1920.
export const RemotionRoot = () => (
  <Composition
    id="MacintoshProbe"
    component={MacintoshProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
