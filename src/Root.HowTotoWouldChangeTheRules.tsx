import {Composition} from 'remotion';
import HowTotoWouldChangeTheRules, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-write-rules/HowTotoWouldChangeTheRules';

// Private render entry for HowTotoWouldChangeTheRules (toto-write-rules; Cheeky Pint style (stout)): the clip title card, "How Toto would" / "change the F1 rules" as the name-tag strips title (TitleCardCheekyPint, as in toto-mercedes-job).
// Transparent overlay 1080x1920, 25 fps, 51 frames.
export const RemotionRoot = () => (
  <Composition
    id="HowTotoWouldChangeTheRules"
    component={HowTotoWouldChangeTheRules}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
