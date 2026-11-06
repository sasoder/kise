import {Composition} from 'remotion';
import ReportToSomeone, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/ReportToSomeone';

// Private render entry for ReportToSomeone (toto-twenty-person; Cheeky Pint style (stout)): the circle back: a bead runs up each principal's reporting line to the amber above him, then Audi's takes a decision alone, never sends it up the tower, and drops out of the picture.
// Opaque 1080x1920, 25 fps, 283 frames.
export const RemotionRoot = () => (
  <Composition
    id="ReportToSomeone"
    component={ReportToSomeone}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
