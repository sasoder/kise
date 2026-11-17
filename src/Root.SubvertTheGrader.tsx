import {Composition} from 'remotion';
import SubvertTheGrader, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-hugging-face/SubvertTheGrader';

// Private render entry for SubvertTheGrader (paul-hugging-face, cut B, look C on the shared world): robots study the grader,
// plug an orange thread into its insides and turn its stamp orange to tick a sheet it should have crossed out.
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
