import {Composition} from 'remotion';
import ReadingLess, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-ya-boom/ReadingLess';

// Private render entry for ReadingLess (wip-ya-boom; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 117 frames.
export const RemotionRoot = () => (
  <Composition
    id="ReadingLess"
    component={ReadingLess}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
