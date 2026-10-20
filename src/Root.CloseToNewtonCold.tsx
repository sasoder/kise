import {Composition} from 'remotion';
import CloseToNewtonCold, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/CloseToNewtonCold';

// Private render entry for CloseToNewtonCold (kyle-london; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 148 frames.
export const RemotionRoot = () => (
  <Composition
    id="CloseToNewtonCold"
    component={CloseToNewtonCold}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
