import {Composition} from 'remotion';
import FrontierCostClimbs, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/FrontierCostClimbs';

// Private render entry for FrontierCostClimbs (sam-gigawatt-cost; Cheeky Pint style (stout)): the newest frontier models' training-cost columns rise in a wave while the camera pulls back to the whole recent climb.
// Opaque 1080x1920, 23.976 fps, 37 frames.
export const RemotionRoot = () => (
  <Composition
    id="FrontierCostClimbs"
    component={FrontierCostClimbs}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
