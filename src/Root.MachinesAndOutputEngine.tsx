import {Composition} from 'remotion';
import MachinesAndOutputEngine, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/MachinesAndOutputEngine';

// Private render entry for MachinesAndOutputEngine (kyle-london; Dwarkesh map style): cut 10's machine pulls back to stand on England's output line at 1781, the line turns orange and climbs to 1900.
// Opaque 1080x1920, 29.97 fps, 336 frames.
export const RemotionRoot = () => (
  <Composition
    id="MachinesAndOutputEngine"
    component={MachinesAndOutputEngine}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
