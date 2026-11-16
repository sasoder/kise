import {Composition} from 'remotion';
import RisingTide, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-detecting-bullshit/RisingTide';

// Private render entry for RisingTide (nik-detecting-bullshit; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 90 frames.
export const RemotionRoot = () => (
  <Composition
    id="RisingTide"
    component={RisingTide}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
