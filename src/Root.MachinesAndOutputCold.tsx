import {Composition} from 'remotion';
import MachinesAndOutputCold, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/MachinesAndOutputCold';

// Private render entry for MachinesAndOutputCold (kyle-london; Dwarkesh map style): cold-review pass of cut 42 V2: Newton at his reflector at 1687, a crew working a Watt engine at 1781, England's output climbing to 1900 (delivered as _V3).
// Opaque 1080x1920, 29.97 fps, 336 frames.
export const RemotionRoot = () => (
  <Composition
    id="MachinesAndOutputCold"
    component={MachinesAndOutputCold}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
