import {Composition} from 'remotion';
import PrecociouslyFar, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/PrecociouslyFar';

// Private render entry for PrecociouslyFar (kyle-rome-industrial; Dwarkesh 3D style): a Roman grinding at a hand quern, a pan right past a dashed orange bridge that fades out to a steam flour mill.
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
