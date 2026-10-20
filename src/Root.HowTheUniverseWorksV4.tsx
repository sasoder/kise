import {Composition} from 'remotion';
import HowTheUniverseWorksV4, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/HowTheUniverseWorksV4';

// Private render entry for HowTheUniverseWorksV4 (kyle-london; Dwarkesh map style): close on a Fellow turning an orrery, one pan and pull-back along the floor to the sun-and-planet engine worked by a stoker and an engineer.
// Opaque 1080x1920, 29.97 fps, 204 frames.
export const RemotionRoot = () => (
  <Composition
    id="HowTheUniverseWorksV4"
    component={HowTheUniverseWorksV4}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
