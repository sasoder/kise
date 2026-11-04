import {Composition} from 'remotion';
import FleetWaitsOnFuel, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-fuel/FleetWaitsOnFuel';

// Private render entry for FleetWaitsOnFuel (scott-nolan-fuel; Cheeky Pint style (stout)): a row of SMRs rises and ends in a gigawatt plant; the camera cranes down to one amber fuel pellet in front of the dimmed fleet.
// Opaque 1080x1920, 23.976 fps, 133 frames.
export const RemotionRoot = () => (
  <Composition
    id="FleetWaitsOnFuel"
    component={FleetWaitsOnFuel}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
