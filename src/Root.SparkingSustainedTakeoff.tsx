import {Composition} from 'remotion';
import SparkingSustainedTakeoff, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-greek-math/SparkingSustainedTakeoff';

// Private render entry for SparkingSustainedTakeoff (kyle-greek-math; Dwarkesh 3D style): a Greek geometer's glowing line in the sand runs on and lifts into a dashed takeoff curve.
// Opaque 1080x1920, 29.97 fps, 243 frames.
export const RemotionRoot = () => (
  <Composition
    id="SparkingSustainedTakeoff"
    component={SparkingSustainedTakeoff}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
