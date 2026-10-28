import {Composition} from 'remotion';
import SmallNumberOfIdeasAway, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-macintosh-moment/SmallNumberOfIdeasAway';

// Private render entry for SmallNumberOfIdeasAway (sam-macintosh-moment; Cheeky Pint style (stout)): a time rule: Dots at TODAY -> three amber ideas -> the mainstream flag and its crowd.
// Opaque 1080x1920, 23.976 fps, 108 frames.
export const RemotionRoot = () => (
  <Composition
    id="SmallNumberOfIdeasAway"
    component={SmallNumberOfIdeasAway}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
