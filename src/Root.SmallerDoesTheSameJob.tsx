import {Composition} from 'remotion';
import SmallerDoesTheSameJob, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/SmallerDoesTheSameJob';

// Private render entry for SmallerDoesTheSameJob (rsi-ten-earths; Dwarkesh 3D style): a small Genius walks out of one rack and ticks a problem sheet; the camera pulls back to a 3x giant Genius and 9 racks beside an identical ticked sheet (2026 vs 2025).
// Opaque 1080x1920, 23.976 fps, 152 frames.
export const RemotionRoot = () => (
  <Composition
    id="SmallerDoesTheSameJob"
    component={SmallerDoesTheSameJob}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
