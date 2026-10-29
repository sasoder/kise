import {Composition} from 'remotion';
import ThisSmall, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/ThisSmall';

// Private render entry for ThisSmall (sarah-gulf-war; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 84 frames.
export const RemotionRoot = () => (
  <Composition
    id="ThisSmall"
    component={ThisSmall}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
