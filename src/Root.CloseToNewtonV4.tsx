import {Composition} from 'remotion';
import CloseToNewtonV4, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/CloseToNewtonV4';

// Private render entry for CloseToNewtonV4 (kyle-london; Dwarkesh map style): Pepys walks up to Newton, the circle gathers (cast V2).
// Opaque 1080x1920, 29.97 fps, 148 frames.
export const RemotionRoot = () => (
  <Composition
    id="CloseToNewtonV4"
    component={CloseToNewtonV4}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
