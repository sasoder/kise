import {Composition} from 'remotion';
import SmallPotatoes, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/SmallPotatoes';

// Private render entry for SmallPotatoes (sarah-gulf-war; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 87 frames.
export const RemotionRoot = () => (
  <Composition
    id="SmallPotatoes"
    component={SmallPotatoes}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
