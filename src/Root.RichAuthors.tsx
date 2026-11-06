import {Composition} from 'remotion';
import RichAuthors, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-ya-boom/RichAuthors';

// Private render entry for RichAuthors (wip-ya-boom; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 217 frames.
export const RemotionRoot = () => (
  <Composition
    id="RichAuthors"
    component={RichAuthors}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
