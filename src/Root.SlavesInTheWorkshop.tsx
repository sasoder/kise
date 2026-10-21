import {Composition} from 'remotion';
import SlavesInTheWorkshop, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-slavery/SlavesInTheWorkshop';

// Private render entry for SlavesInTheWorkshop (kyle-rome-slavery; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 143 frames.
export const RemotionRoot = () => (
  <Composition
    id="SlavesInTheWorkshop"
    component={SlavesInTheWorkshop}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
