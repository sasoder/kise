import {Composition} from 'remotion';
import CarvedCrownAcross, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-old-buildings/CarvedCrownAcross';

// Private render entry for CarvedCrownAcross (robert-old-buildings; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 102 frames.
export const RemotionRoot = () => (
  <Composition
    id="CarvedCrownAcross"
    component={CarvedCrownAcross}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
