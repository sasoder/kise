import {Composition} from 'remotion';
import MachinesAndOutput, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/MachinesAndOutput';

// Private render entry for MachinesAndOutput (kyle-london; Dwarkesh map style): cut 10's machine pulls back to stand on England's output line at 1781, the line turns orange and climbs to 1900.
// Opaque 1080x1920, 29.97 fps, 336 frames.
export const RemotionRoot = () => (
  <Composition
    id="MachinesAndOutput"
    component={MachinesAndOutput}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
