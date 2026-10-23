import {Composition} from 'remotion';
import LowOrbitLink, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-free-wifi/LowOrbitLink';

// Private render entry for LowOrbitLink (scott-free-wifi; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 53 frames.
export const RemotionRoot = () => (
  <Composition
    id="LowOrbitLink"
    component={LowOrbitLink}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
