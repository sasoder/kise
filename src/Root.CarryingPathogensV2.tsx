import {Composition} from 'remotion';
import CarryingPathogensV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/CarryingPathogensV2';

// Private render entry for CarryingPathogensV2 (kyle-first-farmers; Dwarkesh map style): the farmers march into Europe,
// their germs run ahead and kill the foragers in their path; one dive to a camp in the Iron Gates where they fall.
// Opaque 1080x1920, 29.97 fps, 448 frames.
export const RemotionRoot = () => (
  <Composition
    id="CarryingPathogensV2"
    component={CarryingPathogensV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
