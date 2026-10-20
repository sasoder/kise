import {Composition} from 'remotion';
import CloseToNewtonV5, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/CloseToNewtonV5';

// Private render entry for CloseToNewtonV5 (kyle-london; Dwarkesh map style): Pepys walks up to Newton, the circle gathers on the boards (cast V2, the depth pass).
// Opaque 1080x1920, 29.97 fps, 148 frames.
export const RemotionRoot = () => (
  <Composition
    id="CloseToNewtonV5"
    component={CloseToNewtonV5}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
