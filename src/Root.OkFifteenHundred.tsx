import {Composition} from 'remotion';
import OkFifteenHundred, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-lbj-money/OkFifteenHundred';

// Private render entry for OkFifteenHundred (robert-lbj-money; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 115 frames.
export const RemotionRoot = () => (
  <Composition
    id="OkFifteenHundred"
    component={OkFifteenHundred}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
