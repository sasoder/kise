import {Composition} from 'remotion';
import MachinesAndOutputV5, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/MachinesAndOutputV5';

// Private render entry for MachinesAndOutputV5 (kyle-london; Dwarkesh map style): V5 of cut 42 (the depth pass on V4): Newton at his reflector at 1687, a crew working a Watt engine at 1781, England's output climbing to 1900 (delivered as _V5).
// Opaque 1080x1920, 29.97 fps, 336 frames.
export const RemotionRoot = () => (
  <Composition
    id="MachinesAndOutputV5"
    component={MachinesAndOutputV5}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
