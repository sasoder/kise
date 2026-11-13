import {Composition} from 'remotion';
import GtaMissionPassed, {DURATION, FPS, defaultProps, schema} from '../generated/components/pressbyran-gta/GtaMissionPassed';

// Private render entry for GtaMissionPassed (pressbyran-gta): open-world game HUD over the Pressbyrån GTA cut.
// Transparent overlay 1080x1920, 29.97 fps.
export const RemotionRoot = () => (
  <Composition
    id="GtaMissionPassed"
    component={GtaMissionPassed}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
