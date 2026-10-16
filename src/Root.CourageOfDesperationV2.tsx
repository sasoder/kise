import {Composition} from 'remotion';
import CourageOfDesperationV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-death-ground/CourageOfDesperationV2';

// Private render entry for CourageOfDesperationV2 (sarah-death-ground; Dwarkesh map style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 104 frames.
export const RemotionRoot = () => (
  <Composition
    id="CourageOfDesperationV2"
    component={CourageOfDesperationV2}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
