import {Composition} from 'remotion';
import NotTotallyWrong, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-aircraft-order/NotTotallyWrong';

// Private render entry for NotTotallyWrong (scott-aircraft-order; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 89 frames.
export const RemotionRoot = () => (
  <Composition
    id="NotTotallyWrong"
    component={NotTotallyWrong}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
