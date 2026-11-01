import {Composition} from 'remotion';
import OutOfHand, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-self-replicating/OutOfHand';

// Private render entry for OutOfHand (sam-self-replicating; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 89 frames.
export const RemotionRoot = () => (
  <Composition
    id="OutOfHand"
    component={OutOfHand}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
