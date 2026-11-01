import {Composition} from 'remotion';
import ComputerMakesIt, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-kids-mind-blown/ComputerMakesIt';

// Private render entry for ComputerMakesIt (sam-kids-mind-blown; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 100 frames.
export const RemotionRoot = () => (
  <Composition
    id="ComputerMakesIt"
    component={ComputerMakesIt}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
