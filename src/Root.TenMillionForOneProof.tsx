import {Composition} from 'remotion';
import TenMillionForOneProof, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-navier-stokes/TenMillionForOneProof';

// Private render entry for TenMillionForOneProof (sam-navier-stokes; Cheeky Pint style (stout), air look): amber climbs the Navier-Stokes vortex to a ~$10M tick.
// Opaque 1080x1920, 23.976 fps, 110 frames.
export const RemotionRoot = () => (
  <Composition
    id="TenMillionForOneProof"
    component={TenMillionForOneProof}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
