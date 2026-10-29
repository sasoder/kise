import {Composition} from 'remotion';
import GoneUpToThisPoint, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-gigawatt-cost/GoneUpToThisPoint';

// Private render entry for GoneUpToThisPoint (sam-gigawatt-cost; Cheeky Pint style (stout)): rev 3, a line graph: cut 1's close on the recent climb pulls back to the whole 2020-2025 graph of 8 models with its axes and title.
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
