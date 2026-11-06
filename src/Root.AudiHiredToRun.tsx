import {Composition} from 'remotion';
import AudiHiredToRun, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/AudiHiredToRun';

// Private render entry for AudiHiredToRun (toto-twenty-person; Cheeky Pint style (stout)): Audi's corporate tower builds over the empty principal spot, a hire from the group and one from F1 arrive, the F1 one takes the spot, and the pay (salary envelope, ribboned bonus, coins) appears.
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
