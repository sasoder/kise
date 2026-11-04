import {Composition} from 'remotion';
import WaiverRunsOut, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-fuel/WaiverRunsOut';

// Private render entry for WaiverRunsOut (scott-nolan-fuel; Cheeky Pint style (stout)): one view across the Atlantic: amber fuel cylinders run from St Petersburg to US reactors, a boom gate at the US coast drops on JAN 1 2028, the last two queue at the closed arm and the route back to Russia drains empty; push in on the empty slot among the reactors.
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
