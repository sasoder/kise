import {Composition} from 'remotion';
import FortyTwoPercent, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-female-fans/FortyTwoPercent';

// Private render entry for FortyTwoPercent (toto-female-fans; Cheeky Pint style (stout)): a pie chart on the stout board: the amber 42% slice sweeps open with its odometer and lifts out as FEMALE FANS.
// Opaque 1080x1920, 25 fps, 65 frames.
export const RemotionRoot = () => (
  <Composition
    id="FortyTwoPercent"
    component={FortyTwoPercent}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
