import {Composition} from 'remotion';
import LockThatDoor, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-covid/LockThatDoor';

// Private render entry for LockThatDoor (kyle-covid; Dwarkesh 3D style): a front door at night shuts and locks in the faces of the air's microbes; they swarm its lit gaps and the orange virion squeezes in under it.
// Opaque 1080x1920, 29.97 fps, 175 frames.
export const RemotionRoot = () => (
  <Composition
    id="LockThatDoor"
    component={LockThatDoor}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
