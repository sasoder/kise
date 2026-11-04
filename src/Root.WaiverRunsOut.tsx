import {Composition} from 'remotion';
import WaiverRunsOut, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-fuel/WaiverRunsOut';

// Private render entry for WaiverRunsOut (scott-nolan-fuel; Cheeky Pint style (stout)): one view across the Atlantic: a busy stream of amber fuel cylinders runs from St Petersburg to US reactors; on "that ends" the St Petersburg depot stops sending (its light goes out), the stream's tail runs in and the route drains empty; push in on the empty slot among the reactors.
// Opaque 1080x1920, 23.976 fps, 182 frames.
export const RemotionRoot = () => (
  <Composition
    id="WaiverRunsOut"
    component={WaiverRunsOut}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
