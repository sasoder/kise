import {Composition} from 'remotion';
import SingleSubject, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-taylor-swift/SingleSubject';

// Private render entry for SingleSubject (wip-taylor-swift; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 105 frames.
export const RemotionRoot = () => (
  <Composition
    id="SingleSubject"
    component={SingleSubject}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
