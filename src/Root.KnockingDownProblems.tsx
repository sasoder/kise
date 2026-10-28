import {Composition} from 'remotion';
import KnockingDownProblems, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-hold-my-beer/KnockingDownProblems';

// Private render entry for KnockingDownProblems (sam-hold-my-beer; Cheeky Pint style (stout)): a Slack feed of hard problems from many fields; the model's amber solves land one after another.
// Opaque 1080x1920, 23.976 fps, 94 frames.
export const RemotionRoot = () => (
  <Composition
    id="KnockingDownProblems"
    component={KnockingDownProblems}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
