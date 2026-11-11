import {Composition} from 'remotion';
import AroundTheSameModel, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/AroundTheSameModel';

// Private render entry for AroundTheSameModel (wip-biblical; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 96 frames.
export const RemotionRoot = () => (
  <Composition
    id="AroundTheSameModel"
    component={AroundTheSameModel}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
