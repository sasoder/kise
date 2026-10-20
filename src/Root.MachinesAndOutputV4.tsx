import {Composition} from 'remotion';
import MachinesAndOutputV4, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/MachinesAndOutputV4';

// Private render entry for MachinesAndOutputV4 (kyle-london; Dwarkesh map style): V4 of cut 42 (V3 picture, V2-style camera): Newton at his reflector at 1687, a crew working a Watt engine at 1781, England's output climbing to 1900 (delivered as _V4).
// Opaque 1080x1920, 29.97 fps, 336 frames.
export const RemotionRoot = () => (
  <Composition
    id="MachinesAndOutputV4"
    component={MachinesAndOutputV4}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
