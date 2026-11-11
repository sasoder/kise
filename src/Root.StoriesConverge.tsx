import {Composition} from 'remotion';
import StoriesConverge, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/StoriesConverge';

// Private render entry for StoriesConverge (wip-biblical; Works in Progress style): five typed pages, each inked by the AI thread, slide into one identical pile.
// Opaque 1080x1920, 24 fps, 121 frames.
export const RemotionRoot = () => (
  <Composition
    id="StoriesConverge"
    component={StoriesConverge}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
