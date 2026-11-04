import {Composition} from 'remotion';
import NothingButMoreHills, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-johnson-ranch/NothingButMoreHills';

// Private render entry for NothingButMoreHills (robert-johnson-ranch; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 233 frames.
export const RemotionRoot = () => (
  <Composition
    id="NothingButMoreHills"
    component={NothingButMoreHills}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
