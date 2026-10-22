import {Composition} from 'remotion';
import TwoHundredWideBodies, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-aircraft-order/TwoHundredWideBodies';

// Private render entry for TwoHundredWideBodies (scott-aircraft-order; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 81 frames.
export const RemotionRoot = () => (
  <Composition
    id="TwoHundredWideBodies"
    component={TwoHundredWideBodies}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
