import {Composition} from 'remotion';
import KidsDieOfSmallpox, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/KidsDieOfSmallpox';

// Private render entry for KidsDieOfSmallpox (kyle-vaccine; Dwarkesh 3D style): ten children on a school bench, smallpox takes two.
// Opaque 1080x1920, 29.97 fps, 136 frames.
export const RemotionRoot = () => (
  <Composition
    id="KidsDieOfSmallpox"
    component={KidsDieOfSmallpox}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
