import {Composition} from 'remotion';
import HydraDozenHeads, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/HydraDozenHeads';

// Private render entry for HydraDozenHeads (caro-firing-moses; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 63 frames.
export const RemotionRoot = () => (
  <Composition
    id="HydraDozenHeads"
    component={HydraDozenHeads}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
