import {Composition} from 'remotion';
import BothComingDown, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-orbit/BothComingDown';

// Private render entry for BothComingDown (scott-nolan-orbit; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 61 frames.
export const RemotionRoot = () => (
  <Composition
    id="BothComingDown"
    component={BothComingDown}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
