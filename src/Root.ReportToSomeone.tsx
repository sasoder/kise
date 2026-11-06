import {Composition} from 'remotion';
import ReportToSomeone, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/ReportToSomeone';

// Private render entry for ReportToSomeone (toto-twenty-person; Cheeky Pint style (stout)): the circle back: all three principals report up their rules, then Audi's decides alone and sinks out of his slot.
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
