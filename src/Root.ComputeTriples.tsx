import {Composition} from 'remotion';
import ComputeTriples, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/ComputeTriples';

// Private render entry for ComputeTriples (rsi-ten-earths; Dwarkesh 3D style): one rack pulls back to 243 as the racks triple five times, the year plate 2021 -> 2026 on the floor.
// Opaque 1080x1920, 23.976 fps, 119 frames.
export const RemotionRoot = () => (
  <Composition
    id="ComputeTriples"
    component={ComputeTriples}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
