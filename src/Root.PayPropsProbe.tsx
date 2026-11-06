import {Composition} from 'remotion';
import PayPropsProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/PayPropsProbe';

// Private render entry for PayPropsProbe (toto-twenty-person; Cheeky Pint style (stout)): stills of cut 20's SALARY and BONUS props. Probe only.
// Opaque 1080x1920, 25 fps, 1 frame.
export const RemotionRoot = () => (
  <Composition
    id="PayPropsProbe"
    component={PayPropsProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
