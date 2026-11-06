import {Composition} from 'remotion';
import AudiHiredToRun, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/AudiHiredToRun';

// Private render entry for AudiHiredToRun (toto-twenty-person; Cheeky Pint style (stout)): a tall corporate chain builds over Audi's empty slots, hires from the group and from F1 step in on a salary + bonus.
// Opaque 1080x1920, 25 fps, 278 frames.
export const RemotionRoot = () => (
  <Composition
    id="AudiHiredToRun"
    component={AudiHiredToRun}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
