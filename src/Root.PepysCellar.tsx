import {Composition} from 'remotion';
import PepysCellar, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-london/PepysCellar';

// Private render entry for PepysCellar (kyle-london; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 143 frames.
export const RemotionRoot = () => (
  <Composition
    id="PepysCellar"
    component={PepysCellar}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
