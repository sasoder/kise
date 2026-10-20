import {Composition} from 'remotion';
import CloseToNewtonMedallions, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/CloseToNewtonMedallions';

// Private render entry for CloseToNewtonMedallions (kyle-london; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 148 frames.
export const RemotionRoot = () => (
  <Composition
    id="CloseToNewtonMedallions"
    component={CloseToNewtonMedallions}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
