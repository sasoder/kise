import {Composition} from 'remotion';
import PrecociouslyFar, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/PrecociouslyFar';

// Private render entry for PrecociouslyFar (kyle-rome-industrial; Dwarkesh 3D style): from beside two Romans at the plateau edge, a dashed orange ramp climbs into nothing as the camera cranes back to cut 4's road of history.
// Opaque 1080x1920, 29.97 fps, 220 frames.
export const RemotionRoot = () => (
  <Composition
    id="PrecociouslyFar"
    component={PrecociouslyFar}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
