import {Composition} from 'remotion';
import WorkOfBillions, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/WorkOfBillions';

// Private render entry for WorkOfBillions (rsi-ten-earths; Dwarkesh 3D style): one Genius typing at his desk, the camera pulls back and rises over an office floor of AI workers to the horizon; plates 2030 and 2.5 billion.
// Opaque 1080x1920, 23.976 fps, 149 frames.
export const RemotionRoot = () => (
  <Composition
    id="WorkOfBillions"
    component={WorkOfBillions}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
