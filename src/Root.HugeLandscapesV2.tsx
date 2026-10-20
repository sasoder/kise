import {Composition} from 'remotion';
import HugeLandscapesV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/HugeLandscapesV2';

// Private render entry for HugeLandscapesV2 (kyle-first-farmers; Dwarkesh map style): opens on cut D's last frame and pulls back over the wild: a forager band's trail closes into a huge range loop, then two identical squares compare the packed farmyard with an empty patch of forest.
// Opaque 1080x1920, 29.97 fps, 334 frames.
export const RemotionRoot = () => (
  <Composition
    id="HugeLandscapesV2"
    component={HugeLandscapesV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
