import {Composition} from 'remotion';
import AroundTheSameModel, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/AroundTheSameModel';

// Private render entry for AroundTheSameModel (wip-biblical; Works in Progress style): one person on a phone, pulled back to a ring round the OpenAI mark and a crowd of dots, every red thread running to it.
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
