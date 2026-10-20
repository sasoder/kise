import {Composition} from 'remotion';
import CloseToNewton, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/CloseToNewton';

// Private render entry for CloseToNewton (kyle-london; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 148 frames.
export const RemotionRoot = () => (
  <Composition
    id="CloseToNewton"
    component={CloseToNewton}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
