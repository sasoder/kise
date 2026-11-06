import {Composition} from 'remotion';
import OldStoriesRemixed, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-entertainment/OldStoriesRemixed';

// Private render entry for OldStoriesRemixed (wip-entertainment; Works in Progress style): Homer, the Grimms and Shakespeare pasted over older sources.
// Opaque 1080x1920, 24 fps, 116 frames.
export const RemotionRoot = () => (
  <Composition
    id="OldStoriesRemixed"
    component={OldStoriesRemixed}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
