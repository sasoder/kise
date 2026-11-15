import {Composition} from 'remotion';
import PlanetsOfGeniuses, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/PlanetsOfGeniuses';

// Private render entry for PlanetsOfGeniuses (rsi-ten-earths; Dwarkesh 3D style): orange Earths rise out of the data-center roof one after another and hang over it in two depths.
// Opaque 1080x1920, 23.976 fps, 123 frames.
export const RemotionRoot = () => (
  <Composition
    id="PlanetsOfGeniuses"
    component={PlanetsOfGeniuses}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
