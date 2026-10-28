import {Composition} from 'remotion';
import SupplyWayUp, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/SupplyWayUp';

// Private render entry for SupplyWayUp (sam-gigawatt-cost; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 66 frames.
export const RemotionRoot = () => (
  <Composition
    id="SupplyWayUp"
    component={SupplyWayUp}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
