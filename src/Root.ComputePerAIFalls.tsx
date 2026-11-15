import {Composition} from 'remotion';
import ComputePerAIFalls, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/ComputePerAIFalls';

// Private render entry for ComputePerAIFalls (rsi-ten-earths; Dwarkesh 3D style): one Genius before a block of 27 lit racks; as the plate steps 2023 -> 2026 the racks go dark 27 -> 9 -> 3 -> 1, his floor threads retracting.
// Opaque 1080x1920, 23.976 fps, 142 frames.
export const RemotionRoot = () => (
  <Composition
    id="ComputePerAIFalls"
    component={ComputePerAIFalls}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
