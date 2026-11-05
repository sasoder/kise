import {Composition} from 'remotion';
import CallUpAnyone, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-graft-machine/CallUpAnyone';

// Private render entry for CallUpAnyone (robert-graft-machine; the show's own Moses pictogram, continued 9:16): his beneficiaries phone the borough president, then the governor.
// Opaque 1080x1920, 24 fps, 227 frames.
export const RemotionRoot = () => (
  <Composition
    id="CallUpAnyone"
    component={CallUpAnyone}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
