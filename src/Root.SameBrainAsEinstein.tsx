import {Composition} from 'remotion';
import SameBrainAsEinstein, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/SameBrainAsEinstein';

// Private render entry for SameBrainAsEinstein (rsi-stupidest-species; Dwarkesh 3D style): Me and Einstein, same brains, and only Einstein gathers two branches into one orange stem (E = mc²).
// Opaque 1080x1920, 23.976 fps, 178 frames.
export const RemotionRoot = () => (
  <Composition
    id="SameBrainAsEinstein"
    component={SameBrainAsEinstein}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
