import {Composition} from 'remotion';
import StoreThatInformation, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/StoreThatInformation';

// Private render entry for StoreThatInformation (kyle-vaccine; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 131 frames.
export const RemotionRoot = () => (
  <Composition
    id="StoreThatInformation"
    component={StoreThatInformation}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
