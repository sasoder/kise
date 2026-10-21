import {Composition} from 'remotion';
import MuscleOrMachine, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-slavery/MuscleOrMachine';

// Private render entry for MuscleOrMachine (kyle-rome-slavery; Dwarkesh map style): slaves pushing a Roman mill round, one pan right to a steam engine turning a row of millstones.
// Opaque 1080x1920, 29.97 fps, 147 frames.
export const RemotionRoot = () => (
  <Composition
    id="MuscleOrMachine"
    component={MuscleOrMachine}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
