import {Composition} from 'remotion';
import SecondOnlyToTheCowboys, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-worth-twelve/SecondOnlyToTheCowboys';

// Private render entry for SecondOnlyToTheCowboys (toto-worth-twelve; Cheeky Pint style (stout)): the Cowboys profit tower, then Mercedes amber at half its height, then the world row rising lower.
// Opaque 1080x1920, 25 fps, 114 frames.
export const RemotionRoot = () => (
  <Composition
    id="SecondOnlyToTheCowboys"
    component={SecondOnlyToTheCowboys}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
