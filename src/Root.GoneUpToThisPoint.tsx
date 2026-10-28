import {Composition} from 'remotion';
import GoneUpToThisPoint, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/GoneUpToThisPoint';

// Private render entry for GoneUpToThisPoint (sam-gigawatt-cost; Cheeky Pint style (stout)): cut 1's close on the recent climb pulls back to the whole 2012-2025 row of training-cost columns: a flat decade, then the shoot-up.
// Opaque 1080x1920, 23.976 fps, 34 frames.
export const RemotionRoot = () => (
  <Composition
    id="GoneUpToThisPoint"
    component={GoneUpToThisPoint}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
