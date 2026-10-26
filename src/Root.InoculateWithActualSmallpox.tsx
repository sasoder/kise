import {Composition} from 'remotion';
import InoculateWithActualSmallpox, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/InoculateWithActualSmallpox';

// Private render entry for InoculateWithActualSmallpox (kyle-vaccine; Dwarkesh 3D style): a folk inoculator takes smallpox matter from a sick man's pustule on her lancet and scratches it into a healthy child's arm.
// Opaque 1080x1920, 29.97 fps, 125 frames.
export const RemotionRoot = () => (
  <Composition
    id="InoculateWithActualSmallpox"
    component={InoculateWithActualSmallpox}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
