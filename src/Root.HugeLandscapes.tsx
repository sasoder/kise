import {Composition} from 'remotion';
import HugeLandscapes, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/HugeLandscapes';

// Private render entry for HugeLandscapes (kyle-first-farmers; Dwarkesh map style): opens on cut D's last frame and pulls back over the wild: a forager band's trail closes into a huge range loop, then two identical squares compare the packed farmyard with an empty patch of forest.
// Opaque 1080x1920, 29.97 fps, 334 frames.
export const RemotionRoot = () => (
  <Composition
    id="HugeLandscapes"
    component={HugeLandscapes}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
