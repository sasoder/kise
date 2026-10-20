import {Composition} from 'remotion';
import CarryingPathogens, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/CarryingPathogens';

// Private render entry for CarryingPathogens (kyle-first-farmers; Dwarkesh map style): the farmers march into Europe,
// their germs run ahead and kill the foragers in their path; one dive to a camp in the Iron Gates where they fall.
// Opaque 1080x1920, 29.97 fps, 448 frames.
export const RemotionRoot = () => (
  <Composition
    id="CarryingPathogens"
    component={CarryingPathogens}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
