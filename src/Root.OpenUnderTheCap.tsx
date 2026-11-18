import {Composition} from 'remotion';
import OpenUnderTheCap, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-write-rules/OpenUnderTheCap';

// Private render entry for OpenUnderTheCap (toto-write-rules; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 25 fps, 217 frames.
export const RemotionRoot = () => (
  <Composition
    id="OpenUnderTheCap"
    component={OpenUnderTheCap}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
