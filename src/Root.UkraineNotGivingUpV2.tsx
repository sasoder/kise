import {Composition} from 'remotion';
import UkraineNotGivingUpV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-death-ground/UkraineNotGivingUpV2';

// Private render entry for UkraineNotGivingUpV2 (sarah-death-ground; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 212 frames.
export const RemotionRoot = () => (
  <Composition
    id="UkraineNotGivingUpV2"
    component={UkraineNotGivingUpV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
