import {Composition} from 'remotion';
import NetflixFactor, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-female-fans/NetflixFactor';

// Private render entry for NetflixFactor (toto-female-fans; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 25 fps, 65 frames.
export const RemotionRoot = () => (
  <Composition
    id="NetflixFactor"
    component={NetflixFactor}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
