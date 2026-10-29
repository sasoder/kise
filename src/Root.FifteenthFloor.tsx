import {Composition} from 'remotion';
import FifteenthFloor, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-old-buildings/FifteenthFloor';

// Private render entry for FifteenthFloor (robert-old-buildings; Dwarkesh 3D style): one crane-up his apartment house to his lit 15th-floor window.
// Opaque 1080x1920, 23.976 fps, 106 frames.
export const RemotionRoot = () => (
  <Composition
    id="FifteenthFloor"
    component={FifteenthFloor}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
