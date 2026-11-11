import {Composition} from 'remotion';
import WhichIsHarder, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-derpy-interns/WhichIsHarder';

// Private render entry for WhichIsHarder (rsi-derpy-interns; Dwarkesh style): Navier–Stokes and continual learning on a white balance that tips one way, then the other, and rocks undecided.
// Opaque 1080x1920, 23.976 fps, 44 frames.
export const RemotionRoot = () => (
  <Composition
    id="WhichIsHarder"
    component={WhichIsHarder}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
