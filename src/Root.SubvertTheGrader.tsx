import {Composition} from 'remotion';
import SubvertTheGrader, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-hugging-face/SubvertTheGrader';

// Private render entry for SubvertTheGrader (paul-hugging-face, cut B, look C on the shared world): one robot scans the
// grader's insides, re-routes one connection, and orange runs through them into its gauge, swinging the needle from X
// to an orange check (a fake pass).
// Opaque 1080x1920, 23.976 fps, 106 frames.
export const RemotionRoot = () => (
  <Composition
    id="SubvertTheGrader"
    component={SubvertTheGrader}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
