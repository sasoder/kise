import {Composition} from 'remotion';
import FiftyBillion, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/FiftyBillion';

// Private render entry for FiftyBillion (sarah-gulf-war; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 127 frames.
export const RemotionRoot = () => (
  <Composition
    id="FiftyBillion"
    component={FiftyBillion}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
