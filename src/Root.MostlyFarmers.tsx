import {Composition} from 'remotion';
import MostlyFarmers, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/MostlyFarmers';

// Private render entry for MostlyFarmers (kyle-rome-industrial; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 138 frames.
export const RemotionRoot = () => (
  <Composition
    id="MostlyFarmers"
    component={MostlyFarmers}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
